import React, { useMemo } from 'react';

export interface ConfidentialWatermarkLayerProps {
  userName?: string;
  userEmail?: string;
  clientIp?: string;
  watermarkText?: string;
  opacity?: number;
  className?: string;
  isFixed?: boolean;
}

/**
 * 대외비 화면(미팅 브리프, 조직도, 대외비 인맥) 스크린샷 유출 방지용 동적 워터마크 레이어
 * 사용자 인터랙션(클릭, 드래그, 텍스트 선택)을 전혀 방해하지 않음 (pointer-events-none)
 */
export const ConfidentialWatermarkLayer: React.FC<ConfidentialWatermarkLayerProps> = ({
  userName = 'Executive User',
  userEmail = 'executive@connectwe.io',
  clientIp = '127.0.0.***',
  watermarkText = '대외비 STRICTLY CONFIDENTIAL',
  opacity = 0.05,
  className = '',
  isFixed = false
}) => {
  const timestamp = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }, []);

  const fullLabel = `${watermarkText} · ${userName} (${userEmail}) · ${clientIp} · ${timestamp}`;

  // SVG 사선 패턴 생성
  const svgPattern = useMemo(() => {
    const encodedText = encodeURIComponent(fullLabel);
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="380" height="240"><text x="20" y="140" fill="%23475569" font-family="monospace, sans-serif" font-size="11" font-weight="600" opacity="${opacity}" transform="rotate(-28 190 120)">${encodedText}</text></svg>`;
  }, [fullLabel, opacity]);

  const containerPosition = isFixed ? 'fixed inset-0 z-40' : 'absolute inset-0 z-10 pointer-events-none';

  return (
    <div
      data-testid="confidential-watermark-layer"
      className={`pointer-events-none select-none overflow-hidden ${containerPosition} ${className}`}
      style={{
        backgroundImage: `url("${svgPattern}")`,
        backgroundRepeat: 'repeat'
      }}
      aria-hidden="true"
    />
  );
};
