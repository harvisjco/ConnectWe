import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Person } from '../../types/network';
import { buildNetworkGraph } from '../../services/networkGraph';
import { ZoomIn, ZoomOut, RotateCcw, Info, Zap } from 'lucide-react';

interface NetworkCanvasViewProps {
  people: Person[];
  highlightNodeIds: string[];
  onSelectPerson: (person: Person) => void;
}

interface PhysicsNode {
  id: string;
  label: string;
  subLabel?: string;
  type: 'me' | 'person' | 'company' | 'school' | 'domain';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  rawPerson?: Person;
  closeness?: number;
}

interface PhysicsEdge {
  source: string;
  target: string;
  dashed?: boolean;
  color?: string;
}

const REPULSION = 4800;    // 쿨롱 반발 상수
const SPRING_LENGTH = 140; // 스프링 자연 길이
const SPRING_K = 0.04;     // 스프링 상수 (훅의 법칙)
const DAMPING = 0.82;      // 속도 감쇠 계수
const ALPHA_MIN = 0.003;   // 시뮬레이션 수렴 임계값
const CENTER_GRAVITY = 0.012; // 중심 인력 상수

export const NetworkCanvasView: React.FC<NetworkCanvasViewProps> = ({
  people,
  highlightNodeIds,
  onSelectPerson
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<PhysicsNode[]>([]);
  const edgesRef = useRef<PhysicsEdge[]>([]);
  const alphaRef = useRef<number>(1.0);
  const isSimulatingRef = useRef<boolean>(true);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [simRunning, setSimRunning] = useState(true);

  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  const hoveredNodeIdRef = useRef(hoveredNodeId);
  scaleRef.current = scale;
  offsetRef.current = offset;
  hoveredNodeIdRef.current = hoveredNodeId;

  // 그래프 빌드 → 물리 노드 초기화
  useEffect(() => {
    const graph = buildNetworkGraph(people);
    const canvas = canvasRef.current;
    const W = canvas ? canvas.clientWidth : 900;
    const H = canvas ? canvas.clientHeight : 650;
    const cx = W / 2;
    const cy = H / 2;

    nodesRef.current = graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      subLabel: n.subLabel,
      type: n.type,
      x: cx + (Math.random() - 0.5) * 400,
      y: cy + (Math.random() - 0.5) * 400,
      vx: 0,
      vy: 0,
      radius: n.radius,
      color: n.color,
      rawPerson: n.rawPerson,
      closeness: n.closeness,
    }));

    edgesRef.current = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      dashed: e.dashed,
      color: e.color,
    }));

    // 'me' 노드를 중앙에 고정 초기화
    const meNode = nodesRef.current.find((n) => n.type === 'me');
    if (meNode) {
      meNode.x = cx;
      meNode.y = cy;
    }

    alphaRef.current = 1.0;
    isSimulatingRef.current = true;
    setSimRunning(true);
  }, [people]);

  // 물리 시뮬레이션 틱
  const tick = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    }

    const cx = W / 2;
    const cy = H / 2;
    const currentScale = scaleRef.current;
    const currentOffset = offsetRef.current;
    const currentHoveredId = hoveredNodeIdRef.current;
    const alpha = alphaRef.current;

    // --- 물리 연산 ---
    if (isSimulatingRef.current && alpha > ALPHA_MIN) {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // 쿨롱 반발력
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          if (a.type === 'me') continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist2 = dx * dx + dy * dy + 0.01;
          const dist = Math.sqrt(dist2);
          const force = (REPULSION * alpha) / dist2;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // 훅 스프링력 (엣지)
      for (const edge of edges) {
        const a = nodeMap.get(edge.source);
        const b = nodeMap.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - SPRING_LENGTH;
        const force = SPRING_K * displacement * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (a.type !== 'me') { a.vx += fx; a.vy += fy; }
        if (b.type !== 'me') { b.vx -= fx; b.vy -= fy; }
      }

      // 중심 인력 (중심에서 너무 멀어지면 당김)
      for (const n of nodes) {
        if (n.type === 'me') continue;
        n.vx += (cx - n.x) * CENTER_GRAVITY * alpha;
        n.vy += (cy - n.y) * CENTER_GRAVITY * alpha;
      }

      // 속도 감쇠 + 위치 업데이트
      for (const n of nodes) {
        if (n.type === 'me' || n.id === draggedNodeId) continue;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;
      }

      alphaRef.current = alpha * 0.97;
      if (alphaRef.current <= ALPHA_MIN) {
        isSimulatingRef.current = false;
        setSimRunning(false);
      }
    }

    // --- 렌더링 ---
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    // 우주 그리드 점
    ctx.fillStyle = '#1e293b';
    const gridSize = 40 * currentScale;
    const startX = currentOffset.x % gridSize;
    const startY = currentOffset.y % gridSize;
    for (let x = startX; x < W; x += gridSize) {
      for (let y = startY; y < H; y += gridSize) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    ctx.save();
    ctx.translate(currentOffset.x, currentOffset.y);
    ctx.scale(currentScale, currentScale);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // 호버된 노드의 1촌 이웃 ID 집합
    const hoveredNeighborIds = new Set<string>();
    if (currentHoveredId) {
      for (const e of edges) {
        if (e.source === currentHoveredId) hoveredNeighborIds.add(e.target);
        if (e.target === currentHoveredId) hoveredNeighborIds.add(e.source);
      }
    }

    // 엣지 그리기
    for (const edge of edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;

      const isSearchHighlight = highlightNodeIds.includes(edge.source) || highlightNodeIds.includes(edge.target);
      const isHoverHighlight =
        currentHoveredId &&
        (edge.source === currentHoveredId || edge.target === currentHoveredId);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.setLineDash(edge.dashed ? [4, 4] : []);

      if (isHoverHighlight) {
        ctx.strokeStyle = 'rgba(99,102,241,0.85)';
        ctx.lineWidth = 2.5;
      } else if (isSearchHighlight) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = edge.color || 'rgba(100,116,139,0.18)';
        ctx.lineWidth = 0.8;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 노드 그리기
    for (const node of nodes) {
      const isSearchHit = highlightNodeIds.includes(node.id);
      const isHovered = node.id === currentHoveredId;
      const isNeighbor = hoveredNeighborIds.has(node.id);
      const isDimmed = currentHoveredId && !isHovered && !isNeighbor && node.type !== 'me';

      // 글로우 링
      if (isSearchHit || isHovered) {
        const glowR = node.radius + (isHovered ? 10 : 6);
        const grad = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, glowR);
        grad.addColorStop(0, isHovered ? 'rgba(99,102,241,0.4)' : 'rgba(168,85,247,0.35)');
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 본체
      ctx.globalAlpha = isDimmed ? 0.22 : 1.0;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

      if (node.type === 'me') {
        // 'me' 노드: 방사형 그라디언트
        const g = ctx.createRadialGradient(node.x - 4, node.y - 4, 2, node.x, node.y, node.radius);
        g.addColorStop(0, '#a5b4fc');
        g.addColorStop(1, '#4f46e5');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = node.color;
      }
      ctx.fill();
      ctx.lineWidth = isHovered ? 2.5 : 1.2;
      ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255,255,255,0.3)';
      ctx.stroke();

      // 라벨
      ctx.globalAlpha = isDimmed ? 0.25 : 1.0;
      ctx.font = node.type === 'me' ? 'bold 12px sans-serif' : '10px sans-serif';
      ctx.fillStyle = '#f1f5f9';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.radius + 14);

      if (node.subLabel && currentScale >= 0.85) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(node.subLabel.slice(0, 16), node.x, node.y + node.radius + 25);
      }

      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
    animFrameRef.current = requestAnimationFrame(tick);
  }, [highlightNodeIds, draggedNodeId]);

  // 애니메이션 루프 시작/정리
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [tick]);

  // 마우스 → 캔버스 좌표 변환
  const canvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current,
      y: (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current,
    };
  };

  const findNodeAt = (x: number, y: number) =>
    nodesRef.current.find((n) => Math.hypot(n.x - x, n.y - y) <= n.radius + 6);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = canvasCoords(e);
    const hit = findNodeAt(x, y);
    if (hit) {
      setDraggedNodeId(hit.id);
      // 드래그 중엔 시뮬레이션 일시 해제
      alphaRef.current = 0.001;
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = canvasCoords(e);

    if (draggedNodeId) {
      const node = nodesRef.current.find((n) => n.id === draggedNodeId);
      if (node) { node.x = x; node.y = y; node.vx = 0; node.vy = 0; }
      return;
    }

    if (isPanning) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const hit = findNodeAt(x, y);
    setHoveredNodeId(hit?.id ?? null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeId) {
      // 드래그 종료 시 약한 알파로 재가열
      alphaRef.current = 0.15;
      isSimulatingRef.current = true;
      setSimRunning(true);
    }
    setDraggedNodeId(null);
    setIsPanning(false);

    // 클릭 (mousedown + mouseup at same node)
    const { x, y } = canvasCoords(e);
    const hit = findNodeAt(x, y);
    if (hit?.rawPerson) onSelectPerson(hit.rawPerson);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(Math.max(s * factor, 0.3), 3.0));
  };

  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleReheat = () => {
    // 시뮬레이션 재가열 (레이아웃 재계산)
    for (const n of nodesRef.current) {
      if (n.type !== 'me') {
        n.vx = (Math.random() - 0.5) * 3;
        n.vy = (Math.random() - 0.5) * 3;
      }
    }
    alphaRef.current = 0.8;
    isSimulatingRef.current = true;
    setSimRunning(true);
  };

  const hoveredNode = nodesRef.current.find((n) => n.id === hoveredNodeId);

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: draggedNodeId ? 'grabbing' : hoveredNodeId ? 'pointer' : isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsPanning(false); setDraggedNodeId(null); setHoveredNodeId(null); }}
        onWheel={handleWheel}
      />

      {/* 캔버스 컨트롤 */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur shadow-lg">
        <button onClick={() => setScale((s) => Math.min(s * 1.2, 3.0))} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="줌 인">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setScale((s) => Math.max(s * 0.8, 0.3))} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="줌 아웃">
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-0.5" />
        <button onClick={handleResetView} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" title="뷰 리셋">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleReheat}
          className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
          title="레이아웃 재계산"
        >
          <Zap className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-2">{Math.round(scale * 100)}%</span>
        {simRunning && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            시뮬레이션 중
          </span>
        )}
      </div>

      {/* 범례 */}
      <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur shadow-lg text-[11px] space-y-1.5">
        <div className="font-semibold text-slate-300 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" /> 노드 &amp; 엣지 범례
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>🏛️ DART FACT 검증</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span>📇 주소록/명함</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500" /><span>🏢 기업 노드</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 border-t border-dashed border-amber-400" /><span>⚡ 알럼나이 엣지</span></div>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">⚡ 버튼: 레이아웃 재계산 · 드래그: 노드 이동</div>
      </div>

      {/* 호버 카드 */}
      {hoveredNode?.rawPerson && (
        <div className="absolute top-4 right-4 p-4 rounded-xl bg-slate-900/95 border border-indigo-500/50 backdrop-blur shadow-2xl max-w-xs space-y-1 animate-in fade-in duration-150 pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-white">{hoveredNode.rawPerson.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">클릭하여 상세 정보</span>
          </div>
          <p className="text-xs text-indigo-400 font-medium">{hoveredNode.rawPerson.currentCompany} · {hoveredNode.rawPerson.currentTitle}</p>
          <p className="text-[11px] text-slate-400">{hoveredNode.rawPerson.primaryDomain} ({hoveredNode.rawPerson.estimatedAgeGroup})</p>
          {hoveredNode.rawPerson.dartInfo && (
            <p className="text-[10px] text-emerald-400">🏛️ DART 공시 검증 완료</p>
          )}
        </div>
      )}
    </div>
  );
};
