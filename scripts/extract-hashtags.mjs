/**
 * Build-time hashtag extraction utility for SSG
 * Extracts hashtags (and lightweight post metadata) from MDX posts for pre-rendering
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { load as loadYaml } from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POSTS_DIR = join(__dirname, '../app/routes/posts');

/**
 * Parse the YAML frontmatter block from MDX content using a real YAML parser.
 * @param {string} content
 * @returns {Record<string, unknown> | null}
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  try {
    const data = loadYaml(match[1]);
    return data && typeof data === 'object' ? data : null;
  } catch (error) {
    console.warn('Warning: Failed to parse frontmatter YAML:', error.message);
    return null;
  }
}

/**
 * Normalize a hashtag for URL compatibility.
 * Mirrors app/utils/hashtags.ts#normalizeHashtag.
 * @param {unknown} hashtag
 * @returns {string}
 */
export function normalizeHashtag(hashtag) {
  if (!hashtag || typeof hashtag !== 'string') return '';

  return hashtag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/gi, '');
}

/**
 * Coerce a frontmatter `hashtags` field into an array of raw strings.
 * @param {unknown} value
 * @returns {string[]}
 */
function toHashtagArray(value) {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string');
  if (typeof value === 'string') return value.split(',');
  return [];
}

/**
 * Coerce a frontmatter `created_at` value (string or YAML date) into a display string.
 * @param {unknown} value
 * @returns {string}
 */
function toDateString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}/${value.getMonth() + 1}/${value.getDate()}`;
  }
  return typeof value === 'string' ? value : '';
}

/**
 * Read every MDX post and return lightweight metadata for SSG.
 * @returns {Array<{ slug: string, title: string, emoji: string, author: string, created_at: string, hashtags: string[] }>}
 */
export function getPostsMetadata() {
  let files;
  try {
    files = readdirSync(POSTS_DIR).filter((file) => file.endsWith('.mdx'));
  } catch (error) {
    console.error('Error reading posts directory:', error.message);
    return [];
  }

  const posts = [];

  for (const file of files) {
    try {
      const content = readFileSync(join(POSTS_DIR, file), 'utf-8');
      const frontmatter = extractFrontmatter(content);
      if (!frontmatter) continue;

      const hashtags = [
        ...new Set(
          toHashtagArray(frontmatter.hashtags).map(normalizeHashtag).filter(Boolean)
        ),
      ];

      posts.push({
        slug: file.replace(/\.mdx$/, ''),
        title: typeof frontmatter.title === 'string' ? frontmatter.title : 'Untitled',
        emoji: typeof frontmatter.emoji === 'string' ? frontmatter.emoji : '📝',
        author: typeof frontmatter.author === 'string' ? frontmatter.author : 'Unknown',
        created_at: toDateString(frontmatter.created_at),
        hashtags,
      });
    } catch (error) {
      console.warn(`Warning: Failed to process ${file}:`, error.message);
    }
  }

  return posts;
}

/**
 * Extract all unique, normalized hashtags from MDX posts.
 * @returns {string[]}
 */
export function extractAllHashtags() {
  const hashtags = new Set();

  for (const post of getPostsMetadata()) {
    for (const tag of post.hashtags) hashtags.add(tag);
  }

  const result = [...hashtags].sort();
  console.log(`Extracted ${result.length} unique hashtags:`, result);
  return result;
}

// CLI usage: compare resolved paths so the check works across platforms.
if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  console.log(JSON.stringify(extractAllHashtags(), null, 2));
}
