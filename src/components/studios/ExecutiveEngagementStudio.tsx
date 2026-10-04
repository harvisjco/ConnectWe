import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Person, ActivityLog } from '../../types/network';
import { generateMeetingBriefing, MeetingBriefing } from '../../services/meetingBriefingEngine';
import { 
  generateTeaTimeAgenda, 
  downloadIcsFile, 
  generateInvitationLetter,
  TeaTimeAgendaResult 
} from '../../services/meetingAgendaService';
import { 
  analyzeVoiceDebrief, 
  VoiceDebriefAnalysis 
} from '../../services/voiceDebriefEngine';
import {
  calculateGapDays,
  generateGoldenCareDrafts
} from '../../services/goldenCareService';
import { 
  ProtocolEventType, 
  generateProtocolMessage
} from '../../services/executiveProtocolService';
import { 
  X, Sparkles, Coffee, Copy, Check, Mic, MicOff, Save,
  Download, ShieldCheck, Users, Headphones, Gift,
  ChevronDown
} from 'lucide-react';

export type EngagementTab = 'brief' | 'teatime' | 'debrief' | 'care';

export interface ExecutiveEngagementStudioProps {
  isOpen: boolean;
  initialTab?: EngagementTab;
  initialSubFeature?: 'audio' | 'salon' | 'voice' | 'protocol';
  initialProtocolType?: ProtocolEventType;
  targetPerson?: Person | null;
  allPeople: Person[];
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
  onUpdatePerson?: (updatedPerson: Person) => void;
  onOpenAudioBriefing?: (person: Person) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExecutiveEngagementStudio: React.FC<ExecutiveEngagementStudioProps> = ({
  isOpen,
  initialTab = 'brief',
  initialSubFeature,
  initialProtocolType,
  targetPerson,
  allPeople = [],
  onClose,
  onSelectPerson,
  onUpdatePerson,
  onOpenAudioBriefing,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<EngagementTab>(initialTab);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(
    targetPerson || (allPeople.length > 0 ? allPeople[0] : null)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);

  useEffect(() => {
    if (targetPerson) {
      setCurrentPerson(targetPerson);
    } else if (!currentPerson && allPeople.length > 0) {
      setCurrentPerson(allPeople[0]);
    }
  }, [targetPerson, allPeople, currentPerson]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // 1-Page 미팅 브리프 상태
  const briefRef = useRef<HTMLDivElement>(null);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // 티타임 설정 상태
  const [meetingDateStr, setMeetingDateStr] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const durationMinutes = 60;
  const [selectedVenue, setSelectedVenue] = useState<string>('포시즌스 호텔 서울 로비 라운지 (Maru)');
  const [copiedTeaLetter, setCopiedTeaLetter] = useState(false);

  // 회고 모드 상태 (음성 / 텍스트)
  const [debriefMode, setDebriefMode] = useState<'voice' | 'text'>(
    initialSubFeature === 'voice' ? 'voice' : 'text'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceDebriefAnalysis, setVoiceDebriefAnalysis] = useState<VoiceDebriefAnalysis | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [copiedThankYou, setCopiedThankYou] = useState(false);

  // 골든케어 & 프로토콜(의전) 상태
  const [careSubTab, setCareSubTab] = useState<'goldencare' | 'protocol'>(
    initialSubFeature === 'protocol' ? 'protocol' : 'goldencare'
  );
  const [protocolType, setProtocolType] = useState<ProtocolEventType>(
    initialProtocolType || 'CONDOLENCE'
  );
  const [protocolFormat, setProtocolFormat] = useState<'short' | 'formal' | 'ribbon'>('formal');
  const [copiedProtocol, setCopiedProtocol] = useState(false);

  // 인맥 필터링
  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return allPeople;
    const q = searchQuery.toLowerCase();
    return allPeople.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.currentCompany?.toLowerCase().includes(q) ||
      p.currentTitle?.toLowerCase().includes(q)
    );
  }, [allPeople, searchQuery]);

