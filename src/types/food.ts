/**
 * 食事関連の型定義モジュール
 * アプリ全体で使用される食事データの型を定義
 */

/**
 * 食事タイプ（食事の種別）
 * 朝食、昼食、夕食、夜食、間食から選択
 */
export type MealType = '朝食' | '昼食' | '夕食' | '夜食' | '間食';

/**
 * 食事エントリーの型定義
 * 1回の食事記録を表すデータ構造
 */
export interface FoodEntry {
  id: string;           // 一意な識別子（UUID）
  date: string;         // 日付（YYYY-MM-DD形式）
  time?: string;        // 時刻（HH:mm形式、例: "12:30"）※任意
  mealType: MealType;   // 食事種別（朝食、昼食など）
  menu?: string;        // 献立名（任意）
  photo?: Blob;         // 写真データ（Blob形式）※任意
  createdAt: number;    // 作成日時（Unix タイムスタンプ）
}

/**
 * 写真URLを持つ食事エントリー
 * FoodEntry から photo を除き、photoURL を追加した型
 * 表示用に写真を Object URL として保持する場合に使用
 */
export interface FoodEntryWithPhotoURL extends Omit<FoodEntry, 'photo'> {
  photoURL?: string;    // 写真の Object URL
}

/**
 * Supabase に保存する食事エントリーの型定義
 * データベースのカラム名に合わせたスネークケースを使用
 */
export interface SupabaseFoodEntry {
  id: string;                    // 一意な識別子（UUID）
  user_id: string;               // ユーザーID
  date: string;                  // 日付（YYYY-MM-DD形式）
  time: string | null;           // 時刻（HH:mm形式）
  meal_type: MealType;           // 食事種別
  menu: string | null;           // 献立名
  photo_url: string | null;      // Supabase Storage のファイルパス
  created_at: number;            // 作成日時（Unix タイムスタンプ）
}

/**
 * データベース操作のオプション
 * 認証状態に応じて保存先を切り替えるために使用
 */
export interface DbOptions {
  userId?: string;               // ユーザーID
  isAuthenticated?: boolean;     // 認証済みかどうか
}
