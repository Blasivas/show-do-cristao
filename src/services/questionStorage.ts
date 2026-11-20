import type { Question } from '@/types/game';
import { parseQuestions, parseQuestionsJson, sortByDifficulty, stringifyQuestions } from '@/game/questions';
import defaultQuestionsFile from '@/data/perguntas.json';

export type LoadResult =
  | { status: 'ok'; questions: Question[]; createdDefaults: boolean }
  | { status: 'invalid'; error: string };

export const getDefaultQuestions = () => sortByDifficulty(parseQuestions(defaultQuestionsFile));

/** Mensagem legível de um erro, sem o prefixo técnico que o Electron adiciona aos erros vindos do processo principal */
export const errorMessage = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');

const sameOrder = (a: Question[], b: Question[]) => a.every((q, i) => q === b[i]);

/**
 * Leitura e gravação das perguntas no arquivo `perguntas.json` da pasta das perguntas.
 * As perguntas são sempre mantidas na ordem fáceis → médias → difíceis (decisão D24).
 */
export function createQuestionStorage(api: QuestionsFileApi) {
  const save = (questions: Question[]) => api.write(stringifyQuestions(sortByDifficulty(questions)));

  return {
    save,

    /**
     * Na primeira abertura cria o arquivo com as perguntas padrão; se o arquivo tiver erro, não o sobrescreve.
     * Se o arquivo estiver fora de ordem (ex.: editado à mão), ele é regravado já ordenado.
     */
    async load(): Promise<LoadResult> {
      const { content, createdDefaults } = await api.readOrCreate(stringifyQuestions(getDefaultQuestions()));
      let parsed: Question[];
      try {
        parsed = parseQuestionsJson(content);
      } catch (error) {
        return { status: 'invalid', error: errorMessage(error) };
      }
      const questions = sortByDifficulty(parsed);
      if (!sameOrder(parsed, questions)) await save(questions);
      return { status: 'ok', questions, createdDefaults };
    },

    /** Substitui todas as perguntas (restaurar padrão, importar), guardando antes uma cópia do arquivo atual */
    async replace(questions: Question[]): Promise<{ questions: Question[]; backupPath: string | null }> {
      const sorted = sortByDifficulty(questions);
      const backupPath = await api.replace(stringifyQuestions(sorted));
      return { questions: sorted, backupPath };
    },

    /** Abre a janela "Abrir arquivo"; retorna `null` se o usuário cancelar. Lança erro se o arquivo for inválido. */
    async importFile(): Promise<Question[] | null> {
      const content = await api.importFile();
      return content === null ? null : sortByDifficulty(parseQuestionsJson(content));
    },

    exportFile: (questions: Question[]) => api.exportFile(stringifyQuestions(sortByDifficulty(questions))),
  };
}

export type QuestionStorage = ReturnType<typeof createQuestionStorage>;

/** Carrega o banco da partida; qualquer erro deve ser corrigido antes de iniciar a gincana. */
export async function getGameQuestions(): Promise<Question[]> {
  if (typeof window === 'undefined' || !window.showDoCristao?.questions) {
    throw new Error('Não foi possível acessar o armazenamento de perguntas do aplicativo.');
  }
  try {
    const storage = createQuestionStorage(window.showDoCristao.questions);
    const result = await storage.load();
    if (result.status === 'invalid') throw new Error(result.error);
    return result.questions;
  } catch (error) {
    throw new Error(`Não foi possível carregar as perguntas: ${errorMessage(error)}`);
  }
}

