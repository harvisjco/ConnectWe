import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

import { ErrorBoundary } from './components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="ConnectWe 시스템 전역 세이프가드 개입">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// PWA 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[ConnectWe] SW registered:', reg.scope))
      .catch((err) => console.warn('[ConnectWe] SW registration failed:', err));
  });
}
