'use strict';
/* Episode 8 scene module: break. THE BREAK ROOM, 3:34 AM.
 * Strawberry has four minutes. She sits, exhales, and gets forty seconds before a call light rings that she does not answer.
 * Then the one square left on the bingo card gets its dauber. Registers into window.__EP8_SCENES.break (ep8.js assembles the episode).
 * Every position is a world coordinate (X right, Z forward) from V2.at(X, Z), exactly as in Episodes 6 and 7. */
(() => {
if (!window.TIMELINE_EP8) return;
window.__EP8_SCENES = window.__EP8_SCENES || {};
const { person, zoomTo, faceC, faceZoom, drawBg, inB } = window.H6;
const A7 = window.A7, A6 = window.A6, S6 = window.S6;
const { straw, mango } = A7;
const t_ = id => B(id).s;

// ---- helpers copied from ep7.js (so this module depends on nothing but the shared kits) ----
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const nbr = o => V2.dof(6, () => drawBg(o));   // a neighbor of the subject in a close-up: out of focus, never audited
const chairShadow = (X, Z) => { const [px, py] = V2.p2(X, 0, Z), k = S6.kz(Z); ctx.save(); ctx.fillStyle = 'rgba(14,10,34,.26)'; ctx.beginPath(); ctx.ellipse(px, py + 3 * k, 70 * k, 15 * k, 0, 0, TAU); ctx.fill(); ctx.restore(); };

// ---- the stage ----
const ZB = 2200, HW = 460, CH = 600;                       // back wall depth, half width, ceiling (the S6 break room's box)
const DOOR = { x0: -250, x1: -110, y1: 430 }, DOME = [-180, 540];
const CLOCK = { x: -15, y: 478, r: 62 };                   // the wall clock, between the door and the window
const SEAT = [-140, 1060], CHAIR_Z = 1130, TABLE = { x: -120, z: 1060, w: 130 }, MANGO_AT = [140, 1040], STAND = [-270, 1090];
const toScr = (x, y) => [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z];
const ALL = Array.from({ length: 25 }, (_, i) => i), NO_MID = ALL.filter(i => i !== 12);
const CAMP = { f: 1400, cy: 330, hy: 860 };

// timing helpers (scene-relative seconds)
const plopT = () => t_('sit') + .36;                                                            // the moment she lands in the chair
const elapsed = lt => 40 * clamp((lt - (t_('sit') + .3)) / (t_('ring') - t_('sit') - .3));      // fictional seconds of break used (the clock runs at ten times speed while she sits)
const tube = lt => ((lt > .25 && lt < 1.05) || (lt > 6.95 && lt < 7.25) || (lt > 11.15 && lt < 11.4)) ? (hash(Math.floor(lt * 15) + 3) > .42 ? 1 : .08) : 1;   // the failing tube
const alarm = lt => { const r = t_('ring'); if (lt < r || lt >= t_('dab')) return 0; const k = lt - r; return (Math.sin(k * TAU * 1.7 + .6) > -.15 ? 1 : .12) * (k < 1.0 ? 1 : .62); };   // the call light, flashing until the card insert

// ---- the set: a cold, tired break room (the S6 shell and furniture kit, our own colors and fixtures) ----
function room(lt) {
  const dk = easeOut(seg(lt, .1, .62)), tb = tube(lt), al = alarm(lt);
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: '#cdd8d3', wain: '#4f7b83', floorA: '#bcc7c3', floorB: '#8d9a98', ceil: '#dfe8e6', fog: '#8fa4ac', fogAmt: .3, tile: 110, bright: .96, rail: 100 });
  // the window: night, a few stars and a parking-lot lamp
  S6.backWindow(ZB, { x0: 80, x1: 320, y0: 200, y1: 470, sky: ['#060b24', '#1c2f66'], mull: 2, beam: '150,185,255', beamA: .09, beamLen: 700, beamDx: -140,
    draw: f => { const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
      ctx.fillStyle = '#e8f0ff'; for (let i = 0; i < 16; i++) { ctx.globalAlpha = .35 + .5 * hash(i + 2); ctx.fillRect(fx0 + w * hash(i), fy1 + h * .6 * hash(i + 30), 3, 3); } ctx.globalAlpha = 1;
      V2.glow(fx0 + w * .78, fy0 - h * .2, h * .5, '255,236,180', .5, 'screen', .3); ctx.fillStyle = '#10142a'; ctx.fillRect(fx0, fy0 - h * .1, w, h * .1); } });
  // the sliding door into the hall: a leaf that rolls left into the wall, behind the vending machine
  { const { x0, x1, y1 } = DOOR, k = S6.kz(ZB), f = [V2.p2(x0, 0, ZB), V2.p2(x1, 0, ZB), V2.p2(x1, y1, ZB), V2.p2(x0, y1, ZB)];
    S6.onZ(ZB, x0 - 14, x1 + 14, 0, y1 + 14, '#e3ebe8', 'rgba(25,16,30,.6)', 2.4);
    if (dk > .02) { V2.poly(f, V2.grad(0, f[2][1], 0, f[0][1], [[0, '#e6f6ff'], [1, '#bfe0f6']])); V2.glow((f[0][0] + f[1][0]) / 2, (f[0][1] + f[2][1]) / 2, 420 * k, '200,230,255', .32 * dk, 'screen', .5); }
    const sh = dk * (x1 - x0 + 4);
    S6.onZ(ZB, x0 - sh, x1 - sh, 0, y1, '#a8bac1', 'rgba(25,16,30,.6)', 2);
    S6.onZ(ZB, x0 - sh + 36, x1 - sh - 36, 250, 380, 'rgba(212,236,250,.5)', 'rgba(25,16,30,.4)', 1.6); }
  // the call-light dome over the door
  { const [dx, dy] = V2.p2(DOME[0], DOME[1], ZB - 4), kk = S6.kz(ZB);
    ctx.save(); ctx.translate(dx, dy); ctx.scale(kk, kk);
    ctx.fillStyle = '#e8eef0'; ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = 3; rr(-48, -18, 96, 36, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = al > .05 ? `rgb(255,${60 + 40 * (1 - al) | 0},${60 + 40 * (1 - al) | 0})` : '#7a2a30'; ctx.beginPath(); ctx.ellipse(0, -18, 32, 28, 0, PI, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ell(-10, -34, 9, 5, -.5); ctx.fill();
    ctx.restore();
    if (al > .05) V2.glow(dx, dy - 18 * kk, 420 * kk, '255,40,50', .85 * al, 'screen', .9); }
  // the wall clock: a four-minute wedge from 3:34 to 3:38 and a second hand that races through it
  { const e = elapsed(lt), min = 34 + e / 60, [cx, cy] = V2.p2(CLOCK.x, CLOCK.y, ZB), R = S6.kz(ZB) * CLOCK.r;
    S6.wallClock(CLOCK.x, CLOCK.y, ZB, 1, min, 3, CLOCK.r);
    const a0 = (34 / 60) * TAU - PI / 2, a1 = (38 / 60) * TAU - PI / 2, sa = ((e % 60) / 60) * TAU - PI / 2;
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(232,25,58,.34)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R * .84, a0, a1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8193a'; ctx.lineWidth = Math.max(3, R * .11); ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(0, 0, R * .96, a0, a1); ctx.stroke();
    ctx.strokeStyle = '#e8193a'; ctx.lineWidth = Math.max(1.6, R * .04); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-Math.cos(sa) * R * .16, -Math.sin(sa) * R * .16); ctx.lineTo(Math.cos(sa) * R * .86, Math.sin(sa) * R * .86); ctx.stroke();
    ctx.fillStyle = '#e8193a'; ctx.beginPath(); ctx.arc(0, 0, R * .07, 0, TAU); ctx.fill();
    ctx.restore(); }
  // vending machine back left (its glass is the brightest thing in the room), fridge back right, counter along the right wall
  S6.box3({ x0: -440, x1: -300, y1: 430, z0: 2000, z1: 2130, color: '#2a4f96', front: '#3566b4', side: '#21407a' });
  S6.onZ(2000, -424, -318, 150, 400, 'rgba(225,246,255,.82)', 'rgba(15,20,40,.8)', 2);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) S6.onZ(2000, -414 + c * 32, -394 + c * 32, 180 + r * 58, 212 + r * 58, ['#e8193a', '#ffd23a', '#58b83a', '#ff9f1c'][(r + c) % 4]);
  { const [vx, vy] = V2.p2(-370, 280, 2000); V2.glow(vx, vy, 300 * S6.kz(2000), '190,235,255', .3, 'screen', .35); }
  S6.box3({ x0: 340, x1: 450, y1: 480, z0: 2040, z1: 2180, color: '#e9eef2', front: '#f4f7fa', side: '#c9d2d9' });
  S6.onZ(2040, 350, 440, 235, 239, 'rgba(0,0,0,.25)'); S6.onZ(2040, 352, 360, 300, 420, '#aab4bd');
  S6.box3({ x0: 250, x1: 450, y1: 200, z0: 1100, z1: 2030, color: '#c9d3d3', top: '#55606a', front: '#b9c4c6', side: '#98a6a8' });
  { const X = -HW, q = [V2.p2(X, 250, 1250), V2.p2(X, 250, 1750), V2.p2(X, 450, 1750), V2.p2(X, 450, 1250)]; V2.poly(q, '#b98a5a', 'rgba(25,16,30,.7)', 3);
    V2.poly([V2.p2(X, 262, 1262), V2.p2(X, 262, 1738), V2.p2(X, 438, 1738), V2.p2(X, 438, 1262)], '#d7b98a');
    for (const [z, y, c] of [[1330, 380, '#fff3a6'], [1470, 340, '#ffb3c6'], [1600, 390, '#bfe3ff'], [1690, 330, '#d8ffb0'], [1400, 290, '#ffe0a0']]) V2.poly([V2.p2(X, y, z - 36), V2.p2(X, y, z + 36), V2.p2(X, y + 56, z + 36), V2.p2(X, y + 56, z - 36)], c, 'rgba(25,16,30,.35)', 1.4); }
  S6.microwave(350, 1500, { on: 0, display: '3:34' });
  // the ceiling: two fluorescent panels, the near one failing
  S6.ceilingLamp(0, 760, CH, tb, '210,234,255', 110, 170); S6.ceilingLamp(0, 1480, CH, 1, '210,234,255', 110, 170);
}

