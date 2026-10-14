import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'light' | 'lightGhost' | 'highlight';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ipb-primary hover:bg-ipb-medium border-ipb-light/40 text-white',
  secondary: 'bg-white/5 hover:bg-white/10 border-ipb-medium/50 text-ipb-light',
  danger: 'bg-red-700/80 hover:bg-red-600 border-red-400/50 text-white',
  ghost: 'bg-transparent hover:bg-white/10 border-transparent text-ipb-light',
  // Variações de alto contraste usadas no cabeçalho das telas
  light: 'bg-white/5 hover:bg-white/15 border-emerald-300/70 text-white',
  lightGhost: 'bg-transparent hover:bg-white/15 border-transparent text-white',
  highlight: 'bg-white hover:bg-emerald-50 border-ipb-dark text-ipb-dark',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = 'secondary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
