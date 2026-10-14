import { describe, expect, it } from 'vitest';
import {
  appendQuestions,
  draftFromQuestion,
  draftToQuestion,
  emptyDraft,
  hasErrors,
  parseQuestions,
  parseQuestionsJson,
  serializeQuestions,
  sortByDifficulty,
  stringifyQuestions,
  upsertQuestion,
  validateDraft,
  type QuestionDraft,
} from './questions';
import type { Question } from '@/types/game';
import perguntas from '@/data/perguntas.json';

const valid = {
  pergunta: 'Quem construiu a arca?',
  alternativas: ['Moisés', 'Noé', 'Abraão', 'Davi'],
  correta: 'B',
  dificuldade: 'facil',
};

describe('parseQuestions', () => {
  it('converte o formato do arquivo para o formato interno', () => {
    expect(parseQuestions([valid])).toEqual([
      {
        id: 'q1',
        text: 'Quem construiu a arca?',
        options: ['Moisés', 'Noé', 'Abraão', 'Davi'],
        correctIndex: 1,
        difficulty: 'facil',
      },
    ]);
  });

  it('aceita letra minúscula e dificuldade com acento ou maiúscula', () => {
    const [q] = parseQuestions([{ ...valid, correta: ' d ', dificuldade: 'Difícil' }]);
    expect(q.correctIndex).toBe(3);
    expect(q.difficulty).toBe('dificil');
  });

  it('indica o número da pergunta com problema', () => {
    expect(() => parseQuestions([valid, { ...valid, pergunta: ' ' }])).toThrow('Pergunta 2');
    expect(() => parseQuestions([{ ...valid, alternativas: ['a', 'b', 'c'] }])).toThrow('4 alternativas');
    expect(() => parseQuestions([{ ...valid, alternativas: ['a', 'b', 'c', ''] }])).toThrow('4 alternativas');
    expect(() => parseQuestions([{ ...valid, correta: 'E' }])).toThrow('resposta correta');
    expect(() => parseQuestions([{ ...valid, dificuldade: 'extrema' }])).toThrow('dificuldade');
    expect(() => parseQuestions([null])).toThrow('Pergunta 1');
    expect(() => parseQuestions({})).toThrow('lista');
  });

  it('o arquivo padrão tem 20 perguntas válidas (7 fáceis, 7 médias, 6 difíceis)', () => {
    const questions = parseQuestions(perguntas);
    const count = (d: string) => questions.filter((q) => q.difficulty === d).length;
    expect(questions).toHaveLength(20);
    expect([count('facil'), count('medio'), count('dificil')]).toEqual([7, 7, 6]);
  });
});

describe('parseQuestionsJson e serialização', () => {
  it('informa em português quando o texto não é um JSON válido', () => {
    expect(() => parseQuestionsJson('[{"pergunta": "x",]')).toThrow('JSON válido');
  });

  it('ida e volta: serializar e ler de novo devolve as mesmas perguntas', () => {
    const questions = parseQuestions(perguntas);
    expect(serializeQuestions(questions)).toEqual(perguntas);
    expect(parseQuestionsJson(stringifyQuestions(questions))).toEqual(questions);
  });

  it('ao adicionar perguntas importadas, gera ids novos sem repetição', () => {
    const existing = parseQuestions([valid]);
    const merged = appendQuestions(existing, parseQuestions([valid]));
    expect(merged).toHaveLength(2);
    expect(new Set(merged.map((q) => q.id)).size).toBe(2);
  });
});

describe('ordenação por dificuldade', () => {
  const q = (id: string, difficulty: Question['difficulty']): Question => ({
    id,
    text: id,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    difficulty,
  });
  const ids = (list: Question[]) => list.map((x) => x.id).join(',');
  // f = fácil, m = médio, d = difícil
  const list = [q('f1', 'facil'), q('f2', 'facil'), q('f3', 'facil'), q('m1', 'medio'), q('m2', 'medio'), q('d1', 'dificil')];

  it('ordena fáceis, médias e difíceis mantendo a ordem dentro de cada grupo', () => {
    const mixed = [q('d1', 'dificil'), q('f1', 'facil'), q('m1', 'medio'), q('f2', 'facil'), q('m2', 'medio')];
    expect(ids(sortByDifficulty(mixed))).toBe('f1,f2,m1,m2,d1');
  });

  it('pergunta nova entra no final do grupo da sua dificuldade', () => {
    expect(ids(upsertQuestion(list, q('novaM', 'medio')))).toBe('f1,f2,f3,m1,m2,novaM,d1');
    expect(ids(upsertQuestion(list, q('novaF', 'facil')))).toBe('f1,f2,f3,novaF,m1,m2,d1');
  });

  it('a pergunta 3 (fácil) que vira média vai para o final das médias; se vira difícil, para o final das difíceis', () => {
    expect(ids(upsertQuestion(list, { ...list[2], difficulty: 'medio' }))).toBe('f1,f2,m1,m2,f3,d1');
    expect(ids(upsertQuestion(list, { ...list[2], difficulty: 'dificil' }))).toBe('f1,f2,m1,m2,d1,f3');
  });

  it('editar sem mudar a dificuldade mantém a posição', () => {
    const edited = upsertQuestion(list, { ...list[0], text: 'editada' });
    expect(ids(edited)).toBe(ids(list));
    expect(edited[0].text).toBe('editada');
  });

  it('perguntas importadas entram no final do grupo de cada dificuldade', () => {
    const merged = appendQuestions(list, [q('x', 'dificil'), q('y', 'facil')]);
    expect(merged.map((x) => x.difficulty).join(',')).toBe('facil,facil,facil,facil,medio,medio,dificil,dificil');
    expect(merged[3].text).toBe('y');
    expect(merged[7].text).toBe('x');
  });
});

describe('formulário de pergunta (rascunho)', () => {
  const filled: QuestionDraft = {
    text: ' Quem construiu a arca? ',
    options: ['Moisés', ' Noé ', 'Abraão', 'Davi'],
    correctIndex: 1,
    difficulty: 'facil',
  };

  it('rascunho vazio aponta todos os campos obrigatórios', () => {
    const errors = validateDraft(emptyDraft());
    expect(errors.text).toBeDefined();
    expect(errors.options.filter(Boolean)).toHaveLength(4);
    expect(errors.correct).toBeDefined();
    expect(errors.difficulty).toBeDefined();
  });

  it('não aceita alternativas repetidas (ignorando acentos e maiúsculas)', () => {
    const errors = validateDraft({ ...filled, options: ['Noé', 'noe', 'Abraão', 'Davi'] });
    expect(errors.options).toEqual([undefined, 'A alternativa B repete outra alternativa.', undefined, undefined]);
  });

  it('rascunho válido vira pergunta com textos sem espaços extras', () => {
    expect(hasErrors(validateDraft(filled))).toBe(false);
    expect(draftToQuestion(filled, 'novo')).toEqual({
      id: 'novo',
      text: 'Quem construiu a arca?',
      options: ['Moisés', 'Noé', 'Abraão', 'Davi'],
      correctIndex: 1,
      difficulty: 'facil',
    });
    expect(() => draftToQuestion(emptyDraft(), 'x')).toThrow();
  });

  it('editar: a pergunta vira rascunho e volta igual', () => {
    const [q] = parseQuestions([valid]);
    expect(draftToQuestion(draftFromQuestion(q), q.id)).toEqual(q);
  });
});
