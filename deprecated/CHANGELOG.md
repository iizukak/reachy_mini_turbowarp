# 変更履歴

## バージョン 2.0 - 機能拡張版（Enhanced Version）

### 🎉 新機能

#### 1. モーター制御
- **`モーターを [MODE] にする`**: モーターの動作モードを変更
  - `ON (有効)`: 通常の位置制御
  - `OFF (無効)`: モーター無効化、完全にフリー
  - `コンプライアント`: 重力補償モード、手で動かせる
- **`モーターの状態`**: 現在のモーターモードを取得

**使用例**:
```scratch
モーターを [コンプライアント] にする
// ロボットを手で動かしてポーズを教える
```

#### 2. 事前録画された動作（Recorded Moves）
- **`動作を再生 [DATASET]/[MOVE]`**: Hugging Face上の録画された動作を再生
  - デフォルトデータセット: `pollen-robotics/reachy_mini_moves`
  - 利用可能な動作: `nod-yes`, `shake-no`, `happy`, `sad`, `curious` など
- **`利用可能な動作リスト [DATASET]`**: データセット内の動作リストを取得

**使用例**:
```scratch
動作を再生 [pollen-robotics/reachy_mini_moves]/[nod-yes]
// ロボットがうなずく
```

#### 3. 動作制御
- **`実行中の動作を停止`**: 最後に実行した動作を緊急停止
- **`実行中の動作数`**: 現在実行中の動作の数を取得

**使用例**:
```scratch
[s]キーが押されたとき
  実行中の動作を停止
```

#### 4. 追加のセンサー
- **`体のyaw角度`**: 体（ベース）の回転角度を取得

#### 5. システム情報
- **`daemon状態`**: Reachy Mini daemonの状態を取得（running/stopped）

---

### 📊 統計

| 項目 | バージョン 1.0 | バージョン 2.0 | 増加 |
|------|---------------|---------------|------|
| **コマンドブロック** | 8 | 13 | +5 |
| **レポーターブロック** | 5 | 9 | +4 |
| **合計ブロック数** | 13 | 22 | +9 |
| **対応API数** | 5 | 11 | +6 |

---

### 🔧 実装詳細

#### 対応REST APIエンドポイント

**バージョン 1.0**:
- `POST /api/move/play/wake_up`
- `POST /api/move/play/goto_sleep`
- `POST /api/move/goto`
- `GET /api/state/full`

**バージョン 2.0で追加**:
- `POST /api/motors/set_mode/{mode}` - モーター制御
- `GET /api/motors/status` - モーターステータス
- `POST /api/move/play/recorded-move-dataset/{dataset}/{move}` - 録画動作再生
- `GET /api/move/recorded-move-datasets/list/{dataset}` - 動作リスト
- `POST /api/move/stop` - 動作停止
- `GET /api/move/running` - 実行中動作
- `GET /api/state/present_body_yaw` - Body yaw取得
- `GET /api/daemon/status` - Daemon状態

---

### 💡 新しいユースケース

#### 1. ティーチングモード
```scratch
緑の旗が押されたとき
  モーターを [コンプライアント] にする
  [ロボットを動かしてポーズを教えてください] と言う
  [10]秒待つ
  モーターを [ON (有効)] にする
```

#### 2. 感情表現ライブラリ
```scratch
[1]キーが押されたとき
  動作を再生 [pollen-robotics/reachy_mini_moves]/[happy]

[2]キーが押されたとき
  動作を再生 [pollen-robotics/reachy_mini_moves]/[sad]

[3]キーが押されたとき
  動作を再生 [pollen-robotics/reachy_mini_moves]/[curious]
```

#### 3. 動作の中断制御
```scratch
// 長い動作を実行
動作を再生 [pollen-robotics/reachy_mini_moves]/[complex-dance]

// 別のスクリプトで緊急停止
[スペース]キーが押されたとき
  実行中の動作を停止
  [動作を停止しました] と言う
```

#### 4. システムモニタリング
```scratch
ずっと
  もし [daemon状態] ≠ [running] なら
    [警告: daemon が停止しています] と言う
  終わり
  もし [モーターの状態] = [disabled] なら
    [注意: モーターが無効です] と言う
  終わり
  [2]秒待つ
終わり
```

---

### 🛠️ 技術的改善

1. **キャッシング機構**: 録画動作のリストをキャッシュし、重複リクエストを削減
2. **UUID管理**: 最後に実行した動作のUUIDを保持し、停止操作を可能に
3. **エラーハンドリング**: 全てのAPI呼び出しにtry-catchを実装
4. **コードコメント**: 各関数に詳細なJSDocコメントを追加

---

### 📝 ドキュメント

#### 新規作成
- **API_REFERENCE.md**: 全ブロックの詳細リファレンス
- **CHANGELOG.md**: このファイル

#### 更新
- **README.md**: 新機能を反映
- **SAMPLE_PROJECTS.md**: 新しいサンプルプロジェクトを追加予定

---

### 🚀 互換性

- ✅ バージョン 1.0のプロジェクトは完全に動作します
- ✅ 新しいブロックは既存のブロックに影響を与えません
- ✅ SDK本体への変更は不要です

---

### 📦 ファイル構成

```
scratch-reachy-mini/
├── reachy-mini-extension.js (更新) - 22ブロック実装
├── serve_extension.py (変更なし)
├── README.md (更新)
├── API_REFERENCE.md (新規) - 詳細APIリファレンス
├── CHANGELOG.md (新規) - このファイル
├── QUICKSTART.md (変更なし)
└── SAMPLE_PROJECTS.md (変更なし)
```

---

## バージョン 1.0 - 初回リリース

### 機能
- 基本動作（起きる/寝る）
- 頭の制御（簡易方向指定/詳細角度指定）
- アンテナ制御（個別/対称）
- 状態取得（頭の角度、アンテナ角度）

### ブロック数
- コマンドブロック: 8
- レポーターブロック: 5
- 合計: 13

---

## 今後の計画

### バージョン 2.1（予定）
- [ ] カメラ映像の取得
- [ ] 音声出力機能
- [ ] マイク入力機能
- [ ] カスタム補間モードの選択

### バージョン 3.0（構想）
- [ ] WebSocketによるリアルタイム状態ストリーム
- [ ] 複数ロボットの同時制御
- [ ] 動作の録画機能
- [ ] ビジュアルプログラミングガイド

---

**作成日**: 2025年11月3日
**作成者**: Claude Code + User
