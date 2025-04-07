// キャッシュの名前
const CACHE_NAME = 'study-tracker-v2';

// キャッシュするアセット
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/default-subject.png',
  '/app-icon-192.png',
  '/app-icon-512.png'
];

// Service Workerのインストール時
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
  // 即座に新しいサービスワーカーをアクティブにする
  self.skipWaiting();
});

// Service Workerのアクティベート時
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除しました:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 制御していないクライアントを制御下に置く
  self.clients.claim();
});

// フェッチリクエスト時
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュが見つかればそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュになければネットワークからフェッチ
        return fetch(event.request).then(
          response => {
            // 無効なレスポンスの場合は何もしない
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに追加
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(() => {
        // オフラインで未キャッシュのリソースの場合
        if (event.request.url.indexOf('/api/') !== -1) {
          return new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
  );
}); 