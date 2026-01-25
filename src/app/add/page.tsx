'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addEntry, compressImage } from '@/lib/db';
import { FoodEntry } from '@/types/food';
import CameraInput from '@/components/CameraInput';

export default function AddPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [menuName, setMenuName] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = async (file: File | null) => {
    if (file) {
      try {
        // 画像を圧縮
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
      setPhoto(null);
      setPhotoPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!menuName.trim()) {
      alert('メニュー名を入力してください');
      return;
    }

    setLoading(true);

    try {
      const entry: FoodEntry = {
        id: crypto.randomUUID(),
        date,
        time,
        menuName: menuName.trim(),
        photo: photo || undefined,
        createdAt: Date.now(),
      };

      await addEntry(entry);
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
        <header className="mb-8 flex items-center">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            {/* 日付 */}
            <div>
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

            {/* 時間 */}
            <div>
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

            {/* メニュー名 */}
            <div>
              <label htmlFor="menuName" className="block text-sm font-medium text-gray-700 mb-2">
                🍴 メニュー名
              </label>
              <input
                type="text"
                id="menuName"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="例: ハンバーグ定食"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* 写真 */}
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