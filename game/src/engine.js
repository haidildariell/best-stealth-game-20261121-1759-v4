// engine.js — game state, input, the loop, and every system wired together:
// movement & footsteps (acoustics), creaking boards, lantern light levels,
// camera alarm, pickups, exits, and the staged ?shot=N scenes the maker uses
// to take honest screenshots of the real game running.

import { LEVELS } from './levels.js';
import { rectSegments, collideCircle } from './raycast.js';
import { createGuard, updateGuard, hearNoise, alertGuard } from './guards.js';
import { freshGadgets, throwPebble, updatePebble, snuffLantern, shadowDash } from './gadgets.js';
import { render } from './renderer.js';
import { drawHUD, drawTitle, drawWin } from './hud.js';
import { AudioSys } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keys = {};
const mouse = { x: 640, y: 400 };

const world = {
  state: 'title', time: 0, levelIndex: 0, level: null,
  walls: [], segs: [], lanterns: [], creaks: [], guards: [], cameras: [],
  loot: [], relic: null, exit: null, hasRelic: false,
  player: { x: 0, y: 0, r: 11, ang: 0, moveAng: 0, sneak: false, lit: 0, noiseR: 0 },
  gadgets: freshGadgets(), pebble: null, dashT: 0, dashDx: 0, dashDy: 0,
  noises: [], particles: [], callout: null,
  alarm: 0, introT: 0, caughtT: 0, detections: 0,
  lootValue: 0, totalLootTaken: 0, totalLoot: 0, totalValue: 0,
  totalTime: 0, gadgetsUsed: 0, rank: '', timeStr: '', frozen: false,
  addNoise(x, y, r, kind) {
    this.noises.push({ x, y, r, t: 0, life: kind === 'chime' ? 1.15 : 0.7, kind });
    for (const g of this.guards) hearNoise(g, { x, y, r });
  },
  caught() {
    this.detections++;
    AudioSys.caught();
    loadLevel(this.levelIndex);
    this.caughtT = 1.4;
  },
};

function loadLevel(i) {
  const L = LEVELS[i];
  world.levelIndex = i; world.level = L;
  world.walls = L.walls.map(w => ({ ...w }));
  world.segs = rectSegments(world.walls);
  world.lanterns = L.lanterns.map(l => ({ ...l, out: 0 }));
  world.creaks = L.creaks;
  world.guards = L.guards.map(createGuard);
  world.cameras = L.cameras.map(c => ({ ...c, ang: c.base }));
  world.loot = L.loot.map(l => ({ ...l, taken: false }));
  world.relic = { ...L.relic, taken: false };
  world.exit = L.exit;
  world.hasRelic = false;
  world.player.x = L.start.x; world.player.y = L.start.y;
  world.player.sneak = false; world.player.noiseR = 0;
  world.gadgets = freshGadgets();
  world.pebble = null; world.dashT = 0;
  world.noises = []; world.particles = []; world.callout = null;
  world.alarm = 0; world.introT = 2.6; world.lootValue = 0;
  world.time = 0;
}

function fmtTime(s) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return m + ':' + String(ss).padStart(2, '0');
}

function completeLevel() {
  world.totalLootTaken += world.loot.filter(l => l.taken).length;
  world.totalLoot += world.loot.length;
  world.totalValue += world.lootValue;
  if (world.levelIndex + 1 < LEVELS.length) {
    loadLevel(world.levelIndex + 1);
  } else {
    world.state = 'win';
    world.rank = world.detections === 0 ? 'GHOST' : world.detections <= 2 ? 'SHADOW' : 'DETECTED';
    world.timeStr = fmtTime(world.totalTime);
    AudioSys.win();
  }
}

function onCreak(x, y) {
  for (const c of world.creaks)
    if (x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h) return true;
  return false;
}

let stepT = 0, creakT = 0, heartT = 0;

