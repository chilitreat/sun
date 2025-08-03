---
mode: 'agent'
model: GPT-4o
tools: [ "changes", "codebase", "editFiles", "extensions", "fetch", "findTestFiles", "githubRepo", "new", "problems", "openSimpleBrowser", "runCommands", "runNotebooks", "runTasks", "runTests", "search", "searchResults", "terminalLastCommand", "terminalSelection", "testFailure", "usages", "vscodeAPI", "activePullRequest", "copilotCodingAgent" ],
description: 'Kairo Task Verifyの設定作業を実行します。作成されたタスクファイルの内容を確認し、出力フォーマット例に沿った情報が抜けていたら追加します。'
---

# kairo-task-verify

## 目的

作成されたタスクファイルの内容を確認し、出力フォーマット例に沿った情報が抜けていたら追加する。

## 前提条件

- `docs/tasks/{要件名}-tasks.md` が存在する
- kairo-tasks コマンドによってタスクファイルが作成済みである

## 実行内容

1. **タスクファイルの確認**

   - `docs/tasks/{要件名}-tasks.md` を読み込み

2. **出力フォーマット例との比較**

   - kairo-tasks の出力フォーマット例を確認
   - 作成されたタスクファイルに不足している情報を特定

3. **不足情報の追加**
   以下の項目が含まれているか確認し、不足していれば追加：

   - 概要セクション（全タスク数、推定作業時間、クリティカルパス）
   - 各タスクのチェックボックス
   - タスクタイプ（TDD/DIRECT）の明記
   - 要件リンク
   - 依存タスク
   - 実装詳細
   - テスト要件
   - UI/UX 要件（フロントエンドタスクの場合）
   - エラーハンドリング要件
   - 完了条件
   - 実行順序（Mermaid ガントチャート）
   - サブタスクテンプレート情報

4. **ファイルの更新**
   - 不足している情報を追加してファイルを更新

## 実行後の確認

- 更新したファイルのパスを表示
- 追加した情報の概要を表示
- タスクファイルが完全になったことを確認
