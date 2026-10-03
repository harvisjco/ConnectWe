import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  ExpertMentorProfile, 
  SuperpowerCategory 
} from '../../types/knowledgeExchange';
import { 
  loadExpertMentorProfiles, 
  filterExpertProfiles, 
  generateKnowledgeCoffeeChatLetter, 
  markConsultationSent, 
  getKnowledgeSummaryStats 
} from '../../services/knowledgeExchangeService';
import { 
  X, Coffee, Sparkles, Send, Users, Check, 
  Search, ShieldCheck, Tag, Calendar, 
  MessageSquare, Lightbulb, Compass
} from 'lucide-react';

interface KnowledgeExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onOpenTeaTimeStudio?: (person: Person) => void;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const KnowledgeExchangeModal: React.FC<KnowledgeExchangeModalProps> = ({
  isOpen,
  onClose,
  people,
  onOpenTeaTimeStudio,
  onSelectPerson,
  onShowToast
}) => {
  const [profiles, setProfiles] = useState<ExpertMentorProfile[]>(() => loadExpertMentorProfiles(people));
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SuperpowerCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 통계 집계
  const stats = useMemo(() => getKnowledgeSummaryStats(profiles), [profiles]);

  // 필터링된 전문가 프로필 목록
  const filteredProfiles = useMemo(() => {
    return filterExpertProfiles(profiles, categoryFilter, searchQuery);
  }, [profiles, categoryFilter, searchQuery]);

  if (!isOpen) return null;

  // 1:1 자문 티타임 서신 복사
  const handleCopyConsultationLetter = (expert: ExpertMentorProfile) => {
    const letter = generateKnowledgeCoffeeChatLetter(expert, '동료');
    const onCopied = () => {
      setCopiedId(expert.id);
      const updated = markConsultationSent(expert.id, profiles);
      setProfiles(updated);
      onShowToast(`[${expert.personName}] 님 대상 3대 의제 자문 티타임 서신이 복사되었습니다.`);
      setTimeout(() => setCopiedId(null), 2500);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(letter).then(onCopied).catch(onCopied);
    } else {
      onCopied();
    }
  };

  // 캘린더 초대 & 티타임 스튜디오로 연동
  const handleScheduleTeaTime = (expert: ExpertMentorProfile) => {
    const matched = people.find(p => p.id === expert.personId || p.name === expert.personName);
    if (matched && onOpenTeaTimeStudio) {
      onClose();
      onOpenTeaTimeStudio(matched);
    } else {
      handleCopyConsultationLetter(expert);
    }
  };

  const getCategoryBadge = (category: SuperpowerCategory) => {
    switch (category) {
      case 'ENGINEERING':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">엔지니어링 & 인프라</span>;
      case 'PRODUCT_AI':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">AI & 프로덕트</span>;
      case 'GROWTH_BIZ':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">그로스 & B2B</span>;
      case 'DESIGN_SYSTEM':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">디자인 시스템</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        data-testid="knowledge-exchange-modal"
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* 1. 상단 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  실무 슈퍼파워 지식 교환 & 캐주얼 멘토링 팟
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  Peer Knowledge Pods
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                내 1촌 및 사내 동료 2촌의 검증된 실무 전문가와 1:1 캐주얼 티타임으로 인사이트를 나눕니다
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            data-testid="close-knowledge-modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. 퀵 메트릭 & 탭/검색 툴바 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
          {/* 메트릭 칩 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              등록된 실무 슈퍼파워: <strong className="text-slate-900 dark:text-white">{stats.totalTopics}</strong>개
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              1촌 내 인맥: <strong className="text-indigo-900 dark:text-indigo-200">{stats.firstDegreeCount}</strong>명
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Compass className="w-3.5 h-3.5 text-purple-500" />
              2촌 동료 공유 전문가: <strong className="text-purple-900 dark:text-purple-200">{stats.secondDegreeCount}</strong>명
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              자문 요청 완료: <strong className="text-emerald-900 dark:text-emerald-200">{stats.consultedCount}</strong>건
            </span>
          </div>

          {/* 카테고리 탭 세그먼트 & 검색 인풋 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                data-testid="tab-cat-all"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  categoryFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                전체 ({profiles.length})
              </button>
              <button
                type="button"
                data-testid="tab-cat-engineering"
                onClick={() => setCategoryFilter('ENGINEERING')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  categoryFilter === 'ENGINEERING'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                엔지니어링 & 인프라
              </button>
              <button
                type="button"
                data-testid="tab-cat-product"
                onClick={() => setCategoryFilter('PRODUCT_AI')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  categoryFilter === 'PRODUCT_AI'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                AI & 프로덕트
              </button>
              <button
                type="button"
                data-testid="tab-cat-growth"
                onClick={() => setCategoryFilter('GROWTH_BIZ')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  categoryFilter === 'GROWTH_BIZ'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                그로스 & B2B
              </button>
              <button
                type="button"
                data-testid="tab-cat-design"
                onClick={() => setCategoryFilter('DESIGN_SYSTEM')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  categoryFilter === 'DESIGN_SYSTEM'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                디자인 시스템
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                data-testid="knowledge-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="전문가 성명, 기술 스택, 사례 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 3. 전문가 프로필 카드 그리드 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredProfiles.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              해당 카테고리나 검색 조건에 일치하는 실무 멘토가 없습니다.
            </div>
          ) : (
            filteredProfiles.map(profile => {
              const matchedPerson = people.find(p => p.id === profile.personId || p.name === profile.personName);

              return (
                <div
                  key={profile.id}
                  data-testid={`expert-card-${profile.id}`}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-amber-300 dark:hover:border-amber-700 transition-all shadow-sm space-y-3.5"
                >
                  {/* 상단: 프로필 정보, 1/2촌 뱃지, 가용성 및 액션 버튼 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        {profile.personName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            onClick={() => matchedPerson && onSelectPerson?.(matchedPerson)}
                            className="font-bold text-base text-slate-900 dark:text-white hover:underline cursor-pointer"
                          >
                            {profile.personName}
                          </span>
                          {profile.degree === 1 ? (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              1촌 내 인맥
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
                              <Users className="w-3 h-3 text-purple-500" />
                              2촌 가교: {profile.bridgeColleagueName}
                              {profile.bridgeDepartment && ` (${profile.bridgeDepartment})`}
                            </span>
                          )}

                          {profile.availability === 'COFFEE_CHAT_OPEN' && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              ☕ 30분 커피챗 환영
                            </span>
                          )}

                          {profile.hasConsulted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <Check className="w-3 h-3" /> 자문 요청 완료
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <strong className="text-slate-700 dark:text-slate-300">{profile.companyName}</strong> · {profile.currentTitle}
                        </p>
                      </div>
                    </div>

                    {/* 액션 버튼 그룹 */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        data-testid={`coffee-letter-btn-${profile.id}`}
                        onClick={() => handleCopyConsultationLetter(profile)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-xl transition-colors cursor-pointer"
                        title="3대 추천 의제 및 감사 기프티콘 서신 복사"
                      >
                        {copiedId === profile.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">서신 복사됨</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>1:1 자문 티타임 서신</span>
                          </>
                        )}
                      </button>

                      {onOpenTeaTimeStudio && (
                        <button
                          type="button"
                          data-testid={`teatime-schedule-btn-${profile.id}`}
                          onClick={() => handleScheduleTeaTime(profile)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                          title="티타임 스튜디오로 이동하여 캘린더 일정 조율"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>일정 조율</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 중단: 슈퍼파워 주제 & 팩트 기반 실무 해결 경험 */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {profile.primaryTopic.title}
                        </h4>
                      </div>
                      {getCategoryBadge(profile.primaryTopic.category)}
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong className="text-amber-800 dark:text-amber-300">실무 검증 사례: </strong>
                        {profile.solvedCaseSummary}
                      </p>
                    </div>

                    {/* 태그 칩 */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {profile.primaryTopic.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 하단: 3대 핵심 추천 자문 의제 */}
                  <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30 text-xs space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>추천 3대 핵심 자문 의제 (Agenda):</span>
                    </div>
                    <ul className="space-y-1 pl-4 list-disc text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      {profile.recommendedAgenda.map((agenda, idx) => (
                        <li key={idx}>{agenda}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. 하단 서머리 바 */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>감사의 의미로 스타벅스 e-Gift 커피 기프티콘을 함께 전달하는 격조 높은 에티켓을 지원합니다.</span>
          </div>

          <button
            onClick={onClose}
            data-testid="complete-knowledge-modal"
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
