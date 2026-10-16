import type { Difficulty } from '@/types/game';

export const DIFFICULTY_ORDER: Difficulty[] = ['facil', 'medio', 'dificil'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

// Cor + texto sempre juntos, com suporte a modo claro e escuro (Tech Bento)
export const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  facil:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300',
  medio:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300',
  dificil:
    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300',
};
