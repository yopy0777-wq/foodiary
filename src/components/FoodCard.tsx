'use client';

// React のフックをインポート
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// 食事エントリーの型定義をインポート
import { FoodEntry } from '@/types/food';

/**
 * FoodCard コンポーネントの Props 型定義
 */
interface FoodCardProps {
  entry: FoodEntry;                    // 表示する食事エントリーデータ
  onDelete: (id: string) => void;      // 削除時のコールバック関数
}

/**
 * 食事カードコンポーネント
 * 1つの食事エントリーをカード形式で表示する
 * @param entry - 食事エントリーデータ
 * @param onDelete - 削除ボタンクリック時のコールバック
 */
export default function FoodCard({ entry, onDelete }: FoodCardProps) {
  const router = useRouter();
  // 写真の Object URL を保持する state
  const [photoURL, setPhotoURL] = useState<string>('');

  /**
   * 写真データから Object URL を生成
   * コンポーネントのアンマウント時にメモリリークを防ぐため URL を解放
   */
  useEffect(() => {
    if (entry.photo) {
      // Blob から Object URL を生成
      const url = URL.createObjectURL(entry.photo);
      setPhotoURL(url);
      // クリーンアップ関数：Object URL を解放
      return () => URL.revokeObjectURL(url);
    }
  }, [entry.photo]);

  /**
   * 日付を日本語形式でフォーマット
   * 例: "2024年1月28日(火)"
   * @param dateString - ISO 形式の日付文字列
   * @returns フォーマットされた日付文字列
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* 写真がある場合は表示 */}
      {photoURL && (
        <div className="w-full h-64 bg-gray-100">
          <img
            src={photoURL}
            alt={entry.mealType}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* カード本体 */}
      <div className="p-6">
        {/* ヘッダー部分：食事タイプ、メニュー名、削除ボタン */}
        <div className="flex justify-between items-start mb-2">
          <div>
            {/* 食事タイプのラベル（朝食、昼食など） */}
            <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mb-2">
              {entry.mealType}
            </span>
            {/* メニュー名（入力されている場合のみ表示） */}
            {entry.menu && (
              <h2 className="text-xl font-bold text-gray-800">{entry.menu}</h2>
            )}
          </div>
          <div className="flex gap-1">
            {/* 編集ボタン */}
            <button
              onClick={() => router.push(`/edit/${entry.id}`)}
              className="text-gray-500 hover:text-green-600 transition p-2 hover:bg-green-50 rounded-lg"
              title="編集"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {/* 削除ボタン */}
            <button
              onClick={() => onDelete(entry.id)}
              className="text-red-500 hover:text-red-700 transition p-2 hover:bg-red-50 rounded-lg"
              title="削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* フッター部分：日付と時間 */}
        <p className="text-gray-600 flex items-center">
          {/* カレンダーアイコン */}
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {/* フォーマットされた日付 */}
          {formatDate(entry.date)}
          {/* 時間（入力されている場合のみ表示） */}
          {entry.time && (
            <span className="ml-3 flex items-center">
              {/* 時計アイコン */}
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {entry.time}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
