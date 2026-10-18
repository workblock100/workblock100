'use strict';
/* SHIFT HAPPENS, Episode 8: The Double Shift.
 *
 * The night nurse calls out, the evening nurse is mandated to stay, and one nurse covers forty residents until the Moon sets.
 * This file owns the bookends: the title, the mandation at the nurses' station, the 7 AM report and the end card.
 * The three night scenes (the hall, the break room, dawn in Room 14) live in ep8_hall.js, ep8_break.js and ep8_dawn.js and register on window.__EP8_SCENES.
 * Built on the v2 renderer and the Episode 6 and 7 kits. Every position below is a world coordinate: X right, Z forward, from V2.at(X, Z). */
(() => {
if (!window.TIMELINE_EP8) return;
const { person, zoomTo, faceZoom, drawBg, inB, grad2, confetti, pointAt, KINDS6 } = window.H6;
const A7 = window.A7, S7 = window.S7, A6 = window.A6;
const { lemon, drag, straw, mango, papaya, goji } = A7;
const lime = A6.lime;
// scene-relative time of a spoken word, from the recorded line's word timings
const wordT = (id, word) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return l.s - CUR.start + w[1]; };

// a route through keyed positions [t, X, Z, ease]: linear travel between keys, 'io' or 'out' to ease a leg
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// a neighbor of the subject in a close-up: out of focus, behind the shot, never audited
const nbr = o => V2.dof(6, () => drawBg(o));
// a tube failing: irregular on and off at 15 Hz inside a window, steady outside it
const lampFlicker = (lt, t0, t1) => lt >= t0 && lt < t1 ? (hash(Math.floor(lt * 15) + 3) > .42 ? 1 : .08) : 1;
// the call-light board with n lamps going in the alarm colors
const qLamps = (lt, n = 28) => Array.from({ length: n }, (_, i) => [A6.ALARM[KINDS6[(i + Math.floor(lt * 7)) % 6]].rgb, .6 + .4 * Math.sin(lt * 14 + i)]);
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}

