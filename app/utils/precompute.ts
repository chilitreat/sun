/**
 * Build-time precomputation utilities for optimal runtime performance
 * These functions should be called during the build process to generate
 * optimized data structures
 */

import { Meta } from '../types'
import { PostsMap } from './filtering'
import { precomputeData, PrecomputedData } from './performance'

/**
 * Global precomputed data cache
 * This will be populated at build time and used at runtime
 */
let globalPrecomputedData: PrecomputedData | null = null

/**
 * Initializes the global precomputed data
 * Should be called once during application startup
 */
export const initializePrecomputedData = (posts: PostsMap): void => {
  try {
    globalPrecomputedData = precomputeData(posts)
  } catch (error) {
    console.error('Error initializing precomputed data:', error)
    // Fallback to empty data structure
    globalPrecomputedData = {
      sortedPosts: [],
      allHashtags: [],
      navigationMap: {},
      hashtagPostsMap: {}
    }
  }
}

/**
 * Gets the global precomputed data
 * Returns null if not initialized
 */
export const getPrecomputedData = (): PrecomputedData | null => {
  return globalPrecomputedData
}

/**
 * Fast lookup for sorted posts using precomputed data
 */
export const getFastSortedPosts = (posts: PostsMap): [string, { frontmatter: Meta }][] => {
  const precomputed = getPrecomputedData()
  if (precomputed && precomputed.sortedPosts.length > 0) {
    // Verify that the precomputed data is still valid
    const currentPostIds = Object.keys(posts).sort()
    const precomputedPostIds = precomputed.sortedPosts.map(([id]) => id).sort()

    if (JSON.stringify(currentPostIds) === JSON.stringify(precomputedPostIds)) {
      return precomputed.sortedPosts
    }
  }

  // Fallback to regular computation if precomputed data is invalid
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
}

/**
 * Fast lookup for all hashtags using precomputed data
 */
export const getFastAllHashtags = (): string[] => {
  const precomputed = getPrecomputedData()
  if (precomputed) {
    return precomputed.allHashtags
  }
  return []
}

/**
 * Fast lookup for post navigation using precomputed data
 */
export const getFastNavigation = (postId: string): {
  previousPost?: { id: string; title: string }
  nextPost?: { id: string; title: string }
} => {
  const precomputed = getPrecomputedData()
  if (precomputed && precomputed.navigationMap[postId]) {
    return precomputed.navigationMap[postId]
  }
  return {}
}

/**
 * Fast lookup for posts by hashtag using precomputed data
 */
export const getFastPostsByHashtag = (hashtag: string, posts: PostsMap): PostsMap => {
  const precomputed = getPrecomputedData()
  if (precomputed && precomputed.hashtagPostsMap[hashtag]) {
    const postIds = precomputed.hashtagPostsMap[hashtag]
    const result: PostsMap = {}

    postIds.forEach(id => {
      if (posts[id]) {
        result[id] = posts[id]
      }
    })

    return result
  }

  // Fallback to regular filtering if precomputed data is not available
  return {}
}

/**
 * Validates that precomputed data is consistent with current posts
 */
export const validatePrecomputedData = (posts: PostsMap): boolean => {
  const precomputed = getPrecomputedData()
  if (!precomputed) {
    return false
  }

  try {
    const currentPostIds = Object.keys(posts).sort()
    const precomputedPostIds = precomputed.sortedPosts.map(([id]) => id).sort()

    return JSON.stringify(currentPostIds) === JSON.stringify(precomputedPostIds)
  } catch (error) {
    console.warn('Error validating precomputed data:', error)
    return false
  }
}

/**
 * Refreshes precomputed data if it's invalid
 */
export const refreshPrecomputedDataIfNeeded = (posts: PostsMap): void => {
  if (!validatePrecomputedData(posts)) {
    console.log('Precomputed data is invalid, refreshing...')
    initializePrecomputedData(posts)
  }
}