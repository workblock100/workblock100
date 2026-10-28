'use strict';
/* SHIFT HAPPENS, Episode 14, scene `colony` (26.84 s, 3:02 PM, THE COLONY): the documentary opens on the habitat, a cutaway dollhouse (the kit S14), the visitor, the alarm call and the meerkats.
 * Builder E14-K. Registers window.__EP14_SCENES.colony. Everything is a pure function of the scene time `lt`; the building comes from ep14_house.js, the cast from the Episode 7 to 14 art kits.
 *
 * SHOT LIST (scene-local seconds; every cut is a hard cut with `blur` 1 on its frame, every move has a reason)
 *   0.00-1.50  open    CRANE DOWN from the sky (gold afternoon, clouds, birds on the `birds` cue at 0.2) past the roof sign onto the whole building: the camera eases from y -520 to the wide at 1.5.
 *   1.50-5.00  n1      WIDE, z 1.0 creeping to 1.05. The colony at home: Mrs. Cranberry rocks, Mr. Banana tests his walker, Mr. Goji stares at the empty pitcher, the Administrator eats pizza, Lemon is on
 *                      hold, Strawberry charts, Clementine nods at nothing, Mango minds the lobby desk, two residents lunch. The clock on the station wall and the lamps are alive.
 *   5.00-9.25  n2      CENSUS TAGS pop in the sky on the words (RESIDENTS 40, STAFF 4, SHOWER ROOMS 1) while the camera starts to push at 6.3 and PUSHES IN to the shower room (z 3.05 at 8.3): the stash behind the glass,
 *                      the door straining under it, the OUT OF ORDER tape, DO NOT OPEN, the sock. Held, with air around it; the door creaks on "Do not open it."
 *   9.25-12.50 n3      WHIP DOWN to the lot (9.25-9.95, heavy blur), then HELD on the lot: the white sedan rolls in from the left on the `car` cue (10.18), pulls into the Administrator's reserved bay, the driver's door
 *                      opens, Mr. Stateman steps out (his field-guide tag), and his shadow is a long five-pointed star across the asphalt; the door shuts on `carclose` (11.88).
 *   12.55-14.0 m1      CUT to the LOBBY, z 3.1: Mango at the desk sees the white car through the glass doors: "The State is in the lot." (Mangifera indica, CNA).
 *   14.15-18.6 l1 s1 l2 CUT to the STATION two-shot (z 2.0 drifting in): Lemon "Everyone act normal." (she stiffens), Strawberry "What's normal?", then a PUSH-IN on Lemon (z 3.1) for "What we do when someone's
 *                      watching." (Citrus limon / CHARGE NURSE, Fragaria per diem / NURSE UNSCHEDULED as lower thirds, one at a time).
 *   18.4-19.4 n4       PULL OUT to the whole building (z 1.0). The three at the station and Mango have slipped behind their counters. The `buzz` cues (19.43, 19.83, 20.18, 20.53, 20.88) are five phones in five
 *                      rooms: the room pulses yellow and the phone shakes, a SURVEY IN THE BUILDING bubble pops, the occupant reacts (the Administrator chokes on his pizza, Mr. Goji's ears shoot up, Mr. Banana nearly
 *                      falls, Mrs. Cranberry turns to the radio, the med fridge slams shut).
 *   21.89-23.2 meer    THE MEERKATS: on the squeaks (21.99, 22.01, 22.03) all four pop up above their counters at once, stiff, eyes left on the lobby; the stab (22.04) freezes every room. A slow push toward the ground floor.
 *   23.24-25.64 n5     The freeze breaks: the lamps flicker, everyone moves at once, the shower door strains further; the camera eases out to the whole building.
 *   25.8-26.84 end     WHIP to the right on the `sting` (25.89), the camera racing off the building toward the shower room of the next scene (motion blur at the top).
 *
 * LAYOUT: the building is at zoom 1 centred on (540, 960) (the clear band y 244 to 1380 holds the whole building: y 340 to 1342). Floor lines: top 656, middle 986, ground 1316.
 * Text: the kit's own (roof sign, plates, bubbles) and the field-guide tags here (UI.tag, hero, on the over() layer, always whole and clear of the pill and the captions). */
