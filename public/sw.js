const CACHE_NAME = 'connectwe-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 설치: 앱 셸 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 활성화: 구 버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 패치: Cache-first 전략 (정적 자산) / Network-first (API)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 같은 오리진 정적 자산만 캐시
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // JS/CSS/폰트만 캐시에 저장
          if (
            response.ok &&
            (request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'font' ||
              request.destination === 'document')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // 오프라인 폴백: HTML 요청이면 캐시된 index.html 반환
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('오프라인 상태입니다.', { status: 503 });
        });
    })
  );
});
