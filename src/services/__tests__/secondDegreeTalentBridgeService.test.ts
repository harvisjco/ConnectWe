import { describe, it, expect } from 'vitest';
import { 
  findSecondDegreeCandidatesForRole, 
  calculateSecondDegreeFit, 
  generateColleagueIntroRequestMessage, 
  calculateReferralRewardEst 
} from '../secondDegreeTalentBridgeService';
import { MOCK_PEER_SHARED_CONTACTS } from '../../data/mockTeamNetwork';

describe('secondDegreeTalentBridgeService - 스쿼드 결원 2촌 탐색 & 동료 소개 리퀘스트 검증', () => {
  it('1. 클라우드 인프라(BACKEND_INFRA) 결원 시 2촌 풀에서 최적 후보자를 랭킹 검색해야 한다', () => {
    const matches = findSecondDegreeCandidatesForRole('BACKEND_INFRA', MOCK_PEER_SHARED_CONTACTS);

    expect(matches.length).toBeGreaterThan(0);
    // 1위 후보는 강동원(AWS, K8s 아키텍트)이어야 함
    expect(matches[0].contact.targetName).toBe('강동원');
    expect(matches[0].score).toBeGreaterThanOrEqual(80);
    expect(matches[0].matchLevel).toBe('EXCELLENT');
    expect(matches[0].matchedSkills).toContain('AWS');
    expect(matches[0].matchedSkills).toContain('Kubernetes');
  });

  it('2. 프론트엔드(FRONTEND_DEV) 결원 시 윤서진(React/Next.js) 및 가교 동료 정보가 정상 연결되어야 한다', () => {
    const matches = findSecondDegreeCandidatesForRole('FRONTEND_DEV', MOCK_PEER_SHARED_CONTACTS);

    const topCandidate = matches[0];
    expect(topCandidate.contact.targetName).toBe('윤서진');
    expect(topCandidate.bridgeColleagueName).toContain('정현우');
    expect(topCandidate.bridgeDepartment).toBe('기술연구소');
    expect(topCandidate.relationshipStrength).toBe('STRONG');
    expect(topCandidate.matchedSkills).toContain('React');
    expect(topCandidate.matchedSkills).toContain('TypeScript');
  });

  it('3. 엔지니어링 및 프로덕트 역할별 추천 감사 리워드가 합리적으로 산출되어야 한다', () => {
    const engReward = calculateReferralRewardEst('TECH_LEAD_AI');
    expect(engReward.coffeeChatReward).toBe(50000);
    expect(engReward.onboardingBounty).toBe(700000);
    expect(engReward.badgeText).toContain('리워드');

    const pmReward = calculateReferralRewardEst('PRODUCT_LEAD');
    expect(pmReward.coffeeChatReward).toBe(50000);
    expect(pmReward.onboardingBounty).toBe(500000);
  });

  it('4. 사내 동료 소개 요청 메시지가 정중한 비즈니스 에티켓 양식으로 완벽히 합성되어야 한다', () => {
    const targetContact = MOCK_PEER_SHARED_CONTACTS.find(c => c.targetName === '강동원')!;
    const message = generateColleagueIntroRequestMessage(
      '차세대 생성형 AI 프로덕트 런칭',
      'BACKEND_INFRA',
      targetContact,
      '김팀장'
    );

    expect(message).toContain(targetContact.ownerMemberName);
    expect(message).toContain('강동원');
    expect(message).toContain('메가클라우드 시스템즈');
    expect(message).toContain('차세대 생성형 AI 프로덕트 런칭');
    expect(message).toContain('커피챗');
    expect(message).toContain('감사 리워드');
  });

  it('5. 2촌 후보자 목록이 점수 내림차순으로 정확하게 정렬되어야 한다', () => {
    const matches = findSecondDegreeCandidatesForRole('TECH_LEAD_AI', MOCK_PEER_SHARED_CONTACTS);

    for (let i = 0; i < matches.length - 1; i++) {
      expect(matches[i].score).toBeGreaterThanOrEqual(matches[i + 1].score);
    }
  });

  it('6. calculateSecondDegreeFit 함수가 역할 요구스킬과 연락처 스킬 간 핏을 정확히 계산해야 한다', () => {
    const contact = MOCK_PEER_SHARED_CONTACTS.find(c => c.targetName === '윤서진')!;
    const fit = calculateSecondDegreeFit(contact, 'FRONTEND_DEV');

    expect(fit.score).toBeGreaterThanOrEqual(80);
    expect(fit.matchLevel).toBe('EXCELLENT');
    expect(fit.matchedSkills).toContain('React');
    expect(fit.bridgeColleagueName).toBe(contact.ownerMemberName);
  });
});
