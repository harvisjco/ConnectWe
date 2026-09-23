import { Person } from '../types/network';

export interface CalendarMeeting {
  id: string;
  title: string;
  startTime: string; // ISO string 또는 "2026-09-23T14:00"
  endTime: string;
  location?: string;
  attendees: string[]; // 참석자 이름 / 이메일
  matchedPerson?: Person; // ConnectWe 인맥 중 매칭된 인물
  minutesUntil?: number; // 미팅 시작까지 남은 분
  notes?: string;
}

const STORAGE_KEY = 'connectwe_calendar_meetings';

/**
 * 미팅 제목 및 참석자 명단에서 ConnectWe 인맥과 최적 일치자 탐색
 */
export function matchPersonForMeeting(
  title: string,
  attendees: string[],
  people: Person[]
): Person | undefined {
  const normalizedTitle = title.toLowerCase();
  const normalizedAttendees = attendees.map(a => a.toLowerCase());

  // 1순위: 참석자 이메일 일치
  for (const p of people) {
    if (p.email && normalizedAttendees.some(a => a.includes(p.email.toLowerCase()))) {
      return p;
    }
  }

  // 2순위: 참석자 명단에 인물 이름 포함
  for (const p of people) {
    if (p.name && normalizedAttendees.some(a => a.includes(p.name.toLowerCase()))) {
      return p;
    }
  }

  // 3순위: 미팅 제목에 이름 및 회사명 포함 (예: "카카오 김철수 대표 미팅")
  for (const p of people) {
    if (p.name && normalizedTitle.includes(p.name.toLowerCase())) {
      return p;
    }
    if (p.currentCompany && normalizedTitle.includes(p.currentCompany.toLowerCase())) {
      // 회사명만 일치할 경우 해당 회사 소속 첫 번째 인맥
      return p;
    }
  }

  return undefined;
}

/**
 * iCal (.ics) 파일 텍스트 파서
 */
export function parseICS(icsContent: string, people: Person[]): CalendarMeeting[] {
  const meetings: CalendarMeeting[] = [];
  const events = icsContent.split('BEGIN:VEVENT');

  for (let i = 1; i < events.length; i++) {
    const ev = events[i].split('END:VEVENT')[0];
    
    // Summary / Title
    const summaryMatch = ev.match(/SUMMARY(?:;[^:]*)?:(.*)/i);
    const title = summaryMatch ? summaryMatch[1].trim() : '이름 없는 일정';

    // Start Time (DTSTART)
    const dtStartMatch = ev.match(/DTSTART(?:;[^:]*)?:(.*)/i);
    const rawStart = dtStartMatch ? dtStartMatch[1].trim() : '';

    // End Time (DTEND)
    const dtEndMatch = ev.match(/DTEND(?:;[^:]*)?:(.*)/i);
    const rawEnd = dtEndMatch ? dtEndMatch[1].trim() : '';

    // Location
    const locMatch = ev.match(/LOCATION(?:;[^:]*)?:(.*)/i);
    const location = locMatch ? locMatch[1].trim() : undefined;

    // Attendees
    const attendeeMatches = ev.match(/ATTENDEE[^:]*:(?:mailto:)?(.*)/gi) || [];
    const attendees = attendeeMatches.map(m => {
      const parts = m.split(':');
      return parts[parts.length - 1].trim();
    });

    const startTime = parseICalDate(rawStart) || new Date().toISOString();
    const endTime = parseICalDate(rawEnd) || new Date(Date.now() + 3600000).toISOString();

    const matchedPerson = matchPersonForMeeting(title, attendees, people);

    meetings.push({
      id: `meeting-${Date.now()}-${i}`,
      title,
      startTime,
      endTime,
      location,
      attendees,
      matchedPerson,
      minutesUntil: calculateMinutesUntil(startTime)
    });
  }

  return meetings;
}

/**
 * iCal 일시 문자열 파싱 헬퍼 (YYYYMMDDTHHMMSSZ 등)
 */
function parseICalDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/[^0-9TZ]/g, '');
  if (clean.length >= 8) {
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6);
    const day = clean.slice(6, 8);
    let hour = '09';
    let min = '00';
    if (clean.length >= 13) {
      hour = clean.slice(9, 11);
      min = clean.slice(11, 13);
    }
    return `${year}-${month}-${day}T${hour}:${min}:00`;
  }
  return null;
}

