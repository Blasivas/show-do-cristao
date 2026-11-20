// API exposta pelo electron/preload.ts via contextBridge
interface QuestionsFileApi {
  /** Lê o banco ou o cria com o conteúdo padrão, em uma única operação. */
  readOrCreate(defaultContent: string): Promise<{ content: string; createdDefaults: boolean }>;
  write(content: string): Promise<void>;
  /** Guarda backup e substitui o banco juntos; retorna o caminho do backup, ou `null` se o banco não existia. */
  replace(content: string): Promise<string | null>;
  /** Abre a janela "Abrir arquivo" e retorna o conteúdo escolhido, ou `null` se cancelado */
  importFile(): Promise<string | null>;
  /** Abre a janela "Salvar como"; retorna `false` se cancelado */
  exportFile(content: string): Promise<boolean>;
  /** Abre no Explorador de Arquivos a pasta das perguntas (`%APPDATA%\show-do-cristao\perguntas`) */
  openFolder(): Promise<void>;
}

interface ShowDoCristaoApi {
  questions: QuestionsFileApi;
}

interface Window {
  showDoCristao: ShowDoCristaoApi;
}
