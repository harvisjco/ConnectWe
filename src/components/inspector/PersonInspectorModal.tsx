import React, { useState, useEffect, useMemo } from 'react';
import { Person, ActivityLog, ActivityLogType } from '../../types/network';
import { crossCheckPersonWithDart } from '../../services/dartFactEngine';
import { loadActivityLogs, recordCommunication } from '../../services/storageService';
import { exportPeopleToVcf } from '../../services/vcardExporter';
import { calculatePersonPowerMetric } from '../../services/centralityEngine';
import { identifyTalentCluster } from '../../services/talentClusterEngine';
import { 
  X, Phone, Mail, Briefcase, GraduationCap, 
  ShieldCheck, Clock, Edit3, Check, 
  Download, Trash2, Plus, 
  Sparkles, Zap, Cpu, Building2, Rocket
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
}

export const PersonInspectorModal: React.FC<PersonInspectorModalProps> = ({
  person,
  allPeople = [],
  onClose,
  onUpdatePerson,
  onDeletePerson,
  onOpenDossier,
  onOpenDebrief,
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
      setDartStatusMsg(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Centered Modal Surface */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{person.name}</h2>
              
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
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 소통 환기 권장
                </span>
              )}

              {powerMetric && (
                <span 
                  title={`허브 분석: ${powerMetric.tierLabel} (사내 인맥 ${powerMetric.sameCompanyCount}명, 알럼나이 ${powerMetric.alumniReachCount}명 연결)`}
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 cursor-help"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>허브 지수 {powerMetric.powerScore}점</span>
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-700">
              {person.currentTitle} · <span className="text-indigo-600 font-semibold">{person.currentCompany}</span>
              {person.currentDepartment && <span className="text-slate-400 font-normal"> ({person.currentDepartment})</span>}
            </p>

            {/* 5대 인재 클러스터 3대 슈퍼파워 칩 (Superpower Edge Chips) */}
            {clusterProfile && clusterProfile.superpowers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {clusterProfile.superpowers.map((sp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200/80 flex items-center gap-1"
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
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="인맥 삭제"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 1. 빠른 소통 액션 & 미팅 1-Page 브리프 히어로 버튼 */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${person.mobile}`}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200/80 active:scale-[0.98] transition-all"
              >
                <Phone className="w-4 h-4 text-indigo-600" />
                <span>전화 ({person.mobile})</span>
              </a>

              <a
                href={`mailto:${person.email}`}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200/80 active:scale-[0.98] transition-all"
              >
                <Mail className="w-4 h-4 text-slate-600" />
                <span>이메일 전송</span>
              </a>
            </div>

            {/* 미팅 전 1-Page AI 전략 브리핑 열기 버튼 */}
            {onOpenDossier && (
              <button
                type="button"
                onClick={() => onOpenDossier(person)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-slate-900/10 border border-slate-800 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>미팅 준비 1-Page AI 브리프 열기 (Meeting Prep Brief)</span>
              </button>
            )}

            {/* 미팅 직후 빠른 회고 액션 */}
            {onOpenDebrief && (
              <button
                type="button"
                onClick={() => onOpenDebrief(person)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                <Clock className="w-4 h-4 text-rose-500" />
                <span>미팅 직후 빠른 회고 & AI 액션 아이템 추출</span>
              </button>
            )}
          </div>

          {/* 2. DART 공시 팩트 검증 카드 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  DART 금융감독원 전자공시 검증
                </h3>
              </div>
              {person.sourceType === 'DART_FACT' ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  DART FACT 승격됨
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleCrossCheckDart}
                  disabled={isCheckingDart}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCheckingDart ? '공시 교차 검증 중...' : '원터치 DART 공시 조회'}
                </button>
              )}
            </div>

            {person.dartInfo && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400">공시 상장기업:</span>{' '}
                  <span className="font-semibold text-slate-800">{person.dartInfo.stockName} (고유번호: {person.dartInfo.corpCode})</span>
                </div>
                <div>
                  <span className="text-slate-400">등기 여부:</span>{' '}
                  <span className="font-semibold text-slate-800">{person.dartInfo.isPublicDirector ? '등기임원' : '미등기임원'}</span>
                </div>
              </div>
            )}

            {dartStatusMsg && (
              <p className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                {dartStatusMsg}
              </p>
            )}
          </div>

          {/* 3. 스마트 메모 & 비즈니스 인사이트 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  비즈니스 메모 & 핵심 인사이트
                </h3>
              </div>
              {!isEditingMemo ? (
                <button
                  type="button"
                  onClick={() => setIsEditingMemo(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  편집
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveMemo}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
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
                className="w-full h-24 p-2.5 text-xs rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-slate-50 text-slate-800"
              />
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed min-h-[40px] whitespace-pre-wrap">
                {person.memo || '작성된 비즈니스 메모가 없습니다.'}
              </p>
            )}
          </div>

          {/* 4. 알럼나이 경력 & 학맥 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 경력 이력 */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  경력 & 알럼나이 이력
                </h3>
              </div>
              <div className="space-y-2">
                {person.careers.map((c, idx) => (
                  <div key={idx} className="text-xs flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{c.companyName}</span>
                      <span className="text-slate-500 ml-1.5">{c.title}</span>
                    </div>
                    {c.isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        현직
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 학맥 정보 */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  학맥 및 전공
                </h3>
              </div>
              <div className="space-y-2">
                {person.academics.map((a, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-semibold text-slate-800">{a.schoolName}</span>
                    <span className="text-slate-500 ml-1.5">{a.major} ({a.degree})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. 소통 이력 타임라인 & 빠른 기록 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  소통 이력 타임라인 ({activityLogs.length}건)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingLog(prev => !prev)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {isAddingLog ? '닫기' : '새 소통 기록'}
              </button>
            </div>

            {isAddingLog && (
              <form onSubmit={handleAddLog} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex gap-2">
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as ActivityLogType)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
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
                    placeholder="소통 제목 (예: 테헤란로 미팅, 투자 제안 논의)"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
                  />
                </div>
                <textarea
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                  placeholder="대화 내용 및 후속 액션 아이템..."
                  className="w-full h-16 text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800"
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
              <p className="text-xs text-slate-400 py-2">등록된 이전 소통 기록이 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{log.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.loggedAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    {log.content && <p className="text-slate-600">{log.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