// Mr. Lime's coffee mug: the same mug, from the other shift
Object.assign(PROP_BOX, { mug8: Object.assign([-30, -66, 42, 6], { nearFace: true }) });
EXT.prop.mug8 = (side, o, t) => {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(-26, -54, 52, 56, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(28, -26, 11, -PI / 2, PI / 2); ctx.stroke();
  ctx.fillStyle = '#5a3210'; ell(0, -50, 22, 5); ctx.fill();
  text('7-3', 0, -24, { size: 13, fill: '#1f4fd8' });
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; for (const dx of [-2, 12]) { ctx.beginPath(); ctx.moveTo(dx, -60); ctx.quadraticCurveTo(dx + 6 * Math.sin(t * 3 + dx), -70, dx, -80); ctx.stroke(); }
};

const SCENES = {};

// ============================================================================ title
// a sixteen-hour day on one clock face: the sky runs from afternoon through sunset and night to dawn while the hands spin from 3 PM to 7 AM
const SKY = [[0, '#5aa8ee', '#cfe9fb'], [.27, '#e8704a', '#ffc86a'], [.45, '#1a1450', '#4a2a7a'], [.72, '#070a26', '#1b1450'], [1, '#3a4a9a', '#ffb878']];
function skyAt(p) {
  let i = 1; while (i < SKY.length - 1 && p > SKY[i][0]) i++;
  const a = SKY[i - 1], b = SKY[i], k = seg(p, a[0], b[0]);
  return [A7.lerpC(a[1], b[1], k), A7.lerpC(a[2], b[2], k)];
}
// hrsAt(dt): the clock's hour value dt seconds ago, so the spinning minute hand can leave a short ghost trail
function bigClock(cx, cy, R, hrsAt, o = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(o.scale ?? 1, o.scale ?? 1);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.fillStyle = '#2a2530'; ctx.beginPath(); ctx.arc(0, 0, R + 28, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0, r0 = R - (big ? 44 : 24); ctx.strokeStyle = '#2a2530'; ctx.lineWidth = big ? 8 : 3; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); ctx.lineTo(Math.sin(a) * (R - 8), -Math.cos(a) * (R - 8)); ctx.stroke(); }
  for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU; text(String(i), Math.sin(a) * (R - 90), -Math.cos(a) * (R - 90) + 4, { size: 54, font: 'Bangers', weight: 400, fill: '#2a2530' }); }
  const hand = (ang, len, lw, color, al) => { ctx.save(); ctx.globalAlpha *= al; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-Math.sin(ang) * len * .12, Math.cos(ang) * len * .12); ctx.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len); ctx.stroke(); ctx.restore(); };
  const mmA = dt => (hrsAt(dt) - 3) * .25 * TAU, hhA = dt => hrsAt(dt) / 12 * TAU;
  hand(mmA(.06), R * .78, 8, '#2a2530', .12); hand(mmA(.03), R * .78, 9, '#2a2530', .22);
  hand(hhA(0), R * .5, 15, '#2a2530', 1); hand(mmA(0), R * .78, 10, '#2a2530', 1);
  if (o.second != null) hand(o.second, R * .86, 5, '#e8193a', 1);
  ctx.fillStyle = '#e8193a'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
  ctx.restore();
}
SCENES.title = {
  noChyron: true,
  cam(lt) { const hit = B('logo').s + 2.2; CAM.shake = lt > hit && lt < hit + .6 ? 20 * (1 - (lt - hit) / .6) : 0; },
  draw(lt) {
    const hit = B('logo').s + 2.2, pAt = u => easeIO(seg(u, .05, hit)), p = pAt(lt), sky = skyAt(p);
    ctx.fillStyle = grad2(0, 0, 0, H, sky[0], sky[1]); ctx.fillRect(-100, -100, W + 200, H + 200);
    A7.stars(lt, 1150, { n: 120, a: easeIO(seg(p, .3, .5)) * (1 - easeIO(seg(p, .82, 1))) });
    A7.clouds(lt, 380, 1500, { n: 5, tint: p < .3 ? '255,255,255' : '120,110,190', belly: p < .3 ? '170,200,235' : '40,36,100', a: .5, speed: 22, seed: 4, scale: 1.4 });
    // the sun sets at the left while the clock runs; the dawn glow comes up behind the clock at the end
    V2.glow(540, 1500, 900, '255,176,110', .5 * easeIO(seg(p, .8, 1)), 'screen', .9);
    // the clock, one revolution of the day in two seconds, locking onto seven on the downbeat
    const cx = 540, cy = 1220, R = 318, pulse = lt > hit ? 1 + .06 * Math.max(0, 1 - (lt - hit) / .25) : 1, rise = easeBack(seg(lt, .05, .55));
    if (rise > 0) {
      bigClock(cx, cy + (1 - rise) * 500, R, dt => 3 + 16 * pAt(lt - dt), { scale: pulse, second: lt > hit + .3 ? Math.floor((lt - hit) * 2) * TAU / 30 : null });
      for (let i = 0; i < 3; i++) A6.ring(cx, cy, (lt - hit - i * .12) / 1.3, 'moon', { r0: R + 30, r1: 1250, lw: 16 - i * 3, alpha: .8 });
    }
    // the cast in front of the clock: one exhausted, one thrilled about overtime
    V2.setLight({ key: [-.4, -.8], keyColor: '#fff0cf', keyA: .26, rim: '#cfe0ff', rimA: .55, shadow: '#1a1236', shadowA: .5, bounceA: .1 });
    V2.opts.reflect = false;
    const fy = 1700, s0 = easeBack(seg(lt, 1.0, 1.5)), m0 = easeBack(seg(lt, 1.2, 1.7));
    ctx.fillStyle = V2.grad(0, fy - 30, 0, H, [[0, 'rgba(18,12,48,0)'], [.1, 'rgba(18,12,48,.92)'], [1, 'rgba(6,4,20,1)']]); ctx.fillRect(0, fy - 30, W, H - fy + 30);
    if (s0 > 0) drawChar(straw({ x: 252, y: fy, s: 1.2 * s0, expr: 'dead', look: [.5, -.2], lid: .55, hold: { r: 'mug7' }, grip: { r: [78, 48] }, arms: { l: 'rest', r: 'hold' }, transit: lt < 1.8 }));
    if (m0 > 0) drawChar(mango({ x: 828, y: fy, s: 1.2 * m0, expr: 'happy', look: [-.5, -.1], arms: { l: 'cheer', r: 'cheer' }, t: lt + 1, transit: lt < 1.9 }));
    // the logo slams on the downbeat
    const k = seg(lt, hit, hit + .4);
    if (k > 0) {
      const sc = lerp(1.7, 1, easeOut(k)), a = clamp(k * 3);
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(540, 250); ctx.scale(sc, sc);
      text('SHIFT HAPPENS', 0, 0, { size: 96, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 16, stroke: '#150f22', spacing: 4, shadow: 20 }); ctx.restore();
      const k2 = seg(lt, hit + .08, hit + .5), e2 = easeOut(k2), sc2 = lerp(1.4, 1, e2);
      ctx.save(); ctx.globalAlpha *= clamp(k2 * 3); ctx.translate(540, 520); ctx.scale(sc2, sc2);
      text('THE DOUBLE', 0, 0, { size: 150, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 20, stroke: '#150f22', spacing: 5, shadow: 26 }); ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp(k2 * 3); ctx.translate(540, 715 + 14 * (1 - e2)); ctx.scale(lerp(1.08, 1, e2), lerp(1.18, 1, e2));
      text('SHIFT', 0, 0, { size: 270, font: 'Bangers', weight: 400, fill: '#ffb347', lw: 24, stroke: '#150f22', spacing: 8, shadow: 34 }); ctx.restore();
      V2.glow(540, 640, 800, '255,200,140', .3 * a, 'screen', .8);
      const chip = easeBack(seg(lt, hit + .35, hit + .75));
      if (chip > 0) { ctx.save(); ctx.translate(540, 384); ctx.scale(chip, chip); ctx.fillStyle = '#7b61ff'; rr(-150, -34, 300, 68, 34); ctx.fill(); ctx.strokeStyle = '#150f22'; ctx.lineWidth = 6; ctx.stroke(); text('EPISODE 8', 0, 3, { size: 40, fill: '#fff', spacing: 3 }); ctx.restore(); }
    }
  },
  fx: lt => { const hit = B('logo').s + 2.2; return { bloom: .8, vignette: .5, grain: .05, aberr: lt > hit && lt < hit + .5 ? 8 * (1 - (lt - hit) / .5) : 0, fade: lt < .3 ? 1 - lt / .3 : (lt > hit && lt < hit + .12 ? .5 * (1 - (lt - hit) / .12) : 0), fadeColor: lt > hit ? '255,235,210' : '0,0,0' }; },
  blur: lt => lt > B('logo').s + 2.1 && lt < B('logo').s + 2.7 ? 3 : (lt < B('logo').s + 2.2 ? 2 : 1),
  over() {},
};

