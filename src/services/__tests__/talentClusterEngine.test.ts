import { describe, it, expect } from 'vitest';
import { identifyTalentCluster, getSeniorityLevel } from '../talentClusterEngine';
import { Person } from '../../types/network';

describe('talentClusterEngine - 5대 인재 클러스터 고유 강점 검증', () => {
  const basePerson: Person = {
    id: 'test-1',
    name: '홍길동',
    currentCompany: '넥스트스타트업',
    currentTitle: 'CEO / 대표이사',
    currentDepartment: '경영총괄',
    mobile: '010-1234-5678',
    email: 'hong@nextstartup.io',
    sourceType: 'SOURCE_DATA',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    closeness: 1,
    connectionChannel: 'manual',
    isStale: false,
    careers: [],
    academics: [],
    skills: ['사업개발', '피치덱'],
    primaryDomain: 'IT/스타트업',
    memo: ''
  };

  it('비상장 혁신 기업의 대표 및 C-Level은 [어자일 벤처 리더]로 분류되어 풀스콥 실행력과 민첩성 강점을 부여받아야 한다', () => {
    const profile = identifyTalentCluster(basePerson);
    expect(profile.id).toBe('VENTURE_LEADER');
    expect(profile.label).toBe('어자일 벤처 리더');
    expect(profile.superpowers).toContain('풀스콥(Full-Scope) 종합 실행력');
    expect(profile.superpowers).toContain('젊고 역동적인 빠른 의사결정');
  });

  it('DART 공시 검증 인재는 [상장사 거버넌스 리더]로 분류되어 공적 책임과 대규모 자본 운용력 강점을 부여받아야 한다', () => {
    const dartPerson: Person = {
      ...basePerson,
      sourceType: 'DART_FACT',
      currentCompany: '삼성전자',
      currentTitle: '전무 / 사업부장',
      dartInfo: {
        corpCode: '00126380',
        stockName: '삼성전자',
        registeredRole: '등기이사',
        isPublicDirector: true,
        verifiedAt: '2026-03-15'
      }
    };
    const profile = identifyTalentCluster(dartPerson);
    expect(profile.id).toBe('LISTED_EXECUTIVE');
    expect(profile.label).toBe('상장사 거버넌스 리더');
    expect(profile.superpowers).toContain('공적 책임 & 투명한 거버넌스');
  });

  it('AI, 반도체 및 박사/연구원 인재는 [딥테크 R&D 펠로우]로 분류되어 원천 기술 아키텍처 강점을 부여받아야 한다', () => {
    const techPerson: Person = {
      ...basePerson,
      currentCompany: '한국AI연구원',
      currentTitle: '수석연구원 / 박사',
      primaryDomain: 'LLM & 파운데이션 모델',
      skills: ['AI', 'Deep Learning', 'PyTorch']
    };
    const profile = identifyTalentCluster(techPerson);
    expect(profile.id).toBe('TECH_FELLOW');
    expect(profile.label).toBe('딥테크 R&D 펠로우');
    expect(profile.superpowers).toContain('원천 기술 및 아키텍처 설계');
  });

  it('VC 및 투자 파트너는 [전략 투자 파트너]로 분류되어 자본 네트워크와 거시 통찰 강점을 부여받아야 한다', () => {
    const investorPerson: Person = {
      ...basePerson,
      currentCompany: '소프트뱅크벤처스',
      currentTitle: '매니징 파트너',
      primaryDomain: 'VC 투자 및 M&A'
    };
    const profile = identifyTalentCluster(investorPerson);
    expect(profile.id).toBe('INVESTOR_PARTNER');
    expect(profile.label).toBe('전략 투자 파트너');
    expect(profile.superpowers).toContain('자본 네트워크 레버리지');
  });

  it('단정적 나이 추정 대신 품격 있는 전문 경력 단계(Seniority Level)가 산출되어야 한다', () => {
    expect(getSeniorityLevel(basePerson)).toBe('이그제큐티브 레벨 (Executive 15년+)');
    
    const directorPerson: Person = {
      ...basePerson,
      currentTitle: '사업본부 상무이사'
    };
    expect(getSeniorityLevel(directorPerson)).toBe('시니어 디렉터 (12년+)');

    const leadPerson: Person = {
      ...basePerson,
      currentTitle: '데이터팀 팀장'
    };
    expect(getSeniorityLevel(leadPerson)).toBe('전문 리드급 (8~12년차)');
  });
});
