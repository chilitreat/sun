# sun

HonoX + MDX + Cloudflare Pagesで構築された個人ブログです。

https://blog.chilitreat.dev/

## 概要

MDXファイルを使用してマークダウン形式でブログ記事を作成し、モダンなWebスタックで高速なサイトを実現しています。Cloudflare Pagesにデプロイされ、D1データベースとの連携も可能な設計になっています。

## 技術スタック

### フロントエンド
- **HonoX** (v0.1.0) - React風のJSXフレームワーク
- **MDX** (v3.0.0) - Markdown + JSX
- **TailwindCSS** (v3.4.1) - ユーティリティファーストCSS
- **TypeScript** - 型安全な開発環境

### バックエンド
- **Hono** (v4.8.12) - 軽量高速Webフレームワーク
- **Zod** (v3.22.4) - スキーマバリデーション

### ビルド・ツール
- **Vite** (v5.0.12) - 高速ビルドツール
- **Wrangler** - Cloudflare開発・デプロイツール
- **PostCSS** + **Autoprefixer** - CSS処理

## 必要な環境

- Node.js (v18以上推奨)
- Yarn (v4.0.2)
- Cloudflareアカウント（デプロイ用）

## セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/chilitreat/sun.git
cd sun
```

### 2. 依存関係のインストール
```bash
yarn install
```

### 3. 開発サーバーの起動
```bash
yarn dev
```

ブラウザで `http://localhost:5173` を開いてサイトを確認できます。

## 開発

### ブログ記事の追加

`app/routes/posts/` ディレクトリにMDXファイルを作成します：

```mdx
---
emoji: 🌟
title: 新しい記事のタイトル
author: あなたの名前
created_at: 2024/7/21
hashtags: ["tech", "web"]
---

## 記事の内容

MDX記法を使って記事を書くことができます。

```

### ビルド
```bash
yarn build
```

### プレビュー（本番環境と同等）
```bash
yarn preview
```

## デプロイ

Cloudflare Pagesにデプロイするには：

```bash
yarn deploy
```

事前にWranglerでCloudflareアカウントにログインしている必要があります。

## プロジェクト構造

```
sun/
├── app/
│   ├── client.ts          # クライアントエントリーポイント
│   ├── server.ts          # サーバーエントリーポイント
│   ├── components/        # 再利用可能コンポーネント
│   ├── islands/           # インタラクティブコンポーネント
│   ├── routes/            # ファイルベースルーティング
│   │   ├── index/         # ホームページ
│   │   └── posts/         # ブログ記事（MDX）
│   ├── types.ts          # 型定義
│   └── style.css         # グローバルスタイル
├── package.json
├── vite.config.ts        # Vite設定
├── tailwind.config.js    # TailwindCSS設定
└── tsconfig.json         # TypeScript設定
```
