import { Person, ReferralPosition, ReferralCandidateMatch } from '../types/network';

/**
 * 인맥 데이터와 포지션 요구사항을 지능적으로 교차 매칭하는 알고리즘
 */
export function calculateMatchesForPosition(
  position: ReferralPosition,
  people: Person[]
): ReferralCandidateMatch[] {
  // '나(Me)' 노드는 추천 대상에서 제외
  const candidates = people.filter(p => p.closeness !== 1);

  const results: ReferralCandidateMatch[] = [];

  for (const person of candidates) {
    let score = 20; // 기본 점수
    const reasons: string[] = [];
    let alumniMatchCompany: string | undefined = undefined;

    // 1. 선호 알럼나이(전직/현직) 회사 매칭 분석
    if (position.targetAlumniCompanies && position.targetAlumniCompanies.length > 0) {
      const allCompanies = [
        person.currentCompany,
        ...person.careers.map(c => c.companyName)
      ].filter(Boolean);

      const matchedCompany = position.targetAlumniCompanies.find(target =>
        allCompanies.some(c => c.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(c.toLowerCase()))
      );

      if (matchedCompany) {
        score += 35;
        alumniMatchCompany = matchedCompany;
        reasons.push(`핵심 선호 기업 [${matchedCompany}] 출신/재직자`);
      }
    }

    // 2. 전문 도메인 및 스킬셋 일치도 분석
    const domainText = `${person.primaryDomain} ${person.skills.join(' ')} ${person.currentDepartment} ${person.currentTitle}`.toLowerCase();
    
    let domainHits = 0;
    const searchTerms = [
      ...position.title.split(/\s+/),
      ...position.industry.split(/[\s/]+/),
      ...position.keyRequirements.flatMap(r => r.split(/\s+/))
    ].filter(w => w.length >= 2);

    for (const term of searchTerms) {
      if (domainText.includes(term.toLowerCase())) {
        domainHits++;
      }
    }

    if (domainHits >= 3) {
      score += 25;
      reasons.push(`전문 도메인(${person.primaryDomain}) 및 주요 요구역량 일치`);
    } else if (domainHits >= 1) {
      score += 15;
      reasons.push(`유관 도메인(${person.primaryDomain}) 연관성 확인`);
    }

    // 3. 직급 및 나이대 적합성
    if (position.targetAgeGroup && position.targetAgeGroup.includes(person.estimatedAgeGroup)) {
      score += 10;
      reasons.push(`요구 연차/연령대(${person.estimatedAgeGroup}) 부합`);
    }

    // 4. 금융감독원 DART 공시 검증 가산점 (임원 신뢰성)
    if (person.dartInfo) {
      score += 10;
      reasons.push(`DART 공시 임원 검증 완료 (${person.dartInfo.stockName})`);
    }

    // 최대 100점 상한
    score = Math.min(score, 100);

    // 최소 적합 기준(40점 이상) 후보만 결과에 포함
    if (score >= 40) {
      results.push({
        person,
        positionId: position.id,
        matchScore: score,
        matchReasons: reasons,
        alumniMatchCompany,
        isRecommended: score >= 70
      });
    }
  }

  // 매칭 스코어 내림차순 정렬
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
