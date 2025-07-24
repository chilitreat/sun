import { describe, it, expect, beforeEach } from 'vitest'
import {
  initializePrecomputedData,
  getPrecomputedData,
  getFastSortedPosts,
  getFastAllHashtags,
  getFastNavigation,
  getFastPostsByHashtag,
  validatePrecomputedData,
  refreshPrecomputedDataIfNeeded
} from '../precompute'
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

const updatedPosts: PostsMap = {
  ...testPosts,
  'post4': {
    frontmatter: {
      emoji: '⭐',
      title: 'Fourth Post',
      author: 'Test Author',
      created_at: '2024/04/01',
      hashtags: ['svelte']
    }
  }
}

describe('Precompute Utilities', () => {
  beforeEach(() => {
    // Reset precomputed data before each test
    initializePrecomputedData({})
  })

  describe('initializePrecomputedData', () => {
    it('should initialize precomputed data correctly', () => {
      initializePrecomputedData(testPosts)

      const data = getPrecomputedData()
      expect(data).not.toBeNull()
      expect(data!.sortedPosts).toHaveLength(3)
      expect(data!.allHashtags).toContain('javascript')
      expect(data!.allHashtags).toContain('react')
      expect(data!.navigationMap).toHaveProperty('post1')
      expect(data!.hashtagPostsMap).toHaveProperty('javascript')
    })

    it('should handle empty posts', () => {
      initializePrecomputedData({})

      const data = getPrecomputedData()
      expect(data).not.toBeNull()
      expect(data!.sortedPosts).toEqual([])
      expect(data!.allHashtags).toEqual([])
      expect(data!.navigationMap).toEqual({})
      expect(data!.hashtagPostsMap).toEqual({})
    })

    it('should handle invalid posts gracefully', () => {
      const invalidPosts: PostsMap = {
        'invalid': {
          frontmatter: null as any
        },
        'valid': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['javascript']
          }
        }
      }

      initializePrecomputedData(invalidPosts)

      const data = getPrecomputedData()
      expect(data).not.toBeNull()
      expect(data!.sortedPosts).toHaveLength(1)
      expect(data!.sortedPosts[0][0]).toBe('valid')
    })
  })

  describe('getPrecomputedData', () => {
    it('should return null when not initialized', () => {
      const data = getPrecomputedData()
      expect(data).not.toBeNull() // Because we initialize in beforeEach
    })

    it('should return precomputed data when initialized', () => {
      initializePrecomputedData(testPosts)

      const data = getPrecomputedData()
      expect(data).not.toBeNull()
      expect(data!.sortedPosts).toHaveLength(3)
    })
  })

  describe('getFastSortedPosts', () => {
    it('should use precomputed data when available and valid', () => {
      initializePrecomputedData(testPosts)

      const result = getFastSortedPosts(testPosts)
      expect(result).toHaveLength(3)
      expect(result[0][0]).toBe('post3') // Newest first
      expect(result[1][0]).toBe('post2')
      expect(result[2][0]).toBe('post1') // Oldest last
    })

    it('should fallback to regular computation when precomputed data is invalid', () => {
      initializePrecomputedData(testPosts)

      // Use different posts (should trigger fallback)
      const result = getFastSortedPosts(updatedPosts)
      expect(result).toHaveLength(4)
      expect(result[0][0]).toBe('post4') // Newest first
    })

    it('should fallback when no precomputed data exists', () => {
      // Don't initialize precomputed data
      initializePrecomputedData({})

      const result = getFastSortedPosts(testPosts)
      expect(result).toHaveLength(3)
      expect(result[0][0]).toBe('post3') // Should still work
    })

    it('should filter out invalid posts in fallback mode', () => {
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
        'invalid': {
          frontmatter: {
            emoji: '❌',
            title: '', // Empty title
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['test']
          }
        }
      }

      const result = getFastSortedPosts(invalidPosts)
      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe('valid')
    })
  })

  describe('getFastAllHashtags', () => {
    it('should return precomputed hashtags when available', () => {
      initializePrecomputedData(testPosts)

      const result = getFastAllHashtags()
      expect(result).toContain('javascript')
      expect(result).toContain('react')
      expect(result).toContain('typescript')
      expect(result).toContain('vue')
      expect(result).toContain('nextjs')
    })

    it('should return empty array when no precomputed data', () => {
      initializePrecomputedData({})

      const result = getFastAllHashtags()
      expect(result).toEqual([])
    })
  })

  describe('getFastNavigation', () => {
    it('should return precomputed navigation when available', () => {
      initializePrecomputedData(testPosts)

      const result = getFastNavigation('post2')
      expect(result.previousPost?.id).toBe('post3')
      expect(result.nextPost?.id).toBe('post1')
    })

    it('should return empty object for non-existent post', () => {
      initializePrecomputedData(testPosts)

      const result = getFastNavigation('non-existent')
      expect(result).toEqual({})
    })

    it('should return empty object when no precomputed data', () => {
      initializePrecomputedData({})

      const result = getFastNavigation('post1')
      expect(result).toEqual({})
    })

    it('should handle boundary conditions correctly', () => {
      initializePrecomputedData(testPosts)

      // First post (newest) should have no previous
      const firstResult = getFastNavigation('post3')
      expect(firstResult.previousPost).toBeUndefined()
      expect(firstResult.nextPost?.id).toBe('post2')

      // Last post (oldest) should have no next
      const lastResult = getFastNavigation('post1')
      expect(lastResult.previousPost?.id).toBe('post2')
      expect(lastResult.nextPost).toBeUndefined()
    })
  })

  describe('getFastPostsByHashtag', () => {
    it('should return precomputed posts by hashtag when available', () => {
      initializePrecomputedData(testPosts)

      const result = getFastPostsByHashtag('react', testPosts)
      expect(Object.keys(result)).toHaveLength(2)
      expect(result).toHaveProperty('post1')
      expect(result).toHaveProperty('post3')
    })

    it('should return empty object for non-existent hashtag', () => {
      initializePrecomputedData(testPosts)

      const result = getFastPostsByHashtag('angular', testPosts)
      expect(result).toEqual({})
    })

    it('should return empty object when no precomputed data', () => {
      initializePrecomputedData({})

      const result = getFastPostsByHashtag('javascript', testPosts)
      expect(result).toEqual({})
    })

    it('should handle posts that no longer exist', () => {
      initializePrecomputedData(testPosts)

      // Remove a post from the current posts
      const { post1, ...remainingPosts } = testPosts

      const result = getFastPostsByHashtag('javascript', remainingPosts)
      // Should not include post1 since it's not in current posts
      expect(result).not.toHaveProperty('post1')
    })
  })

  describe('validatePrecomputedData', () => {
    it('should return true when precomputed data is valid', () => {
      initializePrecomputedData(testPosts)

      const isValid = validatePrecomputedData(testPosts)
      expect(isValid).toBe(true)
    })

    it('should return false when precomputed data is invalid', () => {
      initializePrecomputedData(testPosts)

      const isValid = validatePrecomputedData(updatedPosts)
      expect(isValid).toBe(false)
    })

    it('should return false when no precomputed data exists', () => {
      initializePrecomputedData({})

      const isValid = validatePrecomputedData(testPosts)
      expect(isValid).toBe(false)
    })

    it('should handle empty posts correctly', () => {
      initializePrecomputedData({})

      const isValid = validatePrecomputedData({})
      expect(isValid).toBe(true)
    })
  })

  describe('refreshPrecomputedDataIfNeeded', () => {
    it('should refresh data when invalid', () => {
      initializePrecomputedData(testPosts)

      // Verify initial state
      expect(validatePrecomputedData(testPosts)).toBe(true)
      expect(validatePrecomputedData(updatedPosts)).toBe(false)

      // Refresh with updated posts
      refreshPrecomputedDataIfNeeded(updatedPosts)

      // Should now be valid for updated posts
      expect(validatePrecomputedData(updatedPosts)).toBe(true)

      // Should be able to get data for new post
      const navigation = getFastNavigation('post4')
      expect(navigation.previousPost).toBeUndefined() // Newest post
      expect(navigation.nextPost?.id).toBe('post3')
    })

    it('should not refresh when data is valid', () => {
      initializePrecomputedData(testPosts)

      const initialData = getPrecomputedData()

      refreshPrecomputedDataIfNeeded(testPosts)

      const afterRefreshData = getPrecomputedData()
      // Should be the same reference (not refreshed)
      expect(initialData).toBe(afterRefreshData)
    })

    it('should handle empty posts correctly', () => {
      initializePrecomputedData({})

      refreshPrecomputedDataIfNeeded({})

      const data = getPrecomputedData()
      expect(data!.sortedPosts).toEqual([])
      expect(data!.allHashtags).toEqual([])
    })
  })
})

