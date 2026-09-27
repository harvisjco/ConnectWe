import { Person } from '../types/network';

export type GeoClusterId = 
  | 'gangnam_teheran' 
  | 'pangyo' 
  | 'yeouido' 
  | 'gwanghwamun_jongno' 
  | 'yangjae_seocho' 
  | 'suwon_giheung'
  | 'seongsu';

export interface GeoCluster {
  id: GeoClusterId;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  keyCompanies: string[];
}

export const GEO_CLUSTERS: GeoCluster[] = [
  {
    id: 'gangnam_teheran',
    name: '테헤란로 / 강남 비즈니스 밸리',
    shortName: '강남·테헤란로',
    badge: '스타트업 & VC 허브',
    description: '강남파이낸스센터, 아크플레이스, 테헤란밸리 스타트업, 벤처캐피탈, IT 솔루션 밀집지',
    keyCompanies: ['토스', '야놀자', '하이퍼', '인베스트먼트', '파트너스', 'VC', '라인', '쿠팡']
  },
  {
    id: 'pangyo',
    name: '판교 테크노밸리',
    shortName: '판교 테크노밸리',
    badge: '빅테크 & 게임 메카',
    description: '알파돔시티, 카카오 아지트, 네이버 그린팩토리, 엔씨소프트, 크래프톤 등 국가대표 IT 거점',
    keyCompanies: ['네이버', '카카오', 'NAVER', '엔씨', '넥슨', '크래프톤', '두나무', '안랩', 'SK바이오']
  },
  {
    id: 'yeouido',
    name: '여의도 금융 & 핀테크 타운',
    shortName: '여의도 금융가',
    badge: '투자은행 & 자산운용',
    description: '파크원, IFC서울, 증권사 본사, 자산운용사, 핀테크 유니콘 및 금융감독원 인접지',
    keyCompanies: ['증권', '투자증권', '자산운용', '금융', '신한', 'KB', '하나', '우리', '카카오뱅크', '토스뱅크']
  },
  {
    id: 'gwanghwamun_jongno',
    name: '광화문 / 종로 도심 비즈니스',
    shortName: '광화문·종로',
    badge: '전통 대기업 & 지주사',
    description: 'SK서린빌딩, 그랑서울, 교보빌딩, 주요 4대 그룹 본사, 대형 로펌, 정부 부처 거점',
    keyCompanies: ['SK', '한화', 'LG', 'CJ', '현대건설', '교보', '로펌', 'KT']
  },
  {
    id: 'yangjae_seocho',
    name: '양재 / 서초 모빌리티 & AI R&D',
    shortName: '양재·서초 R&D',
    badge: '모빌리티 & 첨단 R&D',
    description: '현대자동차 양재 본사, 삼성전자 서울R&D캠퍼스, LG전자 양재센터, AI 특구',
    keyCompanies: ['현대자동차', '현대모비스', '기아', '모빌리티', '자율주행', '서초R&D']
  },
  {
    id: 'suwon_giheung',
    name: '수원 / 기흥 / 동탄 반도체 허브',
    shortName: '수원·기흥 반도체',
    badge: '글로벌 반도체 밸류체인',
    description: '삼성전자 디지털시티 본사, 기흥·화성 나노시티, 한미반도체, 글로벌 반도체 팹',
    keyCompanies: ['삼성전자', '한미반도체', 'SK하이닉스', '원익', '반도체', 'ASML', 'TEL']
  },
  {
    id: 'seongsu',
    name: '성수 / 서울숲 크리에이티브 & AI 밸리',
    shortName: '성수·서울숲',
    badge: '크리에이티브 & 생성형 AI',
    description: '크래프톤 메가타워, 무신사 캠퍼스, 쏘카 본사, 생성형 AI 스타트업, 헤이그라운드 소셜벤처',
    keyCompanies: ['크래프톤', '무신사', '쏘카', '뤼튼', '패스트파이브', '헤이그라운드', '오픈소버린', '코사이어티']
  }
];

export interface ClusterMatchResult {
  cluster: GeoCluster;
  people: Person[];
  dartExecutiveCount: number;
}

/**
 * 인맥의 회사명 및 메모를 바탕으로 거점 클러스터 매핑
 */
