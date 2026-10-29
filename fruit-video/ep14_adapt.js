'use strict';
/* SHIFT HAPPENS, Episode 14: "The Survey". Scene module: adapt (3:04 PM, THE ADAPTATION, 24.4 s). Builder E14-B.
 * Registers window.__EP14_SCENES.adapt and exports the junk catalogue on window.FP14J. Everything is a pure function of the scene time `lt` (no state is carried from frame to frame).
 * Five behaviors of the colony, each with its own shot and its own field-guide tag (BEHAVIOR n OF 5, Latin name; one tag at a time, top right, y 48); the dollhouse is the kit S14 and the people are
 * the cast at the dollhouse scale; everybody who walks or runs goes through S14.walk / S14.run (the footstep tool reads the gait).
 *   A  0.0 to 7.4   CONCEALMENT (n2, m1, c1, pop, l1). Medium shot of the shower closet and room 7, a slow push-in (z 1.86 to 2.04). Three waves of two runners (Mango and Clementine, in file so that no face is ever
 *                   covered) throw six pieces into the doorway (the kit's own stash sprites; the stash level rises 2 to 4, the door bulges); Lemon strolls in after the last wave and watches with her arms folded;
 *                   Mango leans on the door ("Does it close?" 4.17), Clementine shoves ("Sure!" 5.08), the door bursts on the crash cue (5.71: camera shake, flash, ring) and flings both out over Lemon's head
 *                   and out of the left edge (transit); the junk spills; Lemon walks to the door and puts one finger on the knob on "closes", and the junk obeys (the spill runs backwards into the closet).
 *   whip 7.26 to 7.64 from A to B (the swap of the people happens at 7.40, inside the blur).
 *   B  7.4 to 9.9   CHARTING (n3). The nurses' station: Lemon types at a blur from the typing cue (7.95), a stack of charts grows on the counter, sheets flutter off; a calendar card tears off backwards (28 to 07, the
 *                   clock spinning backwards) and a LATE ENTRY stamp slams down on each stamp cue (8.351, 8.901, 9.451; the page shakes on each).
 *   crane 9.72 to 11.05 up to the med room (tag 3 arrives with it).
 *   C  9.9 to 12.64 INSULIN PENS (n4). Clementine opens the lit fridge, glances over her shoulder and dates the pens one by one (the kit's pens turn fresh).
 *   D  12.64 to 14.1 the camera trap (hard cut): night-vision grade, scanlines, CAM 03 MED ROOM HUD, timestamp, REC, MOTION box; infrared flashes on the shutter cues (12.79, 13.69), the scribble (12.99), CAUGHT.
 *   E  14.1 to 19.46 CALL LIGHTS (n5). The whole building; a staff member planted beside each call light like a goalkeeper; a dome rings, the keeper swats it in one frame; the HUD reads RESPONSE 0:09 and stays
 *                   green; STAFFING UNCHANGED, and on "Position" all four take one step to the left (POSITION CHANGED).
 *   F  19.46 to 24.4 THE DISPLAY (n6, a1). The Administrator's office; the pizza fan opens behind him on the pizza box cue (22.03), sparkles on 22.33, "We love surveys!" (22.23); Strawberry (per diem) watches him.
 * Gate: bash /tmp/shift_tools/audit_scene.sh 14 adapt (every frame).
 */
