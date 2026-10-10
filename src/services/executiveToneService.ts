import { TalentClusterId } from './talentClusterEngine';
import { Person } from '../types/network';

export interface BannedWordViolation {
  word: string;
  replacement: string;
  category: 'military_hunting' | 'monetization' | 'ranking' | 'discrimination' | 'surveillance';
  categoryLabel: string;
  explanation: string;
}

export interface ToneAuditResult {
  isSafe: boolean;
  score: number; // 0 to 100
  violations: BannedWordViolation[];
  sanitizedText: string;
}

/**
 * 헌장 5대 금지 어휘 및 표준 품격 대체 사전
 */
export const BANNED_LEXICON_RULES: Array<{
  regex: RegExp;
  word: string;
  replacement: string;
  category: BannedWordViolation['category'];
  categoryLabel: string;
  explanation: string;
}> = [
  // 1. 사냥·군사·공격
  {
    regex: /타[겟깃]/g,
    word: '타깃/타겟',
    replacement: '관심 인재 (협업 기회)',
    category: 'military_hunting',
    categoryLabel: '사냥·군사 어휘',
    explanation: '사람을 사냥의 표적으로 보는 군사적 어휘 대신 상호 존중 기반의 인재/기회 표현을 사용합니다.'
  },
  {
    regex: /(공략|침투)/g,
    word: '공략/침투',
    replacement: '소통 및 관계 형성',
    category: 'military_hunting',
    categoryLabel: '사냥·군사 어휘',
    explanation: '적진을 파고드는 공격적 어휘 대신 진정성 있는 관계 형성 표현을 권장합니다.'
  },
  {
    regex: /워\s*룸/gi,
    word: '워룸 (War Room)',
    replacement: '전략 협업 룸',
    category: 'military_hunting',
    categoryLabel: '사냥·군사 어휘',
    explanation: '전쟁 은어 대신 C-Level 파트너십 협업 룸 표현을 사용합니다.'
  },
  {
    regex: /(포섭|급습|번개)/g,
    word: '포섭/급습/번개',
    replacement: '정중한 일정 조율',
    category: 'military_hunting',
    categoryLabel: '사냥·군사 어휘',
    explanation: '작전식 어휘 대신 상대의 시간을 존중하는 정중한 제안 표현을 권장합니다.'
  },

  // 2. 화폐화·도구화
  {
    regex: /(바운티|현상금)/g,
    word: '바운티/현상금',
    replacement: '추천 감사 리워드',
    category: 'monetization',
    categoryLabel: '도구화·화폐화 어휘',
    explanation: '사람의 연결을 현상금으로 치부하지 않고 감사의 마음을 담은 리워드로 표현합니다.'
  },
  {
    regex: /(총\s*)?인맥\s*자산/g,
    word: '인맥 자산',
    replacement: '소중한 인연 (신뢰 네트워크)',
    category: 'monetization',
    categoryLabel: '도구화·화폐화 어휘',
    explanation: '관계를 재무적 자산으로 계량화하지 않고 상호 신뢰 네트워크로 표현합니다.'
  },
  {
    regex: /딜에\s*배정/g,
    word: '딜에 배정',
    replacement: '프로젝트 파트너십 등록',
    category: 'monetization',
    categoryLabel: '도구화·화폐화 어휘',
    explanation: '인재를 딜의 부속품으로 취급하지 않고 동등한 파트너십으로 정의합니다.'
  },
  {
    regex: /기업에\s*포진/g,
    word: '기업에 포진',
    replacement: '기업에서 활약 중',
    category: 'monetization',
    categoryLabel: '도구화·화폐화 어휘',
    explanation: '군사 배치 표현 대신 활약과 전문성을 조명하는 어휘를 사용합니다.'
  },

  // 3. 서열화·등급화
  {
    regex: /(파워\s*점수|알파\s*슈퍼\s*커넥터)/g,
    word: '파워 점수/알파 커넥터',
    replacement: '핵심 네트워크 허브',
    category: 'ranking',
    categoryLabel: '서열화·등급화 어휘',
    explanation: '인맥에 계급식 서열을 매기지 않고 중심 허브 역할을 중립적으로 표현합니다.'
  },
  {
    regex: /[A-D]등급/g,
    word: 'A~D 등급',
    replacement: '핵심 협력 파트너사',
    category: 'ranking',
    categoryLabel: '서열화·등급화 어휘',
    explanation: '기업과 인재를 단순 신용등급식으로 재단하지 않습니다.'
  },
  {
    regex: /사각지대/g,
    word: '사각지대',
    replacement: '새로운 인연을 기대하는 곳',
    category: 'ranking',
    categoryLabel: '서열화·등급화 어휘',
    explanation: '부족함을 탓하는 독촉 어조 대신 새로운 인연에 대한 긍정적 가능성을 제시합니다.'
  },

  // 4. 연령·학벌 차별
  {
    regex: /(추정\s*나이|추정\s*연령)/g,
    word: '추정 나이/추정 연령',
    replacement: '전문 경력 단계',
    category: 'discrimination',
    categoryLabel: '차별적 선입견 어휘',
    explanation: '나이로 사람의 역량을 단정하지 않고 실질적 전문 경력 기간을 기준으로 삼습니다.'
  },
  {
    regex: /(학연|동문)\s*가산점/g,
    word: '학연/동문 가산점',
    replacement: '도메인 전문성 시너지',
    category: 'discrimination',
    categoryLabel: '차별적 선입견 어휘',
    explanation: '학벌 중심 카르텔 대신 축적된 도메인 역량과 실질적 시너지를 중시합니다.'
  },

  // 5. 사찰·스팸 불안
  {
    regex: /도시에/g,
    word: '도시에 (Dossier)',
    replacement: '미팅 준비 브리프',
    category: 'surveillance',
    categoryLabel: '사찰·감시 어휘',
    explanation: '비밀 사찰 문서를 연상시키는 첩보 은어 대신 품격 있는 비즈니스 브리프 명칭을 사용합니다.'
  },
  {
    regex: /영구\s*기록/g,
    word: '영구 기록',
    replacement: '안전한 보관',
    category: 'surveillance',
    categoryLabel: '사찰·감시 어휘',
    explanation: '낙인감을 주는 영구 기록 대신 프라이버시 안심 표현을 사용합니다.'
  },
  {
    regex: /인맥\s*역추적/g,
    word: '인맥 역추적',
    replacement: '알럼나이 네트워크 연결',
    category: 'surveillance',
    categoryLabel: '사찰·감시 어휘',
    explanation: '수사기관 은어 대신 자연스러운 이전 직장 및 공통 알럼나이 연결로 안내합니다.'
  },
  {
    regex: /팔로업\s*시퀀스/g,
    word: '팔로업 시퀀스',
    replacement: '미팅 감사 & 후속 소통 서신',
    category: 'surveillance',
    categoryLabel: '사찰·감시 어휘',
    explanation: '스팸 영업 자동화 느낌을 주는 시퀀스 대신 정성스러운 후속 서신 표현을 권장합니다.'
  }
];

