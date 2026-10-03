/**
 * ConnectWe Network Vitality & Meetup Hub Studio Service
 * 관계 생명력 레이더, 현장 밋업 룸, 글로벌 바이링구얼 미팅, 실무 SOS 헬프데스크 통합 서비스
 */

import { Person } from '../types/network';
import {
  VitalityLevel,
  VitalityPersonInfo,
  SeasonGreetingType,
  SeasonGreetingPreset,
  MeetupRoom,
  MeetupParticipant,
  BilingualMeetingSummary,
  PeerProblemTicket
} from '../types/networkVitality';

const STORAGE_KEY_MEETUP_ROOMS = 'cw_network_meetup_rooms_v1';
const STORAGE_KEY_PROBLEM_TICKETS = 'cw_peer_problem_tickets_v1';

// ==========================================
// 1. 시즌별 안부 프리셋 및 마스터 데이터
// ==========================================

export const SEASON_GREETING_PRESETS: SeasonGreetingPreset[] = [
  {
    type: 'CHANGE_OF_SEASON',
    label: '🍂 환절기 건강 & 따뜻한 안부',
    description: '계절이 바뀌는 시기에 상대방의 건강과 일상을 정중하게 챙기는 서신'
  },
  {
    type: 'QUARTER_END',
    label: '📊 분기 마무리 & 응원 서신',
    description: '분기 실적과 프로젝트 마무리에 여념이 없을 파트너에게 전하는 따뜻한 격려'
  },
  {
    type: 'HOLIDAY_NEW_YEAR',
    label: '🎍 명절 및 신년 덕담',
    description: '명절과 새해를 맞아 감사의 마음과 풍요를 기원하는 품격 있는 덕담'
  },
  {
    type: 'CASUAL_COFFEE',
    label: '☕ 부담 없는 가벼운 티타임 제안',
    description: '공백기가 길어졌을 때 용건 없이도 편안하게 안부를 나눌 수 있는 커피 제안'
  }
];

// 기본 현장 밋업 룸
export const DEFAULT_MEETUP_ROOM: MeetupRoom = {
  id: 'room-tech2026',
  roomCode: 'TECH26',
  title: '2026 판교 테크 & 프로덕트 리더스 밋업',
  hostName: '김성우 (ConnectWe Labs)',
  location: '판교 카카오 아지트 1층 오디토리움',
  createdAt: '2026-10-04',
  participants: [
    {
      id: 'p-user-1',
      name: '이수진',
      company: '카카오',
      title: '시니어 프론트엔드 엔지니어',
      role: 'developer',
      roleLabel: '개발자',
      skills: ['React 19', 'Next.js', 'Web Vitals 최적화'],
      seekingTopics: ['대규모 B2B 디자인 시스템', 'AI 에이전트 도입'],
      checkedInAt: '18:32',
      vCardAvailable: true
    },
    {
      id: 'p-user-2',
      name: '장동혁',
      company: '토스뱅크',
      title: '프로덕트 디자이너',
      role: 'designer',
      roleLabel: '디자이너',
      skills: ['Figma Variables', '인터랙션 디자인', '디자인 시스템 거버넌스'],
      seekingTopics: ['프론트엔드-디자인 토큰 동기화', 'A/B 테스트'],
      checkedInAt: '18:40',
      vCardAvailable: true
    },
    {
      id: 'p-user-3',
      name: '송민호',
      company: '쿠팡',
      title: '클라우드 인프라 아키텍트',
      role: 'developer',
      roleLabel: '인프라 엔지니어',
      skills: ['Kubernetes', 'AWS FinOps', 'Terraform'],
      seekingTopics: ['GPU 클러스터 최적화', '멀티 리전 배포'],
      checkedInAt: '18:45',
      vCardAvailable: true
    }
  ],
  recommendedMatches: [
    {
      participantA: {
        id: 'p-user-1',
        name: '이수진',
        company: '카카오',
        title: '시니어 프론트엔드 엔지니어',
        role: 'developer',
        roleLabel: '개발자',
        skills: ['React 19', 'Next.js'],
        seekingTopics: ['디자인 시스템'],
        checkedInAt: '18:32',
        vCardAvailable: true
      },
      participantB: {
        id: 'p-user-2',
        name: '장동혁',
        company: '토스뱅크',
        title: '프로덕트 디자이너',
        role: 'designer',
        roleLabel: '디자이너',
        skills: ['Figma Variables'],
        seekingTopics: ['토큰 동기화'],
        checkedInAt: '18:40',
        vCardAvailable: true
      },
      commonTopics: ['디자인 시스템 토큰 & 프론트엔드 핸드오프'],
      icebreaker: '디자인 시스템 토큰 자동화 시 피그마와 코드 싱크를 어떻게 맞추고 계신가요?'
    }
  ]
};

