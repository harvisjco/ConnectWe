import React, { useRef, useEffect, useState } from 'react';
import { Person, GraphNode } from '../../types/network';
import { buildNetworkGraph } from '../../services/networkGraph';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

interface NetworkCanvasViewProps {
  people: Person[];
  highlightNodeIds: string[];
  onSelectPerson: (person: Person) => void;
}

export const NetworkCanvasView: React.FC<NetworkCanvasViewProps> = ({
  people,
  highlightNodeIds,
  onSelectPerson
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 줌 & 팬 상태
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // 그래프 모델 생성
  const graph = buildNetworkGraph(people);

  // 캔버스 그리기 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 디스플레이 배율 대응 (HiDPI)
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. 배경 클리어
    ctx.fillStyle = '#090d16'; // Deep space dark
    ctx.fillRect(0, 0, width, height);

    // 배경 우주 그리드 점 패턴
    ctx.fillStyle = '#1e293b';
    const gridSize = 40 * scale;
    const startX = (offset.x % gridSize);
    const startY = (offset.y % gridSize);
    for (let x = startX; x < width; x += gridSize) {
      for (let y = startY; y < height; y += gridSize) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 2. 엣지 그리기
    graph.edges.forEach(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const isHighlighted = highlightNodeIds.includes(edge.source) || highlightNodeIds.includes(edge.target);

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);

      if (edge.dashed) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = isHighlighted ? '#a855f7' : (edge.color || 'rgba(100, 116, 139, 0.3)');
      ctx.lineWidth = isHighlighted ? 2.5 : 1;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3. 노드 그리기
    graph.nodes.forEach(node => {
      const isHighlighted = highlightNodeIds.includes(node.id);
      const isHovered = hoveredNode?.id === node.id;

      // 하이라이트 또는 호버 시 외곽 펄스 글로우
      if (isHighlighted || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = isHighlighted ? 'rgba(168, 85, 247, 0.25)' : 'rgba(99, 102, 241, 0.25)';
        ctx.fill();
      }

      // 본체 노드 원
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.lineWidth = isHovered ? 3 : 1.5;
      ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // 노드 텍스트 라벨
      ctx.font = node.type === 'me' ? 'bold 12px Pretendard' : '10px Pretendard';
      ctx.fillStyle = '#f1f5f9';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.radius + 14);

      // 서브라벨
      if (node.subLabel && scale >= 0.9) {
        ctx.font = '9px Pretendard';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(node.subLabel.slice(0, 16), node.x, node.y + node.radius + 25);
      }
    });

    ctx.restore();
  }, [graph, scale, offset, hoveredNode, highlightNodeIds]);

  // 마우스 인터랙션 (팬 / 줌 / 노드 선택)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // 마우스 호버 노드 탐색
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - offset.x) / scale;
    const mouseY = (e.clientY - rect.top - offset.y) / scale;

    const hit = graph.nodes.find(n => {
      const dist = Math.hypot(n.x - mouseX, n.y - mouseY);
      return dist <= n.radius + 5;
    });

    setHoveredNode(hit || null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredNode && hoveredNode.rawPerson) {
      onSelectPerson(hoveredNode.rawPerson);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale(prev => Math.min(Math.max(prev * zoomFactor, 0.4), 2.5));
  };

  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur shadow-lg">
        <button
          onClick={() => setScale(s => Math.min(s * 1.2, 2.5))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="줌 인"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale(s => Math.max(s * 0.8, 0.4))}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="줌 아웃"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-0.5" />
        <button
          onClick={handleResetView}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="화면 리셋"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-2">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Floating Canvas Legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur shadow-lg text-[11px] space-y-1.5">
        <div className="font-semibold text-slate-300 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" /> 노드 & 엣지 범례
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>🏛️ DART FACT 검증</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>📇 SOURCE (주소록/명함)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>🏢 기업(법인) 노드</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 border-t border-dashed border-amber-400" />
            <span>⚡ 알럼나이(전직) 엣지</span>
          </div>
        </div>
      </div>

      {/* Floating Hover Card */}
      {hoveredNode && hoveredNode.rawPerson && (
        <div className="absolute top-4 right-4 p-4 rounded-xl bg-slate-900/95 border border-indigo-500/50 backdrop-blur shadow-2xl max-w-xs space-y-1 animate-in fade-in duration-200 pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-white">{hoveredNode.rawPerson.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              클릭하여 상세 정보
            </span>
          </div>
          <p className="text-xs text-indigo-400 font-medium">
            {hoveredNode.rawPerson.currentCompany} · {hoveredNode.rawPerson.currentTitle}
          </p>
          <p className="text-[11px] text-slate-400">
            {hoveredNode.rawPerson.primaryDomain} ({hoveredNode.rawPerson.estimatedAgeGroup})
          </p>
        </div>
      )}
    </div>
  );
};
