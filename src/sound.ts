let ctx: AudioContext | null = null;
let muted = false;

const ensure = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); }
    catch { return null; }
  }
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined);
  }
  return ctx;
};

export const setMuted = (v: boolean) => { muted = v; };
export const isMuted = () => muted;

const beep = (freq: number, durMs: number, gain = 0.15, type: OscillatorType = 'square') => {
  if (muted) return;
  const c = ensure(); if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.value = freq;
  osc.type = type;
  g.gain.value = gain;
  osc.connect(g).connect(c.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000);
  osc.stop(c.currentTime + durMs / 1000);
};

const sweep = (
  from: number,
  to: number,
  durMs: number,
  gain = 0.16,
  type: OscillatorType = 'triangle',
) => {
  if (muted) return;
  const c = ensure(); if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(to, c.currentTime + durMs / 1000);
  g.gain.value = gain;
  osc.connect(g).connect(c.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000);
  osc.stop(c.currentTime + durMs / 1000);
};

export const playTurnDrum = () => {
  beep(115, 90, 0.24, 'square');
  setTimeout(() => beep(95, 85, 0.2, 'square'), 95);
  setTimeout(() => beep(125, 70, 0.18, 'square'), 185);
  setTimeout(() => beep(80, 150, 0.24, 'sawtooth'), 285);
};

export const playFifeFlourish = () => {
  const notes = [740, 880, 988, 1175, 1397, 1568, 1397, 1175];
  notes.forEach((n, i) => setTimeout(() => beep(n, 150, 0.11, 'triangle'), i * 115));
};

export const playAttackThump = () => {
  beep(58, 220, 0.34, 'sawtooth');
  setTimeout(() => beep(120, 80, 0.2, 'square'), 35);
  setTimeout(() => beep(42, 320, 0.18, 'triangle'), 80);
};

export const playArtilleryBoom = () => {
  beep(42, 420, 0.42, 'sawtooth');
  setTimeout(() => beep(82, 120, 0.24, 'square'), 45);
  setTimeout(() => sweep(110, 34, 620, 0.2, 'triangle'), 110);
};

export const playEliminationGong = () => {
  beep(48, 420, 0.28, 'sawtooth');
  setTimeout(() => beep(92, 520, 0.16, 'triangle'), 60);
  setTimeout(() => sweep(180, 70, 420, 0.14, 'triangle'), 110);
};

export const playRoutBreak = () => {
  sweep(260, 55, 520, 0.24, 'sawtooth');
  setTimeout(() => beep(70, 180, 0.26, 'square'), 80);
  setTimeout(() => beep(42, 480, 0.18, 'sawtooth'), 180);
};

export const playCohesionRise = () => {
  beep(440, 90, 0.1, 'triangle');
  setTimeout(() => beep(660, 120, 0.12, 'triangle'), 75);
};

export const playCohesionFall = () => {
  sweep(360, 150, 220, 0.12, 'triangle');
  setTimeout(() => beep(120, 120, 0.1, 'square'), 110);
};

export const playRetreatSlide = () => {
  sweep(460, 150, 280, 0.18, 'triangle');
  setTimeout(() => beep(105, 90, 0.1, 'square'), 110);
};
