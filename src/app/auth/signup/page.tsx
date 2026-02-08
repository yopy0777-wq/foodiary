'use client';

/**
 * 新規会員登録ページコンポーネント
 * メールアドレスとパスワードによる会員登録機能を提供
 */

// React のフックをインポート
import { useState } from 'react';
// Next.js の Link コンポーネント
import Link from 'next/link';
// 認証コンテキストからカスタムフックをインポート
import { useAuth } from '@/contexts/AuthContext';

/**
 * 新規登録ページコンポーネント
 */
export default function SignupPage() {
  // フォーム入力値の state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // 利用規約同意チェックボックスの state
  const [agreed, setAgreed] = useState(false);
  // エラーメッセージ
  const [error, setError] = useState('');
  // 登録処理中フラグ
  const [loading, setLoading] = useState(false);
  // 登録成功フラグ（確認メール送信済み）
  const [success, setSuccess] = useState(false);
  // 認証コンテキストから関数と設定状態を取得
  const { signUp, isConfigured } = useAuth();

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
   * 入力値のバリデーションと Supabase での会員登録を実行
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // エラーをクリア
    setError('');

    // パスワードの一致確認
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    // 利用規約同意の確認
    if (!agreed) {
      setError('利用規約に同意してください');
      return;
    }

    setLoading(true);

    // 会員登録を試行
    const { error } = await signUp(email, password);

    if (error) {
      // エラーメッセージをユーザーフレンドリーに変換
      if (error.message.includes('already registered')) {
        setError('このメールアドレスは既に登録されています');
      } else {
        setError('登録に失敗しました。もう一度お試しください');
      }
      setLoading(false);
      return;
    }

    // 成功時は確認メール送信完了画面を表示
    setSuccess(true);
    setLoading(false);
  };

  // 登録成功後の確認メール送信完了画面
  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            {/* 成功アイコン */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">確認メールを送信しました</h2>
            <p className="text-gray-600 mb-6">
              {email} に確認メールを送信しました。<br />
              メール内のリンクをクリックして登録を完了してください。
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition"
            >
              ログイン画面へ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">新規会員登録</h1>
          <p className="text-gray-600">アカウントを作成して便利な機能を使おう</p>
        </div>

        {/* 登録フォーム */}
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

            {/* パスワード確認入力 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="もう一度入力"
              />
            </div>

            {/* 利用規約同意チェックボックス */}
            <div className="flex items-start">
              <input
                id="agreed"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="agreed" className="ml-2 text-sm text-gray-600">
                <span className="text-green-600 hover:underline cursor-pointer">利用規約</span>
                と
                <span className="text-green-600 hover:underline cursor-pointer">プライバシーポリシー</span>
                に同意します
              </label>
            </div>

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>

          {/* フッターリンク */}
          <div className="mt-6 text-center space-y-3">
            {/* ログインへのリンク */}
            <p className="text-gray-600">
              既にアカウントをお持ちの方は
              <Link href="/auth/login" className="text-green-600 hover:underline ml-1">
                ログイン
              </Link>
            </p>
            {/* フリープラン利用へのリンク */}
            <div className="border-t pt-3">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                登録せずに使う（フリープラン）
              </Link>
            </div>
          </div>
        </div>

        {/* 会員特典セクション */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-3">会員特典</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {/* 特典1: ローカル自動保存 */}
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ローカルフォルダへの自動保存（Android/PC）
            </li>
            {/* 特典2: クラウド保存（プレミアム） */}
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              クラウド保存でデータ永続化（プレミアム）
            </li>
            {/* 特典3: デバイス間同期（プレミアム） */}
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              複数デバイス間での同期（プレミアム）
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