// ---- the cast ----
function cast(lt) {
  const sitT = t_('sit'), plop = plopT(), s1 = t_('s1'), m1 = t_('m1'), s2 = t_('s2'), ring = t_('ring'), s4 = t_('s4'), m3 = t_('m3'), s5 = t_('s5'), dab = t_('dab'), m4 = t_('m4');
  const sPath = route([[0, -215, 2170], [.5, -215, 2170], [3.0, STAND[0], STAND[1], 'out'], [sitT - .1, STAND[0], STAND[1]], [sitT + .3, SEAT[0], SEAT[1], 'io']]);
  const mPath = route([[0, -125, 2170], [1.1, -125, 2170], [3.3, MANGO_AT[0], MANGO_AT[1], 'out']]);
  const frozen = lt >= ring - .02 && lt < t_('s5') ? ring : undefined;   // she does not move: her clock stops, mouth excepted
  // Strawberry: power-walks in with her 3-11 mug, steps to the chair, drops into it and goes still
  let so, sz;
  { const seated = lt >= plop, [X, Z] = sPath(lt), q = V2.at(X, Z); sz = Z;
    const exprS = lt < s1 ? 'dead' : inB(lt, 's1') ? 'sour' : inB(lt, 'm1') ? 'dead' : inB(lt, 's2') ? 'chill' : lt < t_('s3') ? 'chill' : inB(lt, 's3') ? 'dead' : lt < s5 ? 'chill' : 'dead';
    const lidS = lt < s1 ? .5 : (lt >= plop + .25 && lt < t_('s3') + .35) ? 1 : (lt >= ring - .05 && lt < s5 + .1) ? 1 : (lt >= t_('s3') ? .58 : undefined);
    const lookS = seated ? [.6, .1] : lt < s1 + 1.6 ? [.35, .1] : [.6, .05];
    if (!seated) {
      const walking = (lt > .5 && lt < 3.0) || (lt > sitT - .1 && lt < sitT + .3);
      so = person(straw, sPath, lt, { stride: 42, transit: lt < 2.0, look: lookS, expr: exprS, lid: lidS, hold: { r: 'mug7' }, grip: { r: [78, 48] }, arms: { l: walking ? [.28 + .35 * Math.sin(lt * 9), .25] : 'rest', r: 'hold' } });
    } else {
      const d = easeOut(seg(lt, plop, plop + .18)), sq = .13 * Math.sin(PI * seg(lt, plop, plop + .4)) * (1 - seg(lt, plop + .4, plop + .5)), sigh = seg(lt, plop + .15, plop + .45) * (1 - seg(lt, plop + .85, plop + 1.25));
      so = straw({ x: q.x, y: q.y - (92 - 37 * d) * q.s, s: q.s, noLegs: true, noShadow: true, noReflect: true, lift: 0, look: lookS, expr: exprS, lid: lidS, squash: sq, mouthOpen: .42 * sigh, arms: { l: 'rest', r: 'rest' }, t: frozen, noBob: frozen != null });
    }
  }
  // Mango: bounces in behind her holding the card, stands at the end of the table
  let mo, mz;
  { const [X, Z] = mPath(lt), q = V2.at(X, Z); mz = Z;
    const hop = [m1 + .02, m1 + .38].reduce((m, h) => { const k = (lt - h) / .3; return k > 0 && k < 1 ? Math.max(m, Math.sin(k * PI) * 44 * q.s) : m; }, 0)
      + [m4 + .02, m4 + .4, m4 + .78].reduce((m, h) => { const k = (lt - h) / .3; return k > 0 && k < 1 ? Math.max(m, Math.sin(k * PI) * 52 * q.s) : m; }, 0);
    const exprM = lt < m1 ? 'happy' : inB(lt, 'm1') ? 'hopeful' : inB(lt, 'm2') ? 'neutral' : lt >= ring + .02 && lt < m3 ? 'shock' : inB(lt, 'm3') ? 'hopeful' : lt >= m4 ? 'happy' : 'neutral';
    const lookM = lt >= ring + .02 && lt < t_('s4') + .9 ? [-.25, -.9] : [-.6, 0];
    const marks = lt >= dab + .3 ? ALL.map(i => ({ i, age: i === 12 ? lt - (dab + .3) : 9 })) : NO_MID;
    const cheer = inB(lt, 'm1') || lt >= m4;
    const base = { stride: 46, look: lookM, expr: exprM, hold: { l: 'card7' }, grip: { l: [-100, -8] }, cardMarks: marks, cardNow: lt, arms: { l: 'hold', r: lt < 3.3 ? [.28 + .35 * Math.sin(lt * 9 + 2), .25] : cheer ? 'cheer' : (lt >= ring + .02 && lt < m3) ? 'up' : 'rest' } };
    mo = person(mango, mPath, lt, Object.assign(base, { transit: lt < 2.0 }));
    mo.lift = hop;
    if (lt >= ring + .02 && lt < m3) mo.rot = .05 * Math.sin(lt * 26);   // a flinch at the alarm
  }
  return { straw: so, sz, mango: mo, mz, sv: lt >= .45, mv: lt >= 1.1 };
}

