'use strict';
/* SHIFT HAPPENS, Episode 12: "The In-Service". Scene module: slides (3:02 PM, DIGNITY FIRST, 53.60 s).
 *
 * The Administrator presents the slides on the projector screen from a riser beside it, with a clicker. The audience sits between the camera and the screen:
 * they are soft navy silhouettes seen from behind (they face the screen, and its light rims their heads), so the picture is their light. Strawberry is in the front row; at "No." she turns
 * round in her chair and the room goes still on her face. She stands for the second "No.", and the room sees the blank slide with the dash.
 *
 * Shots (scene-local seconds; the beat names are the script's):
 *   0.00 open: wide on the screen; the screen comes down (0.2..1.0), the first clack at 0.5: slide DIGNITY FIRST
 *   1.50 a1 wide (a slow push) | 6.88 s2 clack: slide 2 (a clock icon) | 10.79 c2 Clementine's raised hand, a cut to her ("Sure!")
 *  12.81 s3 clack: slide 3 (TEAMWORK) | 19.32 s4 clack: slide 4 (OUR BUDGET, the pie); 21.70 chart: a push-in, the pizza slice swells (boing)
 *  26.15 quiz1 clack: a push-in on the screen, QUIZ question 1 (the timer ring) | 37.13 quiz2 clack: question 2, the ticks (0.2, 0.7, 1.2)
 *  38.18 a10: INSERT on the answer buttons (YES, YES, LET ME CHECK MY CONTRACT) | 43.81 s5 "Let me check my contract." (the button is struck)
 *  47.17 s6 "No.": Strawberry turns round (the turn at 46.9..47.15), a close-up on her face; 47.72..49.02 silence: hold on her face, her eyes move once to the Administrator (48.2)
 *  49.07 a12 "Excuse me?": a two-shot (Strawberry seated, the Administrator shocked) | 49.95 the blank slide with the dash | 50.08 s7 "No.": Strawberry stands; the two-shot holds
 *  52.25 end: the screen goes dark (sting 0.1).
 *
 * Layout (the room set S12room, the same room as signin; the alignment pass):
 *   The audience is one row of four at Z 760, an even pitch of 215 (Lemon X -382, Mango -167, Clementine 48, Strawberry 263), small and dark: they stay clear of the screen (the screen's lower edge is
 *   above every head) and of the Administrator, who stands on a riser (X 590..790, Z 1060..1180, 110 high) at X 690, Z 1120, right of the screen. The table is not in this scene (it would hide the row).
 *   The wide shots are framed on the whole group (the row and the Administrator), nobody cut by an edge. A close-up shows only the people it is about: a neighbour is drawn only when the WHOLE of
 *   him is in the frame, so there are no half-cut or blurred figures at the edge of a shot. The text on the screen is drawn only when the whole picture is in the frame (a cut-off slide shows blank).
 */
