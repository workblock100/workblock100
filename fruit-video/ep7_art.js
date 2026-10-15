'use strict';
/* SHIFT HAPPENS, Episode 7 art kit: Activities Director Papaya, Mr. Goji and the Moon at full, a peeled banana, wolf ears, a hospital gown,
 * the bingo card (one drawing, used as a held prop, a HUD pill and a full-screen insert), skies, halos, window light, picture-in-picture
 * phone insets and the iris wipe. Registers through the engine's EXT hooks, so earlier episodes are untouched. Exposed as window.A7. */
(() => {
const A = window.A7 = {};
const A6 = window.A6;
const bodyClip = (o, k) => ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));

// ------------------------------------------------------------------ new fruit
Object.assign(KINDS, {
  papaya: { rx: 106, ry: 136, shape: 'papaya', tex: 'papaya', c: ['#ffe8b0', '#ffa24d', '#b5561b'], eyeY: -26, eyeX: 34, mouthY: 34, er: 21, leg: 88, hip: 32, shoe: '#ffffff', shoe2: '#2ec4b6' },
  goji:   { rx: 74, ry: 94, shape: 'goji', tex: 'goji', c: ['#ffa27a', '#e8461f', '#7c1404'], eyeY: -12, eyeX: 25, mouthY: 28, er: 15, mw: 18, leg: 58, hip: 22, shoe: '#f4f4f4', shoe2: '#8d8d99', arm1: 42, arm2: 38 },
  moon7:  { rx: 150, ry: 150, shape: 'round', tex: 'moon7', c: ['#ffffff', '#f6efd6', '#b7b2d2'], eyeY: -16, eyeX: 55, mouthY: 52, er: 32, mw: 36 },
});
Object.assign(TOPS, { papaya: 162, goji: 120, moon7: 150 });

EXT.shape.papaya = (p, k) => {
  const { rx, ry } = k;
  p.moveTo(0, -ry);
  p.bezierCurveTo(rx * .42, -ry, rx * .68, -ry * .55, rx * .88, -ry * .02);
  p.bezierCurveTo(rx * 1.1, ry * .5, rx * .72, ry, 0, ry);
  p.bezierCurveTo(-rx * .72, ry, -rx * 1.1, ry * .5, -rx * .88, -ry * .02);
  p.bezierCurveTo(-rx * .68, -ry * .55, -rx * .42, -ry, 0, -ry);
};
EXT.shape.goji = (p, k) => {   // a dried goji berry: a plump, slightly lopsided oval
  const { rx, ry } = k;
  p.moveTo(rx * .06, -ry);
  p.bezierCurveTo(rx * .78, -ry * .98, rx * 1.04, -ry * .3, rx * .96, ry * .22);
  p.bezierCurveTo(rx * .88, ry * .86, rx * .4, ry, -rx * .05, ry);
  p.bezierCurveTo(-rx * .62, ry, -rx * 1.04, ry * .6, -rx * .98, -ry * .06);
  p.bezierCurveTo(-rx * .92, -ry * .74, -rx * .5, -ry, rx * .06, -ry);
};

const skipFace = (x, y, k, a = .62, b = .46) => Math.hypot(x / (k.rx * a), (y - k.eyeY - 18) / (k.ry * b)) < 1;
EXT.tex.papaya = (o, k) => {
  const { rx, ry } = k;
  ctx.fillStyle = V2.grad(0, -ry, 0, -ry * .05, [[0, 'rgba(160,196,64,.5)'], [1, 'rgba(160,196,64,0)']]); ctx.fillRect(-rx * 1.2, -ry * 1.1, rx * 2.4, ry * 1.1);
  ctx.strokeStyle = 'rgba(176,80,20,.16)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * rx * .26, -ry * .92); ctx.bezierCurveTo(i * rx * .5, -ry * .2, i * rx * .56, ry * .4, i * rx * .3, ry * .96); ctx.stroke(); }
  for (let i = 0; i < 54; i++) {
    const x = (srand(i + 3) * 2 - 1) * rx, y = (srand(i + 80) * 2 - 1) * ry;
    if (skipFace(x, y, k, .66, .5)) continue;
    ctx.fillStyle = i % 3 ? 'rgba(150,60,10,.2)' : 'rgba(255,240,190,.3)'; ell(x, y, 2.6 + srand(i + 9) * 2.6, 2.2 + srand(i + 4) * 1.6, srand(i) * 3); ctx.fill();
  }
};
EXT.tex.goji = (o, k) => {
  const { rx, ry } = k;
  ctx.lineCap = 'round';
  for (let i = 0; i < 28; i++) {
    const x = (srand(i + 7) * 2 - 1) * rx * .94, y = (srand(i + 40) * 2 - 1) * ry * .94;
    if (skipFace(x, y, k, .7, .54)) continue;
    const a = srand(i + 17) * 2.4 - 1.2, L = 12 + srand(i + 3) * 16;
    ctx.strokeStyle = i % 2 ? 'rgba(110,16,4,.3)' : 'rgba(255,200,170,.22)'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(x - Math.sin(a) * L / 2, y - Math.cos(a) * L / 2); ctx.quadraticCurveTo(x + 6, y, x + Math.sin(a) * L / 2, y + Math.cos(a) * L / 2); ctx.stroke();
  }
};
// the Moon at full: soft maria, a dozen craters with a lit rim on the upper left and a shadowed rim on the lower right
const CRATERS7 = [[-.62, -.38, .15], [-.3, -.72, .1], [.5, -.58, .13], [.74, .02, .09], [.62, .5, .14], [.18, .8, .1], [-.5, .62, .12], [-.78, .12, .08], [.0, -.9, .06], [.34, -.86, .07], [-.86, -.3, .06], [.84, -.36, .05], [-.2, .94, .06], [.94, .3, .05]];
EXT.tex.moon7 = (o, k) => {
  const { rx, ry } = k;
  for (const [cx, cy, r, a] of [[-.42, -.3, .5, .15], [.5, .22, .46, .13], [-.1, .56, .4, .12], [.1, -.62, .3, .1]]) { ctx.fillStyle = `rgba(116,112,150,${a})`; ell(cx * rx, cy * ry, r * rx, r * ry * .8, cx); ctx.fill(); }
  for (const [cx, cy, cr] of CRATERS7) {
    const x = cx * rx, y = cy * ry, r = cr * rx;
    if (Math.abs(x) < rx * .78 && y > k.eyeY - k.er * 1.9 && y < k.mouthY + 26) continue;
    ctx.fillStyle = 'rgba(112,106,146,.26)'; ell(x, y, r, r * .94); ctx.fill();
    ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x, y, r, PI * .92, PI * 1.62); ctx.stroke();
    ctx.strokeStyle = 'rgba(62,56,98,.38)'; ctx.beginPath(); ctx.arc(x, y, r * .9, -.15, PI * .58); ctx.stroke();
  }
};
EXT.top.papaya = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.fillStyle = '#7a5a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(-8, -k.ry - 20, 16, 26, 5); ctx.fill(); ctx.stroke();
  leaf(8, -k.ry - 8, .95, 50, 14, '#58b83a');
};
EXT.top.goji = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.fillStyle = '#5a8a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  for (const a of [-.9, -.3, .3, .9]) { ctx.save(); ctx.translate(k.rx * .06, -k.ry * .98); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(7, -10, 0, -18); ctx.quadraticCurveTo(-7, -10, 0, 0); ctx.fill(); ctx.stroke(); ctx.restore(); }
};