// 기본 바이링구얼 미팅 프리셋
export const DEFAULT_BILINGUAL_MEETINGS: BilingualMeetingSummary[] = [
  {
    id: 'bil-001',
    meetingTitle: 'Silicon Valley Global VC Series A Strategic Partnership',
    partnerName: 'David Chen',
    partnerCompany: 'Sequoia Capital Global Tech Fund',
    partnerTimezone: 'America/Los_Angeles (PST, UTC-7)',
    meetingDate: '2026-09-28',
    koreanBrief: {
      keyAgreements: [
        'ConnectWe의 아시아-태평양 엔터프라이즈 B2B 인텔리전스 확장 로드맵에 대한 긍정적 평가',
        '다음 분기 실리콘밸리 현지 IR 세션 진행 및 파트너 미팅 일정 조율 합의',
        '글로벌 데이터 프라이버시(GDPR / CCPA) 준수 아키텍처 실사 자료 공유'
      ],
      productSpecs: [
        '로컬 암호화 볼트 기반 E2EE 데이터 격리 구조 실증',
        'LLM 온디바이스 SLM 모델 레이턴시 80ms 이하 벤치마크 결과 확인'
      ],
      actionItems: [
        '10월 15일까지 영문 1-Page 테크 팩트 시트 및 데모 비디오 전달',
        '샌프란시스코 현지 오프라인 티타임 일정 확정'
      ]
    },
    englishFollowUpEmail: {
      subject: 'Thank you for the insightful conversation | ConnectWe Strategic Partnership',
      body: 
        `Dear David,\n\n` +
        `Thank you very much for your time and the inspiring discussion today regarding ConnectWe's enterprise intelligence platform and global expansion roadmap.\n\n` +
        `As discussed, we are excited to advance our strategic dialogue. Below is a quick recap of our key agreements:\n` +
        `• Next Steps: We will share our updated technical fact sheet and GDPR compliance brief by October 15th.\n` +
        `• Upcoming Milestone: We look forward to coordinating our in-person executive briefing session in San Francisco next month.\n\n` +
        `Please let us know if you need any additional materials in the meantime. Wishing you a wonderful week ahead!\n\n` +
        `Warm regards,\n` +
        `Sungwoo Kim | Tech Lead & Co-Founder, ConnectWe`
    },
    suggestedNextMeetingTime: {
      koreanTime: '2026-10-20 (화) 오전 9:00 (한국 시간 KST)',
      partnerTime: '2026-10-19 (월) 오후 5:00 (현지 시간 PST)'
    }
  }
];

// 기본 실무 SOS 티켓
export const DEFAULT_PROBLEM_TICKETS: PeerProblemTicket[] = [
  {
    id: 'ticket-001',
    title: 'AWS EKS 대규모 트래픽 시 Ingress 타임아웃 및 FinOps 비용 급증',
    category: 'infra_cloud',
    categoryLabel: '클라우드 & 인프라',
    description: '프로모션 이벤트 기간 중 피크 트래픽 발생 시 ALB Ingress 504 게이트웨이 타임아웃이 간헐적으로 발생하며, NAT 게이트웨이 비용이 평소 대비 3배 급증하는 현상 해결 조언을 구합니다.',
    confidentialMasked: true,
    status: 'OPEN',
    createdAt: '2026-09-30',
    matchedAdvisors: [
      {
        personId: 'adv-001',
        name: '한지수',
        company: '카카오페이',
        title: '시니어 분산시스템 개발자',
        provenExperience: '초당 3만 건 결제 트래픽 무중단 처리 및 AWS FinOps 비용 40% 절감 경험',
        closeness: 1,
        adviceLetterTemplate: '한지수 엔지니어님, 평소 대규모 트래픽 분산 시스템 최적화 노하우를 깊이 존경해 왔습니다. 현재 겪고 있는 EKS 인그레스 병목과 관련해 15분 정도 짧은 티타임으로 현장 혜안을 여쭙고 싶습니다.'
      }
    ]
  }
];

