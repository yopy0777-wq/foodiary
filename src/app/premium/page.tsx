'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const plans = [
  {
    key: 'free',
    name: 'フリープラン',
    price: '無料',
    color: 'border-stone-200',
    badge: 'bg-stone-100 text-stone-600',
    features: [
      { label: 'PWA（端末内）保存', ok: true },
      { label: '手動バックアップ（JSONエクスポート）', ok: true },
      { label: 'ローカルフォルダ自動保存', ok: false },
      { label: 'クラウド保存', ok: false },
      { label: '写真保存', ok: false },
      { label: '複数デバイス同期', ok: false },
    ],
  },
  {
    key: 'member',
    name: '無料会員',
    price: '無料',
    color: 'border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700',
    features: [
      { label: 'PWA（端末内）保存', ok: true },
      { label: '手動バックアップ（JSONエクスポート）', ok: true },
      { label: 'ローカルフォルダ自動保存', ok: true },
      { label: 'クラウド保存', ok: false },
      { label: '写真保存', ok: false },
      { label: '複数デバイス同期', ok: false },
    ],
  },
  {
    key: 'premium',
    name: 'プレミアム',
    price: '月額 ¥300',
    color: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    highlight: true,
    features: [
      { label: 'PWA（端末内）保存', ok: true },
      { label: '手動バックアップ（JSONエクスポート）', ok: true },
      { label: 'ローカルフォルダ自動保存', ok: true },
      { label: 'クラウド保存', ok: true },
      { label: '写真保存', ok: true },
      { label: '複数デバイス同期', ok: true },
    ],
  },
];

export default function PremiumPage() {
  const { plan, isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F9F8F5]">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ヘッダー */}
        <header className="mb-8 flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-stone-200 transition text-stone-500"
            aria-label="戻る"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-stone-800">プレミアムプラン</h1>
        </header>

        {/* キャッチコピー */}
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full mb-3">
            ✦ プレミアム
          </span>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">
            写真も記録、どこでも同期
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            クラウド保存で食事の写真も残せて、<br />スマホ・PCどこからでもアクセスできます。
          </p>
        </div>

        {/* プラン比較 */}
        <div className="space-y-4 mb-10">
          {plans.map((p) => (
            <div
              key={p.key}
              className={`bg-white rounded-2xl border-2 ${p.color} p-5 ${p.highlight ? 'shadow-md' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.badge}`}>
                    {p.name}
                  </span>
                  {p.highlight && (
                    <span className="text-xs text-amber-600 font-medium">おすすめ</span>
                  )}
                </div>
                <span className="text-stone-700 font-bold">{p.price}</span>
              </div>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <span className={f.ok ? 'text-emerald-500' : 'text-stone-300'}>
                      {f.ok ? '✓' : '✕'}
                    </span>
                    <span className={f.ok ? 'text-stone-700' : 'text-stone-400'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center">
          {plan === 'premium' ? (
            <div>
              <p className="text-amber-600 font-semibold mb-1">✦ プレミアム会員です</p>
              <p className="text-stone-500 text-sm">すべての機能をご利用いただけます。</p>
              <Link
                href="/settings"
                className="inline-block mt-4 px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm transition"
              >
                設定を開く
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-stone-700 font-semibold mb-1">プレミアムにアップグレード</p>
              <p className="text-stone-400 text-sm mb-4">
                現在、申し込みはお問い合わせにて受け付けています。
              </p>
              {!isAuthenticated && (
                <p className="text-xs text-orange-500 mb-3">
                  ※ アップグレードにはログインが必要です
                </p>
              )}
              <a
                href={`mailto:yoichi0717bsk10@gmail.com?subject=プレミアム申し込み`}
                className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition shadow-sm"
              >
                申し込む（メールで連絡）
              </a>
            </div>
          )}
        </div>

        {/* 戻るリンク */}
        <div className="text-center mt-6">
          <Link href="/" className="text-stone-400 hover:text-stone-600 text-sm transition">
            ホームに戻る
          </Link>
        </div>

      </div>
    </main>
  );
}