export function matchPersonToCluster(person: Person): GeoClusterId {
  const comp = (person.currentCompany || '').toLowerCase();
  const memo = (person.memo || '').toLowerCase();
  const fullText = `${comp} ${memo}`;

  // 1. 성수·서울숲 클러스터 (크리에이티브 & 생성형 AI 혁신 거점)
  if (
    fullText.includes('성수') || 
    fullText.includes('서울숲') || 
    fullText.includes('뚝섬') || 
    ['무신사', '쏘카', '뤼튼', '오픈소버린', '헤이그라운드', '코사이어티'].some(k => comp.includes(k.toLowerCase()) || memo.includes(k.toLowerCase())) ||
    (comp.includes('크래프톤') && (fullText.includes('성수') || !fullText.includes('판교')))
  ) {
    return 'seongsu';
  }

  // 2. 판교 테크노밸리
  if (fullText.includes('판교') || fullText.includes('삼평') || ['네이버', '카카오', 'naver', '엔씨', '넥슨', '두나무', '안랩'].some(k => comp.includes(k.toLowerCase()))) {
    return 'pangyo';
  }

  // 3. 여의도 금융가
  if (fullText.includes('여의도') || ['증권', '자산운용', '금융', '신한', 'kb', '하나', '우리'].some(k => comp.includes(k.toLowerCase()))) {
    return 'yeouido';
  }

  // 4. 광화문·종로
  if (fullText.includes('광화문') || fullText.includes('종로') || ['한화', 'cj'].some(k => comp.includes(k.toLowerCase()))) {
    return 'gwanghwamun_jongno';
  }

  // 5. 양재·서초 R&D
  if (fullText.includes('양재') || ['현대자동차', '현대차', '기아', '현대모비스'].some(k => comp.includes(k.toLowerCase()))) {
    return 'yangjae_seocho';
  }

  // 6. 수원·기흥 반도체
  if (fullText.includes('수원') || fullText.includes('기흥') || fullText.includes('화성') || ['삼성전자', '하이닉스', '반도체'].some(k => comp.includes(k.toLowerCase()))) {
    return 'suwon_giheung';
  }

  // 7. 기본 강남 테헤란로 (스타트업, 일반 IT, 테헤란로 중심)
  return 'gangnam_teheran';
}

/**
 * 전체 인맥을 7대 거점별로 클러스터링 및 통계 산출
 */
export function getGeoClusterBreakdown(people: Person[]): ClusterMatchResult[] {
  const map = new Map<GeoClusterId, Person[]>();

  GEO_CLUSTERS.forEach(c => map.set(c.id, []));

  people.forEach(p => {
    const clusterId = matchPersonToCluster(p);
    map.get(clusterId)?.push(p);
  });

  return GEO_CLUSTERS.map(cluster => {
    const clusterPeople = map.get(cluster.id) || [];
    const dartCount = clusterPeople.filter(p => p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector).length;
    return {
      cluster,
      people: clusterPeople,
      dartExecutiveCount: dartCount
    };
  });
}

export interface ProximityTeaBundleItem {
  person: Person;
  daysSinceContact: number;
  recommendScore: number;
  matchReasons: string[];
}

export interface ProximityTeaBundleResult {
  cluster: GeoCluster;
  bundleItems: ProximityTeaBundleItem[];
  totalInCluster: number;
}

/**
 * 특정 거점 방문 시 동선에 맞춰 함께 챙길 2~3명의 인연 번들 선별
 */
