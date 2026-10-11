/**
 * ConnectWe 클라이언트 Hash 라우터 & 히스토리 매니저 (RouterService)
 * 
 * 구글 수석 아키텍트 & 애플 UX 헌장 준수:
 * 1. 무결점 브라우저 뒤로가기/앞으로가기 (Back/Forward) 지원 (웹사이트 이탈 차단)
 * 2. 뷰 직결 딥링크 (Deep Linking: #/views/:viewId)
 * 3. 인맥 상세 딥링크 (Deep Linking: #/person/:personId)
 * 4. 제로 의존성 순수 브라우저 History API & hashchange 이벤트 연동
 */

import { NavViewType } from '../components/common/SidebarLNB';

export interface RouteState {
  view: NavViewType;
  personId?: string;
  modal?: string;
}

type RouteListener = (route: RouteState) => void;
const listeners = new Set<RouteListener>();

/**
 * 현재 브라우저 Hash 파싱
 */
export function parseCurrentRoute(): RouteState {
  if (typeof window === 'undefined') {
    return { view: 'command' };
  }

  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) {
    return { view: 'command' };
  }

  // 패턴 1: views/:viewId (예: views/general, views/deals)
  if (hash.startsWith('views/')) {
    const viewId = hash.replace('views/', '') as NavViewType;
    return { view: viewId };
  }

  // 패턴 2: person/:personId (예: person/p_001)
  if (hash.startsWith('person/')) {
    const personId = hash.replace('person/', '');
    return { view: 'command', personId };
  }

  // 패턴 3: 단일 뷰 키워드 (예: command, general, canvas)
  const validViews: NavViewType[] = [
    'command', 'general', 'company', 'orgchart', 'deals',
    'proximity', 'promotion', 'audit', 'age', 'canvas', 'timeline', 'galaxy', 'team'
  ];

  if (validViews.includes(hash as NavViewType)) {
    return { view: hash as NavViewType };
  }

  return { view: 'command' };
}

/**
 * 라우트 변경 및 브라우저 히스토리 푸시
 */
export function navigateTo(view: NavViewType, personId?: string): void {
  if (typeof window === 'undefined') return;

  let newHash = `#/views/${view}`;
  if (personId) {
    newHash = `#/person/${personId}`;
  }

  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
}

/**
 * 전역 라우트 변경 감지 리스너 등록
 */
export function subscribeToRoute(callback: RouteListener): () => void {
  listeners.add(callback);

  // 브라우저 popstate & hashchange 리스너
  const handlePopState = () => {
    const current = parseCurrentRoute();
    listeners.forEach(cb => {
      try {
        cb(current);
      } catch (err) {
        console.error('[RouterService] Error in route listener:', err);
      }
    });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('popstate', handlePopState);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('popstate', handlePopState);
    }
  };
}
