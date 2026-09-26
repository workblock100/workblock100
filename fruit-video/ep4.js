'use strict';
/* SHIFT HAPPENS, Episode 4: The New Grad
 *
 * Uses the panel-layout kit in engine.js (key band, overlay band, character band);
 * `node render.js audit` checks every frame against that layout contract. */
(() => {
if (!window.TIMELINE_EP4) return;

const CLEM_ACC = ['steth', 'pricetag', 'badge'];
const clem = o => Object.assign({ kind: 'clem', id: 'clem', who: 'clem', s: 1.3, y: G, acc: CLEM_ACC, badgeText: 'NEW GRAD', expr: 'hopeful', sparkle: true }, o);
const EP4_LABEL = 'EPISODE 4: THE NEW GRAD';
const PINK = ['#ffc9d9', '#ff7aa2', '#b8325e'];

// ------------------------------------------------------------------ station, new grad edition
function bulletin4() {
  paper2(150, 300, 176, 216, -.04, '#fff');
  text('EMPLOYEE OF', 0, -80, { size: 20, fill: INK }); text('THE MONTH', 0, -58, { size: 20, fill: INK });
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 5; ctx.strokeRect(-58, -40, 116, 128);
  ctx.save(); ctx.beginPath(); ctx.rect(-56, -38, 112, 124); ctx.clip(); ctx.fillStyle = '#ffe9ef'; ctx.fillRect(-56, -38, 112, 124);
  jamJar(0, 84, .25, { noReg: true, label: false, eyes: 'open', lid: 1 }); ctx.restore();
  ctx.restore();
  memorial(352, 282, 'GARY', -.05);
  paper2(256, 462, 380, 84, .02, '#fff27a');
  text('WELCOME, NEW GRAD!', 0, 1, { size: 38, font: 'Bangers', weight: 400, fill: '#e8761a', spacing: 2 });
  ctx.restore();
}
function rulesBoard(shown) {
  boardFace();
  ctx.fillStyle = '#2a9d4a'; ctx.fillRect(BX0, BY0, BX1 - BX0, 52);
  text('3-11 SURVIVAL RULES', 824, BY0 + 27, { size: 30, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 });
  [['NEVER SAY', 'THE Q WORD'], ['ALWAYS CHECK', 'THE BASELINE'], ['NEVER LEND', 'YOUR PEN']].forEach(([a, b], i) => {
    const p = clamp(shown - i);
    if (p <= 0) return;
    const y = BY0 + 100 + i * 92, s = lerp(1.4, 1, easeOut(clamp(p * 1.5)));
    ctx.save(); ctx.translate(824, y); ctx.scale(s, s); ctx.globalAlpha *= clamp(p * 3);
    ctx.fillStyle = '#d62828'; ell(-164, 0, 26, 26); ctx.fill(); text(String(i + 1), -164, 2, { size: 34, font: 'Bangers', weight: 400, fill: '#fff' });
    text(a, -122, -16, { size: 26, fill: '#1f3b8f', align: 'left' });
    text(b, -122, 18, { size: 30, fill: INK, align: 'left' });
    ctx.restore();
  });
}
// o: clock, board ('staff' | 'rules' | 'calls'), rules (0..3), lit, night, keyBoard, keyBulletin
function station4(o) {
  bgStation2();
  if (o.night) nightShade();
  stationClock(o.clock);
  bulletin4();
  if (o.keyBulletin) regKey('bulletin', 40, 168, 472, 522);
  if (o.board === 'rules') rulesBoard(o.rules || 0);
  else if (o.board === 'calls') callPanel(o.lit ?? 40, false);
  else {
    staffNumbers();
    ctx.save(); ctx.translate(990, 318); ctx.rotate(.12); ctx.fillStyle = '#fff176'; ctx.fillRect(-40, -20, 84, 40);
    text('+1 new', 2, -5, { size: 15, fill: '#2a3b8f', italic: true }); text('grad', 2, 11, { size: 15, fill: '#2a3b8f', italic: true }); ctx.restore();
  }
  if (o.keyBoard) regKey('board', 608, 168, 1040, 522);
}

// ------------------------------------------------------------------ NCLEX Land
function bgNclex() {
  cached('nclex4', () => {
    const g = ctx.createLinearGradient(0, -PAD, 0, 1300); g.addColorStop(0, '#ffd1e6'); g.addColorStop(.55, '#d9e2ff'); g.addColorStop(1, '#e6fff0');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ['#ff8fa3', '#ffc36e', '#fff27a', '#9be89b', '#8fd3ff', '#b79bff'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.globalAlpha = .55; ctx.lineWidth = 30; ctx.beginPath(); ctx.arc(540, 1020, 620 - i * 30, PI * 1.08, PI * 1.92); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    const cloud = (x, y, s) => { ctx.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[-60, 0, 50], [0, -24, 64], [64, 0, 52], [0, 16, 58]]) { ell(x + dx * s, y + dy * s, r * s, r * .8 * s); ctx.fill(); } };
    cloud(140, 640, 1.1); cloud(940, 600, 1.2); cloud(560, 740, .8);
    ctx.fillStyle = '#c8f5c8'; ctx.fillRect(-PAD, 1230, W + PAD * 2, 400);
    ctx.fillStyle = '#b0eab0'; for (let x = -40; x < W + 60; x += 70) { ell(x, 1232, 60, 24); ctx.fill(); }
    ['#ff8fc7', '#fff27a', '#ffffff', '#b79bff'].forEach((c, i) => { for (let k = 0; k < 9; k++) { ctx.fillStyle = c; ell(40 + srand(k * 4 + i) * 1000, 1300 + srand(k * 7 + i) * 150, 7, 7); ctx.fill(); } });
    // sign
    ctx.fillStyle = '#c9a0ff'; rr(96, 170, 888, 344, 30); ctx.fill();
    ctx.fillStyle = '#fffaf2'; rr(112, 186, 856, 312, 22); ctx.fill();
    text('WELCOME TO', 540, 226, { size: 34, font: 'Bangers', weight: 400, fill: '#b35fd8', spacing: 4 });
    text('NCLEX LAND', 540, 282, { size: 72, font: 'Bangers', weight: 400, fill: '#ff5fa2', lw: 8, stroke: '#fff', spacing: 5 });
  });
}
function nclexRows(shown) {
  [['RATIO:', '1 NURSE : 1 PATIENT'], ['DOCTOR:', 'ANSWERS ON THE 1ST RING'], ['THE ANSWER:', 'ALWAYS "ASSESS"']].forEach(([k, v], i) => {
    const p = clamp(shown - i); if (p <= 0) return;
    const y = 348 + i * 52;
    ctx.save(); ctx.globalAlpha *= clamp(p * 3);
    text(k, 360, y, { size: 28, fill: '#b35fd8', align: 'right' });
    text(v, 380, y, { size: 32, fill: '#2a3b8f', align: 'left', italic: true, weight: 800 });
    ctx.restore();
  });
}
function sparkles(n, seed = 0) {
  for (let i = 0; i < n; i++) {
    const x = hash(i + seed) * W, y = 540 + hash(i + seed + 50) * 700, q = (T * .8 + hash(i + 3)) % 1, s = Math.sin(q * PI);
    ctx.fillStyle = `rgba(255,255,255,${.9 * s})`; ctx.beginPath();
    for (let j = 0; j < 8; j++) { const a = j * PI / 4, r = j % 2 ? 3 : 12 * s + 2; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.fill();
  }
}
function dreamRings(p) {
  if (p <= 0 || p >= 1) return;
  reg('overlay', [0, 0, W, STAGE_H], { id: 'dream-in', full: true });
  ctx.save(); ctx.globalAlpha = 1 - p;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, STAGE_H);
  ['#ffd1e6', '#d9e2ff', '#fff27a', '#c8f5c8'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 60; ell(540, 740, (p * 1.6 + i * .12) * 900, (p * 1.6 + i * .12) * 900); ctx.stroke(); });
  ctx.restore();
}

