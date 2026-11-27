import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Timer, { useQuestionTimer } from '@/components/Timer';
import { DIFFICULTY_BADGE, DIFFICULTY_LABEL } from '@/components/difficulty';
import { getTeamPresetById } from '@/game/teams';
import type { AnswerResult, Question, Team } from '@/types/game';

interface QuestionViewProps {
  number: number;
  question: Question;
  team: Team;
  stealTeam: Team | null;
  timerSeconds: number | null;
  openingFrom: DOMRectReadOnly | null;
  onOpened: () => void;
  onBack: (result?: AnswerResult, stealResult?: AnswerResult) => void;
}

const OPEN_DURATION = 460;
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const CONTROL = 'rounded-md border px-3 py-2 font-sans text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';
const NEUTRAL_CONTROL = `${CONTROL} border-[#d5c6b0] bg-[#fffcf5] hover:bg-[#f5ebd7] dark:border-[#775638] dark:bg-[#271a10] dark:hover:bg-[#3d2719]`;
const PRIMARY_CONTROL = `${CONTROL} border-[#90632b] bg-[#fae8bc] text-[#633b10] enabled:hover:bg-[#f6d89b] dark:border-[#d9aa5a] dark:bg-[#503519] dark:text-[#f9e4b3] dark:enabled:hover:bg-[#684823]`;

type Round =
  | { phase: 'answering' | 'offer-steal' }
  | { phase: 'steal'; eliminatedIndex: number }
  | { phase: 'resolved'; result: AnswerResult; eliminatedIndex?: number };