// ============================================================================ the nurses' station, 10:52 PM
const STAFF = { straw: [-175, 1000], mango: [175, 1000], lemon: [32, 1060] };   // Lemon stands clear of Strawberry's mug
// the whiteboard: the night's roster, rewritten as the news arrives. p is how much of a line is written, final = the finished board
const boardLines = (lt, final) => {
  const b = id => final ? { s: 0, e: 1 } : B(id), P = (a, c) => final ? 1 : seg(lt, a, c);   // the finished board never looks at the station's beats
  return [
    { t: 'TONIGHT', x: .05, y: .14, size: .105, color: '#2a5ac8', rot: -.02, p: 1 },
    { t: 'RN: DRAGONFRUIT', x: .05, y: .29, size: .082, color: '#1f9a52', rot: -.01, p: 1 },
    { t: 'RN: STRAWBERRY', x: .05, y: .44, size: .082, color: '#d62a3a', rot: -.01, p: P(b('l3').s + .1, b('l3').e - .05) },
    { t: '3 PM TO 7 AM', x: .05, y: .59, size: .082, color: '#d62a3a', rot: -.01, p: P(b('l4').s + .3, b('l4').e - .15), under: .5 },
    { t: 'CNA: MANGO + OT', x: .05, y: .74, size: .078, color: '#2a5ac8', rot: -.01, p: P(b('m2').s + .35, b('m2').e - .1) },
  ];
};
// a red strike through one board line, drawn with the same placement as the whiteboard writes it
function strikeLine(f, L, p) {
  if (p <= 0) return;
  const w = f[1][0] - f[0][0], h = f[0][1] - f[2][1], lx = f[3][0] + L.x * w, ly = f[3][1] + L.y * h, sz = L.size * h;
  ctx.save(); ctx.font = `italic 900 ${sz}px Nunito`; const tw = ctx.measureText(L.t).width; ctx.restore();
  ctx.save(); ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = Math.max(4, h * .03); ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(lx - 8, ly - sz * .3); ctx.lineTo(lerp(lx - 8, lx + tw + 8, p), lerp(ly - sz * .3, ly - sz * .42, p)); ctx.stroke(); ctx.restore();
}

