import { useState, useRef, useLayoutEffect } from 'react';
import { Flame, Play, BookOpen, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useBibleTilt } from '@/components/useBibleTilt';

interface MainMenuProps {
  busy: boolean;
  onOpen: (target: 'config' | 'questions', startTransform: string) => void;
}

export default function MainMenu({ busy, onOpen }: MainMenuProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isAnimatingRef = useRef(busy);
  const isBusy = busy;
  const tilt = useBibleTilt(isBusy || showExitConfirm, busy);

  useLayoutEffect(() => { isAnimatingRef.current = busy; }, [busy]);

  const handleOpenBook = (targetScreen: 'config' | 'questions') => {
    if (busy || isAnimatingRef.current) return;
    const element = document.querySelector('#bible-tilt');
    const startTransform = element ? getComputedStyle(element).transform : 'rotateX(4deg) rotateY(-10deg)';
    isAnimatingRef.current = true;
    onOpen(targetScreen, startTransform);
  };

  const handleExitApp = () => {
    window.close();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9] text-[#2c1d11] dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503] dark:text-[#ede6d8] flex items-center justify-center p-3 sm:p-5 font-serif select-none relative overflow-hidden transition-colors duration-200">
      {/* Controles Discretos no Canto Superior Direito: Tema e Sair */}
      <div data-book-menu-controls="true" className="absolute top-4 right-4 sm:top-5 sm:right-6 flex items-center space-x-3 z-30">
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
      <main className="flex items-center justify-center my-auto w-full min-h-0 relative">
        <div
          id="bible-stage"
          ref={tilt.stageRef}
          className="bible-stage"
          data-motion-disabled={tilt.disabled}
          data-book-busy={isBusy}
          onPointerMove={tilt.onPointerMove}
          onPointerLeave={tilt.onPointerLeave}
          onPointerCancel={tilt.onPointerLeave}
        >
          <div className="bible-ground-shadow" aria-hidden="true" />
          <div id="bible-tilt" className="bible-tilt">
            {/* O volume, o giro da capa e o encaixe nas páginas seguem a mesma progressão. */}
            <div
              id="bible-box"
              className="bible-volume"
            >
              {/* Faces físicas: ficam fora do recorte da capa e ocupam a profundidade do livro. */}
              <div className="bible-back-cover" aria-hidden="true" />
              <div className="bible-spine" aria-hidden="true" />
              <div className="bible-page-edge bible-page-edge-right" aria-hidden="true" />
              <div className="bible-page-edge bible-page-edge-top" aria-hidden="true" />
              <div className="bible-page-edge bible-page-edge-bottom" aria-hidden="true" />
              {/* Fitilho de cetim no centro da costura/lombada (visível quando aberto) */}
              <div
                data-book-ribbon="true"
                className="absolute -top-2 left-0 -translate-x-1/2 w-3.5 h-14 bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#881337] border-b-2 border-[#d4af37] shadow-md rounded-b-xs z-30 pointer-events-none flex items-end justify-center pb-0.5"
                style={{ opacity: 0 }}
              >
                <div className="w-1.5 h-1 bg-[#d4af37]/80 rounded-xs" />
              </div>

              {/* ========================================================== */}
              {/* MIOLO INFERIOR (Página Direita revelada por baixo da capa)  */}
              {/* Página limpa sem nenhum texto, para transição natural       */}
              {/* ========================================================== */}
              <div
                className="bible-right-page absolute inset-0 bg-[#faf7f0] dark:bg-[#18130e] border border-[#d5c6b0] dark:border-[#3a281c] rounded-r-xl rounded-l-xs shadow-[inset_0_0_60px_rgba(180,160,130,0.25)] dark:shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] overflow-hidden"
              >
                {/* Sombra da Medianiz / Lombada à esquerda */}
                <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-black/15 dark:from-black/45 to-transparent pointer-events-none" />
                <div data-book-cover-shadow="true" className="absolute inset-0 pointer-events-none" style={{ opacity: 0 }} />
              </div>

              {/* ========================================================== */}
              {/* FLIPPER DA CAPA (Gira 3D em torno da lombada no lado esquerdo) */}
              {/* ========================================================== */}
              <div
                id="cover-flipper"
                className="bible-cover-flipper absolute inset-0"
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'left center',
                  transform: 'rotateY(0deg)',
                }}
              >
                {/* FACE FRONTAL: Capa Externa da Bíblia Sagrada (Visível quando fechada) */}
                <div
                  className="bible-cover-front absolute inset-0 p-6 sm:p-8 text-center flex flex-col justify-between overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                  }}
                >
                  {/* Lombada e vinco de encadernação do livro */}
                  <div className="bible-spine-relief" aria-hidden="true" />

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
                    <h1 className="bible-gold-title text-3xl sm:text-4xl md:text-5xl font-black font-serif tracking-wider uppercase leading-tight">
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
                      data-menu-target="config"
                      disabled={isBusy}
                      onClick={() => handleOpenBook('config')}
                      className="bible-primary-action w-full flex items-center justify-center gap-2.5 text-[#1c120c] font-serif font-black py-3 sm:py-3.5 px-5 rounded-xl transition-all hover:brightness-110 active:scale-98 text-sm sm:text-base cursor-pointer tracking-wide disabled:opacity-90 disabled:pointer-events-none"
                    >
                      <Play className="w-4 h-4 fill-current text-[#1c120c]" />
                      <span>INICIAR GINCANA</span>
                    </button>

                    {/* 2. Configurar Perguntas */}
                    <button
                      type="button"
                      data-menu-target="questions"
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

              </div>
            </div>
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