  // 미팅 브리프 생성
  const briefing: MeetingBriefing | null = useMemo(() => {
    if (!currentPerson) return null;
    return generateMeetingBriefing(currentPerson, allPeople);
  }, [currentPerson, allPeople]);

  // 티타임 의제 및 초대장 생성
  const teaTimeAgenda: TeaTimeAgendaResult | null = useMemo(() => {
    if (!currentPerson) return null;
    return generateTeaTimeAgenda(currentPerson);
  }, [currentPerson]);

  const teaInvitationLetter = useMemo(() => {
    if (!currentPerson || !teaTimeAgenda) return '';
    const agendaSummary = teaTimeAgenda.strategicAgendaList
      .map((item, idx) => `${idx + 1}. ${item.title}\n   - ${item.talkingPoint}`)
      .join('\n');
    return generateInvitationLetter(
      currentPerson,
      meetingDateStr || new Date().toISOString(),
      selectedVenue || '포시즌스 호텔 서울 로비 라운지 (Maru)',
      agendaSummary
    );
  }, [currentPerson, teaTimeAgenda, meetingDateStr, selectedVenue]);

  // 골든케어 초안 생성
  const gapDays = useMemo(() => {
    return calculateGapDays(currentPerson?.lastContactDate);
  }, [currentPerson]);

  const goldenCareDrafts = useMemo(() => {
    if (!currentPerson) return [];
    return generateGoldenCareDrafts(currentPerson);
  }, [currentPerson]);

  // 프로토콜(의전) 서신 생성
  const protocolMsg = useMemo(() => {
    if (!currentPerson) return null;
    return generateProtocolMessage(currentPerson, protocolType);
  }, [currentPerson, protocolType]);

  // 복사 핸들러들
  const handleCopyBriefText = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(briefing.onePageSummaryText);
    setCopiedBrief(true);
    onShowToast('1-Page 스마트 브리프 전문이 클립보드에 복사되었습니다.', 'success');
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  const handleCopyTeaLetter = () => {
    if (!teaInvitationLetter) return;
    navigator.clipboard.writeText(teaInvitationLetter);
    setCopiedTeaLetter(true);
    onShowToast('정중한 티타임 초대 서신이 복사되었습니다.', 'success');
    setTimeout(() => setCopiedTeaLetter(false), 2000);
  };

