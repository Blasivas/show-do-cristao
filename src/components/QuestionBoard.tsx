import clsx from 'clsx';
import { Check } from 'lucide-react';
import type { Difficulty, Question } from '@/types/game';
import { DIFFICULTY_LABEL } from './difficulty';
import { BookPage } from './OpenBookLayout';

interface QuestionBoardProps {
  side: 'left' | 'right';
  questions: readonly Question[];
  answeredIds?: ReadonlySet<string>;
  finished?: boolean;
  onChoose?: (number: number, card: HTMLButtonElement) => void;
}

const INDEX_SECTIONS: Record<Difficulty, { title: string; accent: string }> = {
  facil: { title: 'Perguntas fáceis', accent: 'text-[#245b3c] dark:text-emerald-300' },
  medio: { title: 'Perguntas médias', accent: 'text-[#795511] dark:text-amber-300' },
  dificil: { title: 'Perguntas difíceis', accent: 'text-[#8b2942] dark:text-rose-300' },
};

export default function QuestionBoard({ side, questions, answeredIds, finished, onChoose }: QuestionBoardProps) {
  const middle = Math.ceil(questions.length / 2);
  const start = side === 'left' ? 0 : middle;
  const end = side === 'left' ? middle : questions.length;
  const pageNumber = side === 'left' ? 3 : 4;
  const range = start < end ? `Perguntas ${start + 1}–${end}` : undefined;
  const sections: { difficulty: Difficulty; entries: { question: Question; number: number }[] }[] = [];

  // Uma seção pode continuar na folha seguinte. A posição no cadastro define o número.
  for (let index = start; index < end; index++) {
    const question = questions[index];
    let section = sections[sections.length - 1];
    if (section?.difficulty !== question.difficulty) {
      section = { difficulty: question.difficulty, entries: [] };
      sections.push(section);
    }
    section.entries.push({ question, number: index + 1 });
  }

  return (
    <BookPage side={side} title="Índice de perguntas" subtitle={range} pageNumber={pageNumber}>
      <div data-board-scroll role={onChoose ? 'region' : undefined} aria-label={onChoose ? range : undefined} tabIndex={onChoose ? 0 : undefined} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-1.5 py-1">
        {sections.map(({ difficulty, entries }) => (
          <section key={entries[0].number} aria-label={INDEX_SECTIONS[difficulty].title}>
            {questions[entries[0].number - 2]?.difficulty !== difficulty && (
              <h2 className={clsx('border-b border-[#cdbb9d] px-2 pb-1 text-base font-bold leading-tight xl:text-lg dark:border-[#5c432e]', INDEX_SECTIONS[difficulty].accent)}>
                {INDEX_SECTIONS[difficulty].title}
              </h2>
            )}
            <ol start={entries[0].number} className="list-none">
              {entries.map(({ question, number }) => {
                const answered = answeredIds?.has(question.id);
                const className = clsx(
                  'flex h-[clamp(2rem,5.2vh,3.25rem)] w-full items-center gap-2 rounded-sm px-2 text-base leading-none xl:text-lg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#8b1e1e] dark:focus-visible:outline-[#e6cc8c] motion-safe:transition-colors',
                  answered || finished
                    ? 'cursor-default bg-[#eee7db] text-[#6d6054] dark:bg-[#211a14] dark:text-[#ae9e90]'
                    : 'text-[#3c2a1d] enabled:hover:bg-[#f4e8cd] dark:text-[#ede0ce] dark:enabled:hover:bg-[#312218]',
                );
                const content = (
                  <>
                    <span>Pergunta</span>
                    {answered && (
                      <span className="flex shrink-0 items-center gap-1 font-sans text-[11px] leading-tight">
                        <Check aria-hidden="true" className="size-3" /> Respondida
                      </span>
                    )}
                    <span aria-hidden="true" className="h-0 flex-1 self-center translate-y-1 border-b-2 border-dotted border-[#ab987e]/65 dark:border-[#af9477]/55" />
                    <span className={clsx('min-w-[2ch] text-right text-lg font-bold tabular-nums xl:text-xl', !answered && !finished && INDEX_SECTIONS[difficulty].accent)}>{number}</span>
                  </>
                );

                return (
                  <li key={question.id}>
                    {onChoose ? (
                      <button
                        type="button"
                        data-question-number={number}
                        aria-label={`Pergunta ${number}, ${DIFFICULTY_LABEL[difficulty]}${answered ? ', respondida' : ''}`}
                        disabled={answered || finished}
                        onClick={(event) => onChoose(number, event.currentTarget)}
                        className={className}
                      >
                        {content}
                      </button>
                    ) : <div className={className}>{content}</div>}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </BookPage>
  );
}
