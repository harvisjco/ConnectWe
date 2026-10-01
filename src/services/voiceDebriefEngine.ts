import { Person, DataSourceType } from '../types/network';
import { identifyTalentCluster } from './talentClusterEngine';

export interface ExtractedVoiceActionItem {
  id: string;
  task: string;
  dueDate: string; // YYYY-MM-DD
  assignee: 'ME' | 'PARTNER' | 'BOTH';
  completed: boolean;
}

export interface VoiceDealUpdate {
  dealTitle: string;
  stage: 'INITIAL_CONTACT' | 'PROPOSAL' | 'NEGOTIATION' | 'COMMITTED';
  stageLabel: string;
  estimatedAmount?: string;
  probability: number; // 0 ~ 100
}

export interface VoiceDebriefAnalysis {
  matchedPerson: Person;
  rawTranscript: string;
  summary: string;
  keyTopics: string[];
  actionItems: ExtractedVoiceActionItem[];
  dealUpdate?: VoiceDealUpdate;
  followUpLetter: string;
  sentiment: '우호적 (우수)' | '중립 (추가 조율)' | '신중 검토';
  analyzedAt: string;
}

/**
 * 텍스트 또는 음성 스크립트에서 인맥 자동 매칭 (이름 또는 회사명)
 */
export function matchPersonFromTranscript(
  transcript: string,
  people: Person[],
  explicitPerson?: Person | null
): Person | null {
  if (explicitPerson) return explicitPerson;
  if (!transcript || people.length === 0) return null;

  const t = transcript.toLowerCase();

  // 1. 이름 완전 일치 우선 탐색
  const nameMatch = people.find(p => p.name && t.includes(p.name.toLowerCase()));
  if (nameMatch) return nameMatch;

  // 2. 회사명 포함 탐색
  const companyMatch = people.find(p => p.currentCompany && t.includes(p.currentCompany.toLowerCase()));
  if (companyMatch) return companyMatch;

  // 3. 직함 및 성씨 조합 (예: "김 대표", "이 상무")
  for (const p of people) {
    if (p.name && p.name.length >= 2) {
      const surname = p.name[0];
      if (t.includes(`${surname}대표`) || t.includes(`${surname} 대표`) || 
          t.includes(`${surname}전무`) || t.includes(`${surname} 전무`)) {
        return p;
      }
    }
  }

  return people[0] || null;
}

/**
 * C-Level 이동 중 음성 회고 분석 및 구조화 엔진
 */
