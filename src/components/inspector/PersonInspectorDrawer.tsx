import React, { useState, useEffect, useMemo } from 'react';
import { Person, ActivityLog, ActivityLogType } from '../../types/network';
import { crossCheckPersonWithDart, getDartReportUrl } from '../../services/dartFactEngine';
import { loadActivityLogs, recordCommunication } from '../../services/storageService';
import { exportPeopleToVcf } from '../../services/vcardExporter';
import { calculatePersonPowerMetric } from '../../services/centralityEngine';
import { identifyTalentCluster } from '../../services/talentClusterEngine';
import { 
  X, Phone, Mail, Briefcase, GraduationCap, 
  Calendar, ShieldCheck, Clock, Edit3, Check, 
  Tag, ExternalLink, Download, Trash2, Plus, MessageSquare, 
  Sparkles, GitFork, Mic, Send, Zap, Cpu, Building2, Rocket
} from 'lucide-react';

interface PersonInspectorDrawerProps {
  person: Person | null;
  allPeople?: Person[];
  onClose: () => void;
  onUpdatePerson: (updated: Person) => void;
  onDeletePerson: (personId: string) => void;
  onOpenBridgeModal?: (person: Person) => void;
  onOpenDossier?: (person: Person) => void;
  onOpenDebrief?: (person: Person) => void;
  onOpenFollowUp?: (person: Person) => void;
}

