import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getScanQuotaStatus, 
  consumeScanQuota, 
  rechargeCredits, 
  setCustomGeminiApiKey, 
  resetQuotaForTesting 
} from '../quotaBillingService';

describe('quotaBillingService - 무료 쿼터 및 유료 크레딧 과금 시스템 검증', () => {
  beforeEach(() => {
    resetQuotaForTesting();
  });

  it('기본 상태에서 일일 무료 스캔 20회와 웰컴 크레딧 10개가 부여되어야 한다', () => {
    const status = getScanQuotaStatus();
    expect(status.freeScansRemaining).toBe(20);
    expect(status.freeScansLimit).toBe(20);
    expect(status.paidCredits).toBe(10);
    expect(status.customApiKeyActive).toBe(false);
  });

  it('스캔 요청 시 무료 쿼터가 우선 1회 차감되어야 한다', () => {
    const result = consumeScanQuota();
    expect(result.allowed).toBe(true);
    expect(result.mode).toBe('free');
    expect(result.freeRemaining).toBe(19);

    const status = getScanQuotaStatus();
    expect(status.freeScansRemaining).toBe(19);
  });

  it('무료 쿼터 소진 시 유료 크레딧이 1개씩 차감되어야 한다', () => {
    // 20회 무료 소진
    for (let i = 0; i < 20; i++) {
      consumeScanQuota();
    }

    const quotaStatus = getScanQuotaStatus();
    expect(quotaStatus.freeScansRemaining).toBe(0);

    // 21번째 호출: 유료 크레딧 차감
    const paidResult = consumeScanQuota();
    expect(paidResult.allowed).toBe(true);
    expect(paidResult.mode).toBe('paid');
    expect(paidResult.freeRemaining).toBe(0);
    expect(paidResult.creditsRemaining).toBe(9); // 10 -> 9
  });

  it('크레딧 충전 시 정상적으로 잔액이 누적되어야 한다', () => {
    const newTotal = rechargeCredits(50);
    expect(newTotal).toBe(60); // 10 + 50

    const status = getScanQuotaStatus();
    expect(status.paidCredits).toBe(60);
  });

  it('개인 Gemini API Key(BYOK) 등록 시 쿼터 차감 없이 무제한 모드로 동작해야 한다', () => {
    setCustomGeminiApiKey('AIzaSyD-mock-test-gemini-key-12345678');

    const status = getScanQuotaStatus();
    expect(status.customApiKeyActive).toBe(true);
    expect(status.maskedApiKey).toContain('••••');

    const result = consumeScanQuota();
    expect(result.allowed).toBe(true);
    expect(result.mode).toBe('byok');
    expect(result.freeRemaining).toBe(20); // 무료 쿼터 차감 안 됨
  });
});
