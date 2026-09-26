import React, { useState } from 'react';
import { Person, AgeGroup } from '../../types/network';
import { ArrowRight, Briefcase, Users, Phone, Calendar, Rocket, Cpu, Sparkles, Building2 } from 'lucide-react';
import { identifyTalentCluster } from '../../services/talentClusterEngine';
import { ViewHeader } from '../ui';

interface AgeSpectrumViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

const AGE_SEGMENTS: { key: AgeGroup; label: string; sub: string; range: string }[] = [
  { key: '20s', label: '신진 혁신 프론티어 (20s)', sub: '최신 AI 기술 연구 · 기민한 프로토타이핑 · 도전적 창업가', range: '도전과 탐색기' },
  { key: '30s', label: '도약기 비즈니스 리더 (30s)', sub: '제품 고도화 총괄 · 스타트업 스케일업 · 핵심 투자 심사', range: '고속 성장기' },
  { key: '40s', label: '원숙한 전략 총괄 (40s)', sub: '조직 스케일링 & 테크 아키텍처 · 크로스펑셔널 리더십 · 글로벌 확장', range: '전략 주도기' },
  { key: '50s_plus', label: '원로 고문 & 경영 자문 (50s+)', sub: '기업 거버넌스 · 거시적 통찰 · 풍부한 위기관리 경험', range: '경영 자문기' }
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
      {/* Standardized Header */}
      <ViewHeader
        icon={Calendar}
        title="세대별 인재 & 경력 스펙트럼 분석"
        subtitle="청년 혁신 프론티어부터 원숙한 전략 총괄까지, 각 세대 및 경력 단계별 인재의 고유 강점을 파악합니다."
        englishTag="Talent Spectrum & Seniority"
      />

      {/* 4-Column Age Spectrum Tabs - Apple Clean Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {AGE_SEGMENTS.map(seg => {
          const count = people.filter(p => p.estimatedAgeGroup === seg.key).length;
          const isSelected = activeTab === seg.key;

          return (
            <button
              key={seg.key}
              onClick={() => setActiveTab(seg.key)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-50/80 border-slate-900 shadow-xs ring-1 ring-slate-900/10'
                  : 'bg-white hover:bg-slate-50/60 border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isSelected ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {seg.range}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {count}명
                  </span>
                </div>
                <h3 className={`text-sm font-extrabold tracking-tight ${
                  isSelected ? 'text-slate-900' : 'text-slate-800'
                }`}>
                  {seg.label}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1">{seg.sub}</p>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* Domain Secondary Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold whitespace-nowrap text-[11px]">도메인:</span>
        <button
          onClick={() => setDomainFilter('all')}
          className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer text-xs font-semibold shadow-2xs ${
            domainFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/90'
          }`}
        >
          전체 ({people.filter(p => p.estimatedAgeGroup === activeTab).length})
        </button>
        {domains.map((dom, idx) => {
          const domCount = people.filter(p => p.estimatedAgeGroup === activeTab && p.primaryDomain.includes(dom)).length;
          if (domCount === 0) return null;
          return (
            <button
              key={idx}
              onClick={() => setDomainFilter(dom)}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer text-xs font-semibold shadow-2xs ${
                domainFilter === dom
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/90'
              }`}
            >
              {dom} ({domCount})
            </button>
          );
        })}
      </div>

      {/* People Grid */}
      {filteredPeople.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/90 text-slate-500 text-xs shadow-2xs space-y-2">
          <Users className="w-8 h-8 mx-auto text-slate-300" />
          <p className="font-medium">선택한 나이대 및 도메인에 부합하는 인맥 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPeople.map(person => {
            const cluster = identifyTalentCluster(person);
            return (
            <div
              key={person.id}
              onClick={() => onSelectPerson(person)}
              className="p-4 rounded-2xl bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-slate-300 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                {/* Header: Name, Tags */}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      {person.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${cluster.badgeStyle}`}>
                      {cluster.id === 'LISTED_EXECUTIVE' && <Building2 className="w-2.5 h-2.5" />}
                      {cluster.id === 'VENTURE_LEADER' && <Rocket className="w-2.5 h-2.5" />}
                      {cluster.id === 'TECH_FELLOW' && <Cpu className="w-2.5 h-2.5" />}
                      {cluster.id === 'INVESTOR_PARTNER' && <Briefcase className="w-2.5 h-2.5" />}
                      {cluster.id === 'CORE_SPECIALIST' && <Sparkles className="w-2.5 h-2.5" />}
                      <span>{cluster.label}</span>
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {person.currentCompany}
                  </p>
                  <p className="text-xs text-slate-500">
                    {person.currentTitle} {person.currentDepartment ? `(${person.currentDepartment})` : ''} · <span className="text-indigo-600 font-mono font-medium">{cluster.seniorityLevel}</span>
                  </p>
                </div>

                {/* Alumni past history badge if exists */}
                {person.careers.some(c => !c.isCurrent) && (
                  <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="line-clamp-1">
                      <strong className="font-semibold">전직 알럼나이:</strong> {person.careers.filter(c => !c.isCurrent).map(c => c.companyName).join(', ')}
                    </span>
                  </div>
                )}

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                    {person.primaryDomain}
                  </span>
                  {person.skills.slice(0, 2).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{person.mobile}</span>
                </span>
                <span className="text-slate-600 group-hover:text-blue-600 flex items-center gap-1 font-bold transition-colors">
                  <span>프로필</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
