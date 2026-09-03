# サンプル: 「記事カードにハッシュタグのバッジを表示」

manager が 1 案件を最初から最後まで回すときの**完全トレース**。
コマンドと、その時点で流れるメッセージ／生成物を並べる。**このドキュメントは手順の例示であり、
実行はしない**（実際に回すときは [`runbook.md`](./runbook.md) をなぞる）。

- `<slug>` = `article-card-hashtag-badge`
- 想定要件: トップ（`app/routes/index/`）の記事一覧カードに、その記事の frontmatter
  `hashtags` を小さなバッジで最大 3 件表示する。4 件以上は `+N` 表記。既存の
  `app/components/hashtagList.tsx` / `app/utils/hashtags.ts` を再利用する。

---

## 0. 前提チェック

```bash
orca status --json
orca orchestration task-list --json      # RPC 疎通（Experimental 有効か）
git branch --show-current                # chilitreat/feat-orca-multi-agent
```

## 1. 受け渡しバス初期化 + 要件記入

```bash
SLUG=article-card-hashtag-badge
mkdir -p docs/orchestration/work/$SLUG
cp docs/orchestration/work/_TEMPLATE/*.md docs/orchestration/work/$SLUG/
```

`docs/orchestration/work/$SLUG/requirements.md`（manager が記入）:

```md
# 要件: article-card-hashtag-badge
## 背景・目的
記事一覧で内容の雰囲気を掴めるよう、カードにハッシュタグを可視化する。
## スコープ
- トップの記事一覧カードに hashtags バッジを表示（最大 3、超過分は +N）
- 既存 hashtagList / utils/hashtags を再利用
## スコープ外
- ハッシュタグのフィルタリング動線変更（既存の /hashtag/[tag] はそのまま）
- 記事詳細ページのレイアウト変更
## 受け入れ条件
- [ ] hashtags のある記事カードにバッジが最大 3 件表示される
- [ ] 4 件以上で "+N" が出る
- [ ] hashtags が無い記事ではバッジ領域ごと出ない
- [ ] yarn test / yarn build が緑
- [ ] wrangler pages dev でトップを開いて表示崩れがない
## 制約・前提
- SSG ビルド前提。リクエスト毎の計算を足さない
- 既存カードのレイアウトを大きく崩さない
```

## 2. Run 作成

```bash
orca orchestration run-create --objective "article-card-hashtag-badge: 記事カードにhashtagsバッジ表示" --json
# => { "run": { "id": "run_a1b2c3" }, ... }
```

## 3. Task を DAG で作成

```bash
orca orchestration task-create \
  --spec "設計: .claude/agents/architect.md に従い docs/orchestration/work/article-card-hashtag-badge/design.md を作成。要件は同ディレクトリ requirements.md。" \
  --json
# => TASK_DESIGN = task_d001

orca orchestration task-create \
  --spec "テスト計画: tester.md フェーズ1。design.md を基に work/article-card-hashtag-badge/test-plan.md 作成。" \
  --deps '["task_d001"]' --json
# => TASK_TESTPLAN = task_t001

orca orchestration task-create \
  --spec "実装: developer.md に従い design.md の手順で実装。TDD、yarn test 緑。impl-notes.md 更新。" \
  --deps '["task_d001"]' --json
# => TASK_IMPL = task_i001

orca orchestration task-create \
  --spec "テスト実行: tester.md フェーズ2。yarn test / tsc / yarn build / wrangler エッジ検証。test-report.md。" \
  --deps '["task_i001","task_t001"]' --json
# => TASK_TESTRUN = task_r001
```

```bash
orca orchestration task-list --ready --brief --json
# => task_d001 のみ ready
```

## 4. design worker 起動

```bash
orca orchestration worker-start --task task_d001 --worktree current \
  --agent claude --model opus --effort high --json
# => { "dispatch": {"id":"disp_d"}, "worker": {"agent_terminal_handle":"term_D"}, "receipt": {"ready":true} }
```

## 5. coordinator ループ — design 完了を待つ

```bash
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

architect が `docs/orchestration/work/article-card-hashtag-badge/design.md` を生成（要旨）:

```md
# 設計: article-card-hashtag-badge
## 方式
SSG。frontmatter は既に precompute 経路で取得済み。追加のリクエスト毎計算なし。
## 変更ファイル
| app/routes/index/index.tsx | 変更 | カード描画に <HashtagList> を追加 |
| app/components/hashtagList.tsx | 変更 | max 表示件数 + "+N" の props を追加（後方互換） |
| app/utils/hashtags.ts | 変更なし（既存 normalize を利用） |
## 型変更
HashtagList props に `max?: number`（既定 undefined = 全件）を追加。
## テスト方針
- hashtags.ts: 既存テスト維持
- hashtagList: max 指定時に 3 件 + "+N"、空配列で null、max 未指定で従来通り
- 統合: index のカードに hashtags があるとバッジが出る
## リスク
カードの高さが変わり LCP に影響しうる → バッジは 1 行固定・overflow hidden。
## 実装手順
1. hashtagList に max prop と +N 表示を追加（テスト先行）
2. index/index.tsx のカードに <HashtagList hashtags={...} max={3} size="small" /> を差す
3. yarn test / yarn build
```

受理して ack、次の wave へ:

```bash
orca orchestration check --ack <delivery_id> --wait --types worker_done,escalation,question --timeout-ms 900000 --json
orca orchestration worker-release --dispatch disp_d --json   # design はこれ以上使わない
orca worktree set --worktree active --comment "設計完了、実装とテスト計画を並行開始" --json
```

## 6. impl + test-plan を並行起動

```bash
orca orchestration task-list --ready --brief --json    # task_i001, task_t001 が ready

