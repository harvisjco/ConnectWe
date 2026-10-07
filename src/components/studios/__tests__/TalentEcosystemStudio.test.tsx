import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TalentEcosystemStudio } from '../TalentEcosystemStudio';
import { Person } from '../../../types/network';

const mockPeople: Person[] = [
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
    closeness: 1,
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

describe('TalentEcosystemStudio (통합 메가스튜디오 3 렌더링 및 무결성 검증)', () => {
  it('1. 전략 프로젝트 스쿼드 탭(squad)에서 스쿼드 편성 및 비즈니스 딜 등록 버튼이 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <TalentEcosystemStudio
        isOpen={true}
        initialTab="squad"
        people={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('실무 인재 &amp; 커리어 성장 생태계 스튜디오');
    expect(html).toContain('통합 메가스튜디오 3');
    expect(html).toContain('전략 프로젝트 스쿼드 빌더');
    expect(html).toContain('비즈니스 딜로 공식 등록');
  });

  it('2. 초기 창업 레이더 탭(venture)에서 창업 소식 및 축하 서신이 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <TalentEcosystemStudio
        isOpen={true}
        initialTab="venture"
        people={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('초기 창업 &amp; 시드 레이더');
    expect(html).toContain('동문·동료 초기 창업 리스트');
  });

  it('3. 피어 신뢰 보증 탭(trust_card)에서 vCard 명함 및 커피챗 룰렛이 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <TalentEcosystemStudio
        isOpen={true}
        initialTab="trust_card"
        people={mockPeople}
        selectedPerson={mockPeople[0]}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('피어 신뢰 보증 &amp; vCard 명함');
    expect(html).toContain('표준 vCard 모바일 연락처 다운로드');
    expect(html).toContain('사내/동문 15분 캐주얼 커피챗 룰렛');
  });

  it('4. 슈퍼파워 지식 교환 탭(knowledge)에서 SOS 티켓 발행 폼이 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <TalentEcosystemStudio
        isOpen={true}
        initialTab="knowledge"
        people={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('슈퍼파워 지식 교환 &amp; SOS');
    expect(html).toContain('SOS 지식 티켓 발행');
  });
});