// ---- the shots ----
function shot(lt) {
  const b = id => B(id);
  if (lt < b('s1').s - .05) return 'wide';
  if (lt < b('m1').s - .05) return 'cuS1';
  if (lt < b('s2').s - .05) return 'cuM1';
  if (lt < plopT() - .06) return 'cuS2';
  if (lt < b('s4').s - .05) return 'hold';
  if (lt < b('m3').s - .05) return 'cuS4';
  if (lt < b('s5').s - .05) return 'cuM3';
  if (lt < b('dab').s - .05) return 'cuS5';
  if (lt < b('m4').s - .05) return 'card';
  if (lt < b('s6').s - .05) return 'cele';
  return 'cuS6';
}
const SUBJ = { cuS1: 'straw', cuS2: 'straw', cuS4: 'straw', cuS5: 'straw', cuS6: 'straw', cuM1: 'mango', cuM3: 'mango' };

// ---- the card insert: the whole card, every square daubed but BREAK, and one big pink dauber coming down on it ----
function insCard(lt) {   // lt: seconds since the beat began
  const hit = .3, k0 = easeBack(clamp(lt / .2)), punch = 1 - .045 * Math.sin(clamp((lt - hit) / .2) * PI) * (lt >= hit ? 1 : 0);
  A6.bokeh(lt, ['255,200,120', '255,120,190', '120,180,255'], ['#1d1a3e', '#2f2a5e']);
  const done = lt >= hit, glow = done ? seg(lt, hit, hit + .3) : 0;
  ctx.save(); ctx.translate(540, 800); ctx.rotate(-.035 + .01 * Math.sin(lt * 2)); const sc = lerp(1.35, 1, k0) * punch; ctx.scale(sc, sc);
  reg('overlay', [540 - 412 * sc, 800 - 512 * sc, 540 + 412 * sc, 800 + 512 * sc], { id: 'card-insert', transit: k0 < 1 });
  A7.drawCard(-400, -500, 800, 1000, ALL.map(i => ({ i, age: i === 12 ? (done ? lt - hit : -1) : 9 })).filter(m => !(m.i === 12 && !done)), { hi: done ? [] : [12], t: T });
  const mx = 0, my = 62.5;   // the middle square, in card coordinates
  if (done) {   // the big blot over BREAK, and a ring of drops thrown from the dauber
    const a = lt - hit, pk = easeBack(clamp(a / .18)), R0 = 96 * pk;
    ctx.save(); ctx.translate(mx, my); ctx.beginPath();
    for (let i = 0; i <= 36; i++) { const an = i / 36 * TAU, rr2 = R0 * (1 + .07 * Math.sin(an * 3 + 1.7) + .05 * Math.sin(an * 5 + 3.4)); i ? ctx.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2) : ctx.moveTo(Math.cos(an) * rr2, Math.sin(an) * rr2); }
    ctx.closePath(); ctx.fillStyle = V2.grad(-R0, -R0, R0, R0, [[0, 'rgba(255,120,200,.94)'], [1, 'rgba(176,30,120,.94)']]); ctx.fill(); ctx.strokeStyle = 'rgba(120,10,80,.6)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(-R0 * .32, -R0 * .36, R0 * .22, R0 * .12, -.6); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(mx, my);
    for (let i = 0; i < 14; i++) { const ang = i / 14 * TAU + hash(i) * .4, d = lerp(40, 70 + 80 * hash(i + 5), easeOut(clamp(a / .22))), r = (7 + 12 * hash(i + 9)) * (1 - seg(a, .3, .9) * .2); ctx.fillStyle = 'rgba(214,56,154,.88)'; ctx.beginPath(); ctx.arc(Math.cos(ang) * d * 1.25, Math.sin(ang) * d * 1.25, r, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = `rgba(255,224,70,${.9 * glow})`; ctx.lineWidth = 12; rr(-400, -500, 800, 1000, 26); ctx.stroke();
  }
  // the dauber: hovers up and right, then slams down on the middle square; its tip lands exactly on the square at the hit
  const dx0 = 230, dy0 = -330, down = lt < hit ? easeIn(seg(lt, .05, hit)) : 1, up = easeOut(seg(lt, hit + .14, hit + .5));
  const px = lerp(mx + dx0 * (1 - .4 * seg(lt, 0, .05)), mx, down) + dx0 * up * 2.2, py = lerp(my + dy0, my, down) + dy0 * up * 2.4, rot = lerp(.34, 0, down) + .3 * up;
  ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
  const limb = '#2a2530', gl = '#f6f7fb';
  ctx.strokeStyle = limb; ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(40, -210); ctx.lineTo(180, -600); ctx.stroke();   // Mango's arm, in from the corner
  ctx.fillStyle = V2.grad(-56, 0, 56, 0, [[0, '#ff8ad0'], [.6, '#e8409e'], [1, '#a81a70']]); ctx.strokeStyle = 'rgba(25,16,30,.9)'; ctx.lineWidth = 8;
  rr(-56, -330, 112, 270, 36); ctx.fill(); ctx.stroke();                                  // the bottle
  ctx.fillStyle = '#fff'; rr(-42, -250, 84, 84, 12); ctx.fill(); ctx.fillStyle = '#c0207f'; ctx.beginPath(); ctx.ellipse(-4, -208, 20, 16, 0, 0, TAU); ctx.fill();   // its label
  ctx.fillStyle = '#f2f2f6'; ctx.strokeStyle = 'rgba(25,16,30,.9)'; rr(-34, -76, 68, 24, 8); ctx.fill(); ctx.stroke();   // the neck
  ctx.fillStyle = '#ff7ac8'; ctx.beginPath(); ctx.ellipse(0, -44, 40, 20, 0, 0, TAU); ctx.fill(); ctx.stroke();       // the foam tip
  ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(8, -262, 52, 46, 0, 0, TAU); ctx.fill(); ctx.stroke();            // her glove round the bottle
  ctx.fillStyle = '#4a4258'; rr(18, -314, 44, 46, 10); ctx.fill();
  ctx.restore();
  ctx.restore();
  // flash and shock rings on the hit, then confetti on the ding
  if (done) { const a = lt - hit; ctx.save(); ctx.globalAlpha = .55 * (1 - seg(a, 0, .22)); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const [sx, sy] = [540, 800 + 62.5]; for (let i = 0; i < 2; i++) A6.ring(sx, sy, (a - i * .12) / .8, 'moon', { r0: 70, r1: 640, lw: 14 - i * 4, alpha: .8 }); }
  if (lt >= .5) { const a = lt - .5, cols = ['#ff7ac8', '#ffd60a', '#5ae682', '#50a5ff', '#ffffff', '#ff4646'];
    ctx.save();
    for (let i = 0; i < 48; i++) { const v = 260 + 340 * hash(i + 11), ang = -PI / 2 + (hash(i + 3) - .5) * 2.6, x = 540 + Math.cos(ang) * v * a * .9 + 40 * Math.sin(a * 3 + i), y = 880 + Math.sin(ang) * v * a * 1.1 + 620 * a * a;
      if (y > H + 30 || y < -30 || x < -30 || x > W + 30) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(a * (3 + 4 * hash(i + 5)) + i); ctx.scale(1, Math.cos(a * (5 + 3 * hash(i + 8)) + i)); ctx.globalAlpha = .95 * (1 - seg(a, 1.0, 1.25)); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-9, -5, 18, 10); ctx.restore(); }
    ctx.restore(); }
  V2.glow(540, 860, 560, '255,200,230', .22 * glow, 'screen', .4);
}

