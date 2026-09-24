import { Person } from '../types/network';
import { DebriefResult } from './meetingDebriefService';

export type FollowUpTone = 'formal' | 'casual_coffee' | 'next_step';

export interface FollowUpDraft {
  tone: FollowUpTone;
  label: string;
  emailSubject: string;
  emailBody: string;
  kakaoMessage: string;
}

/**
 * 미팅 후 24시간 이내 최적화된 감사 및 후속 액션 메시지 생성
 */
export function generateFollowUpDrafts(
  person: Person,
  debrief?: DebriefResult
): FollowUpDraft[] {
  const isDart = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;
  const company = person.currentCompany;
  const name = person.name;
  const title = person.currentTitle;

  const topicsSummary = debrief?.keyTopics && debrief.keyTopics.length > 0
    ? debrief.keyTopics.join(', ')
    : '사업 협력 및 차세대 비즈니스 모델';

  const actionText = debrief?.actionItems && debrief.actionItems.length > 0
    ? debrief.actionItems.map(a => `• ${a.task} (예정일: ${a.dueDate || '협의'})`).join('\n')
    : '• 논의된 내용 바탕으로 내부 검토 후 차주 중 피드백 송부';

  // 1. 공식 엔터프라이즈 비즈니스 톤
  const formalDraft: FollowUpDraft = {
    tone: 'formal',
    label: '💼 정중한 엔터프라이즈 비즈니스',
    emailSubject: `[감사 인사] ${company} ${name} ${title}님, 오늘 미팅 감사드립니다.`,
    emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. 오늘 바쁘신 일정 중에도 귀한 시간 내어주셔서 진심으로 감사드립니다.\n\n금일 미팅을 통해 [${topicsSummary}]와 관련된 ${company}의 전략적 방향성과 현장의 통찰을 깊이 있게 이해할 수 있어 매우 뜻깊은 시간이었습니다.${
      isDart ? ` 특히 공시 임원으로서 추진하고 계신 사업 비전에 많은 영감을 받았습니다.` : ''
    }\n\n오늘 논의된 주요 후속 액션 아이템은 아래와 같이 정리하여 차질 없이 진행토록 하겠습니다:\n\n${actionText}\n\n추가로 필요한 자료나 문의사항이 있으시면 언제든지 편하게 말씀 부탁드립니다. 환절기 건강 유의하시고, 유익한 결실로 이어지기를 기대하겠습니다.\n\n감사합니다.\n올림`,
    kakaoMessage: `${name} ${title}님, 오늘 바쁘신 와중에 귀한 시간 내주셔서 진심으로 감사드립니다! 말씀 주신 [${topicsSummary}] 관련하여 논의된 내용 잘 정리하여 다음 주 중으로 신속히 피드백 드리겠습니다. 편안한 저녁 시간 되십시오. 감사합니다!`
  };

  // 2. 부드러운 커피챗/네트워킹 톤
  const casualDraft: FollowUpDraft = {
    tone: 'casual_coffee',
    label: '☕ 친근한 커피챗 & 네트워킹',
    emailSubject: `${name}님, 오늘 커피챗 즐거웠습니다! (${company})`,
    emailBody: `${name}님,\n\n오늘 바쁘신 일정 중에도 시간 내주셔서 정말 반가웠습니다.\n\n편안한 분위기 속에서 [${topicsSummary}]에 대해 나누어주신 솔직하고 깊이 있는 이야기들이 큰 울림이 되었습니다.\n\n말씀해주신 부분들 저도 메모해두었으며, 조만간 또 편하게 차 한잔 모시겠습니다. 앞으로도 좋은 인연 이어가길 희망합니다.\n\n감사합니다!`,
    kakaoMessage: `${name}님! 오늘 바쁘신데 나와주셔서 정말 감사했습니다 ☕ 나누어주신 [${topicsSummary}] 이야기 덕분에 많은 인사이트 얻고 갑니다. 말씀주신 부분 잘 챙겨볼게요! 조만간 또 편하게 봬요 :)`
  };

  // 3. 신속한 후속 일정/자료 송부 톤
  const nextStepDraft: FollowUpDraft = {
    tone: 'next_step',
    label: '⚡ 자료 송부 및 캘린더 조율',
    emailSubject: `[후속 자료] ${company} 미팅 관련 자료 송부 및 일정 조율 건 (${name} ${title}님)`,
    emailBody: `${company} ${name} ${title}님,\n\n오늘 미팅에서 말씀 나누었던 핵심 자료를 첨부와 같이 송부드립니다.\n\n[주요 진행 항목]\n${actionText}\n\n검토해 보시고 추가 논의가 필요하신 경우 편하신 시간대로 캘린더 일정을 잡아주시면 맞추어 참석하도록 하겠습니다.\n\n감사합니다.`,
    kakaoMessage: `${name} ${title}님, 오늘 미팅 감사드립니다. 방금 메일로 요청해주셨던 [${topicsSummary}] 관련 자료 송부드렸습니다. 확인 부탁드리며, 후속 미팅 일정도 편하실 때 말씀해주시면 맞추겠습니다. 감사합니다!`
  };

  return [formalDraft, casualDraft, nextStepDraft];
}
