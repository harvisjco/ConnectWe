import { useEffect, useRef } from 'react';
import { registerModal, closeTopModal } from '../services/modalStackManager';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
].join(', ');

/**
 * WAI-ARIA 규격 모달 포커스 트랩(Focus Trap) & ESC 닫기 훅
 * 
 * @param modalId 고유 모달 식별자
 * @param isOpen 모달 열림 여부
 * @param onClose 닫기 콜백
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  modalId: string,
  isOpen: boolean,
  onClose: () => void
) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. 모달 스택 등록 및 원위치 포커스 복원 준비
    const unregister = registerModal(modalId, onClose);

    // 2. 모달 내 첫 번째 focusable 요소로 자동 포커스
    const focusFirstElement = () => {
      if (!containerRef.current) return;
      const focusables = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        containerRef.current.focus();
      }
    };

    const timer = setTimeout(focusFirstElement, 50);

    // 3. 키보드 리스너 (Tab 순환 및 ESC 스택 닫기)
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 키 처리 (최상단 모달만 단일 닫기)
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeTopModal();
        return;
      }

      // Tab 키 포커스 순환
      if (e.key === 'Tab') {
        if (!containerRef.current) return;

        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(el => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: 첫 번째 요소에서 뒤로 가면 마지막 요소로
          if (document.activeElement === first || !containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: 마지막 요소에서 앞으로 가면 첫 번째 요소로
          if (document.activeElement === last || !containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
      unregister();
    };
  }, [modalId, isOpen, onClose]);

  return containerRef;
}
