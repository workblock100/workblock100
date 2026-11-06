'use strict';
/* SHIFT HAPPENS, Episode 21: "The Inspection". Builder E21-ARRIVE. Scenes `arrive` (3:02 PM, THE ARRIVAL, 24.67 s) and `exit` (10:45 PM, THE EXIT INTERVIEW, 32.86 s).
 * Registers window.__EP21_SCENES.arrive / .exit. The surveyors come from window.A21 (ep21_art.js: A21.kale, A21.radish, fp21_clipboard) and the stamp from window.H21 (ep21_hud.js) when they have
 * landed; until then this file draws its own stand-ins (checked at DRAW time, never at load).
 *
 * THE STATION (both scenes): one flat stage, world units, floor line FL 1250 (the camera is zoomTo on a point or a face). Left to right: the glass front doors (x 40-420, two swinging leaves, the sun or
 * the snowy night outside), the lobby (a plant, the mat), the nurses' station (counter x 600-1190: the laptop where Binder lives, the monitor, the coffee maker), the wall behind it (the NURSES' STATION
 * sign, the clock, the poster that is FUN COMMITTEE or HAND HYGIENE), the storage closet (x 1240-1420, Brenda's), then the hall (room doors, the handrail, sanitizer). The PA speaker is in the ceiling.
 *
 * ARRIVE shots (scene-local s; every start snapped to a frame; the boundary frame is the NEW shot):
 *   open 0-0.70 the lobby and the station: the doors swing open on the chime (0.40), the sun floods in, the staff freeze mid-motion |
 *   sil 0.70-1.70 the doorway: two silhouettes against the sun, long shadows, a slow push-in (dramatic 0.70) |
 *   ka1a 1.70-3.30 Ms. Kale steps out of the glare into the light, Mr. Radish behind her: "Department of Health." (the badge comes up on "Health") |
 *   ka1b 3.30-4.87 closer, the badge held to the lens: "This is an unannounced survey." |
 *   chain 4.87-8.67 THE WHISPER CHAIN: one tracking move left to right down the station and the hall: Mango -> Lemon (m1 5.12), Lemon -> Tomato (l1 6.25), Tomato -> Onion (t1 7.48); each face drains as
 *     the news lands; the move ends on Onion, who lights up | o1 8.67-10.23 Onion out loud, arms up (sniffle 9.67), Tomato recoils | o2 10.23-12.45 close: tears of joy, she hugs a policy binder (sniffle 12.13) |
 *   ra0a 12.45-13.75 Mr. Radish holds out his hand: "We will start with your staffing sheet." | ra0b 13.75-15.11 the staff look at each other; on the chime (14.66) every head goes up |
 *   pa 15.11-16.55 the ceiling speaker: "Code Survey. Code Survey." | scat 16.55-17.75 "All staff to your stations.": everyone scatters at once, Strawberry does not move |
 *   str 17.75-18.60 Strawberry alone with the laptop; Binder pops out (binderpop 18.24) | b1 18.60-20.72 the bubble: YES / NO | st1 20.72-21.64 the whole staff leans into one shot: "Yes!" |
 *   b2 21.64-22.45 the bubble: "Great! I'll hide everything." | grin 22.45-23.22 Binder's grin, the glint (grin 22.54) | end 23.22-24.67 the surveyors, clipboards up, pens ready (sting 23.32).
 *
 * EXIT shots: the conference room at night (a flat stage, floor FLC 1300: the window, the long table x 420-1600 with the staff seated behind it, the surveyors standing at its head on the left, the
 * corner armchair under a floor lamp and the wall clock on the right), then the station at night.
 *   open 0-1.50 the table, everyone tense | ka1 1.50-3.00 Kale: "We found one deficiency." | gasp 3.00-3.61 the table gasps (gasp 3.00), Onion clutches her binders | me1 3.61-4.41 Melon, sweating |
 *   ra1a 4.41-5.95 Radish: "Your nurse has not taken a break." | ra1b 5.95-7.19 every head turns to Strawberry (on "break") | s1 7.19-9.21 Strawberry: "Which nurse?", held through "The one." |
 *   ka2a 9.21-10.45 Kale, the pen toward the corner | ka2b 10.45-11.59 the empty armchair under the lamp | o1 11.59-13.07 Onion: "Per regulation!" (sniffle 12.49) |
 *   clock 13.07-14.32 the wall clock, 10:59; the second hand starts its sweep on the tick (13.27) | s2 14.32-15.08 Strawberry: "Okay." |
 *   break 15.08-18.68 THE BREAK, one held shot: she sits (chairsit 15.18), her eyes close, the exhale (15.88), a slow push-in in the lamp light, the second hand sweeps the last of the minute
 *     (clocktick 17.98 at the twelve), the minute hand drops onto 11:00 and the shift bell rings (18.38) |
 *   ka3a 18.68-19.45 Kale: "Deficiency corrected." | ka3b 19.45-20.65 her clipboard: the CORRECTED stamp lands (stamp 19.63) |
 *   revert 20.65-22.75 the station at night, one wide: the surveyors walk out, the door shuts (20.75), the agency Strawberries vanish (poof 21.25), the closet opens and Brenda strolls out with her
 *     sandwich (21.65), the coffee maker is back (22.15), the labels peel off and flutter down, the poster flips back to FUN COMMITTEE (labelpeel 22.55) |
 *   eg1 22.75-24.07 the doors swing open on the chime (22.80), Eggplant bursts in, snowy, the pizza box: "I'm here!" | s3 24.07-24.91 "From the ditch?" | eg2 24.91-26.55 "Spring came early." |
 *   s4 26.55-28.24 Strawberry hands her the report sheet: "Report. Everyone is alive." | eg3 28.24-29.66 "Any concerns?" | s5 29.66-30.91 "I took a break." (the smallest smile) |
 *   end 30.91-32.86 the last two-shot (sting 31.01).
 * Speakers are drawn sharp and 300 px or taller while they speak; V2.dof is only ever used for the room and for listeners who are silent.
 */
