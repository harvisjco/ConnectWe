import { Person } from '../types/network';

export interface AudioBriefingSegment {
  id: number;
  category: 'PROFILE_DART' | 'PREVIOUS_ACTION' | 'TOP_AGENDA';
  categoryLabel: string;
  durationLabel: string;
  text: string;
}

export interface AudioBriefingScript {
  person: Person;
  greeting: string;
  fullText: string;
  estimatedDurationSec: number;
  segments: AudioBriefingSegment[];
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  rate: number;
  activeSegmentId: number;
}

/**
 * 인맥의 DART 공시, 직책, 과거 소통 로그 및 전문 도메인을 결합하여
 * 차량 이동/에어팟 착용 중 들을 수 있는 30초 라디오형 낭독 스크립트 합성
 */
export function generateAudioBriefingScript(person: Person): AudioBriefingScript {
  const name = person.name;
  const company = person.currentCompany || '파트너사';
  const title = person.currentTitle || '대표/임원';
  const isDartExecutive = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;

  // 1. 인트로 인사말
  const greeting = `${name} ${title}님과의 미팅 브리핑을 시작합니다.`;

  // 2. 세그먼트 1: 상대방 프로필 & 최근 DART/기업 동향 (10초)
  let seg1Text = '';
  if (isDartExecutive && person.dartInfo?.stockName) {
    seg1Text = `${name}님은 코스닥 상장사 ${person.dartInfo.stockName}의 ${person.dartInfo.registeredRole || title}으로, 최근 DART 공시 기준 주요 경영 의사결정을 주도하고 있습니다.`;
  } else if (person.primaryDomain) {
    seg1Text = `${name}님은 ${company}의 ${title}으로서, ${person.primaryDomain} 분야의 산업 혁신과 비즈니스 성장을 이끌고 있습니다.`;
  } else {
    seg1Text = `${name}님은 ${company}에서 ${title} 직책을 맡고 계시며, 당사와 긴밀한 협력 파트너십을 맺고 있는 핵심 경영진입니다.`;
  }

  // 3. 세그먼트 2: 지난 미팅 주요 약속 및 협의 내용 (10초)
  let seg2Text = '';
  const lastLog = person.activityLogs && person.activityLogs.length > 0 ? person.activityLogs[0] : null;
  if (lastLog) {
    seg2Text = `최근 소통 이력으로, ${lastLog.title} 건에 대해 상호 협의하였으며 실행 과제를 지속 점검 중입니다.`;
  } else if (person.memo) {
    seg2Text = `주요 메모 기록으로, ${person.memo.slice(0, 50)} 건에 대한 사전 논의가 있었습니다.`;
  } else {
    seg2Text = `최근 소통 공백이 다소 있었던 인물로, 오늘 미팅을 통해 상호 신뢰와 비즈니스 유대감을 다시 다지는 것이 중요합니다.`;
  }

  // 4. 세그먼트 3: 오늘 나눌 자연스러운 3대 화두 및 의제 (10초)
  let seg3Text = '';
  if (person.skills && person.skills.length > 0) {
    const focusSkills = person.skills.slice(0, 2).join(', ');
    seg3Text = `오늘의 핵심 화두는 첫째, ${focusSkills} 분야의 전략적 협력 기회, 둘째, 양사의 하반기 사업 로드맵 연계, 셋째, 신뢰 네트워크 확장입니다.`;
  } else {
    seg3Text = `오늘의 핵심 화두는 첫째, ${company}의 최근 중점 사업 방향 경청, 둘째, 당사와의 프로젝트 시너지 타진, 셋째, 정기적인 C-Level 교류 약속입니다.`;
  }

  const segments: AudioBriefingSegment[] = [
    {
      id: 1,
      category: 'PROFILE_DART',
      categoryLabel: '1. 프로필 & DART 팩트',
      durationLabel: '10초',
      text: seg1Text
    },
    {
      id: 2,
      category: 'PREVIOUS_ACTION',
      categoryLabel: '2. 직전 소통 & 약속 이력',
      durationLabel: '10초',
      text: seg2Text
    },
    {
      id: 3,
      category: 'TOP_AGENDA',
      categoryLabel: '3. 오늘 나눌 3대 핵심 화두',
      durationLabel: '10초',
      text: seg3Text
    }
  ];

  const fullText = `${greeting} ${seg1Text} ${seg2Text} ${seg3Text} 이상으로 30초 오디오 브리핑을 마칩니다. 성공적인 미팅을 기원합니다.`;

  return {
    person,
    greeting,
    fullText,
    estimatedDurationSec: 30,
    segments
  };
}

