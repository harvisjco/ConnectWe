import React, { useState, useEffect } from 'react';
import { Person, ReferralPosition, ReferralSubmission } from '../../types/network';
import { mockReferralPositions } from '../../data/mockReferralPositions';
import { calculateMatchesForPosition } from '../../services/referralMatcher';
import { 
  fetchPositionsFromHrcoBridge, 
  submitReferralToHrcoBridge,
  checkRewardMilestoneEvents,
  simulateHrcoMilestoneProgress,
  normalizeRewardEvent,
  RewardMilestoneSyncEvent
} from '../../services/hrcoBridgeService';
import { 
  Briefcase, Gift, Sparkles, Building2, MapPin, 
  ChevronRight, Send, 
  ShieldCheck, Clock, RefreshCw, CheckCircle2, DollarSign, Zap, ArrowUpRight
} from 'lucide-react';
import { BountyWithdrawalModal } from '../bounty/BountyWithdrawalModal';
import { ViewHeader } from '../ui';

interface ReferralBountyViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const ReferralBountyView: React.FC<ReferralBountyViewProps> = ({
  people,
  onSelectPerson,
  onShowToast
}) => {
  const [bridgeResult] = useState(() => fetchPositionsFromHrcoBridge());
  const [positions, setPositions] = useState<ReferralPosition[]>(bridgeResult.positions);
  const [selectedPosition, setSelectedPosition] = useState<ReferralPosition>(bridgeResult.positions[0] || mockReferralPositions[0]);
  const [isLiveBridge, setIsLiveBridge] = useState(bridgeResult.isLiveFromHrco);
  const [activeTab, setActiveTab] = useState<'positions' | 'submissions'>('positions');
  const [rewardEvents, setRewardEvents] = useState<RewardMilestoneSyncEvent[]>(() => checkRewardMilestoneEvents());
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

  // HRCO 실시간 IPC 브로드캐스트 채널 리스너
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('hrco_connectwe_bus');
    
    channel.onmessage = (event) => {
      if (event.data?.type === 'REWARD_SYNC' || event.data?.type === 'REWARD_MILESTONE_UPDATED') {
        const rawEvent = event.data.event;
        if (!rawEvent) return;
        const syncEvent: RewardMilestoneSyncEvent = normalizeRewardEvent(rawEvent);
        setRewardEvents(prev => [syncEvent, ...prev]);
        onShowToast(`[HRCO 채용 실시간 보상] ${syncEvent.message}`);
        
        // 제출 목록 리로드
        try {
          const saved = localStorage.getItem('connectwe_referral_submissions');
          if (saved) setSubmissions(JSON.parse(saved));
        } catch (e) {
          console.warn(e);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [onShowToast]);
  
  const handleRefreshBridge = () => {
    const fresh = fetchPositionsFromHrcoBridge();
    setPositions(fresh.positions);
    setIsLiveBridge(fresh.isLiveFromHrco);
    setRewardEvents(checkRewardMilestoneEvents());
    onShowToast(`HRCO GoodPartner 실시간 포지션 및 정산 피드 갱신 완료 (${fresh.positions.length}건)`);
  };

  // 추천 제출 내역 관리 (로컬스토리지 연동)
  const [submissions, setSubmissions] = useState<ReferralSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('connectwe_referral_submissions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 추천서 작성 모달 상태
  const [targetCandidate, setTargetCandidate] = useState<Person | null>(null);
  const [recommendationNote, setRecommendationNote] = useState('');

  // 현재 포지션에 대한 추천 후보자 계산
  const matchedCandidates = calculateMatchesForPosition(selectedPosition, people);

  // 추천서 제출 핸들러
  const handleConfirmSubmit = () => {
    if (!targetCandidate || !recommendationNote.trim()) {
      alert('추천 사유 및 코멘트를 입력해주세요.');
      return;
    }

    const newSubmission: ReferralSubmission = {
      id: `ref-${Date.now()}`,
      positionId: selectedPosition.id,
      positionTitle: selectedPosition.title,
      clientCompany: selectedPosition.clientCompany,
      personId: targetCandidate.id,
      candidateName: targetCandidate.name,
      candidateTitle: targetCandidate.currentTitle,
      candidateCompany: targetCandidate.currentCompany,
      status: 'invitation_sent',
      recommendationNote,
      submittedAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      earnedRewards: {
        coffeeChatPaid: false,
        interviewPaid: false,
        hirePaid: false,
        totalAmount: 0
      }
    };

    const updated = [newSubmission, ...submissions];
    setSubmissions(updated);
    localStorage.setItem('connectwe_referral_submissions', JSON.stringify(updated));

    // HRCO 브릿지로 지인 추천 데이터 실시간 전송
    const matchObj = matchedCandidates.find(m => m.person.id === targetCandidate.id);
    const matchReasonList = matchObj?.matchReasons || ['신뢰 1촌 네트워크 매칭'];
    const matchScoreVal = matchObj?.matchScore || 90;
    submitReferralToHrcoBridge(newSubmission, matchReasonList, matchScoreVal);

    onShowToast(`[${targetCandidate.name}] 님께 ${selectedPosition.clientCompany} 추천 타진이 발송되고 HRCO 파이프라인으로 연동되었습니다!`);
    setTargetCandidate(null);
    setRecommendationNote('');
  };

  // 포맷팅 헬퍼
  const formatMoney = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}천만원`;
    if (val >= 10000) return `${Math.round(val / 10000)}만원`;
    return `${val.toLocaleString()}원`;
  };

  // 누적 확정 리워드 계산
  const totalEarnedReward = submissions.reduce((sum, s) => sum + (s.earnedRewards?.totalAmount || 0), 0);
  const activeSubmissionsCount = submissions.filter(
    s => s.status !== 'hired_placed' && s.status !== 'completed' && s.status !== 'rejected' && s.status !== 'declined_by_candidate'
  ).length;

  // HRCO 마일스톤 단계 진척 핸들러 (ConnectWe 시연/테스트)
  const handleSimulateMilestone = (sub: ReferralSubmission, milestone: 'coffee_chat' | 'interview_pass' | 'final_hire') => {
    const event = simulateHrcoMilestoneProgress(sub, milestone);
    
    // 로컬 submissions 갱신
    try {
      const saved = localStorage.getItem('connectwe_referral_submissions');
      if (saved) setSubmissions(JSON.parse(saved));
    } catch (e) {
      console.warn(e);
    }

    setRewardEvents(prev => [event, ...prev]);
    onShowToast(event.message);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Standardized Header */}
      <ViewHeader
        icon={Gift}
        title="인재 매칭 & 채용 추천 감사 리워드 허브"
        subtitle="소중한 지인의 커리어 성장을 돕고, 따뜻한 안부 티타임부터 합격 시점까지 신뢰 기반 추천 감사 리워드를 지원받으세요."
        englishTag="Referral & Reward Hub"
        badge={
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
            최대 1,000만원 보상
          </span>
        }
        actions={
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('positions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'positions'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>오픈 포지션 ({positions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'submissions'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>내 추천 현황 ({submissions.length})</span>
            </button>
          </div>
        }
      />

      {/* 실시간 리워드 적립 & HRCO 브릿지 상태 3대 KPI 바 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>누적 확정 정산 리워드</span>
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {formatMoney(totalEarnedReward)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={() => setIsWithdrawalModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="세무 3.3% 원천징수 공제 후 등록 계좌로 출금 신청"
            >
              <span>계좌 출금 신청</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              익일 영업일 입금
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>진행 중 채용 파이프라인</span>
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {activeSubmissionsCount}건
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
            총 {submissions.length}건 추천
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>단계별 보상 체계</span>
            </span>
            <div className="text-xs text-slate-600 font-medium space-x-1">
              <span>커피챗 5만</span>
              <span className="text-slate-300">·</span>
              <span>면접 20만</span>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-600 font-semibold">최종 1,000만</span>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-medium">
            3단계 마일스톤
          </span>
        </div>
      </div>

      {/* HRCO GoodPartner Bridge Sync Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-xs text-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">HRCO GoodPartner 헤드헌팅 ERP 실시간 연동</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                isLiveBridge 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {isLiveBridge ? '● LIVE ERP SYNC' : '● ACTIVE FEED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              추천 수락 시 HRCO 채용 관리자 파이프라인으로 지인 이력이 안전하게 직결되며, 마일스톤 도달 시 리워드가 자동 정산됩니다.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefreshBridge}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs self-end sm:self-auto shrink-0 cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-300" />
          <span>HRCO 포지션 동기화 ({positions.length})</span>
        </button>
      </div>

      {activeTab === 'positions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 좌측: 포지션 목록 (5컬럼) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              추천 보상 오픈 포지션
            </h3>
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {positions.map((pos) => {
                const isSelected = selectedPosition.id === pos.id;
                const matchCount = calculateMatchesForPosition(pos, people).length;

                return (
                  <div
                    key={pos.id}
                    onClick={() => setSelectedPosition(pos)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-50/80 border-slate-900 shadow-xs ring-1 ring-slate-900/10'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/40 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-indigo-600">
                        {pos.clientCompany}
                      </span>
                      {pos.urgentBadge && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {pos.urgentBadge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">
                      {pos.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {pos.location.split(' ')[1]}
                      </span>
                      <span>·</span>
                      <span>연차 {pos.targetExperienceYears}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400 text-[11px]">합격 리워드:</span>
                        <span className="font-bold text-emerald-600">
                          {formatMoney(pos.rewards.hireSuccessBounty)}
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                        매칭 인맥 <strong className="text-slate-900 font-bold">{matchCount}</strong>명
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측: 포지션 상세 & AI 인맥 매칭 결과 (7컬럼) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 포지션 상세 정보 카드 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold mb-1">
                    <Building2 className="w-4 h-4" /> {selectedPosition.clientCompany} · {selectedPosition.department}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedPosition.title}
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-slate-400">예상 연봉</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">{selectedPosition.salaryRange}</div>
                </div>
              </div>

              {/* 4단계 추천 보상 프로세스 리워드 카드 */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  단계별 추천 리워드 플랜
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[11px] text-slate-400">1단계 커피챗</div>
                    <div className="text-xs font-bold text-indigo-600 mt-0.5">
                      {formatMoney(selectedPosition.rewards.coffeeChatReward)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[11px] text-slate-400">2단계 면접진행</div>
                    <div className="text-xs font-bold text-sky-600 mt-0.5">
                      {formatMoney(selectedPosition.rewards.interviewReward)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                    <div className="text-[11px] text-emerald-800 font-semibold">3단계 최종합격</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">
                      {formatMoney(selectedPosition.rewards.hireSuccessBounty)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[11px] text-slate-400">4단계 수습통과</div>
                    <div className="text-xs font-bold text-purple-600 mt-0.5">
                      {formatMoney(selectedPosition.rewards.probationBounty || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 요구조건 & 선호 알럼나이 */}
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-slate-700">선호 알럼나이(출신기업):</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPosition.targetAlumniCompanies?.map(alumni => (
                    <span key={alumni} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                      {alumni}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI 인맥 추천 매칭 리스트 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    내 인맥 중 적합 후보자 ({matchedCandidates.length}명)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  DART 팩트 &amp; 알럼나이 교차 매칭
                </span>
              </div>

              {matchedCandidates.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/90 text-slate-500 text-xs shadow-2xs">
                  현재 주소록에 본 포지션 요구역량과 일치하는 인맥이 부족합니다. 새 인맥을 등록하거나 CSV를 추가 가져오기 해보세요.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {matchedCandidates.map(match => {
                    const p = match.person;
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => onSelectPerson(p)}
                              className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              {p.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {p.currentCompany} · {p.currentTitle}
                            </span>
                            {p.dartInfo && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5 font-medium">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> DART
                              </span>
                            )}
                          </div>

                          {/* 매칭 사유 배지 */}
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchReasons.map((reason, idx) => (
                              <span key={idx} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 매칭 스코어 & 추천 액션 */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-right">
                            <div className="text-[11px] text-slate-400 font-medium">적합도</div>
                            <div className="text-base font-extrabold text-indigo-600 font-mono">
                              {match.matchScore}%
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setTargetCandidate(p);
                              setRecommendationNote(`${p.name} 님은 ${p.currentCompany}에서 ${p.primaryDomain} 분야를 총괄하며 탁월한 역량과 팀워크를 검증받은 핵심 인재입니다.`);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-indigo-300" />
                            <span>추천하기</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 추천 진행 현황 탭 (Bounty CRM) */
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              내 인맥 추천 진행 &amp; 리워드 정산 파이프라인
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              총 {submissions.length}건 진행 중
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              아직 진행 중인 추천 내역이 없습니다. 오픈 포지션 탭에서 내 인맥을 추천해보세요!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map((sub) => {
                const totalPaid = sub.earnedRewards?.totalAmount || 0;
                return (
                  <div key={sub.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{sub.candidateName}</span>
                        <span className="text-xs text-slate-500">({sub.candidateCompany} · {sub.candidateTitle})</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-indigo-600">{sub.clientCompany}</span>
                        {totalPaid > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 font-mono">
                            {formatMoney(totalPaid)} 정산 완료
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{sub.positionTitle}</p>
                      <p className="text-[11px] text-slate-400 italic line-clamp-1">"{sub.recommendationNote}"</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        {sub.status === 'invitation_sent' && '비공개 타진 전달완료'}
                        {sub.status === 'coffee_chat_accepted' && '커피챗 수락 (+5만)'}
                        {sub.status === 'interviewing' && '1차 면접 패스 (+20만)'}
                        {sub.status === 'hired_placed' && '최종 입사 확정 (+500만)'}
                      </span>

                      {/* HRCO 채용 단계 진척 시뮬레이터 버튼 (양방향 피드백 테스트) */}
                      <div className="flex items-center gap-1.5">
                        {!sub.earnedRewards?.coffeeChatPaid && (
                          <button
                            onClick={() => handleSimulateMilestone(sub, 'coffee_chat')}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold transition-all cursor-pointer"
                            title="HRCO: 커피챗 수락 시뮬레이션"
                          >
                            커피챗 수락 (+5만)
                          </button>
                        )}

                        {sub.earnedRewards?.coffeeChatPaid && !sub.earnedRewards?.interviewPaid && (
                          <button
                            onClick={() => handleSimulateMilestone(sub, 'interview_pass')}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold transition-all cursor-pointer"
                            title="HRCO: 1차 면접 합격 시뮬레이션"
                          >
                            1차 면접 합격 (+20만)
                          </button>
                        )}

                        {sub.earnedRewards?.interviewPaid && !sub.earnedRewards?.hirePaid && (
                          <button
                            onClick={() => handleSimulateMilestone(sub, 'final_hire')}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold transition-all cursor-pointer animate-pulse"
                            title="HRCO: 최종 입사 확정 리워드 수령 시뮬레이션"
                          >
                            최종 입사 (+500만)
                          </button>
                        )}

                        {sub.earnedRewards?.hirePaid && (
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>전체 추천 리워드 지급 완료</span>
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 font-mono hidden sm:inline">{sub.submittedAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* HRCO 실시간 정산 이벤트 로그 (타임라인) */}
          {rewardEvents.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>HRCO GoodPartner 실시간 추천 리워드 정산 히스토리 ({rewardEvents.length}건)</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {rewardEvents.map((evt) => (
                  <div key={evt.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold font-mono">+{formatMoney(evt.rewardAmount)}</span>
                      <span className="text-slate-900 font-semibold">{evt.candidateName}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">{evt.clientCompany} ({evt.milestoneLabel})</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{evt.syncedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 추천서 작성 모달 (센터 딤 모달) */}
      {targetCandidate && (
        <div 
          onClick={() => setTargetCandidate(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">비공개 지인 추천서 작성</h3>
              </div>
              <button
                onClick={() => setTargetCandidate(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div><strong className="text-slate-900">추천 후보자:</strong> <span className="text-slate-700">{targetCandidate.name} ({targetCandidate.currentCompany} · {targetCandidate.currentTitle})</span></div>
              <div><strong className="text-slate-900">지원 포지션:</strong> <span className="text-slate-700">{selectedPosition.clientCompany} - {selectedPosition.title}</span></div>
              <div><strong className="text-slate-900">합격 시 추천 리워드:</strong> <span className="text-emerald-600 font-bold font-mono">{formatMoney(selectedPosition.rewards.hireSuccessBounty)}</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                추천사 및 적합 사유 (인재의 강점, 협업 시너지):
              </label>
              <textarea
                rows={4}
                value={recommendationNote}
                onChange={(e) => setRecommendationNote(e.target.value)}
                placeholder="지인의 주요 성과 및 추천 이유를 입력하세요..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900">
              추천 타진은 지인의 사전 동의를 전제로 비공개로 전달되며, 후보자가 커피챗을 수락하면 1단계 리워드가 지급됩니다.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setTargetCandidate(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                비공개 추천 제출
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 리워드 계좌 출금 신청 모달 */}
      {isWithdrawalModalOpen && (
        <BountyWithdrawalModal
          totalAvailableReward={totalEarnedReward}
          onClose={() => setIsWithdrawalModalOpen(false)}
          onConfirmWithdrawal={(_amount, netAmount, bankInfo) => {
            onShowToast(`[출금 신청 완료] 세무 3.3% 공제 후 실수령액 ${netAmount.toLocaleString()}원이 ${bankInfo} 계좌로 익일 입금 접수되었습니다.`);
          }}
        />
      )}
    </div>
  );
};
