'use client';

/**
 * ログインページコンポーネント
 * メールアドレスとパスワードによるログイン機能を提供
 */

// React のフックをインポート
import { useState } from 'react';
// Next.js のルーター（ページ遷移用）
import { useRouter } from 'next/navigation';
// Next.js の Link コンポーネント
import Link from 'next/link';
// 認証コンテキストからカスタムフックをインポート
import { useAuth } from '@/contexts/AuthContext';

/**
 * ログインページコンポーネント
 */
export default function LoginPage() {
  // フォーム入力値の state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // エラーメッセージ
  const [error, setError] = useState('');
  // ログイン処理中フラグ
  const [loading, setLoading] = useState(false);
  // 認証コンテキストから関数と設定状態を取得
  const { signIn, isConfigured } = useAuth();
  // ページ遷移用のルーター
  const router = useRouter();

  // Supabase が設定されていない場合の表示
  if (!isConfigured) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            {/* 警告アイコン */}
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">認証機能は準備中です</h2>
            <p className="text-gray-600 mb-6">
              現在、会員登録・ログイン機能は利用できません。<br />
              フリープランとしてご利用ください。
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition"
            >
              ホームへ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /**
   * フォーム送信ハンドラー
   * Supabase 認証でログインを実行
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // エラーをクリア
    setError('');
    setLoading(true);

    try {
      // ログインを試行
      const { error } = await signIn(email, password);

      if (error) {
        // エラー時はメッセージを表示
        setError('メールアドレスまたはパスワードが正しくありません');
        setLoading(false);
        return;
      }

      // 成功時はホームページへリダイレクト
      router.push('/');
    } catch {
      setError('ログインに失敗しました。接続を確認してください。');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ログイン</h1>
          <p className="text-gray-600">食事記録アプリにログイン</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* メールアドレス入力 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            {/* パスワード入力 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="6文字以上"
              />
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* フッターリンク */}
          <div className="mt-6 text-center space-y-3">
            {/* 新規登録へのリンク */}
            <p className="text-gray-600">
              アカウントをお持ちでない方は
              <Link href="/auth/signup" className="text-green-600 hover:underline ml-1">
                新規登録
              </Link>
            </p>
            {/* フリープラン利用へのリンク */}
            <div className="border-t pt-3">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ログインせずに使う（フリープラン）
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
