/**
 * ConnectWe 전역 모달 ESC 스택 및 포커스 복원 매니저 (ModalStackManager)
 * 
 * 애플 수석 디자이너 & WAI-ARIA 접근성 헌장 준수:
 * 1. 중첩 모달(Modal A 위에 Modal B) 열림 시 ESC 키 누르면 최상위 모달만 단일 닫기 (동시 닫힘 차단)
 * 2. 모달 오픈 시 이전 액티브 엘리먼트 기억 후 닫힐 때 원위치 포커스 자동 복귀
 * 3. 모달 배경 스크롤 락 (Body Scroll Lock) 자동 관리
 */

interface ModalEntry {
  id: string;
  onClose: () => void;
  returnFocusElement?: HTMLElement | null;
}

const modalStack: ModalEntry[] = [];

/**
 * 모달 스택 등록
 */
export function registerModal(id: string, onClose: () => void): () => void {
  const returnFocusElement = typeof document !== 'undefined' 
    ? (document.activeElement as HTMLElement | null) 
    : null;

  modalStack.push({ id, onClose, returnFocusElement });
  updateBodyScrollLock();

  return () => {
    unregisterModal(id);
  };
}

/**
 * 모달 스택 해제
 */
export function unregisterModal(id: string): void {
  const idx = modalStack.findIndex(m => m.id === id);
  if (idx !== -1) {
    const entry = modalStack[idx];
    modalStack.splice(idx, 1);
    updateBodyScrollLock();

    // 포커스 복원
    if (entry.returnFocusElement && typeof entry.returnFocusElement.focus === 'function') {
      try {
        entry.returnFocusElement.focus();
      } catch {
        // Ignore focus error
      }
    }
  }
}

/**
 * 최상위 모달 닫기 (ESC 키 트리거용)
 */
export function closeTopModal(): boolean {
  if (modalStack.length === 0) return false;
  const top = modalStack[modalStack.length - 1];
  top.onClose();
  return true;
}

/**
 * 현재 열려있는 모달 개수
 */
export function getOpenModalCount(): number {
  return modalStack.length;
}

/**
 * 스택 전체 초기화 (테스트용)
 */
export function clearModalStack(): void {
  modalStack.length = 0;
  updateBodyScrollLock();
}

/**
 * Body 스크롤 락 제어
 */
function updateBodyScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (modalStack.length > 0) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}