  const handleDownloadCalendar = () => {
    if (!currentPerson || !teaTimeAgenda) return;
    const agendaSummary = teaTimeAgenda.strategicAgendaList
      .map((item, idx) => `${idx + 1}. ${item.title}`)
      .join('\n');

    downloadIcsFile({
      title: `${currentPerson.name}님과의 비즈니스 티타임`,
      description: `ConnectWe 품격 티타임\n${teaTimeAgenda.icebreakerTopic}\n\n■ 주요 나눔 의제:\n${agendaSummary}`,
      location: selectedVenue,
      startDate: new Date(meetingDateStr),
      durationMinutes,
      attendeeName: currentPerson.name,
      attendeeEmail: currentPerson.email || 'partner@example.com'
    });

    // 캘린더 등록 활동 로그 기록
    if (onUpdatePerson) {
      const newLog: ActivityLog = {
        id: `log-meeting-${Date.now()}`,
        personId: currentPerson.id,
        type: 'meeting',
        title: `[티타임 확정] ${selectedVenue}`,
        content: `일시: ${new Date(meetingDateStr).toLocaleString('ko-KR')} | 장소: ${selectedVenue}`,
        loggedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
      onUpdatePerson({
        ...currentPerson,
        activityLogs: [newLog, ...(currentPerson.activityLogs || [])]
      });
    }

    onShowToast('표준 캘린더(.ics) 초대 파일이 다운로드되었습니다.', 'success');
  };

  // 30초 음성 회고 시뮬레이션
  const handleToggleVoiceRecording = () => {
    if (!currentPerson) return;
    if (isRecording) {
      setIsRecording(false);
      const simulatedText = `${currentPerson.name} ${currentPerson.currentTitle || '대표'}님과 오늘 1시간 동안 AI 아키텍처 및 신규 비즈니스 협력안을 논의했습니다. 양사의 데이터 파이프라인 시너지에 적극 공감하셨으며, 다음 주 수요일까지 PoC 실증 제안서와 레퍼런스를 메일로 송부하기로 했습니다.`;
      setVoiceTranscript(simulatedText);

      const analysis = analyzeVoiceDebrief(simulatedText, allPeople, currentPerson);
      setVoiceDebriefAnalysis(analysis);
      setFollowUpNote(analysis.followUpLetter);
      onShowToast('30초 음성 녹음이 텍스트로 자동 변환 및 분석되었습니다.', 'info');
    } else {
      setIsRecording(true);
      setVoiceTranscript('음성을 녹음 중입니다... (30초 동안 미팅 결과를 편안하게 말씀해 주세요)');
    }
  };

  const handleSaveDebrief = () => {
    if (!currentPerson || !onUpdatePerson) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const newLog: ActivityLog = {
      id: `log-debrief-${Date.now()}`,
      personId: currentPerson.id,
      type: 'meeting',
      title: debriefMode === 'voice' ? '[음성 회고 완료] 1-Page AI 브리프' : '[미팅 회고] 핵심 요약',
      content: followUpNote || voiceTranscript || '소중한 비즈니스 미팅이 성공적으로 완료되었습니다.',
      loggedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    onUpdatePerson({
      ...currentPerson,
      lastContactDate: todayStr,
      isStale: false,
      activityLogs: [newLog, ...(currentPerson.activityLogs || [])]
    });
    onShowToast('미팅 회고 및 최근 소통일이 최신으로 갱신되었습니다.', 'success');
  };

  const handleCopyFollowUpLetter = () => {
    if (!followUpNote) return;
    navigator.clipboard.writeText(followUpNote);
    setCopiedThankYou(true);
    onShowToast('감사 서신 초안이 클립보드에 복사되었습니다.', 'success');
    setTimeout(() => setCopiedThankYou(false), 2000);
  };

  const handleCopyProtocolText = () => {
    if (!protocolMsg) return;
    const targetText = 
      protocolFormat === 'short' ? protocolMsg.shortMessage :
      protocolFormat === 'ribbon' ? protocolMsg.ribbonCardText :
      protocolMsg.formalLetter;
    
    navigator.clipboard.writeText(targetText);
    setCopiedProtocol(true);
    onShowToast('C-Suite 공식 의전 서신이 클립보드에 복사되었습니다.', 'success');
    setTimeout(() => setCopiedProtocol(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-title"
      >
        {/* ========================================================
            스튜디오 최상단 헤더 & 인맥 선택기
            ======================================================== */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="studio-title" className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  경영진 미팅 & 소통 컨시어지 스튜디오
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  통합 메가스튜디오 1
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-Page 브리프부터 동선 티타임, 음성 회고, 골든케어 & 축전까지 원스톱 C-Level 케어
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 동적 인맥 선택 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsPersonDropdownOpen(!isPersonDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-400 transition-all shadow-xs cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>{currentPerson ? `${currentPerson.name} (${currentPerson.currentCompany || '소속 없음'})` : '인맥 선택'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isPersonDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="인맥 성명/회사 검색..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white mb-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredPeople.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setCurrentPerson(p);
                          if (onSelectPerson) onSelectPerson(p);
                          setIsPersonDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          currentPerson?.id === p.id 
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                          {p.currentCompany || p.currentTitle || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="스튜디오 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================
            4대 메가 탭 네비게이션
            ======================================================== */}
        <div className="px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('brief')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'brief'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1-Page AI 브리프</span>
          </button>

          <button
            onClick={() => setActiveTab('teatime')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'teatime'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>동선 티타임 & .ICS</span>
          </button>

          <button
            onClick={() => setActiveTab('debrief')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'debrief'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>30초 음성 회고 & 서신</span>
          </button>

          <button
            onClick={() => setActiveTab('care')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'care'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>골든케어 안부 & 축전문</span>
          </button>
        </div>

        {/* ========================================================
            메인 탭 콘텐츠 영역
            ======================================================== */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          {!currentPerson ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold">인맥을 선택하여 컨시어지 서비스를 시작하세요.</p>
            </div>
          ) : (
            <>
              {/* TAB 1: 1-Page AI 스마트 미팅 브리프 */}
              {activeTab === 'brief' && briefing && (
                <div className="space-y-5 animate-in fade-in duration-200 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentPerson.name} {currentPerson.currentTitle || '대표'}님과의 미팅 브리프
                      </h3>
                      <p className="text-xs text-slate-500">
                        {briefing.generatedAt} 기준 실시간 생성
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {onOpenAudioBriefing && (
                        <button
                          onClick={() => onOpenAudioBriefing(currentPerson)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all cursor-pointer shadow-xs"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>30초 오디오 브리핑</span>
                        </button>
                      )}
                      <button
                        onClick={handleCopyBriefText}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs shadow-indigo-600/20"
                      >
                        {copiedBrief ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBrief ? '복사 완료' : '브리프 텍스트 복사'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Page 브리프 카드 */}
                  <div ref={briefRef} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                    {/* 상견례 에티켓 가이드 */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                          품격 에티켓 제안: {briefing.etiquetteGuide.preferredStyle}
                        </div>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                          {briefing.etiquetteGuide.keyAdvice}
                        </p>
                      </div>
                    </div>

                    {/* DART 공시 팩트 & 공통 인맥 인사이트 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          🏛️ DART 공시 실명 팩트
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <div>법인명: <span className="font-semibold text-slate-800 dark:text-slate-200">{briefing.dartSummary.corpName || currentPerson.currentCompany || '비상장사'}</span></div>
                          <div>등기 직책: <span className="font-semibold text-slate-800 dark:text-slate-200">{briefing.dartSummary.role || currentPerson.currentTitle || '대표/임원'}</span></div>
                          <div>공시 검증: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{briefing.dartSummary.isFactVerified ? '공식 확인 완료' : '자체 프로필'}</span></div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          🤝 공통 알럼나이 & 신뢰 인맥
                        </div>
                        {briefing.mutualConnections.length > 0 ? (
                          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            {briefing.mutualConnections.slice(0, 2).map((mc, idx) => (
                              <div key={idx} className="truncate">
                                • <span className="font-semibold text-slate-800 dark:text-slate-200">{mc.person.name}</span>: {mc.context}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">직접적인 1촌 공통 인맥은 없으나 상호 도메인 접점이 존재합니다.</p>
                        )}
                      </div>
                    </div>

                    {/* 추천 대화 아이스브레이킹 3대 토픽 */}
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                        💬 격조 높은 아이스브레이킹 화두 3선
                      </div>
                      <div className="space-y-2">
                        {briefing.icebreakers.map((topic, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {topic.category}
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{topic.headline}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-1">
                              {topic.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 거점 외근 티타임 조율 & .ICS */}
              {activeTab === 'teatime' && teaTimeAgenda && (
                <div className="space-y-5 animate-in fade-in duration-200 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentPerson.name}님과의 C-Level 티타임 일정 조율
                      </h3>
                      <p className="text-xs text-slate-500">
                        품격 명소 추천 및 캘린더 등록 .ICS 파일 원클릭 다운로드
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyTeaLetter}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all cursor-pointer shadow-xs"
                      >
                        {copiedTeaLetter ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>초대 서신 복사</span>
                      </button>
                      <button
                        onClick={handleDownloadCalendar}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs shadow-indigo-600/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.ICS 캘린더 다운로드</span>
                      </button>
                    </div>
                  </div>

                  {/* 일정 및 명소 선택기 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white">
                        티타임 일시 설정
                      </label>
                      <input
                        type="datetime-local"
                        value={meetingDateStr}
                        onChange={(e) => setMeetingDateStr(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        기본 미팅 권장 소요 시간은 1시간(60분)으로 지정됩니다.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                      <label className="block text-xs font-bold text-slate-900 dark:text-white">
                        품격 C-Level 티타임 거점 명소 선택
                      </label>
                      <select
                        value={selectedVenue}
                        onChange={(e) => setSelectedVenue(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      >
                        {teaTimeAgenda.recommendedVenues.map((v, idx) => (
                          <option key={idx} value={v.name}>
                            [{v.area}] {v.name} - {v.vibe}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400">
                        조용하고 격조 높은 1:1 비즈니스 회동에 최적화된 프라이빗 라운지입니다.
                      </p>
                    </div>
                  </div>

                  {/* 정중한 초대 서신 프리뷰 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      ✉️ 정중한 일정 조율 초대 서신 초안
                    </div>
                    <pre className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                      {teaInvitationLetter}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: 30초 음성 회고 & 미팅 감사 서신 */}
              {activeTab === 'debrief' && (
                <div className="space-y-5 animate-in fade-in duration-200 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        미팅 직후 회고 및 감사 서신 자동 생성
                      </h3>
                      <p className="text-xs text-slate-500">
                        🎙️ 30초 음성 녹음 또는 ⌨️ 1분 텍스트 요약으로 최근 소통일과 감사 서신 완성
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => setDebriefMode('voice')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            debriefMode === 'voice'
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                          }`}
                        >
                          음성 모드
                        </button>
                        <button
                          onClick={() => setDebriefMode('text')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            debriefMode === 'text'
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                          }`}
                        >
                          텍스트 모드
                        </button>
                      </div>
                      <button
                        onClick={handleSaveDebrief}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs shadow-indigo-600/20"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>회고 저장 & 소통일 갱신</span>
                      </button>
                    </div>
                  </div>

                  {/* 음성 녹음 영역 */}
                  {debriefMode === 'voice' && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-4">
                      <div className="max-w-md mx-auto">
                        <button
                          onClick={handleToggleVoiceRecording}
                          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all cursor-pointer shadow-lg ${
                            isRecording
                              ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40'
                              : 'bg-indigo-600 text-white hover:scale-105 shadow-indigo-600/30'
                          }`}
                        >
                          {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                        </button>
                        <div className="mt-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isRecording ? '녹음 중입니다... 완료 시 다시 클릭하세요' : '버튼을 누르고 30초 회고를 말씀해 주세요'}
                        </div>
                      </div>

                      {voiceTranscript && (
                        <div className="text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                          <span className="text-[11px] font-bold text-slate-400">인식된 음성 텍스트</span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{voiceTranscript}</p>
                        </div>
                      )}

                      {voiceDebriefAnalysis && (
                        <div className="text-left p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                            <span>✨ AI 자동 분석 결과</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                              분위기: {voiceDebriefAnalysis.sentiment}
                            </span>
                          </div>
                          <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                            {voiceDebriefAnalysis.summary}
                          </p>
                          {voiceDebriefAnalysis.actionItems.length > 0 && (
                            <div className="text-xs text-indigo-800 dark:text-indigo-300 space-y-1 pt-1 border-t border-indigo-100 dark:border-indigo-900">
                              <span className="font-bold">추출된 후속 액션 아이템:</span>
                              {voiceDebriefAnalysis.actionItems.map((item, idx) => (
                                <div key={idx} className="pl-2">• {item.task} ({item.dueDate}까지)</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 텍스트 편집 및 감사 서신 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        💌 미팅 감사 & 후속 서신 자동 생성안
                      </div>
                      <button
                        onClick={handleCopyFollowUpLetter}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        {copiedThankYou ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>감사 서신 복사</span>
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={followUpNote}
                      onChange={(e) => setFollowUpNote(e.target.value)}
                      placeholder="미팅에서 나눈 핵심 피드백 또는 후속 조치 사항을 작성해 주세요..."
                      className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: 골든케어 안부 레이더 & 경조사 의전 축전문 */}
              {activeTab === 'care' && (
                <div className="space-y-5 animate-in fade-in duration-200 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentPerson.name}님을 위한 골든케어 & C-Suite 의전
                      </h3>
                      <p className="text-xs text-slate-500">
                        소통 공백(60일+) 선제적 안부 및 승진·영전·혼사·부고 공식 예우
                      </p>
                    </div>
                    <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setCareSubTab('goldencare')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          careSubTab === 'goldencare'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        안부 레이더
                      </button>
                      <button
                        onClick={() => setCareSubTab('protocol')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          careSubTab === 'protocol'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        경조사 의전
                      </button>
                    </div>
                  </div>

                  {/* 골든케어 서브탭 */}
                  {careSubTab === 'goldencare' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            최근 소통 공백: {gapDays}일 경과
                          </span>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            {gapDays >= 60 
                              ? '소통 골든타임(60일)이 도래했습니다. 부담 없는 티타임이나 안부 서신을 건네보세요.'
                              : '아직 관계 온도가 따뜻하게 유지되고 있습니다.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('teatime')}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-xs"
                        >
                          티타임 제안하기
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {goldenCareDrafts.map((draft, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                테마: {draft.themeLabel}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(draft.smsBody);
                                  onShowToast(`'${draft.themeLabel}' 안부 서신이 복사되었습니다.`, 'success');
                                }}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>복사</span>
                              </button>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                              {draft.smsBody}
                            </p>
                            <div className="text-[11px] text-slate-400">
                              상세 요약: <span className="font-semibold text-slate-600 dark:text-slate-300">{draft.summary}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 경조사 의전 서브탭 */}
                  {careSubTab === 'protocol' && protocolMsg && (
                    <div className="space-y-4">
                      {/* 의전 행사 타입 선택 */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {[
                          { id: 'CONDOLENCE' as ProtocolEventType, label: '부고 조의' },
                          { id: 'CONGRATULATION_WEDDING' as ProtocolEventType, label: '혼사 축의' },
                          { id: 'CONGRATULATION_PROMOTION' as ProtocolEventType, label: '승진/영전' },
                          { id: 'HOLIDAY_GREETING' as ProtocolEventType, label: '명절 안부' },
                          { id: 'FOUNDING_ANNIVERSARY' as ProtocolEventType, label: '창립기념일' },
                          { id: 'BIRTHDAY' as ProtocolEventType, label: '생신 축하' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setProtocolType(item.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              protocolType === item.id
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>

                      {/* 김영란법 컴플라이언스 안심 가이드 배너 */}
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            컴플라이언스 분류: {protocolMsg.compliance.categoryLabel}
                          </span>
                        </div>
                        <span className="text-slate-500">
                          화환 한도: {protocolMsg.compliance.wreathLimit}
                        </span>
                      </div>

                      {/* 양식 포맷 탭 & 복사 */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
                            <button
                              onClick={() => setProtocolFormat('formal')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                protocolFormat === 'formal' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
                              }`}
                            >
                              장문 격식 서신
                            </button>
                            <button
                              onClick={() => setProtocolFormat('short')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                protocolFormat === 'short' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
                              }`}
                            >
                              간결 모바일 서신
                            </button>
                            <button
                              onClick={() => setProtocolFormat('ribbon')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                protocolFormat === 'ribbon' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
                              }`}
                            >
                              화환 리본 축문
                            </button>
                          </div>

                          <button
                            onClick={handleCopyProtocolText}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
                          >
                            {copiedProtocol ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>의전 텍스트 복사</span>
                          </button>
                        </div>

                        <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                          {protocolFormat === 'short' ? protocolMsg.shortMessage :
                           protocolFormat === 'ribbon' ? protocolMsg.ribbonCardText :
                           protocolMsg.formalLetter}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
