'use strict';
/* SHIFT HAPPENS, Episode 15: The Merger. Scene module E15-A: `close` (26.09 s, 6:00 PM, THE CLOSING), registered on window.__EP15_SCENES.close. Prefix for anything new: fp15c_.
 * Kits: S15 (the tower, dusk), A15 + A7/A9/A10/A11 (the cast, with `yaw`), SH15 (the sheet, the call, Binder's bubble, key caps), PHYS2D through ep15_close_sim.js (the banner cloth, the tossed salad), UI (all text).
 * Every dependency is guarded: if one is missing the scene still registers and draws what it can.
 *
 * SHOT LIST (scene-local seconds; beats from build/ep15/timeline.json):
 *   0.20-1.80  open     the banner: a roll hung from a bar by two cables from the crane's hook unrolls down the front of the tower (cloth physics), the camera tilts down with it. FRUIT SALAD REHAB & NURSING.
 *   1.90-6.30  street   the welcome photo: the staff stand in front of the tower seen from behind and three-quarters, looking at the banner; l1 Lemon, t1 Tomato, m1 Mango, o1 Onion turn their heads to each other.
 *   6.32-7.50  toss     b1 Binder with giant salad tongs: lettuce and badges fly (physics) on "Tossed!".
 *   7.70-12.4  admins   a1 Melon with the pizza, Broccoli with the salad, o2 Onion sobbing, t2 Tomato "Counted." + a COUNTED stamp on a form.
 *   12.56-15.1 tv       the rolling TV: Mr. Artichoke peeled to his heart among his petals.
 *   15.3-17.3  undo     Strawberry's laptop: Ctrl, Z, the counter 214 dips and jumps back, "Can't undo."
 *   17.35-23.1 binder   b2, s1 Strawberry flat, b3 the break request and Binder's bubble, s2, b4 the grin.
 *   23.34-26.09 end     the last wide: the banner lit, a spinner ring over the building, PENDING in the sign. */
