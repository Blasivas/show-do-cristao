import { contextBridge } from 'electron';

// Canal seguro entre o Electron e o React. Será ampliado na Etapa 4 (armazenamento local via IPC).
contextBridge.exposeInMainWorld('showDoCristao', {
  isElectron: true,
});
