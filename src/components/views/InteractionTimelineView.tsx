import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  Users, CheckCircle2, AlertTriangle, Sparkles, Search
} from 'lucide-react';

interface InteractionTimelineViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenDossier: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const InteractionTimelineView: React.FC<InteractionTimelineViewProps> = ({
  people,
  onSelectPerson,
  onOpenDossier,
  onShowToast
}) => {
  const [filterType, setFilterType] = useState<'all' | 'stale' | 'recent'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleFilterChange = (type: 'all' | 'stale' | 'recent') => {
    setFilterType(type);
    if (type === 'stale') onShowToast('⚠️ 6개월 이상 소통이 단절된 인맥 필터가 적용되었습니다.');
    else if (type === 'recent') onShowToast('✨ 최근 90일 내 소통 기록이 있는 인맥 필터가 적용되었습니다.');
  };

  // 6개월(180일) 이상 소통 단절된 인맥
  const stalePeople = people.filter(p => p.closeness !== 1 && p.isStale);

  // 최근 90일 내 소통 기록이 있는 인맥
  const recentPeople = people.filter(p => {
    if (p.closeness === 1 || !p.lastContactDate) return false;
    const diffDays = (Date.now() - new Date(p.lastContactDate).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 90;
  });

  // 필터링 적용 인맥 리스트
  const targetList = filterType === 'stale' ? stalePeople : filterType === 'recent' ? recentPeople : people.filter(p => p.closeness !== 1);

  const filteredPeople = targetList.filter(p => {
    if (!searchKeyword.trim()) return true;
    const term = searchKeyword.toLowerCase();
    return p.name.toLowerCase().includes(term) ||
           p.currentCompany.toLowerCase().includes(term) ||
           p.primaryDomain.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* 상단 현황 대시보드 배너 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => handleFilterChange('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'all'
              ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>관리 중인 전체 인맥</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {people.filter(p => p.closeness !== 1).length}명
          </div>
          <div className="text-[11px] text-slate-500 mt-1">상시 소통 관리 대상</div>
        </div>

        <div 
          onClick={() => handleFilterChange('recent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'recent'
              ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span>최근 90일 활성 소통</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            {recentPeople.length}명
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">관계 온도가 높은 핵심 인맥</div>
        </div>

        <div 
          onClick={() => handleFilterChange('stale')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'stale'
              ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span>관계 단절 위험 (180일+)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300">
            {stalePeople.length}명
          </div>
          <div className="text-[11px] text-rose-500/80 mt-1">안부 연락이 시급한 지인</div>
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-300">소통 상태 필터:</span>
          <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 rounded-md transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              전체 ({people.filter(p => p.closeness !== 1).length})
            </button>
            <button
              onClick={() => handleFilterChange('recent')}
              className={`px-3 py-1 rounded-md transition-all ${filterType === 'recent' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              최근 소통 ({recentPeople.length})
            </button>
            <button
              onClick={() => handleFilterChange('stale')}
              className={`px-3 py-1 rounded-md transition-all ${filterType === 'stale' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              단절 위험 ({stalePeople.length})
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="이름, 회사, 도메인 검색..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 인맥 소통 타임라인 카드 그리드 */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          {filterType === 'stale' ? '⚠️ 관계 복원이 필요한 인맥 리스트' : filterType === 'recent' ? '✨ 최근 소통 인맥 타임라인' : '인맥 소통 관리 대장'} ({filteredPeople.length}명)
        </div>

        {filteredPeople.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
            해당 조건에 부합하는 인맥이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div 
                        onClick={() => onSelectPerson(person)}
                        className="font-bold text-sm text-white group-hover:text-indigo-300 cursor-pointer transition-colors"
                      >
                        {person.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {person.currentCompany} · {person.currentTitle}
                      </div>
                    </div>

                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                      person.isStale
                        ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {person.isStale ? '180일+ 미소통' : '소통 유지'}
                    </span>
                  </div>

                  {/* 메모 미리보기 */}
                  <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 text-[11px] text-slate-300 min-h-[46px] line-clamp-2">
                    {person.memo ? person.memo : <span className="text-slate-500 italic">기록된 메모 없음</span>}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>마지막 소통: {person.lastContactDate || '기록 없음'}</span>
                    <span>{person.primaryDomain}</span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onOpenDossier(person)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold transition-all active:scale-95 shadow-sm shadow-indigo-600/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>미팅 전략 브리핑</span>
                  </button>

                  <button
                    onClick={() => onSelectPerson(person)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    상세/메모
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
