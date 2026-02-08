/**
 * Supabase クライアントモジュール
 * Supabase への接続と認証機能を提供
 */

// Supabase のブラウザクライアント作成関数をインポート
import { createBrowserClient } from '@supabase/ssr';
// Supabase クライアントの型定義をインポート
import { SupabaseClient } from '@supabase/supabase-js';

// 環境変数から Supabase の設定を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase が設定されているかチェック
 * 環境変数が両方とも設定されているか確認
 * @returns 設定されている場合は true
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Supabase クライアントのシングルトンインスタンス
let client: SupabaseClient | null = null;

/**
 * Supabase クライアントを作成または取得
 * シングルトンパターンで一度だけクライアントを作成
 * @returns Supabase クライアント、設定されていない場合は null
 */
export const createClient = (): SupabaseClient | null => {
  // Supabase が設定されていない場合は null を返す
  if (!isSupabaseConfigured()) {
    return null;
  }

  // クライアントが未作成の場合のみ作成
  if (!client) {
    // 非 null アサーション（!）は isSupabaseConfigured で確認済み
    client = createBrowserClient(supabaseUrl!, supabaseAnonKey!);
  }

  return client;
};
