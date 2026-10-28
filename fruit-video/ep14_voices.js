'use strict';
/* SHIFT HAPPENS, Episode 14, scene `voices` (24.658 s, 3:40 PM, THE RESIDENTS): the State finally listens. Registers window.__EP14_SCENES.voices. Everything is a pure function of the scene time `lt`.
 *
 * THE LOOK. A documentary interview in the dining room, in the afternoon sun: peach walls, a green chalkboard menu, a window with orange curtains and the State's white sedan in the lot, slatted chairs, a tray cart and
 * a red gingham cloth (the same room as the dollhouse's `dining` cell, built full frame). Long-lens close-ups with a creamy background (V2.dof on the room only, never on a character), a warm key from the window and a
 * cool rim, dust in the sun, a lower third in the field-guide design for each speaker the first time we see them. Nobody ever looks into the lens until the chorus.
 * THE SET (flat elevation, scene px at zoom 1). Back wall: menu board left, window right of centre (x 405..735, sun from behind), clock, bunting, tray cart far right. The staff stand against the back wall at the right of
 * the menu board; the interview table runs across the room in front: Kumquat (on a stack of binders) and Stateman (on the tall chair) at its left end, then Cranberry, Pear, Goji; Mr. Banana stands at the right end with his
 * walker and one foot in a cast. Seated people are drawn in `center` mode (the table hides the rest of them); the door to the station is in the LEFT wall, outside the main view (the staff exit left, past the Kumquat).
 * Close-ups shift the whole room down a little (a lower camera: the window glows behind the face instead of the floor), each shot has its own cast list, so nobody is ever cut by an edge or half in focus.
 * SHOT LIST (scene-local seconds): wide 0 (the room, the Kumquat's recorder, the staff in a row) | file 1.0 (the staff file out past the Kumquat's pointing pencil) | straw 3.77 (Strawberry last, reluctant: "Alone.") |
 *   st2 4.565 (Stateman, a held eyebrow) | cr1 6.731 (Mrs. Cranberry, the radio from 1962) | smile 10.14 (Stateman's tiny smile) | pr1 10.62 (Mr. Pear and his contract) | b1 14.089 (Mr. Banana, thumbs up, the cast) |
 *   st3 16.282 (a page turns, the pen is poised) | goji 17.75 ("water") | ra4 18.593 (the four residents turn to the lens on "Give") | door 20.5 (the glass door: Strawberry's ear, the Kumquat's blind) |
 *   st4 22.903 ("Noted.") | clip 23.5 (the pen writes F-9 on the form: strokes only, no text).
 * TEXT. Lower thirds in over() (hero), the chalkboard menu and the contract (hero:false, drawn live, never in a cache). */
(() => {
if (!window.TIMELINE_EP14) return;
const A7 = window.A7, A10 = window.A10, A11 = window.A11, A14 = window.A14, S14 = window.S14;
if (!A7 || !A10 || !A11 || !A14) return;
const { zoomTo } = window.H6;
const { rgba, mix } = V2;

// ------------------------------------------------------------------ small helpers
const cl01 = x => Math.max(0, Math.min(1, x));
const sk = (t, a, b) => { const k = cl01((t - a) / (b - a)); return k * k * (3 - 2 * k); };   /* smoothstep over [a, b] */
const inR = (t, a, b) => t >= a && t < b;
const pulse = (lt, t0, d) => lt < t0 || lt > t0 + d ? 0 : Math.sin((lt - t0) / d * PI);        /* one hump */
const damp = (lt, t0, hz = 14, tau = .18) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);   /* a wobble after a hit */
const sr = (i, s = 0) => hash(i * 3.17 + s * 11.3 + 1.3);
/* keyframes [[t, v], ...] (v a number or an array), smooth between keys */
const track = (keys, lt) => {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = sk(lt, a[0], b[0]);
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
};
const lin = (keys, lt) => {   /* the same, linear between keys */
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = cl01((lt - a[0]) / (b[0] - a[0])); return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k); }
  return keys[keys.length - 1][1];
};

// the spoken lines, scene-local (frozen timeline): W(id, i) = the start of word i of line id, E(id) = the end of the line
let LN = null;
const lines = () => {
  if (LN && LN.stamp === TL) return LN;
  const sc = TL.scenes.find(s => s.id === 'voices'), o = { stamp: TL };
  for (const l of TL.lines) if (l.scene === 'voices') o[l.id] = { s: l.s - sc.start, e: l.e - sc.start, w: l.words.map(w => [w[0], l.s - sc.start + w[1], l.s - sc.start + w[2]]) };
  LN = o; return o;
};
const W0 = (id, i = 0) => { const l = lines()[id]; return l ? (l.w[Math.min(i, l.w.length - 1)] || [0, l.s])[1] : 0; };
const E0 = id => { const l = lines()[id]; return l ? l.e : 0; };

// ------------------------------------------------------------------ colours: the dollhouse's dining room (peach walls, brown wainscot, cream and tan checks, orange curtains, red gingham) and the documentary graphics
const C = {
  wall: '#f0cca4', wallDk: '#e2b88a', side: '#c89e76', ceil: '#fbf0e2', base: '#6a4a34', trim: '#fff7ec', wains: '#a8724c', rail: '#ebcba2', floorA: '#f6e8c8', floorB: '#dcbc8c',
  board: '#35574a', frame: '#8a5a34', curtain: '#f1a05a', chair: '#9a6a44', cloth: '#f6f0e0', check: 'rgba(214,72,72,.30)',
  cream: '#f2e8cf', forest: '#24402e', ochre: '#c98b2c', ink: '#1d1a16', red: '#c23a2b', slate: '#33527a', gold: '#ffd9a0',
};
const OUT = 'rgba(34,18,36,.84)';

// ------------------------------------------------------------------ expression presets (read by v2_char: ang, raise, curve, lid, wide, pup, asym, bags, arch); the acting adds per-frame o.face on top
EXPR.fp14v_stiff = { ang: -.05, raise: 7, curve: .95, lid: .04, wide: 1.06, pup: .95 };       /* the staff's school-photo smile */
EXPR.fp14v_tender = { ang: -.2, raise: 6, curve: .9, lid: .22, wide: 1.03, pup: 1.14 };       /* Mrs. Cranberry, lucid and loving */
EXPR.fp14v_certain = { ang: .1, raise: 3, curve: .5, lid: .3, wide: 1, pup: 1 };              /* Mr. Pear, total certainty */
EXPR.fp14v_beam = { ang: -.16, raise: 9, curve: 1, lid: 0, wide: 1.06, pup: 1.06 };           /* Mr. Banana, cheerful */
EXPR.fp14v_blank = { ang: 0, raise: 0, curve: .12, lid: .34, wide: 1, pup: .9 };              /* Mr. Goji, staring at the pitcher */
EXPR.fp14v_hear = { ang: -.3, raise: 12, curve: -.15, lid: .06, wide: 1.1, pup: .86 };        /* Strawberry, straining to hear */
EXPR.fp14v_flat = { ang: 0, raise: 0, curve: -.06, lid: .42, wide: .98, pup: .9 };            /* Strawberry, hearing nothing */
EXPR.fp14v_grave = { ang: .38, raise: 0, curve: -.4, lid: .08, wide: 1.1, pup: 1 };           /* the Kumquat, with great seriousness */
EXPR.fp14v_hush = { ang: -.12, raise: 5, curve: .35, lid: .18, wide: 1, pup: 1.05 };          /* a resident, listening */

// ------------------------------------------------------------------ cached static art: a canvas drawn once in scene units (no text is ever drawn into one: the gate cannot audit it)
const CACHE = {};
function art(key, w, h, k, fn) {
  let c = CACHE[key];
  if (!c) {
    c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
    const g = c.getContext('2d'); g.scale(k, k);
    const prev = ctx; ctx = g;
    try { fn(); } finally { ctx = prev; }
    CACHE[key] = c;
  }
  return c;
}
/* drawing shorthands (the dollhouse's rounded, outlined style) */
const rbox = (x, y, w, h, fill, o = {}) => {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, o.r ?? Math.min(8, h / 3, w / 3));
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (o.lw !== 0) { ctx.strokeStyle = o.stroke || OUT; ctx.lineWidth = o.lw ?? 2.4; ctx.lineJoin = 'round'; ctx.stroke(); }
};
const seg1 = (x0, y0, x1, y1, col, lw = 2, cap = 'round') => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
const disc = (x, y, rx, ry, fill, stroke, lw = 2) => {
  ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
};
const shade = (c, f) => rgba(mix(c, '#000000', 1 - f), 1);
const lift = (c, f) => rgba(mix(c, '#ffffff', f), 1);
const vgrad = (y0, y1, a, b) => V2.grad(0, y0, 0, y1, [[0, a], [1, b]]);
const hgrad = (x0, x1, a, b) => V2.grad(x0, 0, x1, 0, [[0, a], [1, b]]);
/*@@PARTS@@*/

// ------------------------------------------------------------------ layout (scene px at zoom 1; 1 px = 1 screen px in the wide shot)
const SR = .70, SS = .64, SK = SR * .72;                 /* adult scale at the table, staff scale against the back wall (they stand further away) */
const YC = 974;                            /* the body-centre line of the seated residents (center mode: the table hides the rest of them) */
const TB = { x0: 22, x1: 876, far: YC + 44, near: YC + 118, hem: YC + 206 };   /* the table: far edge and near edge of the top, hem of the cloth */
const WB = 944;                            /* the foot of the back wall: the floor starts here */
const FS = 902;                            /* the staff's feet */
const X = { kum: 116, star: 272, cran: 484, pear: 648, goji: 776, banana: 916 };   /* where everybody sits or stands */
const YSIT = YC - 34;                      /* the residents sit tall (a cushion): the table's far edge stays below their mouths */
const YSTAR = YC - 40, YKUM = YC + 8;      /* Stateman sits on the tall chair, the Kumquat on a stack of binders */
const BAN_FEET = 1142;                     /* Mr. Banana stands a little nearer than the table's back, his walker in front of him */
const WIN = { x0: 440, x1: 770, y0: 432, y1: 896 };   /* the window glass */
const MENU = { x: 38, y: 484, w: 282, h: 204 };       /* the chalkboard menu */
const CLOCK = { x: 1000, y: 648, r: 42 };
const WX0 = -260, WW = 1600, WH = 1960;                /* the cached back layer covers x -260..1340, y 0..1960 */

