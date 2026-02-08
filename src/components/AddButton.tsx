// Next.js の Link コンポーネントをインポート（クライアントサイドナビゲーション用）
import Link from 'next/link';

/**
 * 食事追加ボタンコンポーネント
 * 画面右下に固定表示される緑色のフローティングボタン
 * クリックすると食事追加ページ（/add）に遷移する
 */
export default function AddButton() {
  return (
    <Link
      href="/add"
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition transform hover:scale-110 active:scale-95 z-50"
    >
      {/* プラス（+）アイコン */}
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  );
}
