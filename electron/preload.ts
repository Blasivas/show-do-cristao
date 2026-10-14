import { contextBridge, ipcRenderer } from 'electron';

// Canal seguro entre o Electron e o React: expõe apenas funções específicas, nunca o ipcRenderer inteiro
contextBridge.exposeInMainWorld('showDoCristao', {
  questions: {
    read: (): Promise<string | null> => ipcRenderer.invoke('questions:read'),
    write: (content: string): Promise<void> => ipcRenderer.invoke('questions:write', content),
    backup: (): Promise<string | null> => ipcRenderer.invoke('questions:backup'),
    importFile: (): Promise<string | null> => ipcRenderer.invoke('questions:import'),
    exportFile: (content: string): Promise<boolean> => ipcRenderer.invoke('questions:export', content),
    openFolder: (): Promise<void> => ipcRenderer.invoke('questions:open-folder'),
  },
});
