/**
 * ストレージ管理モジュール
 * IndexedDB の使用量管理と写真クリーンアップ
 */

import { openDB } from 'idb';
import { FoodEntry } from '@/types/food';

const DB_NAME = 'FoodDiaryDB';
const STORE_NAME = 'entries';
const DB_VERSION = 1;

/**
 * ストレージ使用量情報
 */
export interface StorageUsage {
  used: number;       // 使用バイト数
  quota: number;      // 上限バイト数（0の場合は不明）
  percentage: number; // 使用率（0-100）
}

/**
 * ブラウザのストレージ使用量を取得
 * navigator.storage.estimate() を使用
 */
export const getStorageUsage = async (): Promise<StorageUsage> => {
  if (!navigator.storage?.estimate) {
    return { used: 0, quota: 0, percentage: 0 };
  }
  const estimate = await navigator.storage.estimate();
  const used = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;
  const percentage = quota > 0 ? Math.round((used / quota) * 100) : 0;
  return { used, quota, percentage };
};

/**
 * バイト数を人間が読みやすい形式に変換
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * IndexedDB から古い写真を削除してストレージを解放
 * 直近 keepCount 件のエントリーの写真以外を削除
 * @param keepCount - 写真を保持するエントリー件数（新しい順）
 * @returns 削除したエントリー数
 */
export const cleanupOldPhotos = async (keepCount = 30): Promise<number> => {
  const db = await openDB(DB_NAME, DB_VERSION);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const allEntries: FoodEntry[] = await store.getAll();

  // 新しい順にソート
  allEntries.sort((a, b) => b.createdAt - a.createdAt);

  // keepCount 件より古いエントリーの写真を削除
  const toCleanup = allEntries.slice(keepCount);
  let cleanedCount = 0;

  for (const entry of toCleanup) {
    if (entry.photo) {
      await store.put({ ...entry, photo: undefined });
      cleanedCount++;
    }
  }

  await tx.done;
  return cleanedCount;
};

/**
 * iPhone（iOS Safari）かどうかを判定
 */
export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
};
