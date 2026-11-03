'use strict';
/* SHIFT HAPPENS, Episode 16: "The Vote". Scene module: prize (8:10 PM, THE PLAQUE, 12.4 s). Builder E1617-BALLOT. Registers window.__EP16_SCENES.prize.
 *
 * The maintenance room: a pegboard of tools, a caged work lamp (it clicks on at 0.4), a workbench. Carrot (Greenleaf charge nurse, goggles pushed up) engraves a brass plaque on a wooden stand: EMPLOYEE OF THE
 * MONTH is done, BINDER is engraved letter by letter (sparks, a fine dust), then PRIZE: A DAY OFF; Binder is clipped to the top of the stand like a mascot. A rubber stamp slams and the day off reads PENDING.
 * The world is flat (a frontal elevation, 1080 x 1920 units at zoom 1); every shot is a camera (zoomTo) plus its own placement of the cast (close-ups are big characters, the background out of focus).
 *
 * Shots (scene-local s): open 0-.9 wide, dark then the lamp (click .4) | a1 .9-2.6 Melon presents | ca1 2.6-3.39 Carrot CU "Name?" | b1 3.39-4.0 plaque insert, BINDER engraved | ca2 4.0-4.79 Carrot MCU "Prize?" |
 * b2 4.79-5.57 plaque insert, PRIZE: A DAY OFF | l1 5.57-6.83 Lemon CU + Binder, the stare | b3 6.83-7.89 Binder CU, heart and spin | s1 7.89-9.08 Strawberry CU | b4 9.08-9.86 Binder CU "Pending!" |
 * st 9.86-10.455 plaque insert, the stamp slams at 10.155 | sp 10.455-10.855 slow push-in on Strawberry (the pending tone) | sg 10.855-12.4 Binder's grin (sting), a slow push.
 */
(() => {
if (!window.TIMELINE_EP16 || !window.H6 || !window.V2 || !window.A15 || !window.UI) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A9 = window.A9, A11 = window.A11, A15 = window.A15;
const PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP16, SCN = TLX.scenes.find(s => s.id === 'prize'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'prize') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];      /* scene-local start of the i-th word of a spoken line (words are line-relative in the timeline) */
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };   /* ease out back */
const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const snapT = t => Math.round((START + t) * 30) / 30 - START;            /* the scene-local time of the video frame nearest to t: a picture event lands on this frame */
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };   /* seeded noise 0..1, a pure function of its arguments */
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);

/* the sound cues of the scene (scene-local seconds, from script_ep16.json: beat start + offset; python3 /tmp/shift_tools/cues.py 16 prize), snapped to the video frame nearest each */
const CUE = { click: .4, stamp: 10.155, pending: 10.455, sting: 10.855 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);
/* the engraving: BINDER is cut letter by letter while the word is spoken (b1), the prize line while Binder says "A day off!" (b2) */
const ENG1 = { t0: wS('b1', 0), t1: wS('b1', 0) + .5 };                 /* 3.39 .. 3.89: a letter is shown when the cutter has passed it */
const ENG2 = { t0: bS('b2') + .02, t1: bS('b2') + .58 };               /* 4.81 .. 5.37 */
const HAS = (sh, n) => !sh.cast || sh.cast.indexOf(n) >= 0;

// ------------------------------------------------------------------ the world: a frontal elevation of the maintenance room (units = pixels at zoom 1)
const BENCH = { y0: 1062, y1: 1124, x0: -400, x1: 1480 };                /* the bench top slab (a thin band seen from slightly above) */
const FLOORY = 1180;
const PQ = { x: 260, y: 790, w: 560, h: 295, cx: 540 };                  /* the plaque frame */
const PQL = { l1: 846, rule: 880, l2: 958, l3: 1040 };                    /* cap-band centres of the three lines on the plate */
const OUTL = 'rgba(28,20,14,.75)';

