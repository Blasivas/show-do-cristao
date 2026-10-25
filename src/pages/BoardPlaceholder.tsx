import { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import ThemeToggle from '@/components/ThemeToggle';
import ConfirmDialog from '@/components/ConfirmDialog';
import { getTeamPresetById } from '@/game/teams';

export default function BoardPlaceholder() {
  const { gameState, currentTeam, scores, resetGame } = useGame();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!gameState || !currentTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140b07] text-amber-100">
        <p>Nenhuma partida em andamento.</p>
      </div>
    );
  }

  const { teams, timerSeconds, allowSteal } = gameState.config;
  const currentPreset = getTeamPresetById(currentTeam.id);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9] text-[#2c1d11] dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503] dark:text-[#ede6d8] flex flex-col justify-between p-4 sm:p-6 md:p-8 font-serif select-none transition-colors duration-200">
      {/* Barra Superior */}
      <header className="flex items-center justify-between border-b border-[#d5c6b0] dark:border-[#2b1b11] pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5c6b0] dark:border-[#c5a059]/40 bg-white dark:bg-[#2d1d13] text-[#73533e] dark:text-amber-200 shadow-xs transition-all hover:bg-[#f5ebd7] dark:hover:bg-[#3d2719] active:scale-95 cursor-pointer"
            title="Encerrar Gincana e Voltar ao Menu"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-wider text-[#1c120c] dark:text-amber-100 uppercase font-serif">
              Mural da Gincana Bíblica
            </h1>
            <p className="text-[11px] text-[#73533e] dark:text-amber-200/60 font-serif">
              {timerSeconds ? `Cronômetro: ${timerSeconds}s por pergunta` : 'Sem tempo regressivo'} •{' '}
              {allowSteal ? 'Roubo Ativo (50%)' : 'Sem Roubo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-200 text-xs font-serif font-bold transition-all cursor-pointer shadow-xs"
          >
            Encerrar Gincana
          </button>
          <ThemeToggle labelClassName="text-[#73533e] dark:text-amber-200/80 font-medium" />
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex flex-col items-center justify-center my-6 max-w-5xl mx-auto w-full">
        {/* Banner da Equipe da Vez */}
        <div className="w-full mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/50 bg-[#241710] text-amber-300 text-xs font-serif font-bold mb-3 shadow-md animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-300" />
            É a Vez de Escolher a Pergunta:
          </div>

          <div
            className={`rounded-2xl border-2 ${currentPreset?.theme.border || 'border-amber-500'} ${
              currentPreset?.theme.bgBanner || 'bg-[#241710]'
            } p-5 max-w-xl mx-auto shadow-2xl relative overflow-hidden`}
          >
            <span className="text-xs font-serif font-bold uppercase tracking-widest text-amber-200/70 block mb-1">
              ● {currentPreset?.roman || 'Equipe'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wide mb-1">
              {currentTeam.name}
            </h2>
            <p className="text-xs text-amber-200/80 font-serif">
              Pontuação atual: <strong className="text-white">{scores[currentTeam.id] || 0} Talentos</strong> (Placar Secreto)
            </p>
          </div>
        </div>

        {/* Estandartes das Equipes em Jogo */}
        <div className="w-full mb-8">
          <div className="text-[11px] uppercase tracking-widest text-amber-300/70 font-bold mb-3 text-center">
            Equipes na Partida
          </div>
          <div className={`grid grid-cols-2 ${teams.length > 2 ? 'md:grid-cols-' + teams.length : 'md:grid-cols-2'} gap-3 w-full`}>
            {teams.map((t, idx) => {
              const preset = getTeamPresetById(t.id);
              const isCurrent = t.id === currentTeam.id;

              return (
                <div
                  key={t.id}
                  className={`rounded-xl border-2 ${preset?.theme.border || 'border-amber-600/40'} ${
                    preset?.theme.bgBanner || 'bg-[#1c120c]'
                  } p-3.5 text-left shadow-lg relative transition-all ${
                    isCurrent ? 'ring-2 ring-amber-400 scale-[1.02]' : 'opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-serif font-bold uppercase tracking-wider ${preset?.theme.textAccent || 'text-amber-400'}`}>
                      ● {preset?.roman || `Equipe ${idx + 1}`}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-black font-sans">
                        VEZ
                      </span>
                    )}
                  </div>
                  <div className="text-sm sm:text-base font-black text-white font-serif truncate mb-1">
                    {t.name}
                  </div>
                  <div className="text-xs text-amber-200/80 font-mono">
                    {scores[t.id] || 0} Talentos
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Informativo da Etapa 5 */}
        <div className="rounded-xl border border-amber-500/30 bg-[#241710]/90 p-4 max-w-2xl text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1 font-serif">
            <HelpCircle className="w-4 h-4 text-[#d4af37]" />
            Etapa 5 Concluída: Estado Global & Navegação Conectados!
          </div>
          <p className="text-xs text-amber-200/80 font-serif leading-relaxed">
            A partida foi criada e os dados configurados estão prontos no estado global. A grade completa de cartões numerados e escolha das perguntas será construída no próximo passo (**Etapa 6: Mural de Perguntas**).
          </p>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-[#3d281a] dark:border-[#2b1b11] pt-3 text-center text-[11px] text-amber-200/60 font-serif shrink-0">
        Show do Cristão • Igreja Presbiteriana do Brasil • Partida Ativa
      </footer>

      {/* Confirmação para Encerrar */}
      {showExitConfirm && (
        <ConfirmDialog
          title="Encerrar a Partida"
          message="Deseja realmente encerrar a gincana atual e retornar ao Menu Principal?"
          cancelLabel="Continuar Partida"
          onCancel={() => setShowExitConfirm(false)}
          actions={[
            {
              label: 'Sim, Encerrar',
              variant: 'danger',
              onClick: resetGame,
            },
          ]}
        />
      )}
    </div>
  );
}
