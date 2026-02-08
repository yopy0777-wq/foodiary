/**
 * ファイルストレージモジュール
 * File System Access API を使用してローカルファイルシステムにデータを保存・読み込み
 * ブラウザの対応状況に応じて動作
 */

// 食事エントリーと食事タイプの型定義をインポート
import { FoodEntry, MealType } from '@/types/food';

// データファイル名
const FILE_NAME = 'foodiary-data.json';
// ファイルハンドル保存用の IndexedDB ストア名
const HANDLE_STORE_NAME = 'file-handles';
// ディレクトリハンドルのキー
const HANDLE_KEY = 'directory-handle';

/**
 * File System Access API がサポートされているかチェック
 * @returns サポートされている場合は true
 */
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

/**
 * ディレクトリハンドルを IndexedDB に保存
 * 次回アクセス時に再利用するため
 * @param handle - 保存するディレクトリハンドル
 */
const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  const { openDB } = await import('idb');
  const db = await openDB('FileHandleStore', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        db.createObjectStore(HANDLE_STORE_NAME);
      }
    },
  });
  await db.put(HANDLE_STORE_NAME, handle, HANDLE_KEY);
};

/**
 * IndexedDB から保存されたディレクトリハンドルを取得
 * @returns ディレクトリハンドル、存在しない場合は null
 */
const getStoredDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const { openDB } = await import('idb');
    const db = await openDB('FileHandleStore', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
          db.createObjectStore(HANDLE_STORE_NAME);
        }
      },
    });
    return await db.get(HANDLE_STORE_NAME, HANDLE_KEY) || null;
  } catch {
    return null;
  }
};

/**
 * ディレクトリへのアクセス権限を確認・リクエスト
 * @param handle - 確認するディレクトリハンドル
 * @returns 権限がある場合は true
 */
const verifyPermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
  const options: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };

  // 既に権限がある場合
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  // 権限をリクエスト
  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
};

/**
 * ユーザーにディレクトリを選択させる
 * ディレクトリピッカーダイアログを表示
 * @returns 選択されたディレクトリハンドル、キャンセル時は null
 */
export const selectDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
  // File System Access API がサポートされていない場合
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    // ディレクトリピッカーを表示
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',  // ドキュメントフォルダから開始
    });
    // 選択されたハンドルを保存
    await saveDirectoryHandle(handle);
    return handle;
  } catch (error) {
    // ユーザーがキャンセルした場合
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
};

/**
 * 保存されたディレクトリハンドルを取得（権限確認付き）
 * @returns ディレクトリハンドル、権限がない場合は null
 */
export const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  const handle = await getStoredDirectoryHandle();
  if (!handle) {
    return null;
  }

  // 権限を確認
  const hasPermission = await verifyPermission(handle);
  if (!hasPermission) {
    return null;
  }

  return handle;
};

/**
 * ディレクトリが設定されているかチェック（権限確認なし）
 * @returns 設定されている場合は true
 */
export const hasStoredDirectory = async (): Promise<boolean> => {
  const handle = await getStoredDirectoryHandle();
  return handle !== null;
};

/**
 * FoodEntry の photo (Blob) を Base64 文字列に変換
 * JSON シリアライズ可能な形式に変換
 * @param entry - 変換する食事エントリー
 * @returns シリアライズ可能なオブジェクト
 */
const entryToSerializable = async (entry: FoodEntry): Promise<Record<string, unknown>> => {
  const serializable: Record<string, unknown> = { ...entry };

  // photo が Blob の場合、Base64 に変換
  if (entry.photo instanceof Blob) {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(entry.photo as Blob);
    });
    serializable.photo = base64;
    // Base64 形式であることを示すフラグ
    serializable._photoIsBase64 = true;
  }

  return serializable;
};

/**
 * Base64 文字列を Blob に戻して FoodEntry に変換
 * ファイルから読み込んだデータを復元
 * @param data - シリアライズされたデータ
 * @returns FoodEntry オブジェクト
 */
const serializableToEntry = async (data: Record<string, unknown>): Promise<FoodEntry> => {
  const { _photoIsBase64, ...rest } = data;

  // 旧形式（menuName）からの移行対応
  const mealType = (rest.mealType as MealType) || '昼食';
  const menu = (rest.menu as string | undefined) || (rest.menuName as string | undefined);

  // FoodEntry オブジェクトを構築
  const entry: FoodEntry = {
    id: rest.id as string,
    date: rest.date as string,
    time: rest.time as string | undefined,
    mealType,
    menu,
    photo: rest.photo as Blob | undefined,
    createdAt: rest.createdAt as number,
  };

  // Base64 を Blob に変換
  if (_photoIsBase64 && typeof rest.photo === 'string') {
    const response = await fetch(rest.photo);
    entry.photo = await response.blob();
  }

  return entry;
};

