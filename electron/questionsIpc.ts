import { app, BrowserWindow, dialog, ipcMain, shell, type IpcMainInvokeEvent } from 'electron';
import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

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
  const entries = await fs.readdir(root).catch((error: unknown) => {
    if (isMissing(error)) return [] as string[];
    throw error;
  });
  const legacy = entries.filter((name) => name === FILE_NAME || /^perguntas\.backup-.+\.json$/.test(name));
  if (legacy.length === 0) return;
  await fs.mkdir(questionsDir(), { recursive: true });
  for (const name of legacy) {
    const target = path.join(questionsDir(), name);
    const exists = await fs.access(target).then(() => true, () => false);
    if (!exists) await fs.rename(path.join(root, name), target);
  }
}

// Só substitui o banco depois de terminar a gravação; cada operação possui seu próprio temporário.
async function writeAtomic(file: string, content: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, content, { encoding: 'utf-8', flag: 'wx', flush: true });
    await fs.rename(temp, file);
  } finally {
    await fs.rm(temp, { force: true }).catch(() => {});
  }
}

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

/** Registra os canais de IPC das perguntas, aceitando apenas chamadas vindas da página do próprio app */
export function registerQuestionsIpc(isTrustedUrl: (url: string) => boolean) {
  let migrated = false;
  let pending: Promise<void> = Promise.resolve();

  // A fila inclui leitura/criação e backup/substituição completos. Uma falha não bloqueia a próxima tentativa.
  const enqueue = <R>(operation: () => Promise<R>): Promise<R> => {
    const result = pending.then(async () => {
      if (!migrated) {
        await migrateLegacyFiles();
        migrated = true;
      }
      return operation();
    });
    pending = result.then(() => {}, () => {});
    return result;
  };

  const handle = <A extends unknown[], R>(channel: string, listener: (event: IpcMainInvokeEvent, ...args: A) => Promise<R>) =>
    ipcMain.handle(channel, async (event, ...args) => {
      if (!event.senderFrame || !isTrustedUrl(event.senderFrame.url)) throw new Error('Origem não autorizada.');
      return enqueue(() => listener(event, ...(args as A)));
    });

  handle('questions:read-or-create', async (_event, defaultContent: unknown) => {
    if (typeof defaultContent !== 'string') throw new Error('Conteúdo inválido.');
    try {
      return { content: await fs.readFile(questionsFile(), 'utf-8'), createdDefaults: false };
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    await writeAtomic(questionsFile(), defaultContent);
    return { content: defaultContent, createdDefaults: true };
  });

  handle('questions:write', async (_event, content: unknown) => {
    if (typeof content !== 'string') throw new Error('Conteúdo inválido.');
    await writeAtomic(questionsFile(), content);
  });

  // Backup e substituição não podem ser intercalados com outra alteração do banco.
  handle('questions:replace', async (_event, content: unknown) => {
    if (typeof content !== 'string') throw new Error('Conteúdo inválido.');
    const backup = path.join(questionsDir(), `perguntas.backup-${timestamp()}-${randomUUID()}.json`);
    let backupPath: string | null = backup;
    try {
      await fs.copyFile(questionsFile(), backup, constants.COPYFILE_EXCL);
    } catch (error) {
      if (!isMissing(error)) throw error;
      backupPath = null;
    }
    await writeAtomic(questionsFile(), content);
    return backupPath;
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
    await writeAtomic(filePath, content);
    return true;
  });

  handle('questions:open-folder', async () => {
    await fs.mkdir(questionsDir(), { recursive: true });
    const error = await shell.openPath(questionsDir());
    if (error) throw new Error(error);
  });
}
