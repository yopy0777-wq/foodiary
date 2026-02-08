'use client';

/**
 * ホームページコンポーネント
 * 食事記録の一覧を表示するメインページ
 */

// React のフックをインポート
import { useEffect, useState } from 'react';
// Next.js の Link コンポーネントをインポート
import Link from 'next/link';
// データベース操作関数をインポート
import { getAllEntries, deleteEntry } from '@/lib/db';
// 食事エントリーの型定義をインポート
import { FoodEntry } from '@/types/food';
// コンポーネントをインポート
import FoodCard from '@/components/FoodCard';
import AddButton from '@/components/AddButton';
import UserMenu from '@/components/UserMenu';
// 認証コンテキストをインポート
import { useAuth } from '@/contexts/AuthContext';

/**
 * ホームページコンポーネント
 * 食事記録の一覧表示、削除機能を提供
 */
export default function Home() {
  // 食事エントリーの配列を管理する state
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  // 読み込み中フラグ
  const [loading, setLoading] = useState(true);
  // 認証情報を取得
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  /**
   * データベースから全エントリーを読み込む
   * 認証状態に応じて IndexedDB または Supabase から取得
   */
  const loadEntries = async () => {
    try {
      const data = await getAllEntries({
        userId: user?.id,
        isAuthenticated,
      });
      setEntries(data);
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時および認証状態変更時にデータを読み込み
  useEffect(() => {
    // 認証状態の読み込み中はスキップ
    if (authLoading) return;
    loadEntries();
  }, [authLoading, isAuthenticated, user?.id]);

  /**
   * エントリー削除ハンドラー
   * 確認ダイアログを表示し、承諾後に削除を実行
   * @param id - 削除するエントリーのID
   */
  const handleDelete = async (id: string) => {
    if (confirm('この記録を削除しますか?')) {
      try {
        await deleteEntry(id, {
          userId: user?.id,
          isAuthenticated,
        });
        // 削除後にリストを再読み込み
        await loadEntries();
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert('削除に失敗しました');
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ヘッダー部分 */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🍽️ 食事記録</h1>
            <p className="text-gray-600">食べたものを記録しよう</p>
          </div>
          {/* 右側のアクションボタン */}
          <div className="flex items-center gap-2">
            {/* 設定ページへのリンク */}
            <Link
              href="/settings"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="設定"
            >
              {/* 歯車アイコン */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
            {/* ユーザーメニュー（ログイン/ログアウト） */}
            <UserMenu />
          </div>
        </header>

        {/* コンテンツ部分（状態に応じて表示を切り替え） */}
        {loading ? (
          /* 読み込み中の表示 */
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : entries.length === 0 ? (
          /* エントリーがない場合の表示 */
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📝</p>
            <p className="text-gray-600 mb-2">まだ記録がありません</p>
            <p className="text-sm text-gray-500">右下のボタンから記録を追加しましょう</p>
          </div>
        ) : (
          /* エントリー一覧の表示 */
          <div className="space-y-4">
            {entries.map((entry) => (
              <FoodCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* 食事追加用のフローティングボタン */}
      <AddButton />
    </main>
  );
}
