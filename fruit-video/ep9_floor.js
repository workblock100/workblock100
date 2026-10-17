'use strict';
/* SHIFT HAPPENS, Episode 9: The Agency Nurse. Scene module: floor (5:32 PM, THE FLOOR).
 *
 * A split screen, new this episode. TOP panel: Strawberry's hall, the night corridor with 28 call-light domes, a med cart, a call-light board, paperwork piling up.
 * BOTTOM panel: Persimmon's "break", a spa in a recliner. The divider band carries the pay meters (rolling-digit odometers, registered as overlays).
 * Two time-lapses (7:45 PM, 9:30 PM) advance the clock pill, the meters and both panels. clock(lt) feeds the top-left pill.
 * Every position in a panel is a world coordinate (X right, Z forward) from V2.at(X, Z) under that panel's own camera (V2.setCam). Registers window.__EP9_SCENES.floor. */
(() => {
if (!window.TIMELINE_EP9) return;
const { runner, inB, zoomTo } = window.H6;
const A6 = window.A6, S6 = window.S6, A9 = window.A9;
const { straw, mango } = window.A7;

// ------------------------------------------------------------------ helpers (copies of the Episode 8 ones)
// scene-relative time of a spoken word, from the recorded line's word timings (falls back to a guess if the line is missing)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
// a route through keyed positions [t, X, Z, ease]: linear travel between keys, 'io' or 'out' to ease a leg
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const pk = (lt, list) => list.find(([e]) => lt < e)[1];   // the first entry whose end time is still ahead

// ------------------------------------------------------------------ layout: two panels and the divider band between them
// the stack runs from the foot of the place label (y 242) to the top of the two-line speaker chip (y about 1386): 20 px of air above, 14 px below
const TOP = [262, 740], BAND = [740, 872], BOT = [872, 1372];
const CAM_T = { f: 1400, cy: 360, hy: 419 }, CAM_B = { f: 1400, cy: 330, hy: 888 };
const PHASE = lt => lt < B('lapse1').e ? 0 : lt < B('lapse2').e ? 1 : 2;

// ------------------------------------------------------------------ the clock and the money
const MIN0 = 17 * 60 + 32, MIN1 = 19 * 60 + 45, MIN2 = 21 * 60 + 30;   // 5:32 PM, 7:45 PM, 9:30 PM
const HRS0 = 2.53, HRS1 = 4.75, HRS2 = 6.5;                             // hours since 3:00 PM at those clock times (the brief's totals)
const lapseK = (lt, id) => seg(lt, B(id).s + .05, B(id).e - .1);
const clockMin = lt => lt < B('lapse2').s ? lerp(MIN0, MIN1, easeIO(lapseK(lt, 'lapse1'))) : lerp(MIN1, MIN2, easeIO(lapseK(lt, 'lapse2')));
const fmtClock = m => { m = Math.floor(m + 1e-6); const h = Math.floor(m / 60) % 12 || 12, mm = m % 60; return `${h}:${String(mm).padStart(2, '0')} ${m >= 720 ? 'PM' : 'AM'}`; };
// hours with the lapse's own easing: the agency meter spins wild, the staff meter creeps (both land exactly on the clock's totals)
function hoursAt(lt, who) {
  const id = lt < B('lapse2').s ? 'lapse1' : 'lapse2', a = id === 'lapse1' ? HRS0 : HRS1, b = id === 'lapse1' ? HRS1 : HRS2, k = lapseK(lt, id);
  if (who === 'agency') return lerp(a, b, easeOut(k)) + (b - a) * .05 * Math.sin(k * PI * 7) * Math.sin(k * PI);
  return lerp(a, b, k * k * (3 - 2 * k) * .35 + k * .65);
}
const RATE = { agency: 118, staff: 34 };
// the displayed total in (fractional) cents: exact integers whenever the clock is not moving
const centsAt = (lt, who) => { const moving = (lt > B('lapse1').s && lt < B('lapse1').e) || (lt > B('lapse2').s && lt < B('lapse2').e); const h = hoursAt(lt, who); return moving ? h * RATE[who] * 100 : Math.round(h * RATE[who] * 100); };

// ------------------------------------------------------------------ the top panel's call lights
const DCOL = ['#6d8f88', '#9d6b74', '#a8744f', '#8e6f55'];
const DOORS = [];
for (let j = 0; j < 15; j++) for (const side of [1, -1]) { const z = (side > 0 ? 1300 : 1700) + 400 * j; if (z <= 7000) DOORS.push({ side, z, n: String(side > 0 ? 1 + 2 * j : 2 + 2 * j), color: DCOL[(j + (side > 0 ? 0 : 2)) % 4] }); }
DOORS.sort((a, b) => a.z - b.z); DOORS.length = 28;   // twenty-eight residents, twenty-eight doors
const LIT = [[0, 0], [.35, 2], [1.6, 6], [3.8, 9], [7, 12], [9.7, 15], [12, 17], [16, 19], [18.5, 21], [21.3, 22], [22.3, 28], [99, 28]];
const nLit = lt => { for (let i = 1; i < LIT.length; i++) if (lt < LIT[i][0]) return Math.floor(lerp(LIT[i - 1][1], LIT[i][1], seg(lt, LIT[i - 1][0], LIT[i][0])) + 1e-6); return 28; };
const ORD = DOORS.map((_, i) => [i + 9 * hash(i + 7), i]).sort((a, b) => a[0] - b[0]).map(q => q[1]);
const RANK = []; ORD.forEach((d, k) => { RANK[d] = k; });
const DKIND = ['call', 'bed', 'door', 'call', 'chair', 'door'];
const domeAt = (i, tt) => RANK[i] < nLit(tt) ? (() => { const kind = DKIND[(i + RANK[i]) % 6]; return [A6.ALARM[kind].rgb, .62 + .38 * Math.sin(tt * 14 + i * 1.9), kind]; })() : null;
// the call-light board: 28 lamps in four rows of seven, lit by the same schedule as the domes
function callBoard(x, y, tt, hot) {
  const w = 344, h = 214, n = nLit(tt);
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; ctx.fillStyle = '#20242c'; rr(0, 0, w, h, 16); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 4; rr(0, 0, w, h, 16); ctx.stroke();
  ctx.fillStyle = '#12151b'; rr(8, 8, w - 16, 40, 10); ctx.fill();
  text('NURSE CALL', 22, 29, { size: 21, fill: '#c9d2e6', align: 'left', spacing: 2 });
  ctx.fillStyle = n >= 28 ? '#ff3b55' : '#2b303a'; rr(w - 112, 14, 96, 28, 8); ctx.fill();
  text(n + ' / 28', w - 64, 29, { size: 21, fill: '#fff', spacing: 1 });
  for (let m = 0; m < 28; m++) {   // four rows of seven on a 38 px pitch: 9 px under the header strip, 9 px above the frame, rims 6 px apart
    const r = Math.floor(m / 7), c = m % 7, cx = 28 + c * 48.2, cy = 74 + r * 38, on = RANK[m] < n, kind = DKIND[(m + RANK[m]) % 6], rgb = A6.ALARM[kind].rgb, pulse = on ? .7 + .3 * Math.sin(tt * 12 + m * 1.7) : 0;
    ctx.fillStyle = '#0c0e12'; ell(cx, cy, 16, 16); ctx.fill();
    ctx.fillStyle = on ? `rgba(${rgb},${.55 + .45 * pulse})` : '#3a3f48'; ell(cx, cy, 12.7, 12.7); ctx.fill();
    if (on) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(cx - 4, cy - 4.5, 4, 3); ctx.fill(); V2.glow(cx, cy, 34, rgb, .5 * pulse, 'screen', .3); }
  }
  if (hot > 0) { ctx.strokeStyle = `rgba(255,59,85,${.5 + .5 * Math.sin(tt * 20)})`; ctx.lineWidth = 5; rr(-3, -3, w + 6, h + 6, 18); ctx.stroke(); }
  ctx.restore();
  return [x, y, x + w, y + h];
}

// ------------------------------------------------------------------ accessories and props made for this scene
Object.assign(PROP_BOX, { cukeslice9: Object.assign([-34, -34, 34, 34], { nearFace: true }), sipcup9: Object.assign([-60, -112, 44, 10], { nearFace: true }), granola9: Object.assign([-50, -28, 50, 28], { nearFace: true }) });
const cukeSlice = r => {   // a cucumber slice: rind, flesh, seeds, a glint
  ctx.fillStyle = '#4f8a2a'; ctx.strokeStyle = '#2f5a14'; ctx.lineWidth = 3; ell(0, 0, r, r * .96); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d7eeaa'; ell(0, 0, r * .84, r * .8); ctx.fill();
  ctx.fillStyle = '#e9f7cc'; ell(0, 0, r * .52, r * .5); ctx.fill();
  ctx.fillStyle = '#a8cf70'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ell(Math.cos(a) * r * .36, Math.sin(a) * r * .34, 2.6, 4.2, a + PI / 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, r * .86, PI * 1.05, PI * 1.45); ctx.stroke();
};
EXT.acc.cuke9 = (o, k, t, layer) => {   // one slice per eye, each switchable: o.cukes = [left, right]
  if (layer !== 'front') return;
  const on = o.cukes || [1, 1];
  [[0, -1], [1, 1]].forEach(([i, s]) => { if (!on[i]) return; ctx.save(); ctx.translate(s * k.eyeX, k.eyeY); ctx.rotate(s * .18); cukeSlice(k.er * 1.55); ctx.restore(); });
};
EXT.prop.cukeslice9 = () => { ctx.rotate(-.3); cukeSlice(29); };
EXT.prop.sipcup9 = (side, o, t) => { ctx.rotate(o.cupTilt || 0); EXT.prop.icedcup(side, o, t); };
EXT.prop.granola9 = (side, o, t) => {   // a granola bar in a torn wrapper: o.barLeft is how much of it is left (1 whole, 0 gone)
  const f = clamp(o.barLeft ?? 1); if (f <= .02) return;
  ctx.rotate(-.12); const L = 88 * f;
  ctx.fillStyle = '#d8b46a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-44, -17, L, 34, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a2a'; for (let i = 0; i < 9; i++) { const x = -38 + i * 9; if (x < -44 + L - 8) { ell(x, -6 + (i % 3) * 7, 3, 2.4, i); ctx.fill(); } }
  ctx.fillStyle = '#e8193a'; rr(-44, 6, Math.min(L, 40), 11, 4); ctx.fill();   // the wrapper stripe on what is left
  if (f < .99) { ctx.fillStyle = '#d8b46a'; ctx.beginPath(); for (let i = 0; i < 3; i++) ctx.arc(-44 + L, -9 + i * 9, 6, -PI / 2, PI / 2, true); ctx.fill(); }
};
EXT.acc.combadge9 = (o, k, t, layer) => {   // Strawberry's comm badge, pinned to the left of her chest: a silver disc with a pulsing orange dot and call rings
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .5, k.ry * .26);
  ctx.fillStyle = '#d7dde5'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(0, 0, 19, 19); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, -12, 0, 12, [[0, '#ffb45a'], [1, '#e8602a']]); ell(0, 0, 9.5, 9.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(-3, -4, 3, 2.2); ctx.fill();
  const ring = o.callRing || 0;
  if (ring > 0) for (let i = 0; i < 3; i++) { const q = ((t * 2.2 - i * .33) % 1 + 1) % 1; ctx.strokeStyle = `rgba(255,180,90,${.9 * (1 - q) * ring})`; ctx.lineWidth = 4 * (1 - q) + 1; ctx.beginPath(); ctx.arc(0, 0, 24 + q * 34, PI * .75, PI * 1.25 + PI); ctx.stroke(); }
  ctx.restore();
};
EXT.acc.robe9 = (o, k, t, layer) => {   // a white terry robe: the shawl collar runs wide of the face and closes only at the bottom edge, so it never touches the mouth
  if (layer !== 'mid') return;
  const rx = k.rx, ry = k.ry;
  ctx.save(); ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
  ctx.beginPath(); ctx.moveTo(-rx * 1.2, -ry * .22); ctx.lineTo(-rx * .9, -ry * .22); ctx.bezierCurveTo(-rx * .66, ry * .2, -rx * .5, ry * .55, -rx * .42, ry * .7); ctx.quadraticCurveTo(-rx * .2, ry * .98, 0, ry * 1.05);
  ctx.quadraticCurveTo(rx * .2, ry * .98, rx * .42, ry * .7); ctx.bezierCurveTo(rx * .5, ry * .55, rx * .66, ry * .2, rx * .9, -ry * .22); ctx.lineTo(rx * 1.2, -ry * .22); ctx.lineTo(rx * 1.2, ry * 1.2); ctx.lineTo(-rx * 1.2, ry * 1.2); ctx.closePath();
  ctx.fillStyle = V2.grad(0, -ry * .2, 0, ry, [[0, '#fbf6ee'], [1, '#e4dccd']]); ctx.fill();
  ctx.strokeStyle = 'rgba(130,110,90,.55)'; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.fillStyle = 'rgba(160,140,120,.25)'; for (let i = 0; i < 26; i++) { const x = (srand(i + 3) * 2 - 1) * rx, y = ry * .1 + srand(i + 40) * ry * .9; ell(x, y, 5, 3.4, srand(i)); ctx.fill(); }
  ctx.strokeStyle = '#ff8fb1'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-rx * 1.1, ry * .8); ctx.quadraticCurveTo(0, ry * 1.02, rx * 1.1, ry * .8); ctx.stroke();   // the belt, below the mouth
  ctx.restore();
};
EXT.acc.turban9 = (o, k, t, layer) => {   // a towel turban: a striped wrap that sits on the crown, well above the brows
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(0, -k.ry * 1.02);
  ctx.fillStyle = '#fbf6ee'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-k.rx * .82, 34); ctx.bezierCurveTo(-k.rx * .96, -22, -k.rx * .5, -70, 6, -76); ctx.bezierCurveTo(k.rx * .6, -72, k.rx * .98, -20, k.rx * .82, 34); ctx.quadraticCurveTo(0, 14, -k.rx * .82, 34); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = '#7fd3e0'; ctx.lineWidth = 9;
  for (const [a, b] of [[-26, 24], [-2, 28]]) { ctx.beginPath(); ctx.moveTo(-k.rx, a); ctx.quadraticCurveTo(0, b - 24, k.rx, a); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(130,110,90,.4)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-k.rx * .7 + i * 36, 30); ctx.quadraticCurveTo(-k.rx * .3 + i * 40, -30, 10 + i * 18, -74); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#fbf6ee'; ell(14, -66, 20, 13, .5); ctx.fill(); ctx.stroke();   // the tucked end
  ctx.restore();
};
EXT.acc.clay9 = (o, k, t, layer) => {   // a green clay face mask on the cheeks and nose, clear of the eyes and the mouth
  if (layer !== 'front') return;
  ctx.fillStyle = 'rgba(150,200,120,.92)'; ctx.strokeStyle = 'rgba(70,110,50,.8)'; ctx.lineWidth = 2.6;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * (k.eyeX + k.er * 1.55), k.mouthY - 6, 24, 17, s * .35, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, k.eyeY + 22, 11, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,110,50,.5)'; ctx.lineWidth = 1.8; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 64, k.mouthY - 12); ctx.lineTo(s * 74, k.mouthY - 2); ctx.lineTo(s * 66, k.mouthY + 4); ctx.stroke(); }
};

