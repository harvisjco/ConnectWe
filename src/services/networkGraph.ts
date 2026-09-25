import { Person, GraphNode, GraphEdge } from '../types/network';
import { identifyTalentCluster } from './talentClusterEngine';

export interface NetworkGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * 인물 목록으로부터 인터랙티브 캔버스용 지식 그래프 데이터(노드 및 엣지) 생성
 */
export function buildNetworkGraph(people: Person[]): NetworkGraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const addedNodeIds = new Set<string>();

  // 1. 중심 노드: 'Me' (나)
  const meNodeId = 'node_me';
  nodes.push({
    id: meNodeId,
    label: '나 (Me)',
    subLabel: '인맥 허브 중심',
    type: 'me',
    x: 450,
    y: 350,
    radius: 32,
    color: '#6366f1' // Indigo-500
  });
  addedNodeIds.add(meNodeId);

  // 회사별 그룹핑을 위한 임시 맵
  const companyMap = new Map<string, { x: number; y: number; count: number }>();

  // 주요 회사 노드 선정 (2인 이상 소속 또는 상장/빅테크)
  const targetCompanies = Array.from(new Set(people.map(p => p.currentCompany)));
  const compAngleStep = (2 * Math.PI) / Math.max(targetCompanies.length, 1);

  targetCompanies.forEach((comp, idx) => {
    const compNodeId = `comp_${comp}`;
    const angle = idx * compAngleStep;
    const distance = 260; // 나로부터의 회사 궤도 거리
    const cx = 450 + Math.cos(angle) * distance;
    const cy = 350 + Math.sin(angle) * distance;

    companyMap.set(comp, { x: cx, y: cy, count: 0 });

    if (!addedNodeIds.has(compNodeId)) {
      nodes.push({
        id: compNodeId,
        label: comp,
        type: 'company',
        x: cx,
        y: cy,
        radius: 24,
        color: '#0ea5e9' // Sky-500
      });
      addedNodeIds.add(compNodeId);
    }
  });

  // 인물 노드 및 엣지 배치
  people.forEach((p, pIdx) => {
    const personNodeId = `p_${p.id}`;
    const compPos = companyMap.get(p.currentCompany) || { x: 450, y: 350, count: 0 };
    compPos.count += 1;

    // 회사 중심 주변으로 위성처럼 분산 배치
    const pAngle = (compPos.count * 0.9) + (pIdx * 0.3);
    const pDist = 65 + (pIdx % 3) * 25;
    const px = compPos.x + Math.cos(pAngle) * pDist;
    const py = compPos.y + Math.sin(pAngle) * pDist;

    // 5대 인재 클러스터 기반 테마 컬러 매핑 (단순 팩트 유무를 넘어 인재의 고유 강점 시각화)
    const cluster = identifyTalentCluster(p);
    let nodeColor = '#3b82f6';
    if (cluster.id === 'VENTURE_LEADER') {
      nodeColor = '#8b5cf6'; // Violet (어자일 벤처 리더)
    } else if (cluster.id === 'TECH_FELLOW') {
      nodeColor = '#06b6d4'; // Cyan (딥테크 펠로우)
    } else if (cluster.id === 'INVESTOR_PARTNER') {
      nodeColor = '#f59e0b'; // Amber (투자 파트너)
    } else if (cluster.id === 'LISTED_EXECUTIVE') {
      nodeColor = '#2563eb'; // Blue (상장사 임원)
    } else if (cluster.id === 'CORE_SPECIALIST') {
      nodeColor = '#10b981'; // Emerald (프로덕트 스페셜리스트)
    }

    if (!addedNodeIds.has(personNodeId)) {
      nodes.push({
        id: personNodeId,
        label: p.name,
        subLabel: `[${cluster.label}] ${p.currentTitle} (${p.currentCompany})`,
        type: 'person',
        closeness: p.closeness,
        x: px,
        y: py,
        radius: p.closeness === 2 ? 18 : 14,
        color: nodeColor,
        rawPerson: p
      });
      addedNodeIds.add(personNodeId);
    }

    // 1. 나 -> 1촌 인맥 관계 엣지
    if (p.closeness <= 3) {
      edges.push({
        id: `edge_me_${p.id}`,
        source: meNodeId,
        target: personNodeId,
        type: 'KNOWS',
        label: p.closeness === 2 ? '핵심 1촌' : '1촌 명함',
        dashed: p.isStale,
        color: p.isStale ? '#64748b' : '#818cf8'
      });
    }

    // 2. 인물 -> 현재 회사 소속 엣지
    const compNodeId = `comp_${p.currentCompany}`;
    if (addedNodeIds.has(compNodeId)) {
      edges.push({
        id: `edge_works_${p.id}_${compNodeId}`,
        source: personNodeId,
        target: compNodeId,
        type: 'WORKS_AT',
        label: '현직',
        color: '#38bdf8'
      });
    }

    // 3. 전직(알럼나이) 엣지
    p.careers.filter(c => !c.isCurrent).forEach(c => {
      const pastCompId = `comp_${c.companyName}`;
      if (addedNodeIds.has(pastCompId)) {
        edges.push({
          id: `edge_worked_${p.id}_${c.id}`,
          source: personNodeId,
          target: pastCompId,
          type: 'WORKED_AT',
          label: `전직 (${c.title})`,
          dashed: true,
          color: '#fbbf24' // Gold dashed line
        });
      }
    });
  });

  return { nodes, edges };
}
