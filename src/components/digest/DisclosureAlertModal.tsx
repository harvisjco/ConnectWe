import React, { useMemo } from 'react';
import { Person } from '../../types/network';
import { getDisclosureAlertsForNetwork, DisclosureAlert } from '../../services/dartDisclosureAlertService';
import { 
  Bell, Building2, Sparkles, X, ChevronRight, 
  UserCheck
} from 'lucide-react';

interface DisclosureAlertModalProps {
  people: Person[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const DisclosureAlertModal: React.FC<DisclosureAlertModalProps> = ({
  people,
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const alerts = useMemo(() => getDisclosureAlertsForNetwork(people), [people]);

  const handleCopyAlertAction = (alert: DisclosureAlert) => {
    const text = `[DART 공시 알림] ${alert.corpName} - ${alert.reportName}\n요약: ${alert.summary}\n추천 액션: ${alert.recommendedAction}`;
    navigator.clipboard.writeText(text);
    onShowToast(`${alert.corpName} 공시 대응 액션 노트가 복사되었습니다.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>DART 기업 공시 실시간 변동 알림 봇</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                  인맥 기업 자동 모니터링
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                내 인맥이 소속된 상장사의 최신 공시 변동(조직개편, 대표이사 변경, 실적 공시)을 감지합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                    alert.importance === 'HIGH'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {alert.importance === 'HIGH' ? '중요 공시' : '일반 변동'}
                  </span>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{alert.corpName}</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">{alert.disclosureDate}</span>
              </div>

              {/* Title & Summary */}
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{alert.reportName}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.summary}</p>
              </div>

              {/* Affected People in Network */}
              {alert.affectedPeople.length > 0 && (
                <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>영향을 받는 내 인맥 ({alert.affectedPeople.length}명):</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {alert.affectedPeople.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPerson(p);
                          onClose();
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <span>{p.name} ({p.currentTitle})</span>
                        <ChevronRight className="w-2.5 h-2.5 text-indigo-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommended Action */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{alert.recommendedAction}</span>
                </div>
                <button
                  onClick={() => handleCopyAlertAction(alert)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors shrink-0 ml-2"
                >
                  액션 복사
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
