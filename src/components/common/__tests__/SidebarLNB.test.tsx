import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SidebarLNB } from '../SidebarLNB';
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
    skills: ['AI 칩', 'HBM'],
    careers: [],
    connectionChannel: 'dart',
    sourceType: 'DART_FACT',
    isStale: false,
    academics: []
  }
];

describe('SidebarLNB Component Unit Tests (renderToString)', () => {
  it('renders 3 Enterprise Master Hub buttons in expanded mode with badges', () => {
    const handleOpenGov = vi.fn();
    const handleOpenTalent = vi.fn();
    const handleOpenMeeting = vi.fn();

    const html = renderToString(
      <SidebarLNB
        activeView="general"
        onSelectView={vi.fn()}
        people={mockPeople}
        userRole="general"
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        isOpenMobile={false}
        onCloseMobile={vi.fn()}
        onOpenCopilot={vi.fn()}
        onOpenGovernanceMasterHub={handleOpenGov}
        onOpenTalentMasterHub={handleOpenTalent}
        onOpenMeetingMasterHub={handleOpenMeeting}
      />
    );

    expect(html).toContain('엔터프라이즈 마스터 허브');
    expect(html).toContain('data-testid="lnb-governance-hub"');
    expect(html).toContain('경영 거버넌스 허브');
    expect(html).toContain('C-Level');

    expect(html).toContain('data-testid="lnb-talent-hub"');
    expect(html).toContain('실무 인재 생태계 허브');
    expect(html).toContain('스쿼드');

    expect(html).toContain('data-testid="lnb-meeting-hub"');
    expect(html).toContain('미팅 전주기 허브');
    expect(html).toContain('Full');
  });

  it('renders compact icon buttons in collapsed mode with tooltips', () => {
    const html = renderToString(
      <SidebarLNB
        activeView="command"
        onSelectView={vi.fn()}
        people={mockPeople}
        userRole="master"
        isCollapsed={true}
        onToggleCollapse={vi.fn()}
        isOpenMobile={false}
        onCloseMobile={vi.fn()}
        onOpenCopilot={vi.fn()}
        onOpenGovernanceMasterHub={vi.fn()}
        onOpenTalentMasterHub={vi.fn()}
        onOpenMeetingMasterHub={vi.fn()}
      />
    );

    expect(html).toContain('data-testid="lnb-governance-hub"');
    expect(html).toContain('title="경영 거버넌스 &amp; 전략 인텔리전스 마스터 허브"');
    expect(html).toContain('data-testid="lnb-talent-hub"');
    expect(html).toContain('title="실무 인재 &amp; 커리어 성장 생태계 마스터 허브"');
    expect(html).toContain('data-testid="lnb-meeting-hub"');
    expect(html).toContain('title="비즈니스 미팅 &amp; 관계 라이프사이클 마스터 허브"');
  });

  it('omits master hubs section when callbacks are not provided', () => {
    const html = renderToString(
      <SidebarLNB
        activeView="general"
        onSelectView={vi.fn()}
        people={mockPeople}
        userRole="general"
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        isOpenMobile={false}
        onCloseMobile={vi.fn()}
        onOpenCopilot={vi.fn()}
      />
    );

    expect(html).not.toContain('엔터프라이즈 마스터 허브');
    expect(html).not.toContain('data-testid="lnb-governance-hub"');
  });
});
