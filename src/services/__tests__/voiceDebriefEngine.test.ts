import { describe, it, expect } from 'vitest';
import { analyzeVoiceDebrief, matchPersonFromTranscript } from '../voiceDebriefEngine';
import { Person } from '../../types/network';

describe('voiceDebriefEngine (C-Level 이동 중 음성 회고 AI)', () => {
  const mockPeople: Person[] = [
    {
      id: 'p-1',
      name: '김민수',
      currentCompany: '카카오인베스트먼트',
      currentDepartment: '투자본부',
      currentTitle: '대표이사',
      mobile: '010-1234-5678',
      email: 'minsu@kakao.com',
      closeness: 1,
      sourceType: 'DART_FACT',
      skills: ['투자', 'VC'],
      careers: [],
      academics: [],
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '투자/VC',
      isStale: false,
      connectionChannel: 'dart'
    },
    {
      id: 'p-2',
      name: '이수진',
      currentCompany: '네이버클라우드',
      currentDepartment: 'AI전략실',
      currentTitle: '상무',
      mobile: '010-9876-5432',
      email: 'sujin@naver.com',
      closeness: 2,
      sourceType: 'DART_FACT',
      skills: ['AI', '클라우드'],
      careers: [],
      academics: [],
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '클라우드/인프라',
      isStale: false,
      connectionChannel: 'dart'
    }
  ];

  it('음성 텍스트에서 인물과 회사를 정확하게 자동 매칭해야 한다', () => {
    const transcript = '방금 카카오인베스트먼트 김민수 대표 만나고 나오는 길이야';
    const matched = matchPersonFromTranscript(transcript, mockPeople);
    expect(matched).not.toBeNull();
    expect(matched?.name).toBe('김민수');
    expect(matched?.currentCompany).toBe('카카오인베스트먼트');
  });

  it('투자 및 금액 키워드가 포함된 음성에서 딜 업데이트 및 액션아이템을 추출해야 한다', () => {
    const transcript = '김민수 대표 만났고 시리즈B 50억원 라운드 참여 긍정적 검토 확정했어. 다음 주 수요일까지 IR 자료랑 재무제표 보내주기로 했음.';
    const result = analyzeVoiceDebrief(transcript, mockPeople);

    expect(result.matchedPerson.name).toBe('김민수');
    expect(result.dealUpdate).toBeDefined();
    expect(result.dealUpdate?.estimatedAmount).toContain('50억');
    expect(result.dealUpdate?.stage).toBe('COMMITTED');
    expect(result.actionItems.length).toBeGreaterThan(0);
    expect(result.followUpLetter).toContain('김민수 대표이사님');
    expect(result.followUpLetter).toContain('보내주기로');
  });

  it('부정적/신중 뉘앙스를 감지하여 감정 및 서머리에 반영해야 한다', () => {
    const transcript = '이수진 상무와 미팅 완료. 올해 예산 동결 이슈로 당장 도입은 어렵고 신중 검토하기로 함.';
    const result = analyzeVoiceDebrief(transcript, mockPeople);

    expect(result.matchedPerson.name).toBe('이수진');
    expect(result.sentiment).toBe('신중 검토');
    expect(result.summary).toContain('추가적인 세부 조율이 요구됨');
  });
});
