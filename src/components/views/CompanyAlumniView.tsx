import React, { useState } from 'react';
import { Person } from '../../types/network';
import { Building2, ArrowRight, ShieldCheck, Sparkles, Briefcase } from 'lucide-react';
import { ViewHeader } from '../ui';

interface CompanyAlumniViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

export const CompanyAlumniView: React.FC<CompanyAlumniViewProps> = ({ people, onSelectPerson }) => {
  // 기업별 현직/알럼나이 맵 생성
  const companyMap = new Map<string, { current: Person[]; alumni: Person[] }>();

  people.forEach(p => {
    // 1. 현직 추가
    if (!companyMap.has(p.currentCompany)) {
      companyMap.set(p.currentCompany, { current: [], alumni: [] });
    }
    companyMap.get(p.currentCompany)!.current.push(p);

    // 2. 알럼나이(전직) 추가
    p.careers.filter(c => !c.isCurrent).forEach(c => {
      if (!companyMap.has(c.companyName)) {
        companyMap.set(c.companyName, { current: [], alumni: [] });
      }
      const list = companyMap.get(c.companyName)!.alumni;
      if (!list.some(existing => existing.id === p.id)) {
        list.push(p);
      }
    });
  });

  const companies = Array.from(companyMap.entries()).map(([name, data]) => ({
    name,
    currentCount: data.current.length,
    alumniCount: data.alumni.length,
    totalCount: data.current.length + data.alumni.length,
    current: data.current,
    alumni: data.alumni
  })).sort((a, b) => b.totalCount - a.totalCount);

  const [selectedCompany, setSelectedCompany] = useState<string>(companies[0]?.name || '');

  const activeData = companyMap.get(selectedCompany) || { current: [], alumni: [] };

  return (
    <div className="space-y-4">
      <ViewHeader
        icon={Building2}
        title="기업별 현직 & 전직 알럼나이 네트워크"
        subtitle="주요 법인별 현재 재직 중인 1촌과 이전 재직(알럼나이) 이력을 입체적으로 분석하여 신뢰 연결 고리를 발견합니다."
        englishTag="Corporate & Alumni Networks"
        badge={
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 font-medium font-mono">
            {companies.length}개 주요 법인
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
      {/* Left Column: Company Directory & Alumni Counts */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-full space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">기업 & 알럼나이 허브</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{companies.length}개 법인</span>
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
          {companies.map(comp => {
            const isSelected = selectedCompany === comp.name;
            return (
              <button
                key={comp.name}
                onClick={() => setSelectedCompany(comp.name)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-indigo-600/15 border-blue-300 dark:border-indigo-500/50 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-slate-200/80 hover:border-slate-300 dark:border-slate-800/80 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {comp.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>현직 {comp.currentCount}명</span>
                    <span>·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">전직 알럼나이 {comp.alumniCount}명</span>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  isSelected ? 'bg-blue-600 dark:bg-indigo-500 text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Dynamic Deep Dive (Current vs Alumni Networks) */}
      <div className="lg:col-span-8 space-y-6">
        {selectedCompany ? (
          <>
            {/* Header Card */}
            <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">{selectedCompany}</h2>
                    <p className="text-xs text-slate-400">
                      총 연결 인맥: <span className="text-white font-semibold">{activeData.current.length + activeData.alumni.length}명</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                  현직 <span className="font-bold text-white">{activeData.current.length}명</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300">
                  알럼나이(전직) <span className="font-bold text-amber-200">{activeData.alumni.length}명</span>
                </div>
              </div>
            </div>

            {/* Section 1: Current In-Office Members */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  현직 재직 인맥 ({activeData.current.length}명)
                </h3>
              </div>

              {activeData.current.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  현재 등록된 현직 재직자가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeData.current.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onSelectPerson(p)}
                      className="p-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900/80 dark:hover:bg-slate-800/80 border border-slate-200 hover:border-blue-400 dark:border-slate-800 dark:hover:border-indigo-500/50 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-indigo-300 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">
                              {p.currentTitle} {p.currentDepartment ? `· ${p.currentDepartment}` : ''}
                            </span>
                          </div>
                          {p.sourceType === 'DART_FACT' && (
                            <span className="px-1.5 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-semibold flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> DART
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {p.primaryDomain}
                          </span>
                          <span>{p.estimatedAgeGroup}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{p.mobile}</span>
                        <span className="text-blue-600 dark:text-indigo-400 group-hover:text-blue-700 dark:group-hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors">
                          프로필 보기 <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Alumni Members (알럼나이 및 이전 재직 인맥 네트워크 연결) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>알럼나이(Alumni) 네트워크 ({activeData.alumni.length}명)</span>
                  <span className="text-[11px] text-slate-400 font-normal ml-1">
                    (과거 {selectedCompany} 거쳐 현재 타사 재직/창업)
                  </span>
                </h3>
              </div>

              {activeData.alumni.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  과거 {selectedCompany} 재직 이력이 있는 알럼나이 인맥이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeData.alumni.map(p => {
                    const pastCareer = p.careers.find(c => !c.isCurrent && c.companyName.toLowerCase().includes(selectedCompany.toLowerCase()));
                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectPerson(p)}
                        className="p-4 rounded-xl bg-white hover:bg-amber-50/40 dark:bg-gradient-to-br dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 dark:hover:from-amber-950/30 dark:hover:to-slate-800/80 border border-amber-200/80 dark:border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                  {p.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[11px] bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-semibold">
                                  알럼나이
                                </span>
                              </div>
                              <span className="text-xs text-blue-600 dark:text-indigo-400 font-semibold block mt-0.5">
                                (현) {p.currentCompany} · {p.currentTitle}
                              </span>
                            </div>
                            {p.sourceType === 'DART_FACT' && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-semibold flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> DART
                              </span>
                            )}
                          </div>

                          {pastCareer && (
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                              <span>(과거) {pastCareer.companyName} {pastCareer.title} ({pastCareer.startYear}~{pastCareer.endYear || ''})</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{p.primaryDomain}</span>
                          <span className="text-amber-700 dark:text-amber-400 group-hover:text-amber-800 flex items-center gap-1 font-semibold transition-colors">
                            상세 관계도 <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            좌측에서 기업을 선택하여 현직 및 전직 알럼나이 네트워크를 탐색하세요.
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
