import { Meta, PostWithNavigation } from '../types'
import { PostsMap } from './filtering'
import { memoizedSortPostsByDate, clearMemoCache } from './performance'

// Local memoization cache for navigation functions
const navigationMemoCache = new Map<string, any>()

/**
 * Simple memoization function for navigation utilities
 */
function memoizeNavigation<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args)

    if (navigationMemoCache.has(key)) {
      return navigationMemoCache.get(key)
    }

    const result = fn(...args)
    navigationMemoCache.set(key, result)
    return result
  }) as T
}

/**
 * Sorts posts by created_at date in descending order (newest first)
 * @param posts - Map of posts to sort
 * @returns Array of sorted post entries [id, post], empty array if invalid input
 */
const sortPostsByDate = (posts: PostsMap): [string, { frontmatter: Meta }][] => {
  try {
    if (!posts || typeof posts !== 'object') {
      console.warn('Invalid posts map provided to sortPostsByDate')
      return []
    }

    return Object.entries(posts)
      .filter(([id, post]) => {
        // Filter out posts with invalid structure
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

          // Handle invalid dates
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
    console.error('Error in sortPostsByDate:', error)
    return []
  }
}

/**
 * Internal function to find adjacent posts (non-memoized)
 */
const findAdjacentPostsInternal = (currentId: string, posts: PostsMap): {
  previousPost?: { id: string; title: string }
  nextPost?: { id: string; title: string }
} => {
  try {
    // Validate inputs
    if (!currentId || typeof currentId !== 'string') {
      console.warn('Invalid currentId provided to findAdjacentPosts')
      return {}
    }

    if (!posts || typeof posts !== 'object') {
      console.warn('Invalid posts map provided to findAdjacentPosts')
      return {}
    }

    // Sort posts by date (newest first)
    const sortedPosts = memoizedSortPostsByDate(posts)

    // Handle empty posts array
    if (sortedPosts.length === 0) {
      return {}
    }

    // Find the index of the current post
    const currentIndex = sortedPosts.findIndex(([id]) => id === currentId)

    // If post not found or invalid index, return empty result
    if (currentIndex === -1) {
      console.warn(`Post with ID ${currentId} not found in posts map`)
      return {}
    }

    const result: {
      previousPost?: { id: string; title: string }
      nextPost?: { id: string; title: string }
    } = {}

    // Previous post is the next one in the sorted array (newer post)
    if (currentIndex > 0) {
      try {
        const [prevId, prevPost] = sortedPosts[currentIndex - 1]
        if (prevPost?.frontmatter?.title) {
          result.previousPost = {
            id: prevId,
            title: prevPost.frontmatter.title
          }
        }
      } catch (error) {
        console.warn('Error getting previous post:', error)
      }
    }

    // Next post is the previous one in the sorted array (older post)
    if (currentIndex < sortedPosts.length - 1) {
      try {
        const [nextId, nextPost] = sortedPosts[currentIndex + 1]
        if (nextPost?.frontmatter?.title) {
          result.nextPost = {
            id: nextId,
            title: nextPost.frontmatter.title
          }
        }
      } catch (error) {
        console.warn('Error getting next post:', error)
      }
    }

    return result
  } catch (error) {
    console.error('Error in findAdjacentPosts:', error)
    return {}
  }
}

/**
 * Memoized version of findAdjacentPosts
 */
const memoizedFindAdjacentPosts = memoizeNavigation(
  findAdjacentPostsInternal,
  (currentId, posts) => `adjacentPosts:${currentId}:${posts && typeof posts === 'object' ? Object.keys(posts).sort().join(',') : 'invalid'}`
)

/**
 * Finds the previous and next posts relative to the current post
 * @param currentId - ID of the current post
 * @param posts - Map of all posts
 * @returns Object containing previous and next post information, empty object if error
 */
export const findAdjacentPosts = memoizedFindAdjacentPosts

/**
 * Adds navigation information to all posts
 * @param posts - Map of all posts
 * @returns Array of posts with navigation information, empty array if error
 */
export const getPostsWithNavigation = (posts: PostsMap): PostWithNavigation[] => {
  try {
    if (!posts || typeof posts !== 'object') {
      console.warn('Invalid posts map provided to getPostsWithNavigation')
      return []
    }

    // Sort posts by date (newest first)
    const sortedPosts = memoizedSortPostsByDate(posts)

    // Handle empty posts array
    if (sortedPosts.length === 0) {
      return []
    }

    // Transform to PostWithNavigation array
    return sortedPosts.map(([id, post], index) => {
      try {
        const navigation: PostWithNavigation = {
          id,
          frontmatter: post.frontmatter,
        }

        // Add previous post (newer post)
        if (index > 0) {
          try {
            const [prevId, prevPost] = sortedPosts[index - 1]
            if (prevPost?.frontmatter?.title) {
              navigation.previousPost = {
                id: prevId,
                title: prevPost.frontmatter.title
              }
            }
          } catch (error) {
            console.warn(`Error adding previous post for ${id}:`, error)
          }
        }

        // Add next post (older post)
        if (index < sortedPosts.length - 1) {
          try {
            const [nextId, nextPost] = sortedPosts[index + 1]
            if (nextPost?.frontmatter?.title) {
              navigation.nextPost = {
                id: nextId,
                title: nextPost.frontmatter.title
              }
            }
          } catch (error) {
            console.warn(`Error adding next post for ${id}:`, error)
          }
        }

        return navigation
      } catch (error) {
        console.warn(`Error processing navigation for post ${id}:`, error)
        // Return minimal navigation object on error
        return {
          id,
          frontmatter: post?.frontmatter || {
            emoji: '📝',
            title: 'Untitled',
            author: 'Unknown',
            created_at: 'Unknown',
            hashtags: []
          }
        }
      }
    })
  } catch (error) {
    console.error('Error in getPostsWithNavigation:', error)
    return []
  }
}

/**
 * Clears the navigation memoization cache
 */
export const clearNavigationMemoCache = (): void => {
  navigationMemoCache.clear()
}

/**
 * Validates if a post ID exists in the posts map
 * @param postId - ID of the post to validate
 * @param posts - Map of all posts
 * @returns True if post exists and is valid, false otherwise
 */
export const isValidPostId = (postId: string, posts: PostsMap): boolean => {
  try {
    if (!postId || typeof postId !== 'string') {
      return false
    }

    if (!posts || typeof posts !== 'object') {
      return false
    }

    const post = posts[postId]
    return !!(post && post.frontmatter && post.frontmatter.title)
  } catch (error) {
    console.warn('Error validating post ID:', error)
    return false
  }
}