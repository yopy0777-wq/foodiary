import { FoodEntry } from '@/types/food';

const FILE_NAME = 'foodiary-data.json';
const HANDLE_STORE_NAME = 'file-handles';
const HANDLE_KEY = 'directory-handle';

// File System Access API がサポートされているかチェック
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

// IndexedDB にディレクトリハンドルを保存
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

// IndexedDB からディレクトリハンドルを取得
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

// ディレクトリへのアクセス権限を確認・リクエスト
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

// ユーザーにディレクトリを選択させる
export const selectDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });
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

// 保存されたディレクトリハンドルを取得（権限確認付き）
export const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  const handle = await getStoredDirectoryHandle();
  if (!handle) {
    return null;
  }

  const hasPermission = await verifyPermission(handle);
  if (!hasPermission) {
    return null;
  }

  return handle;
};

// ディレクトリが設定されているかチェック（権限確認なし）
export const hasStoredDirectory = async (): Promise<boolean> => {
  const handle = await getStoredDirectoryHandle();
  return handle !== null;
};

// FoodEntry の photo (Blob) を Base64 に変換
const entryToSerializable = async (entry: FoodEntry): Promise<Record<string, unknown>> => {
  const serializable: Record<string, unknown> = { ...entry };

  if (entry.photo instanceof Blob) {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(entry.photo as Blob);
    });
    serializable.photo = base64;
    serializable._photoIsBase64 = true;
  }

  return serializable;
};

// Base64 を Blob に戻す
const serializableToEntry = async (data: Record<string, unknown>): Promise<FoodEntry> => {
  const { _photoIsBase64, ...rest } = data;
  const entry: FoodEntry = {
    id: rest.id as string,
    date: rest.date as string,
    time: rest.time as string | undefined,
    menuName: rest.menuName as string,
    photo: rest.photo as Blob | undefined,
    createdAt: rest.createdAt as number,
  };

  if (_photoIsBase64 && typeof rest.photo === 'string') {
    const response = await fetch(rest.photo);
    entry.photo = await response.blob();
  }

  return entry;
};

// ファイルにデータを保存
export const saveToFile = async (entries: FoodEntry[]): Promise<boolean> => {
  const handle = await getDirectoryHandle();
  if (!handle) {
    return false;
  }

  try {
    const fileHandle = await handle.getFileHandle(FILE_NAME, { create: true });
    const writable = await fileHandle.createWritable();

    const serializableEntries = await Promise.all(
      entries.map(entry => entryToSerializable(entry))
    );

    const data = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: serializableEntries,
    }, null, 2);

    await writable.write(data);
    await writable.close();

    return true;
  } catch (error) {
    console.error('ファイルへの保存に失敗しました:', error);
    return false;
  }
};

// ファイルからデータを読み込む
export const loadFromFile = async (): Promise<FoodEntry[] | null> => {
  const handle = await getDirectoryHandle();
  if (!handle) {
    return null;
  }

  try {
    const fileHandle = await handle.getFileHandle(FILE_NAME);
    const file = await fileHandle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.entries || !Array.isArray(data.entries)) {
      return null;
    }

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

// 手動エクスポート（ダウンロード）
export const exportToDownload = async (entries: FoodEntry[]): Promise<void> => {
  const serializableEntries = await Promise.all(
    entries.map(entry => entryToSerializable(entry))
  );

  const data = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: serializableEntries,
  }, null, 2);

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `foodiary-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 手動インポート（ファイル選択）
export const importFromFile = async (file: File): Promise<FoodEntry[]> => {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error('無効なファイル形式です');
  }

  const entries = await Promise.all(
    data.entries.map((entry: Record<string, unknown>) => serializableToEntry(entry))
  );

  return entries;
};

// ディレクトリ設定をクリア
export const clearDirectoryHandle = async (): Promise<void> => {
  const { openDB } = await import('idb');
  const db = await openDB('FileHandleStore', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        db.createObjectStore(HANDLE_STORE_NAME);
      }
    },
  });
  await db.delete(HANDLE_STORE_NAME, HANDLE_KEY);
};
