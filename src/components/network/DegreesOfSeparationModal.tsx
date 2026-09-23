import React from 'react';
import { Person } from '../../types/network';
import { 
  X, GitFork, ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react';

interface DegreesOfSeparationModalProps {
  targetPerson: Person;
  people: Person[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
}

export const DegreesOfSeparationModal: React.FC<DegreesOfSeparationModalProps> = ({
  targetPerson,
  people,
  onClose,
  onSelectPerson
}) => {
  // 나(Me)와 타겟 인물 사이를 연결해줄 수 있는 1촌 '다리(Bridge)' 인맥 탐색 알고리즘
  // 조건:
  // 1) 1촌 인맥(closeness <= 3) 중 타겟 인물과 같은 회사에 현직으로 있거나,
  // 2) 타겟 인물이 거쳐간 전직 회사(알럼나이)에 같이 근무했거나,
  // 3) 같은 학교/학맥(KAIST, 서울대 등)을 공유하는 인맥
  
  const targetCompanies = new Set([
    targetPerson.currentCompany,
    ...targetPerson.careers.map(c => c.companyName)
  ]);

  const targetSchools = new Set(targetPerson.academics.map(a => a.schoolName));

  const bridgeCandidates = people.filter(p => {
    if (p.id === targetPerson.id) return false;
    if (p.closeness > 3) return false; // 1촌만 브릿지 가능

    // 회사 접점 검사
    const hasCompanyOverlap = targetCompanies.has(p.currentCompany) || 
      p.careers.some(c => targetCompanies.has(c.companyName));

    // 학교 접점 검사
    const hasSchoolOverlap = p.academics.some(a => targetSchools.has(a.schoolName));

    return hasCompanyOverlap || hasSchoolOverlap;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">2촌 소개 접점 경로 탐색 (Degrees of Separation)</h2>
              <p className="text-xs text-slate-400">
                [<strong className="text-white">{targetPerson.name}</strong>] 님과 연결될 수 있는 우리 1촌 지인 네트워크 경로를 역추적합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Target Profile Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">최종 도달 대상</span>
              <span className="text-base font-bold text-white">{targetPerson.name} {targetPerson.currentTitle}</span>
              <span className="text-xs text-slate-400 block mt-0.5">{targetPerson.currentCompany}</span>
            </div>
            {targetPerson.sourceType === 'DART_FACT' && (
              <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> DART FACT
              </span>
            )}
          </div>

          {/* Bridges List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                소개 다리를 놓아줄 수 있는 핵심 1촌 지인 ({bridgeCandidates.length}명 발견)
              </h3>
            </div>

            {bridgeCandidates.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
                <p className="text-xs text-slate-400">
                  현재 등록된 1촌 지인 중 같은 기업 재직/알럼나이 또는 동문 이력을 공유하는 직접적인 2촌 접점이 발견되지 않았습니다.
                </p>
                <p className="text-[11px] text-slate-500">
                  더 많은 리멤버 명함이나 스마트폰 주소록을 추가하면 연결 경로가 자동으로 확장됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bridgeCandidates.map(bridge => {
                  // 접점 사유 분석
                  const reasons: string[] = [];
                  if (bridge.currentCompany === targetPerson.currentCompany) {
                    reasons.push(`현재 같은 직장(${bridge.currentCompany}) 재직 중`);
                  }
                  bridge.careers.filter(c => !c.isCurrent).forEach(c => {
                    if (targetCompanies.has(c.companyName)) {
                      reasons.push(`과거 ${c.companyName} 동문/동료 재직 이력 공유`);
                    }
                  });
                  bridge.academics.forEach(a => {
                    if (targetSchools.has(a.schoolName)) {
                      reasons.push(`${a.schoolName} 동문 네트워크`);
                    }
                  });

                  return (
                    <div 
                      key={bridge.id}
                      className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 space-y-3"
                    >
                      {/* Visual Path: Me -> Bridge -> Target */}
                      <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto pb-1">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white whitespace-nowrap">
                          나 (Me)
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="px-2.5 py-1 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/40 whitespace-nowrap font-bold">
                          1촌: {bridge.name} ({bridge.currentTitle})
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 whitespace-nowrap">
                          2촌: {targetPerson.name}
                        </span>
                      </div>

                      {/* Bridge Details */}
                      <div className="space-y-1.5 pl-1">
                        <p className="text-xs text-slate-300">
                          <strong>{bridge.name}</strong> ({bridge.currentCompany} · {bridge.currentTitle})
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {reasons.map((r, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>{r}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">연락처: {bridge.mobile}</span>
                        <button
                          onClick={() => {
                            onSelectPerson(bridge);
                            onClose();
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                        >
                          <span>{bridge.name} 님 프로필 확인</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
