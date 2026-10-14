import type { ReactNode } from 'react';
import Button from './Button';
import Modal from './Modal';

export interface ConfirmAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  /** Ações além de "Cancelar" (ex.: "Excluir" ou "Substituir" / "Adicionar") */
  actions?: ConfirmAction[];
  cancelLabel?: string;
  onCancel: () => void;
}

/** Janela de confirmação reutilizável (também será usada no "Encerrar Gincana") */
export default function ConfirmDialog({ title, message, actions = [], cancelLabel = 'Cancelar', onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          {/* O foco começa em "Cancelar" para que um Enter acidental não confirme uma ação destrutiva */}
          <Button autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant ?? 'primary'} onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </>
      }
    >
      <div className="space-y-2 text-sm leading-relaxed text-emerald-50/90">{message}</div>
    </Modal>
  );
}