(() => {
if (!window.TIMELINE_EP14 || !window.S14 || !window.H6) return;
const { zoomTo, faceC } = window.H6;
const A6 = window.A6, A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A14 = window.A14;
const TLS = window.TIMELINE_EP14.scenes.find(s => s.id === 'colony'), BT = TLS.beats;
const bs = id => BT[id].s, be = id => BT[id].e;
const SS = S14.S;
const LINES = {}; for (const l of window.TIMELINE_EP14.lines) if (l.scene === 'colony') LINES[l.id] = l;
/* the scene-local time of a spoken word (line-local word times + the beat's start) */
const wordT = (id, w, fb) => { const l = LINES[id]; if (!l) return fb; const k = l.words.find(q => q[0].toLowerCase().replace(/[^a-z0-9]/g, '') === w); return k ? bs(id) + k[1] : fb; };
const sk = (t, a, b) => easeIO(seg(t, a, b));
const so = (t, a, b) => easeOut(seg(t, a, b));
const sb = (t, a, b) => easeBack(seg(t, a, b));
const hz = (t, f, ph = 0) => Math.sin(t * TAU * f + ph);

/* the sound cues of this scene, as offsets from their beats (the timeline is frozen: python3 /tmp/shift_tools/cues.py 14 colony) */
const CUE = {
  car: bs('n3') + .9, carclose: bs('n3') + 2.6,
  buzz: [bs('n4') + .55, bs('n4') + .95, bs('n4') + 1.3, bs('n4') + 1.65, bs('n4') + 2.0],
  creak: bs('n2') + 2.93,
  squeak: bs('meer') + .1, stab: bs('meer') + .15, sting: bs('end') + .1,
};
const FREEZE = CUE.squeak, RELEASE = bs('n5');
/* the clock of everything that freezes on the first squeak (the score is silent from 21.80 to 23.20): it stops dead at FREEZE and picks up where it left off at RELEASE (no jump) */
const ft = lt => lt - Math.max(0, Math.min(lt, RELEASE) - FREEZE);

// ------------------------------------------------------------------ the alarm chain: which room gets which phone
const BUZZ_ROOMS = ['office', 'r14', 'r4', 'r7', 'med'];
const BUZZ = CUE.buzz.map((t0, i) => ({ id: BUZZ_ROOMS[i], t0 }));
const BUBBLE_AT = { office: 'top', r14: 'top', r4: 'top', r7: 'above', med: 'above' };   /* the middle row's bubbles are wider than a room: r7 and med sit above their rooms so none of them touches another */
const BUBBLE_OUT = [21.42, 21.66];                           /* the bubbles leave just before the meerkats */
const buzzOf = id => (BUZZ.find(b => b.id === id) || {}).t0;

/* o.rooms for the kit at scene time lt */
function roomsAt(lt) {
  const R = {};
  for (const b of BUZZ) {
    const a1 = lt >= b.t0 && lt < b.t0 + .8 ? 1 - seg(lt, b.t0, b.t0 + .8) : 0, a2 = lt >= b.t0 + .36 && lt < b.t0 + .95 ? .55 * (1 - seg(lt, b.t0 + .36, b.t0 + .95)) : 0;
    const pop = seg(lt, b.t0, b.t0 + .26), out = 1 - seg(lt, BUBBLE_OUT[0], BUBBLE_OUT[1]);
    R[b.id] = { alert: Math.max(a1, a2), bubble: lt >= b.t0 && out > 0 ? { t: 'SURVEY IN THE BUILDING', k: Math.min(pop, out) >= 1 ? 1 : Math.min(pop, out), at: BUBBLE_AT[b.id] } : null };
  }
  const fl = lt >= RELEASE && lt < bs('n5') + 2.4 ? .5 : 0;
  for (const id of S14.ids) R[id] = Object.assign(R[id] || {}, { flicker: fl });
  /* the shower room: the stash is half full and the door already strains; on the creak (the word "Do") the pile shoves back: the leaf bows and shakes, the tape stretches, the sock is jolted out, the stash level steps up
   * (a rolled banner and the Q sign slide into view beside the door), dust shakes loose; it strains more again when the colony adapts */
  const cr = lt - CUE.creak, jolt = cr < 0 || cr > 1.4 ? 0 : (1 - Math.exp(-cr / .018)) * Math.exp(-cr / .3) * (1 + .3 * Math.sin(cr * 46));
  const bulge = .28 + .1 * sk(lt, 5, 7) + .24 * so(lt, CUE.creak, CUE.creak + .14) + .1 * sk(lt, 19, 21.9) + .35 * sk(lt, RELEASE, bs('n5') + 2.2);
  R.shower = Object.assign(R.shower || {}, { stash: 2.6 + .5 * so(lt, CUE.creak, CUE.creak + .12) + .6 * sk(lt, RELEASE + .2, bs('n5') + 2.0), bulge: Math.min(1, bulge), jolt: Math.max(0, Math.min(1, jolt)) });
  /* the station: a few call lights glow, one pulses; the Q sign says 41 */
  const calls = []; calls[5] = 1; calls[19] = .55; calls[26] = 1; calls[33] = .4;
  if (lt >= RELEASE) for (let i = 0; i < 40; i++) calls[i] = Math.max(calls[i] || 0, seg(lt, RELEASE + i * .03, RELEASE + i * .03 + .2) * (1 - seg(lt, RELEASE + 1.3 + i * .02, RELEASE + 1.6 + i * .02)));
  R.station = Object.assign(R.station || {}, { calls, qHours: 41 });
  /* the med room: the fridge door is ajar until the fifth buzz, and then it slams */
  const fr = lt < CUE.buzz[4] + .1 ? .55 + .05 * hz(lt, .4) : lerp(.55, 0, easeIn(seg(lt, CUE.buzz[4] + .1, CUE.buzz[4] + .2)));
  R.med = Object.assign(R.med || {}, { cart: 1, fridge: fr, pens: .25 });
  R.lobby = Object.assign(R.lobby || {}, { car: seg(lt, CUE.car + .6, CUE.car + 1.0) });
  return R;
}

// ================================================================================================ the cast
const RC = id => S14.rect(id);
const P = (ctor, x, y, extra) => ctor(Object.assign({ x, y, s: SS }, extra));
const LIME = A6 && A6.lime ? A6.lime : A7.apple;

/* Mr. Banana's walker (front view): a rail for the hands, four legs, tennis balls on the front feet. Drawn around his LEFT hand; the right hand grips 165 local units to the right (the same grips as the tracer's).
 * Copied in spirit from the tracer's own walker (fp14t_walker) so the two look alike; prefix fp14k_ keeps them apart. */
EXT.prop.fp14k_walker = (side, o, t) => {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const L = 0, R = 165, H = 146;
  for (const [x, dx, c] of [[L, -8, '#aab4c0'], [R, 8, '#aab4c0'], [L + 14, -3, '#7d8794'], [R - 14, 3, '#7d8794']]) { ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x + dx, H); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x + dx, H); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(L - 6, -2); ctx.lineTo(R + 6, -2); ctx.stroke(); ctx.strokeStyle = '#cfd6de'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(L - 6, -2); ctx.lineTo(R + 6, -2); ctx.stroke();
  ctx.strokeStyle = '#8f99a6'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(L + 6, 78); ctx.lineTo(R - 6, 78); ctx.stroke();
  for (const x of [L - 8, R + 8]) { ctx.fillStyle = '#d8e24a'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, H + 6, 12, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, H + 6, 8, -2.6, -1.2); ctx.stroke(); }
  ctx.restore();
};
Object.assign(PROP_BOX, { fp14k_walker: [-22, 66, 188, 170] });
/* a chart board, a pen and a slice of pizza held up near the face: the same drawings as the engine's and Episode 12's, registered nearFace so the gate knows they may cover the holder */
const near = (n, d) => Object.assign(PROP_BOX[n] && PROP_BOX[n].slice ? PROP_BOX[n].slice() : d, { nearFace: true });
EXT.prop.fp14k_chart = (side, o, t) => EXT.prop.clipboard6(side, o, t);
EXT.prop.fp14k_pen = (side, o, t) => drawProp('pen', 0, 0, side, o, t);
EXT.prop.fp14k_slice = (side, o, t) => (EXT.prop.slice12 || EXT.prop.slice10)(side, o, t);
PROP_BOX.fp14k_chart = near('clipboard6', [-46, -40, 46, 88]); PROP_BOX.fp14k_pen = near('pen', [-10, -46, 10, 8]); PROP_BOX.fp14k_slice = near('slice12', [-60, -100, 60, 12]);

