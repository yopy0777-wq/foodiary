export interface FoodEntry {
  id: string;
  date: string;
  menuName: string;
  photo?: Blob;
  createdAt: number;
}

export interface FoodEntryWithPhotoURL extends Omit<FoodEntry, 'photo'> {
  photoURL?: string;
}