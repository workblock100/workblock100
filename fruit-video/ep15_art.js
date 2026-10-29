'use strict';
/* ART STATUS: v1 (E15-ART). SHIFT HAPPENS, Episode 15 art kit, shared by every Episode 15 scene module. Exposed as window.A15. Constructors return the options object for drawChar,
 * like A7 / A10 / A13 / A14. Registers through the engine's EXT hooks (kinds arti, onion, tomato, broc, carrot, bind; everything else prefixed fp15_), so earlier episodes are untouched.
 * The one-screen API (constructors, options, props, accessories, the yaw notes) is in GUIDE_ART15.md. Owner: E15-ART.
 *
 * Design rules (the turnaround rig, `yaw`, is built at the same time by E15-TURN): every body is a spheroid, a dome or a cone, rotationally symmetric about its vertical axis; the face is the
 * engine's (front only); every decoration that has to turn with the body (artichoke petals, broccoli florets, onion meridians, carrot ridges and fronds, the tomato calyx) is a LIST of items
 * with a longitude, drawn through lon -> x = R sin(lon + yaw), width * cos(lon + yaw), so o.yaw (body) and o.headYaw (head) are honoured by my own hooks (kind field yawOwn = true).
 * No text is ever drawn in a sprite: name plates, badges and tags are empty plates whose rectangle A15.plate(o, name) returns; the scene lettering goes through UI.
 */