/* ---- where the staff are, and how deep they sink behind their counters (a head is about 118 px above the floor line, the counter top is 52 px above it) */
const DIVE = 126;
const DIVE_AT = { lemon: 18.78, straw: 18.72, clem: 18.84, mango: 18.92 };
function dyOf(lt, who) {
  const d0 = DIVE_AT[who], pop = CUE.squeak;
  if (lt < d0) return 0;
  if (lt < pop - .07) return DIVE * easeIn(seg(lt, d0, d0 + .22));
  if (lt < pop) return DIVE + 10 * seg(lt, pop - .07, pop);                       /* the last crouch before the spring */
  if (lt < pop + .05) return lerp(DIVE + 10, -9, easeOut(seg(lt, pop, pop + .05)));   /* two frames up, on the first squeak */
  if (lt < pop + .17) return lerp(-9, 0, easeIO(seg(lt, pop + .05, pop + .17)));
  return 0;
}
const popK = lt => seg(lt, CUE.squeak, CUE.squeak + .05);          /* 0 before the pop, 1 once they are up */
const MEER = { arms: { l: [.42, 2.05], r: [.42, 2.05] }, hand: { l: 'fist', r: 'fist' } };  /* paws at the chest */

/* the Administrator at his desk, a slice in hand, one bite every 2.4 s; he chokes on the first buzz */
function melonO(lt) {
  const t = ft(lt), r = RC('office'), b1 = buzzOf('office'), ck = lt - b1, choke = ck >= 0 && ck < 1.7, s = SS * 1.22;
  const ph = (t * .42) % 1, up = sk(ph, 0, .1) * (1 - sk(ph, .2, .3)), gx = lerp(100, 40, up), gy = lerp(62, 26, up);
  let mouth = ph > .1 && ph < .18 ? .5 : ph > .18 && ph < .6 ? .15 * Math.abs(Math.sin(ph * 60)) : 0, expr = 'happy', look = [.1 * hz(t, .3), .25], shake = 0, sq = 0;
  if (choke) { expr = 'panic'; mouth = .9; shake = 6 * (1 - ck / 1.7); sq = .1 * Math.abs(Math.sin(ck * 18)) * (1 - ck / 1.7); look = [0, -.3]; }
  const post = lt >= RELEASE;                                                    /* the colony adapts: he flaps his arms and hides the slice */
  const fl = post ? lt - RELEASE : 0;
  return P(A9.melon, r.x0 + 150 + (post ? 3 * hz(fl, 7) : 0), r.floor - 42, { s, noLegs: true, noShadow: true, t, expr: post ? 'panic' : expr, look, lid: choke ? 0 : .12, mouthOpen: post ? .5 : mouth, shake: post ? 4 : shake, squash: sq, plant: true,
    arms: post ? { l: 'flail', r: 'flail' } : { l: 'rest', r: 'hold' }, hold: post ? {} : { r: 'fp14k_slice' }, grip: { r: [gx, gy] }, rot: post ? .05 * hz(fl, 5) : .012 * hz(t, .4) });
}
/* Mr. Goji in his bed, staring at the empty pitcher; his ears shoot up on the second buzz */
function gojiO(lt) {
  const t = ft(lt), r = RC('r14'), b = buzzOf('r14'), k = lt >= b ? seg(lt, b, b + .12) * (1 - seg(lt, b + .9, b + 1.3)) : 0, post = lt >= RELEASE, fl = lt - RELEASE;
  const stare = [-.92 + .05 * hz(t, .17), .55], tilt = -.035 * hz(t, .11) - .02;
  return P(A7.goji, r.x0 + 168, r.floor - 58, { t, noLegs: true, noShadow: true, expr: k > .4 ? 'shock' : 'neutral', look: k > .4 ? [0, 0] : stare, lid: k > .4 ? 0 : .22, rot: tilt + (k > .4 ? .05 : 0), browUp: 10 * k, squash: -.05 * k, plant: true, arms: { l: 'rest', r: 'rest' }, sway: post ? .08 * hz(fl, 3) : 0 });
}
/* Mr. Banana shuffles back and forth on his walker; on the third buzz he nearly goes over */
const BANANA_U = t => lerp(.42, .74, .5 - .5 * Math.cos(t * TAU / 9));
const bananaPath = lt => { const r = RC('r4'); return [r.x0 + BANANA_U(ft(lt)) * r.w, r.floor]; };
function bananaO(lt) {
  const b = buzzOf('r4'), ck = lt - b, wob = ck >= 0 && ck < 1.1 ? Math.exp(-ck * 3.2) * Math.sin(ck * 17) : 0, post = lt >= RELEASE, fl = lt - RELEASE;
  const o = S14.walk(A7.banana, post ? (l => { const r = RC('r4'); return [r.x0 + (.74 - .3 * (.5 - .5 * Math.cos(l * 4.2))) * r.w, r.floor]; }) : bananaPath, post ? fl : lt, {
    t: ft(lt), look: [.2 * hz(lt, .25), .35], expr: ck >= 0 && ck < .9 ? 'panic' : 'happy', arms: { l: 'hold', r: 'hold' }, grip: { l: [-70, 70], r: [95, 70] }, hold: { l: 'fp14k_walker' }, hand: { l: 'grip', r: 'grip' },
    rot: .3 * wob, lift: 7 * Math.max(0, wob) * Math.max(0, wob), plant: true, face: { curve: .5 } });
  return o;
}
/* Mrs. Cranberry rocks in her armchair; on the fourth buzz she turns toward the radio */
function cranO(lt) {
  const t = ft(lt), r = RC('r7'), b = buzzOf('r7'), k = lt >= b ? seg(lt, b, b + .2) * (1 - seg(lt, b + 1.5, b + 2.0)) : 0, post = lt >= RELEASE, fl = lt - RELEASE;
  return P(A7.cran, r.x0 + 80, r.floor - 50, { t, noLegs: true, noShadow: true, expr: k > .3 ? 'hopeful' : 'happy', look: k > .3 ? [1, .1] : [.15 * hz(t, .2), .1], rot: .05 * hz(t, .55) + (k > .3 ? .07 : 0) + (post ? .06 * hz(fl, 2.4) : 0), plant: true, arms: { l: 'rest', r: 'rest' }, browUp: 8 * k });
}
/* the two diners */
function dinerO(which, lt) {
  const t = ft(lt), r = RC('dining'), u = which === 'pear' ? .2 : .6, ctor = which === 'pear' ? A7.pear : LIME, up = sk((t * .3 + (which === 'pear' ? .2 : .7)) % 1, 0, .2) * (1 - sk((t * .3 + (which === 'pear' ? .2 : .7)) % 1, .4, .6));
  return P(ctor, r.x0 + u * r.w + (which === 'pear' ? 0 : 8), r.floor - 44, { t, noLegs: true, noShadow: true, expr: 'happy', look: [.1 * hz(t, .2, which === 'pear' ? 0 : 2), .5], lid: .2, rot: .02 * hz(t, .3, which === 'pear' ? 0 : 1) - .02 * up, arms: { l: 'rest', r: 'rest' }, plant: true, flip: which === 'lime' });
}

