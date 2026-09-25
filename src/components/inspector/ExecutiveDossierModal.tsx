import React, { useRef } from 'react';
import { Person } from '../../types/network';
import { 
  X, Printer, Sparkles, Building2, 
  Clock, ShieldCheck, Lightbulb, AlertTriangle, UserCheck
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

  // AI 화두(Ice-breaker) 생성 로직 (룰 기반 지능형 템플릿)
  const generateIcebreakers = () => {
    const items: { title: string; desc: string; type: 'dart' | 'alumni' | 'domain' }[] = [];

    // 1. DART 공시 기반 화두
    if (person.dartInfo) {
      items.push({
        title: `${person.dartInfo.stockName} 최근 공시 및 경영 현황`,
        desc: `공시 임원(${person.dartInfo.registeredRole})으로 등재되어 있으므로, 최근 회사 사업보고서 및 업계 실적 호조에 대한 축하와 관심으로 대화를 시작하면 신뢰를 얻기 쉽습니다.`,
        type: 'dart'
      });
    }

    // 2. 알럼나이 기반 화두
    const pastCareer = person.careers.find(c => !c.isCurrent);
    if (pastCareer) {
      items.push({
        title: `${pastCareer.companyName} 출신 동문 네트워크`,
        desc: `과거 ${pastCareer.companyName} (${pastCareer.title}) 시절의 주요 동료나 당시 프로젝트 경험을 가볍게 회고하며 친밀감을 형성하기 좋습니다.`,
        type: 'alumni'
      });
    }

    // 3. 전문 도메인 기반 화두
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 모달 상단 툴바 (인쇄 시 숨김) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              1-Page Executive Dossier (미팅 전략 브리핑)
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 font-mono">
              미팅 10분 전 브리핑
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>A4 리포트 인쇄 / PDF 저장</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 인쇄 대상 1-Page Dossier 본문 영역 */}
        <div ref={printRef} className="p-6 md:p-8 space-y-6 overflow-y-auto bg-slate-900 text-slate-100 print:bg-white print:text-black print:p-0 print:m-0">
          
          {/* 헤더 프로필 블록 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-slate-300">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-white print:text-black">
                  {person.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-semibold print:border-slate-400 print:text-slate-800">
                  {person.currentTitle}
                </span>
                {person.dartInfo && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> DART 공시 검증
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-indigo-400 print:text-indigo-800">
                {person.currentCompany} {person.currentDepartment ? `· ${person.currentDepartment}` : ''}
              </p>
              <p className="text-xs text-slate-400 print:text-slate-600">
                전문 분야: <strong className="text-slate-200 print:text-black">{person.primaryDomain}</strong> · 추정 연령대: {person.estimatedAgeGroup}
              </p>
            </div>

            {/* 기본 연락 정보 (미팅 직전 빠른 확인용) */}
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-1 min-w-[200px] print:bg-slate-100 print:border-slate-300">
              <div className="text-[11px] text-slate-400 print:text-slate-600 uppercase font-bold tracking-wider">
                Direct Contact
              </div>
              <div className="font-mono text-white print:text-black font-semibold">{person.mobile}</div>
              <div className="text-slate-300 print:text-slate-700 truncate text-[11px]">{person.email}</div>
            </div>
          </div>

          {/* DART 실공시 팩트 섹션 (있을 경우) */}
          {person.dartInfo && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 print:bg-emerald-50 print:border-emerald-300">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 print:text-emerald-800">
                <Building2 className="w-4 h-4" />
                금융감독원 전자공시(DART) 공식 확인 팩트
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-300 print:text-slate-800">
                <div><span className="text-slate-500 print:text-slate-500">법인명:</span> {person.dartInfo.stockName}</div>
                <div><span className="text-slate-500 print:text-slate-500">등기 직위:</span> {person.dartInfo.registeredRole}</div>
                <div><span className="text-slate-500 print:text-slate-500">검증 기준일:</span> {person.dartInfo.verifiedAt}</div>
                <div><span className="text-slate-500 print:text-slate-500">등기 여부:</span> {person.dartInfo.isPublicDirector ? '사내/사외 등기' : '미등기 임원'}</div>
              </div>
            </div>
          )}

          {/* 전략 섹션 1: 미팅 아이스브레이킹 추천 화두 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              미팅 성공을 위한 3대 전략적 대화 화두 (Ice-breaking Topics)
            </h3>
            <div className="space-y-2.5">
              {icebreakers.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-850/80 border border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-1">
                  <div className="text-xs font-bold text-white print:text-black flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {item.title}
                  </div>
                  <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed pl-5">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 전략 섹션 2: 나와의 과거 소통 이력 및 메모 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-2">
              <div className="text-xs font-bold text-slate-300 print:text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                과거 소통 상태 &amp; 개인 메모
              </div>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                {person.memo ? person.memo : '등록된 개인 메모가 없습니다.'}
              </p>
              <div className="text-[11px] text-slate-500 pt-1">
                마지막 소통일: {person.lastContactDate || '기록 없음'} {person.isStale && '(⚠️ 6개월 이상 소통 단절)'}
              </div>
            </div>

            {/* 전략 섹션 3: 공통 출신(알럼나이) 연계 가능 인맥 */}
            <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-2">
              <div className="text-xs font-bold text-slate-300 print:text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                공통 회사 출신 알럼나이 지인 ({sharedAlumniPeople.length}명)
              </div>
              {sharedAlumniPeople.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">
                  현재 등록된 주소록에 동일 회사 출신 지인이 없습니다.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {sharedAlumniPeople.map(p => (
                    <div key={p.id} className="text-xs text-slate-300 print:text-slate-700 flex items-center justify-between">
                      <span className="font-semibold text-white print:text-black">{p.name}</span>
                      <span className="text-[11px] text-slate-400 print:text-slate-600">{p.currentCompany} · {p.currentTitle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 전략 섹션 4: 미팅 시 주의 및 유의사항 */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 print:bg-amber-50 print:text-amber-900 print:border-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">미팅 주의사항:</span>
              <p className="text-[11px] leading-relaxed text-amber-300/90 print:text-amber-900">
                상장사 임원 또는 핵심 직무자의 경우 내부 미공개 정보에 대한 직접적 질문은 지양하고, 거시적인 산업 발전 및 상호 협력 가능성 중심의 아젠다로 미팅을 리드하는 것이 바람직합니다.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
