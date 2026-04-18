# foodiary - 食事記録 PWA

スマートフォン対応の食事記録アプリ。写真付きで食事を記録し、ブラウザのIndexedDBまたはSupabaseに保存します。

---

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| ローカルDB | IndexedDB（idbライブラリ） |
| クラウドDB | Supabase（PostgreSQL + Storage） |
| PWA | Service Worker（`public/sw.js`） |

---

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx              # ホーム（食事一覧）
│   ├── add/page.tsx          # 食事追加フォーム
│   ├── edit/[id]/page.tsx    # 食事編集フォーム
│   ├── settings/page.tsx     # 設定ページ
│   └── auth/
│       ├── login/page.tsx    # ログイン
│       ├── signup/page.tsx   # 新規登録
│       └── callback/route.ts # OAuth コールバック
├── components/
│   ├── FoodCard.tsx          # 食事カード表示
│   ├── CameraInput.tsx       # カメラ/写真入力
│   ├── AddButton.tsx         # フローティング追加ボタン
│   └── UserMenu.tsx          # ユーザーメニュー
├── contexts/
│   └── AuthContext.tsx       # 認証状態管理
├── lib/
│   ├── db.ts                 # IndexedDB/Supabase ハイブリッドCRUD
│   ├── imageUtils.ts         # 画像圧縮ユーティリティ
│   ├── storageManager.ts     # ストレージ使用量管理・写真クリーンアップ
│   ├── fileStorage.ts        # File System Access API（フォルダ同期）
│   ├── supabase.ts           # Supabase クライアント
│   ├── supabaseStorage.ts    # Supabase Storage 操作
│   └── plan.ts               # プラン別機能制御
├── types/
│   ├── food.ts               # 食事データ型定義
│   ├── user.ts               # ユーザー・プラン型定義
│   └── file-system.d.ts      # File System Access API 型拡張
└── lib/__tests__/
    ├── imageUtils.test.ts    # 画像圧縮テスト
    └── storageManager.test.ts # ストレージ管理テスト
