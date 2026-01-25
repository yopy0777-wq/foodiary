# 🍽️ 食事記録PWAアプリ

シンプルで使いやすい食事記録アプリです。日付、メニュー名、写真を記録できます。

## ✨ 特徴

- 📱 **PWA対応** - ホーム画面に追加してアプリとして使用可能
- 💾 **完全ローカル保存** - データはすべてブラウザのIndexedDBに保存（サーバー不要）
- 📷 **写真撮影＆圧縮** - カメラで撮影した写真を自動で圧縮して保存
- 🔒 **プライバシー重視** - データは外部に送信されません
- ⚡ **高速動作** - オフラインでも完全動作
- 📱 **レスポンシブデザイン** - スマホ・タブレット・PC対応

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 3. ビルド（本番環境用）

```bash
npm run build
npm run start
```

## 📦 Vercelへのデプロイ

### GitHubとVercelの連携

1. このプロジェクトをGitHubリポジトリにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <あなたのリポジトリURL>
git push -u origin main
```

2. [Vercel](https://vercel.com)にアクセスしてGitHubアカウントでログイン

3. 「New Project」をクリック

4. GitHubリポジトリをインポート

5. プロジェクト設定はデフォルトのままで「Deploy」をクリック

### 環境変数（不要）

このアプリは完全にクライアントサイドで動作するため、環境変数の設定は不要です。

## 📱 PWAインストール方法

### iOS (Safari)
1. Safariでアプリを開く
2. 共有ボタン（四角に上矢印）をタップ
3. 「ホーム画面に追加」を選択

### Android (Chrome)
1. Chromeでアプリを開く
2. メニュー（三点リーダー）をタップ
3. 「ホーム画面に追加」を選択

### PC (Chrome/Edge)
1. アドレスバー右側のインストールアイコンをクリック
2. 「インストール」をクリック

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: IndexedDB (idb ライブラリ使用)
- **PWA**: Service Worker + Web Manifest

## 📁 プロジェクト構造

```
food-diary-pwa/
├── public/
│   ├── manifest.json          # PWA設定
│   └── sw.js                  # Service Worker
├── src/
│   ├── app/
│   │   ├── page.tsx          # ホーム画面（記録一覧）
│   │   ├── add/page.tsx      # 記録追加画面
│   │   ├── layout.tsx        # レイアウト
│   │   └── globals.css       # グローバルスタイル
│   ├── components/
│   │   ├── FoodCard.tsx      # 記録カード
│   │   ├── AddButton.tsx     # 追加ボタン
│   │   └── CameraInput.tsx   # カメラ入力
│   ├── lib/
│   │   └── db.ts             # IndexedDB操作
│   └── types/
│       └── food.ts           # 型定義
└── package.json
```

## 🔧 カスタマイズ

### アイコンの変更

`public/` フォルダに以下のファイルを配置してください：
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `favicon.ico`

### テーマカラーの変更

`public/manifest.json` の `theme_color` を変更してください。

### 画像圧縮設定の変更

`src/lib/db.ts` の `compressImage` 関数のパラメータを調整してください：
- `maxWidth`: 最大幅（デフォルト: 800px）
- `maxHeight`: 最大高さ（デフォルト: 800px）
- `quality`: JPEG品質（0.0-1.0、デフォルト: 0.8）

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## ⚠️ 注意事項

- ブラウザのキャッシュをクリアするとデータが失われる可能性があります
- 大量の写真を保存すると、ブラウザのストレージ容量を消費します
- バックアップ機能は現在実装されていません（将来的に追加予定）

## 🔮 今後の機能追加予定

- [ ] データのエクスポート/インポート機能
- [ ] カテゴリ分類機能
- [ ] 検索・フィルタリング機能
- [ ] カロリー記録機能
- [ ] 統計・グラフ表示
- [ ] Supabaseを使った任意バックアップ機能