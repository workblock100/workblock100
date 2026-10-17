'use strict';
/* SHIFT HAPPENS, Episode 9: The Agency Nurse.
 *
 * The facility hires a per diem agency nurse, Persimmon: orientation is four minutes, her residents number twelve, helping is not in her contract,
 * and at exactly 11:00 PM she walks out with the keys. Strawberry notices the other budget.
 * This file owns the title (a staffing app's map), the orientation at the nurses' station (an inserted contract, a failing login, and the
 * dealing of forty residents) and the end card. The front-door arrival, the split-screen shift and the exit with the parking lot live in
 * ep9_arrival.js, ep9_floor.js and ep9_exit.js and register on window.__EP9_SCENES.
 * Built on the v2 renderer and the Episode 6, 7 and 8 kits plus ep9_art.js. World positions are (X, Z) through V2.at(X, Z). */
(() => {
if (!window.TIMELINE_EP9) return;
const { person, zoomTo, faceZoom, drawBg, inB, grad2, confetti } = window.H6;
const A7 = window.A7, S7 = window.S7, A6 = window.A6, A9 = window.A9;
const { lemon, straw, mango } = A7;
const persimmon = A9.persimmon;
// scene-relative time of a spoken word, from the recorded line's word timings
const wordT = (id, word) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return l.s - CUR.start + w[1]; };
// a neighbor of the subject in a close-up: out of focus, behind the shot, never audited
const nbr = o => V2.dof(6, () => drawBg(o));
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}

const SCENES = {};

