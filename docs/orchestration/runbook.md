# Runbook: マネージャー主導のマルチエージェント開発フロー

manager エージェントが 1 案件を要件 → 設計 → 実装 → テスト → PO レビュー返却まで
回すための手順。コマンドはコピペして `<...>` を置換して使う。

> 前提: [`README.md`](./README.md) の「前提条件」を満たしていること。
> `orca` はセッションで解決した実行体に読み替える（Linux のマネージド外シェルでは `orca-ide`）。

---

## 0. 前提チェック

```bash
orca status --json
# orchestration が experimental で有効 / nested worker depth = 1 を Settings で確認
orca orchestration task-list --json   # RPC が通ること（エラーなら Experimental 無効の可能性）
git branch --show-current              # 作業ブランチ上か
```

## 1. 受け渡しバスを初期化

```bash
SLUG=<feature-slug>            # 例: article-card-hashtag-badge
mkdir -p docs/orchestration/work/$SLUG
cp docs/orchestration/work/_TEMPLATE/*.md docs/orchestration/work/$SLUG/
```

`docs/orchestration/work/$SLUG/requirements.md` に PO 要件・受け入れ条件・スコープ外を記入する。
曖昧な点は PO に確認してから先へ進む。

## 2. Run を作成

```bash
orca orchestration run-create --objective "$SLUG: <一文要約>" --json
# => run_id を控える（以降のコマンドは基本 Dispatch ID で経路が決まるので --run 省略可）
```

## 3. Task を DAG で作成

`--spec` は短く、詳細はバスのファイルを参照させる。

```bash
# design（依存なし）
orca orchestration task-create \
  --spec "設計: .claude/agents/architect.md に従い docs/orchestration/work/$SLUG/design.md を作成。要件は同ディレクトリ requirements.md。" \
  --json
# => TASK_DESIGN

# test-plan（design に依存 / 実装は待たない）
orca orchestration task-create \
  --spec "テスト計画: .claude/agents/tester.md フェーズ1。design.md を基に work/$SLUG/test-plan.md を作成。" \
  --deps "[\"$TASK_DESIGN\"]" --json
# => TASK_TESTPLAN

# impl（design に依存）
orca orchestration task-create \
  --spec "実装: .claude/agents/developer.md に従い design.md の手順で実装。TDD、yarn test 緑。work/$SLUG/impl-notes.md 更新。" \
  --deps "[\"$TASK_DESIGN\"]" --json
# => TASK_IMPL

# test-run（impl と test-plan に依存）
orca orchestration task-create \
  --spec "テスト実行: .claude/agents/tester.md フェーズ2。yarn test / tsc / yarn build / wrangler エッジ検証。work/$SLUG/test-report.md。" \
  --deps "[\"$TASK_IMPL\",\"$TASK_TESTPLAN\"]" --json
# => TASK_TESTRUN
```

DAG 確認:

```bash
orca orchestration task-list --brief --json
orca orchestration task-list --ready --brief --json   # いま起動してよい task
```

## 4. worker を起動（同一 worktree・worker ごとに fresh ターミナル）

まず ready な design から。

```bash
orca orchestration worker-start --task "$TASK_DESIGN" --worktree current \
  --agent claude --model opus --effort high --json
# => receipt の dispatch id と agent terminal handle を控える（DISPATCH_DESIGN / HANDLE_DESIGN）
```

design が `worker_done` したら test-plan と impl を**まとめて**起動してから待機に入る:

```bash
orca orchestration worker-start --task "$TASK_TESTPLAN" --worktree current --agent claude --json
orca orchestration worker-start --task "$TASK_IMPL"     --worktree current --agent claude --json
# => DISPATCH_IMPL / HANDLE_IMPL を必ず控える（差し戻しループで再利用する）
```

impl と test-plan が揃ったら test-run:

```bash
orca orchestration worker-start --task "$TASK_TESTRUN" --worktree current --agent claude --json
```

