/**
 * ConnectWe 모바일 햅틱 피드백 유틸리티
 * Web Vibration API를 활용하여 터치 상호작용 시 미세한 진동 피드백을 제공합니다.
 */

export type HapticType = 
  | 'selection' 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'drag_start' 
  | 'drag_drop' 
  | 'pin' 
  | 'success' 
  | 'warning' 
  | 'error';

export function triggerHaptic(type: HapticType = 'light'): void {
  try {
    const nav = typeof window !== 'undefined' && window.navigator 
      ? window.navigator 
      : (typeof globalThis !== 'undefined' && (globalThis as any).navigator 
          ? (globalThis as any).navigator 
          : null);

    if (nav && typeof nav.vibrate === 'function') {
      switch (type) {
        case 'selection':
          nav.vibrate(8);
          break;
        case 'light':
          nav.vibrate(10);
          break;
        case 'medium':
          nav.vibrate(20);
          break;
        case 'heavy':
          nav.vibrate(35);
          break;
        case 'drag_start':
          nav.vibrate(12);
          break;
        case 'drag_drop':
          nav.vibrate([15, 30, 20]);
          break;
        case 'pin':
          nav.vibrate([10, 40, 15]);
          break;
        case 'success':
          nav.vibrate([15, 50, 20]);
          break;
        case 'warning':
          nav.vibrate([30, 60, 30]);
          break;
        case 'error':
          nav.vibrate([40, 80, 40, 80, 50]);
          break;
      }
    }
  } catch {
    // 진동을 지원하지 않거나 권한이 없는 환경에서는 조용히 무시 (우아한 폴백)
  }
}
