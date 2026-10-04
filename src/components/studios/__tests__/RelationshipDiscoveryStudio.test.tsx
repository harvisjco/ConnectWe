import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { RelationshipDiscoveryStudio } from '../RelationshipDiscoveryStudio';
import { Person } from '../../../types/network';

const mockPeople: Person[] = [
  {
    id: 'p-me',
    name: '나 (대표)',
    currentCompany: 'ConnectWe',
    currentTitle: '대표이사',
    currentDepartment: '경영총괄',
    mobile: '010-0000-0000',
    email: 'me@connectwe.com',
    primaryDomain: '경영/전략',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    lastContactDate: '2026-09-01',
    skills: ['AI', '경영'],
    careers: [],
    academics: [{ schoolName: '서울대학교', degree: '학사', source: 'SOURCE_DATA' }],
    connectionChannel: 'manual',
    sourceType: 'SOURCE_DATA',
    closeness: 1,
    isStale: false
  },
  {
    id: 'p-1',
    name: '김서연',
    currentCompany: '넥스트비전 AI',
    currentTitle: 'VP of AI',
    currentDepartment: 'AI Labs',
    mobile: '010-1111-2222',
    email: 'sy.kim@nextvision.ai',
    primaryDomain: 'AI',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    lastContactDate: '2026-08-01',
    skills: ['AI', 'VP'],
    careers: [{ id: 'c-1', companyName: '삼성전자', title: '수석연구원', startYear: 2020, isCurrent: false, source: 'SOURCE_DATA' }],
    academics: [{ schoolName: '서울대학교', degree: '석사', source: 'SOURCE_DATA' }],
    connectionChannel: 'manual',
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    isStale: false
  },
  {
    id: 'p-2',
    name: '한동훈',
    currentCompany: '(주)하이퍼클라우드',
    currentTitle: 'CTO / 사내이사',
    currentDepartment: 'Engineering',
    mobile: '010-3333-4444',
    email: 'dh.han@hypercloud.com',
    primaryDomain: 'Cloud',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    lastContactDate: '2026-05-01',
    skills: ['Cloud', 'CTO'],
    careers: [{ id: 'c-2', companyName: '삼성전자', title: '책임연구원', startYear: 2018, isCurrent: false, source: 'SOURCE_DATA' }],
    academics: [{ schoolName: 'KAIST', degree: '박사', source: 'SOURCE_DATA' }],
    connectionChannel: 'dart',
    sourceType: 'DART_FACT',
    closeness: 2,
    isStale: true
  }
];

describe('RelationshipDiscoveryStudio (통합 메가스튜디오 2 렌더링 및 무결성 검증)', () => {
  it('1. 최단 신뢰 소개 경로 탭(path)에서 경로 및 소개 요청 서신이 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <RelationshipDiscoveryStudio
        isOpen={true}
        initialTab="path"
        people={mockPeople}
        targetPerson={mockPeople[1]}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('인맥 탐색 &amp; 웜 인트로 지능형 스튜디오');
    expect(html).toContain('통합 메가스튜디오 2');
    expect(html).toContain('최단 신뢰 소개 경로 &amp; 2인 연결');
    expect(html).toContain('소개자 맞춤 정중한 요청 서신');
    expect(html).toContain('거점 티타임 제안 슬롯 자동 동봉');
  });

  it('2. 6단계 인맥 분리 탭(degrees)에서 알럼나이 1촌 브릿지가 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <RelationshipDiscoveryStudio
        isOpen={true}
        initialTab="degrees"
        people={mockPeople}
        targetPerson={mockPeople[1]}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('6단계 인맥 분리 &amp; 알럼나이 다리');
    expect(html).toContain('대상 인물 분석:');
    expect(html).toContain('소개 경로 생성');
  });

  it('3. 결속도 히트맵 탭(heatmap)에서 Tie Strength 레벨 및 급랭 감지가 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <RelationshipDiscoveryStudio
        isOpen={true}
        initialTab="heatmap"
        people={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('결속도 Tie Strength &amp; 온도 히트맵');
    expect(html).toContain('인물명, 기업명 검색');
  });

  it('4. 추천 감사 리워드 탭(gratitude)에서 정산 대시보드가 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <RelationshipDiscoveryStudio
        isOpen={true}
        initialTab="gratitude"
        people={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('파트너십 연계 &amp; 추천 감사 리워드');
    expect(html).toContain('정산 대시보드');
    expect(html).toContain('+ 신규 추천 감사 등록');
  });
});
