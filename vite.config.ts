import pagesPlugin from '@hono/vite-cloudflare-pages';
import ssg from '@hono/vite-ssg';
import mdx from '@mdx-js/rollup';
import honox from 'honox/vite';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypePrettyCode from 'rehype-pretty-code';
import clientBuild from 'honox/vite/client';
import { defineConfig } from 'vite';

const entry = './app/server.ts';

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [clientBuild()],
      build: {
        rollupOptions: {
          input: ['./app/style.css'],
          output: {
            assetFileNames: 'static/assets/[name].[ext]',
            // Optimize chunk splitting for better caching
            manualChunks: {
              vendor: ['hono', 'honox'],
              utils: [
                './app/utils/hashtags.ts',
                './app/utils/filtering.ts',
                './app/utils/navigation.ts',
              ],
            },
          },
        },
        // Enable minification and tree shaking
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
            drop_debugger: true,
          },
        },
      },
    };
  } else {
    return {
      plugins: [
        honox({
          devServer: {
            entry,
            plugins: [
              pagesPlugin({
                d1Databases: ['DB'],
                d1Persist: './.wrangler/state/v3/d1',
              }),
            ],
          },
        }),
        ssg({
          entry,
          minify: false, // Disable minification to prevent HTML structure issues
        }),
        mdx({
          jsxImportSource: 'hono/jsx',
          remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
          rehypePlugins: [rehypePrettyCode],
        }),
      ],
      build: {
        // Server-side optimizations
        minify: 'terser',
        rollupOptions: {
          input: entry,
          output: {
            // Optimize server bundle
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                return 'vendor';
              }
              if (id.includes('/utils/')) {
                return 'utils';
              }
            },
          },
        },
      },
      // Optimize dependencies
      optimizeDeps: {
        include: ['hono', 'honox', '@markdoc/markdoc'],
      },
    };
  }
});
