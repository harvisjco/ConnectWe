import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Person } from '../../types/network';
import { generateMeetingBriefing, MeetingBriefing } from '../../services/meetingBriefingEngine';
import { 
  generateTeaTimeAgenda, 
  downloadIcsFile, 
  generateInvitationLetter,
  TeaTimeAgendaResult 
} from '../../services/meetingAgendaService';
import { 
  X, Sparkles, Building2, Coffee, Calendar,
  Copy, Check, Clock,
  Printer, Download, ShieldCheck, ArrowRight, Users
} from 'lucide-react';

export interface ExecutiveMeetingStudioProps {
  isOpen: boolean;
  initialTab?: 'brief' | 'teatime';
  person: Person | null;
  allPeople?: Person[];
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const ExecutiveMeetingStudio: React.FC<ExecutiveMeetingStudioProps> = ({
  isOpen,
  initialTab = 'brief',
  person,
  allPeople = [],
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'teatime'>(initialTab);
  const printRef = useRef<HTMLDivElement>(null);

  // 티타임 설정 상태
  const [meetingDateStr, setMeetingDateStr] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [selectedVenue, setSelectedVenue] = useState<string>('포시즌스 호텔 서울 로비 라운지 (Maru)');
  const [isCopiedLetter, setIsCopiedLetter] = useState<boolean>(false);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);

  // ESC 키 닫기 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 스마트 브리핑 데이터
  const briefing: MeetingBriefing | null = useMemo(() => {
    if (!person) return null;
    return generateMeetingBriefing(person, allPeople);
  }, [person, allPeople]);

  // 티타임 아젠다 데이터
  const teaTimeAgenda: TeaTimeAgendaResult | null = useMemo(() => {
    if (!person) return null;
    return generateTeaTimeAgenda(person);
  }, [person]);

  if (!isOpen || !person) return null;

  // 인쇄 핸들러
  const handlePrint = () => {
    window.print();
  };

  // 브리프 원터치 복사
  const handleCopyBrief = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(briefing.onePageSummaryText);
    setCopiedBrief(true);
    onShowToast('미팅 브리프 요약문이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  // .ICS 다운로드 핸들러
  const handleDownloadIcs = () => {
    if (!teaTimeAgenda) return;
    const dateObj = new Date(meetingDateStr);
    const agendaSummary = teaTimeAgenda.strategicAgendaList.map(a => `■ ${a.title}`).join('\n');

    downloadIcsFile({
      title: `${person.currentCompany} ${person.name} ${person.currentTitle} 티타임 회동`,
      description: `[ConnectWe C-Level 회동]\n\n■ 주요 아젠다:\n${agendaSummary}\n\n■ 장소: ${selectedVenue}`,
      location: selectedVenue,
      startDate: dateObj,
      durationMinutes,
      attendeeName: person.name,
      attendeeEmail: person.email,
      organizerName: 'ConnectWe Executive Member'
    });

    onShowToast('표준 캘린더 초대 파일(.ics)이 성공적으로 생성되어 다운로드되었습니다.');
  };

  // 확정 서신 복사
  const handleCopyInvitationLetter = () => {
    if (!teaTimeAgenda) return;
    const dateObj = new Date(meetingDateStr);
    const agendaSummary = teaTimeAgenda.strategicAgendaList.map(a => `■ ${a.title}\n  - ${a.description}`).join('\n\n');
    const letter = generateInvitationLetter(person, dateObj, selectedVenue, agendaSummary);

    navigator.clipboard.writeText(letter);
    setIsCopiedLetter(true);
    onShowToast('정중한 C-Level 미팅 확정 서신이 복사되었습니다.');
    setTimeout(() => setIsCopiedLetter(false), 2000);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Studio Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  경영진 미팅 &amp; 티타임 스튜디오 (Meeting &amp; Tea-Time Studio)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Pre-Meeting Copilot
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                미팅 10분 전 스마트 1-Page 브리핑과 맞춤형 3대 의제 및 표준 캘린더(.ICS) 초대를 원스톱으로 지원합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Person Info Bar & Mode Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Target Profile Snippet */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {person.name[0]}
            </div>
            <div>
              <span className="font-black text-slate-900">{person.name}</span>
              <span className="text-slate-500 ml-1.5 font-medium">{person.currentCompany} · {person.currentTitle}</span>
            </div>
            {person.sourceType === 'DART_FACT' && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200">
                DART 임원
              </span>
            )}
          </div>

          {/* Studio Navigation Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('brief')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'brief'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>1-Page 스마트 브리프 (사전 준비)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teatime')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'teatime'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>티타임 3대 의제 &amp; .ICS 캘린더</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: 1-Page 스마트 브리핑 */}
          {activeTab === 'brief' && briefing && (
            <div className="space-y-5">
              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/50 border border-indigo-150">
                <span className="text-xs text-indigo-950 font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>미팅 시작 전 3분 만에 핵심 파악 및 전략 수립 완료</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBrief}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedBrief ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBrief ? '복사됨' : '브리프 복사'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Printer className="w-3 h-3 text-slate-500" />
                    <span>A4 인쇄</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('teatime')}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <span>티타임 일정 조율로 이동</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 3대 추천 아이스브레이킹 화두 카드 */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-2.5">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>5대 인재 클러스터 특화 추천 화두 (Ice-Breakers)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {briefing.icebreakers.map((topic, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-amber-200/60 text-xs text-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {i + 1}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {topic.category}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs leading-snug">{topic.headline}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{topic.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DART 공시 팩트 & 에티켓 가이드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>DART 금융감독원 공시 검증 내역</span>
                  </span>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">거버넌스 상태:</span>
                      <span className="font-bold text-slate-800">{briefing.dartSummary.isFactVerified ? 'DART FACT 검증 완료' : '비상장/자문 전문 인재'}</span>
                    </div>
                    {briefing.dartSummary.corpName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">법인명:</span>
                        <span className="font-bold text-slate-800">{briefing.dartSummary.corpName}</span>
                      </div>
                    )}
                    {briefing.dartSummary.role && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">등기 직함:</span>
                        <span className="font-bold text-slate-800">{briefing.dartSummary.role}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>미팅 에티켓 &amp; 품격 가이드</span>
                  </span>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                    <p className="text-slate-700 leading-relaxed">
                      <strong className="text-indigo-600">선호 스타일:</strong> {briefing.etiquetteGuide.keyAdvice}
                    </p>
                    <p className="text-rose-600 leading-relaxed">
                      <strong>지양 화두:</strong> {briefing.etiquetteGuide.avoidTopics}
                    </p>
                  </div>
                </div>
              </div>

              {/* 공통 알럼나이 1촌 신뢰 접점 */}
              {briefing.mutualConnections.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>공통 1촌 신뢰 접점 ({briefing.mutualConnections.length}명)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">클릭 시 상세 프로필 확인</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {briefing.mutualConnections.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => onSelectPerson && onSelectPerson(item.person)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.person.name} ({item.person.currentCompany})</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.context}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 티타임 3대 의제 & .ICS 캘린더 생성 */}
          {activeTab === 'teatime' && teaTimeAgenda && (
            <div className="space-y-6">
              {/* Meeting Schedule & Venue Selector */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>미팅 일시 및 프라이빗 C-Level 명소 조율</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">미팅 일시</label>
                    <input 
                      type="datetime-local" 
                      value={meetingDateStr}
                      onChange={e => setMeetingDateStr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">소요 시간</label>
                    <select
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                    >
                      <option value={30}>30분 (스피드 티타임)</option>
                      <option value={60}>60분 (표준 파트너십 회동)</option>
                      <option value={90}>90분 (심층 전략 논의)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">추천 비즈니스 라운지</label>
                    <select
                      value={selectedVenue}
                      onChange={e => setSelectedVenue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 truncate"
                    >
                      {teaTimeAgenda.recommendedVenues.map((v, idx) => (
                        <option key={idx} value={v.name}>
                          {v.name} ({v.area})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3대 전략 아젠다 */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span>맞춤형 3대 전략 비즈니스 의제</span>
                </span>
                <div className="space-y-2">
                  {teaTimeAgenda.strategicAgendaList.map((agenda, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1 text-xs">
                      <div className="font-bold text-slate-900">{agenda.title}</div>
                      <p className="text-slate-600 text-[11px]">{agenda.description}</p>
                      <div className="text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-lg font-medium mt-1">
                        화두 예시: {agenda.talkingPoint}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions: .ICS Download & Invitation Letter */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Google Calendar, Apple 캘린더, Outlook에 즉시 등록 가능한 표준 규격 파일입니다.
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyInvitationLetter}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    {isCopiedLetter ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopiedLetter ? '서신 복사 완료' : '품격 확정 서신 복사'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>.ICS 캘린더 초대장 원클릭 다운로드</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
