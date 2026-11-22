// raycast.js — line-of-sight and vision-cone geometry against wall segments.
// Walls are axis-aligned rectangles; each becomes four segments. Every sight
// question in the game (guard cones, camera cones, "can he see me?") is
// answered here, so a pillar blocks vision exactly the way it looks.

export function rectSegments(rects) {
  const segs = [];
  for (const r of rects) {
    const x2 = r.x + r.w, y2 = r.y + r.h;
    segs.push([r.x, r.y, x2, r.y], [x2, r.y, x2, y2], [x2, y2, r.x, y2], [r.x, y2, r.x, r.y]);
  }
  return segs;
}

// Distance from (x,y) along angle `ang` to the nearest segment, capped at maxDist.
export function rayHit(x, y, ang, segs, maxDist) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let best = maxDist;
  for (const s of segs) {
    const ex = s[2] - s[0], ey = s[3] - s[1];
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-9) continue;
    const t = ((s[0] - x) * ey - (s[1] - y) * ex) / denom;
    const u = ((s[0] - x) * dy - (s[1] - y) * dx) / denom;
    if (t > 0.001 && u >= 0 && u <= 1 && t < best) best = t;
  }
  return best;
}

// True when nothing blocks the straight line between two points.
export function losClear(x1, y1, x2, y2, segs) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  if (d < 1) return true;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return rayHit(x1, y1, ang, segs, d) >= d - 0.5;
}

// Polygon of what an eye at (x,y) facing `ang` can actually see inside a cone.
export function conePolygon(x, y, ang, halfAngle, range, segs, steps = 33) {
  const pts = [[x, y]];
  for (let i = 0; i < steps; i++) {
    const a = ang - halfAngle + (2 * halfAngle * i) / (steps - 1);
    const d = rayHit(x, y, a, segs, range);
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}

// Shortest distance from a point to any wall rectangle (for collision push-out).
export function pointRectDist(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

// Circle vs wall rectangles: push the circle out along the smallest penetration.
export function collideCircle(p, radius, rects) {
  for (const r of rects) {
    const cx = Math.max(r.x, Math.min(p.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(p.y, r.y + r.h));
    let dx = p.x - cx, dy = p.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 < 1e-6) { p.x = cx + radius; continue; }
      const d = Math.sqrt(d2);
      p.x = cx + (dx / d) * radius;
      p.y = cy + (dy / d) * radius;
    }
  }
  return p;
}
