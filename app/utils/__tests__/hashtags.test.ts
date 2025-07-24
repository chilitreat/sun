import { describe, it, expect } from 'vitest'
import { normalizeHashtag, parseHashtags, generateHashtagUrl, isValidHashtag } from '../hashtags'

describe('normalizeHashtag', () => {
  it('should convert hashtags to lowercase', () => {
    expect(normalizeHashtag('JavaScript')).toBe('javascript')
    expect(normalizeHashtag('REACT')).toBe('react')
  })

  it('should remove special characters', () => {
    expect(normalizeHashtag('react.js')).toBe('reactjs')
    expect(normalizeHashtag('node-js')).toBe('nodejs')
    expect(normalizeHashtag('c++')).toBe('c')
  })

  it('should preserve alphanumeric characters', () => {
    expect(normalizeHashtag('react123')).toBe('react123')
    expect(normalizeHashtag('123test')).toBe('123test')
  })

  it('should preserve Japanese characters', () => {
    expect(normalizeHashtag('技術')).toBe('技術')
    expect(normalizeHashtag('プログラミング')).toBe('プログラミング')
    expect(normalizeHashtag('技術ブログ')).toBe('技術ブログ')
  })

  it('should trim whitespace', () => {
    expect(normalizeHashtag(' javascript ')).toBe('javascript')
  })
})

describe('parseHashtags', () => {
  it('should handle undefined input', () => {
    expect(parseHashtags(undefined)).toEqual([])
  })

  it('should handle empty string input', () => {
    expect(parseHashtags('')).toEqual([])
  })

  it('should handle single string input', () => {
    expect(parseHashtags('javascript')).toEqual(['javascript'])
  })

  it('should handle comma-separated string input', () => {
    expect(parseHashtags('javascript,react,typescript')).toEqual(['javascript', 'react', 'typescript'])
  })

  it('should handle array input', () => {
    expect(parseHashtags(['javascript', 'react', 'typescript'])).toEqual(['javascript', 'react', 'typescript'])
  })

  it('should normalize all hashtags', () => {
    expect(parseHashtags(['JavaScript', 'React.js', 'TypeScript'])).toEqual(['javascript', 'reactjs', 'typescript'])
  })

  it('should filter out empty values', () => {
    expect(parseHashtags(['javascript', '', '  ', 'react'])).toEqual(['javascript', 'react'])
  })

  it('should trim whitespace in comma-separated strings', () => {
    expect(parseHashtags('javascript, react, typescript')).toEqual(['javascript', 'react', 'typescript'])
  })
})

describe('generateHashtagUrl', () => {
  it('should create URL-safe hashtag strings', () => {
    expect(generateHashtagUrl('javascript')).toBe('javascript')
    expect(generateHashtagUrl('react.js')).toBe('reactjs')
  })

  it('should handle Japanese characters correctly', () => {
    expect(generateHashtagUrl('技術')).toBe('%E6%8A%80%E8%A1%93')
    expect(generateHashtagUrl('プログラミング')).toBe('%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0')
  })

  it('should normalize before encoding', () => {
    expect(generateHashtagUrl('React.JS')).toBe('reactjs')
    expect(generateHashtagUrl(' TypeScript ')).toBe('typescript')
  })

  it('should handle invalid input gracefully', () => {
    expect(generateHashtagUrl('')).toBe('')
    expect(generateHashtagUrl('   ')).toBe('')
  })
})

describe('normalizeHashtag error handling', () => {
  it('should handle null and undefined input', () => {
    expect(normalizeHashtag(null as any)).toBe('')
    expect(normalizeHashtag(undefined as any)).toBe('')
  })

  it('should handle non-string input', () => {
    expect(normalizeHashtag(123 as any)).toBe('')
    expect(normalizeHashtag({} as any)).toBe('')
    expect(normalizeHashtag([] as any)).toBe('')
  })

  it('should handle empty or whitespace-only strings', () => {
    expect(normalizeHashtag('')).toBe('')
    expect(normalizeHashtag('   ')).toBe('')
    expect(normalizeHashtag('\t\n')).toBe('')
  })

  it('should handle strings with only special characters', () => {
    expect(normalizeHashtag('!@#$%')).toBe('')
    expect(normalizeHashtag('---')).toBe('')
  })
})

describe('parseHashtags error handling', () => {
  it('should handle invalid array elements', () => {
    expect(parseHashtags([123, null, undefined, ''] as any)).toEqual([])
    expect(parseHashtags(['valid', 123, 'another'] as any)).toEqual(['valid', 'another'])
  })

  it('should handle malformed comma-separated strings', () => {
    expect(parseHashtags(',,,')).toEqual([])
    expect(parseHashtags('valid,,invalid,')).toEqual(['valid', 'invalid'])
  })

  it('should handle unexpected input types', () => {
    expect(parseHashtags(123 as any)).toEqual([])
    expect(parseHashtags({} as any)).toEqual([])
    expect(parseHashtags(true as any)).toEqual([])
  })
})

describe('isValidHashtag', () => {
  it('should validate correct hashtags', () => {
    expect(isValidHashtag('javascript')).toBe(true)
    expect(isValidHashtag('React')).toBe(true)
    expect(isValidHashtag('技術')).toBe(true)
  })

  it('should reject invalid hashtags', () => {
    expect(isValidHashtag('')).toBe(false)
    expect(isValidHashtag('   ')).toBe(false)
    expect(isValidHashtag(null as any)).toBe(false)
    expect(isValidHashtag(undefined as any)).toBe(false)
    expect(isValidHashtag(123 as any)).toBe(false)
  })

  it('should reject overly long hashtags', () => {
    const longHashtag = 'a'.repeat(51)
    expect(isValidHashtag(longHashtag)).toBe(false)
  })

  it('should accept hashtags at length limit', () => {
    const maxLengthHashtag = 'a'.repeat(50)
    expect(isValidHashtag(maxLengthHashtag)).toBe(true)
  })
})