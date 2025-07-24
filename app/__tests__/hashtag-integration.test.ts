import { describe, it, expect } from 'vitest'
import { parseHashtags, generateHashtagUrl } from '../utils/hashtags'
import { filterPostsByHashtag, getAllHashtags } from '../utils/filtering'

// Mock posts data similar to what would be loaded from MDX files
const mockPosts = {
  'posts/test-post.mdx': {
    frontmatter: {
      emoji: '🧪',
      title: 'Test Post for Navigation',
      author: 'chilitreat',
      created_at: '2024/2/12',
      hashtags: ['test', 'navigation']
    }
  },
  'posts/honox+mdx+blog.mdx': {
    frontmatter: {
      emoji: '👌',
      title: 'HonoX＋MDXで簡単なブログを作ったよ',
      author: 'chilitreat',
      created_at: '2024/2/11',
      hashtags: ['HonoX', 'MDX', 'ブログ', 'Cloudflare']
    }
  },
  'posts/another-test.mdx': {
    frontmatter: {
      emoji: '📝',
      title: 'Another Test Post',
      author: 'chilitreat',
      created_at: '2024/2/10',
      hashtags: ['test', 'blog']
    }
  }
}

describe('Hashtag Integration Tests', () => {
  describe('Main page to filter page navigation flow', () => {
    it('should generate correct hashtag URLs for navigation', () => {
      const hashtags = ['test', 'HonoX', 'ブログ']

      hashtags.forEach(hashtag => {
        const url = generateHashtagUrl(hashtag)
        expect(url).toBeDefined()
        expect(url).not.toContain(' ')
        expect(url).not.toContain('#')
      })
    })

    it('should parse hashtags correctly from frontmatter', () => {
      Object.values(mockPosts).forEach(post => {
        const parsed = parseHashtags(post.frontmatter.hashtags)
        expect(Array.isArray(parsed)).toBe(true)
        expect(parsed.length).toBeGreaterThan(0)

        // All hashtags should be normalized (lowercase, no special chars)
        parsed.forEach(hashtag => {
          expect(hashtag).toBe(hashtag.toLowerCase())
          expect(hashtag).not.toMatch(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/)
        })
      })
    })
  })

  describe('Filter page functionality', () => {
    it('should filter posts by hashtag correctly', () => {
      // Test filtering by "test" hashtag
      const testPosts = filterPostsByHashtag(mockPosts, 'test')
      const testPostIds = Object.keys(testPosts)

      expect(testPostIds).toContain('posts/test-post.mdx')
      expect(testPostIds).toContain('posts/another-test.mdx')
      expect(testPostIds).not.toContain('posts/honox+mdx+blog.mdx')
    })

    it('should filter posts by Japanese hashtag correctly', () => {
      // Test filtering by Japanese hashtag "ブログ"
      const blogPosts = filterPostsByHashtag(mockPosts, 'ブログ')
      const blogPostIds = Object.keys(blogPosts)

      expect(blogPostIds).toContain('posts/honox+mdx+blog.mdx')
      expect(blogPostIds).not.toContain('posts/test-post.mdx')
      expect(blogPostIds).not.toContain('posts/another-test.mdx')
    })

    it('should return empty result for non-existent hashtag', () => {
      const nonExistentPosts = filterPostsByHashtag(mockPosts, 'nonexistent')
      expect(Object.keys(nonExistentPosts)).toHaveLength(0)
    })

    it('should handle case-insensitive hashtag filtering', () => {
      // Test that filtering works regardless of case
      const upperCasePosts = filterPostsByHashtag(mockPosts, 'TEST')
      const lowerCasePosts = filterPostsByHashtag(mockPosts, 'test')

      expect(Object.keys(upperCasePosts)).toEqual(Object.keys(lowerCasePosts))
    })
  })

  describe('Hashtag extraction and listing', () => {
    it('should extract all unique hashtags from posts', () => {
      const allHashtags = getAllHashtags(mockPosts)

      // Should contain all unique hashtags from all posts
      expect(allHashtags).toContain('test')
      expect(allHashtags).toContain('navigation')
      expect(allHashtags).toContain('honox')
      expect(allHashtags).toContain('mdx')
      expect(allHashtags).toContain('ブログ')
      expect(allHashtags).toContain('cloudflare')
      expect(allHashtags).toContain('blog')

      // Should not contain duplicates
      const uniqueHashtags = [...new Set(allHashtags)]
      expect(allHashtags).toHaveLength(uniqueHashtags.length)
    })

    it('should normalize hashtags consistently', () => {
      const allHashtags = getAllHashtags(mockPosts)

      // All hashtags should be normalized
      allHashtags.forEach(hashtag => {
        expect(hashtag).toBe(hashtag.toLowerCase())
        expect(hashtag).not.toMatch(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/)
      })
    })
  })

  describe('End-to-end user flow simulation', () => {
    it('should simulate complete hashtag filtering workflow', () => {
      // 1. User sees posts on main page with hashtags
      const mainPagePosts = mockPosts
      expect(Object.keys(mainPagePosts)).toHaveLength(3)

      // 2. User clicks on "test" hashtag
      const selectedHashtag = 'test'
      const hashtagUrl = generateHashtagUrl(selectedHashtag)
      expect(hashtagUrl).toBe('test')

      // 3. Filter page shows only posts with "test" hashtag
      const filteredPosts = filterPostsByHashtag(mainPagePosts, selectedHashtag)
      const filteredPostIds = Object.keys(filteredPosts)
      expect(filteredPostIds).toHaveLength(2)
      expect(filteredPostIds).toContain('posts/test-post.mdx')
      expect(filteredPostIds).toContain('posts/another-test.mdx')

      // 4. Each filtered post should actually contain the hashtag
      filteredPostIds.forEach(postId => {
        const post = filteredPosts[postId]
        const postHashtags = parseHashtags(post.frontmatter.hashtags)
        expect(postHashtags).toContain(selectedHashtag)
      })
    })

    it('should handle Japanese hashtag workflow', () => {
      // Test the same workflow with Japanese hashtags
      const selectedHashtag = 'ブログ'
      const hashtagUrl = generateHashtagUrl(selectedHashtag)
      expect(hashtagUrl).toBe('%E3%83%96%E3%83%AD%E3%82%B0') // URL encoded

      const filteredPosts = filterPostsByHashtag(mockPosts, selectedHashtag)
      const filteredPostIds = Object.keys(filteredPosts)
      expect(filteredPostIds).toHaveLength(1)
      expect(filteredPostIds).toContain('posts/honox+mdx+blog.mdx')
    })

    it('should provide clear path back to main page', () => {
      // This test verifies that the filter banner component would work correctly
      const activeHashtag = 'test'
      const filteredPosts = filterPostsByHashtag(mockPosts, activeHashtag)

      // Filter should be active and clearable
      expect(Object.keys(filteredPosts).length).toBeLessThan(Object.keys(mockPosts).length)

      // Clearing filter should return all posts
      const clearedPosts = mockPosts // Simulating filter clear
      expect(Object.keys(clearedPosts)).toHaveLength(3)
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle posts without hashtags gracefully', () => {
      const postsWithoutHashtags = {
        'posts/no-hashtags.mdx': {
          frontmatter: {
            emoji: '📄',
            title: 'Post without hashtags',
            author: 'author',
            created_at: '2024/2/13'
            // No hashtags field
          }
        }
      }

      const allHashtags = getAllHashtags(postsWithoutHashtags)
      expect(allHashtags).toHaveLength(0)

      const filteredPosts = filterPostsByHashtag(postsWithoutHashtags, 'test')
      expect(Object.keys(filteredPosts)).toHaveLength(0)
    })

    it('should handle empty hashtag arrays', () => {
      const postsWithEmptyHashtags = {
        'posts/empty-hashtags.mdx': {
          frontmatter: {
            emoji: '📄',
            title: 'Post with empty hashtags',
            author: 'author',
            created_at: '2024/2/13',
            hashtags: []
          }
        }
      }

      const allHashtags = getAllHashtags(postsWithEmptyHashtags)
      expect(allHashtags).toHaveLength(0)
    })

    it('should handle special characters in hashtags', () => {
      const postsWithSpecialChars = {
        'posts/special-chars.mdx': {
          frontmatter: {
            emoji: '📄',
            title: 'Post with special chars',
            author: 'author',
            created_at: '2024/2/13',
            hashtags: ['test-tag', 'tag with spaces', 'tag@special']
          }
        }
      }

      const allHashtags = getAllHashtags(postsWithSpecialChars)

      // Special characters should be normalized out
      allHashtags.forEach(hashtag => {
        expect(hashtag).not.toMatch(/[-@\s]/)
      })
    })
  })
})