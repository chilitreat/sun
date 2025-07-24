# 設計書

## 概要

ハッシュタグベースのカテゴリ分けと記事ナビゲーション機能をSunブログアプリケーションに追加する設計です。既存のMDXベースの投稿システムを拡張し、フロントマターでのハッシュタグサポートと記事間のナビゲーション機能を実装します。

## アーキテクチャ

### 現在のアーキテクチャ
- HonoXフレームワークベースのフルスタックアプリケーション
- MDXファイルによる記事管理（`app/routes/posts/*.mdx`）
- Viteの`import.meta.glob`を使用した静的記事読み込み
- Tailwind CSSとhono/cssによるスタイリング
- ファイルベースルーティング

### 拡張アーキテクチャ
- フロントマターにハッシュタグフィールドを追加
- ハッシュタグフィルタリング用の新しいルート
- 記事ナビゲーション用のユーティリティ関数
- 新しいコンポーネント：HashtagList、ArticleNavigation

## コンポーネントとインターフェース

### 1. 型定義の拡張

#### Meta型の拡張
```typescript
export type Meta = {
  emoji: string
  title: string
  author: string
  created_at: string
  hashtags?: string[] | string // 新規追加
}
```

#### PostWithNavigation型
```typescript
export type PostWithNavigation = {
  id: string
  frontmatter: Meta
  previousPost?: { id: string; title: string }
  nextPost?: { id: string; title: string }
}
```

### 2. ユーティリティ関数

#### ハッシュタグ処理
```typescript
// app/utils/hashtags.ts
export const normalizeHashtag = (hashtag: string): string
export const parseHashtags = (hashtags: string[] | string | undefined): string[]
export const generateHashtagUrl = (hashtag: string): string
```

#### 記事ナビゲーション
```typescript
// app/utils/navigation.ts
export const getPostsWithNavigation = (posts: PostsMap): PostWithNavigation[]
export const findAdjacentPosts = (currentId: string, posts: PostsMap): {
  previous?: { id: string; title: string }
  next?: { id: string; title: string }
}
```

#### 記事フィルタリング
```typescript
// app/utils/filtering.ts
export const filterPostsByHashtag = (posts: PostsMap, hashtag: string): PostsMap
export const getAllHashtags = (posts: PostsMap): string[]
```

### 3. 新しいコンポーネント

#### HashtagList コンポーネント
```typescript
// app/components/hashtagList.tsx
type HashtagListProps = {
  hashtags: string[]
  size?: 'small' | 'medium' | 'large'
}
```

**機能:**
- ハッシュタグの配列を受け取り、クリック可能なタグとして表示
- 各ハッシュタグはフィルターページへのリンク
- レスポンシブデザインとアクセシビリティ対応

#### ArticleNavigation コンポーネント
```typescript
// app/components/articleNavigation.tsx
type ArticleNavigationProps = {
  previousPost?: { id: string; title: string }
  nextPost?: { id: string; title: string }
}
```

**機能:**
- 前/次の記事へのナビゲーションリンクを表示
- 記事が存在しない場合は適切に非表示
- モバイルフレンドリーなレイアウト

#### FilterBanner コンポーネント
```typescript
// app/components/filterBanner.tsx
type FilterBannerProps = {
  activeHashtag: string
  onClear: () => void
}
```

**機能:**
- アクティブなハッシュタグフィルターを表示
- フィルターをクリアするボタンを提供

### 4. ルート拡張

#### ハッシュタグフィルターページ
- **パス:** `/hashtag/[tag]`
- **ファイル:** `app/routes/hashtag/[tag].tsx`
- **機能:** 特定のハッシュタグでフィルターされた記事一覧を表示

#### メインページの拡張
- **ファイル:** `app/routes/index/index.tsx`
- **拡張:** ハッシュタグ表示とフィルタリング機能を追加

## データモデル

### フロントマター構造
```yaml
---
emoji: 👌
title: "記事タイトル"
author: "作者名"
created_at: "2024/2/11"
hashtags: ["技術", "HonoX", "ブログ"] # 新規追加
---
```

### 内部データ構造
```typescript
type PostsMap = Record<string, {
  frontmatter: Meta
}>

type ProcessedPost = {
  id: string
  frontmatter: Meta
  normalizedHashtags: string[]
  url: string
}
```

## エラーハンドリング

### ハッシュタグ関連
1. **無効なハッシュタグ:** 特殊文字や空文字列の適切な処理
2. **存在しないハッシュタグ:** 404ページまたは空の結果表示
3. **フロントマター解析エラー:** デフォルト値での継続処理

### ナビゲーション関連
1. **記事が見つからない:** 適切な404処理
2. **ナビゲーション計算エラー:** グレースフルな劣化

## テスト戦略

### 単体テスト
1. **ユーティリティ関数**
   - ハッシュタグ正規化
   - 記事フィルタリング
   - ナビゲーション計算

2. **コンポーネント**
   - HashtagListの描画
   - ArticleNavigationの条件付き表示
   - FilterBannerの動作

### 統合テスト
1. **ルーティング**
   - ハッシュタグフィルターページの動作
   - 記事ページでのナビゲーション

2. **データフロー**
   - フロントマターからハッシュタグの抽出
   - 記事一覧でのフィルタリング

### E2Eテスト
1. **ユーザーフロー**
   - ハッシュタグクリックからフィルター表示
   - 記事間のナビゲーション
   - レスポンシブデザインの確認

## パフォーマンス考慮事項

### 静的生成の活用
- ハッシュタグ一覧の事前計算
- 記事ナビゲーション情報の事前生成

### メモ化
- 重い計算処理のキャッシュ
- コンポーネントの不要な再レンダリング防止

### バンドルサイズ
- 新しいユーティリティ関数の最適化
- 未使用コードの除去

## アクセシビリティ

### キーボードナビゲーション
- ハッシュタグリンクのフォーカス管理
- 記事ナビゲーションのキーボード操作

### スクリーンリーダー対応
- 適切なARIAラベル
- セマンティックなHTML構造

### 色とコントラスト
- ハッシュタグの視認性確保
- ナビゲーションボタンのコントラスト比

## セキュリティ

### XSS対策
- ハッシュタグ文字列のサニタイゼーション
- URLパラメータの適切なエスケープ

### URL操作
- ハッシュタグURLの検証
- 不正なパラメータの処理