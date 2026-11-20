import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from '@/contexts/GameContext';
import MainMenu from '@/pages/MainMenu';
import QuestionManager from '@/pages/QuestionManager';
import GameConfig from '@/pages/GameConfig';
import BoardPlaceholder from '@/pages/BoardPlaceholder';
import { useBookTransition, type BookMotion } from '@/components/useBookTransition';
import { playBookOpenSound, playBookCloseSound } from '@/services/audioService';

type BookScreen = 'questions' | 'config';

function GameApp() {
  const { screen, goToScreen } = useGame();
  const menuScreen = screen !== 'questions' && screen !== 'config' && screen !== 'board';
  const [motion, setMotion] = useState<BookMotion | null>(null);
  const activeMotion = useRef<BookMotion | null>(null);
  const focusAfterMotion = useRef<{ screen: 'menu' | BookScreen; target: BookScreen } | null>(null);

  const openBook = (target: BookScreen, startTransform: string) => {
    if (activeMotion.current || !menuScreen) return;
    const next: BookMotion = { direction: 'opening', target, startTransform };
    activeMotion.current = next;
    playBookOpenSound();
    setMotion(next);
  };

  const closeBook = () => {
    if (activeMotion.current || (screen !== 'questions' && screen !== 'config')) return;
    const next: BookMotion = { direction: 'closing', target: screen, startTransform: 'rotateX(4deg) rotateY(-10deg)' };
    activeMotion.current = next;
    playBookCloseSound();
    setMotion(next);
  };

  const finishMotion = useCallback(() => {
    const current = activeMotion.current;
    if (!current) return;
    activeMotion.current = null;
    const nextScreen = current.direction === 'opening' ? current.target : 'menu';
    focusAfterMotion.current = { screen: nextScreen, target: current.target };
    goToScreen(nextScreen);
    setMotion(null);
  }, [goToScreen]);

  useBookTransition(motion, finishMotion);

  useLayoutEffect(() => {
    if (motion || !focusAfterMotion.current) return;
    const next = focusAfterMotion.current;
    focusAfterMotion.current = null;
    const selector = next.screen === 'menu'
      ? `[data-menu-target="${next.target}"]`
      : '[aria-label="Voltar ao menu inicial"]';
    document.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
  }, [motion, screen]);

  useLayoutEffect(() => () => { activeMotion.current = null; }, []);

  const destination = motion?.target ?? (screen === 'questions' || screen === 'config' ? screen : null);
  const inactiveProps = motion ? { inert: '' } : {};

  if (screen === 'board' && !motion) return <BoardPlaceholder />;

  return (
    <div data-book-navigation="true" data-book-transition={motion?.direction} aria-busy={Boolean(motion)} className="relative h-full w-full overflow-hidden">
      {destination && (
        <div key={destination} data-book-destination={destination} {...inactiveProps} aria-hidden={motion ? true : undefined} className="absolute inset-0 h-full w-full">
          {destination === 'questions' ? <QuestionManager onBack={closeBook} /> : <GameConfig onBack={closeBook} />}
        </div>
      )}
      {(menuScreen || motion) && (
        <div key="menu" data-book-menu="true" {...inactiveProps} aria-hidden={motion ? true : undefined} className="absolute inset-0 h-full w-full">
          <MainMenu busy={Boolean(motion)} onOpen={openBook} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}