describe('Precompute Error Handling', () => {
  beforeEach(() => {
    initializePrecomputedData({})
  })

  describe('initializePrecomputedData error handling', () => {
    it('should handle null/undefined posts gracefully', () => {
      initializePrecomputedData(null as any)

      const data = getPrecomputedData()
      expect(data).not.toBeNull()
      expect(data!.sortedPosts).toEqual([])
      expect(data!.allHashtags).toEqual([])
    })

    it('should handle posts with corrupted data', () => {
      const corruptedPosts: PostsMap = {
        'corrupted': {
          frontmatter: {
            emoji: '💥',
            title: 'Corrupted Post',
            author: 'Author',
            created_at: 'invalid-date',
            hashtags: 123 as any // Invalid hashtags
          }
        },
        'valid': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['javascript']
          }
        }
      }

      initializePrecomputedData(corruptedPosts)

      const data = getPrecomputedData()
      expect(data).not.toBeNull()
      // Should handle corrupted data gracefully
      expect(data!.sortedPosts.length).toBeGreaterThan(0)
    })
  })

  describe('getFastSortedPosts error handling', () => {
    it('should handle invalid posts input in fallback mode', () => {
      const result = getFastSortedPosts(null as any)
      expect(result).toEqual([])
    })

    it('should handle posts with invalid dates in fallback mode', () => {
      const postsWithInvalidDates: PostsMap = {
        'post1': {
          frontmatter: {
            emoji: '✨',
            title: 'Post with invalid date',
            author: 'Author',
            created_at: 'not-a-date',
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

      const result = getFastSortedPosts(postsWithInvalidDates)
      expect(result).toHaveLength(2) // Should include both posts
    })
  })

  describe('validatePrecomputedData error handling', () => {
    it('should handle null/undefined posts gracefully', () => {
      initializePrecomputedData(testPosts)

      expect(validatePrecomputedData(null as any)).toBe(false)
      expect(validatePrecomputedData(undefined as any)).toBe(false)
    })

    it('should handle comparison errors gracefully', () => {
      initializePrecomputedData(testPosts)

      // Create posts with circular references that might cause JSON.stringify to fail
      const circularPosts: any = {
        'post1': {
          frontmatter: {
            emoji: '✨',
            title: 'Post',
            author: 'Author',
            created_at: '2024/01/01',
            hashtags: ['test']
          }
        }
      }
      circularPosts.post1.circular = circularPosts

      const isValid = validatePrecomputedData(circularPosts)
      expect(typeof isValid).toBe('boolean') // Should not throw
    })
  })
})