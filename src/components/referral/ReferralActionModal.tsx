import React, { useState } from 'react';
import { ReferralPosition, ReferralCandidateMatch, ReferralSubmission } from '../../types/network';
import { generateAiRecommendationDraft } from '../../services/referralEngine';
import { 
  X, Sparkles, Send, Copy, Check, ShieldCheck, Gift, 
  Award, UserCheck
} from 'lucide-react';

interface ReferralActionModalProps {
  position: ReferralPosition;
  match: ReferralCandidateMatch;
  onClose: () => void;
  onSubmitReferral: (submission: ReferralSubmission) => void;
  onShowToast: (msg: string) => void;
}

export const ReferralActionModal: React.FC<ReferralActionModalProps> = ({
  position,
  match,
  onClose,
  onSubmitReferral,
  onShowToast
}) => {
  const { person } = match;
  const [recommendationText, setRecommendationText] = useState(() => 
    generateAiRecommendationDraft(person, position)
  );
  const [isCopied, setIsCopied] = useState(false);
  const [step, setStep] = useState<'review' | 'share'>('review');

  const shareUrl = `https://connectwe.ai/referral/invite?ref=user_${person.id}_pos_${position.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    onShowToast('비공개 추천 수락 링크가 클립보드에 복사되었습니다.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCompleteSubmission = () => {
    const newSubmission: ReferralSubmission = {
      id: `sub-${Date.now()}`,
      positionId: position.id,
      positionTitle: position.title,
      clientCompany: position.clientCompany,
      personId: person.id,
      candidateName: person.name,
      candidateTitle: person.currentTitle,
      candidateCompany: person.currentCompany,
      status: 'invitation_sent',
      recommendationNote: recommendationText,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      earnedRewards: {
        coffeeChatPaid: false,
        interviewPaid: false,
        hirePaid: false,
        totalAmount: 0
      }
    };

    onSubmitReferral(newSubmission);
    setStep('share');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">신뢰 인맥 채용 추천 & 베네핏 연계</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  적합도 {match.matchScore}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {position.clientCompany} • {position.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          
          {step === 'review' ? (
            <>
              {/* Candidate & Reward Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Candidate Info */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    추천 대상 지인 (내 1촌)
                  </div>
                  <div>
                    <span className="text-base font-bold text-white">{person.name}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {person.currentCompany} • {person.currentTitle}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.matchReasons.map((reason, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 font-medium">
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Milestone Rewards */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border border-indigo-800/40 space-y-2">
                  <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    단계별 마일스톤 리워드 안내
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>1단계: 커피챗 수락</span>
                      <span className="font-bold text-emerald-400">+{position.rewards.coffeeChatReward.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>2단계: 1차 면접 진행</span>
                      <span className="font-bold text-emerald-400">+{position.rewards.interviewReward.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center text-white font-bold pt-1 border-t border-indigo-800/40">
                      <span>3단계: 최종 입사 추천 리워드</span>
                      <span className="text-amber-400 text-sm">+{position.rewards.hireSuccessBounty.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Letter Draft */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    AI 맞춤형 추천서 (서치펌·기업 전달용)
                  </label>
                  <span className="text-[11px] text-slate-500">지인의 이력과 메모를 기반으로 자동 생성됨</span>
                </div>
                <textarea
                  value={recommendationText}
                  onChange={(e) => setRecommendationText(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>

              {/* Privacy Notice */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-start gap-2.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>제로 지식 프라이버시 보호</strong>: 추천을 진행하더라도 지인의 연락처가 무단 공개되지 않으며, 
                  지인이 비공개 링크를 통해 채용 상담에 동의한 시점에만 단계별 전형이 시작됩니다.
                </p>
              </div>
            </>
          ) : (
            /* Share Step */
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">추천 파이프라인에 등록되었습니다!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  아래의 비공개 링크를 복사하여 카카오톡이나 메시지로 [{person.name}] 님께 전달해주세요. 
                  지인이 수락하면 즉시 커피챗 리워드가 확정됩니다.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-left">
                <div className="truncate text-xs font-mono text-indigo-300">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                    isCopied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? '복사 완료' : '링크 복사'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 text-left space-y-1.5">
                <div className="font-semibold text-slate-300">추천 팁 (카톡 예시 문구)</div>
                <p className="italic text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  "{person.name}님, 최근 {position.clientCompany}에서 좋은 조건의 {position.title} 포지션을 찾고 있어서 {person.name}님이 가장 먼저 떠올라 공유드립니다. 편하게 커피 한 잔 하시며 이야기 나눠보실래요? 링크: {shareUrl}"
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          {step === 'review' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCompleteSubmission}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>추천서 등록 & 지인 공유 링크 생성</span>
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              닫기 및 파이프라인 확인
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