(() => {
if (!window.TIMELINE_EP15 || !window.UI || !window.H6) return;
window.__EP15_SCENES = window.__EP15_SCENES || {};
const { zoomTo } = window.H6;
const SC_NAME = 'close';

// ------------------------------------------------------------------ small maths (the engine's seg, lerp, easeIO ... are globals; these are the few extras)
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sg = (t, a, b) => cl((t - a) / (b - a));
const eIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const eO = k => 1 - Math.pow(1 - k, 3);
const eI = k => k * k * k;
const eB = (k, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mixh = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = s => Math.round(lp((A >> s) & 255, (B >> s) & 255, k)); return `rgb(${f(16)},${f(8)},${f(0)})`; };
const lerpA = (a, b, k) => a.map((v, i) => lp(v, b[i], k));
const ringK = (age, tau) => age < 0 ? 0 : Math.exp(-age / tau);

// ------------------------------------------------------------------ the timeline: beats and the sound cues of this scene (scene-local seconds; the timeline is frozen)
const BEAT = {
  open: [.2, 1.8], l1: [1.9, 3.168], t1: [3.268, 4.166], m1: [4.266, 5.26], o1: [5.36, 6.216], b1: [6.316, 7.495], a1: [7.695, 9.157], o2: [9.307, 11.554], t2: [11.654, 12.365], ar1: [12.565, 15.097],
  undo: [15.297, 17.297], b2: [17.347, 18.077], s1: [18.177, 18.852], b3: [19.102, 21.598], s2: [21.748, 22.196], b4: [22.296, 23.139], end: [23.339, 25.539],
};
const CUE = { banner: .3, sob: 5.86, heartbeat: 14.165, key1: 15.497, key2: 15.697, error: 16.497, grin: 22.846, pending: 23.439, sting: 23.839 };
/* the moment a word of a line is spoken (scene-local): the timeline's word times are relative to the line start */
let LINES = null;
function wordT(id, idx) {
  if (!LINES) {
    LINES = {};
    const tl = window.TIMELINE_EP15, sc = tl && tl.scenes.find(s => s.id === SC_NAME);
    if (sc) for (const l of tl.lines) if (l.scene === SC_NAME) LINES[l.id] = { s: l.s - sc.start, e: l.e - sc.start, words: l.words };
  }
  const l = LINES[id];
  if (!l) return (BEAT[id] || [0])[0];
  const w = l.words[Math.min(idx, l.words.length - 1)];
  return l.s + (w ? w[1] : 0);
}

// ------------------------------------------------------------------ the physics: built once, lazily, sampled with world.at(lt)
let SIMR = null, SIMST = null;
function sim() {
  if (SIMR !== null) return SIMR || null;
  try {
    const S = window.__EP15_SIMS && window.__EP15_SIMS.close;
    SIMR = S ? S.build() : false;
    if (SIMR) SIMST = SIMR.world.makeState();
  } catch (e) { console.error('E15-A close sim: ' + (e && e.stack || e)); SIMR = false; }
  return SIMR || null;
}
const simAt = lt => { const r = sim(); return r ? r.world.at(Math.max(0, lt), SIMST) : null; };

// ------------------------------------------------------------------ the tower's state (S15): finished, sunk one floor, the Executive Suite on top, at dusk; the crane's spreader holds the banner's cables
const HOOK_Y = -1080, TOD = .9;
function towerSt(lt, extra) {
  return Object.assign({ exec: 1, sink: 1, tod: TOD, t: lt, crane: { hook: [540, HOOK_Y] }, signs: { 'door:rest': 'PENDING ROOM' } }, extra || {});
}
/* is a box (in the current world transform) a place where hero text may sit: inside the frame by 44 px, out of the caption zone and the clock pill */
function heroOK(x0, y0, x1, y1, sizePx) {
  const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b);
  const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const X0 = Math.min(...pts.map(p => p[0])), X1 = Math.max(...pts.map(p => p[0])), Y0 = Math.min(...pts.map(p => p[1])), Y1 = Math.max(...pts.map(p => p[1]));
  if (sizePx * sc < 31) return false;
  if (X0 < 44 || Y0 < 44 || X1 > W - 44 || Y1 > H - 44) return false;
  if (Y1 > 1374 && Y0 < 1706) return false;
  if (X1 > 44 && X0 < 506 && Y1 > 110 && Y0 < 250) return false;
  return true;
}

// ================================================================================================ THE BANNER: cloth mesh (PHYS2D), the roll, the bar, the cables, the lettering
const BN = { cols: 15, rows: 9, W: 1100, H: 520, sub: 3 };
const crm = (p0, p1, p2, p3, t) => .5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
let DENSE = null;
/* the simulated grid (15 x 9 points of x y z) smoothed into a 43 x 25 mesh (Catmull-Rom both ways), with a unit normal per vertex */
function bannerMesh(P) {
  const { cols, rows, sub } = BN, nu = (cols - 1) * sub + 1, nv = (rows - 1) * sub + 1, n = nu * nv;
  if (!DENSE || DENSE.n !== n) DENSE = { n, nu, nv, X: new Float32Array(n), Y: new Float32Array(n), Z: new Float32Array(n), NX: new Float32Array(n), NY: new Float32Array(n), NZ: new Float32Array(n) };
  const D = DENSE, at = (c, r, k) => P[3 * (cl(r, 0, rows - 1) * cols + cl(c, 0, cols - 1)) + k];
  for (let b = 0; b < nv; b++) {
    const gv = b / sub, j0 = Math.min(rows - 2, Math.floor(gv)), fv = gv - j0;
    for (let a = 0; a < nu; a++) {
      const gu = a / sub, i0 = Math.min(cols - 2, Math.floor(gu)), fu = gu - i0, o = b * nu + a;
      for (let k = 0; k < 3; k++) {
        const r0 = crm(at(i0 - 1, j0 - 1, k), at(i0, j0 - 1, k), at(i0 + 1, j0 - 1, k), at(i0 + 2, j0 - 1, k), fu), r1 = crm(at(i0 - 1, j0, k), at(i0, j0, k), at(i0 + 1, j0, k), at(i0 + 2, j0, k), fu);
        const r2 = crm(at(i0 - 1, j0 + 1, k), at(i0, j0 + 1, k), at(i0 + 1, j0 + 1, k), at(i0 + 2, j0 + 1, k), fu), r3 = crm(at(i0 - 1, j0 + 2, k), at(i0, j0 + 2, k), at(i0 + 1, j0 + 2, k), at(i0 + 2, j0 + 2, k), fu);
        const v = crm(r0, r1, r2, r3, fv);
        if (k === 0) D.X[o] = v; else if (k === 1) D.Y[o] = v; else D.Z[o] = v;
      }
    }
  }
  for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) {
    const o = b * nu + a, ol = b * nu + Math.max(0, a - 1), or_ = b * nu + Math.min(nu - 1, a + 1), ou = Math.max(0, b - 1) * nu + a, od = Math.min(nv - 1, b + 1) * nu + a;
    const ux = D.X[or_] - D.X[ol], uy = D.Y[or_] - D.Y[ol], uz = D.Z[or_] - D.Z[ol], vx = D.X[od] - D.X[ou], vy = D.Y[od] - D.Y[ou], vz = D.Z[od] - D.Z[ou];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    D.NX[o] = nx / l; D.NY[o] = ny / l; D.NZ[o] = nz / l;
  }
  return D;
}
const FAB = { base: '#1f7a50', lit: '#37b57a', dark: '#0f3d2a', cream: '#f3ecd0', gold: '#ffbf1f', hem: '#14513b' };
/* draw the banner cloth: panel quads lit by the dusk key, the border piping and the inner gold line as isolines of the mesh, the hem; then the roll while it unrolls. Returns the bar state for the lettering. */
function drawBannerCloth(lt, st) {
  const cs = st.cloths[0], bar = st.by[sim().meta.bar], D = bannerMesh(cs.pts), { nu, nv } = D, roll = cs.roll;
  const Lx = -.42, Ly = -.55, Lz = .72, Ll = Math.hypot(Lx, Ly, Lz);
  ctx.save();
  ctx.lineJoin = 'round';
  for (let b = 0; b < nv - 1; b++) for (let a = 0; a < nu - 1; a++) {
    const o00 = b * nu + a, o10 = o00 + 1, o01 = o00 + nu, o11 = o01 + 1;
    const x0 = D.X[o00], y0 = D.Y[o00], x1 = D.X[o10], y1 = D.Y[o10], x2 = D.X[o11], y2 = D.Y[o11], x3 = D.X[o01], y3 = D.Y[o01];
    const area = Math.abs((x2 - x0) * (y3 - y1) - (x3 - x1) * (y2 - y0)) * .5;
    if (area < .6) continue;
    const nx = (D.NX[o00] + D.NX[o11]) * .5, ny = (D.NY[o00] + D.NY[o11]) * .5, nz = (D.NZ[o00] + D.NZ[o11]) * .5;
    const dp = Math.abs(nx * Lx + ny * Ly + nz * Lz) / Ll, v = (b + .5) / (nv - 1);
    const k = cl(.30 + .82 * dp + .1 * (1 - v), 0, 1.2);
    const c = k < .6 ? mixh(FAB.dark, FAB.base, k / .6) : mixh(FAB.base, FAB.lit, (k - .6) / .6);
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = .9;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  /* isolines: the cream piping and the thin gold line follow the cloth */
  const iso = (fu, fv0, fv1, col, lw, along) => {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.beginPath(); let started = false;
    if (along === 'v') { const a = Math.round(fu * (nu - 1)); for (let b = Math.round(fv0 * (nv - 1)); b <= Math.round(fv1 * (nv - 1)); b++) { const o = b * nu + a; if (!started) { ctx.moveTo(D.X[o], D.Y[o]); started = true; } else ctx.lineTo(D.X[o], D.Y[o]); } }
    else { const b = Math.round(fv0 * (nv - 1)); for (let a = Math.round(fu * (nu - 1)); a <= Math.round(fv1 * (nu - 1)); a++) { const o = b * nu + a; if (!started) { ctx.moveTo(D.X[o], D.Y[o]); started = true; } else ctx.lineTo(D.X[o], D.Y[o]); } }
    ctx.stroke();
  };
  const released = roll.done ? 1 : cl((roll.y - bar.y) / BN.H, 0, 1);
  if (released > .05) {
    const vEnd = Math.min(1, released);
    ctx.globalAlpha = .95;
    iso(0, 0, vEnd, FAB.cream, 17, 'v'); iso(1, 0, vEnd, FAB.cream, 17, 'v');
    iso(.031, 0, vEnd, FAB.gold, 3.2, 'v'); iso(.969, 0, vEnd, FAB.gold, 3.2, 'v');
    if (vEnd >= .99) { iso(0, 1, 1, FAB.cream, 17, 'u'); iso(.031, .93, 1, FAB.gold, 3.2, 'u'); ctx.globalAlpha = 1; iso(0, .955, 1, FAB.hem, 28, 'u'); }
    ctx.globalAlpha = 1;
  }
  /* the roll that falls and shrinks while the cloth is released */
  if (!roll.done && roll.r > .6) {
    const last = (BN.rows - 1) * BN.cols, xa = cs.pts[3 * last] - 6, xb = cs.pts[3 * (last + BN.cols - 1)] + 6, y = roll.y, r = roll.r;
    const g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, '#6fd6a2'); g.addColorStop(.45, '#1f7a50'); g.addColorStop(1, '#0c3a28');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(xa, y - r, xb - xa, 2 * r, Math.min(r, 14)); ctx.fill(); ctx.strokeStyle = 'rgba(8,30,20,.9)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xa + 10, y - r * .45); ctx.lineTo(xb - 10, y - r * .45); ctx.stroke();
  }
  ctx.restore();
  return { bar, roll };
}
/* the bar (a wooden pole with brass end caps), its two cables to the spreader, and the lettering (hero only once the banner is down) */
function drawBannerRig(lt, st, bs, o = {}) {
  const { bar } = bs, ca = Math.cos(bar.angle), sa = Math.sin(bar.angle), half = BN.W / 2 + 14, rig = window.S15 ? S15.craneRig(lt, towerSt(lt)) : null;
  const eyes = rig ? [rig.eyes[0], rig.eyes[3]] : [[140, HOOK_Y + 100], [940, HOOK_Y + 100]];
  const ends = [[bar.x - half * ca, bar.y - half * sa], [bar.x + half * ca, bar.y + half * sa]];
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const [x0, y0] = eyes[i], [x1, y1] = ends[i];
    ctx.strokeStyle = 'rgba(20,14,26,.85)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = '#8d939c'; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 - 1, y0); ctx.lineTo(x1 - 1, y1); ctx.stroke();
    ctx.fillStyle = '#d9a52a'; ctx.strokeStyle = 'rgba(38,24,40,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x1, y1 - 6, 11, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.translate(bar.x, bar.y); ctx.rotate(bar.angle);
  const g = ctx.createLinearGradient(0, -10, 0, 12); g.addColorStop(0, '#9a6a3a'); g.addColorStop(.5, '#6b4524'); g.addColorStop(1, '#3d2614');
  ctx.fillStyle = g; ctx.strokeStyle = 'rgba(38,24,40,.85)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.roundRect(-half, -10, half * 2, 20, 9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e0b040'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.roundRect(sx * half - (sx > 0 ? 18 : 0), -13, 18, 26, 6); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function drawBannerText(lt, st, bs, o = {}) {
  const { bar, roll } = bs, FP = window.FP15A, down = roll.done && lt > 1.9, a = sg(lt, 1.15, 1.7);
  if (a <= .01) return;
  ctx.save(); ctx.translate(bar.x, bar.y + 9); ctx.rotate(bar.angle);
  if (!roll.done) { ctx.beginPath(); ctx.rect(-700, -20, 1400, Math.max(0, roll.y - bar.y - 9) + 20); ctx.clip(); }   /* the lettering shows only on the cloth that has come down */
  const cy = [164, 290, 382], wantHero = down && o.hero !== false, tt0 = (sim() && sim().meta.tossT) || 7.1, tossing = lt > tt0 + .2 && lt < tt0 + 2.7;   /* the tossed lettuce flies across the lettering for a moment: it is dressing then */
  const ok1 = wantHero && heroOK(-460, cy[0] - 60, 460, cy[0] + 60, 150), ok2 = wantHero && heroOK(-400, cy[1] - 40, 400, cy[1] + 40, 92), ok3 = wantHero && !tossing && heroOK(-360, cy[2] - 24, 360, cy[2] + 24, 52);
  if (FP) FP.bevelText('FRUIT SALAD', 0, cy[0], 150, { face: FP.FACE_LOGO, extr: .3, lwK: .12, alpha: a, hero: ok1, grp: 'bn:fs', spacing: 5 });
  else UI.label('FRUIT SALAD', 0, cy[0], { font: 'Bangers', size: 150, fill: '#ffe135', stroke: '#07170f', lw: 18, alpha: a, hero: ok1, crop: !ok1 });
  UI.label('REHAB & NURSING', 0, cy[1], { font: 'Bangers', size: 92, spacing: 6, fill: '#f6efd2', stroke: '#07170f', lw: 12, shadow: 10, alpha: a, hero: ok2, crop: !ok2 });
  if (o.tagline) o.tagline(0, cy[2], a, ok3);
  else UI.label('Better together. Tossed.', 0, cy[2], { font: 'Nunito', weight: 900, italic: true, size: 52, fill: '#fff6c8', stroke: '#07170f', lw: 9, shadow: 8, alpha: a, hero: ok3, crop: !ok3 });
  ctx.restore();
}
function drawBanner(lt, o = {}) {
  const st = simAt(lt);
  if (!st) return null;
  const bs = drawBannerCloth(lt, st);
  drawBannerRig(lt, st, bs, o);
  drawBannerText(lt, st, bs, o);
  return bs;
}

// ================================================================================================ THE STREET: the forecourt, the cast, the welcome photo
const STREET_Y = 1342;
const CAST = {
  straw: () => (window.A11 && A11.straw) || (window.A7 && A7.straw), lemon: () => window.A7 && A7.lemon, mango: () => window.A7 && A7.mango, clem: () => window.A10 && A10.clem, melon: () => window.A9 && A9.melon,
  tom: () => window.A15 && A15.tomato, onion: () => window.A15 && A15.onion && (o => A15.onion(Object.assign({ grip: { l: [-62, 94] }, tabAt: [.3, .0] }, o))), broc: () => window.A15 && A15.broccoli, carrot: () => window.A15 && A15.carrot, bind: () => window.A15 && A15.binder, arti: () => window.A15 && A15.artichoke,
};
const WARNED = new Set();
function dc(id, o) {   /* draw one character through its constructor; a missing kit or a throwing sprite never stops the scene */
  const f = CAST[id] && CAST[id]();
  if (!f) return null;
  try { const opts = f(o); drawChar(opts); return opts; } catch (e) { if (!WARNED.has(id)) { WARNED.add(id); console.error('E15-A close ' + id + ': ' + (e && e.message)); } return null; }
}
/* the forecourt: a slab of pavement in front of the sunk lobby, so the staff stand on something and the cutaway's soil does not show between their feet */
function forecourt(lt) {
  const x0 = -520, x1 = 1600, y0 = STREET_Y, y1 = STREET_Y + 74;
  ctx.save();
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#9b94a6'); g.addColorStop(.12, '#8a8497'); g.addColorStop(1, '#5d5868');
  ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = 'rgba(255,236,200,.34)'; ctx.fillRect(x0, y0, x1 - x0, 4);
  ctx.fillStyle = 'rgba(20,14,28,.5)'; ctx.fillRect(x0, y1 - 5, x1 - x0, 5);
  ctx.strokeStyle = 'rgba(20,14,28,.22)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = x0 + 60; x < x1; x += 140) { ctx.moveTo(x, y0 + 4); ctx.lineTo(x - 22, y1 - 5); }
  ctx.moveTo(x0, y0 + 36); ctx.lineTo(x1, y0 + 36); ctx.stroke();
  ctx.restore();
}
/* the welcome photo: who stands where (world x on the street, row 0 behind, row 1 in front) */
const GROUP = [
  { id: 'straw', x: 262, row: 0, s: .42 }, { id: 'carrot', x: 392, row: 0, s: .44 }, { id: 'broc', x: 520, row: 0, s: .44 }, { id: 'melon', x: 648, row: 0, s: .47 },
  { id: 'clem', x: 196, row: 1, s: .46 }, { id: 'lemon', x: 330, row: 1, s: .46 }, { id: 'tom', x: 456, row: 1, s: .46 }, { id: 'mango', x: 580, row: 1, s: .46 }, { id: 'onion', x: 706, row: 1, s: .46 },
];
const GX = Object.fromEntries(GROUP.map(g => [g.id, g]));
const BACK = Math.PI;
/* a head or body angle eased toward `to` between a (start) and b (end of the hold), then back: a pure function of time */
const turnK = (lt, a, b, ein = .28, eout = .35) => eIO(sg(lt, a - ein, a)) * (1 - eIO(sg(lt, b, b + eout)));
/* the angles of the street group at a moment: bodies show their backs (a little different each), heads turn to the neighbour who speaks */
function stance(id, lt) {
  const base = { straw: -.16, carrot: .14, broc: -.08, melon: .1, clem: -.2, lemon: .12, tom: -.1, mango: .16, onion: -.12 }[id] || 0;
  const body = BACK + base, o = { yaw: body, headYaw: body + (id === 'melon' || id === 'broc' ? 0 : 0), expr: 'neutral' };
  const toR = -1.25, toL = 1.25;   /* a head turned toward screen right: yaw - 1.25 (from the back); toward screen left: yaw + 1.25 */
  const k1 = turnK(lt, BEAT.l1[0], BEAT.t1[1] + .3), k2 = turnK(lt, BEAT.m1[0], BEAT.o1[1] + .3);
  if (id === 'lemon') { o.headYaw = body + toR * k1; o.yaw = body + toR * .35 * k1; }
  if (id === 'tom') { o.headYaw = body + toL * k1; o.yaw = body + toL * .35 * k1; }
  if (id === 'mango') { o.headYaw = body + toR * k2; o.yaw = body + toR * .3 * k2; }
  if (id === 'onion') { o.headYaw = body + toL * k2; o.yaw = body + toL * .3 * k2; }
  if (lt > 6.0 && lt < 7.95) { const kb = eIO(sg(lt, 6.1, 6.5)) * (1 - eIO(sg(lt, 7.6, 7.95))), dx = GX[id].x - 470; o.headYaw = lp(o.headYaw, body + (dx < 0 ? -.55 : .55) * Math.min(1, Math.abs(dx) / 120), kb); }
  return o;
}
function crowd(lt, only) {
  const rows = [GROUP.filter(g => g.row === 0), GROUP.filter(g => g.row === 1)];
  for (const row of rows) for (const g of row) {
    if (only && !only.includes(g.id)) continue;
    const st = stance(g.id, lt), extra = {};
    if (g.id === 'onion') Object.assign(extra, { cry: .7, sob: lt > BEAT.o1[0] ? .6 : .2, t: lt });
    if (g.id === 'tom') extra.t = lt;
    dc(g.id, Object.assign({ x: g.x, y: STREET_Y, s: g.s, who: g.id, t: lt, noShadow: false }, st, extra));
  }
}

// ================================================================================================ THE REVERSE ANGLE: a dusk backdrop (screen space) and the stage the faces stand on
/* the sky behind the faces: gradient, a low sun, three soft hills, warm lights far away; it drifts a little with the camera (parallax) */
function duskBackdrop(lt, cam) {
  const px = -(cam.x || 0) * .05;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#41306f'); g.addColorStop(.3, '#8a4a8c'); g.addColorStop(.5, '#d8648c'); g.addColorStop(.64, '#ff9566'); g.addColorStop(.76, '#ffc078'); g.addColorStop(1, '#b86a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen';
  const r = ctx.createRadialGradient(760 + px * 2, 1090, 0, 760 + px * 2, 1090, 620); r.addColorStop(0, 'rgba(255,226,160,.85)'); r.addColorStop(.25, 'rgba(255,170,110,.38)'); r.addColorStop(1, 'rgba(255,170,110,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 400, W, 1300);
  ctx.globalCompositeOperation = 'source-over';
  const hill = (base, amp, f1, f2, ph, col, a) => { ctx.fillStyle = col; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(-20, H); for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, base - amp * (Math.sin((x + px) * f1 + ph) * .6 + Math.sin((x + px) * f2 + ph * 2.1) * .4)); ctx.lineTo(W + 20, H); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; };
  hill(1130, 70, .0042, .011, 1.1, '#9a5c8e', .62); hill(1210, 60, .0055, .0135, 3.2, '#6a4a86', .78); hill(1300, 50, .007, .016, 5.6, '#3c3468', .95);
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 14; i++) {
    const x = ((rnd(i * 3.1) * 1300 - 110 + px * (1 + rnd(i))) % 1200 + 1200) % 1200 - 60, y = 1180 + rnd(i * 7.3) * 150, rad = 5 + rnd(i * 5.9) * 11, tw = .6 + .4 * Math.sin(lt * (1.2 + rnd(i)) + i * 2);
    const bg = ctx.createRadialGradient(x, y, 0, x, y, rad * 3); bg.addColorStop(0, `rgba(255,214,140,${.55 * tw})`); bg.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = bg; ctx.fillRect(x - rad * 3, y - rad * 3, rad * 6, rad * 6);
  }
  ctx.restore();
}

