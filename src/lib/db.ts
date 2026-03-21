/**
 * ハイブリッドデータベース操作モジュール
 * 認証状態に応じて IndexedDB または Supabase を使用
 * - 未ログイン: IndexedDB のみ
 * - ログイン: Supabase データベース + Storage
 */

// IndexedDB ラッパーライブラリをインポート
import { openDB, DBSchema, IDBPDatabase } from 'idb';
// 食事エントリーの型定義をインポート
import { FoodEntry, SupabaseFoodEntry, DbOptions } from '@/types/food';
// ファイルストレージ関連の関数をインポート
import { saveToFile, getDirectoryHandle } from './fileStorage';
// Supabase クライアントをインポート
import { createClient } from './supabase';
// Supabase Storage 操作をインポート
import { uploadPhoto, deletePhoto, getPhotoUrl } from './supabaseStorage';

/**
 * IndexedDB のスキーマ定義
 * entries ストアに FoodEntry を保存し、日付でインデックスを作成
 */
interface FoodDiaryDB extends DBSchema {
  entries: {
    key: string;                      // エントリーID
    value: FoodEntry;                 // 食事エントリーデータ
    indexes: { 'by-date': string };   // 日付によるインデックス
  };
}

// データベース名
const DB_NAME = 'FoodDiaryDB';
// オブジェクトストア名
const STORE_NAME = 'entries';
// データベースバージョン
const DB_VERSION = 1;

// データベース接続の Promise をキャッシュ
let dbPromise: Promise<IDBPDatabase<FoodDiaryDB>> | null = null;

/**
 * IndexedDB データベースへの接続を取得
 * シングルトンパターンで一度だけ接続を作成
 * @returns データベース接続の Promise
 */
const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FoodDiaryDB>(DB_NAME, DB_VERSION, {
      // データベースのアップグレード処理
      upgrade(db) {
        // ストアが存在しない場合のみ作成
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // id をキーパスとしてオブジェクトストアを作成
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          // 日付でソートするためのインデックスを作成
          store.createIndex('by-date', 'date');
        }
      },
    });
  }
  return dbPromise;
};

/**
 * ファイルへの自動同期処理
 * ディレクトリが設定されている場合、データをファイルに保存
 */
const syncToFile = async (): Promise<void> => {
  try {
    const handle = await getDirectoryHandle();
    if (handle) {
      // 全エントリーを取得してファイルに保存
      const entries = await getAllEntriesInternal();
      await saveToFile(entries);
    }
  } catch (error) {
    console.error('ファイル同期に失敗しました:', error);
  }
};

/**
 * 内部用：全エントリーを取得
 * syncToFile から呼び出される
 * @returns 日付降順でソートされた食事エントリーの配列
 */
