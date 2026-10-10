import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { Gathering, BirthdayContact } from '../../types/community';
import { UserRole } from '../../types/userRole';
import { 
  extractAlumniGroups, 
  getUpcomingBirthdays, 
  loadGatherings, 
  saveGatherings, 
  toggleJoinGathering, 
  generateBirthdayMessage,
  markBirthdayCongratulated 
} from '../../services/communityService';
import { 
  Users, Cake, Calendar, Plus, Search, 
  Check, Copy, Phone, Mail, 
  GraduationCap, Clock, MapPin, DollarSign, Camera, Sparkles, Rocket, Coffee,
  Award, Heart, ShieldCheck
} from 'lucide-react';
import { ViewHeader } from '../ui';
import { GovernanceHubTab, TalentHubTab, MeetingHubTab } from '../../types/masterHub';
import { isPureChoseong, matchChoseong } from '../../utils/koreanUtils';
import { PersonMiniPreviewTooltip } from '../common/PersonMiniPreviewTooltip';
import { getExecutiveStatusBadge } from '../../services/executiveToneService';

interface GeneralMemberViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenAddModal: () => void;
  onOpenCardScanner?: () => void;
  onOpenSquadBuilder?: () => void;
  onOpenVentureRadar?: () => void;
  onOpenKnowledgeExchange?: () => void;
  onOpenPeerSynergy?: (tab?: 'tech' | 'referral' | 'guild' | 'notes') => void;
  onOpenPeerTrustCareer?: (tab?: 'endorsements' | 'digitalCard' | 'roulette' | 'careerPath') => void;
  onOpenNetworkVitality?: (tab?: 'vitality' | 'meetup' | 'bilingual' | 'sos') => void;
  onOpenExecutiveElegance?: (tab?: 'scheduler' | 'trip' | 'memory' | 'showcase') => void;
  onOpenMeetingGuardGovernance?: (tab?: 'governance' | 'talent' | 'offline' | 'followup') => void;
  onOpenGovernanceMasterHub?: (tab?: GovernanceHubTab) => void;
  onOpenTalentMasterHub?: (tab?: TalentHubTab) => void;
  onOpenMeetingMasterHub?: (tab?: MeetingHubTab) => void;
  onShowToast: (msg: string) => void;
  onSelectUserRole?: (role: UserRole) => void;
}

