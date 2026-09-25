import { Person } from '../types/network';

export type GeoClusterId = 
  | 'gangnam_teheran' 
  | 'pangyo' 
  | 'yeouido' 
  | 'gwanghwamun_jongno' 
  | 'yangjae_seocho' 
  | 'suwon_giheung';

export interface GeoCluster {
  id: GeoClusterId;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  keyCompanies: string[];
}

export const GEO_CLUSTERS: GeoCluster[] = [
  {
    id: 'gangnam_teheran',
    name: '테헤란로 / 강남 비즈니스 밸리',
    shortName: '강남·테헤란로',
    badge: '스타트업 & VC 허브',
    description: '강남파이낸스센터, 아크플레이스, 테헤란밸리 스타트업, 벤처캐피탈, IT 솔루션 밀집지',
    keyCompanies: ['토스', '야놀자', '하이퍼', '인베스트먼트', '파트너스', 'VC', '라인', '쿠팡']
  },
  {
    id: 'pangyo',
    name: '판교 테크노밸리',
    shortName: '판교 테크노밸리',
    badge: '빅테크 & 게임 메카',
    description: '알파돔시티, 카카오 아지트, 네이버 그린팩토리, 엔씨소프트, 크래프톤 등 국가대표 IT 거점',
    keyCompanies: ['네이버', '카카오', 'NAVER', '엔씨', '넥슨', '크래프톤', '두나무', '안랩', 'SK바이오']
  },
  {
    id: 'yeouido',
    name: '여의도 금융 & 핀테크 타운',
    shortName: '여의도 금융가',
    badge: '투자은행 & 자산운용',
    description: '파크원, IFC서울, 증권사 본사, 자산운용사, 핀테크 유니콘 및 금융감독원 인접지',
    keyCompanies: ['증권', '투자증권', '자산운용', '금융', '신한', 'KB', '하나', '우리', '카카오뱅크', '토스뱅크']
  },
  {
    id: 'gwanghwamun_jongno',
    name: '광화문 / 종로 도심 비즈니스',
    shortName: '광화문·종로',
    badge: '전통 대기업 & 지주사',
    description: 'SK서린빌딩, 그랑서울, 교보빌딩, 주요 4대 그룹 본사, 대형 로펌, 정부 부처 거점',
    keyCompanies: ['SK', '한화', 'LG', 'CJ', '현대건설', '교보', '로펌', 'KT']
  },
  {
    id: 'yangjae_seocho',
    name: '양재 / 서초 모빌리티 & AI R&D',
    shortName: '양재·서초 R&D',
    badge: '모빌리티 & 첨단 R&D',
    description: '현대자동차 양재 본사, 삼성전자 서울R&D캠퍼스, LG전자 양재센터, AI 특구',
    keyCompanies: ['현대자동차', '현대모비스', '기아', '모빌리티', '자율주행', '서초R&D']
  },
  {
    id: 'suwon_giheung',
    name: '수원 / 기흥 / 동탄 반도체 허브',
    shortName: '수원·기흥 반도체',
    badge: '글로벌 반도체 밸류체인',
    description: '삼성전자 디지털시티 본사, 기흥·화성 나노시티, 한미반도체, 글로벌 반도체 팹',
    keyCompanies: ['삼성전자', '한미반도체', 'SK하이닉스', '원익', '반도체', 'ASML', 'TEL']
  }
];

export interface ClusterMatchResult {
  cluster: GeoCluster;
  people: Person[];
  dartExecutiveCount: number;
}

/**
 * 인맥의 회사명 및 메모를 바탕으로 거점 클러스터 매핑
 */
export function matchPersonToCluster(person: Person): GeoClusterId {
  const comp = (person.currentCompany || '').toLowerCase();
  const memo = (person.memo || '').toLowerCase();
  const fullText = `${comp} ${memo}`;

  if (fullText.includes('판교') || fullText.includes('삼평') || ['네이버', '카카오', 'naver', '엔씨', '넥슨', '크래프톤', '두나무', '안랩'].some(k => comp.includes(k.toLowerCase()))) {
    return 'pangyo';
  }

  if (fullText.includes('여의도') || ['증권', '자산운용', '금융', '신한', 'kb', '하나', '우리'].some(k => comp.includes(k.toLowerCase()))) {
    return 'yeouido';
  }

  if (fullText.includes('광화문') || fullText.includes('종로') || ['한화', 'cj'].some(k => comp.includes(k.toLowerCase()))) {
    return 'gwanghwamun_jongno';
  }

  if (fullText.includes('양재') || ['현대자동차', '현대차', '기아', '현대모비스'].some(k => comp.includes(k.toLowerCase()))) {
    return 'yangjae_seocho';
  }

  if (fullText.includes('수원') || fullText.includes('기흥') || fullText.includes('화성') || ['삼성전자', '하이닉스', '반도체'].some(k => comp.includes(k.toLowerCase()))) {
    return 'suwon_giheung';
  }

  // 기본 강남 테헤란로 (스타트업, 일반 IT, 테헤란로 중심)
  return 'gangnam_teheran';
}

/**
 * 전체 인맥을 6대 거점별로 클러스터링 및 통계 산출
 */
export function getGeoClusterBreakdown(people: Person[]): ClusterMatchResult[] {
  const map = new Map<GeoClusterId, Person[]>();

  GEO_CLUSTERS.forEach(c => map.set(c.id, []));

  people.forEach(p => {
    const clusterId = matchPersonToCluster(p);
    map.get(clusterId)?.push(p);
  });

  return GEO_CLUSTERS.map(cluster => {
    const clusterPeople = map.get(cluster.id) || [];
    const dartCount = clusterPeople.filter(p => p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector).length;
    return {
      cluster,
      people: clusterPeople,
      dartExecutiveCount: dartCount
    };
  });
}
