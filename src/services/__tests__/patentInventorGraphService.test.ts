import { describe, it, expect } from 'vitest';
import { 
  getAcademicPatentGraph, 
  ACADEMIC_LABS, 
  ACADEMIC_PATENTS 
} from '../patentInventorGraphService';
import { Person } from '../../types/network';

describe('patentInventorGraphService [혁신 19: 대학 랩 & 특허 발명자 네트워크]', () => {
  const mockPeople: Person[] = [
    {
      id: 'p1',
      name: '김선우',
      currentCompany: '서울대학교 AI연구원',
      currentDepartment: '컴퓨터공학부',
      currentTitle: '석좌교수',
      mobile: '010-1111-2222',
      email: 'swkim@snu.ac.kr',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'AI/반도체',
      academics: [
        { schoolName: '서울대학교', degree: '박사', major: '컴퓨터공학', source: 'DART_FACT' }
      ],
      careers: [],
      skills: ['AI', '양자화', '신경망'],
      closeness: 1,
      sourceType: 'DART_FACT',
      connectionChannel: 'dart',
      isStale: false
    },
    {
      id: 'p2',
      name: '이민호',
      currentCompany: '카이스트 테크',
      currentDepartment: '기술본부',
      currentTitle: '대표이사',
      mobile: '010-3333-4444',
      email: 'mhlee@kaist.ac.kr',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'AI/반도체',
      academics: [
        { schoolName: 'KAIST', degree: '석사', major: '전자전기', source: 'DART_FACT' }
      ],
      careers: [],
      skills: ['반도체', 'CXL'],
      closeness: 2,
      sourceType: 'SOURCE_DATA',
      connectionChannel: 'remember',
      isStale: false
    }
  ];

  it('기본 전체 도메인 조회 시 팩트 기반 특허 및 랩 매칭을 정상 반환한다', () => {
    const report = getAcademicPatentGraph('ALL', mockPeople);
    expect(report.totalPatentsCount).toBe(ACADEMIC_PATENTS.length);
    expect(report.matchedSynergiesCount).toBe(ACADEMIC_PATENTS.length);
    expect(report.labsSummary.length).toBe(ACADEMIC_LABS.length);
    expect(report.executiveBriefText).toContain('[ConnectWe 딥테크 산학 연계 기술이전 1-Page 브리프]');
  });

  it('AI/반도체 도메인 필터링이 정확하게 동작한다', () => {
    const report = getAcademicPatentGraph('AI/반도체', mockPeople);
    expect(report.matches.length).toBeGreaterThan(0);
    report.matches.forEach(m => {
      expect(m.patent.techDomain).toBe('AI/반도체');
    });
  });

  it('인맥 정보와 발명자/동문 일치 시 connectedPeople 및 가산점이 정상 부여된다', () => {
    const report = getAcademicPatentGraph('AI/반도체', mockPeople);
    const snuMatch = report.matches.find(m => m.patent.institutionName === '서울대학교');
    expect(snuMatch).toBeDefined();
    if (snuMatch) {
      expect(snuMatch.connectedPeople.length).toBeGreaterThan(0);
      const connected = snuMatch.connectedPeople.find(cp => cp.person.name === '김선우');
      expect(connected).toBeDefined();
      expect(connected?.matchReason).toContain('발명자 본인 직결');
      expect(snuMatch.commercializationScore).toBeGreaterThan(60);
    }
  });

  it('동문 및 발명자 인맥이 없는 경우에도 TLO 채널 제언이 정상 산출된다', () => {
    const report = getAcademicPatentGraph('이차전지/신소재', []);
    expect(report.matches.length).toBeGreaterThan(0);
    const postechMatch = report.matches[0];
    expect(postechMatch.connectedPeople.length).toBe(0);
    expect(postechMatch.executiveInsight).toContain('산학협력단 공식 TLO');
  });
});
