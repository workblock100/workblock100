'use strict';
/* SHIFT HAPPENS, Episode 14: The Survey. Scene module E14-A (the two design scenes): `title` (5.2 s) and `end` (8.0 s), registered on window.__EP14_SCENES.
 * Nothing is needed at load time: the building's geometry is copied from ep14_house.js (S14.GEOM never changes) and the cast (A14.stateman, A14.kumquat, Episode 14's art kit) is read at draw time.
 * All text goes through the UI kit (UI.stack / write / pill / sign / panel / stamp / page), drawn live every frame; the caches hold flat art only. Prefix for anything new: fp14a_.
 *
 * TITLE (noChyron, noScrim): the opening of a nature documentary. The colony's building stands on its hill as a dollhouse silhouette (S14's eleven rooms, each a glowing cell) in the pre-dawn; the
 *   sun comes up through a saddle in two ridges, the sky goes indigo -> rose -> gold, crepuscular rays, a flock crosses, a crane-up with parallax. Cues (scene-local s): birds .2, theme7 .2 (its downbeat lands 2.4), textding 2.7.
 *   0.00-0.20  fade in from black.        0.20  the sting's drone starts: the flock enters at about 0.4 (a V of eleven, 270 px/s, over the sun at the crest); the stars are out by 1.9.
 *   0.34-2.16  the colony wakes: the windows come on one room at a time (lobby .34, station .52, dining .72, med .92, room 4 1.10, room 7 1.28, shower 1.46, office 1.66, conference 1.84, break room 2.00,
 *              room 14 2.16), each stuttering on like a tube.   0.45-1.9 sky blue -> rose, 1.9-2.9 rose -> gold.   1.2-2.4 the sun's disc clears the saddle (sunY 1225 -> 1012, then 92 px higher by 5.2).
 *   2.42       CREST = the downbeat: a warm exposure lift (screen blend, 3 frames, tau .09), a 5 px chromatic burst, the anamorphic streak (grows to 1300 px each side, gone by 4.2), a broad sheet of light
 *              wipes left to right (2.42-3.9), the flare chain; ten bokeh discs drift up from 2.2.
 *   2.70       textding: UI.stack (cx 540, top 152, max width 960), item by item: SHIFT HAPPENS pops 1.3 -> 1 (Bangers 132, yellow), 2.88 the EPISODE 14 pill rises (Bangers 58, red), 3.00 THE SURVEY grows
 *              up out of its baseline (Bangers 230, overshoot 1.07, 62 px from the frame edges) with a 5 px knock, 3.55 the tagline (Nunito 900 italic 46), 3.9-4.9 a gold shine crosses THE SURVEY once.
 *              The gaps between the three big items are equal to the pixel (32 px of clear space either side of the pill).
 *   Camera     a crane-up: five layers slide down by 150 px x parallax (far .12, mid .22, near .4, hill .62, foreground 1) and the whole frame pushes in 5% about (540, 1300). Shutter 2 samples while the flock flies.
 *   Small things  a star-shaped cloud; a pigeon with a clipboard on a post (it takes notes); a surveyor's stake with flagging tape; the lot's lamp fades out 1.8-2.6; the State's white sedan drives in (0.8-4.8) and
 *              stops in front of the lobby, brake lights on from 4.3; at 3.7 the colonists in the cells stand up straight like meerkats; a banner of mist burns off the lot.
 *
 * END (noChyron, noScrim, label THANKS FOR WATCHING): a specimen wall. Forest-green frieze with the lettering and two round windows (a clock at eleven, the Moon awake), a walnut picture rail, warm plaster
 *   lit by three spots on a ceiling track, six glass-front shadow boxes in a 3 x 2 grid hung from the rail (chains on the top row, a V of wire from a nail on the bottom row), a brass plate under each, a
 *   chair rail and a green wainscot. Everything, the lettering too, lives under one world camera (a push of 1.2% over the scene), so nothing drifts against anything else; the lettering is drawn after the
 *   grade (crisp) with the same camera re-applied, and fades with the world at the end.
 *   Layout (8 px grid): UI.rowX(3, 48, 1032, { w: 312 }) -> boxes at x 48, 384, 720 (gap 24, centres 204, 540, 876); boxes 312 x 328 at y 472 and 984; plates 312 x 136 sixteen below each box (UI.sign:
 *   name Bangers 38, Latin name Nunito 700 italic 30, role Nunito 900 30, one baseline per row); picture rail 432, chair rail 1488; stack top 112 (THANKS FOR WATCHING 38, SHIFT HAPPENS 104, THE SURVEY 140);
 *   the windows at x 136 and 944 (symmetric about 540) on the stack's middle; gag line at y 1568 and teaser pill at y 1736.
 *   0.00-0.10  fade in.  0.14 / 0.24 / 0.34  the three spots stutter on, left to right (theme7 starts at 0.1); 0.25 THANKS FOR WATCHING, 0.36 SHIFT HAPPENS pops, 0.62 THE SURVEY drops in with a squash.
 *   0.42-1.1   the six specimens drop into their boxes in reading order, 0.07 apart (a puff of dust off the ledge).
 *   1.00-2.30  BREAKS TAKEN TODAY: 0 ticks up to 6, one break each (Lemon 1.00, Mango 1.32, Clementine 1.62, the Kumquat 1.88, Mr. Stateman 2.10, Strawberry 2.30): the digit has its own fixed slot, so nothing
 *              ever moves; each break is a mug popping into a hand, with steam.
 *   2.30       the sting's downbeat (theme7 lands 2.2 s after its cue): the Strawberry's last break, a flash glint on all six glasses, a 5 px knock of the camera, the red MANDATORY stamp slams onto its notice
 *              (2.32-2.44), warm sparkles rise round the specimens, the Strawberry's box glows and her eyes close.
 *   3.40-3.85  the teaser pill rises: NEXT: EPISODE 15 / THE MERGER, with a road sign for a merge.   Idle to 7.6: blinks, breaths, sips (every 3.2 s), the Mango waves, Clementine hops, the Stateman raises one eyebrow
 *              (3.9, 6.3) and gives one "Noted." (5.4), the Kumquat checks his clipboard (3.3, 5.8), a visitor's flash off a different glass every second (1.3 + 1.02 k), a bright band crosses each glass in turn,
 *              dust turns in the beams, the Moon smirks, the clock ticks.   7.6-8.0  fade to dark.
 */