function update(dt) {
  world.time += dt;
  if (world.state === 'play') world.totalTime += dt;
  if (world.introT > 0) world.introT -= dt;
  if (world.caughtT > 0) world.caughtT -= dt;
  if (world.callout && world.callout.t > 0) world.callout.t -= dt;
  for (const l of world.lanterns) if (l.out > 0) l.out -= dt;
  world.noises = world.noises.filter(n => (n.t += dt) < n.life);
  world.particles = world.particles.filter(pt => {
    pt.t -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; return pt.t > 0;
  });
  if (world.state !== 'play') return;

  const p = world.player;
  // ---- light level at the player ----
  p.lit = 0;
  for (const l of world.lanterns) {
    if (l.out > 0) continue;
    const d = Math.hypot(l.x - p.x, l.y - p.y);
    p.lit = Math.max(p.lit, Math.max(0, 1 - (d / l.r) * 0.92));
  }

  // ---- movement ----
  let mx = 0, my = 0;
  if (keys['arrowleft'] || keys['a']) mx -= 1;
  if (keys['arrowright'] || keys['d']) mx += 1;
  if (keys['arrowup'] || keys['w']) my -= 1;
  if (keys['arrowdown'] || keys['s']) my += 1;
  const moving = mx !== 0 || my !== 0;
  p.sneak = !!(keys['shift']);
  if (moving) {
    p.moveAng = Math.atan2(my, mx);
    const sp = world.dashT > 0 ? 0 : p.sneak ? 62 : 138;
    p.x += Math.cos(p.moveAng) * sp * dt;
    p.y += Math.sin(p.moveAng) * sp * dt;
  }
  if (world.dashT > 0) {
    world.dashT -= dt;
    p.x += world.dashDx * 720 * dt;
    p.y += world.dashDy * 720 * dt;
    p.noiseR = 0;
  } else {
    p.noiseR = !moving ? 0 : p.sneak ? 16 : 58;
  }
  collideCircle(p, p.r, world.walls);
  p.x = Math.max(30, Math.min(1250, p.x));
  p.y = Math.max(30, Math.min(770, p.y));
  p.ang = Math.atan2(mouse.y - p.y, mouse.x - p.x);

  // ---- footsteps & creaking boards: the acoustic layer ----
  if (moving && world.dashT <= 0) {
    stepT += dt;
    const interval = p.sneak ? 0.5 : 0.31;
    if (stepT > interval) {
      stepT = 0;
      AudioSys.step(p.sneak);
      if (p.noiseR > 0) world.addNoise(p.x, p.y, p.noiseR, 'step');
    }
    if (!p.sneak && onCreak(p.x, p.y)) {
      creakT += dt;
      if (creakT > 0.45) {
        creakT = 0;
        AudioSys.creak();
        world.addNoise(p.x, p.y, 125, 'creak');
        world.callout = { x: p.x, y: p.y - 30, text: 'THE BOARDS CREAK — THEY HEARD THAT', t: 1.6 };
      }
    } else creakT = 0;
  }

  // ---- heartbeat near a warden who cannot see you ----
  heartT -= dt;
  if (heartT <= 0) {
    for (const g of world.guards) {
      if (Math.hypot(g.x - p.x, g.y - p.y) < 95) { AudioSys.heartbeat(); heartT = 0.85; break; }
    }
    if (heartT <= 0) heartT = 0.3;
  }

  updatePebble(world, dt);
  for (const g of world.guards) updateGuard(g, dt, world);

  // ---- cameras ----
  for (const c of world.cameras) {
    c.ang = c.base + Math.sin(world.time * c.speed) * c.sweep;
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    let seen = false;
    if (d < c.range && p.lit > 0.2) {
      let da = Math.atan2(p.y - c.y, p.x - c.x) - c.ang;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      if (Math.abs(da) < 0.42) {
        // line of sight by stepping along the ray
        let blocked = false;
        for (let s = 12; s < d; s += 12) {
          const sx = c.x + Math.cos(c.ang + da) * 0 + (p.x - c.x) * (s / d);
          const sy = c.y + (p.y - c.y) * (s / d);
          for (const w of world.walls) if (sx > w.x && sx < w.x + w.w && sy > w.y && sy < w.y + w.h) { blocked = true; break; }
          if (blocked) break;
        }
        seen = !blocked;
      }
    }
    if (seen) world.alarm = Math.min(1, world.alarm + dt * 0.85);
    else world.alarm = Math.max(0, world.alarm - dt * 0.22);
    if (world.alarm >= 1) {
      world.alarm = 0.45;
      AudioSys.spotted();
      for (const g of world.guards) alertGuard(g, p.x, p.y);
      world.callout = { x: c.x, y: c.y + 40, text: 'THE CAMERA SAW YOU — EVERY WARDEN ALERTED', t: 2.4 };
    }
  }

  // ---- pickups & exit ----
  for (const it of world.loot) {
    if (!it.taken && Math.hypot(it.x - p.x, it.y - p.y) < 21) {
      it.taken = true; world.lootValue += it.v;
      AudioSys.pickup();
      for (let i = 0; i < 7; i++) world.particles.push({ x: it.x, y: it.y, vx: (i - 3) * 14, vy: -22 - i * 4, t: 0.5, life: 0.5, col: '255,215,106' });
    }
  }
  if (!world.relic.taken && Math.hypot(world.relic.x - p.x, world.relic.y - p.y) < 24) {
    world.relic.taken = true; world.hasRelic = true;
    AudioSys.relic();
    world.callout = { x: world.relic.x, y: world.relic.y - 34, text: 'RELIC SECURED — NOW SLIP OUT, UNSEEN', t: 2.8 };
  }
  const e = world.exit;
  if (world.hasRelic && p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) completeLevel();
}