/* Mango at the lobby desk: she watches the glass doors, tells us "The State is in the lot." (and points), ducks behind the desk, and pops up with the rest */
function mangoO(lt) {
  const t = ft(lt), r = RC('lobby'), dy = dyOf(lt, 'mango'), pk = popK(lt), m1 = bs('m1'), lot = wordT('m1', 'lot', m1 + 1.06), state = wordT('m1', 'state', m1 + .2);
  const talk = lt >= m1 && lt < be('m1'), pt = sk(lt, lot - .22, lot - .02) * (1 - sk(lt, lot + .5, lot + .8));
  let look = [-.85 + .1 * hz(t, .3), .05], expr = 'neutral';
  if (talk) { look = [-1, .05]; expr = lt < state + .1 ? 'shock' : 'neutral'; }
  const o = P(A7.mango, r.x0 + .72 * r.w, r.floor + dy, { t, who: 'mango', expr, look, lid: .05, arms: pt > 0 ? { l: [lerp(.28, 1.55, pt), lerp(.25, .1, pt)], r: 'rest' } : { l: 'rest', r: 'rest' }, hand: { l: pt > 0 ? 'point' : 'open' }, rot: -.012 * hz(t, .5) - .03 * (talk ? sk(lt, m1, m1 + .2) : 0), plant: true });
  if (lt >= CUE.squeak && lt < RELEASE) Object.assign(o, MEER, { expr: 'neutral', eyeScale: 1.3, look: [-1, 0], lid: 0, sy: 1.04, rot: 0 });
  if (lt >= RELEASE) { const fl = lt - RELEASE; o.expr = 'panic'; o.arms = { l: 'run', r: 'run' }; o.look = [1, 0]; o.rot = .05 * hz(fl, 6); }
  return o;
}
/* the station: Lemon on hold, Strawberry charting, Clementine nodding at nothing */
const ST_U = { lemon: .20, straw: .40, clem: .60 };
function lemonO(lt) {
  const t = ft(lt), r = RC('station'), dy = dyOf(lt, 'lemon'), l1 = bs('l1'), l2 = bs('l2'), stiff = sk(lt, l1 - .05, l1 + .35) * (1 - sk(lt, bs('n4') - .6, bs('n4') - .1)), tap = Math.max(0, hz(t, 1.4));
  const o = P(A7.lemon, r.x0 + ST_U.lemon * r.w, r.floor + dy, { t, who: 'lemon', expr: lt >= l1 ? 'neutral' : 'sour', look: lt < l1 ? [-.2 + .1 * hz(t, .3), .3] : lt < l1 + .5 ? [-.9, .1] : [-.5 + .08 * hz(t, .4), .08], lid: lt < l1 ? .38 : .18,
    arms: lt < l1 + .15 ? { l: 'rest', r: 'phone' } : { l: 'rest', r: 'rest' }, hold: lt < l1 + .15 ? { r: 'handset' } : {}, sy: 1 + .045 * stiff, rot: .02 * hz(t, .3) * (1 - stiff), plant: true, lift: 0 });
  if (lt >= CUE.squeak && lt < RELEASE) Object.assign(o, MEER, { expr: 'neutral', eyeScale: 1.3, look: [-1, 0], lid: 0, sy: 1.05, rot: 0 });
  if (lt >= RELEASE) { const fl = lt - RELEASE; o.x -= 70 * sk(fl, 0, .5) * (1 - sk(fl, 1.0, 1.6)); o.expr = 'panic'; o.arms = { l: 'flail', r: 'flail' }; o.rot = .06 * hz(fl, 5); }
  return o;
}
function strawO(lt) {
  const t = ft(lt), r = RC('station'), dy = dyOf(lt, 'straw'), s1 = bs('s1'), w = lt < bs('n4') ? 1 : 0;
  const o = P(A11.straw, r.x0 + ST_U.straw * r.w, r.floor + dy, { t, who: 'straw', expr: lt >= s1 && lt < be('s1') + .3 ? 'dead' : 'chill', look: lt >= s1 - .6 && lt < be('s1') + .2 ? [-.9, .1] : [.1 + .1 * hz(t, .3), .6], lid: lt >= s1 ? .5 : .35,
    arms: { l: 'hold', r: 'hold' }, grip: { l: [-34, 38], r: [26 + 5 * hz(t, 1.7) * w, 46 + 3 * hz(t, 2.3) * w] }, hold: { l: 'fp14k_chart', r: 'fp14k_pen' }, clipText: 'CHART', rot: .015 * hz(t, .4), plant: true });
  if (lt >= CUE.squeak && lt < RELEASE) { Object.assign(o, MEER, { expr: 'neutral', eyeScale: 1.3, look: [-1, 0], lid: 0, sy: 1.05, rot: 0, hold: {}, grip: {} }); }
  if (lt >= RELEASE) { const fl = lt - RELEASE; o.x += 60 * sk(fl, 0, .5) * (1 - sk(fl, 1.0, 1.6)); o.expr = 'panic'; o.arms = { l: 'flail', r: 'flail' }; o.hold = {}; o.grip = {}; o.rot = -.06 * hz(fl, 5.5); }
  return o;
}
function clemO(lt) {
  const t = ft(lt), r = RC('station'), dy = dyOf(lt, 'clem');
  const o = P(A10.clem, r.x0 + ST_U.clem * r.w, r.floor + dy, { t, expr: 'hopeful', look: [.6 * hz(t, .13), .1 * hz(t, .21)], lid: .1, rot: .055 * hz(t, 1.6), sy: 1 + .015 * hz(t, 1.6), arms: { l: 'rest', r: 'rest' }, plant: true });
  if (lt >= CUE.squeak && lt < RELEASE) Object.assign(o, MEER, { expr: 'neutral', eyeScale: 1.3, look: [-1, 0], lid: 0, sy: 1.04, rot: 0 });
  if (lt >= RELEASE) { const fl = lt - RELEASE; o.x += 120 * sk(fl, 0, .6) * (1 - sk(fl, 1.1, 1.8)); o.expr = 'panic'; o.arms = { l: 'cheer', r: 'cheer' }; o.rot = .07 * hz(fl, 6); o.lift = 8 * Math.abs(hz(fl, 3)); }
  return o;
}
/* a character that may be sunk behind a counter: skipped when hidden, clipped at the counter's foot while it sinks */
function drawBehind(o, roomId, hideAt) {
  const dy = o.y - RC(roomId).floor;
  if (dy >= hideAt) return;
  const r = RC(roomId);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x0 - 60, r.y0 - 200, r.w + 120, (roomId === 'lobby' ? 289 : 311) + 200); ctx.clip();
  drawChar(o); ctx.restore();
}

