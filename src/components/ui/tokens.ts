/**
 * ConnectWe Design System (CW-DS) Design Tokens
 * Apple HIG & Naver Cloud Tech Portal Architecture Standards
 */

export const CW_TOKENS = {
  // Surface Colors
  surface: {
    base: 'bg-[#f8fafc]',
    white: 'bg-white',
    subtle: 'bg-slate-50',
    recessed: 'bg-slate-100',
    elevated: 'bg-white shadow-sm',
    hover: 'hover:bg-slate-50/80',
  },

  // Border Colors
  border: {
    subtle: 'border-slate-100',
    default: 'border-slate-200',
    strong: 'border-slate-300',
    focus: 'border-indigo-500',
  },

  // Typography Colors
  text: {
    primary: 'text-slate-900',
    secondary: 'text-slate-600',
    muted: 'text-slate-400',
    brand: 'text-indigo-600',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
    sky: 'text-sky-700',
  },

  // Rounded Radius
  radius: {
    card: 'rounded-2xl',
    cardInner: 'rounded-xl',
    button: 'rounded-xl',
    pill: 'rounded-full',
    tag: 'rounded-md',
  },

  // Interactive Standards
  interactive: {
    minTouch: 'min-h-[36px]',
    transition: 'transition-all duration-200',
    activeScale: 'active:scale-95',
  },

  // Shadow Standards
  shadow: {
    card: 'shadow-sm',
    cardHover: 'hover:shadow-md',
    elevated: 'shadow-lg',
    modal: 'shadow-2xl',
  },
} as const;