// ============================================================================ title: SHIFTGO, a rideshare for nurses
// a flat city map in screen space: blocks with buildings, a park, a river, streets with names. The route is the roads the car takes to the pin
const PIN = [640, 790];
const VX = [130, 290, 430, 640, 820, 990], HY = [330, 560, 790, 1160, 1480, 1740];
const ROUTE = [[130, 2010], [130, 1480], [430, 1480], [430, 1160], [640, 1160], [640, 790]];
const RSEG = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1])), RTOT = RSEG.reduce((a, b) => a + b, 0);
function routeXY(s) {
  s = clamp(s, 0, RTOT);
  for (let i = 0; i < RSEG.length; i++) { if (s <= RSEG[i] || i === RSEG.length - 1) { const a = ROUTE[i], b = ROUTE[i + 1], k = s / RSEG[i]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; } s -= RSEG[i]; }
}
const STREETS_V = ['PEEL ST', 'PIT LN', 'GRAPEVINE RD', 'CITRUS BLVD', 'ZEST AVE', 'PULP WAY'], STREETS_H = ['JUICE AVE', 'RIND ST', 'BOWL AVE', 'SEEDLESS BLVD', 'CORE ST', 'STEM ST'];
function mapBase() {
  ctx.fillStyle = '#e9ece3'; ctx.fillRect(-120, -120, W + 240, H + 240);
  const xs = [-140, ...VX, 1220], ys = [-140, ...HY, 2060];
  // the river, behind the streets
  ctx.save(); ctx.lineCap = 'round';
  for (const [lw, col] of [[150, '#a9d0e8'], [122, '#bfe1f6']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-160, 150); ctx.bezierCurveTo(220, 40, 640, 260, 1240, 110); ctx.stroke(); }
  ctx.restore();
  // the blocks
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x0 = xs[i] + 24, x1 = xs[i + 1] - 24, y0 = ys[j] + 24, y1 = ys[j + 1] - 24;
    if (y1 < 250 && j < 1) continue;
    const park = i === 1 && j === 2;
    ctx.fillStyle = park ? '#c4e3b8' : '#f5f4ee'; rr(x0, y0, x1 - x0, y1 - y0, 10); ctx.fill();
    if (park) { ctx.fillStyle = '#9fcf93'; for (let q = 0; q < 14; q++) { ell(x0 + 20 + hash(q + 3) * (x1 - x0 - 40), y0 + 20 + hash(q + 40) * (y1 - y0 - 40), 11 + hash(q) * 9, 11 + hash(q) * 9); ctx.fill(); } continue; }
    ctx.fillStyle = '#e1dfd6';
    const n = 2 + Math.floor(hash(i * 7 + j * 3) * 3);
    for (let q = 0; q < n; q++) { const bw = 36 + hash(i + j * 5 + q) * 60, bh = 30 + hash(i * 3 + j + q * 9) * 60; rr(x0 + 10 + hash(i * 11 + j + q * 2) * Math.max(1, x1 - x0 - bw - 20), y0 + 10 + hash(i + j * 13 + q * 5) * Math.max(1, y1 - y0 - bh - 20), bw, bh, 6); ctx.fill(); }
  }
  // streets: a grey casing, then white
  ctx.lineCap = 'butt';
  for (const [lw, col] of [[44, '#d3d6dd'], [34, '#ffffff']]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for (const x of VX) { ctx.moveTo(x, -140); ctx.lineTo(x, 2060); }
    for (const y of HY) { ctx.moveTo(-140, y); ctx.lineTo(1220, y); }
    ctx.stroke();
  }
  // one diagonal avenue, in the orange of a main road
  for (const [lw, col] of [[40, '#e9b866'], [30, '#ffd98c']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(1180, 520); ctx.lineTo(820, 1160); ctx.lineTo(560, 1700); ctx.stroke(); }
  // street names
  ctx.fillStyle = '#8b90a0'; ctx.font = '900 17px Nunito'; ctx.letterSpacing = '2px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  VX.forEach((x, i) => { for (const y of [440, 980, 1330, 1620]) { ctx.save(); ctx.translate(x, y); ctx.rotate(-PI / 2); ctx.fillText(STREETS_V[i], 0, 0); ctx.restore(); } });
  HY.forEach((y, i) => { for (const x of [250, 720, 905]) { if (i === 0 && x === 250) continue; if ((i === 1 || i === 2) && x === 720) continue; /* the ETA bubble and the pin sit here */ ctx.fillText(STREETS_H[i], x, y); } });
  ctx.letterSpacing = '0px';
}
// the car and the violet route ahead of it. p is progress along the route, 0 to 1
function routeAndCar(lt, p, hit) {
  const s = p * RTOT, [cx, cy] = routeXY(s), [ax, ay] = routeXY(s - 34), [bx, by] = routeXY(s + 34), head = Math.atan2(by - ay, bx - ax);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // the trail behind is a pale violet, the route ahead is solid
  const pts = [[0, 0]]; let acc = 0; for (let i = 0; i < RSEG.length; i++) { acc += RSEG[i]; pts.push([acc, i + 1]); }
  const draw = (from, to, lw, col) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); const a = routeXY(from); ctx.moveTo(a[0], a[1]); for (const [d, i] of pts) if (d > from && d < to) ctx.lineTo(ROUTE[i][0], ROUTE[i][1]); const b = routeXY(to); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
  draw(0, s, 14, 'rgba(108,75,255,.28)');
  draw(s, RTOT, 24, '#ffffff'); draw(s, RTOT, 14, '#6c4bff');
  ctx.restore();
  // the car, seen from above: black body, a windscreen, headlights and the violet SHIFTGO dome on the roof
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(head + PI / 2); ctx.scale(1.45, 1.45);
  ctx.fillStyle = 'rgba(108,75,255,.22)'; ell(0, 2, 62, 62); ctx.fill();
  ctx.fillStyle = 'rgba(20,16,40,.28)'; rr(-24, -34, 52, 90, 16); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(-18, -46); ctx.lineTo(-52, -150); ctx.lineTo(52, -150); ctx.lineTo(18, -46); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#25212e'; ctx.strokeStyle = '#0d0b14'; ctx.lineWidth = 3; rr(-22, -42, 44, 88, 15); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6b7188'; rr(-16, -26, 32, 18, 6); ctx.fill(); rr(-16, 14, 32, 14, 5); ctx.fill();
  ctx.fillStyle = '#fff2b0'; ell(-13, -42, 5, 3); ctx.fill(); ell(13, -42, 5, 3); ctx.fill();
  ctx.fillStyle = '#e8193a'; rr(-17, 42, 10, 4, 2); ctx.fill(); rr(7, 42, 10, 4, 2); ctx.fill();
  ctx.fillStyle = '#6c4bff'; rr(-9, -4, 18, 11, 5); ctx.fill();
  ctx.restore();
  return [cx, cy];
}
// the pin on the facility: a red drop, a label and an ETA that counts down, then ARRIVED
function drawPin(lt, p, hit) {
  const arrived = lt >= hit, mins = Math.max(0, Math.ceil((1 - p) * 3 - .001)), pulse = arrived ? 1 + .06 * Math.sin((lt - hit) * 9) : 1;
  ctx.save(); ctx.translate(PIN[0], PIN[1]);
  ctx.fillStyle = 'rgba(20,16,40,.25)'; ell(0, 4, 26, 9); ctx.fill();
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#e8193a'; ctx.strokeStyle = '#7e0718'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-52, -52, -44, -110, 0, -110); ctx.bezierCurveTo(44, -110, 52, -52, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ell(0, -66, 22, 22); ctx.fill();
  ctx.fillStyle = '#e8193a'; rr(-5, -86, 10, 40, 3); ctx.fill(); rr(-20, -71, 40, 10, 3); ctx.fill();   // a cross
  ctx.restore();
  // the name plate, to the right of the pin
  const fadeOut = 1 - seg(lt, hit + .1, hit + .4);
  ctx.save(); ctx.globalAlpha *= fadeOut; ctx.translate(PIN[0] + 52, PIN[1] - 78);
  ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.strokeStyle = 'rgba(20,16,40,.25)'; ctx.lineWidth = 3; rr(0, -34, 330, 68, 16); ctx.fill(); ctx.stroke();
  text('FRUIT BOWL', 165, -12, { size: 26, fill: '#2a2530', weight: 900, spacing: 2 }); text('REHAB & NURSING', 165, 16, { size: 22, fill: '#6a6488', weight: 900, spacing: 2 });
  ctx.restore();
  // the ETA bubble
  const bw = arrived ? 250 : 150;
  ctx.save(); ctx.globalAlpha *= fadeOut; ctx.translate(PIN[0], PIN[1] - 188);
  ctx.fillStyle = arrived ? '#1f9a52' : '#15121c'; rr(-bw / 2, -34, bw, 68, 34); ctx.fill();
  text(arrived ? 'ARRIVED' : `${mins} MIN`, 0, 3, { size: 38, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 });
  ctx.restore();
}
// the push notification at the top and the nurse card at the bottom
function notif(lt) {
  const k = easeBack(seg(lt, .15, .6)) * (1 - easeIO(seg(lt, 1.5, 1.85)));
  if (k <= .02) return;
  ctx.save(); ctx.translate(540, 70 + 100 * k - 100); ctx.globalAlpha *= clamp(k * 3);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; ctx.fillStyle = 'rgba(255,255,255,.97)'; rr(-450, 0, 900, 150, 34); ctx.fill(); ctx.shadowColor = 'transparent';
  A9.appIcon(-370, 75, 96);
  text('SHIFTGO', -300, 36, { size: 24, fill: '#6a6488', weight: 900, align: 'left', spacing: 3 });
  text('Your nurse is arriving', -300, 78, { size: 42, fill: '#15121c', weight: 900, align: 'left' });
  text('Persimmon, per diem RN', -300, 118, { size: 28, fill: '#6a6488', weight: 700, align: 'left' });
  text('now', 410, 36, { size: 24, fill: '#9a9ab0', weight: 700, align: 'right' });
  ctx.restore();
}
function nurseCard(lt, p, hit) {
  const k = easeOut(seg(lt, .55, 1.0)) * (1 - easeIO(seg(lt, hit - .12, hit + .22)));
  if (k <= .01) return;
  ctx.save(); ctx.translate(0, (1 - k) * 640);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = -10; ctx.fillStyle = '#ffffff'; rr(0, 1300, W, 700, [46, 46, 0, 0]); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#d6d6e0'; rr(490, 1318, 100, 10, 5); ctx.fill();
  // the avatar
  ctx.save(); ctx.beginPath(); ctx.arc(150, 1450, 76, 0, TAU); ctx.fillStyle = '#ffe6c4'; ctx.fill(); ctx.clip();
  REG.suppress++; drawChar(persimmon({ x: 150, y: 1456, s: .74, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, expr: 'smug', acc: ['sunglasses'], id: 'persimmon-avatar', lid: .3 })); REG.suppress--;
  ctx.restore(); ctx.strokeStyle = '#6c4bff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(150, 1450, 80, 0, TAU); ctx.stroke();
  text('PERSIMMON', 262, 1418, { size: 56, fill: '#15121c', weight: 900, align: 'left' });
  text('Per diem RN   4.9 stars   12,408 shifts', 262, 1472, { size: 28, fill: '#6a6488', weight: 700, align: 'left' });
  A9.starRow(262 + 90, 1516, 17, 5, { empty: '#e2e2ec' });
  // the price, and the surge
  ctx.fillStyle = '#f4f2fb'; rr(60, 1580, 960, 230, 36); ctx.fill();
  text('$118/hr', 330, 1690, { size: 128, font: 'Bangers', weight: 400, fill: '#15121c', spacing: 2 });
  const sg = 1 + .06 * Math.sin(lt * 10);
  ctx.save(); ctx.translate(780, 1690); ctx.scale(sg, sg); ctx.fillStyle = '#e8193a'; rr(-190, -52, 380, 104, 52); ctx.fill();
  text('SURGE 3.4x', 0, 4, { size: 66, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 });
  ctx.restore();
  // the progress to arrival
  ctx.fillStyle = '#e2e2ec'; rr(60, 1850, 960, 14, 7); ctx.fill(); ctx.fillStyle = '#6c4bff'; rr(60, 1850, 960 * clamp(p), 14, 7); ctx.fill();
  ctx.restore();
}

