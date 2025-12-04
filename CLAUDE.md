# Reachy Mini TurboWarp Extension プロジェクト

## プロジェクト概要
Reachy Mini（Lite / Wireless / シミュレーション）を TurboWarp / Scratch 3.0 から制御するための TypeScript 製カスタム拡張機能です。ロボットは `reachy-mini-daemon` が公開する REST API（FastAPI + WebSocket）で操作され、エクステンションはその API を HTTP 経由で呼び出します。英語と日本語の 2 言語に対応し、教育用途やハッカソンでの迅速な操作を主目的としています。

## 最近のアップデート（2025-11）
- **完全な TypeScript 実装**: `src/extension.ts` に Scratch 拡張機能を実装し、TurboWarp 環境で即ロード可能な IIFE バンドル（`dist/extension.js`）を生成。
- **多言語対応の完成**: Scratch から公開される `translate.setup()` API を使って en/ja メッセージカタログを登録。OS もしくは TurboWarp VM から取得したロケールでブロック名・メニューを自動切替。
- **Recorded move メニュー**: Pollen Robotics が公開している「dances」「emotions」ライブラリをメニュー化し、モーション名を自動翻訳（`src/extension.ts#L320` 付近）。
- **安全な API クライアント**: `src/api/client.ts` で localhost のみを許可する URL サニタイズ、タイムアウト付 fetch、Recorded move パスの encode を実装。
- **状態キャッシュ付きレポーターブロック**: `/state/full` と `/motors/status` をまとめてフェッチし、ヘッド角度などを 1 回の API 呼び出しで供給。
- **CI/CD 拡充**: `test.yml`（Lint + Unit + Integration）、`deploy-extension.yml`（gh-pages 自動更新）、`release.yml`（タグ push で artifacts と jsDelivr URL を配布）を整備。

## リポジトリ構造
```
reachy_mini_turbowarp/
├── CLAUDE.md                     # このドキュメント
├── README.md                     # 英語の使用ガイド（jsDelivr URL 記載）
├── src/
│   ├── api/client.ts             # REST クライアント（fetch ラッパー）
│   ├── extension.ts              # Scratch 拡張機能の本体
│   ├── index.ts                  # TurboWarp への登録 IIFE
│   ├── types/{api,extension}.ts  # API/内部型
│   └── utils/{angle,sleep}.ts    # 度↔rad, await sleep
├── tests/
│   ├── unit/
│   │   ├── utils/angle.test.ts
│   │   └── api/client-recorded-moves.test.ts
│   └── integration/
│       ├── api-client.test.ts
│       ├── extension.test.ts
│       └── test-utils.ts
├── .github/workflows/
│   ├── test.yml                  # Lint + Unit + Integration
│   ├── deploy-extension.yml      # main push で gh-pages へ出力
│   └── release.yml               # vX.Y.Z タグを GitHub Release 化
├── dist/                         # `npm run build` で生成（IIFE）
├── deprecated/                   # JS 試作コード（参照のみ）
├── public/, img/, node_modules/, package*.json, tsconfig.json など
└── vite.config.ts                # IIFE ビルド + CORS enable
```

## 技術スタック
- **言語 / モジュール**: TypeScript 5.7、ESM（`"type": "module"`）
- **ビルド**: Vite 6（library mode, format `iife`, filename `extension.js`）、esbuild minify、`@` エイリアス
- **Lint / Format**: ESLint 9 + `@typescript-eslint` + Prettier 3（`npm run lint`, `npm run format:check`）
- **テスト**: Vitest 4（`tests/unit`, `tests/integration`）
- **型定義**: `@turbowarp/types`（Git submodule 由来の TW 型）
- **Python daemon**: PyPI `reachy-mini` をインストールして `reachy-mini-daemon` を実行（サブモジュール不要、用途に応じて `mujoco` などの extras を付与）
- **Node 要件**: Node 18 以上 / npm 9 以上

## Extension 実装ハイライト（`src/extension.ts`）
### i18n
- `Scratch.translate.setup()` を利用し、`TRANSLATIONS` へ en/ja のメッセージカタログを登録。
- `resolveLocale()` が VM ロケール → 翻訳関数の言語 → 英語の順で決定。
- Dataset ラベルは MessageId で翻訳、Recorded move の名前は `splitRecordedMoveWords()` で単語分割し、`RECORDED_MOVE_WORD_LABELS` で対訳化。

