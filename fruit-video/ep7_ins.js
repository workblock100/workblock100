'use strict';
/* Episode 7 inserts: full-frame close-ups. The bingo cage, a numbered ball dropping out of it, the thermometer, the water pitcher, the sock.
 * Each is a pure function of its own time `lt` (seconds since the insert began) and draws the whole 1080x1920 picture. */
(() => {
const A = window.A7, A6 = window.A6;
const COL = { B: ['#6aa6ff', '#2a62d0', '#143a8a'], I: ['#ff8a96', '#e0283c', '#8a1020'], N: ['#fff08a', '#f0c010', '#a07800'], G: ['#7ee8a6', '#20b060', '#106038'], O: ['#d6a0ff', '#8a40d8', '#4a1a8a'] };
const colOf = n => 'BINGO'[Math.min(4, Math.floor((n - 1) / 15))];

// a numbered ball: colored sphere, a white disc with the letter over the number
function ball(x, y, r, n, o = {}) {
  const L = colOf(n), c = COL[L], rot = o.rot ?? 0, sq = o.squash ?? 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(1 + sq * .3, 1 - sq * .3);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; if (o.shadow !== false) { ctx.save(); ctx.translate(r * .1, r * 1.02); ctx.scale(1, .16); ctx.beginPath(); ctx.arc(0, 0, r * .95, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = V2.radial(-r * .35, -r * .4, r * .08, r * 1.1, [[0, c[0]], [.55, c[1]], [1, c[2]]]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(20,14,30,.85)'; ctx.lineWidth = Math.max(2, r * .035); ctx.stroke();
  ctx.save(); ctx.rotate(rot * .2);
  ctx.fillStyle = V2.grad(-r * .6, -r * .6, r * .6, r * .6, [[0, '#ffffff'], [1, '#e2e2ee']]); ctx.beginPath(); ctx.arc(0, 0, r * .6, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(20,14,30,.35)'; ctx.lineWidth = Math.max(1.5, r * .02); ctx.stroke();
  ctx.restore();
  if (r > 40) { text(L, 0, -r * .26, { size: r * .5, font: 'Bangers', weight: 400, fill: c[1], spacing: 2 }); text(String(n), 0, r * .2, { size: r * (n > 9 ? .62 : .78), font: 'Bangers', weight: 400, fill: '#1b1630', spacing: 1 }); }
  else text(String(n), 0, 2, { size: r * .78, font: 'Bangers', weight: 400, fill: '#1b1630' });
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(-r * .45, -r * .55, r * .22, r * .11, -.7); ctx.fill();
  ctx.restore();
}
A.ball = ball;

// the cage itself: a wire sphere with balls tumbling inside and a crank on the right turning with it (drawn at any size; no stand)
A.drawCage = (cx, cy, R, lt, o = {}) => {
  const spin = (o.spin ?? 1) * lt * 2.6, nb = o.balls ?? 26, br = R * .12;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 6, 0, TAU); ctx.clip();
  ctx.fillStyle = V2.radial(cx - R * .25, cy - R * .3, R * .1, R, [[0, 'rgba(255,255,255,.10)'], [1, 'rgba(120,140,200,.16)']]); ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  for (let i = 0; i < nb; i++) {
    const w = (1.1 + hash(i + 3) * 1.6) * (o.spin ?? 1), th = w * lt * (i % 2 ? 1 : -1) + hash(i) * TAU, rad = (.2 + .68 * hash(i + 7)) * (R - br * 1.4), bx = cx + Math.cos(th) * rad * (.95 + .08 * Math.sin(lt * 5 + i)), by = cy + Math.sin(th) * rad * .9 + R * .12 + R * .05 * Math.sin(lt * 7 + i * 2);
    ball(bx, by, br, 1 + (i * 3) % 75, { rot: th, shadow: false });
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(214,220,232,.95)'; ctx.lineWidth = Math.max(2, R * .024); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  ctx.lineWidth = Math.max(1.6, R * .018);
  for (let i = 0; i < 4; i++) { const ry = R * Math.abs(Math.cos(spin + i * PI / 4)); ctx.beginPath(); ctx.ellipse(cx, cy, R, Math.max(2, ry), 0, 0, TAU); ctx.stroke(); }
  ctx.lineWidth = Math.max(1.4, R * .015); for (const dx of [-.55, 0, .55]) { const rx = R * Math.sqrt(1 - dx * dx); ctx.beginPath(); ctx.ellipse(cx + dx * R * .2, cy, Math.max(2, R * .22 * Math.abs(Math.sin(spin * .5 + dx))), rx * .98, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = V2.radial(cx - R * .4, cy - R * .5, 2, R * .5, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.arc(cx - R * .4, cy - R * .5, R * .5, 0, TAU); ctx.fill();
  const kx = cx + R + R * .2, kr = R * .29;
  ctx.strokeStyle = '#8a929e'; ctx.lineWidth = Math.max(3, R * .042); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + R, cy); ctx.lineTo(kx, cy); ctx.stroke();
  ctx.strokeStyle = '#c6ccd6'; ctx.lineWidth = Math.max(3, R * .036); ctx.beginPath(); ctx.moveTo(kx, cy); ctx.lineTo(kx + Math.cos(spin) * kr * .72, cy + Math.sin(spin) * kr * .72); ctx.stroke();
  ctx.fillStyle = '#ff5a6a'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = Math.max(2, R * .012); ctx.beginPath(); ctx.arc(kx + Math.cos(spin) * kr * .72, cy + Math.sin(spin) * kr * .72, R * .07, 0, TAU); ctx.fill(); ctx.stroke();
};
// the full-frame insert: the cage on its stand
A.insCage = (lt, o = {}) => {
  A6.bokeh(lt, ['255,200,120', '120,180,255', '255,120,190'], ['#1d1a3e', '#2f2a5e']);
  const cx = 540, cy = 780, R = 330, easeIn2 = easeOut(clamp(lt / .35));
  ctx.save(); ctx.translate(0, (1 - easeIn2) * 80); ctx.globalAlpha *= clamp(lt * 5);
  ctx.fillStyle = '#8a5a34'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 5; rr(cx - R - 150, cy + R + 108, 2 * R + 300, 54, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, cy, 0, cy + R + 110, [[0, '#b0b8c4'], [1, '#6a7280']]);
  for (const sx of [-1, 1]) { rr(cx + sx * (R + 66) - 16, cy - 20, 32, R + 130, 8); ctx.fill(); ctx.stroke(); }
  A.drawCage(cx, cy, R, lt, o);
  ctx.restore();
  V2.glow(cx, cy, R * 1.4, '255,230,170', .12, 'screen', .3);
};

// a ball drops out of the chute, bounces twice on the felt and settles, number up. n: the number called
A.insBall = (lt, n, o = {}) => {
  A6.bokeh(lt, ['255,200,120', '120,180,255', '255,120,190'], ['#14122e', '#26204f']);
  const L = colOf(n), c = COL[L], R = 215, gy = 1010, cx = 540;
  // the felt
  ctx.fillStyle = V2.grad(0, gy - 20, 0, 1500, [[0, '#1f7a52'], [1, '#0d3f2c']]); ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, gy, W, 6);
  // the chute: a clear tube coming in from the top left, ending above the felt
  const k1 = clamp(lt / .26), k2 = lt - .26;
  ctx.save(); ctx.strokeStyle = 'rgba(190,225,255,.5)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-40, 330); ctx.quadraticCurveTo(300, 420, 360, 520); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, 310); ctx.quadraticCurveTo(300, 400, 350, 500); ctx.stroke(); ctx.restore();
  // path: down the chute, then a drop and two bounces to the centre
  let x, y, rot, sq = 0;
  if (lt < .26) { x = lerp(-60, 360, easeIn(k1)); y = lerp(330, 520, k1 * k1) - R * .12; rot = lt * 14; }
  else {
    const u = clamp(k2 / .95), dropT = .3;
    x = lerp(360, cx, easeOut(clamp(k2 / .5)));
    if (k2 < dropT) y = lerp(520 - R * .12, gy - R, (k2 / dropT) ** 2);
    else { const b = k2 - dropT, amp = [150, 52, 16], dur = [.32, .2, .12]; let t0 = 0, yy = gy - R; for (let i = 0; i < 3; i++) { if (b < t0 + dur[i]) { const p = (b - t0) / dur[i]; yy = gy - R - amp[i] * Math.sin(p * PI); if (p < .08 || p > .92) sq = .12; break; } t0 += dur[i]; } y = yy; }
    rot = (lt * 14) * (1 - u);
  }
  ball(x, y, R, n, { rot, squash: sq });
  // the number rings out when it settles
  const settle = .26 + .3 + .32 + .2 + .12 - .05;
  if (lt > settle - .5) A6.ring(540, gy - R, (lt - (settle - .5)) / .9, 'moon', { r0: R * .9, r1: R * 2.1, lw: 10, alpha: .6 });
  V2.glow(cx, gy - R, R * 2, c[0].replace('#', '').match(/../g).map(h => parseInt(h, 16)).join(','), .16, 'screen', .3);
};

// the thermometer: a digital oral thermometer, the number climbing and settling on 99.8
A.insThermo = (lt, o = {}) => {
  A6.bokeh(lt, ['120,180,255', '255,170,120', '160,255,200'], ['#0f1430', '#1b2350']);
  const cx = 540, cy = 760, k = easeOut(clamp(lt / .3)), rise = seg(lt, .05, .5), v = lerp(96.4, 99.8, easeOut(rise));
  ctx.save(); ctx.translate(cx, cy + (1 - k) * 160); ctx.rotate(-.07); ctx.globalAlpha *= clamp(lt * 5);
  reg('overlay', [cx - 470, cy - 150, cx + 470, cy + 150], { id: 'thermo-insert' });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 16;
  ctx.fillStyle = V2.grad(0, -120, 0, 120, [[0, '#ffffff'], [1, '#d6dce8']]); ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 6; rr(-300, -92, 700, 184, 92); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = V2.grad(-440, 0, -300, 0, [[0, '#9aa4b4'], [1, '#c9d0dc']]); ctx.beginPath(); ctx.moveTo(-300, -40); ctx.lineTo(-450, -16); ctx.quadraticCurveTo(-470, 0, -450, 16); ctx.lineTo(-300, 40); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a4a3a'; rr(-250, -64, 360, 128, 22); ctx.fill(); ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = V2.grad(-250, -64, -250, 64, [[0, '#b6d6a2'], [1, '#8fb87a']]); rr(-244, -58, 348, 116, 18); ctx.fill();
  const blink = rise >= 1 ? (Math.sin(lt * 14) > -.2 ? 1 : .25) : 1;
  ctx.globalAlpha *= blink; text(v.toFixed(1), -90, 8, { size: 132, font: 'Bangers', weight: 400, fill: '#15301a', spacing: 4 }); ctx.globalAlpha /= blink;
  text('F', 66, 18, { size: 54, font: 'Bangers', weight: 400, fill: '#15301a' }); text('o', 52, -22, { size: 30, font: 'Bangers', weight: 400, fill: '#15301a' });
  ctx.fillStyle = '#4a8af0'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(250, 0, 44, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(238, -14, 16, 8, -.5); ctx.fill();
  ctx.restore();
  if (rise >= 1) { A6.ring(cx + 190, cy + 20, ((lt - .5) * 1.4) % 1, 'pulse', { r0: 40, r1: 360, lw: 8, alpha: .7 }); A6.ring(cx + 190, cy + 20, ((lt - .65) * 1.4) % 1, 'pulse', { r0: 40, r1: 300, lw: 6, alpha: .5 }); }
  // a verdict tag under it
  const tk = easeBack(seg(lt, .7, 1.0));
  if (tk > 0) { ctx.save(); ctx.translate(540, 1060); ctx.scale(tk, tk); reg('overlay', [540 - 330 * tk, 1060 - 64 * tk, 540 + 330 * tk, 1060 + 64 * tk], { id: 'thermo-tag' }); ctx.fillStyle = 'rgba(10,8,22,.92)'; rr(-330, -64, 660, 128, 64); ctx.fill(); ctx.strokeStyle = '#7be0a0'; ctx.lineWidth = 5; ctx.stroke();
    text('NOT FEBRILE', 0, -14, { size: 58, font: 'Bangers', weight: 400, fill: '#d8ffe8', spacing: 3 }); text('(HE IS HOWLING)', 0, 34, { size: 26, fill: '#9fe8c0', weight: 900, spacing: 2 }); ctx.restore(); }
};

// the water pitcher: lid on, full to the brim, a ring of dust where it has not moved since lunch, and the tally
A.insPitcher = (lt, o = {}) => {
  A6.bokeh(lt, ['255,200,120', '120,180,255'], ['#161a3a', '#272c5a']);
  const cx = 540, gy = 1020, k = easeOut(clamp(lt / .3));
  ctx.fillStyle = V2.grad(0, gy, 0, 1500, [[0, '#a98a62'], [1, '#6a5238']]); ctx.fillRect(0, gy, W, H - gy); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(0, gy, W, 6);
  ctx.save(); ctx.translate(cx - 150, gy); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 6, 190, 24, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = V2.grad(-150, 0, 150, 0, [[0, 'rgba(190,225,250,.95)'], [.5, 'rgba(225,242,255,.95)'], [1, 'rgba(160,205,240,.95)']]); ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-130, 0); ctx.lineTo(-150, -420); ctx.lineTo(150, -420); ctx.lineTo(130, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(120,190,240,.55)'; ctx.beginPath(); ctx.moveTo(-132, -6); ctx.lineTo(-147, -390); ctx.lineTo(147, -390); ctx.lineTo(132, -6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-112, -360); ctx.lineTo(-122, -50); ctx.stroke();
  ctx.fillStyle = '#e8eef5'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 6; rr(-158, -462, 316, 52, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9d2dc'; rr(-40, -500, 80, 40, 14); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 24; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(150, -360); ctx.bezierCurveTo(260, -380, 260, -130, 136, -90); ctx.stroke();
  ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = 12; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 12; i++) { const x = (hash(i) - .5) * 230, y = -40 - hash(i + 5) * 330; ell(x, y, 5, 7); ctx.fill(); }
  ctx.restore();
  // the empty cup next to it
  ctx.save(); ctx.translate(cx + 250, gy); ctx.scale(k, k); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 4, 84, 14, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(225,242,255,.9)'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-72, -160); ctx.lineTo(72, -160); ctx.lineTo(60, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  // the tally
  const tk = easeBack(seg(lt, .35, .7));
  if (tk > 0) { ctx.save(); ctx.translate(540, 1240); ctx.scale(tk, tk); reg('overlay', [540 - 410 * tk, 1240 - 90 * tk, 540 + 410 * tk, 1240 + 90 * tk], { id: 'pitcher-tag' });
    ctx.fillStyle = 'rgba(10,8,22,.93)'; rr(-410, -90, 820, 180, 40); ctx.fill(); ctx.strokeStyle = '#ff6a7a'; ctx.lineWidth = 6; ctx.stroke();
    text('WATER SINCE LUNCH', 0, -48, { size: 34, fill: '#ffc6cf', weight: 900, spacing: 4 }); text('0 mL', -120, 30, { size: 96, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 }); text('GOAL  1500', 190, 36, { size: 38, fill: '#9fb3c8', weight: 900, spacing: 2 });
    ctx.restore(); }
};

// the phone: dialing the on-call doctor, one touch-tone at a time, then ringing
A.insDial = (lt, o = {}) => {
  A6.bokeh(lt, ['120,230,170', '120,180,255'], ['#0f1430', '#1b2350']);
  const cx = 540, cy = 800, k = easeOut(clamp(lt / .25)), digits = '555014', n = Math.min(6, Math.floor(lt / .105));
  ctx.save(); ctx.translate(cx, cy + (1 - k) * 140); ctx.rotate(.04); ctx.globalAlpha *= clamp(lt * 5);
  reg('overlay', [cx - 280, cy - 440, cx + 280, cy + 440], { id: 'phone-insert' });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18; ctx.fillStyle = '#15171f'; rr(-260, -430, 520, 860, 64); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#3a3e4c'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = V2.grad(0, -400, 0, 400, [[0, '#1c2a4a'], [1, '#0e1530']]); rr(-236, -402, 472, 804, 44); ctx.fill();
  text('CALLING', 0, -330, { size: 38, fill: '#9fe8c0', weight: 900, spacing: 6 });
  ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(0, -190, 90, 0, TAU); ctx.fill(); ctx.strokeStyle = '#15111a'; ctx.lineWidth = 5; ctx.stroke(); text('A', 0, -180, { size: 110, font: 'Bangers', weight: 400, fill: '#fff' });
  text('DR. APPLE', 0, -50, { size: 62, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 }); text('ON CALL', 0, -4, { size: 30, fill: '#ffb0b8', weight: 900, spacing: 5 });
  text('555 ' + (n > 3 ? digits.slice(3, n) : ''), 0, 70, { size: 52, fill: '#d8e8ff', weight: 900, spacing: 3, alpha: n > 0 ? 1 : .3 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const lab = '123456789*0#'[r * 3 + c], on = digits.slice(Math.max(0, n - 1), n) === lab && lt < n * .105 + .08, px = (c - 1) * 130, py = 150 + r * 62; ctx.fillStyle = on ? '#7be0a0' : 'rgba(255,255,255,.12)'; rr(px - 52, py - 22, 104, 46, 14); ctx.fill(); text(lab, px, py + 2, { size: 30, fill: on ? '#10301a' : '#cfd8f0', weight: 900 }); }
  ctx.restore();
  if (n >= 6) { for (let i = 0; i < 3; i++) A6.ring(cx, cy - 190, (((lt - .63) * 1.2 - i * .3) % 1 + 1) % 1, 'phone', { r0: 90, r1: 330, lw: 8, alpha: .7 }); }
};

// the bingo card, full frame. absT is episode time (so the marks are right); lt the insert's own time. o: hi [squares to glow], appear, tilt, zoom, circle [square, progress] for a red marker ring
A.insCard = (absT, lt, o = {}) => {
  A6.bokeh(lt, ['255,200,120', '120,180,255', '255,120,190'], ['#1d1a3e', '#2f2a5e']);
  const k = easeBack(clamp(o.appear ?? clamp(lt / .4))), tilt = (o.tilt ?? -.04) + .015 * Math.sin(lt * 1.3), sc = o.zoom ?? 1;
  ctx.save(); ctx.translate(540, 800 + (1 - k) * 1500); ctx.rotate(tilt); ctx.scale(sc, sc);
  reg('overlay', [540 - 412 * sc, 800 - 512 * sc, 540 + 412 * sc, 800 + 512 * sc], { id: 'card-insert', transit: k < 1 });
  const r = A.drawCard(-400, -500, 800, 1000, A.marks(absT), { hi: o.hi || [], t: absT });
  if (o.circle) {   // Straw rings the square in red marker, so nothing sits on top of the words
    const [i, pk] = o.circle, c = i % 5, rw = Math.floor(i / 5), cx = r.gx + (c + .5) * r.cw, cy = r.gy + (rw + .5) * r.ch, p = easeOut(clamp(pk ?? 1)), rx = r.cw * .45, ry = r.ch * .46, n = 64, sweep = TAU * 1.12 * p;
    ctx.save(); ctx.strokeStyle = '#ff3b55'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let j = 0; j <= n; j++) { const u = j / n * sweep, wob = 1 + .045 * Math.sin(u * 3 + 1) + .02 * u / TAU, x = cx + Math.cos(u - 1.9) * rx * wob, y = cy + Math.sin(u - 1.9) * ry * wob; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
};

// the shift report: a sheet on a clipboard, an empty EVENTS box, a red rubber stamp coming down on it
A.insReport = (lt, o = {}) => {
  A6.bokeh(lt, ['255,200,120', '120,180,255'], ['#161a3a', '#272c5a']);
  const cx = 540, cy = 800, k = easeOut(clamp(lt / .3));
  ctx.save(); ctx.translate(cx, cy + (1 - k) * 160); ctx.rotate(-.04); ctx.globalAlpha *= clamp(lt * 5);
  reg('overlay', [cx - 360, cy - 520, cx + 360, cy + 520], { id: 'report-insert' });
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14; ctx.fillStyle = '#b8864a'; ctx.strokeStyle = 'rgba(25,16,30,.9)'; ctx.lineWidth = 6; rr(-340, -520, 680, 1040, 26); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#9aa0a6'; rr(-90, -548, 180, 56, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffef8'; rr(-304, -470, 608, 960, 10); ctx.fill();
  text('SHIFT REPORT', 0, -400, { size: 70, font: 'Bangers', weight: 400, fill: '#2a2448', spacing: 4 }); text('3 TO 11', 0, -340, { size: 40, fill: '#6a6488', weight: 900, spacing: 6 });
  ctx.strokeStyle = '#8fa7c9'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(-262, -270 + i * 52); ctx.lineTo(262, -270 + i * 52); ctx.stroke(); }
  for (const [lab, y] of [['ALARMS', -250], ['FALLS', -198], ['CALLS', -146], ['EVENTS', -60]]) { text(lab, -262, y + 28, { size: 26, fill: '#2a2448', weight: 900, align: 'left', spacing: 2 }); }
  ctx.strokeStyle = '#2a2448'; ctx.lineWidth = 5; rr(-262, -20, 524, 240, 14); ctx.stroke();
  // the stamp comes down at .45 s
  const sk = seg(lt, 0, .1), hit = lt >= .1, y = lerp(-420, 70, easeIn(sk));
  if (hit) {
    const pk = easeBack(seg(lt, .1, .3));
    ctx.save(); ctx.translate(0, 100); ctx.rotate(-.08); ctx.scale(pk, pk); ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 12; rr(-216, -76, 432, 152, 18); ctx.stroke(); ctx.lineWidth = 5; rr(-200, -62, 400, 124, 12); ctx.stroke();
    text('QUIET', 0, 14, { size: 130, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 6 }); ctx.restore();
    A6.ring(cx, cy + 100, (lt - .1) / .8, 'q', { r0: 60, r1: 520, lw: 12, alpha: .7 });
  } else {
    ctx.save(); ctx.translate(0, y - 40); ctx.rotate(-.08);
    ctx.fillStyle = '#7a4a24'; rr(-60, -250, 120, 90, 22); ctx.fill(); ctx.strokeStyle = 'rgba(25,16,30,.9)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#c0c4cc'; rr(-150, -160, 300, 130, 16); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d6203a'; rr(-130, -30, 260, 40, 10); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
};

// the wall clock, full frame: a minute before eleven, then the minute hand drops onto the twelve
A.insClock = (lt, o = {}) => {
  A6.bokeh(lt, ['255,200,120', '120,180,255'], ['#161a3a', '#272c5a']);
  const cx = 540, cy = 800, R = 330, k = easeOut(clamp(lt / .25)), tick = lt >= .55, jump = easeOut(seg(lt, .55, .66));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.rotate(tick ? .02 * Math.sin((lt - .55) * 60) * (1 - seg(lt, .55, .9)) : 0); ctx.globalAlpha *= clamp(lt * 6);
  reg('overlay', [cx - R - 30, cy - R - 30, cx + R + 30, cy + R + 30], { id: 'clock-insert' });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14; ctx.fillStyle = '#2a2530'; ctx.beginPath(); ctx.arc(0, 0, R + 24, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = big ? 9 : 3; ctx.beginPath(); ctx.moveTo(Math.sin(a) * (R - (big ? 46 : 26)), -Math.cos(a) * (R - (big ? 46 : 26))); ctx.lineTo(Math.sin(a) * (R - 8), -Math.cos(a) * (R - 8)); ctx.stroke(); }
  for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU; text(String(i), Math.sin(a) * (R - 84), -Math.cos(a) * (R - 84) + 4, { size: 52, font: 'Bangers', weight: 400, fill: '#2a2530' }); }
  const min = 59 + jump, hr = 10 + min / 60, sa = tick ? (((lt - .55) * 1) % 1) * TAU : -.2;
  ctx.lineCap = 'round'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(hr / 12 * TAU) * R * .5, -Math.cos(hr / 12 * TAU) * R * .5); ctx.stroke();
  ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(min / 60 * TAU) * R * .78, -Math.cos(min / 60 * TAU) * R * .78); ctx.stroke();
  ctx.strokeStyle = '#e8193a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-Math.sin(sa) * 40, Math.cos(sa) * 40); ctx.lineTo(Math.sin(sa) * R * .86, -Math.cos(sa) * R * .86); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
  ctx.restore();
  if (tick) A6.ring(cx, cy, (lt - .55) / .9, 'q', { r0: R * .9, r1: R * 1.6, lw: 10, alpha: .6 });
  const tk = easeBack(seg(lt, .62, .9));
  if (tk > 0) { ctx.save(); ctx.translate(540, 1240); ctx.scale(tk, tk); reg('overlay', [540 - 220 * tk, 1240 - 60 * tk, 540 + 220 * tk, 1240 + 60 * tk], { id: 'clock-tag' }); ctx.fillStyle = 'rgba(10,8,22,.92)'; rr(-220, -60, 440, 120, 60); ctx.fill(); ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 5; ctx.stroke(); text('11:00 PM', 0, 10, { size: 78, font: 'Bangers', weight: 400, fill: '#ffd60a', spacing: 3 }); ctx.restore(); }
};
})();
