import { describe, it, expect } from 'vitest'
import { filterPostsByHashtag, getAllHashtags, PostsMap } from '../filtering'

describe('filterPostsByHashtag', () => {
  const testPosts: PostsMap = {
    'post1': {
      frontmatter: {
        emoji: '👋',
        title: 'First Post',
        author: 'Author 1',
        created_at: '2024/01/01',
        hashtags: ['javascript', 'react']
      }
    },
    'post2': {
      frontmatter: {
        emoji: '🚀',
        title: 'Second Post',
        author: 'Author 2',
        created_at: '2024/01/02',
        hashtags: 'typescript,react'
      }
    },
    'post3': {
      frontmatter: {
        emoji: '🔥',
        title: 'Third Post',
        author: 'Author 3',
        created_at: '2024/01/03',
        hashtags: ['vue', 'javascript']
      }
    },
    'post4': {
      frontmatter: {
        emoji: '💻',
        title: 'Fourth Post',
        author: 'Author 4',
        created_at: '2024/01/04'
        // No hashtags
      }
    },
    'post5': {
      frontmatter: {
        emoji: '📱',
        title: 'Fifth Post',
        author: 'Author 5',
        created_at: '2024/01/05',
        hashtags: ['React.js', 'JSX'] // Case and special chars
      }
    }
  }

  it('should filter posts by hashtag', () => {
    const filtered = filterPostsByHashtag(testPosts, 'javascript')
    expect(Object.keys(filtered)).toHaveLength(2)
    expect(filtered).toHaveProperty('post1')
    expect(filtered).toHaveProperty('post3')
  })

  it('should handle case insensitivity', () => {
    const filtered = filterPostsByHashtag(testPosts, 'JavaScript')
    expect(Object.keys(filtered)).toHaveLength(2)
    expect(filtered).toHaveProperty('post1')
    expect(filtered).toHaveProperty('post3')
  })

  it('should normalize hashtags before filtering', () => {
    const filtered = filterPostsByHashtag(testPosts, 'React.js')
    expect(Object.keys(filtered)).toHaveLength(3)
    expect(filtered).toHaveProperty('post1')
    expect(filtered).toHaveProperty('post2')
    expect(filtered).toHaveProperty('post5')
  })

  it('should handle string format hashtags', () => {
    const filtered = filterPostsByHashtag(testPosts, 'typescript')
    expect(Object.keys(filtered)).toHaveLength(1)
    expect(filtered).toHaveProperty('post2')
  })

  it('should return empty object when no matches found', () => {
    const filtered = filterPostsByHashtag(testPosts, 'angular')
    expect(Object.keys(filtered)).toHaveLength(0)
  })

  it('should handle posts without hashtags', () => {
    const filtered = filterPostsByHashtag(testPosts, '')
    expect(Object.keys(filtered)).toHaveLength(0)
  })
})