// ------------------------------------------------------------------ small drawn things
// a med cart or a linen cart standing on the floor at world X, Z (drawn to scale under the current camera)
function cart(X, Z, kind, o = {}) {
  const [x, y, k] = V2.proj(X, 0, Z), n = o.papers || 0, tt = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 4, 100, 15); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  if (kind === 'med') {
    ctx.fillStyle = '#2a6fdb'; rr(-80, -142, 160, 104, 10); ctx.fill(); ctx.stroke();
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { ctx.fillStyle = '#4f8ae6'; ctx.lineWidth = 2.6; rr(-70 + c * 72, -132 + r * 48, 66, 40, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#dfe7ef'; rr(-47 + c * 72, -114 + r * 48, 20, 6, 3); ctx.fill(); }
    ctx.lineWidth = 4; ctx.fillStyle = '#e9eef5'; rr(-88, -158, 176, 18, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-84, -128); ctx.lineTo(-112, -128); ctx.lineTo(-112, -100); ctx.stroke();   // the push handle, on the near end
  } else {
    ctx.fillStyle = '#9aa3b2'; rr(-82, -62, 164, 10, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e9e3d2'; ctx.beginPath(); ctx.moveTo(-76, -64); ctx.lineTo(-92, -152); ctx.quadraticCurveTo(0, -176, 92, -152); ctx.lineTo(76, -64); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b8fd9'; ell(-30, -118, 40, 22); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ell(30, -126, 40, 24); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(o.dir < 0 ? 80 : -80, -128); ctx.lineTo(o.dir < 0 ? 112 : -112, -128); ctx.lineTo(o.dir < 0 ? 112 : -112, -100); ctx.stroke();
  }
  ctx.fillStyle = '#222'; for (const dx of [-62, 62]) { ell(dx, -26, 14, 14); ctx.fill(); ell(dx, -26, 5, 5); ctx.fillStyle = '#9aa3b2'; ctx.fill(); ctx.fillStyle = '#222'; }
  ctx.restore();
  if (kind === 'med' && n > 0) papers(x, y - 158 * k, k, n, tt);
}
// the paperwork: a leaning stack of forms on the tray, growing, with loose sheets in the air
function papers(x, y, k, n, tt) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  for (let i = 0; i < n; i++) {
    const lean = Math.sin(i * 1.3) * 5 + i * i * .045 * Math.sin(tt * 3 + i), yy = -i * 7.5;
    ctx.save(); ctx.translate(lean, yy); ctx.rotate((hash(i + 5) - .5) * .09);
    ctx.fillStyle = ['#fffdf5', '#ffe9a8', '#dff0ff', '#ffd9e4'][i % 4]; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; rr(-50, -9, 100, 11, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-40, -5, 36 + (i % 3) * 10, 2.2);
    ctx.restore();
  }
  ctx.restore();
}
function sheet(x, y, a, s, col = '#fffdf5') {   // one loose sheet
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s * Math.abs(Math.cos(a * 2)) * .6 + .4 * s);
  ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; rr(-24, -18, 48, 36, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let i = 0; i < 3; i++) ctx.fillRect(-17, -10 + i * 9, 26 + (i % 2) * 8, 2);
  ctx.restore();
}
// a musical note
function note(x, y, s, a, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ell(0, 0, 8, 6, -.4); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(7, -30); ctx.quadraticCurveTo(18, -26, 17, -14); ctx.stroke(); ctx.restore();
}
function sparkle(x, y, r, a, col = '#fff6c0') {   // a four-point glint
  if (a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const an = i * PI / 4 - PI / 2, R = i % 2 ? r * .22 : r; ctx.lineTo(Math.cos(an) * R, Math.sin(an) * R); } ctx.closePath(); ctx.fill(); ctx.restore();
}

