import React, { useState } from 'react';
import { Person } from '../../types/network';
import { Building2, ArrowRight, Sparkles, Briefcase, Rocket, Cpu, LayoutGrid, List } from 'lucide-react';
import { identifyTalentCluster } from '../../services/talentClusterEngine';
import { ViewHeader } from '../ui';

interface CompanyAlumniViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

export const CompanyAlumniView: React.FC<CompanyAlumniViewProps> = ({ people, onSelectPerson }) => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [subFilter, setSubFilter] = useState<'all' | 'current' | 'alumni'>('all');

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

  const displayedPeople = subFilter === 'all'
    ? [...activeData.current.map(p => ({ person: p, isCurrent: true })), ...activeData.alumni.map(p => ({ person: p, isCurrent: false }))]
    : subFilter === 'current'
      ? activeData.current.map(p => ({ person: p, isCurrent: true }))
      : activeData.alumni.map(p => ({ person: p, isCurrent: false }));

  return (
    <div className="space-y-4">
      <ViewHeader
        icon={Building2}
        title="기업별 현직 & 전직 알럼나이 네트워크"
        subtitle="주요 법인별 현직 1촌과 알럼나이 이력을 입체적으로 분석하여 신뢰 연결 고리를 발견합니다."
        englishTag="Corporate & Alumni Networks"
        badge={
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium font-mono">
            {companies.length}개 주요 법인
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Company Directory & Alumni Counts */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col h-full space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">기업 & 알럼나이 허브</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">{companies.length}개 법인</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 max-h-[650px]">
            {companies.map(comp => {
              const isSelected = selectedCompany === comp.name;
              return (
                <button
                  key={comp.name}
                  onClick={() => setSelectedCompany(comp.name)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-slate-100/90 border-slate-300 shadow-2xs font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200/70 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-slate-900' : 'text-slate-800 group-hover:text-slate-900'}`}>
                        {comp.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>현직 <strong className="text-slate-700">{comp.currentCount}</strong>명</span>
                      <span>·</span>
                      <span className="text-amber-800 font-medium">알럼나이 <strong className="text-amber-700">{comp.alumniCount}</strong>명</span>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Deep Dive */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCompany ? (
            <>
              {/* Header Control Card: High-Density & Clean Reference Style */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">{selectedCompany}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        총 {activeData.current.length + activeData.alumni.length}명
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      현직 {activeData.current.length}명 · 알럼나이 {activeData.alumni.length}명 연결망
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sub-filter tabs */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setSubFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        subFilter === 'all'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      전체 ({activeData.current.length + activeData.alumni.length})
                    </button>
                    <button
                      onClick={() => setSubFilter('current')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        subFilter === 'current'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      현직 ({activeData.current.length})
                    </button>
                    <button
                      onClick={() => setSubFilter('alumni')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                        subFilter === 'alumni'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      알럼나이 ({activeData.alumni.length})
                    </button>
                  </div>

                  {/* View Mode Switcher: Table vs Card */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setViewMode('table')}
                      title="리스트 테이블 뷰"
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                        viewMode === 'table'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">리스트</span>
                    </button>
                    <button
                      onClick={() => setViewMode('card')}
                      title="카드 뷰"
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                        viewMode === 'card'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">카드</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Presentation Area */}
              {displayedPeople.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  해당 필터 조건에 부합하는 인맥 데이터가 없습니다.
                </div>
              ) : viewMode === 'table' ? (
                /* High-Density Executive Table Mode (Inspired by GoodPartner Reference) */
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3.5">인재명 / 직함</th>
                          <th className="py-2.5 px-3">네트워크 구분</th>
                          <th className="py-2.5 px-3">현재 소속 / 조직</th>
                          <th className="py-2.5 px-3">클러스터</th>
                          <th className="py-2.5 px-3">경력 단계</th>
                          <th className="py-2.5 px-3">연락처</th>
                          <th className="py-2.5 px-3 text-right">상세</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {displayedPeople.map(({ person: p, isCurrent }) => {
                          const cluster = identifyTalentCluster(p);
                          const pastCareer = !isCurrent
                            ? p.careers.find(c => !c.isCurrent && c.companyName.toLowerCase().includes(selectedCompany.toLowerCase()))
                            : null;

                          return (
                            <tr
                              key={`${p.id}-${isCurrent ? 'current' : 'alumni'}`}
                              onClick={() => onSelectPerson(p)}
                              className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                            >
                              {/* 1. Name & Title */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                                    {p.name.slice(0, 1)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                      {p.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {p.currentTitle}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Current vs Alumni Badge */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {isCurrent ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    현직 재직
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                    알럼나이
                                  </span>
                                )}
                              </td>

                              {/* 3. Company & Department */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="font-medium text-slate-800 truncate max-w-[150px]">
                                  {p.currentCompany}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                  {isCurrent
                                    ? (p.currentDepartment || '본사')
                                    : (pastCareer ? `(전) ${pastCareer.companyName} ${pastCareer.title}` : (p.currentDepartment || '본사'))}
                                </div>
                              </td>

                              {/* 4. Talent Cluster */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border inline-flex items-center gap-1 ${cluster.badgeStyle}`}>
                                  {cluster.id === 'LISTED_EXECUTIVE' && <Building2 className="w-2.5 h-2.5" />}
                                  {cluster.id === 'VENTURE_LEADER' && <Rocket className="w-2.5 h-2.5" />}
                                  {cluster.id === 'TECH_FELLOW' && <Cpu className="w-2.5 h-2.5" />}
                                  {cluster.id === 'INVESTOR_PARTNER' && <Briefcase className="w-2.5 h-2.5" />}
                                  {cluster.id === 'CORE_SPECIALIST' && <Sparkles className="w-2.5 h-2.5" />}
                                  <span>{cluster.label}</span>
                                </span>
                              </td>

                              {/* 5. Seniority */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                                  {cluster.seniorityLevel}
                                </span>
                              </td>

                              {/* 6. Contact */}
                              <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px] font-mono">
                                {p.mobile || '-'}
                              </td>

                              {/* 7. Action Button */}
                              <td className="py-3 px-3 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 group-hover:text-slate-900 transition-colors"
                                >
                                  보기 <ArrowRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Card Grid Mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayedPeople.map(({ person: p, isCurrent }) => {
                    const cluster = identifyTalentCluster(p);
                    const pastCareer = !isCurrent
                      ? p.careers.find(c => !c.isCurrent && c.companyName.toLowerCase().includes(selectedCompany.toLowerCase()))
                      : null;

                    return (
                      <div
                        key={`${p.id}-${isCurrent ? 'current' : 'alumni'}`}
                        onClick={() => onSelectPerson(p)}
                        className="p-4 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {p.name}
                                </span>
                                {isCurrent ? (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                    현직
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                                    알럼나이
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-600 block mt-0.5">
                                {isCurrent
                                  ? `${p.currentTitle} ${p.currentDepartment ? `· ${p.currentDepartment}` : ''}`
                                  : `(현) ${p.currentCompany} · ${p.currentTitle}`}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 flex-shrink-0 ${cluster.badgeStyle}`}>
                              {cluster.id === 'LISTED_EXECUTIVE' && <Building2 className="w-2.5 h-2.5" />}
                              {cluster.id === 'VENTURE_LEADER' && <Rocket className="w-2.5 h-2.5" />}
                              {cluster.id === 'TECH_FELLOW' && <Cpu className="w-2.5 h-2.5" />}
                              {cluster.id === 'INVESTOR_PARTNER' && <Briefcase className="w-2.5 h-2.5" />}
                              {cluster.id === 'CORE_SPECIALIST' && <Sparkles className="w-2.5 h-2.5" />}
                              <span>{cluster.label}</span>
                            </span>
                          </div>

                          {!isCurrent && pastCareer && (
                            <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-900 flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3 text-amber-600 flex-shrink-0" />
                              <span className="truncate">(과거) {pastCareer.companyName} {pastCareer.title} ({pastCareer.startYear}~{pastCareer.endYear || ''})</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              {p.primaryDomain}
                            </span>
                            <span className="font-mono text-slate-600 font-medium">{cluster.seniorityLevel}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{p.mobile || '-'}</span>
                          <span className="text-slate-700 group-hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors">
                            프로필 보기 <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
