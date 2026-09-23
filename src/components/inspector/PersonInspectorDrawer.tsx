import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  X, Phone, Mail, Briefcase, GraduationCap, 
  Calendar, ShieldCheck, Clock, Edit3, Check, 
  Tag
} from 'lucide-react';

interface PersonInspectorDrawerProps {
  person: Person | null;
  onClose: () => void;
  onUpdatePersonMemo?: (personId: string, newMemo: string) => void;
}

export const PersonInspectorDrawer: React.FC<PersonInspectorDrawerProps> = ({
  person,
  onClose,
  onUpdatePersonMemo
}) => {
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoText, setMemoText] = useState(person?.memo || '');

  // person 바뀔 때 메모 초기화
  React.useEffect(() => {
    setMemoText(person?.memo || '');
    setIsEditingMemo(false);
  }, [person]);

  if (!person) return null;

  const handleSaveMemo = () => {
    setIsEditingMemo(false);
    onUpdatePersonMemo?.(person.id, memoText);
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{person.name}</h2>
              {/* Fact Tagging */}
              {person.sourceType === 'DART_FACT' ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> DART FACT
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  📇 SOURCE DATA
                </span>
              )}

              {person.isStale && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 6M+ 미소통
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-300">
              {person.currentTitle} · <span className="text-indigo-400">{person.currentCompany}</span>
            </p>
            {person.currentDepartment && (
              <p className="text-xs text-slate-400">{person.currentDepartment}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Communication Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${person.mobile}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>전화 걸기 ({person.mobile})</span>
            </a>

            <a
              href={`mailto:${person.email}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 active:scale-95 transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>이메일 전송</span>
            </a>
          </div>

          {/* DART Fact Verification Section */}
          {person.dartInfo && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wide uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>금융감독원 DART 공시 실명 팩트</span>
                </div>
                <span className="text-[10px] text-slate-400">기준: {person.dartInfo.verifiedAt}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">상장사명</span>
                  <span className="font-semibold text-slate-200">{person.dartInfo.stockName}</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">공시 직위</span>
                  <span className="font-semibold text-emerald-300">{person.dartInfo.registeredRole}</span>
                </div>
                {person.dartInfo.registeredTerm && (
                  <div className="col-span-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">임기(재선임 현황)</span>
                    <span className="font-medium text-slate-200">{person.dartInfo.registeredTerm}</span>
                  </div>
                )}
                {person.dartInfo.ownershipShares && (
                  <div className="col-span-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">보유 보통주 주식수</span>
                    <span className="font-semibold text-indigo-300">
                      {person.dartInfo.ownershipShares.toLocaleString()}주
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Age Spectrum & Demographic Info */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>연령대 및 인구통계</span>
            </h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">생년 / 연령대:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">
                  {person.birthYear ? `${person.birthYear}년생 (${new Date().getFullYear() - person.birthYear}세)` : '생년 미확인'}
                </span>
                {person.isAgeEstimated ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    추정 연령 ({person.estimatedAgeGroup})
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    실측 팩트 ({person.estimatedAgeGroup})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Multi-source Career Timeline (Alumni 역추적 핵심) */}
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          현직 재직중
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          🏛️ 알럼나이 (전직)
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

        </div>

      </div>
    </div>
  );
};
