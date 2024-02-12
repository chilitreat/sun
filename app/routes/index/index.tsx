import { FC } from 'hono/jsx';
import type { Meta } from '../../types';

const Card: FC = ({ children, id, emoji, author, created_at }) => {
  return (
    <li class='flex flex-row mb-2'>
      <a
        href={`${id.replace(/\.mdx$/, '')}`}
        class='select-none cursor-pointer bg-gray-50 rounded-md flex flex-1 items-center p-4'
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
    </li>
  );
};

export default function Top() {
  const posts = import.meta.glob<{ frontmatter: Meta }>('../posts/*.mdx', {
    eager: true,
  });
  return (
    <div class='mx-auto'>
      <h2 class='text-xl font-smibold mt-1 mb-1'>Posts</h2>
      <div class='container flex mx-auto items-center justify-center'>
        <ul class='flex flex-col w-full'>
          {Object.entries(posts)
            // craeted_atで降順ソート
            .sort((a, b) => {
              if (a[1].frontmatter.created_at < b[1].frontmatter.created_at) {
                return 1;
              }
              if (a[1].frontmatter.created_at > b[1].frontmatter.created_at) {
                return -1;
              }
              return 0;
            })
            .map(([id, module]) => {
              if (module.frontmatter) {
                return (
                  <Card
                    id={id}
                    emoji={module.frontmatter.emoji}
                    author={module.frontmatter.author}
                    created_at={module.frontmatter.created_at}
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
