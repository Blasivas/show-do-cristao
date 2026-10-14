import { describe, expect, it } from 'vitest';
import { createQuestionStorage, getDefaultQuestions } from './questionStorage';
import { parseQuestionsJson, stringifyQuestions } from '@/game/questions';

/** Simula o arquivo `perguntas.json` e as janelas de abrir/salvar do Electron */
function fakeApi(initial: string | null = null, toImport: string | null = null) {
  const state = { file: initial, backups: [] as string[], exported: null as string | null };
  const api: QuestionsFileApi = {
    read: async () => state.file,
    write: async (content) => {
      state.file = content;
    },
    backup: async () => {
      if (state.file === null) return null;
      state.backups.push(state.file);
      return `backup-${state.backups.length}.json`;
    },
    importFile: async () => toImport,
    exportFile: async (content) => {
      state.exported = content;
      return true;
    },
    openFolder: async () => {},
  };
  return { api, state };
}

describe('createQuestionStorage', () => {
  it('na primeira abertura cria o arquivo com as 20 perguntas padrão', async () => {
    const { api, state } = fakeApi();
    const result = await createQuestionStorage(api).load();
    expect(result).toMatchObject({ status: 'ok', createdDefaults: true });
    expect(parseQuestionsJson(state.file!)).toHaveLength(20);
  });

  it('carrega o arquivo existente e salva alterações', async () => {
    const two = getDefaultQuestions().slice(0, 2);
    const { api, state } = fakeApi(stringifyQuestions(two));
    const storage = createQuestionStorage(api);
    const result = await storage.load();
    expect(result).toMatchObject({ status: 'ok', createdDefaults: false });

    await storage.save(two.slice(0, 1));
    expect(parseQuestionsJson(state.file!)).toHaveLength(1);
  });

  it('arquivo fora de ordem (editado à mão) é carregado e regravado na ordem fáceis → médias → difíceis', async () => {
    const defaults = getDefaultQuestions();
    const shuffled = [defaults[19], defaults[0], defaults[10]]; // difícil, fácil, média
    const { api, state } = fakeApi(stringifyQuestions(shuffled));
    const result = await createQuestionStorage(api).load();
    const order = (list: { difficulty: string }[]) => list.map((x) => x.difficulty);
    expect(result.status === 'ok' && order(result.questions)).toEqual(['facil', 'medio', 'dificil']);
    expect(order(parseQuestionsJson(state.file!))).toEqual(['facil', 'medio', 'dificil']);
  });

  it('arquivo com erro: informa o problema e não sobrescreve o arquivo', async () => {
    const broken = '[{"pergunta": "Sem alternativas"}]';
    const { api, state } = fakeApi(broken);
    const result = await createQuestionStorage(api).load();
    expect(result).toEqual({ status: 'invalid', error: expect.stringContaining('Pergunta 1') });
    expect(state.file).toBe(broken);
  });

  it('substituir (restaurar padrão ou importar) guarda antes uma cópia do arquivo atual', async () => {
    const { api, state } = fakeApi('arquivo quebrado');
    const { questions, backupPath } = await createQuestionStorage(api).replace(getDefaultQuestions());
    expect(questions).toHaveLength(20);
    expect(parseQuestionsJson(state.file!)).toHaveLength(20);
    expect(backupPath).toBe('backup-1.json');
    expect(state.backups).toEqual(['arquivo quebrado']);
  });

  it('importar: cancelado retorna null; arquivo inválido lança erro', async () => {
    expect(await createQuestionStorage(fakeApi().api).importFile()).toBeNull();
    await expect(createQuestionStorage(fakeApi(null, '{}').api).importFile()).rejects.toThrow('lista');
    const imported = await createQuestionStorage(fakeApi(null, stringifyQuestions(getDefaultQuestions())).api).importFile();
    expect(imported).toHaveLength(20);
  });

  it('exportar grava no mesmo formato do arquivo de perguntas', async () => {
    const { api, state } = fakeApi();
    await createQuestionStorage(api).exportFile(getDefaultQuestions());
    expect(parseQuestionsJson(state.exported!)).toEqual(getDefaultQuestions());
  });
});