SCENES.title = {
  noChyron: true, noScrim: true,   // no spoken lines here: the caption scrim would only dim the nurse card
  cam(lt) { const hit = B('logo').s + 2.2; CAM.shake = lt > hit && lt < hit + .6 ? 20 * (1 - (lt - hit) / .6) : 0; },
  draw(lt) {
    const hit = B('logo').s + 2.2, p = easeIO(seg(lt, .25, hit)), dim = easeOut(seg(lt, hit, hit + .4));
    ctx.save(); const zs = 1 + .06 * seg(lt, 0, hit + 1.2); ctx.translate(PIN[0], PIN[1]); ctx.scale(zs, zs); ctx.translate(-PIN[0], -PIN[1]);
    mapBase(); routeAndCar(lt, p, hit); drawPin(lt, p, hit);
    for (let i = 0; i < 3; i++) { const r = (lt - hit - i * .16) / 1.2; if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(232,25,58,${.7 * (1 - r)})`; ctx.lineWidth = 12 - i * 3; ctx.beginPath(); ctx.arc(PIN[0], PIN[1], 40 + 600 * easeOut(r), 0, TAU); ctx.stroke(); } }
    ctx.restore();
    ctx.fillStyle = `rgba(14,10,40,${.74 * dim})`; ctx.fillRect(-100, -100, W + 200, H + 200);
    notif(lt); nurseCard(lt, p, hit);
    // the cast arrives after the slam: one exhausted, one who read the rate, and the new one
    V2.setLight({ key: [-.4, -.8], keyColor: '#fff0cf', keyA: .26, rim: '#cfe0ff', rimA: .55, shadow: '#1a1236', shadowA: .5, bounceA: .1 });
    V2.opts.reflect = false;
    const fy = 1700, s0 = easeBack(seg(lt, hit + .25, hit + .7)), p0 = easeBack(seg(lt, hit + .45, hit + .9)), m0 = easeBack(seg(lt, hit + .65, hit + 1.1));
    if (s0 + p0 + m0 > .01) { ctx.fillStyle = V2.grad(0, fy - 30, 0, H, [[0, 'rgba(18,12,48,0)'], [.1, 'rgba(18,12,48,.92)'], [1, 'rgba(6,4,20,1)']]); ctx.fillRect(0, fy - 30, W, H - fy + 30); }
    if (s0 > 0) drawChar(straw({ x: 236, y: fy, s: 1.12 * s0, expr: 'dead', look: [.5, -.2], lid: .55, hold: { r: 'mug7' }, grip: { r: [78, 48] }, arms: { l: 'rest', r: 'hold' }, transit: lt < hit + 1.3 }));
    if (p0 > 0) drawChar(persimmon({ x: 540, y: fy, s: 1.3 * p0, expr: 'smug', look: [0, -.1], acc: ['sunglasses', 'perdiem', 'airpods'], hold: { r: 'icedcup' }, grip: { r: [86, 70] }, arms: { l: 'rest', r: 'hold' }, transit: lt < hit + 1.5 }));
    if (m0 > 0) drawChar(mango({ x: 868, y: fy, s: 1.12 * m0, expr: 'happy', look: [-.5, -.1], arms: { l: 'cheer', r: 'cheer' }, t: lt + 1, transit: lt < hit + 1.6 }));
    // the logo slams on the downbeat
    const k = seg(lt, hit, hit + .4);
    if (k > 0) {
      const sc = lerp(1.7, 1, easeOut(k)), a = clamp(k * 3);
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(540, 250); ctx.scale(sc, sc);
      text('SHIFT HAPPENS', 0, 0, { size: 96, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 16, stroke: '#150f22', spacing: 4, shadow: 20 }); ctx.restore();
      const k2 = seg(lt, hit + .08, hit + .5), e2 = easeOut(k2), sc2 = lerp(1.4, 1, e2);
      ctx.save(); ctx.globalAlpha *= clamp(k2 * 3); ctx.translate(540, 520); ctx.scale(sc2, sc2);
      text('THE AGENCY', 0, 0, { size: 150, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 20, stroke: '#150f22', spacing: 5, shadow: 26 }); ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp(k2 * 3); ctx.translate(540, 715 + 14 * (1 - e2)); ctx.scale(lerp(1.08, 1, e2), lerp(1.18, 1, e2));
      text('NURSE', 0, 0, { size: 270, font: 'Bangers', weight: 400, fill: '#ff9a3c', lw: 24, stroke: '#150f22', spacing: 8, shadow: 34 }); ctx.restore();
      V2.glow(540, 640, 800, '255,170,90', .3 * a, 'screen', .8);
      const chip = easeBack(seg(lt, hit + .35, hit + .75));
      if (chip > 0) { ctx.save(); ctx.translate(540, 384); ctx.scale(chip, chip); ctx.fillStyle = '#7b61ff'; rr(-150, -34, 300, 68, 34); ctx.fill(); ctx.strokeStyle = '#150f22'; ctx.lineWidth = 6; ctx.stroke(); text('EPISODE 9', 0, 3, { size: 40, fill: '#fff', spacing: 3 }); ctx.restore(); }
    }
  },
  fx: lt => { const hit = B('logo').s + 2.2; return { bloom: .5, vignette: .4, grain: .04, aberr: lt > hit && lt < hit + .5 ? 8 * (1 - (lt - hit) / .5) : 0, fade: lt < .3 ? 1 - lt / .3 : (lt > hit && lt < hit + .12 ? .6 * (1 - (lt - hit) / .12) : 0), fadeColor: lt > hit ? '255,240,225' : '255,255,255' }; },
  blur: lt => lt > B('logo').s + 2.1 && lt < B('logo').s + 2.7 ? 3 : (lt < B('logo').s + 2.2 ? 2 : 1),
  over() {},
};

// ============================================================================ orientation, 3:06 PM
// the cast at the station: a charge nurse, the staff nurse, the new one and the CNA, and a med cart on the floor between the first two
const OR = { lemon: [-360, 1350], straw: [-100, 1000], cart: [8, 985], pers: [120, 1000], mango: [385, 1350] };
// a med cart: a cabinet with drawers, a top with cups and a clipboard, four casters
function medCart(X, Z) {
  const S6 = window.S6, k = V2.at(X, Z).s;
  const fog = { color: '#b9c4d6', amt: .2, zFar: 1900 };
  S6.box3({ x0: X - 70, x1: X + 70, y0: 26, y1: 150, z0: Z, z1: Z + 90, color: '#5f7fa8', front: '#7794bd', side: '#476a92', top: '#8fb0d4', fog });
  for (let i = 0; i < 3; i++) S6.onZ(Z, X - 60, X + 60, 36 + i * 38, 62 + i * 38, '#8fb0d4', 'rgba(25,16,30,.6)', 2);
  for (let i = 0; i < 3; i++) S6.onZ(Z, X - 14, X + 14, 46 + i * 38, 52 + i * 38, '#e4e8ee', 'rgba(25,16,30,.5)', 1.4);
  S6.box3({ x0: X - 84, x1: X + 84, y0: 150, y1: 162, z0: Z - 10, z1: Z + 100, color: '#d8e0ea', top: '#f2f5f9', fog });
  for (const dx of [-52, -22, 8, 38]) S6.box3({ x0: X + dx, x1: X + dx + 18, y0: 162, y1: 182, z0: Z + 20, z1: Z + 40, color: '#fff7e0', top: '#fffdf4', fog });
  for (const dx of [-60, 60]) S6.box3({ x0: X + dx - 8, x1: X + dx + 8, y0: 0, y1: 26, z0: Z + 10, z1: Z + 26, color: '#2a2833', fog });
}

// the contract, full frame: typed rows, a highlighter on the four minutes, and the line nobody read, HELPING: NOT INCLUDED
function insContract(lt, o = {}) {
  A6.bokeh(lt, ['255,200,120', '255,150,90'], ['#1a1030', '#2d1848']);
  const cx = 540, cy = 820, k = easeOut(clamp(lt / .3));
  ctx.save(); ctx.translate(cx, cy + (1 - k) * 160); ctx.rotate(.02); ctx.scale(1.1, 1.1); ctx.globalAlpha *= clamp(lt * 5);
  reg('overlay', [cx - 385, cy - 540, cx + 385, cy + 540], { id: 'contract-insert', transit: k < 1 });
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14; ctx.fillStyle = '#fffef8'; ctx.strokeStyle = 'rgba(25,16,30,.9)'; ctx.lineWidth = 6; rr(-340, -480, 680, 960, 16); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
  text('AGENCY CONTRACT', 0, -420, { size: 64, font: 'Bangers', weight: 400, fill: '#2a2448', spacing: 4 });
  text('PERSIMMON, RN   PER DIEM', 0, -366, { size: 26, fill: '#6a6488', weight: 900, spacing: 3 });
  ctx.strokeStyle = '#2a2448'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-290, -334); ctx.lineTo(290, -334); ctx.stroke();
  const rows = [['ORIENTATION', '4 MINUTES', 1], ['MAX RESIDENTS', '12', 0], ['ADMISSIONS', 'NO', 0], ['WOUND CARE', 'NO', 0], ['BREAKS', 'AS NEEDED', 0], ['SHIFT ENDS', '11:00:00 PM', 0], ['HELPING', 'NOT INCLUDED', 2], ['RATE', '$118 / HR', 0]];
  rows.forEach(([lab, val, kind], i) => {
    const y = -276 + i * 82, p = seg(lt, .25 + i * .26, .5 + i * .26);
    text(lab, -290, y, { size: 30, fill: '#6a6488', weight: 900, align: 'left', spacing: 2 });
    ctx.strokeStyle = '#c5c9d6'; ctx.lineWidth = 2.4; ctx.setLineDash([3, 7]); ctx.beginPath(); ctx.moveTo(-60, y + 14); ctx.lineTo(290, y + 14); ctx.stroke(); ctx.setLineDash([]);
    if (p > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(-80, y - 40, 380 * p + 20, 80); ctx.clip();
      if (kind === 1) { const hk = seg(lt, o.hi ?? 99, (o.hi ?? 99) + .35); ctx.fillStyle = 'rgba(255,225,53,.75)'; ctx.fillRect(40, y - 30, 262 * hk, 54); }
      text(val, 290, y, { size: kind === 2 ? 44 : 46, font: 'Bangers', weight: 400, fill: kind === 2 ? '#d62a3a' : '#1f4fd8', align: 'right', spacing: 1 });
      ctx.restore();
    }
  });
  // the stamp that closes it
  const st = .25 + 8 * .26 + .1, sk = seg(lt, st, st + .16);
  if (sk > 0) { ctx.save(); ctx.translate(70, 402); ctx.rotate(-.09); ctx.scale(lerp(2, 1, easeOut(sk)), lerp(2, 1, easeOut(sk))); ctx.globalAlpha *= clamp(sk * 4); ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 9; rr(-170, -48, 340, 96, 14); ctx.stroke(); text('NO REFUNDS', 0, 6, { size: 66, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 3, maxW: 310 }); ctx.restore(); }
  ctx.restore();
}

// the computer on wheels, full frame: a login that types itself, spins, and refuses
function insLogin(lt) {
  A6.bokeh(lt, ['120,170,255', '160,120,255'], ['#0a1230', '#1a1850']);
  const cx = 540, cy = 800, k = easeOut(clamp(lt / .25));
  ctx.save(); ctx.translate(cx, cy + (1 - k) * 120); ctx.globalAlpha *= clamp(lt * 6);
  reg('overlay', [cx - 410, cy - 500, cx + 410, cy + 500], { id: 'login-insert', transit: k < 1 });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 16; ctx.fillStyle = '#23252e'; ctx.strokeStyle = '#0e0f14'; ctx.lineWidth = 6; rr(-400, -490, 800, 980, 30); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = V2.grad(0, -450, 0, 450, [[0, '#1c4a7a'], [1, '#2a78b8']]); rr(-366, -450, 732, 900, 12); ctx.fill();
  text('FRUIT BOWL HEALTH RECORDS', 0, -400, { size: 32, fill: '#e8f2ff', weight: 900, spacing: 3 });
  text('version 3.1 (2009)', 0, -362, { size: 22, fill: '#a9c6e6', weight: 700 });
  ctx.save(); rr(-366, -450, 732, 900, 12); ctx.clip(); ctx.fillStyle = '#12304f'; ctx.fillRect(-366, 392, 732, 58); ctx.fillStyle = '#2f9a5a'; rr(-356, 400, 130, 42, 8); ctx.fill(); text('FRUIT', -291, 422, { size: 24, fill: '#fff', weight: 900, spacing: 2 }); text('3:06 PM', 350, 422, { size: 22, fill: '#cfe0f5', weight: 900, align: 'right' }); ctx.restore();
  ctx.save(); ctx.translate(0, 60);
  ctx.fillStyle = '#f4f8ff'; rr(-300, -310, 600, 460, 16); ctx.fill();
  ctx.fillStyle = '#e8193a'; rr(-12, -290, 24, 70, 5); ctx.fill(); rr(-35, -267, 70, 24, 5); ctx.fill();   // a cross
  text('USER', -250, -166, { size: 26, fill: '#6a6488', weight: 900, align: 'left', spacing: 2 });
  text('PASSWORD', -250, -56, { size: 26, fill: '#6a6488', weight: 900, align: 'left', spacing: 2 });
  for (const y of [-130, -20]) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8fa7c9'; ctx.lineWidth = 3; rr(-250, y - 10, 500, 56, 8); ctx.fill(); ctx.stroke(); }
  const u = 'PERSIMMON', nu = Math.floor(9 * seg(lt, .1, .7)), np = Math.floor(8 * seg(lt, .75, 1.15));
  text(u.slice(0, nu) + (nu < 9 && lt < .75 && Math.sin(lt * 14) > 0 ? '|' : ''), -236, -102, { size: 36, fill: '#1f4fd8', weight: 900, align: 'left' });
  text('*'.repeat(np), -236, 12, { size: 44, fill: '#1f4fd8', weight: 900, align: 'left' });
  const click = seg(lt, 1.2, 1.3), press = lt >= 1.2 && lt < 1.32;
  ctx.fillStyle = press ? '#2a5a98' : '#3a78c8'; rr(-130, 70, 260, 62, 12); ctx.fill(); text('LOG IN', 0, 102, { size: 34, fill: '#fff', weight: 900, spacing: 2 });
  // spinner, then the refusal
  if (lt >= 1.3 && lt < 1.75) { ctx.strokeStyle = '#3a78c8'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 220, 36, lt * 12, lt * 12 + 4.2); ctx.stroke(); }
  ctx.restore();
  const ek = seg(lt, 1.75, 1.95);
  if (ek > 0) {
    const sh = (1 - ek) * 10 * Math.sin(lt * 60);
    ctx.save(); rr(-366, -450, 732, 900, 12); ctx.clip(); ctx.fillStyle = 'rgba(214,32,58,.18)'; ctx.fillRect(-366, -450, 732, 900); ctx.restore();   // the wash stays inside the glass
    ctx.save(); ctx.translate(sh, 0); ctx.scale(lerp(1.15, 1, easeOut(ek)), lerp(1.15, 1, easeOut(ek)));
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#7e0718'; ctx.lineWidth = 5; rr(-300, -60, 600, 260, 14); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#d6203a'; rr(-300, -60, 600, 70, 14); ctx.fill();
    text('ACCESS DENIED', 0, -24, { size: 50, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 });
    text('Temporary account expired.', 0, 50, { size: 34, fill: '#15121c', weight: 900 });
    text('Please contact IT.', 0, 96, { size: 34, fill: '#15121c', weight: 900 });
    text('IT hours: Tuesdays, 2 to 3 PM', 0, 160, { size: 26, fill: '#6a6488', weight: 700 });
    ctx.restore();
  }
  ctx.restore();
}

// a resident's card: a pale tile, a face and a room number. Asleep residents have closed eyes and a zzz; awake ones have wide eyes and a worried brow
const CARD_COLS = ['#ff8a94', '#ffd23f', '#c79be0', '#7bd47e', '#ffb347', '#8ac8ff', '#ff9fc4'];
function resCard(x, y, rot, i, asleep, sc = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.fillStyle = '#fffef8'; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 3.4; rr(-30, -42, 60, 84, 8); ctx.fill(); ctx.stroke();
  const col = CARD_COLS[i % CARD_COLS.length];
  ctx.fillStyle = col; ell(0, -10, 21, 21); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#15111a'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  if (asleep) { for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 8, -14, 5, .15 * PI, .85 * PI); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, -3, 4, .1 * PI, .9 * PI); ctx.stroke(); }
  else { ctx.fillStyle = '#15111a'; for (const s of [-1, 1]) { ell(s * 8, -14, 3.2, 3.8); ctx.fill(); ctx.beginPath(); ctx.moveTo(s * 13, -23); ctx.lineTo(s * 4, -20); ctx.stroke(); } ell(0, -1, 5, 4); ctx.fill(); }
  ctx.fillStyle = '#6a6488'; ctx.font = '900 13px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('RM ' + (1 + (i * 7) % 40), 0, 28);
  ctx.restore();
}
// a pile of n cards: neat and still (asleep) or a heap that sways (awake). base is the bottom centre
function pile(x, yb, n, asleep, lt, o = {}) {
  const dy = asleep ? 7 : 8.5;
  for (let i = 0; i < n; i++) {
    const jx = asleep ? (hash(i * 3 + 1) - .5) * 6 : (hash(i * 3 + 1) - .5) * 44, jr = asleep ? (hash(i * 5 + 2) - .5) * .08 : (hash(i * 5 + 2) - .5) * .8;
    const lean = asleep ? 0 : Math.sin(lt * 2.3) * (i / 28) * 14 * (o.sway ?? 1);
    resCard(x + jx + lean, yb - 42 - i * dy, jr + (asleep ? 0 : lean * .01), i + (o.seed || 0), asleep);
  }
}

// a deck of resident cards, fanned in Lemon's hand
Object.assign(PROP_BOX, { deck9: [-34, -92, 34, 8] });
EXT.prop.deck9 = (side, o, t) => { for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(0, -50 - i * 2.5); ctx.rotate((i - 3) * .05 + Math.sin(t * 7) * .01); resCard(0, 0, 0, i + 2, i % 2 === 0, .92); ctx.restore(); } };

SCENES.orient = {
  shot(lt) {
    const b = id => B(id);
    const order = [['wide', b('s1').s - .05], ['cuS', b('p1').s - .05], ['contract', b('p1').e + .2], ['cuS', b('p2').s - .05], ['badge', b('m1').s - .05], ['cuM', b('s3').s - .05], ['cuS', b('login').s - .02], ['screen', b('login').e + .1],
      ['two', b('s5').s - .05], ['cuS', b('p4').s - .05], ['cuP', b('s6').s - .05], ['cuS', b('deal').s - .02], ['cuL', b('l1').s - .05], ['deal', b('l3').s - .05], ['cuL', b('tag').s], ['deal', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  cast(lt) {
    const b = id => B(id), at = k => V2.at(...OR[k]), deal = lt >= b('deal').s - .02, sh0 = SCENES.orient.shot(lt), low = sh0 === 'two' || sh0 === 'deal';   // in the wider framings a hanging glove would sit under the captions, so a hand goes to the hip
    const lem = lemon(Object.assign(at('lemon'), { look: [.5, .1], expr: inB(lt, 'l1') || inB(lt, 'l2') ? 'neutral' : inB(lt, 'l3') ? 'smug' : 'neutral', hold: deal ? { l: 'deck9' } : lt < b('s1').s ? {} : { l: 'clipboard6' }, grip: { l: deal ? [-112, 62] : [-100, 30] }, clipText: 'ROSTER',
      arms: { l: lt < b('s1').s ? 'rest' : 'hold', r: lt >= b('l1').s && lt < b('l3').s ? 'point' : 'rest' } }));
    const sp = straw(Object.assign(at('straw'), { look: lt < b('p1').s ? [.7, .1] : [.55, 0], expr: inB(lt, 's1') ? 'neutral' : inB(lt, 's2') ? 'sour' : inB(lt, 's3') || inB(lt, 's4') ? 'dead' : inB(lt, 's5') ? 'angry' : inB(lt, 's6') ? 'dead' : inB(lt, 's7') ? 'shock' : 'dead',
      acc: ['steth', 'bandage'], hold: { r: 'mug7' }, grip: { r: [78, 48] }, arms: { l: low ? 'hips' : inB(lt, 's6') ? 'shrug' : 'rest', r: 'hold' }, lid: inB(lt, 's1') || inB(lt, 's5') ? undefined : .5 }));
    const pr = persimmon(Object.assign(at('pers'), { look: [-.5, 0], expr: inB(lt, 'p2') || inB(lt, 'p4') || inB(lt, 'p5') ? 'smug' : 'neutral',
      acc: ['sunglassesHead', 'perdiem', 'airpods'], hold: { r: 'icedcup' }, grip: low ? { r: [86, 70], l: [-128, 52] } : { r: [86, 70] }, hand: low ? { l: 'open' } : undefined, arms: { l: low ? 'hold' : 'rest', r: 'hold' }, lid: .35 }));
    const mg = mango(Object.assign(at('mango'), { look: [-.5, -.05], expr: inB(lt, 'm1') ? 'smug' : inB(lt, 'l1') || inB(lt, 'l2') ? 'shock' : 'neutral', arms: { l: 'rest', r: inB(lt, 'm1') ? 'point' : sh0 === 'wide' ? 'hold' : 'rest' }, grip: !inB(lt, 'm1') && sh0 === 'wide' ? { r: [128, 56] } : undefined, hand: !inB(lt, 'm1') && sh0 === 'wide' ? { r: 'open' } : undefined }));
    return { lemon: lem, straw: sp, pers: pr, mango: mg };
  },
  cam(lt) {
    const sh = SCENES.orient.shot(lt), c = SCENES.orient.cast(lt), b = id => B(id);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    if (sh === 'wide') { const k = seg(lt, 0, b('s1').s); zoomTo(540, lerp(1040, 1020, k), lerp(.93, .95, k)); }
    else if (sh === 'cuS') faceZoom({ kind: 'straw', x: c.straw.x, y: c.straw.y, s: c.straw.s }, 2.0 + (inB(lt, 's6') ? .12 * seg(lt, b('s6').s, b('s6').e) : 0), 80);
    else if (sh === 'cuP') faceZoom({ kind: 'persimmon', x: c.pers.x, y: c.pers.y, s: c.pers.s }, 2.0, 80);
    else if (sh === 'cuM') { faceZoom({ kind: 'mango', x: c.mango.x, y: c.mango.y, s: c.mango.s }, 2.0, 80); CAM.x += 30; }   // her pointing finger stays 60 px inside the right edge
    else if (sh === 'cuL') faceZoom({ kind: 'lemon', x: c.lemon.x, y: c.lemon.y, s: c.lemon.s }, 1.9, 80);
    else if (sh === 'two') zoomTo(lerp(585, 600, seg(lt, b('p3').s, b('s5').e)), 990, 1.3);
    else if (sh === 'badge') { const k = seg(lt, b('p2').s, b('p2').e), q = c.pers; zoomTo(q.x - 14 * q.s, q.y - 160 * q.s, lerp(1.8, 2.05, k)); }
    else if (sh === 'deal') zoomTo(565, 930, lerp(1.16, 1.22, seg(lt, b('l1').s, b('tag').e)));
  },
  draw(lt) {
    const sh = SCENES.orient.shot(lt), b = id => B(id);
    if (sh === 'contract') { insContract(lt - b('p1').s + .05, { hi: wordT('p1', 'four') - b('p1').s + .05 }); return; }
    if (sh === 'screen') { insLogin(lt - b('login').s); return; }
    const c = SCENES.orient.cast(lt);
    V2.setLight({ key: [-.35, -.8], keyColor: '#fff4dc', keyA: .24, rim: '#8fb8ff', rimA: .4, shadow: '#2a2038', shadowA: .3, amb: '#fff0d8', ambA: .06 });
    V2.opts.reflect = true;
    const focus = { cuS: ['straw'], cuP: ['pers'], badge: ['pers'], cuM: ['mango'], cuL: ['lemon'], two: ['straw', 'pers'], deal: ['straw', 'pers'] }[sh] || null;
    const blurPx = ['cuS', 'cuP', 'cuM', 'cuL', 'badge'].includes(sh) ? 9 : sh === 'deal' ? 5 : 0;
    const board = [
      { t: 'TODAY', x: .05, y: .14, size: .105, color: '#2a5ac8', rot: -.02, p: 1 },
      { t: 'RN: STRAWBERRY', x: .05, y: .29, size: .082, color: '#d62a3a', rot: -.01, p: 1 },
      { t: 'CNA: MANGO', x: .05, y: .44, size: .082, color: '#2a5ac8', rot: -.01, p: 1 },
      { t: 'AGENCY: PERSIMMON', x: .05, y: .59, size: .074, color: '#7b3fd0', rot: -.01, p: seg(lt, .2, 1.1), under: .55 },
    ];
    V2.dof(blurPx, () => { S7.stationBack({ noLabel: sh !== 'wide', night: false, t: lt + 7, hours: 8, min: 6, hr: 3, board, lamps: [] }); });
    S7.stationCounter({ night: false });
    medCart(...OR.cart);
    // in a close-up, whoever stands in front of the subject and would hide the face is left out of the frame
    const skip = { cuL: ['straw'], cuM: ['pers'] }[sh] || [];
    const bg = (o, who) => skip.includes(who) ? null : (focus && !focus.includes(who)) ? nbr(o) : drawChar(o);
    bg(c.lemon, 'lemon'); bg(c.mango, 'mango'); bg(c.straw, 'straw'); bg(c.pers, 'pers');
    V2.dust(60, 600, 1020, 1400, lt, { n: 26, alpha: .3 });
    // the residents, dealt from Lemon's deck: twelve to Persimmon's tidy stack, twenty-eight to Strawberry's heap, each hovering over the nurse who got it
    if (sh === 'deal') {
      const t12 = b('l1').s + .15, t28 = b('l2').s + .1, sc = 1.15;
      const from = [c.lemon.x - 112 * c.lemon.s, c.lemon.y - 250 * c.lemon.s - 50 * c.lemon.s + 62 * c.lemon.s];
      const baseS = c.straw.y - 424 * c.straw.s - 10, baseP = c.pers.y - 326 * c.pers.s - 10;
      const flights = (n, t0, dt, x0, base, asleep, seed) => {
        let landed = 0;
        for (let i = 0; i < n; i++) {
          const k = (lt - (t0 + i * dt)) / .42;
          if (k < 0) continue;
          const dy = (asleep ? 7 : 8.5) * sc, tx = x0 + (asleep ? 0 : (hash(i * 3 + 1) - .5) * 44), ty = base - 42 * sc - i * dy;
          if (k < 1) { const e = easeIO(k); resCard(lerp(from[0], tx, e), lerp(from[1], ty, e) - 140 * Math.sin(k * PI), lerp(.2, 0, e) + k * 3.2 * (1 - k), i + seed, asleep, lerp(.8, 1, e) * sc); }
          else landed++;
        }
        return landed;
      };
      const label = (n, x, y, color, tt) => { const k = easeBack(seg(lt, tt, tt + .38)); if (k > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); text(String(n), 0, 0, { size: 104, font: 'Bangers', weight: 400, fill: color, lw: 14, stroke: '#150f22', spacing: 2, shadow: 14 }); ctx.restore(); } };
      const nP = flights(12, t12, .11, c.pers.x, baseP, true, 0), nS = flights(28, t28, .075, c.straw.x, baseS, false, 3);
      const endP = t12 + 12 * .11 + .42, endS = t28 + 28 * .075 + .42;
      for (let i = 0; i < nP; i++) resCard(c.pers.x + (hash(i * 3 + 1) - .5) * 6, baseP - 42 * sc - i * 7 * sc, (hash(i * 5 + 2) - .5) * .08, i, true, sc);
      for (let i = 0; i < nS; i++) { const lean = Math.sin(lt * 2.3) * (i / 28) * 16; resCard(c.straw.x + (hash(i * 3 + 1) - .5) * 44 + lean, baseS - 42 * sc - i * 8.5 * sc, (hash(i * 5 + 2) - .5) * .8 + lean * .012, i + 3, false, sc); }
      if (nP === 12) label(12, c.pers.x, baseP - 42 * sc - 11 * 7 * sc - 112, '#7be0a0', endP);
      if (nS === 28) label(28, c.straw.x, baseS - 42 * sc - 27 * 8.5 * sc - 128, '#ff5a6e', endS);
    }
  },
  fx: lt => ({ bloom: .5, vignette: .4, grain: .045, contrast: .14, sat: .12, tint: [['#ffd9a0', .1, 'soft-light']], fade: Math.max(seg(lt, CUR.dur - .3, CUR.dur - .02), lt < .25 ? 1 - lt / .25 : 0), fadeColor: '255,240,215' }),
  blur: lt => 1,
  over() {},
};

// ============================================================================ end card
SCENES.end = {
  noChyron: true, noScrim: true,
  cam() {},
  draw(lt) {
    // the night after the walkout: a deep sky, a low skyline, a lamp-lit ground and five stars the app never gave the staff
    ctx.fillStyle = grad2(0, 0, 0, H, '#0e1038', '#3a2a6a'); ctx.fillRect(-100, -100, W + 200, H + 200);
    A7.stars(lt, 1100, { n: 110, a: .9 });
    const fy = 1540;
    ctx.fillStyle = '#1a1540'; for (let i = 0; i < 16; i++) { const bw = 70 + hash(i) * 70, bh = 120 + hash(i + 9) * 260; rr(i * 70 - 20, fy - bh, bw, bh + 4, 6); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,214,120,.8)'; for (let i = 0; i < 16; i++) for (let j = 0; j < 5; j++) if (hash(i * 7 + j) > .55) { const bw = 70 + hash(i) * 70, bh = 120 + hash(i + 9) * 260; if (j * 40 + 24 < bh - 10) { ctx.fillRect(i * 70 - 20 + 14 + (j % 2) * 24, fy - bh + 18 + j * 40, 12, 18); } }
    confetti(lt, .5);
    // the Moon, who said Do it, watching over the lot
    A7.moon(770, 1100, 1.05, { t: lt, suppress: true, char: { expr: 'happy', look: [-.4, .5] } });
    ctx.fillStyle = V2.grad(0, fy - 20, 0, H, [[0, 'rgba(26,18,70,0)'], [.08, 'rgba(30,22,84,.9)'], [1, 'rgba(8,6,24,1)']]); ctx.fillRect(0, fy - 20, W, H - fy + 20);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, fy + 6, 10, 560, [[0, 'rgba(255,200,140,.28)'], [1, 'rgba(255,200,140,0)']]); ctx.beginPath(); ctx.ellipse(540, fy + 6, 560, 70, 0, 0, TAU); ctx.fill(); ctx.restore();
    V2.setLight({ key: [-.4, -.8], keyColor: '#fff0d8', keyA: .26, rim: '#ffd9a0', rimA: .6, shadow: '#1a1236', shadowA: .45, amb: '#b0a0e0', ambA: .1 });
    V2.opts.reflect = true;
    const row = [['straw', { x: 180, s: .82, acc: ['steth', 'badge', 'bandage'], expr: 'dead', lashes: true, lid: .5 }], ['mango', { x: 360, s: .82, acc: ['badge7', 'gaitbelt7', 'keys7'], badgeText: 'CNA', expr: 'happy' }], ['lemon', { x: 540, s: .86, acc: ['readers', 'lanyard7'], expr: 'happy' }],
      ['persimmon', { x: 720, s: .8, acc: ['sunglasses', 'perdiem', 'airpods'], expr: 'smug' }], ['melon', { x: 880, s: .64, acc: ['suit', 'nametag9'], tag: 'ADMINISTRATOR', expr: 'happy' }]];
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
    text('THE AGENCY NURSE', 0, 450, { size: 112, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 18, stroke: '#150f22', spacing: 4, shadow: 24 });
    ctx.restore(); }
    const lines = [['For every nurse who covered the shift she left.', 40, '#ffffff', .8], ['It is a different budget.', 46, '#ffe135', 1.9], ['You are worth the other budget.', 44, '#ffd1e6', 3.0]];
    lines.forEach(([s2, size, c, at], i) => text(s2, 540, 584 + i * 76, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 9, maxW: 1000 }));
    // the five stars, filled one by one
    const sk = seg(lt, 3.6, 4.4);
    if (sk > 0) A9.starRow(540, 850, 50, sk * 5.2);
    const tk = easeBack(seg(lt, 4.6, 5.0));
    if (tk > 0) {
      ctx.save(); ctx.translate(540, 1710); ctx.scale(tk, tk);
      reg('overlay', [540 - 440 * tk, 1710 - 80 * tk, 540 + 440 * tk, 1710 + 80 * tk], { id: 'teaser' });
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(14,10,36,.92)'; rr(-440, -80, 880, 160, 80); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,214,150,.9)'; ctx.lineWidth = 4; rr(-440, -80, 880, 160, 80); ctx.stroke();
      ctx.font = '900 30px Nunito'; ctx.letterSpacing = '6px'; const w1 = ctx.measureText('NEXT TIME').width; ctx.letterSpacing = '0px';
      ctx.font = '400 56px Bangers'; ctx.letterSpacing = '2px'; const w2 = ctx.measureText("Two Weeks' Notice").width; ctx.letterSpacing = '0px';
      const cx0 = -(108 + 40 + Math.max(w1, w2)) / 2 + 54, tx0 = cx0 + 54 + 40;   // icon centre and the left edge of the words, centred as one group
      // an envelope with a red seal
      ctx.save(); ctx.translate(cx0, 0); ctx.rotate(-.06 + .04 * Math.sin(lt * 3));
      ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; rr(-48, -32, 96, 68, 8); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-48, -28); ctx.lineTo(0, 12); ctx.lineTo(48, -28); ctx.stroke();
      ctx.fillStyle = '#e8193a'; ell(0, 12, 13, 13); ctx.fill(); ctx.stroke();
      ctx.restore();
      text('NEXT TIME', tx0, -34, { size: 30, fill: '#ffd1e6', weight: 900, align: 'left', spacing: 6 });
      text("Two Weeks' Notice", tx0, 22, { size: 56, font: 'Bangers', weight: 400, fill: '#ffffff', align: 'left', lw: 10, stroke: '#150f22', spacing: 2 });
      ctx.restore();
    }
  },
  label: () => 'THANKS FOR WATCHING',
};

const ALL = Object.assign({}, window.__EP9_SCENES || {}, SCENES);
window.__EP9_ALL = ALL;
EPISODES[9] = { num: 9, v2: true, balanceCaps: true, title: 'Episode 9: The Agency Nurse', TL: window.TIMELINE_EP9, SCENES: ALL, layout: 'v2', audio: 'build/ep9/audio.m4a' };
})();
