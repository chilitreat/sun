import { describe, it, expect, beforeEach } from 'vitest'
import {
  clearMemoCache,
  memoizedParseHashtags,
  memoizedSortPostsByDate,
  memoizedGetAllHashtags,
  precomputeData,
  debounce,
  throttle
} from '../performance'
import { findAdjacentPosts } from '../navigation'
import { PostsMap } from '../filtering'

// Test data
const testPosts: PostsMap = {
  'post1': {
    frontmatter: {
      emoji: '🔥',
      title: 'First Post',
      author: 'Test Author',
      created_at: '2024/01/01',
      hashtags: ['javascript', 'react']
    }
  },
  'post2': {
    frontmatter: {
      emoji: '✨',
      title: 'Second Post',
      author: 'Test Author',
      created_at: '2024/02/01',
      hashtags: 'typescript,vue'
    }
  },
  'post3': {
    frontmatter: {
      emoji: '🚀',
      title: 'Third Post',
      author: 'Test Author',
      created_at: '2024/03/01',
      hashtags: ['react', 'nextjs']
    }
  }
}

describe('Performance Utilities', () => {
  beforeEach(() => {
    clearMemoCache()
  })

  describe('clearMemoCache', () => {
    it('should clear the memoization cache', () => {
      // First call should compute
      const result1 = memoizedParseHashtags(['javascript', 'react'])

      // Second call should use cache (same result)
      const result2 = memoizedParseHashtags(['javascript', 'react'])
      expect(result1).toEqual(result2)

      // Clear cache
      clearMemoCache()

      // Should still work after clearing cache
      const result3 = memoizedParseHashtags(['javascript', 'react'])
      expect(result3).toEqual(['javascript', 'react'])
    })
  })

  describe('memoizedParseHashtags', () => {
    it('should memoize hashtag parsing results', () => {
      const input = ['JavaScript', 'React.js', 'TypeScript']

      const result1 = memoizedParseHashtags(input)
      const result2 = memoizedParseHashtags(input)

      expect(result1).toEqual(['javascript', 'reactjs', 'typescript'])
      expect(result2).toEqual(['javascript', 'reactjs', 'typescript'])
      // Results should be identical (same reference if properly memoized)
      expect(result1).toBe(result2)
    })

    it('should handle different inputs correctly', () => {
      const result1 = memoizedParseHashtags(['javascript'])
      const result2 = memoizedParseHashtags(['react'])

      expect(result1).toEqual(['javascript'])
      expect(result2).toEqual(['react'])
      expect(result1).not.toBe(result2)
    })

    it('should handle undefined input', () => {
      const result = memoizedParseHashtags(undefined)
      expect(result).toEqual([])
    })
  })

  describe('memoizedSortPostsByDate', () => {
    it('should memoize post sorting results', () => {
      const result1 = memoizedSortPostsByDate(testPosts)
      const result2 = memoizedSortPostsByDate(testPosts)

      expect(result1).toHaveLength(3)
      expect(result1[0][0]).toBe('post3') // Newest first
      expect(result1[1][0]).toBe('post2')
      expect(result1[2][0]).toBe('post1') // Oldest last

      // Should be memoized (same reference)
      expect(result1).toBe(result2)
    })

    it('should handle empty posts', () => {
      const result = memoizedSortPostsByDate({})
      expect(result).toEqual([])
    })

    it('should filter out invalid posts', () => {
      const invalidPosts: PostsMap = {
        'valid': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['test']
          }
        },
        'invalid1': {
          frontmatter: {
            emoji: '❌',
            title: '', // Empty title
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['test']
          }
        },
        'invalid2': {
          frontmatter: {
            emoji: '❌',
            title: 'No Date',
            author: 'Author',
            created_at: '', // Empty date
            hashtags: ['test']
          }
        }
      }

      const result = memoizedSortPostsByDate(invalidPosts)
      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('valid')
    })
  })

  describe('memoizedGetAllHashtags', () => {
    it('should memoize hashtag extraction results', () => {
      const result1 = memoizedGetAllHashtags(testPosts)
      const result2 = memoizedGetAllHashtags(testPosts)

      expect(result1).toContain('javascript')
      expect(result1).toContain('react')
      expect(result1).toContain('typescript')
      expect(result1).toContain('vue')
      expect(result1).toContain('nextjs')

      // Should be memoized (same reference)
      expect(result1).toBe(result2)
    })

    it('should return sorted unique hashtags', () => {
      const result = memoizedGetAllHashtags(testPosts)
      const sortedResult = [...result].sort()
      expect(result).toEqual(sortedResult)
    })

    it('should handle empty posts', () => {
      const result = memoizedGetAllHashtags({})
      expect(result).toEqual([])
    })
  })

  describe('findAdjacentPosts (memoized in navigation)', () => {
    it('should find adjacent posts correctly', () => {
      const result1 = findAdjacentPosts('post2', testPosts)
      const result2 = findAdjacentPosts('post2', testPosts)

      expect(result1.previousPost?.id).toBe('post3')
      expect(result1.nextPost?.id).toBe('post1')

      // Should return consistent results
      expect(result1.previousPost?.id).toBe(result2.previousPost?.id)
      expect(result1.nextPost?.id).toBe(result2.nextPost?.id)
    })

    it('should handle different post IDs correctly', () => {
      const result1 = findAdjacentPosts('post1', testPosts)
      const result2 = findAdjacentPosts('post3', testPosts)

      expect(result1.previousPost?.id).toBe('post2')
      expect(result1.nextPost).toBeUndefined()

      expect(result2.previousPost).toBeUndefined()
      expect(result2.nextPost?.id).toBe('post2')
    })
  })

  describe('precomputeData', () => {
    it('should precompute all necessary data structures', () => {
      const result = precomputeData(testPosts)

      expect(result.sortedPosts).toHaveLength(3)
      expect(result.sortedPosts[0][0]).toBe('post3') // Newest first

      expect(result.allHashtags).toContain('javascript')
      expect(result.allHashtags).toContain('react')
      expect(result.allHashtags).toContain('typescript')

      expect(result.navigationMap).toHaveProperty('post1')
      expect(result.navigationMap).toHaveProperty('post2')
      expect(result.navigationMap).toHaveProperty('post3')

      expect(result.hashtagPostsMap).toHaveProperty('javascript')
      expect(result.hashtagPostsMap).toHaveProperty('react')
      expect(result.hashtagPostsMap.javascript).toContain('post1')
      expect(result.hashtagPostsMap.react).toContain('post1')
      expect(result.hashtagPostsMap.react).toContain('post3')
    })

    it('should handle empty posts gracefully', () => {
      const result = precomputeData({})

      expect(result.sortedPosts).toEqual([])
      expect(result.allHashtags).toEqual([])
      expect(result.navigationMap).toEqual({})
      expect(result.hashtagPostsMap).toEqual({})
    })

    it('should handle posts with malformed data', () => {
      const malformedPosts: PostsMap = {
        'valid': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['javascript']
          }
        },
        'invalid': {
          frontmatter: null as any
        }
      }

      const result = precomputeData(malformedPosts)

      expect(result.sortedPosts).toHaveLength(1)
      expect(result.sortedPosts[0][0]).toBe('valid')
      expect(result.allHashtags).toEqual(['javascript'])
      expect(result.navigationMap).toHaveProperty('valid')
      expect(result.hashtagPostsMap.javascript).toContain('valid')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 50)

      // Call multiple times quickly
      debouncedFn()
      debouncedFn()
      debouncedFn()

      // Should not have been called yet
      expect(callCount).toBe(0)

      // Wait for debounce delay
      setTimeout(() => {
        expect(callCount).toBe(1) // Should only be called once
        done()
      }, 100)
    })

    it('should pass arguments correctly', (done) => {
      let receivedArgs: any[] = []
      const debouncedFn = debounce((...args: any[]) => {
        receivedArgs = args
      }, 50)

      debouncedFn('test', 123, { key: 'value' })

      setTimeout(() => {
        expect(receivedArgs).toEqual(['test', 123, { key: 'value' }])
        done()
      }, 100)
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      let callCount = 0
      const throttledFn = throttle(() => {
        callCount++
      }, 100)

      // First call should execute immediately
      throttledFn()
      expect(callCount).toBe(1)

      // Subsequent calls should be throttled
      throttledFn()
      throttledFn()
      expect(callCount).toBe(1)

      // Wait for throttle period to pass
      setTimeout(() => {
        throttledFn()
        expect(callCount).toBe(2)
        done()
      }, 150)
    })

    it('should pass arguments correctly', () => {
      let receivedArgs: any[] = []
      const throttledFn = throttle((...args: any[]) => {
        receivedArgs = args
      }, 50)

      throttledFn('test', 123, { key: 'value' })
      expect(receivedArgs).toEqual(['test', 123, { key: 'value' }])
    })
  })
})

