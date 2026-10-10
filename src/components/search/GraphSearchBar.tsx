import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  X,
  ShieldCheck,
  Tag,
  Building2,
  Rocket,
  Cpu,
  Briefcase,
  Layers,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
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

const RECENT_SEARCHES_KEY = 'connectwe_recent_searches';

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
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 최근 검색어 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 5));
      }
    } catch {
      // 로컬 스토리지 예외 무시
    }
  }, []);

  // 최근 검색어 저장 헬퍼
  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    try {
      const trimmed = term.trim();
      const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [recentSearches]);

  // 최근 검색어 개별 삭제
  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter(s => s !== termToRemove);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // 글로벌 단축키 ('/' 키로 검색창 포커스)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 다른 입력 필드 포커스 중에는 무시
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 외부 클릭 시 아코디언 닫기
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
      saveRecentSearch(query.trim());
      onExecuteSearch(query.trim());
      setIsFocused(false);
    }
  };

  const handleChipClick = (preset: string) => {
    onQueryChange(preset);
    saveRecentSearch(preset);
    onExecuteSearch(preset);
  };

  // 검색 결과 UTF-8 BOM CSV 내보내기 (헌장 준수: \uFEFF 필수)
  const handleExportCsv = () => {
    if (!searchResult || searchResult.matchedPeople.length === 0) return;
    const header = ['성명', '소속회사', '직함', '전문도메인', '연락처', '이메일', '친밀도', 'DART공시여부'];
    const rows = searchResult.matchedPeople.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.currentCompany.replace(/"/g, '""')}"`,
      `"${p.currentTitle.replace(/"/g, '""')}"`,
      `"${(p.primaryDomain || '').replace(/"/g, '""')}"`,
      `"${p.mobile || ''}"`,
      `"${p.email || ''}"`,
      `"${p.closeness}촌"`,
      `"${p.sourceType === 'DART_FACT' ? 'DART실공시' : '일반'}"`
    ]);

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ConnectWe_검색결과_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder='인맥 성명, 초성(ㄱㅅㅇ), 회사명, DART 공시, 스킬 검색... ("/" 키로 바로 검색)'
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-normal"
          />

          {query && (
            <button
              type="button"
              onClick={onResetSearch}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mr-1 active:scale-95 cursor-pointer"
              title="검색어 지우기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden sm:flex items-center mr-2 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            /
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-xs font-semibold text-white shadow-2xs cursor-pointer flex-shrink-0"
          >
            <Sparkles className="w-3 h-3 text-indigo-200" />
            <span className="hidden sm:inline">지능 검색</span>
          </button>
        </div>
      </form>

      {/* Smart Accordion: Expand only when focused or active */}
      {isExpanded && (
        <div className="space-y-2 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* 최근 검색어 (검색창 포커스 중이고 최근 검색어가 있는 경우) */}
          {isFocused && recentSearches.length > 0 && !query && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs text-slate-500 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1 mr-1">
                <Clock className="w-3 h-3 text-slate-400" /> 최근 검색:
              </span>
              {recentSearches.map((term, idx) => (
                <div
                  key={idx}
                  onClick={() => handleChipClick(term)}
                  className="group flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all text-xs cursor-pointer"
                >
                  <span>{term}</span>
                  <button
                    type="button"
                    onClick={(e) => removeRecentSearch(e, term)}
                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                    title="기록 삭제"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

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

      {/* Did You Mean (오타 교정 제안 칩) */}
      {searchResult?.didYouMean && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs animate-in fade-in duration-200">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>혹시 <strong>&quot;{searchResult.didYouMean}&quot;</strong>(으)로 검색하시겠습니까?</span>
          <button
            type="button"
            onClick={() => handleChipClick(searchResult.didYouMean!)}
            className="ml-auto px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-2xs cursor-pointer transition-all"
          >
            추천 단어로 재검색
          </button>
        </div>
      )}

      {/* AI Synthesis Reasoning Briefing Card (컴팩트 아코디언 모드) */}
      {searchResult && query && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 shadow-sm p-3.5 sm:p-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 w-full">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 mt-0.5 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between gap-2 flex-wrap w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                      GraphRAG 경로 분석 & 지능형 브리핑
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      {searchResult.matchedPeople.length}명 연결
                    </span>
                    {searchResult.filterTags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-indigo-800 border border-indigo-200 shadow-2xs">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* CSV 내보내기 & 필터 해제 */}
                  <div className="flex items-center gap-2">
                    {searchResult.matchedPeople.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-800 text-xs font-medium shadow-2xs cursor-pointer transition-all"
                        title="검색 결과 CSV 다운로드 (Excel BOM 인코딩)"
                      >
                        <Download className="w-3 h-3 text-indigo-600" />
                        <span>CSV</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onResetSearch}
                      className="text-xs text-slate-500 hover:text-slate-800 underline whitespace-nowrap cursor-pointer"
                    >
                      필터 해제
                    </button>
                  </div>
                </div>

                {/* 1줄 컴팩트 요약 또는 전체 펼침 */}
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  <p className={isReasoningExpanded ? '' : 'line-clamp-2'}>
                    {searchResult.reasoning}
                  </p>
                  {searchResult.reasoning.length > 100 && (
                    <button
                      type="button"
                      onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
                      className="flex items-center gap-0.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 cursor-pointer"
                    >
                      <span>{isReasoningExpanded ? '간략히 보기' : '자세히 보기'}</span>
                      {isReasoningExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