(() => {
if (!window.TIMELINE_EP14 || !window.S14) return;
const { zoomTo, faceZoom, drawBg } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A14 = window.A14, S14 = window.S14;

// ------------------------------------------------------------------ THE JUNK CATALOGUE: the kit's own stash sprites (S14.drawItem), so that what flies out of the shower room is exactly what the room shows. NO TEXT in any sprite.
// A piece is cached once as a 4x bitmap of the kit's drawing with its tight bounds; the rim lights (a warm key edge up-left, a cool back edge down-right) are laid down at draw time as offset
// silhouettes of that bitmap (a drop-shadow filter), so they stay on the lit side while a piece tumbles.
const KMAP = { chair: 'wheelchair', iv: 'ivpole', fan: 'fan', rail: 'rail', bucket: 'bucket', treebox: 'tree', tv: 'tv', banner: 'banner', qsign: 'qsign', bag: 'bag', box0: 'box', box1: 'box', box2: 'box' };
const KOPT = { box0: { w: 42, h: 34, color: '#d8ac72' }, box1: { w: 52, h: 40, color: '#c99a62' }, box2: { w: 62, h: 48, color: '#b98a52' } };
const g2 = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const outline = (w = 3.2) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
const KS = 4, SPR = new Map();
function kitSprite(kind) {
  let s = SPR.get(kind); if (s) return s;
  const name = KMAP[kind] || kind, o = KOPT[kind] || {}, P = 14, SZ = 520, prev = ctx;
  /* find the tight bounds of the kit's drawing: draw it once into a big scratch (origin: bottom centre) and read the alpha */
  const sc = V2.mk(SZ, SZ), g = sc.getContext('2d', { willReadFrequently: true }); ctx = g;
  try { g.save(); g.translate(SZ / 2, SZ - 60); S14.drawItem(name, 0, 0, 1, 0, o); g.restore(); } finally { ctx = prev; }
  const d = g.getImageData(0, 0, SZ, SZ).data; let x0 = SZ, y0 = SZ, x1 = 0, y1 = 0;
  for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) if (d[(y * SZ + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) { x0 = SZ / 2 - 20; x1 = SZ / 2 + 20; y0 = SZ - 100; y1 = SZ - 60; }
  const bx0 = x0 - SZ / 2 - P, bx1 = x1 - SZ / 2 + P, by0 = y0 - (SZ - 60) - P, by1 = y1 - (SZ - 60) + P;   /* bounds relative to the base centre, with padding */
  const cv = V2.mk(Math.ceil((bx1 - bx0) * KS), Math.ceil((by1 - by0) * KS)), cg = cv.getContext('2d'); ctx = cg;
  try { cg.save(); cg.scale(KS, KS); cg.translate(-bx0, -by0); S14.drawItem(name, 0, 0, 1, 0, o); cg.restore(); } finally { ctx = prev; }
  s = { cv, bx0, bx1, by0, by1, w: bx1 - bx0, h: by1 - by0, top: -by0 - P, half: (-by0 - P + P * 0) / 2 };   /* top: the height of the drawing above the base */
  SPR.set(kind, s); return s;
}
/* the distance from a piece's centre to its base (the lowest point it rests on), so a piece can be placed by its centre: half its drawn height */
const JB = new Proxy({}, { get: (_, k) => { if (!KMAP[k]) return 0; const s = kitSprite(k); return -(s.by0 + s.by1) / 2; } });
const JSC = new Proxy({}, { get: () => 1 });
/* jdraw(kind, cx, cy, rot, scale, st): the piece centred (by its tight bounds' vertical middle) on (cx, cy), turned about that point. st: { flip, alpha, rim (px, default 1.8) } */
function jdraw(kind, x, y, rot, sc, st = {}) {
  const s = kitSprite(kind), mid = (s.by0 + s.by1) / 2 - 0;   /* the middle of the sprite box, from the base */
  ctx.save();
  if (st.alpha != null) ctx.globalAlpha *= st.alpha;
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * (st.flip ? -1 : 1), sc);
  const rim = (st.rim ?? 1.8) / Math.max(.5, sc);
  if (rim > 0 && !TXA.mask) ctx.filter = `drop-shadow(${-rim}px ${-rim}px 0px rgba(255,228,176,.9)) drop-shadow(${rim * .8}px ${rim * .8}px 0px rgba(140,185,255,.5))`;
  ctx.drawImage(s.cv, s.bx0 - 0, s.by0 - mid, s.w, s.h);
  ctx.restore();
}
const jsc = (kind, sc = 1) => sc;      /* the kit's sprites are already at dollhouse scale */
const restY = (kind, floor, sc = 1) => floor - JB[kind] * sc;
/* a chrome tube from (x0, y0) to (x1, y1): ink outline, a mid-grey body, a bright highlight on the lit side (used by the camera trap's tap) */
function tube(x0, y0, x1, y1, w = 6, c0 = '#f4f7fb', c1 = '#8c96a6') {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L; if (nx + ny > 0) { nx = -nx; ny = -ny; }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = w + 3.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = c1; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = c0; ctx.lineWidth = Math.max(1.4, w * .38); ctx.beginPath(); ctx.moveTo(x0 + nx * w * .2, y0 + ny * w * .2); ctx.lineTo(x1 + nx * w * .2, y1 + ny * w * .2); ctx.stroke();
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
const TAG_BOX = [512, 48, 520, 200];            /* y 48 keeps its lower edge above the room-name plates that sit on the floor slabs (an ADMINISTRATOR plate was being clipped to ADMIN) */
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
/* at the dollhouse scale a badge is 5 px of lettering nobody can read, but it is text the gate sees tilting with a leaning body: the dollhouse cast wears blank badges (a single space) and no price tag */
const mkMango = o => A7.mango(Object.assign({ badgeText: ' ' }, o));
const mkClem = o => A10.clem(Object.assign({ badgeText: ' ', acc: ['steth', 'badge7'] }, o));
const mkLemon = o => A7.lemon(Object.assign({}, o));
const mkStraw = o => A11.straw(Object.assign({}, o));
const mkMelon = o => A9.melon(Object.assign({}, o));
/* the close-up versions (the med room, the trap) keep the lettering: NEW, and the price tag */
const mkClemUp = o => A10.clem(Object.assign({}, o));
const FL = { top: S14.rect('office').floor, mid: S14.rect('r7').floor, low: S14.rect('station').floor };   /* the three floor lines: 656, 986, 1316 */
const RC = id => S14.rect(id);
const lerpA = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

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

// ------------------------------------------------------------------ the shower closet's door (the kit's S14.showerDoor): a leaf 88 wide in a glass front, hinged on the right, the knob on the left; open = swung toward the camera
const DOOR0 = S14.showerDoor({ door: 0, bulge: 0 });          /* x 890..978, y 790..988, knob [901, 896] */
const doorKnob = st => S14.showerDoor(st).knob;
const DOOR_MID = (DOOR0.x0 + DOOR0.x1) / 2;                   /* 934 */

/* ---- the held junk: a prop that draws one of the catalogue's pieces in the hand (the glove goes over it). o.junk = { kind, rot, ox, oy } in the character's local units; the kit's sprites are at dollhouse
 *      scale, so inside a character (scaled by s) they are drawn at 1 / s. */
EXT.prop.fp14b_junk = (side, o, t) => {
  const j = o.junk; if (!j) return;
  const k = 1 / (o.s || 1);
  jdraw(j.kind, (j.ox || 0) * side, j.oy || 0, (j.rot || 0) * side, (j.sc ?? 1) * k, Object.assign({ rim: 2.2 }, j.st));
};
/* (not registered in PROP_BOX: a long held thing such as the IV pole would be reported as covering its carrier's face; the frames are checked by eye) */
/* how each kind is carried, in dollhouse pixels from the hand to the piece's middle, and its turn */
const CARRY = { iv: { ox: 0, oy: -10, rot: .12 }, fan: { ox: 4, oy: 30, rot: 0 }, rail: { ox: 8, oy: -22, rot: .15 }, bucket: { ox: 0, oy: -30, rot: 0 }, treebox: { ox: 4, oy: -26, rot: .42 } };
const carryOf = (kind, s) => { const c = CARRY[kind]; return { kind, ox: c.ox / s, oy: c.oy / s, rot: c.rot }; };

// ------------------------------------------------------------------ SHOT A: CONCEALMENT. A convoy shuttle: three waves of two runners (Mango with the heavy things, Clementine with the long ones) come in from the left edge, throw into the closet's doorway and run out again; the
// runners never cross (one wave is out of frame before the next comes in, and inside a wave they run in file, Clementine 88 px behind Mango), so no face is ever covered. After the last wave Mango leans on the door ("Does it close?" 4.17), Clementine
// shoves ("Sure!" 5.08), the door bursts (5.71) and flings them out over Lemon's head; Lemon, who walked in after the last wave and watched with her arms folded, closes it with one finger ("It closes." 6.36) and the junk obeys.
const RUN_V = 700, OUT_V = 900, XL = 500;                       /* run-in and run-out speeds (px/s along the floor) and the x where a runner is just out of the frame */
const DROP = { m: 832, c: 744 }, LANEY = { m: FL.mid + 6, c: FL.mid - 4 };
const CGAP = .12, HOLD = { m: .27, c: .1 };                     /* Clementine's throw follows Mango's by .12 s; after a throw each holds, Clementine leaves first so they never cross */
const WAVES = [.66, 1.93, 3.2];                                 /* the scene time Mango's piece leaves her hand in each wave */
const JM = ['chair', 'fan', 'bucket'], JC = ['iv', 'rail', 'treebox'];
const TRIPS = WAVES.flatMap((t, i) => [{ who: 'm', kind: JM[i], t }, { who: 'c', kind: JC[i], t: t + CGAP }]);   /* who, kind, the time the item leaves the hand */
const durIn = who => (DROP[who] - XL) / RUN_V, durOut = who => (DROP[who] - XL) / OUT_V;
function laneKeys(who) {   /* keyframes [t, x]: at XL, run in, the throw, the hold, run out (the last wave stays) */
  const keys = [], tr = TRIPS.filter(q => q.who === who);
  tr.forEach((q, i) => { keys.push([q.t - durIn(who), XL], [q.t, DROP[who]], [q.t + HOLD[who], DROP[who]]); if (i < tr.length - 1) keys.push([q.t + HOLD[who] + durOut(who), XL]); });
  return keys;
}
const laneFn = (who, keys) => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], LANEY[who]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i]; return [lerp(a[1], b[1], cl01((lt - a[0]) / (b[0] - a[0]))), LANEY[who]]; }
  return [keys[keys.length - 1][1], LANEY[who]];
};
const MKEYS = laneKeys('m'), CKEYS = laneKeys('c'), MLANE = laneFn('m', MKEYS), CLANE = laneFn('c', CKEYS);
function tripAt(who, lt) {   /* which trip a runner is on: { q, phase: 'in' | 'out' } (the last trip has no 'out') */
  const tr = TRIPS.filter(q => q.who === who);
  for (let i = 0; i < tr.length; i++) {
    const q = tr[i];
    if (lt >= q.t - durIn(who) - .02 && lt < q.t) return { q, phase: 'in' };
    if (i < tr.length - 1 && lt >= q.t && lt < q.t + HOLD[who] + durOut(who) + .02) return { q, phase: 'out' };
  }
  return null;
}
const OFF = x => x < XL - 2;                                    /* a runner at the line is entirely outside the frame (the camera's left edge is x 548 to 574): it is simply not drawn */
const LAST_M = TRIPS.filter(q => q.who === 'm').pop().t + HOLD.m, LAST_C = TRIPS.filter(q => q.who === 'c').pop().t + HOLD.c;

/* the door and the closet's stash as the shot needs them (what the kit is asked for) */
const t_wordCloses = () => wordT('l1', 'closes', 6.6);
function doorA(lt) {
  const bt = CUE.crash, tc = t_wordCloses(), lastIn = TRIPS[TRIPS.length - 1].t + .2;
  const landed = TRIPS.reduce((n, q) => n + sstep(lt, q.t + .12, q.t + .3), 0);
  let stash = 2 + landed / 3, door = 1, bulge = sstep(lt, 2.0, 3.5) * .55;
  if (lt >= lastIn) { door = lerp(1, .12, sstep(lt, lastIn, lastIn + .55)); bulge = lerp(.55, .85, sstep(lt, lastIn, 4.4)); }
  if (lt >= 4.4) bulge = lerp(.85, 1, sstep(lt, 4.4, 5.3));
  if (lt >= 5.3) door = lerp(.12, 0, sstep(lt, 5.3, 5.62));
  if (lt >= bt) { door = easeOut(seg(lt, bt, bt + .16)); bulge = 0; stash = 3.1; }
  if (lt >= tc) { const c = easeIO(seg(lt, tc + .04, tc + .46)); door = lerp(1, 0, c); stash = lerp(3.1, 4, c); bulge = .45 * c; }
  return { door, bulge, stash };
}
const knobA = lt => doorKnob(doorA(lt));
const LEAN_MAX = .19;     /* a body leaning more than about 11 degrees would tilt the lettering on it past the gate's 12 */

