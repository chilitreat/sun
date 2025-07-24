import { describe, it, expect } from 'vitest'
import { safeParseFrontmatter, isValidFrontmatter, sanitizeFrontmatter } from '../frontmatter'

describe('safeParseFrontmatter', () => {
  it('should parse valid frontmatter correctly', () => {
    const input = {
      emoji: '👋',
      title: 'Test Post',
      author: 'Test Author',
      created_at: '2024/01/01',
      hashtags: ['javascript', 'react']
    }

    const result = safeParseFrontmatter(input)
    expect(result).toEqual(input)
  })

  it('should provide defaults for missing fields', () => {
    const input = {
      title: 'Test Post'
    }

    const result = safeParseFrontmatter(input)
    expect(result.title).toBe('Test Post')
    expect(result.emoji).toBe('📝')
    expect(result.author).toBe('Unknown')
    expect(result.hashtags).toEqual([])
    expect(typeof result.created_at).toBe('string')
  })

  it('should handle null and undefined input', () => {
    const resultNull = safeParseFrontmatter(null)
    const resultUndefined = safeParseFrontmatter(undefined)

    expect(resultNull.emoji).toBe('📝')
    expect(resultNull.title).toBe('Untitled')
    expect(resultNull.author).toBe('Unknown')
    expect(resultNull.hashtags).toEqual([])

    expect(resultUndefined).toEqual(resultNull)
  })

  it('should handle non-object input', () => {
    const result = safeParseFrontmatter('invalid')
    expect(result.emoji).toBe('📝')
    expect(result.title).toBe('Untitled')
    expect(result.author).toBe('Unknown')
    expect(result.hashtags).toEqual([])
  })

  it('should handle invalid field types', () => {
    const input = {
      emoji: 123,
      title: null,
      author: undefined,
      created_at: {},
      hashtags: 'invalid'
    }

    const result = safeParseFrontmatter(input)
    expect(result.emoji).toBe('📝')
    expect(result.title).toBe('Untitled')
    expect(result.author).toBe('Unknown')
    expect(typeof result.created_at).toBe('string')
    expect(result.hashtags).toBe('invalid') // This will be handled by parseHashtags
  })
})

describe('isValidFrontmatter', () => {
  it('should validate complete frontmatter', () => {
    const valid = {
      emoji: '👋',
      title: 'Test Post',
      author: 'Test Author',
      created_at: '2024/01/01',
      hashtags: ['javascript']
    }

    expect(isValidFrontmatter(valid)).toBe(true)
  })

  it('should reject frontmatter missing required fields', () => {
    expect(isValidFrontmatter({})).toBe(false)
    expect(isValidFrontmatter({ title: 'Test' })).toBe(false)
    expect(isValidFrontmatter({ title: 'Test', author: 'Author' })).toBe(false)
  })

  it('should reject frontmatter with empty required fields', () => {
    const invalid = {
      title: '',
      author: 'Author',
      created_at: '2024/01/01'
    }

    expect(isValidFrontmatter(invalid)).toBe(false)
  })

  it('should reject frontmatter with whitespace-only required fields', () => {
    const invalid = {
      title: '   ',
      author: 'Author',
      created_at: '2024/01/01'
    }

    expect(isValidFrontmatter(invalid)).toBe(false)
  })

  it('should handle null and undefined input', () => {
    expect(isValidFrontmatter(null)).toBe(false)
    expect(isValidFrontmatter(undefined)).toBe(false)
  })

  it('should handle non-object input', () => {
    expect(isValidFrontmatter('invalid')).toBe(false)
    expect(isValidFrontmatter(123)).toBe(false)
    expect(isValidFrontmatter([])).toBe(false)
  })
})

describe('sanitizeFrontmatter', () => {
  it('should remove script tags from strings', () => {
    const input = {
      title: 'Test <script>alert("xss")</script> Post',
      author: 'Author <script>evil()</script>',
      emoji: '👋',
      created_at: '2024/01/01',
      hashtags: []
    }

    const result = sanitizeFrontmatter(input)
    expect(result.title).toBe('Test  Post')
    expect(result.author).toBe('Author')
  })

  it('should remove HTML tags from strings', () => {
    const input = {
      title: 'Test <b>Bold</b> <i>Italic</i> Post',
      author: 'Author <span>Name</span>',
      emoji: '👋',
      created_at: '2024/01/01',
      hashtags: []
    }

    const result = sanitizeFrontmatter(input)
    expect(result.title).toBe('Test Bold Italic Post')
    expect(result.author).toBe('Author Name')
  })

  it('should limit emoji length', () => {
    const input = {
      title: 'Test Post',
      author: 'Author',
      emoji: '👋'.repeat(20), // Very long emoji string
      created_at: '2024/01/01',
      hashtags: []
    }

    const result = sanitizeFrontmatter(input)
    expect(result.emoji).toBe('📝')
  })

  it('should handle invalid input gracefully', () => {
    const result = sanitizeFrontmatter(null)
    expect(result.emoji).toBe('📝')
    expect(result.title).toBe('Untitled')
    expect(result.author).toBe('Unknown')
    expect(result.hashtags).toEqual([])
  })

  it('should preserve valid emoji', () => {
    const input = {
      title: 'Test Post',
      author: 'Author',
      emoji: '👋',
      created_at: '2024/01/01',
      hashtags: []
    }

    const result = sanitizeFrontmatter(input)
    expect(result.emoji).toBe('👋')
  })
})