import { describe, it, expect, beforeEach, vi } from 'vitest';
import { i18n, t } from '../i18nService';

describe('i18nService - 경량 타입 안전 다국어 엔진 (KO/EN/JA)', () => {
  class MockStorage {
    private store: Record<string, string> = {};
    getItem(key: string): string | null {
      return this.store[key] ?? null;
    }
    setItem(key: string, value: string): void {
      this.store[key] = String(value);
    }
    removeItem(key: string): void {
      delete this.store[key];
    }
    clear(): void {
      this.store = {};
    }
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', new MockStorage());
    i18n.setLocale('ko');
  });

  it('기본 로케일은 한국어(ko)이며 올바른 한국어 텍스트를 반환해야 한다', () => {
    expect(i18n.getLocale()).toBe('ko');
    expect(t('nav.deals')).toBe('비즈니스 파트너십');
    expect(t('kpi.totalPipeline')).toBe('총 파이프라인 규모');
    expect(t('offline.offlineMode')).toBe('오프라인 모드 가동 중');
  });

  it('영어(en)로 로케일을 전환하면 영문 텍스트가 정상 반환되어야 한다', () => {
    i18n.setLocale('en');
    expect(i18n.getLocale()).toBe('en');
    expect(t('nav.deals')).toBe('Partnerships');
    expect(t('kpi.totalPipeline')).toBe('Total Pipeline Volume');
    expect(t('offline.offlineMode')).toBe('Offline Mode Active');
  });

  it('일본어(ja)로 로케일을 전환하면 일문 텍스트가 정상 반환되어야 한다', () => {
    i18n.setLocale('ja');
    expect(i18n.getLocale()).toBe('ja');
    expect(t('nav.deals')).toBe('パートナーシップ');
    expect(t('kpi.totalPipeline')).toBe('総案件パイプライン');
    expect(t('offline.offlineMode')).toBe('オフライン稼働中');
  });

  it('존재하지 않는 키를 요청하면 원본 키를 반환하고 충돌하지 않아야 한다 (Fail-Safe)', () => {
    expect(t('non.existent.key')).toBe('non.existent.key');
  });

  it('로케일 변경 시 구독자(Subscriber)에게 변경 이벤트가 통지되어야 한다', () => {
    let notifiedLocale = '';
    const unsubscribe = i18n.subscribe((loc) => {
      notifiedLocale = loc;
    });

    i18n.setLocale('en');
    expect(notifiedLocale).toBe('en');

    unsubscribe();
    i18n.setLocale('ja');
    expect(notifiedLocale).toBe('en'); // 구독 해제 후 갱신 안 됨
  });
});