// ================================================================================================ the camera: keyframes [t, x, y, z, ease of the segment that ENDS here]; 'cut' holds the previous key and jumps at this time
const KF = [
  [0.00, 540, -560, 1.0],
  [1.50, 540, 950, 1.0, 'io'],            /* crane down from the sky to the whole building (the roof sign stays just under the clock pill) */
  [6.70, 540, 905, 1.05, 'lin'],          /* a creeping push while the colony goes about its day, the sign still clear of the pill */
  [8.30, 933, 888, 3.05, 'io'],           /* push in on the shower room */
  [9.25, 933, 888, 3.12, 'lin'],          /* held, drifting in a hair */
  [9.95, 300, 1500, 1.5, 'io'],           /* whip down to the lot */
  [12.50, 330, 1490, 1.6, 'lin'],         /* the lot, drifting in */
  [12.552, 150, 1270, 3.1, 'cut'],        /* CUT: the lobby, Mango at the glass */
  [14.10, 156, 1262, 3.3, 'lin'],
  [14.15, 488, 1206, 2.0, 'cut'],         /* CUT: the station two-shot */
  [16.60, 480, 1204, 2.3, 'lin'],
  [18.45, 450, 1206, 2.6, 'io'],          /* push in on Lemon for "What we do when someone's watching." */
  [19.40, 540, 950, 1.0, 'io'],           /* pull out to the whole building */
  [21.90, 546, 944, 1.02, 'lin'],         /* held wide for the buzzes and the spring */
  [23.20, 552, 1080, 1.10, 'io'],         /* a slow push toward the frozen ground floor, every head of the colony still whole in the frame */
  [25.70, 540, 955, 0.98, 'io'],          /* the colony adapts: out to the whole building again */
  [26.84, 3400, 880, 1.2, 'in'],          /* WHIP right on the sting, off the building */
];
const CUT_T = [12.552, 14.15];
const EASE = { io: easeIO, out: easeOut, in: easeIn, lin: u => u, cut: u => (u >= 1 ? 1 : 0) };
function camAt(lt) {
  if (lt <= KF[0][0]) return { x: KF[0][1], y: KF[0][2], z: KF[0][3] };
  for (let i = 1; i < KF.length; i++) if (lt < KF[i][0]) { const a = KF[i - 1], b = KF[i], u = EASE[b[4] || 'io'](seg(lt, a[0], b[0])); return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u) }; }
  const l = KF[KF.length - 1]; return { x: l[1], y: l[2], z: l[3] };
}
const toScreen = (lt, x, y) => { const c = camAt(lt); return [W / 2 + (x - c.x) * c.z, H / 2 + (y - c.y) * c.z]; };

