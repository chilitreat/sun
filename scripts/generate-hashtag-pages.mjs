/**
 * Post-build script to generate hashtag pages for Cloudflare Pages
 * This ensures all hashtag routes are available as static HTML files
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extractAllHashtags } from './extract-hashtags.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate HTML content for a hashtag page by making a request to the local server
 */
async function generateHashtagPageContent(hashtag) {
  // For now, we'll create a simple HTML structure that matches the expected format
  // In a real implementation, you might want to start a local server and fetch the actual content
  
  const encodedTag = encodeURIComponent(hashtag);
  
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Posts tagged with "#${hashtag}"</title><link rel="stylesheet" href="/static/assets/style.css"/></head><body><header class="bg-gray-100"><nav class="mx-auto flex max-w-7x1 items-center justify-between p-6 lg:px-8"><h1 class="text-xl font-bold"><a href="/">日記（仮）</a></h1><ul class="flex"><li class="px-4"><a href="https://misskey.chilitreat.dev"><img src="https://assets.misskey-hub.net/public/icon.png" alt="misskey-icon" class="w-5 h-5"/></a></li><li class="px-4"><a href="https://twitter.com/chilitreat"><img src="https://icongr.am/simple/twitter.svg?size=30&amp;color=currentColor&amp;colored=false" alt="" class="w-5 h-5"/></a></li><li class="px-4"><a href="https://github.com/chilitreat/"><img src="https://icongr.am/devicon/github-original.svg?size=30&amp;color=currentColor" alt="" class="w-5 h-5"/></a></li></ul></nav></header><main class="px-2"><article class="prose"><div class="mx-auto"><h2 class="text-xl font-semibold mt-1 mb-4">Posts tagged with "#${hashtag}"</h2><script>
  // Client-side redirect to handle dynamic filtering
  // This ensures the hashtag page works on Cloudflare Pages
  if (typeof window !== 'undefined') {
    window.location.href = '/hashtag/${encodedTag}';
  }
</script><noscript><p>Please enable JavaScript or <a href="/">return to the home page</a> to view filtered posts.</p></noscript></div></article></main><footer class="bg-gray-100"><p class="text-center text-sm">© chilitreatの日記（仮）. All rights reserved.</p></footer></body></html>`;
}

/**
 * Generate all hashtag pages
 */
async function generateHashtagPages() {
  const distDir = join(__dirname, '../dist');
  const hashtagDir = join(distDir, 'hashtag');
  
  // Ensure hashtag directory exists
  if (!existsSync(hashtagDir)) {
    mkdirSync(hashtagDir, { recursive: true });
  }
  
  // Extract hashtags
  const hashtags = extractAllHashtags();
  
  console.log(`Generating ${hashtags.length} hashtag pages...`);
  
  for (const hashtag of hashtags) {
    try {
      const content = await generateHashtagPageContent(hashtag);
      const fileName = `${encodeURIComponent(hashtag)}.html`;
      const filePath = join(hashtagDir, fileName);
      
      writeFileSync(filePath, content, 'utf-8');
      console.log(`Generated: /hashtag/${fileName}`);
    } catch (error) {
      console.error(`Failed to generate page for hashtag "${hashtag}":`, error);
    }
  }
  
  console.log(`Successfully generated ${hashtags.length} hashtag pages`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  generateHashtagPages().catch(console.error);
}