import type { Difficulty, Question } from '@/types/game';

/** Formato de cada pergunta no arquivo JSON editável pelo usuário */
export interface QuestionFileEntry {
  pergunta: string;
  alternativas: string[];
  correta: string;
  dificuldade: string;
}

const LETTERS = ['A', 'B', 'C', 'D'] as const;
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