// ------------------------------------------------------------------ the State's car, Mr. Stateman and his shadow
function carAt(lt) {
  const x = lerp(-300, 225, easeOut(seg(lt, CUE.car - .25, CUE.car + 1.2))), k = easeIO(seg(lt, CUE.car + .6, CUE.car + 1.25));
  const open = sk(lt, CUE.car + 1.15, CUE.car + 1.4), shut = easeIn(seg(lt, CUE.carclose - .17, CUE.carclose)), door = .92 * open * (1 - shut);
  return { x, k, door };
}
const STATE_T0 = CUE.car + 1.3;
function statemanPath(lt) {
  const g = S14.carGeom({ x: 225, k: 1 }), u = sk(lt, STATE_T0, STATE_T0 + .8);
  return [lerp(g.x + 40, g.x - 78, u), g.exit[1]];
}
function statemanO(lt) {
  if (lt < STATE_T0 - .02 || lt >= CUT_T[0]) return null;   /* he is only in the lot shot: afterwards the camera is elsewhere and his head would sit under the captions */
  const done = lt > STATE_T0 + .85, brow = sk(lt, STATE_T0 + .95, STATE_T0 + 1.2);
  return S14.walk(A14.stateman, statemanPath, lt, { t: lt, expr: done && brow > .5 ? 'stateman_brow' : 'neutral', look: done ? [-.4, -.2] : [-.8, .1], alpha: clamp(seg(lt, STATE_T0 - .02, STATE_T0 + .1)) });
}
/* his long shadow: a five-pointed star lying on the asphalt, thrown away from the low sun, with the thin shadows of his legs leading to it */
function starShadow(lt) {
  const k = sk(lt, STATE_T0 + .1, STATE_T0 + .95); if (k <= 0) return;
  const [fx, fy] = statemanPath(lt);
  ctx.save(); ctx.translate(fx, fy + 3);
  ctx.shadowColor = 'rgba(16,20,44,.5)'; ctx.shadowBlur = 6; ctx.fillStyle = 'rgba(16,20,44,.5)';
  for (const dx of [-7, 7]) { ctx.beginPath(); ctx.moveTo(dx - 3, 0); ctx.lineTo(dx + 3, 0); ctx.lineTo(120 * k, 22 * k + dx * .3); ctx.lineTo(120 * k, 14 * k + dx * .3); ctx.closePath(); ctx.fill(); }
  ctx.translate(300 * k, 30 * k); ctx.scale(1, .4);
  ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = PI + i * PI / 5, R = i % 2 ? 66 : 150 * k + 20; i ? ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R) : ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R); } ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ the field-guide tags (screen space): one at a time
function pillTag(lines, cx, cy, t0, t1, lt, o = {}) {
  const k = clamp((lt - t0) / .24), out = clamp((t1 - lt) / .18);
  if (lt < t0 || lt > t1) return null;
  const a = Math.min(k, out), pop = k >= 1 ? 1 : easeBack(k), hero = k >= 1 && out >= 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
  const r = UI.tag(lines, cx, cy, Object.assign({ fill: '#f7ecc8', stroke: '#1f3a28', lw: 5, ink: '#1f3a28', size: 34, hero, crop: !hero, alpha: a, holeFill: '#1f3a28', shadow: 20 }, o));
  ctx.restore();
  return r;
}
function leader(lt, tag, wx, wy, a = 1) {
  if (!tag) return;
  const [sx, sy] = toScreen(lt, wx, wy), x0 = tag.cx, y0 = sy < tag.cy ? tag.y0 : tag.y1;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#f2e8cf'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(sx, sy); ctx.stroke(); ctx.strokeStyle = '#24402e'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = '#f2e8cf'; ctx.strokeStyle = '#24402e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
}
function drawTags(lt) {
  /* the census, in the sky: RESIDENTS 40, STAFF 4, SHOWER ROOMS 1, each on its word */
  const cen = [[wordT('n2', 'forty', 5.02), 'RESIDENTS', '40'], [wordT('n2', 'four', 6.05), 'STAFF', '4'], [wordT('n2', 'one', 6.85), 'SHOWER ROOMS', '1']];
  cen.forEach(([t0, a, b], i) => { const t1 = i < 2 ? cen[i + 1][0] + .05 : wordT('n2', 'open', 8.3) + .25; pillTag([{ t: a, size: 34, weight: 900, spacing: 2 }, { t: b, size: 84, font: 'Bangers', fill: '#c23a2b' }], 540, 520, t0, t1, lt, { size: 34, w: 400 }); });
  /* the specimens: one at a time, each with a leader to the animal */
  const T = { star: [CUE.car + 1.45, 12.5], mango: [bs('m1') + .12, be('m1') - .02], lemon: [bs('l1') + .05, be('l1') + .0], straw: [bs('s1') - .05, be('s1') + .45] };
  let tg = pillTag([{ t: 'Averrhoa carambola', size: 32, italic: true, weight: 800 }, { t: 'STATE SURVEYOR', size: 34, weight: 900, spacing: 1 }], 300, 1196, T.star[0], T.star[1], lt, { size: 34 });
  if (tg) { const [sx, sy] = statemanPath(lt); leader(lt, tg, sx, sy - 70, 1); }
  tg = pillTag([{ t: 'Mangifera indica', size: 32, italic: true, weight: 800 }, { t: 'CNA', size: 38, weight: 900, spacing: 2 }], 330, 470, T.mango[0], T.mango[1], lt, { size: 34 });
  if (tg) leader(lt, tg, RC('lobby').x0 + .72 * RC('lobby').w, RC('lobby').floor - 125);
  tg = pillTag([{ t: 'Citrus limon', size: 32, italic: true, weight: 800 }, { t: 'CHARGE NURSE', size: 34, weight: 900, spacing: 1 }], 300, 560, T.lemon[0], T.lemon[1], lt, { size: 34 });
  if (tg) leader(lt, tg, RC('station').x0 + ST_U.lemon * RC('station').w, RC('station').floor - 135);
  tg = pillTag([{ t: 'Fragaria per diem', size: 32, italic: true, weight: 800 }, { t: 'NURSE  UNSCHEDULED', size: 32, weight: 900, spacing: 1 }], 520, 560, T.straw[0], T.straw[1], lt, { size: 34 });
  if (tg) leader(lt, tg, RC('station').x0 + ST_U.straw * RC('station').w, RC('station').floor - 135);
}


