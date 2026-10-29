'use strict';
/* SHIFT HAPPENS, Episode 13: The Float Pool. Scene module E13-A (2 of 2): the scene `crew` (17.0 s, registered on window.__EP13_SCENES.crew).
 * Six heist-movie crew cards, ONE layout function for all six (the data is CARDS, the card comes out). Every card is a hard cut on the narrator's first word (u = 0 at the start of the narrator line,
 * freezesnap +0.0 and cardslam +0.02): the character is caught FROZEN mid-action with a thick white die-cut sticker outline; at the character's own quip they UNFREEZE and act the line; the card stays.
 *   shot list, scene-local seconds:
 *   0.00-0.25  hologram remnants: nine cyan scanlines collapsing on dark (the plan from the briefing going out).
 *   0.25-0.95  open: record scratch (cue 0.05) and a camera-roll wobble, then the six silhouettes slammed up on their colour blocks, 0.1 s each, hard cuts at blur 1 (Lemon .30, Strawberry .40, Mango .50,
 *              Clementine .60, Banana .70, Moon .80), a white shutter flash at .55 (freezesnap .35). Black from .90 to the first freeze.
 *   card k = narrator line start: n1 .95 Brains (Lemon, quip l1 1.96) | n2 3.97 Ghost (Strawberry, s1 4.92) | n3 5.96 Talker (Mango, m1 6.95) | n4 9.05 Muscle (Clementine, c1 10.00) |
 *              n5 10.62 Distraction (Mr. Banana, b1 11.78) | n6 12.65 Eye in the Sky (the Moon, mo1 14.33). The times are read from the timeline (B('nN').s), not typed.
 *     u = 0          full white flash frame, the previous card is gone (nothing lingers under the next one).
 *     u .034-.14     the hex shutter iris opens (R 300 -> 1350 px, turning) while the flash falls .6 -> .25 -> 0 (flash frames are 1, .6, .25 of white).
 *     u 0-.07        the codename stamp (UI.stamp on a dark tag) slams from 1.5x to 1.0 on the cardslam cue, rings (7% overshoot), camera shake 11 px on the hit.
 *     u .16-.42      the big name rises with an overshoot (Bangers 156).   u .34-.64  the rap-sheet line is typed in (gold prefix, then the charge).
 *     u .44-1.3      three stat rows slide in 0.11 s apart and fill (the counters count up; Banana INCIDENTS reads 46 and turns into 47 at his quip + .25).
 *     frozen         the figure is held in a strong pose: Lemon mid-stride, finger up (eureka), the plan on a clipboard; Strawberry on tiptoe, finger to her lips, side-eye, a ghost trail behind her
 *                    (she is hard to see); Mango arms wide, mid-sentence, speech bubbles; Clementine mid-jump in a double-biceps flex, sweating; Banana mid-slip with a peel; the Moon smug in a porthole
 *                    under a targeting reticle that follows his eyes. Viewfinder corner brackets, slow push 1.0 -> 1.018 across the card.
 *     quip start q   UNFREEZE: a tiny flash (.4 / .18), an expanding ring, a squash pop, then the body acts the line (jabs on the stressed words, a thumbs-up hop, a landing squash) and the mouth moves.
 *   16.16-16.55  end beat: the iris closes to dark (R 1350 -> 0, turning); black until the scene ends at 17.0.
 * Layout (the same numbers for every card; 8 px grid; centred on x 540; everything between y 130 and 1370, above the caption zone): ground line y 948 (colour block above, dark base below), the figure
 *   570-610 px tall on x 540; stamp cy 196 (Bangers 80 on a tag padded 40 px each side); name cy 1044 (Bangers 156, max width 940); rap line cy 1140 (Nunito 900 34, shrunk to 940 px if longer);
 *   three stat rows at y 1184 / 1240 / 1296, each 50 px high, x 64..1016 (label 292 | bar 470 | value 190, right aligned). No card text is tilted. Blur is 1 on every cut and unfreeze frame, 2 elsewhere.
 * All text is drawn live through the UI kit (UI.stamp, UI.label, UI.write, UI.table, UI.panel). The caches hold flat art without text (colour blocks, sticker outlines, ghost silhouettes).
 */
(() => {
if (!window.TIMELINE_EP13) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A10 = window.A10, A11 = window.A11;
const E = window.E13A || {};   /* helpers from ep13_title.js (loaded first); the fallbacks below keep this module working on its own */
window.__EP13_SCENES = window.__EP13_SCENES || {};

const CYAN = '#4de3ff', ALARM = '#ff3b4e', GOLD = '#ffc83d', INKC = '#15111a', BASE = '#130e27';
const ring = (lt, t0, tau) => lt < t0 ? 0 : Math.exp(-(lt - t0) / tau);
const hexMix = (a, b, k) => '#' + V2.mix(a, b, k).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mkCv = (w, h) => { const c = V2.mk(w, h); c.__txOK = true; return c; };
function intoCv(cv, fn) {
  const prev = ctx, g = cv.getContext('2d');
  ctx = g; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  try { fn(g); } finally { g.restore(); ctx = prev; }
}
if (!E.charTo) E.charTo = (cv, ox, oy, o) => intoCv(cv, g => {
  REG.suppress++;
  try { g.translate(ox, oy); drawChar(Object.assign({}, o, { x: 0, y: 0, noShadow: true, noReflect: true, transit: false })); } finally { REG.suppress--; }
});
if (!E.flatten) E.flatten = (cv, color) => intoCv(cv, g => { g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, cv.width, cv.height); });
/* run fn about a pivot: scale (sx, sy), shift dy, faded by a */
function popAbout(cx, cy, sx, sy, dy, a, fn) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy + dy); ctx.scale(sx, sy); ctx.translate(-cx, -cy); fn(); ctx.restore(); }
const bump = x => x < 0 ? 0 : (Math.exp(-x / .13) - Math.exp(-x / .035)) * 1.9;   /* a quick jab: up fast, back slower, peak ~1 */

