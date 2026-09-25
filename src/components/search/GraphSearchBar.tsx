import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, X, ShieldCheck, Tag, Building2, Rocket, Cpu, Briefcase, Layers } from 'lucide-react';
import { GraphQueryResult } from '../../types/network';
import { TALENT_CLUSTERS } from '../../services/talentClusterEngine';

interface GraphSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onExecuteSearch: (q: string) => void;
  onResetSearch: () => void;
  searchResult: GraphQueryResult | null;
  selectedClusterId?: string | null;
  onSelectCluster?: (clusterId: string | null) => void;
}

const PRESET_QUERIES = [
  '과거 네이버 거쳐간 시니어 테크 리드 및 임원',
  'KAIST 출신 생성형 AI 창업자 및 딥테크 펠로우',
  '금융감독원 DART 실공시된 상장사 사내이사',
  '글로벌 Top-tier VC/PE 투자 파트너 및 심사역',
  '6개월 이상 안부 연락이 뜸했던 핵심 1촌'
];

export const GraphSearchBar: React.FC<GraphSearchBarProps> = ({
  query,
  onQueryChange,
  onExecuteSearch,
  onResetSearch,
  searchResult,
  selectedClusterId = null,
  onSelectCluster
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close accordion on outside click (if not having query or active cluster)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isExpanded = isFocused || !!query.trim() || !!selectedClusterId || !!searchResult;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onExecuteSearch(query.trim());
    }
  };

  const handleChipClick = (preset: string) => {
    onQueryChange(preset);
    onExecuteSearch(preset);
  };

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto space-y-2.5 transition-all duration-200">
      {/* Search Input Box - Clean Apple Pill Style */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center bg-white border border-slate-200 hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3.5 py-1.5 transition-all duration-200">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 mr-2 shrink-0">
            <Search className="w-3.5 h-3.5" />
          </div>

          <input
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder='인맥 성명, 출신 기업, DART 공시 직함, 도메인, 전문 스킬 검색... (예: "네이버 출신 시니어 리드", "카이스트 AI 펠로우")'
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-normal"
          />

          {query && (
            <button
              type="button"
              onClick={onResetSearch}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mr-1 active:scale-95 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-xs font-semibold text-white shadow-2xs cursor-pointer flex-shrink-0"
          >
            <Sparkles className="w-3 h-3 text-indigo-200" />
            <span className="hidden sm:inline">지능 검색</span>
          </button>
        </div>
      </form>

      {/* Smart Accordion: Expand only when focused or active */}
      {isExpanded && (
        <div className="space-y-2 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* 5대 인재 클러스터 One-Touch Filter Bar */}
          {onSelectCluster && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap mr-1">
                클러스터:
              </span>
              <button
                type="button"
                onClick={() => onSelectCluster(null)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedClusterId === null
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>전체 인맥</span>
              </button>

              {TALENT_CLUSTERS.map((c) => {
                const isSelected = selectedClusterId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCluster(isSelected ? null : c.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? `${c.badgeStyle} ring-2 ring-indigo-500/40 shadow-sm font-bold`
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {c.id === 'VENTURE_LEADER' && <Rocket className="w-3 h-3" />}
                    {c.id === 'TECH_FELLOW' && <Cpu className="w-3 h-3" />}
                    {c.id === 'INVESTOR_PARTNER' && <Briefcase className="w-3 h-3" />}
                    {c.id === 'LISTED_EXECUTIVE' && <Building2 className="w-3 h-3" />}
                    {c.id === 'CORE_SPECIALIST' && <Sparkles className="w-3 h-3" />}
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recommended Prompt Chips - Clean Minimal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs text-slate-500 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" /> 추천:
            </span>
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(preset)}
                className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-all whitespace-nowrap text-xs shadow-2xs active:scale-95 cursor-pointer font-medium"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Synthesis Reasoning Briefing Card */}
      {searchResult && query && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 shadow-sm p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 mt-0.5 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    GraphRAG 경로 분석 & 지능형 브리핑
                  </span>
                  {searchResult.filterTags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-indigo-800 border border-indigo-200 shadow-2xs">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-normal">
                  {searchResult.reasoning}
                </p>
              </div>
            </div>

            <button
              onClick={onResetSearch}
              className="text-xs text-slate-500 hover:text-slate-800 underline whitespace-nowrap mt-1 cursor-pointer"
            >
              필터 해제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
