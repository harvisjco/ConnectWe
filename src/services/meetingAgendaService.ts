import { Person } from '../types/network';

export interface TeaTimeAgendaResult {
  person: Person;
  icebreakerTopic: string;
  strategicAgendaList: {
    title: string;
    description: string;
    talkingPoint: string;
  }[];
  executiveQuestions: string[];
  recommendedVenues: {
    name: string;
    area: string;
    vibe: string;
  }[];
}

export interface CalendarEventPayload {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  durationMinutes: number;
  attendeeName: string;
  attendeeEmail?: string;
  organizerName?: string;
}

/**
 * 상대방의 DART 공시, 직책, 활동 이력을 결합하여 C-Level 맞춤형 3대 티타임 의제 자동 합성
 */
export function generateTeaTimeAgenda(person: Person): TeaTimeAgendaResult {
  const isDartExecutive = person.sourceType === 'DART_FACT' || person.dartInfo?.isPublicDirector;
  const name = person.name || '경영진';
  const company = person.currentCompany || '파트너사';
  const title = person.currentTitle || '대표/임원';

  // 1. 아이스브레이킹 토픽 합성
  let icebreakerTopic = '';
  if (person.memo?.includes('승진') || person.memo?.includes('영전')) {
    icebreakerTopic = `최근 ${company}에서의 중책 영전을 축하드리며, 새로운 조직 비전에 대한 기대와 환영의 인사를 전합니다.`;
  } else if (isDartExecutive && person.dartInfo?.stockName) {
    icebreakerTopic = `DART 공시를 통해 본 ${person.dartInfo.stockName}의 최근 전략적 비즈니스 행보와 시장 내 영향력에 대한 경의를 표합니다.`;
  } else if (person.skills && person.skills.length > 0) {
    icebreakerTopic = `최근 주력하고 계신 [${person.skills.slice(0, 2).join(', ')}] 영역의 산업 동향과 혁신 관점을 가볍게 화두로 엽니다.`;
  } else if (person.primaryDomain) {
    icebreakerTopic = `최근 ${person.primaryDomain} 분야의 산업 동향과 미래 혁신 관점을 가볍게 화두로 엽니다.`;
  } else {
    icebreakerTopic = `${name} ${title}님의 바쁘신 경영 일정 속에서 시간을 내어주심에 감사드리며, 상호 신뢰와 비즈니스 시너지를 다지는 따뜻한 안부로 시작합니다.`;
  }

  // 2. 전략적 비즈니스 아젠다 3대 축
  const strategicAgendaList = [
    {
      title: `1. ${company}의 중점 사업 방향과 당사와의 시너지 접점 모색`,
      description: `${company}의 현재 성장 궤적과 당사 프로젝트 역량이 만나는 실질적 비즈니스 협력 기회 논의`,
      talkingPoint: `"최근 ${company}에서 역점을 두고 계신 신규 사업 방향성에 당사가 어떻게 기여할 수 있을지 고견을 듣고 싶습니다."`
    },
    {
      title: `2. 산업 밸류체인 및 핵심 인재·파트너십 네트워크 교류`,
      description: `양사의 네트워크 인텔리전스를 바탕으로 한 신뢰할 수 있는 파트너십 구축`,
      talkingPoint: `"시장 내에서 신뢰할 수 있는 탑티어 파트너사 및 도메인 전문가 풀에 대해 상호 인사이트를 공유하고자 합니다."`
    },
    {
      title: `3. 분기 내 구체적 공동 PoC(실증) 또는 비즈니스 딜 파이프라인 연계`,
      description: `단순 미팅에 그치지 않고 실질적인 협업 프로젝트 및 계약 단계로 발전시키기 위한 마일스톤 설정`,
      talkingPoint: `"오늘 논의된 아이디어를 바탕으로 다음 달 중 실무진 킥오프 또는 구체적 검토안을 마련해보면 어떨까요?"`
    }
  ];

  // 3. 경영진 품격 질문 3선
  const executiveQuestions = [
    `"${title}님께서 올해 가장 무게중심을 두고 계신 핵심 경영 과제는 무엇입니까?"`,
    `"최근 시장 변동성 속에서 ${company}가 바라보는 가장 결정적인 기회 요인은 어디에 있습니까?"`,
    `"저희가 향후 파트너십 과정에서 최우선으로 지원해드릴 수 있는 부분은 무엇이겠습니까?"`
  ];

  // 4. 품격 높은 C-Level 비즈니스 티타임 명소 추천
  const recommendedVenues = [
    { name: '포시즌스 호텔 서울 로비 라운지 (Maru)', area: '광화문/도심', vibe: '정통 C-Level 프라이빗 비즈니스 대화 최적화' },
    { name: '조선 팰리스 1914 라운지 & 바', area: '테헤란로/강남', vibe: '최고급 파트너십 논의 및 파노라마 뷰 프라이버시' },
    { name: '파크 하얏트 서울 더 라운지', area: '삼성동/코엑스', vibe: '조용하고 격조 높은 1:1 투자 및 전략 회동' },
    { name: '더블트리 바이 힐튼 서울 판교 라운지', area: '판교/분당', vibe: '딥테크 벤처 리더 및 IT 경영진 최적 접근성' },
    { name: '콘래드 서울 로비 37그릴 앤 바 라운지', area: '여의도/금융', vibe: '금융 및 자본시장 C-Level 미팅 맞춤형' }
  ];

  return {
    person,
    icebreakerTopic,
    strategicAgendaList,
    executiveQuestions,
    recommendedVenues
  };
}

