import type { FC } from 'hono/jsx'

type ArticleNavigationProps = {
  previousPost?: { id: string; title: string }
  nextPost?: { id: string; title: string }
}

const ArticleNavigation: FC<ArticleNavigationProps> = ({ previousPost, nextPost }) => {
  // Don't render if no navigation is available
  if (!previousPost && !nextPost) {
    return null
  }

  return (
    <nav 
      class="flex justify-between items-center md:flex-row flex-col md:gap-0 gap-4 md:items-center items-stretch" 
      aria-label="記事ナビゲーション"
    >
      {previousPost ? (
        <a
          href={`/posts/${previousPost.id.replace(/\.mdx$/, '').replace('../posts/', '')}`}
          class="inline-block no-underline text-gray-700 transition-colors duration-200 whitespace-nowrap p-2 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded"
          aria-label={`前の記事: ${previousPost.title}`}
        >
          <span class="text-sm font-medium uppercase tracking-wide">← 前の記事</span>
        </a>
      ) : (
        <div aria-hidden="true"></div>
      )}

      {nextPost ? (
        <a
          href={`/posts/${nextPost.id.replace(/\.mdx$/, '').replace('../posts/', '')}`}
          class="inline-block no-underline text-gray-700 transition-colors duration-200 whitespace-nowrap p-2 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded"
          aria-label={`次の記事: ${nextPost.title}`}
        >
          <span class="text-sm font-medium uppercase tracking-wide">次の記事 →</span>
        </a>
      ) : (
        <div aria-hidden="true"></div>
      )}
    </nav>
  )
}

export default ArticleNavigation