/**
 * Supabase Storage 操作モジュール
 * 写真のアップロード・ダウンロード・削除を管理
 */

import { createClient } from './supabase';

// Storage バケット名
const BUCKET_NAME = 'food-photos';

/**
 * 写真を Supabase Storage にアップロード
 * @param userId - ユーザーID
 * @param entryId - エントリーID
 * @param photo - 写真 Blob
 * @returns アップロードされたファイルのパス（失敗時は null）
 */
export const uploadPhoto = async (
  userId: string,
  entryId: string,
  photo: Blob
): Promise<string | null> => {
  const supabase = createClient();
  if (!supabase) return null;

  // ファイルパス: {userId}/{entryId}.jpg
  const filePath = `${userId}/${entryId}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, photo, {
      contentType: 'image/jpeg',
      upsert: true,  // 既存ファイルがあれば上書き
    });

  if (error) {
    console.error('写真アップロードエラー:', error);
    return null;
  }

  return filePath;
};

/**
 * 写真の署名付き URL を取得
 * @param filePath - ファイルパス
 * @returns 署名付き URL（有効期限1時間）、失敗時は null
 */
export const getPhotoUrl = async (filePath: string): Promise<string | null> => {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600); // 1時間有効

  if (error) {
    console.error('URL取得エラー:', error);
    return null;
  }

  return data.signedUrl;
};

/**
 * 写真を削除
 * @param filePath - ファイルパス
 * @returns 成功時は true、失敗時は false
 */
export const deletePhoto = async (filePath: string): Promise<boolean> => {
  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('写真削除エラー:', error);
    return false;
  }

  return true;
};

/**
 * 写真をダウンロード（Blob 形式）
 * @param filePath - ファイルパス
 * @returns 写真 Blob、失敗時は null
 */
export const downloadPhoto = async (filePath: string): Promise<Blob | null> => {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error) {
    console.error('写真ダウンロードエラー:', error);
    return null;
  }

  return data;
};
