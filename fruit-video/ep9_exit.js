'use strict';
/* SHIFT HAPPENS, Episode 9: The Agency Nurse. Scenes 'exit' (10:58 PM, the front door) and 'lot' (11:00 PM, the parking lot).
 *
 * exit: a night lobby (built here from S6.shell and box3 so the glass doors show the lot, the lamp posts and Persimmon's red convertible with its headlights on),
 *       a 2-second countdown on the wall clock, the walk-out through the sliding doors, five stars, and the dash after the keys.
 * lot:  a night parking lot, a convertible built from true 3D boxes (a small painter's-order renderer below), the peel-out, the Moon, and the SHIFTGO push notification.
 * Every world position is (X, Z) through V2.at(X, Z); camera, cuts and clock text are functions of lt only. */
(() => { if (!window.TIMELINE_EP9) return;
window.__EP9_SCENES = window.__EP9_SCENES || {};
const { person, runner, zoomTo, faceC, drawBg, inB } = window.H6;
const A7 = window.A7, A9 = window.A9, S6 = window.S6;
const { straw, mango } = A7;
const { onZ, kz, lit } = S6;
const persimmon = A9.persimmon, melon = A9.melon;
const { p2 } = V2;

// ------------------------------------------------------------------ helpers (copies of the Episode 8 set)
const wordT = (id, word) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return l.s - CUR.start + w[1]; };
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : b[3] === 'in' ? easeIn(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const nbr = o => V2.dof(6, () => drawBg(o));
const lampFlicker = (lt, t0, t1) => lt >= t0 && lt < t1 ? (hash(Math.floor(lt * 15) + 3) > .42 ? 1 : .08) : 1;
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const ez = (t, a, b) => easeIO(seg(t, a, b));
const eo = (t, a, b) => easeOut(seg(t, a, b));
// frame a face for a close-up with the face dx pixels right of the frame centre and `up` pixels above it
const camFace = (o, z, up = 80, dx = 0) => { const [fx, fy] = faceC(o); zoomTo(fx - dx / z, fy + up / z, z); };
// a glowing four-point glint
function glint(x, y, r, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.fillStyle = `rgba(255,250,220,${a})`;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .12, -r * .12, r, 0); ctx.quadraticCurveTo(r * .12, r * .12, 0, r); ctx.quadraticCurveTo(-r * .12, r * .12, -r, 0); ctx.quadraticCurveTo(-r * .12, -r * .12, 0, -r); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ props
Object.assign(PROP_BOX, { tote9: [-52, -22, 52, 134], alarm9: Object.assign([-32, -88, 32, 26], { nearFace: true }) });
// Persimmon's tote, handles in the hand, the facility key ring clipped to its outer side (o.toteRing === false once she has unclipped it)
EXT.prop.tote9 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .03 + Math.sin(t * 1.7) * .012);
  ctx.strokeStyle = '#1f6f67'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, 46); ctx.quadraticCurveTo(-14, -8, 0, 0); ctx.quadraticCurveTo(14, -8, 20, 46); ctx.stroke();
  ctx.fillStyle = '#2ec4b6'; ctx.strokeStyle = INK; ctx.lineWidth = 3.6; rr(-42, 42, 84, 84, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; rr(-26, 62, 52, 34, 5); ctx.fill(); ctx.lineWidth = 2.4; ctx.stroke();
  text('PER DIEM', 0, 74, { size: 9, fill: '#d62828', weight: 900 }); text('$118/HR', 0, 88, { size: 10, fill: INK, weight: 900 });
  if (o.toteRing !== false) { ctx.save(); ctx.translate(-side * 70, 44); ctx.scale(.64, .64); EXT.prop.keyring9(side, o, t); ctx.restore(); /* on the body side of the tote: clear of the label and of the frame edge */ }
  ctx.restore();
};
// her phone with the alarm going off: 10:59 until o.alarmOn, then a red 11:00 with ring waves
EXT.prop.alarm9 = (side, o, t) => {
  const on = o.alarmOn ?? 0;
  ctx.save(); ctx.rotate(side * -.08);
  ctx.fillStyle = '#15121c'; ctx.strokeStyle = '#3a3646'; ctx.lineWidth = 3; rr(-30, -86, 60, 112, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = on > .5 ? '#2a0a14' : '#0c1328'; rr(-25, -80, 50, 100, 6); ctx.fill();
  if (on > .5) { for (let i = 0; i < 2; i++) { const q = ((t * 2.2 + i * .5) % 1); ctx.strokeStyle = `rgba(255,90,110,${.8 * (1 - q)})`; ctx.lineWidth = 3; ell(0, -30, 10 + q * 36, 10 + q * 36); ctx.stroke(); } V2.glow(0, -30, 70, '255,70,100', .5, 'screen', .4); }
  text(on > .5 ? '11:00' : '10:59', 0, -34, { size: 19, font: 'Bangers', weight: 400, fill: on > .5 ? '#ff7a8c' : '#9fb4ff', spacing: 1 });
  ctx.restore();
};

// ------------------------------------------------------------------ a wall clock with a second hand (S0 = seconds past 22:58:00)
function dial(R, S0, o = {}) {
  const tot = 22 * 3600 + 58 * 60 + S0, hr = (tot / 3600) % 12, mn = (tot / 60) % 60;
  const sAng = o.tickAge != null ? (Math.floor(S0) - 1 + easeBack(clamp(o.tickAge / .18))) * 6 : S0 * 6;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = R * .12; ctx.shadowOffsetY = R * .05; ctx.fillStyle = '#242a38'; ell(0, 0, R * 1.1, R * 1.1); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fffdf6'; ell(0, 0, R, R); ctx.fill();
  ctx.strokeStyle = '#242a38'; ctx.lineCap = 'round';
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0, r0 = R * (big ? .78 : .88); ctx.lineWidth = R * (big ? .045 : .016); ctx.beginPath(); ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); ctx.lineTo(Math.sin(a) * R * .94, -Math.cos(a) * R * .94); ctx.stroke(); }
  if (o.nums) for (const n of [12, 3, 6, 9]) { const a = n / 12 * TAU; text(String(n), Math.sin(a) * R * .6, -Math.cos(a) * R * .6 + R * .02, { size: R * .2, font: 'Bangers', weight: 400, fill: '#242a38' }); }
  const hand = (ang, len, lw, col, tail = .12) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-Math.sin(ang) * len * tail, Math.cos(ang) * len * tail); ctx.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len); ctx.stroke(); };
  hand(hr / 12 * TAU, R * .5, R * .07, '#242a38'); hand(mn / 60 * TAU, R * .76, R * .05, '#242a38'); hand(sAng * PI / 180, R * .86, R * .022, '#e8193a', .22);
  ctx.fillStyle = '#e8193a'; ell(0, 0, R * .05, R * .05); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.beginPath(); ctx.ellipse(-R * .28, -R * .42, R * .5, R * .2, -.7, 0, TAU); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ a car in true 3D: boxes drawn far to near (a small painter's renderer, so it can yaw while it peels out)
// local frame: lx to the car's right, ly up, lz toward the nose; yaw 0 = nose along +Z, -PI/2 = nose along -X (the driver, on the left, is then the near side)
function car3d(wx, wz, yaw, o = {}) {
  const c = Math.cos(yaw), s = Math.sin(yaw), P = V2.P, col = o.color ?? '#d9263a', t = o.t ?? 0, k0 = o.k ?? 1;
  const LW = (lx, ly, lz) => [wx + lx * c + lz * s, ly, wz - lx * s + lz * c];
  const PJ = (lx, ly, lz) => { const w = LW(lx, ly, lz); return p2(w[0], w[1], w[2]); };
  const D = (lx, ly, lz) => { const w = LW(lx, ly, lz); return (w[0] - P.cx) ** 2 + (w[1] - P.cy) ** 2 + (w[2] - P.cz) ** 2; };
  const dx = P.cx - wx, dz = P.cz - wz, cam = [dx * c - dz * s, P.cy, dx * s + dz * c];
  const parts = [];
  const FACES = [[[-1, 0, 0], [0, 2, 6, 4]], [[1, 0, 0], [1, 3, 7, 5]], [[0, 1, 0], [2, 3, 7, 6]], [[0, 0, -1], [0, 1, 3, 2]], [[0, 0, 1], [4, 5, 7, 6]]];
  const box = (x0, x1, y0, y1, z0, z1, color, opt = {}) => parts.push({ d: D((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2) + (opt.bias ?? 0), draw: () => {
    const cs = []; for (let i = 0; i < 8; i++) cs.push([i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0]);
    for (const [n, vi] of FACES) {
      const fc = [0, 0, 0]; for (const i of vi) for (let a = 0; a < 3; a++) fc[a] += cs[i][a] / 4;
      if (n[0] * (cam[0] - fc[0]) + n[1] * (cam[1] - fc[1]) + n[2] * (cam[2] - fc[2]) <= 0) continue;
      const nw = [n[0] * c + n[2] * s, n[1], -n[0] * s + n[2] * c], br = .5 + .5 * clamp(nw[0] * -.4 + nw[1] * .8 + nw[2] * -.45 + .15);
      V2.poly(vi.map(i => PJ(...cs[i])), lit(opt.top && n[1] > 0 ? opt.top : color, (opt.dim ?? 1) * (.5 + .62 * br)), opt.edge ?? 'rgba(20,10,18,.72)', opt.lw ?? 2.2);
    }
  } });
  const decal = (face, a0, a1, b0, b1, fill, opt = {}) => parts.push({ d: opt.d ?? 1e12 * 0 + D(0, 90, 0) - 5, draw: () => {   // a flat quad on a car side (face 'L', 'R'), nose ('N') or tail ('T')
    const m = { L: [-1, 0, 0], R: [1, 0, 0], N: [0, 0, 1], T: [0, 0, -1] }[face], px = face === 'L' ? -115 : 115, vis = m[0] * (cam[0] - m[0] * 115) + m[2] * (cam[2] - m[2] * 260) > 0;
    if (!vis) return;
    const q = (face === 'L' || face === 'R') ? [[px, b0, a0], [px, b0, a1], [px, b1, a1], [px, b1, a0]] : [[a0, b0, face === 'N' ? 261 : -261], [a1, b0, face === 'N' ? 261 : -261], [a1, b1, face === 'N' ? 261 : -261], [a0, b1, face === 'N' ? 261 : -261]];
    V2.poly(q.map(v => PJ(...v)), fill, opt.stroke ?? null, opt.lw ?? 2);
  } });
  // contact shadow
  for (const [e, a] of [[170, .22], [140, .3], [122, .4]]) V2.poly([[-e, -e * 2.3], [e, -e * 2.3], [e, e * 2.3], [-e, e * 2.3]].map(([lx, lz]) => PJ(lx, 0, lz)), `rgba(3,2,10,${a})`);
  // chassis and body
  box(-115, 115, 40, 100, -260, 260, col, { top: lit(col, 1.1) });                    // lower tub
  box(-115, 115, 100, 130, 118, 262, col, { top: lit(col, 1.2) });                    // hood
  box(-115, 115, 100, 138, -262, -96, col, { top: lit(col, 1.2) });                   // trunk
  box(-120, 120, 48, 74, 258, 272, '#cfd6e0', { lw: 1.6 }); box(-120, 120, 48, 74, -274, -258, '#cfd6e0', { lw: 1.6 });   // bumpers
  box(-115, -99, 100, 152, -96, 118, col, { top: lit(col, 1.2) }); box(99, 115, 100, 152, -96, 118, col, { top: lit(col, 1.2) });   // door panels
  box(-103, 103, 100, 154, 96, 126, '#2a2d3a', { top: '#3a3f52' });                    // dashboard
  for (const sx of [-55, 55]) { box(sx - 38, sx + 38, 100, 128, -62, 14, '#e8dcc0', { top: '#f6efdc' }); box(sx - 38, sx + 38, 128, 214, -74, -56, '#e8dcc0'); box(sx - 17, sx + 17, 214, 242, -76, -62, '#e8dcc0'); }   // seats and headrests
  box(-103, 103, 100, 112, -96, 96, '#4a2a38', { edge: 'rgba(0,0,0,0)' });             // cockpit floor
  // wheels, the face toward the camera drawn last
  for (const [lx, lz] of [[-115, 168], [115, 168], [-115, -168], [115, -168]]) {
    const sg = lx < 0 ? -1 : 1, rad = 45, wid = 28, outerVisible = cam[0] * sg > 0;
    parts.push({ d: D(lx, rad, lz) + (outerVisible ? -60 : 60), draw: () => {
      const ring = (xx, r) => Array.from({ length: 20 }, (_, i) => { const a = i / 20 * TAU; return PJ(xx, rad + Math.sin(a) * r, lz + Math.cos(a) * r); });
      const xo = lx + sg * wid / 2, xi = lx - sg * wid / 2, ro = ring(xo, rad), ri = ring(xi, rad);
      V2.poly(ri, '#0e0d14', null);
      for (let i = 0; i < 20; i++) V2.poly([ri[i], ri[(i + 1) % 20], ro[(i + 1) % 20], ro[i]], i % 2 ? '#1c1b24' : '#15141b');
      const face = outerVisible ? ro : ri, xx = outerVisible ? xo : xi;
      V2.poly(face, '#191820', 'rgba(0,0,0,.8)', 2);
      V2.poly(ring(xx, rad * .62), '#aeb6c4', 'rgba(20,16,26,.8)', 2);
      V2.poly(ring(xx, rad * .22), '#e6ebf2', null);
      const spin = (o.wheelSpin ?? 0);
      for (let q = 0; q < 5; q++) { const a = spin + q / 5 * TAU; V2.poly([PJ(xx, rad, lz), PJ(xx, rad + Math.sin(a) * rad * .6, lz + Math.cos(a) * rad * .6)], null, '#6a7384', 3); }
    } });
  }
  // the driver (or nothing): inserted at the seat, behind the near door panel
  if (o.driver) parts.push({ d: D(-55, 190, -12) + 30, draw: () => { const w = LW(-55, 214, -12), q = V2.proj(w[0], w[1], w[2]); o.driver(q[0], q[1], q[2]); } });
  parts.sort((a, b) => b.d - a.d);
  // windshield glass goes behind the driver when seen from the front, so it is faint
  parts.forEach(p => p.draw());
  // windshield frame, steering wheel
  { const g = [PJ(-108, 154, 126), PJ(108, 154, 126), PJ(100, 214, 92), PJ(-100, 214, 92)];
    V2.poly(g, 'rgba(160,205,255,.13)', '#2a2e3a', 5); }
  { const wc = [-55, 160, 78]; ctx.strokeStyle = '#15141c'; ctx.lineWidth = 6 * k0; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i <= 18; i++) { const a = i / 18 * TAU, q = PJ(wc[0] + Math.cos(a) * 26, wc[1] + Math.sin(a) * 18, wc[2] + Math.sin(a) * 12); i ? ctx.lineTo(...q) : ctx.moveTo(...q); } ctx.stroke(); }
  // lights
  const on = o.lights ?? 0, brake = o.brake ?? 0;
  if (on > 0) for (const sx of [-78, 78]) { const [hx, hy] = PJ(sx, 100, 266); V2.glow(hx, hy, 130 * kz(Math.max(P.cz + 200, LW(sx, 100, 266)[2])), '255,240,190', .85 * on, 'screen', .9);
    if (cam[2] > 266) V2.poly([PJ(sx - 24, 86, 262), PJ(sx + 24, 86, 262), PJ(sx + 24, 114, 262), PJ(sx - 24, 114, 262)], '#fffbe0', '#3a3a44', 2); }
  for (const sx of [-80, 80]) { const [tx, ty] = PJ(sx, 100, -266), lw = LW(sx, 100, -266);
    if (cam[2] < -266) V2.poly([PJ(sx - 26, 86, -264), PJ(sx + 26, 86, -264), PJ(sx + 26, 116, -264), PJ(sx - 26, 116, -264)], brake > .3 ? '#ff4a52' : '#a4121c', '#2a0a10', 2);
    V2.glow(tx, ty, 90 * kz(Math.max(P.cz + 200, lw[2])), '255,40,50', (.18 + .8 * brake), 'screen', .7); }
  return { PJ, LW };
}
// light on the asphalt in front of a car: a wedge from the nose along its heading
function groundBeam(wx, wz, yaw, len, wid, a, color = '255,244,200') {
  if (a <= 0) return;
  const c = Math.cos(yaw), s = Math.sin(yaw), G = (lx, lz) => { const X = wx + lx * c + lz * s, Z = wz - lx * s + lz * c; return p2(X, 0, Z); };
  const q = [G(-70, 262), G(70, 262), G(wid, 262 + len), G(-wid, 262 + len)];
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(q[0][0], q[0][1], q[3][0], q[3][1], [[0, `rgba(${color},${.5 * a})`], [1, `rgba(${color},0)`]]);
  ctx.beginPath(); q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ phone screens (each draws into its own 0..w, 0..h space)
const PHW = 600, PHH = 1060;
const wrap = (str, n) => { const out = []; let line = ''; for (const w of str.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } out.push(line); return out; };
// the SHIFTGO push notification on a lock screen; pop = 0..1 how far it has expanded, press = the SIGN UP button pressed, done = after the tap (the welcome toast)
function uiNotif(w, h, o = {}) {
  const t = o.t ?? 0, ex = o.expand ?? 1;
  ctx.fillStyle = V2.grad(0, 0, w, h, [[0, '#1b1550'], [.6, '#3b1d6e'], [1, '#6a2a86']]); ctx.fillRect(0, 0, w, h);
  V2.glow(w * .75, h * .16, 260, '255,120,200', .25, 'screen', 0);
  text('Friday, October 16', w / 2, 92, { size: 30, fill: 'rgba(255,255,255,.75)', weight: 800 });
  text('11:01', w / 2, 196, { size: 150, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 });
  const top = 330 + (1 - ex) * 6, ch = lerp(244, 590, ex), slide = o.slide ?? 1;   // 244 px holds the header and all three lines of the message
  ctx.save(); ctx.translate(0, (1 - easeOut(slide)) * -380);
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; ctx.fillStyle = 'rgba(255,255,255,.96)'; rr(28, top, w - 56, ch, 38); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(28, top, w - 56, ch, 38); ctx.clip();   // nothing may hang below the card while it grows
  A9.appIcon(88, top + 62, 70);
  text('SHIFTGO', 138, top + 52, { size: 30, fill: '#2a1a5a', align: 'left', spacing: 2 }); text('now', w - 62, top + 52, { size: 24, fill: '#5f5878', align: 'right', weight: 800 });
  wrap('Fruit Bowl Rehab & Nursing is hiring per diem nurses on SHIFTGO', 25).forEach((ln, i) => text(ln, 62, top + 118 + i * 38, { size: 30, fill: '#1d1838', align: 'left', weight: 800 }));
  if (ex > .35) {
    const a = clamp((ex - .35) / .4);
    ctx.save(); ctx.globalAlpha *= a;
    text('$118/hr', w / 2, top + 296, { size: 150, font: 'Bangers', weight: 400, fill: '#6c4bff', lw: 0, spacing: 2 });
    text('PER DIEM, TONIGHT', w / 2, top + 372, { size: 27, fill: '#4f4870', spacing: 4 });
    const bp = 1 - (o.press ?? 0) * .08 + (o.pulse ?? 0) * .05;
    ctx.save(); ctx.translate(w / 2, top + 470); ctx.scale(bp, bp);
    ctx.fillStyle = V2.grad(-210, 0, 210, 0, [[0, '#6c4bff'], [1, '#ff4fa3']]); rr(-216, -52, 432, 104, 52); ctx.fill();
    if (o.press > .5) { ctx.fillStyle = 'rgba(255,255,255,.28)'; rr(-216, -52, 432, 104, 52); ctx.fill(); }
    text('SIGN UP', 0, 4, { size: 66, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 }); ctx.restore();
    ctx.restore();
  }
  ctx.restore();   // the card's clip
  ctx.restore();
  if (o.toast > 0) {   // WELCOME TO SHIFTGO
    const k = easeBack(clamp(o.toast)), ty = 150;
    ctx.save(); ctx.translate(w / 2, ty); ctx.scale(k, k); ctx.fillStyle = '#12c37a'; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8; rr(-262, -48, 524, 96, 48); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff'; ell(-210, 0, 26, 26); ctx.fill(); ctx.strokeStyle = '#12c37a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-222, 0); ctx.lineTo(-212, 11); ctx.lineTo(-196, -10); ctx.stroke();
    text('WELCOME TO SHIFTGO', 28, 3, { size: 40, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 }); ctx.restore();
  }
}
// "RATE YOUR NURSE": Persimmon with stars that fill (n of 5), Strawberry with a grey NOT ELIGIBLE badge
function uiRate(w, h, o = {}) {
  const n = o.stars ?? 0, t = o.t ?? 0;
  ctx.fillStyle = V2.grad(0, 0, 0, h, [[0, '#f4f2fb'], [1, '#e2def2']]); ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a1a5a'; ctx.fillRect(0, 0, w, 210);
  text('RATE YOUR NURSE', w / 2, 118, { size: 70, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 });
  text('Fruit Bowl Rehab & Nursing', w / 2, 176, { size: 26, fill: '#c9c0f0', weight: 800 });
  const card = (y, name, sub, drawAvatar) => { ctx.save(); ctx.shadowColor = 'rgba(40,20,90,.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = '#fff'; rr(26, y, w - 52, 344, 34); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#e8e4f6'; ell(116, y + 96, 70, 70); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.arc(116, y + 96, 70, 0, TAU); ctx.clip(); drawAvatar(116, y + 96); ctx.restore();
    text(name, 214, y + 80, { size: 46, font: 'Bangers', weight: 400, fill: '#2a1a5a', align: 'left', spacing: 2 }); text(sub, 214, y + 126, { size: 24, fill: '#7a7490', align: 'left', weight: 800 }); };
  card(250, 'PERSIMMON', 'Agency RN, per diem', (x, y) => { REG.suppress++; drawChar(persimmon({ x, y: y + 8, s: .4, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, expr: 'smug', acc: ['sunglasses'], who: null, id: 'rate-persimmon' })); REG.suppress--; });
  A9.starRow(w / 2, 250 + 240, 40, n, { empty: 'rgba(120,110,160,.3)' });
  if (o.thumbHint) text('tap a star', w / 2, 250 + 312, { size: 22, fill: '#7a7490', weight: 800 });
  card(610, 'STRAWBERRY', 'Staff RN, 3-11', (x, y) => { REG.suppress++; drawChar(straw({ x, y: y + 12, s: .36, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, expr: 'dead', who: null, id: 'rate-straw', lift: 0, acc: ['steth'] })); REG.suppress--; });
  A9.starRow(w / 2, 610 + 240, 40, 0, { empty: 'rgba(120,110,160,.3)' });
  ctx.save(); ctx.translate(w / 2, 610 + 314); ctx.fillStyle = '#8a86a2'; rr(-150, -20, 300, 40, 20); ctx.fill(); text('NOT ELIGIBLE', 0, 2, { size: 26, fill: '#fff', spacing: 3 }); ctx.restore();
  text('Submit', w / 2, 995, { size: 30, fill: '#9a94b4', weight: 800 });
}
// Persimmon's pay app during the countdown
function uiEarn(w, h, o = {}) {
  const sec = o.sec ?? 4, t = o.t ?? 0;
  ctx.fillStyle = V2.grad(0, 0, 0, h, [[0, '#0e1a2e'], [1, '#08111f']]); ctx.fillRect(0, 0, w, h);
  text('MY SHIFT', w / 2, 100, { size: 34, fill: '#7f93b8', spacing: 6 });
  text('TODAY', w / 2, 230, { size: 40, fill: '#9fb4d8', spacing: 8 });
  text(A9.money(944), w / 2, 350, { size: 150, font: 'Bangers', weight: 400, fill: '#4cf0a0', spacing: 2 });
  text('8.0 hrs  x  $118/hr', w / 2, 440, { size: 36, fill: '#c9d6ee', weight: 800 });
  ctx.fillStyle = '#16233c'; rr(50, 520, w - 100, 8, 4); ctx.fill(); ctx.fillStyle = '#4cf0a0'; rr(50, 520, (w - 100) * (1 - sec / 60), 8, 4); ctx.fill();
  text('CONTRACT ENDS', w / 2, 610, { size: 28, fill: '#7f93b8', spacing: 6 });
  text('11:00:00 PM', w / 2, 700, { size: 82, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 });
  text('00:00:0' + sec, w / 2, 830, { size: 120, font: 'Bangers', weight: 400, fill: sec <= 2 ? '#ff6a7a' : '#ffd23a', spacing: 4 });
  ctx.fillStyle = '#1e5a44'; rr(90, 920, w - 180, 90, 45); ctx.fill(); text('CLOCK OUT', w / 2, 966, { size: 48, font: 'Bangers', weight: 400, fill: '#bfffe0', spacing: 4 });
}
function uiAlarm(w, h, o = {}) {
  const t = o.t ?? 0, on = o.on ?? 0;
  ctx.fillStyle = on > .5 ? V2.grad(0, 0, 0, h, [[0, '#3a0a1a'], [1, '#14040c']]) : V2.grad(0, 0, 0, h, [[0, '#101a34'], [1, '#080e1e']]); ctx.fillRect(0, 0, w, h);
  if (on > .5) { for (let i = 0; i < 4; i++) { const q = ((t * 1.6 + i * .25) % 1); ctx.strokeStyle = `rgba(255,90,110,${.7 * (1 - q)})`; ctx.lineWidth = 10; ell(w / 2, 480, 120 + q * 360, 120 + q * 360); ctx.stroke(); } V2.glow(w / 2, 480, 420, '255,60,90', .5, 'screen', .3); }
  text('ALARM', w / 2, 120, { size: 40, fill: on > .5 ? '#ff9aa8' : '#7f93b8', spacing: 10 });
  const bell = on > .5 ? Math.sin(t * 50) * .25 : 0;
  ctx.save(); ctx.translate(w / 2, 270); ctx.rotate(bell); ctx.fillStyle = on > .5 ? '#ffd23a' : '#4a5a82'; ctx.beginPath(); ctx.moveTo(-70, 40); ctx.quadraticCurveTo(-70, -70, 0, -80); ctx.quadraticCurveTo(70, -70, 70, 40); ctx.lineTo(90, 62); ctx.lineTo(-90, 62); ctx.closePath(); ctx.fill(); ell(0, 80, 20, 14); ctx.fill(); ctx.restore();
  text(on > .5 ? '11:00' : '10:59', w / 2, 560, { size: on > .5 ? 250 : 220, font: 'Bangers', weight: 400, fill: on > .5 ? '#fff' : '#9fb4ff', spacing: 6 });
  text('PM', w / 2, 690, { size: 54, fill: on > .5 ? '#ff9aa8' : '#7f93b8', spacing: 6 });
  text('SHIFT OVER', w / 2, 800, { size: 80, font: 'Bangers', weight: 400, fill: on > .5 ? '#ff6a7a' : 'rgba(0,0,0,0)', spacing: 5 });
  ctx.fillStyle = on > .5 ? '#ff4a62' : '#2a3a62'; rr(120, 900, w - 240, 90, 45); ctx.fill(); text('DISMISS', w / 2, 946, { size: 48, font: 'Bangers', weight: 400, fill: '#fff', spacing: 4 });
}
// a big white glove (the Episode 6 hand, scaled) whose fingertip lands on (tx, ty); the arm trails off the far side
function glove(tx, ty, ang, sc, o = {}) {
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-44, 5);
  ctx.fillStyle = LIMB; ctx.beginPath(); ctx.roundRect(-230, -9, 232, 18, 8); ctx.fill();
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand(o.kind ?? 'point', 1, {});
  ctx.restore();
}
// the phone as the whole picture: a blurred world behind, the phone in front, optional shake
function phoneShot(drawBack, fn, o = {}) {
  V2.dof(o.blur ?? 14, drawBack);
  ctx.save(); ctx.fillStyle = 'rgba(4,3,14,.35)'; ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
  A9.phoneFrame(540 + (o.dx ?? 0), 815 + (o.dy ?? 0), PHW, PHH, fn, { rot: o.rot ?? 0, scale: o.scale ?? 1 });
}

// ============================================================================ the front door, 10:58 PM
const SC_EXIT = {};
const XC = { straw: [235, 1010], mango: [-225, 1010], admin: [-190, 1600], pers: [0, 1400] };
// story time: seconds past 22:58:00. It runs fast to the countdown, then ticks a second per beat of the countdown, then in step with the video.
const storySec = lt => {
  const cd = B('cd').s;
  if (lt < cd) return lerp(8, 116, lt / cd);
  const x = lt - cd;
  return x < 1.9 ? 116 + Math.min(3, Math.floor(x / .5)) : 120 + (x - 1.9);
};
const tickAge = lt => { const x = lt - B('cd').s; return x >= 0 && x < 1.9 ? x % .5 : null; };
const fmtClock = S0 => { const tot = 22 * 3600 + 58 * 60 + Math.floor(S0), m = Math.floor(tot / 60) % 60, h = Math.floor(tot / 3600); return `${h === 22 ? 10 : h === 23 ? 11 : h}:${String(m).padStart(2, '0')} PM`; };

// the lot through the glass: night sky, the far building, lamp posts, the convertible waiting with its headlights on
function exterior(o) {
  const t = o.t ?? 0, hy = V2.P.hy;
  ctx.fillStyle = V2.grad(0, 520, 0, hy + 60, [[0, '#04061c'], [.55, '#121f52'], [1, '#2a3d84']]); ctx.fillRect(-100, 500, W + 200, hy - 440);
  A7.stars(t, 840, { n: 90, seed: 11, a: .9 });
  onZ(3800, -1700, 1700, 0, 480, '#161a38');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 16; c++) if (hash(r * 16 + c + 7) > .42) { const x0 = -1500 + c * 190; onZ(3800, x0, x0 + 80, 90 + r * 130, 160 + r * 130, 'rgba(255,214,130,.85)'); }
  const yh = p2(0, 0, 3800)[1];
  ctx.fillStyle = V2.grad(0, yh, 0, 1250, [[0, '#262c58'], [1, '#12152e']]); ctx.fillRect(-100, yh, W + 200, 1250 - yh);
  ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineCap = 'butt';
  for (const x of [-900, -450, 0, 450, 900]) { const a = p2(x, 0, 1800), b = p2(x, 0, 3700); ctx.lineWidth = Math.max(1.5, 8 * kz(2000)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  S6.lampPost(-250, 1950, { on: .6 }); S6.lampPost(380, 2850, { on: .6 });
  const cp = SC_EXIT.carPose;
  groundBeam(cp[0], cp[1], cp[2], 520, 210, 1);
  car3d(cp[0], cp[1], cp[2], { color: '#d9263a', lights: 1, t, k: .6 });
}

// the lobby at night: copied from S6.lobby (shell, glass entrance, reception, plants) and re-lit: dark blue, ceiling lamps on, the lot outside
function lobbyNight(o = {}) {
  const zb = 1750, hw = 640, ch = 720, P = V2.P, open = o.doorOpen ?? 0, t = o.t ?? 0, S0 = o.S0 ?? 0, k = kz(zb), dx0 = -300, dx1 = 300, dy1 = 520;
  S6.shell({ zb, hw, ch, wall: '#cdbfae', wain: '#3a4f63', floorA: '#a39a88', floorB: '#6a6c7c', fog: '#2c3658', fogAmt: .34, tile: 160, rail: 120, ceil: '#d8d6de' });
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = V2.radial(540, 1000, 240, 1350, [[0, 'rgba(255,248,240,1)'], [.55, 'rgba(176,188,226,1)'], [1, 'rgba(92,106,160,1)']]); ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
  // the glass entrance
  onZ(zb, dx0 - 26, dx1 + 26, 0, dy1 + 26, '#222a38', 'rgba(10,8,20,.75)', 2.6);
  { const f = [p2(dx0, 0, zb), p2(dx1, 0, zb), p2(dx1, dy1, zb), p2(dx0, dy1, zb)];
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); exterior(o); ctx.restore(); }
  const sh = open * 146;
  for (const [a, b] of [[-300, -150], [150, 300]]) onZ(zb, a, b, 0, dy1, 'rgba(190,215,240,.10)', '#222a38', 4);
  for (const [a, b, s] of [[-150 - sh, -sh, 1], [sh, 150 + sh, -1]]) {
    onZ(zb, a, b, 0, dy1, 'rgba(190,215,240,.13)', '#222a38', 5); onZ(zb, a, b, 250, 262, 'rgba(255,255,255,.3)');
    const e = s > 0 ? b : a; onZ(zb, e - 12 - (s > 0 ? 0 : -24) + (s > 0 ? 0 : 0), e - 4 + (s > 0 ? 0 : -24 + 8) + 0, 190, 330, '#c9ced6', '#222a38', 1.5);
  }
  onZ(zb, dx0 - 26, dx1 + 26, dy1 + 26, dy1 + 100, '#1d2330', 'rgba(255,226,170,.5)', 2); onZ(zb, -40, 40, dy1 + 6, dy1 + 22, '#0e1018');
  { const [sx, sy] = p2(0, dy1 + 63, zb); ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffe9b0'; ctx.font = `900 ${30 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '3px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.restore(); ctx.letterSpacing = '0px'; }
  // a welcome banner for the agency nurse, with balloons
  onZ(zb, -620, -340, 432, 522, '#ffd23a', 'rgba(25,16,30,.7)', 3);
  { const [bx, by] = p2(-480, 477, zb); text('WELCOME', bx, by - 14 * k * 1.3, { size: 30 * k * 1.25, font: 'Bangers', weight: 400, fill: '#c1121f', spacing: 2 }); text('PERSIMMON!', bx, by + 15 * k * 1.3, { size: 30 * k * 1.25, font: 'Bangers', weight: 400, fill: '#c1121f', spacing: 2 });
    for (const [bxx, col] of [[-640, '#ff4f6a'], [-330, '#4fa8ff']]) { const [x, y] = p2(bxx, 592, zb); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 30 * k); ctx.lineTo(bxx < -400 ? x + 6 : x - 6, p2(0, 442, zb)[1]); ctx.stroke(); ctx.fillStyle = col; ell(x, y, 26 * k * 1.1, 32 * k * 1.1); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); } }
  // reception, a bench and plants
  S6.box3({ x0: 330, x1: 640, y1: 200, z0: 960, z1: 1240, color: '#5a4636', top: '#d8c9a4', side: '#43352a', frontGrad: [[0, '#6a5240'], [1, '#463426']], fog: { color: '#2c3658', amt: .2, zFar: zb } });
  onZ(960, 380, 590, 96, 160, '#f2ecdc', 'rgba(25,16,30,.7)', 2); { const [rx, ry] = p2(485, 128, 960); text('SIGN IN', rx, ry, { size: 26 * kz(960) * 1.0, fill: '#2a2530', spacing: 2 }); }
  S6.box3({ x0: 430, x1: 520, y0: 200, y1: 290, z0: 1070, z1: 1100, color: '#1a1d26', front: '#10131a' });
  S6.box3({ x0: 560, x1: 600, y0: 200, y1: 214, z0: 1010, z1: 1060, color: '#d7b64a' });
  S6.box3({ x0: -620, x1: -400, y1: 100, z0: 1100, z1: 1300, color: '#7a3a30', top: '#a04c3e', side: '#5a2c24', fog: { color: '#2c3658', amt: .25, zFar: zb } });
  S6.plant3(-600, 1500, 1.0); S6.plant3(600, 1560, 1.0);
  for (const z of [300, 900, 1500]) if (z + 150 > P.cz + 150) { S6.ceilingLamp(-260, z, ch, 1, '255,236,200'); S6.ceilingLamp(260, z, ch, 1, '255,236,200'); }
  // the wall clock
  { const [cx, cy] = p2(480, 560, zb); ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); dial(70, S0, { tickAge: o.tickAge }); ctx.restore(); }
  // light: a cool spill from the glass across the floor, warm pools under the lamps
  const fa = p2(-300, 0, zb), fb = p2(300, 0, zb), fc = p2(560, 0, P.cz + 260), fd = p2(-560, 0, P.cz + 260);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(0, fa[1], 0, fc[1], [[0, `rgba(150,190,255,${.2 + .16 * open})`], [.6, 'rgba(150,190,255,.07)'], [1, 'rgba(150,190,255,0)']]);
  ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore();
  for (const [X, Z] of [[-260, 540], [260, 540], [-260, 1140], [260, 1140]]) if (Z > P.cz + 150) { const [gx, gy] = p2(X, 0, Z); V2.glow(gx, gy, 330 * kz(Z), '255,226,170', .09, 'screen', 0); }
  const [dxx, dyy] = p2(0, 240, zb); V2.glow(dxx, dyy, 600 * k, '150,190,255', .16 + .12 * open, 'screen', .5);
}

