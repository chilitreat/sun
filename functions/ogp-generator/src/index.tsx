import React from 'react';
import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api';
import { type PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async (context) => {
  const { req } = context;

  // リクエストから必要な情報を取得
  const title = req.query('title');
  const description = req.query('description');
  const theme = req.query('theme') || 'light';

  return new ImageResponse(
    (
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
        <footer>
          <small>Theme: {theme}</small>
        </footer>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
};
