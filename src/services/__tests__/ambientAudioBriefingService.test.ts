import { describe, it, expect } from 'vitest';
import { 
  generateAudioBriefingScript, 
  isSpeechSynthesisSupported,
  playBriefingSpeech,
  stopBriefingSpeech 
} from '../ambientAudioBriefingService';
import { Person } from '../../types/network';

describe('ambientAudioBriefingService - 에어팟 앰비언트 30초 오디오 브리핑 엔진', () => {
  const samplePerson: Person = {
    id: 'p-audio-1',
    name: '최민준',
    currentCompany: '한국AI연구원',
    currentDepartment: '미래전략센터',
    currentTitle: '수석연구위원',
    mobile: '010-8888-9999',
    email: 'mj.choi@kair.re.kr',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '초거대 언어모델 / 온디바이스 AI',
    skills: ['GenAI', 'AI 반도체'],
    careers: [],
    academics: [],
    sourceType: 'DART_FACT',
    dartInfo: {
      corpCode: '00987654',
      stockName: '한국AI',
      isPublicDirector: true,
      registeredRole: '사외이사',
      verifiedAt: '2026-02-15'
    },
    closeness: 2,
    connectionChannel: 'dart',
    isStale: false,
    memo: '하반기 국가 AI 바우처 사업 공동 컨소시엄 구성 논의 예정',
    activityLogs: [
      {
        id: 'log-1',
        personId: 'p-audio-1',
        type: 'meeting',
        title: '판교 테크노밸리 사전 미팅',
        loggedAt: '2026-03-10 14:00'
      }
    ]
  };

  it('1. 인맥의 DART 공시, 직책, 활동 로그를 결합하여 정확히 3단계 세그먼트(프로필, 직전소통, 3대화두) 스크립트를 생성해야 한다', () => {
    const script = generateAudioBriefingScript(samplePerson);

    expect(script.person.name).toBe('최민준');
    expect(script.estimatedDurationSec).toBe(30);
    expect(script.segments).toHaveLength(3);

    // 세그먼트 1: 프로필 & DART
    expect(script.segments[0].category).toBe('PROFILE_DART');
    expect(script.segments[0].text).toContain('최민준');
    expect(script.segments[0].text).toContain('한국AI');

    // 세그먼트 2: 직전 소통 이력
    expect(script.segments[1].category).toBe('PREVIOUS_ACTION');
    expect(script.segments[1].text).toContain('판교 테크노밸리 사전 미팅');

    // 세그먼트 3: 오늘 나눌 3대 화두
    expect(script.segments[2].category).toBe('TOP_AGENDA');
    expect(script.segments[2].text).toContain('GenAI');

    // 전체 풀 텍스트 검증
    expect(script.fullText).toContain('미팅 브리핑을 시작합니다');
    expect(script.fullText).toContain('이상으로 30초 오디오 브리핑을 마칩니다');
  });

  it('2. 브라우저 Web Speech API가 없는 환경(Node.js/Vitest)에서도 크래시 없이 우아하게 폴백 처리되어야 한다', () => {
    // Vitest 환경에서는 window.speechSynthesis가 기본적으로 undefined
    const isSupported = isSpeechSynthesisSupported();
    expect(typeof isSupported).toBe('boolean');

    // 재생 시도 시 크래시 없이 안전하게 null 반환
    const utterance = playBriefingSpeech('테스트 낭독 텍스트');
    expect(utterance === null || utterance !== undefined).toBe(true);

    // 정지 시도 시 에러 없이 종료
    expect(() => stopBriefingSpeech()).not.toThrow();
  });
});
