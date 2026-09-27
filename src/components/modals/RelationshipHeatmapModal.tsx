import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { CalendarMeeting } from '../../services/calendarRadarService';
import { 
  calculateTieStrength, 
  getCoolingDownAlerts, 
  buildIndustryHeatmapMatrix,
  TIE_STRENGTH_CONFIG,
  TieStrengthLevel
} from '../../services/tieStrengthService';
import { 
  X, Flame, Snowflake, Sparkles, 
  Users, Building2, Search, Coffee
} from 'lucide-react';

interface RelationshipHeatmapModalProps {
  people: Person[];
  meetings?: CalendarMeeting[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const RelationshipHeatmapModal: React.FC<RelationshipHeatmapModalProps> = ({
  people,
  meetings = [],
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const [selectedLevel, setSelectedLevel] = useState<TieStrengthLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  // 결속도 상세 연산
  const peopleWithTieStrength = useMemo(() => {
    return people
      .filter(p => p.closeness > 1) // 본인 제외
      .map(person => ({
        person,
        detail: calculateTieStrength(person, meetings)
      }));
  }, [people, meetings]);

  // 급랭 위험 알림 (1~2촌 인맥 중 소통 공백 장기화)
  const coolingDownAlerts = useMemo(() => {
    return getCoolingDownAlerts(people, meetings);
  }, [people, meetings]);

  // 산업군 매트릭스 그리드
  const industryMatrix = useMemo(() => {
    return buildIndustryHeatmapMatrix(people, meetings);
  }, [people, meetings]);

  // 5단계 레벨별 카운트
  const levelCounts = useMemo(() => {
    const counts: Record<TieStrengthLevel, number> = {
      CHILLY: 0,
      COOL: 0,
      WARM: 0,
      HOT: 0,
      DIAMOND: 0
    };
    for (const item of peopleWithTieStrength) {
      counts[item.detail.level] += 1;
    }
    return counts;
  }, [peopleWithTieStrength]);

  // 필터링된 인맥 목록
  const filteredPeople = useMemo(() => {
    return peopleWithTieStrength.filter(({ person, detail }) => {
      if (selectedLevel !== 'ALL' && detail.level !== selectedLevel) return false;
      if (selectedDomain !== 'ALL' && person.primaryDomain !== selectedDomain) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = person.name.toLowerCase().includes(q);
        const matchesCompany = person.currentCompany.toLowerCase().includes(q);
        const matchesDomain = person.primaryDomain.toLowerCase().includes(q);
        if (!matchesName && !matchesCompany && !matchesDomain) return false;
      }
      return true;
    }).sort((a, b) => b.detail.score - a.detail.score);
  }, [peopleWithTieStrength, selectedLevel, selectedDomain, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Flame className="w-5 h-5 text-amber-200 fill-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  C-Level 인맥 관계 결속도 &amp; 온도 히트맵
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Granovetter Tie Strength
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                친밀도, 최근 소통 주기, 미팅 빈도, DART 공시 팩트를 종합 분석한 5단계 관계 온도 레이더
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section 1: 5대 관계 온도 분포 요약 바 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['DIAMOND', 'HOT', 'WARM', 'COOL', 'CHILLY'] as TieStrengthLevel[]).map(lvl => {
              const cfg = TIE_STRENGTH_CONFIG[lvl];
              const count = levelCounts[lvl];
              const isActive = selectedLevel === lvl;

              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(prev => prev === lvl ? 'ALL' : lvl)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{cfg.emoji}</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {count}명
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {cfg.label.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {lvl === 'DIAMOND' && '절대 신뢰 얼라이언스'}
                    {lvl === 'HOT' && '상시 직통 핵심 키맨'}
                    {lvl === 'WARM' && '정기 교류 파트너'}
                    {lvl === 'COOL' && '간헐적 교류 접점'}
                    {lvl === 'CHILLY' && '소통 공백 주의'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Section 2: 급랭 위험 경보 배너 (소통 골든타임) */}
          {coolingDownAlerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-amber-50/50 dark:from-sky-950/30 dark:via-indigo-950/20 dark:to-amber-950/20 border border-sky-200 dark:border-sky-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
                    <Snowflake className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
                    관계 급랭 경보: 핵심 1~2촌 인맥 중 90일 이상 미소통 ({coolingDownAlerts.length}명)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  골든타임 안부 제안
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {coolingDownAlerts.slice(0, 3).map(({ person, detail }) => (
                  <div
                    key={person.id}
                    className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-sky-100 dark:border-sky-900 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {person.name} <span className="font-normal text-slate-500">({person.currentTitle})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {person.currentCompany} · <b className="text-rose-600">{detail.daysSinceLastContact}일 전</b> 소통
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectPerson(person);
                        onShowToast(`[${person.name}] 님과의 안부 티타임 일정을 조율합니다.`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Coffee className="w-3 h-3" />
                      <span>안부</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: 산업군 x 5단계 온도 매트릭스 히트맵 테이블 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  산업군(Domain) x 관계 결속도 매트릭스 히트맵
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                도메인을 클릭하면 해당 산업군 인맥만 집중 필터링됩니다.
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">산업 도메인</th>
                    <th className="px-3 py-3 text-center">💎 Diamond</th>
                    <th className="px-3 py-3 text-center">🔥 Hot</th>
                    <th className="px-3 py-3 text-center">🌿 Warm</th>
                    <th className="px-3 py-3 text-center">🍃 Cool</th>
                    <th className="px-3 py-3 text-center">❄️ Chilly</th>
                    <th className="px-4 py-3 text-right">평균 결속도</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {industryMatrix.slice(0, 6).map(row => {
                    const isSelected = selectedDomain === row.domain;
                    return (
                      <tr 
                        key={row.domain}
                        onClick={() => setSelectedDomain(prev => prev === row.domain ? 'ALL' : row.domain)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/80 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/40 font-bold' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>{row.domain}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({row.total}명)</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                            row.counts.DIAMOND > 0 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200' : 'text-slate-300'
                          }`}>
                            {row.counts.DIAMOND}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                            row.counts.HOT > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' : 'text-slate-300'
                          }`}>
                            {row.counts.HOT}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                            row.counts.WARM > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' : 'text-slate-300'
                          }`}>
                            {row.counts.WARM}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                            row.counts.COOL > 0 ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' : 'text-slate-300'
                          }`}>
                            {row.counts.COOL}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold ${
                            row.counts.CHILLY > 0 ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200' : 'text-slate-300'
                          }`}>
                            {row.counts.CHILLY}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-indigo-600 rounded-full" 
                                style={{ width: `${row.avgScore}%` }} 
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {row.avgScore}점
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: 인맥 목록 & 검색 & 결속도 게이지 카드 */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  결속도별 인맥 포트폴리오 ({filteredPeople.length}명)
                </h3>
                {selectedDomain !== 'ALL' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                    도메인: {selectedDomain}
                    <button onClick={() => setSelectedDomain('ALL')} className="ml-1 text-indigo-400 hover:text-indigo-700">×</button>
                  </span>
                )}
                {selectedLevel !== 'ALL' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    온도: {selectedLevel}
                    <button onClick={() => setSelectedLevel('ALL')} className="ml-1 text-amber-500 hover:text-amber-800">×</button>
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="이름, 회사, 도메인 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* People Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredPeople.map(({ person, detail }) => {
                const cfg = detail.meta;

                return (
                  <div
                    key={person.id}
                    onClick={() => {
                      onClose();
                      onSelectPerson(person);
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {person.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {person.currentTitle}
                        </span>
                        {person.sourceType === 'DART_FACT' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            DART
                          </span>
                        )}
                        {detail.isCoolingDown && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 flex items-center gap-0.5">
                            <Snowflake className="w-2.5 h-2.5" />
                            급랭주의
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {person.currentCompany} · {person.primaryDomain}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>최근 소통: <b>{detail.daysSinceLastContact === 999 ? '기록 없음' : `${detail.daysSinceLastContact}일 전`}</b></span>
                        <span>친밀도: <b>{person.closeness}촌</b></span>
                      </div>
                    </div>

                    {/* Tie Strength Score Gauge */}
                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{cfg.emoji}</span>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {detail.score}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">점</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                        {cfg.label.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mark Granovetter의 강한 유대(Strong Ties) &amp; 약한 유대(Weak Ties) 균형 분석 가동 중</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
