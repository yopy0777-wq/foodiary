'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError('認証機能が設定されていません');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    if (error) {
      const isRateLimit = error.message.toLowerCase().includes('rate limit');
      setError(isRateLimit
        ? 'メールの送信回数が上限に達しました。しばらく待ってから再試行してください。'
        : '送信に失敗しました。メールアドレスを確認してください。'
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-[#F9F8F5] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.06] p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">メールを送信しました</h2>
            <p className="text-stone-500 text-sm mb-6">
              <span className="font-medium text-stone-700">{email}</span> にパスワード再設定のリンクを送りました。メールを確認してください。
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition"
            >
              ログインページへ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F8F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">パスワードの再設定</h1>
          <p className="text-stone-500 text-sm">登録済みのメールアドレスを入力してください</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.06] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-600 mb-1.5">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-stone-900 placeholder-stone-300"
                placeholder="example@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-stone-300 text-white font-semibold rounded-lg transition"
            >
              {loading ? '送信中...' : '再設定メールを送信'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-stone-400 hover:text-stone-700 text-sm">
              ログインページへ戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
