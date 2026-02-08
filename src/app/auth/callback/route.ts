/**
 * 認証コールバックルートハンドラー
 * Supabase Auth のメール確認後にリダイレクトされるエンドポイント
 * 認証コードをセッションに交換し、適切なページにリダイレクト
 */

// Supabase のサーバークライアントと Cookie オプション型をインポート
import { createServerClient, type CookieOptions } from '@supabase/ssr';
// Next.js の Cookie API をインポート
import { cookies } from 'next/headers';
// Next.js の Response ユーティリティをインポート
import { NextResponse } from 'next/server';

/**
 * GET リクエストハンドラー
 * メール確認リンクからのコールバックを処理
 * @param request - HTTP リクエストオブジェクト
 * @returns リダイレクトレスポンス
 */
export async function GET(request: Request) {
  // URL からクエリパラメータを抽出
  const { searchParams, origin } = new URL(request.url);
  // 認証コード（Supabase から提供される）
  const code = searchParams.get('code');
  // リダイレクト先（デフォルトはホーム）
  const next = searchParams.get('next') ?? '/';

  // 環境変数から Supabase の設定を取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase が設定されていない場合はエラーとしてリダイレクト
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/?error=not_configured`);
  }

  // 認証コードがある場合、セッションに交換
  if (code) {
    // Cookie ストアを取得
    const cookieStore = await cookies();

    // サーバーサイド用の Supabase クライアントを作成
    // Cookie の操作をカスタムハンドラーで行う
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          // Cookie を取得
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          // Cookie を設定
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          // Cookie を削除
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // 認証コードをセッションに交換
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // 成功した場合は指定されたページにリダイレクト
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // エラーまたはコードがない場合はログインページにリダイレクト
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
