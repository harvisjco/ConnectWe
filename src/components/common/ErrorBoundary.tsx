import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ConnectWe ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[380px] w-full p-6 flex flex-col items-center justify-center text-center rounded-2xl bg-slate-900/90 border border-rose-500/30 backdrop-blur-md space-y-4 animate-in fade-in duration-200">
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
            <AlertOctagon className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{this.props.fallbackTitle || '컴포넌트 런타임 오류가 방어되었습니다'}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              화면 백화(White-out)를 차단하기 위해 세이프 가드가 즉각 개입했습니다. 아래 버튼으로 뷰를 재시도하거나 페이지를 새로고침할 수 있습니다.
            </p>
          </div>

          {this.state.error && (
            <div className="w-full max-w-md p-3 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-[11px] text-rose-300/90 overflow-x-auto max-h-24">
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>컴포넌트 재시도</span>
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all"
            >
              앱 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
