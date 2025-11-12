# Reachy Mini TurboWarp Extension プロジェクト

## プロジェクト概要

このプロジェクトは、[Reachy Mini](https://www.pollen-robotics.com/reachy-mini/) ロボットのための TurboWarp（Scratch 3.0 互換）カスタム拡張機能を開発する**有志によるプロジェクト**です。

**目的**: Reachy Mini ロボットのビジュアルプログラミング環境を提供し、教育や創造的なコーディング、AI実験を容易にすること。

## Reachy Mini について

Reachy Mini は、人間とロボットの相互作用、創造的なコーディング、AI実験のために設計された、表現力豊かなオープンソースロボットです。以下の特徴があります：

- **ハードウェア構成**:
  - 横長の長方形の顔
  - 2本の表現豊かなアンテナ
  - 3軸の頭部制御（pitch, yaw, roll）
  - カメラ、スピーカー、マイク搭載

- **バージョン**:
  - **Lite版**: USB接続、コンピューターでDaemon実行
  - **Wireless版**: Raspberry Pi内蔵、Wi-Fi接続
  - **シミュレーション版**: MuJoCoシミュレーター

## プロジェクト構造

```
reachy_mini_turbowarp/
├── deprecated/                    # 参照用プロトタイプ（使用しない）
│   └── *.js, *.md, *.py          # JavaScriptベースの旧実装
│
├── reachy_mini/                  # Python SDK（git submodule）
│   ├── src/reachy_mini/          # Python SDKソース
│   ├── docs/                     # SDK・APIドキュメント
│   ├── tests/                    # テスト
│   └── tools/                    # ツール
│
├── src/                          # TypeScript拡張機能のソース（未作成）
├── dist/                         # ビルド成果物（未作成）
├── CLAUDE.md                     # このファイル
└── LICENSE                       # Apache 2.0 License
```

## 技術スタック

### 新バージョン（これから開発）
- **言語**: TypeScript
- **ビルドツール**: 未定（webpack, rollup, vite, esbuild等）
- **コンパイル**: TypeScript → JavaScript
- **プラットフォーム**: TurboWarp Desktop
- **通信**: REST API（fetch API）
- **多言語対応**: 英語（en）と日本語（ja）
- **コーディング規約**: ソースコードおよびコメントは英語で記述

### バックエンド（reachy_mini/ submodule）
- **Python SDK**: Python 3.10-3.13
- **Daemon**: FastAPI
- **API**: REST API + WebSocket
- **エンドポイント**: `http://localhost:8000/api/`
- **ドキュメント**: `http://localhost:8000/docs` (OpenAPI)

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│          TurboWarp Desktop                          │
│  ┌───────────────────────────────────────────────┐  │
│  │   Scratch ブロックインターフェース             │  │
│  │   - 英語（en）/ 日本語（ja）対応              │  │
│  └───────────────────────────────────────────────┘  │
│                        ↓                            │
│  ┌───────────────────────────────────────────────┐  │
│  │   Reachy Mini Extension (TypeScript)          │  │
│  │   - ブロック定義（多言語）                     │  │
│  │   - API呼び出し                                │  │
│  │   - 状態管理                                   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓ HTTP/REST API
┌─────────────────────────────────────────────────────┐
│      Reachy Mini Daemon (localhost:8000)            │
│  ┌───────────────────────────────────────────────┐  │
│  │   FastAPI REST API Server                     │  │
│  │   - /api/move/goto                            │  │
│  │   - /api/state/full                           │  │
│  │   - /api/motors/set_mode                      │  │
│  │   - /api/move/play/recorded-move-dataset      │  │
│  └───────────────────────────────────────────────┘  │
│                        ↓                            │
│  ┌───────────────────────────────────────────────┐  │
│  │   Python SDK (reachy_mini)                    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│   Reachy Mini ロボット                               │
│   - 実機（USB or Wi-Fi）                            │
│   - シミュレーション（MuJoCo）                      │
└─────────────────────────────────────────────────────┘
```

## 実装する機能

### 必須機能

#### 基本動作
- ロボットを起こす（wake_up）
- ロボットを寝かせる（goto_sleep）

#### 頭の制御
- 簡単な方向指定（上、下、左、右、左上、右上）
- カスタム角度指定（pitch, yaw, roll, duration）
- 頭を正面に戻す

#### アンテナ制御
- 個別制御（左右別々に指定）
- 対称制御（両方同じ角度）

#### モーター制御
- モードの設定（enabled, disabled, gravity_compensation）
- モーター状態の取得

#### 状態取得（レポーターブロック）
- 頭のpitch/yaw/roll角度
- 左右アンテナの角度
- 体のyaw角度

#### システム情報
- Daemon状態の取得

### オプション機能（将来的に追加検討）

- 事前録画された動作の再生（Hugging Face データセット）
- 動作の停止・管理
- カメラ映像の取得
- 音声再生
- マイク入力

## 多言語対応

TurboWarp拡張機能では、ユーザーのロケール設定に応じてブロックのテキストを切り替える必要があります。

### 対応言語
- **英語（en）**: 国際的なユーザー向け
- **日本語（ja）**: 日本のユーザー向け

### 実装方法

Scratch拡張機能の`getInfo()`メソッドで、`formatMessage`を使用して多言語対応を実装します：

```typescript
// 例：ブロックテキストの定義
{
  opcode: 'wakeUp',
  blockType: BlockType.COMMAND,
  text: formatMessage({
    id: 'reachymini.wakeUp',
    default: 'wake up robot',
    description: 'Command to wake up the Reachy Mini robot'
  })
}
```

メッセージカタログ：
```javascript
// en.json
{
  "reachymini.wakeUp": "wake up robot",
  "reachymini.gotoSleep": "put robot to sleep",
  "reachymini.moveHead": "move head [DIRECTION]",
  // ...
}

// ja.json
{
  "reachymini.wakeUp": "ロボットを起こす",
  "reachymini.gotoSleep": "ロボットを寝かせる",
  "reachymini.moveHead": "頭を [DIRECTION] に動かす",
  // ...
}
```

## REST API エンドポイント

実装で使用する主要なエンドポイント：

### 動作制御
```
POST /api/move/play/wake_up          # ロボットを起こす
POST /api/move/play/goto_sleep       # ロボットを寝かせる
POST /api/move/goto                  # 指定位置へ移動
  Body: {
    head_pose?: { x, y, z, roll, pitch, yaw },  # ラジアン
    antennas?: [left, right],                   # ラジアン
    duration: number,                           # 秒
    interpolation: "minjerk" | "linear"
  }
```

### モーター制御
```
POST /api/motors/set_mode/{mode}     # enabled/disabled/gravity_compensation
GET  /api/motors/status              # モーター状態取得
```

### 状態取得
```
GET  /api/state/full                 # 全状態取得
  Response: {
    head_pose: { x, y, z, roll, pitch, yaw },  # ラジアン
    antennas_position: [left, right],          # ラジアン
    body_yaw: number,                          # ラジアン
    // ...
  }
```

### システム情報
```
GET  /api/daemon/status              # Daemon状態
```

## 角度の扱い

- **Scratchブロック**: 度数法（°）で指定・表示
- **REST API**: ラジアン（rad）で送受信
- **変換**: 拡張機能内で変換処理を実装

```typescript
function degToRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

function radToDeg(radians: number): number {
  return radians * 180 / Math.PI;
}
```

## 座標系

```
Pitch: 上下の動き
  - 正（+）: 上を向く
  - 負（-）: 下を向く

Yaw: 左右の回転
  - 正（+）: 左を向く
  - 負（-）: 右を向く

Roll: 左右の傾き
  - 正（+）: 左に傾く
  - 負（-）: 右に傾く
```

## 開発の流れ

### Phase 1: プロジェクトセットアップ
1. TypeScript環境の構築
2. ビルドツールの選定・設定（webpack/rollup/vite/esbuild）
3. プロジェクト構造の作成
4. 開発サーバーのセットアップ

### Phase 2: 型定義
1. Scratch Extension API の型定義
2. Reachy Mini REST API の型定義（OpenAPI仕様から生成可能）
3. 内部データ構造の型定義

### Phase 3: コア実装
1. Extension クラスの骨組み
2. API通信層の実装
3. ブロック定義（英語版のみ）
4. 基本機能の実装

### Phase 4: 多言語対応
1. メッセージカタログの作成（en.json, ja.json）
2. formatMessage の実装
3. 全ブロックの多言語化

### Phase 5: テスト・ドキュメント
1. ユニットテストの追加
2. TurboWarp での動作確認
3. 実機/シミュレーションでの検証
4. README、使い方ガイドの作成

## 現在の実装状況

### ✅ Phase 1: プロジェクトセットアップ（完了）

#### TypeScript環境
- `package.json`: プロジェクト設定、依存関係管理
- `tsconfig.json`: TypeScript strict mode設定（mypy --strict相当）
- `vite.config.ts`: Viteビルド設定（IIFE形式、CORS対応）
- `eslint.config.js`: ESLint 9 flat config設定
- `.prettierrc.json`: コードフォーマット設定
- `.gitignore`: Git除外設定

#### 開発環境
- **ビルドツール**: Vite 6.0.3
- **テストランナー**: Vitest 4.0.8
- **TypeScript**: 5.7.2
- **TurboWarp型定義**: @turbowarp/types (v0.0.13)
- **開発サーバー**: `npm run dev` (localhost:3000, CORS有効)

#### プロジェクト構造
```
reachy_mini_turbowarp/
├── .github/workflows/
│   └── test.yml              # CI/CD設定（後述）
├── src/
│   ├── api/
│   │   └── client.ts        # REST APIクライアント
│   ├── types/
│   │   ├── api.ts           # REST API型定義
│   │   └── extension.ts     # 拡張機能内部型定義
│   ├── utils/
│   │   ├── angle.ts         # 角度変換ユーティリティ
│   │   └── sleep.ts         # 非同期待機ユーティリティ
│   ├── extension.ts         # Scratch拡張機能クラス
│   └── index.ts             # エントリーポイント
├── dist/
│   ├── extension.js         # ビルド成果物（14.29 kB）
│   └── extension.js.map     # ソースマップ
├── tests/
│   └── unit/
│       └── utils/
│           └── angle.test.ts # 角度変換テスト（19テスト）
├── package.json
├── tsconfig.json
├── vite.config.ts
└── CLAUDE.md
```

### ✅ Phase 2: 型定義（完了）

#### src/types/api.ts
Reachy Mini REST APIの完全な型定義：
- **Pose Types**: `XYZRPYPose`, `Matrix4x4Pose`, `AnyPose`
- **Motor Control**: `MotorControlMode`, `MotorStatus`
- **Movement**: `GotoRequest`, `InterpolationMode`, `MoveUUID`
- **State**: `FullState`, `FullBodyTarget`, `RobotStateCache`
- **API Endpoints**: `API_ENDPOINTS` 定数
- **Type Guards**: `isXYZRPYPose()`, `isMatrix4x4Pose()`

#### src/types/extension.ts
TurboWarp拡張機能の内部型定義：
- **Block Argument Types**: `HeadDirection`, メニューアイテム型
- **Extension State**: 接続状態、API URL、動作UUID、状態キャッシュ
- **Head Direction Presets**: 簡易方向制御用プリセット
- **Block Arguments**: 各ブロックの引数インターフェース
- **API Response Handling**: `ApiResult<T>`, `MoveResult`
- **Extension Configuration**: デフォルト設定、タイムアウト設定

#### src/utils/angle.ts
角度変換ユーティリティ：
- `degToRad(degrees: number): number` - 度数法 → ラジアン
- `radToDeg(radians: number): number` - ラジアン → 度数法

#### src/utils/sleep.ts
非同期待機ユーティリティ：
- `sleep(ms: number): Promise<void>` - 指定ミリ秒だけ待機する

#### tests/unit/utils/angle.test.ts
角度変換の包括的なユニットテスト：
- 基本的な変換テスト（0°, 90°, 180°, 360°）
- 負の角度のテスト
- 小数点角度のテスト
- ラウンドトリップ変換テスト
- エッジケースのテスト
- **合計19テスト、全てパス ✓**

### ✅ Phase 3: コア実装（完了）

#### src/api/client.ts
REST API通信層の実装：
- **ReachyMiniApiClient クラス**: 型安全なAPIクライアント
- **エラーハンドリング**: `ApiError` クラスでステータスコードと元エラーを保持
- **タイムアウトサポート**: デフォルト10秒、`AbortController` 使用
- **実装済みメソッド**:
  - 動作制御: `wakeUp()`, `gotoSleep()`, `goto()`, `stopMovement()`, `isMovementRunning()`
  - 状態取得: `getFullState()`, `getHeadPose()`, `getBodyYaw()`, `getAntennaPositions()`
  - モーター制御: `getMotorStatus()`, `setMotorMode()`
  - システム: `getDaemonStatus()`, `ping()`
- **シングルトンインスタンス**: `apiClient` をエクスポート

#### src/extension.ts
Scratch拡張機能の実装（英語版のみ）：
- **ReachyMiniExtension クラス**: Scratch拡張機能インターフェース実装
- **拡張機能メタデータ**:
  - ID: `reachymini`
  - 名前: `Reachy Mini`
  - カラーテーマ: 青系（`#4C97FF`, `#3373CC`, `#2E5BA6`）
- **ブロック定義** (全て英語):
  - 基本動作: `wake up robot`, `put robot to sleep`
  - 頭制御: 方向プリセット（center/up/down/left/right等）、カスタム角度指定
  - アンテナ制御: 個別制御、対称制御
  - モーター制御: モード設定（enabled/disabled/gravity_compensation）
  - レポーター: pitch/yaw/roll、アンテナ角度、body yaw、モーターモード
  - システム: daemon接続確認
- **HEAD_DIRECTION_PRESETS**: 9方向のプリセット（ラジアン値）
- **状態キャッシュ**: `updateStateCache()` でロボット状態を保持
- **度数法 ↔ ラジアン変換**: ユーザー入力は度数法、API通信はラジアン

#### src/index.ts
拡張機能エントリーポイント：
- **グローバル `Scratch` オブジェクト宣言**: TypeScript型定義
- **拡張機能登録**: `Scratch.extensions.register(new ReachyMiniExtension())`
- **IIFE パターン**: 即時実行関数で安全にラップ

#### ビルド成果物
- **dist/extension.js**: 14.66 kB (gzip: 3.66 kB)
- **フォーマット**: IIFE（Immediately Invoked Function Expression）
- **ソースマップ**: 有効（49.52 kB）

#### 動作完了の待機ロジック（重要！）

**問題**: TurboWarpから連続して動作ブロックを実行すると、音声再生（PortAudio）が適切に終了する前に次の動作が開始され、daemonがクラッシュする問題がありました。

**解決策**: 各動作ブロックに、動作が完了するまで待機するロジックを実装：

- **wake_up / goto_sleep**: ポーリングベース（`isMovementRunning()`を200ms間隔でチェック、最大10秒）
  - 動作開始まで300ms待機
  - 完了後200ms待機（settling time）

- **goto系ブロック**: `duration * 1000 + 200`ms 待機（動作時間 + 200msバッファ）

これにより、ユーザーがScratchスクリプトで明示的に`wait`ブロックを追加しなくても、拡張機能が自動的に動作の完了を待つようになりました。

**パフォーマンス最適化**:
- 統合テスト実行時間: 200秒 → **約30秒**（6倍以上の高速化）
- test-utils: `MOVE_COMPLETION_BUFFER` を 3000ms → 200ms に短縮
- テストの動作時間: 2.5秒 → 0.8秒に短縮

**実装箇所**:
- `src/utils/sleep.ts`: 待機用ユーティリティ関数
- `src/extension.ts`: 各動作ブロック（`wakeUp`, `gotoSleep`, `moveHeadDirection`, `moveHeadCustom`, `moveAntennas`, `moveAntennasBoth`）に待機ロジックを追加
- `tests/integration/test-utils.ts`: 高速化されたテストユーティリティ

### ⏸️ Phase 4: 多言語対応（未着手）

次のステップ：
1. メッセージカタログの作成（`src/i18n/en.json`, `src/i18n/ja.json`）
2. `formatMessage` 関数の実装
3. 全ブロックテキストの多言語化
4. メニューアイテムの多言語化

### ⏸️ Phase 5: テスト・ドキュメント（一部完了）

- ✅ 角度変換のユニットテスト（19テスト）
- ⏸️ API通信のユニットテスト（モック使用）
- ⏸️ 統合テスト（daemon連携）
- ⏸️ TurboWarpでの動作確認
- ⏸️ README、使い方ガイドの作成

## GitHub Actions CI/CD

### 実装済みワークフロー

`.github/workflows/test.yml` により、以下の自動テストを実装：

#### ジョブ構成

**1. Unit Tests ジョブ**
- Node.js 20 環境
- 依存関係のインストール（npm ci）
- ユニットテストの実行（daemon不要）
- 高速実行（~1分）

**2. Integration Tests ジョブ**
- Ubuntu latest環境
- Python 3.11 + Node.js 20
- システム依存関係のインストール：
  - `libgl1` - OpenGL ライブラリ
  - `libosmesa6` - オフスクリーンレンダリング
  - `libglew-dev` - OpenGL拡張
  - `libportaudio2` - 音声ライブラリ
- Git LFS有効化（STLメッシュファイル用）
- Reachy Mini Python SDK + MuJoCoのインストール
- Daemonをヘッドレスモードで起動：
  ```bash
  nohup reachy-mini-daemon --sim --headless --no-wake-up-on-start > daemon.log 2>&1 &
  ```
- Daemon起動確認（curl retry with 15s wait）
- 統合テストの実行（将来実装予定）

**3. Lint ジョブ**
- ESLint実行（max-warnings 0）
- Prettierフォーマットチェック

#### トリガー条件
- `push` on `main` branch
- Pull Request to `main` branch

#### 特徴
- **グレースフルデグラデーション**: `src/index.ts`や統合テストが未実装でもスキップしてパス
- **詳細なロギング**: Daemon起動失敗時にログを表示
- **npm cache**: package-lock.json による高速化
- **MuJoCo headless mode**: CI/CD環境でのGUIなしシミュレーション

### ローカルテスト実行

```bash
# ユニットテストのみ（高速）
npm run test:unit

# ビルドのみ
npm run build

# Lint + Format
npm run lint
npm run format:check

# 全てのテスト（統合テストを含む、daemon起動が必要）
npm test
```

## テスト戦略

このプロジェクトでは、**レイヤー別のテスト戦略**を採用します。TurboWarp公式リポジトリでは拡張機能のE2Eテストは実施されておらず、主に静的解析と手動テストに依存しているため、現実的なアプローチとして以下の優先順位でテストを実装します。

### 1. Unit Tests（優先度: 高）

拡張機能のロジックを単体テストします。daemonへの接続は不要で、高速に実行できます。

#### 対象
- 角度変換関数（度数法 ↔ ラジアン）
- API クライアントのロジック（モック使用）
- ブロック定義の検証
- ユーティリティ関数

#### テスト例

```typescript
// tests/unit/angle-converter.test.ts
describe('Angle Converter', () => {
  test('should convert degrees to radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    expect(degToRad(0)).toBe(0);
  });

  test('should convert radians to degrees', () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
    expect(radToDeg(0)).toBe(0);
  });
});

// tests/unit/api-client.test.ts
describe('Reachy API Client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('should call wake_up endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ uuid: 'test-uuid-123' })
    });

    const result = await wakeUp();
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/move/play/wake_up',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await wakeUp();
    expect(result.success).toBe(false);
  });
});
```

### 2. Integration Tests（優先度: 高）

MuJoCoシミュレータをヘッドレスモードで起動し、REST APIの統合テストを実行します。これにより、拡張機能とdaemon間の通信を検証できます。

#### MuJoCoシミュレータのヘッドレスモード起動

```bash
# テスト用にヘッドレスモードでdaemonを起動
reachy-mini-daemon --sim --headless --no-wake-up-on-start
```

**主要なオプション**:
- `--sim`: シミュレーションモードで起動
- `--headless`: GUIなしで起動（CI/CD対応）
- `--no-wake-up-on-start`: 起動時に自動でwake upしない（テストで制御）
- `--scene empty`: 空のシーン（デフォルト、テストに最適）

#### 対象
- REST APIエンドポイントの動作確認
- リクエスト/レスポンスの検証
- 状態管理の確認
- エラーハンドリング

#### テスト例

```typescript
// tests/integration/api-endpoints.test.ts
describe('Reachy Mini API Integration', () => {
  const API_BASE = 'http://localhost:8000/api';

  beforeAll(async () => {
    // Wait for daemon to be ready
    await waitForDaemon(API_BASE, { timeout: 10000 });
  });

  afterEach(async () => {
    // Reset robot to default state after each test
    await fetch(`${API_BASE}/move/goto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        head_pose: { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0 },
        antennas: [0, 0],
        duration: 1.0
      })
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('should wake up robot via API', async () => {
    const response = await fetch(`${API_BASE}/move/play/wake_up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.uuid).toBeDefined();
  });

  test('should move head to specified angles', async () => {
    const response = await fetch(`${API_BASE}/move/goto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        head_pose: {
          x: 0, y: 0, z: 0,
          pitch: 0.1, // ~5.7 degrees
          yaw: 0.2,   // ~11.5 degrees
          roll: 0
        },
        duration: 1.0,
        interpolation: 'minjerk'
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.uuid).toBeDefined();

    // Wait for movement to complete
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify state
    const stateResponse = await fetch(`${API_BASE}/state/full`);
    const state = await stateResponse.json();

    expect(state.head_pose.pitch).toBeCloseTo(0.1, 1);
    expect(state.head_pose.yaw).toBeCloseTo(0.2, 1);
  });

  test('should control antennas individually', async () => {
    const response = await fetch(`${API_BASE}/move/goto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        antennas: [0.3, -0.3], // Left up, right down
        duration: 1.0
      })
    });

    expect(response.ok).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const stateResponse = await fetch(`${API_BASE}/state/full`);
    const state = await stateResponse.json();

    expect(state.antennas_position[0]).toBeCloseTo(0.3, 1);
    expect(state.antennas_position[1]).toBeCloseTo(-0.3, 1);
  });

  test('should set motor mode', async () => {
    const response = await fetch(`${API_BASE}/motors/set_mode/disabled`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok).toBe(true);

    const statusResponse = await fetch(`${API_BASE}/motors/status`);
    const status = await statusResponse.json();
    expect(status.mode).toBe('disabled');
  });
});
```

### 3. TurboWarp E2E Tests（優先度: 低、オプション）

TurboWarp上での拡張機能の実際の動作を検証します。Playwright/Puppeteerを使用しますが、セットアップの複雑さから優先度は低く設定します。

#### 対象
- 拡張機能のロード確認
- ブロックの表示確認
- 基本的なブロック実行（オプション）

#### テスト例

```typescript
// tests/e2e/turbowarp.test.ts (optional)
import { test, expect } from '@playwright/test';

test.describe('TurboWarp Extension Loading', () => {
  test('should load extension in TurboWarp', async ({ page }) => {
    await page.goto('https://turbowarp.org/');

    // Click on extensions button
    await page.click('button[aria-label="Choose an Extension"]');

    // Select custom extension
    await page.click('text=Custom Extension');

    // Enter extension URL
    await page.fill('input[type="url"]', 'http://localhost:3000/extension.js');
    await page.press('input[type="url"]', 'Enter');

    // Verify extension loaded
    await expect(page.locator('text=Reachy Mini')).toBeVisible({ timeout: 5000 });
  });
});
```

### テスト構成

推奨されるテストディレクトリ構造：

```
tests/
├── unit/              # Unit tests (daemon不要、高速)
│   ├── angle-converter.test.ts
│   ├── api-client.test.ts
│   └── block-definitions.test.ts
├── integration/       # Integration tests (daemon必要)
│   ├── api-endpoints.test.ts
│   └── state-management.test.ts
└── e2e/              # TurboWarp E2E tests (オプション)
    └── extension-loading.test.ts
```

### ローカルでのテスト実行

```bash
# Unit tests (daemon不要)
npm run test:unit

# Integration tests (daemon必要)
# Terminal 1: Start daemon in headless mode
reachy-mini-daemon --sim --headless --no-wake-up-on-start

# Terminal 2: Run integration tests
npm run test:integration

# All tests (unit + integration)
npm test
```

### CI/CD統合（GitHub Actions）

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install Reachy Mini with MuJoCo
        run: |
          cd reachy_mini
          pip install -e .[mujoco]

      - name: Start daemon in headless mode
        run: |
          reachy-mini-daemon --sim --headless --no-wake-up-on-start &
          sleep 5  # Wait for daemon to start

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build extension
        run: npm run build

      - name: Run integration tests
        run: npm run test:integration
```

### テストのベストプラクティス

1. **テストの独立性**: 各テストは独立して実行可能にする
2. **状態のクリーンアップ**: 各テスト後にロボットを初期状態に戻す
3. **タイムアウト設定**: 動作完了を待つための適切なタイムアウトを設定
4. **モックの活用**: Unit testsではfetchをモック化し、Integration testsでは実際のAPIを使用
5. **エラーハンドリング**: 接続エラーやタイムアウトを適切に処理
6. **並列実行の回避**: Integration testsは順次実行（ロボットの状態が競合する可能性）

## 参考資料

### deprecatedディレクトリ（参照のみ）

`deprecated/` ディレクトリには、JavaScriptで実装されたプロトタイプが含まれています。これらは**今後使用しません**が、以下の参考情報として有用です：

- API エンドポイントの使い方
- ブロック定義の例
- 角度変換の実装例
- エラーハンドリングのパターン

### プロジェクト内ドキュメント

- `reachy_mini/README.md`: Python SDK とDaemonの説明
- `reachy_mini/docs/python-sdk.md`: Python SDK の詳細
- `reachy_mini/docs/rest-api.md`: REST API の詳細

### 外部リソース

- [Reachy Mini 公式サイト](https://www.pollen-robotics.com/reachy-mini/)
- [Reachy Mini GitHub](https://github.com/pollen-robotics/reachy_mini)
- [TurboWarp](https://turbowarp.org/)
- [TurboWarp Desktop](https://desktop.turbowarp.org/)
- [TurboWarp Extensions](https://github.com/TurboWarp/extensions)
- [Scratch Extensions Documentation](https://github.com/LLK/scratch-vm/blob/develop/docs/extensions.md)

### API ドキュメント

Daemon起動中は以下のURLでインタラクティブなAPIドキュメントにアクセス可能：
- OpenAPI Docs: `http://localhost:8000/docs`
- Dashboard: `http://localhost:8000/`

## Daemon の起動方法

開発・テスト時は、Reachy Mini Daemon を起動しておく必要があります。

### シミュレーションモード（推奨）
```bash
cd reachy_mini
reachy-mini-daemon --sim
```

### 実機モード（Lite版）
```bash
cd reachy_mini
reachy-mini-daemon
```

### 実機モード（Wireless版）
Raspberry Pi上で自動起動、またはSSH接続して起動

## 拡張機能の読み込み方法

開発中の拡張機能をTurboWarpで読み込むには：

1. Daemon を起動
2. 拡張機能をビルド・配信
3. TurboWarp Desktop を起動
4. 「拡張機能を追加」→「カスタム拡張機能」
5. 拡張機能のURLを入力（例: `http://localhost:3000/extension.js`）

## ライセンス

Apache 2.0 License

このプロジェクト自体は有志によるものですが、Reachy Mini本体のライセンスに準拠しています。

---

**Last Updated**: 2025-11-11
**Project Status**: Phase 1-3 完了、Phase 4（多言語対応）準備中
