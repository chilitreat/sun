import { jsxRenderer } from 'hono/jsx-renderer';

export default jsxRenderer(({ children, title, frontmatter }) => {
  return (
    <html lang='ja'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {<title>{title ?? frontmatter?.title ?? '日記'}</title>}
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
          <article class="prose">{children}</article>
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