// ------------------------------------------------------------------ the layout of a card: one set of numbers for all six (an 8 px grid, centred on x 540, everything inside y 130 to 1370)
const FLOOR = 948;                 // the ground line: colour block above, dark base below
const FOCUS = [540, 560];          // where the speed lines point
const L = {
  stamp: { cy: 196, size: 80 },
  name: { cy: 1044, size: 156 },
  rap: { cy: 1140, size: 34 },
  bars: { y: 1184, rowH: 50, gap: 6, x: 64, w: 952 },
};

// ------------------------------------------------------------------ the six cards: data in, card out
const CARDS = [
  { id: 'lemon', ctor: A7.lemon, codename: 'THE BRAINS', name: 'LEMON', n: 'n1', q: 'l1', figH: 590, ink: INKC,
    col: { sky: '#ffd60a', sky2: '#f0a400', dots: 'rgba(170,90,0,.34)', accent: '#ffd60a', hi: '#fff4b0' },
    rap: ['PRIORS', 'LAMINATED THE CONTINGENCY PLAN'], stats: [['PLANNING', 99, '99'], ['PATIENCE', 4, '4'], ['COFFEE', 100, 'UNLIMITED']] },
  { id: 'straw', ctor: A11.straw, codename: 'THE GHOST', name: 'STRAWBERRY', n: 'n2', q: 's1', figH: 610, ink: '#ffffff',
    col: { sky: '#ff3b55', sky2: '#b8102c', dots: 'rgba(90,0,20,.34)', accent: '#ff9aab', hi: '#ffd0d8' },
    rap: ['LAST SEEN', 'EVERYWHERE. SCHEDULED: NOWHERE'], stats: [['BADGE', 0, 'NONE'], ['SCHEDULE', 0, 'NONE'], ['BREAK', 0, 'PENDING']] },
  { id: 'mango', ctor: A7.mango, codename: 'THE TALKER', name: 'MANGO', n: 'n3', q: 'm1', figH: 600, ink: INKC,
    col: { sky: '#ffa31a', sky2: '#d4640a', dots: 'rgba(120,40,0,.34)', accent: '#ffc15c', hi: '#ffe8bb' },
    rap: ['PRIORS', 'TALKED A FAMILY OUT OF A LAWSUIT'], stats: [['SMALL TALK', 98, '98'], ['PAPERWORK', 12, '12'], ['GOSSIP', 100, '100']] },
  { id: 'clem', ctor: A10.clem, codename: 'THE MUSCLE', name: 'CLEMENTINE', n: 'n4', q: 'c1', figH: 590, ink: '#ffffff',
    col: { sky: '#ff5a1f', sky2: '#b8300a', dots: 'rgba(100,20,0,.36)', accent: '#ff9a63', hi: '#ffd8c2' },
    rap: ['PRIORS', 'SAID SURE. TO EVERYTHING'], stats: [['STRENGTH', 3, '3'], ['ENTHUSIASM', 100, '100'], ['SAYS SURE', 100, '100']] },
  { id: 'banana', ctor: A7.banana, codename: 'THE DISTRACTION', name: 'MR. BANANA', n: 'n5', q: 'b1', figH: 570, ink: INKC,
    col: { sky: '#f4ee6a', sky2: '#a8a600', dots: 'rgba(90,110,0,.30)', accent: '#ffe14a', hi: '#fffde0' },
    rap: ['PRIORS', 'FLOORS. MOSTLY FLOORS'], stats: [['BALANCE', 0, '0'], ['INCIDENTS', 47, '47'], ['LUCK', 0, '0']] },
  { id: 'moon', ctor: null, codename: 'THE EYE IN THE SKY', name: 'THE MOON', n: 'n6', q: 'mo1', figH: 0, ink: '#ffffff',
    col: { sky: '#26327e', sky2: '#0b0f3c', dots: 'rgba(120,140,255,.22)', accent: '#bfd0ff', hi: '#e6ecff' },
    rap: ['PRIORS', 'SEEN EVERYTHING. TOLD NO ONE'], stats: [['HEIGHT', 100, 'VERY'], ['VISIBILITY', 100, 'NIGHTLY'], ['SLEEP', 0, 'NEVER']] },
];
const t0Of = k => B(CARDS[k].n).s, q0Of = k => B(CARDS[k].q).s, q1Of = k => B(CARDS[k].q).e;
const cardAt = lt => { let k = -1; for (let i = 0; i < CARDS.length; i++) if (lt >= t0Of(i) - 1e-4) k = i; return k; };
/* the scene-local start of word i of a spoken line (the words are timed from the start of their line) */
const wordT = (id, i) => { const l = TL.lines.find(v => v.id === id); return l && l.words[i] ? B(id).s + l.words[i][1] : B(id).s; };

