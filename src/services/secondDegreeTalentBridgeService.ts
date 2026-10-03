import { TeamSharedContact } from '../types/teamNetwork';
import { SquadRoleId, SQUAD_ROLES } from './projectSquadBuilderService';
import { MOCK_PEER_SHARED_CONTACTS } from '../data/mockTeamNetwork';

export interface SecondDegreeTalentMatch {
  contact: TeamSharedContact;
  roleId: SquadRoleId;
  score: number; // 0 ~ 100
  matchLevel: 'EXCELLENT' | 'HIGH' | 'GOOD' | 'MODERATE';
  matchedSkills: string[];
  bridgeColleagueName: string;
  bridgeDepartment: string;
  relationshipStrength: 'STRONG' | 'MEDIUM' | 'LIGHT';
  rewardInfo: {
    coffeeChatReward: number; // 커피챗 성사 감사 리워드 (원)
    onboardingBounty: number;  // 프로젝트 최종 합류 감사 리워드 (원)
  };
  highlightReason: string;
}

/**
 * 역할별 추천 감사 리워드(Referral Reward) 산출
 */
export function calculateReferralRewardEst(roleId: SquadRoleId): {
  coffeeChatReward: number;
  onboardingBounty: number;
  badgeText: string;
} {
  const role = SQUAD_ROLES[roleId];
  if (role?.category === 'ENGINEERING') {
    return {
      coffeeChatReward: 50000,
      onboardingBounty: 700000,
      badgeText: '추천 감사 리워드 최대 75만원'
    };
  }
  if (role?.category === 'PRODUCT' || role?.category === 'DESIGN') {
    return {
      coffeeChatReward: 50000,
      onboardingBounty: 500000,
      badgeText: '추천 감사 리워드 최대 55만원'
    };
  }
  return {
    coffeeChatReward: 50000,
    onboardingBounty: 400000,
    badgeText: '추천 감사 리워드 최대 45만원'
  };
}

/**
 * 2촌 인재(동료 공유 인맥)와 결원 역할(Squad Role) 간의 적합도 점수 계산
 */
export function calculateSecondDegreeFit(
  contact: TeamSharedContact,
  roleId: SquadRoleId
): SecondDegreeTalentMatch {
  const role = SQUAD_ROLES[roleId];
  const title = (contact.targetTitle || '').toLowerCase();
  const domain = (contact.primaryDomain || '').toLowerCase();
  const contactSkills = (contact.skills || []).map(s => s.toLowerCase());

  // 1. 직무(Title) 일치도 (최대 35점)
  let titleScore = 0;
  for (const t of role.targetTitles) {
    if (title.includes(t)) {
      titleScore = 35;
      break;
    }
  }
  if (titleScore === 0) {
    for (const t of role.targetTitles) {
      if (t.length > 2 && title.includes(t.slice(0, 2))) {
        titleScore = 20;
        break;
      }
    }
  }

  // 2. 보유 기술(Skills) 일치도 (최대 35점)
  const matchedSkills: string[] = [];
  for (const reqSkill of role.recommendedSkills) {
    const reqLower = reqSkill.toLowerCase();
    const isMatched = contactSkills.some(cs => cs.includes(reqLower) || reqLower.includes(cs));
    if (isMatched) {
      matchedSkills.push(reqSkill);
    }
  }

  const skillScore = Math.min(
    35,
    Math.round((matchedSkills.length / Math.max(1, role.recommendedSkills.length)) * 40)
  );

  // 3. 도메인 일치도 (최대 15점)
  let domainScore = 0;
  for (const d of role.targetDomains) {
    if (domain.includes(d)) {
      domainScore = 15;
      break;
    }
  }
  if (domainScore === 0 && domain.length > 0) {
    domainScore = 5;
  }

  // 4. 동료의 관계 강도(Relationship Strength) (최대 15점)
  let relationScore = 8;
  if (contact.relationshipStrength === 'STRONG') relationScore = 15;
  else if (contact.relationshipStrength === 'MEDIUM') relationScore = 11;

  const totalScore = Math.min(100, titleScore + skillScore + domainScore + relationScore);

  let matchLevel: SecondDegreeTalentMatch['matchLevel'] = 'MODERATE';
  if (totalScore >= 80) matchLevel = 'EXCELLENT';
  else if (totalScore >= 65) matchLevel = 'HIGH';
  else if (totalScore >= 50) matchLevel = 'GOOD';

  const reward = calculateReferralRewardEst(roleId);

  let highlightReason = `${contact.ownerMemberName}의 신뢰 1촌으로, ${role.label} 역할에 적합한 실무 역량을 갖추었습니다.`;
  if (matchedSkills.length > 0) {
    highlightReason = `결원 스킬 [${matchedSkills.slice(0, 3).join(', ')}]을(를) 보유하여 스쿼드 갭을 메울 수 있습니다.`;
  }

  return {
    contact,
    roleId,
    score: totalScore,
    matchLevel,
    matchedSkills,
    bridgeColleagueName: contact.ownerMemberName,
    bridgeDepartment: contact.ownerDepartment,
    relationshipStrength: contact.relationshipStrength,
    rewardInfo: {
      coffeeChatReward: reward.coffeeChatReward,
      onboardingBounty: reward.onboardingBounty
    },
    highlightReason
  };
}

