import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  getGeoClusterBreakdown, 
  GeoClusterId 
} from '../../services/geoProximityService';
import { 
  MapPin, Coffee, ShieldCheck, 
  Check, Compass, Users, Building2, ChevronRight
} from 'lucide-react';

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

  // 티타임 제안 카톡 문구 복사
  const handleCopyTeaInvite = (person: Person, clusterName: string) => {
    const inviteMessage = `안녕하세요 ${person.name} ${person.currentTitle}님! 
오늘 제가 ${clusterName} 쪽에 미팅 일정이 있어 나와있는데, 혹시 오후에 가볍게 15~20분 정도 커피 한 잔 하실 수 있는 여유가 되실까요? 
최근 소식도 나누고 안부도 전하고 싶습니다. 부담 없이 편하실 때 말씀해 주세요! ☕`;

    navigator.clipboard.writeText(inviteMessage).then(() => {
      setCopiedPersonId(person.id);
      onShowToast(`[${person.name}] 님께 보낼 티타임 제안 문구가 복사되었습니다.`);
      setTimeout(() => setCopiedPersonId(null), 2500);
    }).catch(() => {
      onShowToast('클립보드 복사에 실패했습니다.');
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header & Radar Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative p-3 rounded-2xl bg-sky-950/80 border border-sky-500/40 text-sky-400 shrink-0">
            <Compass className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">전국 6대 비즈니스 거점별 인맥 레이더</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold font-mono">
                Geo Radar Proximity
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              내가 현재 위치한 업무 지구 또는 출장 거점을 선택하면, 반경 내에 상주하는 핵심 인맥과 DART 공시 임원을 즉시 감지하여 당일 번개 티타임을 성사시킵니다.
            </p>
          </div>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400">등록 인맥 거점 분포</div>
            <div className="text-sm font-bold text-sky-400 font-mono">총 {people.length}명 매핑</div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400">DART 공시 임원</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {people.filter(p => p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector).length}명
            </div>
          </div>
        </div>
      </div>

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
                  ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-950/50 scale-[1.02]'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>{cluster.shortName}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {cluster.badge}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[11px]">
                <div className="flex items-center gap-1 text-slate-300 font-mono">
                  <Users className="w-3 h-3 text-sky-400" />
                  <span>{cPeople.length}명</span>
                </div>
                {dartExecutiveCount > 0 && (
                  <div className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-mono">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{dartExecutiveCount}</span>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-sky-400 rounded-bl" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Selected Cluster Spotlight & People List */}
      <div className="space-y-4">
        {/* Spotlight Banner */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-400" />
                {activeClusterMatch.cluster.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                반경 내 {activeClusterMatch.people.length}명 근무 중
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activeClusterMatch.cluster.description}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 shrink-0">
            <span className="text-slate-400">주요 앵커 기업:</span>
            <div className="flex flex-wrap gap-1">
              {activeClusterMatch.cluster.keyCompanies.slice(0, 4).map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {activeClusterMatch.people.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-300">
              해당 거점에 배정된 인맥이 아직 없습니다.
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              새로운 인맥을 추가하거나 DART 공시 임원을 연동하면 소속 회사 및 근무 거점에 맞춰 자동으로 레이더에 탐지됩니다.
            </p>
          </div>
        ) : (
          /* People Grid in Cluster */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeClusterMatch.people.map(person => {
              const isDart = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;
              const isCopied = copiedPersonId === person.id;

              return (
                <div
                  key={person.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
                >
                  <div className="space-y-2.5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                            {person.name}
                          </span>
                          {isDart && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              공시임원
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {person.closeness === 1 ? '1촌' : person.closeness === 2 ? '2촌' : '3촌'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{person.currentCompany}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-sky-400">{person.currentTitle}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectPerson(person)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="프로필 상세 열기"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Memo or Tags snippet */}
                    {person.memo && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/50">
                        {person.memo}
                      </p>
                    )}

                    {/* Skills */}
                    {person.skills && person.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {person.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                            #{skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyTeaInvite(person, activeClusterMatch.cluster.shortName)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 hover:border-sky-400 active:scale-95'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>카톡 초대장 복사 완료!</span>
                        </>
                      ) : (
                        <>
                          <Coffee className="w-3.5 h-3.5 text-sky-400" />
                          <span>☕ 오늘 티타임 제안</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onSelectPerson(person)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors shrink-0"
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
