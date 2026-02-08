'use client';

/**
 * 設定ページコンポーネント
 * アカウント管理、自動保存設定、バックアップ機能を提供
 */

// React のフックをインポート
import { useState, useEffect, useRef } from 'react';
// Next.js の Link コンポーネントをインポート
import Link from 'next/link';
// データベース操作関数をインポート
import { getAllEntries, importEntries, clearAllEntries } from '@/lib/db';
// ファイルストレージ関連の関数をインポート
import {
  isFileSystemAccessSupported,
  selectDirectory,
  hasStoredDirectory,
  clearDirectoryHandle,
  exportToDownload,
  importFromFile,
  loadFromFile,
} from '@/lib/fileStorage';
// 認証コンテキストをインポート
import { useAuth } from '@/contexts/AuthContext';
// プラン関連のユーティリティをインポート
import { canUseLocalSync, getPlanLabel, getPlanDescription } from '@/lib/plan';

/**
 * プランタイプごとのスタイル定義
 */
const planColors = {
  free: 'bg-gray-100 text-gray-600 border-gray-200',
  member: 'bg-green-100 text-green-600 border-green-200',
  premium: 'bg-yellow-100 text-yellow-600 border-yellow-200',
};

/**
 * 設定ページコンポーネント
 */
export default function SettingsPage() {
  // 認証コンテキストから必要な値と関数を取得
  const { user, plan, isAuthenticated, signOut } = useAuth();
  // File System Access API のサポート状態
  const [isSupported, setIsSupported] = useState(false);
  // 保存フォルダが設定されているか
  const [hasDirectory, setHasDirectory] = useState(false);
  // 読み込み中フラグ
  const [loading, setLoading] = useState(true);
  // 同期処理中フラグ
  const [syncing, setSyncing] = useState(false);
  // 通知メッセージ
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // ファイル選択用の input 要素への参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ローカル自動保存が利用可能か（プランとブラウザのサポート状況で判定）
  const canLocalSync = canUseLocalSync(plan);

  /**
   * 初期化処理
   * ブラウザのサポート状況とフォルダ設定の有無を確認
   */
  useEffect(() => {
    const init = async () => {
      // File System Access API のサポート確認
      const supported = isFileSystemAccessSupported();
      setIsSupported(supported);

      // サポートされている場合、フォルダ設定の有無を確認
      if (supported) {
        const stored = await hasStoredDirectory();
        setHasDirectory(stored);
      }

      setLoading(false);
    };
    init();
  }, []);

  /**
   * 通知メッセージを表示
   * 3秒後に自動で非表示
   * @param type - メッセージタイプ（success または error）
   * @param text - 表示するテキスト
   */
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  /**
   * 保存フォルダ選択ハンドラー
   * ユーザーにフォルダを選択させ、既存データを保存
   */
  const handleSelectDirectory = async () => {
    try {
      const handle = await selectDirectory();
      if (handle) {
        setHasDirectory(true);
        showMessage('success', 'フォルダを設定しました。データが自動保存されます。');

        // 既存のエントリーがあればファイルに保存
        const entries = await getAllEntries();
        if (entries.length > 0) {
          const { saveToFile } = await import('@/lib/fileStorage');
          await saveToFile(entries);
        }
      }
    } catch (error) {
      console.error('フォルダ選択に失敗しました:', error);
      showMessage('error', 'フォルダの選択に失敗しました');
    }
  };

  /**
   * フォルダ設定解除ハンドラー
   * 確認後、保存されたフォルダ設定を削除
   */
  const handleClearDirectory = async () => {
    if (confirm('フォルダ設定を解除しますか？\n（保存済みのファイルは削除されません）')) {
      await clearDirectoryHandle();
      setHasDirectory(false);
      showMessage('success', 'フォルダ設定を解除しました');
    }
  };

  /**
   * ファイルからデータを読み込むハンドラー
   * 既存データを上書きしてファイルの内容で置き換え
   */
  const handleSyncFromFile = async () => {
    if (!confirm('ファイルからデータを読み込みますか？\n現在のデータはファイルの内容で上書きされます。')) {
      return;
    }

    setSyncing(true);
    try {
      // ファイルからデータを読み込み
      const entries = await loadFromFile();
      if (entries === null) {
        showMessage('error', 'ファイルの読み込みに失敗しました');
        return;
      }

      // 既存データをクリアしてインポート
      await clearAllEntries();
      if (entries.length > 0) {
        await importEntries(entries);
      }

      showMessage('success', `${entries.length}件のデータを読み込みました`);
    } catch (error) {
      console.error('同期に失敗しました:', error);
      showMessage('error', '同期に失敗しました');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * データエクスポートハンドラー
   * 全データを JSON ファイルとしてダウンロード
   */
  const handleExport = async () => {
    try {
      const entries = await getAllEntries();
      await exportToDownload(entries);
      showMessage('success', 'データをエクスポートしました');
    } catch (error) {
      console.error('エクスポートに失敗しました:', error);
      showMessage('error', 'エクスポートに失敗しました');
    }
  };

  /**
   * インポートボタンクリックハンドラー
   * 非表示のファイル入力をクリック
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * ファイルインポートハンドラー
   * 選択されたファイルからデータを読み込んでインポート
   */
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ファイルからデータをインポートしますか？\n同じIDのデータは上書きされます。')) {
      e.target.value = '';
      return;
    }

    try {
      const entries = await importFromFile(file);
      await importEntries(entries);
      showMessage('success', `${entries.length}件のデータをインポートしました`);
    } catch (error) {
      console.error('インポートに失敗しました:', error);
      showMessage('error', 'インポートに失敗しました。ファイル形式を確認してください。');
    } finally {
      // ファイル入力をリセット（同じファイルを再選択可能に）
      e.target.value = '';
    }
  };

  /**
   * ログアウトハンドラー
   */
  const handleSignOut = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut();
      showMessage('success', 'ログアウトしました');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ヘッダー部分 */}
        <header className="mb-8 flex items-center">
          {/* 戻るボタン */}
          <Link
            href="/"
            className="mr-4 text-gray-600 hover:text-gray-800 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">設定</h1>
        </header>

        {/* 通知メッセージ */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* アカウントセクション */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">アカウント</h2>

            {isAuthenticated ? (
              /* ログイン済みの場合 */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    {/* メールアドレス */}
                    <p className="text-gray-800 font-medium">{user?.email}</p>
                    {/* プランラベル */}
                    <span className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full border ${planColors[plan]}`}>
                      {getPlanLabel(plan)}
                    </span>
                  </div>
                </div>
                {/* プランの説明 */}
                <p className="text-sm text-gray-600">{getPlanDescription(plan)}</p>

                {/* プレミアム以外にはアップグレードボタンを表示 */}
                {plan !== 'premium' && (
                  <Link
                    href="/premium"
                    className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition text-sm"
                  >
                    プレミアムにアップグレード
                  </Link>
                )}

                {/* ログアウトボタン */}
                <div className="pt-4 border-t">
                  <button
                    onClick={handleSignOut}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              /* 未ログインの場合 */
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${planColors.free}`}>
                    {getPlanLabel('free')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{getPlanDescription('free')}</p>
                <p className="text-gray-600">
                  会員登録すると、ローカルフォルダへの自動保存など便利な機能が使えます。
                </p>
                {/* ログイン・新規登録ボタン */}
                <div className="flex gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm"
                  >
                    新規登録
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* 自動保存設定セクション */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">自動保存</h2>

            {loading ? (
              /* 読み込み中 */
              <div className="text-gray-600">読み込み中...</div>
            ) : !canLocalSync ? (
              /* 自動保存が利用できない場合（プランまたはブラウザの制限） */
              <div className="text-gray-600">
                <p className="mb-2">この機能を使うには会員登録が必要です。</p>
                {!isSupported && (
                  <p className="text-sm text-gray-500">
                    また、Chrome または Edge を使用する必要があります。
                  </p>
                )}
                {!isAuthenticated && (
                  <Link
                    href="/auth/signup"
                    className="inline-block mt-3 text-green-600 hover:underline text-sm"
                  >
                    会員登録して機能を解放
                  </Link>
                )}
              </div>
            ) : !isSupported ? (
              /* ブラウザが未対応の場合 */
              <div className="text-gray-600">
                <p className="mb-2">このブラウザは自動保存に対応していません。</p>
                <p className="text-sm text-gray-500">
                  Chrome または Edge を使用すると、ローカルフォルダへの自動保存が利用できます。
                </p>
              </div>
            ) : hasDirectory ? (
              /* 自動保存が有効な場合 */
              <div className="space-y-4">
                <div className="flex items-center text-green-600">
                  {/* チェックマークアイコン */}
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>自動保存が有効です</span>
                </div>
                <p className="text-sm text-gray-600">
                  データは自動的にローカルフォルダに保存されます。
                </p>
                <div className="flex flex-wrap gap-2">
                  {/* ファイルから読み込むボタン */}
                  <button
                    onClick={handleSyncFromFile}
                    disabled={syncing}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition"
                  >
                    {syncing ? '読み込み中...' : 'ファイルから読み込む'}
                  </button>
                  {/* 設定解除ボタン */}
                  <button
                    onClick={handleClearDirectory}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    設定を解除
                  </button>
                </div>
              </div>
            ) : (
              /* フォルダ未設定の場合 */
              <div className="space-y-4">
                <p className="text-gray-600">
                  フォルダを選択すると、データが自動的にローカルファイルに保存されます。
                  ブラウザのデータを削除しても、ファイルからデータを復元できます。
                </p>
                <button
                  onClick={handleSelectDirectory}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                >
                  保存フォルダを選択
                </button>
              </div>
            )}
          </section>

          {/* 手動バックアップセクション */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">手動バックアップ</h2>
            <p className="text-gray-600 mb-4">
              全ブラウザ対応。JSONファイルとしてデータをダウンロード・復元できます。
            </p>
            <div className="flex flex-wrap gap-2">
              {/* エクスポートボタン */}
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                データをエクスポート
              </button>
              {/* インポートボタン */}
              <button
                onClick={handleImportClick}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
              >
                データをインポート
              </button>
              {/* 非表示のファイル入力 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
