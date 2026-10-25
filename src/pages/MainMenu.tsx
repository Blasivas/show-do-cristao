import { useState, useRef, useEffect } from 'react';
import { Flame, Play, BookOpen, LogOut } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import ThemeToggle from '@/components/ThemeToggle';
import ConfirmDialog from '@/components/ConfirmDialog';
import { playBookOpenSound, playBookCloseSound } from '@/services/audioService';

export default function MainMenu() {
  const { goToScreen, previousScreen } = useGame();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  // Se está retornando de outra tela, monta no estado aberto e fecha com animação 3D
  const [isOpenState, setIsOpenState] = useState(() => Boolean(previousScreen));
  const [isClosingShadow, setIsClosingShadow] = useState(false);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (previousScreen) {
      isAnimatingRef.current = true;
      setIsClosingShadow(true);
      playBookCloseSound();

      // Permite que o primeiro frame registre a Bíblia aberta antes de disparar a transição
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpenState(false);
        });
      });

      const timer = setTimeout(() => {
        isAnimatingRef.current = false;
        setIsClosingShadow(false);
      }, 650);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [previousScreen]);

  const handleOpenBook = (targetScreen: 'config' | 'questions') => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    playBookOpenSound();
    setIsOpening(true);
    setIsOpenState(true);

    setTimeout(() => {
      goToScreen(targetScreen);
    }, 620);
  };

  const handleExitApp = () => {
    window.close();
  };

  const isBusy = isOpening || isAnimatingRef.current;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9] text-[#2c1d11] dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503] dark:text-[#ede6d8] flex items-center justify-center p-3 sm:p-5 font-serif select-none relative overflow-hidden transition-colors duration-200">
      {/* Controles Discretos no Canto Superior Direito: Tema e Sair */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-6 flex items-center space-x-3 z-30">
        <ThemeToggle labelClassName="text-[#73533e] dark:text-amber-200/80 font-medium" />
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5c6b0] dark:border-[#3d281a] bg-white/70 dark:bg-[#1a0f08] text-[#73533e] dark:text-amber-200/70 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-900/60 transition-all cursor-pointer shadow-xs"
          title="Encerrar o aplicativo"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* ÁREA CENTRAL: PERSPECTIVA 3D DA BÍBLIA SAGRADA */}
      <main
        className="flex items-center justify-center my-auto w-full min-h-0 relative"
        style={{ perspective: 2400, perspectiveOrigin: '50% 50%' }}
      >
        {/* Caixa Tridimensional da Bíblia:
            - Fechada: centralizada na tela, ~450px de largura.
            - Aberta / Fechando: translada +50% à direita em sincronia com o giro de -180° da capa,
              fazendo com que a lombada (eixo esquerdo) permaneça no centro exato da tela
              e o livro forme um bifólio perfeito de páginas limpas!
        */}
        <div
          id="bible-box"
          className="relative w-[360px] sm:w-[420px] md:w-[450px] lg:w-[470px] h-[520px] sm:h-[570px] md:h-[600px] lg:h-[630px]"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.65s cubic-bezier(0.45, 0.05, 0.25, 1)',
            transform: isOpenState ? 'translateX(50%)' : 'none',
          }}
        >
          {/* Fitilho de cetim no centro da costura/lombada (visível quando aberto) */}
          <div
            className="absolute -top-2 left-0 -translate-x-1/2 w-3.5 h-14 bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#881337] border-b-2 border-[#d4af37] shadow-md rounded-b-xs z-30 pointer-events-none flex items-end justify-center pb-0.5 transition-opacity duration-300"
            style={{
              opacity: isOpenState ? 1 : 0,
              transitionDelay: isOpenState ? '0.22s' : '0s',
            }}
          >
            <div className="w-1.5 h-1 bg-[#d4af37]/80 rounded-xs" />
          </div>

          {/* ========================================================== */}
          {/* MIOLO INFERIOR (Página Direita revelada por baixo da capa)  */}
          {/* Página limpa sem nenhum texto, para transição natural       */}
          {/* ========================================================== */}
          <div
            className="absolute inset-0 bg-[#faf7f0] dark:bg-[#18130e] border border-[#d5c6b0] dark:border-[#3a281c] rounded-r-xl rounded-l-xs z-5 shadow-[0_25px_60px_rgba(78,43,22,0.35),inset_0_0_60px_rgba(180,160,130,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_0_60px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Sombra da Medianiz / Lombada à esquerda */}
            <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-black/15 dark:from-black/45 to-transparent pointer-events-none" />
          </div>

          {/* ========================================================== */}
          {/* FLIPPER DA CAPA (Gira 3D em torno da lombada no lado esquerdo) */}
          {/* ========================================================== */}
          <div
            id="cover-flipper"
            className="absolute inset-0 z-20"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: 'left center',
              transition: 'transform 0.65s cubic-bezier(0.45, 0.05, 0.25, 1)',
              transform: isOpenState ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* FACE FRONTAL: Capa Externa da Bíblia Sagrada (Visível quando fechada) */}
            <div
              className="absolute inset-0 rounded-r-xl rounded-l-md bg-gradient-to-b from-[#784628] via-[#63371e] to-[#4c2815] border-2 border-[#d4af37]/80 p-6 sm:p-8 text-center shadow-[0_25px_50px_rgba(78,43,22,0.35),inset_0_0_40px_rgba(0,0,0,0.65)] flex flex-col justify-between overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
              }}
            >
              {/* Lombada e vinco de encadernação do livro */}
              <div className="absolute top-0 bottom-0 left-0 w-[7%] pointer-events-none mix-blend-overlay bg-black/45 z-20" />
              <div className="absolute top-0 bottom-0 left-0 w-[7%] pointer-events-none opacity-20 bg-amber-400/20 z-20" />

              {/* Borda dourada de espessura de corte das páginas quando fechado */}
              <div className="absolute top-2.5 bottom-2.5 -right-2 w-2 rounded-r bg-gradient-to-r from-[#b38f38] via-[#e8d59b] to-[#a38030] shadow-sm border-y border-r border-[#7a5e1f]/60 pointer-events-none" />

              {/* Moldura Dourada Clássica Interna com Cantoneiras */}
              <div className="absolute inset-3 sm:inset-4 rounded border border-[#d4af37]/50 pointer-events-none">
                <span className="absolute -top-1.5 -left-1.5 text-xs text-[#d4af37] select-none">❖</span>
                <span className="absolute -top-1.5 -right-1.5 text-xs text-[#d4af37] select-none">❖</span>
                <span className="absolute -bottom-1.5 -left-1.5 text-xs text-[#d4af37] select-none">❖</span>
                <span className="absolute -bottom-1.5 -right-1.5 text-xs text-[#d4af37] select-none">❖</span>
              </div>

              {/* Topo da Capa: Emblema e Títulos */}
              <div className="relative z-10 pt-1 sm:pt-2">
                {/* Emblema da Sarça Ardente */}
                <div className="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-2 border-[#d4af37]/90 bg-gradient-to-br from-[#4d2a15] to-[#2b170c] shadow-[0_0_25px_rgba(212,175,55,0.3)] relative">
                  <div className="absolute inset-1 rounded-full border border-[#d4af37]/40" />
                  <Flame className="h-9 w-9 sm:h-11 sm:w-11 text-[#d4af37] fill-[#d4af37]/25 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </div>

                <span className="text-[10px] sm:text-xs font-serif font-bold uppercase tracking-[0.3em] text-[#fef08a] block mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  Cânon Sagrado • IPB
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#fffbeb] via-[#fef08a] to-[#d4af37] drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] leading-tight">
                  Show do Cristão
                </h1>

                <div className="h-px w-28 sm:w-36 mx-auto bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent my-2.5 sm:my-3.5" />

                <p className="text-xs sm:text-sm text-amber-100/90 font-serif italic max-w-xs sm:max-w-sm mx-auto leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  A Grande Gincana do Conhecimento Bíblico de Auditório
                </p>
              </div>

              {/* Botões de Ação na Capa do Livro */}
              <div className="space-y-3 sm:space-y-3.5 w-full max-w-xs mx-auto relative z-10 pb-1">
                {/* 1. Iniciar Gincana */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleOpenBook('config')}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#d4af37] hover:brightness-115 text-[#1c120c] font-serif font-black py-3 sm:py-3.5 px-5 rounded-xl shadow-[0_4px_18px_rgba(212,175,55,0.45)] border border-amber-200 transition-all hover:scale-[1.02] active:scale-98 text-sm sm:text-base cursor-pointer tracking-wide disabled:opacity-90 disabled:pointer-events-none"
                >
                  <Play className="w-4 h-4 fill-current text-[#1c120c]" />
                  <span>INICIAR GINCANA</span>
                </button>

                {/* 2. Configurar Perguntas */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleOpenBook('questions')}
                  className="w-full flex items-center justify-center gap-2 bg-[#3d2212] hover:bg-[#4d2c18] text-[#fef3c7] font-serif font-bold py-2.5 sm:py-3 px-4 rounded-xl border-2 border-[#d4af37]/70 hover:border-amber-300 shadow-md transition-all active:scale-98 text-xs sm:text-sm cursor-pointer disabled:opacity-90 disabled:pointer-events-none"
                >
                  <BookOpen className="w-4 h-4 text-[#d4af37]" />
                  <span>Configurar Perguntas</span>
                </button>
              </div>
            </div>

            {/* FACE INTERNA: Página Esquerda revelada ao girar -180 graus */}
            {/* Página limpa sem nenhum texto, para transição natural      */}
            <div
              className="absolute inset-0 rounded-l-xl rounded-r-xs bg-[#faf7f0] dark:bg-[#18130e] border border-[#d5c6b0] dark:border-[#3a281c] shadow-[0_25px_60px_rgba(78,43,22,0.35),inset_0_0_60px_rgba(180,160,130,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_0_60px_rgba(0,0,0,0.8)] overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Sombra da Medianiz / Lombada à direita */}
              <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-black/15 dark:from-black/45 to-transparent pointer-events-none" />
            </div>

            {/* Sombra Dinâmica projetada durante o giro da capa (Abertura ou Fechamento) */}
            <div
              className={`absolute inset-0 pointer-events-none rounded-r-xl rounded-l-md ${
                isOpening
                  ? 'animate-cover-shadow'
                  : isClosingShadow
                  ? 'animate-cover-close-shadow'
                  : 'opacity-0'
              }`}
            />
          </div>
        </div>
      </main>

      {/* Diálogo de Confirmação para Fechar */}
      {showExitConfirm && (
        <ConfirmDialog
          title="Encerrar o Aplicativo"
          message="Tem certeza de que deseja fechar o Show do Cristão?"
          cancelLabel="Cancelar"
          onCancel={() => setShowExitConfirm(false)}
          actions={[
            {
              label: 'Sim, Sair',
              variant: 'danger',
              onClick: handleExitApp,
            },
          ]}
        />
      )}
    </div>
  );
}