### ブロックカテゴリ
1. **Basic**: `wakeUp`, `gotoSleep`, `playRecordedMoveDataset`（Recorded move dataset + move を 1 引数にエンコード）。
2. **Head Control**: 8 方位プリセット（`HEAD_DIRECTION_PRESETS`）、カスタム角度（度数入力→rad変換）、プリセットモーション 4 種（nod/shake/antenna wave/body sway）。
3. **Antenna/Body**: 個別アンテナ、左右一括、胴体ヨー角。Scratch 入力は度数で、API 送信前に `degToRad`。
4. **Motor**: `setMotorMode`（enabled / disabled / gravity_compensation）。
5. **Reporter**: 頭 3 軸、アンテナ左右、胴 yaw、モード状態。
6. **System**: `isDaemonConnected`（`/daemon/status` の到達性を確認）。

### 時間管理・エラーハンドリング
- すべてのモーションは `sleep()` を併用し、`duration` に応じた待機 + 200ms バッファで PortAudio のクラッシュを防止。
- Wake up / goto sleep / recorded move は不確定長のため、`/move/running` を 200〜300ms 間隔でポーリングし、最大 10〜60 秒でタイムアウト。
- Reporter 呼び出し前に `updateStateCache()` を共有で実行して API 呼び出し回数を削減し、`ExtensionState` に結果を保持。

### Recorded Move メニュー
- `pollen-robotics/reachy-mini-dances-library` と `reachy-mini-emotions-library` 2 系列をバンドル。
- 各項目は `dataset||move` 形式で value 化。手動入力時は default dataset にフォールバック。
- ラベルは「Dataset ラベル: 翻訳済みモーション名」で表示され、TurboWarp 日本語 UI でも自然に読めるように調整。

### Utility
- `setupTranslations()` ログで TurboWarp が expose しているロケールをデバッグ出力。
- `BASE_HEAD_POSE` に head_pose の基準を定義し、プリセット/プリセットモーションで再利用。

## REST API クライアント（`src/api/client.ts`）
- すべてのメソッドが `ApiError` を throw。`AbortController` で 30s タイムアウト。
- `sanitizeBaseUrl()` が localhost ドメイン以外を拒否し、末尾スラッシュを削除。
- `encodeDatasetPath()` で dataset のスラッシュを維持したまま URL encode。
- 実装済みエンドポイント:
  - `/move/play/wake_up`, `/move/play/goto_sleep`, `/move/goto`, `/move/running`, `/move/stop`
  - `/move/recorded-move-datasets/list/:dataset`, `/move/play/recorded-move-dataset/:dataset/:move`
  - `/state/full`, `/state/present_head_pose`, `/state/present_body_yaw`, `/state/present_antenna_joint_positions`
  - `/motors/status`, `/motors/set_mode/:mode`
  - `/daemon/status`
- `apiClient` シングルトンを export し、extension でもテストでも再利用。

## 度数・座標系
- Scratch ブロックは度数法、daemon API はラジアン。`src/utils/angle.ts` で双方向変換。
- Reachy Mini の pitch は **負値が上を向く / 正値が下を向く**（ドキュメントと逆）。コード内コメントとプリセット値もそれを前提にしている。
- Yaw は正で左、負で右。Roll は左傾きが正。

## テスト戦略と現状
| レイヤー | 実装状況 | 代表ファイル | 備考 |
| --- | --- | --- | --- |
| Unit | ✅ | `tests/unit/utils/angle.test.ts`（双方向変換19ケース）、`tests/unit/api/client-recorded-moves.test.ts`（dataset encode の fetch URL を検証） | fetch を Vitest mock に差し替え |
| Integration | ✅（一部制限付き） | `tests/integration/api-client.test.ts`, `tests/integration/extension.test.ts`, `tests/integration/test-utils.ts` | MuJoCo simulator + `reachy-mini-daemon --sim --headless --no-wake-up-on-start` を前提。タイミング不安定なテストはコメントアウト＆TODO 付き |
| E2E (TurboWarp UI) | 未着手 | `tests/e2e/` プレースホルダー | Playwright などで UI を叩く案のみ記載 |

