import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'chip';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  active?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm shadow-indigo-600/20 disabled:opacity-50',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 font-semibold',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm font-semibold',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium',
  danger: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold',
  chip: 'rounded-full font-medium transition-colors',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs min-h-[32px] rounded-lg',
  md: 'px-3.5 py-2 text-xs font-semibold min-h-[36px] rounded-xl',
  lg: 'px-4 py-2.5 text-sm font-bold min-h-[42px] rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  active = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // 필터 칩(Chip) 전용 상태 처리
  if (variant === 'chip') {
    const chipActiveStyle = active 
      ? 'bg-indigo-600 text-white shadow-sm' 
      : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm';

    return (
      <button
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium min-h-[34px] transition-all duration-200 active:scale-95 whitespace-nowrap shrink-0 ${chipActiveStyle} ${className}`}
        {...props}
      >
        {icon}
        {children && <span>{children}</span>}
      </button>
    );
  }

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 whitespace-nowrap shrink-0 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon}
      {children && <span>{children}</span>}
    </button>
  );
};