public/
├── sw.js                     # Service Worker
└── manifest.json             # PWA マニフェスト
```

---

## 会員プランと機能

| 機能 | フリープラン | 無料会員 | プレミアム |
|------|:---:|:---:|:---:|
| 食事記録（IndexedDB保存） | ○ | ○ | ○ |
| 手動バックアップ（JSONエクスポート/インポート） | ○ | ○ | ○ |
| ローカルフォルダ自動保存（File System Access API） | - | ○ | ○ |
| クラウド保存（Supabase） | - | - | ○ |

> **注意:** ローカルフォルダ自動保存は Chrome / Edge のみ対応。iOS Safari は非対応。

---

## データ保存の仕組み

### 未ログイン（フリープラン）

```
食事記録 → IndexedDB（ブラウザ内）
写真     → Blob として IndexedDB に保存
```

- ブラウザのストレージを使用するため、写真が多いとデバイス容量を圧迫する
- 設定ページの「古い写真を削除」でストレージを解放可能

### 無料会員（ログイン済み）

```
食事記録 → IndexedDB（ブラウザ内）+ ローカルフォルダ自動同期（Chrome/Edge のみ）
```

### プレミアム会員

```
食事記録 → Supabase PostgreSQL
写真     → Supabase Storage（food-photos バケット）
```

---

## iPhoneのストレージ問題について

### 問題

iOS Safari は File System Access API（`showDirectoryPicker`）に非対応のため、Android のように保存フォルダを選択できない。写真付きの記録が増えると IndexedDB の容量が肥大化し、デバイスストレージを圧迫する。

### 対策

1. **ストレージ使用量の可視化**
   - 設定ページで `navigator.storage.estimate()` による使用量をプログレスバー表示
   - 使用率80%超で赤色警告を表示

2. **古い写真の一括削除**
   - 設定ページの「古い写真を削除してストレージ解放」ボタン
   - 直近30件のエントリーの写真を残し、それより古い写真 Blob を削除（テキストデータは保持）

3. **iPhone向けUIメッセージ**
   - `isIOS()` 判定でiPhoneユーザーへの専用メッセージを表示
   - フォルダ選択不可の旨を明示し、手動バックアップへ誘導

4. **手動バックアップ（全ブラウザ対応）**
   - JSON ファイルとしてエクスポート/インポート
   - iPhone ユーザーはこちらを主な永続化手段として使用

---

## 主要ライブラリの API

### `src/lib/imageUtils.ts`

画像圧縮ユーティリティ。

```ts
compressImage(file: File, maxWidth?: number, maxHeight?: number, quality?: number): Promise<Blob>
// デフォルト: 800x800px、JPEG品質 0.8
// Canvas API を使用してリサイズ・圧縮
```

### `src/lib/storageManager.ts`

ストレージ管理。iPhone のストレージ問題に対処するために追加。

```ts
getStorageUsage(): Promise<StorageUsage>              // ブラウザのストレージ使用量取得
formatBytes(bytes: number): string                    // "1.5 MB" 形式に変換
cleanupOldPhotos(keepCount?: number): Promise<number> // 古い写真削除（デフォルト直近30件保持）
isIOS(): boolean                                      // iPhone/iPad 判定
```

### `src/lib/db.ts`

認証状態に応じて保存先を自動切替するCRUDモジュール。

- 未ログイン → IndexedDB
- ログイン済み（プレミアム）→ Supabase

### `src/lib/fileStorage.ts`

File System Access API を使ったローカルフォルダ同期（Chrome/Edge のみ）。

```ts
selectDirectory(): Promise<FileSystemDirectoryHandle | null>  // フォルダ選択ダイアログ
saveToFile(entries: FoodEntry[]): Promise<boolean>            // JSON形式でファイルに書き込み
loadFromFile(): Promise<FoodEntry[] | null>                   // ファイルから読み込み
exportToDownload(entries: FoodEntry[]): Promise<void>         // ブラウザダウンロード
importFromFile(file: File): Promise<FoodEntry[]>              // ファイルからインポート
```

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` を作成:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 開発サーバー起動

```bash
npm run dev
```

---

## テスト

テストランナーは現在未導入。以下でインストール可能:

```bash
npm install --save-dev jest @types/jest ts-jest
```

テストファイル:

| ファイル | 内容 |
|---------|------|
| `src/lib/__tests__/imageUtils.test.ts` | `compressImage` のユニットテスト（Canvas/Image/FileReader モック） |
| `src/lib/__tests__/storageManager.test.ts` | `formatBytes` / `isIOS` / `getStorageUsage` / `cleanupOldPhotos` のユニットテスト |

---

## リファクタリング履歴（2026-03-21）

### 変更の背景

- 未ログインユーザーの写真 Blob が IndexedDB に無制限に蓄積し、特に iPhone でストレージを圧迫
- iPhone は File System Access API 非対応のためフォルダ選択によるバックアップが不可能
- `compressImage` が `db.ts` に混在しており、関心の分離が不十分

### 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `src/lib/imageUtils.ts` | 新規 | `compressImage` を `db.ts` から分離 |
| `src/lib/storageManager.ts` | 新規 | ストレージ管理機能を追加 |
| `src/lib/db.ts` | 変更 | `compressImage` を削除 |
| `src/app/add/page.tsx` | 変更 | `compressImage` のimport元を `imageUtils` に変更 |
| `src/app/edit/[id]/page.tsx` | 変更 | 同上 |
| `src/app/settings/page.tsx` | 変更 | ストレージUI・iPhone対応メッセージ・写真クリーンアップ機能追加 |
| `src/lib/__tests__/imageUtils.test.ts` | 新規 | 画像圧縮ユニットテスト |
| `src/lib/__tests__/storageManager.test.ts` | 新規 | ストレージ管理ユニットテスト |
| `tsconfig.json` | 変更 | テストファイルをコンパイル除外に追加 |