### テスト実行手順
```bash
npm run lint                   # ESLint + Prettier check
npm run test:unit              # fetch モックのみで高速
reachy-mini-daemon --sim --headless --no-wake-up-on-start &  # 端末1
npm run test:integration       # 端末2、Vitest で API/extension を実行
npm run build && npm run preview  # dist/extension.js を確認
```
`tests/integration/test-utils.ts` が daemon 起動待ち・ポーリング・姿勢リセットを共通化し、`MOVE_COMPLETION_BUFFER` を 200ms まで短縮して総時間を ~30s に圧縮しています。

### 既知のテスト制約
- シミュレータではモーターの enable/disable が未実装のため、`setMotorMode` の統合テストはスキップ。
- ヘッド／アンテナの角度検証は精度ブレが大きいためコメントアウト済み（TODO 付き）。
- Recorded move dataset がローカルにダウンロードされていない場合、テストは early return してスキップログを出します。

## CI/CD ワークフロー
1. **`test.yml`**
   - `unit-tests`: Node 20 で `npm ci` → `npm run test:unit`
   - `integration-tests`: Python 3.11 + MuJoCo 依存を apt でインストールし、PyPI から `pip install "reachy-mini[mujoco]"` → daemon を headless 起動 → build → `npm run test:integration`。失敗時は `daemon.log` を artifact 化。
   - `lint`: ESLint & Prettier check。
2. **`deploy-extension.yml`**
   - main への push（および手動トリガー）で `npm run build` → `dist/` を `gh-pages` ブランチへ force deploy（`peaceiris/actions-gh-pages`）。
3. **`release.yml`**
   - `v*.*.*` タグ push でユニットテスト → ビルド → GitHub Release 生成。Release ノートには jsDelivr 経由の URL が埋め込まれます。

## 配布と TurboWarp での読込
- 最新ビルドは `https://cdn.jsdelivr.net/gh/iizukak/reachy_mini_turbowarp@gh-pages/extension.js`（24h キャッシュあり）。
- 開発中は `npm run dev` で Vite が `http://localhost:3000/extension.js` を配信（CORS 有効、プラグインで URL をログ出力）。
- TurboWarp での手順：Extension メニュー → "Custom Extension" → 上記 URL を貼り付け → ブロックパレットに「Reachy Mini」が出現。daemon が動作していないと各ブロックは失敗するので注意。

## Daemon 運用メモ
```bash
pip install "reachy-mini[mujoco]"  # 初回のみ（シミュレータ用）。実機は extras なしでも可。
reachy-mini-daemon --sim --headless --no-wake-up-on-start
# 実機 (Lite): USB 接続後 `reachy-mini-daemon`
# Wireless: Raspberry Pi 側で自動起動 or SSH で起動
```
- シミュレーション時は `--scene empty` がデフォルト。CI では `libgl1`, `libosmesa6`, `libglew-dev`, `libportaudio2` を apt で導入済み。
- API Docs: `http://localhost:8000/docs`（OpenAPI）、Dashboard: `http://localhost:8000/`。

## 既知の課題 / 次のステップ
1. Recorded move dataset を自動取得する仕組み（現状は daemon 側のリソース次第）。
2. TurboWarp UI を用いた E2E テスト（Playwright）とスクリーンショット更新。
3. 無線版（Raspberry Pi）での疎通検証。現在は Lite + シミュレータのみ確認。
4. Reporter ブロックのキャッシュ TTL を導入して API 呼び出し頻度を調整。
5. ドキュメント英文化（CLAUDE.md の英語版 or README との重複整理）。

## 参考
- Reachy Mini 公式: <https://www.pollen-robotics.com/reachy-mini/>
- SDK リポジトリ: <https://github.com/pollen-robotics/reachy_mini>
- TurboWarp: <https://turbowarp.org/>
- TurboWarp Desktop: <https://desktop.turbowarp.org/>
- TurboWarp Extension spec: <https://github.com/TurboWarp/extensions>
- Scratch Extension docs: <https://github.com/LLK/scratch-vm/blob/develop/docs/extensions.md>
- `deprecated/` ディレクトリ: 旧 JavaScript 実装（API 利用例／角度計算の参考）

---
**Last Updated**: 2025-11-16  
**Project Status**: Phase 1-4 ✔ / Phase 5（テスト & ドキュメント拡充）進行中
