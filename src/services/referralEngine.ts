import { Person, ReferralPosition, ReferralCandidateMatch, ReferralSubmission } from '../types/network';

const REFERRAL_STORAGE_KEY = 'connectwe_referral_submissions_v1';

/**
 * 특정 채용 포지션에 대해 내 로컬 인맥 중 가장 적합한 추천 후보자를 도출하는 로컬 GraphRAG 매칭 엔진
 * (외부 서버 전송 없는 100% 클라이언트 사이드 Zero-Knowledge 연산)
 */
export function findReferralMatchesForPosition(
  position: ReferralPosition,
  people: Person[]
): ReferralCandidateMatch[] {
  const matches: ReferralCandidateMatch[] = [];

  for (const p of people) {
    let score = 0;
    const reasons: string[] = [];
    let matchedAlumniCompany: string | undefined = undefined;

    // 1. 알럼나이(Alumni) 네트워크 매칭 (가중치 35점)
    if (position.targetAlumniCompanies && position.targetAlumniCompanies.length > 0) {
      const allCompanies = [
        p.currentCompany,
        ...p.careers.map(c => c.companyName)
      ];

      for (const targetAlumni of position.targetAlumniCompanies) {
        const found = allCompanies.find(c => c.toLowerCase().includes(targetAlumni.toLowerCase()));
        if (found) {
          score += 35;
          matchedAlumniCompany = found;
          reasons.push(`${targetAlumni} 출신/재직 네트워크 (${found})`);
          break;
        }
      }
    }

    // 2. 나이대 및 연차 매칭 (가중치 20점)
    if (position.targetAgeGroup && position.targetAgeGroup.length > 0) {
      if (position.targetAgeGroup.includes(p.estimatedAgeGroup)) {
        score += 20;
        const ageLabel = p.estimatedAgeGroup === '40s' ? '40대 시니어/임원급' : p.estimatedAgeGroup === '30s' ? '30대 핵심 리드급' : '50대 경영진급';
        reasons.push(`타겟 연령대 부합 (${ageLabel})`);
      }
    }

    // 3. 직무 도메인 및 스킬 매칭 (가중치 30점)
    const posText = `${position.title} ${position.industry} ${position.department} ${position.keyRequirements.join(' ')}`.toLowerCase();
    const personText = `${p.currentTitle} ${p.currentDepartment} ${p.primaryDomain} ${p.skills.join(' ')} ${p.memo || ''}`.toLowerCase();

    let domainHitCount = 0;
    const keywords = ['ai', 'cto', '클라우드', '인프라', 'vc', '투자', 'cfo', 'ir', '임원', '연구소장', '비전', '사모펀드'];
    for (const kw of keywords) {
      if (posText.includes(kw) && personText.includes(kw)) {
        domainHitCount++;
      }
    }

    if (domainHitCount > 0) {
      const domainScore = Math.min(30, domainHitCount * 12);
      score += domainScore;
      reasons.push(`핵심 전문 도메인 일치 (${p.primaryDomain || p.currentTitle})`);
    }

    // 4. 소통 신뢰도 (친밀도 1~3순위 지인 가중치 15점)
    if (p.closeness <= 3) {
      score += 15;
      reasons.push(`신뢰 1촌 네트워크 (Closeness Lv.${p.closeness})`);
    }

    // 5. DART 공시 실데이터 검증 가산점 (10점)
    if (p.sourceType === 'DART_FACT' || p.dartInfo) {
      score += 10;
      reasons.push('🏛️ DART 공식 검증 임원 이력');
    }

    // 최소 적합 기준(50점 이상) 통과 시 매칭 후보자로 등록
    if (score >= 50) {
      matches.push({
        person: p,
        positionId: position.id,
        matchScore: Math.min(99, score),
        matchReasons: reasons,
        alumniMatchCompany: matchedAlumniCompany,
        isRecommended: score >= 75
      });
    }
  }

  // 매칭 점수 내림차순 정렬
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * 원클릭 AI 추천서 초안 생성기
 */
export function generateAiRecommendationDraft(
  person: Person,
  position: ReferralPosition
): string {
  const currentRole = `${person.currentCompany} ${person.currentTitle}`;
  const alumniHistory = person.careers.length > 0 
    ? person.careers.map(c => `${c.companyName}(${c.title})`).join(', ')
    : '관련 유수 기업';

  return `[ConnectWe 신뢰 인맥 채용 추천서]

■ 추천 대상자: ${person.name} 님 (${currentRole})
■ 대상 포지션: ${position.clientCompany} - ${position.title}

1. 추천 사유 및 핵심 역량:
${person.name} 님은 ${person.primaryDomain} 분야에서 탁월한 전문성을 검증받은 시니어 리더입니다. 특히 ${alumniHistory} 등에서 쌓아온 실무 조직 리딩 역량과 문제 해결력은 귀사가 찾는 본 포지션의 요건에 100% 부합합니다.

2. 인성 및 컬처핏 (신뢰 보증):
제가 직접 교류하며 확인한 바, 전략적 의사결정 능력뿐 아니라 팀원들과의 소통과 헌신도가 매우 뛰어납니다. ${person.memo ? `(소통 메모: "${person.memo}")` : ''}

3. 추천인 의견:
귀사의 성장 모멘텀에 결정적인 기여를 할 수 있는 최적임자라 확신하여 본 비공개 추천서를 전달합니다.`;
}

export function loadReferralSubmissions(): ReferralSubmission[] {
  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return getDefaultSubmissions();
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load referral submissions:', err);
    return getDefaultSubmissions();
  }
}

export function saveReferralSubmissions(submissions: ReferralSubmission[]): void {
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(submissions));
  } catch (err) {
    console.error('Failed to save referral submissions:', err);
  }
}

function getDefaultSubmissions(): ReferralSubmission[] {
  return [
    {
      id: 'sub-001',
      positionId: 'pos-001',
      positionTitle: 'CTO / 인프라플랫폼 본부 총괄',
      clientCompany: '(주)하이퍼클라우드',
      personId: 'p-001',
      candidateName: '한동훈',
      candidateTitle: 'CTO / 기술이사',
      candidateCompany: '(주)하이퍼클라우드',
      status: 'interviewing',
      recommendationNote: '네이버 출신의 대규모 분산 클라우드 아키텍처 15년 경력자로, 강력한 추천 의사를 밝힙니다.',
      submittedAt: '2024-10-12 14:30',
      updatedAt: '2024-10-18 11:20',
      earnedRewards: {
        coffeeChatPaid: true,
        interviewPaid: true,
        hirePaid: false,
        totalAmount: 250000
      }
    },
    {
      id: 'sub-002',
      positionId: 'pos-002',
      positionTitle: 'AI R&D 연구소장 (의료영상 파운데이션 모델)',
      clientCompany: '넥스트비전 AI',
      personId: 'p-002',
      candidateName: '서유진',
      candidateTitle: '수석연구원 / AI 리드',
      candidateCompany: '넥스트비전 AI',
      status: 'coffee_chat_accepted',
      recommendationNote: '의료영상 파운데이션 모델 권위자로, 미국 FDA 승인 파이프라인에 최적임자입니다.',
      submittedAt: '2024-10-19 09:15',
      updatedAt: '2024-10-21 16:40',
      earnedRewards: {
        coffeeChatPaid: true,
        interviewPaid: false,
        hirePaid: false,
        totalAmount: 50000
      }
    }
  ];
}
