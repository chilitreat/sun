import type { Meta } from '../types'

/**
 * Default values for frontmatter fields
 */
const DEFAULT_META: Meta = {
  emoji: '📝',
  title: 'Untitled',
  author: 'Unknown',
  created_at: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
  hashtags: []
}

/**
 * Safely parses frontmatter with fallback to default values
 * @param frontmatter - Raw frontmatter object
 * @returns Parsed Meta object with defaults applied
 */
export const safeParseFrontmatter = (frontmatter: any): Meta => {
  try {
    if (!frontmatter || typeof frontmatter !== 'object') {
      console.warn('Invalid frontmatter provided, using defaults')
      return { ...DEFAULT_META }
    }

    return {
      emoji: typeof frontmatter.emoji === 'string' ? frontmatter.emoji : DEFAULT_META.emoji,
      title: typeof frontmatter.title === 'string' ? frontmatter.title : DEFAULT_META.title,
      author: typeof frontmatter.author === 'string' ? frontmatter.author : DEFAULT_META.author,
      created_at: typeof frontmatter.created_at === 'string' ? frontmatter.created_at : DEFAULT_META.created_at,
      hashtags: frontmatter.hashtags || DEFAULT_META.hashtags
    }
  } catch (error) {
    console.error('Error parsing frontmatter:', error)
    return { ...DEFAULT_META }
  }
}

/**
 * Validates if a frontmatter object has required fields
 * @param frontmatter - Frontmatter object to validate
 * @returns True if valid, false otherwise
 */
export const isValidFrontmatter = (frontmatter: any): boolean => {
  try {
    if (!frontmatter || typeof frontmatter !== 'object') {
      return false
    }

    // Check for required fields
    const hasTitle = typeof frontmatter.title === 'string' && frontmatter.title.trim().length > 0
    const hasAuthor = typeof frontmatter.author === 'string' && frontmatter.author.trim().length > 0
    const hasDate = typeof frontmatter.created_at === 'string' && frontmatter.created_at.trim().length > 0

    return hasTitle && hasAuthor && hasDate
  } catch (error) {
    console.warn('Error validating frontmatter:', error)
    return false
  }
}

/**
 * Sanitizes frontmatter to prevent XSS and other security issues
 * @param frontmatter - Raw frontmatter object
 * @returns Sanitized Meta object
 */
export const sanitizeFrontmatter = (frontmatter: any): Meta => {
  try {
    const parsed = safeParseFrontmatter(frontmatter)

    // Basic HTML/script tag removal for security
    const sanitizeString = (str: string): string => {
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim()
    }

    return {
      ...parsed,
      title: sanitizeString(parsed.title),
      author: sanitizeString(parsed.author),
      emoji: parsed.emoji.length > 10 ? '📝' : parsed.emoji // Limit emoji length
    }
  } catch (error) {
    console.error('Error sanitizing frontmatter:', error)
    return { ...DEFAULT_META }
  }
}