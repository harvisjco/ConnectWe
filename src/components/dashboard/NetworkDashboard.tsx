import React, { useEffect, useRef, useMemo } from 'react';
import { Person } from '../../types/network';
import { getTopSuperConnectors } from '../../services/centralityEngine';
import { identifyTalentCluster, TalentClusterId } from '../../services/talentClusterEngine';
import { X, TrendingUp, Users, Shield, AlertTriangle, Zap, Sparkles, Rocket, Cpu, Briefcase, Building2 } from 'lucide-react';

interface NetworkDashboardProps {
  people: Person[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
}

// Canvas 도넛 차트 그리기
function drawDonut(
  canvas: HTMLCanvasElement,
  data: { label: string; value: number; color: string }[]
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, W, H);
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) / 2 - 10;
  const r = R * 0.58;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;
  for (const d of data) {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    startAngle += slice;
  }

  // 도넛 구멍
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // 중앙 텍스트
  ctx.fillStyle = '#f1f5f9';
  ctx.font = `bold ${Math.round(R * 0.28)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(total), cx, cy - 6);
  ctx.font = `${Math.round(R * 0.14)}px sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('명', cx, cy + R * 0.22);
}

export const NetworkDashboard: React.FC<NetworkDashboardProps> = ({
  people,
  onClose,
  onSelectPerson,
}) => {
  const donutDomainRef = useRef<HTMLCanvasElement>(null);
  const donutTitleRef = useRef<HTMLCanvasElement>(null);

  // 산업군(primaryDomain) 분포
  const domainDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of people) {
      if (p.closeness === 1) continue;
      map.set(p.primaryDomain, (map.get(p.primaryDomain) ?? 0) + 1);
    }
    const colors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
  }, [people]);

  // 직급 분포
  const titleDist = useMemo(() => {
    const buckets: Record<string, number> = { '대표/CEO': 0, '임원/VP': 0, '팀장/부장': 0, '실무진': 0 };
    for (const p of people) {
      if (p.closeness === 1) continue;
      const t = p.currentTitle;
      if (/대표|CEO|사장|회장/i.test(t)) buckets['대표/CEO']++;
      else if (/부사장|전무|상무|이사|VP|CTO|CFO|CPO|CDO/i.test(t)) buckets['임원/VP']++;
      else if (/팀장|부장|수석|책임/i.test(t)) buckets['팀장/부장']++;
      else buckets['실무진']++;
    }
    const colors = ['#a855f7','#6366f1','#3b82f6','#94a3b8'];
    return Object.entries(buckets).map(([label, value], i) => ({ label, value, color: colors[i] }));
  }, [people]);

  // 소통 활성도 통계
  const contactStats = useMemo(() => {
    const now = Date.now();
    const DAY = 86400000;
    let d30 = 0, d90 = 0, d180 = 0, stale = 0;
    for (const p of people) {
      if (p.closeness === 1 || !p.lastContactDate) continue;
      const diff = now - new Date(p.lastContactDate).getTime();
      if (diff <= 30 * DAY) d30++;
      else if (diff <= 90 * DAY) d90++;
      else if (diff <= 180 * DAY) d180++;
      else stale++;
    }
    return { d30, d90, d180, stale };
  }, [people]);

  const dartVerified = useMemo(() => people.filter((p) => p.dartInfo).length, [people]);
  const superConnectors = useMemo(() => getTopSuperConnectors(people, 5), [people]);
  const total = people.filter((p) => p.closeness !== 1).length;

  // 5대 인재 클러스터 (Superpower Edge) 분포
  const clusterDist = useMemo(() => {
    const counts: Record<TalentClusterId, number> = {
      VENTURE_LEADER: 0,
      TECH_FELLOW: 0,
      INVESTOR_PARTNER: 0,
      LISTED_EXECUTIVE: 0,
      CORE_SPECIALIST: 0,
    };

    for (const p of people) {
      if (p.closeness === 1) continue;
      const profile = identifyTalentCluster(p);
      if (counts[profile.id] !== undefined) {
        counts[profile.id]++;
      }
    }

    return [
      {
        id: 'VENTURE_LEADER' as TalentClusterId,
        label: '어자일 벤처 리더',
        count: counts.VENTURE_LEADER,
        icon: Rocket,
        accent: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        badge: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
        superpower: '풀스콥 실행력 & 기동성'
      },
      {
        id: 'TECH_FELLOW' as TalentClusterId,
        label: '딥테크 R&D 펠로우',
        count: counts.TECH_FELLOW,
        icon: Cpu,
        accent: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        badge: 'bg-sky-950/60 text-sky-300 border-sky-500/30',
        superpower: '원천 기술 & 아키텍처'
      },
      {
        id: 'INVESTOR_PARTNER' as TalentClusterId,
        label: '전략 투자 파트너',
        count: counts.INVESTOR_PARTNER,
        icon: Briefcase,
        accent: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
        superpower: '자본 레버리지 & 거시 통찰'
      },
      {
        id: 'LISTED_EXECUTIVE' as TalentClusterId,
        label: '상장사 거버넌스 리더',
        count: counts.LISTED_EXECUTIVE,
        icon: Building2,
        accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
        superpower: 'DART 실공시 공적 책임'
      },
      {
        id: 'CORE_SPECIALIST' as TalentClusterId,
        label: '프로덕트 스페셜리스트',
        count: counts.CORE_SPECIALIST,
        icon: Sparkles,
        accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30',
        superpower: '현장 실무 빌딩 & 실행력'
      }
    ];
  }, [people]);

  useEffect(() => {
    if (donutDomainRef.current) drawDonut(donutDomainRef.current, domainDist);
  }, [domainDist]);

  useEffect(() => {
    if (donutTitleRef.current) drawDonut(donutTitleRef.current, titleDist);
  }, [titleDist]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">인맥 포트폴리오 대시보드</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">총 {total}명</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI 카드 4종 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={<Users className="w-4 h-4 text-indigo-400" />} label="전체 인맥" value={`${total}명`} sub="직접 연결 인맥" />
            <KpiCard icon={<Shield className="w-4 h-4 text-emerald-400" />} label="DART 검증" value={`${dartVerified}명`} sub={`검증률 ${total ? Math.round((dartVerified / total) * 100) : 0}%`} accent="emerald" />
            <KpiCard icon={<TrendingUp className="w-4 h-4 text-amber-400" />} label="최근 30일 소통" value={`${contactStats.d30}명`} sub="활성 인맥" accent="amber" />
            <KpiCard icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} label="소통 환기 필요" value={`${contactStats.stale}명`} sub="180일+ 미소통" accent="rose" />
          </div>

          {/* 5대 인재 클러스터 (Superpower Edge) 포트폴리오 */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  5대 인재 클러스터 고유 강점(Superpower Edge) 포트폴리오
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                상장사 공시부터 스타트업·딥테크까지 각 인재의 특화 가치 동등 조명
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {clusterDist.map((item) => {
                const Icon = item.icon;
                const ratio = total ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/70 hover:border-slate-600 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-1.5 rounded-lg border ${item.accent}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {ratio}%
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-lg font-extrabold text-white font-mono mt-0.5">
                        {item.count}<span className="text-xs font-normal text-slate-400 ml-0.5">명</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 leading-tight block">
                        {item.superpower}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 산업군 도넛 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">산업군 분포</h3>
              <div className="flex items-center gap-4">
                <canvas ref={donutDomainRef} className="w-28 h-28 flex-shrink-0" />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  {domainDist.slice(0, 6).map((d) => (
                    <div key={d.label} className="flex items-center gap-1.5 text-[11px]">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-400 truncate">{d.label}</span>
                      <span className="ml-auto text-slate-300 font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 직급 도넛 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">직급 피라미드</h3>
              <div className="flex items-center gap-4">
                <canvas ref={donutTitleRef} className="w-28 h-28 flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  {titleDist.map((d) => (
                    <div key={d.label} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-slate-400">{d.label}</span>
                        </div>
                        <span className="text-slate-300 font-medium">{d.value}명</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{ width: `${total ? (d.value / total) * 100 : 0}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 소통 활성도 히트맵 스타일 바 */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">소통 활성도 현황</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: '최근 30일', value: contactStats.d30, color: 'bg-emerald-500' },
                { label: '30~90일', value: contactStats.d90, color: 'bg-blue-500' },
                { label: '90~180일', value: contactStats.d180, color: 'bg-amber-500' },
                { label: '180일+', value: contactStats.stale, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.label} className="text-center space-y-2">
                  <div className="text-xl font-bold text-white">{item.value}</div>
                  <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${total ? (item.value / total) * 100 : 0}%`, margin: '0 auto' }} />
                  <div className="text-[11px] text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 핵심 슈퍼 커넥터 (Super Connector) Top 5 */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">네트워크 슈퍼 커넥터 (Super Connector) Top 5</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">매개 중심성 &amp; 핵심 네트워크 허브 지수 기준</span>
            </div>

            <div className="space-y-2">
              {superConnectors.map(({ person, powerScore, tierLabel, sameCompanyCount, alumniReachCount }, i) => (
                <button
                  key={person.id}
                  onClick={() => { onSelectPerson(person); onClose(); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-850 hover:bg-slate-750 border border-slate-700/80 hover:border-indigo-500/50 transition-all text-left group"
                >
                  <span className="text-base font-bold text-slate-500 w-6 text-center">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {person.name}
                      </span>
                      <span className="text-[11px] text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 font-medium">
                        {tierLabel.split(' ')[1]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {person.currentCompany} · {person.currentTitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right text-[11px] text-slate-400 hidden sm:block">
                      <span>사내 {sameCompanyCount}명 · 알럼나이 {alumniReachCount}명</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{powerScore}점</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// KPI 카드 서브컴포넌트
const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose';
}> = ({ icon, label, value, sub, accent = 'indigo' }) => {
  const accentMap: Record<string, string> = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  };
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs font-medium text-slate-300">{label}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
  );
};