/**
 * 현재 시점으로부터 미팅까지 남은 시간(분) 계산
 */
export function calculateMinutesUntil(isoTime: string): number {
  const target = new Date(isoTime).getTime();
  const now = Date.now();
  return Math.round((target - now) / 60000);
}

/**
 * 임박한 미팅(실시간 레이더 포커스 대상) 추출
 */
export function getImminentMeeting(meetings: CalendarMeeting[]): CalendarMeeting | null {
  if (meetings.length === 0) return null;

  // minutesUntil 갱신 및 정렬
  const updated = meetings.map(m => ({
    ...m,
    minutesUntil: calculateMinutesUntil(m.startTime)
  })).sort((a, b) => (a.minutesUntil ?? 9999) - (b.minutesUntil ?? 9999));

  // -30분(시작 후 30분 진행 중)부터 +180분(3시간 이내) 사이의 미팅 우선
  const activeMeeting = updated.find(m => (m.minutesUntil ?? -999) >= -30 && (m.minutesUntil ?? 999) <= 180);
  if (activeMeeting) return activeMeeting;

  // 다가올 첫 번째 미팅 반환
  const futureMeeting = updated.find(m => (m.minutesUntil ?? -999) > -30);
  return futureMeeting || updated[0];
}

/**
 * 데모 및 초기 경험을 위한 스마트 샘플 미팅 생성
 */
export function generateMockCalendarMeetings(people: Person[]): CalendarMeeting[] {
  const now = new Date();
  
  // 매칭 후보 탐색
  const vipPerson = people.find(p => p.sourceType === 'DART_FACT') || people[0];
  const secondPerson = people.find(p => p.id !== vipPerson?.id) || people[1] || vipPerson;

  const meeting1Start = new Date(now.getTime() + 15 * 60000); // 15분 후
  const meeting1End = new Date(now.getTime() + 75 * 60000);

  const meeting2Start = new Date(now.getTime() + 150 * 60000); // 2시간 30분 후
  const meeting2End = new Date(now.getTime() + 210 * 60000);

  const meetings: CalendarMeeting[] = [];

  if (vipPerson) {
    meetings.push({
      id: 'mock-meeting-1',
      title: `[전략 제휴] ${vipPerson.currentCompany} ${vipPerson.name} ${vipPerson.currentTitle} 미팅`,
      startTime: meeting1Start.toISOString(),
      endTime: meeting1End.toISOString(),
      location: `${vipPerson.currentCompany} 대회의실`,
      attendees: [vipPerson.name, vipPerson.email || 'partner@executive.com'],
      matchedPerson: vipPerson,
      minutesUntil: 15,
      notes: '신규 AI 기술 인프라 도입 및 전략적 사업 협력 논의'
    });
  }

  if (secondPerson && secondPerson.id !== vipPerson?.id) {
    meetings.push({
      id: 'mock-meeting-2',
      title: `[네트워킹] ${secondPerson.name} ${secondPerson.currentTitle} 티타임`,
      startTime: meeting2Start.toISOString(),
      endTime: meeting2End.toISOString(),
      location: '강남파이낸스센터 라운지',
      attendees: [secondPerson.name],
      matchedPerson: secondPerson,
      minutesUntil: 150,
      notes: '최근 기술 동향 및 하반기 프로젝트 정보 교류'
    });
  }

  return meetings;
}

/**
 * 로컬 스토리지 저장 및 복원
 */
export function loadMeetingsFromStorage(people: Person[]): CalendarMeeting[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const mocks = generateMockCalendarMeetings(people);
      saveMeetingsToStorage(mocks);
      return mocks;
    }
    const parsed: CalendarMeeting[] = JSON.parse(raw);
    return parsed.map(m => ({
      ...m,
      matchedPerson: m.matchedPerson 
        ? (people.find(p => p.id === m.matchedPerson?.id) || m.matchedPerson)
        : matchPersonForMeeting(m.title, m.attendees, people),
      minutesUntil: calculateMinutesUntil(m.startTime)
    }));
  } catch (e) {
    console.error('Failed to load meetings:', e);
    return generateMockCalendarMeetings(people);
  }
}

export function saveMeetingsToStorage(meetings: CalendarMeeting[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  } catch (e) {
    console.error('Failed to save meetings:', e);
  }
}