/* the burst flings both pushers back over Lemon's head and out of the left edge (transit: they are exempt from the edge audit and from the overlap audit while they fly, and are gone before they could land) */
const FLY = { m: { x0: DROP.m, v: -1600, T: .5, peak: 100, spin: -.55, d: 0 }, c: { x0: DROP.c, v: -1400, T: .5, peak: 118, spin: .5, d: 0 } };
function flung(who, lt, ctor, base) {
  const F = FLY[who], t = lt - CUE.crash - F.d; if (t < 0) return undefined;
  if (t >= F.T) return null;                                      /* long gone: the parabola below turns round at T */
  const x = F.x0 + F.v * t * (1 - t / (2 * F.T)), k = cl01(t / F.T);
  if (OFF(x)) return null;
  const o = ctor(Object.assign({ x, y: LANEY[who], lift: F.peak * 4 * k * (1 - k), rot: F.spin * k, expr: 'panic', look: [.7, .2] }, base));
  o.arms = { l: 'up', r: 'flail' }; o.transit = true;
  return o;
}

/* the free hand swings while the other carries */
const runArms = (o, lt, kind) => {
  o.arms = { l: 'run', r: kind ? 'hold' : 'run' };
  if (kind) { o.hold = { r: 'fp14b_junk' }; o.junk = carryOf(kind, o.s); o.grip = { r: [76 + 4 * Math.sin(lt * 26), 30 + 6 * Math.cos(lt * 26)] }; }
  return o;
};
const CHAIR_H = [-36, -80];                                      /* the pushed wheelchair's handle, from its base (the kit's sprite) */
const chairHandle = lt => [MLANE(lt)[0] + 80, LANEY.m - 80];
const chairBase = lt => [chairHandle(lt)[0] - CHAIR_H[0], LANEY.m];

// ------------------------------------------------------------------ SHOT A actors: Mango, Clementine and Lemon (everyone walks through S14.walk / S14.run so the footstep tool gets the gait fields)
const MX_DOOR = DROP.m, CX_PUSH = DROP.c, LX = 650;     /* Mango leans on the door, Clementine stands behind her to shove, Lemon watches from the armchair end of the room (the three are 88 to 94 px apart: no body covers another's face) */
const burstK = lt => seg(lt, CUE.crash, CUE.crash + .42);

function mangoA(lt) {
  const bt = CUE.crash, base = { s: SS, stride: 44, plant: true, who: 'mango', t: lt };
  if (lt >= bt) return flung('m', lt, mkMango, base) || null;
  const o = S14.run(mkMango, MLANE, lt, Object.assign({ expr: 'happy', look: [.9, 0] }, base));
  if (OFF(o.x)) return null;
  if (lt < LAST_M) {
    const tr = tripAt('m', lt);
    if (o.gaitW != null) leanO(o, (o.dir || 1) * .12);
    withTransit(o, true);
    const push = tr && tr.phase === 'in' && tr.q.kind === 'chair', carry = tr && tr.phase === 'in' && !push ? tr.q.kind : null;
    runArms(o, lt, carry);
    if (push) { const h = chairHandle(lt); o.arms = { l: 'run', r: 'reach' }; o.grip = { r: gripFor(o, 'r', h[0], h[1]) }; }
    if (!tr || tr.phase === 'out') o.look = [-.9, 0];
    return o;
  }
  /* door duty: she takes the knob and leans her shoulder into the door; it bows, it shakes, the burst throws her back */
  const lean = sstep(lt, 3.5, 4.0) * .11 + sstep(lt, 4.1, 5.05) * .03 + sstep(lt, 5.1, 5.6) * .045;
  leanO(o, lean);
  o.shake = lt >= 5.0 ? 1.8 * sstep(lt, 5.0, 5.5) : 0;
  const k = knobA(lt);
  o.arms = { l: 'hips', r: 'reach' }; o.grip = { r: gripFor(o, 'r', k[0] - 2, k[1] + 4) }; o.hand = { r: 'grip' };
  o.expr = lt >= 5.0 ? 'weak' : lt >= B('m1').s ? 'hopeful' : 'happy'; o.look = lt >= B('c1').s - .3 ? [-.6, .1] : [.9, .05];
  if (lt >= B('m1').s && lt < B('m1').e) o.lid = .22;
  return o;
}
/* Clementine runs in file behind Mango, then waits by her (a hand on a hip, watching her strain), and at "Sure!" puts both shoulders into it */
function clemA(lt) {
  const bt = CUE.crash, base = { s: SS, stride: 40, plant: true, who: 'clem', t: lt };
  if (lt >= bt) return flung('c', lt, mkClem, base) || null;
  const o = S14.run(mkClem, CLANE, lt, Object.assign({ expr: 'hopeful', look: [.9, 0] }, base));
  if (OFF(o.x)) return null;
  if (lt < LAST_C) {
    const tr = tripAt('c', lt);
    if (o.gaitW != null) leanO(o, (o.dir || 1) * .12);
    withTransit(o, true);
    runArms(o, lt, tr && tr.phase === 'in' ? tr.q.kind : null);
    if (!tr || tr.phase === 'out') o.look = [-.9, 0];
    return o;
  }
  const push = sstep(lt, 4.85, 5.1);
  const lean = sstep(lt, 4.95, 5.2) * .13 + sstep(lt, 5.2, 5.6) * .05;
  leanO(o, lean);
  o.shake = lt >= 5.1 ? 2.2 * sstep(lt, 5.1, 5.5) : 0;
  const m = mangoA(lt), mx = m ? m.x - 46 : MX_DOOR - 46;
  o.arms = { l: 'hips', r: push > 0 ? 'reach' : 'hips' };
  if (push > 0) { o.grip = { r: lerpA(gripFor(o, 'r', o.x + 30, FL.mid - 60), gripFor(o, 'r', mx, FL.mid - 80), push) }; o.hand = { r: 'flat' }; }
  o.expr = lt >= B('c1').s ? 'happy' : 'hopeful'; o.look = [.9, .05]; o.squash = .05 * sstep(lt, 5.2, 5.6);
  return o;
}
/* Lemon strolls in after the last wave (hands on her elbows, half-lidded), stops, and watches; the burst blows past her and she does not move; then she walks to the door and closes it with one finger */
function lemonPath(u) {
  const bt = CUE.crash, tc = t_wordCloses(), w0 = bt + .12, w1 = tc - .22;
  if (u < w0) return [lerp(470, LX, easeIO(seg(u, 3.0, 4.7))), FL.mid];
  return [lerp(LX, MX_DOOR, easeIO(seg(u, w0, w1))), FL.mid];
}
function lemonA(lt) {
  const bt = CUE.crash, tc = t_wordCloses(), w1 = tc - .22;
  const base = { s: SS, stride: 40, plant: true, who: 'lemon', t: lt };
  if (lt < 3.0) return null;
  const o = S14.walk(mkLemon, lemonPath, lt, Object.assign({ expr: 'dead', lid: .5 }, base));
  if (OFF(o.x)) return null;
  const reach = sstep(lt, tc - .3, tc + .02), pull = sstep(lt, tc + .55, tc + .95), k = knobA(Math.max(lt, tc + .02));
  /* she watches with her arms folded (a hand on each elbow); the eyes go to the pusher at the door */
  o.arms = { l: 'hips', r: 'hips' };
  o.look = lt < 4.7 ? [.95, .05] : [.9, 0];
  if (lt >= bt && lt < bt + .5) { o.arms = { l: 'down', r: 'down' }; o.expr = 'dead'; }
  if (lt >= w1 - .1) {
    o.arms = { l: 'rest', r: 'reach' };
    o.grip = { r: lerpA(gripFor(o, 'r', o.x + 24, FL.mid - 62), gripFor(o, 'r', k[0] - 1, k[1] + 2), reach * (1 - pull)) };
    o.hand = { r: 'point' }; o.look = lt < tc + .6 ? [.9, 0] : [.1, 0];
  }
  return withTransit(o, lt < 4.8 || camSpeed(lt) > 300);
}

// ------------------------------------------------------------------ SHOT A: the pieces (a lob into the doorway, then the spill and the rewind), the dust, the world
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
function floorShadow(x, y, w, a = .3) { ctx.save(); ctx.translate(x, y); ctx.scale(1, .16); ctx.fillStyle = V2.radial(0, 0, 0, w, [[0, `rgba(10,6,16,${a})`], [1, 'rgba(10,6,16,0)']]); ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.fill(); ctx.restore(); }

