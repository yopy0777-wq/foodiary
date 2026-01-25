'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllEntries, deleteEntry } from '@/lib/db';
import { FoodEntry } from '@/types/food';
import FoodCard from '@/components/FoodCard';
import AddButton from '@/components/AddButton';

export default function Home() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    try {
      const data = await getAllEntries();
      setEntries(data);
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('この記録を削除しますか?')) {
      try {
        await deleteEntry(id);
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
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🍽️ 食事記録</h1>
            <p className="text-gray-600">食べたものを記録しよう</p>
          </div>
          <Link
            href="/settings"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="設定"
          >
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
        </header>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">📝</p>
            <p className="text-gray-600 mb-2">まだ記録がありません</p>
            <p className="text-sm text-gray-500">右下のボタンから記録を追加しましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <FoodCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <AddButton />
    </main>
  );
}