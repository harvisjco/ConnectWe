import React, { useState, useEffect, useMemo } from 'react';
import { Person, ActivityLog, ActivityLogType } from '../../types/network';
import { crossCheckPersonWithDart } from '../../services/dartFactEngine';
import { loadActivityLogs, recordCommunication } from '../../services/storageService';
import { exportPeopleToVcf } from '../../services/vcardExporter';
import { calculatePersonPowerMetric } from '../../services/centralityEngine';
import { identifyTalentCluster } from '../../services/talentClusterEngine';
import { silentSyncEngine } from '../../services/silentSyncEngine';
import { 
  polishToneForCluster, 
  auditExecutiveTone, 
  sanitizeExecutiveTone 
} from '../../services/executiveToneService';
import { getGovernanceHistory } from '../../services/dartGovernanceService';
import { 
  X, Phone, Mail, Briefcase, GraduationCap, 
  ShieldCheck, Clock, Edit3, Check, 
  Download, Trash2, Plus, Lock,
  Sparkles, Zap, Cpu, Building2, Rocket,
  User, MessageSquare, Shield, Send, Copy, AlertTriangle
} from 'lucide-react';

interface PersonInspectorModalProps {
  person: Person | null;
  allPeople?: Person[];
  onClose: () => void;
  onUpdatePerson: (updated: Person) => void;
  onDeletePerson: (personId: string) => void;
  onOpenBridgeModal?: (person: Person) => void;
  onOpenDossier?: (person: Person) => void;
  onOpenDebrief?: (person: Person) => void;
  onOpenFollowUp?: (person: Person) => void;
  onOpenMeetingBriefing?: (person: Person) => void;
}

type InspectorTab = 'profile' | 'timeline' | 'governance';

