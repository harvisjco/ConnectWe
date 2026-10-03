import { describe, it, expect } from 'vitest';
import { 
  SQUAD_ROLES, 
  SQUAD_TEMPLATES, 
  calculateCandidateFit, 
  findBestCandidatesForRole, 
  analyzeSquadGaps, 
  generateSquadInviteBrief 
} from '../projectSquadBuilderService';
import { Person } from '../../types/network';

describe('projectSquadBuilderService - 일반 실무 인력 중심 팀 빌더 및 매칭 검증', () => {
  const samplePeople: Person[] = [
    {
      id: 'p-1',
      name: '이수민',
      currentCompany: '하이퍼AI랩',
      currentDepartment: 'AI플랫폼팀',
      currentTitle: '시니어 AI 연구원 (Tech Lead)',
      mobile: '010-1111-2222',
      email: 'sumin@hyperai.io',
      primaryDomain: 'AI/LLM',
      skills: ['Python', 'PyTorch', 'LLM', 'LangChain', 'FastAPI'],
      estimatedAgeGroup: '30s',
      isAgeEstimated: false,
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'business_card',
      isStale: false,
      careers: [],
      academics: []
    },
    {
      id: 'p-2',
      name: '박진우',
      currentCompany: '웨이브커넥트',
      currentDepartment: '프로덕트실',
      currentTitle: '수석 프로덕트 매니저 (PO)',
      mobile: '010-3333-4444',
      email: 'jinwoo@waveconnect.co.kr',
      primaryDomain: 'SaaS 플랫폼',
      skills: ['PM', 'Agile', 'Product Strategy', 'Roadmapping', 'User Research'],
      estimatedAgeGroup: '30s',
      isAgeEstimated: false,
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'vcard',
      isStale: false,
      careers: [],
      academics: []
    },
    {
      id: 'p-3',
      name: '최예은',
      currentCompany: '스튜디오넥스트',
      currentDepartment: '디자인팀',
      currentTitle: 'UI/UX 리드 디자이너',
      mobile: '010-5555-6666',
      email: 'yeeun@studionext.design',
      primaryDomain: 'UI/UX 디자인',
      skills: ['Figma', 'UI/UX', 'Design System', 'Prototyping'],
      estimatedAgeGroup: '20s',
      isAgeEstimated: false,
      sourceType: 'SOURCE_DATA',
      closeness: 3,
      connectionChannel: 'business_card',
      isStale: false,
      careers: [],
      academics: []
    },
    {
      id: 'p-4',
      name: '정대현',
      currentCompany: '클라우드코어',
      currentDepartment: '인프라팀',
      currentTitle: '클라우드 백엔드 아키텍트',
      mobile: '010-7777-8888',
      email: 'daehyun@cloudcore.dev',
      primaryDomain: '클라우드 인프라',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Go', 'PostgreSQL'],
      estimatedAgeGroup: '30s',
      isAgeEstimated: false,
      sourceType: 'SOURCE_DATA',
      closeness: 3,
      connectionChannel: 'remember',
      isStale: false,
      careers: [],
      academics: []
    },
    {
      id: 'p-5',
      name: '한서린',
      currentCompany: '그로스랩',
      currentDepartment: '그로스본부',
      currentTitle: 'B2B 사업개발 & 그로스 리드',
      mobile: '010-9999-0000',
      email: 'seorin@growthlab.kr',
      primaryDomain: '사업개발',
      skills: ['B2B Sales', 'Partnership', 'Growth Hacking', 'Performance Marketing'],
      estimatedAgeGroup: '30s',
      isAgeEstimated: false,
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'business_card',
      isStale: false,
      careers: [],
      academics: []
    }
  ];

  it('1. 6대 실무 역할 및 4대 스쿼드 템플릿이 완전하게 정의되어 있어야 한다', () => {
    expect(Object.keys(SQUAD_ROLES).length).toBe(6);
    expect(SQUAD_TEMPLATES.length).toBe(4);

    const aiTemplate = SQUAD_TEMPLATES.find(t => t.id === 'ai-product');
    expect(aiTemplate).toBeDefined();
    expect(aiTemplate?.roles).toContain('TECH_LEAD_AI');
    expect(aiTemplate?.roles).toContain('PRODUCT_LEAD');
  });

  it('2. 실무 인재의 직무, 스킬, 도메인에 따른 적합도(Fit Score)가 정확히 산출되어야 한다', () => {
    const aiCandidate = samplePeople[0]; // 이수민
    const aiRole = SQUAD_ROLES.TECH_LEAD_AI;

    const match = calculateCandidateFit(aiCandidate, aiRole);
    expect(match.score).toBeGreaterThanOrEqual(80);
    expect(match.matchLevel).toBe('EXCELLENT');
    expect(match.matchedSkills).toContain('Python');
    expect(match.matchedSkills).toContain('PyTorch');
    expect(match.matchedSkills).toContain('LLM');
  });

  it('3. 특정 역할에 가장 적합한 실무 후보자를 랭킹 순위로 추천해야 한다', () => {
    const pmRole = 'PRODUCT_LEAD';
    const matches = findBestCandidatesForRole(samplePeople, pmRole);

    expect(matches.length).toBeGreaterThan(0);
    // 1위 후보는 박진우(PO)여야 함
    expect(matches[0].person.name).toBe('박진우');
    expect(matches[0].score).toBeGreaterThan(matches[1].score);
  });

  it('4. 스쿼드 갭 분석 시 미충원 슬롯 및 부족한 스킬을 정확히 진단해야 한다', () => {
    const template = SQUAD_TEMPLATES.find(t => t.id === 'ai-product')!;
    
    // 일부만 충원된 상태
    const partialAssignments = {
      PRODUCT_LEAD: samplePeople[1], // 박진우
      TECH_LEAD_AI: samplePeople[0], // 이수민
      FRONTEND_DEV: null,
      BACKEND_INFRA: null
    };

    const gap = analyzeSquadGaps(template, partialAssignments);
    expect(gap.totalSlots).toBe(4);
    expect(gap.filledSlots).toBe(2);
    expect(gap.unfilledRoleIds).toContain('FRONTEND_DEV');
    expect(gap.unfilledRoleIds).toContain('BACKEND_INFRA');
    expect(gap.readinessScore).toBeLessThan(100);
    expect(gap.recommendation).toContain('역할이 공석입니다');
  });

  it('5. 모든 슬롯 충원 시 100% 준비도 및 프로젝트 1-Page 제안서가 정상 합성되어야 한다', () => {
    const template = SQUAD_TEMPLATES.find(t => t.id === 'b2b-tf')!;
    const fullAssignments = {
      BUSINESS_GROWTH: samplePeople[4], // 한서린
      PRODUCT_LEAD: samplePeople[1],   // 박진우
      BACKEND_INFRA: samplePeople[3]   // 정대현
    };

    const gap = analyzeSquadGaps(template, fullAssignments);
    expect(gap.filledSlots).toBe(3);
    expect(gap.unfilledRoleIds.length).toBe(0);
    expect(gap.readinessScore).toBeGreaterThanOrEqual(90);

    const brief = generateSquadInviteBrief(
      '엔터프라이즈 AI 솔루션 수주 TF',
      template,
      fullAssignments,
      samplePeople[4],
      SQUAD_ROLES.BUSINESS_GROWTH
    );

    expect(brief).toContain('엔터프라이즈 AI 솔루션 수주 TF');
    expect(brief).toContain('한서린');
    expect(brief).toContain('박진우');
    expect(brief).toContain('티타임');
  });
});
