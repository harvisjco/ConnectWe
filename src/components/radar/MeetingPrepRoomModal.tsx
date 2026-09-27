import React, { useState, useEffect, useMemo } from 'react';
import { Person } from '../../types/network';
import { generateMeetingBriefing, MeetingBriefing } from '../../services/meetingBriefingEngine';
import { 
  X, Copy, Check, ShieldCheck, Sparkles, Building2, 
  Users, Handshake, MessageSquare, AlertCircle, ExternalLink 
} from 'lucide-react';

interface MeetingPrepRoomModalProps {
  isOpen: boolean;
  person: Person | null;
  allPeople?: Person[];
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
}

export const MeetingPrepRoomModal: React.FC<MeetingPrepRoomModalProps> = ({
  isOpen,
  person,
  allPeople = [],
  onClose,
  onSelectPerson
}) => {
  const [copied, setCopied] = useState(false);

  // ESC 키 닫기 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const briefing: MeetingBriefing | null = useMemo(() => {
    if (!person) return null;
    return generateMeetingBriefing(person, allPeople);
  }, [person, allPeople]);

  if (!isOpen || !person || !briefing) return null;

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(briefing.onePageSummaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      data-testid="meeting-prep-room-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-title"
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="briefing-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  C-Level 미팅 10분 전 스마트 브리핑 룸
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  1-Page Brief
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                DART 공시 팩트, 공통 알럼나이 1촌, 딜 파이프라인, 아이스브레이킹 화두를 1초 만에 파악합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="1-Page 텍스트 복사"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>요약 복사</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 본문 브리핑 콘텐츠 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. 핵심 인물 프로필 요약 카드 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {person.name.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {person.name}
                  </h3>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {person.currentCompany} {person.currentTitle}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${briefing.cluster.badgeStyle}`}>
                    {briefing.cluster.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  {person.primaryDomain && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      도메인: <strong className="text-slate-700 dark:text-slate-200">{person.primaryDomain}</strong>
                    </span>
                  )}
                  {briefing.cluster.seniorityLevel && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      경력 단계: <strong className="text-slate-700 dark:text-slate-200">{briefing.cluster.seniorityLevel}</strong>
                    </span>
                  )}
                  {person.careers && person.careers.filter(c => !c.isCurrent).length > 0 && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      알럼나이: <strong className="text-slate-700 dark:text-slate-200">
                        {person.careers.filter(c => !c.isCurrent).map(c => c.companyName).join(', ')}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 고유 강점 (Superpower Edge) 칩 */}
            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Superpower Edge
              </span>
              <div className="flex flex-wrap gap-1">
                {briefing.cluster.superpowers.map((sp, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-medium">
                    #{sp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 2단 그리드: 거버넌스 팩트 & 공통 1촌 알럼나이 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DART 공시 & 거버넌스 팩트 */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    전자공시(DART) 거버넌스 팩트
                  </h4>
                </div>
                {briefing.dartSummary.isFactVerified ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    DART FACT 검증 완료
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    비상장/사외 전문 인재
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">소속 법인</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {briefing.dartSummary.corpName}
                    {briefing.dartSummary.corpCode && (
                      <span className="text-[10px] text-slate-400">({briefing.dartSummary.corpCode})</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">공시 등기 직함</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {briefing.dartSummary.role}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">거버넌스 상태</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {briefing.dartSummary.registeredStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 1촌 공통 알럼나이 접점 */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    1촌 공통 알럼나이 신뢰 접점
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {briefing.mutualConnections.length}명 발견
                </span>
              </div>

              {briefing.mutualConnections.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  아직 등록된 공통 알럼나이가 없습니다. 미팅을 통해 새로운 인연을 맺어보세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {briefing.mutualConnections.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer group"
                      onClick={() => onSelectPerson && onSelectPerson(item.person)}
                      title="프로필 보기"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                          {item.person.name.slice(0, 1)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                            {item.person.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {item.context}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. 진행 중인 비즈니스 파트너십 딜 */}
          {briefing.relatedDeals.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    연관 비즈니스 파트너십 딜 파이프라인
                  </h4>
                </div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {briefing.relatedDeals.length}건 진행 중
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {briefing.relatedDeals.map(deal => (
                  <div key={deal.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{deal.title}</p>
                    <div className="flex items-center justify-between mt-1 text-slate-500">
                      <span>단계: <strong>{deal.stage}</strong></span>
                      <span>건전도: <strong className="text-amber-600">{deal.healthScore}점</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. 1초 파악! 스마트 아이스브레이킹 화두 3선 */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                미팅 시작을 밝히는 추천 아이스브레이킹 화두 3선
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {briefing.icebreakers.map((topic, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      화두 0{idx + 1} · {topic.category}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1.5 leading-snug">
                      {topic.headline}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {topic.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. C-Level 에티켓 & 톤 가이드 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <span>미팅 에티켓 & 격조 가이드 ({briefing.cluster.label} 맞춤)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block mb-0.5">선호 소통 스타일 & 핵심 조언</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {briefing.etiquetteGuide.keyAdvice}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">지양해야 할 화두 (선입견 배제)</span>
                <p className="text-rose-600 dark:text-rose-400 font-medium">
                  {briefing.etiquetteGuide.avoidTopics}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 푸터 CTA */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            ConnectWe Intelligence · 실시간 공시 & 인맥 데이터 기반 자동 합성
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors"
          >
            브리핑 완료 및 미팅 참석
          </button>
        </div>
      </div>
    </div>
  );
};
