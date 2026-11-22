// gadgets.js — the thief's three tools, each limited, each with a job:
//   1 · Chime Pebble  — throw it; its ring pulls a warden off his patrol.
//   2 · Lantern Snuff — kill the nearest lamp for eight seconds of darkness.
//   3 · Shadow Dash   — a short, utterly silent burst of speed.
// Gadgets are spent deliberately: the counts live on the world and the HUD
// reads them straight from here.

import { AudioSys } from './audio.js';

export const GADGET_DEFS = [
  { key: '1', name: 'Chime Pebble', hint: 'aim with mouse, 1 to throw' },
  { key: '2', name: 'Lantern Snuff', hint: '2 near a lit lamp' },
  { key: '3', name: 'Shadow Dash', hint: '3 or Space — silent burst' },
];

export function freshGadgets() {
  return { pebble: 3, snuff: 2, dash: 2 };
}

// Throw a chime pebble toward (tx,ty), clamped to throwing range. The pebble
// flies, lands with a tick, then RINGS: a noise event every warden in earshot
// will come and inspect.
export function throwPebble(world, tx, ty) {
  if (world.gadgets.pebble <= 0 || world.pebble) return false;
  const p = world.player;
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy), max = 280;
  const s = d > max ? max / d : 1;
  world.pebble = { x0: p.x, y0: p.y, x1: p.x + dx * s, y1: p.y + dy * s, t: 0, dur: 0.38 };
  world.gadgets.pebble--;
  return true;
}

export function updatePebble(world, dt) {
  const pb = world.pebble;
  if (!pb) return;
  pb.t += dt;
  if (pb.t >= pb.dur) {
    world.pebble = null;
    AudioSys.pebbleLand();
    AudioSys.chime();
    world.addNoise(pb.x1, pb.y1, 155, 'chime');
    world.callout = { x: pb.x1, y: pb.y1 - 26, text: 'THE CHIME RINGS — WARDENS TURN', t: 2.6 };
  }
}

// Snuff the nearest lit lantern within reach: eight seconds of darkness
// exactly where you need to slip past.
export function snuffLantern(world) {
  if (world.gadgets.snuff <= 0) return false;
  const p = world.player;
  let best = null, bd = 165;
  for (const l of world.lanterns) {
    if (l.out > 0) continue;
    const d = Math.hypot(l.x - p.x, l.y - p.y);
    if (d < bd) { bd = d; best = l; }
  }
  if (!best) return false;
  best.out = 8;
  world.gadgets.snuff--;
  AudioSys.snuff();
  world.callout = { x: best.x, y: best.y - 30, text: 'LANTERN SNUFFED — DARKNESS, 8 HEARTBEATS', t: 2.2 };
  return true;
}

// Shadow dash: silent burst along the player's current facing/movement.
export function shadowDash(world) {
  if (world.gadgets.dash <= 0 || world.dashT > 0) return false;
  const p = world.player;
  const a = p.moveAng !== null && p.moveAng !== undefined ? p.moveAng : p.ang;
  world.dashDx = Math.cos(a); world.dashDy = Math.sin(a);
  world.dashT = 0.13;
  world.gadgets.dash--;
  AudioSys.dash();
  for (let i = 0; i < 6; i++) {
    world.particles.push({ x: p.x, y: p.y, vx: -world.dashDx * 30 + (i - 3) * 6, vy: -world.dashDy * 30 + (i % 3 - 1) * 8, t: 0.4, life: 0.4, col: '140,180,255' });
  }
  return true;
}