describe('Performance Error Handling', () => {
  beforeEach(() => {
    clearMemoCache()
  })

  describe('memoizedSortPostsByDate error handling', () => {
    it('should handle invalid posts input', () => {
      expect(memoizedSortPostsByDate(null as any)).toEqual([])
      expect(memoizedSortPostsByDate(undefined as any)).toEqual([])
      expect(memoizedSortPostsByDate('invalid' as any)).toEqual([])
    })

    it('should handle posts with invalid dates', () => {
      const postsWithInvalidDates: PostsMap = {
        'post1': {
          frontmatter: {
            emoji: '✨',
            title: 'Post with invalid date',
            author: 'Author',
            created_at: 'invalid-date',
            hashtags: ['test']
          }
        },
        'post2': {
          frontmatter: {
            emoji: '🚀',
            title: 'Post with valid date',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['test']
          }
        }
      }

      const result = memoizedSortPostsByDate(postsWithInvalidDates)
      expect(result).toHaveLength(2) // Both posts should be included
      // Posts with invalid dates should be handled gracefully
    })
  })

  describe('memoizedGetAllHashtags error handling', () => {
    it('should handle invalid posts input', () => {
      expect(memoizedGetAllHashtags(null as any)).toEqual([])
      expect(memoizedGetAllHashtags(undefined as any)).toEqual([])
      expect(memoizedGetAllHashtags('invalid' as any)).toEqual([])
    })

    it('should handle posts with invalid hashtag data', () => {
      const postsWithInvalidHashtags: PostsMap = {
        'post1': {
          frontmatter: {
            emoji: '✨',
            title: 'Post with invalid hashtags',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: 123 as any // Invalid type
          }
        },
        'post2': {
          frontmatter: {
            emoji: '🚀',
            title: 'Post with valid hashtags',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['javascript']
          }
        }
      }

      const result = memoizedGetAllHashtags(postsWithInvalidHashtags)
      expect(result).toEqual(['javascript']) // Should only include valid hashtags
    })
  })

  describe('precomputeData error handling', () => {
    it('should handle completely invalid input gracefully', () => {
      const result = precomputeData(null as any)

      expect(result.sortedPosts).toEqual([])
      expect(result.allHashtags).toEqual([])
      expect(result.navigationMap).toEqual({})
      expect(result.hashtagPostsMap).toEqual({})
    })

    it('should handle posts with missing frontmatter', () => {
      const postsWithMissingFrontmatter: PostsMap = {
        'post1': {} as any, // Missing frontmatter
        'post2': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['javascript']
          }
        }
      }

      const result = precomputeData(postsWithMissingFrontmatter)

      expect(result.sortedPosts).toHaveLength(1)
      expect(result.sortedPosts[0][0]).toBe('post2')
      expect(result.allHashtags).toEqual(['javascript'])
    })
  })
})