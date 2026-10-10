import React, { useState } from 'react';
import { Person } from '../../types/network';
import { generateMeetingBriefing, MeetingBriefing } from '../../services/meetingBriefingEngine';
import { 
  Building2, ShieldCheck, Printer, Copy, Check, X, 
  Sparkles, Users, MessageSquare, Award
} from 'lucide-react';

interface MeetingPrepBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  allPeople: Person[];
  onShowToast: (msg: string) => void;
  isShieldActive?: boolean;
}

export const MeetingPrepBriefModal: React.FC<MeetingPrepBriefModalProps> = ({
  isOpen,
  onClose,
  person,
  allPeople,
  onShowToast,
  isShieldActive = false
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !person) return null;

  const brief: MeetingBriefing = generateMeetingBriefing(person, allPeople);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(brief.onePageSummaryText).then(() => {
      setCopied(true);
      onShowToast(`[${person.name}] 님의 1-Page 미팅 브리프가 클립보드에 복사되었습니다.`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Executive Header Bar (Screen Mode) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">미팅 준비 1-Page 브리프</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-700/60 font-mono">
                  Executive Briefing
                </span>
              </div>
              <p className="text-[11px] text-slate-400">만남 10분 전 핵심 비즈니스 맥락을 60초 만에 완벽 숙지합니다.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="텍스트 클립보드 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨' : '텍스트 복사'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              title="A4 1페이지 인쇄 / PDF 저장"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>A4 인쇄</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1-Page Brief Printable Sheet */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5 print:p-0 print:overflow-visible text-slate-900 font-sans">
          {/* Document Header (Appears in both screen & print) */}
          <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                ConnectWe Executive Intelligence · 1-Page Meeting Prep
              </div>
              <div className="flex items-baseline gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isShieldActive ? `${person.name[0]}**` : person.name}
                </h1>
                <span className="text-sm font-semibold text-slate-600">
                  {person.currentCompany} · {person.currentTitle}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200">
                  {person.closeness}촌 신뢰 인연
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right text-[11px] text-slate-400 font-mono">
              작성 시점: {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>

          {/* Section 1: Executive Profile & DART Fact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>현직 및 전문 경력 단계</span>
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <div>소속: <strong className="text-slate-900">{person.currentCompany}</strong> ({person.currentDepartment || '본사'})</div>
                <div>직함: <strong className="text-slate-900">{person.currentTitle}</strong></div>
                <div>클러스터: <span className="font-semibold text-blue-700">{brief.cluster.label}</span> ({brief.cluster.seniorityLevel})</div>
                <div>주요 역량: {person.skills?.join(', ') || person.primaryDomain}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>DART 공시 팩트 검증</span>
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                {brief.dartSummary.isFactVerified ? (
                  <>
                    <div className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      금융감독원 정기공시 실명 임원 검증 완료
                    </div>
                    <div>공시 법인: <strong>{brief.dartSummary.corpName}</strong></div>
                    <div>등기 형태: {brief.dartSummary.registeredStatus || '등기이사'} · 직위: {brief.dartSummary.role}</div>
                  </>
                ) : (
                  <div className="text-slate-600">
                    비상장사 리더 / 딥테크 전문 인재 (공시 리스크 없는 자유로운 민간 파트너십 가능)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Mutual Connection Insights (상호 신뢰 연결고리) */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>상호 신뢰 연결고리 (공통 알럼나이 & 1촌 교집합)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {brief.mutualConnections.length}명 교집합 발견
              </span>
            </div>

            {brief.mutualConnections.length === 0 ? (
              <p className="text-xs text-slate-500">
                현재 직접적인 공통 동료는 감지되지 않았으나, 동일 도메인({person.primaryDomain}) 전문가 네트워크를 통해 첫 인연 형성 가능.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {brief.mutualConnections.slice(0, 4).map((c, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{c.person.name}</span>
                      <span className="text-slate-500 text-[11px] ml-1.5">({c.person.currentCompany} {c.person.currentTitle})</span>
                    </div>
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">
                      {c.context}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Recommended Icebreaker Topics (자연스러운 3대 대화 화두) */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>추천 티타임 대화 화두 3선 (Icebreaker Topics)</span>
            </div>

            <div className="space-y-2 pt-1">
              {brief.icebreakers.map((topic, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/80 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                      화두 {idx + 1} · {topic.category}
                    </span>
                    <strong className="text-slate-900">{topic.headline}</strong>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-1 leading-relaxed">
                    {topic.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Executive Etiquette & Approach (비즈니스 에티켓 가이드) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Award className="w-3.5 h-3.5 text-slate-700" />
              <span>미팅 에티켓 & 권장 접근법 (Executive Etiquette Guide)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">선호 소통 스타일</span>
                <p className="text-slate-800 text-[11px]">{brief.etiquetteGuide.preferredStyle}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">성공 권장 팁</span>
                <p className="text-slate-800 text-[11px]">{brief.etiquetteGuide.keyAdvice}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200 space-y-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase">피해야 할 화두</span>
                <p className="text-slate-800 text-[11px]">{brief.etiquetteGuide.avoidTopics}</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-2 text-center text-[10px] text-slate-400 font-mono">
            ConnectWe Network Intelligence · 엄격한 사실(Fact) 기반 인맥 및 C-Level 경영 인텔리전스
          </div>
        </div>
      </div>
    </div>
  );
};
