import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { PrivateSalonSession } from '../../types/salon';
import { 
  GEO_CLUSTERS, 
  GeoClusterId 
} from '../../services/geoProximityService';
import { 
  getRecommendedSalonGuests, 
  generateSalonInvitation, 
  generateSalonBriefing,
  loadSalonSessions,
  saveSalonSessions
} from '../../services/salonService';
import { identifyTalentCluster } from '../../services/talentClusterEngine';
import { 
  X, Coffee, Sparkles, Copy, Check, 
  Printer, Shield, ChevronRight, Mic
} from 'lucide-react';

interface PrivateSalonModalProps {
  people: Person[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onOpenDebrief?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const PrivateSalonModal: React.FC<PrivateSalonModalProps> = ({
  people,
  onClose,
  onSelectPerson,
  onOpenDebrief,
  onShowToast
}) => {
  const [sessions, setSessions] = useState<PrivateSalonSession[]>(() => loadSalonSessions());
  const [activeSessionId] = useState<string>(sessions[0]?.id || 'new');
  const [activeTab, setActiveTab] = useState<'plan' | 'invite' | 'brief'>('plan');
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0];
  }, [sessions, activeSessionId]);

  // 추천 게스트 목록 (해당 거점 및 인재 클러스터 기반)
  const recommendedGuests = useMemo(() => {
    if (!activeSession) return [];
    return getRecommendedSalonGuests(
      people, 
      activeSession.clusterId, 
      activeSession.targetTalentClusterIds
    );
  }, [people, activeSession]);

  // 초대 대상 게스트 객체 목록
  const curatedGuests = useMemo(() => {
    if (!activeSession) return [];
    return people.filter(p => activeSession.curatedGuestIds.includes(p.id));
  }, [people, activeSession]);

  // 세션 정보 갱신 핸들러
  const handleUpdateSession = (updates: Partial<PrivateSalonSession>) => {
    const updated = sessions.map(s => s.id === activeSession.id ? { ...s, ...updates } : s);
    setSessions(updated);
    saveSalonSessions(updated);
  };

  // 게스트 초대 토글
  const handleToggleGuest = (guestId: string) => {
    const current = activeSession.curatedGuestIds;
    const next = current.includes(guestId) 
      ? current.filter(id => id !== guestId) 
      : [...current, guestId];
    handleUpdateSession({ curatedGuestIds: next });
  };

  // 초대장 카피 복사
  const handleCopyInvite = (guest: Person) => {
    const text = generateSalonInvitation(activeSession, guest);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedGuestId(guest.id);
      onShowToast(`[${guest.name}] 님께 보낼 티 살롱 초대장이 복사되었습니다.`);
      setTimeout(() => setCopiedGuestId(null), 2500);
    });
  };

  // 1-Page 통합 브리프 인쇄
  const handlePrintBrief = () => {
    window.print();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shadow-2xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  프라이빗 살롱 & 티타임 호스팅 룸
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-800 border border-amber-200">
                  신뢰 네트워크 확장
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                7대 거점과 지적 화두를 중심으로 격조 높은 소모임을 기획하고 자연스러운 인연을 형성합니다.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Nav Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'plan'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              1. 모임 기획 & 게스트 큐레이션
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'invite'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              2. 품격 초대장 발송 ({curatedGuests.length}명)
            </button>
            <button
              onClick={() => setActiveTab('brief')}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'brief'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3. 당일 1-Page 통합 브리프
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Chatham House Rule 적용
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'plan' && (
            <div className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">모임 타이틀</label>
                  <input 
                    type="text"
                    value={activeSession.title}
                    onChange={(e) => handleUpdateSession({ title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="예: 성수 AI 빌더스 프라이빗 티 살롱"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">거점 권역 선택</label>
                  <select
                    value={activeSession.clusterId}
                    onChange={(e) => handleUpdateSession({ clusterId: e.target.value as GeoClusterId })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {GEO_CLUSTERS.map(c => (
                      <option key={c.id} value={c.id}>{c.shortName} ({c.badge})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">일시 및 시간대</label>
                  <input 
                    type="text"
                    value={activeSession.scheduledAt}
                    onChange={(e) => handleUpdateSession({ scheduledAt: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="예: 2026-10-16(금) 오전 08:30 ~ 09:40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">미팅 장소 (조용한 티하우스/라운지)</label>
                  <input 
                    type="text"
                    value={activeSession.locationName}
                    onChange={(e) => handleUpdateSession({ locationName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="예: 성수 코사이어티 1층 프라이빗 라운지"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">메인 대화 주제 (지적 화두)</label>
                  <input 
                    type="text"
                    value={activeSession.topic}
                    onChange={(e) => handleUpdateSession({ topic: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="예: 생성형 AI 에이전트 현업 실전 적용기와 한계"
                  />
                </div>
              </div>

              {/* Guest Curation Recommendations */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">
                      ConnectWe 추천 키맨 게스트 ({recommendedGuests.length}명)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    선택된 게스트: <strong className="text-blue-700">{activeSession.curatedGuestIds.length}명</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {recommendedGuests.map(guest => {
                    const isSelected = activeSession.curatedGuestIds.includes(guest.id);
                    const cluster = identifyTalentCluster(guest);

                    return (
                      <div
                        key={guest.id}
                        onClick={() => handleToggleGuest(guest.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">{guest.name}</span>
                              <span className="text-[10px] text-slate-500">{guest.currentTitle}</span>
                              {guest.dartInfo && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  DART 공시
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {guest.currentCompany} • {cluster.label}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPerson(guest);
                          }}
                          className="px-2 py-1 text-[10px] text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg shrink-0"
                        >
                          프로필
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed flex items-center justify-between">
                <div>
                  <strong>초대장 안내:</strong> 선택하신 {curatedGuests.length}명의 게스트별 맞춤 초대장입니다. 클릭 한 번으로 복사하여 카카오톡이나 문자 메시지로 전송하세요.
                </div>
              </div>

              <div className="space-y-3">
                {curatedGuests.map(guest => {
                  const isCopied = copiedGuestId === guest.id;
                  const inviteText = generateSalonInvitation(activeSession, guest);

                  return (
                    <div key={guest.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{guest.name} {guest.currentTitle}</span>
                          <span className="text-[11px] text-slate-500">({guest.currentCompany})</span>
                        </div>
                        <button
                          onClick={() => handleCopyInvite(guest)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {isCopied ? '복사 완료' : '초대장 복사'}
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {inviteText}
                      </pre>
                    </div>
                  );
                })}

                {curatedGuests.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400">
                    아직 초대할 게스트가 선택되지 않았습니다. [1. 모임 기획] 탭에서 게스트를 체크해 주세요.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'brief' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  모임 당일 참석자 전원의 DART 실명 팩트와 경력, 공통 화두를 한눈에 숙지하고 인쇄할 수 있습니다.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintBrief}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    A4 1-Page 인쇄
                  </button>
                  {onOpenDebrief && curatedGuests[0] && (
                    <button
                      onClick={() => onOpenDebrief(curatedGuests[0])}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      모임 1분 회고
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-slate-800">
                {generateSalonBriefing(activeSession, curatedGuests)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeSession.status === 'PLANNED' ? '진행 예정 살롱' : '완료된 살롱'} • 거점: {activeSession.clusterId}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              닫기
            </button>
            {activeTab !== 'brief' ? (
              <button
                onClick={() => setActiveTab(activeTab === 'plan' ? 'invite' : 'brief')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs flex items-center gap-1 transition-all"
              >
                다음 단계 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
              >
                기획 완료
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
