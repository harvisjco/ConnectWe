import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeHtml,
  normalizePhoneNumber,
  sanitizeEmail,
  sanitizeUrl,
  validateAndSanitizePerson
} from '../dataSanitizationService';

describe('dataSanitizationService - 런타임 방어적 데이터 살균 및 검증 테스트', () => {
  describe('sanitizeText', () => {
    it('스크립트 태그 및 위험 이벤트 핸들러를 안전하게 제거하고 엔티티를 이스케이프해야 한다', () => {
      const malicious = '<script>alert("xss")</script>홍길동<iframe src="evil.com"></iframe>';
      const clean = sanitizeText(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<iframe');
      expect(clean).toBe('홍길동');
    });

    it('javascript: 스킴 및 인라인 핸들러를 차단해야 한다', () => {
      const payload = 'javascript:void(0); onclick=stealCookies() 이사';
      const clean = sanitizeText(payload);
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('onclick=');
      expect(clean).toContain('이사');
    });

    it('null 또는 undefined 입력 시 안전하게 빈 문자열을 반환해야 한다 (Crash 방지)', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('안전한 HTML 태그는 보존하고 악성 스크립트 태그는 제거해야 한다', () => {
      const html = '<p>안전한 본문</p><script>alert("xss")</script><a href="javascript:void(0)">클릭</a>';
      const clean = sanitizeHtml(html);
      expect(clean).toContain('<p>안전한 본문</p>');
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('javascript:');
    });
  });

  describe('normalizePhoneNumber', () => {
    it('하이픈 없는 11자리 휴대전화 번호를 010-XXXX-XXXX 형식으로 정규화해야 한다', () => {
      expect(normalizePhoneNumber('01012345678')).toBe('010-1234-5678');
      expect(normalizePhoneNumber('010 9876 5432')).toBe('010-9876-5432');
    });

    it('대한민국 국가코드(+82)가 포함된 번호를 표준 010 형식으로 변환해야 한다', () => {
      expect(normalizePhoneNumber('+82-10-1234-5678')).toBe('010-1234-5678');
      expect(normalizePhoneNumber('+821099998888')).toBe('010-9999-8888');
    });

    it('서울 지역번호(02) 유선전화를 올바른 하이픈 형식으로 정규화해야 한다', () => {
      expect(normalizePhoneNumber('021234567')).toBe('02-123-4567');
      expect(normalizePhoneNumber('0212345678')).toBe('02-1234-5678');
    });

    it('전국 대표번호(1588, 1577 등)를 4-4자리로 정규화해야 한다', () => {
      expect(normalizePhoneNumber('15881234')).toBe('1588-1234');
    });
  });

  describe('sanitizeEmail', () => {
    it('유효한 이메일을 소문자 정규화하고 양쪽 공백을 제거해야 한다', () => {
      expect(sanitizeEmail('  CEO.Hong@Company.COM ')).toBe('ceo.hong@company.com');
    });

    it('형식이 올바르지 않은 이메일은 빈 문자열로 살균 처리해야 한다', () => {
      expect(sanitizeEmail('invalid-email-string')).toBe('');
      expect(sanitizeEmail('ceo@com')).toBe('ceo@com');
      expect(sanitizeEmail('@company.com')).toBe('');
      expect(sanitizeEmail(null)).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('안전한 http 및 https URL을 보존해야 한다', () => {
      expect(sanitizeUrl('https://example.com/profile')).toBe('https://example.com/profile');
      expect(sanitizeUrl('http://connectwe.io')).toBe('http://connectwe.io');
    });

    it('프로토콜이 생략된 도메인에 https://를 자동으로 부여해야 한다', () => {
      expect(sanitizeUrl('naver.com')).toBe('https://naver.com');
      expect(sanitizeUrl('company.co.kr/about')).toBe('https://company.co.kr/about');
    });

    it('javascript: 또는 data: 등의 악성 스킴은 차단해야 한다', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });
  });

  describe('validateAndSanitizePerson', () => {
    it('불완전하고 잠재적 악성 코드가 포함된 원시 Person 객체를 안전하게 살균 보정해야 한다', () => {
      const rawPerson = {
        name: '<script>alert("hacked")</script>이재용',
        currentCompany: '삼성전자 <iframe src="evil.com"></iframe>',
        currentTitle: '회장',
        mobile: '+82 10 1111 2222',
        email: '  Lee.JY@SAMSUNG.COM ',
        closeness: 99 as any, // 유효하지 않은 친밀도
        memo: '대외비 메모 <script>steal()</script>'
      };

      const clean = validateAndSanitizePerson(rawPerson);

      expect(clean.name).toBe('이재용');
      expect(clean.currentCompany).toBe('삼성전자');
      expect(clean.currentTitle).toBe('회장');
      expect(clean.mobile).toBe('010-1111-2222');
      expect(clean.email).toBe('lee.jy@samsung.com');
      expect(clean.closeness).toBe(3); // 기본 친밀도로 안전하게 폴백
      expect(clean.memo).toBe('대외비 메모');
      expect(clean.sourceType).toBe('SOURCE_DATA');
      expect(clean.isStale).toBe(false);
    });
  });
});
