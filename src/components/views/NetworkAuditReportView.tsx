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
import { ViewHeader } from '../ui';

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

  // 20대 핵심 기업 네트워크 커버리지(도달도) 계산
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
    onShowToast('CSV BOM 포맷의 핵심 파트너 기업 네트워크 커버리지 진단서가 다운로드되었습니다.');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Standardized Header */}
      <ViewHeader
        icon={PieChart}
        title="신뢰 네트워크 현황 & 주요 파트너 기업 커버리지 리포트"
        subtitle="국내 20대 주요 기업군과의 신뢰 네트워크 현황을 정밀히 살펴보고, 새로운 협력 기회와 잠재적 인연을 정성껏 발굴합니다."
        englishTag="Network Equity & Coverage Audit"
        actions={
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs border border-transparent shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>CSV 진단서 다운로드 (BOM)</span>
          </button>
        }
      />

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">함께하는 인연</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            {equitySummary.totalPeople}명
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {equitySummary.totalCompanies}개 기업에서 활약 중
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">DART 공시 임원</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {equitySummary.dartExecutiveTotal}명
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-500/80 font-medium mt-1">
            등기/미등기 C-Level
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-500/30 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">핵심 협력 파트너사</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
            {equitySummary.gradeACount}개사
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-slate-400 mt-1">
            도달률 75% 이상
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/10 border border-sky-200 dark:border-sky-500/30 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-sky-800 dark:text-sky-300 font-semibold">우호적 교류 기업</div>
          <div className="text-xl font-bold text-sky-700 dark:text-sky-400 font-mono mt-1">
            {equitySummary.gradeBCount}개사
          </div>
          <div className="text-[11px] text-sky-600 dark:text-slate-400 mt-1">
            도달률 45~74%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold">새로운 인연 기대 기업</div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-300 font-mono mt-1">
            {equitySummary.blindSpotCount}개사
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            새로운 접점 탐색
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">90일 소통 활성도</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            {equitySummary.activeRatio90Days}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            관계 건강성 양호
          </div>
        </div>
      </div>

      {/* 3. Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedGradeFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          전체 보기 ({penetrations.length})
        </button>

        <button
          onClick={() => setSelectedGradeFilter('GRADE_A')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'GRADE_A'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          🟢 핵심 파트너십 ({equitySummary.gradeACount})
        </button>

        <button
          onClick={() => setSelectedGradeFilter('GRADE_B')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'GRADE_B'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          🔵 우호적 교류 ({equitySummary.gradeBCount})
        </button>

        <button
          onClick={() => setSelectedGradeFilter('GRADE_C')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'GRADE_C'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          🟡 초기 접점 ({equitySummary.gradeCCount})
        </button>

        <button
          onClick={() => setSelectedGradeFilter('GRADE_D')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
            selectedGradeFilter === 'GRADE_D'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm'
          }`}
        >
          ⚪ 잠재 인연 ({equitySummary.blindSpotCount})
        </button>
      </div>

      {/* 4. Company Penetration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredPenetrations.map(item => (
          <div
            key={item.companyName}
            onClick={() => setActiveCompanyForDetail(item)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-500">#{item.marketCapRank}위</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${item.gradeColor}`}>
                  {item.gradeLabel}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>{item.companyName}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.industry}</div>
              </div>

              {/* Penetration Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">네트워크 도달력</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">{item.penetrationScore}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.penetrationScore >= 75
                        ? 'bg-emerald-500'
                        : item.penetrationScore >= 45
                        ? 'bg-sky-500'
                        : item.penetrationScore >= 15
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.penetrationScore}%` }}
                  />
                </div>
              </div>

              {/* Metrics Pill Grid */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-500">1촌</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{item.totalDirectContacts}명</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-500">2촌</div>
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">{item.totalSecondDegreeContacts}명</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-500">공시임원</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{item.dartExecutiveCount}명</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="truncate">{item.recommendedStrategy}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Company Penetration Detail Modal */}
      {activeCompanyForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeCompanyForDetail.companyName}</h3>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${activeCompanyForDetail.gradeColor}`}>
                    {activeCompanyForDetail.gradeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeCompanyForDetail.industry} · 시가총액 순위 #{activeCompanyForDetail.marketCapRank}위 · 도달점수 {activeCompanyForDetail.penetrationScore}점
                </p>
              </div>
              <button 
                onClick={() => setActiveCompanyForDetail(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>권장 액션 전략: <strong>{activeCompanyForDetail.recommendedStrategy}</strong></span>
            </div>

            {/* Contacts in this company */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-300 pb-1">보유 접점 인맥 ({activeCompanyForDetail.keyContacts.length}명)</div>

              {activeCompanyForDetail.keyContacts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                  <div className="font-medium">현재 직접적인 인맥 접점이 없습니다.</div>
                  <p className="text-xs text-slate-500 mt-1">2촌 소개망 또는 알럼나이 네트워크를 탐색해 첫 접점을 개척하세요.</p>
                </div>
              ) : (
                activeCompanyForDetail.keyContacts.map(p => {
                  const isDart = p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector;

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{p.name}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 text-xs">({p.currentTitle})</span>
                          {isDart && (
                            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/30 text-[11px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              공시임원
                            </span>
                          )}
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                            {p.closeness === 1 ? '1촌' : p.closeness === 2 ? '2촌' : '3촌'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.currentDepartment || '주요 부서'}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDart && onOpenDossier && (
                          <button
                            onClick={() => onOpenDossier(p)}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-900 transition-colors"
                            title="DART 공시 다면 분석 보고서"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {p.closeness >= 2 && onOpenBridgeModal && (
                          <button
                            onClick={() => onOpenBridgeModal(p)}
                            className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-500/30 dark:hover:bg-indigo-900 transition-colors"
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
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:text-white text-xs font-semibold shadow-sm"
                        >
                          상세
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveCompanyForDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
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
