import { describe, it, expect } from 'vitest';
import { simulateExtractCardTextFromImage, parseBusinessCardText } from '../cardOcrParser';

describe('cardOcrParser - 가상 명함 이미지 OCR 및 인맥 자동 등록 검증', () => {
  it('생성된 가상 명함 파일(nextvision_business_card.jpg)에서 텍스트를 정확하게 추출해야 한다', async () => {
    const mockFile = new File(['mock content'], 'nextvision_business_card.jpg', { type: 'image/jpeg' });
    const rawText = await simulateExtractCardTextFromImage(mockFile);

    expect(rawText).toContain('주식회사 넥스트비전 AI');
    expect(rawText).toContain('박서준');
    expect(rawText).toContain('3849-2910');
    expect(rawText).toContain('seojun.park@nextvision.ai');
  });

  it('추출된 명함 텍스트를 정밀하게 파싱하여 인맥 정보로 구조화해야 한다', async () => {
    const mockFile = new File(['mock content'], 'nextvision_business_card.jpg', { type: 'image/jpeg' });
    const rawText = await simulateExtractCardTextFromImage(mockFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('박서준');
    expect(parsed.currentCompany).toContain('넥스트비전');
    expect(parsed.mobile).toBe('010-3849-2910');
    expect(parsed.email).toBe('seojun.park@nextvision.ai');
    expect(parsed.currentTitle).toMatch(/(최고기술책임자|CTO|전무이사|이사|대표이사)/);
  });

  it('일반 명함 파일도 안전하게 폴백 파싱할 수 있어야 한다', async () => {
    const fallbackFile = new File(['mock content'], 'general_card.png', { type: 'image/png' });
    const rawText = await simulateExtractCardTextFromImage(fallbackFile);
    const parsed = parseBusinessCardText(rawText);

    expect(parsed.name).toBe('김도현');
    expect(parsed.currentCompany).toContain('하이퍼네트웍스');
    expect(parsed.mobile).toBe('010-8923-4512');
  });
});
