/**
 * Performance optimization utilities for the blog application
 * Provides memoization and caching for expensive operations
 */

import { Meta } from '../types'
import { PostsMap } from './filtering'
import { parseHashtags, normalizeHashtag } from './hashtags'

// LRU Cache implementation for memory leak prevention
const MAX_CACHE_SIZE = 500 // Configurable cache size limit
const memoCache = new Map<string, any>()

/**
 * LRU cache eviction when size exceeds limit
 */
function evictLRUCache(): void {
  if (memoCache.size >= MAX_CACHE_SIZE) {
    const firstKey = memoCache.keys().next().value
    if (firstKey) {
      memoCache.delete(firstKey)
    }
  }
}

/**
 * Memory-safe memoization function with LRU cache
 * @param fn - Function to memoize
 * @param keyGenerator - Function to generate cache key from arguments
 * @returns Memoized function with memory management
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args)

    if (memoCache.has(key)) {
      // Move to end (most recently used)
      const value = memoCache.get(key)
      memoCache.delete(key)
      memoCache.set(key, value)
      return value
    }

    // Evict LRU entry if cache is full
    evictLRUCache()

    const result = fn(...args)
    memoCache.set(key, result)
    return result
  }) as T
}

/**
 * Clears the memoization cache
 * Should be called when posts data changes
 */
export const clearMemoCache = (): void => {
  memoCache.clear()
}

/**
 * Memoized version of parseHashtags for better performance
 */
export const memoizedParseHashtags = memoize(
  parseHashtags,
  (hashtags) => `parseHashtags:${JSON.stringify(hashtags)}`
)

/**
 * Memoized post sorting by date
 */
export const memoizedSortPostsByDate = memoize(
  (posts: PostsMap): [string, { frontmatter: Meta }][] => {
    try {
      if (!posts || typeof posts !== 'object') {
        return []
      }

      return Object.entries(posts)
        .filter(([id, post]) => {
          try {
            return post &&
                   post.frontmatter &&
                   typeof post.frontmatter.created_at === 'string' &&
                   post.frontmatter.created_at.trim().length > 0 &&
                   typeof post.frontmatter.title === 'string' &&
                   post.frontmatter.title.trim().length > 0
          } catch (error) {
            console.warn(`Invalid post structure for ${id}:`, error)
            return false
          }
        })
        .sort((a, b) => {
          try {
            const dateA = new Date(a[1].frontmatter.created_at).getTime()
            const dateB = new Date(b[1].frontmatter.created_at).getTime()

            if (isNaN(dateA) && isNaN(dateB)) return 0
            if (isNaN(dateA)) return 1
            if (isNaN(dateB)) return -1

            return dateB - dateA // Descending order (newest first)
          } catch (error) {
            console.warn('Error sorting posts by date:', error)
            return 0
          }
        })
    } catch (error) {
      console.error('Error in memoizedSortPostsByDate:', error)
      return []
    }
  },
  (posts) => `sortPostsByDate:${posts && typeof posts === 'object' ? Object.keys(posts).sort().join(',') : 'invalid'}`
)

/**
 * Memoized hashtag extraction from all posts
 */
export const memoizedGetAllHashtags = memoize(
  (posts: PostsMap): string[] => {
    try {
      if (!posts || typeof posts !== 'object') {
        return []
      }

      const hashtagSet = new Set<string>()

      Object.values(posts).forEach(post => {
        try {
          const frontmatter = post?.frontmatter
          if (!frontmatter) {
            return
          }

          const postHashtags = memoizedParseHashtags(frontmatter.hashtags)
          postHashtags.forEach(tag => {
            const normalized = normalizeHashtag(tag)
            if (normalized) {
              hashtagSet.add(normalized)
            }
          })
        } catch (error) {
          console.warn('Error processing post hashtags:', error)
        }
      })

      return Array.from(hashtagSet).sort()
    } catch (error) {
      console.error('Error in memoizedGetAllHashtags:', error)
      return []
    }
  },
  (posts) => `getAllHashtags:${posts && typeof posts === 'object' ? Object.keys(posts).sort().join(',') : 'invalid'}`
)

// Note: memoizedFindAdjacentPosts is defined in navigation.ts to avoid circular dependency

/**
 * Pre-computed data structure for better performance
 */
export interface PrecomputedData {
  sortedPosts: [string, { frontmatter: Meta }][]
  allHashtags: string[]
  navigationMap: Record<string, {
    previousPost?: { id: string; title: string }
    nextPost?: { id: string; title: string }
  }>
  hashtagPostsMap: Record<string, string[]>
}

/**
 * Pre-computes expensive operations for better runtime performance
 * Should be called once when the application starts or when posts change
 */
export const precomputeData = (posts: PostsMap): PrecomputedData => {
  try {
    // Sort posts once
    const sortedPosts = memoizedSortPostsByDate(posts)

    // Get all hashtags once
    const allHashtags = memoizedGetAllHashtags(posts)

    // Pre-compute navigation for all posts
    const navigationMap: Record<string, {
      previousPost?: { id: string; title: string }
      nextPost?: { id: string; title: string }
    }> = {}

    // We'll compute navigation directly here to avoid circular dependency
    sortedPosts.forEach(([id], index) => {
      const navigation: {
        previousPost?: { id: string; title: string }
        nextPost?: { id: string; title: string }
      } = {}

      // Previous post (newer post)
      if (index > 0) {
        const [prevId, prevPost] = sortedPosts[index - 1]
        if (prevPost?.frontmatter?.title) {
          navigation.previousPost = {
            id: prevId,
            title: prevPost.frontmatter.title
          }
        }
      }

      // Next post (older post)
      if (index < sortedPosts.length - 1) {
        const [nextId, nextPost] = sortedPosts[index + 1]
        if (nextPost?.frontmatter?.title) {
          navigation.nextPost = {
            id: nextId,
            title: nextPost.frontmatter.title
          }
        }
      }

      navigationMap[id] = navigation
    })

    // Pre-compute hashtag to posts mapping
    const hashtagPostsMap: Record<string, string[]> = {}

    allHashtags.forEach(hashtag => {
      hashtagPostsMap[hashtag] = []
    })

    if (posts && typeof posts === 'object') {
      Object.entries(posts).forEach(([id, post]) => {
      try {
        const frontmatter = post?.frontmatter
        if (!frontmatter) {
          return
        }

        const postHashtags = memoizedParseHashtags(frontmatter.hashtags)
        postHashtags.forEach(tag => {
          const normalized = normalizeHashtag(tag)
          if (normalized && hashtagPostsMap[normalized]) {
            hashtagPostsMap[normalized].push(id)
          }
        })
      } catch (error) {
        console.warn(`Error processing hashtags for post ${id}:`, error)
      }
    })
    }

    return {
      sortedPosts,
      allHashtags,
      navigationMap,
      hashtagPostsMap
    }
  } catch (error) {
    console.error('Error in precomputeData:', error)
    return {
      sortedPosts: [],
      allHashtags: [],
      navigationMap: {},
      hashtagPostsMap: {}
    }
  }
}

/**
 * Debounced function creator for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttled function creator for performance optimization
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}