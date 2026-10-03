import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  computeCardFingerprint, 
  getCachedOcrResult, 
  cacheOcrResult, 
  clearOcrCache, 
  getOcrCacheStats 
} from '../cardOcrCache';
import { GeminiScanResult } from '../geminiVisionOcrService';

describe('cardOcrCache Engine', () => {
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
    clearOcrCache();
  });

  const mockResult: GeminiScanResult = {
    data: {
      name: '홍길동',
      currentCompany: '테크파트너스',
      currentTitle: 'CTO',
      mobile: '010-1234-5678',
      email: 'hong@tech.com',
      primaryDomain: '경영/전략',
      rawText: '테크파트너스 홍길동 CTO\n010-1234-5678',
    },
    engine: 'local_heuristic',
    executionMode: 'free',
    quotaMessage: '정상 처리',
    isFallback: false
  };

  it('동일한 문자열 및 파일 입력에 대해 일관된 지문(Fingerprint)을 생성한다', async () => {
    const fp1 = await computeCardFingerprint('test-card-content-1');
    const fp2 = await computeCardFingerprint('test-card-content-1');
    const fp3 = await computeCardFingerprint('test-card-content-2');

    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fp3);
    expect(fp1).toContain('card_');
  });

  it('캐시 저장 후 조회 시 0 토큰 복원 메시지와 함께 결과를 반환한다', async () => {
    const fp = await computeCardFingerprint('hong-card-data');
    expect(getCachedOcrResult(fp)).toBeNull();

    cacheOcrResult(fp, mockResult);
    const cached = getCachedOcrResult(fp);

    expect(cached).not.toBeNull();
    expect(cached?.data.name).toBe('홍길동');
    expect(cached?.quotaMessage).toContain('0개');
  });

  it('clearOcrCache 호출 시 모든 캐시가 안전하게 초기화된다', async () => {
    const fp = await computeCardFingerprint('sample-card');
    cacheOcrResult(fp, mockResult);
    expect(getOcrCacheStats().count).toBe(1);

    clearOcrCache();
    expect(getOcrCacheStats().count).toBe(0);
    expect(getCachedOcrResult(fp)).toBeNull();
  });
});