// a puff of dust where the sprinter stops dead
function puff(wx, wz, u) {
  if (u <= 0 || u >= 1) return;
  const [x, y, k] = V2.proj(wx, 0, wz);
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI + .1, px = x + Math.cos(a) * (50 + 130 * u) * k * (i % 2 ? -1 : 1) * .8, py = y - 14 * k - 40 * u * k * (1 + i % 3 * .5), r = (38 + 46 * u) * k * (.7 + hash(i) * .6);
    ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(230,226,240,${.55 * (1 - u)})`], [1, 'rgba(230,226,240,0)']]); ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the time-lapse effects, drawn behind the characters inside each panel
function lapseFx(lt, y0, y1) {
  for (const id of ['lapse1', 'lapse2']) {
    const b = B(id), p = seg(lt, b.s, b.e), env = Math.sin(clamp(p) * PI);
    if (p <= 0 || p >= 1) continue;
    // the light sweeps across the panel: a warm band chasing a cool one
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [off, col, a] of [[0, '255,214,140', .34], [-340, '120,160,255', .26]]) {
      const cx = lerp(-300, 1400, easeIO(p)) + off;
      ctx.fillStyle = V2.grad(cx - 300, 0, cx + 300, 0, [[0, `rgba(${col},0)`], [.5, `rgba(${col},${a * env})`], [1, `rgba(${col},0)`]]); ctx.fillRect(0, y0, W, y1 - y0);
    }
    ctx.restore();
    // clock hands pivoting on the divider: ghost copies trail the real ones
    ctx.save(); ctx.translate(540, (BAND[0] + BAND[1]) / 2); ctx.lineCap = 'round';
    for (let g = 5; g >= 0; g--) {
      const q = p - g * .012, ang = easeIO(clamp(q)) * TAU * 9, a2 = (g === 0 ? .46 : .1) * env;
      ctx.strokeStyle = `rgba(255,236,170,${a2})`; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ang) * 560, -Math.cos(ang) * 560); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a2})`; ctx.lineWidth = 32; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ang / 12) * 330, -Math.cos(ang / 12) * 330); ctx.stroke();
    }
    ctx.restore();
  }
}

