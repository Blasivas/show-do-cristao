import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import OpenBookLayout from '@/components/OpenBookLayout';
import QuestionBoard from '@/components/QuestionBoard';
import { useGame } from '@/contexts/GameContext';
import { getAnsweredIds } from '@/game/engine';
import { getTeamPresetById } from '@/game/teams';
import QuestionView from './QuestionView';

export default function GameBoard() {
  const { gameState, currentTeam, nextTeam, activeQuestion, openQuestion, resolveCurrentQuestion, goToScreen, resetGame, isGameOver } = useGame();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [openingFrom, setOpeningFrom] = useState<DOMRect | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const lastChosen = useRef<number | null>(null);
  const choosing = useRef(false);
  const restoreEndFocus = useRef(false);
  const viewingQuestion = activeQuestion !== null;
  const finishOpening = useCallback(() => setOpeningFrom(null), []);

  useLayoutEffect(() => {
    if (viewingQuestion) return;
    choosing.current = false;
    const number = lastChosen.current;
    const card = number === null ? null : board.current?.querySelector<HTMLButtonElement>(`[data-question-number="${number}"]:not(:disabled)`);
    (card ?? heading.current)?.focus({ preventScroll: true });
  }, [viewingQuestion]);

  useLayoutEffect(() => {
    if (confirmEnd || !restoreEndFocus.current) return;
    restoreEndFocus.current = false;
    board.current?.querySelector<HTMLButtonElement>('[data-book-primary]')?.focus();
  }, [confirmEnd]);

  if (!gameState || !currentTeam) {
    return (
      <main className="flex h-full flex-col items-center justify-center gap-4">
        <p>Nenhuma partida em andamento.</p>
        <button type="button" className="underline" onClick={resetGame}>Voltar ao menu inicial</button>
      </main>
    );
  }

  const answeredIds = getAnsweredIds(gameState);
  const remaining = gameState.questions.length - answeredIds.size;
  const teamPreset = getTeamPresetById(currentTeam.id);
  const inactive = confirmEnd || viewingQuestion;
  const inactiveProps = inactive ? { inert: '' } : {};

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9] font-serif text-[#2c1d11] dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503] dark:text-[#ede6d8]">
      <div ref={board} data-game-board="true" hidden={viewingQuestion && !openingFrom} aria-hidden={inactive || undefined} {...inactiveProps} className="isolate h-full">
        <OpenBookLayout
          title="Mural da Gincana Bíblica"
          headingRef={heading}
          onBack={() => setConfirmEnd(true)}
          primaryAction={{ label: 'Encerrar Gincana', icon: <Flag aria-hidden="true" className="size-4" />, onClick: () => setConfirmEnd(true) }}
          toolbar={
            <div className="flex w-full items-center justify-between gap-4">
              <p className="truncate" aria-live="polite">
                {isGameOver ? (remaining === 0 ? 'Todas as perguntas foram respondidas' : 'Partida encerrada') : (
                  <>Vez de escolher{' '}<strong className={teamPreset?.theme.configAccent} title={currentTeam.name}>{currentTeam.name}</strong></>
                )}
              </p>
              <p className="shrink-0 tabular-nums"><strong>{remaining}</strong> de {gameState.questions.length} disponíveis</p>
            </div>
          }
        >
          {(['left', 'right'] as const).map(side => (
            <QuestionBoard key={side} side={side} questions={gameState.questions} answeredIds={answeredIds} finished={gameState.finished} onChoose={(number, card) => {
              if (choosing.current || confirmEnd) return;
              choosing.current = true;
              lastChosen.current = number;
              setOpeningFrom(card.getBoundingClientRect());
              openQuestion(number);
            }} />
          ))}
        </OpenBookLayout>
      </div>

      {activeQuestion && (
        <QuestionView
          {...activeQuestion}
          team={currentTeam}
          stealTeam={gameState.config.allowSteal ? nextTeam : null}
          timerSeconds={gameState.config.timerSeconds}
          openingFrom={openingFrom}
          onOpened={finishOpening}
          onBack={(result, stealResult) => {
            finishOpening();
            if (result) resolveCurrentQuestion(activeQuestion.question.id, result, stealResult);
            else goToScreen('board');
          }}
        />
      )}

      {confirmEnd && (
        <ConfirmDialog
          title="Encerrar a Partida"
          message="Deseja encerrar a gincana atual e voltar ao menu inicial?"
          cancelLabel="Continuar Partida"
          onCancel={() => { restoreEndFocus.current = true; setConfirmEnd(false); }}
          actions={[{ label: 'Sim, Encerrar', variant: 'danger', onClick: resetGame }]}
        />
      )}
    </div>
  );
}
