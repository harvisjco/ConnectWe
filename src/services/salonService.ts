import { Person } from '../types/network';
import { GeoClusterId, GEO_CLUSTERS, matchPersonToCluster } from './geoProximityService';
import { TalentClusterId, identifyTalentCluster } from './talentClusterEngine';
import { PrivateSalonSession } from '../types/salon';

const SALON_STORAGE_KEY = 'connectwe_salons_v1';

/**
 * 7대 거점 및 인재 클러스터 기반 살롱 추천 게스트 발굴 (최대 6인)
 */
export function getRecommendedSalonGuests(
  people: Person[],
  clusterId: GeoClusterId,
  targetClusterIds?: TalentClusterId[]
): Person[] {
  // 1. 해당 거점에 상주하거나 매핑된 인맥 우선 필터링 (본인 제외)
  const candidates = people.filter(p => p.closeness !== 1);
  const geoMatched = candidates.filter(p => matchPersonToCluster(p) === clusterId);

  // 거점 매핑 인맥이 적을 경우 전체 인맥에서 선별
  const pool = geoMatched.length >= 3 ? geoMatched : candidates;

  return pool
    .sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // 거점 매핑 일치 가산점
      if (matchPersonToCluster(a) === clusterId) scoreA += 15;
      if (matchPersonToCluster(b) === clusterId) scoreB += 15;

      // 타깃 인재 클러스터 일치 가산점
      const clusterA = identifyTalentCluster(a);
      const clusterB = identifyTalentCluster(b);
      if (targetClusterIds && targetClusterIds.includes(clusterA.id)) scoreA += 20;
      if (targetClusterIds && targetClusterIds.includes(clusterB.id)) scoreB += 20;

      // DART 공시 실명 팩트 가산점
      if (a.sourceType === 'DART_FACT' || !!a.dartInfo) scoreA += 10;
      if (b.sourceType === 'DART_FACT' || !!b.dartInfo) scoreB += 10;

      // 핵심 친밀도(2촌 우선)
      if (a.closeness === 2) scoreA += 10;
      if (b.closeness === 2) scoreB += 10;

      return scoreB - scoreA;
    })
    .slice(0, 6);
}

/**
 * 품격 있는 살롱·티타임 초대장 카피 자동 생성 (카카오톡/문자용)
 */
export function generateSalonInvitation(
  session: PrivateSalonSession,
  guest: Person,
  hostName: string = '대표'
): string {
  const geo = GEO_CLUSTERS.find(g => g.id === session.clusterId);
  const geoName = geo ? geo.shortName : '거점';

  const chathamRuleNotice = session.chathamHouseRule
    ? '\n• 원칙: 모임에서 나눈 고민과 경험은 외부에 발설하지 않는 채텀하우스 룰(Chatham House Rule)을 준수하며, 노골적인 영업이나 피칭은 일체 배제합니다.'
    : '';

  return `[초대] ${session.title}

${guest.name} ${guest.currentTitle}님, 평안하신지요? ${hostName}입니다.

최근 ${geoName} 인근에서 ${session.topic}에 대해 현업에서 가장 치열하게 고민하고 계신 리더분들을 모시고, 편안한 차 한 잔 나누며 깊이 있는 경험을 나누는 작은 프라이빗 티 살롱을 마련하고자 합니다.

• 일시: ${session.scheduledAt}
• 장소: ${session.locationName}
• 대화 주제: "${session.topic}"
• 참석자: ${geoName} 소재 테크 리더, AI 파운더, C-Level 5~6인 프라이빗${chathamRuleNotice}

${guest.name}님께서 평소 고민해 오신 통찰을 함께 나눠주신다면 자리가 한층 더 뜻깊을 것 같아 가장 먼저 초대 말씀 전합니다. 부담 없이 편안한 마음으로 차 한 잔 하러 오신다는 생각으로 함께해 주시면 큰 영광이겠습니다.

참석 가능 여부만 편하게 회신 부탁드립니다. 감사합니다!`;
}

/**
 * 모임 당일용 1-Page 게스트 통합 브리프 시트 생성 (A4 인쇄 대응 텍스트)
 */
export function generateSalonBriefing(
  session: PrivateSalonSession,
  guests: Person[]
): string {
  const geo = GEO_CLUSTERS.find(g => g.id === session.clusterId);
  const header = `========================================================================
[ConnectWe 1-Page 프라이빗 살롱 브리프] ${session.title}
일시: ${session.scheduledAt} | 장소: ${session.locationName} (${geo?.name || ''})
주제: ${session.topic}
========================================================================\n\n`;

  const guestBriefs = guests.map((g, idx) => {
    const cluster = identifyTalentCluster(g);
    const dartBadge = g.dartInfo ? ` [DART 실공시: ${g.dartInfo.registeredRole || '임원'}]` : '';
    const careers = g.careers.map(c => `${c.companyName} (${c.title})`).join(' ➔ ');

    return `[참석자 ${idx + 1}] ${g.name} ${g.currentTitle} (${g.currentCompany})
• 인재 분류: ${cluster.label} (${cluster.description})
• 이력 요약: ${careers || '주요 경력 확인됨'}${dartBadge}
• 핵심 역량: ${g.skills?.join(', ') || g.primaryDomain}
• 사전 화두: "${g.name}님의 ${g.currentCompany} 최근 행보 및 ${session.topic} 연계 관점 질문하기"
• 메모: ${g.memo || '특이사항 없음'}
------------------------------------------------------------------------`;
  }).join('\n\n');

  return header + guestBriefs;
}

/**
 * 기본 살롱 세션 초기 시드
 */
export const INITIAL_SALON_SEED: PrivateSalonSession[] = [
  {
    id: 'salon-seongsu-ai',
    title: '성수 AI 빌더스 프라이빗 티 살롱',
    clusterId: 'seongsu',
    topic: '생성형 AI 에이전트 현업 실전 적용기와 한계',
    scheduledAt: '2026-10-16(금) 오전 08:30 ~ 09:40',
    locationName: '성수 코사이어티 1층 프라이빗 라운지',
    targetTalentClusterIds: ['TECH_FELLOW', 'VENTURE_LEADER'],
    curatedGuestIds: ['p_6', 'p_8', 'p_11'],
    confirmedGuestIds: ['p_6', 'p_11'],
    chathamHouseRule: true,
    notes: '성수동 AI 스타트업 창업가 및 크래프톤 CAIO와 함께하는 실전 적용 워크플로우 논의',
    status: 'PLANNED',
    createdAt: new Date().toISOString()
  }
];

export function loadSalonSessions(): PrivateSalonSession[] {
  try {
    const raw = localStorage.getItem(SALON_STORAGE_KEY);
    if (!raw) {
      saveSalonSessions(INITIAL_SALON_SEED);
      return INITIAL_SALON_SEED;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SALON_SEED;
  }
}

export function saveSalonSessions(sessions: PrivateSalonSession[]): void {
  try {
    localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save salons', e);
  }
}
