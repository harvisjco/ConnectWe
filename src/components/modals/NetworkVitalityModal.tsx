import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  Heart, Users, Globe, HelpCircle, X, Check, Copy, Sparkles, 
  Clock, MapPin, Coffee, ShieldCheck, ArrowRight, UserPlus
} from 'lucide-react';
import {
  networkVitalityService,
  SEASON_GREETING_PRESETS
} from '../../services/networkVitalityService';
import {
  VitalityPersonInfo,
  SeasonGreetingType,
  MeetupRoom,
  MeetupParticipant,
  BilingualMeetingSummary,
  PeerProblemTicket,
  ProblemCategory
} from '../../types/networkVitality';

export interface NetworkVitalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'vitality' | 'meetup' | 'bilingual' | 'sos';
  people: Person[];
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const NetworkVitalityModal: React.FC<NetworkVitalityModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'vitality',
  people,
  onSelectPerson: _onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'vitality' | 'meetup' | 'bilingual' | 'sos'>(initialTab);

  // 1. 관계 생명력 탭 상태
  const [selectedSeasonType, setSelectedSeasonType] = useState<SeasonGreetingType>('CHANGE_OF_SEASON');
  const [selectedPersonForGreeting, setSelectedPersonForGreeting] = useState<VitalityPersonInfo | null>(null);
  const [copiedGreetingId, setCopiedGreetingId] = useState<string | null>(null);

  // 2. 밋업 룸 탭 상태
  const [roomCode] = useState('TECH26');
  const [meetupRoom, setMeetupRoom] = useState<MeetupRoom>(() => networkVitalityService.getMeetupRoom('TECH26'));
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [newName, setNewName] = useState('김성우');
  const [newCompany, setNewCompany] = useState('ConnectWe Labs');
  const [newTitle, setNewTitle] = useState('테크 리드');
  const [newRole, setNewRole] = useState<MeetupParticipant['role']>('developer');
  const [newSkills, setNewSkills] = useState('React 19, TypeScript, AI RAG');
  const [newSeeking, setNewSeeking] = useState('엔터프라이즈 B2B 아키텍처');
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);

  // 3. 바이링구얼 미팅 탭 상태
  const [bilingualMeetings] = useState<BilingualMeetingSummary[]>(() => networkVitalityService.getBilingualMeetings());
  const [activeMeeting] = useState<BilingualMeetingSummary>(() => bilingualMeetings[0]);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // 4. 실무 SOS 헬프데스크 탭 상태
  const [tickets, setTickets] = useState<PeerProblemTicket[]>(() => networkVitalityService.getProblemTickets());
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState<ProblemCategory>('infra_cloud');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketMasked, setTicketMasked] = useState(true);
  const [copiedAdviceId, setCopiedAdviceId] = useState<string | null>(null);

  // initialTab 동기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 관계 생명력 계산 목록 및 통계
  const vitalityList = useMemo(() => {
    return networkVitalityService.calculateVitality(people);
  }, [people]);

  const stats = useMemo(() => {
    return networkVitalityService.getVitalityStats(people);
  }, [people]);

  // 초기 안부 대상 인물 설정
  useEffect(() => {
    if (vitalityList.length > 0 && !selectedPersonForGreeting) {
      setSelectedPersonForGreeting(vitalityList[0]);
    }
  }, [vitalityList, selectedPersonForGreeting]);

  if (!isOpen) return null;

  // ------------------------------------------
  // 핸들러 모음
  // ------------------------------------------

  const handleCopySeasonGreeting = (info: VitalityPersonInfo) => {
    const text = networkVitalityService.generateSeasonGreeting(
      info.person,
      selectedSeasonType,
      info.recentGoodNews
    );
    navigator.clipboard.writeText(text);
    setCopiedGreetingId(info.person.id);
    onShowToast(`💌 ${info.person.name} 님께 전송할 시즌 맞춤 안부 서신이 복사되었습니다.`);
    setTimeout(() => setCopiedGreetingId(null), 3000);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onShowToast('이름을 입력해 주세요.');
      return;
    }

    const updated = networkVitalityService.checkInToRoom(roomCode, {
      name: newName,
      company: newCompany,
      title: newTitle,
      role: newRole,
      roleLabel: newRole === 'developer' ? '개발자' : newRole === 'designer' ? '디자이너' : newRole === 'pm' ? 'PO/PM' : '리더',
      skills: newSkills.split(',').map(s => s.trim()).filter(Boolean),
      seekingTopics: newSeeking.split(',').map(s => s.trim()).filter(Boolean),
      vCardAvailable: true
    });

    setMeetupRoom(updated);
    setIsCheckInOpen(false);
    onShowToast(`🎉 [${meetupRoom.title}] 현장 체크인이 완료되었습니다!`);
  };

  const handleCopyBroadcast = () => {
    const text = networkVitalityService.generateMeetupBroadcast(meetupRoom);
    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    onShowToast('📢 밋업 참가자 일괄 감사 안부 서신이 복사되었습니다.');
    setTimeout(() => setCopiedBroadcast(false), 3000);
  };

  const handleCopyEnglishFollowUp = () => {
    const text = networkVitalityService.generateEnglishFollowUp(activeMeeting);
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    onShowToast('🌐 글로벌 파트너 영문 공식 팔로업 서신이 복사되었습니다.');
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim()) {
      onShowToast('실무 난제 제목을 입력해 주세요.');
      return;
    }

    const categoryLabels: Record<ProblemCategory, string> = {
      infra_cloud: '클라우드 & 인프라',
      frontend_ux: '프론트엔드 & UX',
      ai_data: 'AI & 데이터',
      growth_biz: '과금 & 비즈니스'
    };

    const newTicket = networkVitalityService.createProblemTicket({
      title: ticketTitle,
      category: ticketCategory,
      categoryLabel: categoryLabels[ticketCategory],
      description: ticketDesc || '실무 프로덕션 환경에서의 구체적인 난제 조언을 청합니다.',
      confidentialMasked: ticketMasked
    }, people);

    setTickets([newTicket, ...tickets]);
    setIsNewTicketOpen(false);
    setTicketTitle('');
    setTicketDesc('');
    onShowToast('🆘 비공개 실무 SOS 티켓이 등록되고 적임 지인이 매칭되었습니다.');
  };

  const handleCopyAdviceLetter = (ticket: PeerProblemTicket, advisorName: string) => {
    const text = networkVitalityService.generatePeerAdviceLetter(ticket, advisorName);
    navigator.clipboard.writeText(text);
    setCopiedAdviceId(`${ticket.id}-${advisorName}`);
    onShowToast(`💌 ${advisorName} 님께 보낼 15분 자문 요청 서신이 복사되었습니다.`);
    setTimeout(() => setCopiedAdviceId(null), 3000);
  };

  return (
    <div 
      data-testid="network-vitality-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">네트워크 생명력 & 밋업·글로벌 스튜디오</h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Vitality & Meetup Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                소중한 인연의 자연 소멸 방지, 현장 밋업 명함 교환, 글로벌 미팅 브리프, 실무 SOS 자문
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4대 탭 네비게이션 */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-2">
          <button
            data-testid="tab-vitality-radar"
            onClick={() => setActiveTab('vitality')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'vitality'
                ? 'bg-slate-900 border-slate-700 text-emerald-400 border-b-transparent shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Heart className="w-4 h-4 text-emerald-400" />
            <span>1. 관계 생명력 & 안부 레이더</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300">
              {stats.healthyPercentage}% 건강
            </span>
          </button>

          <button
            data-testid="tab-vitality-meetup"
            onClick={() => setActiveTab('meetup')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'meetup'
                ? 'bg-slate-900 border-slate-700 text-sky-400 border-b-transparent shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>2. 현장 밋업 & 컨퍼런스 룸</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-sky-500/20 text-sky-300">
              {meetupRoom.roomCode}
            </span>
          </button>

          <button
            data-testid="tab-vitality-bilingual"
            onClick={() => setActiveTab('bilingual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'bilingual'
                ? 'bg-slate-900 border-slate-700 text-indigo-400 border-b-transparent shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>3. 글로벌 바이링구얼 미팅</span>
          </button>

          <button
            data-testid="tab-vitality-sos"
            onClick={() => setActiveTab('sos')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'sos'
                ? 'bg-slate-900 border-slate-700 text-amber-400 border-b-transparent shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>4. 실무 난제 SOS 헬프데스크</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500/20 text-amber-300">
              {tickets.length}건
            </span>
          </button>
        </div>

        {/* 탭 본문 컨테이너 */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
          
          {/* ========================================================
              탭 1: 관계 생명력 & 안부 레이더
             ======================================================== */}
          {activeTab === 'vitality' && (
            <div className="space-y-6">
              
              {/* 상단 생명력 게이지 & 4단계 통계 배너 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-800/50 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-100">내 인맥 네트워크 건강 지수</span>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {stats.healthyPercentage}% 양호
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    총 {stats.total}명의 소중한 인연 중 {stats.active + stats.stable}명과 안정적으로 교류 중이며, {stats.needsCare + stats.atRisk}명은 따뜻한 안부가 권장됩니다.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>활발 {stats.active}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>안정 {stats.stable}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <span>안부 필요 {stats.needsCare}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span>소원 {stats.atRisk}</span>
                  </div>
                </div>
              </div>

              {/* 시즌별 안부 서신 프리셋 선택 바 */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  어색함 없는 시즌 맞춤 서신 템플릿
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SEASON_GREETING_PRESETS.map(preset => (
                    <button
                      key={preset.type}
                      onClick={() => setSelectedSeasonType(preset.type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        selectedSeasonType === preset.type
                          ? 'bg-emerald-600 text-slate-100 border-emerald-400 shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 공백기 긴 인맥 리스트 & 맞춤 서신 프리뷰 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 좌측: 안부가 필요한 인맥 리스트 */}
                <div className="lg:col-span-6 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>교류 공백기가 긴 소중한 인연 (안부 권장 순)</span>
                    <span className="text-[11px] text-emerald-400">클릭하여 서신 확인</span>
                  </h4>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {vitalityList.map(info => {
                      const isSelected = selectedPersonForGreeting?.person.id === info.person.id;
                      const levelBadge = info.vitalityLevel === 'active' 
                        ? { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: '🟢 활발' }
                        : info.vitalityLevel === 'stable'
                        ? { bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30', label: '🟡 안정' }
                        : info.vitalityLevel === 'needs_care'
                        ? { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: '🟠 안부 권장' }
                        : { bg: 'bg-slate-700/60 text-slate-400 border-slate-600', label: '⚪ 소원 위험' };

                      return (
                        <div
                          key={info.person.id}
                          onClick={() => setSelectedPersonForGreeting(info)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-slate-800 border-emerald-500/50 shadow-md'
                              : 'bg-slate-800/30 border-slate-700/60 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-slate-200">
                              {info.person.name[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-100">{info.person.name}</span>
                                <span className={`px-2 py-0.2 text-[10px] rounded-full border ${levelBadge.bg}`}>
                                  {levelBadge.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{info.person.currentCompany} · {info.person.currentTitle}</p>
                              {info.recentGoodNews && (
                                <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
                                  <Sparkles className="w-3 h-3" /> {info.recentGoodNews}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-slate-200">{info.daysSinceLastContact}일 전</div>
                            <div className="text-[10px] text-slate-500">마지막 접점</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 우측: 선택된 대상 인물 맞춤 서신 1-Click 복사 */}
                <div className="lg:col-span-6 space-y-3">
                  {selectedPersonForGreeting ? (
                    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/80 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                          <div>
                            <span className="text-xs text-slate-400">서신 수신자:</span>
                            <span className="ml-1.5 font-bold text-sm text-slate-100">
                              {selectedPersonForGreeting.person.name} ({selectedPersonForGreeting.person.currentCompany})
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopySeasonGreeting(selectedPersonForGreeting)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                          >
                            {copiedGreetingId === selectedPersonForGreeting.person.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>안부 서신 복사</span>
                          </button>
                        </div>

                        <div className="mt-4">
                          <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                            {networkVitalityService.generateSeasonGreeting(
                              selectedPersonForGreeting.person,
                              selectedSeasonType,
                              selectedPersonForGreeting.recentGoodNews
                            )}
                          </pre>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300 flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>복사 후 카카오톡, 링크드인, 또는 이메일로 전송하면 자연스럽게 인연이 이어집니다.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-800/20 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                      좌측에서 인맥을 선택해 주세요.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              탭 2: 현장 밋업 & 컨퍼런스 네트워킹 룸
             ======================================================== */}
          {activeTab === 'meetup' && (
            <div className="space-y-6">
              
              {/* 상단 룸 정보 & 일괄 안부 방송 버튼 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-800/50 to-indigo-950/30 border border-sky-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">{meetupRoom.title}</h3>
                    <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      코드: {meetupRoom.roomCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>{meetupRoom.location} · 개설자: {meetupRoom.hostName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCheckInOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>현장 체크인하기</span>
                  </button>

                  <button
                    onClick={handleCopyBroadcast}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors"
                  >
                    {copiedBroadcast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>참석자 일괄 감사 서신</span>
                  </button>
                </div>
              </div>

              {/* 체크인 인라인 폼 */}
              {isCheckInOpen && (
                <form onSubmit={handleCheckInSubmit} className="p-5 rounded-2xl bg-slate-800/80 border border-sky-500/40 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                      현장 밋업 룸에 내 디지털 프로필 체크인
                    </h4>
                    <button type="button" onClick={() => setIsCheckInOpen(false)} className="text-slate-400 hover:text-slate-200 text-xs">
                      취소
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">이름</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">소속</label>
                      <input
                        type="text"
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">직함</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">역할</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as MeetupParticipant['role'])}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                      >
                        <option value="developer">개발자 (Engineer)</option>
                        <option value="designer">디자이너 (Designer)</option>
                        <option value="pm">기획자 (PO/PM)</option>
                        <option value="founder">창업가 (Founder)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">보유 스택 (쉼표 구분)</label>
                      <input
                        type="text"
                        value={newSkills}
                        onChange={(e) => setNewSkills(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">현장에서 나누고 싶은 주제</label>
                      <input
                        type="text"
                        value={newSeeking}
                        onChange={(e) => setNewSeeking(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
                    >
                      체크인 완료
                    </button>
                  </div>
                </form>
              )}

              {/* 현재 체크인된 참가자 카드 그리드 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    현재 현장 참여자 ({meetupRoom.participants.length}명)
                  </h4>
                  <span className="text-xs text-slate-400">
                    카드를 클릭하여 디지털 명함(vCard)을 확인하세요.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {meetupRoom.participants.map(p => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-sky-500/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {p.roleLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{p.checkedInAt} 입장</span>
                        </div>

                        <div className="mt-2.5">
                          <h5 className="font-bold text-sm text-slate-100">{p.name}</h5>
                          <p className="text-xs text-slate-400">{p.company} · {p.title}</p>
                        </div>

                        <div className="mt-3">
                          <div className="text-[10px] font-semibold text-slate-400 mb-1">핵심 스택</div>
                          <div className="flex flex-wrap gap-1">
                            {p.skills.map((s, idx) => (
                              <span key={idx} className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-slate-900 text-sky-300 border border-slate-700">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="text-[10px] font-semibold text-slate-400 mb-0.5">관심 주제</div>
                          <p className="text-xs text-slate-300 line-clamp-1">💬 {p.seekingTopics.join(', ')}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 명함 교환 가능
                        </span>
                        <button
                          onClick={() => onShowToast(`📇 ${p.name} 님의 명함 정보가 주소록에 저장되었습니다.`)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700"
                        >
                          명함 받기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              탭 3: 글로벌 바이링구얼 미팅 인텔리전스
             ======================================================== */}
          {activeTab === 'bilingual' && (
            <div className="space-y-6">
              
              {/* 상단 미팅 요약 헤더 & 시차 안내 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-800/50 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Bilingual Intelligence
                    </span>
                    <h3 className="text-base font-bold text-slate-100">{activeMeeting.meetingTitle}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    파트너: {activeMeeting.partnerName} ({activeMeeting.partnerCompany}) · {activeMeeting.partnerTimezone}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    추천 글로벌 최적 미팅 시간대
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    🇰🇷 한국: {activeMeeting.suggestedNextMeetingTime.koreanTime}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    🇺🇸 현지: {activeMeeting.suggestedNextMeetingTime.partnerTime}
                  </div>
                </div>
              </div>

              {/* 국문 C-Level 브리프 & 영문 공식 팔로업 이메일 2-컬럼 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 좌측: 국문 1-Page 경영 브리프 */}
                <div className="lg:col-span-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    국문 C-Level 핵심 합의 사항 & 사양
                  </h4>

                  <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                    <div>
                      <div className="text-xs font-bold text-indigo-300 mb-1.5">1. 핵심 비즈니스 합의 사항</div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {activeMeeting.koreanBrief.keyAgreements.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <div className="text-xs font-bold text-sky-300 mb-1.5">2. 기술 & 프로덕트 세부 사양</div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {activeMeeting.koreanBrief.productSpecs.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <div className="text-xs font-bold text-emerald-300 mb-1.5">3. 다음 액션 아이템 & 타임라인</div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {activeMeeting.koreanBrief.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 우측: 글로벌 에티켓 영문 팔로업 서신 */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      글로벌 표준 에티켓 영문 팔로업 서신
                    </h4>
                    <button
                      onClick={handleCopyEnglishFollowUp}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 transition-colors shadow-sm"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>영문 서신 복사</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Subject: </span>
                      {activeMeeting.englishFollowUpEmail.subject}
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {activeMeeting.englishFollowUpEmail.body}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              탭 4: 크로스 컴퍼니 실무 난제 SOS 헬프데스크
             ======================================================== */}
          {activeTab === 'sos' && (
            <div className="space-y-6">
              
              {/* 상단 안내 & 신규 티켓 등록 버튼 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-800/50 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    크로스 컴퍼니 실무 난제 SOS 헬프데스크
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    사내에선 답이 없고 외부에 묻기 조심스러운 난제를 1촌/2촌 실무 지인에게 15분 티타임으로 자문 구합니다.
                  </p>
                </div>

                <button
                  onClick={() => setIsNewTicketOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>새 실무 난제 등록</span>
                </button>
              </div>

              {/* 신규 티켓 인라인 폼 */}
              {isNewTicketOpen && (
                <form onSubmit={handleCreateTicketSubmit} className="p-5 rounded-2xl bg-slate-800/80 border border-amber-500/40 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      비공개 실무 난제 등록 (대외비 안심 마스킹 지원)
                    </h4>
                    <button type="button" onClick={() => setIsNewTicketOpen(false)} className="text-slate-400 hover:text-slate-200 text-xs">
                      취소
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-300 block mb-1">난제 제목</label>
                      <input
                        type="text"
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        placeholder="예: Stripe 글로벌 결제 수수료 정산 및 인보이스 자동화 이슈"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">분야</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as ProblemCategory)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200"
                      >
                        <option value="infra_cloud">클라우드 & 인프라</option>
                        <option value="frontend_ux">프론트엔드 & UX</option>
                        <option value="ai_data">AI & 데이터</option>
                        <option value="growth_biz">과금 & 비즈니스</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">구체적인 상황 및 막히는 부분</label>
                    <textarea
                      rows={3}
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      placeholder="사내 보안에 위배되지 않는 선에서 어떤 기술/비즈니스 난제로 인해 조언이 필요한지 적어주세요."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ticketMasked}
                        onChange={(e) => setTicketMasked(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500"
                      />
                      <span>대외비 회사명 비공개 마스킹 적용</span>
                    </label>

                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                    >
                      적임 지인 자동 매칭하기
                    </button>
                  </div>
                </form>
              )}

              {/* 등록된 티켓 및 매칭된 지인 리스트 */}
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-750 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {ticket.categoryLabel}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100">{ticket.title}</h4>
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{ticket.description}</p>
                      </div>

                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap self-start">
                        {ticket.status}
                      </span>
                    </div>

                    {/* 매칭된 실무 지인 어드바이저 */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-slate-400">
                        이 문제를 실프로덕션에서 해결해 본 추천 지인:
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ticket.matchedAdvisors.map(adv => {
                          const copyKey = `${ticket.id}-${adv.name}`;
                          const isCopied = copiedAdviceId === copyKey;
                          return (
                            <div key={adv.personId} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-100">{adv.name}</span>
                                  <span className="text-[11px] text-amber-400 font-semibold">{adv.closeness}촌 인맥</span>
                                </div>
                                <p className="text-[11px] text-slate-400">{adv.company} · {adv.title}</p>
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">💡 {adv.provenExperience}</p>
                              </div>

                              <button
                                onClick={() => handleCopyAdviceLetter(ticket, adv.name)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors shrink-0 ml-2"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>15분 자문 서신</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-400" />
            <span>ConnectWe는 소중한 인연이 자연 소멸되지 않고 신뢰로 피어나도록 돕습니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