/**
 * ファイルにデータを保存
 * 設定されたディレクトリに JSON ファイルとして保存
 * @param entries - 保存する食事エントリーの配列
 * @returns 成功時は true、失敗時は false
 */
export const saveToFile = async (entries: FoodEntry[]): Promise<boolean> => {
  const handle = await getDirectoryHandle();
  if (!handle) {
    return false;
  }

  try {
    // ファイルハンドルを取得（なければ作成）
    const fileHandle = await handle.getFileHandle(FILE_NAME, { create: true });
    // 書き込み用ストリームを作成
    const writable = await fileHandle.createWritable();

    // エントリーをシリアライズ可能な形式に変換
    const serializableEntries = await Promise.all(
      entries.map(entry => entryToSerializable(entry))
    );

    // JSON 形式で保存
    const data = JSON.stringify({
      version: 1,                              // ファイルフォーマットバージョン
      exportedAt: new Date().toISOString(),    // エクスポート日時
      entries: serializableEntries,            // 食事エントリーデータ
    }, null, 2);

    await writable.write(data);
    await writable.close();

    return true;
  } catch (error) {
    console.error('ファイルへの保存に失敗しました:', error);
    return false;
  }
};

/**
 * ファイルからデータを読み込む
 * 設定されたディレクトリから JSON ファイルを読み込み
 * @returns 食事エントリーの配列、失敗時は null
 */
export const loadFromFile = async (): Promise<FoodEntry[] | null> => {
  const handle = await getDirectoryHandle();
  if (!handle) {
    return null;
  }

  try {
    // ファイルハンドルを取得
    const fileHandle = await handle.getFileHandle(FILE_NAME);
    // ファイルを読み込み
    const file = await fileHandle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);

    // データの検証
    if (!data.entries || !Array.isArray(data.entries)) {
      return null;
    }

    // エントリーを FoodEntry オブジェクトに変換
    const entries = await Promise.all(
      data.entries.map((entry: Record<string, unknown>) => serializableToEntry(entry))
    );

    return entries;
  } catch (error) {
    // ファイルが存在しない場合は空配列を返す
    if (error instanceof Error && error.name === 'NotFoundError') {
      return [];
    }
    console.error('ファイルからの読み込みに失敗しました:', error);
    return null;
  }
};

/**
 * 手動エクスポート（ダウンロード）
 * データを JSON ファイルとしてダウンロード
 * @param entries - エクスポートする食事エントリーの配列
 */
export const exportToDownload = async (entries: FoodEntry[]): Promise<void> => {
  // エントリーをシリアライズ可能な形式に変換
  const serializableEntries = await Promise.all(
    entries.map(entry => entryToSerializable(entry))
  );

  // JSON 形式に変換
  const data = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: serializableEntries,
  }, null, 2);

  // Blob を作成
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // ダウンロードリンクを作成してクリック
  const a = document.createElement('a');
  a.href = url;
  a.download = `foodiary-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // URL を解放
  URL.revokeObjectURL(url);
};

/**
 * 手動インポート（ファイル選択）
 * 選択されたファイルからデータを読み込み
 * @param file - インポートするファイル
 * @returns 食事エントリーの配列
 * @throws 無効なファイル形式の場合はエラー
 */
export const importFromFile = async (file: File): Promise<FoodEntry[]> => {
  // ファイル内容を読み込み
  const text = await file.text();
  const data = JSON.parse(text);

  // データの検証
  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error('無効なファイル形式です');
  }

  // エントリーを FoodEntry オブジェクトに変換
  const entries = await Promise.all(
    data.entries.map((entry: Record<string, unknown>) => serializableToEntry(entry))
  );

  return entries;
};

/**
 * ディレクトリ設定をクリア
 * 保存されたディレクトリハンドルを削除
 */
export const clearDirectoryHandle = async (): Promise<void> => {
  const { openDB } = await import('idb');
  const db = await openDB('FileHandleStore', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        db.createObjectStore(HANDLE_STORE_NAME);
      }
    },
  });
  // ディレクトリハンドルを削除
  await db.delete(HANDLE_STORE_NAME, HANDLE_KEY);
};
