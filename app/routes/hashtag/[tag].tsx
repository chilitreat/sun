import { FC } from 'hono/jsx';
import { createRoute } from 'honox/factory';
import type { Meta } from '../../types';
import { filterPostsByHashtag, PostsMap } from '../../utils/filtering';
import { normalizeHashtag, isValidHashtag } from '../../utils/hashtags';
import { getFastSortedPosts, getFastPostsByHashtag, initializePrecomputedData } from '../../utils/precompute';
import FilterBanner from '../../components/filterBanner';

const Card: FC = ({ children, id, emoji, author, created_at }) => {
  return (
    <li class='flex flex-row mb-2'>
      <a
        href={`/posts/${id.replace(/\.mdx$/, '').replace('../posts/', '')}`}
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

export default createRoute((c) => {
  try {
    const tag = c.req.param('tag');

    // Handle missing tag parameter
    if (!tag) {
      return c.notFound();
    }

    // Decode and validate the hashtag
    let decodedTag: string;
    try {
      decodedTag = decodeURIComponent(tag);
    } catch (error) {
      console.warn('Invalid URL encoding for hashtag:', tag);
      return c.notFound();
    }

    // Validate hashtag format
    if (!isValidHashtag(decodedTag)) {
      console.warn('Invalid hashtag format:', decodedTag);
      return c.notFound();
    }

    // Load all posts with error handling
    let posts: PostsMap;
    try {
      posts = import.meta.glob<{ frontmatter: Meta }>('../posts/*.mdx', {
        eager: true,
      }) as PostsMap;
    } catch (error) {
      console.error('Error loading posts:', error);
      return c.render(
        <div class='mx-auto'>
          <h2 class='text-xl font-semibold mt-1 mb-4 text-red-600'>
            Error Loading Posts
          </h2>
          <p class='text-gray-600 mb-4'>
            There was an error loading the blog posts. Please try again later.
          </p>
          <a href='/' class='text-blue-600 hover:text-blue-800 underline'>
            Return to home
          </a>
        </div>
      );
    }

    // Initialize precomputed data for optimal performance
    initializePrecomputedData(posts);

    // Try to use fast precomputed filtering first
    let filteredPosts = getFastPostsByHashtag(normalizeHashtag(decodedTag), posts);

    // Fallback to regular filtering if precomputed data is not available
    if (Object.keys(filteredPosts).length === 0) {
      filteredPosts = filterPostsByHashtag(posts, decodedTag);
    }

    const filteredEntries = Object.entries(filteredPosts);

    // Normalize the hashtag for display
    const displayTag = decodedTag;

    return c.render(
      <div class='mx-auto'>
        <h2 class='text-xl font-semibold mt-1 mb-4'>
          Posts tagged with "#{displayTag}"
        </h2>

        <FilterBanner
          activeHashtag={displayTag}
          postCount={filteredEntries.length}
          clearUrl='/'
        />

        {filteredEntries.length > 0 && (
          <div class='container flex mx-auto items-center justify-center'>
            <ul class='flex flex-col w-full'>
              {getFastSortedPosts(filteredPosts)
                .map(([id, module]) => {
                  try {
                    if (module?.frontmatter) {
                      return (
                        <Card
                          id={id}
                          emoji={module.frontmatter.emoji || '📝'}
                          author={module.frontmatter.author || 'Unknown'}
                          created_at={module.frontmatter.created_at || 'Unknown date'}
                        >
                          {module.frontmatter.title || 'Untitled'}
                        </Card>
                      );
                    }
                    return null;
                  } catch (error) {
                    console.warn(`Error rendering post ${id}:`, error);
                    return null;
                  }
                })}
            </ul>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Unexpected error in hashtag route:', error);
    return c.render(
      <div class='mx-auto'>
        <h2 class='text-xl font-semibold mt-1 mb-4 text-red-600'>
          Something went wrong
        </h2>
        <p class='text-gray-600 mb-4'>
          An unexpected error occurred while loading this page.
        </p>
        <a href='/' class='text-blue-600 hover:text-blue-800 underline'>
          Return to home
        </a>
      </div>
    );
  }
});