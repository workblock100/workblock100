'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back. Scene module: vault (10:55 PM, THE ADMINISTRATOR'S OFFICE). Registers window.__EP11_SCENES.vault.
 * (work in progress: stage 2, the vault action and the gold)
 */
(() => {
if (!window.TIMELINE_EP11) return;
const { person, zoomTo, faceC, drawBg, localOf } = window.H6;
const A7 = window.A7, A9 = window.A9, A11 = window.A11, S10 = window.S10;
const { p2, poly, quad3, grad, radial } = V2;
const { kz } = window.S6;

// ------------------------------------------------------------------ helpers (copies of the Episode 9/10 ones)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z$0-9]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : b[3] === 'in' ? easeIn(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const nbr = o => V2.dof(6, () => drawBg(o));
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const eo = (lt, a, b) => easeOut(seg(lt, a, b));
const lerpA = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const smooth = u => u * u * (3 - 2 * u);
const hex = (a, b, t) => { const c = V2.mix(a, b, clamp(t)); return '#' + [0, 1, 2].map(i => Math.round(c[i]).toString(16).padStart(2, '0')).join(''); };
// aim a hand at a point in scene coordinates: blend from a resting grip (local coordinates) toward it, never beyond the arm's reach
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}

// ------------------------------------------------------------------ layout (world units: X right, Z forward)
const STRAW_AT = [-250, 1040];      // where she stands (the Episode 10 spot)
const BASE = { f: 1400, cy: 400, hy: 860, cz: -100 };
const HIGH = { f: 1400, cy: 580, hy: 800, cz: -100 };   // a camera above her cap: the vault circle is never overlapped by her head
const SHIFT = -350;                 // how far the Administrator's throne rolls along the back of the desk (X 330 to -20)
const RC = { x: -355, y: 449, z: 1742 };   // the vault's mouth (the recess in the set)

// ------------------------------------------------------------------ the beats' clock (scene-local seconds), every time tied to a beat or a spoken word
function K() {
  const V = B('vault').s, M = B('moth').s, a4 = B('a4'), s4 = B('s4');
  return {
    V, M, freeze: wordT('s3', 'agency', 11.6),
    roll0: 11.84, roll1: 12.56,                        // the throne rolls to the portrait
    reach: 12.46, port0: V - .15, port1: V + .26,      // his hand finds the portrait's edge, the portrait swings open
    flick: V + .0, spin0: V + .20, spin1: V + .90,     // he flicks the wheel; the clatter cue is at V + .20
    bolt0: V + .34, bolt1: V + .56, door0: V + .36, door1: V + 1.62,   // the rumble cue is at V + .35
    ching: V + 1.0, sparkle: V + 1.3,
    back0: a4.e + .06, back1: s4.s + .5,               // the throne rolls home while the camera is on Strawberry
  };
}
function chairShift(lt, k) {
  if (lt < k.roll0) return 0;
  if (lt < k.back0) return SHIFT * sk(lt, k.roll0, k.roll1);
  return SHIFT * (1 - sk(lt, k.back0, k.back1));
}
const portraitOpen = (lt, k) => eo(lt, k.port0, k.port1);
const doorOpen = (lt, k) => sk(lt, k.door0, k.door1);
const boltsAt = (lt, k) => 1 - eo(lt, k.bolt0, k.bolt1);
const wheelAt = (lt, k) => TAU * 3.2 * eo(lt, k.spin0, k.spin1);
// the gold: 0 before the door cracks, 1 at the peak, settling to a steady glow
const gold = (lt, k) => smooth(seg(lt, k.door0 + .1, k.door0 + 1.0)) * (1 - .42 * seg(lt, k.V + 2.6, k.V + 4.4));

// ------------------------------------------------------------------ shots
const SHOTS = () => {
  const b = id => B(id);
  return [['screen', 1.0], ['wide', 2.32], ['two', 2.8], ['inv1', 4.18], ['cuS1', 5.08], ['inv2', 6.93], ['two2', 7.3], ['inv3', 9.12], ['cuA3', 10.82], ['cuS3', 11.52], ['cuA3b', 11.84],
    ['trk', b('vault').s + .12], ['vault', b('a4').s - .1], ['cuA4', 16.7], ['cuS4', 18.22], ['cuA5', 19.3], ['purse', 20.28], ['wideE', 1e9]];
};
const shotOf = lt => { let t0 = 0; for (const [n, e] of SHOTS()) { if (lt < e) return { n, t0, t1: Math.min(e, CUR.dur) }; t0 = e; } return { n: 'wideE', t0, t1: CUR.dur }; };

// ------------------------------------------------------------------ gold: coins, bars and the heap (every one a pure function of time)
const GRAV = 2000;
const ART = {};
const cA = (key, w, h, sc, fn) => S10.art(key, w, h, sc, fn);
// a coin face-on: a thick rim (the dark lower edge gives it a body when it is squashed), a bevelled face, an embossed mark
const COIN_COL = [['#fff8c4', '#ffd84e', '#cc8c10', '#6e4204'], ['#fff0a0', '#f2c238', '#b87a0c', '#5e3602'], ['#ffe27a', '#dca824', '#9c640a', '#4e2c00'], ['#ffffe0', '#ffe66a', '#e0a21c', '#7a4a06']];
function coinSpr(i) {
  return cA('coin11_' + i, 40, 40, 2, () => {
    const [c0, c1, c2, c3] = COIN_COL[i];
    ctx.fillStyle = c3; ell(20, 22.6, 17, 17); ctx.fill();
    ctx.fillStyle = V2.radial(14, 13, 1.5, 21, [[0, c0], [.5, c1], [1, c2]]); ell(20, 20, 17, 17); ctx.fill();
    ctx.strokeStyle = c3; ctx.lineWidth = 1.6; ell(20, 20, 17, 17); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,226,.6)'; ctx.lineWidth = 1.5; ell(20, 20, 14, 14); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,64,0,.45)'; ctx.lineWidth = 1.3; ell(20, 20, 10.4, 10.4); ctx.stroke();
    text('$', 20, 20.6, { size: 13, fill: 'rgba(130,80,4,.62)', weight: 900 });
    ctx.fillStyle = 'rgba(255,255,255,.62)'; ell(13.2, 12.4, 5.2, 2.4, -.7); ctx.fill();
  });
}
// a gold bar: a front face, a lit top face, a stamp
function barSpr(i) {
  return cA('bar11_' + i, 84, 48, 2, () => {
    const dk = i ? 0 : 0;
    void dk;
    ctx.fillStyle = V2.grad(0, 22, 0, 44, [[0, '#f6c83e'], [.5, '#d49a1a'], [1, '#8c5a08']]); ctx.strokeStyle = '#4e2c00'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(6, 22); ctx.lineTo(78, 22); ctx.lineTo(82, 41); ctx.quadraticCurveTo(82, 44, 78, 44); ctx.lineTo(8, 44); ctx.quadraticCurveTo(4, 44, 4, 41); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = V2.grad(0, 6, 0, 22, [[0, '#fff2a6'], [1, '#f2c640']]);
    ctx.beginPath(); ctx.moveTo(16, 6); ctx.lineTo(68, 6); ctx.lineTo(78, 22); ctx.lineTo(6, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(20, 9); ctx.lineTo(48, 9); ctx.lineTo(44, 14); ctx.lineTo(16, 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(110,64,0,.55)'; ctx.lineWidth = 1.5; rr(18, 27, 48, 12, 3); ctx.stroke();
    text('999', 42, 33.4, { size: 10, fill: 'rgba(110,64,0,.75)', weight: 900, spacing: 1 });
  });
}
// a four-point glint with a soft core, for the sparkle on the gold
function glintSpr() {
  return cA('glint11', 64, 64, 2, () => {
    const g = V2.radial(32, 32, 0, 30, [[0, 'rgba(255,255,236,1)'], [.18, 'rgba(255,240,170,.75)'], [1, 'rgba(255,214,90,0)']]); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = 'rgba(255,255,240,.95)';
    for (const [dx, dy, L, w] of [[1, 0, 31, 2.6], [0, 1, 31, 2.6], [.7071, .7071, 18, 1.6], [-.7071, .7071, 18, 1.6]]) {
      ctx.save(); ctx.translate(32, 32); ctx.rotate(Math.atan2(dy, dx)); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(-L * .2, w * .5, 0, w); ctx.quadraticCurveTo(L * .2, w * .5, L, 0); ctx.quadraticCurveTo(L * .2, -w * .5, 0, -w); ctx.quadraticCurveTo(-L * .2, -w * .5, -L, 0); ctx.fill(); ctx.restore();
    }
  });
}
function blobSpr() {
  return cA('blob11', 64, 64, 2, () => { ctx.fillStyle = V2.radial(32, 32, 0, 32, [[0, 'rgba(255,226,140,.9)'], [.5, 'rgba(255,200,90,.35)'], [1, 'rgba(255,190,70,0)']]); ctx.fillRect(0, 0, 64, 64); });
}

let COINS = null;
function coinsInit() {
  if (COINS) return COINS;
  const list = [];
  const R = (i, n) => hash(i * 7.31 + n * 31.17 + 2.9);
  // the flood: coins that fly out of the door, bounce, spin and slide across the carpet (offsets in seconds after the vault beat starts)
  for (let i = 0; i < 118; i++) {
    const a = R(i, 1) * TAU, d = Math.sqrt(R(i, 2)) * 78;
    list.push({ type: 'slide', t0: .52 + Math.pow(R(i, 3), 1.5) * 1.5, x0: RC.x + Math.cos(a) * d, y0: RC.y + Math.sin(a) * d * .85, z0: RC.z - 4,
      vx: (R(i, 4) - .5) * 330 + Math.cos(a) * 70, vy: (R(i, 5) - .3) * 150, vz: -(140 + Math.pow(R(i, 6), 2.3) * 760),
      e: .3 + R(i, 7) * .16, mu: .72 + R(i, 8) * .1, lam: 2.4 + R(i, 9) * 1.8, rad: 11 + R(i, 10) * 4.5, w: 7 + R(i, 11) * 15, ph: R(i, 12) * TAU, spr: (R(i, 13) * 4) | 0, gl: R(i, 14), rest: .34 + R(i, 15) * .16, rot: (R(i, 16) - .5) * 6 });
  }
  // the heap under the door: rows of coins that arc from the mouth to their slot
  let n = 0;
  for (let row = 0; row < 9; row++) {
    const half = 178 * Math.pow(1 - row / 10.5, .9), cnt = Math.max(2, Math.round(half * 2 / 25));
    for (let j = 0; j < cnt; j++, n++) {
      const slotX = -338 + ((j + .5) / cnt * 2 - 1) * half + (R(n, 20) - .5) * 12, slotY = 3 + row * 10.5 + R(n, 21) * 4, slotZ = 1676 + R(n, 22) * 52 - row * 3;
      list.push({ type: 'heap', t0: .55 + row * .15 + R(n, 23) * .34, dur: .5 + R(n, 24) * .28, x0: RC.x + (R(n, 25) - .5) * 120, y0: RC.y + (R(n, 26) - .5) * 100, z0: RC.z - 4, xs: slotX, ys: slotY, zs: slotZ,
        rad: 12 + R(n, 27) * 4, ph: R(n, 28) * TAU, w: 9 + R(n, 29) * 16, spr: (R(n, 30) * 4) | 0, gl: R(n, 31), rest: .3 + R(n, 32) * .5, rot: (R(n, 33) - .5) * 1.4 });
    }
  }
  // bars: a few slide out, the rest fill the heap
  for (let i = 0; i < 12; i++) {
    const heap = i < 8;
    list.push({ type: heap ? 'bar' : 'barslide', t0: .6 + i * .13, dur: .62, x0: RC.x + (R(i, 40) - .5) * 80, y0: RC.y + (R(i, 41) - .5) * 70, z0: RC.z - 4,
      xs: -338 + (R(i, 42) - .5) * 250, ys: 9 + (i % 3) * 13, zs: 1690 + R(i, 43) * 34, vx: (R(i, 44) - .5) * 160, vz: -(160 + R(i, 45) * 340), e: .26, mu: .6, lam: 3.4,
      rad: 17, w: 6 + R(i, 46) * 6, ph: R(i, 47) * TAU, spr: 0, gl: R(i, 48), rest: 1, rot: (R(i, 49) - .5) * .8 });
  }
  COINS = list;
  return list;
}
// the state of one coin at scene time lt: {x, y, z, asp, rot, air, flash}
function coinState(c, lt, V) {
  const tau = lt - (V + c.t0);
  if (tau < 0) return null;
  let x, y, z, air = true, asp, rot = c.rot + c.w * .05 * tau;
  if (c.type === 'heap' || c.type === 'bar') {
    const D = c.dur, u = Math.min(1, tau / D), vy = (c.ys - c.y0 + .5 * GRAV * D * D) / D;
    x = lerp(c.x0, c.xs, u); z = lerp(c.z0, c.zs, u); y = c.type === 'bar' && tau >= D ? c.ys : c.y0 + vy * Math.min(tau, D) - .5 * GRAV * Math.min(tau, D) ** 2;
    if (u >= 1) { air = false; y = c.ys; }
    const th = c.ph + c.w * (D - Math.min(tau, D)) * 1.6;
    asp = lerp(Math.abs(Math.cos(th)) * .85 + .12, c.rest, smooth(seg(tau, D - .18, D)));
    rot = c.rot + (1 - u) * c.w * .35 * (c.type === 'bar' ? .5 : 1);
  } else {
    // free flight to the floor, then a few bounces that lose speed, then a slide with friction
    const t1 = (c.vy + Math.sqrt(c.vy * c.vy + 2 * GRAV * c.y0)) / GRAV;
    if (tau < t1) { x = c.x0 + c.vx * tau; z = c.z0 + c.vz * tau; y = c.y0 + c.vy * tau - .5 * GRAV * tau * tau; }
    else {
      let xh = c.x0 + c.vx * t1, zh = c.z0 + c.vz * t1, vxh = c.vx * c.mu, vzh = c.vz * c.mu, v = (GRAV * t1 - c.vy) * c.e, tt = tau - t1; y = 0; air = false;
      let done = false;
      for (let b = 0; b < 5 && !done; b++) {
        const f = 2 * v / GRAV;
        if (tt < f) { x = xh + vxh * tt; z = zh + vzh * tt; y = v * tt - .5 * GRAV * tt * tt; air = true; done = true; }
        else { tt -= f; xh += vxh * f; zh += vzh * f; v *= c.e; vxh *= c.mu; vzh *= c.mu; }
      }
      if (!done) { const ex = 1 - Math.exp(-c.lam * tt); x = xh + vxh / c.lam * ex; z = zh + vzh / c.lam * ex; y = 0; air = false; rot += c.w * .05 * Math.min(tt, 1.2) * Math.exp(-tt * 2); }
    }
    const th = c.ph + c.w * Math.min(tau, t1 + .9) * 1.15, flat = smooth(seg(tau, t1 + .15, t1 + 1.1));
    asp = lerp(Math.abs(Math.cos(th)) * .88 + .1, c.rest, flat);
  }
  if (c.type === 'barslide' && !air) asp = 1;
  if (c.type === 'bar' || c.type === 'barslide') asp = Math.max(.55, asp);
  return { x, y: Math.max(y, 1.2), z, asp, rot, air, flash: 0 };
}
// every active coin sorted far to near, with its screen position; drawn in depth passes between the characters
function coinFrame(lt, V) {
  const out = [];
  for (const c of coinsInit()) { const s = coinState(c, lt, V); if (s) { s.c = c; out.push(s); } }
  out.sort((a, b) => b.z - a.z);
  return out;
}
function drawCoins(list, zLo, zHi, lt, g) {
  for (const s of list) {
    if (s.z < zLo || s.z >= zHi) continue;
    const c = s.c, k = kz(s.z), [sx, sy] = p2(s.x, s.y, s.z), bar = c.type === 'bar' || c.type === 'barslide', Rr = c.rad * k;
    if (s.y < 70) { const sh = (1 - s.y / 70) * .38; ctx.fillStyle = `rgba(24,12,0,${sh})`; ell(sx + 3 * k, sy + 1.5 * k, Rr * (bar ? 1.5 : 1.05), Rr * (bar ? .32 : .3)); ctx.fill(); }
    ctx.save(); ctx.translate(sx, sy - (bar ? 0 : Rr * .1)); ctx.rotate(s.rot);
    if (bar) { ctx.scale(1, s.asp); const q = barSpr(0), w = Rr * 3.4; ctx.drawImage(q, -w / 2, -w * .29, w, w * .571); }
    else { ctx.scale(1, s.asp); const q = coinSpr(c.spr), w = Rr * 2.36; ctx.drawImage(q, -w / 2, -w / 2, w, w); }
    ctx.restore();
  }
}
// a mound of dark gold under the heap so the coins never show the carpet through their gaps: it grows as the coins arrive
function drawMound(lt, V, off) {
  const grow = smooth(seg(lt, V + .7, V + 2.6)); if (grow <= .01) return;
  const k = kz(1700), cx = -338, H = 96 * grow, W = 196 * (.6 + .4 * grow);
  const a = p2(cx - W, 0, 1712), b = p2(cx + W, 0, 1712), t = p2(cx, H, 1712), kk = k;
  ctx.save(); ctx.fillStyle = grad(0, t[1], 0, a[1], [[0, '#d9a030'], [.5, '#a8700e'], [1, '#5a3604']]);
  ctx.beginPath(); ctx.moveTo(a[0], a[1] + 6 * kk); ctx.quadraticCurveTo(a[0] + (t[0] - a[0]) * .5, t[1] + 8 * kk, t[0], t[1]); ctx.quadraticCurveTo(b[0] - (b[0] - t[0]) * .5, t[1] + 8 * kk, b[0], b[1] + 6 * kk); ctx.closePath(); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ the vault's inside: a wall of bars, heaps of coins, a hot glow (painted once; the glints move)
function vaultArt() {
  return cA('vaultin11', 200, 200, 2, (w, h) => {
    ctx.fillStyle = V2.radial(100, 104, 2, 150, [[0, '#fffbe2'], [.22, '#ffe88c'], [.58, '#e8aa22'], [1, '#6e4208']]); ctx.fillRect(0, 0, w, h);
    // rows of bars, staggered, brightest toward the middle of the chamber
    for (let r = 0; r < 9; r++) {
      const y = -6 + r * 24, off = (r % 2) * 20;
      for (let c = -1; c < 7; c++) {
        const x = c * 40 + off - 8, lum = 1 - Math.min(1, Math.hypot(x + 18 - 100, y + 9 - 100) / 150);
        ctx.fillStyle = V2.grad(0, y, 0, y + 20, [[0, hex('#fff0a0', '#c88a14', 1 - lum * .8)], [.55, hex('#f0c032', '#9c640a', 1 - lum * .8)], [1, hex('#a8740c', '#4e2c00', 1 - lum * .6)]]);
        ctx.strokeStyle = 'rgba(70,40,0,.7)'; ctx.lineWidth = 1.4; rr(x, y, 36, 19, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(255,252,210,${.18 + .4 * lum})`; rr(x + 3, y + 2, 24, 3.4, 1.4); ctx.fill();
      }
    }
    // coin heaps at the foot of the chamber
    for (const [hx, hw] of [[56, 70], [150, 64]]) for (let i = 0; i < 34; i++) {
      const u = hash(i * 3.1 + hx) , v = hash(i * 5.3 + hx + 9), x = hx + (u - .5) * hw * (1 - v * .7), y = 188 - v * 50;
      ctx.fillStyle = V2.radial(x - 2, y - 2, 1, 11, [[0, '#fff4b0'], [.6, '#f0c030'], [1, '#a8700c']]); ctx.strokeStyle = 'rgba(80,44,0,.65)'; ctx.lineWidth = 1.2; ell(x, y, 11, 5.6, (hash(i + hx) - .5) * .5); ctx.fill(); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(100, 100, 0, 86, [[0, 'rgba(255,255,236,.95)'], [.4, 'rgba(255,236,150,.45)'], [1, 'rgba(255,220,110,0)']]); ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = V2.radial(100, 100, 74, 108, [[0, 'rgba(60,32,0,0)'], [1, 'rgba(60,32,0,.62)']]); ctx.fillRect(0, 0, w, h);
  });
}
// the painted chamber, clipped to the opening by the set; glints crawl over it
function vaultInside(c, lt, k) {
  const q = vaultArt();
  ctx.drawImage(q, c.x - c.r * 1.06, c.y - c.r * 1.06, c.r * 2.12, c.r * 2.12);
  const gl = glintSpr(), u = lt;
  for (let i = 0; i < 7; i++) {
    const a = Math.pow(Math.max(0, Math.sin(u * (2.4 + hash(i) * 2) + i * 2.3)), 14);
    if (a < .05) continue;
    const x = c.x + (hash(i * 3 + 1) - .5) * c.r * 1.3, y = c.y + (hash(i * 3 + 2) - .5) * c.r * 1.1, s = c.r * (.34 + .3 * a);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(gl, x - s, y - s, s * 2, s * 2); ctx.restore();
  }
  V2.emit(c.x, c.y, c.r * 1.8, '255,220,120', .9);
}

// ------------------------------------------------------------------ gold light on the wall: halo, god rays, drifting reflections
function goldWall(lt, off, g, k) {
  if (g <= .01) return;
  const [cx, cy] = off.at.recess(), kk = kz(off.layout.zb);
  V2.glow(cx, cy, 560 * kk * 1.4, '255,214,110', .7 * g, 'screen', .9);
  V2.glow(cx, cy, 220 * kk * 1.4, '255,244,200', .9 * g, 'screen', .8);
  // the god rays: a fan of beams from the opening into the room, breathing slowly
  const rays = [[8, 1100, 70, 330, .13], [24, 1500, 60, 280, .2], [40, 1700, 54, 250, .26], [54, 1650, 50, 240, .24], [68, 1450, 56, 260, .2], [84, 1150, 62, 300, .14], [-8, 900, 60, 300, .09]];
  rays.forEach(([deg, L, w0, w1, a], i) => {
    const th = deg * PI / 180 + .03 * Math.sin(lt * .8 + i * 1.7), br = .72 + .28 * Math.sin(lt * 1.9 + i * 2.3);
    V2.beam(cx, cy, cx + Math.cos(th) * L, cy + Math.sin(th) * L, w0, w1, '255,222,140', a * g * br);
  });
  // reflections dancing on the plaster
  const bl = blobSpr();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const ang = i * 2.399 + lt * (.18 + hash(i) * .2), rad = (130 + 520 * hash(i + 4)) * (.75 + .25 * Math.sin(lt * .7 + i)), x = cx + Math.cos(ang) * rad * 1.15, y = cy + Math.sin(ang) * rad * .75, s = (50 + 70 * hash(i + 9)) * (.8 + .2 * Math.sin(lt * 2.4 + i * 1.3));
    ctx.globalAlpha = (.16 + .14 * Math.sin(lt * 2.9 + i * 2)) * g;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.drawImage(bl, -s * 1.6, -s * .7, s * 3.2, s * 1.4); ctx.restore();
  }
  ctx.restore();
}
// the carpet's share of the gold: a flat pool in front of the heap
function goldFloor(lt, g) {
  if (g <= .01) return;
  const [x, y] = p2(RC.x + 30, 0, 1500), kk = kz(1500);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, y); ctx.scale(1, .3);
  ctx.fillStyle = radial(0, 0, 0, 900 * kk, [[0, `rgba(255,216,110,${.5 * g})`], [.5, `rgba(255,190,80,${.2 * g})`], [1, 'rgba(255,180,60,0)']]); ctx.beginPath(); ctx.arc(0, 0, 900 * kk, 0, TAU); ctx.fill(); ctx.restore();
}
// sparkles on the coins: glints that flash at their own rhythm, and a burst on the sparkle cue
function goldGlints(list, lt, k, g) {
  if (g <= .01) return;
  const gl = glintSpr(), burst = lt >= k.sparkle ? Math.exp(-(lt - k.sparkle) * 2.6) : 0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  let n = 0;
  for (const s of list) {
    if (s.air && s.y > 120) continue;
    const c = s.c, ph = lt * (2.2 + c.gl * 2) + c.ph, a = Math.pow(Math.max(0, Math.sin(ph)), 20) * (.7 + .3 * g) + (c.gl > .55 ? burst * Math.pow(Math.max(0, Math.sin(ph * 3 + 1.3)), 2) : 0);
    if (a < .12) continue;
    const kz0 = kz(s.z), [sx, sy] = p2(s.x, s.y + 8, s.z), sz = (22 + 40 * a) * kz0 * (c.type === 'bar' ? 1.5 : 1);
    ctx.globalAlpha = Math.min(1, a); ctx.drawImage(gl, sx - sz, sy - sz, sz * 2, sz * 2);
    if (++n > 36) break;
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the office options, the cast
function officeOpts(lt) {
  const k = K();
  return { night: true, t: lt + 3, lampOn: 1, chairShift: chairShift(lt, k), paintingOpen: portraitOpen(lt, k), vaultOpen: doorOpen(lt, k), vaultBolts: boltsAt(lt, k), wheelRot: wheelAt(lt, k), vaultDraw: c => vaultInside(c, lt, k) };
}
function cast(lt) {
  const k = K(), off = S10.office(officeOpts(lt)), b = id => B(id), g = gold(lt, k);
  // ---- the Administrator, seated on his throne (which rolls); the set seats him on the shifted chair
  const rollU = seg(lt, k.roll0, k.roll1), rock = lt < k.back0 ? Math.sin(rollU * TAU) * .09 * (rollU > 0 && rollU < 1 ? 1 : 0) : 0;
  const ad = off.admin({ look: [-.8, 0], expr: 'happy', arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {}, hand: {}, rot: rock, sx: 1 + .03 * Math.sin(rollU * PI) });
  // acting
  if (lt >= k.freeze - .02 && lt < k.roll0) { ad.expr = 'neutral'; ad.look = [-.25, 0]; ad.browUp = 7; ad.shake = 1.4; }
  if (lt >= k.roll0 && lt < k.V + .5) { ad.expr = 'sour'; ad.look = [-.9, -.2]; ad.lid = .25; }
  // the left hand: to the portrait's edge, pulling it open, then a flick at the wheel's knob
  const P = off.layout.portrait, zp = off.layout.zb - 7, ang = portraitOpen(lt, k) * 1.95;
  const edge = p2(P.x0 + P.w * Math.cos(ang), P.y0 + 150, zp - P.w * Math.sin(ang));
  const wr = wheelAt(lt, k), knob = p2(RC.x + 52 * Math.cos(wr), RC.y + 52 * Math.sin(wr), off.layout.zb - 2);
  const rest = [-130, 60];
  if (lt >= k.reach && lt < k.flick) handTo(ad, -1, edge[0], edge[1], sk(lt, k.reach, k.reach + .16) * (1 - sk(lt, k.flick - .22, k.flick - .1)), rest);
  if (lt >= k.flick - .12 && lt < k.V + .5) { const kn = p2(RC.x + 52, RC.y + 6, off.layout.zb - 2); handTo(ad, -1, lerp(edge[0], kn[0], sk(lt, k.flick - .12, k.flick + .06)), lerp(edge[1], kn[1], sk(lt, k.flick - .12, k.flick + .06)), sk(lt, k.flick - .12, k.flick + .04) * (1 - sk(lt, k.spin0 + .05, k.spin0 + .25)), rest); void knob; }
  if (ad.arms && ad.arms.l === 'hold') ad.hand = { l: 'grip' };
  // ---- Strawberry
  const sp = person(A11.straw, route([[0, STRAW_AT[0], STRAW_AT[1]]]), lt, { id: 'straw', who: 'straw', expr: 'dead', lid: .4, look: [.8, 0], arms: { l: 'rest', r: 'rest' }, acc: ['steth', 'bandage7', 'perdiem9'] });
  void b; void g;
  return { off, ad, sp, k, g };
}

// ------------------------------------------------------------------ light: the night office, turning gold
function lightFor(C, who) {
  const { off, g } = C, base = off.lightPreset, gc = '#ffd070';
  off.setLight({
    key: [lerp(base.key[0], -.78, g), lerp(base.key[1], -.12, g)], keyColor: hex(base.keyColor, gc, g * .9), keyA: lerp(base.keyA, .42, g),
    rim: hex(base.rim, '#ffbc4a', g), rimA: lerp(base.rimA, .72, g), bounce: hex(base.bounce, '#ffc860', g), bounceA: lerp(base.bounceA, .3, g),
    back: who === 'ad' && g > .05 ? { color: '255,214,120', a: .55 * g, w: 18 } : null, frontDark: who === 'ad' ? .22 * g : 0,
  });
  if (g > .01) { const [x, y] = off.at.recess(); V2.addLight({ x, y, r: 1500, color: '255,196,84', a: .85 * g }); }
}

// ------------------------------------------------------------------ the scene
const CARD = { screen: '#223', inv1: '#322', inv2: '#232', inv3: '#223' };
const SC = {
  shot: lt => shotOf(lt).n,
  cam(lt) {
    const sh = shotOf(lt), n = sh.n, k = seg(lt, sh.t0, sh.t1), KK = K();
    const F = (o, z, up = 110) => { const [fx, fy] = faceC(o); zoomTo(fx, fy + up / z, z); };
    if (CARD[n]) { V2.setCam(BASE); zoomTo(540, 960, 1); return; }
    switch (n) {
      case 'wide': V2.setCam(Object.assign({}, BASE, { cy: 420, hy: 900, cz: lerp(-640, -560, k) })); zoomTo(540, 1050, 1.1); break;
      case 'two': case 'two2': { V2.setCam(BASE); const C = cast(lt), a = faceC(C.ad), s = faceC(C.sp); zoomTo((a[0] + s[0]) / 2, (a[1] + s[1]) / 2 + 80, 1.3); } break;
      case 'cuS1': case 'cuS3': case 'cuS4': { V2.setCam(BASE); const C = cast(lt); F(C.sp, lerp(1.85, 1.95, k), 130); } break;
      case 'cuA3': case 'cuA3b': case 'cuA4': case 'cuA5': { V2.setCam(BASE); const C = cast(lt); F(C.ad, lerp(1.7, 1.8, k), 130); } break;
      case 'trk': {
        V2.setCam(HIGH); const C = cast(lt), a = faceC(C.ad), u = sk(lt, sh.t0, KK.roll1 + .1);
        zoomTo(lerp(a[0] - 40, 440, u), lerp(a[1] + 40, 940, u), lerp(1.5, 1.75, u));
      } break;
      case 'vault': {
        const u = sk(lt, KK.V + .85, KK.V + 2.0);
        V2.setCam(Object.assign({}, HIGH, { cz: lerp(-100, -330, u) }));
        const A = p2(-120, 380, 1500), z = lerp(1.75, 1.0, u);
        zoomTo(lerp(430, A[0] - 20, u), lerp(930, A[1] + 120, u), z);
      } break;
      default: V2.setCam(Object.assign({}, BASE, { cy: 420, hy: 900, cz: -560 })); zoomTo(540, 1050, 1.1);
    }
  },
  draw(lt) {
    const n = shotOf(lt).n;
    if (CARD[n]) { ctx.fillStyle = CARD[n]; ctx.fillRect(0, 0, W, H); text(n, 540, 900, { size: 90, font: 'Bangers', weight: 400 }); return; }
    const C = cast(lt), off = C.off, k = C.k, g = C.g, V = k.V;
    const coins = g > 0 || lt > V ? coinFrame(lt, V) : [];
    lightFor(C, 'sp');
    V2.dof(0, () => { off.back(); off.sunFloor(); goldWall(lt, off, g, k); drawMound(lt, V, off); drawCoins(coins, 1580, 1e9, lt, g); });
    lightFor(C, 'ad'); drawChar(C.ad);
    drawCoins(coins, 1184, 1580, lt, g);
    off.desk();
    drawCoins(coins, 1010, 1184, lt, g);
    lightFor(C, 'sp'); off.visitor('back'); drawChar(C.sp); off.visitor('front');
    drawCoins(coins, -1e9, 1010, lt, g);
    goldFloor(lt, g);
    goldGlints(coins, lt, k, g);
  },
  fx(lt) {
    const k = K(), g = gold(lt, k);
    return { bloom: .5 + .5 * g, vignette: .45, grain: .045, contrast: .14, sat: .1, tint: [['#9fb4ff', .08 * (1 - g), 'soft-light'], ['#ffc860', .3 * g, 'soft-light']], fade: Math.max(lt < .2 ? 1 - lt / .2 : 0, seg(lt, CUR.dur - .25, CUR.dur - .02)), fadeColor: '0,0,10' };
  },
  blur: lt => { const k = K(); return lt > k.V && lt < k.V + 2.4 ? 4 : 1; },
  over() {},
};
window.__EP11_SCENES = window.__EP11_SCENES || {};
window.__EP11_SCENES.vault = SC;
})();
