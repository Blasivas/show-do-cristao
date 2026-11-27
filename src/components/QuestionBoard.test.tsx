import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { createGame, getAnsweredIds, resolveQuestion, undoLastPlay } from '@/game/engine';
import type { GameState, Question } from '@/types/game';
import QuestionBoard from './QuestionBoard';

it('mantém todos os números no mural e bloqueia somente a pergunta registrada no histórico', () => {
  const questions: Question[] = [
    { id: 'q8', text: 'Enunciado reservado', options: ['A', 'B', 'C', 'D'], correctIndex: 0, difficulty: 'facil' },
    { id: 'q2', text: 'Segundo enunciado', options: ['A', 'B', 'C', 'D'], correctIndex: 1, difficulty: 'medio' },
  ];
  const game = createGame({
    teams: [{ id: 'a', name: 'Primeira equipe' }, { id: 'b', name: 'Segunda equipe' }],
    timerSeconds: null,
    allowSteal: true,
  }, questions);
  const render = (state: GameState) => renderToStaticMarkup(
    <>
      <QuestionBoard side="left" questions={state.questions} answeredIds={getAnsweredIds(state)} finished={state.finished} onChoose={() => {}} />
      <QuestionBoard side="right" questions={state.questions} answeredIds={getAnsweredIds(state)} finished={state.finished} onChoose={() => {}} />
    </>,
  );

  const played = resolveQuestion(game, 'q2', 'wrong', 'correct');
  const markup = render(played);
  expect(markup).toMatch(/data-question-number="1" aria-label="Pergunta 1, Fácil" class=/);
  expect(markup).toMatch(/data-question-number="2" aria-label="Pergunta 2, Médio, respondida" disabled=""/);
  expect(markup).toContain('Respondida');
  expect(markup).not.toContain('Segunda equipe');
  expect(markup).not.toContain('Segundo enunciado');
  expect(render(undoLastPlay(played))).toBe(render(game));
});