// ------------------------------------------------------------------ a character is complete or out of the shot: its head fades out before any part of it reaches the frame edge, the clock pill or the caption zone;
// while the camera moves fast (a whip, a crane, a cut) the gate lets a cast pass through the edge, so nobody pops then. The fade is about a fifth of a second wide at the speed the head crosses the border.
function headBoxWorld(o) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), cy = o.y - (o.lift || 0) - (legLen + k.ry * .9) * s;
  const hw = k.rx * .98 * s;
  return [o.x - hw, cy - headTop(o, k) * s, o.x + hw, cy + (k.mouthY + 52) * s];
}
function camSpeed(lt) {
  for (const c of CUT_T) if (Math.abs(lt - c) < .05) return 0;
  const a = camAt(lt - .02), b = camAt(lt + .02);
  return (Math.hypot(b.x - a.x, b.y - a.y) * (a.z + b.z) / 2 + Math.abs(b.z - a.z) * 700) / .04;
}
/* the screen box of a world box */
function scrBox(c, B) { return [W / 2 + (B[0] - c.x) * c.z, H / 2 + (B[1] - c.y) * c.z, W / 2 + (B[2] - c.x) * c.z, H / 2 + (B[3] - c.y) * c.z]; }
/* the margin (px) by which the head of o is whole and clear of the frame edge, the caption zone and the clock pill at lt: negative when it is cut, covered or under the pill */
function headMargin(o, lt) {
  const c = camAt(lt), [x0, y0, x1, y1] = scrBox(c, headBoxWorld(o));
  let m = Math.min(x0 - 8, W - 8 - x1, y0 - 8, 1366 - y1);
  const px = Math.max(48 - x1, x0 - 500, 0), py = Math.max(116 - y1, y0 - 244, 0);       /* the clock pill is [48, 116, 500, 244] */
  return Math.min(m, px > 0 || py > 0 ? Math.hypot(px, py) - 12 : -1);
}
/* the shot (between hard cuts) that lt belongs to */
function shotRange(lt) { let a = -1e9, b = 1e9; for (const c of CUT_T) { if (c <= lt + 1e-6) a = Math.max(a, c); else b = Math.min(b, c); } return [a, b]; }
/* 0..1: 1 while the head is whole and clear of those borders now and for a quarter of a second either way inside the same shot; otherwise it fades with the time to the nearest moment it is not, so a
 * cast member never pops and never lingers half-visible (a ghost lasts a quarter of a second at most, whatever the camera does) */
function headVis(mk, o, lt) {
  if (headMargin(o, lt) < 0) return 0;
  const [s0, s1] = shotRange(lt); let dmin = 1e9;
  for (let i = 1; i <= 5 && dmin > i * .05; i++) for (const sg of [-1, 1]) {
    const tt = lt + sg * i * .05; if (tt < s0 || tt >= s1) continue;
    const q = mk(tt); if (q && headMargin(q, tt) < 0) { dmin = i * .05; break; }
  }
  const u = clamp(dmin / .25); return dmin >= 1e9 ? 1 : u * u * (3 - 2 * u);
}
const TEXT_ACC = new Set(['perdiem9', 'nametag9', 'nametag', 'pricetag', 'badge7', 'badge', 'unionpin7']);   /* the accessories that carry lettering */
/* a body that reaches the caption zone or the pill carries its lettering (badge, name tag, chart) with it; those are engine-drawn, so they are simply left off while the body is there */
function stripLetters(o, lt) {
  const c = camAt(lt), B = headBoxWorld(o), k = KINDS[o.kind], s = o.s || 1;
  const [x0, y0, x1, y1] = scrBox(c, [o.x - k.rx * 1.25 * s, B[1], o.x + k.rx * 1.25 * s, o.y + 6]);
  const inCap = y1 > 1374 && y0 < 1706, inPill = x1 > 44 && x0 < 506 && y1 > 110 && y0 < 250, edge = x0 < 44 || y0 < 44 || x1 > W - 44;
  if (!(inCap || inPill || edge)) return o;
  if (o.acc) o.acc = o.acc.filter(a => !TEXT_ACC.has(a));
  if (o.tag) o.tag = ''; if (o.clipText) o.clipText = '';
  return o;
}
/* a character that sinks behind a counter is judged at its standing height (the counter hides it, the frame does not); everyone else where they are */
const stand = (q, room) => (room && q && q.y > RC(room).floor ? Object.assign({}, q, { y: RC(room).floor }) : q);
function placeChar(o, lt, mk, room) {
  const a = headVis(tt => stand(mk(tt), room), stand(o, room), lt);
  if (a <= .01) return null;
  o.alpha = (o.alpha ?? 1) * a;
  return stripLetters(o, lt);
}
/* the cast: [name, builder, room whose counter hides it while it sinks] */
const CAST = [['melon', melonO], ['goji', gojiO], ['banana', bananaO], ['cran', cranO], ['pear', lt => dinerO('pear', lt)], ['lime', lt => dinerO('lime', lt)],
  ['lemon', lemonO, 'station'], ['straw', strawO, 'station'], ['clem', clemO, 'station'], ['mango', mangoO, 'lobby'], ['state', statemanO]];
