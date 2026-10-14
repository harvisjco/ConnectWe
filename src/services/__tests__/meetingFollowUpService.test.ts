import { describe, it, expect, vi } from 'vitest';
import {
  generateMeetingFollowUpMessage,
  copyMeetingFollowUpToClipboard
} from '../meetingFollowUpService';
import { Person } from '../../types/network';

const samplePerson: Person = {
  id: 'p-test',
  name: '이재용',
  currentCompany: '삼성전자',
  currentTitle: '회장',
  currentDepartment: '',
  mobile: '010-1111-2222',
  email: 'lee@samsung.com',
  sourceType: 'DART_FACT',
  closeness: 1,
  estimatedAgeGroup: '50s_plus',
  isAgeEstimated: false,
  primaryDomain: '경영',
  skills: [],
  academics: [],
  careers: [],
  connectionChannel: 'manual',
  isStale: false
};

describe('meetingFollowUpService - 미팅 직후 감사 서신 1초 생성 및 클립보드 복사 검증', () => {
  it('FORMAL 격식체 서신에 상대방 성함, 회사명, 직책 존칭 및 발신자 서명이 바르게 포함되어야 한다', () => {
    const msg = generateMeetingFollowUpMessage(samplePerson, {
      tone: 'FORMAL',
      senderName: '홍길동',
      senderTitle: '대표이사'
    });

    expect(msg).toContain('[삼성전자]');
    expect(msg).toContain('이재용 회장님께');
    expect(msg).toContain('금일 바쁘신 일정 중에도');
    expect(msg).toContain('홍길동 대표이사 드림');
  });

  it('WARM_PARTNER 톤에서 특정 미팅 화두(topic)가 정중하게 반영되어야 한다', () => {
    const msg = generateMeetingFollowUpMessage(samplePerson, {
      tone: 'WARM_PARTNER',
      topic: '차세대 HBM 반도체 협력'
    });

    expect(msg).toContain('이재용 회장님');
    expect(msg).toContain('차세대 HBM 반도체 협력');
    expect(msg).toContain('큰 영감을 받았습니다');
  });

  it('CASUAL_COFFEE 톤에서 가벼운 티타임 감사와 친근한 어조가 연출되어야 한다', () => {
    const msg = generateMeetingFollowUpMessage(samplePerson, {
      tone: 'CASUAL_COFFEE'
    });

    expect(msg).toContain('편안한 차 한잔 함께해 주셔서 감사했습니다');
    expect(msg).toContain('맛있는 식사 한번 모시겠습니다');
  });

  it('copyMeetingFollowUpToClipboard 호출 시 navigator.clipboard.writeText가 호출되어야 한다', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock
      }
    });

    const success = await copyMeetingFollowUpToClipboard(samplePerson);
    expect(success).toBe(true);
    expect(writeTextMock).toHaveBeenCalled();
  });
});
