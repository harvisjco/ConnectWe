import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import {
  Calendar,
  Clock,
  Compass,
  Heart,
  Briefcase,
  X,
  Check,
  Copy,
  Download,
  MapPin,
  Coffee,
  Sparkles,
  Smile,
  ShieldCheck,
  Send,
  ChevronRight,
  Globe,
  Award
} from 'lucide-react';
import {
  getPresetMeetingLocations,
  generateTimeSlotRecommendations,
  formatTeaTimeProposalLetter,
  generateIcsCalendarFile,
  getGlobalCityClusters,
  findLocalReunionMatches,
  getThoughtfulCapsule,
  saveThoughtfulCapsule,
  generateSmallTalkCueCards,
  getProductShowcases,
  saveProductShowcases,
  formatPortfolioBrief
} from '../../services/executiveEleganceService';
import {
  GlobalCityId,
  ThoughtfulMemoryCapsule,
  ProductShowcaseItem,
  TimeSlotOption
} from '../../types/executiveElegance';

export interface ExecutiveEleganceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'scheduler' | 'trip' | 'memory' | 'showcase';
  people: Person[];
  selectedPerson?: Person | null;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const ExecutiveEleganceModal: React.FC<ExecutiveEleganceModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'scheduler',
  people,
  selectedPerson,
  onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'trip' | 'memory' | 'showcase'>(initialTab);

  // 1. 일정 조율기 상태
  const [targetPersonId, setTargetPersonId] = useState<string>(selectedPerson?.id || (people[0]?.id || 'p-default'));
  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc_gangnam_josun');
  const [meetingTopic, setMeetingTopic] = useState('차기 파트너십 및 기술 로드맵 환담');
  const [copiedProposal, setCopiedProposal] = useState(false);

  // 2. 글로벌 출장 인맥 레이더 상태
  const [selectedCityId, setSelectedCityId] = useState<GlobalCityId>('san_francisco');
  const [tripPurpose, setTripPurpose] = useState('글로벌 엔터프라이즈 파트너십 협의 및 기술 트렌드 파악');
  const [copiedLetterIdx, setCopiedLetterIdx] = useState<number | null>(null);

  // 3. 감동 메모 캡슐 상태
  const [memoryPersonId, setMemoryPersonId] = useState<string>(selectedPerson?.id || (people[0]?.id || 'p-default'));
  const [currentCapsule, setCurrentCapsule] = useState<ThoughtfulMemoryCapsule>(() =>
    getThoughtfulCapsule(selectedPerson?.id || 'p-default', selectedPerson?.name || '소중한 인연')
  );
  const [isEditingMemory, setIsEditingMemory] = useState(false);
  const [copiedCueId, setCopiedCueId] = useState<string | null>(null);

  // 4. 프로덕트 쇼케이스 상태
  const [showcases, setShowcases] = useState<ProductShowcaseItem[]>(() => getProductShowcases());
  const [selectedShowcaseId, setSelectedShowcaseId] = useState<string>(showcases[0]?.id || 'prod_connectwe_graph');
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [isNewShowcaseOpen, setIsNewShowcaseOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newSolved, setNewSolved] = useState('');
  const [newMetrics, setNewMetrics] = useState('');

  // 탭 초기화 및 선택 인맥 동기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (selectedPerson) {
        setTargetPersonId(selectedPerson.id);
        setMemoryPersonId(selectedPerson.id);
        setCurrentCapsule(getThoughtfulCapsule(selectedPerson.id, selectedPerson.name));
      } else if (people.length > 0) {
        setTargetPersonId(people[0].id);
        setMemoryPersonId(people[0].id);
        setCurrentCapsule(getThoughtfulCapsule(people[0].id, people[0].name));
      }
    }
  }, [isOpen, initialTab, selectedPerson, people]);

  // 타깃 인물 객체
  const activeTargetPerson = useMemo(() => {
    return people.find((p) => p.id === targetPersonId) || people[0] || {
      id: 'p-default',
      name: '대표님',
      currentCompany: '비즈니스 파트너사',
      currentTitle: 'CEO / Founder',
    };
  }, [people, targetPersonId]);

  // 메모 타깃 인물 객체
  const activeMemoryPerson = useMemo(() => {
    return people.find((p) => p.id === memoryPersonId) || people[0] || {
      id: 'p-default',
      name: '소중한 파트너',
      currentCompany: '파트너사',
      currentTitle: '이사/총괄',
    };
  }, [people, memoryPersonId]);

  // 메모 대상 변경 시 캡슐 로드
  useEffect(() => {
    if (memoryPersonId) {
      setCurrentCapsule(getThoughtfulCapsule(memoryPersonId, activeMemoryPerson.name));
    }
  }, [memoryPersonId, activeMemoryPerson]);

  const presetLocations = useMemo(() => getPresetMeetingLocations(), []);
  const selectedLocation = useMemo(
    () => presetLocations.find((l) => l.id === selectedLocationId) || presetLocations[0],
    [presetLocations, selectedLocationId]
  );

  const recommendedSlots = useMemo(() => {
    return generateTimeSlotRecommendations(activeTargetPerson.name);
  }, [activeTargetPerson.name]);

  const proposalLetter = useMemo(() => {
    return formatTeaTimeProposalLetter(
      activeTargetPerson.name,
      activeTargetPerson.currentCompany || '',
      meetingTopic,
      recommendedSlots,
      selectedLocation
    );
  }, [activeTargetPerson, meetingTopic, recommendedSlots, selectedLocation]);

  const cityClusters = useMemo(() => getGlobalCityClusters(), []);
  const localReunionMatches = useMemo(() => {
    return findLocalReunionMatches(selectedCityId, people);
  }, [selectedCityId, people]);

  const cueCards = useMemo(() => {
    return generateSmallTalkCueCards(currentCapsule);
  }, [currentCapsule]);

  const activeShowcase = useMemo(() => {
    return showcases.find((s) => s.id === selectedShowcaseId) || showcases[0];
  }, [showcases, selectedShowcaseId]);

  if (!isOpen) return null;

  // ------------------------------------------
  // 핸들러 모음
  // ------------------------------------------

  // 티타임 서신 복사
  const handleCopyProposal = () => {
    navigator.clipboard.writeText(proposalLetter);
    setCopiedProposal(true);
    onShowToast('C-Level 품격의 티타임 제안 서신이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedProposal(false), 2500);
  };

  // .ICS 캘린더 파일 다운로드
  const handleDownloadIcs = (slot: TimeSlotOption) => {
    const icsData = generateIcsCalendarFile({
      title: `${activeTargetPerson.name}님과의 비즈니스 티타임 (${meetingTopic})`,
      description: `소중한 신뢰 기반 환담 일정입니다.\n\n주제: ${meetingTopic}\n장소: ${selectedLocation.placeName} (${selectedLocation.address})`,
      location: `${selectedLocation.placeName}, ${selectedLocation.address}`,
      startIso: slot.startIso,
      endIso: slot.endIso,
    });

    const blob = new Blob([icsData.icsString], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', icsData.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`표준 캘린더 파일(${icsData.filename})이 다운로드되었습니다.`);
  };

  // 출장 조우 서신 복사
  const handleCopyReunionLetter = (letter: string, idx: number) => {
    navigator.clipboard.writeText(letter);
    setCopiedLetterIdx(idx);
    onShowToast('현지 조우(Reunion) 제안 서신이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedLetterIdx(null), 2500);
  };

  // 감동 메모 캡슐 저장
  const handleSaveMemoryCapsule = () => {
    saveThoughtfulCapsule(currentCapsule);
    setIsEditingMemory(false);
    onShowToast(`${currentCapsule.personName}님의 소소한 감동 메모 캡슐이 안전하게 저장되었습니다.`);
  };

  // 스몰톡 큐카드 복사
  const handleCopyCueCard = (question: string, id: string) => {
    navigator.clipboard.writeText(question);
    setCopiedCueId(id);
    onShowToast('스몰톡 오프닝 질문이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedCueId(null), 2000);
  };

  // 포트폴리오 1-Page 브리프 복사
  const handleCopyPortfolioBrief = () => {
    if (!activeShowcase) return;
    const brief = formatPortfolioBrief(activeShowcase);
    navigator.clipboard.writeText(brief);
    setCopiedBrief(true);
    onShowToast('1-Page 포트폴리오 요약 브리프가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  // 쇼케이스 추천(동료 검증) 증가
  const handleEndorseShowcase = (id: string) => {
    const updated = showcases.map((s) =>
      s.id === id ? { ...s, endorsementCount: s.endorsementCount + 1 } : s
    );
    setShowcases(updated);
    saveProductShowcases(updated);
    onShowToast('동료 실전 검증 신뢰 응원이 등록되었습니다.');
  };

  // 새 쇼케이스 등록
  const handleCreateShowcase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ProductShowcaseItem = {
      id: `prod_${Date.now()}`,
      title: newTitle,
      tagline: newTagline || '혁신적인 기술 기반 비즈니스 솔루션',
      category: 'b2b_saas',
      categoryLabel: 'B2B SaaS / 엔터프라이즈',
      keyChallengeSolved: newSolved || '비즈니스 현장의 고질적인 병목 해소',
      architectureHighlights: ['TypeScript 기반 확장형 아키텍처', '보안 및 안정성 강화 파이프라인'],
      metricsSummary: newMetrics || '프로세스 효율 35% 향상',
      techStack: ['React', 'TypeScript', 'Node.js'],
      contributors: [{ name: '본인', role: '핵심 설계 및 구현 리드', isVerified: true }],
      endorsementCount: 1,
    };

    const nextList = [newItem, ...showcases];
    setShowcases(nextList);
    saveProductShowcases(nextList);
    setSelectedShowcaseId(newItem.id);
    setIsNewShowcaseOpen(false);
    setNewTitle('');
    setNewTagline('');
    setNewSolved('');
    setNewMetrics('');
    onShowToast(`'${newItem.title}' 쇼케이스가 등록되었습니다.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      data-testid="executive-elegance-modal"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col overflow-hidden">
        
        {/* 상단 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  비즈니스 품격 & 글로벌 쇼케이스 스튜디오
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                  Executive Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                기계적 캘린더 링크를 넘어 품격 있는 3선 시간대 서신, 거점 출장 인맥 매핑, 감동 메모 캡슐 및 검증 쇼케이스
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="닫기"
            data-testid="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('scheduler')}
            data-testid="tab-scheduler"
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'scheduler'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>비즈니스 티타임 조율기 & .ICS</span>
          </button>
          <button
            onClick={() => setActiveTab('trip')}
            data-testid="tab-trip"
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'trip'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>글로벌 출장 & 인맥 레이더</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            data-testid="tab-memory"
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'memory'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>감동 메모 캡슐 & 스몰톡 큐카드</span>
          </button>
          <button
            onClick={() => setActiveTab('showcase')}
            data-testid="tab-showcase"
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'showcase'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>내 프로덕트 쇼케이스 & 검증</span>
          </button>
        </div>

        {/* 탭 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          
          {/* TAB 1: 비즈니스 품격 일정 조율기 & .ICS */}
          {activeTab === 'scheduler' && (
            <div className="space-y-6 animate-fade-in" data-testid="scheduler-tab-content">
              {/* 상단 설정 바 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    환담 상대방 선택
                  </label>
                  <select
                    value={targetPersonId}
                    onChange={(e) => setTargetPersonId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    data-testid="scheduler-person-select"
                  >
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currentCompany || '파트너사'} - {p.currentTitle || '리더'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    대화 핵심 주제
                  </label>
                  <input
                    type="text"
                    value={meetingTopic}
                    onChange={(e) => setMeetingTopic(e.target.value)}
                    placeholder="예: AI 모델 서빙 최적화 협력, 차기 펀드 조성 환담"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    data-testid="scheduler-topic-input"
                  />
                </div>
              </div>

              {/* 4대 정숙한 미팅 장소 가이드 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    조용하고 품격 있는 추천 비즈니스 라운지 거점
                  </h3>
                  <span className="text-xs text-slate-500">주차 및 대화 정숙도 사전 검증 완료</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {presetLocations.map((loc) => {
                    const isSelected = loc.id === selectedLocationId;
                    return (
                      <div
                        key={loc.id}
                        onClick={() => setSelectedLocationId(loc.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 dark:border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                        data-testid={`location-card-${loc.zone}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {loc.zoneLabel}
                          </span>
                          {loc.parkingAvailable && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              주차 완비
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {loc.placeName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {loc.address}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Coffee className="w-3 h-3" />
                          <span>{loc.atmosphereBadge}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3대 추천 시간대 & .ICS 다운로드 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    상대방의 일정을 배려한 3대 추천 시간대
                  </h3>
                  <span className="text-xs text-slate-500">클릭 시 즉시 RFC 5545 표준 .ICS 캘린더 다운로드</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recommendedSlots.map((slot, idx) => (
                    <div
                      key={slot.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-slate-400">소요 시간: 45분 권장</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {slot.dateTimeLabel}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadIcs(slot)}
                        className="mt-3 w-full py-1.5 px-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                        data-testid={`download-ics-btn-${idx}`}
                      >
                        <Download className="w-3.5 h-3.5 text-amber-600" />
                        <span>.ICS 캘린더 다운로드</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 완성된 C-Level 티타임 제안 서신 프리뷰 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      원클릭 복사용 품격 제안 서신 프리뷰
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyProposal}
                    className="py-1.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    data-testid="copy-proposal-btn"
                  >
                    {copiedProposal ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedProposal ? '복사 완료!' : '제안 서신 복사'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {proposalLetter}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 글로벌 출장 & 지방 외근 지능형 인맥 레이더 */}
          {activeTab === 'trip' && (
            <div className="space-y-6 animate-fade-in" data-testid="trip-tab-content">
              {/* 도시 선택 배너 */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    출장 및 외근 목적지 거점 선택
                  </h3>
                  <span className="text-xs text-slate-500">8대 전략 테크·금융 클러스터</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {cityClusters.map((cluster) => {
                    const isSelected = cluster.id === selectedCityId;
                    return (
                      <button
                        key={cluster.id}
                        onClick={() => setSelectedCityId(cluster.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        data-testid={`city-cluster-btn-${cluster.id}`}
                      >
                        <span className="text-2xl">{cluster.flagEmoji}</span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {cluster.name.split('/')[0]}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {cluster.timezoneLabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    출장/외근 목적 및 핵심 아젠다
                  </label>
                  <input
                    type="text"
                    value={tripPurpose}
                    onChange={(e) => setTripPurpose(e.target.value)}
                    placeholder="예: 투자 라운드 클로징 및 기술 파트너십 구축"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    data-testid="trip-purpose-input"
                  />
                </div>
              </div>

              {/* 현지 인맥 매칭 결과 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    현지 조우(Reunion) 추천 인맥 ({localReunionMatches.length}명)
                  </h3>
                  <span className="text-xs text-slate-500">과거 협업 맥락 및 시너지 기반 스마트 매칭</span>
                </div>

                <div className="space-y-3">
                  {localReunionMatches.map((match, idx) => {
                    const isCopied = copiedLetterIdx === idx;
                    return (
                      <div
                        key={match.person.id || idx}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between"
                        data-testid={`trip-match-card-${idx}`}
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base font-bold text-slate-900 dark:text-white">
                              {match.person.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {match.currentCompany} · {match.currentTitle}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md">
                              신뢰도 {match.closeness}점
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300">
                            <strong>추천 시너지:</strong> {match.reunionReason}
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                            {match.invitationLetterTemplate}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleCopyReunionLetter(match.invitationLetterTemplate, idx)}
                            className="w-full md:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            data-testid={`copy-reunion-letter-btn-${idx}`}
                          >
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{isCopied ? '서신 복사 완료' : '조우 서신 복사'}</span>
                          </button>
                          {onSelectPerson && (
                            <button
                              onClick={() => onSelectPerson(match.person)}
                              className="w-full md:w-auto py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>프로필 상세 보기</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 소소한 감동 메모 캡슐 & 스몰톡 큐카드 */}
          {activeTab === 'memory' && (
            <div className="space-y-6 animate-fade-in" data-testid="memory-tab-content">
              {/* 인맥 선택 */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    감동 메모 대상:
                  </label>
                  <select
                    value={memoryPersonId}
                    onChange={(e) => setMemoryPersonId(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    data-testid="memory-person-select"
                  >
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currentCompany || '파트너사'})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setIsEditingMemory(!isEditingMemory)}
                  className="py-1.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  data-testid="toggle-edit-memory-btn"
                >
                  {isEditingMemory ? '편집 취소' : '메모 직접 수정'}
                </button>
              </div>

              {/* 메모 캡슐 카드 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-600" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {currentCapsule.personName}님의 소소한 감동 메모 캡슐
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">최근 업데이트: {currentCapsule.lastUpdated}</span>
                </div>

                {isEditingMemory ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ☕ 커피 / 차 취향 (온도, 원두, 디카페인 여부 등)
                      </label>
                      <input
                        type="text"
                        value={currentCapsule.coffeePreference}
                        onChange={(e) => setCurrentCapsule({ ...currentCapsule, coffeePreference: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
                        data-testid="edit-coffee-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        🏃 주말 취미 & 리프레시 루틴
                      </label>
                      <input
                        type="text"
                        value={currentCapsule.weekendHobby}
                        onChange={(e) => setCurrentCapsule({ ...currentCapsule, weekendHobby: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        💡 즐겨 나누는 지적 토론 주제
                      </label>
                      <input
                        type="text"
                        value={currentCapsule.favoriteDiscussionTopic}
                        onChange={(e) => setCurrentCapsule({ ...currentCapsule, favoriteDiscussionTopic: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        🎉 가족 경사 / 최근 반가운 소식 (선택)
                      </label>
                      <input
                        type="text"
                        value={currentCapsule.familyMilestone || ''}
                        onChange={(e) => setCurrentCapsule({ ...currentCapsule, familyMilestone: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <button
                      onClick={handleSaveMemoryCapsule}
                      className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      data-testid="save-memory-btn"
                    >
                      <Check className="w-4 h-4" />
                      <span>메모 캡슐 저장</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block mb-1">☕ 커피 / 차 취향</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{currentCapsule.coffeePreference}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1">🏃 주말 취미 & 루틴</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{currentCapsule.weekendHobby}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">💡 지적 대화 관심사</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{currentCapsule.favoriteDiscussionTopic}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">🎁 추천 배려 선물</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {currentCapsule.recentGiftRecommendation.giftName} ({currentCapsule.recentGiftRecommendation.brand})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {currentCapsule.recentGiftRecommendation.reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 미팅 5분 전 4대 스몰톡 큐카드 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Smile className="w-4 h-4 text-rose-600" />
                    미팅 5분 전 어색함 없는 4대 스몰톡 큐카드
                  </h3>
                  <span className="text-xs text-slate-500">원클릭으로 질문 문구 복사</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cueCards.map((card) => {
                    const isCopied = copiedCueId === card.id;
                    return (
                      <div
                        key={card.id}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                        data-testid={`cue-card-${card.category}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md">
                              {card.categoryLabel}
                            </span>
                            <button
                              onClick={() => handleCopyCueCard(card.icebreakerQuestion, card.id)}
                              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                              data-testid={`copy-cue-btn-${card.category}`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? '복사됨' : '복사'}</span>
                            </button>
                          </div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {card.icebreakerQuestion}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          Tip: {card.tip}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 내 프로덕트 & 프로젝트 레퍼런스 쇼케이스 */}
          {activeTab === 'showcase' && (
            <div className="space-y-6 animate-fade-in" data-testid="showcase-tab-content">
              {/* 상단 액션 및 리스트 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    실전 검증 프로덕트 & 아키텍처 쇼케이스
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    말로만 하는 주장이 아닌 실제 론칭한 프로덕트와 동료 검증 뱃지가 담긴 레퍼런스
                  </p>
                </div>
                <button
                  onClick={() => setIsNewShowcaseOpen(true)}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  data-testid="new-showcase-btn"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>새 프로덕트 등록</span>
                </button>
              </div>

              {/* 신규 등록 폼 모달 */}
              {isNewShowcaseOpen && (
                <form
                  onSubmit={handleCreateShowcase}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-500 shadow-md space-y-3"
                  data-testid="new-showcase-form"
                >
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    신규 프로덕트 쇼케이스 등록
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="프로덕트 / 시스템 명칭"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                      data-testid="showcase-title-input"
                      required
                    />
                    <input
                      type="text"
                      placeholder="한 줄 설명"
                      value={newTagline}
                      onChange={(e) => setNewTagline(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="해결한 핵심 문제"
                      value={newSolved}
                      onChange={(e) => setNewSolved(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="정량적 임팩트 / 실측 수치"
                      value={newMetrics}
                      onChange={(e) => setNewMetrics(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewShowcaseOpen(false)}
                      className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                      data-testid="submit-new-showcase-btn"
                    >
                      등록 완료
                    </button>
                  </div>
                </form>
              )}

              {/* 쇼케이스 카드 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {showcases.map((item) => {
                  const isSelected = item.id === selectedShowcaseId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedShowcaseId(item.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                      data-testid={`showcase-card-${item.id}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.categoryLabel}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            {item.endorsementCount} 검증
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {item.tagline}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>{item.techStack.slice(0, 3).join(', ')}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 선택된 쇼케이스 상세 및 1-Page 포트폴리오 브리프 */}
              {activeShowcase && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          {activeShowcase.title}
                        </h4>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md">
                          {activeShowcase.categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {activeShowcase.tagline}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEndorseShowcase(activeShowcase.id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                        data-testid="endorse-btn"
                      >
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>신뢰 검증 응원 ({activeShowcase.endorsementCount})</span>
                      </button>
                      <button
                        onClick={handleCopyPortfolioBrief}
                        className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        data-testid="copy-portfolio-brief-btn"
                      >
                        {copiedBrief ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedBrief ? '복사 완료' : '1-Page 브리프 복사'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          🎯 해결한 핵심 과제
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {activeShowcase.keyChallengeSolved}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                          📈 정량적 실측 성과 (Fact-Grounded)
                        </span>
                        <p className="text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
                          {activeShowcase.metricsSummary}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          🏗️ 핵심 아키텍처 하이라이트
                        </span>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                          {activeShowcase.architectureHighlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          👥 실전 검증 동료 & 기여자
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {activeShowcase.contributors.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {c.name} ({c.role})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* 하단 푸터 바 */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ConnectWe 인간 중심 설계 & 비즈니스 품격 헌장 준수</span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