// ------------------------------------------------------------------ other sets and props
function wallClock(x, y, h, m) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 10; ell(x, y, 86, 86); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = INK; ell(x + Math.sin(a) * 68, y - Math.cos(a) * 68, 5, 5); ctx.fill(); }
  const ma = m / 60 * TAU, ha = ((h % 12) / 12 + m / 720) * TAU;
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ha) * 40, y - Math.cos(ha) * 40); ctx.stroke();
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ma) * 62, y - Math.cos(ma) * 62); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ell(x, y, 8, 8); ctx.fill();
  regKey('wall-clock', x - 92, y - 92, x + 92, y + 92);
}
function binder(x, y, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#1f3b8f'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(-110, -250, 220, 250, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#16296a'; ctx.fillRect(-110, -250, 34, 250);
  ctx.fillStyle = '#fff'; rr(-60, -210, 150, 120, 8); ctx.fill();
  text('ORIENTATION', 15, -180, { size: 22, font: 'Bangers', weight: 400, fill: '#1f3b8f', spacing: 1 });
  text('MANUAL', 15, -150, { size: 26, font: 'Bangers', weight: 400, fill: '#1f3b8f', spacing: 2 });
  text('vol. 1 of 9', 15, -115, { size: 15, fill: '#555', italic: true });
  ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 5; i++) ctx.fillRect(-100 + 6, -30 - i * 6, 200, 3);
  ctx.restore();
}
function dust(x, y, p, n = 7) {
  if (p <= 0 || p >= 1) return;
  ctx.fillStyle = `rgba(230,220,200,${.85 * (1 - p)})`;
  for (let i = 0; i < n; i++) { ell(x + (i - (n - 1) / 2) * 50 * (1 + p), y - 18 - hash(i) * 60 * p, 40 + 50 * p, 28 + 26 * p); ctx.fill(); }
}
function checkmarks(lt, times) {
  times.forEach((t0, i) => {
    const q = seg(lt, t0, t0 + 1.1); if (q <= 0 || q >= 1) return;
    const x = 300 + (i % 2 ? 1 : -1) * (40 + i * 12), y = 1000 - q * 170;
    ctx.save(); ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#2a9d4a'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 4, y + 13); ctx.lineTo(x + 20, y - 16); ctx.stroke(); ctx.restore();
  });
}
function puddle(x, p) {
  if (p <= 0) return;
  ctx.fillStyle = '#e8761a'; ctx.strokeStyle = '#8a3a00'; ctx.lineWidth = 4;
  ell(x, G - 6, 60 + 170 * p, 14 + 20 * p); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,170,.5)'; ell(x - 40 * p, G - 12, 30 * p, 6 * p); ctx.fill();
}
function birds(lt) {
  for (let i = 0; i < 4; i++) {
    const x = ((lt * (70 + i * 12) + i * 260) % 1400) - 150, y = 220 + i * 60 + Math.sin(lt * 2 + i) * 14, f = Math.sin(lt * 12 + i) * 10;
    ctx.strokeStyle = '#3a3f5a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 18, y - f); ctx.quadraticCurveTo(x - 8, y - 6, x, y); ctx.quadraticCurveTo(x + 8, y - 6, x + 18, y - f); ctx.stroke();
  }
}