// ================================================================================================ THE SHOTS
/* one table: id, window, kind ('A' the tower and the group from behind, 'B' faces on the dusk backdrop, 'I' an insert), the camera and the drawing */
const B_X = 0;    /* the reverse stage's origin: the characters of the faces stand around world x 0 on the street line */
const SHOTS = [];
const shot = (id, t0, t1, kind, cam, draw, extra) => SHOTS.push(Object.assign({ id, t0, t1, kind, cam, draw }, extra || {}));
function bChar(id, lt, o) { return dc(id, Object.assign({ y: STREET_Y, who: id, t: lt }, o)); }

// the opening wide (the banner)
shot('open', 0, 1.85, 'A', lt => { const k = eIO(sg(lt, .2, 1.8)); return { x: 540, y: lp(60, 790, k), z: .72 }; });
// l1 + t1: Lemon and Tomato, a two-shot from the front (they look up at the banner, then at each other)
shot('l1', 1.85, 4.22, 'B', lt => ({ x: B_X, y: 1262 - 8 * sg(lt, 3.2, 4.2), z: lp(2.7, 3.0, sg(lt, 1.9, 4.2)) }), lt => {
  const up = 1 - eIO(sg(lt, 1.7, 2.1)), tl = turnK(lt, BEAT.l1[0] + .3, BEAT.t1[1] + .2, .2, .3);
  bChar('lemon', lt, { x: B_X - 74, s: .5, yaw: .45 + .25 * tl, headYaw: .35 + .4 * tl, look: [lp(.2, .8, tl), lp(-.8, 0, 1 - up)], expr: 'sour' });
  bChar('tom', lt, { x: B_X + 78, s: .5, yaw: -.5, headYaw: -.4 - .3 * tl, look: [lp(-.2, -.8, tl), lp(-.8, 0, 1 - up)], tomPose: 'veg', tomFrom: 'veg', flipT: 1 });
});
// m1: Mango (turned toward Onion)
shot('m1', 4.22, 5.32, 'B', lt => ({ x: B_X + 40, y: 1255, z: lp(2.9, 3.2, sg(lt, 4.22, 5.3)) }), lt => {
  bChar('mango', lt, { x: B_X + 5, s: .5, yaw: -.4, headYaw: -.55, look: [-.3, 0], expr: 'hopeful' });
  bChar('onion', lt, { x: B_X + 150, s: .5, yaw: .45, headYaw: .5, look: [.2, .1], cry: .55, t: lt });
});
// o1: Onion in close-up (she cries)
shot('o1', 5.32, 6.3, 'B', lt => ({ x: B_X + 30, y: 1262, z: lp(3.4, 3.8, sg(lt, 5.3, 6.3)) }), lt => {
  bChar('onion', lt, { x: B_X + 30, s: .5, yaw: .35, headYaw: .4, look: [.1, .1], cry: .9, sob: sg(lt, 5.8, 6.1) * .8, t: lt });
});
// ------------------------------------------------------------------ props of the toss and the reactions: lettuce, badges, giant tongs, the COUNTED form
const GREENS = ['#4aa85a', '#6cc46a', '#8fd36a', '#3e9b4f'];
function leafShape(s, hue, rot = 0) {
  ctx.save(); ctx.rotate(rot);
  const pts = [[-s * 1.1, 0], [-s * .5, -s * .8], [s * .4, -s * .9], [s * 1.2, -s * .1], [s * .5, s * .7], [-s * .6, s * .6]];
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  ctx.fillStyle = mixh(GREENS[0], GREENS[2], hue); ctx.fill(); ctx.strokeStyle = '#1f5a32'; ctx.lineWidth = Math.max(1.4, s * .12); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(230,255,220,.7)'; ctx.lineWidth = Math.max(1, s * .09); ctx.beginPath(); ctx.moveTo(-s * .9, 0); ctx.lineTo(s * .9, -s * .1); ctx.stroke();
  ctx.restore();
}
function badgeShape() {
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-10, -14, 20, 28, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2fa36b'; ctx.beginPath(); ctx.ellipse(0, -2, 5, 3.4, -.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c9ced6'; ctx.fillRect(-6, 6, 12, 2.4); ctx.fillRect(-6, 10, 8, 2.4);
  ctx.strokeStyle = '#8b6fd0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -30); ctx.stroke();
}
/* the tossed salad of the simulation (ep15_close_sim.js): from the launch at 'Tossed!' on, leaves and badges fly, land and lie on the street */
function drawToss(lt) {
  const r = sim();
  if (!r || lt < r.meta.tossT - .02) return;
  const st = simAt(lt);
  for (const id of r.meta.items) {
    const e = st.by[id], d = r.world.bodies[id].data || {};
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle);
    if (d.kind === 'leaf') leafShape(d.s, d.hue); else badgeShape();
    ctx.restore();
  }
}
/* giant salad tongs: two silver arms hinged at (x, y), pointing along theta, opened by `open` radians, with a scoop at each end */
function tongs(x, y, s, theta, open) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.rotate(theta + sd * open / 2);
    const L = 250 * s, g = ctx.createLinearGradient(0, -8 * s, 0, 8 * s); g.addColorStop(0, '#f2f4f8'); g.addColorStop(.5, '#aeb4c0'); g.addColorStop(1, '#6e7480');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(20,16,28,.85)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.roundRect(0, -7 * s, L, 14 * s, 6 * s); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(L + 14 * s, 0, 34 * s, 20 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#8a909c'; ctx.beginPath(); ctx.arc(0, 0, 11 * s, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* the staffing form with its stamp: COUNTED lands on the beat of the word */
function countedForm(lt) {
  const t0 = wordT('t2', 0) + .12, a = eO(sg(lt, t0 - .5, t0 - .2)), sl = lp(160, 0, a);
  if (a <= .01) return;
  const x = 150, y = 990, w = 780, h = 360, k = sg(lt, t0 - .08, t0), age = lt - t0;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(sl * 0, sl); ctx.globalAlpha *= a;
  ctx.save(); ctx.rotate(-.025); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10; ctx.fillStyle = '#fbf7ea'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.restore();
  ctx.save(); ctx.rotate(-.025);
  ctx.fillStyle = '#103a2c'; ctx.beginPath(); ctx.roundRect(x, y, w, 62, [14, 14, 0, 0]); ctx.fill();
  UI.label('STAFFING FORM 15-B', x + w / 2, y + 31, { font: 'Nunito', weight: 900, size: 32, spacing: 4, fill: '#f6efd2', hero: false, crop: true });
  const rows = [['PIZZA', 'VEGETABLE'], ['SALAD', 'VEGETABLE'], ['TOMATO', 'BOTH']];
  rows.forEach((r, i) => { const yy = y + 118 + i * 74; ctx.strokeStyle = 'rgba(30,40,60,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 36, yy + 32); ctx.lineTo(x + w - 36, yy + 32); ctx.stroke(); UI.label(r[0], x + 60, yy, { font: 'Nunito', weight: 900, size: 34, fill: '#22262b', align: 'left', hero: false, crop: true }); UI.label(r[1], x + w - 60, yy, { font: 'Nunito', weight: 800, size: 34, fill: '#1f55c8', align: 'right', hero: false, crop: true }); });
  ctx.restore();
  if (k > 0) {
    const sc = lt < t0 ? lp(2.4, 1, eI(k)) : 1 + .05 * Math.sin(Math.min(1, age / .16) * Math.PI) * (1 - Math.min(1, age / .16));
    ctx.save(); ctx.translate(x + w * .62, y + h * .62); ctx.scale(sc, sc); ctx.translate(-(x + w * .62), -(y + h * .62)); ctx.globalAlpha *= sg(k, 0, .4);
    UI.stamp('COUNTED', x + w * .62, y + h * .62, { font: 'Bangers', size: 112, color: '#d93025', rot: -.12, padX: 56, padY: 38, lw: 10, alpha: .93, hero: lt >= t0 + .2, crop: lt < t0 + .2, id: 'fp15c.counted' });
    ctx.restore();
  }
  ctx.restore();
  if (age >= 0 && age < .6) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; V2.ring(x + w * .62, y + h * .62 + sl, age / .6, { r0: 60, r1: 420, lw: 12, color: '255,150,130', alpha: .8, bloom: .4, squash: .6 }); ctx.restore(); }
}

// ------------------------------------------------------------------ b1 (A): the toss. The group seen from behind in the street, Binder floating in front of the banner with giant tongs
shot('b1', 6.3, 7.68, 'A', lt => ({ x: 540, y: 985, z: lp(1.22, 1.3, sg(lt, 6.3, 7.7)) }), lt => {
  const tt = sim() ? sim().meta.tossT : 7.1, wind = sg(lt, 6.4, 7.0), snap = eIO(sg(lt, tt - .06, tt + .1)), bob = Math.sin(lt * 3) * 6;
  const bx = 470, by = 985 + bob - 30 * eO(sg(lt, 6.3, 6.9)), s = .62;
  dc('bind', { x: bx, y: by, s, who: 'bind', t: lt, center: true, noLegs: true, bob: 0, hover: 0, pose: 'helpful', grin: .25 + .3 * snap });
  const th = lp(lp(1.45, 2.05, wind), -1.35, snap), op = lp(lp(.35, .95, wind), .1, snap);
  tongs(bx, by + 122 * s, s * 1.15, th, op);
});
// a1 (B): the Administrators side by side, with lettuce still stuck to them
shot('a1', 7.68, 9.28, 'B', lt => ({ x: B_X + 10, y: 1262, z: lp(2.55, 2.85, sg(lt, 7.7, 9.3)) }), lt => {
  const sp = eIO(sg(lt, BEAT.a1[0], BEAT.a1[0] + .3));
  bChar('melon', lt, { x: B_X - 100, s: .5, yaw: .4, headYaw: .3, look: [.5, 0], expr: 'smug', hold: { r: 'pizzabox9' }, grip: { r: [205, 112] }, arms: { r: 'hold' } });
  bChar('broc', lt, { x: B_X + 105, s: .5, yaw: -.42, headYaw: -.35, look: [-.4, 0] });
  ctx.save(); ctx.translate(B_X - 100, 1180); leafShape(13, .3, .5); ctx.translate(26, -20); leafShape(11, .7, -.4); ctx.restore();   /* lettuce on the Administrators */
  ctx.save(); ctx.translate(B_X + 130, 1124); leafShape(12, .5, -.3); ctx.restore();
});
// o2 (B): Onion sobbing, Tomato changing her mind beside her
shot('o2', 9.28, 11.63, 'B', lt => ({ x: B_X + 12, y: 1262, z: lp(2.7, 3.0, sg(lt, 9.3, 11.6)) }), lt => {
  const f1 = wordT('o2', 2), f2 = wordT('o2', 5), n2 = lt >= f2 ? 1 : 0, ph = lt >= f2 ? 'veg' : lt >= f1 ? 'fruit' : 'veg';
  const fl = lt >= f2 ? lt - f2 : lt >= f1 ? lt - f1 : 1;
  bChar('onion', lt, { x: B_X - 62, s: .5, yaw: .4, headYaw: .35, look: [.3, .1], cry: .95, sob: .7, t: lt });
  bChar('tom', lt, { x: B_X + 95, s: .5, yaw: -.45, headYaw: -.4, look: [-.4, 0], tomPose: ph, tomFrom: ph === 'veg' && lt >= f2 ? 'fruit' : lt >= f1 ? 'veg' : 'veg', flipT: Math.min(.6, fl) });
  ctx.save(); ctx.translate(B_X - 62, 1112); leafShape(11, .4, .3); ctx.restore();
});
// t2 (B): Tomato in the upper half, the form with its COUNTED stamp below
shot('t2', 11.63, 12.5, 'B', lt => ({ x: B_X, y: 1352, z: 3.0 }), lt => {
  const fl = Math.min(.6, Math.max(0, lt - wordT('t2', 0)));
  bChar('tom', lt, { x: B_X, s: .5, yaw: -.15, headYaw: -.1, look: [0, 0], tomPose: 'fruit', tomFrom: 'veg', flipT: fl, expr: 'happy' });
}, { over: countedForm });
// ------------------------------------------------------------------ ar1: the rolling TV (SH15.call) with Mr. Artichoke peeled to his heart in the middle of his fallen petals
const TVR = { x0: -380, y0: 820, w: 760, h: 428 };
function petalPile(rect, floorY, seed) {
  for (let layer = 0; layer < 2; layer++) {
    const n = layer ? 26 : 44;
    for (let i = 0; i < n; i++) {
      const u = rnd(i * 3.7 + seed + layer * 50), v = rnd(i * 5.3 + seed + 9 + layer * 50), sp = (u - .5) * rect.w * .78 * (1 - .42 * v), x = rect.x + rect.w / 2 + sp, y = floorY - v * v * 62 * (layer ? .5 : 1) + (layer ? 10 : -4), sz = 30 + rnd(i + seed) * 22, rot = (rnd(i * 2.2 + seed) - .5) * 2.4 + (sp > 0 ? .4 : -.4);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = mixh('#5d7a34', '#9bb85a', rnd(i * 1.7 + seed)); ctx.strokeStyle = '#2a3a16'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(-sz * .5, 0); ctx.quadraticCurveTo(-sz * .3, -sz * .5, sz * .1, -sz * .42); ctx.quadraticCurveTo(sz * .6, -sz * .3, sz * .55, sz * .05); ctx.quadraticCurveTo(sz * .1, sz * .35, -sz * .5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,255,200,.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-sz * .4, 0); ctx.lineTo(sz * .45, -sz * .1); ctx.stroke();
      ctx.restore();
    }
    if (!layer) {
      const hb = heartK(simLt);
      ctx.save(); ctx.translate(rect.x + rect.w / 2, floorY - 6); ctx.scale(1 + .16 * hb, 1 + .16 * hb); ctx.translate(-(rect.x + rect.w / 2), -(floorY - 6));
      if (window.A15) { if (typeof REG !== 'undefined') REG.suppress++; try { drawChar(A15.artichoke({ x: rect.x + rect.w / 2, y: floorY - 6, s: 3.4, peel: 1, who: 'arti', noShadow: true, t: simLt })); } catch (e) { /* kit */ } finally { if (typeof REG !== 'undefined') REG.suppress--; } }
      ctx.restore();
    }
  }
}
let simLt = 0;
/* two beats of a small fast heart: lub-dub every 0.82 s, the first one on the sound cue */
function heartK(lt) { const ph = ((lt - CUE.heartbeat) % .82 + .82) % .82; return Math.max(Math.exp(-ph / .07), .7 * Math.exp(-Math.max(0, ph - .2) / .07) * (ph > .2 ? 1 : 0)) * (lt > 12.8 ? 1 : 0); }
function artiTile(rect, tt) {
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h); g.addColorStop(0, '#d9c7a4'); g.addColorStop(.7, '#bba47c'); g.addColorStop(.72, '#7d5a3a'); g.addColorStop(1, '#5e4228');
  ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(rect.x + rect.w * .08, rect.y + rect.h * .12, rect.w * .22, rect.h * .34);   /* a window of his office */
  ctx.fillStyle = 'rgba(20,14,26,.18)'; ctx.fillRect(rect.x, rect.y + rect.h * .71, rect.w, 4);
  petalPile(rect, rect.y + rect.h * .88, 7);
}
function drawTV(lt) {
  const { x0, y0, w, h } = TVR, k = w / 1280, cx = x0 + w / 2;
  ctx.save();
  ctx.fillStyle = '#2b2b33'; ctx.fillRect(cx - 12, y0 + h + 20, 24, 1342 - (y0 + h + 20) - 24);
  ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.roundRect(cx - 150, 1300, 300, 22, 8); ctx.fill();
  for (const sx of [-120, 120]) { ctx.fillStyle = '#15151b'; ctx.beginPath(); ctx.arc(cx + sx, 1330, 14, 0, TAU); ctx.fill(); ctx.fillStyle = '#7d7f8a'; ctx.beginPath(); ctx.arc(cx + sx, 1330, 5, 0, TAU); ctx.fill(); }
  const bz = ctx.createLinearGradient(0, y0 - 26, 0, y0 + h + 26); bz.addColorStop(0, '#3a3a46'); bz.addColorStop(1, '#16161c');
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; ctx.fillStyle = bz; ctx.beginPath(); ctx.roundRect(x0 - 26, y0 - 26, w + 52, h + 52, 26); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); ctx.translate(x0, y0); ctx.scale(k, k);
  simLt = lt;
  if (window.SH15) SH15.call({ w: 1280, h: 720, ui: 1, dressing: true, r: 0, title: 'ALL HANDS', time: 2832 + lt, signal: 2, lag: .22, main: { name: 'Mr. Artichoke', draw: artiTile, color: '#103a2c', initials: 'MA', speaking: lt < BEAT.ar1[1] }, others: [] }, lt);
  else artiTile({ x: 0, y: 0, w: 1280, h: 720 }, lt);
  ctx.restore();
  const hb = heartK(lt); if (hb > .02) { ctx.fillStyle = `rgba(255,60,80,${.1 * hb})`; ctx.fillRect(x0, y0, w, h); }
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + w * .42, y0); ctx.lineTo(x0 + w * .18, y0 + h); ctx.lineTo(x0, y0 + h); ctx.closePath(); ctx.fill();   /* the glare on the glass */
  ctx.fillStyle = '#44d18a'; ctx.beginPath(); ctx.arc(x0 + w - 24, y0 + h + 12, 4, 0, TAU); ctx.fill();
  ctx.restore();
}
shot('ar1', 12.5, 15.3, 'B', lt => ({ x: 0, y: 1030, z: lp(1.22, 1.34, sg(lt, 12.5, 15.3)) }), lt => { drawTV(lt); });

