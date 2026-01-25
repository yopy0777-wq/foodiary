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
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🍽️ 食事記録</h1>
          <p className="text-gray-600">食べたものを記録しよう</p>
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