function wall(lt) {
  const x0 = -420, x1 = 1500;
  ctx.fillStyle = lg(0, 0, 0, FLOORY, [[0, '#4d6664'], [.55, '#6a8582'], [1, '#556f6c']]); ctx.fillRect(x0, -200, x1 - x0, FLOORY + 260);
  /* painted cinder blocks */
  ctx.strokeStyle = 'rgba(28,44,44,.34)'; ctx.lineWidth = 3; ctx.beginPath();
  for (let r = 0, y = 40; y < FLOORY; r++, y += 64) {
    ctx.moveTo(x0, y); ctx.lineTo(x1, y);
    for (let x = x0 + (r % 2 ? 0 : 60); x < x1; x += 120) { ctx.moveTo(x, y); ctx.lineTo(x, y + 64); }
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 9; i++) ctx.fillRect(x0 + sr(i, 1) * (x1 - x0), 30 + sr(i, 2) * 900, 120, 64);
  /* the floor under the bench: concrete */
  ctx.fillStyle = lg(0, FLOORY, 0, FLOORY + 800, [[0, '#4a4a50'], [1, '#2c2c32']]); ctx.fillRect(x0, FLOORY, x1 - x0, 900);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x0, FLOORY, x1 - x0, 10);
}
/* the pegboard with its painted tool outlines and the tools hanging on it */
function pegboard(lt) {
  const x0 = -140, y0 = 300, x1 = 1220, y1 = 1004;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
  ctx.fillStyle = lg(x0, y0, x1, y1, [[0, '#d2aa72'], [.5, '#c79e66'], [1, '#b98e58']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
  ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 6; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = 'rgba(70,42,16,.5)'; ctx.beginPath();
  for (let y = y0 + 20; y < y1 - 8; y += 40) for (let x = x0 + 20; x < x1 - 8; x += 40) ctx.rect(x - 3, y - 3, 6, 6);
  ctx.fill();
  const hang = (x, y, fn) => { ctx.save(); ctx.translate(x, y); fn(); ctx.restore(); };
  const steel = (a = 0) => lg(-40, 0, 40, 0, [[0, '#cfd5dd'], [.5, '#8d96a3'], [1, '#bdc4ce']]);
  const shadow = f => { ctx.save(); ctx.translate(7, 8); ctx.globalAlpha = .28; ctx.fillStyle = '#2a1a08'; f(); ctx.restore(); };
  /* hammer */
  hang(120, 520, () => { ctx.rotate(-.08);
    shadow(() => { rr(-9, -10, 18, 190, 5); ctx.fill(); rr(-44, -28, 88, 36, 6); ctx.fill(); });
    rr(-9, -10, 18, 190, 5); ctx.fillStyle = '#b07a3e'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
    rr(-46, -30, 92, 36, 6); ctx.fillStyle = lg(0, -30, 0, 6, [[0, '#d7dce4'], [1, '#7c8592']]); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#b02a24'; ctx.fillRect(-9, 150, 18, 12); });
  /* adjustable wrench */
  hang(290, 470, () => { ctx.rotate(.1);
    shadow(() => { rr(-10, 0, 20, 230, 7); ctx.fill(); rr(-30, -40, 60, 54, 8); ctx.fill(); });
    rr(-10, 0, 20, 232, 7); ctx.fillStyle = steel(); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
    rr(-30, -40, 60, 56, 9); ctx.fillStyle = steel(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a4f2e'; ctx.fillRect(-12, -40, 24, 36); ell(0, 214, 5, 5); ctx.fillStyle = '#5b6370'; ctx.fill(); });
  /* handsaw */
  hang(520, 560, () => { ctx.rotate(-.03);
    shadow(() => { ctx.beginPath(); ctx.moveTo(-170, -50); ctx.lineTo(170, -26); ctx.lineTo(170, 34); ctx.lineTo(-170, 34); ctx.closePath(); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(-170, -50); ctx.lineTo(170, -26); ctx.lineTo(170, 34); ctx.lineTo(-170, 34); ctx.closePath(); ctx.fillStyle = lg(0, -50, 0, 34, [[0, '#e1e6ee'], [1, '#98a1ae']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#8d96a3'; ctx.beginPath(); for (let i = 0; i < 24; i++) { const x = -170 + i * 14.2; ctx.moveTo(x, 34); ctx.lineTo(x + 7, 48); ctx.lineTo(x + 14, 34); } ctx.fill();
    rr(150, -62, 70, 110, 22); ctx.fillStyle = '#c4382f'; ctx.fill(); ctx.stroke(); rr(168, -30, 34, 46, 12); ctx.fillStyle = '#6a3a24'; ctx.fill(); });
  /* pliers */
  hang(810, 500, () => { ctx.rotate(.06);
    shadow(() => { rr(-34, 0, 68, 200, 14); ctx.fill(); });
    ctx.strokeStyle = OUTL; ctx.lineWidth = 3;
    rr(-32, 70, 24, 150, 10); ctx.fillStyle = '#d6382c'; ctx.fill(); ctx.stroke(); rr(8, 70, 24, 150, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-26, 76); ctx.lineTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(26, 76); ctx.closePath(); ctx.fillStyle = steel(); ctx.fill(); ctx.stroke(); ell(0, 70, 7, 7); ctx.fillStyle = '#4a5260'; ctx.fill(); });
  /* three screwdrivers */
  [[950, '#2a6ad6'], [1000, '#e8a21c'], [1050, '#3aa35c']].forEach(([x, c], i) => hang(x, 470 + i * 6, () => { ctx.rotate(.02 * (i - 1));
    shadow(() => { rr(-8, 0, 16, 190, 6); ctx.fill(); });
    ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.fillStyle = steel(); ctx.fillRect(-3, 70, 6, 124); ctx.strokeRect(-3, 70, 6, 124);
    rr(-15, 0, 30, 84, 12); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-9, 8, 5, 64); }));
  /* tape measure */
  hang(190, 790, () => {
    shadow(() => { rr(-56, -44, 112, 88, 16); ctx.fill(); });
    rr(-56, -44, 112, 88, 16); ctx.fillStyle = '#f2c11b'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke(); ell(8, 0, 26, 26); ctx.fillStyle = '#2a2a30'; ctx.fill(); ell(8, 0, 9, 9); ctx.fillStyle = '#8d96a3'; ctx.fill();
    ctx.fillStyle = '#d7dce4'; ctx.fillRect(-72, 20, 30, 12); ctx.strokeRect(-72, 20, 30, 12); });
  /* spirit level */
  hang(620, 850, () => { ctx.rotate(-.02);
    shadow(() => { rr(-190, -22, 380, 44, 8); ctx.fill(); });
    rr(-190, -22, 380, 44, 8); ctx.fillStyle = lg(0, -22, 0, 22, [[0, '#f0d24a'], [1, '#c9a21c']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
    rr(-40, -9, 80, 18, 8); ctx.fillStyle = '#d8f3c0'; ctx.fill(); ctx.stroke(); ell(4, 0, 12, 6); ctx.fillStyle = '#7ec04a'; ctx.fill(); ell(-150, 0, 14, 8); ctx.fillStyle = '#2a2a30'; ctx.fill(); ell(150, 0, 14, 8); ctx.fill(); });
  /* a coil of orange cord and a clamp */
  hang(1010, 780, () => { for (let i = 0; i < 4; i++) { ctx.strokeStyle = i % 2 ? '#ff9a2a' : '#e8821a'; ctx.lineWidth = 11; ctx.beginPath(); ctx.ellipse(0, 0, 52 - i * 7, 62 - i * 8, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = OUTL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 57, 67, 0, 0, TAU); ctx.stroke(); });
  hang(-60, 780, () => { ctx.strokeStyle = OUTL; ctx.lineWidth = 3; rr(-12, -70, 24, 150, 6); ctx.fillStyle = '#c9ced6'; ctx.fill(); ctx.stroke(); rr(-50, -86, 84, 24, 8); ctx.fillStyle = '#b02a24'; ctx.fill(); ctx.stroke(); rr(-50, 56, 84, 24, 8); ctx.fill(); ctx.stroke(); });
}
/* the caged work lamp on a cord from the ceiling: off (dim bulb) until the click, then on with a flicker */
function lampOn(lt) { return lt < CUE.click ? 0 : (lt < CUE.click + .12 ? (lt - CUE.click < .05 ? .2 : .55) : 1) * (1 - .05 * (Math.sin(lt * 31) > .96 ? 1 : 0)); }
const LAMP = { x: 600, y: 330 };
function lamp(lt) {
  const on = lampOn(lt), { x, y } = LAMP;
  ctx.strokeStyle = '#17171c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, -200); ctx.lineTo(x, y - 62); ctx.stroke();
  rr(x - 18, y - 70, 36, 30, 6); ctx.fillStyle = '#2b2d36'; ctx.fill();
  ell(x, y - 8, 36, 44); ctx.fillStyle = on > .05 ? V2.mix ? '#fff4c8' : '#fff4c8' : '#c9c2a8'; ctx.fill();
  if (on > .05) V2.glow(x, y - 8, 120 + 40 * on, '255,236,170', .5 * on, 'screen', .6);
  ctx.strokeStyle = '#4a4e5a'; ctx.lineWidth = 3.2; ctx.beginPath(); ell(x, y - 8, 42, 54); ctx.stroke();
  for (const dx of [-24, -8, 8, 24]) { ctx.beginPath(); ctx.moveTo(x + dx * .95, y - 60); ctx.quadraticCurveTo(x + dx * 1.8, y - 8, x + dx * .9, y + 44); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(x, y + 44, 30, 6, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = '#2b2d36'; rr(x - 24, y + 40, 48, 12, 4); ctx.fill();
}
/* the bench: a wooden top (planks), the apron with two drawers, a vise on the left, a toolbox on the right, curls of brass on the top */
function bench(lt) {
  const { y0, y1, x0, x1 } = BENCH;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#c98f55'], [1, '#a36d3a']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
  ctx.strokeStyle = 'rgba(70,40,16,.45)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = x0 + 70; x < x1; x += 140) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); } for (let i = 0; i < 18; i++) { const y = y0 + 8 + sr(i, 3) * 44, x = x0 + sr(i, 4) * (x1 - x0); ctx.moveTo(x, y); ctx.lineTo(x + 70 + sr(i, 5) * 80, y); } ctx.stroke();
  ctx.fillStyle = '#e0aa6c'; ctx.fillRect(x0, y0, x1 - x0, 5);
  ctx.fillStyle = lg(0, y1, 0, FLOORY, [[0, '#7c5430'], [1, '#5b3c20']]); ctx.fillRect(x0, y1, x1 - x0, FLOORY + 260 - y1);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0, y1, x1 - x0, 8);
  for (const dx of [-90, 150, 410, 670, 930, 1190]) { rr(dx, y1 + 30, 190, 120, 8); ctx.fillStyle = '#8a6137'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke(); rr(dx + 55, y1 + 56, 80, 14, 7); ctx.fillStyle = '#d7dce4'; ctx.fill(); ctx.stroke(); }
  /* the vise on the left end */
  rr(-30, y0 - 54, 70, 44, 5); ctx.fillStyle = '#3d4350'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#6a7384'; ctx.fillRect(-30, y0 - 54, 70, 8);
  ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(40, y0 - 30); ctx.lineTo(96, y0 - 30); ctx.stroke(); ell(100, y0 - 30, 9, 9); ctx.fillStyle = '#5b6370'; ctx.fill();
  /* a toolbox on the right */
  rr(940, y0 - 56, 170, 56, 7); ctx.fillStyle = '#c4382f'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#9d2a24'; ctx.fillRect(940, y0 - 36, 170, 6); rr(992, y0 - 72, 66, 20, 8); ctx.strokeStyle = '#2a2d36'; ctx.lineWidth = 6; ctx.stroke();
  /* brass curls and a coffee mug */
  ctx.strokeStyle = '#e2c15a'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(830 + i * 26 + sr(i, 8) * 12, y0 + 22 + sr(i, 9) * 14, 7 + sr(i, 7) * 4, 0, PI * 1.6); ctx.stroke(); }
  rr(150, y0 - 38, 40, 40, 8); ctx.fillStyle = '#f3f1e8'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(192, y0 - 18, 11, -1.2, 1.2); ctx.stroke(); ctx.fillStyle = '#3a2a20'; ctx.fillRect(154, y0 - 34, 32, 6);
}

// ------------------------------------------------------------------ text on the plaque: engraved letters (dark cut, light lower edge), hero only when the whole string is safely in the frame
const scaleNow = () => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };
function safeIn(x0, y0, x1, y1, mg = 46) {   /* is a box (current frame) wholly inside the frame, clear of the caption zone (y 1380..1700) and the clock pill (x 48..500, y 116..244)? */
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  if (L < mg || R > W - mg || T < mg || B > H - mg) return false;
  if (B > 1376 && T < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T < 248) return false;
  return true;
}
const WID = {};   /* cumulative advance widths of the prefixes of a string (for the engraver tip) */
function prefixW(str, o) {
  const id = str + '|' + o.size + '|' + (o.font || '') + '|' + (o.spacing || 0);
  if (!WID[id]) { const a = [0]; for (let i = 1; i <= str.length; i++) a.push(UI.sizeOf(str.slice(0, i), o).w); WID[id] = a; }
  return WID[id];
}
/* one engraved line. reveal 0..1 cuts it letter by letter: a letter appears once the cutter has passed it (so the tool never covers a letter that is shown); returns { x0, x1, tipX, w } */
let NOHERO = false;   /* the stamp's sleeve crosses the plaque for a few frames: its text is not hero then */
function engrave(str, cx, cy, o) {
  const so = { size: o.size, font: o.font, weight: 900, spacing: o.spacing || 0 };
  const fit = UI.fit(str, o.maxW || 9999, so), size = Math.min(o.size, fit.size || o.size);
  const w = UI.sizeOf(str, so).w, h = size * .8, len = str.length;
  const nf = o.reveal == null || o.reveal >= 1 ? len : o.reveal * len, shown = nf >= len ? len : Math.floor(nf);
  const hero = !NOHERO && safeIn(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2) && scaleNow() * size >= 31;
  const base = { size: o.size, font: o.font, weight: 900, spacing: o.spacing || 0, hero, crop: !hero, grp: 'plq', reveal: shown >= len ? null : (shown - .2) / len, maxW: o.maxW };
  if (shown > 0) {
    UI.label(str, cx + 1.4, cy + 2.2, Object.assign({}, base, { fill: '#fff1b4', alpha: .8 }));
    UI.label(str, cx, cy, Object.assign({}, base, { fill: '#3a2708', stroke: '#6a4a10', lw: 1.3 }));
  }
  const pw = prefixW(str, so), n = Math.min(len - 1, Math.floor(nf)), left = cx - pw[len] / 2, tipX = left + lerp(pw[n], pw[n + 1], nf - n);
  return { x0: left, x1: left + pw[len], tipX, w: pw[len] };
}

// ------------------------------------------------------------------ the plaque and its stand (world units; the text is drawn live)
function plaque(lt, st, mid) {
  const { x, y, w, h, cx } = PQ, shake = st.shake || 0;
  ctx.save(); ctx.translate(shake * 5, -Math.abs(shake) * 2);
  /* the wooden base block and the shadow on the bench */
  ctx.fillStyle = 'rgba(30,16,6,.4)'; ell(cx, BENCH.y0 + 30, w * .56, 16); ctx.fill();
  rr(x + 50, y + h - 8, w - 100, 30, 7); ctx.fillStyle = lg(0, y + h, 0, y + h + 22, [[0, '#7a4f2a'], [1, '#4f3018']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
  /* walnut frame */
  rr(x, y, w, h, 18); ctx.fillStyle = lg(x, y, x + w, y + h, [[0, '#7b4e2b'], [.5, '#5a3820'], [1, '#6c4425']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,214,150,.28)'; ctx.lineWidth = 2; rr(x + 5, y + 5, w - 10, h - 10, 14); ctx.stroke();
  /* the brass plate */
  const px = x + 22, py = y + 20, pw2 = w - 44, ph = h - 40;
  rr(px, py, pw2, ph, 8); ctx.fillStyle = lg(px, py, px + pw2, py + ph, [[0, '#f1d57a'], [.28, '#d9ae42'], [.55, '#f4dc8c'], [.8, '#c79a32'], [1, '#e6c566']]); ctx.fill();
  ctx.strokeStyle = 'rgba(110,76,10,.85)'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(255,248,205,.75)'; ctx.lineWidth = 1.6; rr(px + 4, py + 4, pw2 - 8, ph - 8, 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,86,14,.12)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 30; i++) { const yy = py + 8 + i * 8.1; ctx.moveTo(px + 8, yy); ctx.lineTo(px + pw2 - 8, yy); } ctx.stroke();
  for (const [sx, sy] of [[px + 16, py + 16], [px + pw2 - 16, py + 16], [px + 16, py + ph - 16], [px + pw2 - 16, py + ph - 16]]) { ell(sx, sy, 6, 6); ctx.fillStyle = '#b48a2a'; ctx.fill(); ctx.strokeStyle = 'rgba(80,54,6,.9)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(sx - 3.4, sy - 1.4); ctx.lineTo(sx + 3.4, sy + 1.4); ctx.stroke(); }
  if (mid) mid();                                     /* sparks and dust: in front of the brass, behind the lettering (so they never cover a letter) */
  /* the lines */
  const r1 = engrave('EMPLOYEE OF THE MONTH', cx, PQL.l1, { size: 34, spacing: .8, maxW: pw2 - 56 });
  ctx.strokeStyle = 'rgba(70,48,8,.8)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cx - 150, PQL.rule); ctx.lineTo(cx - 14, PQL.rule); ctx.moveTo(cx + 14, PQL.rule); ctx.lineTo(cx + 150, PQL.rule); ctx.stroke();
  ctx.fillStyle = 'rgba(70,48,8,.85)'; ctx.save(); ctx.translate(cx, PQL.rule); ctx.rotate(PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.restore();
  const u1 = sg(lt, ENG1.t0, ENG1.t1), u2 = sg(lt, ENG2.t0, ENG2.t1);
  let tip = null;
  if (u1 > 0) { const r = engrave('BINDER', cx, PQL.l2, { size: 118, font: 'Bangers', spacing: 7, reveal: u1 >= 1 ? 1 : u1, maxW: pw2 - 70 }); if (u1 < 1) tip = { x: r.tipX, y: PQL.l2, line: 2 }; }
  if (u2 > 0) {
    if (!st.stamped) { const r = engrave('PRIZE: A DAY OFF', cx, PQL.l3, { size: 38, spacing: 1.6, reveal: u2 >= 1 ? 1 : u2, maxW: pw2 - 60 }); if (u2 < 1) tip = { x: r.tipX, y: PQL.l3, line: 3 }; }
    else {
      const so = { size: 38, weight: 900, spacing: 1.6 }, full = UI.sizeOf('PRIZE: A DAY OFF', so).w, left = cx - full / 2, pre = UI.sizeOf('PRIZE: ', so).w;
      { const hh = !NOHERO && safeIn(left, PQL.l3 - 20, left + pre, PQL.l3 + 20) && scaleNow() * 38 >= 31; UI.label('PRIZE:', left, PQL.l3, { size: 38, weight: 900, spacing: 1.6, align: 'left', fill: '#3a2708', stroke: '#6a4a10', lw: 1.3, hero: hh, crop: !hh, grp: 'plq' }); }
      st.pendBox = { x0: left + pre + 4, x1: cx + full / 2 + 16, cy: PQL.l3 };
    }
  }
  ctx.restore();
  return { tip, r1 };
}
/* the red stamped PENDING over the day off: a solid ink block with the word in cream, a rounded border (it lands on stamp, drawn after the plaque so it covers the brass) */
function pendingInk(lt, st) {
  const b = st.pendBox; if (!b || lt < CUE.stamp) return;
  const age = lt - CUE.stamp, pop = age < .09 ? lerp(1.18, 1, age / .09) : 1, w = b.x1 - b.x0, h = 52, cx = (b.x0 + b.x1) / 2, cy = b.cy;
  ctx.save(); ctx.translate(st.shake * 5, -Math.abs(st.shake) * 2); ctx.translate(cx, cy); ctx.rotate(-.045); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
  rr(cx - w / 2, cy - h / 2, w, h, 7); ctx.fillStyle = 'rgba(176,34,30,.96)'; ctx.fill(); ctx.strokeStyle = 'rgba(110,14,12,.9)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,225,200,.55)'; ctx.lineWidth = 1.6; rr(cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h - 8, 5); ctx.stroke();
  const hero = !NOHERO && safeIn(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2) && scaleNow() * 34 >= 31;
  UI.label('PENDING', cx, cy, { size: 34, weight: 900, spacing: 2.2, fill: '#ffeede', maxW: w - 22, hero, crop: !hero });
  ctx.restore();
}
/* sparks and a fine brass dust round the cutter's tip (pure functions of time) */
function sparks(lt, t0, t1, tipAt) {
  if (lt < t0 || lt > t1 + .6) return;
  const N = Math.round((t1 - t0) * 70);
  for (let i = 0; i < N; i++) {
    const b = t0 + i / 70, age = lt - b; if (age < 0 || age > .42) continue;
    const [tx, ty] = tipAt(Math.min(b, t1)), a = -PI * (.08 + .42 * sr(i, 1)) + (sr(i, 11) - .5) * .4, v = 240 + 380 * sr(i, 2);
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v + 80, x = tx + vx * age, y = ty + vy * age + 1100 * age * age, f = 1 - age / .42;
    const x2 = x - vx * .022, y2 = y - (vy + 2200 * age) * .022;
    ctx.strokeStyle = `rgba(255,${Math.round(160 + 90 * f)},${Math.round(60 + 120 * f * f)},${f})`; ctx.lineWidth = 2.8 * (.5 + f); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
  }
  for (let i = 0; i < Math.round((t1 - t0) * 40); i++) {
    const b = t0 + i / 40, age = lt - b; if (age < 0 || age > .9) continue;
    const [tx, ty] = tipAt(Math.min(b, t1)), x = tx + 8 + (.15 + .85 * sr(i, 5)) * 120 * age, y = ty - 40 * age + 30 * age * age + (sr(i, 6) - .5) * 20, f = 1 - age / .9;
    ctx.fillStyle = `rgba(235,200,100,${.5 * f})`; ell(x, y, 2.4, 2.4); ctx.fill();
  }
  { const [gx, gy] = tipAt(Math.min(lt, t1)); V2.glow(gx + 16, gy, 28, '255,200,110', .4, 'screen', .3); }
}

// ------------------------------------------------------------------ Carrot's hand and tools (a sleeve from the frame edge, an orange mitt): the engraver and the rubber stamp
function mitt(x, y, ang, sc = 1) {   /* a fist round a handle, the thumb along it; (x, y) = the centre of the grip, ang = the handle's direction */
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
  ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(90,36,4,.9)'; ctx.lineWidth = 3.4; ctx.fillStyle = lg(0, -26, 0, 26, [[0, '#ff9a3e'], [1, '#e8731a']]);
  rr(-24, -24, 48, 48, 18); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 3; i++) { rr(-18 + i * 14, 14, 15, 24, 7); ctx.fill(); ctx.stroke(); }
  rr(-30, -30, 38, 18, 9); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function sleeve(x, y, ang, len = 900, w = 82) {   /* a scrub sleeve that comes from `len` units behind the wrist, along the arm direction ang (from the wrist outward) */
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = lg(0, -w / 2, 0, w / 2, [[0, '#3fae78'], [.5, '#2f8f5b'], [1, '#216c44']]); ctx.strokeStyle = 'rgba(14,50,30,.9)'; ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(-len, -w * .6); ctx.lineTo(-48, -w * .45); ctx.lineTo(-48, w * .45); ctx.lineTo(-len, w * .6); ctx.closePath(); ctx.fill(); ctx.stroke();
  rr(-62, -w * .5, 26, w, 6); ctx.fillStyle = '#e9f5ee'; ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* the rotary engraver, tip at (tx, ty), pointing from the hand toward the tip along ang; the hand grips it 70 units back from the tip */
function engraver(tx, ty, ang, spin) {
  const dx = Math.cos(ang), dy = Math.sin(ang), hx = tx - dx * 74, hy = ty - dy * 74;
  sleeve(hx - dx * 6, hy - dy * 6, ang, 900, 70);   /* the sleeve runs backwards from the wrist (away from the tip) */
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang + PI);   /* local +x runs from the tip back toward the hand */
  ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(14,14,20,.95)'; ctx.lineWidth = 3;
  ctx.fillStyle = lg(0, -12, 0, 12, [[0, '#d7dce4'], [1, '#7c8592']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, -8); ctx.lineTo(34, 8); ctx.closePath(); ctx.fill(); ctx.stroke();   /* the nose cone and bit */
  rr(34, -12, 30, 24, 4); ctx.fillStyle = '#e8821a'; ctx.fill(); ctx.stroke();
  rr(64, -14, 150, 28, 13); ctx.fillStyle = lg(0, -14, 0, 14, [[0, '#4a4f5c'], [.5, '#2b2f3a'], [1, '#1b1d26']]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(74, -9, 120, 4);
  ctx.strokeStyle = '#1b1d26'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(214, 0); ctx.bezierCurveTo(260, 0, 280, 40, 340, 40); ctx.stroke();   /* the cord */
  if (spin != null) { ctx.strokeStyle = `rgba(255,236,170,${.35 + .3 * Math.sin(spin)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 7 + 2 * Math.sin(spin * 2), 0, TAU); ctx.stroke(); }
  ctx.restore();
  mitt(hx, hy, ang, 1);
}
/* the rubber stamp: a black rubber face, a wooden dome handle; (x, y) = the centre of its face; the arm comes down from the top of the frame */
function stampTool(x, y, lift) {
  ctx.save(); ctx.translate(x, y - lift);
  sleeve(0, -150, PI / 2, 1400, 84);   /* from above: the wrist at y -150; the sleeve is drawn from behind the wrist (up) */
  ctx.restore();
  ctx.save(); ctx.translate(x, y - lift); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(20,12,6,.95)'; ctx.lineWidth = 3.4;
  rr(-96, -16, 192, 22, 6); ctx.fillStyle = '#23201f'; ctx.fill(); ctx.stroke();                         /* the rubber face */
  rr(-92, -46, 184, 34, 8); ctx.fillStyle = lg(0, -46, 0, -12, [[0, '#c98a4c'], [1, '#8e5a2c']]); ctx.fill(); ctx.stroke();   /* the wooden block */
  rr(-34, -120, 68, 80, 26); ctx.fillStyle = lg(-34, 0, 34, 0, [[0, '#a96d36'], [.5, '#d2995a'], [1, '#8e5a2c']]); ctx.fill(); ctx.stroke();   /* the knob */
  ctx.restore();
  mitt(x, y - lift - 88, PI / 2, 1.05);
}

// ------------------------------------------------------------------ Carrot's goggles (pushed up on the forehead) and the small engraver she holds in the wide shots
if (typeof EXT !== 'undefined' && EXT.acc && typeof V2C !== 'undefined') {
  EXT.acc.fp16_goggles = (o, k, t, layer) => {
    if (layer !== 'front') return;
    const y = k.eyeY - 54, ex = 26, r = 17;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = '#2a2d36'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-ex - r - 12, y + 3); ctx.lineTo(ex + r + 12, y + 3); ctx.stroke();
    for (const sx of [-1, 1]) { ell(sx * ex, y, r, r - 3); ctx.fillStyle = 'rgba(190,226,240,.9)'; ctx.fill(); ctx.strokeStyle = '#2a2d36'; ctx.lineWidth = 6; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(sx * ex - 5, y - 4, 5, 3); ctx.fill(); }
    ctx.fillStyle = '#2a2d36'; ctx.fillRect(-4, y - 2, 8, 6);
    ctx.restore();
  };
  V2C.ACC_CLS.fp16_goggles = 'face';
  EXT.prop.fp16_tool = (side, o, t) => {   /* the engraver held upright at the chest: nose up, a little forward, the cord hanging */
    ctx.save(); ctx.rotate(o.toolRot ?? -.35); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(14,14,20,.95)'; ctx.lineWidth = 3;
    ctx.fillStyle = lg(0, 0, 0, 30, [[0, '#d7dce4'], [1, '#7c8592']]); ctx.beginPath(); ctx.moveTo(0, -78); ctx.lineTo(-8, -46); ctx.lineTo(8, -46); ctx.closePath(); ctx.fill(); ctx.stroke();
    rr(-12, -46, 24, 24, 4); ctx.fillStyle = '#e8821a'; ctx.fill(); ctx.stroke();
    rr(-14, -22, 28, 120, 13); ctx.fillStyle = lg(-14, 0, 14, 0, [[0, '#4a4f5c'], [.5, '#2b2f3a'], [1, '#1b1d26']]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#1b1d26'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 98); ctx.bezierCurveTo(0, 150, 40, 150, 50, 190); ctx.stroke();
    ctx.restore();
  };
  PROP_BOX.fp16_tool = [-30, -84, 30, 110];
}

// ------------------------------------------------------------------ the cast: a body anchored by its bottom (hidden behind the bench) at x, scale s; acting is a function of scene time
const FACEK = o => KINDS[o.kind];
function mk(ctor, lt, p) {
  const o = ctor(Object.assign({ t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true }, p.o));
  o.s = p.s; o.x = p.x; o.y = p.bottom ?? 1075; o.lift = 0;
  if (p.yaw != null) { o.yaw = p.yaw; o.headYaw = p.headYaw ?? p.yaw; }
  return o;
}
const wobble = (lt, f, a, s0 = 0) => Math.sin(lt * f + s0) * a;
function actMelon(lt) {   /* Melon: pleased with himself; the flourish on "plaque" (word 1 of a1) and a hand on the chest on "Employee of the month" */
  const w1 = wS('a1', 1), sw = ss(lt, w1 - .22, w1 + .1) * (1 - ss(lt, w1 + .5, w1 + .85)), tail = ss(lt, w1 + .5, w1 + 1.1) * (1 - ss(lt, bE('a1') - .1, bE('a1') + .25));
  const arms = { l: mixA([.28, .25], [1.4, .2], tail * .6), r: mixA(mixA([.28, .25], [.15, 1.55], sw), [1.45, .12], tail) };
  return { o: { acc: ['suit'], expr: lt < 6 ? 'happy' : 'smug', arms: { l: arms.l, r: arms.r }, look: [.3, -.1], browUp: sw * 4 } };
}
function actCarrot(lt) {
  const ask = (lt > bS('ca1') && lt < bE('ca1') + .2) || (lt > bS('ca2') && lt < bE('ca2') + .2);
  const dn = lt > bS('b1') - .2 && lt < bS('ca2') ? 1 : 0;
  return { o: { expr: ask ? 'carrot_polite' : 'carrot_calm', look: [lt > bS('ca2') + .8 && lt < 5.6 ? .55 : -.5, ask ? -.1 : .05], acc: ['fp16_goggles'], arms: { l: 'rest', r: 'hold' }, grip: { r: [96, 34] }, hold: { r: 'fp16_tool' }, toolRot: .32 + .08 * Math.sin(lt * 2) } };
}
function actLemon(lt) {   /* deadpan: a beat of stare at Binder (eyes half closed, no blink to speak of) */
  return { o: { expr: 'neutral', lid: .45, look: [.7, -.05], arms: { l: 'rest', r: 'rest' } } };
}
function actStraw(lt) {
  const tired = lt > bS('s1') - .2;
  return { o: { expr: 'dead', lid: tired ? .5 : .55, look: [-.5, .05], arms: { l: 'rest', r: 'rest' } } };
}
/* Binder: hops and talks; "I love my job!" is a spin (yaw a full turn) with hearts; the grin on "Pending!" and the sting */
function bindOpts(lt, p) {
  const spin = ss(lt, bS('b3') + .05, bS('b3') + .85);
  const grin = Math.max(.3 + .1 * Math.sin(lt * 2.1), ss(lt, bS('b4') - .05, bS('b4') + .3), ss(lt, CUE.sting - .05, CUE.sting + .12));
  const pose = lt > bS('b3') && lt < bE('b3') + .2 ? 'cheer' : lt > bS('b2') && lt < bE('b2') ? 'thumb' : lt > CUE.sting ? 'helpful' : 'rest';
  const o = A15.binder({ x: p.x, y: p.y, s: p.s, center: true, t: lt, who: 'bind', pose, grin, glint: lt >= CUE.sting ? Math.max(0, Math.sin((lt - CUE.sting) * 6)) ** 4 : 0, look: p.look || [.2, .3], yaw: spin * TAU, bob: .5, hover: 0 });
  o.y = p.y + Math.sin(lt * 2.1) * 3 * p.s; return o;
}
function hearts(lt, cx, cy, s) {   /* "I love my job!": hearts float up from Binder */
  const t0 = bS('b3') + .12;
  for (let i = 0; i < 7; i++) {
    const b = t0 + i * .1, age = lt - b; if (age < 0 || age > 1.1) continue;
    const x = cx + (sr(i, 3) - .5) * 150 * s + Math.sin(age * 5 + i) * 14 * s, y = cy - 40 * s - age * 190 * s, sc = (.55 + .6 * sr(i, 4)) * s * (age < .15 ? age / .15 : 1), a = 1 - sg(age, .6, 1.1);
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate((sr(i, 7) - .5) * .6); ctx.scale(sc, sc);
    ctx.fillStyle = i % 2 ? '#ff4d73' : '#ff7a93'; ctx.strokeStyle = 'rgba(120,10,40,.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-34, -6, -22, -34, 0, -16); ctx.bezierCurveTo(22, -34, 34, -6, 0, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(-10, -14, 5, 3); ctx.fill(); ctx.restore();
  }
}

// ------------------------------------------------------------------ the shots: a camera (zoomTo: the world point at the frame centre, and the zoom), the cast and where it stands, the plaque's offset, the focus
const SHOTS = [];
const shot = (id, s, e, cam, o) => SHOTS.push(Object.assign({ id, s, e, cam }, o));
function shotAt(lt) { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s) r = sh; return r; }
shot('open', 0, .9, u => [540, 960, lerp(1, 1.035, u)], { cast: { melon: { x: 160, s: .72, yaw: .5 }, carrot: { x: 940, s: .76, yaw: -.5 } }, plq: 0, bind: { x: 540, s: .55 } });
shot('a1', .9, 2.6, u => [420, 985, lerp(1.2, 1.3, u)], { cast: { melon: { x: 140, s: .9, yaw: .38 } }, plq: 0, bind: { x: 540, s: .55 } });
shot('ca1', 2.6, 3.39, u => [540, 940, lerp(1, 1.05, u)], { cast: { carrot: { x: 540, s: 1.22, yaw: -.42 } }, dof: 5 });
shot('b1', 3.39, 4.0, u => [540, 1040, lerp(1.55, 1.6, u)], { cast: {}, plq: 0, bind: { x: 540, s: .55 }, tool: 1 });
shot('ca2', 4.0, 4.79, u => [540, 940, lerp(1.05, 1.1, u)], { cast: { carrot: { x: 540, s: 1.22, yaw: -.3, headYaw: -.1 } }, dof: 5 });
shot('b2', 4.79, 5.57, u => [540, 1040, lerp(1.55, 1.6, u)], { cast: {}, plq: 0, bind: { x: 540, s: .55 }, tool: 1 });
shot('l1', 5.57, 6.83, u => [540, 940, lerp(1, 1.06, u)], { cast: { lemon: { x: 300, s: 1.55, yaw: .5, headYaw: .75 } }, plq: 250, bind: { x: 790, s: .62 }, dof: 5 });
shot('b3', 6.83, 7.89, u => [540, 865, lerp(2, 2.08, u)], { cast: {}, plq: 0, bind: { s: .55 }, dof: 6 });
shot('s1', 7.89, 9.08, u => [540, 940, lerp(1, 1.06, u)], { cast: { straw: { x: 540, s: 1.5, yaw: -.4 } }, dof: 5 });
shot('b4', 9.08, 9.86, u => [540, 865, lerp(2, 2.08, u)], { cast: {}, plq: 0, bind: { s: .55 }, dof: 6 });
shot('st', 9.86, 10.455, u => [540, 1040, 1.6], { cast: {}, plq: 0, bind: { x: 540, s: .55 }, stamp: 1 });
shot('sp', 10.455, 10.855, u => [540, 940, lerp(1.04, 1.16, u)], { cast: { straw: { x: 540, s: 1.5, yaw: -.4 } }, dof: 5 });
shot('sg', 10.855, 12.5, u => [540, 865, lerp(2.0, 2.2, u)], { cast: {}, plq: 0, bind: { s: .55 }, dof: 6 });

// ------------------------------------------------------------------ the engraver's path: where the cut has got to on a line at time t
const LINES = {
  2: { str: 'BINDER', cy: PQL.l2, so: { size: 118, font: 'Bangers', weight: 900, spacing: 7 }, t0: ENG1.t0, t1: ENG1.t1 },
  3: { str: 'PRIZE: A DAY OFF', cy: PQL.l3, so: { size: 38, weight: 900, spacing: 1.6 }, t0: ENG2.t0, t1: ENG2.t1 },
};
function tipOf(line, t) {
  const L = LINES[line], u = sg(t, L.t0, L.t1), pw = prefixW(L.str, L.so), nf = u * L.str.length, n = Math.min(L.str.length - 1, Math.floor(nf));
  return [PQ.cx - pw[L.str.length] / 2 + lerp(pw[n], pw[n + 1], nf - n) + 3, L.cy + 4];
}
function activeLine(lt) { return lt >= ENG1.t0 && lt < ENG1.t1 + .05 ? 2 : lt >= ENG2.t0 && lt < ENG2.t1 + .05 ? 3 : 0; }

// ------------------------------------------------------------------ the world, far to near: wall, pegboard, lamp, the cast behind the bench, the bench, the plaque with Binder, the tools
function setLight(lt) {
  V2.setLight({ key: [.3, -.75], keyColor: '#ffe2a8', keyA: .3, rim: '#bcd4ff', rimA: .42, shadow: '#2a2038', shadowA: .34, bounce: '#ffd9a0', bounceA: .16, amb: '#fff0d8', ambA: .07 });
}
function drawWorld(lt) {
  const sh = shotAt(lt), on = lampOn(lt);
  const st = { shake: lt >= CUE.stamp ? pulse(lt, CUE.stamp, 38, .09) : 0, stamped: lt >= CUE.stamp };
  setLight(lt); V2.opts.reflect = false;
  const bg = () => { wall(lt); pegboard(lt); lamp(lt); };
  if (sh.dof) V2.dof(sh.dof, bg); else bg();
  if (on > .02) { V2.addLight({ x: LAMP.x, y: LAMP.y + 40, r: 1100, color: '255,226,160', a: .6 * on }); V2.beam(LAMP.x, LAMP.y + 50, 560, 1090, 60, 700, '255,226,150', .2 * on, 'screen'); }
  NOHERO = lt >= CUE.stamp - .24 && lt < CUE.stamp + .3;
  const C = sh.cast || {};
  if (C.melon) drawChar(mk(A9.melon, lt, Object.assign({ o: actMelon(lt).o }, C.melon)));
  if (C.lemon) drawChar(mk(A7.lemon, lt, Object.assign({ o: actLemon(lt).o }, C.lemon)));
  if (C.straw) drawChar(mk(A11.straw, lt, Object.assign({ o: actStraw(lt).o }, C.straw)));
  if (C.carrot) drawChar(mk(A15.carrot, lt, Object.assign({ o: actCarrot(lt).o }, C.carrot)));
  bench(lt);
  if (sh.plq != null) {
    ctx.save(); ctx.translate(sh.plq, 0);
    const ln = activeLine(lt);
    const info = plaque(lt, st, () => { if (sh.tool && ln) sparks(lt, LINES[ln].t0, LINES[ln].t1, u => tipOf(ln, u)); }); pendingInk(lt, st);
    const bs = sh.bind ? sh.bind.s : .55;
    drawChar(bindOpts(lt, { x: PQ.cx, y: PQ.y - BD_RY * bs + 8, s: bs }));
    hearts(lt, PQ.cx, PQ.y - BD_RY * bs + 8, bs * 1.6);
    if (sh.tool && ln) {
      const spin = lt * 90;
      const [tx, ty] = tipOf(ln, Math.min(lt, LINES[ln].t1));
      engraver(tx + 2, ty + 3 + Math.sin(lt * 120) * 1.4, PI + .26 + Math.sin(lt * 70) * .01, spin);
    }
    if (sh.stamp) {
      const age = lt - CUE.stamp, d0 = CUE.stamp - .3;
      const lift = lt < CUE.stamp ? 720 * (1 - easeIn(c01((lt - d0) / .3))) : 300 * ss(age, .05, .3);
      const sx = (info && st.pendBox) ? (st.pendBox.x0 + st.pendBox.x1) / 2 : PQ.cx + 100;
      stampTool(sx, PQL.l3 - 2, lt < d0 ? 900 : lift);
      if (age > 0 && age < .42) {
        const k = age / .42; ctx.strokeStyle = `rgba(255,240,190,${.8 * (1 - k)})`; ctx.lineWidth = 8 * (1 - k) + 2; ctx.beginPath(); ctx.ellipse(sx, PQL.l3, 40 + 230 * eo(k), 14 + 76 * eo(k), 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${.5 * (1 - k)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(sx, PQL.l3, 20 + 150 * eo(k), 8 + 50 * eo(k), 0, 0, TAU); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
const BD_RY = 92;

const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt), [x, y, z] = sh.cam(sg(lt, sh.s, sh.e)), shk = lt >= CUE.stamp ? pulse(lt, CUE.stamp, 34, .1) : 0;
    zoomTo(x + shk * 5, y + shk * 4, z);
  },
  draw(lt) { drawWorld(lt); },
  fx(lt) {
    const on = lampOn(lt), fx = { bloom: .4 + .55 * (lt >= CUE.click ? Math.exp(-(lt - CUE.click) * 8) : 0) + .25 * (lt >= CUE.stamp ? Math.exp(-(lt - CUE.stamp) * 10) : 0), vignette: .4, grain: .045, contrast: .14, sat: .12 };
    if (on < 1) { fx.fade = .45 * (1 - on); fx.fadeColor = '8,10,20'; }
    return fx;
  },
  blur(lt) {
    for (const sh of SHOTS) if (Math.abs(lt - sh.s) < .05) return 1;
    if (lt > CUE.stamp - .12 && lt < CUE.stamp + .03) return 8;
    return 2;
  },
  over(lt) { },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP16_SCENES = window.__EP16_SCENES || {};
window.__EP16_SCENES.prize = SC;
})();
