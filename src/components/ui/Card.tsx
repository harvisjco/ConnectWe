import React from 'react';

export type CardVariant = 'surface' | 'elevated' | 'recessed' | 'interactive';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  surface: 'bg-white border border-slate-200/90 shadow-sm',
  elevated: 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200',
  recessed: 'bg-slate-50 border border-slate-200/80',
  interactive: 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer active:scale-[0.99] transition-all duration-200',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  variant = 'surface',
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface SectionBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}

export const SectionBanner: React.FC<SectionBannerProps> = ({
  icon,
  title,
  badge,
  description,
  actions,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-3.5">
        {icon && (
          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
