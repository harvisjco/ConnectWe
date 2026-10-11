/**
 * ConnectWe 엔터프라이즈 화면 무활동 자동 잠금 서비스 (InactivityGuardService)
 * 
 * 구글 수석 아키텍트 & 글로벌 보안 헌장 준수:
 * 1. 고위 경영진 자리 비움 또는 기기 방치 시 15분 무활동 자동 블러 잠금
 * 2. 마우스, 키보드, 터치, 스크롤 인터랙션 감지 기반 타이머 리셋
 * 3. WebAuthn 생체인증 / PIN 번호 간편 즉시 복귀 파이프라인
 * 4. 세션 보안 상태 이벤트 브로드캐스팅
 */

export interface InactivityState {
  isLocked: boolean;
  timeoutMinutes: number;
  lastActivityTime: number;
}

type InactivityListener = (state: InactivityState) => void;
const listeners = new Set<InactivityListener>();

const DEFAULT_TIMEOUT_MINUTES = 15;
const STORAGE_TIMEOUT_KEY = 'connectwe_inactivity_timeout_mins';

let timeoutMinutes = DEFAULT_TIMEOUT_MINUTES;
let isLocked = false;
let lastActivityTime = Date.now();
let checkTimer: ReturnType<typeof setInterval> | null = null;

if (typeof localStorage !== 'undefined') {
  const savedTimeout = localStorage.getItem(STORAGE_TIMEOUT_KEY);
  if (savedTimeout) {
    timeoutMinutes = parseInt(savedTimeout, 10) || DEFAULT_TIMEOUT_MINUTES;
  }
}

function notify() {
  const state: InactivityState = {
    isLocked,
    timeoutMinutes,
    lastActivityTime
  };
  listeners.forEach(cb => {
    try {
      cb(state);
    } catch (err) {
      console.error('[InactivityGuard] Listener error:', err);
    }
  });
}

/**
 * 사용자 활동 감지 시 타이머 리셋
 */
export function recordUserActivity(): void {
  if (isLocked) return; // 이미 잠긴 상태에서는 언락 전까지 리셋하지 않음
  lastActivityTime = Date.now();
}

/**
 * 수동 즉시 화면 잠금
 */
export function lockAppManually(): void {
  isLocked = true;
  notify();
}

/**
 * 화면 잠금 해제 (인증 성공 시)
 */
export function unlockApp(): void {
  isLocked = false;
  lastActivityTime = Date.now();
  notify();
}

/**
 * 자동 잠금 타임아웃 시간 변경 (분 단위, 0 = 비활성화)
 */
export function setInactivityTimeout(minutes: number): void {
  timeoutMinutes = minutes;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_TIMEOUT_KEY, String(minutes));
  }
  notify();
}

/**
 * 현재 잠금 상태 확인
 */
export function getInactivityState(): InactivityState {
  return {
    isLocked,
    timeoutMinutes,
    lastActivityTime
  };
}

/**
 * 무활동 감지 백그라운드 엔진 초기화
 */
export function initInactivityEngine(): () => void {
  if (typeof window === 'undefined') return () => {};

  const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
  const handleActivity = () => {
    recordUserActivity();
  };

  activityEvents.forEach(evt => {
    window.addEventListener(evt, handleActivity, { passive: true });
  });

  // 10초마다 무활동 시간 점검
  if (checkTimer) clearInterval(checkTimer);
  checkTimer = setInterval(() => {
    if (timeoutMinutes <= 0 || isLocked) return;

    const elapsedMs = Date.now() - lastActivityTime;
    const limitMs = timeoutMinutes * 60 * 1000;

    if (elapsedMs >= limitMs) {
      isLocked = true;
      notify();
    }
  }, 10000);

  return () => {
    activityEvents.forEach(evt => {
      window.removeEventListener(evt, handleActivity);
    });
    if (checkTimer) clearInterval(checkTimer);
  };
}

/**
 * 잠금 상태 변경 구독
 */
export function subscribeToInactivity(callback: InactivityListener): () => void {
  listeners.add(callback);
  callback({ isLocked, timeoutMinutes, lastActivityTime });
  return () => {
    listeners.delete(callback);
  };
}