export const GeneralMemberView: React.FC<GeneralMemberViewProps> = ({
  people,
  onSelectPerson,
  onOpenAddModal,
  onOpenCardScanner,
  onOpenSquadBuilder,
  onOpenVentureRadar,
  onOpenKnowledgeExchange,
  onOpenPeerSynergy,
  onOpenPeerTrustCareer,
  onOpenNetworkVitality,
  onOpenExecutiveElegance,
  onOpenMeetingGuardGovernance,
  onOpenGovernanceMasterHub,
  onOpenTalentMasterHub,
  onOpenMeetingMasterHub,
  onShowToast,
  onSelectUserRole
}) => {
  // 4대 탭 상태: contacts (주소록) | groups (그룹별) | birthday (생일 챙기기) | meetups (소모임)
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'birthday' | 'meetups'>('contacts');

  // 검색 & 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupCategory, setSelectedGroupCategory] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // 생일 챙기기 상태
  const [birthdayTone, setBirthdayTone] = useState<'polite' | 'friendly' | 'alumni'>('friendly');

  // 소모임 상태
  const [gatherings, setGatherings] = useState<Gathering[]>(() => loadGatherings());
  const [isNewGatheringModalOpen, setIsNewGatheringModalOpen] = useState(false);
  const [newGatheringTitle, setNewGatheringTitle] = useState('');
  const [newGatheringGroupName, setNewGatheringGroupName] = useState('서울대학교 총동문 네트워크');
  const [newGatheringCategory, setNewGatheringCategory] = useState<Gathering['category']>('번개티타임');
  const [newGatheringDateTime, setNewGatheringDateTime] = useState('2026-10-18 12:00');
  const [newGatheringLocation, setNewGatheringLocation] = useState('강남역 인근 카페');
  const [newGatheringMax, setNewGatheringMax] = useState(8);
  const [newGatheringFee, setNewGatheringFee] = useState('각자 부담 (1/N)');
  const [newGatheringDesc, setNewGatheringDesc] = useState('');

  // 파생 데이터
  const groups = useMemo(() => extractAlumniGroups(people), [people]);
  const birthdays = useMemo(() => getUpcomingBirthdays(people), [people]);

  // 필터된 주소록 인맥
  const filteredPeople = useMemo(() => {
    let result = people;

    if (selectedGroupId) {
      const targetGroup = groups.find(g => g.id === selectedGroupId);
      if (targetGroup) {
        result = result.filter(p => targetGroup.memberIds.includes(p.id));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const isChoseong = isPureChoseong(q);

      result = result.filter(p => {
        if (isChoseong) {
          return matchChoseong(p.name, q) ||
            matchChoseong(p.currentCompany, q) ||
            matchChoseong(p.currentTitle, q);
        }
        return (
          p.name.toLowerCase().includes(q) ||
          p.currentCompany.toLowerCase().includes(q) ||
          p.currentTitle.toLowerCase().includes(q) ||
          p.primaryDomain.toLowerCase().includes(q) ||
          p.academics.some(a => a.schoolName.toLowerCase().includes(q) || (a.major && a.major.toLowerCase().includes(q)))
        );
      });
    }

    return result;
  }, [people, selectedGroupId, groups, searchQuery]);

  // 소모임 참가 신청/취소 핸들러
  const handleToggleJoin = (gatheringId: string) => {
    const updated = toggleJoinGathering(gatheringId, {
      id: 'p-me',
      name: '나 (본인)',
      company: 'ConnectWe',
      title: '회원'
    });
    setGatherings(updated);
    const target = updated.find(g => g.id === gatheringId);
    const isNowJoined = target?.attendees.some(a => a.personId === 'p-me');
    onShowToast(isNowJoined ? '🎉 소모임 참가 신청이 완료되었습니다!' : '소모임 참가 신청이 취소되었습니다.');
  };

  // 신규 소모임 등록
  const handleCreateGathering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGatheringTitle.trim()) {
      onShowToast('모임 제목을 입력해 주세요.');
      return;
    }

    const newG: Gathering = {
      id: `g-${Date.now()}`,
      groupName: newGatheringGroupName,
      title: newGatheringTitle,
      category: newGatheringCategory,
      dateTime: newGatheringDateTime,
      location: newGatheringLocation,
      maxAttendees: Number(newGatheringMax),
      fee: newGatheringFee,
      organizerName: '나 (본인)',
      description: newGatheringDesc || '동문·회원들과 함께하는 따뜻한 친목 모임입니다.',
      attendees: [
        { personId: 'p-me', name: '나 (본인)', company: 'ConnectWe', title: '개설자', joinedAt: new Date().toISOString().split('T')[0] }
      ],
      status: 'RECRUITING'
    };

    const updated = [newG, ...gatherings];
    setGatherings(updated);
    saveGatherings(updated);
    setIsNewGatheringModalOpen(false);
    setNewGatheringTitle('');
    setNewGatheringDesc('');
    onShowToast('🎉 새로운 소모임이 등록되었습니다!');
  };

  // 생일 축하 메시지 복사
  const handleCopyBirthdayMessage = (contact: BirthdayContact) => {
    const msg = generateBirthdayMessage(contact, birthdayTone);
    navigator.clipboard.writeText(msg);
    markBirthdayCongratulated(contact.id);
    onShowToast(`💌 ${contact.name}님을 위한 축하 메시지가 복사되었습니다! 카카오톡이나 문자로 전송해보세요.`);
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        icon={GraduationCap}
        title="동문 네트워크 & 소모임 커뮤니티"
        subtitle="소중한 학연·동아리·직장 동문 주소록을 손쉽게 정리하고, 생일을 챙기며 소모임 활동을 즐기는 공간입니다."
        actions={
          <div className="flex flex-col gap-2.5 items-end">
            {/* Primary Action Row: The 3 Enterprise Master Hubs */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Hub 1: Executive Governance & Strategy Master Hub */}
              <button
                type="button"
                data-testid="open-governance-master-hub-btn"
                onClick={() => onOpenGovernanceMasterHub ? onOpenGovernanceMasterHub('governance') : onOpenMeetingGuardGovernance?.('governance')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 hover:from-blue-800 hover:to-slate-950 text-white shadow-md shadow-blue-900/20 border border-blue-500/30 transition-all active:scale-95 cursor-pointer"
                title="상법 제542조의8 사외이사 겸직 규제, 2026 주총 의결권 시뮬레이션, DART 5% 지분 공시 레이더, 최고경영진 승계 큐레이터"
              >
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                <span>🏛️ 경영 거버넌스 허브</span>
              </button>

              {/* Hub 2: Talent & Career Ecosystem Master Hub */}
              <button
                type="button"
                data-testid="open-talent-master-hub-btn"
                onClick={() => onOpenTalentMasterHub ? onOpenTalentMasterHub('squad') : onOpenSquadBuilder?.()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-md shadow-indigo-900/20 border border-indigo-400/30 transition-all active:scale-95 cursor-pointer"
                title="프로젝트 스쿼드 빌더, 동문 창업 & 시드 투자 레이더, 4단계 피어 보증, 모바일 vCard, 실무 SOS 헬프데스크"
              >
                <Users className="w-4 h-4 text-indigo-300" />
                <span>🤝 실무 인재 생태계 허브</span>
              </button>

              {/* Hub 3: Meeting & Relationship Full-Lifecycle Master Hub */}
              <button
                type="button"
                data-testid="open-meeting-master-hub-btn"
                onClick={() => onOpenMeetingMasterHub ? onOpenMeetingMasterHub('schedule') : onOpenExecutiveElegance?.('scheduler')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 hover:from-amber-700 hover:to-indigo-800 text-white shadow-md shadow-amber-900/20 border border-amber-400/30 transition-all active:scale-95 cursor-pointer"
                title="3선 티타임 조율 및 RFC 5545 .ICS 캘린더 생성, 1-Page 미팅 사전 브리프, 현장 밋업 룸, 회고 및 3분 사후 팔로업 트래커"
              >
                <Coffee className="w-4 h-4 text-amber-300" />
                <span>☕ 미팅 전주기 허브</span>
              </button>
            </div>

            {/* Secondary Action Row: Specialized Quick Studios & Registration Badges */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {onOpenSquadBuilder && (
                <button
                  type="button"
                  data-testid="open-squad-builder-btn"
                  onClick={onOpenSquadBuilder}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="프로젝트 스쿼드 가상 편성"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>스쿼드</span>
                </button>
              )}
              {onOpenVentureRadar && (
                <button
                  type="button"
                  data-testid="open-venture-radar-btn"
                  onClick={onOpenVentureRadar}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="동문·동료 창업 & 시드 투자 레이더"
                >
                  <Rocket className="w-3 h-3 text-rose-500" />
                  <span>창업·시드</span>
                </button>
              )}
              {onOpenKnowledgeExchange && (
                <button
                  type="button"
                  data-testid="open-knowledge-exchange-btn"
                  onClick={onOpenKnowledgeExchange}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="실무 슈퍼파워 지식 교환 팟"
                >
                  <Coffee className="w-3 h-3 text-amber-500" />
                  <span>지식 팟</span>
                </button>
              )}
              {onOpenPeerSynergy && (
                <button
                  type="button"
                  data-testid="open-peer-synergy-btn"
                  onClick={() => onOpenPeerSynergy('tech')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="실무 시너지 허브"
                >
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  <span>시너지</span>
                </button>
              )}
              {onOpenPeerTrustCareer && (
                <button
                  type="button"
                  data-testid="open-peer-trust-career-btn"
                  onClick={() => onOpenPeerTrustCareer('endorsements')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="신뢰 & 커리어 스튜디오"
                >
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>피어 보증</span>
                </button>
              )}
              {onOpenNetworkVitality && (
                <button
                  type="button"
                  data-testid="open-network-vitality-btn"
                  onClick={() => onOpenNetworkVitality('vitality')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="관계 생명력 & 밋업 룸"
                >
                  <Heart className="w-3 h-3 text-emerald-500" />
                  <span>생명력·밋업</span>
                </button>
              )}
              {onOpenExecutiveElegance && (
                <button
                  type="button"
                  data-testid="open-executive-elegance-btn"
                  onClick={() => onOpenExecutiveElegance('scheduler')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="품격 & 쇼케이스 스튜디오"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>품격·쇼케이스</span>
                </button>
              )}
              {onOpenMeetingGuardGovernance && (
                <button
                  type="button"
                  data-testid="open-meeting-guard-governance-btn"
                  onClick={() => onOpenMeetingGuardGovernance('governance')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="거버넌스 & 미팅 가드"
                >
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  <span>거버넌스·가드</span>
                </button>
              )}

              {/* 기본 등록 버튼들 */}
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95 cursor-pointer ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 동문 추가</span>
              </button>
              {onOpenCardScanner && (
                <button
                  type="button"
                  data-testid="open-card-scanner-btn"
                  onClick={onOpenCardScanner}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="카메라 또는 명함 이미지 업로드로 1초 등록"
                >
                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                  <span>명함 스캔</span>
                </button>
              )}
            </div>
          </div>
        }
      />

      {/* 회원 등급 안내 & 원클릭 모드 전환 배너 */}
      {onSelectUserRole && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mt-1 sm:mt-0 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-300">현재 [🟢 일반 회원] 화면입니다: </span>
              <span className="text-slate-600 dark:text-slate-400">동문 주소록과 소모임 위주의 심플한 모드이며, 다른 등급의 메뉴를 보시려면 우측 버튼을 눌러 전환하세요.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden lg:inline">다른 등급 전환:</span>
            <button
              type="button"
              onClick={() => onSelectUserRole('hidden')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-xs font-bold transition-all shadow-2xs hover:scale-102 active:scale-95 cursor-pointer"
              title="C-Level VIP 비즈니스 파트너십 관리 모드로 전환"
            >
              🟣 Hidden 모드로 전환
            </button>
            <button
              type="button"
              onClick={() => onSelectUserRole('master')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 text-xs font-bold transition-all shadow-2xs hover:scale-102 active:scale-95 cursor-pointer"
              title="DART 상장공시 & 기업 지배구조 전용 마스터 관제 모드로 전환"
            >
              👑 마스터 관리자로 전환
            </button>
          </div>
        </div>
      )}

      {/* 4대 탭 네비게이션 */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('contacts'); setSelectedGroupId(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'contacts' && !selectedGroupId
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            내 동문 주소록
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'contacts' ? 'bg-emerald-700/60 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {people.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'groups' || selectedGroupId
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            동문 & 소속 그룹
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'groups' ? 'bg-emerald-700/60 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {groups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('birthday')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'birthday'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Cake className="w-4 h-4" />
            생일 챙기기
            {birthdays.filter(b => b.isToday).length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                오늘 {birthdays.filter(b => b.isToday).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('meetups')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'meetups'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            소모임 커뮤니티
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'meetups' ? 'bg-indigo-700/60 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {gatherings.length}
            </span>
          </button>
        </div>

        {activeTab === 'meetups' && (
          <button
            onClick={() => setIsNewGatheringModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
          >
            <Plus className="w-3.5 h-3.5" />
            새 소모임 개설
          </button>
        )}
      </div>

      {/* ===================== TAB 1: 내 동문 주소록 ===================== */}
      {(activeTab === 'contacts' || selectedGroupId) && (
        <div className="space-y-4">
          {/* 상단 검색 및 그룹 선택 칩 */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="이름, 학교, 전공, 회사, 관심사로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {selectedGroupId && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                <span>그룹: <strong>{groups.find(g => g.id === selectedGroupId)?.name}</strong></span>
                <button
                  onClick={() => setSelectedGroupId(null)}
                  className="hover:underline font-bold ml-1 text-emerald-900 dark:text-emerald-200"
                >
                  ✕ 전체보기
                </button>
              </div>
            )}
          </div>

          {/* 주소록 카드 그리드 */}
          {filteredPeople.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              {searchQuery.trim() ? (
                <>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    &apos;{searchQuery}&apos; 검색 결과가 없습니다
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                    이름, 회사명, 학교명 또는 자음 초성(예: &apos;ㄱㅅㅇ&apos;)으로 검색해 보세요. 오타가 없는지 확인하거나 검색어를 단순화해 보세요.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                    >
                      검색어 초기화
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAddModal}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-sm"
                    >
                      + &apos;{searchQuery}&apos; 신규 등록
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">등록된 동문이 없습니다.</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4">새로운 학교 동문이나 지인을 등록하여 주소록을 만들어 보세요.</p>
                  <button
                    onClick={onOpenAddModal}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                  >
                    + 첫 동문 추가하기
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.map((person) => {
                const bdayInfo = birthdays.find(b => b.id === person.id);
                return (
                  <div
                    key={person.id}
                    onClick={() => onSelectPerson(person)}
                    className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer relative"
                  >
                    {/* 생일 인디케이터 */}
                    {bdayInfo && (
                      <div className={`absolute top-4 right-4 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        bdayInfo.isToday 
                          ? 'bg-rose-500 text-white animate-bounce' 
                          : 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                      }`}>
                        <Cake className="w-3 h-3" />
                        {bdayInfo.isToday ? '오늘 생일!' : `생일 D-${bdayInfo.daysUntil}`}
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                        {person.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                            <PersonMiniPreviewTooltip person={person} onSelectPerson={onSelectPerson}>
                              <span>{person.name}</span>
                            </PersonMiniPreviewTooltip>
                          </h4>
                          {(() => {
                            const badge = getExecutiveStatusBadge(person);
                            return (
                              <span 
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                                title={badge.subLabel}
                              >
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {person.currentCompany} · {person.currentTitle}
                        </p>
                      </div>
                    </div>

                    {/* 학력 및 소속 정보 */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {person.academics && person.academics.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {person.academics.map(a => `${a.schoolName} ${a.major || ''}`).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{person.mobile || '연락처 미등록'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{person.email || '이메일 미등록'}</span>
                      </div>
                    </div>

                    {/* 태그 / 도메인 */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {person.primaryDomain}
                      </span>
                      {person.skills?.slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          #{s}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: 동문 & 소속 그룹 ===================== */}
      {activeTab === 'groups' && !selectedGroupId && (
        <div className="space-y-6">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: '전체 그룹' },
              { id: 'university', label: '대학교·대학원' },
              { id: 'high', label: '고등학교' },
              { id: 'middle', label: '중학교' },
              { id: 'elementary', label: '초등학교' },
              { id: 'club', label: '동아리·취미' },
              { id: 'major', label: '전공 포럼' },
              { id: 'company', label: '재직회사 알럼나이' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedGroupCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedGroupCategory === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 그룹 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups
              .filter(g => selectedGroupCategory === 'all' || g.category === selectedGroupCategory)
              .map(group => (
                <div
                  key={group.id}
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setActiveTab('contacts');
                  }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {group.categoryLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      구성원 {group.memberCount}명
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3 group-hover:text-emerald-600 transition-colors">
                    {group.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {group.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>소속 동문 명단 보기</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: 생일 챙기기 ===================== */}
      {activeTab === 'birthday' && (
        <div className="space-y-6">
          {/* 생일 알림 상단 카드 */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 border border-pink-200 dark:border-pink-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cake className="w-5 h-5 text-pink-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  다가오는 30일 이내 생일자: 총 {birthdays.length}명
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                소중한 동문과 지인의 생일을 놓치지 마세요. 따뜻한 축하 메시지 템플릿을 복사해 바로 전송할 수 있습니다.
              </p>
            </div>

            {/* 어조 선택 */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-pink-200 dark:border-pink-800">
              <button
                onClick={() => setBirthdayTone('friendly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  birthdayTone === 'friendly' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                }`}
              >
                😊 친근한 톤
              </button>
              <button
                onClick={() => setBirthdayTone('polite')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  birthdayTone === 'polite' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                }`}
              >
                🎩 정중한 톤
              </button>
              <button
                onClick={() => setBirthdayTone('alumni')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  birthdayTone === 'alumni' ? 'bg-pink-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                }`}
              >
                🎓 동문 톤
              </button>
            </div>
          </div>

          {/* 생일자 목록 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {birthdays.map((contact) => (
              <div
                key={contact.id}
                className={`p-5 rounded-2xl border transition-all ${
                  contact.isToday
                    ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      contact.isToday ? 'bg-rose-500 text-white animate-pulse' : 'bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300'
                    }`}>
                      🎂
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {contact.name}
                        </h4>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          contact.isToday
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {contact.isToday ? '오늘 생일!' : `D-${contact.daysUntil}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {contact.company} · {contact.title} ({contact.birthday})
                      </p>
                    </div>
                  </div>

                  {contact.hasCongratulated && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" />
                      축하 완료
                    </span>
                  )}
                </div>

                {/* 메시지 미리보기 박스 */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                  {generateBirthdayMessage(contact, birthdayTone)}
                </div>

                {/* 액션 버튼 */}
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleCopyBirthdayMessage(contact)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-pink-600 hover:bg-pink-700 text-white shadow-sm transition-all active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    축하 메시지 복사
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: 소모임 커뮤니티 ===================== */}
      {activeTab === 'meetups' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gatherings.map((g) => {
              const isJoined = g.attendees.some(a => a.personId === 'p-me');
              const isFull = g.attendees.length >= g.maxAttendees;

              return (
                <div
                  key={g.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {g.category}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        g.status === 'RECRUITING' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {g.status === 'RECRUITING' ? '모집 중' : '마감'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">{g.groupName}</span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {g.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {g.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{g.dateTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{g.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>회비: {g.fee || '무료'}</span>
                      </div>
                    </div>

                    {/* 참가자 현황 */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">참가자 명단 ({g.attendees.length}/{g.maxAttendees}명)</span>
                        {isFull && <span className="text-rose-500 font-bold text-[10px]">정원 마감</span>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {g.attendees.map((att, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                              att.personId === 'p-me'
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {att.name} ({att.company})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 참가 버튼 */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleToggleJoin(g.id)}
                      disabled={!isJoined && isFull}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isJoined
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          : isFull
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-98'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          신청 완료 (취소하기)
                        </>
                      ) : isFull ? (
                        '정원이 찼습니다'
                      ) : (
                        '참가 신청하기 (RSVP)'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 새 소모임 개설 모달 */}
      {isNewGatheringModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">새 소모임 개설</h3>
              </div>
              <button
                onClick={() => setIsNewGatheringModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGathering} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  소속 동문 그룹
                </label>
                <select
                  value={newGatheringGroupName}
                  onChange={(e) => setNewGatheringGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  모임 제목 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 봄맞이 테헤란로 브런치 번개"
                  value={newGatheringTitle}
                  onChange={(e) => setNewGatheringTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    모임 성격
                  </label>
                  <select
                    value={newGatheringCategory}
                    onChange={(e) => setNewGatheringCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="번개티타임">번개티타임</option>
                    <option value="동문회">동문회</option>
                    <option value="정기모임">정기모임</option>
                    <option value="골프/운동">골프/운동</option>
                    <option value="세미나/스터디">세미나/스터디</option>
                    <option value="축하모임">축하모임</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    일시
                  </label>
                  <input
                    type="text"
                    placeholder="2026-10-18 12:00"
                    value={newGatheringDateTime}
                    onChange={(e) => setNewGatheringDateTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    모임 장소
                  </label>
                  <input
                    type="text"
                    placeholder="강남구 역삼역 3번출구 인근"
                    value={newGatheringLocation}
                    onChange={(e) => setNewGatheringLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    최대 정원 (명)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={newGatheringMax}
                    onChange={(e) => setNewGatheringMax(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  회비 안내
                </label>
                <input
                  type="text"
                  placeholder="예: 각자 부담 (1/N) 또는 무료"
                  value={newGatheringFee}
                  onChange={(e) => setNewGatheringFee(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  모임 상세 소개
                </label>
                <textarea
                  rows={3}
                  placeholder="모임 목적, 진행 방식 등을 자유롭게 적어주세요."
                  value={newGatheringDesc}
                  onChange={(e) => setNewGatheringDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewGatheringModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  소모임 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

