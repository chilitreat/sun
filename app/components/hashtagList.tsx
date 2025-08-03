import type { FC } from 'hono/jsx'
import { generateHashtagUrl } from '../utils/hashtags'
import { TwitterShareButton } from 'react-share'

type HashtagListProps = {
  hashtags: string[]
  size?: 'small' | 'medium' | 'large'
}

const HashtagList: FC<HashtagListProps> = ({ hashtags, size = 'medium' }) => {
  if (!hashtags || hashtags.length === 0) {
    return null
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xs px-2 py-1'
      case 'large':
        return 'text-base px-4 py-2'
      default:
        return 'text-sm px-3 py-1'
    }
  }

  const baseClasses = 'inline-block bg-gray-100 text-gray-700 rounded-full no-underline font-medium transition-all duration-200 border border-transparent hover:bg-blue-500 hover:text-white hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:translate-y-0'
  const sizeClasses = getSizeClasses()
  const combinedClasses = `${baseClasses} ${sizeClasses}`

  return (
    <div class="flex flex-wrap gap-2 my-2">
      {hashtags.map((hashtag) => (
        <a
          key={hashtag}
          href={`/hashtag/${generateHashtagUrl(hashtag)}`}
          class={combinedClasses}
          role="button"
          tabIndex={0}
          aria-label={`Filter posts by hashtag: ${hashtag}`}
        >
          #{hashtag}
        </a>
      ))}
      <TwitterShareButton
        url={window.location.href}
        title={"Check out this blog post!"}
        class="mt-2 inline-block"
      >
        Share on Twitter
      </TwitterShareButton>
    </div>
  )
}

export default HashtagList