import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQuestionStorage, getDefaultQuestions, getGameQuestions } from './questionStorage';
import { parseQuestionsJson, stringifyQuestions } from '@/game/questions';

/** Simula o arquivo `perguntas.json` e as janelas de abrir/salvar do Electron */
function fakeApi(initial: string | null = null, toImport: string | null = null) {
  const state = { file: initial, backups: [] as string[], exported: null as string | null };
  const api: QuestionsFileApi = {
    readOrCreate: async (defaultContent) => {
      const createdDefaults = state.file === null;
      if (createdDefaults) state.file = defaultContent;
      return { content: state.file!, createdDefaults };
    },
    write: async (content) => {
      state.file = content;
    },
    replace: async (content) => {
      let backupPath: string | null = null;
      if (state.file !== null) {
        state.backups.push(state.file);
        backupPath = `backup-${state.backups.length}.json`;
      }
      state.file = content;
      return backupPath;
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

afterEach(() => vi.unstubAllGlobals());

describe('createQuestionStorage', () => {
  it('na primeira abertura cria o arquivo com as 20 perguntas padrão', async () => {
    const { api, state } = fakeApi();
    const result = await createQuestionStorage(api).load();
    expect(result).toMatchObject({ status: 'ok', createdDefaults: true });
    expect(parseQuestionsJson(state.file!)).toHaveLength(20);
    expect(await createQuestionStorage(api).load()).toMatchObject({ status: 'ok', createdDefaults: false });
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

  it('banco existente com alternativas repetidas é rejeitado sem ser alterado', async () => {
    const broken = JSON.stringify([{ pergunta: 'Quem?', alternativas: ['Noé', ' noe ', 'Davi', 'Moisés'], correta: 'A', dificuldade: 'facil' }]);
    const { api, state } = fakeApi(broken);
    const write = vi.spyOn(api, 'write');
    const result = await createQuestionStorage(api).load();
    expect(result).toEqual({ status: 'invalid', error: expect.stringContaining('Pergunta 1: A alternativa B repete') });
    expect(write).not.toHaveBeenCalled();
    expect(state.file).toBe(broken);
  });

  it('um banco vazio existente permanece vazio, sem recriar perguntas padrão', async () => {
    const { api, state } = fakeApi('[]');
    expect(await createQuestionStorage(api).load()).toEqual({ status: 'ok', questions: [], createdDefaults: false });
    expect(state.file).toBe('[]');
  });

  it('falha de leitura é propagada sem tentar gravar outro banco', async () => {
    const { api, state } = fakeApi('arquivo original');
    vi.spyOn(api, 'readOrCreate').mockRejectedValueOnce(new Error('Acesso negado.'));
    const write = vi.spyOn(api, 'write');
    await expect(createQuestionStorage(api).load()).rejects.toThrow('Acesso negado.');
    expect(write).not.toHaveBeenCalled();
    expect(state.file).toBe('arquivo original');
  });

  it('falha ao salvar é propagada e permite tentar novamente', async () => {
    const original = stringifyQuestions(getDefaultQuestions());
    const { api, state } = fakeApi(original);
    const write = vi.spyOn(api, 'write').mockRejectedValueOnce(new Error('Disco indisponível.'));
    const storage = createQuestionStorage(api);
    const next = getDefaultQuestions().slice(0, 2);
    await expect(storage.save(next)).rejects.toThrow('Disco indisponível.');
    expect(state.file).toBe(original);
    await storage.save(next);
    expect(write).toHaveBeenCalledTimes(2);
    expect(parseQuestionsJson(state.file!)).toHaveLength(2);
  });

  it('substituir (restaurar padrão ou importar) guarda antes uma cópia do arquivo atual', async () => {
    const { api, state } = fakeApi('arquivo quebrado');
    const { questions, backupPath } = await createQuestionStorage(api).replace(getDefaultQuestions());
    expect(questions).toHaveLength(20);
    expect(parseQuestionsJson(state.file!)).toHaveLength(20);
    expect(backupPath).toBe('backup-1.json');
    expect(state.backups).toEqual(['arquivo quebrado']);
  });

  it('substituir usa uma única operação de backup e gravação; falha não vira gravação simples', async () => {
    const { api, state } = fakeApi('arquivo original');
    const replace = vi.spyOn(api, 'replace').mockRejectedValueOnce(new Error('Falha no backup.'));
    const write = vi.spyOn(api, 'write');
    const next = getDefaultQuestions();
    await expect(createQuestionStorage(api).replace(next)).rejects.toThrow('Falha no backup.');
    expect(replace).toHaveBeenCalledExactlyOnceWith(stringifyQuestions(next));
    expect(write).not.toHaveBeenCalled();
    expect(state.file).toBe('arquivo original');
  });

  it('importar: cancelado retorna null; arquivo inválido lança erro', async () => {
    expect(await createQuestionStorage(fakeApi().api).importFile()).toBeNull();
    await expect(createQuestionStorage(fakeApi(null, '{}').api).importFile()).rejects.toThrow('lista');
    const imported = await createQuestionStorage(fakeApi(null, stringifyQuestions(getDefaultQuestions())).api).importFile();
    expect(imported).toHaveLength(20);
  });

  it('importação com uma pergunta repetida rejeita o arquivo inteiro e preserva o banco', async () => {
    const original = stringifyQuestions(getDefaultQuestions().slice(0, 1));
    const incoming = JSON.parse(original);
    incoming.push({ ...incoming[0], alternativas: ['Davi', 'Moisés', ' DAVÍ ', 'Noé'] });
    const { api, state } = fakeApi(original, JSON.stringify(incoming));
    const write = vi.spyOn(api, 'write');
    const replace = vi.spyOn(api, 'replace');
    await expect(createQuestionStorage(api).importFile()).rejects.toThrow('Pergunta 2: A alternativa C repete');
    expect(write).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(state.file).toBe(original);
  });

  it('exportar grava no mesmo formato do arquivo de perguntas', async () => {
    const { api, state } = fakeApi();
    await createQuestionStorage(api).exportFile(getDefaultQuestions());
    expect(parseQuestionsJson(state.exported!)).toEqual(getDefaultQuestions());
  });
});

describe('getGameQuestions', () => {
  const useApi = (api: QuestionsFileApi) => vi.stubGlobal('window', { showDoCristao: { questions: api } });

  it('usa as perguntas cadastradas em vez de trocar pelo banco padrão', async () => {
    const questions = getDefaultQuestions().slice(0, 2);
    const { api } = fakeApi(stringifyQuestions(questions));
    useApi(api);
    expect(await getGameQuestions()).toEqual(questions);
  });

  it('primeira abertura cria as perguntas padrão normalmente', async () => {
    const { api, state } = fakeApi();
    useApi(api);
    expect(await getGameQuestions()).toEqual(getDefaultQuestions());
    expect(parseQuestionsJson(state.file!)).toHaveLength(20);
  });

  it('arquivo inválido impede carregar a partida e preserva o conteúdo original', async () => {
    const { api, state } = fakeApi('JSON quebrado');
    useApi(api);
    await expect(getGameQuestions()).rejects.toThrow('Não foi possível carregar as perguntas: O arquivo não é um JSON válido');
    expect(state.file).toBe('JSON quebrado');
  });

  it('erro de acesso impede carregar a partida e apresenta mensagem legível', async () => {
    const { api, state } = fakeApi('arquivo original');
    vi.spyOn(api, 'readOrCreate').mockRejectedValue(new Error("Error invoking remote method 'questions:read-or-create': Error: Acesso negado."));
    useApi(api);
    await expect(getGameQuestions()).rejects.toThrow('Não foi possível carregar as perguntas: Acesso negado.');
    expect(state.file).toBe('arquivo original');
  });

  it.each([undefined, {}, { showDoCristao: {} }])('ponte indisponível impede carregar a partida', async (windowValue) => {
    vi.stubGlobal('window', windowValue);
    await expect(getGameQuestions()).rejects.toThrow('Não foi possível acessar o armazenamento');
  });

  it('banco vazio não é substituído automaticamente', async () => {
    const { api } = fakeApi('[]');
    useApi(api);
    expect(await getGameQuestions()).toEqual([]);
  });
});
