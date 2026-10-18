import type { ReactNode } from 'react';
import clsx from 'clsx';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Janela sobreposta no estilo Caderno de Escriba / Bíblia. Esc ou clique fora fecham. */
export default function Modal({ title, onClose, children, footer, className }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-xs font-serif"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border-2 border-[#c5a059]/60 bg-[#faf6ee] text-[#1c1917] dark:bg-[#1a1410] dark:text-[#ede6d8] dark:border-[#c5a059]/50 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-[#c5a059]/40 bg-[#f3ece0] dark:bg-[#231b15] dark:border-[#3d2a1d] px-6 py-3.5">
          <h2 className="text-base font-serif font-bold tracking-wide text-[#1c1917] dark:text-[#f5efe4] flex items-center gap-2">
            <span className="text-[#8b1e1e] dark:text-[#f87171] font-bold text-lg">§</span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#5c4738] hover:bg-black/10 hover:text-[#1c1917] dark:text-[#a89682] dark:hover:bg-white/10 dark:hover:text-amber-200 transition-colors"
            title="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2.5 border-t border-[#c5a059]/30 bg-[#f3ece0] dark:bg-[#231b15] dark:border-[#3d2a1d] px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
