/**
 * Normalizes a hashtag by converting to lowercase and removing special characters
 * @param hashtag - The hashtag string to normalize
 * @returns Normalized hashtag string, empty string if invalid
 */
export const normalizeHashtag = (hashtag: string): string => {
  // Handle null, undefined, or non-string inputs
  if (!hashtag || typeof hashtag !== 'string') {
    return ''
  }

  const normalized = hashtag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/gi, '') // Allow alphanumeric and Japanese characters

  // Return empty string if the result is empty or too short
  return normalized.length > 0 ? normalized : ''
}

/**
 * Parses hashtags from various input formats (string, array, or undefined)
 * @param hashtags - Input hashtags in various formats
 * @returns Array of normalized hashtag strings, empty array if invalid
 */
export const parseHashtags = (hashtags: string[] | string | undefined): string[] => {
  try {
    if (!hashtags) {
      return []
    }

    if (typeof hashtags === 'string') {
      // Handle comma-separated string or single hashtag
      return hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(normalizeHashtag)
        .filter(tag => tag.length > 0) // Filter out invalid normalized tags
    }

    if (Array.isArray(hashtags)) {
      return hashtags
        .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
        .map(normalizeHashtag)
        .filter(tag => tag.length > 0) // Filter out invalid normalized tags
    }

    // Handle unexpected types gracefully
    return []
  } catch (error) {
    // Log error in development but don't crash
    console.warn('Error parsing hashtags:', error)
    return []
  }
}

/**
 * Generates a URL-safe hashtag string for routing
 * @param hashtag - The hashtag to convert to URL format
 * @returns URL-safe hashtag string, empty string if invalid
 */
export const generateHashtagUrl = (hashtag: string): string => {
  try {
    const normalized = normalizeHashtag(hashtag)
    if (!normalized) {
      return ''
    }
    return encodeURIComponent(normalized)
  } catch (error) {
    console.warn('Error generating hashtag URL:', error)
    return ''
  }
}

/**
 * Validates if a hashtag string is valid
 * @param hashtag - The hashtag to validate
 * @returns True if valid, false otherwise
 */
export const isValidHashtag = (hashtag: string): boolean => {
  if (!hashtag || typeof hashtag !== 'string') {
    return false
  }

  const normalized = normalizeHashtag(hashtag)
  return normalized.length > 0 && normalized.length <= 50 // Reasonable length limit
}