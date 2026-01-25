export interface FoodEntry {
  id: string;
  date: string;
  time?: string;  // HH:mm形式（例: "12:30"）
  menuName: string;
  photo?: Blob;
  createdAt: number;
}

export interface FoodEntryWithPhotoURL extends Omit<FoodEntry, 'photo'> {
  photoURL?: string;
}