SC_EXIT.carPose = [130, 2400, -PI / 2];
SC_EXIT.pPath = lt => { const o = B('out').s, m = B('m1');
  return route([[0, ...XC.pers], [o, ...XC.pers], [o + .55, 25, 1620, 'io'], [o + .9, 12, 1770], [o + 1.8, 40, 1950], [m.s, 90, 2060], [m.e + .8, 150, 2230]])(lt); };
SC_EXIT.door = lt => { const o = B('out').s, r = B('run').s, c = B('a2').s + .3;
  const a = eo(lt, o + .12, o + .75) * (1 - ez(lt, c, c + .7)), b = lt >= r ? .62 * eo(lt, r + .08, r + .8) : 0;
  return Math.max(a, b); };
SC_EXIT.sPath = lt => { const r = B('run').s; return route([[0, ...XC.straw], [r, ...XC.straw], [r + .22, 235, 1090, 'in'], [r + .7, 40, 1700], [r + .9, 0, 1790], [r + 1.1, -10, 1990]])(lt); };

SC_EXIT.shot = lt => {
  const b = B, cd = b('cd').s;
  const order = [['wide', b('s1').s - .05], ['cuS', b('p1').s - .05], ['cuP', b('s2').s - .05], ['cuS', b('p2').s - .05], ['cuP', cd], ['clk', cd + .4], ['thumb', cd + .8], ['foot', cd + 1.2], ['admP', cd + 1.55], ['alarm', b('p3').s - .0],
    ['cuP', b('out').s - .06], ['cuS', b('a1').s - .05], ['adm', b('a2').s - .05], ['rate', b('m1').s - .15], ['mang', b('s3').s - .05], ['dolly', b('run').s - .05], ['run', 1e9]];
  return order.find(([, e]) => lt < e)[0];
};
// the cast, built once per frame from lt
SC_EXIT.cast = lt => {
  const b = B, sh = SC_EXIT.shot(lt), cdT = lt - b('cd').s;
  const outT = lt - b('out').s, walking = lt > b('out').s + .02;
  const pp = SC_EXIT.pPath(lt), pBack = walking;
  const sipT = inB(lt, 'p2') ? seg(lt, b('p2').s + .2, b('p2').s + .5) * (1 - seg(lt, b('p2').e - .2, b('p2').e)) : 0;
  const pOnPhone = lt >= b('cd').s && lt < b('p3').e + .15;
  const keysOut = lt >= b('p3').s + .3;
  const P = person(persimmon, SC_EXIT.pPath, lt, Object.assign({ stride: 36, id: 'persimmon', transit: false },
    pBack ? { noFace: true, acc: ['airpods'], look: [0, 0], arms: { l: 'hold', r: 'hold' }, hold: { l: 'tote9', r: 'keyring9' }, grip: { l: [-118, 76], r: [112, 98] }, toteRing: false, keySwing: .35 * Math.sin(lt * 9), sway: .04 }
      : { acc: ['sunglasses', 'perdiem', 'airpods'], look: inB(lt, 's1') || inB(lt, 's2') ? [-.55, .1] : inB(lt, 'p3') ? [-.9, -.1] : lt < b('s1').s ? [.8, -.25] : [-.4, .05],
        expr: inB(lt, 'p3') ? 'dead' : lt >= b('p1').s && lt < b('s2').s ? 'smug' : 'chill', lid: .3,
        arms: { l: 'hold', r: 'hold' }, hold: { l: 'tote9', r: pOnPhone && !keysOut ? 'alarm9' : keysOut ? 'keyring9' : 'icedcup' }, grip: { l: [-118, 76], r: keysOut ? [112, 98] : pOnPhone ? [96, 86] : [92, 64] },
        toteRing: !keysOut && lt < b('cd').s + 1, alarmOn: lt >= b('cd').s + 1.9 ? 1 : 0, keySwing: .35 * Math.sin(lt * 9) } ));
  if (sipT > 0) P.grip.r = [lerp(92, 104, sipT), lerp(64, 22, sipT)];   // beside her face: the cup used to cover a lens and her mouth
  const clip = lt < b('cd').s + 1 && lt < b('s2').s || true;
  const S = person(straw, SC_EXIT.sPath, lt, { stride: 40, look: lt < b('s1').s ? [.2, .1] : sh === 'dolly' || lt >= b('out').s && lt < b('a1').s ? [-.2, .1] : [-.55, .05],
    expr: lt >= b('s4').s ? 'panic' : lt >= b('s3').s ? 'shock' : lt >= b('out').s + .6 ? 'shock' : lt >= b('out').s ? 'neutral' : inB(lt, 's2') ? 'sour' : 'dead',
    lid: lt >= b('out').s && lt < b('out').e + .3 ? lerp(.55, 0, ez(lt, b('out').s, b('out').e)) : (lt < b('s3').s && lt >= b('p3').s - 1 || lt < b('out').s) ? .5 : undefined,
    browUp: 0, hold: { l: 'clipboard6' }, grip: inB(lt, 's2') ? { l: [-110, 30], r: [124, 56] } : { l: [-110, 30] }, hand: inB(lt, 's2') ? { r: 'open' } : undefined, clipText: lt >= b('s1').s ? 'REPORT' : 'REPORT',
    arms: { l: lt >= b('run').s ? 'flail' : 'hold', r: lt >= b('s4').s && lt < b('run').s ? 'up' : inB(lt, 's2') ? 'hold' : 'rest' },
    legs: sh === 'foot' ? 'tap' : undefined, acc: ['steth', 'badge7', 'bandage7'].concat(lt >= b('out').e + 1.3 ? ['sweat'] : []), transit: lt >= b('run').s });
  if (lt >= b('run').s) { S.arms = { l: 'none', r: 'none' }; S.hold = {}; S.grip = {}; S.arms = { l: 'flail', r: 'flail' }; }
  const pinch = lt >= b('run').s ? seg(lt, b('run').s + .5, b('run').s + .66) * (1 - seg(lt, b('run').s + .8, b('run').s + .95)) : 0;
  if (pinch > 0) S.sx = 1 - .36 * pinch;
  const M = person(mango, () => XC.mango, lt, { look: lt >= b('m1').s - .15 ? [.75, -.1] : lt < b('s1').s ? [.3, 0] : [.7, 0], expr: lt >= b('m1').s - .2 && lt < b('s3').s ? 'shock' : lt >= b('s3').s ? 'sad' : 'neutral', arms: { l: 'rest', r: 'rest' } });
  const aq = lt >= b('a2').s - .1 && lt < b('m1').s - .15, waveOn = inB(lt, 'a1') || lt >= b('a1').s - .2 && lt < b('a1').e + .2;
  const Ad = person(melon, () => XC.admin, lt, { look: lt >= b('out').s ? [.8, -.1] : [.3, .1], expr: lt >= b('m1').s - .2 ? 'shock' : lt >= b('out').s + .3 ? 'happy' : 'happy', hold: { r: 'cell' }, grip: { r: [150, 56] }, arms: { l: waveOn ? 'wave' : 'rest', r: 'hold' }, lid: lt >= b('m1').s - .2 ? undefined : undefined });
  void outT; void cdT; void clip; void aq;
  return { P, S, M, Ad, sh };
};