(() => {
if (!window.TIMELINE_EP14) return;
window.__EP14_SCENES = window.__EP14_SCENES || {};

// the episode's graphic palette (CONTEXT14)
const CREAM = '#f2e8cf', INKC = '#1d1a16', RED = '#c23a2b', YEL = '#ffe135', SLATE = '#33527a';   /* field-guide cream, ink, stamp red, series yellow, the State's slate (forest green #24402e and ochre #c98b2c are painted into the wall and the brass) */
const ring = (lt, t0, tau) => lt < t0 ? 0 : Math.exp(-(lt - t0) / tau);
const mixH = (a, b, k) => '#' + V2.mix(a, b, clamp(k)).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

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
  ['#080d28', '#0f183e', '#1a2a58', '#283a78', '#41579a', '#6078ac'],
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
const B_TOP = G.Y0 - 340;   /* the cache reaches this high (the roof, the flagpole) */
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
    g.fillRect(300, G.Y0 - 176, 8, 120); g.fillRect(268, G.Y0 - 162, 72, 6); g.fillRect(280, G.Y0 - 134, 48, 5);   // an antenna, standing clear of the roof
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
  if (o.blur) ctx.filter = `blur(${o.blur}px)`;
  ctx.fill(LP[key]);
  // the warm rim on the ridge line nearest the sun
  const ra = (.12 + .42 * p1 + .22 * p2) * (o.rim ?? 1);
  if (ra > .02) {
    const rg = ctx.createLinearGradient(SUN_X - 560, 0, SUN_X + 560, 0);
    rg.addColorStop(0, 'rgba(255,190,130,0)'); rg.addColorStop(.5, `rgba(255,214,150,${ra})`); rg.addColorStop(1, 'rgba(255,190,130,0)');
    ctx.strokeStyle = rg; ctx.lineWidth = o.rimW || 3; ctx.lineJoin = 'round'; ctx.stroke(LE[key]);
  }
  ctx.filter = 'none';
  if (o.extra) o.extra(lt);
  ctx.restore();
}
/* a band of mist lying on the land between two layers */
function mist(lt, cr, par, y0, y1, a, drift = 0) {
  const p1 = phase1(lt), p2 = phase2(lt), c = mixH(mixH('#566e9e', '#e0728a', p1), '#ffc08a', p2), dy = par * CRANE * cr;
  ctx.save(); ctx.translate(0, dy);
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, V2.rgba(c, 0)); g.addColorStop(.55, V2.rgba(c, a)); g.addColorStop(1, V2.rgba(c, 0));
  ctx.fillStyle = g; ctx.fillRect(-100, y0, W + 200, y1 - y0);
  if (drift) for (let i = 0; i < 4; i++) { const x = (((i * 330 + lt * drift * (1 + i * .3)) % (W + 700)) + (W + 700)) % (W + 700) - 350; softBlob(x, (y0 + y1) / 2 + (i % 2) * 20, 360, 26, c, a * .8); }
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
function colonist(x, f, sc, tint, up = 0) {
  ctx.save(); ctx.translate(x, f); ctx.scale(1 - .06 * up, 1 + .3 * up);
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
  const dk = '#0a0e22', mk = easeBack(seg(lt, 3.7, 4.0));     /* the colony sees the sedan: everyone stands up straight */
  const st = ROOMS[9], lb = ROOMS[8], md = ROOMS[4], dn = ROOMS[10];
  if (wakeAmt('station', lt, 9) > .5) { colonist(walk(st.x0 + 70, st.x0 + st.w - 80, 0) * (1 - mk) + (st.x0 + 110) * mk, st.floor, .9, dk, mk); colonist(st.x0 + st.w - 90, st.floor, .9, dk, mk); }
  if (wakeAmt('lobby', lt, 8) > .5) colonist(walk(lb.x0 + 60, lb.x0 + 110, 2) * (1 - mk) + (lb.x0 + 90) * mk, lb.floor, .9, dk, mk);
  if (wakeAmt('med', lt, 4) > .5) colonist(md.x0 + 150, md.floor, .9, dk, mk);
  if (wakeAmt('dining', lt, 10) > .5) { colonist(dn.x0 + 60, dn.floor, .8, dk, mk); colonist(dn.x0 + 200, dn.floor, .8, dk, mk); }
  ctx.drawImage(BCACHE, G.X0 - B_PAD, B_TOP, wU, hU);
  // the rim of the sun on the roof and the walls
  const ra = (.12 + .5 * p1 + .3 * p2);
  ctx.strokeStyle = `rgba(255,214,150,${ra})`; ctx.lineWidth = 3.2 / BK * .7; ctx.lineJoin = 'round'; ctx.stroke(OUTLINE);
  // the flag, the beacon on the aerial and the cupola light
  const wv = Math.sin(lt * 4.2) * 5;
  ctx.fillStyle = '#0a0e22'; ctx.beginPath(); ctx.moveTo(69, G.Y0 - 328); ctx.quadraticCurveTo(100, G.Y0 - 336 + wv, 138, G.Y0 - 322 + wv * 1.4); ctx.lineTo(138, G.Y0 - 276 + wv * 1.4); ctx.quadraticCurveTo(100, G.Y0 - 286 + wv, 69, G.Y0 - 272); ctx.closePath(); ctx.fill();
  if (Math.sin(lt * 5) > .35) { ctx.fillStyle = 'rgba(255,70,60,.95)'; ctx.beginPath(); ctx.arc(304, G.Y0 - 182, 7, 0, TAU); ctx.fill(); V2.emit(304, G.Y0 - 182, 50, '255,70,60', .5 * (1 - p2)); }
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
  softBlob(BCX, y0 + 34, 330, 62, '#ffc878', .34 * easeOut(seg(lt, 1.6, 2.6)));     /* the light of the windows on the asphalt */
  // painted bays
  ctx.strokeStyle = `rgba(240,225,200,${.1 + .12 * p2})`; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const x = 90 + i * 150; ctx.beginPath(); ctx.moveTo(x, y0 + 54 - i * .4); ctx.lineTo(x - 28, y0 + 104); ctx.stroke(); }
  // the lamp post at the left of the lot: it burns until the sun is up
  const lampOn = 1 - seg(lt, 1.8, 2.6);
  ctx.fillStyle = '#080b1c'; ctx.fillRect(112, BBASE - 150, 7, 190); ctx.fillRect(100, BBASE - 158, 32, 10);
  if (lampOn > 0) { V2.glow(116, BBASE - 144, 190, '255,200,120', .55 * lampOn, 'screen', .5); ctx.fillStyle = `rgba(255,236,190,${lampOn})`; ctx.fillRect(104, BBASE - 148, 24, 6); }
  // the sedan: it comes in from the right and stops in front of the lobby, its brake lights on at the end
  const carK = easeOut(seg(lt, .8, 4.8)), cx = lerp(1250, 350, carK), cy = BBASE + 78;
  const braking = lt > 4.3 && lt < 5.3;
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

function drawBokeh(lt) {
  const k = easeOut(seg(lt, 2.2, 3.4)); if (k <= 0) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 10; i++) {
    const x = hash(i * 3.7 + 1) * W, y = 760 + hash(i * 5.3 + 2) * 760 - lt * (4 + hash(i) * 6), r = 14 + hash(i * 7.9 + 3) * 28, a = (.05 + .07 * hash(i * 2.1 + 5)) * k;
    ctx.fillStyle = V2.radial(x, y, r * .6, r, [[0, `rgba(255,222,170,${a * .5})`], [.85, `rgba(255,214,150,${a})`], [1, 'rgba(255,214,150,0)']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
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
  drawLayer('far', lt, cr, PAR.far, { depth: 300, floor: '#202a54', rimW: 2.4, blur: 2.2 });      /* depth of field: only the far land is soft (a local blur, much cheaper than blurring the whole frame) */
  mist(lt, cr, PAR.far, 940, 1100, .42);
  drawLayer('mid', lt, cr, PAR.mid, { depth: 360, floor: '#10183a', rimW: 3 });
  mist(lt, cr, PAR.mid, 1080, 1260, .34, 14);
  drawFlock(lt);
  drawLayer('near', lt, cr, PAR.near, { depth: 360, rim: .6, extra: () => { ctx.fillStyle = lit3(LAYER_COLS.near, p1, p2); ctx.fill(TREES.near); } });
  mist(lt, cr, PAR.near, 1230, 1480, .26, -10);
  drawLayer('hill', lt, cr, PAR.hill, { depth: 620, rim: .5, extra: () => { ctx.fillStyle = lit3(LAYER_COLS.hill, p1, p2); ctx.fill(TREES.hillL); ctx.fill(TREES.hillR); } });
  drawBuilding(lt, cr);
  drawLot(lt, cr);
  mist(lt, cr, PAR.hill, BBASE - 70, BBASE + 130, .5 * (1 - easeIO(seg(lt, 1.0, 3.4))) + .06, 16);
  drawForeground(lt, cr);
  // warm motes of dust drifting up in the new light
  const da = seg(lt, 1.6, 2.8);
  if (da > 0) V2.dust(0, 700, W, 1750, lt, { n: 46, alpha: .5 * da, size: 3.2, speed: 7, color: '255,226,160' });
  drawLightFx(lt, cr);
  drawBokeh(lt);
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
    const p2 = phase2(lt), pulse = lt >= CREST ? ring(lt, CREST, .075) : 0, fin = lt < .2 ? 1 - lt / .2 : 0;
    return { bloom: .5 + .3 * p2 + .6 * pulse, vignette: .5, grain: .055, contrast: .14, sat: .05 + .06 * p2, aberr: 5 * pulse, tint: [['#ff9a60', .1 * p2, 'soft-light'], ['#3050a0', .1 * (1 - phase1(lt)), 'soft-light']], fade: fin, fadeColor: '2,4,14' };
  },
  blur: lt => (lt < .2 || lt > 4.7) ? 1 : 2,
  over() {},
};
window.__EP14_SCENES.title = TITLE;

// ------------------------------------------------------------------ the lettering: laid out by UI.stack (centred on x 540), then drawn item by item so each one lands on its own beat
const DING = 2.7;     // textding
const T_ITEMS = [
  { t: 'SHIFT HAPPENS', font: 'Bangers', size: 132, fill: YEL, stroke: INKC, lw: 22, spacing: 6, shadow: 22, gap: 44 },
  { pill: 'EPISODE 14', font: 'Bangers', size: 58, spacing: 6, bg: RED, ink: CREAM, stroke: INKC, lw: 7, h: 88, gap: 48 },
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
      const e = easeBack(k), sy = Math.max(.05, e), cy = b.base;
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

// ============================================================================ end: the specimen wall
/* A museum gallery wall (warm plaster between a forest-green frieze and a wainscot) hung with six glass-front shadow boxes in a 3 x 2 grid. The wall, the boxes and their brass plates are drawn in the
 * world; the lettering is drawn in over() under the same camera, so the slow push-in carries everything together (nothing drifts against anything else). Layout numbers are on the 8 px grid.
 *   columns: UI.rowX(3, 48, 1032, { w: 312 })  -> x 48, 384, 720 (gap 24), centres 204, 540, 876
 *   frieze 0..440 (the lettering stack, the clock and the Moon window), picture rail 432..448, boxes 472..800 and 984..1312 (312 x 328), brass plates 136 high 16 below each box,
 *   chair rail 1488..1504, wainscot below it (the gag line, the notice, the teaser) */
const E_W = 312, E_BOX_H = 328, E_PLATE_H = 136, E_PLATE_GAP = 16, E_ROW_Y = [472, 984], E_X0 = 48, E_X1 = 1032;
const E_RAIL_Y = 432, E_CHAIR_Y = 1488, E_FRIEZE = 440;
const E_FRAME = 14, E_LEDGE = 24;      // the frame of a box (px), the height of the ledge the specimen stands on
let E_CELLS = null;
function eCells() {
  if (E_CELLS) return E_CELLS;
  const xs = UI.rowX(3, E_X0, E_X1, { w: E_W });
  E_CELLS = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) E_CELLS.push({ i: r * 3 + c, c, r, x: xs[c], y: E_ROW_Y[r], w: E_W, h: E_BOX_H, py: E_ROW_Y[r] + E_BOX_H + E_PLATE_GAP, cx: xs[c] + E_W / 2 });
  return E_CELLS;
}
/* the six specimens: name, Latin name, role (the species labels of CONTEXT14), the order they take their break in (the Strawberry is the last, on the downbeat) */
const SPEC = [
  { id: 'straw', name: 'STRAWBERRY', latin: 'Fragaria per diem', role: 'UNSCHEDULED', order: 5 },
  { id: 'lemon', name: 'LEMON', latin: 'Citrus limon', role: 'CHARGE NURSE', order: 0 },
  { id: 'mango', name: 'MANGO', latin: 'Mangifera indica', role: 'CNA', order: 1 },
  { id: 'clem', name: 'CLEMENTINE', latin: 'Citrus clementina', role: 'NEW HIRE', order: 2 },
  { id: 'star', name: 'MR. STATEMAN', latin: 'Averrhoa carambola', role: 'STATE SURVEYOR', order: 4 },
  { id: 'kum', name: 'THE KUMQUAT', latin: 'Citrus japonica', role: 'TRAINEE', order: 3 },
];
/* the counter: six ticks, one break each, the last on the sting's downbeat (theme7 lands 2.2 s after its cue at 0.1) */
const E_TICKS = [1.00, 1.32, 1.62, 1.88, 2.10, 2.30];
const E_BOOM = 2.30;
/* the three spots on the ceiling track come on one after another, each with a little stutter */
const E_SPOT_T = [.14, .24, .34];
const spotOn = (lt, t0) => lt < t0 ? 0 : lt < t0 + .05 ? 1 : lt < t0 + .09 ? .12 : lt < t0 + .15 ? 1 : lt < t0 + .19 ? .4 : 1;

// ------------------------------------------------------------------ the wall: painted once, flat art only (no text is ever painted into a cache)
let E_WALL = null;
function paintWall(g) {
  const R = V2.rng(14);
  // plaster
  g.fillStyle = V2.grad(0, E_FRIEZE, 0, E_CHAIR_Y, [[0, '#e0cfac'], [.5, '#d4c096'], [1, '#c6ae84']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 320; i++) {
    const x = R() * W, y = R() * E_CHAIR_Y, r = 36 + R() * 190, light = R() > .5;
    g.fillStyle = V2.radial(x, y, 0, r, [[0, light ? `rgba(255,246,222,${.03 + R() * .05})` : `rgba(110,84,48,${.03 + R() * .05})`], [1, 'rgba(0,0,0,0)']]); g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  for (let i = 0; i < 5200; i++) { g.fillStyle = R() > .5 ? 'rgba(255,250,235,.05)' : 'rgba(80,58,32,.06)'; g.fillRect(R() * W, R() * E_CHAIR_Y, 1 + R() * 2, 1 + R() * 2); }
  // the frieze: forest green paint with a hair of mottling
  g.fillStyle = V2.grad(0, 0, 0, E_FRIEZE, [[0, '#183024'], [.45, '#2a4a36'], [1, '#27462f']]); g.fillRect(0, 0, W, E_FRIEZE);
  for (let i = 0; i < 120; i++) { const x = R() * W, y = R() * E_FRIEZE, r = 40 + R() * 120; g.fillStyle = V2.radial(x, y, 0, r, [[0, R() > .5 ? 'rgba(160,210,170,.045)' : 'rgba(0,20,8,.06)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  // the cornice under the ceiling
  g.fillStyle = V2.grad(0, 0, 0, 44, [[0, '#efe2c4'], [.55, '#d8c8a2'], [1, '#a89572']]); g.fillRect(0, 0, W, 44);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 44, W, 6); g.fillStyle = 'rgba(255,248,226,.5)'; g.fillRect(0, 3, W, 2);
  // the picture rail: a walnut moulding with a highlight on its top edge and a shadow under it
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, E_RAIL_Y + 16, W, 10);
  g.fillStyle = V2.grad(0, E_RAIL_Y, 0, E_RAIL_Y + 16, [[0, '#8a6038'], [.4, '#5a3c22'], [1, '#3a2514']]); g.fillRect(0, E_RAIL_Y, W, 16);
  g.fillStyle = 'rgba(255,214,160,.55)'; g.fillRect(0, E_RAIL_Y, W, 2);
  // the chair rail and the plain wainscot under it (the gag line and the teaser sit on it, so it carries no panels)
  g.fillStyle = V2.grad(0, E_CHAIR_Y, 0, H, [[0, '#2c5240'], [1, '#1b3527']]); g.fillRect(0, E_CHAIR_Y, W, H - E_CHAIR_Y);
  g.fillStyle = 'rgba(170,220,180,.14)'; g.fillRect(0, E_CHAIR_Y + 30, W, 3); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, E_CHAIR_Y + 33, W, 3);   /* a bead under the rail; nothing else behind the lettering */
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, E_CHAIR_Y + 16, W, 8);
  g.fillStyle = V2.grad(0, E_CHAIR_Y, 0, E_CHAIR_Y + 16, [[0, '#8a6038'], [.4, '#5a3c22'], [1, '#3a2514']]); g.fillRect(0, E_CHAIR_Y, W, 16);
  g.fillStyle = 'rgba(255,214,160,.55)'; g.fillRect(0, E_CHAIR_Y, W, 2);
}
let E_POOLS = null;
function buildEndWall() {
  const lit = mkCv(W, H), dark = mkCv(W, H);
  intoCv(lit, paintWall);
  intoCv(dark, g => { g.drawImage(lit, 0, 0); g.fillStyle = 'rgba(8,6,12,.76)'; g.fillRect(0, 0, W, H); });
  E_WALL = { lit, dark, on: null };
  // one pool of light per spot: the lit wall seen through a tall soft ellipse under its can
  E_POOLS = [204, 540, 876].map(cx => {
    const cv = mkCv(W, H);
    intoCv(cv, g => {
      g.drawImage(lit, 0, 0); g.globalCompositeOperation = 'destination-in';
      g.save(); g.translate(cx, 560); g.scale(1, 1150 / 330);
      g.fillStyle = V2.radial(0, 0, 0, 330, [[0, 'rgba(0,0,0,1)'], [.55, 'rgba(0,0,0,.92)'], [.82, 'rgba(0,0,0,.4)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-330, -330, 660, 660);
      g.restore();
    });
    return cv;
  });
}
function drawEndWall(lt) {
  if (!E_WALL) buildEndWall();
  if (lt > E_SPOT_T[2] + .2) {    /* all three spots are steady: the wall as they light it, composed once */
    if (!E_WALL.on) { const cv = mkCv(W, H); intoCv(cv, g => { g.drawImage(E_WALL.dark, 0, 0); for (const p of E_POOLS) g.drawImage(p, 0, 0); }); E_WALL.on = cv; }
    ctx.drawImage(E_WALL.on, 0, 0);
    return;
  }
  ctx.drawImage(E_WALL.dark, 0, 0);
  E_POOLS.forEach((p, i) => { const a = spotOn(lt, E_SPOT_T[i]); if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.drawImage(p, 0, 0); ctx.restore(); } });
}
/* the ceiling track with its three spots, the haze in their beams, and dust turning in the light */
function drawSpots(lt) {
  ctx.fillStyle = '#17120e'; ctx.fillRect(0, 0, W, 22);
  ctx.fillStyle = 'rgba(255,230,190,.14)'; ctx.fillRect(0, 2, W, 2);
  [204, 540, 876].forEach((cx, i) => {
    const a = spotOn(lt, E_SPOT_T[i]);
    // the can: a stem from the track, a barrel and the lens
    ctx.fillStyle = '#0e0b09'; ctx.fillRect(cx - 4, 20, 8, 22);
    ctx.fillStyle = V2.grad(cx - 30, 0, cx + 30, 0, [[0, '#2a2420'], [.35, '#6a5c50'], [.6, '#3a312a'], [1, '#161210']]);
    rr(cx - 30, 40, 60, 40, 8); ctx.fill();
    ctx.strokeStyle = '#0a0806'; ctx.lineWidth = 3; rr(cx - 30, 40, 60, 40, 8); ctx.stroke();
    ctx.fillStyle = a > 0 ? `rgba(255,246,214,${.35 + .65 * a})` : '#2a2420'; ell(cx, 80, 24, 7); ctx.fill();
    ctx.strokeStyle = '#0a0806'; ctx.lineWidth = 3; ell(cx, 80, 24, 7); ctx.stroke();
    if (a > 0) {
      V2.glow(cx, 82, 90, '255,236,190', .55 * a, 'screen', .5);
      V2.beam(cx, 84, cx, E_CHAIR_Y - 6, 44, 400, '255,238,200', .1 * a, 'screen');
    }
  });
}
function drawDust(lt) {
  [204, 540, 876].forEach((cx, i) => { const a = spotOn(lt, E_SPOT_T[i]); if (a > .3) V2.dust(cx - 150, 90, cx + 150, E_CHAIR_Y - 20, lt, { n: 12, seed: 3 + i, alpha: .5 * a, size: 2.6, speed: 6, color: '255,240,212' }); });
}

// ------------------------------------------------------------------ the two round windows that flank the lettering: a clock (it is eleven, the shift is over) and the Moon, awake
const E_WIN_R = 64;
function brassRing(cx, cy, r, ri) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  ctx.fillStyle = V2.grad(cx - r, cy - r, cx + r, cy + r, [[0, '#f3dc94'], [.5, '#b98d36'], [1, '#6f4f16']]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,26,6,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,190,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r - 4, PI * .95, PI * 1.6); ctx.stroke();
  ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.arc(cx, cy, ri + 2, 0, TAU); ctx.fill();
}
function glassGlint(cx, cy, r) {
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
  ctx.fillStyle = V2.grad(cx - r, cy - r, cx + r * .2, cy + r * .6, [[0, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']]);
  ctx.beginPath(); ctx.moveTo(cx - r, cy - r * .1); ctx.quadraticCurveTo(cx - r * .2, cy - r * 1.1, cx + r * .7, cy - r); ctx.lineTo(cx + r * .2, cy - r * .2); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawClockWindow(cx, cy, lt) {
  const r = E_WIN_R, ri = r - 9;
  brassRing(cx, cy, r, ri);
  ctx.fillStyle = V2.radial(cx - 12, cy - 14, 4, ri, [[0, '#fffaf0'], [1, '#e3d7b8']]); ctx.beginPath(); ctx.arc(cx, cy, ri, 0, TAU); ctx.fill();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - PI / 2, l = i % 3 ? 6 : 11; ctx.strokeStyle = '#2a2014'; ctx.lineWidth = i % 3 ? 2.4 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (ri - 4), cy + Math.sin(a) * (ri - 4)); ctx.lineTo(cx + Math.cos(a) * (ri - 4 - l), cy + Math.sin(a) * (ri - 4 - l)); ctx.stroke(); }
  const hand = (a, len, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 7, cy - Math.sin(a) * 7); ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke(); };
  const sec = Math.floor(lt) % 60, tk = easeOut(seg(lt % 1, 0, .12));
  hand((11 / 12) * TAU - PI / 2, ri * .5, 5, '#2a2014');      // eleven o'clock: the end of the 3 to 11
  hand(-PI / 2, ri * .76, 3.6, '#2a2014');
  hand(((sec + tk) / 60) * TAU - PI / 2, ri * .82, 2, RED);
  ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx, cy, 4.4, 0, TAU); ctx.fill();
  glassGlint(cx, cy, ri);
}
function drawMoonWindow(cx, cy, lt) {
  const r = E_WIN_R, ri = r - 9;
  brassRing(cx, cy, r, ri);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, ri, 0, TAU); ctx.clip();
  ctx.fillStyle = V2.grad(0, cy - ri, 0, cy + ri, [[0, '#0b0f33'], [1, '#2c2b6c']]); ctx.fillRect(cx - ri, cy - ri, 2 * ri, 2 * ri);
  for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(255,250,230,${.25 + .6 * hash(i + 4) * (.5 + .5 * Math.sin(lt * 2 + i))})`; ctx.beginPath(); ctx.arc(cx - ri + hash(i) * 2 * ri, cy - ri + hash(i + 40) * 2 * ri, 1 + hash(i + 9) * 1.5, 0, TAU); ctx.fill(); }
  A7.moon(cx, cy + 2, .33, { t: lt, suppress: true, halo: false, char: { expr: lt % 5 > 3.6 ? 'smug' : 'neutral', lid: .15, look: [-.5, .55 + .1 * Math.sin(lt * .8)] } });
  ctx.restore();
  glassGlint(cx, cy, ri);
  V2.emit(cx, cy, 120, '205,222,255', .2);
}

// ------------------------------------------------------------------ the shadow boxes
let E_ART = null;
function buildBoxArt() {
  const fw = E_W, fh = E_BOX_H, M = 60;
  const frame = mkCv(fw, fh), shadow = mkCv(fw + 2 * M, fh + 2 * M), linen = mkCv(64, 64);
  intoCv(frame, g => {
    g.fillStyle = V2.grad(0, 0, fw, fh, [[0, '#86593a'], [.45, '#56391f'], [1, '#33200f']]); rr(0, 0, fw, fh, 8); g.fill();
    const R = V2.rng(9);
    for (let i = 0; i < 60; i++) { g.strokeStyle = R() > .5 ? 'rgba(255,214,160,.07)' : 'rgba(20,10,2,.12)'; g.lineWidth = .8 + R() * 1.4; const y = R() * fh; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(fw * .3, y + (R() - .5) * 6, fw * .7, y + (R() - .5) * 6, fw, y + (R() - .5) * 4); g.stroke(); }
    g.strokeStyle = 'rgba(255,226,180,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(3, fh - 8); g.lineTo(3, 8); g.quadraticCurveTo(3, 3, 8, 3); g.lineTo(fw - 8, 3); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(fw - 3, 8); g.lineTo(fw - 3, fh - 8); g.quadraticCurveTo(fw - 3, fh - 3, fw - 8, fh - 3); g.lineTo(8, fh - 3); g.stroke();
    g.globalCompositeOperation = 'destination-out'; rr(E_FRAME, E_FRAME, fw - 2 * E_FRAME, fh - 2 * E_FRAME, 3); g.fill(); g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = 3; rr(E_FRAME, E_FRAME, fw - 2 * E_FRAME, fh - 2 * E_FRAME, 3); g.stroke();
    g.strokeStyle = 'rgba(255,214,160,.3)'; g.lineWidth = 1.6; rr(E_FRAME - 3, E_FRAME - 3, fw - 2 * E_FRAME + 6, fh - 2 * E_FRAME + 6, 4); g.stroke();
  });
  intoCv(shadow, g => { g.filter = 'blur(14px)'; g.fillStyle = 'rgba(0,0,0,.6)'; rr(M, M, fw, fh, 8); g.fill(); });
  intoCv(linen, g => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 64; i += 4) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(i, 0, 1.6, 64); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, i + 1, 64, 1.6); }
  });
  E_ART = { frame, shadow, M, linen, pat: null };
}
/* the soft shadow a specimen throws on the linen behind it: its own silhouette, blurred (built once; a static pose, no text, flat) */
let E_SH = null;
function charTo(cv, ox, oy, o) {   /* copied from ep13_title.js (private there): a character drawn into a cache whose pixel (ox, oy) is where its feet are */
  intoCv(cv, g => { REG.suppress++; try { g.translate(ox, oy); drawChar(Object.assign({}, o, { x: 0, y: 0, noShadow: true, noReflect: true, transit: false })); } finally { REG.suppress--; } });
}
function buildSpecShadows() {
  const SW = 360, SH = 400, FX = SW / 2, FY = SH - 40;
  E_SH = SPEC.map(sp => {
    const cv = mkCv(SW, SH), o = specBase(sp, 0, { s: E_S[sp.id], t: 2 });
    o.arms = { l: 'rest', r: 'rest' }; o.hold = {}; o.grip = {}; o.expr = 'neutral'; o.look = [0, 0];
    charTo(cv, FX, FY, o);
    intoCv(cv, g => { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#04100a'; g.fillRect(0, 0, SW, SH); });
    const out = mkCv(SW, SH);
    intoCv(out, g => { g.filter = 'blur(6px)'; g.drawImage(cv, 0, 0); });
    return { cv: out, fx: FX, fy: FY };
  });
}

// ------------------------------------------------------------------ the specimens: a coffee mug each (the break they take), and what each one is doing in its box
Object.assign(PROP_BOX, { fp14a_mug: Object.assign([-30, -70, 44, 6], { nearFace: true }) });
EXT.prop.fp14a_mug = (side, o, t) => {   /* a white mug with a slate band, handle outward, steam rising clear of the face; o.mugK pops it in, o.steam 1 = idle, 2 = a sip */
  const k = o.mugK ?? 1;
  if (k <= .01) return;
  ctx.scale(k, k);
  ctx.fillStyle = '#fbf7ec'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(-26, -54, 52, 56, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(28, -26, 11, -PI / 2, PI / 2); ctx.stroke();
  ctx.fillStyle = SLATE; ctx.fillRect(-23, -30, 46, 9);
  ctx.fillStyle = '#5a3210'; ell(0, -50, 22, 5); ctx.fill();
  const st = o.steam ?? 1;
  ctx.strokeStyle = `rgba(255,255,255,${.55 + .15 * st})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const dx of [-8, 8]) { ctx.beginPath(); ctx.moveTo(dx, -60); ctx.quadraticCurveTo(dx + 7 * Math.sin(t * 3 + dx), -70 - 6 * st, dx, -80 - 10 * st); ctx.stroke(); }
};
const E_S = { straw: .6, lemon: .62, mango: .62, clem: .62, star: .62, kum: .56 };
/* where the right hand holds the mug, in the body's own units (x out from the middle, y down from its centre) */
const MUG_AT = { straw: [82, 52], lemon: [78, 48], mango: [80, 48], clem: [74, 44], star: [104, 54], kum: [46, 34] };
function specBase(sp, lt, extra) {
  const ctor = { straw: window.A11.straw, lemon: A7.lemon, mango: A7.mango, clem: window.A10.clem, star: window.A14 && A14.stateman, kum: window.A14 && A14.kumquat }[sp.id];
  const r = ctor ? ctor(sp.id === 'star' ? { pose: 'free' } : sp.id === 'kum' ? { pose: 'side' } : {}) : { kind: 'cran', id: sp.id };
  return Object.assign(r, extra);
}
const sipPulse = (lt, tick) => { const u = lt - tick - .9; if (u < 0) return 0; const c = ((u % 3.2) + 3.2) % 3.2; return Math.sin(PI * seg(c, 0, .85)); };
function specOpts(sp, idx, lt) {
  const tick = E_TICKS[sp.order], since = lt - tick, got = since >= 0, mk = got ? easeBack(seg(since, 0, .28)) : 0, sip = sipPulse(lt, tick);
  const o = specBase(sp, lt, { s: E_S[sp.id], t: lt * .9 + idx * 1.7 });
  const at = MUG_AT[sp.id], low = [at[0] + 14, at[1] + 40], lift = got ? lerp(0, 1, clamp(mk)) : 0;
  const grip = [lerp(low[0], at[0], lift) - 16 * sip, lerp(low[1], at[1], lift) - 38 * sip];
  const look = [.5 * Math.sin(lt * .8 + idx * 2.1), .18 * Math.sin(lt * .6 + idx)];
  o.look = look;
  o.arms = Object.assign({}, o.arms, { r: got ? 'hold' : 'rest' });
  o.grip = Object.assign({}, o.grip, got ? { r: grip } : {});
  o.hold = Object.assign({}, o.hold, got ? { r: 'fp14a_mug' } : {});
  o.mugK = mk; o.steam = 1 + sip + (sp.id === 'straw' && lt >= E_BOOM ? 1.2 * Math.exp(-(lt - E_BOOM) / .7) : 0);
  o.rot = (o.rot || 0) - .03 * sip;
  switch (sp.id) {
    case 'straw':   /* tired, hand on her hip; the break is her last, on the downbeat: her eyes close and she lets her breath out */
      o.arms.l = 'hips'; o.expr = got ? 'chill' : 'dead'; o.lid = got ? Math.max(.45, .5 + .4 * sip + .35 * seg(since, 0, .5)) : .5;
      break;
    case 'lemon':   /* one hand on the hip, the other on the mug; one dry look */
      o.arms.l = 'hips'; o.expr = got ? 'smug' : 'neutral'; o.look = [.3 + .25 * Math.sin(lt * .5), -.05];
      break;
    case 'mango':   /* a friendly wave at the camera with the free hand */
      o.arms.l = lt > 1.2 ? 'wave' : 'rest'; o.expr = 'happy'; o.look = [-.1, .05];
      break;
    case 'clem':    /* thumbs up: Sure! */
      o.arms.l = lt > .9 ? 'thumb' : 'rest'; o.expr = got ? 'happy' : 'hopeful'; o.sparkle = got; o.look = [.15, -.05];
      { const u = (((lt - 3.4) % 1.7) + 1.7) % 1.7 / .42; if (lt > 3.4 && u < 1) { o.lift = 12 * Math.sin(u * PI); o.squash = (o.squash || 0) - .05 * Math.sin(u * PI); } }   /* an eager little hop every so often */
      break;
    case 'star': {  /* the clipboard on the left forearm; one eyebrow goes up now and then; "Noted." once */
      const brow = Math.max(seg(lt, 3.9, 4.15) * (1 - seg(lt, 4.9, 5.2)), seg(lt, 6.3, 6.5) * (1 - seg(lt, 7.0, 7.3)));
      o.arms.l = 'hold'; o.hold.l = 'fp14_clip'; o.grip.l = [-72, 72]; o.clipAt = [.2, .1]; o.clipRot = -.1; o.clipScale = 1;
      o.brow = brow; o.noted = seg(lt, 5.4, 6.3); o.clipPage = .35 + .5 * seg(lt, 2.8, 6.5);
      o.look = [.35 * Math.sin(lt * .5), .1];
      break; }
    case 'kum': {   /* checks his clipboard, then the mug, and wonders whether the mug is a tag */
      const down = Math.max(seg(lt, 3.3, 3.6) * (1 - seg(lt, 4.3, 4.6)), seg(lt, 5.8, 6.1) * (1 - seg(lt, 6.8, 7.1)));
      o.grip.l = [-118, 38]; o.look = [lerp(look[0], -.7, down), lerp(look[1], .7, down)]; o.expr = down > .5 ? 'kum_puzzled' : 'kum_eager';
      break; }
  }
  return o;
}

// ------------------------------------------------------------------ one box: frame, linen, ledge, the specimen, the glass
function starGlint(x, y, a, r) {
  if (a <= .01) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = V2.radial(x, y, 0, r * .6, [[0, `rgba(255,255,255,${.95 * a})`], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.arc(x, y, r * .6, 0, TAU); ctx.fill();
  for (const [dx, dy, L] of [[1, 0, 1], [0, 1, .7]]) {
    const g = ctx.createLinearGradient(x - dx * r * L, y - dy * r * L, x + dx * r * L, y + dy * r * L);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${.9 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - dx * r * L, y - dy * r * L); ctx.lineTo(x + dy * 2.4, y + dx * 2.4); ctx.lineTo(x + dx * r * L, y + dy * r * L); ctx.lineTo(x - dy * 2.4, y - dx * 2.4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
/* a visitor's flash every second or so, bounced off the glass of a different box each time (always inside the glass, never near the lettering) */
const E_FLASHES = Array.from({ length: 6 }, (_, k) => ({ t: 1.3 + k * 1.02, box: [3, 1, 5, 0, 4, 2][k], left: k % 2 === 0, dy: 60 + hash(k * 5.7) * 110 }));
/* the relief of the last break of the count (the downbeat): warm little sparkles rise round everyone, and most of all round the Strawberry */
function reliefSparkles(ox, oy, ow, ledge, lt, n) {
  const u0 = lt - E_BOOM;
  if (u0 < 0 || u0 > 1.8) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const u = u0 - i * .07; if (u < 0 || u > 1.2) continue;
    const x = ox + ow / 2 + (hash(i * 3.3 + 1) - .5) * 190, y = ledge - 70 - 150 * easeOut(u / 1.2) - hash(i * 7.1) * 60, a = Math.sin(clamp(u / 1.2) * PI), r = 5 + hash(i * 5.9) * 6;
    ctx.fillStyle = `rgba(255,236,170,${.9 * a})`; ctx.beginPath();
    for (let j = 0; j < 8; j++) { const an = j * PI / 4, rr2 = j % 2 ? r * .32 : r; ctx.lineTo(x + Math.cos(an) * rr2, y + Math.sin(an) * rr2); }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawGlass(cell, lt, i) {
  const ox = cell.x + E_FRAME, oy = cell.y + E_FRAME, ow = cell.w - 2 * E_FRAME, oh = cell.h - 2 * E_FRAME;
  ctx.save(); rr(ox, oy, ow, oh, 3); ctx.clip();
  // the frame's own shadow falls inside the box, from the top and the left; a little bounce comes back at the right and the bottom
  let g = ctx.createLinearGradient(0, oy, 0, oy + 44); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(ox, oy, ow, 44);
  g = ctx.createLinearGradient(ox, 0, ox + 30, 0); g.addColorStop(0, 'rgba(0,0,0,.34)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(ox, oy, 30, oh);
  g = ctx.createLinearGradient(ox + ow, 0, ox + ow - 14, 0); g.addColorStop(0, 'rgba(255,240,200,.12)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(ox + ow - 14, oy, 14, oh);
  // the glass: a veil, two diagonal streaks, and a bright band that crosses it now and then
  ctx.globalCompositeOperation = 'screen';
  g = ctx.createLinearGradient(ox, oy, ox + ow * .8, oy + oh * .6); g.addColorStop(0, 'rgba(255,255,255,.085)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(ox, oy, ow, oh);
  const sx = ox + 52 + (i % 3) * 14;
  for (const [off, wd, a] of [[0, 34, .07], [58, 12, .06]]) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.moveTo(sx + off, oy); ctx.lineTo(sx + off + wd, oy); ctx.lineTo(sx + off + wd - 150, oy + oh); ctx.lineTo(sx + off - 150, oy + oh); ctx.closePath(); ctx.fill(); }
  const u = (((lt - 1.0 - i * .37) % 3.6) + 3.6) % 3.6 / .75;
  if (lt > 1.0 && u > 0 && u < 1) {
    const bx = ox - 70 + (ow + 160) * easeIO(u), a = .26 * Math.sin(u * PI);
    g = ctx.createLinearGradient(bx - 40, 0, bx + 40, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 40, oy); ctx.lineTo(bx + 40, oy); ctx.lineTo(bx - 20, oy + oh); ctx.lineTo(bx - 100, oy + oh); ctx.closePath(); ctx.fill();
  }
  // camera flashes bounced off the glass, and the glint of the sting's downbeat on every box
  for (const f of E_FLASHES) if (f.box === i) starGlint(f.left ? ox + 46 : ox + ow - 46, oy + f.dy, Math.max(0, 1 - Math.abs(lt - f.t) / .13), 52);
  starGlint(ox + 52, oy + 56, Math.max(0, 1 - Math.abs(lt - (E_BOOM + .02 * i)) / .16), 70);
  ctx.restore();
}
function drawBox(cell, sp, lt) {
  if (!E_ART) buildBoxArt();
  if (!E_SH) buildSpecShadows();
  const i = cell.i, x = cell.x, y = cell.y, ox = x + E_FRAME, oy = y + E_FRAME, ow = cell.w - 2 * E_FRAME, oh = cell.h - 2 * E_FRAME, ledge = oy + oh - E_LEDGE;
  ctx.drawImage(E_ART.shadow, x - E_ART.M + 8, y - E_ART.M + 14);                      // the box's shadow on the wall (the spot is above and a little to the left)
  // how it hangs: the top row from the picture rail by two brass chains, the bottom row by a V of wire from a nail
  ctx.save(); ctx.lineCap = 'round';
  if (cell.r === 0) {
    ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
    for (const cx of [x + 44, x + cell.w - 44]) { ctx.beginPath(); ctx.moveTo(cx, E_RAIL_Y + 14); ctx.lineTo(cx, y + 4); ctx.stroke(); }
    ctx.setLineDash([]); ctx.fillStyle = '#d9b45a';
    for (const cx of [x + 44, x + cell.w - 44]) { ctx.beginPath(); ctx.arc(cx, E_RAIL_Y + 15, 5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(cx, y + 5, 4, 0, TAU); ctx.fill(); }
  } else {
    const nx = x + cell.w / 2, ny = y - 22;
    ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 44, y + 4); ctx.lineTo(nx, ny); ctx.lineTo(x + cell.w - 44, y + 4); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(nx + 2, ny + 3, 5.5, 0, TAU); ctx.fill();
    ctx.fillStyle = V2.radial(nx - 1.5, ny - 1.5, 0, 6, [[0, '#fff3c0'], [1, '#8a6a22']]); ctx.beginPath(); ctx.arc(nx, ny, 5.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d9b45a'; for (const cx of [x + 44, x + cell.w - 44]) { ctx.beginPath(); ctx.arc(cx, y + 5, 4, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  // the inside: linen with the spot's pool on it, a ledge to stand on, brass pins
  ctx.save(); rr(ox, oy, ow, oh, 3); ctx.clip();
  ctx.fillStyle = V2.grad(0, oy, 0, oy + oh, [[0, '#3a6444'], [.55, '#2a4c37'], [1, '#1e3b2b']]); ctx.fillRect(ox, oy, ow, oh);
  if (!E_ART.pat) E_ART.pat = ctx.createPattern(E_ART.linen, 'repeat');
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .55; ctx.fillStyle = E_ART.pat; ctx.fillRect(ox, oy, ow, oh); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(ox + ow / 2, oy + 20, 10, ow * .85, [[0, 'rgba(255,236,190,.26)'], [1, 'rgba(255,236,190,0)']]); ctx.fillRect(ox, oy, ow, oh); ctx.restore();
  for (const [px, py] of [[ox + 18, oy + 18], [ox + ow - 18, oy + 18], [ox + 18, ledge - 16], [ox + ow - 18, ledge - 16]]) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(px + 2, py + 3, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = V2.radial(px - 1.5, py - 1.5, 0, 6, [[0, '#fff3c0'], [1, '#a47a2a']]); ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill();
  }
  // the specimen: it drops into place and settles (squash, then a breath), lit from above by the spot
  const o = specOpts(sp, i, lt), tIn = .42 + i * .07, k = easeBack(seg(lt, tIn, tIn + .34)), land = seg(lt, tIn + .2, tIn + .34);
  if (k > .005) {
    const sh = E_SH[i];
    ctx.save(); ctx.globalAlpha = .5 * clamp(k); ctx.drawImage(sh.cv, ox + ow / 2 - sh.fx + 11, ledge + 1 - sh.fy + 5); ctx.restore();
  }
  // the ledge
  ctx.fillStyle = V2.grad(0, ledge, 0, oy + oh, [[0, '#a87a48'], [.12, '#7e5530'], [1, '#4c3219']]); ctx.fillRect(ox, ledge, ow, E_LEDGE);
  ctx.fillStyle = 'rgba(255,226,180,.55)'; ctx.fillRect(ox, ledge, ow, 2.4); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(ox, ledge + 6, ow, 2);
  if (k > .005) {
    V2.setLight({ key: [0, -.9], keyColor: '#fff2d2', keyA: .32, rim: '#ffd9a0', rimA: .3, shadow: '#1a1210', shadowA: .38, amb: '#d8c8a8', ambA: .08, bounce: '#7ab08a', bounceA: .14 });
    V2.opts.reflect = false;
    o.x = ox + ow / 2; o.y = ledge + 1 - 26 * (1 - clamp(k)); o.s = E_S[sp.id] * Math.min(1.04, Math.max(.02, k));      /* the drop-in overshoots by 4% at most, so the tallest (the Strawberry in her cap) never touches the top of the frame */
    o.squash = (o.squash || 0) + .1 * Math.sin(land * PI) * (land < 1 ? 1 : 0); o.plant = true;
    if (k < .98) o.alpha = clamp(k * 3);
    drawChar(o);
    // a little dust off the ledge as it lands
    const pu = (lt - (tIn + .26)) / .5;
    if (pu > 0 && pu < 1) for (let j = 0; j < 6; j++) { const d = (j % 2 ? 1 : -1) * (18 + 26 * Math.floor(j / 2)) * easeOut(pu); ctx.fillStyle = `rgba(236,222,196,${.42 * (1 - pu)})`; ctx.beginPath(); ctx.arc(o.x + d, ledge - 4 - 12 * pu, 7 + 12 * pu, 0, TAU); ctx.fill(); }
  }
  reliefSparkles(ox, oy, ow, ledge, lt, sp.id === 'straw' ? 10 : 4); if (sp.id === 'straw' && lt > E_BOOM) { const gp = Math.exp(-(lt - E_BOOM) / .5); ctx.fillStyle = V2.radial(ox + ow / 2, oy + oh * .55, 10, ow * .8, [[0, `rgba(255,226,150,${.28 * gp})`], [1, 'rgba(255,226,150,0)']]); ctx.globalCompositeOperation = 'screen'; ctx.fillRect(ox, oy, ow, oh); }
  ctx.restore();
  // the frame over it all, then the glass
  ctx.drawImage(E_ART.frame, x, y);
  drawGlass(cell, lt, i);
}
// ------------------------------------------------------------------ the plates
function drawPlate(cell, sp, lt) {
  const on = spotOn(lt, E_SPOT_T[cell.c]);
  if (on <= 0) return;
  ctx.save(); ctx.globalAlpha = on < 1 ? on * .85 : 1;
  UI.sign([cell.x, cell.py, E_W, E_PLATE_H], [
    { t: sp.name, font: 'Bangers', size: 38, spacing: 2, weight: 400 },
    { t: sp.latin, italic: true, weight: 700, size: 30 },
    { t: sp.role, weight: 900, size: 30, spacing: 1 },
  ], { fill: ['#ecd088', '#bd9240'], stroke: '#5c4318', lw: 3, r: 7, pad: 12, ink: '#2b1d08', lh: 1.15, id: 'plate-' + sp.id, shadow: 14 });
  // four little screws (they sit in the corners, clear of the lettering)
  for (const [dx, dy] of [[10, 10], [E_W - 10, 10], [10, E_PLATE_H - 10], [E_W - 10, E_PLATE_H - 10]]) {
    ctx.fillStyle = '#7a5a20'; ctx.beginPath(); ctx.arc(cell.x + dx, cell.py + dy, 3.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(30,18,4,.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cell.x + dx - 2.4, cell.py + dy - 1); ctx.lineTo(cell.x + dx + 2.4, cell.py + dy + 1); ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the lettering: a stack in the frieze, the gag line and its notice on the wainscot, the teaser pill. Drawn in over() (crisp, after the grade) under the world's own camera, so it moves with the wall.
const END_ITEMS = [
  { t: 'THANKS FOR WATCHING', size: 38, weight: 900, spacing: 12, fill: CREAM, stroke: INKC, lw: 8, gap: 32 },
  { t: 'SHIFT HAPPENS', font: 'Bangers', size: 104, spacing: 5, fill: YEL, stroke: INKC, lw: 18, shadow: 20, gap: 40 },
  { t: 'THE SURVEY', font: 'Bangers', size: 140, spacing: 5, fill: CREAM, stroke: INKC, lw: 22, shadow: 24 },
];
const END_STACK = { cx: 540, top: 112, maxW: 960 };
let E_LAY = null;
function endLayout() {
  if (E_LAY) return E_LAY;
  ctx.save(); ctx.globalAlpha = 0;
  const r = UI.stack(END_ITEMS, END_STACK);
  ctx.restore();
  E_LAY = { thanks: r.boxes[0][0], shift: r.boxes[1][0], title: r.boxes[2][0], y0: r.y0, y1: r.y1 };
  E_LAY.winY = (E_LAY.shift.y0 + E_LAY.title.y1) / 2;
  return E_LAY;
}
function drawEndWindows(lt) {
  const L = endLayout(), a = easeOut(seg(lt, .3, .8));
  ctx.save(); ctx.globalAlpha = a;
  drawClockWindow(136, UI.snap(L.winY, 8), lt);
  drawMoonWindow(944, UI.snap(L.winY, 8), lt);
  ctx.restore();
}
function endStack(lt) {
  const L = endLayout(), it = END_ITEMS, cyOf = b => (b.y0 + b.y1) / 2;
  { const k = seg(lt, .25, .6), b = L.thanks; if (k > 0) popAbout(b.cx, cyOf(b), 1, 1, 16 * (1 - easeOut(k)), easeOut(k), () => UI.write(it[0].t, b.cx, b.base, Object.assign({}, it[0], { align: 'center', maxW: END_STACK.maxW }))); }
  { const k = seg(lt, .36, .7), sc = lerp(1.3, 1, easeBack(k)), b = L.shift; if (k > 0) popAbout(b.cx, cyOf(b), sc, sc, 0, clamp(k * 4), () => UI.write(it[1].t, b.cx, b.base, Object.assign({}, it[1], { align: 'center', maxW: END_STACK.maxW, fill: vgrad(it[1].size, it[1].font, [[0, '#fff7b0'], [.55, YEL], [1, '#ffb800']]) }))); }
  { const t0 = .62, fall = seg(lt, t0, t0 + .16), b = L.title;
    if (fall > 0) {
      const land = lt - (t0 + .16), spring = lt < t0 + .16 ? 0 : Math.exp(-land / .09) * Math.cos(land * 38);
      const dy = lt < t0 + .16 ? 36 * (1 - easeOut(fall)) : -4 * spring, sy = lt < t0 + .16 ? 1 + .1 * (1 - fall) : 1 - .08 * spring, sx = lt < t0 + .16 ? 1 - .02 * (1 - fall) : 1 + .02 * spring;
      popAbout(b.cx, cyOf(b), Math.min(sx, 1.02), sy, dy, clamp(fall * 5), () => UI.write(it[2].t, b.cx, b.base, Object.assign({}, it[2], { align: 'center', maxW: END_STACK.maxW, fill: vgrad(it[2].size, it[2].font, [[0, '#fffaf0'], [.6, CREAM], [1, '#e2c88e']]) })));
    } }
}

// the gag line: BREAKS TAKEN TODAY: n, counting up one break at a time; the digit lives in a fixed slot so nothing ever moves. The red notice slams on at the downbeat.
const GAG_Y = 1568;
const GAG = { pre: 'BREAKS TAKEN TODAY:', size: 44, weight: 900, spacing: 3, lw: 9, gap: 24, stampGap: 28 };
const NOTICE = { t: 'MANDATORY', size: 48, font: 'Bangers', spacing: 3 };
function gagLine(lt) {
  const k = seg(lt, .3, .62); if (k <= 0) return;
  const st = { size: GAG.size, weight: GAG.weight, spacing: GAG.spacing }, ink = Object.assign({ lw: 0 }, st);
  const wPre = UI.sizeOf(GAG.pre, ink).w, slotW = Math.max(...'0123456789'.split('').map(d => UI.sizeOf(d, ink).w));
  const wNote = UI.sizeOf(NOTICE.t, { font: NOTICE.font, size: NOTICE.size, spacing: NOTICE.spacing }).w + NOTICE.size + 16;       // the stamp's width plus the paper round it
  const total = wPre + GAG.gap + slotW + GAG.stampGap + wNote, x0 = 540 - total / 2;
  const m = UI.metrics('Nunito', GAG.weight), base = GAG_Y + m.cap * GAG.size / 2, sx = x0 + wPre + GAG.gap + slotW / 2, nx = x0 + wPre + GAG.gap + slotW + GAG.stampGap + wNote / 2;
  const opts = Object.assign({ fill: YEL, stroke: INKC, lw: GAG.lw, shadow: 12 }, st);
  const n = E_TICKS.filter(t => lt >= t).length, tl = n ? E_TICKS[n - 1] : 0;
  popAbout(540, GAG_Y, 1, 1, 14 * (1 - easeOut(k)), clamp(k * 3), () => {
    UI.write(GAG.pre, x0, base, Object.assign({ align: 'left' }, opts));
    // the digit: the new one pops in on its tick (the old one is gone that frame), a ring of light round it
    const q = seg(lt, tl, tl + .22), e = easeBack(q);
    popAbout(sx, GAG_Y, lerp(1.35, 1, Math.min(1, e)), lerp(1.35, 1, Math.min(1, e)), 0, 1, () => UI.write(String(n), sx, base, Object.assign({ align: 'center' }, opts)));
  });
  if (n) { const r = seg(lt, tl, tl + .5); if (r > 0 && r < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(255,225,53,${.7 * (1 - r)})`; ctx.lineWidth = 7 * (1 - r) + 1; ctx.beginPath(); ctx.arc(sx, GAG_Y, 26 + 80 * easeOut(r), 0, TAU); ctx.stroke(); ctx.restore(); } }
  // the notice: a paper tag pinned beside the count, and the red stamp that slams onto it with the downbeat
  const tk = seg(lt, E_BOOM - .5, E_BOOM - .2);
  if (tk > 0) {
    ctx.save(); ctx.globalAlpha *= easeOut(tk); const pw = wNote, ph = 82;
    UI.page([nx - pw / 2, GAG_Y - ph / 2, pw, ph], { pitch: 0, fill: '#f5eedb', rot: -.045, shadow: 14, r: 6, id: 'notice', pad: 6 });
    ctx.restore();
    const ss = seg(lt, E_BOOM + .02, E_BOOM + .14);
    if (ss > 0) {
      const sc = lerp(1.12, 1, easeIn(ss)), land = lt - (E_BOOM + .14), sq = lt < E_BOOM + .14 ? 0 : Math.exp(-land / .07) * Math.cos(land * 40);
      popAbout(nx, GAG_Y, sc * (1 + .02 * sq), sc * (1 - .04 * sq), 0, clamp(ss * 4), () => UI.stamp(NOTICE.t, nx, GAG_Y, { font: NOTICE.font, size: NOTICE.size, spacing: NOTICE.spacing, fill: RED, color: RED, rot: -.045, id: 'stamp-mandatory', alpha: .96 }));
    }
  }
}

// the teaser: the same pill as Episode 13's, with a merge sign for the next episode
function mergeIcon(lt) {
  ctx.save();
  ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = INKC; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.save(); ctx.rotate(PI / 4); rr(-48, -48, 96, 96, 12); ctx.fill(); ctx.stroke(); ctx.lineWidth = 2.4; rr(-41, -41, 82, 82, 8); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = INKC; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-9, 32); ctx.lineTo(-9, -22); ctx.stroke();                                   // the lane that carries on
  ctx.beginPath(); ctx.moveTo(19, 32); ctx.lineTo(19, 8); ctx.quadraticCurveTo(19, -4, -2, -12); ctx.stroke();      // the lane that merges into it
  ctx.fillStyle = INKC; ctx.beginPath(); ctx.moveTo(-9, -36); ctx.lineTo(-24, -16); ctx.lineTo(6, -16); ctx.closePath(); ctx.fill();
  ctx.restore();
}
const TEASER = { next: 'NEXT: EPISODE 15', title: 'THE MERGER' };
const TEASER_Y = 1736;
function teaser(lt) {
  const k = seg(lt, 3.4, 3.85); if (k <= 0) return;
  const nx = { size: 32, weight: 900, spacing: 5, fill: '#ffd1e6' }, tt = { size: 84, font: 'Bangers', spacing: 3, fill: '#ffffff', stroke: INKC, lw: 12, gap: 10 };
  const wT = Math.max(UI.sizeOf(TEASER.next, nx).w, UI.sizeOf(TEASER.title, tt).w), padT = 14, boxW = Math.ceil(wT + 2 * padT + 2), IW = 130, GAPI = 32, PADP = 56;
  const pw = UI.snap(PADP * 2 + IW + GAPI + boxW, 2), ph = 168, px = 540 - pw / 2, py = TEASER_Y - ph / 2, s2 = lerp(1.15, 1, easeBack(k));
  popAbout(540, TEASER_Y, s2, s2, 40 * (1 - easeOut(k)), clamp(k * 3), () => {
    UI.panel([px, py, pw, ph], { r: ph / 2, fill: 'rgba(8,10,20,.86)', stroke: '#ffc83d', lw: 4, shadow: 24, id: 'teaser-pill', pad: 20 });
    ctx.save(); ctx.translate(px + PADP + IW / 2, TEASER_Y); mergeIcon(lt); ctx.restore();
    const bx = px + PADP + IW + GAPI;
    UI.sign([bx, py + 18, boxW, ph - 36], [Object.assign({ t: TEASER.next }, nx), Object.assign({ t: TEASER.title }, tt)], { fill: false, pad: 6, id: 'teaser-text', size: 32 });
  });
}
function endText(lt) { endStack(lt); gagLine(lt); teaser(lt); }
/* the lettering is drawn after the grade (so the vignette and the soft light never muddy it) but under the world's own camera, so it stays locked to the wall and the boxes */
function withWorldCam(fn) {
  ctx.save();
  const dx = CAM.shake * vnoise(T * 37), dy = CAM.shake * vnoise(T * 41 + 50);
  ctx.translate(W / 2 + dx, H / 2 + dy); ctx.rotate(CAM.r); ctx.scale(CAM.z, CAM.z); ctx.translate(-CAM.x, -CAM.y);
  fn();
  ctx.restore();
}

// ============================================================================ the scene
function endWorld(lt) {
  ctx.fillStyle = '#050306'; ctx.fillRect(-300, -300, W + 600, H + 600);
  drawEndWall(lt);
  drawSpots(lt);
  drawEndWindows(lt);
  const cells = eCells();
  cells.forEach((cell, i) => drawBox(cell, SPEC[i], lt));
  cells.forEach(c => { const a = spotOn(lt, E_SPOT_T[c.c]); if (a < 1) { ctx.fillStyle = `rgba(6,4,10,${.82 * (1 - a)})`; ctx.fillRect(c.x - 24, c.y - 24, E_W + 48, E_BOX_H + 48); } });
  drawDust(lt);
  cells.forEach((cell, i) => drawPlate(cell, SPEC[i], lt));
}
const END = {
  noChyron: true, noScrim: true,
  cam(lt) {
    zoomAbout(540, 960, 1 + .012 * easeIO(seg(lt, 0, 8)));
    CAM.shake = 5 * ring(lt, E_BOOM, .08) * (lt >= E_BOOM);
  },
  draw: endWorld,
  fx: lt => ({ bloom: .5, vignette: .42, grain: .05, contrast: .12, sat: .05, tint: [['#ffb070', .1, 'soft-light']], fade: lt < .1 ? 1 - lt / .1 : lt > 7.6 ? seg(lt, 7.6, 8) : 0, fadeColor: '6,4,8' }),
  blur: () => 1,
  over(lt) { ctx.save(); ctx.globalAlpha *= 1 - seg(lt, 7.6, 8); withWorldCam(() => endText(lt)); ctx.restore(); },
  label: () => 'THANKS FOR WATCHING',
};
window.__EP14_SCENES.end = END;
})();
