// app/routes/_404.tsx
import { NotFoundHandler } from 'hono';

const handler: NotFoundHandler = (c) => {
  return c.render(
    <div class='flex-1 flex-col my-4 justify-center'>
      <h1 class='text-xl text-center py-10'>Sorry, Not Found...</h1>
      <h1 class='text-base my-4 text-center'>
        <a href='/'>一覧へ</a>
      </h1>
    </div>
  );
};

export default handler;
