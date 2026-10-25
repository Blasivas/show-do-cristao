/**
 * Serviço de Efeitos Sonoros Offline sintetizados via Web Audio API.
 * 100% offline, sem dependência de arquivos externos mp3/wav pesados.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Som suave e analógico de folhear página de papel bíblia */
export function playPageFlipSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = 0.18;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.28));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {
    // áudio silencioso se sem permissão
  }
}

/** Som solene de abertura da Bíblia encadernada (couro nobre + farfalhar de folhas) */
export function playBookOpenSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Ressonância grave do couro se abrindo
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
    oscGain.gain.setValueAtTime(0.12, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);

    // 2. Farfalhar de folhas abrindo em leque
    const duration = 0.32;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.45));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now + 0.05);
    filter.frequency.exponentialRampToValueAtTime(380, now + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now + 0.05);
  } catch {
    // silencioso se indisponível
  }
}

/** Som solene de fechamento da Bíblia encadernada (farfalhar das folhas ao fechar + batida surda e aveludada do couro) */
export function playBookCloseSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Farfalhar do ar e folhas se recolhendo
    const flutterDuration = 0.28;
    const flutterBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * flutterDuration), ctx.sampleRate);
    const flutterData = flutterBuffer.getChannelData(0);
    for (let i = 0; i < flutterData.length; i++) {
      flutterData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (flutterData.length * 0.4));
    }
    const flutterSource = ctx.createBufferSource();
    flutterSource.buffer = flutterBuffer;
    const flutterFilter = ctx.createBiquadFilter();
    flutterFilter.type = 'lowpass';
    flutterFilter.frequency.setValueAtTime(800, now);
    flutterFilter.frequency.exponentialRampToValueAtTime(250, now + flutterDuration);
    const flutterGain = ctx.createGain();
    flutterGain.gain.setValueAtTime(0.06, now);
    flutterGain.gain.exponentialRampToValueAtTime(0.001, now + flutterDuration);
    flutterSource.connect(flutterFilter);
    flutterFilter.connect(flutterGain);
    flutterGain.connect(ctx.destination);
    flutterSource.start(now);

    // 2. Batida aveludada do couro fechando (impacto surdo)
    const impactTime = now + 0.22;
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(85, impactTime);
    osc.frequency.exponentialRampToValueAtTime(30, impactTime + 0.25);
    oscGain.gain.setValueAtTime(0.16, impactTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.25);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(impactTime);
    osc.stop(impactTime + 0.26);

    // 3. Ruído de contato suave da capa almofadada
    const thudDuration = 0.12;
    const thudBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * thudDuration), ctx.sampleRate);
    const thudData = thudBuffer.getChannelData(0);
    for (let i = 0; i < thudData.length; i++) {
      thudData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (thudData.length * 0.25));
    }
    const thudSource = ctx.createBufferSource();
    thudSource.buffer = thudBuffer;
    const thudFilter = ctx.createBiquadFilter();
    thudFilter.type = 'bandpass';
    thudFilter.frequency.setValueAtTime(140, impactTime);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.08, impactTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, impactTime + thudDuration);
    thudSource.connect(thudFilter);
    thudFilter.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudSource.start(impactTime);
  } catch {
    // silencioso se indisponível
  }
}