/* a delivery: the piece leaves the hand (or rolls on, the wheelchair) and goes into the doorway, shrinking and fading into the closet's depth */
const LOB = .24;
function deliveryState(q, lt) {
  const t = lt - q.t; if (t < 0 || t > LOB + .03) return null;
  const k = cl01(t / LOB), tx = DOOR_MID - 6, ty = FL.mid - 92;
  if (q.kind === 'chair') { const c = chairBase(q.t), x = lerp(c[0], tx, easeIn(k) * .9 + k * .1), y = LANEY.m - JB.chair * (1 - .4 * k) * 1; return { x, y: lerp(c[1] - JB.chair, ty + 16, k * k), rot: 0, sc: 1 - .42 * k, alpha: 1 - sstep(k, .7, 1), a: x / 22 }; }
  const x0 = DROP[q.who] + 38, y0 = LANEY[q.who] - 66;
  return { x: lerp(x0, tx, easeOut(k)), y: lerp(y0, ty, k) - 30 * Math.sin(k * PI), rot: .3 + 5 * t * (q.kind === 'iv' ? 1 : -1), sc: 1 - .42 * k, alpha: 1 - sstep(k, .7, 1) };
}
/* the spill at the burst: pieces fly out of the doorway to the left; after the finger on the knob they fly back in (the same arcs, run backwards at speed) */
const SPILL = [
  { kind: 'chair', d: 0, y: -50, vx: -820, vy: -90, w: 0, slide: 2.5, e: .3, fr: .8, dy: 4 },
  { kind: 'iv', d: .02, y: -110, vx: -560, vy: -560, w: -4.2, slide: 4.5, e: .36, fr: .7, dy: -4 },
  { kind: 'fan', d: .05, y: -80, vx: -500, vy: -600, w: 6.2, slide: 4, e: .42, fr: .7, dy: 8 },
  { kind: 'rail', d: .06, y: -90, vx: -440, vy: -380, w: 3.4, slide: 4, e: .3, fr: .7, dy: -8 },
  { kind: 'bucket', d: .04, y: -50, vx: -360, vy: -640, w: -5, slide: 5, e: .34, fr: .6, dy: 10 },
  { kind: 'treebox', d: .1, y: -70, vx: -420, vy: -300, w: -2.4, slide: 4, e: .3, fr: .7, dy: 0 },
  { kind: 'tv', d: .03, y: -100, vx: -380, vy: -480, w: 3.2, slide: 5, e: .36, fr: .6, dy: 12 },
  { kind: 'box2', d: .08, y: -60, vx: -300, vy: -400, w: -3, slide: 5, e: .3, fr: .6, dy: 6 },
  { kind: 'box1', d: .12, y: -120, vx: -240, vy: -560, w: 4.5, slide: 6, e: .35, fr: .6, dy: -2 },
  { kind: 'banner', d: .14, y: -40, vx: -560, vy: -260, w: 2.6, slide: 3.4, e: .3, fr: .8, dy: 2 },
  { kind: 'box0', d: .16, y: -140, vx: -180, vy: -640, w: -5.4, slide: 6, e: .35, fr: .6, dy: 9 },
];
function spillState(sp, lt) {
  const bt = CUE.crash, tc = t_wordCloses(), u = 1 - easeIO(seg(lt, tc + .06, tc + .5));
  const tt = (Math.min(lt, tc + .06) - bt - sp.d) * (lt > tc + .06 ? u : 1);
  if (tt <= 0) return null;
  const fl = FL.mid + sp.dy, r = ball({ x: DOOR_MID - 4, y: FL.mid + sp.y, vx: sp.vx, vy: sp.vy, floor: fl - JB[sp.kind], w: sp.w, rot: 0, e: sp.e, fr: sp.fr, slide: sp.slide }, tt);
  return { x: r[0], y: r[1], rot: r[2], rest: r[3], alpha: cl01(tt / .05) * cl01(u * 8), sc: 1 + .1 * cl01(tt / .4) };
}
function piecesA(lt) {
  const bt = CUE.crash, out = [];
  if (lt < bt) {
    for (const q of TRIPS) { const s = deliveryState(q, lt); if (!s) continue; out.push({ z: 2.5, kind: q.kind, x: s.x, y: s.y, rot: s.rot, sc: s.sc, st: { alpha: s.alpha } }); }
    const tr = tripAt('m', lt);
    if (tr && tr.phase === 'in' && tr.q.kind === 'chair') { const c = chairBase(lt); out.push({ z: 2.6, kind: 'chair', x: c[0], y: c[1] - JB.chair, rot: 0, sc: 1, st: {} }); }
  } else for (const sp of SPILL) { const s = spillState(sp, lt); if (s) out.push({ z: 2 + sp.dy / 100, kind: sp.kind, x: s.x, y: s.y, rot: s.rot, sc: s.sc, st: { alpha: s.alpha }, rest: s.rest }); }
  return out;
}
function effectsA(lt) {
  const bt = CUE.crash;
  for (const q of TRIPS) { const dt = lt - (q.t + LOB * .8); if (dt > 0 && dt < .5) puff(DOOR_MID + 4, FL.mid - 70, dt / .5, { r: 26, seed: q.t * 3, n: 4, a: .45 }); }
  if (lt >= bt && lt < bt + 1.2) {
    puff(DOOR_MID - 20, FL.mid - 46, (lt - bt) / 1.2, { r: 80, seed: 3, n: 9, a: .6 });
    puff(DOOR_MID - 120, FL.mid - 14, (lt - bt - .1) / 1.2, { r: 62, seed: 8, n: 7, a: .5 });
    ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(DOOR_MID, FL.mid - 90, (lt - bt) / .5, { r0: 20, r1: 260, lw: 7, alpha: .7, color: '255,236,200' }); ctx.restore();
  }
  if (lt >= bt && lt < bt + .35) V2.glow(DOOR_MID, FL.mid - 90, 200, '255,226,170', .5 * (1 - (lt - bt) / .35), 'screen', .4);
}
function drawShotA(lt) {
  const rooms = { shower: doorA(lt), med: { pens: .25 } };
  S14.back(lt, { rooms, t: lt });
  const items = [];
  for (const p of piecesA(lt)) items.push({ z: p.z, fn: () => { if (p.rest !== false && p.y > 0) floorShadow(p.x, FL.mid + 2, 34, .22); jdraw(p.kind, p.x, p.y, p.rot, p.sc, p.st); } });
  const m = mangoA(lt), c = clemA(lt), l = lemonA(lt);
  if (m) items.push({ z: 3.1, fn: () => drawChar(m) });
  if (c) items.push({ z: 2.9, fn: () => drawChar(c) });
  if (l) items.push({ z: 3.2, fn: () => drawChar(l) });
  items.sort((a, b) => a.z - b.z);
  for (const it of items) it.fn();
  S14.front(lt, { rooms });
  effectsA(lt);
}
const A_CAM = lt => ({ z: lerp(1.86, 2.04, easeOut(seg(lt, 0, 5.8))), x: 838, y: 944 });

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
  const o = mkClemUp({ x: bx, y: 1166, s, t: lt, expr: caught ? 'shock' : 'hopeful', look: caught ? [0, .05] : lt < sc0 ? [-.95, .15] : [.3, .55], arms: { l: 'hips', r: 'reach' }, hold: { r: 'fp14b_marker' }, hand: {}, acc: ['steth', 'badge7'] });
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

