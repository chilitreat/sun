import { css } from 'hono/css'
import type { FC } from 'hono/jsx'

type ArticleNavigationProps = {
  previousPost?: { id: string; title: string }
  nextPost?: { id: string; title: string }
}

const navigationContainerClass = css`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`

const navigationLinkClass = css`
  display: inline-block;
  text-decoration: none;
  color: rgb(55 65 81);
  transition: color 0.2s ease;
  white-space: nowrap;
  padding: 0.5rem 1rem;

  &:hover {
    color: rgb(59 130 246);
  }

  &:focus {
    outline: 2px solid rgb(59 130 246);
    outline-offset: 2px;
    border-radius: 0.25rem;
  }
`

const navigationLabelClass = css`
  font-size: 0.875rem;
  font-weight: 500;
  color: inherit;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const ArticleNavigation: FC<ArticleNavigationProps> = ({ previousPost, nextPost }) => {
  // Don't render if no navigation is available
  if (!previousPost && !nextPost) {
    return null
  }

  return (
    <nav class={navigationContainerClass} aria-label="記事ナビゲーション">
      {previousPost ? (
        <a
          href={`/posts/${previousPost.id.replace(/\.mdx$/, '').replace('../posts/', '')}`}
          // class={previousLinkClass}
          aria-label={`前の記事: ${previousPost.title}`}
        >
          <span class={navigationLabelClass}>← 前の記事</span>
        </a>
      ) : (
        <div aria-hidden="true"></div>
      )}

      {nextPost ? (
        <a
          href={`/posts/${nextPost.id.replace(/\.mdx$/, '').replace('../posts/', '')}`}
          // class={nextLinkClass}
          aria-label={`次の記事: ${nextPost.title}`}
        >
          <span class={navigationLabelClass}>次の記事 →</span>
        </a>
      ) : (
        <div aria-hidden="true"></div>
      )}
    </nav>
  )
}

export default ArticleNavigation