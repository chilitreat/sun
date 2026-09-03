/**
 * Build-time hashtag page generation for SSG.
 *
 * Renders a real static HTML file per hashtag containing the list of matching
 * posts (title, author, date), mirroring the markup produced by the Hono route
 * at app/routes/hashtag/[tag].tsx so the pages are useful without JavaScript.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { extractAllHashtags, getPostsMetadata } from './extract-hashtags.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Escape a value for safe interpolation into HTML text / attributes.
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Whether a post carries the given normalized hashtag.
 * Keeps the react/reactjs alias in sync with app/utils/filtering.ts.
 * @param {{ hashtags: string[] }} post
 * @param {string} normalizedTag
 */
function postMatchesHashtag(post, normalizedTag) {
  return post.hashtags.some(
    (tag) =>
      tag === normalizedTag ||
      (normalizedTag === 'reactjs' && tag === 'react') ||
      (normalizedTag === 'react' && tag === 'reactjs')
  );
}

/**
 * Sort posts newest-first, matching app/utils/precompute.ts.
 */
function sortByDateDesc(posts) {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
    if (Number.isNaN(dateA)) return 1;
    if (Number.isNaN(dateB)) return -1;
    return dateB - dateA;
  });
}

function renderCard(post) {
  return `        <li class="flex flex-row mb-2">
          <a href="/posts/${escapeHtml(post.slug)}" class="select-none cursor-pointer bg-gray-50 rounded-md flex flex-1 items-center p-4">
            <div class="flex flex-col rounded-md w-10 h-10 bg-gray-200 justify-center items-center mr-2">${escapeHtml(post.emoji || '📝')}</div>
            <div class="flex-1 pl-1 mr-4">
              <div class="font-medium break-normal">${escapeHtml(post.title || 'Untitled')}</div>
              <div class="text-gray-600 text-sm">by ${escapeHtml(post.author || 'Unknown')}</div>
            </div>
            <div class="text-gray-600 text-xs">${escapeHtml(post.created_at || 'Unknown date')}</div>
          </a>
        </li>`;
}

function renderFilterBanner(hashtag, postCount) {
  const noun = postCount === 1 ? 'post' : 'posts';
  const emptyBlock =
    postCount === 0
      ? `
      <div class="mt-3 pt-3 border-t border-blue-200">
        <p class="text-sm text-gray-600 mb-2">No posts found with the hashtag "#${escapeHtml(hashtag)}"</p>
        <a href="/" class="text-sm text-blue-600 hover:text-blue-800 underline">View all posts</a>
      </div>`
      : '';

  return `      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">#${escapeHtml(hashtag)}</span>
          <span class="text-sm text-gray-600">${postCount} ${noun} found</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="/" class="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded" aria-label="Clear hashtag filter for ${escapeHtml(hashtag)}">Clear filter</a>
        </div>
      </div>${emptyBlock}
    </div>`;
}

/**
 * Build a full static HTML document for one hashtag, wrapping the post list in
 * the same header/footer shell as app/routes/_renderer.tsx.
 */
function createStaticHashtagPage(hashtag, posts) {
  const list = posts.length
    ? `      <div class="container flex mx-auto items-center justify-center">
        <ul class="flex flex-col w-full">
${posts.map(renderCard).join('\n')}
        </ul>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Posts tagged with "#${escapeHtml(hashtag)}" - 日記（仮）</title>
  <link rel="stylesheet" href="/static/assets/style.css"/>
  <meta name="description" content="Posts tagged with #${escapeHtml(hashtag)}"/>
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
            <img src="https://assets.misskey-hub.net/public/icon.png" alt="chilitreat on Misskey" class="w-5 h-5"/>
          </a>
        </li>
        <li class="px-4">
          <a href="https://twitter.com/chilitreat">
            <img src="https://icongr.am/simple/twitter.svg?size=30&amp;color=currentColor&amp;colored=false" alt="chilitreat on Twitter" class="w-5 h-5"/>
          </a>
        </li>
        <li class="px-4">
          <a href="https://github.com/chilitreat/">
            <img src="https://icongr.am/devicon/github-original.svg?size=30&amp;color=currentColor" alt="chilitreat on GitHub" class="w-5 h-5"/>
          </a>
        </li>
      </ul>
    </nav>
  </header>

  <main class="px-2">
    <article class="prose">
      <div class="mx-auto">
        <h2 class="text-xl font-semibold mt-1 mb-4">
          Posts tagged with "#${escapeHtml(hashtag)}"
        </h2>
${renderFilterBanner(hashtag, posts.length)}
${list}
      </div>
    </article>
  </main>

  <footer class="bg-gray-100">
    <p class="text-center text-sm">
      &copy; chilitreatの日記（仮）. All rights reserved.
    </p>
  </footer>
</body>
</html>
`;
}

async function buildHashtagPages() {
  const distDir = join(__dirname, '../dist');
  const hashtagDir = join(distDir, 'hashtag');

  if (!existsSync(hashtagDir)) {
    mkdirSync(hashtagDir, { recursive: true });
  }

  const hashtags = extractAllHashtags();
  const posts = getPostsMetadata();

  console.log(`Building ${hashtags.length} hashtag pages...`);

  for (const hashtag of hashtags) {
    const matching = sortByDateDesc(posts.filter((post) => postMatchesHashtag(post, hashtag)));
    // Write the file under its literal (decoded) name, e.g. `ポエム.html`.
    // Cloudflare Pages resolves request paths against decoded asset names, so a
    // percent-encoded filename like `%E3%83%9D....html` would be unreachable for
    // non-ASCII tags. `normalizeHashtag` has already stripped path separators and
    // other unsafe characters, leaving only [a-z0-9] + kana/kanji.
    const fileName = `${hashtag}.html`;
    const filePath = join(hashtagDir, fileName);

    writeFileSync(filePath, createStaticHashtagPage(hashtag, matching), 'utf-8');
    console.log(`Generated: /hashtag/${fileName} (${matching.length} posts)`);
  }
}

// CLI usage: compare resolved paths so the check works across platforms.
if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  buildHashtagPages().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { buildHashtagPages, createStaticHashtagPage };