export const PersonInspectorModal: React.FC<PersonInspectorModalProps> = ({
  person,
  allPeople = [],
  onClose,
  onUpdatePerson,
  onDeletePerson,
  onOpenDossier,
  onOpenDebrief,
  onOpenMeetingBriefing,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('profile');
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoText, setMemoText] = useState(person?.memo || '');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // 소통 기록 입력 폼 상태
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [logType, setLogType] = useState<ActivityLogType>('call');
  const [logTitle, setLogTitle] = useState('');
  const [logContent, setLogContent] = useState('');

  // DART 검증 상태
  const [isCheckingDart, setIsCheckingDart] = useState(false);
  const [dartStatusMsg, setDartStatusMsg] = useState<string | null>(null);

  // 경영진 품격 서신 다듬기 (Tone Polisher) 상태
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [rawDraft, setRawDraft] = useState('');
  const [polishedLetter, setPolishedLetter] = useState('');
  const [isCopiedLetter, setIsCopiedLetter] = useState(false);

  // ESC 키 닫기 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 인물 변경 시 초기화
  useEffect(() => {
    if (person) {
      setMemoText(person.memo || '');
      setIsEditingMemo(false);
      setIsAddingLog(false);
      setIsComposerOpen(false);
      setDartStatusMsg(null);
      setRawDraft('');
      setPolishedLetter('');
      setActiveTab('profile');
      const allLogs = loadActivityLogs();
      setActivityLogs(allLogs.filter(l => l.personId === person.id));
    }
  }, [person]);

  const powerMetric = useMemo(() => {
    if (!person) return null;
    return calculatePersonPowerMetric(person, allPeople);
  }, [person, allPeople]);

  const clusterProfile = useMemo(() => {
    if (!person) return null;
    return identifyTalentCluster(person);
  }, [person]);

  const governanceHistory = useMemo(() => {
    if (!person) return [];
    return getGovernanceHistory(person);
  }, [person]);

  // 서신 실시간 품격 감사 (Audit)
  const toneAudit = useMemo(() => {
    return auditExecutiveTone(rawDraft);
  }, [rawDraft]);

  if (!person) return null;

  // 메모 저장 및 무감각 E2EE 암호화 동기화
  const handleSaveMemo = () => {
    setIsEditingMemo(false);
    const updated = { ...person, memo: memoText };
    onUpdatePerson(updated);
    // 무감각 백그라운드 AES-256 저장
    silentSyncEngine.queueVaultSync(`person_memo_${person.id}`, { memo: memoText, updatedAt: new Date().toISOString() });
  };

  // 실시간 DART 상장사 임원 교차 검증 실행
  const handleCrossCheckDart = () => {
    setIsCheckingDart(true);
    setDartStatusMsg(null);

    setTimeout(() => {
      const res = crossCheckPersonWithDart(person);
      if (res.matched && res.updatedPerson) {
        onUpdatePerson(res.updatedPerson);
        setDartStatusMsg(`성공: ${res.dartInfo?.stockName} 실공시 팩트가 매칭되어 DART FACT로 승격되었습니다!`);
      } else {
        setDartStatusMsg('안내: 일치하는 금융감독원 상장사 임원 정기공시를 찾지 못했습니다.');
      }
      setIsCheckingDart(false);
    }, 350);
  };

  // 소통 이력 추가
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) return;

    const { updatedLogs, updatedPeople } = recordCommunication(person.id, logType, logTitle.trim(), logContent.trim());
    setActivityLogs(updatedLogs.filter(l => l.personId === person.id));
    
    const updated = updatedPeople.find(p => p.id === person.id);
    if (updated) {
      onUpdatePerson(updated);
    }

    setLogTitle('');
    setLogContent('');
    setIsAddingLog(false);

    // E2EE 백그라운드 볼트 동기화
    silentSyncEngine.queueVaultSync(`activity_logs_${person.id}`, updatedLogs.filter(l => l.personId === person.id));
  };

  // vCard 다운로드
  const handleDownloadVcard = () => {
    exportPeopleToVcf([person], `${person.name}_${person.currentCompany}.vcf`);
  };

  // 인맥 삭제
  const handleDelete = () => {
    if (confirm(`정말로 [${person.name}] 님의 인맥 정보를 지식 허브에서 삭제하시겠습니까?`)) {
      onDeletePerson(person.id);
      onClose();
    }
  };

  // 품격 서신 자동 윤문 실행
  const handleGeneratePolishedLetter = () => {
    if (!clusterProfile) return;
    const polished = polishToneForCluster(rawDraft, clusterProfile.id, {
      recipientName: person.name,
      recipientCompany: person.currentCompany,
      recipientTitle: person.currentTitle
    });
    setPolishedLetter(polished);
  };

  // 서신 복사
  const handleCopyLetter = async () => {
    if (!polishedLetter) return;
    try {
      await navigator.clipboard.writeText(polishedLetter);
      setIsCopiedLetter(true);
      setTimeout(() => setIsCopiedLetter(false), 2000);
    } catch {
      setIsCopiedLetter(true);
      setTimeout(() => setIsCopiedLetter(false), 2000);
    }
  };

  return (
    <div 
      data-testid="person-inspector-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* 듀얼 트랙 서피스: 모바일은 하단 바텀시트, 데스크톱은 중앙 딤 팝업 */}
      <div 
        className="relative w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* 모바일 하이퍼 제스처 드래그 핸들 (768px 미만에서만 표시) */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{person.name}</h2>
              
              {/* 5대 인재 클러스터 Superpower Tagging */}
              {clusterProfile && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 border ${clusterProfile.badgeStyle}`}>
                  {clusterProfile.id === 'LISTED_EXECUTIVE' && <Building2 className="w-3 h-3" />}
                  {clusterProfile.id === 'VENTURE_LEADER' && <Rocket className="w-3 h-3" />}
                  {clusterProfile.id === 'TECH_FELLOW' && <Cpu className="w-3 h-3" />}
                  {clusterProfile.id === 'INVESTOR_PARTNER' && <Briefcase className="w-3 h-3" />}
                  {clusterProfile.id === 'CORE_SPECIALIST' && <Sparkles className="w-3 h-3" />}
                  <span>{clusterProfile.label}</span>
                </span>
              )}

              {person.isStale && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 소통 환기 권장
                </span>
              )}

              {powerMetric && (
                <span 
                  title={`허브 분석: ${powerMetric.tierLabel} (사내 인맥 ${powerMetric.sameCompanyCount}명, 알럼나이 ${powerMetric.alumniReachCount}명 연결)`}
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1 cursor-help"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>허브 지수 {powerMetric.powerScore}점</span>
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {person.currentTitle} · <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{person.currentCompany}</span>
              {person.currentDepartment && <span className="text-slate-400 font-normal"> ({person.currentDepartment})</span>}
            </p>

            {/* 5대 인재 클러스터 3대 슈퍼파워 칩 */}
            {clusterProfile && clusterProfile.superpowers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {clusterProfile.superpowers.map((sp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                    <span>{sp}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Header Tool Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDownloadVcard}
              title="vCard (.vcf) 다운로드"
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="인맥 삭제"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              data-testid="close-person-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3대 정갈한 탭 네비게이션 (시각적 노이즈 제로 & 극도의 단순함) */}
        <div className="px-5 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>핵심 프로필</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>소통 & 서신 ({activityLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'governance'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>DART 공시 팩트</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: 핵심 프로필 & 슈퍼파워 */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* 빠른 소통 액션 & C-Level 미팅 브리핑 히어로 버튼 */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`tel:${person.mobile}`}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 active:scale-[0.98] transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>전화 ({person.mobile || '미등록'})</span>
                  </a>

                  <a
                    href={`mailto:${person.email}`}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 active:scale-[0.98] transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>이메일 전송</span>
                  </a>
                </div>

                {/* C-Level 미팅 10분 전 스마트 브리핑 룸 원터치 실행 */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMeetingBriefing) {
                      onOpenMeetingBriefing(person);
                    } else if (onOpenDossier) {
                      onOpenDossier(person);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-800 hover:to-slate-800 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-indigo-950/20 border border-indigo-900 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>C-Level 미팅 10분 전 스마트 브리핑 룸 열기 (1-Page Brief)</span>
                </button>

                {/* 미팅 직후 빠른 회고 */}
                {onOpenDebrief && (
                  <button
                    type="button"
                    onClick={() => onOpenDebrief(person)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span>미팅 직후 빠른 회고 & AI 액션 아이템 추출</span>
                  </button>
                )}
              </div>

              {/* 스마트 메모 & 비즈니스 인사이트 (with E2EE 볼트 동기화) */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      비즈니스 메모 & 핵심 인사이트
                    </h3>
                  </div>
                  {!isEditingMemo ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingMemo(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      편집
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveMemo}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> 저장
                    </button>
                  )}
                </div>

                {isEditingMemo ? (
                  <textarea
                    value={memoText}
                    onChange={(e) => setMemoText(e.target.value)}
                    placeholder="인맥에 대한 주요 화두, 관심사, 선호 티타임 장소 등을 입력하세요..."
                    className="w-full h-24 p-2.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[36px] whitespace-pre-wrap">
                    {person.memo || '작성된 비즈니스 메모가 없습니다.'}
                  </p>
                )}
              </div>

              {/* 알럼나이 경력 & 학맥 정보 2단 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 경력 이력 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      경력 & 알럼나이 이력
                    </h3>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {person.careers && person.careers.length > 0 ? (
                      person.careers.map((c, idx) => (
                        <div key={idx} className="text-xs flex items-start justify-between py-0.5">
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{c.companyName}</span>
                            <span className="text-slate-500 ml-1.5">{c.title}</span>
                          </div>
                          {c.isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              현직
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">등록된 상세 경력이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 학맥 정보 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      학맥 및 전공
                    </h3>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {person.academics && person.academics.length > 0 ? (
                      person.academics.map((a, idx) => (
                        <div key={idx} className="text-xs py-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{a.schoolName}</span>
                          <span className="text-slate-500 ml-1.5">{a.major} ({a.degree})</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">등록된 학맥 정보가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 소통 타임라인 & 품격 서신 다듬기 (Tone Polisher) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* 경영진 품격 서신 다듬기 (Executive Tone Polisher) */}
              <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      경영진 품격 서신 다듬기 (Tone Polisher)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(prev => !prev)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    {isComposerOpen ? '접기' : '서신 작성기 열기'}
                  </button>
                </div>

                {isComposerOpen && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">초안 작성 또는 전달 사항</span>
                        {/* 헌장 품격 감사 인디케이터 */}
                        <div className="flex items-center gap-1.5">
                          {toneAudit.isSafe ? (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> 품격 헌장 적합 (100점)
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {toneAudit.violations.length}개 어휘 순화 필요 ({toneAudit.score}점)
                            </span>
                          )}
                        </div>
                      </div>

                      <textarea
                        value={rawDraft}
                        onChange={(e) => setRawDraft(e.target.value)}
                        placeholder="예: 이번 분기 핵심 파트너십 논의를 위해 편하신 시간에 차 한 잔 모시고 싶습니다."
                        className="w-full h-20 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />

                      {/* 위반 어휘 경고 및 자동 순화 버튼 */}
                      {!toneAudit.isSafe && (
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] flex items-center justify-between">
                          <span className="text-amber-800 dark:text-amber-300">
                            금지 어휘 감지: {toneAudit.violations.map(v => v.word).join(', ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRawDraft(sanitizeExecutiveTone(rawDraft))}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-amber-300 text-amber-800 dark:text-amber-200 font-bold hover:bg-amber-100 transition-colors"
                          >
                            원터치 품격 순화
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleGeneratePolishedLetter}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{clusterProfile?.label} 맞춤 품격 서신 생성</span>
                    </button>

                    {polishedLetter && (
                      <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">완성된 품격 비즈니스 서신</span>
                          <button
                            type="button"
                            onClick={handleCopyLetter}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            {isCopiedLetter ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">복사 완료</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>서신 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {polishedLetter}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 소통 이력 타임라인 리스트 & 빠른 기록 폼 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      소통 이력 타임라인 ({activityLogs.length}건)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingLog(prev => !prev)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {isAddingLog ? '닫기' : '새 소통 기록'}
                  </button>
                </div>

                {isAddingLog && (
                  <form onSubmit={handleAddLog} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex gap-2">
                      <select
                        value={logType}
                        onChange={(e) => setLogType(e.target.value as ActivityLogType)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      >
                        <option value="call">전화 통화</option>
                        <option value="meeting">대면 미팅</option>
                        <option value="email">이메일</option>
                        <option value="note">메모/메신저</option>
                      </select>
                      <input
                        type="text"
                        value={logTitle}
                        onChange={(e) => setLogTitle(e.target.value)}
                        placeholder="소통 제목 (예: 테헤란로 미팅, 사업 협력 조율)"
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <textarea
                      value={logContent}
                      onChange={(e) => setLogContent(e.target.value)}
                      placeholder="대화 내용 및 후속 액션 아이템..."
                      className="w-full h-16 text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      기록 추가
                    </button>
                  </form>
                )}

                {activityLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">등록된 이전 소통 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{log.title}</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(log.loggedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        {log.content && <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{log.content}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DART 공시 & 거버넌스 팩트 */}
          {activeTab === 'governance' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      DART 금융감독원 전자공시 검증
                    </h3>
                  </div>
                  {person.sourceType === 'DART_FACT' ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      DART FACT 승격됨
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCrossCheckDart}
                      disabled={isCheckingDart}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingDart ? '공시 교차 검증 중...' : '원터치 DART 공시 조회'}
                    </button>
                  )}
                </div>

                {person.dartInfo && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400">공시 상장기업:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{person.dartInfo.stockName}</span>
                      {person.dartInfo.corpCode && <span className="text-[10px] text-slate-400 ml-1">({person.dartInfo.corpCode})</span>}
                    </div>
                    <div>
                      <span className="text-slate-400">등기 여부:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{person.dartInfo.isPublicDirector ? '등기임원' : '미등기임원'}</span>
                    </div>
                    {person.dartInfo.registeredRole && (
                      <div className="col-span-2">
                        <span className="text-slate-400">공시 직함:</span>{' '}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{person.dartInfo.registeredRole}</span>
                      </div>
                    )}
                  </div>
                )}

                {dartStatusMsg && (
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                    {dartStatusMsg}
                  </p>
                )}
              </div>

              {/* DART 최근 거버넌스 궤적 타임라인 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>최근 공시 거버넌스 궤적 (Audit Trail)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">최근 3개년 팩트</span>
                </div>
                <div className="space-y-2.5">
                  {governanceHistory.map((item) => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${item.badgeStyle}`}>
                          {item.eventLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{item.announcedDate}</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{item.headline}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (E2EE 안심 배지 & 닫기) */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>AES-256 E2EE 무감각 안전 볼트 보관</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
