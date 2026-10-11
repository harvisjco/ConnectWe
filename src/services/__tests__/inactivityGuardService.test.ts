import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getInactivityState, 
  lockAppManually, 
  unlockApp, 
  setInactivityTimeout, 
  recordUserActivity,
  subscribeToInactivity 
} from '../inactivityGuardService';

describe('inactivityGuardService - 엔터프라이즈 화면 무활동 자동 잠금 서비스 검증', () => {
  beforeEach(() => {
    unlockApp();
    setInactivityTimeout(15);
  });

  it('1. 초기 상태에서는 잠금 해제 상태여야 한다', () => {
    const state = getInactivityState();
    expect(state.isLocked).toBe(false);
    expect(state.timeoutMinutes).toBe(15);
  });

  it('2. 수동 잠금(lockAppManually) 호출 시 잠금 상태로 전이되어야 한다', () => {
    lockAppManually();
    expect(getInactivityState().isLocked).toBe(true);

    unlockApp();
    expect(getInactivityState().isLocked).toBe(false);
  });

  it('3. 타임아웃 시간 변경이 정상 반영되어야 한다', () => {
    setInactivityTimeout(30);
    expect(getInactivityState().timeoutMinutes).toBe(30);
  });

  it('4. 사용자 활동 기록 시 lastActivityTime이 최신 시간으로 갱신되어야 한다', () => {
    const prevTime = getInactivityState().lastActivityTime;
    recordUserActivity();
    const newTime = getInactivityState().lastActivityTime;
    expect(newTime).toBeGreaterThanOrEqual(prevTime);
  });

  it('5. 상태 변경 시 구독 리스너에게 통지되어야 한다', () => {
    let notifyCount = 0;
    const unsubscribe = subscribeToInactivity((_state) => {
      notifyCount++;
    });

    lockAppManually();
    expect(notifyCount).toBeGreaterThan(1);
    unsubscribe();
  });
});
