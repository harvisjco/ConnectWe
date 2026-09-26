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
  Clock, MessageCircle, 
  ChevronRight, Building2, Gift, Send,
  List, LayoutGrid, ArrowRight
} from 'lucide-react';
import { ViewHeader } from '../ui';

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
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
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
요즘 어떻게 지내시는지 궁금하여 안부 여쭙니다. 편하실 때 식사나 커피 한 잔 모시겠습니다!`;

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
      {/* 1. Standardized Header */}
      <ViewHeader
        icon={Award}
        title="DART 임원 영전·승진 & 골든타임 케어 레이더"
        subtitle="DART 공시 임원의 승진·대표이사 선임을 조기에 축하하고, 소통 주기가 도래한 소중한 인맥에 따뜻한 안부를 전할 수 있도록 지원합니다."
        englishTag="Executive Promotion & Cadence"
        actions={
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 font-mono">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">승진·영전 감지</div>
              <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                {promotions.length}건 <span className="text-[11px] text-rose-600 dark:text-rose-400 font-normal">({uncelebratedCount}건 미축하)</span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">소통 환기 추천</div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                {cadenceAlerts.length}명
              </div>
            </div>
          </div>
        }
      />

      {/* 2. Sub-Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'promotions'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>DART 영전·승진 감지 피드 ({promotions.length})</span>
            {uncelebratedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[11px] font-mono font-bold">
                {uncelebratedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cadence')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'cadence'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>소통 환기 추천 ({cadenceAlerts.length})</span>
          </button>
        </div>

        {activeTab === 'promotions' && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-end sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              title="리스트 테이블 뷰"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">리스트</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              title="카드 뷰"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'card'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">카드</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'promotions' ? (
        /* Promotions Feed */
        viewMode === 'table' ? (
          /* High-Density Table View */
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3.5">공시 발표일</th>
                    <th className="py-2.5 px-3">인재 성명 / 기업</th>
                    <th className="py-2.5 px-3">영전 구분</th>
                    <th className="py-2.5 px-3">직위 변동</th>
                    <th className="py-2.5 px-3">축하 상태</th>
                    <th className="py-2.5 px-3 text-right">화환 & 축전 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {promotions.map(promo => {
                    const matchedPerson = people.find(p => p.id === promo.personId);

                    return (
                      <tr
                        key={promo.id}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          promo.isCongratulated ? 'opacity-80 bg-slate-50/30' : ''
                        }`}
                      >
                        {/* 1. Date */}
                        <td className="py-3 px-3.5 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                          {promo.announcedDate}
                        </td>

                        {/* 2. Person & Company */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div 
                            onClick={() => matchedPerson && (onOpenDossier ? onOpenDossier(matchedPerson) : onSelectPerson(matchedPerson))}
                            className="cursor-pointer group flex items-center gap-1.5"
                          >
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {promo.personName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({promo.companyName})
                            </span>
                            {promo.dartRceptNo && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                        </td>

                        {/* 3. Promotion Type */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 border ${
                            promo.promotionType === 'CEO_APPOINTMENT'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            <Award className="w-3 h-3" />
                            {promo.promotionType === 'CEO_APPOINTMENT' ? '대표이사 취임' : '임원 영전·승진'}
                          </span>
                        </td>

                        {/* 4. Title Transition */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-400 line-through">{promo.previousTitle}</span>
                            <ArrowRight className="w-3 h-3 text-amber-600" />
                            <span className="text-amber-800 font-bold">{promo.newTitle}</span>
                          </div>
                        </td>

                        {/* 5. Congratulated Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleCongratulated(promo.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                              promo.isCongratulated
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                            }`}
                          >
                            {promo.isCongratulated ? '✓ 축하 완료' : '● 미축하'}
                          </button>
                        </td>

                        {/* 6. Action Button */}
                        <td className="py-3 px-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => setActivePromoForMessage(promo)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-all active:scale-95"
                          >
                            <Gift className="w-3 h-3 text-amber-300" />
                            <span>축전·화환 생성</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Compact Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {promotions.map(promo => {
              const matchedPerson = people.find(p => p.id === promo.personId);

              return (
                <div
                  key={promo.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-2xs ${
                    promo.isCongratulated 
                      ? 'bg-slate-50/60 border-slate-200 opacity-80' 
                      : 'bg-white border-amber-200 hover:border-amber-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        promo.promotionType === 'CEO_APPOINTMENT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <Award className="w-3 h-3" />
                        {promo.promotionType === 'CEO_APPOINTMENT' ? '대표이사 취임' : '임원 영전·승진'}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{promo.announcedDate}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span 
                          onClick={() => matchedPerson && onSelectPerson(matchedPerson)}
                          className={`text-sm font-bold text-slate-900 ${matchedPerson ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                        >
                          {promo.personName}
                        </span>
                        {promo.dartRceptNo && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            DART
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{promo.companyName}</span>
                      </div>

                      <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 line-through text-[11px]">{promo.previousTitle}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-amber-800 font-bold">{promo.newTitle}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleCongratulated(promo.id)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      {promo.isCongratulated ? '✓ 축하 완료' : '● 미축하'}
                    </button>

                    <button
                      onClick={() => setActivePromoForMessage(promo)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-all active:scale-95"
                    >
                      <Gift className="w-3.5 h-3.5 text-amber-300" />
                      <span>축전 생성</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Cadence Alerts List */
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs text-slate-600">
            <span>최근 60일 이상 연락을 나누지 못한 소중한 인맥입니다. 편안한 마음으로 가벼운 안부와 응원을 건네보세요.</span>
            <span className="font-mono text-indigo-600 font-bold">{cadenceAlerts.length}명 소통 권장</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cadenceAlerts.map(alert => {
              const isCopied = copiedCadenceId === alert.person.id;

              return (
                <div
                  key={alert.person.id}
                  className="p-4.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3.5 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        alert.urgency === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : alert.urgency === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {alert.daysSinceLastContact}일 경과
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {alert.person.closeness === 1 ? '1촌(나)' : `${alert.person.closeness}촌`}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-sm">
                          {alert.person.name}
                          <span className="text-slate-500 text-xs ml-1 font-normal">({alert.person.currentTitle})</span>
                        </div>
                        <button
                          onClick={() => onSelectPerson(alert.person)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="상세 열기"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{alert.person.currentCompany}</span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click 안부 핑 복사 */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyCadencePing(alert.person, alert.daysSinceLastContact)}
                      className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs min-h-[36px] active:scale-[0.98] ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>안부 문구 복사 완료</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>정중한 안부 인사 복사</span>
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
        <div 
          onClick={() => setActivePromoForMessage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>[{activePromoForMessage.personName} {activePromoForMessage.newTitle}] 영전 축전 생성기</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">상황에 맞는 축하 서신 및 화환 리본 문구를 즉시 복사하여 발송하세요.</p>
              </div>
              <button 
                onClick={() => setActivePromoForMessage(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {generateCongratulationMessages(activePromoForMessage).map(preset => {
                const isCopied = copiedType === preset.type;

                return (
                  <div
                    key={preset.type}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-800 text-xs">{preset.title}</span>
                      <button
                        onClick={() => handleCopyMessage(preset)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? '복사됨!' : '문구 복사'}</span>
                      </button>
                    </div>

                    <pre className="p-3 rounded-xl bg-white border border-slate-200/80 text-slate-700 font-sans whitespace-pre-wrap leading-relaxed text-xs">
                      {preset.content}
                    </pre>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  handleToggleCongratulated(activePromoForMessage.id);
                  setActivePromoForMessage(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
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
