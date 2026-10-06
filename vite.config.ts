import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron/simple';
import path from 'path';

// Política de segurança de conteúdo aplicada apenas no build (o modo dev precisa de scripts inline para o hot reload)
const cspPlugin = (): Plugin => ({
  name: 'show-do-cristao-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content:
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:",
      },
      injectTo: 'head-prepend',
    },
  ],
});

// https://vitejs.dev/config/
// `--mode web` roda apenas no navegador, sem abrir o Electron
export default defineConfig(async ({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    cspPlugin(),
    mode !== 'web' &&
      (await electron({
        main: {
          entry: 'electron/main.ts',
          // Inicia sem o argumento padrão `--no-sandbox`, mantendo o sandbox ativo também em desenvolvimento
          onstart: ({ startup }) => {
            startup(['.']);
          },
        },
        preload: {
          input: 'electron/preload.ts',
          vite: {
            build: {
              rolldownOptions: {
                output: { entryFileNames: '[name].cjs' },
              },
            },
          },
        },
      })),
  ],
  base: './', // Essencial para rodar como arquivo local (.exe / Electron) sem quebrar rotas
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
}));
