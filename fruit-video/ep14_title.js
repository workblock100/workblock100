'use strict';
/* SHIFT HAPPENS, Episode 14: The Survey. Scene module E14-A: the scenes `title` (5.2 s) and `end` (8.0 s), registered on window.__EP14_SCENES.
 * (DEV VERSION: title only)
 */
(() => {
if (!window.TIMELINE_EP14) return;
window.__EP14_SCENES = window.__EP14_SCENES || {};
const { zoomTo } = window.H6;

// the episode's graphic palette (CONTEXT14)
const CREAM = '#f2e8cf', GREEN = '#24402e', OCHRE = '#c98b2c', INKC = '#1d1a16', RED = '#c23a2b', YEL = '#ffe135', SLATE = '#33527a';
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const ring = (lt, t0, tau) => lt < t0 ? 0 : Math.exp(-(lt - t0) / tau);
const mixH = (a, b, k) => '#' + V2.mix(a, b, clamp(k)).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mixA = (a, b, k, al = 1) => V2.rgba(V2.mix(a, b, clamp(k)), al);
const mixN = (arr, k) => { const i = clamp(k) * (arr.length - 1), j = Math.min(arr.length - 2, Math.floor(i)); return mixH(arr[j], arr[j + 1], i - j); };

// ------------------------------------------------------------------ offscreen helpers (flat art only: no text is ever drawn into a cache)
/* copied from ep13_title.js (private there): a flat cache canvas, and drawing into it with the global ctx swapped */
const mkCv = (w, h) => { const c = V2.mk(w, h); c.__txOK = true; return c; };
function intoCv(cv, fn) {
  const prev = ctx, g = cv.getContext('2d');
  ctx = g; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  try { fn(g); } finally { g.restore(); ctx = prev; }
}
/* zoom about a point that stays where it is on the screen (zoomTo centres the point instead) */
const zoomAbout = (px, py, z) => { CAM.z = z; CAM.x = px - (px - W / 2) / z; CAM.y = py - (py - H / 2) / z; };

// ============================================================================ title: the opening of a nature documentary
/* the building's geometry: copied from ep14_house.js (S14.GEOM, which never changes) so this graphic does not depend on the kit */
const G = { T: 12, RW: 250, RH: 318, X0: 10, Y0: 340, X1: 1070, Y1: 1342, COL: [22, 284, 546, 808], ROW: [352, 682, 1012] };
const ROOMS = [['office', 0, 0, 1], ['conf', 1, 0, 1], ['rest', 2, 0, 1], ['r14', 3, 0, 1], ['med', 0, 1, 1], ['r4', 1, 1, 1], ['r7', 2, 1, 1], ['shower', 3, 1, 1], ['lobby', 0, 2, 1], ['station', 1, 2, 2], ['dining', 3, 2, 1]]
  .map(([id, col, row, span]) => ({ id, col, row, span, x0: G.COL[col], y0: G.ROW[row], w: span === 2 ? 2 * G.RW + G.T : G.RW, h: G.RH, floor: G.ROW[row] + G.RH - 14 }));
/* the colony wakes: the lights come on room by room, from the lobby up and across (scene-local seconds) */
const WAKE = { lobby: .34, station: .52, dining: .72, med: .92, r4: 1.10, r7: 1.28, shower: 1.46, office: 1.66, conf: 1.84, rest: 2.0, r14: 2.16 };

const BK = .5;                    // building scale (units -> pixels)
const BCX = 540, BBASE = 1640;    // the building's centre line and the line it stands on (screen pixels, camera at rest)
const BX0 = BCX - (G.X1 - G.X0) / 2 * BK;                   // the screen x of unit x = G.X0
const BY0 = BBASE - (G.Y1 - G.Y0) * BK;                     // the screen y of unit y = G.Y0
const CRANE = 150;                // how far the nearest layer slides down in the crane-up
const PAR = { far: .12, mid: .22, near: .4, hill: .62, fore: 1 };
const craneK = lt => easeIO(seg(lt, 0, 5.2));
const SUN_X = 540, SUN_R = 62;
const sunY = lt => lerp(1225, 1012, easeIO(seg(lt, .2, 2.4))) - 92 * easeOut(seg(lt, 2.4, 5.2));
const phase1 = lt => easeIO(seg(lt, .45, 1.9));        // blue -> rose
const phase2 = lt => easeIO(seg(lt, 1.9, 2.9));        // rose -> gold
const CREST = 2.42;               // the sun clears the ridge: the sting's downbeat (theme7 lands about 2.4 to 2.6)

// ------------------------------------------------------------------ the land: ridges as seeded paths
function ridgePts(seed, base, amp, o = {}) {
  const R = V2.rng(seed), comps = [];
  for (let i = 0; i < 6; i++) comps.push([amp * (o.rough ?? 1) * Math.pow(.62, i) * (.6 + R() * .8), .004 * Math.pow(1.9, i) * (.8 + R() * .5), R() * TAU]);
  const pts = [];
  for (let x = -80; x <= 1160; x += 10) {
    let y = base;
    for (const [a, f, p] of comps) y += (o.peaky ? -Math.abs(Math.sin(x * f + p)) : Math.sin(x * f + p)) * a;
    if (o.saddle) y += o.saddle * Math.exp(-Math.pow((x - 540) / (o.saddleW || 250), 2));
    if (o.slope) y += o.slope * Math.pow(Math.abs(x - 540) / 540, 2);
    pts.push([x, y]);
  }
  return pts;
}
const LAND = {
  far: ridgePts(11, 972, 54, { peaky: true, saddle: 96, saddleW: 190 }),
  mid: ridgePts(23, 1030, 22, { saddle: 58, saddleW: 230 }),
  near: ridgePts(37, 1215, 16, { saddle: 14, saddleW: 400, slope: 30 }),
  hill: ridgePts(41, BBASE - 6, 5, { slope: 120 }),
};
const pathOf = (pts, bottom) => { const p = new Path2D(); p.moveTo(pts[0][0], bottom); for (const [x, y] of pts) p.lineTo(x, y); p.lineTo(pts[pts.length - 1][0], bottom); p.closePath(); return p; };
const LP = { far: pathOf(LAND.far, 1400), mid: pathOf(LAND.mid, 1500), near: pathOf(LAND.near, 1700), hill: pathOf(LAND.hill, 2400) };
const edgeOf = pts => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); return p; };
const LE = { far: edgeOf(LAND.far), mid: edgeOf(LAND.mid), near: edgeOf(LAND.near), hill: edgeOf(LAND.hill) };