// ------------------------------------------------------------------ TOP PANEL: Strawberry's hall
const SP = route([[0, -430, 1700], [3.3, 100, 1650, 'out'], [3.6, 100, 1650], [4.9, -150, 1700, 'io'], [5.3, -150, 1700], [6.5, 100, 1650, 'io'], [7.9, 100, 1650], [8.5, -180, 1720, 'io'], [9.1, 170, 1640, 'io'], [9.6, 100, 1650, 'io'], [16.3, 100, 1650], [17.8, -225, 1640, 'io']]);
// she sprints in from the left with the cart, paces the hall on the radio, stops dead at "Helping.", zips about in the first time-lapse, and slides to the left wall in the second
const spd = (f, t) => Math.hypot(f(t + .04)[0] - f(t - .04)[0], f(t + .04)[1] - f(t - .04)[1]) / .08;
const MP = route([[0, -620, 1720], [8.3, -620, 1720], [9.5, -350, 1720, 'out'], [14.9, -350, 1720], [16.5, -350, 2900, 'io']]);   // Mango zips in from the left during the first time-lapse, talks, then pushes her linen cart away down the hall
function strawState(lt, tt) {
  const b = id => B(id), ph = PHASE(lt), wreck = clamp(.2 + .4 * seg(tt, 0, b('lapse1').e) + .4 * seg(tt, b('lapse1').s, b('lapse2').e));
  const speak = ['s1', 's2', 's3', 's4', 's5'].some(id => inB(lt, id));
  const expr = pk(lt, [[b('s1').s, 'panic'], [b('p1').s, 'angry'], [b('s2').s, 'panic'], [b('p2').s, 'sour'], [b('lapse1').s, 'shock'], [b('m1').s, 'panic'], [b('s3').s, 'dead'], [b('p3').s, 'angry'], [b('lapse2').s, 'dead'], [b('s4').s, 'panic'], [b('p4').s, 'weak'], [b('s5').s, 'dead'], [b('p5').s, 'angry'], [1e9, 'dead']]);
  return { ph, wreck, speak, expr };
}
function topScene(lt, tt, kOpen) {
  const b = id => B(id), ph = PHASE(lt), n = nLit(tt);
  V2.setCam(CAM_T);
  V2.setLight({ key: [-.3, -.85], keyColor: '#cfd8ff', keyA: .16, rim: '#7f9cff', rimA: .5, shadow: '#0a0a1e', shadowA: .42, amb: '#aab4e8', ambA: .12 });
  V2.opts.reflect = true;
  const doors = DOORS.map((d, i) => Object.assign({}, d, { dome: domeAt(i, tt), open: 0 }));
  const lamp = [.58, .46, .36][ph] * (hash(Math.floor(tt * 12) + ph * 7) > (ph === 2 ? .1 : .03) ? 1 : .35);
  S6.corridor({ doors, fog: '#4a5278', fogAmt: .5, wall: '#cfc6b4', wain: '#46707a', lampOn: lamp, bright: .74 * (1 - .4 * clamp((n - 3) / 18)), signs: [], zFar: 7600 });
  doors.forEach((d, i) => {   // sound rings off the lit domes
    if (!d.dome || i % 2) return;
    const [x, y, k] = V2.proj(d.side * 330, 480, d.z);
    A6.ring(x, y, (((tt * 1.8 + hash(i)) % 1) + 1) % 1, d.dome[2], { r0: 14 * k, r1: 300 * k + 30, lw: 6, alpha: .6 });
  });
  for (const d of doors) if (d.dome) { const [x, y] = V2.proj(d.side * 330, 480, d.z); V2.addLight({ x, y, r: 800, color: d.dome[0], a: .6 * d.dome[1] * Math.min(1, 12 / Math.max(1, n)) }); }
  lapseFx(lt, TOP[0], TOP[1]);
}
function topCast(lt, tt) {
  const b = id => B(id), st = strawState(lt, tt), [sX, sZ] = SP(tt), s0 = V2.at(sX, sZ);
  const runningIn = tt < 3.4, v = spd(SP, tt), dash = v > 60, inLapse = (tt > b('lapse1').s && tt < b('lapse1').e) || (tt > b('lapse2').s && tt < b('lapse2').e), sprint = dash || inLapse;
  const frozen = lt >= b('end').s;
  // Strawberry
  const callRing = st.speak || inB(lt, 'open') ? 1 : 0;
  const bite = pk(lt, [[b('p4').s - .05, 1], [b('p4').s + .2, lerp(1, .55, seg(lt, b('p4').s - .05, b('p4').s + .2))], [b('p4').s + 1.1, .55], [b('p4').s + 1.35, lerp(.55, 0, seg(lt, b('p4').s + 1.1, b('p4').s + 1.35))], [1e9, 0]]);
  const eating = lt >= b('s4').s && lt < b('s5').s + .1;
  const bitePose = lt >= b('p4').s - .15 && lt < b('p4').s + 1.45 ? Math.max(Math.sin(seg(lt, b('p4').s - .15, b('p4').s + .15) * PI) * (lt < b('p4').s + .4 ? 1 : 0), Math.sin(seg(lt, b('p4').s + .95, b('p4').s + 1.3) * PI) * (lt > b('p4').s + .6 ? 1 : 0)) : 0;
  const wall = lt >= b('lapse2').e - .3;
  const base = { look: wall ? [.25, .05] : [.4, .1], expr: st.expr, lid: st.wreck > .5 ? .5 + .1 * st.wreck : undefined, acc: ['steth', 'bandage7', 'combadge9', 'sweat'], callRing, t: tt, sway: .06 + .17 * st.wreck, rot: (wall ? -.07 : 0) + .02 * st.wreck * Math.sin(tt * 2.2) };
  let sp;
  if (runningIn || sprint) {
    sp = runner(straw, SP, tt, Object.assign(base, { arms: { l: 'hold', r: 'hold' }, hand: { l: 'flat', r: 'grip' }, grip: { l: [-66, 30], r: [74, 52] }, squash: .03 }), 330);
    if (!runningIn) { sp.arms = { l: 'run', r: 'run' }; sp.grip = undefined; sp.hand = undefined; sp.expr = 'panic'; sp.transit = inLapse; }
  } else {
    const armsL = inB(lt, 's3') ? 'hips' : 'rest';
    sp = straw(Object.assign(s0, base, { arms: { l: armsL, r: 'rest' } }));
    if (inB(lt, 's2') || inB(lt, 's1')) { sp.arms.l = 'hold'; sp.grip = { l: [-66, 30] }; sp.hand = { l: 'flat' }; }
    if (eating) {   // the granola bar: held low while she talks, up to the mouth for each of the two bites
      const up = bitePose;
      sp.hold = { r: 'granola9' }; sp.barLeft = bite; sp.arms.r = 'hold'; sp.grip = Object.assign(sp.grip || {}, { r: [lerp(88, 40, up), lerp(40, 12, up)] });
    }
    if (lt >= 6.5 && lt < 6.9) sp.squash = .1 * Math.sin(seg(lt, 6.5, 6.9) * PI);   // the stop, dead: she squashes into the floor
  }
  sp.who = 'straw'; if (frozen) sp.t = tt;
  // Mango pushes a linen cart: she zips in from the left during the first time-lapse, talks, then pushes it away down the hall
  const [mX, mZ] = MP(tt), mVis = lt >= b('lapse1').s + .5 && lt < b('lapse2').s + .3, mDir = 1;
  const mMoving = Math.hypot(MP(tt + .05)[0] - MP(tt - .05)[0], MP(tt + .05)[1] - MP(tt - .05)[1]) > .5;
  const mExpr = inB(lt, 'm1') ? 'smug' : lt > b('m1').e && lt < b('p3').s ? 'happy' : 'neutral';
  const mArgs = { look: [.35, 0], expr: mExpr, t: tt, arms: { l: 'rest', r: 'hold' }, hand: { r: 'grip' }, grip: { r: [74, 66] }, who: 'mango', transit: mMoving && lt < b('lapse1').e };
  const mo = mVis ? (mMoving ? runner(mango, MP, tt, mArgs, 190) : mango(Object.assign(V2.at(mX, mZ), mArgs))) : null;
  return { sp, mo, mX, mZ, mDir, sX, sZ, runningIn };
}
function topDraw(lt, tt, kOpen) {
  const b = id => B(id), c = topCast(lt, tt), ph = PHASE(lt), wreck = strawState(lt, tt).wreck;
  // the call-light board, hung on the right wall's end of the frame
  const bx = 704, by = TOP[0] + 16;
  // carts: Strawberry's med cart rides ahead of her until she stops, then it stays where it stopped
  const medX = tt < 3.3 ? c.sX + 175 : SP(3.3)[0] + 175, medZ = tt < 3.3 ? c.sZ : SP(3.3)[1];
  const nPap = Math.round(2 + 12 * clamp(seg(tt, 0, 25) ** 1.2));
  const items = [
    ...(c.mo ? [{ z: c.mZ + 10, fn: () => { cart(c.mX + c.mDir * 175, c.mZ, 'linen', { dir: c.mDir }); drawChar(c.mo); } }] : []),
    { z: c.sZ, fn: () => { cart(medX, medZ, 'med', { papers: nPap, t: tt }); drawChar(c.sp); } },
  ].sort((a, b2) => b2.z - a.z);
  callBoard(bx, by, tt, lt >= b('s5').s && lt < b('p5').s ? 1 : 0);
  for (const it of items) it.fn();
  // loose sheets flying in the draft of the run
  const nFly = [4, 8, 13][ph];
  for (let i = 0; i < nFly; i++) {
    const u = ((tt * (.16 + .1 * hash(i)) + hash(i + 11)) % 1), x = lerp(60, 1020, hash(i + 21)) + 40 * Math.sin(tt * 2 + i), y = lerp(300, 560, u) + 20 * Math.sin(tt * 3 + i * 2);
    if (Math.abs(x - c.sp.x) < 140 || (c.mo && Math.abs(x - c.mo.x) < 140) || (x > bx - 30 && y < by + 230)) continue;
    sheet(x, y, tt * (1.5 + hash(i)) + i, .9);
  }
  puff(100, 1650, seg(lt, 6.5, 7.3));
  lunchChips(lt);
  return c;
}


