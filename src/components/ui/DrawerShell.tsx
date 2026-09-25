import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

const widthStyles = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const DrawerShell: React.FC<DrawerShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  children,
  footer,
  width = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`relative w-full ${widthStyles[width]} bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="닫기 (ESC)"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700">
          {children}
        </div>

        {/* Bottom Bar / Footer */}
        {footer && (
          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
