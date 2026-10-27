'use strict';
/* SHIFT HAPPENS, Episode 12: "The In-Service". Scene module: slides (3:02 PM, DIGNITY FIRST, 53.60 s).
 *
 * The Administrator presents the slides on the projector screen from a spot beside it, with a clicker. The audience sits between the camera and the table:
 * they are dark silhouettes seen from behind (they face the screen), so the picture is their light. Strawberry is in the front row; at "No." she turns
 * round in her chair and the room goes still on her face. She stands for the second "No.", and the room sees the blank slide with the dash.
 *
 * Shots (scene-local seconds; the beat names are the script's):
 *   0.00 open: wide on the screen; the screen comes down (0.2..1.0), the first clack at 0.5: slide DIGNITY FIRST
 *   1.50 a1 wide (a slow push) | 6.88 s2 clack: slide 2 (a clock icon) | 10.79 c2 Clementine's raised hand, a pan to her ("Sure!")
 *  12.81 s3 clack: slide 3 (TEAMWORK) | 19.32 s4 clack: slide 4 (OUR BUDGET, the pie); 21.70 chart: a push-in, the pizza slice swells (boing)
 *  26.15 quiz1 clack: a push-in on the screen, QUIZ question 1 (the timer ring) | 37.13 quiz2 clack: question 2, the ticks (0.2, 0.7, 1.2)
 *  38.18 a10: INSERT on the answer bubbles (YES, YES, LET ME CHECK MY CONTRACT) | 43.81 s5 "Let me check my contract." (the bubble is struck)
 *  47.17 s6 "No.": Strawberry turns round (the turn at 46.9..47.15), a close-up on her face; 47.72..49.02 silence: hold on her face, her eyes move once to the Administrator (48.2)
 *  49.07 a12 "Excuse me?": a two-shot (Strawberry seated, the Administrator shocked) | 49.95 the blank slide with the dash | 50.08 s7 "No.": Strawberry stands; the two-shot holds
 *  52.25 end: the screen goes dark (sting 0.1).
 * Layout (the room set S12room, the same room as signin): the audience row at Z 560: Lemon X -240 (clipboard), Mango X 0 (leaning in), Strawberry X 240 (front row),
 * Clementine X 480 (raised hand); empty chairs at X -480 and X 480 are not in the audience. The screen: X -400..400, picture Y 337..900, Z 1296. The Administrator stands on a
 * low platform (the riser, X 460..660, Z 1000..1120, 110 units high) at X 520, Z 1040, beside the screen's right edge, so his face stays clear of the audience's heads.
 */
