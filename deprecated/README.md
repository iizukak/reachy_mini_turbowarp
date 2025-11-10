# Reachy Mini Scratch Extension

ScratchからReachy Miniロボットを制御するためのカスタム拡張機能です。

![Reachy Mini](https://www.pollen-robotics.com/wp-content/uploads/2025/06/Reachy_mini_simulation.gif)

## 📋 目次

- [特徴](#特徴)
- [必要なもの](#必要なもの)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [利用可能なブロック](#利用可能なブロック)
- [サンプルプロジェクト](#サンプルプロジェクト)
- [トラブルシューティング](#トラブルシューティング)

## ✨ 特徴

- 🤖 Scratchの直感的なブロックでReachy Miniを制御
- 🎯 頭の動き（pitch, yaw, roll）の完全な制御
- 📡 アンテナの個別または対称的な制御
- 📊 リアルタイムのセンサー値取得
- 🎭 簡単な方向指定（上、下、左、右など）
- 💤 起きる/寝るアクション
- 🎨 Reachy Miniの特徴を反映したカスタムアイコン（2本のアンテナ付き）

## 🔧 必要なもの

1. **Reachy Miniロボット**（実機またはシミュレーション）
2. **TurboWarp Desktop** - Scratchの改良版
   - ダウンロード: https://desktop.turbowarp.org/
3. **Python 3.10+** - サーバー実行用
4. **Reachy Mini daemon** - ロボット制御デーモン

## 📦 セットアップ

### ステップ1: TurboWarpのインストール（Ubuntu）

```bash
# .debパッケージをダウンロード
wget https://desktop.turbowarp.org/TurboWarp-linux-x86_64.deb

# インストール
sudo apt install ./TurboWarp-linux-x86_64.deb
```

または、AppImageを使用:
```bash
wget https://desktop.turbowarp.org/TurboWarp-linux-x86_64.AppImage
chmod +x TurboWarp-linux-x86_64.AppImage
./TurboWarp-linux-x86_64.AppImage
```

### ステップ2: Reachy Mini daemonの起動

#### シミュレーションの場合:
```bash
cd ~/projects/reachy_mini
reachy-mini-daemon --sim
```

#### 実機の場合:
```bash
cd ~/projects/reachy_mini
reachy-mini-daemon
```

ダッシュボードが http://localhost:8000 で起動します。

### ステップ3: 拡張機能サーバーの起動

```bash
cd ~/projects/scratch-reachy-mini
python3 serve_extension.py
```

以下のように表示されれば成功です:
```
============================================================
  Reachy Mini Scratch Extension Server
============================================================

🚀 Server starting on http://localhost:3000
📁 Serving files from: /home/kentaro/projects/scratch-reachy-mini
...
```

## 🚀 使い方

### TurboWarpで拡張機能を読み込む

1. **TurboWarpを起動**

2. **拡張機能を追加**
   - 左下の「拡張機能を追加」ボタンをクリック

3. **カスタム拡張機能を選択**
   - 一番下までスクロール
   - 「カスタム拡張機能」をクリック

4. **URLを入力**
   ```
   http://localhost:3000/reachy-mini-extension.js
   ```

5. **拡張機能が読み込まれます！**
   - 左側のブロックパレットに「Reachy Mini」が表示されます

### 簡単なテストプログラム

最初のプログラムを作ってみましょう：

```
緑の旗が押されたとき
  ロボットを起こす
  [2]秒待つ
  頭を [上] に動かす
  [1]秒待つ
  頭を正面に戻す
  [2]秒待つ
  ロボットを寝かせる
```

## 🧩 利用可能なブロック

### 基本アクション

| ブロック | 説明 |
|---------|------|
| `ロボットを起こす` | ロボットを起動状態にする |
| `ロボットを寝かせる` | ロボットをスリープ状態にする |

### 頭の制御

| ブロック | 説明 |
|---------|------|
| `頭を [方向] に動かす` | 簡単な方向指定で頭を動かす<br>選択肢: 上、下、左、右、左上、右上 |
| `頭を動かす pitch:[PITCH] yaw:[YAW] roll:[ROLL] 時間:[DURATION]秒` | カスタム角度で頭を動かす（度数法） |
| `頭を正面に戻す` | 頭をデフォルト位置に戻す |

### アンテナの制御

| ブロック | 説明 |
|---------|------|
| `アンテナを動かす 左:[LEFT]° 右:[RIGHT]°` | 左右のアンテナを個別に制御 |
| `アンテナを [ANGLE]° にする` | 両方のアンテナを同じ角度に設定 |

### モーター制御 ⭐NEW

| ブロック | 説明 |
|---------|------|
| `モーターを [MODE] にする` | モードを設定: ON / OFF / コンプライアント |
| `モーターの状態` | 現在のモーターモードを取得 |

### 事前録画された動作 ⭐NEW

| ブロック | 説明 |
|---------|------|
| `動作を再生 [DATASET]/[MOVE]` | 録画された動作を再生（例: nod-yes, shake-no） |
| `利用可能な動作リスト [DATASET]` | 利用可能な動作のリストを取得 |

### 動作制御 ⭐NEW

| ブロック | 説明 |
|---------|------|
| `実行中の動作を停止` | 最後に実行した動作を停止 |
| `実行中の動作数` | 現在実行中の動作の数を取得 |

### センサー値取得（レポーターブロック）

| ブロック | 説明 |
|---------|------|
| `頭のpitch角度` | 現在の頭のpitch角度を取得（度） |
| `頭のyaw角度` | 現在の頭のyaw角度を取得（度） |
| `頭のroll角度` | 現在の頭のroll角度を取得（度） |
| `左アンテナの角度` | 左アンテナの現在角度を取得（度） |
| `右アンテナの角度` | 右アンテナの現在角度を取得（度） |
| `体のyaw角度` ⭐NEW | 体の回転角度を取得（度） |

### システム情報 ⭐NEW

| ブロック | 説明 |
|---------|------|
| `daemon状態` | daemonの状態を取得 |

## 📚 サンプルプロジェクト

詳細なサンプルプロジェクトは [SAMPLE_PROJECTS.md](SAMPLE_PROJECTS.md) を参照してください。

### クイックサンプル

**1. 首を振る動き**
```
[10]回繰り返す
  頭を [左] に動かす
  [0.5]秒待つ
  頭を [右] に動かす
  [0.5]秒待つ
終わり
```

**2. キーボード制御**
```
[上向き矢印▲]キーが押されたとき
  頭を [上] に動かす
```

**3. 感情表現**
```
アンテナを [30]° にする
頭を [上] に動かす
// 嬉しい表現！
```

## 🔧 トラブルシューティング

### 拡張機能が読み込めない

**症状**: TurboWarpで拡張機能のURLを入力してもエラーが出る

**解決策**:
1. 拡張機能サーバーが起動しているか確認:
   ```bash
   curl http://localhost:3000/reachy-mini-extension.js
   ```
2. ポート3000が他のプロセスで使われていないか確認
3. ファイアウォールの設定を確認

### ロボットが動かない

**症状**: ブロックを実行してもロボットが反応しない

**解決策**:
1. Reachy Mini daemonが起動しているか確認:
   ```bash
   curl http://localhost:8000/api/state/full
   ```
2. ブラウザのコンソールでエラーを確認（F12キー）
3. daemon側のログを確認

### CORSエラーが出る

**症状**: ブラウザコンソールに「CORS policy」エラーが表示される

**解決策**:
- Reachy Mini daemonは既にCORSが有効になっています（main.py:104-109）
- 拡張機能サーバーもCORS対応済み
- それでもエラーが出る場合は、ブラウザのキャッシュをクリア

### 動作が遅い

**症状**: ブロック実行から動作までに遅延がある

**原因**: これは正常です。各動作には`duration`パラメータで指定された時間がかかります。

**対処法**:
- `duration`パラメータを調整する
- 各動作の間に適切な`待つ`ブロックを入れる

## 📁 ファイル構成

```
scratch-reachy-mini/
├── README.md                    # このファイル
├── SAMPLE_PROJECTS.md           # サンプルプロジェクト集
├── reachy-mini-extension.js     # Scratch拡張機能本体
└── serve_extension.py           # 拡張機能配信サーバー
```

## 🎓 角度について

### Pitch（ピッチ）
- 頭を上下に動かす角度
- 正の値: 上を向く
- 負の値: 下を向く

### Yaw（ヨー）
- 頭を左右に回転させる角度
- 正の値: 左を向く
- 負の値: 右を向く

### Roll（ロール）
- 頭を左右に傾ける角度
- 正の値: 左に傾く
- 負の値: 右に傾く

## 🤝 貢献

バグ報告や機能追加の提案は大歓迎です！

## 📄 ライセンス

このプロジェクトはReachy Miniプロジェクトと同じくApache 2.0ライセンスです。

## 🔗 関連リンク

- [Reachy Mini公式サイト](https://www.pollen-robotics.com/reachy-mini/)
- [Reachy Mini GitHub](https://github.com/pollen-robotics/reachy_mini)
- [TurboWarp](https://turbowarp.org/)
- [Scratch](https://scratch.mit.edu/)

---

楽しいプログラミングを！ 🎉