(() => {
if (typeof KINDS === 'undefined' || typeof EXT === 'undefined' || typeof V2 === 'undefined' || typeof V2C === 'undefined') return;
const A = window.A15 = {};
const SC = .44, G = 1316;   /* the dollhouse scale of a standing adult, and its floor line */
const sr = (i, s = 0) => hash(i * 3.17 + s * 11.3 + 1.3);   /* seeded noise 0..1 */
const rgbaOf = (c, a = 1) => V2.rgba(c, a);
const mixc = (a, b, t) => V2.rgba(V2.mix(a, b, clamp(t)), 1);
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };   /* smoothstep */
const YI = o => (V2C.yawInfo ? V2C.yawInfo(o) : null);           /* E15-TURN's normalised angles { y, h, ... } when the rig is present */
const yawOf = o => { const Y = YI(o); return Y ? Y.y : (o.yaw || 0); };   /* the body's turn (radians, 0 = front) */
const headYawOf = o => { const Y = YI(o); return Y ? Y.h : (o.headYaw != null ? o.headYaw : (o.yaw || 0)); };   /* the head's turn: the face leads the body in a conversation */
const sgnY = x => x < 0 ? -1 : 1, sstepY = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
/* the angle the FACE features are painted at (E15-TURN: past about 40 degrees the face turns a little less than the head so the near eye and the mouth stay readable): a copy of its faceAng, so what I tie to the face lines up with it */
const faceAngOf = o => { const h = headYawOf(o); return V2C.yawInfo ? h - sgnY(h) * .26 * sstepY(.6, 1.45, Math.abs(h)) * (1 - sstepY(1.75, 2.5, Math.abs(h))) : h; };
const tOf = o => (o.t != null ? o.t : (typeof T === 'number' ? T : 0));
/* run a section of this file in isolation: a bug in one character can never stop the others from registering */
const sec = (name, fn) => { try { fn(); } catch (e) { console.error('A15 section ' + name + ': ' + e.message); (A.errors = A.errors || []).push(name + ': ' + e.message); } };

// ------------------------------------------------------------------ light: the room's key light on a point of a surface (normal n, screen space, z toward the viewer)
function lamb(nx, ny, nz) {
  const L = V2.LIGHT, kx = L.key[0], ky = L.key[1], kz = .62, kl = Math.hypot(kx, ky, kz);
  return clamp((nx * kx + ny * ky + nz * kz) / (kl * Math.hypot(nx, ny, nz) || 1));
}
/* a base colour lit by lam (0 shadow .. 1 full key): shadow colour in the dark, key colour on the light; follows V2.setLight (the dollhouse, a lamp, the TV) */
function lit(base, lam, amt = 1) {
  const L = V2.LIGHT;
  const dk = V2.mix(base, L.shadow, clamp(.62 * (1 - lam) * amt * Math.min(1.6, L.shadowA / .3)));
  const wm = V2.mix(dk, L.keyColor, clamp((lam - .5) * .7) * .3 * amt * Math.min(1.6, L.keyA / .22));
  return V2.rgba(wm, 1);
}
/* a point on a vertical-axis surface of revolution: radius R at height y, longitude lon (0 = facing the viewer), turned by yaw. x, y in sprite space, z = how much it faces us (-1..1) */
function onSurf(R, y, lon, yaw) { const a = lon + yaw; return { x: R * Math.sin(a), y, z: Math.cos(a), a }; }
const clampL = (a, b, c) => Math.max(b, Math.min(c, a));

// ------------------------------------------------------------------ the six kinds
Object.assign(KINDS, {
  /* Mr. Artichoke: a dome of eleven rings of scale-leaves; rx / ry / eye / mouth fields are RE-SET by A15.artichoke() as the layers peel (the base values are in AR below) */
  arti: { rx: 118, ry: 132, shape: 'arti', tex: 'arti', c: ['#bcd78c', '#7ea748', '#2f5521'], eyeY: -26, eyeX: 31, mouthY: 22, er: 17, mw: 19, leg: 58, hip: 42, arm1: 42, arm2: 38, shoe: '#2a2130', shoe2: '#4b4254', yawOwn: true,
    shoulderAt: (side, k) => k.heartMode ? [side * (k.rx + 3), k.ry * .5] : [side * k.rx * .92, k.ry * .1] },
  /* Onion (Compliance): a papery bulb with a pointed neck */
  onion: { rx: 106, ry: 124, shape: 'onion', tex: 'onion', c: ['#faeabb', '#e0b869', '#98692b'], eyeY: -10, eyeX: 35, mouthY: 40, er: 21, mw: 20, leg: 78, hip: 34, shoe: '#4b3b2d', shoe2: '#8a7058', yawOwn: true },
  /* Tomato (HR): a glossy oblate sphere with a green calyx */
  tomato: { rx: 128, ry: 106, shape: 'tomato', tex: 'tomato', c: ['#ff9d8a', '#e6321f', '#7b0e0a'], eyeY: -18, eyeX: 42, mouthY: 22, er: 22, mw: 25, leg: 84, hip: 42, shoe: '#f4effc', shoe2: '#a98bd8', yawOwn: true },
  /* Broccoli (Administrator of Greenleaf): a pale green stalk body under a huge crown of florets */
  broc: { rx: 92, ry: 124, shape: 'broc', tex: 'broc', c: ['#dcefb8', '#a6d06c', '#5a8932'], eyeY: -22, eyeX: 33, mouthY: 26, er: 21, mw: 28, leg: 90, hip: 38, arm1: 56, arm2: 52, shoe: '#221c16', shoe2: '#4a3a2c', yawOwn: true },
  /* Carrot (charge nurse): a tall cone; the shoulders are set by k.shoulderAt (see the shoulder hook below) */
  carrot: { rx: 84, ry: 168, shape: 'carrot', tex: 'carrot', c: ['#ffb472', '#f2731d', '#a03c06'], eyeY: -92, eyeX: 29, mouthY: -52, er: 18, mw: 19, leg: 74, hip: 17, arm1: 54, arm2: 50, shoe: '#f4f6f2', shoe2: '#2f8f5b', yawOwn: true,
    shoulderAt: side => [side * 76, -52] },
  /* Binder, the helpful assistant: a flat binder clip (a trapezoid; thin from the side). Drawn entirely by A15 (face, handles); the engine only fills the trapezoid */
  bind: { rx: 104, ry: 92, shape: 'bind', tex: 'bind', c: ['#54565f', '#22232a', '#08080c'], eyeY: -20, eyeX: 38, mouthY: 42, er: 35, mw: 60, leg: 0, hip: 0, yawOwn: true, flat: true },
});
Object.assign(TOPS, { onion: 214, tomato: 142, broc: 214, carrot: 300, bind: 112 });   /* arti follows ry (k.ry * 1.05) */

/* ONE extension of the engine, guarded: a kind may set k.shoulderAt(side) -> [x, y] so a cone or a stalk gets its arms where its shoulders are. Every other kind falls through untouched. */
if (typeof shoulder === 'function' && !shoulder.fp15) {
  const orig = shoulder;
  const patched = function (k, side) { return k && k.shoulderAt ? k.shoulderAt(side, k) : orig.apply(this, arguments); };
  patched.fp15 = true;
  try { window.shoulder = patched; } catch (e) { /* read-only global: the carrot's arms then use the default shoulder */ }
}

// ------------------------------------------------------------------ faces (EXPR presets read by v2_char: ang, raise, curve, lid, wide, pup, asym, bags, arch)
Object.assign(EXPR, {
  arti_ceo: { ang: .1, raise: 2, curve: .5, lid: .4, wide: .95, pup: 1 },            /* calm, heavy-lidded, a slight smile */
  arti_warm: { ang: -.05, raise: 5, curve: .9, lid: .24, wide: 1, pup: 1 },
  arti_stern: { ang: .32, raise: -2, curve: -.2, lid: .46, wide: .95, pup: .95 },
  arti_heart: { ang: -.5, raise: 6, curve: -.45, lid: 0, wide: 1.05, pup: 1.5 },     /* the heart: two big dot eyes, anxious */
  onion_cry: { ang: -.5, raise: 6, curve: -.7, lid: .12, wide: 1.02, pup: .95 },
  onion_stoic: { ang: -.28, raise: 4, curve: -.2, lid: .22, wide: 1, pup: .95 },      /* trying very hard not to cry */
  onion_wail: { ang: -.66, raise: 8, curve: -.95, lid: .32, wide: 1.05, pup: .85 },
  tom_fruit: { ang: -.2, raise: 10, curve: 1, lid: 0, wide: 1.1, pup: 1.08 },          /* bright, sweet */
  tom_veg: { ang: .3, raise: -3, curve: -.18, lid: .34, wide: .95, pup: .94 },         /* stern, crisp */
  tom_cheer: { ang: -.22, raise: 12, curve: .9, lid: 0, wide: 1.1, pup: 1.1 },         /* the over-friendly default */
  broc_boom: { ang: -.08, raise: 4, curve: 1, lid: 0, wide: 1.02, pup: 1 },
  broc_stern: { ang: .2, raise: -2, curve: -.1, lid: .2, wide: 1, pup: .95 },
  carrot_calm: { ang: -.02, raise: 2, curve: .45, lid: .14, wide: 1, pup: 1 },
  carrot_polite: { ang: -.1, raise: 4, curve: .7, lid: .1, wide: 1, pup: 1 },
  carrot_firm: { ang: .2, raise: 0, curve: .1, lid: .18, wide: 1, pup: .96 },
  bind_happy: { ang: -.1, raise: 6, curve: 1, lid: 0, wide: 1, pup: 1 },
});

// ------------------------------------------------------------------ plates: empty rectangles for the scene's lettering (sprite space, origin = body centre; A15.plate converts them)
const PLATES = {};   /* name -> { kind, r: [x0, y0, x1, y1], rot } filled in by the accessories below; scenes read A15.plate(o, name) */
A.PLATES = PLATES;
/* where the body centre of a sprite is on the current canvas (replicates drawChar: the feet are at o.y, the centre sits legLen + ry * .9 above them, scaled by s) */
A.centre = o => {
  const k = KINDS[o.kind], s = o.s || 1, leg = (o.noLegs || o.center) ? 0 : (k.leg || 90), up = o.center ? 0 : (leg + k.ry * .9);
  return [o.x, o.y - (o.lift || 0) - s * up];
};
/* the plate's rectangle in the CURRENT canvas coordinates: { x, y (its centre), w, h, rot, size (a font size that fits) }. Call it AFTER constructing the options (the artichoke's size depends on the peel) */
A.plate = (o, name) => {
  const P = PLATES[name]; if (!P) return null;
  const s = o.s || 1, [cx, cy] = A.centre(o), r = typeof P.r === 'function' ? P.r(o, KINDS[o.kind]) : P.r;
  return { x: cx + s * (r[0] + r[2]) / 2, y: cy + s * (r[1] + r[3]) / 2, w: s * (r[2] - r[0]), h: s * (r[3] - r[1]), rot: (typeof P.rot === 'function' ? P.rot(o) : (P.rot || 0)) + (o.rot || 0), size: s * (r[3] - r[1]) * .62 };
};

// ------------------------------------------------------------------ species tags (the scenes' UI.tag strings; layers is the artichoke's live count)
const TAGS = {
  arti: ['Artichoke', 'Cynara cardunculus', 'CEO (LAYERS: 11)'],
  onion: ['Onion', 'Allium cepa', 'COMPLIANCE'],
  tomato: ['Tomato', 'Solanum lycopersicum', 'HR (FRUIT OR VEGETABLE: PENDING)'],
  broc: ['Broccoli', 'Brassica oleracea', 'ADMINISTRATOR, GREENLEAF'],
  carrot: ['Carrot', 'Daucus carota', 'CHARGE NURSE, GREENLEAF'],
  bind: ['Binder', 'Fibula auxiliaris', 'ASSISTANT'],
};
const TAG_ALIAS = { tom: 'tomato', broccoli: 'broc', artichoke: 'arti', binder: 'bind' };
/* A15.tagFor('arti') -> { common: 'Artichoke', latin: 'Cynara cardunculus', role: 'CEO (LAYERS: 11)', lines: [the three] } (kind names and voice ids both work; pass the live layer count n to get LAYERS: n) */
A.tagFor = (kind, layers) => {
  const k = TAG_ALIAS[kind] || kind, T3 = TAGS[k]; if (!T3) return null;
  const role = k === 'arti' && layers != null ? `CEO (LAYERS: ${Math.max(0, Math.round(layers))})` : T3[2];
  return { common: T3[0], latin: T3[1], role, lines: [T3[0], T3[1], role] };   /* lines = the three UI.tag lines (common name, Latin name in italics, role) */
};
/* shared pieces for the sections below */
A._ = { sr, rgbaOf, mixc, sm, yawOf, headYawOf, tOf, sec, lamb, lit, onSurf, SC, G, clampL };


// ================================================================== Mr. Artichoke (CEO of Greenleaf): eleven layers that peel, a heart at the core
/* The model: the artichoke is a nest of eleven SHELLS (layers). Each shell is a whole dome of overlapping petals in rows (11 rows on the outermost, fewer on the inner ones), 7% smaller than the
 * one outside it. Only the outermost attached shell shows. Peeling a layer: all of its petals fold outward (the top ones first, like a flower opening), drop with a tumble and fade, and the body
 * underneath is the next, smaller shell, so the figure shrinks bottom-anchored (the legs stay) until only the heart (a fifth of the body width) is left. The engine's per-kind fields (rx, ry,
 * eye and mouth) are re-set by A15.artichoke() every frame from the peel (a pure function of the options) and the body path is rebuilt (PATHS.arti); the leaving shell is drawn unclipped in the
 * accessory fp15_arti ('front'), the attached shell in the texture hook (clipped, lit by the engine). Every petal is an item with a longitude, so it turns with o.yaw. */
const AR = { rx: 118, ry: 132, N: 11, eyeX: 31, eyeY: -26, mouthY: 22, er: 17, mw: 19, leg: 58, hip: 42 };
const shellF = j => 1 - .07 * j;   /* the scale of shell j (0 = outermost): 1 .. .30; the heart is .2 */
const rowsOf = j => Math.round(lerp(11, 6, j / (AR.N - 1)));
function artiProfile(v) {   /* half-width (0..1) at height fraction v (0 base .. 1 apex): an egg with a flat base and a rounded point */
  v = clamp(v); const vm = .38, d = v < vm ? (vm - v) / vm : (v - vm) / (1 - vm), e = v < vm ? 2.3 : 1.85;
  return Math.pow(Math.max(0, 1 - Math.pow(d, e)), 1 / e);
}
function artiState(o) {
  const t = tOf(o), N = AR.N;
  let m = o.peelTo != null ? N - o.peelTo : (o.peel || 0) * N;
  m = clamp(m, 0, N);
  const mi = Math.floor(m + 1e-9), fr = m - mi;
  const kL = (fr > 1e-4 && mi < N) ? mi : -1, q = kL >= 0 ? fr : 0;      /* the shell that is leaving, and how far (0..1) */
  const sBody = kL >= 0 ? kL + 1 : mi, heart = sBody >= N;                 /* the outermost shell still attached (N = none: only the heart) */
  const fA = kL >= 0 ? shellF(kL) : shellF(Math.min(sBody, N - 1)), fB = heart ? .2 : shellF(sBody);
  const fb = kL >= 0 ? lerp(fA, fB, easeIO(seg(q, 0, .3))) : fB;           /* the body shrinks to the next shell in the first third of a leaving layer */
  const fs = heart ? .32 : Math.max(.34, Math.pow(fb, .8));                 /* the face shrinks more slowly than the dome */
  let pulse = 1;
  if (heart) { const b = (t * 1.5) % 1; pulse = 1 + .085 * Math.pow(Math.max(0, Math.sin(b * PI * 2.2)), 3) + .04 * Math.pow(Math.max(0, Math.sin((b - .3) * PI * 2.2)), 3); }
  return { m, kL, q, sBody, heart, fb, fs, pulse, t, layers: Math.max(0, N - mi) };
}
function artiDims(st) {
  const sc = clamp((st.fb - .2) / .8);   /* 0 = only the heart is left, 1 = the whole artichoke: arms, legs and hips shrink a little with it */
  if (st.heart) {
    const p = st.pulse, ry = AR.ry * .17 * p;
    return { rx: AR.rx * .2 * p, ry, eyeX: AR.eyeX * .32, er: AR.er * .32 * (1 + (p - 1) * .5), mw: AR.mw * .3, eyeY: -.12 * ry, mouthY: .3 * ry, hip: 14, arm1: 17, arm2: 15, leg: 40, heartMode: true };
  }
  const rx = AR.rx * st.fb, ry = AR.ry * st.fb;
  return { rx, ry, eyeX: AR.eyeX * st.fs, er: AR.er * st.fs, mw: AR.mw * st.fs, eyeY: AR.eyeY * st.fb, mouthY: AR.mouthY * st.fb, hip: 14 + 28 * sc, arm1: 42 * (.5 + .5 * sc), arm2: 38 * (.5 + .5 * sc), leg: AR.leg * (.7 + .3 * sc), heartMode: false };
}
function heartPath(p, W, H) {   /* a soft heart: two lobes, a dip, a rounded point */
  p.moveTo(0, H * .96);
  p.bezierCurveTo(-W * .5, H * .64, -W * 1.2, H * .12, -W * .99, -H * .4);
  p.bezierCurveTo(-W * .84, -H * .98, -W * .12, -H * 1.02, 0, -H * .4);
  p.bezierCurveTo(W * .12, -H * 1.02, W * .84, -H * .98, W * .99, -H * .4);
  p.bezierCurveTo(W * 1.2, H * .12, W * .5, H * .64, 0, H * .96);
  p.closePath();
}
function artiPath(st, d) {   /* the silhouette of the outermost shell: the egg profile with a saw tooth at every row (the petal tips flare out) */
  const p = new Path2D(), Hh = d.ry, Wd = d.rx;
  if (st.heart) { heartPath(p, Wd, Hh); return p; }
  const R = rowsOf(Math.min(st.sBody, AR.N - 1)), S = 5, tooth = .075, pts = [];
  for (let r = 0; r < R; r++) for (let j = 0; j <= S; j++) {
    const f = j / S, v = (r + f * .94) / R;
    pts.push([Wd * artiProfile(v) * (1 + tooth * Math.pow(f, 1.5)), Hh - 2 * Hh * v]);
  }
  p.moveTo(0, Hh);
  for (const [x, y] of pts) p.lineTo(x, y);
  p.lineTo(0, -Hh);
  for (let i = pts.length - 1; i >= 0; i--) p.lineTo(-pts[i][0], pts[i][1]);
  p.closePath();
  return p;
}
EXT.shape.arti = (p, k) => { const st = artiState({}); p.addPath(artiPath(st, { rx: k.rx, ry: k.ry })); };   /* the plain outline, if something asks the engine for it before a constructor has run */
function applyArti(st) {   /* set the kind's dimensions and the cached body path for this state (called by the constructor and again by the accessory, before the body is drawn) */
  const d = artiDims(st); Object.assign(KINDS.arti, d); PATHS.arti = artiPath(st, d); return d;
}
const lerpFace = (a, b, t) => { const r = {}; for (const key of ['ang', 'raise', 'curve', 'lid', 'wide', 'pup']) r[key] = lerp(a[key] ?? 0, b[key] ?? 0, t); return r; };
const ARTI_ACC = ['fp15_arti'];
/* A15.artichoke(o): Mr. Artichoke. Options: peel 0..1 (all eleven layers gone at 1) or peelTo n (n layers left; may be fractional: 4.5 = the layer in between is half off), expr (arti_ceo default,
 * arti_warm, arti_stern, arti_heart; the face drifts toward arti_heart as the layers go), anchor 'centre' (the sprite is moved so the middle of the figure stays put while it shrinks: for the TV;
 * default 'base': the feet stay), frozen (true: the laggy video freezes: mouth caught mid-vowel, the left eye half shut, the petals twitch once; pass frozenAt = the time it froze, t = now),
 * glitch (see A15.draw), tie (0..1, default: falls off with layer 3), lanyard (default on), pin (default on, falls with layer 5), peelFall (how far petals fall, default 190) */
A.artichoke = o => {
  o = o || {};
  const seed = o.seed ?? 151, frozen = !!o.frozen && (o.frozen === true || o.frozen > .5);
  const t = frozen ? (o.frozenAt != null ? o.frozenAt : tOf(o)) : tOf(o);
  const st = artiState(Object.assign({}, o, { t }));
  const d = applyArti(st);
  const r = Object.assign({ kind: 'arti', id: 'arti', who: 'arti', s: SC, y: G, seed, expr: 'arti_ceo', arms: { l: 'rest', r: 'rest' }, lanyard: true, pin: true }, o);
  r.t = t; r.acc = ARTI_ACC.concat((o.acc || []).filter(a => ARTI_ACC.indexOf(a) < 0));
  if (o.anchor === 'centre') { const lg = r.noLegs ? 0 : 1; r.y += r.s * (lg * (d.leg - AR.leg) + .9 * (d.ry - AR.ry)); }
  if (st.heart) { r.colors = o.colors || ['#fcf5d8', '#eedd9f', '#b8a35e']; if (o.noArms == null && !o.heartArms && (st.kL < 0 || st.q > .3)) r.noArms = true; }   /* pale, soft: the artichoke heart, on little legs (heartArms: true gives it arms back); the arms go once the last layer is a third off */
  const mix = sm(1.5, 10.6, st.m), base = EXPR[r.expr] || EXPR.neutral;
  r.face = Object.assign(mix > 0 ? lerpFace(base, EXPR.arti_heart, mix) : {}, o.face || {});
  if (frozen) {   /* the video call froze: no more lip-sync, the mouth stays mid-vowel */
    delete r.who; r.mouthState = { open: .46, spread: .22, teeth: 0 }; r.talk = .46; r.frozenOn = true;
    const dt = tOf(o) - (o.frozenAt != null ? o.frozenAt : tOf(o));
    r.petalTwitch = o.petalTwitch != null ? o.petalTwitch : Math.sin(PI * seg(dt, .06, .34));
  }
  r.peelState = st;
  return r;
};
A.layersLeft = o => artiState(o || {}).layers;   /* the number of layers left (what the tag shows: CEO (LAYERS: n)) */
A.artiState = artiState;

// ---- the shells and their petals: every row of every shell is a LIST of petals with a longitude (turns with o.yaw)
const SHELLS = [];
function shellItems(j) {
  if (SHELLS[j]) return SHELLS[j];
  const R = rowsOf(j), rows = [];
  for (let r = 0; r < R; r++) {
    const cnt = Math.max(5, Math.round(lerp(14, 8, r / (R - 1)) * lerp(1, .66, j / (AR.N - 1)))), its = [];
    for (let i = 0; i < cnt; i++) its.push({ lon: ((i + .5 * (r % 2) + (sr(j * 97 + r * 31 + i, 5) - .5) * .2) / cnt) * TAU - PI, w: .94 + sr(j * 53 + r * 17 + i, 2) * .12, len: .95 + sr(j * 41 + r * 13 + i, 3) * .14, h: sr(j * 29 + r * 7 + i, 9) - .5 });
    rows.push({ cnt, its });
  }
  return (SHELLS[j] = { R, rows });
}
function shellColor(j, r) {   /* the outer layers a deeper green, the inner ones paler; alternate rows and alternate layers a little lighter and darker so the rings can be counted */
  const base = V2.mix('#8fc24a', '#dcef9c', Math.pow(j / (AR.N - 1), .85) * .6);
  const tone = ((r % 2) ? -1 : 1) * .07 + ((j % 2) ? -.03 : .03);
  return V2.mix(base, tone < 0 ? [6, 18, 4] : [255, 255, 232], Math.abs(tone));
}
function rowGeo(Wd, Hh, R, r, cnt) {   /* the band of row r (0 = bottom): a petal is 1.5 bands long and overlaps the row above */
  const vb = (r + .15) / R, vt = Math.min(1, (r + 1.62) / R), Rm = Wd * artiProfile((vb + vt) / 2);
  return { Wd, Hh, R, vb, vt, Wp: PI * Rm / cnt * 1.3 };
}
const TIP = [122, 74, 142];   /* the purple of the petal tips */
function drawPetal(g, it, j, a, col, tw, fly) {
  const ca = Math.cos(a), sa = Math.sin(a), cw = Math.max(ca, .1), M = 8, Ls = [], Rs = [], span = (g.vt - g.vb) * it.len;
  let bx = 0, by = 0, tx = 0, ty = 0;
  for (let i = 0; i <= M; i++) {
    const u = i / M, v = g.vb + span * u, Rv = g.Wd * artiProfile(v) * (1 + .1 * u * u);
    const xc = Rv * sa + tw * 4 * u * Math.sin(it.lon * 5 + j), y = g.Hh - 2 * g.Hh * v - tw * 3 * u;
    const hw = g.Wp * it.w * Math.pow(Math.max(0, 1 - Math.pow(u, 1.9)), .7) * cw;
    Ls.push([xc - hw, y]); Rs.push([xc + hw, y]);
    if (i === 0) { bx = xc; by = y; } if (i === M) { tx = xc; ty = y; }
  }
  const vm = (g.vb + g.vt) / 2; let lam = clamp(lamb(sa * .9, -(vm - .38) * 1.1, ca * .9) + it.h * .08);
  if (fly) lam = Math.min(1, lam + .12 * fly);   /* a petal lifting off catches more light */
  ctx.beginPath(); ctx.moveTo(Ls[0][0], Ls[0][1]);
  for (let i = 1; i <= M; i++) ctx.lineTo(Ls[i][0], Ls[i][1]);
  for (let i = M; i >= 0; i--) ctx.lineTo(Rs[i][0], Rs[i][1]);
  ctx.closePath();
  const gr = ctx.createLinearGradient(bx, by, tx, ty);
  gr.addColorStop(0, lit(V2.mix(col, [10, 28, 6], .4), lam * .85)); gr.addColorStop(.5, lit(col, lam)); gr.addColorStop(1, lit(V2.mix(col, [236, 246, 170], .3), lam));
  ctx.fillStyle = gr; ctx.fill();
  const gp = ctx.createLinearGradient(bx, by, tx, ty);
  gp.addColorStop(.6, V2.rgba(TIP, 0)); gp.addColorStop(1, V2.rgba(TIP, .8));
  ctx.fillStyle = gp; ctx.fill();
  ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(26,50,16,.9)'; ctx.lineWidth = 2.1; ctx.stroke();
  ctx.strokeStyle = `rgba(238,248,190,${.1 + .32 * lam})`; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(lerp(bx, tx, .2), lerp(by, ty, .2)); ctx.lineTo(lerp(bx, tx, .76), lerp(by, ty, .76)); ctx.stroke();
}
/* the attached shell: rows from the top (innermost) down, so every row overlaps the one above it; in each row the far petals first */
function drawShell(j, Wd, Hh, yaw, tw) {
  const S = shellItems(j);
  for (let r = S.R - 1; r >= 0; r--) {
    const row = S.rows[r], g = rowGeo(Wd, Hh, S.R, r, row.cnt), L = [], col = shellColor(j, r);
    for (const it of row.its) { const a = it.lon + yaw, ca = Math.cos(a); if (ca > -.14) L.push([ca, it, a]); }
    L.sort((p, q) => p[0] - q[0]);
    for (const [, it, a] of L) drawPetal(g, it, j, a, col, tw, 0);
  }
}
/* the smooth face plate (the CEO's calm, unlined face), in sprite space; hy = the head's turn */
function platOf(k, st, hy) {   /* hy = the angle the face is painted at (faceAngOf) */
  const fs = st.fs, e = k.er, top = k.eyeY - e * 2.7, bot = k.mouthY + k.mw * 1.7 + 6 * fs, c = Math.cos(hy), cy = (top + bot) / 2 + 2 * fs, Rp = k.rx * artiProfile((k.ry - cy) / (2 * k.ry)) * .94;
  return { cx: Rp * Math.sin(hy), cy, rx: (k.eyeX + e * 1.5 + 8 * fs) * Math.max(c, 0), ry: (bot - top) / 2 + 4 * fs, vis: c > .08 };
}
function holeClip(pl, R) {   /* clip to everything except the plate, so petals stop at the face */
  ctx.beginPath(); ctx.rect(-R, -R, R * 2, R * 2);
  if (pl.vis) { ctx.moveTo(pl.cx + pl.rx, pl.cy); ctx.ellipse(pl.cx, pl.cy, pl.rx, pl.ry, 0, 0, TAU, true); }
  ctx.clip('evenodd');
}
function heartSkin(k) {
  const W = k.rx, H = k.ry;
  ctx.fillStyle = V2.grad(0, -H, 0, H, [[0, 'rgba(255,252,226,.5)'], [1, 'rgba(226,186,116,.38)']]); ctx.fillRect(-W * 1.4, -H * 1.4, W * 2.8, H * 2.8);
  ctx.strokeStyle = 'rgba(150,118,56,.32)'; ctx.lineWidth = Math.max(1.2, W * .07); ctx.lineCap = 'round';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * W * .18, H * .92); ctx.quadraticCurveTo(s * W * .95, H * .4, s * W * .74, -H * .3); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(-W * .42, -H * .46, W * .2, H * .12, -.5); ctx.fill();
}
EXT.tex.arti = (o, k, t) => {
  const st = artiState(o), yaw = yawOf(o), hy = faceAngOf(o), R = Math.max(k.rx, k.ry) * 1.5;
  ctx.save();
  if (st.heart) { heartSkin(k); ctx.restore(); return; }
  ctx.fillStyle = 'rgba(22,44,12,.4)'; ctx.fillRect(-R, -R, R * 2, R * 2);   /* the dark inside that shows between the petals */
  const pl = platOf(k, st, hy);
  ctx.save(); holeClip(pl, R); drawShell(st.sBody, k.rx, k.ry, yaw, o.petalTwitch || 0); ctx.restore();
  if (pl.vis) {   /* the plate: smooth skin, feathered into the petals */
    const kc = o.colors || k.c, skin = V2.mix(kc[0], kc[1], .3);
    ctx.save(); ctx.translate(pl.cx, pl.cy); ctx.scale(Math.max(pl.rx, 1), pl.ry);
    const g = ctx.createRadialGradient(-.25, -.3, 0, 0, 0, 1);
    g.addColorStop(0, V2.rgba(V2.mix(skin, [255, 255, 226], .32), 1)); g.addColorStop(.7, V2.rgba(skin, 1)); g.addColorStop(.9, V2.rgba(skin, .85)); g.addColorStop(1, V2.rgba(skin, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
};
/* the stem: a short stub under the dome, between the legs (drawn before the body, so only what sticks out shows) */
EXT.top.arti = (o, k, t, layer) => {
  if (layer !== 'back' || k.rx < 50) return;
  const y = k.ry * .94, w = Math.max(4, 10 * Math.min(1, k.rx / 60));
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = V2.grad(-w, 0, w, 0, [[0, '#9db866'], [.5, '#6c8a3c'], [1, '#41592a']]); ctx.strokeStyle = 'rgba(26,40,14,.92)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-w, y - 6); ctx.lineTo(-w * 1.05, y + 12); ctx.lineTo(w * 1.05, y + 12); ctx.lineTo(w, y - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9e3a0'; ell(0, y + 12, w * 1.05, w * .3); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// ---- accessory fp15_arti: 'back' re-asserts the kind and the body path for THIS draw; 'front' draws the leaving shell, the necktie, the lanyard, the pin and the frozen eye
const GREEN_D = '#1b5e3c', GREEN_M = '#2f9a64', GOLD = '#e0b13a', GOLD_HI = '#f6dd86';
function faceMap(o, R) { const hy = yawOf(o), c = Math.cos(hy); return { dx: R * Math.sin(hy), sx: Math.max(c, 0), vis: c > .1 }; }   /* chest dressing follows the body's turn */
/* the leaving shell: every petal of it, drawn unclipped. u = how far this petal is (0 attached .. 1 gone): it folds outward about its base (the top ones first), drops with a tumble and fades.
 * pass 'att' = the petals still attached (under the tie and the lanyard), 'back' = flying petals behind the body, 'front' = flying petals in front of it */
function artiLeaving(o, k, st, yaw, hy, pass) {
  const kL = st.kL, f0 = shellF(kL), Wd0 = AR.rx * f0, Hh0 = AR.ry * f0, S = shellItems(kL), tw = o.petalTwitch || 0, fall = o.peelFall ?? 190, q = st.q;
  const d0 = artiDims({ heart: false, fb: f0, fs: Math.max(.34, Math.pow(f0, .8)) }), shift = (o.noLegs ? 0 : k.leg - d0.leg) + .9 * (k.ry - Hh0);   /* the old shell sits where the old body was */
  const list = [], pl = platOf(k, st, hy), Rb = Math.max(Wd0, Hh0) * 2;
  S.rows.forEach((row, r) => {
    const g = rowGeo(Wd0, Hh0, S.R, r, row.cnt), col = shellColor(kL, r), vm = (g.vb + g.vt) / 2;
    for (const it of row.its) {
      const a = it.lon + yaw, ca = Math.cos(a), d = .4 * (1 - vm) + .06 * (it.h + .5), u = seg(q, d, d + .5);
      if (u >= 1) continue;
      if (pass === 'att') { if (u <= 0 && ca > -.14) list.push({ ca, it, a, u, g, col, r }); }
      else if (u > 0 && (pass === 'back' ? ca < .05 : ca >= .05)) list.push({ ca, it, a, u, g, col, r });
    }
  });
  if (!list.length) return;
  list.sort((p, q2) => (q2.r - p.r) || (p.ca - q2.ca));   /* upper rows first, then far to near */
  if (pass === 'att') { ctx.save(); holeClip(pl, Rb); ctx.translate(0, shift); for (const e of list) drawPetal(e.g, e.it, kL, e.a, e.col, tw, 0); ctx.restore(); return; }
  const floorL = o.peelFloor === false ? 1e9 : (o.peelFloor != null ? o.peelFloor : (o.noLegs ? 0 : k.leg) + .9 * k.ry) - shift;   /* the floor line, in the shifted frame: petals land on it and fade there */
  const pcx = pl.cx, pcy = pl.cy - shift;
  ctx.save(); ctx.translate(0, shift);
  for (const e of list) {
    const { g, it, a, u } = e, bx = Wd0 * artiProfile(g.vb) * Math.sin(a), by = Hh0 - 2 * Hh0 * g.vb, sn = Math.sin(a);
    const side = Math.abs(sn) > .12 ? Math.sign(sn) : (it.h > 0 ? 1 : -1), rx2 = bx - pcx, ry2 = (by - pcy) * .8, ol = Math.hypot(rx2, ry2) || 1;
    const fold = side * (1.6 * easeOut(seg(u, 0, .5)) + .7 * u * u + 2.4 * u * u * u);
    const dx = (rx2 / ol * .75 + side * .5) * 84 * Math.pow(u, 1.25), dyR = ry2 / ol * 46 * Math.pow(u, 1.2) + fall * Math.pow(u, 2.1);
    const yEnd = Math.min(by + dyR, floorL - 6), dy = yEnd - by, clipIt = pass === 'front' && e.ca > .25 && u < .75;
    ctx.save(); ctx.globalAlpha *= 1 - sm(.62, 1, u);
    if (clipIt) holeClip(Object.assign({}, pl, { cy: pcy }), Rb);   /* a petal from the front slides behind the face, not over it */
    ctx.translate(bx + dx, by + dy); ctx.rotate(fold); const sc = 1 - .2 * u; ctx.scale(sc, sc); ctx.translate(-bx, -by);
    drawPetal(g, it, kL, a, e.col, tw, u);
    ctx.restore();
  }
  ctx.restore();
}
function artiTie(o, k, st, F) {   /* a tiny necktie hanging over the petals, below the mouth; it falls off with layer 3 */
  const fl = sm(2, 3, st.m), v = (o.tie != null ? o.tie : 1) * (1 - sm(2.6, 3.1, st.m)); if (v < .02 || !F.vis) return;
  const fs = st.fs, y0 = k.mouthY + k.mw * 1.6 + 12 * fs + 70 * fl * fl, sw = Math.sin(st.t * 1.7 + (o.seed || 0)) * .035 + fl * .5;
  ctx.save(); ctx.globalAlpha *= clamp(v); ctx.translate(F.dx * .4 + 20 * fl, y0); ctx.scale(F.sx * fs, fs); ctx.rotate(sw); ctx.lineJoin = 'round';
  const gr = ctx.createLinearGradient(-12, 0, 12, 0); gr.addColorStop(0, GREEN_M); gr.addColorStop(.55, GREEN_D); gr.addColorStop(1, '#10402a');
  ctx.fillStyle = gr; ctx.strokeStyle = 'rgba(10,32,20,.95)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(-13, 62); ctx.lineTo(0, 74); ctx.lineTo(13, 62); ctx.lineTo(6, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(224,177,58,.85)'; ctx.lineWidth = 3.2; for (const yy of [36, 50]) { ctx.beginPath(); ctx.moveTo(-8 - (yy - 36) * .15, yy); ctx.lineTo(8 + (yy - 36) * .15, yy + 4); ctx.stroke(); }
  ctx.fillStyle = gr; ctx.strokeStyle = 'rgba(10,32,20,.95)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(0, -7, 12, -2); ctx.lineTo(8, 14); ctx.lineTo(-8, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function artiBadgeAt(k, st) { const fs = st.heart ? .5 : st.fs; return { fs, by: st.heart ? k.ry * .9 : Math.min(k.ry * .55, k.mouthY + k.mw * 1.6 + 30 * fs), bx: st.heart ? 0 : 30 * fs }; }
function artiLanyard(o, k, st, F) {   /* GREENLEAF lanyard: a green strap and a blank badge (the scene letters it: A15.plate(o, 'arti_lanyard')) */
  if (o.lanyard === false || !F.vis) return;
  const { fs, by, bx: bxo } = artiBadgeAt(k, st), pl = platOf(k, st, 0), sx = F.sx;   /* the badge hangs to the right of the necktie; round the heart it hangs from its tip */
  ctx.save(); ctx.translate(F.dx * .4, 0); ctx.lineCap = 'round';
  const xs = (st.heart ? k.rx * .85 : Math.min(pl.rx * .8, k.rx * .6)) * sx, ys = st.heart ? -k.ry * .2 : Math.min(k.mouthY + k.mw * 1.2 + 4 * fs, k.ry * .6);
  if (!st.heart) for (const sd of [-1, 1]) for (const [c, w] of [['#f4f7f2', 6.4 * fs + 1], [GREEN_M, 3 * fs + .8]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(sd * xs, ys); ctx.quadraticCurveTo(sd * xs * .5 + bxo * sx * .5, ys + (by - ys) * .9, bxo * sx, by); ctx.stroke(); }
  ctx.translate(bxo * sx, by); ctx.rotate(Math.sin(st.t * 1.9 + (o.seed || 0)) * .04);
  ctx.fillStyle = '#9aa4b3'; rr(-4 * fs, -2, 8 * fs, 7 * fs, 2); ctx.fill();
  const w = 36 * fs * sx + 2, h = 46 * fs;
  ctx.translate(0, 6 * fs); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#fbfcf8'; ctx.strokeStyle = 'rgba(16,48,32,.9)'; ctx.lineWidth = 2.3; rr(-w / 2, 0, w, h, 4 * fs + 1); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = GREEN_D; rr(-w / 2, 0, w, h * .26, 4 * fs + 1); ctx.fill(); ctx.fillRect(-w / 2, h * .13, w, h * .13);
  ctx.fillStyle = GREEN_M; ctx.beginPath(); ctx.ellipse(0, h * .5, w * .16, h * .1, -.7, 0, TAU); ctx.fill();   /* a leaf logo */
  ctx.fillStyle = 'rgba(30,60,48,.2)'; ctx.fillRect(-w * .36, h * .7, w * .72, h * .09); ctx.fillRect(-w * .36, h * .83, w * .5, h * .07);
  ctx.restore();
}
function artiPin(o, k, st, F) {   /* the tiny gold CEO pin on the left lapel (screen left): a disc with a laurel leaf; it falls off with layer 5 */
  const fl = sm(4, 5, st.m), v = o.pin === false ? 0 : 1 - sm(4.6, 5.1, st.m); if (v < .02 || !F.vis) return;
  const fs = st.fs, x = -Math.min(k.rx * .62, 62 * fs + 12), y = Math.min(k.ry * .5, k.mouthY + k.mw * 1.4 + 16 * fs) + 60 * fl * fl;
  ctx.save(); ctx.globalAlpha *= v; ctx.translate(F.dx * .4 + x * F.sx - 16 * fl, y); ctx.scale(F.sx * fs, fs);
  ctx.fillStyle = V2.radial(-2, -3, 1, 9, [[0, GOLD_HI], [1, GOLD]]); ctx.strokeStyle = 'rgba(90,60,6,.9)'; ctx.lineWidth = 1.8; ell(0, 0, 7.5, 7.5); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(110,74,8,.85)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 0, 4.6, 6, .5, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,210,.9)'; ell(-2, -2.5, 1.7, 1.7); ctx.fill();
  ctx.restore();
}
function artiLids(o, k, st) {   /* frozen: the left eye (screen left) caught half-closed, over the engine's face */
  if (!o.frozenOn || Math.abs(faceAngOf(o)) > .04) return;
  const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), er = k.er * E.wide * (o.eyeScale || 1), eh = er * 1.15, x = -k.eyeX, y = k.eyeY, kc = o.colors || k.c, skin = V2.rgba(V2.mix(kc[0], kc[1], .34), 1);
  const ly = y - eh + eh * 2 * .62;
  ctx.save(); ell(x, y, er, eh); ctx.clip(); ctx.fillStyle = skin; ctx.fillRect(x - er - 2, y - eh - 4, er * 2 + 4, ly - (y - eh - 4)); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - er, ly + 1); ctx.quadraticCurveTo(x, ly + 4, x + er, ly - 1); ctx.stroke();
}
EXT.acc.fp15_arti = (o, k, t, layer) => {
  const st0 = artiState(o);
  if (layer === 'back') { applyArti(st0); if (st0.kL >= 0) artiLeaving(o, k, st0, yawOf(o), faceAngOf(o), 'back'); return; }
  if (layer !== 'front') return;
  const st = st0, yaw = yawOf(o), hy = faceAngOf(o), F = faceMap(o, k.rx * .9);
  if (st.kL >= 0) artiLeaving(o, k, st, yaw, hy, 'att');
  if (!st.heart) { artiLids(o, k, st); artiTie(o, k, st, F); artiPin(o, k, st, F); }
  artiLanyard(o, k, st, F);
  if (st.kL >= 0) artiLeaving(o, k, st, yaw, hy, 'front');
};
PLATES.arti_lanyard = { r: (o, k) => { const { fs, by, bx } = artiBadgeAt(k, artiState(o)); return [bx - 16 * fs, by + 6 * fs + 46 * fs * .64, bx + 16 * fs, by + 6 * fs + 46 * fs * .94]; } };   /* the lettering strip of the badge */


// ---- A15.draw(o): drawChar with the TV glitch. o.glitch = { k: 0..1 (strength), y: 0..1 where the slice sits on the sprite (0 top), h: slice height as a fraction of the sprite (.12), dx: px shift (30), seed }
let GCV = null;
A.draw = o => {
  const g = o.glitch;
  if (!g || !(g.k > 0 || g === true)) { drawChar(o); return; }
  const gk = g === true ? 1 : g.k, prev = ctx, M = prev.getTransform(), k = KINDS[o.kind] || {}, s = o.s || 1, sc = Math.hypot(M.a, M.b) * s;
  if (!GCV) GCV = V2.mk(W, H);
  const off = GCV.getContext('2d'); off.setTransform(1, 0, 0, 1, 0, 0); off.globalAlpha = 1; off.globalCompositeOperation = 'source-over'; off.clearRect(0, 0, W, H); off.setTransform(M);
  ctx = off; try { drawChar(o); } finally { ctx = prev; }
  const feet = M.transformPoint(new DOMPoint(o.x, o.y)), hS = sc * ((o.noLegs ? 0 : (k.leg || 90)) + (k.ry || 130) * 2.15 + 60), top = feet.y - hS;
  const sy = top + hS * (g.y ?? .46), sh = hS * (g.h ?? .13), dx = (g.dx ?? 34) * sc * gk * (sr(Math.floor((g.seed || 1) * 7), 1) > .5 ? 1 : -1);
  prev.save(); prev.setTransform(1, 0, 0, 1, 0, 0);
  prev.drawImage(GCV, 0, 0, W, sy, 0, 0, W, sy);                                    /* above the slice */
  prev.drawImage(GCV, 0, sy, W, sh, dx, sy, W, sh);                                 /* the slice, shifted sideways */
  prev.drawImage(GCV, 0, sy + sh, W, H - sy - sh, 0, sy + sh, W, H - sy - sh);      /* below it */
  prev.globalAlpha = .35 * gk; prev.globalCompositeOperation = 'screen'; prev.drawImage(GCV, 0, sy + sh * .5, W, sh * .5, dx * 1.7, sy + sh * .5, W, sh * .5);   /* a ghost of it */
  prev.restore();
};


// ================================================================== Binder (the helpful assistant): a binder clip with googly eyes, wire-handle arms and a permanent smile
/* The clip is a flat trapezoid (thin from the side: yaw squeezes it to a sliver, the back is a plain black plate), drawn entirely here: the engine only fills the silhouette; the face, the silver
 * handles (the arms) and the hover shadow are the accessory fp15_bind. It floats (center, noLegs). o.yaw is consumed by the constructor (stored as yaw15) so the generic rig never touches it. */
const BD = { rx: 104, ry: 92, wt: 71, depth: 26 };
const bindYaw = o => { const y = o.yaw15 || 0, c = Math.cos(y), sn = Math.sin(y); return { y, c, sn, cw: c >= 0 ? Math.max(.16, c) : Math.min(-.16, c), back: c < -.1, vis: c > .1 }; };
function bindPath(Y) {   /* the silhouette: top narrower than the jaw, rounded corners; squeezed by the turn, with the clip's thickness showing at the side */
  const p = new Path2D(), ex = BD.depth * .5 * Math.abs(Y.sn), ax = Math.abs(Y.cw), r = 16, wt = BD.wt * ax + ex, wb = BD.rx * ax + ex, ry = BD.ry;
  p.moveTo(-wt + r, -ry); p.arcTo(wt, -ry, wb, ry, r); p.arcTo(wb, ry, -wb, ry, r); p.arcTo(-wb, ry, -wt, -ry, r); p.arcTo(-wt, -ry, wt, -ry, r); p.closePath();
  return p;
}
EXT.shape.bind = (p, k) => { const Y = { cw: 1, sn: 0 }, r = 16, wt = BD.wt, wb = BD.rx, ry = BD.ry; p.moveTo(-wt + r, -ry); p.arcTo(wt, -ry, wb, ry, r); p.arcTo(wb, ry, -wb, ry, r); p.arcTo(-wb, ry, -wt, -ry, r); p.arcTo(-wt, -ry, wt, -ry, r); };
EXT.tex.bind = (o, k, t) => {   /* the lighter bevelled front plate, the jaw, the two metal tabs at the top corners */
  const Y = bindYaw(o), ax = Math.abs(Y.cw);
  ctx.save();
  if (Y.back) { ctx.fillStyle = V2.grad(0, -BD.ry, 0, BD.ry, [[0, '#2b2c33'], [1, '#0d0d11']]); ctx.fillRect(-150, -150, 300, 300); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(-150, -60, 300, 8); ctx.restore(); return; }
  ctx.translate(BD.depth * .5 * Y.sn, 0); ctx.scale(Y.cw, 1);
  const wt = BD.wt - 10, wb = BD.rx - 12, y0 = -BD.ry + 11, y1 = BD.ry - 15, r = 10;
  const plate = () => { ctx.beginPath(); ctx.moveTo(-wt + r, y0); ctx.arcTo(wt, y0, wb, y1, r); ctx.arcTo(wb, y1, -wb, y1, r); ctx.arcTo(-wb, y1, -wt, y0, r); ctx.arcTo(-wt, y0, wt, y0, r); ctx.closePath(); };
  plate(); ctx.fillStyle = V2.grad(-wb, y0, wb * .8, y1, [[0, '#575963'], [.45, '#3a3c45'], [1, '#26272e']]); ctx.fill();
  ctx.lineJoin = 'round'; ctx.lineWidth = 3;
  plate(); ctx.save(); ctx.clip();   /* bevel: light along the top and left edges, dark along the bottom and right */
  ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-wb, y1); ctx.lineTo(-wt, y0); ctx.lineTo(wt, y0); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.moveTo(wt, y0); ctx.lineTo(wb, y1); ctx.lineTo(-wb, y1); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(-wt * .9, y0); ctx.lineTo(-wt * .2, y0); ctx.lineTo(-wb * .75, y1); ctx.lineTo(-wb * 1.2, y1); ctx.closePath(); ctx.fill();   /* a soft streak of light */
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 2.4; plate(); ctx.stroke();
  const jaw = BD.ry - 11;   /* the jaw: a lighter lip along the bottom edge, with the slit the paper goes into */
  ctx.fillStyle = V2.grad(0, jaw - 4, 0, BD.ry, [[0, '#7d828d'], [.5, '#4c4f58'], [1, '#2a2b32']]); ctx.beginPath(); ctx.moveTo(-wb - 8, BD.ry); ctx.lineTo(wb + 8, BD.ry); ctx.lineTo(wb + 6, jaw); ctx.lineTo(-wb - 6, jaw); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-wb - 4, jaw + 1); ctx.lineTo(wb + 4, jaw + 1); ctx.stroke();
  for (const sd of [-1, 1]) {   /* the metal tabs the handles pivot on */
    const tx = sd * (BD.wt - 4), ty = -BD.ry + 14;
    ctx.fillStyle = V2.grad(tx - 9, ty - 9, tx + 9, ty + 9, [[0, '#eef1f6'], [1, '#868c98']]); ctx.strokeStyle = 'rgba(10,10,16,.85)'; ctx.lineWidth = 2.4; rr(tx - 10, ty - 12, 20, 22, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(10,10,16,.7)'; ell(tx, ty - 1, 3.3, 3.3); ctx.fill();
  }
  ctx.restore();
};
/* the pose of a handle: [elbow x, elbow y, tip x, tip y] in "outward" coordinates (x grows away from the body on either side, y down), measured from the body centre; the shoulder is at (72, -76) */
const BH = {
  rest: { l: [106, -34, 118, 36], r: [106, -34, 118, 36] },
  ears: { l: [96, -128, 80, -196], r: [96, -128, 80, -196] },
  point: { l: [106, -34, 118, 36], r: [140, -66, 214, -82] },
  thumb: { l: [106, -34, 118, 36], r: [124, -44, 130, -122] },
  helpful: { l: [112, 34, 6, 122], r: [112, 34, 6, 122] },   /* clasped under the jaw, so the face stays clear */
  cheer: { l: [112, -112, 126, -194], r: [112, -112, 126, -194] },
  shrug: { l: [118, -70, 96, -108], r: [118, -70, 96, -108] },
};
function bindPoseOf(o, t, side) {   /* the chain for one side, with the idle sway and the wave; side -1 = screen left */
  const name = o.pose || 'rest', key = side < 0 ? 'l' : 'r', P = (o.handles && o.handles[key]) || (BH[name] || BH.rest)[key];
  let [ex, ey, tx, ty] = P; const ph = (o.seed || 0) + (side > 0 ? 1.3 : 0), sw = Math.sin(t * 2.3 + ph);
  if (name === 'wave' && side > 0) { const w = Math.sin(t * 9.5); ex = 108; ey = -96; tx = 120 + 26 * w; ty = -182 + 6 * Math.abs(w); }
  else if (name === 'wave') { [ex, ey, tx, ty] = BH.rest.l; }
  if (name === 'cheer') { tx += Math.sin(t * 11 + ph) * 14; ty += Math.cos(t * 9 + ph) * 8; }
  if (name === 'point' && side > 0) ty += Math.sin(t * 5) * 2;
  tx += sw * 3; ty += Math.cos(t * 2.1 + ph) * 3;   /* the wire never quite stops */
  return { ex, ey, tx, ty, point: name === 'point' && side > 0, thumb: name === 'thumb' && side > 0 };
}
function bindHandle(o, Y, t, side) {   /* a wire loop from the pivot over the elbow to the tip, silver, two strands */
  const H = bindPoseOf(o, t, side), sx0 = 72, sy0 = -76, ax = Y.cw;
  const S = [sx0, sy0], E = [H.ex, H.ey], Tp = [H.tx, H.ty], C = [2 * E[0] - (S[0] + Tp[0]) / 2, 2 * E[1] - (S[1] + Tp[1]) / 2];
  const N = 16, pts = [], nrm = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = 1 - u, x = a * a * S[0] + 2 * a * u * C[0] + u * u * Tp[0], y = a * a * S[1] + 2 * a * u * C[1] + u * u * Tp[1];
    const dx = 2 * a * (C[0] - S[0]) + 2 * u * (Tp[0] - C[0]), dy = 2 * a * (C[1] - S[1]) + 2 * u * (Tp[1] - C[1]), L = Math.hypot(dx, dy) || 1;
    pts.push([x, y]); nrm.push([-dy / L, dx / L]);
  }
  const hwMax = H.point ? 6.5 : 12, hw = u => 3.5 + (hwMax - 3.5) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05 + .02)), .7) * (1 - .25 * u);
  const X = x => side * x * ax + (BD.depth * .5 * Y.sn);
  const loop = () => {   /* strand A out along +n, a half circle round the tip, strand B back along -n (screen space: x mirrored by side and squeezed by the turn) */
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const w = hw(i / N), x = X(pts[i][0]) + nrm[i][0] * w * ax, y = pts[i][1] + nrm[i][1] * w * side; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    const cx = X(pts[N][0]), cy = pts[N][1], w = hw(1), a0 = Math.atan2(nrm[N][1] * side, nrm[N][0] * ax || 1e-6);
    const ta = Math.atan2(pts[N][1] - pts[N - 1][1], X(pts[N][0]) - X(pts[N - 1][0])); let d = ta - a0; d = Math.atan2(Math.sin(d), Math.cos(d));
    ctx.arc(cx, cy, Math.max(w * Math.max(ax, .35), 3), a0, a0 + (d < 0 ? -PI : PI), d < 0);
    for (let i = N; i >= 0; i--) { const w2 = hw(i / N); ctx.lineTo(X(pts[i][0]) - nrm[i][0] * w2 * ax, pts[i][1] - nrm[i][1] * w2 * side); }
  };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(14,16,22,.92)'; ctx.lineWidth = 11; loop(); ctx.stroke();
  const gr = ctx.createLinearGradient(-60, -120, 120, 60); gr.addColorStop(0, '#f6f8fc'); gr.addColorStop(.5, '#c4cad4'); gr.addColorStop(1, '#8e95a2');
  ctx.strokeStyle = gr; ctx.lineWidth = 6.4; loop(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.8; ctx.save(); ctx.translate(-1.2, -1.6); loop(); ctx.stroke(); ctx.restore();
  if (H.thumb) {   /* a thumbs-up: a little extra loop at the tip, standing out */
    const cx = X(H.tx), cy = H.ty; ctx.strokeStyle = 'rgba(14,16,22,.92)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.ellipse(cx - side * 7 * ax, cy + 2, 9 * Math.max(ax, .3), 13, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = gr; ctx.lineWidth = 6.4; ctx.stroke();
  }
}
const BE = { x: 38, y: -20, r: 35, my: 42 };   /* the googly eyes and the mouth line, on the front plate */
function bindGoogly(o, Y, t, side, E, grin) {
  const x = side * BE.x, y = BE.y, R = BE.r, Pr = lerp(17, 11, grin) * (E.pup > 0 ? Math.min(1.25, E.pup) : 1), ph = (o.seed || 0) * .37 + side * 1.9, look = o.look || [0, 0];
  const room = R - Pr - 3;
  let ox = look[0] * room + 6 * Math.sin(t * 3.1 + ph) + 3.5 * Math.sin(t * 7.3 + ph * 2), oy = look[1] * room + .38 * room + 4.5 * Math.sin(t * 2.3 + ph + 1) - 3 * Math.cos(t * 2.1 + (o.seed || 0));
  const dl = Math.hypot(ox, oy); if (dl > room) { ox *= room / dl; oy *= room / dl; }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = V2.grad(x, y - R, x, y + R, [[0, '#e6e9f1'], [.3, '#ffffff'], [1, '#d9deea']]); ell(x, y, R, R); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ell(x, y, R, R); ctx.clip();
  ctx.fillStyle = V2.radial(x, y, R * .5, R, [[0, 'rgba(60,70,110,0)'], [1, 'rgba(60,70,110,.2)']]); ctx.fillRect(x - R, y - R, R * 2, R * 2);
  ctx.fillStyle = V2.radial(x + ox - Pr * .3, y + oy - Pr * .3, 1, Pr, [[0, '#34303f'], [.7, '#0e0c14'], [1, '#050408']]); ell(x + ox, y + oy, Pr, Pr); ctx.fill();
  ctx.fillStyle = '#fff'; ell(x + ox - Pr * .36, y + oy - Pr * .42, Pr * .3, Pr * .3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(x + ox + Pr * .38, y + oy + Pr * .34, Pr * .13, Pr * .13); ctx.fill();
  const lid = Math.max(E.lid || 0, o.lid || 0, grin * .3);   /* a flat dark lid slides down over the plastic: the inner end lower when angry or grinning, higher when sad */
  if (lid > .02) { ctx.fillStyle = '#17181e'; const ly = y - R + 2 * R * lid, kk = ((E.ang || 0) * .4 + grin * .35) * R, yi = ly + kk, yo = ly - kk, xl = side < 0 ? yo : yi, xr = side < 0 ? yi : yo; ctx.beginPath(); ctx.moveTo(x - R - 2, y - R - 2); ctx.lineTo(x + R + 2, y - R - 2); ctx.lineTo(x + R + 2, xr); ctx.lineTo(x - R - 2, xl); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = '#0c0c12'; ctx.lineWidth = 4.2; ell(x, y, R, R); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, R - 8, PI * 1.12, PI * 1.5); ctx.stroke();   /* the clear dome's glare */
  ctx.restore();
}
function bindBrow(o, t, side, E, grin) {
  const x = side * BE.x, wig = o.browWig ?? .2, ph = side * 1.7 + (o.seed || 0);
  const by = BE.y - BE.r - 15 - (E.raise || 0) * .8 - (o.browUp || 0) + Math.sin(t * 11 + ph) * 4 * wig, ang = (E.ang || 0) + .45 * grin + Math.sin(t * 7 + ph) * .13 * wig;
  ctx.save(); ctx.translate(x, by); ctx.rotate(side < 0 ? ang : -ang); ctx.lineCap = 'round';
  const bw = BE.r * .8, arch = (E.curve > .5 ? 7 : 2);
  const path = () => { ctx.beginPath(); ctx.moveTo(-bw, 0); ctx.quadraticCurveTo(0, -arch * 2, bw, 0); };
  ctx.strokeStyle = 'rgba(12,12,18,.9)'; ctx.lineWidth = 12; path(); ctx.stroke();
  ctx.strokeStyle = V2.grad(-bw, -10, bw, 6, [[0, '#f4f6fa'], [.5, '#c3c9d3'], [1, '#8d94a1']]); ctx.lineWidth = 6.8; path(); ctx.stroke();
  ctx.restore();
}
function bindMouth(o, t, E, grin, Y) {
  const ms = o.mouthState || { open: 0, spread: .5, teeth: 0 }, open = Math.max(clamp(o.talk || 0), o.mouthOpen || 0), sp = o.mouthState ? ms.spread : .5;
  const W = lerp(60 + 12 * sp * open, 84, grin), my = BE.my, cy0 = my - 8 + grin * 2, D = lerp(19, 25, grin) + open * 28 * (1.05 - .3 * sp);
  ctx.save(); ctx.translate(0, 0);
  ctx.beginPath(); ctx.moveTo(-W, cy0); ctx.quadraticCurveTo(0, cy0 + 5 - open * 2, W, cy0); ctx.quadraticCurveTo(0, cy0 + 2 * D, -W, cy0); ctx.closePath();
  ctx.fillStyle = V2.grad(0, cy0, 0, cy0 + D, [[0, '#3a0610'], [1, '#6e1224']]); ctx.fill();
  ctx.save(); ctx.clip();
  const th = Math.min(D * .72, 9 + 6 * grin + 8 * (ms.teeth || 0) + open * 4);
  ctx.fillStyle = '#fbfbf6'; ctx.fillRect(-W, cy0 - 4, W * 2, th + 4);
  ctx.strokeStyle = 'rgba(120,110,100,.55)'; ctx.lineWidth = 1.8; const nT = grin > .3 ? 9 : 0; for (let i = 1; i < nT; i++) { const tx = -W + (W * 2) * i / nT; ctx.beginPath(); ctx.moveTo(tx, cy0 - 2); ctx.lineTo(tx, cy0 + th); ctx.stroke(); }
  if (D > 26) { ctx.fillStyle = '#ff7a92'; ell(0, cy0 + D * 1.25, W * .5, D * .42); ctx.fill(); }
  ctx.restore();
  ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(8,8,12,.85)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-W, cy0); ctx.quadraticCurveTo(0, cy0 + 5 - open * 2, W, cy0); ctx.quadraticCurveTo(0, cy0 + 2 * D, -W, cy0); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = '#eef1f6'; ctx.lineWidth = 3.6; ctx.stroke();
  const gl = o.glint || 0;   /* the glint on a tooth: the menacing helpful grin */
  if (gl > .02) {
    const gx = W * .5, gy = cy0 + th * .55, sz = (12 + 16 * gl) * (1 + .15 * Math.sin(t * 28)); ctx.save(); ctx.translate(gx, gy); ctx.globalAlpha *= clamp(gl * 1.4);
    ctx.fillStyle = 'rgba(190,235,255,.5)'; ell(0, 0, sz * .9, sz * .9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * PI / 4, R = i % 2 ? sz * .22 : sz; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); } ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
EXT.acc.fp15_bind = (o, k, t, layer) => {
  const Y = bindYaw(o), E = Object.assign({}, EXPR[o.expr || 'bind_happy'], o.face || {}), grin = clamp(o.grin || 0), tt = tOf(o);
  if (layer === 'back') {   /* the hover shadow on the floor (hover = how far the centre is above the floor, in sprite units) and the path for this turn */
    PATHS.bind = bindPath(Y); k.rx = Math.max(24, BD.rx * Math.abs(Y.cw));
    if (o.hover !== false) { const h = o.hover ?? 140, a = clamp(.4 * (1 - h / 520)) * (o.shadowA ?? 1), w = BD.rx * (1.08 - h / 900) * Math.abs(Y.cw); ctx.save(); ctx.rotate(-(o.rot || 0)); ctx.translate(0, h + BD.ry); ctx.scale(1, .16); ctx.fillStyle = V2.radial(0, 0, 0, w * 1.2, [[0, `rgba(6,4,14,${a})`], [.6, `rgba(6,4,14,${a * .5})`], [1, 'rgba(6,4,14,0)']]); ctx.beginPath(); ctx.arc(0, 0, w * 1.2, 0, TAU); ctx.fill(); ctx.restore(); }
    return;
  }
  if (layer !== 'front') return;
  if (REG.on && !REG.suppress && Y.vis) regLocal('face', -BE.x - BE.r - 4, BE.y - BE.r - 22, BE.x + BE.r + 4, BE.my + 40, { id: o.id || o.kind, transit: o.transit });
  ctx.save();
  if (Y.vis) {   /* the face lives on the front plate only: squeezed by the turn, and gone from the back */
    ctx.translate(BD.depth * .5 * Y.sn, 0); ctx.scale(Y.cw, 1);
    bindMouth(o, tt, E, grin, Y); bindGoogly(o, Y, tt, -1, E, grin); bindGoogly(o, Y, tt, 1, E, grin); bindBrow(o, tt, -1, E, grin); bindBrow(o, tt, 1, E, grin);
  }
  ctx.restore();
  ctx.save(); const order = (o.pose === 'helpful') ? [-1, 1] : [-1, 1];
  for (const sd of order) bindHandle(o, Y, tt, sd);
  ctx.restore();
};
/* A15.binder(o): Binder. Options: pose 'rest' (handles folded down like arms) | 'ears' (up) | 'wave' (the right handle waves) | 'point' (the right handle points) | 'thumb' (thumbs up) | 'helpful' (both clasped
 * in front) | 'cheer' | 'shrug' | or handles: { l: [ex, ey, tx, ty], r: [...] } (outward coordinates, see BH); grin 0..1 (the smile goes ear to ear, brows down, pupils small), glint 0..1 (the sparkle on a tooth),
 * browWig 0..1 (the brows wiggle, default .2), look [x, y] (the googly pupils), hover (centre height above the floor, for the shadow), bob (0 = still), yaw (turn: a flat clip is a sliver from the side) */
A.binder = o => {
  o = o || {};
  const seed = o.seed ?? 161, t = tOf(o), s = o.s ?? SC, yaw = o.yaw || 0, pose = o.pose || 'rest';
  const r = Object.assign({ kind: 'bind', id: 'bind', who: 'bind', s, y: G - s * (BD.ry + 140), seed, expr: 'bind_happy', noLegs: true, center: true, noArms: true, noFace: true, noShadow: true, noReflect: true, pose, hover: 140 }, o);
  r.s = s; r.yaw = 0; r.yaw15 = yaw; r.t = t; r.acc = ['fp15_bind'].concat((o.acc || []).filter(a => a !== 'fp15_bind'));
  r.y += Math.sin(t * 2.1 + seed) * 6 * s * (o.bob ?? 1); r.rot = (o.rot || 0) + Math.sin(t * 1.5 + seed) * .035 * (o.bob ?? 1);
  if (pose === 'ears' || pose === 'cheer' || pose === 'wave') r.topExtra = o.topExtra ?? 96;
  return r;
};
A.binderSmall = o => A.binder(Object.assign({ s: .35 }, o));   /* the 0.35-scale one for the corner of the sheet and the world */



// ---- a few helpers shared by the vegetables: a tapered strand through points, a profile table (radius at height) sampled from a body outline
function taper(pts, w0, w1, fill, stroke, lw = 2.4) {   /* a tapering ribbon through a polyline (w0 at the start, w1 at the end) */
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([pts[i][0] - dy / len * w, pts[i][1] + dx / len * w]); R.push([pts[i][0] + dy / len * w, pts[i][1] - dx / len * w]);
  }
  ctx.beginPath(); L.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function bez(p0, p1, p2, p3, u) { const a = 1 - u; return [a * a * a * p0[0] + 3 * a * a * u * p1[0] + 3 * a * u * u * p2[0] + u * u * u * p3[0], a * a * a * p0[1] + 3 * a * a * u * p1[1] + 3 * a * u * u * p2[1] + u * u * u * p3[1]]; }
function profileOf(segs, n = 14) {   /* right-half outline (a list of cubic segments, top to bottom) -> f(y) = half-width at height y */
  const tab = []; for (const sg of segs) for (let i = 0; i <= n; i++) tab.push(bez(sg[0], sg[1], sg[2], sg[3], i / n));
  return y => { if (y <= tab[0][1]) return tab[0][0]; for (let i = 1; i < tab.length; i++) if (y <= tab[i][1] || i === tab.length - 1) { const a = tab[i - 1], b = tab[i], u = (y - a[1]) / ((b[1] - a[1]) || 1); return Math.max(0, lerp(a[0], b[0], clamp(u))); } return 0; };
}
function mirrorPath(p, segs) {   /* a closed body outline from the right-half segments: down the right side, up the left */
  p.moveTo(segs[0][0][0], segs[0][0][1]);
  for (const s2 of segs) p.bezierCurveTo(s2[1][0], s2[1][1], s2[2][0], s2[2][1], s2[3][0], s2[3][1]);
  for (let i = segs.length - 1; i >= 0; i--) { const s2 = segs[i]; p.bezierCurveTo(-s2[2][0], s2[2][1], -s2[1][0], s2[1][1], -s2[0][0], s2[0][1]); }
  p.closePath();
}
/* a clip that leaves out the face (an ellipse), for surface marks that must not run through the eyes */
function faceHoleClip(k, mx = 1.6, my = 0, pad = 10, ang = 0, Rf = null) {
  const R = Math.max(k.rx, k.ry) * 1.6, ca = Math.cos(ang); if (ca < .08) { ctx.beginPath(); ctx.rect(-R, -R, R * 2, R * 2); ctx.clip(); return; }
  const rx = (k.eyeX + k.er * mx + pad) * ca, top = k.eyeY - k.er * 2.9, bot = k.mouthY + k.mw * 1.7 + 8, cy = (top + bot) / 2 + my, ry = (bot - top) / 2 + 6, cx = (Rf ? Rf(cy) * .94 : k.rx * .94) * Math.sin(ang);
  ctx.beginPath(); ctx.rect(-R, -R, R * 2, R * 2); ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU, true); ctx.clip('evenodd');
}