export default function QuestionView({
  number, question, team, stealTeam, timerSeconds, openingFrom, onOpened, onBack,
}: QuestionViewProps) {
  const [round, setRound] = useState<Round>({ phase: 'answering' });
  const [selection, setSelection] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const paper = useRef<HTMLElement>(null);
  const print = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const correctOption = useRef<HTMLButtonElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  const footer = useRef<HTMLElement>(null);
  const roundStatus = useRef<HTMLParagraphElement>(null);
  const timer = useQuestionTimer(timerSeconds, !openingFrom);
  const resolved = round.phase === 'resolved';
  const wrong = round.phase === 'offer-steal' || (resolved && round.result === 'wrong');
  const eliminatedIndex = round.phase === 'steal' || resolved ? round.eliminatedIndex : undefined;
  const stealing = eliminatedIndex !== undefined;
  const answering = round.phase === 'answering' || round.phase === 'steal';
  const respondingTeam = stealing && stealTeam ? stealTeam : team;
  const teamAccent = getTeamPresetById(respondingTeam.id)?.theme.configAccent;

  useLayoutEffect(() => {
    const target = round.phase === 'offer-steal' || round.phase === 'resolved' ? roundStatus : heading;
    target.current?.focus({ preventScroll: true });
    if (round.phase === 'resolved') correctOption.current?.scrollIntoView({ block: 'nearest' });
  }, [round.phase]);

  function confirmAnswer() {
    if (!answering || openingFrom || selection === null || selection === eliminatedIndex) return;
    const result = selection === question.correctIndex ? 'correct' : 'wrong';
    timer.stop();
    if (result === 'wrong' && round.phase === 'answering' && stealTeam) {
      setRound({ phase: 'offer-steal' });
      return;
    }
    setRound({ phase: 'resolved', result, eliminatedIndex });
  }

  function offerSteal() {
    if (round.phase !== 'offer-steal' || selection === null) return;
    setRound({ phase: 'steal', eliminatedIndex: selection });
    setSelection(null);
    if (body.current) body.current.scrollTop = 0;
    timer.start();
  }

  function returnToBoard() {
    if (round.phase === 'resolved') {
      if (stealing) onBack('wrong', round.result);
      else onBack(round.result);
    } else if (round.phase === 'offer-steal' || round.phase === 'steal') {
      onBack('wrong');
    } else {
      onBack();
    }
  }

  useLayoutEffect(() => {
    if (!openingFrom) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sheet = paper.current;
    const target = sheet?.getBoundingClientRect();
    if (motion.matches || document.hidden || !sheet || !target?.width || !target.height || !openingFrom.width || !openingFrom.height) {
      onOpened();
      return;
    }

    // A folha ocupa inicialmente a área do cartão, depois ganha altura e repousa no centro.
    const x = openingFrom.x - target.x + (openingFrom.width - target.width) / 2;
    const y = openingFrom.y - target.y + (openingFrom.height - target.height) / 2;
    const scaleX = openingFrom.width / target.width;
    const scaleY = openingFrom.height / target.height;
    const options = { duration: OPEN_DURATION, easing: 'cubic-bezier(0.22, 0.7, 0.24, 1)', fill: 'both' as const };
    const turn = sheet.animate([
      { transform: `translate(${x}px, ${y}px) perspective(1200px) rotateX(14deg) scale(${scaleX}, ${scaleY})`, opacity: 0.55 },
      { transform: 'translate(0px, 0px) perspective(1200px) rotateX(0deg) scale(1, 1)', opacity: 1 },
    ], options);
    turn.id = 'question-paper-open';
    const reveal = [{ opacity: 0 }, { opacity: 0, offset: 0.37 }, { opacity: 1 }];
    const animations = [
      turn,
      backdrop.current?.animate([{ opacity: 0 }, { opacity: 1 }], options),
      print.current?.animate(reveal, options),
      header.current?.animate(reveal, options),
      footer.current?.animate(reveal, options),
    ];
    const finish = () => onOpened();
    const reduce = () => { if (motion.matches) finish(); };
    const hide = () => { if (document.hidden) finish(); };
    motion.addEventListener('change', reduce);
    document.addEventListener('visibilitychange', hide);
    void turn.finished.then(finish, () => {});
    return () => {
      motion.removeEventListener('change', reduce);
      document.removeEventListener('visibilitychange', hide);
      animations.forEach((animation) => animation?.cancel());
    };
  }, [openingFrom, onOpened]);

  return (
    <div className="absolute inset-0 z-1" data-question-opening={openingFrom ? 'true' : undefined}>
      <div ref={backdrop} aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9] dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503]" />
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col px-4 sm:px-7">
        <header ref={header} className="flex shrink-0 items-center justify-between gap-4 border-b border-[#d5c6b0] py-3 dark:border-[#51351f]">
          <button type="button" onClick={returnToBoard} className="inline-flex items-center gap-2 rounded-lg border border-[#d5c6b0] bg-[#fffcf5] px-3 py-2 text-sm font-bold hover:bg-[#f5ebd7] focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-[#7b5939] dark:bg-[#2d1d13] dark:hover:bg-[#3d2719]">
            <ArrowLeft aria-hidden="true" className="size-4" /> Voltar ao mural
          </button>
          <ThemeToggle labelClassName="text-[#73533e] dark:text-[#ead4a6] font-medium" />
        </header>
        <main className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] items-center py-4">
          <section ref={paper} aria-labelledby="active-question-title" className="mx-auto flex max-h-full w-full flex-col rounded-2xl border-4 border-[#4c3020] bg-[#fffaf0] px-5 py-5 shadow-md sm:px-9 dark:border-[#6a4a31] dark:bg-[#20160e]">
            <div ref={print} className="flex min-h-0 flex-col">
              <div className="mb-4 flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[#ded0bb] px-1 pb-3 dark:border-[#5a412a]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h1 ref={heading} id="active-question-title" tabIndex={-1} className="text-xl font-bold text-[#881f25] outline-none dark:text-[#f1d293]">Pergunta {number}</h1>
                    <span className={`rounded-full border px-3 py-0.5 font-sans text-sm font-bold ${DIFFICULTY_BADGE[question.difficulty]}`}>{DIFFICULTY_LABEL[question.difficulty]}</span>
                  </div>
                  <p className="mt-1 break-words text-sm font-medium sm:text-base">
                    {stealing ? 'Chance de roubo para ' : 'Vez de '}<strong className={teamAccent}>{respondingTeam.name}</strong>
                  </p>
                </div>
                {timer.duration > 0 && <Timer duration={timer.duration} remaining={timer.remaining} running={timer.running} />}
              </div>
              <div ref={body} data-question-content className="min-h-0 overflow-y-auto px-1 pb-1">
                <p className="mb-5 break-words text-[clamp(1.65rem,2.55vw,3rem)] font-bold leading-tight">{question.text}</p>
                <ol aria-label="Alternativas" className="grid gap-2">
                  {question.options.map((option, index) => {
                    const chosen = selection === index;
                    const correct = resolved && question.correctIndex === index;
                    const incorrect = chosen && wrong;
                    const eliminated = index === eliminatedIndex;
                    let appearance = 'border-[#d5c6b0] bg-[#fcf6ea] enabled:hover:border-[#95601a] enabled:hover:bg-[#f6e9d3] dark:border-[#684b31] dark:bg-[#2c1e13] dark:enabled:hover:border-[#d9aa5a] dark:enabled:hover:bg-[#3d2919]';
                    if (eliminated) {
                      appearance = 'cursor-not-allowed border-[#d5c6b0] bg-[#f7f0e2] text-[#654f3b] opacity-60 dark:border-[#684b31] dark:bg-[#2c1e13] dark:text-[#cdbb9f]';
                    } else if (correct) {
                      appearance = 'border-emerald-700 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100';
                    } else if (incorrect) {
                      appearance = 'border-rose-700 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-100';
                    } else if (chosen) {
                      appearance = 'border-[#95601a] bg-[#fae8bc] dark:border-[#d9aa5a] dark:bg-[#503519]';
                    }

                    return (
                      <li key={index}>
                        <button ref={correct ? correctOption : undefined} type="button" aria-pressed={chosen} disabled={eliminated || !answering || Boolean(openingFrom)} onClick={() => setSelection(index)} className={`flex min-h-12 w-full items-center gap-4 rounded-lg border px-3 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 ${appearance}`}>
                          <span className="grid size-8 shrink-0 place-items-center rounded-md border border-current/30 font-sans text-base font-extrabold">{OPTION_LETTERS[index]}</span>
                          <span className={`min-w-0 flex-1 break-words text-[clamp(1.125rem,1.6vw,1.6rem)] font-semibold leading-snug ${eliminated ? 'line-through' : ''}`}>{option}</span>
                          {eliminated && <span className="shrink-0 font-sans text-sm font-bold">Eliminada</span>}
                          {(correct || incorrect) && (
                            <span className="flex shrink-0 items-center gap-1.5 font-sans text-sm font-bold">
                              {correct ? <><Check aria-hidden="true" className="size-5" /> Resposta correta</> : <><X aria-hidden="true" className="size-5" /> Incorreta</>}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </section>
        </main>
        <footer ref={footer} className="flex min-h-15 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[#d5c6b0] py-2 font-sans text-sm dark:border-[#51351f]">
          {!answering && (
            <p ref={roundStatus} role="status" tabIndex={-1} className={`font-bold outline-none ${wrong ? 'text-rose-800 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
              {wrong ? 'Resposta incorreta.' : 'Resposta correta.'}
              {round.phase === 'offer-steal' && <> {stealTeam?.name} pode tentar o roubo.</>}
            </p>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {answering && (
              <button type="button" className={PRIMARY_CONTROL} disabled={Boolean(openingFrom) || selection === null} onClick={confirmAnswer}>Confirmar resposta</button>
            )}
            {round.phase === 'offer-steal' && (
              <>
                <button type="button" className={NEUTRAL_CONTROL} onClick={() => setRound({ phase: 'resolved', result: 'wrong' })}>Revelar resposta</button>
                <button type="button" className={PRIMARY_CONTROL} onClick={offerSteal}>Dar chance de roubo</button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