// ------------------------------------------------------------------ the laptop inserts (undo, the break request): a screen with a sheet on it, a keyboard under it, gloves
function laptopFrame(lt, drawScreen) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#222c3c'); g.addColorStop(1, '#0b0f17'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen'; const r = ctx.createRadialGradient(540, 620, 0, 540, 620, 760); r.addColorStop(0, 'rgba(120,170,255,.22)'); r.addColorStop(1, 'rgba(120,170,255,0)'); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; ctx.fillStyle = '#10141b'; ctx.beginPath(); ctx.roundRect(36, 262, 1008, 690, 30); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#05070b'; ctx.beginPath(); ctx.roundRect(52, 278, 976, 658, 16); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(60, 290, 960, 642, 10); ctx.clip(); ctx.translate(60, 290); drawScreen(); ctx.restore();
  ctx.fillStyle = '#2b323f'; ctx.beginPath(); ctx.roundRect(20, 950, 1040, 420, [10, 10, 40, 40]); ctx.fill();
  ctx.fillStyle = '#394252'; ctx.beginPath(); ctx.roundRect(36, 966, 1008, 388, 24); ctx.fill();
  ctx.fillStyle = '#4a556a';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 13; c++) { ctx.beginPath(); ctx.roundRect(62 + c * 74, 990 + r * 62, 64, 52, 9); ctx.fill(); }
  ctx.restore();
}
function glove(x, y, s, press) {
  const dy = press * 16 * s;
  ctx.save(); ctx.translate(x, y + dy); ctx.scale(s, s);
  ctx.fillStyle = '#2a2530'; ctx.beginPath(); ctx.roundRect(-30, 150, 60, 700, 28); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(0, 100, 62, 74, 0, 0, TAU); ctx.fill(); ctx.stroke();
  for (const [fx, fl] of [[-34, 50], [-12, 64], [12, 64], [34, 50]]) { ctx.beginPath(); ctx.roundRect(fx - 11, -fl + 30 - 14, 22, fl + 40, 11); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(-58, 96, 15, 34, .5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(30,24,50,.12)'; ctx.beginPath(); ctx.ellipse(10, 130, 40, 44, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
const SHEET_SM = { w: 960, h: 642, ui: .62, show: { title: false, ribbon: false, formula: true, headers: true, sheetTabs: false, status: false } };
function undoScreen(lt) {
  const n = lt < 15.70 ? 214 : lt < 16.05 ? 213 : 214, from = lt < 15.70 ? 214 : lt < 16.05 ? 214 : 213, u = lt < 15.70 ? 1 : lt < 16.05 ? sg(lt, 15.70, 15.9) : sg(lt, 16.05, 16.25);
  const dlg = lt >= CUE.error, du = sg(lt, CUE.error, CUE.error + .16);
  const rows = [['BREAK ROOM', 'PENDING ROOM'], ['COFFEE BREAK', 'COFFEE PENDING'], ['BREAK SCHEDULE', 'PENDING SCHEDULE'], ['TAKE A BREAK', 'TAKE A PENDING'], ['BREAKFAST', 'PENDINGFAST'], ['NO BREAK', 'NO PENDING']];
  const cells = { A1: { v: 'CHANGES', size: 44, weight: 900, color: '#5b6470', align: 'right', pad: 26 }, B1: { v: String(n), flip: u < 1 ? { from: String(from), u } : undefined, size: 130, font: 'Bangers', color: lt >= 16.05 && lt < 16.4 ? '#d93025' : '#103a2c', align: 'center', hero: !dlg && u >= 1, pulse: lt >= 16.05 && lt < 16.5 ? sg(lt, 16.05, 16.5) : undefined, pulseColor: '#d93025' } };
  rows.forEach((r, i) => { cells['A' + (i + 2)] = { v: r[0] + ' →', size: 30, weight: 700, color: '#8a929c' }; cells['B' + (i + 2)] = { v: r[1], size: 30, weight: 900, color: '#103a2c', pulse: .4 }; });
  const o = Object.assign({}, SHEET_SM, { cells, cols: { A: 600, B: 360 }, rows: { 1: 190 }, sel: 'B1', active: 'B1', formula: { text: String(n), typed: 1 }, dressing: dlg, handle: false });
  SH15.sheet(o, lt);
  if (dlg) SH15.dialog({ kind: 'cantUndo', w: 960, h: 642, at: [480, 270], s: .97, dressing: false, t: lt }, du);
}
function undoKeys(lt) {
  const p1 = sg(lt, CUE.key1 - .04, CUE.key1 + .02) * (1 - sg(lt, 15.95, 16.02)), p2 = sg(lt, CUE.key2 - .04, CUE.key2 + .02) * (1 - sg(lt, 15.86, 15.92));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const kk = SH15.keys(['Ctrl', 'Z'], 540, 1130, { size: 62, press: [p1, p2], gap: 90, plus: '#e8ecf4', hero: true });
  for (let i = 0; i < 2; i++) { const c = kk.caps[i]; glove(c.x + c.w / 2 + (i ? 30 : -30), c.y + c.h * (.98) + 20 + (1 - (i ? p2 : p1)) * 10, .62, i ? p2 : p1); }
  ctx.restore();
}
shot('undo', 15.3, 17.347, 'I', () => ({ x: 540, y: 960, z: 1 }), lt => { laptopFrame(lt, () => undoScreen(lt)); undoKeys(lt); });
// ------------------------------------------------------------------ b2, s1: Binder's "Can't undo!" and Strawberry flat
shot('b2', 17.347, 18.177, 'B', lt => ({ x: B_X, y: 1236, z: lp(1.55, 1.7, sg(lt, 17.3, 18.2)) }), lt => {
  bChar('bind', lt, { x: B_X, y: 1236, s: 1.25, center: true, noLegs: true, bob: 0, hover: 0, pose: 'shrug', grin: .25 });
});
const faceOf = (id, o) => { const f = CAST[id] && CAST[id](); if (!f) return [o.x, 1200]; try { return window.H6.faceC(Object.assign(f({}), o)); } catch (e) { return [o.x, 1200]; } };
shot('s1', 18.177, 19.1, 'B', lt => { const [fx, fy] = faceOf('straw', { x: B_X, y: STREET_Y, s: .66 }), z = lp(2.5, 2.8, sg(lt, 18.2, 19.1)); return { x: fx, y: fy + 70 / z, z }; }, lt => {
  bChar('straw', lt, { x: B_X, s: .66, yaw: .1, headYaw: .05, look: [0, .05], expr: 'weak' });
});

/* her gloves on the keys while she types the request (they rest when she stops) */
function typingGloves(lt, rest) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const typing = !rest && lt > 19.15 && lt < 20.3;
  for (let i = 0; i < 2; i++) { const p = typing ? Math.max(0, Math.sin(lt * 21 + i * 2.6)) : 0; glove(340 + i * 400, 1236 + (typing ? 0 : 14), .62, p); }
  ctx.restore();
}
// ------------------------------------------------------------------ b3, s2: her request on the calendar, Binder's bubble, No thanks runs away; the PENDING cell with its spinner
const REQ = 'Request: 30 minute break, please';
function breakScreen(lt) {
  const typed = sg(lt, 19.15, 20.2), pend = lt >= 22.95, bub = lt < 22.95, dressing = bub && lt >= 19.25;
  const times = ['3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];
  const cells = { A1: { v: 'SHIFT 3 TO 11', size: 40, weight: 900, color: '#103a2c', align: 'left' }, B1: { v: 'TASK', size: 34, weight: 900, color: '#5b6470', align: 'left' }, C1: { v: 'NOTE', size: 34, weight: 900, color: '#5b6470', align: 'left' } };
  times.forEach((tm, i) => { cells['A' + (i + 2)] = { v: tm, size: 30, weight: 700, color: '#46505b' }; cells['B' + (i + 2)] = { v: i === 4 ? (pend ? 'PENDING' : '') : 'WORK', size: 30, weight: 900, color: i === 4 ? '#8f5600' : '#0d2b21', fill: i === 4 ? '#fff1c4' : undefined, pad: i === 4 ? 64 : 12 }; });
  const edit = !pend && lt >= 19.15 ? { ref: 'C6', text: REQ, typed } : null;
  if (pend) cells.C6 = { v: REQ, size: 28, weight: 700, color: '#46505b' };
  const o = Object.assign({}, SHEET_SM, { cells, cols: { A: 250, B: 300, C: 410 }, rows: { 1: 80 }, rowH: 76, sel: 'C6', active: 'C6', formula: { text: REQ, typed }, edit, dressing, handle: false });
  SH15.sheet(o, lt);
  const L = SH15.layout(o), R = SH15.cellRect('B6', o);
  /* the clock icon in the BREAK cell (the break itself is gone) */
  const cx = R.x + 34, cy = R.y + R.h / 2;
  ctx.save(); ctx.strokeStyle = pend ? '#8f5600' : '#9aa1ab'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 17, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy); ctx.lineTo(cx + 8, cy + 5); ctx.stroke(); ctx.restore();
  if (pend) {   /* the spinner: it will turn for as long as the film lets it */
    const sx = R.x + R.w - 38; ctx.save(); ctx.strokeStyle = '#8f5600'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(sx, cy, 16, lt * 7, lt * 7 + 4.2); ctx.stroke(); ctx.restore();
  }
  if (bub) {
    const pop = lt >= 19.25 ? eB(sg(lt, 19.25, 19.48), 1.4) : 0, tl = 'It looks like you\'re trying to take a break. Would you like help?';
    const bo = { at: [150, 210], w: 700, tail: [92, 470], text: tl, typed: sg(lt, 19.45, 21.3), pop, buttons: [{ id: 'yes', t: 'Yes please', def: true }, { id: 'no', t: 'No thanks' }], runaway: sg(lt, 21.98, 22.5), press: lt >= 21.82 && lt < 21.98 ? { id: 'no', k: sg(lt, 21.82, 21.9) * (1 - sg(lt, 21.92, 21.98)) } : undefined, t: lt, hero: false };
    if (pop > 0) {
      SH15.binder(bo, lt);
      if (window.A15 && window.A15.binderSmall) { try { drawChar(A15.binderSmall({ x: 92, y: 560, s: .5, center: true, noLegs: true, bob: 0, hover: 0, who: 'bind', t: lt, pose: 'point', grin: .1 })); } catch (e) { /* kit */ } }
      if (lt >= 21.65 && lt < 22.5) { const nb = SH15.binderRect(bo, 'no'); if (nb) { const px = lp(nb.x + nb.w * .5 - 160, nb.x + nb.w * .5, eO(sg(lt, 21.62, 21.82))), py = lp(nb.y + 200, nb.y + nb.h * .6, eO(sg(lt, 21.62, 21.82))); SH15.pointer(px, py, { kind: 'arrow', s: 1.3, press: lt >= 21.82 && lt < 21.98 ? sg(lt, 21.82, 21.9) * (1 - sg(lt, 21.92, 21.98)) : 0 }); } }
    }
  }
}
shot('b3', 19.1, 22.3, 'I', () => ({ x: 540, y: 960, z: 1 }), lt => { laptopFrame(lt, () => breakScreen(lt)); typingGloves(lt); });
shot('b4', 22.3, 22.95, 'B', lt => ({ x: B_X, y: 1236, z: lp(1.5, 1.85, sg(lt, 22.3, 22.95)) }), lt => {
  bChar('bind', lt, { x: B_X, y: 1236, s: 1.25, center: true, noLegs: true, bob: 0, hover: 0, pose: 'helpful', grin: sg(lt, 22.4, 22.85), glint: sg(lt, 22.846, 22.95) });
});
shot('pend', 22.95, 23.34, 'I', () => ({ x: 540, y: 960, z: 1 }), lt => { laptopFrame(lt, () => breakScreen(lt)); typingGloves(lt, true); });

// ------------------------------------------------------------------ end (A): the tower at dusk, the banner lit, a spinner ring over the whole building, PENDING in the sign
function spinner(lt) {
  const age = lt - CUE.pending, a = eO(sg(age, 0, .5)), rot = lt * 1.3, cx = 540, cy = 300, R = 690 * (1 + .04 * ringK(lt - CUE.sting, .25));
  if (a <= .01) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha *= a; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,236,170,.18)'; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();   /* the track */
  for (let i = 0; i < 12; i++) {   /* the bright arc: a comet of segments, the head ahead */
    const k = 1 - i / 12, a0 = rot - i * .095, a1 = a0 + .12;
    ctx.strokeStyle = `rgba(255,${200 + 40 * k | 0},${120 + 60 * k | 0},${.15 + .85 * k * k})`; ctx.lineWidth = 34 * (.55 + .45 * k); ctx.shadowColor = 'rgba(255,190,80,.95)'; ctx.shadowBlur = 36 * k;
    ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
  }
  ctx.restore();
}
function endLit(lt) {
  const k = eO(sg(lt, 23.2, 23.8));
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const sx of [-1, 1]) V2.beam(540 + sx * 760, 1342, 540 + sx * 90, 560, 40, 420, '255,214,140', .3 * k, 'screen');
  V2.glow(540, 670, 640, '255,214,140', .22 * k, 'screen', .4);
  ctx.restore();
}
const penTagline = (lt) => (cx, cy, a, ok) => {
  const u = sg(lt, CUE.pending, CUE.pending + .62), done = lt >= CUE.pending + .7;
  SH15.flipText('Better together. Tossed.', 'PENDING', u, { cx, cy, size: 60, font: 'Nunito', weight: 900, italic: true, fill: '#fff6c8', stroke: '#07170f', lw: 9, shadow: 8, alpha: a, hero: ok && (u <= 0 || u >= 1), id: 'fp15c.tag' });
};
shot('end', 23.34, 27, 'A', lt => ({ x: 540, y: 640, z: lp(.56, .6, sg(lt, 23.3, 26.1)) }), lt => { endLit(lt); spinner(lt); });
function shotAt(lt) { for (const s of SHOTS) if (lt >= s.t0 && lt < s.t1) return s; return SHOTS[SHOTS.length - 1]; }
function camFor(lt) { return shotAt(lt).cam(lt); }

