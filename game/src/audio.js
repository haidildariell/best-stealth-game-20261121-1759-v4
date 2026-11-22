// audio.js — every sound is synthesized with the Web Audio API at play time.
// No audio files exist anywhere in the entry; the archive is silent until the
// player makes a noise, exactly like a good thief would want.

let ctx = null;
let ambienceOn = false;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, slideTo, delay = 0) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, freq, delay = 0) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, (dur * c.sampleRate) | 0);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
}

export const AudioSys = {
  unlock() { ac(); this.startAmbience(); },
  startAmbience() {
    const c = ac(); if (!c || ambienceOn) return;
    ambienceOn = true;
    // A low, slow-breathing drone: two detuned sines through a wandering gain.
    const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    const lfo = c.createOscillator(), lg = c.createGain();
    o1.type = 'sine'; o1.frequency.value = 55;
    o2.type = 'sine'; o2.frequency.value = 55.7;
    g.gain.value = 0.016;
    lfo.frequency.value = 0.07; lg.gain.value = 0.008;
    lfo.connect(lg).connect(g.gain);
    o1.connect(g); o2.connect(g); g.connect(c.destination);
    o1.start(); o2.start(); lfo.start();
  },
  step(sneak) { noiseBurst(sneak ? 0.03 : 0.06, sneak ? 0.015 : 0.05, sneak ? 900 : 500); },
  creak() { tone(140, 0.28, 'sawtooth', 0.035, 90); noiseBurst(0.2, 0.03, 700); },
  chime() { tone(1568, 0.5, 'sine', 0.12); tone(2093, 0.65, 'sine', 0.09, null, 0.07); tone(2637, 0.4, 'sine', 0.05, null, 0.14); },
  pebbleLand() { noiseBurst(0.05, 0.08, 1800); },
  snuff() { noiseBurst(0.22, 0.06, 300); },
  dash() { noiseBurst(0.14, 0.028, 2400); },
  heartbeat() { tone(58, 0.11, 'sine', 0.16, 40); tone(52, 0.1, 'sine', 0.12, 38, 0.16); },
  spotted() { tone(392, 0.16, 'square', 0.06); tone(311, 0.3, 'square', 0.06, null, 0.13); },
  pickup() { tone(880, 0.09, 'triangle', 0.07); tone(1318, 0.14, 'triangle', 0.07, null, 0.06); },
  relic() { tone(523, 0.14, 'triangle', 0.09); tone(659, 0.14, 'triangle', 0.09, null, 0.1); tone(784, 0.3, 'triangle', 0.1, null, 0.2); },
  caught() { tone(220, 0.4, 'sawtooth', 0.08, 110); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.09, null, i * 0.13)); },
};