/**
 * 특정 결원 역할에 대해 동료들이 공유한 2촌 인재 풀에서 최적 후보자를 랭킹 검색
 */
export function findSecondDegreeCandidatesForRole(
  roleId: SquadRoleId,
  customPeerContacts?: TeamSharedContact[],
  limit: number = 6
): SecondDegreeTalentMatch[] {
  const pool = customPeerContacts || MOCK_PEER_SHARED_CONTACTS;

  const candidates: SecondDegreeTalentMatch[] = pool
    .map(c => calculateSecondDegreeFit(c, roleId));

  // 점수 내림차순 정렬
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, limit);
}

/**
 * 사내 동료에게 보낼 정중한 사내 메신저(슬랙/잔디/카톡) 소개 요청 서신 마크다운 자동 생성
 */
export function generateColleagueIntroRequestMessage(
  projectName: string,
  roleId: SquadRoleId,
  targetContact: TeamSharedContact,
  senderName: string = '나 (본인)'
): string {
  const role = SQUAD_ROLES[roleId];
  const reward = calculateReferralRewardEst(roleId);
  const formattedBounty = (reward.onboardingBounty / 10000).toLocaleString();
  const formattedCoffee = (reward.coffeeChatReward / 10000).toLocaleString();

  return `[사내 실무 인재 소개 & 파트너십 요청]
수신: ${targetContact.ownerMemberName} 님 (${targetContact.ownerDepartment})
발신: ${senderName}
프로젝트: ${projectName || '신규 프로젝트 스쿼드'}

안녕하세요, ${targetContact.ownerMemberName}님!
저희 팀에서 현재 추진 중인 '${projectName || '신규 프로젝트'}' 스쿼드 결성과 관련하여 상의드리고자 메시지 남깁니다.

현재 스쿼드에서 【 ${role.label} 】 역할을 담당해 주실 핵심 실무 인재가 필요한 상황입니다.
${targetContact.ownerMemberName}님께서 높은 신뢰 관계를 맺고 계신
[${targetContact.targetCompany} ${targetContact.targetName} ${targetContact.targetTitle}]님의 전문성과 스킬셋이 본 프로젝트의 성공에 결정적인 시너지를 낼 수 있을 것으로 기대됩니다.

혹시 ${targetContact.targetName}님께 부담 없는 선에서
"가벼운 캐주얼 커피챗이나 프로젝트 티타임"으로 다리를 놓아주실 수 있을지요?

※ 본 프로젝트 합류 시 사내 추천 감사 규정에 따라
커피챗 성사 시 감사 리워드 ${formattedCoffee}만원, 최종 합류 시 감사 리워드 ${formattedBounty}만원이 지급됩니다.

편하신 시간에 사내 메신저나 짧은 티타임으로 말씀 나누었으면 좋겠습니다. 항상 감사드립니다!
`;
}