export function getProximityTeaBundles(people: Person[], clusterId: GeoClusterId): ProximityTeaBundleResult {
  const cluster = GEO_CLUSTERS.find(c => c.id === clusterId) || GEO_CLUSTERS[0];
  const clusterPeople = people.filter(p => matchPersonToCluster(p) === clusterId);

  const scoredItems: ProximityTeaBundleItem[] = clusterPeople.map(person => {
    let score = 50;
    const reasons: string[] = [];

    // 1. 소통 골든타임 경과 일수 계산
    let daysSince = 30;
    if (person.lastContactDate) {
      const last = new Date(person.lastContactDate).getTime();
      const now = Date.now();
      daysSince = Math.max(0, Math.floor((now - last) / (1000 * 60 * 60 * 24)));
    } else {
      daysSince = 90; // 미기록 시 기본 90일로 처리
    }

    if (daysSince >= 180) {
      score += 40;
      reasons.push(`마지막 교류 후 ${daysSince}일 경과 (소통 주기 최우선 갱신 요망)`);
    } else if (daysSince >= 60) {
      score += 25;
      reasons.push(`마지막 교류 후 ${daysSince}일 경과 (소통 골든타임 도래)`);
    }

    // 2. 친밀도 (핵심 1촌 우대)
    if (person.closeness === 2) {
      score += 20;
      reasons.push('핵심 교류 1촌 파트너');
    } else if (person.closeness === 1) {
      score += 15;
      reasons.push('직접 연결 1촌 인맥');
    }

    // 3. DART FACT 공시 임원
    if (person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector) {
      score += 15;
      reasons.push('DART 공시 공식 임원 재직');
    }

    // 4. 알럼나이 또는 풍부한 경력
    if (person.careers && person.careers.length >= 2) {
      score += 10;
      reasons.push(`풍부한 커리어 배경 (${person.careers[0].companyName} 등)`);
    }

    return {
      person,
      daysSinceContact: daysSince,
      recommendScore: score,
      matchReasons: reasons
    };
  });

  // 추천 점수 내림차순 정렬 후 상위 3명 선별
  scoredItems.sort((a, b) => b.recommendScore - a.recommendScore);

  return {
    cluster,
    bundleItems: scoredItems.slice(0, 3),
    totalInCluster: clusterPeople.length
  };
}

export type ProximityTeaType = 'CASUAL_TEA' | 'LUNCH_MEETING' | 'SYNERGY_TOUCH';

/**
 * 거점 외근 동선 맞춤형 티타임 제안 카피 생성
 */
export function generateProximityTeaCopy(
  person: Person,
  cluster: GeoCluster,
  type: ProximityTeaType = 'CASUAL_TEA',
  senderName: string = '홍길동'
): string {
  const name = person.name;
  const title = person.currentTitle;
  const company = person.currentCompany;
  const locName = cluster.shortName;

  if (type === 'CASUAL_TEA') {
    return `${name} ${title}님, 평안하신지요? ${senderName}입니다.
이번 주 ${locName} 인근에 업무 미팅 일정이 예정되어 있어 인사드립니다.
${company}에서 늘 훌륭한 성과 이끌어주시는 모습 멀리서나마 깊이 응원하고 있습니다.
혹시 일정 중 이동하시는 동선에 무리가 없으시다면, 인근에서 15~20분 내외로 가볍게 차 한 잔 나누며 안부 여쭙고 싶습니다.
편하신 날짜나 시간을 편하게 회신해 주시면 감사히 맞추겠습니다. 늘 건강 유의하세요!`;
  }

  if (type === 'LUNCH_MEETING') {
    return `${name} ${title}님께, 안녕하십니까. ${senderName}입니다.
다름이 아니오라 이번 주 ${locName}에 방문 일정이 잡혀, 평소 많은 가르침을 주시는 ${name}님 생각이 나 연락드리게 되었습니다.
${company}의 최근 역동적인 행보와 관련하여 근황도 여쭙고, 편안한 점심 식사 자리나 여유로운 티타임을 모실 수 있다면 큰 영광이겠습니다.
점심 일정 중 여유가 되시는 날을 편하게 말씀 주시면 감사하겠습니다.`;
  }

  // SYNERGY_TOUCH
  return `${name} ${title}님, 안녕하십니까! ${senderName}입니다.
이번에 저희 팀에서 추진 중인 프로젝트와 관련하여 ${locName}에 방문하게 되었습니다.
${company}에서 이끄시는 영역과 시너지를 모색해볼 수 있는 좋은 기회일 것 같아, 현장 방문 길에 15분 정도 가볍게 인사를 나누고 고견을 여쭙고자 합니다.
부담 없이 편하신 시간에 차 한 잔 나누실 수 있으실지 정중히 여쭙니다. 일정 회신 주시면 조율하겠습니다!`;
}

