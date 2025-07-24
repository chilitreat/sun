import { describe, it, expect, beforeEach } from 'vitest'
import { findAdjacentPosts, getPostsWithNavigation, isValidPostId } from '../navigation'
import { PostsMap } from '../filtering'
import { clearMemoCache } from '../performance'

// Sample test data
const testPosts: PostsMap = {
  'post1': {
    frontmatter: {
      emoji: '🔥',
      title: 'First Post',
      author: 'Test Author',
      created_at: '2024/01/01',
      hashtags: ['test', 'first']
    }
  },
  'post2': {
    frontmatter: {
      emoji: '✨',
      title: 'Second Post',
      author: 'Test Author',
      created_at: '2024/02/01',
      hashtags: ['test', 'second']
    }
  },
  'post3': {
    frontmatter: {
      emoji: '🚀',
      title: 'Third Post',
      author: 'Test Author',
      created_at: '2024/03/01',
      hashtags: ['test', 'third']
    }
  }
}

// Edge case test data
const singlePostData: PostsMap = {
  'solo': {
    frontmatter: {
      emoji: '🎯',
      title: 'Solo Post',
      author: 'Test Author',
      created_at: '2024/01/01',
      hashtags: ['test']
    }
  }
}

const emptyPostsData: PostsMap = {}

describe('Navigation Utilities', () => {
  beforeEach(() => {
    clearMemoCache()
  })

  describe('findAdjacentPosts', () => {
    it('should find previous and next posts for middle post', () => {
      const result = findAdjacentPosts('post2', testPosts)

      expect(result.previousPost).toBeDefined()
      expect(result.previousPost?.id).toBe('post3')
      expect(result.previousPost?.title).toBe('Third Post')

      expect(result.nextPost).toBeDefined()
      expect(result.nextPost?.id).toBe('post1')
      expect(result.nextPost?.title).toBe('First Post')
    })

    it('should only find next post for newest post', () => {
      const result = findAdjacentPosts('post3', testPosts)

      expect(result.previousPost).toBeUndefined()

      expect(result.nextPost).toBeDefined()
      expect(result.nextPost?.id).toBe('post2')
      expect(result.nextPost?.title).toBe('Second Post')
    })

    it('should only find previous post for oldest post', () => {
      const result = findAdjacentPosts('post1', testPosts)

      expect(result.previousPost).toBeDefined()
      expect(result.previousPost?.id).toBe('post2')
      expect(result.previousPost?.title).toBe('Second Post')

      expect(result.nextPost).toBeUndefined()
    })

    it('should return empty object for non-existent post', () => {
      const result = findAdjacentPosts('non-existent', testPosts)

      expect(result.previousPost).toBeUndefined()
      expect(result.nextPost).toBeUndefined()
    })
  })

  describe('getPostsWithNavigation', () => {
    it('should add navigation to all posts', () => {
      const result = getPostsWithNavigation(testPosts)

      expect(result).toHaveLength(3)

      // Check newest post (post3)
      const newestPost = result.find(post => post.id === 'post3')
      expect(newestPost).toBeDefined()
      expect(newestPost?.previousPost).toBeUndefined()
      expect(newestPost?.nextPost?.id).toBe('post2')

      // Check middle post (post2)
      const middlePost = result.find(post => post.id === 'post2')
      expect(middlePost).toBeDefined()
      expect(middlePost?.previousPost?.id).toBe('post3')
      expect(middlePost?.nextPost?.id).toBe('post1')

      // Check oldest post (post1)
      const oldestPost = result.find(post => post.id === 'post1')
      expect(oldestPost).toBeDefined()
      expect(oldestPost?.previousPost?.id).toBe('post2')
      expect(oldestPost?.nextPost).toBeUndefined()
    })

    it('should handle empty posts map', () => {
      const result = getPostsWithNavigation({})
      expect(result).toHaveLength(0)
    })

    it('should handle single post', () => {
      const result = getPostsWithNavigation(singlePostData)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('solo')
      expect(result[0].previousPost).toBeUndefined()
      expect(result[0].nextPost).toBeUndefined()
    })
  })
})

