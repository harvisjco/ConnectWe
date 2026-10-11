import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  pushToast, 
  dismissToast, 
  clearAllToasts, 
  getActiveToasts, 
  subscribeToToasts 
} from '../toastQueueService';

describe('toastQueueService - 엔터프라이즈 멀티 토스트 큐 검증', () => {
  beforeEach(() => {
    clearAllToasts();
    vi.useFakeTimers();
  });

  it('1. 토스트가 큐에 추가되고 정상 조회되어야 한다', () => {
    pushToast('첫 번째 알림', 'info', 3000);
    const active = getActiveToasts();

    expect(active.length).toBe(1);
    expect(active[0].message).toBe('첫 번째 알림');
    expect(active[0].type).toBe('info');
  });

  it('2. 최대 3개까지만 화면에 노출되고 FIFO로 유지되어야 한다', () => {
    pushToast('메시지 1');
    pushToast('메시지 2');
    pushToast('메시지 3');
    pushToast('메시지 4');

    const active = getActiveToasts();
    expect(active.length).toBe(3);
    expect(active.map(t => t.message)).toEqual(['메시지 2', '메시지 3', '메시지 4']);
  });

  it('3. 지정된 TTL 경과 시 토스트가 자동으로 제거되어야 한다', () => {
    pushToast('일시적 알림', 'success', 2000);
    expect(getActiveToasts().length).toBe(1);

    vi.advanceTimersByTime(2100);
    expect(getActiveToasts().length).toBe(0);
  });

  it('4. 수동으로 토스트를 닫을 수 있어야 한다', () => {
    const id = pushToast('수동 닫기 테스트');
    expect(getActiveToasts().length).toBe(1);

    dismissToast(id);
    expect(getActiveToasts().length).toBe(0);
  });

  it('5. 구독자에게 큐 변경이 실시간 통지되어야 한다', () => {
    let callCount = 0;
    const unsubscribe = subscribeToToasts((_items) => {
      callCount++;
    });

    pushToast('새로운 소식');
    expect(callCount).toBeGreaterThan(1);
    unsubscribe();
  });
});
