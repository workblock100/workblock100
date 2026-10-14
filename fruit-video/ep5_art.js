'use strict';
/* SHIFT HAPPENS, Episode 5 art kit: five new fruit, their accessories and props, the blame counter and the overlays.
 * Everything registers through the engine's EXT hooks (see engine.js), so Episodes 1-4 render exactly as before.
 * Exposed to ep5_sets.js and ep5.js as window.A5. */
(() => {
const A = window.A5 = {};

// ------------------------------------------------------------------ new fruit
Object.assign(KINDS, {
  moon:   { rx: 128, ry: 128, shape: 'round', tex: 'crater', c: ['#fffdf2', '#e8e2c4', '#8a84a8'], eyeY: -12, eyeX: 46, mouthY: 46, er: 27, mw: 30 },
  sun:    { rx: 116, ry: 116, shape: 'round', tex: 'sunspot', c: ['#fffbb8', '#ffd22e', '#e98a00'], eyeY: -12, eyeX: 42, mouthY: 38, er: 24, mw: 30 },
  mango:  { rx: 100, ry: 118, shape: 'mango', tex: 'mango', c: ['#ffe58a', '#ff9d1c', '#c2381f'], eyeY: -14, eyeX: 36, mouthY: 34, er: 21, leg: 86, hip: 32, shoe: '#ffffff', shoe2: '#2ab7a9' },
  pear:   { rx: 112, ry: 130, shape: 'pear', tex: 'pear', c: ['#eef7a8', '#b9d63a', '#5d7d14'], eyeY: 6, eyeX: 36, mouthY: 52, er: 22, leg: 84, hip: 36, shoe: '#4a3320', shoe2: '#2b1d12' },
  dragon: { rx: 104, ry: 124, shape: 'round', tex: 'dragon', c: ['#ff9fd6', '#ea3a9c', '#80105a'], eyeY: -12, eyeX: 36, mouthY: 34, er: 21, leg: 88, hip: 32, shoe: '#2a2a33', shoe2: '#ff4fa3' },
});
Object.assign(TOPS, { moon: 142, sun: 176, mango: 176, pear: 194, dragon: 192 });

EXT.shape.mango = (p, k) => {
  const { rx, ry } = k;
  p.moveTo(rx * .12, -ry);
  p.bezierCurveTo(rx * .78, -ry * .98, rx * 1.12, -ry * .2, rx * .88, ry * .5);
  p.bezierCurveTo(rx * .6, ry * 1.04, -rx * .5, ry * 1.06, -rx * .88, ry * .45);
  p.bezierCurveTo(-rx * 1.12, -ry * .25, -rx * .5, -ry * 1.0, rx * .12, -ry);
};
EXT.shape.pear = (p, k) => {
  const { rx, ry } = k;
  p.moveTo(0, -ry);
  p.bezierCurveTo(rx * .3, -ry, rx * .44, -ry * .68, rx * .6, -ry * .3);
  p.bezierCurveTo(rx * 1.06, ry * .12, rx * 1.1, ry * .72, rx * .56, ry * .96);
  p.bezierCurveTo(rx * .26, ry * 1.08, -rx * .26, ry * 1.08, -rx * .56, ry * .96);
  p.bezierCurveTo(-rx * 1.1, ry * .72, -rx * 1.06, ry * .12, -rx * .6, -ry * .3);
  p.bezierCurveTo(-rx * .44, -ry * .68, -rx * .3, -ry, 0, -ry);
};

// ---- surfaces
const CRATERS = [[-.60, -.52, .17], [.55, -.55, .13], [.72, .12, .19], [-.74, .18, .12], [-.28, .74, .16], [.38, .70, .12], [.02, -.84, .09], [-.86, -.12, .07], [.20, -.66, .06], [.80, -.28, .07], [-.5, .46, .08]];
EXT.tex.crater = (o, k) => {
  const { rx, ry } = k;
  ctx.fillStyle = 'rgba(120,112,150,.14)';
  ell(-rx * .35, -ry * .1, rx * .5, ry * .36, .5); ctx.fill();
  ell(rx * .5, ry * .35, rx * .42, ry * .3, -.4); ctx.fill();
  for (const [cx, cy, cr] of CRATERS) {
    const x = cx * rx, y = cy * ry, r = cr * rx;
    if (Math.abs(x) < rx * .66 && y > k.eyeY - k.er * 1.9 && y < k.mouthY + 28) continue;
    ctx.fillStyle = 'rgba(130,122,160,.30)'; ell(x, y, r, r * .92); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x, y, r, PI * .95, PI * 1.6); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,62,100,.35)'; ctx.beginPath(); ctx.arc(x, y, r * .86, -.2, PI * .55); ctx.stroke();
  }
};
EXT.tex.sunspot = (o, k) => {
  ctx.fillStyle = 'rgba(255,120,0,.16)';
  for (let i = 0; i < 9; i++) {
    const x = (srand(i) * 2 - 1) * k.rx * .8, y = (srand(i + 40) * 2 - 1) * k.ry * .8;
    if (Math.abs(x) < k.rx * .6 && y > k.eyeY - 50 && y < k.mouthY + 30) continue;
    ell(x, y, 10 + srand(i + 9) * 10, 8 + srand(i + 7) * 8); ctx.fill();
  }
};
EXT.tex.mango = (o, k) => {
  const { rx, ry } = k;
  const g = ctx.createRadialGradient(-rx * .4, -ry * .85, 5, -rx * .3, -ry * .6, rx * .95);
  g.addColorStop(0, 'rgba(140,190,60,.8)'); g.addColorStop(1, 'rgba(140,190,60,0)');
  ctx.fillStyle = g; ctx.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);
  ctx.fillStyle = 'rgba(120,50,10,.30)';
  for (let i = 0; i < 46; i++) {
    const x = (srand(i) * 2 - 1) * rx, y = (srand(i + 90) * 2 - 1) * ry;
    if (Math.hypot(x / (rx * .64), (y - k.eyeY - 20) / (ry * .46)) < 1) continue;
    ell(x, y, 2.2, 2.2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(rx * .52, -ry * .55); ctx.quadraticCurveTo(rx * .78, -ry * .1, rx * .62, ry * .3); ctx.stroke();
};
EXT.tex.pear = (o, k) => {
  const { rx, ry } = k;
  ctx.fillStyle = 'rgba(90,70,20,.5)';
  for (let i = 0; i < 70; i++) {
    const x = (srand(i) * 2 - 1) * rx, y = (srand(i + 70) * 2 - 1) * ry;
    if (Math.hypot(x / (rx * .64), (y - k.eyeY - 20) / (ry * .5)) < 1) continue;
    ell(x, y, 1.7 + srand(i + 3) * 1.2, 1.4); ctx.fill();
  }
  const g = ctx.createLinearGradient(0, ry * .2, 0, ry); g.addColorStop(0, 'rgba(200,120,40,0)'); g.addColorStop(1, 'rgba(200,120,40,.28)');
  ctx.fillStyle = g; ctx.fillRect(-rx * 1.2, ry * .2, rx * 2.4, ry);
};
EXT.tex.dragon = (o, k) => {
  const { rx, ry } = k;
  for (let j = 0; j < 8; j++) {
    const y = -ry * .8 + j * 31;
    for (let i = -4; i <= 4; i++) {
      const x = i * 35 + (j % 2 ? 17 : 0);
      if (Math.hypot(x / (rx * .64), (y - k.eyeY - 14) / (ry * .52)) < 1) continue;
      ctx.beginPath(); ctx.moveTo(x - 10, y + 9); ctx.quadraticCurveTo(x - 2, y - 20, x + 3, y - 15); ctx.quadraticCurveTo(x + 8, y - 4, x + 10, y + 9); ctx.closePath();
      ctx.fillStyle = 'rgba(70,200,110,.9)'; ctx.fill(); ctx.strokeStyle = 'rgba(20,90,50,.7)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
};

// ---- tops: rays, stems, crowns
EXT.top.sun = (o, k, t, layer) => {
  if (layer !== 'back') return;
  const n = 16, spin = t * .3, r0 = k.rx * .9;
  for (let i = 0; i < n; i++) {
    const a = spin + i / n * TAU, long = i % 2 === 0, L = long ? 52 : 32, w = long ? .13 : .1;
    ctx.beginPath(); ctx.moveTo(Math.cos(a - w) * r0, Math.sin(a - w) * r0); ctx.lineTo(Math.cos(a) * (k.rx + L), Math.sin(a) * (k.rx + L)); ctx.lineTo(Math.cos(a + w) * r0, Math.sin(a + w) * r0); ctx.closePath();
    ctx.fillStyle = long ? '#ffb703' : '#ffd24a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
  }
};
EXT.top.mango = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const sx = k.rx * .12, sy = -k.ry;
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx, sy + 6); ctx.quadraticCurveTo(sx + 6, sy - 14, sx - 2, sy - 26); ctx.stroke();
  leaf(sx + 4, sy - 8, .55, 76, 21, '#3f9a3a'); leaf(sx - 2, sy - 6, -.65, 58, 17, '#58b83a');
};
EXT.top.pear = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -k.ry + 6); ctx.quadraticCurveTo(8, -k.ry - 14, -2, -k.ry - 32); ctx.stroke();
  leaf(4, -k.ry - 8, .95, 54, 16, '#58b83a');
};
EXT.top.dragon = (o, k, t, layer) => {
  const g1 = '#3fc46a', g2 = '#2a9d56';
  if (layer === 'back') {
    for (let i = 0; i < 15; i++) {
      const th = -PI - .3 + i / 14 * (PI + .6) + .04 * Math.sin(t * 3 + i), L = 34 + 10 * Math.sin(i * 1.7);
      leaf(Math.cos(th) * k.rx * .94, Math.sin(th) * k.ry * .94, th + PI / 2, L, 13, i % 2 ? g1 : g2, '#145a30');
    }
  } else {
    for (let i = -2; i <= 2; i++) leaf(i * 15, -k.ry * .9, i * .26, 74 - Math.abs(i) * 10, 15, i % 2 ? g1 : g2, '#145a30');
  }
};

