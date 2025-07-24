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
  
  // Import and use the Hono app to render pages
  try {
    // Import the built server
    const { default: app } = await import('../dist/index.js');
    
    for (const hashtag of hashtags) {
      try {
        const encodedTag = encodeURIComponent(hashtag);
        const url = `http://localhost/hashtag/${encodedTag}`;
        
        // Create a request object
        const req = new Request(url);
        
        // Get response from Hono app
        const response = await app.fetch(req);
        
        if (response.ok) {
          const html = await response.text();
          const fileName = `${encodedTag}.html`;
          const filePath = join(hashtagDir, fileName);
          
          writeFileSync(filePath, html, 'utf-8');
          console.log(`Generated: /hashtag/${fileName}`);
        } else {
          console.warn(`Failed to render hashtag page for "${hashtag}": ${response.status}`);
        }
      } catch (error) {
        console.error(`Error generating page for hashtag "${hashtag}":`, error.message);
      }
    }
    
    console.log(`Successfully built ${hashtags.length} hashtag pages`);
  } catch (error) {
    console.error('Failed to import Hono app:', error);
    console.log('Falling back to simple static pages...');
    
    // Fallback: create simple static pages
    for (const hashtag of hashtags) {
      const encodedTag = encodeURIComponent(hashtag);
      const content = createStaticHashtagPage(hashtag);
      const fileName = `${encodedTag}.html`;
      const filePath = join(hashtagDir, fileName);
      
      writeFileSync(filePath, content, 'utf-8');
      console.log(`Generated fallback: /hashtag/${fileName}`);
    }
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
          <p class="text-blue-800 text-sm">
            🔄 Loading posts tagged with <strong>#${hashtag}</strong>...
          </p>
        </div>
        
        <div id="hashtag-content">
          <p class="text-gray-600">
            <a href="/" class="text-blue-600 hover:text-blue-800 underline">
              ← Return to all posts
            </a>
          </p>
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
    // Client-side enhancement for dynamic content loading
    (function() {
      // Redirect to the main hashtag route for proper server-side rendering
      // This ensures compatibility with both static hosting and server environments
      const currentPath = window.location.pathname;
      const expectedPath = '/hashtag/${encodedTag}';
      
      if (currentPath !== expectedPath) {
        // If we're on a static file (.html), redirect to the clean URL
        window.location.replace(expectedPath);
      }
    })();
  </script>
</body>
</html>`;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  buildHashtagPages().catch(console.error);
}