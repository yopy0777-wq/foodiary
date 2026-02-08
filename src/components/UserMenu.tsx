'use client';

// React の useState フックをインポート
import { useState } from 'react';
// Next.js の Link コンポーネントをインポート
import Link from 'next/link';
// 認証コンテキストからカスタムフックをインポート
import { useAuth } from '@/contexts/AuthContext';

/**
 * プランタイプごとの表示ラベル
 */
const planLabels = {
  free: 'フリープラン',
  member: '無料会員',
  premium: 'プレミアム',
};

/**
 * プランタイプごとの背景色とテキスト色のスタイル
 */
const planColors = {
  free: 'bg-gray-100 text-gray-600',
  member: 'bg-green-100 text-green-600',
  premium: 'bg-yellow-100 text-yellow-600',
};

/**
 * ユーザーメニューコンポーネント
 * ヘッダーに表示されるユーザーアイコンとドロップダウンメニュー
 * ログイン状態に応じて表示内容が変わる
 */
export default function UserMenu() {
  // 認証コンテキストから必要な値と関数を取得
  const { user, plan, loading, signOut, isAuthenticated } = useAuth();
  // ドロップダウンメニューの開閉状態
  const [isOpen, setIsOpen] = useState(false);

  // 読み込み中はプレースホルダーを表示
  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  // 未ログインの場合はログインボタンを表示
  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition"
      >
        ログイン
      </Link>
    );
  }

  // ログイン済みの場合はユーザーメニューを表示
  return (
    <div className="relative">
      {/* ユーザーアイコンボタン（クリックでメニュー開閉） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        {/* メールアドレスの頭文字を表示するアバター */}
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
      </button>

      {/* ドロップダウンメニュー（開いている時のみ表示） */}
      {isOpen && (
        <>
          {/* オーバーレイ（メニュー外クリックで閉じる） */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* メニュー本体 */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-50 overflow-hidden">
            {/* ユーザー情報セクション */}
            <div className="p-4 border-b">
              {/* メールアドレス */}
              <p className="text-sm text-gray-600 truncate">{user?.email}</p>
              {/* プランラベル */}
              <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${planColors[plan]}`}>
                {planLabels[plan]}
              </span>
            </div>

            {/* メニューアイテムセクション */}
            <div className="p-2">
              {/* 設定リンク */}
              <Link
                href="/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                onClick={() => setIsOpen(false)}
              >
                設定
              </Link>
              {/* プレミアム以外のユーザーにはアップグレードリンクを表示 */}
              {plan !== 'premium' && (
                <Link
                  href="/premium"
                  className="block px-4 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                  onClick={() => setIsOpen(false)}
                >
                  プレミアムにアップグレード
                </Link>
              )}
              {/* ログアウトボタン */}
              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