// ================================================================== Onion (Compliance): a papery bulb, a curl of sprout, round tinted glasses, a visor badge, tears
const ONION_SEGS = (() => { const rx = KINDS.onion.rx, ry = KINDS.onion.ry; return [
  [[0, -ry], [rx * .10, -ry * .98], [rx * .2, -ry * .80], [rx * .42, -ry * .52]],
  [[rx * .42, -ry * .52], [rx * .82, -ry * .22], [rx * 1.02, ry * .12], [rx * .96, ry * .45]],
  [[rx * .96, ry * .45], [rx * .88, ry * .82], [rx * .42, ry * 1.0], [0, ry * .98]]]; })();
const onionR = profileOf(ONION_SEGS);
EXT.shape.onion = p => mirrorPath(p, ONION_SEGS);
const ONION_MER = Array.from({ length: 13 }, (_, i) => ({ lon: ((i + (sr(i, 3) - .5) * .4) / 13) * TAU - PI, w: .7 + sr(i, 4) * .6, a: .22 + sr(i, 5) * .22 }));   /* the meridians of the papery skin: a list with a longitude */
EXT.tex.onion = (o, k, t) => {
  const { rx, ry } = k, yaw = yawOf(o), R = Math.max(rx, ry) * 1.5;
  ctx.save();
  ctx.fillStyle = V2.grad(0, -ry, 0, ry, [[0, 'rgba(255,246,190,.34)'], [.5, 'rgba(255,236,170,0)'], [1, 'rgba(150,84,20,.34)']]); ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.save(); faceHoleClip(k, 1.5, 0, 12, faceAngOf(o), onionR);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const merid = (lon, y0, y1, n) => { const a = lon + yaw, ca = Math.cos(a); if (ca < -.05) return null; const pts = []; for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n); pts.push([onionR(y) * Math.sin(a), y]); } return { pts, ca }; };
  for (const m of ONION_MER) {   /* the papery layers: a pale wide sheen strip beside every other line, then the line itself */
    const mm = merid(m.lon, -ry * .96, ry * .94, 18); if (!mm) continue;
    const lam = lamb(Math.sin(m.lon + yaw) * .9, 0, mm.ca * .9);
    ctx.strokeStyle = `rgba(255,248,214,${.05 + .2 * lam})`; ctx.lineWidth = 15 * m.w; ctx.beginPath(); mm.pts.forEach(([x, y], i) => i ? ctx.lineTo(x + 7 * Math.max(mm.ca, 0), y) : ctx.moveTo(x + 7 * Math.max(mm.ca, 0), y)); ctx.stroke();
    ctx.strokeStyle = `rgba(112,62,16,${m.a * (.5 + .5 * Math.max(mm.ca, 0))})`; ctx.lineWidth = 2.4; ctx.beginPath(); mm.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(112,62,16,.3)'; ctx.lineWidth = 2;   /* fine cross-fibres of the skin, in front of the face too (very faint) */
  for (let i = 0; i < 26; i++) { const y = lerp(-ry * .7, ry * .9, sr(i, 11)), a = (sr(i, 12) * 2 - 1) * PI * .45 + yaw * 0, x = onionR(y) * Math.sin(a) * .95; if (Math.abs(x) < k.eyeX + k.er * 1.4 && y > k.eyeY - k.er * 2.8 && y < k.mouthY + 40) continue; ctx.beginPath(); ctx.moveTo(x - 5, y - 8); ctx.quadraticCurveTo(x + 2, y, x - 3, y + 9); ctx.stroke(); }
  ctx.restore();
};
/* the sprout (a curl of green on the neck) and the dry papery tip, in front; the root hairs under the bulb, behind */
function sproutBlade(b, yaw, t, ph) {   /* a blade that rises and curls over in the plane at longitude b.lon: heading turns steadily, the tip is thin */
  const pts = [], N = 18; let x = 0, y = 0, h = 0, dep = 0; const turn = b.turn * (1 + .06 * Math.sin(t * 2 + ph));
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = b.lean + turn * u * u * 1.0;   /* heading angle from vertical */
    pts.push({ d: x, h: y, u }); x += Math.sin(a) * b.len / N; y += Math.cos(a) * b.len / N;   /* h = height above the neck */
  }
  const sa = Math.sin(b.lon + yaw), ca = Math.cos(b.lon + yaw);
  return { P: pts.map(p => [p.d * sa, -p.h]), z: ca };
}
const SPROUT = [{ lon: PI / 2, lean: .12, turn: 3.0, len: 118, w: 23 }, { lon: -PI / 2 + .3, lean: -.3, turn: -2.2, len: 90, w: 18 }, { lon: .25, lean: .05, turn: 1.2, len: 68, w: 15 }];
EXT.top.onion = (o, k, t, layer) => {
  const yaw = headYawOf(o), ry = k.ry;
  if (layer === 'back') {   /* root hairs under the bulb: a fine brown tuft between the legs */
    ctx.save(); ctx.strokeStyle = 'rgba(112,72,34,.9)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 1.1; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 10, ry * .95); ctx.quadraticCurveTo(Math.sin(a) * 26 + Math.sin(t * 2 + i) * 2, ry * 1.0 + 12, Math.sin(a) * 34, ry * .98 + 20 + (i % 3) * 3); ctx.stroke(); }
    ctx.restore(); return;
  }
  ctx.save(); ctx.lineJoin = 'round';
  /* the dry neck: a pointed brown paper tip */
  ctx.fillStyle = V2.grad(0, -ry - 8, 0, -ry + 24, [[0, '#b47a34'], [1, '#e2b66a']]); ctx.strokeStyle = 'rgba(70,36,8,.9)'; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-9, -ry + 18); ctx.quadraticCurveTo(-4, -ry - 2, 0, -ry - 12); ctx.quadraticCurveTo(4, -ry - 2, 9, -ry + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
  const sw = Math.sin(t * 2.1 + (o.seed || 0)) * .04, bl = SPROUT.map((b, i) => Object.assign(sproutBlade(b, yaw, t, i), { b })).sort((p, q) => p.z - q.z);
  for (const e of bl) {   /* green blades: darker green outline, light stripe; the far ones first */
    ctx.save(); ctx.translate(0, -ry - 4); ctx.rotate(sw);
    taper(e.P, e.b.w * (.7 + .3 * Math.abs(e.z)), 3, V2.grad(-20, -50, 20, 10, [[0, '#9ad45c'], [1, '#4c9a2f']]), 'rgba(24,70,16,.92)', 2.6);
    ctx.strokeStyle = 'rgba(220,255,170,.5)'; ctx.lineWidth = 2; ctx.beginPath(); e.P.forEach(([x, y], i) => { if (i > 1 && i < e.P.length - 3) i === 2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
};
// ---- the shared tears accessory: o.cry 0..1 on ANY character (acc 'front', drawn over the face). Red-rimmed eyes, water welling in the lower lids, a stream down each cheek with beads sliding down it, a drip that
//      swells at the end of each stream, falls and fades. Everything hangs off the kind's own eyeX / eyeY / er / mouthY / mw, so it fits Strawberry, Lemon, Mango, Clementine, Melon and the new cast. o.cryTalk
//      (default .25) adds to the weeping while the character speaks (o.talk), so "she cries when she speaks" is automatic.
const tearHalf = (k, y) => { const q = y / (k.ry || 100); return k.rx * Math.sqrt(Math.max(0, 1 - q * q)); };
function teardrop(x, y, r, a, ang = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha *= a;
  ctx.beginPath(); ctx.moveTo(0, -r * 1.9); ctx.bezierCurveTo(r * .9, -r * .5, r, r * .35, 0, r); ctx.bezierCurveTo(-r, r * .35, -r * .9, -r * .5, 0, -r * 1.9); ctx.closePath();
  ctx.fillStyle = V2.grad(-r, -r, r, r, [[0, 'rgba(214,240,255,.92)'], [1, 'rgba(120,184,240,.85)']]); ctx.fill(); ctx.strokeStyle = 'rgba(70,128,196,.7)'; ctx.lineWidth = Math.max(1, r * .22); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ell(-r * .3, -r * .1, r * .26, r * .4, .3); ctx.fill();
  ctx.restore();
}
EXT.acc.fp15_tears = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const c = clamp((o.cry || 0) + (o.cryTalk ?? .25) * clamp(o.talk || 0)); if (c < .02) return;
  const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), er = k.er * E.wide * (o.eyeScale || 1), eh = er * 1.15, ey = k.eyeY, ex = k.eyeX, tt = tOf(o), seed = o.seed || 0;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';   /* (the engine already shifts accessories by k.face on the banana) */
  for (const side of [-1, 1]) {
    const x = side * ex, y = ey;
    /* the eyes: a flush on the cheek under them, a red wash on the white, a red rim, the water standing in the lower lid */
    ctx.fillStyle = V2.radial(x, y + eh * .9, 0, er * 1.5, [[0, `rgba(255,70,92,${.36 * c})`], [1, 'rgba(255,70,92,0)']]); ctx.fillRect(x - er * 1.7, y, er * 3.4, eh * 2.6);
    ctx.save(); ell(x, y, er, eh); ctx.clip(); ctx.fillStyle = `rgba(255,74,100,${.17 * c})`; ctx.fillRect(x - er, y - eh, er * 2, eh * 2);
    const lvl = clamp(c * 1.3), wy = y + eh * (1 - .66 * lvl), wob = Math.sin(tt * 3.4 + seed + side) * 1.3 * lvl;
    ctx.fillStyle = V2.grad(0, wy, 0, y + eh, [[0, 'rgba(206,238,255,.6)'], [1, 'rgba(112,178,240,.55)']]); ctx.fillRect(x - er, wy, er * 2, eh * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - er, wy + 1); ctx.quadraticCurveTo(x, wy - 3 + wob, x + er, wy + 1); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(x - er * .35, wy + eh * .28 * lvl + 2, er * .2, er * .09, -.3); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = `rgba(212,58,76,${.8 * c})`; ctx.lineWidth = 3.6 + 2.2 * c; ell(x, y, er + 2.2, eh + 2.2); ctx.stroke();
    if (c > .5) { const b = sm(.5, 1, c); ctx.fillStyle = 'rgba(190,228,255,.7)'; ctx.beginPath(); ctx.ellipse(x + side * er * .35, y + eh + 1, er * .45 * b + 1, 3 + 3.4 * b, 0, 0, TAU); ctx.fill(); }   /* brimming over the lower lid */
    /* the stream down the cheek, beside the mouth, inside the body */
    const yTop = y + eh * .92, yEnd = Math.min(k.mouthY + k.mw * .8 + 22, (k.ry || 100) * .88), len = Math.max(0, (yEnd - yTop)) * clamp(c * 1.4 - .12), x0 = x + side * er * .5, N = 14, pts = [];
    if (len > 5) {
      for (let i = 0; i <= N; i++) {
        const u = i / N, yy = yTop + len * u; let xx = x0 + side * (5 * Math.sin(u * PI * .9) + 4 * u) + Math.sin(tt * 2.2 + u * 5 + seed + side) * (.7 + 1.1 * c);
        const lim = tearHalf(k, yy) * .9, mn = (k.mw || 24) + 12; xx = side > 0 ? clampL(xx, mn, Math.max(mn, lim)) : clampL(xx, Math.min(-mn, -lim), -mn); pts.push([xx, yy]);
      }
      taper(pts, 6 + 8 * c, 4 + 4 * c, 'rgba(172,220,255,.66)', 'rgba(60,124,200,.6)', 1.7);
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.2; ctx.beginPath(); pts.forEach(([px, py], i) => { const q = [px - side * 1.6, py]; i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke();
      for (let j = 0; j < 2; j++) {   /* beads sliding down the stream */
        const u = (tt * (.5 + .5 * c) + j * .5 + side * .21 + seed * .07) % 1, i = Math.min(N, Math.floor(u * N)), q = pts[i];
        teardrop(q[0], q[1], 2.6 + 2.4 * c, .9 * sm(0, .12, u) * (1 - sm(.85, 1, u)), 0);
      }
      if (c > .3) {   /* the drip: swells at the end of the stream, drops, fades */
        const e = pts[N], p = (tt / 1.5 + side * .31 + seed * .11) % 1, grow = sm(0, .62, p), fall = seg(p, .62, 1);
        const r = (2.6 + 5.4 * c) * (.4 + .6 * grow), yy = e[1] + 5 + fall * fall * 84 * (.7 + .5 * c);
        teardrop(e[0], yy, r * (1 - .2 * fall), 1 - sm(.72, 1, fall), 0);
      }
    }
  }
  ctx.restore();
};
/* turn on the weeping for any character: A15.cryOn(A7.mango({...}), .8) */
A.cryOn = (o, cry = .8, extra = {}) => Object.assign({}, o, { cry, acc: (o.acc || []).filter(a => a !== 'fp15_tears').concat('fp15_tears') }, extra);
/* a faint mist round a weeping character: a cloud of tiny droplets drifting outward (a pure function of time). A15.tearsAura(x, y, u, o): centre x, y on the current canvas, u = strength 0..1,
 * o = { r: radius (300), n: droplets (56), t: time (T), size: droplet scale (1), seed, color: 'r,g,b' }; it is drawn in canvas pixels, so scale r and size with the sprite (s .44: r 130, size .6) */
A.tearsAura = (x, y, u = 1, o = {}) => {
  u = clamp(u); if (u <= .01) return;
  const t = o.t ?? T, R = o.r ?? 300, n = Math.round((o.n ?? 56) * (.3 + .7 * u)), rnd = V2.rng(o.seed ?? 5), sz = o.size ?? 1, col = o.color ?? '186,226,255';
  ctx.save();
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(x, y, 0, R * 1.05, [[0, V2.rgba(col, .15 * u)], [.55, V2.rgba(col, .07 * u)], [1, V2.rgba(col, 0)]]); ctx.fillRect(x - R * 1.1, y - R * 1.1, R * 2.2, R * 2.2);
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < n; i++) {
    const a0 = rnd() * TAU, sp = .35 + rnd() * .65, ph = rnd(), life = 2.2 + rnd() * 1.4, age = (t * sp / life + ph) % 1, rad = R * (.16 + .8 * Math.pow(age, .8)), ang = a0 + .3 * Math.sin(t * .6 + i), sw = .3 + rnd() * .6, dr = (2.2 + rnd() * 3.2) * sz;
    const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad * .78 - age * 28 + age * age * 40, al = u * Math.pow(Math.sin(PI * age), .8) * sw;
    ctx.fillStyle = V2.rgba(col, al * .75); ell(px, py, dr, dr * 1.15); ctx.fill();
    if (rnd() > .7) { ctx.fillStyle = `rgba(255,255,255,${al * .9})`; ell(px - dr * .3, py - dr * .35, dr * .35, dr * .3); ctx.fill(); }
  }
  ctx.restore();
};
// ---- round tinted thick-rimmed glasses
EXT.acc.fp15_onion_glasses = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), er = k.er * E.wide * (o.eyeScale || 1), r = er * 1.4, ex = k.eyeX, ey = k.eyeY;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2a1d17'; ctx.lineWidth = 6.5;   /* the bridge and the temples */
  ctx.beginPath(); ctx.moveTo(-ex + r * .92, ey - r * .12); ctx.quadraticCurveTo(0, ey - r * .62, ex - r * .92, ey - r * .12); ctx.stroke();
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * (ex + r * .97), ey - r * .12); ctx.quadraticCurveTo(sd * (ex + r * 1.5), ey - r * .1, sd * Math.min(k.rx * .93, ex + r * 2.3), ey + r * .3); ctx.stroke(); }
  for (const sd of [-1, 1]) {
    const x = sd * ex;
    ctx.fillStyle = V2.radial(x - r * .3, ey - r * .3, 1, r * 1.2, [[0, 'rgba(150,196,226,.34)'], [1, 'rgba(74,118,160,.38)']]); ell(x, ey, r, r * 1.03); ctx.fill();
    ctx.strokeStyle = '#2a1d17'; ctx.lineWidth = 8.5; ell(x, ey, r, r * 1.03); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,140,100,.5)'; ctx.lineWidth = 2; ell(x, ey, r + 2, r * 1.03 + 2); ctx.save(); ctx.clip(); ctx.beginPath(); ctx.moveTo(x - r * 1.3, ey - r * 1.3); ctx.lineTo(x + r * 1.3, ey - r * 1.3); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.arc(x, ey, r * .74, PI * 1.12, PI * 1.45); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, ey, r * .74, PI * .12, PI * .22); ctx.stroke();
  }
  ctx.restore();
};
// ---- the visor-style compliance badge: a green eyeshade visor with a blank plate (the scene letters it COMPLIANCE: A15.plate(o, 'onion_visor'))
const visorGeo = (o, k) => { const hy = headYawOf(o), W = o.visorW ?? Math.min(k.rx * .78, 84), yv = o.visorY ?? (k.eyeY - k.er * 3.5 - (o.browUp || 0)); return { hy, W, yv, h: 26 }; };
EXT.acc.fp15_visor_badge = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const { W, yv, h } = visorGeo(o, k);   /* (the turn: class 'head' in E15-TURN's accessory table, which turns it with the head) */
  ctx.save(); ctx.translate(0, yv); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#173d2e'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-W * .92, 2); ctx.quadraticCurveTo(0, -11, W * .92, 2); ctx.stroke();   /* the elastic band over the head */
  ctx.beginPath(); ctx.moveTo(-W, 0); ctx.quadraticCurveTo(0, -10, W, 0); ctx.lineTo(W * .94, h * .62); ctx.quadraticCurveTo(0, h * 1.3, -W * .94, h * .62); ctx.closePath();
  ctx.fillStyle = V2.grad(0, -8, 0, h * 1.1, [[0, 'rgba(98,214,168,.92)'], [1, 'rgba(24,126,92,.94)']]); ctx.fill(); ctx.strokeStyle = 'rgba(12,56,40,.95)'; ctx.lineWidth = 3.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.moveTo(-W * .9, 1); ctx.quadraticCurveTo(0, -8, W * .9, 1); ctx.lineTo(W * .88, 6); ctx.quadraticCurveTo(0, -3, -W * .88, 6); ctx.closePath(); ctx.fill();
  const pw = W * .56, py0 = h * .18, ph = h * .6;   /* the blank plate */
  ctx.fillStyle = '#f8f6ec'; ctx.strokeStyle = 'rgba(12,56,40,.9)'; ctx.lineWidth = 2.2; rr(-pw, py0, pw * 2, ph, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e0b13a'; for (const sd of [-1, 1]) { ell(sd * (pw + 2), py0 + ph / 2, 2.4, 2.4); ctx.fill(); }
  ctx.restore();
};
PLATES.onion_visor = { r: (o, k) => { const { W, yv, h } = visorGeo(o, k), pw = W * .56; return [-pw, yv + h * .18, pw, yv + h * .18 + h * .6]; } };
// ---- fp15_tabletclip: a clipboard with a tablet clamped to it (Onion's, and anyone's). o.tabScale, o.tabAt [.22, .1] (where the hand is on the board), o.tabRot, o.tabLit 0..1 (the screen glow)
function tabletBoard(w, h, o, t) {
  const lit = o.tabLit ?? 1;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = V2.grad(0, 0, w, h, [[0, '#c4905a'], [1, '#93673a']]); rr(0, 0, w, h, w * .07); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(30,16,8,.85)'; ctx.lineWidth = 3.2; rr(0, 0, w, h, w * .07); ctx.stroke();
  const tx = w * .09, ty = h * .11, tw = w * .82, th = h * .81;   /* the tablet: a black bezel, a lit screen */
  ctx.fillStyle = '#17181d'; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 2.4; rr(tx, ty, tw, th, 6); ctx.fill(); ctx.stroke();
  const sx = tx + 5, sy = ty + 6, sw = tw - 10, sh = th - 12;
  ctx.fillStyle = lit > .02 ? V2.grad(0, sy, 0, sy + sh, [[0, '#f2fbf6'], [1, '#d4ecde']]) : '#0e1014'; rr(sx, sy, sw, sh, 3); ctx.fill();
  if (lit > .02) {
    ctx.save(); rr(sx, sy, sw, sh, 3); ctx.clip(); ctx.globalAlpha *= lit;
    ctx.fillStyle = '#1e8e5a'; ctx.fillRect(sx, sy, sw, sh * .14);                                   /* the app's header bar */
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(sx + sw * .08, sy + sh * .05, sw * .4, sh * .04);
    for (let i = 0; i < 6; i++) {                                                                     /* rows: a status dot and a line */
      const yy = sy + sh * (.2 + i * .13), ok = i !== 2 && i !== 4;
      ctx.fillStyle = ok ? '#1e8e5a' : '#d93025'; ctx.beginPath(); ctx.arc(sx + sw * .13, yy + sh * .035, sh * .032, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(40,60,80,.32)'; ctx.fillRect(sx + sw * .26, yy + sh * .01, sw * (.6 - (i % 3) * .1), sh * .03); ctx.fillRect(sx + sw * .26, yy + sh * .06, sw * (.4 + (i % 2) * .1), sh * .02);
    }
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw * .6, sy); ctx.lineTo(sx, sy + sh * .5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = V2.grad(0, -h * .04, 0, h * .09, [[0, '#e8edf4'], [1, '#98a2b0']]); ctx.strokeStyle = 'rgba(30,36,50,.9)'; ctx.lineWidth = 2.6; rr(w * .28, -h * .04, w * .44, h * .09, w * .04); ctx.fill(); ctx.stroke();   /* the steel clip */
  ctx.strokeStyle = '#4a5468'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(w * .72, h * .005); ctx.bezierCurveTo(w * 1.04, h * .06, w * 1.06, h * .4, w * .96, h * .56); ctx.stroke();   /* the stylus on its string */
  ctx.save(); ctx.translate(w * .96, h * .56); ctx.rotate(.12); ctx.fillStyle = '#e9edf4'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(-3, 0, 6, h * .24, 2.4); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.restore();
  return [sx, sy, sx + sw, sy + sh];   /* the screen rectangle, in the board's own frame */
}
const TAB_W = 70, TAB_H = 94;
EXT.prop.fp15_tabletclip = (side, o, t) => {
  const S = o.tabScale || 1, w = TAB_W * S, h = TAB_H * S, at = o.tabAt || [.22, .1];
  ctx.save(); ctx.rotate(o.tabRot ?? -.05); ctx.translate(-w * at[0], -h * at[1]); tabletBoard(w, h, o, t); ctx.restore();
};
PROP_BOX.fp15_tabletclip = o => { const S = o.tabScale || 1, w = TAB_W * S, h = TAB_H * S, at = o.tabAt || [.22, .1]; return [-w * at[0] - 4, -h * at[1] - 6, w * (1 - at[0]) + 8, h * (1 - at[1]) + 4]; };
/* A15.tabletClip(x, y, o): the same board as a set piece (centre x, y; o.rot, o.tabScale, o.tabLit); returns the SCREEN rectangle { x, y, w, h } in the current canvas coordinates for the scene to overlay */
A.tabletClip = (x, y, o = {}) => {   /* x, y, w, h = the screen's top-left corner and size when rot = 0; cx, cy = its centre and rot its tilt (use these when it is tilted) */
  const S = o.tabScale || 1, w = TAB_W * S, h = TAB_H * S; ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.translate(-w / 2, -h / 2);
  const r = tabletBoard(w, h, o, T); ctx.restore(); const c = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0), dx = (r[0] + r[2]) / 2 - w / 2, dy = (r[1] + r[3]) / 2 - h / 2, cx = x + dx * c - dy * sn, cy = y + dx * sn + dy * c; return { x: cx - (r[2] - r[0]) / 2, y: cy - (r[3] - r[1]) / 2, cx, cy, w: r[2] - r[0], h: r[3] - r[1], rot: o.rot || 0 };
};
// ---- A15.onion(o): Onion, Compliance Officer. Options: cry 0..1 (default .6; the tears swell while she speaks), sob 0..1 (a hiccup shake of the shoulders), expr (onion_cry default, onion_stoic, onion_wail, or any engine
// ---- expression), pose 'clip' (the tablet clipboard in the left hand: default) | 'rest' | 'free', tabLit, visor false takes the visor off, glasses false takes the glasses off
const ONION_ACC = ['fp15_tears', 'fp15_onion_glasses', 'fp15_visor_badge'];
A.onion = o => {
  o = o || {};
  const seed = o.seed ?? 171, t = tOf(o), pose = o.pose || 'clip', sob = clamp(o.sob || 0);
  const P = pose === 'clip' ? { arms: { l: 'hold', r: 'rest' }, grip: { l: [-62, 84] }, hold: { l: 'fp15_tabletclip' }, tabAt: [.3, .12], tabRot: -.04 } : pose === 'rest' ? { arms: { l: 'rest', r: 'rest' } } : {};
  const r = Object.assign({ kind: 'onion', id: 'onion', who: 'onion', s: SC, y: G, seed, expr: 'onion_cry', cry: .6, browW: 9, browUp: 8, browColor: '#3a2a1a' }, P, o);
  r.t = t; r.acc = ONION_ACC.filter(a => !(a === 'fp15_visor_badge' && o.visor === false) && !(a === 'fp15_onion_glasses' && o.glasses === false)).concat((o.acc || []).filter(a => ONION_ACC.indexOf(a) < 0));
  if (sob > 0) {   /* a hiccup: a quick squash, a little roll, the brows jump */
    const ph = t * 13.5, hic = Math.pow(Math.max(0, Math.sin(ph)), 2);
    r.squash = (r.squash || 0) + .08 * sob * hic; r.plant = true; r.rot = (r.rot || 0) + Math.sin(ph * .5) * .03 * sob; r.browUp = (r.browUp || 0) + 4 * sob * hic;
  }
  return r;
};




// ================================================================== Tomato (HR): a glossy oblate sphere, a green calyx, a headset, an HR lanyard with a two-icon tag, a stack of forms
const TOM_SEGS = (() => { const rx = KINDS.tomato.rx, ry = KINDS.tomato.ry; return [
  [[0, -ry * .88], [rx * .2, -ry * .98], [rx * .62, -ry * 1.0], [rx * .86, -ry * .72]],
  [[rx * .86, -ry * .72], [rx * 1.02, -ry * .5], [rx * 1.04, ry * .35], [rx * .84, ry * .78]],
  [[rx * .84, ry * .78], [rx * .64, ry * 1.0], [rx * .2, ry * 1.02], [0, ry * .96]]]; })();
const tomR = profileOf(TOM_SEGS);
EXT.shape.tomato = p => mirrorPath(p, TOM_SEGS);
const TOM_RIBS = Array.from({ length: 5 }, (_, i) => ({ lon: ((i + .5) / 5) * TAU - PI + .2, a: .2 + sr(i, 21) * .12 }));   /* the grooves between the lobes: a list with a longitude */
EXT.tex.tomato = (o, k, t) => {
  const { rx, ry } = k, yaw = yawOf(o), R = Math.max(rx, ry) * 1.5;
  ctx.save();
  ctx.fillStyle = V2.grad(0, -ry, 0, ry * .2, [[0, 'rgba(255,196,120,.32)'], [1, 'rgba(255,196,120,0)']]); ctx.fillRect(-R, -R, R * 2, R * 2);   /* the shoulder is a little orange round the calyx */
  ctx.fillStyle = V2.grad(0, ry * .3, 0, ry, [[0, 'rgba(120,10,10,0)'], [1, 'rgba(120,10,10,.28)']]); ctx.fillRect(-R, ry * .3, R * 2, ry * .9);
  ctx.save(); faceHoleClip(k, 1.6, 0, 10, faceAngOf(o), tomR); ctx.lineCap = 'round';
  for (const rb of TOM_RIBS) {   /* ribs: soft dark grooves from the calyx down, with a light edge */
    const a = rb.lon + yaw, ca = Math.cos(a); if (ca < -.05) continue; const pts = [];
    for (let i = 0; i <= 14; i++) { const y = lerp(-ry * .8, ry * .9, i / 14); pts.push([tomR(y) * Math.sin(a) * (1 - .05 * Math.sin(i / 14 * PI)), y]); }
    ctx.strokeStyle = `rgba(110,8,8,${rb.a * (.4 + .6 * Math.max(0, ca))})`; ctx.lineWidth = 5; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.strokeStyle = `rgba(255,170,150,${.12 * Math.max(0, ca)})`; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x + 4, y) : ctx.moveTo(x + 4, y)); ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 36; i++) {   /* tiny pale specks of a ripe skin */
    const lon = (sr(i, 31) * 2 - 1) * PI, y = lerp(-ry * .8, ry * .86, sr(i, 32)), a = lon + yaw, ca = Math.cos(a); if (ca < .05) continue;
    const x = tomR(y) * Math.sin(a), yy = y; if (Math.abs(x) < k.eyeX + k.er * 1.4 && yy > k.eyeY - k.er * 2.9 && yy < k.mouthY + 40) continue;
    ctx.fillStyle = i % 3 ? 'rgba(255,214,190,.26)' : 'rgba(110,10,10,.22)'; ell(x, yy, 1.6 + sr(i, 33) * 1.6, (1.3 + sr(i, 34) * 1.2) * Math.max(.4, ca), sr(i, 35) * 3); ctx.fill();
  }
  ctx.restore();
};
/* the calyx: six sepals radiating from the top, drooping over the shoulders (a list with longitudes), and a short curled stem */
const TOM_SEP = Array.from({ length: 6 }, (_, i) => ({ lon: (i / 6) * TAU + (sr(i, 41) - .5) * .5, len: 50 + sr(i, 42) * 20, w: 16 + sr(i, 43) * 6 }));
EXT.top.tomato = (o, k, t, layer) => {
  const yaw = headYawOf(o), y0 = -k.ry * .88, front = layer === 'front';
  ctx.save(); ctx.translate(0, y0); ctx.lineJoin = 'round';
  const sw = Math.sin(t * 1.9 + (o.seed || 0)) * 1.2;
  const sep = TOM_SEP.map(s2 => ({ s: s2, z: Math.cos(s2.lon + yaw) })).sort((p, q) => p.z - q.z);
  for (const e of sep) {
    if (front ? e.z < -.05 : e.z >= -.05) continue;   /* the far sepals are drawn behind the body, the near ones over it */
    const a = e.s.lon + yaw, pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10, r = e.s.len * u; pts.push([r * Math.sin(a) * .98, -9 * Math.sin(PI * u * .85) * (.55 + .45 * Math.abs(Math.cos(a))) + 14 * u * u + r * .1 * Math.cos(a) * .35 + (u > .7 ? sw * (u - .7) : 0)]); }
    taper(pts, e.s.w * (.55 + .45 * Math.abs(Math.cos(a))), 3, V2.grad(-20, -10, 20, 14, [[0, '#7bc050'], [1, '#2f7a28']]), 'rgba(18,60,16,.92)', 2.4);
  }
  if (front) {
    ctx.fillStyle = V2.grad(-8, 0, 8, 0, [[0, '#8bb23a'], [1, '#4d6e1a']]); ctx.strokeStyle = 'rgba(32,50,10,.95)'; ctx.lineWidth = 3;   /* the stem */
    ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-6, -22); ctx.quadraticCurveTo(0, -30 + sw, 9 + sw, -34); ctx.lineTo(13 + sw, -26); ctx.quadraticCurveTo(4, -22, 7, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8dc8a'; ell(11 + sw, -30, 3.4, 4.4, .5); ctx.fill();
  }
  ctx.restore();
};
// ---- the headset: a band over the head (behind the body), ear cups that turn with o.yaw, a mic boom to the mouth
EXT.acc.fp15_headset = (o, k, t, layer) => {
  const yaw = headYawOf(o), rx = k.rx, ry = k.ry;
  const cup = side => { const a = side * PI / 2 + yaw, z = Math.cos(a), w = 11 + 40 * Math.abs(Math.cos(a)), x = (rx + 1) * Math.sin(a), y = -ry * .02; return { x, y, w, z, a }; };
  if (layer === 'back') {
    ctx.save(); ctx.lineCap = 'round';
    const rb = rx * 1.02, hy = ry * 1.3;   /* the band: an arc over the top */
    for (const [lw, col] of [[14, '#15161c'], [9, '#3a3d48'], [3, 'rgba(255,255,255,.25)']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(0, -ry * .02, rb * Math.abs(Math.cos(yaw)) + 6, hy, 0, PI * 1.02, TAU - PI * .02); ctx.stroke(); }
    for (const sd of [-1, 1]) { const c = cup(sd); if (c.z < 0) drawCup(c, sd); }
    ctx.restore(); return;
  }
  if (layer !== 'front') return;
  ctx.save(); ctx.lineCap = 'round';
  for (const sd of [-1, 1]) { const c = cup(sd); if (c.z >= 0) drawCup(c, sd); }
  const hy = faceAngOf(o), ch = Math.cos(hy);
  if (ch > .2) {   /* the boom from the left cup to the mouth */
    ctx.translate(rx * .85 * Math.sin(hy), 0); ctx.scale(ch, 1);
    const mx = -(k.mw + 28), my = k.mouthY + 24;
    ctx.strokeStyle = '#17181e'; ctx.lineWidth = 5.4; ctx.beginPath(); ctx.moveTo(-rx - 2, ry * .06); ctx.bezierCurveTo(-rx * .95, ry * .62, -rx * .5, ry * .8, mx - 10, my + 6); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = V2.grad(mx - 12, my - 8, mx + 8, my + 10, [[0, '#4a4d58'], [1, '#14151a']]); ctx.strokeStyle = '#0c0c10'; ctx.lineWidth = 2.4; ell(mx, my, 10, 8, -.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0545a'; ell(mx + 5, my - 2, 3, 3); ctx.fill();   /* the little red "live" light */
  }
  ctx.restore();
  function drawCup(c, sd) {
    ctx.save(); ctx.translate(c.x, c.y);
    ctx.fillStyle = V2.grad(-c.w / 2, 0, c.w / 2, 0, [[0, '#5a5e6c'], [.5, '#2c2e37'], [1, '#17181e']]); ctx.strokeStyle = '#0c0c10'; ctx.lineWidth = 3; rr(-c.w / 2, -27, c.w, 54, Math.min(14, c.w / 2)); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.16)'; rr(-c.w / 2 + 2, -23, Math.max(2, c.w * .22), 46, 3); ctx.fill();
    if (Math.abs(c.w) > 30) { ctx.fillStyle = '#9b7cdb'; ell(0, 0, c.w * .18, c.w * .18); ctx.fill(); ctx.strokeStyle = '#0c0c10'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
  }
};
// ---- the HR lanyard and the two-icon nametag (fruit or vegetable?): the strap runs round the body to a badge that hangs below it; o.tagSel 0..1 moves the gold ring from the fruit icon to the vegetable icon.
//      The empty label slot under the icons is for the scene's toggling label: A15.plate(o, 'tomato_tag')
const TAGW = 46, TAGH = 58;
const tagBox = k => ({ cx: 0, top: k.ry * 1.0 + 4, w: TAGW, h: TAGH });
EXT.acc.fp15_tomato_tag = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const ca = Math.cos(yawOf(o)); if (ca < .15) return;
  const B = tagBox(k), sel = clamp(o.tagSel ?? 0), sw = Math.sin(t * 1.8 + (o.seed || 0)) * .05;
  ctx.save(); ctx.lineCap = 'round'; ctx.translate(k.rx * .1 * Math.sin(yawOf(o)), 0);
  for (const sd of [-1, 1]) for (const [c, w] of [['#2a1e48', 8.4], ['#7a58d0', 5]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(sd * k.rx * .8 * ca, -k.ry * .05); ctx.quadraticCurveTo(sd * k.rx * .52 * ca, k.ry * .9, 0, B.top - 2); ctx.stroke(); }
  ctx.translate(0, B.top); ctx.rotate(sw); ctx.scale(ca, 1);
  ctx.fillStyle = '#9aa4b3'; rr(-6, -6, 12, 10, 3); ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#fbfaf6'; ctx.strokeStyle = 'rgba(40,24,80,.9)'; ctx.lineWidth = 2.6; rr(-B.w / 2, 2, B.w, B.h, 5); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = '#6d4fc4'; rr(-B.w / 2, 2, B.w, 13, 5); ctx.fill(); ctx.fillRect(-B.w / 2, 9, B.w, 6);
  const iy = 31, ix = [-11, 11];
  for (let i = 0; i < 2; i++) {   /* the two icons: a red fruit and an orange carrot, each in a ring; the gold ring says which one she has picked */
    const a = clamp(1 - Math.abs(sel - i) * 1.6);
    ctx.fillStyle = a > .5 ? 'rgba(255,224,140,.9)' : 'rgba(0,0,0,.05)'; ell(ix[i], iy, 10.5, 10.5); ctx.fill(); ctx.strokeStyle = a > .02 ? `rgba(214,150,20,${.4 + .6 * a})` : 'rgba(70,60,90,.35)'; ctx.lineWidth = 1.2 + 1.8 * a; ctx.stroke();
  }
  ctx.fillStyle = '#e03a30'; ctx.strokeStyle = 'rgba(80,10,10,.9)'; ctx.lineWidth = 1.4; ell(ix[0], iy + 1.5, 6, 5.6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3f9a36'; ell(ix[0] + 1.5, iy - 5, 3.2, 1.8, -.6); ctx.fill();
  ctx.fillStyle = '#f08a22'; ctx.beginPath(); ctx.moveTo(ix[1] - 4, iy - 4.5); ctx.lineTo(ix[1] + 4, iy - 3); ctx.lineTo(ix[1] - 1.2, iy + 7.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#3f9a36'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(ix[1] - 1, iy - 4); ctx.lineTo(ix[1] - 4, iy - 8.5); ctx.moveTo(ix[1] + 1, iy - 3.5); ctx.lineTo(ix[1] + 3.5, iy - 8); ctx.stroke();
  ctx.fillStyle = 'rgba(60,50,90,.1)'; rr(-B.w * .38, 44, B.w * .76, 12, 3); ctx.fill(); ctx.strokeStyle = 'rgba(60,50,90,.35)'; ctx.lineWidth = 1.2; ctx.stroke();   /* the empty label slot */
  ctx.restore();
};
PLATES.tomato_tag = { r: (o, k) => { const B = tagBox(k); return [-B.w * .38, B.top + 44, B.w * .38, B.top + 56]; } };
// ---- fp15_formstack: a stack of forms (HR's). Held from underneath; o.formsN sheets (default 9); sticky flags on the edge, a paperclip
const FORM_COL = ['#ffffff', '#f6f1dc', '#e4eefa', '#fbe9ee', '#eaf6e6'];
EXT.prop.fp15_formstack = (side, o, t) => {
  const N = Math.max(1, o.formsN ?? 9), shown = Math.min(N, 7), w = 56, h = 72, wob = Math.sin(t * 1.6 + (o.seed || 0)) * .01;
  ctx.save(); ctx.rotate(.06 + wob); ctx.translate(-14, -64); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (let i = shown - 1; i >= 0; i--) {   /* the lower sheets peek out to the lower right, each a little askew */
    ctx.save(); ctx.translate(i * 2.3, i * 2.1); ctx.rotate((sr(i, 51) - .5) * .05);
    ctx.fillStyle = FORM_COL[i % FORM_COL.length]; ctx.strokeStyle = 'rgba(50,50,60,.75)'; ctx.lineWidth = 1.8;
    if (i === 0) { ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2; }
    ctx.fillRect(0, 0, w, h); ctx.shadowColor = 'transparent'; ctx.strokeRect(0, 0, w, h); ctx.restore();
  }
  ctx.fillStyle = '#6d4fc4'; ctx.fillRect(0, 0, w, 11);   /* the top form: a header, boxes with ticks, lines, a signature line */
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(5, 4, 24, 3);
  for (let i = 0; i < 5; i++) {
    const y = 18 + i * 10; ctx.strokeStyle = 'rgba(60,70,100,.8)'; ctx.lineWidth = 1.2; ctx.strokeRect(5, y, 6, 6);
    ctx.fillStyle = 'rgba(70,80,110,.4)'; ctx.fillRect(15, y + 1, 34 - (i % 3) * 6, 2); ctx.fillRect(15, y + 4.5, 22 + (i % 2) * 8, 1.5);
    if (i % 2 === 0) { ctx.strokeStyle = '#1f7a3a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(6, y + 3); ctx.lineTo(8, y + 5.5); ctx.lineTo(11, y - 1); ctx.stroke(); }
  }
  ctx.strokeStyle = 'rgba(40,50,90,.7)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(8, h - 6); ctx.bezierCurveTo(14, h - 14, 20, h - 1, 28, h - 8); ctx.moveTo(6, h - 3); ctx.lineTo(48, h - 3); ctx.stroke();
  for (const [yy, col] of [[16, '#f2b8c6'], [34, '#ffd84a'], [50, '#8fd3ff']]) { ctx.fillStyle = col; ctx.strokeStyle = 'rgba(60,50,40,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(-10, yy + 1); ctx.lineTo(-10, yy + 8); ctx.lineTo(0, yy + 9); ctx.closePath(); ctx.fill(); ctx.stroke(); }   /* sticky flags */
  ctx.strokeStyle = '#b7bec9'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(w - 12, -4); ctx.lineTo(w - 12, 14); ctx.arc(w - 9, 14, 3, PI, 0, true); ctx.lineTo(w - 6, -2); ctx.stroke();   /* a paperclip */
  ctx.restore();
};
PROP_BOX.fp15_formstack = [-30, -72, 52, 22];
// ---- A15.tomato(o): Tomato, HR. Options: tomPose 'fruit' (default: bright, sweet) | 'veg' (stern, crisp) | a number 0..1 (a blend); flipT = seconds since she flipped (0..0.6: a quick turn of the face with a wobble: the
// ---- expression swaps in the middle of it); tomFrom = the pose she flipped away from (default: the other one); tagSel (default: follows the pose) moves the gold ring on the nametag; formsN (sheets in the stack);
// ---- headset false takes the headset off; expr overrides the face
const TOM_ACC = ['fp15_headset', 'fp15_tomato_tag'];
A.tomato = o => {
  o = o || {};
  const seed = o.seed ?? 181, t = tOf(o), num = v => v === 'veg' ? 1 : v === 'fruit' ? 0 : (typeof v === 'number' ? v : 0);
  const target = num(o.tomPose ?? 'fruit'), from = o.tomFrom != null ? num(o.tomFrom) : 1 - Math.round(target), ft = o.flipT;
  let pv = target, rot = 0, sx = 1;
  if (ft != null && ft >= 0 && ft < .7) {   /* the flip: the face turns away, swaps, turns back, with a little wobble */
    pv = ft < .09 ? from : target;
    rot = Math.exp(-ft * 6.2) * Math.sin(ft * 30) * .07 * (target >= from ? 1 : -1); sx = 1 - .2 * Math.sin(PI * seg(ft, 0, .2));
  }
  const veg = pv >= .5;
  const P = { arms: { l: 'hold', r: veg ? 'hips' : 'rest' }, grip: { l: [-104, 98] }, hold: { l: 'fp15_formstack' } };
  const r = Object.assign({ kind: 'tomato', id: 'tomato', who: 'tom', s: SC, y: G, seed, expr: 'tom_fruit', lashes: true, browColor: '#3a1410', sparkle: !veg }, P, o);
  r.t = t; r.acc = TOM_ACC.filter(a => !(a === 'fp15_headset' && o.headset === false)).concat((o.acc || []).filter(a => TOM_ACC.indexOf(a) < 0));
  if (o.expr == null) { r.expr = 'tom_fruit'; r.face = Object.assign(lerpFace(EXPR.tom_fruit, EXPR.tom_veg, pv), o.face || {}); }
  r.tagSel = o.tagSel ?? pv;
  r.rot = (r.rot || 0) + rot - (veg ? .02 : 0); r.sx = (o.sx || 1) * sx;
  return r;
};



// ================================================================== Broccoli (Administrator of Greenleaf): a stalk in a dark green suit under a huge crown of florets
const BROC_SEGS = (() => { const rx = KINDS.broc.rx, ry = KINDS.broc.ry; return [
  [[0, -ry * .98], [rx * .5, -ry * .98], [rx * .92, -ry * .86], [rx * .98, -ry * .5]],
  [[rx * .98, -ry * .5], [rx * 1.02, -ry * .1], [rx * .98, ry * .5], [rx * .88, ry * .8]],
  [[rx * .88, ry * .8], [rx * .8, ry * .98], [rx * .4, ry * 1.0], [0, ry * .98]]]; })();
const brocR = profileOf(BROC_SEGS);
EXT.shape.broc = p => mirrorPath(p, BROC_SEGS);
const BROC_FIB = Array.from({ length: 22 }, (_, i) => ({ lon: ((i + (sr(i, 71) - .5) * .5) / 22) * TAU - PI, a: .12 + sr(i, 72) * .12 }));   /* the fibres of the stalk */
EXT.tex.broc = (o, k, t) => {
  const { rx, ry } = k, yaw = yawOf(o), R = Math.max(rx, ry) * 1.5;
  ctx.save();
  ctx.fillStyle = V2.grad(0, -ry, 0, ry, [[0, 'rgba(60,110,40,.28)'], [.35, 'rgba(60,110,40,0)'], [1, 'rgba(255,255,220,.2)']]); ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.lineCap = 'round';
  for (const f of BROC_FIB) {   /* fine vertical fibres, a longitude each */
    const a = f.lon + yaw, ca = Math.cos(a); if (ca < -.02) continue; ctx.strokeStyle = `rgba(70,110,40,${f.a * (.4 + .6 * Math.max(0, ca))})`; ctx.lineWidth = 2.2;
    ctx.beginPath(); for (let i = 0; i <= 8; i++) { const y = lerp(-ry * .9, ry * .92, i / 8), x = brocR(y) * Math.sin(a); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  }
  ctx.restore();
};
/* the crown: florets on a cap (centre Cy, radii Rx, Ry): each a list item with a longitude and latitude. The cap overhangs the stalk and droops lower at the sides than over the face. */
const BR = { Cy: -98, Rx: 156, Ry: 104, r0: 12.5 };
const brRim = lon => (-8 - 24 * Math.abs(Math.sin(lon))) * PI / 180;   /* the lowest latitude of the cap at a body longitude: higher over the face, lower at the ears */
const BROC_FL = (() => {
  const L = []; let idx = 0;
  for (let ph = 90; ph > -36; ph -= 9) {
    const phr = ph * PI / 180, ring = Math.cos(phr), n = Math.max(1, Math.round(TAU * ring * BR.Rx / (BR.r0 * 1.66)));
    for (let i = 0; i < n; i++, idx++) {
      const lon = ((i + .5 * (idx % 2) + (sr(idx, 61) - .5) * .5) / n) * TAU - PI, phi = phr + (sr(idx, 62) - .5) * .08;
      if (phi < brRim(lon)) continue;
      L.push({ lon, phi, cp: Math.cos(phi), sp: Math.sin(phi), r: BR.r0 * (.82 + sr(idx, 63) * .4), tone: sr(idx, 64), ph: sr(idx, 65) * TAU });
    }
  }
  return L;
})();
function drawCrown(o, k, t, pass) {
  const yaw = headYawOf(o), br = 1 + .012 * Math.sin(t * 1.2 + (o.seed || 0)), Rx = BR.Rx * br, Ry = BR.Ry * br;
  const M = ctx.getTransform(), sc = Math.hypot(M.a, M.b), px0 = BR.r0 * sc, dots = px0 >= 7.5, hi = px0 >= 3.6, outline = px0 >= 2;   /* level of detail: small on screen = fewer strokes */
  const list = [];
  for (const f of BROC_FL) { const a = f.lon + yaw, z = f.cp * Math.cos(a); if (pass === 'back' ? z < 0 : z >= 0) list.push([z, f, a]); }
  list.sort((p, q) => p[0] - q[0]);
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(12,48,16,.78)'; ctx.lineWidth = 1.7;
  for (const [z, f, a] of list) {
    const sa = Math.sin(a), x = Rx * f.cp * sa, y = BR.Cy - Ry * f.sp, nx = f.cp * sa, ny = -f.sp;
    const lam = lamb(nx, ny, Math.max(z, .05)), sh = .06 * Math.sin(t * 1.7 + f.ph), r = f.r * (1 + .03 * Math.sin(t * 1.3 + f.ph * 2)) * (.9 + .12 * Math.max(0, z));
    const base = V2.mix(V2.mix('#2f8a34', '#6cc24a', f.tone), '#12361a', clamp(.45 - .3 * f.sp - (pass === 'back' ? .1 : 0)) * .55);
    ctx.fillStyle = lit(base, clamp(lam + sh), 1.05);
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (.94 + .06 * Math.abs(z)), 0, 0, TAU); ctx.fill(); if (outline) ctx.stroke();
    if (hi) { ctx.fillStyle = `rgba(196,240,140,${.16 + .34 * lam})`; ctx.beginPath(); ctx.ellipse(x - r * .3, y - r * .3, r * .46, r * .34, -.4, 0, TAU); ctx.fill(); }
    if (dots) { ctx.fillStyle = 'rgba(14,56,18,.45)'; ctx.beginPath(); ctx.moveTo(x + r * .28 + r * .16, y + r * .12); ctx.arc(x + r * .28, y + r * .12, r * .16, 0, TAU); ctx.moveTo(x - r * .1 + r * .13, y + r * .38); ctx.arc(x - r * .1, y + r * .38, r * .13, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
EXT.top.broc = (o, k, t, layer) => {
  if (layer === 'back') {   /* a dark underlay so the cap has no holes, then the far florets */
    ctx.save(); ctx.fillStyle = '#14451c'; ctx.beginPath(); ctx.ellipse(0, BR.Cy, BR.Rx * .96, BR.Ry * .98, 0, PI, TAU); ctx.lineTo(BR.Rx * .9, BR.Cy + 30); ctx.lineTo(-BR.Rx * .9, BR.Cy + 30); ctx.closePath(); ctx.fill(); ctx.restore();
    drawCrown(o, k, t, 'back'); return;
  }
  ctx.save(); ctx.fillStyle = '#17501f'; ctx.beginPath(); const pts = [];   /* the near underlay: the cap down to its rim */
  for (let i = 0; i <= 20; i++) { const lon = lerp(-PI / 2, PI / 2, i / 20), phm = brRim(lon + 0) + .06; pts.push([BR.Rx * .93 * Math.cos(phm) * Math.sin(lon), BR.Cy - BR.Ry * .93 * Math.sin(phm)]); }
  ctx.moveTo(pts[0][0], pts[0][1] - 40); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(pts[20][0], pts[20][1] - 40); ctx.closePath(); if (Math.abs(headYawOf(o)) < .6) ctx.fill(); ctx.restore();
  drawCrown(o, k, t, 'front');
};
// ---- the suit: a dark green jacket over the lower stalk (clipped to the body), a white shirt, lapels, a gold tie; the front features follow the turn
const SUIT_D = '#1f4f37', SUIT_L = '#2c6a49', GOLDT = '#e0b13a';
const suitTop = k => k.ry * .46;
EXT.acc.fp15_broc_suit = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  const yaw = yawOf(o), ca = Math.cos(yaw), sa = Math.sin(yaw), y0 = suitTop(k), R = k.rx, cx = R * .96 * sa;
  ctx.save(); ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
  ctx.fillStyle = V2.grad(0, y0 - 10, 0, k.ry, [[0, SUIT_L], [.4, SUIT_D], [1, '#143a28']]); ctx.fillRect(-R * 1.3, y0, R * 2.6, k.ry * 1.2);
  ctx.strokeStyle = 'rgba(8,30,20,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-R * 1.1, y0 + 2); ctx.lineTo(R * 1.1, y0 + 2); ctx.stroke();
  if (ca > .05) {
    const X = x => cx + x * ca;
    ctx.fillStyle = '#f4f6f0'; ctx.beginPath(); ctx.moveTo(X(-R * .3), y0 - 2); ctx.lineTo(X(R * .3), y0 - 2); ctx.lineTo(X(0), y0 + 70); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#12342a'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(X(sd * R * .32), y0 - 4); ctx.lineTo(X(sd * R * .06), y0 + 78); ctx.lineTo(X(sd * R * .52), y0 + 46); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = GOLDT; ctx.beginPath(); ctx.moveTo(X(-9), y0 + 1); ctx.lineTo(X(9), y0 + 1); ctx.lineTo(X(6), y0 + 15); ctx.lineTo(X(-6), y0 + 15); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(X(-6), y0 + 15); ctx.lineTo(X(6), y0 + 15); ctx.lineTo(X(12), y0 + 62); ctx.lineTo(X(0), y0 + 74); ctx.lineTo(X(-12), y0 + 62); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(130,90,10,.6)'; ctx.lineWidth = 2.4; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(X(-8), y0 + 24 + i * 11); ctx.lineTo(X(8), y0 + 30 + i * 11); ctx.stroke(); }
    ctx.fillStyle = '#0c2a1e'; for (const yy of [y0 + 82, y0 + 98]) { ell(X(0), yy, 3.4 * ca + .5, 3.4); ctx.fill(); }   /* buttons */
    ctx.fillStyle = '#f4f6f0'; ctx.beginPath(); ctx.moveTo(X(R * .5), y0 + 32); ctx.lineTo(X(R * .74), y0 + 30); ctx.lineTo(X(R * .72), y0 + 40); ctx.lineTo(X(R * .52), y0 + 42); ctx.closePath(); ctx.fill();   /* a pocket square */
    ctx.fillStyle = '#3aa86a'; ctx.beginPath(); ctx.ellipse(X(-R * .42), y0 + 14, 7 * ca + 1, 3.6, -.7, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(10,50,30,.9)'; ctx.lineWidth = 1.4; ctx.stroke();   /* a leaf pin */
  } else if (ca < -.05) { ctx.strokeStyle = 'rgba(8,30,20,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, k.ry); ctx.stroke(); }
  ctx.restore();
};
// ---- big bushy eyebrows: tufts along a dark bar, following the expression (the engine's own brows are hidden by browColor)
EXT.acc.fp15_broc_brows = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), er = k.er * E.wide * (o.eyeScale || 1);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';   /* class 'face': E15-TURN maps it onto the head */
  for (const side of [-1, 1]) {
    const ang = E.asym ? (side < 0 ? E.ang : -.3) : E.ang, by = k.eyeY - er * 1.42 - E.raise - (o.browUp || 0) - 8 + Math.sin(t * 3.1 + side) * .6;
    ctx.save(); ctx.translate(side * k.eyeX, by); ctx.rotate(side < 0 ? ang : -ang);
    const bw = er * 1.22, th = 20;
    ctx.fillStyle = '#26361a'; ctx.beginPath(); ctx.moveTo(-side * bw, -th * .5); ctx.quadraticCurveTo(0, -th * .9, side * bw, -th * .3); ctx.lineTo(side * bw, th * .3); ctx.quadraticCurveTo(0, th * .35, -side * bw, th * .5); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 15; i++) {   /* tufts: short strokes fanning up and outward */
      const u = i / 14, x = lerp(-side * bw, side * bw, u), len = 9 + sr(i, 81) * 9, a = -PI / 2 + side * (u - .45) * .9 + (sr(i, 82) - .5) * .5;
      ctx.strokeStyle = i % 3 ? '#33481f' : '#587a30'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, -th * .25 + (sr(i, 83) - .5) * 3); ctx.lineTo(x + Math.cos(a) * len, -th * .25 + Math.sin(a) * len); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
};
// ---- the Administrator's name plate (blank gold-rimmed plate: A15.plate(o, 'broc_tag'))
const brocTagR = k => [k.rx * .27, k.ry * .68, k.rx * .27 + 58, k.ry * .68 + 21];
EXT.acc.fp15_broc_tag = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const ca = Math.cos(yawOf(o)); if (ca < .25) return;
  const r = brocTagR(k), w = (r[2] - r[0]) * ca, h = r[3] - r[1], cx = (r[0] + r[2]) / 2 * ca + k.rx * .96 * Math.sin(yawOf(o));
  ctx.save(); ctx.translate(cx, (r[1] + r[3]) / 2); ctx.rotate(-.05);
  ctx.fillStyle = '#fbf8ec'; ctx.strokeStyle = GOLDT; ctx.lineWidth = 3.4; rr(-w / 2, -h / 2, w, h, 5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(60,50,20,.8)'; ctx.lineWidth = 1.2; rr(-w / 2 - 1.8, -h / 2 - 1.8, w + 3.6, h + 3.6, 6); ctx.stroke();
  ctx.restore();
};
PLATES.broc_tag = { r: (o, k) => brocTagR(k), rot: () => -.05 };
// ---- fp15_saladbowl: a big wooden bowl of salad with a fork and a leaf (held from underneath). o.bowlTilt, o.bowlFill 0..1
EXT.prop.fp15_saladbowl = (side, o, t) => {
  const fill = o.bowlFill ?? 1, sw = Math.sin(t * 1.4 + (o.seed || 0)) * .012;
  ctx.save(); ctx.rotate((o.bowlTilt ?? -.04) + sw); ctx.translate(0, -34); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#5a3a1c'; ctx.strokeStyle = 'rgba(30,16,6,.9)'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.ellipse(0, -18, 66, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();   /* the dark inside of the far rim */
  const greens = ['#5dae3a', '#8fd05a', '#3f8f2e', '#a6dc6c'];
  if (fill > .02) {
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI, x = Math.cos(a) * 46 * (.6 + sr(i, 91) * .5), y = -22 - Math.sin(a) * 20 * fill - sr(i, 92) * 8; ctx.save(); ctx.translate(x, y); ctx.rotate((sr(i, 93) - .5) * 1.4); ctx.fillStyle = greens[i % 4]; ctx.strokeStyle = 'rgba(20,70,16,.9)'; ctx.lineWidth = 2.2; ell(0, 0, 21, 11); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(230,255,190,.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(13, 0); ctx.stroke(); ctx.restore(); }
    for (const [x, y, r] of [[-26, -34, 8], [10, -40, 8.5], [32, -30, 7.5]]) { ctx.fillStyle = '#e9482f'; ctx.strokeStyle = 'rgba(100,10,10,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y * fill - 4 * (1 - fill), r, PI * .1, PI * 1.1); ctx.closePath(); ctx.fill(); ctx.stroke(); }   /* tomato wedges (HR will have opinions) */
    for (const [x, y] of [[-6, -30], [22, -38], [-34, -26]]) { ctx.fillStyle = '#c8e8a0'; ctx.strokeStyle = '#3f7a2a'; ctx.lineWidth = 2; ell(x, y, 9, 6.5); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(80,140,50,.6)'; ell(x, y, 3, 2); ctx.fill(); }   /* cucumber slices */
  }
  ctx.fillStyle = V2.grad(-66, 0, 66, 0, [[0, '#9a6a36'], [.35, '#c28a4c'], [1, '#6e4520']]); ctx.strokeStyle = 'rgba(30,16,6,.9)'; ctx.lineWidth = 3.4;   /* the wooden bowl */
  ctx.beginPath(); ctx.moveTo(-68, -18); ctx.bezierCurveTo(-66, 20, -36, 34, 0, 34); ctx.bezierCurveTo(36, 34, 66, 20, 68, -18); ctx.quadraticCurveTo(0, -4, -68, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,40,14,.4)'; ctx.lineWidth = 2; for (const k2 of [-.5, 0, .5]) { ctx.beginPath(); ctx.moveTo(k2 * 60, -6); ctx.quadraticCurveTo(k2 * 66, 14, k2 * 24, 31); ctx.stroke(); }
  ctx.strokeStyle = '#e2b672'; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(-66, -17); ctx.quadraticCurveTo(0, -3, 66, -17); ctx.stroke();   /* the lighter rim */
  ctx.save(); ctx.translate(38, -44); ctx.rotate(.5); ctx.strokeStyle = '#d6dbe4'; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(0, -6); ctx.stroke();   /* the fork */
  ctx.lineWidth = 2.6; for (const dx of [-5, -1.7, 1.7, 5]) { ctx.beginPath(); ctx.moveTo(dx, -4); ctx.lineTo(dx, -17); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(5, -4); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(-52, -20); ctx.rotate(-.5); ctx.fillStyle = '#4fb04a'; ctx.strokeStyle = 'rgba(20,70,16,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -18, 0, -30); ctx.quadraticCurveTo(-9, -16, 0, 0); ctx.fill(); ctx.stroke(); ctx.restore();   /* one leaf on the rim */
  ctx.restore();
};
PROP_BOX.fp15_saladbowl = [-70, -96, 72, 6];
// ---- A15.broccoli(o): Broccoli, Administrator of Greenleaf. Options: expr (broc_boom default, broc_stern, any engine expression), the usual pose options (default: the salad bowl in the left hand, the right hand out for a
// ---- handshake), bowl false puts the bowl down (arms rest), shimmer (the crown's breathing, always on)
const BROC_ACC = ['fp15_broc_suit', 'fp15_broc_brows', 'fp15_broc_tag'];
A.broccoli = o => {
  o = o || {};
  const seed = o.seed ?? 191, t = tOf(o), bowl = o.bowl !== false;
  const P = bowl ? { arms: { l: 'hold', r: 'offer' }, grip: { l: [-118, 98] }, hold: { l: 'fp15_saladbowl' }, hand: { r: 'flat' } } : { arms: { l: 'rest', r: 'offer' }, hand: { r: 'flat' } };
  const r = Object.assign({ kind: 'broc', id: 'broc', who: 'broc', s: SC, y: G, seed, expr: 'broc_boom', browColor: 'rgba(0,0,0,0)' }, P, o);
  r.t = t; r.acc = BROC_ACC.concat((o.acc || []).filter(a => BROC_ACC.indexOf(a) < 0));
  return r;
};



// ================================================================== Carrot (Greenleaf charge nurse): a tall ridged cone with a feathery top: rotationally symmetric, so it walks in profile as well as it stands
const CAR_SEGS = (() => { const rx = KINDS.carrot.rx, ry = KINDS.carrot.ry; return [
  [[0, -ry], [rx * .62, -ry], [rx, -ry * .86], [rx, -ry * .62]],
  [[rx, -ry * .62], [rx * .98, -ry * .1], [rx * .34, ry * .7], [rx * .15, ry * .95]],
  [[rx * .15, ry * .95], [rx * .1, ry * 1.02], [rx * .05, ry * 1.04], [0, ry * 1.04]]]; })();
const carR = profileOf(CAR_SEGS, 18);
EXT.shape.carrot = p => mirrorPath(p, CAR_SEGS);
const CAR_RIDGES = Array.from({ length: 17 }, (_, i) => ({ y: lerp(-.5, .86, (i + (sr(i, 101) - .5) * .5) / 16.5), lon0: -PI * (.55 + sr(i, 102) * .45), lon1: PI * (.4 + sr(i, 103) * .6), a: .22 + sr(i, 104) * .22, w: 2 + sr(i, 105) * 2.2 }));   /* fine horizontal ridges: arcs with a longitude span */
const CAR_HAIRS = Array.from({ length: 7 }, (_, i) => ({ y: lerp(-.2, .8, sr(i, 111)), lon: (sr(i, 112) * 2 - 1) * PI, len: 7 + sr(i, 113) * 9 }));
EXT.tex.carrot = (o, k, t) => {
  const { rx, ry } = k, yaw = yawOf(o), R = Math.max(rx, ry) * 1.5;
  ctx.save();
  ctx.fillStyle = V2.grad(0, -ry, 0, ry, [[0, 'rgba(255,214,140,.3)'], [.5, 'rgba(255,200,120,0)'], [1, 'rgba(120,40,0,.34)']]); ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.save(); faceHoleClip(k, 1.5, 4, 12, faceAngOf(o), carR); ctx.lineCap = 'round';
  for (const rg of CAR_RIDGES) {   /* each ridge: an arc on the cone at height y, a dark line with a light lip under it */
    const y = rg.y * ry, Rr = carR(y), a0 = Math.max(rg.lon0 + yaw, -PI / 2), a1 = Math.min(rg.lon1 + yaw, PI / 2); if (a1 - a0 < .2 || Rr < 3) continue;
    const arc = dy => { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const a = lerp(a0, a1, i / 12), x = Rr * Math.sin(a), yy = y + dy + Rr * .14 * Math.cos(a); i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); };
    ctx.strokeStyle = `rgba(255,214,150,${.28})`; ctx.lineWidth = rg.w; arc(rg.w * .9); ctx.strokeStyle = `rgba(130,52,6,${rg.a + .08})`; ctx.lineWidth = rg.w; arc(0);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(120,50,8,.6)'; ctx.lineWidth = 2;
  for (const h of CAR_HAIRS) { const a = h.lon + yaw, ca = Math.cos(a); if (ca < .2) continue; const y = h.y * ry, x = carR(y) * Math.sin(a) * .98; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(a) * h.len, y + h.len * .5); ctx.stroke(); }
  ctx.restore();
};
/* the fronds: seven feathery stalks (items with a longitude and a lean) with paired leaflets; the far ones are drawn behind the body, the near ones over its crown */
const CAR_FR = Array.from({ length: 8 }, (_, i) => ({ lon: ((i + (sr(i, 121) - .5) * .5) / 8) * TAU - PI, lean: .3 + sr(i, 122) * .6, len: 118 + sr(i, 123) * 40, curl: (sr(i, 124) - .5) * 1.4, ph: sr(i, 125) * TAU }));
EXT.top.carrot = (o, k, t, layer) => {
  const yaw = headYawOf(o), front = layer === 'front', list = CAR_FR.map(f => ({ f, z: Math.cos(f.lon + yaw) })).sort((p, q) => p.z - q.z);
  ctx.save(); ctx.translate(0, -k.ry + 2); ctx.lineJoin = 'round';
  for (const { f, z } of list) {
    if (front ? z < -.05 : z >= -.05) continue;
    const a = f.lon + yaw, sa = Math.sin(a), lean = f.lean + .05 * Math.sin(t * 1.6 + f.ph), pts = [], N = 12;
    for (let i = 0; i <= N; i++) { const u = i / N, d = f.len * (Math.sin(lean) * u + f.curl * .3 * u * u), h = f.len * (Math.cos(lean) * u - .28 * u * u); pts.push([d * sa, -h, d * Math.cos(a)]); }
    const P2 = pts.map(p => [p[0], p[1]]);
    const col = z > 0 ? '#58b840' : '#3f9a30';
    taper(P2, 7, 2.4, col, 'rgba(22,70,18,.9)', 2);
    for (let i = 3; i < N; i++) {   /* the leaflets: pairs, shorter toward the tip, each a small pointed leaf */
      const u = i / N, p = pts[i], q = pts[i + 1] || pts[i], dx = q[0] - pts[i - 1][0], dy = q[1] - pts[i - 1][1], L = Math.hypot(dx, dy) || 1, len = (24 - 16 * u) * (.8 + .2 * Math.abs(Math.cos(a)));
      for (const sd of [-1, 1]) { const ang = Math.atan2(dy, dx) + sd * (.95 - .25 * u), tipx = p[0] + Math.cos(ang) * len, tipy = p[1] + Math.sin(ang) * len, mx = (p[0] + tipx) / 2 - Math.sin(ang) * sd * 2, my = (p[1] + tipy) / 2 + Math.cos(ang) * sd * 2; taper([[p[0], p[1]], [mx, my], [tipx, tipy]], 6.2 - 3 * u, 1.2, i % 2 ? '#6fcf4c' : '#4aa83a', 'rgba(22,70,18,.85)', 1.4); }
    }
  }
  ctx.restore();
};
// ---- Greenleaf uniform: green scrubs and a Greenleaf lanyard that fit ANY kind (they hang off eyeX / mouthY / mw / the shoulders); A15.greenleaf(o) dresses any character in them
const GL_G = '#3a9a66', GL_D = '#2a7a50', GL_L = '#62c48f';
const scrubsTop = (o, k) => o.scrubsTop ?? (k.mouthY + Math.max(22, (k.mw || 24) * .9) + 14);
EXT.acc.fp15_gl_scrubs = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  const yaw = yawOf(o), ca = Math.cos(yaw), sa = Math.sin(yaw), top = scrubsTop(o, k), R = k.rx, cx = R * .9 * sa, X = x => cx + x * ca;
  ctx.save(); ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
  ctx.fillStyle = V2.grad(0, top, 0, Math.max(k.ry, top + 40), [[0, GL_L], [.5, GL_G], [1, GL_D]]); ctx.beginPath();
  const hem = o.scrubsHem != null ? top + o.scrubsHem : null, bot = hem != null ? hem : k.ry * 1.4 + 40;
  if (ca > .05) { ctx.moveTo(-R * 1.3, top + 12); ctx.lineTo(X(-24), top); ctx.lineTo(X(0), top + 36); ctx.lineTo(X(24), top); ctx.lineTo(R * 1.3, top + 12); }
  else { ctx.moveTo(-R * 1.3, top + 10); ctx.quadraticCurveTo(cx, top - 14, R * 1.3, top + 10); }
  if (hem != null) { ctx.lineTo(R * 1.3, hem); ctx.quadraticCurveTo(0, hem + 14, -R * 1.3, hem); } else { ctx.lineTo(R * 1.3, bot); ctx.lineTo(-R * 1.3, bot); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,70,46,.3)'; ctx.lineWidth = 2; for (let x = -R; x <= R; x += 15) { ctx.beginPath(); ctx.moveTo(x, top + 26); ctx.lineTo(x * 1.03, hem != null ? hem + 4 : k.ry * 1.3); ctx.stroke(); }
  if (hem != null) { ctx.strokeStyle = 'rgba(12,56,34,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(R * 1.3, hem); ctx.quadraticCurveTo(0, hem + 14, -R * 1.3, hem); ctx.stroke(); ctx.strokeStyle = 'rgba(236,250,242,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(R * 1.3, hem - 4); ctx.quadraticCurveTo(0, hem + 10, -R * 1.3, hem - 4); ctx.stroke(); }
  if (ca > .05) {
    ctx.strokeStyle = 'rgba(12,56,34,.65)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(-24), top); ctx.lineTo(X(0), top + 36); ctx.lineTo(X(24), top); ctx.stroke();
    ctx.strokeStyle = 'rgba(236,250,242,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(-18), top + 3); ctx.lineTo(X(0), top + 27); ctx.lineTo(X(18), top + 3); ctx.stroke();
    ctx.save(); ctx.translate(X(-R * .46), top + 50);   /* the chest pocket: a pen and a tiny leaf patch */
    ctx.fillStyle = GL_G; ctx.strokeStyle = 'rgba(12,56,34,.7)'; ctx.lineWidth = 2.4; rr(-19 * ca - 1, -4, 38 * ca + 2, 32, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8e2d0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; rr(-6 * ca, -17, 4.4, 28, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a6fdb'; ctx.fillRect(-6 * ca, -13, 4.4, 4);
    ctx.fillStyle = '#f2fbf5'; ctx.beginPath(); ctx.ellipse(6 * ca, 14, 6 * ca + .5, 3.6, -.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};
function glLanGeo(k) {
  const [shx, shy] = shoulder(k, 1), sx = Math.min(Math.abs(shx) * .8, k.rx * .72), sy = shy - 2, by = Math.min(k.ry * .84, Math.max(k.mouthY + (k.mw || 24) * 1.2 + 24, sy + 56));
  return { sx, sy, by, w: 34, h: 44 };
}
EXT.acc.fp15_greenleaf_lanyard = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const yaw = yawOf(o), ca = Math.cos(yaw); if (ca < .15) return;
  const g = glLanGeo(k), sw = Math.sin(t * 1.9 + (o.seed || 0)) * .05;
  ctx.save(); ctx.translate(k.rx * .2 * Math.sin(yaw), 0); ctx.lineCap = 'round';
  for (const sd of [-1, 1]) for (const [c, w] of [['#f4f7f2', 7.4], [GL_G, 3.8]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(sd * g.sx * ca, g.sy); ctx.quadraticCurveTo(sd * g.sx * .45 * ca, g.by - 8, 0, g.by); ctx.stroke(); }
  ctx.translate(0, g.by); ctx.rotate(sw); ctx.scale(ca, 1);
  ctx.fillStyle = '#9aa4b3'; rr(-4, -2, 8, 8, 2); ctx.fill();
  ctx.translate(0, 5); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#fbfcf8'; ctx.strokeStyle = 'rgba(16,60,40,.9)'; ctx.lineWidth = 2.3; rr(-g.w / 2, 0, g.w, g.h, 4); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = GL_D; rr(-g.w / 2, 0, g.w, g.h * .27, 4); ctx.fill(); ctx.fillRect(-g.w / 2, g.h * .13, g.w, g.h * .14);
  ctx.fillStyle = GL_L; ctx.beginPath(); ctx.ellipse(0, g.h * .5, g.w * .15, g.h * .1, -.7, 0, TAU); ctx.fill();   /* the leaf logo */
  ctx.fillStyle = 'rgba(30,60,48,.2)'; ctx.fillRect(-g.w * .36, g.h * .7, g.w * .72, g.h * .09); ctx.fillRect(-g.w * .36, g.h * .83, g.w * .5, g.h * .07);
  ctx.restore();
};
PLATES.gl_lanyard = { r: (o, k) => { const g = glLanGeo(k); return [-g.w * .36, g.by + 5 + g.h * .66, g.w * .36, g.by + 5 + g.h * .94]; } };   /* the lettering strip of the badge */
const GL_CONFLICT = ['lanyard', 'lanyard7', 'badge', 'badge7', 'scrubs', 'fp13_scrubs', 'suit', 'nametag', 'nametag9', 'cardigan', 'vestknit', 'gown', 'perdiem', 'agency'];
/* A15.greenleaf(o): any character's options dressed as Greenleaf staff (green scrubs, the Greenleaf lanyard); accessories that would sit on the same spot are dropped. Pass { scrubs: false } or { lanyard: false } to dress half. */
A.greenleaf = (o, opt = {}) => {
  const keep = (o.acc || []).filter(a => GL_CONFLICT.indexOf(a) < 0 && a !== 'fp15_gl_scrubs' && a !== 'fp15_greenleaf_lanyard');
  return Object.assign({}, o, { acc: keep.concat(opt.scrubs === false ? [] : ['fp15_gl_scrubs']).concat(opt.lanyard === false ? [] : ['fp15_greenleaf_lanyard']) });
};
// ---- A15.carrot(o): the Greenleaf charge nurse. Options: expr (carrot_calm default, carrot_polite, carrot_firm, any engine expression), the usual pose options (default: arms at rest); he is dressed in the Greenleaf scrubs and lanyard
const CAR_ACC = ['fp15_gl_scrubs', 'fp15_greenleaf_lanyard'];
A.carrot = o => {
  o = o || {};
  const seed = o.seed ?? 201, t = tOf(o);
  const r = Object.assign({ kind: 'carrot', id: 'carrot', who: 'carrot', s: SC, y: G, seed, expr: 'carrot_calm', browColor: '#5a2a0a', browW: 8.5, arms: { l: 'rest', r: 'rest' }, scrubsHem: 84 }, o);
  r.t = t; r.acc = CAR_ACC.concat((o.acc || []).filter(a => CAR_ACC.indexOf(a) < 0));
  return r;
};
// ================================================================== props and accessories
// ---- fp15_megaphone: a red megaphone held at the mouth (the crane foreman's). o.megaAng (-.18), o.megaWaves 0..1 (sound arcs from the bell), o.megaScale
EXT.prop.fp15_megaphone = (side, o, t) => {
  const S = o.megaScale || 1, w = o.megaWaves || 0;
  ctx.save(); ctx.scale((side < 0 ? -1 : 1) * S, S); ctx.rotate(o.megaAng ?? -.18); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#1e1f26'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-7, -4, 14, 34, 5); ctx.fill(); ctx.stroke();   /* the grip */
  ctx.fillStyle = '#d3d6dd'; ctx.beginPath(); ctx.arc(0, 8, 3.2, 0, TAU); ctx.fill();   /* the trigger */
  const gr = V2.grad(0, -48, 0, 22, [[0, '#ff7a54'], [.5, '#e5432a'], [1, '#a82814']]);
  ctx.fillStyle = gr; ctx.strokeStyle = 'rgba(60,14,6,.95)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(96, -50); ctx.quadraticCurveTo(106, -22, 96, 8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.stroke();   /* the horn */
  ctx.fillStyle = '#f7f4ec'; ctx.beginPath(); ctx.moveTo(52, -34); ctx.lineTo(72, -42); ctx.quadraticCurveTo(80, -20, 72, 4); ctx.lineTo(52, 4); ctx.closePath(); ctx.fill();   /* the white band: a blank plate */
  ctx.fillStyle = '#26272e'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-16, -14, 14, 24, 5); ctx.fill(); ctx.stroke();   /* the mouthpiece */
  ctx.fillStyle = V2.grad(96, -50, 96, 8, [[0, '#7a1a0c'], [1, '#3a0a04']]); ctx.beginPath(); ctx.ellipse(98, -21, 10, 30, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(60,14,6,.95)'; ctx.stroke();   /* the bell */
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(8, -9); ctx.lineTo(88, -42); ctx.lineTo(88, -36); ctx.lineTo(8, -4); ctx.closePath(); ctx.fill();
  if (w > .02) for (let i = 0; i < 3; i++) { const ph = ((t * 1.6 + i / 3) % 1), r = 16 + 70 * ph; ctx.strokeStyle = `rgba(255,255,255,${.85 * w * (1 - ph)})`; ctx.lineWidth = 4.6 * (1 - ph * .5); ctx.beginPath(); ctx.arc(104, -21, r, -.9, .9); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp15_megaphone = Object.assign([-20, -58, 132, 34], { mirror: true, nearFace: true });
// ---- fp15_hardhat: a hard hat on ANY character's head (the crane crew's). o.hatColor, o.hatY (the base line), o.hatScale
EXT.acc.fp15_hardhat = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const hy = o.hatY ?? Math.min(-k.ry * .76, k.eyeY - k.er * 2.5 - (o.browUp || 0) - 4), W = Math.min(k.rx * .92, 98) * (o.hatScale || 1), col = o.hatColor || '#f4be1c', H = W * .78;
  ctx.save(); ctx.translate(0, hy); ctx.lineJoin = 'round';   /* class 'head': E15-TURN turns it with the head */
  ctx.fillStyle = V2.grad(-W, -H, W, 0, [[0, V2.rgba(V2.mix(col, '#ffffff', .35), 1)], [.5, col], [1, V2.rgba(V2.mix(col, '#7a4a00', .45), 1)]]); ctx.strokeStyle = 'rgba(70,42,0,.95)'; ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(-W, 0); ctx.bezierCurveTo(-W * 1.0, -H * 1.05, W * 1.0, -H * 1.05, W, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.rgba(V2.mix(col, '#7a4a00', .25), 1); ctx.beginPath(); ctx.moveTo(-W * .16, -H * .94); ctx.bezierCurveTo(-W * .16, -H * 1.07, W * .16, -H * 1.07, W * .16, -H * .94); ctx.lineTo(W * .12, -H * .3); ctx.lineTo(-W * .12, -H * .3); ctx.closePath(); ctx.fill(); ctx.stroke();   /* the ridge */
  ctx.beginPath(); ctx.moveTo(-W * 1.14, 2); ctx.quadraticCurveTo(0, 12, W * 1.14, 2); ctx.quadraticCurveTo(0, -7, -W * 1.14, 2); ctx.closePath(); ctx.fillStyle = V2.rgba(V2.mix(col, '#7a4a00', .18), 1); ctx.fill(); ctx.stroke();   /* the brim */
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(-W * .45, -H * .62, W * .22, H * .12, -.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fbfaf2'; ctx.strokeStyle = 'rgba(70,42,0,.9)'; ctx.lineWidth = 2; rr(-W * .2, -H * .6, W * .4, H * .24, 4); ctx.fill(); ctx.stroke();   /* a blank plate on the front */
  ctx.restore();
};
// ---- fp15_laptop: an open laptop held from underneath (the hand grips the front of the base) or on a desk. The SCREEN rectangle is exposed: A15.laptopScreen(o) -> [x0, y0, x1, y1] in the hand's frame (the same
// ---- frame as PROP_BOX); A15.laptop(x, y, o) draws one as a set piece (x, y = the middle of the front edge) and returns { x, y, w, h } of the screen in canvas coordinates. o.lapScale, o.lapBack (true: we see the lid's back
// ---- with the logo, e.g. the consultant behind it), o.lapScreen false = a blank screen for the scene to fill with the sheet, o.lapOpen 0..1 (the lid angle: foreshortens the screen)
const LAP = { w: 124, h: 84 };
const lapRect = o => { const S = o.lapScale || 1, op = clamp(o.lapOpen ?? 1) * .25 + .75, w = LAP.w, h = LAP.h * op; return [(-w / 2 + 8) * S, (-9 - h + 8) * S, (w / 2 - 8) * S, (-9 - 8) * S]; };
function laptopDraw(o, t) {
  const S = o.lapScale || 1, op = clamp(o.lapOpen ?? 1) * .25 + .75, w = LAP.w, h = LAP.h * op, back = !!o.lapBack;
  ctx.save(); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = V2.grad(0, -9, 0, 6, [[0, '#d9dde5'], [1, '#8e95a1']]); ctx.strokeStyle = 'rgba(20,22,30,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2 - 4, -8); ctx.lineTo(w / 2 + 4, -8); ctx.lineTo(w / 2 + 8, 3); ctx.quadraticCurveTo(0, 8, -w / 2 - 8, 3); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();   /* the base */
  ctx.fillStyle = 'rgba(30,32,40,.45)'; rr(-14, -1.5, 28, 4, 2); ctx.fill();   /* the finger notch */
  const lx = -w / 2, ly = -9 - h;
  ctx.fillStyle = back ? V2.grad(lx, ly, lx + w, ly + h, [[0, '#c4c9d3'], [1, '#868d9a']]) : '#17181d'; ctx.strokeStyle = 'rgba(14,16,22,.95)'; ctx.lineWidth = 3.4; rr(lx, ly, w, h, 7); ctx.fill(); ctx.stroke();
  if (back) {   /* the back of the lid with the maker's mark: a rounded hexagon with three dots */
    ctx.save(); ctx.translate(0, ly + h / 2); ctx.strokeStyle = 'rgba(30,34,44,.85)'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * PI / 3 + PI / 6; ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); } ctx.closePath(); ctx.stroke();
    ctx.fillStyle = 'rgba(30,34,44,.85)'; for (const [dx, dy] of [[-6, 4], [6, 4], [0, -6]]) { ell(dx, dy, 2.6, 2.6); ctx.fill(); } ctx.restore();
  } else {
    const sx = lx + 8, sy = ly + 8, sw = w - 16, sh = h - 16;
    ctx.fillStyle = o.lapScreen === false ? '#f3f5f8' : '#ffffff'; rr(sx, sy, sw, sh, 3); ctx.fill();
    if (o.lapScreen !== false) {   /* a miniature sheet: a green ribbon, a grid, a selected cell */
      ctx.save(); rr(sx, sy, sw, sh, 3); ctx.clip();
      ctx.fillStyle = '#1e8e5a'; ctx.fillRect(sx, sy, sw, sh * .12); ctx.fillStyle = '#f1f3f5'; ctx.fillRect(sx, sy + sh * .12, sw, sh * .1); ctx.fillRect(sx, sy + sh * .12, sw * .08, sh);
      ctx.strokeStyle = '#d9dce1'; ctx.lineWidth = 1; for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(sx + sw * (.08 + i * .115), sy + sh * .12); ctx.lineTo(sx + sw * (.08 + i * .115), sy + sh); ctx.stroke(); } for (let j = 0; j < 8; j++) { ctx.beginPath(); ctx.moveTo(sx, sy + sh * (.22 + j * .098)); ctx.lineTo(sx + sw, sy + sh * (.22 + j * .098)); ctx.stroke(); }
      ctx.strokeStyle = '#2b6cff'; ctx.lineWidth = 2; ctx.strokeRect(sx + sw * .195, sy + sh * .32, sw * .23, sh * .098); ctx.fillStyle = 'rgba(43,108,255,.12)'; ctx.fillRect(sx + sw * .195, sy + sh * .32, sw * .23, sh * .098);
      ctx.restore();
    }
    ctx.fillStyle = '#2a2c34'; ell(0, ly + 4, 1.8, 1.8); ctx.fill();   /* the camera */
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(lx + 6, ly + 6); ctx.lineTo(lx + w * .55, ly + 6); ctx.lineTo(lx + 6, ly + h * .7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(30,34,44,.55)'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * PI / 3 + PI / 6; ctx.lineTo(Math.cos(a) * 3.8, Math.sin(a) * 3.8 - 3); } ctx.closePath(); ctx.fill();   /* the little mark on the base lip */
  }
  ctx.restore();
}
EXT.prop.fp15_laptop = (side, o, t) => { ctx.save(); ctx.rotate(o.lapRot ?? -.04); laptopDraw(o, t); ctx.restore(); };
PROP_BOX.fp15_laptop = o => { const S = o.lapScale || 1, h = LAP.h * (clamp(o.lapOpen ?? 1) * .25 + .75); return [-(LAP.w / 2 + 8) * S - 2, -(9 + h) * S - 2, (LAP.w / 2 + 8) * S + 2, 8 * S + 2]; };
A.laptopScreen = lapRect;
A.laptop = (x, y, o = {}) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); laptopDraw(o, T); const r = lapRect(o); ctx.restore();
  const c = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0), cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
  const mx = x + cx * c - cy * sn, my = y + cx * sn + cy * c; return { x: mx - (r[2] - r[0]) / 2, y: my - (r[3] - r[1]) / 2, cx: mx, cy: my, w: r[2] - r[0], h: r[3] - r[1], rot: o.rot || 0 };
};
// ================================================================== E15-TURN integration: what the turnaround rig needs to know about this kit (a no-op while the rig is not in the build)
sec('turn', () => {
  if (!V2C.YAW_ACC || !V2C.YAW_TEX || !V2C.YAW_TOP || !V2C.ACC_CLS) return;
  /* accessories that handle the turn themselves (they read o.yaw / o.headYaw through yawOf / headYawOf): an override that calls them as they are */
  const own = (name, cls) => { const f = (o, k, t, layer) => EXT.acc[name](o, k, t, layer); f.cls = cls; V2C.YAW_ACC[name] = f; };
  for (const [n, c] of Object.entries({ fp15_arti: 'chest', fp15_tomato_tag: 'chest', fp15_broc_suit: 'wrap', fp15_broc_tag: 'chest', fp15_gl_scrubs: 'wrap', fp15_greenleaf_lanyard: 'chest', fp15_headset: 'head' })) own(n, c);
  /* frontal art the rig's own mapping turns: what sits on the face, on the head, on the chest */
  Object.assign(V2C.ACC_CLS, { fp15_tears: 'face', fp15_onion_glasses: 'face', fp15_broc_brows: 'face', fp15_visor_badge: 'head', fp15_hardhat: 'head', fp15_bind: 'chest' });
  /* textures and tops with a longitude per item: they turn themselves */
  for (const kind of ['arti', 'onion', 'tomato', 'broc', 'carrot', 'bind']) {
    V2C.YAW_TEX[kind] = (o, k, t) => EXT.tex[kind](o, k, t);
    V2C.YAW_TOP[kind] = (o, k, t, layer) => { if (EXT.top[kind]) EXT.top[kind](o, k, t, layer); };
  }
});
/* @@END3 */




/* @@END (new sections are inserted above this line) */
})();
