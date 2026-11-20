import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { IpcMainInvokeEvent } from 'electron';
import { registerQuestionsIpc } from './questionsIpc';

type Handler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>;

const state = vi.hoisted(() => ({ root: '', handlers: new Map<string, Handler>() }));

vi.mock('electron', () => ({
  app: { getPath: () => state.root },
  BrowserWindow: { fromWebContents: () => null },
  dialog: {},
  ipcMain: { handle: (channel: string, handler: Handler) => state.handlers.set(channel, handler) },
  shell: {},
}));

const event = { senderFrame: { url: 'app://show-do-cristao' } } as IpcMainInvokeEvent;
const invoke = (channel: string, ...args: unknown[]) => state.handlers.get(channel)!(event, ...args);
const file = () => path.join(state.root, 'perguntas', 'perguntas.json');
const read = () => fs.readFile(file(), 'utf-8');
const readOrCreate = (content: string) => invoke('questions:read-or-create', content);
const write = (content: string) => invoke('questions:write', content);
const replace = (content: string) => invoke('questions:replace', content) as Promise<string | null>;
const payload = (index: number) => JSON.stringify([{ pergunta: `Pergunta ${index}`, texto: 'a'.repeat(index * 137) }]);

beforeEach(async () => {
  state.root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdc-ipc-test-'));
  state.handlers.clear();
  registerQuestionsIpc((url) => url === event.senderFrame!.url);
});

afterEach(async () => {
  vi.restoreAllMocks();
  const root = path.resolve(state.root);
  expect(path.dirname(root)).toBe(path.resolve(os.tmpdir()));
  expect(path.basename(root)).toMatch(/^sdc-ipc-test-/);
  await fs.rm(root, { recursive: true, force: true });
});

describe('gravação das perguntas via IPC', () => {
  it('cria o banco uma única vez diante de carregamentos simultâneos', async () => {
    const initial = payload(1);
    const results = await Promise.all([readOrCreate(initial), readOrCreate(payload(2)), readOrCreate(payload(3))]);
    expect(results).toEqual([
      { content: initial, createdDefaults: true },
      { content: initial, createdDefaults: false },
      { content: initial, createdDefaults: false },
    ]);
    expect(await read()).toBe(initial);
  });

  it('preserva cada JSON completo e a ordem das escritas concorrentes', async () => {
    const contents = Array.from({ length: 32 }, (_, i) => payload(i + 1));
    const observed: unknown[] = [];
    const requests = contents.flatMap((content) => [
      write(content),
      readOrCreate('[]').then((result) => observed.push(result)),
    ]);
    await Promise.all(requests);
    expect(observed).toEqual(contents.map((content) => ({ content, createdDefaults: false })));
    expect(JSON.parse(await read())).toEqual(JSON.parse(contents[contents.length - 1]));
    expect(await fs.readdir(path.dirname(file()))).toEqual(['perguntas.json']);
  });

  it('faz backup e substituição juntos, sem intercalar outra gravação', async () => {
    const initial = payload(1);
    await readOrCreate(initial);
    const [firstBackup, , secondBackup] = await Promise.all([
      replace(payload(2)),
      write(payload(3)),
      replace(payload(4)),
    ]);
    expect(firstBackup).not.toBe(secondBackup);
    expect(await fs.readFile(firstBackup!, 'utf-8')).toBe(initial);
    expect(await fs.readFile(secondBackup!, 'utf-8')).toBe(payload(3));
    expect(await read()).toBe(payload(4));
  });

  it('preserva o arquivo anterior e limpa o temporário quando a substituição falha', async () => {
    const initial = payload(1);
    await readOrCreate(initial);
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(Object.assign(new Error('Sem permissão'), { code: 'EACCES' }));
    await expect(write(payload(2))).rejects.toThrow('Sem permissão');
    expect(await read()).toBe(initial);
    expect(await fs.readdir(path.dirname(file()))).toEqual(['perguntas.json']);
    await write(payload(3));
    expect(await read()).toBe(payload(3));
  });

  it('usa temporários exclusivos e recupera a fila após falha durante a escrita', async () => {
    await readOrCreate(payload(1));
    const originalWrite = fs.writeFile.bind(fs);
    const writeSpy = vi.spyOn(fs, 'writeFile');
    writeSpy.mockImplementationOnce(async (target, content, options) => {
      await originalWrite(target, String(content).slice(0, 12), options);
      throw new Error('Gravação interrompida');
    });
    await expect(write(payload(2))).rejects.toThrow('Gravação interrompida');
    expect(await read()).toBe(payload(1));
    await write(payload(3));
    const temporaryFiles = writeSpy.mock.calls.map(([target]) => String(target));
    expect(new Set(temporaryFiles).size).toBe(2);
    expect(await read()).toBe(payload(3));
    expect(await fs.readdir(path.dirname(file()))).toEqual(['perguntas.json']);
  });

  it('não substitui o banco quando o backup falha e permite tentar novamente', async () => {
    const initial = payload(1);
    await readOrCreate(initial);
    vi.spyOn(fs, 'copyFile').mockRejectedValueOnce(new Error('Backup indisponível'));
    await expect(replace(payload(2))).rejects.toThrow('Backup indisponível');
    expect(await read()).toBe(initial);
    const backup = await replace(payload(3));
    expect(await fs.readFile(backup!, 'utf-8')).toBe(initial);
    expect(await read()).toBe(payload(3));
  });

  it('substitui um banco ainda inexistente sem inventar um backup', async () => {
    expect(await replace(payload(1))).toBeNull();
    expect(await read()).toBe(payload(1));
  });

  it('não recria perguntas padrão sobre um arquivo existente com erro', async () => {
    const invalid = '{arquivo com problema';
    await write(invalid);
    expect(await readOrCreate(payload(1))).toEqual({ content: invalid, createdDefaults: false });
    expect(await read()).toBe(invalid);
  });

  it('rejeita origens externas antes de acessar o banco', async () => {
    const external = { senderFrame: { url: 'https://example.com' } } as IpcMainInvokeEvent;
    await expect(state.handlers.get('questions:write')!(external, payload(1))).rejects.toThrow('Origem não autorizada');
    expect(await fs.readdir(state.root)).toEqual([]);
  });
});