// ------------------------------------------------------------------ costume
EXT.acc.visor = (o, k, t, layer) => {   // Activities Director: a teal sun visor, a little too cheerful
  if (layer !== 'front') return;
  const y0 = k.eyeY - k.er * 2.9, w = k.rx * .88;
  ctx.fillStyle = '#17b3a3'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-w, y0 + 6); ctx.quadraticCurveTo(0, y0 - 26, w, y0 + 6); ctx.lineTo(w * .95, y0 + 26); ctx.quadraticCurveTo(0, y0 - 2, -w * .95, y0 + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, y0 + 14, 0, y0 + 40, [[0, '#4fe3d2'], [1, '#17b3a3']]);
  ctx.beginPath(); ctx.moveTo(-w * .95, y0 + 26); ctx.quadraticCurveTo(0, y0 - 2, w * .95, y0 + 26); ctx.quadraticCurveTo(w * .5, y0 + 44, 0, y0 + 46); ctx.quadraticCurveTo(-w * .5, y0 + 44, -w * .95, y0 + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  text('FUN', 0, y0 + 12, { size: 20, fill: '#ffffff', weight: 900, spacing: 3 });
};
EXT.acc.wolfears = (o, k, t, layer) => {   // two grey ears folded from a dinner napkin, held on with a bandage
  if (layer !== 'back') return;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * k.rx * .5, -k.ry * .86); ctx.rotate(s * .38);
    ctx.fillStyle = '#9a9aa8'; ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-26, 8); ctx.lineTo(-6, -58); ctx.quadraticCurveTo(2, -66, 10, -56); ctx.lineTo(28, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2b5c6'; ctx.beginPath(); ctx.moveTo(-14, 4); ctx.lineTo(-2, -40); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -2); ctx.lineTo(-6, -44); ctx.stroke();
    ctx.restore();
  }
};
EXT.acc.gown = (o, k, t, layer) => {   // a hospital gown: pale blue, tiny diamonds, a V neck and a loose tie
  if (layer !== 'mid') return;
  ctx.save(); bodyClip(o, k);
  const top = k.mouthY + 26;
  ctx.fillStyle = V2.grad(0, top, 0, k.ry, [[0, '#cfe4f2'], [1, '#9cbfd8']]);
  ctx.beginPath(); ctx.moveTo(-k.rx * 1.2, top + 8); ctx.lineTo(-20, top); ctx.lineTo(0, top + 36); ctx.lineTo(20, top); ctx.lineTo(k.rx * 1.2, top + 8); ctx.lineTo(k.rx * 1.2, k.ry * 1.2); ctx.lineTo(-k.rx * 1.2, k.ry * 1.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(70,110,160,.4)';
  for (let y = top + 22; y < k.ry * 1.1; y += 20) for (let x = -k.rx * 1.1 + ((y / 20) % 2) * 10; x < k.rx * 1.1; x += 20) { ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = 'rgba(30,50,80,.55)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20, top); ctx.lineTo(0, top + 36); ctx.lineTo(20, top); ctx.stroke();
  ctx.strokeStyle = '#7fa6c4'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, top + 36); ctx.quadraticCurveTo(14, top + 52, 6, top + 70); ctx.stroke();
  ctx.restore();
};
EXT.acc.nightcap = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const y = -k.ry * .78, sw = Math.sin(t * 2.2) * 5;
  ctx.save(); ctx.translate(0, y);
  ctx.fillStyle = '#e8e8f4'; ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(-k.rx * .8, 10); ctx.quadraticCurveTo(-k.rx * .7, -60, -20 + sw, -108); ctx.quadraticCurveTo(10 + sw, -150, 54 + sw, -112); ctx.quadraticCurveTo(k.rx * .62, -52, k.rx * .8, 10); ctx.quadraticCurveTo(0, 36, -k.rx * .8, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = '#4a5ad6'; ctx.lineWidth = 12; for (let i = -2; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-k.rx, 8 - i * 26); ctx.quadraticCurveTo(0, 30 - i * 26, k.rx, 8 - i * 26); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = '#fff'; ell(54 + sw, -118, 14, 14); ctx.fill(); ctx.stroke();
  ctx.restore();
};
EXT.acc.gaitbelt7 = (o, k, t, layer) => {   // the same belt as Episodes 5 and 6, worn at the waist so an open mouth (down to about .8 ry) is never behind it
  if (layer !== 'front') return;
  ctx.save(); bodyClip(o, k);
  const y0 = k.ry * .7, h = 26, x0 = -k.rx * 1.2, w = k.rx * 2.4;
  ctx.fillStyle = '#f2f1ea'; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = '#2a6fdb'; ctx.fillRect(x0, y0 + 4, w, 4); ctx.fillRect(x0, y0 + h - 8, w, 4);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, w, h);
  ctx.fillStyle = '#c9d2dc'; rr(-34, y0 - 4, 38, h + 8, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
};
EXT.acc.badge7 = (o, k, t, layer) => {   // the ID badge from the engine, hung lower on the chest so a wide-open eye never touches its corner
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(k.rx * .58, k.ry * .26); ctx.rotate(.08);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-22, -14, 44, 56, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ctx.fillRect(-16, -8, 32, 22);
  const bt = o.badgeText || 'NURSE';
  text(bt, 0, 28, { size: bt.length > 6 ? 8 : 10, fill: INK, maxW: 40 });
  ctx.restore();
};
EXT.acc.keys7 = (o, k, t, layer) => {   // the key ring, hung from the waist belt
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .68, k.ry * .76); ctx.rotate(Math.sin(t * 2.4 + 1) * .07);
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
EXT.acc.peeled = (o, k, t, layer) => {   // Mr. Banana, mid-escape: cream fruit down to the hip, three strips of peel streaming behind
  if (layer !== 'mid') return;
  const open = o.peelOpen ?? 1, N = 30, cxOf = u => k.rx * .5 * Math.sin(PI * u) - k.rx * .1, hwOf = u => (k.rx * .78 * Math.pow(Math.sin(PI * u), .5) + 7) * .62;
  const yEnd = lerp(-k.ry * .86, k.ry * .16, open), uEnd = (yEnd + k.ry) / (2 * k.ry);
  ctx.save(); bodyClip(o, k);
  ctx.fillStyle = V2.grad(0, -k.ry, 0, yEnd, [[0, '#fffbe4'], [.7, '#fff2c0'], [1, '#f2dc98']]); ctx.fillRect(-k.rx * 1.3, -k.ry * 1.1, k.rx * 2.6, yEnd + k.ry * 1.1);
  ctx.strokeStyle = 'rgba(190,150,60,.28)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const f of [-.55, -.2, .2, .55]) { ctx.beginPath(); for (let i = 0; i <= N; i++) { const u = i / N; if (u * 2 * k.ry - k.ry > yEnd) break; const y = -k.ry + 2 * k.ry * u, x = cxOf(u) + hwOf(u) * f; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(120,80,20,.4)'; for (let i = 0; i < 9; i++) { const u = .08 + i * .06; ell(cxOf(u) + (i % 2 ? 6 : -6), -k.ry + 2 * k.ry * u, 2.4, 2.4); ctx.fill(); }
  ctx.restore();
  // the strips: each hangs from the edge of the peel line and trails away from the direction of travel
  const sw = Math.sin(t * 9) * .12 + (o.vx || 0) * -.00018;
  const strip = (x0, y0, ang, len, w) => {
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang + sw);
    ctx.fillStyle = V2.grad(-w / 2, 0, w / 2, 0, [[0, '#ffe55a'], [.5, '#ffd23f'], [1, '#d9a400']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(-w * .62, len * .5, -w * .12, len); ctx.quadraticCurveTo(0, len + 14, w * .12, len); ctx.quadraticCurveTo(w * .62, len * .5, w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a4a12'; ctx.beginPath(); ctx.moveTo(-w * .14, len - 8); ctx.quadraticCurveTo(0, len + 18, w * .14, len - 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(160,110,0,.35)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, len - 10); ctx.stroke();
    ctx.restore();
  };
  const L = lerp(30, 104, open);
  strip(cxOf(uEnd) - hwOf(uEnd) * .94, yEnd, .66, L, 36); strip(cxOf(uEnd) + hwOf(uEnd) * .94, yEnd, -.7, L, 36); strip(cxOf(uEnd), yEnd + 2, .06, L * .86, 40);
};

// ------------------------------------------------------------------ props
Object.assign(PROP_BOX, { mic7: Object.assign([-16, -62, 16, 10], { nearFace: true }), dauber: [-18, -62, 18, 22], card7: Object.assign([-6, -128, 98, 10], { mirror: true }), thermo7: [-26, -90, 26, 18] });
EXT.prop.mic7 = (side, o, t) => {   // the engine's microphone, registered as held near the face
  ctx.fillStyle = '#2b2b33'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-7, -30, 14, 38, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9aa3ad'; ell(0, -44, 15, 17); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-12, -44 + i * 7); ctx.lineTo(12, -44 + i * 7); ctx.stroke(); }
};
EXT.prop.dauber = (side, o, t) => {   // a bingo dauber: fat bottle, foam tip, a splash of ink on the label
  ctx.save(); ctx.rotate(side * -.1);
  ctx.fillStyle = V2.grad(-14, 0, 14, 0, [[0, '#ff7ac8'], [1, '#c0207f']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; rr(-14, -34, 28, 52, 9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; rr(-11, -18, 22, 18, 3); ctx.fill(); ctx.fillStyle = '#c0207f'; ell(-2, -9, 5, 4); ctx.fill();
  ctx.fillStyle = '#f2f2f6'; rr(-9, -50, 18, 20, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff7ac8'; ell(0, -54, 11, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
};
EXT.prop.card7 = (side, o, t) => {   // a bingo card gripped by its lower edge, rising away from the body so the hand never covers the grid
  ctx.save(); ctx.rotate(side * -.08); ctx.scale(side, 1);
  A.drawCard(-4, -126, 98, 128, o.cardMarks || [], { mini: true, now: o.cardNow, frame: 'rgba(25,16,30,.9)' });
  ctx.restore();
};

// ------------------------------------------------------------------ constructors
A.papaya = o => Object.assign({ kind: 'papaya', id: 'papaya', who: 'papa', s: SC, y: G, acc: ['visor', 'lanyard'], expr: 'happy', seed: 61 }, o);
A.goji = o => Object.assign({ kind: 'goji', id: 'goji', who: 'goji', s: SC, y: G, acc: ['wolfears', 'gown'], expr: 'neutral', browColor: '#f2f2f2', browW: 11, seed: 67 }, o);
A.pear = A6.pear;
A.mango = o => A6.mango(Object.assign({ acc: ['badge7', 'gaitbelt7', 'keys7'] }, o));
A.straw = o => { const r = A6.straw(o); r.y += 8.9 * (r.s || 1); return r; };   // soles on the floor point: the contact shadow and the reflection now touch her shoes
A.lemon = o => Object.assign({ kind: 'lemon', id: 'lemon', who: 'lemon', s: SC, y: G, acc: ['readers', 'lanyard'], expr: 'neutral' }, o);
A.cran = o => Object.assign({ kind: 'cran', id: 'cran', who: 'cran', s: SC, y: G, acc: ['curlers', 'glasses'], expr: 'happy' }, o);
A.banana = o => Object.assign({ kind: 'banana', id: 'banana', who: 'banana', s: SC, y: G, acc: [], expr: 'happy' }, o);
A.pine = o => Object.assign({ kind: 'pine', id: 'pine', who: 'pinephone', s: SC, y: G, acc: ['chain'], expr: 'neutral' }, o);
A.apple = o => Object.assign({ kind: 'apple', id: 'apple', who: 'apple', s: SC, y: G, acc: ['nightcap'], expr: 'dead', lid: .8 }, o);
A.drag = o => Object.assign({ kind: 'dragon', id: 'drag', who: 'drag', s: SC, y: G, acc: ['sleepmask', 'badge'], badgeText: 'NIGHTS', expr: 'chill' }, o);

// ------------------------------------------------------------------ the Moon, at full
// a lit disc with a face: the flat light makes it glow from within instead of being modeled by the room's key
A.moon = (x, y, s = 1, o = {}) => {
  const r = KINDS.moon7.rx * s, a = o.alpha ?? 1;
  if (o.halo !== false) A.halo(x, y, r, { a: a * (o.haloA ?? 1), warm: o.warm ?? 0, t: o.t ?? T });
  const keep = Object.assign({}, V2.LIGHT);
  V2.setLight({ key: [0, 0], keyA: 0, rimA: 0, shadowA: .12, shadow: '#7a76a8', bounceA: 0, ambA: 0 });
  if (o.suppress) REG.suppress++;
  drawChar(Object.assign({ kind: 'moon7', id: 'moon', who: 'moon', x, y, s, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, expr: 'neutral', alpha: a }, o.warm ? { colors: [lerpC('#ffffff', '#ffd9a0', o.warm), lerpC('#f6efd6', '#ffb35a', o.warm), lerpC('#b7b2d2', '#a8581e', o.warm)] } : {}, o.char || {}));
  if (o.suppress) REG.suppress--;
  Object.assign(V2.LIGHT, keep);
};
function lerpC(a, b, k) { return V2.rgba(V2.mix(a, b, k), 1); }
A.lerpC = lerpC;
// the glow around the Moon: a hot core, a wide bloom and the 22 degree ring that ice crystals make in thin cloud
A.halo = (x, y, r, o = {}) => {
  const a = o.a ?? 1, w = o.warm ?? 0, col = V2.mix('205,222,255', '255,180,110', w).map(v => v | 0).join(',');
  V2.glow(x, y, r * 3.6, col, .5 * a, 'screen', .8);
  V2.glow(x, y, r * 1.9, col, .42 * a, 'screen', .5);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const R = r * 2.55, wd = r * .5;
  const g = ctx.createRadialGradient(x, y, R - wd, x, y, R + wd);
  g.addColorStop(0, 'rgba(255,120,120,0)'); g.addColorStop(.3, `rgba(255,150,120,${.11 * a})`); g.addColorStop(.5, `rgba(255,236,170,${.14 * a})`); g.addColorStop(.7, `rgba(140,230,190,${.1 * a})`); g.addColorStop(.85, `rgba(120,160,255,${.1 * a})`); g.addColorStop(1, 'rgba(120,160,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R + wd, 0, TAU); ctx.fill();
  ctx.restore();
};
// soft rays fanning out from a bright point
A.rays = (x, y, r0, r1, t, o = {}) => {
  const { n = 14, color = '210,225,255', a = .12, spin = .02 } = o;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, y);
  for (let i = 0; i < n; i++) {
    const ang = i / n * TAU + t * spin + hash(i) * .4, len = lerp(r0 * 1.4, r1, hash(i + 9)), w = .05 + hash(i + 3) * .08;
    ctx.fillStyle = V2.grad(Math.cos(ang) * r0, Math.sin(ang) * r0, Math.cos(ang) * len, Math.sin(ang) * len, [[0, V2.rgba(color, a * (.6 + .4 * hash(i + 5)))], [1, V2.rgba(color, 0)]]);
    ctx.beginPath(); ctx.moveTo(Math.cos(ang - w * .3) * r0, Math.sin(ang - w * .3) * r0); ctx.lineTo(Math.cos(ang - w) * len, Math.sin(ang - w) * len); ctx.lineTo(Math.cos(ang + w) * len, Math.sin(ang + w) * len); ctx.lineTo(Math.cos(ang + w * .3) * r0, Math.sin(ang + w * .3) * r0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
};

// ------------------------------------------------------------------ skies
A.stars = (t, y1 = 900, o = {}) => {
  const { n = 90, a = 1, seed = 0 } = o;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = hash(i + seed) * W, y = hash(i + seed + 70) * y1, tw = .5 + .5 * Math.sin(t * (1.2 + hash(i + 5) * 2.4) + i), r = 1.3 + hash(i + 9) * 2.0;
    ctx.fillStyle = `rgba(255,252,235,${a * (.28 + .72 * tw) * (1 - y / y1 * .6)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
};
// layered clouds: each is a cluster of soft puffs, drifting at its own speed, lit from above (tint) with a shaded belly (belly)
A.clouds = (t, y0, y1, o = {}) => {
  const { n = 7, tint = '255,255,255', belly = '150,170,205', a = .8, speed = 14, seed = 0, scale = 1 } = o;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const sp = speed * (.5 + hash(i + seed + 3)), w = (420 + 420 * hash(i + seed)) * scale, span = W + w * 2, x = (((hash(i + seed + 11) * span + t * sp) % span) + span) % span - w, y = lerp(y0, y1, hash(i + seed + 21)), h = w * (.2 + .08 * hash(i + seed + 7));
    const puffs = [];
    for (let j = 0; j < 9; j++) { const u = j / 8; puffs.push([x + (u - .5) * w * .95, y - Math.sin(u * PI) * h * .55 * (.7 + .3 * hash(i * 9 + j)) + Math.sin(j * 2.3 + i) * h * .12, h * (.55 + .5 * Math.sin(u * PI) * (.7 + .3 * hash(i + j + 4)))]); }
    for (const [cx, cy, r] of puffs) {   // the shaded belly first, a little lower than the puffs
      ctx.fillStyle = V2.radial(cx, cy + r * .35, r * .1, r * 1.05, [[0, V2.rgba(belly, a * .85)], [.6, V2.rgba(belly, a * .5)], [1, V2.rgba(belly, 0)]]); ctx.beginPath(); ctx.arc(cx, cy + r * .3, r * 1.05, 0, TAU); ctx.fill();
    }
    for (const [cx, cy, r] of puffs) {   // then the sunlit tops
      ctx.fillStyle = V2.radial(cx - r * .2, cy - r * .3, r * .1, r, [[0, V2.rgba(tint, a)], [.62, V2.rgba(tint, a * .8)], [1, V2.rgba(tint, 0)]]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
};
// a few birds crossing the sky, each a pair of flapping wings
A.birds = (t, y0, y1, o = {}) => {
  const { n = 5, color = 'rgba(40,44,70,.7)', speed = 60, seed = 0, size = 1 } = o;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3.4 * size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const sp = speed * (.7 + .6 * hash(i + seed)), x = (((hash(i + seed + 3) * (W + 400) + t * sp) % (W + 400)) + W + 400) % (W + 400) - 200, y = lerp(y0, y1, hash(i + seed + 9)) + Math.sin(t * 1.3 + i * 2) * 16, fl = Math.sin(t * (7 + 3 * hash(i + seed)) + i * 1.7), sc = (.8 + .5 * hash(i + seed + 5)) * size;
    ctx.beginPath(); ctx.moveTo(x - 26 * sc, y - 10 * sc * fl - 4 * sc); ctx.quadraticCurveTo(x - 12 * sc, y - 18 * sc * fl, x, y); ctx.quadraticCurveTo(x + 12 * sc, y - 18 * sc * fl, x + 26 * sc, y - 10 * sc * fl - 4 * sc); ctx.stroke();
  }
  ctx.restore();
};

// ------------------------------------------------------------------ window light on a floor or wall: a lit window shape with mullions, in perspective
// corners: four [x, y] screen points of the patch (near-left, near-right, far-right, far-left); the mullions are drawn as dark bars
A.gobo = (pts, o = {}) => {
  const { color = '190,215,255', a = .3, mull = 2, bars = 1 } = o;
  if (!o.core) {   // a wide soft copy first: the penumbra of a light that is not a point
    const cx0 = pts.reduce((m, p) => m + p[0], 0) / pts.length, cy0 = pts.reduce((m, p) => m + p[1], 0) / pts.length;
    A.gobo(pts.map(([x, y]) => [cx0 + (x - cx0) * 1.12, cy0 + (y - cy0) * 1.35]), Object.assign({}, o, { core: true, a: a * .45, bars: 0 }));
  }
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  const cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2, R = Math.hypot(pts[0][0] - pts[2][0], pts[0][1] - pts[2][1]) / 2;
  ctx.fillStyle = V2.radial(cx, cy, R * .1, R * 1.05, [[0, V2.rgba(color, a)], [1, V2.rgba(color, a * .35)]]); ctx.fill();
  ctx.clip(); ctx.globalCompositeOperation = 'multiply';
  const lerp2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
  ctx.strokeStyle = 'rgba(120,130,190,.8)'; ctx.lineWidth = Math.max(4, R * .06); ctx.lineCap = 'butt';
  if (bars) for (let i = 1; i < mull; i++) { const u = i / mull, a0 = lerp2(pts[0], pts[1], u), b0 = lerp2(pts[3], pts[2], u); ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...b0); ctx.stroke(); }
  if (bars) { const a0 = lerp2(pts[0], pts[3], .5), b0 = lerp2(pts[1], pts[2], .5); ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...b0); ctx.stroke(); }
  ctx.restore();
};

// ------------------------------------------------------------------ the bingo card
const CARD = ['LEAVES', 'HOWLS', 'PEELED', 'CHAIR ALARM', 'SOCK CALL', 'UTI', 'Q WORD', 'CALL LIGHTS', 'PUMP BEEPS', 'BED ALARM', 'WANDERS', 'SUNDOWN', 'BREAK', 'SPILL', 'NEW ADMIT',
  'DOC CALLS', 'NO GLOVES', 'AGENCY NO-SHOW', 'FALL RISK', 'CODE GREY', 'PAPERWORK', 'LOUD TV', 'STAT LAB', 'MYSTERY SMELL', 'EVERYONE AT ONCE'];
A.CARD = CARD;
const HDR = [['B', '#4a8af0'], ['I', '#ff5a6a'], ['N', '#ffc928'], ['G', '#3fc47a'], ['O', '#b06af0']];
// when each square gets its dauber, in absolute episode time (so a card in one scene shows what happened in the scenes before)
const DAB_CHAOS = [7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
A.dabs = () => {
  if (A._dabs) return A._dabs;
  const sc = id => TL.scenes.find(s => s.id === id), at = (id, b, off) => sc(id).start + sc(id).beats[b].s + off;
  const d = [[3, at('bingo', 'd1', .1)], [0, at('bingo', 'd2', .1)], [4, at('bingo', 'd3', .1)], [2, at('bingo', 'g2', -.05)], [1, at('howl', 'd5', .1)], [5, at('howl', 'd5', .5)], [6, at('quiet', 'freeze', .15)]];
  DAB_CHAOS.forEach((i, j) => d.push([i, at('quiet', 'chaos', 1.0 + j * .4)]));
  return A._dabs = d.map(([i, t]) => ({ i, t }));
};
A.marks = t => A.dabs().filter(d => t >= d.t).map(d => ({ i: d.i, age: t - d.t }));
A.markCount = t => A.dabs().filter(d => t >= d.t).length;
// one dauber blot: an irregular, slightly translucent disc with a bright spot, popping in with a little overshoot
function blot(x, y, r, seed, age, col = '#d6389a') {
  const k = easeBack(clamp(age / .16));
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.beginPath();
  for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, rr2 = r * (1 + .07 * Math.sin(a * 3 + seed) + .05 * Math.sin(a * 5 + seed * 2)); i ? ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2) : ctx.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  ctx.closePath();
  ctx.fillStyle = V2.grad(-r, -r, r, r, [[0, 'rgba(255,120,200,.82)'], [1, 'rgba(176,30,120,.82)']]); ctx.fill();
  ctx.strokeStyle = 'rgba(120,10,80,.55)'; ctx.lineWidth = Math.max(1.5, r * .06); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(-r * .32, -r * .36, r * .22, r * .12, -.6); ctx.fill();
  ctx.restore();
}
// drawCard(x, y, w, h, marks, opts): marks is [{i, age}] (or indexes). opts.mini = no words; opts.hi = squares to ring; opts.free = free square state
A.drawCard = (x, y, w, h, marks = [], o = {}) => {
  const set = new Map(marks.map(m => typeof m === 'number' ? [m, { i: m, age: 9 }] : [m.i, m]));
  const mini = !!o.mini, titleH = mini ? h * .1 : h * .06, hdrH = mini ? h * .12 : h * .1, gx = x + w * .04, gw = w * .92, gy = y + titleH + hdrH, gh = h - titleH - hdrH - h * .035, cw = gw / 5, ch = gh / 5;
  ctx.save();
  if (!o.noShadow) { ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = mini ? 8 : 30; ctx.shadowOffsetY = mini ? 3 : 12; }
  ctx.fillStyle = V2.grad(x, y, x + w, y + h, [[0, '#fffdf2'], [1, '#f1e8cf']]); rr(x, y, w, h, mini ? 6 : 26); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = o.frame || 'rgba(60,40,70,.85)'; ctx.lineWidth = mini ? 2.4 : 5; rr(x, y, w, h, mini ? 6 : 26); ctx.stroke();
  // title strip
  if (!mini) { text('FULL MOON BINGO', x + w / 2, y + titleH / 2 + 2, { size: Math.round(titleH * .56), font: 'Bangers', weight: 400, fill: '#3a2a6a', spacing: 3 }); }
  // B I N G O
  HDR.forEach(([ch2, c], i) => {
    const cx = gx + (i + .5) * cw, cy = y + titleH + hdrH / 2;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, Math.min(cw, hdrH) * .42, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = mini ? 1.6 : 4; ctx.stroke();
    text(ch2, cx, cy + (mini ? 1 : 3), { size: Math.round(Math.min(cw, hdrH) * .6), font: 'Bangers', weight: 400, fill: '#fff', lw: mini ? 0 : 6, stroke: 'rgba(25,16,30,.7)' });
  });
  // cells
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const i = r * 5 + c, cx0 = gx + c * cw, cy0 = gy + r * ch, free = i === 12;
    ctx.fillStyle = free ? V2.grad(cx0, cy0, cx0 + cw, cy0 + ch, [[0, '#ffe08a'], [1, '#ffb83a']]) : '#ffffff'; rr(cx0 + 2, cy0 + 2, cw - 4, ch - 4, mini ? 2 : 12); ctx.fill();
    ctx.strokeStyle = 'rgba(60,50,80,.5)'; ctx.lineWidth = mini ? 1 : 2.4; rr(cx0 + 2, cy0 + 2, cw - 4, ch - 4, mini ? 2 : 12); ctx.stroke();
    const hot = o.hi && o.hi.includes(i), pulse = .5 + .5 * Math.sin((o.t ?? T) * 7);
    if (hot && !mini) { ctx.fillStyle = `rgba(255,224,70,${.16 + .14 * pulse})`; rr(cx0 - 6, cy0 - 6, cw + 12, ch + 12, 18); ctx.fill(); V2.glow(cx0 + cw / 2, cy0 + ch / 2, cw * 1.1, '255,224,90', .22 + .16 * pulse, 'screen', .3); }
    if (!mini) {
      const lab = CARD[i], parts = lab.length > 9 && lab.includes(' ') ? [lab.split(' ')[0], lab.split(' ').slice(1).join(' ')] : [lab];
      ctx.fillStyle = free ? '#7a3a00' : '#2a2448';
      ctx.font = '900 30px Nunito'; const fitK = Math.min(1, ...parts.map(p => (cw - 18) / ctx.measureText(p).width)), fs0 = Math.max(16, Math.floor(30 * fitK));
      parts.forEach((p, j) => text(p, cx0 + cw / 2, cy0 + ch * (parts.length > 1 ? .62 + (j - .5) * .17 : .72), { size: fs0, fill: free ? '#7a3a00' : '#2a2448', weight: 900 }));
      if (A.icon) A.icon(i, cx0 + cw / 2, cy0 + ch * .3, Math.min(cw, ch) * .22, o.t ?? T);
    } else if (free) { ctx.fillStyle = '#b0610a'; ell(cx0 + cw / 2, cy0 + ch / 2, cw * .22, ch * .22); ctx.fill(); }
    const m = set.get(i);
    if (m) blot(cx0 + cw / 2, cy0 + ch / 2, Math.min(cw, ch) * (mini ? .36 : .42), i * 1.7, m.age);
    if (hot) {
      ctx.strokeStyle = `rgba(255,214,40,${.8 + .2 * pulse})`; ctx.lineWidth = mini ? 2.4 : 9; rr(cx0 - 3, cy0 - 3, cw + 6, ch + 6, mini ? 3 : 16); ctx.stroke();
    }
  }
  ctx.restore();
  return { gx, gy, cw, ch };
};
// small glyphs for the squares the story is about
A.icon = (i, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, r * .16);
  if (i === 0) {   // a door, ajar, with a little runner's motion
    ctx.fillStyle = '#c47a52'; rr(-r * .62, -r, r * 1.24, r * 2, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.moveTo(r * .62, -r); ctx.lineTo(r * 1.15, -r * .8); ctx.lineTo(r * 1.15, r * .8); ctx.lineTo(r * .62, r); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (i === 1) {   // the Moon
    ctx.fillStyle = '#f6efd6'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(116,112,150,.4)'; ell(-r * .3, -r * .2, r * .22, r * .2); ctx.fill(); ell(r * .3, r * .3, r * .16, r * .14); ctx.fill();
  } else if (i === 2) {   // a banana
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-r, -r * .2); ctx.quadraticCurveTo(0, r * 1.3, r, -r * .8); ctx.quadraticCurveTo(r * .1, r * .5, -r, -r * .2); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (i === 3 || i === 7 || i === 9) {   // a bell
    ctx.fillStyle = '#ffb83a'; ctx.beginPath(); ctx.moveTo(-r * .8, r * .55); ctx.quadraticCurveTo(-r * .8, -r * .8, 0, -r * .8); ctx.quadraticCurveTo(r * .8, -r * .8, r * .8, r * .55); ctx.closePath(); ctx.fill(); ctx.stroke(); ell(0, r * .78, r * .22, r * .18); ctx.fill();
  } else if (i === 4) {   // a sock
    ctx.fillStyle = '#7ad0ff'; ctx.beginPath(); ctx.moveTo(-r * .5, -r); ctx.lineTo(r * .4, -r); ctx.lineTo(r * .4, r * .1); ctx.quadraticCurveTo(r * 1.1, r * .3, r * .7, r * .9); ctx.lineTo(-r * .3, r * .9); ctx.quadraticCurveTo(-r * .6, r * .5, -r * .5, -r); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-r * .5, -r, r * .9, r * .3);
  } else if (i === 5) {   // a specimen cup
    ctx.fillStyle = 'rgba(255,230,100,.85)'; ctx.beginPath(); ctx.moveTo(-r * .6, -r * .8); ctx.lineTo(r * .6, -r * .8); ctx.lineTo(r * .45, r); ctx.lineTo(-r * .45, r); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8e8f0'; rr(-r * .68, -r, r * 1.36, r * .34, 3); ctx.fill(); ctx.stroke();
  } else if (i === 6) {   // the Q word, crossed out
    text('Q', 0, 2, { size: r * 2.2, font: 'Bangers', weight: 400, fill: '#e8193a', lw: 0 });
    ctx.strokeStyle = '#e8193a'; ctx.lineWidth = r * .22; ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, TAU); ctx.moveTo(-r * .74, r * .74); ctx.lineTo(r * .74, -r * .74); ctx.stroke();
  } else if (i === 12) {   // a coffee cup, steaming
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-r * .8, -r * .2); ctx.lineTo(r * .8, -r * .2); ctx.lineTo(r * .6, r * .9); ctx.lineTo(-r * .6, r * .9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(r * .9, r * .2, r * .34, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,80,40,.6)'; for (const dx of [-.3, .2]) { ctx.beginPath(); ctx.moveTo(dx * r, -r * .4); ctx.bezierCurveTo(dx * r + 8, -r * .7 + Math.sin(t * 3 + dx * 9) * 4, dx * r - 8, -r * 1.0, dx * r + 2, -r * 1.3); ctx.stroke(); }
  }
  ctx.restore();
};

// the card as a HUD pill (same slot as Episode 6's alarm counter): a 5 by 5 grid of dots on the left, the count on the right
A.cardHud = (t, o = {}) => {
  const { appear = 1, label = 'BINGO CARD' } = o, marks = A.marks(t), n = marks.length;
  if (appear <= 0) return;
  const x = 520, y = 128, w = 512, h = 112, s = easeBack(clamp(appear)), cx = x + w / 2, cy = y + h / 2;
  reg('overlay', [x, y, x + w, y + h], { id: 'hud-card' });
  ctx.save(); ctx.globalAlpha *= clamp(appear * 2); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = 'rgba(10,8,22,.9)'; rr(x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  const full = n >= 24;
  ctx.strokeStyle = full ? 'rgba(255,224,70,.95)' : 'rgba(214,56,154,.9)'; ctx.lineWidth = 4; rr(x, y, w, h, 28); ctx.stroke();
  const gx = x + 26, gy = y + 18, d = 15.5;
  const lit = new Map(marks.map(m => [m.i, m.age]));
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const i = r * 5 + c, px = gx + c * d * 1.2 + d / 2, py = gy + r * d * 1.2 + d / 2, a = lit.get(i);
    ctx.fillStyle = i === 12 ? (full ? 'rgba(255,224,70,.55)' : 'rgba(255,184,58,.5)') : a != null ? '#ff5ab8' : 'rgba(255,255,255,.16)';
    ctx.beginPath(); ctx.arc(px, py, d * .46 * (a != null && a < .2 ? 1 + (1 - a / .2) * .6 : 1), 0, TAU); ctx.fill();
    if (i === 12 && !full) { ctx.strokeStyle = 'rgba(255,224,70,' + (.4 + .4 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, d * .62, 0, TAU); ctx.stroke(); }
  }
  text(label, x + 130, y + 32, { size: 21, fill: '#ffb8e0', align: 'left', spacing: 2 });
  text(String(n), x + 130, y + 82, { size: 64, font: 'Bangers', weight: 400, fill: '#fff', align: 'left', spacing: 2 });
  ctx.font = '400 64px Bangers'; const wN = ctx.measureText(String(n)).width + 2 * String(n).length;
  text('/ 24', x + 130 + wN + 12, y + 84, { size: 30, fill: '#c89ad8', align: 'left', spacing: 1 });
  if (n >= 23 && !o.noBadge) { ctx.fillStyle = full ? '#ffcb2a' : '#ff3b9a'; rr(x + w - 190, y + 50, 164, 42, 12); ctx.fill(); text(full ? '1 LEFT' : '2 LEFT', x + w - 108, y + 72, { size: 25, fill: full ? '#3a1a00' : '#fff', spacing: 1 }); }
  ctx.restore();
};

// ------------------------------------------------------------------ the moon-percent pill, a callback to Episode 5
A.moonHud = (t, o = {}) => {
  const { appear = 1, pct = 100, was = 97 } = o;
  if (appear <= 0) return;
  const x = 520, y = 128, w = 512, h = 112, s = easeBack(clamp(appear)), cx = x + w / 2, cy = y + h / 2;
  reg('overlay', [x, y, x + w, y + h], { id: 'hud-moon' });
  ctx.save(); ctx.globalAlpha *= clamp(appear * 2); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(10,8,22,.9)'; rr(x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(190,210,255,.9)'; ctx.lineWidth = 4; rr(x, y, w, h, 28); ctx.stroke();
  ctx.fillStyle = 'rgba(190,210,255,.18)'; ell(x + 58, cy, 38, 38); ctx.fill();
  ctx.fillStyle = V2.grad(x + 30, cy - 28, x + 86, cy + 28, [[0, '#fffdf2'], [1, '#d9cfa8']]); ell(x + 58, cy, 28, 28); ctx.fill(); ctx.strokeStyle = '#15111a'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(116,112,150,.4)'; ell(x + 49, cy - 8, 7, 6); ctx.fill(); ell(x + 68, cy + 8, 6, 5); ctx.fill();
  text('MOON', x + 112, y + 32, { size: 21, fill: '#c9d8ff', align: 'left', spacing: 3 });
  const v = Math.round(lerp(was, pct, easeIO(seg(o.roll ?? 1, 0, 1))));
  text(v + '%', x + 112, y + 82, { size: 64, font: 'Bangers', weight: 400, fill: v >= 100 ? '#fff6c0' : '#fff', align: 'left', spacing: 2 });
  if (o.sub) { ctx.fillStyle = v >= 100 ? '#ff3b55' : 'rgba(255,255,255,.14)'; rr(x + w - 214, y + 50, 188, 42, 12); ctx.fill(); text(o.sub, x + w - 120, y + 72, { size: 25, fill: '#fff', spacing: 1 }); }
  ctx.restore();
};

// ------------------------------------------------------------------ picture in picture: a phone caller in a ring
A.pip = (cx, cy, r, o, draw) => {
  const k = easeBack(clamp(o.appear ?? 1));
  if (k <= 0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  reg('overlay', [cx - r * k, cy - r * k, cx + r * k, cy + r * k + (o.label ? 36 * k : 0)], { id: 'pip:' + (o.id || '') });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.fillStyle = '#10142a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 8, 0, TAU); ctx.clip(); REG.suppress++; draw(r - 8); REG.suppress--; ctx.restore();
  ctx.strokeStyle = o.ring || '#7be0a0'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, r - 4, 0, TAU); ctx.stroke();
  if (o.ping) { const pk = ((T * 1.4) % 1); ctx.strokeStyle = V2.rgba(o.ring || '#7be0a0', (1 - pk) * .6); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r + 6 + pk * 30, 0, TAU); ctx.stroke(); }
  if (o.label) {
    ctx.font = '900 26px Nunito'; const lw2 = ctx.measureText(o.label).width + 44;
    ctx.fillStyle = 'rgba(10,8,22,.92)'; rr(-lw2 / 2, r - 18, lw2, 44, 22); ctx.fill(); ctx.strokeStyle = o.ring || '#7be0a0'; ctx.lineWidth = 3; ctx.stroke();
    text(o.label, 0, r + 5, { size: 26, fill: '#fff', spacing: 1 });
  }
  ctx.restore();
};

// ------------------------------------------------------------------ the iris: the scene opens (or closes) through a circle, the way a bingo ball would
A.iris = (k, x = W / 2, y = H / 2, color = '#07061a') => {
  if (k >= 1) return;
  const R = Math.hypot(W, H) * .62 * k;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = color; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(x, y, Math.max(0, R), 0, TAU, true); ctx.fill('evenodd');
  if (R > 4) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke(); }
  ctx.restore();
};


// ------------------------------------------------------------------ the rule card: RULE #1, never say the Q word
A.ruleCard = (p, o = {}) => {
  if (p <= 0) return;
  const k = easeBack(clamp(p)), cx = 540, cy = o.y ?? 470, w = 820, h = 330, slash = seg(p, .28, .6);
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(cx, cy); ctx.scale(k, k);
  reg('overlay', [cx - w / 2 * k, cy - h / 2 * k, cx + w / 2 * k, cy + h / 2 * k], { id: 'rule-card', transit: k < 1.02 });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; ctx.fillStyle = 'rgba(12,10,28,.95)'; rr(-w / 2, -h / 2, w, h, 40); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#ff3b55'; ctx.lineWidth = 8; rr(-w / 2, -h / 2, w, h, 40); ctx.stroke();
  text('RULE #1', 0, -h / 2 + 76, { size: 104, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 12, stroke: '#150f22', spacing: 4 });
  const qx = 176, qy = 52, qs = 132;
  text('NEVER SAY THE', -218, 26, { size: 40, fill: '#c9d2f0', weight: 900, spacing: 3 });
  ctx.font = `400 ${qs}px Bangers`; ctx.letterSpacing = '4px'; const qw = ctx.measureText('QUIET').width; ctx.letterSpacing = '0px';
  text('QUIET', qx, qy, { size: qs, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 0, spacing: 4 });
  if (slash > 0) { ctx.strokeStyle = '#ff3b55'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(qx, qy, qw / 2 + 30, 76, 0, 0, TAU * slash); ctx.stroke();
    const sl = clamp((slash - .5) * 2); if (sl > 0) { ctx.beginPath(); ctx.moveTo(qx - qw / 2 - 10, qy + 62); ctx.lineTo(qx - qw / 2 - 10 + (qw + 20) * sl, qy + 62 - 124 * sl); ctx.stroke(); } }
  ctx.restore();
};


// a bingo ball swallowing the picture (k 0 to 1 grows it from nothing to filling the frame) or leaving it (run k from 1 to 0)
A.ballWipe = (k, n = 7, o = {}) => {
  if (k <= .002) return;
  const r = lerp(30, 1500, easeIn(clamp(k))), x = o.x ?? 540, y = o.y ?? 960;
  REG.suppress++;   // a transition: it is meant to swallow the frame, so its number is not an audit subject
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  A.ball(x, y - (1 - clamp(k)) * 60, r, n, { shadow: false, rot: k * 5 });
  ctx.restore();
  REG.suppress--;
};

// ------------------------------------------------------------------ a banana peel left on the carpet: three strips flattened by the camera angle (x, y = floor point on screen, k = depth scale, land 0 to 1 = the drop-in)
A.peelFloor = (x, y, k, land = 1) => {
  const strip = (ang, len, w) => {
    ctx.save(); ctx.rotate(ang);
    ctx.fillStyle = V2.grad(0, -w / 2, 0, w / 2, [[0, '#ffe55a'], [.55, '#ffd23f'], [1, '#d9a400']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.quadraticCurveTo(len * .5, -w * .66, len, -w * .12); ctx.quadraticCurveTo(len + 16, 0, len, w * .12); ctx.quadraticCurveTo(len * .5, w * .66, 0, w / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a4a12'; ctx.beginPath(); ctx.moveTo(len - 10, -w * .14); ctx.quadraticCurveTo(len + 20, 0, len - 10, w * .14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(160,110,0,.35)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(len - 14, 0); ctx.stroke();
    ctx.restore();
  };
  ctx.save(); ctx.translate(x, y - (1 - land) * 110 * k); ctx.scale(k, k * .46); ctx.globalAlpha *= clamp(land * 3);
  ctx.fillStyle = 'rgba(30,18,60,.3)'; ell(0, 8, 104, 32); ctx.fill();
  strip(.3, 84, 38); strip(2.45, 76, 36); strip(-1.95, 70, 34);
  ctx.restore();
};

// ------------------------------------------------------------------ alarm vocabulary additions
Object.assign(A6.ALARM, { howl: { rgb: '190,205,255', name: 'HOWL', hex: '#bed0ff' }, taxi: { rgb: '255,214,60', name: 'TAXI', hex: '#ffd63c' }, phone: { rgb: '120,230,170', name: 'PHONE', hex: '#78e6aa' }, moon: { rgb: '210,225,255', name: 'MOON', hex: '#d2e1ff' }, q: { rgb: '255,60,90', name: 'Q WORD', hex: '#ff3c5a' } });
})();
