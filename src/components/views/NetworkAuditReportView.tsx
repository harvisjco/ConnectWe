import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  CompanyPenetration, 
  PenetrationGrade, 
  calculateCompanyPenetrations, 
  calculateNetworkEquity, 
  exportPenetrationCsvWithBom 
} from '../../services/networkAuditService';
import { 
  ShieldCheck, Download, 
  AlertCircle, ChevronRight, PieChart, 
  Compass, Send, FileText
} from 'lucide-react';

interface NetworkAuditReportViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenDossier?: (person: Person) => void;
  onOpenBridgeModal?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const NetworkAuditReportView: React.FC<NetworkAuditReportViewProps> = ({
  people,
  onSelectPerson,
  onOpenDossier,
  onOpenBridgeModal,
  onShowToast
}) => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<PenetrationGrade | 'ALL'>('ALL');
  const [activeCompanyForDetail, setActiveCompanyForDetail] = useState<CompanyPenetration | null>(null);

  // 20대 핵심 기업 침투도 계산
  const penetrations = useMemo(() => {
    return calculateCompanyPenetrations(people);
  }, [people]);

  // 네트워크 자산 종합 요약
  const equitySummary = useMemo(() => {
    return calculateNetworkEquity(people, penetrations);
  }, [people, penetrations]);

  // 필터링된 기업 목록
  const filteredPenetrations = useMemo(() => {
    if (selectedGradeFilter === 'ALL') return penetrations;
    return penetrations.filter(p => p.grade === selectedGradeFilter);
  }, [penetrations, selectedGradeFilter]);

  // CSV 다운로드
  const handleExportCsv = () => {
    exportPenetrationCsvWithBom(penetrations);
    onShowToast('CSV BOM 포맷의 타깃 기업 침투도 진단 리포트가 다운로드되었습니다.');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header & KPI Section */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 shrink-0">
            <PieChart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">전략 인맥 자산 가치 &amp; 타깃 기업 침투율 진단실</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                Network Equity &amp; Penetration Audit
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              국내 20대 핵심 기업군에 대한 나의 인맥 침투 장악도(A~D등급)를 정밀 진단하고, 의사결정권자 사각지대(Blind Spot)를 조기에 포착합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 hover:border-slate-600 shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>CSV 진단서 다운로드 (BOM)</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400">총 인맥 자산</div>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {equitySummary.totalPeople}명
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {equitySummary.totalCompanies}개 기업에 포진
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400">DART 공시 임원</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {equitySummary.dartExecutiveTotal}명
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1">
            등기/미등기 C-Level
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 bg-emerald-950/10 flex flex-col justify-between">
          <div className="text-[11px] text-emerald-300 font-medium">A등급 전략 장악</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {equitySummary.gradeACount}개사
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            침투율 75% 이상
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-sky-500/30 bg-sky-950/10 flex flex-col justify-between">
          <div className="text-[11px] text-sky-300 font-medium">B등급 우호 채널</div>
          <div className="text-lg font-bold text-sky-400 font-mono mt-1">
            {equitySummary.gradeBCount}개사
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            침투율 45~74%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/30 bg-rose-950/10 flex flex-col justify-between">
          <div className="text-[11px] text-rose-300 font-medium">사각지대 (Blind Spot)</div>
          <div className="text-lg font-bold text-rose-400 font-mono mt-1">
            {equitySummary.blindSpotCount}개사
          </div>
          <div className="text-[10px] text-rose-400/80 mt-1">
            접점 발굴 시급
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400">90일 소통 활성도</div>
          <div className="text-lg font-bold text-indigo-400 font-mono mt-1">
            {equitySummary.activeRatio90Days}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            관계 건강성 양호
          </div>
        </div>
      </div>

      {/* 3. Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedGradeFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          전체 보기 ({penetrations.length})
        </button>

        <button
          onClick={() => setSelectedGradeFilter('GRADE_A')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'GRADE_A'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          🟢 A등급: 전략 장악 ({equitySummary.gradeACount})
        </button>

        <button
          onClick={() => setSelectedGradeFilter('GRADE_B')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'GRADE_B'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          🔵 B등급: 우호 확보 ({equitySummary.gradeBCount})
        </button>

        <button
          onClick={() => setSelectedGradeFilter('GRADE_C')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'GRADE_C'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          🟡 C등급: 초기 진입 ({equitySummary.gradeCCount})
        </button>

        <button
          onClick={() => setSelectedGradeFilter('GRADE_D')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'GRADE_D'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          🔴 D등급: 사각지대 ({equitySummary.blindSpotCount})
        </button>
      </div>

      {/* 4. Company Penetration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredPenetrations.map(item => (
          <div
            key={item.companyName}
            onClick={() => setActiveCompanyForDetail(item)}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-500">#{item.marketCapRank}위</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.gradeColor}`}>
                  {item.gradeLabel}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>{item.companyName}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                </h4>
                <div className="text-xs text-slate-400 mt-0.5">{item.industry}</div>
              </div>

              {/* Penetration Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">침투 장악도</span>
                  <span className="font-mono font-bold text-indigo-300">{item.penetrationScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.penetrationScore >= 75
                        ? 'bg-emerald-400'
                        : item.penetrationScore >= 45
                        ? 'bg-sky-400'
                        : item.penetrationScore >= 15
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${item.penetrationScore}%` }}
                  />
                </div>
              </div>

              {/* Metrics Pill Grid */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[10px]">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
                  <div className="text-slate-500">1촌</div>
                  <div className="font-mono font-bold text-white mt-0.5">{item.totalDirectContacts}명</div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
                  <div className="text-slate-500">2촌</div>
                  <div className="font-mono font-bold text-slate-300 mt-0.5">{item.totalSecondDegreeContacts}명</div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
                  <div className="text-slate-500">공시임원</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">{item.dartExecutiveCount}명</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="truncate">{item.recommendedStrategy}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Company Penetration Detail Modal */}
      {activeCompanyForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{activeCompanyForDetail.companyName}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${activeCompanyForDetail.gradeColor}`}>
                    {activeCompanyForDetail.gradeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeCompanyForDetail.industry} · 시가총액 순위 #{activeCompanyForDetail.marketCapRank}위 · 침투점수 {activeCompanyForDetail.penetrationScore}점
                </p>
              </div>
              <button onClick={() => setActiveCompanyForDetail(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
              <Compass className="w-4 h-4 shrink-0" />
              <span>권장 액션 전략: <strong>{activeCompanyForDetail.recommendedStrategy}</strong></span>
            </div>

            {/* Contacts in this company */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              <div className="font-bold text-slate-300 pb-1">보유 접점 인맥 ({activeCompanyForDetail.keyContacts.length}명)</div>

              {activeCompanyForDetail.keyContacts.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800 text-slate-500">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-400/80" />
                  <div>현재 직접적인 인맥 접점이 없습니다.</div>
                  <p className="text-[11px] text-slate-600 mt-1">2촌 소개망 또는 알럼나이 네트워크를 탐색해 첫 접점을 개척하세요.</p>
                </div>
              ) : (
                activeCompanyForDetail.keyContacts.map(p => {
                  const isDart = p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector;

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{p.name}</span>
                          <span className="text-indigo-400 text-[11px]">({p.currentTitle})</span>
                          {isDart && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              공시임원
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {p.closeness === 1 ? '1촌' : p.closeness === 2 ? '2촌' : '3촌'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.currentDepartment || '주요 부서'}</div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isDart && onOpenDossier && (
                          <button
                            onClick={() => onOpenDossier(p)}
                            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900"
                            title="DART 공시 다면 분석 보고서"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {p.closeness >= 2 && onOpenBridgeModal && (
                          <button
                            onClick={() => onOpenBridgeModal(p)}
                            className="p-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900"
                            title="2촌 소개 요청"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onSelectPerson(p);
                            setActiveCompanyForDetail(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                        >
                          상세
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveCompanyForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