// ------------------------------------------------------------------ THE SHOTS AND THE CAMERA. Five dollhouse shots share one world; the camera travels between them (a whip down to the station, a crane up to the med room); the trap is its own picture.
const SHOT_T = { a: 0, b: 7.4, c: 9.9, d: 12.64, e: 14.1, f: 19.46 };     /* where each shot's picture begins (the camera starts travelling to it a little earlier) */
const shotOf = lt => lt >= SHOT_T.f ? 'f' : lt >= SHOT_T.e ? 'e' : lt >= SHOT_T.d ? 'd' : lt >= SHOT_T.c ? 'c' : lt >= SHOT_T.b ? 'b' : 'a';
const roomC = id => { const r = RC(id); return [r.cx, r.cy]; };
const B_POSE = (lt) => ({ z: lerp(2.42, 2.55, easeOut(seg(lt, 7.6, 9.9))), x: 650, y: 1222 });
const C_POSE = (lt) => ({ z: lerp(3.1, 3.4, easeOut(seg(lt, 11.0, 12.64))), x: 147, y: 884 });
const E_POSE = (lt) => ({ z: lerp(1.0, 1.04, seg(lt, 14.1, 19.46)), x: 540, y: 905 });
const F_POSE = (lt) => ({ z: lerp(2.95, 3.12, easeOut(seg(lt, 19.5, 22.0))), x: 150, y: 636 });
const mixPose = (a, b, k) => ({ z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
/* the whip from A to B: 7.26 to 7.64; the crane from B to C: 9.72 to 11.0; the cuts into D, E and F are hard */
const WH = { ab: [7.26, 7.64], bc: [9.72, 11.05] };
function camAt(lt) {
  if (lt < WH.ab[0]) return A_CAM(lt);
  if (lt < WH.ab[1]) return mixPose(A_CAM(WH.ab[0]), B_POSE(WH.ab[1]), easeIO(seg(lt, WH.ab[0], WH.ab[1])));
  if (lt < WH.bc[0]) return B_POSE(lt);
  if (lt < WH.bc[1]) return mixPose(B_POSE(WH.bc[0]), C_POSE(WH.bc[1]), easeIO(seg(lt, WH.bc[0], WH.bc[1])));
  if (lt < SHOT_T.d) return C_POSE(lt);
  if (lt < SHOT_T.e) return { z: 1.25, x: 640, y: 900 };
  if (lt < SHOT_T.f) return E_POSE(lt);
  return F_POSE(lt);
}
/* how fast the camera is moving (scene px per second at the screen), for the blur and for the characters that cross the frame edge during a whip */
function camSpeed(lt) {
  const a = camAt(lt - .02), b = camAt(lt + .02), za = (a.z + b.z) / 2;
  return Math.hypot((b.x - a.x) * za, (b.y - a.y) * za, Math.log(b.z / a.z) * 900) / .04;
}
const isCut = lt => [SHOT_T.d, SHOT_T.e, SHOT_T.f].some(c => lt >= c - .04 && lt <= c + .07);
function blurAt(lt) {
  if (isCut(lt)) return 1;
  const sp = camSpeed(lt);
  let n = sp > 1800 ? 9 : sp > 900 ? 7 : sp > 400 ? 4 : sp > 150 ? 2 : 1;
  if (lt >= CUE.typing - .3 && lt < SHOT_T.c) n = Math.max(n, 5);                       /* Lemon types at a blur */
  if (lt >= CUE.scribble && lt < SHOT_T.e) n = Math.max(n, 4);
  return n;
}

// ------------------------------------------------------------------ SHOT B: CHARTING. The nurses' station: Lemon types at a blur (typing cue 7.95), a stack of paper grows on the counter, sheets flutter off it.
const LEM_B = { x: 668, y: FL.low };
const KEYS_B = [692, FL.low - 118];                          /* the computer on wheels' keyboard (the kit draws it at local (380..416, 184) of the station) */
function lemonB(lt) {
  const typing = sstep(lt, CUE.typing - .12, CUE.typing + .05) * (1 - sstep(lt, 9.78, 9.98));
  const o = mkLemon({ x: LEM_B.x, y: LEM_B.y, s: SS, t: lt, who: 'lemon', expr: 'dead', lid: .5, look: [.75, -.45], plant: true });
  o.rot = .012 * Math.sin(lt * 5.3) * typing;
  const ph = lt * 74;
  o.arms = { l: 'hold', r: 'hold' };
  o.grip = { l: gripFor(o, 'l', KEYS_B[0] - 12 + 7 * Math.sin(ph) * typing, KEYS_B[1] + 3 + 5 * Math.sin(ph * 1.17 + 1) * typing), r: gripFor(o, 'r', KEYS_B[0] + 16 + 7 * Math.sin(ph * 1.09 + 2.4) * typing, KEYS_B[1] + 3 + 5 * Math.sin(ph * .93 + .7) * typing) };
  o.hand = { l: 'flat', r: 'flat' };
  return o;
}
/* the stack of charts on the counter, right of the kit's own: it grows with the typing; a sheet lifts off now and then and flutters away to the upper left */
const STACK = { x: 560, y: RC('station').y0 + 232 };       /* the counter top surface is at local y 226..238 */
function drawStack(lt) {
  const k = seg(lt, CUE.typing, 9.8), n = Math.round(3 + 22 * easeOut(k)), t0 = CUE.typing;
  ctx.save();
  floorShadow(STACK.x, STACK.y + 4, 30, .3);
  for (let i = 0; i < n; i++) {
    const w = 38 + 3 * hash(i * 1.7), x = STACK.x + (hash(i * 3.1) - .5) * 5, y = STACK.y - i * 2.1;
    ctx.fillStyle = ['#f6f1e4', '#e7eef6', '#f7ead6', '#eef5e6'][i % 4]; ctx.strokeStyle = 'rgba(30,20,10,.55)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 2.6, w, 3.6, 1); ctx.fill(); ctx.stroke();
    if (i === n - 1) { ctx.fillStyle = 'rgba(40,60,140,.5)'; for (let q = 0; q < 3; q++) ctx.fillRect(x - w / 2 + 4, y - 2 + q * 0, w - 12 - q * 5, 1); }
  }
  /* the sheets that flutter off: one every .22 s, each on its own arc */
  for (let s = 0; s < 9; s++) {
    const tb = t0 + .2 + s * .21, u = (lt - tb) / 1.05;
    if (u < 0 || u > 1) continue;
    const x = STACK.x - 70 * u - 24 * Math.sin(u * 7 + s) * u + (s % 3 - 1) * 26 * u, y = STACK.y - 20 - 120 * easeOut(u) + 30 * u * u * 2.4, a = Math.sin(u * 5 + s * 2) * .7, sx = Math.abs(Math.cos(u * 6 + s));
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(Math.max(.2, sx), 1); ctx.globalAlpha = Math.min(1, (1 - u) * 3);
    ctx.fillStyle = '#fbf7ea'; ctx.strokeStyle = 'rgba(30,20,10,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect(-13, -17, 26, 34, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(40,60,140,.45)'; for (let q = 0; q < 4; q++) ctx.fillRect(-9, -11 + q * 7, 18 - (q % 2) * 5, 1.6);
    ctx.restore();
  }
  ctx.restore();
}
function drawShotB(lt) {
  const rooms = { med: { pens: 0 }, shower: { stash: 4, bulge: .5, door: 0 } };
  S14.back(lt, { rooms, t: lt });
  const lb = lemonB(lt); if (lt < WH.ab[1]) lb.transit = true;      /* the whip is still carrying the picture to the station: she arrives in a streak */
  drawChar(withTransit(lb, camSpeed(lt) > 300));
  S14.front(lt, { rooms });
  drawStack(lt);
}

// ------------------------------------------------------------------ SHOT B overlay: the backdating card (a calendar tearing off backwards, a clock spinning backwards, LATE ENTRY stamps landing in a column)
const CARD = [44, 288, 372, 564];
const STAMPS_B = [{ t: () => B('n3').s + .8, rot: -.1 }, { t: () => B('n3').s + 1.35, rot: .08 }, { t: () => B('n3').s + 1.9, rot: -.06 }];   /* on 'Charting', 'weeks' and 'minutes' */
function calendarDay(lt) { return 28 - Math.min(21, Math.floor(21 * seg(lt, CUE.typing + .02, 9.66) + 1e-6)); }
function drawCardB(lt) {
  const a = Math.min(sstep(lt, 7.62, 7.9), 1 - sstep(lt, 9.86, 10.0)); if (a <= .01) return;
  const [x, y, w, h] = CARD, pop = lerp(.92, 1, easeBack(seg(lt, 7.62, 7.95)));
  let sh = 0; for (const s of STAMPS_B) { const dt = lt - s.t(); if (dt > 0 && dt < .16) sh = Math.max(sh, (1 - dt / .16)); }
  ctx.save(); ctx.globalAlpha *= a; const cx = x + w / 2, cy = y + h / 2; ctx.translate(cx + 3 * sh * Math.sin(lt * 120), cy + 2 * sh * Math.cos(lt * 140)); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
  const pg = UI.page(CARD, { pitch: 0, fill: '#fbf3dc', rot: -.025, id: 'card14', shadow: 26, edge: '#cdbf98', fold: true });
  regOverlay([x, y, x + w, y + h], 'card14');
  pg.apply();
  /* the calendar block: a red header, the month, the big day; the sheet that just came off falls away (blank: it is a blur) */
  const bx = x + 28, by = y + 28, bw = 176, bh = 214, day = calendarDay(lt), per = (CUE.typing + .02), u = lt >= per && lt < 9.7 ? ((lt - per) * 21 / (9.66 - per)) % 1 : 1;
  for (const rx of [bx + 54, bx + bw - 54]) { ctx.fillStyle = '#6b6672'; ctx.fillRect(rx - 3, by - 14, 6, 26); ctx.strokeStyle = INKD; ctx.lineWidth = 2; ctx.strokeRect(rx - 3, by - 14, 6, 26); }
  ctx.fillStyle = '#fffdf6'; rr(bx, by, bw, bh, 10); ctx.fill(); ctx.strokeStyle = INKD; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.fillStyle = STAMP; ctx.beginPath(); ctx.roundRect(bx, by, bw, 62, [10, 10, 0, 0]); ctx.fill(); ctx.stroke();
  UI.container('cal14h', 'panel', [bx, by, bx + bw, by + 62], 6);
  UI.label('OCT', bx + bw / 2, by + 31, { size: 38, weight: 900, spacing: 6, fill: '#fff', cid: 'cal14h', center: true });
  UI.container('cal14b', 'panel', [bx, by + 62, bx + bw, by + bh], 6);
  UI.label(String(day).padStart(2, '0'), bx + bw / 2, by + 62 + (bh - 62) / 2, { size: 118, font: 'Bangers', fill: INKD, spacing: 2, cid: 'cal14b', center: true });
  if (u < .5 && lt >= per && lt < 9.7) {   /* the torn sheet, falling backwards over the page below (no lettering) */
    const k = u / .5; ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2 + 260 * k * k); ctx.rotate(-.2 * k); ctx.globalAlpha *= 1 - k * .8;
    ctx.fillStyle = '#fffdf6'; rr(-bw / 2, -bh / 2 + 62, bw, bh - 62, 6); ctx.fill(); ctx.strokeStyle = 'rgba(30,20,10,.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
  /* the clock, hands spinning the wrong way */
  const kx = x + 268, ky = y + 134, kr = 48;
  ctx.fillStyle = '#fffdf6'; ell(kx, ky, kr, kr); ctx.fill(); ctx.strokeStyle = INKD; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = 'rgba(29,26,22,.7)'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { const q = i * PI / 6; ctx.beginPath(); ctx.moveTo(kx + Math.cos(q) * (kr - 11), ky + Math.sin(q) * (kr - 11)); ctx.lineTo(kx + Math.cos(q) * (kr - 5), ky + Math.sin(q) * (kr - 5)); ctx.stroke(); }
  const spin = lt >= CUE.typing - .05 ? (lt - CUE.typing + .05) : 0, am = -PI / 2 - spin * 16, ah = -PI / 2 - spin * 1.4;
  ctx.lineCap = 'round'; ctx.strokeStyle = INKD; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(ah) * 24, ky + Math.sin(ah) * 24); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(am) * 36, ky + Math.sin(am) * 36); ctx.stroke(); ctx.fillStyle = STAMP; ell(kx, ky, 6, 6); ctx.fill();
  /* the divider and the stamps: equal 88 px pitch in one column, each slams down once */
  ctx.strokeStyle = 'rgba(30,20,10,.3)'; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(x + 30, y + 268); ctx.lineTo(x + w - 30, y + 268); ctx.stroke(); ctx.setLineDash([]);
  STAMPS_B.forEach((s, i) => {
    const k = seg(lt, s.t(), s.t() + .14); if (k <= 0) return;
    const sc = lerp(1.16, 1, easeOut(k)), sy = y + 322 + i * 92;
    ctx.save(); ctx.translate(x + w / 2, sy); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -sy);
    UI.stamp('LATE ENTRY', x + w / 2, sy, { size: 44, rot: s.rot, color: STAMP, alpha: Math.min(.95, .35 + k) });
    ctx.restore();
  });
  pg.restore();
  ctx.restore();
}
function overB(lt) {
  fieldTag(lt, BEHAVIORS[1], 7.62, 9.9);
  drawCardB(lt);
}

