import { GameProvider, useGame } from '@/contexts/GameContext';
import MainMenu from '@/pages/MainMenu';
import QuestionManager from '@/pages/QuestionManager';
import GameConfig from '@/pages/GameConfig';
import BoardPlaceholder from '@/pages/BoardPlaceholder';

function GameApp() {
  const { screen, goToScreen } = useGame();

  switch (screen) {
    case 'questions':
      return <QuestionManager onBack={() => goToScreen('menu')} />;
    case 'config':
      return <GameConfig />;
    case 'board':
      return <BoardPlaceholder />;
    case 'menu':
    default:
      return <MainMenu />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}
