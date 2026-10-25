import { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import {
  ArrowLeft,
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
import ThemeToggle from './ThemeToggle';

type Filter = Difficulty | 'todas';

type LoadState = { status: 'loading' } | { status: 'ok' } | { status: 'invalid'; error: string };

interface BibleLayoutProps {
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

/** Efeito sonoro suave de folhear papel bíblia gerado via Web Audio API (100% offline, zero dependências) */
function playPageRustleSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const duration = 0.16;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.28));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {
    // áudio silencioso se não houver permissão
  }
}

export default function BibleLayout({
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

  // spreadIndex: 0 = Folha 1 (Q1-Q6), 1 = Folha 2 (Q7-Q12), 2 = Folha 3 (Q13-Q18)...
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const isAnimating = useRef(false);

  const totalSpreads = Math.max(1, Math.ceil(visible.length / QUESTIONS_PER_SPREAD));

  // Perguntas da folha atual
  const currentSpreadQuestions = visible.slice(
    spreadIndex * QUESTIONS_PER_SPREAD,
    (spreadIndex + 1) * QUESTIONS_PER_SPREAD,
  );

  const leftPageQuestions = currentSpreadQuestions.slice(0, QUESTIONS_PER_PAGE);
  const rightPageQuestions = currentSpreadQuestions.slice(QUESTIONS_PER_PAGE, QUESTIONS_PER_SPREAD);

  const isLeftFull = leftPageQuestions.length >= QUESTIONS_PER_PAGE;
  const isRightFull = rightPageQuestions.length >= QUESTIONS_PER_PAGE;

  const goToSpread = useCallback((nextIndex: number, direction: 'next' | 'prev') => {
    if (isAnimating.current || nextIndex === spreadIndex || nextIndex < 0 || nextIndex >= totalSpreads) return;
    isAnimating.current = true;
    setFlipDirection(direction);
    playPageRustleSound();

    // Troca de conteúdo no ponto médio exato (190ms de 380ms) enquanto a folha está angulada
    setTimeout(() => {
      setSpreadIndex(nextIndex);
      // Finalização suave e liberação de trava após os 380ms completos da animação
      setTimeout(() => {
        setFlipDirection(null);
        isAnimating.current = false;
      }, 190);
    }, 190);
  }, [spreadIndex, totalSpreads]);

  // Navegação por teclado: Setas Esquerda e Direita folheiam as páginas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (spreadIndex < totalSpreads - 1) goToSpread(spreadIndex + 1, 'next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (spreadIndex > 0) goToSpread(spreadIndex - 1, 'prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spreadIndex, totalSpreads, goToSpread]);

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9] text-[#2c1d11] dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503] dark:text-[#ede6d8] font-serif select-none relative overflow-hidden transition-colors duration-200">
      {/* ======================================================== */}
      {/* BARRA SUPERIOR ESTILO PÚLPITO EM UM NÍVEL SÓ (SEM SCROLL) */}
      {/* ======================================================== */}
      <header className="shrink-0 border-b border-[#d5c6b0] dark:border-[#2b1b11] bg-white/85 dark:bg-gradient-to-b dark:from-[#1b1009] dark:to-[#120a06] px-4 py-2 text-xs text-[#423125] dark:text-amber-100 shadow-xs dark:shadow-xl z-20 backdrop-blur-xs transition-colors">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 overflow-x-auto">
          {/* Esquerda: Voltar (ícone apenas) + Filtro compacto + Marcadores de Folhas */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar ao início"
              title="Voltar ao início"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5c6b0] dark:border-[#c5a059]/40 bg-white dark:bg-[#2d1d13] text-[#73533e] dark:text-amber-200 shadow-xs transition-all hover:bg-[#f5ebd7] dark:hover:bg-[#3d2719] active:scale-95 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="h-5 w-px bg-[#d5c6b0] dark:bg-[#3d281a]" />

            {/* Filtro compacto */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-[#8b1e1e] dark:text-amber-400/90 font-serif font-bold mr-0.5">
                Filtro:
              </span>
              {(['todas', ...DIFFICULTY_ORDER] as Filter[]).map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFilter(f);
                      setSpreadIndex(0);
                    }}
                    className={clsx(
                      'rounded-md px-2.5 py-1 text-xs font-serif font-bold transition-all shrink-0',
                      active
                        ? 'bg-[#d4af37] text-[#1c120c] shadow-xs border border-amber-400'
                        : 'bg-white/90 dark:bg-[#241710] text-[#73533e] dark:text-amber-200/80 border border-[#d5c6b0] dark:border-[#3d281a] hover:bg-[#f5ebd7] dark:hover:bg-[#332014] hover:text-[#1c120c] dark:hover:text-white',
                    )}
                  >
                    {f === 'todas' ? `Todos (${questions.length})` : `${DIFFICULTY_LABEL[f]} (${counts[f]})`}
                  </button>
                );
              })}
            </div>

            <div className="h-5 w-px bg-[#d5c6b0] dark:bg-[#3d281a] hidden sm:block" />

            {/* Marcadores de Folhas Rápidas */}
            <div className="flex items-center gap-1 font-serif text-xs shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-[#8b1e1e] dark:text-amber-400/80 mr-0.5 hidden lg:inline font-bold">
                Folhas:
              </span>
              {Array.from({ length: totalSpreads }).map((_, i) => {
                const spNum = i + 1;
                const isActive = spreadIndex === i;
                return (
                  <button
                    key={spNum}
                    type="button"
                    onClick={() => goToSpread(i, i > spreadIndex ? 'next' : 'prev')}
                    className={clsx(
                      'rounded px-2 py-0.5 transition-all font-serif font-bold text-xs shrink-0',
                      isActive
                        ? 'bg-[#d4af37] text-[#1c120c] shadow-xs'
                        : 'text-[#73533e] dark:text-amber-200/70 hover:bg-[#f5ebd7] dark:hover:bg-[#2d1d13] hover:text-[#1c120c] dark:hover:text-amber-100',
                    )}
                    title={`Folha ${spNum}`}
                  >
                    Folha {spNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direita: Ações apenas com ícones + Novo Versículo (sem duplo mais) + Switch Noturno */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenFolder}
              aria-label="Abrir pasta de perguntas"
              title="Abrir pasta de dados"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5c6b0] dark:border-[#c5a059]/30 bg-white dark:bg-[#2d1d13]/90 text-[#73533e] dark:text-amber-200 transition-colors hover:bg-[#f5ebd7] dark:hover:bg-[#3d2719] shadow-xs shrink-0"
            >
              <FolderOpen className="h-4 w-4 text-[#d4af37]" />
            </button>
            {load.status === 'ok' && (
              <>
                <button
                  type="button"
                  onClick={onImport}
                  aria-label="Importar perguntas"
                  title="Importar perguntas de arquivo JSON"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5c6b0] dark:border-[#c5a059]/30 bg-white dark:bg-[#2d1d13]/90 text-[#73533e] dark:text-amber-200 transition-colors hover:bg-[#f5ebd7] dark:hover:bg-[#3d2719] shadow-xs shrink-0"
                >
                  <Upload className="h-4 w-4 text-[#d4af37]" />
                </button>
                <button
                  type="button"
                  onClick={onExport}
                  disabled={questions.length === 0}
                  aria-label="Exportar perguntas"
                  title="Exportar perguntas para arquivo JSON"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5c6b0] dark:border-[#c5a059]/30 bg-white dark:bg-[#2d1d13]/90 text-[#73533e] dark:text-amber-200 transition-colors hover:bg-[#f5ebd7] dark:hover:bg-[#3d2719] shadow-xs disabled:opacity-40 shrink-0"
                >
                  <Download className="h-4 w-4 text-[#d4af37]" />
                </button>
                <button
                  type="button"
                  onClick={onRestore}
                  aria-label="Restaurar perguntas originais"
                  title="Restaurar perguntas originais de fábrica"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5c6b0] dark:border-[#c5a059]/30 bg-white dark:bg-[#2d1d13]/90 text-[#73533e] dark:text-amber-200 transition-colors hover:bg-[#f5ebd7] dark:hover:bg-[#3d2719] shadow-xs shrink-0"
                >
                  <RotateCcw className="h-4 w-4 text-[#d4af37]" />
                </button>

                <div className="h-5 w-px bg-[#d5c6b0] dark:bg-[#3d281a]" />

                <button
                  type="button"
                  onClick={onNewQuestion}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#8b1e1e] to-[#a62424] px-3.5 py-1.5 font-serif text-xs font-bold text-amber-50 shadow-md border border-amber-500/40 transition-all hover:brightness-110 active:scale-95 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Novo Versículo</span>
                </button>
              </>
            )}

            {/* Switch Deslizante de Modo Noturno / Claro */}
            <div className="pl-1 border-l border-[#d5c6b0] dark:border-[#3d281a]">
              <ThemeToggle labelClassName="text-[#73533e] dark:text-amber-200/80 font-medium" />
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* O LIVRO SAGRADO ABERTO (4 PERGUNTAS POR PÁGINA = 8/FOLHA)*/}
      {/* ======================================================== */}
      <main className="flex-1 min-h-0 flex items-center justify-center p-1.5 sm:p-2 overflow-hidden">
        <div className="w-full max-w-6xl h-full max-h-[calc(100vh-4.25rem)] relative flex flex-col justify-center min-h-0">
          {/* Fita Marcadora de Cetim Rubra com reflexo dourado */}
          <div className="hidden md:block absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-20 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#7f1d1d] shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-40 rounded-b-sm border-b-4 border-[#d4af37] pointer-events-none"></div>

          {/* Encadernação de Couro Imperial com relevo dourado */}
          <div className="w-full h-full bg-[#1c120c] dark:bg-[#120b07] p-1.5 md:p-2 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_10px_20px_rgba(0,0,0,0.7)] border-4 border-[#3a2517] dark:border-[#2a1a10] relative transition-colors duration-200 flex flex-col min-h-0">
            <div className="border border-[#c5a059]/40 rounded-xl p-0.5 bg-[#140b07] dark:bg-[#0b0604] shadow-inner flex-1 min-h-0 flex flex-col">
              
              {/* Miolo do Livro: Modo Claro (Papel Marfim) vs Modo Noturno (Códice Escuro) */}
              <div
                className={clsx(
                  'grid grid-cols-1 md:grid-cols-2 rounded-lg overflow-hidden flex-1 min-h-0 relative transition-colors duration-300',
                  'bg-[#faf7f0] text-[#1c1917] shadow-[inset_0_0_80px_rgba(180,160,130,0.3)]',
                  'dark:bg-[#18130e] dark:text-[#ede6d8] dark:shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]',
                )}
              >
                {load.status === 'invalid' && (
                  <div className="col-span-2 p-8 text-center my-auto">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full border-2 border-[#8b1e1e] flex items-center justify-center text-[#8b1e1e] text-xl font-bold">
                      ⚠
                    </div>
                    <h3 className="text-lg font-bold text-[#8b1e1e] dark:text-[#f87171] mb-1 font-serif">Problema no Perguntas.json</h3>
                    <p className="text-xs text-[#5c4738] dark:text-[#c4b59d] mb-3 font-serif max-w-md mx-auto">{load.error}</p>
                    <div className="flex justify-center gap-3">
                      <button onClick={onReload} className="px-3 py-1.5 bg-[#8b1e1e] text-white rounded-lg font-serif text-xs font-bold hover:bg-[#a62424]">
                        Tentar Novamente
                      </button>
                      <button onClick={onRestore} className="px-3 py-1.5 bg-[#2d1d13] text-amber-200 rounded-lg font-serif text-xs font-bold hover:bg-[#3d2719]">
                        Restaurar Padrão
                      </button>
                    </div>
                  </div>
                )}

                {load.status === 'ok' && (
                  <>
                    {/* Página Esquerda: 4 Perguntas */}
                    <div
                      className={clsx(
                        'px-3 md:px-3.5 py-1.5 md:py-2 flex flex-col justify-between border-r-2 border-[#d5c6b0] dark:border-[#382618] relative bg-[#faf7f0] dark:bg-[#18130e] min-h-0 transition-colors duration-200',
                        flipDirection === 'prev' && 'animate-turn-prev',
                      )}
                    >
                      {/* Sombra da Medianiz */}
                      <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-black/[0.04] to-black/[0.14] dark:via-black/[0.15] dark:to-black/[0.5] pointer-events-none"></div>

                      {/* Cabeçalho da Página Esquerda */}
                      <div className="border-b border-[#8b1e1e]/30 dark:border-[#c5a059]/30 pb-0.5 flex justify-between items-center text-[10px] text-[#665040] dark:text-[#c4b59d] uppercase tracking-wider font-serif shrink-0">
                        <span className="font-bold text-[#1c120c] dark:text-[#faf7f0]">LIVRO DAS PERGUNTAS</span>
                        <span className="italic text-[#73533e] dark:text-[#bdae9c]">Cânon Sagrado</span>
                        <span>PÁG. {spreadIndex * 2 + 1}</span>
                      </div>

                      {/* Lista de até 4 Perguntas na Página Esquerda */}
                      <div
                        className={clsx(
                          'flex-1 flex flex-col py-0.5 min-h-0 overflow-hidden',
                          isLeftFull ? '' : 'justify-start space-y-1',
                        )}
                      >
                        {leftPageQuestions.length === 0 ? (
                          <div className="text-center py-8 text-[#73533e] dark:text-[#a89682] italic font-serif text-xs">
                            Nenhuma pergunta encontrada nesta folha.
                          </div>
                        ) : (
                          leftPageQuestions.map(({ q, number }) => (
                            <article
                              key={q.id}
                              className={clsx(
                                'border-b border-[#e2d8c6] dark:border-[#2d1e14] last:border-b-0',
                                isLeftFull
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
                          ))
                        )}
                      </div>

                      {/* Rodapé da Página Esquerda */}
                      <div className="border-t border-[#d5c6b0] dark:border-[#382618] pt-1 flex justify-between items-center text-xs text-[#73533e] dark:text-[#a89682] font-serif shrink-0">
                        {spreadIndex > 0 ? (
                          <button
                            onClick={() => goToSpread(spreadIndex - 1, 'prev')}
                            className="font-bold text-[#8b1e1e] dark:text-[#f87171] hover:underline flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Folha {spreadIndex}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-[#73533e]/60 dark:text-[#a89682]/60 italic">Início do Cânon</span>
                        )}
                        <span>Folha {spreadIndex + 1} de {totalSpreads}</span>
                      </div>
                    </div>

                    {/* Página Direita: 4 Perguntas */}
                    <div
                      className={clsx(
                        'px-3 md:px-3.5 py-1.5 md:py-2 flex flex-col justify-between relative bg-[#faf7f0] dark:bg-[#18130e] min-h-0 transition-colors duration-200',
                        flipDirection === 'next' && 'animate-turn-next',
                      )}
                    >
                      {/* Sombra da Medianiz */}
                      <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-l from-transparent via-black/[0.04] to-black/[0.14] dark:via-black/[0.15] dark:to-black/[0.5] pointer-events-none"></div>

                      {/* Cabeçalho da Página Direita */}
                      <div className="border-b border-[#8b1e1e]/30 dark:border-[#c5a059]/30 pb-0.5 flex justify-between items-center text-[10px] text-[#665040] dark:text-[#c4b59d] uppercase tracking-wider font-serif shrink-0">
                        <span>PÁG. {spreadIndex * 2 + 2}</span>
                        <span className="italic text-[#73533e] dark:text-[#bdae9c]">Versículos Canônicos</span>
                        <span className="font-bold text-[#1c120c] dark:text-[#faf7f0]">SHOW DO CRISTÃO</span>
                      </div>

                      {/* Lista de até 4 Perguntas na Página Direita */}
                      <div
                        className={clsx(
                          'flex-1 flex flex-col py-0.5 min-h-0 overflow-hidden',
                          isRightFull ? '' : 'justify-start space-y-1',
                        )}
                      >
                        {rightPageQuestions.length === 0 ? (
                          <div className="text-center py-8 text-[#73533e] dark:text-[#a89682] italic font-serif text-xs">
                            Fim das perguntas cadastradas neste cânon.
                          </div>
                        ) : (
                          rightPageQuestions.map(({ q, number }) => (
                            <article
                              key={q.id}
                              className={clsx(
                                'border-b border-[#e2d8c6] dark:border-[#2d1e14] last:border-b-0',
                                isRightFull
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
                          ))
                        )}
                      </div>

                      {/* Rodapé da Página Direita com Navegação para Próxima Folha */}
                      <div className="border-t border-[#d5c6b0] dark:border-[#382618] pt-1 flex justify-between items-center text-xs text-[#73533e] dark:text-[#a89682] font-serif shrink-0">
                        <span>Página {spreadIndex * 2 + 2}</span>
                        {spreadIndex < totalSpreads - 1 ? (
                          <button
                            onClick={() => goToSpread(spreadIndex + 1, 'next')}
                            className="font-bold text-[#8b1e1e] dark:text-[#f87171] hover:underline flex items-center gap-1"
                          >
                            <span>Próxima Folha ({spreadIndex + 2})</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[#73533e]/70 dark:text-[#a89682]/70 italic">Última folha do cânon</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Geral da Aplicação */}
      <footer className="shrink-0 border-t border-[#3d281a] dark:border-[#2b1b11] bg-[#1a100b] dark:bg-[#120a06] px-4 py-1.5 text-center text-[11px] text-amber-200/60 font-serif">
        Show do Cristão • Cânon Sagrado da Igreja Presbiteriana do Brasil • Folheie com ◀ e ▶
      </footer>
    </div>
  );
}
