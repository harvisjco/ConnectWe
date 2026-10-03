import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  SQUAD_ROLES, 
  SQUAD_TEMPLATES, 
  SquadRoleId, 
  SquadTemplate, 
  findBestCandidatesForRole, 
  analyzeSquadGaps, 
  generateSquadInviteBrief, 
  calculateCandidateFit 
} from '../../services/projectSquadBuilderService';
import { 
  X, Sparkles, Users, Cpu, Rocket, Briefcase, 
  TrendingUp, Check, Copy, AlertCircle, 
  ChevronRight, Coffee, Trash2
} from 'lucide-react';

interface ProjectSquadBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onSelectPerson?: (person: Person) => void;
  onOpenTeaTimeStudio?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const ProjectSquadBuilderModal: React.FC<ProjectSquadBuilderModalProps> = ({
  isOpen,
  onClose,
  people,
  onSelectPerson,
  onOpenTeaTimeStudio,
  onShowToast
}) => {
  // 프로젝트 기본 정보 상태
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ai-product');
  const [projectName, setProjectName] = useState<string>('차세대 생성형 AI 프로덕트 런칭');
  
  // 현재 선택된 템플릿
  const activeTemplate = useMemo(() => {
    return SQUAD_TEMPLATES.find(t => t.id === selectedTemplateId) || SQUAD_TEMPLATES[0];
  }, [selectedTemplateId]);

  // 각 롤별 배정된 인재 상태 (roleId -> Person | null)
  const [assignments, setAssignments] = useState<Record<string, Person | null>>({});

  // 템플릿 변경 시 초기화 또는 스마트 자동 추천 배정
  const handleSelectTemplate = (template: SquadTemplate) => {
    setSelectedTemplateId(template.id);
    // 새로운 템플릿의 첫 번째 롤을 기본 선택
    setSelectedRoleId(template.roles[0]);

    // 템플릿 변경 시 각 롤의 1위 최적 후보자를 스마트 자동 프리뷰 배정
    const autoAssignments: Record<string, Person | null> = {};
    const usedPersonIds = new Set<string>();

    for (const rId of template.roles) {
      const topCandidates = findBestCandidatesForRole(people, rId, 5);
      const available = topCandidates.find(c => !usedPersonIds.has(c.person.id));
      if (available) {
        autoAssignments[rId] = available.person;
        usedPersonIds.add(available.person.id);
      } else {
        autoAssignments[rId] = null;
      }
    }
    setAssignments(autoAssignments);
  };

  // 초기 렌더링 시 자동 배정 세팅
  React.useEffect(() => {
    if (isOpen && Object.keys(assignments).length === 0) {
      handleSelectTemplate(activeTemplate);
    }
  }, [isOpen]);

  // 현재 우측 패널에서 추천 후보를 보고 있는 대상 롤 ID
  const [selectedRoleId, setSelectedRoleId] = useState<SquadRoleId>(activeTemplate.roles[0]);

  // 롤별 추천 후보자 목록
  const candidatesForActiveRole = useMemo(() => {
    if (!selectedRoleId) return [];
    return findBestCandidatesForRole(people, selectedRoleId, 8);
  }, [people, selectedRoleId]);

  // 스쿼드 갭 및 준비도 분석
  const gapAnalysis = useMemo(() => {
    return analyzeSquadGaps(activeTemplate, assignments);
  }, [activeTemplate, assignments]);

  // 슬롯에 인재 배정
  const handleAssignPerson = (roleId: SquadRoleId, person: Person) => {
    setAssignments(prev => ({
      ...prev,
      [roleId]: person
    }));
    onShowToast(`${person.name} 님이 [${SQUAD_ROLES[roleId]?.label || roleId}] 역할에 배정되었습니다.`);
  };

  // 슬롯에서 인재 제거
  const handleRemovePerson = (roleId: SquadRoleId) => {
    const target = assignments[roleId];
    setAssignments(prev => ({
      ...prev,
      [roleId]: null
    }));
    if (target) {
      onShowToast(`${target.name} 님이 슬롯에서 제외되었습니다.`);
    }
  };

  // 1-Page 제안서 복사
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const handleCopyInviteBrief = (roleId: SquadRoleId, person: Person) => {
    const roleDef = SQUAD_ROLES[roleId];
    if (!roleDef) return;

    const brief = generateSquadInviteBrief(projectName, activeTemplate, assignments, person, roleDef);
    navigator.clipboard.writeText(brief).then(() => {
      setCopiedRole(roleId);
      onShowToast(`${person.name} 님 대상 프로젝트 비공개 제안서가 복사되었습니다.`);
      setTimeout(() => setCopiedRole(null), 2500);
    });
  };

  // 전체 스쿼드 요약 복사
  const handleCopyEntireSquadBrief = () => {
    const today = new Date().toISOString().split('T')[0];
    const memberLines = activeTemplate.roles.map(rId => {
      const p = assignments[rId];
      const rLabel = SQUAD_ROLES[rId]?.label || rId;
      return p 
        ? `• [${rLabel}] ${p.name} (${p.currentCompany} ${p.currentTitle}) - 스킬: ${(p.skills || []).slice(0, 3).join(', ')}`
        : `• [${rLabel}] (공석 / 추천 조율 필요)`;
    }).join('\n');

    const text = `[ConnectWe 가상 스쿼드 편성 보고서]
프로젝트: ${projectName}
템플릿: ${activeTemplate.title} (${activeTemplate.subtitle})
준비도: ${gapAnalysis.readinessScore}% (${gapAnalysis.filledSlots}/${gapAnalysis.totalSlots} 충원)
일시: ${today}

■ 편성된 스쿼드 멤버
${memberLines}

■ 결원 진단 & 권고사항
${gapAnalysis.recommendation}
`;

    navigator.clipboard.writeText(text).then(() => {
      onShowToast('가상 스쿼드 전체 편성 요약이 클립보드에 복사되었습니다.');
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      data-testid="project-squad-builder-modal"
    >
      <div 
        className="w-full max-w-5xl h-[92vh] max-h-[860px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. 상단 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  스마트 프로젝트 팀 빌더 & 스킬 매칭 스튜디오
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  실무 인재 드림팀
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                내 인맥 및 알럼나이 실무 인재의 보유 스킬을 분석하여 최적의 프로젝트 스쿼드를 가상 편성합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="close-squad-builder"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="닫기 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. 프로젝트명 입력 & 4대 스쿼드 템플릿 바 */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex-1 max-w-md">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              프로젝트 타이틀
            </label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="추진할 프로젝트명을 입력하세요"
              className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {SQUAD_TEMPLATES.map(template => {
              const isSelected = template.id === activeTemplate.id;
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {template.id === 'ai-product' && <Cpu className="w-3.5 h-3.5" />}
                  {template.id === 'mvp-builder' && <Rocket className="w-3.5 h-3.5" />}
                  {template.id === 'b2b-tf' && <Briefcase className="w-3.5 h-3.5" />}
                  {template.id === 'growth-marketing' && <TrendingUp className="w-3.5 h-3.5" />}
                  <span>{template.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 중앙 본문 (좌측: 가상 스쿼드 슬롯 / 우측: 스킬 매칭 인재 랭킹) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* [좌측 7컬럼] 가상 스쿼드 편성 보드 */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  가상 스쿼드 슬롯 편성 ({gapAnalysis.filledSlots}/{gapAnalysis.totalSlots})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                슬롯을 클릭하여 우측에서 최적 후보자를 배정하세요
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTemplate.roles.map(roleId => {
                const roleDef = SQUAD_ROLES[roleId];
                if (!roleDef) return null;
                const assigned = assignments[roleId];
                const isFocused = selectedRoleId === roleId;

                // 배정된 사람의 매칭 분석
                const candidateFit = assigned ? calculateCandidateFit(assigned, roleDef) : null;

                return (
                  <div
                    key={roleId}
                    onClick={() => setSelectedRoleId(roleId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isFocused
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/60 hover:border-slate-300'
                    }`}
                  >
                    {/* 슬롯 헤더 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${roleDef.badgeColor}`}>
                          {roleDef.label}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                          권장 스킬: {roleDef.recommendedSkills.slice(0, 3).join(', ')}
                        </span>
                      </div>
                      {assigned && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyInviteBrief(roleId, assigned);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="1-Page 제안서 복사"
                          >
                            {copiedRole === roleId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedRole === roleId ? '복사완료' : '제안서'}</span>
                          </button>

                          {onOpenTeaTimeStudio && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTeaTimeStudio(assigned);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="커피챗 조율 스튜디오"
                            >
                              <Coffee className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePerson(roleId);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="슬롯에서 제외"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 슬롯 본문 (배정 여부에 따라) */}
                    {assigned ? (
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {assigned.name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectPerson?.(assigned);
                                }}
                                className="font-bold text-sm text-slate-900 dark:text-white truncate hover:underline"
                              >
                                {assigned.name}
                              </span>
                              {candidateFit && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  핏 {candidateFit.score}점
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {assigned.currentCompany} · {assigned.currentTitle}
                            </p>
                          </div>
                        </div>

                        {/* 보유 스킬 태그 */}
                        <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-xs">
                          {(assigned.skills || []).slice(0, 3).map(skill => (
                            <span 
                              key={skill}
                              className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-2 text-xs">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span>현재 공석입니다. 우측 추천 후보자에서 배정해 주세요.</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          후보자 보기 <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* [우측 5컬럼] 스킬 매칭 추천 실무 인재 랭킹 패널 */}
          <div className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  【 {SQUAD_ROLES[selectedRoleId]?.label} 】 추천 후보
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  직무, 보유 기술, 도메인 경험을 종합 매칭한 순위입니다
                </span>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {candidatesForActiveRole.length}명 발굴
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {candidatesForActiveRole.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  해당 역할에 일치하는 후보자를 찾을 수 없습니다.
                </div>
              ) : (
                candidatesForActiveRole.map(match => {
                  const isAlreadyAssigned = assignments[selectedRoleId]?.id === match.person.id;
                  const isAssignedElsewhere = Object.entries(assignments).some(
                    ([rId, p]) => rId !== selectedRoleId && p?.id === match.person.id
                  );

                  return (
                    <div
                      key={match.person.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isAlreadyAssigned
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {match.person.name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                onClick={() => onSelectPerson?.(match.person)}
                                className="font-bold text-sm text-slate-900 dark:text-white hover:underline cursor-pointer"
                              >
                                {match.person.name}
                              </span>
                              <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                                match.score >= 80 
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                매칭 {match.score}%
                              </span>
                              {isAssignedElsewhere && !isAlreadyAssigned && (
                                <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                  타 슬롯 참여 중
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {match.person.currentCompany} · {match.person.currentTitle}
                            </p>
                          </div>
                        </div>

                        {/* 배정 버튼 */}
                        <div>
                          {isAlreadyAssigned ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                              <Check className="w-3.5 h-3.5" /> 배정됨
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAssignPerson(selectedRoleId, match.person)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                            >
                              팀에 배정
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 일치한 핵심 스킬 칩 */}
                      {match.matchedSkills.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[10px] font-medium text-slate-400">일치 스킬:</span>
                          {match.matchedSkills.map(s => (
                            <span 
                              key={s}
                              className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                            >
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 하이라이트 사유 */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                        {match.highlightReason}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 4. 하단 요약 바 & 액션 버튼 */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* 스쿼드 준비도 게이지 */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                스쿼드 완성도:
              </span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                {gapAnalysis.readinessScore}%
              </span>
            </div>
            <div className="w-32 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-500"
                style={{ width: `${gapAnalysis.readinessScore}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline truncate max-w-xs">
              {gapAnalysis.recommendation}
            </span>
          </div>

          {/* 액션 버튼 그룹 */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyEntireSquadBrief}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>전체 스쿼드 요약 복사</span>
            </button>
            <button
              onClick={onClose}
              data-testid="complete-squad-builder"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
