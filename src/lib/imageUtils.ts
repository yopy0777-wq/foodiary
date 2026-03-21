/**
 * 画像圧縮ユーティリティ
 */

/**
 * 画像を圧縮する関数
 * Canvas を使用して画像をリサイズし、JPEG 形式で圧縮
 * @param file - 圧縮する画像ファイル
 * @param maxWidth - 最大幅（デフォルト: 800px）
 * @param maxHeight - 最大高さ（デフォルト: 800px）
 * @param quality - JPEG 品質（0-1、デフォルト: 0.8）
 * @returns 圧縮された画像の Blob
 */
export const compressImage = async (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // ファイルを読み込む
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      // 画像要素を作成
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Canvas を作成
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // アスペクト比を維持しながらリサイズ
        if (width > height) {
          // 横長の画像
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          // 縦長または正方形の画像
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        // Canvas のサイズを設定
        canvas.width = width;
        canvas.height = height;
        // Canvas に画像を描画
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // JPEG 形式で Blob に変換
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
