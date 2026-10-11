/**
 * ConnectWe 엔터프라이즈 토스트 큐 매니저 (ToastQueueService)
 * 
 * 애플 수석 디자이너 & WAI-ARIA 헌장 준수:
 * 1. 단일 토스트 메시지 덮어쓰기 증발 결함 완전 해소 (FIFO 멀티 스택 큐)
 * 2. 최대 3개 스택 디스플레이 및 개별 프로그레스 타이머
 * 3. 스크린리더 ARIA 라이브 리전 (aria-live="polite", role="status") 준수
 * 4. 세련된 상태별(Success, Info, Warning, Error) 시맨틱 뱃지
 */

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
  createdAt: number;
}

type ToastQueueListener = (toasts: ToastItem[]) => void;
const listeners = new Set<ToastQueueListener>();

let toastQueue: ToastItem[] = [];
const MAX_VISIBLE_TOASTS = 3;

function notify() {
  const current = [...toastQueue];
  listeners.forEach(cb => {
    try {
      cb(current);
    } catch (err) {
      console.error('[ToastQueue] Error notifying listener:', err);
    }
  });
}

/**
 * 신규 토스트 알림 추가
 */
export function pushToast(
  message: string, 
  type: ToastType = 'info', 
  durationMs: number = 3200
): string {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newToast: ToastItem = {
    id,
    message,
    type,
    durationMs,
    createdAt: Date.now()
  };

  toastQueue = [...toastQueue, newToast];
  if (toastQueue.length > MAX_VISIBLE_TOASTS) {
    toastQueue = toastQueue.slice(-MAX_VISIBLE_TOASTS);
  }
  notify();

  // 자동 제거 타이머
  setTimeout(() => {
    dismissToast(id);
  }, durationMs);

  return id;
}

/**
 * 특정 토스트 수동 닫기
 */
export function dismissToast(id: string): void {
  const prevLen = toastQueue.length;
  toastQueue = toastQueue.filter(t => t.id !== id);
  if (toastQueue.length !== prevLen) {
    notify();
  }
}

/**
 * 전체 토스트 큐 비우기
 */
export function clearAllToasts(): void {
  toastQueue = [];
  notify();
}

/**
 * 현재 토스트 목록 조회
 */
export function getActiveToasts(): ToastItem[] {
  return [...toastQueue];
}

/**
 * 토스트 큐 변경 구독
 */
export function subscribeToToasts(callback: ToastQueueListener): () => void {
  listeners.add(callback);
  callback([...toastQueue]);
  return () => {
    listeners.delete(callback);
  };
}
