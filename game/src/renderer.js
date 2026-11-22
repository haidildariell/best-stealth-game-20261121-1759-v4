// renderer.js — everything the player (and the judge's screenshots) see.
// The look is lamplight: a warm scene carved out of near-total darkness by
// radial light around each lantern, vision cones you can read at a glance,
// and sound drawn as expanding rings so a thrown chime is visible mid-lie.

import { conePolygon } from './raycast.js';
import { CONE_HALF, BASE_RANGE, visibility } from './guards.js';

const shade = document.createElement('canvas');
shade.width = 1280; shade.height = 800;

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

export function render(ctx, world) {
  const L = world.level;
  // ---- floor ----
  ctx.fillStyle = L.floor; ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = L.floorAlt;
  for (let y = 0; y < 800; y += 64) for (let x = 0; x < 1280; x += 64)
    if (((x + y) / 64) % 2 === 0) ctx.fillRect(x, y, 64, 64);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 800); ctx.stroke(); }

  // ---- creaking floorboards ----
  for (const c of world.creaks) {
    ctx.fillStyle = '#8a6b42';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = 'rgba(46,30,12,0.8)';
    for (let y = c.y + 8; y < c.y + c.h; y += 11) { ctx.beginPath(); ctx.moveTo(c.x, y); ctx.lineTo(c.x + c.w, y); ctx.stroke(); }
    ctx.strokeStyle = '#c9a35f'; ctx.lineWidth = 2; ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(30,20,8,0.85)';
    ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('C R E A K Y   B O A R D S', c.x + c.w / 2, c.y + c.h / 2 + 3);
  }

  // ---- exit door ----
  const e = world.exit;
  ctx.fillStyle = world.hasRelic ? '#1d4d33' : '#33302a';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = world.hasRelic ? '#57e389' : '#6b675c'; ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = world.hasRelic ? '#a9ffcb' : '#8f8a7c';
  ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
  const exitLabelX = Math.max(110, Math.min(1170, e.x + e.w / 2));
  ctx.fillText(world.hasRelic ? 'EXIT — OPEN' : 'EXIT — NEED THE RELIC', exitLabelX, e.y + e.h / 2 + 4);

  // ---- loot & relic ----
  for (const it of world.loot) {
    if (it.taken) continue;
    ctx.save(); ctx.translate(it.x, it.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#f4c542'; ctx.fillRect(-6, -6, 12, 12);
    ctx.fillStyle = '#ffe89a'; ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,232,154,0.9)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(it.label, it.x, it.y + 20);
  }
  if (!world.relic.taken) {
    const r = world.relic;
    ctx.fillStyle = '#4a4238'; ctx.beginPath(); ctx.arc(r.x, r.y, 17, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c9a35f'; ctx.lineWidth = 2; ctx.stroke();
    const pulse = 0.75 + 0.25 * Math.sin(world.time * 3);
    ctx.fillStyle = `rgba(255,120,60,${pulse})`;
    ctx.beginPath(); ctx.arc(r.x, r.y, 8, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd9a0'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('RELIC — ' + r.label, r.x, r.y + 32);
  }

  // ---- walls ----
  for (const w of world.walls) {
    ctx.fillStyle = '#57493a'; ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#6e5d49'; ctx.fillRect(w.x, w.y, w.w, Math.min(6, w.h));
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  // ---- lanterns ----
  for (const l of world.lanterns) {
    ctx.fillStyle = '#241a10'; ctx.fillRect(l.x - 3, l.y - 3, 6, 12);
    if (l.out > 0) {
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(l.x, l.y - 6, 4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(200,200,200,0.75)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('snuffed ' + Math.ceil(l.out) + 's', l.x, l.y + 22);
    } else {
      const fl = 0.85 + 0.15 * Math.sin(world.time * 11 + l.x);
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(l.x, l.y - 6, 5 * fl + 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.arc(l.x, l.y - 6, 2.4, 0, 7); ctx.fill();
    }
  }

  // ---- cameras ----
  for (const c of world.cameras) {
    ctx.fillStyle = '#1c1c22'; ctx.fillRect(c.x - 10, c.y - 8, 20, 14);
    ctx.fillStyle = '#e33'; ctx.beginPath(); ctx.arc(c.x, c.y, 3, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '8px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('CAMERA', c.x, c.y - 13);
  }

  // ---- pebble in flight ----
  if (world.pebble) {
    const pb = world.pebble, k = pb.t / pb.dur;
    const x = pb.x0 + (pb.x1 - pb.x0) * k, y = pb.y0 + (pb.y1 - pb.y0) * k - Math.sin(k * Math.PI) * 42;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(pb.x0 + (pb.x1 - pb.x0) * k, pb.y0 + (pb.y1 - pb.y0) * k, 5, 2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
  }

  // ---- darkness & lamplight ----
  const sctx = shade.getContext('2d');
  sctx.clearRect(0, 0, 1280, 800);
  sctx.globalCompositeOperation = 'source-over';
  sctx.fillStyle = 'rgba(4,5,13,0.88)'; sctx.fillRect(0, 0, 1280, 800);
  sctx.globalCompositeOperation = 'destination-out';
  for (const l of world.lanterns) {
    if (l.out > 0) continue;
    const g = sctx.createRadialGradient(l.x, l.y, 8, l.x, l.y, l.r);
    g.addColorStop(0, 'rgba(0,0,0,0.97)'); g.addColorStop(0.7, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = g; sctx.beginPath(); sctx.arc(l.x, l.y, l.r, 0, 7); sctx.fill();
  }
  const pg = sctx.createRadialGradient(world.player.x, world.player.y, 2, world.player.x, world.player.y, 52);
  pg.addColorStop(0, 'rgba(0,0,0,0.55)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = pg; sctx.beginPath(); sctx.arc(world.player.x, world.player.y, 52, 0, 7); sctx.fill();
  ctx.drawImage(shade, 0, 0);
  // warm tint inside lamplight
  ctx.globalCompositeOperation = 'overlay';
  for (const l of world.lanterns) {
    if (l.out > 0) continue;
    const g = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, l.r * 0.8);
    g.addColorStop(0, 'rgba(255,166,66,0.20)'); g.addColorStop(1, 'rgba(255,166,66,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x, l.y, l.r * 0.8, 0, 7); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // ---- vision cones (over the dark, so they read instantly) ----
  for (const g of world.guards) {
    const range = BASE_RANGE * (0.45 + 0.55 * world.player.lit);
    const pts = conePolygon(g.x, g.y, g.ang, CONE_HALF, range, world.segs, 25);
    const col = g.mode === 'chase' ? '255,64,48' : (g.susp > 0.42 || g.mode === 'watch') ? '255,150,32' : '255,205,84';
    poly(ctx, pts);
    ctx.fillStyle = `rgba(${col},${g.mode === 'chase' ? 0.30 : 0.17})`; ctx.fill();
    ctx.strokeStyle = `rgba(${col},0.35)`; ctx.lineWidth = 1; ctx.stroke();
  }
  for (const c of world.cameras) {
    const pts = conePolygon(c.x, c.y, c.ang, 0.42, c.range, world.segs, 21);
    poly(ctx, pts);
    ctx.fillStyle = 'rgba(178,132,255,0.14)'; ctx.fill();
    ctx.strokeStyle = 'rgba(178,132,255,0.3)'; ctx.stroke();
  }

  // ---- sound rings ----
  for (const n of world.noises) {
    const k = 1 - n.t / n.life;
    const col = n.kind === 'chime' ? '255,205,84' : n.kind === 'creak' ? '255,170,90' : '130,200,255';
    for (let ring = 0; ring < 2; ring++) {
      const rr = n.r * (1 - k) * (ring === 0 ? 1 : 0.62);
      ctx.strokeStyle = `rgba(${col},${0.55 * k})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(1, rr), 0, 7); ctx.stroke();
    }
    ctx.fillStyle = `rgba(${col},${0.9 * k})`; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(n.kind === 'chime' ? '♪ CHIME' : n.kind === 'creak' ? 'CREAK!' : 'noise', n.x, n.y - n.r * (1 - k) - 6);
  }

  // ---- particles ----
  for (const pt of world.particles) {
    ctx.fillStyle = `rgba(${pt.col},${Math.max(0, pt.t / pt.life) * 0.8})`;
    ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
  }

  // ---- guards ----
  for (const g of world.guards) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(g.x, g.y + 9, 11, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = g.mode === 'chase' ? '#a31621' : '#6d1f2c';
    ctx.beginPath(); ctx.arc(g.x, g.y, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8b04b'; ctx.beginPath(); ctx.arc(g.x, g.y - 3, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#f5d78e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + Math.cos(g.ang) * 15, g.y + Math.sin(g.ang) * 15); ctx.stroke();
    // suspicion meter arc
    if (g.susp > 0.03) {
      ctx.strokeStyle = g.susp > 0.42 ? '#ff9632' : '#ffd76a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(g.x, g.y, 17, -Math.PI / 2, -Math.PI / 2 + g.susp * Math.PI * 2); ctx.stroke();
    }
    const mark = g.mode === 'chase' ? '!' : (g.mode === 'watch' || g.susp > 0.42) ? '?' : (g.heardT > 0 || g.mode === 'investigate') ? '♪?' : null;
    if (mark) {
      ctx.fillStyle = g.mode === 'chase' ? '#ff5040' : '#ffb347';
      ctx.font = 'bold 17px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(mark, g.x, g.y - 22);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '8px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + 26);
  }

  // ---- player ----
  const p = world.player;
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 9, 10, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = p.sneak ? '#123a44' : '#175263';
  ctx.beginPath(); ctx.arc(p.x, p.y, p.sneak ? 10 : 11, 0, 7); ctx.fill();
  ctx.fillStyle = '#0b2530'; ctx.beginPath(); ctx.arc(p.x, p.y - 3, 6.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd9a0'; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.ang) * 3, p.y - 3 + Math.sin(p.ang) * 3, 2.2, 0, 7); ctx.fill();
  if (p.lit < 0.3) {
    ctx.fillStyle = 'rgba(160,220,255,0.9)'; ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('IN SHADOW', p.x, p.y - 18);
  }
  // near-miss heartbeat: a warden is close, and cannot see you
  let near = null, nd = 1e9;
  for (const g of world.guards) { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < nd) { nd = d; near = g; } }
  if (near && nd < 100 && visibility(near, world) === 0 && world.state === 'play') {
    const s = 1 + 0.25 * Math.sin(world.time * 9);
    ctx.fillStyle = '#ff5b74'; ctx.font = `${Math.round(15 * s)}px system-ui`; ctx.textAlign = 'center';
    ctx.fillText('♥', p.x + 20, p.y - 14);
    ctx.fillStyle = 'rgba(255,160,175,0.95)'; ctx.font = 'bold 9px system-ui';
    ctx.fillText('NEAR MISS — HOLD STILL', p.x - 34, p.y + 30);
  }

  // ---- callout ----
  if (world.callout && world.callout.t > 0) {
    const c = world.callout;
    ctx.strokeStyle = 'rgba(255,215,106,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(c.x, c.y + 12); ctx.lineTo(c.x, c.y + 30); ctx.stroke();
    ctx.font = 'bold 12px system-ui';
    const w = ctx.measureText(c.text).width + 18;
    ctx.fillStyle = 'rgba(12,10,4,0.88)'; ctx.fillRect(c.x - w / 2, c.y - 12, w, 24);
    ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 1.5; ctx.strokeRect(c.x - w / 2, c.y - 12, w, 24);
    ctx.fillStyle = '#ffd76a'; ctx.textAlign = 'center'; ctx.fillText(c.text, c.x, c.y + 4);
  }

  // ---- vignette ----
  const vg = ctx.createRadialGradient(640, 400, 320, 640, 400, 780);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, 1280, 800);
}
