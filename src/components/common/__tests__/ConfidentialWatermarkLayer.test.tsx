import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ConfidentialWatermarkLayer } from '../ConfidentialWatermarkLayer';

describe('ConfidentialWatermarkLayer - 대외비 스크린샷 방어 워터마크 레이어 검증', () => {
  it('포인터 이벤트 차단 및 사용자 선택 방지 스타일이 적용된 워터마크 컨테이너를 렌더링해야 한다', () => {
    const html = renderToString(
      <ConfidentialWatermarkLayer
        userName="이재용"
        userEmail="lee@samsung.com"
        watermarkText="극비 대외비"
      />
    );

    expect(html).toContain('data-testid="confidential-watermark-layer"');
    expect(html).toContain('pointer-events-none');
    expect(html).toContain('select-none');
    // SVG 패턴 내부 인코딩된 텍스트 확인
    expect(html).toContain(encodeURIComponent('이재용'));
    expect(html).toContain(encodeURIComponent('극비 대외비'));
  });

  it('isFixed=true 설정 시 fixed inset-0 z-40 클래스를 적용해야 한다', () => {
    const html = renderToString(
      <ConfidentialWatermarkLayer isFixed={true} />
    );

    expect(html).toContain('fixed inset-0 z-40');
  });
});
