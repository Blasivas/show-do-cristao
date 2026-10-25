import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Swords,
  Play,
  ChevronUp,
  ChevronDown,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { getGameQuestions } from '@/services/questionStorage';
import ThemeToggle from '@/components/ThemeToggle';
import { TEAM_PRESETS, getTeamPresetById } from '@/game/teams';
import { playPageFlipSound } from '@/services/audioService';
import type { Question, Team } from '@/types/game';

const TIMER_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Sem limite', value: null },
  { label: '10 seg', value: 10 },
  { label: '15 seg', value: 15 },
  { label: '30 seg', value: 30 },
  { label: '45 seg', value: 45 },
  { label: '60 seg', value: 60 },
];

export default function GameConfig() {
  const { goToScreen, startGame } = useGame();

  const [teamCount, setTeamCount] = useState<2 | 3 | 4>(2);
  const [teams, setTeams] = useState<Team[]>([
    { id: 'equipe-1', name: TEAM_PRESETS[0].defaultName },
    { id: 'equipe-2', name: TEAM_PRESETS[1].defaultName },
  ]);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(30);
  const [allowSteal, setAllowSteal] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getGameQuestions().then((list) => {
      if (!isMounted) return;
      setQuestions(list);
      setLoadingQuestions(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTeamCountChange = (count: 2 | 3 | 4) => {
    playPageFlipSound();
    setTeamCount(count);
    setTeams((prev) => {
      const next: Team[] = [];
      for (let i = 0; i < count; i++) {
        const preset = TEAM_PRESETS[i];
        const existing = prev.find((t) => t.id === preset.id);
        next.push({
          id: preset.id,
          name: existing ? existing.name : preset.defaultName,
        });
      }
      return next;
    });
  };

  const handleNameChange = (id: string, newName: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName } : t)),
    );
  };

  const handleMoveTeam = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= teams.length) return;

    playPageFlipSound();
    setTeams((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleBackToMenu = () => {
    goToScreen('menu');
  };

  const handleStart = () => {
    const trimmedTeams = teams.map((t) => ({ ...t, name: t.name.trim() }));
    if (trimmedTeams.some((t) => !t.name)) {
      setErrorMsg('Por favor, defina um nome para todas as equipes.');
      return;
    }

    if (questions.length === 0) {
      setErrorMsg('Não há perguntas cadastradas para iniciar a gincana.');
      return;
    }

    setErrorMsg(null);
    playPageFlipSound();
    startGame(
      {
        teams: trimmedTeams,
        timerSeconds,
        allowSteal,
      },
      questions,
    );
  };

  const totalQuestions = questions.length;
  const questionsPerTeam = Math.floor(totalQuestions / teamCount);
  const remainder = totalQuestions % teamCount;

  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-gradient-to-b from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9] text-[#2c1d11] dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503] dark:text-[#ede6d8] font-serif select-none relative overflow-hidden transition-colors duration-200">
      {/* Barra Superior estilo Púlpito */}
      <header className="shrink-0 border-b border-[#d5c6b0] dark:border-[#2b1b11] bg-white/85 dark:bg-gradient-to-b dark:from-[#1b1009] dark:to-[#120a06] px-4 py-2 text-xs text-[#423125] dark:text-amber-100 shadow-xs dark:shadow-xl z-20 backdrop-blur-xs transition-colors">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleBackToMenu}
              aria-label="Voltar à Capa da Bíblia"
              title="Voltar à Capa da Bíblia"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d5c6b0] dark:border-[#c5a059]/40 bg-white dark:bg-[#2d1d13] text-[#73533e] dark:text-amber-200 hover:bg-[#f5ebd7] dark:hover:bg-[#3d2719] shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-5 w-px bg-[#d5c6b0] dark:bg-[#3d281a]" />
            <span className="text-xs uppercase tracking-wider text-[#1c120c] dark:text-amber-400/90 font-serif font-bold">
              Configuração da Gincana Bíblica
            </span>
          </div>

          <ThemeToggle labelClassName="text-[#73533e] dark:text-amber-200/80 font-medium" />
        </div>
      </header>

      {/* ÁREA CENTRAL: A BÍBLIA SAGRADA ABERTA EM BIFÓLIO (DOIS LADOS) */}
      <main className="flex-1 flex flex-col items-center justify-center p-1.5 sm:p-2 min-h-0 relative">
        <div className="max-w-7xl max-h-[calc(100vh-4.25rem)] w-full aspect-[16/10.2] flex-1 flex flex-col justify-center">
          {/* Capa de Couro Externa */}
          <div className="w-full h-full bg-[#1c120c] dark:bg-[#120b07] p-1.5 md:p-2 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 border-[#3a2517] dark:border-[#2a1a10] relative flex flex-col min-h-0 transition-colors">
            {/* Filete Dourado Delicado */}
            <div className="border border-[#c5a059]/40 dark:border-[#c5a059]/20 p-0.5 rounded-xl h-full flex flex-col min-h-0">
              {/* O Bifólio (Página Esquerda + Página Direita) */}
              <div className="grid grid-cols-1 md:grid-cols-2 rounded-lg overflow-hidden flex-1 min-h-0 relative bg-[#faf7f0] dark:bg-[#18130e] text-[#1c1917] dark:text-[#ede6d8] shadow-[inset_0_0_80px_rgba(180,160,130,0.3)] dark:shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] transition-all">
                {/* Fitilho de Cetim Vermelho no Topo da Medianiz */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-12 bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#881337] border-b-2 border-[#d4af37] shadow-md rounded-b-xs z-30 pointer-events-none flex items-end justify-center pb-0.5">
                  <div className="w-1.5 h-1 bg-[#d4af37]/80 rounded-xs" />
                </div>

                {/* ======================================================== */}
                {/* PÁGINA ESQUERDA: ORDENANÇA DAS EQUIPES (PÁG. I) */}
                {/* ======================================================== */}
                <div className="px-3.5 md:px-5 py-2 md:py-3 flex flex-col justify-between border-r-2 border-[#d5c6b0] dark:border-[#382618] relative bg-[#faf7f0] dark:bg-[#18130e] min-h-0 transition-colors duration-200">
                  {/* Sombra da Medianiz */}
                  <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-black/[0.04] to-black/[0.14] dark:via-black/[0.15] dark:to-black/[0.5] pointer-events-none" />

                  {/* Cabeçalho da Página Esquerda */}
                  <div className="border-b border-[#8b1e1e]/30 dark:border-[#c5a059]/30 pb-1 flex justify-between items-center text-[10px] text-[#665040] dark:text-[#c4b59d] uppercase tracking-wider font-serif shrink-0">
                    <span className="font-bold text-[#1c120c] dark:text-[#faf7f0]">LIVRO DAS REGRAS</span>
                    <span className="italic text-[#73533e] dark:text-[#bdae9c]">Ordenança das Equipes</span>
                    <span>PÁG. I</span>
                  </div>

                  {/* Conteúdo da Página Esquerda */}
                  <div className="flex-1 flex flex-col justify-between py-1.5 min-h-0 overflow-hidden">
                    {/* Alerta de Erro se houver */}
                    {errorMsg && (
                      <div className="mb-2 flex items-center gap-1.5 rounded border border-rose-500/50 bg-rose-50 dark:bg-rose-950/80 p-1.5 text-xs text-rose-800 dark:text-rose-200">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* § 1. Quantidade de Equipes */}
                    <div className="border-b border-[#e2d8c6] dark:border-[#2d1e14] pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#8b1e1e] dark:text-[#f87171] font-serif flex items-center gap-1">
                          <span>§ 1.</span>
                          <span>NÚMERO DE ESTANDARTES</span>
                        </span>
                        <span className="text-[10px] text-[#73533e] dark:text-[#a89682] italic">
                          2 a 4 equipes
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([2, 3, 4] as const).map((count) => {
                          const active = teamCount === count;
                          return (
                            <button
                              key={count}
                              type="button"
                              onClick={() => handleTeamCountChange(count)}
                              className={`py-1 px-2 rounded-lg border text-xs font-serif font-bold transition-all cursor-pointer ${
                                active
                                  ? 'bg-[#d4af37] text-[#1c120c] border-amber-400 shadow-sm'
                                  : 'bg-white/80 dark:bg-[#221a14] text-[#5c4738] dark:text-[#dfd5c6] border-[#d5c6b0] dark:border-[#382618] hover:border-amber-400'
                              }`}
                            >
                              {count} Equipes
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* § 2. Lista de Equipes e Ordem de Saída */}
                    <div className="flex-1 flex flex-col justify-center min-h-0 py-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#8b1e1e] dark:text-[#f87171] font-serif flex items-center gap-1">
                          <span>§ 2.</span>
                          <span>ORDEM DE SAÍDA (A 1ª COMEÇA)</span>
                        </span>
                        <span className="text-[10px] text-[#73533e] dark:text-[#a89682] italic">
                          Use as setas para reordenar
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {teams.map((t, idx) => {
                          const preset = getTeamPresetById(t.id) || TEAM_PRESETS[idx];
                          const isFirst = idx === 0;
                          const isLast = idx === teams.length - 1;

                          return (
                            <div
                              key={t.id}
                              className={`rounded-lg border-2 ${preset.theme.border} ${preset.theme.bgBanner} p-1.5 sm:p-2 flex items-center justify-between gap-2 shadow-xs`}
                            >
                              {/* Posição + Identificador */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="flex h-5.5 w-5.5 items-center justify-center rounded bg-black/40 border border-white/10 text-[11px] font-mono font-bold text-amber-300">
                                  {idx + 1}º
                                </span>
                                <div className="min-w-[62px]">
                                  <span className={`text-[10px] font-serif font-bold uppercase tracking-wider ${preset.theme.textAccent} block leading-tight`}>
                                    {preset.roman}
                                  </span>
                                  <span className="text-[8.5px] text-amber-200/60 font-serif leading-tight">
                                    {isFirst ? 'Começa a vez' : `${idx + 1}ª na fila`}
                                  </span>
                                </div>
                              </div>

                              {/* Input do Nome da Equipe */}
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={t.name}
                                  onChange={(e) => handleNameChange(t.id, e.target.value)}
                                  placeholder={preset.defaultName}
                                  maxLength={22}
                                  className="w-full rounded border border-[#3d281a] bg-[#170e09]/80 px-2 py-0.5 text-xs font-serif font-bold text-white placeholder-amber-200/40 focus:border-[#d4af37] focus:outline-hidden"
                                />
                              </div>

                              {/* Botões Reordenar */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={isFirst}
                                  onClick={() => handleMoveTeam(idx, 'up')}
                                  className={`flex h-5.5 w-5.5 items-center justify-center rounded border border-[#3d281a] bg-[#241710] text-amber-200 transition-colors ${
                                    isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#3d2719] hover:border-amber-400 cursor-pointer'
                                  }`}
                                  title="Subir na ordem"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isLast}
                                  onClick={() => handleMoveTeam(idx, 'down')}
                                  className={`flex h-5.5 w-5.5 items-center justify-center rounded border border-[#3d281a] bg-[#241710] text-amber-200 transition-colors ${
                                    isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#3d2719] hover:border-amber-400 cursor-pointer'
                                  }`}
                                  title="Descer na ordem"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé da Página Esquerda */}
                  <div className="border-t border-[#d5c6b0] dark:border-[#382618] pt-1 flex justify-between items-center text-xs text-[#73533e] dark:text-[#a89682] font-serif shrink-0">
                    <span className="text-[11px] text-[#73533e] dark:text-[#a89682]">Igreja Presbiteriana do Brasil</span>
                    <span className="italic text-[11px]">Ordenança dos Estandartes</span>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* PÁGINA DIREITA: PARÂMETROS DA PARTIDA & INÍCIO (PÁG. II) */}
                {/* ======================================================== */}
                <div className="px-3.5 md:px-5 py-2 md:py-3 flex flex-col justify-between relative bg-[#faf7f0] dark:bg-[#18130e] min-h-0 transition-colors duration-200">
                  {/* Sombra da Medianiz */}
                  <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-l from-transparent via-black/[0.04] to-black/[0.14] dark:via-black/[0.15] dark:to-black/[0.5] pointer-events-none" />

                  {/* Cabeçalho da Página Direita */}
                  <div className="border-b border-[#8b1e1e]/30 dark:border-[#c5a059]/30 pb-1 flex justify-between items-center text-[10px] text-[#665040] dark:text-[#c4b59d] uppercase tracking-wider font-serif shrink-0">
                    <span>PÁG. II</span>
                    <span className="italic text-[#73533e] dark:text-[#bdae9c]">Parâmetros Canônicos</span>
                    <span className="font-bold text-[#1c120c] dark:text-[#faf7f0]">SHOW DO CRISTÃO</span>
                  </div>

                  {/* Conteúdo da Página Direita */}
                  <div className="flex-1 flex flex-col justify-between py-1.5 min-h-0 overflow-hidden">
                    {/* § 3. Tempo do Cronômetro */}
                    <div className="border-b border-[#e2d8c6] dark:border-[#2d1e14] pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#8b1e1e] dark:text-[#f87171] font-serif flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>§ 3. TEMPO DO CRONÔMETRO</span>
                        </span>
                        <span className="text-[10px] text-[#73533e] dark:text-[#a89682] italic">
                          Tempo único para toda a partida
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TIMER_OPTIONS.map((opt) => {
                          const active = timerSeconds === opt.value;
                          return (
                            <button
                              key={String(opt.value)}
                              type="button"
                              onClick={() => {
                                playPageFlipSound();
                                setTimerSeconds(opt.value);
                              }}
                              className={`py-1 px-1.5 rounded-lg border text-xs font-serif font-bold transition-all cursor-pointer ${
                                active
                                  ? 'bg-[#d4af37] text-[#1c120c] border-amber-400 shadow-sm'
                                  : 'bg-white/80 dark:bg-[#221a14] text-[#5c4738] dark:text-[#dfd5c6] border-[#d5c6b0] dark:border-[#382618] hover:border-amber-400'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* § 4. Regra do Roubo */}
                    <div className="border-b border-[#e2d8c6] dark:border-[#2d1e14] py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#8b1e1e] dark:text-[#f87171] font-serif flex items-center gap-1">
                          <Swords className="w-3.5 h-3.5" />
                          <span>§ 4. REGRA DO ROUBO DE PERGUNTA</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5c4738] dark:text-[#dfd5c6] font-serif leading-tight mb-2">
                        Se a equipe titular errar, a próxima equipe na ordem pode responder e levar 50% dos pontos da pergunta.
                      </p>
                      <div className="flex items-center justify-between bg-white/60 dark:bg-[#221a14] p-2 rounded-lg border border-[#e2d8c6] dark:border-[#382618]">
                        <span className="text-xs font-bold font-serif text-[#1c120c] dark:text-[#faf7f0]">
                          {allowSteal ? 'Roubo Ativo (50% pontos)' : 'Sem Roubo'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={allowSteal}
                          onClick={() => {
                            playPageFlipSound();
                            setAllowSteal(!allowSteal);
                          }}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ${
                            allowSteal
                              ? 'border-amber-500 bg-amber-600'
                              : 'border-[#3d281a] bg-[#2d1d13]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                              allowSteal ? 'translate-x-4.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* § 5. Resumo e Botão Iniciar Gincana */}
                    <div className="pt-2 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#73533e] dark:text-[#a89682] font-serif mb-3">
                        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          {loadingQuestions ? (
                            'Carregando versículos do cânon...'
                          ) : (
                            <>
                              <strong className="text-[#1c120c] dark:text-[#faf7f0]">{totalQuestions} versículos</strong> disponíveis no cânon. Média de{' '}
                              <strong className="text-[#1c120c] dark:text-[#faf7f0]">{questionsPerTeam} perguntas</strong> por estandarte{remainder > 0 ? ` (${remainder} terão 1 a mais)` : ''}.
                            </>
                          )}
                        </span>
                      </div>

                      {/* Botão Principal Iniciar Gincana */}
                      <button
                        type="button"
                        onClick={handleStart}
                        disabled={loadingQuestions || totalQuestions === 0}
                        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#8b1e1e] via-[#a82424] to-[#8b1e1e] hover:brightness-115 text-amber-50 font-serif font-black py-3 px-6 rounded-xl shadow-xl border-2 border-amber-400/60 transition-all hover:scale-[1.01] active:scale-98 text-sm sm:text-base cursor-pointer disabled:opacity-50 tracking-wider uppercase"
                      >
                        <Play className="w-4 h-4 fill-current text-amber-300" />
                        <span>INICIAR GINCANA BÍBLICA</span>
                      </button>
                    </div>
                  </div>

                  {/* Rodapé da Página Direita */}
                  <div className="border-t border-[#d5c6b0] dark:border-[#382618] pt-1 flex justify-between items-center text-xs text-[#73533e] dark:text-[#a89682] font-serif shrink-0">
                    <span className="italic text-[11px]">Pronto para o Mural de Perguntas</span>
                    <span className="font-bold text-[#8b1e1e] dark:text-[#f87171]">Folha II de II</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Geral da Aplicação */}
      <footer className="shrink-0 border-t border-[#3d281a] dark:border-[#2b1b11] bg-[#1a100b] dark:bg-[#120a06] px-4 py-1 text-center text-[10.5px] text-amber-200/60 font-serif">
        Show do Cristão • Cânon Sagrado da Igreja Presbiteriana do Brasil • Modo Gincana
      </footer>
    </div>
  );
}