// ------------------------------------------------------------------ the colour block: sky, halftone, speed lines (painted once per card, no text)
const BG = [];
function paintBg(k) {
  const c = CARDS[k].col, cv = mkCv(W, H);
  intoCv(cv, g => {
    g.fillStyle = V2.radial(FOCUS[0], FOCUS[1], 60, 1100, [[0, c.sky], [.55, c.sky], [1, c.sky2]]); g.fillRect(0, 0, W, FLOOR);
    const R = V2.rng(40 + k);
    for (let i = 0; i < 64; i++) {   // radial speed lines from the focus: thin wedges, light and dark
      const a = R() * TAU, w = .012 + R() * .03, r0 = 260 + R() * 160, r1 = 1300, light = R() > .45;
      g.fillStyle = light ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.07)';
      g.beginPath(); g.moveTo(FOCUS[0] + Math.cos(a - w) * r0, FOCUS[1] + Math.sin(a - w) * r0); g.lineTo(FOCUS[0] + Math.cos(a - w) * r1, FOCUS[1] + Math.sin(a - w) * r1); g.lineTo(FOCUS[0] + Math.cos(a + w) * r1, FOCUS[1] + Math.sin(a + w) * r1); g.lineTo(FOCUS[0] + Math.cos(a + w) * r0, FOCUS[1] + Math.sin(a + w) * r0); g.closePath(); g.fill();
    }
    g.save(); g.beginPath(); g.rect(0, 0, W, FLOOR); g.clip();   // halftone: a staggered grid of dots that grow toward the edges
    const S = 34;
    for (let j = -4; j < 60; j++) for (let i = -4; i < 52; i++) {
      const x = i * S + (j & 1 ? S / 2 : 0), y = j * S * .5 + 4, d = Math.hypot(x - FOCUS[0], (y - FOCUS[1]) * 1.1), r = 13.5 * clamp((d - 330) / 650);
      if (r < .8) continue;
      g.fillStyle = c.dots; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.restore();
    g.fillStyle = V2.radial(FOCUS[0], FOCUS[1] + 40, 20, 520, [[0, 'rgba(255,255,255,.34)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, W, FLOOR);
    g.fillStyle = V2.grad(0, FLOOR, 0, H, [[0, '#1b1438'], [1, BASE]]); g.fillRect(0, FLOOR, W, H - FLOOR);   // the base the type lives on
    g.fillStyle = c.accent; g.fillRect(0, FLOOR, W, 8);
    g.fillStyle = INKC; g.fillRect(0, FLOOR - 7, W, 7);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(0, FLOOR + 20 + i * 24, W, 2); }
  });
  BG[k] = cv;
}
// a few long diagonal streaks that slide across the sky (live: nothing on a card is allowed to be dead)
function streaks(k, lt) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, FLOOR - 8); ctx.clip();
  for (let i = 0; i < 9; i++) {
    const sp = 260 + hash(i + k * 7) * 360, len = 280 + hash(i + 3) * 380, x = ((hash(i + k) * 1500 - lt * sp) % 1700 + 1700) % 1700 - 300, y = 60 + hash(i + 9 + k) * (FLOOR - 120);
    ctx.strokeStyle = `rgba(255,255,255,${.1 + .12 * hash(i + 5)})`; ctx.lineWidth = 3 + hash(i + 11) * 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len * Math.cos(-.42), y + len * Math.sin(-.42) * -1); ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the sticker: a figure with a thick white outline and a thin ink one, like a die-cut sticker
const BW = 1100, BH = 1100, BOX = 550, BOY = 930;      // the figure's buffer: its feet are at (BOX, BOY)
let BUF = null;
function stickerOf(o, into) {
  if (!BUF) BUF = { a: mkCv(BW, BH), w: mkCv(BW, BH), k: mkCv(BW, BH), out: mkCv(BW, BH) };
  const { a, w, k, out } = BUF;
  for (const cv of [a, w, k, out]) cv.getContext('2d').clearRect(0, 0, BW, BH);
  E.charTo(a, BOX, BOY, o);
  for (const [cv, col] of [[w, '#ffffff'], [k, INKC]]) { intoCv(cv, g => g.drawImage(a, 0, 0)); E.flatten(cv, col); }
  intoCv(out, g => {
    const N = 14;
    for (let i = 0; i < N; i++) { const an = i / N * TAU; g.drawImage(k, Math.cos(an) * 21, Math.sin(an) * 21); }
    for (let i = 0; i < N; i++) { const an = i / N * TAU + .11; g.drawImage(k, Math.cos(an) * 21, Math.sin(an) * 21); }
    for (let i = 0; i < N; i++) { const an = i / N * TAU; g.drawImage(w, Math.cos(an) * 15, Math.sin(an) * 15); }
    g.drawImage(w, 0, 0);
  });
  if (into) { into.out = mkCv(BW, BH); into.flat = mkCv(BW, BH); into.ghost = mkCv(BW, BH); intoCv(into.out, g => g.drawImage(out, 0, 0)); intoCv(into.flat, g => g.drawImage(k, 0, 0)); intoCv(into.ghost, g => g.drawImage(w, 0, 0)); }
  return out;
}
const STICK = [];

// ------------------------------------------------------------------ props that belong to this scene (fp13_ prefix)
EXT.prop.fp13_plan = (side, o, t) => {   // Lemon's clipboard, held up by its bottom edge: a floor plan with a dashed route and a red X, no lettering
  ctx.save(); ctx.translate(0, -80); ctx.rotate(side * -.08);
  ctx.fillStyle = '#b8864a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-44, -30, 88, 116, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffdf2'; ctx.fillRect(-36, -18, 72, 96);
  ctx.strokeStyle = 'rgba(80,120,190,.35)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-36, -6 + i * 14); ctx.lineTo(36, -6 + i * 14); ctx.stroke(); }
  ctx.strokeStyle = '#26408e'; ctx.lineWidth = 3; ctx.lineJoin = 'miter'; ctx.beginPath(); ctx.moveTo(-30, 70); ctx.lineTo(-30, -8); ctx.lineTo(30, -8); ctx.lineTo(30, 70); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-30, 30); ctx.lineTo(0, 30); ctx.lineTo(0, 70); ctx.moveTo(0, -8); ctx.lineTo(0, 12); ctx.stroke();
  ctx.setLineDash([5, 4]); ctx.strokeStyle = ALARM; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(-18, 66); ctx.lineTo(-18, 38); ctx.lineTo(14, 38); ctx.lineTo(14, 4); ctx.lineTo(18, 4); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = ALARM; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(24, 8); ctx.moveTo(24, -4); ctx.lineTo(14, 8); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-20, -38, 40, 18, 5); ctx.fill(); ctx.stroke();
  ctx.restore();
};
Object.assign(PROP_BOX, { fp13_plan: [-48, -122, 48, 10] });

