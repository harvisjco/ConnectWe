import { Person } from '../types/network';
import { triggerHaptic } from '../utils/hapticFeedback';

export type FollowUpTone = 'FORMAL' | 'WARM_PARTNER' | 'CASUAL_COFFEE';

export interface FollowUpOptions {
  tone?: FollowUpTone;
  topic?: string;
  senderName?: string;
  senderTitle?: string;
}

/**
 * 상대방의 성함, 소속, 직책과 오늘 날짜를 조합하여 격조 높은 미팅 감사 서신 생성
 */
export function generateMeetingFollowUpMessage(
  person: Person,
  options: FollowUpOptions = {}
): string {
  const {
    tone = 'FORMAL',
    topic,
    senderName = '김대표',
    senderTitle
  } = options;

  const titleWithHonorific = person.currentTitle ? `${person.currentTitle}님` : '대표님';
  const senderSignature = senderTitle ? `${senderName} ${senderTitle} 드림` : `${senderName} 드림`;
  const companyContext = person.currentCompany ? `[${person.currentCompany}]` : '';

  const today = new Date();
  const dateFormatted = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  switch (tone) {
    case 'WARM_PARTNER':
      return `${person.name} ${titleWithHonorific}, 오늘 ${dateFormatted} 귀한 시간 내어주셔서 진심으로 감사드립니다.\n\n` +
        (topic 
          ? `나누어주신 '${topic}' 관련 혜안과 사업적 방향성에 큰 영감을 받았습니다.\n\n`
          : `${companyContext}과의 협력 가능성과 미래 시너지에 대해 말씀 나눌 수 있어 무척 뜻깊었습니다.\n\n`) +
        `오늘 논의된 내용을 바탕으로 저희 팀에서도 신속히 구체화하여 조만간 다시 연락 올리겠습니다.\n\n` +
        `환절기 건강 유의하시고, 평안한 하루 보내시길 바랍니다.\n\n` +
        `${senderSignature}`;

    case 'CASUAL_COFFEE':
      return `${person.name} ${titleWithHonorific}, 오늘 ${dateFormatted} 바쁘신 와중에 편안한 차 한잔 함께해 주셔서 감사했습니다!\n\n` +
        (topic 
          ? `말씀해 주신 '${topic}' 이야기 덕분에 많은 자극과 배움을 얻었습니다.\n\n`
          : `서로의 근황과 사업 고민을 나눌 수 있어 정말 즐겁고 유익한 시간이었습니다.\n\n`) +
        `다음에 근처 오실 일 있으시면 편하게 연락 주십시오. 맛있는 식사 한번 모시겠습니다.\n\n` +
        `${senderSignature}`;

    case 'FORMAL':
    default:
      return `${companyContext} ${person.name} ${titleWithHonorific}께,\n\n` +
        `안녕하십니까, ${senderName}입니다.\n\n` +
        `금일 바쁘신 일정 중에도 귀한 시간 내어 미팅에 응해주셔서 깊은 감사의 말씀을 올립니다.\n\n` +
        (topic 
          ? `오늘 함께 논의한 '${topic}' 안건에 대해 의미 있는 교감을 나눌 수 있어 매우 뜻깊었습니다.\n\n`
          : `오늘 나눈 심도 있는 대화를 통해 상호 발전적인 협력의 단초를 마련할 수 있어 매우 뜻깊었습니다.\n\n`) +
        `오늘 말씀해 주신 고견을 소중히 새겨, 향후 비즈니스 파트너십 구축에 만전을 기하겠습니다.\n\n` +
        `늘 건승하시기를 기원합니다.\n\n` +
        `${senderSignature}`;
  }
}

/**
 * 원터치 클립보드 복사 및 촉각 햅틱 피드백 연동
 */
export async function copyMeetingFollowUpToClipboard(
  person: Person,
  options: FollowUpOptions = {}
): Promise<boolean> {
  const message = generateMeetingFollowUpMessage(person, options);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      triggerHaptic('success');
      return true;
    }
  } catch {
    // 클립보드 API 실패 시 폴백
  }
  return false;
}