// ---------- input ----------
window.addEventListener('keydown', ev => {
  const k = ev.key.toLowerCase();
  keys[k] = true;
  AudioSys.unlock();
  if (world.state === 'title' && (k === 'enter' || k === ' ')) { world.state = 'play'; loadLevel(0); }
  else if (world.state === 'win' && k === 'r') { world.detections = 0; world.totalLootTaken = 0; world.totalLoot = 0; world.totalValue = 0; world.totalTime = 0; world.gadgetsUsed = 0; world.state = 'play'; loadLevel(0); }
  else if (world.state === 'play') {
    if (k === '1' && throwPebble(world, mouse.x, mouse.y)) world.gadgetsUsed++;
    if (k === '2' && snuffLantern(world)) world.gadgetsUsed++;
    if ((k === '3' || k === ' ') && shadowDash(world)) world.gadgetsUsed++;
    if (k === 'r') loadLevel(world.levelIndex);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) ev.preventDefault();
  }
});
window.addEventListener('keyup', ev => { keys[ev.key.toLowerCase()] = false; });
window.addEventListener('mousemove', ev => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (ev.clientX - r.left) * (1280 / r.width);
  mouse.y = (ev.clientY - r.top) * (800 / r.height);
});
canvas.addEventListener('click', () => {
  AudioSys.unlock();
  if (world.state === 'title') { world.state = 'play'; loadLevel(0); }
});

// ---------- staged screenshot scenes (?shot=1..4) ----------
function setupShot(n) {
  world.frozen = true;
  world.time = 2.4;
  if (n === 1) {
    loadLevel(0);
    world.state = 'play'; world.introT = 0;
    const p = world.player;
    p.x = 565; p.y = 540; p.lit = 0.8; p.noiseR = 58;
    world.loot[2].taken = true; world.lootValue = 60;
    const g = world.guards[0];
    g.x = 428; g.y = 466; g.ang = Math.atan2(p.y - g.y, p.x - g.x);
    g.mode = 'watch'; g.susp = 0.62; g.lastSeen = { x: p.x, y: p.y };
    const g2 = world.guards[1];
    g2.x = 1105; g2.y = 430; g2.ang = Math.PI;
  } else if (n === 2) {
    loadLevel(1);
    world.state = 'play'; world.introT = 0;
    const p = world.player;
    p.x = 492; p.y = 404; p.sneak = true; p.lit = 0.08; p.noiseR = 16;
    const g = world.guards[1];
    g.x = 578; g.y = 372; g.ang = Math.PI - 1.12; g.mode = 'patrol'; g.susp = 0.18;
    const g1 = world.guards[0];
    g1.x = 250; g1.y = 560; g1.ang = -0.4;
  } else if (n === 3) {
    loadLevel(0);
    world.state = 'play'; world.introT = 0;
    const p = world.player;
    p.x = 180; p.y = 470; p.sneak = true; p.lit = 0.24; p.noiseR = 16;
    world.gadgets.pebble = 2; world.gadgetsUsed = 1;
    world.noises.push({ x: 820, y: 300, r: 155, t: 0.55, life: 1.15, kind: 'chime' });
    world.noises.push({ x: 820, y: 300, r: 155, t: 0.98, life: 1.15, kind: 'chime' });
    const g = world.guards[0];
    g.x = 690; g.y = 300; g.ang = 0; g.mode = 'investigate'; g.tx = 820; g.ty = 300; g.heardT = 2; g.susp = 0.55;
    const g2 = world.guards[1];
    g2.x = 1105; g2.y = 330; g2.ang = -Math.PI / 2;
    world.callout = { x: 820, y: 268, text: 'THE CHIME RINGS — WARDENS TURN', t: 99 };
  } else if (n === 4) {
    loadLevel(2);
    world.state = 'win';
    world.rank = 'GHOST';
    world.detections = 0; world.totalLootTaken = 14; world.totalLoot = 15;
    world.totalValue = 640; world.gadgetsUsed = 4; world.timeStr = '7:41';
  }
}

const shotParam = new URLSearchParams(location.search).get('shot');
if (shotParam) setupShot(parseInt(shotParam, 10));
else loadLevel(0);

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (!world.frozen) update(dt);
  if (world.state === 'title') drawTitle(ctx, world);
  else {
    render(ctx, world);
    if (world.state === 'play') drawHUD(ctx, world);
    if (world.state === 'win') drawWin(ctx, world);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__lanternReady = true;
