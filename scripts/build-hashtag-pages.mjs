/**
 * Build-time hashtag page generation using the actual Hono app
 * This creates real static HTML files for each hashtag
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extractAllHashtags } from './extract-hashtags.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load the Hono app and render hashtag pages
 */
async function buildHashtagPages() {
  const distDir = join(__dirname, '../dist');
  const hashtagDir = join(distDir, 'hashtag');
  
  // Ensure hashtag directory exists
  if (!existsSync(hashtagDir)) {
    mkdirSync(hashtagDir, { recursive: true });
  }
  
  // Extract hashtags
  const hashtags = extractAllHashtags();
  
  console.log(`Building ${hashtags.length} hashtag pages...`);
  
  // For SSG builds, we create static pages directly
  // This is the preferred approach for Cloudflare Pages
  console.log('Creating static hashtag pages for SSG deployment...');
  
  for (const hashtag of hashtags) {
    const encodedTag = encodeURIComponent(hashtag);
    const content = createStaticHashtagPage(hashtag);
    const fileName = `${encodedTag}.html`;
    const filePath = join(hashtagDir, fileName);
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Generated: /hashtag/${fileName}`);
  }
}

/**
 * Create a static hashtag page with client-side enhancement
 */
function createStaticHashtagPage(hashtag) {
  const encodedTag = encodeURIComponent(hashtag);
  
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Posts tagged with "#${hashtag}" - 日記（仮）</title>
  <link rel="stylesheet" href="/static/assets/style.css"/>
  <meta name="description" content="Posts tagged with #${hashtag}"/>
</head>
<body>
  <header class="bg-gray-100">
    <nav class="mx-auto flex max-w-7x1 items-center justify-between p-6 lg:px-8">
      <h1 class="text-xl font-bold">
        <a href="/">日記（仮）</a>
      </h1>
      <ul class="flex">
        <li class="px-4">
          <a href="https://misskey.chilitreat.dev">
            <img src="https://assets.misskey-hub.net/public/icon.png" alt="misskey-icon" class="w-5 h-5"/>
          </a>
        </li>
        <li class="px-4">
          <a href="https://twitter.com/chilitreat">
            <img src="https://icongr.am/simple/twitter.svg?size=30&color=currentColor&colored=false" alt="" class="w-5 h-5"/>
          </a>
        </li>
        <li class="px-4">
          <a href="https://github.com/chilitreat/">
            <img src="https://icongr.am/devicon/github-original.svg?size=30&color=currentColor" alt="" class="w-5 h-5"/>
          </a>
        </li>
      </ul>
    </nav>
  </header>
  
  <main class="px-2">
    <article class="prose">
      <div class="mx-auto">
        <h2 class="text-xl font-semibold mt-1 mb-4">
          Posts tagged with "#${hashtag}"
        </h2>
        
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <p class="text-blue-800 text-sm font-medium">
            🔍 Filtering posts by <strong>#${hashtag}</strong>
          </p>
          <a href="/" class="text-blue-600 hover:text-blue-800 underline text-sm">
            Clear filter
          </a>
        </div>
        
        <div id="posts-container">
          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p class="text-yellow-800 text-sm">
              📄 This is a static hashtag page for SEO and accessibility.
            </p>
            <p class="text-yellow-700 text-sm mt-2">
              For dynamic filtering, please visit the <a href="/?filter=${hashtag}" class="text-blue-600 hover:text-blue-800 underline font-medium">main page with filter</a>.
            </p>
          </div>
          
          <div class="text-center py-4">
            <p class="text-gray-600 mb-4">
              Posts tagged with <strong>#${hashtag}</strong> will be shown here when dynamic loading is available.
            </p>
            <a href="/" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              View All Posts
            </a>
          </div>
        </div>
      </div>
    </article>
  </main>
  
  <footer class="bg-gray-100">
    <p class="text-center text-sm">
      © chilitreatの日記（仮）. All rights reserved.
    </p>
  </footer>

  <script>
    // Simple no-redirect static page
    // This page serves as an SEO-friendly landing page for hashtag searches
    console.log('Static hashtag page loaded for: ${hashtag}');
  </script>
</body>
</html>`;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  buildHashtagPages().catch(console.error);
}