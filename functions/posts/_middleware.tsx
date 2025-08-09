import vercelOGPagesPlugin from "@cloudflare/pages-plugin-vercel-og";

export const onRequest = vercelOGPagesPlugin({
  imagePathSuffix: "/og-image.png", // ファイル名を定義
  component: ({ pathname }: { pathname: string }) => {
    // pathnameから最後の要素を抜き出す
    const paths = pathname.split("/");
    const slug = paths[paths.length - 1];

    return (
      <div
        style={{
          // flexboxで中央寄せ
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // 画像の幅いっぱいまでdivを広げる
          width: "100%",
          height: "100%",
        }}
      >
        <h1 style={{ fontSize: "80px" }}>
          This is {slug} article
        </h1>
      </div>
    );
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