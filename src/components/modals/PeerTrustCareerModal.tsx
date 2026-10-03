import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  Award, QrCode, Coffee, Compass, Check, Copy, Sparkles, 
  X, Download, Eye, EyeOff, ShieldCheck, HeartHandshake, ArrowRight,
  RefreshCw, Send, MessageSquare, ChevronRight, Bookmark
} from 'lucide-react';
import {
  peerTrustCareerService,
  ENDORSEMENT_STRENGTH_TAGS,
  CAREER_GOAL_TRACKS
} from '../../services/peerTrustCareerService';
import {
  PeerEndorsement,
  DigitalCardProfile,
  RouletteRole,
  CoffeeRouletteMatch,
  CareerMentorMatch
} from '../../types/peerTrustCareer';

export interface PeerTrustCareerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'endorsements' | 'digitalCard' | 'roulette' | 'careerPath';
  people: Person[];
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const PeerTrustCareerModal: React.FC<PeerTrustCareerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'endorsements',
  people,
  onSelectPerson: _onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'endorsements' | 'digitalCard' | 'roulette' | 'careerPath'>(initialTab);

  // 1. 피어 실무 보증 탭 상태
  const [endorsements, setEndorsements] = useState<PeerEndorsement[]>(() => peerTrustCareerService.getEndorsements());
  const [selectedPersonForSummary, setSelectedPersonForSummary] = useState<string>('p-001');
  const [isAddEndorsementOpen, setIsAddEndorsementOpen] = useState(false);
  const [targetPersonId, setTargetPersonId] = useState(people[0]?.id || 'p-001');
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [newMemo, setNewMemo] = useState('');
  const [newRelationship, setNewRelationship] = useState('프로젝트 공동 개발 동료');
  const [copiedThankYouId, setCopiedThankYouId] = useState<string | null>(null);

  // 2. 디지털 실무 명함 탭 상태
  const [digitalProfile, setDigitalProfile] = useState<DigitalCardProfile>(() => peerTrustCareerService.getMyDigitalProfile());
  const [isMasked, setIsMasked] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // 3. 커피챗 룰렛 탭 상태
  const [myRouletteRole, setMyRouletteRole] = useState<RouletteRole>('frontend');
  const [currentMatch, setCurrentMatch] = useState<CoffeeRouletteMatch>(() => 
    peerTrustCareerService.spinCoffeeRoulette('frontend')
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // 4. 커리어 패스 탭 상태
  const [selectedTrackId, setSelectedTrackId] = useState<string>(CAREER_GOAL_TRACKS[0].id);
  const [userSkills, setUserSkills] = useState<string[]>([
    '대규모 분산 아키텍처 설계',
    '기술 부채와 비즈니스 기능 간의 우선순위 조율',
    '장애 대응 포스트모템(Post-mortem) 문화 정착'
  ]);
  const [copiedMentorReqId, setCopiedMentorReqId] = useState<string | null>(null);

  // initialTab 변경 시 동기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 대상 인물 요약 정보
  const endorsementSummary = useMemo(() => {
    const person = people.find(p => p.id === selectedPersonForSummary);
    const name = person ? person.name : '김지원';
    return peerTrustCareerService.getEndorsementSummary(selectedPersonForSummary, name);
  }, [people, selectedPersonForSummary, endorsements]);

  // vCard 및 QR 페이로드
  const vCardData = useMemo(() => {
    return peerTrustCareerService.generateVCard(digitalProfile, isMasked);
  }, [digitalProfile, isMasked]);

  // 커리어 패스 분석 결과
  const careerAnalysis = useMemo(() => {
    return peerTrustCareerService.analyzeCareerPath(selectedTrackId, userSkills);
  }, [selectedTrackId, userSkills]);

  if (!isOpen) return null;

  // ------------------------------------------
  // 핸들러 모음
  // ------------------------------------------

  const handleAddEndorsementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStrengths.length === 0) {
      onShowToast('최소 1개 이상의 핵심 실무 강점을 선택해 주세요.');
      return;
    }
    if (!newMemo.trim()) {
      onShowToast('정성적인 실무 추천 메모를 작성해 주세요.');
      return;
    }

    const targetPerson = people.find(p => p.id === targetPersonId);
    const targetName = targetPerson ? targetPerson.name : '동료';

    const created = peerTrustCareerService.addEndorsement({
      targetPersonId,
      targetPersonName: targetName,
      endorserPersonId: 'my-user-001',
      endorserName: digitalProfile.name,
      endorserTitle: digitalProfile.title,
      endorserCompany: digitalProfile.company,
      relationship: newRelationship,
      selectedStrengths,
      memo: newMemo
    });

    setEndorsements(prev => [created, ...prev]);
    setIsAddEndorsementOpen(false);
    setSelectedStrengths([]);
    setNewMemo('');
    onShowToast(`🌟 ${targetName} 님에 대한 실무 보증이 등록되었습니다.`);
  };

  const handleCopyThankYouNote = (endorsement: PeerEndorsement) => {
    const note = peerTrustCareerService.generateThankYouNote(endorsement);
    navigator.clipboard.writeText(note);
    peerTrustCareerService.markThankYouNoteSent(endorsement.id);
    setEndorsements(peerTrustCareerService.getEndorsements());
    setCopiedThankYouId(endorsement.id);
    onShowToast('💌 따뜻한 감사 답례 서신이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedThankYouId(null), 3000);
  };

  const handleDownloadVCard = () => {
    const blob = new Blob([vCardData.vcfString], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${digitalProfile.name}_ConnectWe.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('📇 모바일 주소록 저장용 vCard (.vcf)가 다운로드되었습니다.');
  };

  const handleSpinRoulette = () => {
    setIsSpinning(true);
    setTimeout(() => {
      const match = peerTrustCareerService.spinCoffeeRoulette(myRouletteRole);
      setCurrentMatch(match);
      setIsSpinning(false);
      onShowToast(`🎉 새로운 크로스 직무 파트너(${match.partner.name} 님)와 매칭되었습니다!`);
    }, 600);
  };

  const handleCopyRouletteInvite = () => {
    navigator.clipboard.writeText(currentMatch.invitationMessage);
    setCopiedInviteId(currentMatch.id);
    onShowToast('🤝 캐주얼 커피챗 초대 서신이 복사되었습니다.');
    setTimeout(() => setCopiedInviteId(null), 3000);
  };

  const handleToggleUserSkill = (skill: string) => {
    if (userSkills.includes(skill)) {
      setUserSkills(userSkills.filter(s => s !== skill));
    } else {
      setUserSkills([...userSkills, skill]);
    }
  };

  const handleCopyMentorRequest = (mentor: CareerMentorMatch, focusSkill: string) => {
    const text = peerTrustCareerService.generateMentorAdviceRequest(
      mentor,
      careerAnalysis.goal.targetRole,
      focusSkill
    );
    navigator.clipboard.writeText(text);
    setCopiedMentorReqId(`${mentor.personId}-${focusSkill}`);
    onShowToast(`💌 ${mentor.name} 멘토님께 전송할 조언 요청 서신이 복사되었습니다.`);
    setTimeout(() => setCopiedMentorReqId(null), 3000);
  };

  return (
    <div 
      data-testid="peer-trust-career-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 via-sky-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">실무 인재 신뢰 & 커리어 도약 스튜디오</h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Peer Trust & Career Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                현장 실무 역량 보증, 모바일 디지털 명함, 크로스 직무 티타임, 커리어 멘토 매칭
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
            data-testid="tab-peer-endorsements"
            onClick={() => setActiveTab('endorsements')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'endorsements'
                ? 'bg-slate-900 border-slate-700 text-amber-400 border-b-transparent shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>1. 피어 실무 보증 & 신뢰 뱃지</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500/20 text-amber-300">
              {endorsements.length}
            </span>
          </button>

          <button
            data-testid="tab-peer-digital-card"
            onClick={() => setActiveTab('digitalCard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'digitalCard'
                ? 'bg-slate-900 border-slate-700 text-sky-400 border-b-transparent shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <QrCode className="w-4 h-4 text-sky-400" />
            <span>2. 디지털 실무 명함 (vCard)</span>
          </button>

          <button
            data-testid="tab-peer-roulette"
            onClick={() => setActiveTab('roulette')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'roulette'
                ? 'bg-slate-900 border-slate-700 text-emerald-400 border-b-transparent shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Coffee className="w-4 h-4 text-emerald-400" />
            <span>3. 크로스 직무 커피챗 룰렛</span>
          </button>

          <button
            data-testid="tab-peer-career-path"
            onClick={() => setActiveTab('careerPath')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'careerPath'
                ? 'bg-slate-900 border-slate-700 text-indigo-400 border-b-transparent shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>4. 커리어 패스 & 스킬 갭 멘토</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300">
              {careerAnalysis.readinessScore}%
            </span>
          </button>
        </div>

        {/* 탭 본문 컨테이너 */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
          
          {/* ========================================================
              탭 1: 피어 실무 보증 & 신뢰 뱃지
             ======================================================== */}
          {activeTab === 'endorsements' && (
            <div className="space-y-6">
              
              {/* 상단 요약 & 신뢰 뱃지 배너 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-800/50 to-indigo-950/30 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-100">{endorsementSummary.personName} 님의 실무 신뢰 현황</span>
                      {endorsementSummary.isPeerVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          동료 공인 실무 인재 (Verified)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      총 {endorsementSummary.totalEndorsements}명의 실무 파트너가 남긴 진솔한 협업 보증 내역입니다.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {endorsementSummary.topStrengths.map(s => (
                        <span key={s.tagId} className="px-2 py-0.5 text-xs font-medium rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20">
                          ⭐ {s.label} <span className="opacity-70 font-mono">+{s.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => setIsAddEndorsementOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    새 실무 보증 남기기
                  </button>
                </div>
              </div>

              {/* 보증 추가 폼 모달 (인라인 확장) */}
              {isAddEndorsementOpen && (
                <form onSubmit={handleAddEndorsementSubmit} className="p-5 rounded-2xl bg-slate-800/80 border border-amber-500/40 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      소중한 동료에게 실무 보증 남기기
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setIsAddEndorsementOpen(false)}
                      className="text-slate-400 hover:text-slate-200 text-xs"
                    >
                      취소
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">보증할 동료 선택</label>
                      <select
                        value={targetPersonId}
                        onChange={(e) => setTargetPersonId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        {people.slice(0, 15).map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.currentCompany || '기업'} · {p.currentTitle || '엔지니어'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1 block">협업 관계 (맥락)</label>
                      <input
                        type="text"
                        value={newRelationship}
                        onChange={(e) => setNewRelationship(e.target.value)}
                        placeholder="예: 프로젝트 공동 개발 동료, 디자인 시스템 협업 파트너"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      인정하는 핵심 실무 강점 (최대 3개 선택)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {ENDORSEMENT_STRENGTH_TAGS.map(tag => {
                        const isSelected = selectedStrengths.includes(tag.id);
                        return (
                          <button
                            type="button"
                            key={tag.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedStrengths(selectedStrengths.filter(id => id !== tag.id));
                              } else {
                                if (selectedStrengths.length >= 3) {
                                  onShowToast('실무 강점은 최대 3개까지 선택할 수 있습니다.');
                                  return;
                                }
                                setSelectedStrengths([...selectedStrengths, tag.id]);
                              }
                            }}
                            className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold'
                                : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <div className="font-semibold text-slate-100 flex items-center justify-between">
                              <span>{tag.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{tag.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      정성적 3줄 실무 추천 메모
                    </label>
                    <textarea
                      rows={3}
                      value={newMemo}
                      onChange={(e) => setNewMemo(e.target.value)}
                      placeholder="동료와 함께 일하며 가장 인상 깊었던 실무 에피소드나 뛰어난 역량을 3줄 이내로 진솔하게 남겨주세요."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddEndorsementOpen(false)}
                      className="px-3.5 py-1.5 text-xs rounded-xl text-slate-400 hover:bg-slate-700"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                    >
                      보증 등록하기
                    </button>
                  </div>
                </form>
              )}

              {/* 받은 실무 보증 카드 리스트 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    최근 등록된 실무 신뢰 보증 ({endorsements.length}건)
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span>대상 인물 필터:</span>
                    <select
                      value={selectedPersonForSummary}
                      onChange={(e) => setSelectedPersonForSummary(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="p-001">김지원 (프론트엔드 리드)</option>
                      <option value="p-002">박서현 (프로덕트 디자이너)</option>
                      {people.slice(0, 10).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {endorsements.map(item => {
                    const isCopied = copiedThankYouId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-100">{item.endorserName}</span>
                                <span className="text-xs text-slate-400">{item.endorserTitle} · {item.endorserCompany}</span>
                              </div>
                              <div className="text-[11px] text-indigo-400 font-medium mt-0.5">
                                🔗 {item.relationship}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{item.createdAt}</span>
                          </div>

                          <p className="text-xs text-slate-300 mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 leading-relaxed italic">
                            &quot;{item.memo}&quot;
                          </p>

                          <div className="flex flex-wrap gap-1 mt-3">
                            {item.selectedStrengths.map(tagId => {
                              const tag = ENDORSEMENT_STRENGTH_TAGS.find(t => t.id === tagId);
                              return (
                                <span key={tagId} className="px-2 py-0.5 text-[10px] rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                  ✓ {tag ? tag.label : tagId}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            {item.thankYouNoteSent ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> 감사 답례 서신 전달 완료
                              </span>
                            ) : (
                              <span className="text-slate-500">답례 서신 미전송</span>
                            )}
                          </div>

                          <button
                            onClick={() => handleCopyThankYouNote(item)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>감사 커피 서신 복사</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              탭 2: 디지털 실무 명함 & QR vCard
             ======================================================== */}
          {activeTab === 'digitalCard' && (
            <div className="space-y-6">
              
              {/* 상단 컨트롤 바 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-sky-400" />
                    모바일 1-Page 디지털 실무 명함 (Apple Wallet 감성)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    밋업이나 티타임에서 상대방 스마트폰 카메라로 스캔하여 주소록에 즉시 저장합니다.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMasked(!isMasked)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                      isMasked
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    {isMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isMasked ? '개인정보 마스킹 켜짐' : '전체 정보 표시'}</span>
                  </button>

                  <button
                    onClick={handleDownloadVCard}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.vcf 다운로드</span>
                  </button>
                </div>
              </div>

              {/* 프리미엄 명함 뷰 & QR 카드 2-컬럼 레이아웃 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 좌측: 실물 크기 디지털 명함 카드 */}
                <div className="lg:col-span-7">
                  <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950/80 border border-slate-750 shadow-2xl space-y-5">
                    
                    {/* 카드 탑: 브랜드 & 뱃지 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                          ConnectWe Executive Member
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        RFC 6350 Certified
                      </span>
                    </div>

                    {/* 카드 메인: 성명, 직함, 소속 */}
                    <div>
                      <h2 className="text-2xl font-black text-slate-50 tracking-tight">
                        {digitalProfile.name}
                      </h2>
                      <div className="text-sm font-semibold text-sky-400 mt-0.5">
                        {digitalProfile.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {digitalProfile.company} · {digitalProfile.department}
                      </div>
                    </div>

                    {/* 카드 바이오 */}
                    <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-sky-400 pl-3 italic">
                      &quot;{digitalProfile.shortBio}&quot;
                    </p>

                    {/* 현재 집중 프로젝트 */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="text-[11px] font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5" />
                        현재 집중 프로젝트
                      </div>
                      <div className="text-slate-200">{digitalProfile.currentFocusProject}</div>
                    </div>

                    {/* 프로덕션 스택 뱃지 */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        프로덕션 핵심 스택 (Production Stack)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {digitalProfile.productionStack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 text-xs font-mono rounded-lg bg-sky-950/60 text-sky-300 border border-sky-500/30"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 자문 가능한 3대 주제 */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        편안하게 자문 가능한 3대 실무 주제
                      </div>
                      <ul className="space-y-1">
                        {digitalProfile.consultingTopics.map((topic, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 카드 푸터: 연락처 정보 */}
                    <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                      <div>TEL: <span className="font-mono text-slate-200">{isMasked ? vCardData.maskedPhone : digitalProfile.phone}</span></div>
                      <div>EMAIL: <span className="font-mono text-slate-200">{isMasked ? vCardData.maskedEmail : digitalProfile.email}</span></div>
                      {digitalProfile.githubUrl && (
                        <div>GITHUB: <span className="font-mono text-sky-300">{digitalProfile.githubUrl.replace('https://', '')}</span></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 우측: QR 코드 및 스마트폰 스캔 가이드 */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  
                  {/* QR 코드 디스플레이 카드 */}
                  <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/80 flex flex-col items-center text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      스마트폰 기본 카메라로 스캔
                    </div>

                    {/* SVG 기반 프리미엄 QR 모의 렌더링 */}
                    <div className="p-4 rounded-2xl bg-white shadow-xl border-4 border-sky-400/30 w-48 h-48 flex flex-col items-center justify-center relative group">
                      <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none">
                        {/* 4 모서리 정렬 마커 */}
                        <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="4" />
                        <rect x="10" y="10" width="15" height="15" fill="#ffffff" rx="2" />
                        <rect x="14" y="14" width="7" height="7" fill="#0284c7" />

                        <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="4" />
                        <rect x="75" y="10" width="15" height="15" fill="#ffffff" rx="2" />
                        <rect x="79" y="14" width="7" height="7" fill="#0284c7" />

                        <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="4" />
                        <rect x="10" y="75" width="15" height="15" fill="#ffffff" rx="2" />
                        <rect x="14" y="79" width="7" height="7" fill="#0284c7" />

                        {/* 데이터 도트 패턴 */}
                        <circle cx="45" cy="15" r="3" fill="#0f172a" />
                        <circle cx="55" cy="20" r="2.5" fill="#0f172a" />
                        <circle cx="40" cy="30" r="3" fill="#0f172a" />
                        <circle cx="50" cy="40" r="3" fill="#0284c7" />
                        <circle cx="60" cy="35" r="2.5" fill="#0f172a" />
                        <circle cx="35" cy="50" r="2" fill="#0f172a" />
                        <circle cx="50" cy="50" r="4" fill="#0284c7" />
                        <circle cx="65" cy="50" r="3" fill="#0f172a" />
                        <circle cx="45" cy="65" r="2.5" fill="#0f172a" />
                        <circle cx="55" cy="60" r="3" fill="#0f172a" />
                        <circle cx="40" cy="80" r="3" fill="#0f172a" />
                        <circle cx="55" cy="85" r="2.5" fill="#0284c7" />
                        <circle cx="75" cy="45" r="3" fill="#0f172a" />
                        <circle cx="85" cy="55" r="2" fill="#0f172a" />
                        <circle cx="75" cy="75" r="3" fill="#0f172a" />
                        <circle cx="85" cy="80" r="2.5" fill="#0284c7" />
                      </svg>
                      
                      <div className="absolute inset-0 bg-slate-900/90 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <span className="text-[11px] text-sky-300 font-semibold mb-1">스마트폰 주소록 자동 연결</span>
                        <span className="text-[10px] text-slate-300">iOS 연락처 / 안드로이드 연락처 호환</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 font-medium">
                      {digitalProfile.name} 님의 vCard v4.0 QR
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      상대방이 별도 앱 설치 없이 스캔 즉시 주소록에 추가할 수 있습니다.
                    </p>
                  </div>

                  {/* 프로필 수정 토글 안내 */}
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-2">
                    <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      디지털 명함 정보 수정하기
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      현재 직함이나 프로덕션 스택, 자문 주제가 변경되었을 때 실시간으로 프로필을 업데이트할 수 있습니다.
                    </p>
                    <button
                      onClick={() => setIsEditProfileOpen(!isEditProfileOpen)}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-semibold transition-colors"
                    >
                      {isEditProfileOpen ? '수정 닫기' : '프로필 인라인 편집'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 프로필 인라인 편집 폼 */}
              {isEditProfileOpen && (
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-sky-500/40 space-y-4 animate-in fade-in duration-200">
                  <h4 className="text-sm font-bold text-sky-300">내 디지털 명함 정보 수정</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">이름</label>
                      <input
                        type="text"
                        value={digitalProfile.name}
                        onChange={(e) => setDigitalProfile({ ...digitalProfile, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">직함 (Title)</label>
                      <input
                        type="text"
                        value={digitalProfile.title}
                        onChange={(e) => setDigitalProfile({ ...digitalProfile, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">소속 기업</label>
                      <input
                        type="text"
                        value={digitalProfile.company}
                        onChange={(e) => setDigitalProfile({ ...digitalProfile, company: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">한 줄 소개 (Short Bio)</label>
                    <input
                      type="text"
                      value={digitalProfile.shortBio}
                      onChange={(e) => setDigitalProfile({ ...digitalProfile, shortBio: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        peerTrustCareerService.saveMyDigitalProfile(digitalProfile);
                        setIsEditProfileOpen(false);
                        onShowToast('💾 디지털 명함 프로필이 저장되었습니다.');
                      }}
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
                    >
                      저장 완료
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              탭 3: 크로스 직무 1:1 캐주얼 커피챗 룰렛
             ======================================================== */}
          {activeTab === 'roulette' && (
            <div className="space-y-6">
              
              {/* 상단 룰렛 컨트롤러 바 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-800/50 to-teal-950/30 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-emerald-400" />
                    크로스 직무 1:1 캐주얼 커피챗 룰렛
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    개발자 ↔ 디자이너 ↔ PM 간 격주 20분 캐주얼 티타임으로 서로의 시각을 넓힙니다.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span>내 직무:</span>
                    <select
                      value={myRouletteRole}
                      onChange={(e) => setMyRouletteRole(e.target.value as RouletteRole)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="frontend">프론트엔드 엔지니어</option>
                      <option value="backend">백엔드 엔지니어</option>
                      <option value="designer">프로덕트 디자이너</option>
                      <option value="pm">프로덕트 매니저 (PO)</option>
                      <option value="data">데이터 엔지니어 / AI</option>
                      <option value="marketing">그로스 마케터</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSpinRoulette}
                    disabled={isSpinning}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>{isSpinning ? '파트너 매칭 중...' : '룰렛 돌리기'}</span>
                  </button>
                </div>
              </div>

              {/* 매칭된 파트너 카드 & 3대 아이스브레이킹 대화 의제 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 좌측: 매칭된 동료 프로필 카드 */}
                <div className="lg:col-span-5">
                  <div className="p-6 rounded-3xl bg-slate-800/40 border border-emerald-500/30 flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Cross-Role Partner Matched
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {currentMatch.partner.closeness}촌 네트워크
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md">
                          {currentMatch.partner.name[0]}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-100">{currentMatch.partner.name}</h4>
                          <p className="text-xs text-emerald-400 font-semibold">{currentMatch.partner.roleLabel}</p>
                          <p className="text-xs text-slate-400">{currentMatch.partner.company} · {currentMatch.partner.title}</p>
                        </div>
                      </div>

                      <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                        <div className="text-[11px] font-semibold text-slate-400 mb-1">최근 하이라이트</div>
                        <p className="text-slate-200">{currentMatch.partner.recentHighlight}</p>
                      </div>

                      <div className="mt-4">
                        <div className="text-[11px] font-semibold text-slate-400 mb-1.5">상호 관심 교류 주제</div>
                        <div className="flex flex-wrap gap-1.5">
                          {currentMatch.partner.topicsOfInterest.map((topic, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">
                              💬 {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-emerald-400" />
                      <span>추천 일정: {currentMatch.suggestedSchedule}</span>
                    </div>
                  </div>
                </div>

                {/* 우측: 3대 아이스브레이킹 의제 카드 & 캘린더 초대 서신 */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* 아이스브레이킹 대화 카드 */}
                  <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      어색함 없는 3대 아이스브레이킹 대화 카드
                    </h4>
                    
                    <div className="space-y-2">
                      {currentMatch.icebreakerQuestions.map((q, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-slate-200 leading-relaxed">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 캘린더 초대 서신 프리뷰 & 1-Click 복사 */}
                  <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-sky-400" />
                        1-Click 정중한 커피챗 제안 서신
                      </h4>
                      <button
                        onClick={handleCopyRouletteInvite}
                        className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
                      >
                        {copiedInviteId === currentMatch.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>초대 서신 복사</span>
                      </button>
                    </div>

                    <pre className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {currentMatch.invitationMessage}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              탭 4: 커리어 패스 & 스킬 갭 멘토 매칭
             ======================================================== */}
          {activeTab === 'careerPath' && (
            <div className="space-y-6">
              
              {/* 상단 트랙 선택기 탭 */}
              <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
                {CAREER_GOAL_TRACKS.map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      selectedTrackId === track.id
                        ? 'bg-indigo-600 text-slate-100 border-indigo-400 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {track.targetRole}
                  </button>
                ))}
              </div>

              {/* 트랙 개요 & 준비도(Readiness) 게이지 */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-800/50 to-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100">{careerAnalysis.goal.targetRole}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {careerAnalysis.goal.typicalTenure}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{careerAnalysis.goal.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-slate-400 font-semibold">목표 도달 준비도</div>
                      <div className="text-xl font-black text-indigo-400">{careerAnalysis.readinessScore}%</div>
                    </div>
                    <div className="w-16 h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                        style={{ width: `${careerAnalysis.readinessScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 스킬 갭 체크리스트 & 멘토 매칭 2-컬럼 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 좌측: 역량 체크리스트 & 부족 갭 도출 */}
                <div className="lg:col-span-6 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>목표 핵심 역량 진단 (클릭하여 보유 여부 토글)</span>
                    <span className="text-indigo-400 font-mono text-[11px]">
                      {careerAnalysis.acquiredSkills.length} / {careerAnalysis.skillGaps.length} 달성
                    </span>
                  </h4>

                  <div className="space-y-2">
                    {careerAnalysis.skillGaps.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleToggleUserSkill(item.skill)}
                        className={`w-full p-3 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                          item.isAcquired
                            ? 'bg-indigo-950/40 border-indigo-500/40 text-slate-200'
                            : 'bg-slate-800/30 border-slate-700/60 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            item.isAcquired ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-600'
                          }`}>
                            {item.isAcquired && <Check className="w-3 h-3" />}
                          </div>
                          <span className={item.isAcquired ? 'font-semibold text-slate-100' : ''}>
                            {item.skill}
                          </span>
                        </div>

                        {!item.isAcquired && (
                          <span className="px-2 py-0.5 text-[10px] rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            멘토 조언 추천
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* 추천 로드맵 스텝 */}
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 text-xs space-y-2 mt-4">
                    <div className="font-semibold text-slate-300">권장 성장 로드맵</div>
                    <ul className="space-y-1.5">
                      {careerAnalysis.goal.recommendedRoadmapSteps.map((step, idx) => (
                        <li key={idx} className="text-slate-400 flex items-start gap-2 text-[11px]">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 우측: 부족 스킬을 보유한 멘토 카드 & 조언 요청 서신 */}
                <div className="lg:col-span-6 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    부족 역량 자문 가능한 1촌/2촌 실무 멘토
                  </h4>

                  <div className="space-y-3">
                    {careerAnalysis.matchedMentors.map(mentor => {
                      const firstMissingSkill = careerAnalysis.skillGaps.find(s => !s.isAcquired)?.skill || mentor.expertInSkills[0];
                      const copyKey = `${mentor.personId}-${firstMissingSkill}`;
                      const isCopied = copiedMentorReqId === copyKey;

                      return (
                        <div key={mentor.personId} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-100">{mentor.name}</span>
                                <span className="text-[11px] text-indigo-300 font-semibold">
                                  {mentor.closeness}촌 인맥
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{mentor.company} · {mentor.title}</p>
                            </div>
                            <button
                              onClick={() => handleCopyMentorRequest(mentor, firstMissingSkill)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-colors"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>조언 요청 서신 복사</span>
                            </button>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                            <span className="text-indigo-400 font-semibold">추천 자문 주제: </span>
                            {mentor.adviceTopic}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {mentor.expertInSkills.map((sk, i) => (
                              <span key={i} className="px-2 py-0.5 text-[10px] rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/20">
                                💡 {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-amber-400" />
            <span>ConnectWe는 실무 인재의 고유 역량과 따뜻한 신뢰 네트워크를 응원합니다.</span>
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