SC_EXIT.cam = function (lt) {
  V2.setCam({ f: 1400, cy: 360, hy: 860 });
  const b = B, sh = SC_EXIT.shot(lt);
  if (sh === 'dolly') {   // a dolly zoom: the camera moves in while the lens widens, so Strawberry stays the same size and the room stretches away behind her
    const d = ez(lt, b('s3').s - .05, b('s4').e + .1), cz = lerp(0, 640, d), Z = XC.straw[1];
    V2.setCam({ f: 1400 * (Z - cz) / Z, cz, cy: 360, hy: 860 });
  }
  const c = SC_EXIT.cast(lt), cdl = lt - b('cd').s;
  CAM.shake = 0;
  if (sh === 'wide') { const k = seg(lt, 0, b('s1').s); zoomTo(540, 1000, lerp(.98, 1.02, k)); }
  else if (sh === 'cuS') camFace({ kind: 'straw', x: c.S.x, y: c.S.y, s: c.S.s }, lt >= b('out').s ? lerp(1.45, 1.6, seg(lt, b('out').s, b('out').e)) : 1.7, 120, lt >= b('out').s ? 170 : 0);
  else if (sh === 'cuP') { const bk = lt >= b('p3').s && lt < b('p3').e ? seg(lt, b('p3').s, b('p3').e) : 0; camFace({ kind: 'persimmon', x: c.P.x, y: c.P.y, s: c.P.s }, 2.35 + .25 * (inB(lt, 'p1') ? seg(lt, b('p1').s, b('p1').e) : bk), 80); }
  else if (sh === 'foot') zoomTo(c.S.x + 8, c.S.y - 30, 4.8);
  else if (sh === 'adm') camFace({ kind: 'melon', x: c.Ad.x, y: c.Ad.y, s: c.Ad.s }, 1.55, 40, -60);
  else if (sh === 'mang') { const k = seg(lt, b('m1').s - .15, b('m1').e); zoomTo(lerp(380, 400, k), 1000, lerp(1.16, 1.22, k)); }
  else if (sh === 'dolly') { const d = ez(lt, b('s3').s - .05, b('s4').e + .1); camFace({ kind: 'straw', x: c.S.x, y: c.S.y, s: c.S.s }, lerp(1.6, 1.85, d), 110, 20); if (lt >= b('s4').s) CAM.shake = 12 * (1 - seg(lt, b('s4').s, b('s4').e + .3)); }
  else if (sh === 'run') { const k = ez(lt, b('run').s, b('run').e); zoomTo(540, 960, lerp(.94, .98, k)); CAM.shake = 9 * (1 - seg(lt, b('run').s + .7, b('run').e)); }
  void cdl;
};