// ------------------------------------------------------------------ scenes
const SCENES = {
  title: {
    cam(lt) { const p = easeIO(seg(lt, 0, CUR.dur)); CAM.z = 1.02 + .05 * p; CAM.y = 740 + 30 * p; },
    draw(lt) {
      bgExterior(); exteriorDyn(); birds(lt);
      const n2 = B('n2'), walk = seg(lt, .3, n2.e + .4);
      const x = lerp(-140, 540, walk), fade = seg(lt, n2.e + .3, n2.e + .9);
      if (fade < 1) drawChar(clem({ who: null, x, y: 1455 - Math.abs(Math.sin(lt * 7)) * 22, s: .78, transit: true, walk: lt * 14, look: [.8, -.2], alpha: 1 - fade,
        acc: [...CLEM_ACC, 'backpack'], hold: { l: 'lunchbox' }, arms: { l: [.4, .2], r: 'wave' } }));
    },
    over(lt) {
      const n2 = B('n2'), p = seg(lt, n2.e - .15, n2.e + .15);
      if (p > 0) logo2(540, 300, lerp(1.06, .82, easeOut(p)) * (1 + .012 * Math.sin(lt * 6)), clamp(p * 3), EP4_LABEL, labelWidth(EP4_LABEL));
    },
  },

  intro: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const l1 = B('l1'), c1 = B('c1'), s1 = B('s1'), n1 = B('n1');
      station4({ clock: '2:55', board: 'staff', keyBulletin: true });
      drawChar(straw({ x: 200, look: [.8, 0], expr: lt > s1.s ? 'chill' : 'neutral', arms: lt > s1.s && lt < s1.e + .3 ? { l: 'rest', r: 'wave' } : { l: 'rest', r: 'rest' } }));
      const jump = lt > c1.s && lt < c1.s + .6 ? Math.sin(seg(lt, c1.s, c1.s + .6) * PI) * 60 : 0;
      drawChar(clem({ x: 520, y: G - jump, look: [-.3, -.2], arms: lt > c1.s && lt < c1.e + .2 ? { l: 'cheer', r: 'cheer' } : lt < l1.e ? { l: 'rest', r: 'wave' } : { l: 'rest', r: 'rest' } }));
      drawChar(lemon({ x: 850, hold: {}, look: [-.8, 0], expr: 'sour', arms: lt < l1.e ? { l: 'point', r: 'hips' } : { l: 'hips', r: 'hips' } }));
      const c = seg(lt, n1.s + 1.6, n1.s + 2.0);
      if (c > 0) { ctx.save(); ctx.strokeStyle = '#ffe135'; ctx.lineWidth = 7; ctx.setLineDash([18, 10]); ctx.lineDashOffset = -T * 60; ctx.beginPath(); ctx.ellipse(572, 1327, 50 * easeBack(c), 44 * easeBack(c), 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    },
    over(lt) {
      const n1 = B('n1');
      card(seg(lt, n1.s + .15, n1.s + .45), 'FIELD GUIDE: THE NEW GRAD', [['LICENSED', '6 days ago'], ['STETHOSCOPE', 'Price tag still on'], ['HOPE', '100%']], '#e8761a');
    },
  },

  orient: {
    cam(lt) { const l2 = B('l2'), sh = seg(lt, l2.e, l2.e + .4); if (sh > 0 && sh < 1) CAM.shake = 14 * (1 - sh); },
    draw(lt) {
      const c1 = B('c1'), l1 = B('l1'), c2 = B('c2'), l2 = B('l2'), l3 = B('l3'), l4 = B('l4');
      station4({ clock: '3:00', board: 'staff' });
      const fall = seg(lt, l2.e - .35, l2.e);
      if (fall > 0) { binder(540, lerp(-80, G, easeIn(fall)), (1 - fall) * .5); if (fall >= 1) regKey('binder', 425, G - 255, 655, G + 2); }
      dust(540, G, seg(lt, l2.e, l2.e + .8));
      const shocked = lt > l2.e, sad = lt > l4.s;
      drawChar(clem({ x: 270, look: shocked ? [.4, .6] : [.8, 0], expr: sad ? 'dead' : shocked ? 'shock' : lt > c2.s ? 'shock' : 'hopeful', sparkle: !shocked,
        arms: shocked && !sad ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, acc: shocked ? [...CLEM_ACC, 'sweat'] : CLEM_ACC }));
      drawChar(lemon({ x: 810, hold: {}, look: [-.8, 0], expr: lt > l3.s && lt < l4.s ? 'happy' : lt > l4.s ? 'smug' : 'sour', arms: lt > l3.s && lt < l3.e ? { l: 'thumb', r: 'hips' } : { l: 'hips', r: 'hips' } }));
    },
    over(lt) {
      const l4 = B('l4');
      stamp2(seg(lt, l4.e - .3, l4.e), [['YOUR ASSIGNMENT', 60, -50], ['ROOMS 1-40', 104, 42]]);
    },
  },

  dream: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const wv = B('wave'), n1 = B('n1'), n2 = B('n2'), a1 = B('a1'), n3 = B('n3'), c1 = B('c1'), pp = B('pop'), s1 = B('s1');
      const awake = lt >= pp.s + .15;
      if (!awake) {
        bgNclex();
        nclexRows(seg(lt, n1.s, n1.s + .4) + seg(lt, n2.s, n2.s + .4) + seg(lt, n3.s, n3.s + .4));
        regKey('nclex-sign', 96, 170, 984, 514);
        sparkles(26);
        drawBedBack(700, 1150);
        drawChar({ kind: 'blue', id: 'blue', x: 820, y: 1010, s: 1.3, noLegs: true, center: true, noBob: true, colors: PINK, expr: 'happy', look: [-.8, 0], acc: ['glasses', 'mustache', 'halo'], browColor: '#f0f0f0', browW: 12, arms: { l: 'rest', r: 'thumb' } });
        drawBedFront(700, 1150, '#cfe6ff', bedTop(1010, KINDS.blue, 1.3));
        const ap = easeBack(seg(lt, a1.s - .15, a1.s + .2));
        if (ap > 0) drawChar({ kind: 'apple', id: 'apple', who: 'appledream', x: 470, y: G, s: 1.15 * ap, transit: ap < 1, acc: ['headmirror', 'halo'], expr: 'happy', look: [-.6, -.2], arms: { l: 'wave', r: 'thumb' } });
        poof(470, 1150, seg(lt, a1.s - .15, a1.s + .35), 120);
        drawChar(clem({ x: 190, look: [.8, -.3], expr: 'hopeful', arms: lt > c1.s && lt < c1.e + .3 ? { l: 'cheer', r: 'cheer' } : { l: 'rest', r: 'rest' } }));
        return;
      }
      station4({ clock: '3:05', board: 'calls', lit: 40, keyBoard: true });
      drawChar(clem({ x: 260, look: [.8, 0], expr: 'shock', sparkle: false, arms: { l: 'down', r: 'down' }, acc: [...CLEM_ACC, 'sweat'] }));
      drawChar(straw({ x: 800, look: [-.8, 0], expr: 'chill', hold: { l: 'coffee' }, arms: { l: 'hold', r: 'rest' } }));
    },
    over(lt) {
      const wv = B('wave'), pp = B('pop');
      dreamRings(seg(lt, 0, wv.e));
      const burst = seg(lt, pp.s, pp.s + .45);
      if (burst > 0 && burst < 1) { flash(burst); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = 200 + burst * 700; ctx.fillStyle = ['#ffd1e6', '#d9e2ff', '#fff27a', '#c8f5c8'][i % 4]; ctx.globalAlpha = 1 - burst; ctx.save(); ctx.translate(540 + Math.cos(a) * r, 740 + Math.sin(a) * r); ctx.rotate(a + burst * 4); ctx.fillRect(-30, -12, 60, 24); ctx.restore(); ctx.globalAlpha = 1; } }
    },
    panelLabel: lt => lt >= B('pop').s + .15 ? "NURSES' STATION" : 'NCLEX LAND',
  },

  rules: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const s1 = B('s1'), r1 = B('r1'), r2 = B('r2'), r3 = B('r3'), c1 = B('c1'), st = B('steal'), s2 = B('s2');
      const shown = seg(lt, r1.s, r1.s + .3) + seg(lt, r2.s, r2.s + .3) + seg(lt, r3.s, r3.s + .3);
      station4({ clock: '3:10', board: 'rules', rules: shown, keyBoard: true });
      const grab = st.s + .45, stolen = lt >= grab;
      const writing = lt > r1.s && lt < c1.s;
      drawChar(clem({ x: 330, look: stolen ? [.9, 0] : [.8, -.3], expr: lt > s2.s ? 'sad' : stolen ? 'shock' : lt > c1.s ? 'neutral' : 'hopeful', sparkle: !stolen,
        hold: stolen ? { l: 'notebook' } : { l: 'notebook', r: 'pen' }, arms: { l: 'hold', r: writing ? [.8 + .08 * Math.sin(lt * 26), 1.05] : stolen ? 'up' : [.8, 1.05] } }));
      drawChar(straw({ x: 820, look: lt > st.s ? [-.5, 0] : [-.8, -.2], expr: lt > s2.s ? 'dead' : 'neutral', arms: lt > r1.s && lt < r3.e ? { l: 'cheer', r: 'rest' } : { l: 'rest', r: 'rest' } }));
      const run = seg(lt, st.s, st.s + .9);
      if (run > 0 && run < 1) {
        const x = lerp(-180, 1300, run);
        speedLines(x - 40, 1150, 420, .9);
        drawChar(kiwi(0, { who: null, x, transit: true, walk: lt * 34, expr: 'smug', look: [.9, 0], rot: .15, hold: lt >= grab ? { r: 'pen' } : {}, arms: { l: 'run', r: lt >= grab ? 'cheer' : 'reach' } }));
      }
    },
    over() {},
  },

  meds: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const c1 = B('c1'), s1 = B('s1'), c2 = B('c2');
      const q = easeIO(seg(lt, c1.s, c1.e)), mins = 17 * 60 + 240 * q;
      bgHall2(); fallSign(0, 0, true);
      wallClock(905, 330, Math.floor(mins / 60), mins % 60);
      ctx.fillStyle = `rgba(30,30,110,${.2 * q})`; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
      medCart(360, 1160);
      const wt = wordTimes('c1');
      checkmarks(lt, [0, 2, 4, 6, 8, 10, 12, 14].map(i => wt[i] ?? 99));
      const sIn = easeOut(seg(lt, s1.s - .45, s1.s));
      drawChar(clem({ x: 240, look: lt > s1.s ? [.9, 0] : [.6, .4], expr: lt > c2.s ? 'hopeful' : lt > s1.s ? 'shock' : 'neutral', sparkle: lt > c2.s,
        hold: { r: 'medcup' }, arms: { l: 'rest', r: lt < c1.e ? [1.0 + .1 * Math.sin(lt * 8), .9] : 'hold' }, acc: q > .5 ? [...CLEM_ACC, 'sweat'] : CLEM_ACC }));
      if (sIn > 0) drawChar(straw({ x: lerp(1330, 880, sIn), transit: sIn < 1, walk: sIn < 1 ? lt * 16 : null, look: [-.8, 0], expr: lt > c2.e ? 'dead' : 'neutral', arms: { l: 'rest', r: 'rest' } }));
    },
    over(lt) {
      const c2 = B('c2');
      card(seg(lt, c2.e, c2.e + .3), 'MED PASS', [['STARTED', '5:00 PM'], ['PROGRESS', 'Resident 2 of 40'], ['ESTIMATED FINISH', 'Thursday']], '#2a6fdb');
    },
    panelClock(lt) {
      const c1 = B('c1'), m = 17 * 60 + Math.round(240 * easeIO(seg(lt, c1.s, c1.e)));
      return `${Math.floor(m / 60) - 12}:${String(m % 60).padStart(2, '0')} PM`;
    },
  },

  sure: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const l1 = B('l1'), c1 = B('c1'), k1 = B('k1'), c2 = B('c2'), g1 = B('g1'), c3 = B('c3'), s1 = B('s1'), c4 = B('c4'), c5 = B('c5');
      station4({ clock: '9:15', board: 'staff' });
      const n = 1 + 3 * [c1, c2, c3].filter(b => lt >= b.s + .1).length;
      const visit = (from, to, build) => {
        const i = easeOut(seg(lt, from - .4, from)), o = easeIn(seg(lt, to, to + .35));
        if (i > 0 && o < 1) drawChar(build(lerp(1330, 850, i) + 520 * o, i < 1 || o > 0));
      };
      visit(l1.s, c1.e + .1, (x, tr) => lemon({ x, transit: tr, walk: tr ? lt * 16 : null, look: [-.8, 0], expr: 'happy', hold: {}, arms: { l: 'offer', r: 'rest' } }));
      visit(k1.s, c2.e + .1, (x, tr) => kiwi(1, { x, who: 'kiwi1', transit: tr, walk: tr ? lt * 16 : null, look: [-.8, 0], expr: 'happy', arms: { l: 'offer', r: 'rest' } }));
      visit(g1.s, c3.e + .1, (x, tr) => gfruit({ x, y: G, transit: tr, walk: tr ? lt * 16 : null, look: [-.8, 0], arms: { l: 'offer', r: 'hold' } }));
      const sIn = easeOut(seg(lt, s1.s - .4, s1.s));
      if (sIn > 0) drawChar(straw({ x: lerp(1330, 860, sIn), transit: sIn < 1, walk: sIn < 1 ? lt * 16 : null, look: [-.8, 0], expr: lt > c5.s ? 'dead' : 'neutral', arms: lt > s1.s && lt < s1.e ? { l: 'point', r: 'rest' } : { l: 'rest', r: 'rest' } }));
      const saying = [c1, c2, c3, c5].some(b => lt > b.s && lt < b.e + .2);
      drawChar(clem({ x: 300, look: [.8, lt > c4.s && lt < c5.s ? .5 : -.1], expr: lt > c4.s && lt < c5.s ? 'sad' : saying ? 'happy' : 'hopeful', sparkle: true, twitch: lt > c5.s,
        hold: { r: 'stack' }, stackN: n, stackWobble: n / 10, arms: { l: saying ? 'thumb' : 'rest', r: [2.0, -.3] } }));
    },
    over() {},
  },

  blue: {
    cam(lt) { const c1 = B('c1'); if (lt > c1.s && lt < c1.e) CAM.shake = 4; },
    draw(lt) {
      const c1 = B('c1'), s1 = B('s1'), c2 = B('c2'), c3 = B('c3'), rg = B('ring'), a1 = B('a1'), c4 = B('c4'), hg = B('hang'), b1 = B('b1');
      bgRoom2({ num: 12, wall: ['#e2dcf5', '#c9c0ea'], board: [['NURSE: CLEMENTINE', '#d62828'], ['BASELINE: BLUE'], ['O2: 2L NC'], ['SINCE: 1953'], ] });
      windowDyn('night', 60, 170, 380, 350);
      regKey('whiteboard', 598, 168, 1042, 522);
      pulseOx(470, 470, 87, true);
      regKey('monitor', 360, 330, 580, 500);
      drawBedBack(760, 1150);
      const by = 1010, talking = lt > b1.s && lt < b1.e + .2;
      drawChar({ kind: 'blue', id: 'blue', who: 'blue', x: 880, y: by, s: 1.3, noLegs: true, center: true, noBob: true, expr: talking ? 'chill' : 'neutral', look: [-.8, 0],
        acc: ['glasses', 'mustache', 'cannula'], browColor: '#f0f0f0', browW: 12, arms: talking ? { l: [1.3, -1.3 + .3 * Math.sin(lt * 5)], r: 'rest' } : { l: 'rest', r: 'rest' } });
      drawBedFront(760, 1150, '#9fb4ff', bedTop(by, KINDS.blue, 1.3));
      const panic = lt < s1.s + .2, onPhone = lt > rg.s + .4 && lt < hg.e;
      drawChar(straw({ x: 510, look: [-.7, 0], expr: lt > b1.s ? 'chill' : lt > c4.s ? 'dead' : 'chill', hold: { r: 'coffee' }, arms: { l: lt > s1.s && lt < s1.e + .2 ? 'point' : 'rest', r: 'hold' } }));
      drawChar(clem({ x: 200, look: panic ? [.9, -.2] : [.8, 0], expr: panic ? 'panic' : lt > c4.s ? 'dead' : lt > c2.s && lt < c3.s ? 'sad' : 'shock', sparkle: false, shake: panic ? 3 : 0,
        hold: onPhone ? { r: 'cell' } : {}, arms: panic ? { l: 'flail', r: 'flail' } : onPhone ? { l: 'rest', r: 'phone' } : { l: 'down', r: 'down' }, acc: [...CLEM_ACC, 'sweat'] }));
    },
    over(lt) {
      const rg = B('ring'), a1 = B('a1'), hg = B('hang');
      callCard(seg(lt, rg.s, rg.s + .3) * (1 - seg(lt, hg.e - .1, hg.e + .2)), 'DR. APPLE', lt > hg.s ? 'Call ended.' : lt > a1.s ? 'Call in progress (9:47 PM)' : 'Incoming call', '#e53935');
    },
  },

  shiftend: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const s1 = B('s1'), c1 = B('c1'), s2 = B('s2'), s3 = B('s3'), l1 = B('l1'), ml = B('melt'), n1 = B('n1'), s4 = B('s4');
      station4({ clock: '11:00', board: 'staff', night: true });
      const lIn = easeOut(seg(lt, l1.s - .45, l1.s));
      if (lIn > 0) drawChar(lemon({ x: lerp(1330, 860, lIn), transit: lIn < 1, walk: lIn < 1 ? lt * 16 : null, look: [-.8, 0], expr: lt > ml.s ? 'shock' : 'happy', hold: {}, arms: lt > l1.s && lt < l1.e ? { l: 'wave', r: 'rest' } : lt > ml.s ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' } }));
      const m = seg(lt, ml.s, ml.s + 1.2), jarAt = ml.s + 1.3;
      puddle(520, lt < jarAt ? m : 0);
      if (lt < jarAt) {
        const sy = lerp(1, .12, easeIn(m));
        drawChar(clem({ x: 520, y: G + 228.8 * (1 - sy), sy, sx: lerp(1, 1.8, easeIn(m)), transit: m > 0, look: [-.4, .4], expr: lt > l1.s ? 'dead' : lt > s3.s ? 'weak' : 'weak', sparkle: false,
          arms: m > 0 ? { l: 'down', r: 'down' } : { l: 'rest', r: 'rest' }, acc: ['steth', 'badge', 'sweat'] }));
      } else jamJar(520, G, .7, { flavor: 'marmalade', eyes: 'dead', sub: 'fresh off the 3-11' });
      poof(520, 1250, seg(lt, jarAt - .1, jarAt + .4), 150);
      drawChar(straw({ x: 200, look: [.8, 0], expr: lt > s4.s ? 'happy' : lt > ml.s ? 'shock' : lt > s3.s ? 'chill' : 'happy', acc: lt > s4.s ? [...STRAW_ACC, 'tears'] : STRAW_ACC,
        arms: lt < s1.e + .2 ? { l: 'cheer', r: 'cheer' } : lt > s4.s ? { l: 'rest', r: 'wave' } : { l: 'rest', r: 'rest' } }));
      ctx.fillStyle = 'rgba(14,18,54,.14)'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
    },
    over() {},
  },

  end: {
    cam() {},
    draw(lt) {
      const g = ctx.createLinearGradient(0, 0, 0, STAGE_H); g.addColorStop(0, '#ff9a3c'); g.addColorStop(1, '#7a1f5c');
      ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
      for (let i = 0; i < 60; i++) { const x = hash(i) * W + Math.sin(T + i) * 30, y = ((hash(i + 9) * STAGE_H + lt * (120 + hash(i + 4) * 200)) % (STAGE_H + 100)) - 50; ctx.save(); ctx.translate(x, y); ctx.rotate(T * 2 + i); ctx.fillStyle = ['#ffe135', '#ff3b55', '#5b6cff', '#2ecc71', '#ffffff'][i % 5]; ctx.fillRect(-8, -4, 16, 8); ctx.restore(); }
      const cast = [['clem', { acc: ['steth', 'pricetag'], sparkle: true, expr: 'hopeful' }], ['straw', { acc: ['steth'] }], ['lemon', { acc: ['readers'] }], ['kiwi', { acc: ['bouffant'], capColor: '#7a3fb0' }], ['gfruit', { acc: ['sunglasses'] }], ['blue', { acc: ['glasses', 'mustache'], browColor: '#eee' }],
        ['apple', { acc: ['headmirror', 'halo'] }], ['blue', { acc: ['glasses', 'mustache', 'halo'], colors: PINK, browColor: '#eee' }], ['melon', { acc: ['suit'] }], ['fig', { acc: ['suit', 'fedora'], suitColor: '#18181e', lapelColor: '#0b0b0e', tieColor: '#101014' }], ['cherry', { acc: ['sunglassesHead'] }], ['banana', {}]];
      cast.forEach(([kind, extra], i) => {
        const row = i < 6 ? 0 : 1, col = i % 6;
        const x = 105 + col * 174, y = row ? 1440 : 1250;
        const hop = Math.abs(Math.sin(lt * 5 + i)) * 20, pop = easeBack(seg(lt, .8 + i * .07, 1.1 + i * .07));
        if (pop > 0) { REG.suppress++; drawChar(Object.assign({ kind, x, y: y - hop, s: .5 * pop, expr: 'happy', arms: { l: 'cheer', r: 'wave' }, t: lt + i }, extra)); REG.suppress--; }
      });
    },
    over(lt) {
      logo2(540, 330, easeBack(seg(lt, 0, .35)) * .74, 1, EP4_LABEL, labelWidth(EP4_LABEL));
      const lines = [['For every new grad on their first shift:', 34, '#fff', .9], ['"Rule two: check the baseline."', 42, '#ffe135', 1.3], ['Learn to say no. Guard your pen.', 32, '#ffe7c2', 2.0], ['NEXT TIME: Full Moon', 36, '#ffd1e6', 2.7]];
      lines.forEach(([s, size, c, at], i) => text(s, 540, 640 + i * 62, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 8 }));
    },
    panelLabel: () => 'THANKS FOR WATCHING',
  },

  post: {
    cam(lt) { const c1 = B('c1'); const z = easeOut(seg(lt, c1.e + .15, c1.e + .45)); CAM.z = lerp(1, 1.3, z); CAM.x = lerp(540, 660, z); CAM.y = lerp(740, 900, z); CAM.shake = z * 4; },
    draw(lt) {
      const r = B('ringing'), a1 = B('a1'), c1 = B('c1');
      bgBedroom();
      ctx.fillStyle = '#3a3566'; rr(40, 1180, 470, 230, 26); ctx.fill();
      ctx.fillStyle = '#5b4fa0'; ctx.strokeStyle = '#231c4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(40, 1400); ctx.lineTo(40, 1200); ctx.quadraticCurveTo(250, 1160, 510, 1210); ctx.lineTo(510, 1400); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e9e4f5'; ell(160, 1180, 110, 40); ctx.fill();
      ctx.fillStyle = '#4a3b2a'; rr(560, 1160, 480, 250, 12); ctx.fill();
      ctx.fillStyle = '#3a2d20'; ctx.fillRect(560, 1160, 480, 18);
      jamJar(690, 1160, .68, { flavor: 'marmalade', eyes: lt < r.s + .3 ? 'sleep' : 'dead', sub: 'do not disturb', key: true });
      const ringing = lt > r.s && lt < a1.s, buzz = ringing ? Math.sin(lt * 60) * 4 : 0;
      ctx.save(); ctx.translate(955 + buzz, 1150);
      if (ringing) { const gl = ctx.createRadialGradient(0, 0, 10, 0, 0, 240); gl.addColorStop(0, 'rgba(120,200,255,.5)'); gl.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = gl; ctx.fillRect(-240, -240, 480, 480); }
      ctx.fillStyle = '#111'; rr(-44, -18, 88, 30, 6); ctx.fill(); ctx.fillStyle = ringing || lt > a1.s ? '#7fd3ff' : '#223'; rr(-38, -14, 76, 22, 4); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#111'; rr(900, 1052, 110, 60, 8); ctx.fill(); text('3:00', 955, 1083, { size: 40, fill: '#ff3030', font: 'Bangers', weight: 400 });
    },
    over(lt) {
      const r = B('ringing'), a1 = B('a1'), c1 = B('c1');
      callCard(seg(lt, r.s, r.s + .3) * (1 - seg(lt, c1.e - .15, c1.e + .12)), 'DR. APPLE', lt > a1.s ? 'Call in progress (3:00 AM)' : 'Incoming call (3:00 AM)', '#e53935');
      const f = seg(lt, CUR.dur - .7, CUR.dur);
      if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, STAGE_H); }
    },
  },
};

EPISODES[4] = { num: 4, title: 'Episode 4: The New Grad', TL: window.TIMELINE_EP4, SCENES, layout: 'panel', audio: 'build/ep4/audio.m4a' };
})();
