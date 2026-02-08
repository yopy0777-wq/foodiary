'use client';

/**
 * 食事記録追加ページコンポーネント
 * 新しい食事記録を入力・保存するためのフォームを提供
 */

// React のフックをインポート
import { useState } from 'react';
// Next.js のルーター（ページ遷移用）
import { useRouter } from 'next/navigation';
// Next.js の Link コンポーネント
import Link from 'next/link';
// データベース操作関数をインポート
import { addEntry, compressImage } from '@/lib/db';
// 型定義をインポート
import { FoodEntry, MealType } from '@/types/food';
// カメラ入力コンポーネントをインポート
import CameraInput from '@/components/CameraInput';
// 認証コンテキストをインポート
import { useAuth } from '@/contexts/AuthContext';

// 選択可能な食事タイプの配列
const MEAL_TYPES: MealType[] = ['朝食', '昼食', '夕食', '夜食', '間食'];

/**
 * 食事追加ページコンポーネント
 */
export default function AddPage() {
  // ページ遷移用のルーター
  const router = useRouter();
  // 認証情報を取得
  const { user, isAuthenticated } = useAuth();
  // 日付（デフォルトは今日）
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  // 時間（デフォルトは現在時刻）
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  // 食事タイプ（デフォルトは昼食）
  const [mealType, setMealType] = useState<MealType>('昼食');
  // 献立名
  const [menu, setMenu] = useState('');
  // 写真データ（圧縮済みBlob）
  const [photo, setPhoto] = useState<Blob | null>(null);
  // プレビュー用のURL
  const [photoPreview, setPhotoPreview] = useState<string>('');
  // 保存中フラグ
  const [loading, setLoading] = useState(false);

  /**
   * 写真選択時のハンドラー
   * 画像を圧縮してstateに保存
   * @param file - 選択されたファイル（null の場合は削除）
   */
  const handlePhotoChange = async (file: File | null) => {
    if (file) {
      try {
        // 画像を圧縮（ストレージ容量削減のため）
        const compressedBlob = await compressImage(file);
        setPhoto(compressedBlob);

        // プレビュー用のURL作成
        const previewUrl = URL.createObjectURL(compressedBlob);
        setPhotoPreview(previewUrl);
      } catch (error) {
        console.error('画像の処理に失敗しました:', error);
        alert('画像の処理に失敗しました');
      }
    } else {
      // 画像が削除された場合
      setPhoto(null);
      setPhotoPreview('');
    }
  };

  /**
   * フォーム送信ハンドラー
   * エントリーを作成してデータベースに保存
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      // 新しい食事エントリーを作成
      const entry: FoodEntry = {
        id: crypto.randomUUID(),           // 一意なIDを生成
        date,
        time,
        mealType,
        menu: menu.trim() || undefined,    // 空文字は undefined に
        photo: photo || undefined,         // null は undefined に
        createdAt: Date.now(),             // 作成日時
      };

      // データベースに保存（認証状態に応じて IndexedDB または Supabase に保存）
      await addEntry(entry, {
        userId: user?.id,
        isAuthenticated,
      });
      // ホームページに戻る
      router.push('/');
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ヘッダー部分 */}
        <header className="mb-8 flex items-center">
          {/* 戻るボタン */}
          <Link
            href="/"
            className="mr-4 text-gray-600 hover:text-gray-800 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">新しい記録</h1>
        </header>

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            {/* 日付と時間の入力フィールド */}
            <div className="flex gap-4">
              {/* 日付入力 */}
              <div className="flex-1">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  📅 日付
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              {/* 時間入力 */}
              <div className="flex-1">
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  🕐 時間
                </label>
                <input
                  type="time"
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* 食事種別の選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🍽️ 食事種別
              </label>
              {/* タグ形式の選択ボタン */}
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`px-4 py-2 rounded-full font-medium transition ${
                      mealType === type
                        ? 'bg-green-500 text-white'           // 選択中のスタイル
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'  // 未選択のスタイル
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 献立の入力 */}
            <div>
              <label htmlFor="menu" className="block text-sm font-medium text-gray-700 mb-2">
                📝 献立（任意）
              </label>
              <input
                type="text"
                id="menu"
                value={menu}
                onChange={(e) => setMenu(e.target.value)}
                placeholder="例: ハンバーグ、サラダ、味噌汁"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 写真の入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📷 写真（任意）
              </label>
              <CameraInput onChange={handlePhotoChange} preview={photoPreview} />
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95 disabled:transform-none"
          >
            {loading ? '保存中...' : '💾 保存する'}
          </button>
        </form>
      </div>
    </main>
  );
}
