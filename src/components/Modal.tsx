import type { ReactNode } from 'react';
import clsx from 'clsx';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Janela sobreposta. Esc ou clique fora fecham (apenas a janela do topo, mesmo com janelas aninhadas). */
export default function Modal({ title, onClose, children, footer, className }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
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
          'flex max-h-full w-full max-w-lg flex-col rounded-2xl border border-ipb-medium/40 bg-ipb-darkest shadow-card-dark',
          className,
        )}
      >
        <h2 className="border-b border-ipb-medium/30 px-6 py-4 text-lg font-bold text-white">{title}</h2>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-ipb-medium/30 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
