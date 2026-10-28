'use strict';
/* DEV build of ep14_adapt.js (junk sheet) */
(() => {
if (!window.TIMELINE_EP14 || !window.S14) return;
const { zoomTo, faceZoom, drawBg } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, S14 = window.S14;
// ------------------------------------------------------------------ THE JUNK LIBRARY (the stash of the shower room): vector art, one drawing per kind, shared by adapt (the conveyor, the spill) and closet (the avalanche)
// Every drawing is centred on its own origin, in native pixels (a standing fruit is about 400 px tall at native scale), light from the upper left. NO TEXT in any sprite (a sprite is cached; text is drawn live).
// A sprite is cached once at 2x with a hairline ink outline already in the art; the rim lights (a warm key edge up-left, a cool back edge down-right) are laid down at draw time as offset silhouettes so they stay on the
// lit side while a piece tumbles.
const J = {};
const g2 = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const lite = (c, f) => { const [r, g, b] = V2.rgb(c); const q = v => Math.max(0, Math.min(255, v)) | 0; return `rgb(${q(r * f)},${q(g * f)},${q(b * f)})`; };
const outline = (w = 3.2) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
/* a chrome tube from (x0, y0) to (x1, y1): ink outline, a mid-grey body, a bright highlight on the lit side */
function tube(x0, y0, x1, y1, w = 6, c0 = '#f4f7fb', c1 = '#8c96a6') {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L; if (nx + ny > 0) { nx = -nx; ny = -ny; }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = w + 3.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = c1; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = c0; ctx.lineWidth = Math.max(1.4, w * .38); ctx.beginPath(); ctx.moveTo(x0 + nx * w * .2, y0 + ny * w * .2); ctx.lineTo(x1 + nx * w * .2, y1 + ny * w * .2); ctx.stroke();
}
function disc(x, y, r, c0, c1, ow = 3) {   /* a lit disc: radial fill, ink rim */
  ctx.fillStyle = V2.radial(x - r * .35, y - r * .4, r * .1, r * 1.05, [[0, c0], [1, c1]]); ell(x, y, r, r); ctx.fill();
  if (ow) { outline(ow); ctx.stroke(); }
}
function slab(x, y, w, h, r, c0, c1, ow = 3.2) {   /* a lit rounded slab */
  ctx.fillStyle = g2(x, y, x + w * .3, y + h, [[0, c0], [1, c1]]); rr(x, y, w, h, r); ctx.fill();
  if (ow) { outline(ow); ctx.stroke(); }
}

// ---- a wheelchair (side view, facing right). a = the angle of the big wheel (spokes), 0 for a still one
function artChair(a = 0) {
  const wx = -14, wy = 36, R = 56;
  tube(-52, 6, 44, 6, 6); tube(-52, -94, -52, 6, 6); tube(-52, -94, -82, -100, 6);              /* seat rail, back post, push handle */
  ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-84, -101); ctx.lineTo(-98, -103); ctx.stroke();
  ctx.strokeStyle = '#4b4452'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-84, -101); ctx.lineTo(-98, -103); ctx.stroke();
  tube(-52, -40, 30, -40, 6); tube(30, -40, 30, 6, 5);                                           /* armrest and its front post */
  tube(44, 6, 70, 58, 6); tube(-30, 8, wx, wy, 5);                                               /* leg hanger, axle brace */
  slab(60, 56, 40, 10, 4, '#5a5360', '#2c2833', 3);                                              /* the footplate */
  disc(84, 74, 14, '#6a6475', '#2a2530', 3); tube(70, 58, 84, 74, 5);                            /* the caster */
  slab(-60, -94, 18, 84, 8, '#a3414f', '#6b2330');                                               /* back cushion, vinyl */
  slab(-58, -8, 104, 16, 7, '#b04a58', '#6b2330');                                               /* seat cushion */
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-52, -86); ctx.lineTo(-52, -20); ctx.moveTo(-50, -3); ctx.lineTo(36, -3); ctx.stroke();
  /* the big wheel: tyre, chrome hand rim, twelve spokes, hub */
  ctx.save(); ctx.translate(wx, wy);
  ctx.fillStyle = 'rgba(255,255,255,.04)'; ell(0, 0, R, R); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 12.5; ell(0, 0, R - 4, R - 4); ctx.stroke();
  ctx.strokeStyle = '#3b3542'; ctx.lineWidth = 8.5; ell(0, 0, R - 4, R - 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R - 5, PI * 1.05, PI * 1.5); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 5.4; ell(0, 0, R - 15, R - 15); ctx.stroke(); ctx.strokeStyle = '#d6dce6'; ctx.lineWidth = 2.4; ell(0, 0, R - 15, R - 15); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,130,150,.95)'; ctx.lineWidth = 1.6;
  for (let i = 0; i < 12; i++) { const q = a + i * PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(q) * 7, Math.sin(q) * 7); ctx.lineTo(Math.cos(q) * (R - 16), Math.sin(q) * (R - 16)); ctx.stroke(); }
  disc(0, 0, 8, '#f3f6fa', '#7d8798', 2.6);
  ctx.restore();
}
// ---- an IV pole: five-leg base, chrome stem, a four-hook crown, two bags and a coil of line
function artIV() {
  tube(-3, 150, -50, 166, 5); tube(3, 150, 50, 166, 5); tube(0, 150, 0, 172, 5);
  for (const [x, y] of [[-52, 172], [52, 172], [0, 178]]) disc(x, y, 7.5, '#6a6475', '#2a2530', 2.6);
  tube(0, 152, 0, -150, 7);
  tube(-38, -150, 38, -150, 5);
  for (const x of [-38, -14, 14, 38]) { ctx.strokeStyle = INK; ctx.lineWidth = 6.4; ctx.beginPath(); ctx.moveTo(x, -150); ctx.quadraticCurveTo(x, -164, x + (x < 0 ? -9 : 9), -158); ctx.stroke(); ctx.strokeStyle = '#cdd4de'; ctx.lineWidth = 3; ctx.stroke(); }
  slab(-4, -20, 8, 20, 3, '#3b3542', '#1d1a22', 2.4);                                              /* the clamp knob */
  const bag = (x, y, w, h, c0, c1) => {
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 6); ctx.stroke();
    ctx.fillStyle = g2(x - w / 2, y, x + w / 2, y + h, [[0, c0], [1, c1]]); ctx.beginPath(); ctx.moveTo(x - w * .45, y + 6); ctx.quadraticCurveTo(x - w * .62, y + h * .55, x - w * .4, y + h); ctx.lineTo(x + w * .4, y + h); ctx.quadraticCurveTo(x + w * .62, y + h * .55, x + w * .45, y + 6); ctx.closePath(); ctx.fill(); outline(3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - w * .22, y + h * .38, w * .06, h * .2, .1, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(30,60,90,.35)'; ctx.fillRect(x - w * .3, y + h * .12, w * .6, 3);
  };
  bag(-30, -146, 38, 62, 'rgba(190,230,255,.95)', 'rgba(120,180,225,.95)');
  bag(32, -146, 30, 48, 'rgba(255,240,170,.95)', 'rgba(235,200,100,.95)');
  ctx.strokeStyle = INK; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(-30, -84); ctx.bezierCurveTo(-34, -50, -4, -60, -12, -20); ctx.bezierCurveTo(-18, 8, 14, 10, 8, 44); ctx.stroke();
  ctx.strokeStyle = 'rgba(230,246,255,.95)'; ctx.lineWidth = 2.2; ctx.stroke();
  slab(-36, -66, 12, 20, 4, 'rgba(235,248,255,.95)', 'rgba(160,200,230,.95)', 2.6);                 /* the drip chamber */
}
// ---- a box fan (front view): cream case, grille, three blades (spun by a), cord and plug
function artFan(a = 0, spin = 1) {
  slab(-72, -74, 144, 148, 14, '#efe8d2', '#bfb391');
  slab(-36, -92, 72, 22, 9, '#e3dac0', '#a99c78');                                                    /* the handle */
  slab(-18, -86, 36, 9, 4, '#4a4452', '#2a2530', 2);
  ctx.fillStyle = '#2a2631'; ell(0, 0, 60, 60); ctx.fill(); outline(3); ctx.stroke();
  ctx.fillStyle = g2(0, -60, 0, 60, [[0, '#cfe3ee'], [1, '#a2bccb']]); ell(0, 0, 55, 55); ctx.fill();
  ctx.save(); ctx.beginPath(); ell(0, 0, 54, 54); ctx.clip();
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.rotate(a + i * TAU / 3); ctx.fillStyle = spin > .5 ? 'rgba(120,160,190,.35)' : 'rgba(110,150,180,.85)';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(14, -10, 40, -22, 52, -6); ctx.bezierCurveTo(44, 16, 20, 20, 0, 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,40,60,.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = '#5a5568'; ctx.lineWidth = 1.8;
  for (const r of [18, 32, 46]) { ell(0, 0, r, r); ctx.stroke(); }
  for (let i = 0; i < 12; i++) { const q = i * PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(q) * 8, Math.sin(q) * 8); ctx.lineTo(Math.cos(q) * 58, Math.sin(q) * 58); ctx.stroke(); }
  disc(0, 0, 9, '#e8ebf0', '#7b8496', 2.6);
  for (const x of [-34, 0, 34]) { disc(x, 62, 5.5, '#ffd25a', '#b8801a', 2.2); }
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(60, 70); ctx.bezierCurveTo(100, 84, 70, 112, 104, 108); ctx.stroke();
  ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 2.4; ctx.stroke();
}
// ---- a bed rail: two chrome bars, six balusters, a hinge bracket and a latch
function artRail() {
  for (let i = 0; i < 6; i++) tube(-92 + i * 37, -24, -92 + i * 37, 24, 6);
  tube(-112, -24, 112, -24, 9); tube(-112, 24, 112, 24, 9);
  slab(-122, -38, 20, 76, 5, '#5b5564', '#2c2833', 3);
  for (const y of [-22, 22]) disc(-112, y, 3.6, '#c6ccd6', '#6a7284', 1.6);
  slab(100, -34, 18, 24, 5, '#d9575c', '#8a2330', 3);
}
// ---- a mop bucket on casters, a wringer cage and the mop. slosh 0..1 lifts the water
function artBucket(slosh = 0) {
  const mop = () => {
    tube(6, -26, -42, -196, 7, '#e4c690', '#9a7a44');
    ctx.fillStyle = '#e8e3d6'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    for (let i = 0; i < 11; i++) { const q = -1.2 + i * .24; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.quadraticCurveTo(-6 + Math.sin(q) * 40, 4 + Math.cos(q) * 14, -14 + Math.sin(q) * 54, 30 + Math.cos(q) * 12 + (i % 3) * 5); ctx.stroke(); }
    ctx.strokeStyle = '#f7f4ea'; ctx.lineWidth = 1.5; for (let i = 0; i < 11; i++) { const q = -1.2 + i * .24; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.quadraticCurveTo(-6 + Math.sin(q) * 40, 4 + Math.cos(q) * 14, -14 + Math.sin(q) * 54, 30 + Math.cos(q) * 12 + (i % 3) * 5); ctx.stroke(); }
  };
  for (const x of [-30, 30]) { tube(x, 52, x, 66, 4); disc(x, 70, 8, '#5e5868', '#26222c', 2.6); }
  ctx.fillStyle = g2(-52, 0, 52, 0, [[0, '#ffe15a'], [.45, '#f2b823'], [1, '#c58410']]);
  ctx.beginPath(); ctx.moveTo(-50, -14); ctx.lineTo(50, -14); ctx.lineTo(38, 56); ctx.quadraticCurveTo(0, 62, -38, 56); ctx.closePath(); ctx.fill(); outline(3.4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.34)'; ctx.beginPath(); ctx.moveTo(-42, -8); ctx.lineTo(-34, -8); ctx.lineTo(-28, 48); ctx.lineTo(-33, 48); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2f6fb0'; ctx.fillRect(-46, 6, 92, 11); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-46, 6, 92, 3);
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-46, 6, 92, 11);
  ctx.fillStyle = '#7d8e98'; ell(0, -14, 50, 10); ctx.fill(); outline(3); ctx.stroke();                 /* the rim and the water */
  ctx.fillStyle = '#9bb0b8'; ell(0, -15 - 3 * slosh, 43, 7.4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(-14, -17 - 3 * slosh, 14, 2); ctx.fill();
  mop();
  slab(30, -54, 36, 44, 5, '#aeb6c2', '#6d7586', 3);                                                   /* the wringer cage */
  ctx.strokeStyle = 'rgba(40,44,60,.6)'; ctx.lineWidth = 1.6; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 9, -54); ctx.lineTo(30 + i * 9, -10); ctx.stroke(); }
  tube(66, -42, 82, -88, 5, '#ffb0b6', '#c04552');
}
// ---- a CRT television: wood-grain case, a convex screen (static drawn live by the caller via artTVScreen), knobs, speaker, rabbit ears
function artTV() {
  tube(-8, -60, -42, -112, 3.4, '#e2e6ee', '#8a93a3'); tube(8, -60, 40, -108, 3.4, '#e2e6ee', '#8a93a3');
  disc(-43, -114, 4.6, '#f1f4f8', '#808a9c', 2); disc(41, -110, 4.6, '#f1f4f8', '#808a9c', 2);
  for (const x of [-48, 48]) slab(x - 9, 60, 18, 8, 3, '#3a3440', '#1d1a22', 2.4);
  ctx.fillStyle = g2(-76, -60, 76, 62, [[0, '#a8683a'], [.55, '#80482a'], [1, '#55301a']]); rr(-76, -60, 152, 122, 14); ctx.fill(); outline(3.6); ctx.stroke();
  ctx.save(); rr(-76, -60, 152, 122, 14); ctx.clip();
  ctx.strokeStyle = 'rgba(40,20,8,.25)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-80, -52 + i * 13); ctx.bezierCurveTo(-30, -56 + i * 13, 30, -46 + i * 13, 80, -52 + i * 13); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,225,170,.22)'; ctx.fillRect(-76, -60, 152, 7); ctx.restore();
  ctx.fillStyle = g2(0, -50, 0, 52, [[0, '#c9ccd2'], [1, '#868b96']]); rr(-68, -52, 108, 104, 12); ctx.fill(); outline(3); ctx.stroke();   /* the bezel */
  ctx.fillStyle = '#1a2227'; rr(-60, -44, 92, 88, 18); ctx.fill(); outline(2.6); ctx.stroke();
  disc(54, -28, 9, '#e0e2e8', '#6e7384', 2.6); disc(54, 0, 9, '#e0e2e8', '#6e7384', 2.6);
  ctx.strokeStyle = INK; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(44, 18 + i * 6); ctx.lineTo(64, 18 + i * 6); ctx.stroke(); }
}
function artTVScreen(t, on = 1) {   /* the glass: dark with a bluish static, a glare arc, drawn live */
  ctx.save(); rr(-60, -44, 92, 88, 18); ctx.clip();
  ctx.fillStyle = on > .5 ? '#7fa3b4' : '#141c21'; ctx.fillRect(-60, -44, 92, 88);
  if (on > .5) {
    for (let i = 0; i < 16; i++) { const y = -44 + i * 5.6 + ((t * 90) % 5.6), v = hash(i * 3.7 + Math.floor(t * 24) * 1.3); ctx.fillStyle = `rgba(${v > .5 ? '235,245,250' : '40,60,76'},${.25 + .5 * v})`; ctx.fillRect(-60, y, 92, 2.6 + 3 * hash(i + 9)); }
    ctx.fillStyle = 'rgba(200,230,255,.18)'; ctx.fillRect(-60, -44, 92, 88);
  }
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.ellipse(-30, -26, 26, 11, -.5, 0, TAU); ctx.fill();
  ctx.restore();
}
// ---- cardboard boxes, three sizes; open = flaps up and a litter of paper (the burst ones)
function artBox(sz = 1, open = 0) {
  const w = [74, 104, 138][sz], h = [56, 76, 98][sz];
  if (open > 0) {   /* flaps behind the front face */
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * w / 2, -h / 2); ctx.rotate(s * (.4 + open * .6)); ctx.fillStyle = lite('#c99a5a', .86); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * w * .5, 0); ctx.lineTo(-s * w * .46, -h * .3); ctx.lineTo(s * 4, -h * .34); ctx.closePath(); ctx.fill(); outline(3); ctx.stroke(); ctx.restore(); }
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(-w * .3 + i * w * .2, -h / 2 - 8 - 8 * hash(i + sz)); ctx.rotate(-.5 + i * .35); ctx.fillStyle = i % 2 ? '#f3efe2' : '#dfe9f2'; ctx.fillRect(-14, -20, 28, 32); outline(2.4); ctx.strokeRect(-14, -20, 28, 32); ctx.restore(); }
  }
  ctx.fillStyle = g2(-w / 2, -h / 2, w / 2, h / 2, [[0, '#dcae6c'], [.6, '#c28d4e'], [1, '#9c6a34']]); rr(-w / 2, -h / 2, w, h, 4); ctx.fill(); outline(3.4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, 5);
  ctx.fillStyle = '#efe1b4'; ctx.fillRect(-9, -h / 2, 18, h * .46); outline(1.8); ctx.strokeRect(-9, -h / 2, 18, h * .46);        /* the tape */
  ctx.strokeStyle = 'rgba(70,40,10,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + h * .46); ctx.lineTo(w / 2, -h / 2 + h * .46); ctx.stroke();
  ctx.fillStyle = 'rgba(70,40,10,.25)'; for (let i = 0; i < 3; i++) ctx.fillRect(w * .12 + i * 7, h * .1, 4, h * .22);                  /* handle slots / scuffs: no text */
}
// ---- the Christmas tree in its carton, and the tree itself unfolding (k 0..1)
function artTreeBox() {
  slab(-118, -34, 236, 68, 6, '#2c8a4a', '#18532c', 3.4);
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-114, -30, 228, 6);
  ctx.fillStyle = '#e8f3e6'; ctx.beginPath(); ctx.moveTo(-60, 22); ctx.lineTo(-30, -18); ctx.lineTo(0, 22); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-34, 22); ctx.lineTo(0, -24); ctx.lineTo(34, 22); ctx.closePath(); ctx.fill();   /* the picture on the carton: two white trees, no lettering */
  ctx.fillStyle = '#d9a336'; ctx.fillRect(48, -22, 56, 8); ctx.fillRect(48, -6, 40, 8);
  ctx.strokeStyle = '#18532c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-118, -10); ctx.lineTo(118, -10); ctx.stroke();
}
function artTree(k = 1, t = 0) {   /* standing tree, origin at the base of the trunk centre-bottom -> drawn with its middle at 0: y from -120 (star) to +120 (foot) */
  const tiers = 6, H0 = 232;
  const spread = .22 + .78 * k;
  tube(0, 118, 0, -100, 8, '#c4a070', '#6a4a24');
  disc(0, 124, 24, '#8a5a2a', '#3a220e', 3);
  for (let i = tiers - 1; i >= 0; i--) {
    const u = i / (tiers - 1), y = 96 - u * 190, w = (108 - u * 78) * spread, h = 48 - u * 12;
    const droop = 1 - .5 * k;
    ctx.fillStyle = g2(-w, y - h, w, y, [[0, i % 2 ? '#2f8f43' : '#38a14e'], [1, '#175a2c']]);
    ctx.beginPath(); ctx.moveTo(0, y - h);
    const n = 5; for (let j = 0; j <= n; j++) { const q = -1 + 2 * j / n; ctx.quadraticCurveTo(q * w * .98 - (w / n) * .3, y - 6 + (j % 2 ? -8 : 4) * droop, q * w, y + (j % 2 ? 4 : -2)); }
    ctx.lineTo(0, y - h); ctx.closePath(); ctx.fill(); outline(3); ctx.stroke();
    ctx.strokeStyle = i % 2 ? '#f3c94a' : '#e9edf3'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-w * .8, y - 2); for (let j = 1; j <= 8; j++) ctx.lineTo(-w * .8 + j * w * .2, y - 2 + (j % 2 ? -7 : 3)); ctx.stroke();
    for (const [bx, by, bc] of [[-.5, -.3, '#e0364a'], [.3, -.15, '#3b82d9'], [.62, -.4, '#f3c94a']]) if (u < .8) disc(bx * w, y + by * h * .6, 5.4, '#fff', bc, 2);
  }
  const sx = 0, sy = -116;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(.3 * (1 - k)); ctx.fillStyle = '#ffd84a'; A9.starPath(0, 0, 15); ctx.fill(); outline(2.8); ctx.stroke(); ctx.restore();
}
// ---- a rolled-up banner: a fat roll, two twine bands, a tail of stripes
function artBanner() {
  ctx.fillStyle = g2(0, -30, 0, 30, [[0, '#ffe8a0'], [.5, '#f2c04a'], [1, '#b8821c']]); rr(-96, -28, 192, 56, 24); ctx.fill(); outline(3.4); ctx.stroke();
  ctx.fillStyle = '#e8dfc6'; ell(-96, 0, 18, 28); ctx.fill(); outline(3); ctx.stroke();
  ctx.strokeStyle = '#c58a30'; ctx.lineWidth = 2.4; for (const r of [20, 13, 7]) { ctx.beginPath(); ctx.ellipse(-96, 0, r * .62, r, 0, 0, TAU); ctx.stroke(); }
  for (const x of [-40, 46]) { ctx.fillStyle = '#7a5a2a'; ctx.fillRect(x - 3, -29, 6, 58); outline(1.6); ctx.strokeRect(x - 3, -29, 6, 58); }
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-84, -22, 170, 6);
  ctx.fillStyle = '#d9444f'; ctx.beginPath(); ctx.moveTo(96, -10); ctx.quadraticCurveTo(122, -6, 136, 16); ctx.lineTo(120, 24); ctx.quadraticCurveTo(110, 8, 96, 14); ctx.closePath(); ctx.fill(); outline(2.8); ctx.stroke();
}
// ---- the sign: HOURS SINCE THE Q WORD (the frame only; the title and the digits are drawn live)
function artQSign() {
  slab(-150, -80, 300, 160, 14, '#2a2733', '#121018', 4);
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2.4; rr(-143, -73, 286, 146, 10); ctx.stroke();
  for (const [x, y] of [[-134, -64], [134, -64], [-134, 64], [134, 64]]) disc(x, y, 4.4, '#d8dde6', '#7a8294', 1.6);
}
// ---- small things: a lone sock, a tinsel strand, an ornament
function artSock() {
  ctx.fillStyle = g2(-20, -30, 20, 30, [[0, '#ffffff'], [1, '#cfd6e2']]);
  ctx.beginPath(); ctx.moveTo(-12, -34); ctx.lineTo(10, -34); ctx.lineTo(12, 6); ctx.quadraticCurveTo(28, 14, 30, 30); ctx.quadraticCurveTo(26, 40, 8, 38); ctx.quadraticCurveTo(-10, 36, -12, 14); ctx.closePath(); ctx.fill(); outline(3); ctx.stroke();
  ctx.fillStyle = '#d9444f'; ctx.fillRect(-12, -34, 22, 7); ctx.fillStyle = '#8fa0b8'; ctx.beginPath(); ctx.moveTo(22, 12); ctx.quadraticCurveTo(30, 18, 30, 30); ctx.quadraticCurveTo(26, 40, 8, 38); ctx.lineTo(8, 24); ctx.closePath(); ctx.fill();
}
function artOrn(c) { disc(0, 0, 11, '#ffffff', c, 2.4); ctx.fillStyle = '#d9c36a'; ctx.fillRect(-3.5, -15, 7, 5); outline(1.6); ctx.strokeRect(-3.5, -15, 7, 5); }

