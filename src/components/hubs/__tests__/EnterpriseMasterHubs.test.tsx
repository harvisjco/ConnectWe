import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ExecutiveGovernanceMasterHubModal } from '../ExecutiveGovernanceMasterHubModal';
import { TalentCareerEcosystemMasterHubModal } from '../TalentCareerEcosystemMasterHubModal';
import { MeetingLifecycleMasterHubModal } from '../MeetingLifecycleMasterHubModal';
import { Person } from '../../../types/network';

const mockPeople: Person[] = [
  {
    id: 'p-1',
    name: '김도진',
    currentCompany: '삼성전자',
    currentTitle: '부사장',
    currentDepartment: '반도체 사업부',
    mobile: '010-1234-5678',
    email: 'dj.kim@samsung.com',
    primaryDomain: '반도체',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    closeness: 3,
    memo: '반도체 총괄 리더',
    skills: ['AI 칩', 'HBM', '시스템 반도체'],
    careers: [],
    connectionChannel: 'dart',
    sourceType: 'DART_FACT',
    isStale: false,
    academics: [{ schoolName: '서울대학교', degree: '박사', source: 'SOURCE_DATA' }]
  },
  {
    id: 'p-2',
    name: '이지은',
    currentCompany: '하이퍼플로우',
    currentTitle: 'CEO',
    currentDepartment: '경영총괄',
    mobile: '010-9876-5432',
    email: 'je.lee@hyperflow.ai',
    primaryDomain: 'AI',
    estimatedAgeGroup: '30s',
    isAgeEstimated: false,
    closeness: 2,
    memo: '초기 스타트업 창업',
    skills: ['LLM', '에이전트'],
    careers: [],
    connectionChannel: 'manual',
    sourceType: 'SOURCE_DATA',
    isStale: false,
    academics: [{ schoolName: 'KAIST', degree: '석사', source: 'SOURCE_DATA' }]
  }
];

describe('3 Enterprise Master Hubs Unit Tests (renderToString)', () => {
  describe('ExecutiveGovernanceMasterHubModal', () => {
    it('renders governance hub and verifies key regulatory sections', () => {
      const handleClose = vi.fn();
      const handleShowToast = vi.fn();

      const html = renderToString(
        <ExecutiveGovernanceMasterHubModal
          isOpen={true}
          onClose={handleClose}
          people={mockPeople}
          onShowToast={handleShowToast}
        />
      );

      expect(html).toContain('경영 거버넌스 &amp; 전략 인텔리전스 마스터 허브');
      expect(html).toContain('이사회 거버넌스 &amp; 상법 규제');
      expect(html).toContain('DART 공시 &amp; M&amp;A 시너지');
      expect(html).toContain('최고경영진 승계 큐레이터');
      expect(html).toContain('전략 인텔리전스 &amp; 히트맵');
      expect(html).toContain('상법 제542조의8 사외이사 겸직 규제 실시간 판별기');
    });

    it('renders disclosures tab with DART governance timeline and audit trail', () => {
      const handleClose = vi.fn();
      const handleShowToast = vi.fn();

      const html = renderToString(
        <ExecutiveGovernanceMasterHubModal
          isOpen={true}
          initialTab="disclosures"
          onClose={handleClose}
          people={mockPeople}
          onShowToast={handleShowToast}
        />
      );

      expect(html).toContain('DART 5% 이상 대량보유 및 담보계약 공시 레이더');
      expect(html).toContain('크로스보드(Cross-Board) 임원 교류 &amp; M&amp;A 시너지 레이더');
      expect(html).toContain('DART 전자공시 핵심 임원 실공시 궤적 &amp; 책임경영 타임라인');
      expect(html).toContain('검증된 공시 팩트');
    });

    it('renders closed modal as empty string', () => {
      const html = renderToString(
        <ExecutiveGovernanceMasterHubModal
          isOpen={false}
          onClose={vi.fn()}
          people={mockPeople}
          onShowToast={vi.fn()}
        />
      );

      expect(html).toBe('');
    });
  });

  describe('TalentCareerEcosystemMasterHubModal', () => {
    it('renders talent hub with squad builder and ecosystem tabs', () => {
      const handleClose = vi.fn();
      const handleShowToast = vi.fn();

      const html = renderToString(
        <TalentCareerEcosystemMasterHubModal
          isOpen={true}
          onClose={handleClose}
          people={mockPeople}
          onShowToast={handleShowToast}
        />
      );

      expect(html).toContain('실무 인재 &amp; 커리어 성장 생태계 마스터 허브');
      expect(html).toContain('프로젝트 스쿼드 빌더');
      expect(html).toContain('초기 창업 &amp; 시드 레이더');
      expect(html).toContain('신뢰 보증 &amp; 디지털 명함');
      expect(html).toContain('실무 지식 &amp; 스터디 길드');
      expect(html).toContain('24h 실무 SOS');
    });
  });

  describe('MeetingLifecycleMasterHubModal', () => {
    it('renders meeting lifecycle hub with 3-choice scheduler and debrief', () => {
      const handleClose = vi.fn();
      const handleShowToast = vi.fn();

      const html = renderToString(
        <MeetingLifecycleMasterHubModal
          isOpen={true}
          onClose={handleClose}
          people={mockPeople}
          selectedPerson={mockPeople[0]}
          onShowToast={handleShowToast}
        />
      );

      expect(html).toContain('미팅 &amp; 관계 라이프사이클 마스터 허브');
      expect(html).toContain('1. 일정 조율 &amp; .ICS');
      expect(html).toContain('2. 5분 전 브리프');
      expect(html).toContain('3. 현장 밋업 &amp; 비망록');
      expect(html).toContain('4. 회고 &amp; 감사 서신');
      expect(html).toContain('5. 3분 사후 팔로업');
    });
  });
});
