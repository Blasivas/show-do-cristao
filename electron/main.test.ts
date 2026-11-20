import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';

interface FakeWindow {
  isMinimized: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  show: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
}

const state = vi.hoisted(() => ({
  lock: true,
  customPath: '',
  windows: [] as FakeWindow[],
  listeners: new Map<string, () => void>(),
  setPath: vi.fn(),
  mkdir: vi.fn(),
  quit: vi.fn(),
  register: vi.fn(),
  ready: vi.fn(() => Promise.resolve()),
}));

vi.mock('node:fs', () => ({ mkdirSync: state.mkdir }));
vi.mock('./questionsIpc', () => ({ registerQuestionsIpc: state.register }));
vi.mock('electron', () => {
  const BrowserWindow = Object.assign(vi.fn(function () {
    const win = {
      isMinimized: vi.fn(() => false),
      restore: vi.fn(),
      show: vi.fn(),
      focus: vi.fn(),
      once: vi.fn(),
      loadURL: vi.fn(),
      loadFile: vi.fn(),
      webContents: { on: vi.fn() },
    };
    state.windows.push(win);
    return win;
  }), { getAllWindows: () => state.windows });
  return {
    app: {
      commandLine: { getSwitchValue: () => state.customPath },
      setPath: state.setPath,
      requestSingleInstanceLock: () => state.lock,
      quit: state.quit,
      whenReady: state.ready,
      on: (event: string, listener: () => void) => state.listeners.set(event, listener),
    },
    BrowserWindow,
    Menu: { setApplicationMenu: vi.fn() },
  };
});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  state.lock = true;
  state.customPath = '';
  state.windows = [];
  state.listeners.clear();
});

describe('instância única do aplicativo', () => {
  it('encerra a segunda instância sem inicializar janela nem canais IPC', async () => {
    state.lock = false;
    await import('./main');
    expect(state.quit).toHaveBeenCalledOnce();
    expect(state.ready).not.toHaveBeenCalled();
    expect(state.register).not.toHaveBeenCalled();
    expect(state.windows).toHaveLength(0);
  });

  it('restaura e foca a janela existente quando o aplicativo é aberto novamente', async () => {
    await import('./main');
    expect(state.windows).toHaveLength(1);
    state.windows[0].isMinimized.mockReturnValue(true);
    state.listeners.get('second-instance')!();
    expect(state.windows).toHaveLength(1);
    expect(state.windows[0].restore).toHaveBeenCalledOnce();
    expect(state.windows[0].show).toHaveBeenCalledOnce();
    expect(state.windows[0].focus).toHaveBeenCalledOnce();
  });

  it('aplica a pasta de testes aos dados e à sessão antes de iniciar o aplicativo', async () => {
    state.customPath = path.join('scratch', 'dados-isolados');
    await import('./main');
    const resolved = path.resolve(state.customPath);
    expect(state.mkdir).toHaveBeenCalledWith(resolved, { recursive: true });
    expect(state.setPath.mock.calls).toEqual([['userData', resolved], ['sessionData', resolved]]);
    expect(state.setPath.mock.invocationCallOrder[1]).toBeLessThan(state.ready.mock.invocationCallOrder[0]);
  });
});