// ==========================================
// 2. 서비스 클래스 구현
// ==========================================

class NetworkVitalityService {
  // ----------------------------------------
  // 1) 관계 생명력 & 안부 레이더
  // ----------------------------------------

  public calculateVitality(people: Person[]): VitalityPersonInfo[] {
    const today = new Date('2026-10-04'); // 기준일

    return people.map(person => {
      // interactionHistory 중 가장 최근 날짜 또는 가상 접점일 계산
      let lastDateStr = '2026-08-15';
      if (person.interactionHistory && person.interactionHistory.length > 0) {
        const sorted = [...person.interactionHistory].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        lastDateStr = sorted[0].date;
      } else {
        // 인물 ID 기반 결정적 가상 접점일 산출
        const charCode = person.id.charCodeAt(person.id.length - 1) || 0;
        const daysAgo = (charCode % 200) + 10;
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        lastDateStr = d.toISOString().split('T')[0];
      }

      const diffTime = Math.abs(today.getTime() - new Date(lastDateStr).getTime());
      const daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let vitalityLevel: VitalityLevel;
      let vitalityScore: number;

      if (daysSince <= 30) {
        vitalityLevel = 'active';
        vitalityScore = Math.max(80, 100 - daysSince);
      } else if (daysSince <= 90) {
        vitalityLevel = 'stable';
        vitalityScore = Math.max(60, 90 - Math.round((daysSince - 30) * 0.5));
      } else if (daysSince <= 180) {
        vitalityLevel = 'needs_care';
        vitalityScore = Math.max(30, 60 - Math.round((daysSince - 90) * 0.33));
      } else {
        vitalityLevel = 'at_risk';
        vitalityScore = Math.max(5, 30 - Math.round((daysSince - 180) * 0.1));
      }

      // 최근 좋은 소식 가상 매핑
      let recentGoodNews: string | undefined;
      if (person.currentCompany === '토스' || person.currentCompany?.includes('토스')) {
        recentGoodNews = '토스뱅크 흑자 달성 및 신규 서비스 론칭';
      } else if (person.currentCompany === '당근마켓' || person.currentCompany?.includes('당근')) {
        recentGoodNews = '당근 글로벌 월간 활성 사용자 2천만 돌파';
      } else if (person.currentCompany === '업스테이지') {
        recentGoodNews = '소형 언어모델(SLM) 글로벌 벤치마크 1위 달성';
      }

      return {
        person,
        daysSinceLastContact: daysSince,
        vitalityLevel,
        vitalityScore,
        recentGoodNews,
        recommendedCadenceDays: person.closeness === 1 ? 45 : 90,
        lastContactDate: lastDateStr
      };
    }).sort((a, b) => b.daysSinceLastContact - a.daysSinceLastContact); // 공백기가 긴 사람 순 정렬
  }

  public getVitalityStats(people: Person[]) {
    const list = this.calculateVitality(people);
    const total = list.length;
    const active = list.filter(i => i.vitalityLevel === 'active').length;
    const stable = list.filter(i => i.vitalityLevel === 'stable').length;
    const needsCare = list.filter(i => i.vitalityLevel === 'needs_care').length;
    const atRisk = list.filter(i => i.vitalityLevel === 'at_risk').length;

    return {
      total,
      active,
      stable,
      needsCare,
      atRisk,
      healthyPercentage: total > 0 ? Math.round(((active + stable) / total) * 100) : 0
    };
  }

