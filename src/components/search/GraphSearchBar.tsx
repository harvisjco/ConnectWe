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
    <div className="w-full max-w-5xl mx-auto space-y-3">
      {/* Search Input Box - GoodPartner Pill Style */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 focus-within:border-indigo-500/80 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-4 py-2 transition-all duration-200">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mr-2.5 shrink-0">
            <Search className="w-3.5 h-3.5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder='인맥 성명, 출신 기업, DART 공시 직함, 도메인, 전문 스킬 검색... (예: "네이버 출신 40대 임원", "카이스트 AI")'
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-normal"
          />

          {query && (
            <button
              type="button"
              onClick={onResetSearch}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mr-1 active:scale-95 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 active:scale-[0.98] transition-all text-xs font-bold text-white shadow-2xs cursor-pointer flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span className="hidden sm:inline">지능 검색</span>
          </button>
        </div>
      </form>

      {/* 5대 인재 클러스터 One-Touch Filter Bar */}
      {onSelectCluster && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap mr-1">
            클러스터:
          </span>
          <button
            type="button"
            onClick={() => onSelectCluster(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedClusterId === null
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
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
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-500 dark:text-slate-400 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap flex items-center gap-1">
          <Tag className="w-3 h-3 text-slate-400" /> 추천:
        </span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(preset)}
            className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all whitespace-nowrap text-xs shadow-2xs active:scale-95 cursor-pointer font-medium"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* AI Synthesis Reasoning Briefing Card */}
      {searchResult && query && (
        <div className="rounded-2xl border border-blue-200 dark:border-indigo-500/40 bg-blue-50/80 dark:bg-slate-900 shadow-sm p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-indigo-500/20 text-blue-700 dark:text-indigo-400 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-indigo-300">
                    GraphRAG 경로 분석 & 지능형 브리핑
                  </span>
                  {searchResult.filterTags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-slate-800 text-blue-800 dark:text-slate-200 border border-blue-200 dark:border-slate-700 shadow-2xs">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                  {searchResult.reasoning}
                </p>
              </div>
            </div>

            <button
              onClick={onResetSearch}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline whitespace-nowrap mt-1 cursor-pointer"
            >
              필터 해제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