// ------------------------------------------------------------------ the scene
const TEST = { shot: 'open' };
function worldDraw(lt) {
  const sh = shotAt(lt), st = towerSt(lt);
  if (sh.kind === 'I') { sh.draw(lt); return; }
  if (window.S15) S15.light(st);
  if (sh.kind === 'B') {
    duskBackdrop(lt, CAM);
    forecourt(lt);
    sh.draw(lt);
    if (sh.over) sh.over(lt);
    return;
  }
  const z = CAM.z, blurPx = cl((z - 1.2) * 5.5, 0, 8);
  const bg = () => {
    if (window.S15) { S15.tower(lt, st); S15.front(lt, st); } else { ctx.fillStyle = '#4a3a6a'; ctx.fillRect(-2000, -3000, 5000, 6000); }
    drawBanner(lt, sh.id === 'end' ? { tagline: penTagline(lt) } : {});
    forecourt(lt);
  };
  if (blurPx > .5) V2.dof(blurPx, bg); else bg();
  crowd(lt);
  drawToss(lt);
  if (sh.draw) sh.draw(lt);
  if (sh.over) sh.over(lt);
}
const CLOSE = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) { const c = camFor(lt); zoomTo(c.x, c.y, c.z); },
  draw(lt) { worldDraw(lt); },
  fx(lt) {
    const sh = shotAt(lt), ins = sh.kind === 'I', st = lt >= CUE.sting ? ringK(lt - CUE.sting, .2) : 0;
    return { bloom: ins ? .35 : .5 + .4 * st, vignette: ins ? .3 : .4, grain: .05, contrast: .12, sat: .1, aberr: 3 * st, tint: [[ins ? '#6aa0ff' : '#ff9a60', ins ? .05 : .08, 'soft-light']] };
  },
  blur(lt) { for (const s of SHOTS) if (Math.abs(lt - s.t0) < .06 && s.t0 > 0) return 1; return lt < 1.85 ? 5 : (lt > CUE.pending - .05 && lt < CUE.pending + .7) ? 4 : 2; },
  over(lt) {},
  clock: () => '6:00 PM', label: () => 'THE CLOSING',
};
window.__EP15_SCENES[SC_NAME] = CLOSE;
/*@@MORE@@*/
})();