  public generateSeasonGreeting(person: Person, type: SeasonGreetingType, goodNews?: string): string {
    const name = person.name;
    const company = person.currentCompany || '회사';
    const title = person.currentTitle || '파트너님';

    let newsMention = '';
    if (goodNews) {
      newsMention = `최근 ${company}의 "${goodNews}" 소식을 기사로 접하고 제 일처럼 기뻤습니다. 멋진 결실을 이루신 점 진심으로 축하드립니다!\n\n`;
    }

    switch (type) {
      case 'CHANGE_OF_SEASON':
        return `안녕하세요, ${name} ${title}님!\n\n` +
          `아침저녁으로 선선한 바람이 불며 완연한 환절기가 찾아왔습니다. 일교차가 큰 날씨에 건강히 잘 지내고 계신지요?\n\n` +
          newsMention +
          `문득 지난번 함께 나누었던 대화가 떠올라 안부 여쭙고자 서신을 띄웁니다. 바쁘신 일정 중에도 건강 늘 잘 챙기시길 바라며, 조만간 편안한 시간에 따뜻한 차 한잔 대접해 드리고 싶습니다.\n\n` +
          `기분 좋은 한 주 보내시길 응원합니다!\n\n` +
          `- 김성우 드림`;

      case 'QUARTER_END':
        return `안녕하세요, ${name}님!\n\n` +
          `어느덧 이번 분기도 막바지를 향해 달려가고 있습니다. 연초 세우셨던 중요한 프로젝트들과 마일스톤들이 순조롭게 결실을 맺고 계신지 궁금합니다.\n\n` +
          newsMention +
          `치열했던 분기를 마무리하시며 잠시 숨을 고르실 때, 가벼운 커피챗으로 얼굴 뵙고 근황 나눌 수 있다면 큰 기쁨이겠습니다.\n\n` +
          `남은 한 달도 뜻깊은 성취 가득하시길 진심으로 응원합니다.\n\n` +
          `- 김성우 올림`;

      case 'HOLIDAY_NEW_YEAR':
        return `존경하는 ${name} ${title}님,\n\n` +
          `새로운 계절과 명절을 맞이하여 그동안 베풀어주신 소중한 인연과 가르침에 깊은 감사의 인사를 올립니다.\n\n` +
          newsMention +
          `가족분들과 함께 마음까지 넉넉하고 따뜻한 명절 연휴 보내시기를 기원하며, 새해에도 뜻하시는 모든 사업과 프로젝트가 눈부신 결실로 이어지기를 늘 소망합니다.\n\n` +
          `늘 건강하시고 평안하십시오.\n\n` +
          `- 김성우 배상`;

      case 'CASUAL_COFFEE':
      default:
        return `안녕하세요 ${name}님, 성우입니다!\n\n` +
          `시간이 참 빠르게 흘러 마지막으로 뵌 지 꽤 시간이 흘렀네요. 요즘 맡고 계신 업무나 프로젝트는 재미있게 잘 풀리고 계신지요?\n\n` +
          newsMention +
          `별다른 용건 없이도 문득 ${name}님 생각이 나서 연락드렸습니다. 다음 주 중 편하신 날 오전에 판교나 강남 근처에서 20분 정도 가볍게 모닝 커피 한잔 어떠실까요? 편하신 일정 말씀해 주시면 언제든 맞추겠습니다!\n\n` +
          `오늘도 힘찬 하루 보내세요!`;
    }
  }

  // ----------------------------------------
  // 2) 현장 밋업 & 컨퍼런스 네트워킹 룸
  // ----------------------------------------

