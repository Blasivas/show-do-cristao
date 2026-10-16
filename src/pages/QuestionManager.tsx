import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import type { Difficulty, Question } from '@/types/game';
import { appendQuestions, upsertQuestion } from '@/game/questions';
import { createQuestionStorage, errorMessage, getDefaultQuestions } from '@/services/questionStorage';
import ConfirmDialog, { type ConfirmAction } from '@/components/ConfirmDialog';
import QuestionForm from '@/components/QuestionForm';
import BibleLayout from '@/components/BibleLayout';
import { DIFFICULTY_ORDER } from '@/components/difficulty';

type Filter = Difficulty | 'todas';

type FormState = { question?: Question; key: number } | null;

interface Confirmation {
  title: string;
  message: ReactNode;
  actions: ConfirmAction[];
}

type Toast = { kind: 'success' | 'error'; text: string } | null;

type LoadState = { status: 'loading' } | { status: 'ok' } | { status: 'invalid'; error: string };

const storage = createQuestionStorage(window.showDoCristao.questions);

export default function QuestionManager({ onBack }: { onBack: () => void }) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<Filter>('todas');
  const [form, setForm] = useState<FormState>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const notify = (kind: 'success' | 'error', text: string) => setToast({ kind, text });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.kind === 'error' ? 6000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const reload = useCallback(async () => {
    setLoad({ status: 'loading' });
    try {
      const result = await storage.load();
      if (result.status === 'invalid') return setLoad(result);
      setQuestions(result.questions);
      setLoad({ status: 'ok' });
    } catch (error) {
      setLoad({ status: 'invalid', error: errorMessage(error) });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Atualiza a lista e grava no arquivo */
  const persist = async (next: Question[], successText: string) => {
    setQuestions(next);
    try {
      await storage.save(next);
      notify('success', successText);
    } catch (error) {
      notify('error', `Não foi possível salvar: ${errorMessage(error)}`);
    }
  };

  const replaceAll = async (next: Question[], successText: string) => {
    setConfirmation(null);
    try {
      const { questions: saved, backupPath } = await storage.replace(next);
      setQuestions(saved);
      notify(
        'success',
        backupPath
          ? `${successText} (backup criado na mesma pasta)`
          : successText,
      );
    } catch (error) {
      notify('error', `Não foi possível substituir: ${errorMessage(error)}`);
    }
  };

  const askRestore = () => {
    setConfirmation({
      title: 'Restaurar perguntas padrão?',
      message:
        'O arquivo perguntas.json atual será substituído pelas 20 perguntas originais da gincana. Uma cópia de segurança do arquivo atual será criada.',
      actions: [
        {
          label: 'Restaurar',
          variant: 'danger',
          onClick: () => {
            void replaceAll(getDefaultQuestions(), 'Perguntas padrão restauradas.');
          },
        },
      ],
    });
  };

  const askDelete = (q: Question, number: number) => {
    setConfirmation({
      title: `Excluir pergunta ${number}?`,
      message: (
        <>
          <p className="font-medium text-[#1c1917] font-serif">“{q.text}”</p>
          <p className="text-xs text-[#5c4738] font-serif">Essa ação não pode ser desfeita diretamente pelo app.</p>
        </>
      ),
      actions: [
        {
          label: 'Excluir',
          variant: 'danger',
          onClick: () => {
            setConfirmation(null);
            void persist(
              questions.filter((item) => item.id !== q.id),
              'Pergunta excluída.',
            );
          },
        },
      ],
    });
  };

  const onSaveQuestion = (saved: Question, addAnother: boolean) => {
    const isEdit = Boolean(form?.question);
    const next = upsertQuestion(questions, saved);
    void persist(next, isEdit ? 'Pergunta atualizada.' : 'Pergunta adicionada.');
    setForm(addAnother ? { key: Date.now() } : null);
  };

  const handleImport = async () => {
    try {
      const imported = await storage.importFile();
      if (!imported) return; // cancelado pelo usuário
      const count = imported.length;
      const valid = imported;

      setConfirmation({
        title: `Importar ${count} ${count === 1 ? 'pergunta' : 'perguntas'}?`,
        message: (
          <div className="space-y-2 text-xs text-[#5c4738] font-serif">
            <p>Escolha como deseja aplicar as perguntas importadas:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-[#1c1917]">Adicionar às existentes:</strong> acrescenta as perguntas novas ao final de cada nível de dificuldade.
              </li>
              <li>
                <strong className="text-[#1c1917]">Substituir todas:</strong> substitui o banco atual pelas importadas (com backup automático).
              </li>
            </ul>
          </div>
        ),
        actions: [
          {
            label: 'Substituir todas',
            variant: 'danger',
            onClick: () => {
              void replaceAll(valid, `${count} perguntas importadas.`);
            },
          },
          {
            label: 'Adicionar às existentes',
            variant: 'primary',
            onClick: () => {
              setConfirmation(null);
              void persist(
                appendQuestions(questions, valid),
                `${count} perguntas adicionadas ao banco.`,
              );
            },
          },
        ],
      });
    } catch (error) {
      notify('error', `Não foi possível importar: ${errorMessage(error)}`);
    }
  };

  const handleExport = async () => {
    try {
      if (await storage.exportFile(questions)) notify('success', 'Perguntas exportadas com sucesso.');
    } catch (error) {
      notify('error', `Não foi possível exportar: ${errorMessage(error)}`);
    }
  };

  const openFolder = () =>
    window.showDoCristao.questions
      .openFolder()
      .catch((error) => notify('error', `Não foi possível abrir a pasta: ${errorMessage(error)}`));

  const counts = useMemo(
    () =>
      Object.fromEntries(
        DIFFICULTY_ORDER.map((d) => [d, questions.filter((q) => q.difficulty === d).length]),
      ) as Record<Difficulty, number>,
    [questions],
  );

  const visible = questions
    .map((q, i) => ({ q, number: i + 1 }))
    .filter(({ q }) => filter === 'todas' || q.difficulty === filter);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Visualização Canônica no Estilo Bíblia Sagrada */}
      <BibleLayout
        onBack={onBack}
        load={load}
        questions={questions}
        visible={visible}
        filter={filter}
        counts={counts}
        setFilter={setFilter}
        onOpenFolder={openFolder}
        onImport={handleImport}
        onExport={handleExport}
        onRestore={askRestore}
        onNewQuestion={() => setForm({ key: Date.now() })}
        onEditQuestion={(q) => setForm({ question: q, key: Date.now() })}
        onDeleteQuestion={askDelete}
        onReload={reload}
      />

      {/* Formulário Modal de Criação / Edição de Versículo */}
      {form && (
        <QuestionForm
          key={form.key}
          question={form.question}
          number={
            form.question
              ? questions.findIndex((q) => q.id === form.question?.id) + 1
              : undefined
          }
          onSave={onSaveQuestion}
          onClose={() => setForm(null)}
        />
      )}

      {/* Janela de Confirmação Canônica */}
      {confirmation && (
        <ConfirmDialog
          title={confirmation.title}
          message={confirmation.message}
          actions={confirmation.actions}
          onCancel={() => setConfirmation(null)}
        />
      )}

      {/* Toast de Notificação */}
      {toast && (
        <aside
          role="status"
          className={clsx(
            'fixed bottom-6 right-6 z-50 rounded-xl px-4 py-2.5 text-xs font-serif font-bold shadow-2xl border transition-all animate-bounce',
            toast.kind === 'success'
              ? 'border-[#c5a059] bg-[#1a2e1d] text-emerald-200'
              : 'border-[#8b1e1e] bg-[#2d1212] text-rose-200',
          )}
        >
          {toast.text}
        </aside>
      )}
    </div>
  );
}
