import { describe, it, expect } from 'vitest';
import { generateCsvWithBom, restoreFromEncryptedVault, parseCsvWithBom } from '../dataVaultService';
import { encryptObject } from '../cryptoStorage';
import { Person } from '../../types/network';

describe('dataVaultService - 엑셀 BOM CSV 및 AES-256 데이터 볼트 검증', () => {
  const samplePeople: Person[] = [
    {
      id: 'p-1',
      name: '김엔터,프라이즈',
      currentCompany: '테크스타트업 "혁신"',
      currentTitle: '최고전략책임자(CSO)',
      currentDepartment: '전략실',
      mobile: '010-1111-2222',
      email: 'cso@innovation.com',
      sourceType: 'DART_FACT',
      closeness: 2,
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      lastContactDate: '2026-09-20',
      primaryDomain: '인공지능 SaaS',
      skills: ['AI', 'SaaS'],
      connectionChannel: 'dart',
      isStale: false,
      memo: '공동 M&A, 투자 라운드 참여 논의',
      academics: [{ schoolName: '서울대학교', degree: '학사', source: 'SOURCE_DATA' }],
      careers: [{ id: 'c1', companyName: '네이버', title: '팀장', startYear: 2020, isCurrent: false, source: 'SOURCE_DATA' }],
    },
    {
      id: 'p-2',
      name: '이수석',
      currentCompany: '글로벌파트너스',
      currentTitle: '대표 파트너',
      currentDepartment: '투자본부',
      mobile: '010-3333-4444',
      email: 'partner@global.vc',
      sourceType: 'SOURCE_DATA',
      closeness: 3,
      connectionChannel: 'manual',
      isStale: false,
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'VC 투자',
      skills: ['벤처투자'],
      academics: [],
      careers: [],
    }
  ];

  describe('generateCsvWithBom (헌장 Rule 1 BOM 필수 준수)', () => {
    it('CSV 최상단 첫 바이트가 반드시 UTF-8 BOM(\\uFEFF)으로 시작해야 한다', () => {
      const csv = generateCsvWithBom(samplePeople);
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
      expect(csv.startsWith('\uFEFF')).toBe(true);
    });

    it('필수 헤더 컬럼이 모두 포함되어야 한다', () => {
      const csv = generateCsvWithBom(samplePeople);
      expect(csv).toContain('성명,현재직장,직책,부서,휴대전화,이메일,DART공시임원여부');
    });

    it('쉼표 및 큰따옴표가 포함된 필드는 RFC 4180 표준에 맞게 이스케이프되어야 한다', () => {
      const csv = generateCsvWithBom(samplePeople);
      // "김엔터,프라이즈"
      expect(csv).toContain('"김엔터,프라이즈"');
      // "테크스타트업 ""혁신"""
      expect(csv).toContain('"테크스타트업 ""혁신"""');
    });

    it('DART 공시 임원 여부가 정확하게 라벨링되어야 한다', () => {
      const csv = generateCsvWithBom(samplePeople);
      expect(csv).toContain('공시임원');
      expect(csv).toContain('일반');
    });
  });

  describe('AES-256 암호화 볼트 복원 (restoreFromEncryptedVault)', () => {
    const password = 'ConnectWeVaultPassword2026!';

    it('올바른 비밀번호로 암호화 볼트가 완벽하게 복원되어야 한다', async () => {
      const payload = await encryptObject({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        networkCount: samplePeople.length,
        people: samplePeople
      }, password);

      const restored = await restoreFromEncryptedVault(payload, password);
      expect(restored).toHaveLength(2);
      expect(restored[0].name).toBe('김엔터,프라이즈');
      expect(restored[1].name).toBe('이수석');
    }, 15000);

    it('잘못된 비밀번호로 복원 시도 시 에러가 발생해야 한다', async () => {
      const payload = await encryptObject({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        networkCount: samplePeople.length,
        people: samplePeople
      }, password);

      await expect(restoreFromEncryptedVault(payload, 'WrongPassword!')).rejects.toThrow();
    }, 15000);

    it('유효하지 않은 볼트 페이로드 구조일 경우 에러를 던져야 한다', async () => {
      const invalidPayload = await encryptObject({
        version: '1.0',
        corrupted: true
      }, password);

      await expect(restoreFromEncryptedVault(invalidPayload, password)).rejects.toThrow(
        '유효한 ConnectWe 볼트 아카이브 형식이 아닙니다.'
      );
    }, 15000);
  });

  describe('parseCsvWithBom (양방향 CSV 파서 & Excel BOM 완벽 지원)', () => {
    it('generateCsvWithBom으로 생성된 CSV를 완벽하게 양방향 복원한다 (라운드트립 검증)', () => {
      const csv = generateCsvWithBom(samplePeople);
      const restored = parseCsvWithBom(csv);

      expect(restored).toHaveLength(2);
      expect(restored[0].name).toBe('김엔터,프라이즈');
      expect(restored[0].currentCompany).toBe('테크스타트업 "혁신"');
      expect(restored[0].currentTitle).toBe('최고전략책임자(CSO)');
      expect(restored[0].currentDepartment).toBe('전략실');
      expect(restored[0].mobile).toBe('010-1111-2222');
      expect(restored[0].sourceType).toBe('DART_FACT');
      expect(restored[0].closeness).toBe(2);

      expect(restored[1].name).toBe('이수석');
      expect(restored[1].currentCompany).toBe('글로벌파트너스');
      expect(restored[1].closeness).toBe(3);
    });

    it('외부 CRM 형식(이름, 회사, 직책, 휴대폰)의 간단한 CSV도 유연하게 파싱한다', () => {
      const rawCsv = `이름,회사,직책,휴대폰,이메일
최강민,카카오모빌리티,본부장,010-9988-7766,km.choi@kakaomobility.com
서유진,하이퍼엑스,수석연구원,010-5544-3322,yj.seo@hyperx.ai`;

      const result = parseCsvWithBom(rawCsv);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('최강민');
      expect(result[0].currentCompany).toBe('카카오모빌리티');
      expect(result[0].currentTitle).toBe('본부장');
      expect(result[0].mobile).toBe('010-9988-7766');

      expect(result[1].name).toBe('서유진');
      expect(result[1].currentCompany).toBe('하이퍼엑스');
    });

    it('성명 컬럼이 없는 CSV인 경우 명시적 예외를 던진다', () => {
      const invalidCsv = `회사,직책,연락처\n삼성전자,상무,010-1234-5678`;
      expect(() => parseCsvWithBom(invalidCsv)).toThrow('[성명] 또는 [이름]');
    });
  });
});
