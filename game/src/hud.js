// hud.js — the readable layer: a detection banner big enough to read across
// the room, gadget counts that never hide, and title / victory screens that
// tell the whole story of the run (rank, loot, time, detections).

function box(ctx, x, y, w, h, fill, stroke) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); }
}

export function detectionState(world) {
  let maxSusp = 0, anyChase = false, anyHunt = false;
  for (const g of world.guards) {
    maxSusp = Math.max(maxSusp, g.susp);
    if (g.mode === 'chase') anyChase = true;
    if (g.mode === 'investigate' || g.heardT > 0) anyHunt = true;
  }
  if (anyChase) return { label: 'SPOTTED!', col: '#ff5040', bg: 'rgba(80,8,4,0.88)' };
  if (maxSusp > 0.42) return { label: 'SUSPICIOUS?', col: '#ffb347', bg: 'rgba(84,52,4,0.88)' };
  if (anyHunt) return { label: 'A NOISE — THEY ARE LOOKING', col: '#8ecbff', bg: 'rgba(10,36,64,0.88)' };
  return { label: 'UNSEEN', col: '#7fe8a8', bg: 'rgba(6,44,24,0.82)' };
}

export function drawHUD(ctx, world) {
  // top strip
  box(ctx, 0, 0, 1280, 56, 'rgba(8,8,14,0.78)');
  ctx.fillStyle = '#f0e2c4'; ctx.font = 'bold 17px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(world.level.name, 16, 24);
  ctx.fillStyle = 'rgba(240,226,196,0.65)'; ctx.font = '11px system-ui';
  ctx.fillText(world.hasRelic ? 'Relic secured — reach the EXIT unseen.' : 'Objective: steal “' + world.relic.label + '”, then slip out.', 16, 43);

  // detection banner, dead centre, impossible to miss
  const ds = detectionState(world);
  ctx.font = 'bold 25px system-ui';
  const w = ctx.measureText(ds.label).width + 44;
  box(ctx, 640 - w / 2, 8, w, 40, ds.bg, ds.col);
  ctx.fillStyle = ds.col; ctx.textAlign = 'center';
  ctx.fillText(ds.label, 640, 37);

  // camera alarm under the banner
  if (world.cameras.length && world.alarm > 0.02) {
    box(ctx, 540, 52, 200, 8, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = '#ff5040'; ctx.fillRect(541, 53, 198 * Math.min(1, world.alarm), 6);
    ctx.font = 'bold 9px system-ui'; ctx.fillStyle = '#ff8a7a'; ctx.fillText('CAMERA ALARM', 640, 72);
  }

  // loot, top right
  const taken = world.loot.filter(l => l.taken).length;
  ctx.textAlign = 'right'; ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 15px system-ui';
  ctx.fillText('◆ LOOT ' + taken + '/' + world.loot.length + '  ·  ' + world.lootValue + ' crowns', 1264, 24);
  ctx.fillStyle = world.hasRelic ? '#7fe8a8' : 'rgba(255,255,255,0.55)'; ctx.font = '11px system-ui';
  ctx.fillText(world.hasRelic ? 'RELIC ✓ SECURED' : 'RELIC ✗ still in the archive', 1264, 43);

  // gadgets, bottom left
  const chips = [
    ['1', 'CHIME', world.gadgets.pebble], ['2', 'SNUFF', world.gadgets.snuff], ['3', 'DASH', world.gadgets.dash],
  ];
  chips.forEach((c, i) => {
    const x = 14 + i * 118, y = 752;
    box(ctx, x, y, 108, 34, 'rgba(8,8,14,0.8)', c[2] > 0 ? '#8a7a4a' : '#3a362c');
    ctx.fillStyle = c[2] > 0 ? '#ffd76a' : '#5a5546'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('[' + c[0] + '] ' + c[1], x + 8, y + 15);
    ctx.font = 'bold 14px system-ui'; ctx.fillText('× ' + c[2], x + 8, y + 30);
  });

  // noise + controls, bottom right
  const nz = world.player.noiseR;
  const nzLabel = nz <= 20 ? 'SILENT' : nz <= 60 ? 'SOFT STEPS' : 'LOUD!';
  const nzCol = nz <= 20 ? '#7fe8a8' : nz <= 60 ? '#ffd76a' : '#ff5040';
  ctx.textAlign = 'right'; ctx.fillStyle = nzCol; ctx.font = 'bold 13px system-ui';
  ctx.fillText('YOUR NOISE: ' + nzLabel, 1264, 766);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px system-ui';
  ctx.fillText('WASD/arrows move · SHIFT sneak · mouse aim · 1 chime · 2 snuff · 3/Space dash · R restart floor', 1264, 782);

  // level intro toast
  if (world.introT > 0) {
    ctx.globalAlpha = Math.min(1, world.introT);
    box(ctx, 340, 660, 600, 52, 'rgba(8,8,14,0.85)', '#8a7a4a');
    ctx.fillStyle = '#f0e2c4'; ctx.font = 'italic 15px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(world.level.sub, 640, 692);
    ctx.globalAlpha = 1;
  }
  // caught flash
  if (world.caughtT > 0) {
    ctx.fillStyle = `rgba(160,10,10,${Math.min(0.45, world.caughtT)})`;
    ctx.fillRect(0, 0, 1280, 800);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 34px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('CAUGHT!', 640, 400);
  }
}

export function drawTitle(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, 800);
  g.addColorStop(0, '#0a0c18'); g.addColorStop(1, '#181008');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 800);
  // a row of lantern glows behind the title
  for (const [x, y, r] of [[240, 210, 130], [640, 160, 170], [1040, 210, 130]]) {
    const rg = ctx.createRadialGradient(x, y, 4, x, y, r);
    rg.addColorStop(0, 'rgba(255,170,70,0.5)'); rg.addColorStop(1, 'rgba(255,170,70,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf7a'; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('THE LANTERN ARCHIVE', 640, 300);
  ctx.fillStyle = '#f0e2c4'; ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('a relic heist by lamplight — three floors, one shadow: yours', 640, 338);
  ctx.fillStyle = 'rgba(240,226,196,0.85)'; ctx.font = '15px system-ui';
  const lines = [
    'Wardens see by lantern light — in darkness their cones shrink to almost nothing.',
    'The floor can betray you: running is loud, creaky boards sing, a thrown chime lies for you.',
    '',
    'WASD / arrows — move        SHIFT — sneak (slow, silent, hard to see)',
    'MOUSE — aim        1 — Chime Pebble        2 — Lantern Snuff        3 / SPACE — Shadow Dash',
    'Steal each floor’s relic, take what loot you dare, and leave by the EXIT unseen.',
    'Finish all three floors. No alarms, no sightings: GHOST.',
  ];
  lines.forEach((s, i) => ctx.fillText(s, 640, 400 + i * 27));
  ctx.fillStyle = '#7fe8a8'; ctx.font = 'bold 19px system-ui';
  ctx.fillText('PRESS ENTER OR CLICK TO SLIP INSIDE', 640, 640);
}

export function drawWin(ctx, world) {
  ctx.fillStyle = 'rgba(5,6,12,0.92)'; ctx.fillRect(0, 0, 1280, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f0e2c4'; ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('the archive is emptier tonight', 640, 190);
  const rankCol = world.rank === 'GHOST' ? '#ffd76a' : world.rank === 'SHADOW' ? '#b8c7d9' : '#c96a4a';
  ctx.fillStyle = rankCol; ctx.font = 'bold 92px Georgia, serif';
  ctx.fillText(world.rank, 640, 300);
  ctx.fillStyle = 'rgba(240,226,196,0.75)'; ctx.font = '14px system-ui';
  ctx.fillText(world.rank === 'GHOST' ? 'No warden ever truly saw you. The lanterns kept your secret.'
    : world.rank === 'SHADOW' ? 'Seen, perhaps — but never held. The archive will wonder.'
    : 'They know your face now. The relics, at least, are yours.', 640, 336);
  const rows = [
    ['Time in the dark', world.timeStr],
    ['Loot taken', world.totalLootTaken + '/' + world.totalLoot + ' pieces · ' + world.totalValue + ' crowns'],
    ['Relics stolen', '3/3 — Ember Codex · Choir Bell · The First Lantern'],
    ['Times caught', String(world.detections)],
    ['Gadgets spent', String(world.gadgetsUsed)],
  ];
  ctx.font = '16px system-ui';
  rows.forEach((r, i) => {
    ctx.fillStyle = 'rgba(240,226,196,0.6)'; ctx.textAlign = 'right'; ctx.fillText(r[0], 620, 410 + i * 32);
    ctx.fillStyle = '#f0e2c4'; ctx.textAlign = 'left'; ctx.fillText(r[1], 660, 410 + i * 32);
  });
  ctx.textAlign = 'center'; ctx.fillStyle = '#7fe8a8'; ctx.font = 'bold 17px system-ui';
  ctx.fillText('PRESS R TO STEAL IT ALL AGAIN', 640, 620);
}