/**
 * 텍스트 내 경영진 헌장 금지 어휘 감사 (Audit)
 */
export function auditExecutiveTone(text: string): ToneAuditResult {
  if (!text || text.trim() === '') {
    return {
      isSafe: true,
      score: 100,
      violations: [],
      sanitizedText: text
    };
  }

  const violations: BannedWordViolation[] = [];
  let sanitized = text;

  for (const rule of BANNED_LEXICON_RULES) {
    // regex test 시 글로벌 플래그 상태 리셋을 위해 매번 새 정규식 객체 생성
    const testRegex = new RegExp(rule.regex.source, rule.regex.flags);
    if (testRegex.test(text)) {
      violations.push({
        word: rule.word,
        replacement: rule.replacement,
        category: rule.category,
        categoryLabel: rule.categoryLabel,
        explanation: rule.explanation
      });
      sanitized = sanitized.replace(new RegExp(rule.regex.source, rule.regex.flags), rule.replacement);
    }
  }

  // 감점 계산: 위반 건당 20점 감점
  const score = Math.max(0, 100 - violations.length * 20);
  const isSafe = violations.length === 0;

  return {
    isSafe,
    score,
    violations,
    sanitizedText: sanitized
  };
}

/**
 * 금지 어휘를 즉각 순화하는 함수
 */
export function sanitizeExecutiveTone(text: string): string {
  const result = auditExecutiveTone(text);
  return result.sanitizedText;
}

/**
 * 5대 인재 클러스터 맞춤형 서신 어조 윤문 (Executive Tone Polisher)
 */
