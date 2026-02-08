/**
 * ルートレイアウトコンポーネント
 * アプリ全体の共通レイアウトを定義
 * Next.js App Router の規約に従い、全ページに適用される
 */

// Next.js のメタデータ型とビューポート型をインポート
import type { Metadata, Viewport } from 'next'
// Google Fonts の Inter フォントをインポート
import { Inter } from 'next/font/google'
// グローバルスタイルシートをインポート
import './globals.css'
// Next.js の Script コンポーネント（スクリプトの読み込みを最適化）
import Script from 'next/script'
// 認証プロバイダーコンポーネントをインポート
import { AuthProvider } from '@/contexts/AuthContext'

// Inter フォントの設定（ラテン文字サブセットのみ使用）
const inter = Inter({ subsets: ['latin'] })

/**
 * ビューポートの設定
 * モバイルデバイスでの表示を最適化
 */
export const viewport: Viewport = {
  width: 'device-width',      // デバイス幅に合わせる
  initialScale: 1,            // 初期ズーム倍率
  maximumScale: 1,            // 最大ズーム倍率（ピンチズーム無効）
  userScalable: false,        // ユーザーによるズーム操作を無効
  themeColor: '#10b981',      // テーマカラー（ブラウザのアドレスバー色など）
}

/**
 * メタデータの設定
 * SEO とPWA に必要な情報を定義
 */
export const metadata: Metadata = {
  title: '食事記録アプリ',              // ページタイトル
  description: '食べたものを写真とメモで記録',  // ページの説明
  manifest: '/manifest.json',           // PWA マニフェストへのパス
  appleWebApp: {
    capable: true,                      // iOS でホーム画面に追加可能
    statusBarStyle: 'default',          // iOS ステータスバーのスタイル
    title: '食事記録',                  // iOS ホーム画面でのタイトル
  },
}

/**
 * ルートレイアウトコンポーネント
 * 全ページに共通する HTML 構造を定義
 * @param children - 子コンポーネント（各ページのコンテンツ）
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* ファビコン（SVG形式） */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        {/* iOS 用のホーム画面アイコン */}
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={inter.className}>
        {/* 認証プロバイダーで全体をラップ（認証状態を全ページで共有） */}
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Service Worker の登録スクリプト（PWA対応） */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            // Service Worker がサポートされているか確認
            if ('serviceWorker' in navigator) {
              // ページ読み込み完了後に登録
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                  (registration) => {
                    console.log('Service Worker registered:', registration);
                  },
                  (error) => {
                    console.log('Service Worker registration failed:', error);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
