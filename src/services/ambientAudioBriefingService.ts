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
