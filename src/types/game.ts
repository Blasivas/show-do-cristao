export type Difficulty = 'facil' | 'medio' | 'dificil';

export type AnswerResult = 'correct' | 'wrong';

export interface Question {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  difficulty: Difficulty;
}

export interface Team {
  id: string;
  name: string;
}

export interface GameConfig {
  /** Equipes na ordem de jogo definida pelo apresentador: a primeira começa */
  teams: Team[];
  /** Tempo do cronômetro por pergunta; `null` = sem tempo (apenas indicativo, decisão D2) */
  timerSeconds: number | null;
  allowSteal: boolean;
}

/** Registro de uma pergunta já decidida pelo apresentador */
export interface Play {
  questionId: string;
  teamId: string;
  result: AnswerResult;
  points: number;
  steal?: {
    teamId: string;
    result: AnswerResult;
    points: number;
  };
}

/**
 * Estado mínimo da partida. Pontuação, equipe da vez e perguntas respondidas
 * são derivadas do histórico, o que torna o "desfazer" trivial.
 */
export interface GameState {
  config: GameConfig;
  questions: Question[];
  history: Play[];
  finished: boolean;
}

export interface TeamScore {
  team: Team;
  score: number;
}