> 別 worktree が必要な具体的理由がある場合のみ:
> `--worktree new-child --name $SLUG-impl --setup run` に置き換える。

## 5. coordinator ループ

`task-list --ready` を外部メモリに、ローリング待機で回す。**sleep / poll しない。**

```bash
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

- 返ってきた Delivery の**全メッセージを処理**してから ack する:
  ```bash
  orca orchestration check --ack <delivery_id> --wait --types worker_done,escalation,question --timeout-ms 900000 --json
  ```
- `question` には即答:
  ```bash
  orca orchestration reply --id <msg_id> --body "<回答>" --json
  ```
- タイムアウトや `{count:0}` は**失敗ではなくチェックポイント**。そのまま待機を続ける。
- 各 `worker_done` を受理したら、次の owner を決める:
  - すぐ同じ worker に次タスクを渡す → release せず `worker-start --task <next> --terminal <handle>`
  - そうでなければ `orca orchestration worker-release --dispatch <dispatch_id> --json`

節目で可視化:

```bash
orca worktree set --worktree active --comment "設計完了、実装中" --json
orca worktree set --worktree active --workspace-status in-progress --json
```

## 6. 差し戻し（tester → escalation）

`escalation` を受けたら:

```bash
cat docs/orchestration/work/$SLUG/test-report.md   # バグ詳細を把握
orca orchestration task-create \
  --spec "修正: work/$SLUG/test-report.md の失敗ケースを解消。再現テスト追加後に修正。" \
  --json
# => TASK_FIX
# developer の保持ターミナルへ再投入（release していないこと）
orca orchestration worker-start --task "$TASK_FIX" --terminal "$HANDLE_IMPL" --json
```

修正が終わったら再度 test-run（新しい task を作るか、tester ターミナルへ再投入）。
合格するまで 5〜6 を繰り返す。

## 7. PO へレビュー返却

全テスト合格後、`docs/orchestration/work/$SLUG/review-request.md` に
差分概要・確認ポイント・既知の制約を記入してから:

```bash
orca orchestration gate-create --task "$TASK_TESTRUN" \
  --question "レビュー依頼: $SLUG をマージしてよいか（詳細 work/$SLUG/review-request.md）" \
  --options "[\"approve\",\"request-changes\"]" --json
# => GATE_ID

orca worktree set --worktree active --workspace-status in-review --json
orca worktree set --worktree active --comment "レビュー待ち: $SLUG" --json
```

PO の解決を待つ:

```bash
orca orchestration check --wait --types decision_gate,question --timeout-ms 900000 --json
```

- `approve` → 完了。`worktree set --workspace-status completed`。ブランチをマージ手順へ。
- `request-changes` → 6 と同じ要領で修正タスクを developer へ再投入。

## 8. 後始末

```bash
orca orchestration task-list --json           # 全タスク completed か
# 残っている live worker を release
orca orchestration worker-release --dispatch <dispatch_id> --json
```

---

## 低レベル版（`worker-start` で表現できないトポロジのとき）

```bash
orca terminal create --worktree active --title "$SLUG-design" --command "claude" --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task "$TASK_DESIGN" --to <handle> --inject --json
```

## よくあるハマり

| 症状 | 対処 |
|---|---|
| `orca orchestration` が RPC エラー | Settings › Experimental で Orchestration を有効化 |
| worker が sub-dispatch しようとして `nested_worker_depth_exceeded` | 仕様。分解は manager が行う。どうしても必要なら Settings で depth=2 |
| `check --wait --json 2>&1 \| jq` が `Extra data: line 2` | stderr の keepalive を混ぜている。stdout のみをパイプする |
| worker_done の後に task が閉じない | `--outcome` を付け忘れ。succeeded/failed を明示 |
| 差し戻しのたびに worker が消える | `worker-release` してしまっている。引き継ぐなら release せず `--terminal` 再利用 |