(() => {
if (!window.TIMELINE_EP21 || !window.H6 || !window.UI || !window.A7 || !window.A11 || !window.A15) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15;
const PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const rg = (x, y, r0, r1, stops) => V2.radial(x, y, r0, r1, stops);
const rnd = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : (v => v - Math.floor(v))(Math.sin(s * 127.1 + k * 311.7) * 43758.5453);
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const mixc = (a, b, k) => '#' + V2.mix(a, b, c01(k)).map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => { const [r, g, b] = V2.rgb(c); const q = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${q(r)},${q(g)},${q(b)})`; };
const INKC = 'rgba(25,16,30,.82)';
const pulse = (lt, t0, hz = 30, tau = .1) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const poly = (pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.lineJoin = 'round'; ctx.stroke(); } };
const glow = (x, y, r, color, a, core) => { if (a <= .003) return; if (window.FX18 && typeof FX18.glow === 'function') FX18.glow(ctx, { x, y, r, color: 'rgb(' + V2.rgb(color).join(',') + ')', alpha: a, core: core ?? .4 }); else V2.glow(x, y, r, V2.rgb(color).join(','), Math.min(1, a), 'screen', .3); };
const puff = (x, y, r, lt, t0, o = {}) => { if (lt < t0 || lt > t0 + (o.life || .8) + .05) return; if (window.FX18 && typeof FX18.puff === 'function') FX18.puff(ctx, Object.assign({ x, y, r, t: lt, t0 }, o)); else { const k = sg(lt, t0, t0 + (o.life || .8)); ctx.save(); ctx.globalAlpha *= .7 * (1 - k); ctx.fillStyle = o.color || '#efe6d6'; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, d = r * .55 * eo(k); ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * .6, r * (.3 + .4 * eo(k)), 0, TAU); ctx.fill(); } ctx.restore(); } };

// ------------------------------------------------------------------ the frozen timeline: beats, words, frame snapping (helpers as in ep18_station.js / ep20_forecast.js)
const TLX = window.TIMELINE_EP21;
function tl(id) {
  const SCN = TLX.scenes.find(s => s.id === id), START = SCN.start, LN = {};
  for (const l of TLX.lines) if (l.scene === id) LN[l.id] = l;
  return { SCN, START, LN, bS: b => SCN.beats[b].s, bE: b => SCN.beats[b].e, ls: b => LN[b].s - START, le: b => LN[b].e - START,
    wS: (b, i) => LN[b].s - START + LN[b].words[i][1], wE: (b, i) => LN[b].s - START + LN[b].words[i][2], snapT: t => Math.round((START + t) * 30) / 30 - START };
}
/* the loudness of a recorded line at scene time lt (0..1, from the mouth track): it drives the PA speaker's rings */
function voice(T0, id, lt) {
  const l = T0.LN[id]; if (!l) return 0;
  const f = (lt - (l.s - T0.START)) * 30; if (f < 0 || f >= l.mouth.length) return 0;
  const i = Math.floor(f), j = Math.min(l.mouth.length - 1, i + 1), u = f - i, dg = n => (l.mouth.charCodeAt(n) - 48) / 9;
  return lerp(dg(i), dg(j), u);
}
const TA = tl('arrive'), TE = tl('exit');
/* is line `id` being spoken at lt (with a little lead and tail for the acting) */
const talking = (T0, id, lt, a = .08, b = .18) => !!T0.LN[id] && lt >= T0.ls(id) - a && lt < T0.le(id) + b;

// ------------------------------------------------------------------ text: hero only where it is safe (big enough, clear of the edges, the caption zone and the clock pill)
let SOFT = 0;                                              /* > 0 while a blurred background is drawn: its text is never hero */
let HEROMODE = false;                                      /* true only while a shot draws its subject sharp (the badge, the clock, the form) */
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
function scrBox(cx, cy, hw, hh) {
  const m = ctx.getTransform(); let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [u, v] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) { const X = m.a * (cx + u) + m.c * (cy + v) + m.e, Y = m.b * (cx + u) + m.d * (cy + v) + m.f; a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y); }
  return { x0: a, y0: b, x1: c, y1: d };
}
function heroOK(size, cx, cy, w, h = size) {
  if (SOFT || !HEROMODE || size * scrOf(ctx) < 31) return false;
  const b = scrBox(cx, cy, w / 2 + 10, h * .5 + 10);
  return b.x0 >= 50 && b.x1 <= W - 50 && b.y0 >= 50 && b.y1 <= 1372 && !(b.x0 < 506 && b.y0 < 250 && b.x1 > 40 && b.y1 > 108);
}
/* a label: hero when heroOK says so (or o.hero), else set dressing (crop allowed). o.align 'left' | 'right' anchors the ink edge at cx. */
function TXT(str, cx, cy, o = {}) {
  const size0 = o.size || 30, fit = o.maxW ? UI.fit(str, o.maxW, { size: size0, font: o.font, weight: o.weight, italic: o.italic, spacing: o.spacing, lw: o.lw }) : null, size = fit ? fit.size : size0;
  const wd = (fit ? fit.w : UI.sizeOf(str, o).w) || size * str.length * .6, mid = o.align === 'left' ? cx + wd / 2 : o.align === 'right' ? cx - wd / 2 : cx;
  const hero = o.hero !== undefined ? !!o.hero : heroOK(size, mid, cy, wd);
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: o.crop !== undefined ? o.crop : !hero }));
}

// ------------------------------------------------------------------ frame tests (as ep20_forecast.js): is a character wholly / partly inside the frame?
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s - (o.topExtra || 0) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function inFrame(o, pad = 0) {
  const b = boxOf(o, pad), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
/* draw a character only when it is wholly inside the frame, or (a camera move carrying it through an edge) as a body in transit; never at scale 0 */
function drawIn(o, pad = 12) {
  if (!o || (o.s || 0) < .02) return;
  const f = inFrame(o, pad);
  if (!f.inter) return;
  if (!f.whole) o = Object.assign({}, o, { transit: true });
  drawChar(o);
}
const sorted = list => list.filter(Boolean).sort((a, b) => (a.y + (a.dz || 0)) - (b.y + (b.dz || 0)));
/* a paler version of a character's skin (the news drains the colour out of a face) */
function pale(o, k) {
  if (k <= .01) return o;
  const base = o.colors || (KINDS[o.kind] && KINDS[o.kind].c); if (!base) return o;
  o.colors = base.map((c, i) => mixc(c, i === 2 ? '#8a8478' : '#f1ede4', k * (i === 2 ? .35 : .5)));
  return o;
}

// ------------------------------------------------------------------ the State (A21) when it has landed, stand-ins until then (checked at DRAW time)
const hasA = n => !!(window.A21 && typeof A21[n] === 'function');
const hasH = n => !!(window.H21 && typeof H21[n] === 'function');
const STAND_EX = { kale_neutral: 'neutral', kale_note: 'neutral', kale_raise: 'smug', kale_satisfied: 'smug', radish_flat: 'neutral', radish_note: 'neutral', radish_impressed: 'hopeful', radish_buried: 'shock' };
/* Ms. Kale / Mr. Radish: o carries x, y, s, t, expr ('kale_*' | 'radish_*'), pose (the kit's: 'clip' | 'write' | 'rest' | 'free' | 'tablet' | 'tap'), cbPen, yaw, look, arms ... (A21 when it has landed; else a stand-in
 * with our own clipboard) */
function kaleO(o) {
  if (hasA('kale')) return A21.kale(o);
  const r = Object.assign({ kind: 'cherry', id: 'kale', who: 'kale', colors: ['#9ccf86', '#3f7d33', '#163d12'], acc: ['suit', 'readers', 'lanyard7'], seed: 211 }, o); r.expr = STAND_EX[o.expr] || 'neutral';
  return o.pose === 'rest' || o.pose === 'free' ? r : withClip(r, o);
}
function radishO(o) {
  if (hasA('radish')) return A21.radish(o);
  const r = Object.assign({ kind: 'apple', id: 'radish', who: 'radish', colors: ['#ff8a9a', '#d2264a', '#5e0a1c'], acc: ['suit', 'glasses', 'lanyard7'], seed: 212 }, o); r.expr = STAND_EX[o.expr] || 'neutral';
  return o.pose === 'rest' || o.pose === 'free' ? r : withClip(r, o);
}
/* the stand-in clipboard in the left hand (only while A21 has not landed) */
function withClip(r, o) {
  r.arms = Object.assign({ l: 'rest', r: 'rest' }, o.arms || {}); r.arms.l = 'hold';
  r.hold = Object.assign({}, o.hold || {}, { l: 'fp21a_clip' }); r.grip = Object.assign({}, o.grip || {}, { l: [-70, 50] }); r.gripSpace = 'screen';
  r.cbTicks = o.cbTicks ?? 3; r.clipScale = 1.25;
  return r;
}
/* our clipboard stand-in: a brown board, a checklist with ticks, a silver clip (o.cbTicks, o.clipScale, o.clipRot, o.clipStamp 0..1 a red CORRECTED block) */
EXT.prop.fp21a_clip = (side, o, t) => {
  const S = o.clipScale || 1.25, n = Math.round(o.cbTicks ?? 3);
  ctx.save(); ctx.rotate((o.clipRot ?? -.06) * side); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#b98a55'; ctx.strokeStyle = 'rgba(30,16,8,.85)'; ctx.lineWidth = 2.6; rr(-34, -70, 68, 92, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fbf9f2'; ctx.fillRect(-28, -60, 56, 76); ctx.strokeStyle = 'rgba(70,60,40,.4)'; ctx.lineWidth = 1.4; ctx.strokeRect(-28, -60, 56, 76);
  ctx.fillStyle = '#1f3166'; ctx.fillRect(-24, -56, 48, 8);
  ctx.strokeStyle = 'rgba(70,60,40,.45)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) { const y = -38 + i * 13; ctx.beginPath(); ctx.moveTo(-10, y); ctx.lineTo(22, y); ctx.stroke(); ctx.strokeRect(-23, y - 5, 8, 8);
    if (i < n) { ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-22, y - 1); ctx.lineTo(-19, y + 2); ctx.lineTo(-14, y - 6); ctx.stroke(); ctx.strokeStyle = 'rgba(70,60,40,.45)'; ctx.lineWidth = 1.4; } }
  ctx.fillStyle = '#a9b1bd'; rr(-14, -76, 28, 13, 3); ctx.fill(); ctx.strokeStyle = 'rgba(30,16,8,.85)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
};
PROP_BOX.fp21a_clip = Object.assign([-46, -104, 46, 32], { nearFace: true });

/* Ms. Kale's ID card held up to the lens: a white card on a navy strap, the photo, DEPARTMENT OF HEALTH, STATE, SURVEYOR. o.cardUp 0..1 (it turns to face us), o.cardScale. Big text is hero when it is big on screen. */
EXT.prop.fp21a_idcard = (side, o, t) => {
  const S = o.cardScale || 1, up = c01(o.cardUp ?? 1), w = 176, h = 116;
  ctx.save(); ctx.rotate((1 - up) * .5 * side - .04 * side); ctx.scale(S * (.55 + .45 * up), S); ctx.lineJoin = 'round';
  ctx.translate(0, -h * .5 - 10);
  ctx.strokeStyle = '#22356b'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-30, -h / 2 + 4); ctx.lineTo(-44, -h / 2 - 40); ctx.moveTo(30, -h / 2 + 4); ctx.lineTo(44, -h / 2 - 40); ctx.stroke();
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#fbfcff'; rr(-w / 2, -h / 2, w, h, 10); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; rr(-w / 2, -h / 2, w, h, 10); ctx.stroke();
  ctx.save(); ctx.beginPath(); rr(-w / 2, -h / 2, w, h, 10); ctx.clip(); ctx.fillStyle = '#22356b'; ctx.fillRect(-w / 2, -h / 2, w, 24); ctx.restore();
  ctx.fillStyle = '#d9e6c8'; rr(-w / 2 + 10, -h / 2 + 32, 46, 58, 4); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#3f7d33'; ctx.beginPath(); ctx.ellipse(-w / 2 + 33, -h / 2 + 64, 15, 18, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1f3166'; ctx.fillRect(-w / 2 + 13, -h / 2 + 78, 40, 12);
  ctx.fillStyle = '#c9a43a'; ctx.beginPath(); ctx.arc(w / 2 - 20, h / 2 - 20, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 1.6; ctx.stroke();
  if (up > .92) {
    UI.container('fp21a_card', 'board', [-w / 2, -h / 2, w / 2, h / 2], 4);
    TXT('DEPARTMENT OF HEALTH', 0, -h / 2 + 12.5, { size: 13, fill: '#fff', weight: 900, spacing: 1, maxW: w - 20, hero: false, cid: 'fp21a_card' });
    TXT('STATE', 32, -6, { size: 34, font: 'Bangers', weight: 400, fill: '#22356b', spacing: 2, maxW: 104, cid: 'fp21a_card' });
    TXT('SURVEYOR', 32, 26, { size: 16, fill: '#22356b', weight: 900, spacing: 1, maxW: 104, cid: 'fp21a_card' });
  }
  ctx.restore();
};
PROP_BOX.fp21a_idcard = Object.assign([-96, -200, 96, 14], { nearFace: true });
/* a policy binder hugged to the chest with both arms (drawn from the left hand, which sits at the binder's left edge): o.hugScale */
EXT.prop.fp21a_hug = (side, o, t) => {
  const S = o.hugScale || 1, w = 112, h = 140;
  ctx.save(); ctx.scale(S, S); ctx.translate(52, 6); ctx.rotate(-.08); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(-w / 2, -h / 2, w / 2, h / 2, [[0, '#3d5aa0'], [1, '#1f3166']]); rr(-w / 2, -h / 2, w, h, 8); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.2; ctx.stroke();
  ctx.fillStyle = '#16224a'; rr(-w / 2, -h / 2, 16, h, 6); ctx.fill();
  ctx.fillStyle = '#e9ecf2'; rr(-w / 2 + 24, -h / 2 + 22, w - 40, 40, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#c2272d'; ctx.fillRect(-w / 2 + 30, -h / 2 + 30, w - 52, 7); ctx.fillStyle = 'rgba(40,40,70,.5)'; ctx.fillRect(-w / 2 + 30, -h / 2 + 44, (w - 52) * .7, 6);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-w / 2 + 20, h / 2 - 34, w - 30, 6);
  ctx.restore();
};
PROP_BOX.fp21a_hug = Object.assign([-20, -70, 120, 90], { nearFace: true });
/* the pizza box under Eggplant's arm (F19 when it is loaded); o.pizzaScale, o.pizzaOpen */
EXT.prop.fp21a_pizza = (side, o, t) => {
  const S = o.pizzaScale || .62;
  ctx.save(); ctx.rotate(-.12 * side);
  if (window.F19 && typeof F19.dish === 'function') F19.dish(ctx, 'pizzaBox', { x: 0, y: 20, s: S, open: o.pizzaOpen || 0, t, seed: 4 });
  else { ctx.scale(S, S); ctx.fillStyle = '#d9b07a'; rr(-150, -40, 300, 60, 6); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#c2272d'; ctx.fillRect(-150, -24, 300, 10); }
  ctx.restore();
};
PROP_BOX.fp21a_pizza = Object.assign([-110, -40, 110, 40], { nearFace: true });
/* the report sheet: a clipboard with the shift report (lines, a few ticks, REPORT across the top as dressing) */
EXT.prop.fp21a_report = (side, o, t) => {
  const S = o.repScale || 1.2;
  ctx.save(); ctx.rotate((o.repRot ?? .05) * side); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = '#c4925a'; ctx.strokeStyle = 'rgba(30,16,8,.85)'; ctx.lineWidth = 2.6; rr(-36, -84, 72, 100, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fbfaf3'; ctx.fillRect(-30, -74, 60, 84); ctx.fillStyle = '#c2272d'; ctx.fillRect(-26, -70, 52, 9);
  ctx.fillStyle = 'rgba(50,50,70,.5)'; for (let i = 0; i < 6; i++) ctx.fillRect(-24, -52 + i * 10, i % 3 === 2 ? 30 : 46, 3.5);
  ctx.fillStyle = '#a9b1bd'; rr(-15, -90, 30, 13, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
};
PROP_BOX.fp21a_report = Object.assign([-48, -116, 48, 26], { nearFace: true });
/* an AGENCY sticker on an agency Strawberry's chest (A21.agencyBadge when it exists): a yellow tag, the word as dressing */
EXT.acc.fp21a_agency = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .38, k.ry * .34); ctx.rotate(-.08);
  ctx.fillStyle = '#ffd23f'; rr(-34, -13, 68, 26, 6); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#c2272d'; ctx.fillRect(-26, -4, 52, 8);
  ctx.restore();
};
function agencyO(o) {
  let r = A11.straw(o);
  if (window.A21 && typeof A21.agencyBadge === 'function') { const q = A21.agencyBadge(r); if (q && typeof q === 'object') r = q; }
  else if (window.A21 && typeof A21.agencyBadge === 'string') r.acc = (r.acc || []).concat([A21.agencyBadge]);
  else r.acc = (r.acc || []).concat(['fp21a_agency']);
  return r;
}
/* the stamp: H21.stamp when it exists, else a UI.stamp that lands with a squash (t0 = the impact) */
function stampAt(x, y, o) {
  const age = o.t - o.t0; if (age < -.12) return;
  if (hasH('stamp')) { H21.stamp(ctx, Object.assign({ color: '#d6203a' }, o, { x, y })); return; }
  const k = age < 0 ? 1.6 - 0 * age : 1 + .18 * Math.exp(-age * 9) * Math.cos(age * 30), a = age < 0 ? c01(1 + age / .12) * .5 : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(k * (o.s || 1), (age >= 0 && age < .06 ? .86 : 1) * k * (o.s || 1)); ctx.globalAlpha *= a;
  UI.stamp(o.text || 'CORRECTED', 0, 0, { size: o.size || 64, rot: o.rot ?? -.08, color: o.color || '#d6203a', hero: age >= .12 });
  ctx.restore();
}
/* a survey label (blank print lines, no text: it is safe to peel and flutter); o = { x, y, w, h, rot, peel 0..1 (the corner lifts), fall (seconds since it let go), seed } */
function labelBlank(o) {
  const w = o.w || 64, h = o.h || 34, f = o.fall ?? -1, sd = o.seed || 1;
  ctx.save();
  if (f >= 0) { const dx = 60 * Math.sin(f * 3.1 + sd) * Math.min(1, f * 2) + (rnd(sd, 2) - .5) * 80 * f, dy = 240 * f * f + 60 * f; ctx.translate(o.x + dx, o.y + dy); ctx.rotate((o.rot || 0) + Math.sin(f * 7 + sd) * 1.1 * Math.min(1, f * 3)); ctx.scale(1, .55 + .45 * Math.abs(Math.cos(f * 6 + sd))); }
  else { ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); }
  const pl = c01(o.peel || 0);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; if (f < 0) ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2 - 14 * pl, -h / 2); ctx.lineTo(w / 2, -h / 2 + 12 * pl); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,40,60,.45)'; ctx.lineWidth = 1.4; ctx.stroke();
  if (pl > .02) { ctx.fillStyle = '#e4e6ec'; ctx.beginPath(); ctx.moveTo(w / 2 - 14 * pl, -h / 2); ctx.lineTo(w / 2 - 20 * pl, -h / 2 - 9 * pl); ctx.lineTo(w / 2 + 6 * pl, -h / 2 + 6 * pl); ctx.lineTo(w / 2, -h / 2 + 12 * pl); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#e8542e'; ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w * .5, 3.5);
  ctx.fillStyle = 'rgba(40,40,60,.55)'; ctx.fillRect(-w / 2 + 4, -h / 2 + 11, w - 12, 2.6); ctx.fillRect(-w / 2 + 4, -h / 2 + 17, w * .6, 2.6);
  ctx.restore();
}

// ================================================================== THE STATION (arrive by day; the revert and Eggplant in exit by night)
const FL = 1250;
const DOOR = { x0: 40, x1: 420, y0: 560, y1: 1250, mx: 230 };                     /* the glass front doors: two leaves hinged at x0 and x1, meeting at mx */
const CT = { x0: 600, x1: 1190, top: 1060 };                                       /* the counter of the nurses' station */
const CLOSET = { x0: 1220, x1: 1380, y0: 650, y1: 1250 };                          /* the storage closet (Brenda's) */
const LAP = { x: 760, s: 1.5 };                                                    /* the laptop on the counter: Binder lives in it */
const COF = { x: 1128, s: .52 };                                                   /* the coffee maker */
const PA = { x: 1000, y: 214 };                                                    /* the ceiling speaker */
const ROOMS = [[1560, '101'], [1960, '102'], [2360, '103']];                       /* the hall's room doors (left edge x, number) */
/* st: { night 0..1, open 0..1 (the doors), sun 0..1 (the shaft of afternoon sun), survey 0..1 (labels and survey mode on), peel (s since labelpeel, -1 none), poster 0..1 (0 FUN COMMITTEE, 1 HAND HYGIENE),
 *       coffee 0..1 (the coffee maker on the counter), closet 0..1 (its door open), t } */
function sWall(st) {
  const n = st.night, top = mixc('#f1e8d4', '#c8d0de', n), bot = mixc('#e0d3b8', '#aab6ca', n), wain = mixc('#7a9a86', '#4f6f78', n);
  ctx.fillStyle = lg(0, -400, 0, FL, [[0, mixc('#f6f0e2', '#d2dae8', n)], [.3, top], [1, bot]]); ctx.fillRect(-1600, -600, 4800, FL + 600);
  ctx.fillStyle = lg(0, 1010, 0, FL, [[0, wain], [1, shade(wain, .86)]]); ctx.fillRect(-1600, 1010, 4800, FL - 1010);
  ctx.fillStyle = mixc('#f8f2e4', '#d6dded', n); ctx.fillRect(-1600, 1002, 4800, 12); ctx.fillStyle = 'rgba(30,20,30,.26)'; ctx.fillRect(-1600, 1014, 4800, 4);
  ctx.fillStyle = mixc('#f2ebdc', '#cdd5e4', n); ctx.fillRect(-1600, FL - 26, 4800, 26); ctx.fillStyle = 'rgba(30,20,30,.3)'; ctx.fillRect(-1600, FL - 26, 4800, 3);
  ctx.strokeStyle = 'rgba(60,44,40,.09)'; ctx.lineWidth = 2; for (let x = -1400; x < 3000; x += 220) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 1000); ctx.stroke(); }
  ctx.fillStyle = mixc('#d8cfbd', '#a9b6cb', n); ctx.fillRect(-1600, -600, 4800, 930);
  ctx.fillStyle = 'rgba(40,30,40,.18)'; ctx.fillRect(-1600, 326, 4800, 6);
  const VX = 700, VY = 980, sc = y => (VY - y) / (VY - 326), px = (x, y) => VX + (x - VX) * sc(y);
  ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = 3;
  for (let x = -2000; x <= 3600; x += 200) { ctx.beginPath(); ctx.moveTo(x, 326); ctx.lineTo(px(x, -700), -700); ctx.stroke(); }
  for (let j = 1; j <= 9; j++) { const y = 326 - 38 * j * (1 + j * .2); ctx.beginPath(); ctx.moveTo(-2400, y); ctx.lineTo(3800, y); ctx.stroke(); }
  for (const lx of [-60, 440, 1400, 1900, 2400]) for (const [ya, yb] of [[250, 288], [96, 168]]) {
    poly([[px(lx - 90, yb), yb], [px(lx + 90, yb), yb], [px(lx + 90, ya), ya], [px(lx - 90, ya), ya]], n > .5 ? 'rgba(255,253,240,.95)' : 'rgba(255,255,246,.92)', INKC, 2.4);
    glow(lx, yb + 24, 280, '#fff8e1', ya > 200 ? .2 : .1, .1);
  }
  paSpeaker(st, 0);
}
/* the ceiling speaker: a round grille in a tile, seen from below (an ellipse); lvl 0..1 = the voice: the cone pumps, the grille shivers */
function paSpeaker(st, lvl) {
  const { x, y } = PA, rx = 74, ry = 30, j = lvl * 1.6;
  ctx.save(); ctx.translate(x + j * Math.sin(st.t * 90), y);
  ctx.fillStyle = 'rgba(30,20,30,.18)'; ctx.beginPath(); ctx.ellipse(0, 4, rx + 12, ry + 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = mixc('#f4f2ec', '#d9dee8', st.night); ctx.beginPath(); ctx.ellipse(0, 0, rx + 8, ry + 4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.fillStyle = lg(0, -ry, 0, ry, [[0, '#8a909c'], [1, '#5c616c']]); ctx.beginPath(); ctx.ellipse(0, 1 + lvl * 2, rx - 6, ry - 4, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 1, rx - 6, ry - 4, 0, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(25,25,35,.55)';
  for (let i = -6; i <= 6; i++) for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(i * 10 + (k % 2) * 5, k * 9 + 1, 2.6, 1.6, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-20, -ry + 10, 26, 4, -.1, 0, TAU); ctx.fill();
  ctx.restore();
}
function sFloor(st) {
  const n = st.night, a = mixc('#d4ccbc', '#aab6c8', n), c = mixc('#bdb3a2', '#97a4b8', n);
  ctx.fillStyle = lg(0, FL, 0, 2400, [[0, a], [1, c]]); ctx.fillRect(-1600, FL, 4800, 1300);
  ctx.strokeStyle = 'rgba(60,46,50,.15)'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 9; i++) { const y = FL + 10 + Math.pow(i / 8, 1.7) * 900; ctx.beginPath(); ctx.moveTo(-1600, y); ctx.lineTo(3200, y); ctx.stroke(); }
  for (let x = -2400; x <= 4000; x += 190) { ctx.beginPath(); ctx.moveTo(x * .42 + 400, FL); ctx.lineTo(x * 1.55 - 100, 2300); ctx.stroke(); }
  ctx.fillStyle = lg(0, FL, 0, FL + 70, [[0, 'rgba(30,20,30,.2)'], [1, 'rgba(30,20,30,0)']]); ctx.fillRect(-1600, FL, 4800, 70);
  /* the welcome mat in front of the doors */
  ctx.fillStyle = mixc('#7a4a3a', '#4a3a44', n); poly([[DOOR.x0 + 30, FL + 6], [DOOR.x1 - 30, FL + 6], [DOOR.x1 + 10, FL + 52], [DOOR.x0 - 10, FL + 52]], null); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.stroke();
}
/* what is outside the doors: the afternoon (a blazing sky, the lot, the white State sedan) or the snowy night */
function sOutside(st, x0, y0, x1, y1) {
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  const n = st.night;
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, mixc('#cfe3f4', '#0f1d3c', n)], [.55, mixc('#fff6dc', '#1c2c52', n)], [.72, mixc('#fffaf0', '#26365e', n)], [1, mixc('#d9d2c2', '#cfd8ea', n)]]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const hz = y0 + (y1 - y0) * .62;
  ctx.fillStyle = mixc('#a9b4a0', '#16243f', n); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(x0 + 40 + i * 95, hz - 6, 70, 46 + 14 * (i % 2), 0, PI, 0); ctx.fill(); }
  ctx.fillStyle = mixc('#c9c4b8', '#e3e9f4', n); ctx.fillRect(x0, hz, x1 - x0, y1 - hz);
  if (n < .5) {   /* the white sedan (the State's car) in the lot, in the glare */
    ctx.fillStyle = '#f4f2ec'; rr(x0 + 150, hz + 18, 190, 44, 14); ctx.fill(); rr(x0 + 190, hz - 6, 110, 34, 12); ctx.fill();
    ctx.fillStyle = 'rgba(90,110,140,.5)'; rr(x0 + 200, hz, 90, 20, 6); ctx.fill(); ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.arc(x0 + 190, hz + 62, 13, 0, TAU); ctx.arc(x0 + 300, hz + 62, 13, 0, TAU); ctx.fill();
    if (st.sun > .01) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rg((x0 + x1) / 2, y0 + 300, 30, 520, [[0, `rgba(255,246,222,${.95 * st.sun})`], [.5, `rgba(255,236,196,${.5 * st.sun})`], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.restore(); }
  } else {        /* snow on the lot, a lamp post, falling snow */
    ctx.fillStyle = '#4a5068'; ctx.fillRect(x0 + 300, y0 + 120, 8, hz - y0 - 100); glow(x0 + 304, y0 + 118, 80, '#ffe3a8', .55, .6);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 46; i++) { const r1 = rnd(31, i), r2 = rnd(32, i), r3 = rnd(33, i), sp = 60 + r3 * 90, xx = x0 + ((r1 * (x1 - x0) + st.t * 20 * Math.sin(r2 * 6)) % (x1 - x0) + (x1 - x0)) % (x1 - x0), yy = y0 + ((r2 * (y1 - y0) + st.t * sp) % (y1 - y0)); ctx.beginPath(); ctx.arc(xx, yy, 2 + r3 * 3, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
/* one swinging leaf: hinged at hx, half-width hw toward dir (+1 right, -1 left); ang 0 closed .. 1.35 rad open toward the camera */
function doorLeaf(hx, dir, hw, ang, st) {
  const D = DOOR, c = Math.cos(ang), s = Math.sin(ang), fx = hx + dir * hw * c, grow = 46 * s, sk = 10 * s;
  const q = [[hx, D.y0], [fx, D.y0 - grow - sk], [fx, D.y1 + grow * .55], [hx, D.y1]];
  poly(q, `rgba(225,238,255,${.16 + .1 * s})`); ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 12; ctx.stroke(); poly(q, null, INKC, 2.6);
  ctx.fillStyle = 'rgba(255,255,255,.2)'; poly([[lerp(hx, fx, .15), D.y0 + 16], [lerp(hx, fx, .4), D.y0 + 10], [lerp(hx, fx, .12), D.y0 + 200], [lerp(hx, fx, .04), D.y0 + 160]], 'rgba(255,255,255,.2)');
  const bx = lerp(hx, fx, .82), by0 = lerp(D.y0, D.y0 - grow - sk, .82) + 300, by1 = by0 + 150;
  ctx.strokeStyle = '#c8cdd6'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by0); ctx.lineTo(bx, by1); ctx.stroke(); ctx.strokeStyle = 'rgba(25,16,30,.5)'; ctx.lineWidth = 2; ctx.stroke();
  const kp = lerp(D.y1, D.y1 + grow * .55, .5) - 60; ctx.fillStyle = 'rgba(160,168,182,.6)'; poly([[hx, D.y1 - 58], [fx, D.y1 + grow * .55 - 58 * (1 + .4 * s)], [fx, D.y1 + grow * .55], [hx, D.y1]], 'rgba(160,168,182,.55)');
}
function sDoors(st) {
  const D = DOOR, w = D.x1 - D.x0;
  ctx.fillStyle = 'rgba(30,20,30,.16)'; ctx.fillRect(D.x0 - 24, D.y0 - 44, w + 48, D.y1 - D.y0 + 44);
  ctx.fillStyle = mixc('#efe8d8', '#d3dbea', st.night); ctx.fillRect(D.x0 - 24, D.y0 - 44, w + 48, 44); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(D.x0 - 24, D.y0 - 44, w + 48, 44);
  sOutside(st, D.x0, D.y0, D.x1, D.y1);
  if (st.between) st.between();
  const ang = 1.32 * eo(c01(st.open));
  doorLeaf(D.x0, 1, D.mx - D.x0, ang, st); doorLeaf(D.x1, -1, D.x1 - D.mx, ang, st);
  ctx.fillStyle = '#8f98a8'; ctx.fillRect(D.x0 - 24, D.y0, 24, D.y1 - D.y0); ctx.fillRect(D.x1, D.y0, 24, D.y1 - D.y0); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(D.x0 - 24, D.y0, 24, D.y1 - D.y0); ctx.strokeRect(D.x1, D.y0, 24, D.y1 - D.y0);
  ctx.fillStyle = '#35e07a'; rr(D.mx - 34, D.y0 - 36, 68, 26, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  TXT('EXIT', D.mx, D.y0 - 23, { size: 18, fill: '#08381c', weight: 900, spacing: 2, hero: false, maxW: 56 });
  if (st.survey > .01) labelAt(st, D.x0 + 70, D.y0 + 470, 7, -.05);
}
/* a survey label stuck on a surface in survey mode; it peels after labelpeel (st.peel = s since) with a per-label delay, then flutters to the floor */
function labelAt(st, x, y, seed, rot) {
  if (st.survey <= .01) return;
  const d = .05 * (seed % 7), pk = st.peel >= 0 ? st.peel - d : -1;
  if (pk > 1.6) return;
  ctx.save(); ctx.globalAlpha *= c01(st.survey * 2) * (pk > 1.2 ? 1 - sg(pk, 1.2, 1.6) : 1);
  labelBlank({ x, y, rot, seed, peel: pk < 0 ? 0 : sg(pk, 0, .12), fall: pk > .12 ? pk - .12 : -1 });
  ctx.restore();
}
/* the wall behind the station: the NURSES' STATION sign, the clock, the poster (FUN COMMITTEE <-> HAND HYGIENE), a pin board */
function sWallDecor(st) {
  const n = st.night;
  /* the sign */
  if (!st.noSign) { ctx.fillStyle = mixc('#2f5f8a', '#284b6e', n); rr(700, 432, 390, 76, 10); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(708, 438, 374, 14, 6); ctx.fill(); }
  if (!st.noSign) TXT("NURSES' STATION", 895, 471, { size: 40, fill: '#ffffff', weight: 900, spacing: 3, maxW: 350, hero: false });
  /* the clock: 3:02 by day, 10:58 at night (no numerals: ticks) */
  const cx = 620, cy = 560, r = 50, hh = n > .5 ? 10 + 58 / 60 : 3 + 2 / 60, mm = n > .5 ? 58 : 2;
  ctx.fillStyle = 'rgba(30,20,30,.18)'; ctx.beginPath(); ctx.arc(cx + 3, cy + 5, r + 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fbfbf6'; ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2b2f3a'; ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = '#2b2f3a'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.lineWidth = i % 3 ? 2 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r * .8, cy - Math.cos(a) * r * .8); ctx.lineTo(cx + Math.sin(a) * r * .95, cy - Math.cos(a) * r * .95); ctx.stroke(); }
  const hand = (a, L, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * L, cy - Math.cos(a) * L); ctx.stroke(); };
  hand(hh / 12 * TAU, r * .5, 5, '#2b2f3a'); hand(mm / 60 * TAU, r * .74, 3.4, '#2b2f3a'); hand((st.t % 60) / 60 * TAU * 6, r * .82, 1.6, '#d6202c');
  /* the poster: it turns about its vertical axis (no text while it is edge-on) */
  const P = { x: 1080, y: 700, w: 150, h: 196 }, f = c01(st.poster), c = Math.cos(f * PI), sx = Math.abs(c), back = c < 0;
  ctx.save(); ctx.translate(P.x, P.y); ctx.scale(Math.max(.02, sx), 1);
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(-P.w / 2 + 4, -P.h / 2 + 6, P.w, P.h);
  if (!back) { ctx.fillStyle = lg(0, -P.h / 2, 0, P.h / 2, [[0, '#ffe46b'], [1, '#ff9fc4']]); } else { ctx.fillStyle = lg(0, -P.h / 2, 0, P.h / 2, [[0, '#ffffff'], [1, '#e2eefb']]); }
  ctx.fillRect(-P.w / 2, -P.h / 2, P.w, P.h); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(-P.w / 2, -P.h / 2, P.w, P.h);
  if (!back) { for (let i = 0; i < 16; i++) { ctx.fillStyle = ['#e8346c', '#4cc9d8', '#7a4fd8', '#ff8a2a'][i % 4]; ctx.beginPath(); ctx.arc(-P.w / 2 + 12 + rnd(5, i) * (P.w - 24), -P.h / 2 + 40 + rnd(6, i) * (P.h - 60), 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(34, 54); ctx.lineTo(-34, 54); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke(); }
  else { ctx.fillStyle = '#7fc4ec'; ctx.beginPath(); ctx.ellipse(0, 20, 34, 42, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-18 + i * 9, -14 + Math.abs(i - 2) * 6, 7, 0, TAU); ctx.fill(); } ctx.strokeStyle = '#2b6cb0'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, 20, 34, 42, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
  if (sx > .93) {
    UI.container('fp21a_poster', 'board', [P.x - P.w / 2, P.y - P.h / 2, P.x + P.w / 2, P.y + P.h / 2], 4);
    if (!back) { TXT('FUN', P.x, P.y - 68, { size: 34, font: 'Bangers', weight: 400, fill: '#c41e5a', spacing: 2, maxW: 120, hero: false, cid: 'fp21a_poster' }); TXT('COMMITTEE', P.x, P.y - 38, { size: 20, fill: '#5a1e8a', weight: 900, maxW: 128, hero: false, cid: 'fp21a_poster' }); TXT('PIZZA FRIDAY', P.x, P.y + 78, { size: 16, fill: '#5a1e8a', weight: 900, maxW: 128, hero: false, cid: 'fp21a_poster' }); }
    else { TXT('HAND', P.x, P.y - 72, { size: 26, fill: '#1f4f8a', weight: 900, spacing: 1, maxW: 124, hero: false, cid: 'fp21a_poster' }); TXT('HYGIENE', P.x, P.y - 46, { size: 26, fill: '#1f4f8a', weight: 900, spacing: 1, maxW: 124, hero: false, cid: 'fp21a_poster' }); TXT('SAVES LIVES', P.x, P.y + 80, { size: 16, fill: '#c2272d', weight: 900, maxW: 128, hero: false, cid: 'fp21a_poster' }); }
  }
  /* a cork board with notes */
  ctx.fillStyle = '#c99a62'; rr(826, 560, 120, 120, 6); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  [['#fff7a8', 840, 572, -.06], ['#bfe6ff', 884, 590, .08], ['#ffd1dc', 846, 624, .05]].forEach(([cl, x, y, r]) => { ctx.save(); ctx.translate(x + 18, y + 18); ctx.rotate(r); ctx.fillStyle = cl; ctx.fillRect(-18, -18, 36, 36); ctx.fillStyle = '#d6202c'; ctx.beginPath(); ctx.arc(0, -13, 3, 0, TAU); ctx.fill(); ctx.restore(); });
  if (st.survey > .01) { labelAt(st, 1135, 822, 3, .04); labelAt(st, 655, 618, 5, -.06); }
}
/* the closet: a wood door (hinged on the left, swings toward us), a STORAGE plate; inside: shelves, binders, a dim bulb */
function sCloset(st) {
  const C = CLOSET, w = C.x1 - C.x0, op = c01(st.closet), ang = 1.25 * eo(op), c = Math.cos(ang), s = Math.sin(ang);
  ctx.fillStyle = mixc('#e9e2d2', '#c9d1e0', st.night); ctx.fillRect(C.x0 - 16, C.y0 - 16, w + 32, C.y1 - C.y0 + 16); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(C.x0 - 16, C.y0 - 16, w + 32, C.y1 - C.y0 + 16);
  if (op > .01) {
    ctx.fillStyle = lg(0, C.y0, 0, C.y1, [[0, '#3a3440'], [1, '#221e28']]); ctx.fillRect(C.x0, C.y0, w, C.y1 - C.y0);
    ctx.fillStyle = '#6a5a4a'; for (const y of [780, 900, 1020]) ctx.fillRect(C.x0 + 6, y, w - 12, 10);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#1f3166', '#c2272d', '#2f7a4a', '#7a4fd8'][i % 4]; ctx.fillRect(C.x0 + 12 + (i % 6) * 22, (i < 6 ? 780 : 900) - 70, 18, 70); }
    glow(C.x0 + w / 2, C.y0 + 40, 140, '#ffe2a0', .4 * op, .5);
  }
  const fx = C.x0 + w * c, grow = 40 * s;
  poly([[C.x0, C.y0], [fx, C.y0 - grow], [fx, C.y1 + grow * .5], [C.x0, C.y1]], lg(C.x0, 0, fx + 1, 0, [[0, mixc('#b7865a', '#8e6e58', st.night)], [1, mixc('#a2744c', '#7e604c', st.night)]]), INKC, 2.6);
  if (c > .3) {
    const kx = lerp(C.x0, fx, .86), ky = 960; ctx.fillStyle = '#d8dce4'; ctx.beginPath(); ctx.arc(kx, ky, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
    if (c > .9) { ctx.fillStyle = '#eef0f4'; rr(C.x0 + w / 2 - 54, 760, 108, 30, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke(); TXT('STORAGE', C.x0 + w / 2, 775, { size: 17, fill: '#2b2f3a', weight: 900, spacing: 1, maxW: 96, hero: false }); }
  }
  if (st.survey > .01 && op < .05) labelAt(st, C.x0 + w / 2, 850, 11, .03);
}
/* the hall: the handrail, the room doors with their number plates, the sanitizer dispensers */
function sHall(st) {
  const n = st.night;
  ctx.fillStyle = mixc('#c9b48c', '#9aa0a8', n); ctx.fillRect(1395, 1024, 2000, 14); ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.fillRect(1395, 1038, 2000, 5);
  for (const [x, num] of ROOMS) {
    ctx.fillStyle = mixc('#efe8d8', '#d3dbea', n); ctx.fillRect(x - 14, 640 - 14, 188, 624); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.strokeRect(x - 14, 640 - 14, 188, 624);
    ctx.fillStyle = mixc('#c79a6a', '#8e7462', n); ctx.fillRect(x, 640, 160, 610); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.strokeRect(x, 640, 160, 610);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x + 14, 660, 10, 560);
    ctx.fillStyle = '#d8dce4'; ctx.beginPath(); ctx.arc(x + 138, 960, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#2f5f8a'; rr(x + 44, 700, 72, 34, 5); ctx.fill(); TXT(num, x + 80, 717, { size: 20, fill: '#fff', weight: 900, maxW: 60, hero: false });
    const sx = x + 230; ctx.fillStyle = '#f4f6f8'; rr(sx - 22, 820, 44, 70, 8); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.2; ctx.stroke(); ctx.fillStyle = '#7fc4ec'; rr(sx - 14, 834, 28, 26, 4); ctx.fill(); ctx.fillStyle = '#9aa3b2'; ctx.fillRect(sx - 6, 890, 12, 10);
    if (st.survey > .01) labelAt(st, x + 80, 820, 13 + x % 7, -.04);
  }
}
/* the counter: the monitor, the laptop (Binder's), papers, the pen cup, the coffee maker; the front panel */
function sCounter(st, skipLap) {
  const n = st.night, top = CT.top;
  /* the monitor */
  ctx.fillStyle = '#2b2f3a'; rr(626, top - 168, 150, 104, 8); ctx.fill(); ctx.fillStyle = mixc('#a8d8ff', '#6fa8e8', n); rr(634, top - 160, 134, 88, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 4; i++) ctx.fillRect(644, top - 150 + i * 18, 70 + 30 * (i % 2), 6);
  ctx.fillStyle = '#3a3f4a'; ctx.fillRect(694, top - 64, 14, 54); rr(666, top - 14, 70, 12, 4); ctx.fill();
  if (!skipLap && window.A15 && typeof A15.laptop === 'function') A15.laptop(LAP.x, top + 2, { lapScale: LAP.s, lapScreen: true });
  /* papers and the pen cup */
  ctx.fillStyle = '#fbfaf2'; ctx.save(); ctx.translate(905, top - 4); ctx.rotate(-.05); ctx.fillRect(-46, -8, 92, 10); ctx.restore();
  ctx.fillStyle = '#4a6fa8'; rr(980, top - 56, 34, 54, 5); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
  for (const [dx, cl] of [[-8, '#c2272d'], [0, '#1f3166'], [9, '#2f7a4a']]) { ctx.strokeStyle = cl; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(997 + dx, top - 54); ctx.lineTo(997 + dx * 1.6, top - 86); ctx.stroke(); }
  /* the coffee maker: there, hidden (gone), or popping back */
  const cf = c01(st.coffee);
  if (cf > .02 && window.P20 && typeof P20.coffeeMaker === 'function') {
    const k = st.coffeePop ? eb(cf) : cf; ctx.save(); ctx.translate(COF.x, top); ctx.scale(k, k); ctx.translate(-COF.x, -top);
    P20.coffeeMaker(ctx, { x: COF.x, y: top, s: COF.s, power: 1, display: '', pot: .6, t: st.t, hero: false }); ctx.restore();
  }
  /* the front panel */
  ctx.fillStyle = lg(0, top, 0, FL, [[0, mixc('#d6c3a0', '#a9a7b0', n)], [1, mixc('#bea783', '#8e8c98', n)]]); ctx.fillRect(CT.x0, top + 12, CT.x1 - CT.x0, FL - top - 12);
  ctx.fillStyle = mixc('#8a6a4a', '#6a5a5a', n); rr(CT.x0 - 12, top, CT.x1 - CT.x0 + 24, 16, 5); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(40,30,30,.22)'; ctx.lineWidth = 2; for (let x = CT.x0 + 98; x < CT.x1; x += 98) { ctx.beginPath(); ctx.moveTo(x, top + 22); ctx.lineTo(x, FL - 8); ctx.stroke(); }
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(CT.x0, top + 12, CT.x1 - CT.x0, FL - top - 12);
  if (st.survey > .01) { labelAt(st, 700, top + 70, 2, .05); labelAt(st, 980, top + 110, 9, -.03); labelAt(st, 1100, top + 64, 4, .02); }
}
/* the sun: a shaft of afternoon light through the open doors, across the floor toward us, with the surveyors' long shadows and dust in the air */
function sSun(st, figs) {
  const k = st.sun; if (k < .01) return;
  const D = DOOR;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = lg(0, FL, 0, FL + 700, [[0, `rgba(255,232,180,${.62 * k})`], [1, 'rgba(255,232,180,0)']]);
  poly([[D.x0 + 8, FL], [D.x1 - 8, FL], [D.x1 + 360, FL + 700], [D.x0 + 60, FL + 700]], null); ctx.fill();
  ctx.restore();
  for (const f of figs) {   /* the long shadow of a figure standing in the doorway, cast toward us */
    ctx.fillStyle = `rgba(40,26,20,${.42 * k})`; ctx.beginPath(); ctx.moveTo(f.x - 34 * f.s, FL + 2); ctx.lineTo(f.x + 34 * f.s, FL + 2); ctx.lineTo(f.x + 170 * f.s, FL + 560 * f.s); ctx.lineTo(f.x + 60 * f.s, FL + 580 * f.s); ctx.closePath(); ctx.fill();
  }
  if (window.V2 && V2.dust) V2.dust(D.x0 - 20, D.y0, D.x1 + 160, FL + 200, st.t, { n: 26, color: '255,240,200', alpha: .55 * k, seed: 7 });
}
/* the whole station set, back to front (the characters are drawn by the scene after this) */
function sSet(st, o = {}) {
  sWall(st); sWallDecor(st); sCloset(st); sHall(st); sFloor(st);
  sSun(st, o.figs || []);
  st.between = o.between || null; sDoors(st); st.between = null;
  if (o.behind) o.behind();
  sCounter(st, o.skipLap);
}

// ================================================================== ARRIVE: cues, the cast, the choreography
const AC = { doorchime: .4, dramatic: .7, sniffle1: 9.666, sniffle2: 12.127, pachime: 14.661, binderpop: 18.241, grin: 22.541, sting: 23.32 };
for (const k in AC) AC[k] = TA.snapT(AC[k]);
const SCA = { straw: .86, mango: .88, lemon: .86, tom: .88, onion: .86, kale: .92, radish: .9 };
const CHAIN = { straw: 700, mango: 1180, lemon: 1440, tom: 1700, onion: 1960 };          /* the open and the whisper chain */
const GROUP = { mango: 520, lemon: 730, straw: 940, tom: 1150, onion: 1360 };             /* gathered at the station (ra0b, the scatter) */
const YESX = { mango: 600, lemon: 768, straw: 940, tom: 1114, onion: 1294 };              /* the "Yes!" shot: a front row of three, Lemon and Tomato squeezing in between */
const YESB = { lemon: 1, tom: 1 };
const T_FREEZE = AC.doorchime, T_SCAT = TA.snapT(TA.wS('me1', 4) - .02);                  /* "All" staff to your stations: the burst */
/* the surveyors' routes: in the doorway, then a step into the light (feet a little lower and nearer: scale grows) */
const kaleAt = lt => ({ x: K([[0, 300], [1.45, 300], [2.35, 330]], lt), y: K([[0, FL], [1.45, FL], [2.35, FL + 30]], lt), s: K([[0, .9], [1.45, .9], [2.35, .96]], lt) });
const radAt = lt => ({ x: K([[0, 118], [1.6, 118], [2.6, 124], [11.0, 124], [12.2, 520]], lt), y: K([[0, FL], [1.6, FL], [2.6, FL + 12], [11.0, FL + 12], [12.2, FL + 40]], lt), s: K([[0, .88], [1.6, .88], [2.6, .9], [11.0, .9], [12.2, .94]], lt) });
const SILK = lt => 1 - ss(lt, 1.45, 1.86);                                                 /* how much of a silhouette they still are */
/* the whisper chain: who whispers to whom and when (line id, whisperer, listener) */
const WH = [['m1', 'mango', 'lemon'], ['l1', 'lemon', 'tom'], ['t1', 'tom', 'onion']];
const landT = id => TA.wS(id, 3) + .12;                                                    /* the news lands on "here." */
function chainPose(n, lt) {
  const r = { yaw: -.45, head: -.4, rot: 0, cup: 0, dx: 0, listen: 0, shock: 0, pale: 0, look: [-.7, 0] };
  for (const [id, a, b] of WH) {
    const t0 = TA.ls(id), t1 = TA.le(id);
    if (n === b) { const k = ss(lt, t0 - .22, t0 + .08) * (1 - ss(lt, t1 + .05, t1 + .35)); r.listen = Math.max(r.listen, k); r.dx -= 12 * k; r.rot -= .08 * k;
      if (lt > t0 - .22) { const u = ss(lt, t0 - .22, t0 + .08); r.yaw = lerp(r.yaw, .55, u); r.head = r.yaw; r.look = [lerp(r.look[0], -.75, u), .08]; }
      const lk = ss(lt, landT(id), landT(id) + .12); if (lk > 0) { r.shock = Math.max(r.shock, lk); r.look = [lerp(r.look[0], .1, lk), lerp(r.look[1], -.05, lk)]; }
      if (n !== 'onion') r.pale = Math.max(r.pale, ss(lt, landT(id), landT(id) + .4)); }
    if (n === a) { const k = ss(lt, t0 - .3, t0 - .04) * (1 - ss(lt, t1 + .05, t1 + .4)); r.cup = Math.max(r.cup, k); r.dx += 28 * k; r.rot += .085 * k;
      if (lt > t0 - .34) { const u = ss(lt, t0 - .34, t0 - .08); r.yaw = lerp(r.yaw, .9, u); r.head = r.yaw; r.look = [lerp(r.look[0], .6, u), .06]; } }
  }
  if (n === 'mango') r.pale = Math.max(r.pale, .55 * ss(lt, 4.5, 5.0));
  return r;
}
/* a cupped hand at the mouth on the listener's side (screen-space body-local px, from the kind's mouth) */
function cupGrip(o, k) { const kd = KINDS[o.kind], my = kd.mouthY, mx = kd.rx * Math.sin(o.yaw || 0) * .8; return [lerp(70, mx + 46, k), lerp(70, my - 8, k)]; }
/* the whisper made visible: three small arcs leaving the cupped hand toward the listener's ear, pulsing with the voice */
function wisps(o, lvl, lt) {
  if (!o || (o.whisper || 0) < .3) return;
  const kd = KINDS[o.kind], [fx, fy] = faceC(o), s = o.s, x = fx + (kd.rx * Math.sin(o.yaw || 0) * .8 + 70) * s, y = fy + (kd.mouthY - (kd.eyeY + kd.mouthY) / 2 - 10) * s;
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = ((lt * 1.8 + i / 3) % 1), r = (18 + 62 * ph) * s, a = (.75 + .25 * lvl) * Math.sin(PI * ph) * c01((o.whisper - .3) / .4);
    if (a < .02) continue;
    ctx.strokeStyle = `rgba(52,40,78,${a * .8})`; ctx.lineWidth = 9 * s; ctx.beginPath(); ctx.arc(x, y, r, -.62, .62); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 4.5 * s; ctx.beginPath(); ctx.arc(x, y, r, -.62, .62); ctx.stroke();
  }
  ctx.restore();
}

function strawA(lt, sh) {
  const g = sh.pos === 'yes' ? YESX : sh.pos === 'group' ? GROUP : CHAIN, tf = sh.id === 'open' ? Math.min(lt, T_FREEZE) : lt;
  const o = A11.straw({ x: g.straw, y: FL, s: SCA.straw, t: tf, who: sh.id === 'st1' ? 'staff' : 'straw', expr: 'dead', lid: .5, plant: true, arms: { l: 'rest', r: 'rest' } });
  if (sh.id === 'open') { const u = sg(lt, 0, T_FREEZE); o.arms = { l: 'hold', r: 'rest' }; o.hold = { l: EXT.prop.fp18_medcup ? 'fp18_medcup' : undefined }; o.grip = { l: [lerp(-124, -118, u), lerp(56, 46, u)] }; o.cupScale = 1.1;
    o.headYaw = lt < T_FREEZE ? 0 : -.22 * ss(lt, T_FREEZE, T_FREEZE + .12); o.look = [lt < T_FREEZE ? .2 : -.9, 0]; o.lid = lt < T_FREEZE ? .5 : .28; }
  if (sh.pos === 'group') {
    const up = ss(lt, AC.pachime - .05, AC.pachime + .2) * (1 - ss(lt, T_SCAT + .3, T_SCAT + .6));
    o.look = [K([[13.75, 0], [13.95, -.7], [14.25, -.7], [14.4, .7], [14.6, .7]], lt) * (1 - up), -.95 * up]; o.headYaw = .25 * o.look[0];
    if (lt > T_SCAT) { const bl = Math.max(0, 1 - Math.abs(lt - (T_SCAT + .62)) / .14); o.lid = lerp(.5, 1, bl); o.look = [0, .05]; o.headYaw = 0; }
    if (lt > AC.binderpop - .05) { o.headYaw = -.35 * ss(lt, AC.binderpop - .05, AC.binderpop + .15); o.look = [-.8, .5]; }
  }
  if (sh.pos === 'yes') yesPose(o, 'straw', lt);
  return o;
}
function yesPose(o, n, lt) {
  const u = eb(sg(lt, 20.6, 20.86)) * (1 - .25 * ss(lt, 21.3, 21.64)), dx = YESX[n] - 940, back = !!YESB[n];
  const jump = back ? eb(sg(lt, 20.58, 20.8)) : 0;
  o.s = (back ? .85 : 1.0) * lerp(.95, 1.03, u); o.y = back ? FL + 12 : FL + 72 + 10 * u; o.lift = back ? 132 * jump + 6 * Math.sin(lt * 9) * jump : 0;
  o.rot = back ? 0 : -dx / 7000 * u; o.yaw = back ? 0 : -dx / 1100 * u; o.headYaw = o.yaw; o.look = back ? [0, .15] : [-dx / 500, .12];
  o.expr = 'panic'; o.lid = 0; o.arms = { l: 'reach', r: 'reach' }; o.who = 'staff';
}
function mangoA(lt, sh) {
  const g = sh.pos === 'yes' ? YESX : sh.pos === 'group' ? GROUP : CHAIN, tf = sh.id === 'open' ? Math.min(lt, T_FREEZE) : lt;
  const o = A7.mango({ x: g.mango, y: FL, s: SCA.mango, t: tf, who: 'mango', expr: 'neutral', plant: true, arms: { l: 'rest', r: 'rest' } });
  if (sh.id === 'open') { const step = Math.min(lt, T_FREEZE); o.x = CHAIN.mango - 60 + 150 * step; o.gait = 150 * step / o.s; o.dir = 1; o.stride = 38; o.yaw = lt < T_FREEZE ? .9 : lerp(.9, .3, ss(lt, T_FREEZE, T_FREEZE + .1)); o.headYaw = lt < T_FREEZE ? .9 : -.5;
    o.arms = { l: 'run', r: 'run' }; o.look = lt < T_FREEZE ? [.6, 0] : [-1, 0]; o.expr = lt < T_FREEZE ? 'happy' : 'shock'; }
  if (sh.pos === 'chain') { const p = chainPose('mango', lt); Object.assign(o, { x: o.x + p.dx, yaw: p.yaw, headYaw: p.head, rot: p.rot, look: p.look, expr: p.cup > .2 ? 'panic' : 'shock' }); pale(o, p.pale); o.whisper = p.cup; o.dz = p.cup;
    if (p.cup > .01) { o.arms = { l: 'rest', r: 'hold' }; o.grip = { r: cupGrip(o, p.cup) }; o.hand = { r: 'open' }; } }
  if (sh.pos === 'group') groupLook(o, 'mango', lt);
  if (sh.pos === 'yes') yesPose(o, 'mango', lt);
  return o;
}
function lemonA(lt, sh) {
  const g = sh.pos === 'yes' ? YESX : sh.pos === 'group' ? GROUP : CHAIN;
  const o = A7.lemon({ x: g.lemon, y: FL, s: SCA.lemon, t: lt, who: 'lemon', expr: 'neutral', lid: .3, plant: true, arms: { l: 'rest', r: 'rest' } });
  if (sh.pos === 'chain') { const p = chainPose('lemon', lt); Object.assign(o, { x: o.x + p.dx, yaw: p.yaw, headYaw: p.head, rot: p.rot, look: p.look, expr: p.cup > .2 ? 'panic' : p.shock > .5 ? 'shock' : 'neutral', lid: p.shock > .5 ? 0 : .3 }); pale(o, p.pale); o.whisper = p.cup; o.dz = p.cup;
    if (p.cup > .01) { o.arms = { l: 'rest', r: 'hold' }; o.grip = { r: cupGrip(o, p.cup) }; o.hand = { r: 'open' }; } }
  if (sh.pos === 'group') { groupLook(o, 'lemon', lt); pale(o, .6); }
  if (sh.pos === 'yes') yesPose(o, 'lemon', lt);
  return o;
}
function tomA(lt, sh) {
  const g = sh.pos === 'yes' ? YESX : sh.pos === 'group' ? GROUP : CHAIN;
  const o = A15.tomato({ x: g.tom, y: FL, s: SCA.tom, t: lt, who: 'tom', tomPose: 'fruit', plant: true, arms: { l: 'rest', r: 'rest' }, hold: {} });
  if (sh.pos === 'chain') { const p = chainPose('tom', lt); Object.assign(o, { x: o.x + p.dx, yaw: p.yaw, headYaw: p.head, rot: p.rot, look: p.look, expr: p.cup > .2 ? 'panic' : p.shock > .5 ? 'shock' : 'tom_fruit' }); pale(o, p.pale); o.whisper = p.cup; o.dz = p.cup;
    if (p.cup > .01) { o.arms = { l: 'rest', r: 'hold' }; o.grip = { r: cupGrip(o, p.cup) }; o.hand = { r: 'open' }; } }
  if (sh.id === 'o1') { const k = ss(lt, 8.69, 8.86); o.rot = -.13 * k; o.x -= 26 * k; o.expr = 'shock'; o.arms = { l: 'up', r: 'up' }; o.yaw = .5; o.headYaw = .45; o.look = [.7, -.1]; pale(o, 1); }
  if (sh.pos === 'group') { groupLook(o, 'tom', lt); pale(o, .6); }
  if (sh.pos === 'yes') yesPose(o, 'tom', lt);
  return o;
}
function onionA(lt, sh) {
  const g = sh.pos === 'yes' ? YESX : sh.pos === 'group' ? GROUP : CHAIN;
  const o = A15.onion({ x: g.onion, y: FL, s: SCA.onion, t: lt, who: 'onion', pose: 'rest', cry: .55, plant: true });
  if (sh.pos === 'chain') { const p = chainPose('onion', lt), joy = ss(lt, landT('t1') - .05, landT('t1') + .3); Object.assign(o, { x: o.x + p.dx, yaw: lerp(p.yaw, 0, joy), headYaw: lerp(p.head, -.1, joy), rot: p.rot * (1 - joy), look: joy > .3 ? [-.1, -.2] : p.look, expr: joy > .3 ? 'happy' : 'onion_cry', cry: lerp(.55, .95, joy) }); o.joy = joy; }
  if (sh.id === 'o1') {
    const a = lt - 8.666, hop = a < 0 ? 0 : 46 * Math.abs(Math.sin(PI * Math.min(a, .84) / .42)) * Math.exp(-a * 2.2), sob = Math.max(0, 1 - Math.abs(lt - AC.sniffle1 - .08) / .3);
    Object.assign(o, { pose: 'free', arms: { l: 'cheer', r: 'cheer' }, expr: 'happy', cry: 1, sob, yaw: -.15, headYaw: -.1, look: [-.2, -.15], lift: hop, squash: a >= 0 && a < .5 ? .06 * Math.sin(a * 18) * Math.exp(-a * 4) : 0 }); o.joy = 1;
  }
  if (sh.id === 'o2') {
    const sob = Math.max(0, 1 - Math.abs(lt - AC.sniffle2 - .08) / .3) + .25;
    Object.assign(o, { pose: 'free', arms: { l: 'hold', r: 'hold' }, hold: { l: 'fp21a_hug' }, grip: { l: [-52, 106], r: [54, 100] }, hugScale: .76, expr: 'happy', cry: 1, sob, yaw: .12, headYaw: .18 + .05 * Math.sin(lt * 1.4), look: [.15, -.25], lid: .15, rot: .03 * Math.sin(lt * 2.2) }); o.joy = 1;
  }
  if (sh.pos === 'group') groupLook(o, 'onion', lt);
  if (sh.pos === 'yes') { yesPose(o, 'onion', lt); o.pose = 'free'; o.cry = .7; }
  return o;
}
/* the staff look at each other (ra0b), then up at the speaker on the chime, then burst out of the shot ("All staff"): a squash of anticipation, then a run off the frame */
const GAZE_G = { mango: [[13.75, 'lemon'], [14.2, 'straw']], lemon: [[13.75, 'mango'], [14.15, 'tom']], tom: [[13.75, 'onion'], [14.25, 'lemon']], onion: [[13.75, 'tom'], [14.1, 'straw']] };
const RUN = { mango: [-1, 1500, .02], lemon: [-1, 1300, .1], tom: [1, 1300, .12], onion: [1, 1500, .02] };
function groupLook(o, n, lt) {
  const seq = GAZE_G[n]; let tgt = seq[0][1]; for (const [t, w] of seq) if (lt >= t) tgt = w;
  const dx = GROUP[tgt] - GROUP[n], up = ss(lt, AC.pachime - .05, AC.pachime + .18);
  o.headYaw = Math.max(-.32, Math.min(.32, dx / 600)) * (1 - up); o.yaw = o.headYaw * .3; o.look = [Math.max(-1, Math.min(1, dx / 220)) * (1 - up), -.95 * up]; o.expr = 'shock';
  const [dir, sp, dl] = RUN[n], t0 = T_SCAT + dl;
  if (lt >= t0 - .12) {
    const a = lt - t0, sq = a < 0 ? ss(lt, t0 - .12, t0) : 0, d = a > 0 ? sp * a * a / (a + .12) : 0;
    o.squash = .12 * sq; o.x += dir * d; o.yaw = dir * PI / 2 * ss(lt, t0 - .1, t0 + .05); o.headYaw = o.yaw; o.look = [dir, 0]; o.expr = 'panic';
    if (a > 0) { o.gait = d / o.s; o.dir = dir; o.stride = 46; o.vx = dir * sp; o.arms = { l: 'run', r: 'run' }; o.lift = 10 * Math.abs(Math.sin(a * 16)); if (n === 'onion') o.pose = 'free'; }
  }
}
function kaleA(lt, sh) {
  const p = kaleAt(lt), note = lt > 12.5 && lt < 15.0, cardUp = ss(lt, TA.wS('ka1', 2) - .2, TA.wS('ka1', 2) + .1) * (1 - ss(lt, TA.le('ka1') + .1, TA.le('ka1') + .4)), pen = lt > 22.9;
  const o = { x: p.x, y: p.y, s: p.s, t: lt, who: 'kale', expr: note ? 'kale_note' : lt > 23.2 ? 'kale_raise' : 'kale_neutral', pose: 'clip', cbPen: pen, cbTicks: lt > 14.2 ? 1 : 0,
    yaw: .3, headYaw: .25, look: note ? undefined : [.25, .04], plant: true };
  if (cardUp > .01) { o.yaw = .3 * (1 - cardUp); o.headYaw = lerp(.25, .12, cardUp); o.arms = { l: 'hold', r: 'hold' }; o.hold = { l: 'fp21_clipboard', r: 'fp21a_idcard' }; o.grip = { l: [-104, 128], r: [lerp(124, 146, cardUp), lerp(112, 108, cardUp)] }; o.gripSpace = 'body'; o.cardUp = cardUp; o.cardScale = .86; }
  if (!hasA('kale') && cardUp > .01) { o.gripSpace = 'screen'; o.grip.r = [lerp(70, 132, cardUp), lerp(60, 10, cardUp)]; }
  if (lt > 23.0) { const up = ss(lt, 23.0, 23.32); o.cbPen = true; o.look = [.1, -.05]; o.headYaw = .15; o.yaw = .2; o.raiseK = up; }
  return kaleO(o);
}
function radishA(lt, sh) {
  const p = radAt(lt), offer = ss(lt, TA.ls('ra0') - .05, TA.ls('ra0') + .3) * (1 - ss(lt, TA.le('ra0') + .1, TA.le('ra0') + .4));
  const o = { x: p.x, y: p.y, s: p.s, t: lt, who: 'radish', expr: 'radish_flat', pose: 'tablet', yaw: offer > .1 ? .55 : .3, headYaw: offer > .1 ? .5 : .25, look: [.4, .02], plant: true };
  if (offer > .01) { o.arms = { l: 'hold', r: 'offer' }; }
  if (lt > 23.0) { o.look = [-.05, -.05]; o.headYaw = .1; o.yaw = .15; }
  return radishO(o);
}
// ------------------------------------------------------------------ ARRIVE: the silhouettes (drawn into a buffer, darkened, with a warm rim of sun round them)
const SILCV = V2.mk(W, H), SILX = SILCV.getContext('2d'), RIMCV = V2.mk(W, H), RIMX = RIMCV.getContext('2d');
SILCV.__txOK = true; RIMCV.__txOK = true;
function silDraw(objs, k) {
  if (k <= .01) { for (const o of objs) drawIn(o); return; }
  const prev = ctx, m = prev.getTransform();
  SILX.setTransform(1, 0, 0, 1, 0, 0); SILX.clearRect(0, 0, W, H); SILX.setTransform(m); ctx = SILX;
  try { for (const o of objs) drawIn(o); } finally { ctx = prev; }
  SILX.save(); SILX.setTransform(1, 0, 0, 1, 0, 0); SILX.globalCompositeOperation = 'source-atop'; SILX.globalAlpha = .93 * k; SILX.fillStyle = '#10121a'; SILX.fillRect(0, 0, W, H); SILX.restore();
  RIMX.setTransform(1, 0, 0, 1, 0, 0); RIMX.clearRect(0, 0, W, H); RIMX.drawImage(SILCV, 0, 0); RIMX.globalCompositeOperation = 'source-in'; RIMX.fillStyle = '#fff1cf'; RIMX.fillRect(0, 0, W, H); RIMX.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = k; ctx.filter = 'blur(9px)'; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(RIMCV, 0, 0); ctx.drawImage(RIMCV, 0, 0); ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1; ctx.drawImage(SILCV, 0, 0);
  ctx.restore();
}

// ------------------------------------------------------------------ ARRIVE: the shots (scene-local seconds; every start snapped to a frame; the boundary frame is the NEW shot)
const ALLA = ['straw', 'mango', 'lemon', 'tom', 'onion'];
const ASH = [
  { id: 'open', s: 0, k: 'pt', x: 640, y: 1000, z: [.8, .815], pos: 'chain', show: ['straw', 'mango'], sil: true },
  { id: 'sil', s: .70, k: 'pt', x: 222, y: 1060, z: [1.3, 1.52], pos: 'chain', show: [], sil: true },
  { id: 'ka1a', s: 1.70, k: 'pt', x: 270, y: 1160, z: [1.5, 1.56], pos: 'chain', show: ['kale', 'radish'], silTail: true },
  { id: 'ka1b', s: 3.30, k: 'face', foc: 'kale', z: [2.0, 2.12], up: 30, dx: -120, dof: 7, show: ['kale'], bg: ['radish'], hero: true, pos: 'chain' },
  { id: 'chain', s: 4.87, k: 'track', z: [1.5, 1.5], pos: 'chain', show: ALLA },
  { id: 'o1', s: 8.67, k: 'pt', x: 1898, y: 1188, z: [1.55, 1.6], pos: 'chain', show: ['tom', 'onion'] },
  { id: 'o2', s: 10.23, k: 'face', foc: 'onion', z: [2.1, 2.3], up: 40, dof: 7, show: ['onion'], pos: 'chain' },
  { id: 'ra0a', s: 12.45, k: 'pt', x: 440, y: 1170, z: [1.5, 1.56], show: ['kale', 'radish'], pos: 'chain' },
  { id: 'ra0b', s: 13.75, k: 'pt', x: 940, y: 1190, z: [.97, .99], pos: 'group', show: ALLA },
  { id: 'pa', s: 15.11, k: 'pt', x: PA.x, y: 160, z: [2.55, 2.75], show: [], pos: 'group', noSign: true },
  { id: 'scat', s: 16.55, k: 'pt', x: 940, y: 1060, z: [.88, .88], pos: 'group', show: ALLA },
  { id: 'str', s: 17.75, k: 'pt', x: 868, y: 1130, z: [1.68, 1.74], pos: 'group', show: ['straw'] },
  { id: 'b1', s: 18.60, k: 'ins', ins: 'bubble', x: 868, y: 1130, z: [1.74, 1.76], pos: 'group', show: [], dof: 12 },
  { id: 'st1', s: 20.72, k: 'pt', x: 940, y: 1205, z: [1.1, 1.13], pos: 'yes', show: ALLA, dof: 5 },
  { id: 'b2', s: 21.64, k: 'ins', ins: 'bubble', x: 868, y: 1130, z: [1.76, 1.78], pos: 'group', show: [], dof: 12 },
  { id: 'grin', s: 22.45, k: 'ins', ins: 'grin', x: 868, y: 1130, z: [1.78, 1.8], pos: 'group', show: [], dof: 14 },
  { id: 'end', s: 23.22, k: 'pt', x: 430, y: 1170, z: [1.5, 1.6], show: ['kale', 'radish'], pos: 'group' },
];
for (const sh of ASH) sh.s = sh.s === 0 ? 0 : TA.snapT(sh.s);
ASH.forEach((sh, i) => { sh.e = i + 1 < ASH.length ? ASH[i + 1].s : TA.SCN.dur; });
const aShot = lt => { let r = ASH[0]; for (const sh of ASH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const TRACK = [[4.87, 1205], [8.62, 1925]];

function castA(lt, sh) {
  return { straw: strawA(lt, sh), mango: mangoA(lt, sh), lemon: lemonA(lt, sh), tom: tomA(lt, sh), onion: onionA(lt, sh), kale: kaleA(lt, sh), radish: radishA(lt, sh) };
}
function stA(lt, sh) {
  const open = ss(lt, AC.doorchime, AC.doorchime + .55) * (1 - ss(lt, 2.7, 3.5));
  return { night: 0, open, sun: .3 + .7 * open, survey: 0, peel: -1, poster: 0, coffee: 1, closet: 0, t: lt, noSign: !!sh.noSign };
}
let AFR = null;
function camA(lt) {
  const sh = aShot(lt), C = castA(lt, sh), dur = sh.e - sh.s, u = c01((lt - sh.s) / dur), z = lerp(sh.z[0], sh.z[1], easeIO(u));
  let cx = sh.x, cy = sh.y;
  if (sh.k === 'face') { const [fx, fy] = faceC(C[sh.foc]); cx = fx - (sh.dx || 0) / z; cy = fy + sh.up / z; }
  if (sh.k === 'track') { cx = K(TRACK, lt); cy = 1162; }
  zoomTo(cx, cy, z);
  const sway = { x: 2 * hn(lt, 1.3, 1), y: 1.5 * hn(lt, 1.1, 2), r: .001 * hn(lt, .9, 3) };
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
  if (sh.id === 'scat') CAM.shake = 3 * Math.exp(-Math.max(0, lt - T_SCAT) * 5) * (lt >= T_SCAT ? 1 : 0);
  AFR = { C, sh };
}
/* Onion's joy: little four-point sparkles round her face and a warm glow (pure function of time) */
function sparkles(o, k, lt, seed) {
  if (k <= .01) return;
  const [fx, fy] = faceC(o), s = o.s;
  glow(fx, fy, 260 * s, '#fff1b8', .35 * k, .2);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) {
    const ph = rnd(seed, i), a = ph * TAU + lt * (.3 + .2 * rnd(seed, i + 9)), d = (150 + 60 * rnd(seed, i + 20)) * s, tw = Math.max(0, Math.sin(lt * (2.4 + rnd(seed, i + 30) * 2) + ph * 9));
    const x = fx + Math.cos(a) * d, y = fy - 30 * s + Math.sin(a) * d * .7, r = (10 + 12 * tw) * s * k;
    if (r < 1) continue;
    ctx.fillStyle = `rgba(255,248,210,${.85 * tw * k})`; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r * .4, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r * .4, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }
  ctx.restore();
}
/* Binder pops out of the laptop on the counter (binderpop): a ring, then the little clip rises out of the screen and bobs */
function lapGeom() { return A15.laptopScreen ? (r => ({ x: LAP.x + (r[0] + r[2]) / 2, y: CT.top + 2 + (r[1] + r[3]) / 2, w: r[2] - r[0], h: r[3] - r[1] }))(A15.laptopScreen({ lapScale: LAP.s })) : { x: LAP.x, y: CT.top - 70, w: 160, h: 100 }; }
function binderFromLap(lt) {
  const g = lapGeom(), t0 = AC.binderpop, ant = ss(lt, t0 - .5, t0);
  glow(g.x, g.y, 80 + 70 * ant, '#beffdc', Math.min(1, .2 + .5 * ant), .4);
  if (lt < t0) return;
  const kk = sg(lt, t0, t0 + .16), f = ss(lt, t0 + .04, t0 + .5), bob = Math.sin(lt * 3.2) * 3, s = .72 * g.w / 300 * eb(kk);
  if (kk < 1) V2.ring(g.x, g.y - 6, kk, { r0: 8, r1: 90, color: '255,236,160', lw: 6, alpha: .9 });
  if (s < .02) return;
  drawChar(A15.binderSmall({ x: g.x, y: lerp(g.y + 10, g.y - g.h * .75, f) - Math.sin(PI * f) * 20 + bob * f, s, center: true, noLegs: true, who: 'bind', t: lt, pose: 'ears', grin: .25, look: [.4, .2], hover: 6 }));
}
/* the scatter: a dust puff where each one stood, speed lines behind each runner */
function scatterFx(lt, C) {
  for (const n of ['mango', 'lemon', 'tom', 'onion']) {
    const [dir, sp, dl] = RUN[n], t0 = T_SCAT + dl, o = C[n];
    puff(GROUP[n], FL - 10, 90, lt, t0, { life: .7, flat: .5, seed: 3 + dl * 10, color: '#efe4cf' });
    if (lt > t0 && lt < t0 + .7) {
      const a = sg(lt, t0, t0 + .7); ctx.save(); ctx.strokeStyle = `rgba(90,70,60,${.5 * (1 - a)})`; ctx.lineCap = 'round'; ctx.lineWidth = 5;
      for (let i = 0; i < 4; i++) { const y = FL - 70 - i * 60, x = o.x - dir * (80 + i * 14); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dir * (120 + 40 * i), y); ctx.stroke(); }
      ctx.restore();
    }
  }
}
function drawA(lt) {
  const { C, sh } = AFR, st = stA(lt, sh);
  V2.setLight({ key: [-.55, -.6], keyColor: '#fff3de', keyA: .22, rim: '#ffd9a0', rimA: .36, shadow: '#2a1c30', shadowA: .28, bounce: '#ffe6bc', bounceA: .12, amb: '#fff6e8', ambA: .05, frontDark: .02 }); V2.opts.reflect = false;
  const silOn = lt < 1.86 && (sh.sil || sh.silTail);
  const surv = sorted([C.radish, C.kale]);
  const between = silOn ? () => silDraw(surv, SILK(lt)) : null;
  st.pa = sh.id === 'pa' ? voice(TA, 'me1', lt) : 0;
  const bgCast = () => { if (!sh.bg) return; REG.suppress++; for (const n of sh.bg) if (inFrame(C[n], 20).inter) drawChar(C[n]); REG.suppress--; };
  const room = () => sSet(st, { between, figs: silOn && st.open > .15 ? surv : [], skipLap: false });
  if (sh.dof) { SOFT++; V2.dof(sh.dof, () => { room(); bgCast(); }); SOFT--; } else room();
  if (sh.id === 'pa') {
    paSpeaker(st, st.pa); const v = st.pa;
    for (let i = 0; i < 4; i++) { const k = ((lt * 1.4 + i / 4) % 1); V2.ring(PA.x, PA.y + 4, k, { r0: 84, r1: 300, color: '52,70,112', lw: 9, alpha: .5 * (.35 + v), squash: .42, bloom: 0 }); }
    glow(PA.x, PA.y, 150, '#fff6dc', .25 + .45 * v, .3);
  }
  if (sh.id === 'str' || sh.id === 'b1') binderFromLap(lt);
  if (sh.id === 'scat') scatterFx(lt, C);
  HEROMODE = !!sh.hero;
  const list = sorted(sh.show.filter(n => !(silOn && (n === 'kale' || n === 'radish'))).map(n => C[n]));
  for (const o of list) {
    if (o.joy > .01 && (sh.id === 'chain' || sh.id === 'o1' || sh.id === 'o2')) sparkles(o, o.joy, lt, 7);
    drawIn(o);
  }
  HEROMODE = false;
  if (sh.id === 'chain') for (const [id, a] of WH) if (talking(TA, id, lt, .05, .05)) wisps(C[a], voice(TA, id, lt), lt);
  if ((sh.id === 'o1' || sh.id === 'o2') && A15.tearsAura) { const o = C.onion, [fx, fy] = faceC(o); A15.tearsAura(fx, fy, 1, { r: 150 * o.s, n: 18, t: lt, size: 1.2 * o.s, seed: 5 }); }
}

// ------------------------------------------------------------------ ARRIVE: Binder's bubble and grin (screen space, over the blurred station; the staging of ep18_station.js, retimed)
const BTXT1 = "It looks like you're being inspected. Would you like help?", BTXT2 = "Great! I'll hide everything.";
function typedAtL(T0, id, text, lt) {   /* the share of the letters of `text` shown at lt, in step with the spoken words of line `id` */
  const L = T0.LN[id]; if (!L) return 1;
  const words = L.words, n = text.length; let shown = 0, pos = 0;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i][0].replace(/[^A-Za-z']/g, ''), w = text.indexOf(clean, pos), ws = T0.wS(id, i) - .04, we = T0.wE(id, i); if (w < 0) continue;
    if (lt < ws) break;
    const end = w + clean.length;
    shown = Math.max(shown, lerp(w, end, c01((lt - ws) / Math.max(.05, we - ws))));
    pos = end;
  }
  return lt >= T0.wE(id, words.length - 1) ? 1 : c01(shown / n);
}
const BIG = { x: 300, y: 1090, s: 1.6 }, BUBX = 110, BUBW = 860, BUBBOT = 780;
const veil = a => { ctx.fillStyle = 'rgba(14,20,26,' + a + ')'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = V2.radial(540, 820, 260, 1150, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.3)']]); ctx.fillRect(0, 0, W, H); };
function bubbleOpts(lt, second) {
  const o = { w: BUBW, s: 1, size: 42, name: 'Binder', buttons: second ? [] : [{ id: 'yes', t: 'YES', def: true }, { id: 'no', t: 'NO' }] };
  o.text = second ? BTXT2 : BTXT1;
  const h = SH15.binderRect(Object.assign({ at: [0, 0] }, o)).h; o.at = [BUBX, BUBBOT - h];
  o.typed = second ? typedAtL(TA, 'b2', BTXT2, lt) : typedAtL(TA, 'b1', BTXT1, lt);
  o.pop = second ? 1 : ss(lt, ASH.find(s => s.id === 'b1').s, ASH.find(s => s.id === 'b1').s + .3);
  o.tail = [BIG.x + 46 * BIG.s, BIG.y - 74 * BIG.s];
  return o;
}
function insBubble(lt, sh) {
  if (!window.SH15) return;
  const second = sh.id === 'b2';
  veil(.3);
  V2.glow(540, 900, 760, '150,205,255', .12, 'screen', .2);
  const b = A15.binder({ x: BIG.x, y: BIG.y + Math.sin(lt * 3) * 6, s: BIG.s, center: true, noLegs: true, who: 'bind', t: lt, yaw: -.25, pose: second ? 'cheer' : 'helpful', grin: second ? .45 : .15, look: [.5, -.4], hover: 8 });
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 12; drawChar(b); ctx.restore();
  const bo = bubbleOpts(lt, second);
  if (!second) { const yes = SH15.binderRect(bo, 'yes'), wk = ss(lt, TA.wS('b1', 6) - .05, TA.wS('b1', 6) + .25); if (yes && wk > 0) V2.glow(yes.x + yes.w / 2, yes.y + yes.h / 2, 150, '120,255,170', .25 * wk * (.7 + .3 * Math.sin(lt * 9)), 'screen', .3); }
  SH15.binder(bo, lt);
}
function insGrin(lt, sh) {
  veil(.42);
  const k = sg(lt, sh.s, sh.e), g = ss(lt, AC.grin - .06, AC.grin + .1);
  V2.glow(540, 900, 640, '120,255,180', .16 + .12 * g, 'screen', .3);
  const b = A15.binder({ x: 540, y: 930, s: lerp(1.9, 2.1, k), center: true, noLegs: true, who: 'bind', t: lt, yaw: 0, pose: 'cheer', grin: g, glint: g > .9 ? Math.max(0, Math.sin((lt - AC.grin - .1) * 12)) ** 2 : 0, look: [.1, .1], hover: 8 });
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 16; drawChar(b); ctx.restore();
}
const ARRIVE = {
  shot: lt => aShot(lt).id,
  cam: camA,
  draw: drawA,
  fx: lt => { const sil = lt < 1.9 ? 1 - ss(lt, 1.6, 1.9) : 0; return { bloom: .35 + .35 * sil, vignette: .28 + .1 * sil, grain: .04, contrast: .08 + .06 * sil, sat: .08, tint: [['#ffd9a8', .05 + .05 * sil, 'soft-light']] }; },
  blur: lt => { const sh = aShot(lt); if (lt - sh.s < .04) return 1; return sh.id === 'scat' && lt > T_SCAT - .02 && lt < T_SCAT + .6 ? 4 : sh.id === 'st1' && lt < 20.9 ? 3 : sh.id === 'chain' ? 2 : 1; },
  over(lt) { const sh = AFR ? AFR.sh : aShot(lt); if (sh.ins === 'bubble') insBubble(lt, sh); else if (sh.ins === 'grin') insGrin(lt, sh); },
  clock: () => TA.SCN.clock, label: () => TA.SCN.label,
};
window.__EP21_SCENES = window.__EP21_SCENES || {}; window.__EP21_SCENES.arrive = ARRIVE;

// ================================================================== EXIT: the conference room at night (a flat stage, floor FLC 1300), then the station at night
const EC = { gasp: 3.0, sniffle: 12.489, tick1: 13.274, chairsit: 15.183, exhale: 15.883, tick2: 17.983, shiftbell: 18.383, stamp: 19.633, doorclose: 20.746, poof: 21.246, closetopen: 21.646,
  coffeemaker: 22.146, labelpeel: 22.546, doorchime: 22.796, sting: 31.01 };
for (const k in EC) EC[k] = TE.snapT(EC[k]);
const FLC = 1300;
const TBL = { x0: 470, x1: 1650, far: 1078, near: 1110 };                         /* the long table */
const SEAT = { melon: 590, onion: 790, lemon: 990, mango: 1190, tom: 1390, straw: 1570 };  /* seated behind it, facing us */
const SEATY = 1084;                                                                /* noLegs: y is the bottom of the body (hidden by the table) */
const SCE = { melon: .92, onion: .84, lemon: .84, mango: .86, tom: .86, straw: .86, kale: .92, radish: .9 };
const CHAIR = { x: 2080, seat: 1168 };                                              /* the armchair in the corner */
const LAMP = { x: 2268, y: 812 };                                                  /* the floor lamp's shade */
const CLK = { x: 1890, y: 742, r: 112 };                                           /* the wall clock over the armchair */
/* the clock's time at scene time lt, in seconds after 10:00:00 PM: 10:58 and running until the tick at 13.27 (10:59:00), then the minute runs; the break shot opens on 10:59:44 (the cut hides the jump)
 * and the second hand reaches the twelve on the second tick (17.98): 11:00 */
function clockSec(lt) {
  if (lt < EC.tick1) return 59 * 60 - (EC.tick1 - lt);
  if (lt < 15.08) return 59 * 60 + (lt - EC.tick1);
  if (lt < EC.tick2) return 59 * 60 + 44 + 16 * ss(lt, 15.08, EC.tick2) * .25 + 16 * sg(lt, 15.08, EC.tick2) * .75;
  return 60 * 60 + (lt - EC.tick2) * .2;
}
function cWall(lt) {
  const top = '#c9d0de', bot = '#aab4c8', wain = '#5d5a6e';
  ctx.fillStyle = lg(0, -400, 0, FLC, [[0, '#d4dbe8'], [.35, top], [1, bot]]); ctx.fillRect(-1600, -600, 5200, FLC + 600);
  ctx.fillStyle = lg(0, 1040, 0, FLC, [[0, wain], [1, shade(wain, .84)]]); ctx.fillRect(-1600, 1040, 5200, FLC - 1040);
  ctx.fillStyle = '#e4e8f0'; ctx.fillRect(-1600, 1032, 5200, 12); ctx.fillStyle = 'rgba(30,20,40,.28)'; ctx.fillRect(-1600, 1044, 5200, 4);
  ctx.fillStyle = '#b3bccd'; ctx.fillRect(-1600, -600, 5200, 930); ctx.fillStyle = 'rgba(30,20,40,.2)'; ctx.fillRect(-1600, 326, 5200, 6);
  const VX = 1000, VY = 980, sc = y => (VY - y) / (VY - 326), px = (x, y) => VX + (x - VX) * sc(y);
  ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineWidth = 3;
  for (let x = -2000; x <= 4000; x += 220) { ctx.beginPath(); ctx.moveTo(x, 326); ctx.lineTo(px(x, -700), -700); ctx.stroke(); }
  for (let j = 1; j <= 9; j++) { const y = 326 - 38 * j * (1 + j * .2); ctx.beginPath(); ctx.moveTo(-2400, y); ctx.lineTo(4400, y); ctx.stroke(); }
  for (const lx of [300, 1000, 1700]) for (const [ya, yb] of [[250, 288], [96, 168]]) {
    poly([[px(lx - 110, yb), yb], [px(lx + 110, yb), yb], [px(lx + 110, ya), ya], [px(lx - 110, ya), ya]], 'rgba(244,250,255,.95)', INKC, 2.4);
    glow(lx, yb + 30, 320, '#eef4ff', ya > 200 ? .22 : .12, .1);
  }
}
/* the window: night, deep blue, snow, the lot lamp; blinds half up */
function cWindow(lt) {
  const x0 = 520, x1 = 1000, y0 = 470, y1 = 900;
  ctx.fillStyle = '#e8ecf3'; rr(x0 - 16, y0 - 16, x1 - x0 + 32, y1 - y0 + 32, 6); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#14244a'], [.7, '#2a3e6e'], [1, '#4a5e8e']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = '#dfe8f6'; ctx.beginPath(); ctx.moveTo(x0, y1); for (let i = 0; i <= 12; i++) ctx.lineTo(x0 + (x1 - x0) * i / 12, y1 - 40 - 10 * Math.sin(i * 1.7)); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#39456a'; ctx.fillRect(x0 + 330, y0 + 140, 7, 260); glow(x0 + 333, y0 + 138, 70, '#ffe2a6', .5, .6);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 40; i++) { const r1 = rnd(41, i), r2 = rnd(42, i), r3 = rnd(43, i), xx = x0 + ((r1 * (x1 - x0) + lt * 18 * Math.sin(r2 * 6) + 9999) % (x1 - x0)), yy = y0 + ((r2 * (y1 - y0) + lt * (40 + 70 * r3)) % (y1 - y0)); ctx.beginPath(); ctx.arc(xx, yy, 1.8 + 2.6 * r3, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = '#eef1f6'; for (let i = 0; i < 6; i++) { ctx.fillRect(x0, y0 + i * 18, x1 - x0, 13); } ctx.fillStyle = 'rgba(40,40,60,.25)'; for (let i = 0; i < 6; i++) ctx.fillRect(x0, y0 + i * 18 + 13, x1 - x0, 3);
  ctx.strokeStyle = '#e8ecf3'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, y0); ctx.lineTo((x0 + x1) / 2, y1); ctx.stroke();
  ctx.fillStyle = '#e8ecf3'; rr(x0 - 26, y1 + 8, x1 - x0 + 52, 16, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
}
/* the whiteboard: EXIT CONFERENCE in marker (dressing) */
function cBoard(lt) {
  const x0 = 1100, x1 = 1500, y0 = 540, y1 = 860;
  ctx.fillStyle = '#9aa3b2'; rr(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20, 6); ctx.fill(); ctx.fillStyle = '#fbfcfe'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20);
  TXT('EXIT CONFERENCE', (x0 + x1) / 2, y0 + 46, { size: 34, fill: '#1f3f8a', weight: 900, spacing: 1, maxW: x1 - x0 - 40, hero: false });
  ctx.strokeStyle = 'rgba(31,63,138,.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const y = y0 + 110 + i * 46; ctx.beginPath(); ctx.moveTo(x0 + 40, y); ctx.lineTo(x0 + 40 + (i === 3 ? 140 : 260 - i * 30), y); ctx.stroke(); }
  ctx.fillStyle = '#c2272d'; ctx.fillRect(x0 + 20, y1 + 6, 46, 10); ctx.fillStyle = '#1f3f8a'; ctx.fillRect(x0 + 74, y1 + 6, 46, 10);
}
/* the wall clock: a big school clock; numerals through the UI kit (hero when the clock is big on screen) */
function cClock(lt) {
  const { x, y, r } = CLK, sec = clockSec(lt), h = 10 + sec / 3600, m = (sec / 60) % 60, sx = sec % 60;
  ctx.fillStyle = 'rgba(20,20,40,.22)'; ctx.beginPath(); ctx.arc(x + 6, y + 10, r + 14, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1f2433'; ctx.beginPath(); ctx.arc(x, y, r + 14, 0, TAU); ctx.fill();
  ctx.fillStyle = rg(x - r * .3, y - r * .3, 10, r * 1.2, [[0, '#ffffff'], [1, '#e9edf3']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2b2f3a'; for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, L = i % 5 ? .04 : .07; ctx.lineWidth = i % 5 ? 1.6 : 4; ctx.beginPath(); ctx.moveTo(x + Math.sin(a) * r * (.95 - L), y - Math.cos(a) * r * (.95 - L)); ctx.lineTo(x + Math.sin(a) * r * .95, y - Math.cos(a) * r * .95); ctx.stroke(); }
  UI.container('fp21a_clock', 'board', [x - r, y - r, x + r, y + r], 2);
  for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU; TXT(String(i), x + Math.sin(a) * r * .74, y - Math.cos(a) * r * .74, { size: 24, fill: '#1f2433', weight: 900, cid: 'fp21a_clock' }); }
  const hand = (a, L, w, c, tail) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - Math.sin(a) * (tail || 0), y + Math.cos(a) * (tail || 0)); ctx.lineTo(x + Math.sin(a) * L, y - Math.cos(a) * L); ctx.stroke(); };
  const mSnap = Math.floor(m) + ss(m - Math.floor(m), .985, 1) + pulse(lt, EC.tick2, 40, .05) * .004;
  hand((h % 12) / 12 * TAU, r * .38, 10, '#1f2433'); hand(mSnap / 60 * TAU, r * .54, 7, '#1f2433');
  hand(sx / 60 * TAU, r * .56, 3, '#d6202c', r * .16); ctx.fillStyle = '#d6202c'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(x - r * .3, y - r * .45, r * .5, r * .2, -.5, 0, TAU); ctx.fill();
}
/* the corner: a floor lamp (warm), the armchair (empty or taken), a side table with a mug */
function cCorner(lt) {
  const { x, seat } = CHAIR;
  glow(LAMP.x - 40, LAMP.y + 160, 520, '#ffd28a', .34, .2);
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(LAMP.x, LAMP.y + 40); ctx.lineTo(LAMP.x, FLC - 12); ctx.stroke(); ctx.fillStyle = '#3a3440'; ctx.beginPath(); ctx.ellipse(LAMP.x, FLC - 8, 50, 12, 0, 0, TAU); ctx.fill();
  poly([[LAMP.x - 64, LAMP.y + 60], [LAMP.x + 64, LAMP.y + 60], [LAMP.x + 40, LAMP.y - 30], [LAMP.x - 40, LAMP.y - 30]], lg(0, LAMP.y - 30, 0, LAMP.y + 60, [[0, '#ffe7b8'], [1, '#f5c56e']]), INKC, 2.6);
  glow(LAMP.x, LAMP.y + 70, 180, '#ffd796', .55, .5);
  /* the side table and a mug */
  ctx.fillStyle = '#7a5a44'; rr(x + 150, 1150, 110, 16, 4); ctx.fill(); ctx.fillRect(x + 196, 1166, 16, FLC - 1170);
}
function cArmchairBack() {
  const { x, seat } = CHAIR;
  ctx.fillStyle = lg(0, 900, 0, seat, [[0, '#a0465a'], [1, '#7a3044']]); rr(x - 150, 905, 300, seat - 905 + 20, 60); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(40,10,20,.25)'; ctx.lineWidth = 3; for (const dx of [-60, 0, 60]) { ctx.beginPath(); ctx.moveTo(x + dx, 940); ctx.lineTo(x + dx, seat - 10); ctx.stroke(); }
}
function cArmchairFront(sit) {
  const { x, seat } = CHAIR;
  ctx.fillStyle = lg(0, seat, 0, seat + 60, [[0, '#b45468'], [1, '#8a3a4e']]); rr(x - 150, seat - 10 + 6 * sit, 300, 62, 22); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  for (const sd of [-1, 1]) { ctx.fillStyle = lg(0, seat - 70, 0, seat + 60, [[0, '#b85a6e'], [1, '#86364a']]); rr(x + sd * 150 - 34, seat - 70, 68, 150, 28); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.fillStyle = '#7a3044'; ctx.fillRect(x - 140, seat + 50, 280, 40); ctx.fillStyle = '#3a2a2a'; for (const dx of [-120, 110]) ctx.fillRect(x + dx, seat + 88, 14, FLC - seat - 92);
}
/* the table: the top (a light edge toward us), the apron, the legs; on it: Onion's stack of binders, mugs, a pizza box, papers */
function cTable(lt, st) {
  const { x0, x1, far, near } = TBL;
  ctx.fillStyle = lg(0, far, 0, near, [[0, '#a07850'], [1, '#c69a68']]); ctx.fillRect(x0, far, x1 - x0, near - far);
  ctx.fillStyle = '#6e4e34'; ctx.fillRect(x0 - 8, near, x1 - x0 + 16, 40); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(x0 - 8, near, x1 - x0 + 16, 40); ctx.strokeRect(x0, far, x1 - x0, near - far);
  ctx.fillStyle = '#5a3e2a'; for (const lx of [x0 + 30, x1 - 54]) { ctx.fillRect(lx, near + 40, 24, FLC - near - 44); ctx.strokeRect(lx, near + 40, 24, FLC - near - 44); }
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(x0 + 54, near + 40, x1 - x0 - 108, 12);
  /* on the table */
  const mug = (mx, col) => { ctx.fillStyle = col; rr(mx - 16, far - 30, 32, 34, 5); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(mx + 18, far - 14, 8, -1.3, 1.3); ctx.stroke(); };
  mug(1080, '#e8eef4'); mug(1300, '#c2272d'); mug(1490, '#2f6fc4');
  ctx.fillStyle = '#fbfaf2'; for (const [px, r] of [[700, -.06], [1180, .05], [1420, -.03]]) { ctx.save(); ctx.translate(px, far + 12); ctx.rotate(r); ctx.fillRect(-40, -6, 80, 12); ctx.restore(); }
  if (window.F19 && typeof F19.dish === 'function') F19.dish(ctx, 'pizzaBox', { x: 520, y: far + 6, s: .42, open: 0, seed: 2 });
  binderStack(far, st.clutch || 0);
}
const STACKX = 890;
function binderStack(far, bk) {
  const cols = ['#1f3166', '#c2272d', '#2f7a4a'];
  for (let i = 0; i < 3; i++) { const x = STACKX - 48 + Math.sin(i * 2.1) * 5 - bk * 10, y = far - 10 - i * 22 - bk * 3; ctx.fillStyle = cols[i]; rr(x, y, 96, 22, 3); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x + 14, y + 7, 34, 6); }
}
/* the chair backs of the seated staff (behind them) */
function cChairs() {
  for (const n in SEAT) { const x = SEAT[n]; ctx.fillStyle = lg(0, 880, 0, 1080, [[0, '#2e3e66'], [1, '#22304e']]); rr(x - 96, 890, 192, 200, 26); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke(); }
}

// ------------------------------------------------------------------ EXIT: the cast in the conference room (seated staff: noLegs, the table covers the bottom of the body)
const GASP = lt => ss(lt, EC.gasp - .04, EC.gasp + .08) * (1 - ss(lt, EC.gasp + .5, EC.gasp + .9));
const T_TURN = TE.snapT(TE.wS('ra1', 6) - .05);                                    /* every head turns to Strawberry on "break." */
const turnK = lt => ss(lt, T_TURN, T_TURN + .18);
/* where the seated look: at the surveyors (left), then at Strawberry (right), at Onion on her outburst, at the clock */
function seatLook(n, lt) {
  const me = SEAT[n], toS = turnK(lt), atOnion = ss(lt, TE.ls('o1') - .1, TE.ls('o1') + .15) * (1 - ss(lt, TE.le('o1') + .2, TE.le('o1') + .5));
  let tx = lerp(240, SEAT.straw, toS); if (n === 'straw') tx = lerp(240, 240, toS);
  if (lt > TE.ls('ka2') && lt < TE.ls('o1')) tx = lerp(tx, CHAIR.x, ss(lt, TE.wS('ka2', 4), TE.wS('ka2', 4) + .3));
  if (n !== 'onion') tx = lerp(tx, SEAT.onion, atOnion);
  const dx = tx - me; return { head: Math.max(-.62, Math.min(.62, dx / 520)), look: [Math.max(-1, Math.min(1, dx / 300)), .02] };
}
function seated(o, n, lt) {
  const g = seatLook(n, lt), gs = GASP(lt);
  Object.assign(o, { x: SEAT[n], y: SEATY - 26 * gs * 0, noLegs: true, s: SCE[n], t: lt, headYaw: g.head, yaw: g.head * .35, look: g.look, plant: false });
  o.lift = 14 * gs; o.squash = -.05 * gs;
  return o;
}
function eMelon(lt) {
  const o = seated(window.A9 ? A9.melon({}) : { kind: 'melon', id: 'melon', who: 'melon', acc: ['suit'] }, 'melon', lt), sp = talking(TE, 'me1', lt);
  o.acc = ['suit', 'sweat']; o.who = 'melon'; o.expr = GASP(lt) > .3 ? 'shock' : sp ? 'panic' : 'sad'; o.arms = { l: 'rest', r: 'rest' };
  if (sp) { o.arms = { l: 'rest', r: 'shrug' }; }
  return o;
}
function eOnion(lt) {
  const o = seated(A15.onion({ t: lt, who: 'onion', pose: 'rest', cry: .6 }), 'onion', lt), gs = GASP(lt), sp = talking(TE, 'o1', lt, .1, .35), sob = Math.max(0, 1 - Math.abs(lt - EC.sniffle - .08) / .3);
  const clutch = ss(lt, EC.gasp - .04, EC.gasp + .1) * (1 - ss(lt, 4.6, 5.2));
  o.expr = gs > .3 ? 'shock' : sp ? 'happy' : 'onion_cry'; o.cry = sp ? 1 : .62; o.sob = sob + (sp ? .2 : 0);
  if (clutch > .01) { o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: [-30, 52], r: [lerp(70, 104, clutch), 104] }; o.hand = { l: 'open', r: 'grip' }; }
  if (sp) { o.arms = { l: 'cheer', r: 'cheer' }; o.look = [0, -.25]; o.headYaw = .05; o.yaw = 0; o.lift = 18 * Math.abs(Math.sin((lt - TE.ls('o1')) * 7)) * Math.exp(-(lt - TE.ls('o1')) * 1.5); o.joy = 1; }
  return o;
}
function eLemon(lt) { const o = seated(A7.lemon({ t: lt, who: 'lemon', lid: .3 }), 'lemon', lt); o.expr = GASP(lt) > .3 ? 'shock' : 'neutral'; return o; }
function eMango(lt) { const o = seated(A7.mango({ t: lt, who: 'mango' }), 'mango', lt); o.expr = GASP(lt) > .3 ? 'shock' : 'sad'; return o; }
function eTom(lt) { const o = seated(A15.tomato({ t: lt, who: 'tom', tomPose: 'fruit', hold: {}, arms: { l: 'rest', r: 'rest' } }), 'tom', lt); o.expr = GASP(lt) > .3 ? 'shock' : 'tom_fruit'; return o; }
/* Strawberry: at the far end of the table, then in the armchair for the break */
function eStraw(lt) {
  if (lt >= 15.08 && lt < 20.65) {
    const sit = ss(lt, 15.0, EC.chairsit), cush = pulse(lt, EC.chairsit, 22, .12), ex = ss(lt, EC.exhale - .1, EC.exhale + .5), br = Math.sin((lt - EC.exhale) * 2.1) * (lt > EC.exhale ? 1 : 0);
    const shut = ss(lt, 15.35, 15.9) * (1 - ss(lt, EC.shiftbell + .05, EC.shiftbell + .3) * .45);
    const o = A11.straw({ x: CHAIR.x, y: CHAIR.seat - 30 + lerp(-30, 0, sit) + 4 * cush, s: .88, t: lt, who: 'straw', noLegs: true, expr: lt > EC.exhale + .2 ? 'chill' : 'dead', lid: lerp(.45, 1, shut),
      look: [0, .1], yaw: 0, headYaw: .06 * ex, arms: { l: 'rest', r: 'rest' } });
    o.squash = .05 * cush + .025 * ex * (1 - Math.abs(br) * .5) - .012 * br; o.rot = -.02 * ex; o.lid = lerp(.45, 1, shut);
    return o;
  }
  const o = seated(A11.straw({ t: lt, who: 'straw', expr: 'dead', lid: .5 }), 'straw', lt);
  const blink = Math.max(0, 1 - Math.abs(lt - (TE.ls('ra2') + .45)) / .16), okay = talking(TE, 's2', lt);
  o.expr = talking(TE, 's1', lt) ? 'neutral' : 'dead'; o.lid = lerp(.45, 1, blink); o.headYaw = -.2; o.yaw = -.08; o.look = [-.5, .02];
  if (lt > 13.0 && lt < 15.08) { o.headYaw = lerp(-.2, .4, ss(lt, 13.1, 13.5)); o.look = [lerp(-.5, .8, ss(lt, 13.1, 13.5)), -.3]; }
  if (okay) { o.expr = 'neutral'; o.lid = .35; o.headYaw = .2; o.look = [.4, -.1]; }
  return o;
}
function eKale(lt) {
  const sp = talking(TE, 'ka1', lt) || talking(TE, 'ka2', lt) || talking(TE, 'ka3', lt), point = ss(lt, TE.wS('ka2', 2) - .1, TE.wS('ka2', 2) + .2) * (1 - ss(lt, TE.le('ka2') + .1, TE.le('ka2') + .4));
  const note = lt > TE.ls('ka3') - .1 && lt < 20.65;
  const o = { x: 330, y: FLC, s: SCE.kale, t: lt, who: 'kale', expr: note ? 'kale_note' : lt > TE.le('ka3') ? 'kale_satisfied' : 'kale_neutral', pose: 'clip', yaw: .35, headYaw: .3, look: note ? undefined : [.5, .02], plant: true };
  if (point > .01) { o.arms = { l: 'hold', r: 'point' }; o.hold = { l: 'fp21_clipboard' }; o.yaw = .35 * (1 - point); o.headYaw = .45; o.look = [.9, -.05]; }
  if (turnK(lt) > 0 && lt < TE.ls('ka2')) { o.look = [.95, .02]; o.headYaw = .45; }
  return kaleO(o);
}
function eRadish(lt) {
  const o = { x: 150, y: FLC, s: SCE.radish, t: lt, who: 'radish', expr: 'radish_flat', pose: 'tablet', yaw: .3, headYaw: lt > T_TURN ? .55 : .3, look: lt > T_TURN ? [.9, .02] : [.4, .02], plant: true };
  if (talking(TE, 'ra2', lt)) { o.arms = { l: 'hold', r: 'point' }; o.look = [1, .02]; o.headYaw = .6; }
  return radishO(o);
}
function castC(lt) {
  return { kale: eKale(lt), radish: eRadish(lt), melon: eMelon(lt), onion: eOnion(lt), lemon: eLemon(lt), mango: eMango(lt), tom: eTom(lt), straw: eStraw(lt) };
}

// ------------------------------------------------------------------ EXIT: the station at night: the revert, Eggplant
const T_REV = 20.65;
const AGF = [815, 950, 1085, 1220], AGB = [];                                        /* agency Strawberries: one row in front of the counter */
function stE(lt) {
  const open = lt < EC.doorclose ? 1 - ss(lt, T_REV, EC.doorclose) : lt < EC.doorchime ? 0 : ss(lt, EC.doorchime, EC.doorchime + .3) * (1 - ss(lt, 24.6, 25.4));
  return { night: 1, open, sun: 0, survey: lt < EC.labelpeel + 2 ? 1 : 0, peel: lt >= EC.labelpeel ? lt - EC.labelpeel : -1, poster: 1 - sg(lt, EC.labelpeel, EC.labelpeel + .12),
    coffee: lt >= EC.coffeemaker ? c01((lt - EC.coffeemaker) / .22) : 0, coffeePop: true, closet: ss(lt, EC.closetopen, EC.closetopen + .3), t: lt };
}
const POOF = lt => lt >= EC.poof;
function agencyAll(lt) {
  const out = [], k = lt < EC.poof - .06 ? 1 : 1 - sg(lt, EC.poof - .06, EC.poof + .02);
  if (k <= .02) return out;
  AGB.forEach((x, i) => out.push(Object.assign(agencyO({ t: lt + i * .3, who: 'none', expr: 'neutral', lid: .4, plant: true, look: [-.3 + .15 * i, 0], arms: { l: 'rest', r: 'rest' } }), { id: 'ag' + i, x, y: FL - 36, s: .7 * k, behind: true })));
  AGF.forEach((x, i) => out.push(Object.assign(agencyO({ t: lt + 2 + i * .4, who: 'none', expr: 'neutral', lid: .4, plant: true, look: [-.5, 0], headYaw: -.15, arms: { l: 'rest', r: 'rest' } }), { id: 'agf' + i, x, y: FL + 14, s: .78 * k, squash: .2 * (1 - k) })));
  return out;
}
/* Brenda strolls out of the closet with her sandwich */
function brendaE(lt) {
  if (lt < EC.closetopen + .1 || !window.A13) return null;
  const u = ss(lt, EC.closetopen + .1, EC.closetopen + 1.6), x = lerp(1300, 1180, u), walking = u > 0 && u < 1;
  const o = A13.brenda({ x, y: FL + 6, s: .8, t: lt, who: 'brenda', expr: A13.expr('relief'), lid: .3, look: [-.6, .05], yaw: walking ? -.7 : -.35, headYaw: -.4, dust: .7, specsDrop: .6, plant: true,
    arms: { l: 'rest', r: 'hold' }, grip: { r: [70, 10] }, hold: EXT.prop.fp19b_sandwich ? { r: 'fp19b_sandwich' } : {}, sandScale: .9 });
  if (walking) { o.gait = (1300 - x) / o.s; o.dir = -1; o.stride = 22; }
  return o;
}
/* the surveyors leave through the front doors (backs to us), then they are two shapes in the snow going away */
function survOut(lt) {
  if (lt >= T_REV + .9) return [];
  const u = sg(lt, T_REV - .2, T_REV + .9), k = 1 - u * .25, fade = 1 - ss(lt, T_REV + .55, T_REV + .9);
  if (fade <= .02) return [];
  const mk = (ctor, x, n) => { const o = ctor({ x, y: FL - 30 * u, s: .9 * k, t: lt, who: 'none', yaw: PI, headYaw: PI, pose: 'clip', plant: true }); o.gait = 160 * u / o.s; o.stride = 30; o.id = n + 'out'; return o; };
  return [mk(kaleO, 300 - 30 * u, 'kale'), mk(radishO, 150 + 10 * u, 'radish')].map(o => Object.assign(o, { alpha: fade }));
}
function eggE(lt) {
  const u = ss(lt, EC.doorchime + .05, EC.doorchime + .42), x = lerp(230, 432, u), sp = talking(TE, 'eg1', lt) || talking(TE, 'eg2', lt) || talking(TE, 'eg3', lt);
  const reading = lt > 27.1, hand = ss(lt, 26.9, 27.25), cosy = lt > 30.95;
  const o = A20.eggplant({ t: lt, pose: 'rest', expr: cosy ? 'egg_cosy' : talking(TE, 'eg2', lt, .1, .5) ? 'egg_calm' : 'egg_stuck', gear: { snow: .85, wind: .3 * (1 - u) } });
  Object.assign(o, { x, y: FL + 20, s: .9, plant: true, look: [.6, 0], yaw: lerp(.9, .35, u), headYaw: lerp(.9, .4, u), arms: { l: 'hold', r: 'rest' }, grip: { l: [-118, 58] }, hold: { l: 'fp21a_pizza' }, pizzaScale: .6, pizzaOpen: cosy ? ss(lt, 31.0, 31.5) : 0 });
  if (u > 0 && u < 1) { o.gait = (x - 230) / o.s; o.dir = 1; o.stride = 44; o.lift = 8 * Math.abs(Math.sin(u * 9)); }
  if (u < 1) o.transit = true;
  if (lt >= 23.0 && lt < 23.9) { o.arms.r = 'cheer'; }
  if (hand > 0) { o.arms.r = 'hold'; o.grip.r = [lerp(118, 84, hand), lerp(96, 70, hand)]; o.hold.r = 'fp21a_report'; o.repScale = .9; o.repRot = -.1; o.look = reading && lt < 29.6 ? [.3, .65] : [.6, 0]; }
  return o;
}
function strawE(lt) {
  const giving = ss(lt, TE.ls('s4') - .1, TE.ls('s4') + .3), gave = lt > 27.0, smile = ss(lt, TE.ls('s5') + .25, TE.ls('s5') + .7);
  const watch = lt < 22.7 ? K([[20.65, -.6], [21.15, -.6], [21.3, .5], [21.7, .7], [22.2, .4], [22.6, .3]], lt) : -.55;
  const o = A11.straw({ x: 650, y: FL + 10, s: .86, t: lt, who: 'straw', expr: 'neutral', lid: lerp(.42, .26, smile), plant: true, headYaw: watch, yaw: watch * .5, look: [watch > 0 ? .7 : -.7, .02], arms: { l: 'rest', r: 'rest' } });
  if (lt > 22.7) { const hk = 1 - ss(lt, 26.3, 26.6) * (1 - ss(lt, 27.4, 27.8)); o.headYaw = -.45 * hk; o.yaw = -.3 * hk; o.look = [-.8, 0]; }
  if (giving > 0 && !gave) { o.arms = { l: 'hold', r: 'rest' }; o.grip = { l: [lerp(-112, -150, giving), lerp(60, 92, giving)] }; o.hold = { l: 'fp21a_report' }; o.repScale = .9; }
  if (smile > 0) { o.face = { curve: .1 + .32 * smile }; o.headYaw = lerp(o.headYaw, -.2, smile); }
  return o;
}

// ------------------------------------------------------------------ EXIT: the shots (set 'conf' = the conference room, 'stn' = the station at night)
const ALLC = ['kale', 'radish', 'melon', 'onion', 'lemon', 'mango', 'tom', 'straw'];
const ESH = [
  { id: 'open', s: 0, set: 'conf', k: 'pt', x: 864, y: 930, z: [.645, .652], show: ALLC },
  { id: 'ka1', s: 1.50, set: 'conf', k: 'pt', x: 248, y: 1168, z: [1.42, 1.48], show: ['kale', 'radish'], bg: ['melon'], dof: 6 },
  { id: 'gasp', s: 3.00, set: 'conf', k: 'pt', x: 1078, y: 1065, z: [.86, .88], show: ['melon', 'onion', 'lemon', 'mango', 'tom', 'straw'] },
  { id: 'me1', s: 3.61, set: 'conf', k: 'face', foc: 'melon', z: [1.85, 1.92], up: 120, dof: 7, show: ['melon'], bg: ['onion'] },
  { id: 'ra1a', s: 4.41, set: 'conf', k: 'face', foc: 'radish', z: [1.62, 1.7], up: 110, dx: 60, dof: 7, show: ['radish'], bg: ['kale'] },
  { id: 'ra1b', s: 5.95, set: 'conf', k: 'pt', x: 1276, y: 1065, z: [.95, .97], show: ['onion', 'lemon', 'mango', 'tom', 'straw'] },
  { id: 's1', s: 7.19, set: 'conf', k: 'face', foc: 'straw', z: [2.0, 2.16], up: 110, dof: 7, show: ['straw'], bg: ['tom'] },
  { id: 'ka2a', s: 9.21, set: 'conf', k: 'pt', x: 268, y: 1168, z: [1.42, 1.46], show: ['kale', 'radish'], bg: ['melon'], dof: 6 },
  { id: 'ka2b', s: 10.45, set: 'conf', k: 'pt', x: 2124, y: 1010, z: [1.2, 1.26], show: [], corner: true },
  { id: 'o1', s: 11.59, set: 'conf', k: 'face', foc: 'onion', z: [1.9, 2.0], up: 120, dof: 7, show: ['onion'], bg: ['lemon', 'melon'] },
  { id: 'clock', s: 13.07, set: 'conf', k: 'pt', x: CLK.x, y: CLK.y + 40, z: [2.5, 2.62], show: [], hero: true, corner: true },
  { id: 's2', s: 14.32, set: 'conf', k: 'face', foc: 'straw', z: [2.1, 2.16], up: 110, dof: 7, show: ['straw'], bg: ['tom'] },
  { id: 'break', s: 15.08, set: 'conf', k: 'pt', x: 2010, y: 960, z: [1.5, 1.72], yk: [960, 942], show: ['straw'], hero: true, corner: true },
  { id: 'ka3a', s: 18.68, set: 'conf', k: 'pt', x: 248, y: 1168, z: [1.5, 1.55], show: ['kale', 'radish'], bg: ['melon'], dof: 6 },
  { id: 'ka3b', s: 19.45, set: 'conf', k: 'ins', x: 248, y: 1168, z: [1.55, 1.56], show: [], dof: 12 },
  { id: 'revert', s: 20.65, set: 'stn', k: 'pt', x: 470, y: 1110, z: [.9, .9], show: ['straw'], revPan: true },
  { id: 'eg1', s: 22.80, set: 'stn', k: 'pt', x: 500, y: 1244, z: [1.32, 1.36], show: ['egg', 'straw'] },
  { id: 's3', s: 24.07, set: 'stn', k: 'face', foc: 'straw', z: [2.0, 2.08], up: 110, dx: 30, dof: 7, show: ['straw'], bg: ['egg'] },
  { id: 'eg2', s: 24.91, set: 'stn', k: 'face', foc: 'egg', z: [1.9, 2.0], up: 110, dx: -30, dof: 7, show: ['egg'], bg: ['straw'] },
  { id: 's4', s: 26.55, set: 'stn', k: 'pt', x: 560, y: 1232, z: [1.42, 1.48], show: ['egg', 'straw'] },
  { id: 'eg3', s: 28.24, set: 'stn', k: 'face', foc: 'egg', z: [1.8, 1.86], up: 120, dx: -30, dof: 7, show: ['egg'], bg: ['straw'] },
  { id: 's5', s: 29.66, set: 'stn', k: 'face', foc: 'straw', z: [2.15, 2.3], up: 110, dx: 30, dof: 8, show: ['straw'], bg: ['egg'] },
  { id: 'end', s: 30.91, set: 'stn', k: 'pt', x: 560, y: 1264, z: [1.28, 1.34], show: ['egg', 'straw'] },
];
for (const sh of ESH) sh.s = sh.s === 0 ? 0 : TE.snapT(sh.s);
ESH.forEach((sh, i) => { sh.e = i + 1 < ESH.length ? ESH[i + 1].s : TE.SCN.dur; });
const eShot = lt => { let r = ESH[0]; for (const sh of ESH) if (lt >= sh.s - 1e-6) r = sh; return r; };
function castE(lt, sh) {
  if (sh.set === 'conf') return castC(lt);
  return { straw: strawE(lt), egg: eggE(lt) };
}
let EFR = null;
function camE(lt) {
  const sh = eShot(lt), C = castE(lt, sh), dur = sh.e - sh.s, u = c01((lt - sh.s) / dur), z = lerp(sh.z[0], sh.z[1], easeIO(u));
  let cx = sh.xk ? lerp(sh.xk[0], sh.xk[1], u) : sh.x, cy = sh.yk ? lerp(sh.yk[0], sh.yk[1], easeIO(u)) : sh.y;
  if (sh.revPan) cx = 470 + 540 * easeIO(sg(lt, 20.65, 22.0)) + 20 * sg(lt, 22.0, 22.75);
  if (sh.k === 'face') { const [fx, fy] = faceC(C[sh.foc]); cx = fx - (sh.dx || 0) / z; cy = fy + sh.up / z; }
  zoomTo(cx, cy, z);
  const calm = sh.id === 'break' ? .25 : 1;
  CAM.x += 2 * hn(lt, 1.3, 4) * calm; CAM.y += 1.5 * hn(lt, 1.1, 5) * calm; CAM.r += .001 * hn(lt, .9, 6) * calm;
  if (sh.id === 'gasp') CAM.shake = 3 * Math.exp(-Math.max(0, lt - EC.gasp) * 6) * (lt >= EC.gasp ? 1 : 0);
  EFR = { C, sh };
}
function confRoom(lt, sh, C, bgCast) {
  cWall(lt); cWindow(lt); cBoard(lt);
  HEROMODE = !!sh.hero; cClock(lt); HEROMODE = false;
  cCorner(lt); cArmchairBack();
  const fl = '#8f97a8'; ctx.fillStyle = lg(0, FLC, 0, 2400, [[0, '#9aa2b4'], [1, '#7c8496']]); ctx.fillRect(-1600, FLC, 5200, 1300);
  ctx.strokeStyle = 'rgba(40,40,60,.14)'; ctx.lineWidth = 2.4; for (let i = 0; i < 9; i++) { const y = FLC + 10 + Math.pow(i / 8, 1.7) * 900; ctx.beginPath(); ctx.moveTo(-1600, y); ctx.lineTo(3600, y); ctx.stroke(); }
  ctx.fillStyle = lg(0, FLC, 0, FLC + 70, [[0, 'rgba(30,20,40,.22)'], [1, 'rgba(30,20,40,0)']]); ctx.fillRect(-1600, FLC, 5200, 70);
  cChairs();
  if (bgCast) bgCast();
}
function drawE(lt) {
  const { C, sh } = EFR;
  V2.opts.reflect = false;
  if (sh.set === 'conf') {
    const warm = sh.corner ? 1 : 0;
    V2.setLight({ key: [-.4, -.65], keyColor: warm ? '#ffe2b8' : '#f2f6ff', keyA: .2, rim: warm ? '#ffcf8a' : '#a9c4ff', rimA: .32, shadow: '#1a1830', shadowA: .3, bounce: '#ffe0b0', bounceA: .1 + .08 * warm, amb: '#e6ecff', ambA: .05, frontDark: .02 });
    const seatedN = ['melon', 'onion', 'lemon', 'mango', 'tom', 'straw'], standN = ['kale', 'radish'];
    const inBreak = lt >= 15.08;
    const bgCast = () => { if (!sh.bg) return; REG.suppress++; for (const n of sh.bg) if (inFrame(C[n], 20).inter) drawChar(C[n]); REG.suppress--; };
    const world = () => {
      confRoom(lt, sh, C, null);
      SOFT += sh.dof ? 0 : 0;
      if (sh.dof) bgCast();
      /* the seated characters behind the table (sharp only if listed), the table, Onion's binders */
      for (const n of seatedN) if (sh.show.includes(n) && !(n === 'straw' && inBreak)) drawIn(C[n]);
      cTable(lt, { clutch: C.onion && C.onion.arms && C.onion.arms.r === 'hold' ? 1 : 0 });
      if (inBreak && sh.show.includes('straw')) { drawIn(C.straw); }
      cArmchairFront(inBreak && lt >= EC.chairsit ? 1 : 0);
      for (const n of standN) if (sh.show.includes(n)) drawIn(C[n]);
    };
    if (sh.dof) {   /* the room (and the silent neighbours) soft; the subject sharp, drawn again after the blur */
      SOFT++; V2.dof(sh.dof, () => { confRoom(lt, sh, C, bgCast); cTable(lt, { clutch: 0 }); cArmchairFront(0); }); SOFT--;
      for (const n of sh.show) { const o = C[n]; if (seatedN.includes(n)) { drawIn(o); cTableFront(lt, o); } else drawIn(o); }
    } else world();
    if (sh.id === 'o1' && C.onion.joy) sparkles(C.onion, 1, lt, 9);
    if (sh.id === 'break') breakFx(lt);
    return;
  }
  /* the station at night */
  V2.setLight({ key: [-.5, -.6], keyColor: '#f4f6ff', keyA: .2, rim: '#9fc0ff', rimA: .36, shadow: '#1a1830', shadowA: .3, bounce: '#e6e0ff', bounceA: .1, amb: '#e8eeff', ambA: .06, frontDark: .02 });
  const st = stE(lt), ag = sh.id === 'revert' ? agencyAll(lt) : [], out = sh.id === 'revert' ? survOut(lt) : [];
  const between = out.length ? () => { for (const o of out) { ctx.save(); ctx.globalAlpha *= o.alpha; drawChar(Object.assign({}, o, { transit: true })); ctx.restore(); } } : null;
  const behind = ag.length ? () => { for (const o of ag) if (o.behind) drawIn(o); } : null;
  const bgCast = () => { if (!sh.bg) return; REG.suppress++; for (const n of sh.bg) if (inFrame(C[n], 20).inter) drawChar(C[n]); REG.suppress--; };
  const room = () => sSet(st, { between, behind, skipLap: false });
  if (sh.dof) { SOFT++; V2.dof(sh.dof, () => { room(); bgCast(); }); SOFT--; } else room();
  if (sh.id === 'revert') {
    for (const o of ag) if (!o.behind) drawIn(o);
    for (const x of AGF) puff(x, FL - 140, 120, lt, EC.poof, { life: .7, flat: .1, seed: x, color: '#f4f0ff' });
    const b = brendaE(lt); if (b) drawIn(b);
    if (lt >= EC.coffeemaker && lt < EC.coffeemaker + .5) sparkles({ kind: 'cherry', x: COF.x, y: CT.top + 60, s: .5 }, 1 - sg(lt, EC.coffeemaker, EC.coffeemaker + .5), lt, 3);
  }
  if (lt >= EC.doorchime - .05 && lt < EC.doorchime + 1.2 && (sh.id === 'eg1')) { ctx.save(); ctx.globalAlpha *= 1 - sg(lt, EC.doorchime + .5, EC.doorchime + 1.2); snowGust(lt); ctx.restore(); }
  HEROMODE = !!sh.hero;
  for (const o of sorted(sh.show.map(n => C[n]))) drawIn(o);
  HEROMODE = false;
}
/* the front of the table drawn over a seated subject in a soft shot (its top edge and apron, sharp: the subject sits behind it) */
function cTableFront(lt, o) {
  const { x0, x1, far, near } = TBL, a = Math.max(x0, o.x - 260), b = Math.min(x1, o.x + 260);
  ctx.fillStyle = lg(0, far, 0, near, [[0, '#a07850'], [1, '#c69a68']]); ctx.fillRect(a, far, b - a, near - far);
  ctx.fillStyle = '#6e4e34'; ctx.fillRect(a, near, b - a, 40); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a, far); ctx.lineTo(b, far); ctx.moveTo(a, near); ctx.lineTo(b, near); ctx.moveTo(a, near + 40); ctx.lineTo(b, near + 40); ctx.stroke();
  if (o.kind === 'onion' || o.kind === 'lemon') binderStack(far, o.kind === 'onion' && o.arms && o.arms.r === 'hold' ? 1 : 0);
}
/* the break: the room holds still; the lamp breathes warm on her; dust in the lamp light; at 11:00 a soft ring of light from the clock */
function breakFx(lt) {
  glow(CHAIR.x + 40, CHAIR.seat - 160, 300, '#ffd9a0', .18 + .04 * Math.sin(lt * 1.2), .2);
  if (V2.dust) V2.dust(CHAIR.x - 240, 700, CHAIR.x + 260, 1200, lt, { n: 22, color: '255,226,180', alpha: .45, seed: 21, speed: 6 });
  if (lt >= EC.shiftbell) V2.ring(CLK.x, CLK.y, sg(lt, EC.shiftbell, EC.shiftbell + .8), { r0: CLK.r + 10, r1: CLK.r + 120, color: '255,236,190', lw: 8, alpha: .7, bloom: .3 });
}
/* snow blowing in through the open doors */
function snowGust(lt) {
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 60; i++) { const a = (lt - EC.doorchime) * (1 + rnd(51, i)) * 1.2, x = DOOR.x0 + 60 + rnd(52, i) * 300 + a * (300 + 500 * rnd(53, i)), y = DOOR.y0 + 100 + rnd(54, i) * 560 + Math.sin(a * 6 + i) * 30 + a * 120; if (a < 0) continue; ctx.beginPath(); ctx.arc(x, y, 2 + 3 * rnd(55, i), 0, TAU); ctx.fill(); }
}

/* the clipboard insert: Ms. Kale's checklist, BREAKS failed (a red X), then the CORRECTED stamp lands on it (stamp 19.63) */
function insClip(lt, sh) {
  const k = eo(sg(lt, sh.s, sh.s + .25));
  ctx.fillStyle = 'rgba(14,18,30,.34)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(540, 760 + 60 * (1 - k)); ctx.rotate(-.03); ctx.scale(lerp(.9, 1, k), lerp(.9, 1, k)); ctx.translate(-540, -760);
  const items = ['FRONT DOOR', 'STAFFING', 'LABELS', 'MED PASS', 'BREAKS', ''];
  let rows = null;
  if (hasA('clipboard')) { const r = A21.clipboard(ctx, { x: 540, y: 770, w: 700, h: 1060, rot: 0, items, ticks: 4, fail: 4, failK: 1, rowAlpha: [1, 1, 1, 1, 1, 0], t: lt, hero: true }); rows = r && r.rows; }
  else {
    ctx.fillStyle = '#b98a55'; rr(230, 300, 620, 860, 24); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 5; ctx.stroke(); ctx.fillStyle = '#fbf9f2'; ctx.fillRect(262, 360, 556, 770);
    UI.container('fp21a_cbins', 'board', [262, 360, 818, 1130], 10);
    TXT('DEPARTMENT OF HEALTH', 540, 410, { size: 34, fill: '#1f3166', weight: 900, maxW: 500, hero: true, cid: 'fp21a_cbins' });
    rows = items.map((t, i) => ({ text: [330, 520 + i * 120], cy: 520 + i * 120, box: [282, 500 + i * 120, 318, 536 + i * 120], size: 40 }));
    items.forEach((t, i) => TXT(t, 340, 520 + i * 120, { size: 40, fill: '#22262b', weight: 900, align: 'left', maxW: 440, hero: true, cid: 'fp21a_cbins' }));
  }
  ctx.restore();
  /* the stamp lands over the failed row: CORRECTED */
  /* the stamp lands in the blank space under the failed row: CORRECTED, big, a little crooked */
  const row = rows && rows[5], sx = row ? row.cx + 30 : 556, sy = row ? row.cy : 1120;
  stampAt(sx, sy, { t: lt, t0: EC.stamp, text: 'CORRECTED', size: 70, rot: -.1, s: 1, color: '#d6203a', pre: .1 });
}
const EXIT = {
  shot: lt => eShot(lt).id,
  cam: camE,
  draw: drawE,
  fx: lt => { const sh = eShot(lt), warm = sh.id === 'break' ? 1 : sh.corner ? .6 : 0; return { bloom: .32 + .18 * warm, vignette: .3 + .08 * warm, grain: .045, contrast: .08, sat: .06 + .06 * warm, tint: [[warm ? '#ffcf8a' : '#a8c0ff', .05 + .06 * warm, 'soft-light']] }; },
  blur: lt => { const sh = eShot(lt); if (lt - sh.s < .04) return 1; return sh.id === 'eg1' && lt > EC.doorchime && lt < EC.doorchime + .5 ? 4 : sh.id === 'revert' && lt < 22.0 ? 2 : 1; },
  over(lt) { const sh = EFR ? EFR.sh : eShot(lt); if (sh.id === 'ka3b') insClip(lt, sh); },
  clock: () => TE.SCN.clock, label: () => TE.SCN.label,
};
window.__EP21_SCENES.exit = EXIT;
})();
