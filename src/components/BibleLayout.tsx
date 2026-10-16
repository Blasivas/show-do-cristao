import { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import {
  ArrowLeft,
  BookOpen,
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
  // spread: 0 = Prólogo/Capa interna, 1 = Folha 1 (Q1-Q4), 2 = Folha 2 (Q5-Q8), 3 = Folha 3 (Q9-Q12)...
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const isAnimating = useRef(false);

  const QUESTIONS_PER_SPREAD = 4; // 2 na página esquerda, 2 na página direita
  const totalQuestionSpreads = Math.max(1, Math.ceil(visible.length / QUESTIONS_PER_SPREAD));
  const totalSpreads = totalQuestionSpreads + 1; // +1 para o Prólogo (spread 0)

  // Perguntas da folha atual (se spreadIndex > 0)
  const currentSpreadQuestions =
    spreadIndex > 0
      ? visible.slice((spreadIndex - 1) * QUESTIONS_PER_SPREAD, spreadIndex * QUESTIONS_PER_SPREAD)
      : [];

  const leftPageQuestions = currentSpreadQuestions.slice(0, 2);
  const rightPageQuestions = currentSpreadQuestions.slice(2, 4);

  const goToSpread = useCallback((nextIndex: number, direction: 'next' | 'prev') => {
    if (isAnimating.current || nextIndex === spreadIndex || nextIndex < 0 || nextIndex >= totalSpreads) return;
    isAnimating.current = true;
    setFlipDirection(direction);
    playPageRustleSound();

    setTimeout(() => {
      setSpreadIndex(nextIndex);
      setTimeout(() => {
        setFlipDirection(null);
        isAnimating.current = false;
      }, 180);
    }, 160);
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
    <div className="flex h-full w-full flex-col bg-[#140e0a] text-[#1c1917] font-serif select-none relative overflow-hidden">
      {/* ======================================================== */}
      {/* BARRA SUPERIOR ESTILO PÚLPITO & ENCADERNAÇÃO             */}
      {/* ======================================================== */}
      <header className="shrink-0 border-b-2 border-[#3d281a] bg-gradient-to-b from-[#241710] to-[#1a100b] px-6 py-2.5 text-xs text-amber-100 shadow-xl z-20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg border border-[#c5a059]/40 bg-[#2d1d13] px-3 py-1.5 font-serif text-xs font-bold text-amber-200 shadow-sm transition-all hover:bg-[#3d2719] hover:border-amber-400 active:scale-98"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Início
            </button>

            <div className="flex items-center gap-2 border-l border-[#3d281a] pl-3">
              <BookOpen className="h-4 w-4 text-[#d4af37]" />
              <span className="font-bold tracking-widest uppercase text-amber-200 text-xs">
                Cânon do Show do Cristão
              </span>
              <span className="rounded-full border border-amber-600/40 bg-amber-950/80 px-2 py-0.5 text-[11px] font-mono text-amber-300">
                {questions.length} versículos
              </span>
            </div>
          </div>

          {/* Ações Canônicas (Pasta, Importar, Exportar, Restaurar, Novo Versículo) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenFolder}
              className="flex items-center gap-1.5 rounded-lg border border-[#c5a059]/30 bg-[#2d1d13]/90 px-3 py-1.5 font-serif text-xs text-amber-200 transition-colors hover:bg-[#3d2719]"
            >
              <FolderOpen className="h-3.5 w-3.5 text-[#d4af37]" /> Pasta
            </button>
            {load.status === 'ok' && (
              <>
                <button
                  onClick={onImport}
                  className="flex items-center gap-1.5 rounded-lg border border-[#c5a059]/30 bg-[#2d1d13]/90 px-3 py-1.5 font-serif text-xs text-amber-200 transition-colors hover:bg-[#3d2719]"
                >
                  <Upload className="h-3.5 w-3.5 text-[#d4af37]" /> Importar
                </button>
                <button
                  onClick={onExport}
                  disabled={questions.length === 0}
                  className="flex items-center gap-1.5 rounded-lg border border-[#c5a059]/30 bg-[#2d1d13]/90 px-3 py-1.5 font-serif text-xs text-amber-200 transition-colors hover:bg-[#3d2719] disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5 text-[#d4af37]" /> Exportar
                </button>
                <button
                  onClick={onRestore}
                  className="flex items-center gap-1.5 rounded-lg border border-[#c5a059]/30 bg-[#2d1d13]/90 px-3 py-1.5 font-serif text-xs text-amber-200 transition-colors hover:bg-[#3d2719]"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#d4af37]" /> Restaurar
                </button>
                <button
                  onClick={onNewQuestion}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#8b1e1e] to-[#a62424] px-4 py-1.5 font-serif text-xs font-bold text-amber-50 shadow-md border border-amber-500/40 transition-all hover:brightness-110 hover:scale-102 active:scale-98"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> + Novo Versículo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Fita de Filtros Canônicos e Índice das Folhas */}
        <div className="mx-auto mt-2 flex max-w-7xl flex-wrap items-center justify-between gap-2 border-t border-[#3d281a]/60 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-amber-400/90 font-serif mr-1">
              Filtro Canônico:
            </span>
            {(['todas', ...DIFFICULTY_ORDER] as Filter[]).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilter(f);
                    setSpreadIndex(1); // pula direto para as perguntas do filtro
                  }}
                  className={clsx(
                    'rounded-md px-3 py-1 text-xs font-serif font-bold transition-all',
                    active
                      ? 'bg-[#d4af37] text-[#1c120c] shadow-md border border-amber-300'
                      : 'bg-[#241710] text-amber-200/80 border border-[#3d281a] hover:bg-[#332014] hover:text-white',
                  )}
                >
                  {f === 'todas' ? `Todos (${questions.length})` : `${DIFFICULTY_LABEL[f]} (${counts[f]})`}
                </button>
              );
            })}
          </div>

          {/* Marcadores de Folhas Rápidas */}
          <div className="flex items-center gap-1 font-serif text-xs">
            <span className="text-[11px] uppercase tracking-wider text-amber-400/80 mr-1 hidden sm:inline">
              Folhas:
            </span>
            <button
              onClick={() => goToSpread(0, 'prev')}
              className={clsx(
                'rounded px-2.5 py-0.5 transition-all font-serif font-bold text-xs',
                spreadIndex === 0
                  ? 'bg-[#d4af37] text-[#1c120c] shadow-xs'
                  : 'text-amber-200/70 hover:bg-[#2d1d13] hover:text-amber-100',
              )}
            >
              Prólogo
            </button>
            {Array.from({ length: totalQuestionSpreads }).map((_, i) => {
              const spNum = i + 1;
              const isActive = spreadIndex === spNum;
              return (
                <button
                  key={spNum}
                  onClick={() => goToSpread(spNum, spNum > spreadIndex ? 'next' : 'prev')}
                  className={clsx(
                    'rounded px-2 py-0.5 transition-all font-serif font-bold text-xs',
                    isActive
                      ? 'bg-[#d4af37] text-[#1c120c] shadow-xs'
                      : 'text-amber-200/70 hover:bg-[#2d1d13] hover:text-amber-100',
                  )}
                  title={`Folha ${spNum}`}
                >
                  {spNum}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* O LIVRO SAGRADO ABERTO (BIFÓLIO)                         */}
      {/* ======================================================== */}
      <main className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
        <div className="w-full max-w-6xl relative my-auto">
          {/* Fita Marcadora de Cetim Rubra com reflexo dourado */}
          <div className="hidden md:block absolute -top-5 left-1/2 -translate-x-1/2 w-7 h-28 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#7f1d1d] shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-40 rounded-b-sm border-b-6 border-[#d4af37]"></div>

          {/* Encadernação de Couro Imperial com relevo dourado */}
          <div className="w-full bg-[#1c120c] p-3 md:p-5 rounded-3xl shadow-[0_35px_80px_rgba(0,0,0,0.95),0_15px_30px_rgba(0,0,0,0.7)] border-4 border-[#3a2517] relative">
            <div className="border border-[#c5a059]/40 rounded-2xl p-1 bg-[#140b07] shadow-inner">
              
              {/* Miolo de Papel Bíblia com animação 3D de virada */}
              <div
                className={clsx(
                  'grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden min-h-[580px] bg-[#faf7f0] text-[#1c1917] relative transition-transform duration-300 shadow-[inset_0_0_80px_rgba(180,160,130,0.3)]',
                  flipDirection === 'next' && 'animate-turn-next',
                  flipDirection === 'prev' && 'animate-turn-prev',
                )}
              >
                {load.status === 'invalid' && (
                  <div className="col-span-2 p-12 text-center my-auto">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full border-2 border-[#8b1e1e] flex items-center justify-center text-[#8b1e1e] text-2xl font-bold">
                      ⚠
                    </div>
                    <h3 className="text-xl font-bold text-[#8b1e1e] mb-2 font-serif">Problema no Perguntas.json</h3>
                    <p className="text-sm text-[#5c4738] mb-4 font-serif max-w-md mx-auto">{load.error}</p>
                    <div className="flex justify-center gap-3">
                      <button onClick={onReload} className="px-4 py-2 bg-[#8b1e1e] text-white rounded-lg font-serif text-xs font-bold hover:bg-[#a62424]">
                        Tentar Novamente
                      </button>
                      <button onClick={onRestore} className="px-4 py-2 bg-[#2d1d13] text-amber-200 rounded-lg font-serif text-xs font-bold hover:bg-[#3d2719]">
                        Restaurar Padrão
                      </button>
                    </div>
                  </div>
                )}

                {/* ==================================================== */}
                {/* SPREAD 0: PRÓLOGO & CAPA INTERNA                     */}
                {/* ==================================================== */}
                {load.status === 'ok' && spreadIndex === 0 && (
                  <>
                    {/* Página Esquerda: Frontispício Sagrado */}
                    <div className="p-8 md:p-12 flex flex-col justify-between border-r-2 border-[#d5c6b0] relative bg-[#faf7f0]">
                      {/* Sombra da Medianiz (Dobra central do livro) */}
                      <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-black/[0.04] to-black/[0.14] pointer-events-none"></div>

                      <div className="border-b-2 border-double border-[#8b1e1e]/40 pb-2 text-center text-xs tracking-widest text-[#73533e] uppercase font-serif font-bold">
                        O Livro do Show do Cristão • Prólogo
                      </div>

                      <div className="text-center my-auto py-6">
                        <div className="w-16 h-16 mx-auto mb-4 border-2 border-[#8b1e1e] rounded-full flex items-center justify-center text-[#8b1e1e] text-3xl font-serif shadow-inner">
                          ✟
                        </div>

                        <div className="text-xs tracking-[0.25em] uppercase text-[#73533e] mb-2 font-serif font-bold">
                          Igreja Presbiteriana do Brasil
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-[#1c120c] tracking-wider mb-2 uppercase font-serif">
                          CÂNON DO QUIZ BÍBLICO
                        </h1>

                        <p className="text-sm italic text-[#5c4738] mb-6 font-serif">
                          Acervo oficial de perguntas e respostas para a grande gincana de auditório
                        </p>

                        <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-[#8b1e1e] to-transparent mx-auto my-6"></div>

                        <div className="text-xs text-[#5c4738] space-y-1.5 italic max-w-sm mx-auto font-serif">
                          <p>“Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.”</p>
                          <p className="font-bold text-[#8b1e1e] not-italic tracking-wider text-[11px] font-serif">
                            — SALMO 119:105
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-[#d5c6b0] pt-2 flex justify-between text-xs text-[#73533e] font-serif">
                        <span>Anno Domini MMXXVI</span>
                        <span>Frontispício</span>
                      </div>
                    </div>

                    {/* Página Direita: Instruções Canônicas */}
                    <div className="p-8 md:p-12 flex flex-col justify-between relative bg-[#faf7f0]">
                      {/* Sombra da Medianiz (Dobra central do livro) */}
                      <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-l from-transparent via-black/[0.04] to-black/[0.14] pointer-events-none"></div>

                      <div className="border-b-2 border-double border-[#8b1e1e]/40 pb-2 text-center text-xs tracking-widest text-[#73533e] uppercase font-serif font-bold">
                        Capítulo I • Da Organização
                      </div>

                      <div className="my-auto py-4">
                        <div className="text-center mb-6">
                          <span className="text-xs text-[#8b1e1e] font-bold tracking-widest uppercase font-serif">
                            CAPÍTULO PRIMEIRO
                          </span>
                          <h2 className="text-2xl font-bold text-[#1c120c] font-serif">
                            Das Instruções aos Escribas
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-justify text-xs leading-relaxed text-[#2c221b] font-serif">
                          <div>
                            <p className="mb-3">
                              <span className="float-left text-5xl leading-none font-bold text-[#8b1e1e] pr-2 pt-1 font-serif">
                                E
                              </span>
                              ste acervo reúne todas as questões bíblicas devidamente catalogadas por ordem de dificuldade e recompensa de talentos.
                            </p>
                            <p className="text-[#5c4738]">
                              <sup className="font-bold text-[#8b1e1e] text-[11px]">1</sup> As perguntas dividem-se em três graus canônicos: fáceis (10 talentos), médias (20 talentos) e difíceis (30 talentos).
                            </p>
                          </div>

                          <div>
                            <p className="text-[#5c4738] mb-4">
                              <sup className="font-bold text-[#8b1e1e] text-[11px]">2</sup> Você pode folhear as páginas do livro usando as setas do teclado (◀ e ▶) ou os botões de rodapé.
                            </p>

                            <button
                              onClick={() => goToSpread(1, 'next')}
                              className="w-full py-3 px-4 bg-gradient-to-r from-[#8b1e1e] to-[#a62424] hover:brightness-110 text-amber-50 rounded-lg font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 hover:scale-102 active:scale-98 border border-amber-400/30"
                            >
                              <span>Abrir os Versículos (Folha 1)</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#d5c6b0] pt-2 flex justify-between text-xs text-[#73533e] font-serif">
                        <span>Página II</span>
                        <button
                          onClick={() => goToSpread(1, 'next')}
                          className="font-bold text-[#8b1e1e] hover:underline flex items-center gap-1"
                        >
                          Ir para as Perguntas ⟶
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* ==================================================== */}
                {/* SPREADS > 0: PÁGINAS DE PERGUNTAS (BIFÓLIO REAL)     */}
                {/* ==================================================== */}
                {load.status === 'ok' && spreadIndex > 0 && (
                  <>
                    {/* Página Esquerda: 2 Perguntas */}
                    <div className="p-6 md:p-8 flex flex-col justify-between border-r-2 border-[#d5c6b0] relative bg-[#faf7f0]">
                      {/* Sombra da Medianiz */}
                      <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-black/[0.04] to-black/[0.14] pointer-events-none"></div>

                      {/* Cabeçalho da Página Esquerda */}
                      <div className="border-b-2 border-double border-[#8b1e1e]/40 pb-2 flex justify-between items-center text-xs text-[#665040] uppercase tracking-wider font-serif">
                        <span className="font-bold text-[#1c120c]">LIVRO DAS PERGUNTAS</span>
                        <span className="italic text-[#73533e]">Edição Canônica</span>
                        <span>PÁG. {spreadIndex * 2 + 1}</span>
                      </div>

                      {/* Lista de Perguntas da Página Esquerda */}
                      <div className="my-auto space-y-6 py-4">
                        {leftPageQuestions.length === 0 ? (
                          <div className="text-center py-12 text-[#73533e] italic font-serif">
                            Fim das perguntas desta folha.
                          </div>
                        ) : (
                          leftPageQuestions.map(({ q, number }) => (
                            <article key={q.id} className="border-b border-[#e2d8c6] pb-5 last:border-b-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-[#8b1e1e] font-serif">§ {number}.</span>
                                  <span
                                    className={clsx(
                                      'text-[10px] font-serif font-bold uppercase px-2 py-0.5 rounded-full border shadow-xs',
                                      q.difficulty === 'facil' && 'bg-emerald-50 text-emerald-800 border-emerald-300',
                                      q.difficulty === 'medio' && 'bg-amber-50 text-amber-900 border-amber-300',
                                      q.difficulty === 'dificil' && 'bg-rose-50 text-rose-900 border-rose-300',
                                    )}
                                  >
                                    ● {DIFFICULTY_LABEL[q.difficulty]} • {getPoints(q.difficulty)} Talentos
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onEditQuestion(q)}
                                    className="p-1 rounded text-[#73533e] hover:bg-amber-100 hover:text-black transition-colors"
                                    title="Editar versículo"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteQuestion(q, number)}
                                    className="p-1 rounded text-[#73533e] hover:bg-rose-100 hover:text-[#8b1e1e] transition-colors"
                                    title="Excluir versículo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="font-semibold text-[15px] text-[#1c1917] mb-3 leading-relaxed font-serif">
                                {q.text}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {q.options.map((opt, i) => {
                                  const isCorrect = i === q.correctIndex;
                                  return (
                                    <div
                                      key={i}
                                      className={clsx(
                                        'px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between border font-serif',
                                        isCorrect
                                          ? 'bg-amber-100/90 text-[#8b1e1e] font-bold border-amber-400 shadow-xs ring-1 ring-amber-300'
                                          : 'bg-white/80 text-[#3d2f26] border-[#e2d8c6] hover:border-amber-400/60',
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={clsx(
                                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                                          isCorrect ? 'bg-[#8b1e1e] text-white' : 'bg-[#e9ded0] text-[#5c4738]',
                                        )}>
                                          {LETTERS[i]}
                                        </span>
                                        <span>{opt}</span>
                                      </div>
                                      {isCorrect && <Check className="w-4 h-4 text-[#8b1e1e] stroke-[3] shrink-0 ml-1" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </article>
                          ))
                        )}
                      </div>

                      {/* Rodapé da Página Esquerda */}
                      <div className="border-t border-[#d5c6b0] pt-2 flex justify-between items-center text-xs text-[#73533e] font-serif">
                        <button
                          onClick={() => goToSpread(spreadIndex - 1, 'prev')}
                          className="font-bold text-[#8b1e1e] hover:underline flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>{spreadIndex === 1 ? 'Prólogo' : `Folha ${spreadIndex - 1}`}</span>
                        </button>
                        <span>Folha {spreadIndex} de {totalQuestionSpreads}</span>
                      </div>
                    </div>

                    {/* Página Direita: 2 Perguntas */}
                    <div className="p-6 md:p-8 flex flex-col justify-between relative bg-[#faf7f0]">
                      {/* Sombra da Medianiz */}
                      <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-l from-transparent via-black/[0.04] to-black/[0.14] pointer-events-none"></div>

                      {/* Cabeçalho da Página Direita */}
                      <div className="border-b-2 border-double border-[#8b1e1e]/40 pb-2 flex justify-between items-center text-xs text-[#665040] uppercase tracking-wider font-serif">
                        <span>PÁG. {spreadIndex * 2 + 2}</span>
                        <span className="italic text-[#73533e]">Versículos Canônicos</span>
                        <span className="font-bold text-[#1c120c]">SHOW DO CRISTÃO</span>
                      </div>

                      {/* Lista de Perguntas da Página Direita */}
                      <div className="my-auto space-y-6 py-4">
                        {rightPageQuestions.length === 0 ? (
                          <div className="text-center py-12 text-[#73533e] italic font-serif">
                            Fim das perguntas cadastradas neste cânon.
                          </div>
                        ) : (
                          rightPageQuestions.map(({ q, number }) => (
                            <article key={q.id} className="border-b border-[#e2d8c6] pb-5 last:border-b-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-[#8b1e1e] font-serif">§ {number}.</span>
                                  <span
                                    className={clsx(
                                      'text-[10px] font-serif font-bold uppercase px-2 py-0.5 rounded-full border shadow-xs',
                                      q.difficulty === 'facil' && 'bg-emerald-50 text-emerald-800 border-emerald-300',
                                      q.difficulty === 'medio' && 'bg-amber-50 text-amber-900 border-amber-300',
                                      q.difficulty === 'dificil' && 'bg-rose-50 text-rose-900 border-rose-300',
                                    )}
                                  >
                                    ● {DIFFICULTY_LABEL[q.difficulty]} • {getPoints(q.difficulty)} Talentos
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onEditQuestion(q)}
                                    className="p-1 rounded text-[#73533e] hover:bg-amber-100 hover:text-black transition-colors"
                                    title="Editar versículo"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteQuestion(q, number)}
                                    className="p-1 rounded text-[#73533e] hover:bg-rose-100 hover:text-[#8b1e1e] transition-colors"
                                    title="Excluir versículo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="font-semibold text-[15px] text-[#1c1917] mb-3 leading-relaxed font-serif">
                                {q.text}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {q.options.map((opt, i) => {
                                  const isCorrect = i === q.correctIndex;
                                  return (
                                    <div
                                      key={i}
                                      className={clsx(
                                        'px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between border font-serif',
                                        isCorrect
                                          ? 'bg-amber-100/90 text-[#8b1e1e] font-bold border-amber-400 shadow-xs ring-1 ring-amber-300'
                                          : 'bg-white/80 text-[#3d2f26] border-[#e2d8c6] hover:border-amber-400/60',
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={clsx(
                                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                                          isCorrect ? 'bg-[#8b1e1e] text-white' : 'bg-[#e9ded0] text-[#5c4738]',
                                        )}>
                                          {LETTERS[i]}
                                        </span>
                                        <span>{opt}</span>
                                      </div>
                                      {isCorrect && <Check className="w-4 h-4 text-[#8b1e1e] stroke-[3] shrink-0 ml-1" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </article>
                          ))
                        )}
                      </div>

                      {/* Rodapé da Página Direita com Navegação para Próxima Folha */}
                      <div className="border-t border-[#d5c6b0] pt-2 flex justify-between items-center text-xs text-[#73533e] font-serif">
                        <span>Página {spreadIndex * 2 + 2}</span>
                        {spreadIndex < totalQuestionSpreads ? (
                          <button
                            onClick={() => goToSpread(spreadIndex + 1, 'next')}
                            className="font-bold text-[#8b1e1e] hover:underline flex items-center gap-1"
                          >
                            <span>Próxima Folha ({spreadIndex + 1})</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[#73533e]/70 italic">Última folha do cânon</span>
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
      <footer className="shrink-0 border-t border-[#3d281a] bg-[#1a100b] px-6 py-2 text-center text-xs text-amber-200/60 font-serif">
        Show do Cristão • Cânon Sagrado da Igreja Presbiteriana do Brasil • Folheie com ◀ e ▶
      </footer>
    </div>
  );
}
