import { describe, expect, it } from 'vitest';
import type { GameConfig, Question } from '@/types/game';
import {
  createGame,
  finishGame,
  getAvailableQuestions,
  getCurrentTeam,
  getNextTeam,
  getRanking,
  getScores,
  getStealPoints,
  getWinners,
  isGameOver,
  resolveQuestion,
  undoLastPlay,
} from './engine';

const question = (id: string, difficulty: Question['difficulty']): Question => ({
  id,
  text: `Pergunta ${id}`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  difficulty,
});

const QUESTIONS = [question('q1', 'facil'), question('q2', 'medio'), question('q3', 'dificil'), question('q4', 'facil')];

const teams = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Equipe ${i + 1}` }));

const config = (overrides: Partial<GameConfig> = {}): GameConfig => ({
  teams: teams(2),
  timerSeconds: 10,
  allowSteal: true,
  ...overrides,
});

describe('createGame', () => {
  it('cria a partida sem histórico e com pontuação zerada', () => {
    const game = createGame(config(), QUESTIONS);
    expect(game.history).toEqual([]);
    expect(getScores(game)).toEqual({ t1: 0, t2: 0 });
  });

  it('aceita de 2 a 4 equipes', () => {
    expect(() => createGame(config({ teams: teams(1) }), QUESTIONS)).toThrow();
    expect(() => createGame(config({ teams: teams(4) }), QUESTIONS)).not.toThrow();
    expect(() => createGame(config({ teams: teams(5) }), QUESTIONS)).toThrow();
  });

  it('rejeita ids de equipe repetidos e partida sem perguntas', () => {
    expect(() => createGame(config({ teams: [teams(1)[0], teams(1)[0]] }), QUESTIONS)).toThrow();
    expect(() => createGame(config(), [])).toThrow();
  });
});

describe('pontuação', () => {
  it('acerto vale 100% dos pontos da dificuldade (10/20/30)', () => {
    let game = createGame(config(), QUESTIONS);
    game = resolveQuestion(game, 'q1', 'correct'); // t1 +10
    game = resolveQuestion(game, 'q2', 'correct'); // t2 +20
    game = resolveQuestion(game, 'q3', 'correct'); // t1 +30
    expect(getScores(game)).toEqual({ t1: 40, t2: 20 });
  });

  it('roubo certo vale 50% (5/10/15) para a próxima equipe', () => {
    expect([getStealPoints('facil'), getStealPoints('medio'), getStealPoints('dificil')]).toEqual([5, 10, 15]);
    let game = createGame(config(), QUESTIONS);
    game = resolveQuestion(game, 'q3', 'wrong', 'correct');
    expect(getScores(game)).toEqual({ t1: 0, t2: 15 });
    expect(game.history[0].steal?.teamId).toBe('t2');
  });

  it('erro sem roubo e roubo errado não pontuam', () => {
    let game = createGame(config(), QUESTIONS);
    game = resolveQuestion(game, 'q1', 'wrong');
    game = resolveQuestion(game, 'q2', 'wrong', 'wrong');
    expect(getScores(game)).toEqual({ t1: 0, t2: 0 });
  });
});

describe('ordem das equipes', () => {
  it('a primeira equipe da lista começa e a ordem da lista é respeitada', () => {
    const ordered = [
      { id: 'b', name: 'Equipe B' },
      { id: 'a', name: 'Equipe A' },
    ];
    let game = createGame(config({ teams: ordered }), QUESTIONS);
    expect(getCurrentTeam(game).id).toBe('b');
    game = resolveQuestion(game, 'q1', 'correct');
    expect(getCurrentTeam(game).id).toBe('a');
  });

  it('o roubo não altera a ordem: após A errar e B roubar, a próxima é de B', () => {
    let game = createGame(config(), QUESTIONS);
    game = resolveQuestion(game, 'q1', 'wrong', 'correct');
    expect(getCurrentTeam(game).id).toBe('t2');
    game = resolveQuestion(game, 'q2', 'wrong', 'wrong');
    expect(getCurrentTeam(game).id).toBe('t1');
  });

  it('com 3 equipes: A erra e B rouba; B responde a próxima e, se errar, C rouba', () => {
    let game = createGame(config({ teams: teams(3) }), QUESTIONS);
    expect([getCurrentTeam(game).id, getNextTeam(game).id]).toEqual(['t1', 't2']);
    game = resolveQuestion(game, 'q1', 'wrong', 'correct');
    expect(game.history[0].steal?.teamId).toBe('t2');

    expect([getCurrentTeam(game).id, getNextTeam(game).id]).toEqual(['t2', 't3']);
    game = resolveQuestion(game, 'q2', 'wrong', 'correct');
    expect(game.history[1].steal?.teamId).toBe('t3');

    expect([getCurrentTeam(game).id, getNextTeam(game).id]).toEqual(['t3', 't1']);
    expect(getScores(game)).toEqual({ t1: 0, t2: 5, t3: 10 });
  });
});

describe('validações do roubo e das perguntas', () => {
  it('impede roubo após acerto ou com a regra desativada', () => {
    const game = createGame(config(), QUESTIONS);
    expect(() => resolveQuestion(game, 'q1', 'correct', 'correct')).toThrow();
    const noSteal = createGame(config({ allowSteal: false }), QUESTIONS);
    expect(() => resolveQuestion(noSteal, 'q1', 'wrong', 'correct')).toThrow();
  });

  it('impede responder a mesma pergunta duas vezes ou uma pergunta inexistente', () => {
    const game = resolveQuestion(createGame(config(), QUESTIONS), 'q1', 'correct');
    expect(() => resolveQuestion(game, 'q1', 'correct')).toThrow();
    expect(() => resolveQuestion(game, 'q99', 'correct')).toThrow();
    expect(getAvailableQuestions(game).map((q) => q.id)).toEqual(['q2', 'q3', 'q4']);
  });

  it('não altera o estado anterior (funções puras)', () => {
    const game = createGame(config(), QUESTIONS);
    resolveQuestion(game, 'q1', 'correct');
    expect(game.history).toEqual([]);
  });
});

describe('desfazer e fim de jogo', () => {
  it('desfazer remove a última jogada, os pontos e devolve a vez', () => {
    let game = createGame(config(), QUESTIONS);
    game = resolveQuestion(game, 'q1', 'correct');
    game = resolveQuestion(game, 'q2', 'wrong', 'correct');
    game = undoLastPlay(game);
    expect(getScores(game)).toEqual({ t1: 10, t2: 0 });
    expect(getCurrentTeam(game).id).toBe('t2');
    expect(getAvailableQuestions(game).map((q) => q.id)).toContain('q2');
  });

  it('termina quando as perguntas acabam ou quando o apresentador encerra', () => {
    let game = createGame(config(), QUESTIONS.slice(0, 1));
    expect(isGameOver(game)).toBe(false);
    game = resolveQuestion(game, 'q1', 'correct');
    expect(isGameOver(game)).toBe(true);
    expect(() => resolveQuestion(game, 'q2', 'correct')).toThrow();
    expect(isGameOver(undoLastPlay(game))).toBe(false);

    const ended = finishGame(resolveQuestion(createGame(config(), QUESTIONS), 'q1', 'correct'));
    expect(isGameOver(ended)).toBe(true);
    expect(isGameOver(undoLastPlay(ended))).toBe(true);
  });

  it('ranking ordenado, vencedor único e empate', () => {
    let game = createGame(config({ teams: teams(3) }), QUESTIONS);
    game = resolveQuestion(game, 'q1', 'correct'); // t1 +10
    game = resolveQuestion(game, 'q2', 'correct'); // t2 +20
    expect(getRanking(game).map((r) => r.team.id)).toEqual(['t2', 't1', 't3']);
    expect(getWinners(game).map((t) => t.id)).toEqual(['t2']);

    game = resolveQuestion(game, 'q3', 'wrong', 'correct'); // t3 erra, t1 rouba +15
    expect(getWinners(game).map((t) => t.id)).toEqual(['t1']);
    game = resolveQuestion(game, 'q4', 'wrong', 'correct'); // t1 erra, t2 rouba +5
    expect(getWinners(game).map((t) => t.id).sort()).toEqual(['t1', 't2']);
  });
});
