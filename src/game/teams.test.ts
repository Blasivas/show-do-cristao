import { describe, expect, it } from 'vitest';
import { TEAM_PRESETS, getTeamPreset, getTeamPresetById } from './teams';

describe('teams presets', () => {
  it('contém exatamente 4 estandartes com identidades únicas', () => {
    expect(TEAM_PRESETS).toHaveLength(4);
    const ids = new Set(TEAM_PRESETS.map((t) => t.id));
    expect(ids.size).toBe(4);
  });

  it('possui nomes e numerais romanos esperados', () => {
    expect(TEAM_PRESETS[0].roman).toBe('Equipe I');
    expect(TEAM_PRESETS[0].defaultName).toBe('Sarça Verde');

    expect(TEAM_PRESETS[1].roman).toBe('Equipe II');
    expect(TEAM_PRESETS[1].defaultName).toBe('Chama Dourada');

    expect(TEAM_PRESETS[2].roman).toBe('Equipe III');
    expect(TEAM_PRESETS[2].defaultName).toBe('Vinho Carmesim');

    expect(TEAM_PRESETS[3].roman).toBe('Equipe IV');
    expect(TEAM_PRESETS[3].defaultName).toBe('Safira Celeste');
  });

  it('getTeamPreset busca por índice circular', () => {
    expect(getTeamPreset(0).id).toBe('equipe-1');
    expect(getTeamPreset(1).id).toBe('equipe-2');
    expect(getTeamPreset(2).id).toBe('equipe-3');
    expect(getTeamPreset(3).id).toBe('equipe-4');
    expect(getTeamPreset(4).id).toBe('equipe-1');
  });

  it('getTeamPresetById encontra o preset correto', () => {
    expect(getTeamPresetById('equipe-3')?.defaultName).toBe('Vinho Carmesim');
    expect(getTeamPresetById('equipe-4')?.defaultName).toBe('Safira Celeste');
    expect(getTeamPresetById('inexistente')).toBeUndefined();
  });
});
