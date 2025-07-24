import { FC } from 'hono/jsx';

type FilterBannerProps = {
  activeHashtag: string;
  postCount: number;
  onClear?: () => void;
  clearUrl?: string;
};

export const FilterBanner: FC<FilterBannerProps> = ({
  activeHashtag,
  postCount,
  onClear,
  clearUrl = '/'
}) => {
  return (
    <div class='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
      <div class='flex items-center justify-between flex-wrap gap-2'>
        <div class='flex items-center gap-2'>
          <span class='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            #{activeHashtag}
          </span>
          <span class='text-sm text-gray-600'>
            {postCount} post{postCount !== 1 ? 's' : ''} found
          </span>
        </div>

        <div class='flex items-center gap-2'>
          {onClear ? (
            <button
              onClick={onClear}
              class='text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
              aria-label={`Clear hashtag filter for ${activeHashtag}`}
            >
              Clear filter
            </button>
          ) : (
            <a
              href={clearUrl}
              class='text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
              aria-label={`Clear hashtag filter for ${activeHashtag}`}
            >
              Clear filter
            </a>
          )}
        </div>
      </div>

      {postCount === 0 && (
        <div class='mt-3 pt-3 border-t border-blue-200'>
          <p class='text-sm text-gray-600 mb-2'>
            No posts found with the hashtag "#{activeHashtag}"
          </p>
          <a
            href={clearUrl}
            class='text-sm text-blue-600 hover:text-blue-800 underline'
          >
            View all posts
          </a>
        </div>
      )}
    </div>
  );
};

export default FilterBanner;