import { Person } from '../types/network';
import { DebriefResult } from './meetingDebriefService';
import { identifyTalentCluster } from './talentClusterEngine';

export type FollowUpTone = 'cluster_tailored' | 'formal' | 'casual_coffee' | 'next_step';

export interface FollowUpDraft {
  tone: FollowUpTone;
  label: string;
  clusterBadge?: string;
  emailSubject: string;
  emailBody: string;
  kakaoMessage: string;
}

/**
 * 인물의 고유 클러스터 강점(Superpower)에 기반한 맞춤형 티타임 제안문 생성
 */
function generateClusterTeatimeDraft(person: Person): FollowUpDraft {
  const cluster = identifyTalentCluster(person);
  const company = person.currentCompany;
  const name = person.name;
  const title = person.currentTitle;

  switch (cluster.id) {
    case 'VENTURE_LEADER':
      return {
        tone: 'cluster_tailored',
        label: `맞춤 티타임 (${cluster.label})`,
        clusterBadge: cluster.label,
        emailSubject: `[티타임 제안] ${company} ${name} ${title}님, 역동적인 사업 비전과 협업 기회를 나누고 싶습니다.`,
        emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. 평소 ${company}이 시장에서 보여주고 계신 기동성 있는 실행력과 혁신적인 도전을 깊은 관심을 가지고 지켜보고 있습니다.\n\n${title}님께서 이끌고 계신 비즈니스의 빠른 호흡과 전략적 스콥에 많은 귀감을 얻고 있으며, 향후 양사가 창출할 수 있는 시너지에 관해 가볍게 20분 정도 차 한 잔 나누며 이야기 나눌 수 있을지 여쭙고자 합니다.\n\n대표님/임원님의 바쁘신 일정 중 편하신 날짜나 시간대(판교, 테헤란로 또는 화상 티타임)를 편하게 말씀해주시면 최대한 맞추어 찾아뵙겠습니다.\n\n감사합니다.\n올림`,
        kakaoMessage: `${name} ${title}님, 안녕하세요! 평소 ${company}의 역동적인 사업 행보 늘 인상 깊게 응원하고 있습니다. 이번 주나 다음 주 중 편하신 시간에 가볍게 차 한 잔 모시며 시너지 낼 수 있는 협업 포인트 편하게 이야기 나눌 수 있을지요? 편하실 때 회신 부탁드립니다!`
      };

    case 'TECH_FELLOW':
      return {
        tone: 'cluster_tailored',
        label: `맞춤 티타임 (${cluster.label})`,
        clusterBadge: cluster.label,
        emailSubject: `[기술 교류 제안] ${company} ${name} ${title}님, 원천 기술 트렌드 및 아키텍처 관련 티타임 여쭙니다.`,
        emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. ${name}님께서 ${company}에서 이끌고 계신 첨단 기술 R&D 성과와 엔지니어링 통찰을 늘 뜻깊게 접하고 있습니다.\n\n급변하는 산업 기술 프론티어 속에서 ${name}님께서 축적해 오신 공학적 노하우와 시스템 아키텍처 비전에 관해 가볍게 차 한 잔 모시며 고견을 여쭙고자 합니다.\n\n연구 및 개발 일정에 지장이 없으시도록 펠로우님 연구실 인근이나 편하신 카페에서 15~20분 내외로 정중히 모시겠습니다. 편하신 시간대를 알려주시면 감사하겠습니다.\n\n감사합니다.\n올림`,
        kakaoMessage: `${name}님, 안녕하세요! 최근 공개해주신 기술 아티클과 연구 인사이트 늘 깊은 울림으로 보고 있습니다. 연구 일정 중 틈나실 때 가볍게 커피 한 잔 나누며 기술 트렌드에 대해 조언 여쭙고 싶습니다. 편하실 때 말씀해주세요!`
      };

    case 'INVESTOR_PARTNER':
      return {
        tone: 'cluster_tailored',
        label: `맞춤 티타임 (${cluster.label})`,
        clusterBadge: cluster.label,
        emailSubject: `[파트너십 교류] ${company} ${name} ${title}님, 거시 산업 동향 및 딜 시너지 티타임 제안드립니다.`,
        emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. 자본 시장의 거시 생태계와 기업 가치 스케일업을 주도하고 계신 ${name} ${title}님의 혜안을 늘 존경하고 있습니다.\n\n최근 급변하는 투자 환경과 유망 산업 도메인의 시너지 기회에 관해 가볍게 차 한 잔 모시며 인사이트를 나누고 싶어 연락드렸습니다.\n\n강남 테헤란로나 여의도 등 파트너님 업무 동선에 맞추어 언제든 찾아뵙겠습니다. 편하신 일정 공유해 주시면 차질 없이 준비하겠습니다.\n\n감사합니다.\n올림`,
        kakaoMessage: `${name} 파트너님, 안녕하십니까! 투자 시장과 산업 거시 생태계 관련 늘 귀한 혜안 얻고 있습니다. 이번 주 테헤란로/여의도 근처 미팅 있으실 때 15분 정도 가볍게 커피 한 잔 모실 수 있을지요? 편하실 때 말씀 주십시오!`
      };

    case 'LISTED_EXECUTIVE':
      return {
        tone: 'cluster_tailored',
        label: `맞춤 티타임 (${cluster.label})`,
        clusterBadge: cluster.label,
        emailSubject: `[경영 인사] ${company} ${name} ${title}님, 투명한 거버넌스 및 전략적 제휴 관련 차 한 잔 모시고자 합니다.`,
        emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. 전자공시(DART)로 검증된 투명한 공적 거버넌스와 대규모 조직을 성공적으로 이끌고 계신 ${name} ${title}님의 리더십에 깊은 경의를 표합니다.\n\n시장 신뢰 속에서 지속 가능한 성장을 도모하시는 ${company}과의 전략적 파트너십 가능성을 타진하고, 정중한 안부를 전하고자 차 한 잔의 짧은 티타임을 청합니다.\n\n본사 사옥 인근이나 원하시는 장소로 편하신 시간에 맞추어 방문드리겠습니다.\n\n감사합니다.\n올림`,
        kakaoMessage: `${name} ${title}님, 안녕하십니까. 늘 조직을 모범적으로 이끌어주시는 모습 큰 귀감이 되고 있습니다. 공무 일정 중 여유가 생기실 때 정중히 차 한 잔 모실 수 있다면 큰 영광이겠습니다. 편안한 하루 되십시오!`
      };

    case 'CORE_SPECIALIST':
    default:
      return {
        tone: 'cluster_tailored',
        label: `맞춤 티타임 (${cluster.label})`,
        clusterBadge: cluster.label,
        emailSubject: `[프로덕트 교류] ${company} ${name}님, 현장 프로덕트 빌딩 경험과 노하우 나누고 싶습니다.`,
        emailBody: `${company} ${name}님께,\n\n안녕하십니까. 현장에서 최고의 완성도로 프로덕트와 서비스를 직접 구축하고 계신 ${name}님의 탁월한 전문성을 늘 눈여겨보았습니다.\n\n실무 현장의 생생한 문제해결 경험과 최신 빌딩 노하우를 편안한 분위기 속에서 나누며 좋은 인연을 맺고 싶습니다.\n\n업무에 부담되지 않으시도록 점심 시간이나 퇴근길 인근 카페에서 20분 내외의 가벼운 티타임을 모시겠습니다. 편하신 시간 언제든 말씀 부탁드립니다.\n\n감사합니다.\n올림`,
        kakaoMessage: `${name}님, 안녕하세요! 만드시는 프로덕트 완성도 늘 감탄하며 지켜보고 있습니다. 바쁘실 텐데 부담 없이 편한 시간에 커피챗 한번 나누며 이야기 나눌 수 있을까요? 편하실 때 말씀해주세요 :)`
      };
  }
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

  // 0. 5대 인재 클러스터 맞춤형 티타임 제안문 (최우선 배치)
  const clusterDraft = generateClusterTeatimeDraft(person);

  // 1. 공식 엔터프라이즈 비즈니스 톤
  const formalDraft: FollowUpDraft = {
    tone: 'formal',
    label: '정중한 엔터프라이즈 비즈니스',
    emailSubject: `[감사 인사] ${company} ${name} ${title}님, 오늘 미팅 감사드립니다.`,
    emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. 오늘 바쁘신 일정 중에도 귀한 시간 내어주셔서 진심으로 감사드립니다.\n\n금일 미팅을 통해 [${topicsSummary}]와 관련된 ${company}의 전략적 방향성과 현장의 통찰을 깊이 있게 이해할 수 있어 매우 뜻깊은 시간이었습니다.${
      isDart ? ` 특히 공시 임원으로서 추진하고 계신 사업 비전에 많은 영감을 받았습니다.` : ''
    }\n\n오늘 논의된 주요 후속 액션 아이템은 아래와 같이 정리하여 차질 없이 진행토록 하겠습니다:\n\n${actionText}\n\n추가로 필요한 자료나 문의사항이 있으시면 언제든지 편하게 말씀 부탁드립니다. 환절기 건강 유의하시고, 유익한 결실로 이어지기를 기대하겠습니다.\n\n감사합니다.\n올림`,
    kakaoMessage: `${name} ${title}님, 오늘 바쁘신 와중에 귀한 시간 내주셔서 진심으로 감사드립니다! 말씀 주신 [${topicsSummary}] 관련하여 논의된 내용 잘 정리하여 다음 주 중으로 신속히 피드백 드리겠습니다. 편안한 저녁 시간 되십시오. 감사합니다!`
  };

  // 2. 부드러운 커피챗/네트워킹 톤
  const casualDraft: FollowUpDraft = {
    tone: 'casual_coffee',
    label: '친근한 커피챗 & 네트워킹',
    emailSubject: `${name}님, 오늘 커피챗 즐거웠습니다! (${company})`,
    emailBody: `${name}님,\n\n오늘 바쁘신 일정 중에도 시간 내주셔서 정말 반가웠습니다.\n\n편안한 분위기 속에서 [${topicsSummary}]에 대해 나누어주신 솔직하고 깊이 있는 이야기들이 큰 울림이 되었습니다.\n\n말씀해주신 부분들 저도 메모해두었으며, 조만간 또 편하게 차 한잔 모시겠습니다. 앞으로도 좋은 인연 이어가길 희망합니다.\n\n감사합니다!`,
    kakaoMessage: `${name}님! 오늘 바쁘신데 나와주셔서 정말 감사했습니다. 나누어주신 [${topicsSummary}] 이야기 덕분에 많은 인사이트 얻고 갑니다. 말씀주신 부분 잘 챙겨볼게요! 조만간 또 편하게 봬요 :)`
  };

  // 3. 신속한 후속 일정/자료 송부 톤
  const nextStepDraft: FollowUpDraft = {
    tone: 'next_step',
    label: '자료 송부 및 캘린더 조율',
    emailSubject: `[후속 자료] ${company} 미팅 관련 자료 송부 및 일정 조율 건 (${name} ${title}님)`,
    emailBody: `${company} ${name} ${title}님,\n\n오늘 미팅에서 말씀 나누었던 핵심 자료를 첨부와 같이 송부드립니다.\n\n[주요 진행 항목]\n${actionText}\n\n검토해 보시고 추가 논의가 필요하신 경우 편하신 시간대로 캘린더 일정을 잡아주시면 맞추어 참석하도록 하겠습니다.\n\n감사합니다.`,
    kakaoMessage: `${name} ${title}님, 오늘 미팅 감사드립니다. 방금 메일로 요청해주셨던 [${topicsSummary}] 관련 자료 송부드렸습니다. 확인 부탁드리며, 후속 미팅 일정도 편하실 때 말씀해주시면 맞추겠습니다. 감사합니다!`
  };

  return [clusterDraft, formalDraft, casualDraft, nextStepDraft];
}
