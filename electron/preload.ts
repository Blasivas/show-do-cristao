import { contextBridge, ipcRenderer } from 'electron';

// Canal seguro entre o Electron e o React: expõe apenas funções específicas, nunca o ipcRenderer inteiro
contextBridge.exposeInMainWorld('showDoCristao', {
  questions: {
    readOrCreate: (defaultContent: string): Promise<{ content: string; createdDefaults: boolean }> =>
      ipcRenderer.invoke('questions:read-or-create', defaultContent),
    write: (content: string): Promise<void> => ipcRenderer.invoke('questions:write', content),
    replace: (content: string): Promise<string | null> => ipcRenderer.invoke('questions:replace', content),
    importFile: (): Promise<string | null> => ipcRenderer.invoke('questions:import'),
    exportFile: (content: string): Promise<boolean> => ipcRenderer.invoke('questions:export', content),
    openFolder: (): Promise<void> => ipcRenderer.invoke('questions:open-folder'),
  },
});
