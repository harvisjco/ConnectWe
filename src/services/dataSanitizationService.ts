import { Person, DataSourceType } from '../types/network';

/**
 * ConnectWe 런타임 방어적 데이터 살균 및 검증 엔진
 * XSS 공격 방어, 전화번호/이메일/URL 정규화 및 인맥 엔티티 무결성 보장
 */

/**
 * 텍스트 내 HTML 태그 및 악성 스크립트 요소를 제거/무력화
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, tag => ({ '<': '&lt;', '>': '&gt;' }[tag] || tag))
    .trim();
}

/**
 * 간단한 HTML 마크업에서 위험 태그 및 인라인 이벤트 핸들러를 정제
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'>]*["']?/gi, 'href="#"')
    .trim();
}

/**
 * 다양한 국내외 전화번호 형식을 한국 표준 하이픈 규격 또는 안전한 번호로 정규화
 * 예: "01012345678" -> "010-1234-5678"
 * 예: "+82 10-1234-5678" -> "010-1234-5678"
 * 예: "021234567" -> "02-123-4567"
 */
export function normalizePhoneNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  
  // 1. 공백 및 특수기호 정리 (숫자와 + 만 보존)
  let cleaned = raw.replace(/[^\d+]/g, '');
  
  // 2. 대한민국 국가코드(+82) 변환
  if (cleaned.startsWith('+82')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('82') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2);
  }

  const digits = cleaned.replace(/\D/g, '');

  // 3. 서울 지역번호 (02)
  if (digits.startsWith('02')) {
    if (digits.length === 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    } else if (digits.length === 10) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
  }

  // 4. 전국 대표번호 (1588, 1577 등 8자리)
  if (digits.length === 8 && /^(15|16|18)\d{2}/.test(digits)) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  // 5. 일반 휴대폰 (010, 011, 016, 017, 018, 019) 및 지방 지역번호 (031, 051 등)
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 6. 매칭되지 않는 규격은 XSS 방어 살균 후 반환
  return sanitizeText(raw);
}

/**
 * 이메일 주소 정제 및 유효성 검사
 */
export function sanitizeEmail(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim().toLowerCase();
  
  // RFC 5322 간소화 정규식
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (emailRegex.test(trimmed)) {
    return trimmed;
  }
  return '';
}

/**
 * URL 프로토콜 안전성 검사 (http, https만 허용)
 */
export function sanitizeUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  
  if (/^https?:\/\//i.test(trimmed)) {
    return encodeURI(decodeURI(trimmed));
  }
  // 프로토콜이 생략된 도메인인 경우 기본 https:// 부여
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${encodeURI(decodeURI(trimmed))}`;
  }
  return '';
}

/**
 * Person 엔티티 전수 런타임 살균 및 기본값 보정 (Crash 방지)
 */
export function validateAndSanitizePerson(raw: Partial<Person>): Person {
  const safeId = sanitizeText(raw.id) || `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const safeName = sanitizeText(raw.name) || '성명 미상';
  const safeCompany = sanitizeText(raw.currentCompany) || '소속 미정';
  const safeTitle = sanitizeText(raw.currentTitle) || '직책 미정';
  const safeDepartment = sanitizeText(raw.currentDepartment) || '';
  
  const safeMobile = normalizePhoneNumber(raw.mobile);
  const safeEmail = sanitizeEmail(raw.email);
  
  // Closeness 친밀도 정규화 (1~5)
  let safeCloseness: 1 | 2 | 3 | 4 | 5 = 3;
  if (typeof raw.closeness === 'number' && [1, 2, 3, 4, 5].includes(raw.closeness)) {
    safeCloseness = raw.closeness as 1 | 2 | 3 | 4 | 5;
  }

  // SourceType 정규화
  const validSourceTypes: DataSourceType[] = ['DART_FACT', 'SOURCE_DATA', 'ESTIMATED'];
  const safeSourceType: DataSourceType = validSourceTypes.includes(raw.sourceType as DataSourceType)
    ? (raw.sourceType as DataSourceType)
    : 'SOURCE_DATA';

  return {
    ...raw,
    id: safeId,
    name: safeName,
    currentCompany: safeCompany,
    currentTitle: safeTitle,
    currentDepartment: safeDepartment,
    mobile: safeMobile,
    email: safeEmail,
    closeness: safeCloseness,
    sourceType: safeSourceType,
    estimatedAgeGroup: raw.estimatedAgeGroup || '40s',
    isAgeEstimated: typeof raw.isAgeEstimated === 'boolean' ? raw.isAgeEstimated : false,
    primaryDomain: sanitizeText(raw.primaryDomain) || 'IT',
    skills: Array.isArray(raw.skills) ? raw.skills.map(s => sanitizeText(s)).filter(Boolean) : [],
    academics: Array.isArray(raw.academics)
      ? raw.academics.map(a => ({
          schoolName: sanitizeText(a.schoolName),
          degree: sanitizeText(a.degree),
          major: sanitizeText(a.major),
          graduationYear: typeof a.graduationYear === 'number' ? a.graduationYear : undefined,
          source: validSourceTypes.includes(a.source) ? a.source : 'SOURCE_DATA'
        }))
      : [],
    careers: Array.isArray(raw.careers)
      ? raw.careers.map((c, idx) => ({
          id: sanitizeText(c.id) || `career-${idx + 1}`,
          companyName: sanitizeText(c.companyName),
          department: sanitizeText(c.department),
          title: sanitizeText(c.title) || '직책 미정',
          startYear: typeof c.startYear === 'number' ? c.startYear : 2020,
          endYear: typeof c.endYear === 'number' ? c.endYear : undefined,
          isCurrent: typeof c.isCurrent === 'boolean' ? c.isCurrent : false,
          source: validSourceTypes.includes(c.source) ? c.source : 'SOURCE_DATA'
        }))
      : [],
    connectionChannel: raw.connectionChannel || 'manual',
    isStale: typeof raw.isStale === 'boolean' ? raw.isStale : false,
    memo: sanitizeText(raw.memo)
  };
}
