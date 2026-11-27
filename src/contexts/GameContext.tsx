import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AnswerResult, GameConfig, GameState, Question, Team, TeamScore } from '@/types/game';
import {
  createGame,
  getCurrentTeam,
  getNextTeam,
  getAvailableQuestions,
  getAnsweredIds,
  getScores,
  getRanking,
  getWinners,
  isGameOver,
  resolveQuestion,
  undoLastPlay,
  finishGame,
} from '@/game/engine';

export type Screen = 'menu' | 'questions' | 'config' | 'board' | 'question-view' | 'podium';

interface GameContextType {
  screen: Screen;
  previousScreen: Screen | null;
  goToScreen: (screen: Screen) => void;
  gameState: GameState | null;
  startGame: (config: GameConfig, questions: Question[]) => void;
  openQuestion: (number: number) => void;
  activeQuestion: { number: number; question: Question } | null;
  resolveCurrentQuestion: (questionId: string, result: AnswerResult, stealResult?: AnswerResult) => void;
  undo: () => void;
  endGame: () => void;
  resetGame: () => void;
  currentTeam: Team | null;
  nextTeam: Team | null;
  availableQuestions: Question[];
  scores: Record<string, number>;
  ranking: TeamScore[];
  winners: Team[];
  isGameOver: boolean;
}

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'START_GAME'; config: GameConfig; questions: Question[] }
  | { type: 'OPEN_QUESTION'; number: number }
  | { type: 'RESOLVE_QUESTION'; questionId: string; result: AnswerResult; stealResult?: AnswerResult }
  | { type: 'UNDO' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' };

interface State {
  screen: Screen;
  previousScreen: Screen | null;
  gameState: GameState | null;
  activeQuestionNumber: number | null;
}

const initialState: State = {
  screen: 'menu',
  previousScreen: null,
  gameState: null,
  activeQuestionNumber: null,
};

function gameReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SCREEN':
      return {
        ...state,
        previousScreen: state.screen,
        screen: action.screen,
        activeQuestionNumber: null,
      };

    case 'START_GAME':
      return {
        screen: 'board',
        previousScreen: state.screen,
        gameState: createGame(action.config, action.questions),
        activeQuestionNumber: null,
      };

    case 'OPEN_QUESTION': {
      const { gameState } = state;
      if (state.screen !== 'board' || !gameState || gameState.finished || !Number.isInteger(action.number)) return state;
      const question = gameState.questions[action.number - 1];
      if (!question || getAnsweredIds(gameState).has(question.id)) return state;
      return { ...state, screen: 'question-view', previousScreen: state.screen, activeQuestionNumber: action.number };
    }

    case 'RESOLVE_QUESTION': {
      const { gameState, activeQuestionNumber } = state;
      if (state.screen !== 'question-view' || !gameState || activeQuestionNumber === null) return state;
      const question = gameState.questions[activeQuestionNumber - 1];
      if (question?.id !== action.questionId) return state;
      return {
        screen: 'board',
        previousScreen: state.screen,
        gameState: resolveQuestion(gameState, question.id, action.result, action.stealResult),
        activeQuestionNumber: null,
      };
    }

    case 'UNDO': {
      if (!state.gameState) return state;
      return {
        ...state,
        gameState: undoLastPlay(state.gameState),
      };
    }

    case 'END_GAME': {
      if (!state.gameState) return state;
      return {
        screen: 'podium',
        previousScreen: state.screen,
        gameState: finishGame(state.gameState),
        activeQuestionNumber: null,
      };
    }

    case 'RESET_GAME':
      return {
        screen: 'menu',
        previousScreen: state.screen,
        gameState: null,
        activeQuestionNumber: null,
      };

    default:
      return state;
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const goToScreen = (screen: Screen) => dispatch({ type: 'SET_SCREEN', screen });
  const startGame = (config: GameConfig, questions: Question[]) =>
    dispatch({ type: 'START_GAME', config, questions });
  const openQuestion = (number: number) => dispatch({ type: 'OPEN_QUESTION', number });
  const resolveCurrentQuestion = (questionId: string, result: AnswerResult, stealResult?: AnswerResult) =>
    dispatch({ type: 'RESOLVE_QUESTION', questionId, result, stealResult });
  const undo = () => dispatch({ type: 'UNDO' });
  const endGame = () => dispatch({ type: 'END_GAME' });
  const resetGame = () => dispatch({ type: 'RESET_GAME' });

  const currentTeam = state.gameState ? getCurrentTeam(state.gameState) : null;
  const nextTeam = state.gameState ? getNextTeam(state.gameState) : null;
  const availableQuestions = state.gameState ? getAvailableQuestions(state.gameState) : [];
  const scores = state.gameState ? getScores(state.gameState) : {};
  const ranking = state.gameState ? getRanking(state.gameState) : [];
  const winners = state.gameState ? getWinners(state.gameState) : [];
  const gameOver = state.gameState ? isGameOver(state.gameState) : false;
  const number = state.activeQuestionNumber;
  const question = number === null ? undefined : state.gameState?.questions[number - 1];
  const activeQuestion = number !== null && question ? { number, question } : null;

  return (
    <GameContext.Provider
      value={{
        screen: state.screen,
        previousScreen: state.previousScreen,
        goToScreen,
        gameState: state.gameState,
        startGame,
        openQuestion,
        activeQuestion,
        resolveCurrentQuestion,
        undo,
        endGame,
        resetGame,
        currentTeam,
        nextTeam,
        availableQuestions,
        scores,
        ranking,
        winners,
        isGameOver: gameOver,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve ser usado dentro de um GameProvider');
  return ctx;
}
