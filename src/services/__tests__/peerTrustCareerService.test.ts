import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  peerTrustCareerService,
  ENDORSEMENT_STRENGTH_TAGS,
  DEFAULT_MY_DIGITAL_PROFILE,
  CAREER_GOAL_TRACKS
} from '../peerTrustCareerService';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  key(index: number) { return Object.keys(this.store)[index] || null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

describe('peerTrustCareerService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MockStorage());
  });

  describe('1. 피어 실무 보증 & 신뢰 뱃지', () => {
    it('기본 보증 목록 및 인물별 요약을 정확히 산출해야 한다', () => {
      const summary = peerTrustCareerService.getEndorsementSummary('p-001', '김지원');
      expect(summary.personName).toBe('김지원');
      expect(summary.totalEndorsements).toBeGreaterThanOrEqual(2);
      expect(summary.isPeerVerified).toBe(true);
      expect(summary.topStrengths.length).toBeGreaterThan(0);
    });

    it('새로운 실무 보증을 추가하고 영속화할 수 있어야 한다', () => {
      const newEndorsement = peerTrustCareerService.addEndorsement({
        targetPersonId: 'p-003',
        targetPersonName: '이동훈',
        endorserPersonId: 'my-user',
        endorserName: '김성우',
        endorserTitle: '테크 리드',
        endorserCompany: 'ConnectWe',
        relationship: '스쿼드 공동 협업 파트너',
        selectedStrengths: ['str-traffic-bottleneck', 'str-clean-architecture'],
        memo: '분산 트랜잭션 설계를 완벽하게 리드해주셨습니다.'
      });

      expect(newEndorsement.id).toBeDefined();
      expect(newEndorsement.thankYouNoteSent).toBe(false);

      const list = peerTrustCareerService.getEndorsementsForPerson('p-003');
      expect(list.some(e => e.id === newEndorsement.id)).toBe(true);
    });

    it('동료의 보증에 대한 감사 답례 서신을 생성하고 발송 상태를 갱신해야 한다', () => {
      const list = peerTrustCareerService.getEndorsements();
      const first = list[0];
      const note = peerTrustCareerService.generateThankYouNote(first);

      expect(note).toContain(first.endorserName);
      expect(note).toContain('감사드립니다');

      const updated = peerTrustCareerService.markThankYouNoteSent(first.id);
      expect(updated).toBe(true);
    });
  });

  describe('2. 디지털 실무 명함 & vCard', () => {
    it('기본 디지털 프로필을 조회하고 수정 저장할 수 있어야 한다', () => {
      const profile = peerTrustCareerService.getMyDigitalProfile();
      expect(profile.name).toBe(DEFAULT_MY_DIGITAL_PROFILE.name);

      const modified = { ...profile, title: '수석 엔지니어링 디렉터' };
      peerTrustCareerService.saveMyDigitalProfile(modified);

      const saved = peerTrustCareerService.getMyDigitalProfile();
      expect(saved.title).toBe('수석 엔지니어링 디렉터');
    });

    it('RFC 6350 호환 vCard 문자열 및 마스킹 데이터를 생성해야 한다', () => {
      const profile = peerTrustCareerService.getMyDigitalProfile();
      const exportData = peerTrustCareerService.generateVCard(profile, false);

      expect(exportData.vcfString).toContain('BEGIN:VCARD');
      expect(exportData.vcfString).toContain(`FN:${profile.name}`);
      expect(exportData.vcfString).toContain('END:VCARD');
      expect(exportData.maskedPhone).toContain('****');
      expect(exportData.maskedEmail).toContain('***@');

      const maskedExport = peerTrustCareerService.generateVCard(profile, true);
      expect(maskedExport.vcfString).toContain('****');
    });
  });

  describe('3. 크로스 직무 1:1 커피챗 룰렛', () => {
    it('본인 직무와 다른 크로스 직무 동료를 매칭하고 아이스브레이킹 대화 카드를 생성해야 한다', () => {
      const match = peerTrustCareerService.spinCoffeeRoulette('frontend');
      expect(match.partner.role).not.toBe('frontend');
      expect(match.icebreakerQuestions.length).toBe(3);
      expect(match.invitationMessage).toContain(match.partner.name);
      expect(match.invitationMessage).toContain('캐주얼 티타임');
    });

    it('선호 관심사에 기반하여 최적 파트너를 매칭할 수 있어야 한다', () => {
      const match = peerTrustCareerService.spinCoffeeRoulette('frontend', 'Figma');
      expect(match.partner).toBeDefined();
      expect(match.icebreakerQuestions.length).toBe(3);
    });
  });

  describe('4. 커리어 패스 & 스킬 갭 멘토 매칭', () => {
    it('목표 커리어 트랙 목록을 제공해야 한다', () => {
      const tracks = peerTrustCareerService.getCareerGoalTracks();
      expect(tracks.length).toBe(CAREER_GOAL_TRACKS.length);
      expect(tracks[0].targetRole).toContain('테크 리드');
    });

    it('보유 스킬과 목표 역량을 비교하여 스킬 갭 및 준비도 점수를 산출해야 한다', () => {
      const currentSkills = ['대규모 분산 아키텍처 설계', '장애 대응 포스트모템(Post-mortem) 문화 정착'];
      const analysis = peerTrustCareerService.analyzeCareerPath('track-tech-lead', currentSkills);

      expect(analysis.goal.id).toBe('track-tech-lead');
      expect(analysis.readinessScore).toBeGreaterThan(0);
      expect(analysis.readinessScore).toBeLessThan(100);
      expect(analysis.skillGaps.length).toBe(5);
      expect(analysis.matchedMentors.length).toBeGreaterThan(0);
    });

    it('부족 스킬에 대한 멘토 조언 요청 서신을 정중한 톤으로 생성해야 한다', () => {
      const analysis = peerTrustCareerService.analyzeCareerPath('track-tech-lead', []);
      const mentor = analysis.matchedMentors[0];
      const requestLetter = peerTrustCareerService.generateMentorAdviceRequest(
        mentor,
        analysis.goal.targetRole,
        analysis.skillGaps[0].skill
      );

      expect(requestLetter).toContain(mentor.name);
      expect(requestLetter).toContain('조언');
      expect(requestLetter).toContain(analysis.goal.targetRole);
    });
  });
});
