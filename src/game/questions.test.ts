import { describe, expect, it } from 'vitest';
import { parseQuestions } from './questions';
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