// the mandation notice, full frame: a typed form, two checkboxes (only one is an option), a red MANDATORY stamp and a signature that writes itself reluctantly
function insForm(lt, o = {}) {
  A6.bokeh(lt, ['255,200,120', '255,100,100'], ['#1a1030', '#2d1848']);
  const cx = 540, cy = 800, k = easeOut(clamp(lt / .3));
  ctx.save(); ctx.translate(cx, cy + (1 - k) * 160); ctx.rotate(-.03); ctx.globalAlpha *= clamp(lt * 5);
  reg('overlay', [cx - 360, cy - 520, cx + 360, cy + 520], { id: 'form-insert', transit: k < 1 });
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14; ctx.fillStyle = '#b8864a'; ctx.strokeStyle = 'rgba(25,16,30,.9)'; ctx.lineWidth = 6; rr(-340, -520, 680, 1040, 26); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#9aa0a6'; rr(-90, -548, 180, 56, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffef8'; rr(-304, -470, 608, 960, 10); ctx.fill();
  text('STAFFING NOTICE', 0, -408, { size: 66, font: 'Bangers', weight: 400, fill: '#2a2448', spacing: 4 });
  text('FRUIT BOWL REHAB & NURSING', 0, -352, { size: 28, fill: '#6a6488', weight: 900, spacing: 3 });
  ctx.strokeStyle = '#2a2448'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-262, -318); ctx.lineTo(262, -318); ctx.stroke();
  // the typed fields, one row at a time
  const rows = [['NAME', 'STRAWBERRY, LPN'], ['SHIFT', '3 PM TO 7 AM'], ['HOURS', '16']];
  rows.forEach(([lab, val], i) => {
    const y = -250 + i * 78, p = seg(lt, .2 + i * .22, .55 + i * .22);
    text(lab, -262, y, { size: 28, fill: '#6a6488', weight: 900, align: 'left', spacing: 2 });
    if (p > 0) { ctx.save(); ctx.beginPath(); ctx.rect(-100, y - 40, 380 * p, 80); ctx.clip(); text(val, -100, y, { size: lab === 'HOURS' ? 64 : 36, font: lab === 'HOURS' ? 'Bangers' : 'Nunito', weight: lab === 'HOURS' ? 400 : 900, fill: lab === 'HOURS' ? '#d62a3a' : '#1f4fd8', align: 'left', spacing: 1 }); ctx.restore(); }
  });
  ctx.strokeStyle = '#8fa7c9'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-262, -216 + i * 78); ctx.lineTo(262, -216 + i * 78); ctx.stroke(); }
  // the two boxes: only the second one is an option
  const boxes = [['I VOLUNTEER', false], ['I WAS TOLD', true]];
  boxes.forEach(([lab, on], i) => {
    const y = -10 + i * 84;
    ctx.strokeStyle = '#2a2448'; ctx.lineWidth = 5; rr(-262, y - 28, 56, 56, 8); ctx.stroke();
    text(lab, -182, y + 2, { size: 40, fill: '#2a2448', weight: 900, align: 'left', spacing: 2 });
    const xk = seg(lt, .95, 1.2);
    if (on && xk > 0) { ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-252, y - 18); ctx.lineTo(lerp(-252, -216, clamp(xk * 2)), lerp(y - 18, y + 18, clamp(xk * 2))); if (xk > .5) { ctx.moveTo(-216, y - 18); ctx.lineTo(lerp(-216, -252, (xk - .5) * 2), lerp(y - 18, y + 18, (xk - .5) * 2)); } ctx.stroke(); }
  });
  text('Refusal may be considered', -262, 158, { size: 28, fill: '#6a6488', weight: 700, align: 'left' });
  text('patient abandonment.', -262, 194, { size: 28, fill: '#6a6488', weight: 700, align: 'left' });
  // the stamp
  const st = o.stamp ?? 99, sk = seg(lt, st, st + .16);
  if (lt >= st) {
    const pk = lerp(2.0, 1, easeOut(sk));
    ctx.save(); ctx.translate(30, 300); ctx.rotate(-.1); ctx.scale(pk, pk); ctx.globalAlpha *= clamp(sk * 4); ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 12; rr(-250, -78, 500, 156, 18); ctx.stroke(); ctx.lineWidth = 5; rr(-234, -64, 468, 128, 12); ctx.stroke();
    text('MANDATORY', 0, 12, { size: 108, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 4, maxW: 430 }); ctx.restore();
  }
  // the signature, drawn as a loopy scribble that droops at the end
  const sp = seg(lt, st + .3, st + .85);
  text('SIGN', -262, 436, { size: 24, fill: '#6a6488', weight: 900, align: 'left', spacing: 3 });
  ctx.strokeStyle = '#2a2448'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-262, 458); ctx.lineTo(262, 458); ctx.stroke();
  if (sp > 0) { ctx.strokeStyle = '#1f4fd8'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); const n = 60;
    for (let j = 0; j <= n * sp; j++) { const u = j / n, x = -170 + 400 * u, y = 432 + 20 * Math.sin(u * 38) * (1 - u * .5) - 9 * Math.sin(u * 11) + 18 * u * u; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); }
  ctx.restore();
  if (lt >= st) A6.ring(cx, cy + 250, (lt - st) / .8, 'q', { r0: 60, r1: 480, lw: 12, alpha: .6 });
}

