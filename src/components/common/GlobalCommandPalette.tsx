import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Person } from '../../types/network';
import { NavViewType } from './SidebarLNB';
import { 
  Search, User, Briefcase, Zap, 
  MapPin, Award, Building2, Sparkles, 
  ArrowRight, X, Mic, Compass, BarChart2, UploadCloud, Coffee, Bell,
  Gift, Headphones, GitMerge, Users, Rocket, Layers, BookOpen, QrCode,
  Heart, Globe, HelpCircle, Calendar, Wifi
} from 'lucide-react';

interface CommandAction {
  id: string;
  category: '인물 인텔리전스' | '경영 네비게이션' | '스마트 액션';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  onExecute: () => void;
}

import { GovernanceHubTab, TalentHubTab, MeetingHubTab } from '../../types/masterHub';
import { isPureChoseong, matchChoseong } from '../../utils/koreanUtils';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenMeetingBriefing?: (person: Person) => void;
  onOpenVoiceDebrief?: () => void;
  onOpenWarmIntroPath?: () => void;
  onOpenWeeklyBrief?: () => void;
  onOpenBatchCardScanner?: () => void;
  onOpenTeaTimeModal?: (targetPerson?: Person) => void;
  onOpenGoldenCare?: (targetPerson?: Person) => void;
  onOpenProtocol?: (targetPerson?: Person) => void;
  onOpenAudioBriefing?: (targetPerson?: Person) => void;
  onOpenCrossBoardSynergy?: (targetCorp?: string) => void;
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
  onNavigateView: (view: NavViewType) => void;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  people,
  onSelectPerson,
  onOpenMeetingBriefing,
  onOpenVoiceDebrief,
  onOpenWarmIntroPath,
  onOpenWeeklyBrief,
  onOpenBatchCardScanner,
  onOpenTeaTimeModal,
  onOpenGoldenCare,
  onOpenProtocol,
  onOpenAudioBriefing,
  onOpenCrossBoardSynergy,
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
  onNavigateView
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryTab, setCategoryTab] = useState<'all' | 'people' | 'nav' | 'action'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 모달 오픈 시 인풋 포커스 & 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategoryTab('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 방향키 이동 시 선택 항목 자동 스크롤 추적
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // 검색 쿼리에 따른 동적 액션 리스트 생성
  const actions = useMemo<CommandAction[]>(() => {
    const q = query.trim().toLowerCase();

    // 1. 메뉴 네비게이션 액션
    const menuActions: Array<{ id: NavViewType; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = [
      { id: 'command', title: '오늘의 비즈니스 경영 사령탑', subtitle: '핵심 딜 파이프라인 · 외근 접점 · DART 영전 레이더', icon: Zap },
      { id: 'company', title: 'DART 상장사 공시 팩트', subtitle: '금융감독원 전자공시 검증 임원 및 알럼나이 네트워크', icon: Building2 },
      { id: 'deals', title: '비즈니스 파트너십 & 딜 파이프라인', subtitle: '6단계 칸반 보드 및 의사결정권자(Keyman) 건전도 관리', icon: Briefcase },
      { id: 'proximity', title: '지리적 근접 레이더', subtitle: '7대 거점별 외근 동선 매핑 및 티타임 번들러', icon: MapPin },
      { id: 'promotion', title: '정기 승진 & 인사 레이더', subtitle: 'DART 임원 영전 공시 조기 감지 및 공식 축전 생성', icon: Award },
    ];

    const matchedMenus = menuActions.filter(m => 
      !q || m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
    );

    const navActions: CommandAction[] = matchedMenus.map(m => ({
      id: `nav-${m.id}`,
      category: '경영 네비게이션',
      title: m.title,
      subtitle: m.subtitle,
      icon: m.icon,
      badge: '화면 전환',
      onExecute: () => {
        onNavigateView(m.id);
        onClose();
      }
    }));

    // 2. 스마트 C-Level 액션 & 3대 마스터 허브
    const smartActions = [
      onOpenGovernanceMasterHub && {
        id: 'action-governance-master-hub',
        category: '스마트 액션',
        title: '🏛️ 경영 거버넌스 & 전략 인텔리전스 마스터 허브',
        subtitle: '상법 542조 사외이사 겸직 규제, 2026 주총 의결권, DART 지분 변동, C-Level 승계',
        icon: Building2,
        badge: 'C-Level 허브',
        keywords: ['거버넌스', '이사회', '사외이사', '주총', '의결권', '공시', 'dart', '승계', 'governance'],
        onExecute: () => {
          onOpenGovernanceMasterHub();
          onClose();
        }
      },
      onOpenTalentMasterHub && {
        id: 'action-talent-master-hub',
        category: '스마트 액션',
        title: '🤝 실무 인재 & 커리어 성장 생태계 마스터 허브',
        subtitle: '5대 직군 스쿼드 빌더, 동문 창업 & 시드 투자 레이더, 피어 보증, 모바일 vCard, 실무 SOS',
        icon: Users,
        badge: '인재 생태계',
        keywords: ['인재', '스쿼드', '창업', '시드', '보증', 'vcard', '명함', '길드', 'sos', 'talent'],
        onExecute: () => {
          onOpenTalentMasterHub();
          onClose();
        }
      },
      onOpenMeetingMasterHub && {
        id: 'action-meeting-master-hub',
        category: '스마트 액션',
        title: '☕ 미팅 & 관계 라이프사이클 마스터 허브',
        subtitle: '3선 티타임 조율 및 .ICS 캘린더, 5분 전 브리프, 현장 밋업, 회고 및 3분 사후 팔로업',
        icon: Coffee,
        badge: '미팅 전주기',
        keywords: ['미팅', '티타임', '조율', 'ics', '브리프', '밋업', '회고', '팔로업', 'meeting'],
        onExecute: () => {
          onOpenMeetingMasterHub();
          onClose();
        }
      },
      onOpenVoiceDebrief && {
        id: 'action-voice-debrief',
        category: '스마트 액션',
        title: '🎙️ 이동 중 30초 음성 회고 AI (Voice Debrief)',
        subtitle: '마이크 원터치로 요약·액션아이템·딜·감사서신 자동 정리',
        icon: Mic,
        badge: 'C-Level AI',
        keywords: ['음성', '회고', '음성회고', 'debrief', 'voice', '미팅', '회의'],
        onExecute: () => {
          onOpenVoiceDebrief();
          onClose();
        }
      },
      onOpenWarmIntroPath && {
        id: 'action-warm-intro',
        category: '스마트 액션',
        title: '🧭 최단 신뢰 소개 경로 파인더 (Warm Intro 2.0)',
        subtitle: '관심 인재를 가장 높은 성공 확률로 소개해 줄 최적의 신뢰 가교 탐색',
        icon: Compass,
        badge: '신뢰 경로',
        keywords: ['소개', '경로', '소개경로', 'warm', 'intro', '다리', '인연', '가교'],
        onExecute: () => {
          onOpenWarmIntroPath();
          onClose();
        }
      },
      onOpenWeeklyBrief && {
        id: 'action-weekly-brief',
        category: '스마트 액션',
        title: '📊 C-Level 월요 전략 주간 브리프 (Weekly Board Report)',
        subtitle: '핵심 딜, DART 공시 변동, 소통 공백 VIP 1-Page A4 인쇄/PDF 리포트',
        icon: BarChart2,
        badge: '전략 리포트',
        keywords: ['주간', '브리프', '주간브리프', 'weekly', 'report', '리포트', '보고서', '이사회'],
        onExecute: () => {
          onOpenWeeklyBrief();
          onClose();
        }
      },
      onOpenBatchCardScanner && {
        id: 'action-batch-scan',
        category: '스마트 액션',
        title: '📇 연속 명함 일괄 스캔 & 실시간 DART 결합 (Batch Scanner)',
        subtitle: '최대 20장 명함 이미지 일괄 드롭 & 상장사 임원 팩트 자동 매칭',
        icon: UploadCloud,
        badge: '일괄 등록',
        keywords: ['명함', '스캔', '명함스캔', 'batch', '일괄', '카드', 'dart'],
        onExecute: () => {
          onOpenBatchCardScanner();
          onClose();
        }
      },
      onOpenTeaTimeModal && {
        id: 'action-tea-time',
        category: '스마트 액션',
        title: '☕ 경영진 티타임 의제 AI 코파일럿 & 캘린더 초대 (.ICS)',
        subtitle: 'DART 팩트 기반 3대 맞춤 의제 카드 자동 생성 & 표준 캘린더 초대장 원클릭',
        icon: Coffee,
        badge: '의제 코파일럿',
        keywords: ['티타임', '의제', 'teatime', 'agenda', 'ics', '캘린더', '초대장', '커피'],
        onExecute: () => {
          onOpenTeaTimeModal();
          onClose();
        }
      },
      onOpenGoldenCare && {
        id: 'action-golden-care',
        category: '스마트 액션',
        title: '🔔 VIP 골든타임 능동형 케어 & 4대 안부 서신 코파일럿',
        subtitle: '60/90/180일 소통 공백 VIP 맞춤 서신 자동 합성 및 데스크톱 알림',
        icon: Bell,
        badge: '골든 케어',
        keywords: ['안부', '골든타임', '소통', '서신', '카톡', '문자', '이메일', '공백', 'care', 'cadence'],
        onExecute: () => {
          onOpenGoldenCare();
          onClose();
        }
      },
      onOpenProtocol && {
        id: 'action-protocol',
        category: '스마트 액션',
        title: '🎁 C-Suite 경조사 의전 컨시어지 & 정중 서신',
        subtitle: '부고·혼사·영전·명절·생신 감지 & 청탁금지법 안심 가이드 & 리본 축문',
        icon: Gift,
        badge: '경조사 의전',
        keywords: ['경조사', '의전', '부고', '조의', '결혼', '축의', '영전', '명절', '화환', '김영란법', '청탁금지법', 'protocol'],
        onExecute: () => {
          onOpenProtocol();
          onClose();
        }
      },
      onOpenAudioBriefing && {
        id: 'action-audio-briefing',
        category: '스마트 액션',
        title: '🎧 에어팟 앰비언트 30초 오디오 브리핑 (라디오 모드)',
        subtitle: '미팅 10분 전 차량 이동 중 핸즈프리 3단계 음성 팩트체크 (TTS)',
        icon: Headphones,
        badge: '에어팟 브리핑',
        keywords: ['오디오', '브리핑', '에어팟', '음성', 'tts', '팟캐스트', '핸즈프리', 'audio', 'briefing'],
        onExecute: () => {
          onOpenAudioBriefing();
          onClose();
        }
      },
      onOpenCrossBoardSynergy && {
        id: 'action-cross-board',
        category: '스마트 액션',
        title: '🏢 전략적 M&A & 크로스 보드 시뮬레이터 (Cross-Board Simulator)',
        subtitle: '기업 간 이사회 겹침망·사외이사·알럼나이 분석 & 3대 신뢰 가교 경로 도출',
        icon: GitMerge,
        badge: 'M&A 시너지',
        keywords: ['시너지', '크로스보드', '합작', '제휴', 'm&a', '이사회', '알럼나이', '지분', 'synergy', 'board', 'cross'],
        onExecute: () => {
          onOpenCrossBoardSynergy();
          onClose();
        }
      },
      onOpenSquadBuilder && {
        id: 'action-squad-builder',
        category: '스마트 액션',
        title: '🎯 스마트 프로젝트 팀 빌더 & 스킬 매칭 스튜디오',
        subtitle: '실무 인재(개발/디자인/PM/마케팅) 보유 스킬 매칭 & 가상 스쿼드 편성',
        icon: Users,
        badge: '팀 빌더',
        keywords: ['팀', '스쿼드', '프로젝트', '팀빌더', '인재', '개발자', '디자이너', 'pm', '스킬', 'squad', 'builder'],
        onExecute: () => {
          onOpenSquadBuilder();
          onClose();
        }
      },
      onOpenVentureRadar && {
        id: 'action-venture-radar',
        category: '스마트 액션',
        title: '🚀 초기 스타트업 창업 & 시드 펀딩 레이더 (파운더스 클럽)',
        subtitle: '동문·동료의 스텔스 창업, 팁스(TIPS) 선정, 시드 투자 유치 감지 & 파운딩 스쿼드 지원',
        icon: Rocket,
        badge: '창업 레이더',
        keywords: ['창업', '스타트업', '시드', '펀딩', '파운더', 'tips', 'stealth', '스텔스', '투자', 'founder', 'venture'],
        onExecute: () => {
          onOpenVentureRadar();
          onClose();
        }
      },
      onOpenKnowledgeExchange && {
        id: 'action-knowledge-exchange',
        category: '스마트 액션',
        title: '☕ 실무 슈퍼파워 지식 교환 & 캐주얼 멘토링 팟 (Peer Knowledge Pods)',
        subtitle: '쿠버네티스·LLM·디자인시스템·과금모델 실무 난제 해결 지인과 1:1 자문 티타임 연결',
        icon: Coffee,
        badge: '지식 교환',
        keywords: ['멘토', '멘토링', '커피챗', '슈퍼파워', '지식교환', '자문', '티타임', 'mentor', 'peer', 'pod'],
        onExecute: () => {
          onOpenKnowledgeExchange();
          onClose();
        }
      },
      onOpenPeerSynergy && {
        id: 'action-peer-synergy-tech',
        category: '스마트 액션',
        title: '🌐 내 인맥의 실무 테크 스택 랜드스케이프 (Tech Ecosystem)',
        subtitle: 'React·K8s·PyTorch·Figma 등 프로덕션 검증 스택 보유 지인 탐색 & 1:1 기술 자문',
        icon: Layers,
        badge: '테크 스택',
        keywords: ['테크', '기술', '스택', '개발', '프론트엔드', '백엔드', '인프라', 'k8s', 'react', 'tech', 'stack'],
        onExecute: () => {
          onOpenPeerSynergy('tech');
          onClose();
        }
      },
      onOpenPeerSynergy && {
        id: 'action-peer-synergy-referral',
        category: '스마트 액션',
        title: '🎯 신뢰 기반 따뜻한 사내 채용 & 인재 추천 브릿지 (Warm Referral)',
        subtitle: '지인 재직사(네이버·토스·하이퍼클라우드) 실무 포지션 & 사내추천 정중 서신 생성',
        icon: Briefcase,
        badge: '사내 추천',
        keywords: ['채용', '이직', '추천', '사내추천', '포지션', '일자리', '커리어', 'referral', 'career'],
        onExecute: () => {
          onOpenPeerSynergy('referral');
          onClose();
        }
      },
      onOpenPeerSynergy && {
        id: 'action-peer-synergy-guild',
        category: '스마트 액션',
        title: '🚀 사이드 프로젝트 & 기술 스터디 길드 매칭 (Study Guilds)',
        subtitle: '퇴근 후/주말 AI 에이전트 토이 프로젝트, 디자인 시스템 스터디 팟 개설 및 모집',
        icon: Rocket,
        badge: '스터디 팟',
        keywords: ['스터디', '사이드', '프로젝트', '길드', '토이', '모임', 'study', 'guild', 'side'],
        onExecute: () => {
          onOpenPeerSynergy('guild');
          onClose();
        }
      },
      onOpenPeerSynergy && {
        id: 'action-peer-synergy-notes',
        category: '스마트 액션',
        title: '📝 커피챗 실무 인사이트 & 상호 회고 노트 볼트 (Insight Vault)',
        subtitle: '커피챗 후 3대 실무 배운 점(Key Takeaways) 기록 & 감사 피드백 카드 즉시 생성',
        icon: BookOpen,
        badge: '인사이트 볼트',
        keywords: ['인사이트', '회고', '메모', '노트', '배운점', '피드백', '감사', 'insight', 'notes'],
        onExecute: () => {
          onOpenPeerSynergy('notes');
          onClose();
        }
      },
      onOpenPeerTrustCareer && {
        id: 'action-peer-trust-endorse',
        category: '스마트 액션',
        title: '🌟 피어 실무 역량 보증 & 신뢰 뱃지 스튜디오 (Peer Endorsements)',
        subtitle: '함께 일해본 동료의 3대 실무 강점 보증 및 따뜻한 감사 답례 서신 생성',
        icon: Award,
        badge: '실무 보증',
        keywords: ['보증', '실무', '신뢰', '강점', '뱃지', '피어', 'endorsement', 'trust', 'peer', '추천'],
        onExecute: () => {
          onOpenPeerTrustCareer('endorsements');
          onClose();
        }
      },
      onOpenPeerTrustCareer && {
        id: 'action-peer-trust-card',
        category: '스마트 액션',
        title: '📇 모바일 1-Page 디지털 실무 명함 & QR 슈퍼파워 카드 (vCard)',
        subtitle: 'RFC 6350 표준 vCard 파일 다운로드 및 모바일 카메라 스캔 주소록 자동 저장',
        icon: QrCode,
        badge: '디지털 명함',
        keywords: ['명함', '디지털', 'vcard', 'vcf', 'qr', '모바일', '프로필', 'card', '스마트폰'],
        onExecute: () => {
          onOpenPeerTrustCareer('digitalCard');
          onClose();
        }
      },
      onOpenPeerTrustCareer && {
        id: 'action-peer-trust-roulette',
        category: '스마트 액션',
        title: '☕ 크로스 직무 1:1 캐주얼 커피챗 룰렛 (Coffee Roulette)',
        subtitle: '개발자 ↔ 디자이너 ↔ PM 간 격주 20분 캐주얼 티타임 자동 매칭 & 아이스브레이킹 대화 카드',
        icon: Coffee,
        badge: '커피챗 룰렛',
        keywords: ['룰렛', '커피챗', '티타임', '크로스직무', '개발자', '디자이너', 'pm', 'roulette', 'coffee'],
        onExecute: () => {
          onOpenPeerTrustCareer('roulette');
          onClose();
        }
      },
      onOpenPeerTrustCareer && {
        id: 'action-peer-trust-career',
        category: '스마트 액션',
        title: '🗺️ 실무 커리어 도약 경로 & 스킬 갭 멘토 매칭 (Career Explorer)',
        subtitle: '테크 리드·수석 아키텍트 목표 역량 대비 부족 스킬 분석 및 1촌/2촌 멘토 조언 서신 생성',
        icon: Compass,
        badge: '커리어 멘토',
        keywords: ['커리어', '성장', '멘토', '스킬', '로드맵', '테크리드', '아키텍트', 'career', 'path', 'gap'],
        onExecute: () => {
          onOpenPeerTrustCareer('careerPath');
          onClose();
        }
      },
      onOpenNetworkVitality && {
        id: 'action-vitality-radar',
        category: '스마트 액션',
        title: '🌱 관계 생명력 & 시즌별 안부 레이더 (Vitality Radar)',
        subtitle: '교류 공백기 4단계 자동 진단 & 어색함 없는 환절기·명절·분기 맞춤 안부 서신 생성',
        icon: Heart,
        badge: '생명력 레이더',
        keywords: ['생명력', '안부', '건강도', '소원', '공백', '시즌', '명절', '환절기', 'vitality', 'care'],
        onExecute: () => {
          onOpenNetworkVitality('vitality');
          onClose();
        }
      },
      onOpenNetworkVitality && {
        id: 'action-vitality-meetup',
        category: '스마트 액션',
        title: '📇 현장 밋업 & 컨퍼런스 네트워킹 룸 (Instant Meetup Room)',
        subtitle: '6자리 룸 코드로 현장 체크인 & 참가자 일괄 디지털 명함 교환 및 감사 방송',
        icon: Users,
        badge: '현장 밋업',
        keywords: ['밋업', '컨퍼런스', '현장', '체크인', '행사', '네트워킹', '룸', 'meetup', 'conference'],
        onExecute: () => {
          onOpenNetworkVitality('meetup');
          onClose();
        }
      },
      onOpenNetworkVitality && {
        id: 'action-vitality-bilingual',
        category: '스마트 액션',
        title: '🎙️ 글로벌 바이링구얼(한·영) 미팅 인텔리전스 (Bilingual Meeting)',
        subtitle: '해외 VC·파트너 미팅 한·영 브리프 요약 & 실리콘밸리 에티켓 영문 감사 서신 생성',
        icon: Globe,
        badge: '글로벌 미팅',
        keywords: ['글로벌', '영어', '영문', '바이링구얼', 'bilingual', 'vc', '해외', '이메일', '시차'],
        onExecute: () => {
          onOpenNetworkVitality('bilingual');
          onClose();
        }
      },
      onOpenNetworkVitality && {
        id: 'action-vitality-sos',
        category: '스마트 액션',
        title: '🆘 크로스 컴퍼니 실무 난제 SOS 헬프데스크 (Peer Problem-Solving)',
        subtitle: '클라우드·결제·디자인시스템 실무 난제 비공개 등록 & 경험 보유 1촌/2촌 지인 15분 자문 연결',
        icon: HelpCircle,
        badge: '실무 SOS',
        keywords: ['난제', 'sos', '자문', '헬프데스크', '질문', '막힘', '에러', '인프라', 'help', 'ticket'],
        onExecute: () => {
          onOpenNetworkVitality('sos');
          onClose();
        }
      },
      onOpenExecutiveElegance && {
        id: 'action-elegance-scheduler',
        category: '스마트 액션',
        title: '☕ 비즈니스 품격 일정 조율기 & 스마트 .ICS 번들러 (Executive TeaTime)',
        subtitle: '기계적 캘린더 링크 대신 3대 추천 시간대 제안 서신 & RFC 5545 표준 .ICS 다운로드',
        icon: Calendar,
        badge: '일정 조율기',
        keywords: ['티타임', '일정', '약속', '캘린더', 'ics', '라운지', '서신', 'scheduler', 'teatime', 'meeting'],
        onExecute: () => {
          onOpenExecutiveElegance('scheduler');
          onClose();
        }
      },
      onOpenExecutiveElegance && {
        id: 'action-elegance-trip',
        category: '스마트 액션',
        title: '✈️ 글로벌 출장 & 지방 외근 지능형 인맥 레이더 (Global Trip Bundler)',
        subtitle: '8대 전략 거점(샌프란시스코·도쿄·싱가포르·판교 등) 출장 시 현지 인맥 매핑 & 조우 서신',
        icon: Compass,
        badge: '출장 레이더',
        keywords: ['출장', '외근', '글로벌', '샌프란시스코', '도쿄', '싱가포르', '판교', 'trip', 'reunion', 'travel'],
        onExecute: () => {
          onOpenExecutiveElegance('trip');
          onClose();
        }
      },
      onOpenExecutiveElegance && {
        id: 'action-elegance-memory',
        category: '스마트 액션',
        title: '🎁 소소한 감동 메모 캡슐 & 4대 스몰톡 큐카드 (Thoughtful Memory)',
        subtitle: '커피/차 취향, 주말 취미, 라이프스타일 기록 & 미팅 5분 전 어색함 없는 스몰톡 큐카드',
        icon: Heart,
        badge: '감동 메모',
        keywords: ['메모', '취향', '커피', '취미', '스몰톡', '선물', '큐카드', 'memory', 'capsule', 'smalltalk'],
        onExecute: () => {
          onOpenExecutiveElegance('memory');
          onClose();
        }
      },
      onOpenExecutiveElegance && {
        id: 'action-elegance-showcase',
        category: '스마트 액션',
        title: '🏆 내 프로덕트 & 프로젝트 레퍼런스 쇼케이스 (Product Case Studies)',
        subtitle: '실제 론칭한 프로덕트·B2B SaaS 아키텍처 성과 카드, 동료 실전 검증 뱃지 & 1-Page 포트폴리오',
        icon: Briefcase,
        badge: '쇼케이스',
        keywords: ['쇼케이스', '프로덕트', '포트폴리오', '레퍼런스', '아키텍처', '성과', 'showcase', 'product', 'portfolio'],
        onExecute: () => {
          onOpenExecutiveElegance('showcase');
          onClose();
        }
      },
      onOpenMeetingGuardGovernance && {
        id: 'action-guard-governance',
        category: '스마트 액션',
        title: '🏛️ C-Level 이사회 거버넌스 팩트체크 & 주총 의결권 시뮬레이터 (Governance Intelligence)',
        subtitle: '사외이사 겸직 규제(상법상 2개사 초과 불가) 검증, 주총 3대 안건 분석 & 5% 지분 변동 공시 레이더',
        icon: Building2,
        badge: '거버넌스',
        keywords: ['거버넌스', '이사회', '사외이사', '주총', '의결권', '주주총회', '공시', '지분', 'dart', 'governance'],
        onExecute: () => {
          onOpenMeetingGuardGovernance('governance');
          onClose();
        }
      },
      onOpenMeetingGuardGovernance && {
        id: 'action-guard-talent',
        category: '스마트 액션',
        title: '🤝 글로벌 핵심 인재 스카우팅 & 탤런트 풀 큐레이터 (Executive Talent Curator)',
        subtitle: 'CTO·AI Lab Lead·CPO·CFO 핵심 임원 승계 풀, 동료 실전 검증 평판 & 비공개 티타임 서신',
        icon: Users,
        badge: '인재 영입',
        keywords: ['인재', '스카우팅', '채용', 'cto', 'cfo', 'cpo', 'ai', '임원', '승계', 'talent', 'curator'],
        onExecute: () => {
          onOpenMeetingGuardGovernance('talent');
          onClose();
        }
      },
      onOpenMeetingGuardGovernance && {
        id: 'action-guard-offline',
        category: '스마트 액션',
        title: '⚡ 초고속 오프라인 우선 PWA & IndexedDB CRDT 동기화 (Offline-First Stream)',
        subtitle: '기내 모드에서도 10,000+ 인맥 그래프 0.01초 열람, 양방향 무손실 CRDT 자동 병합',
        icon: Wifi,
        badge: '오프라인 볼트',
        keywords: ['오프라인', '기내', 'pwa', 'crdt', '동기화', '무손실', '볼트', 'offline', 'sync', 'flight'],
        onExecute: () => {
          onOpenMeetingGuardGovernance('offline');
          onClose();
        }
      },
      onOpenMeetingGuardGovernance && {
        id: 'action-guard-followup',
        category: '스마트 액션',
        title: '🎙️ 미팅 가드 24h/2h 에티켓 리마인더 & 3분 감사 팔로업 (Meeting Guard & Follow-Up)',
        subtitle: '미팅 24시간/2시간 전 품격 에티켓 알림 & 미팅 직후 3분 감사 서신·약속 이행 체크리스트 자동화',
        icon: Bell,
        badge: '미팅 가드',
        keywords: ['미팅', '리마인더', '감사', '팔로업', '약속', '노쇼', '서신', 'followup', 'meeting', 'guard'],
        onExecute: () => {
          onOpenMeetingGuardGovernance('followup');
          onClose();
        }
      }
    ].filter(Boolean) as Array<CommandAction & { keywords: string[] }>;

    const smartActionList: CommandAction[] = [];
    smartActions.forEach(action => {
      const isMatch = !q || 
        action.title.toLowerCase().includes(q) || 
        action.subtitle.toLowerCase().includes(q) || 
        action.keywords.some(kw => kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase()));
      if (isMatch) {
        smartActionList.push(action);
      }
    });

    // 3. 인물 검색 및 1초 브리핑 액션 (초성 검색 및 이름 매칭 지원)
    const isChoseong = isPureChoseong(q);
    const peopleActions: CommandAction[] = [];

    const matchedPeople = people.filter(p => {
      if (!q) return p.closeness <= 2; // 초기에는 1~2촌 핵심 인물 표시
      if (isChoseong) {
        return matchChoseong(p.name, q) || matchChoseong(p.currentCompany, q);
      }
      return (
        p.name.toLowerCase().includes(q) ||
        p.currentCompany.toLowerCase().includes(q) ||
        p.currentTitle.toLowerCase().includes(q) ||
        (p.primaryDomain && p.primaryDomain.toLowerCase().includes(q)) ||
        p.skills.some(s => s.toLowerCase().includes(q))
      );
    }).slice(0, 8);

    matchedPeople.forEach(p => {
      const isDart = p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector;
      
      // A. 미팅 10분 전 스마트 브리핑 열기 액션
      peopleActions.push({
        id: `briefing-${p.id}`,
        category: '인물 인텔리전스',
        title: `${p.name} (${p.currentCompany} ${p.currentTitle})`,
        subtitle: `C-Level 미팅 10분 전 스마트 브리핑 룸 즉시 열기 (1-Page Brief)`,
        icon: Sparkles,
        badge: isDart ? 'DART FACT' : '1-Page Brief',
        onExecute: () => {
          if (onOpenMeetingBriefing) {
            onOpenMeetingBriefing(p);
          } else {
            onSelectPerson(p);
          }
          onClose();
        }
      });

      // B. 프로필 상세 보기 액션
      peopleActions.push({
        id: `profile-${p.id}`,
        category: '인물 인텔리전스',
        title: `${p.name} 프로필 인스펙터`,
        subtitle: `${p.currentCompany} · 소통 타임라인 & 비즈니스 메모 열람`,
        icon: User,
        onExecute: () => {
          onSelectPerson(p);
          onClose();
        }
      });
    });

    // 4. 탭 필터링 및 지능형 섹션 리랭킹 (Adaptive Priority)
    if (categoryTab === 'people') return peopleActions;
    if (categoryTab === 'nav') return navActions;
    if (categoryTab === 'action') return smartActionList;

    // 'all' 모드: 인물 이름이나 초성 입력 시 인물 섹션을 최상단에 승격!
    const isPersonIntent = isChoseong || (q && people.some(p => p.name.toLowerCase().includes(q)));
    if (isPersonIntent) {
      return [...peopleActions, ...navActions, ...smartActionList];
    }
    return [...navActions, ...smartActionList, ...peopleActions];
  }, [query, categoryTab, people, onNavigateView, onSelectPerson, onOpenMeetingBriefing, onClose]);

  // 키보드 방향키 및 Enter / Escape 핸들링
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, actions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + actions.length) % Math.max(1, actions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (actions[selectedIndex]) {
        actions[selectedIndex].onExecute();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[15vh] p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="global-command-palette"
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3 bg-white dark:bg-slate-900">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="인맥 검색, 미팅 브리핑, 메뉴 이동... (예: 네이버, 김경영, 칸반, 테헤란로)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Category Tabs Filter Bar */}
        <div className="flex items-center gap-1 px-4 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => { setCategoryTab('all'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
              categoryTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => { setCategoryTab('people'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              categoryTab === 'people'
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3" />
            <span>인맥 인텔리전스</span>
          </button>
          <button
            type="button"
            onClick={() => { setCategoryTab('nav'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              categoryTab === 'nav'
                ? 'bg-slate-700 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>경영 네비게이션</span>
          </button>
          <button
            type="button"
            onClick={() => { setCategoryTab('action'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              categoryTab === 'action'
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>스마트 액션</span>
          </button>
        </div>

        {/* Action Items List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {actions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              일치하는 인맥이나 메뉴 액션을 찾지 못했습니다.
            </div>
          ) : (
            actions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = action.icon;

              return (
                <div
                  key={action.id}
                  data-index={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => action.onExecute()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      action.onExecute();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-white'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">
                          {action.title}
                        </span>
                        {action.badge && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            action.badge.includes('DART')
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {action.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                  }`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd>
              <span>이동</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd>
              <span>선택</span>
            </span>
          </div>
          <span>ConnectWe Spotlight · 마우스리스 초고속 제어</span>
        </div>
      </div>
    </div>
  );
};
