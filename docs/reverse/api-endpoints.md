# API 仕様

## エンドポイント一覧

### GET /articles

- **説明**: すべての記事を取得します。
- **レスポンス**:

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "created_at": "string"
    }
  ]
}
```

### GET /articles/:id

- **説明**: 指定された ID の記事を取得します。
- **レスポンス**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "created_at": "string"
  }
}
```

### POST /articles

- **説明**: 新しい記事を作成します。
- **リクエスト**:

```json
{
  "title": "string",
  "content": "string"
}
```

- **レスポンス**:

```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "created_at": "string"
  }
}
```