// ------------------------------------------------------------------ SHOT C: INSULIN PENS (n4, 9.9 to 12.64). The camera has craned up to the med room: Clementine opens the lit fridge, glances over her shoulder and starts dating the pens with a marker (the kit's pens turn fresh one by one).
const MEDR = RC('med'), FRD = S14.fridge();
const penLevel = lt => .25 + Math.min(6, Math.floor(seg(lt, 11.05, 12.5) * 6.999)) / 18;       /* six pens get a fresh label in this shot; the trap shows the rest */
const nextPen = lv => { const a = S14.penSlots(lv), b = S14.penSlots(lv + 1 / 18 + 1e-6); const i = b.findIndex((s, k) => s.fresh && !a[k].fresh); return i >= 0 ? b[i] : a[0]; };
const fridgeA = lt => .62 * easeIO(seg(lt, 10.4, 10.95));   /* the kit's MEDICATION label stops fitting past about .65 */
function clemC(lt) {
  const lv = penLevel(lt), open = fridgeA(lt), x = lerp(120, 150, easeIO(seg(lt, 10.6, 11.2)));
  const o = mkClemUp({ x, y: MEDR.floor, s: SS, t: lt, who: 'clem', expr: 'hopeful', look: [.9, .1], plant: true, hold: { r: 'fp14b_marker' }, hand: { l: 'open' }, arms: { l: 'hips', r: 'reach' } });
  const ph = ((lt - 11.05) / (1.45 / 6));        /* a pen every .24 s */
  const hand = (() => {
    if (lt < 10.4) return [FRD.x0 + 4, 874];
    if (lt < 10.95) { const th = open * 1.2, c = Math.cos(th); return [FRD.x1 - (FRD.x1 - FRD.x0) * c + 4 * c + 2, 874]; }
    if (lt < 11.05) return [FRD.x0 + 12, 880];
    const k = clamp(Math.floor(ph), 0, 5), q = nextPen(.25 + k / 18), f = ph - Math.floor(ph);
    return [q.x + 4, q.y - 12 + 4 * Math.sin(lt * 60) * (f < .6 ? 1 : 0)];
  })();
  o.grip = { r: gripFor(o, 'r', hand[0] - 10.5, hand[1] - 11) };      /* the marker's tip is about 10 px right of and 11 px below the hand at this scale */
  if (lt < 10.95) { o.hold = {}; o.hand = { l: 'open', r: 'grip' }; o.grip = { r: gripFor(o, 'r', hand[0], hand[1]) }; }
  /* eyes: over the shoulder (left) between pens, then into the lens on "today" */
  const glance = Math.sin(lt * 5.6) > .55;
  o.look = lt < 10.95 ? [-.9, .1] : lt >= 12.42 ? [0, 0] : glance ? [-.95, .15] : [.8, .3];
  if (lt >= 12.42) { o.expr = 'shock'; }
  return o;
}
function drawShotC(lt) {
  const rooms = { med: { fridge: fridgeA(lt), pens: penLevel(lt) }, shower: { stash: 4, bulge: .55, door: 0 } };
  S14.back(lt, { rooms, t: lt });
  drawChar(withTransit(clemC(lt), camSpeed(lt) > 300));      /* she is half out of the frame while the crane is still travelling */
  S14.front(lt, { rooms });
}

