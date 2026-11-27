import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Clock,
  Swords,
  Play,
  ChevronUp,
  ChevronDown,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { errorMessage, getGameQuestions } from '@/services/questionStorage';
import OpenBookLayout, { BookPage } from '@/components/OpenBookLayout';
import PageTurnLayer from '@/components/PageTurnLayer';
import QuestionBoard from '@/components/QuestionBoard';
import { TEAM_PRESETS, getTeamPresetById } from '@/game/teams';
import { playPageFlipSound } from '@/services/audioService';
import type { GameConfig as MatchConfig, Question, Team } from '@/types/game';

const TIMER_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Sem limite', value: null },
  { label: '10 seg', value: 10 },
  { label: '15 seg', value: 15 },
  { label: '30 seg', value: 30 },
  { label: '45 seg', value: 45 },
  { label: '60 seg', value: 60 },
];

export default function GameConfig({ onBack }: { onBack?: () => void }) {
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
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [turning, setTurning] = useState(false);
  const pendingStart = useRef<{ config: MatchConfig; questions: Question[] } | null>(null);

  const finishStart = useCallback(() => {
    const match = pendingStart.current;
    if (!match) return;
    pendingStart.current = null;
    startGame(match.config, match.questions);
  }, [startGame]);

  useEffect(() => {
    if (!turning) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finishIfMotionIsOff = () => {
      if (preference.matches || document.hidden) finishStart();
    };
    finishIfMotionIsOff();
    preference.addEventListener('change', finishIfMotionIsOff);
    document.addEventListener('visibilitychange', finishIfMotionIsOff);
    return () => {
      preference.removeEventListener('change', finishIfMotionIsOff);
      document.removeEventListener('visibilitychange', finishIfMotionIsOff);
    };
  }, [turning, finishStart]);

  useEffect(() => {
    let isMounted = true;
    setLoadingQuestions(true);
    setQuestionsError(null);
    getGameQuestions()
      .then((list) => {
        if (isMounted) setQuestions(list);
      })
      .catch((error) => {
        if (!isMounted) return;
        setQuestions([]);
        setQuestionsError(errorMessage(error));
      })
      .finally(() => {
        if (isMounted) setLoadingQuestions(false);
      });
    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

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
    if (onBack) onBack();
    else goToScreen('menu');
  };

  const handleStart = () => {
    if (loadingQuestions || questionsError || turning || pendingStart.current) return;
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
    pendingStart.current = { config: { teams: trimmedTeams, timerSeconds, allowSteal }, questions };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) {
      finishStart();
    } else {
      setTurning(true);
    }
  };

  const totalQuestions = questions.length;
  const questionsPerTeam = Math.floor(totalQuestions / teamCount);
  const remainder = totalQuestions % teamCount;

  const teamsPage = (
      <BookPage
        side="left"
        title="Livro das regras"
        subtitle="Equipes e ordem de saída"
        pageNumber={1}
        contentClassName="flex flex-col justify-between"
        footer={<><span>Equipes participantes</span><span>2 a 4 equipes</span></>}
      >
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
                  aria-pressed={active}
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
                  data-team-id={t.id}
                  className={`rounded-lg border-2 ${preset.theme.configCard} p-1.5 sm:p-2 flex items-center justify-between gap-2 shadow-xs`}
                >
                  {/* Posição + Identificador */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex h-5.5 w-5.5 items-center justify-center rounded bg-white/70 border border-[#c9b99e] text-[11px] font-mono font-bold text-[#735016] dark:bg-black/40 dark:border-white/10 dark:text-amber-300">
                      {idx + 1}º
                    </span>
                    <div className="min-w-[62px]">
                      <span className={`text-[10px] font-serif font-bold uppercase tracking-wider ${preset.theme.configAccent} block leading-tight`}>
                        {preset.roman}
                      </span>
                      <span className="text-[8.5px] text-[#685746] dark:text-amber-200/60 font-serif leading-tight">
                        {isFirst ? 'Começa a vez' : `${idx + 1}ª na fila`}
                      </span>
                    </div>
                  </div>

                  {/* Input do Nome da Equipe */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      aria-label={`Nome da ${preset.roman}`}
                      value={t.name}
                      onChange={(e) => handleNameChange(t.id, e.target.value)}
                      placeholder={preset.defaultName}
                      maxLength={22}
                      className="w-full rounded border border-[#cbbba3] bg-[#fffdf8]/90 px-2 py-0.5 text-xs font-serif font-bold text-[#2c2118] placeholder:text-[#8b796a] focus:border-[#a47926] focus:outline-none focus:ring-2 focus:ring-amber-700/30 dark:border-[#3d281a] dark:bg-[#170e09]/80 dark:text-white dark:placeholder:text-amber-200/40 dark:focus:border-[#d4af37] dark:focus:ring-amber-400/35"
                    />
                  </div>

                  {/* Botões Reordenar */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveTeam(idx, 'up')}
                      className={`flex h-5.5 w-5.5 items-center justify-center rounded border border-[#cbbba3] bg-[#fffdf8]/85 text-[#755329] dark:border-[#3d281a] dark:bg-[#241710] dark:text-amber-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a47926] dark:focus-visible:outline-amber-400 ${
                        isFirst ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#f3e8cf] hover:border-[#a47926] dark:hover:bg-[#3d2719] dark:hover:border-amber-400 cursor-pointer'
                      }`}
                      title="Subir na ordem"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveTeam(idx, 'down')}
                      className={`flex h-5.5 w-5.5 items-center justify-center rounded border border-[#cbbba3] bg-[#fffdf8]/85 text-[#755329] dark:border-[#3d281a] dark:bg-[#241710] dark:text-amber-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a47926] dark:focus-visible:outline-amber-400 ${
                        isLast ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#f3e8cf] hover:border-[#a47926] dark:hover:bg-[#3d2719] dark:hover:border-amber-400 cursor-pointer'
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
      </BookPage>
  );

  const parametersPage = (
      <BookPage
        side="right"
        title="Parâmetros da partida"
        subtitle="Tempo, roubo e resumo"
        pageNumber={2}
        contentClassName="flex flex-col justify-between"
        footer={<><span>Confira as regras antes de iniciar</span><span>Configuração</span></>}
      >
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
                  aria-pressed={active}
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
              aria-label="Permitir roubo de pergunta"
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

        {/* § 5. Resumo da gincana */}
        <div className="pt-2 flex flex-col justify-between">
          {!loadingQuestions && (questionsError || totalQuestions === 0) && (
            <div role="alert" className="mb-2 rounded-lg border border-rose-500/50 bg-rose-50 p-2 text-xs text-rose-800 dark:bg-rose-950/80 dark:text-rose-200">
              <p className="break-words">{questionsError || 'Não há perguntas cadastradas para iniciar a gincana.'}</p>
              <div className="mt-2 flex gap-3">
                <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)} className="font-bold underline">Tentar novamente</button>
                <button type="button" onClick={() => goToScreen('questions')} className="font-bold underline">Gerenciar perguntas</button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-[#73533e] dark:text-[#a89682] font-serif mb-3">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {loadingQuestions ? (
                'Carregando versículos do cânon...'
              ) : questionsError ? 'Corrija o banco de perguntas para iniciar a gincana.' : (
                <>
                  <strong className="text-[#1c120c] dark:text-[#faf7f0]">{totalQuestions} versículos</strong> disponíveis no cânon. Média de{' '}
                  <strong className="text-[#1c120c] dark:text-[#faf7f0]">{questionsPerTeam} perguntas</strong> por estandarte{remainder > 0 ? ` (${remainder} terão 1 a mais)` : ''}.
                </>
              )}
            </span>
          </div>
        </div>
      </BookPage>
  );

  return (
    <fieldset className="contents" disabled={turning} data-game-start-turn={turning ? 'true' : undefined}>
      <OpenBookLayout
        title="Configuração da gincana"
        onBack={handleBackToMenu}
        primaryAction={{
          label: 'Iniciar gincana',
          icon: <Play className="h-4 w-4" />,
          onClick: handleStart,
          disabled: turning || loadingQuestions || Boolean(questionsError) || totalQuestions === 0,
        }}
        toolbar={
          <div className="flex w-full items-center justify-between gap-4 text-xs text-[#73533e] dark:text-[#bdae9c]">
            <span>Defina as equipes e as regras da partida.</span>
            <span className="shrink-0">{loadingQuestions ? 'Carregando perguntas…' : questionsError ? 'Banco indisponível' : `${totalQuestions} perguntas no banco`}</span>
          </div>
        }
        pagesBusy={turning}
        pagesOverlay={turning && (
          <PageTurnLayer direction="next" front={parametersPage} back={<QuestionBoard side="left" questions={questions} />} onComplete={finishStart} />
        )}
      >
        {teamsPage}
        {turning ? <QuestionBoard side="right" questions={questions} /> : parametersPage}
      </OpenBookLayout>
    </fieldset>
  );
}
