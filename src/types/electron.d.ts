// API exposta pelo electron/preload.ts via contextBridge
interface QuestionsFileApi {
  /** Conteúdo do arquivo de perguntas, ou `null` se ele ainda não existir */
  read(): Promise<string | null>;
  write(content: string): Promise<void>;
  /** Copia o arquivo atual para um backup e retorna o caminho (ou `null` se não houver arquivo) */
  backup(): Promise<string | null>;
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
