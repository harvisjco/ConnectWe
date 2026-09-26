import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  Users, CheckCircle2, AlertTriangle, Sparkles, Search, Clock,
  LayoutList, LayoutGrid
} from 'lucide-react';
import { ViewHeader } from '../ui';

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
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const handleFilterChange = (type: 'all' | 'stale' | 'recent') => {
    setFilterType(type);
    if (type === 'stale') onShowToast('6개월 이상 소통 공백(안부 연락 필요) 인맥 필터가 적용되었습니다.');
    else if (type === 'recent') onShowToast('최근 90일 내 소통 기록이 있는 인맥 필터가 적용되었습니다.');
  };

  // 6개월(180일) 이상 소통 공백(안부 필요) 인맥
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
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Standardized Header */}
      <ViewHeader
        icon={Clock}
        title="소통 타임라인 & 안부 케어 센터"
        subtitle="최근 미팅 및 연락 이력을 추적하고, 일정 기간 소통이 뜸했던 소중한 인연에 안부를 전할 수 있도록 케어 알림을 제공합니다."
        englishTag="Interaction & Care Timeline"
        actions={
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 shrink-0 font-mono text-xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">안부 케어 필요</div>
              <div className="text-xs font-bold text-amber-700">{stalePeople.length}명</div>
            </div>
            <div className="h-5 w-[1px] bg-slate-200" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">최근 90일 소통</div>
              <div className="text-xs font-bold text-emerald-700">{recentPeople.length}명</div>
            </div>
          </div>
        }
      />

      {/* 2. 상단 3대 현황 요약 카드 (클릭 필터) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div 
          onClick={() => handleFilterChange('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
            filterType === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={filterType === 'all' ? 'text-slate-300' : 'text-slate-500 font-medium'}>관리 중인 전체 인맥</span>
            <Users className={`w-4 h-4 ${filterType === 'all' ? 'text-indigo-300' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-bold font-mono">
            {people.filter(p => p.closeness !== 1).length}<span className="text-xs font-normal ml-0.5">명</span>
          </div>
          <div className={`text-[11px] mt-1 ${filterType === 'all' ? 'text-slate-400' : 'text-slate-400'}`}>상시 소통 관리 대상</div>
        </div>

        <div 
          onClick={() => handleFilterChange('recent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
            filterType === 'recent'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={filterType === 'recent' ? 'text-emerald-100' : 'text-emerald-700 font-medium'}>최근 90일 활성 소통</span>
            <CheckCircle2 className={`w-4 h-4 ${filterType === 'recent' ? 'text-emerald-100' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-bold font-mono">
            {recentPeople.length}<span className="text-xs font-normal ml-0.5">명</span>
          </div>
          <div className={`text-[11px] mt-1 ${filterType === 'recent' ? 'text-emerald-200' : 'text-emerald-600'}`}>관계 온도가 높은 핵심 인맥</div>
        </div>

        <div 
          onClick={() => handleFilterChange('stale')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
            filterType === 'stale'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={filterType === 'stale' ? 'text-rose-100' : 'text-rose-700 font-medium'}>소통 공백 주의 (180일+)</span>
            <AlertTriangle className={`w-4 h-4 ${filterType === 'stale' ? 'text-rose-100' : 'text-rose-500'}`} />
          </div>
          <div className="text-2xl font-bold font-mono">
            {stalePeople.length}<span className="text-xs font-normal ml-0.5">명</span>
          </div>
          <div className={`text-[11px] mt-1 ${filterType === 'stale' ? 'text-rose-200' : 'text-rose-600'}`}>정중한 안부 인사 권장</div>
        </div>
      </div>

      {/* 3. 필터 및 검색 바 + 뷰 모드 스위처 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shadow-2xs ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            전체 ({people.filter(p => p.closeness !== 1).length})
          </button>
          <button
            onClick={() => handleFilterChange('recent')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shadow-2xs ${
              filterType === 'recent'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            최근 소통 ({recentPeople.length})
          </button>
          <button
            onClick={() => handleFilterChange('stale')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shadow-2xs ${
              filterType === 'stale'
                ? 'bg-rose-600 text-white'
                : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            소통 환기 ({stalePeople.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* 검색 바 */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="이름, 회사, 전문분야 검색..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
            />
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>리스트</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'card'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>카드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. 인맥 소통 타임라인 (리스트 뷰 vs 카드 뷰) */}
      <div className="space-y-3">
        {filteredPeople.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/90 text-slate-500 text-xs shadow-2xs">
            해당 조건에 부합하는 인맥이 없습니다.
          </div>
        ) : viewMode === 'table' ? (
          /* 리스트(고밀도 테이블) 뷰 */
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5">인재 성명 / 기업</th>
                    <th className="py-2.5 px-3">직함</th>
                    <th className="py-2.5 px-3">전문 도메인</th>
                    <th className="py-2.5 px-3">마지막 소통일</th>
                    <th className="py-2.5 px-3">소통 상태</th>
                    <th className="py-2.5 px-3 text-right">전략 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPeople.map((person) => (
                    <tr key={person.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* 1. Name & Company */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div 
                          onClick={() => onSelectPerson(person)}
                          className="cursor-pointer group flex items-center gap-1.5"
                        >
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {person.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({person.currentCompany})
                          </span>
                        </div>
                      </td>

                      {/* 2. Title */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {person.currentTitle}
                      </td>

                      {/* 3. Domain */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        {person.primaryDomain}
                      </td>

                      {/* 4. Last Contact Date */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        {person.lastContactDate || '기록 없음'}
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                          person.isStale
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {person.isStale ? '180일+ 미소통' : '소통 유지'}
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onOpenDossier(person)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-300" />
                            <span>미팅 전략</span>
                          </button>
                          <button
                            onClick={() => onSelectPerson(person)}
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            상세
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 카드 뷰 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div 
                        onClick={() => onSelectPerson(person)}
                        className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                      >
                        {person.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {person.currentCompany} · {person.currentTitle}
                      </div>
                    </div>

                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                      person.isStale
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {person.isStale ? '180일+ 미소통' : '소통 유지'}
                    </span>
                  </div>

                  {/* 메모 미리보기 (1-Line 다이어트) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 truncate">
                    {person.memo ? person.memo : <span className="text-slate-400 italic">기록된 메모 없음</span>}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>마지막 소통: {person.lastContactDate || '기록 없음'}</span>
                    <span>{person.primaryDomain}</span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onOpenDossier(person)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>미팅 전략 브리핑</span>
                  </button>

                  <button
                    onClick={() => onSelectPerson(person)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
                  >
                    상세
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
