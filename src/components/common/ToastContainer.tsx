import React, { useState, useEffect } from 'react';
import { ToastItem, subscribeToToasts, dismissToast } from '../../services/toastQueueService';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((items) => {
      setToasts(items);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div 
      role="region" 
      aria-label="알림 메시지 목록"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in ${
              isSuccess
                ? 'bg-slate-900/95 text-white border-emerald-500/40'
                : isError
                ? 'bg-slate-900/95 text-white border-rose-500/40'
                : isWarning
                ? 'bg-slate-900/95 text-white border-amber-500/40'
                : 'bg-slate-900/95 text-white border-slate-700/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isError && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
              
              <span className="text-xs font-medium text-slate-100 leading-snug break-words">
                {toast.message}
              </span>
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all shrink-0 cursor-pointer"
              title="알림 닫기"
              aria-label="알림 닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