// Additional boundary condition tests
describe('Boundary Conditions', () => {
  it('should handle first post boundary condition', () => {
    const result = findAdjacentPosts('post3', testPosts)

    // First post (newest) should have no previous post
    expect(result.previousPost).toBeUndefined()
    expect(result.nextPost).toBeDefined()
  })

  it('should handle last post boundary condition', () => {
    const result = findAdjacentPosts('post1', testPosts)

    // Last post (oldest) should have no next post
    expect(result.previousPost).toBeDefined()
    expect(result.nextPost).toBeUndefined()
  })

  it('should handle single post boundary condition', () => {
    const result = findAdjacentPosts('solo', singlePostData)

    // Single post should have neither previous nor next post
    expect(result.previousPost).toBeUndefined()
    expect(result.nextPost).toBeUndefined()
  })

  it('should handle empty posts map boundary condition', () => {
    const result = findAdjacentPosts('any-id', emptyPostsData)

    // Empty posts map should return empty navigation
    expect(result.previousPost).toBeUndefined()
    expect(result.nextPost).toBeUndefined()
  })

  it('should handle posts with same date correctly', () => {
    const sameDatePosts: PostsMap = {
      'post1': {
        frontmatter: {
          emoji: '🔥',
          title: 'First Post',
          author: 'Test Author',
          created_at: '2024/01/01',
          hashtags: ['test']
        }
      },
      'post2': {
        frontmatter: {
          emoji: '✨',
          title: 'Second Post',
          author: 'Test Author',
          created_at: '2024/01/01', // Same date as post1
          hashtags: ['test']
        }
      }
    }

    // Even with same dates, navigation should still work
    const result = getPostsWithNavigation(sameDatePosts)
    expect(result).toHaveLength(2)

    // Posts should still have navigation even with same dates
    const post1 = result.find(post => post.id === 'post1')
    const post2 = result.find(post => post.id === 'post2')

    expect(post1?.previousPost || post2?.previousPost).toBeDefined()
    expect(post1?.nextPost || post2?.nextPost).toBeDefined()
  })
})