orca orchestration worker-start --task task_t001 --worktree current --agent claude --json
# => dispatch disp_t / handle term_T

orca orchestration worker-start --task task_i001 --worktree current --agent claude --json
# => dispatch disp_i / handle term_I   ← この handle を控える（差し戻しで再利用）
```

## 7. coordinator ループ — impl と test-plan の完了を待つ

```bash
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

- tester フェーズ1 → `test-plan.md` 生成、`worker_done`。→ `worker-release --dispatch disp_t`
- developer → `hashtagList.tsx` に `max` prop、`index.tsx` にバッジ追加、
  `hashtagList.test.tsx` にケース追加、`yarn test` 緑、`impl-notes.md` 更新、`worker_done`。

developer の terminal は**まだ release しない**（差し戻しに備える）。全メッセージ処理後 ack。

## 8. test-run 起動

```bash
orca orchestration task-list --ready --brief --json    # task_r001 が ready
orca orchestration worker-start --task task_r001 --worktree current --agent claude --json
# => dispatch disp_r / handle term_R
```

## 9-a. テスト合格の場合

tester フェーズ2 が `yarn test` 緑 / `tsc` OK / `yarn build` OK /
`wrangler pages dev ./dist` でトップ表示 OK を確認し `test-report.md` に記録、`worker_done`。

```bash
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
orca orchestration worker-release --dispatch disp_r --json
orca orchestration worker-release --dispatch disp_i --json   # developer もう不要
```

## 9-b. テスト不合格の場合（差し戻しループ）

tester が `test-report.md` にバグを記録して `escalation`:

```
subject: テスト不合格: article-card-hashtag-badge（バグ1件）
body: test-report.md 参照。4件以上で "+4" ではなく "+1" が表示される（オフバイワン）。
      該当 app/components/hashtagList.tsx:NN。差し戻し要。
```

manager の対応:

```bash
cat docs/orchestration/work/article-card-hashtag-badge/test-report.md

orca orchestration task-create \
  --spec "修正: work/article-card-hashtag-badge/test-report.md の失敗（+N のオフバイワン）を解消。再現テスト追加後に修正。" \
  --json
# => TASK_FIX = task_f001

# developer の保持ターミナルへ再投入（release していない）
orca orchestration worker-start --task task_f001 --terminal term_I --json
```

developer が再現テスト追加 → 修正 → `yarn test` 緑 → `worker_done`。
その後 tester を再度回す（新しい test-run task を作るか term_R へ再投入）。合格するまで繰り返す。

## 10. PO へレビュー返却

`docs/orchestration/work/article-card-hashtag-badge/review-request.md` を manager が記入:

```md
# レビュー依頼: article-card-hashtag-badge
## 対応した要件
受け入れ条件 4 項目すべて満たした。
## 差分概要
| app/components/hashtagList.tsx | max prop + "+N" 表示を追加（後方互換） |
| app/components/__tests__/hashtagList.test.tsx | max / +N / 空配列のケース追加 |
| app/routes/index/index.tsx | カードに <HashtagList max={3} size="small"> を追加 |
## 確認してほしいポイント
- バッジのサイズ感・色（Tailwind クラス）がデザイン意図に合うか
## テスト結果
単体 PASS（+3 件）/ 型 OK / SSG ビルド OK / wrangler エッジ検証 OK
## 既知の制約
モバイル幅で 3 件が 1 行に収まらない場合は末尾を切る（overflow hidden）。
```

```bash
orca orchestration gate-create --task task_r001 \
  --question "レビュー依頼: article-card-hashtag-badge をマージしてよいか（詳細 work/article-card-hashtag-badge/review-request.md）" \
  --options '["approve","request-changes"]' --json
# => GATE_ID = gate_g001

orca worktree set --worktree active --workspace-status in-review --json
orca worktree set --worktree active --comment "レビュー待ち: article-card-hashtag-badge" --json

orca orchestration check --wait --types decision_gate,question --timeout-ms 900000 --json
```

- PO が `orca orchestration gate-resolve --id gate_g001 --resolution approve --json`
  → manager が `worktree set --workspace-status completed`、ブランチをマージ手順へ。
- `request-changes` → 9-b と同じ要領で developer へ修正タスク。

## 11. 後始末

```bash
orca orchestration task-list --json      # task_d001/t001/i001/r001(/f001) すべて completed
# live worker が残っていれば release
```

`docs/orchestration/work/article-card-hashtag-badge/` の一式（requirements/design/impl-notes/
test-plan/test-report/review-request）はブランチに残し、レビューの証跡にする。

---

## この案件で使った Orca プリミティブまとめ

| ステップ | コマンド |
|---|---|
| 名前空間 | `run-create` |
| DAG | `task-create --deps`（design → {test-plan, impl} → test-run） |
| worker 起動 | `worker-start --worktree current --agent claude [--model opus --effort high]` |
| 待機 | `check --wait --types worker_done,escalation,question --timeout-ms 900000` |
| 質問応答 | `ask`（worker）/ `reply`（manager） |
| 差し戻し | `escalation`（tester）→ `task-create` + `worker-start --terminal <handle>`（manager） |
| PO 返却 | `gate-create` → `gate-resolve` |
| 可視化 | `worktree set --comment / --workspace-status` |
| 後始末 | `worker-release` |
