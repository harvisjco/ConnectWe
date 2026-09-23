import React, { useState, useMemo } from 'react';
import { Person, ReferralPosition, ReferralSubmission, ReferralCandidateMatch } from '../../types/network';
import { MOCK_REFERRAL_POSITIONS } from '../../data/mockReferralPositions';
import { 
  findReferralMatchesForPosition, 
  loadReferralSubmissions, 
  saveReferralSubmissions 
} from '../../services/referralEngine';
import { ReferralActionModal } from '../referral/ReferralActionModal';
import { 
  Gift, Users, Building2, Briefcase, 
  Sparkles, Clock, ShieldCheck, 
  Coins, TrendingUp
} from 'lucide-react';

interface ReferralBountyViewProps {
  people: Person[];
  onShowToast: (msg: string) => void;
  onOpenAddPersonModal?: () => void;
}

export const ReferralBountyView: React.FC<ReferralBountyViewProps> = ({
  people,
  onShowToast,
  onOpenAddPersonModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'pipeline'>('positions');
  const [positions] = useState<ReferralPosition[]>(MOCK_REFERRAL_POSITIONS);
  const [submissions, setSubmissions] = useState<ReferralSubmission[]>(() => loadReferralSubmissions());
  
  // Selected for Action Modal
  const [activeMatch, setActiveMatch] = useState<{
    position: ReferralPosition;
    match: ReferralCandidateMatch;
  } | null>(null);

  // Position-by-Position Matches Cache
  const positionMatches = useMemo(() => {
    const map = new Map<string, ReferralCandidateMatch[]>();
    for (const pos of positions) {
      map.set(pos.id, findReferralMatchesForPosition(pos, people));
    }
    return map;
  }, [positions, people]);

  // Statistics
  const totalEarnedAmount = useMemo(() => {
    return submissions.reduce((acc, sub) => acc + sub.earnedRewards.totalAmount, 0);
  }, [submissions]);

  const activeSubmissionsCount = useMemo(() => {
    return submissions.filter(s => s.status !== 'completed' && s.status !== 'rejected').length;
  }, [submissions]);

  const totalMatchesCount = useMemo(() => {
    let count = 0;
    positionMatches.forEach(matches => {
      count += matches.length;
    });
    return count;
  }, [positionMatches]);

  // Submission Handler
  const handleAddNewSubmission = (newSub: ReferralSubmission) => {
    const updated = [newSub, ...submissions];
    setSubmissions(updated);
    saveReferralSubmissions(updated);
    onShowToast(`[${newSub.candidateName}] 님의 추천이 파이프라인에 성공적으로 등록되었습니다.`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top Stat Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Earned */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/50 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              누적 확정 수령 베네핏
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              정산 완료
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {totalEarnedAmount.toLocaleString()} <span className="text-sm font-medium text-slate-400">원</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            커피챗 성사 및 면접 보상금 실시간 입금
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              진행 중인 추천 파이프라인
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeSubmissionsCount}건 진행 중
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-400 tracking-tight">
            최대 8,000,000 <span className="text-sm font-medium text-slate-400">원 대기</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            면접 및 최종 오퍼 단계 진입 시 단계별 추가 지급
          </div>
        </div>

        {/* Matched Opportunities */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              내 인맥 매칭 추천 기회
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Zero-Knowledge
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {totalMatchesCount} <span className="text-sm font-medium text-slate-400">명의 지인 매칭</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            포지션별 평균 최대 400만원 바운티
          </div>
        </div>
      </div>

      {/* 2. Sub Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('positions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'positions'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>🎯 추천 오픈 포지션 레이더 ({positions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pipeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'pipeline'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>📋 내 추천 진행 & 리워드 현황 ({submissions.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>로컬 프라이버시 보호: 내 인맥 정보는 외부에 공개되지 않습니다</span>
        </div>
      </div>

      {/* 3. Tab Contents */}
      {activeSubTab === 'positions' ? (
        /* Tab 1: Positions Radar */
        <div className="space-y-4">
          {positions.map(position => {
            const matches = positionMatches.get(position.id) || [];

            return (
              <div
                key={position.id}
                className="p-5 md:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all shadow-md space-y-5"
              >
                {/* Position Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-white hover:text-indigo-300 transition-colors">
                        {position.title}
                      </span>
                      {position.urgentBadge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {position.urgentBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        {position.clientCompany}
                      </span>
                      <span>•</span>
                      <span>{position.industry}</span>
                      <span>•</span>
                      <span>{position.location}</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-semibold">{position.salaryRange}</span>
                    </div>
                  </div>

                  {/* Bounty Badge */}
                  <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">채용 성공 시 바운티</div>
                      <div className="text-lg font-black text-amber-400">
                        {position.rewards.hireSuccessBounty.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Requirements & Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5">
                    <div className="font-semibold text-slate-300">핵심 자격 및 직무 요건</div>
                    <ul className="space-y-1 text-slate-400">
                      {position.keyRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400">▪</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5">
                    <div className="font-semibold text-slate-300">선호 알럼나이 & 타겟 연령</div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {position.targetAlumniCompanies?.map((company, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 text-[11px]">
                          🏢 {company} 출신
                        </span>
                      ))}
                      {position.targetAgeGroup?.map((age, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60 text-[11px]">
                          🎂 {age === '40s' ? '40대 임원급' : age === '30s' ? '30대 리드급' : '50대 경영진'}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1">
                      커피챗 수락시 +{position.rewards.coffeeChatReward.toLocaleString()}원 • 1차면접 +{position.rewards.interviewReward.toLocaleString()}원
                    </div>
                  </div>
                </div>

                {/* Matched People in My Network */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      내 인맥 중 추천 적합 지인 ({matches.length}명 매칭)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      로컬 GraphRAG가 회사 이력·나이대·스킬을 분석하여 자동 도출
                    </span>
                  </div>

                  {matches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {matches.map(m => (
                        <div
                          key={m.person.id}
                          className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white truncate">
                                {m.person.name}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                                적합도 {m.matchScore}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {m.person.currentCompany} • {m.person.currentTitle}
                            </div>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {m.matchReasons.slice(0, 2).map((r, idx) => (
                                <span key={idx} className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveMatch({ position, match: m })}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow-sm transition-all flex items-center gap-1"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>추천하기</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/40 text-center text-xs text-slate-500 space-y-2">
                      <p>현재 등록된 내 명함/인맥 중 바로 매칭되는 후보자가 없습니다.</p>
                      {onOpenAddPersonModal && (
                        <button
                          onClick={onOpenAddPersonModal}
                          className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                        >
                          + 이 포지션에 어울리는 새로운 지인 명함 등록하기
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Tab 2: Referral Pipeline Tracker */
        <div className="space-y-4">
          {submissions.length > 0 ? (
            submissions.map(sub => {
              const statusBadge = 
                sub.status === 'coffee_chat_accepted' 
                  ? { label: '☕ 커피챗 수락 (1단계 보상 지급)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
                  : sub.status === 'interviewing'
                  ? { label: '💼 공식 면접 진행 중', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' }
                  : sub.status === 'hired_placed'
                  ? { label: '🎉 최종 입사 확정 (바운티 대기)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
                  : { label: '📨 비공개 타진 전달됨', bg: 'bg-slate-700/50 text-slate-300 border-slate-600' };

              return (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{sub.candidateName} 님 추천</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        포지션: <strong className="text-slate-200">{sub.clientCompany} - {sub.positionTitle}</strong> • 접수일: {sub.submittedAt}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">현재 확정 리워드</div>
                      <div className="text-base font-black text-emerald-400">
                        +{sub.earnedRewards.totalAmount.toLocaleString()}원
                      </div>
                    </div>
                  </div>

                  {/* Stage Stepper */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className={`p-2.5 rounded-xl border ${sub.status !== 'draft' ? 'bg-indigo-950/40 border-indigo-700/60 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                      <div className="font-bold">1. 타진 전달</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">완료</div>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${sub.status === 'coffee_chat_accepted' || sub.status === 'interviewing' || sub.status === 'hired_placed' ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                      <div className="font-bold">2. 커피챗 수락</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">+50,000원</div>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${sub.status === 'interviewing' || sub.status === 'hired_placed' ? 'bg-indigo-950/40 border-indigo-700/60 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                      <div className="font-bold">3. 1차 면접</div>
                      <div className="text-[10px] text-indigo-400 mt-0.5">+200,000원</div>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${sub.status === 'hired_placed' ? 'bg-amber-950/40 border-amber-700/60 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                      <div className="font-bold">4. 최종 입사</div>
                      <div className="text-[10px] text-amber-400 mt-0.5">+바운티 완납</div>
                    </div>
                  </div>

                  {/* Recommendation Note Preview */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300">작성된 추천사 요약:</span>
                    <p className="line-clamp-2 italic">"{sub.recommendationNote}"</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <Gift className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">아직 진행 중인 추천 내역이 없습니다.</p>
              <p className="text-xs">상단의 [추천 오픈 포지션 레이더]에서 내 지인을 추천하고 첫 리워드를 받아보세요.</p>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {activeMatch && (
        <ReferralActionModal
          position={activeMatch.position}
          match={activeMatch.match}
          onClose={() => setActiveMatch(null)}
          onSubmitReferral={(submission) => {
            handleAddNewSubmission(submission);
            setActiveSubTab('pipeline');
          }}
          onShowToast={onShowToast}
        />
      )}

    </div>
  );
};
