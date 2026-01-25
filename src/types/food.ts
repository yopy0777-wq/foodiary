export type MealType = '朝食' | '昼食' | '夕食' | '夜食' | '間食';

export interface FoodEntry {
  id: string;
  date: string;
  time?: string;  // HH:mm形式（例: "12:30"）
  mealType: MealType;  // 食事種別
  menu?: string;  // 献立（任意）
  photo?: Blob;
  createdAt: number;
}

export interface FoodEntryWithPhotoURL extends Omit<FoodEntry, 'photo'> {
  photoURL?: string;
}