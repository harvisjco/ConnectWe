import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadExpertMentorProfiles, 
  filterExpertProfiles, 
  generateKnowledgeCoffeeChatLetter, 
  markConsultationSent, 
  getKnowledgeSummaryStats,
  saveExpertMentorProfiles
} from '../knowledgeExchangeService';
import { Person } from '../../types/network';

const MOCK_PEOPLE: Person[] = [
  {
    id: 'p-1',
    name: '윤서진',
    currentCompany: '하이퍼플로우 랩스',
    currentDepartment: '기술팀',
    currentTitle: 'Lead Builder',
    mobile: '010-1111-2222',
    email: 'seojin@hyperflow.ai',
    primaryDomain: '모바일 AI',
    skills: ['React', 'Next.js', 'PyTorch'],
    estimatedAgeGroup: '30s',
    isAgeEstimated: true,
    sourceType: 'SOURCE_DATA',
    closeness: 4,
    connectionChannel: 'manual',
    isStale: false,
    careers: [],
    academics: []
  },
  {
    id: 'p-2',
    name: '강민석',
    currentCompany: '핀스케일',
    currentDepartment: '엔지니어링',
    currentTitle: 'CTO',
    mobile: '010-3333-4444',
    email: 'minseok@finscale.io',
    primaryDomain: '핀테크 인프라',
    skills: ['Kubernetes', 'Go', 'AWS'],
    estimatedAgeGroup: '30s',
    isAgeEstimated: true,
    sourceType: 'SOURCE_DATA',
    closeness: 5,
    connectionChannel: 'manual',
    isStale: false,
    careers: [],
    academics: []
  }
];

describe('knowledgeExchangeService - 실무 슈퍼파워 지식 교환 & 캐주얼 멘토링 팟 검증', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('1. 1촌 및 2촌 동료 공유 인맥 기반의 슈퍼파워 전문가 프로필이 정상 로드되어야 한다', () => {
    const profiles = loadExpertMentorProfiles(MOCK_PEOPLE);
    expect(profiles.length).toBeGreaterThanOrEqual(5);

    const firstDegree = profiles.filter(p => p.degree === 1);
    const secondDegree = profiles.filter(p => p.degree === 2);
    expect(firstDegree.length).toBeGreaterThan(0);
    expect(secondDegree.length).toBeGreaterThan(0);

    const k8sExpert = profiles.find(p => p.personName === '강동원');
    expect(k8sExpert).toBeDefined();
    expect(k8sExpert?.degree).toBe(2);
    expect(k8sExpert?.bridgeColleagueName).toBe('강민석');
    expect(k8sExpert?.recommendedAgenda.length).toBe(3);
  });

  it('2. 카테고리별(엔지니어링, AI, 그로스, 디자인) 필터링이 정확하게 작동해야 한다', () => {
    const profiles = loadExpertMentorProfiles(MOCK_PEOPLE);

    const engOnly = filterExpertProfiles(profiles, 'ENGINEERING');
    expect(engOnly.every(p => p.primaryTopic.category === 'ENGINEERING')).toBe(true);

    const aiOnly = filterExpertProfiles(profiles, 'PRODUCT_AI');
    expect(aiOnly.every(p => p.primaryTopic.category === 'PRODUCT_AI')).toBe(true);

    const designOnly = filterExpertProfiles(profiles, 'DESIGN_SYSTEM');
    expect(designOnly.every(p => p.primaryTopic.category === 'DESIGN_SYSTEM')).toBe(true);

    const growthOnly = filterExpertProfiles(profiles, 'GROWTH_BIZ');
    expect(growthOnly.every(p => p.primaryTopic.category === 'GROWTH_BIZ')).toBe(true);
  });

  it('3. 키워드 및 기술 태그 기반 검색이 정확하게 동작해야 한다', () => {
    const profiles = loadExpertMentorProfiles(MOCK_PEOPLE);

    const finopsSearch = filterExpertProfiles(profiles, 'ALL', 'FinOps');
    expect(finopsSearch.length).toBeGreaterThanOrEqual(1);
    expect(finopsSearch[0].personName).toBe('강동원');

    const figmaSearch = filterExpertProfiles(profiles, 'ALL', 'Figma');
    expect(figmaSearch.length).toBeGreaterThanOrEqual(1);
    expect(figmaSearch[0].personName).toBe('송하은');
  });

  it('4. 1:1 실무 자문 티타임 서신에 3대 추천 의제와 기프티콘 안내가 정중하게 합성되어야 한다', () => {
    const profiles = loadExpertMentorProfiles(MOCK_PEOPLE);
    const targetExpert = profiles.find(p => p.personName === '강동원')!;

    const letter = generateKnowledgeCoffeeChatLetter(targetExpert, '김팀장');
    expect(letter).toContain('강민석 님 소개로 인사드리게 된');
    expect(letter).toContain('강동원');
    expect(letter).toContain('30분 자문 요청 핵심 의제');
    expect(letter).toContain('1) EKS/GKE 스팟 인스턴스');
    expect(letter).toContain('커피 기프티콘');
    expect(letter).toContain('김팀장 드림');
  });

  it('5. 자문 요청 완료 처리 및 통계 계산이 정확히 반영되어야 한다', () => {
    const profiles = loadExpertMentorProfiles(MOCK_PEOPLE);
    const target = profiles[0];

    const updated = markConsultationSent(target.id, profiles);
    const found = updated.find(p => p.id === target.id);
    expect(found?.hasConsulted).toBe(true);
    expect(found?.consultedAt).toBeDefined();

    const stats = getKnowledgeSummaryStats(updated);
    expect(stats.totalTopics).toBe(updated.length);
    expect(stats.consultedCount).toBeGreaterThanOrEqual(1);
  });

  it('6. saveExpertMentorProfiles 함수가 정상적으로 데이터를 보존해야 한다', () => {
    const profiles = loadExpertMentorProfiles(MOCK_PEOPLE);
    profiles[0].solvedCaseSummary = '수정된 케이스 요약';
    saveExpertMentorProfiles(profiles);

    const reloaded = loadExpertMentorProfiles([]);
    expect(reloaded[0].solvedCaseSummary).toBe('수정된 케이스 요약');
  });
});
