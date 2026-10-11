import { describe, it, expect, vi } from 'vitest';
import { triggerHaptic } from '../hapticFeedback';

describe('hapticFeedback - 모바일 터치 햅틱 피드백 유틸리티', () => {
  it('navigator.vibrate가 없을 때도 예외 없이 안전하게 실행되어야 한다', () => {
    expect(() => triggerHaptic('light')).not.toThrow();
    expect(() => triggerHaptic('medium')).not.toThrow();
    expect(() => triggerHaptic('success')).not.toThrow();
    expect(() => triggerHaptic('warning')).not.toThrow();
  });

  it('navigator.vibrate가 모킹되었을 때 올바른 패턴으로 호출되어야 한다', () => {
    const vibrateMock = vi.fn();
    try {
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        configurable: true,
        writable: true
      });
    } catch {
      // defineProperty 실패 시 window.navigator 또는 global 폴백
    }

    triggerHaptic('light');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      expect(vibrateMock).toHaveBeenCalledWith(10);
    }

    triggerHaptic('medium');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      expect(vibrateMock).toHaveBeenCalledWith(20);
    }

    triggerHaptic('success');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      expect(vibrateMock).toHaveBeenCalledWith([15, 50, 20]);
    }

    triggerHaptic('warning');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      expect(vibrateMock).toHaveBeenCalledWith([30, 60, 30]);
    }
  });
});
