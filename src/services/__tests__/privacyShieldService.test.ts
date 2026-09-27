import { describe, it, expect } from 'vitest';
import { 
  maskName, 
  maskPhone, 
  maskEmail, 
  maskCompany, 
  maskMemo, 
  maskPerson 
} from '../privacyShieldService';
import { Person } from '../../types/network';

describe('privacyShieldService - VIP 프라이버시 쉴드 모드 검증', () => {
  const dummyPerson: Person = {
    id: 'test-person-1',
    name: '홍길동',
    currentCompany: '원티드랩',
    currentTitle: '부사장',
    currentDepartment: '전략기획실',
    mobile: '010-1234-5678',
    email: 'kildong.hong@wantedlab.com',
    sourceType: 'DART_FACT',
    closeness: 3,
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '경영 전략',
    skills: ['전략', '투자'],
    careers: [],
    academics: [],
    connectionChannel: 'dart',
    isStale: false,
    memo: '극비 전략 제휴 및 M&A 논의 중인 C-Level 인사',
  };

  describe('maskName', () => {
    it('쉴드가 비활성화되어 있으면 원본 이름을 그대로 반환해야 한다', () => {
      expect(maskName('홍길동', false)).toBe('홍길동');
      expect(maskName('Alexander', false)).toBe('Alexander');
    });

    it('2글자 이름은 두 번째 글자가 마스킹되어야 한다', () => {
      expect(maskName('김철', true)).toBe('김*');
    });

    it('3글자 이름은 가운데 글자가 마스킹되어야 한다', () => {
      expect(maskName('홍길동', true)).toBe('홍*동');
      expect(maskName('이재용', true)).toBe('이*용');
    });

    it('4글자 이상 및 외국인 이름은 첫 글자와 끝 글자를 제외하고 마스킹되어야 한다', () => {
      expect(maskName('남궁민수', true)).toBe('남**수');
      expect(maskName('Alexander', true)).toBe('A*******r');
    });

    it('빈 문자열이나 1글자는 안전하게 처리되어야 한다', () => {
      expect(maskName('', true)).toBe('');
      expect(maskName('김', true)).toBe('김');
    });
  });

  describe('maskPhone', () => {
    it('쉴드가 비활성화되어 있으면 원본 전화번호를 그대로 반환해야 한다', () => {
      expect(maskPhone('010-1234-5678', false)).toBe('010-1234-5678');
    });

    it('11자리 번호는 가운데 4자리가 마스킹되어야 한다', () => {
      expect(maskPhone('010-1234-5678', true)).toBe('010-****-5678');
      expect(maskPhone('01012345678', true)).toBe('010-****-5678');
    });
  });

  describe('maskEmail', () => {
    it('쉴드가 비활성화되어 있으면 원본 이메일을 그대로 반환해야 한다', () => {
      expect(maskEmail('ceo@connectwe.io', false)).toBe('ceo@connectwe.io');
    });

    it('이메일의 로컬 파트 첫 글자를 제외하고 마스킹되어야 한다', () => {
      const masked = maskEmail('founder@connectwe.io', true);
      expect(masked).toBe('f******@connectwe.io');
    });
  });

  describe('maskCompany', () => {
    it('쉴드가 비활성화되어 있으면 원본 회사명을 그대로 반환해야 한다', () => {
      expect(maskCompany('삼성전자', false)).toBe('삼성전자');
    });

    it('회사명이 안전하게 마스킹되어야 한다', () => {
      expect(maskCompany('원티드랩', true)).toBe('원티**');
      expect(maskCompany('네이버', true)).toBe('네*버');
      expect(maskCompany('SK텔레콤', true)).toBe('SK**콤');
    });
  });

  describe('maskMemo', () => {
    it('쉴드가 비활성화되어 있으면 원본 메모를 그대로 반환해야 한다', () => {
      expect(maskMemo('비공개 미팅 메모', false)).toBe('비공개 미팅 메모');
    });

    it('쉴드가 활성화되어 있으면 대외비 엠바고 보호 문구로 대체되어야 한다', () => {
      const masked = maskMemo('극비 M&A 검토 중', true);
      expect(masked).toContain('대외비 엠바고 보호 중');
    });
  });

  describe('maskPerson', () => {
    it('쉴드가 비활성화되어 있으면 원본 Person 객체를 그대로 반환해야 한다', () => {
      const result = maskPerson(dummyPerson, false);
      expect(result.name).toBe('홍길동');
      expect(result.mobile).toBe('010-1234-5678');
    });

    it('쉴드가 활성화되어 있으면 PII 필드가 안전하게 마스킹되고 ID는 보존되어야 한다', () => {
      const result = maskPerson(dummyPerson, true);
      expect(result.id).toBe(dummyPerson.id);
      expect(result.name).toBe('홍*동');
      expect(result.mobile).toBe('010-****-5678');
      expect(result.email).toBe('k***********@wantedlab.com');
      expect(result.memo).toContain('대외비 엠바고 보호 중');
    });
  });
});