/* the palette of the three light states: pre-dawn blue, rose, gold */
const SKY_STOPS = [-200, 260, 620, 860, 1010, 1200];
const SKY_COLS = [
  ['#060a20', '#0b1232', '#162248', '#22326a', '#3a4f88', '#566e9e'],
  ['#0e0f33', '#221a5a', '#47307a', '#93488a', '#e0728a', '#ffa882'],
  ['#161446', '#352570', '#6c3d88', '#c25a7c', '#ff9a6a', '#ffd488'],
];
const LAYER_COLS = {      /* [blue, rose, gold] */
  far: ['#27345f', '#68487f', '#a96a82'],
  mid: ['#182148', '#40305f', '#74436b'],
  near: ['#0f1534', '#2a2046', '#4a2f4c'],
  hill: ['#0a0e28', '#191337', '#2a1c36'],
};
const lit3 = (cols, p1, p2) => mixH(mixH(cols[0], cols[1], p1), cols[2], p2);

// ------------------------------------------------------------------ the building: a dollhouse seen as a silhouette, every room a glowing cell
const BS = 2;      /* cache resolution */
const B_PAD = 40;  /* units around the building in the cache */
const B_TOP = G.Y0 - 190;   /* the cache reaches this high (the roof, the flagpole) */
let BCACHE = null;
const roofPoly = [[G.X0 - 26, G.Y0 + 2], [G.X0 + 60, G.Y0 - 86], [540, G.Y0 - 138], [G.X1 - 60, G.Y0 - 86], [G.X1 + 26, G.Y0 + 2]];
const OUTLINE = (() => {
  const p = new Path2D();
  p.moveTo(G.X0, G.Y1); p.lineTo(G.X0, G.Y0 + 2); p.lineTo(roofPoly[0][0], roofPoly[0][1]); for (const [x, y] of roofPoly.slice(1)) p.lineTo(x, y); p.lineTo(G.X1, G.Y0 + 2); p.lineTo(G.X1, G.Y1);
  return p;
})();
/* furniture silhouettes inside each cell, in unit coordinates (a floor line at r.floor) */
function furniture(g, r) {
  const f = r.floor, x = r.x0, w = r.w, c = x + w / 2;
  g.fillStyle = '#0a0e22';
  const rect = (a, b, ww, hh) => g.fillRect(a, b, ww, hh);
  const tbl = (cx, y, ww) => { rect(cx - ww / 2, y, ww, 12); rect(cx - ww / 2 + 8, y + 12, 9, f - y - 12); rect(cx + ww / 2 - 17, y + 12, 9, f - y - 12); };
  const chair = (cx, sw = 44) => { rect(cx - sw / 2, f - 60, sw, 10); rect(cx - sw / 2, f - 50, 8, 50); rect(cx + sw / 2 - 8, f - 50, 8, 50); rect(cx - sw / 2, f - 110, 8, 54); };
  const bed = (cx) => { rect(cx - 86, f - 48, 172, 24); rect(cx - 86, f - 24, 10, 24); rect(cx + 76, f - 24, 10, 24); rect(cx - 92, f - 110, 12, 86); g.beginPath(); g.ellipse(cx - 54, f - 56, 26, 11, 0, 0, TAU); g.fill(); };
  const lamp = (cx, y) => { rect(cx - 3, y, 6, 70); g.beginPath(); g.moveTo(cx - 22, y); g.lineTo(cx + 22, y); g.lineTo(cx + 12, y - 30); g.lineTo(cx - 12, y - 30); g.closePath(); g.fill(); };
  switch (r.id) {
    case 'office': tbl(c + 20, f - 92, 150); chair(c - 70); lamp(c + 80, f - 160); rect(c - 6, f - 150, 56, 40); break;
    case 'conf': tbl(c, f - 78, 190); for (const d of [-72, -24, 24, 72]) chair(c + d, 34); rect(c - 70, f - 230, 140, 82); break;
    case 'rest': tbl(c - 20, f - 78, 100); chair(c - 80, 36); chair(c + 40, 36); rect(c + 70, f - 170, 50, 170); break;
    case 'r14': bed(c); lamp(c + 90, f - 150); break;
    case 'med': rect(x + 18, f - 210, 70, 210); rect(x + 18, f - 130, 70, 6); tbl(c + 50, f - 74, 90); rect(c + 20, f - 102, 26, 26); break;
    case 'r4': bed(c - 10); tbl(c + 90, f - 90, 50); break;
    case 'r7': bed(c + 6); chair(c - 90, 36); break;
    case 'shower': rect(x + 24, f - 300, 8, 300); rect(x + 24, f - 300, 90, 8); g.beginPath(); g.ellipse(x + 100, f - 280, 18, 8, 0, 0, TAU); g.fill(); rect(c - 10, f - 40, 120, 30); rect(c + 100, f - 150, 10, 150); break;
    case 'lobby': rect(x + 30, f - 220, 10, 220); rect(x + 30, f - 220, 100, 10); tbl(c + 30, f - 70, 120); g.beginPath(); g.ellipse(c + 80, f - 130, 26, 38, 0, 0, TAU); g.fill(); break;
    case 'station': rect(x + 70, f - 100, w - 200, 20); rect(x + 70, f - 80, w - 200, 80); rect(c - 70, f - 160, 56, 40); rect(c + 20, f - 154, 50, 34); rect(x + 30, f - 250, 8, 250); rect(x + w - 90, f - 130, 50, 130); break;
    case 'dining': tbl(c - 56, f - 80, 90); tbl(c + 56, f - 80, 90); chair(c - 100, 30); chair(c, 30); chair(c + 100, 30); break;
  }
}
function buildBuilding() {
  const wU = G.X1 - G.X0 + 2 * B_PAD, hU = G.Y1 - B_TOP + 12;
  BCACHE = mkCv(Math.round(wU * BK * BS), Math.round(hU * BK * BS));
  intoCv(BCACHE, g => {
    g.scale(BK * BS, BK * BS); g.translate(-(G.X0 - B_PAD), -B_TOP);
    // the body: dark, with a hair of blue so it is not a flat hole
    g.fillStyle = V2.grad(0, G.Y0, 0, G.Y1, [[0, '#0f1530'], [1, '#080b1d']]);
    g.fillRect(G.X0, G.Y0, G.X1 - G.X0, G.Y1 - G.Y0);
    // the roof
    g.fillStyle = V2.grad(0, G.Y0 - 140, 0, G.Y0, [[0, '#0c1230'], [1, '#080b1d']]);
    g.beginPath(); roofPoly.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
    g.fillRect(G.X0 - 20, G.Y0 - 6, G.X1 - G.X0 + 40, 14);                                      // the eaves
    g.fillRect(900, G.Y0 - 178, 46, 120);                                                       // the chimney
    g.fillRect(886, G.Y0 - 190, 74, 18);
    g.fillRect(60, G.Y0 - 330, 10, 262);                                                         // the flagpole
    g.fillRect(522, G.Y0 - 190, 36, 60); g.beginPath(); g.moveTo(514, G.Y0 - 188); g.lineTo(540, G.Y0 - 226); g.lineTo(566, G.Y0 - 188); g.closePath(); g.fill();   // the cupola
    g.fillRect(300, G.Y0 - 92, 8, 94); g.fillRect(262, G.Y0 - 108, 84, 6);                       // an antenna
    // the cells: holes where the light of the rooms shows through, with their furniture standing in them
    g.globalCompositeOperation = 'destination-out';
    for (const r of ROOMS) g.fillRect(r.x0, r.y0, r.w, r.h);
    g.globalCompositeOperation = 'source-over';
    for (const r of ROOMS) { g.save(); g.beginPath(); g.rect(r.x0, r.y0, r.w, r.h); g.clip(); furniture(g, r); g.restore(); }
    // a foundation under the cells
    g.fillStyle = '#070a1a'; g.fillRect(G.X0 - 16, G.Y1 - 4, G.X1 - G.X0 + 32, 20);
  });
}

