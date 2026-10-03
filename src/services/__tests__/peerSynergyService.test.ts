import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  TECH_SKILL_NODES,
  getExpertsForTechSkill,
  generateTechAdviceLetter,
  MOCK_WARM_REFERRAL_JOBS,
  generateWarmReferralLetter,
  loadStudyGuilds,
  toggleJoinGuild,
  generateGuildShareProposal,
  loadCoffeeChatNotes,
  addCoffeeChatNote,
  markGratitudeSent,
  generateGratitudeFeedbackCard
} from '../peerSynergyService';
import { Person } from '../../types/network';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = value.toString(); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

describe('peerSynergyService - 실무 인재 시너지 & 성장 스튜디오 검증', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MockStorage());
  });

  const mockPerson: Person = {
    id: 'p_tech_test',
    name: '김개발',
    currentCompany: '토스',
    currentDepartment: '코어플랫폼',
    currentTitle: 'Frontend Engineer',
    mobile: '010-1234-5678',
    email: 'kim@toss.im',
    primaryDomain: 'IT/소프트웨어',
    estimatedAgeGroup: '30s',
    isAgeEstimated: false,
    connectionChannel: 'business_card',
    sourceType: 'SOURCE_DATA',
    closeness: 1,
    isStale: false,
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    careers: [],
    academics: []
  };

  it('1. 테크 스택 노드 및 특정 기술에 매핑된 실무 전문가를 정상 매칭해야 한다', () => {
    expect(TECH_SKILL_NODES.length).toBeGreaterThanOrEqual(5);

    const matches = getExpertsForTechSkill('tech-react-next', [mockPerson]);
    expect(matches.length).toBeGreaterThanOrEqual(1);

    const target = matches.find(m => m.name === '김개발');
    expect(target).toBeDefined();
    expect(target?.currentCompany).toBe('토스');
    expect(target?.sampleDiscussionTopics.length).toBeGreaterThanOrEqual(2);
  });

  it('2. 기술 자문 요청 커피챗 서신에 3대 의제 및 감사 커피 기프티콘이 품격 있게 합성되어야 한다', () => {
    const node = TECH_SKILL_NODES[0];
    const expert = getExpertsForTechSkill(node.id, [mockPerson])[0];
    const letter = generateTechAdviceLetter(node, expert);

    expect(letter).toContain(expert.name);
    expect(letter).toContain(node.name);
    expect(letter).toContain('따뜻한 커피 한 잔');
    expect(letter).toContain('[자문 희망 핵심 질문 3선]');
  });

  it('3. 사내 추천(Warm Referral) 3대 서신(문화 커피챗, 추천 부탁, 피어 추천서)이 완벽히 생성되어야 한다', () => {
    const job = MOCK_WARM_REFERRAL_JOBS[0];

    const teaLetter = generateWarmReferralLetter(job, 'TEA_CHAT_CULTURE');
    expect(teaLetter.content).toContain(job.internalReferrer.name);
    expect(teaLetter.content).toContain(job.title);
    expect(teaLetter.content).toContain('실무 분위기');

    const referralAsk = generateWarmReferralLetter(job, 'INTERNAL_REFERRAL_ASK');
    expect(referralAsk.content).toContain('사내 추천(Employee Referral)');

    const peerRec = generateWarmReferralLetter(job, 'PEER_RECOMMENDATION', '김철수');
    expect(peerRec.content).toContain('[사내 인재 추천서 - 김철수 님]');
    expect(peerRec.content).toContain('조직 적합도 (Culture Fit)');
  });

  it('4. 스터디 & 사이드 프로젝트 길드 참가 토글 및 공유 제안서가 정상 작동해야 한다', () => {
    const guilds = loadStudyGuilds();
    expect(guilds.length).toBeGreaterThanOrEqual(3);

    const targetGuild = guilds[0];
    const initialCount = targetGuild.currentMembers.length;

    // 참가 신청
    const updated = toggleJoinGuild(targetGuild.id, {
      name: '나 (본인)',
      role: 'Frontend Engineer',
      company: 'ConnectWe'
    });

    const found = updated.find(g => g.id === targetGuild.id);
    expect(found?.currentMembers.length).toBe(initialCount + 1);

    // 제안서 생성
    const proposal = generateGuildShareProposal(targetGuild);
    expect(proposal.shareTitle).toContain(targetGuild.title);
    expect(proposal.shareBody).toContain('스터디 목표:');
  });

  it('5. 커피챗 인사이트 노트 추가 및 감사 피드백 카드가 정상 생성되어야 한다', () => {
    const initialNotes = loadCoffeeChatNotes();
    expect(initialNotes.length).toBeGreaterThanOrEqual(1);

    const newNote = {
      personId: 'p_1',
      personName: '이수진',
      company: '토스',
      title: 'Platform Lead',
      metAt: '2026-10-04',
      discussionTheme: '대규모 Kafka 이벤트 파이프라인 무중단 마이그레이션',
      keyTakeaways: [
        '스키마 레지스트리를 통한 하위 호환성 강제',
        'Dead Letter Queue(DLQ) 모니터링 자동화',
        '파티션 리밸런싱 시간 최소화 전략'
      ],
      recommendedTools: ['Kafka UI', 'Confluent Cloud', 'Datadog'],
      nextAction: '팀 내 파티셔닝 전략 가이드라인 문서화',
      gratitudeSent: false
    };

    const notes = addCoffeeChatNote(newNote);
    expect(notes[0].personName).toBe('이수진');
    expect(notes[0].keyTakeaways.length).toBe(3);

    // 감사 상태 전이
    const updatedNotes = markGratitudeSent(notes[0].id);
    expect(updatedNotes[0].gratitudeSent).toBe(true);

    // 감사 피드백 카드 생성
    const card = generateGratitudeFeedbackCard(notes[0]);
    expect(card.title).toContain('이수진 님께 보내는');
    expect(card.content).toContain('스키마 레지스트리를 통한 하위 호환성 강제');
  });
});