(() => {
if (!window.TIMELINE_EP12) return;
const R = window.S12room, H = window.H6;
const { zoomTo, faceZoom, faceC, inB } = H;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11;
const { p2 } = V2;
const { box3 } = window.S6;

// ------------------------------------------------------------------ helpers (sk: the eased segment, as in ep11_orient.js)
const sk = (t, a, b) => easeIO(seg(t, a, b));
const beat = id => CUR.beats[id];
const tS = id => beat(id).s;
const AUD_Z = 560;
const AUD = { lemon: -240, mango: 0, straw: 240, clem: 480 };
const ADMIN = [520, 1040];
const SCREEN_T = { ...R.LAY.screen };
const SLT = { lt: 0 };   // the scene time for the screen's paint hook (set in draw)

// ------------------------------------------------------------------ the cast
// the audience: a silhouette from behind (no face), seated on the audience chair
const seatOf = X => R.seatPt(X, AUD_Z);
function silOpts(X, extra) { const p = seatOf(X); return Object.assign({ x: p.x, y: p.y, s: p.s, noLegs: true, noFace: true, lift: 0, noShadow: true, noReflect: true }, extra); }
function bodyLemonSil() { return A7.lemon(silOpts(AUD.lemon, { hold: { l: 'clipboard6' }, grip: { l: [-30, 36] }, arms: { l: 'hold', r: 'rest' } })); }
function bodyMangoSil() { return A7.mango(silOpts(AUD.mango, { y: seatOf(AUD.mango).y + 12, arms: { l: 'rest', r: 'rest' } })); }
function bodyClemSil() { return A10.clem(silOpts(AUD.clem, { arms: { l: 'rest', r: 'up' } })); }
// Strawberry: a silhouette until she turns round at "No."; then a front-facing figure in her seat, and on her feet at the end
const turnK = lt => sk(lt, 46.9, 47.15);
const standK = lt => sk(lt, tS('s7') - .14, tS('s7') + .35);
function bodyStraw(lt) {
  const st = standK(lt);
  const front = turnK(lt) >= .5 || st > 0;
  const X = lerp(AUD.straw, 200, st), p = R.seatPt(X, AUD_Z);   /* she stands and eases 40 units left, clear of the Administrator */
  const o = { x: p.x, y: lerp(p.y, R.pt(X, 0, AUD_Z).y, st), s: p.s, noLegs: st < .5, lift: 0, arms: { l: 'rest', r: 'rest' } };
  if (!front) return A11.straw(Object.assign(o, { noFace: true, noShadow: true, noReflect: true }));
  // her face: "No." (seated), the silence, her eyes to the Administrator, then standing
  if (st > 0) return A11.straw(Object.assign(o, { expr: 'sour', look: [.2, 0], lid: .5 }));
  const eyes = sk(lt, 48.2, 48.5) * .6;   /* her eyes move once, to the Administrator (on his right) */
  return A11.straw(Object.assign(o, { expr: lt < 47.6 ? 'dead' : 'sour', look: [eyes, 0], lid: .5 }));
}
const RISER = 110;   /* the platform beside the screen: the Administrator stands on it, his face clear of the audience's heads */
function bodyAdmin(lt) {
  const o = R.pt(ADMIN[0], RISER, ADMIN[1]);
  const base = { x: o.x, y: o.y, s: o.s * 1.22, who: 'melon', expr: 'happy', look: [0, 0], arms: { l: 'hips', r: 'point' }, hold: { r: 'remote12' }, grip: { r: [96, 30] } };
  if (lt >= tS('a12') - .02 && lt < tS('a12') + .9) Object.assign(base, { expr: 'shock', arms: { l: 'hips', r: 'point' }, grip: { r: [100, 74] } });
  if (lt >= tS('a13') - .02) Object.assign(base, { expr: 'happy', arms: { l: 'hips', r: 'point' } });
  return A9.melon(base);
}

// ------------------------------------------------------------------ the slides: one design (1000 x 670, scaled to the screen; the text sizes keep the headline above 40 px and the body above 30 px on the phone frame)
function slideAt(lt) {
  if (lt < tS('s2') - .05) return 0;     // DIGNITY FIRST (slide 1)
  if (lt < tS('s3') - .05) return 1;     // slide 2: call lights
  if (lt < tS('s4') - .05) return 2;     // slide 3: teamwork
  if (lt < tS('quiz1') - .05) return 3;  // slide 4: our budget (the pie)
  if (lt < tS('quiz2') - .05) return 4;  // quiz, question 1
  if (lt < tS('a12') + .88) return 5;    // quiz, question 2 (the bubbles, struck through on s5)
  if (lt < tS('end') - .05) return 6;    // the blank slide with the dash ("There is no slide for no.")
  return 7;                              // dark: the end
}
const NAVY = '#1f2b5c', INK = '#2a2440', RED = '#d62a3a', ORANGE = '#f08a24', GREY = '#8d89a0';
function bubble(x, y, w, h, label, o = {}) {
  ctx.save(); ctx.fillStyle = o.fill || '#ffffff'; ctx.strokeStyle = o.stroke || INK; ctx.lineWidth = 5;
  rr(x, y, w, h, h / 2); ctx.fill(); ctx.stroke();
  text(label, x + w / 2, y + h / 2 + 2, { size: o.size || 52, font: 'Nunito', weight: 900, fill: o.ink || INK, align: 'center' });
  ctx.restore();
}
function ringTimer(cx, cy, r, frac) {
  ctx.save(); ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(42,36,64,.16)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(frac)); ctx.stroke();
  ctx.restore();
}
// the paint hook of the screen: the slide in design units, scaled to the rectangle (x, y, w, h in scene px)
function drawSlide(x, y, w, h, t) {
  const lt = SLT.lt, idx = slideAt(lt);
  const s = w / 1000, Hd = h / s;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#fdfbf4'; ctx.fillRect(0, 0, 1000, Hd);
  if (idx === 7) { ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, 1000, Hd); ctx.restore(); return; }
  if (idx === 0) {
    text('DIGNITY FIRST', 500, 230, { size: 128, font: 'Bangers', weight: 400, fill: NAVY, align: 'center', lw: 8, stroke: '#ffffff' });
    text('Slide 1: Residents are people.', 500, 380, { size: 66, font: 'Nunito', weight: 900, fill: INK, align: 'center' });
    ctx.fillStyle = NAVY; ctx.fillRect(160, 440, 680, 8);
  } else if (idx === 1) {
    text('Slide 2:', 60, 130, { size: 60, font: 'Nunito', weight: 900, fill: GREY, align: 'left' });
    text('Answer every call light', 60, 290, { size: 66, font: 'Nunito', weight: 900, fill: INK, align: 'left' });
    text('within 2 minutes.', 60, 380, { size: 66, font: 'Nunito', weight: 900, fill: INK, align: 'left' });
    // a clock icon: two o'clock, 2 minutes
    ctx.save(); ctx.translate(810, 480); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 12; ell(0, 0, 112, 112); ctx.fill(); ctx.stroke();
    ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -80); ctx.moveTo(0, 0); ctx.lineTo(54, 20); ctx.stroke(); ctx.restore();
    text('2 min', 810, 680, { size: 58, font: 'Nunito', weight: 900, fill: RED, align: 'center' });
  } else if (idx === 2) {
    text('TEAMWORK.', 500, 190, { size: 124, font: 'Bangers', weight: 400, fill: RED, align: 'center', lw: 8, stroke: '#ffffff' });
    text('We are a family.', 500, 320, { size: 80, font: 'Nunito', weight: 900, fill: INK, align: 'center' });
    const fr = [['#e8192c', 'straw'], ['#ffd60a', 'lemon'], ['#ff8a1a', 'mango']];
    fr.forEach(([c, k], i) => { const cx = 260 + i * 240, cy = 500; ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 6; ell(cx, cy, 78, 84); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2b8a3e'; ell(cx - 30, cy - 80, 22, 10); ctx.fill(); ell(cx + 30, cy - 80, 22, 10); ctx.fill(); });
  } else if (idx === 3) {
    text('OUR BUDGET', 500, 120, { size: 102, font: 'Bangers', weight: 400, fill: NAVY, align: 'center', lw: 6, stroke: '#ffffff' });
    const cx = 340, cy = 430, r = 185, pulse = 1 + .12 * (lt > tS('chart') && lt < tS('chart') + .9 ? Math.sin((lt - tS('chart')) * 16) * Math.exp(-(lt - tS('chart')) * 3.2) : 0);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#c8c3d6'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ell(0, 0, r, r); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * .97); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d23a2a'; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + TAU * (.1 + i * .095), rr2 = r * (.45 + (i % 3) * .18); ell(Math.cos(a) * rr2, Math.sin(a) * rr2, 14, 14); ctx.fill(); }
    ctx.restore();
    text('97%', 340, 430, { size: 64, font: 'Bangers', weight: 400, fill: '#ffffff', align: 'center', lw: 6, stroke: INK });
    text('pizza', 340, 660, { size: 60, font: 'Nunito', weight: 900, fill: INK, align: 'center' });
    text('3%', 630, 400, { size: 64, font: 'Nunito', weight: 900, fill: INK, align: 'left' });
    text('staff', 630, 470, { size: 58, font: 'Nunito', weight: 900, fill: GREY, align: 'left' });
    text('budget', 630, 536, { size: 58, font: 'Nunito', weight: 900, fill: GREY, align: 'left' });
  } else if (idx === 4) {
    text('QUIZ', 500, 110, { size: 110, font: 'Bangers', weight: 400, fill: NAVY, align: 'center', lw: 6, stroke: '#ffffff' });
    text('Question 1', 60, 210, { size: 58, font: 'Nunito', weight: 900, fill: GREY, align: 'left' });
    text('You are on your break.', 60, 300, { size: 64, font: 'Nunito', weight: 900, fill: INK, align: 'left' });
    text('What do you do?', 60, 380, { size: 64, font: 'Nunito', weight: 900, fill: INK, align: 'left' });
    const left = clamp(1 - (lt - tS('quiz1')) / 5.0);
    ringTimer(860, 150, 62, left);
    ['A', 'B', 'C'].forEach((L, i) => { const cx = 210 + i * 290, cy = 530; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ell(cx, cy, 100, 100); ctx.fill(); ctx.stroke(); text(L, cx, cy + 4, { size: 96, font: 'Bangers', weight: 400, fill: NAVY, align: 'center' }); });
  } else if (idx === 5) {
    text('QUIZ', 500, 110, { size: 110, font: 'Bangers', weight: 400, fill: NAVY, align: 'center', lw: 6, stroke: '#ffffff' });
    text('Question 2', 60, 210, { size: 58, font: 'Nunito', weight: 900, fill: GREY, align: 'left' });
    text('Stay late?', 60, 300, { size: 76, font: 'Nunito', weight: 900, fill: INK, align: 'left' });
    const ticks = [tS('quiz2') + .2, tS('quiz2') + .7, tS('quiz2') + 1.2];
    const nT = ticks.filter(tt => lt >= tt).length;
    ringTimer(860, 150, 62, 1 - nT / 3);
    const hit = lt >= tS('s5') - .05;
    bubble(60, 380, 880, 92, 'YES');
    bubble(60, 500, 880, 92, 'YES');
    bubble(60, 620, 880, 92, 'LET ME CHECK MY CONTRACT', { fill: hit ? '#ffe6e6' : '#ffffff', stroke: hit ? RED : INK, ink: hit ? RED : INK, size: 54 });
    if (hit) { ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(90, 666); ctx.lineTo(910, 666); ctx.stroke(); ctx.restore(); }
  } else if (idx === 6) {
    text('—', 500, Hd / 2, { size: 180, font: 'Nunito', weight: 900, fill: '#b8b4c4', align: 'center' });
  }
  ctx.restore();
  // the glow the picture puts on the room (a soft screen blend over the screen rectangle)
  if (idx < 7) V2.glow(x + w / 2, y + h / 2, w * .75, '255,250,236', .05, 'screen', .3);
}

// ------------------------------------------------------------------ the world: the room, the audience silhouettes, the Administrator, Strawberry
function world(lt) {
  R.cam();
  R.light({ key: [-.4, -.85], keyA: .22 });
  R.shell({ flick: lt });
  R.back({ min: 2, hr: 3 });
  SLT.lt = lt;
  R.screen({ down: seg(lt, .2, 1.0), drawSlide, t: lt });
  // the chairs of the audience (under the silhouettes) and the table between them and the screen
  for (const X of [-480, -240, 0, 240, 480]) R.chair(X, AUD_Z, {});
  R.table({ t: lt });
  // the platform, then the Administrator beside the screen (a soft neighbour in a close-up of someone else)
  const sh = shotOf(lt), focus = FOCUS[sh], admin = bodyAdmin(lt);
  box3({ x0: 460, x1: 660, y0: 0, y1: RISER, z0: 1000, z1: 1120, color: '#7a5a3a', top: '#9b7450', front: '#654a2e', side: '#55402a', lw: 2 });
  if (focus && !focus.includes('admin')) V2.dof(7, () => H.drawBg(admin)); else drawChar(admin);
  // the audience: silhouettes, all in one flat dark fill. Strawberry is a silhouette until she turns round
  const straw = bodyStraw(lt);
  R.silhouettes(() => {
    const sil = [['lemon', bodyLemonSil()], ['mango', bodyMangoSil()], ['clem', bodyClemSil()]];
    if (turnK(lt) < .5 && standK(lt) <= 0) sil.push(['straw', straw]);
    for (const [id, o] of sil) {
      if (focus && !focus.includes(id)) V2.dof(7, () => { ctx.save(); H.drawBg(o); ctx.restore(); });
      else drawChar(o);
    }
  });
  if (turnK(lt) >= .5 || standK(lt) > 0) {
    if (focus && !focus.includes('straw')) V2.dof(7, () => H.drawBg(straw)); else drawChar(straw);
  }
}
// which of the cast is in focus in each shot (a soft neighbour is blurred and left out of the layout audit)
const FOCUS = { cuC2: ['clem'], close: ['straw'], a12: ['straw', 'admin'], s7: ['straw', 'admin'], chart: [], quiz1: [] };

// ------------------------------------------------------------------ the inserts: the answer bubbles, large (flat, in place of the world)
function insertBubbles(lt) {
  const pop = easeOut(seg(lt, tS('a10') - .02, tS('a10') + .2));
  ctx.save(); ctx.fillStyle = '#16121f'; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.translate(540, 760); ctx.scale(lerp(.94, 1, pop), lerp(.94, 1, pop)); ctx.rotate(-.01);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(-470 + 14, -360 + 18, 940, 720, 18); ctx.fill();
  ctx.fillStyle = '#fdfbf4'; rr(-470, -360, 940, 720, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(25,16,30,.5)'; ctx.lineWidth = 4; rr(-470, -360, 940, 720, 18); ctx.stroke();
  text('QUIZ  ·  QUESTION 2', -420, -300, { size: 40, font: 'Nunito', weight: 900, fill: GREY, align: 'left' });
  text('Stay late?', -420, -220, { size: 80, font: 'Nunito', weight: 900, fill: INK, align: 'left' });
  const hit = lt >= tS('s5') - .05, ticks = [tS('quiz2') + .2, tS('quiz2') + .7, tS('quiz2') + 1.2];
  ringTimer(330, -220, 56, 1 - ticks.filter(tt => lt >= tt).length / 3);
  const rows = [['YES', -120], ['YES', 10], ['LET ME CHECK MY CONTRACT', 140]];
  rows.forEach(([lab, y], i) => {
    const on = i === 2 && hit;
    ctx.save(); ctx.fillStyle = on ? '#ffe6e6' : '#ffffff'; ctx.strokeStyle = on ? RED : INK; ctx.lineWidth = 7;
    rr(-420, y - 52, 840, 104, 52); ctx.fill(); ctx.stroke(); ctx.restore();
    text(lab, 0, y + 2, { size: i === 2 ? 46 : 72, font: 'Nunito', weight: 900, fill: on ? RED : INK, align: 'center' });
  });
  if (hit) { ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-400, 140); ctx.lineTo(400, 140); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the scene object
const SC = {
  shot: lt => shotOf(lt),
  cam(lt) {
    const sh = shotOf(lt);
    R.cam();
    const scr = { x: 540 + ((R.LAY.screen.x0 + R.LAY.screen.x1) / 2) * R.kzP(R.LAY.screen.z), y: 860 + (700 - (R.LAY.screen.yTop + R.LAY.screen.yBot) / 2) * R.kzP(R.LAY.screen.z) };
    if (sh === 'wide' || sh === 'open') zoomTo(560, 1200, 1.25 + .02 * sk(lt, 0, 1.6));
    else if (sh === 'cuC2') { const p = seatOf(AUD.clem); zoomTo(p.x, p.y - 260, 1.8); }
    else if (sh === 'chart') { zoomTo(scr.x - 60, scr.y + 40, 2.1); }
    else if (sh === 'quiz1' || sh === 'push') { zoomTo(scr.x, scr.y - 40, 2.0); }
    else if (sh === 'bubbles') { zoomTo(540, 900, 1); }
    else if (sh === 'close') { const z = 2.4 + .08 * sk(lt, shotStart('close'), shotStart('close') + 2); const o = seatOf(AUD.straw); faceZoom({ kind: 'straw', x: o.x, y: o.y, s: o.s, noLegs: true, lift: 0 }, z, 150); }
    else if (sh === 'a12' || sh === 's7') { const a = faceC({ kind: 'melon', x: R.pt(ADMIN[0], 0, ADMIN[1]).x, y: R.pt(ADMIN[0], 0, ADMIN[1]).y, s: R.pt(ADMIN[0], 0, ADMIN[1]).s * 1.22 }), o = seatOf(AUD.straw); const b = faceC({ kind: 'straw', x: o.x, y: lerp(o.y, R.pt(AUD.straw, 0, AUD_Z).y, standK(lt)), s: o.s, noLegs: standK(lt) < .5, lift: 0 }); zoomTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 90, 1.55); }
    else if (sh === 'end') zoomTo(560, 1200, 1.25);
    else zoomTo(560, 1200, 1.25);
  },
  draw(lt) {
    const sh = shotOf(lt);
    if (sh === 'bubbles') { insertBubbles(lt); return; }
    world(lt);
  },
  fx: lt => ({ bloom: .42, vignette: .36, grain: .04, contrast: .12, sat: .08, tint: [['#ffe6b8', .08, 'soft-light']] }),
  blur: lt => (shotOf(lt) === 'bubbles' ? 1 : 1),
  over() {},
};
// the shot in force at scene time lt: cuts land on the beat starts
const SHOTS = () => [
  ['open', 0], ['a1', tS('a1')], ['cuC2', tS('c2') - .05], ['wide', tS('c2') + .45], ['chart', tS('chart') - .05], ['wide2', tS('s2b') + .05],
  ['quiz1', tS('quiz1') - .05], ['wide3', tS('a7') + 4.0 + .05], ['bubbles', tS('a10') - .02], ['wide4', tS('s5') + .05],
  ['close', 46.9], ['a12', tS('a12') - .05], ['s7', tS('s7') - .05], ['end', tS('end') - .05],
];
// shotOf: the last shot whose start has passed
function shotOf(lt) { let n = 'open'; for (const [k, t0] of SHOTS()) if (lt >= t0) n = k; return n; }
function shotStart(n) { const s = SHOTS().find(([k]) => k === n); return s ? s[1] : 0; }
SC.shot = lt => shotOf(lt);

window.__EP12_SCENES = window.__EP12_SCENES || {};
window.__EP12_SCENES.slides = SC;
})();
