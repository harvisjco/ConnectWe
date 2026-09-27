import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  GEO_CLUSTERS, 
  GeoClusterId, 
  getProximityTeaBundles, 
  generateProximityTeaCopy, 
  ProximityTeaType 
} from '../../services/geoProximityService';
import { 
  X, Compass, MapPin, Coffee, Utensils, Sparkles, 
  Copy, Check, Clock, ShieldCheck, ChevronRight, Users, Briefcase
} from 'lucide-react';

interface ProximityTeaBundleModalProps {
  people: Person[];
  initialClusterId?: GeoClusterId;
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onNavigateToProximityMap?: (clusterId: GeoClusterId) => void;
  onShowToast: (msg: string) => void;
}

export const ProximityTeaBundleModal: React.FC<ProximityTeaBundleModalProps> = ({
  people,
  initialClusterId = 'seongsu',
  onClose,
  onSelectPerson,
  onNavigateToProximityMap,
  onShowToast
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<GeoClusterId>(initialClusterId);
  const [selectedTeaType, setSelectedTeaType] = useState<ProximityTeaType>('CASUAL_TEA');
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);

  // 현재 거점의 번들 인연 산출
  const bundleResult = useMemo(() => {
    return getProximityTeaBundles(people, selectedClusterId);
  }, [people, selectedClusterId]);

  const handleCopyCopy = (person: Person) => {
    const text = generateProximityTeaCopy(person, bundleResult.cluster, selectedTeaType);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPersonId(person.id);
      onShowToast(`[${person.name}] 님 맞춤형 외근 티타임 제안문이 복사되었습니다.`);
      setTimeout(() => setCopiedPersonId(null), 2500);
    }).catch(() => {
      onShowToast('클립보드 복사에 실패했습니다.');
    });
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 shadow-2xs">
              <Compass className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">거점 외근 동선 지능형 티타임 번들러</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                  Smart Bundler
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                외근 방문 거점을 선택하면, 동선 상에서 함께 인사드릴 수 있는 최적의 인연 2~3명을 자동 번들링합니다.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7대 거점 탭 (가로 스크롤) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            방문 거점
          </span>
          {GEO_CLUSTERS.map(c => {
            const isSelected = c.id === selectedClusterId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClusterId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                <span>{c.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Cluster Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{bundleResult.cluster.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {bundleResult.cluster.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                {bundleResult.cluster.description}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-medium">상주 인맥</div>
                <div className="text-xs font-bold text-slate-800 font-mono">총 {bundleResult.totalInCluster}명</div>
              </div>
            </div>
          </div>

          {/* 제안 톤 선택 탭 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>동선 추천 인연 번들 (상위 3명 선별)</span>
            </span>

            {/* 3대 티타임 톤 스위처 */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
              <button
                onClick={() => setSelectedTeaType('CASUAL_TEA')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedTeaType === 'CASUAL_TEA'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>15분 차 한 잔</span>
              </button>
              <button
                onClick={() => setSelectedTeaType('LUNCH_MEETING')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedTeaType === 'LUNCH_MEETING'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Utensils className="w-3.5 h-3.5 text-blue-600" />
                <span>점심 식사</span>
              </button>
              <button
                onClick={() => setSelectedTeaType('SYNERGY_TOUCH')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedTeaType === 'SYNERGY_TOUCH'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>사업 시너지</span>
              </button>
            </div>
          </div>

          {/* 인연 번들 카드 목록 */}
          {bundleResult.bundleItems.length > 0 ? (
            <div className="space-y-3">
              {bundleResult.bundleItems.map(({ person, daysSinceContact, recommendScore, matchReasons }) => {
                const isCopied = copiedPersonId === person.id;
                const draft = generateProximityTeaCopy(person, bundleResult.cluster, selectedTeaType);

                return (
                  <div 
                    key={person.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div 
                        onClick={() => onSelectPerson(person)}
                        className="cursor-pointer group min-w-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {person.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {person.currentTitle}
                          </span>
                          {person.sourceType === 'DART_FACT' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              공시 임원
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">
                          {person.currentCompany}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold flex items-center gap-1 ${
                          daysSinceContact >= 180 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : daysSinceContact >= 60
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{daysSinceContact}일 전 교류</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          추천 {recommendScore}점
                        </span>
                      </div>
                    </div>

                    {/* 추천 이유 뱃지들 */}
                    <div className="flex flex-wrap gap-1.5">
                      {matchReasons.map((r, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70"
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    {/* 메시지 미리보기 박스 & 복사 버튼 */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                      <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line line-clamp-3">
                        {draft}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          {selectedTeaType === 'CASUAL_TEA' ? '15분 차 한 잔 권유' : selectedTeaType === 'LUNCH_MEETING' ? '점심 식사 일정 조율' : '비즈니스 시너지 탐색'}
                        </span>
                        <button
                          onClick={() => handleCopyCopy(person)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>복사 완료!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>1-Click 카피 복사</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-xs font-bold text-slate-700">해당 거점에 등록된 인맥이 없습니다.</div>
              <p className="text-[11px] text-slate-400">
                명함을 스캔하거나 주소록에 인맥을 등록하면 거점별로 지능형 자동 매핑됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="text-xs text-slate-500">
            외근 1회 이동 시 평균 2~3명의 관계를 복원하여 네트워킹 시간을 70% 절약합니다.
          </div>
          {onNavigateToProximityMap && (
            <button
              onClick={() => {
                onNavigateToProximityMap(selectedClusterId);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold transition-all flex items-center gap-1 active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              <span>거점 레이더 지도 전체보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
