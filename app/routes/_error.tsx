// app/routes/_error.ts
import { ErrorHandler } from 'hono';

const handler: ErrorHandler = (e, c) => {
  return c.render(
    <div class='flex-1 flex-col my-4 justify-center'>
      <h1 class='text-xl text-center py-10'>
        エラーが発生しています。時間を空けてアクセスしてください
      </h1>
      <h1 class='text-base my-4 text-center'>
        <a href='/'>一覧へ</a>
      </h1>
    </div>
  );
};

export default handler;