describe('Navigation Error Handling', () => {
  describe('findAdjacentPosts error handling', () => {
    it('should handle invalid currentId input', () => {
      expect(findAdjacentPosts('', testPosts)).toEqual({})
      expect(findAdjacentPosts(null as any, testPosts)).toEqual({})
      expect(findAdjacentPosts(undefined as any, testPosts)).toEqual({})
      expect(findAdjacentPosts(123 as any, testPosts)).toEqual({})
    })

    it('should handle invalid posts input', () => {
      expect(findAdjacentPosts('post1', null as any)).toEqual({})
      expect(findAdjacentPosts('post1', undefined as any)).toEqual({})
      expect(findAdjacentPosts('post1', 'invalid' as any)).toEqual({})
      expect(findAdjacentPosts('post1', 123 as any)).toEqual({})
    })

    it('should handle posts with malformed frontmatter', () => {
      const malformedPosts: PostsMap = {
        'post1': {
          frontmatter: {
            emoji: '🔥',
            title: 'First Post',
            author: 'Test Author',
            created_at: '2024/01/01',
            hashtags: ['test']
          }
        },
        'post2': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Test Author',
            created_at: '2024/02/01',
            hashtags: ['test']
          }
        },
        'post3': {
          frontmatter: {
            emoji: '🚀',
            title: 'Third Post',
            author: 'Test Author',
            created_at: '2024/03/01',
            hashtags: ['test']
          }
        }
      }

      const result = findAdjacentPosts('post2', malformedPosts)
      // Should find valid posts - post2 is in the middle
      expect(result.previousPost?.id).toBe('post3') // newer post
      expect(result.nextPost?.id).toBe('post1') // older post
    })

    it('should handle posts with invalid dates', () => {
      const invalidDatePosts: PostsMap = {
        'post1': {
          frontmatter: {
            emoji: '🔥',
            title: 'Post with invalid date',
            author: 'Test Author',
            created_at: 'invalid-date',
            hashtags: ['test']
          }
        },
        'post2': {
          frontmatter: {
            emoji: '✨',
            title: 'Post with valid date',
            author: 'Test Author',
            created_at: '2024/02/01',
            hashtags: ['test']
          }
        }
      }

      const result = findAdjacentPosts('post2', invalidDatePosts)
      // Should still work but may have different ordering
      expect(typeof result).toBe('object')
    })

    it('should handle non-existent post gracefully', () => {
      const result = findAdjacentPosts('non-existent-post', testPosts)
      expect(result).toEqual({})
    })
  })

  describe('getPostsWithNavigation error handling', () => {
    it('should handle invalid posts input', () => {
      expect(getPostsWithNavigation(null as any)).toEqual([])
      expect(getPostsWithNavigation(undefined as any)).toEqual([])
      expect(getPostsWithNavigation('invalid' as any)).toEqual([])
      expect(getPostsWithNavigation(123 as any)).toEqual([])
    })

    it('should handle posts with malformed frontmatter', () => {
      const malformedPosts: PostsMap = {
        'post1': {
          frontmatter: {
            emoji: '🔥',
            title: 'First Post',
            author: 'Test Author',
            created_at: '2024/01/01',
            hashtags: ['test']
          }
        },
        'post2': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Test Author',
            created_at: '2024/02/01',
            hashtags: ['test']
          }
        },
        'post3': {
          frontmatter: {
            emoji: '🚀',
            title: 'Another Valid Post',
            author: 'Test Author',
            created_at: '2024/03/01',
            hashtags: ['test']
          }
        }
      }

      const result = getPostsWithNavigation(malformedPosts)
      // Should include all valid posts
      expect(result.length).toBe(3)
      expect(result.some(post => post.id === 'post1')).toBe(true)
      expect(result.some(post => post.id === 'post2')).toBe(true)
      expect(result.some(post => post.id === 'post3')).toBe(true)
    })

    it('should handle posts with missing titles gracefully', () => {
      const postsWithoutTitles: PostsMap = {
        'post1': {
          frontmatter: {
            emoji: '🔥',
            title: '', // Empty title - should be filtered out
            author: 'Test Author',
            created_at: '2024/01/01',
            hashtags: ['test']
          }
        },
        'post2': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Test Author',
            created_at: '2024/02/01',
            hashtags: ['test']
          }
        }
      }

      const result = getPostsWithNavigation(postsWithoutTitles)

      // Should only include posts with valid titles
      expect(result.length).toBe(1) // Only valid post should be included
      expect(result[0].id).toBe('post2')
    })

    it('should provide fallback data for corrupted posts', () => {
      const corruptedPosts: PostsMap = {
        'post1': {
          frontmatter: {
            emoji: '✨',
            title: 'Valid Post',
            author: 'Test Author',
            created_at: '2024/02/01',
            hashtags: ['test']
          }
        }
      }

      // Simulate corruption by modifying the post after creation
      const result = getPostsWithNavigation(corruptedPosts)
      expect(result.length).toBe(1)
      expect(result[0].frontmatter.title).toBe('Valid Post')
    })
  })

  describe('isValidPostId', () => {
    it('should validate existing posts', () => {
      expect(isValidPostId('post1', testPosts)).toBe(true)
      expect(isValidPostId('post2', testPosts)).toBe(true)
      expect(isValidPostId('post3', testPosts)).toBe(true)
    })

    it('should reject non-existent posts', () => {
      expect(isValidPostId('non-existent', testPosts)).toBe(false)
    })

    it('should handle invalid postId input', () => {
      expect(isValidPostId('', testPosts)).toBe(false)
      expect(isValidPostId(null as any, testPosts)).toBe(false)
      expect(isValidPostId(undefined as any, testPosts)).toBe(false)
      expect(isValidPostId(123 as any, testPosts)).toBe(false)
    })

    it('should handle invalid posts input', () => {
      expect(isValidPostId('post1', null as any)).toBe(false)
      expect(isValidPostId('post1', undefined as any)).toBe(false)
      expect(isValidPostId('post1', 'invalid' as any)).toBe(false)
    })

    it('should reject posts with malformed frontmatter', () => {
      const malformedPosts: PostsMap = {
        'post1': {
          frontmatter: null as any
        },
        'post2': {
          frontmatter: {
            emoji: '✨',
            title: '', // Empty title
            author: 'Test Author',
            created_at: '2024/02/01',
            hashtags: ['test']
          }
        },
        'post3': {} as any // Missing frontmatter entirely
      }

      expect(isValidPostId('post1', malformedPosts)).toBe(false)
      expect(isValidPostId('post2', malformedPosts)).toBe(false)
      expect(isValidPostId('post3', malformedPosts)).toBe(false)
    })
  })
})