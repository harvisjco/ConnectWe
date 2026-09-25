import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  getGeoClusterBreakdown, 
  GeoClusterId 
} from '../../services/geoProximityService';
import { 
  MapPin, Coffee, ShieldCheck, 
  Check, Compass, Users, Building2, ChevronRight,
  Rocket, Cpu, Sparkles, Briefcase
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
        subtitle="현재 방문 예정이거나 상주하는 비즈니스 거점을 선택하여, 인근에 위치한 소중한 인맥을 확인하고 여유로운 티타임 일정을 정중하게 제안해보세요."
        englishTag="Geo Radar Proximity"
        actions={
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 font-mono">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">등록 인맥 거점 분포</div>
              <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400">총 {people.length}명 매핑</div>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">DART 공시 임원</div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
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
                  ? 'bg-indigo-50/80 border-2 border-indigo-600 shadow-sm shadow-indigo-100/50 scale-[1.01]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
              }`}
            >
              <div>
                <div className={`text-xs font-bold truncate flex items-center gap-1 ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                  <span>{cluster.shortName}</span>
                </div>
                <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-indigo-700 font-medium' : 'text-slate-500'}`}>
                  {cluster.badge}
                </div>
              </div>

              <div className={`flex items-center justify-between mt-3 pt-2 border-t text-[11px] ${isSelected ? 'border-indigo-200' : 'border-slate-100'}`}>
                <div className={`flex items-center gap-1 font-mono font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                  <Users className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
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
                <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-600 rounded-bl" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Selected Cluster Spotlight & People List */}
      <div className="space-y-4">
        {/* Spotlight Banner */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                {activeClusterMatch.cluster.name}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-medium">
                반경 내 {activeClusterMatch.people.length}명 근무 중
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {activeClusterMatch.cluster.description}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
            <span className="text-slate-500 font-medium">주요 앵커 기업:</span>
            <div className="flex flex-wrap gap-1">
              {activeClusterMatch.cluster.keyCompanies.slice(0, 4).map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px] font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {activeClusterMatch.people.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 space-y-3">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">
              해당 거점에 배정된 인맥이 아직 없습니다.
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              새로운 인맥을 추가하거나 DART 공시 임원을 연동하면 소속 회사 및 근무 거점에 맞춰 자동으로 레이더에 탐지됩니다.
            </p>
          </div>
        ) : (
          /* People Grid in Cluster */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeClusterMatch.people.map(person => {
              const cluster = identifyTalentCluster(person);
              const isCopied = copiedPersonId === person.id;

              return (
                <div
                  key={person.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between group shadow-2xs"
                >
                  <div className="space-y-2.5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
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
                          <span className="text-indigo-600 font-semibold truncate max-w-[110px]">{person.currentTitle}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 font-mono text-[11px] truncate max-w-[120px]">{cluster.seniorityLevel}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectPerson(person)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                        title="프로필 상세 열기"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Memo or Tags snippet */}
                    {person.memo && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {person.memo}
                      </p>
                    )}

                    {/* Skills */}
                    {person.skills && person.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {person.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span key={idx} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60 font-medium">
                            #{skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyTeaInvite(person, activeClusterMatch.cluster.shortName)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[36px] active:scale-[0.98] ${
                        isCopied
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>초대장 복사 완료</span>
                        </>
                      ) : (
                        <>
                          <Coffee className="w-3.5 h-3.5 text-indigo-600" />
                          <span>정중한 티타임 제안</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onSelectPerson(person)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-all shrink-0 min-h-[36px] shadow-2xs active:scale-[0.98]"
                    >
                      인맥 상세
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