SCENES.station = {
  shot(lt) {
    const b = id => B(id);
    const order = [['wide', b('l1').s - .05], ['cuL', b('s1').s - .05], ['cuS', b('l2').s - .05], ['cuL', b('s2').s - .05], ['cuS', b('dp1').s - .05], ['trio', b('m1').s - .05], ['cuM', b('s3').s - .05], ['cuS', b('l3').s - .05],
      ['cuL', b('s4').s - .05], ['cuS', b('l4').s - .05], ['cuL', b('s5').s - .05], ['cuS', b('l5').s - .05], ['cuL', b('form').s - .02], ['form', b('l6').e + .12], ['cuL', b('m2').s - .05], ['cuM', b('s6').s - .05], ['cuS', b('m3').s - .05], ['cuM', b('s7').s - .05], ['cuS', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  cam(lt) {
    const sh = SCENES.station.shot(lt), sp = V2.at(...STAFF.straw), mp = V2.at(...STAFF.mango);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    if (sh === 'wide') { const k = seg(lt, 0, B('l1').s); zoomTo(540, lerp(990, 975, k), lerp(1, 1.05, k)); }
    else if (sh === 'cuL') { const k = seg(lt, B('l1').s, B('l6').e); zoomTo(lerp(560, 566, k), 950, lerp(1.26, 1.32, k)); }
    else if (sh === 'cuS') faceZoom({ kind: 'straw', x: sp.x, y: sp.y, s: sp.s }, 2.0, 80);
    else if (sh === 'cuM') faceZoom({ kind: 'mango', x: mp.x, y: mp.y, s: mp.s }, 2.0, 80);
    else if (sh === 'trio') zoomTo(540, 985, 1.0);
  },
  draw(lt) {
    const sh = SCENES.station.shot(lt), t = id => B(id);
    if (sh === 'form') { insForm(lt - t('form').s, { stamp: wordT('l6', 'mandatory') - t('form').s }); return; }
    const tq = wordT('dp2', 'quiet'), reset = lt >= tq + .35, hrs = reset ? 0 : 7, flash = lt >= tq && lt < tq + 1.2 ? (Math.sin(lt * 30) > 0 ? 1 : .3) : 0;
    const flicker = lt >= tq && lt < tq + .45 ? (hash(Math.floor(lt * 20)) > .4 ? 1 : .1) : 1, fl = lampFlicker(lt, tq, tq + .6);
    V2.setLight({ key: [-.35, -.8], keyColor: '#ffd9a0', keyA: .26, rim: '#8fb8ff', rimA: .5, shadow: '#0a0a24', shadowA: .45, amb: '#9aa6e0', ambA: .1, bounce: '#ffcf99', bounceA: .22 });
    V2.opts.reflect = true;
    const blurPx = sh === 'cuS' || sh === 'cuM' ? 9 : sh === 'cuL' ? 3 : 0, final = lt >= t('m2').e;
    const mExpr = inB(lt, 'l5') ? 'smug' : lt >= t('m2').s && lt < t('s7').s ? 'happy' : lt >= t('s7').s ? 'sad' : 'chill';
    V2.dof(blurPx, () => {
      const r = S7.stationBack({ noLabel: sh !== 'wide' && sh !== 'trio', night: true, t: lt + 3, hours: hrs, qFlash: flash, qFlicker: flicker, board: boardLines(lt, false), lampsOn: fl, min: 52, hr: 10, lamps: [],
        moon: { s: .62, expr: mExpr, look: [-.2, .5], o: { suppress: sh !== 'wide' && sh !== 'trio' } } });
      const L = boardLines(lt, false)[1]; strikeLine(r.wb, L, seg(lt, wordT('l2', 'called') - .05, wordT('l2', 'called') + .4));
    });
    S7.stationCounter({ night: true });
    const lm = SCENES.station.lemon(lt), sp = SCENES.station.straw(lt), mp = SCENES.station.mango(lt);
    const bg = (o, who) => (sh === 'cuS' && who !== 'straw') || (sh === 'cuM' && who !== 'mango') || (sh === 'cuL' && who !== 'lemon') ? nbr(o) : drawChar(o);
    bg(lm, 'lemon'); bg(sp, 'straw'); bg(mp, 'mango');
    if (lt < t('l1').s) { const [px, py] = V2.p2(390, 262, 1590); for (let i = 0; i < 3; i++) A6.ring(px, py, (((lt - .1) * 1.5 - i * .33) % 1 + 1) % 1, 'phone', { r0: 20, r1: 300, lw: 8, alpha: .75 }); }
    V2.addLight({ x: 400, y: 1000, r: 800, color: '255,200,120', a: .35 * fl });
    V2.dust(60, 600, 1020, 1400, lt, { n: 26, alpha: .3, color: '200,215,255' });
    sfxWord(lt, t('open').s + .1, 'BRRRING', 540, 330, { fill: '#7be0a0', size: 120, hold: .75 });
  },
  lemon(lt) {
    const q = V2.at(...STAFF.lemon), b = id => B(id);
    return lemon(Object.assign(q, { look: lt < b('s1').s ? [-.55, .15] : lt < b('s5').s ? [.5, .1] : [.1, .1], expr: inB(lt, 'l1') ? 'neutral' : inB(lt, 'l2') ? 'sour' : inB(lt, 'l3') ? 'neutral' : inB(lt, 'l4') ? 'neutral' : inB(lt, 'l5') ? 'smug' : 'neutral',
      hold: { l: 'clipboard6' }, grip: { l: [-100, 30] }, clipText: 'ROSTER', arms: { l: 'hold', r: inB(lt, 'l3') ? 'point' : inB(lt, 'l5') ? 'shrug' : inB(lt, 'l4') ? 'up' : 'rest' } }));
  },
  straw(lt) {
    const q = V2.at(...STAFF.straw), b = id => B(id), sip = seg(lt, b('s7').e - .15, b('s7').e + .25) * (1 - seg(lt, CUR.dur - .45, CUR.dur - .2));
    const dpOn = lt >= b('dp1').s - .05 && lt < b('m1').s;
    return straw(Object.assign(q, { look: dpOn ? [0, .1] : lt < b('l1').s ? [-.6, .55] : [.5, -.05],
      expr: lt < b('l1').s ? 'chill' : inB(lt, 's1') ? 'sour' : inB(lt, 's2') ? 'sour' : dpOn ? (lt > b('dp2').s ? 'dead' : 'shock') : inB(lt, 's3') ? 'sour' : inB(lt, 's4') ? 'shock' : inB(lt, 's5') ? 'angry' : inB(lt, 's6') ? 'dead' : lt >= b('s7').s ? 'dead' : 'dead',
      hold: { r: 'mug7' }, grip: { r: [78, 48] }, arms: { l: inB(lt, 's1') || inB(lt, 's5') ? 'hips' : 'rest', r: sip > 0 ? [1.95, 1.7] : 'hold' }, lid: lt < b('l1').s ? .5 : inB(lt, 's6') || lt >= b('s7').s ? .55 : undefined }));
  },
  mango(lt) {
    const q = V2.at(...STAFF.mango), b = id => B(id);
    return mango(Object.assign(q, { look: [-.5, -.05], expr: inB(lt, 'm1') ? 'smug' : inB(lt, 'm2') ? 'happy' : inB(lt, 'm3') ? 'smug' : lt >= b('s7').s ? 'happy' : 'neutral',
      arms: { l: 'rest', r: inB(lt, 'm2') ? 'cheer' : inB(lt, 'm3') ? 'thumb' : 'rest' } }));
  },
  fx: lt => { const tq = wordT('dp2', 'quiet'), fl = lampFlicker(lt, tq, tq + .6); return { bloom: .7, vignette: .55, grain: .06, contrast: .2, sat: .1, tint: [['#3a54c8', .2, 'soft-light'], ['#0a1030', .12, 'multiply']], fade: Math.max((1 - fl) * .55, seg(lt, CUR.dur - .32, CUR.dur - .02), lt < .25 ? 1 - lt / .25 : 0), fadeColor: '0,0,10' }; },
  blur: lt => 1,
  over(lt) {
    const t = id => B(id), tq = wordT('dp2', 'quiet'), sh = SCENES.station.shot(lt);
    // Dragonfruit on the phone, in a ring: at home, under a blanket, one lamp on
    const pa = seg(lt, t('dp1').s - .05, t('dp1').s + .22) * (1 - seg(lt, t('m1').s - .32, t('m1').s - .06));
    if (pa > 0 && sh === 'trio') {
      const sp = inB(lt, 'dp1') || inB(lt, 'dp2');
      A7.pip(890, 404, 118, { appear: pa, ring: '#7be0a0', label: 'DRAGONFRUIT', ping: sp, id: 'drag' }, r => {
        ctx.fillStyle = V2.grad(0, -r, 0, r, [[0, '#2a2358'], [1, '#150f3a']]); ctx.fillRect(-r, -r, 2 * r, 2 * r);
        V2.glow(-r * .55, -r * .3, r * .9, '255,196,120', .5, 'screen', .6);
        ctx.fillStyle = 'rgba(255,214,150,.9)'; ctx.beginPath(); ctx.arc(-r * .62, -r * .42, 14, 0, TAU); ctx.fill();
        drawChar(drag({ x: 4, y: 52, s: .78, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, look: [0, .1], expr: lt < tq ? 'happy' : 'dead', who: 'dragphone', acc: ['sleepmask'], id: 'drag-pip' }));
        ctx.fillStyle = '#6b4aa8'; ctx.strokeStyle = 'rgba(21,15,58,.9)'; ctx.lineWidth = 4; rr(-r - 4, r * .38, 2 * r + 8, r, 22); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-r + 18 + i * 44, r * .5); ctx.lineTo(-r + 18 + i * 44, r * 1.2); ctx.stroke(); }
      });
    }
  },
};

// ============================================================================ the 7 AM report
SCENES.report = {
  shot(lt) {
    const b = id => B(id);
    const order = [['wide', b('li1').s - .05], ['cuL', b('s1').s - .05], ['cuS', b('flick').s], ['sign', b('li2').s - .05], ['cuL', b('s2').s - .05], ['cuS', b('calls').s], ['two', b('s3').s - .05], ['cuS', b('li3').s - .05], ['cuL', b('s4').s - .05],
      ['cuS', b('li4').s - .05], ['cuL', b('s5').s - .05], ['cuS', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  lpath: route([[0, 760, 1000], [.2, 760, 1000], [1.65, 140, 1000, 'out']]),
  cast(lt) {
    const b = id => B(id), lp = SCENES.report.lpath(lt), walking = lt > .2 && lt < 1.7;
    const calls = lt >= b('calls').s;
    const l0 = person(lime, SCENES.report.lpath, lt, { stride: 40, look: walking ? [-.7, 0] : [-.6, .05], expr: inB(lt, 'li1') || walking ? 'happy' : inB(lt, 's1') ? 'shock' : inB(lt, 'li2') || lt >= b('flick').s && lt < b('calls').s ? 'angry' : calls && lt < b('li3').s ? 'panic' : inB(lt, 'li3') ? 'panic' : inB(lt, 'li4') || lt >= b('li4').s ? 'sad' : 'happy',
      hold: { r: 'mug8' }, grip: { r: [78, 48] }, arms: { l: calls && lt < b('li3').s ? 'flail' : 'rest', r: 'hold' }, transit: walking });
    const s0 = straw(Object.assign(V2.at(-170, 1000), { look: [.6, .1], expr: inB(lt, 's1') ? 'dead' : inB(lt, 's2') ? 'smug' : lt >= b('calls').s ? 'smug' : 'dead',
      hold: { l: 'clipboard6' }, grip: { l: [-110, 30] }, clipText: lt >= b('flick').s ? 'QUIET' : 'CHARTS', arms: { l: 'hold', r: inB(lt, 's3') ? 'thumb' : 'rest' }, lid: lt < b('s2').s ? .5 : undefined }));
    return { lime: l0, straw: s0 };
  },
  cam(lt) {
    const sh = SCENES.report.shot(lt), c = SCENES.report.cast(lt), b = id => B(id);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    if (sh === 'wide') { const k = seg(lt, 0, b('li1').s); zoomTo(505, lerp(990, 975, k), lerp(1, 1.06, k)); }
    else if (sh === 'cuL') faceZoom({ kind: 'lime', x: c.lime.x, y: c.lime.y, s: c.lime.s }, lt >= b('s4').s ? 2.3 : 1.9, 80);
    else if (sh === 'cuS') faceZoom({ kind: 'straw', x: c.straw.x, y: c.straw.y, s: c.straw.s }, 1.8, 80);
    else if (sh === 'two') { zoomTo(446, 1010, 1.12); CAM.shake = 5; }
    else if (sh === 'sign') { const k = seg(lt, b('flick').s, b('flick').e); zoomTo(457, 553, lerp(2.3, 2.5, k)); }
  },
  draw(lt) {
    const sh = SCENES.report.shot(lt), b = id => B(id), c = SCENES.report.cast(lt);
    const tq = b('flick').s, reset = lt >= tq + .45, hrs = reset ? 0 : 8, flash = lt >= tq && lt < b('li2').e + .3 ? (Math.sin(lt * 30) > 0 ? 1 : .3) : 0;
    const flicker = lt >= tq && lt < tq + .45 ? (hash(Math.floor(lt * 20)) > .4 ? 1 : .1) : 1, fl = lampFlicker(lt, tq, tq + .55);
    V2.setLight({ key: [-.35, -.8], keyColor: '#fff4dc', keyA: .24, rim: '#8fb8ff', rimA: .4, shadow: '#2a2038', shadowA: .3, amb: '#fff0d8', ambA: .06 });
    V2.opts.reflect = true;
    const subj = sh === 'cuL' ? 'lime' : sh === 'cuS' ? 'straw' : null, blurPx = subj ? 9 : 0;
    const calls = lt >= b('calls').s, lamps = calls ? qLamps(lt, lt < b('calls').e ? 28 : 12) : [];
    V2.dof(blurPx, () => {
      const r = S7.stationBack({ noLabel: sh !== 'wide' && sh !== 'two', t: lt + 9, hours: hrs, qFlash: flash, qFlicker: flicker, board: boardLines(lt, true), lampsOn: fl, min: 0, hr: 7, lamps });
      strikeLine(r.wb, boardLines(lt, true)[1], 1);
      if (calls) { for (let i = 0; i < 3; i++) A6.ring(116, 735, (((lt - b('calls').s) * 1.5 - i * .33) % 1 + 1) % 1, KINDS6[i * 2 % 6], { r0: 20, r1: 340, lw: 8, alpha: .7 }); }
    });
    S7.stationCounter({ night: false });
    if (sh !== 'sign') { (subj && subj !== 'straw' ? nbr : drawChar)(c.straw); (subj && subj !== 'lime' ? nbr : drawChar)(c.lime); }
    if (lt >= tq && lt < b('li2').e + .3) V2.glow(540, 700, 900, '255,40,50', .2 * flash, 'screen', .6);
    V2.addLight({ x: 400, y: 1000, r: 800, color: '255,214,150', a: .3 * fl });
    V2.dust(60, 600, 1020, 1400, lt, { n: 26, alpha: .35 });
    sfxWord(lt, b('calls').s + .05, 'BRRRING', 560, 395, { fill: '#7be0a0', size: 120, hold: .9 });
  },
  fx: lt => { const b = id => B(id), fl = lampFlicker(lt, b('flick').s, b('flick').s + .55); return { bloom: .55, vignette: .42, grain: .045, contrast: .15, sat: .14, tint: [['#ffd9a0', .12, 'soft-light']], fade: Math.max((1 - fl) * .5, seg(lt, CUR.dur - .3, CUR.dur - .02), lt < .3 ? (1 - lt / .3) * .85 : 0), fadeColor: lt < 1 ? '255,240,215' : '0,0,10' }; },
  blur: lt => 1,
  over() {},
};

// ============================================================================ end card
SCENES.end = {
  noChyron: true,
  cam() {},
  draw(lt) {
    // sunrise behind the cast: the night is over, the next shift is not
    ctx.fillStyle = grad2(0, 0, 0, H, '#2a3a8a', '#ffb878'); ctx.fillRect(-100, -100, W + 200, H + 200);
    A7.stars(lt, 800, { n: 80, a: .6 });
    const sy = 1520 - 360 * easeOut(seg(lt, 0, 3.4)), sun = V2.radial(540, sy, 10, 380, [[0, 'rgba(255,250,214,1)'], [.55, 'rgba(255,214,120,.95)'], [1, 'rgba(255,176,90,0)']]);
    A7.rays(540, sy, 260, 1800, lt, { n: 18, color: '255,226,170', a: .12, spin: .02 });
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(540, sy, 380, 0, TAU); ctx.fill();
    confetti(lt, .7);
    const fy = 1540; ctx.fillStyle = V2.grad(0, fy - 20, 0, H, [[0, 'rgba(26,18,70,.0)'], [.08, 'rgba(34,24,88,.9)'], [1, 'rgba(8,6,24,1)']]); ctx.fillRect(0, fy - 20, W, H - fy + 20);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, fy + 6, 10, 560, [[0, 'rgba(255,200,140,.34)'], [1, 'rgba(255,200,140,0)']]); ctx.beginPath(); ctx.ellipse(540, fy + 6, 560, 70, 0, 0, TAU); ctx.fill(); ctx.restore();
    V2.setLight({ key: [-.4, -.8], keyColor: '#fff0d8', keyA: .26, rim: '#ffd9a0', rimA: .6, shadow: '#1a1236', shadowA: .45, amb: '#ffb890', ambA: .1 });
    V2.opts.reflect = true;
    const row = [['straw', { x: 180, s: .82, acc: ['steth', 'badge', 'bandage'], expr: 'dead', lashes: true, lid: .5 }], ['mango', { x: 360, s: .82, acc: ['badge7', 'gaitbelt7', 'keys7'], badgeText: 'CNA', expr: 'happy' }], ['lemon', { x: 540, s: .86, acc: ['readers', 'lanyard7'], expr: 'happy' }],
      ['lime', { x: 720, s: .82, acc: ['readers', 'cardigan'], cardColor: '#c98a2e', expr: 'panic' }], ['dragon', { x: 900, s: .8, acc: ['sleepmask', 'badge7'], badgeText: 'NIGHTS', expr: 'chill', lid: .3 }]];
    REG.suppress++;
    row.forEach(([kind, extra], i) => { const hop = Math.abs(Math.sin(lt * 4.2 + i)) * 14, pop = easeBack(seg(lt, .6 + i * .12, .95 + i * .12));
      if (pop > 0) drawChar(Object.assign({ kind, id: kind, y: fy - hop, lift: kind === 'straw' ? -11.8 * extra.s * pop : 0, arms: { l: 'cheer', r: 'wave' }, t: lt + i, transit: lt < 2.4 }, extra, { s: extra.s * pop })); });
    REG.suppress--;
  },
  fx: lt => ({ bloom: .7, vignette: .5, grain: .05, fade: lt < .25 ? 1 - lt / .25 : 0 }),
  blur: lt => 1,
  over(lt) {
    const k = easeBack(seg(lt, 0, .45));
    if (k > .06) { ctx.save(); ctx.translate(540, 0); ctx.scale(k, k);
    text('SHIFT HAPPENS', 0, 330, { size: 92, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 18, stroke: '#150f22', spacing: 4, shadow: 20 });
    text('THE DOUBLE SHIFT', 0, 450, { size: 112, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 18, stroke: '#150f22', spacing: 4, shadow: 24 });
    ctx.restore(); }
    const lines = [['For every nurse who has ever been mandated.', 42, '#ffffff', .8], ['Sixteen hours is not a shift. It is a lifestyle.', 42, '#ffe135', 1.9], ['Take your break. Even if it is forty seconds.', 44, '#ffd1e6', 3.0]];
    lines.forEach(([s2, size, c, at], i) => text(s2, 540, 584 + i * 76, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 9, maxW: 1000 }));
    const tk = easeBack(seg(lt, 4.2, 4.6));
    if (tk > 0) {
      ctx.save(); ctx.translate(540, 1710); ctx.scale(tk, tk);
      reg('overlay', [540 - 440 * tk, 1710 - 80 * tk, 540 + 440 * tk, 1710 + 80 * tk], { id: 'teaser' });
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(14,10,36,.92)'; rr(-440, -80, 880, 160, 80); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,214,150,.9)'; ctx.lineWidth = 4; rr(-440, -80, 880, 160, 80); ctx.stroke();
      ctx.font = '900 30px Nunito'; ctx.letterSpacing = '6px'; const w1 = ctx.measureText('NEXT TIME').width; ctx.letterSpacing = '0px';
      ctx.font = '400 56px Bangers'; ctx.letterSpacing = '2px'; const w2 = ctx.measureText('The Agency Nurse').width; ctx.letterSpacing = '0px';
      const cx0 = -(108 + 40 + Math.max(w1, w2)) / 2 + 54, tx0 = cx0 + 54 + 40;   // icon centre and the left edge of the words, centred as one group
      // a temp badge on a lanyard: a photo circle, two text bars and a red TEMP strip
      ctx.save(); ctx.translate(cx0, 0); ctx.rotate(-.05 + .04 * Math.sin(lt * 3));
      ctx.strokeStyle = '#7b61ff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-16, -62); ctx.lineTo(-4, -42); ctx.moveTo(16, -62); ctx.lineTo(4, -42); ctx.stroke();
      ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; rr(-40, -44, 80, 100, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8193a'; rr(-40, -44, 80, 24, 8); ctx.fill(); text('TEMP', 0, -31, { size: 18, fill: '#fff', weight: 900, spacing: 2 });
      ctx.fillStyle = '#c9d2f0'; ctx.beginPath(); ctx.arc(0, 4, 16, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2a2530'; rr(-26, 30, 52, 7, 3); ctx.fill(); rr(-18, 42, 36, 6, 3); ctx.fill(); ctx.restore();
      text('NEXT TIME', tx0, -34, { size: 30, fill: '#ffd1e6', weight: 900, align: 'left', spacing: 6 });
      text('The Agency Nurse', tx0, 22, { size: 56, font: 'Bangers', weight: 400, fill: '#ffffff', align: 'left', lw: 10, stroke: '#150f22', spacing: 2 });
      ctx.restore();
    }
  },
  label: () => 'THANKS FOR WATCHING',
};

const ALL = Object.assign({}, window.__EP8_SCENES || {}, SCENES);
window.__EP8_ALL = ALL;
EPISODES[8] = { num: 8, v2: true, balanceCaps: true, title: 'Episode 8: The Double Shift', TL: window.TIMELINE_EP8, SCENES: ALL, layout: 'v2', audio: 'build/ep8/audio.m4a' };
})();
