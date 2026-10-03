import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  TechClusterCategory, 
  TechSkillNode, 
  TechExpertMatch, 
  WarmReferralJob, 
  ReferralLetterPreset,
  StudyGuildPod,
  CoffeeChatInsightNote 
} from '../../types/peerSynergy';
import { 
  TECH_SKILL_NODES,
  getExpertsForTechSkill,
  generateTechAdviceLetter,
  MOCK_WARM_REFERRAL_JOBS,
  generateWarmReferralLetter,
  loadStudyGuilds,
  toggleJoinGuild,
  generateGuildShareProposal,
  loadCoffeeChatNotes,
  addCoffeeChatNote,
  markGratitudeSent,
  generateGratitudeFeedbackCard
} from '../../services/peerSynergyService';
import { 
  X, Layers, Briefcase, Rocket, BookOpen, 
  Check, Copy, Sparkles, Users, Plus, 
  ShieldCheck, HeartHandshake
} from 'lucide-react';

export interface PeerSynergyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'tech' | 'referral' | 'guild' | 'notes';
  people: Person[];
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const PeerSynergyHubModal: React.FC<PeerSynergyHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'tech',
  people,
  onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'tech' | 'referral' | 'guild' | 'notes'>(initialTab);

  // 1. 테크 스택 탭 상태
  const [selectedTechCategory, setSelectedTechCategory] = useState<TechClusterCategory | 'all'>('all');
  const [activeSkill, setActiveSkill] = useState<TechSkillNode>(() => TECH_SKILL_NODES[0]);
  const [copiedLetterSkillId, setCopiedLetterSkillId] = useState<string | null>(null);

  // 2. 사내 추천 탭 상태
  const [selectedJob, setSelectedJob] = useState<WarmReferralJob>(() => MOCK_WARM_REFERRAL_JOBS[0]);
  const [referralLetterType, setReferralLetterType] = useState<ReferralLetterPreset['type']>('TEA_CHAT_CULTURE');
  const [copiedReferralType, setCopiedReferralType] = useState<string | null>(null);

  // 3. 스터디 길드 탭 상태
  const [guilds, setGuilds] = useState<StudyGuildPod[]>(() => loadStudyGuilds());
  const [copiedGuildId, setCopiedGuildId] = useState<string | null>(null);

  // 4. 커피챗 인사이트 탭 상태
  const [notes, setNotes] = useState<CoffeeChatInsightNote[]>(() => loadCoffeeChatNotes());
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [selectedPersonForNote, setSelectedPersonForNote] = useState<string>(() => people[0]?.id || '');
  const [newDiscussionTheme, setNewDiscussionTheme] = useState('');
  const [newTakeaway1, setNewTakeaway1] = useState('');
  const [newTakeaway2, setNewTakeaway2] = useState('');
  const [newTakeaway3, setNewTakeaway3] = useState('');
  const [newRecommendedTools, setNewRecommendedTools] = useState('');
  const [newNextAction, setNewNextAction] = useState('');
  const [copiedNoteGratitudeId, setCopiedNoteGratitudeId] = useState<string | null>(null);

  // initialTab 변경 시 동기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 테크 스택 필터링
  const filteredSkills = useMemo(() => {
    if (selectedTechCategory === 'all') return TECH_SKILL_NODES;
    return TECH_SKILL_NODES.filter(s => s.category === selectedTechCategory);
  }, [selectedTechCategory]);

  // 현재 선택된 기술의 전문가 매칭
  const currentExperts = useMemo(() => {
    if (!activeSkill) return [];
    return getExpertsForTechSkill(activeSkill.id, people);
  }, [activeSkill, people]);

  if (!isOpen) return null;

  // 액션: 기술 자문 서신 복사
  const handleCopyTechAdviceLetter = (skill: TechSkillNode, expert: TechExpertMatch) => {
    const letter = generateTechAdviceLetter(skill, expert);
    navigator.clipboard.writeText(letter);
    setCopiedLetterSkillId(`${skill.id}-${expert.personId}`);
    onShowToast(`💌 [${expert.name} 님께 보내는] ${skill.name} 기술 자문 서신이 복사되었습니다!`);
    setTimeout(() => setCopiedLetterSkillId(null), 2500);
  };

  // 액션: 사내 추천 서신 복사
  const handleCopyWarmReferralLetter = () => {
    const letterPreset = generateWarmReferralLetter(selectedJob, referralLetterType);
    navigator.clipboard.writeText(letterPreset.content);
    setCopiedReferralType(referralLetterType);
    onShowToast(`📄 [${letterPreset.title}] 서신이 복사되었습니다.`);
    setTimeout(() => setCopiedReferralType(null), 2500);
  };

  // 액션: 길드 참가 신청 토글
  const handleToggleJoinGuild = (guildId: string) => {
    const updated = toggleJoinGuild(guildId, {
      name: '나 (본인)',
      role: 'Core Contributor',
      company: 'ConnectWe'
    });
    setGuilds(updated);
    onShowToast('🎉 스터디 길드 참여 상태가 업데이트되었습니다.');
  };

  // 액션: 길드 제안서 복사
  const handleCopyGuildProposal = (guild: StudyGuildPod) => {
    const proposal = generateGuildShareProposal(guild);
    navigator.clipboard.writeText(`${proposal.shareTitle}\n\n${proposal.shareBody}`);
    setCopiedGuildId(guild.id);
    onShowToast(`🚀 [${guild.title}] 1-Page 길드 모집 제안서가 복사되었습니다!`);
    setTimeout(() => setCopiedGuildId(null), 2500);
  };

  // 액션: 신규 커피챗 노트 저장
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPerson = people.find(p => p.id === selectedPersonForNote);
    if (!targetPerson || !newDiscussionTheme.trim()) {
      onShowToast('논의 주제를 입력해 주세요.');
      return;
    }

    const takeaways = [newTakeaway1, newTakeaway2, newTakeaway3].filter(t => t.trim().length > 0);
    const tools = newRecommendedTools.split(',').map(s => s.trim()).filter(Boolean);

    const updated = addCoffeeChatNote({
      personId: targetPerson.id,
      personName: targetPerson.name,
      company: targetPerson.currentCompany,
      title: targetPerson.currentTitle,
      metAt: new Date().toISOString().split('T')[0],
      discussionTheme: newDiscussionTheme.trim(),
      keyTakeaways: takeaways.length > 0 ? takeaways : ['실무 아키텍처 및 트레이드오프 심층 논의'],
      recommendedTools: tools,
      nextAction: newNextAction.trim() || '공유받은 레퍼런스 검토 및 실무 적용 테스트',
      gratitudeSent: false
    });

    setNotes(updated);
    setIsAddNoteOpen(false);
    setNewDiscussionTheme('');
    setNewTakeaway1('');
    setNewTakeaway2('');
    setNewTakeaway3('');
    setNewRecommendedTools('');
    setNewNextAction('');
    onShowToast(`✨ [${targetPerson.name}] 님과의 커피챗 인사이트가 볼트에 안전하게 아카이빙되었습니다.`);
  };

  // 액션: 감사 피드백 서신 복사
  const handleCopyGratitudeCard = (note: CoffeeChatInsightNote) => {
    const card = generateGratitudeFeedbackCard(note);
    navigator.clipboard.writeText(card.content);
    const updated = markGratitudeSent(note.id);
    setNotes(updated);
    setCopiedNoteGratitudeId(note.id);
    onShowToast(`💌 [${note.personName} 님을 위한] 따뜻한 감사 서신 카드가 복사되었습니다!`);
    setTimeout(() => setCopiedNoteGratitudeId(null), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      data-testid="peer-synergy-hub-modal"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  실무 인재 시너지 & 성장 스튜디오
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 font-mono">
                  PEER SYNERGY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                개발자·디자이너·PM 등 현업 실무진의 테크 스택 교류, 사내 추천 채용, 사이드 프로젝트 길드 및 커피챗 인사이트
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="닫기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Tabs Navigation Bar */}
        <div className="px-6 pt-3 border-b border-slate-150 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto bg-white dark:bg-slate-900 shrink-0">
          <button
            data-testid="tab-synergy-tech"
            onClick={() => setActiveTab('tech')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'tech'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>테크 스택 랜드스케이프</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
              {TECH_SKILL_NODES.length}
            </span>
          </button>

          <button
            data-testid="tab-synergy-referral"
            onClick={() => setActiveTab('referral')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'referral'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>따뜻한 사내 채용 추천</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold">
              {MOCK_WARM_REFERRAL_JOBS.length}
            </span>
          </button>

          <button
            data-testid="tab-synergy-guild"
            onClick={() => setActiveTab('guild')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'guild'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>스터디 & 사이드 길드</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
              {guilds.length}
            </span>
          </button>

          <button
            data-testid="tab-synergy-notes"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>커피챗 인사이트 노트</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-mono font-bold">
              {notes.length}
            </span>
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ========================================================= */}
          {/* TAB 1: 테크 스택 랜드스케이프 */}
          {/* ========================================================= */}
          {activeTab === 'tech' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {[
                  { id: 'all', label: '전체 스택' },
                  { id: 'frontend', label: '🎨 프론트엔드 & UI' },
                  { id: 'backend', label: '⚙️ 백엔드 & 분산 아키텍처' },
                  { id: 'ai_data', label: '🤖 AI & 데이터 RAG' },
                  { id: 'cloud_devops', label: '☁️ 클라우드 & FinOps' },
                  { id: 'product_growth', label: '💼 프로덕트 & 과금' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedTechCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedTechCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {filteredSkills.map(skill => {
                  const isSelected = activeSkill.id === skill.id;
                  return (
                    <div
                      key={skill.id}
                      onClick={() => setActiveSkill(skill)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-300 shadow-sm dark:bg-indigo-950/40 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 dark:bg-slate-800/80 dark:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            {skill.categoryLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-200/60 font-mono">
                            실무 검증 {skill.expertCount}명
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {skill.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {skill.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-150 dark:border-slate-700/60">
                        {skill.tags.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/60 font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Skill's Expert Mentors */}
              <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>[{activeSkill.name}] 실무 프로덕션 도입 경험자 ({currentExperts.length}명)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      실서비스에 직접 도입하고 운영한 경험이 있는 1촌 및 사내 2촌 엔지니어입니다.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentExperts.map(exp => {
                    const isCopied = copiedLetterSkillId === `${activeSkill.id}-${exp.personId}`;
                    return (
                      <div
                        key={exp.personId}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-2xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span 
                                onClick={() => {
                                  const p = people.find(x => x.id === exp.personId);
                                  if (p && onSelectPerson) onSelectPerson(p);
                                }}
                                className="font-bold text-slate-900 dark:text-white text-sm hover:text-indigo-600 transition-colors cursor-pointer"
                                title="상세 프로필 보기"
                              >
                                {exp.name}
                              </span>
                              <span className="text-xs text-slate-500 ml-1.5">
                                {exp.currentCompany} · {exp.currentTitle}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              exp.closeness === 1
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {exp.closeness === 1 ? '1촌 (직통)' : '2촌 (동료 가교)'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-700 leading-relaxed">
                            💡 {exp.experienceHighlight}
                          </p>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              자문 가능 핵심 의제
                            </span>
                            <ul className="text-[11px] text-slate-500 space-y-0.5 pl-3 list-disc">
                              {exp.sampleDiscussionTopics.slice(0, 2).map((top, idx) => (
                                <li key={idx} className="line-clamp-1">{top}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyTechAdviceLetter(activeSkill, exp)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? '서신 복사됨!' : '☕ 기술 자문 서신 복사'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: 따뜻한 사내 채용 추천 (Warm Referral) */}
          {/* ========================================================= */}
          {activeTab === 'referral' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>헤드헌팅 스팸 제로! 내 1촌/2촌 지인의 신뢰 보증 기반으로 열린 테크 채용 포지션입니다.</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-700 bg-white/80 dark:bg-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-200">
                  사내 추천 지원
                </span>
              </div>

              {/* Jobs List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {MOCK_WARM_REFERRAL_JOBS.map(job => {
                  const isSelected = selectedJob.id === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-sm dark:bg-emerald-950/40 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 dark:bg-slate-800/80 dark:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-500 dark:text-slate-400">
                            {job.company}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {job.jobLevel}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                          {job.title}
                        </h4>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <span>{job.department}</span> · <span>{job.location}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-150 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                          <HeartHandshake className="w-3.5 h-3.5" />
                          {job.internalReferrer.name}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {job.referralReward}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Job Detail & Referral Letter Studio */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      <span>{selectedJob.company} - {selectedJob.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      사내 추천인: <strong className="text-slate-800 dark:text-slate-200">{selectedJob.internalReferrer.name}</strong> ({selectedJob.internalReferrer.title})
                    </p>
                  </div>

                  {/* Letter Preset Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setReferralLetterType('TEA_CHAT_CULTURE')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        referralLetterType === 'TEA_CHAT_CULTURE'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      1. 문화 커피챗
                    </button>
                    <button
                      onClick={() => setReferralLetterType('INTERNAL_REFERRAL_ASK')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        referralLetterType === 'INTERNAL_REFERRAL_ASK'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      2. 사내추천 부탁
                    </button>
                    <button
                      onClick={() => setReferralLetterType('PEER_RECOMMENDATION')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        referralLetterType === 'PEER_RECOMMENDATION'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      3. 지인 추천서
                    </button>
                  </div>
                </div>

                {/* Letter Content Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      서신 템플릿 미리보기 (1-Click 클립보드 복사):
                    </span>
                    <button
                      data-testid="copy-warm-referral-btn"
                      onClick={handleCopyWarmReferralLetter}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      {copiedReferralType === referralLetterType ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReferralType === referralLetterType ? '복사 완료!' : '맞춤 서신 복사'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                    {generateWarmReferralLetter(selectedJob, referralLetterType).content}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: 스터디 & 사이드 길드 */}
          {/* ========================================================= */}
          {activeTab === 'guild' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
                  <Rocket className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>회사와 직급을 떠나, 관심 있는 최신 기술과 토이 프로젝트를 함께 완성할 동료들을 모집하는 공간입니다.</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-amber-800 bg-white/80 dark:bg-amber-900 px-2 py-0.5 rounded-lg border border-amber-200">
                  {guilds.length}개 길드 운영 중
                </span>
              </div>

              {/* Guilds Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {guilds.map(guild => {
                  const isJoined = guild.currentMembers.some(m => m.name === '나 (본인)');
                  const isCopied = copiedGuildId === guild.id;

                  return (
                    <div
                      key={guild.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-amber-800 dark:text-amber-300">
                            {guild.categoryLabel}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                            guild.status === 'RECRUITING'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {guild.status === 'RECRUITING' ? '팀원 모집 중' : '진행 중'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                            {guild.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            🎯 {guild.goal}
                          </p>
                        </div>

                        <div className="space-y-1 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-700/60">
                          <div>리더: <strong className="text-slate-800 dark:text-slate-200">{guild.leaderName}</strong> ({guild.leaderCompany})</div>
                          <div>일정: {guild.meetingSchedule}</div>
                          <div>필요: <span className="text-indigo-600 font-semibold">{guild.requiredRoles.join(', ')}</span></div>
                        </div>

                        {/* Members count bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400">참여 인원</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {guild.currentMembers.length} / {guild.maxMembers}명
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${(guild.currentMembers.length / guild.maxMembers) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCopyGuildProposal(guild)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-semibold transition-all cursor-pointer"
                          title="슬랙/카톡 공유용 제안서 복사"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? '복사됨!' : '제안서'}</span>
                        </button>

                        <button
                          onClick={() => handleToggleJoinGuild(guild.id)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer text-center ${
                            isJoined
                              ? 'bg-slate-200 text-slate-700 hover:bg-rose-100 hover:text-rose-700'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          {isJoined ? '참여 취소' : '팟 참여 신청'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: 커피챗 인사이트 노트 볼트 */}
          {/* ========================================================= */}
          {activeTab === 'notes' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>실무 커피챗 인사이트 & 상호 회고 노트 볼트 ({notes.length}건)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    휘발되기 쉬운 대화 속 핵심 실무 배운 점(Key Takeaways)과 도구 추천을 아카이빙합니다.
                  </p>
                </div>

                <button
                  data-testid="btn-open-add-note"
                  onClick={() => setIsAddNoteOpen(!isAddNoteOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddNoteOpen ? '작성 닫기' : '새 인사이트 기록'}</span>
                </button>
              </div>

              {/* Add Note Form (Collapsible) */}
              {isAddNoteOpen && (
                <form 
                  onSubmit={handleCreateNote} 
                  className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800 space-y-3.5 text-xs animate-in slide-in-from-top-2 duration-150"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        만난 인맥 선택
                      </label>
                      <select
                        value={selectedPersonForNote}
                        onChange={e => setSelectedPersonForNote(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white font-medium"
                      >
                        {people.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.currentCompany} · {p.currentTitle})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        논의 핵심 주제
                      </label>
                      <input
                        type="text"
                        placeholder="예: 실서비스 온디바이스 SLM 파인튜닝 노하우"
                        value={newDiscussionTheme}
                        onChange={e => setNewDiscussionTheme(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      3대 핵심 배운 점 (Key Takeaways)
                    </label>
                    <input
                      type="text"
                      placeholder="1. 가장 크게 와닿았던 핵심 팁"
                      value={newTakeaway1}
                      onChange={e => setNewTakeaway1(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="2. 장애 극복 또는 운영 시 주의점"
                      value={newTakeaway2}
                      onChange={e => setNewTakeaway2(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="3. 조직 또는 팀원 온보딩 노하우"
                      value={newTakeaway3}
                      onChange={e => setNewTakeaway3(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        추천 도구/라이브러리 (쉼표 구분)
                      </label>
                      <input
                        type="text"
                        placeholder="예: Karpenter, LangGraph, Qdrant"
                        value={newRecommendedTools}
                        onChange={e => setNewRecommendedTools(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        다음 실행 액션 (Action Item)
                      </label>
                      <input
                        type="text"
                        placeholder="예: 다음 주 PoC 클러스터에 셋업 후 테스트"
                        value={newNextAction}
                        onChange={e => setNewNextAction(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      볼트에 안전하게 저장
                    </button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              <div className="space-y-3">
                {notes.map(note => {
                  const isCopied = copiedNoteGratitudeId === note.id;

                  return (
                    <div
                      key={note.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-3.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-700">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {note.personName}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({note.company} · {note.title})
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                              {note.metAt}
                            </span>
                          </div>
                          <h4 className="font-bold text-indigo-700 dark:text-indigo-400 text-xs mt-1">
                            📌 주제: {note.discussionTheme}
                          </h4>
                        </div>

                        <button
                          onClick={() => handleCopyGratitudeCard(note)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? '감사 카드 복사됨!' : '💌 감사 피드백 서신 복사'}</span>
                        </button>
                      </div>

                      {/* Key Takeaways */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          핵심 배운 점 (Key Takeaways):
                        </span>
                        <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-4 list-disc">
                          {note.keyTakeaways.map((point, idx) => (
                            <li key={idx} className="leading-relaxed">{point}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Tools & Next Action */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                        {note.recommendedTools.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400 font-semibold">추천 도구:</span>
                            {note.recommendedTools.map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {note.nextAction && (
                          <div className="text-slate-500">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">실행 과제:</span> {note.nextAction}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
