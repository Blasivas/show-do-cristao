import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AnswerResult, GameConfig, GameState, Question, Team, TeamScore } from '@/types/game';
import {
  createGame,
  getCurrentTeam,
  getNextTeam,
  getAvailableQuestions,
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
  | { type: 'RESOLVE_QUESTION'; questionId: string; result: AnswerResult; stealResult?: AnswerResult }
  | { type: 'UNDO' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' };

interface State {
  screen: Screen;
  previousScreen: Screen | null;
  gameState: GameState | null;
}

const initialState: State = {
  screen: 'menu',
  previousScreen: null,
  gameState: null,
};

function gameReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SCREEN':
      return {
        ...state,
        previousScreen: state.screen,
        screen: action.screen,
      };

    case 'START_GAME':
      return {
        screen: 'board',
        previousScreen: state.screen,
        gameState: createGame(action.config, action.questions),
      };

    case 'RESOLVE_QUESTION': {
      if (!state.gameState) return state;
      const nextGame = resolveQuestion(state.gameState, action.questionId, action.result, action.stealResult);
      return {
        ...state,
        gameState: nextGame,
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
      };
    }

    case 'RESET_GAME':
      return {
        screen: 'menu',
        previousScreen: state.screen,
        gameState: null,
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

  return (
    <GameContext.Provider
      value={{
        screen: state.screen,
        previousScreen: state.previousScreen,
        goToScreen,
        gameState: state.gameState,
        startGame,
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