// ---- accessories
const bodyClip = (o, k) => ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
EXT.acc.gaitbelt = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); bodyClip(o, k);
  const y0 = k.ry * .38, h = 30, x0 = -k.rx * 1.2, w = k.rx * 2.4;
  ctx.fillStyle = '#f2f1ea'; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = '#2a6fdb'; ctx.fillRect(x0, y0 + 5, w, 4); ctx.fillRect(x0, y0 + h - 9, w, 4);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, w, h);
  ctx.fillStyle = '#c9d2dc'; rr(-34, y0 - 4, 38, h + 8, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
};
EXT.acc.keys = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .68, k.ry * .46); ctx.rotate(Math.sin(t * 2.4 + 1) * .07);
  const cols = ['#d4af37', '#c0c6cf', '#d4af37', '#b87333', '#c0c6cf', '#d4af37', '#c0c6cf'];
  for (let i = 0; i < 7; i++) {
    ctx.save(); ctx.rotate(-1.2 + i * .4); ctx.translate(0, 12);
    ctx.fillStyle = cols[i]; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; rr(-4, 0, 8, 32 + (i % 3) * 6, 3); ctx.fill(); ctx.stroke();
    ell(0, 36 + (i % 3) * 6, 8, 8); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 5; ell(0, 0, 15, 15); ctx.stroke();
  ctx.restore();
};
EXT.acc.newsboy = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const cy = -k.ry * .8;
  ctx.fillStyle = '#6b5b49'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-50, cy + 6); ctx.quadraticCurveTo(-52, cy - 34, -8, cy - 38); ctx.quadraticCurveTo(46, cy - 42, 56, cy - 4); ctx.quadraticCurveTo(0, cy + 14, -50, cy + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-50, cy + 6); ctx.quadraticCurveTo(-74, cy + 4, -82, cy + 18); ctx.quadraticCurveTo(-60, cy + 24, -30, cy + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4e4034'; ell(8, cy - 38, 6, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < 14; i++) { ell(-34 + srand(i) * 78, cy - 30 + srand(i + 5) * 26, 2, 2); ctx.fill(); }
};
EXT.acc.suspenders = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  ctx.save(); bodyClip(o, k);
  ctx.fillStyle = '#4a3b2a'; ctx.fillRect(-k.rx * 1.2, k.ry * .66, k.rx * 2.4, 26);
  ctx.fillStyle = '#d4af37'; rr(-12, k.ry * .66 + 3, 24, 20, 4); ctx.fill();
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 14; ctx.lineCap = 'butt';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * k.rx * .74, -k.ry * .55); ctx.lineTo(sd * k.rx * .74, k.ry * .66); ctx.stroke(); }
  ctx.fillStyle = '#d4af37'; for (const sd of [-1, 1]) { ell(sd * k.rx * .74, k.ry * .62, 8, 8); ctx.fill(); }
  ctx.restore();
};
EXT.acc.unionpin = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .44, k.ry * .36);
  ctx.fillStyle = '#e63946'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ell(0, 0, 15, 15); ctx.fill(); ctx.stroke();
  text('9', 0, 1, { size: 17, font: 'Bangers', weight: 400, fill: '#fff' });
  ctx.restore();
};
EXT.acc.sleepmask = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const y = -k.ry * .64;
  ctx.strokeStyle = '#2b3a67'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * k.rx * .6, y); ctx.quadraticCurveTo(sd * k.rx * .92, y + 4, sd * k.rx * .98, y + 34); ctx.stroke(); }
  ctx.fillStyle = '#2b3a67'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-k.rx * .6, y - 22, k.rx * 1.2, 44, 20); ctx.fill(); ctx.stroke();
  const lk = o.look || [0, 0];
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#fff'; ctx.lineWidth = 2.5; ell(sd * 28, y, 14, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ell(sd * 28 + lk[0] * 4, y + lk[1] * 3, 6, 6); ctx.fill();
  }
};

