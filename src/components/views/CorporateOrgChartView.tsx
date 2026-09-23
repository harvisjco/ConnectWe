import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  getAvailableCorporations, 
  buildCorporateOrgChart, 
  getCorpYearlySnapshots 
} from '../../services/orgChartEngine';
import { OrgNode } from '../../types/orgChart';
import { 
  Building2, Search, Sparkles, 
  Share2, Award, UserCheck, 
  Calendar, ShieldCheck, Phone, MessageSquare
} from 'lucide-react';

interface CorporateOrgChartViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenWarmIntro?: (target: Person, bridge?: Person) => void;
  onOpenDossier?: (target: Person) => void;
}

export const CorporateOrgChartView: React.FC<CorporateOrgChartViewProps> = ({
  people,
  onSelectPerson,
  onOpenWarmIntro,
  onOpenDossier
}) => {
  const corporations = useMemo(() => getAvailableCorporations(), []);

  const [selectedCorpName, setSelectedCorpName] = useState<string>(() => {
    const found = corporations.find(c => c.corpName.includes('삼성전자') || c.corpName.includes('NAVER'));
    return found ? found.corpName : (corporations[0]?.corpName || 'NAVER');
  });

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlyConnectedFilter, setOnlyConnectedFilter] = useState<boolean>(false);

  // 연도별 시계열 스냅샷
  const yearlySnapshots = useMemo(() => {
    return getCorpYearlySnapshots(selectedCorpName);
  }, [selectedCorpName]);

  const currentYearInfo = yearlySnapshots.find(y => y.year === selectedYear) || yearlySnapshots[0];

  // 조직도 데이터 빌드
  const orgChart = useMemo(() => {
    return buildCorporateOrgChart(selectedCorpName, selectedYear, people);
  }, [selectedCorpName, selectedYear, people]);

  const quickCorps = ['삼성전자', 'NAVER', '카카오', 'SK하이닉스', '현대자동차', '카카오뱅크', 'LG에너지솔루션', '한미반도체'];

  const filterNodes = (nodes: OrgNode[]) => {
    return nodes.filter(n => {
      if (onlyConnectedFilter && !n.networkMatch) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = n.name.toLowerCase().includes(q);
        const matchPos = n.position.toLowerCase().includes(q);
        const matchJob = (n.chargeJob || '').toLowerCase().includes(q);
        if (!matchName && !matchPos && !matchJob) return false;
      }
      return true;
    });
  };

  const handleNodeClick = (node: OrgNode) => {
    if (node.networkMatch?.degree === 1) {
      onSelectPerson(node.networkMatch.matchedPerson);
    } else if (node.networkMatch?.degree === 2) {
      if (onOpenWarmIntro) {
        onOpenWarmIntro(node.networkMatch.matchedPerson, node.networkMatch.bridgePerson);
      } else {
        onSelectPerson(node.networkMatch.matchedPerson);
      }
    } else {
      const syntheticPerson: Person = {
        id: node.id,
        name: node.name,
        currentCompany: node.corpName,
        currentDepartment: node.chargeJob || '',
        currentTitle: node.position,
        mobile: '',
        email: '',
        primaryDomain: '경영/임원',
        sourceType: 'DART_FACT',
        closeness: 5,
        isStale: false,
        skills: [node.position],
        careers: [{
          id: `c-${node.id}`,
          companyName: node.corpName,
          title: node.position,
          startYear: new Date().getFullYear(),
          isCurrent: true,
          source: 'DART_FACT'
        }],
        academics: [],
        estimatedAgeGroup: '50s_plus',
        isAgeEstimated: true,
        connectionChannel: 'dart',
        memo: `[DART 정기공시 임원] 담당업무: ${node.chargeJob || '-'} | 등기여부: ${node.isRegistered ? '등기' : '미등기'}`
      };
      if (onOpenDossier) {
        onOpenDossier(syntheticPerson);
      } else {
        onSelectPerson(syntheticPerson);
      }
    }
  };

  const renderOrgNodeCard = (node: OrgNode) => {
    const isFirst = node.networkMatch?.degree === 1;
    const isSecond = node.networkMatch?.degree === 2;

    let borderStyle = 'border-slate-800 bg-slate-900/80 hover:border-slate-700';
    let ringGlow = '';

    if (isFirst) {
      borderStyle = 'border-amber-500/80 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900';
      ringGlow = 'ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20';
    } else if (isSecond) {
      borderStyle = 'border-emerald-500/80 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900';
      ringGlow = 'ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/20';
    }

    return (
      <div
        key={node.id}
        onClick={() => handleNodeClick(node)}
        className={`relative p-3.5 rounded-xl border transition-all cursor-pointer group hover:-translate-y-0.5 ${borderStyle} ${ringGlow}`}
      >
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
              {node.registrationType || (node.isRegistered ? '등기임원' : '미등기')}
            </span>

            {node.remuneration && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-500/30">
                💰 {node.remuneration}
              </span>
            )}
          </div>

          {isFirst && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black animate-pulse shadow-sm">
              <UserCheck className="w-3 h-3" />
              <span>1촌 직통</span>
            </span>
          )}

          {isSecond && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold">
              <Share2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>2촌 다리 ({node.networkMatch?.trustScore}%)</span>
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              {node.name}
            </h4>
            {node.age && (
              <span className="text-[11px] text-slate-400 font-mono">({node.age}세)</span>
            )}
          </div>
          <span className="text-xs font-semibold text-indigo-400">
            {node.position}
          </span>
        </div>

        {node.chargeJob && (
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
            {node.chargeJob}
          </p>
        )}

        {isSecond && node.networkMatch?.bridgePerson && (
          <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[10px] text-emerald-400 flex items-center justify-between">
            <span>다리: <strong>{node.networkMatch.bridgePerson.name}</strong> ({node.networkMatch.bridgePerson.currentCompany})</span>
            <span className="text-emerald-300 underline font-semibold">소개장 작성 →</span>
          </div>
        )}

        {isFirst && (
          <div className="mt-2 pt-2 border-t border-amber-500/30 text-[10px] text-amber-300 flex items-center justify-between font-medium">
            <span>내 주소록 등록 인맥</span>
            <div className="flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-amber-400" />
              <MessageSquare className="w-2.5 h-2.5 text-amber-400" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. 상단 컨트롤 패널 */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>{selectedCorpName}</span>
                  <span className="text-xs text-indigo-400 font-mono">[{orgChart?.stockCode || 'KOSPI'}]</span>
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold">
                  🏛️ DART 공시 FACT 기반 추정 조직도
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {orgChart?.industry || '주요 상장기업'} · {orgChart?.stats.totalExecutives}명 공시 임원 편제
              </p>
            </div>
          </div>

          {/* 연도별 시계열 선택기 */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start md:self-auto">
            <span className="text-[11px] text-slate-400 px-2 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>연도별 조회:</span>
            </span>
            {yearlySnapshots.map(snap => (
              <button
                key={snap.year}
                onClick={() => setSelectedYear(snap.year)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedYear === snap.year
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {snap.year}년
              </button>
            ))}
          </div>
        </div>

        {/* 상위 기업 퀵 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold shrink-0">주요 기업:</span>
          {quickCorps.map(corp => (
            <button
              key={corp}
              onClick={() => setSelectedCorpName(corp)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                selectedCorpName === corp
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {corp}
            </button>
          ))}
          <select
            value={selectedCorpName}
            onChange={(e) => setSelectedCorpName(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs focus:outline-none focus:border-indigo-500"
          >
            {corporations.map(c => (
              <option key={c.corpCode} value={c.corpName}>
                {c.corpName} ({c.count}명)
              </option>
            ))}
          </select>
        </div>

        {/* 검색 및 필터 바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="임원명 직위 담당업무 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setOnlyConnectedFilter(!onlyConnectedFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                onlyConnectedFilter
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>내 인맥(1·2촌) 연결만 보기 ({orgChart?.stats.firstDegreeCount || 0} / {orgChart?.stats.secondDegreeCount || 0}명)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 연도별 하이라이트 배너 */}
      {currentYearInfo.keyChanges && currentYearInfo.keyChanges.length > 0 && (
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold">
            <Award className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>[{selectedYear}년도 조직 편제 요약]</span>
            <span className="text-slate-300 font-normal">
              {currentYearInfo.keyChanges.join(' · ')}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 shrink-0">
            총괄 대표이사: <strong className="text-white">{currentYearInfo.ceoNames.join(', ') || '대표이사'}</strong>
          </div>
        </div>
      )}

      {/* 3. 계층형 조직도 렌더링 섹션 */}
      {orgChart && (
        <div className="space-y-6">
          {/* Level 0 & 1: 최고 경영진 */}
          {(orgChart.hierarchy.chairpersons.length > 0 || orgChart.hierarchy.ceos.length > 0) && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    👑 최고 경영진 (Board of Directors &amp; CEO)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {orgChart.hierarchy.chairpersons.length + orgChart.hierarchy.ceos.length}명
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filterNodes([...orgChart.hierarchy.chairpersons, ...orgChart.hierarchy.ceos]).map(node => 
                  renderOrgNodeCard(node)
                )}
              </div>
            </div>
          )}

          {/* Level 2: C-Level & 부문장 */}
          {orgChart.hierarchy.cLevels.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    ⚡ 핵심 사업부문장 &amp; C-Level (부사장 / CTO / CFO / COO)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {orgChart.hierarchy.cLevels.length}명
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filterNodes(orgChart.hierarchy.cLevels).map(node => 
                  renderOrgNodeCard(node)
                )}
              </div>
            </div>
          )}

          {/* Level 3: 본부장 / 실장 / 전무 / 상무 */}
          {orgChart.hierarchy.directors.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                    💼 본부장 · 실장 · 총괄 디렉터 (전무 / 상무)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {orgChart.hierarchy.directors.length}명
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filterNodes(orgChart.hierarchy.directors).map(node => 
                  renderOrgNodeCard(node)
                )}
              </div>
            </div>
          )}

          {/* Level 4: 부서 리더 / 이사 */}
          {orgChart.hierarchy.leaders.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    👥 부서 리더 · 그룹장 · 핵심 담당임원 (이사)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {orgChart.hierarchy.leaders.length}명
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filterNodes(orgChart.hierarchy.leaders).map(node => 
                  renderOrgNodeCard(node)
                )}
              </div>
            </div>
          )}

          {/* 거버넌스: 사외이사 & 감사위원회 */}
          {orgChart.hierarchy.auditors.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <h3 className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                    🛡️ 거버넌스: 사외이사 &amp; 감사위원회
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {orgChart.hierarchy.auditors.length}명
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {filterNodes(orgChart.hierarchy.auditors).map(node => (
                  <div 
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-xs cursor-pointer transition-all"
                  >
                    <div className="font-bold text-slate-200">{node.name}</div>
                    <div className="text-[10px] text-teal-400">{node.position}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
