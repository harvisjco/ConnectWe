import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  registerModal, 
  closeTopModal, 
  getOpenModalCount, 
  clearModalStack 
} from '../modalStackManager';

describe('modalStackManager - 전역 모달 ESC 스택 및 포커스 복원 매니저 검증', () => {
  beforeEach(() => {
    clearModalStack();
  });

  it('1. 모달 등록 및 해제 시 스택 카운트가 정확히 변해야 한다', () => {
    const close1 = vi.fn();
    const unregister1 = registerModal('modal_1', close1);
    expect(getOpenModalCount()).toBe(1);

    const close2 = vi.fn();
    const unregister2 = registerModal('modal_2', close2);
    expect(getOpenModalCount()).toBe(2);

    unregister2();
    expect(getOpenModalCount()).toBe(1);

    unregister1();
    expect(getOpenModalCount()).toBe(0);
  });

  it('2. closeTopModal 호출 시 가장 최상단(마지막) 모달의 닫기 콜백만 실행되어야 한다', () => {
    const close1 = vi.fn();
    const close2 = vi.fn();

    registerModal('parent_modal', close1);
    registerModal('child_modal', close2);

    const result = closeTopModal();
    expect(result).toBe(true);
    expect(close2).toHaveBeenCalledTimes(1);
    expect(close1).not.toHaveBeenCalled();
  });

  it('3. 스택이 비어있을 때 closeTopModal 호출 시 false를 반환해야 한다', () => {
    const result = closeTopModal();
    expect(result).toBe(false);
  });
});
