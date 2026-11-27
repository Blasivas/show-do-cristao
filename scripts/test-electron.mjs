import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

// Regressão do build real do Electron, sempre com um perfil descartável.
// Os diálogos e as falhas são simulados pelo depurador somente no processo criado aqui.
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const require = createRequire(import.meta.url);
const executable = require('electron');
const testPrefix = 'sdc-electron-51-';
const sockets = [];
let profile;
let child;
let main;
let ui;
let logs = '';
let passed = 0;

class Protocol {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(String(data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error('Conexão com o Electron encerrada.'));
      }
      this.pending.clear();
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    sockets.push(socket);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Tempo esgotado ao conectar ao depurador.')), 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Falha na conexão com o depurador.')); }, { once: true });
    });
    return new Protocol(socket);
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Tempo esgotado em ${method}.`));
      }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async run(fn, ...args) {
    const expression = `(${fn.toString()})(${args.map((arg) => JSON.stringify(arg)).join(',')})`;
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result?.value;
  }
}

async function waitFor(check, label, timeout = 10000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try { if (await check()) return; } catch (error) { lastError = error; }
    await delay(75);
  }
  throw new Error(`Tempo esgotado: ${label}${lastError ? ` (${lastError.message})` : ''}`);
}

const waitBookIdle = () => waitFor(() => ui.run(() => !document.querySelector('[data-book-transition]')), 'transição do livro concluída');
const waitUi = (predicate, label, ...args) => waitFor(async () =>
  await ui.run(() => !document.querySelector('[data-book-transition]')) && await ui.run(predicate, ...args), label);
const text = () => ui.run(() => document.body.innerText);
const bankFile = () => path.join(profile, 'perguntas', 'perguntas.json');
const bankText = () => fs.readFile(bankFile(), 'utf-8');
const bank = async () => JSON.parse(await bankText());

async function button(label, scope = 'body') {
  await waitBookIdle();
  await ui.run((label, scope) => {
    const normalize = (value) => value.replace(/\s+/g, ' ').trim();
    const candidates = [...document.querySelector(scope).querySelectorAll('button')];
    const selected = candidates.find((element) => normalize(element.textContent) === label);
    if (!selected) throw new Error(`Botão não encontrado: ${label}`);
    if (selected.matches(':disabled')) throw new Error(`Botão desabilitado: ${label}`);
    selected.click();
  }, label, scope);
}

async function click(selector) {
  await waitBookIdle();
  await ui.run((selector) => {
    const element = document.querySelector(selector);
    if (!element || element.matches(':disabled')) throw new Error(`Controle indisponível: ${selector}`);
    element.click();
  }, selector);
}

async function fill(selector, value) {
  await waitBookIdle();
  await ui.run((selector, value) => {
    const element = document.querySelector(selector);
    if (!element || element.matches(':disabled')) throw new Error(`Campo indisponível: ${selector}`);
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
}

async function reloadMenu() {
  await ui.send('Page.reload');
  await waitUi(() => [...document.querySelectorAll('button')].some((element) => element.textContent.trim() === 'Configurar Perguntas'), 'capa inicial');
}

async function openManager() {
  await button('Configurar Perguntas');
  await waitUi(() => !document.querySelector('[aria-busy="true"]') && (document.body.innerText.includes('Problema no Perguntas.json') || (Boolean(document.querySelector('[aria-label="Importar perguntas"]')) && document.querySelectorAll('article').length > 0)), 'cadastro de perguntas carregado');
}

async function newQuestion(questionText) {
  await button('Nova pergunta');
  await waitUi(() => Boolean(document.querySelector('#question-text')), 'formulário da pergunta');
  await fill('#question-text', questionText);
  for (const [index, letter] of ['A', 'B', 'C', 'D'].entries()) {
    await fill(`[aria-label="Alternativa ${letter}"]`, `Resposta ${index + 1}`);
  }
  await click('[aria-label="Marcar alternativa A como correta"]');
  await button('Fácil · 10 pts', '[role="dialog"]');
}

async function chooseFile(kind, filePath) {
  await main.run((kind, filePath) => {
    const { dialog } = globalThis.__sdc51.electron;
    const name = kind === 'import' ? 'showOpenDialog' : 'showSaveDialog';
    const original = dialog[name];
    globalThis.__sdc51.dialogs[name] = original;
    dialog[name] = async () => {
      dialog[name] = original;
      return kind === 'import' ? { canceled: false, filePaths: [filePath] } : { canceled: false, filePath };
    };
  }, kind, filePath);
}

async function importReplacing(filePath, count) {
  await chooseFile('import', filePath);
  await click('[aria-label="Importar perguntas"]');
  await waitUi(() => Boolean(document.querySelector('[role="dialog"]')), 'confirmação da importação');
  await button('Substituir todas', '[role="dialog"]');
  await waitUi(() => !document.querySelector('[role="dialog"]') && !document.querySelector('[aria-busy="true"]'), 'substituição concluída');
  assert.equal((await bank()).length, count);
}

async function screenshot(name, stage = '5.1') {
  const directory = path.join(root, 'scratch');
  await fs.mkdir(directory, { recursive: true });
  const { data } = await ui.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const target = path.join(directory, `etapa-${stage}-${name}.png`);
  await fs.writeFile(target, Buffer.from(data, 'base64'));
  console.log(`  Captura: ${path.relative(root, target)}`);
}

async function menuReady() {
  await waitUi(() => {
    const stage = document.querySelector('#bible-stage');
    const tilt = document.querySelector('#bible-tilt');
    const actions = [...document.querySelectorAll('#bible-box button')];
    return Boolean(stage && tilt) && actions.length === 2 && actions.every((element) => !element.matches(':disabled'));
  }, 'Bíblia fechada pronta para interação');
}

async function bibleSnapshot() {
  return ui.run(() => {
    const stage = document.querySelector('#bible-stage');
    const tilt = document.querySelector('#bible-tilt');
    const style = getComputedStyle(tilt);
    const bounds = stage.getBoundingClientRect();
    return {
      x: parseFloat(style.getPropertyValue('--bible-tilt-x')) || 0,
      y: parseFloat(style.getPropertyValue('--bible-tilt-y')) || 0,
      transform: style.transform,
      projected: style.transform !== 'none' && !new DOMMatrixReadOnly(style.transform).isIdentity,
      disabled: stage.dataset.motionDisabled === 'true',
      busy: stage.dataset.bookBusy === 'true',
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      coarse: matchMedia('(pointer: coarse)').matches,
      bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
    };
  });
}

async function moveOnBook(horizontal, vertical) {
  const { bounds } = await bibleSnapshot();
  await ui.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved', pointerType: 'mouse',
    x: bounds.x + bounds.width * horizontal,
    y: bounds.y + bounds.height * vertical,
  });
}

async function leaveBook() {
  await ui.send('Input.dispatchMouseEvent', { type: 'mouseMoved', pointerType: 'mouse', x: 5, y: 5 });
  await waitFor(async () => {
    const state = await bibleSnapshot();
    return Math.abs(state.x) < 0.05 && Math.abs(state.y) < 0.05;
  }, 'retorno suave da Bíblia ao repouso');
}

async function setMenuTheme(dark) {
  const current = await ui.run(() => document.documentElement.classList.contains('dark'));
  if (current !== dark) await click('[role="switch"]');
  await waitUi((dark) => document.documentElement.classList.contains(dark ? 'dark' : 'light'), 'tema do menu', dark);
  await delay(250);
}

async function bookButtonPoint(label) {
  return ui.run((label) => {
    const selected = [...document.querySelectorAll('#bible-box button')].find((element) => element.textContent.trim() === label);
    if (!selected || selected.matches(':disabled')) throw new Error(`Ação da capa indisponível: ${label}`);
    const bounds = selected.getBoundingClientRect();
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    if (bounds.left < 0 || bounds.top < 0 || bounds.right > innerWidth || bounds.bottom > innerHeight) {
      throw new Error(`Ação fora da área visível: ${label}`);
    }
    if (document.elementFromPoint(x, y)?.closest('button') !== selected) {
      throw new Error(`Ação encoberta por outro elemento: ${label}`);
    }
    return { x, y };
  }, label);
}

async function clickBookButton(label) {
  // Reobserva a posição após mover o ponteiro: a própria inclinação muda levemente a projeção.
  for (let step = 0; step < 3; step++) {
    const point = await bookButtonPoint(label);
    await ui.send('Input.dispatchMouseEvent', { type: 'mouseMoved', pointerType: 'mouse', ...point });
    await delay(100);
  }
  const point = await bookButtonPoint(label);
  const before = await bibleSnapshot();
  await ui.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, pointerType: 'mouse', ...point });
  await ui.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, pointerType: 'mouse', ...point });
  return before;
}

async function returnToMenu() {
  await click('[aria-label="Voltar ao menu inicial"]');
  await menuReady();
}

async function configReady() {
  await waitUi(() => document.querySelector('[data-book-primary]')?.textContent.trim() === 'Iniciar gincana' &&
    Boolean(document.querySelector('[data-team-id]')), 'configuração da gincana carregada');
}

async function waitSheet(number, total) {
  await waitUi((number, total) => {
    const selected = document.querySelector('[aria-label="Selecionar folha"]');
    return !document.querySelector('[data-page-turn]') && !selected?.matches(':disabled') &&
      selected?.value === String(number) && selected.selectedOptions[0]?.textContent.trim() === `Folha ${number} de ${total}`;
  }, `folha ${number} de ${total}`, number, total);
}

async function selectSheet(number, total) {
  await ui.run((number) => {
    const select = document.querySelector('[aria-label="Selecionar folha"]');
    if (!select || select.matches(':disabled')) throw new Error('Seletor de folhas indisponível.');
    select.value = String(number);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, number);
  await waitSheet(number, total);
}

async function setReducedMotion(reduce) {
  await ui.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
  await waitUi((reduce) => matchMedia('(prefers-reduced-motion: reduce)').matches === reduce, 'preferência de movimento das folhas', reduce);
  // Aguarda o listener de matchMedia e o commit do React, sem depender da duração da animação.
  await ui.run(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))));
}

async function sheetPages() {
  return ui.run(() => [...document.querySelectorAll('[data-book-pages] > [data-book-page]')]
    .map(page => page.textContent.replace(/\s+/g, ' ').trim()));
}

// Interrompe apenas os RAFs desta janela descartável depois de pintar a fase desejada.
// A camada continua usando seu RAF real; a pausa permite fotografar a frente e o verso
// sem que a latência do protocolo avance o relógio até o final da virada.
async function freezeTurnAt(progress) {
  await ui.run((progress) => {
    if (window.__sdc55frames) throw new Error('Pausa de quadros anterior ainda ativa.');
    const state = { request: window.requestAnimationFrame.bind(window), cancel: window.cancelAnimationFrame.bind(window), held: new Map(), progress };
    window.__sdc55frames = state;
    window.requestAnimationFrame = callback => {
      const id = state.request(time => {
        const layer = document.querySelector('[data-page-turn]');
        if (layer && Number(layer.dataset.turnProgress) >= state.progress) state.held.set(id, callback);
        else callback(time);
      });
      return id;
    };
    window.cancelAnimationFrame = id => { state.held.delete(id); state.cancel(id); };
  }, progress);
}

async function resumeTurnFrames() {
  await ui.run(() => {
    const state = window.__sdc55frames;
    if (!state) return;
    window.requestAnimationFrame = state.request;
    window.cancelAnimationFrame = state.cancel;
    delete window.__sdc55frames;
    for (const callback of state.held.values()) state.request(callback);
    state.held.clear();
  });
}

async function waitTurnPhase(progress) {
  await waitUi((progress) => {
    const turn = document.querySelector('[data-page-turn]');
    return turn && Number(turn.dataset.turnProgress) >= progress && window.__sdc55frames?.held.size > 0;
  }, `fase ${progress} da virada`, progress);
}

async function turnSnapshot() {
  return ui.run(() => {
    const layer = document.querySelector('[data-page-turn]');
    if (!layer) throw new Error('Camada da virada não encontrada.');
    const pageArea = document.querySelector('[data-book-pages]');
    const cleanText = element => element?.textContent.replace(/\s+/g, ' ').trim();
    const face = selector => {
      const element = layer.querySelector(selector);
      if (!element) throw new Error(`Face não encontrada: ${selector}`);
      let matrix = new DOMMatrixReadOnly();
      for (let current = element; current && current !== pageArea; current = current.parentElement) {
        matrix = new DOMMatrixReadOnly(getComputedStyle(current).transform).multiply(matrix);
      }
      return { text: cleanText(element), horizontal: matrix.m11, backface: getComputedStyle(element).backfaceVisibility };
    };
    const base = [...pageArea.querySelectorAll(':scope > [data-book-page]')];
    return {
      direction: layer.dataset.pageTurn, progress: Number(layer.dataset.turnProgress), angle: Number(layer.dataset.turnAngle),
      hidden: layer.getAttribute('aria-hidden') === 'true', inert: layer.inert || Boolean(layer.closest('[inert]')),
      pointerEvents: getComputedStyle(layer).pointerEvents,
      front: face('[data-turn-front]'), back: face('[data-turn-back]'),
      base: base.map(cleanText),
      segments: [...layer.querySelectorAll('[data-turn-segment]')].map(element => getComputedStyle(element).transform),
      selectorDisabled: document.querySelector('[aria-label="Selecionar folha"]').matches(':disabled'),
      selectedSheet: document.querySelector('[aria-label="Selecionar folha"]').value,
      bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
    };
  });
}

// Pausa somente as animações desta janela descartável. A progressão continua sendo
// a WAAPI da aplicação; os quadros congelados tornam começo, meio e encaixe auditáveis.
async function freezeBookAt(progress) {
  await ui.run((progress) => {
    if (window.__sdc56frames) throw new Error('Pausa anterior do livro ainda ativa.');
    const state = { request: window.requestAnimationFrame.bind(window), cancel: window.cancelAnimationFrame.bind(window), held: new Map(), progress, paused: false, animations: [] };
    window.__sdc56frames = state;
    window.requestAnimationFrame = callback => {
      const id = state.request(time => {
        if (state.paused) { state.held.set(id, callback); return; }
        callback(time);
        const shell = document.querySelector('[data-book-transition]');
        if (shell && Number(shell.dataset.bookProgress) >= state.progress) {
          state.animations = document.getAnimations().filter(animation => animation.id.startsWith('book-transition-'));
          if (state.animations.length) {
            state.paused = true;
            for (const animation of state.animations) animation.pause();
          }
        }
      });
      return id;
    };
    window.cancelAnimationFrame = id => { state.held.delete(id); state.cancel(id); };
  }, progress);
}

async function waitBookPhase(progress) {
  await waitFor(() => ui.run((progress) => {
    const shell = document.querySelector('[data-book-transition]');
    return shell && Number(shell.dataset.bookProgress) >= progress && window.__sdc56frames?.paused;
  }, progress), `fase ${progress} da abertura ou fechamento`);
}

async function advanceBookPhase(progress) {
  await ui.run((progress) => {
    const state = window.__sdc56frames;
    if (!state?.paused) throw new Error('O livro não está pausado para avançar.');
    state.progress = progress;
    state.paused = false;
    for (const animation of state.animations) animation.play();
    for (const callback of state.held.values()) state.request(callback);
    state.held.clear();
  }, progress);
  await waitBookPhase(progress);
}

async function seekBookFit() {
  await waitFor(() => ui.run(() => Boolean(window.__sdc56frames?.held.size)), 'quadro de observação da abertura pausado');
  await ui.run(() => {
    const state = window.__sdc56frames;
    if (!state?.paused) throw new Error('O livro deve estar pausado para conferir o encaixe.');
    for (const animation of state.animations) animation.currentTime = 799.2;
    // Mantém o último quadro anterior ao fim, sem competir com animation.finished.
    // O callback real atualiza os atributos de observação; as matrizes são da WAAPI.
    const callbacks = [...state.held.values()];
    state.held.clear();
    for (const callback of callbacks) callback(performance.now());
  });
  await waitBookPhase(0.998);
}

async function resumeBookFrames() {
  await ui.run(() => {
    const state = window.__sdc56frames;
    if (!state) return;
    window.requestAnimationFrame = state.request;
    window.cancelAnimationFrame = state.cancel;
    delete window.__sdc56frames;
    for (const animation of state.animations) if (animation.playState === 'paused') animation.play();
    for (const callback of state.held.values()) state.request(callback);
    state.held.clear();
  });
}

async function bookMotionSnapshot() {
  return ui.run(() => {
    const shell = document.querySelector('[data-book-transition]');
    if (!shell) throw new Error('Transição do livro não encontrada.');
    const bounds = element => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const destination = document.querySelector('[data-book-destination]');
    const target = destination.querySelector('[data-book-pages]');
    const paperRight = bounds(document.querySelector('.bible-right-page'));
    const paperLeft = bounds(document.querySelector('#cover-flipper'));
    const x = Math.min(paperRight.x, paperLeft.x);
    const y = Math.min(paperRight.y, paperLeft.y);
    const right = Math.max(paperRight.right, paperLeft.right);
    const bottom = Math.max(paperRight.bottom, paperLeft.bottom);
    const tilt = document.querySelector('#bible-tilt');
    const animations = document.getAnimations().filter(animation => animation.id.startsWith('book-transition-'));
    return {
      direction: shell.dataset.bookTransition, progress: Number(shell.dataset.bookProgress), angle: Number(shell.dataset.bookAngle),
      transform: getComputedStyle(tilt).transform,
      target: bounds(target), physical: { x, y, width: right - x, height: bottom - y },
      ribbon: {
        physical: bounds(document.querySelector('[data-book-menu] [data-book-ribbon]')),
        target: bounds(destination.querySelector('[data-open-book] > [aria-hidden="true"]')),
      },
      menuOpacity: Number(getComputedStyle(document.querySelector('[data-book-menu]')).opacity),
      destinationOpacity: Number(getComputedStyle(destination).opacity),
      destinationInert: destination.inert || Boolean(destination.closest('[inert]')),
      menuDisabled: [...document.querySelectorAll('#bible-box button')].every(button => button.matches(':disabled')),
      duration: animations.map(animation => animation.effect.getTiming().duration),
      startTimes: animations.map(animation => animation.startTime),
      targetData: { x: Number(shell.dataset.bookTargetX), y: Number(shell.dataset.bookTargetY), width: Number(shell.dataset.bookTargetWidth), height: Number(shell.dataset.bookTargetHeight) },
      overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
    };
  });
}

function assertBookFit(state, tolerance = 3) {
  for (const key of ['x', 'y', 'width', 'height']) {
    assert.ok(Math.abs(state.physical[key] - state.target[key]) <= tolerance,
      `O livro deve encaixar na página (${key}: ${state.physical[key]} × ${state.target[key]}).`);
  }
}

function assertRibbonFit(state, tolerance = 1) {
  for (const key of ['x', 'y', 'width', 'height']) {
    assert.ok(Math.abs(state.ribbon.physical[key] - state.ribbon.target[key]) <= tolerance,
      `O fitilho deve encaixar no marcador do quadro (${key}: ${state.ribbon.physical[key]} × ${state.ribbon.target[key]}).`);
  }
}

function assertTiltBounds(state) {
  assert.ok(Number.isFinite(state.x) && Number.isFinite(state.y), 'A inclinação deve ser finita.');
  assert.ok(Math.abs(state.x) <= 6.05 && Math.abs(state.y) <= 6.05, 'A inclinação deve ficar dentro de seis graus por eixo.');
}

// Cores computadas verificam o resultado do CSS nos dois temas, inclusive fundos translúcidos.
async function teamThemeSnapshot() {
  return ui.run(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = (color) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].map((value, index) => index === 3 ? value / 255 : value);
    };
    const colors = (element) => {
      const style = getComputedStyle(element);
      return { text: rgba(style.color), background: rgba(style.backgroundColor) };
    };
    return [...document.querySelectorAll('[data-team-id]')].map((card) => {
      const style = getComputedStyle(card);
      const spans = [...card.querySelectorAll('span')];
      const input = card.querySelector('input');
      return {
        id: card.dataset.teamId,
        name: input.value,
        gradient: style.backgroundImage,
        start: rgba(style.getPropertyValue('--tw-gradient-from').trim()),
        end: rgba(style.getPropertyValue('--tw-gradient-to').trim()),
        input: colors(input),
        label: colors(spans.find((element) => /^Equipe [IV]+$/.test(element.textContent.trim()))),
        position: colors(spans.find((element) => /^\d+º$/.test(element.textContent.trim()))),
        caption: colors(spans.find((element) => /Começa a vez|na fila/.test(element.textContent))),
        arrow: colors(card.querySelector('button:not(:disabled)')),
      };
    });
  });
}

const composite = (foreground, background) => foreground.slice(0, 3).map((value, index) => value * foreground[3] + background[index] * (1 - foreground[3]));
const luminance = (rgb) => rgb.slice(0, 3).map((value) => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);

function textContrast(colors, cardBackground) {
  const background = composite(colors.background, cardBackground);
  const foreground = composite(colors.text, background);
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

function assertTeamTheme(rows, dark) {
  assert.equal(rows.length, 4, 'As quatro equipes devem estar visíveis.');
  assert.equal(new Set(rows.map((row) => row.start.join(','))).size, 4, 'Cada equipe deve ter sua própria tonalidade.');
  for (const row of rows) {
    assert.notEqual(row.gradient, 'none', `${row.id}: o cartão deve ter fundo colorido.`);
    for (const background of [row.start, row.end]) {
      assert.ok(dark ? luminance(background) < 0.12 : luminance(background) > 0.65, `${row.id}: fundo deve acompanhar o tema ${dark ? 'noturno' : 'claro'}.`);
      for (const [role, colors] of [['nome', row.input], ['identificação', row.label]]) {
        const ratio = textContrast(colors, background);
        assert.ok(ratio >= 4.5, `${row.id}: contraste da ${role} abaixo de 4,5:1 (${ratio.toFixed(2)}).`);
      }
      for (const [role, colors] of [['campo', row.input], ['seta', row.arrow], ['posição', row.position]]) {
        const brightness = luminance(composite(colors.background, background));
        assert.ok(dark ? brightness < 0.12 : brightness > 0.65, `${row.id}: fundo de ${role} não acompanha o tema.`);
      }
    }
  }
}

async function openBookSnapshot() {
  return ui.run(() => {
    const book = document.querySelector('[data-open-book="true"]');
    const primary = document.querySelector('[data-book-primary="true"]');
    if (!book || !primary) throw new Error('Estrutura compartilhada do livro não encontrada.');
    const rect = (element) => {
      const bounds = element.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, right: bounds.right, bottom: bounds.bottom };
    };
    const appearance = (element) => {
      const style = getComputedStyle(element);
      return { font: style.fontFamily, size: style.fontSize, line: style.lineHeight, background: style.backgroundColor,
        image: style.backgroundImage, color: style.color, border: style.borderColor };
    };
    const header = primary.closest('header');
    const screenFooter = document.querySelector('[data-book-screen-footer]');
    const issues = [];
    for (const control of document.querySelectorAll('header button, [data-open-book] button, [data-open-book] input, [data-open-book] select')) {
      if (!control.getClientRects().length) continue;
      const bounds = rect(control);
      const name = control.getAttribute('aria-label') || control.title || control.textContent.trim() || control.tagName;
      if (bounds.width < 1 || bounds.height < 1 || bounds.x < -1 || bounds.y < -1 || bounds.right > innerWidth + 1 || bounds.bottom > innerHeight + 1) {
        issues.push(`Controle fora da área visível: ${name}`);
      } else if (!control.matches(':disabled')) {
        const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)?.closest('button,input,select');
        if (hit !== control) issues.push(`Controle encoberto: ${name}`);
      }
    }
    const pages = [...document.querySelectorAll('[data-book-page]')].map((page) => {
      const content = page.querySelector('[data-book-content]');
      const pageHeader = page.querySelector('[data-book-page-header]');
      const pageFooter = page.querySelector('[data-book-page-footer]');
      if (!content || !pageHeader || !pageFooter) throw new Error('Página sem cabeçalho, corpo ou rodapé compartilhado.');
      const contentBounds = rect(content);
      if (content.scrollHeight > content.clientHeight + 1 || content.scrollWidth > content.clientWidth + 1) {
        issues.push(`Conteúdo excede a página ${page.dataset.bookPage}.`);
      }
      for (const article of page.querySelectorAll('article')) {
        const bounds = rect(article);
        if (bounds.y < contentBounds.y - 1 || bounds.bottom > contentBounds.bottom + 1 || article.scrollHeight > article.clientHeight + 1) {
          issues.push(`Pergunta cortada na página ${page.dataset.bookPage}.`);
        }
      }
      return { side: page.dataset.bookPage, bounds: rect(page), header: rect(pageHeader), footer: rect(pageFooter),
        headerStyle: appearance(pageHeader), footerStyle: appearance(pageFooter), articles: page.querySelectorAll('article').length };
    });
    const scrolling = document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1;
    return { book: rect(book), header: rect(header), primary: rect(primary), primaryLabel: primary.textContent.trim(),
      primaryStyle: appearance(primary), footer: screenFooter ? rect(screenFooter) : null, pages, issues, scrolling,
      teams: document.querySelectorAll('[data-team-id]').length,
      tools: [...header.querySelectorAll('button[aria-label]')].map((element) => element.getAttribute('aria-label')),
      toolbarInside: Boolean(book.querySelector('[data-book-toolbar]')) };
  });
}

function assertSharedBook(questions, configuration, label) {
  const near = (first, second, property) => assert.ok(Math.abs(first - second) <= 1,
    `${label}: ${property} deve ser igual nas duas telas (${first} / ${second}).`);
  for (const [name, snapshot] of [['perguntas', questions], ['configuração', configuration]]) {
    assert.deepEqual(snapshot.issues, [], `${label}: controles e conteúdo da tela de ${name} devem caber e estar acessíveis.`);
    assert.equal(snapshot.scrolling, false, `${label}: a tela de ${name} não deve exigir rolagem global.`);
    assert.equal(snapshot.pages.length, 2);
    assert.equal(snapshot.toolbarInside, true, `${label}: a barra contextual deve ficar dentro do livro.`);
  }
  for (const property of ['x', 'y', 'width', 'height']) near(questions.book[property], configuration.book[property], `livro.${property}`);
  for (const property of ['y', 'height']) near(questions.header[property], configuration.header[property], `cabeçalho.${property}`);
  for (const property of ['y', 'right', 'height']) near(questions.primary[property], configuration.primary[property], `ação principal.${property}`);
  assert.deepEqual(questions.primaryStyle, configuration.primaryStyle, `${label}: as ações principais devem compartilhar acabamento e tipografia.`);
  assert.equal(questions.primaryLabel, 'Nova pergunta');
  assert.equal(configuration.primaryLabel, 'Iniciar gincana');
  for (let index = 0; index < 2; index++) {
    const first = questions.pages[index];
    const second = configuration.pages[index];
    assert.equal(first.side, second.side);
    for (const property of ['x', 'y', 'width', 'height']) near(first.bounds[property], second.bounds[property], `página ${first.side}.${property}`);
    near(first.header.height, second.header.height, `cabeçalho da página ${first.side}`);
    near(first.footer.height, second.footer.height, `rodapé da página ${first.side}`);
    assert.deepEqual(first.headerStyle, second.headerStyle, `${label}: cabeçalhos das páginas devem ter o mesmo estilo.`);
    assert.deepEqual(first.footerStyle, second.footerStyle, `${label}: rodapés das páginas devem ter o mesmo estilo.`);
    assert.equal(first.articles, 4, `${label}: cada página do cadastro deve mostrar quatro perguntas.`);
  }
  assert.equal(configuration.teams, 4, `${label}: as quatro equipes devem caber na configuração.`);
  assert.ok(questions.tools.includes('Importar perguntas'));
  assert.ok(questions.tools.includes('Exportar perguntas'));
  assert.equal(configuration.tools.includes('Importar perguntas'), false, `${label}: as ferramentas do cadastro devem continuar contextuais.`);
  if (questions.footer && configuration.footer) {
    for (const property of ['y', 'height']) near(questions.footer[property], configuration.footer[property], `rodapé global.${property}`);
  }
}

async function test(label, operation) {
  await operation();
  passed++;
  console.log(`✓ ${label}`);
}

async function freePorts() {
  const servers = [net.createServer(), net.createServer()];
  await Promise.all(servers.map((server) => new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  })));
  const ports = servers.map((server) => server.address().port);
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  return ports;
}

async function target(port, predicate) {
  let selected;
  await waitFor(async () => {
    if (child.exitCode !== null) throw new Error(`Electron encerrou com código ${child.exitCode}.`);
    const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1000) });
    const targets = await response.json();
    selected = targets.find(predicate);
    return Boolean(selected?.webSocketDebuggerUrl);
  }, 'depurador do Electron', 20000);
  return selected.webSocketDebuggerUrl;
}

async function stopOwnElectron() {
  if (main) {
    await main.run(() => {
      const state = globalThis.__sdc51;
      if (state.releaseRename) state.releaseRename();
      if (state.originalRename) state.fs.rename = state.originalRename;
      if (state.originalReadFile) state.fs.readFile = state.originalReadFile;
      for (const [name, original] of Object.entries(state.dialogs)) state.electron.dialog[name] = original;
      setImmediate(() => state.electron.app.quit());
      return true;
    }).catch(() => {});
  }
  for (const socket of sockets) socket.close();
  if (child && child.exitCode === null) {
    try { await waitFor(() => child.exitCode !== null, 'encerramento do Electron', 5000); }
    catch { child.kill(); await waitFor(() => child.exitCode !== null || child.signalCode !== null, 'encerramento do processo de teste', 5000); }
  }
}

try {
  await Promise.all(['dist/index.html', 'dist-electron/main.js', 'dist-electron/preload.cjs'].map((file) => fs.access(path.join(root, file))));
  profile = await fs.mkdtemp(path.join(os.tmpdir(), testPrefix));
  const [rendererPort, mainPort] = await freePorts();
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.VITE_DEV_SERVER_URL;
  child = spawn(executable, ['.', `--user-data-dir=${profile}`, `--remote-debugging-port=${rendererPort}`, '--remote-debugging-address=127.0.0.1', `--inspect=127.0.0.1:${mainPort}`], { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.on('error', (error) => { logs += `\n${error.message}`; });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (data) => { logs = (logs + data).slice(-16000); });
  ui = await Protocol.connect(await target(rendererPort, (item) => item.type === 'page' && item.url.startsWith('file:')));
  await waitUi(() => document.readyState === 'complete' && Boolean(window.showDoCristao), 'inicialização do renderer');
  main = await Protocol.connect(await target(mainPort, () => true));
  const actualProfile = await main.run(async () => {
    const require = process.getBuiltinModule('module').createRequire(`${process.cwd()}/package.json`);
    globalThis.__sdc51 = { electron: require('electron'), fs: require('node:fs/promises'), dialogs: {} };
    await globalThis.__sdc51.electron.app.whenReady();
    return globalThis.__sdc51.electron.app.getPath('userData');
  });
  assert.equal(path.resolve(actualProfile), path.resolve(profile), 'O app deve usar exclusivamente a pasta temporária de testes.');
  await ui.send('Page.enable');
  await ui.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  // A sessão Windows pode preferir reduzir animações; cada cenário controla a preferência sem alterar o sistema.
  await ui.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  const fixtures = path.join(profile, 'fixtures');
  await fs.mkdir(fixtures);
  const defaults = JSON.parse(await fs.readFile(path.join(root, 'src/data/perguntas.json'), 'utf-8'));
  const eightPath = path.join(fixtures, 'oito.json');
  const seventeenPath = path.join(fixtures, 'dezessete.json');
  const twentyPath = path.join(fixtures, 'vinte.json');
  const replacedTwentyPath = path.join(fixtures, 'vinte-substituidas.json');
  const duplicatePath = path.join(fixtures, 'repetidas.json');
  const duplicate = [{ ...defaults[0], alternativas: ['Repetida', ' repetída ', 'Terceira', 'Quarta'] }];
  await Promise.all([
    fs.writeFile(eightPath, JSON.stringify(defaults.slice(0, 8))),
    fs.writeFile(seventeenPath, JSON.stringify(defaults.slice(0, 17))),
    fs.writeFile(twentyPath, JSON.stringify(defaults)),
    fs.writeFile(replacedTwentyPath, JSON.stringify(defaults.map((question, index) => ({ ...question, pergunta: `Banco substituído ${index + 1}: ${question.pergunta}` })))),
    fs.writeFile(duplicatePath, JSON.stringify(duplicate)),
  ]);

  await test('Primeiro uso cria 20 perguntas no perfil temporário', async () => {
    await openManager();
    assert.equal((await bank()).length, 20);
    assert.equal(await ui.run(() => document.querySelectorAll('article').length), 8);
  });

  await test('IPC serializa gravações concorrentes e mantém JSON completo', async () => {
    const original = await bankText();
    const contents = Array.from({ length: 16 }, (_, index) => JSON.stringify([{ ...defaults[0], pergunta: `Concorrência ${index}: ${'a'.repeat(index * 101)}` }]));
    const result = await ui.run(async (contents) => {
      await Promise.all(contents.map((content) => window.showDoCristao.questions.write(content)));
      return window.showDoCristao.questions.readOrCreate('[]');
    }, contents);
    assert.equal(result.content, contents[contents.length - 1]);
    assert.deepEqual(JSON.parse(await bankText()), JSON.parse(contents[contents.length - 1]));
    await ui.run((original) => window.showDoCristao.questions.write(original), original);
  });

  await test('Falha ao salvar preserva o rascunho, a lista e o banco; nova tentativa funciona', async () => {
    const original = await bankText();
    await newQuestion('Pergunta da regressão de gravação');
    await main.run((bankPath) => {
      const state = globalThis.__sdc51;
      const original = state.fs.rename;
      state.originalRename = original;
      state.fs.rename = async (...args) => {
        if (String(args[1]) === bankPath) {
          state.fs.rename = original;
          throw Object.assign(new Error('Falha de gravação simulada'), { code: 'EACCES' });
        }
        return original(...args);
      };
    }, bankFile());
    await button('Salvar', '[role="dialog"]');
    await waitUi(() => Boolean(document.querySelector('[role="alert"]')) && !document.querySelector('[role="dialog"]').matches('[aria-busy="true"]'), 'erro de gravação exibido no formulário');
    assert.equal(await ui.run(() => document.querySelector('#question-text').value), 'Pergunta da regressão de gravação');
    assert.equal(await bankText(), original);
    assert.equal(await ui.run(() => [...document.querySelectorAll('article')].some((item) => item.textContent.includes('Pergunta da regressão de gravação'))), false);
    await screenshot('formulario-erro');
    await button('Salvar', '[role="dialog"]');
    await waitUi(() => !document.querySelector('[role="dialog"]'), 'nova tentativa salva e fecha o formulário');
    assert.equal((await bank()).length, 21);
  });

  await test('Salvando bloqueia duplicação, edição e fechamento do formulário', async () => {
    const original = await bankText();
    await newQuestion('Pergunta com gravação pendente');
    await main.run((bankPath) => {
      const state = globalThis.__sdc51;
      const original = state.fs.rename;
      state.originalRename = original;
      state.fs.rename = async (...args) => {
        if (String(args[1]) === bankPath) {
          state.fs.rename = original;
          await new Promise((resolve) => { state.releaseRename = resolve; });
        }
        return original(...args);
      };
    }, bankFile());
    await button('Salvar', '[role="dialog"]');
    await waitUi(() => Boolean(document.querySelector('[role="dialog"][aria-busy="true"]')), 'gravação pendente');
    await waitFor(() => main.run(() => typeof globalThis.__sdc51.releaseRename === 'function'), 'gravação bloqueada antes da substituição');
    const blocked = await ui.run(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const save = [...dialog.querySelectorAll('button')].find((element) => element.textContent.trim() === 'Salvando…');
      const close = dialog.querySelector('[title="Fechar"]');
      const textarea = document.querySelector('#question-text');
      const disabled = save.matches(':disabled') && close.matches(':disabled') && textarea.matches(':disabled');
      save.click(); close.click(); dialog.querySelector('form').requestSubmit();
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      dialog.parentElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      return disabled;
    });
    assert.equal(blocked, true);
    assert.equal(await bankText(), original);
    assert.equal(await ui.run(() => document.querySelectorAll('[role="dialog"]').length), 1);
    await main.run(() => { globalThis.__sdc51.releaseRename(); globalThis.__sdc51.releaseRename = null; });
    await waitUi(() => !document.querySelector('[role="dialog"]'), 'salvamento pendente concluído');
    assert.equal((await bank()).filter((question) => question.pergunta === 'Pergunta com gravação pendente').length, 1);
  });

  await test('Confirmação de descarte bloqueia o formulário ao fundo e preserva o rascunho', async () => {
    const original = await bankText();
    await newQuestion('Rascunho mantido durante a confirmação');
    await button('Cancelar', '[role="dialog"]');
    await waitUi(() => document.querySelectorAll('[role="dialog"]').length === 2, 'confirmação de descarte aberta');
    const blocked = await ui.run(() => {
      const underlying = document.querySelector('[role="dialog"][aria-label="Nova pergunta"]');
      const saveButtons = [...underlying.querySelectorAll('button')].filter((element) => /Salvar|Cancelar/.test(element.textContent));
      const disabled = document.querySelector('#question-text').matches(':disabled') && saveButtons.length === 3 && saveButtons.every((element) => element.matches(':disabled'));
      underlying.querySelector('form').requestSubmit();
      return disabled;
    });
    assert.equal(blocked, true);
    assert.equal(await bankText(), original);
    await button('Continuar editando', '[role="dialog"][aria-label="Descartar alterações?"]');
    await waitUi(() => document.querySelectorAll('[role="dialog"]').length === 1 && !document.querySelector('#question-text').matches(':disabled'), 'edição retomada');
    assert.equal(await ui.run(() => document.querySelector('#question-text').value), 'Rascunho mantido durante a confirmação');
    await button('Cancelar', '[role="dialog"]');
    await button('Descartar', '[role="dialog"][aria-label="Descartar alterações?"]');
    await waitUi(() => !document.querySelector('[role="dialog"]'), 'rascunho descartado');
    assert.equal(await bankText(), original);
  });

  await test('Restauração recupera a tela e mantém backup do arquivo inválido', async () => {
    const invalid = '{JSON inválido para a regressão';
    await fs.writeFile(bankFile(), invalid);
    await reloadMenu(); await openManager();
    assert.match(await text(), /Problema no Perguntas\.json/);
    await button('Restaurar Padrão');
    await button('Restaurar', '[role="dialog"]');
    await waitUi(() => document.querySelectorAll('article').length === 8 && !document.body.innerText.includes('Problema no Perguntas.json'), 'cadastro recuperado');
    assert.equal((await bank()).length, 20);
    const backups = (await fs.readdir(path.dirname(bankFile()))).filter((file) => file.startsWith('perguntas.backup-'));
    const contents = await Promise.all(backups.map((file) => fs.readFile(path.join(path.dirname(bankFile()), file), 'utf-8')));
    assert.ok(contents.includes(invalid), 'O backup deve conter exatamente o arquivo com problema.');
    await screenshot('cadastro-restaurado');
  });

  await test('Exportação preserva o formato do banco e importação repetida é rejeitada inteira', async () => {
    const original = await bankText();
    const exported = path.join(fixtures, 'exportado.json');
    await chooseFile('export', exported);
    await click('[aria-label="Exportar perguntas"]');
    await waitFor(async () => { await fs.access(exported); return true; }, 'arquivo exportado');
    await waitUi(() => !document.querySelector('[aria-busy="true"]'), 'exportação concluída');
    assert.deepEqual(JSON.parse(await fs.readFile(exported, 'utf-8')), JSON.parse(original));
    await chooseFile('import', duplicatePath);
    await click('[aria-label="Importar perguntas"]');
    await waitUi(() => /Não foi possível importar/.test(document.body.innerText) && /repete/.test(document.body.innerText), 'alternativas repetidas rejeitadas');
    assert.equal(await bankText(), original);
    assert.equal(await ui.run(() => document.querySelectorAll('[role="dialog"]').length), 0);
  });

  await test('Filtro durante a virada cancela a folha antiga e mantém a paginação válida', async () => {
    await selectSheet(2, 3);
    await ui.run(() => {
      document.querySelector('[aria-label="Próxima folha"]').click();
      [...document.querySelectorAll('[data-book-toolbar] button')].find((element) => element.textContent.includes('Fácil')).click();
    });
    await waitSheet(1, 1);
    await ui.run(() => [...document.querySelectorAll('[data-book-toolbar] button')].find((element) => element.textContent.includes('Todos')).click());
    await waitSheet(1, 3);
  });

  await test('Substituir oito perguntas na terceira folha volta à primeira', async () => {
    await selectSheet(3, 3);
    await importReplacing(eightPath, 8);
    await waitSheet(1, 1);
    assert.equal(await ui.run(() => document.querySelectorAll('article').length), 8);
  });

  await test('Excluir o último item da terceira folha volta à última folha válida', async () => {
    await importReplacing(seventeenPath, 17);
    await selectSheet(3, 3);
    await waitUi(() => document.querySelectorAll('article').length === 1, 'última pergunta na terceira folha');
    await click('article button[title^="Excluir"]');
    await button('Excluir', '[role="dialog"]');
    await waitSheet(2, 2);
    await waitUi(() => !document.querySelector('[aria-busy="true"]'), 'exclusão concluída');
    assert.equal((await bank()).length, 16);
    assert.equal(await ui.run(() => document.querySelectorAll('article').length), 8);
  });

  await test('Capa 3D responde ao mouse nos dois temas em 720p e 1080p, sem esconder os controles', async () => {
    await reloadMenu();
    await menuReady();
    for (const [width, height] of [[1280, 720], [1920, 1080]]) {
      await ui.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const dark of [false, true]) {
        await setMenuTheme(dark);
        await leaveBook();
        const resting = await bibleSnapshot();
        assert.equal(resting.projected, true, 'O livro deve ter perspectiva já na posição de repouso.');
        await bookButtonPoint('INICIAR GINCANA');
        await bookButtonPoint('Configurar Perguntas');
        await screenshot(`menu-${dark ? 'noturno' : 'claro'}-${height}`, '5.3');
        const poses = [];
        for (const [horizontal, vertical] of [[0.12, 0.12], [0.88, 0.88]]) {
          await moveOnBook(horizontal, vertical);
          try {
            await waitFor(async () => {
              const state = await bibleSnapshot();
              return Math.abs(state.x) + Math.abs(state.y) > 0.5;
            }, 'resposta da capa ao movimento real do mouse');
          } catch (error) {
            console.error('Estado da capa sem resposta:', await bibleSnapshot());
            throw error;
          }
          await delay(300);
          const state = await bibleSnapshot();
          assertTiltBounds(state);
          assert.notEqual(state.transform, resting.transform, 'O mouse deve alterar a perspectiva do livro.');
          assert.deepEqual(state.bounds, resting.bounds, 'A área usada para calcular o movimento deve permanecer estável.');
          poses.push(state);
        }
        assert.ok(poses[0].x * poses[1].x < 0 && poses[0].y * poses[1].y < 0, 'Cantos opostos devem produzir inclinações opostas.');
        if (height === 720) await screenshot(`menu-inclinado-${dark ? 'noturno' : 'claro'}`, '5.3');
        await leaveBook();
      }
    }
    await ui.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await setMenuTheme(false);
    await leaveBook();
  });

  await test('Cliques reais após inclinar a Bíblia abrem os dois destinos e o retorno fecha a capa', async () => {
    for (const [label, destination] of [['INICIAR GINCANA', 'config'], ['Configurar Perguntas', 'questions']]) {
      await menuReady();
      await moveOnBook(0.85, 0.18);
      await delay(250);
      await clickBookButton(label);
      const opening = await bibleSnapshot();
      assert.equal(opening.disabled, true, 'A abertura deve bloquear a inclinação do mouse.');
      assert.equal(opening.projected, true, 'O giro deve partir da perspectiva atual e neutralizá-la suavemente.');
      await moveOnBook(0.15, 0.85);
      const blocked = await bibleSnapshot();
      assert.ok(Math.abs(blocked.x - opening.x) < 0.01 && Math.abs(blocked.y - opening.y) < 0.01, 'O ponteiro não deve criar novos offsets durante a abertura.');
      if (destination === 'config') {
        await delay(240);
        const intermediate = await ui.run(() => {
          const transform = getComputedStyle(document.querySelector('#cover-flipper')).transform;
          return new DOMMatrixReadOnly(transform).m11;
        });
        assert.ok(Math.abs(intermediate) < 0.98, 'A capa deve apresentar um giro intermediário antes de concluir a abertura.');
        await screenshot('abertura', '5.3');
      }
      await waitUi((destination) => destination === 'config'
        ? document.querySelector('[data-book-primary]')?.textContent.trim() === 'Iniciar gincana'
        : document.querySelectorAll('article').length > 0, 'destino aberto após clicar na capa', destination);
      await returnToMenu();
      await leaveBook();
      const closed = await bibleSnapshot();
      assert.equal(closed.disabled, false, 'A interação deve voltar após terminar o fechamento.');
      await bookButtonPoint('INICIAR GINCANA');
    }
  });

  await test('Diálogo de saída e navegação por teclado neutralizam o movimento da capa', async () => {
    await menuReady();
    await moveOnBook(0.8, 0.2);
    await delay(250);
    await click('[title="Encerrar o aplicativo"]');
    await waitUi(() => Boolean(document.querySelector('[role="dialog"]')), 'confirmação de saída');
    const dialog = await bibleSnapshot();
    assert.equal(dialog.disabled, true);
    assert.ok(Math.abs(dialog.x) < 0.05 && Math.abs(dialog.y) < 0.05, 'O diálogo deve neutralizar a inclinação.');
    await moveOnBook(0.2, 0.8);
    assert.equal((await bibleSnapshot()).disabled, true);
    await button('Cancelar', '[role="dialog"]');
    await waitUi(() => !document.querySelector('[role="dialog"]'), 'cancelamento da saída');
    await moveOnBook(0.82, 0.18);
    await waitFor(async () => {
      const state = await bibleSnapshot();
      return Math.abs(state.x) + Math.abs(state.y) > 0.5;
    }, 'movimento retomado após cancelar a saída');
    await ui.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await ui.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    const keyboard = await bibleSnapshot();
    assert.equal(keyboard.disabled, true, 'O uso de teclado deve suspender o efeito do mouse.');
    assert.ok(Math.abs(keyboard.x) < 0.05 && Math.abs(keyboard.y) < 0.05);
    assert.equal(await ui.run(() => document.activeElement?.tagName), 'BUTTON', 'Tab deve manter o foco nos controles do menu.');
    await moveOnBook(0.8, 0.2);
    await waitFor(async () => !(await bibleSnapshot()).disabled, 'mouse retoma o efeito após o teclado');
    await leaveBook();
  });

  await test('Redução de movimento funciona em tempo real e preserva a navegação do menu', async () => {
    await ui.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await waitFor(async () => (await bibleSnapshot()).disabled, 'preferência por reduzir movimento');
    for (const point of [[0.15, 0.15], [0.85, 0.85]]) {
      await moveOnBook(...point);
      await delay(100);
      const state = await bibleSnapshot();
      assert.ok(Math.abs(state.x) < 0.05 && Math.abs(state.y) < 0.05, 'A redução de movimento deve impedir a inclinação.');
      assert.equal(state.projected, true, 'A redução de movimento deve preservar a pose estática em 3D.');
    }
    await clickBookButton('INICIAR GINCANA');
    await waitUi(() => document.querySelector('[data-book-primary]')?.textContent.trim() === 'Iniciar gincana', 'configuração com movimento reduzido');
    await returnToMenu();
    assert.equal((await bibleSnapshot()).disabled, true, 'A preferência deve continuar ativa após voltar ao menu.');
    await ui.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await waitFor(async () => !(await bibleSnapshot()).disabled, 'nova preferência de movimento aplicada ao menu');
    await moveOnBook(0.8, 0.2);
    await waitFor(async () => {
      const state = await bibleSnapshot();
      return !state.disabled && Math.abs(state.x) + Math.abs(state.y) > 0.5;
    }, 'movimento reativado após mudar a preferência');
    await leaveBook();
  });

  await test('Quatro estandartes acompanham os temas claro e noturno sem perder nomes ou ordem', async () => {
    await reloadMenu();
    await button('INICIAR GINCANA');
    await waitUi(() => [...document.querySelectorAll('button')].some((element) => element.textContent.trim() === '4 Equipes'), 'configuração da gincana');
    await button('4 Equipes');
    await waitUi(() => document.querySelectorAll('[data-team-id]').length === 4, 'quatro estandartes');
    assert.equal(await ui.run(() => document.documentElement.classList.contains('light')), true);
    await fill('[data-team-id="equipe-1"] input', 'Sarça Revisada');
    await click('[data-team-id="equipe-1"] [title="Descer na ordem"]');
    const light = await teamThemeSnapshot();
    assertTeamTheme(light, false);
    assert.deepEqual(light.map((row) => row.id), ['equipe-2', 'equipe-1', 'equipe-3', 'equipe-4']);
    assert.equal(light.find((row) => row.id === 'equipe-1').name, 'Sarça Revisada');
    await screenshot('equipes-claro', '5.2');

    await click('header [role="switch"]');
    await waitUi(() => document.documentElement.classList.contains('dark'), 'tema noturno');
    await delay(250);
    const dark = await teamThemeSnapshot();
    assertTeamTheme(dark, true);
    assert.deepEqual(dark.map((row) => [row.id, row.name]), light.map((row) => [row.id, row.name]));
    for (let index = 0; index < light.length; index++) {
      for (const role of ['input', 'label', 'position', 'caption', 'arrow']) {
        assert.notDeepEqual(dark[index][role].text, light[index][role].text, `${light[index].id}: texto de ${role} deve responder ao tema.`);
      }
    }
    await screenshot('equipes-noturno', '5.2');

    await click('header [role="switch"]');
    await waitUi(() => document.documentElement.classList.contains('light'), 'retorno ao tema claro');
    await delay(250);
    const restored = await teamThemeSnapshot();
    assertTeamTheme(restored, false);
    assert.deepEqual(restored.map((row) => [row.id, row.name]), light.map((row) => [row.id, row.name]));
  });

  await test('Cadastro e configuração compartilham geometria e ações principais nos dois temas e resoluções', async () => {
    for (const [width, height] of [[1280, 720], [1920, 1080]]) {
      await ui.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const dark of [false, true]) {
        await reloadMenu();
        await menuReady();
        await setMenuTheme(dark);
        await openManager();
        await waitSheet(1, 2);
        await ui.run(() => document.fonts.ready.then(() => true));
        await delay(250);
        const questions = await openBookSnapshot();
        await screenshot(`perguntas-${dark ? 'noturno' : 'claro'}-${height}`, '5.4');
        await returnToMenu();

        await button('INICIAR GINCANA');
        await configReady();
        await button('4 Equipes');
        await waitUi(() => document.querySelectorAll('[data-team-id]').length === 4 && !document.querySelector('[data-book-primary]').matches(':disabled'), 'configuração com quatro equipes pronta');
        await delay(250);
        const configuration = await openBookSnapshot();
        await screenshot(`configuracao-${dark ? 'noturno' : 'claro'}-${height}`, '5.4');
        assertSharedBook(questions, configuration, `${width}×${height}, tema ${dark ? 'noturno' : 'claro'}`);

        if (height === 720 && !dark) {
          await click('[data-book-primary]');
          await waitUi(() => document.body.textContent.includes('Mural da Gincana Bíblica'), 'nova ação principal inicia a gincana');
          assert.match(await text(), /Vez de escolher\s+Sarça Verde/, 'A primeira equipe configurada deve começar.');
          await button('Encerrar Gincana');
          await button('Sim, Encerrar', '[role="dialog"]');
          await menuReady();
        } else {
          await returnToMenu();
        }
      }
    }
    await ui.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await setMenuTheme(false);
  });

  await test('Abertura e fechamento encaixam o livro nos dois destinos e temas em 720p e 1080p', async () => {
    await reloadMenu();
    await setReducedMotion(false);
    for (const [width, height] of [[1280, 720], [1920, 1080]]) {
      await ui.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const dark of [false, true]) {
        await setMenuTheme(dark);
        for (const [label, destination] of [['INICIAR GINCANA', 'config'], ['Configurar Perguntas', 'questions']]) {
          await menuReady();
          await moveOnBook(0.82, 0.22);
          await delay(250);
          await freezeBookAt(0.03);
          try {
            const before = await clickBookButton(label);
            await waitBookPhase(0.03);
            const start = await bookMotionSnapshot();
            assert.equal(start.direction, 'opening');
            assert.equal(start.destinationInert, true, 'O destino deve aguardar a conclusão da abertura para receber ações.');
            assert.equal(start.menuDisabled, true);
            assert.ok(start.duration.length >= 4 && start.duration.every(duration => duration === 800), 'Capa, posição e revelação devem compartilhar a duração de800ms.');
            const components = transform => transform.slice(transform.indexOf('(') + 1, -1).split(',').map(Number);
            const beforeMatrix = components(before.transform);
            const startMatrix = components(start.transform);
            for (const index of [0, 1, 2, 4, 5, 6, 8, 9, 10]) {
              assert.ok(Math.abs(startMatrix[index] - beforeMatrix[index]) < 0.06, 'A abertura deve partir da pose visual atual, sem frontalização instantânea.');
            }
            await screenshot(`abertura-inicio-${destination}-${dark ? 'noturno' : 'claro'}-${height}`, '5.6');
            await advanceBookPhase(0.5);
            const middle = await bookMotionSnapshot();
            assert.ok(middle.angle < -20 && middle.angle > -175, 'A capa deve apresentar um giro intermediário contínuo.');
            assert.equal(middle.overflow, false);
            await screenshot(`abertura-meio-${destination}-${dark ? 'noturno' : 'claro'}-${height}`, '5.6');
            await seekBookFit();
            const end = await bookMotionSnapshot();
            assertBookFit(end);
            assertRibbonFit(end);
            assert.ok(end.destinationOpacity > 0.95 && end.menuOpacity < 0.05, 'O conteúdo deve terminar visível e alinhado antes de remover a capa.');
            await screenshot(`abertura-encaixe-${destination}-${dark ? 'noturno' : 'claro'}-${height}`, '5.6');
          } finally { await resumeBookFrames(); }
          await waitBookIdle();
          if (destination === 'config') await configReady();
          else await waitUi(() => document.querySelectorAll('[data-book-pages] > [data-book-page] article').length > 0, 'perguntas após abertura contínua');
          const settled = await ui.run(() => {
            const r = document.querySelector('[data-book-pages]').getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          });
          await freezeBookAt(0.03);
          try {
            await ui.run(() => document.querySelector('[aria-label="Voltar ao menu inicial"]').click());
            await waitBookPhase(0.03);
            const startClosing = await bookMotionSnapshot();
            assert.equal(startClosing.direction, 'closing');
            assertBookFit(startClosing, 5);
            for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(startClosing.target[key] - settled[key]) < 1, 'O fechamento deve partir do livro já aberto.');
            await advanceBookPhase(0.5);
            const closing = await bookMotionSnapshot();
            assert.ok(closing.angle > -175 && closing.angle < -5, 'O retorno deve fechar a capa em movimento inverso.');
            assert.equal(closing.menuDisabled, true);
            await screenshot(`fechamento-meio-${destination}-${dark ? 'noturno' : 'claro'}-${height}`, '5.6');
          } finally { await resumeBookFrames(); }
          await menuReady();
          await leaveBook();
          assert.equal(await ui.run(() => document.getAnimations().some(animation => animation.id.startsWith('book-transition-'))), false, 'A conclusão deve liberar as animações temporárias.');
        }
      }
    }
    await ui.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await setMenuTheme(false);
  });

  await test('Abertura bloqueia cliques repetidos e recalcula o encaixe ao redimensionar', async () => {
    await menuReady();
    await freezeBookAt(0.36);
    try {
      await button('INICIAR GINCANA');
      await waitBookPhase(0.36);
      await ui.run(() => {
        for (let index = 0; index < 12; index++) {
          for (const button of document.querySelectorAll('#bible-box button')) button.click();
          document.querySelector('[data-book-destination] [aria-label="Voltar ao menu inicial"]')?.click();
        }
      });
      assert.equal((await bookMotionSnapshot()).direction, 'opening');
      await ui.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
      await waitFor(() => ui.run(() => {
        const shell = document.querySelector('[data-book-transition]');
        const target = document.querySelector('[data-book-destination] [data-book-pages]').getBoundingClientRect();
        return Math.abs(Number(shell.dataset.bookTargetX) - target.x) < 0.1 &&
          Math.abs(Number(shell.dataset.bookTargetY) - target.y) < 0.1 &&
          Math.abs(Number(shell.dataset.bookTargetWidth) - target.width) < 0.1 &&
          Math.abs(Number(shell.dataset.bookTargetHeight) - target.height) < 0.1;
      }), 'ResizeObserver mediu o novo alvo antes do quadro final');
      await seekBookFit();
      const resized = await bookMotionSnapshot();
      assertBookFit(resized);
      assertRibbonFit(resized);
      assert.equal(resized.direction, 'opening');
      assert.ok(resized.duration.every(duration => duration === 800), 'O redimensionamento não deve reiniciar a duração da abertura.');
    } finally { await resumeBookFrames(); }
    await configReady();
    assert.equal(await ui.run(() => document.querySelector('h1').textContent), 'Configuração da gincana');
    await returnToMenu();
    await ui.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  });

  await test('Redução de movimento conclui abertura e fechamento em curso e preserva navegação', async () => {
    for (const [label, destination] of [['INICIAR GINCANA', 'config'], ['Configurar Perguntas', 'questions']]) {
      await setReducedMotion(false);
      await menuReady();
      await freezeBookAt(0.38);
      try {
        await button(label);
        await waitBookPhase(0.38);
        await ui.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await waitBookIdle();
      } finally { await resumeBookFrames(); }
      if (destination === 'config') await configReady();
      else await waitUi(() => Boolean(document.querySelector('[aria-label="Selecionar folha"]')), 'cadastro após reduzir movimento');
      assert.equal(await ui.run(() => document.getAnimations().some(animation => animation.id.startsWith('book-transition-'))), false);
      await setReducedMotion(false);
      await freezeBookAt(0.38);
      try {
        await click('[aria-label="Voltar ao menu inicial"]');
        await waitBookPhase(0.38);
        await ui.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await waitBookIdle();
      } finally { await resumeBookFrames(); }
      await menuReady();
      await button(label);
      await waitBookIdle();
      assert.equal(await ui.run(() => document.getAnimations().some(animation => animation.id.startsWith('book-transition-'))), false, 'Com redução já ativa, não deve haver animação pendente.');
      await returnToMenu();
    }
    await setReducedMotion(false);
    await menuReady();
  });

  await test('Folha atravessa a lombada com frente, verso e curvatura nos dois temas em 720p e 1080p', async () => {
    await reloadMenu();
    await openManager();
    await importReplacing(twentyPath, 20);
    for (const [width, height] of [[1280, 720], [1920, 1080]]) {
      await ui.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const dark of [false, true]) {
        await setMenuTheme(dark);
        await setReducedMotion(true);
        await selectSheet(1, 3);
        const first = await sheetPages();
        await selectSheet(2, 3);
        const second = await sheetPages();
        await selectSheet(1, 3);
        await setReducedMotion(false);
        for (const [direction, origin, destination, oldPages, newPages] of [
          ['next', 1, 2, first, second], ['prev', 2, 1, second, first],
        ]) {
          for (const progress of [0.24, 0.76]) {
            // Cada captura parte da folha de origem, evitando que a latência da
            // captura anterior esconda a fase intermediária que queremos observar.
            await setReducedMotion(true);
            await selectSheet(origin, 3);
            await setReducedMotion(false);
            await freezeTurnAt(progress);
            try {
              await click(direction === 'next' ? '[aria-label="Próxima folha"]' : '[aria-label="Folha anterior"]');
              await waitTurnPhase(progress);
              const state = await turnSnapshot();
              assert.equal(state.direction, direction);
              assert.equal(state.hidden, true, 'As cópias animadas devem ficar ocultas à acessibilidade.');
              assert.equal(state.inert, true, 'As cópias animadas não podem receber foco ou ações.');
              assert.equal(state.pointerEvents, 'none');
              assert.equal(state.selectorDisabled, true, 'A paginação deve aguardar a folha pousar.');
              assert.equal(state.selectedSheet, String(origin), 'O índice deve mudar apenas depois de terminar o giro.');
              assert.equal(state.bodyOverflow, false, 'O giro deve permanecer dentro da área do livro.');
              assert.equal(state.front.text, oldPages[direction === 'next' ? 1 : 0], 'A frente deve manter o conteúdo original da folha.');
              assert.equal(state.back.text, newPages[direction === 'next' ? 0 : 1], 'O verso deve conter a página correta do destino.');
              assert.deepEqual(state.base, direction === 'next' ? [oldPages[0], newPages[1]] : [newPages[0], oldPages[1]], 'As páginas abaixo devem ser reveladas sem trocar o conteúdo da folha em movimento.');
              assert.ok(state.segments.length >= 6, 'O papel deve ter segmentos para simular curvatura.');
              assert.ok(new Set(state.segments).size > 1, 'Os segmentos devem se deformar durante a passagem.');
              assert.equal(state.front.backface, 'hidden');
              assert.equal(state.back.backface, 'hidden');
              assert.ok(direction === 'next' ? state.angle < 0 : state.angle > 0, 'Avançar e voltar devem girar em sentidos opostos.');
              if (progress < 0.5) {
                assert.ok(state.front.horizontal > 0, 'A frente deve ser legível antes de atravessar a lombada.');
                assert.ok(state.back.horizontal < 0, 'O verso deve ficar oculto antes da metade.');
              } else {
                assert.ok(state.back.horizontal > 0, 'O verso deve aparecer legível, sem texto espelhado.');
                assert.ok(state.front.horizontal < 0, 'A frente deve ficar oculta depois da metade.');
                assert.ok(Math.abs(state.angle) > 90, 'A folha deve atravessar o centro em vez de retornar ao mesmo lado.');
              }
              await screenshot(`folha-${direction}-${progress < 0.5 ? 'frente' : 'verso'}-${dark ? 'noturno' : 'claro'}-${height}`, '5.5');
            } finally {
              await resumeTurnFrames();
            }
            await waitSheet(destination, 3);
            assert.deepEqual(await sheetPages(), newPages, 'O conteúdo final deve coincidir com o destino, sem cópias residuais.');
          }
        }
      }
    }
    await ui.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await setMenuTheme(false);
  });

  await test('Cliques rápidos e atalhos respeitam uma virada por vez e os limites do livro', async () => {
    await waitSheet(1, 3);
    await freezeTurnAt(0.24);
    try {
      await click('[aria-label="Próxima folha"]');
      await waitTurnPhase(0.24);
      await ui.run(() => {
        for (let index = 0; index < 12; index++) {
          document.querySelector('[aria-label="Próxima folha"]').click();
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
        }
      });
      assert.equal((await turnSnapshot()).selectedSheet, '1');
    } finally { await resumeTurnFrames(); }
    await waitSheet(2, 3);
    await ui.run(() => {
      document.activeElement?.blur();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
    });
    await waitSheet(1, 3);
    assert.equal(await ui.run(() => document.querySelector('[aria-label="Folha anterior"]').matches(':disabled')), true);
    await ui.run(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
    await waitSheet(1, 3);
    await selectSheet(3, 3);
    assert.equal(await ui.run(() => document.querySelector('[aria-label="Próxima folha"]').matches(':disabled')), true);
    await ui.run(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true })));
    await waitSheet(3, 3);
    await selectSheet(1, 3);
  });

  await test('Filtro, importação com mesma contagem e saída da tela cancelam a folha em movimento', async () => {
    await freezeTurnAt(0.24);
    try {
      await click('[aria-label="Próxima folha"]');
      await waitTurnPhase(0.24);
      await ui.run(() => [...document.querySelectorAll('[data-book-toolbar] button')].find(element => element.textContent.includes('Fácil')).click());
      await waitSheet(1, 1);
    } finally { await resumeTurnFrames(); }
    await ui.run(() => [...document.querySelectorAll('[data-book-toolbar] button')].find(element => element.textContent.includes('Todos')).click());
    await waitSheet(1, 3);

    await freezeTurnAt(0.24);
    try {
      await click('[aria-label="Próxima folha"]');
      await waitTurnPhase(0.24);
      await importReplacing(replacedTwentyPath, 20);
      await waitSheet(1, 3);
    } finally { await resumeTurnFrames(); }
    assert.ok((await sheetPages())[0].includes('Banco substituído 1:'), 'A camada antiga não pode reaparecer sobre o novo banco.');

    await freezeTurnAt(0.24);
    try {
      await click('[aria-label="Próxima folha"]');
      await waitTurnPhase(0.24);
      await returnToMenu();
    } finally { await resumeTurnFrames(); }
    await openManager();
    await waitSheet(1, 3);
    await importReplacing(twentyPath, 20);
    await waitSheet(1, 3);
  });

  await test('Redução de movimento elimina o giro e termina com segurança uma virada já iniciada', async () => {
    await setReducedMotion(true);
    await selectSheet(2, 3);
    assert.equal(await ui.run(() => Boolean(document.querySelector('[data-page-turn]'))), false);
    await selectSheet(1, 3);
    await setReducedMotion(false);
    await freezeTurnAt(0.24);
    try {
      await click('[aria-label="Próxima folha"]');
      await waitTurnPhase(0.24);
      await ui.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await waitSheet(2, 3);
    } finally { await resumeTurnFrames(); }
    await selectSheet(1, 3);
    await setReducedMotion(false);
    await click('[aria-label="Próxima folha"]');
    await waitUi(() => Boolean(document.querySelector('[data-page-turn]')), 'giro retomado após retirar a redução');
    await waitSheet(2, 3);
    await selectSheet(1, 3);
    await returnToMenu();
  });

  await test('Índice agrupa as perguntas por dificuldade e preserva a numeração nos dois temas', async () => {
    const ordered = await bank();
    await button('INICIAR GINCANA');
    await configReady();
    await fill('[data-team-id="equipe-2"] input', 'Equipe que começa');
    await click('[data-team-id="equipe-2"] [title="Subir na ordem"]');
    await click('[data-book-primary]');
    await waitUi(() => Boolean(document.querySelector('[data-game-board]')), 'mural numerado');
    assert.match(await text(), /Vez de escolher\s+Equipe que começa/);
    assert.doesNotMatch(await text(), /Talentos|Pontuação/);

    const expected = ordered.map((question, index) => {
      const label = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' }[question.dificuldade];
      return `Pergunta ${index + 1}, ${label}`;
    });
    const labels = () => ui.run(() => [...document.querySelectorAll('[data-question-number]')].map(button => button.getAttribute('aria-label')));
    assert.deepEqual(await labels(), expected);
    const sections = ordered.map(question => ({ facil: 'Perguntas fáceis', medio: 'Perguntas médias', dificil: 'Perguntas difíceis' }[question.dificuldade]));
    assert.deepEqual(await ui.run(() => [...document.querySelectorAll('[data-question-number]')].map(entry => entry.closest('section').getAttribute('aria-label'))), sections);
    assert.deepEqual(await ui.run(() => [...document.querySelectorAll('[data-board-scroll] h2')].map(title => title.textContent.trim())), [...new Set(sections)], 'Cada título deve aparecer uma vez nas duas folhas.');
    const number = ordered.length;
    const selector = `[data-question-number="${number}"]`;

    for (const [width, height] of [[1280, 720], [1920, 1080]]) {
      await ui.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const dark of [false, true]) {
        await setMenuTheme(dark);
        const theme = dark ? 'noturno' : 'claro';
        assert.equal(await ui.run(() => {
          const pages = [...document.querySelectorAll('[data-game-board] [data-board-scroll]')];
          return pages.length === 2 && pages.every(page => page.querySelectorAll('[data-question-number]').length === 10 && page.scrollHeight <= page.clientHeight + 1);
        }), true, 'As 20 perguntas de exemplo devem caber nas duas páginas sem rolagem.');
        await screenshot(`mural-${theme}-${height}`, '6');
        const source = await ui.run((selector) => {
          const card = document.querySelector(selector);
          const bounds = card.getBoundingClientRect();
          card.click();
          document.querySelector('[data-question-number="1"]').click();
          return { x: bounds.x, y: bounds.y, width: bounds.width };
        }, selector);
        await waitUi(() => Boolean(document.querySelector('#active-question-title')), 'pergunta selecionada');
        assert.equal(await ui.run(() => document.querySelector('#active-question-title').textContent), `Pergunta ${number}`);
        assert.ok((await text()).includes(ordered[number - 1].pergunta));
        assert.equal(await ui.run(() => document.activeElement.id), 'active-question-title');
        const beginning = await ui.run(() => {
          const opening = document.querySelector('[data-question-opening]');
          const animations = opening?.getAnimations({ subtree: true });
          const paper = animations?.find(animation => animation.id === 'question-paper-open');
          if (!paper) throw new Error('Abertura em papel não encontrada.');
          for (const animation of animations) { animation.pause(); animation.currentTime = 0; }
          const bounds = paper.effect.target.getBoundingClientRect();
          for (const animation of animations) animation.currentTime = 175;
          return { x: bounds.x, y: bounds.y, width: bounds.width, boardInert: document.querySelector('[data-game-board]').inert };
        });
        try {
          assert.ok(Math.abs(beginning.x - source.x) < 8 && Math.abs(beginning.y - source.y) < 8 && Math.abs(beginning.width - source.width) < 8, 'A folha deve partir do cartão escolhido.');
          assert.equal(beginning.boardInert, true, 'O mural deve ficar inerte durante a abertura.');
          if (height === 720) await screenshot(`pergunta-abrindo-${theme}-${height}`, '6');
        } finally {
          await ui.run(() => document.querySelector('[data-question-opening]')?.getAnimations({ subtree: true }).forEach(animation => animation.play()));
        }
        await waitUi(() => !document.querySelector('[data-question-opening]') && document.querySelector('[data-game-board]').hidden, 'abertura da pergunta concluída');
        if (height === 720) await screenshot(`pergunta-${theme}-${height}`, '6');
        await button('Voltar ao mural');
        assert.equal(await ui.run((selector) => document.activeElement.matches(selector + ':enabled'), selector), true);
        assert.deepEqual(await labels(), expected);
      }
    }

    await button('Encerrar Gincana');
    await button('Continuar Partida', '[role="dialog"]');
    assert.equal(await ui.run(() => document.activeElement.textContent.trim()), 'Encerrar Gincana');
    assert.deepEqual(await labels(), expected);
    await button('Encerrar Gincana');
    await button('Sim, Encerrar', '[role="dialog"]');
    await menuReady();
    await button('INICIAR GINCANA');
    await configReady();
    await click('[data-book-primary]');
    await waitUi(() => Boolean(document.querySelector('[data-game-board]')), 'mural da segunda partida');
    assert.deepEqual(await labels(), expected, 'Começar outra partida deve manter a associação de perguntas e números.');
    await button('Encerrar Gincana');
    await button('Sim, Encerrar', '[role="dialog"]');
    await menuReady();
    await setMenuTheme(false);
    await ui.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  });

  await test('Mural comporta banco grande com rolagem interna e cabeçalho acessível', async () => {
    const original = await bankText();
    const many = Array.from({ length: 55 }, (_, index) => ({ ...defaults[0], pergunta: `Pergunta de teste ${index + 1}` }));
    await fs.writeFile(bankFile(), JSON.stringify(many));
    try {
      await button('INICIAR GINCANA');
      await configReady();
      await click('[data-book-primary]');
      await waitUi(() => document.querySelectorAll('[data-question-number]').length === 55, 'banco grande no mural');
      await ui.run(() => document.querySelector('[data-question-number="55"]').scrollIntoView({ block: 'nearest' }));
      await waitUi(() => {
        const button = document.querySelector('[data-question-number="55"]');
        const grid = button.closest('[data-board-scroll]');
        const entry = button.getBoundingClientRect();
        return grid.scrollTop > 0 && entry.bottom <= grid.getBoundingClientRect().bottom + 1 && document.querySelector('header').getBoundingClientRect().top >= 0;
      }, 'última linha visível dentro da folha e cabeçalho fixo');
      await click('[data-question-number="55"]');
      assert.match(await text(), /Pergunta de teste 55/);
      await button('Voltar ao mural');
      assert.equal(await ui.run(() => document.activeElement.matches('[data-question-number="55"]')), true);
      await button('Encerrar Gincana');
      await button('Sim, Encerrar', '[role="dialog"]');
      await menuReady();
    } finally { await fs.writeFile(bankFile(), original); }
  });

  await test('Abertura da pergunta respeita redução de movimento e pode ser interrompida ao voltar', async () => {
    await button('INICIAR GINCANA');
    await configReady();
    await click('[data-book-primary]');
    await waitUi(() => Boolean(document.querySelector('[data-game-board]')), 'mural para abrir a primeira pergunta');
    const card = '[data-question-number="1"]';
    for (const reduced of [true, false]) {
      await setReducedMotion(reduced);
      await click(card);
      await waitUi(() => Boolean(document.querySelector('#active-question-title')), 'primeira pergunta');
      assert.equal(await ui.run(() => document.getAnimations().some(animation => animation.id === 'question-paper-open')), !reduced);
      await button('Voltar ao mural');
      assert.equal(await ui.run(() => document.getAnimations().some(animation => animation.id === 'question-paper-open')), false);
      assert.equal(await ui.run(() => document.activeElement.matches('[data-question-number="1"]')), true);
    }
    await button('Encerrar Gincana');
    await button('Sim, Encerrar', '[role="dialog"]');
    await menuReady();
  });

  await test('Iniciar gincana vira a folha da configuração antes de mostrar os cartões', async () => {
    const bookGeometry = () => ui.run(() => [
      '[data-book-screen-header]', '[data-open-book]', '[data-book-toolbar]', '[data-book-pages]',
      '[data-book-pages] > [data-book-page="left"]', '[data-book-pages] > [data-book-page="right"]', '[data-book-screen-footer]',
    ].map(selector => {
      const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
      return [x, y, width, height];
    }));
    for (const dark of [false, true]) {
      await setMenuTheme(dark);
      await button('INICIAR GINCANA');
      await configReady();
      const beforeTurn = await bookGeometry();
      await freezeTurnAt(0.41);
      try {
        await click('[data-book-primary]');
        await waitTurnPhase(0.41);
        const state = await ui.run(() => {
          const layer = document.querySelector('[data-game-start-turn] [data-page-turn]');
          return {
            angle: Number(layer.dataset.turnAngle),
            direction: layer.dataset.pageTurn,
            segments: layer.querySelectorAll('[data-turn-segment]').length,
            front: layer.querySelector('[data-turn-front]').textContent,
            openingLeft: layer.querySelector('[data-turn-back] [data-board-scroll]').querySelectorAll('li').length,
            openingRight: document.querySelector('[data-book-pages] > [data-book-page="right"] [data-board-scroll]').querySelectorAll('li').length,
            selectableCards: document.querySelectorAll('[data-question-number]').length,
            blocked: document.querySelector('[data-book-primary]').matches(':disabled'),
            board: Boolean(document.querySelector('[data-game-board]')),
          };
        });
        assert.equal(state.direction, 'next');
        assert.ok(state.angle < -15 && state.angle > -165, 'A folha precisa estar visivelmente inclinada durante a transição.');
        assert.equal(state.segments, 8);
        assert.match(state.front, /Parâmetros da partida/);
        assert.equal(state.openingLeft, 10);
        assert.equal(state.openingRight, 10);
        assert.equal(state.selectableCards, 0);
        assert.equal(state.blocked, true);
        assert.equal(state.board, false, 'O mural só abre depois da virada.');
        await screenshot(`inicio-gincana-virada-${dark ? 'noturno' : 'claro'}`, '6');
      } finally { await resumeTurnFrames(); }
      await waitUi(() => document.querySelectorAll('[data-game-board] [data-question-number]').length === 20, 'mural com 20 cartões após a virada');
      assert.equal(await ui.run(() => !!document.querySelector('[data-page-turn]')), false);
      assert.deepEqual(await bookGeometry(), beforeTurn, 'O mural deve ocupar a mesma área do livro da configuração.');
      await button('Encerrar Gincana');
      await button('Sim, Encerrar', '[role="dialog"]');
      await menuReady();
    }
    await setMenuTheme(false);
    await setReducedMotion(true);
    try {
      await button('INICIAR GINCANA');
      await configReady();
      await click('[data-book-primary]');
      await waitUi(() => document.querySelectorAll('[data-game-board] [data-question-number]').length === 20, 'mural em movimento reduzido');
      assert.equal(await ui.run(() => Boolean(document.querySelector('[data-page-turn]'))), false);
      await button('Encerrar Gincana');
      await button('Sim, Encerrar', '[role="dialog"]');
      await menuReady();
    } finally { await setReducedMotion(false); }
  });

  await test('Folha da pergunta expõe quatro alternativas e ampulheta nos dois temas e resoluções', async () => {
    const [question] = await bank();
    await button('INICIAR GINCANA');
    await configReady();
    await click('[data-book-primary]');
    await waitUi(() => Boolean(document.querySelector('[data-game-board]')), 'mural da Etapa 7');

    for (const [width, height] of [[1280, 720], [1920, 1080]]) {
      await ui.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      for (const dark of [false, true]) {
        await setMenuTheme(dark);
        await click('[data-question-number="1"]');
        await waitUi(() => Boolean(document.querySelector('[data-hourglass]')) && !document.querySelector('[data-question-opening]'), 'ampulheta após a abertura da folha');
        const view = await ui.run(() => {
          const content = document.querySelector('[data-question-content]');
          return {
            options: [...content.querySelectorAll('ol button')].map(option => [...option.children].map(child => child.textContent)),
            scrolls: content.scrollHeight > content.clientHeight + 1,
          };
        });
        assert.deepEqual(view.options, question.alternativas.map((option, index) => ['ABCD'[index], option]));
        assert.equal(view.scrolls, false, 'A pergunta de exemplo e suas quatro alternativas devem caber na folha.');
        await screenshot(`pergunta-${dark ? 'noturno' : 'claro'}-${height}`, '7');
        await button('Voltar ao mural');
      }
    }
    await button('Encerrar Gincana');
    await button('Sim, Encerrar', '[role="dialog"]');
    await menuReady();
    await ui.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await setMenuTheme(false);
  });

  await test('Roubo bloqueia a letra eliminada e o mural bloqueia cada pergunta confirmada', async () => {
    const questions = await bank();
    let number = 1;
    const time = () => ui.run(() => Number.parseInt(document.querySelector('[role="timer"]').textContent, 10));
    const upperSand = () => ui.run(() => document.querySelector('[data-hourglass-sand]').style.height);
    const rightLetter = () => 'ABCD'.indexOf(questions[number - 1].correta);
    const wrongLetter = () => (rightLetter() + 1) % 4;
    const choose = index => click(`ol[aria-label="Alternativas"] li:nth-child(${index + 1}) button`);
    const openCurrent = async () => {
      await click(`[data-question-number="${number}"]`);
      await waitUi(() => Boolean(document.querySelector('#active-question-title')) && !document.querySelector('[data-question-opening]'), 'abertura da pergunta');
    };
    const assertBlocked = async () => {
      await button('Voltar ao mural');
      const blocked = await ui.run(number => {
        const row = document.querySelector(`[data-question-number="${number}"]`);
        row.click();
        return row.disabled && row.textContent.includes('Respondida') && !document.querySelector('#active-question-title');
      }, number);
      assert.equal(blocked, true, `A pergunta ${number} deve estar marcada e bloqueada.`);
      assert.match(await text(), new RegExp(`${questions.length - number} de ${questions.length} disponíveis`));
    };
    const next = async () => {
      await assertBlocked();
      number++;
      await openCurrent();
    };
    await button('INICIAR GINCANA');
    await configReady();
    await button('10 seg');
    await click('[data-book-primary]');
    await waitUi(() => Boolean(document.querySelector('[data-game-board]')), 'mural com tempo de 10 segundos');
    await openCurrent();
    assert.equal(await time(), 10);
    const controls = await ui.run(() => [...document.querySelectorAll('footer button')].map(button => [button.textContent.trim(), button.disabled]));
    assert.deepEqual(controls, [['Confirmar resposta', true]], 'Só a confirmação deve aparecer e ela exige uma letra.');

    await waitFor(async () => await time() <= 9, 'areia caindo');
    assert.ok(Number.parseFloat(await upperSand()) < 50, 'A areia deve baixar durante a contagem.');
    await waitFor(async () => await time() === 5, 'aviso nos últimos cinco segundos');
    assert.match(await ui.run(() => document.querySelector('[data-hourglass]').className), /animate-pulse/);
    await waitFor(async () => await time() === 0, 'tempo esgotado', 8000);
    assert.equal(await upperSand(), '0%');
    assert.match(await text(), /Tempo esgotado/);
    assert.doesNotMatch(await text(), /Resposta correta|Resposta incorreta|pode tentar o roubo/);

    await choose(rightLetter());
    await choose(wrongLetter());
    assert.equal(await ui.run(() => document.querySelector('ol[aria-label="Alternativas"] button[aria-pressed="true"]').firstElementChild.textContent), 'ABCD'[wrongLetter()]);
    assert.doesNotMatch(await text(), /Resposta correta|Resposta incorreta/);
    await button('Confirmar resposta');
    assert.match(await text(), /Resposta incorreta/);
    assert.match(await text(), /Chama Dourada pode tentar o roubo/);
    assert.doesNotMatch(await text(), /Resposta correta/);
    assert.equal(await ui.run(() => Boolean(document.querySelector('ol[aria-label="Alternativas"] button[aria-pressed="true"] .lucide-x'))), true);
    await screenshot('erro-oferta-de-roubo', '7');
    await button('Dar chance de roubo');
    assert.equal(await time(), 10);
    assert.match(await text(), /Chance de roubo para Chama Dourada/);
    assert.equal(await ui.run(() => document.querySelectorAll('ol[aria-label="Alternativas"] button[aria-pressed="true"]').length), 0);
    assert.doesNotMatch(await text(), /Resposta correta|Resposta incorreta/);
    for (const dark of [false, true]) {
      await setMenuTheme(dark);
      const options = await ui.run(index => {
        const buttons = [...document.querySelectorAll('ol[aria-label="Alternativas"] button')];
        const removed = buttons[index];
        removed.click();
        return {
          enabled: buttons.filter(button => !button.disabled).length,
          selected: buttons.some(button => button.getAttribute('aria-pressed') === 'true'),
          label: removed.textContent.includes('Eliminada'),
          opacity: Number(getComputedStyle(removed).opacity),
        };
      }, wrongLetter());
      assert.deepEqual(options, { enabled: 3, selected: false, label: true, opacity: 0.6 });
      await screenshot(`roubo-tres-alternativas-${dark ? 'noturno' : 'claro'}`, '7');
    }
    await setMenuTheme(false);
    await choose((wrongLetter() + 1) % 4);
    await button('Confirmar resposta');
    assert.match(await text(), /Resposta incorreta/);
    assert.doesNotMatch(await text(), /Dar chance de roubo|Confirmar resposta/);
    const reveal = await ui.run(() => [...document.querySelectorAll('ol[aria-label="Alternativas"] button')].map(option => option.textContent.includes('Resposta correta')));
    assert.deepEqual(reveal, questions[0].alternativas.map((_, index) => index === rightLetter()));
    await screenshot('erro-apos-roubo', '7');

    await next();
    assert.match(await text(), /Vez de Chama Dourada/);
    await choose(wrongLetter());
    await button('Confirmar resposta');
    await button('Dar chance de roubo');
    await choose(rightLetter());
    await button('Confirmar resposta');
    assert.match(await text(), /Resposta correta/);
    assert.doesNotMatch(await text(), /Resposta incorreta|Dar chance de roubo/);

    await next();
    await choose(rightLetter());
    await button('Confirmar resposta');
    assert.match(await text(), /Resposta correta/);
    assert.doesNotMatch(await text(), /Dar chance de roubo/);

    await next();
    await choose(wrongLetter());
    await button('Confirmar resposta');
    await button('Revelar resposta');
    assert.match(await text(), /Resposta incorreta/);
    assert.match(await text(), /Resposta correta/);
    await next();
    await choose(wrongLetter());
    await button('Voltar ao mural');
    assert.equal(await ui.run(number => document.querySelector(`[data-question-number="${number}"]`).disabled, number), false, 'Marcar sem confirmar deve preservar a pergunta.');
    await openCurrent();
    await choose(wrongLetter());
    await button('Confirmar resposta');
    await button('Dar chance de roubo');
    await assertBlocked();
    await button('Encerrar Gincana');
    await button('Sim, Encerrar', '[role="dialog"]');
    await menuReady();
  });

  await test('Sem limite oculta a ampulheta; pergunta longa rola e revela o gabarito sem roubo', async () => {
    const original = await bankText();
    const [first, ...others] = JSON.parse(original);
    const long = {
      ...first,
      pergunta: first.pergunta.repeat(15),
      alternativas: first.alternativas.map(option => `Esta alternativa apresenta a opção ${option}. `.repeat(5).trim()),
      correta: 'D',
    };
    try {
      await fs.writeFile(bankFile(), JSON.stringify([long, ...others]));
      await setReducedMotion(true);
      await button('INICIAR GINCANA');
      await configReady();
      await button('Sem limite');
      await click('[aria-label="Permitir roubo de pergunta"]');
      await click('[data-book-primary]');
      await waitUi(() => Boolean(document.querySelector('[data-game-board]')), 'mural sem limite de tempo');
      await click('[data-question-number="1"]');
      await waitUi(() => Boolean(document.querySelector('[data-question-content]')), 'folha longa sem cronômetro');
      assert.equal(await ui.run(() => Boolean(document.querySelector('[role="timer"]'))), false);
      assert.equal(await ui.run(() => {
        const content = document.querySelector('[data-question-content]');
        const frame = content.getBoundingClientRect();
        return content.scrollHeight > content.clientHeight && content.scrollWidth <= content.clientWidth + 1 && frame.bottom <= innerHeight;
      }), true, 'O texto deve rolar dentro da folha, sem transbordamento horizontal.');
      await click('ol[aria-label="Alternativas"] li:first-child button');
      await button('Confirmar resposta');
      assert.match(await text(), /Resposta incorreta/);
      assert.doesNotMatch(await text(), /Dar chance de roubo/);
      assert.equal(await ui.run(() => {
        const content = document.querySelector('[data-question-content]');
        const option = content.querySelector('li:last-child button');
        return content.scrollTop > 0 && option.textContent.includes('Resposta correta') && option.getBoundingClientRect().bottom <= content.getBoundingClientRect().bottom + 1;
      }), true, 'O gabarito deve rolar para a área visível.');
      await button('Voltar ao mural');
      assert.equal(await ui.run(() => document.querySelector('[data-question-number="1"]').disabled), true);
      await button('Encerrar Gincana');
      await button('Sim, Encerrar', '[role="dialog"]');
      await menuReady();
    } finally {
      await fs.writeFile(bankFile(), original);
      await setReducedMotion(false);
    }
  });

  await test('Banco inválido bloqueia a partida e oferece acesso ao cadastro', async () => {
    await fs.writeFile(bankFile(), '{arquivo inválido');
    await reloadMenu(); await button('INICIAR GINCANA');
    await waitUi(() => document.body.innerText.includes('Gerenciar perguntas'), 'erro do banco na configuração');
    assert.equal(await ui.run(() => document.querySelector('[data-book-primary]').matches(':disabled')), true);
    await screenshot('configuracao-erro');
    await button('Gerenciar perguntas');
    await waitUi(() => document.body.innerText.includes('Problema no Perguntas.json'), 'acesso ao cadastro com erro');
  });

  await test('Banco existente com alternativas repetidas também bloqueia a partida', async () => {
    await fs.writeFile(bankFile(), JSON.stringify(duplicate));
    await reloadMenu(); await button('INICIAR GINCANA');
    await waitUi(() => /repete/.test(document.body.innerText) && document.body.innerText.includes('Gerenciar perguntas'), 'erro de alternativas repetidas na configuração');
    assert.equal(await ui.run(() => document.querySelector('[data-book-primary]').matches(':disabled')), true);
  });

  await test('Falha de leitura bloqueia a partida sem trocar pelas perguntas padrão', async () => {
    await main.run((bankPath) => {
      const state = globalThis.__sdc51;
      const original = state.fs.readFile;
      state.originalReadFile = original;
      state.fs.readFile = async (...args) => {
        if (String(args[0]) === bankPath) {
          state.fs.readFile = original;
          throw Object.assign(new Error('Sem permissão simulada'), { code: 'EACCES' });
        }
        return original(...args);
      };
    }, bankFile());
    await reloadMenu(); await button('INICIAR GINCANA');
    await waitUi(() => document.body.innerText.includes('Sem permissão simulada'), 'falha de leitura na configuração');
    assert.equal(await ui.run(() => document.querySelector('[data-book-primary]').matches(':disabled')), true);
    assert.deepEqual(await bank(), duplicate);
  });

  await test('Segunda instância encerra e restaura a janela existente', async () => {
    await main.run(() => globalThis.__sdc51.electron.BrowserWindow.getAllWindows()[0].minimize());
    await waitFor(() => main.run(() => globalThis.__sdc51.electron.BrowserWindow.getAllWindows()[0].isMinimized()), 'janela minimizada');
    const secondary = spawn(executable, ['.', `--user-data-dir=${profile}`], { cwd: root, env, windowsHide: true, stdio: 'ignore' });
    try {
      await waitFor(() => secondary.exitCode !== null, 'encerramento da segunda instância');
      assert.equal(secondary.exitCode, 0);
      await waitFor(() => main.run(() => {
        const windows = globalThis.__sdc51.electron.BrowserWindow.getAllWindows();
        return windows.length === 1 && !windows[0].isMinimized() && windows[0].isFocused();
      }), 'janela original restaurada e focada');
    } finally {
      if (secondary.exitCode === null) secondary.kill();
    }
  });

  console.log(`\n${passed} cenários passaram no Electron de produção (1280×720; capa, cadastro, configuração, mural e pergunta ativa também em 1920×1080), com dados temporários.`);
} catch (error) {
  process.exitCode = 1;
  console.error(`\nFalha na regressão do Electron: ${error.stack || error.message}`);
  if (ui) await screenshot('falha').catch(() => {});
  if (logs) console.error(`\nSaída recente do processo de teste:\n${logs}`);
} finally {
  await stopOwnElectron().catch((error) => { process.exitCode = 1; console.error(`Falha ao encerrar o Electron de teste: ${error.message}`); });
  if (profile) {
    const resolved = path.resolve(profile);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith(testPrefix));
    await fs.rm(resolved, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }).catch((error) => {
      process.exitCode = 1;
      console.error(`Não foi possível remover o perfil temporário ${resolved}: ${error.message}`);
    });
  }
}
