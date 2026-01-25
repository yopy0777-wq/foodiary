import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FoodEntry } from '@/types/food';

interface FoodDiaryDB extends DBSchema {
  entries: {
    key: string;
    value: FoodEntry;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'FoodDiaryDB';
const STORE_NAME = 'entries';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FoodDiaryDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FoodDiaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-date', 'date');
        }
      },
    });
  }
  return dbPromise;
};

export const addEntry = async (entry: FoodEntry): Promise<void> => {
  const db = await getDB();
  await db.add(STORE_NAME, entry);
};

export const getAllEntries = async (): Promise<FoodEntry[]> => {
  const db = await getDB();
  const entries = await db.getAllFromIndex(STORE_NAME, 'by-date');
  return entries.reverse(); // 新しい順に並び替え
};

export const getEntry = async (id: string): Promise<FoodEntry | undefined> => {
  const db = await getDB();
  return await db.get(STORE_NAME, id);
};

export const deleteEntry = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
};

export const updateEntry = async (entry: FoodEntry): Promise<void> => {
  const db = await getDB();
  await db.put(STORE_NAME, entry);
};

// 画像を圧縮する関数
export const compressImage = async (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('画像の圧縮に失敗しました'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};