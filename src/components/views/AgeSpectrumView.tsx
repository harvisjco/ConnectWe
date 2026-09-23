import React, { useState } from 'react';
import { Person, AgeGroup } from '../../types/network';
import { ShieldCheck, ArrowRight, Briefcase } from 'lucide-react';

interface AgeSpectrumViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

const AGE_SEGMENTS: { key: AgeGroup; label: string; sub: string; range: string; color: string }[] = [
  { key: '20s', label: '20대 청년 프론티어', sub: '신진 AI 연구원 · 주니어 빌더 · 예비 창업자', range: '20 ~ 29세', color: 'from-sky-500/20 to-blue-500/10' },
  { key: '30s', label: '30대 실무 테크 리드', sub: '스타트업 창업자(CEO) · CPO · VP · 투자 심사역', range: '30 ~ 39세', color: 'from-indigo-500/20 to-purple-500/10' },
  { key: '40s', label: '40대 시니어/임원급', sub: '상장사/대기업 본부장 · CTO · VC 파트너', range: '40 ~ 49세', color: 'from-amber-500/20 to-orange-500/10' },
  { key: '50s_plus', label: '50대+ C-Level & 고문', sub: '대표이사(CEO) · 사내이사 · CFO · 사외이사', range: '50세 이상', color: 'from-emerald-500/20 to-teal-500/10' }
];

export const AgeSpectrumView: React.FC<AgeSpectrumViewProps> = ({ people, onSelectPerson }) => {
  const [activeTab, setActiveTab] = useState<AgeGroup>('40s');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const filteredPeople = people.filter(p => {
    const matchAge = p.estimatedAgeGroup === activeTab;
    const matchDomain = domainFilter === 'all' || p.primaryDomain.includes(domainFilter);
    return matchAge && matchDomain;
  });

  // 고유 도메인 추출
  const domains = Array.from(new Set(people.map(p => p.primaryDomain)));

  return (
    <div className="space-y-6">
      {/* 4-Column Age Spectrum Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {AGE_SEGMENTS.map(seg => {
          const count = people.filter(p => p.estimatedAgeGroup === seg.key).length;
          const isSelected = activeTab === seg.key;

          return (
            <button
              key={seg.key}
              onClick={() => setActiveTab(seg.key)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {seg.range}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {count}명
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">{seg.label}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-1">{seg.sub}</p>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Domain Secondary Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap">도메인 필터:</span>
        <button
          onClick={() => setDomainFilter('all')}
          className={`px-3 py-1 rounded-lg border transition-all whitespace-nowrap ${
            domainFilter === 'all'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
          }`}
        >
          전체 보기 ({people.filter(p => p.estimatedAgeGroup === activeTab).length})
        </button>
        {domains.map((dom, idx) => {
          const domCount = people.filter(p => p.estimatedAgeGroup === activeTab && p.primaryDomain.includes(dom)).length;
          if (domCount === 0) return null;
          return (
            <button
              key={idx}
              onClick={() => setDomainFilter(dom)}
              className={`px-3 py-1 rounded-lg border transition-all whitespace-nowrap ${
                domainFilter === dom
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
              }`}
            >
              {dom} ({domCount})
            </button>
          );
        })}
      </div>

      {/* People Grid */}
      {filteredPeople.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
          선택한 나이대 및 도메인에 부합하는 인맥 데이터가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map(person => (
            <div
              key={person.id}
              onClick={() => onSelectPerson(person)}
              className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Name, Tags */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                        {person.name}
                      </span>
                      {person.sourceType === 'DART_FACT' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" /> DART FACT
                        </span>
                      )}
                      {person.isAgeEstimated && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚡ 연차추정
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-300 mt-0.5">
                      {person.currentCompany}
                    </p>
                    <p className="text-xs text-slate-400">
                      {person.currentTitle} {person.currentDepartment ? `(${person.currentDepartment})` : ''}
                    </p>
                  </div>
                </div>

                {/* Alumni past history badge if exists */}
                {person.careers.some(c => !c.isCurrent) && (
                  <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>
                      전직 알럼나이: {person.careers.filter(c => !c.isCurrent).map(c => c.companyName).join(', ')}
                    </span>
                  </div>
                )}

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px]">
                    {person.primaryDomain}
                  </span>
                  {person.skills.slice(0, 2).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{person.mobile}</span>
                <span className="group-hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors">
                  인스펙터 <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
