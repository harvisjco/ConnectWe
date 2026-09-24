const CACHE_NAME = 'connectwe-v2';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
];

// 설치: 앱 셸 캐싱 및 신속 인스톨
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 활성화: 구 버전 캐시(connectwe-v1 등) 전면 파기 및 즉시 제어권 획득
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 패치 전략:
// 1. Navigation / Document (HTML): Network-First (배포 시 최신 번들 해시 즉각 반영, 오프라인 시 캐시 폴백)
// 2. Static Assets (JS/CSS/Font/Images): Cache-First (단, 스크립트 요청에 text/html 반환 시 절대 캐시 안 함)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cross-origin 요청은 서비스워커 간섭 배제
  if (url.origin !== location.origin) return;

  // 1. HTML 문서 요청: Network-First (최신 index.html 및 번들 해시 즉각 취득)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 2. 정적 자산 (JS, CSS, 폰트, 이미지): Cache-First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // 성공적 응답이면서, 스크립트 요청에 text/html이 내려오지 않은 정상 자산만 캐시
        const contentType = response.headers.get('content-type') || '';
        const isMimeMismatch = request.destination === 'script' && contentType.includes('text/html');

        if (response.ok && !isMimeMismatch) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
