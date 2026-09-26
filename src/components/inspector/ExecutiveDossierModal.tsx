import React, { useRef } from 'react';
import { Person } from '../../types/network';
import { identifyTalentCluster } from '../../services/talentClusterEngine';
import { 
  X, Printer, Sparkles, Building2, 
  Clock, ShieldCheck, Lightbulb, AlertTriangle, UserCheck,
  Rocket, Cpu, Briefcase
} from 'lucide-react';

interface ExecutiveDossierModalProps {
  person: Person;
  people: Person[]; // 공통 접점 탐색용
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ExecutiveDossierModal: React.FC<ExecutiveDossierModalProps> = ({
  person,
  people,
  onClose,
  onShowToast
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // 공통 전직/현직 알럼나이 인맥 탐색
  const sharedAlumniPeople = people.filter(p => {
    if (p.id === person.id || p.closeness === 1) return false;
    const pCompanies = [p.currentCompany, ...p.careers.map(c => c.companyName)];
    const targetCompanies = [person.currentCompany, ...person.careers.map(c => c.companyName)];
    return pCompanies.some(c => targetCompanies.includes(c));
  }).slice(0, 3);

  const cluster = identifyTalentCluster(person);

  // AI 화두(Ice-breaker) 생성 로직 (5대 인재 클러스터 특화 연계)
  const generateIcebreakers = () => {
    const items: { title: string; desc: string; type: 'cluster' | 'dart' | 'alumni' | 'domain' }[] = [];

    // 1. 5대 인재 클러스터 고유 강점(Superpower) 기반 특화 화두
    if (cluster.id === 'VENTURE_LEADER') {
      items.push({
        title: `${person.currentCompany}의 빠른 시장 개척 & 비즈니스 기동성`,
        desc: `기동성 있는 의사결정과 넓은 업무 스콥을 이끄시는 혁신 리더입니다. 최근 시장 성장 모멘텀에 대한 경의를 표하며 양사 간 신속한 협력 시너지를 제안하기에 최적입니다.`,
        type: 'cluster'
      });
    } else if (cluster.id === 'TECH_FELLOW') {
      items.push({
        title: `원천 기술 아키텍처 비전 & 최신 공학적 프론티어`,
        desc: `선도 기술과 R&D 영역에서 독보적 시스템을 설계하는 최고 수준의 기술 인재입니다. 기술 스택, 차세대 AI/공학 아키텍처 및 미래 로드맵에 관한 고견을 여쭈며 깊이 있는 교류를 시작하세요.`,
        type: 'cluster'
      });
    } else if (cluster.id === 'INVESTOR_PARTNER') {
      items.push({
        title: `산업 거시 생태계 통찰 & 기업가치 스케일업 딜 동향`,
        desc: `자본 시장과 성장 딜을 꿰뚫고 있는 투자 파트너입니다. 최근 투자 심리, 유망 섹터 포트폴리오 트렌드 및 향후 자본 조달/파트너십 관점의 거시적 담론으로 신뢰를 형성할 수 있습니다.`,
        type: 'cluster'
      });
    } else if (cluster.id === 'LISTED_EXECUTIVE') {
      items.push({
        title: `공적 거버넌스 신뢰 & 대규모 조직 전략 제휴`,
        desc: `전자공시(DART)로 검증된 제도권 거버넌스와 대규모 조직 관리를 주도하는 임원입니다. 기업의 투명한 경영 성과를 축하하고 안정적 파트너십 프레임워크를 정중히 논의하기 좋습니다.`,
        type: 'cluster'
      });
    } else {
      items.push({
        title: `현장 프로덕트 빌딩 경험 & 최신 기술 마스터리`,
        desc: `탁월한 실무 전문성으로 제품을 직접 견인하는 핵심 인재입니다. 현장에서 겪은 생생한 문제해결 노하우와 최신 빌딩 프로세스를 편안하게 나누며 깊은 유대감을 쌓을 수 있습니다.`,
        type: 'cluster'
      });
    }

    // 2. DART 공시 기반 화두 (있을 경우)
    if (person.dartInfo) {
      items.push({
        title: `${person.dartInfo.stockName} 최근 공시 및 경영 현황`,
        desc: `공시 임원(${person.dartInfo.registeredRole})으로 등재되어 있으므로, 최근 회사 사업보고서 및 업계 실적 호조에 대한 축하와 관심으로 대화를 시작하면 신뢰를 얻기 쉽습니다.`,
        type: 'dart'
      });
    }

    // 3. 알럼나이 기반 화두
    const pastCareer = person.careers.find(c => !c.isCurrent);
    if (pastCareer) {
      items.push({
        title: `${pastCareer.companyName} 출신 동문 네트워크`,
        desc: `과거 ${pastCareer.companyName} (${pastCareer.title}) 시절의 주요 동료나 당시 프로젝트 경험을 가볍게 회고하며 친밀감을 형성하기 좋습니다.`,
        type: 'alumni'
      });
    }

    // 4. 전문 도메인 기반 화두
    items.push({
      title: `${person.primaryDomain} 최신 산업 트렌드 및 인사이트`,
      desc: `${person.currentTitle} 직함에 걸맞게 최근 ${person.primaryDomain} 분야의 시장 변동성이나 향후 기술/투자 방향성에 대해 고견을 구하는 질문이 효과적입니다.`,
      type: 'domain'
    });

    return items;
  };

  const icebreakers = generateIcebreakers();

  // 인쇄 실행
  const handlePrint = () => {
    window.print();
    onShowToast('브리핑 리포트 인쇄 창이 열렸습니다.');
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* 모달 상단 툴바 (인쇄 시 숨김) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              경영진 1-Page 미팅 전략 브리프 (Meeting Prep Brief)
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 font-mono">
              미팅 10분 전 브리핑
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span>A4 리포트 인쇄 / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 인쇄 대상 1-Page Brief 본문 영역 */}
        <div ref={printRef} className="p-6 md:p-8 space-y-6 overflow-y-auto bg-white text-slate-900 print:p-0 print:m-0">
          
          {/* 헤더 프로필 블록 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 print:border-slate-300">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 print:text-black">
                  {person.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold print:border-slate-400 print:text-slate-800">
                  {person.currentTitle}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border flex items-center gap-1 ${cluster.badgeStyle} print:border-slate-400 print:text-slate-800`}>
                  {cluster.id === 'LISTED_EXECUTIVE' && <Building2 className="w-3.5 h-3.5" />}
                  {cluster.id === 'VENTURE_LEADER' && <Rocket className="w-3.5 h-3.5" />}
                  {cluster.id === 'TECH_FELLOW' && <Cpu className="w-3.5 h-3.5" />}
                  {cluster.id === 'INVESTOR_PARTNER' && <Briefcase className="w-3.5 h-3.5" />}
                  {cluster.id === 'CORE_SPECIALIST' && <Sparkles className="w-3.5 h-3.5" />}
                  <span>{cluster.label}</span>
                </span>
                {person.dartInfo && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> DART 공시 검증
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-indigo-600 print:text-indigo-800">
                {person.currentCompany} {person.currentDepartment ? `· ${person.currentDepartment}` : ''}
              </p>
              <p className="text-xs text-slate-500 print:text-slate-600">
                전문 분야: <strong className="text-slate-800 print:text-black">{person.primaryDomain}</strong> · 경력 단계: <strong className="text-slate-800 print:text-black">{cluster.seniorityLevel}</strong>
              </p>

              {/* 3대 고유 강점 (Superpowers) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {cluster.superpowers.map((sp, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/80 font-medium print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                    ⚡ {sp}
                  </span>
                ))}
              </div>
            </div>

            {/* 기본 연락 정보 (미팅 직전 빠른 확인용) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1 min-w-[200px] print:bg-slate-100 print:border-slate-300 shadow-2xs">
              <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-bold tracking-wider">
                Direct Contact
              </div>
              <div className="font-mono text-slate-900 print:text-black font-semibold">{person.mobile}</div>
              <div className="text-slate-500 print:text-slate-700 truncate text-[11px]">{person.email}</div>
            </div>
          </div>

          {/* DART 실공시 팩트 섹션 (있을 경우) */}
          {person.dartInfo && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2 print:bg-emerald-50 print:border-emerald-300 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 print:text-emerald-800">
                <Building2 className="w-4 h-4 text-emerald-600" />
                금융감독원 전자공시(DART) 공식 확인 팩트
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-700 print:text-slate-800">
                <div><span className="text-slate-500">법인명:</span> {person.dartInfo.stockName}</div>
                <div><span className="text-slate-500">등기 직위:</span> {person.dartInfo.registeredRole}</div>
                <div><span className="text-slate-500">검증 기준일:</span> {person.dartInfo.verifiedAt}</div>
                <div><span className="text-slate-500">등기 여부:</span> {person.dartInfo.isPublicDirector ? '사내/사외 등기' : '미등기 임원'}</div>
              </div>
            </div>
          )}

          {/* 전략 섹션 1: 미팅 아이스브레이킹 추천 화두 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 print:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              미팅 성공을 위한 3대 전략적 대화 화두 (Ice-breaking Topics)
            </h3>
            <div className="space-y-2.5">
              {icebreakers.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 print:bg-slate-50 print:border-slate-300 space-y-1 shadow-2xs">
                  <div className="text-xs font-bold text-slate-900 print:text-black flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {item.title}
                  </div>
                  <p className="text-xs text-slate-600 print:text-slate-700 leading-relaxed pl-5">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 전략 섹션 2: 나와의 과거 소통 이력 및 메모 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 print:bg-slate-50 print:border-slate-300 space-y-2 shadow-2xs">
              <div className="text-xs font-bold text-slate-800 print:text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                과거 소통 상태 &amp; 개인 메모
              </div>
              <p className="text-xs text-slate-600 print:text-slate-700 leading-relaxed">
                {person.memo ? person.memo : '등록된 개인 메모가 없습니다.'}
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                마지막 소통일: {person.lastContactDate || '기록 없음'} {person.isStale && '(소통 환기 추천)'}
              </div>
            </div>

            {/* 전략 섹션 3: 공통 출신(알럼나이) 연계 가능 인맥 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 print:bg-slate-50 print:border-slate-300 space-y-2 shadow-2xs">
              <div className="text-xs font-bold text-slate-800 print:text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                공통 회사 출신 알럼나이 지인 ({sharedAlumniPeople.length}명)
              </div>
              {sharedAlumniPeople.length === 0 ? (
                <p className="text-xs text-slate-400 leading-relaxed">
                  현재 등록된 주소록에 동일 회사 출신 지인이 없습니다.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {sharedAlumniPeople.map(p => (
                    <div key={p.id} className="text-xs text-slate-600 print:text-slate-700 flex items-center justify-between">
                      <span className="font-semibold text-slate-900 print:text-black">{p.name}</span>
                      <span className="text-[11px] text-slate-500 print:text-slate-600">{p.currentCompany} · {p.currentTitle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 전략 섹션 4: 미팅 시 주의 및 유의사항 */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 print:bg-amber-50 print:text-amber-900 print:border-amber-300 flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">미팅 주의사항:</span>
              <p className="text-[11px] leading-relaxed text-amber-800 print:text-amber-900">
                상장사 임원 또는 핵심 직무자의 경우 내부 미공개 정보에 대한 직접적 질문은 지양하고, 거시적인 산업 발전 및 상호 협력 가능성 중심의 아젠다로 미팅을 리드하는 것이 바람직합니다.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
