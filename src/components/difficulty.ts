import type { Difficulty } from '@/types/game';

export const DIFFICULTY_ORDER: Difficulty[] = ['facil', 'medio', 'dificil'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

// Cor + texto sempre juntos, pensando em pessoas daltônicas
export const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  facil: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200',
  medio: 'bg-amber-500/20 border-amber-400/60 text-amber-200',
  dificil: 'bg-red-500/20 border-red-400/60 text-red-200',
};