describe('getAllHashtags', () => {
  const testPosts: PostsMap = {
    'post1': {
      frontmatter: {
        emoji: '👋',
        title: 'First Post',
        author: 'Author 1',
        created_at: '2024/01/01',
        hashtags: ['javascript', 'react']
      }
    },
    'post2': {
      frontmatter: {
        emoji: '🚀',
        title: 'Second Post',
        author: 'Author 2',
        created_at: '2024/01/02',
        hashtags: 'typescript,react'
      }
    },
    'post3': {
      frontmatter: {
        emoji: '🔥',
        title: 'Third Post',
        author: 'Author 3',
        created_at: '2024/01/03',
        hashtags: ['vue', 'JavaScript'] // Duplicate with different case
      }
    },
    'post4': {
      frontmatter: {
        emoji: '💻',
        title: 'Fourth Post',
        author: 'Author 4',
        created_at: '2024/01/04'
        // No hashtags
      }
    }
  }

  it('should extract all unique hashtags', () => {
    const hashtags = getAllHashtags(testPosts)
    expect(hashtags).toHaveLength(4)
    expect(hashtags).toContain('javascript')
    expect(hashtags).toContain('react')
    expect(hashtags).toContain('typescript')
    expect(hashtags).toContain('vue')
  })

  it('should normalize and deduplicate hashtags', () => {
    const hashtags = getAllHashtags(testPosts)
    // Should only have one 'javascript' entry despite case differences
    expect(hashtags.filter(tag => tag === 'javascript')).toHaveLength(1)
  })

  it('should return sorted hashtags', () => {
    const hashtags = getAllHashtags(testPosts)
    const sortedCopy = [...hashtags].sort()
    expect(hashtags).toEqual(sortedCopy)
  })

  it('should handle empty posts', () => {
    const hashtags = getAllHashtags({})
    expect(hashtags).toHaveLength(0)
  })

  it('should handle posts without hashtags', () => {
    const hashtags = getAllHashtags({
      'post': {
        frontmatter: {
          emoji: '💻',
          title: 'Post',
          author: 'Author',
          created_at: '2024/01/01'
        }
      }
    })
    expect(hashtags).toHaveLength(0)
  })
})

describe('filterPostsByHashtag error handling', () => {
  it('should handle invalid posts input', () => {
    expect(filterPostsByHashtag(null as any, 'javascript')).toEqual({})
    expect(filterPostsByHashtag(undefined as any, 'javascript')).toEqual({})
    expect(filterPostsByHashtag('invalid' as any, 'javascript')).toEqual({})
  })

  it('should handle invalid hashtag input', () => {
    const testPosts = {
      'post1': {
        frontmatter: {
          emoji: '👋',
          title: 'First Post',
          author: 'Author 1',
          created_at: '2024/01/01',
          hashtags: ['javascript']
        }
      }
    }

    expect(filterPostsByHashtag(testPosts, null as any)).toEqual({})
    expect(filterPostsByHashtag(testPosts, undefined as any)).toEqual({})
    expect(filterPostsByHashtag(testPosts, '')).toEqual({})
    expect(filterPostsByHashtag(testPosts, '   ')).toEqual({})
  })

  it('should handle posts with malformed frontmatter', () => {
    const testPosts = {
      'post1': {
        frontmatter: null
      },
      'post2': {
        frontmatter: {
          emoji: '👋',
          title: 'Valid Post',
          author: 'Author',
          created_at: '2024/01/01',
          hashtags: ['javascript']
        }
      },
      'post3': {} // Missing frontmatter entirely
    } as any

    const filtered = filterPostsByHashtag(testPosts, 'javascript')
    expect(Object.keys(filtered)).toHaveLength(1)
    expect(filtered).toHaveProperty('post2')
  })
})

describe('getAllHashtags error handling', () => {
  it('should handle invalid posts input', () => {
    expect(getAllHashtags(null as any)).toEqual([])
    expect(getAllHashtags(undefined as any)).toEqual([])
    expect(getAllHashtags('invalid' as any)).toEqual([])
  })

  it('should handle posts with malformed frontmatter', () => {
    const testPosts = {
      'post1': {
        frontmatter: null
      },
      'post2': {
        frontmatter: {
          emoji: '👋',
          title: 'Valid Post',
          author: 'Author',
          created_at: '2024/01/01',
          hashtags: ['javascript', 'react']
        }
      },
      'post3': {} // Missing frontmatter entirely
    } as any

    const hashtags = getAllHashtags(testPosts)
    expect(hashtags).toEqual(['javascript', 'react'])
  })

  it('should handle posts with invalid hashtag data', () => {
    const testPosts = {
      'post1': {
        frontmatter: {
          emoji: '👋',
          title: 'Post with invalid hashtags',
          author: 'Author',
          created_at: '2024/01/01',
          hashtags: 123 // Invalid type
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
    } as any

    const hashtags = getAllHashtags(testPosts)
    expect(hashtags).toEqual(['javascript'])
  })
})