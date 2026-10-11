import { describe, it, expect, beforeEach } from 'vitest';
import { parseCurrentRoute, navigateTo, subscribeToRoute } from '../routerService';

describe('routerService - 클라이언트 Hash 라우팅 및 뒤로가기 매니저 검증', () => {
  let eventListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    eventListeners = {};
    (globalThis as any).window = {
      location: {
        hash: ''
      },
      addEventListener: (type: string, cb: Function) => {
        if (!eventListeners[type]) eventListeners[type] = [];
        eventListeners[type].push(cb);
      },
      removeEventListener: (type: string, cb: Function) => {
        if (eventListeners[type]) {
          eventListeners[type] = eventListeners[type].filter(f => f !== cb);
        }
      },
      dispatchEvent: (event: any) => {
        const cbs = eventListeners[event.type || 'hashchange'] || [];
        cbs.forEach(cb => cb(event));
        return true;
      }
    };
  });

  it('1. 빈 해시일 경우 기본 command 뷰를 반환해야 한다', () => {
    window.location.hash = '';
    const route = parseCurrentRoute();
    expect(route.view).toBe('command');
  });

  it('2. views/:viewId 해시를 정확하게 파싱해야 한다', () => {
    window.location.hash = '#/views/general';
    expect(parseCurrentRoute().view).toBe('general');

    window.location.hash = '#/views/orgchart';
    expect(parseCurrentRoute().view).toBe('orgchart');
  });

  it('3. person/:personId 해시를 파싱하여 인맥 ID를 추출해야 한다', () => {
    window.location.hash = '#/person/p_007';
    const route = parseCurrentRoute();
    expect(route.personId).toBe('p_007');
  });

  it('4. navigateTo 호출 시 window.location.hash가 올바르게 업데이트되어야 한다', () => {
    navigateTo('deals');
    expect(window.location.hash).toBe('#/views/deals');

    navigateTo('general', 'p_test');
    expect(window.location.hash).toBe('#/person/p_test');
  });

  it('5. 라우트 구독 및 이벤트 디스패치가 정상 동작해야 한다', () => {
    let notifiedView = '';
    const unsubscribe = subscribeToRoute((route) => {
      notifiedView = route.view;
    });

    window.location.hash = '#/views/canvas';
    (window as any).dispatchEvent({ type: 'hashchange' });

    expect(notifiedView).toBe('canvas');
    unsubscribe();
  });
});
