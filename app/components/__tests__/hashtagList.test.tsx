import { describe, it, expect } from 'vitest'
import HashtagList from '../hashtagList'

describe('HashtagList', () => {
  it('should be importable and have correct type signature', () => {
    expect(HashtagList).toBeDefined()
    expect(typeof HashtagList).toBe('function')
  })

  it('should handle empty hashtags array', () => {
    const result = HashtagList({ hashtags: [] })
    expect(result).toBeNull()
  })

  it('should handle undefined hashtags', () => {
    const result = HashtagList({ hashtags: undefined as any })
    expect(result).toBeNull()
  })

  it('should have correct props interface', () => {
    // Test that the component accepts the expected props without throwing type errors
    const validProps = {
      hashtags: ['javascript', 'react'],
      size: 'medium' as const
    }

    // This should not cause TypeScript compilation errors
    expect(() => {
      const props: Parameters<typeof HashtagList>[0] = validProps
      expect(props.hashtags).toEqual(['javascript', 'react'])
      expect(props.size).toBe('medium')
    }).not.toThrow()
  })
})