const getAllEntriesInternal = async (): Promise<FoodEntry[]> => {
  const db = await getDB();
  // 日付インデックスを使用して全エントリーを取得
  const entries = await db.getAllFromIndex(STORE_NAME, 'by-date');
  // 日付+時刻で新しい順（降順）に並び替え
  return entries.sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time || '00:00'}`;
    const dateTimeB = `${b.date}T${b.time || '00:00'}`;
    return dateTimeB.localeCompare(dateTimeA);
  });
};

/**
 * 新しい食事エントリーを追加
 * 認証状態に応じて IndexedDB または Supabase に保存
 * @param entry - 追加する食事エントリー
 * @param options - データベースオプション
 */
export const addEntry = async (entry: FoodEntry, options?: DbOptions): Promise<void> => {
  // ログイン中の場合は Supabase に保存
  if (shouldUseSupabase(options)) {
    await addEntryToSupabase(entry, options!.userId!);
  } else {
    // 未ログインの場合は IndexedDB に保存
    const db = await getDB();
    await db.add(STORE_NAME, entry);
    // ファイルにも同期
    await syncToFile();
  }
};

/**
 * 全ての食事エントリーを取得
 * 認証状態に応じて IndexedDB または Supabase から取得
 * @param options - データベースオプション
 * @returns 日付降順でソートされた食事エントリーの配列
 */
export const getAllEntries = async (options?: DbOptions): Promise<FoodEntry[]> => {
  // ログイン中の場合は Supabase から取得
  if (shouldUseSupabase(options)) {
    return getAllEntriesFromSupabase(options!.userId!);
  }
  // 未ログインの場合は IndexedDB から取得
  return getAllEntriesInternal();
};

/**
 * 指定IDの食事エントリーを取得
 * 認証状態に応じて IndexedDB または Supabase から取得
 * @param id - エントリーID
 * @param options - データベースオプション
 * @returns 食事エントリー、存在しない場合は undefined
 */
export const getEntry = async (id: string, options?: DbOptions): Promise<FoodEntry | undefined> => {
  // ログイン中の場合は Supabase から取得
  if (shouldUseSupabase(options)) {
    return getEntryFromSupabase(id, options!.userId!);
  }
  // 未ログインの場合は IndexedDB から取得
  const db = await getDB();
  return await db.get(STORE_NAME, id);
};

/**
 * 指定IDの食事エントリーを削除
 * 認証状態に応じて IndexedDB または Supabase から削除
 * @param id - 削除するエントリーのID
 * @param options - データベースオプション
 */
export const deleteEntry = async (id: string, options?: DbOptions): Promise<void> => {
  // ログイン中の場合は Supabase から削除
  if (shouldUseSupabase(options)) {
    await deleteEntryFromSupabase(id, options!.userId!);
  } else {
    // 未ログインの場合は IndexedDB から削除
    const db = await getDB();
    await db.delete(STORE_NAME, id);
    // ファイルにも同期
    await syncToFile();
  }
};

/**
 * 食事エントリーを更新
 * 認証状態に応じて IndexedDB または Supabase を更新
 * @param entry - 更新する食事エントリー
 * @param options - データベースオプション
 */
export const updateEntry = async (entry: FoodEntry, options?: DbOptions): Promise<void> => {
  // ログイン中の場合は Supabase を更新
  if (shouldUseSupabase(options)) {
    await updateEntryInSupabase(entry, options!.userId!);
  } else {
    // 未ログインの場合は IndexedDB を更新
    const db = await getDB();
    await db.put(STORE_NAME, entry);
    // ファイルにも同期
    await syncToFile();
  }
};

/**
 * ファイルからデータをインポートして IndexedDB に保存
 * @param entries - インポートする食事エントリーの配列
 */
export const importEntries = async (entries: FoodEntry[]): Promise<void> => {
  const db = await getDB();
  // トランザクションを開始
  const tx = db.transaction(STORE_NAME, 'readwrite');

  // 各エントリーを保存（既存のものは上書き）
  for (const entry of entries) {
    await tx.store.put(entry);
  }

  // トランザクションをコミット
  await tx.done;
  // ファイルにも同期
  await syncToFile();
};

/**
 * IndexedDB の全データをクリア
 * 全ての食事エントリーを削除
 */
export const clearAllEntries = async (): Promise<void> => {
  const db = await getDB();
  await db.clear(STORE_NAME);
};

// ============================================
// Supabase 操作関数群
// ============================================

/**
 * Supabase を使用するかどうかを判定
 * @param options - データベースオプション
 * @returns Supabase を使用する場合は true
 */
const shouldUseSupabase = (options?: DbOptions): boolean => {
  return !!(options?.userId && options?.isAuthenticated);
};

/**
 * FoodEntry を Supabase 形式に変換
 * @param entry - FoodEntry
 * @param userId - ユーザーID
 * @param photoUrl - 写真の Storage パス
 * @returns SupabaseFoodEntry
 */
const toSupabaseEntry = (
  entry: FoodEntry,
  userId: string,
  photoUrl: string | null
): SupabaseFoodEntry => ({
  id: entry.id,
  user_id: userId,
  date: entry.date,
  time: entry.time || null,
  meal_type: entry.mealType,
  menu: entry.menu || null,
  photo_url: photoUrl,
  created_at: entry.createdAt,
});

/**
 * Supabase 形式を FoodEntry に変換
 * @param entry - SupabaseFoodEntry
 * @returns FoodEntry
 */
const fromSupabaseEntry = async (entry: SupabaseFoodEntry): Promise<FoodEntry> => {
  let photo: Blob | undefined;

  // 写真がある場合は署名付きURLを取得してBlobに変換
  if (entry.photo_url) {
    const signedUrl = await getPhotoUrl(entry.photo_url);
    if (signedUrl) {
      try {
        const response = await fetch(signedUrl);
        photo = await response.blob();
      } catch (error) {
        console.error('写真の取得に失敗しました:', error);
      }
    }
  }

  return {
    id: entry.id,
    date: entry.date,
    time: entry.time || undefined,
    mealType: entry.meal_type,
    menu: entry.menu || undefined,
    photo,
    createdAt: entry.created_at,
  };
};

/**
 * Supabase にエントリーを追加
 * @param entry - 追加する食事エントリー
 * @param userId - ユーザーID
 */
const addEntryToSupabase = async (entry: FoodEntry, userId: string): Promise<void> => {
  const supabase = createClient();
  if (!supabase) throw new Error('Supabase が設定されていません');

  // 写真がある場合はアップロード
  let photoUrl: string | null = null;
  if (entry.photo) {
    photoUrl = await uploadPhoto(userId, entry.id, entry.photo);
  }

  // エントリーを Supabase に保存
  const supabaseEntry = toSupabaseEntry(entry, userId, photoUrl);
  const { error } = await supabase
    .from('food_entries')
    .insert(supabaseEntry);

  if (error) {
    // アップロードした写真を削除（ロールバック）
    if (photoUrl) await deletePhoto(photoUrl);
    throw error;
  }
};

/**
 * Supabase から全エントリーを取得
 * @param userId - ユーザーID
 * @returns 日付降順でソートされた食事エントリーの配列
 */
const getAllEntriesFromSupabase = async (userId: string): Promise<FoodEntry[]> => {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('time', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Supabase からの取得エラー:', error);
    return [];
  }

  // 並列で変換
  const entries = await Promise.all(
    (data as SupabaseFoodEntry[]).map(fromSupabaseEntry)
  );

  return entries;
};

/**
 * Supabase から指定IDのエントリーを取得
 * @param id - エントリーID
 * @param userId - ユーザーID
 * @returns 食事エントリー、存在しない場合は undefined
 */
const getEntryFromSupabase = async (id: string, userId: string): Promise<FoodEntry | undefined> => {
  const supabase = createClient();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Supabase からの取得エラー:', error);
    return undefined;
  }

  return fromSupabaseEntry(data as SupabaseFoodEntry);
};

/**
 * Supabase のエントリーを更新
 * @param entry - 更新する食事エントリー
 * @param userId - ユーザーID
 */
const updateEntryInSupabase = async (entry: FoodEntry, userId: string): Promise<void> => {
  const supabase = createClient();
  if (!supabase) throw new Error('Supabase が設定されていません');

  // 既存のエントリーを取得して写真パスを確認
  const { data: existing } = await supabase
    .from('food_entries')
    .select('photo_url')
    .eq('id', entry.id)
    .eq('user_id', userId)
    .single();

  let photoUrl: string | null = (existing as SupabaseFoodEntry | null)?.photo_url || null;

  // 写真が変更された場合
  if (entry.photo) {
    // 新しい写真をアップロード
    photoUrl = await uploadPhoto(userId, entry.id, entry.photo);
  } else if (photoUrl && !entry.photo) {
    // 写真が削除された場合
    await deletePhoto(photoUrl);
    photoUrl = null;
  }

  // エントリーを更新
  const supabaseEntry = toSupabaseEntry(entry, userId, photoUrl);
  const { error } = await supabase
    .from('food_entries')
    .update(supabaseEntry)
    .eq('id', entry.id)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
};

/**
 * Supabase からエントリーを削除
 * @param id - 削除するエントリーのID
 * @param userId - ユーザーID
 */
const deleteEntryFromSupabase = async (id: string, userId: string): Promise<void> => {
  const supabase = createClient();
  if (!supabase) throw new Error('Supabase が設定されていません');

  // 既存のエントリーを取得して写真パスを確認
  const { data: existing } = await supabase
    .from('food_entries')
    .select('photo_url')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  // 写真がある場合は削除
  const photoUrl = (existing as SupabaseFoodEntry | null)?.photo_url;
  if (photoUrl) {
    await deletePhoto(photoUrl);
  }

  // エントリーを削除
  const { error } = await supabase
    .from('food_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
};