export function analyzeVoiceDebrief(
  transcript: string,
  people: Person[],
  explicitPerson?: Person | null
): VoiceDebriefAnalysis {
  const target = matchPersonFromTranscript(transcript, people, explicitPerson) || {
    id: 'unknown',
    name: '비즈니스 파트너',
    currentCompany: '협력사',
    currentDepartment: '',
    currentTitle: '대표/임원',
    mobile: '010-0000-0000',
    email: '',
    closeness: 2,
    sourceType: 'SOURCE_DATA' as DataSourceType,
    skills: [],
    careers: [],
    academics: [],
    estimatedAgeGroup: '40s',
    isAgeEstimated: true,
    primaryDomain: '경영/전략',
    isStale: false,
    connectionChannel: 'manual'
  };

  identifyTalentCluster(target);
  const sentences = transcript.split(/[\n.!?]+/).map(s => s.trim()).filter(Boolean);

  // 1. 액션 아이템 추출
  const actionKeywords = [
    '보내주기', '보내기', '송부', '전달', '공유', '소개', '검토', 
    '회신', '미팅', '연락', '정리', '피드백', '준비', '작성', '발송', '전화'
  ];

  const now = new Date();
  let defaultDueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  if (transcript.includes('내일')) {
    defaultDueDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  } else if (transcript.includes('모레')) {
    defaultDueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  } else if (transcript.includes('다음 주') || transcript.includes('다음주')) {
    defaultDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  const actionItems: ExtractedVoiceActionItem[] = [];
  const keyTopics: string[] = [];

  sentences.forEach((sentence, idx) => {
    const isAction = actionKeywords.some(k => sentence.includes(k));
    if (isAction) {
      let assignee: 'ME' | 'PARTNER' | 'BOTH' = 'ME';
      if (sentence.includes('대표님께서') || sentence.includes('상대방') || sentence.includes('보내주시기로')) {
        assignee = 'PARTNER';
      } else if (sentence.includes('함께') || sentence.includes('공동으로')) {
        assignee = 'BOTH';
      }

      actionItems.push({
        id: `voice-action-${Date.now()}-${idx}`,
        task: sentence,
        dueDate: defaultDueDate,
        assignee,
        completed: false
      });
    } else if (sentence.length >= 6 && sentence.length <= 40 && keyTopics.length < 3) {
      keyTopics.push(sentence);
    }
  });

  if (actionItems.length === 0) {
    actionItems.push({
      id: `voice-action-${Date.now()}-default`,
      task: `[${target.name} ${target.currentTitle}] 미팅 감사 서신 송부 및 논의 안건 정리`,
      dueDate: defaultDueDate,
      assignee: 'ME',
      completed: false
    });
  }

  // 2. 딜 파이프라인 연계 감지
  let dealUpdate: VoiceDealUpdate | undefined = undefined;
  const isDealRelated = /투자|펀딩|계약|딜|시리즈|라운드|금액|억원|파트너십|PoC|도입/.test(transcript);
  
  if (isDealRelated) {
    const amountMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:억|억원|천만원|백만원)/);
    const estimatedAmount = amountMatch ? amountMatch[0] : undefined;

    let stage: VoiceDealUpdate['stage'] = 'PROPOSAL';
    let stageLabel = '사업 제안 및 검토';
    let probability = 60;

    if (/확정|체결|참여 결정|투자 확정|도장|클로징/.test(transcript)) {
      stage = 'COMMITTED';
      stageLabel = '최종 계약 체결 (확정)';
      probability = 95;
    } else if (/협상|조율|조건 협의|텀싯|계약서/.test(transcript)) {
      stage = 'NEGOTIATION';
      stageLabel = '세부 조건 조율 (협상)';
      probability = 75;
    } else if (/긍정|검토|관심|IR|제안서/.test(transcript)) {
      stage = 'PROPOSAL';
      stageLabel = '제안서 검토 및 논의';
      probability = 65;
    }

    dealUpdate = {
      dealTitle: `[${target.currentCompany}] ${target.name} ${target.currentTitle} 비즈니스 파트너십`,
      stage,
      stageLabel,
      estimatedAmount,
      probability
    };
  }

  // 3. 감정 분석
  let sentiment: VoiceDebriefAnalysis['sentiment'] = '우호적 (우수)';
  if (/부정|난색|보류|어려|불가|신중|부담/.test(transcript)) {
    sentiment = '신중 검토';
  } else if (/검토|조율|보통|지켜보/.test(transcript)) {
    sentiment = '중립 (추가 조율)';
  }

  // 4. 핵심 요약 생성
  const summary = `${target.currentCompany} ${target.name} ${target.currentTitle}님과의 미팅 회고. ${
    sentiment === '우호적 (우수)' ? '상호 간 우호적 공감대를 확인하고 적극적인 사업 협업 추진에 합의함.' :
    sentiment === '신중 검토' ? '일정 및 예산 조건으로 인해 추가적인 세부 조율이 요구됨.' :
    '상호 비즈니스 현황을 공유하고 파트너십 가능성을 탐색함.'
  } 총 ${actionItems.length}건의 실행 과제가 도출되었습니다.`;

  // 5. 경영진 품격 감사 서신 (Executive Tone Follow-Up Letter)
  const actionSummaryText = actionItems
    .filter(a => a.assignee === 'ME' || a.assignee === 'BOTH')
    .map(a => `• ${a.task} (기한: ${a.dueDate})`)
    .join('\n');

  const followUpLetter = `${target.name} ${target.currentTitle}님, 안녕하십니까.
오늘 바쁘신 일정 중에도 귀한 시간 내어주셔서 진심으로 감사드립니다.

오늘 나눈 ${keyTopics.length > 0 ? `[${keyTopics[0]}]에 관한 ` : ''}혜안 넘치는 고견과 ${target.currentCompany}의 비전에 깊이 공감하였으며, 앞으로 함께 만들어갈 시너지가 매우 기대됩니다.

오늘 논의된 사항에 대해 저희 측에서 신속히 후속 조치를 진행하겠습니다:
${actionSummaryText || '• 금일 논의된 세부 제안 사항 정리 및 공유'}

궁금하신 점이나 추가로 필요하신 사항이 있으시면 언제든 편히 말씀해 주십시오.
일교차 큰 날씨에 늘 건강 유의하시길 바라며, 정중히 감사 인사 올립니다.

감사합니다.
배상`;

  return {
    matchedPerson: target,
    rawTranscript: transcript,
    summary,
    keyTopics,
    actionItems,
    dealUpdate,
    followUpLetter,
    sentiment,
    analyzedAt: new Date().toISOString()
  };
}