(() => {
if (!window.TIMELINE_EP12) return;
const R = window.S12room, HP = window.H6;   /* (not H: that is the frame height) */
const { zoomTo, faceZoom, faceC, inB } = HP;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A12 = window.A12;
const { p2 } = V2;
const { box3 } = window.S6;

// ------------------------------------------------------------------ helpers (sk: the eased segment, as in ep11_orient.js)
const sk = (t, a, b) => easeIO(seg(t, a, b));
const beat = id => CUR.beats[id];
const tS = id => beat(id).s;
const AUD_Z = 760;
const AUD = { lemon: -382, mango: -167, clem: 48, straw: 263 };   /* an even pitch of 215 */
const ADMIN = [690, 1120];
const RISER = 110;   /* the platform beside the screen: the Administrator stands on it, his face clear of the audience's heads */
const WIDE = { x: 620, y: 1070, z: 1.0 };
const SIL_S = .92;   /* the audience is drawn a little smaller than the chairs they sit on: they read as a row of people, not a wall */
const SLT = { lt: 0, down: 1 };   // the scene time for the screen's paint hook (set in draw)

// ------------------------------------------------------------------ the cast
// the audience: a silhouette from behind (no face), seated on the audience chair
const seatOf = X => R.seatPt(X, AUD_Z);
function silOpts(X, extra) { const p = seatOf(X); return Object.assign({ x: p.x, y: p.y, s: p.s * SIL_S, noLegs: true, noFace: true, lift: 0, noShadow: true, noReflect: true }, extra); }
function bodyLemonSil() { return A7.lemon(silOpts(AUD.lemon, { hold: { l: 'clipboard6' }, grip: { l: [-30, 36] }, arms: { l: 'hold', r: 'rest' } })); }
function bodyMangoSil() { return A7.mango(silOpts(AUD.mango, { y: seatOf(AUD.mango).y + 12 * seatOf(AUD.mango).s, arms: { l: 'rest', r: 'rest' } })); }
function bodyClemSil() { return A10.clem(silOpts(AUD.clem, { arms: { l: 'rest', r: 'up' } })); }
// Strawberry: a silhouette until she turns round at "No."; then a front-facing figure in her seat, and on her feet at the end
const turnK = lt => sk(lt, 46.9, 47.15);
const standK = lt => sk(lt, tS('s7') - .14, tS('s7') + .35);
function bodyStraw(lt) {
  const st = standK(lt);
  const front = turnK(lt) >= .5 || st > 0;
  const X = lerp(AUD.straw, AUD.straw - 40, st), p = R.seatPt(X, AUD_Z);   /* she stands and eases 40 units left */
  /* the turn: a squash through zero on the chair (sx 1 -> .04 -> 1), the back view swapping to the front at the middle */
  const tk = turnK(lt), sx = st > 0 ? 1 : Math.max(.04, Math.abs(1 - 2 * tk));
  const o = { x: p.x, y: lerp(p.y, R.pt(X, 0, AUD_Z).y, st), s: p.s, noLegs: st < .5, lift: 0, sx, arms: { l: 'rest', r: 'rest' } };
  if (!front) return A11.straw(Object.assign(o, { noFace: true, noShadow: true, noReflect: true }));
  // her face: "No." (seated), the silence, her eyes to the Administrator, then standing
  if (st > 0) return A11.straw(Object.assign(o, { expr: 'sour', look: [.2, 0], lid: .5 }));
  const eyes = sk(lt, 48.2, 48.5) * .6;   /* her eyes move once, to the Administrator (on his right) */
  return A11.straw(Object.assign(o, { expr: lt < 47.6 ? 'dead' : 'sour', look: [eyes, 0], lid: .5 }));
}
function bodyAdmin(lt) {
  const o = R.pt(ADMIN[0], RISER, ADMIN[1]);
  const base = { x: o.x, y: o.y, s: o.s * 1.22, who: 'melon', expr: 'happy', look: [0, 0], arms: { l: 'hips', r: 'point' }, hold: { r: 'remote12' }, grip: { r: [96, 30] } };
  if (lt >= tS('a12') - .02 && lt < tS('a12') + .9) Object.assign(base, { expr: 'shock', arms: { l: 'hips', r: 'point' }, grip: { r: [100, 74] } });
  if (lt >= tS('a13') - .02) Object.assign(base, { expr: 'happy', arms: { l: 'hips', r: 'point' } });
  return A9.melon(base);
}

// ------------------------------------------------------------------ the slides: one design (1000 x ~700, scaled to the screen). The text is set by the UI kit: nothing is placed by guess,
// every hero string is at least 70 design units (about 31 px on the phone in the wide shot) and every string is shrunk to its line, never squeezed
function slideAt(lt) {
  if (lt < tS('s2') - .05) return 0;     // DIGNITY FIRST (slide 1)
  if (lt < tS('s3') - .05) return 1;     // slide 2: call lights
  if (lt < tS('s4') - .05) return 2;     // slide 3: teamwork
  if (lt < tS('quiz1') - .05) return 3;  // slide 4: our budget (the pie)
  if (lt < tS('quiz2') - .05) return 4;  // quiz, question 1
  if (lt < tS('a12') + .88) return 5;    // quiz, question 2 (the answers, struck through on s5)
  if (lt < tS('end') - .05) return 6;    // the blank slide with the dash ("There is no slide for no.")
  return 7;                              // dark: the end
}
const NAVY = '#1f2b5c', INK = '#2a2440', RED = '#d62a3a', ORANGE = '#f08a24', GREY = '#8d89a0';
// an answer button: a pill panel and its label, centred in it by the kit (the label is verified against the pill); struck through once chosen
function answerBtn(x, y, w, h, label, o = {}) {
  const id = o.id || 'ans' + Math.round(y);
  UI.panel([x, y, w, h], { fill: o.fill || '#ffffff', stroke: o.stroke || INK, lw: o.lw || 5, r: h / 2, id, kind: 'pill', pad: h * .22 });
  const lo = { size: o.size || 54, fill: o.ink || INK, maxW: w - h * .9, cid: id, center: true, hero: o.hero };
  if (o.strike) UI.strike(label, x + w / 2, y + h / 2, Object.assign(lo, { line: RED, k: o.strike }));
  else UI.label(label, x + w / 2, y + h / 2, lo);
}
function ringTimer(cx, cy, r, frac) {
  ctx.save(); ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(42,36,64,.16)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(frac)); ctx.stroke();
  ctx.restore();
}
// the paint hook of the screen: the slide in design units, scaled to the rectangle (x, y, w, h in scene px). When the frame would slice the picture, the screen is a blank white sheet
function drawSlide(x, y, w, h, t) {
  const lt = SLT.lt, idx = slideAt(lt);
  const s = w / 1000, Hd = h / s;
  const bx = A12.box(x, y, x + w, y + h), whole = A12.whole(bx, 28) && A12.clear(bx);   /* before the scale: the camera is the only transform */
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#fdfbf4'; ctx.fillRect(0, 0, 1000, Hd);
  if (idx === 7) { ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, 1000, Hd); ctx.restore(); return; }
  if (!whole) { ctx.restore(); return; }   /* the frame would slice the picture: the screen is a plain lit sheet, with no half of a timer ring or a clock on it */
  const rolling = SLT.down < 1;   /* while the screen is still coming down its picture is revealed from the top: the text is cut by the roll on purpose */
  const L = (str, cx, cy, o = {}) => { if (whole) UI.label(str, cx, cy, Object.assign({ fill: INK, maxW: 900, crop: rolling }, o)); };
  const left = (str, cy, o = {}) => L(str, 60, cy, Object.assign({ align: 'left' }, o));
  if (idx === 0) {
    L('DIGNITY FIRST', 500, 200, { size: 128, font: 'Bangers', fill: NAVY, lw: 8, stroke: '#ffffff' });
    L('Slide 1:', 500, 330, { size: 70, fill: GREY });
    L('Residents are people.', 500, 410, { size: 70 });
    ctx.fillStyle = NAVY; ctx.fillRect(160, 480, 680, 8);
  } else if (idx === 1) {
    left('Slide 2:', 120, { size: 70, fill: GREY });
    left('Answer every call light', 280, { size: 70 });
    left('within 2 minutes.', 370, { size: 70 });
    // a clock icon: two o'clock, 2 minutes
    ctx.save(); ctx.translate(800, 490); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 12; ell(0, 0, 112, 112); ctx.fill(); ctx.stroke();
    ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -80); ctx.moveTo(0, 0); ctx.lineTo(54, 20); ctx.stroke(); ctx.restore();
    L('2 min', 800, 650, { size: 70, fill: RED });
  } else if (idx === 2) {
    L('TEAMWORK.', 500, 160, { size: 124, font: 'Bangers', fill: RED, lw: 8, stroke: '#ffffff' });
    L('We are a family.', 500, 300, { size: 80 });
    const fr = [['#e8192c', 'straw'], ['#ffd60a', 'lemon'], ['#ff8a1a', 'mango']];
    fr.forEach(([c, k], i) => { const cx = 260 + i * 240, cy = 500; ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 6; ell(cx, cy, 78, 84); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2b8a3e'; ell(cx - 30, cy - 80, 22, 10); ctx.fill(); ell(cx + 30, cy - 80, 22, 10); ctx.fill(); });
  } else if (idx === 3) {
    L('OUR BUDGET', 500, 110, { size: 102, font: 'Bangers', fill: NAVY, lw: 6, stroke: '#ffffff' });
    const cx = 340, cy = 420, r = 175, pulse = 1 + .12 * (lt > tS('chart') && lt < tS('chart') + .9 ? Math.sin((lt - tS('chart')) * 16) * Math.exp(-(lt - tS('chart')) * 3.2) : 0);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#c8c3d6'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ell(0, 0, r, r); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * .97); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d23a2a'; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + TAU * (.1 + i * .095), rr2 = r * (.45 + (i % 3) * .18); ell(Math.cos(a) * rr2, Math.sin(a) * rr2, 14, 14); ctx.fill(); }
    ctx.restore();
    L('97%', cx, cy, { size: 72, font: 'Bangers', fill: '#ffffff', lw: 6, stroke: INK });
    L('pizza', cx, 650, { size: 70 });
    L('3%', 600, 380, { size: 76, align: 'left' });
    L('staff', 600, 460, { size: 70, fill: GREY, align: 'left' });
    L('budget', 600, 540, { size: 70, fill: GREY, align: 'left' });
  } else if (idx === 4) {
    L('QUIZ', 500, 100, { size: 110, font: 'Bangers', fill: NAVY, lw: 6, stroke: '#ffffff' });
    left('Question 1', 205, { size: 70, fill: GREY });
    left('You are on your break.', 295, { size: 70 });
    left('What do you do?', 380, { size: 70 });
    const frac = clamp(1 - (lt - tS('quiz1')) / 5.0);
    ringTimer(860, 150, 62, frac);
    ['A', 'B', 'C'].forEach((Lt, i) => { const cx = 210 + i * 290, cy = 540; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ell(cx, cy, 100, 100); ctx.fill(); ctx.stroke(); L(Lt, cx, cy, { size: 100, font: 'Bangers', fill: NAVY }); });
  } else if (idx === 5) {
    L('QUIZ', 500, 100, { size: 110, font: 'Bangers', fill: NAVY, lw: 6, stroke: '#ffffff' });
    left('Question 2', 200, { size: 70, fill: GREY });
    left('Stay late?', 275, { size: 80 });
    const ticks = [tS('quiz2') + .2, tS('quiz2') + .7, tS('quiz2') + 1.2];
    const nT = ticks.filter(tt => lt >= tt).length;
    ringTimer(860, 150, 62, 1 - nT / 3);
    const hit = lt >= tS('s5') - .05, bh = 96;
    if (whole) {   /* the three answers: one size, centred in their buttons (set dressing at this size: the insert shows them large) */
      answerBtn(60, 330, 880, bh, 'YES', { size: 54, hero: false });
      answerBtn(60, 446, 880, bh, 'YES', { size: 54, hero: false });
      answerBtn(60, 562, 880, bh, 'LET ME CHECK MY CONTRACT', { size: 54, hero: false, fill: hit ? '#ffe6e6' : '#ffffff', stroke: hit ? RED : INK, ink: hit ? RED : INK, strike: hit ? 1 : 0 });
    }
  } else if (idx === 6) {
    L('—', 500, Hd / 2, { size: 180, fill: '#b8b4c4' });
  }
  ctx.restore();
  // the glow the picture puts on the room (a soft screen blend over the screen rectangle)
  if (idx < 7) V2.glow(x + w / 2, y + h / 2, w * .75, '255,250,236', .05, 'screen', .3);
}

// ------------------------------------------------------------------ the world: the room, the audience silhouettes, the Administrator, Strawberry
// which of the cast is the subject of each shot (no entry: a wide, everyone). A close-up shows only the people it is about, sharp and whole; nobody else is drawn (and neither is his chair):
// no soft neighbour at the edge of the frame, no half figure
const FOCUS = { cuC2: ['clem'], close: ['straw'], a12: ['straw', 'admin'], s7: ['straw', 'admin'], chart: [], quiz1: [] };
function world(lt) {
  R.cam();
  R.light({ key: [-.4, -.85], keyA: .22 });
  R.shell({ flick: lt });
  R.back({ min: 2, hr: 3 });
  SLT.lt = lt; SLT.down = seg(lt, .2, 1.0);
  R.screen({ down: SLT.down, drawSlide, t: lt });
  const sh = shotOf(lt), focus = FOCUS[sh], admin = bodyAdmin(lt);
  // who is in this shot
  const sil = [['lemon', bodyLemonSil(), AUD.lemon], ['mango', bodyMangoSil(), AUD.mango], ['clem', bodyClemSil(), AUD.clem]];
  const straw = bodyStraw(lt), strawSil = turnK(lt) < .5 && standK(lt) <= 0;
  const all = sil.concat([['straw', straw, AUD.straw]]);
  const shown = {};
  for (const [id, o] of all) shown[id] = !focus || focus.includes(id);
  const adminShown = !focus || focus.includes('admin');
  // the chairs of the audience (under the silhouettes): only where somebody sits
  for (const [id, , X] of all) if (shown[id]) R.chair(X, AUD_Z, {});
  // the platform, then the Administrator beside the screen (soft when he is not the subject of the shot)
  box3({ x0: ADMIN[0] - 100, x1: ADMIN[0] + 100, y0: 0, y1: RISER, z0: ADMIN[1] - 60, z1: ADMIN[1] + 60, color: '#7a5a3a', top: '#9b7450', front: '#654a2e', side: '#55402a', lw: 2 });
  if (adminShown) drawChar(admin);
  // the audience: soft navy silhouettes with a rim light. Strawberry is one of them until she turns round
  const band = A12.charBox(sil[0][1]);
  R.silhouettes(() => {
    const list = sil.slice(); if (strawSil) list.push(['straw', straw, AUD.straw]);
    for (const [id, o] of list) {
      if (shown[id]) drawChar(o);
    }
  }, ['#4a5590', '#262d54'], 1, { y0: band[1], y1: band[3] + 40 });
  if (!strawSil && shown.straw) drawChar(straw);
}

// ------------------------------------------------------------------ the insert: the answer buttons, large (flat, in place of the world). A card with the question, the timer ring and three buttons
function insertBubbles(lt) {
  const pop = easeOut(seg(lt, tS('a10') - .02, tS('a10') + .2));
  ctx.save(); ctx.fillStyle = V2.grad(0, 0, 0, 1920, [[0, '#2a2236'], [1, '#120e1b']]); ctx.fillRect(-60, -60, W + 120, 1920 + 120); ctx.restore();
  ctx.save(); ctx.translate(540, 800); ctx.scale(lerp(.94, 1, pop), lerp(.94, 1, pop)); ctx.rotate(-.01);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(-470 + 14, -330 + 18, 940, 660, 18); ctx.fill();
  UI.panel([-470, -330, 940, 660], { fill: '#fdfbf4', stroke: 'rgba(25,16,30,.5)', lw: 4, r: 18, id: 'qcard', pad: 24 });
  UI.label('QUIZ  ·  QUESTION 2', -420, -268, { size: 40, fill: GREY, align: 'left', cid: 'qcard' });
  UI.label('Stay late?', -420, -178, { size: 88, fill: INK, align: 'left', cid: 'qcard' });
  const hit = lt >= tS('s5') - .05, ticks = [tS('quiz2') + .2, tS('quiz2') + .7, tS('quiz2') + 1.2];
  const ring = 1 - ticks.filter(tt => lt >= tt).length / 3;
  ctx.save(); ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(42,36,64,.16)'; ctx.beginPath(); ctx.arc(360, -222, 56, 0, TAU); ctx.stroke();
  ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(360, -222, 56, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(ring)); ctx.stroke(); ctx.restore();
  const bx = -420, bw = 840, bh = 108;
  answerBtn(bx, -94, bw, bh, 'YES', { size: 60, lw: 7, id: 'ansA' });
  answerBtn(bx, 34, bw, bh, 'YES', { size: 60, lw: 7, id: 'ansB' });
  answerBtn(bx, 162, bw, bh, 'LET ME CHECK MY CONTRACT', { size: 60, lw: 7, id: 'ansC', fill: hit ? '#ffe6e6' : '#ffffff', stroke: hit ? RED : INK, ink: hit ? RED : INK, strike: hit ? easeOut(seg(lt, tS('s5') - .05, tS('s5') + .3)) : 0 });
  ctx.restore();
}

// ------------------------------------------------------------------ the scene object
const SC = {
  shot: lt => shotOf(lt),
  cam(lt) {
    const sh = shotOf(lt);
    R.cam();
    const scr = { x: 540 + ((R.LAY.screen.x0 + R.LAY.screen.x1) / 2) * R.kzP(R.LAY.screen.z), y: 860 + (700 - (R.LAY.screen.yTop + R.LAY.screen.yBot) / 2) * R.kzP(R.LAY.screen.z) };
    if (sh === 'wide' || sh === 'open' || sh === 'a1') zoomTo(WIDE.x, WIDE.y, WIDE.z + .02 * sk(lt, 0, 1.6));
    else if (sh === 'cuC2') { const p = seatOf(AUD.clem); zoomTo(p.x, p.y - 230, 1.8); }
    else if (sh === 'chart') { zoomTo(scr.x, scr.y + 86, 1.85); }
    else if (sh === 'quiz1' || sh === 'push') { zoomTo(scr.x, scr.y + 70, 1.9); }
    else if (sh === 'bubbles') { zoomTo(540, 900, 1); }
    else if (sh === 'close') { const z = 2.4 + .08 * sk(lt, shotStart('close'), shotStart('close') + 2); const o = seatOf(AUD.straw); faceZoom({ kind: 'straw', x: o.x, y: o.y, s: o.s, noLegs: true, lift: 0 }, z, 150); }
    else if (sh === 'a12' || sh === 's7') { const q = R.pt(ADMIN[0], RISER, ADMIN[1]), a = faceC({ kind: 'melon', x: q.x, y: q.y, s: q.s * 1.22 }), o = seatOf(AUD.straw); const b = faceC({ kind: 'straw', x: o.x, y: lerp(o.y, R.pt(AUD.straw, 0, AUD_Z).y, standK(lt)), s: o.s, noLegs: standK(lt) < .5, lift: 0 }); zoomTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 90, 1.45); }
    else zoomTo(WIDE.x, WIDE.y, WIDE.z + .02);
  },
  draw(lt) {
    const sh = shotOf(lt);
    if (sh === 'bubbles') { insertBubbles(lt); return; }
    world(lt);
  },
  fx: lt => ({ bloom: .42, vignette: .36, grain: .04, contrast: .12, sat: .08, tint: [['#ffe6b8', .08, 'soft-light']] }),
  blur: lt => 1,
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