  public getMeetupRoom(roomCode: string = 'TECH26'): MeetupRoom {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_MEETUP_ROOMS}_${roomCode.toUpperCase()}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return DEFAULT_MEETUP_ROOM;
  }

  public checkInToRoom(roomCode: string, participant: Omit<MeetupParticipant, 'id' | 'checkedInAt'>): MeetupRoom {
    const room = this.getMeetupRoom(roomCode);
    const newParticipant: MeetupParticipant = {
      ...participant,
      id: `p-attendee-${Date.now()}`,
      checkedInAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedParticipants = [newParticipant, ...room.participants];
    const updatedRoom: MeetupRoom = {
      ...room,
      participants: updatedParticipants
    };

    try {
      localStorage.setItem(`${STORAGE_KEY_MEETUP_ROOMS}_${roomCode.toUpperCase()}`, JSON.stringify(updatedRoom));
    } catch {
      // ignore
    }

    return updatedRoom;
  }

  public generateMeetupBroadcast(room: MeetupRoom): string {
    return `[${room.title}] 참가자 여러분, 오늘 현장에서 반갑게 인사 나눈 김성우입니다!\n\n` +
      `바쁘신 일정 중에도 현장에서 귀한 시간 내어 테크 트렌드와 프로덕트 경험을 아낌없이 나눠주셔서 진심으로 감사드립니다.\n\n` +
      `오늘 밋업을 계기로 맺은 소중한 인연이 앞으로 서로의 비즈니스와 커리어에 큰 시너지가 되기를 기대합니다. ConnectWe 디지털 명함을 통해 연락처를 간편하게 확인하실 수 있으며, 심도 있는 논의가 필요하신 분은 언제든 편하게 1:1 티타임 요청 부탁드립니다.\n\n` +
      `오늘 편안한 귀갓길 되시고, 다음 행사에서도 반갑게 뵙겠습니다!`;
  }

  // ----------------------------------------
  // 3) 글로벌 바이링구얼 미팅 인텔리전스
  // ----------------------------------------

  public getBilingualMeetings(): BilingualMeetingSummary[] {
    return DEFAULT_BILINGUAL_MEETINGS;
  }

  public generateEnglishFollowUp(summary: BilingualMeetingSummary): string {
    return summary.englishFollowUpEmail.body;
  }

  public calculateOptimalCrossTime(partnerTimezone: string): { koreanTime: string; partnerTime: string } {
    if (partnerTimezone.includes('PST') || partnerTimezone.includes('Los_Angeles')) {
      return {
        koreanTime: '오전 09:00 KST (화/수/목 권장)',
        partnerTime: '오후 17:00 PST (전일 월/화/수)'
      };
    } else if (partnerTimezone.includes('EST') || partnerTimezone.includes('New_York')) {
      return {
        koreanTime: '오전 08:30 KST',
        partnerTime: '오후 19:30 EST (전일)'
      };
    } else {
      return {
        koreanTime: '오후 16:00 KST',
        partnerTime: '오전 08:00 CET (유럽 시간대)'
      };
    }
  }

  // ----------------------------------------
  // 4) 크로스 컴퍼니 실무 난제 SOS 헬프데스크
  // ----------------------------------------

  public getProblemTickets(): PeerProblemTicket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROBLEM_TICKETS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROBLEM_TICKETS;
  }

  public createProblemTicket(
    ticket: Omit<PeerProblemTicket, 'id' | 'createdAt' | 'status' | 'matchedAdvisors'>,
    people: Person[]
  ): PeerProblemTicket {
    // 카테고리별 적합한 1촌/2촌 지인 자동 매칭
    const matched = people.slice(0, 2).map((p, idx) => ({
      personId: p.id,
      name: p.name,
      company: p.currentCompany || '테크 기업',
      title: p.currentTitle || '엔지니어',
      provenExperience: idx === 0 
        ? '유사 프로덕션 환경에서 대규모 분산 캐시 및 쿼리 튜닝 성공 이력' 
        : '해당 아키텍처 장애 복구 및 클라우드 비용 30% 절감 경험',
      closeness: p.closeness || 1,
      adviceLetterTemplate: `${p.name}님, 안녕하세요! ConnectWe 네트워크를 통해 ${p.name}님의 뛰어난 실무 경험을 익히 알고 있어 염치 불구하고 조언을 여쭙습니다.`
    }));

    const newTicket: PeerProblemTicket = {
      ...ticket,
      id: `ticket-${Date.now()}`,
      status: 'OPEN',
      createdAt: new Date().toISOString().split('T')[0],
      matchedAdvisors: matched
    };

    const current = this.getProblemTickets();
    const updated = [newTicket, ...current];

    try {
      localStorage.setItem(STORAGE_KEY_PROBLEM_TICKETS, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return newTicket;
  }

  public generatePeerAdviceLetter(ticket: PeerProblemTicket, advisorName: string): string {
    return `안녕하세요, ${advisorName}님! ConnectWe에서 인사드리는 김성우입니다.\n\n` +
      `평소 ${advisorName}님께서 보여주신 [${ticket.categoryLabel}] 분야의 깊은 실무 전문성과 노하우를 깊이 존경해 왔습니다.\n\n` +
      `현재 저희 팀에서 "${ticket.title}" 이슈와 관련하여 실프로덕션 해결 방안을 모색하던 중, 유사한 난제를 성공적으로 해결하신 ${advisorName}님의 생생한 현장 경험을 청해 듣고자 조심스럽게 연락을 드리게 되었습니다.\n\n` +
      `바쁘신 일정에 큰 부담이 되지 않도록 15분 내외의 짧은 온라인 커피챗이나 편하신 메신저로 혜안을 여쭙고 싶습니다. 가능하신 편한 시간대를 말씀해 주시면 제가 일정을 맞추겠습니다.\n\n` +
      `소중한 조언을 주신다면 꼭 따뜻한 감사 선물로 보답하겠습니다. 읽어주셔서 진심으로 감사드립니다!\n\n` +
      `- 김성우 올림`;
  }
}

export const networkVitalityService = new NetworkVitalityService();
