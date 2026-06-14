// キャッシュ名にバージョンを付与。更新したらこの番号を上げると古いキャッシュが破棄される
const CACHE_NAME = 'food-diary-v2';

// インストール時：新しい Service Worker を即座に待機解除して有効化する
// （古い SW がページを握り続けて更新が反映されない問題を防ぐ）
self.addEventListener('install', () => {
  self.skipWaiting();
});

// 有効化時：古いバージョンのキャッシュを全削除し、すぐにページの制御を奪う
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// フェッチ戦略
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET 以外（POST など）は介入しない
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ハッシュ付き静的アセット（/_next/static/）は内容が不変なのでキャッシュ優先で高速化
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // HTML（ページ遷移）はネットワーク優先：必ず最新を取得し、オフライン時のみキャッシュにフォールバック
  // これによりデプロイ後も常に最新のHTMLが配信され、古いチャンク参照による404を防ぐ
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // その他のリクエストはネットワーク優先、失敗時にキャッシュ
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
