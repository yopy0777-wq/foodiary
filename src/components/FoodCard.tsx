'use client';

import { useEffect, useState } from 'react';
import { FoodEntry } from '@/types/food';

interface FoodCardProps {
  entry: FoodEntry;
  onDelete: (id: string) => void;
}

export default function FoodCard({ entry, onDelete }: FoodCardProps) {
  const [photoURL, setPhotoURL] = useState<string>('');

  useEffect(() => {
    if (entry.photo) {
      const url = URL.createObjectURL(entry.photo);
      setPhotoURL(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [entry.photo]);

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
      {photoURL && (
        <div className="w-full h-64 bg-gray-100">
          <img
            src={photoURL}
            alt={entry.menuName}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-gray-800">{entry.menuName}</h2>
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
        
        <p className="text-gray-600 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(entry.date)}
          {entry.time && (
            <span className="ml-3 flex items-center">
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