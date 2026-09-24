import { Search, Sparkles, X, ShieldCheck, Tag } from 'lucide-react';
import { GraphQueryResult } from '../../types/network';

interface GraphSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onExecuteSearch: (q: string) => void;
  onResetSearch: () => void;
  searchResult: GraphQueryResult | null;
}

const PRESET_QUERIES = [
  '과거 네이버 거쳐간 40대 임원이나 기술 리드',
  'KAIST 출신 생성형 AI 창업자 또는 연구원',
  '금융감독원 DART 실공시된 상장사 사내이사',
  '6개월 이상 소통 단절된 핵심 1촌 리마인더',
  'VC/PE 글로벌 투자 파트너 및 심사역'
];

export const GraphSearchBar: React.FC<GraphSearchBarProps> = ({
  query,
  onQueryChange,
  onExecuteSearch,
  onResetSearch,
  searchResult
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
      {/* Search Input Box - Neo-Tactile Debossed Field */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 via-sky-500/15 to-purple-500/15 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-70 pointer-events-none"></div>
        <div className="relative flex items-center bg-slate-950/80 border border-slate-800/80 focus-within:border-indigo-500/60 rounded-2xl shadow-[inset_0_2px_6px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.06)] focus-within:shadow-[inset_0_2px_6px_rgba(0,0,0,0.7),0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-white/5 px-4 py-3 transition-all duration-200">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 mr-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder='자연어로 질의하세요: "과거 네이버 거쳐간 40대 임원", "카이스트 AI 연구원", "소통 단절된 1촌"...'
            className="w-full bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-normal"
          />

          {query && (
            <button
              type="button"
              onClick={onResetSearch}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors mr-1 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.98] transition-all text-xs md:text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border-t border-white/20 ring-1 ring-white/10 flex-shrink-0"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">GraphRAG 탐색</span>
          </button>
        </div>
      </form>

      {/* Recommended Prompt Chips - Tactile Floating Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400 scrollbar-none">
        <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap flex items-center gap-1">
          <Tag className="w-3 h-3" /> 추천 질문:
        </span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(preset)}
            className="px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all whitespace-nowrap text-xs shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/5 active:scale-95"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* AI Synthesis Reasoning Briefing Card - Spatial Glass */}
      {searchResult && query && (
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/85 shadow-[0_12px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-white/10 p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    GraphRAG 경로 분석 & 지능형 브리핑
                  </span>
                  {searchResult.filterTags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-slate-950 text-slate-300 border border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  {searchResult.reasoning}
                </p>
              </div>
            </div>

            <button
              onClick={onResetSearch}
              className="text-xs text-slate-400 hover:text-slate-200 underline whitespace-nowrap mt-1"
            >
              필터 해제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
