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
 * オフライン対応のカスタム fetch
 * オフライン時に fetch が TypeError をスローするのを防ぎ、
 * Supabase SDK が正常なエラー処理フローを通るよう 503 を返す。
 * これにより onAuthStateChange 内の非同期チェーンで
 * 未処理の Promise rejection が発生するのを防ぐ。
 */
const offlineSafeFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  // navigator.onLine は不正確なため、実際の fetch も try-catch で保護する
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new Response(
      JSON.stringify({ message: 'Network offline', status: 503 }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  try {
    return await globalThis.fetch(input, init);
  } catch (err) {
    // navigator.onLine が true でも実際にはオフラインのケースを補足
    // TypeError をスローし続けると Supabase SDK 内部で未処理 rejection になるため
    // 503 レスポンスに変換して Supabase の通常エラー処理フローに乗せる
    if (err instanceof TypeError) {
      return new Response(
        JSON.stringify({ message: 'Network error', status: 503 }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    throw err;
  }
};

/**
 * Supabase が設定されているかチェック
 * 環境変数が両方とも設定されているか確認
 * @returns 設定されている場合は true
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// navigatorLock (Web Locks API) の代替: Promise チェーンで直列化するロック実装。
// navigatorLock はタイムアウトで AbortError を投げるが、この実装は前の操作を待つだけ。
const AUTH_LOCKS: Record<string, Promise<unknown>> = {};
const processLock = (name: string, _acquireTimeout: number, fn: () => Promise<unknown>): Promise<unknown> => {
  const prev = AUTH_LOCKS[name] ?? Promise.resolve();
  const next = prev.then(() => fn(), () => fn());
  AUTH_LOCKS[name] = next.catch(() => {});
  return next;
};
// LockFunc は <R> ジェネリックを要求するが実装は any でキャスト
type LockFunc = (name: string, acquireTimeout: number, fn: () => Promise<any>) => Promise<any>;

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
    // global.fetch にオフライン対応 fetch を注入することで、
    // SDK 内部の非同期トークンリフレッシュがオフライン時でも
    // 未処理の rejection にならないようにする
    client = createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
      global: { fetch: offlineSafeFetch },
      auth: { lock: processLock as LockFunc },
    });
  }

  return client;
};
