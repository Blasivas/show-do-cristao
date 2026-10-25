import { Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={clsx('inline-flex items-center justify-end gap-2 font-serif text-xs shrink-0 w-[124px] select-none', className)}>
      <span className={clsx("w-[64px] text-right whitespace-nowrap text-[11px] uppercase tracking-wider font-semibold inline-block shrink-0", labelClassName ? labelClassName : "text-amber-200/80")}>
        {isDark ? 'Noturno' : 'Claro'}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        aria-label={isDark ? 'Alternar para Modo Claro (Papel Marfim)' : 'Alternar para Modo Escuro (Códice Noturno)'}
        title={isDark ? 'Ativar Modo Claro (Papel Marfim)' : 'Ativar Modo Noturno (Códice Escuro)'}
        className={clsx(
          'relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
          isDark
            ? 'border-amber-500/60 bg-[#1e130c]'
            : 'border-[#c5a059]/60 bg-[#2d1d13]',
        )}
      >
        {/* Ícones de guia no fundo */}
        <span className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
          <Sun className={clsx('h-2.5 w-2.5 transition-opacity', isDark ? 'opacity-25 text-amber-400' : 'opacity-0')} />
          <Moon className={clsx('h-2.5 w-2.5 transition-opacity', isDark ? 'opacity-0' : 'opacity-35 text-amber-300')} />
        </span>

        {/* Botão deslizante (Thumb do Switch) */}
        <span
          className={clsx(
            'pointer-events-none inline-flex h-4.5 w-4.5 transform items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-in-out',
            isDark
              ? 'translate-x-6 bg-gradient-to-br from-[#d4af37] to-[#b45309]'
              : 'translate-x-0.5 bg-gradient-to-br from-[#faf7f0] to-[#e8dfce]',
          )}
        >
          {isDark ? (
            <Moon className="h-2.5 w-2.5 fill-current text-[#1c120c]" />
          ) : (
            <Sun className="h-2.5 w-2.5 fill-current text-amber-700" />
          )}
        </span>
      </button>
    </div>
  );
}
