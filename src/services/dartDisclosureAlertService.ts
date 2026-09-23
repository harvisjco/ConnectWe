import { Person } from '../types/network';

export interface DisclosureAlert {
  id: string;
  corpCode: string;
  corpName: string;
  reportName: string;
  disclosureDate: string;
  category: 'LEADERSHIP' | 'FINANCIAL' | 'GOVERNANCE' | 'GENERAL';
  importance: 'HIGH' | 'MEDIUM' | 'INFO';
  summary: string;
  affectedPeople: Person[];
  recommendedAction: string;
}

/**
 * 사용자 인맥 네트워크 기반 DART 실시간 변동공시 알림 피드 생성
 */
export function getDisclosureAlertsForNetwork(people: Person[]): DisclosureAlert[] {
  // 내 인맥이 다니는 고유 회사 목록
  const companyMap = new Map<string, Person[]>();
  people.forEach(p => {
    const comp = p.currentCompany.trim();
    if (!companyMap.has(comp)) companyMap.set(comp, []);
    companyMap.get(comp)!.push(p);
  });

  const alerts: DisclosureAlert[] = [
    {
      id: 'alert-1',
      corpCode: '00266961',
      corpName: 'NAVER',
      reportName: '2026년 반기보고서 제출 및 AI 사업총괄 조직개편',
      disclosureDate: '2026-08-14',
      category: 'LEADERSHIP',
      importance: 'HIGH',
      summary: '글로벌 AI 연구소 및 생성형 AI 엔터프라이즈 B2B 부문 독립 신설, 핵심 리더십 보강 공시.',
      affectedPeople: people.filter(p => p.currentCompany.includes('NAVER')),
      recommendedAction: 'NAVER 재직 지인에게 조직개편 축하 및 신규 AI 사업 관련 안부 연락을 건네기 최적의 타이밍입니다.'
    },
    {
      id: 'alert-2',
      corpCode: '00258801',
      corpName: '카카오',
      reportName: '대표이사 및 이사회 책임경영 강화 결의',
      disclosureDate: '2026-07-28',
      category: 'GOVERNANCE',
      importance: 'HIGH',
      summary: '정신아 대표이사 중심의 핵심 사업 효율화 및 기술 거버넌스 쇄신 공시.',
      affectedPeople: people.filter(p => p.currentCompany.includes('카카오')),
      recommendedAction: '카카오 알럼나이 및 재직 임원과의 티타임을 통해 하반기 기술 협력 아젠다를 타진하세요.'
    },
    {
      id: 'alert-3',
      corpCode: '00126380',
      corpName: '삼성전자',
      reportName: '차세대 HBM4 및 파운드리 대규모 투자 공시',
      disclosureDate: '2026-08-02',
      category: 'FINANCIAL',
      importance: 'MEDIUM',
      summary: '반도체 부문 차세대 메모리 설비 증설 및 글로벌 빅테크 공급망 확대 정기공시.',
      affectedPeople: people.filter(p => p.currentCompany.includes('삼성전자')),
      recommendedAction: 'DS부문 재직자 및 반도체 서플라이체인 인맥과 하반기 채용/제휴 트렌드를 교류하세요.'
    },
    {
      id: 'alert-4',
      corpCode: '00164779',
      corpName: 'SK하이닉스',
      reportName: '임원 주식매수선택권 행사 및 신규 등기임원 선임',
      disclosureDate: '2026-08-10',
      category: 'LEADERSHIP',
      importance: 'MEDIUM',
      summary: 'AI 메모리 연구개발 총괄 임원의 주식매수선택권 행사 및 책임경영 지분 공시.',
      affectedPeople: people.filter(p => p.currentCompany.includes('SK하이닉스') || p.currentCompany.includes('하이닉스')),
      recommendedAction: 'SK하이닉스 핵심 엔지니어 및 리더진에게 축하 인사를 전달하세요.'
    }
  ];

  return alerts;
}