const rgbS = c => V2.rgb(c).map(v => Math.round(v)).join(',');
const A7 = window.A7;

// ------------------------------------------------------------------ the sky
function drawSky(lt) {
  const p1 = phase1(lt), p2 = phase2(lt), g = ctx.createLinearGradient(0, SKY_STOPS[0], 0, SKY_STOPS[5]);
  SKY_STOPS.forEach((y, i) => g.addColorStop((y - SKY_STOPS[0]) / (SKY_STOPS[5] - SKY_STOPS[0]), lit3([SKY_COLS[0][i], SKY_COLS[1][i], SKY_COLS[2][i]], p1, p2)));
  ctx.fillStyle = g; ctx.fillRect(-300, -400, W + 600, 1900);
  // the stars go out as the light comes up
  const sa = 1 - easeIn(seg(lt, .35, 1.9));
  if (sa > .01) A7.stars(lt, 820, { n: 120, a: sa });
}
/* the sun: a disc with its glow, drawn before the ridges so the land cuts it */
function drawSun(lt) {
  const y = sunY(lt), p1 = phase1(lt), p2 = phase2(lt), up = seg(lt, .2, 2.4);
  const core = mixH('#ff7a3c', '#fff3c8', clamp(p1 * .6 + p2 * .6));
  // the warm bloom of the horizon, wide and low
  V2.glow(SUN_X, y + 40, 900, '255,140,90', .46 * p1 + .12 * p2, 'screen', .3);
  V2.glow(SUN_X, y, 520, rgbS(core), .5 * up + .22 * p2, 'screen', .3);
  V2.glow(SUN_X, y, 200, rgbS(mixH(core, '#ffffff', .5)), .5 * up, 'screen', .25);
  // crepuscular rays, growing with the light and turning very slowly
  A7.rays(SUN_X, y, 80, 1700, lt, { n: 15, color: rgbS(mixH('#ffb070', '#ffe2a0', p2)), a: .06 + .22 * p1 + .16 * p2, spin: .012 });
  // the disc
  ctx.save();
  const g = V2.radial(SUN_X, y, 0, SUN_R, [[0, '#ffffff'], [.8, mixH('#fff6d0', core, .35)], [.97, mixH('#ffe9a8', core, .6)], [1, V2.rgba(core, 0)]]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(SUN_X, y, SUN_R, 0, TAU); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ clouds: long strips lit from below, and one that is shaped like a star
let STARCLOUD = null;
function buildStarCloud() {
  const N = 460;
  STARCLOUD = mkCv(N, N);
  intoCv(STARCLOUD, g => {
    const tmp = mkCv(N, N), t = tmp.getContext('2d');
    t.translate(N / 2, N / 2 + 8); t.fillStyle = '#fff'; t.strokeStyle = '#fff'; t.lineJoin = 'round'; t.lineWidth = 40;
    t.beginPath();
    for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 70 : 150; t.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    t.closePath(); t.fill(); t.stroke();
    g.filter = 'blur(5px)'; g.drawImage(tmp, 0, 0); g.filter = 'none';
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = V2.grad(0, 60, 0, N - 60, [[0, 'rgba(176,150,236,1)'], [.5, 'rgba(255,150,176,1)'], [1, 'rgba(255,196,120,1)']]);
    g.fillRect(0, 0, N, N);
  });
}
function softBlob(x, y, rx, ry, color, a) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, V2.rgba(color, a)); g.addColorStop(.55, V2.rgba(color, a * .55)); g.addColorStop(1, V2.rgba(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
  ctx.restore();
}
const CLOUDS = [[705, 250, 15, 7, 6, .55], [770, 300, 18, 5, 1, .8], [832, 420, 24, 4, 2, 1], [892, 520, 28, 3, 3, 1], [950, 380, 20, 3.5, 5, .9]];
function drawClouds(lt, cr) {
  const p1 = phase1(lt), p2 = phase2(lt), lit = mixH(mixH('#a898e0', '#ffb0b0', p1), '#ffd69a', p2), belly = mixH(mixH('#222c62', '#5a3a8a', p1), '#9a4f7c', p2), a0 = easeOut(seg(lt, .2, 1.6));
  ctx.save(); ctx.translate(0, 10 * cr);
  CLOUDS.forEach(([y, rx, ry, sp, seed, st]) => {
    const span = W + 4 * rx, x = (((hash(seed * 3.7) * span + lt * sp * 3) % span) + span) % span - 2 * rx + rx;
    softBlob(x, y - ry * .35, rx, ry * 1.1, belly, .55 * st * a0);
    softBlob(x - rx * .35, y + ry * .35, rx * .8, ry * .8, lit, .62 * st * a0 * (.5 + .5 * p1));
    softBlob(x + rx * .4, y + ry * .45, rx * .7, ry * .7, lit, .56 * st * a0 * (.5 + .5 * p1));
  });
  ctx.restore();
  // the star-shaped cloud, drifting a few pixels
  if (!STARCLOUD) buildStarCloud();
  ctx.save(); ctx.globalAlpha = .78 * easeOut(seg(lt, .9, 2.2)) * (.55 + .45 * p2);
  ctx.drawImage(STARCLOUD, 70 + 9 * lt, 700 + 6 * cr, 250, 250);
  ctx.restore();
}

// ------------------------------------------------------------------ a flock crossing the frame
const FLOCK = (() => { const out = [{ r: 0, s: 0 }]; for (let r = 1; r <= 5; r++) for (const s of [-1, 1]) out.push({ r, s }); return out; })();
function bird(x, y, sc, ph, col) {
  const f = Math.sin(ph), up = -18 * f - 3;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(-9, -9 + 5 * f, -26, up);
  ctx.quadraticCurveTo(-13, -3 + 4 * f, 0, 7);
  ctx.quadraticCurveTo(13, -3 + 4 * f, 26, up);
  ctx.quadraticCurveTo(9, -9 + 5 * f, 0, 2);
  ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 4, 5.5, 3.6, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawFlock(lt) {
  if (lt < .2 || lt > 5.2) return;
  const fx = -40 + 270 * (lt - .25), fy = 958 + 14 * Math.sin(lt * 1.3) - 16 * seg(lt, 0, 4.5);
  const col = mixH(mixH('#0c1030', '#1c1236', phase1(lt)), '#2a1a34', phase2(lt));
  FLOCK.forEach((b, i) => {
    const bx = fx - b.r * 62 + (hash(i * 3.1) - .5) * 16, by = fy + b.s * b.r * 30 + (hash(i * 5.3) - .5) * 12 + 5 * Math.sin(lt * 2.1 + i);
    bird(bx, by, 1.6 - b.r * .07, lt * 11.5 + i * .9, col);
  });
}

// ------------------------------------------------------------------ land layers
function drawLayer(key, lt, cr, par, o = {}) {
  const p1 = phase1(lt), p2 = phase2(lt), dy = par * CRANE * cr, col = lit3(LAYER_COLS[key], p1, p2);
  ctx.save(); ctx.translate(0, dy);
  const top = LAND[key].reduce((a, p) => Math.min(a, p[1]), 1e9);
  ctx.fillStyle = V2.grad(0, top, 0, top + (o.depth || 380), [[0, col], [1, mixH(col, o.floor || '#05071a', .55)]]);
  ctx.fill(LP[key]);
  // the warm rim on the ridge line nearest the sun
  const ra = (.12 + .42 * p1 + .22 * p2) * (o.rim ?? 1);
  if (ra > .02) {
    const rg = ctx.createLinearGradient(SUN_X - 560, 0, SUN_X + 560, 0);
    rg.addColorStop(0, 'rgba(255,190,130,0)'); rg.addColorStop(.5, `rgba(255,214,150,${ra})`); rg.addColorStop(1, 'rgba(255,190,130,0)');
    ctx.strokeStyle = rg; ctx.lineWidth = o.rimW || 3; ctx.lineJoin = 'round'; ctx.stroke(LE[key]);
  }
  if (o.extra) o.extra(lt);
  ctx.restore();
}
/* a band of mist lying on the land between two layers */
function mist(lt, cr, par, y0, y1, a) {
  const p1 = phase1(lt), p2 = phase2(lt), c = mixH(mixH('#566e9e', '#e0728a', p1), '#ffc08a', p2), dy = par * CRANE * cr;
  ctx.save(); ctx.translate(0, dy);
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, V2.rgba(c, 0)); g.addColorStop(.55, V2.rgba(c, a)); g.addColorStop(1, V2.rgba(c, 0));
  ctx.fillStyle = g; ctx.fillRect(-100, y0, W + 200, y1 - y0);
  ctx.restore();
}
/* trees: little pines along a ridge and big ones flanking the hill (paths built once) */
function pinesOn(pts, seed, h0, h1, step) {
  const R = V2.rng(seed), p = new Path2D();
  for (let i = 0; i < pts.length; i += 1) {
    if (R() > .55) continue;
    const [x, y] = pts[i], h = h0 + R() * (h1 - h0), w = h * .34;
    p.moveTo(x - w, y + 4); p.lineTo(x, y - h); p.lineTo(x + w, y + 4); p.closePath();
  }
  return p;
}
function bigPines(seed, xs, base, h0, h1) {
  const R = V2.rng(seed), p = new Path2D();
  for (const x0 of xs) {
    const h = h0 + R() * (h1 - h0), w = h * .3, x = x0 + (R() - .5) * 20;
    for (let t = 0; t < 4; t++) { const yb = base - h * (.16 + t * .2), hh = h * (.4 - t * .05), ww = w * (1 - t * .17); p.moveTo(x - ww, yb); p.lineTo(x, yb - hh); p.lineTo(x + ww, yb); p.closePath(); }
    p.rect(x - 4, base - 6, 8, 14);
  }
  return p;
}
const TREES = {
  near: pinesOn(LAND.near, 77, 26, 66),
  hillL: bigPines(31, [40, 100, 160, 214, 262], BBASE + 20, 150, 250),
  hillR: bigPines(33, [820, 870, 930, 990, 1050], BBASE + 20, 150, 260),
};

// ------------------------------------------------------------------ the building
const ROOM_TINT = { office: '#ffd890', conf: '#fff0d4', rest: '#ffd27e', r14: '#ffc8a0', med: '#e8f6e4', r4: '#ffe39e', r7: '#ffd2a2', shower: '#d6efff', lobby: '#ffe2aa', station: '#fff2c6', dining: '#ffcc84' };
const wakeAmt = (id, lt, i) => {
  const w = WAKE[id], k = seg(lt, w, w + .12);
  if (k <= 0) return 0;
  const flick = lt < w + .3 ? (hash(Math.floor((lt - w) * 55) + i * 9) > .4 ? 1 : .3) : 1;     // the fluorescent tube stutters on
  return k * flick * (1 - .1 * (hash(Math.floor(lt * 14) + i * 3.3) > .96 ? 1 : 0));
};
/* a tiny colonist standing or pacing in a lit cell: a round body, a head, two feet */
function colonist(x, f, sc, tint) {
  ctx.save(); ctx.translate(x, f);
  ctx.fillStyle = tint; ctx.beginPath(); ctx.ellipse(0, -34 * sc, 15 * sc, 22 * sc, 0, 0, TAU); ctx.fill();
  ctx.fillRect(-9 * sc, -14 * sc, 5 * sc, 14 * sc); ctx.fillRect(4 * sc, -14 * sc, 5 * sc, 14 * sc);
  ctx.restore();
}
function drawBuilding(lt, cr) {
  if (!BCACHE) buildBuilding();
  const p1 = phase1(lt), p2 = phase2(lt), dy = PAR.hill * CRANE * cr, wU = G.X1 - G.X0 + 2 * B_PAD, hU = G.Y1 - B_TOP + 12;
  ctx.save(); ctx.translate(BX0, BY0 + dy); ctx.scale(BK, BK); ctx.translate(-G.X0, -G.Y0);
  const dark = mixH('#0a0f2c', '#1a1438', p1);
  ROOMS.forEach((r, i) => {
    const a = wakeAmt(r.id, lt, i);
    ctx.fillStyle = dark; ctx.fillRect(r.x0, r.y0, r.w, r.h);
    if (a > 0) {
      const tn = ROOM_TINT[r.id], g = ctx.createLinearGradient(0, r.y0, 0, r.y0 + r.h);
      g.addColorStop(0, V2.rgba(mixH(tn, '#fffbe8', .6), a)); g.addColorStop(.55, V2.rgba(tn, a)); g.addColorStop(1, V2.rgba(mixH(tn, '#e0802c', .45), a));
      ctx.fillStyle = g; ctx.fillRect(r.x0, r.y0, r.w, r.h);
      // depth: the ceiling and the side wall fall into shade
      const sh = ctx.createLinearGradient(0, r.y0, 0, r.y0 + 44); sh.addColorStop(0, `rgba(60,24,10,${.42 * a})`); sh.addColorStop(1, 'rgba(60,24,10,0)'); ctx.fillStyle = sh; ctx.fillRect(r.x0, r.y0, r.w, 44);
      const sl = ctx.createLinearGradient(r.x0, 0, r.x0 + 26, 0); sl.addColorStop(0, `rgba(60,24,10,${.3 * a})`); sl.addColorStop(1, 'rgba(60,24,10,0)'); ctx.fillStyle = sl; ctx.fillRect(r.x0, r.y0, 26, r.h);
      // the lamp of the room: a brighter pool high in the cell, and the light it throws on the air outside
      V2.glow(r.x0 + r.w / 2, r.y0 + 70, r.w * .8, '255,238,180', .3 * a, 'screen', 0);
      V2.emit(r.x0 + r.w / 2, r.y0 + r.h / 2, r.w * .8, '255,200,110', .3 * a * (1 - .5 * p2));
    }
  });
  // tiny colonists
  const walk = (a, b, ph) => lerp(a, b, .5 + .5 * Math.sin(lt * .9 + ph));
  const dk = '#0a0e22';
  const st = ROOMS[9], lb = ROOMS[8], md = ROOMS[4], dn = ROOMS[10];
  if (wakeAmt('station', lt, 9) > .5) { colonist(walk(st.x0 + 70, st.x0 + st.w - 80, 0), st.floor, .9, dk); colonist(st.x0 + st.w - 90, st.floor, .9, dk); }
  if (wakeAmt('lobby', lt, 8) > .5) colonist(walk(lb.x0 + 60, lb.x0 + 110, 2), lb.floor, .9, dk);
  if (wakeAmt('med', lt, 4) > .5) colonist(md.x0 + 150, md.floor, .9, dk);
  if (wakeAmt('dining', lt, 10) > .5) { colonist(dn.x0 + 60, dn.floor, .8, dk); colonist(dn.x0 + 200, dn.floor, .8, dk); }
  ctx.drawImage(BCACHE, G.X0 - B_PAD, B_TOP, wU, hU);
  // the rim of the sun on the roof and the walls
  const ra = (.12 + .5 * p1 + .3 * p2);
  ctx.strokeStyle = `rgba(255,214,150,${ra})`; ctx.lineWidth = 3.2 / BK * .7; ctx.lineJoin = 'round'; ctx.stroke(OUTLINE);
  // the flag, the beacon on the aerial and the cupola light
  const wv = Math.sin(lt * 4.2) * 5;
  ctx.fillStyle = '#0a0e22'; ctx.beginPath(); ctx.moveTo(69, G.Y0 - 328); ctx.quadraticCurveTo(100, G.Y0 - 336 + wv, 138, G.Y0 - 322 + wv * 1.4); ctx.lineTo(138, G.Y0 - 276 + wv * 1.4); ctx.quadraticCurveTo(100, G.Y0 - 286 + wv, 69, G.Y0 - 272); ctx.closePath(); ctx.fill();
  if (Math.sin(lt * 5) > .35) { ctx.fillStyle = 'rgba(255,70,60,.95)'; ctx.beginPath(); ctx.arc(304, G.Y0 - 96, 6, 0, TAU); ctx.fill(); V2.emit(304, G.Y0 - 96, 40, '255,70,60', .5 * (1 - p2)); }
  ctx.restore();
}

// ------------------------------------------------------------------ the lot, the white sedan, the lamp post
function drawLot(lt, cr) {
  const dy = PAR.hill * CRANE * cr, p1 = phase1(lt), p2 = phase2(lt);
  ctx.save(); ctx.translate(0, dy);
  // a strip of asphalt in front of the building, catching the sky
  const y0 = BBASE + 22, y1 = BBASE + 118;
  ctx.fillStyle = V2.grad(0, y0, 0, y1, [[0, mixH('#10142e', '#3a2c48', p2)], [1, '#080a1c']]);
  ctx.beginPath(); ctx.moveTo(-60, y0 + 16); ctx.lineTo(W + 60, y0 - 4); ctx.lineTo(W + 60, y1); ctx.lineTo(-60, y1 + 24); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = `rgba(255,205,150,${.12 + .3 * p2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-60, y0 + 16); ctx.lineTo(W + 60, y0 - 4); ctx.stroke();
  // painted bays
  ctx.strokeStyle = `rgba(240,225,200,${.1 + .12 * p2})`; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const x = 90 + i * 150; ctx.beginPath(); ctx.moveTo(x, y0 + 54 - i * .4); ctx.lineTo(x - 28, y0 + 104); ctx.stroke(); }
  // the lamp post at the left of the lot: it burns until the sun is up
  const lampOn = 1 - seg(lt, 1.8, 2.6);
  ctx.fillStyle = '#080b1c'; ctx.fillRect(112, BBASE - 150, 7, 190); ctx.fillRect(100, BBASE - 158, 32, 10);
  if (lampOn > 0) { V2.glow(116, BBASE - 144, 190, '255,200,120', .55 * lampOn, 'screen', .5); ctx.fillStyle = `rgba(255,236,190,${lampOn})`; ctx.fillRect(104, BBASE - 148, 24, 6); }
  // the sedan: it comes in from the right and stops in front of the lobby, its brake lights on at the end
  const carK = easeOut(seg(lt, .9, 4.7)), cx = lerp(1230, 700, carK), cy = BBASE + 78;
  const braking = lt > 4.2 && lt < 5.2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1.3, 1.3);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, 20, 62, 8, 0, 0, TAU); ctx.fill();
  const body = mixH('#cfd3e6', '#f4efe2', p1 * .5 + p2 * .5);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(-60, 14); ctx.lineTo(-60, -2); ctx.quadraticCurveTo(-58, -10, -44, -11); ctx.lineTo(-26, -12); ctx.quadraticCurveTo(-18, -30, -2, -31); ctx.lineTo(22, -31); ctx.quadraticCurveTo(34, -30, 40, -12); ctx.lineTo(56, -9); ctx.quadraticCurveTo(62, -6, 62, 2); ctx.lineTo(62, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a2038'; ctx.beginPath(); ctx.moveTo(-16, -13); ctx.quadraticCurveTo(-10, -26, 0, -27); ctx.lineTo(8, -27); ctx.lineTo(8, -13); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(14, -13); ctx.lineTo(14, -27); ctx.lineTo(22, -27); ctx.quadraticCurveTo(30, -26, 34, -13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#10142a'; for (const wx of [-36, 34]) { ctx.beginPath(); ctx.arc(wx, 14, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#9aa4c4'; ctx.beginPath(); ctx.arc(wx, 14, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#10142a'; }
  ctx.fillStyle = `rgba(255,70,60,${braking ? 1 : .35})`; ctx.fillRect(58, -1, 5, 6);
  ctx.restore();
  V2.glow(cx + (braking ? 80 : 0), cy + 2, braking ? 50 : 22, '255,60,50', braking ? .6 : .0, 'screen', .5);
  // headlights point left, into the lot
  if (carK > 0 && carK < 1) { V2.beam(cx - 78, cy + 2, cx - 330, cy + 24, 14, 84, '255,236,190', .28 * (1 - p2 * .5), 'screen'); }
  ctx.restore();
}

// ------------------------------------------------------------------ the foreground: grass, a surveyor's stake with its tape, a post with a pigeon holding a clipboard (this layer slides out of the frame in the crane-up)
const GROUND_Y = x => 1806 + 20 * Math.sin(x * .006 + .6) - 40 * Math.pow((x - 540) / 540, 2);
function pigeon(x, y, lt) {
  const bob = lt > 1.2 && lt < 4.6 ? Math.max(0, Math.sin(lt * 9)) * 3.5 : 0;   // it takes notes
  ctx.save(); ctx.translate(x, y); ctx.scale(2.1, 2.1);
  ctx.fillStyle = '#090c20';
  ctx.beginPath(); ctx.ellipse(0, -14, 15, 10.5, -.1, 0, TAU); ctx.fill();                 // the body
  ctx.beginPath(); ctx.moveTo(10, -18); ctx.lineTo(32, -26); ctx.lineTo(28, -12); ctx.closePath(); ctx.fill();   // the tail
  ctx.beginPath(); ctx.arc(-13 - bob * .3, -24 + bob, 6.4, 0, TAU); ctx.fill();            // the head
  ctx.beginPath(); ctx.moveTo(-18.5 - bob * .3, -25 + bob); ctx.lineTo(-25 - bob * .3, -22.5 + bob); ctx.lineTo(-18.5 - bob * .3, -22 + bob); ctx.closePath(); ctx.fill();   // the beak
  ctx.fillRect(-4, -5, 2, 9); ctx.fillRect(2, -5, 2, 9);                                    // the legs
  // the clipboard under its wing, lit by the dawn
  ctx.save(); ctx.translate(-5, -13); ctx.rotate(-.12);
  ctx.fillStyle = '#e9dcc0'; ctx.fillRect(-6, -8, 12, 16); ctx.fillStyle = '#7a5a30'; ctx.fillRect(-2.5, -9.5, 5, 3);
  ctx.strokeStyle = 'rgba(60,50,40,.5)'; ctx.lineWidth = .9; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-4, -3 + i * 4); ctx.lineTo(4, -3 + i * 4); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
}
/* the surveyor's stake: a wooden peg with a strip of fluorescent flagging tape tied round it, fluttering */
function stake(x, y, lt) {
  const sw = Math.sin(lt * 5.2) * 6, sw2 = Math.sin(lt * 6.6 + 1) * 5;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#1a1730'; ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(-6, -118); ctx.lineTo(0, -128); ctx.lineTo(6, -118); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,190,130,.5)'; ctx.fillRect(3, -118, 3, 122);
  const tape = (y0, sg) => { ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.moveTo(5, y0); ctx.quadraticCurveTo(30, y0 - 8 + sg, 58 + sg, y0 + 2 + sg * .6); ctx.lineTo(56 + sg, y0 + 15 + sg * .6); ctx.quadraticCurveTo(30, y0 + 8 + sg * .4, 5, y0 + 12); ctx.closePath(); ctx.fill(); };
  tape(-108, sw); tape(-92, sw2 * .8);
  V2.emit(30, -100, 50, '255,120,50', .22);
  ctx.restore();
}
function drawForeground(lt, cr) {
  const dy = PAR.fore * CRANE * cr, p1 = phase1(lt), p2 = phase2(lt);
  ctx.save(); ctx.translate(0, dy);
  const gcol = mixH('#070a1c', '#0e0a1c', p2);
  ctx.fillStyle = gcol;
  ctx.beginPath(); ctx.moveTo(-80, 2300); for (let x = -80; x <= W + 80; x += 20) ctx.lineTo(x, GROUND_Y(x)); ctx.lineTo(W + 80, 2300); ctx.closePath(); ctx.fill();
  // the stake and the post with its pigeon
  stake(150, GROUND_Y(150) + 6, lt);
  ctx.fillStyle = gcol; { const px = 936, gy = GROUND_Y(px); ctx.fillRect(px - 11, gy - 112, 22, 130); ctx.beginPath(); ctx.moveTo(px - 11, gy - 112); ctx.lineTo(px, gy - 124); ctx.lineTo(px + 11, gy - 112); ctx.closePath(); ctx.fill(); pigeon(px - 2, gy - 120, lt); }
  // grass: tapered blades, a few tall stalks with seed heads, swaying in the first breeze of the day
  const rim = `rgba(255,190,120,${.22 * p1 + .28 * p2})`;
  for (let i = 0; i < 150; i++) {
    const x = -24 + i * 7.6 + (hash(i * 1.7) - .5) * 6, tall = hash(i * 4.1) > .93, h = tall ? 120 + hash(i * 2.3) * 70 : 26 + hash(i * 2.3) * 52, w = tall ? 3.2 : 4.6;
    const sw = Math.sin(lt * 1.5 + i * .5 + hash(i) * 3) * (3 + h * .06), y0 = GROUND_Y(x) + 12;
    ctx.fillStyle = rim; ctx.beginPath(); ctx.moveTo(x - w + 1.2, y0); ctx.quadraticCurveTo(x + sw * .35, y0 - h * .55, x + sw + 1, y0 - h); ctx.quadraticCurveTo(x + sw * .55 + w * .6, y0 - h * .5, x + w + 1.2, y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gcol; ctx.beginPath(); ctx.moveTo(x - w, y0); ctx.quadraticCurveTo(x + sw * .35, y0 - h * .55, x + sw, y0 - h); ctx.quadraticCurveTo(x + sw * .55 + w * .6, y0 - h * .5, x + w, y0); ctx.closePath(); ctx.fill();
    if (tall) { ctx.beginPath(); ctx.ellipse(x + sw, y0 - h + 6, 4.2, 14, sw * .03, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ light effects in screen space: the flare chain and the long anamorphic streak
const MID_C = LAND.mid.find(p => p[0] === 540)[1];
function sunVisible(lt, cr) {
  const y = sunY(lt), edge = MID_C + PAR.mid * CRANE * cr;
  return clamp((edge - (y - SUN_R)) / (2 * SUN_R));
}
function drawLightFx(lt, cr) {
  const y = sunY(lt), vis = sunVisible(lt, cr), sx = W / 2 + (SUN_X - CAM.x) * CAM.z, sy = H / 2 + (y - CAM.y) * CAM.z;
  if (vis > .02) V2.flare(sx, sy, (.1 + .26 * easeOut(seg(lt, CREST - .3, CREST + .2))) * Math.pow(vis, .8), '255,214,150');
  const k = seg(lt, CREST, CREST + .5), fade = 1 - seg(lt, CREST + .5, CREST + 1.8);
  if (k > 0 && fade > 0) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
    const L = lerp(80, 1300, easeOut(k)), h = 12 * (1 - .4 * seg(lt, CREST + .5, CREST + 1.8));
    const g = ctx.createLinearGradient(sx - L, 0, sx + L, 0);
    g.addColorStop(0, 'rgba(255,200,130,0)'); g.addColorStop(.5, `rgba(255,236,190,${.9 * fade})`); g.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = g; ctx.fillRect(sx - L, sy - h / 2, 2 * L, h);
    const g2 = ctx.createLinearGradient(sx - L, 0, sx + L, 0);
    g2.addColorStop(0, 'rgba(255,170,100,0)'); g2.addColorStop(.5, `rgba(255,190,120,${.24 * fade})`); g2.addColorStop(1, 'rgba(255,170,100,0)');
    ctx.fillStyle = g2; ctx.fillRect(sx - L, sy - h * 3.2, 2 * L, h * 6.4);
    // a broad sheet of warm light wipes across the frame behind the lettering
    const sw = seg(lt, CREST, CREST + 1.5);
    if (sw > 0 && sw < 1) {
      const bx = lerp(-380, W + 380, easeIO(sw)), a = .22 * Math.sin(sw * PI);
      const g3 = ctx.createLinearGradient(bx - 260, 0, bx + 260, 0);
      g3.addColorStop(0, 'rgba(255,214,150,0)'); g3.addColorStop(.5, `rgba(255,224,170,${a})`); g3.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
}

// ============================================================================ the scene
function titleWorld(lt) {
  const cr = craneK(lt), p1 = phase1(lt), p2 = phase2(lt);
  ctx.fillStyle = '#04061a'; ctx.fillRect(-400, -400, W + 800, H + 800);
  drawSky(lt);
  drawSun(lt);
  drawClouds(lt, cr);
  drawLayer('far', lt, cr, PAR.far, { depth: 300, floor: '#202a54', rimW: 2.4 });
  mist(lt, cr, PAR.far, 940, 1100, .42);
  drawLayer('mid', lt, cr, PAR.mid, { depth: 360, floor: '#10183a', rimW: 3 });
  mist(lt, cr, PAR.mid, 1080, 1260, .34);
  drawFlock(lt);
  drawLayer('near', lt, cr, PAR.near, { depth: 360, rim: .6, extra: () => { ctx.fillStyle = lit3(LAYER_COLS.near, p1, p2); ctx.fill(TREES.near); } });
  mist(lt, cr, PAR.near, 1230, 1480, .26);
  drawLayer('hill', lt, cr, PAR.hill, { depth: 620, rim: .5, extra: () => { ctx.fillStyle = lit3(LAYER_COLS.hill, p1, p2); ctx.fill(TREES.hillL); ctx.fill(TREES.hillR); } });
  drawBuilding(lt, cr);
  drawLot(lt, cr);
  drawForeground(lt, cr);
  // warm motes of dust drifting up in the new light
  const da = seg(lt, 1.6, 2.8);
  if (da > 0) V2.dust(0, 700, W, 1750, lt, { n: 46, alpha: .5 * da, size: 3.2, speed: 7, color: '255,226,160' });
  drawLightFx(lt, cr);
  // the downbeat: an exposure lift (screen, so it brightens instead of greying)
  const pu = lt >= CREST ? ring(lt, CREST, .09) : 0;
  if (pu > .01) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,196,130,${.34 * pu})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
const TITLE = {
  noChyron: true, noScrim: true,
  cam(lt) {
    zoomAbout(540, 1300, 1 + .05 * craneK(lt));
    CAM.shake = 5 * ring(lt, 3.0, .07) * (lt >= 3.0);
  },
  draw: titleWorld,
  fx(lt) {
    const p2 = phase2(lt), pulse = lt >= CREST ? ring(lt, CREST, .075) : 0, fin = lt < .2 ? 1 - lt / .2 : 0, fl = 0;
    return { bloom: .5 + .3 * p2 + .6 * pulse, vignette: .5, grain: .055, contrast: .14, sat: .05 + .06 * p2, aberr: 5 * pulse, tint: [['#ff9a60', .1 * p2, 'soft-light'], ['#3050a0', .1 * (1 - phase1(lt)), 'soft-light']], fade: Math.max(fin, fl), fadeColor: fin > fl ? '2,4,14' : '255,238,200' };
  },
  blur: lt => (lt < .2 || lt > 4.7) ? 1 : 3,
  over() {},
};
window.__EP14_SCENES.title = TITLE;

// ------------------------------------------------------------------ the lettering: laid out by UI.stack (centred on x 540), then drawn item by item so each one lands on its own beat
const DING = 2.7;     // textding
const T_ITEMS = [
  { t: 'SHIFT HAPPENS', font: 'Bangers', size: 132, fill: YEL, stroke: INKC, lw: 22, spacing: 6, shadow: 22, gap: 48 },
  { pill: 'EPISODE 14', font: 'Bangers', size: 58, spacing: 6, bg: RED, ink: CREAM, stroke: INKC, lw: 7, h: 88, gap: 40 },
  { t: 'THE SURVEY', font: 'Bangers', size: 230, fill: CREAM, stroke: INKC, lw: 30, spacing: 6, shadow: 28, gap: 56 },
  { t: 'A natural history of the State.', size: 46, weight: 900, italic: true, fill: CREAM, stroke: INKC, lw: 9 },
];
const T_STACK = { cx: 540, top: 152, maxW: 960 };
let T_LAY = null;
function titleLayout() {
  if (T_LAY) return T_LAY;
  ctx.save(); ctx.globalAlpha = 0;
  const r = UI.stack(T_ITEMS, T_STACK);
  ctx.restore();
  T_LAY = { shift: r.boxes[0][0], pill: r.boxes[1], title: r.boxes[2][0], tag: r.boxes[3][0], y0: r.y0, y1: r.y1 };
  return T_LAY;
}
/* run fn with the transform of an element that pops (copied from ep13_title.js): scale (sx, sy) about (cx, cy), shifted dy, faded by a */
function popAbout(cx, cy, sx, sy, dy, a, fn) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy + dy); ctx.scale(sx, sy); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
function vgrad(size, font, stops) {   // a vertical gradient in the text's own frame (origin on the baseline)
  const m = UI.metrics(font, font === 'Nunito' ? 900 : 400), g = ctx.createLinearGradient(0, -m.cap * size, 0, 0);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function overTitle(lt) {
  const L = titleLayout(), it = T_ITEMS, cyOf = b => (b.y0 + b.y1) / 2;
  if (lt < DING - .05) return;
  // a warm light behind the lettering, coming up with the sun
  const gl = easeOut(seg(lt, DING, DING + .7));
  if (gl > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, 420, 40, 760, [[0, `rgba(255,190,120,${.16 * gl})`], [1, 'rgba(255,190,120,0)']]); ctx.fillRect(0, 0, W, 1000); ctx.restore(); }
  // 1. SHIFT HAPPENS lands on the ding (it may not grow wider than the frame: the pop starts at 1.3)
  {
    const k = seg(lt, DING, DING + .34), sc = lerp(1.3, 1, easeBack(k)), b = L.shift, f = it[0];
    if (k > 0) popAbout(b.cx, cyOf(b), sc, sc, 0, clamp(k * 4), () => UI.write(f.t, b.cx, b.base, Object.assign({}, f, { align: 'center', maxW: T_STACK.maxW, fill: vgrad(f.size, f.font, [[0, '#fff7b0'], [.55, YEL], [1, '#ffb800']]) })));
  }
  // 2. the EPISODE pill rises into place with a bounce
  {
    const k = seg(lt, DING + .18, DING + .52), sc = lerp(1.3, 1, easeBack(k)), b = L.pill, f = it[1];
    if (k > 0) popAbout(b.cx, b.cy, sc, sc, 28 * (1 - easeOut(k)), clamp(k * 4), () => UI.pill(f.pill, b.cx, b.cy, Object.assign({}, f, { fill: f.bg, ink: f.ink, maxW: T_STACK.maxW })));
  }
  // 3. THE SURVEY rises from its own baseline like the sun (it grows upward and never sideways: it is as wide as the frame allows), then a gold shine crosses it once
  {
    const t0 = DING + .3, k = seg(lt, t0, t0 + .22), b = L.title, f = it[2];
    if (k > 0) {
      const e = easeBack(k), sy = Math.max(.05, e) * (1 + .0), cy = b.base;
      popAbout(b.cx, cy, 1, Math.min(sy, 1.07), 0, clamp(k * 5), () => {
        UI.write(f.t, b.cx, b.base, Object.assign({}, f, { align: 'center', maxW: T_STACK.maxW, fill: vgrad(f.size, f.font, [[0, '#fffaf0'], [.6, CREAM], [1, '#e2c88e']]) }));
        const sw = seg(lt, 3.9, 4.9);
        if (sw > 0 && sw < 1) {
          const m = UI.metrics(f.font, 400), wd = b.x1 - b.x0, bx = b.x0 + lerp(-160, wd + 160, easeIO(sw)), cyy = b.base - m.cap * f.size * .5;
          const g = ctx.createLinearGradient(bx - 120, cyy - 90, bx + 120, cyy + 90);
          g.addColorStop(0, 'rgba(255,200,61,0)'); g.addColorStop(.5, 'rgba(255,214,90,.97)'); g.addColorStop(1, 'rgba(255,200,61,0)');
          UI.write(f.t, b.cx, b.base, Object.assign({}, f, { align: 'center', maxW: T_STACK.maxW, fill: g, lw: 0, shadow: 0 }));
        }
      });
    }
  }
  // 4. the tagline
  {
    const t0 = DING + .85, k = seg(lt, t0, t0 + .4), b = L.tag, f = it[3];
    if (k > 0) popAbout(b.cx, cyOf(b), 1, 1, 14 * (1 - easeOut(k)), easeOut(k), () => UI.write(f.t, b.cx, b.base, Object.assign({}, f, { align: 'center', maxW: T_STACK.maxW })));
  }
}
TITLE.over = overTitle;
})();
