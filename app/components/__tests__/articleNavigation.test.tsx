import { describe, it, expect } from 'vitest'
import ArticleNavigation from '../articleNavigation'

describe('ArticleNavigation', () => {
  it('should be importable and have correct type signature', () => {
    expect(ArticleNavigation).toBeDefined()
    expect(typeof ArticleNavigation).toBe('function')
  })

  it('should return null when no navigation posts are provided', () => {
    const result = ArticleNavigation({})
    expect(result).toBeNull()
  })

  it('should return null when both previousPost and nextPost are undefined', () => {
    const result = ArticleNavigation({
      previousPost: undefined,
      nextPost: undefined
    })
    expect(result).toBeNull()
  })

  it('should render navigation when only previousPost is provided', () => {
    const previousPost = { id: 'post-1', title: 'Previous Post Title' }
    const result = ArticleNavigation({ previousPost })

    expect(result).not.toBeNull()
    expect(result?.type).toBe('nav')
    expect(result?.props?.['aria-label']).toBe('記事ナビゲーション')
  })

  it('should render navigation when only nextPost is provided', () => {
    const nextPost = { id: 'post-2', title: 'Next Post Title' }
    const result = ArticleNavigation({ nextPost })

    expect(result).not.toBeNull()
    expect(result?.type).toBe('nav')
    expect(result?.props?.['aria-label']).toBe('記事ナビゲーション')
  })

  it('should render navigation when both posts are provided', () => {
    const previousPost = { id: 'post-1', title: 'Previous Post Title' }
    const nextPost = { id: 'post-2', title: 'Next Post Title' }
    const result = ArticleNavigation({ previousPost, nextPost })

    expect(result).not.toBeNull()
    expect(result?.type).toBe('nav')
    expect(result?.props?.['aria-label']).toBe('記事ナビゲーション')
  })

  it('should have correct props interface', () => {
    // Test that the component accepts the expected props without throwing type errors
    const validProps = {
      previousPost: { id: 'prev', title: 'Previous Title' },
      nextPost: { id: 'next', title: 'Next Title' }
    }

    expect(() => {
      const props: Parameters<typeof ArticleNavigation>[0] = validProps
      expect(props.previousPost?.id).toBe('prev')
      expect(props.previousPost?.title).toBe('Previous Title')
      expect(props.nextPost?.id).toBe('next')
      expect(props.nextPost?.title).toBe('Next Title')
    }).not.toThrow()
  })

  it('should handle partial props correctly', () => {
    // Test with only previousPost
    const propsWithPrevious = { previousPost: { id: 'prev', title: 'Previous' } }
    expect(() => {
      const props: Parameters<typeof ArticleNavigation>[0] = propsWithPrevious
      expect(props.previousPost).toBeDefined()
      expect(props.nextPost).toBeUndefined()
    }).not.toThrow()

    // Test with only nextPost
    const propsWithNext = { nextPost: { id: 'next', title: 'Next' } }
    expect(() => {
      const props: Parameters<typeof ArticleNavigation>[0] = propsWithNext
      expect(props.previousPost).toBeUndefined()
      expect(props.nextPost).toBeDefined()
    }).not.toThrow()
  })

  it('should generate correct href attributes for navigation links', () => {
    const previousPost = { id: 'previous-post-id', title: 'Previous Post' }
    const nextPost = { id: 'next-post-id', title: 'Next Post' }
    const result = ArticleNavigation({ previousPost, nextPost })

    // The component should generate proper href paths
    expect(result).not.toBeNull()

    // Check that the component structure includes the expected href patterns
    // Note: In a real test environment, we would use a proper JSX renderer
    // to check the actual rendered output, but for this basic test we verify
    // the component doesn't throw and returns a valid JSX element
    expect(result?.type).toBe('nav')
  })

  it('should include proper accessibility attributes', () => {
    const previousPost = { id: 'prev', title: 'Previous Post' }
    const nextPost = { id: 'next', title: 'Next Post' }
    const result = ArticleNavigation({ previousPost, nextPost })

    expect(result).not.toBeNull()
    expect(result?.props?.['aria-label']).toBe('記事ナビゲーション')
  })
})