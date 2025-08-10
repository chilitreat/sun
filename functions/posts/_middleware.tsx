import vercelOGPagesPlugin from '@cloudflare/pages-plugin-vercel-og';

interface Props {
  ogTitle: string;
}

const ogpWidth = 1200;
const ogpHeight = 630;

export const onRequest = async (context: any) => {
  // 本番/ローカル両対応: ホスト名を自動判定
  const url = new URL(context.request.url);
  const fontUrl = url.origin + '/fonts/LINESeedJP_TTF_Eb.ttf';
  const fontRes = await fetch(fontUrl);
  const fontBuffer = await fontRes.arrayBuffer();

  const plugin = vercelOGPagesPlugin<Props>({
    imagePathSuffix: '/og-image.png',
    component: ({ ogTitle }: { ogTitle: string }) => {
      let fontSize = 72;
      // タイトルの文字数に応じてフォントサイズを変更する
      if (ogTitle.length > 32) fontSize = 56;
      if (ogTitle.length > 48) fontSize = 40;
      if (ogTitle.length > 70) fontSize = 28;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(120deg, #f8fafc 0%, #e0e7ef 50%, #c7d2fe 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.97)',
              borderRadius: '40px',
              boxShadow: '0 8px 32px 0 rgba(30,41,59,0.13)',
              border: '1.5px solid transparent',
              padding: '56px 72px 40px 72px',
              width: '90%',
              height: ogpHeight - ogpWidth * 0.1,
              textAlign: 'center',
              gap: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
                height: '100%',
                width: '100%',
                alignItems: 'center',
              }}
            >
              <h1
                style={{
                  fontSize: fontSize + 'px',
                  color: '#1e293b',
                  margin: 0,
                  wordBreak: 'break-word',
                  textShadow: '0 4px 16px rgba(0,0,0,0.13)',
                  letterSpacing: '-0.01em',
                  maxHeight: fontSize * 10.3 + 'px',
                  overflow: 'hidden',
                  verticalAlign: 'middle',
                  lineHeight: 1.15,
                }}
              >
                {ogTitle}
              </h1>
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#475569',
                marginBottom: '0',
                letterSpacing: '0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.07)',
                marginTop: 'auto',
              }}
            >
              chilitreatの日記（仮）
            </div>
          </div>
        </div>
      );
    },
    extractors: {
      on: {
        'meta[property="og:title"]': (props: any) => ({
          element(element: any) {
            props.ogTitle = element.getAttribute('content');
          },
        }),
      },
    },
    options: {
      width: ogpWidth,
      height: ogpHeight,
      fonts: [
        {
          name: 'LINE Seed JP',
          data: fontBuffer,
        },
      ],
    },
    autoInject: {
      openGraph: true,
    },
  });
  return plugin(context);
};