export function polishToneForCluster(
  originalMessage: string,
  clusterId: TalentClusterId,
  context?: {
    recipientName?: string;
    recipientCompany?: string;
    recipientTitle?: string;
    senderName?: string;
  }
): string {
  const name = context?.recipientName || '임원/대표';
  const company = context?.recipientCompany ? `${context.recipientCompany} ` : '';
  const title = context?.recipientTitle ? ` ${context.recipientTitle}` : '';
  const cleanOriginal = sanitizeExecutiveTone(originalMessage).trim();

  switch (clusterId) {
    case 'LISTED_EXECUTIVE':
      return `${company}${name}${title}님께,\n\n안녕하십니까. 전자공시(DART)로 검증된 투명한 공적 거버넌스와 지속 가능한 성장을 성공적으로 이끌어 오신 ${name}${title}님의 리더십에 깊은 경의를 표합니다.\n\n${cleanOriginal ? `[전달 사항]\n${cleanOriginal}\n\n` : ''}시장과 주주의 신뢰 속에서 다져오신 귀사의 모범적 경영 행보에 맞추어, 상호 신뢰할 수 있는 협력 기회를 조율하고자 정중히 연락드렸습니다.\n\n공무 일정 중 잠시 틈이 나실 때 가볍게 차 한 잔 모실 수 있다면 큰 영광이겠습니다.\n\n감사합니다.\n올림`;

    case 'VENTURE_LEADER':
      return `${company}${name}${title}님, 안녕하십니까!\n\n평소 시장에서 ${company}이 보여주고 계신 신속한 의사결정과 역동적인 사업 스케일업 행보를 매우 인상 깊게 응원하고 있습니다.\n\n${cleanOriginal ? `[제안 내용]\n${cleanOriginal}\n\n` : ''}양사가 지닌 강점을 결합해 시장에서 즉각적인 시너지를 창출할 수 있는 실질적 협업 방안에 대해 가볍게 20분 정도 티타임을 나누며 이야기 나누고 싶습니다.\n\n판교나 강남 등 대표님 이동 동선에 맞추어 언제든 찾아뵙겠습니다. 편하실 때 편안하게 말씀 부탁드립니다!\n\n감사합니다.`;

    case 'TECH_FELLOW':
      return `${company}${name}${title}님, 안녕하십니까.\n\n${company}에서 이끌고 계신 원천 기술 R&D 성과와 독보적인 기술 아키텍처 비전에 늘 깊은 경의와 영감을 얻고 있습니다.\n\n${cleanOriginal ? `[기술 교류 아젠다]\n${cleanOriginal}\n\n` : ''}최근 산업의 기술적 변곡점과 난제 해결에 관해 ${name} 펠로우님의 공학적 통찰과 고견을 여쭙고자 정중히 티타임을 청합니다.\n\n연구 및 개발 집중 일정에 방해되지 않으시도록 연구실 인근이나 편하신 카페에서 15분 내외로 모시겠습니다.\n\n감사합니다.\n올림`;

    case 'INVESTOR_PARTNER':
      return `${company}${name}${title} 파트너님, 안녕하십니까.\n\n자본 시장의 거시 생태계 통찰과 기업가치 밸류업을 주도하고 계신 ${name} 파트너님의 혜안을 늘 존경하고 있습니다.\n\n${cleanOriginal ? `[파트너십 논의]\n${cleanOriginal}\n\n` : ''}최근 투자 환경과 유망 산업 도메인의 성장 기회, 그리고 함께 도모할 수 있는 딜 시너지에 대해 가볍게 차 한 잔 모시며 고견을 나누고 싶습니다.\n\n여의도나 테헤란로 등 파트너님 일정에 맞추어 방문드리겠습니다. 편하신 일정을 공유해 주시면 감사하겠습니다.\n\n감사합니다.`;

    case 'CORE_SPECIALIST':
    default:
      return `${company}${name}님, 안녕하세요!\n\n현장에서 최고의 완성도로 프로덕트와 서비스를 직접 만들어가시는 ${name}님의 탁월한 전문성을 늘 눈여겨보고 있었습니다.\n\n${cleanOriginal ? `[나누고 싶은 이야기]\n${cleanOriginal}\n\n` : ''}실무 현장의 생생한 문제해결 노하우와 최신 빌딩 경험을 편안한 분위기 속에서 나누며 좋은 인연을 맺고 싶습니다.\n\n부담 없이 커피 한 잔 나누며 가볍게 인사 나눌 수 있을지요? 편하신 시간 언제든 편하게 말씀해주세요 :)\n\n감사합니다!`;
  }
}

export interface ExecutiveStatusBadgeInfo {
  label: string;
  subLabel?: string;
  badgeClass: string;
}

/**
 * [C-4] 상장사 DART 공시 팩트와 비상장 혁신 벤처/딥테크 간의 시각적 위계 균형 배지
 */
export function getExecutiveStatusBadge(person: Person): ExecutiveStatusBadgeInfo {
  // 1. DART 공시 상장사 임원
  if (person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector) {
    return {
      label: 'DART FACT',
      subLabel: '공시 검증 임원',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    };
  }

  // 2. 비상장 벤처 리더 / 창업가 (Venture Leader)
  const isFounderOrCeo = /(대표|ceo|founder|창업|공동창업|co-founder)/i.test(person.currentTitle || '');
  if (isFounderOrCeo) {
    return {
      label: '🚀 프론티어 빌더',
      subLabel: '혁신 벤처 리더',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    };
  }

  // 3. 딥테크 펠로우 / AI 아키텍트 (Tech Fellow)
  const isTechFellow = /(cto|caio|펠로우|fellow|연구총괄|수석|architect|ai lab)/i.test(person.currentTitle || '') || 
                       (person.primaryDomain && /(ai|ml|반도체|로보틱스|hw|인프라)/i.test(person.primaryDomain));
  if (isTechFellow) {
    return {
      label: '🔬 딥테크 펠로우',
      subLabel: '원천 기술 아키텍트',
      badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-violet-200 dark:border-violet-800'
    };
  }

  // 4. 투자 파트너 / VC (Investor Partner)
  const isInvestor = /(파트너|심사역|벤처캐피탈|vc|pe|투자|managing partner)/i.test(person.currentTitle || '') || 
                     (person.currentCompany && /(인베스트|투자|벤처|파트너스|capital)/i.test(person.currentCompany));
  if (isInvestor) {
    return {
      label: '💼 투자 파트너',
      subLabel: '성장 자본 파트너',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    };
  }

  // 5. 핵심 실무 리더
  return {
    label: '✨ 핵심 실무 리더',
    subLabel: '프로덕션 스페셜리스트',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
  };
}