// ------------------------------------------------------------------ SHOT E: CALL LIGHTS (n5, 14.1 to 19.46). The whole building. Every call light has a staff member planted beside it like a goalkeeper (Clementine in room 4, Mango in room 7, Strawberry in room 14,
// Lemon in the dining room); a dome lights, the keeper swats it off in one frame; the HUD reads RESPONSE 0:09 and stays green. "Position has." = all four take one step to the left, together.
const GREEN_HUD = '#5cff9a', AMBER = '#ffc83d';
const KEEP = [
  { id: 'c', ctor: mkClem, who: 'clem', room: 'r4', dome: u => [RC('r4').x0 + 206, FL.mid - 118], x: RC('r4').x0 + 168, fl: FL.mid, look: .9 },
  { id: 'm', ctor: mkMango, who: 'mango', room: 'r7', dome: u => [RC('r7').x0 + 36, FL.mid - 120], x: RC('r7').x0 + 80, fl: FL.mid, look: -.9 },
  { id: 's', ctor: mkStraw, who: 'straw', room: 'r14', dome: u => [RC('r14').x0 + 52, FL.top - 124], x: RC('r14').x0 + 98, fl: FL.top, look: -.9 },
  { id: 'l', ctor: mkLemon, who: 'lemon', room: 'dining', dome: u => [RC('dining').x0 + 62, FL.low - 132], x: RC('dining').x0 + 118, fl: FL.low, look: -.9 },
];
/* when each dome rings: [keeper index, time]; the first four are before "nine seconds", the rest while the HUD holds */
const DINGS = [[0, 14.74], [1, 15.3], [2, 15.82], [3, 16.34], [0, 16.88], [1, 17.3], [2, 17.72], [3, 18.06]];
const STEP_T = () => wordT('n5', 'position', 18.38) + .06;              /* "Position": all four take one step left */
const HOP_T = () => wordT('n5', 'has', 18.88) + 0;
const callDomeDraw = (x, y, a) => {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#d8dde4'; rr(-9, 6, 18, 6, 2); ctx.fill(); outline(1.6); ctx.stroke();
  ctx.fillStyle = a > .05 ? `rgb(${230 + 25 * a | 0},${60 + 20 * (1 - a) | 0},${60 + 20 * (1 - a) | 0})` : '#9a2a2a';
  ctx.beginPath(); ctx.arc(0, 6, 9, PI, TAU); ctx.closePath(); ctx.fill(); outline(1.8); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(-3, 1.4, 2.8, 1.6); ctx.fill();
  ctx.restore();
  if (a > .05) { V2.glow(x, y, 46 + 20 * a, '255,70,60', .55 * a, 'screen', .5); }
};
const keepStep = lt => easeIO(seg(lt, STEP_T(), STEP_T() + .3));
function keeperE(k, lt) {
  const K = KEEP[k], dome = K.dome(), step = keepStep(lt), dx = -46 * step;
  /* the swat: the nearest ding of this keeper */
  let sw = 0, tD = -9;
  for (const [i, t] of DINGS) if (i === k && lt >= t - .05 && lt < t + .6) { tD = t; sw = sstep(lt, t, t + .05) * (1 - sstep(lt, t + .16, t + .42)); }
  const hop = Math.max(0, Math.sin(seg(lt, HOP_T(), HOP_T() + .2) * PI)) * 7;
  const path = u => [K.x + dx * 0 - 46 * easeIO(seg(u, STEP_T(), STEP_T() + .3)), K.fl];
  const o = S14.walk(K.ctor, path, lt, { s: SS, stride: 30, t: lt, who: K.who, plant: true, lift: hop, expr: 'neutral' });
  const crouch = .1 + .02 * Math.sin(lt * 6 + k);
  o.squash = crouch * (1 - sw); o.legs = step > 0 && step < 1 ? undefined : 'splay';
  const toDome = Math.sign(dome[0] - o.x) || 1;
  o.look = sw > .2 ? [toDome * .9, -.5] : [toDome * .75, -.35];
  o.expr = sw > .3 ? 'angry' : 'neutral'; o.lid = sw > .3 ? undefined : .3;
  const ready = [1.22, .22];
  o.arms = { l: ready, r: ready }; o.hand = { l: 'open', r: 'open' };
  if (sw > 0) { const side = toDome > 0 ? 'r' : 'l'; o.arms[side] = 'reach'; o.grip = { [side]: lerpA(gripFor(o, side, o.x + toDome * 42, o.y - 78), gripFor(o, side, dome[0], dome[1] + 4), sw) }; o.hand[side] = 'flat'; leanO(o, toDome * .2 * sw); }
  return o;
}
function domeA(k, lt) {   /* how lit a keeper's dome is: a pre-glow, one frame of full red, then off (the swat) */
  let a = 0;
  for (const [i, t] of DINGS) if (i === k) { const u = lt - t; if (u >= 0 && u < .09) a = Math.max(a, .5 + .5 * Math.sin(u * 70)); }
  return a;
}
function melonE(lt) {
  const r = RC('office');
  const o = mkMelon({ x: r.x0 + 150, y: r.floor - 42, s: SS * 1.22, noLegs: true, t: lt, who: 'melon', expr: 'happy', look: [.2, -.1], plant: true });
  o.arms = { l: 'rest', r: 'rest' }; o.face = { curve: 1.1 };
  return o;
}
function drawShotE(lt) {
  const calls = new Array(40).fill(0);
  for (const [i, t] of DINGS) { const u = lt - t; if (u >= 0 && u < .12) calls[(i * 7 + Math.floor(t * 3)) % 40] = 1; }
  const rooms = { med: { pens: 1 }, shower: { stash: 4, bulge: .5, door: 0 }, station: { calls }, office: {} };
  S14.back(lt, { rooms, t: lt });
  for (let k = 0; k < 4; k++) { const d = KEEP[k].dome(); callDomeDraw(d[0], d[1], domeA(k, lt)); }
  const list = [{ y: RC('office').floor, o: melonE(lt) }];
  for (let k = 0; k < 4; k++) list.push({ y: KEEP[k].fl, o: keeperE(k, lt) });
  for (const it of list) drawChar(it.o);
  S14.front(lt, { rooms });
  for (const [i, t] of DINGS) { const u = (lt - t - .08) / .35; if (u > 0 && u < 1) { const d = KEEP[i].dome(); ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(d[0], d[1], u, { r0: 8, r1: 54, lw: 4, alpha: .8, color: '255,230,200' }); ctx.restore(); } }
}
/* the HUD of this shot: the tag, then RESPONSE 0:09 (green, never moving), STAFFING UNCHANGED, and on "Position" POSITION CHANGED */
function overE(lt) {
  fieldTag(lt, BEHAVIORS[3], 14.22, 15.7);
  const a = sstep(lt, 15.78, 16.0) * (1 - sstep(lt, 19.3, 19.44)); if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a;
  const x = 560, y = 52, w = 472, h = 124, pop = lerp(.94, 1, easeBack(seg(lt, 15.78, 16.05)));
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(pop, pop); ctx.translate(-(x + w / 2), -(y + h / 2));
  const p = UI.panel([x, y, w, h], { id: 'resp14', kind: 'panel', fill: 'rgba(6,22,14,.84)', stroke: GREEN_HUD, lw: 4, r: 22, pad: 14, shadow: 16 });
  regOverlay([x, y, x + w, y + h], 'resp14');
  UI.label('0:09', x + 116, y + h / 2 + 2, { size: 92, font: 'Bangers', fill: GREEN_HUD, spacing: 3, cid: 'resp14', center: false });
  UI.lines([{ t: 'CALL LIGHT', size: 31 }, { t: 'RESPONSE', size: 31 }], x + 232, y + h / 2 - 12, { fill: '#d6ffe6', weight: 900, spacing: 2, align: 'left', v: 'mid', lh: 1.25, cid: 'resp14', maxW: 206 });
  V2.glow && null;
  ctx.restore();
  const b = sstep(lt, 16.8, 17.0) * (1 - sstep(lt, 19.3, 19.44)); if (b > .01) {
    const chg = lt >= STEP_T(), col = chg ? AMBER : GREEN_HUD, str = chg ? 'POSITION CHANGED' : 'STAFFING UNCHANGED';
    ctx.save(); ctx.globalAlpha *= b;
    const pill = UI.pill(str, 1032, 214, { anchor: 'right', size: 32, weight: 900, spacing: 3, ink: col, fill: 'rgba(6,22,14,.84)', stroke: col, lw: 3.4, padX: 24, h: 58, id: 'staff14' });
    regOverlay([pill.x0, pill.y0, pill.x1, pill.y1], 'staff14');
    ctx.restore();
  }
}

