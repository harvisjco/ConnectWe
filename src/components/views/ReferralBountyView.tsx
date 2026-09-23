import React, { useState } from 'react';
import { Person, ReferralPosition, ReferralSubmission } from '../../types/network';
import { mockReferralPositions } from '../../data/mockReferralPositions';
import { calculateMatchesForPosition } from '../../services/referralMatcher';
import { fetchPositionsFromHrcoBridge, submitReferralToHrcoBridge } from '../../services/hrcoBridgeService';
import { 
  Briefcase, Gift, Sparkles, Building2, MapPin, 
  ChevronRight, Send, 
  ShieldCheck, Clock, RefreshCw
} from 'lucide-react';

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
  
  const handleRefreshBridge = () => {
    const fresh = fetchPositionsFromHrcoBridge();
    setPositions(fresh.positions);
    setIsLiveBridge(fresh.isLiveFromHrco);
    onShowToast(`HRCO GoodPartner 실시간 포지션 피드 갱신 완료 (${fresh.positions.length}건)`);
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

    onShowToast(`🎉 [${targetCandidate.name}] 님께 ${selectedPosition.clientCompany} 추천 타진이 발송되고 HRCO 파이프라인으로 연동되었습니다!`);
    setTargetCandidate(null);
    setRecommendationNote('');
  };

  // 포맷팅 헬퍼
  const formatMoney = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}천만원`;
    if (val >= 10000) return `${Math.round(val / 10000)}만원`;
    return `${val.toLocaleString()}원`;
  };

  return (
    <div className="space-y-6">
      {/* 상단 탭 및 바운티 통계 배너 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              인맥 기반 헤드헌팅 &amp; 채용 바운티 허브
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              최대 1,000만원 보상
            </span>
          </div>
          <p className="text-xs text-slate-300">
            내 지인의 알럼나이 및 DART 팩트 경력을 기반으로 최적 포지션에 비공개 타진하고, 커피챗부터 최종 합격까지 단계별 리워드를 획득하세요.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'positions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>오픈 포지션 ({positions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>내 추천 현황 ({submissions.length})</span>
          </button>
        </div>
      </div>

      {/* HRCO GoodPartner Bridge Sync Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-800/40 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">HRCO GoodPartner 헤드헌팅 ERP 실시간 연동</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isLiveBridge 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                {isLiveBridge ? '● LIVE ERP SYNC' : '● ACTIVE FEED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              추천 수락 시 HRCO 채용 관리자 파이프라인으로 지인 이력이 안전하게 직결됩니다.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefreshBridge}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors self-end sm:self-auto shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          <span>HRCO 포지션 동기화 ({positions.length})</span>
        </button>
      </div>

      {activeTab === 'positions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-850 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-indigo-400">
                        {pos.clientCompany}
                      </span>
                      {pos.urgentBadge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                          {pos.urgentBadge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                      {pos.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" /> {pos.location.split(' ')[1]}
                      </span>
                      <span>·</span>
                      <span>연차 {pos.targetExperienceYears}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400">합격 바운티:</span>
                        <span className="font-bold text-emerald-400">
                          {formatMoney(pos.rewards.hireSuccessBounty)}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-medium">
                        매칭 인맥 <strong className="text-white">{matchCount}</strong>명
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측: 포지션 상세 & AI 인맥 매칭 결과 (7컬럼) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 포지션 상세 정보 카드 */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
                    <Building2 className="w-4 h-4" /> {selectedPosition.clientCompany} · {selectedPosition.department}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedPosition.title}
                  </h3>
                </div>
                <div className="text-right sm:text-right">
                  <div className="text-[11px] text-slate-400">예상 연봉</div>
                  <div className="text-sm font-bold text-slate-200">{selectedPosition.salaryRange}</div>
                </div>
              </div>

              {/* 4단계 추천 보상 프로세스 바운티 카드 */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  단계별 추천 리워드 플랜
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-400">1단계 커피챗</div>
                    <div className="text-xs font-bold text-indigo-300 mt-0.5">
                      {formatMoney(selectedPosition.rewards.coffeeChatReward)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-400">2단계 면접진행</div>
                    <div className="text-xs font-bold text-sky-300 mt-0.5">
                      {formatMoney(selectedPosition.rewards.interviewReward)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
                    <div className="text-[10px] text-emerald-400 font-semibold">3단계 최종합격</div>
                    <div className="text-xs font-bold text-emerald-300 mt-0.5">
                      {formatMoney(selectedPosition.rewards.hireSuccessBounty)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-400">4단계 수습통과</div>
                    <div className="text-xs font-bold text-purple-300 mt-0.5">
                      {formatMoney(selectedPosition.rewards.probationBounty || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 요구조건 & 선호 알럼나이 */}
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-slate-300">선호 알럼나이(출신기업):</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPosition.targetAlumniCompanies?.map(alumni => (
                    <span key={alumni} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      🏛️ {alumni}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI 인맥 추천 매칭 리스트 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">
                    내 인맥 중 적합 후보자 ({matchedCandidates.length}명)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  DART 팩트 &amp; 알럼나이 교차 알고리즘
                </span>
              </div>

              {matchedCandidates.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                  현재 주소록에 본 포지션 요구역량과 일치하는 인맥이 부족합니다. 새 인맥을 등록하거나 CSV를 추가 가져오기 해보세요.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {matchedCandidates.map(match => {
                    const p = match.person;
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => onSelectPerson(p)}
                              className="font-bold text-sm text-white hover:text-indigo-300 cursor-pointer transition-colors"
                            >
                              {p.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {p.currentCompany} · {p.currentTitle}
                            </span>
                            {p.dartInfo && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" /> DART
                              </span>
                            )}
                          </div>

                          {/* 매칭 사유 배지 */}
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchReasons.map((reason, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 매칭 스코어 & 추천 액션 */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">적합도</div>
                            <div className="text-base font-extrabold text-indigo-400">
                              {match.matchScore}%
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setTargetCandidate(p);
                              setRecommendationNote(`${p.name} 님은 ${p.currentCompany}에서 ${p.primaryDomain} 분야를 총괄하며 탁월한 역량과 팀워크를 검증받은 핵심 인재입니다.`);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95 whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" />
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
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              내 인맥 추천 진행 &amp; 리워드 정산 파이프라인
            </h3>
            <span className="text-xs text-slate-400">
              총 {submissions.length}건 진행 중
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              아직 진행 중인 추천 내역이 없습니다. 오픈 포지션 탭에서 내 인맥을 추천해보세요!
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {submissions.map((sub) => (
                <div key={sub.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{sub.candidateName}</span>
                      <span className="text-xs text-slate-400">({sub.candidateCompany} · {sub.candidateTitle})</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs font-semibold text-indigo-400">{sub.clientCompany}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{sub.positionTitle}</p>
                    <p className="text-[11px] text-slate-500 italic">"{sub.recommendationNote}"</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                      {sub.status === 'invitation_sent' && '✉️ 비공개 타진 전달완료'}
                      {sub.status === 'coffee_chat_accepted' && '☕ 커피챗 성사 (리워드 지급)'}
                      {sub.status === 'interviewing' && '🎤 1차 면접 진행 중'}
                      {sub.status === 'hired_placed' && '🎉 최종 입사 (바운티 정산)'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{sub.submittedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 추천서 작성 모달 */}
      {targetCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">비공개 지인 추천서 작성</h3>
              </div>
              <button
                onClick={() => setTargetCandidate(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                닫기
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs space-y-1">
              <div><strong className="text-white">추천 후보자:</strong> {targetCandidate.name} ({targetCandidate.currentCompany} · {targetCandidate.currentTitle})</div>
              <div><strong className="text-white">지원 포지션:</strong> {selectedPosition.clientCompany} - {selectedPosition.title}</div>
              <div><strong className="text-white">합격 시 수령 바운티:</strong> <span className="text-emerald-400 font-bold">{formatMoney(selectedPosition.rewards.hireSuccessBounty)}</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                추천사 및 적합 사유 (인재의 강점, 레퍼런스 등):
              </label>
              <textarea
                rows={4}
                value={recommendationNote}
                onChange={(e) => setRecommendationNote(e.target.value)}
                placeholder="지인의 주요 성과 및 추천 이유를 입력하세요..."
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300">
              💡 추천 타진은 지인의 사전 동의를 전제로 비공개로 전달되며, 후보자가 커피챗을 수락하면 1단계 리워드가 지급됩니다.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTargetCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                취소
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                비공개 추천 제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
