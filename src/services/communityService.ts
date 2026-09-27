import { Person } from '../types/network';
import { AlumniGroup, Gathering, BirthdayContact } from '../types/community';

const GATHERINGS_STORAGE_KEY = 'connectwe_community_gatherings';
const BIRTHDAY_SENT_KEY = 'connectwe_birthday_sent_ids';

/**
 * 인물 목록으로부터 학연/전공/동아리/재직회사 기반 동문 그룹 자동 추출
 */
export function extractAlumniGroups(people: Person[]): AlumniGroup[] {
  const groups: AlumniGroup[] = [];
  const groupMap = new Map<string, { category: AlumniGroup['category']; categoryLabel: string; name: string; memberIds: string[] }>();

  // 기본 프리셋 그룹 (초/중/고/대/동아리/회사)
  const defaultGroups: { key: string; category: AlumniGroup['category']; categoryLabel: string; name: string }[] = [
    { key: 'univ-snu', category: 'university', categoryLabel: '대학교·대학원', name: '서울대학교 총동문 네트워크' },
    { key: 'univ-kaist', category: 'university', categoryLabel: '대학교·대학원', name: 'KAIST 전산학/공학 동문회' },
    { key: 'univ-yonsei', category: 'university', categoryLabel: '대학교·대학원', name: '연세대학교 상경대학 알럼나이' },
    { key: 'univ-korea', category: 'university', categoryLabel: '대학교·대학원', name: '고려대학교 교우회' },
    { key: 'high-gyeonggi', category: 'high', categoryLabel: '고등학교', name: '경기고등학교 동문 모임' },
    { key: 'high-seoul', category: 'high', categoryLabel: '고등학교', name: '서울과학고등학교 동문 네트워크' },
    { key: 'high-daewon', category: 'high', categoryLabel: '고등학교', name: '대원외국어고등학교 동문회' },
    { key: 'mid-gangnam', category: 'middle', categoryLabel: '중학교', name: '강남구 역삼/대치권 중학교 동창회' },
    { key: 'elem-central', category: 'elementary', categoryLabel: '초등학교', name: '초등학교 동창 친목 모임' },
    { key: 'club-band', category: 'club', categoryLabel: '동아리', name: '대학 락밴드/음악동아리 연합' },
    { key: 'club-golf', category: 'club', categoryLabel: '동아리', name: 'ConnectWe 주말 친선 골프/등산 모임' },
    { key: 'major-cs', category: 'major', categoryLabel: '전공', name: '컴퓨터공학 & AI 개발자 포럼' },
    { key: 'corp-naver', category: 'company', categoryLabel: '재직회사', name: '네이버(NAVER) 전현직 알럼나이' },
    { key: 'corp-samsung', category: 'company', categoryLabel: '재직회사', name: '삼성전자 전현직 패밀리' },
    { key: 'corp-kakao', category: 'company', categoryLabel: '재직회사', name: '카카오 크루 & 알럼나이' }
  ];

  defaultGroups.forEach(dg => {
    groupMap.set(dg.key, {
      category: dg.category,
      categoryLabel: dg.categoryLabel,
      name: dg.name,
      memberIds: []
    });
  });

  // 인물들의 학력, 회사, 전공 정보 매칭
  people.forEach(person => {
    const company = person.currentCompany || '';
    const academics = person.academics || [];
    const domain = person.primaryDomain || '';

    if (company.includes('네이버') || company.includes('NAVER')) {
      groupMap.get('corp-naver')?.memberIds.push(person.id);
    }
    if (company.includes('삼성')) {
      groupMap.get('corp-samsung')?.memberIds.push(person.id);
    }
    if (company.includes('카카오')) {
      groupMap.get('corp-kakao')?.memberIds.push(person.id);
    }

    if (domain.includes('AI') || domain.includes('개발') || domain.includes('소프트웨어')) {
      groupMap.get('major-cs')?.memberIds.push(person.id);
    }

    academics.forEach(ac => {
      const sName = ac.schoolName || '';
      if (sName.includes('서울대')) groupMap.get('univ-snu')?.memberIds.push(person.id);
      if (sName.includes('KAIST') || sName.includes('카이스트')) groupMap.get('univ-kaist')?.memberIds.push(person.id);
      if (sName.includes('연세')) groupMap.get('univ-yonsei')?.memberIds.push(person.id);
      if (sName.includes('고려')) groupMap.get('univ-korea')?.memberIds.push(person.id);
      if (sName.includes('경기고')) groupMap.get('high-gyeonggi')?.memberIds.push(person.id);
      if (sName.includes('과학고')) groupMap.get('high-seoul')?.memberIds.push(person.id);
      if (sName.includes('대원외고')) groupMap.get('high-daewon')?.memberIds.push(person.id);
    });

    // 골프/음악 동아리 등 임의 배정 (데모 풍부함)
    if (person.id.endsWith('1') || person.id.endsWith('4')) {
      groupMap.get('club-golf')?.memberIds.push(person.id);
    }
    if (person.id.endsWith('2') || person.id.endsWith('5')) {
      groupMap.get('club-band')?.memberIds.push(person.id);
    }
    if (person.id.endsWith('3') || person.id.endsWith('7')) {
      groupMap.get('elem-central')?.memberIds.push(person.id);
      groupMap.get('mid-gangnam')?.memberIds.push(person.id);
    }
  });

  groupMap.forEach((val, key) => {
    // 중복 제거
    const uniqueIds = Array.from(new Set(val.memberIds));
    groups.push({
      id: key,
      category: val.category,
      categoryLabel: val.categoryLabel,
      name: val.name,
      description: `${val.categoryLabel} 기반 교류 및 동문 커뮤니티`,
      iconName: val.category,
      memberCount: uniqueIds.length,
      memberIds: uniqueIds
    });
  });

  return groups;
}

