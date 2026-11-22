// Emberfall Duel — audio.js: all sound is procedural WebAudio, no audio files.
// A tiny synth plays short blips for drawing, playing, attacking, healing,
// winning and losing. Nothing here touches the network or any asset file.

let context = null;
let muted = false;

/** Create (or reuse) the audio context on the first user gesture. */
export function ensureAudio() {
  if (!context) {
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
  }
  if (context && context.state === 'suspended') void context.resume();
  return context;
}

/** Flip the mute flag; returns the new state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

/** Whether sound is currently muted. */
export function isMuted() {
  return muted;
}

/**
 * Play one short tone: `freq` in Hz, `seconds` long, `type` an oscillator
 * shape, `gain` a 0–1 volume. Silent when muted or when no context exists.
 */
export function tone(freq, seconds = 0.12, type = 'sine', gain = 0.12) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}

/** A little two-note phrase, second note `step` semitones from the first. */
export function phrase(baseFreq, step, seconds = 0.14) {
  tone(baseFreq, seconds, 'triangle', 0.12);
  setTimeout(() => tone(baseFreq * Math.pow(2, step / 12), seconds, 'triangle', 0.12), 90);
}

export const sfx = {
  draw() { tone(520, 0.07, 'sine', 0.07); },
  play() { phrase(392, 7); },
  attack() { tone(180, 0.16, 'sawtooth', 0.1); tone(90, 0.2, 'square', 0.06); },
  hurt() { tone(140, 0.18, 'sawtooth', 0.09); },
  heal() { phrase(523, 4, 0.18); },
  spell() { phrase(659, 5, 0.16); },
  turn() { tone(440, 0.08, 'triangle', 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 130)); },
  loss() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sawtooth', 0.08), i * 150)); },
  error() { tone(160, 0.12, 'square', 0.07); },
  select() { tone(660, 0.06, 'sine', 0.06); },
};
