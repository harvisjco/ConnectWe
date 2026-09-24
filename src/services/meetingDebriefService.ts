import { Person, ActivityLog } from '../types/network';

export interface ExtractedActionItem {
  id: string;
  task: string;
  dueDate?: string; // YYYY-MM-DD
  assignee: 'ME' | 'PARTNER' | 'BOTH';
  completed: boolean;
}

export interface DebriefResult {
  summary: string;
  keyTopics: string[];
  actionItems: ExtractedActionItem[];
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL';
  nextFollowUpDate?: string;
}

/**
 * 미팅 회고 텍스트에서 핵심 안건, 약속된 액션 아이템, 마감 기한 자동 추출
 * (온디바이스 자연어 룰 엔진 및 시맨틱 휴리스틱 적용)
 */
export function analyzeMeetingDebrief(
  rawText: string,
  person: Person
): DebriefResult {
  const lines = rawText.split(/[\n,.]+/).map(l => l.trim()).filter(Boolean);
  
  const actionItems: ExtractedActionItem[] = [];
  const keyTopics: string[] = [];

  // 액션 아이템 관련 키워드
  const actionKeywords = [
    '보내주기', '보내기', '송부', '전달', '공유', '소개', '검토', 
    '회신', '미팅', '연락', '정리', '피드백', '준비', '작성', '발송'
  ];

  // 날짜/요일 관련 키워드 탐색
  const today = new Date();
  let defaultDueDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 기본 3일 후

  if (rawText.includes('내일')) {
    defaultDueDate = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  } else if (rawText.includes('모레')) {
    defaultDueDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  } else if (rawText.includes('다음 주') || rawText.includes('다음주')) {
    defaultDueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  // 라인별 액션 아이템 검출
  lines.forEach((line, idx) => {
    const isAction = actionKeywords.some(k => line.includes(k));
    if (isAction) {
      let assignee: 'ME' | 'PARTNER' | 'BOTH' = 'ME';
      if (line.includes('상대방') || line.includes('대표님') || line.includes('상무님') || line.includes('께서')) {
        assignee = 'PARTNER';
      } else if (line.includes('함께') || line.includes('같이')) {
        assignee = 'BOTH';
      }

      actionItems.push({
        id: `action-${Date.now()}-${idx}`,
        task: line,
        dueDate: defaultDueDate,
        assignee,
        completed: false
      });
    } else if (line.length > 5 && line.length < 35 && keyTopics.length < 4) {
      keyTopics.push(line);
    }
  });

  // 폴백 액션 아이템
  if (actionItems.length === 0) {
    actionItems.push({
      id: `action-${Date.now()}-0`,
      task: `[${person.name} ${person.currentTitle}] 미팅 감사 메시지 송부 및 논의 안건 정리`,
      dueDate: defaultDueDate,
      assignee: 'ME',
      completed: false
    });
  }

  // 감정 분석
  let sentiment: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL' = 'NEUTRAL';
  if (rawText.includes('긍정') || rawText.includes('좋') || rawText.includes('호의') || rawText.includes('성공적') || rawText.includes('도입') || rawText.includes('투자')) {
    sentiment = 'POSITIVE';
  } else if (rawText.includes('부정') || rawText.includes('어려') || rawText.includes('보류') || rawText.includes('부담') || rawText.includes('신중')) {
    sentiment = 'CRITICAL';
  }

  // 서머리 생성
  const summary = `${person.currentCompany} ${person.name} ${person.currentTitle}님과의 미팅. ${
    sentiment === 'POSITIVE' ? '분위기가 매우 우호적이며 적극적 협력 의향 확인.' : 
    sentiment === 'CRITICAL' ? '예산 및 일정 이슈로 신중한 검토 필요.' : 
    '상호 정보 교류 및 사업적 접점 탐색 완료.'
  } 총 ${actionItems.length}건의 후속 액션 아이템 도출됨.`;

  return {
    summary,
    keyTopics: keyTopics.length > 0 ? keyTopics : ['사업 협력 및 기술 교류', '하반기 추진 과제'],
    actionItems,
    sentiment,
    nextFollowUpDate: defaultDueDate
  };
}

/**
 * 미팅 회고 결과를 Person 객체의 ActivityLog 로 변환
 */
export function createActivityLogFromDebrief(
  personId: string,
  debrief: DebriefResult,
  rawMemo: string
): ActivityLog {
  const actionsList = debrief.actionItems.map(a => `- [${a.assignee}] ${a.task} (~${a.dueDate})`).join('\n');
  
  return {
    id: `log-${Date.now()}`,
    personId,
    type: 'meeting',
    title: `[미팅 회고] ${debrief.sentiment === 'POSITIVE' ? '🟢 우호적' : debrief.sentiment === 'CRITICAL' ? '🔴 신중' : '🟡 중립'} 협의`,
    content: `${debrief.summary}\n\n[원문 메모]\n${rawMemo}\n\n[도출된 액션 아이템]\n${actionsList}`,
    loggedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
}
