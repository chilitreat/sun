import pagesBuild from '@hono/vite-cloudflare-pages'
import pagesPlugin from '@hono/vite-dev-server/cloudflare-pages'
import ssg from '@hono/vite-ssg'
import mdx from '@mdx-js/rollup'
import honox from 'honox/vite'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import clientBuild from 'honox/vite/client'
import { defineConfig } from 'vite'

const entry = './app/server.ts'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [clientBuild()],
      build: {
        rollupOptions: {
          input: ['/app/style.css'],
          output: {
            assetFileNames: 'static/assets/[name].[ext]'
          }
        }
      }
    }
  } else {
    return {
      plugins: [
        pagesBuild(),
        honox({
          devServer: {
            plugins: [
              pagesPlugin({
                d1Databases: ['DB'],
                d1Persist: './.wrangler/state/v3/d1'
              })
            ]
          }
        }),
        ssg({ entry }),
        mdx({
          jsxImportSource: 'hono/jsx',
          remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        }),
      ]
    }
  }
})