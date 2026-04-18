'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  // AuthContext の初期化が完了するまで待つ
  const { loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    if (!supabase) {
      setError('認証機能が設定されていません');
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError('パスワードの更新に失敗しました。リンクが期限切れの可能性があります。');
        setSubmitting(false);
        return;
      }

      router.push('/');
    } catch {
      setError('パスワードの更新に失敗しました。もう一度お試しください。');
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#F9F8F5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F8F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-stone-900 mb-1">新しいパスワードの設定</h1>
          <p className="text-stone-500 text-sm">新しいパスワードを入力してください</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/[0.06] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-600 mb-1.5">
                新しいパスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-stone-900 placeholder-stone-300"
                placeholder="6文字以上"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-600 mb-1.5">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-stone-900 placeholder-stone-300"
                placeholder="もう一度入力"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-stone-300 text-white font-semibold rounded-lg transition"
            >
              {submitting ? '更新中...' : 'パスワードを更新'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
