import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import clsx from 'clsx';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import type { Difficulty, Question } from '@/types/game';
import { LETTERS } from '@/game/questions';
import { getPoints } from '@/game/engine';
import { DIFFICULTY_LABEL, DIFFICULTY_ORDER } from './difficulty';
import OpenBookLayout, { BookPage, BookToolbarButton } from './OpenBookLayout';
import PageTurnLayer from './PageTurnLayer';
import { playPageFlipSound } from '@/services/audioService';

type Filter = Difficulty | 'todas';

type LoadState = { status: 'loading' } | { status: 'ok' } | { status: 'invalid'; error: string };

interface BibleLayoutProps {
  disabled?: boolean;
  onBack: () => void;
  load: LoadState;
  questions: Question[];
  visible: { q: Question; number: number }[];
  filter: Filter;
  counts: Record<Difficulty, number>;
  setFilter: (f: Filter) => void;
  onOpenFolder: () => void;
  onImport: () => void;
  onExport: () => void;
  onRestore: () => void;
  onNewQuestion: () => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (q: Question, number: number) => void;
  onReload: () => void;
}

interface PageTurn {
  from: number;
  to: number;
  direction: 'next' | 'prev';
  questions: Question[];
  filter: Filter;
}

export default function BibleLayout({
  disabled = false,
  onBack,
  load,
  questions,
  visible,
  filter,
  counts,
  setFilter,
  onOpenFolder,
  onImport,
  onExport,
  onRestore,
  onNewQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onReload,
}: BibleLayoutProps) {
  // 4 perguntas por página = 8 perguntas por folha aberta (bifólio)
  const QUESTIONS_PER_PAGE = 4;
  const QUESTIONS_PER_SPREAD = QUESTIONS_PER_PAGE * 2; // 8

  // Cada folha aberta contém até oito perguntas.
  const [storedSpreadIndex, setSpreadIndex] = useState(0);
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const activeTurn = useRef<PageTurn | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const totalSpreads = Math.max(1, Math.ceil(visible.length / QUESTIONS_PER_SPREAD));
  const spreadIndex = Math.min(storedSpreadIndex, totalSpreads - 1);
  const ready = load.status === 'ok';

  const cancelTurn = useCallback(() => {
    activeTurn.current = null;
    setTurn(null);
  }, []);

  const completeTurn = useCallback((expected: PageTurn) => {
    if (activeTurn.current !== expected) return;
    activeTurn.current = null;
    setSpreadIndex(expected.to);
    setTurn(null);
  }, []);

  // Alterar o banco (mesmo sem mudar a contagem), filtros ou abrir um diálogo
  // invalida a folha visual antes do próximo desenho.
  useLayoutEffect(() => {
    cancelTurn();
    setSpreadIndex((index) => Math.min(index, totalSpreads - 1));
  }, [filter, questions, ready, disabled, totalSpreads, cancelTurn]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    const onHidden = () => {
      if (document.hidden && activeTurn.current) completeTurn(activeTurn.current);
    };
    preference.addEventListener('change', update);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      preference.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', onHidden);
      activeTurn.current = null;
    };
  }, [completeTurn]);

  useLayoutEffect(() => {
    if (reducedMotion && activeTurn.current) completeTurn(activeTurn.current);
  }, [reducedMotion, completeTurn]);

  const currentTurn = turn && turn.questions === questions && turn.filter === filter && ready && !disabled && !reducedMotion ? turn : null;
  const turning = currentTurn !== null;

  // Perguntas da folha atual
  const pageQuestions = (index: number, side: 'left' | 'right') => {
    const start = index * QUESTIONS_PER_SPREAD + (side === 'right' ? QUESTIONS_PER_PAGE : 0);
    return visible.slice(start, start + QUESTIONS_PER_PAGE);
  };
  const goToSpread = useCallback((nextIndex: number, direction: 'next' | 'prev') => {
    if (disabled || !ready || activeTurn.current || nextIndex === spreadIndex || nextIndex < 0 || nextIndex >= totalSpreads) return;
    playPageFlipSound();
    if (reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSpreadIndex(nextIndex);
      return;
    }
    const next: PageTurn = { from: spreadIndex, to: nextIndex, direction, questions, filter };
    activeTurn.current = next;
    setTurn(next);
  }, [disabled, ready, reducedMotion, spreadIndex, totalSpreads, questions, filter]);

  // Navegação por teclado: Setas Esquerda e Direita folheiam as páginas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || !ready) return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement || (e.target instanceof HTMLElement && e.target.isContentEditable)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (spreadIndex < totalSpreads - 1) goToSpread(spreadIndex + 1, 'next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (spreadIndex > 0) goToSpread(spreadIndex - 1, 'prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, ready, spreadIndex, totalSpreads, goToSpread]);

  const renderPage = (index: number, side: 'left' | 'right') => {
    const items = pageQuestions(index, side);
    const isFull = items.length === QUESTIONS_PER_PAGE;
    const pageNumber = index * 2 + (side === 'left' ? 1 : 2);
    return (
      <BookPage
        side={side}
        title={side === 'left' ? 'Livro das Perguntas' : 'Show do Cristão'}
        subtitle="Cânon Sagrado"
        pageNumber={pageNumber}
        inactive={turning}
        footer={<><span>{side === 'left' ? 'Folha ' + (index + 1) + ' de ' + totalSpreads : 'Use ◀ e ▶ para folhear'}</span><span>Página {pageNumber}</span></>}
      >
        <div className={clsx('flex min-h-0 flex-1 flex-col overflow-hidden', !isFull && 'justify-start space-y-1')}>
          {items.length === 0 ? (
            <p className="py-8 text-center text-xs italic text-[#73533e] dark:text-[#a89682]">{side === 'left' ? 'Nenhuma pergunta encontrada nesta folha.' : 'Fim das perguntas cadastradas neste cânon.'}</p>
          ) : items.map(({ q, number }) => (
            <article
              key={q.id}
              className={clsx(
                'border-b border-[#e2d8c6] dark:border-[#2d1e14] last:border-b-0',
                isFull
                  ? 'flex-1 min-h-0 flex flex-col justify-center py-1'
                  : 'py-2.5 first:pt-0',
              )}
            >
              <div className="flex items-start justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#8b1e1e] dark:text-[#f87171] font-serif">§ {number}.</span>
                  <span
                    className={clsx(
                      'text-[9px] font-serif font-bold uppercase px-2 py-0.5 rounded-full border shadow-xs',
                      q.difficulty === 'facil' && 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-600/50',
                      q.difficulty === 'medio' && 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-600/50',
                      q.difficulty === 'dificil' && 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-600/50',
                    )}
                  >
                    ● {DIFFICULTY_LABEL[q.difficulty]} • {getPoints(q.difficulty)} Talentos
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onEditQuestion(q)}
                    className="p-1 rounded text-[#73533e] hover:bg-amber-100 hover:text-black dark:text-[#a89682] dark:hover:bg-amber-950/60 dark:hover:text-amber-200 transition-colors"
                    title="Editar versículo"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteQuestion(q, number)}
                    className="p-1 rounded text-[#73533e] hover:bg-rose-100 hover:text-[#8b1e1e] dark:text-[#a89682] dark:hover:bg-rose-950/60 dark:hover:text-rose-300 transition-colors"
                    title="Excluir versículo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="font-semibold text-[12px] sm:text-[12.5px] text-[#1c1917] dark:text-[#faf7f0] mb-1 leading-snug font-serif">
                {q.text}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        'px-2 py-0.5 sm:py-1 rounded transition-all flex items-center justify-between border font-serif text-[10.5px] sm:text-[11px] leading-tight',
                        isCorrect
                          ? 'bg-amber-100/90 text-[#8b1e1e] font-bold border-amber-400 shadow-xs ring-1 ring-amber-300 dark:bg-[#341d13] dark:text-[#fca5a5] dark:border-amber-500/80 dark:ring-amber-500/30'
                          : 'bg-white/80 text-[#3d2f26] border-[#e2d8c6] hover:border-amber-400/60 dark:bg-[#221a14]/90 dark:text-[#dfd5c6] dark:border-[#382618] dark:hover:border-amber-400/50',
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={clsx(
                          'inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full font-sans text-[10px] font-bold leading-none select-none text-center pt-[1px]',
                          isCorrect
                            ? 'bg-[#8b1e1e] text-white dark:bg-[#b91c1c] dark:text-amber-100'
                            : 'bg-[#e9ded0] text-[#5c4738] dark:bg-[#332318] dark:text-[#c5a059]',
                        )}>
                          {LETTERS[i]}
                        </span>
                        <span className="truncate text-[10.5px] sm:text-[11px]">{opt}</span>
                      </div>
                      {isCorrect && <Check className="w-3 h-3 text-[#8b1e1e] dark:text-[#f87171] stroke-[3] shrink-0 ml-1" />}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </BookPage>
    );
  };

  return (
    <OpenBookLayout
      title="Perguntas"
      onBack={onBack}
      pagesBusy={turning}
      pagesOverlay={currentTurn && (
        <PageTurnLayer
          direction={currentTurn.direction}
          front={renderPage(currentTurn.from, currentTurn.direction === 'next' ? 'right' : 'left')}
          back={renderPage(currentTurn.to, currentTurn.direction === 'next' ? 'left' : 'right')}
          onComplete={() => completeTurn(currentTurn)}
        />
      )}
      actions={
        <>
          <BookToolbarButton onClick={onOpenFolder} aria-label="Abrir pasta das perguntas" title="Abrir pasta das perguntas"><FolderOpen className="h-4 w-4" /></BookToolbarButton>
          <BookToolbarButton onClick={onImport} aria-label="Importar perguntas" title="Importar perguntas" disabled={load.status === 'loading'}><Upload className="h-4 w-4" /></BookToolbarButton>
          <BookToolbarButton onClick={onExport} aria-label="Exportar perguntas" title="Exportar perguntas" disabled={!ready || questions.length === 0}><Download className="h-4 w-4" /></BookToolbarButton>
          <BookToolbarButton onClick={onRestore} aria-label="Restaurar perguntas originais" title="Restaurar perguntas originais" disabled={load.status === 'loading'}><RotateCcw className="h-4 w-4" /></BookToolbarButton>
        </>
      }
      primaryAction={{ label: 'Nova pergunta', icon: <Plus className="h-4 w-4" />, onClick: onNewQuestion, disabled: !ready }}
      toolbar={
        <>
          <div className="flex items-center gap-1.5" role="group" aria-label="Filtrar perguntas por dificuldade">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[#8b1e1e] dark:text-amber-400/90">Dificuldade:</span>
            {(['todas', ...DIFFICULTY_ORDER] as Filter[]).map((value) => (
              <button
                key={value}
                type="button"
                disabled={!ready || disabled}
                aria-pressed={filter === value}
                onClick={() => { cancelTurn(); setFilter(value); setSpreadIndex(0); }}
                className={clsx('h-7 rounded-md border px-2.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-40', filter === value ? 'border-amber-400 bg-[#d4af37] text-[#1c120c]' : 'border-[#d5c6b0] bg-white/90 text-[#73533e] hover:bg-[#f5ebd7] dark:border-[#3d281a] dark:bg-[#241710] dark:text-amber-200/80 dark:hover:bg-[#332014]')}
              >
                {value === 'todas' ? 'Todos (' + questions.length + ')' : DIFFICULTY_LABEL[value] + ' (' + counts[value] + ')'}
              </button>
            ))}
          </div>
          <nav className="flex items-center gap-1.5" aria-label="Navegação das folhas" data-current-spread={spreadIndex + 1} data-total-spreads={totalSpreads}>
            <BookToolbarButton onClick={() => goToSpread(spreadIndex - 1, 'prev')} aria-label="Folha anterior" title="Folha anterior" disabled={!ready || disabled || spreadIndex === 0 || turning}><ChevronLeft className="h-4 w-4" /></BookToolbarButton>
            <select
              aria-label="Selecionar folha"
              value={spreadIndex + 1}
              disabled={!ready || disabled || turning}
              onChange={(event) => { const next = Number(event.target.value) - 1; goToSpread(next, next > spreadIndex ? 'next' : 'prev'); }}
              className="h-8 rounded-lg border border-[#d5c6b0] bg-white px-2 text-xs font-bold text-[#73533e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-40 dark:border-[#3d281a] dark:bg-[#241710] dark:text-amber-200"
            >
              {Array.from({ length: totalSpreads }, (_, index) => <option key={index} value={index + 1}>Folha {index + 1} de {totalSpreads}</option>)}
            </select>
            <BookToolbarButton onClick={() => goToSpread(spreadIndex + 1, 'next')} aria-label="Próxima folha" title="Próxima folha" disabled={!ready || disabled || spreadIndex === totalSpreads - 1 || turning}><ChevronRight className="h-4 w-4" /></BookToolbarButton>
          </nav>
        </>
      }
    >
      {load.status === 'loading' && <div role="status" className="col-span-2 m-auto p-8 text-sm text-[#73533e] dark:text-[#c4b59d]">Carregando perguntas…</div>}
      {load.status === 'invalid' && (
        <div className="col-span-2 m-auto max-w-xl p-8 text-center">
          <h2 className="mb-2 text-lg font-bold text-[#8b1e1e] dark:text-[#f87171]">Problema no Perguntas.json</h2>
          <p className="mb-4 text-sm text-[#5c4738] dark:text-[#c4b59d]">{load.error}</p>
          <div className="flex justify-center gap-3">
            <button type="button" onClick={onReload} className="rounded-lg border border-[#8b1e1e] bg-[#8b1e1e] px-3 py-1.5 text-xs font-bold text-white">Tentar Novamente</button>
            <button type="button" onClick={onRestore} className="rounded-lg border border-[#d5c6b0] bg-[#f4efe4] px-3 py-1.5 text-xs font-bold text-[#3d2f26] dark:border-[#3d2a1d] dark:bg-[#251b14] dark:text-[#dfd4c5]">Restaurar Padrão</button>
            <button type="button" onClick={onImport} className="rounded-lg border border-[#d5c6b0] bg-[#f4efe4] px-3 py-1.5 text-xs font-bold text-[#3d2f26] dark:border-[#3d2a1d] dark:bg-[#251b14] dark:text-[#dfd4c5]">Importar perguntas</button>
          </div>
        </div>
      )}
      {ready && <>{renderPage(currentTurn?.direction === 'prev' ? currentTurn.to : spreadIndex, 'left')}{renderPage(currentTurn?.direction === 'next' ? currentTurn.to : spreadIndex, 'right')}</>}
    </OpenBookLayout>
  );
}
