import vercelOGPagesPlugin from '@cloudflare/pages-plugin-vercel-og';

interface Props {
  ogTitle: string;
}

export const onRequest = vercelOGPagesPlugin<Props>({
  imagePathSuffix: '/og-image.png', // ファイル名を定義
  component: ({ ogTitle }) => {
    return (
      <div
        style={{
          // flexboxで中央寄せ
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // 画像の幅いっぱいまでdivを広げる
          width: '100%',
          height: '100%',
          fontFamily: 'Noto Sans JP, Noto Sans, Arial, Helvetica, sans-serif', // 文字化け防止
        }}
      >
        <h1 style={{ fontSize: '80px', fontFamily: 'inherit' }}>{ogTitle}</h1>
        <h2 style={{ fontSize: '30px', fontFamily: 'inherit' }}>
          chilitreatの日記（仮）
        </h2>
      </div>
    );
  },
  extractors: {
    on: {
      'meta[property="og:title"]': (props) => ({
        element(element) {
          props.ogTitle = element.getAttribute('content');
        },
      }),
    },
  },
  options: {
    // 画像のサイズを指定
    width: 1200,
    height: 630,
  },
  autoInject: {
    // ページのhead要素内ににOGの<meta>要素を追加
    openGraph: true,
  },
});
