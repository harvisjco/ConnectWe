import { Person } from '../types/network';

export type LetterScenarioType =
  | 'TEA_TIME_INVITE'
  | 'POST_MEETING_THANKS'
  | 'COLLABORATION_REQUEST'
  | 'PROMOTION_CONGRATS'
  | 'WARM_RECONNECT';

export interface LetterTemplateMetadata {
  type: LetterScenarioType;
  title: string;
  badge: string;
  description: string;
}

export const LETTER_SCENARIOS: LetterTemplateMetadata[] = [
  {
    type: 'TEA_TIME_INVITE',
    title: '정중한 첫 티타임 제안',
    badge: '첫 만남',
    description: '상대방의 전문 영역에 대한 경의를 표하며 부담 없는 30분 티타임을 청하는 서신'
  },
  {
    type: 'POST_MEETING_THANKS',
    title: '미팅 직후 감사 & 후속 조율',
    badge: '골든타임 팔로업',
    description: '나눈 대화의 가치를 짚고 향후 후속 일정을 정중하게 제안하는 감사 서신'
  },
  {
    type: 'COLLABORATION_REQUEST',
    title: '전략적 사업 협력 제안',
    badge: '비즈니스 파트너십',
    description: '상호 시너지가 기대되는 구체적 도메인을 명시하여 협업 논의를 요청하는 서신'
  },
  {
    type: 'PROMOTION_CONGRATS',
    title: '영전 & 신임 보직 축하',
    badge: '축하 & 신뢰',
    description: '새로운 직책 또는 성과를 진심으로 축하하고 건승을 기원하는 축하 서신'
  },
  {
    type: 'WARM_RECONNECT',
    title: '따뜻한 안부 & 리커넥트',
    badge: '관계 케어',
    description: '한동안 소식이 뜸했던 소중한 인연에게 부담 없이 안부를 묻는 서신'
  }
];

export interface LetterGenerateOptions {
  senderName?: string;
  senderTitle?: string;
  senderCompany?: string;
  customTopic?: string;
  meetingDate?: string;
}

/**
 * 비즈니스 서신 수신자 직함 정규화 (괄호 부가설명 정리 및 격조 높은 호칭 보정)
 */
export function sanitizeTitleForEtiquette(rawTitle?: string): string {
  if (!rawTitle) return '리더';
  // 1. 끝에 '님'이 이미 붙어있으면 제거
  let clean = rawTitle.replace(/님$/i, '').trim();
  // 2. 괄호 안 부가설명 정리 (예: 대표이사 (CEO) -> 대표이사)
  clean = clean.replace(/\s*\([^)]*\)/g, '').trim();
  // 3. 슬래시 복합 직책 분리 (예: CTO / 사내이사 -> CTO)
  if (clean.includes('/')) {
    clean = clean.split('/')[0].trim();
  }
  return clean || rawTitle;
}

/**
 * 인물 정보와 옵션을 바탕으로 상황별 완성형 비즈니스 서신 텍스트 생성
 */