/**
 * 인물 목록으로부터 다가오는 생일자 목록 계산
 */
export function getUpcomingBirthdays(people: Person[]): BirthdayContact[] {
  let sentSet = new Set<string>();
  try {
    const raw = localStorage.getItem(BIRTHDAY_SENT_KEY);
    if (raw) sentSet = new Set(JSON.parse(raw));
  } catch (e) {
    // ignore
  }

  const today = new Date();
  const todayMonth = today.getMonth() + 1; // 1-12
  const todayDate = today.getDate();

  const results: BirthdayContact[] = [];

  people.forEach((p, idx) => {
    // 생일 정보가 없으면 시뮬레이션 생일 생성 (데모 친화적)
    let m = todayMonth;
    let d = todayDate;
    if (idx === 0) {
      // 오늘 생일자 1명
      m = todayMonth;
      d = todayDate;
    } else if (idx === 1) {
      // 내일 생일자 1명
      m = todayMonth;
      d = todayDate + 1;
    } else if (idx === 2) {
      // 3일 뒤 생일자
      m = todayMonth;
      d = todayDate + 3;
    } else if (idx === 3) {
      // 5일 뒤 생일자
      m = todayMonth;
      d = todayDate + 5;
    } else {
      // 기타 날짜
      m = ((idx * 3) % 12) + 1;
      d = ((idx * 7) % 28) + 1;
    }

    const bdayStr = p.birthday || `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const [bMonth, bDay] = bdayStr.split('-').map(Number);

    // 이번 연도의 생일 날짜 계산
    const currentYear = today.getFullYear();
    let bdayDateObj = new Date(currentYear, bMonth - 1, bDay);
    if (bdayDateObj < new Date(currentYear, today.getMonth(), today.getDate())) {
      // 이미 지났으면 내년 생일
      bdayDateObj = new Date(currentYear + 1, bMonth - 1, bDay);
    }

    const diffTime = bdayDateObj.getTime() - new Date(currentYear, today.getMonth(), today.getDate()).getTime();
    const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // 다가오는 30일 이내 생일자만 선별
    if (daysUntil <= 30) {
      results.push({
        id: p.id,
        name: p.name,
        company: p.currentCompany,
        title: p.currentTitle,
        birthday: bdayStr,
        daysUntil,
        isToday: daysUntil === 0,
        mobile: p.mobile,
        hasCongratulated: sentSet.has(p.id)
      });
    }
  });

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function markBirthdayCongratulated(personId: string): void {
  try {
    const raw = localStorage.getItem(BIRTHDAY_SENT_KEY);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    set.add(personId);
    localStorage.setItem(BIRTHDAY_SENT_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error(e);
  }
}

/**
 * 기본 모임 및 로컬 스토리지 로드
 */
export function loadGatherings(): Gathering[] {
  try {
    const raw = localStorage.getItem(GATHERINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  const initialMockGatherings: Gathering[] = [
    {
      id: 'g-1',
      groupName: '서울대학교 총동문 네트워크',
      title: '2026 봄맞이 관악 동문 테헤란로 브런치 번개',
      category: '번개티타임',
      dateTime: '2026-10-15 11:30',
      location: '강남구 역삼동 센터필드 브런치 카페',
      maxAttendees: 8,
      fee: '각자 부담 (1/N)',
      organizerName: '김태호',
      organizerContact: '010-****-1234',
      description: '오랜만에 가볍게 커피와 브런치 즐기며 근황 나누실 선후배님들 편하게 모입니다.',
      attendees: [
        { personId: 'p-me', name: '나 (본인)', company: 'ConnectWe', title: '대표', joinedAt: '2026-09-20' },
        { personId: 'p-1', name: '김태호', company: '네이버', title: '책임리더', joinedAt: '2026-09-20' },
        { personId: 'p-2', name: '이지은', company: '카카오', title: '이사', joinedAt: '2026-09-21' }
      ],
      status: 'RECRUITING'
    },
    {
      id: 'g-2',
      groupName: '컴퓨터공학 & AI 개발자 포럼',
      title: '생성형 AI 에이전트 아키텍처 스터디 & 네트워킹',
      category: '세미나/스터디',
      dateTime: '2026-10-22 19:00',
      location: '판교 스타트업캠퍼스 세미나실 2호',
      maxAttendees: 15,
      fee: '15,000원 (다과비)',
      organizerName: '박준혁',
      description: '실무 엔지니어들과 함께 최신 멀티에이전트 시스템 구축 경험을 공유하는 세미나입니다.',
      attendees: [
        { personId: 'p-3', name: '박준혁', company: '라인', title: '엔지니어링 리드', joinedAt: '2026-09-22' },
        { personId: 'p-4', name: '최선우', company: '업스테이지', title: 'AI 리서처', joinedAt: '2026-09-23' }
      ],
      status: 'RECRUITING'
    },
    {
      id: 'g-3',
      groupName: 'ConnectWe 주말 친선 골프/등산 모임',
      title: '청계산 가을 단풍 산행 및 막걸리 친목회',
      category: '골프/운동',
      dateTime: '2026-10-25 09:00',
      location: '청계산입구역 2번 출구 만남의 광장',
      maxAttendees: 10,
      fee: '20,000원 (뒤풀이)',
      organizerName: '정동원',
      description: '부담 없는 완만한 등산 코스로 건강도 챙기고 인연도 쌓는 주말 산행입니다.',
      attendees: [
        { personId: 'p-5', name: '정동원', company: '삼성전자', title: '수석', joinedAt: '2026-09-24' }
      ],
      status: 'RECRUITING'
    }
  ];

  saveGatherings(initialMockGatherings);
  return initialMockGatherings;
}

export function saveGatherings(gatherings: Gathering[]): void {
  try {
    localStorage.setItem(GATHERINGS_STORAGE_KEY, JSON.stringify(gatherings));
  } catch (e) {
    console.error(e);
  }
}

/**
 * 소모임 참가 신청/취소 토글
 */
export function toggleJoinGathering(gatheringId: string, currentMember: { id: string; name: string; company: string; title: string }): Gathering[] {
  const list = loadGatherings();
  const updated = list.map(g => {
    if (g.id !== gatheringId) return g;

    const alreadyJoined = g.attendees.some(a => a.personId === currentMember.id);
    if (alreadyJoined) {
      // 취소
      return {
        ...g,
        attendees: g.attendees.filter(a => a.personId !== currentMember.id),
        status: 'RECRUITING' as const
      };
    } else {
      // 신청
      if (g.attendees.length >= g.maxAttendees) return g;
      const newAttendees = [
        ...g.attendees,
        {
          personId: currentMember.id,
          name: currentMember.name,
          company: currentMember.company,
          title: currentMember.title,
          joinedAt: new Date().toISOString().split('T')[0]
        }
      ];
      return {
        ...g,
        attendees: newAttendees,
        status: newAttendees.length >= g.maxAttendees ? ('CLOSED' as const) : ('RECRUITING' as const)
      };
    }
  });

  saveGatherings(updated);
  return updated;
}

/**
 * 축하 메시지 생성기 (정중 / 친근 / 동문)
 */
export function generateBirthdayMessage(contact: BirthdayContact, tone: 'polite' | 'friendly' | 'alumni'): string {
  if (tone === 'polite') {
    return `${contact.name}님, 생신을 진심으로 축하드립니다! 올 한 해도 건강과 행복이 가득하시길 바라며, 하시는 모든 비즈니스와 일상에 늘 큰 보람과 성공이 함께하시길 응원합니다. 언제나 든든한 인연에 감사드립니다.`;
  } else if (tone === 'friendly') {
    return `${contact.name}님, 오늘 생일 정말 축하드려요! 🎂 맛있는 음식도 많이 드시고 소중한 분들과 행복한 하루 보내세요! 조만간 편하실 때 커피 한잔 같이해요 :)`;
  } else {
    return `${contact.name}님, 생일 축하드립니다! 동문으로서 늘 멋지게 활약하시는 모습 보며 큰 자긍심을 느낍니다. 뜻깊고 행복한 생일 보내시고, 다음 동문 모임 때 반갑게 뵙겠습니다! 🎉`;
  }
}
