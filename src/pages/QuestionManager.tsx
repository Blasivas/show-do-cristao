import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, ArrowLeft, Download, FolderOpen, Pencil, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import type { Difficulty, Question } from '@/types/game';
import { LETTERS, appendQuestions, upsertQuestion } from '@/game/questions';
import { createQuestionStorage, errorMessage, getDefaultQuestions } from '@/services/questionStorage';
import Button from '@/components/Button';
import ConfirmDialog, { type ConfirmAction } from '@/components/ConfirmDialog';
import QuestionForm from '@/components/QuestionForm';
import { DIFFICULTY_BADGE, DIFFICULTY_LABEL, DIFFICULTY_ORDER } from '@/components/difficulty';

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
      setLoad({ status: 'ok' });
      notify('success', backupPath ? `${successText} Uma cópia do arquivo anterior foi guardada na pasta das perguntas.` : successText);
    } catch (error) {
      notify('error', `Não foi possível salvar: ${errorMessage(error)}`);
    }
  };

  const handleSave = (question: Question, addAnother: boolean) => {
    const previous = questions.find((q) => q.id === question.id);
    const oldNumber = questions.indexOf(previous!) + 1;
    const next = upsertQuestion(questions, question);
    const number = next.findIndex((q) => q.id === question.id) + 1;
    const label = DIFFICULTY_LABEL[question.difficulty].toLowerCase();
    const text = !previous
      ? `Pergunta adicionada como nº ${number} (${label}).`
      : number !== oldNumber
        ? `Pergunta atualizada e movida da posição ${oldNumber} para a ${number} (${label}).`
        : 'Pergunta atualizada.';
    persist(next, text);
    setForm(addAnother ? { key: Date.now() } : null);
  };

  const askDelete = (question: Question, number: number) =>
    setConfirmation({
      title: `Excluir a pergunta ${number}?`,
      message: <p className="italic">“{question.text}”</p>,
      actions: [
        {
          label: 'Excluir',
          variant: 'danger',
          onClick: () => {
            setConfirmation(null);
            persist(
              questions.filter((q) => q.id !== question.id),
              'Pergunta excluída.',
            );
          },
        },
      ],
    });

  const askRestore = () =>
    setConfirmation({
      title: 'Restaurar as perguntas padrão?',
      message: (
        <>
          <p>As perguntas atuais serão substituídas pelas {getDefaultQuestions().length} perguntas padrão.</p>
          <p>Uma cópia do arquivo atual será guardada na pasta das perguntas.</p>
        </>
      ),
      actions: [{ label: 'Restaurar', variant: 'danger', onClick: () => replaceAll(getDefaultQuestions(), 'Perguntas padrão restauradas.') }],
    });

  const handleImport = async () => {
    let imported: Question[] | null;
    try {
      imported = await storage.importFile();
    } catch (error) {
      return notify('error', `Não foi possível importar: ${errorMessage(error)}`);
    }
    if (!imported) return;
    const count = `${imported.length} pergunta${imported.length === 1 ? '' : 's'}`;
    const replace = () => replaceAll(imported, `${count} importada(s).`);
    if (questions.length === 0) return replace();
    setConfirmation({
      title: `Importar ${count}`,
      message: (
        <>
          <p>
            Deseja adicionar as perguntas importadas às {questions.length} atuais (cada uma entra no final do grupo da sua dificuldade) ou
            substituir todas?
          </p>
          <p>Ao substituir, uma cópia do arquivo atual será guardada na pasta das perguntas.</p>
        </>
      ),
      actions: [
        { label: 'Substituir todas', variant: 'danger', onClick: replace },
        {
          label: 'Adicionar às atuais',
          onClick: () => {
            setConfirmation(null);
            persist(appendQuestions(questions, imported), `${count} adicionada(s).`);
          },
        },
      ],
    });
  };

  const handleExport = async () => {
    try {
      if (await storage.exportFile(questions)) notify('success', 'Perguntas exportadas.');
    } catch (error) {
      notify('error', `Não foi possível exportar: ${errorMessage(error)}`);
    }
  };

  const openFolder = () =>
    window.showDoCristao.questions.openFolder().catch((error) => notify('error', `Não foi possível abrir a pasta: ${errorMessage(error)}`));

  const counts = useMemo(
    () => Object.fromEntries(DIFFICULTY_ORDER.map((d) => [d, questions.filter((q) => q.difficulty === d).length])) as Record<Difficulty, number>,
    [questions],
  );

  // O número exibido é a posição na lista completa (o número que aparecerá no mural), mesmo com filtro
  const visible = questions.map((q, i) => ({ q, number: i + 1 })).filter(({ q }) => filter === 'todas' || q.difficulty === filter);

  return (
    <div className="flex h-full w-full flex-col bg-linear-to-br from-ipb-darkest via-ipb-dark to-ipb-darkest">
      <header className="border-b border-white/40 px-8 py-5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="lightGhost" onClick={onBack} aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-white">Perguntas</h1>
              <p className="text-sm text-white/90">Cadastre, edite e organize as perguntas da gincana.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="light" onClick={openFolder} title="Abrir a pasta onde o arquivo perguntas.json fica salvo">
              <FolderOpen className="h-4 w-4" /> Abrir pasta das perguntas
            </Button>
            {load.status === 'ok' && (
              <>
                <Button variant="light" onClick={handleImport}>
                  <Upload className="h-4 w-4" /> Importar
                </Button>
                <Button variant="light" onClick={handleExport} disabled={questions.length === 0}>
                  <Download className="h-4 w-4" /> Exportar
                </Button>
                <Button variant="light" onClick={askRestore}>
                  <RotateCcw className="h-4 w-4" /> Restaurar padrão
                </Button>
                <Button variant="highlight" onClick={() => setForm({ key: Date.now() })}>
                  <Plus className="h-4 w-4" /> Nova pergunta
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-5xl">
          {load.status === 'loading' && <p className="text-ipb-light">Carregando perguntas…</p>}

          {load.status === 'invalid' && (
            <div className="rounded-2xl border border-red-400/50 bg-red-950/40 p-6">
              <div className="mb-3 flex items-center gap-2 text-lg font-bold text-red-200">
                <AlertTriangle className="h-5 w-5" /> O arquivo de perguntas tem um problema
              </div>
              <p className="mb-1 text-red-100">{load.error}</p>
              <p className="mb-5 text-sm text-red-100/70">
                Corrija o arquivo <strong>perguntas.json</strong> na pasta das perguntas e clique em “Tentar novamente”, ou restaure as perguntas
                padrão (uma cópia do arquivo com problema será guardada).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={openFolder}>
                  <FolderOpen className="h-4 w-4" /> Abrir pasta das perguntas
                </Button>
                <Button onClick={reload}>Tentar novamente</Button>
                <Button variant="danger" onClick={askRestore}>
                  <RotateCcw className="h-4 w-4" /> Restaurar padrão
                </Button>
              </div>
            </div>
          )}

          {load.status === 'ok' && (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrar por dificuldade">
                {(['todas', ...DIFFICULTY_ORDER] as Filter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={filter === f}
                    onClick={() => setFilter(f)}
                    className={clsx(
                      'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
                      filter === f ? 'border-white bg-white text-ipb-dark' : 'border-emerald-300/70 text-white hover:bg-white/15',
                    )}
                  >
                    {f === 'todas' ? `Todas (${questions.length})` : `${DIFFICULTY_LABEL[f]} (${counts[f]})`}
                  </button>
                ))}
              </div>

              {visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ipb-medium/50 p-10 text-center text-ipb-light">
                  {questions.length === 0 ? 'Nenhuma pergunta cadastrada. Clique em “Nova pergunta” para começar.' : 'Nenhuma pergunta com essa dificuldade.'}
                </div>
              ) : (
                <ul className="space-y-3">
                  {visible.map(({ q, number }) => (
                    <li key={q.id} className="flex items-start gap-4 rounded-xl border border-ipb-medium/30 bg-black/20 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ipb-primary text-lg font-black text-white">
                        {number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className={clsx('mb-1 inline-block rounded-sm border px-2 py-0.5 text-xs font-bold', DIFFICULTY_BADGE[q.difficulty])}>
                          {DIFFICULTY_LABEL[q.difficulty]}
                        </span>
                        <p className="font-semibold text-white">{q.text}</p>
                        <p className="mt-1 text-sm text-emerald-200/80">
                          Resposta: {LETTERS[q.correctIndex]}) {q.options[q.correctIndex]}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" onClick={() => setForm({ question: q, key: Date.now() })} aria-label={`Editar pergunta ${number}`} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => askDelete(q, number)} aria-label={`Excluir pergunta ${number}`} title="Excluir">
                          <Trash2 className="h-4 w-4 text-red-300" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>

      {form && (
        <QuestionForm
          key={form.key}
          question={form.question}
          number={form.question ? questions.findIndex((q) => q.id === form.question!.id) + 1 : undefined}
          onSave={handleSave}
          onClose={() => setForm(null)}
        />
      )}

      {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} />}

      {toast && (
        <div
          role="status"
          className={clsx(
            'fixed bottom-6 left-1/2 z-60 -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-semibold shadow-card-dark',
            toast.kind === 'success' ? 'border-emerald-400/60 bg-emerald-900/95 text-emerald-50' : 'border-red-400/60 bg-red-900/95 text-red-50',
          )}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
