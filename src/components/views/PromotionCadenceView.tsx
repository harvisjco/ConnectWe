import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  PromotionEvent, 
  loadPromotionEvents, 
  savePromotionEvents, 
  getCadenceAlerts, 
  generateCongratulationMessages,
  CongratulationMessagePreset
} from '../../services/promotionRadarService';
import { 
  Award, ShieldCheck, Copy, Check, 
  Clock, AlertTriangle, MessageCircle, 
  ChevronRight, Building2, Gift, Send, ExternalLink
} from 'lucide-react';

interface PromotionCadenceViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenDossier?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const PromotionCadenceView: React.FC<PromotionCadenceViewProps> = ({
  people,
  onSelectPerson,
  onOpenDossier,
  onShowToast
}) => {
  const [promotions, setPromotions] = useState<PromotionEvent[]>(() => loadPromotionEvents(people));
  const [activePromoForMessage, setActivePromoForMessage] = useState<PromotionEvent | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [copiedCadenceId, setCopiedCadenceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'promotions' | 'cadence'>('promotions');

  // 소통 주기 이탈 인맥 목록
  const cadenceAlerts = useMemo(() => {
    return getCadenceAlerts(people);
  }, [people]);

  // 미축하 건수
  const uncelebratedCount = promotions.filter(p => !p.isCongratulated).length;

  // 축하 완료 토글
  const handleToggleCongratulated = (id: string) => {
    const updated = promotions.map(p => {
      if (p.id === id) {
        const nextState = !p.isCongratulated;
        return {
          ...p,
          isCongratulated: nextState,
          congratulatedAt: nextState ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return p;
    });

    setPromotions(updated);
    savePromotionEvents(updated);
    onShowToast('축하 상태가 업데이트되었습니다.');
  };

  // 축전 복사
  const handleCopyMessage = (preset: CongratulationMessagePreset) => {
    navigator.clipboard.writeText(preset.content).then(() => {
      setCopiedType(preset.type);
      onShowToast(`[${preset.title}] 문구가 복사되었습니다.`);
      setTimeout(() => setCopiedType(null), 2500);
    }).catch(() => {
      onShowToast('복사에 실패했습니다.');
    });
  };

  // 안부 핑 복사
  const handleCopyCadencePing = (person: Person, days: number) => {
    const text = `안녕하세요 ${person.name} ${person.currentTitle}님! 
잘 지내고 계신지요? 마지막으로 인사 나눈 지 벌써 ${days}일 가량 지난 것 같습니다. 
요즘 어떻게 지내시는지 궁금하여 안부 여쭙니다. 편하실 때 식사나 커피 한 잔 모시겠습니다! ☕`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedCadenceId(person.id);
      onShowToast(`[${person.name}] 님께 보낼 안부 문구가 복사되었습니다.`);
      setTimeout(() => setCopiedCadenceId(null), 2500);
    }).catch(() => {
      onShowToast('복사에 실패했습니다.');
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header & KPI Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 shrink-0">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">DART 임원 영전·승진 &amp; 골든타임 케어 레이더</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                Executive Promotion &amp; Cadence
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              DART 공시 임원의 승진·대표이사 선임을 조기에 감지하여 영전 화환 및 축전을 신속히 보내고, 장기 미소통 핵심 인맥의 소통 골든타임을 방어합니다.
            </p>
          </div>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400">승진·영전 감지</div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {promotions.length}건 <span className="text-xs text-rose-400 font-normal">({uncelebratedCount}건 미축하)</span>
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400">소통 공백 위험군</div>
            <div className="text-sm font-bold text-rose-400 font-mono">
              {cadenceAlerts.length}명
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'promotions'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>🏆 DART 영전·승진 감지 피드 ({promotions.length})</span>
          {uncelebratedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
              {uncelebratedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cadence')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'cadence'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>⏳ 소통 골든타임 넛지 ({cadenceAlerts.length})</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'promotions' ? (
        /* Promotions Feed */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {promotions.map(promo => {
              const matchedPerson = people.find(p => p.id === promo.personId);

              return (
                <div
                  key={promo.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 shadow-md ${
                    promo.isCongratulated 
                      ? 'bg-slate-900/60 border-slate-800 opacity-80' 
                      : 'bg-slate-900 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Tag & Date */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        promo.promotionType === 'CEO_APPOINTMENT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}>
                        <Award className="w-3 h-3" />
                        {promo.promotionType === 'CEO_APPOINTMENT' ? '대표이사 취임' : '임원 영전·승진'}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{promo.announcedDate}</span>
                    </div>

                    {/* Person Title Transition */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">{promo.personName}</span>
                        {promo.dartRceptNo && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            DART 공시
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{promo.companyName}</span>
                      </div>

                      {/* Transition Path */}
                      <div className="mt-2 p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 line-through">{promo.previousTitle}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300 font-bold">{promo.newTitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Congratulation Button */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`check-${promo.id}`}
                        checked={promo.isCongratulated}
                        onChange={() => handleToggleCongratulated(promo.id)}
                        className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor={`check-${promo.id}`} className="text-[11px] text-slate-400 cursor-pointer select-none">
                        {promo.isCongratulated ? '축하 완료' : '미축하'}
                      </label>
                    </div>

                    <div className="flex items-center gap-1">
                      {matchedPerson && onOpenDossier && (
                        <button
                          onClick={() => onOpenDossier(matchedPerson)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs"
                          title="DART 공시 다면 분석 보고서"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setActivePromoForMessage(promo)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all active:scale-95"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>축전·화환 생성</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Cadence Alerts List */
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>60일 이상 소통이 없었던 1·2촌 핵심 인맥입니다. 관계가 느슨해지기 전에 가벼운 안부를 전달하세요.</span>
            <span className="font-mono text-rose-400 font-bold">{cadenceAlerts.length}명 관리 요망</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cadenceAlerts.map(alert => {
              const isCopied = copiedCadenceId === alert.person.id;

              return (
                <div
                  key={alert.person.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        alert.urgency === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : alert.urgency === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {alert.daysSinceLastContact}일간 무연락
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {alert.person.closeness === 1 ? '1촌(나)' : `${alert.person.closeness}촌`}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-sm">
                          {alert.person.name}
                          <span className="text-slate-400 text-xs ml-1">({alert.person.currentTitle})</span>
                        </div>
                        <button
                          onClick={() => onSelectPerson(alert.person)}
                          className="text-slate-400 hover:text-white"
                          title="상세 열기"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{alert.person.currentCompany}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click 안부 핑 복사 */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyCadencePing(alert.person, alert.daysSinceLastContact)}
                      className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 hover:border-rose-400 active:scale-95'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>안부 핑 복사 완료!</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>☕ 안부 핑 1-Click 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Congratulation Message Modal */}
      {activePromoForMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>[{activePromoForMessage.personName} {activePromoForMessage.newTitle}] 영전 축전 생성기</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">상황에 맞는 축하 서신 및 화환 리본 문구를 즉시 복사하여 발송하세요.</p>
              </div>
              <button onClick={() => setActivePromoForMessage(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {generateCongratulationMessages(activePromoForMessage).map(preset => {
                const isCopied = copiedType === preset.type;

                return (
                  <div
                    key={preset.type}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{preset.title}</span>
                      <button
                        onClick={() => handleCopyMessage(preset)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? '복사됨!' : '문구 복사'}</span>
                      </button>
                    </div>

                    <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-300 font-sans whitespace-pre-wrap leading-relaxed text-[11px]">
                      {preset.content}
                    </pre>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  handleToggleCongratulated(activePromoForMessage.id);
                  setActivePromoForMessage(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>발송 및 축하 완료 처리</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
