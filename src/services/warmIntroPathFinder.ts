import { Person } from '../types/network';

export interface IntroPathHop {
  person: Person;
  relationshipWithNext: string;
  tieStrengthScore: number;
}

export interface WarmIntroPath {
  id: string;
  target: Person;
  intermediary: Person;
  trustScore: number; // 0 ~ 100
  confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MODERATE';
  synergyReason: string;
  connectionTags: string[];
  suggestedIntroLetter: string;
}

/**
 * 나와 관심 인물(Target) 간의 최단 신뢰 소개 경로(Warm Intro Path) 탐색
 */
export function findBestIntroPaths(
  me: Person,
  target: Person,
  allPeople: Person[]
): WarmIntroPath[] {
  // 타깃 인물과 동일인이거나 타깃이 1촌이면 중개 필요 없음
  if (me.id === target.id) return [];

  const candidates = allPeople.filter(p => p.id !== me.id && p.id !== target.id);
  const paths: WarmIntroPath[] = [];

  for (const intermediary of candidates) {
    let trustScore = 50;
    const connectionTags: string[] = [];
    const reasons: string[] = [];

    // 1. 나와 중개자의 관계 분석 (나와의 친밀도 및 신뢰도)
    if (intermediary.closeness === 1) {
      trustScore += 20;
      connectionTags.push('직접 1촌 지인');
    } else if (intermediary.closeness === 2) {
      trustScore += 5;
    }

    if (!intermediary.isStale) {
      trustScore += 10;
      connectionTags.push('최근 소통 활발');
    }

    // 2. 중개자와 타깃 인물의 공통 접점 분석
    // A. 동일 직장 또는 이전 재직 알럼나이
    const sameCompany = intermediary.currentCompany && target.currentCompany && 
      intermediary.currentCompany.toLowerCase() === target.currentCompany.toLowerCase();
    
    if (sameCompany) {
      trustScore += 25;
      connectionTags.push(`${target.currentCompany} 사내 동료`);
      reasons.push(`${target.currentCompany}에서 함께 활약 중인 동료로서 가장 확실한 실무·경영 접점을 보유하고 있습니다.`);
    }

    // B. 학연 / 동문 접점 (학교명 매칭)
    const getSchoolNames = (p: Person): string[] => {
      const names: string[] = [];
      if (p.academics && Array.isArray(p.academics)) {
        names.push(...p.academics.map(a => a.schoolName.toLowerCase()));
      }
      if (p.educationLevels?.university) names.push(p.educationLevels.university.toLowerCase());
      if (p.educationLevels?.gradSchool) names.push(p.educationLevels.gradSchool.toLowerCase());
      return names;
    };

    const schoolsA = getSchoolNames(intermediary);
    const schoolsB = getSchoolNames(target);
    const sharedSchool = schoolsA.find(sa => schoolsB.some(sb => sa.includes(sb) || sb.includes(sa)));

    if (sharedSchool) {
      trustScore += 20;
      connectionTags.push('알럼나이 동문');
      reasons.push(`${sharedSchool} 동문 인연을 공유하고 있어 격의 없는 신뢰 형성이 용이합니다.`);
    }

    // C. 전문 도메인 / 태그 접점
    const domainMatch = intermediary.primaryDomain && target.primaryDomain &&
      intermediary.primaryDomain === target.primaryDomain;
    if (domainMatch) {
      trustScore += 10;
      connectionTags.push(`${target.primaryDomain} 분야 전문 시너지`);
    }

    // D. DART 공시 팩트 임원 간 네트워크
    const isDartIntermediary = intermediary.sourceType === 'DART_FACT' || !!intermediary.dartInfo?.isPublicDirector;
    const isDartTarget = target.sourceType === 'DART_FACT' || !!target.dartInfo?.isPublicDirector;
    if (isDartIntermediary && isDartTarget) {
      trustScore += 10;
      connectionTags.push('DART 등기임원 네트워크');
    }

    // 점수 상한 제한 (100점 만점)
    trustScore = Math.min(100, trustScore);

    // 신뢰도 등급 산정
    let confidenceLevel: WarmIntroPath['confidenceLevel'] = 'MODERATE';
    if (trustScore >= 85) confidenceLevel = 'VERY_HIGH';
    else if (trustScore >= 70) confidenceLevel = 'HIGH';

    // 추천 사유 종합
    const synergyReason = reasons.length > 0 
      ? reasons.join(' ')
      : `${intermediary.name} ${intermediary.currentTitle}님과의 두터운 유대를 바탕으로 ${target.name} ${target.currentTitle}님께 정중하게 다리를 놓을 수 있는 최적의 신뢰 가교입니다.`;

    // 3. 중개자에게 보낼 정중한 소개 부탁 서신 자동 생성
    const suggestedIntroLetter = `${intermediary.name} ${intermediary.currentTitle}님, 안녕하십니까.
늘 베풀어주시는 따뜻한 격려와 지혜에 깊이 감사드립니다.

다름이 아니오라, 최근 저희 비즈니스 영역에서 ${target.currentCompany}의 ${target.name} ${target.currentTitle}님과 의미 있는 협력 기회를 모색하고 있습니다.

${intermediary.name} ${intermediary.currentTitle}님께서 ${target.name} ${target.currentTitle}님과 각별한 인연이 있으신 것으로 알고 있어, 결례가 되지 않는다면 따뜻한 차 한 잔 나누며 가볍게 인사드릴 수 있도록 정중히 다리를 놓아주실 수 있을지 여쭙고자 연락드렸습니다.

부담이 되신다면 전혀 편히 말씀해 주셔도 괜찮사오니, 시간 되실 때 가볍게 고견 주시면 감사하겠습니다.
환절기에 늘 건강 유의하시고, 조만간 식사 한번 모시겠습니다.

감사합니다.
배상`;

    paths.push({
      id: `path-${intermediary.id}-${target.id}`,
      target,
      intermediary,
      trustScore,
      confidenceLevel,
      synergyReason,
      connectionTags,
      suggestedIntroLetter
    });
  }

  // 신뢰 점수 기준 내림차순 정렬
  return paths.sort((a, b) => b.trustScore - a.trustScore);
}