// ------------------------------------------------------------------ the figures: a frozen pose (the freeze frame) and an alive pose (when they speak)
const seedOf = o => o.seed ?? (o.kind.charCodeAt(0) * 13 + o.kind.length * 7);
/* a time at which the character is not mid-blink (a freeze frame must not catch an eye shut) */
const stillT = o => { const sd = seedOf(o), t = 2.2 - sd * .37; return ((t % 4.1) + 4.1) % 4.1; };
const natH = o => { const k = KINDS[o.kind], leg = o.noLegs ? 0 : (k.leg || 90); return leg + k.ry * .9 + headTop(o, k); };

const FROZEN = {
  lemon: () => ({ rot: -.06, lift: 14, gaitW: 66, axis: 'x', dir: 1, stride: 44, vx: 500, expr: 'smug', look: [.55, -.25], browUp: 4, arms: { l: 'hold', r: [2.75, .6] }, hold: { l: 'fp13_plan' }, grip: { l: [-150, 30] }, hand: { r: 'point' } }),
  straw: () => ({ rot: .09, lift: 8, gaitW: 66, axis: 'x', dir: 1, stride: 36, expr: 'dead', lid: .3, look: [-.9, -.15], arms: { l: [1.2, 1.7], r: 'hold' }, grip: { r: [40, 26] }, hand: { r: 'point' } }),
  mango: () => ({ rot: .07, lift: 12, expr: 'happy', look: [.4, -.3], mouthOpen: 1, sparkle: true, arms: { l: [1.95, .35], r: [1.95, .35] }, hand: { l: 'wave', r: 'wave' } }),
  clem: () => ({ lift: 40, legs: 'splay', expr: 'angry', lid: .15, arms: { l: [1.75, 1.4], r: [1.75, 1.4] }, hand: { l: 'fist', r: 'fist' }, acc: ['steth', 'pricetag', 'badge7', 'sweat'] }),
  banana: () => ({ rot: -.5, lift: 80, legs: 'kick', expr: 'panic', look: [0, -.6], arms: { l: [2.4, .4], r: [1.5, .9] } }),
};
// the alive poses: each one acts the line (word times from the timeline), and pops out of the freeze with a squash
const ALIVE = {
  lemon(o, ua) {
    delete o.gaitW; delete o.vx; o.lift = 0; o.rot = .02 * Math.sin(ua * 3.2);
    const j = bump(ua) + bump(ua - (wordT('l1', 2) - q0Of(0))) + bump(ua - (wordT('l1', 3) - q0Of(0)));   // a jab on Eleven, One and plan
    o.arms = { l: 'hold', r: [2.4 + .3 * j, .55] }; o.expr = ua < 1.0 ? 'smug' : 'happy'; o.look = [.2 * Math.sin(ua * 1.3), -.05]; o.browUp = 3 + 6 * j;
  },
  straw(o, ua) {
    delete o.gaitW; o.lift = 0; o.rot = .015 * Math.sin(ua * 2.4); o.expr = 'dead'; o.lid = .4; o.look = [0, .05];
    const tap = bump(ua - (wordT('s1', 1) - q0Of(1)));
    o.arms = { l: 'rest', r: 'hold' }; o.grip = { r: [lerp(100, 94, tap), lerp(96, 104, tap)] }; o.hand = { r: 'flat' }; o.badgeSwing = .14 * tap;
  },
  mango(o, ua) {
    const w = i => wordT('m1', i) - q0Of(2), a1 = bump(ua - w(1)) + bump(ua - w(2)), a2 = bump(ua - w(4)), a3 = bump(ua - w(6)) + bump(ua - w(7));
    o.arms = { l: [1.15 + .8 * a2 + .5 * a3, .3 + .4 * a2], r: [1.25 + .75 * a1 + .5 * a3, .45 + .3 * a1] };
    o.rot = .05 * Math.sin(ua * 3.1); o.lift = 6 * Math.abs(Math.sin(ua * 5)); o.expr = 'happy'; o.look = [.5 * Math.sin(ua * 1.7), -.2]; delete o.mouthOpen; o.sparkle = ua < 1.2;
  },
  clem(o, ua) {
    const jump = Math.sin(clamp(ua / .36) * PI);
    o.lift = 34 * jump; delete o.legs; o.arms = { l: 'hips', r: 'thumb' }; o.expr = 'happy'; o.lid = 0; o.sparkle = true; o.acc = ['steth', 'pricetag', 'badge7']; o.rot = 0;
  },
  banana(o, ua) {
    const fall = easeIn(seg(ua, 0, .3));
    o.lift = 80 * (1 - fall);
    o.rot = lerp(-.5, 0, easeOut(seg(ua, .08, .5))) + (ua > .35 ? .09 * Math.exp(-(ua - .35) / .15) * Math.sin((ua - .35) * 30) : 0);
    if (ua < .3) { o.legs = 'kick'; o.expr = 'panic'; } else { delete o.legs; o.expr = 'dead'; o.lid = .45; }
    o.arms = ua < .3 ? { l: [2.4, .4], r: [1.5, .9] } : { l: 'rest', r: 'rest' }; o.look = [0, ua < .3 ? -.5 : .05];
    if (ua > .3) o.sy = 1 - .16 * Math.exp(-(ua - .3) / .09) * Math.cos((ua - .3) * 22);
  },
};
function figureOpts(k, lt, forceFrozen) {
  const C = CARDS[k], o0 = C.ctor({}), frozen = forceFrozen || lt < q0Of(k), ua = lt - q0Of(k);
  const o = Object.assign(o0, FROZEN[C.id](), { x: 0, y: 0 });
  o.s = C.figH / natH(o);
  const ft = stillT(o);
  o.t = frozen ? ft : ft + 3 + ua;
  if (!frozen) {
    ALIVE[C.id](o, ua);
    const pop = ua < .3 ? Math.exp(-ua / .09) * Math.sin(ua * 36) * .09 : 0;   // the freeze breaks: a squash and stretch
    if (pop) { o.sy = (o.sy || 1) * (1 + pop); o.sx = 1 - pop * .6; }
  }
  return o;
}


