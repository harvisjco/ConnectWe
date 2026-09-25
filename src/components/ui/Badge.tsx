import React from 'react';
import { ShieldCheck } from 'lucide-react';

export type BadgeVariant = 
  | 'default' 
  | 'dart' 
  | 'closeness' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'brand' 
  | 'sky';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  closeness?: number;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  dart: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
  closeness: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-medium',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
  danger: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  brand: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
  sky: 'bg-sky-50 text-sky-700 border-sky-200 font-semibold',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  closeness,
  icon,
  children,
  className = '',
  ...props
}) => {
  // 촌수 전용 렌더링
  if (closeness !== undefined) {
    const label = closeness === 1 ? '1촌' : closeness === 2 ? '2촌' : `${closeness}촌`;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${variantStyles.closeness} ${className}`}
        {...props}
      >
        {label}
      </span>
    );
  }

  // DART 공시임원 전용 배지
  if (variant === 'dart') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${variantStyles.dart} font-mono ${className}`}
        {...props}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>{children || 'DART 공시'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border font-mono ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
