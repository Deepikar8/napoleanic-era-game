let ctx: AudioContext | null = null;
let muted = false;

const ensure = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); }
    catch { return null; }
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

export const playTurnDrum = () => {
  beep(140, 80, 0.2, 'square');
  setTimeout(() => beep(110, 80, 0.18, 'square'), 90);
  setTimeout(() => beep( 90, 100, 0.16, 'square'), 180);
};

export const playFifeFlourish = () => {
  const notes = [880, 988, 1175, 1397, 1175, 988, 880];
  notes.forEach((n, i) => setTimeout(() => beep(n, 140, 0.1, 'triangle'), i * 130));
};

export const playAttackThump = () => {
  beep(80, 90, 0.28, 'square');
  setTimeout(() => beep(55, 110, 0.22, 'square'), 50);
};

export const playEliminationGong = () => {
  beep(60, 240, 0.22, 'sawtooth');
  setTimeout(() => beep(120, 320, 0.16, 'triangle'), 70);
};

export const playRetreatSlide = () => {
  if (muted) return;
  const c = ensure(); if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(420, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(160, c.currentTime + 0.25);
  g.gain.value = 0.18;
  osc.connect(g).connect(c.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
  osc.stop(c.currentTime + 0.25);
};