// ------------------------------------------------------------------ SHOT F: THE DISPLAY (n6 + a1, 19.46 to the end). The Administrator's office: he puffs up and fans a half-circle of pizza boxes behind him like a peacock's tail (the pizzabox cue 22.03), struts and shimmers, a rim light and sparkles on the reveal
// (sparkle 22.33), "We love surveys!" (22.23); a staff member watches from the doorway in resigned silence.
const OFFR = RC('office'), TAIL_R = 98;
const MEL_X = OFFR.x0 + 112, MEL_S = SS * 1.1, MEL_Y = OFFR.floor;
const fanK = lt => { const k = seg(lt, CUE.pizzabox, CUE.pizzabox + .34); return k <= 0 ? 0 : easeBack(k) * .96 + .04 * k; };
/* a feather of the tail: a pizza-box lid standing on end (kraft board, a darker shaft, a pizza emblem at the tip like the eye of a peacock feather) */
function featherLid(len, w, tone) {
  ctx.fillStyle = g2(-w / 2, 0, w / 2, 0, [[0, tone[0]], [1, tone[1]]]); rr(-w / 2, -len, w, len, 6); ctx.fill(); outline(2.4); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,80,30,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -len + 22); ctx.stroke();
  ctx.fillStyle = '#c23a2b'; ctx.fillRect(-w / 2 + 1.5, -12, w - 3, 5);
  const ey = -len + w * .62;
  ctx.fillStyle = '#7a4a14'; ell(0, ey, w * .46, w * .46); ctx.fill();
  ctx.fillStyle = '#e8a63a'; ell(0, ey, w * .4, w * .4); ctx.fill(); ctx.strokeStyle = '#8a4a12'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#c23a2b'; for (const [x, y] of [[-.14, -.12], [.12, -.1], [-.02, .08], [.14, .12], [-.16, .1]]) { ell(x * w, ey + y * w, w * .07, w * .07); ctx.fill(); }
  ctx.fillStyle = '#ffd84a'; ell(-w * .1, ey - w * .22, w * .06, w * .04); ctx.fill();
}
/* the fan is an ellipse (the office is narrow and tall): the feathers at the top are the longest, the ones at the sides short */
const tipR = th => 1 / Math.sqrt(Math.pow(Math.cos(th) / 112, 2) + Math.pow(Math.sin(th) / 170, 2));
const TAIL = (() => { const out = []; for (let i = 0; i < 9; i++) { const th = lerp(-PI * .97, -PI * .03, i / 8); out.push({ th, len: Math.max(46, tipR(th) - 44), w: 36, tone: ['#d9b878', '#b8924f'], layer: 0, i }); } for (let i = 0; i < 8; i++) { const th = lerp(-PI * .97, -PI * .03, (i + .5) / 8); out.push({ th, len: Math.max(40, (tipR(th) - 44) * .72), w: 38, tone: ['#f0dca8', '#d4b878'], layer: 1, i: i + 9 }); } return out; })();
function drawTail(lt, cx, cy) {
  const k = fanK(lt); if (k <= .01) return;
  const shim = lt - CUE.pizzabox;
  for (const f of TAIL) {
    const st = cl01((k - (1 - f.i / 17) * .15) / .85), spread = easeBack(st) * .96 + .04 * st, th = lerp(-PI / 2, f.th, Math.min(1.12, spread)), wob = .035 * Math.sin(shim * 7 + f.i * 1.9) * k, R0 = 30;
    ctx.save(); ctx.translate(cx + Math.cos(th) * R0, cy + Math.sin(th) * R0); ctx.rotate(th + PI / 2 + wob); ctx.scale(.5 + .5 * k, .55 + .45 * k);
    ctx.shadowColor = f.layer ? 'rgba(255,224,160,.4)' : 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8;
    featherLid(f.len, f.w, f.tone); ctx.restore();
  }
}
function sparklesF(lt, cx, cy) {
  const t0 = CUE.sparkle; if (lt < t0 - .02) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    const born = t0 + (i % 8) * .05 + (i > 7 ? .55 : 0), u = (lt - born) / .5; if (u < 0 || u > 1) continue;
    const th = lerp(-PI * .96, -PI * .04, (i * 5 % 11) / 10), R = (i % 2 ? 80 : 108) * (1 + .1 * u), x = cx + Math.cos(th) * R, y = cy + Math.sin(th) * R, s = 10 * Math.sin(u * PI) * (1 + hash(i) * .8);
    ctx.fillStyle = `rgba(255,248,214,${Math.sin(u * PI)})`; ctx.beginPath();
    for (let q = 0; q < 8; q++) { const a = q * PI / 4, r = q % 2 ? s * .28 : s; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function melonF(lt) {
  const k = fanK(lt), strut = sstep(lt, B('n6').s + .5, B('n6').s + 1.6), pre = lt < CUE.pizzabox;
  const x = MEL_X + 26 * Math.sin((lt - B('n6').s) * 2.2) * strut * (1 - k * .6), puff = 1 + .1 * sstep(lt, CUE.pizzabox - .5, CUE.pizzabox + .1);
  const o = mkMelon({ x, y: MEL_Y, s: MEL_S, t: lt, who: 'melon', expr: 'happy', look: [0, -.2], plant: true, sx: puff, sy: puff });
  o.face = { curve: 1.25 }; o.rot = .035 * Math.sin((lt - B('n6').s) * 4.4) * strut;
  o.arms = { l: k > .3 ? [2.1, .5] : 'rest', r: k > .3 ? [2.1, .5] : 'rest' }; o.hand = { l: 'open', r: 'open' };
  if (lt >= B('a1').s) { o.look = [0, -.35]; o.arms = { l: [2.5 + .15 * Math.sin(lt * 9), .3], r: [2.5 + .15 * Math.sin(lt * 9 + 1), .3] }; }
  /* walking: little steps while he struts */
  if (strut > 0 && k < .3) { const fn = u => [MEL_X + 26 * Math.sin((u - B('n6').s) * 2.2) * sstep(u, B('n6').s + .5, B('n6').s + 1.6), MEL_Y]; const w = S14.walk(mkMelon, fn, lt, { s: MEL_S, stride: 26, t: lt, who: 'melon', expr: 'happy', look: [0, -.2], plant: true, sx: puff, sy: puff }); w.face = o.face; w.rot = o.rot; w.arms = o.arms; w.hand = o.hand; return w; }
  return o;
}
function watcherF(lt) {
  const o = mkStraw({ x: OFFR.x1 + 2, y: OFFR.floor, s: SS, t: lt, who: 'straw', plant: true, expr: 'dead', lid: .55, look: [-.95, .05] });
  o.arms = { l: 'rest', r: 'rest' };
  const sigh = sstep(lt, 22.9, 23.4) * (1 - sstep(lt, 23.5, 23.9)); o.lid = .55 + .15 * sigh; o.squash = .03 * sigh;
  return o;
}
function drawShotF(lt) {
  const rooms = { office: {}, med: { pens: 1 } };
  S14.back(lt, { rooms, t: lt });
  const m = melonF(lt), c = bodyCentre(m);
  /* the rim light on the reveal: a warm glow behind the fan */
  const gl = sstep(lt, CUE.pizzabox, CUE.pizzabox + .3) * (1 - sstep(lt, CUE.sparkle + 1.0, CUE.sparkle + 1.6));
  V2.glow(MEL_X, c[1] - 30, 190, '255,214,140', .5 * gl, 'screen', .5);
  drawTail(lt, MEL_X, c[1] - 6);
  S14.front(lt, { rooms });
  drawChar(m);
  drawChar(watcherF(lt));
  sparklesF(lt, MEL_X, c[1] - 6);
  if (lt >= CUE.sparkle && lt < CUE.sparkle + .2) V2.flare(...(() => { const q = ctx.getTransform(); return [q.a * (MEL_X + 8) + q.e, q.d * (c[1] - 56) + q.f]; })(), .5 * (1 - (lt - CUE.sparkle) / .2));
}
function overF(lt) { fieldTag(lt, BEHAVIORS[4], B('n6').s + .05, CUE.pizzabox + .25); }

// ------------------------------------------------------------------ THE SCENE
const houseBase = (lt, rooms) => { S14.back(lt, { rooms, t: lt }); S14.front(lt, { rooms }); };
const SC = {
  shot: lt => shotOf(lt),
  cam(lt) {
    const sh = shotOf(lt);
    if (sh === 'd') { const c = camAt(lt); zoomTo(c.x, c.y, c.z); CAM.shake = 0; return; }
    const c = camAt(lt); zoomTo(c.x, c.y, c.z);
    const bt = CUE.crash, w = (lt >= WH.ab[0] && lt < WH.ab[1]) ? easeIO(seg(lt, WH.ab[0], WH.ab[1])) : 0;
    CAM.shake = lt >= bt && lt < bt + 1 ? 9 * Math.exp(-(lt - bt) / .22) : 0;
    CAM.r = .012 * Math.sin(w * PI) * -1;
  },
  draw(lt) {
    const sh = shotOf(lt);
    if (sh === 'd') drawTrapWorld(lt);
    else if (sh === 'a') drawShotA(lt);
    else if (sh === 'b') drawShotB(lt);
    else if (sh === 'c') drawShotC(lt);
    else if (sh === 'e') drawShotE(lt);
    else drawShotF(lt);
  },
  fx(lt) {
    if (shotOf(lt) === 'd') return trapFx(lt);
    return { bloom: .4, vignette: .42, grain: .045, contrast: .14, sat: .12, tint: [['#ffb870', .06, 'soft-light']] };
  },
  blur: lt => blurAt(lt),
  over(lt) {
    const sh = shotOf(lt);
    if (sh === 'd') { trapOver(lt); return; }
    if (lt < 4.3) fieldTag(lt, BEHAVIORS[0], .78, 4.1);
    if (sh === 'b') overB(lt);
    if (sh === 'c') fieldTag(lt, BEHAVIORS[2], 10.12, 12.55);
    if (sh === 'e') overE(lt);
    if (sh === 'f') overF(lt);
  },
};
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.adapt = SC;
window.FP14J = { kitSprite, jdraw, JB, restY, ball, puff, floorShadow, KMAP };
})();
