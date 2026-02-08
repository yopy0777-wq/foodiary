'use client';

// React の useRef フックをインポート（DOM 要素への参照を保持するため）
import { useRef } from 'react';

/**
 * CameraInput コンポーネントの Props 型定義
 */
interface CameraInputProps {
  onChange: (file: File | null) => void;  // ファイル選択時のコールバック関数
  preview: string;                         // プレビュー画像の URL
}

/**
 * カメラ入力コンポーネント
 * カメラで撮影または写真を選択して画像を入力するためのUI
 * @param onChange - ファイル選択時に呼ばれるコールバック
 * @param preview - 選択された画像のプレビューURL
 */
export default function CameraInput({ onChange, preview }: CameraInputProps) {
  // カメラ入力用の input 要素への参照
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // ギャラリー選択用の input 要素への参照
  const galleryInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル選択時のハンドラー
   * 選択されたファイルを親コンポーネントに通知
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  /**
   * 画像削除時のハンドラー
   * input の値をクリアし、親コンポーネントに null を通知
   */
  const handleRemove = () => {
    // カメラ入力の値をリセット
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    // ギャラリー入力の値をリセット
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
    // 親コンポーネントに画像削除を通知
    onChange(null);
  };

  /**
   * カメラボタンクリック時のハンドラー
   * 非表示のカメラ入力をプログラムでクリック
   */
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  /**
   * 写真選択ボタンクリック時のハンドラー
   * 非表示のギャラリー入力をプログラムでクリック
   */
  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  return (
    <div>
      {/* プレビュー画像がある場合は画像を表示 */}
      {preview ? (
        <div className="relative">
          {/* プレビュー画像 */}
          <img
            src={preview}
            alt="プレビュー"
            className="w-full h-64 object-cover rounded-lg"
          />
          {/* 画像削除ボタン（右上に配置） */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition"
          >
            {/* X アイコン */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* プレビューがない場合は写真追加UI を表示 */
        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {/* カメラアイコン */}
            <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mb-4 text-sm text-gray-500">写真を追加</p>
            {/* ボタンコンテナ */}
            <div className="flex gap-3">
              {/* カメラで撮影ボタン */}
              <button
                type="button"
                onClick={handleCameraClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                カメラで撮影
              </button>
              {/* 写真を選択ボタン */}
              <button
                type="button"
                onClick={handleGalleryClick}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                写真を選択
              </button>
            </div>
          </div>
          {/* 非表示のカメラ入力（capture="environment" で背面カメラを使用） */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleChange}
            className="hidden"
          />
          {/* 非表示のギャラリー入力（capture なしでファイル選択） */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
