import { describe, it, expect } from 'vitest';
import { 
  generateTeaTimeAgenda, 
  generateIcsCalendarString, 
  generateInvitationLetter 
} from '../meetingAgendaService';
import { Person } from '../../types/network';

describe('meetingAgendaService - C-Level 티타임 의제 AI 코파일럿 & .ICS 검증', () => {
  const samplePerson: Person = {
    id: 'p-test-c-level',
    name: '김혁신',
    currentCompany: '카카오인베스트먼트',
    currentTitle: '대표이사',
    currentDepartment: '경영총괄',
    mobile: '010-1234-5678',
    email: 'ceo.kim@kakaoinvest.com',
    sourceType: 'DART_FACT',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: 'AI 투자 / VC',
    skills: ['AI 투자', '벤처 파트너십'],
    careers: [],
    academics: [],
    closeness: 2,
    connectionChannel: 'dart',
    isStale: false,
    memo: '최근 대표이사 영전, 시리즈B 투자 검토 활발',
    activityLogs: []
  };

  it('DART 공시 임원에 대한 3대 맞춤 의제와 질문이 정상 생성되어야 한다', () => {
    const agenda = generateTeaTimeAgenda(samplePerson);

    expect(agenda.icebreakerTopic).toContain('카카오인베스트먼트');
    expect(agenda.strategicAgendaList).toHaveLength(3);
    expect(agenda.strategicAgendaList[0].title).toContain('중점 사업 방향');
    expect(agenda.executiveQuestions).toHaveLength(3);
    expect(agenda.recommendedVenues.length).toBeGreaterThan(0);
  });

  it('표준 RFC 5545 .ics 캘린더 포맷 문자열이 올바르게 생성되어야 한다', () => {
    const startDate = new Date('2026-10-15T14:00:00Z');
    const ics = generateIcsCalendarString({
      title: '카카오인베스트먼트 김혁신 대표 티타임',
      description: '1. 전략적 비즈니스 협력 논의',
      location: '조선 팰리스 1914 라운지',
      startDate,
      durationMinutes: 60,
      attendeeName: '김혁신',
      attendeeEmail: 'ceo.kim@kakaoinvest.com',
      organizerName: 'ConnectWe'
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:카카오인베스트먼트 김혁신 대표 티타임');
    expect(ics).toContain('LOCATION:조선 팰리스 1914 라운지');
    expect(ics).toContain('ATTENDEE;');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('품격 있는 C-Level 티타임 확정 서신 텍스트가 정상 생성되어야 한다', () => {
    const meetingDate = new Date('2026-10-15T14:00:00');
    const letter = generateInvitationLetter(
      samplePerson,
      meetingDate,
      '포시즌스 호텔 서울 로비 라운지',
      '■ 1. 전략 사업 시너지 논의\n■ 2. 분기 내 공동 협력 검토'
    );

    expect(letter).toContain('카카오인베스트먼트 김혁신 대표이사님');
    expect(letter).toContain('포시즌스 호텔 서울 로비 라운지');
    expect(letter).toContain('표준 캘린더(.ics)');
    expect(letter).toContain('감사합니다.');
  });
});