// ------------------------------------------------------------------ dressing around the figures (flat art, no text)
function peel(x, y, sc, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc * .45);
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.rotate(i * PI / 2 + .3);
    ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = INKC; ctx.lineWidth = 6 / sc;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40, -46, 150, -12); ctx.quadraticCurveTo(70, 34, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b4a1a'; ctx.beginPath(); ctx.moveTo(126, -10); ctx.quadraticCurveTo(150, -12, 150, -12); ctx.quadraticCurveTo(138, 10, 120, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#c9a73a'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function whoosh(x, y, len, a, rot = 0) {   // speed streaks
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-len * (.6 + .2 * i), -24 + i * 24); ctx.lineTo(0, -24 + i * 24); ctx.stroke(); }
  ctx.restore();
}
function bubble(x, y, r, a) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INKC; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
function ticks(x, y, a0, a1, r0, r1) {   // emphasis strokes fanned round a point
  ctx.save(); ctx.strokeStyle = INKC; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < 3; i++) { const a = lerp(a0, a1, i / 2); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); }
  ctx.stroke(); ctx.restore();
}
/* the dressing that sits BEHIND a figure (frozen: the echo trail of the ghost, the peel under the slipper) */
function dressBehind(k, lt, o, frozen) {
  const C = CARDS[k], u = lt - t0Of(k);
  if (C.id === 'straw' && frozen) {   // the ghost leaves echoes of herself behind: three fading white shapes, smeared sideways
    const pulse = .5 + .5 * Math.sin(lt * 9), st = STICK[k];
    [[-100, .42], [-196, .26], [-292, .13]].forEach(([dx, al], i) => {
      ctx.save(); ctx.globalAlpha = al * (.75 + .25 * pulse); ctx.translate(540 + dx + 5 * Math.sin(lt * 7 + i), FLOOR - 8); ctx.scale(1.05 + i * .03, 1); ctx.translate(-BOX, -BOY);
      ctx.drawImage(st.ghost, 0, 0); ctx.restore();
    });
  }
  if (C.id === 'banana') { peel(628, FLOOR - 30, 1.0, .12); if (frozen) whoosh(420, 730, 170, .55, -.35); }
}
/* the dressing in FRONT of a figure */
function dressFront(k, lt, o, frozen) {
  const C = CARDS[k], u = lt - t0Of(k);
  if (C.id === 'mango' && frozen) { bubble(380, 360, 26, 1); bubble(332, 300, 18, 1); bubble(300, 252, 12, 1); bubble(706, 330, 20, 1); bubble(750, 282, 13, 1); ticks(360, 480, PI * 1.08, PI * 1.32, 96, 140); ticks(724, 470, PI * 1.68, PI * 1.92, 96, 140); }
  if (C.id === 'clem' && frozen) { ticks(330, 560, PI * 1.0, PI * 1.25, 100, 140); ticks(750, 560, PI * 1.75, PI * 2.0, 100, 140); }
}

