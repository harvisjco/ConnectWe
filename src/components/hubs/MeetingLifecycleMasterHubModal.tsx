import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { MeetingHubTab } from '../../types/masterHub';
import {
  Calendar,
  Sparkles,
  Mic,
  CheckCircle2,
  Check,
  Copy,
  Download,
  X,
  Coffee,
  Heart,
  Send,
  ListTodo
} from 'lucide-react';
import {
  generateTimeSlotRecommendations,
  formatTeaTimeProposalLetter,
  getPresetMeetingLocations,
  getThoughtfulCapsule,
  saveThoughtfulCapsule
} from '../../services/executiveEleganceService';
import { ThoughtfulMemoryCapsule } from '../../types/executiveElegance';
import { downloadIcsFile } from '../../services/meetingAgendaService';
import {
  DEFAULT_MEETUP_ROOM
} from '../../services/networkVitalityService';
import {
  generateMeetingReminderBrief,
  getSavedFollowUps,
  toggleCommitmentComplete
} from '../../services/meetingGuardGovernanceService';
import { MeetingFollowUpBrief } from '../../types/meetingGuardGovernance';

export interface MeetingLifecycleMasterHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: MeetingHubTab | string;
  people: Person[];
  selectedPerson?: Person | null;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const MeetingLifecycleMasterHubModal: React.FC<MeetingLifecycleMasterHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'schedule',
  people,
  selectedPerson,
  onSelectPerson: _onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<MeetingHubTab>(
    (initialTab as MeetingHubTab) || 'schedule'
  );

  useEffect(() => {
    if (isOpen && initialTab) {
      if (['schedule', 'brief', 'meetup', 'debrief', 'followup'].includes(initialTab)) {
        setActiveTab(initialTab as MeetingHubTab);
      }
    }
  }, [isOpen, initialTab]);

  // ESC 키 닫기 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 대상 인맥 (선택된 인맥 우선, 없으면 첫 번째 인맥)
  const targetPerson = useMemo(() => {
    return selectedPerson || people[0] || {
      id: 'p-default',
      name: '이수진',
      currentCompany: '카카오모빌리티',
      currentTitle: '최고기술책임자',
      primaryDomain: '모빌리티 플랫폼 & AI',
      skills: ['AI 에이전트', '대용량 트래픽', '시스템 아키텍처'],
      phone: '010-1234-5678',
      email: 'sujin@example.com'
    } as unknown as Person;
  }, [selectedPerson, people]);

  // 1. 일정 조율 상태
  const timeSlots = useMemo(() => generateTimeSlotRecommendations(targetPerson.name), [targetPerson]);
  const locations = useMemo(() => getPresetMeetingLocations(), []);
  const [selectedLocationId] = useState(locations[0]?.id || '');
  const selectedLocation = useMemo(() => locations.find(l => l.id === selectedLocationId) || locations[0], [locations, selectedLocationId]);

  const proposalLetter = useMemo(() => {
    return formatTeaTimeProposalLetter(
      targetPerson.name,
      targetPerson.currentCompany,
      '최근 AI 에이전트 도입 및 플랫폼 아키텍처 혁신 방향',
      timeSlots,
      selectedLocation
    );
  }, [targetPerson, timeSlots, selectedLocation]);

  const [copiedScheduleLetter, setCopiedScheduleLetter] = useState(false);

  // 2. 미팅 5분 전 브리프 상태
  const reminderBrief = useMemo(() => {
    return generateMeetingReminderBrief(targetPerson, '내일 오후 3:00', selectedLocation?.placeName || '강남 라운지');
  }, [targetPerson, selectedLocation]);

  // 3. 현장 만남 & 감동 비망록 상태
  const [capsule, setCapsule] = useState(() => getThoughtfulCapsule(targetPerson.id));
  const [newMemoryNote, setNewMemoryNote] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<'family' | 'preference' | 'milestone' | 'quote'>('preference');

  // 4. 회고 & 감사 서신 상태
  const [debriefNotes, setDebriefNotes] = useState('');
  const [copiedDebriefLetter, setCopiedDebriefLetter] = useState(false);

  // 5. 사후 팔로업 트래커 상태
  const [followUps, setFollowUps] = useState<MeetingFollowUpBrief[]>(() => getSavedFollowUps());

  if (!isOpen) return null;

  // 일정 제안 서신 복사
  const handleCopyScheduleLetter = () => {
    navigator.clipboard.writeText(proposalLetter);
    setCopiedScheduleLetter(true);
    onShowToast('정중한 3선 티타임 제안 서신이 복사되었습니다.');
    setTimeout(() => setCopiedScheduleLetter(false), 2500);
  };

  // .ICS 캘린더 파일 다운로드
  const handleDownloadIcs = (slotIdx: number) => {
    const slot = timeSlots[slotIdx];
    if (!slot) return;
    downloadIcsFile({
      title: `${targetPerson.name}님과의 비즈니스 티타임`,
      description: `ConnectWe 품격 티타임\n참석자: ${targetPerson.name} (${targetPerson.currentCompany} ${targetPerson.currentTitle})\n장소: ${selectedLocation.placeName} (${selectedLocation.address})`,
      location: `${selectedLocation.placeName} (${selectedLocation.address})`,
      startDate: new Date(slot.startIso),
      durationMinutes: 60,
      attendeeName: targetPerson.name,
      attendeeEmail: targetPerson.email || 'partner@example.com'
    });
    onShowToast('애플/구글/아웃룩 캘린더에 원클릭 등록할 수 있는 .ics 파일이 다운로드되었습니다.');
  };

  // 감동 메모 저장
  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryNote.trim()) return;
    const updatedCapsule: ThoughtfulMemoryCapsule = {
      ...capsule,
      personId: targetPerson.id,
      personName: targetPerson.name,
      coffeePreference: newMemoryCategory === 'preference' ? newMemoryNote : capsule.coffeePreference,
      weekendHobby: newMemoryCategory === 'milestone' ? newMemoryNote : capsule.weekendHobby,
      favoriteDiscussionTopic: newMemoryCategory === 'quote' ? newMemoryNote : capsule.favoriteDiscussionTopic,
      familyMilestone: newMemoryCategory === 'family' ? newMemoryNote : capsule.familyMilestone,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    saveThoughtfulCapsule(updatedCapsule);
    setCapsule(updatedCapsule);
    setNewMemoryNote('');
    onShowToast(`${targetPerson.name}님과의 소중한 비망록이 안전하게 보관되었습니다.`);
  };

  // 팔로업 약속 완료 토글
  const handleToggleCommitment = (followUpId: string, commitmentId: string) => {
    const updated = toggleCommitmentComplete(followUpId, commitmentId);
    setFollowUps(updated);
    onShowToast('약속 이행 상태가 변경되었습니다.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-hub-title"
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hub Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-amber-900/10 via-rose-900/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="meeting-hub-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  미팅 & 관계 라이프사이클 마스터 허브
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  Full Lifecycle
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                3선 일정 조율 및 .ICS 발송, 사전 브리프, 현장 밋업과 감동 비망록, 회고 및 3분 사후 팔로업을 완결합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Hub Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('schedule')}
            data-testid="tab-hub-schedule"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. 일정 조율 & .ICS</span>
          </button>

          <button
            onClick={() => setActiveTab('brief')}
            data-testid="tab-hub-brief"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'brief'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>2. 5분 전 브리프</span>
          </button>

          <button
            onClick={() => setActiveTab('meetup')}
            data-testid="tab-hub-meetup"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'meetup'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>3. 현장 밋업 & 비망록</span>
          </button>

          <button
            onClick={() => setActiveTab('debrief')}
            data-testid="tab-hub-debrief"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'debrief'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>4. 회고 & 감사 서신</span>
          </button>

          <button
            onClick={() => setActiveTab('followup')}
            data-testid="tab-hub-followup"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'followup'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>5. 3분 사후 팔로업</span>
          </button>
        </div>

        {/* Hub Body (Tab Panels) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: 1. 일정 조율 & .ICS */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 대상 인맥 배너 */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                    {targetPerson.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{targetPerson.name}</span>
                      <span className="text-xs text-slate-500">{targetPerson.currentCompany} · {targetPerson.currentTitle}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">티타임 일정 조율 대상</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyScheduleLetter}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    {copiedScheduleLetter ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>3선 제안 서신 복사</span>
                  </button>
                </div>
              </div>

              {/* 3선 슬롯 카드 및 원클릭 .ICS 다운로드 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500">상대방 부담을 덜어주는 3대 추천 시간대</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {timeSlots.map((slot, idx) => (
                    <div
                      key={slot.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          옵션 {idx + 1}
                        </span>
                        <button
                          onClick={() => handleDownloadIcs(idx)}
                          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>.ICS 파일</span>
                        </button>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{slot.dateTimeLabel}</p>
                      <p className="text-xs text-slate-500">{slot.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 제안 서신 미리보기 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-500">자동 포맷팅된 정중한 티타임 서신 미리보기</span>
                <pre className="p-3 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans border border-slate-200/60 dark:border-slate-700/60">
                  {proposalLetter}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: 2. 5분 전 브리프 */}
          {activeTab === 'brief' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {targetPerson.name}님과의 미팅 5분 전 1-Page 스마트 브리프
                      </h3>
                      <p className="text-xs text-slate-400">
                        {targetPerson.currentCompany} · {targetPerson.currentTitle}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-indigo-300 border border-white/20">
                    리마인더 동기화 완비
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-300">24시간 전 사전 리마인더 문안</h4>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {reminderBrief.reminders.hours24Before}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-amber-300">2시간 전 당일 환담 문안</h4>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {reminderBrief.reminders.hours2Before}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 3. 현장 밋업 & 비망록 */}
          {activeTab === 'meetup' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 즉석 밋업 룸 카드 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      현장 즉석 비접촉 밋업 룸 ({DEFAULT_MEETUP_ROOM.title})
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    코드: {DEFAULT_MEETUP_ROOM.roomCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  위치: {DEFAULT_MEETUP_ROOM.location} · 현재 참가자 {DEFAULT_MEETUP_ROOM.participants.length}명 대기 중
                </p>
              </div>

              {/* 감동 메모 캡슐 기록 폼 */}
              <form onSubmit={handleSaveMemory} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>{targetPerson.name}님을 위한 감동 메모 캡슐 (기념일/취향/가족 비망록)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select
                    value={newMemoryCategory}
                    onChange={(e) => setNewMemoryCategory(e.target.value as any)}
                    className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="preference">☕ 취향·기호 (음료, 식당 등)</option>
                    <option value="family">👨‍👩‍👧 가족·기념일</option>
                    <option value="milestone">🏆 커리어 마일스톤</option>
                    <option value="quote">💬 인상 깊었던 한마디</option>
                  </select>

                  <input
                    type="text"
                    value={newMemoryNote}
                    onChange={(e) => setNewMemoryNote(e.target.value)}
                    placeholder="소중한 메모 (예: 차가운 디카페인 오트라떼 선호, 이번 주말 둘째 생일)"
                    className="sm:col-span-3 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    비망록 저장
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: 4. 회고 & 감사 서신 */}
          {activeTab === 'debrief' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mic className="w-4 h-4 text-indigo-600" />
                    <span>30초 미팅 회고 및 감사 서신 생성기</span>
                  </h3>
                  <span className="text-xs text-slate-400">한국 비즈니스 에티켓 완비</span>
                </div>

                <textarea
                  value={debriefNotes}
                  onChange={(e) => setDebriefNotes(e.target.value)}
                  placeholder="오늘 미팅에서 나눈 핵심 이야기나 약속한 사항을 자유롭게 적어보세요. (예: 다음 달 파트너십 제안서 공유, 이수진 이사님 소개 주선)"
                  rows={4}
                  className="w-full p-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 leading-relaxed"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const thanksMsg = `[ConnectWe 미팅 감사 인사]\n${targetPerson.name}님, 오늘 바쁘신 와중에도 귀한 시간 내어주셔서 진심으로 감사드립니다.\n오늘 나누어 주신 '${debriefNotes || '기술 아키텍처 및 파트너십 발전 방안'}'에 대한 혜안 덕분에 큰 영감을 얻었습니다.\n말씀드린 사항은 꼼꼼히 정리하여 다음 주 중으로 다시 연락드리겠습니다. 편안한 저녁 보내십시오.`;
                      navigator.clipboard.writeText(thanksMsg);
                      setCopiedDebriefLetter(true);
                      onShowToast('미팅 당일 저녁 감사 서신이 복사되었습니다.');
                      setTimeout(() => setCopiedDebriefLetter(false), 2500);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    {copiedDebriefLetter ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    <span>저녁 감사 서신 복사</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 5. 3분 사후 팔로업 */}
          {activeTab === 'followup' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-emerald-600" />
                      <span>3분 사후 약속 이행 트래커 & 리마인더</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      미팅에서 구두로 약속한 자료 송부 및 인맥 소개 약속을 철저히 이행하여 신뢰를 극대화합니다.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {followUps.map((fu) => (
                    <div
                      key={fu.id}
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {fu.personName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">미팅일: {fu.meetingDate}</span>
                      </div>

                      <div className="space-y-1.5">
                        {fu.commitments.map((com) => (
                          <div
                            key={com.id}
                            onClick={() => handleToggleCommitment(fu.id, com.id)}
                            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                          >
                            <input
                              type="checkbox"
                              checked={com.isCompleted}
                              onChange={() => {}}
                              className="rounded text-emerald-600 cursor-pointer"
                            />
                            <span className={com.isCompleted ? 'line-through text-slate-400' : 'font-medium'}>
                              {com.text}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">({com.deadline})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hub Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>엔드투엔드 미팅 라이프사이클 엔진 활성화됨</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-semibold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