// ---- the catalogue: kind -> { w, h (sprite extent), r (collision radius), body: art function }
const KIND = {
  chair:  { w: 220, h: 190, r: 66, art: artChair },
  iv:     { w: 150, h: 360, r: 80, art: artIV },
  fan:    { w: 190, h: 220, r: 78, art: artFan },
  rail:   { w: 260, h: 90, r: 70, art: artRail },
  bucket: { w: 180, h: 300, r: 62, art: artBucket },
  tv:     { w: 190, h: 170, r: 74, art: artTV },
  box0:   { w: 100, h: 110, r: 40, art: () => artBox(0, 0) },
  box1:   { w: 130, h: 130, r: 52, art: () => artBox(1, 0) },
  box2:   { w: 170, h: 150, r: 66, art: () => artBox(2, 0) },
  boxo1:  { w: 130, h: 150, r: 52, art: () => artBox(1, 1) },
  boxo2:  { w: 170, h: 170, r: 66, art: () => artBox(2, 1) },
  treebox:{ w: 260, h: 100, r: 70, art: artTreeBox },
  banner: { w: 260, h: 90, r: 62, art: artBanner },
  qsign:  { w: 330, h: 190, r: 76, art: artQSign },
  sock:   { w: 80, h: 100, r: 16, art: artSock },
};