// ---- props (origin = the hand)
EXT.prop.briefcase = () => {
  ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 6; rr(-16, -2, 32, 18, 6); ctx.stroke();
  ctx.fillStyle = '#8a5a2b'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-52, 12, 104, 66, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#caa24a'; rr(-9, 28, 18, 13, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-48, 17, 96, 6);
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-52, 46); ctx.lineTo(52, 46); ctx.stroke();
  text('LOCAL 9', 0, 62, { size: 14, fill: '#f2e6c8' });
};
EXT.prop.bpcuff = (side, o) => {
  const gl = o.cuffGlow || 0;
  if (gl > 0) glow(0, -52, 150, '255,226,120', .75 * gl);
  ctx.fillStyle = '#2a3f7a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-48, -70, 96, 42, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a62a8'; rr(-40, -64, 80, 11, 5); ctx.fill();
  ctx.fillStyle = '#e6edf7'; ctx.fillRect(-44, -44, 88, 5);
  ctx.strokeStyle = '#15151c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-34, -28); ctx.bezierCurveTo(-64, 8, -22, 32, 8, 12); ctx.stroke();
  ctx.fillStyle = '#15151c'; ell(18, 14, 11, 16); ctx.fill();
  ctx.fillStyle = '#0b0f14'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(14, -62, 30, 18, 4); ctx.fill(); ctx.stroke();
  text(o.cuffText || '', 29, -53, { size: 11, font: 'Bangers', weight: 400, fill: Math.sin(T * 12) > -.2 ? '#ff4040' : '#702020' });
};
EXT.prop.thermos = () => {
  ctx.fillStyle = '#c9d2dc'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-20, -78, 40, 84, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e63946'; ctx.fillRect(-20, -40, 40, 12);
  ctx.fillStyle = '#2b2b33'; rr(-23, -90, 46, 18, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-12, -70, 6, 60);
};
EXT.prop.pillow = () => {
  ctx.fillStyle = '#dfe6ff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-60, -40, 120, 80, 26); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8f9bd6'; ell(-18, -6, 15, 15); ctx.fill(); ctx.fillStyle = '#dfe6ff'; ell(-12, -10, 13, 13); ctx.fill();
  ctx.fillStyle = '#ffe135'; for (const [x, y] of [[20, -14], [38, 10], [8, 18]]) { ell(x, y, 4, 4); ctx.fill(); }
};
EXT.prop.ivbag = () => {
  ctx.fillStyle = 'rgba(200,235,255,.85)'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(-24, -70, 48, 74, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(120,190,240,.7)'; rr(-20, -40, 40, 40, 9); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(-16, -62, 32, 18); text('0.9% NS', 0, -53, { size: 11, fill: '#2a6fdb' });
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ell(0, -78, 8, 8); ctx.stroke();
};
Object.assign(PROP_BOX, {
  briefcase: [-54, -6, 54, 80],
  bpcuff: Object.assign([-62, -100, 62, 40], { nearFace: true }),
  thermos: [-24, -92, 24, 8],
  pillow: [-62, -42, 62, 42],
  ivbag: [-26, -84, 26, 6],
});

// ------------------------------------------------------------------ helpers
function glow(x, y, r, rgb, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function stars(alpha, seed = 0, n = 70, y1 = 700) {
  if (alpha <= 0) return;
  for (let i = 0; i < n; i++) {
    const x = srand(i + seed) * W, y = srand(i + seed + 91) * y1, tw = .5 + .5 * Math.sin(T * (1.5 + srand(i) * 2.5) + i), r = 1.6 + srand(i + 5) * 1.8;
    ctx.fillStyle = `rgba(255,255,240,${alpha * (.35 + .65 * tw)})`; ell(x, y, r, r); ctx.fill();
  }
}

// The Moon: a glow plus a lip-synced face. who: 'moon' (or 'moony' for the shouted line).
function moon(x, y, s = 1, o = {}) {
  const r = KINDS.moon.rx * s;
  glow(x, y, r * 2.6, o.red ? '255,90,70' : '205,222,255', (o.red ? .5 : .5) * (o.glow ?? 1));
  drawChar(Object.assign({ kind: 'moon', id: 'moon', who: 'moon', x, y, s, center: true, noLegs: true, noArms: true, noShadow: true, expr: 'dead' }, o,
    o.red ? { colors: ['#ffb8a8', '#e0322a', '#6a0e12'] } : {}));
}
function sun(x, y, s = 1, o = {}) {
  glow(x, y, KINDS.sun.rx * s * 3, '255,190,80', .55 * (o.glow ?? 1));
  drawChar(Object.assign({ kind: 'sun', id: 'sun', who: 'sun', x, y, s, center: true, noLegs: true, noArms: true, noShadow: true, expr: 'chill', acc: ['sunglasses'] }, o));
}

function archWindow(x, y, w, h, paint, o = {}) {
  const r = w / 2, path = new Path2D();
  path.moveTo(x, y + h); path.lineTo(x, y + r); path.arc(x + r, y + r, r, PI, 0); path.lineTo(x + w, y + h); path.closePath();
  ctx.save(); ctx.clip(path);
  const sk = o.sky || ['#0a0f2e', '#2a3470'], g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  stars(o.stars ?? 1, o.seed || 3, 26, y + h * .8);
  if (paint) paint();
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(x + w * .15, y + h); ctx.lineTo(x + w * .45, y + r * .6); ctx.lineTo(x + w * .6, y + r * .6); ctx.lineTo(x + w * .3, y + h); ctx.fill();
  ctx.restore();
  const fr = o.frame || '#d9d3c4';
  ctx.strokeStyle = fr; ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.stroke(path);
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; ctx.stroke(path);
  ctx.fillStyle = fr; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x - 18, y + h - 2, w + 36, 22, 6); ctx.fill(); ctx.stroke();
}

// ------------------------------------------------------------------ the blame counter
// BASE counts the blames before each scene, INC lists the beats whose end adds one (a tally sound plays there).
const BASE = { title: 0, break: 0, hall: 1, cuff: 2, temple: 2, chase: 2, chart: 4, tally: 6, end: 7, post: 7 };
const INC = { break: ['s4'], hall: ['s4'], chase: ['g1', 's1'], chart: ['s5', 'g2'], tally: ['d2'] };
function blameAt(lt) {
  let n = BASE[CUR.id] || 0, pulse = 0;
  for (const id of INC[CUR.id] || []) {
    const e = CUR.beats[id].e;
    if (lt >= e) { n++; pulse = Math.max(pulse, 1 - (lt - e) / .55); }
  }
  return { n, pulse };
}
function hud(lt, o = {}) {
  const { n, pulse } = blameAt(lt);
  const appear = o.appear ?? 1;
  if (appear <= 0) return;
  const x = 30, y = 22, w = 400, h = 100, cx = x + w / 2, cy = y + h / 2;
  reg('overlay', [x, y, x + w, y + h], { id: 'hud' });
  ctx.save(); ctx.globalAlpha *= clamp(appear * 2);
  const s = easeBack(clamp(appear)) * (1 + .14 * Math.max(0, pulse));
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.fillStyle = 'rgba(8,12,38,.95)'; rr(x, y, w, h, 24); ctx.fill();
  ctx.strokeStyle = pulse > 0 ? '#ffe135' : 'rgba(159,179,200,.75)'; ctx.lineWidth = 4; rr(x, y, w, h, 24); ctx.stroke();
  ctx.fillStyle = '#fffbe6'; ell(x + 52, cy, 31, 31); ctx.fill();
  ctx.fillStyle = 'rgba(130,122,160,.4)'; ell(x + 42, cy - 8, 8, 8); ctx.fill(); ell(x + 63, cy + 10, 6, 6); ctx.fill(); ell(x + 60, cy - 15, 4, 4); ctx.fill();
  text('BLAMED ON THE MOON', x + 100, y + 31, { size: 20, fill: '#9fb3c8', align: 'left', spacing: 1, maxW: 290 });
  text(String(n), x + 100, y + 72, { size: 60, font: 'Bangers', weight: 400, fill: pulse > 0 ? '#ffe135' : '#fff', align: 'left', spacing: 2 });
  ctx.restore();
  if (o.staffing > 0) {
    const bx = 446, bw = 540, a = o.staffing, bs = easeBack(clamp(a));
    reg('overlay', [bx, y, bx + bw, y + h], { id: 'hud2' });
    ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.translate(bx + bw / 2, cy); ctx.scale(bs, bs); ctx.translate(-(bx + bw / 2), -cy);
    ctx.fillStyle = 'rgba(8,12,38,.95)'; rr(bx, y, bw, h, 24); ctx.fill();
    ctx.strokeStyle = '#ff5a6a'; ctx.lineWidth = 4; rr(bx, y, bw, h, 24); ctx.stroke();
    text('ACTUAL CAUSE', bx + 28, y + 31, { size: 20, fill: '#ffb3bb', align: 'left', spacing: 1 });
    text('STAFFING', bx + 28, y + 72, { size: 60, font: 'Bangers', weight: 400, fill: '#ff5a6a', align: 'left', spacing: 3 });
    text(String(o.tally ?? n) + ' / ' + String(n), bx + bw - 28, y + 62, { size: 48, font: 'Bangers', weight: 400, fill: '#fff', align: 'right', spacing: 2 });
    ctx.restore();
  }
}

// ------------------------------------------------------------------ overlays (screen space, all registered)
// The Legend of the Good Cuff: a treasure map across the overlay band. p draws the dotted route from left to right.
function mapCard(p, lt) {
  if (p <= 0) return;
  const x = 90, y = OV + 6, w = 900, h = OV_B - OV - 12;
  reg('overlay', [x, y, x + w, y + h], { id: 'map' });
  ctx.save(); ctx.globalAlpha *= clamp(p * 4);
  const sc = lerp(.9, 1, easeBack(clamp(p * 2))); ctx.translate(540, y + h / 2); ctx.scale(sc, sc); ctx.rotate(lerp(-.03, -.012, clamp(p))); ctx.translate(-540, -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#ead7a2'; ctx.beginPath(); ctx.moveTo(x, y + 10);
  for (let i = 0; i <= 18; i++) ctx.lineTo(x + i * w / 18, y + (i % 2 ? 6 : 0) + srand(i) * 8);
  for (let j = 1; j <= 6; j++) ctx.lineTo(x + w - (j % 2 ? 6 : 0), y + j * h / 6);
  for (let i = 18; i >= 0; i--) ctx.lineTo(x + i * w / 18, y + h - (i % 2 ? 7 : 0) - srand(i + 30) * 8);
  for (let j = 5; j >= 1; j--) ctx.lineTo(x + (j % 2 ? 8 : 0), y + j * h / 6);
  ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
  const g = ctx.createRadialGradient(540, y + h / 2, 120, 540, y + h / 2, 560); g.addColorStop(0, 'rgba(120,80,20,0)'); g.addColorStop(1, 'rgba(120,80,20,.35)');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,30,.55)'; ctx.lineWidth = 3; ctx.stroke();
  text('THE LEGEND OF THE GOOD CUFF', 540, y + 34, { size: 36, font: 'Bangers', weight: 400, fill: '#7a2a10', spacing: 2, maxW: 820 });
  const pts = [[196, y + 168], [360, y + 118], [530, y + 176], [704, y + 120], [878, y + 170]];
  const names = [['YOU ARE HERE', 'down'], ['LINEN CLOSET: empty', 'up'], ['DRYER 2: haunted', 'down'], ['ICE MACHINE: broken', 'up']];
  const total = 4, prog = clamp(p * 1.15) * total;
  ctx.setLineDash([14, 10]); ctx.lineDashOffset = -lt * 30; ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= total; i++) {
    const f = clamp(prog - (i - 1)); if (f <= 0) break;
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    ctx.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 34, ax + (bx - ax) * f, ay + (by - ay) * f);
  }
  ctx.stroke(); ctx.setLineDash([]);
  names.forEach(([nm, pos], i) => {
    if (prog < i) return;
    const [px, py] = pts[i];
    ctx.fillStyle = i === 0 ? '#2a6fdb' : '#7a2a10'; ell(px, py, 11, 11); ctx.fill();
    text(nm, px, py + (pos === 'down' ? 34 : -30), { size: 21, fill: '#4a2a10', italic: true, weight: 800, maxW: 280 });
  });
  if (prog >= 4) {
    const [px, py] = pts[4], k = easeBack(clamp((prog - 4) * 3));
    ctx.save(); ctx.translate(px, py); ctx.scale(k, k); ctx.strokeStyle = '#d62828'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-26, -26); ctx.lineTo(26, 26); ctx.moveTo(26, -26); ctx.lineTo(-26, 26); ctx.stroke(); ctx.restore();
    text('THE GOOD CUFF', px, py + 50, { size: 24, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 1, maxW: 190 });
  }
  ctx.restore();
}