/**
 * 표준 iCalendar (RFC 5545 .ics) 포맷 문자열 생성
 */
export function generateIcsCalendarString(event: CalendarEventPayload): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const formatUtcDate = (d: Date): string => {
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  };

  const endDate = new Date(event.startDate.getTime() + event.durationMinutes * 60 * 1000);
  const now = new Date();
  const uid = `connectwe-${now.getTime()}-${Math.random().toString(36).slice(2, 9)}@connectwe.internal`;

  const escapeIcsText = (str: string) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const cleanTitle = escapeIcsText(event.title);
  const cleanDescription = escapeIcsText(event.description);
  const cleanLocation = escapeIcsText(event.location);
  const organizer = event.organizerName ? `ORGANIZER;CN=${escapeIcsText(event.organizerName)}:mailto:connectwe@internal.app\r\n` : '';
  const attendee = event.attendeeEmail 
    ? `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${escapeIcsText(event.attendeeName)}:mailto:${event.attendeeEmail}\r\n` 
    : `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${escapeIcsText(event.attendeeName)}:mailto:guest@invite.internal\r\n`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ConnectWe//Executive Calendar 2.0//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatUtcDate(now)}`,
    `DTSTART:${formatUtcDate(event.startDate)}`,
    `DTEND:${formatUtcDate(endDate)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    organizer.trim(),
    attendee.trim(),
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:미팅 30분 전 알림: ${cleanTitle}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

/**
 * 브라우저에서 .ics 파일 원클릭 다운로드 트리거
 */
export function downloadIcsFile(event: CalendarEventPayload): void {
  const icsContent = generateIcsCalendarString(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `미팅초대_${event.attendeeName.replace(/\s+/g, '_')}_${new Date(event.startDate).toISOString().slice(0, 10)}.ics`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 정중한 C-Level 티타임 제안 및 일정 확정 서신 텍스트 생성
 */
export function generateInvitationLetter(
  person: Person,
  meetingDate: Date | string,
  venue: string,
  agendaSummary: string
): string {
  const d = typeof meetingDate === 'string' ? new Date(meetingDate) : (meetingDate instanceof Date ? meetingDate : new Date());
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const dateStr = validDate.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'short' 
  });
  const timeStr = validDate.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return `${person.currentCompany} ${person.name} ${person.currentTitle}님, 안녕하십니까.

바쁘신 경영 일정 중에도 소중한 티타임 일정에 흔쾌히 응해주셔서 진심으로 감사드립니다.

조율된 미팅 일정과 장소를 정중히 안내해 드립니다:

■ 일시: ${dateStr} ${timeStr}
■ 장소: ${venue}
■ 주요 나눔 의제:
${agendaSummary}

원활한 일정 등록을 위해 표준 캘린더(.ics) 초대 파일도 함께 첨부해 드립니다.
혹시 일정 변동이나 추가로 검토 필요하신 사항이 있으시면 언제든 편히 말씀해 주십시오.

당일 뜻깊은 혜안과 시너지를 나누는 귀한 시간이 되기를 기대하겠습니다.
감사합니다.

드림`;
}
