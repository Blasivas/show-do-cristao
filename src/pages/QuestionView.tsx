import { useLayoutEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { DIFFICULTY_BADGE, DIFFICULTY_LABEL } from '@/components/difficulty';
import type { Question } from '@/types/game';

interface QuestionViewProps {
  number: number;
  question: Question;
  openingFrom: DOMRectReadOnly | null;
  onOpened: () => void;
  onBack: () => void;
}

const OPEN_DURATION = 460;

export default function QuestionView({ number, question, openingFrom, onOpened, onBack }: QuestionViewProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const paper = useRef<HTMLElement>(null);
  const print = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);

  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

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
      <div className="relative mx-auto flex h-full w-full max-w-[90rem] flex-col px-4 sm:px-7">
        <header ref={header} className="flex shrink-0 items-center justify-between gap-4 border-b border-[#d5c6b0] py-3 dark:border-[#51351f]">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-[#d5c6b0] bg-[#fffcf5] px-3 py-2 text-sm font-bold hover:bg-[#f5ebd7] focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-[#7b5939] dark:bg-[#2d1d13] dark:hover:bg-[#3d2719]">
            <ArrowLeft aria-hidden="true" className="size-4" /> Voltar ao mural
          </button>
          <ThemeToggle labelClassName="text-[#73533e] dark:text-[#ead4a6] font-medium" />
        </header>
        <main className="grid min-h-0 flex-1 items-center py-6">
          <section ref={paper} aria-labelledby="active-question-title" className="mx-auto max-h-full w-full max-w-5xl overflow-y-auto rounded-2xl border-4 border-[#4c3020] bg-[#fffaf0] px-6 py-8 shadow-md sm:px-12 sm:py-12 dark:border-[#4c301e] dark:bg-[#20160e]">
            <div ref={print}>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <h1 ref={heading} id="active-question-title" tabIndex={-1} className="text-xl font-bold text-[#881f25] outline-none dark:text-[#f1d293]">Pergunta {number}</h1>
                <span className={`rounded-full border px-3 py-0.5 font-sans text-sm font-bold ${DIFFICULTY_BADGE[question.difficulty]}`}>{DIFFICULTY_LABEL[question.difficulty]}</span>
              </div>
              <p className="break-words text-[clamp(1.75rem,3.3vw,3.25rem)] font-bold leading-tight">{question.text}</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
