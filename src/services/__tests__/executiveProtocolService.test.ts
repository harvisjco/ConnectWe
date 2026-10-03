import { describe, it, expect } from 'vitest';
import { 
  checkAntiGraftCompliance, 
  detectProtocolEvents, 
  generateProtocolMessage, 
  resolveProtocolAction 
} from '../executiveProtocolService';
import { Person } from '../../types/network';

describe('executiveProtocolService - C-Suite 경조사 의전 & 청탁금지법 컴플라이언스 엔진', () => {
  const samplePublicOfficial: Person = {
    id: 'p-gov-1',
    name: '정경식',
    currentCompany: '중소벤처기업부',
    currentDepartment: '창업벤처혁신실',
    currentTitle: '국장',
    mobile: '010-1234-5678',
    email: 'ks.jung@mss.go.kr',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: '정책/공공펀드',
    skills: ['벤처정책', '모태펀드'],
    careers: [],
    academics: [],
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    connectionChannel: 'business_card',
    isStale: false
  };

  const sampleStateOwned: Person = {
    id: 'p-state-1',
    name: '이강원',
    currentCompany: '한국토지주택공사 (LH)',
    currentDepartment: '스마트도시기획처',
    currentTitle: '상임이사 / 본부장',
    mobile: '010-9876-5432',
    email: 'gw.lee@lh.or.kr',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: '스마트시티/인프라',
    skills: ['도시개발', '공공기획'],
    careers: [],
    academics: [],
    sourceType: 'SOURCE_DATA',
    closeness: 3,
    connectionChannel: 'business_card',
    isStale: false
  };

  const samplePrivateCEO: Person = {
    id: 'p-corp-1',
    name: '김서연',
    currentCompany: '넥스트비전 테크놀로지',
    currentDepartment: '경영총괄',
    currentTitle: '대표이사 (CEO)',
    mobile: '010-3333-7777',
    email: 'sy.kim@nextvision.ai',
    birthday: '10-05',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: 'AI/컴퓨터비전',
    skills: ['Edge AI', '투자유치'],
    careers: [],
    academics: [],
    sourceType: 'DART_FACT',
    dartInfo: {
      corpCode: '00123456',
      stockName: '넥스트비전',
      isPublicDirector: true,
      registeredRole: '대표이사',
      verifiedAt: '2026-03-01'
    },
    closeness: 1,
    connectionChannel: 'dart',
    isStale: false
  };

  it('1. 청탁금지법(김영란법) 적용 대상을 정확하게 분류하고 법정 가액 한도를 도출해야 한다', () => {
    // 1) 공직자 판정
    const govCheck = checkAntiGraftCompliance(samplePublicOfficial);
    expect(govCheck.category).toBe('PUBLIC_OFFICIAL');
    expect(govCheck.isSubjectToLaw).toBe(true);
    expect(govCheck.cashLimit).toContain('50,000원');
    expect(govCheck.wreathLimit).toContain('100,000원');

    // 2) 공기업/공공기관 판정
    const stateCheck = checkAntiGraftCompliance(sampleStateOwned);
    expect(stateCheck.category).toBe('STATE_OWNED');
    expect(stateCheck.isSubjectToLaw).toBe(true);

    // 3) 일반 민간기업 자율 판정
    const privateCheck = checkAntiGraftCompliance(samplePrivateCEO);
    expect(privateCheck.category).toBe('PRIVATE_ENTERPRISE');
    expect(privateCheck.isSubjectToLaw).toBe(false);
  });

  it('2. 생일 및 승진/영전, 긴급 부고 등 의전 대상자를 스마트하게 감지해야 한다', () => {
    const events = detectProtocolEvents([samplePublicOfficial, samplePrivateCEO]);
    expect(events.length).toBeGreaterThan(0);

    // 부고 또는 생신 이벤트 감지 확인
    const hasCondolence = events.some(e => e.type === 'CONDOLENCE');
    const hasPromotion = events.some(e => e.type === 'CONGRATULATION_PROMOTION');
    expect(hasCondolence || hasPromotion).toBe(true);
  });

  it('3. 부고 조의, 혼사 축의, 영전 축하, 명절 안부 등 상황별 격조 높은 3대 서신(단문, 장문, 리본)을 합성해야 한다', () => {
    // 1) 부고 조의문 생성
    const condolenceRes = generateProtocolMessage(samplePublicOfficial, 'CONDOLENCE');
    expect(condolenceRes.shortMessage).toContain('삼가 조의를 표합니다');
    expect(condolenceRes.formalLetter).toContain('삼가 고인의 명복을 빕니다');
    expect(condolenceRes.ribbonCardText).toContain('삼가 故人의 冥福을 빕니다');
    expect(condolenceRes.compliance.isSubjectToLaw).toBe(true);

    // 2) 결혼 축전문 생성
    const weddingRes = generateProtocolMessage(samplePrivateCEO, 'CONGRATULATION_WEDDING');
    expect(weddingRes.shortMessage).toContain('결혼을 진심으로 축하드립니다');
    expect(weddingRes.ribbonCardText).toContain('祝 華燭의 典');

    // 3) 영전 축전문 생성
    const promoRes = generateProtocolMessage(samplePrivateCEO, 'CONGRATULATION_PROMOTION');
    expect(promoRes.shortMessage).toContain('영전을 축하드립니다');
    expect(promoRes.ribbonCardText).toContain('祝 榮轉');
  });

  it('4. 의전 서신 발송 완료 시 lastContactDate 갱신 및 활동 로그가 무결하게 보존되어야 한다', () => {
    const updated = resolveProtocolAction(
      samplePrivateCEO, 
      'CONGRATULATION_PROMOTION', 
      '대표이사 취임을 진심으로 축하드립니다.'
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    expect(updated.lastContactDate).toBe(todayStr);
    expect(updated.isStale).toBe(false);
    expect(updated.activityLogs).toBeDefined();
    expect(updated.activityLogs?.length).toBeGreaterThan(0);
    expect(updated.activityLogs?.[0].title).toContain('C-Suite 의전 완료');
  });
});