// ---- the confetti that rains in the room after the bingo, drawn behind the characters ----
function confetti(lt, t0) {
  if (lt < t0) return;
  const a = lt - t0, cols = ['#ff7ac8', '#ffd60a', '#5ae682', '#50a5ff', '#ffffff', '#ff4646'];
  ctx.save();
  for (let i = 0; i < 60; i++) { const x = 60 + 960 * hash(i + 21) + 30 * Math.sin(a * 1.7 + i), y = 300 + 1000 * hash(i + 3) - 700 + a * (190 + 150 * hash(i + 11)); if (y < 150 || y > 1500) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a * (2 + 3 * hash(i + 5)) + i); ctx.scale(1, Math.cos(a * (3 + 2 * hash(i + 8)) + i)); ctx.globalAlpha = .9 * seg(a, 0, .3); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-9, -5, 18, 10); ctx.restore(); }
  ctx.restore();
}

// ---- the break timer pill, in the HUD slot on the top row (right of the time pill) ----
function fmt(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
function pill(lt) {
  const s1 = t_('s1'), a = seg(lt, s1 + 1.0, s1 + 1.35) * (1 - seg(lt, t_('dab') - .25, t_('dab') - .02));
  if (a <= 0) return;
  const x = 520, y = 128, w = 512, h = 112, s = easeBack(clamp(a)), cx = x + w / 2, cy = y + h / 2, ring = t_('ring'), s4 = t_('s4'), used = lt >= s4;
  const e = elapsed(lt), blink = lt >= ring && !used ? (Math.sin((lt - ring) * 22) > 0 ? 1 : .35) : 1;
  reg('overlay', [x, y, x + w, y + h], { id: 'hud-break' });
  ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(10,8,22,.9)'; rr(x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = used ? 'rgba(255,224,70,.95)' : lt >= ring ? 'rgba(255,70,70,.95)' : 'rgba(150,205,255,.9)'; ctx.lineWidth = 4; rr(x, y, w, h, 28); ctx.stroke();
  // a little cup of coffee
  ctx.fillStyle = 'rgba(150,205,255,.18)'; ell(x + 58, cy, 38, 38); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 3; rr(x + 38, cy - 10, 36, 34, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 76, cy + 6, 9, -PI / 2, PI / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; for (const dx of [46, 62]) { ctx.beginPath(); ctx.moveTo(x + dx, cy - 16); ctx.quadraticCurveTo(x + dx + 5 * Math.sin(lt * 4 + dx), cy - 24, x + dx, cy - 32); ctx.stroke(); }
  text(used ? 'BREAK USED' : 'BREAK LEFT', x + 112, y + 32, { size: 21, fill: used ? '#ffe9a0' : '#c9d8ff', align: 'left', spacing: 3 });
  const val = used ? '0:40' : fmt(240 - e);
  ctx.save(); ctx.globalAlpha *= blink; text(val, x + 112, y + 82, { size: 64, font: 'Bangers', weight: 400, fill: used ? '#fff6c0' : lt >= ring ? '#ff8a8a' : '#fff', align: 'left', spacing: 2 }); ctx.restore();
  if (used) { const pk = easeBack(seg(lt, s4 + 1.15, s4 + 1.45)); if (pk > 0) { ctx.save(); ctx.translate(x + w - 126, y + 70); ctx.scale(pk, pk); ctx.fillStyle = '#ffcb2a'; rr(-108, -22, 216, 44, 12); ctx.fill(); text('PERSONAL BEST', 0, 2, { size: 21, fill: '#3a1a00', spacing: 1 }); ctx.restore(); } }
  ctx.restore();
}

window.__EP8_SCENES.break = {
  shot,
  cam(lt) {
    const sh = shot(lt), c = cast(lt), b = id => B(id);
    V2.setCam(CAMP);
    const fzS = (z, up = 80) => faceZoom({ kind: 'straw', x: c.straw.x, y: c.straw.y, s: c.straw.s, noLegs: c.straw.noLegs, lift: c.straw.lift }, z / c.straw.s, up);
    const fzM = (z, up = 80) => faceZoom({ kind: 'mango', x: c.mango.x, y: c.mango.y, s: c.mango.s, noLegs: c.mango.noLegs, lift: (c.mango.lift || 0) }, z / c.mango.s, up);
    if (sh === 'wide') { const k = seg(lt, 0, b('s1').s); zoomTo(lerp(535, 525, k), lerp(1045, 1035, k), lerp(1.2, 1.28, k)); }
    else if (sh === 'cuS1') fzS(2.3, 90);
    else if (sh === 'cuM1') fzM(2.6, 90);
    else if (sh === 'cuS2') { const k = seg(lt, b('s2').s - .05, plopT()); fzS(lerp(2.25, 2.4, k), 90); }
    else if (sh === 'hold') { const k = seg(lt, plopT() - .06, b('s4').s); zoomTo(lerp(552, 546, k), lerp(1062, 1050, k), lerp(1.12, 1.17, k)); }
    else if (sh === 'cuS4') { const k = seg(lt, b('s4').s - .05, b('m3').s); fzS(lerp(2.5, 2.62, k), 95); }
    else if (sh === 'cuM3') fzM(2.6, 90);
    else if (sh === 'cuS5') { const k = seg(lt, b('s5').s - .05, b('dab').s); fzS(lerp(2.55, 2.85, easeIO(k)), 95); }
    else if (sh === 'card') { CAM.x = W / 2; CAM.y = H / 2; CAM.z = 1; CAM.shake = lt >= b('dab').s + .3 && lt < b('dab').s + .65 ? 16 * (1 - (lt - b('dab').s - .3) / .35) : (lt < b('dab').s + .2 ? 10 * (1 - (lt - b('dab').s) / .2) : 0); }
    else if (sh === 'cele') zoomTo(543, 1062, 1.2);
    else if (sh === 'cuS6') { const k = seg(lt, b('s6').s - .05, b('s6').e); fzS(lerp(2.55, 2.68, k), 95); }
  },
  draw(lt) {
    const sh = shot(lt), t = t_;
    if (sh === 'card') { insCard(lt - t('dab')); return; }
    const al = alarm(lt), tb = tube(lt), subj = SUBJ[sh] || null, c = cast(lt);
    V2.setLight({ key: [-.3, -.85], keyColor: '#dcecff', keyA: .22, rim: '#8fd0ff', rimA: .42, shadow: '#0e1830', shadowA: .4, amb: '#cfe6ff', ambA: .07, bounce: '#b8e0d0', bounceA: .12 });
    V2.opts.reflect = true;
    const blurPx = subj ? 8 : 0;
    // the room, with the chair behind the seat and the confetti after the bingo
    V2.dof(blurPx, () => {
      room(lt);
      chairShadow(SEAT[0], CHAIR_Z); S6.chair3(SEAT[0], CHAIR_Z, { color: '#c47a52', w: 50, d: 44, seat: 120, back: 280 });
      if (lt >= t('dab') + .5) confetti(lt, t('dab') + .5);
    });
    if (al > .05) { const [dx, dy] = V2.p2(DOME[0], DOME[1] - 30, ZB - 4); V2.addLight({ x: dx, y: dy, r: 900, color: '255,40,50', a: .55 * al }); }
    V2.addLight({ x: 560, y: 520, r: 1100, color: '205,232,255', a: .26 * tb });
    // the cast, farthest first; the subject sharp, the neighbor soft
    const list = [['straw', c.straw, c.sz, c.sv], ['mango', c.mango, c.mz, c.mv]].filter(q => q[3]).sort((a, b) => b[2] - a[2]);
    for (const [id, o] of list) (subj && subj !== id ? nbr : drawChar)(o);
    // the break table, in front of the seat, with her mug on it once she lets go of it
    const noTable = (sh === 'cuS1' && c.sz > 1250) || sh === 'cuM1' || sh === 'cuM3';
    if (!noTable) V2.dof(subj ? 5 : 0, () => {
    S6.table3(TABLE.x, TABLE.z, { w: TABLE.w, d: 70, h: 135, color: '#c9a26a' });
    if (lt >= plopT() + .1) { const [mx, my] = V2.p2(-10, 151, TABLE.z + 20), k = S6.kz(TABLE.z), dd = easeBack(seg(lt, plopT() + .1, plopT() + .3));
      ctx.save(); ctx.translate(mx, my); ctx.scale(k * dd, k * dd); ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 2, 34, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(-26, -54, 52, 56, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(28, -26, 11, -PI / 2, PI / 2); ctx.stroke();
      ctx.fillStyle = '#5a3210'; ell(0, -50, 22, 5); ctx.fill(); text('3-11', 0, -24, { size: 13, fill: '#d62828' });
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; for (const ddx of [-2, 12]) { ctx.beginPath(); ctx.moveTo(ddx, -60); ctx.quadraticCurveTo(ddx + 6 * Math.sin(lt * 3 + ddx), -70, ddx, -80); ctx.stroke(); }
      ctx.restore(); }
    });
    // the call light's ripples, from the dome over the door
    if (al > .05) { const [dx, dy] = V2.p2(DOME[0], DOME[1] - 10, ZB - 4); for (let i = 0; i < 3; i++) A6.ring(dx, dy, (((lt - t('ring')) * 1.7 - i * .33) % 1 + 1) % 1, 'door', { r0: 16, r1: 300, lw: 7, alpha: .7 * al }); }
    if (al > .05) { const [dx, dy] = V2.p2(DOME[0], DOME[1] - 10, ZB - 4); V2.glow(dx, dy, 1500, '255,30,40', .34 * al, 'screen', .5); }
    V2.dust(60, 400, 1020, 1500, lt, { n: 28, alpha: .3, color: '200,225,255' });
  },
  fx(lt) {
    const tb = tube(lt), al = alarm(lt), dab = t_('dab'), warm = easeOut(seg(lt, dab + .45, dab + 1.0));
    return { bloom: .5, vignette: .55, grain: .055, contrast: .17, sat: shot(lt) === 'card' ? .14 : 0,
      tint: [['#8fc4ea', .17 * (1 - warm), 'soft-light'], ['#071a2c', .13 * (1 - warm), 'multiply'], ['#ff2a3a', .26 * al, 'soft-light'], ['#ffd27a', .18 * warm, 'soft-light']],
      fade: Math.max((1 - tb) * .38, (1 - seg(lt, 0, .3)) * .6, seg(lt, CUR.dur - .32, CUR.dur - .02)), fadeColor: lt > CUR.dur / 2 ? '0,0,10' : '6,12,24' };
  },
  blur(lt) { const p = plopT(); return (lt > .5 && lt < 3.1) || (lt > t_('sit') - .1 && lt < t_('sit') + .3) ? 2 : (lt > p - .02 && lt < p + .3) ? 3 : 1; },
  over(lt) {
    const t = t_, sh = shot(lt);
    pill(lt);
    if (sh !== 'card') {
      const c = cast(lt), [fx, fy] = faceC({ kind: 'straw', x: c.straw.x, y: c.straw.y, s: c.straw.s, noLegs: c.straw.noLegs, lift: 0 }), [sx, sy] = toScr(fx, fy);
      sfxWord(lt, plopT() + .02, 'FWUMP', clamp(sx - 220, 230, 850), clamp(sy - 390, 330, 700), { fill: '#ffe135', size: 110, rot: -.1 });
      sfxWord(lt, t('ring') + .05, 'BRRRING!', 640, 400, { fill: '#ff6a78', size: 124, hold: .5, rot: .05 });   // gone before the cut to the close-up
    } else {
      sfxWord(lt, t('dab') + .5, 'BINGO!', 540, 1450, { fill: '#ff7ac8', size: 200, hold: 1.0, rot: -.06 });
    }
  },
};
})();
