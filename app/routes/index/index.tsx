import { FC } from 'hono/jsx';
import type { Meta } from '../../types';
import HashtagList from '../../components/hashtagList';
import { memoizedParseHashtags } from '../../utils/performance';
import { getFastSortedPosts, initializePrecomputedData } from '../../utils/precompute';

const Card: FC = ({ children, id, emoji, author, created_at, hashtags }) => {
  const parsedHashtags = memoizedParseHashtags(hashtags);

  return (
    <li class='flex flex-col mb-4'>
      <a
        href={`${id.replace(/\.mdx$/, '')}`}
        class='select-none cursor-pointer bg-gray-50 rounded-md flex flex-1 items-center p-4 hover:bg-gray-100 transition-colors'
      >
        <div class='flex flex-col rounded-md w-10 h-10 bg-gray-200 justify-center items-center mr-2'>
          {emoji ?? '📝'}
        </div>
        <div class='flex-1 pl-1 mr-4'>
          <div class='font-medium break-normal'>{children}</div>
          <div class='text-gray-600 text-sm'>by {author}</div>
        </div>
        <div class='text-gray-600 text-xs'>{created_at}</div>
      </a>
      {parsedHashtags.length > 0 && (
        <div class='px-4 pb-2'>
          <HashtagList hashtags={parsedHashtags} size="small" />
        </div>
      )}
    </li>
  );
};

export default function Top() {
  const posts = import.meta.glob<{ frontmatter: Meta }>('../posts/*.mdx', {
    eager: true,
  });

  // Initialize precomputed data for optimal performance
  initializePrecomputedData(posts);

  // Use fast precomputed sorting for better performance
  const sortedPosts = getFastSortedPosts(posts);

  return (
    <div class='mx-auto'>
      <h2 class='text-xl font-smibold mt-1 mb-1'>Posts</h2>
      <div class='container flex mx-auto items-center justify-center'>
        <ul class='flex flex-col w-full'>
          {sortedPosts
            .map(([id, module]) => {
              if (module.frontmatter) {
                return (
                  <Card
                    id={id}
                    emoji={module.frontmatter.emoji}
                    author={module.frontmatter.author}
                    created_at={module.frontmatter.created_at}
                    hashtags={module.frontmatter.hashtags}
                  >
                    {module.frontmatter.title}
                  </Card>
                );
              }
            })}
        </ul>
      </div>
    </div>
  );
}
