import { describe, it, expect } from 'vitest';
import { preprocessCardImage } from '../imagePreprocessor';

describe('imagePreprocessor - 온디바이스 명함 이미지 전처리 파이프라인 검증', () => {
  it('File 객체를 받아 안전하게 Base64 데이터 및 메타데이터를 반환해야 한다', async () => {
    const dummyBlob = new Blob(['mock binary image data'], { type: 'image/jpeg' });
    const mockFile = new File([dummyBlob], 'test_card.jpg', { type: 'image/jpeg' });

    const result = await preprocessCardImage(mockFile, {
      maxWidth: 1024,
      maxHeight: 1024,
      contrastBoost: 1.25,
      sharpen: true
    });

    expect(result).toBeDefined();
    expect(result.base64Data).toContain('data:image/');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('기본 옵션이 제공되지 않아도 기본 파라미터로 정상 동작해야 한다', async () => {
    const mockFile = new File(['simple mock content'], 'card.png', { type: 'image/png' });
    const result = await preprocessCardImage(mockFile);

    expect(result.base64Data).toBeTruthy();
    expect(result.processedSize).toBeGreaterThan(0);
  });
});