function putCast(lt) {
  for (const [, mk, room] of CAST) {
    const o = mk(lt); if (!o) continue;
    if (!room) { const p = placeChar(o, lt, mk, null); if (p) drawChar(p); continue; }
    const r = RC(room);
    if (o.y - r.floor >= DIVE - 2) continue;
    const p = placeChar(o, lt, mk, room); if (!p) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(r.x0 - 60, r.y0 - 200, r.w + 120, (room === 'lobby' ? 289 : 311) + 200); ctx.clip();
    drawChar(p); ctx.restore();
  }
}

// ------------------------------------------------------------------ the scene
const CUTS_SHOT = [['open', 0], ['n1', 1.5], ['n2', 5.0], ['n3', 9.25], ['m1', 12.552], ['station', 14.15], ['n4', 18.45], ['meer', 21.9], ['n5', 23.24], ['end', 25.8]];
const SC = {
  shot(lt) { let id = 'open'; for (const [n, t] of CUTS_SHOT) if (lt >= t) id = n; return id; },
  cam(lt) {
    const c = camAt(lt); zoomTo(c.x, c.y, c.z);
    const slam = lt >= CUE.carclose && lt < CUE.carclose + .22 ? 5 * (1 - (lt - CUE.carclose) / .22) : 0, thump = lt >= CUE.stab && lt < CUE.stab + .3 ? 9 * (1 - (lt - CUE.stab) / .3) : 0, creak = lt >= CUE.creak && lt < CUE.creak + .22 ? 2.6 * (1 - (lt - CUE.creak) / .22) : 0;
    CAM.shake = Math.max(slam, thump, creak);
  },
  draw(lt) {
    const rs = roomsAt(lt), car = carAt(lt);
    V2.setLight({ key: [-.55, -.72], keyColor: '#ffe3ac', keyA: .26, rim: '#9fc4ff', rimA: .38, shadow: '#1a1030', shadowA: .3, bounce: '#ffd9a0', bounceA: .16 });
    for (const id of S14.ids) if (rs[id] && rs[id].alert > .02) { const r = RC(id); V2.addLight({ x: r.cx, y: r.cy, r: 330, color: '255,226,70', a: .5 * rs[id].alert }); }
    S14.back(lt, { t: ft(lt), rooms: rs, car, carDoor: car.door, carLeaf: 'front' });
    if (lt < 3.4 && A7 && A7.birds) A7.birds(lt, -820, -160, { n: 7, seed: 21, speed: 64, size: 1.7 });
    starShadow(lt);
    /* the colony, room by room */
    putCast(lt);
    S14.front(lt, { t: ft(lt), rooms: rs, car, carDoor: car.door, carLeaf: 'front' });
  },
  fx(lt) {
    const stab = lt >= CUE.stab && lt < CUE.stab + .5 ? 1 - seg(lt, CUE.stab, CUE.stab + .5) : 0, frozen = lt >= FREEZE && lt < RELEASE, sting = lt >= CUE.sting ? seg(lt, CUE.sting, 26.8) : 0;
    const tint = [['#ffb464', .1, 'soft-light']]; if (lt < 2.2) tint.push(['#ffd890', .22 * (1 - seg(lt, 0, 2.2)), 'screen']);
    return { bloom: .5 + .2 * stab, vignette: .4, grain: .045, contrast: .13, sat: .12 - (frozen ? .05 : 0), tint, aberr: 1.8 * stab + 3.2 * sting, fade: Math.max(1 - seg(lt, 0, .4), .35 * stab * stab), fadeColor: lt < 1 ? '255,240,206' : '255,255,255' };
  },
  blur(lt) {
    for (const c of CUT_T) if (Math.abs(lt - c) < .04) return 1;
    const a = camAt(lt - .017), b = camAt(lt + .017), sp = (Math.hypot(b.x - a.x, b.y - a.y) * (a.z + b.z) / 2 + Math.abs(b.z - a.z) * 700) / .034;
    return clamp(Math.round(1 + sp / 450), 1, 9);
  },
  over(lt) { drawTags(lt); },
};
SC.__vis = lt => CAST.map(([id, mk, room]) => { const o = mk(lt); if (!o) return [id, 0, 0]; return [id, +headVis(tt => stand(mk(tt), room), stand(o, room), lt).toFixed(2), 0]; });
SC.__acc = lt => CAST.map(([id, mk]) => { const o = mk(lt); return [id, o ? { acc: o.acc, tag: o.tag, clipText: o.clipText, hold: o.hold } : null]; });
SC.__heads = lt => CAST.map(([id, mk]) => { const o = mk(lt); return [id, o ? headBoxWorld(o).map(Math.round) : null]; });
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.colony = SC;
})();
