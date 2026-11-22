// guards.js — the Archive Wardens. Each guard runs the same suspicion state
// machine: UNAWARE -> SUSPICIOUS -> ALERT, driven by a vision cone that walls
// genuinely block and that lamplight genuinely extends. A player standing in
// darkness is seen at barely half the range of one caught in lantern light,
// and a noise — a creaking board, a thrown chime — pulls a guard off patrol
// to investigate the exact point it came from.

import { losClear, collideCircle } from './raycast.js';
import { AudioSys } from './audio.js';

export const CONE_HALF = 0.58;      // ~33 degrees either side of facing
export const BASE_RANGE = 178;      // vision range in full lantern light

export function createGuard(def) {
  return {
    name: def.name, path: def.path, speed: def.speed,
    x: def.path[0][0], y: def.path[0][1], ang: 0,
    wp: 1, dir: 1, mode: 'patrol', timer: 0,
    susp: 0, tx: 0, ty: 0, lastSeen: null, loseT: 0, heardT: 0,
  };
}

// How strongly this guard sees the player right now: 0 = unseen, up to ~1.6
// at point blank in bright light. Darkness and sneaking both cut it down.
export function visibility(g, world) {
  const p = world.player;
  const dx = p.x - g.x, dy = p.y - g.y;
  const d = Math.hypot(dx, dy);
  const range = BASE_RANGE * (0.45 + 0.55 * p.lit);
  if (d > range) return 0;
  let da = Math.atan2(dy, dx) - g.ang;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  if (Math.abs(da) > CONE_HALF && d > 34) return 0;   // peripheral brush at arm's length
  if (!losClear(g.x, g.y, p.x, p.y, world.segs)) return 0;
  const prox = 1.25 - d / range;                       // closer = seen faster
  const light = 0.45 + 0.55 * p.lit;                   // shadow hides you
  const sneak = p.sneak ? 0.55 : 1;
  return Math.max(0, prox) * light * sneak * 1.5;
}

function faceToward(g, tx, ty, dt, rate = 6) {
  const want = Math.atan2(ty - g.y, tx - g.x);
  let da = want - g.ang;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  g.ang += Math.max(-rate * dt, Math.min(rate * dt, da));
  return Math.abs(da) < 0.05;
}

function moveToward(g, tx, ty, speed, dt, world) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 3) return true;
  faceToward(g, tx, ty, dt);
  const step = Math.min(d, speed * dt);
  g.x += (dx / d) * step; g.y += (dy / d) * step;
  collideCircle(g, 12, world.walls);
  return d <= Math.max(4, speed * dt);
}

export function hearNoise(g, n) {
  if (g.mode === 'chase') return;
  const d = Math.hypot(n.x - g.x, n.y - g.y);
  if (d <= n.r) {
    g.mode = 'investigate'; g.tx = n.x; g.ty = n.y;
    g.susp = Math.max(g.susp, 0.55); g.timer = 0; g.heardT = 2.2;
  }
}

export function alertGuard(g, x, y) {
  g.mode = 'chase'; g.lastSeen = { x, y }; g.susp = 1; g.loseT = 0;
}

export function updateGuard(g, dt, world) {
  const p = world.player;
  const vis = visibility(g, world);
  if (vis > 0) {
    g.susp = Math.min(1, g.susp + vis * dt);
    g.lastSeen = { x: p.x, y: p.y }; g.loseT = 0;
    if (g.susp >= 1 && g.mode !== 'chase') { g.mode = 'chase'; AudioSys.spotted(); }
  } else {
    g.susp = Math.max(0, g.susp - dt * (g.mode === 'chase' ? 0.05 : 0.22));
    if (g.mode === 'chase') g.loseT += dt;
  }
  if (g.heardT > 0) g.heardT -= dt;

  switch (g.mode) {
    case 'patrol': {
      if (g.susp > 0.42) { g.mode = 'watch'; break; }
      const [tx, ty] = g.path[g.wp];
      if (moveToward(g, tx, ty, g.speed, dt, world)) {
        g.mode = 'pause'; g.timer = 1.1 + (g.wp % 3) * 0.3;
      }
      break;
    }
    case 'pause': {
      g.timer -= dt;
      g.ang += Math.sin(world.time * 0.9 + g.wp) * dt * 0.35;  // idle glance sweep
      if (g.susp > 0.42) { g.mode = 'watch'; break; }
      if (g.timer <= 0) {
        let n = g.wp + g.dir;
        if (n < 0 || n >= g.path.length) { g.dir *= -1; n = g.wp + g.dir; }
        g.wp = Math.max(0, Math.min(g.path.length - 1, n));
        g.mode = 'patrol';
      }
      break;
    }
    case 'watch': {
      // Suspicious: stop dead and stare at whatever moved.
      if (g.lastSeen) faceToward(g, g.lastSeen.x, g.lastSeen.y, dt, 8);
      if (g.susp <= 0.12) { g.mode = 'return'; }
      break;
    }
    case 'investigate': {
      if (moveToward(g, g.tx, g.ty, g.speed * 1.25, dt, world)) {
        g.timer += dt;
        g.ang += dt * 1.6;                                     // look around the noise point
        if (g.timer > 1.6) { g.timer = 0; g.mode = 'return'; g.susp = Math.min(g.susp, 0.3); }
      }
      break;
    }
    case 'chase': {
      const tgt = vis > 0 ? p : g.lastSeen;
      if (tgt && moveToward(g, tgt.x, tgt.y, g.speed * 1.65, dt, world) && vis === 0) {
        g.mode = 'investigate'; g.tx = tgt.x; g.ty = tgt.y; g.timer = 0;
      }
      if (vis > 0 && Math.hypot(p.x - g.x, p.y - g.y) < 27) world.caught(g);
      if (g.loseT > 4) { g.mode = 'return'; g.susp = 0.35; }
      break;
    }
    case 'return': {
      const [tx, ty] = g.path[g.wp];
      if (moveToward(g, tx, ty, g.speed * 1.1, dt, world)) g.mode = 'patrol';
      if (g.susp > 0.42 && vis > 0) g.mode = 'watch';
      break;
    }
  }
}
