export interface TeamPreset {
  id: string;
  defaultName: string;
  roman: string;
  colorName: string;
  description: string;
  theme: {
    bgBanner: string;
    configCard: string;
    configAccent: string;
    border: string;
    textAccent: string;
    textPoints: string;
    badge: string;
    dot: string;
  };
}

export const TEAM_PRESETS: TeamPreset[] = [
  {
    id: 'equipe-1',
    defaultName: 'Sarça Verde',
    roman: 'Equipe I',
    colorName: 'Verde Institucional',
    description: 'Estandarte com o verde solene da sarça ardente da IPB',
    theme: {
      bgBanner: 'bg-gradient-to-br from-[#0c2417] to-[#081910]',
      configCard: 'bg-gradient-to-br from-[#edf6ee] to-[#e2efe5] border-[#9bbba3] dark:from-[#0c2417] dark:to-[#081910] dark:border-emerald-500/50',
      configAccent: 'text-[#23613c] dark:text-emerald-300',
      border: 'border-emerald-600/50 dark:border-emerald-500/50',
      textAccent: 'text-emerald-400 dark:text-emerald-300',
      textPoints: 'text-emerald-100',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
      dot: 'bg-emerald-400',
    },
  },
  {
    id: 'equipe-2',
    defaultName: 'Chama Dourada',
    roman: 'Equipe II',
    colorName: 'Ouro Sagrado',
    description: 'Estandarte com o ouro da sabedoria e revelação das Escrituras',
    theme: {
      bgBanner: 'bg-gradient-to-br from-[#2a1708] to-[#1a0f05]',
      configCard: 'bg-gradient-to-br from-[#fff7e1] to-[#f6eccd] border-[#cdb77c] dark:from-[#2a1708] dark:to-[#1a0f05] dark:border-amber-500/50',
      configAccent: 'text-[#795511] dark:text-amber-300',
      border: 'border-amber-600/50 dark:border-amber-500/50',
      textAccent: 'text-amber-400 dark:text-amber-300',
      textPoints: 'text-amber-100',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
      dot: 'bg-amber-400',
    },
  },
  {
    id: 'equipe-3',
    defaultName: 'Vinho Carmesim',
    roman: 'Equipe III',
    colorName: 'Rubrica Carmesim',
    description: 'Estandarte com a cor nobre do sangue da aliança e rubricas sagradas',
    theme: {
      bgBanner: 'bg-gradient-to-br from-[#2b0d0d] to-[#170606]',
      configCard: 'bg-gradient-to-br from-[#fbeff0] to-[#f3e0e4] border-[#cda0aa] dark:from-[#2b0d0d] dark:to-[#170606] dark:border-rose-600/50',
      configAccent: 'text-[#8b2942] dark:text-rose-300',
      border: 'border-rose-700/50 dark:border-rose-600/50',
      textAccent: 'text-rose-400 dark:text-rose-300',
      textPoints: 'text-rose-100',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-600/50',
      dot: 'bg-rose-400',
    },
  },
  {
    id: 'equipe-4',
    defaultName: 'Safira Celeste',
    roman: 'Equipe IV',
    colorName: 'Azul Safira',
    description: 'Estandarte com o azul do céu e da tradição reformada cristã',
    theme: {
      bgBanner: 'bg-gradient-to-br from-[#0a182c] to-[#050e1b]',
      configCard: 'bg-gradient-to-br from-[#edf3fc] to-[#e0eaf8] border-[#9db4d6] dark:from-[#0a182c] dark:to-[#050e1b] dark:border-blue-500/50',
      configAccent: 'text-[#28578a] dark:text-blue-300',
      border: 'border-blue-600/50 dark:border-blue-500/50',
      textAccent: 'text-blue-400 dark:text-blue-300',
      textPoints: 'text-blue-100',
      badge: 'bg-blue-950/80 text-blue-300 border-blue-600/50',
      dot: 'bg-blue-400',
    },
  },
];

export function getTeamPreset(index: number): TeamPreset {
  return TEAM_PRESETS[index % TEAM_PRESETS.length];
}

export function getTeamPresetById(teamId: string): TeamPreset | undefined {
  return TEAM_PRESETS.find((p) => p.id === teamId);
}
