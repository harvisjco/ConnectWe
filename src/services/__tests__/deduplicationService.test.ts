import { describe, it, expect } from 'vitest';
import { 
  findDuplicatePerson, 
  mergePersonProfiles, 
  normalizePhoneNumber, 
  normalizeEmail 
} from '../deduplicationService';
import { Person } from '../../types/network';
import { INITIAL_PEOPLE_SEED } from '../../data/mockNetworkData';

describe('deduplicationService - 스마트 중복 감지 및 이력 보존 병합 엔진 검증', () => {
  const basePerson: Person = {
    ...INITIAL_PEOPLE_SEED[0],
    id: 'p_origin_1',
    name: '김도진',
    currentCompany: '삼성전자',
    currentTitle: '부사장',
    currentDepartment: '반도체 사업부',
    mobile: '010-1234-5678',
    email: 'dj.kim@samsung.com',
    skills: ['HBM', 'AI 반도체'],
    tags: ['삼성', '임원'],
    careers: [],
    memo: '반도체 총괄 리더'
  };

  const pool: Person[] = [basePerson];

  it('1. 전화번호 정규화 및 이메일 정규화가 정확히 동작해야 한다', () => {
    expect(normalizePhoneNumber('+82 10-1234-5678')).toBe('01012345678');
    expect(normalizePhoneNumber('010.1234.5678')).toBe('01012345678');
    expect(normalizeEmail('  DJ.Kim@Samsung.COM  ')).toBe('dj.kim@samsung.com');
  });

  it('2. 동일한 휴대폰 번호의 신규 명함 입력 시 99% 신뢰도로 중복을 감지해야 한다', () => {
    const incoming: Partial<Person> = {
      name: '김도진',
      mobile: '010-1234-5678',
      currentCompany: 'SK하이닉스',
      currentTitle: '사장'
    };

    const result = findDuplicatePerson(incoming, pool);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchReason).toBe('PHONE_MATCH');
    expect(result.confidenceScore).toBe(99);
    expect(result.matchedPerson?.id).toBe('p_origin_1');
  });

  it('3. 동일한 이메일 입력 시 95% 신뢰도로 중복을 감지해야 한다', () => {
    const incoming: Partial<Person> = {
      name: '도진 김',
      email: 'dj.kim@samsung.com',
      mobile: '010-9999-0000'
    };

    const result = findDuplicatePerson(incoming, pool);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchReason).toBe('EMAIL_MATCH');
    expect(result.confidenceScore).toBe(95);
  });

  it('4. 성명과 회사가 일치하는 경우 중복을 감지해야 한다', () => {
    const incoming: Partial<Person> = {
      name: '김도진',
      currentCompany: '삼성전자',
      currentDepartment: '반도체 사업부'
    };

    const result = findDuplicatePerson(incoming, pool);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchReason).toBe('NAME_AFFILIATION_MATCH');
  });

  it('5. 중복이 아닐 경우 신규 인맥으로 판정해야 한다', () => {
    const incoming: Partial<Person> = {
      name: '이수민',
      mobile: '010-5555-7777',
      email: 'sm.lee@kakao.com'
    };

    const result = findDuplicatePerson(incoming, pool);
    expect(result.isDuplicate).toBe(false);
    expect(result.matchedPerson).toBeNull();
  });

  it('6. 이직/승진 정보 병합 시 기존 회사가 careers 히스토리에 보존되고 최신 정보로 갱신되어야 한다', () => {
    const incoming: Partial<Person> = {
      currentCompany: 'SK하이닉스',
      currentTitle: '총괄 대표이사 사장',
      skills: ['HBM', 'CXL'],
      tags: ['하이닉스', '대표'],
      memo: '2026년 하이닉스로 영전 합류'
    };

    const merged = mergePersonProfiles(basePerson, incoming);

    // 1. 최신 정보 갱신 확인
    expect(merged.currentCompany).toBe('SK하이닉스');
    expect(merged.currentTitle).toBe('총괄 대표이사 사장');

    // 2. 이전 삼성전자 경력이 careers에 자동 보존되었는지 확인
    expect(merged.careers.length).toBeGreaterThan(0);
    expect(merged.careers[0].companyName).toBe('삼성전자');
    expect(merged.careers[0].title).toBe('부사장');
    expect(merged.careers[0].isCurrent).toBe(false);

    // 3. 스킬 및 태그의 합집합 확인
    expect(merged.skills).toContain('HBM');
    expect(merged.skills).toContain('CXL');
    expect(merged.skills).toContain('AI 반도체');

    // 4. 메모 히스토리 타임스탬프 누적 확인
    expect(merged.memo).toContain('반도체 총괄 리더');
    expect(merged.memo).toContain('2026년 하이닉스로 영전 합류');
  });
});