// ---- drawing a piece: static kinds are cached once (3x), live kinds (a spinning wheel, a fan, a television, the unfolding tree, a sloshing bucket) are redrawn into a scratch canvas; both are laid down with the same rim lights
const SPR = new Map(), SCR = new Map();
const LIVE = { chair: 1, fan: 1, tv: 1, tree: 1, bucket: 1 };
const KS = 3;
function paintInto(cv, fn) {
  const g = cv.getContext('2d'), prev = ctx;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  ctx = g; g.save(); g.translate(cv.width / 2, cv.height / 2); g.scale(KS, KS);
  try { fn(); } finally { g.restore(); ctx = prev; }
}
function spriteFor(kind, st) {
  const K = KIND[kind];
  if (!LIVE[kind]) {
    let s = SPR.get(kind);
    if (!s) { const cv = V2.mk(Math.ceil(K.w * KS), Math.ceil(K.h * KS)); paintInto(cv, () => K.art()); SPR.set(kind, s = cv); }
    return s;
  }
  let cv = SCR.get(kind);
  if (!cv) SCR.set(kind, cv = V2.mk(Math.ceil((kind === 'tree' ? 280 : K.w) * KS), Math.ceil((kind === 'tree' ? 300 : K.h) * KS)));
  paintInto(cv, () => {
    if (kind === 'chair') artChair(st.a || 0);
    else if (kind === 'fan') artFan(st.a || 0, st.spin ?? 1);
    else if (kind === 'tv') { artTV(); artTVScreen(st.t || 0, st.on ?? 1); }
    else if (kind === 'bucket') artBucket(st.slosh || 0);
    else if (kind === 'tree') artTree(st.k ?? 1, st.t || 0);
  });
  return cv;
}
/* jdraw(kind, x, y, rot, scale, st): st = { flip, alpha, rim (px, default 2), a (wheel/blade angle), spin, t, on, k, slosh, shadow: [floorY, strength] } */
function jdraw(kind, x, y, rot, sc, st = {}) {
  const K = KIND[kind], cv = spriteFor(kind, st), w = cv.width / KS, h = cv.height / KS;
  ctx.save();
  if (st.alpha != null) ctx.globalAlpha *= st.alpha;
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * (st.flip ? -1 : 1), sc);
  const rim = st.rim ?? 2;
  if (rim > 0 && !TXA.mask) ctx.filter = `drop-shadow(${-rim}px ${-rim}px 0px rgba(255,228,176,.9)) drop-shadow(${rim * .8}px ${rim * .8}px 0px rgba(140,185,255,.55))`;
  ctx.drawImage(cv, -w / 2, -h / 2, w, h);
  ctx.restore();
}

const SC = {
  shot: lt => 'sheet',
  cam(lt) { zoomTo(540, 960, 1); },
  draw(lt) {
    ctx.fillStyle = '#5a6478'; ctx.fillRect(0, 0, W, H);
    const kinds = Object.keys(KIND);
    kinds.forEach((k, i) => {
      const cx = 200 + (i % 4) * 230, cy = 330 + Math.floor(i / 4) * 330;
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(cx - 105, cy - 150, 210, 300);
      const st = { a: lt * 3, t: lt, k: (lt * .4) % 1, slosh: .5 + .5 * Math.sin(lt * 5), spin: 1 };
      jdraw(k, cx, cy, 0, Math.min(1, 200 / KIND[k].w, 290 / KIND[k].h), st);
    });
    jdraw('tree', 540, 1280, 0, .7, { k: 1 });
    jdraw('tree', 200, 1280, 0, .7, { k: .2 });
    jdraw('qsign', 850, 1280, 0, .55, {});
    jdraw('chair', 860, 1000 + 0, 0, 1.1, { a: lt * 4 });
  },
  fx: () => ({ bloom: .2 }),
  blur: () => 1,
  over() {},
};
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.adapt = SC;
})();
