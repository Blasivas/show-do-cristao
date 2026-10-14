import { app, BrowserWindow, dialog, ipcMain, shell, type IpcMainInvokeEvent } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

const FILE_NAME = 'perguntas.json';
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const JSON_FILTER = [{ name: 'Perguntas (JSON)', extensions: ['json'] }];

// Subpasta só com os arquivos de perguntas, separada dos arquivos internos do Electron (cache etc.)
const questionsDir = () => path.join(app.getPath('userData'), 'perguntas');
const questionsFile = () => path.join(questionsDir(), FILE_NAME);

const isMissing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';

/** Move arquivos de perguntas gravados na raiz da pasta de dados (versão anterior) para a subpasta `perguntas` */
async function migrateLegacyFiles() {
  const root = app.getPath('userData');
  const entries = await fs.readdir(root).catch(() => [] as string[]);
  const legacy = entries.filter((name) => name === FILE_NAME || /^perguntas\.backup-.+\.json$/.test(name));
  if (legacy.length === 0) return;
  await fs.mkdir(questionsDir(), { recursive: true });
  for (const name of legacy) {
    const target = path.join(questionsDir(), name);
    const exists = await fs.access(target).then(() => true, () => false);
    if (!exists) await fs.rename(path.join(root, name), target);
  }
}

// Grava em um arquivo temporário e depois substitui o definitivo, evitando arquivo corrompido em caso de queda de energia
async function writeAtomic(file: string, content: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, content, 'utf-8');
  await fs.rename(temp, file);
}

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

/** Registra os canais de IPC das perguntas, aceitando apenas chamadas vindas da página do próprio app */
export function registerQuestionsIpc(isTrustedUrl: (url: string) => boolean) {
  const migration = migrateLegacyFiles().catch((error) => console.error('Falha ao migrar arquivos de perguntas:', error));

  const handle = <A extends unknown[], R>(channel: string, listener: (event: IpcMainInvokeEvent, ...args: A) => Promise<R>) =>
    ipcMain.handle(channel, async (event, ...args) => {
      if (!event.senderFrame || !isTrustedUrl(event.senderFrame.url)) throw new Error('Origem não autorizada.');
      await migration;
      return listener(event, ...(args as A));
    });

  handle('questions:read', async () => {
    try {
      return await fs.readFile(questionsFile(), 'utf-8');
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  });

  handle('questions:write', async (_event, content: unknown) => {
    if (typeof content !== 'string') throw new Error('Conteúdo inválido.');
    await writeAtomic(questionsFile(), content);
  });

  // Guarda uma cópia do arquivo atual (ex.: antes de substituir um arquivo com erro)
  handle('questions:backup', async () => {
    const backup = path.join(questionsDir(), `perguntas.backup-${timestamp()}.json`);
    try {
      await fs.copyFile(questionsFile(), backup);
      return backup;
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  });

  handle('questions:import', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const options = { title: 'Importar perguntas', filters: JSON_FILTER, properties: ['openFile' as const] };
    const { canceled, filePaths } = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    if (canceled || filePaths.length === 0) return null;
    const { size } = await fs.stat(filePaths[0]);
    if (size > MAX_IMPORT_BYTES) throw new Error('O arquivo é grande demais (máximo de 5 MB).');
    return fs.readFile(filePaths[0], 'utf-8');
  });

  handle('questions:export', async (event, content: unknown) => {
    if (typeof content !== 'string') throw new Error('Conteúdo inválido.');
    const win = BrowserWindow.fromWebContents(event.sender);
    const options = {
      title: 'Exportar perguntas',
      defaultPath: path.join(app.getPath('documents'), 'perguntas-show-do-cristao.json'),
      filters: JSON_FILTER,
    };
    const { canceled, filePath } = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (canceled || !filePath) return false;
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  });

  handle('questions:open-folder', async () => {
    await fs.mkdir(questionsDir(), { recursive: true });
    const error = await shell.openPath(questionsDir());
    if (error) throw new Error(error);
  });
}