// "Lunch at four. Break at five. Second lunch at six.": three chips pop in a row above the cast, one on each phrase
function lunchChips(lt) {
  const b = id => B(id), out = 1 - seg(lt, b('s3').e + .3, b('s3').e + .65);
  if (out <= 0) return;
  const rows = [['4:00', 'LUNCH', wordT('s3', 'four', b('s3').s + .4), '#ff9f1c', 'fork'], ['5:00', 'BREAK', wordT('s3', 'five', b('s3').s + 1.3), '#50a5ff', 'cup'], ['6:00', 'LUNCH 2', wordT('s3', 'six', b('s3').s + 2.5), '#ff9f1c', 'fork']];
  rows.forEach(([tm, lab, at, col, icon], i) => {
    const p = easeBack(seg(lt, at - .08, at + .2)); if (p <= .02) return;
    const x = 48 + i * 212, y = 322, w = 200, h = 56;   // 48 px in from the edge like the pills above, 12 px between chips, 32 px clear of the call board, 14 px under the HALL tag
    ctx.save(); ctx.globalAlpha *= clamp(p * 2) * out; ctx.translate(x + w / 2, y + h / 2); ctx.scale(p, p); ctx.translate(-w / 2, -h / 2);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5; ctx.fillStyle = 'rgba(12,10,26,.92)'; rr(0, 0, w, h, 29); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = col; ctx.lineWidth = 4; rr(0, 0, w, h, 29); ctx.stroke();
    ctx.save(); ctx.translate(34, h / 2); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    if (icon === 'fork') { ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-8, 14); ctx.moveTo(-14, -14); ctx.lineTo(-14, -3); ctx.moveTo(-2, -14); ctx.lineTo(-2, -3); ctx.moveTo(-14, -3); ctx.quadraticCurveTo(-8, 4, -2, -3); ctx.moveTo(10, -14); ctx.quadraticCurveTo(18, -4, 10, 4); ctx.lineTo(10, 14); ctx.stroke(); }
    else { ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-13, -8); ctx.lineTo(11, -8); ctx.lineTo(8, 12); ctx.lineTo(-10, 12); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(13, 2, 6, -1.4, 1.4); ctx.stroke(); ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(-6, -13); ctx.quadraticCurveTo(-2, -19, -6, -24); ctx.moveTo(4, -13); ctx.quadraticCurveTo(8, -19, 4, -24); ctx.stroke(); }
    ctx.restore();
    text(tm, 62, h / 2 - 10, { size: 30, font: 'Bangers', weight: 400, fill: '#fff', align: 'left', spacing: 1 });
    text(lab, 62, h / 2 + 15, { size: 18, fill: col, align: 'left', spacing: 2, weight: 900 });
    ctx.restore();
  });
}

