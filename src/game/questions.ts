import type { Difficulty, Question } from '@/types/game';

/** Formato de cada pergunta no arquivo JSON editável pelo usuário */
export interface QuestionFileEntry {
  pergunta: string;
  alternativas: string[];
  correta: string;
  dificuldade: string;
}

export const LETTERS = ['A', 'B', 'C', 'D'] as const;
const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil'];

// Aceita "Fácil", "MEDIO", "difícil" etc.
const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

const isFilledString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/**
 * Lê e valida o conteúdo do arquivo de perguntas, convertendo para o formato interno.
 * Lança um erro em português indicando o número da pergunta com problema.
 */
export function parseQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) throw new Error('O arquivo de perguntas deve conter uma lista de perguntas.');

  return raw.map((entry: Partial<QuestionFileEntry>, index) => {
    const fail = (message: string): never => {
      throw new Error(`Pergunta ${index + 1}: ${message}`);
    };

    if (typeof entry !== 'object' || entry === null) fail('formato inválido.');
    if (!isFilledString(entry.pergunta)) fail('o texto da pergunta é obrigatório.');

    const { alternativas } = entry;
    if (!Array.isArray(alternativas) || alternativas.length !== 4 || !alternativas.every(isFilledString)) {
      fail('são obrigatórias exatamente 4 alternativas preenchidas.');
    }

    const correctIndex = LETTERS.indexOf(String(entry.correta ?? '').trim().toUpperCase() as (typeof LETTERS)[number]);
    if (correctIndex === -1) fail('a resposta correta deve ser "A", "B", "C" ou "D".');

    const difficulty = normalize(String(entry.dificuldade ?? '')) as Difficulty;
    if (!DIFFICULTIES.includes(difficulty)) fail('a dificuldade deve ser "facil", "medio" ou "dificil".');

    return {
      id: `q${index + 1}`,
      text: entry.pergunta!.trim(),
      options: alternativas!.map((a) => a.trim()) as Question['options'],
      correctIndex: correctIndex as Question['correctIndex'],
      difficulty,
    };
  });
}

/** Lê o texto de um arquivo JSON de perguntas (arquivo salvo ou importado) */
export function parseQuestionsJson(text: string): Question[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('O arquivo não é um JSON válido. Verifique vírgulas, aspas e colchetes.');
  }
  return parseQuestions(raw);
}

/** Converte para o formato do arquivo JSON (inverso de `parseQuestions`) */
export const serializeQuestions = (questions: Question[]): QuestionFileEntry[] =>
  questions.map((q) => ({
    pergunta: q.text,
    alternativas: [...q.options],
    correta: LETTERS[q.correctIndex],
    dificuldade: q.difficulty,
  }));

export const stringifyQuestions = (questions: Question[]) => `${JSON.stringify(serializeQuestions(questions), null, 2)}\n`;

/** Dados do formulário de criação/edição de pergunta */
export interface QuestionDraft {
  text: string;
  options: [string, string, string, string];
  correctIndex: number | null;
  difficulty: Difficulty | null;
}

export interface DraftErrors {
  text?: string;
  options: (string | undefined)[];
  correct?: string;
  difficulty?: string;
}

export const emptyDraft = (): QuestionDraft => ({ text: '', options: ['', '', '', ''], correctIndex: null, difficulty: null });

export const draftFromQuestion = (q: Question): QuestionDraft => ({
  text: q.text,
  options: [...q.options],
  correctIndex: q.correctIndex,
  difficulty: q.difficulty,
});

export function validateDraft(draft: QuestionDraft): DraftErrors {
  const trimmed = draft.options.map((o) => normalize(o));
  return {
    text: draft.text.trim() ? undefined : 'Escreva o enunciado da pergunta.',
    options: draft.options.map((option, i) => {
      if (!option.trim()) return `Preencha a alternativa ${LETTERS[i]}.`;
      if (trimmed.indexOf(trimmed[i]) !== i) return `A alternativa ${LETTERS[i]} repete outra alternativa.`;
      return undefined;
    }),
    correct: draft.correctIndex === null ? 'Marque qual é a alternativa correta.' : undefined,
    difficulty: draft.difficulty === null ? 'Escolha a dificuldade.' : undefined,
  };
}

export const hasErrors = (errors: DraftErrors) =>
  Boolean(errors.text || errors.correct || errors.difficulty || errors.options.some(Boolean));

const DIFFICULTY_RANK: Record<Difficulty, number> = { facil: 0, medio: 1, dificil: 2 };

/**
 * Ordena as perguntas por dificuldade: todas as fáceis, depois as médias, depois as difíceis (decisão D24).
 * A ordenação é estável: dentro de cada dificuldade, a ordem original é mantida.
 */
export const sortByDifficulty = (questions: Question[]): Question[] =>
  [...questions].sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]);

/**
 * Insere ou atualiza uma pergunta mantendo a ordenação por dificuldade.
 * Pergunta nova, ou que mudou de dificuldade, vai para o final do grupo da sua dificuldade;
 * se a dificuldade não mudou, a pergunta permanece na mesma posição.
 */
export function upsertQuestion(questions: Question[], question: Question): Question[] {
  const previous = questions.find((q) => q.id === question.id);
  if (previous && previous.difficulty === question.difficulty) {
    return questions.map((q) => (q.id === question.id ? question : q));
  }
  return sortByDifficulty([...questions.filter((q) => q.id !== question.id), question]);
}

/** Adiciona perguntas (ex.: importadas) ao final do grupo de cada dificuldade, gerando novos ids para evitar repetição */
export const appendQuestions = (existing: Question[], added: Question[]): Question[] =>
  sortByDifficulty([...existing, ...added.map((q) => ({ ...q, id: crypto.randomUUID() }))]);

/** Converte um rascunho já validado em pergunta */
export function draftToQuestion(draft: QuestionDraft, id: string): Question {
  if (hasErrors(validateDraft(draft))) throw new Error('A pergunta possui campos inválidos.');
  return {
    id,
    text: draft.text.trim(),
    options: draft.options.map((o) => o.trim()) as Question['options'],
    correctIndex: draft.correctIndex as Question['correctIndex'],
    difficulty: draft.difficulty!,
  };
}