export const PersonInspectorDrawer: React.FC<PersonInspectorDrawerProps> = ({
  person,
  allPeople = [],
  onClose,
  onUpdatePerson,
  onDeletePerson,
  onOpenBridgeModal,
  onOpenDossier,
  onOpenDebrief,
  onOpenFollowUp
}) => {
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

  // 인물 변경 시 초기화
  useEffect(() => {
    if (person) {
      setMemoText(person.memo || '');
      setIsEditingMemo(false);
      setIsAddingLog(false);
      setDartStatusMsg(null);
      // 이 인물에 대한 활동 로그 필터링
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

  if (!person) return null;

  // 메모 저장
  const handleSaveMemo = () => {
    setIsEditingMemo(false);
    const updated = { ...person, memo: memoText };
    onUpdatePerson(updated);
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
    
    // 대상 인물 상태 갱신
    const updated = updatedPeople.find(p => p.id === person.id);
    if (updated) {
      onUpdatePerson(updated);
    }

    setLogTitle('');
    setLogContent('');
    setIsAddingLog(false);
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">{person.name}</h2>
              
              {/* 5대 인재 클러스터 Superpower Tagging */}
              {clusterProfile && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 border ${clusterProfile.badgeStyle}`}>
                  {clusterProfile.id === 'LISTED_EXECUTIVE' && <Building2 className="w-3 h-3" />}
                  {clusterProfile.id === 'VENTURE_LEADER' && <Rocket className="w-3 h-3" />}
                  {clusterProfile.id === 'TECH_FELLOW' && <Cpu className="w-3 h-3" />}
                  {clusterProfile.id === 'INVESTOR_PARTNER' && <Briefcase className="w-3 h-3" />}
                  {clusterProfile.id === 'CORE_SPECIALIST' && <Sparkles className="w-3 h-3" />}
                  <span>{clusterProfile.label}</span>
                </span>
              )}

              {person.isStale && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 소통 환기 권장
                </span>
              )}

              {powerMetric && (
                <span 
                  title={`허브 분석: ${powerMetric.tierLabel} (사내 인맥 ${powerMetric.sameCompanyCount}명, 알럼나이 ${powerMetric.alumniReachCount}명 연결)`}
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 cursor-help"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>허브 지수 {powerMetric.powerScore}점</span>
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-300">
              {person.currentTitle} · <span className="text-indigo-400">{person.currentCompany}</span>
            </p>
            {person.currentDepartment && (
              <p className="text-xs text-slate-400">{person.currentDepartment}</p>
            )}

            {/* 5대 인재 클러스터 Superpower Edge Chips */}
            {clusterProfile && clusterProfile.superpowers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {clusterProfile.superpowers.map((sp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    <span>{sp}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownloadVcard}
              title="vCard (.vcf) 다운로드"
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="인맥 삭제"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Communication Actions */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${person.mobile}`}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>전화 ({person.mobile})</span>
              </a>

              <a
                href={`mailto:${person.email}`}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 active:scale-95 transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>이메일 전송</span>
              </a>
            </div>

            {/* 미팅 전 1-Page AI 전략 브리핑 버튼 */}
            <button
              type="button"
              onClick={() => onOpenDossier?.(person)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-900 hover:border-indigo-400 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/10 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>미팅 준비 1-Page AI 브리프 (Meeting Prep Brief)</span>
            </button>

            {/* 미팅 직후 빠른 회고 & AI 액션 아이템 추출 */}
            {onOpenDebrief && (
              <button
                type="button"
                onClick={() => onOpenDebrief(person)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-rose-400" />
                <span>미팅 직후 빠른 회고 &amp; AI 액션 추출 (음성/텍스트)</span>
              </button>
            )}

            {/* 5대 인재 클러스터 맞춤 티타임 & 소통 서신 제안 */}
            {onOpenFollowUp && (
              <button
                type="button"
                onClick={() => onOpenFollowUp(person)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>원터치 티타임 &amp; 맞춤 소통 서신 생성 ({clusterProfile?.label || '인재 맞춤'})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenBridgeModal?.(person)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-all active:scale-95"
            >
              <GitFork className="w-4 h-4 text-purple-400" />
              <span>2촌 소개 접점 경로 탐색 (Degrees of Separation)</span>
            </button>
          </div>

          {/* 5대 인재 클러스터 고유 강점 (Superpower Edge) 카드 */}
          {clusterProfile && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-wide uppercase">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>인재 고유 역량 &amp; 시너지 강점</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${clusterProfile.badgeStyle}`}>
                  {clusterProfile.label}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {clusterProfile.description}
              </p>

              {/* 3대 Superpowers 뱃지 칩 */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {clusterProfile.superpowers.map((sp, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {sp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* DART Fact Verification Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wide uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>금융감독원 DART 공시 실명 팩트</span>
              </div>
              
              {person.sourceType !== 'DART_FACT' && (
                <button
                  onClick={handleCrossCheckDart}
                  disabled={isCheckingDart}
                  className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition-all flex items-center gap-1 active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isCheckingDart ? '조회 중...' : '실공시 교차검증'}</span>
                </button>
              )}
            </div>

            {dartStatusMsg && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs text-emerald-300">
                {dartStatusMsg}
              </div>
            )}

            {person.dartInfo ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">상장사명</span>
                    <span className="font-semibold text-slate-200">{person.dartInfo.stockName}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">공시 직위</span>
                    <span className="font-semibold text-emerald-300">{person.dartInfo.registeredRole}</span>
                  </div>
                </div>

                {person.dartInfo.registeredTerm && (
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">임기 현황</span>
                    <span className="font-medium text-slate-200">{person.dartInfo.registeredTerm}</span>
                  </div>
                )}

                {person.dartInfo.remuneration && (
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">공시 보수액</span>
                    <span className="font-bold text-amber-300">{person.dartInfo.remuneration}</span>
                  </div>
                )}

                {/* DART 원문 보고서 다이렉트 링크 */}
                <div className="pt-1">
                  <a
                    href={getDartReportUrl(person.currentCompany, person.dartInfo.rceptNo)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all"
                  >
                    <span>DART 전자공시 보고서 원문 열람</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                아직 DART 공시와 연동되지 않은 원천 데이터입니다. 상단의 '실공시 교차검증' 버튼을 눌러 상장사 공시 임원 여부를 확인할 수 있습니다.
              </p>
            )}
          </div>

          {/* Demographic & Seniority Info */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>전문 경력 단계 및 인적 정보</span>
            </h3>

            {clusterProfile && (
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">전문 경력 단계:</span>
                <span className="font-semibold text-indigo-300">
                  {clusterProfile.seniorityLevel}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">연령 정보:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">
                  {person.birthYear ? `${person.birthYear}년생` : (person.estimatedAgeGroup ? `${person.estimatedAgeGroup}대` : '경력 연차 기준')}
                </span>
                {person.birthYear && (
                  <span className="text-slate-400 text-[11px]">
                    (만 {new Date().getFullYear() - person.birthYear}세)
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                  {person.isAgeEstimated ? '업력 기반 추정' : '공시 확인'}
                </span>
              </div>
            </div>
            {person.lastContactDate && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">최근 소통 일자:</span>
                <span className="text-slate-200 font-medium">{person.lastContactDate}</span>
              </div>
            )}
          </div>

          {/* Multi-source Career Timeline (알럼나이 및 이전 재직 이력 연계) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>커리어 타임라인 & 알럼나이 이력</span>
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {person.careers.map((career) => (
                <div key={career.id} className="relative">
                  <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                    career.isCurrent 
                       ? 'bg-indigo-600 border-indigo-400 ring-4 ring-indigo-500/20' 
                      : career.isAlumniTarget 
                        ? 'bg-amber-500 border-amber-300' 
                        : 'bg-slate-700 border-slate-500'
                  }`} />

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">
                        {career.companyName}
                      </span>
                      {career.isCurrent ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          현직 재직중
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          알럼나이 (전직)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">{career.title} {career.department ? `· ${career.department}` : ''}</p>
                    <p className="text-[11px] text-slate-400">
                      {career.startYear}년 ~ {career.endYear ? `${career.endYear}년` : '현재'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Background */}
          {person.academics.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>학력 및 동문 네트워크</span>
              </h3>

              <div className="space-y-2">
                {person.academics.map((acad, idx) => (
                  <div key={idx} className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200 block">{acad.schoolName}</span>
                      <span className="text-slate-400 text-[11px]">{acad.degree} · {acad.major}</span>
                    </div>
                    {acad.graduationYear && (
                      <span className="text-slate-500 text-[11px]">{acad.graduationYear}년 졸업</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Domain */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>전문 도메인 & 스킬셋</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium">
                {person.primaryDomain}
              </span>
              {person.skills.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Contextual Notes & Memo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>인맥 메모 & 소통 맥락</span>
              </h3>
              {isEditingMemo ? (
                <button
                  onClick={handleSaveMemo}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <Check className="w-3.5 h-3.5" /> 저장
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingMemo(true)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  수정
                </button>
              )}
            </div>

            {isEditingMemo ? (
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                rows={4}
                className="w-full bg-slate-800 border border-indigo-500/50 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {person.memo || '작성된 메모가 없습니다.'}
              </div>
            )}
          </div>

          {/* CRM Activity Timeline (통화, 미팅, 메일 이력) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>소통 및 관계 유지 이력 ({activityLogs.length}건)</span>
              </h3>
              <button
                onClick={() => setIsAddingLog(!isAddingLog)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingLog ? '닫기' : '소통 기록 추가'}</span>
              </button>
            </div>

            {/* Inline Add Log Form */}
            {isAddingLog && (
              <form onSubmit={handleAddLog} className="p-4 rounded-2xl bg-slate-800/80 border border-indigo-500/40 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">소통 채널</label>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value as ActivityLogType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="call">전화 통화</option>
                      <option value="meeting">미팅 / 면담</option>
                      <option value="email">이메일 송수신</option>
                      <option value="note">특이사항 기록</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">제목 *</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 3분기 투자 라운드 티타임"
                      value={logTitle}
                      onChange={(e) => setLogTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">상세 내용 (선택)</label>
                  <textarea
                    rows={2}
                    placeholder="소통 요약 및 다음 약속 사항..."
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingLog(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    저장 (소통일 갱신)
                  </button>
                </div>
              </form>
            )}

            {/* Activity Logs Timeline List */}
            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded-xl">
                기록된 소통 이력이 없습니다. 상단의 '소통 기록 추가'를 눌러 통화나 미팅을 기록해 보세요.
              </p>
            ) : (
              <div className="space-y-2">
                {activityLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        {log.type === 'call' && '전화 통화'}
                        {log.type === 'meeting' && '미팅/면담'}
                        {log.type === 'email' && '이메일'}
                        {log.type === 'note' && '메모'}
                        <span>: {log.title}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{log.loggedAt}</span>
                    </div>
                    {log.content && (
                      <p className="text-xs text-slate-400 pl-4">{log.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