// Close-up of the Good Cuff's screen in the overlay band.
function lcdCard(p, txt, lt) {
  if (p <= 0) return;
  const w = 560, h = 250, x = 260, y = OV + (OV_B - OV - h) / 2;
  reg('overlay', [x, y, x + w, y + h], { id: 'lcd' });
  ctx.save(); ctx.globalAlpha *= clamp(p * 3);
  const sc = lerp(.88, 1, easeBack(clamp(p))); ctx.translate(540, y + h / 2); ctx.scale(sc, sc); ctx.translate(-540, -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#2a3f7a'; rr(x, y, w, h, 30); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(x, y, w, h, 30); ctx.stroke();
  ctx.fillStyle = '#4a62a8'; rr(x + 24, y + 14, w - 48, 14, 7); ctx.fill();
  ctx.fillStyle = '#0b0f14'; rr(x + 28, y + 44, w - 56, h - 80, 14); ctx.fill();
  const on = Math.sin(lt * 9) > -.3;
  text(txt, 540, y + 44 + (h - 80) / 2 + 4, { size: 118, font: 'Bangers', weight: 400, fill: on ? '#ff4040' : '#702020', spacing: 4, maxW: w - 100 });
  text('THE GOOD CUFF', 540, y + h - 18, { size: 24, font: 'Bangers', weight: 400, fill: '#e6edf7', spacing: 2 });
  ctx.restore();
}

// Charting card: typed lines in the overlay band. lines = [name, typedFraction]; expired shows the red error.
function chartCard(lt, lines, o = {}) {
  const x = 90, y = OV + 6, w = 900, h = OV_B - OV - 12;
  const a = o.a ?? 1; if (a <= 0) return;
  reg('overlay', [x, y, x + w, y + h], { id: 'chart' });
  ctx.save(); ctx.globalAlpha *= clamp(a * 3);
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
  ctx.fillStyle = o.expired ? '#3a1018' : '#f4f8ff'; rr(x, y, w, h, 20); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = o.expired ? '#d62828' : '#2a6fdb'; rr(x, y, w, 52, [20, 20, 0, 0]); ctx.fill();
  text(o.expired ? 'SESSION EXPIRED' : 'RESIDENT NOTES: 10:41 PM', 540, y + 28, { size: 34, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2, maxW: 840 });
  if (o.expired) {
    text('37 NOTES NOT SAVED', 540, y + 112, { size: 64, font: 'Bangers', weight: 400, fill: '#ff6b78', spacing: 3, maxW: 820 });
    text('Please log in again. Password: (see overhead page)', 540, y + 190, { size: 26, fill: '#ffd0d4', italic: true, weight: 800, maxW: 820 });
  } else {
    lines.forEach(([name, f], i) => {
      const yy = y + 86 + i * 52, str = 'Resting quietly in bed. No acute distress.', n = Math.floor(str.length * clamp(f));
      if (f <= 0) return;
      text(name, x + 26, yy, { size: 25, fill: '#2a6fdb', align: 'left', weight: 900 });
      text(str.slice(0, n) + (f < 1 && Math.sin(lt * 14) > 0 ? '|' : ''), x + 214, yy, { size: 26, fill: INK, align: 'left', weight: 700, italic: true, maxW: 650 });
    });
  }
  ctx.restore();
}

// ------------------------------------------------------------------ cast constructors
const MANGO_ACC = ['badge', 'gaitbelt', 'keys'];
A.mango = o => Object.assign({ kind: 'mango', id: 'mango', who: 'mango', s: 1.3, y: G, acc: MANGO_ACC, badgeText: 'CNA', expr: 'neutral' }, o);
A.pear = o => Object.assign({ kind: 'pear', id: 'pear', who: 'pear', s: 1.22, y: G, acc: ['newsboy', 'suspenders', 'unionpin'], hold: { l: 'briefcase' }, arms: { l: 'hold', r: 'rest' }, expr: 'neutral' }, o);
A.drag = o => Object.assign({ kind: 'dragon', id: 'drag', who: 'drag', s: 1.3, y: G, acc: ['sleepmask', 'badge'], badgeText: 'NIGHTS', expr: 'chill' }, o);
Object.assign(A, { glow, stars, moon, sun, archWindow, hud, blameAt, mapCard, chartCard, lcdCard });
})();
