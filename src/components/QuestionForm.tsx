import { useState } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import type { Question } from '@/types/game';
import { getPoints } from '@/game/engine';
import {
  LETTERS,
  draftFromQuestion,
  draftToQuestion,
  emptyDraft,
  hasErrors,
  validateDraft,
  type QuestionDraft,
} from '@/game/questions';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import Modal from './Modal';
import { DIFFICULTY_BADGE, DIFFICULTY_LABEL, DIFFICULTY_ORDER } from './difficulty';

interface QuestionFormProps {
  /** Pergunta em edição; ausente = nova pergunta */
  question?: Question;
  /** Número da pergunta em edição (apenas para o título); a posição de uma pergunta nova depende da dificuldade */
  number?: number;
  /** Salva e fecha; com `addAnother`, o formulário é reaberto vazio para a próxima pergunta */
  onSave: (question: Question, addAnother: boolean) => void;
  onClose: () => void;
}

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs font-serif font-bold text-[#8b1e1e]">{message}</p> : null;

const inputClass = (invalid: boolean) =>
  clsx(
    'w-full rounded-lg border px-3 py-2 text-sm font-serif transition-all focus:outline-none focus:ring-2',
    'bg-white border-[#d5c6b0] text-[#1c1917] placeholder:text-[#8c786a] focus:ring-[#8b1e1e] focus:border-[#8b1e1e]',
    invalid && '!border-[#8b1e1e] focus:!ring-[#8b1e1e]',
  );

export default function QuestionForm({ question, number, onSave, onClose }: QuestionFormProps) {
  const initial = question ? draftFromQuestion(question) : emptyDraft();
  const [draft, setDraft] = useState<QuestionDraft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const errors = validateDraft(draft);
  const shown = submitted ? errors : { options: [] as (string | undefined)[] };
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const update = (patch: Partial<QuestionDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setOption = (index: number, value: string) =>
    setDraft((d) => ({ ...d, options: d.options.map((o, i) => (i === index ? value : o)) as QuestionDraft['options'] }));

  const requestClose = () => (isDirty ? setConfirmDiscard(true) : onClose());

  const submit = (addAnother: boolean) => {
    setSubmitted(true);
    if (hasErrors(errors)) return;
    onSave(draftToQuestion(draft, question?.id ?? crypto.randomUUID()), addAnother);
  };

  return (
    <>
      <Modal
        title={question ? `Editar pergunta ${number}` : 'Nova pergunta'}
        onClose={requestClose}
        className="max-w-2xl"
        footer={
          <>
            <Button onClick={requestClose}>Cancelar</Button>
            {!question && <Button onClick={() => submit(true)}>Salvar e adicionar outra</Button>}
            <Button variant="primary" onClick={() => submit(false)}>
              Salvar
            </Button>
          </>
        }
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <div>
            <label htmlFor="question-text" className="mb-1.5 block text-xs font-serif font-bold uppercase tracking-wider text-[#3d2f26]">
              Enunciado do Versículo
            </label>
            <textarea
              id="question-text"
              autoFocus
              rows={3}
              value={draft.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Ex.: Quem construiu a arca para escapar do dilúvio?"
              className={clsx(inputClass(Boolean(shown.text)), 'resize-none')}
            />
            <FieldError message={shown.text} />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-serif font-bold uppercase tracking-wider text-[#3d2f26]">
              Alternativas <span className="font-normal text-[#6b584a] normal-case">(clique na letra para marcar a correta)</span>
            </legend>
            <div className="space-y-2">
              {LETTERS.map((letter, i) => {
                const isCorrect = draft.correctIndex === i;
                return (
                  <div key={letter}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => update({ correctIndex: i })}
                        aria-pressed={isCorrect}
                        aria-label={`Marcar alternativa ${letter} como correta`}
                        title="Marcar como correta"
                        className={clsx(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border font-serif font-bold text-sm transition-all',
                          isCorrect
                            ? 'border-[#15803d] bg-[#15803d] text-white shadow-xs'
                            : 'border-[#d5c6b0] bg-[#f4efe4] text-[#3d2f26] hover:border-[#8b1e1e]',
                        )}
                      >
                        {isCorrect ? <Check className="h-4 w-4 stroke-[3]" /> : letter}
                      </button>
                      <input
                        value={draft.options[i]}
                        onChange={(e) => setOption(i, e.target.value)}
                        placeholder={`Alternativa ${letter}`}
                        aria-label={`Alternativa ${letter}`}
                        className={inputClass(Boolean(shown.options[i]))}
                      />
                    </div>
                    <FieldError message={shown.options[i]} />
                  </div>
                );
              })}
            </div>
            <FieldError message={shown.correct} />
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-xs font-serif font-bold uppercase tracking-wider text-[#3d2f26]">
              Dificuldade <span className="font-normal text-[#6b584a] normal-case">(organizada automaticamente)</span>
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_ORDER.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update({ difficulty: d })}
                  aria-pressed={draft.difficulty === d}
                  className={clsx(
                    'rounded-lg border px-3 py-2 text-xs font-serif font-bold transition-all',
                    DIFFICULTY_BADGE[d],
                    draft.difficulty === d
                      ? 'ring-2 ring-[#8b1e1e] font-bold shadow-xs'
                      : 'opacity-70 hover:opacity-100',
                  )}
                >
                  {DIFFICULTY_LABEL[d]} · {getPoints(d)} pts
                </button>
              ))}
            </div>
            <FieldError message={shown.difficulty} />
          </fieldset>

          {/* Permite salvar com Enter nos campos de alternativa */}
          <button type="submit" hidden />
        </form>
      </Modal>

      {confirmDiscard && (
        <ConfirmDialog
          title="Descartar alterações?"
          message="As alterações feitas nesta pergunta serão perdidas."
          cancelLabel="Continuar editando"
          actions={[{ label: 'Descartar', variant: 'danger', onClick: onClose }]}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </>
  );
}
