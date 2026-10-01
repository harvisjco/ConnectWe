import { describe, it, expect, beforeEach } from 'vitest';
import { scanCardWithGeminiVision } from '../geminiVisionOcrService';
import { resetQuotaForTesting } from '../quotaBillingService';

describe('geminiVisionOcrService - Vision AI 및 하이브리드 폴백 파이프라인 검증', () => {
  beforeEach(() => {
    resetQuotaForTesting();
  });

  it('API Key가 없거나 오프라인 상태에서도 온디바이스 로컬 파서로 안전하게 대체되어야 한다', async () => {
    const mockFile = new File(['mock content'], 'nextvision_business_card.jpg', { type: 'image/jpeg' });
    const result = await scanCardWithGeminiVision(mockFile);

    expect(result).toBeDefined();
    expect(result.data.name).toBe('박서준');
    expect(result.data.currentCompany).toContain('넥스트비전');
    expect(result.engine).toBe('local_heuristic');
    expect(result.isFallback).toBe(true);
    expect(result.executionMode).toBe('free');
  });

  it('다양한 명함 파일(카카오모빌리티 등)도 하이브리드 파이프라인에서 정상 파싱되어야 한다', async () => {
    const mockFile = new File(['mock content'], 'remember_vertical_kakaomobility.jpg', { type: 'image/jpeg' });
    const result = await scanCardWithGeminiVision(mockFile);

    expect(result.data.name).toBe('홍길동');
    expect(result.data.englishName).toBe('Michael Hong');
    expect(result.data.currentCompany).toBe('카카오모빌리티');
    expect(result.data.currentDepartment).toBe('기술기획팀');
  });
});
