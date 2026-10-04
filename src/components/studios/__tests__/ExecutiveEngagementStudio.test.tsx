import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ExecutiveEngagementStudio } from '../ExecutiveEngagementStudio';
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
    careers: [],
    academics: [],
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
    careers: [],
    academics: [],
    connectionChannel: 'dart',
    sourceType: 'DART_FACT',
    closeness: 2,
    isStale: true
  }
];

describe('ExecutiveEngagementStudio (통합 메가스튜디오 1 렌더링 및 무결성 검증)', () => {
  it('1-Page 브리프 탭(brief)에서 1-Page 요약 및 3대 의제가 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <ExecutiveEngagementStudio
        isOpen={true}
        initialTab="brief"
        targetPerson={mockPeople[0]}
        allPeople={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('경영진 미팅 &amp; 소통 컨시어지 스튜디오');
    expect(html).toContain('통합 메가스튜디오 1');
    expect(html).toContain('1-Page AI 브리프');
    expect(html).toContain('동선 티타임 &amp; .ICS');
    expect(html).toContain('30초 음성 회고 &amp; 서신');
    expect(html).toContain('골든케어 안부 &amp; 축전문');
    expect(html).toContain('김서연');
  });

  it('동선 티타임 탭(teatime)에서 일정 조율 및 초대 서신이 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <ExecutiveEngagementStudio
        isOpen={true}
        initialTab="teatime"
        targetPerson={mockPeople[0]}
        allPeople={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('티타임 일정 조율');
    expect(html).toContain('.ICS 캘린더 다운로드');
    expect(html).toContain('초대 서신 복사');
    expect(html).toContain('정중한 일정 조율 초대 서신 초안');
  });

  it('음성 회고 탭(debrief)에서 30초 회고 및 감사 서신 모드가 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <ExecutiveEngagementStudio
        isOpen={true}
        initialTab="debrief"
        targetPerson={mockPeople[1]}
        allPeople={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('미팅 직후 회고 및 감사 서신');
    expect(html).toContain('음성 모드');
    expect(html).toContain('텍스트 모드');
    expect(html).toContain('회고 저장 &amp; 소통일 갱신');
  });

  it('골든케어 & 축전 탭(care)에서 안부 레이더 및 공식 축전 템플릿이 정상 렌더링되어야 한다', () => {
    const html = renderToString(
      <ExecutiveEngagementStudio
        isOpen={true}
        initialTab="care"
        targetPerson={mockPeople[1]}
        allPeople={mockPeople}
        onClose={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(html).toContain('골든케어 &amp; C-Suite 의전');
    expect(html).toContain('안부 레이더');
    expect(html).toContain('경조사 의전');
    expect(html).toContain('소통 골든타임');
  });
});
