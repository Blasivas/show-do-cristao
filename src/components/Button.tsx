import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'light' | 'lightGhost' | 'highlight' | 'gold';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[#8b1e1e] hover:bg-[#a62424] text-amber-50 border-amber-900/60 shadow-md font-serif font-bold',
  secondary:
    'bg-[#f4efe4] hover:bg-[#e9ded0] border-[#d4c5ae] text-[#3d2f26] font-serif font-semibold shadow-xs',
  danger:
    'bg-[#7f1d1d] hover:bg-[#991b1b] border-[#991b1b] text-white font-serif font-bold shadow-xs',
  ghost:
    'bg-transparent hover:bg-black/10 border-transparent text-[#5c4738] hover:text-[#1c1917] font-serif',
  light:
    'bg-[#f4efe4] hover:bg-[#e9ded0] border-[#d4c5ae] text-[#3d2f26] font-serif font-semibold shadow-xs',
  lightGhost:
    'bg-transparent hover:bg-black/10 border-transparent text-[#5c4738] hover:text-[#1c1917] font-serif',
  highlight:
    'bg-[#8b1e1e] hover:bg-[#a62424] text-amber-50 border-amber-900/60 shadow-md font-serif font-bold',
  gold:
    'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-amber-950 border-amber-400 font-serif font-bold shadow-md',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = 'secondary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-98',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
