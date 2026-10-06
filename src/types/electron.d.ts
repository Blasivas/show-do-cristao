// API exposta pelo electron/preload.ts via contextBridge (ausente quando roda no navegador)
interface ShowDoCristaoApi {
  isElectron: boolean;
}

interface Window {
  showDoCristao?: ShowDoCristaoApi;
}