SC_EXIT.draw = function (lt) {
  const b = B, c = SC_EXIT.cast(lt), sh = c.sh, S0 = storySec(lt), ta = tickAge(lt), door = SC_EXIT.door(lt);
  V2.setLight({ key: [-.35, -.8], keyColor: '#ffe3b8', keyA: .26, rim: '#8fb8ff', rimA: sh === 'adm' ? .2 : .55, shadow: '#0a1030', shadowA: .45, amb: '#9aa6e0', ambA: .1, bounce: '#ffcf99', bounceA: .2 });   // the melon is wide: a full rim washes half of its face
  V2.opts.reflect = true;
  const bg = () => lobbyNight({ doorOpen: door, t: lt + 2, S0, tickAge: ta });
  const subj = { cuS: 'S', dolly: 'S', cuP: 'P', adm: 'A', mang: 'M' }[sh];
  const lobbyBlur = sh === 'cuS' || sh === 'cuP' || sh === 'dolly' || sh === 'adm' ? 5 : 0;
  // ---------------- full-frame phone shots and close-ups of things
  if (sh === 'clk') {
    V2.dof(14, bg); ctx.save(); ctx.fillStyle = 'rgba(4,3,14,.45)'; ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
    const x = lt - b('cd').s, kk = 1 + .02 * (1 - seg(x % .5, 0, .2));
    CAM.shake = 0; ctx.save(); ctx.translate(540, 820); ctx.scale(kk, kk); dial(330, S0, { tickAge: ta, nums: true }); ctx.restore();
    text('10:59', 540, 1250, { size: 90, font: 'Bangers', weight: 400, fill: '#ffd23a', lw: 10, stroke: '#150f22', spacing: 3, alpha: 0 });
    return;
  }
  if (sh === 'thumb') {
    const x = lt - b('cd').s, sec = Math.min(9, Math.max(0, 60 - 56 - Math.floor(x / .5) + 0));
    phoneShot(bg, (w, h) => uiEarn(w, h, { sec: 4 - Math.min(3, Math.floor(x / .5)) }), { rot: -.06 + .01 * Math.sin(lt * 3), blur: 14 });
    const hover = Math.sin(lt * 9) * 10;
    glove(540 + 190 + hover, 815 + 330, -2.55, 5.2); void sec; return;
  }
  if (sh === 'admP') {
    phoneShot(bg, (w, h) => uiRate(w, h, { stars: 0, thumbHint: true }), { rot: .05, blur: 14 });
    const hover = Math.sin(lt * 22) * 6; glove(540 + 120 + hover, 815 - 90 + hover, -2.4, 5.2); return;
  }
  if (sh === 'alarm') {
    const x = lt - b('cd').s, on = x >= 1.9 ? 1 : 0, shake = on ? 10 * Math.sin(lt * 70) : 0;
    phoneShot(bg, (w, h) => uiAlarm(w, h, { t: lt, on }), { rot: on ? .03 * Math.sin(lt * 60) : 0, dx: shake, blur: 14 });
    if (on) { const k = (x - 1.9); V2.glow(540, 815, 900, '255,60,90', .22 + .1 * Math.sin(lt * 40), 'screen', .3); for (let i = 0; i < 3; i++) V2.ring(540, 815, (k * 2 - i * .25), { color: '255,90,110', r0: 200, r1: 900, lw: 14, alpha: .7 }); }
    return;
  }
  if (sh === 'rate') {
    const a2 = b('a2'), n = clamp((lt - (a2.s + .15)) / .55) * 5, pops = Math.floor(n + .001);
    phoneShot(bg, (w, h) => uiRate(w, h, { stars: n, t: lt }), { rot: -.04, blur: 14 });
    const tap = (lt - (a2.s + .15)) * 9, finger = n < 5 ? Math.floor(n) : 4;
    glove(540 + (finger - 2) * 94 + 60, 815 - 240 + 150 - 40 * Math.abs(Math.sin(tap)) + 30, -2.5, 5.2);
    if (n >= 5 && n - 5 < .2) V2.glow(540, 815 - 200, 500, '255,226,90', .24, 'screen', .6);
    void pops; return;
  }
  // ---------------- the lobby itself
  V2.dof(lobbyBlur, bg);
  const draws = [['P', c.P], ['Ad', c.Ad], ['M', c.M], ['S', c.S]].sort((a, b) => a[1].y - b[1].y);
  const sub = { cuS: 'S', dolly: 'S', cuP: 'P', adm: 'Ad' }[sh];
  if (sh === 'foot') { V2.dof(10, bg); REG.suppress++; drawChar(c.S); REG.suppress--; const sx = c.S.x + 30 * c.S.s, sy = c.S.y; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; const tp = Math.max(0, Math.sin(lt * 16)); for (let i = 0; i < 3; i++) { ctx.globalAlpha = .6 * tp; ctx.beginPath(); ctx.moveTo(sx + 70 + i * 22, sy - 20 - i * 28); ctx.lineTo(sx + 100 + i * 24, sy - 34 - i * 34); ctx.stroke(); } ctx.restore(); return; }
  const others = draws.filter(([n]) => sub && n !== sub).map(([, o]) => o), mains = draws.filter(([n]) => !sub || n === sub).map(([, o]) => o);
  if (others.length) V2.dof(6, () => others.forEach(drawBg));
  // the persimmon outside the door is behind the glass: draw her before the leaves would hide her; she is a distant figure either way
  mains.forEach(o => sh === 'mang' && o === c.S ? nbr(o) : drawChar(o));
  // the leaves of the doors passing in front of anyone walking through them
  V2.addLight({ x: 540, y: 1000, r: 900, color: '150,190,255', a: .18 });
  V2.dust(60, 600, 1020, 1400, lt, { n: 22, alpha: .25, color: '200,215,255' });
  // a glint on the key ring in the m1 shot
  if (sh === 'mang') {
    const g = Math.max(0, Math.sin(lt * 7));
    const [gx, gy] = [c.P.x + 112 * c.P.s, c.P.y - (84 + 100 * .9) * c.P.s + 98 * c.P.s];
    glint(gx, gy, 46 * c.P.s + 10, g);
  }
};
SC_EXIT.fx = lt => {
  const sh = SC_EXIT.shot(lt), cdx = lt - B('cd').s;
  return { bloom: ['adm', 'alarm', 'rate', 'thumb', 'admP', 'clk'].includes(sh) ? .22 : .7, vignette: .55, grain: .05, contrast: .18, sat: .1, tint: [['#3a54c8', .2, 'soft-light'], ['#0a1030', .1, 'multiply']],   // the lit glass doors bloom across the Administrator's face and over the phone screens
    aberr: sh === 'alarm' && cdx > 1.9 ? 7 : sh === 'run' ? 4 : 0, fade: Math.max(lt < .25 ? 1 - lt / .25 : 0, sh === 'alarm' && cdx >= 1.9 && cdx < 2.0 ? .4 * (1 - (cdx - 1.9) / .1) : 0), fadeColor: sh === 'alarm' ? '255,220,230' : '0,0,10' };
};
SC_EXIT.blur = lt => { const sh = SC_EXIT.shot(lt); return sh === 'run' || sh === 'thumb' || sh === 'foot' ? 3 : 1; };
SC_EXIT.clock = lt => fmtClock(storySec(lt));
SC_EXIT.over = function (lt) {
  const b = B, sh = SC_EXIT.shot(lt), cdx = lt - b('cd').s;
  // a small TICK on every beat of the countdown
  if (cdx >= 0 && cdx < 2 && sh !== 'alarm') { const q = (cdx % .5) / .5; sfxWord(lt, lt - (cdx % .5), 'TICK', 860, 330, { size: 78, hold: .22, fill: '#fff', rot: .06 }); void q; }
  if (sh === 'alarm' && cdx >= 1.9) sfxWord(lt, b('cd').s + 1.9, 'BEEP BEEP', 540, 330, { size: 96, fill: '#ff6a7a', hold: .35 });
  // the comic word
  if (lt >= b('s4').s - .02 && lt < b('run').s + .1) {
    const k = easeBack(seg(lt, b('s4').s - .02, b('s4').s + .14)), f = 1 - seg(lt, b('run').s - .05, b('run').s + .1);
    ctx.save(); ctx.globalAlpha *= f; ctx.translate(640, 318); ctx.rotate(-.07); ctx.scale(k, k);
    text('THE KEYS!', 0, 0, { size: 118, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 16, stroke: '#150f22', spacing: 4, shadow: 16 }); ctx.restore();
  }
  // run: speed lines streaking in toward the doors
  if (sh === 'run') {
    const a = clamp(seg(lt, b('run').s, b('run').s + .12)) * (1 - seg(lt, b('run').e - .2, b('run').e));
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.55 * a})`; ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const ang = (i / 26) * TAU + hash(Math.floor(lt * 30) + i) * .12, r0 = 520 + hash(i + 3) * 160, r1 = r0 + 260 + hash(i + Math.floor(lt * 30)) * 260; ctx.lineWidth = 3 + hash(i + 9) * 6;
      ctx.beginPath(); ctx.moveTo(540 + Math.cos(ang) * r0, 960 + Math.sin(ang) * r0 * 1.2); ctx.lineTo(540 + Math.cos(ang) * r1, 960 + Math.sin(ang) * r1 * 1.2); ctx.stroke(); }
    ctx.restore();
    sfxWord(lt, b('run').s + .05, 'WHOOSH', 560, 420, { size: 120, hold: .5, rot: -.1 });
  }
  // the key ring in m1: a magnified bubble so the audience cannot miss it
  if (sh === 'mang') {
    const m = b('m1'), a = clamp(seg(lt, m.s + .1, m.s + .4));
    if (a > 0) A7.pip(880, 520, 128, { appear: a, ring: '#ffd23a', label: 'ALL KEYS', ping: true, id: 'keys' }, r => {
      ctx.fillStyle = V2.grad(0, -r, 0, r, [[0, '#14204a'], [1, '#0a1030']]); ctx.fillRect(-r, -r, 2 * r, 2 * r); V2.glow(0, 0, r * 1.2, '255,226,150', .3, 'screen', 0);
      ctx.save(); ctx.translate(0, -r * .5); ctx.scale(1.55, 1.55); ctx.rotate(Math.sin(lt * 9) * .18); EXT.prop.keyring9(1, { keySwing: 0 }, lt); ctx.restore();
    });
  }
};

// ============================================================================ the parking lot, 11:00 PM
const SC_LOT = {};
const STOP = [190, 1150], LAMP = [330, 1236];
SC_LOT.t0 = () => B('car').s;
// the convertible: idles, burns out, and leaves toward the far left corner of the lot
SC_LOT.car = lt => {
  const t0 = B('car').s, tl = t0 + 1.35, base = [-110, 1180];
  if (lt < tl) return { x: base[0], z: base[1], yaw: -PI / 2, v: 0, burn: seg(lt, tl - .5, tl) };
  const u = lt - tl, a = 1100, d = .5 * a * u * u + 0 * u, h = ez(lt, tl, tl + 1.3) * .62;
  const yaw = -PI / 2 + h, dir = [Math.sin(yaw), Math.cos(yaw)];
  return { x: base[0] + dir[0] * d, z: base[1] + dir[1] * d, yaw, v: a * u, burn: 0 };
};
SC_LOT.sPath = lt => { const t0 = B('car').s; return route([[0, 0, 2092], [t0, 0, 2092], [t0 + .5, 230, 1770], [t0 + 1.05, 240, 1160], [t0 + 1.4, 215, 1150, 'out'], [t0 + 1.9, STOP[0], STOP[1], 'out']])(lt); };
SC_LOT.moonPos = lt => { const m = B('mo1').s; const r = ez(lt, B('car').s + 1.3, m); return [lerp(980, 860, r), lerp(840, 410, easeOut(seg(lt, B('car').s + 1.3, m)))]; };
SC_LOT.shot = lt => {
  const b = B, c = b('car'), m1 = b('mo1');
  const order = [['wide', c.e - .05], ['moonW', m1.s + 1.0], ['moonC', m1.e - .1], ['cuSq', b('ph').s - .05], ['phone', b('s5').s - .05], ['cuS', b('mo2').s - .05], ['cuM', b('tap').s - .05], ['tapph', b('tap').s + .85], ['pull', 1e9]];
  return order.find(([, e]) => lt < e)[0];
};
SC_LOT.cast = lt => {
  const b = B, sh = SC_LOT.shot(lt), t0 = b('car').s;
  const cp = SC_LOT.car(lt), run = lt >= t0 && lt < t0 + 1.9, bent = lt >= t0 + 1.9;
  const S = runner(straw, SC_LOT.sPath, lt, { id: 'straw', look: bent ? [-.3, .2] : [-.2, .1], stride: 44,
    expr: lt >= b('tap').s + .9 ? 'happy' : lt >= b('s5').s ? 'hopeful' : lt >= b('ph').s ? 'neutral' : bent ? 'dead' : lt >= t0 + 1.0 ? 'panic' : 'angry',
    lid: bent && lt < b('ph').s ? .55 : undefined,
    arms: { l: run ? (lt > t0 + 1.2 ? 'reach' : 'run') : 'rest', r: run ? (lt > t0 + 1.2 ? 'reach' : 'run') : 'rest' }, acc: ['steth', 'badge7', 'bandage7'].concat(bent && lt < b('ph').s ? ['sweat'] : []),
    transit: lt < t0 + .4 }, 280);
  if (!run) { S.gaitW = undefined; S.axis = undefined; S.dir = undefined; S.vx = 0; }
  if (bent && lt < b('ph').s) { const br = Math.sin(lt * 11); S.squash = .5 + .1 * br; S.plant = true; S.rot = .1; S.grip = { l: [-70, 84], r: [70, 84] }; S.arms = { l: 'hold', r: 'hold' }; S.look = [0, .5]; }
  if (lt >= b('ph').s && lt < b('tap').s + .8) { S.hold = {}; }
  if (lt >= b('tap').s + .85) { S.hold = { r: 'cell' }; S.grip = { r: [96, 70] }; S.arms = { l: 'rest', r: 'hold' }; S.look = [0, -.15]; }
  return { S, cp, sh };
};
SC_LOT.cam = function (lt) {
  V2.setCam({ f: 1400, cy: 360, hy: 860 });
  const b = B, sh = SC_LOT.shot(lt), t0 = b('car').s;
  CAM.shake = 0;
  if (sh === 'wide') {
    const pan = ez(lt, t0 + 1.35, t0 + 2.5);
    V2.setCam({ f: 1400, cy: 360, hy: 860, cx: -110 * pan });
    zoomTo(540, 1090, lerp(.98, 1.02, seg(lt, 0, t0 + 2.5)) - .05 * pan);
    if (lt > t0 + 1.35 && lt < t0 + 1.9) CAM.shake = 7 * (1 - seg(lt, t0 + 1.35, t0 + 1.9));
  } else {
    const c = SC_LOT.cast(lt);
    if (sh === 'moonW') { zoomTo(540, 1060, 1.0); }
    else if (sh === 'cuSq') camFace({ kind: 'straw', x: c.S.x, y: c.S.y + (KINDS.straw.leg + KINDS.straw.ry * .9) * .5 * .35 * c.S.s, s: c.S.s }, 2.0, 80);   // planted: the face sits lower by what the squash would have lifted the shoes
    else if (sh === 'cuS') camFace({ kind: 'straw', x: c.S.x, y: c.S.y, s: c.S.s }, 2.0 + .1 * seg(lt, b('s5').s, b('s5').e), 140);   // 60 px higher than the other close-ups: the speaker chip must not sit on her shoes
    else if (sh === 'pull') {
      const k = ez(lt, b('tap').s + .85, b('tap').e + .1), cx = STOP[0];
      V2.setCam({ f: 1400, cy: 360, hy: 860, cx: lerp(cx * .6, cx, k) });
      const c2 = SC_LOT.cast(lt); void c2;
      zoomTo(lerp(540, 520, k), lerp(900, 1010, k), lerp(2.1, 1.0, k));
    }
  }
};
SC_LOT.draw = function (lt) {
  const b = B, c = SC_LOT.cast(lt), sh = c.sh, t0 = b('car').s, cp = c.cp, S = c.S;
  V2.setLight({ key: [-.35, -.8], keyColor: '#cfe0ff', keyA: .24, rim: '#9fc4ff', rimA: .6, shadow: '#080a28', shadowA: .5, amb: '#8a94d8', ambA: .12, bounce: '#ffcf99', bounceA: .18 });
  V2.opts.reflect = true;
  const doorOpen = ez(lt, t0 - .25, t0 + .15);
  const moonOn = lt >= t0 + 1.3;
  const moon = SC_LOT.moonPos(lt), mo1 = b('mo1'), mo2 = b('mo2'), pullK = ez(lt, b('tap').s + .85, b('tap').e + .1);
  const mExpr = inB(lt, 'mo1') ? (lt < mo1.s + 1.2 ? 'neutral' : 'sad') : inB(lt, 'mo2') ? 'smug' : lt >= b('tap').s ? 'happy' : lt >= mo1.e ? 'sour' : 'neutral';
  const moonObj = (sh === 'moonC' || sh === 'cuM') ? null : { x: moon[0], y: moon[1], s: sh === 'pull' ? lerp(1.0, 1.15, pullK) : .9, suppress: !(sh === 'moonW' || (sh === 'pull' && pullK > .88) || (sh === 'wide' && moon[1] < 560)), look: [-.5, .4], expr: mExpr };
  const bgLot = (blur, withMoon = true) => V2.dof(blur, () => lotNight({ t: lt, doorOpen, moon: withMoon ? moonObj : null, cp, c, lt }));
  if (sh === 'moonC' || sh === 'cuM') {
    const bgM = () => { ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#03051a'], [.6, '#101c4e'], [1, '#2a3a80']]); ctx.fillRect(-100, -100, W + 200, H + 200); A7.stars(lt, 1500, { n: 120, seed: 4, a: 1 }); A7.clouds(lt, 1350, 1700, { n: 3, tint: '90,100,170', belly: '30,36,90', a: .5, speed: 8, seed: 2, scale: 1.5 }); };
    bgM();
    const push = sh === 'moonC' ? lerp(2.15, 2.4, seg(lt, mo1.s + 1.0, mo1.e)) : lerp(2.2, 2.35, seg(lt, mo2.s - .05, mo2.e));
    const guilty = sh === 'moonC' ? Math.sin(lt * 5) * .5 : 0;
    A7.moon(540, 790, push, { t: lt, haloA: 1, char: { expr: mExpr, look: sh === 'moonC' ? [-.9 + guilty * .2, .45] : [0, .1], lid: sh === 'moonC' ? .3 : .15, acc: sh === 'moonC' && lt > mo1.s + 1.3 ? ['sweat'] : [] } });
    return;
  }
  if (sh === 'phone' || sh === 'tapph') {
    const ph = b('ph'), tp = b('tap'), x = sh === 'phone' ? lt - ph.s : 1;
    const buzz = sh === 'phone' ? Math.exp(-(x) * 3.5) * Math.sin(lt * 90) : 0;
    const tt = lt - tp.s;
    const press = sh === 'tapph' ? seg(tt, .1, .16) * (1 - seg(tt, .2, .32)) : 0;
    const done = sh === 'tapph' && tt > .1;
    phoneShot(() => bgLot(14, false), (w, h) => uiNotif(w, h, { t: lt, slide: sh === 'phone' ? seg(x, .1, .45) : 1, expand: sh === 'phone' ? ez(x, .45, 1.0) : 1, press, pulse: sh === 'tapph' ? Math.max(0, Math.sin(clamp(tt - .1, 0, .5) * 13)) * (tt > .1 ? 1 : 0) : 0, toast: done ? seg(tt, .2, .45) : 0 }), { dx: buzz * 14, rot: buzz * .02, blur: 14 });
    if (sh === 'phone' && x > 1.0) V2.ring(540, 815 + 190, ((lt * 1.1) % 1), { color: '255,120,200', r0: 240, r1: 480, lw: 6, alpha: .35 });
    if (sh === 'tapph') {
      // the glove lands on SIGN UP (the button sits at the centre of the card, y = 815 - 530 + top + 470)
      const by = 815 - PHH / 2 + 330 + 470, hover = tt < .1 ? 40 * (1 - seg(tt, 0, .1)) : 0;
      glove(540 + 70 + hover, by + hover * .6 - 4 + (tt > .1 && tt < .2 ? 6 : 0), -2.45, 5.0);
      if (tt > .1) { confetti(tt, .12, 90); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 1, r = 150 + 220 * easeOut(clamp((tt - .1) / .6)); glint(540 + Math.cos(a) * r, by + Math.sin(a) * r * .8, 36 * (1 - clamp((tt - .1) / .9)) + 6, clamp(1 - (tt - .1) / 1.0)); } V2.ring(540, by, (tt - .1) / .6, { color: '255,220,255', r0: 40, r1: 420, lw: 12, alpha: .8 }); }
    }
    return;
  }
  // ---------------- the lot in the world
  bgLot(sh === 'cuSq' || sh === 'cuS' ? 6 : 0);
  // lamp post light on the figure, the dust, the exhaust
  V2.dust(60, 600, 1020, 1400, lt, { n: 24, alpha: .25, color: '200,215,255' });
  // the convertible
  const driver = (px, py, k) => {
    const jingle = lt >= t0 && lt < t0 + 1.8 ? Math.sin(lt * 26) * .55 * seg(lt, t0 + .3, t0 + .5) : .2 * Math.sin(lt * 8);
    const flyBack = seg(lt, t0 + 1.35, t0 + 1.9);
    drawChar(persimmon({ x: px, y: py, s: .62 * k, center: true, noLegs: true, noShadow: true, noReflect: true, id: 'persimmon', acc: ['sunglasses', 'perdiem', 'airpods'], expr: lt >= t0 + .9 ? 'smug' : 'chill', lid: .25, look: [-.6, 0],
      sway: .16 + .06 * Math.sin(lt * 17) + .18 * clamp(cp.v / 1500), vx: -cp.v * 1.4, arms: { l: 'hold', r: 'hold' }, grip: { l: [-150, 44], r: [196, -34 - 20 * Math.sin(lt * 3)] }, hold: { r: 'keyring9' }, keySwing: jingle, keyGlint: lt >= t0 && lt < t0 + 1.9 ? Math.max(0, Math.sin(lt * 13)) : 0, transit: lt > t0 + 1.3,
      shadowA: 0 }));
  };
  const sFar = S && SC_LOT.sPath(lt)[1] > cp.z + 60;   // she is farther from the camera than the car until she runs up behind it: then the car hides her legs
  if (sFar && lt >= t0 - .02) drawChar(S);
  const rearPos = car3d(cp.x, cp.z, cp.yaw, { color: '#d9263a', lights: 1, brake: lt < t0 + 1.35 ? .25 + .75 * seg(lt, t0 + 1.0, t0 + 1.3) : .9 * (1 - seg(lt, t0 + 1.4, t0 + 2.0)), t: lt, k: V2.proj(cp.x, 0, cp.z)[2], driver, wheelSpin: lt * 30 * (cp.v > 0 || cp.burn > 0 ? 1 : .05) });
  groundBeam(cp.x, cp.z, cp.yaw, 640, 250, 1);
  // exhaust, tire smoke on the burnout and the launch
  { const [ex, ey] = rearPos.PJ(-60, 56, -280);
    V2.smoke(ex, ey, lt, 0, { n: 10, rate: 3.5, life: 2.2, rise: 70, spread: 40, size: 28, alpha: .22, color: '120,120,140', seed: 4 });
    if (lt >= t0 + 1.2) { const [sx, sy] = rearPos.PJ(0, 36, -170); V2.smoke(sx, sy, lt, t0 + 1.2, { n: 26, rate: 16, life: 2.2, rise: 130, spread: 130, size: 62, alpha: .62, color: '210,212,226', seed: 9 }); } }
  // Strawberry and the key ring's glint
  if (S && !sFar && lt >= t0 - .02) drawChar(S);   // the lot is empty until the doors burst open
  // the lamp light on top
  V2.addLight({ x: 700, y: 900, r: 900, color: '255,226,170', a: .22 });
};
// the night lot: sky and stars, the Moon (a character, never a disc), the building across the lot with its glowing entrance, asphalt, parked cars, lamp posts
function lotNight(o) {
  const t = o.t ?? 0, hy = V2.P.hy, Zb = 2100, k = kz(Zb), open = o.doorOpen ?? 0;
  ctx.fillStyle = V2.grad(0, 0, 0, hy + 120, [[0, '#04061c'], [.5, '#121c52'], [.85, '#2a3a86'], [1, '#4a5a9a']]); ctx.fillRect(-300, -300, W + 600, hy + 520);
  A7.stars(t, 700, { n: 110, a: 1, seed: 21 });
  if (o.moon) { const m = o.moon; A7.moon(m.x, m.y, m.s, { t, haloA: .6, suppress: m.suppress, char: { expr: m.expr, look: m.look } }); }
  // the building
  const hw = 1500, bh = 640;
  { const a = p2(-hw, 0, Zb), b = p2(hw, bh, Zb);
    onZ(Zb, -hw, hw, 0, bh, V2.grad(0, b[1], 0, a[1], [[0, '#2c2a4c'], [1, '#4a4668']]));
    onZ(Zb, -hw, hw, bh - 36, bh + 20, '#1e1c34', 'rgba(10,8,20,.6)', 2); onZ(Zb, -hw, hw, 0, 34, '#3e3a58'); }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
    const x0 = -1120 + c * 250, y0 = [130, 310, 490][r], litw = hash(r * 9 + c + 3) > .3 ? 1 : 0;
    if (Math.abs(x0 + 62) < 260 && r === 0) continue;
    onZ(Zb, x0, x0 + 124, y0, y0 + 110, litw ? (hash(r * 9 + c + 40) > .5 ? '#ffe2a0' : '#ffd07a') : '#1c1a34', 'rgba(10,8,20,.65)', 2.2);
    if (litw) { const [gx, gy] = p2(x0 + 62, y0 + 55, Zb); V2.glow(gx, gy, 150 * k, '255,200,120', .22, 'screen', .4); }
  }
  // the entrance: glass doors that slide open, warm light inside
  onZ(Zb, -190, 190, 0, 260, V2.grad(0, p2(0, 260, Zb)[1], 0, p2(0, 0, Zb)[1], [[0, '#ffd890'], [1, '#fff2cc']]), 'rgba(10,8,20,.7)', 3);
  { const sh = open * 90; for (const [a, b2] of [[-190 - sh, -sh], [sh, 190 + sh]]) onZ(Zb, Math.max(-190, a), Math.min(190, b2), 0, 260, open > .5 ? 'rgba(0,0,0,0)' : 'rgba(190,215,235,.35)', 'rgba(60,40,70,.6)', 3); }
  { const [gx, gy] = p2(0, 120, Zb); V2.glow(gx, gy, 460 * k, '255,220,150', .55, 'screen', .8); }
  S6.box3({ x0: -270, x1: 270, y0: 268, y1: 296, z0: Zb - 170, z1: Zb, color: '#2c2842', top: '#3c3858', lw: 1.6 });
  for (const x of [-380, 380]) onZ(Zb, x - 12, x + 12, bh + 12, bh + 52, '#2c2842');
  onZ(Zb, -440, 440, bh + 44, bh + 134, '#1e1a34', 'rgba(255,226,170,.55)', 2.6);
  { const [sx, sy] = p2(0, bh + 89, Zb); ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 16; ctx.fillStyle = '#ffe9b0'; ctx.font = `900 ${42 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = `${4 * k}px`; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.restore(); ctx.letterSpacing = '0px'; }
  // asphalt and stalls
  { const yb = p2(0, 0, Zb)[1]; ctx.fillStyle = V2.grad(0, yb - 2, 0, H, [[0, '#3a3e66'], [.5, '#22243e'], [1, '#12132a']]); ctx.fillRect(-300, yb - 2, W + 600, H - yb + 320); }
  ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineCap = 'butt';
  for (const x of [-1170, -780, -390, 390, 780, 1170]) { const a = p2(x, 0, 1350), b = p2(x, 0, Zb - 60); ctx.lineWidth = Math.max(2, 9 * kz(1350)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  { const a = p2(-1400, 0, 1350), b = p2(1400, 0, 1350); ctx.lineWidth = Math.max(2, 9 * kz(1350)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // parked cars along the far rows (away from the path) and the lamp posts
  S6.car3(-780, 1720, { color: '#2c8f9a', brake: .1 }); S6.car3(560, 1620, { color: '#5a3b8a', brake: .1, w: 160 }); S6.car3(980, 1800, { color: '#3b4a9a', brake: .1 });
  S6.lampPost(-720, 1300, { on: .5 }); S6.lampPost(LAMP[0], LAMP[1], { h: 540, on: .55 });
  // the skid marks of the burnout
  if (o.c && o.lt >= B('car').s + 1.2) { const t0 = B('car').s; ctx.save(); ctx.strokeStyle = 'rgba(8,8,16,.6)'; ctx.lineWidth = 9 * kz(1180); for (const dz of [-70, 70]) { const a = p2(-110 + 255, 0, 1180 + dz), b2 = p2(o.cp.x + 255 * Math.sin(o.cp.yaw) * -1, 0, o.cp.z + dz); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b2); ctx.stroke(); } ctx.restore(); void t0; }
}

SC_LOT.fx = lt => {
  const sh = SC_LOT.shot(lt), t0 = B('car').s;
  return { bloom: .75, vignette: .55, grain: .05, contrast: .18, sat: .12, tint: [['#3a54c8', .16, 'soft-light'], ['#0a1030', .08, 'multiply']],
    aberr: lt > t0 + 1.3 && lt < t0 + 1.8 ? 6 : 0, fade: Math.max(lt < .2 ? 1 - lt / .2 : 0, seg(lt, CUR.dur - .32, CUR.dur - .02)), fadeColor: '0,0,10' };
};
SC_LOT.blur = lt => { const t0 = B('car').s; return lt > t0 + 1.2 && lt < t0 + 2.3 ? 4 : lt >= t0 && lt < t0 + 1.4 ? 3 : 1; };
SC_LOT.over = function (lt) {
  const b = B, sh = SC_LOT.shot(lt);
  if (sh === 'phone') { const x = lt - b('ph').s; sfxWord(lt, b('ph').s + .2, 'BZZT BZZT', 760, 255, { size: 84, hold: .6, fill: '#ff8ad0', rot: -.05 }); void x; }
  if (sh === 'tapph') sfxWord(lt, b('tap').s + .12, 'TAP!', 840, 300, { size: 130, hold: .5, fill: '#ffe135', rot: .08 });
  if (sh === 'wide') {
    const t0 = b('car').s;
    sfxWord(lt, t0 + .3, 'jingle jingle', 640, 520, { size: 60, hold: .8, fill: '#fff', rot: -.1 });
    sfxWord(lt, t0 + .86, 'HONK!', 330, 340, { size: 140, hold: .5, fill: '#ffe135', rot: .06 });
    sfxWord(lt, t0 + 1.3, 'SCREEEECH', 470, 470, { size: 110, hold: .8, fill: '#ff6a5e', rot: -.05 });
  }
};
SC_LOT.clock = () => '11:00 PM';

window.__EP9_SCENES.exit = SC_EXIT;
window.__EP9_SCENES.lot = SC_LOT;
})();