// ------------------------------------------------------------------ BOTTOM PANEL: Persimmon's break
const ZB = 1700, HW = 640, CH = 520;
const PC = { x: 420, y: 1137 };   // Persimmon's body centre (screen) in the recliner
function spaRoom(lt, tt, ph) {
  V2.setCam(CAM_B);
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: '#cfc3e6', wain: '#8e74b8', floorA: '#dcbf98', floorB: '#bc9d74', ceil: '#e8e0f2', fog: '#a496c6', fogAmt: .25, tile: 130, bright: 1, rail: 96 });
  // the break room door with the DO NOT DISTURB hanger, then the twelve doors of her twelve residents
  S6.onZ(ZB, -604, -486, 0, 330, '#a8744f', 'rgba(25,16,30,.7)', 2.4); S6.onZ(ZB, -586, -504, 40, 150, '#96623e', 'rgba(25,16,30,.35)', 1.4); S6.onZ(ZB, -586, -504, 190, 300, '#96623e', 'rgba(25,16,30,.35)', 1.4);
  for (let j = 0; j < 12; j++) {
    const X = -400 + j * 82, z = ZB - 2;
    S6.onZ(z, X - 30, X + 30, 0, 232, ['#6d8f88', '#9d6b74', '#8e6f55', '#a8744f'][(j * 3) % 4], 'rgba(25,16,30,.65)', 2);
    S6.onZ(z, X - 22, X + 22, 24, 98, 'rgba(0,0,0,.14)'); S6.onZ(z, X - 22, X + 22, 124, 200, 'rgba(0,0,0,.14)');
    S6.onZ(z, X - 14, X + 14, 206, 224, '#f6eee0', 'rgba(25,16,30,.5)', 1.2);
    S6.onZ(z, X - 19, X + 19, 238, 256, '#4b4a58', 'rgba(25,16,30,.7)', 1.6);   // the call-light dome, dark: nobody is calling
    const [nx, ny] = V2.p2(X, 215, z), kk = S6.kz(z); text(String(j + 1), nx, ny + 1, { size: 12.5 * kk, fill: '#3a2a4a', weight: 900 });
  }
  // p4: twelve residents, all asleep: a zZz bubble pops over each of the twelve doors
  for (let j = 0; j < 12; j++) {
    const at = B('p4').s + .15 + j * .075, p = easeBack(seg(lt, at, at + .2)), out = 1; if (p <= .02) continue;
    const X = -400 + j * 82, [bx, by] = V2.p2(X, 292, ZB - 2), bob = 2 * Math.sin(tt * 2.4 + j * .8);
    ctx.save(); ctx.globalAlpha *= clamp(p * 2) * out; ctx.translate(bx, by - 12 + bob); ctx.scale(p, p);
    ctx.fillStyle = '#f4efff'; ctx.strokeStyle = '#4b3a78'; ctx.lineWidth = 3; rr(-26, -15, 52, 30, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 13); ctx.lineTo(0, 21); ctx.lineTo(6, 13); ctx.closePath(); ctx.fillStyle = '#f4efff'; ctx.fill(); ctx.stroke(); ctx.fillRect(-5, 11, 10, 4);
    text('zZz', 0, 1, { size: 24, fill: '#5a3f9a', weight: 900, spacing: 0 });
    ctx.restore();
  }
  // the hanger on the break door's knob
  { const hk = Math.sin(tt * 2.1) * .03, [hx, hy] = V2.p2(-492, 168, ZB - 8), kk = S6.kz(ZB); ctx.save(); ctx.translate(hx, hy); ctx.rotate(hk); ctx.scale(kk, kk);
    ctx.fillStyle = '#d9a441'; ell(0, 0, 8, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.fillStyle = '#e8193a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-50, 4, 100, 106, 10); ctx.fill(); ctx.stroke();   // wide enough for DISTURB with 8 px on each side
    ctx.fillStyle = '#fff'; ell(0, 24, 9, 9); ctx.fill(); ctx.fillStyle = '#e8193a'; ell(0, 24, 4.2, 4.2); ctx.fill();
    text('DO NOT', 0, 50, { size: 17, fill: '#fff', weight: 900, spacing: 1 }); text('DISTURB', 0, 72, { size: 16, fill: '#fff', weight: 900, spacing: 1 });
    ctx.fillStyle = '#fff'; ctx.font = '900 14px Nunito'; text('zzz', 0, 95, { size: 15, fill: '#ffd1e6', weight: 900 });
    ctx.restore(); }
  // a plant on the far right, and the soft light of the room
  const bph = [0, .5, 1][ph];
  V2.glow(220, PC.y - 115, 520, '200,160,255', .16 + .1 * bph, 'screen', .3);
  lapseFx(lt, BOT[0], BOT[1]);
}
const sipAmount = lt => seg(lt, 7.46, 7.78) * (1 - seg(lt, 8.1, 8.4));
function recliner(part, tt) {
  const x = PC.x, y = PC.y, u = 1;
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineWidth = 4.4; ctx.strokeStyle = INK;
  const body = '#2f8f9d', dark = '#226f7c', light = '#4db0bc';
  if (part === 'back') {
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 196, 200, 22); ctx.fill();
    ctx.fillStyle = dark; rr(-150, 170, 300, 30, 10); ctx.fill(); ctx.stroke();                                   // base
    ctx.fillStyle = body; rr(-168, -134, 336, 270, 56); ctx.fill(); ctx.stroke();                                  // tall back cushion, behind her head
    ctx.fillStyle = light; rr(-134, -112, 268, 226, 44); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-100, -86); ctx.quadraticCurveTo(0, -112, 100, -86); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 4.4;
    for (const s of [-1, 1]) { ctx.fillStyle = dark; rr(s * 160 - 26, -48, 52, 214, 24); ctx.fill(); ctx.stroke(); ctx.fillStyle = body; rr(s * 160 - 31, -66, 62, 44, 20); ctx.fill(); ctx.stroke(); }   // the arms
  } else {
    ctx.fillStyle = body; rr(-158, 100, 316, 56, 24); ctx.fill(); ctx.stroke();                                    // seat cushion, in front of her hips
    ctx.fillStyle = light; rr(-140, 108, 280, 18, 9); ctx.fill();
    // legs and shoes up on the footrest
    for (const s of [-1, 1]) {
      ctx.strokeStyle = LIMB; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 40, 118); ctx.lineTo(s * 50, 150); ctx.stroke();
      ctx.save(); ctx.translate(s * 56, 160); ctx.rotate(s * .06); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.fillStyle = '#2ec4b6'; ell(0, 7, 27, 8.5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ell(0, 0, 27, 14.5); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(-8, -5, 10, 3.6); ctx.fill(); ctx.restore();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4.4;
    ctx.fillStyle = dark; rr(-132, 176, 264, 46, 22); ctx.fill(); ctx.stroke();                                    // footrest
    ctx.fillStyle = body; rr(-124, 170, 248, 20, 10); ctx.fill();
  }
  ctx.restore();
  void u;
}
function persObj(lt, tt) {
  const b = id => B(id), ph = PHASE(lt), sip = sipAmount(lt), spkP = ['p1', 'p2', 'p3', 'p4', 'p5'].some(id => inB(lt, id));
  const lift = seg(lt, b('p5').s + .12, b('p5').s + .36), away = seg(lt, b('p5').s + .36, b('p5').s + .74), peek = lt >= b('p5').s + .3;
  const spa = ph >= 1 && lt >= b('lapse1').s + .8;   // robe, clay and turban arrive with the first time-lapse; the clay goes on first so the badge stays on top of it
  const acc = [...(spa ? ['clay9'] : []), 'perdiem', 'airpods'];
  if (spa) acc.push('robe9');
  acc.push('cuke9');
  if (spa) acc.push('turban9');
  const o = A9.persimmon({ who: 'persphone', id: 'persimmon', x: PC.x, y: PC.y + 90, s: 1, noLegs: true, noShadow: true, noReflect: true, acc, t: tt,
    expr: peek ? 'smug' : 'chill', look: [0, 0], lid: peek ? .06 : .3, cukes: peek ? [lt < b('p5').s + .36 ? 1 : 0, 1] : [1, 1],
    rot: -.035 + .012 * Math.sin(tt * 1.7) + (peek ? .05 * easeOut(away) : 0), sway: .02 });
  // her arms: right hand on the iced coffee (and up to her mouth for a sip), left hand on the arm of the chair or lifting a slice
  const rGrip = [lerp(176, 89, easeIO(sip)), lerp(-26, 90, easeIO(sip))];
  o.hold = {}; o.grip = {}; o.arms = { l: 'rest', r: 'rest' }; o.hand = {};
  if (sip > 0) { o.hold.r = 'sipcup9'; o.cupTilt = lerp(0, -1.0, easeIO(sip)); o.arms.r = 'hold'; o.grip.r = [lerp(205, 89, easeIO(sip)), lerp(30, 90, easeIO(sip))]; o.hand.r = 'grip'; }
  else { o.arms.r = 'hold'; o.grip.r = [165, -22]; o.hand.r = 'open'; }
  if (lt >= b('p5').s + .1) {
    const hx = lerp(lerp(-165, -62, easeIO(lift)), -176, easeIO(away)), hy = lerp(lerp(-22, -8, easeIO(lift)), -74, easeIO(away));
    o.arms.l = 'hold'; o.grip.l = [hx, hy]; o.hand.l = 'open';
    if (lt >= b('p5').s + .36) o.hold.l = 'cukeslice9';
  } else { o.arms.l = 'hold'; o.grip.l = [-165, -22]; o.hand.l = 'open'; }
  void spkP;
  return o;
}
function bottomDraw(lt, tt, kOpen) {
  const b = id => B(id), ph = PHASE(lt);
  spaRoom(lt, tt, ph);
  V2.setLight({ key: [.35, -.7], keyColor: '#ffd9a0', keyA: .3, rim: '#c9a0ff', rimA: .5, shadow: '#1a1030', shadowA: .36, amb: '#e8c8ff', ambA: .08, bounce: '#ffcf99', bounceA: .22 });
  V2.opts.reflect = false;
  const flick = .75 + .25 * Math.sin(tt * 17) * Math.sin(tt * 7.3) + .1 * (hash(Math.floor(tt * 11)) - .5);
  // the rug
  { const [rx, ry] = [PC.x + 40, PC.y + 176]; ctx.save(); ctx.fillStyle = '#b86a8a'; ctx.strokeStyle = 'rgba(25,16,30,.45)'; ctx.lineWidth = 3; ell(rx, ry, 330, 66); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8a6bf'; ell(rx, ry, 280, 52); ctx.fill(); ctx.restore(); }
  // the side table: candle, a speaker light, and the iced coffees
  const tx = 700, ty = PC.y + 36;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(tx, ty + 156, 100, 15); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fillStyle = '#7d5a3a'; rr(tx - 9, ty + 12, 18, 140, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a4a2e'; ell(tx, ty + 150, 62, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9a26a'; ell(tx, ty, 112, 22); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#dcbc84'; ell(tx, ty - 3, 100, 17); ctx.fill();
  ctx.restore();
  // coffees: the first sits at the edge nearest her hand (and leaves the table while she sips), the next two arrive with the time-lapses
  const cupAt = (x, y, k) => { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); EXT.prop.icedcup(1, {}, tt); ctx.restore(); };
  cupAt(PC.x + 205, ty - 2, sipAmount(lt) > 0 ? 0 : 1);
  cupAt(PC.x + 205 + 56, ty + 2, easeBack(seg(lt, b('lapse1').e - .5, b('lapse1').e - .1)));
  cupAt(PC.x + 205 + 112, ty - 1, easeBack(seg(lt, b('lapse2').e - .5, b('lapse2').e - .1)));
  // the candle, flickering
  { const cx = tx + 88, cy = ty - 4; ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.fillStyle = '#fdf1d8'; rr(-14, -44, 28, 44, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2c7d6'; rr(-14, -44, 28, 10, 5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, -52); ctx.stroke();
    const f = flick; ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(0, -72 - 7 * f); ctx.quadraticCurveTo(11, -58, 0, -50); ctx.quadraticCurveTo(-11, -58, 0, -72 - 7 * f); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.moveTo(0, -64 - 4 * f); ctx.quadraticCurveTo(5, -57, 0, -52); ctx.quadraticCurveTo(-5, -57, 0, -64 - 4 * f); ctx.fill(); ctx.restore();
    V2.glow(cx, cy - 56, 150 + 30 * f, '255,190,110', .5 * f, 'screen', .8); V2.addLight({ x: cx, y: cy - 56, r: 650, color: '255,190,110', a: .5 * f }); }
  // the speaker on the floor at the far right, with notes drifting up from it
  { const sx = 972, sy = PC.y + 148; ctx.save(); ctx.translate(sx, sy); ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 2, 50, 10); ctx.fill();
    ctx.fillStyle = '#3a3a48'; rr(-38, -132, 76, 128, 14); ctx.fill(); ctx.stroke();
    const beat = 1 + .06 * Math.max(0, Math.sin(tt * 9));
    for (const [cy2, r] of [[-96, 20], [-44, 26]]) { ctx.fillStyle = '#16161e'; ell(0, cy2, r * beat, r * beat); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a5a70'; ell(0, cy2, r * .38, r * .38); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 3; i++) { const u = ((tt * .5 + i / 3) % 1); note(sx - 20 + 28 * Math.sin(u * 5 + i) , sy - 140 - u * 120, .9, Math.sin(u * 4 + i) * .3, `rgba(255,235,170,${1 - u})`); } }
  // the pizza box on the floor, arrives with the first time-lapse
  { const pz = easeBack(seg(lt, b('lapse1').e - .45, b('lapse1').e - .05)); if (pz > 0) { ctx.save(); const [bx, by] = V2.p2(-300, 0, 1110); ctx.translate(bx, by); ctx.scale(pz, pz); ctx.translate(-bx, -by);
    S6.box3({ x0: -350, x1: -226, y1: 22, z0: 1050, z1: 1170, color: '#d9b27a', top: '#e6c38f', front: '#c79a60', side: '#b78a52' });
    const [tx0, ty0] = V2.p2(-288, 22, 1110); ctx.fillStyle = '#e8193a'; ctx.beginPath(); ctx.ellipse(tx0, ty0, 30, 10, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore(); } }
  // the chair behind her, then her, then the chair in front of her
  recliner('back', tt);
  const o = persObj(lt, tt);
  drawChar(o);
  recliner('front', tt);
  { const talking = ['p1', 'p2', 'p3', 'p4', 'p5'].some(id => inB(lt, id)), ring = talking ? 1 : 0;   // the badge call coming in on her earbuds
    if (ring) { const cx = PC.x + 152, cy = PC.y - 112; ctx.save();   /* beside her right ear bud, clear of the glove that lifts the slice on the left */ ctx.translate(cx, cy); ctx.scale(.85, .85);
      for (let i = 0; i < 3; i++) { const q = ((tt * 2 - i * .33) % 1 + 1) % 1; ctx.strokeStyle = `rgba(127,224,160,${.8 * (1 - q)})`; ctx.lineWidth = 4 * (1 - q) + 1; ctx.beginPath(); ctx.arc(0, 0, 24 + q * 30, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = '#2fbf71'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ell(0, 0, 24, 24); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate(-.75); ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 4, 11, PI * 1.12, PI * 1.88); ctx.stroke(); ctx.restore(); ctx.restore(); } }
  // steam of the "self-care": a faint mist rising from the candle side
  void ph;
  return o;
}

// ------------------------------------------------------------------ the pay meters (screen space, registered in absolute coordinates)
function wheelPos(cents) {   // odometer wheels: wheel 0 turns freely, every other wheel advances only while the one below it rolls from 9 to 0
  const pos = [cents];
  for (let i = 1; i < 5; i++) { const p = pos[i - 1]; pos.push(Math.floor(p / 10) + clamp((p % 10 + 10) % 10 - 9)); }
  return pos;
}
function wheel(cx, cy, w, h, pos, o) {
  ctx.save(); ctx.beginPath(); ctx.rect(cx - w / 2, cy - h / 2, w, h); ctx.clip();
  ctx.fillStyle = V2.grad(0, cy - h / 2, 0, cy + h / 2, [[0, '#07070d'], [.5, '#1a1a28'], [1, '#07070d']]); ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  const base = Math.floor(pos), f = pos - base, fast = o.fast || 0;
  for (let d = -1; d <= 2; d++) {
    const val = (((base + d) % 10) + 10) % 10, y = cy + (d - f) * h * .84;
    for (let g = fast > .5 ? 2 : 0; g >= 0; g--) { const gy = y + (g ? (g === 2 ? -1 : 1) * h * .26 * fast : 0); text(String(val), cx, gy + 2, { size: h * .94, font: 'Bangers', weight: 400, fill: o.fill, alpha: g ? .38 : 1, lw: g ? 0 : 5, stroke: '#0a0814', spacing: 1 }); }
  }
  ctx.fillStyle = V2.grad(0, cy - h / 2, 0, cy + h / 2, [[0, 'rgba(0,0,0,.6)'], [.3, 'rgba(0,0,0,0)'], [.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.6)']]); ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}
function meter(x0, y0, w, h, who, lt, id) {
  const agency = who === 'agency', moving = (lt > B('lapse1').s && lt < B('lapse1').e) || (lt > B('lapse2').s && lt < B('lapse2').e), isEnd = lt >= B('end').s;
  const cents = centsAt(lt, who), pos = wheelPos(cents), flash = isEnd && agency ? (Math.sin((lt - B('end').s) * 24) > -.1 ? 1 : .25) : 0;
  const spin = moving ? (agency ? 1 : .5) : 0, pk0 = seg(lt, .25, .7), pop = easeOut(pk0) * (1 + .03 * Math.sin(pk0 * PI));   // a 3% overshoot at most: the two boxes may not touch each other or the frame edge
  const gold = '#ffd23a', pink = '#ff7a9a', acc = agency ? gold : pink;
  const cx = x0 + w / 2, cy = y0 + h / 2, sc = pop;
  if (sc <= .02) return;
  reg('overlay', [cx - w / 2 * sc, cy - h / 2 * sc, cx + w / 2 * sc, cy + h / 2 * sc], { id: agency ? 'meter-agency' : 'meter-staff', transit: Math.abs(sc - 1) > .02 });
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  ctx.shadowColor = agency && (moving || isEnd) ? 'rgba(255,210,58,.7)' : 'rgba(0,0,0,.5)'; ctx.shadowBlur = agency && (moving || isEnd) ? 30 : 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = V2.grad(0, y0, 0, y0 + h, [[0, '#2a2142'], [1, '#120e22']]); rr(x0, y0, w, h, 24); ctx.fill(); ctx.shadowColor = 'transparent';
  if (flash > 0) { ctx.fillStyle = `rgba(255,214,58,${.55 * flash})`; rr(x0, y0, w, h, 24); ctx.fill(); }
  ctx.strokeStyle = acc; ctx.lineWidth = agency ? 5 : 4; rr(x0, y0, w, h, 24); ctx.stroke();
  // header: who, and the hourly rate (the band is 132 px tall, the box 92: 17 px of clear band above and below it)
  const hot = flash > .5;
  text(agency ? 'PERSIMMON' : 'STRAWBERRY', x0 + 22, y0 + 21, { size: 22, fill: hot ? '#1a1230' : agency ? '#ffe9a0' : '#ffd1e6', align: 'left', spacing: 2 });
  ctx.fillStyle = hot ? '#1a1230' : acc; rr(x0 + w - 148, y0 + 8, 130, 26, 13); ctx.fill();
  text(agency ? '$118/HR' : '$34/HR', x0 + w - 83, y0 + 22, { size: 20, fill: hot ? '#ffd23a' : '#1a1230', spacing: 1 });
  // the digits: $ + three dollar wheels, a point, two cent wheels
  const ww = 42, hh = 46, gx = 4, total = 22 + 3 * (ww + gx) + 16 + 2 * (ww + gx), sx = x0 + (w - total) / 2, cyd = y0 + 62;
  let x = sx;
  text('$', x + 10, cyd + 2, { size: 46, font: 'Bangers', weight: 400, fill: acc, lw: 5, stroke: '#0a0814' }); x += 22 + gx;
  const order = [4, 3, 2];
  for (const i of order) { wheel(x + ww / 2, cyd, ww, hh, pos[i], { fill: acc, fast: spin }); x += ww + gx; }
  ctx.fillStyle = acc; ell(x + 7, cyd + 17, 5, 5); ctx.fill(); x += 16;
  for (const i of [1, 0]) { wheel(x + ww / 2, cyd, ww, hh, pos[i], { fill: acc, fast: spin }); x += ww + gx; }
  if (agency) {   // glints only in the three clear spots: the gap in the header and the two margins beside the digits
    const zones = [[x0 + 196, y0 + 9, x0 + 330, y0 + 33], [x0 + 20, y0 + 42, x0 + 102, y0 + 84], [x0 + 392, y0 + 42, x0 + 474, y0 + 84]];
    for (let i = 0; i < 5; i++) {
      const u = ((lt * (moving ? 2.4 : .7) + i * .21) % 1), sd = i + Math.floor(lt * (moving ? 6 : 1.4)) * 3, z = zones[i % 3], r = i % 3 === 0 ? 8 : moving ? 13 : 9;
      sparkle(lerp(z[0] + r, z[2] - r, hash(sd)), lerp(z[1] + r, z[3] - r, hash(sd + 9)), r, Math.sin(u * PI) * (moving ? 1 : .8));
    }
  } else if (!moving) { text('creeping...', x0 + 275, y0 + 21, { size: 19, fill: 'rgba(255,209,230,.85)', weight: 800 }); }
  ctx.restore();
  return [x0, y0, x0 + w, y0 + h];
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: () => 'split',
  cam() { zoomTo(540, 960, 1); },
  clock(lt) { return fmtClock(clockMin(lt)); },
  draw(lt) {
    const b = id => B(id), tt = lt >= b('end').s ? b('end').s : lt, ph = PHASE(lt), kOpen = easeOut(seg(lt, .0, .5));
    // the whole frame behind the panels
    ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#0d0b1c'], [.5, '#1a1230'], [1, '#08060f']]); ctx.fillRect(-100, -100, W + 200, H + 200);
    V2.glow(540, 190, 700, ph === 2 ? '255,70,90' : '120,130,255', .18, 'screen', .2);
    // top panel
    const topH = (TOP[1] - TOP[0]) * kOpen, botH = (BOT[1] - BOT[0]) * kOpen;
    ctx.save(); ctx.beginPath(); ctx.rect(0, TOP[1] - topH, W, topH); ctx.clip();
    topScene(lt, tt, kOpen);
    const n0 = REG.items.length;
    const tc = topDraw(lt, tt, kOpen);
    panelCheck(n0, TOP, 'top', kOpen < 1);
    ctx.restore();
    // bottom panel (the camera, the lights and the depth of field are reset for it)
    ctx.save(); ctx.beginPath(); ctx.rect(0, BOT[0], W, botH); ctx.clip();
    const n1 = REG.items.length;
    const zf = 1;
    bottomDraw(lt, tt, kOpen);
    panelCheck(n1, BOT, 'bottom', kOpen < 1);
    ctx.restore();
    // the divider band and the seams
    ctx.fillStyle = V2.grad(0, BAND[0], 0, BAND[1], [[0, '#171229'], [.5, '#241a3f'], [1, '#171229']]); ctx.fillRect(0, BAND[0], W, BAND[1] - BAND[0]);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let x = -((tt * 60) % 60); x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, BAND[0]); ctx.lineTo(x + 24, BAND[0]); ctx.lineTo(x + 6, BAND[1]); ctx.lineTo(x - 18, BAND[1]); ctx.fill(); }
    for (const y of [BAND[0], BAND[1]]) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(0, y - 3, W, 6); }
    // the wipe's bright seam
    if (kOpen < 1) { ctx.fillStyle = `rgba(255,255,255,${.9 * (1 - kOpen)})`; ctx.fillRect(0, TOP[1] - topH - 4, W, 8); ctx.fillRect(0, BOT[0] + botH - 4, W, 8); }
    lapseFx(lt, BAND[0], BAND[1]);
    // panel tags, in the corners clear of every face
    const tag = (str, x, y, col, right) => { ctx.save(); ctx.font = '900 22px Nunito'; ctx.letterSpacing = '2px'; const w = ctx.measureText(str).width + 30; ctx.letterSpacing = '0px'; if (right) x = W - x - w; ctx.fillStyle = 'rgba(10,8,22,.78)'; rr(x, y, w, 36, 18); ctx.fill(); ctx.fillStyle = col; ell(x + 18, y + 18, 6, 6); ctx.fill(); text(str, x + 32, y + 19, { size: 20, fill: '#fff', align: 'left', spacing: 2 }); ctx.restore(); };
    if (kOpen > .9) { tag('HALL  STRAWBERRY', 48, TOP[0] + 12, '#ff3b55'); tag('BREAK  PERSIMMON', 48, BOT[1] - 48, '#7fe0a0', true); }   // 48 px in from the edge, the same as the pills above, 12 px inside each panel
  },
  fx: lt => {
    const ph = PHASE(lt), lap = Math.max(Math.sin(clamp(seg(lt, B('lapse1').s, B('lapse1').e)) * PI), Math.sin(clamp(seg(lt, B('lapse2').s, B('lapse2').e)) * PI));
    return { bloom: .55 + .25 * lap, vignette: .46, grain: .05, contrast: .15, sat: .1 + .1 * lap, aberr: lap > .2 ? 4 * lap : 0, tint: [['#3a54c8', .1 + .03 * ph, 'soft-light']], fade: Math.max(1 - seg(lt, 0, .28), seg(lt, CUR.dur - .3, CUR.dur - .02)), fadeColor: '0,0,10' };
  },
  blur: lt => (inB(lt, 'lapse1') || inB(lt, 'lapse2')) ? 4 : (lt < 3.5 ? 2 : 1),
  over(lt) {
    const b = id => B(id);
    const my = (BAND[0] + BAND[1]) / 2 - 46;   // 92 px tall, centred in the band
    meter(30, my, 492, 92, 'agency', lt, 'meter-agency');
    meter(558, my, 492, 92, 'staff', lt, 'meter-staff');
    sfxWord(lt, b('open').s + .1, 'DING!', 430, 314, { fill: '#ffffff', size: 88, rot: .06, hold: .32 });   // clear of the HALL tag, and gone before BWEEP! pops
    sfxWord(lt, b('open').s + .55, 'BWEEP!', 580, 314, { fill: A6.ALARM.bed.hex, size: 80, rot: -.05, hold: .38 });
    sfxWord(lt, b('end').s + .1, 'WAH WAH', 500, 304, { fill: '#cfe9ff', size: 78, rot: -.04, hold: .75 });
    sfxWord(lt, 6.5, 'SKRRT!', 410, 336, { fill: '#ffffff', size: 80, rot: -.05, hold: .55 });
    sfxWord(lt, 7.62, 'SLURP', 800, PC.y - 145, { fill: '#9be8ff', size: 84, rot: .08, hold: .6 });
    sfxWord(lt, b('lapse1').s + .15, 'TICK TICK', 500, 304, { fill: '#ffd23a', size: 80, rot: -.04, hold: .9 });
    sfxWord(lt, b('lapse2').s + .15, 'TICK TICK', 500, 304, { fill: '#ffd23a', size: 80, rot: -.04, hold: .8 });
  },
};

// the panel's own audit: the page audit only knows the frame, so every face, head, body and held prop drawn in a panel must stay inside that panel
function panelCheck(n0, P, name, transit) {
  if (!REG.on || transit) return;
  for (const it of REG.items.slice(n0)) {
    if (!['face', 'head', 'body', 'prop'].includes(it.type) || it.transit) continue;
    if (it.type === 'body' && it.box[3] > P[1] - 4 + 40) continue;
    if (it.box[1] < P[0] + 2 || it.box[3] > P[1] - 2 + (it.type === 'body' ? 40 : 0) || it.box[0] < 0 || it.box[2] > W) REG.errors.push(`${it.type}:${it.id || '?'} leaves the ${name} panel [${it.box.map(Math.round)}]`);
  }
}

window.__EP9_SCENES = window.__EP9_SCENES || {};
window.__EP9_SCENES.floor = SC;
})();
