import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  getGeoClusterBreakdown, 
  GeoClusterId 
} from '../../services/geoProximityService';
import { 
  MapPin, Coffee, ShieldCheck, 
  Check, Compass, Users, Building2, ArrowRight,
  Rocket, Cpu, Sparkles, Briefcase, List, LayoutGrid
} from 'lucide-react';
import { identifyTalentCluster } from '../../services/talentClusterEngine';
import { ViewHeader } from '../ui';

interface GeoProximityRadarViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const GeoProximityRadarView: React.FC<GeoProximityRadarViewProps> = ({
  people,
  onSelectPerson,
  onShowToast
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<GeoClusterId>('gangnam_teheran');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);

  // 6대 거점 통계 산출
  const clusterData = useMemo(() => {
    return getGeoClusterBreakdown(people);
  }, [people]);

  // 현재 선택된 거점 데이터
  const activeClusterMatch = useMemo(() => {
    return clusterData.find(c => c.cluster.id === selectedClusterId) || clusterData[0];
  }, [clusterData, selectedClusterId]);

  // 티타임 제안 카톡 문구 복사 (5대 인재 클러스터 맞춤형 지능 연계)
  const handleCopyTeaInvite = (person: Person, clusterName: string) => {
    const cluster = identifyTalentCluster(person);
    let contextualNote = '바쁘실 텐데 부담 없이 편하실 때 말씀해 주시면 감사하겠습니다!';

    if (cluster.id === 'VENTURE_LEADER') {
      contextualNote = `${person.currentCompany}의 역동적인 사업 행보와 빠른 실행력 늘 인상 깊게 지켜보고 있습니다. 편하실 때 시너지 나눌 수 있는 포인트 가볍게 이야기 나누고 싶습니다!`;
    } else if (cluster.id === 'TECH_FELLOW') {
      contextualNote = `${person.currentCompany}에서 이끄시는 기술 아키텍처와 엔지니어링 성과 늘 깊이 접하고 있습니다. 연구에 지장 없으시도록 15분 내외로 차 한 잔 나누며 고견 여쭙고자 합니다.`;
    } else if (cluster.id === 'INVESTOR_PARTNER') {
      contextualNote = `시장 거시 동향과 투자 인사이트 늘 귀감으로 삼고 있습니다. 편하신 시간에 가볍게 커피 한 잔 모시며 시장 이야기 나누고 싶습니다!`;
    } else if (cluster.id === 'LISTED_EXECUTIVE') {
      contextualNote = `투명한 공적 거버넌스와 조직을 모범적으로 이끌어주시는 모습 늘 존경하며, 공무 일정 중 여유가 되실 때 정중히 차 한 잔 모실 수 있다면 큰 영광이겠습니다.`;
    } else if (cluster.id === 'CORE_SPECIALIST') {
      contextualNote = `현장에서 최고의 완성도로 프로덕트를 구축하시는 전문성 늘 감탄하며 보고 있습니다. 부담 없이 편한 시간에 캐주얼하게 커피챗 한번 나누고 싶습니다 :)`;
    }

    const inviteMessage = `안녕하세요 ${person.name} ${person.currentTitle}님! 
이번 주 ${clusterName} 인근에서 업무 일정이 예정되어 있어 인사드립니다.
${contextualNote}
일정 중 편하신 날짜나 시간을 말씀해 주시면 맞추어 찾아뵙겠습니다. 감사합니다!`;

    navigator.clipboard.writeText(inviteMessage).then(() => {
      setCopiedPersonId(person.id);
      onShowToast(`[${person.name}] 님 맞춤형 티타임 제안 문구가 복사되었습니다.`);
      setTimeout(() => setCopiedPersonId(null), 2500);
    }).catch(() => {
      onShowToast('클립보드 복사에 실패했습니다.');
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Standardized Header */}
      <ViewHeader
        icon={Compass}
        title="전국 6대 비즈니스 거점별 인맥 레이더"
        subtitle="방문 예정이거나 상주하는 거점을 선택하여, 인근의 소중한 인맥과 여유로운 티타임 일정을 정중히 조율하세요."
        englishTag="Geo Radar Proximity"
        actions={
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0 font-mono">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-medium">등록 인맥 거점 분포</div>
              <div className="text-xs font-bold text-blue-700">총 {people.length}명 매핑</div>
            </div>
            <div className="h-6 w-[1px] bg-slate-200" />
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-medium">DART 공시 임원</div>
              <div className="text-xs font-bold text-emerald-700">
                {people.filter(p => p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector).length}명
              </div>
            </div>
          </div>
        }
      />

      {/* 2. Cluster Selection Chips */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {clusterData.map(({ cluster, people: cPeople, dartExecutiveCount }) => {
          const isSelected = cluster.id === selectedClusterId;

          return (
            <button
              key={cluster.id}
              onClick={() => setSelectedClusterId(cluster.id)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/80 border-2 border-blue-600 shadow-sm shadow-blue-100/50 scale-[1.01]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
              }`}
            >
              <div>
                <div className={`text-xs font-bold truncate flex items-center gap-1 ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                  <span>{cluster.shortName}</span>
                </div>
                <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-blue-700 font-medium' : 'text-slate-500'}`}>
                  {cluster.badge}
                </div>
              </div>

              <div className={`flex items-center justify-between mt-3 pt-2 border-t text-[11px] ${isSelected ? 'border-blue-200' : 'border-slate-100'}`}>
                <div className={`flex items-center gap-1 font-mono font-medium ${isSelected ? 'text-blue-900' : 'text-slate-600'}`}>
                  <Users className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{cPeople.length}명</span>
                </div>
                {dartExecutiveCount > 0 && (
                  <div className="flex items-center gap-0.5 text-emerald-700 text-[11px] font-mono font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dartExecutiveCount}</span>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-bl" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Selected Cluster Spotlight & People List */}
      <div className="space-y-4">
        {/* Spotlight Banner with View Switcher */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                {activeClusterMatch.cluster.name}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-medium">
                반경 내 {activeClusterMatch.people.length}명 근무 중
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {activeClusterMatch.cluster.description}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden md:flex items-center gap-1 text-xs text-slate-600 shrink-0 mr-2">
              <span className="text-slate-500 font-medium">주요 기업:</span>
              <div className="flex flex-wrap gap-1">
                {activeClusterMatch.cluster.keyCompanies.slice(0, 3).map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px] font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* View Mode Switcher */}
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

        {/* Empty State */}
        {activeClusterMatch.people.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200 space-y-3">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center shadow-xs">
              <MapPin className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-700">
              해당 거점에 배정된 인맥이 아직 없습니다.
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              새로운 인맥을 추가하거나 DART 공시 임원을 연동하면 소속 회사 및 근무 거점에 맞춰 자동으로 레이더에 탐지됩니다.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* High-Density Executive Table Mode */
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5">성명 / 직함</th>
                    <th className="py-2.5 px-3">소속 기업 & 부서</th>
                    <th className="py-2.5 px-3">클러스터</th>
                    <th className="py-2.5 px-3">경력 단계</th>
                    <th className="py-2.5 px-3">촌수</th>
                    <th className="py-2.5 px-3">티타임 조율</th>
                    <th className="py-2.5 px-3 text-right">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeClusterMatch.people.map(person => {
                    const cluster = identifyTalentCluster(person);
                    const isCopied = copiedPersonId === person.id;

                    return (
                      <tr
                        key={person.id}
                        onClick={() => onSelectPerson(person)}
                        className="hover:bg-slate-50/90 cursor-pointer transition-colors group"
                      >
                        {/* 1. Name & Title */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                              {person.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {person.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {person.currentTitle}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Company & Department */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800 truncate max-w-[150px]">
                            {person.currentCompany}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {person.currentDepartment || '본사'}
                          </div>
                        </td>

                        {/* 3. Talent Cluster */}
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

                        {/* 4. Seniority */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                            {cluster.seniorityLevel}
                          </span>
                        </td>

                        {/* 5. Closeness */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium">
                            {person.closeness === 1 ? '1촌' : person.closeness === 2 ? '2촌' : '3촌'}
                          </span>
                        </td>

                        {/* 6. 1-Click Tea Invite */}
                        <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleCopyTeaInvite(person, activeClusterMatch.cluster.shortName)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80'
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                            <span>{isCopied ? '복사됨' : '티타임 제안'}</span>
                          </button>
                        </td>

                        {/* 7. Action Button */}
                        <td className="py-3 px-3 whitespace-nowrap text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 group-hover:text-slate-900 transition-colors"
                          >
                            프로필 <ArrowRight className="w-3 h-3" />
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
          /* Clean Compact Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeClusterMatch.people.map(person => {
              const cluster = identifyTalentCluster(person);
              const isCopied = copiedPersonId === person.id;

              return (
                <div
                  key={person.id}
                  onClick={() => onSelectPerson(person)}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group shadow-2xs cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
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
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium">
                            {person.closeness === 1 ? '1촌' : person.closeness === 2 ? '2촌' : '3촌'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{person.currentCompany}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-blue-700 font-semibold truncate max-w-[110px]">{person.currentTitle}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopyTeaInvite(person, activeClusterMatch.cluster.shortName)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isCopied
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{isCopied ? '초대장 복사됨' : '티타임 제안'}</span>
                    </button>

                    <button
                      onClick={() => onSelectPerson(person)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                    >
                      상세 보기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
