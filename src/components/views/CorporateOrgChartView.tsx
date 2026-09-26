import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  getAvailableCorporations, 
  buildCorporateOrgChart, 
  getCorpYearlySnapshots 
} from '../../services/orgChartEngine';
import { OrgNode } from '../../types/orgChart';
import { ViewHeader } from '../ui';
import { 
  Building2, Search, Sparkles, 
  Share2, Award, UserCheck, 
  Calendar, ShieldCheck,
  ChevronDown, ChevronUp, Copy, Printer, Check, Eye, EyeOff, Layers,
  ExternalLink, GitCompare, TrendingUp, UserPlus, ArrowDown,
  Crown, Zap, Briefcase, Users, DollarSign
} from 'lucide-react';

interface CorporateOrgChartViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenWarmIntro?: (target: Person, bridge?: Person) => void;
  onOpenDossier?: (target: Person) => void;
  onOpenReferralReward?: (corpName: string, domain?: string) => void;
}

export const CorporateOrgChartView: React.FC<CorporateOrgChartViewProps> = ({
  people,
  onSelectPerson,
  onOpenWarmIntro,
  onOpenDossier,
}) => {
  const corporations = useMemo(() => getAvailableCorporations(), []);

  const [selectedCorpName, setSelectedCorpName] = useState<string>(() => {
    const found = corporations.find(c => c.corpName.includes('삼성전자') || c.corpName.includes('NAVER'));
    return found ? found.corpName : (corporations[0]?.corpName || 'NAVER');
  });

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlyConnectedFilter, setOnlyConnectedFilter] = useState<boolean>(false);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isCopiedReport, setIsCopiedReport] = useState<boolean>(false);
  const [diffMode, setDiffMode] = useState<boolean>(false);

  // 섹션 접기/펼치기 토글
  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 전체 펼치기 / 전체 접기
  const setAllCollapsed = (collapse: boolean) => {
    setCollapsedSections({
      leadership: collapse,
      clevel: collapse,
      directors: collapse,
      leaders: collapse,
      auditors: collapse
    });
  };

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
      if (domainFilter !== 'all') {
        const fullDesc = `${n.position} ${n.chargeJob || ''}`.toLowerCase();
        if (domainFilter === 'semiconductor' && !/반도체|ds|메모리|파운드리|hbm|hpsp|웨이퍼/i.test(fullDesc)) return false;
        if (domainFilter === 'mobile_dx' && !/dx|모바일|vd|가전|디스플레이|자동차|모빌리티/i.test(fullDesc)) return false;
        if (domainFilter === 'ai_sw' && !/ai|sw|소프트웨어|플랫폼|데이터|클라우드|연구소/i.test(fullDesc)) return false;
        if (domainFilter === 'mgmt' && !/경영|재무|인사|기획|법무|전략|지원|cfo/i.test(fullDesc)) return false;
        if (domainFilter === 'rnd' && !/개발|연구|r&d|기술|cto|센터장/i.test(fullDesc)) return false;
      }
      return true;
    });
  };

  // 텍스트 보고서 클립보드 복사
  const handleExportTextReport = () => {
    if (!orgChart) return;
    const lines: string[] = [
      `[DART 기업 조직도 분석 리포트 - ${selectedCorpName}]`,
      `기준 연도: ${selectedYear}년 | 종목코드: ${orgChart.stockCode || 'KOSPI'} | 산업군: ${orgChart.industry || '주요 산업'}`,
      `총 공시 임원: ${orgChart.stats.totalExecutives}명 (등기: ${orgChart.stats.registeredCount}명 / 미등기: ${orgChart.stats.unregisteredCount}명)`,
      `내 인맥 연결: 1촌 직통 ${orgChart.stats.firstDegreeCount}명, 2촌 다리 ${orgChart.stats.secondDegreeCount}명`,
      `조직 편제 요약: ${currentYearInfo?.keyChanges?.join(' · ') || '정기 주총 및 사업보고서 편제'}`,
      `----------------------------------------`,
      `1. 최고 경영진 (Board & CEO):`,
      ...orgChart.hierarchy.chairpersons.map(c => `  - [회장단] ${c.name} (${c.position}${c.chargeJob ? ' / ' + c.chargeJob : ''})${c.networkMatch?.degree === 1 ? ' [1촌 직통]' : c.networkMatch?.degree === 2 ? ' [2촌 연결]' : ''}`),
      ...orgChart.hierarchy.ceos.map(c => `  - [대표이사] ${c.name} (${c.position}${c.chargeJob ? ' / ' + c.chargeJob : ''})${c.networkMatch?.degree === 1 ? ' [1촌 직통]' : c.networkMatch?.degree === 2 ? ' [2촌 연결]' : ''}`),
      `2. 핵심 C-Level & 사업부문장:`,
      ...orgChart.hierarchy.cLevels.slice(0, 10).map(c => `  - ${c.name} (${c.position}${c.chargeJob ? ' / ' + c.chargeJob : ''})${c.networkMatch?.degree === 1 ? ' [1촌]' : ''}`),
      `3. 주요 본부장 & 실장:`,
      ...orgChart.hierarchy.directors.slice(0, 12).map(c => `  - ${c.name} (${c.position}${c.chargeJob ? ' - ' + c.chargeJob : ''})`),
      `4. 부서 리더 및 담당임원 (총 ${orgChart.hierarchy.leaders.length}명 중 주요 10명):`,
      ...orgChart.hierarchy.leaders.slice(0, 10).map(c => `  - ${c.name} (${c.position}${c.chargeJob ? ' - ' + c.chargeJob : ''})`),
      `5. 거버넌스 사외이사 & 감사위원회:`,
      ...orgChart.hierarchy.auditors.map(c => `  - ${c.name} (${c.position})`),
      `----------------------------------------`,
      `출처: 금융감독원 전자공시시스템(DART) 사업보고서 공시 팩트 기반 (GoodPartner x ConnectWe Intelligence)`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopiedReport(true);
    setTimeout(() => setIsCopiedReport(false), 2500);
  };

  // 인쇄 실행
  const handlePrint = () => {
    window.print();
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

    let borderStyle = 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs';

    if (isFirst) {
      borderStyle = 'border-indigo-200/90 bg-indigo-50/20 hover:border-indigo-300 shadow-2xs';
    } else if (isSecond) {
      borderStyle = 'border-slate-200/90 bg-white hover:border-indigo-200 shadow-2xs';
    }

    return (
      <div
        key={node.id}
        onClick={() => handleNodeClick(node)}
        className={`relative p-3.5 rounded-xl border transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs ${borderStyle}`}
      >
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
              {node.registrationType || (node.isRegistered ? '등기임원' : '미등기')}
            </span>

            {node.remuneration && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 font-medium border border-slate-200/80 flex items-center gap-0.5">
                <DollarSign className="w-3 h-3 text-slate-500" />
                <span>{node.remuneration}</span>
              </span>
            )}

            {/* Diff 모드 배지 */}
            {diffMode && node.diffStatus === 'NEW' && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80 flex items-center gap-0.5">
                <UserPlus className="w-3 h-3 text-emerald-600" />
                <span>신규선임</span>
              </span>
            )}
            {diffMode && node.diffStatus === 'PROMOTED' && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold border border-sky-200/80 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3 text-sky-600" />
                <span>승진·보직</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {node.dartUrl && (
              <a
                href={node.dartUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="금융감독원 DART 공시 원문 보기"
                className="p-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200/60 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {isFirst && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-2xs">
                <UserCheck className="w-3 h-3 text-blue-600" />
                <span>1촌</span>
              </span>
            )}

            {isSecond && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                <Share2 className="w-3 h-3 text-slate-500" />
                <span>2촌 다리 ({node.networkMatch?.trustScore}%)</span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {node.name}
            </h4>
            {node.age && (
              <span className="text-[11px] text-slate-400 font-mono">({node.age}세)</span>
            )}
          </div>
          <span className="text-xs font-semibold text-blue-700">
            {node.position}
          </span>
        </div>

        {node.chargeJob && (
          <p 
            title={node.chargeJob}
            className="text-[11px] text-slate-500 mt-1 truncate group-hover:text-slate-700 transition-colors"
          >
            {node.chargeJob}
          </p>
        )}

        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate max-w-[150px]">
            {isFirst ? '주소록 등록 1촌' : isSecond ? `다리: ${node.networkMatch?.bridgePerson?.name || '동문'}` : 'DART 정기 공시'}
          </span>
          <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            상세 팩트 →
          </span>
        </div>
      </div>
    );
  };

  const renderHierarchyConnector = (label: string) => (
    <div className="flex flex-col items-center justify-center -my-2.5 select-none relative z-10">
      <div className="w-px h-3 bg-slate-200" />
      <div className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] text-slate-500 font-medium flex items-center gap-1 shadow-2xs">
        <ArrowDown className="w-2.5 h-2.5 text-slate-400" />
        <span>{label}</span>
      </div>
      <div className="w-px h-3 bg-slate-200" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 1. 상단 컨트롤 패널 */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4 shadow-2xs">
        <ViewHeader
          icon={Building2}
          title={selectedCorpName}
          subtitle={`${orgChart?.industry || '주요 상장기업'} · ${orgChart?.stats.totalExecutives}명 공시 임원 편제`}
          englishTag={orgChart?.stockCode || 'KOSPI'}
          badge={
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium font-mono">
              DART 공시 FACT 기반
            </span>
          }
          actions={
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
              <span className="text-[11px] text-slate-500 px-2 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>연도:</span>
              </span>
              {yearlySnapshots.map(snap => (
                <button
                  key={snap.year}
                  onClick={() => setSelectedYear(snap.year)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    selectedYear === snap.year
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  {snap.year}년
                </button>
              ))}
            </div>
          }
        />

        {/* 상위 기업 퀵 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-500 font-medium shrink-0">주요 기업:</span>
          {quickCorps.map(corp => (
            <button
              key={corp}
              onClick={() => setSelectedCorpName(corp)}
              className={`px-3 py-1 rounded-full shrink-0 text-xs transition-all cursor-pointer ${
                selectedCorpName === corp
                  ? 'bg-slate-900 text-white font-medium shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
              }`}
            >
              {corp}
            </button>
          ))}
          <select
            value={selectedCorpName}
            onChange={(e) => setSelectedCorpName(e.target.value)}
            className="px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            {corporations.map(c => (
              <option key={c.corpCode} value={c.corpName}>
                {c.corpName} ({c.count}명)
              </option>
            ))}
          </select>
        </div>

        {/* 2. 부문별 스마트 필터 칩 바 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-2.5">
          <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>사업 부문:</span>
          </span>
          {[
            { id: 'all', label: '전체 부문' },
            { id: 'semiconductor', label: '반도체/DS' },
            { id: 'mobile_dx', label: '모바일·가전/DX' },
            { id: 'ai_sw', label: 'AI·SW·플랫폼' },
            { id: 'rnd', label: 'R&D·연구개발' },
            { id: 'mgmt', label: '경영·기획·재무' }
          ].map(d => (
            <button
              key={d.id}
              onClick={() => setDomainFilter(d.id)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap text-xs transition-all cursor-pointer ${
                domainFilter === d.id
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* 3. 검색 및 접기/내보내기 액션 바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="임원명, 직위, 담당업무 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
            {/* 전체 펼치기 / 접기 토글 */}
            <button
              onClick={() => setAllCollapsed(false)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 text-xs font-medium transition-all shadow-2xs cursor-pointer"
              title="모든 계층 펼치기"
            >
              <Eye className="w-3 h-3 inline mr-1 text-slate-500" />
              <span>전체 펼치기</span>
            </button>
            <button
              onClick={() => setAllCollapsed(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 text-xs font-medium transition-all shadow-2xs cursor-pointer"
              title="모든 계층 접기"
            >
              <EyeOff className="w-3 h-3 inline mr-1 text-slate-400" />
              <span>전체 접기</span>
            </button>

            {/* 텍스트 보고서 복사 */}
            <button
              onClick={handleExportTextReport}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 text-xs font-medium transition-all shadow-2xs cursor-pointer"
              title="조직도 텍스트 브리핑 클립보드 복사"
            >
              {isCopiedReport ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span>{isCopiedReport ? '복사됨!' : '보고서 복사'}</span>
            </button>

            {/* 인쇄 */}
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 text-xs transition-all shadow-2xs cursor-pointer"
              title="조직도 인쇄 (Print)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* 인사 변동 Diff 비교 토글 */}
            <button
              onClick={() => setDiffMode(!diffMode)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer ${
                diffMode
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-300'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
              title="최근 정기인사 신규선임 및 승진/보직변경 임원 하이라이트"
            >
              <GitCompare className="w-3.5 h-3.5 text-slate-500" />
              <span>변동 비교</span>
            </button>

            {/* 내 인맥 필터 */}
            <button
              onClick={() => setOnlyConnectedFilter(!onlyConnectedFilter)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer ${
                onlyConnectedFilter
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-300'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>내 인맥 ({orgChart?.stats.firstDegreeCount || 0} / {orgChart?.stats.secondDegreeCount || 0}명)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 연도별 하이라이트 배너 */}
      {currentYearInfo.keyChanges && currentYearInfo.keyChanges.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Award className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-900">[{selectedYear}년도 조직 편제]</span>
            <span className="text-slate-600">
              {currentYearInfo.keyChanges.join(' · ')}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 shrink-0">
            총괄 대표이사: <strong className="text-slate-800">{currentYearInfo.ceoNames.join(', ') || '대표이사'}</strong>
          </div>
        </div>
      )}

      {/* 3. 계층형 조직도 렌더링 섹션 */}
      {orgChart && (
        <div className="space-y-5">
          {/* Level 0 & 1: 최고 경영진 */}
          {(orgChart.hierarchy.chairpersons.length > 0 || orgChart.hierarchy.ceos.length > 0) && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div 
                onClick={() => toggleSection('leadership')}
                className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer hover:opacity-90 select-none transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    최고 경영진 (Board of Directors & CEO)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {orgChart.hierarchy.chairpersons.length + orgChart.hierarchy.ceos.length}명
                  </span>
                  {collapsedSections['leadership'] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedSections['leadership'] ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filterNodes([...orgChart.hierarchy.chairpersons, ...orgChart.hierarchy.ceos]).map(node => 
                    renderOrgNodeCard(node)
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => toggleSection('leadership')}
                  className="py-2.5 text-center text-xs text-slate-500 hover:text-indigo-600 cursor-pointer bg-slate-50 rounded-xl border border-dashed border-slate-200"
                >
                  최고 경영진 {orgChart.hierarchy.chairpersons.length + orgChart.hierarchy.ceos.length}명 접힘 (클릭하여 펼치기 ↓)
                </div>
              )}
            </div>
          )}

          {/* 수직 계층 연결선: 최고경영진 ➔ C-Level */}
          {orgChart.hierarchy.cLevels.length > 0 && renderHierarchyConnector('핵심 사업총괄 보고라인')}

          {/* Level 2: C-Level & 부문장 */}
          {orgChart.hierarchy.cLevels.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-2xs">
              <div 
                onClick={() => toggleSection('clevel')}
                className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer hover:opacity-90 select-none transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    핵심 사업부문장 & C-Level (부사장 / CTO / CFO / COO)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    {orgChart.hierarchy.cLevels.length}명
                  </span>
                  {collapsedSections['clevel'] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedSections['clevel'] ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filterNodes(orgChart.hierarchy.cLevels).map(node => 
                    renderOrgNodeCard(node)
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => toggleSection('clevel')}
                  className="py-2.5 text-center text-xs text-slate-500 hover:text-indigo-600 cursor-pointer bg-slate-50 rounded-xl border border-dashed border-slate-200"
                >
                  C-Level & 부문장 {orgChart.hierarchy.cLevels.length}명 접힘 (클릭하여 펼치기 ↓)
                </div>
              )}
            </div>
          )}

          {/* 수직 계층 연결선: C-Level ➔ 본부장/실장 */}
          {orgChart.hierarchy.directors.length > 0 && renderHierarchyConnector('부문별 본부 지휘라인')}

          {/* Level 3: 본부장 / 실장 / 전무 / 상무 */}
          {orgChart.hierarchy.directors.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-3 shadow-2xs">
              <div 
                onClick={() => toggleSection('directors')}
                className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer hover:opacity-90 select-none transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    본부장 · 실장 · 총괄 디렉터 (전무 / 상무)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    {orgChart.hierarchy.directors.length}명
                  </span>
                  {collapsedSections['directors'] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedSections['directors'] ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filterNodes(orgChart.hierarchy.directors).map(node => 
                    renderOrgNodeCard(node)
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => toggleSection('directors')}
                  className="py-2.5 text-center text-xs text-slate-500 hover:text-indigo-600 cursor-pointer bg-slate-50 rounded-xl border border-dashed border-slate-200"
                >
                  본부장/실장 {orgChart.hierarchy.directors.length}명 접힘 (클릭하여 펼치기 ↓)
                </div>
              )}
            </div>
          )}

          {/* 수직 계층 연결선: 본부장 ➔ 부서 리더/이사 */}
          {orgChart.hierarchy.leaders.length > 0 && renderHierarchyConnector('실무 리더십 지휘라인')}

          {/* Level 4: 부서 리더 / 이사 */}
          {orgChart.hierarchy.leaders.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div 
                onClick={() => toggleSection('leaders')}
                className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer hover:opacity-90 select-none transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    부서 리더 · 그룹장 · 핵심 담당임원 (이사)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    {orgChart.hierarchy.leaders.length}명
                  </span>
                  {collapsedSections['leaders'] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedSections['leaders'] ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filterNodes(orgChart.hierarchy.leaders).map(node => 
                    renderOrgNodeCard(node)
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => toggleSection('leaders')}
                  className="py-2.5 text-center text-xs text-slate-500 hover:text-indigo-600 cursor-pointer bg-slate-50 rounded-xl border border-dashed border-slate-200"
                >
                  부서 리더·담당임원 {orgChart.hierarchy.leaders.length}명 접힘 (클릭하여 펼치기 ↓)
                </div>
              )}
            </div>
          )}

          {/* 거버넌스: 사외이사 & 감사위원회 */}
          {orgChart.hierarchy.auditors.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div 
                onClick={() => toggleSection('auditors')}
                className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 cursor-pointer hover:opacity-90 select-none transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                    거버넌스: 사외이사 & 감사위원회
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    {orgChart.hierarchy.auditors.length}명
                  </span>
                  {collapsedSections['auditors'] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!collapsedSections['auditors'] ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {filterNodes(orgChart.hierarchy.auditors).map(node => (
                    <div 
                      key={node.id}
                      onClick={() => handleNodeClick(node)}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-2xs text-xs cursor-pointer transition-all"
                    >
                      <div className="font-bold text-slate-900">{node.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{node.position}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  onClick={() => toggleSection('auditors')}
                  className="py-2 text-center text-xs text-slate-500 hover:text-indigo-600 cursor-pointer bg-white rounded-lg border border-dashed border-slate-200"
                >
                  사외이사 & 감사 {orgChart.hierarchy.auditors.length}명 접힘 (클릭하여 펼치기 ↓)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