// ------------------------------------------------------------------ the back wall: ceiling, peach wall with soft stripes, brown wainscot, baseboard, checker floor
function paintWall() {
  const x0 = WX0, x1 = WX0 + WW;
  ctx.fillStyle = C.ceil; ctx.fillRect(x0, 0, WW, 238);
  ctx.fillStyle = vgrad(196, 238, 'rgba(120,70,40,0)', 'rgba(120,70,40,.18)'); ctx.fillRect(x0, 196, WW, 42);
  ctx.fillStyle = vgrad(238, WB, '#f6d6ae', C.wall); ctx.fillRect(x0, 238, WW, WB - 238);
  for (let x = x0 - 30; x < x1; x += 112) { ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, 238, 56, WB - 238); }
  for (let x = x0 - 30; x < x1; x += 112) { ctx.fillStyle = 'rgba(190,120,70,.05)'; ctx.fillRect(x + 56, 238, 56, WB - 238); }
  seg1(x0, 238, x1, 238, 'rgba(110,60,36,.4)', 3, 'butt'); seg1(x0, 243, x1, 243, 'rgba(255,255,255,.45)', 2, 'butt');
  // wainscot: a cream rail, brown raised panels, a dark baseboard with a cream trim
  const wt = WB - 100;
  ctx.fillStyle = C.wains; ctx.fillRect(x0, wt, WW, 100);
  for (let x = x0 + 6; x < x1; x += 82) {
    ctx.fillStyle = shade(C.wains, .9); ctx.beginPath(); ctx.roundRect(x + 8, wt + 18, 62, 58, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,180,.32)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 9, wt + 76); ctx.lineTo(x + 9, wt + 19); ctx.lineTo(x + 69, wt + 19); ctx.stroke();
    ctx.strokeStyle = 'rgba(50,24,14,.4)'; ctx.beginPath(); ctx.moveTo(x + 70, wt + 20); ctx.lineTo(x + 70, wt + 76); ctx.lineTo(x + 10, wt + 76); ctx.stroke();
  }
  rbox(x0, wt - 4, WW, 12, C.rail, { r: 3, lw: 2 });
  ctx.fillStyle = C.base; ctx.fillRect(x0, WB - 20, WW, 20); seg1(x0, WB - 20, x1, WB - 20, C.trim, 3, 'butt'); seg1(x0, WB, x1, WB, 'rgba(34,18,36,.7)', 3, 'butt');
  // the room's light: the ends of the wall fall away
  ctx.fillStyle = hgrad(x0, x0 + 420, 'rgba(90,50,30,.22)', 'rgba(90,50,30,0)'); ctx.fillRect(x0, 238, 420, WB - 238);
  ctx.fillStyle = hgrad(x1 - 420, x1, 'rgba(90,50,30,0)', 'rgba(90,50,30,.22)'); ctx.fillRect(x1 - 420, 238, 420, WB - 238);
}
function paintFloor() {
  const VPX = 540, VPY = 360, kk = y => (y - VPY) / (WB - VPY);
  const ys = [WB]; let d = 34; for (let i = 0; i < 11; i++) { ys.push(ys[i] + d); d *= 1.27; }
  ctx.fillStyle = C.floorB; ctx.fillRect(WX0, WB, WW, WH - WB);
  for (let r = 0; r < ys.length - 1; r++) {
    const ya = ys[r], yb = ys[r + 1], ka = kk(ya), kb = kk(yb);
    for (let i = -34; i < 34; i++) {
      if ((i + r) % 2) continue;
      ctx.fillStyle = C.floorA; ctx.beginPath(); ctx.moveTo(VPX + i * 80 * ka, ya); ctx.lineTo(VPX + (i + 1) * 80 * ka, ya); ctx.lineTo(VPX + (i + 1) * 80 * kb, yb); ctx.lineTo(VPX + i * 80 * kb, yb); ctx.closePath(); ctx.fill();
    }
  }
  ctx.strokeStyle = 'rgba(120,84,44,.28)'; ctx.lineWidth = 1.6;
  for (const y of ys) { ctx.beginPath(); ctx.moveTo(WX0, y); ctx.lineTo(WX0 + WW, y); ctx.stroke(); }
  for (let i = -34; i <= 34; i++) { ctx.beginPath(); ctx.moveTo(VPX + i * 80, WB); ctx.lineTo(VPX + i * 80 * kk(ys[ys.length - 1]), ys[ys.length - 1]); ctx.stroke(); }
  ctx.fillStyle = vgrad(WB, WH, 'rgba(255,236,190,.0)', 'rgba(80,44,24,.34)'); ctx.fillRect(WX0, WB, WW, WH - WB);
  ctx.fillStyle = vgrad(WB, WB + 70, 'rgba(60,30,16,.28)', 'rgba(60,30,16,0)'); ctx.fillRect(WX0, WB, WW, 70);   /* the wall's contact shadow on the floor */
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ the chalkboard menu (the writing is live: see menuText), the window with orange curtains and the State's sedan in the lot, the tray cart, bunting, pictures, bowl lamps
function paintMenu() {
  const { x, y, w, h } = MENU;
  ctx.save(); ctx.shadowColor = 'rgba(60,30,10,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; rbox(x, y, w, h, C.frame, { r: 8, lw: 3 }); ctx.restore();
  ctx.strokeStyle = 'rgba(255,214,160,.32)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 5, y + h - 8); ctx.lineTo(x + 5, y + 8); ctx.lineTo(x + w - 8, y + 5); ctx.stroke();
  rbox(x + 12, y + 12, w - 24, h - 24, vgrad(y + 12, y + h - 12, '#3d6454', '#2a4a3c'), { r: 4, lw: 2.4 });
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.ellipse(x + w * .5, y + h * .55, 100, 46, .25, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.beginPath(); ctx.ellipse(x + w * .3, y + h * .3, 60, 22, -.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(244,240,222,.42)'; ctx.lineWidth = 2.4; ctx.setLineDash([9, 7]); ctx.beginPath(); ctx.roundRect(x + 22, y + 22, w - 44, h - 44, 3); ctx.stroke(); ctx.setLineDash([]);
  rbox(x + 16, y + h - 6, w - 32, 13, '#6a4424', { r: 3, lw: 2 });
  rbox(x + w - 98, y + h - 14, 34, 9, '#f6f0e0', { r: 2, lw: 1.6 }); rbox(x + 60, y + h - 18, 40, 13, '#c4a070', { r: 3, lw: 1.6 });
}
function paintWindow() {
  const { x0, y0, x1, y1 } = WIN, w = x1 - x0, h = y1 - y0;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = V2.grad(0, y0, 0, y1, [[0, '#69aee8'], [.55, '#c8e5f8'], [1, '#e6f2ec']]); ctx.fillRect(x0, y0, w, h);
  for (const [cx, cy, r] of [[.2, .16, 1], [.62, .1, .8], [.82, .3, .7], [.4, .34, .6]]) { ctx.fillStyle = 'rgba(255,255,255,.88)'; disc(x0 + w * cx, y0 + h * cy, 40 * r, 14 * r); disc(x0 + w * cx + 26 * r, y0 + h * cy - 8 * r, 28 * r, 14 * r); disc(x0 + w * cx - 28 * r, y0 + h * cy - 3 * r, 24 * r, 11 * r); }
  ctx.fillStyle = '#9ccfa6'; ctx.beginPath(); ctx.moveTo(x0, y1 - 150); ctx.quadraticCurveTo(x0 + w * .3, y1 - 230, x0 + w * .55, y1 - 160); ctx.quadraticCurveTo(x0 + w * .8, y1 - 215, x1, y1 - 140); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.fill();
  for (const [tx, ty, tr] of [[.1, .66, 1.05], [.88, .62, 1.2], [.3, .72, .8]]) {
    seg1(x0 + w * tx, y0 + h * (ty + .18), x0 + w * tx, y0 + h * ty, '#6a4a2e', 8 * tr, 'butt');
    disc(x0 + w * tx, y0 + h * ty - 30 * tr, 46 * tr, 38 * tr, '#5fae5f'); disc(x0 + w * tx - 22 * tr, y0 + h * ty - 14 * tr, 28 * tr, 24 * tr, '#79c576'); disc(x0 + w * tx + 20 * tr, y0 + h * ty - 42 * tr, 26 * tr, 22 * tr, '#4a9a55');
  }
  ctx.fillStyle = '#8f949c'; ctx.fillRect(x0, y1 - 88, w, 90);   /* the lot, and the State's white sedan parked in it */
  for (const lx of [x0 + 20, x0 + 150, x0 + 280]) seg1(lx, y1 - 80, lx + 26, y1 - 12, 'rgba(255,255,255,.55)', 5, 'butt');
  { const cx = x0 + w * .56, cy = y1 - 30;
    ctx.fillStyle = 'rgba(40,40,50,.3)'; disc(cx, cy + 22, 66, 8);
    rbox(cx - 62, cy - 24, 124, 38, '#f4f6f8', { r: 14, lw: 2 });
    ctx.fillStyle = '#f4f6f8'; ctx.beginPath(); ctx.moveTo(cx - 38, cy - 24); ctx.lineTo(cx - 24, cy - 48); ctx.lineTo(cx + 26, cy - 48); ctx.lineTo(cx + 44, cy - 24); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#9fb8cc'; ctx.beginPath(); ctx.moveTo(cx - 30, cy - 26); ctx.lineTo(cx - 20, cy - 44); ctx.lineTo(cx + 22, cy - 44); ctx.lineTo(cx + 36, cy - 26); ctx.closePath(); ctx.fill();
    seg1(cx - 2, cy - 44, cx - 2, cy - 26, '#f4f6f8', 4, 'butt');
    ctx.fillStyle = C.slate; ctx.fillRect(cx - 30, cy - 12, 56, 9);   /* the slate door panel */
    for (const wx of [-36, 38]) { disc(cx + wx, cy + 14, 11, 11, '#2a2630', OUT, 2); disc(cx + wx, cy + 14, 4, 4, '#aab2bc'); }
    disc(cx - 4, cy - 8, 3.4, 3.4, '#f4d982'); }
  const gl = ctx.createRadialGradient(x1 - 50, y0 + 70, 10, x1 - 50, y0 + 70, 260); gl.addColorStop(0, 'rgba(255,252,228,.95)'); gl.addColorStop(.5, 'rgba(255,248,210,.4)'); gl.addColorStop(1, 'rgba(255,244,200,0)');
  ctx.fillStyle = gl; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(x0 + w * .08, y0); ctx.lineTo(x0 + w * .3, y0); ctx.lineTo(x0 + w * .06, y1); ctx.lineTo(x0 - w * .16, y1); ctx.fill();
  ctx.restore();
  // frame, mullions, sill
  ctx.strokeStyle = '#f4ecda'; ctx.lineWidth = 12; ctx.strokeRect(x0 - 5, y0 - 5, w + 10, h + 10);
  seg1(x0 + w / 3, y0, x0 + w / 3, y1, '#f4ecda', 7, 'butt'); seg1(x0 + w * 2 / 3, y0, x0 + w * 2 / 3, y1, '#f4ecda', 7, 'butt'); seg1(x0, y0 + h * .44, x1, y0 + h * .44, '#f4ecda', 7, 'butt');
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(x0 - 11, y0 - 11, w + 22, h + 22); ctx.strokeRect(x0, y0, w, h);
  rbox(x0 - 20, y1 + 8, w + 40, 18, '#f4ecda', { r: 4, lw: 2.2 });
  // curtains: orange, folded, tied back; the rod and finials above
  for (const sd of [-1, 1]) {
    const ox = sd < 0 ? x0 - 100 : x1 + 100, ix = sd < 0 ? x0 + 4 : x1 - 4, top = y0 - 22, bot = y1 + 40, tie = y0 + h * .66;
    ctx.save(); ctx.beginPath(); ctx.moveTo(ox, top); ctx.lineTo(ix, top); ctx.bezierCurveTo(ix + sd * -4, y0 + h * .3, ix + sd * 12, tie - 40, ix + sd * 4, tie); ctx.bezierCurveTo(ix + sd * 26, tie + 40, ix + sd * 26, bot - 40, ix + sd * 20, bot); ctx.lineTo(ox, bot); ctx.closePath();
    ctx.fillStyle = hgrad(Math.min(ox, ix), Math.max(ox, ix), sd < 0 ? '#e88a3c' : '#f6b46a', sd < 0 ? '#f6b46a' : '#e88a3c'); ctx.fill(); ctx.clip();
    for (let i = 0; i < 6; i++) { const fx = ox - sd * (i * 20 + 8); ctx.fillStyle = 'rgba(150,60,0,.16)'; ctx.fillRect(Math.min(fx, fx - sd * 9), top, 9, bot - top); ctx.fillStyle = 'rgba(255,236,200,.18)'; ctx.fillRect(Math.min(fx - sd * 9, fx - sd * 13), top, 4, bot - top); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(ox, top); ctx.lineTo(ix, top); ctx.bezierCurveTo(ix + sd * -4, y0 + h * .3, ix + sd * 12, tie - 40, ix + sd * 4, tie); ctx.bezierCurveTo(ix + sd * 26, tie + 40, ix + sd * 26, bot - 40, ix + sd * 20, bot); ctx.lineTo(ox, bot); ctx.closePath(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.stroke();
    rbox(sd < 0 ? ix - 52 : ix - 4, tie - 7, 56, 14, '#f2e0b6', { r: 6, lw: 2 });
  }
  rbox(x0 - 134, y0 - 36, w + 268, 12, '#8a6a44', { r: 5, lw: 2.2 });
  for (const fx of [x0 - 138, x1 + 138]) disc(fx, y0 - 30, 11, 11, '#d6b06a', OUT, 2.2);
}
function paintCart() {
  const bx = 1004, top = 770, ft = WB + 8;
  ctx.fillStyle = 'rgba(40,20,10,.3)'; disc(bx, ft + 4, 62, 8);
  for (const px of [bx - 52, bx + 52]) { seg1(px, top - 8, px, ft - 12, '#8f99a6', 6); seg1(px - 1.5, top - 4, px - 1.5, ft - 14, 'rgba(255,255,255,.55)', 1.6); }
  [[top + 16, '#c9d4e0'], [top + 92, '#e6c9a0'], [top + 168, '#d8e6d0']].forEach(([sy, tc], i) => {
    rbox(bx - 60, sy + 20, 120, 8, '#8f99a6', { r: 3, lw: 1.8 }); rbox(bx - 50, sy + 10, 100, 11, tc, { r: 5, lw: 1.8 });
    ctx.beginPath(); ctx.ellipse(bx - 8 + (i % 2) * 16, sy + 8, 34, 24, 0, PI, TAU); ctx.fillStyle = '#f6f8fa'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    disc(bx - 8 + (i % 2) * 16, sy - 17, 4, 4, '#c9d0d8', OUT, 1.6); ctx.fillStyle = 'rgba(255,255,255,.5)'; disc(bx - 24 + (i % 2) * 16, sy - 2, 10, 5);
  });
  seg1(bx - 52, top - 8, bx - 74, top - 20, '#8f99a6', 5); seg1(bx - 78, top - 20, bx - 62, top - 20, '#6b7480', 6);
  for (const px of [bx - 52, bx + 52]) { disc(px, ft - 4, 9, 9, '#2a2630', OUT, 2); disc(px, ft - 4, 3.4, 3.4, '#9aa0a8'); }
}
function paintDecor() {
  // bunting: pastel flags on a drooping string between two nails, high on the wall
  const pts = (u) => [lerp(-210, 1290, u), 262 + 64 * Math.sin(u * PI) * .95 - 12 * Math.sin(u * PI * 3)];
  ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 60; i++) { const [x, y] = pts(i / 60); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  const cols = ['#f08a8a', '#f6d36a', '#8fd0b4', '#8fb4e8', '#e7a0d0', '#f6b46a'];
  for (let i = 1; i < 36; i++) { const [x, y] = pts(i / 36), [x2] = pts((i + .6) / 36); ctx.fillStyle = cols[i % 6]; ctx.beginPath(); ctx.moveTo(x - 17, y); ctx.lineTo(x + 17, y + 3); ctx.lineTo(x + 1, y + 44 + (i % 3) * 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(80,40,30,.5)'; ctx.lineWidth = 1.8; ctx.stroke(); void x2; }
  // a framed picture (a barn in a green field) above the cart, the wall clock's face (the hands are live)
  rbox(912, 478, 108, 84, '#c9a24c', { r: 4, lw: 2.4 }); ctx.fillStyle = '#f5efe0'; ctx.fillRect(920, 486, 92, 68);
  ctx.save(); ctx.beginPath(); ctx.rect(926, 492, 80, 56); ctx.clip(); ctx.fillStyle = vgrad(492, 548, '#9fd0f0', '#d8eefa'); ctx.fillRect(926, 492, 80, 56); ctx.fillStyle = '#7fbf7a'; ctx.beginPath(); ctx.moveTo(926, 532); ctx.quadraticCurveTo(966, 514, 1006, 530); ctx.lineTo(1006, 548); ctx.lineTo(926, 548); ctx.fill();
  rbox(954, 512, 26, 20, '#c0463a', { r: 2, lw: 1.6 }); ctx.fillStyle = '#7a3028'; ctx.beginPath(); ctx.moveTo(950, 513); ctx.lineTo(967, 500); ctx.lineTo(984, 513); ctx.closePath(); ctx.fill(); ctx.restore();
  const { x, y, r } = CLOCK;
  ctx.save(); ctx.shadowColor = 'rgba(60,30,10,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; disc(x, y, r + 8, r + 8, '#8a5a34', OUT, 2.6); ctx.restore();
  disc(x, y, r, r, '#fbf6e8', OUT, 2.2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; seg1(x + Math.sin(a) * (r - 4), y - Math.cos(a) * (r - 4), x + Math.sin(a) * (r - (i % 3 ? 9 : 13)), y - Math.cos(a) * (r - (i % 3 ? 9 : 13)), '#2a2630', i % 3 ? 2 : 3.4, 'butt'); }
  // two bowl lamps on short rods (the glow is live)
  for (const lx of [610, 928]) { seg1(lx, 238, lx, 262, '#8a6a44', 6); ctx.beginPath(); ctx.ellipse(lx, 276, 56, 22, 0, 0, PI); ctx.fillStyle = 'rgba(255,248,226,.96)'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.stroke(); disc(lx, 262, 56, 8, '#f3e4c0', OUT, 2); }
}
function roomBack() {
  return art('back', WW, WH, 1.25, () => { ctx.translate(-WX0, 0); paintWall(); paintFloor(); paintDecor(); paintMenu(); paintWindow(); paintCart(); });
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ the interview table: a red gingham cloth to the floor, place settings (pureed meatloaf in the shape of the mold), flowers, an empty pitcher
const TX0 = 0, TY0 = 1000, TW = 900, TH = 330;
function paintTable() {
  const { x0, x1, far, near, hem } = TB;
  ctx.fillStyle = 'rgba(40,20,10,.34)'; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, hem + 6, (x1 - x0) / 2 + 24, 20, 0, 0, TAU); ctx.fill();
  // the drape: cream with square checks, a zig-zag hem, soft folds
  const dr = new Path2D(); dr.moveTo(x0 - 4, near); dr.lineTo(x1 + 4, near); dr.lineTo(x1 + 4, hem);
  const n = 28; for (let i = 0; i <= n; i++) dr.lineTo(x1 + 4 - i * (x1 - x0 + 8) / n, hem + (i % 2 ? 0 : 7)); dr.closePath();
  ctx.save(); ctx.fillStyle = C.cloth; ctx.fill(dr); ctx.clip(dr);
  ctx.fillStyle = 'rgba(214,72,72,.22)'; for (let x = x0 - 4; x < x1 + 8; x += 32) ctx.fillRect(x, near, 16, hem - near + 10); for (let y = near; y < hem + 10; y += 32) ctx.fillRect(x0 - 4, y, x1 - x0 + 8, 16);
  for (let i = 0; i < 18; i++) { const fx = x0 + 18 + i * 49.5 + 8 * Math.sin(i * 2.1); ctx.fillStyle = vgrad(near, hem, 'rgba(90,40,30,.13)', 'rgba(90,40,30,.20)'); ctx.beginPath(); ctx.ellipse(fx, (near + hem) / 2, 9 + (i % 3) * 3, (hem - near) / 2 + 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,246,224,.20)'; ctx.beginPath(); ctx.ellipse(fx + 13, (near + hem) / 2 - 4, 4, (hem - near) / 2 - 8, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = vgrad(near, near + 26, 'rgba(60,30,20,.34)', 'rgba(60,30,20,0)'); ctx.fillRect(x0 - 4, near, x1 - x0 + 8, 26);
  ctx.fillStyle = vgrad(near, hem + 8, 'rgba(70,34,26,.12)', 'rgba(46,20,18,.46)'); ctx.fillRect(x0 - 4, near, x1 - x0 + 8, hem - near + 12);   /* the front of the cloth faces away from the window: in shade */
  ctx.restore(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke(dr);
  // the top: a trapezoid seen from a little above (narrower at the back), checks foreshortened
  const L = v => lerp(x0 + 12, x0 - 4, v), R = v => lerp(x1 - 12, x1 + 4, v), Y = v => lerp(far, near, v);
  const top = new Path2D(); top.moveTo(L(0), far); top.lineTo(R(0), far); top.lineTo(R(1), near); top.lineTo(L(1), near); top.closePath();
  ctx.save(); ctx.fillStyle = C.cloth; ctx.fill(top); ctx.clip(top);
  ctx.fillStyle = C.check;
  for (let i = 0; i < 40; i++) { const u0 = i * 32 / (x1 - x0), u1 = (i * 32 + 16) / (x1 - x0); ctx.beginPath(); ctx.moveTo(lerp(L(0), R(0), u0), far); ctx.lineTo(lerp(L(0), R(0), u1), far); ctx.lineTo(lerp(L(1), R(1), u1), near); ctx.lineTo(lerp(L(1), R(1), u0), near); ctx.closePath(); ctx.fill(); }
  for (let j = 0; j < 6; j++) { const v0 = (j * 2) / 12, v1 = (j * 2 + 1) / 12; ctx.beginPath(); ctx.moveTo(L(v0), Y(v0)); ctx.lineTo(R(v0), Y(v0)); ctx.lineTo(R(v1), Y(v1)); ctx.lineTo(L(v1), Y(v1)); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = vgrad(far, far + 24, 'rgba(255,236,190,.55)', 'rgba(255,236,190,0)'); ctx.fillRect(x0 - 8, far, x1 - x0 + 16, 24);   /* the window's light along the back edge */
  ctx.restore(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.stroke(top);
  // place settings: a plate with a mould-shaped slice of loaf and a scoop of puree, a mug, a fork
  const py = (far + near) / 2 + 10;
  for (const px of [X.cran, X.pear, X.goji]) {
    ctx.fillStyle = 'rgba(40,20,10,.22)'; disc(px + 3, py + 6, 50, 13);
    disc(px, py, 48, 13, '#ffffff', OUT, 2); disc(px, py, 33, 8.4, 'rgba(120,150,200,.3)'); disc(px, py - .5, 30, 7.2, '#fbfcfd');
    ctx.fillStyle = '#9a5a3c'; ctx.beginPath(); ctx.roundRect(px - 24, py - 9, 30, 13, 6); ctx.fill(); ctx.strokeStyle = 'rgba(60,24,14,.7)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(60,24,14,.42)'; ctx.lineWidth = 1.4; for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(px - 18 + r * 7, py - 8); ctx.lineTo(px - 18 + r * 7, py + 3); ctx.stroke(); }
    ctx.fillStyle = '#c6d99a'; disc(px + 14, py - 1, 9, 5.5, '#c6d99a', 'rgba(60,70,20,.5)', 1.4); ctx.fillStyle = 'rgba(255,255,255,.5)'; disc(px + 11, py - 3, 3.4, 1.8);
    seg1(px - 62, py - 6, px - 62, py + 6, '#c3cad4', 3.4); seg1(px + 60, py - 6, px + 60, py + 6, '#c3cad4', 3.4);
    if (px !== X.goji) { rbox(px + 66, py - 20, 22, 20, '#c9d4e0', { r: 4, lw: 1.8 }); ctx.fillStyle = '#c23a2b'; ctx.fillRect(px + 67, py - 13, 20, 4); disc(px + 66, py - 10, 6, 6, null, OUT, 1.8); }
  }
  // flowers in a low blue vase between Stateman and Mrs. Cranberry
  { const fx = 374, fy = near - 22;
    ctx.fillStyle = 'rgba(40,20,10,.25)'; disc(fx + 2, fy + 3, 22, 5);
    for (const [dx, dy, c] of [[-12, -46, '#e0583d'], [4, -58, '#f0c23a'], [16, -42, '#c25fa0'], [-4, -40, '#f6f0e0']]) { seg1(fx, fy - 14, fx + dx, fy + dy, '#4a8a5a', 2.6); }
    for (const [dx, dy, c] of [[-12, -46, '#e0583d'], [4, -58, '#f0c23a'], [16, -42, '#c25fa0'], [-4, -40, '#f6f0e0']]) { disc(fx + dx, fy + dy, 8, 8, c, 'rgba(60,20,20,.55)', 1.6); disc(fx + dx, fy + dy, 3, 3, '#ffe9a0'); }
    rbox(fx - 15, fy - 22, 30, 24, '#9ad0e6', { r: 7, lw: 2 }); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(fx - 10, fy - 18, 4, 14); }
  // an empty water pitcher (glass, a handle) beside Mr. Goji's plate
  { const px = 846, py2 = near - 20;
    ctx.fillStyle = 'rgba(40,20,10,.22)'; disc(px + 2, py2 + 3, 20, 5);
    ctx.beginPath(); ctx.moveTo(px - 15, py2 - 44); ctx.lineTo(px + 15, py2 - 44); ctx.lineTo(px + 18, py2 + 2); ctx.lineTo(px - 18, py2 + 2); ctx.closePath(); ctx.fillStyle = 'rgba(214,236,250,.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(70,100,130,.85)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(px + 20, py2 - 24, 11, -PI / 2, PI / 2); ctx.strokeStyle = 'rgba(70,100,130,.85)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(px - 11, py2 - 38, 3.4, 32); ctx.fillStyle = 'rgba(160,210,240,.5)'; ctx.fillRect(px - 17, py2 - 3, 34, 4); }
}
const tableLayer = () => art('table', TW, TH, 3, () => { ctx.translate(-TX0, -TY0); paintTable(); });

// ------------------------------------------------------------------ live table props: the Kumquat's tiny tape recorder (reels turn, the REC lamp), Mrs. Cranberry's 1962 radio (a warm dial, notes)
function recorder(x, y, lt, on, a = 1, sc = .62) {   /* x, y = the middle of the base on the cloth; on 0..1 the reels run; sc scales it (it is a tiny recorder) */
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(40,20,10,.3)'; disc(2, 3, 40, 6);
  rbox(-34, -36, 68, 38, vgrad(-36, 2, '#8d9c8e', '#6d7c70'), { r: 6, lw: 2.2 });
  rbox(-29, -31, 58, 22, '#2d3430', { r: 4, lw: 1.6 });
  for (const sx of [-14, 14]) { disc(sx, -20, 10, 10, '#d8d4c4', OUT, 1.8); ctx.save(); ctx.translate(sx, -20); ctx.rotate(lt * 5.2 * on * (sx < 0 ? 1 : .8)); for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); seg1(0, 0, 8, 0, '#4a463c', 2.6); } ctx.restore(); disc(sx, -20, 2.4, 2.4, '#4a463c'); }
  seg1(-14, -10, 14, -10, '#3a2a1c', 1.8);
  for (const kx of [-22, -8, 6, 20]) rbox(kx - 4, -7, 8, 5, '#c9ccd2', { r: 1.6, lw: 1.2 });
  const blink = on > .5 ? .65 + .35 * Math.sin(lt * 5.5) : 0;
  disc(26, -33, 3.2, 3.2, on > .5 ? `rgba(255,${60 + 40 * blink | 0},50,1)` : '#5a2a2a', OUT, 1.2);
  if (on > .5) V2.glow(x + 26 * sc, y - 33 * sc, 24, '255,70,60', .5 * blink, 'screen', .4);
  seg1(34, -14, 48, -14, '#2a2630', 2.4); rbox(46, -26, 12, 22, '#2d3430', { r: 5, lw: 1.8 }); disc(52, -28, 7, 7, '#9aa0a8', OUT, 1.8);
  ctx.restore();
}
function radio(x, y, lt, a = 1, sc = .8) {   /* a walnut tube radio with a cloth grille and an amber dial; x, y = middle of the base */
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(40,20,10,.3)'; disc(2, 3, 46, 6);
  rbox(-42, -52, 84, 54, vgrad(-52, 2, '#b07a48', '#7a4a28'), { r: 12, lw: 2.4 });
  ctx.strokeStyle = 'rgba(255,224,170,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-36, -44); ctx.lineTo(36, -46); ctx.stroke();
  rbox(-36, -44, 40, 38, '#e8dcb8', { r: 6, lw: 1.8 }); ctx.save(); ctx.beginPath(); ctx.roundRect(-36, -44, 40, 38, 6); ctx.clip(); ctx.strokeStyle = 'rgba(120,90,50,.5)'; ctx.lineWidth = 1.6; for (let i = -40; i < 8; i += 6) { ctx.beginPath(); ctx.moveTo(-38, i); ctx.lineTo(6, i); ctx.stroke(); } ctx.restore();
  const g = .85 + .15 * Math.sin(lt * 2.4);
  disc(22, -26, 15, 15, '#3a2412', OUT, 2); disc(22, -26, 12, 12, `rgba(255,${170 + 20 * g | 0},70,1)`); ctx.save(); ctx.beginPath(); ctx.arc(22, -26, 12, 0, TAU); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,230,.5)'; disc(18, -32, 6, 3); seg1(22, -26, 22 + 8 * Math.cos(lt * .7 + 1), -26 - 8 * Math.sin(lt * .7 + 1), '#7a2a10', 1.8); ctx.restore();
  for (const kx of [10, 34]) disc(kx, -5, 4.6, 4.6, '#e8dcb8', OUT, 1.6);
  for (const lx of [-34, 34]) rbox(lx - 4, 0, 8, 5, '#4a2a14', { r: 2, lw: 1.4 });
  ctx.restore();
  V2.glow(x + 22 * sc, y - 26 * sc, 70, '255,176,72', .42 * g, 'screen', .5);
  // notes drift up from the grille, one after another (eighth notes drawn as shapes)
  for (let i = 0; i < 5; i++) {
    const k = ((lt * .42 + i / 5) % 1), nx = x - 16 + Math.sin(k * 5 + i * 1.7) * 18 + i * 3, ny = y - 56 * sc - k * 120, al = Math.sin(k * PI) * .85;
    ctx.save(); ctx.translate(nx, ny); ctx.rotate(Math.sin(k * 4 + i) * .25); ctx.globalAlpha *= al; ctx.fillStyle = '#fff2c8'; ctx.strokeStyle = 'rgba(120,70,20,.6)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, 0, 5.4, 4, -.4, 0, TAU); ctx.fill(); ctx.stroke(); seg1(4.6, -1, 4.6, -20, '#fff2c8', 2.4, 'butt'); ctx.beginPath(); ctx.moveTo(4.6, -20); ctx.quadraticCurveTo(12, -16, 10, -9); ctx.strokeStyle = '#fff2c8'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore();
  }
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ accessories and props of this scene (prefix fp14v_); everything is shapes (the one string, on the contract, goes through the UI kit)
const bodyClip = (o, k) => ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
/* a glint that crosses Mrs. Cranberry's lenses now and then, and the window's reflection in them */
EXT.acc.fp14v_glint = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const er = k.er, ex = k.eyeX, ey = k.eyeY, a = o.glint ?? 1, sw = (t * .21 + (o.seed || 0) * .13) % 1;
  if (a <= 0) return;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(s * ex - er * 1.25, ey - er * 1.1, er * 2.5, er * 2.2, 12); ctx.clip();
    const gx = s * ex + lerp(-er * 3.2, er * 3.2, sw);
    ctx.fillStyle = V2.grad(gx - er * .5, ey - er, gx + er * .35, ey + er, [[0, 'rgba(255,255,255,0)'], [.5, `rgba(255,255,255,${.42 * a})`], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(s * ex - er * 1.4, ey - er * 1.2, er * 2.8, er * 2.4);
    ctx.fillStyle = `rgba(255,255,255,${.55 * a})`; ctx.beginPath(); ctx.ellipse(s * ex - er * .62, ey - er * .55, er * .24, er * .11, -.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
};
/* wet eyes: a bright line along the lower lids and a bead in the corner (o.wet 0..1) */
EXT.acc.fp14v_wet = (o, k, t, layer) => {
  if (layer !== 'front' || !(o.wet > 0)) return;
  const er = k.er * 1.02, ex = k.eyeX, ey = k.eyeY, a = o.wet;
  ctx.save(); ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.strokeStyle = `rgba(238,250,255,${.78 * a})`; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.arc(s * ex, ey + er * .12, er * .96, .22 * PI, .78 * PI); ctx.stroke();
    ctx.fillStyle = `rgba(214,238,255,${.6 * a})`; ctx.beginPath(); ctx.ellipse(s * ex + s * er * .5, ey + er * 1.0, er * .2, er * .11, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
};
/* Mr. Goji's napkin wolf ears (ep7_art wolfears) with a twitch: now one ear, now the other (o.earTwitch scales it) */
EXT.acc.fp14v_wolf = (o, k, t, layer) => {
  if (layer !== 'back') return;
  const tw = i => { const ph = (t * .58 + i * .41 + (o.seed || 0) * .11) % 1; return ph < .13 ? Math.sin(ph / .13 * PI) * .3 : 0; };
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * k.rx * .5, -k.ry * .86); ctx.rotate(s * (.38 + tw(s > 0 ? 1 : 0) * (o.earTwitch ?? 1)));
    ctx.fillStyle = '#9a9aa8'; ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-26, 8); ctx.lineTo(-6, -58); ctx.quadraticCurveTo(2, -66, 10, -56); ctx.lineTo(28, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2b5c6'; ctx.beginPath(); ctx.moveTo(-14, 4); ctx.lineTo(-2, -40); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -2); ctx.lineTo(-6, -44); ctx.stroke();
    ctx.restore();
  }
};
/* Mr. Banana's cast: plaster over the left foot and ankle, signed, with a tally of his incidents (o.cast 0..1) */
EXT.acc.fp14v_cast = (o, k, t, layer) => {
  if (layer !== 'front' || !(o.cast > 0)) return;
  const hipY = k.ry * .78, fx = k.rx * .12 - (k.hip || 26), fy = hipY + (k.leg || 80);
  ctx.save(); ctx.translate(fx - 2, fy + 2); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-20, -52); ctx.lineTo(20, -52); ctx.lineTo(24, -10); ctx.bezierCurveTo(40, -8, 46, 12, 36, 20); ctx.lineTo(-36, 20); ctx.bezierCurveTo(-48, 12, -40, -8, -24, -10); ctx.closePath();
  ctx.fillStyle = V2.grad(-30, -50, 34, 20, [[0, '#fffdf6'], [1, '#e2dccb']]); ctx.fill(); ctx.strokeStyle = 'rgba(25,10,20,.88)'; ctx.lineWidth = 3.6; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(120,110,90,.28)'; ctx.lineWidth = 2; for (let i = -2; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-34, -40 + i * 9 + 40); ctx.quadraticCurveTo(0, -34 + i * 9 + 44, 36, -40 + i * 9 + 40); ctx.stroke(); }
  ctx.strokeStyle = '#2a4fd0'; ctx.lineWidth = 2.4; for (let g = 0; g < 4; g++) for (let n = 0; n < 4; n++) { const gx = -16 + g * 11, gy = -42 + (g % 2) * 3; ctx.beginPath(); ctx.moveTo(gx, gy + n * 2.2); ctx.lineTo(gx + 6, gy + n * 2.2 + 1); ctx.stroke(); }
  ctx.strokeStyle = '#c23a2b'; ctx.lineWidth = 2.4; for (let n = 0; n < 5; n++) { ctx.beginPath(); ctx.moveTo(-26 + n * 5, -20); ctx.lineTo(-26 + n * 5, -9); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-28, -8); ctx.lineTo(-2, -22); ctx.stroke();
  ctx.strokeStyle = '#2a4fd0'; ctx.beginPath(); ctx.moveTo(6, -18); ctx.bezierCurveTo(10, -26, 16, -12, 22, -22); ctx.stroke();
  ctx.fillStyle = '#e0486a'; ctx.beginPath(); ctx.moveTo(14, 4); ctx.bezierCurveTo(8, -2, 6, 8, 14, 12); ctx.bezierCurveTo(22, 8, 20, -2, 14, 4); ctx.fill();
  ctx.restore(); ctx.restore();
};
/* Mr. Pear's old union contract: a folded, yellowed sheet with a coffee ring, the local's stamp and its one clause; drawn around the hand (o.tap 0..1 jabs it down); the lettering is dressing */
EXT.prop.fp14v_contract = (side, o, t) => {
  const tp = o.tap || 0;
  ctx.save(); ctx.translate(0, tp * 12); ctx.rotate(.1 * side - tp * .05); ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(40,20,10,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = V2.grad(-18, -140, 92, 6, [[0, '#f7edcb'], [1, '#e3d3a4']]); ctx.beginPath(); ctx.moveTo(-18, 6); ctx.lineTo(-18, -134); ctx.lineTo(70, -140); ctx.lineTo(92, -118); ctx.lineTo(92, 6); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(70,50,20,.75)'; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.fillStyle = '#d9c895'; ctx.beginPath(); ctx.moveTo(70, -140); ctx.lineTo(92, -118); ctx.lineTo(70, -118); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,90,40,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(37, -138); ctx.lineTo(37, 4); ctx.moveTo(-16, -68); ctx.lineTo(90, -68); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,70,30,.4)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(66, -26, 13, 11, .3, 0.3, TAU * .92); ctx.stroke();
  UI.label('LOCAL 9', 37, -118, { size: 19, font: 'Bangers', fill: '#7a2418', spacing: 2, hero: false, maxW: 92 });
  UI.label('UNION CONTRACT', 37, -98, { size: 10.5, fill: '#3a2a18', hero: false, maxW: 96, spacing: .6 });
  ctx.strokeStyle = 'rgba(60,45,25,.5)'; ctx.lineWidth = 1.6; for (const yy of [-84, -76]) { ctx.beginPath(); ctx.moveTo(-8, yy); ctx.lineTo(82 - (yy % 3) * 4, yy); ctx.stroke(); }
  UI.label('ART. 14', -8, -58, { size: 9.5, fill: '#3a2a18', hero: false, align: 'left', maxW: 60 });
  UI.label('PAID BREAK, 30 MIN.', -8, -44, { size: 9.5, fill: '#7a2418', hero: false, align: 'left', maxW: 96 });
  ctx.strokeStyle = '#c23a2b'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-8, -38); ctx.lineTo(82, -39); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,45,25,.42)'; ctx.lineWidth = 1.6; for (const yy of [-24, -16, -8]) { ctx.beginPath(); ctx.moveTo(-8, yy); ctx.lineTo(80 - (yy % 5) * 5, yy); ctx.stroke(); }
  ctx.fillStyle = 'rgba(194,58,43,.78)'; ctx.beginPath(); ctx.arc(70, -4, 12, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,20,10,.8)'; ctx.lineWidth = 1.8; ctx.stroke();
  UI.label('9', 70, -4, { size: 16, font: 'Bangers', fill: '#fff2e0', hero: false });
  ctx.restore();
};
PROP_BOX.fp14v_contract = [-22, -142, 96, 8];

// ------------------------------------------------------------------ furniture drawn live next to the people: a slatted chair back behind a sitter, and Mr. Banana's walker (tennis balls on its feet)
function chairBack(cx, ty, w, h, col = '#8c5e3c') {   /* a plain slatted chair back: two posts, four slats, a top rail; calm and dark so it never competes with a face */
  ctx.save(); ctx.lineJoin = 'round';
  for (const sx of [-1, 1]) rbox(cx + sx * (w / 2 - 8) - 8, ty + 4, 16, h, shade(col, .88), { r: 6, lw: 2.2 });
  const n = 4, gap = (w - 32) / n;
  for (let i = 0; i < n; i++) rbox(cx - w / 2 + 16 + gap * (i + .5) - 5, ty + 16, 10, h - 14, col, { r: 4, lw: 2 });
  rbox(cx - w / 2, ty, w, 18, lift(col, .08), { r: 8, lw: 2.4 });
  ctx.restore();
}
/* the walker in local units (origin = the middle between its posts at the floor; up is -y; posts at +-96, handles 177 up); `lean` tips it about its right foot (radians) */
function walkerPosts(lean = 0) {
  ctx.save(); ctx.translate(96, 0); ctx.rotate(lean); ctx.translate(-96, 0); ctx.lineCap = 'round';
  for (const sx of [-96, 96]) {
    seg1(sx, -20, sx, -170, OUT, 12, 'round'); seg1(sx, -20, sx, -170, '#c3ccd6', 8, 'round'); seg1(sx - 2, -26, sx - 2, -166, 'rgba(255,255,255,.7)', 2.2);
    seg1(sx, -176, sx, -156, OUT, 20, 'round'); seg1(sx, -176, sx, -156, '#2a2630', 15, 'round'); seg1(sx - 3, -172, sx - 3, -160, 'rgba(255,255,255,.35)', 3);
    disc(sx, -12, 14, 14, '#d9e24a', OUT, 3); ctx.strokeStyle = 'rgba(60,70,10,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, -12, 10, .7, 2.3); ctx.stroke();
  }
  ctx.restore();
}
function walkerBar(lean = 0) {
  ctx.save(); ctx.translate(96, 0); ctx.rotate(lean); ctx.translate(-96, 0);
  seg1(-96, -88, 96, -88, OUT, 11, 'round'); seg1(-96, -88, 96, -88, '#c3ccd6', 7, 'round'); seg1(-90, -90, 90, -90, 'rgba(255,255,255,.7)', 2);
  ctx.restore();
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ the form on the clipboard (shapes only: a slate header, rows of tick box and line), used by the page turn and by the insert
function drawForm(x, y, w, h, o = {}) {
  const rows = o.rows ?? 7, fill = o.fill ?? .4, lw = Math.max(1, w * .012);
  ctx.save(); ctx.fillStyle = '#f4f1e6'; ctx.strokeStyle = 'rgba(60,50,30,.55)'; ctx.lineWidth = lw * 1.4; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = C.slate; ctx.fillRect(x, y, w, h * .1);
  ctx.fillStyle = 'rgba(244,247,252,.85)'; ctx.fillRect(x + w * .08, y + h * .035, w * .5, h * .03);
  ctx.fillStyle = '#d9a93a'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? w * .03 : w * .07; ctx.lineTo(x + w * .86 + Math.cos(a) * R, y + h * .05 + Math.sin(a) * R); } ctx.closePath(); ctx.fill();
  const r0 = y + h * .17, pitch = (h * .8) / rows, bs = Math.min(pitch * .5, w * .1);
  for (let i = 0; i < rows; i++) {
    const yy = r0 + i * pitch, done = i < Math.round(fill * rows);
    ctx.strokeStyle = 'rgba(60,70,90,.8)'; ctx.lineWidth = lw * 1.2; ctx.strokeRect(x + w * .08, yy, bs, bs);
    ctx.fillStyle = 'rgba(70,80,100,.35)'; ctx.fillRect(x + w * .08 + bs + w * .08, yy + bs * .5 - lw, w * (.5 - (i % 3) * .07), lw * 1.8); ctx.fillRect(x + w * .08 + bs + w * .08, yy + bs * .5 + pitch * .3, w * (.3 + (i % 2) * .1), lw * 1.3);
    if (done) { ctx.strokeStyle = i % 4 === 2 ? '#c23a2b' : '#1f6f3a'; ctx.lineWidth = lw * 2; ctx.beginPath(); ctx.moveTo(x + w * .08 + bs * .15, yy + bs * .55); ctx.lineTo(x + w * .08 + bs * .42, yy + bs * .9); ctx.lineTo(x + w * .08 + bs * 1.15, yy - bs * .2); ctx.stroke(); }
  }
  ctx.restore();
}
/* a clipboard whose top sheet can be turned: o.flip 0..1 (the old sheet lifts and folds over the clip, the next page is under it); the same placement as A14's fp14_clip */
EXT.prop.fp14v_clipflip = (side, o, t) => {
  const S = o.clipScale || 1, w = 66 * S, h = 86 * S, at = o.clipAt || [.5, .5], f = clamp(o.flip || 0);
  ctx.save(); ctx.rotate(o.clipRot || 0);
  const cx = w / 2 - w * at[0], cy = h / 2 - h * at[1];
  A14.clip(cx, cy, { clipScale: S, clipPage: f > 0 ? (o.clipPage2 ?? .05) : (o.clipPage ?? .35) });
  if (f > 0 && f < 1) {
    const ox = cx - w / 2, oy = cy - h / 2, sx = ox + w * .08, sy = oy + h * .09, sw = w * .84, sh = h - h * .09 - w * .08 * .8, kk = Math.cos(f * PI);
    ctx.save(); ctx.translate(0, sy); ctx.scale(1, kk); ctx.translate(0, -sy);
    if (f < .5) drawForm(sx, sy, sw, sh, { rows: 7, fill: o.clipPage ?? .35 }); else { ctx.fillStyle = '#ebe7d8'; ctx.strokeStyle = 'rgba(60,50,30,.5)'; ctx.lineWidth = 1.6; ctx.fillRect(sx, sy, sw, sh); ctx.strokeRect(sx, sy, sw, sh); }
    ctx.restore();
  }
  ctx.restore();
};
PROP_BOX.fp14v_clipflip = o => { const S = o.clipScale || 1, w = 66 * S, h = 86 * S, at = o.clipAt || [.5, .5]; return [-w * at[0] - 2, -h * at[1] - 2, w * (1 - at[0]) + 2, h * (1 - at[1]) + 2]; };

// ------------------------------------------------------------------ the cast: one function per person returns the drawChar options for this time. Seated people are drawn in centre mode (x, y = the middle of the body).
const SEATED = { center: true, noLegs: true, noShadow: true, noReflect: true, lift: 0 };
const REACH = o => { const k = KINDS[o.kind], sc = o.armScale || 1.12; return ((k.arm1 || 56) + (k.arm2 || 52)) * sc - 3; };
/* a scene point as an arm target in the body's local units, kept inside the arm's reach (a hand that cannot reach would be a layout error) */
function gripTo(o, side, wx, wy) {
  const k = KINDS[o.kind], [sx, sy] = shoulder(k, side), lx = (wx - o.x) / o.s, ly = (wy - o.y) / o.s, dx = lx - sx, dy = ly - sy, d = Math.hypot(dx, dy) || 1, m = REACH(o), f = d > m ? m / d : 1;
  return [sx + dx * f, sy + dy * f];
}
const faceOfSeated = o => { const k = KINDS[o.kind]; return [o.x + (k.shape === 'banana' ? k.face * o.s : 0), o.y + (k.eyeY + k.mouthY) / 2 * o.s]; };
const faceOfStanding = o => { const k = KINDS[o.kind], leg = o.noLegs ? 0 : (k.leg || 90); return [o.x + (k.shape === 'banana' ? k.face * o.s : 0), o.y - (o.lift || 0) - (leg + k.ry * .9 - (k.eyeY + k.mouthY) / 2) * o.s]; };

/* Mr. Stateman: patient, unflappable; the clipboard on his belly, the pen tapping. He asks, he waits, he notes. */
function actStar(lt, sh) {
  const writing = inR(lt, 16.28, 17.8) || lt >= 22.4, spk = inR(lt, 1, 6.75), wr = sk(lt, 23.08, 23.16) * (1 - sk(lt, 23.38, 23.48));
  const o = A14.stateman(Object.assign({ x: X.star, y: YSTAR, s: SR, who: 'star', id: 'stateman' }, SEATED,
    writing ? { pose: 'write', hold: { l: 'fp14v_clipflip', r: 'fp14_pen' }, clipPage: .62, clipPage2: .04, flip: lt < 20 ? sk(lt, 16.45, 16.85) : 1, writing: wr } : {}));
  o.look = track([[0, [-.6, .5]], [.55, [-.6, .5]], [.8, [.5, -.25]], [1.4, [.7, -.15]], [2.5, [.85, -.05]], [3.6, [.6, -.3]], [4.0, [.7, -.2]], [4.5, [.85, 0]], [6.7, [.85, 0]], [9.8, [.8, .02]], [10.7, [.85, .02]],
    [16.28, [.2, .8]], [16.9, [.15, .85]], [17.3, [.6, .2]], [17.75, [.85, 0]], [22.8, [.8, 0]], [23.55, [.2, .8]]], lt);
  if (inR(lt, 4.5, 6.8)) { o.expr = 'stateman_brow'; o.brow = sk(lt, 5.95, 6.2); }
  if (inR(lt, 10.0, 10.9)) { o.face = { curve: .95, raise: 6, lid: .3, ang: -.08 }; }
  o.noted = seg(lt, 22.903, 23.56);
  o.rot = .012 * Math.sin(lt * .8) + (spk ? .01 : 0) - .02 * pulse(lt, 4.5, .9);
  if (inR(lt, 2.5, 4.4)) o.rot += .008 * Math.sin((lt - 2.5) * 5);
  return o;
}
/* the Kumquat: sets up the tiny recorder (his hand reaches only so far), ushers the staff out with a pointing arm and a serious face, then writes everything down. */
const REC = { x: 176, y: 1038 };   /* where the recorder stands: on the back edge of the table, within his reach */
function actKum(lt, sh) {
  const o = A14.kumquat(Object.assign({ x: X.kum, y: YKUM, s: SK, who: 'kum', id: 'kumquat' }, SEATED, { pose: 'free' }));
  const put = sk(lt, .3, .62), rec = lt < .3 ? 0 : 1;
  const hx = lerp(REC.x - 14, REC.x - 18, put), hy = lerp(REC.y - 40, REC.y - 18, put) + 3 * pulse(lt, .64, .16);   /* the right hand follows the recorder, and presses its button */
  o.arms = { l: 'rest', r: 'hold' }; o.hand = { r: lt > .62 ? 'point' : 'grip' };
  o.grip = { r: gripTo(o, 1, hx, hy) };
  o.expr = 'kum_eager'; o.tongue = inR(lt, .1, .62) ? 1 : 0;
  if (inR(lt, 1.35, 3.85)) {   /* ushering: the left arm points at the door, a stern face, a nod for each one that goes */
    o.arms.l = 'point'; o.hand.l = 'point'; o.expr = 'fp14v_grave';
    o.squash = .08 * Math.max(pulse(lt, 2.9, .2), pulse(lt, 3.35, .2), pulse(lt, 3.8, .2)) ; o.plant = true;
  }
  o.look = track([[0, [.2, .6]], [.55, [.2, .6]], [.75, [.85, -.2]], [1.3, [.5, -.1]], [1.6, [-.8, .1]], [3.8, [-.8, .1]], [4.3, [.85, -.2]], [8, [.85, -.2]]], lt);
  o.rot = .02 * Math.sin(lt * 1.9);
  return o;
}
/*@@PARTS@@*/

/* the chorus on "Give her a break.": all four residents turn to the lens in the same frame, speak as one voice (rall) and hold the stare into the silence after */
const CHO = () => { const l = lines().ra1; return l ? [l.s, l.e] : [18.793, 20.077]; };
const choK = lt => sk(lt, CHO()[0] - .07, CHO()[0] + .02);                    /* 0 -> 1 in about two frames, the same for everyone */
const choWho = (id, lt) => { const [a, b] = CHO(); return lt >= a - .12 && lt < b + .04 ? 'rall' : id; };
const choLook = (lt, was) => { const k = choK(lt); return was.map((v, i) => lerp(v, i ? .02 : 0, k)); };
/* Mrs. Cranberry: lucid and loving. She rocks, she looks at him, and for one line she is the one who knows. (glasses and curlers from A7; wet eyes and a lens glint of this scene) */
function actCran(lt, sh) {
  const o = A7.cran(Object.assign({ x: X.cran, y: YSIT + 22, s: SR, who: 'cran', id: 'cran', seed: 73 }, SEATED));
  o.acc = ['curlers', 'fp14v_wet', 'glasses', 'fp14v_glint'];
  o.expr = 'fp14v_tender';
  o.look = track([[0, [-.7, .05]], [6.6, [-.68, .02]], [8.1, [-.55, .2]], [8.5, [.1, -.22]], [9.5, [.2, -.2]], [9.86, [-.6, .05]], [10.6, [-.62, .02]], [18.5, [-.65, .02]]], lt);
  const tell = sk(lt, 8.35, 9.5) * (1 - sk(lt, 10.7, 11.5));
  o.wet = .2 + .7 * tell; o.sparkle = inR(lt, 6.5, 11);
  o.squint = .08 + .14 * sk(lt, 9.8, 10.1) * (1 - sk(lt, 10.9, 11.6));
  o.face = { curve: .85 + .15 * sk(lt, 9.8, 10.1), lid: .22 - .07 * tell, raise: 6 + 3 * tell };
  o.rot = .03 * Math.sin(lt * 1.25 + 1) + .03 * pulse(lt, 9.95, .45);
  o.glint = 1;
  const ck = choK(lt); o.who = choWho('cran', lt); o.look = choLook(lt, o.look); o.rot *= 1 - ck;
  if (ck > 0) { o.face = Object.assign({}, o.face, { curve: lerp(o.face.curve, .5, ck), lid: lerp(o.face.lid, .06, ck), raise: lerp(o.face.raise, 8, ck) }); o.squash = -.03 * pulse(lt, CHO()[0] - .02, .3); o.wet = Math.max(o.wet, .5 * ck); }
  return o;
}
/* Mr. Pear: total certainty. A folded contract in the right hand, a chin that goes up on every key word, and a jab at the table. */
const JABS = [10.83, 11.64, 12.62, 13.39, 13.62];
function actPear(lt, sh) {
  const o = A7.pear(Object.assign({ x: X.pear, y: YSIT, s: SR, who: 'pear', id: 'pear', seed: 29 }, SEATED));
  const up = sk(lt, 10.15, 10.65), tap = Math.max(0, ...JABS.map(t0 => pulse(lt, t0, .17)));
  o.arms = { l: 'rest', r: 'hold' }; o.hand = { r: 'grip' }; o.hold = { r: 'fp14v_contract' };
  o.grip = { r: [lerp(120, 128, up), lerp(72, -2, up) + tap * 9] };
  o.tap = up > .5 ? tap : 0;
  o.expr = 'fp14v_certain';
  o.look = track([[0, [-.8, .1]], [10.6, [-.82, .05]], [12.6, [-.8, -.05]], [12.75, [.7, -.1]], [13.15, [.7, -.1]], [13.35, [-.85, 0]], [18.5, [-.8, .05]]], lt);
  const spk = inR(lt, 10.62, 13.94);
  o.rot = (spk ? -.032 : -.01) - .02 * tap + .008 * Math.sin(lt * 1.1);
  o.browUp = 3 + 6 * Math.max(pulse(lt, 13.3, .5), pulse(lt, 12.55, .4)) + (spk ? 2 : 0);
  o.sy = 1 + .025 * tap;
  const ck = choK(lt); o.who = choWho('pear', lt); o.look = choLook(lt, o.look); o.rot *= 1 - ck;
  if (ck > 0) { o.face = { curve: lerp(.5, .12, ck), lid: lerp(.3, .1, ck), ang: lerp(.1, .12, ck), raise: lerp(3, 5, ck) }; o.browUp += 6 * ck; o.squash = -.03 * pulse(lt, CHO()[0] - .02, .3); }
  return o;
}
/* Mr. Banana: cheerful, standing at the end of the table on his walker, one foot in a cast (his incident count is on it). On "forty-seven" he gives a thumbs-up, with the hand that was holding the walker. */
const BAN_THUMB = 15.5;
function actBan(lt, sh) {
  const hop = inR(lt, 14.09, 16.1) ? 4 * Math.abs(Math.sin((lt - 14.09) * 7.2)) * (1 - sk(lt, 15.2, 15.5)) : 0;
  const o = A7.banana(Object.assign({ x: X.banana, y: BAN_FEET - hop, s: SR, who: 'banana', id: 'banana', seed: 41 }));
  o.acc = ['fp14v_cast']; o.cast = 1; o.expr = 'fp14v_beam';
  const th = sk(lt, BAN_THUMB - .08, BAN_THUMB + .06) * (1 - sk(lt, 16.3, 16.55)), up = th > .5, wob = damp(lt, BAN_THUMB, 11, .34) * (1 - sk(lt, 16.3, 16.55));
  o.arms = { l: up ? 'thumb' : 'hold', r: 'hold' }; o.hand = { l: up ? 'thumb' : 'grip', r: 'grip' };
  o.grip = { l: [lerp(-80, -142, th), lerp(38, 2, th)], r: [112, 38] };   /* the left hand lets go of the walker and goes straight out to the side, thumb up (the engine's thumb points up when the forearm runs level) */
  o.rot = -.07 * wob + .01 * Math.sin(lt * 1.4);
  o.squash = up ? .1 * pulse(lt, BAN_THUMB, .22) : 0; o.plant = true;
  o.look = track([[0, [-.8, .1]], [14.0, [-.8, .1]], [15.4, [-.7, -.05]], [15.55, [-.2, -.1]], [16.2, [-.6, 0]], [18.5, [-.75, .05]]], lt);
  o.lean = .075 * wob;   /* read by the walker */
  o.face = up && lt < 15.9 ? { wide: 1.12, raise: 14 } : undefined;
  const ck = choK(lt); o.who = choWho('banana', lt); o.look = choLook(lt, o.look); o.rot *= 1 - ck;
  if (ck > 0) o.face = { curve: lerp(.9, .55, ck), lid: .02, raise: lerp(9, 8, ck), wide: 1.06, ang: lerp(-.16, -.04, ck) };
  return o;
}
/* Mr. Goji: staring at the empty pitcher, ears twitching, whispering "water" to nobody (a mouth you can see and nothing you can hear) */
const WHISPER = [[.22, .9], [17.78, 18.6]];
function actGoji(lt, sh) {
  const o = A7.goji(Object.assign({ x: X.goji, y: YSIT + 8, s: SR, who: 'goji', id: 'goji', seed: 67 }, SEATED));
  o.acc = ['fp14v_wolf', 'gown']; o.expr = 'fp14v_blank';
  let w = 0; for (const [a, b] of WHISPER) if (inR(lt, a, b)) { const ph = (lt - a) % .72; w = ph < .15 ? .55 * Math.sin(ph / .15 * PI) : (ph > .3 && ph < .46) ? .36 * Math.sin((ph - .3) / .16 * PI) : 0; }
  o.mouthOpen = w;
  o.look = track([[0, [.7, .6]], [17.6, [.7, .6]], [18.0, [.78, .62]], [18.5, [.7, .6]]], lt);
  o.rot = .012 * Math.sin(lt * .9 + 2);
  const ck = choK(lt); o.who = choWho('goji', lt); o.look = choLook(lt, o.look); o.rot *= 1 - ck;
  if (ck > 0) o.face = { curve: lerp(.12, .06, ck), lid: lerp(.34, .04, ck), wide: 1.1, raise: 5, pup: .9 };
  return o;
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ the staff: a row against the back wall, smiling for the photo; when he says "residents" they file out to the left, past the Kumquat; Strawberry goes last (S14.walk sets the gait fields the footstep tool reads)
const walkWith = (ctor, fn, lt, extra) => (S14 && S14.walk ? S14.walk(ctor, fn, lt, extra) : ctor(Object.assign({ x: fn(lt)[0], y: fn(lt)[1] }, extra)));
const walkX = (x0, ts, v, ramp = .3) => lt => { const d = Math.max(0, lt - ts); return x0 - (d < ramp ? v * d * d / (2 * ramp) : v * (d - ramp / 2)); };
const STAFF = {
  lemon: { ctor: A7.lemon, x: walkX(168, 1.85, 205), stiff: 2.8 },
  mango: { ctor: A7.mango, x: walkX(286, 2.12, 205), stiff: 2.9 },
  clem: { ctor: A10.clem, x: walkX(404, 2.4, 205), stiff: 3.0 },
  straw: { ctor: A11.straw, x: lt => lin([[0, 522], [3.4, 522], [3.9, 506], [4.565, 440], [6.8, 250]], lt), stiff: 3.2, stride: 20 },   /* last, and reluctant: she drags her feet, then hurries to catch up (a steady slow walk: the footstep tool needs a continuous gait) */
};
const STAFF_LOOK = {
  lemon: [[0, [-.55, .5]], [2.4, [-.55, .5]], [2.9, [.5, 0]], [3.3, [-.8, .1]]],
  mango: [[0, [-.55, .5]], [2.6, [-.55, .5]], [3.0, [.3, .3]], [3.4, [-.8, .1]]],
  clem: [[0, [-.5, .5]], [2.9, [-.5, .5]], [3.2, [.2, .2]], [3.6, [-.8, .1]]],
  straw: [[0, [-.5, .5]], [3.0, [-.5, .5]], [3.5, [.8, .3]], [4.3, [.85, .35]], [4.8, [.2, .5]]],
};
function actStaff(id, lt, sh) {
  const st = STAFF[id], fn = l => [st.x(l), FS];
  const SD = st.stride || 26, o = walkWith(st.ctor, fn, lt, { s: SS, id, who: id, stride: SD });
  const x = fn(lt)[0], cyc = o.gaitW != null ? o.gaitW / (4 * SD) : 0, going = o.gaitW != null;
  o.transit = x < 120 || x > 960;
  o.look = track(STAFF_LOOK[id], lt);
  o.arms = going ? { l: [.28 + .45 * Math.sin(cyc * TAU), .25], r: [.28 - .45 * Math.sin(cyc * TAU), .25] } : { l: 'down', r: 'down' };
  const photo = lt < st.stiff;
  if (id === 'lemon') o.expr = photo ? 'fp14v_stiff' : lt < 3.25 ? 'shock' : 'sour';
  if (id === 'mango') { o.expr = photo ? 'fp14v_stiff' : 'sad'; if (!photo) o.acc = (o.acc || []).concat(['sweat']); }
  if (id === 'clem') o.expr = photo ? 'fp14v_stiff' : 'hopeful';
  if (id === 'straw') { o.expr = lt < 3.0 ? 'fp14v_stiff' : lt < 3.5 ? 'fp14v_flat' : 'sad'; o.lift = (o.lift || 0); }
  if (photo) o.shake = .55;
  o.rot = going ? 0 : .006 * Math.sin(lt * 1.3 + id.length);
  return o;
}

// ------------------------------------------------------------------ the live part of the room (clock hands, the chalk lettering, the window's glare, the lamps) and the light in the air
function menuText() {
  const { x, y, w, h } = MENU, cx = x + w / 2;
  const o = { fill: '#f2f0e0', hero: false, center: true, alpha: .94 };
  const row = (id, cy, hh, str, extra) => { UI.container(id, 'board', [x + 22, cy - hh, x + w - 22, cy + hh], 2); UI.label(str, cx, cy, Object.assign({ cid: id, maxW: w - 70 }, o, extra)); };
  row('menu14a', y + 52, 22, "TODAY'S MENU", { size: 22, spacing: 2 });
  seg1(x + 44, y + 76, x + w - 44, y + 76, 'rgba(242,240,224,.5)', 2, 'butt');
  row('menu14b', y + 108, 26, 'PUREED MEATLOAF', { size: 34, maxW: w - 66 });
  row('menu14c', y + 152, 18, '(SHAPE OF THE MOLD)', { size: 21, alpha: .82, maxW: w - 66 });
}
function roomLive(lt, sh) {
  const { x, y, r } = CLOCK, m = 40 + lt / 60, h = 3 + m / 60, ha = h / 12 * TAU, ma = m / 60 * TAU;
  seg1(x, y, x + Math.sin(ha) * r * .5, y - Math.cos(ha) * r * .5, '#2a2630', 4.4); seg1(x, y, x + Math.sin(ma) * r * .78, y - Math.cos(ma) * r * .78, '#2a2630', 3); disc(x, y, 3.6, 3.6, C.red);
  menuText();
  V2.glow(WIN.x1 - 70, WIN.y0 + 80, 300, '255,236,180', .46, 'screen', .7);
  for (const lx of [610, 928]) V2.glow(lx, 292, 150, '255,226,170', .32, 'screen', .5);
}
function sunLight(lt, sh) {
  const a = sh.beam ?? 1;
  if (a <= 0) return;
  V2.beam(640, 640, 380, 1180, 130, 320, '255,226,170', .13 * a);
  V2.beam(720, 620, 560, 1190, 90, 250, '255,226,170', .10 * a);
  V2.beam(560, 660, 230, 1170, 70, 210, '255,226,170', .09 * a);
  V2.dust(150, 690, 820, 1200, lt, { n: 64, size: 3.0, alpha: .72, speed: 8, seed: 3 });
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ drawing the people of one shot, back to front: the staff at the wall, the chairs, the seated group, the table with what is on it, then Mr. Banana and his walker in front
const LIGHT_BASE = { key: [.55, -.55], keyColor: '#ffe3b8', keyA: .26, rim: '#9fc4ff', rimA: .34, shadow: '#3a2214', shadowA: .3, bounce: '#ffd7a0', bounceA: .22, amb: '#fff0dc', ambA: .05 };
const lightFor = (grp, sh) => {
  const g = sh.glow ?? 1;
  if (grp === 'staff') V2.setLight(Object.assign({}, LIGHT_BASE, { back: { color: '255,214,150', a: .35 * g, w: 14 }, frontDark: .08, keyA: .22 }));
  else if (grp === 'res') V2.setLight(Object.assign({}, LIGHT_BASE, { back: { color: '255,206,140', a: .5 * g, w: 18 }, frontDark: .12 * g }));
  else V2.setLight(LIGHT_BASE);
};
function drawWalker(o, up) {   /* Mr. Banana's walker: posts, grips and tennis balls behind him, the cross bar in front; local units, origin on the floor under the middle of the frame */
  ctx.save(); ctx.translate(o.x + 16 * o.s, o.y); ctx.scale(o.s, o.s);
  (up ? walkerBar : walkerPosts)(o.lean || 0);
  ctx.restore();
}
const CHAIRS = { star: [X.star, YSTAR - 100, 212, 204], kum: [X.kum, YKUM - 58, 100, 120], cran: [X.cran, YSIT - 84, 152, 190], pear: [X.pear, YSIT - 92, 164, 198], goji: [X.goji, YSIT - 40, 122, 150] };
function drawChairs(show) { for (const id of ['star', 'kum', 'cran', 'pear', 'goji']) if (show.has(id)) chairBack(...CHAIRS[id]); }
function drawCast(lt, sh) {
  const show = new Set(sh.show), shotLights = sh.lights !== false;
  const seat = [];   /* [id, options] of the seated ones, drawn left to right */
  if (show.has('star')) seat.push(['star', actStar(lt, sh)]);
  if (show.has('kum')) seat.push(['kum', actKum(lt, sh)]);
  if (show.has('cran')) seat.push(['cran', actCran(lt, sh)]);
  if (show.has('pear')) seat.push(['pear', actPear(lt, sh)]);
  if (show.has('goji')) seat.push(['goji', actGoji(lt, sh)]);
  // the staff (a different light: they stand against the window, further back)
  lightFor('staff', sh);
  for (const id of ['straw', 'clem', 'mango', 'lemon']) if (show.has(id)) { const o = actStaff(id, lt, sh); if (o.x > -150 && o.x < 1240) drawChar(o); }
  // chairs behind the seated (in a close-up they are drawn with the soft room instead)
  if (!sh.chairsBg) drawChairs(show);
  lightFor('res', sh);
  for (const [id, o] of seat) { if (id === 'cran' && sh.radioLight !== false) V2.addLight({ x: 566, y: 1066, r: 300, color: '255,170,70', a: .38 }); drawChar(o); }
  // the table and what stands on it
  ctx.drawImage(tableLayer(), TX0, TY0, TW, TH);
  if (show.has('kum') || show.has('star') || show.has('cran')) {
    const put = sk(lt, .3, .62);
    recorder(lerp(REC.x - 6, REC.x, put), lerp(REC.y - 36, REC.y, put), lt, sk(lt, .6, .7), lt < .26 ? 0 : 1);
    radio(566, TB.near - 12, lt, 1);
  }
  // Mr. Banana, standing at the end of the table with his walker
  if (show.has('banana')) { const o = actBan(lt, sh); lightFor('res', sh); drawWalker(o, false); drawChar(o); drawWalker(o, true); }
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ the glass door in the dining room's side wall (the cutaway at "The State is not known to be moved."): the nurses' station is behind the glass,
// Strawberry has her ear to a tumbler, a venetian blind hangs in front of the glass on a cord, and the Kumquat shuts it on her. Drawn in screen px at zoom 1 (the camera only pushes in a little).
const DR = { x: 340, y: 300, w: 400, h: 940 }, PANE = { x: 380, y: 392, w: 320, h: 500 }, DFLOOR = 1250;
const D_PULL = [[21.78, 22.04], [22.08, 22.32], [22.36, 22.62]];   /* three pulls on the cord: the blind comes down in three steps, then the slats close */
const D_CLOSE = 22.66;
function blindRaise(lt) { let r = .9; D_PULL.forEach(([a, b], i) => { r -= .3 * easeIO(seg(lt, a, b)); }); return Math.max(0, r); }
function stationBackdrop(lt) {
  const { x, y, w, h } = PANE;
  ctx.fillStyle = vgrad(y, y + h, '#dfe9c6', '#cdd9b0'); ctx.fillRect(x - 20, y - 20, w + 40, h + 40);
  ctx.fillStyle = '#efe5d1'; ctx.fillRect(x - 20, y + h - 130, w + 40, 150); ctx.fillStyle = '#d4c7aa'; ctx.fillRect(x - 20, y + h - 130, w + 40, 14);   /* the counter */
  rbox(x + 24, y + h - 230, 110, 100, '#2a3340', { r: 8, lw: 3 }); ctx.fillStyle = '#5fa8e0'; ctx.fillRect(x + 36, y + h - 218, 86, 70);   /* a monitor */
  rbox(x + w - 140, y + 40, 120, 86, '#262c35', { r: 8, lw: 3 });   /* the call-light board, one dome lit */
  for (let i = 0; i < 12; i++) { const cx = x + w - 124 + (i % 4) * 30, cy = y + 62 + ((i / 4) | 0) * 26, on = i === 5; disc(cx, cy, 8, 8, on ? `rgba(255,${50 + 30 * Math.sin(lt * 7)},50,1)` : '#4a1d22'); }
  disc(x + 120, y + 70, 40, 40, '#fbf6e8', OUT, 3);   /* the wall clock */
  seg1(x + 120, y + 70, x + 120, y + 42, '#2a2630', 4); seg1(x + 120, y + 70, x + 142, y + 82, '#2a2630', 4);
  ctx.fillStyle = 'rgba(232,248,244,.28)'; ctx.fillRect(x - 20, y - 20, w + 40, h + 40);   /* cool fluorescent light over all of it */
}
function actStrawDoor(lt) {
  const o = A11.straw(Object.assign({ x: lerp(540, 560, sk(lt, 20.5, 21)) + 190 * sk(lt, 22.3, 22.85), y: 690, s: 1.25, who: 'straw', id: 'straw' }, SEATED));
  o.lift = 0;
  const hear = sk(lt, 20.85, 21.1) * (1 - sk(lt, 21.95, 22.15)), tilt = -.15 * hear;   /* the text gate allows 12 degrees on her badge: this is 8.6 plus the badge's own tilt */
  o.rot = tilt + .05 * sk(lt, 22.1, 22.3) * (1 - sk(lt, 22.3, 22.8));
  o.expr = lt < 20.9 ? 'fp14v_flat' : lt < 21.95 ? 'fp14v_hear' : 'fp14v_flat';
  o.look = track([[20.5, [.2, -.5]], [20.9, [.55, -.4]], [21.95, [.6, -.45]], [22.1, [0, .05]], [22.45, [0, .05]], [22.8, [.9, .1]]], lt);
  o.mouthOpen = inR(lt, 21.0, 21.9) ? .1 + .05 * Math.sin(lt * 9) : 0;
  o.shake = inR(lt, 21.0, 21.9) ? 1.4 : 0;
  const cap = inR(lt, 20.5, 20.98);   /* straightens her cap, then both hands to the tumbler */
  o.arms = { l: 'hold', r: 'hold' }; o.hand = { l: 'grip', r: cap ? 'open' : 'grip' };
  const tx = o.x - 118, ty = o.y + 8;
  o.grip = { l: gripTo(o, -1, tx + 6, ty), r: cap ? gripTo(o, 1, o.x + 40, o.y - 150 + 8 * Math.sin((lt - 20.5) * 14)) : gripTo(o, 1, tx + 10, ty + 26) };
  o.tx = tx; o.ty = ty;
  return o;
}
function doorWall() { return art('doorwall', WW, WH, 1.25, () => { ctx.translate(-WX0, 0); paintWall(); paintFloor(); }); }
function drawBlind(lt, r, tilt) {
  const x0 = PANE.x - 4, x1 = PANE.x + PANE.w + 4, top = PANE.y - 4 + 2 * damp(lt, D_CLOSE, 30, .12), full = PANE.h + 8, bottom = top + 20 + lerp(full - 20, 62, r);
  rbox(x0 - 10, top - 24, x1 - x0 + 20, 26, '#d8d2c0', { r: 7, lw: 2.6 });
  const n = 26, pitch = (bottom - top - 6) / n, th = lerp(3.4, pitch * 1.3, tilt);
  for (let i = 0; i < n; i++) { const y = top + 4 + i * pitch; ctx.fillStyle = i % 2 ? '#f4eddb' : '#ece3cc'; ctx.fillRect(x0, y, x1 - x0, th); ctx.fillStyle = 'rgba(90,70,40,.35)'; ctx.fillRect(x0, y + th - 1.4, x1 - x0, 1.4); }
  rbox(x0 - 4, bottom - 2, x1 - x0 + 8, 13, '#c4bca6', { r: 5, lw: 2.2 });
  return bottom;
}
function drawDoor(lt, sh) {
  ctx.save(); ctx.translate(0, DFLOOR - 944); ctx.drawImage(doorWall(), WX0, 0, WW, WH); ctx.restore();
  const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,200,120,0)'); g.addColorStop(1, 'rgba(255,196,110,.34)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, DFLOOR);   /* the afternoon sun from the right */
  // the door: a cream frame, a wood leaf, hinges, a kick plate, a lever handle, a brass plaque; the pane is cut out of the leaf
  rbox(DR.x - 30, DR.y - 30, DR.w + 60, DR.h + 30, '#fff7ec', { r: 8, lw: 3 }); rbox(DR.x, DR.y, DR.w, DR.h, vgrad(DR.y, DR.y + DR.h, '#c39662', '#a9784a'), { r: 4, lw: 3 });
  ctx.strokeStyle = 'rgba(255,230,190,.28)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(DR.x + 6, DR.y + DR.h - 6); ctx.lineTo(DR.x + 6, DR.y + 6); ctx.lineTo(DR.x + DR.w - 6, DR.y + 6); ctx.stroke();
  for (const hy of [DR.y + 80, DR.y + DR.h / 2, DR.y + DR.h - 100]) rbox(DR.x - 7, hy, 16, 54, '#b9c0c8', { r: 4, lw: 2.4 });
  rbox(DR.x + 6, DR.y + DR.h - 110, DR.w - 12, 100, vgrad(0, 100, '#c9d0d8', '#9aa2ac'), { r: 5, lw: 3 });
  rbox(DR.x + DR.w - 66, 930, 52, 16, '#c9d0d8', { r: 8, lw: 2.6 }); disc(DR.x + DR.w - 24, 938, 15, 15, '#b3bac3', OUT, 2.6);
  rbox(DR.x + 120, DR.y + 36, 160, 44, '#d6b06a', { r: 6, lw: 2.6 });
  UI.container('doorplate14', 'sign', [DR.x + 120, DR.y + 36, DR.x + 280, DR.y + 80], 6);
  UI.label("NURSES' STATION", DR.x + 200, DR.y + 58, { size: 20, fill: '#4a3216', hero: false, maxW: 140, cid: 'doorplate14', center: true });
  // the pane: aluminium frame, then what is behind the glass
  rbox(PANE.x - 16, PANE.y - 16, PANE.w + 32, PANE.h + 32, '#aeb6bf', { r: 10, lw: 3 });
  ctx.save(); ctx.beginPath(); ctx.roundRect(PANE.x, PANE.y, PANE.w, PANE.h, 6); ctx.clip();
  V2.dof(7, () => stationBackdrop(lt));
  const so = actStrawDoor(lt);
  V2.setLight({ key: [-.1, -.8], keyColor: '#e8f8ff', keyA: .24, rim: '#bfe8ff', rimA: .4, shadow: '#203038', shadowA: .3, bounce: '#dff6f0', bounceA: .12, amb: '#e8f8f4', ambA: .08 });
  drawChar(so);
  // the tumbler pressed to the glass beside her cheek: a clear drinking glass seen end-on (its rim, a thick base)
  { const r = 40; ctx.save(); ctx.translate(so.tx, so.ty); ctx.fillStyle = 'rgba(214,236,250,.34)'; disc(0, 0, r, r); ctx.strokeStyle = 'rgba(244,252,255,.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,130,160,.8)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, r - 7, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; disc(-r * .4, -r * .4, 9, 5); ctx.restore(); }
  const r = blindRaise(lt), tilt = lerp(.12, 1, sk(lt, D_CLOSE, D_CLOSE + .12));
  const bottom = drawBlind(lt, r, tilt);
  // reflections on the glass
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(PANE.x + 40, PANE.y); ctx.lineTo(PANE.x + 120, PANE.y); ctx.lineTo(PANE.x + 20, PANE.y + PANE.h); ctx.lineTo(PANE.x - 60, PANE.y + PANE.h); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(PANE.x + 170, PANE.y); ctx.lineTo(PANE.x + 200, PANE.y); ctx.lineTo(PANE.x + 100, PANE.y + PANE.h); ctx.lineTo(PANE.x + 70, PANE.y + PANE.h); ctx.fill();
  ctx.restore();
  // the cord (hangs beside the door; the pull is what the Kumquat holds) and the Kumquat himself
  const pulled = D_PULL.reduce((a, [s, e]) => a + easeIO(seg(lt, s, e)), 0), cy = 990 + 30 * pulled, cx = 790;
  const ko = A14.kumquat(Object.assign({ x: 902, y: DFLOOR, s: 1.5, who: 'kum', id: 'kumquat', pose: 'free' }));
  ko.expr = 'fp14v_grave'; ko.look = track([[20.5, [-.6, -.5]], [22.65, [-.6, .3]], [22.8, [-.2, .2]]], lt);
  ko.arms = { l: 'hold', r: 'hold' }; ko.hand = { l: 'grip', r: 'grip' };
  ko.grip = { l: gripTo(Object.assign({}, ko, { y: ko.y - (50 + .9 * 74) * ko.s }), -1, cx + 4, cy), r: gripTo(Object.assign({}, ko, { y: ko.y - (50 + .9 * 74) * ko.s }), 1, cx + 4, cy + 52) };
  ko.squash = .07 * Math.max(...D_PULL.map(([s, e]) => pulse(lt, s, e - s))) + .06 * pulse(lt, D_CLOSE + .1, .3); ko.plant = true;
  seg1(cx, PANE.y - 20, cx, cy, '#6a5a44', 3.4); seg1(cx + 2, PANE.y - 20, cx + 2, cy, 'rgba(255,240,200,.4)', 1.2); rbox(cx - 6, cy - 4, 12, 26, '#8a5a34', { r: 5, lw: 2 });
  V2.setLight(Object.assign({}, LIGHT_BASE, { key: [.7, -.4], keyA: .3 }));
  drawChar(ko);
  void sh; void bottom;
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ the clipboard insert on "Noted.": Stateman's writing hand is large in frame; the pen writes "F-9" and a few more strokes (ink strokes only: a scrawl as shapes, no text is ever drawn here)
const INK_T0 = 23.58, INK_COL = '#1b2a68';
/* handwriting as pen-down strokes in a unit box (u across, v down). One glyph per cell: an F, a dash, three 9s; the last 9 is cut short (the scene fades on the pen). [stroke points, seconds] */
const GL9 = [[.79, .24], [.66, .08], [.44, .05], [.26, .18], [.22, .38], [.34, .54], [.58, .56], [.76, .42], [.80, .26], [.81, .58], [.74, .84], [.58, .97], [.38, .95]];
const at9 = (u0, w, lean, cut = 1) => GL9.slice(0, Math.ceil(GL9.length * cut)).map(([u, v]) => [u0 + (u + lean * (1 - v)) * w, v]);
const SCRAWL = [
  { p: [[.045, .08], [.036, .50], [.026, .98]], d: .10 },
  { p: [[.040, .09], [.100, .035], [.17, .06]], d: .06, gap: .025 },
  { p: [[.040, .50], [.085, .47], [.125, .50]], d: .05, gap: .025 },
  { p: [[.205, .60], [.235, .55], [.275, .56]], d: .05, gap: .03 },
  { p: at9(.318, .20, .05), d: .17, gap: .03 },
  { p: at9(.540, .20, .07), d: .15, gap: .03 },
  { p: at9(.762, .20, .09, .62), d: .09, gap: .03 },
];
/* Catmull-Rom through a few points: dense polyline */
function smoothPts(p, n = 7) {
  if (p.length < 3) return p.slice();
  const out = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(p.length - 1, i + 2)];
    for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(k => .5 * ((2 * b[k]) + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3))); }
  }
  out.push(p[p.length - 1]); return out;
}
let INKT = null;
function inkTimes() {
  if (INKT) return INKT;
  let t = INK_T0; INKT = SCRAWL.map(s => { t += s.gap || 0; const o = { pts: smoothPts(s.p), t0: t, t1: t + s.d }; t += s.d; return o; });
  return INKT;
}
const inkEnd = () => { const k = inkTimes(); return k[k.length - 1].t1; };
/* draws the ink written up to lt inside box [bx, by, bw, bh]; returns the nib position and whether the pen is down */
function inkAt(box, lt) {
  const [bx, by, bw, bh] = box, P = ([u, v]) => [bx + u * bw, by + v * bh], seq = inkTimes();
  let nib = P(seq[0].pts[0]), down = false;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pass = (lw, col, dx, dy) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    for (const s of seq) {
      if (lt <= s.t0) break;
      const f = Math.min(1, (lt - s.t0) / (s.t1 - s.t0)), m = Math.max(1, Math.round((s.pts.length - 1) * (f * f * (3 - 2 * f) * .5 + f * .5)));
      ctx.beginPath(); for (let i = 0; i <= m && i < s.pts.length; i++) { const q = P(s.pts[i]); i ? ctx.lineTo(q[0] + dx, q[1] + dy) : ctx.moveTo(q[0] + dx, q[1] + dy); } ctx.stroke();
    }
  };
  pass(10, 'rgba(10,16,50,.22)', 3, 4); pass(8.4, INK_COL, 0, 0); pass(2.6, 'rgba(150,175,255,.42)', -1.6, -2);
  ctx.restore();
  for (let i = 0; i < seq.length; i++) {
    const s = seq[i], nx = seq[i + 1];
    if (lt < s.t0) { if (i) { const pv = seq[i - 1], k = sk(lt, pv.t1, s.t0), a = P(pv.pts[pv.pts.length - 1]), b = P(s.pts[0]); nib = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; } break; }
    if (lt < s.t1) { const f = (lt - s.t0) / (s.t1 - s.t0), j = Math.min(s.pts.length - 1, Math.floor(f * (s.pts.length - 1))); nib = P(s.pts[j]); down = true; break; }
    nib = P(s.pts[s.pts.length - 1]);
    if (!nx) break;
  }
  return { nib, down };
}
/* the big hand: a dark sleeve with a knitted cuff coming in from the lower right (as the character's own arm), the pen under the glove, the nib on the end of the ink; (nx, ny) = the nib */
function penHand(nx, ny, lt, down) {
  const wob = down ? 2.4 * Math.sin(lt * 61) : 0, th = .98 + .012 * Math.sin(lt * 5.3);
  ctx.save(); ctx.translate(nx + wob * .3, ny + wob * .2);
  ctx.rotate(th);
  // the arm: a tapered dark sleeve (the character's limb colour) going out of the frame, a rim light on its upper edge
  ctx.save(); ctx.translate(196, 30); ctx.rotate(.16);
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 34; ctx.shadowOffsetX = 18; ctx.shadowOffsetY = 28;
  ctx.fillStyle = V2.grad(0, -110, 0, 110, [[0, '#4a4660'], [.35, '#2f2a3a'], [1, '#17131d']]); ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(980, -104); ctx.lineTo(980, 104); ctx.lineTo(0, 58); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(14,10,20,.9)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(190,200,235,.34)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(40, -53); ctx.lineTo(960, -98); ctx.stroke();
  ctx.fillStyle = '#5a5470'; ctx.beginPath(); ctx.roundRect(-16, -68, 100, 136, 24); ctx.fill(); ctx.strokeStyle = 'rgba(14,10,20,.9)'; ctx.lineWidth = 5; ctx.stroke();   /* the knitted cuff */
  ctx.strokeStyle = 'rgba(20,14,30,.5)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(8 + i * 18, -60); ctx.lineTo(8 + i * 18, 60); ctx.stroke(); }
  ctx.restore();
  // the pen: steel tip, slate barrel with a shine, a clip and a white clicker
  ctx.shadowColor = 'rgba(0,0,0,.34)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#c3cad4'; ctx.strokeStyle = 'rgba(29,26,34,.92)'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(70, -14); ctx.lineTo(70, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = '#1b2a68'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, -4.4); ctx.lineTo(22, 4.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = V2.grad(0, -19, 0, 19, [[0, '#6f98cc'], [.5, '#3f6296'], [1, '#27426a']]); ctx.beginPath(); ctx.roundRect(70, -18, 340, 36, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(88, -12, 300, 5);
  ctx.fillStyle = '#c3cad4'; ctx.beginPath(); ctx.roundRect(262, -27, 124, 11, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e9edf4'; ctx.beginPath(); ctx.roundRect(408, -17, 54, 34, 13); ctx.fill(); ctx.stroke();
  // the glove: a fist over the pen with the thumb on the near side; the nib end sticks out in front
  ctx.save(); ctx.translate(196, 26); ctx.rotate(PI + .5); ctx.scale(1, -1); ctx.scale(5, 5);
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#5a5470'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand('grip', 1, {});
  ctx.restore();
  ctx.restore();
}
function drawClip(lt, sh) {
  // the desk: dark wood with a soft grain, the board lit from the upper left
  ctx.fillStyle = vgrad(-300, H + 300, '#6a4426', '#24140a'); ctx.fillRect(-300, -300, W + 600, H + 600);
  V2.dof(10, () => { for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,220,170,.06)' : 'rgba(0,0,0,.1)'; ctx.fillRect(-300, i * 160 - 120, W + 600, 70 + 30 * (i % 3)); } });
  V2.glow(300, 420, 700, '255,226,170', .22, 'screen', .8);
  const BX = 120, BY = 230, BW = 840, BH = 1130;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 26; rbox(BX, BY, BW, BH, V2.grad(BX, BY, BX + BW, BY + BH, [[0, '#c4905a'], [1, '#93673a']]), { r: 22, lw: 5, stroke: 'rgba(30,16,8,.9)' }); ctx.restore();
  // the sheet: the survey form on top (header, ticked rows), and a boxed field below where he writes
  const SX = BX + 56, SY = BY + 110, SW = BW - 112, SH = BH - 150, SPLIT = SY + SH * .62;
  drawForm(SX, SY, SW, SPLIT - SY, { rows: 5, fill: .6 });
  ctx.fillStyle = '#f4f1e6'; ctx.fillRect(SX, SPLIT - 2, SW, SY + SH - SPLIT + 2);
  ctx.strokeStyle = 'rgba(60,50,30,.55)'; ctx.lineWidth = 3.4; ctx.strokeRect(SX, SY, SW, SH);
  ctx.fillStyle = vgrad(SPLIT, SPLIT + 26, 'rgba(60,50,30,.2)', 'rgba(60,50,30,0)'); ctx.fillRect(SX, SPLIT, SW, 26);
  const FLD = { x: SX + 40, y: SPLIT + 84, w: SW - 80, h: 220 };
  ctx.fillStyle = 'rgba(70,80,100,.4)'; ctx.fillRect(SX + 40, SPLIT + 30, 210, 12); ctx.fillRect(SX + 266, SPLIT + 30, 96, 12);
  rbox(FLD.x, FLD.y, FLD.w, FLD.h, '#fff9de', { r: 10, lw: 4, stroke: 'rgba(70,80,100,.8)' });
  ctx.strokeStyle = 'rgba(120,140,190,.3)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(FLD.x + 24, FLD.y + FLD.h - 50); ctx.lineTo(FLD.x + FLD.w - 24, FLD.y + FLD.h - 50); ctx.stroke();
  // the steel clip at the top of the board
  rbox(BX + BW * .3, BY - 34, BW * .4, 96, V2.grad(0, BY - 34, 0, BY + 62, [[0, '#eef2f8'], [1, '#98a2b0']]), { r: 16, lw: 5, stroke: 'rgba(30,36,50,.9)' }); disc(BX + BW / 2, BY + 10, 20, 20, '#6c7584', OUT, 3);
  // the ink and the hand that writes it
  const r = inkAt([FLD.x + 40, FLD.y + 26, FLD.w - 80, FLD.h - 76], lt);
  penHand(r.nib[0], r.nib[1], lt, r.down);
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ lower thirds in the field-guide design (a specimen tag: cream paper, forest-green edge, name, the Latin name in italics, a role line); screen space, hero text
const THIRDS = [
  { id: 'cran', a: 6.95, b: 9.55, name: 'MRS. CRANBERRY', latin: 'Vaccinium macrocarpon', role: 'RESIDENT' },
  { id: 'pear', a: 10.84, b: 13.35, name: 'MR. PEAR', latin: 'Pyrus communis', role: 'RESIDENT' },
  { id: 'banana', a: 14.2, b: 16.05, name: 'MR. BANANA', latin: 'Musa acuminata', role: 'RESIDENT (INCIDENTS: 49)' },
];
function drawThird(t, k) {
  const L = [{ t: t.name, size: 46, fill: C.ink }, { t: t.latin, size: 32, italic: true, weight: 800, fill: C.forest }, { t: t.role, size: 30, fill: '#9a2a1c', spacing: 1.5 }];
  const widest = Math.max(...L.map(l => UI.sizeOf(l.t, l).w)), hole = 16, w = Math.max(430, widest + 38 + hole * 4.4 + 8), h = 178, x0 = 64, cy = 1250;
  ctx.save(); ctx.globalAlpha *= k; ctx.translate((1 - k) * -26, 0);
  const r = UI.tag(L, x0 + w / 2, cy, { w, h, size: 38, fill: C.cream, stroke: C.forest, lw: 4, hole, holeFill: 'rgba(36,64,46,.85)', id: 'third-' + t.id, lh: 1.16 });
  ctx.strokeStyle = C.ochre; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x0 + 62, r.y1 - 8); ctx.lineTo(r.x1 - 18, r.y1 - 8); ctx.stroke();   /* a brass rule along the foot of the tag */
  regLocal('overlay', r.x0, r.y0, r.x1, r.y1, { id: 'third-' + t.id });
  ctx.restore();
}
function lowerThirds(lt) {
  for (const t of THIRDS) {
    const k = sk(lt, t.a, t.a + .3) * (1 - sk(lt, t.b - .28, t.b));
    if (k > .01) drawThird(t, k);
  }
}
/*@@PARTS@@*/

// ------------------------------------------------------------------ the shots: a camera, who is in it, how soft the room is, how far the room is dropped (a lower camera puts the window behind the face)
const ALL = ['kum', 'star', 'cran', 'pear', 'goji', 'banana', 'lemon', 'mango', 'clem', 'straw'];
const faceNow = (id, lt) => {
  if (id === 'banana') return faceOfStanding(actBan(lt, {}));
  if (STAFF[id]) return faceOfStanding(actStaff(id, lt, {}));
  const o = { star: actStar, kum: actKum, cran: actCran, pear: actPear, goji: actGoji }[id](lt, {});
  return faceOfSeated(o);
};
/* aim the camera so that character id's face lands at screen (sx, sy) at zoom z */
const camOn = (id, lt, z, sx, sy) => { const [fx, fy] = faceNow(id, lt); zoomTo(fx + (540 - sx) / z, fy + (960 - sy) / z, z); };
const SHOTS = [
  { id: 'wide', a: 0, b: 1.0, show: ALL, dof: 0, cam: (lt, u) => zoomTo(540, lerp(950, 940, u), lerp(1.04, 1.08, u)) },
  { id: 'file', a: 1.0, b: 3.77, show: ['kum', 'star', 'cran', 'pear', 'goji', 'lemon', 'mango', 'clem', 'straw'], dof: 1.5, cam: (lt, u) => zoomTo(lerp(450, 440, easeIO(u)), 985, lerp(1.22, 1.3, u)) },
  { id: 'straw', a: 3.77, b: 4.565, show: ['straw'], dof: 8, cam: (lt, u) => camOn('straw', lt, lerp(2.3, 2.45, u), 540, 720) },
  { id: 'st2', a: 4.565, b: 6.731, show: ['star'], dof: 9, bgDy: 110, chairsBg: true, halo: ['star', .28, 320], cam: (lt, u) => camOn('star', lt, lerp(2.9, 3.2, u), 470, 740) },
  { id: 'cr1', a: 6.731, b: 10.14, show: ['cran'], dof: 10, bgDy: 110, chairsBg: true, halo: ['cran', .5, 380], glow: 1.5, cam: (lt, u) => camOn('cran', lt, lerp(2.8, 3.15, u), 620, 730) },
  { id: 'smile', a: 10.14, b: 10.62, show: ['star'], dof: 9, bgDy: 110, chairsBg: true, halo: ['star', .28, 320], cam: (lt, u) => camOn('star', lt, lerp(3.35, 3.5, u), 470, 740) },
  { id: 'pr1', a: 10.62, b: 14.089, show: ['pear'], dof: 9, bgDy: 110, chairsBg: true, halo: ['pear', .3, 340], cam: (lt, u) => camOn('pear', lt, lerp(2.5, 2.75, u), 560, 740) },
  { id: 'b1', a: 14.089, b: 16.282, show: ['banana'], dof: 8, bgDy: 90, halo: ['banana', .3, 300], cam: (lt, u) => { const k = easeIO(sk(lt, 14.94, 15.9)), [fx, fy] = faceNow('banana', lt); zoomTo(lerp(fx + (540 - 600) / 2.9, X.banana + 8, k), lerp(fy + (960 - 610) / 2.9, 1066, k), lerp(2.9, 1.75, k)); } },
  { id: 'st3', a: 16.282, b: 17.75, show: ['star'], dof: 9, bgDy: 110, chairsBg: true, halo: ['star', .28, 300], cam: (lt, u) => camOn('star', lt, lerp(3.0, 3.25, u), 500, 700) },
  { id: 'goji', a: 17.75, b: 18.593, show: ['goji'], dof: 9, bgDy: 110, chairsBg: true, halo: ['goji', .26, 320], cam: (lt, u) => camOn('goji', lt, lerp(3.0, 3.15, u), 560, 740) },
  { id: 'ra4', a: 18.593, b: 20.35, show: ['cran', 'pear', 'goji', 'banana'], dof: 5, bgDy: 70, chairsBg: true, glow: 1.3, cam: (lt, u) => zoomTo(690, lerp(1052, 1044, u), lerp(1.45, 1.62, easeIO(u))) },
  { id: 'door', a: 20.35, b: 22.903, view: 'door', show: [], cam: () => zoomTo(540, 960, 1) },
  { id: 'st4', a: 22.903, b: 23.5, show: ['star'], dof: 9, bgDy: 110, chairsBg: true, halo: ['star', .28, 320], cam: (lt, u) => camOn('star', lt, lerp(3.1, 3.25, u), 480, 740) },
  { id: 'clip', a: 23.5, b: 24.7, view: 'clip', show: [], cam: (lt, u) => zoomTo(lerp(540, 575, u), lerp(1010, 1130, u), lerp(1.0, 1.22, u)) },
];
const shotAt = lt => { for (const s of SHOTS) if (lt < s.b) return s; return SHOTS[SHOTS.length - 1]; };

// ------------------------------------------------------------------ the scene
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.voices = {
  shot: lt => shotAt(lt).id,
  cam(lt) {
    const sh = shotAt(lt); zoomTo(540, 960, 1);
    sh.cam(lt, seg(lt, sh.a, sh.b));
    CAM.x += .7 * Math.sin(lt * .83); CAM.y += .6 * Math.sin(lt * .67 + 1);   /* a hint of a hand */
  },
  draw(lt) {
    const sh = shotAt(lt);
    ctx.fillStyle = '#1a0e08'; ctx.fillRect(-600, -600, W + 1200, H + 1200);
    if (sh.view === 'door') { drawDoor(lt, sh); return; }
    if (sh.view === 'clip') { drawClip(lt, sh); return; }
    const bgf = () => { ctx.save(); ctx.translate(0, sh.bgDy || 0); ctx.drawImage(roomBack(), WX0, 0, WW, WH); roomLive(lt, sh); if (sh.chairsBg) { ctx.translate(0, -(sh.bgDy || 0)); drawChairs(new Set(sh.show)); } ctx.restore(); };
    if ((sh.dof || 0) > .5) V2.dof(sh.dof, bgf); else bgf();
    if (sh.halo) { const [hid, ha, hr] = sh.halo, [hx, hy] = faceNow(hid, lt); V2.glow(hx + 30, hy - 60, hr, '255,228,172', ha, 'screen', .9); }
    drawCast(lt, sh);
    sunLight(lt, sh);
  },
  fx(lt) {
    return { bloom: .5, vignette: .5, grain: .06, contrast: .14, sat: .14, tint: [['#ffb36b', .14, 'soft-light'], ['#2a1208', .1, 'multiply']],
      fade: Math.max(1 - seg(lt, 0, .3), seg(lt, 24.28, 24.64)), fadeColor: '20,10,4' };
  },
  blur(lt) {
    const sh = shotAt(lt);
    if (lt - sh.a < .05 || sh.b - lt < .04) return 1;
    return 1;
  },
  over(lt) { lowerThirds(lt); },
};
})();