function viewfinder(k, lt) {
  const u = lt - t0Of(k), uq = lt - q0Of(k);
  const inK = easeOut(seg(u, .03, .2)), outK = seg(uq, 0, .16);
  if (inK <= 0 || outK >= 1) return;
  const off = 70 * (1 - inK) + 90 * easeIn(outK), a = (1 - outK) * clamp(inK * 2), m = 46, len = 64, y1 = FLOOR - 36;
  ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.92 * a})`; ctx.lineWidth = 7; ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  for (const [cx, cy, dx, dy] of [[m, m + 96, 1, 1], [W - m, m + 96, -1, 1], [m, y1, 1, -1], [W - m, y1, -1, -1]]) {
    const px = cx - dx * off, py = cy - dy * off;
    ctx.beginPath(); ctx.moveTo(px + dx * len, py); ctx.lineTo(px, py); ctx.lineTo(px, py + dy * len); ctx.stroke();
  }
  ctx.restore();
}
function unfreezeRing(k, lt) {
  const u = lt - q0Of(k), q = seg(u, 0, .4); if (q <= 0 || q >= 1) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, FLOOR - 8); ctx.clip(); ctx.strokeStyle = CARDS[k].col.hi; ctx.globalAlpha = .75 * (1 - q); ctx.lineWidth = 16 * (1 - q) + 2;
  ctx.beginPath(); ctx.arc(FOCUS[0], FOCUS[1] + 30, 120 + 520 * easeOut(q), 0, TAU); ctx.stroke(); ctx.restore();
}

// ------------------------------------------------------------------ the Moon: a big lit face in a round window
const MOON = { cx: 540, cy: 592, R: 286 };
function drawMoonCard(lt, k) {
  const q0 = q0Of(k), frozen = lt < q0, ua = lt - q0, { cx, cy, R } = MOON, rw = R - 44;
  // the sticker outline of the porthole, with its shadow
  ctx.save(); ctx.shadowColor = 'rgba(8,4,24,.45)'; ctx.shadowOffsetX = 14; ctx.shadowOffsetY = 18;
  ctx.fillStyle = INKC; ctx.beginPath(); ctx.arc(cx, cy, R + 21, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, R + 15, 0, TAU); ctx.fill(); ctx.restore();
  // the steel ring, its rivets and its bevel
  ctx.fillStyle = ctx.createConicGradient(-PI / 2, cx, cy); const gr = ctx.fillStyle;
  [[0, '#9db0bc'], [.1, '#e9f2f6'], [.22, '#72848f'], [.34, '#c3d2da'], [.47, '#566673'], [.6, '#cfdce3'], [.72, '#6f808c'], [.86, '#e4eef2'], [1, '#9db0bc']].forEach(([o, c]) => gr.addColorStop(o, c));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  ctx.strokeStyle = INKC; ctx.lineWidth = 5; ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .26, x = cx + Math.cos(a) * (R - 22), y = cy + Math.sin(a) * (R - 22); ctx.fillStyle = V2.radial(x - 3, y - 3, 1, 12, [[0, '#f2f7fa'], [1, '#5f6f7b']]); ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.fillStyle = INKC; ctx.beginPath(); ctx.arc(cx, cy, rw + 8, 0, TAU); ctx.fill();
  // the night in the window: sky, stars, a slow cloud, the Moon
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rw, 0, TAU); ctx.clip();
  ctx.fillStyle = V2.grad(0, cy - rw, 0, cy + rw, [[0, '#070a2c'], [1, '#2a3485']]); ctx.fillRect(cx - rw, cy - rw, rw * 2, rw * 2);
  for (let i = 0; i < 60; i++) { const tw = .4 + .6 * Math.sin(lt * (1 + hash(i) * 2) + i); ctx.fillStyle = `rgba(255,250,230,${.25 + .6 * tw * hash(i + 5)})`; ctx.beginPath(); ctx.arc(cx - rw + hash(i + 30) * rw * 2, cy - rw + hash(i + 70) * rw * 2, 1 + hash(i + 9) * 2.2, 0, TAU); ctx.fill(); }
  A7.clouds(lt, cy + rw * .25, cy + rw * .9, { n: 3, a: .35, tint: '120,140,220', belly: '40,50,120', speed: 18, scale: .8 });
  const look = frozen ? [-.5, .55] : [.7 * Math.sin(ua * 1.5), .25 * Math.sin(ua * .9) + .1];
  A7.moon(cx, cy, 1.34, { t: frozen ? 1.6 : 4 + ua, char: { expr: frozen ? 'smug' : (ua > .3 ? 'smug' : 'neutral'), lid: frozen ? .42 : .3, browUp: frozen ? 12 : 4, look } });
  // the targeting reticle follows the eyes
  const rx = cx + look[0] * 70, ry = cy + look[1] * 60 + 20;
  ctx.strokeStyle = 'rgba(77,227,255,.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(rx, ry, 60, 0, TAU); ctx.moveTo(rx - 90, ry); ctx.lineTo(rx - 36, ry); ctx.moveTo(rx + 36, ry); ctx.lineTo(rx + 90, ry); ctx.moveTo(rx, ry - 90); ctx.lineTo(rx, ry - 36); ctx.moveTo(rx, ry + 36); ctx.lineTo(rx, ry + 90); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ the text of a card: all through the UI kit, one layout function for all six
function drawCardText(k, lt) {
  const C = CARDS[k], col = C.col, u = lt - t0Of(k);
  // 1. the codename stamp slams on at the cardslam cue (+0.02)
  { const hit = .07, sc = u < hit ? lerp(1.5, 1, easeIn(clamp(u / hit))) : 1 + .07 * Math.exp(-(u - hit) / .07) * Math.cos((u - hit) * 42), st = { size: L.stamp.size, font: 'Bangers', spacing: 4 };
    if (u >= 0) popAbout(540, L.stamp.cy, sc, sc, 0, clamp(u * 40), () => {
      const m = UI.metrics('Bangers', 400), w = UI.sizeOf(C.codename, st).w + 2 * st.size * .5, h = m.cap * st.size + 2 * st.size * .34;
      UI.panel([540 - w / 2, L.stamp.cy - h / 2, w, h], { fill: INKC, r: st.size * .18, id: 'stamptag', shadow: 0, pad: 4 });
      UI.stamp(C.codename, 540, L.stamp.cy, Object.assign({ color: C.col.hi, rot: 0, alpha: 1, transit: sc > 1.03, id: 'stamp' }, st));
    }); }
  // 2. the name, big, rises with an overshoot
  { const q = seg(u, .16, .42), e = easeBack(q);
    if (q > 0) popAbout(540, L.name.cy, lerp(1.1, 1, e), lerp(1.1, 1, e), 70 * (1 - e), clamp(q * 4), () => UI.label(C.name, 540, L.name.cy, { size: L.name.size, font: 'Bangers', spacing: 4, fill: col.hi, stroke: INKC, lw: 18, shadow: 14, maxW: 940, id: 'name' })); }
  // 3. the rap sheet line: a gold tag and the charge, typed in
  { const q = seg(u, .34, .64);
    if (q > 0) {
      const [pre, rest] = C.rap, st = { size: L.rap.size, weight: 900, spacing: 2 }, gap = 16;
      const wP = UI.sizeOf(pre + ':', st).w, wR = UI.sizeOf(rest, st).w, total = wP + gap + wR, k0 = total > 940 ? 940 / total : 1, x0 = 540 - total * k0 / 2;
      const m = UI.metrics('Nunito', 900), base = L.rap.cy + m.cap * L.rap.size * k0 / 2, o2 = Object.assign({}, st, { size: st.size * k0, spacing: st.spacing * k0 });
      UI.write(pre + ':', x0, base, Object.assign({ align: 'left', fill: col.accent }, o2, { reveal: clamp(q * 3) }));
      UI.write(rest, x0 + (wP + gap) * k0, base, Object.assign({ align: 'left', fill: '#ece8ff' }, o2, { reveal: seg(q, .25, 1) }));
    } }
  // 4. three stat bars: the same geometry on every card
  C.stats.forEach((stat, i) => statRow(k, i, stat, u));
}
function statRow(k, i, stat, u) {
  const C = CARDS[k], col = C.col, [label, pct, val] = stat, y = L.bars.y + i * (L.bars.rowH + L.bars.gap);
  const t0 = .44 + i * .11, a = seg(u, t0, t0 + .2), fillK = easeOut(seg(u, t0 + .1, t0 + .75));
  if (a <= 0) return;
  const numeric = /^\d+$/.test(val), target = Number(val);
  let shown = numeric ? String(Math.round(target * fillK)) : val;
  if (C.id === 'banana' && label === 'INCIDENTS') shown = String(Math.round(46 * fillK) + (lt47(u, k) ? 1 : 0));
  const reveal = numeric ? 1 : seg(fillK, .25, 1);
  popAbout(L.bars.x + L.bars.w / 2, y + L.bars.rowH / 2, 1, 1, 0, clamp(a * 3), () => {
    ctx.save(); ctx.translate(-70 * (1 - easeOut(a)), 0);
    UI.panel([L.bars.x, y, L.bars.w, L.bars.rowH], { fill: 'rgba(255,255,255,.07)', r: 14, id: 'rowbg' + i, pad: 6 });
    UI.table([L.bars.x, y, L.bars.w, L.bars.rowH], [{ w: 292, align: 'left', size: 30, weight: 900, spacing: 3, fill: '#e8e4ff' }, { w: 470 }, { w: 190, align: 'right', font: 'Bangers', weight: 400, size: 44, spacing: 1, fill: '#ffffff' }],
      [[label, { t: '', draw: (x0, y0, x1, y1) => barDraw(x0, y0, x1, y1, pct / 100 * (C.id === 'banana' && label === 'INCIDENTS' ? 1 : 1), fillK, col) }, { t: shown, fill: col.hi, reveal }]],
      { fill: false, lw: 0, stroke: null, rowH: L.bars.rowH, padX: 16, size: 30, id: 'stat' + i });
    ctx.restore();
  });
}
const lt47 = (u, k) => u > (q0Of(k) - t0Of(k)) + .25;
function barDraw(x0, y0, x1, y1, pct, fillK, col) {
  const w = x1 - x0 - 24, h = 24, bx = x0 + 12, by = (y0 + y1) / 2 - h / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.38)'; rr(bx, by, w, h, 12); ctx.fill();
  const fw = Math.max(0, w * pct * fillK);
  if (fw > 2) { ctx.save(); rr(bx, by, w, h, 12); ctx.clip(); ctx.fillStyle = V2.grad(0, by, 0, by + h, [[0, col.hi], [1, col.accent]]); ctx.fillRect(bx, by, fw, h); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(bx, by + 3, fw, 4); ctx.restore(); }
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; rr(bx, by, w, h, 12); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(bx + w * i / 10, by + 4); ctx.lineTo(bx + w * i / 10, by + h - 4); ctx.stroke(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the open: a record scratch, then the six as silhouettes, 0.1 s each
function stickersFor(k) {
  if (!BG[k]) paintBg(k);
  if (!STICK[k] && CARDS[k].ctor) { STICK[k] = {}; stickerOf(figureOpts(k, 0, true), STICK[k]); }
  return STICK[k];
}
function montage(lt) {
  ctx.fillStyle = '#05030c'; ctx.fillRect(0, 0, W, H);
  const idx = Math.floor((lt - .3) / .1);
  if (lt < .25) {   // the hologram of the plan, collapsing: a few scanlines going out
    const a = 1 - seg(lt, 0, .25);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 9; i++) { const y = 480 + i * 110 + 30 * Math.sin(lt * 40 + i), w = 700 * a * (.4 + .6 * hash(i)); ctx.fillStyle = `rgba(77,227,255,${.5 * a})`; ctx.fillRect(540 - w / 2, y, w, 3); }
    ctx.restore();
    return;
  }
  if (idx < 0 || idx > 5) return;
  const k = idx, st = stickersFor(k), q = seg(lt, .3 + idx * .1, .3 + idx * .1 + .1), sc = 1 + .14 * (1 - easeOut(q * 2)), jit = (idx % 2 ? 1 : -1) * .03 * (1 - q);
  ctx.drawImage(BG[k], 0, 0);
  ctx.save(); ctx.translate(540, 560); ctx.rotate(jit); ctx.scale(sc, sc); ctx.translate(-540, -560);
  if (st) { ctx.drawImage(st.out, 540 - BOX, FLOOR - 8 - BOY); ctx.drawImage(st.flat, 540 - BOX, FLOOR - 8 - BOY); }
  else { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(MOON.cx, MOON.cy, MOON.R + 15, 0, TAU); ctx.fill(); ctx.fillStyle = INKC; ctx.beginPath(); ctx.arc(MOON.cx, MOON.cy, MOON.R, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ============================================================================ scene
const CUTS = () => CARDS.map((c, i) => t0Of(i));
function flashAt(lt) {   // the white flash: two frames at every freeze, a lighter one at every unfreeze, one at the shutter snap of the open
  let f = 0;
  for (let i = 0; i < CARDS.length; i++) { const u = lt - t0Of(i); if (u >= 0 && u < .1) f = Math.max(f, u < .033 ? 1 : u < .067 ? .6 : .25); }
  for (let i = 0; i < CARDS.length; i++) { const u = lt - q0Of(i); if (u >= 0 && u < .07) f = Math.max(f, u < .033 ? .4 : .18); }
  { const u = lt - .55; if (u >= 0 && u < .07) f = Math.max(f, u < .033 ? .9 : .4); }
  return f;
}
function irisAt(lt) {   // { R, rot } of the hex iris, or null
  for (let i = 0; i < CARDS.length; i++) { const u = lt - t0Of(i); if (u >= .034 && u < .14) { const q = (u - .034) / .106; return { R: lerp(300, 1350, easeOut(q)), rot: lerp(.5, 0, q), color: CARDS[i].col.hi }; } }
  const e = B('end'); if (lt >= e.s + .05) { const q = seg(lt, e.s + .05, e.e - .0); return { R: lerp(1350, 0, easeIn(q)), rot: lerp(0, .6, q), color: CARDS[5].col.hi }; }
  return null;
}
function hexIris(cx, cy, R, rot, edge) {
  ctx.save(); ctx.fillStyle = '#07040f';
  ctx.beginPath(); ctx.rect(-10, -10, W + 20, H + 20);
  const pts = []; for (let i = 0; i < 6; i++) { const a = rot + i * PI / 3; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill('evenodd');
  ctx.strokeStyle = edge; ctx.lineWidth = 5; ctx.lineJoin = 'miter'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 3; ctx.beginPath();
  pts.forEach(([x, y], i) => { const p = pts[(i + 5) % 6]; ctx.moveTo(x, y); ctx.lineTo(x + (x - p[0]) * 3, y + (y - p[1]) * 3); }); ctx.stroke();
  ctx.restore();
}
const CREW = {
  noChyron: true,
  cam(lt) {
    const k = cardAt(lt);
    if (k < 0) { zoomTo(540, 960, 1); CAM.r = lt >= .25 && lt < .9 ? .02 * Math.sin(lt * 70) : 0; return; }
    const u = lt - t0Of(k), dur = (k < CARDS.length - 1 ? t0Of(k + 1) : B('end').s) - t0Of(k);
    zoomTo(540, 960, 1 + .018 * seg(u, 0, dur));
    CAM.shake = 11 * ring(u, .07, .08) * (u >= .07);
  },
  draw(lt) {
    const k = cardAt(lt);
    if (k < 0) { montage(lt); return; }
    const C = CARDS[k];
    if (!BG[k]) paintBg(k);
    ctx.drawImage(BG[k], 0, 0);
    streaks(k, lt);
    if (C.ctor) {
      const st = stickersFor(k), o = figureOpts(k, lt), frozen = lt < q0Of(k);
      V2.setLight({ key: [-.5, -.8], keyColor: '#fff6e0', keyA: .3, rim: C.col.hi, rimA: .55, shadow: '#14102a', shadowA: .35, amb: C.col.sky, ambA: .06, bounce: '#ffffff', bounceA: .12 });
      unfreezeRing(k, lt);
      dressBehind(k, lt, o, frozen);
      const out = frozen ? st.out : stickerOf(o);
      ctx.save(); ctx.shadowColor = 'rgba(8,4,24,.45)'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 14; ctx.shadowOffsetY = 18;
      ctx.drawImage(out, 540 - BOX, FLOOR - 8 - BOY);
      ctx.restore();
      drawChar(Object.assign({}, o, { x: 540, y: FLOOR - 8 }));
      dressFront(k, lt, o, frozen);
    } else { unfreezeRing(k, lt); drawMoonCard(lt, k); }
    viewfinder(k, lt);
    drawCardText(k, lt);
  },
  fx(lt) {
    const f = flashAt(lt), e = B('end'), dark = lt >= e.e ? 1 : 0;
    return { bloom: .35, vignette: .35, grain: .05, contrast: .12, sat: .1, fade: Math.max(f, dark), fadeColor: dark ? '7,4,15' : '255,255,255' };
  },
  blur(lt) {
    if (lt < .95) return 1;
    for (let i = 0; i < CARDS.length; i++) { const u = lt - t0Of(i); if (u < .17 || (lt - q0Of(i) >= 0 && lt - q0Of(i) < .1)) return 1; }
    return 2;
  },
  over(lt) { const ir = irisAt(lt); if (ir) hexIris(540, 580, ir.R, ir.rot, ir.color); },
};
window.__EP13_SCENES.crew = CREW;
})();
