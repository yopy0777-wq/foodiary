'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getAllEntries, importEntries, clearAllEntries } from '@/lib/db';
import {
  isFileSystemAccessSupported,
  selectDirectory,
  getDirectoryHandle,
  hasStoredDirectory,
  clearDirectoryHandle,
  exportToDownload,
  importFromFile,
  loadFromFile,
} from '@/lib/fileStorage';

export default function SettingsPage() {
  const [isSupported, setIsSupported] = useState(false);
  const [hasDirectory, setHasDirectory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const supported = isFileSystemAccessSupported();
      setIsSupported(supported);

      if (supported) {
        const stored = await hasStoredDirectory();
        setHasDirectory(stored);
      }

      setLoading(false);
    };
    init();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSelectDirectory = async () => {
    try {
      const handle = await selectDirectory();
      if (handle) {
        setHasDirectory(true);
        showMessage('success', 'フォルダを設定しました。データが自動保存されます。');

        // 既存データをファイルに保存
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

  const handleClearDirectory = async () => {
    if (confirm('フォルダ設定を解除しますか？\n（保存済みのファイルは削除されません）')) {
      await clearDirectoryHandle();
      setHasDirectory(false);
      showMessage('success', 'フォルダ設定を解除しました');
    }
  };

  const handleSyncFromFile = async () => {
    if (!confirm('ファイルからデータを読み込みますか？\n現在のデータはファイルの内容で上書きされます。')) {
      return;
    }

    setSyncing(true);
    try {
      const entries = await loadFromFile();
      if (entries === null) {
        showMessage('error', 'ファイルの読み込みに失敗しました');
        return;
      }

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
      e.target.value = '';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <header className="mb-8 flex items-center">
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
          {/* 自動保存設定 */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">自動保存</h2>

            {loading ? (
              <div className="text-gray-600">読み込み中...</div>
            ) : !isSupported ? (
              <div className="text-gray-600">
                <p className="mb-2">このブラウザは自動保存に対応していません。</p>
                <p className="text-sm text-gray-500">
                  Chrome または Edge を使用すると、ローカルフォルダへの自動保存が利用できます。
                </p>
              </div>
            ) : hasDirectory ? (
              <div className="space-y-4">
                <div className="flex items-center text-green-600">
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
                  <button
                    onClick={handleSyncFromFile}
                    disabled={syncing}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition"
                  >
                    {syncing ? '読み込み中...' : 'ファイルから読み込む'}
                  </button>
                  <button
                    onClick={handleClearDirectory}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    設定を解除
                  </button>
                </div>
              </div>
            ) : (
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

          {/* 手動バックアップ */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">手動バックアップ</h2>
            <p className="text-gray-600 mb-4">
              全ブラウザ対応。JSONファイルとしてデータをダウンロード・復元できます。
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                データをエクスポート
              </button>
              <button
                onClick={handleImportClick}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
              >
                データをインポート
              </button>
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
