import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  generateTeaTimeAgenda, 
  downloadIcsFile, 
  generateInvitationLetter,
  TeaTimeAgendaResult 
} from '../../services/meetingAgendaService';
import { 
  X, Coffee, Calendar, MapPin, Sparkles, Copy, 
  Download, Check, Clock, ChevronRight, MessageSquare,
  UserCheck, ShieldCheck
} from 'lucide-react';

interface ExecutiveTeaTimeModalProps {
  people: Person[];
  initialTargetPerson?: Person | null;
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const ExecutiveTeaTimeModal: React.FC<ExecutiveTeaTimeModalProps> = ({
  people,
  initialTargetPerson,
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(() => {
    if (initialTargetPerson) return initialTargetPerson.id;
    if (people.length > 0) return people[0].id;
    return '';
  });

  const selectedPerson = useMemo(() => {
    return people.find(p => p.id === selectedPersonId) || initialTargetPerson || people[0] || null;
  }, [people, selectedPersonId, initialTargetPerson]);

  // 기본 미팅 일시: 내일 오후 2:00
  const [meetingDateStr, setMeetingDateStr] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  });

  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [selectedVenue, setSelectedVenue] = useState<string>('포시즌스 호텔 서울 로비 라운지 (Maru)');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // ESC 키 닫기 핸들링
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // AI 의제 추출
  const agendaResult: TeaTimeAgendaResult | null = useMemo(() => {
    if (!selectedPerson) return null;
    return generateTeaTimeAgenda(selectedPerson);
  }, [selectedPerson]);

  // 캘린더 .ics 다운로드 실행
  const handleDownloadIcs = () => {
    if (!selectedPerson || !agendaResult) return;

    const startDate = new Date(meetingDateStr);
    const summaryAgenda = agendaResult.strategicAgendaList
      .map((item, idx) => `${idx + 1}. ${item.title}\n   - 화두: ${item.talkingPoint}`)
      .join('\n\n');

    const description = `[ConnectWe C-Level 미팅 아젠다]\n\n` +
      `■ 상대방: ${selectedPerson.currentCompany} ${selectedPerson.name} ${selectedPerson.currentTitle}\n` +
      `■ 장소: ${selectedVenue}\n\n` +
      `■ 주요 토론 의제:\n${summaryAgenda}\n\n` +
      `■ 아이스브레이킹 제안:\n${agendaResult.icebreakerTopic}\n\n` +
      `※ 본 일정은 ConnectWe 캘린더 코파일럿을 통해 생성되었습니다.`;

    downloadIcsFile({
      title: `${selectedPerson.currentCompany} ${selectedPerson.name} ${selectedPerson.currentTitle} 티타임`,
      description,
      location: selectedVenue,
      startDate,
      durationMinutes,
      attendeeName: selectedPerson.name,
      attendeeEmail: selectedPerson.email,
      organizerName: 'ConnectWe Executive OS'
    });

    onShowToast(`📅 ${selectedPerson.name}님과의 미팅 초대장(.ics)이 다운로드되었습니다. 더블클릭 시 캘린더에 즉시 등록됩니다.`);
  };

  // 초대 및 확정 서신 복사
  const handleCopyLetter = () => {
    if (!selectedPerson || !agendaResult) return;

    const startDate = new Date(meetingDateStr);
    const summaryAgenda = agendaResult.strategicAgendaList
      .map(item => `  - ${item.title}`)
      .join('\n');

    const letter = generateInvitationLetter(
      selectedPerson,
      startDate,
      selectedVenue,
      summaryAgenda
    );

    navigator.clipboard.writeText(letter);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onShowToast('✉️ 격조 높은 C-Level 티타임 확정 서신이 클립보드에 복사되었습니다.');
  };

  if (!selectedPerson || !agendaResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  경영진 티타임 의제 AI 코파일럿
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 font-mono">
                  AGENDA & .ICS 2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                DART 공시 팩트와 과거 미팅 이력을 결합하여 3대 전략 의제와 캘린더 초대장을 원터치 생성합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Bar: Target Person Selector & Meeting Date/Venue Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            {/* Person Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>티타임 대상 인맥</span>
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {people.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currentCompany} · {p.currentTitle})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>일시 및 시간</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={meetingDateStr}
                  onChange={(e) => setMeetingDateStr(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="text-xs font-semibold px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shrink-0 cursor-pointer"
                >
                  <option value={30}>30분</option>
                  <option value={45}>45분</option>
                  <option value={60}>60분</option>
                  <option value={90}>90분</option>
                </select>
              </div>
            </div>

            {/* Venue Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>미팅 장소 / 라운지</span>
              </label>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer truncate"
              >
                {agendaResult.recommendedVenues.map((v, i) => (
                  <option key={i} value={`${v.name} (${v.area})`}>
                    {v.name} [{v.area}]
                  </option>
                ))}
                <option value="당사 대회의실 (광화문 사옥)">당사 대회의실 (광화문 사옥)</option>
                <option value="상대방 본사 접견실">상대방 본사 접견실</option>
                <option value="온라인 화상 회의 (Google Meet / Zoom)">온라인 화상 회의 (Google Meet)</option>
              </select>
            </div>
          </div>

          {/* Target Person Identity Capsule */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {selectedPerson.name.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedPerson.name}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedPerson.currentCompany} · {selectedPerson.currentTitle}
                  </span>
                  {(selectedPerson.sourceType === 'DART_FACT' || selectedPerson.dartInfo?.isPublicDirector) && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      DART 공시 임원
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>연락처: {selectedPerson.mobile || '등록 없음'}</span>
                  <span>·</span>
                  <span>이메일: {selectedPerson.email || '등록 없음'}</span>
                </div>
              </div>
            </div>

            {onSelectPerson && (
              <button
                onClick={() => {
                  onSelectPerson(selectedPerson);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700/60 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>인맥 프로필 보기</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Icebreaker Section */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-700/50">
            <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>추천 아이스브레이킹 화두 (Icebreaker)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              "{agendaResult.icebreakerTopic}"
            </p>
          </div>

          {/* 3 Strategic Business Agendas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>C-Level 3대 핵심 비즈니스 아젠다</span>
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                실질적 시너지 & 파트너십 도출 목적
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {agendaResult.strategicAgendaList.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug mb-2">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {item.description}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-indigo-900 dark:text-indigo-200 italic">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block not-italic mb-0.5">화두 제안:</span>
                    {item.talkingPoint}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Questions */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>경영진의 통찰을 돋보이게 하는 품격 질문 3선</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {agendaResult.executiveQuestions.map((q, i) => (
                <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-800">
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>선택 장소: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{selectedVenue}</strong></span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Copy Invitation Letter Button */}
            <button
              onClick={handleCopyLetter}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">서신 복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>초대/확정 서신 복사</span>
                </>
              )}
            </button>

            {/* Download RFC 5545 .ICS Button */}
            <button
              onClick={handleDownloadIcs}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 via-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white shadow-md shadow-amber-600/20 active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>캘린더 초대장 (.ics) 다운로드</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