export function generateBusinessLetter(
  person: Person,
  scenario: LetterScenarioType,
  options: LetterGenerateOptions = {}
): string {
  const name = person.name || '대표';
  const company = person.currentCompany || '귀사';
  const title = sanitizeTitleForEtiquette(person.currentTitle);
  const domain = person.primaryDomain || (person.skills && person.skills[0]) || '산업 혁신';
  const senderName = options.senderName || 'ConnectWe 파트너';
  const senderOrg = options.senderCompany 
    ? `${options.senderCompany} ${options.senderTitle || ''}`.trim() 
    : '비즈니스 파트너십팀';
  const customTopic = options.customTopic?.trim();

  switch (scenario) {
    case 'TEA_TIME_INVITE':
      return [
        `안녕하십니까, ${company} ${name} ${title}님.`,
        ``,
        `평소 ${name} ${title}님께서 ${company}에서 이끌어 오신 ${domain} 분야의 선도적인 통찰과 행보를 깊은 존경의 마음으로 지켜보았습니다.`,
        ``,
        customTopic 
          ? `다름이 아니라, 최근 논의되고 있는 [${customTopic}] 아젠다와 관련하여 ${title}님의 귀한 혜안을 여쭙고 싶어 조심스럽게 연락을 드립니다.`
          : `다름이 아니라, 향후 ${domain} 생태계와 관련하여 양사 간의 건설적인 시너지를 모색해보고자 조심스럽게 연락을 드립니다.`,
        ``,
        `공무로 분주하실 줄 아오나, 다음 주 편하신 일정 중 30분 정도 부담 없는 따뜻한 티타임을 모실 수 있다면 더없는 영광이겠습니다.`,
        ``,
        `편하신 시간대와 선호하시는 장소를 편히 회신 주시면, 정성을 다해 일정을 맞추어 찾아뵙도록 하겠습니다.`,
        ``,
        `환절기 건강 유의하시고, 늘 건승하시기를 기원합니다.`,
        ``,
        `감사합니다.`,
        `${senderName} 드림`,
        `(${senderOrg})`
      ].join('\n');

    case 'POST_MEETING_THANKS':
      return [
        `안녕하십니까, ${name} ${title}님.`,
        ``,
        `오늘 바쁘신 일정 중에도 귀한 시간을 내어주시고, 따뜻하게 맞아주셔서 진심으로 감사드립니다.`,
        ``,
        customTopic
          ? `오늘 나누어주신 [${customTopic}]에 관한 깊이 있는 조언과 현장의 통찰은 저희에게 매우 큰 영감과 명확한 방향성이 되었습니다.`
          : `${company}의 비전과 ${domain} 분야에 대한 ${title}님의 깊이 있는 혜안 덕분에 뜻깊은 배움과 공감의 시간이었습니다.`,
        ``,
        `오늘 말씀 나누었던 핵심 논의 사항은 내부적으로 신중하고 속도감 있게 검토하여, 말씀주신 일정에 맞추어 다음 단계를 정중히 안내해 드리겠습니다.`,
        ``,
        `추가로 공유해 드릴 자료나 일정 조율이 필요하시면 언제든 편히 말씀해 주십시오.`,
        ``,
        `오늘 맺은 귀한 인연이 상호 발전적인 결실로 이어지기를 진심으로 기대합니다.`,
        ``,
        `감사합니다.`,
        `${senderName} 드림`,
        `(${senderOrg})`
      ].join('\n');

    case 'COLLABORATION_REQUEST':
      return [
        `안녕하십니까, ${company} ${name} ${title}님.`,
        ``,
        `${company}의 눈부신 성장과 ${name} ${title}님의 탁월한 리더십에 깊은 경의를 표합니다.`,
        ``,
        customTopic
          ? `현재 저희가 추진 중인 [${customTopic}] 프로젝트와 관련하여, ${company}의 독보적인 역량과 결합했을 때 압도적인 비즈니스 시너지가 창출될 수 있을 것으로 기대되어 정중히 협력을 제안드립니다.`
          : `현재 ${domain} 분야에서 양사가 지닌 핵심 강점을 유기적으로 결합할 때, 시장에 강력한 임팩트를 줄 수 있는 전략적 파트너십 기회가 있을 것으로 판단되어 정중히 협업을 제안드립니다.`,
        ``,
        `상호 윈-윈(Win-Win)할 수 있는 협업 방안에 대해 개괄적으로 준비된 1-Page 브리프를 공유해 드리고, ${title}님의 의견을 경청하고자 합니다.`,
        ``,
        `일정상 편하신 때에 온/오프라인으로 20~30분가량 가볍게 티타임 미팅을 가질 수 있으실지 여쭙습니다.`,
        ``,
        `긍정적인 검토를 부탁드리며, 평안한 한 주 보내시길 바랍니다.`,
        ``,
        `감사합니다.`,
        `${senderName} 드림`,
        `(${senderOrg})`
      ].join('\n');

    case 'PROMOTION_CONGRATS':
      return [
        `안녕하십니까, ${company} ${name} ${title}님!`,
        ``,
        `금번 ${company}에서의 영전(취임) 소식을 전해 듣고 기쁜 마음으로 축하의 인사를 올립니다.`,
        ``,
        `그간 ${name} ${title}님께서 현장에서 보여주신 헌신과 탁월한 전문성이 마땅히 높게 평가받은 결과라 생각되며, 진심으로 축하의 박수를 보냅니다.`,
        ``,
        `새로운 중책을 맡으시어 더욱 분주하고 책임감이 막중하시겠지만, ${title}님의 혜안과 포용적인 리더십으로 조직이 한 단계 더 크게 도약할 것임을 믿어 의심치 않습니다.`,
        ``,
        `모쪼록 건강 늘 챙기시며 건승하시길 항상 응원하겠습니다.`,
        `조금 여유가 생기실 때 따뜻한 차 한 잔 모시며 축하의 잔을 나누고 싶습니다.`,
        ``,
        `다시 한번 진심으로 축하드립니다.`,
        ``,
        `${senderName} 드림`,
        `(${senderOrg})`
      ].join('\n');

    case 'WARM_RECONNECT':
      return [
        `안녕하십니까, ${name} ${title}님.`,
        `그간 평안하셨는지 안부 여쭙니다.`,
        ``,
        `일전에 ${domain} 관련하여 나누었던 귀한 대화와 온기가 문득 떠올라, 오랜만에 반가운 마음으로 소식 전합니다.`,
        ``,
        customTopic
          ? `최근 ${company}의 [${customTopic}] 관련 활약을 접하며 늘 ${name} ${title}님의 멋진 행보를 마음 깊이 응원하고 있었습니다.`
          : `언론과 업계에서 전해지는 ${company}의 멋진 활약을 접할 때마다, ${name} ${title}님의 든든한 리더십을 떠올리며 응원하고 있었습니다.`,
        ``,
        `특별한 용무가 아니더라도, 근처를 지나실 일 있으시거나 편하실 때 가볍게 커피 한 잔 나누며 그간의 이야기 나누고 싶습니다.`,
        ``,
        `바쁜 일상이시겠지만 항상 건강 유의하시고, 늘 행복한 일들만 가득하시기를 진심으로 기원합니다.`,
        ``,
        `감사합니다.`,
        `${senderName} 드림`,
        `(${senderOrg})`
      ].join('\n');

    default:
      return `안녕하십니까, ${name} ${title}님.`;
  }
}
