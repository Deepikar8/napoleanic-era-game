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