/**
 * 이동 중인 C-Level 경영진을 위한 3분 심층 팟캐스트 모드 스크립트 합성
 * (DART 거버넌스 팩트, 히스토리, 3대 아젠다, 에티켓 팁, 클로징 제언 포함)
 */
export function generatePodcastBriefingScript(person: Person): AudioBriefingScript {
  const name = person.name;
  const company = person.currentCompany || '파트너사';
  const title = person.currentTitle || '대표/임원';
  const isDartExecutive = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;

  // 1. 인트로 인사말
  const greeting = `안녕하세요. ${company}의 ${name} ${title}님과의 미팅을 앞둔 경영진을 위한 ConnectWe 3분 심층 오디오 팟캐스트 브리핑을 시작합니다.`;

  // 2. 세그먼트 1: 기업 지배구조 및 DART 공시 현황 (40초)
  let seg1Text = '';
  if (isDartExecutive && person.dartInfo?.stockName) {
    seg1Text = `먼저 상대 기업 및 거버넌스 현황입니다. ${name}님은 코스닥 상장사 ${person.dartInfo.stockName}에서 ${person.dartInfo.registeredRole || title} 직책을 맡고 있으며, 최근 금융감독원 전자공시 기준 주요 경영 안건과 이사회 의결에 깊이 관여하고 있습니다. 상장사의 규제 준수 및 투명한 거버넌스를 최우선시하므로, 신뢰성 있는 팩트 중심의 대화가 매우 유리합니다.`;
  } else if (person.primaryDomain) {
    seg1Text = `먼저 기업 및 산업 현황입니다. ${name}님은 ${company}의 ${title}으로서 ${person.primaryDomain} 분야의 기술 혁신과 시장 확장을 주도하고 계십니다. 비상장 혁신 생태계에서 독보적인 실행력과 기술적 영향력을 보유하고 있으며, 새로운 성장 동력 발굴에 높은 관심을 두고 있습니다.`;
  } else {
    seg1Text = `먼저 인물 개요입니다. ${name}님은 ${company}의 핵심 경영진으로서 조직의 전략 기획과 비즈니스 운영을 총괄하고 있습니다. 당사와는 상호 성장을 지향하는 신뢰 파트너십 관계를 지속하고 있습니다.`;
  }

  // 3. 세그먼트 2: 직전 미팅 논의 및 소통 이력 심층 분석 (40초)
  let seg2Text = '';
  const lastLog = person.activityLogs && person.activityLogs.length > 0 ? person.activityLogs[0] : null;
  if (lastLog) {
    seg2Text = `다음으로 지난 소통 이력 점검입니다. 가장 최근에는 '${lastLog.title}' 안건으로 상호 소통하였으며, 당시 논의된 후속 과제에 대한 관심이 이어지고 있습니다. 이전 미팅에서 나눈 약속이나 진행 현황을 먼저 자연스럽게 언급하시면 대화의 친밀도와 신뢰가 배가될 것입니다.`;
  } else if (person.memo) {
    seg2Text = `다음으로 기록된 메모 이력입니다. 사전 기록에 따르면 '${person.memo.slice(0, 80)}' 관련 논의가 확인됩니다. 상대방의 과거 관심사를 환기하며 대화를 시작하는 것을 추천합니다.`;
  } else {
    seg2Text = `다음으로 소통 히스토리입니다. 최근 일정 기간 동안 직접 대면 미팅 공백이 다소 있었습니다. 오늘 만남은 그간의 공백을 메우고 양사의 최신 비즈니스 현안을 편안하게 나누는 골든타임 티타임으로 활용하시기 바랍니다.`;
  }

  // 4. 세그먼트 3: 오늘 나눌 3대 전략 비즈니스 아젠다 (40초)
  let seg3Text = '';
  if (person.skills && person.skills.length > 0) {
    const focusSkills = person.skills.slice(0, 3).join(', ');
    seg3Text = `오늘 미팅에서 다룰 3대 핵심 아젠다입니다. 첫째, ${focusSkills} 분야에서의 전략적 기술 및 사업 시너지 타진, 둘째, 하반기 시장 변동성에 대응하기 위한 공동 대응안 모색, 셋째, 신뢰할 수 있는 상호 인재 및 네트워크 교류 활성화입니다.`;
  } else {
    seg3Text = `오늘 미팅의 3대 핵심 아젠다입니다. 첫째, ${company}의 당면 전략 과제 및 최근 현안 경청, 둘째, 당사와의 중장기 협력 프로젝트 기회 발굴, 셋째, 정기적인 C-Level 정보 교류 채널 정례화입니다.`;
  }

  // 5. 세그먼트 4: 품격 있는 에티켓 팁 & 클로징 (30초)
  const seg4Text = `${name} ${title}님과의 대화 시에는 상대방의 전문적 성취와 비전을 존중하고, 성급한 비즈니스 딜 제안보다는 경청과 공감을 앞세우는 것이 효과적입니다. 이것으로 3분 심층 팟캐스트 브리핑을 마칩니다. 보람차고 성공적인 미팅이 되시기를 진심으로 응원합니다.`;

  const segments: AudioBriefingSegment[] = [
    {
      id: 1,
      category: 'PROFILE_DART',
      categoryLabel: '1. 기업 현황 & DART 거버넌스',
      durationLabel: '40초',
      text: seg1Text
    },
    {
      id: 2,
      category: 'PREVIOUS_ACTION',
      categoryLabel: '2. 직전 소통 & 약속 이력',
      durationLabel: '40초',
      text: seg2Text
    },
    {
      id: 3,
      category: 'TOP_AGENDA',
      categoryLabel: '3. 오늘 나눌 3대 전략 아젠다',
      durationLabel: '40초',
      text: seg3Text
    },
    {
      id: 4,
      category: 'TOP_AGENDA',
      categoryLabel: '4. 맞춤형 에티켓 팁 & 제언',
      durationLabel: '30초',
      text: seg4Text
    }
  ];

  const fullText = `${greeting} ${seg1Text} ${seg2Text} ${seg3Text} ${seg4Text}`;

  return {
    person,
    greeting,
    fullText,
    estimatedDurationSec: 180,
    segments
  };
}

/**
 * 브라우저 Web Speech API 지원 여부 확인
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/**
 * Web Speech API 기반 음성 낭독 (온디바이스 TTS)
 */
export function playBriefingSpeech(
  text: string,
  options?: {
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.(new Error('Speech synthesis not supported in this browser.'));
    return null;
  }

  try {
    window.speechSynthesis.cancel(); // 이전 음성 취소

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = options?.rate || 1.1; // 자연스러운 브리핑 속도
    utterance.pitch = 1.0;

    // 한국어 프리미엄 음성 보이스 탐색
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find(v => v.lang.startsWith('ko') || v.name.includes('Korean'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    if (options?.onStart) utterance.onstart = options.onStart;
    if (options?.onEnd) utterance.onend = options.onEnd;
    if (options?.onError) utterance.onerror = (e) => options.onError?.(e);

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    options?.onError?.(err);
    return null;
  }
}

/**
 * 음성 일시 정지
 */
export function pauseBriefingSpeech(): void {
  if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

/**
 * 음성 다시 재생
 */
export function resumeBriefingSpeech(): void {
  if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/**
 * 음성 즉시 정지 및 리셋
 */
export function stopBriefingSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
