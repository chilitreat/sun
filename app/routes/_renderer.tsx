import { jsxRenderer } from 'hono/jsx-renderer';
import HashtagList from '../components/hashtagList';
import ArticleNavigation from '../components/articleNavigation';
import { parseHashtags } from '../utils/hashtags';
import { findAdjacentPosts } from '../utils/navigation';
import { Meta } from '../types';

/**
 * Extract post ID from file path
 */
const extractPostId = (path: string): string => {
  return path.replace('./posts/', '').replace('.mdx', '');
};

/**
 * Convert glob posts to posts map format
 */
const convertToPostsMap = (posts: Record<string, { frontmatter: Meta }>): Record<string, { frontmatter: Meta }> => {
  return Object.entries(posts).reduce((acc, [key, module]) => {
    const id = extractPostId(key);
    acc[id] = { frontmatter: module.frontmatter };
    return acc;
  }, {} as Record<string, { frontmatter: Meta }>);
};

/**
 * Get navigation info for current post
 */
const getNavigationInfo = (currentPath: string, posts: Record<string, { frontmatter: Meta }>) => {
  if (!currentPath.startsWith('/posts/')) {
    return { currentPostId: null, navigationInfo: {} };
  }

  const postSlug = currentPath.replace('/posts/', '');
  const postKey = Object.keys(posts).find(key => {
    return extractPostId(key) === postSlug;
  });

  if (!postKey) {
    return { currentPostId: null, navigationInfo: {} };
  }

  const currentPostId = extractPostId(postKey);
  const postsMap = convertToPostsMap(posts);
  const navigationInfo = findAdjacentPosts(currentPostId, postsMap);

  return { currentPostId, navigationInfo };
};

export default jsxRenderer(({ children, title, frontmatter }, c) => {
  const posts = import.meta.glob<{ frontmatter: Meta }>('./posts/*.mdx', {
    eager: true,
  });

  const { currentPostId, navigationInfo } = getNavigationInfo(c.req.path, posts);
  return (
    <html lang='ja'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>{title ?? frontmatter?.title ?? '日記(仮)'}</title>
        <meta property='og:title' content={title ?? frontmatter?.title ?? '日記(仮)'} />
        {import.meta.env.PROD ? (
          <link rel='stylesheet' href='/static/assets/style.css' />
        ) : (
          <link rel='stylesheet' href='/app/style.css' />
        )}
      </head>
      <body>
        <header class='bg-gray-100'>
          <nav class='mx-auto flex max-w-7x1 items-center justify-between p-6 lg:px-8'>
            <h1 class='text-xl font-bold'>
              <a href='/'>日記（仮）</a>
            </h1>
            <ul class='flex'>
              <li class='px-4'>
                <a href='https://misskey.chilitreat.dev'>
                  <img
                    // src='https://lh3.googleusercontent.com/pw/AMWts8C-FgqcQm8IQhB_qOqV8BhpLpQ1Z1cfS1gCo9lHYfUOPKkO9jIarOjbrPEzmc4vRQC5jKBoJPU5OW_A-jzeluHAJdKDotYQ9RH45yKY0jcMMk9TIlvhHuwyxfOBpVroCuYBYId5ANq7IduZrDXqYFMwGA=s128-no?authuser=0'
                    src='https://assets.misskey-hub.net/public/icon.png'
                    alt='misskey-icon'
                    class='w-5 h-5'
                  />
                </a>
              </li>
              <li class='px-4'>
                <a href='https://twitter.com/chilitreat'>
                  <img
                    src='https://icongr.am/simple/twitter.svg?size=30&color=currentColor&colored=false'
                    alt=''
                    class='w-5 h-5'
                  />
                </a>
              </li>
              <li class='px-4'>
                <a href='https://github.com/chilitreat/'>
                  <img
                    src='https://icongr.am/devicon/github-original.svg?size=30&color=currentColor'
                    alt=''
                    class='w-5 h-5'
                  />
                </a>
              </li>
            </ul>
          </nav>
        </header>
        <main class="px-2">
          <article class="prose">
            {children}
            {frontmatter?.hashtags && (
              <div class="mt-6 pt-4 border-t border-gray-200">
                <HashtagList hashtags={parseHashtags(frontmatter.hashtags)} />
              </div>
            )}
            {currentPostId && (
              <ArticleNavigation
                previousPost={navigationInfo.previousPost}
                nextPost={navigationInfo.nextPost}
              />
            )}
          </article>
        </main>
        <footer class='bg-gray-100'>
          <p class='text-center text-sm'>
            &copy; chilitreatの日記（仮）. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
});
