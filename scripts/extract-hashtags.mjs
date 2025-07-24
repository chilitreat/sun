/**
 * Build-time hashtag extraction utility for SSG
 * Extracts all hashtags from MDX posts for pre-rendering
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extract frontmatter from MDX content
 */
function extractFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;
  
  const frontmatterText = frontmatterMatch[1];
  const frontmatter = {};
  
  // Simple YAML parsing for hashtags
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let arrayValues = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('- ')) {
      // Array item
      if (currentKey === 'hashtags') {
        arrayValues.push(trimmed.substring(2).trim());
      }
    } else if (trimmed.includes(':')) {
      // Save previous array
      if (currentKey === 'hashtags' && arrayValues.length > 0) {
        frontmatter[currentKey] = arrayValues;
        arrayValues = [];
      }
      
      // New key-value pair
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      currentKey = key.trim();
      
      if (currentKey === 'hashtags') {
        if (value.startsWith('[') && value.endsWith(']')) {
          // Inline array format
          const inlineValues = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
          frontmatter[currentKey] = inlineValues.filter(v => v);
        } else if (value) {
          // Single value
          frontmatter[currentKey] = [value];
        }
        // If value is empty, it's a multi-line array
      } else {
        frontmatter[currentKey] = value;
      }
    }
  }
  
  // Handle final array
  if (currentKey === 'hashtags' && arrayValues.length > 0) {
    frontmatter[currentKey] = arrayValues;
  }
  
  return frontmatter;
}

/**
 * Normalize hashtag for URL compatibility
 */
function normalizeHashtag(hashtag) {
  if (!hashtag || typeof hashtag !== 'string') return '';
  
  return hashtag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/gi, '');
}

/**
 * Extract all hashtags from MDX posts
 */
export function extractAllHashtags() {
  const postsDir = join(__dirname, '../app/routes/posts');
  const hashtags = new Set();
  
  try {
    const files = readdirSync(postsDir).filter(file => file.endsWith('.mdx'));
    
    for (const file of files) {
      try {
        const filePath = join(postsDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const frontmatter = extractFrontmatter(content);
        
        if (frontmatter?.hashtags) {
          const postHashtags = Array.isArray(frontmatter.hashtags) 
            ? frontmatter.hashtags 
            : [frontmatter.hashtags];
          
          for (const tag of postHashtags) {
            const normalized = normalizeHashtag(tag);
            if (normalized) {
              hashtags.add(normalized);
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Failed to process ${file}:`, error.message);
      }
    }
    
    const result = Array.from(hashtags).sort();
    console.log(`Extracted ${result.length} unique hashtags:`, result);
    return result;
  } catch (error) {
    console.error('Error extracting hashtags:', error);
    return [];
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const hashtags = extractAllHashtags();
  console.log(JSON.stringify(hashtags, null, 2));
}