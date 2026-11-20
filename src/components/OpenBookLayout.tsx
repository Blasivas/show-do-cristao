import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface PrimaryAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface OpenBookLayoutProps {
  title: string;
  onBack: () => void;
  actions?: ReactNode;
  primaryAction?: PrimaryAction;
  toolbar?: ReactNode;
  pagesOverlay?: ReactNode;
  pagesBusy?: boolean;
  children: ReactNode;
}

/** Estrutura visual comum das telas em Bíblia aberta; as ações pertencem a cada tela. */
export default function OpenBookLayout({ title, onBack, actions, primaryAction, toolbar, pagesOverlay, pagesBusy = false, children }: OpenBookLayoutProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-gradient-to-b from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9] font-serif text-[#2c1d11] dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503] dark:text-[#ede6d8]">
      <header data-book-screen-header="true" className="z-20 shrink-0 border-b border-[#d5c6b0] bg-white/85 px-4 py-2 text-xs shadow-xs backdrop-blur-xs dark:border-[#2b1b11] dark:bg-[#1b1009]/90">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <BookToolbarButton onClick={onBack} aria-label="Voltar ao menu inicial" title="Voltar ao menu inicial">
              <ArrowLeft className="h-4 w-4" />
            </BookToolbarButton>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-[#d5c6b0] dark:bg-[#3d281a]" />
            <h1 className="truncate text-xs font-bold uppercase tracking-wider text-[#1c120c] dark:text-amber-400/90">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions && <div className="flex items-center gap-2">{actions}</div>}
            {primaryAction && (
              <button
                data-book-primary="true"
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="inline-flex h-8 min-w-[176px] shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-gradient-to-r from-[#8b1e1e] to-[#a62424] px-3.5 text-xs font-bold text-amber-50 shadow-md transition-all hover:brightness-110 active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </button>
            )}
            <div className="ml-1 border-l border-[#d5c6b0] pl-2 dark:border-[#3d281a]">
              <ThemeToggle labelClassName="text-[#73533e] dark:text-amber-200/80 font-medium" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center p-2">
        <div data-open-book="true" className="relative flex h-full min-h-0 w-full max-w-7xl flex-col rounded-2xl border-4 border-[#3a2517] bg-[#1c120c] p-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.5)] transition-colors md:p-2 dark:border-[#2a1a10] dark:bg-[#120b07]">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 z-30 flex h-12 w-3.5 -translate-x-1/2 items-end justify-center rounded-b-xs border-b-2 border-[#d4af37] bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#881337] pb-0.5 shadow-md">
            <span className="h-1 w-1.5 rounded-xs bg-[#d4af37]/80" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#c5a059]/40 bg-[#140b07] p-0.5 dark:border-[#c5a059]/20 dark:bg-[#0b0604]">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-[#faf7f0] text-[#1c1917] shadow-[inset_0_0_80px_rgba(180,160,130,0.3)] dark:bg-[#18130e] dark:text-[#ede6d8] dark:shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
              {toolbar && (
                <div data-book-toolbar="true" className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-[#d5c6b0] bg-[#f3ede2]/65 px-3.5 text-xs text-[#73533e] md:px-5 dark:border-[#382618] dark:bg-[#221a14]/70 dark:text-[#c4b59d]">
                  {toolbar}
                </div>
              )}
              <div data-book-pages="true" aria-busy={pagesBusy} className="relative grid min-h-0 flex-1 grid-cols-2">{children}{pagesOverlay}</div>
            </div>
          </div>
        </div>
      </main>

      <footer data-book-screen-footer="true" className="shrink-0 border-t border-[#3d281a] bg-[#1a100b] px-4 py-1 text-center text-[10.5px] text-amber-200/60 dark:border-[#2b1b11] dark:bg-[#120a06]">
        Show do Cristão • Igreja Presbiteriana do Brasil
      </footer>
    </div>
  );
}

interface BookPageProps {
  title: string;
  subtitle?: string;
  pageNumber: string | number;
  side: 'left' | 'right';
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  inactive?: boolean;
}

/** Folha com cabeçalho, medianiz e rodapé nas mesmas posições em ambas as funções. */
export function BookPage({ title, subtitle, pageNumber, side, footer, children, className, contentClassName, inactive = false }: BookPageProps) {
  const inactiveProps = inactive ? { inert: '' } : {};
  return (
    <section {...inactiveProps} data-book-page={side} className={clsx('relative flex min-h-0 flex-col bg-[#faf7f0] px-3.5 py-2 text-[#1c1917] transition-colors md:px-5 dark:bg-[#18130e] dark:text-[#ede6d8]', side === 'left' && 'border-r-2 border-[#d5c6b0] dark:border-[#382618]', className)}>
      <div aria-hidden="true" className={clsx('pointer-events-none absolute inset-y-0 w-16', side === 'left' ? 'right-0 bg-gradient-to-r from-transparent via-black/[0.04] to-black/[0.14] dark:via-black/[0.15] dark:to-black/[0.5]' : 'left-0 bg-gradient-to-l from-transparent via-black/[0.04] to-black/[0.14] dark:via-black/[0.15] dark:to-black/[0.5]')} />
      <div data-book-page-header="true" className="flex h-6 shrink-0 items-center justify-between gap-2 border-b border-[#8b1e1e]/30 pb-1 text-[10px] uppercase tracking-wider text-[#665040] dark:border-[#c5a059]/30 dark:text-[#c4b59d]">
        <span className="truncate font-bold text-[#1c120c] dark:text-[#faf7f0]">{title}</span>
        {subtitle && <span className="truncate italic text-[#73533e] dark:text-[#bdae9c]">{subtitle}</span>}
        <span className="shrink-0">PÁG. {pageNumber}</span>
      </div>
      <div data-book-content="true" className={clsx('flex min-h-0 flex-1 flex-col py-1', contentClassName)}>{children}</div>
      <div data-book-page-footer="true" className="flex h-6 shrink-0 items-center justify-between gap-2 border-t border-[#d5c6b0] pt-1 text-[11px] text-[#73533e] dark:border-[#382618] dark:text-[#a89682]">
        {footer ?? <><span>{title}</span><span>Página {pageNumber}</span></>}
      </div>
    </section>
  );
}

export function BookToolbarButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={clsx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d5c6b0] bg-white text-[#73533e] shadow-xs transition-colors hover:bg-[#f5ebd7] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#c5a059]/40 dark:bg-[#2d1d13] dark:text-amber-200 dark:hover:bg-[#3d2719]', className)} {...props} />;
}
