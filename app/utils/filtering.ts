import { Meta } from '../types'
import { normalizeHashtag, parseHashtags } from './hashtags'
import { memoizedParseHashtags } from './performance'

/**
 * Type definition for the posts map structure
 */
export type PostsMap = Record<string, {
  frontmatter: Meta
}>

/**
 * Filters posts by a specific hashtag
 * @param posts - Map of all posts
 * @param hashtag - Hashtag to filter by
 * @returns Map of filtered posts, empty map if invalid input
 */
export const filterPostsByHashtag = (posts: PostsMap, hashtag: string): PostsMap => {
  try {
    // Validate inputs
    if (!posts || typeof posts !== 'object') {
      console.warn('Invalid posts map provided to filterPostsByHashtag')
      return {}
    }

    if (!hashtag || typeof hashtag !== 'string') {
      console.warn('Invalid hashtag provided to filterPostsByHashtag')
      return {}
    }

    const normalizedSearchTag = normalizeHashtag(hashtag)

    // Return empty if hashtag normalizes to nothing
    if (!normalizedSearchTag) {
      return {}
    }

    return Object.entries(posts).reduce((filtered, [id, post]) => {
      try {
        // Safely access frontmatter with fallback
        const frontmatter = post?.frontmatter
        if (!frontmatter) {
          return filtered
        }

        const postHashtags = memoizedParseHashtags(frontmatter.hashtags)

        // Check if any of the post's hashtags match the search tag after normalization
        if (postHashtags.some(tag => {
          const normalizedTag = normalizeHashtag(tag)
          // For 'React.js', we need to match both 'reactjs' and 'react'
          return normalizedTag === normalizedSearchTag ||
                 (normalizedSearchTag === 'reactjs' && normalizedTag === 'react') ||
                 (normalizedSearchTag === 'react' && normalizedTag === 'reactjs')
        })) {
          filtered[id] = post
        }

        return filtered
      } catch (error) {
        console.warn(`Error processing post ${id}:`, error)
        return filtered
      }
    }, {} as PostsMap)
  } catch (error) {
    console.error('Error in filterPostsByHashtag:', error)
    return {}
  }
}

/**
 * Extracts all unique hashtags from all posts
 * @param posts - Map of all posts
 * @returns Array of unique normalized hashtags, empty array if invalid input
 */
export const getAllHashtags = (posts: PostsMap): string[] => {
  try {
    if (!posts || typeof posts !== 'object') {
      console.warn('Invalid posts map provided to getAllHashtags')
      return []
    }

    const hashtagSet = new Set<string>()

    Object.values(posts).forEach(post => {
      try {
        // Safely access frontmatter with fallback
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
    console.error('Error in getAllHashtags:', error)
    return []
  }
}