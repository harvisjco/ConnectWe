import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import {
  ShieldAlert,
  Users,
  Wifi,
  WifiOff,
  BellRing,
  X,
  Check,
  Copy,
  Building2,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileText,
  AlertTriangle,
  RotateCw,
  Award,
  Download
} from 'lucide-react';
import {
  getOutsideDirectorMandates,
  getProxyVotingAgendaItems,
  getEquityHoldingChangeAlerts,
  getExecutiveTalentPool,
  getOfflineSyncStatus,
  triggerReconciliation,
  generateMeetingReminderBrief,
  getSavedFollowUps,
  toggleCommitmentComplete
} from '../../services/meetingGuardGovernanceService';
import {
  OutsideDirectorMandate,
  ProxyVotingAgendaItem,
  EquityHoldingChangeAlert,
  ExecutiveTalentCandidate,
  ExecutiveTalentTrack,
  MeetingFollowUpBrief,
  OfflineSyncStatus
} from '../../types/meetingGuardGovernance';

export interface MeetingGuardGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'governance' | 'talent' | 'offline' | 'followup';
  people: Person[];
  selectedPerson?: Person | null;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const MeetingGuardGovernanceModal: React.FC<MeetingGuardGovernanceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'governance',
  people,
  selectedPerson,
  onSelectPerson: _onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'governance' | 'talent' | 'offline' | 'followup'>(initialTab);

  // 1. 거버넌스 탭 상태
  const mandates: OutsideDirectorMandate[] = useMemo(() => getOutsideDirectorMandates(people), [people]);
  const agendas: ProxyVotingAgendaItem[] = useMemo(() => getProxyVotingAgendaItems(), []);
  const equityAlerts: EquityHoldingChangeAlert[] = useMemo(() => getEquityHoldingChangeAlerts(), []);

  // 2. 핵심 인재 큐레이터 탭 상태
  const [selectedTrack, setSelectedTrack] = useState<ExecutiveTalentTrack | 'ALL'>('ALL');
  const talentPool: ExecutiveTalentCandidate[] = useMemo(() => getExecutiveTalentPool(people), [people]);
  const filteredTalent = useMemo(() => {
    if (selectedTrack === 'ALL') return talentPool;
    return talentPool.filter((t) => t.targetTrack === selectedTrack);
  }, [talentPool, selectedTrack]);
  const [copiedInviteIdx, setCopiedInviteIdx] = useState<number | null>(null);

  // 3. 오프라인 CRDT 탭 상태
  const [syncStatus, setSyncStatus] = useState<OfflineSyncStatus>(() => getOfflineSyncStatus(people.length));
  const [isSyncing, setIsSyncing] = useState(false);

  // 4. 미팅 가드 & 팔로업 탭 상태
  const targetFollowUpPerson = useMemo(() => {
    return selectedPerson || people[0] || {
      id: 'p-001',
      name: '김민준',
      currentCompany: '카카오모빌리티',
      currentTitle: '최고기술책임자',
    } as unknown as Person;
  }, [selectedPerson, people]);

  const reminderBrief = useMemo(() => {
    return generateMeetingReminderBrief(targetFollowUpPerson, '내일 오후 3:00', '조선 팰리스 1914 라운지');
  }, [targetFollowUpPerson]);

  const [followUps, setFollowUps] = useState<MeetingFollowUpBrief[]>(() => getSavedFollowUps());
  const [copiedReminderKey, setCopiedReminderKey] = useState<'24h' | '2h' | 'thanks' | null>(null);

  // 탭 변경 동기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // ------------------------------------------
  // 핸들러
  // ------------------------------------------

  // 비공개 초대장 복사
  const handleCopyInvite = (invite: string, idx: number) => {
    navigator.clipboard.writeText(invite);
    setCopiedInviteIdx(idx);
    onShowToast('비공개 핵심 인재 티타임 초대 서신이 복사되었습니다.');
    setTimeout(() => setCopiedInviteIdx(null), 2500);
  };

  // 오프라인 수동 화해(CRDT 동기화)
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const res = triggerReconciliation();
      setSyncStatus(getOfflineSyncStatus(people.length));
      setIsSyncing(false);
      onShowToast(`양방향 CRDT 동기화 완료: ${res.reconciledCount}개 레코드가 안전하게 병합되었습니다.`);
    }, 600);
  };

  // 리마인더/감사 서신 복사
  const handleCopyBriefText = (text: string, key: '24h' | '2h' | 'thanks') => {
    navigator.clipboard.writeText(text);
    setCopiedReminderKey(key);
    onShowToast('서신 템플릿이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedReminderKey(null), 2500);
  };

  // 약속 이행 토글
  const handleToggleCommitment = (followUpId: string, commitmentId: string) => {
    const updated = toggleCommitmentComplete(followUpId, commitmentId);
    setFollowUps(updated);
    onShowToast('약속 이행 체크리스트 상태가 업데이트되었습니다.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      data-testid="meeting-guard-governance-modal"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col overflow-hidden">
        
        {/* 상단 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  C-Level 거버넌스 & 미팅 가드 스튜디오
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  Governance & Guard
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                사외이사 겸직 규제·주총 의결권 시뮬레이션, 핵심 인재 승계 풀, 오프라인 무손실 CRDT 및 미팅 3분 사후 팔로업
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="닫기"
            data-testid="close-governance-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('governance')}
            data-testid="tab-governance"
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'governance'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>이사회 거버넌스 & 주총 의결권</span>
          </button>
          <button
            onClick={() => setActiveTab('talent')}
            data-testid="tab-talent"
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'talent'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>핵심 인재 스카우팅 & 탤런트 풀</span>
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            data-testid="tab-offline"
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'offline'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>초고속 오프라인 & CRDT 볼트</span>
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            data-testid="tab-followup"
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'followup'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>미팅 가드 & 3분 팔로업</span>
          </button>
        </div>

        {/* 탭 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          
          {/* TAB 1: 이사회 거버넌스 & 주총 의결권 인텔리전스 */}
          {activeTab === 'governance' && (
            <div className="space-y-6 animate-fade-in" data-testid="governance-tab-content">
              {/* 사외이사 겸직 규제 한도 검증 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    사외이사 겸직 현황 & 상법 규제 사전 검증 (상법 제34조)
                  </h3>
                  <span className="text-xs text-slate-500">상장사 2개사 초과 재직 시 사전 경보</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mandates.map((m, idx) => {
                    const isViolation = m.regulatoryLimitStatus === 'VIOLATION_OVER_LIMIT';
                    const isWarning = m.regulatoryLimitStatus === 'WARNING_MAX_LIMIT';
                    return (
                      <div
                        key={m.personId || idx}
                        className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between ${
                          isViolation
                            ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/20'
                            : isWarning
                            ? 'border-amber-300 dark:border-amber-800/60'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                        data-testid={`mandate-card-${idx}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {m.personName} ({m.currentCompany})
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                                isViolation
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                              }`}
                            >
                              {isViolation ? '⚠️ 2개사 초과 위반' : isWarning ? '한도 도달 (2개사)' : '규제 준수 (적정)'}
                            </span>
                          </div>

                          <div className="space-y-1.5 my-2.5">
                            {m.activeDirectorships.map((d, dIdx) => (
                              <div
                                key={dIdx}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {d.corpName}
                                  </span>
                                  <span className="text-slate-400 ml-1.5">({d.role})</span>
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  {d.isListed ? '상장사' : '비상장사'} · ~{d.termEndDate}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {m.conflictRiskNote}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 주총 시즌 3대 안건 시뮬레이터 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    정기 주주총회 주요 의안 팩트체크 & 의결권 권고 브리프
                  </h3>
                  <span className="text-xs text-slate-500">DART 공시 기반 3대 핵심 의안</span>
                </div>

                <div className="space-y-3">
                  {agendas.map((agenda) => (
                    <div
                      key={agenda.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {agenda.corpName} ({agenda.stockCode})
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {agenda.agendaTitle}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong>핵심 쟁점:</strong> {agenda.keyIssues}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          근거: {agenda.rationaleSummary}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 ${
                            agenda.governanceRecommendation === 'APPROVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                          }`}
                        >
                          {agenda.governanceRecommendation === 'APPROVE' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          <span>{agenda.governanceRecommendation === 'APPROVE' ? '찬성 권고' : '신중 검토'}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 지분 변동 공시 알림 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    대주주 & 임원 지분 변동 실시간 레이더
                  </h3>
                  <span className="text-xs text-slate-500">최근 7일 공시 알림</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equityAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {alert.personName} · {alert.corpName}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          {alert.changeType === 'BUY' ? '장내 매수 (+)' : '스톡옵션 행사'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {alert.sharesChanged.toLocaleString()}주 변동 (현재 지분율 {alert.percentageHolding}%)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">{alert.summaryNote}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 글로벌 핵심 인재 스카우팅 & 탤런트 풀 큐레이터 */}
          {activeTab === 'talent' && (
            <div className="space-y-6 animate-fade-in" data-testid="talent-tab-content">
              {/* 트랙 필터 */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(['ALL', 'CTO', 'AI_LAB_LEAD', 'CPO', 'CFO'] as const).map((track) => (
                  <button
                    key={track}
                    onClick={() => setSelectedTrack(track)}
                    className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedTrack === track
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {track === 'ALL'
                      ? '전체 승계 풀'
                      : track === 'CTO'
                      ? 'CTO (최고기술)'
                      : track === 'AI_LAB_LEAD'
                      ? 'AI Lab Lead (수석연구)'
                      : track === 'CPO'
                      ? 'CPO (프로덕트)'
                      : 'CFO (재무전략)'}
                  </button>
                ))}
              </div>

              {/* 탤런트 후보 리스트 */}
              <div className="space-y-4">
                {filteredTalent.map((cand, idx) => {
                  const isCopied = copiedInviteIdx === idx;
                  return (
                    <div
                      key={cand.person.id || idx}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                      data-testid={`talent-card-${idx}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {cand.person.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {cand.person.currentCompany} · {cand.person.currentTitle}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md">
                            {cand.trackLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            동료 검증 {cand.peerEndorsementCount}회
                          </span>
                          <button
                            onClick={() => handleCopyInvite(cand.confidentialCoffeeInvite, idx)}
                            className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                            data-testid={`copy-confidential-invite-btn-${idx}`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? '복사 완료' : '비공개 티타임 서신 복사'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            🏆 실전 프로덕트 성공 레퍼런스
                          </span>
                          <p className="text-slate-600 dark:text-slate-400">{cand.verifiedProductionSuccess}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            ⚡ 핵심 전문 도메인 시너지
                          </span>
                          <p className="text-slate-600 dark:text-slate-400">{cand.coreDomainSynergy}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                        {cand.confidentialCoffeeInvite}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 초고속 오프라인 우선 PWA & IndexedDB CRDT 동기화 */}
          {activeTab === 'offline' && (
            <div className="space-y-6 animate-fade-in" data-testid="offline-tab-content">
              {/* 상태 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                    {syncStatus.isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">네트워크 연결 상태</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {syncStatus.isOnline ? '온라인 연결됨' : '기내 / 오프라인 모드'}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">오프라인 캐시 프로필</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {syncStatus.cachedProfilesCount}명 (0.01초 즉시 탐색)
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
                    <RotateCw className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">CRDT 자동 병합 완료</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {syncStatus.crdtMergedCount}건 무손실 유지
                    </p>
                  </div>
                </div>
              </div>

              {/* CRDT 화해 수동 트리거 및 PWA 안내 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      양방향 무손실 동기화 (Conflict-free Replicated Data Type)
                    </h3>
                    <p className="text-xs text-slate-500">
                      비행기 기내나 출장지에서 작성한 메모가 재연결 시 안전하게 클라우드 볼트와 병합됩니다.
                    </p>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                    data-testid="trigger-sync-btn"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? '동기화 중...' : '지금 무손실 동기화 실행'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <Download className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      PWA 홈 화면 추가로 네이티브 앱처럼 사용
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      사파리(iOS)의 '홈 화면에 추가' 또는 크롬(Android)의 '앱 설치'를 클릭하시면, 인터넷 연결 없이도 기내에서 전 세계 인맥 그래프와 1-Page 미팅 브리프를 자유롭게 조회하고 기록할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 미팅 가드 & 3분 팔로업 */}
          {activeTab === 'followup' && (
            <div className="space-y-6 animate-fade-in" data-testid="followup-tab-content">
              {/* 24시간 / 2시간 전 에티켓 리마인더 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      미팅 24시간 전 & 2시간 전 결례 없는 정중 에티켓 리마인더
                    </h3>
                    <p className="text-xs text-slate-500">
                      상대방에게 부담을 주지 않으면서 일정을 확인하고 노쇼(No-Show)를 예방하는 C-Level 서신
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    대상: {reminderBrief.personName} ({reminderBrief.personCompany})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          📅 24시간 전 사전 안부 서신
                        </span>
                        <button
                          onClick={() => handleCopyBriefText(reminderBrief.reminders.hours24Before, '24h')}
                          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                          data-testid="copy-reminder-24h-btn"
                        >
                          {copiedReminderKey === '24h' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedReminderKey === '24h' ? '복사됨' : '복사'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {reminderBrief.reminders.hours24Before}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                          🚗 2시간 전 주차·이동 배려 문자
                        </span>
                        <button
                          onClick={() => handleCopyBriefText(reminderBrief.reminders.hours2Before, '2h')}
                          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                          data-testid="copy-reminder-2h-btn"
                        >
                          {copiedReminderKey === '2h' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedReminderKey === '2h' ? '복사됨' : '복사'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {reminderBrief.reminders.hours2Before}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 미팅 직후 3분 감사 서신 & 약속 이행 트래커 */}
              {followUps.map((fu) => (
                <div
                  key={fu.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                  data-testid="followup-card"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          미팅 직후 3분 감사 서신 & 약속 이행 트래커 ({fu.personName}님)
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">미팅 일시: {fu.meetingDate}</p>
                    </div>
                    <button
                      onClick={() => handleCopyBriefText(fu.thankYouLetterDraft, 'thanks')}
                      className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      data-testid="copy-thankyou-btn"
                    >
                      {copiedReminderKey === 'thanks' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReminderKey === 'thanks' ? '복사 완료' : '감사 서신 복사'}</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed">
                    {fu.thankYouLetterDraft}
                  </div>

                  {/* 약속 이행 체크리스트 */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      상호 약속 이행 체크리스트 (Commitment Tracker)
                    </h5>
                    <div className="space-y-2">
                      {fu.commitments.map((cm, cIdx) => (
                        <div
                          key={cm.id}
                          onClick={() => handleToggleCommitment(fu.id, cm.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            cm.isCompleted
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 line-through'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                          data-testid={`commitment-item-${cIdx}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={cm.isCompleted}
                              onChange={() => {}}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                              data-testid={`commitment-check-${cIdx}`}
                            />
                            <span className="font-medium">{cm.text}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                              {cm.assignee === 'ME' ? '본인' : '상대방'} · 기한: {cm.deadline}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* 하단 푸터 바 */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>ConnectWe C-Level 거버넌스 & 미팅 안심 헌장 준수</span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
