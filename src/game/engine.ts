import type { AnswerResult, Difficulty, GameConfig, GameState, Play, Question, Team, TeamScore } from '@/types/game';

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 4;

export const POINTS: Record<Difficulty, number> = {
  facil: 10,
  medio: 20,
  dificil: 30,
};

export const getPoints = (difficulty: Difficulty) => POINTS[difficulty];

/** O roubo vale sempre 50% (5, 10 ou 15 pontos) */
export const getStealPoints = (difficulty: Difficulty) => POINTS[difficulty] / 2;

export function createGame(config: GameConfig, questions: Question[]): GameState {
  const { teams } = config;
  if (teams.length < MIN_TEAMS || teams.length > MAX_TEAMS) {
    throw new Error(`A partida precisa ter entre ${MIN_TEAMS} e ${MAX_TEAMS} equipes.`);
  }
  if (new Set(teams.map((t) => t.id)).size !== teams.length) {
    throw new Error('Os identificadores das equipes devem ser únicos.');
  }
  if (questions.length === 0) {
    throw new Error('A partida precisa ter pelo menos uma pergunta.');
  }
  return { config, questions, history: [], finished: false };
}

/** As equipes se revezam a cada pergunta, na ordem definida pelo apresentador, independentemente de roubos (decisão D11) */
export function getCurrentTeam(state: GameState): Team {
  const { teams } = state.config;
  return teams[state.history.length % teams.length];
}

/** Próxima equipe na ordem: é ela quem pode roubar a pergunta atual (decisão D16) */
export function getNextTeam(state: GameState): Team {
  const { teams } = state.config;
  return teams[(state.history.length + 1) % teams.length];
}

export const getAnsweredIds = (state: GameState) => new Set(state.history.map((p) => p.questionId));

export function getAvailableQuestions(state: GameState): Question[] {
  const answered = getAnsweredIds(state);
  return state.questions.filter((q) => !answered.has(q.id));
}

export const isGameOver = (state: GameState) => state.finished || getAvailableQuestions(state).length === 0;

/**
 * Registra a decisão final do apresentador para uma pergunta.
 * `stealResult` é o resultado da tentativa de roubo, feita sempre pela próxima equipe na ordem,
 * e só é permitido após um erro, com a regra ativa.
 */
export function resolveQuestion(
  state: GameState,
  questionId: string,
  result: AnswerResult,
  stealResult?: AnswerResult,
): GameState {
  if (isGameOver(state)) throw new Error('A partida já foi encerrada.');

  const question = state.questions.find((q) => q.id === questionId);
  if (!question) throw new Error('Pergunta não encontrada.');
  if (getAnsweredIds(state).has(questionId)) throw new Error('Esta pergunta já foi respondida.');

  const team = getCurrentTeam(state);
  const play: Play = {
    questionId,
    teamId: team.id,
    result,
    points: result === 'correct' ? getPoints(question.difficulty) : 0,
  };

  if (stealResult) {
    if (result === 'correct') throw new Error('Só é possível roubar após um erro.');
    if (!state.config.allowSteal) throw new Error('O roubo não está ativo nesta partida.');
    play.steal = {
      teamId: getNextTeam(state).id,
      result: stealResult,
      points: stealResult === 'correct' ? getStealPoints(question.difficulty) : 0,
    };
  }

  return { ...state, history: [...state.history, play] };
}

/** Desfaz apenas a última jogada; não reabre uma partida encerrada pelo apresentador */
export function undoLastPlay(state: GameState): GameState {
  if (state.history.length === 0) return state;
  return { ...state, history: state.history.slice(0, -1) };
}

export const finishGame = (state: GameState): GameState => ({ ...state, finished: true });

export function getScores(state: GameState): Record<string, number> {
  const scores = Object.fromEntries(state.config.teams.map((t) => [t.id, 0]));
  for (const play of state.history) {
    scores[play.teamId] += play.points;
    if (play.steal) scores[play.steal.teamId] += play.steal.points;
  }
  return scores;
}

/** Equipes ordenadas da maior para a menor pontuação */
export function getRanking(state: GameState): TeamScore[] {
  const scores = getScores(state);
  return state.config.teams
    .map((team) => ({ team, score: scores[team.id] }))
    .sort((a, b) => b.score - a.score);
}

/** Equipe(s) com a maior pontuação; mais de uma significa empate */
export function getWinners(state: GameState): Team[] {
  const ranking = getRanking(state);
  return ranking.filter((r) => r.score === ranking[0].score).map((r) => r.team);
}
