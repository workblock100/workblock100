'use strict';
/* SHIFT HAPPENS, Episode 14: "The Survey". Scene module: adapt (3:04 PM, THE ADAPTATION, 24.4 s). Builder E14-B. (header is written last; see the shot list at the end of the file's build)
 * Registers window.__EP14_SCENES.adapt and exports the junk catalogue on window.FP14J for ep14_closet.js. Everything is a pure function of the scene time `lt`. */
(() => {
if (!window.TIMELINE_EP14 || !window.S14) return;
const { zoomTo, faceZoom, drawBg } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A14 = window.A14, S14 = window.S14;
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
  ctx.fillStyle = '#e8f3e6'; for (const [y, w] of [[-20, 16], [-8, 24], [4, 32]]) { ctx.beginPath(); ctx.moveTo(-34, y - 14); ctx.lineTo(-34 - w, y + 12); ctx.lineTo(-34 + w, y + 12); ctx.closePath(); ctx.fill(); }   /* the picture on the carton: one white tree, three tiers and a trunk, no lettering */
  ctx.fillStyle = '#c9a070'; ctx.fillRect(-37, 12, 6, 12); ctx.fillStyle = '#ffd84a'; ell(-34, -32, 5, 5); ctx.fill();
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

// ------------------------------------------------------------------ small helpers (wordT, sstep, pulse, hnoise copied from ep13_station.js / ep13_cross.js; route from ep13_station.js)
const cl01 = x => Math.max(0, Math.min(1, x));
const sstep = (t, a, b) => { const k = cl01((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const pulse = (t, t0, hz = 36, tau = .07) => t < t0 ? 0 : Math.sin((t - t0) * hz) * Math.exp(-(t - t0) / tau);
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const inB = (lt, id) => lt >= B(id).s && lt < B(id).e;
/* the scene-local time of a spoken word: wordT('n5', 'position') */
const wordT = (id, word, fb = 0) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = cl01((lt - a[0]) / (b[0] - a[0])), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : b[3] === 'in' ? easeIn(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
/* the sound cues, relative to their BEATS (the audio spec in script_ep14.json): crash +0.1 and clatter +0.15 into pop, typing +0.4 into n3, shutter +0.1, scribble +0.3 and shutter +1.0 into cam, pizzabox -0.2 and sparkle +0.1 around a1 */
const CUE = { get crash() { return B('pop').s + .1; }, get clatter() { return B('pop').s + .15; }, get typing() { return B('n3').s + .4; }, get shutter1() { return B('cam').s + .1; }, get scribble() { return B('cam').s + .3; },
  get shutter2() { return B('cam').s + 1.0; }, get pizzabox() { return B('a1').s - .2; }, get sparkle() { return B('a1').s + .1; } };

// ------------------------------------------------------------------ the palette of the film's field-guide graphics
const CREAM = '#f2e8cf', GREEN = '#24402e', OCHRE = '#c98b2c', INKD = '#1d1a16', STAMP = '#c23a2b', NVG = '#7dff8a', NVGD = '#04120a', SLATE = '#33527a';

// ------------------------------------------------------------------ a character's geometry: where its body centre is on the canvas, and the grip target that puts a hand on a world point (the same maths as drawChar / arms in v2_char.js)
function bodyCentre(o) {
  const k = KINDS[o.kind], s = o.s || 1, L = o.noLegs ? 0 : (k.leg || 90), t = o.t ?? T, seed = o.seed ?? (o.kind.charCodeAt(0) * 13 + o.kind.length * 7);
  const walkBob = (o.gait != null || o.gaitW != null) ? -Math.abs(Math.sin((o.gaitW != null ? o.gaitW : o.gait / s) / (2 * (o.stride || 30)) * PI)) * 7 : 0;
  const bob = o.noBob ? 0 : Math.sin(t * 2.6 + seed) * 2.2 + walkBob;
  return [o.x, o.y - (o.lift || 0) - (L + k.ry * .9) * s + bob * s];
}
/* the grip (local units, relative to the body centre, in the character's own turned frame) that puts the hand of `side` ('l' or 'r') on the world point (X, Y); clamped to the arm's reach so the audit never sees an overstretched arm */
function gripFor(o, side, X, Y) {
  const k = KINDS[o.kind], s = o.s || 1, [cx, cy] = bodyCentre(o), rot = o.rot || 0;
  let gx = (X - cx) / s, gy = (Y - cy) / s;
  if (rot) { const c = Math.cos(-rot), n = Math.sin(-rot), x = gx * c - gy * n, y = gx * n + gy * c; gx = x; gy = y; }
  const [sx, sy] = shoulder(k, side === 'l' ? -1 : 1), reach = ((k.arm1 || 56) + (k.arm2 || 52)) * (o.armScale || 1.12) - 3, dx = gx - sx, dy = gy - sy, d = Math.hypot(dx, dy);
  if (d > reach) { gx = sx + dx / d * reach; gy = sy + dy / d * reach; }
  return [gx, gy];
}
/* the world position of a local grip (the inverse of the above) */
function gripWorld(o, g) {
  const s = o.s || 1, [cx, cy] = bodyCentre(o), rot = o.rot || 0, c = Math.cos(rot), n = Math.sin(rot);
  return [cx + (g[0] * c - g[1] * n) * s, cy + (g[0] * n + g[1] * c) * s];
}
/* lean about the FEET: the same sprite turned by `a` radians with the shoes kept where they were (drawChar turns the body about its centre, which would swing the shoes) */
function leanO(o, a) {
  const k = KINDS[o.kind], s = o.s || 1, L = o.noLegs ? 0 : (k.leg || 90), h = (L + k.ry * .9) * s;
  o.rot = (o.rot || 0) + a; o.x += h * Math.sin(a); o.y += h * (1 - Math.cos(a));
  return o;
}
/* is a character's face and body entirely inside the frame under the current camera? (a shot that needs everybody in frame hides the ones that are not) */
function frameStat(o) {
  const k = KINDS[o.kind], s = o.s || 1, L = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (L + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, bot = o.y + 24 * s, half = k.rx * 1.12 * s;
  const m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const q = [p(o.x - half, top), p(o.x + half, top), p(o.x - half, bot), p(o.x + half, bot)], xs = q.map(a => a[0]), ys = q.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6 && y1 <= H - 6, x0, x1, y0, y1 };
}
/* a character that may be half out of frame because the camera is whipping past it: transit exempts it from the edge audit */
const withTransit = (o, moving) => { const f = frameStat(o); if (f.inter && !f.whole && moving) o.transit = true; return o; };

// ------------------------------------------------------------------ the documentary graphics (screen space, drawn in over(): never blurred, never covered by the world)
const regOverlay = (r, id) => reg('overlay', [r[0], r[1], r[2], r[3]], { id });
/* the field-guide tag: a cream specimen plate with a forest-green border, an ochre kicker, the behaviour in Bangers and its Latin name in italic. It drops in from above (no sliding through the frame edge) and fades out. */
const TAG_BOX = [512, 96, 520, 200];
const BEHAVIORS = [
  { n: 1, name: 'CONCEALMENT', latin: 'Occultatio communis' },
  { n: 2, name: 'CHARTING', latin: 'Scriptura retrograda' },
  { n: 3, name: 'INSULIN PENS', latin: 'Stylus hodiernus' },
  { n: 4, name: 'CALL LIGHTS', latin: 'Statio custodiens' },
  { n: 5, name: 'THE DISPLAY', latin: 'Pavo administratorius' },
];
function fieldTag(lt, b, t0, t1) {
  const k = seg(lt, t0, t0 + .3), a = Math.min(sstep(lt, t0, t0 + .18), 1 - sstep(lt, t1 - .22, t1));
  if (a <= .01) return;
  const [x, y, w, h] = TAG_BOX, cx = x + w / 2, cy = y + h / 2, dy = (1 - easeOut(k)) * -34, pop = lerp(.94, 1, easeBack(k));
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy + dy); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
  /* the string and the pin it hangs from */
  ctx.strokeStyle = 'rgba(60,40,20,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 34, y + 12); ctx.quadraticCurveTo(x + 6, y - 6, x - 14, y - 4); ctx.stroke();
  UI.sign([x, y, w, h], [
    { t: 'BEHAVIOR ' + b.n + ' OF 5', size: 30, weight: 900, spacing: 4, fill: OCHRE, gap: 2 },
    { t: b.name, size: 66, font: 'Bangers', spacing: 3, fill: INKD },
    { t: b.latin, size: 31, weight: 800, italic: true, fill: GREEN },
  ], { fill: [CREAM, '#e6d9b8'], stroke: GREEN, lw: 6, r: 18, pad: 22, shadow: 18, id: 'tag14' });
  ctx.strokeStyle = 'rgba(201,139,44,.9)'; ctx.lineWidth = 2.4; rr(x + 11, y + 11, w - 22, h - 22, 12); ctx.stroke();
  for (const [px, py] of [[x + 20, y + 20], [x + w - 20, y + 20], [x + 20, y + h - 20], [x + w - 20, y + h - 20]]) { ctx.fillStyle = '#b08a3a'; ell(px, py, 4.4, 4.4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(px - 1.2, py - 1.4, 1.5, 1.5); ctx.fill(); }
  ctx.restore();
  regOverlay([x, y + dy, x + w, y + h + dy], 'tag14');
}

// ------------------------------------------------------------------ the camera trap: scanlines, a rolling band, the IR flash, the HUD (CAM 03 MED ROOM, a timestamp, REC, a MOTION box)
const SCAN = V2.mk(4, 4); { const g = SCAN.getContext('2d'); g.fillStyle = 'rgba(0,18,6,.34)'; g.fillRect(0, 0, 4, 1.4); g.fillStyle = 'rgba(0,18,6,.12)'; g.fillRect(0, 2, 4, 1); }
function trapOverlay(lt, o) {
  if (TXA.mask) return;
  ctx.save();
  ctx.fillStyle = ctx.createPattern(SCAN, 'repeat'); ctx.fillRect(0, 0, W, 1390);
  /* the slow bright band that rolls down a tube picture */
  const by = ((lt * 340) % 1700) - 200;
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(0, by - 110, 0, by + 110, [[0, 'rgba(125,255,138,0)'], [.5, 'rgba(125,255,138,.07)'], [1, 'rgba(125,255,138,0)']]); ctx.fillRect(0, 0, W, 1390);
  /* the frame is wiped to static for the first three frames after the cut */
  const st = 1 - seg(lt, o.cut, o.cut + .1);
  if (st > 0) { for (let i = 0; i < 26; i++) { const y = hash(i * 7.3 + Math.floor(lt * 30) * 2.1) * 1390, h = 8 + hash(i + 5) * 60; ctx.fillStyle = `rgba(180,255,190,${.18 * st * hash(i * 3.3 + Math.floor(lt * 30))})`; ctx.fillRect(0, y, W, h); } }
  ctx.restore();
}
function trapFlash(lt, t0) {   /* an infrared flash: two frames, white-green */
  const k = lt - t0; if (k < 0 || k > .1) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,255,214,${k < .034 ? .95 : .5 * (1 - (k - .034) / .066)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
}
/* the HUD. box: Clementine's screen box [x0, y0, x1, y1] for the MOTION frame; caught: the second shutter has gone */
function trapHUD(lt, o) {
  const a = sstep(lt, o.t0, o.t0 + .08); if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a;
  const G = NVG;
  /* top right: the camera name and REC */
  const rec = Math.sin(lt * 7) > -.15;
  const p = UI.pill('CAM 03  MED ROOM', 1032, 150, { anchor: 'right', size: 34, weight: 900, spacing: 3, ink: G, fill: 'rgba(2,16,6,.7)', stroke: G, lw: 3, padX: 24, h: 62, id: 'camname' });
  regOverlay([p.x0, p.y0, p.x1, p.y1], 'camname');
  const r2 = UI.pill('REC', 1032, 226, { anchor: 'right', size: 32, weight: 900, spacing: 4, ink: '#ffb4b4', fill: 'rgba(2,16,6,.7)', stroke: 'rgba(255,90,90,.9)', lw: 3, padX: 56, h: 54, id: 'rec' });
  regOverlay([r2.x0, r2.y0, r2.x1, r2.y1], 'rec');
  ctx.fillStyle = rec ? '#ff3b3b' : '#5a1414'; ell(r2.x0 + 30, 226, 11, 11); ctx.fill();
  /* bottom left: the timestamp, above the caption zone */
  const secs = 51 + Math.floor(lt - o.t0 + o.t0 * 0), ts = `15:04:${String(secs % 60).padStart(2, '0')}`;
  const t = UI.pill(ts + '  FRI', 48, 1318, { anchor: 'left', size: 34, weight: 900, spacing: 3, ink: G, fill: 'rgba(2,16,6,.7)', stroke: G, lw: 3, padX: 24, h: 60, id: 'ts' });
  regOverlay([t.x0, t.y0, t.x1, t.y1], 'ts');
  /* the MOTION frame: four corner brackets round the subject and a small tab */
  if (o.box) {
    const [x0, y0, x1, y1] = o.box, L = 34, caught = !!o.caught, col = caught ? '#ff6a5a' : G;
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'butt';
    for (const [cx, cy, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx, cy + dy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * L, cy); ctx.stroke(); }
    const tab = UI.pill(caught ? 'CAUGHT' : 'MOTION', x0, y0 - 6, { anchor: 'left', size: 30, weight: 900, spacing: 3, ink: caught ? '#2a0804' : NVGD, fill: col, padX: 14, h: 44, id: 'motion', lw: 0 });
    regOverlay([tab.x0, tab.y0, tab.x1, tab.y1], 'motion');
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the cast, at the dollhouse scale (S14.S = .44; the Administrator is s 1.22 x that). Every walker goes through S14.walk / S14.run so its gait fields reach the footstep tool.
const SS = S14.S;
const mkMango = o => A7.mango(Object.assign({}, o));
const mkClem = o => A10.clem(Object.assign({}, o));
const mkLemon = o => A7.lemon(Object.assign({}, o));
const mkStraw = o => A11.straw(Object.assign({}, o));
const mkMelon = o => A9.melon(Object.assign({}, o));
const FL = { top: S14.rect('office').floor, mid: S14.rect('r7').floor, low: S14.rect('station').floor };   /* the three floor lines: 656, 986, 1316 */
const RC = id => S14.rect(id);
/* the junk is drawn a little larger than its native size next to a person, so a wheelchair is about as long as a person is tall: its scale against the cast */
const JSC = { chair: 1.15, iv: 1.1, fan: .85, rail: 1, bucket: .92, tv: .8, treebox: 1, banner: 1, box0: 1, box1: 1, box2: 1, boxo1: 1, boxo2: 1, qsign: 1, sock: 1 };

/* a ballistic piece: position of a thrown thing at time t after the throw, with bounces, then a slide (all deterministic) */
function ball(p, t) {
  let x = p.x, y = p.y, vx = p.vx, vy = p.vy, rot = p.rot || 0, w = p.w || 0, tt = Math.max(0, t);
  const g = p.g ?? 1500, fl = p.floor, e = p.e ?? .38, fr = p.fr ?? .8;
  for (let i = 0; i < 7; i++) {
    const a = .5 * g, b = vy, c = y - fl, d = b * b - 4 * a * c, dt = d >= 0 ? Math.max(0, (-b + Math.sqrt(d)) / (2 * a)) : 1e9;
    if (tt <= dt) return [x + vx * tt, y + vy * tt + a * tt * tt, rot + w * tt, false];
    x += vx * dt; rot += w * dt; y = fl; vy = -(vy + g * dt) * e; vx *= fr; w *= .72; tt -= dt;
    if (Math.abs(vy) < 90) { const k = p.slide ?? 2.6, f = 1 - Math.exp(-k * tt); return [x + vx / k * f, fl, rot + w / k * f, true]; }
  }
  return [x, fl, rot, true];
}

/* ---- the held junk: a prop that draws one of the catalogue's pieces in the hand (the glove goes over it). o.junk = { kind, rot, ox, oy, st } in the character's local units, drawn at the catalogue scale */
EXT.prop.fp14b_junk = (side, o, t) => {
  const j = o.junk; if (!j) return;
  jdraw(j.kind, (j.ox || 0) * side, j.oy || 0, (j.rot || 0) * side, (j.sc ?? 1) * (JSC[j.kind] || 1), Object.assign({ rim: 2.2 }, j.st));
};
PROP_BOX.fp14b_junk = o => { const j = o.junk || {}, K = KIND[j.kind] || { w: 60, h: 60 }, r = Math.max(K.w, K.h) * (JSC[j.kind] || 1) * (j.sc ?? 1) * .5; return Object.assign([(j.ox || 0) - r, (j.oy || 0) - r, (j.ox || 0) + r, (j.oy || 0) + r], { mirror: true }); };
/* how each kind is carried: the offset of its centre from the hand, its turn, and a scale */
const CARRY = { iv: { ox: 0, oy: -6, rot: .1 }, fan: { ox: 6, oy: 96, rot: 0 }, rail: { ox: 6, oy: -64, rot: 1.25 }, bucket: { ox: 0, oy: 70, rot: 0 }, treebox: { ox: 14, oy: -78, rot: 1.42, sc: .85 } };

// ------------------------------------------------------------------ SHOT A, the conveyor. Two lanes: Mango runs the middle floor into the shower room through the arch; Clementine runs the top floor through the break room and room 14 to a trapdoor
// in the floor over the shower room. They come in from the left, drop, and run back out, again and again, one delivery about every 0.4 s.
const ARCH = S14.door('shower', 'l').x;             /* 802: the arch between room 7 and the shower room */
const HATCH = 956;                                   /* the trapdoor in the floor of room 14, over the shower room */
const RUN_V = 700;                                   /* px per second along the floor */
const LANE = { m: { x: ARCH - 34, fl: FL.mid, xl: 330 }, c: { x: HATCH - 4, fl: FL.top, xl: 470 } };   /* the drop point, the floor, and where the runner is out of frame */
const TRIPS = [   /* who, kind, the time the item leaves the hand */
  { who: 'm', kind: 'chair', t: .7 }, { who: 'c', kind: 'iv', t: 1.0 },
  { who: 'm', kind: 'fan', t: 2.05 }, { who: 'c', kind: 'rail', t: 2.35 },
  { who: 'm', kind: 'bucket', t: 3.4 }, { who: 'c', kind: 'treebox', t: 3.7 },
];
/* the route of one runner as keyframes [t, x]: out of frame, in, a short stop to throw, back out (the last trip of Mango ends at the door and stays there) */
function laneKeys(who, stay) {
  const L = LANE[who], keys = [], tr = TRIPS.filter(q => q.who === who);
  tr.forEach((q, i) => {
    const din = (L.x - L.xl) / RUN_V, dout = (L.x - L.xl) / (RUN_V * 1.25);
    keys.push([q.t - din, L.xl], [q.t, L.x], [q.t + .1, L.x]);
    if (!(stay && i === tr.length - 1)) keys.push([q.t + .1 + dout, L.xl]);
  });
  return keys;
}
const laneFn = (who, keys, fl) => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], fl];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i]; return [lerp(a[1], b[1], cl01((lt - a[0]) / (b[0] - a[0]))), fl]; }
  return [keys[keys.length - 1][1], fl];
};
const MKEYS = laneKeys('m', true), CKEYS = laneKeys('c', false);
/* which trip is a runner on at lt? -> { q, phase: 'in' | 'out', k } */
function tripAt(who, lt) {
  const L = LANE[who], tr = TRIPS.filter(q => q.who === who);
  for (const q of tr) {
    const din = (L.x - L.xl) / RUN_V, dout = (L.x - L.xl) / (RUN_V * 1.25);
    if (lt >= q.t - din - .02 && lt < q.t) return { q, phase: 'in', k: (lt - (q.t - din)) / din };
    if (lt >= q.t && lt < q.t + .1 + dout + .02) return { q, phase: 'out', k: (lt - q.t) / (.1 + dout) };
  }
  return null;
}

/* the distance from a piece's centre to the lowest thing it rests on, in catalogue units: its rest height on a floor */
const JB = { chair: 94, iv: 184, fan: 78, rail: 40, bucket: 78, tv: 70, box0: 28, box1: 38, box2: 49, boxo1: 38, boxo2: 49, treebox: 34, banner: 28, qsign: 80, sock: 38, tree: 124 };
const restY = (kind, floor, sc = 1) => floor - JB[kind] * (JSC[kind] || 1) * sc * SS;
const jsc = (kind, sc = 1) => (JSC[kind] || 1) * sc * SS;     /* the scale a piece is drawn at in the dollhouse */

/* the pile in the shower room: where each delivered piece comes to rest (x, a stacking height in pieces, a turn) */
const PILE = {
  chair: { x: 1000, up: 0, rot: 0 }, iv: { x: 928, up: 0, rot: -1.2 }, fan: { x: 888, up: 0, rot: .1 }, rail: { x: 944, up: 1, rot: .22 },
  bucket: { x: 1016, up: 1.2, rot: -.08 }, treebox: { x: 968, up: 2, rot: .1 },
};
/* a delivered piece: from the hand at the drop time, then flying or rolling into the pile. returns { x, y, rot, landed, tl } where tl is the landing time */
function deliveryState(q, lt) {
  const t = lt - q.t; if (t < 0) return null;
  const P = PILE[q.kind], fl = restY(q.kind, FL.mid, 1) - P.up * 36 * SS * 2.2;
  if (q.who === 'm') {
    const x0 = q.kind === 'chair' ? chairCentre(q.t)[0] : LANE.m.x + 40, y0 = FL.mid - 62;
    const dt1 = q.kind === 'chair' ? 1 : (Math.sqrt(300 * 300 + 4 * 750 * Math.max(1, fl - y0 + 62 + 0)) + 300) / 1500;
    const vx = q.kind === 'chair' ? 380 : (P.x - x0) / dt1 * .85, vy = q.kind === 'chair' ? 0 : -300;
    const [x, y, rot, rest] = ball({ x: x0, y: q.kind === 'chair' ? fl : y0, vx, vy, floor: fl, w: q.kind === 'chair' ? 0 : 7, rot: 0, e: .32, fr: .6, slide: q.kind === 'chair' ? 3.4 : 5 }, t);
    return { x, y, rot, rest, spin: 0 };
  }
  const x0 = HATCH + 6, y0 = FL.top - 70;
  const [x, y, rot, rest] = ball({ x: x0, y: y0, vx: (P.x - x0) / .62, vy: -140, floor: fl, w: q.kind === 'iv' ? 3.4 : q.kind === 'rail' ? -2.6 : 2.2, rot: .3, e: .3, fr: .55, slide: 9 }, t);
  return { x, y, rot: rest ? P.rot : rot, rest, spin: 0 };
}

// ------------------------------------------------------------------ SHOT A actors. The beats: conveyor 0-3.5, Mango at the door 3.2-5.7, "Does it close?" 4.17, "Sure!" 5.08 (the shove), the burst 5.71, Lemon "It closes." 6.36, the junk obeys 6.6-7.0
const DOORX = ARCH - 3;                                  /* the face of the door */
const MX_DOOR = ARCH - 84, CX_PUSH = ARCH - 178, LM_X = ARCH - 20;         /* where Mango leans, and Clementine behind her */
const t_wordCloses = () => wordT('l1', 'closes', 6.6);
const burstK = lt => seg(lt, CUE.crash, CUE.crash + .42);
/* the pushed wheelchair of Mango's first trip: the handle is 78 px ahead of her body, the chair 50 px beyond it */
const CHAIR_SC = jsc('chair'), CHAIR_H = [-98 * CHAIR_SC, -103 * CHAIR_SC];
const chairHandle = lt => [laneFn('m', MKEYS, FL.mid)(lt)[0] + 78, FL.mid - JB.chair * CHAIR_SC - 52];
const chairCentre = lt => { const h = chairHandle(lt); return [h[0] - CHAIR_H[0], h[1] - CHAIR_H[1]]; };
const OFF = (x, who) => x < LANE[who].xl + 4;                /* a runner that is still out of frame (not drawn) */

/* the free hand swings while the other carries */
const runArms = (o, lt, carry, kind) => {
  o.arms = { l: 'run', r: carry ? 'hold' : 'run' };
  if (carry) { o.hold = { r: 'fp14b_junk' }; o.junk = Object.assign({ kind }, CARRY[kind]); o.grip = { r: [76 + 4 * Math.sin(lt * 26), 34 + 6 * Math.cos(lt * 26)] }; }
  return o;
};
function mangoA(lt) {
  const tr = tripAt('m', lt), lastDrop = TRIPS.filter(q => q.who === 'm').pop().t + .1, bt = CUE.crash;
  const base = { s: SS, stride: 44, plant: true, who: 'mango', t: lt };
  let o;
  if (lt < lastDrop + .04) {
    o = S14.run(mkMango, laneFn('m', MKEYS, FL.mid), lt, Object.assign({ expr: 'happy', look: [.9, 0] }, base));
    if (OFF(o.x, 'm')) return null;
    const dir = o.dir || 1; if (o.gaitW != null) leanO(o, dir * .13);
    const carry = tr && tr.phase === 'in' && tr.q.kind !== 'chair' ? tr.q.kind : null;
    runArms(o, lt, !!carry, carry);
    if (tr && tr.phase === 'in' && tr.q.kind === 'chair') { const h = chairHandle(lt); o.arms = { l: 'run', r: 'reach' }; o.grip = { r: gripFor(o, 'r', h[0], h[1]) }; }
    if (!tr || tr.phase === 'out') { o.expr = 'happy'; o.look = [-.9, 0]; }
    return o;
  }
  /* door duty: she walks from the drop point to the door, leans her shoulder into it with one hand flat on it, and is flung back at the burst */
  const x0 = MX_DOOR, kk = burstK(lt), rec = sstep(lt, bt + .5, bt + 1.0);
  const walking = lt < lastDrop + .55;
  const px = u => [lerp(LANE.m.x, x0, easeIO(seg(u, lastDrop + .02, lastDrop + .5))), FL.mid];
  o = walking ? S14.walk(mkMango, px, lt, Object.assign({ expr: 'hopeful', look: [.85, .05], stride: 36 }, base)) : mkMango(Object.assign({ x: lt < bt ? x0 : x0 - 96 * easeOut(burstK(lt)), y: FL.mid, expr: 'hopeful', look: [.85, .05] }, base));
  const lean = lt < bt ? sstep(lt, 3.3, 3.8) * .16 + sstep(lt, 4.1, 5.05) * .06 + sstep(lt, 5.1, 5.6) * .08 : lerp(-.42, 0, rec);
  leanO(o, lean);
  o.shake = lt >= 5.0 && lt < bt ? 1.8 * sstep(lt, 5.0, 5.5) : 0;
  if (lt < bt) {
    const pushing = lt >= 3.3;
    o.arms = { l: 'hips', r: pushing ? 'reach' : 'down' };
    if (pushing) { o.grip = { r: gripFor(o, 'r', DOORX, FL.mid - 82) }; o.hand = { r: 'flat' }; }
    o.expr = lt >= 5.0 ? 'weak' : lt >= B('m1').s ? 'hopeful' : 'happy'; o.look = lt >= B('c1').s - .3 ? [-.6, .1] : [.85, .05];
    if (lt >= B('m1').s && lt < B('m1').e) o.lid = .22;
  } else {
    o.arms = { l: lt < bt + .6 ? 'up' : 'rest', r: lt < bt + .6 ? 'flail' : 'rest' };
    o.expr = lt < bt + .9 ? 'panic' : 'dead'; o.look = [.7, .2]; o.lid = lt >= bt + .9 ? .45 : undefined;
  }
  return o;
}
/* Clementine: the top lane (through the break room and room 14 to the trapdoor), then down to the middle floor to shove */
const CMID = lt => [lerp(LANE.c.xl, CX_PUSH, easeOut(seg(lt, 4.5, 5.0))), FL.mid];
function clemA(lt) {
  const tr = tripAt('c', lt), bt = CUE.crash, lastDrop = TRIPS.filter(q => q.who === 'c').pop().t + .1;
  const base = { s: SS, stride: 40, plant: true, who: 'clem', t: lt };
  let o;
  if (lt < lastDrop + (LANE.c.x - LANE.c.xl) / (RUN_V * 1.25) + .04) {
    o = S14.run(mkClem, laneFn('c', CKEYS, FL.top), lt, Object.assign({ expr: 'hopeful', look: [.9, 0] }, base));
    if (OFF(o.x, 'c')) return null;
    if (o.gaitW != null) leanO(o, (o.dir || 1) * .13);
    const carry = tr && tr.phase === 'in' ? tr.q.kind : null;
    runArms(o, lt, !!carry, carry);
    return o;
  }
  if (lt < 4.5) return null;
  const pushX = CX_PUSH, kk = burstK(lt), rec = sstep(lt, bt + .7, bt + 1.3);
  const cfn = u => [CMID(u)[0], FL.mid];
  o = lt < 5.0 ? S14.run(mkClem, cfn, lt, Object.assign({ expr: 'hopeful', look: [.9, .1] }, base)) : mkClem(Object.assign({ x: lt < bt ? pushX : pushX - 70 * easeOut(kk), y: FL.mid, expr: 'hopeful', look: [.9, .1] }, base));
  if (lt < 5.0) { if (o.gaitW != null) leanO(o, .12); }
  const lean = lt < bt ? sstep(lt, 5.0, 5.2) * .22 + sstep(lt, 5.2, 5.6) * .06 : lerp(-.55, 0, rec);
  if (lt >= 5.0) leanO(o, lean);
  o.shake = lt >= 5.1 && lt < bt ? 2.2 * sstep(lt, 5.1, 5.5) : 0;
  if (lt >= 4.95 && lt < bt) {
    const m = mangoA(lt); const mx = m ? m.x - 44 : MX_DOOR - 44;
    o.arms = { l: 'down', r: 'reach' }; o.grip = { r: gripFor(o, 'r', mx, FL.mid - 84) }; o.hand = { r: 'flat' };
    o.expr = lt >= B('c1').s ? 'happy' : 'hopeful'; o.look = [.9, .05]; o.squash = .05 * sstep(lt, 5.2, 5.6);
  } else if (lt >= bt) { o.arms = { l: lt < bt + .7 ? 'up' : 'rest', r: lt < bt + .7 ? 'flail' : 'rest' }; o.expr = lt < bt + 1.0 ? 'shock' : 'happy'; o.look = [.6, .2]; if (lt >= bt + 1.0) o.face = { curve: 1.1 }; }
  return o;
}
function lemonA(lt) {
  const bt = CUE.crash, t0 = 5.5, t1 = B('l1').s - .1;
  if (lt < t0) return null;
  const base = { s: SS, stride: 40, plant: true, who: 'lemon', t: lt };
  const fn = u => [lerp(LANE.m.xl + 120, 738, easeOut(seg(u, t0, t1 + .05))), FL.mid];
  const o = S14.walk(mkLemon, fn, lt, Object.assign({ expr: 'dead', lid: .5, look: [.8, 0] }, base));
  const tc = t_wordCloses(), reach = sstep(lt, tc - .25, tc + .05), pull = sstep(lt, tc + .5, tc + .9);
  if (lt >= t1) { o.arms = { l: 'rest', r: 'reach' }; o.grip = { r: lerpA(gripFor(o, 'r', 738 + 20, FL.mid - 66), gripFor(o, 'r', DOORX + 1, FL.mid - 96), reach * (1 - pull)) }; o.hand = { r: 'point' }; }
  o.look = lt < tc + .6 ? [.9, 0] : [.1, 0];
  return o;
}
const lerpA = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// ------------------------------------------------------------------ SHOT A: the room options the kit reads (the stash level, the bulge, the door), the trapdoor, the pieces, the dust
function roomsA(lt) {
  const bt = CUE.crash, tc = t_wordCloses();
  const landed = TRIPS.reduce((n, q) => n + sstep(lt, q.t + (q.who === 'm' ? .3 : .62), q.t + (q.who === 'm' ? .55 : .9)), 0);
  let stash = 2 + landed / 3, door = 1, bulge = sstep(lt, 2.4, 3.9) * .8;
  if (lt >= 3.3) door = lerp(1, .14, sstep(lt, 3.3, 3.9));
  if (lt >= 5.2) { door = lerp(.14, 0, sstep(lt, 5.2, 5.55)); bulge = 1; }
  if (lt >= bt) { door = easeOut(seg(lt, bt, bt + .16)); bulge = 0; stash = 3.2; }
  if (lt >= tc) { const c = easeIO(seg(lt, tc + .04, tc + .42)); door = lerp(1, 0, c); stash = lerp(3.2, 4, c); bulge = .5 * c; }
  return { shower: { stash, bulge, door }, med: { pens: 0 } };
}
/* the trapdoor in the floor of room 14 over the shower room: an opening in the slab, its cover lying on the floor beside it */
function drawHatch(lt) {
  const y0 = RC('r14').y1, x0 = HATCH - 38, w = 76;
  ctx.save();
  ctx.fillStyle = '#120d0c'; ctx.fillRect(x0, y0 - 2, w, 16);
  ctx.fillStyle = 'rgba(255,214,150,.18)'; ctx.fillRect(x0, y0 - 2, w, 3);
  ctx.strokeStyle = 'rgba(40,24,16,.9)'; ctx.lineWidth = 2.4; ctx.strokeRect(x0, y0 - 2, w, 16);
  ctx.translate(x0 + w + 6, y0 - 8); ctx.rotate(-.05);
  ctx.fillStyle = g2(0, -3, 0, 6, [[0, '#c9955a'], [1, '#7a4f26']]); rr(0, -3, w - 6, 8, 2); ctx.fill(); outline(2.4); ctx.stroke();
  ctx.fillStyle = '#d9d4cc'; ell(w - 20, 1, 3.4, 3.4); ctx.fill();
  ctx.restore();
}
function puff(x, y, k, o = {}) {
  if (k <= 0 || k >= 1) return;
  const n = o.n ?? 6, R = o.r ?? 40, col = o.c ?? '226,212,190';
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = hash(i * 3.1 + (o.seed || 0)) * TAU, d = (.3 + .7 * hash(i * 5.7 + 1 + (o.seed || 0))) * R * easeOut(k), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * .55 - k * R * .5, r = R * (.35 + .6 * k) * (.7 + .5 * hash(i + (o.seed || 0)));
    ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(${col},${(o.a ?? .55) * (1 - k)})`], [1, `rgba(${col},0)`]]); ctx.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  ctx.restore();
}
const wheelA = (kind, x) => kind === 'chair' ? x / (56 * jsc('chair')) : 0;
/* a soft contact shadow under a piece on the floor */
function floorShadow(x, y, w, a = .3) { ctx.save(); ctx.fillStyle = V2.radial(x, y, 0, w, [[0, `rgba(10,6,16,${a})`], [1, 'rgba(10,6,16,0)']]); ctx.translate(x, y); ctx.scale(1, .16); ctx.translate(-x, -y); ctx.beginPath(); ctx.arc(x, y, w, 0, TAU); ctx.fill(); ctx.restore(); }

/* the spill at the burst: the pile's six pieces fly out of the arch to the left, and a television, boxes and the banner come with them. d = delay after the burst */
const SPILL = [
  { kind: 'chair', from: 'pile', d: 0, vx: -940, vy: -40, w: 0, slide: 2.7, e: .3, fr: .8, up: 0 },
  { kind: 'iv', from: 'pile', d: .02, vx: -600, vy: -520, w: -4.4, slide: 4.5, e: .36, fr: .7, up: 0 },
  { kind: 'fan', from: 'pile', d: .04, vx: -520, vy: -560, w: 6.4, slide: 4, e: .42, fr: .7, up: 0 },
  { kind: 'rail', from: 'pile', d: .06, vx: -470, vy: -360, w: 3.4, slide: 4, e: .3, fr: .7, up: 0 },
  { kind: 'bucket', from: 'pile', d: .05, vx: -380, vy: -600, w: -5, slide: 5, e: .34, fr: .6, up: 0 },
  { kind: 'treebox', from: 'pile', d: .1, vx: -430, vy: -300, w: -2.4, slide: 4, e: .3, fr: .7, up: 0 },
  { kind: 'tv', from: 'door', d: .03, vx: -420, vy: -440, w: 3.2, slide: 5, e: .36, fr: .6, y: -92 },
  { kind: 'boxo2', from: 'door', d: .08, vx: -330, vy: -360, w: -3, slide: 5, e: .3, fr: .6, y: -60 },
  { kind: 'box1', from: 'door', d: .12, vx: -250, vy: -520, w: 4.5, slide: 6, e: .35, fr: .6, y: -120 },
  { kind: 'banner', from: 'door', d: .14, vx: -540, vy: -260, w: 2.6, slide: 3.4, e: .3, fr: .8, y: -40 },
];
function spillState(sp, lt) {
  const bt = CUE.crash, tc = t_wordCloses(), u = 1 - easeIO(seg(lt, tc + .06, tc + .5));
  const tt = (Math.min(lt, tc + .06) - bt - sp.d) * (lt > tc + .06 ? u : 1);
  if (tt <= 0 && sp.from === 'door') return null;
  const P = PILE[sp.kind], fl = restY(sp.kind, FL.mid, 1);
  let x0, y0;
  if (sp.from === 'pile') { const pf = restY(sp.kind, FL.mid, 1) - P.up * 36 * SS * 2.2; x0 = P.x; y0 = pf; } else { x0 = ARCH + 18; y0 = FL.mid + sp.y * 1; }
  const r = ball({ x: x0, y: y0, vx: sp.vx, vy: sp.vy, floor: fl, w: sp.w, rot: sp.from === 'pile' ? P.rot : 0, e: sp.e, fr: sp.fr, slide: sp.slide }, Math.max(0, tt));
  return { x: r[0], y: r[1], rot: r[2], rest: r[3], alpha: sp.from === 'door' ? cl01(tt / .06) * cl01(u * 6) : 1 };
}
function piecesA(lt) {
  const bt = CUE.crash, out = [];
  if (lt < bt + .001) {
    for (const q of TRIPS) { const s = deliveryState(q, lt); if (!s) continue; out.push({ z: 1, kind: q.kind, x: s.x, y: s.y, rot: s.rot, st: { a: wheelA(q.kind, s.x), spin: 1, t: lt } }); }
    const tr = tripAt('m', lt);
    if (tr && tr.phase === 'in' && tr.q.kind === 'chair') { const c = chairCentre(lt); out.push({ z: 2.6, kind: 'chair', x: c[0], y: c[1], rot: 0, st: { a: wheelA('chair', c[0]) } }); }
  } else {
    for (const sp of SPILL) { const s = spillState(sp, lt); if (!s) continue; out.push({ z: 2, kind: sp.kind, x: s.x, y: s.y, rot: s.rot, st: { a: wheelA(sp.kind, s.x), spin: s.rest ? 0 : 1, t: lt, alpha: s.alpha, slosh: s.rest ? 0 : 1 } }); }
  }
  return out;
}

// ------------------------------------------------------------------ SHOT A: the camera, the world, the dust
const A_CAM = lt => ({ z: lerp(1.58, 1.74, easeOut(seg(lt, 0, 5.6))), x: 800, y: 768 });
const LAND = {};   /* when each delivered piece first comes to rest */
function landTime(q) {
  if (LAND[q.kind] != null) return LAND[q.kind];
  let t = q.t + .05; for (; t < q.t + 2; t += .02) { const s = deliveryState(q, t); if (s && s.rest) break; }
  return (LAND[q.kind] = t);
}
function effectsA(lt) {
  const bt = CUE.crash;
  for (const q of TRIPS) { const tl = landTime(q), P = PILE[q.kind]; if (lt > tl && lt < tl + .7) { const s = deliveryState(q, lt); puff(s.x, FL.mid - 8, (lt - tl) / .7, { r: 30, seed: q.t * 3, n: 4, a: .5 }); } }
  /* the burst: a shock ring, a billow of dust from the arch */
  if (lt >= bt && lt < bt + 1.2) {
    puff(ARCH - 20, FL.mid - 40, (lt - bt) / 1.2, { r: 74, seed: 3, n: 9, a: .6 });
    puff(ARCH - 120, FL.mid - 12, (lt - bt - .1) / 1.2, { r: 60, seed: 8, n: 7, a: .5 });
    ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(ARCH, FL.mid - 70, (lt - bt) / .5, { r0: 20, r1: 260, lw: 7, alpha: .7, color: '255,236,200' }); ctx.restore();
  }
  if (lt >= bt && lt < bt + .35) V2.glow(ARCH, FL.mid - 70, 200, '255,226,170', .5 * (1 - (lt - bt) / .35), 'screen', .4);
}
function drawShotA(lt) {
  const rooms = roomsA(lt);
  S14.back(lt, { rooms, t: lt });
  drawHatch(lt);
  const items = [];
  for (const p of piecesA(lt)) items.push({ z: p.z, fn: () => { floorShadow(p.x, FL.mid - 2, 34, .22); jdraw(p.kind, p.x, p.y, p.rot, jsc(p.kind), p.st); } });
  const m = mangoA(lt), c = clemA(lt), l = lemonA(lt);
  if (m) items.push({ z: 3, fn: () => drawChar(m) });
  if (c) items.push({ z: c.y < FL.mid - 100 ? 2.9 : 3.1, fn: () => drawChar(c) });
  if (l) items.push({ z: 3.2, fn: () => drawChar(l) });
  items.sort((a, b) => a.z - b.z);
  for (const it of items) it.fn();
  S14.front(lt, { rooms });
  effectsA(lt);
}

// ------------------------------------------------------------------ SHOT D: THE CAMERA TRAP (12.64 to 14.10). A corner camera in the med room, drawn as its own flat set (grey values: the grade turns it night-vision green).
const TRAP = { cut: 12.64, counter: 1150 };
const PENX = [610, 730, 850, 970], PENY = 1128, NPEN = 4;          /* the five pens lie on the counter, a paper flag standing up from each */
const OLDLAB = ['6/12', 'MAR', '?', 'EXP'];
let trapBG = null;
function buildTrapBG() {
  const cv = V2.mk(W, 1400), g = cv.getContext('2d'), prev = ctx; ctx = g;
  try {
    ctx.fillStyle = g2(0, 0, 0, 1150, [[0, '#364148'], [.5, '#566269'], [1, '#6c797f']]); ctx.fillRect(0, 0, W, 1400);
    /* the ceiling band and its tube light */
    ctx.fillStyle = '#3a454b'; ctx.fillRect(0, 0, W, 150); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(0, 150, W, 4);
    ctx.fillStyle = '#f2ffe9'; rr(220, 62, 640, 36, 14); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(240, 68, 600, 6);
    /* subway tile, lower wall */
    ctx.fillStyle = '#a3afb6'; ctx.fillRect(0, 540, W, 612);
    ctx.strokeStyle = 'rgba(70,82,90,.55)'; ctx.lineWidth = 2;
    for (let y = 540; y <= 1150; y += 38) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let r = 0; r < 16; r++) for (let x = (r % 2) * 38; x < W; x += 76) { ctx.beginPath(); ctx.moveTo(x, 540 + r * 38); ctx.lineTo(x, 578 + r * 38); ctx.stroke(); }
    ctx.fillStyle = '#c6d0d5'; ctx.fillRect(0, 534, W, 10);
    /* wall cabinets, left: three glass-front doors with the boxes inside */
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 176, y = 190;
      ctx.fillStyle = g2(x, y, x + 160, y + 300, [[0, '#d9e0e4'], [1, '#aab5bb']]); rr(x, y, 160, 300, 8); ctx.fill(); outline(3.4); ctx.stroke();
      ctx.fillStyle = '#e9f4f8'; rr(x + 16, y + 20, 128, 200, 5); ctx.fill(); outline(2.4); ctx.stroke();
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { ctx.fillStyle = ['#7f8d96', '#b9c4ca', '#5d6b74'][(r + c + i) % 3]; ctx.fillRect(x + 26 + c * 38, y + 40 + r * 84, 30, 56); }
      ctx.fillStyle = '#8f9ba2'; ctx.fillRect(x + 16, y + 118, 128, 4);
      ctx.fillStyle = '#5a666d'; rr(x + 62, y + 246, 36, 12, 5); ctx.fill();
    }
    /* the fridge, right: a tall white body, a glass door lit from inside, three shelves, a vented base */
    ctx.fillStyle = g2(0, 170, 0, 1150, [[0, '#eef3f5'], [1, '#c3ced4']]); rr(640, 160, 372, 992, 16); ctx.fill(); outline(4); ctx.stroke();
    ctx.fillStyle = '#233037'; rr(664, 232, 324, 660, 10); ctx.fill();
    ctx.fillStyle = g2(0, 240, 0, 880, [[0, '#f6fdff'], [1, '#c9e3ea']]); rr(672, 240, 308, 644, 6); ctx.fill();
    for (const sy of [380, 560, 736]) { ctx.fillStyle = '#aebcc3'; ctx.fillRect(672, sy, 308, 8); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(672, sy + 8, 308, 10); }
    for (const [sy, n] of [[300, 9], [480, 8], [656, 9], [820, 7]]) for (let i = 0; i < n; i++) { ctx.fillStyle = ['#6e7e87', '#e9eff2', '#9aa8b0', '#4f5e66'][(i + sy) % 4]; ctx.fillRect(684 + i * 33, sy + 22 - ((i * 7) % 14), 24, 52 + ((i * 5) % 12) - 12); outline(2); ctx.strokeRect(684 + i * 33, sy + 22 - ((i * 7) % 14), 24, 52 + ((i * 5) % 12) - 12); }
    ctx.fillStyle = '#9fb0b8'; rr(1000, 460, 8, 180, 4); ctx.fill(); ctx.fillStyle = '#2f3b42'; rr(676, 176, 120, 40, 8); ctx.fill(); ctx.fillStyle = '#9dffb0'; rr(686, 184, 60, 24, 4); ctx.fill();
    ctx.fillStyle = '#4a565d'; ctx.fillRect(664, 920, 324, 220); ctx.strokeStyle = '#2c363c'; ctx.lineWidth = 6; for (let y = 940; y < 1130; y += 24) { ctx.beginPath(); ctx.moveTo(680, y); ctx.lineTo(972, y); ctx.stroke(); }
    /* the sink, left: a basin in the counter, a swan-neck tap, a pump bottle and a red sharps bin on the wall */
    ctx.fillStyle = '#dfe7ea'; rr(70, 1040, 320, 112, 8); ctx.fill(); outline(3); ctx.stroke();
    ctx.fillStyle = '#9aa7ae'; rr(110, 1060, 240, 60, 22); ctx.fill();
    tube(230, 1052, 230, 1000, 14); tube(230, 1000, 262, 982, 12); tube(262, 982, 262, 1006, 12);
    ctx.fillStyle = '#e9f2f5'; rr(420, 1018, 36, 94, 8); ctx.fill(); outline(3); ctx.stroke(); ctx.fillStyle = '#7a8890'; rr(430, 996, 16, 26, 4); ctx.fill();
    ctx.fillStyle = '#cfd8dc'; rr(480, 560, 120, 130, 12); ctx.fill(); outline(3.4); ctx.stroke(); ctx.fillStyle = '#4b585f'; rr(500, 590, 80, 44, 8); ctx.fill();
  } finally { ctx = prev; }
  return cv;
}
const PEN_SC = 1.0;
function artPen() {
  ctx.fillStyle = g2(0, -13, 0, 13, [[0, '#ffffff'], [1, '#aab6bd']]); rr(-52, -12, 104, 24, 10); ctx.fill(); outline(3); ctx.stroke();
  ctx.fillStyle = '#39454c'; rr(-60, -14, 36, 28, 8); ctx.fill(); outline(3); ctx.stroke();
  ctx.fillStyle = '#8fd0e6'; rr(-2, -6, 34, 12, 4); ctx.fill(); outline(2); ctx.stroke(); ctx.fillStyle = '#233037'; for (let i = 0; i < 4; i++) ctx.fillRect(4 + i * 8, -5, 2, 10);
  ctx.fillStyle = '#2a343a'; rr(50, -8, 14, 16, 5); ctx.fill(); outline(2.4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-20, -9, 70, 3);
}
/* a pen's flag: paper on a stalk, drawn as shapes (its string is drawn live, last) */
function drawFlag(x, y, w = 108, h = 58, ink = 0) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(x - w / 2 + 3, y - h + 5, w, h, 5); ctx.fill();
  ctx.fillStyle = g2(0, y - h, 0, y, [[0, '#ffffff'], [1, '#e1e7ea']]); rr(x - w / 2, y - h, w, h, 5); ctx.fill(); outline(2.8); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x - w / 2 + 6, y - h + h * .7, w - 12, 2);
  ctx.fillStyle = '#d9dee2'; ctx.fillRect(x - 6, y - 2, 12, 12); outline(2); ctx.strokeRect(x - 6, y - 2, 12, 12);
  ctx.restore();
}

/* the marker: a fat black marker in the fist, its tip at (+24, +20) from the hand (local units), the cap on the other end */
EXT.prop.fp14b_marker = (side, o, t) => {
  ctx.save(); ctx.rotate(.72 * side * 1);
  ctx.fillStyle = INK; rr(-8, -48, 16, 52, 6); ctx.fill();
  ctx.fillStyle = g2(-8, 0, 8, 0, [[0, '#f4f4f6'], [1, '#aeb2bd']]); rr(-6, -44, 12, 40, 5); ctx.fill();
  ctx.fillStyle = '#e8403f'; ctx.fillRect(-6, -34, 12, 9);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(2.4, 17); ctx.lineTo(-2.4, 17); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a2630'; rr(-9, -52, 18, 14, 4); ctx.fill(); outline(2.2); ctx.stroke();
  ctx.restore();
};
PROP_BOX.fp14b_marker = [-30, -60, 30, 30];

// ------------------------------------------------------------------ SHOT D: Clementine dates the pens; the second shutter catches her looking into the lens
const T_SCR0 = () => CUE.scribble, T_PEN = .17;             /* the marker reaches pen i at scribble + i x .17 */
const PEN_T = i => T_SCR0() + i * T_PEN;
function clemTrap(lt) {
  const sc0 = T_SCR0(), sh2 = CUE.shutter2, k = seg(lt, sc0, sc0 + 4 * T_PEN + .1), s = 1.2;
  const bx = lerp(420, 704, easeIO(k));                       /* she shuffles along the counter as she writes */
  const caught = lt >= sh2 - .26;
  const o = mkClem({ x: bx, y: 1166, s, t: lt, expr: caught ? 'shock' : 'hopeful', look: caught ? [0, .05] : lt < sc0 ? [-.95, .15] : [.3, .55], arms: { l: 'hips', r: 'reach' }, hold: { r: 'fp14b_marker' }, hand: {}, acc: ['steth', 'badge7'] });
  /* the marker tip rides along the flags (tip is 29 px right of and 24 px below the hand at this scale) */
  let tx, ty;
  if (lt < sc0) { tx = PENX[0] - 36; ty = PENY - 96; }
  else { const u = clamp((lt - sc0) / T_PEN, 0, NPEN - .6), i = Math.min(NPEN - 1, Math.floor(u)), f = u - i; tx = PENX[i] - 36 + 72 * easeIO(Math.min(1, f * 1.2)) + (i === 4 ? 0 : 0); ty = PENY - 66 + 4 * Math.sin(lt * 70); if (lt > sc0 + NPEN * T_PEN + .02) { tx = PENX[NPEN - 1] + 20; ty = PENY - 130 - 30 * easeOut(seg(lt, sc0 + NPEN * T_PEN + .02, sh2)); } }
  o.grip = { r: gripFor(o, 'r', tx - 29, ty - 24) };
  if (caught) { o.arms = { l: 'up', r: 'reach' }; o.squash = .04; o.browUp = 4; }
  o.noLegs = false;
  return o;
}
/* a flag: the old label, the scribble over it, then TODAY typed in */
function flagStates(lt) {
  return PENX.map((x, i) => { const t = PEN_T(i), scrib = sstep(lt, t - .03, t) * (1 - sstep(lt, t + .06, t + .1)), reveal = seg(lt, t + .02, t + .12); return { x, i, old: lt < t - .02, blob: scrib, reveal }; });
}
function drawTrapWorld(lt) {
  if (!trapBG) trapBG = buildTrapBG();
  ctx.drawImage(trapBG, 0, 0);
  /* the fridge's light spills onto the wall; the IR lamp lights the middle of the frame */
  V2.glow(826, 520, 560, '200,255,215', .34, 'screen', .3);
  V2.glow(500, 760, 760, '170,255,190', .22, 'screen', .2);
  V2.setLight({ key: [0, -.8], keyColor: '#dfffe6', keyA: .34, shadowA: .5, rim: '#9affb0', rimA: .5, amb: '#c8ffd0', ambA: .04 });
  for (let i = 0; i < NPEN; i++) { floorShadow(PENX[i], PENY + 14, 56, .4); }
    for (let i = 0; i < NPEN; i++) { ctx.save(); ctx.translate(PENX[i], PENY); ctx.rotate(-.04 + .08 * hash(i * 3)); ctx.scale(.9, .9); artPen(); ctx.restore(); drawFlag(PENX[i], PENY - 12); }
  const c = clemTrap(lt); drawChar(c);
  /* the counter front, over her legs: a cabinet front with drawers, and the worktop edge */
  const cy = TRAP.counter;
  ctx.fillStyle = g2(0, cy, 0, cy + 260, [[0, '#8a969d'], [1, '#5b676e']]); ctx.fillRect(-60, cy, W + 120, 900);
  ctx.fillStyle = '#e8eef1'; ctx.fillRect(-60, cy - 14, W + 120, 22); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-60, cy - 14, W + 120, 4);
  ctx.strokeStyle = 'rgba(30,40,46,.7)'; ctx.lineWidth = 4; for (const x of [0, 270, 540, 810, 1080]) { ctx.beginPath(); ctx.moveTo(x, cy + 8); ctx.lineTo(x, cy + 760); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-60, cy + 150); ctx.lineTo(W + 60, cy + 150); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-60, cy + 300); ctx.lineTo(W + 60, cy + 300); ctx.stroke();
  ctx.fillStyle = '#4a565d'; for (const x of [135, 405, 675, 945]) { rr(x - 28, cy + 70, 56, 12, 6); ctx.fill(); rr(x - 28, cy + 210, 56, 12, 6); ctx.fill(); }
  /* the writing, LAST: every string is drawn over everything (nothing can cover it). Old labels are dressing, TODAY is the joke. */
  const st = flagStates(lt);
  for (const f of st) {
    const y = PENY - 12 - 29;
    if (f.old) UI.label(OLDLAB[f.i], f.x, y, { size: 24, weight: 900, fill: '#3b4a53', hero: false, italic: true, maxW: 96 });
    else if (f.blob > .01) { ctx.save(); ctx.globalAlpha = f.blob; ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.x - 46, y + 8); for (let q = 0; q < 6; q++) ctx.lineTo(f.x - 46 + q * 18.4, y + (q % 2 ? -12 : 12)); ctx.stroke(); ctx.restore(); }
    if (f.reveal > 0) UI.label('TODAY', f.x, y, { size: 24, weight: 900, spacing: .5, fill: '#0a1a10', reveal: f.reveal, maxW: 98 });
  }
}

const trapFx = lt => ({ bloom: .55, vignette: .78, grain: .17, contrast: .46, sat: 0, tint: [['#2dff6e', 1, 'color'], ['#031c0c', .16, 'multiply']] });
function trapOver(lt) {
  trapOverlay(lt, { cut: TRAP.cut });
  const c = clemTrap(lt), sh2 = CUE.shutter2;
  trapFlash(lt, CUE.shutter1); trapFlash(lt, sh2);
  const m = ctx.getTransform(), k = 1.25;   /* the MOTION frame follows her in screen space: the world is drawn at the trap camera's zoom */
  const sx = x => 540 + (x - 640) * k, sy = y => 960 + (y - 900) * k;
  trapHUD(lt, { t0: TRAP.cut, box: [sx(c.x - 150), sy(744), sx(c.x + 150), sy(1140)], caught: lt >= sh2 });
}

// DEV tail: the trap shot alone (lt 12.6 to 14.1)
const SC = {
  shot: lt => 'd',
  cam(lt) { zoomTo(640, 900, 1.25 + .03 * seg(lt, TRAP.cut, 14.1)); },
  draw(lt) { drawTrapWorld(lt); },
  fx: trapFx,
  blur: lt => 1,
  over(lt) { trapOver(lt); },
};
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.adapt = SC;
})();
