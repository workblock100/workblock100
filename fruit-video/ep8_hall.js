'use strict';
/* SHIFT HAPPENS, Episode 8: The Double Shift. Scene module: hall (2:47 AM, THE HALL).
 *
 * The night corridor goes off: a call light, a bed alarm, "all of them", "yes", an overhead page about breaks, every alarm at once,
 * a HUD ratio (1 nurse, 40 residents) and a sprint into the dark. Built like Episode 7's SCENES.quiet: S6.corridor with alarm domes and
 * S6.stationDesk, the A7 constructors, runner() for the sprint, A6.ring for the sound. Registers window.__EP8_SCENES.hall.
 * Every position is a world coordinate: X right, Z forward, from V2.at(X, Z). */
(() => {
if (!window.TIMELINE_EP8) return;
const { runner, zoomTo, faceZoom, drawBg, inB, KINDS6 } = window.H6;
const A6 = window.A6, S6 = window.S6;
const { straw, mango } = window.A7;

// ------------------------------------------------------------------ helpers (copies of the Episode 7 ones)
// a neighbor of the subject in a close-up: out of focus, behind the shot, never audited
const nbr = o => V2.dof(6, () => drawBg(o));
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
// the first entry of the list whose end time is still ahead of lt
const pick = (lt, list) => list.find(([e]) => lt < e)[1];
// scene-relative time of a spoken word, from the recorded line's word timings (falls back to a guess if the line is missing)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };

// ------------------------------------------------------------------ the cast and the hall
const HS = { straw: [-150, 1060], mango: [165, 1060] };   // where the two stand: side by side in the aisle, in front of the station desk
const strawPath = lt => { const r = B('run'), e = seg(lt, r.s + .12, r.e + .3), q = easeIn(e) * .8 + e * .2; return [lerp(HS.straw[0], -40, q), lerp(HS.straw[1], 6300, q)]; };

// the doors, nearest first (that is the order the call lights come on down the hall): one every 400 units on each side, staggered, 29 in all
const DCOL = ['#6d8f88', '#9d6b74', '#a8744f', '#8e6f55'];
const DOORS8 = [];
for (let j = 0; j < 15; j++) for (const side of [1, -1]) { const z = (side > 0 ? 1300 : 1700) + 400 * j; if (z <= 7000) DOORS8.push({ side, z, n: String(side > 0 ? 1 + 2 * j : 2 + 2 * j), color: DCOL[(j + (side > 0 ? 0 : 2)) % 4] }); }
DOORS8.sort((a, b) => a.z - b.z);
const LAST = DOORS8.length - 1;
// the first lights of the night: door rank -> [beat, seconds into it, alarm kind]
const FIRST = { 4: ['open', .1, 'call'], 5: ['open', .5, 'bed'], 8: ['s1', .5, 'call'], 9: ['s1', 1.0, 'call'], 12: ['s1', 1.4, 'call'] };
const WAVE = ['pump', 'pulse', 'chair', 'door'];   // the four alarms of the burst, one per sound effect
// the state of one call-light dome: [rgb, alpha, kind] or null
function dome(i, lt) {
  const b = id => B(id), rank = i, pulse = .62 + .38 * Math.sin(lt * 14 + i * 1.9), rgb = k => A6.ALARM[k].rgb;
  const ch = b('chime').s, all = b('all');
  if (lt < ch) {
    const f = FIRST[i], t0 = f ? b(f[0]).s + f[1] : b('m1').s - .05 + rank * .016, kind = f ? f[2] : 'call';
    if (lt < t0) return null;
    if (lt >= b('m2').s) { const k = KINDS6[(i + Math.floor((lt - b('m2').s) * 9)) % 6]; return [rgb(k), pulse, k]; }   // "Yes.": every kind at once
    return [rgb(kind), pulse, kind];
  }
  if (lt < all.s) {   // the page cuts the building off for a moment
    const hush = 1 - seg(lt, ch, ch + .3);
    if (hush > 0) return [rgb('call'), pulse * hush, 'call'];
    if (i === LAST) return [rgb('call'), .3 + .2 * Math.sin(lt * 5), 'call'];   // one far lamp keeps breathing
    if (i === 4 && lt > b('s3').s + .35) return [rgb('call'), .45 * pulse, 'call'];
    if (i === 5 && lt > b('s3').e - .1) return [rgb('bed'), .45 * pulse, 'bed'];
    return null;
  }
  // every alarm at once: four waves, then the whole building cycling through its colors
  const w = rank % 4, tw = all.s + .1 + .3 * w;
  if (lt < tw) return null;
  const k = lt < tw + .4 ? WAVE[w] : KINDS6[(i + Math.floor(lt * 9)) % 6];
  const blink = lt >= all.e ? (hash(Math.floor(lt * 7) + i * 13) < .8 ? 1 : 0) : 1, lvl = lerp(1, .62, seg(lt, all.e, all.e + 1.2));
  const sz = strawPath(lt)[1], alive = lt >= b('run').s ? clamp((DOORS8[i].z - (sz - 250)) / 450) : 1;   // behind the sprinter the alarms go quiet
  const a = pulse * lvl * blink * alive * (1 - .3 * seg(lt, b('run').s + .3, b('run').e + .3));
  return a > .03 ? [rgb(k), a, k] : null;
}
// the ceiling tubes: steady, dim in the hush, failing with the alarms, then going out with the run
function lampOn(lt) {
  const b = id => B(id), all = b('all');
  if (lt < b('chime').s) return lt >= b('m2').s ? .55 + .15 * Math.sin(lt * 11) : .55;
  if (lt < all.s) return .26 + (lt > b('s3').e - .3 ? .16 * (hash(Math.floor(lt * 15)) > .5 ? 1 : 0) : 0);
  if (lt < b('run').s + .2) return hash(Math.floor(lt * 14) + 5) > .3 ? .7 : .14;
  return lerp(.5, .06, seg(lt, b('run').s + .2, b('run').e + .3)) * (hash(Math.floor(lt * 12)) > .12 ? 1 : .35);
}
// the overhead horn speaker, hung under the duct: sound rings while the page plays
function paHorn(lt, blur) {
  const [x, y, k] = V2.proj(0, 586, 1250), ch = B('chime').s, pa = B('pa1');
  const act = seg(lt, ch, ch + .1) * (1 - seg(lt, pa.e + .1, pa.e + .4)), amp = typeof V2C !== 'undefined' && lt >= pa.s && lt < pa.e ? V2C.mouthState('pa').open : 0;
  ctx.save(); ctx.translate(x, y);
  const duct = V2.proj(0, 636, 1250)[1] - y;
  ctx.fillStyle = '#6c7280'; ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = Math.max(2, 3 * k);
  rr(-9 * k, duct - 4 * k, 18 * k, -duct - 20 * k, 3 * k); ctx.fill(); ctx.stroke();   // bracket arm
  ctx.fillStyle = '#4d5260'; rr(-30 * k, duct - 10 * k, 60 * k, 16 * k, 5 * k); ctx.fill(); ctx.stroke();   // plate on the duct
  ctx.fillStyle = V2.grad(-70 * k, 0, 70 * k, 0, [[0, '#a3a9b8'], [.45, '#e2e5ee'], [1, '#7b8192']]);   // the bell: a cone seen from the front, a little from below
  ctx.beginPath(); ctx.moveTo(-26 * k, -44 * k); ctx.lineTo(-68 * k, -4 * k); ctx.ellipse(0, 0, 68 * k, 56 * k, 0, PI, 0, true); ctx.lineTo(26 * k, -44 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, -50 * k, 0, 50 * k, [[0, '#2c3040'], [1, '#0e1018']]); ell(0, 2 * k, 54 * k, 44 * k); ctx.fill(); ctx.stroke();   // the dark throat
  ctx.strokeStyle = 'rgba(190,200,230,.35)'; ctx.lineWidth = Math.max(1.5, 2.4 * k);
  for (const r of [.35, .62, .88]) { ctx.beginPath(); ctx.ellipse(0, 2 * k, 54 * k * r, 44 * k * r, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
  if (act > 0) {
    V2.glow(x, y + 6 * k, 230 * k, '255,214,140', (.18 + .3 * amp) * act, 'screen', .6);
    for (let j = 0; j < 4; j++) { const kk = (((lt - ch) * 1.3 - j * .26) % 1 + 1) % 1; V2.ring(x, y + 8 * k, kk, { color: '255,214,140', r0: 50 * k, r1: 330 * k, lw: 8 * k + 2, alpha: .8 * act, squash: .85 }); }
  }
}

// the set: corridor and desk (blurred in a close-up), the alarm rings and the colored light the domes throw on the cast
function hallSet(lt, blur) {
  V2.setLight({ key: [-.3, -.85], keyColor: '#cfd8ff', keyA: .16, rim: '#7f9cff', rimA: .5, shadow: '#0a0a1e', shadowA: .42, amb: '#aab4e8', ambA: .12 });
  V2.opts.reflect = true;
  const doors = DOORS8.map((d, i) => Object.assign({}, d, { dome: dome(i, lt), open: 0 })), burst = lt >= B('all').s, nLit = doors.filter(d => d.dome).length, ringAll = lt < B('m1').s - .05 || burst;
  V2.dof(blur, () => {
    S6.corridor({ doors, fog: '#4a5278', fogAmt: .5, wall: '#cfc6b4', wain: '#46707a', lampOn: lampOn(lt), bright: .72 * (1 - .5 * clamp((nLit - 3) / 14)) * (blur > 0 ? .8 : 1) * (1 - .55 * seg(lt, B('run').s + .3, B('run').e + .3)), signs: [] });
    S6.stationDesk({ lamps: doors.slice(0, 12).map(d => d.dome ? d.dome[1] : 0), colors: doors.slice(0, 12).map(d => d.dome ? d.dome[0] : '255,170,60') });
    paHorn(lt, blur);
    doors.forEach((d, i) => {
      if (!d.dome || !(ringAll || i % 2 === 0)) return;
      const [x, y, k] = V2.proj(d.side * 330, 480, d.z);
      for (let j = 0; j < (burst ? 2 : 1); j++) A6.ring(x, y, (((lt * 1.8 + hash(i) - j * .5) % 1) + 1) % 1, d.dome[2], { r0: 14 * k, r1: 340 * k + 40, lw: 7, alpha: .65 });
    });
  });
  for (const d of doors) if (d.dome) { const [x, y] = V2.proj(d.side * 330, 480, d.z); V2.addLight({ x, y, r: 800, color: d.dome[0], a: .7 * d.dome[1] * Math.min(1, 12 / nLit) }); }   // the cast is lit by the nearest dozen, not washed out by all 29
  return doors;
}

// ------------------------------------------------------------------ HUD: the ratio pill, in the shared top-right slot
function ratioHud(lt) {
  const s4 = B('s4'), s5 = B('s5'), run = B('run');
  const p4 = seg(lt, s4.s, s4.s + .3), out = 1 - seg(lt, run.s + .3, run.s + .8);
  if (p4 <= 0 || out <= 0) return;
  const x = 520, y = 128, w = 512, h = 112, cx = x + w / 2, cy = y + h / 2, mid = x + w / 2;
  const q5 = seg(lt, s5.s, s5.s + .3), hit = q5 > 0 ? 1 - easeOut(seg(lt, s5.s, s5.s + .28)) : 0;
  const sc = 1 + .16 * (1 - easeOut(p4)) + .1 * hit, sh = q5 > 0 && q5 < 1 ? 4 * Math.sin(lt * 90) * (1 - q5) : 0, red = q5 > 0 ? 1 - easeOut(seg(lt, s5.s, s5.s + .6)) : 0;
  reg('overlay', [cx + sh - w / 2 * sc, cy - h / 2 * sc, cx + sh + w / 2 * sc, cy + h / 2 * sc], { id: 'ratio' });
  ctx.save(); ctx.globalAlpha *= clamp(p4 * 3) * out; ctx.translate(cx + sh, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = 'rgba(10,8,22,.9)'; rr(x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  if (red > 0) { ctx.fillStyle = `rgba(255,70,90,${.28 * red})`; rr(mid, y, w / 2, h, 28); ctx.fill(); }
  ctx.strokeStyle = q5 > 0 ? `rgba(255,${Math.round(190 - 100 * red)},${Math.round(60 + 30 * red)},${.9 + .1 * Math.sin(T * 8)})` : 'rgba(255,190,60,.9)'; ctx.lineWidth = 4; rr(x, y, w, h, 28); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mid, y + 18); ctx.lineTo(mid, y + h - 18); ctx.stroke();
  // residents: a bed, and the count running up to forty
  const n = Math.round(40 * easeOut(seg(lt, s4.s + .05, s4.s + .55)));
  ctx.fillStyle = 'rgba(120,170,255,.18)'; ell(x + 50, cy, 34, 34); ctx.fill();
  ctx.fillStyle = '#7fb0ff'; ctx.strokeStyle = '#0c0812'; ctx.lineWidth = 3;
  rr(x + 31, cy - 4, 40, 13, 3); ctx.fill(); ctx.stroke(); rr(x + 29, cy - 17, 7, 30, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; rr(x + 38, cy - 10, 14, 8, 4); ctx.fill();
  text('RESIDENTS', x + 94, y + 32, { size: 21, fill: '#b8d0ff', align: 'left', spacing: 2 });
  text(String(n), x + 94, y + 84, { size: 64, font: 'Bangers', weight: 400, fill: n >= 40 ? '#ffffff' : '#bcd0f0', align: 'left', spacing: 2 });
  // nurses: an empty slot until "One nurse." punches the number in
  ctx.fillStyle = q5 > 0 ? 'rgba(255,90,122,.2)' : 'rgba(255,255,255,.08)'; ell(mid + 46, cy, 34, 34); ctx.fill();
  ctx.fillStyle = q5 > 0 ? '#ff5a7a' : 'rgba(255,255,255,.28)'; rr(mid + 30, cy - 7, 32, 14, 3); ctx.fill(); rr(mid + 39, cy - 16, 14, 32, 3); ctx.fill();
  text('NURSES', mid + 90, y + 32, { size: 21, fill: q5 > 0 ? '#ffb8c8' : '#7d7a90', align: 'left', spacing: 2 });
  if (q5 > 0) {
    ctx.save(); ctx.translate(mid + 90, y + 84); const k5 = lerp(1.5, 1, easeOut(q5)); ctx.scale(k5, k5);
    text('1', 0, 0, { size: 64, font: 'Bangers', weight: 400, fill: red > .3 ? '#ffffff' : '#ff5a7a', align: 'left', spacing: 2 }); ctx.restore();
  } else text('-', mid + 90, y + 82, { size: 56, font: 'Bangers', weight: 400, fill: '#5d5a70', align: 'left' });
  ctx.restore();
}

// the break sign: a coffee cup in a badge, crossed out when the answer is no
function breakSign(cx, cy, p, x) {
  if (p <= 0) return;
  const R = 90, k = easeBack(clamp(p));
  reg('overlay', [cx - R * k, cy - R * k, cx + R * k, cy + R * k], { id: 'nobreak', transit: Math.abs(k - 1) > .03 });
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 3);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 7; ctx.fillStyle = 'rgba(10,8,22,.92)'; ell(0, 0, R, R); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = x > 0 ? '#ff3b55' : '#ffd89a'; ctx.lineWidth = 6; ell(0, 0, R - 3, R - 3); ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 4;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-34, -8); ctx.lineTo(30, -8); ctx.lineTo(24, 30); ctx.quadraticCurveTo(-2, 40, -28, 30); ctx.closePath(); ctx.fill(); ctx.stroke();   // the cup
  ctx.beginPath(); ctx.arc(32, 6, 13, -1.3, 1.3); ctx.stroke(); ctx.fillStyle = '#7a4a22'; ell(-2, -8, 31, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4;   // steam
  for (const dx of [-14, 8]) { ctx.beginPath(); ctx.moveTo(dx, -20); ctx.bezierCurveTo(dx + 9, -30 + Math.sin(T * 4 + dx) * 3, dx - 9, -38, dx + 2, -50); ctx.stroke(); }
  if (x > 0) {   // the red slash, drawn on
    ctx.strokeStyle = '#ff3b55'; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(0, 0, R - 14, -2.4, -2.4 + TAU * clamp(x * 1.6), false); ctx.stroke();
    const sl = clamp((x - .35) * 2.4); if (sl > 0) { ctx.beginPath(); ctx.moveTo(-58, -58); ctx.lineTo(-58 + 116 * sl, -58 + 116 * sl); ctx.stroke(); }
  }
  ctx.restore();
}

// a puff of dust where the sprinter pushes off
function puff(wx, wz, u) {
  if (u <= 0 || u >= 1) return;
  const [x, y, k] = V2.proj(wx, 0, wz);
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI + .1, px = x + Math.cos(a) * (60 + 150 * u) * k * (i % 2 ? -1 : 1) * .8, py = y - 14 * k - 40 * u * k * (1 + i % 3 * .5), r = (38 + 46 * u) * k * (.7 + hash(i) * .6);
    ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(230,226,240,${.5 * (1 - u)})`], [1, 'rgba(230,226,240,0)']]); ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the scene
const SC = {
  // [shot, end] pairs: the cut falls a hair before each beat, the way the Episode 7 night scenes do
  shotAt(lt) {
    const b = id => B(id);
    const order = [['wide', b('s1').s - .05], ['cuS', b('m1').s - .05], ['two', b('s2').s - .05], ['cuS', b('m2').s - .05], ['cuM', b('chime').s - .05], ['pa', b('m3').s - .05], ['cuM', b('s3').s - .05], ['cuS', b('all').s - .05],
      ['blast', b('s4').s - .05], ['cuS', b('m4').s - .05], ['cuM', b('s6').s - .05], ['two', b('s6').e - .05], ['run', 1e9]];
    let t0 = 0; for (const [n, e] of order) { if (lt < e) return [n, t0, e]; t0 = e; }
  },
  shot: lt => SC.shotAt(lt)[0],
  cast(lt) {
    const b = id => B(id), run = b('run');
    const sExpr = pick(lt, [[b('s1').s, 'chill'], [b('m1').s, 'dead'], [b('s2').s, 'dead'], [b('m2').s, 'sour'], [b('pa1').s, 'dead'], [b('s3').s, 'sour'], [b('s3').e - .3, 'dead'], [b('all').s, 'smug'], [b('s6').s, 'dead'], [run.s - .1, 'smug'], [1e9, 'angry']]);
    const sLook = pick(lt, [[b('s1').s, [.35, .05]], [b('s2').s, [.5, .05]], [b('m2').s, [.5, .05]], [b('chime').s, [.5, .05]], [b('m3').s, [0, -.85]], [b('s3').s, [.5, 0]], [b('all').s, [0, .12]], [b('s6').s, [0, .08]], [run.s - .1, [.55, .05]], [1e9, [0, -.4]]]);
    const sArms = pick(lt, [[b('m1').s, { l: 'hips', r: 'rest' }], [b('s2').s, { l: 'hips', r: 'rest' }], [b('m2').s, { l: 'hips', r: 'shrug' }], [b('s6').s, { l: 'rest', r: 'rest' }], [run.s - .1, { l: 'rest', r: 'point' }], [run.s + .12, { l: 'rest', r: 'rest' }], [1e9, { l: 'run', r: 'run' }]]);
    const s0 = runner(straw, strawPath, lt, { look: sLook, expr: sExpr, arms: sArms, lid: lt < b('s1').s ? .5 : undefined }, 360);
    if (inB(lt, 's5')) { s0.arms = { l: 'rest', r: 'point' }; s0.hand = { r: 'point' }; s0.grip = { r: [58, 62] }; }   // "One nurse." and she points at herself
    const mExpr = pick(lt, [[b('s1').s, 'neutral'], [b('s2').s, 'happy'], [b('m2').s, 'neutral'], [b('chime').s, 'happy'], [b('pa1').s, 'shock'], [b('m3').s, 'hopeful'], [b('s3').s + .75, 'hopeful'], [b('all').s, 'sad'], [b('s4').s, 'panic'], [run.s + .6, 'sad'], [1e9, 'shock']]);
    const mLook = pick(lt, [[b('s1').s, [.3, -.55]], [b('chime').s, [-.5, .05]], [b('m3').s, [0, -.85]], [b('s3').e, [-.55, -.05]], [b('all').s, [-.4, .4]], [b('s4').s, [0, .12]], [b('m4').s, [-.5, .35]], [b('s6').s, [0, .15]], [run.s + .12, [-.55, .1]], [1e9, [-.45, -.35]]]);
    const mArms = pick(lt, [[b('m1').s, { l: 'rest', r: 'rest' }], [b('s2').s, { l: 'rest', r: 'cheer' }], [b('m2').s, { l: 'rest', r: 'rest' }], [b('chime').s, { l: 'rest', r: 'thumb' }], [b('m3').s - .2, { l: 'rest', r: 'rest' }], [b('s3').s + .25, { l: 'hold', r: 'hold' }], [b('all').s, { l: 'rest', r: 'rest' }], [b('s4').s, { l: 'up', r: 'up' }],
      [b('m4').s - .1, { l: 'rest', r: 'rest' }], [b('s6').s, { l: 'shrug', r: 'shrug' }], [run.s + .5, { l: 'rest', r: 'rest' }], [1e9, { l: 'wave', r: 'rest' }]]);
    const clasp = lt >= b('m3').s - .2 && lt < b('s3').s + .25;
    const m0 = mango(Object.assign(V2.at(...HS.mango), { look: mLook, expr: mExpr, arms: mArms, hand: clasp ? { l: 'open', r: 'open' } : undefined, grip: clasp ? { l: [-22, 98], r: [22, 98] } : undefined, rot: inB(lt, 'all') ? .035 * Math.sin(lt * 31) : undefined }));
    return { straw: s0, mango: m0 };
  },
  cam(lt) {
    const [sh, t0, t1] = SC.shotAt(lt), b = id => B(id), c = SC.cast(lt), k = seg(lt, t0, t1);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    if (sh === 'wide') zoomTo(540, lerp(990, 975, k), lerp(1, 1.08, k));
    else if (sh === 'cuS') faceZoom(c.straw, lerp(1.78, 1.96, k), 80);
    else if (sh === 'cuM') faceZoom(c.mango, lerp(1.9, 2.1, k), 80);
    else if (sh === 'two') zoomTo((c.straw.x + c.mango.x) / 2 - 14, 975, lerp(1.1, 1.16, k));
    else if (sh === 'pa') zoomTo(540, 992, lerp(1.10, 1.19, easeIO(k)));
    else if (sh === 'blast') {
      const all = b('all'), bump = [.1, .4, .7, 1.0].reduce((q, d) => q + Math.max(0, 1 - (lt - all.s - d) / .2) * (lt >= all.s + d ? 1 : 0), 0);
      zoomTo(540, 985, 1.04 + .03 * bump + .02 * k); CAM.shake = 7 * (1 - .4 * k);
    }
    else if (sh === 'run') { const e = easeIO(seg(lt, b('s6').e, b('run').e + .4)); zoomTo(540, lerp(985, 945, e), lerp(1.0, 1.12, e)); }
  },
  draw(lt) {
    const sh = SC.shot(lt), c = SC.cast(lt), b = id => B(id);
    const close = sh === 'cuS' || sh === 'cuM', subj = sh === 'cuS' ? 'straw' : sh === 'cuM' ? 'mango' : null;
    hallSet(lt, close ? 9 : 0);
    // the warm cast of the horn while it plays
    if (sh === 'pa') { const wq = V2.p2(0, 560, 1250); V2.addLight({ x: wq[0], y: wq[1], r: 900, color: '255,214,150', a: .55 * seg(lt, b('chime').s, b('chime').s + .2) }); }
    (subj && subj !== 'straw' ? nbr : drawChar)(c.straw);
    (subj && subj !== 'mango' ? nbr : drawChar)(c.mango);
    puff(HS.straw[0], HS.straw[1], seg(lt, b('run').s + .12, b('run').s + .75));
    V2.dust(60, 400, 1020, 1500, lt, { n: 26, alpha: .3, color: '200,215,255' });
  },
  fx: lt => {
    const b = id => B(id), all = b('all'), burst = lt >= all.s && lt < b('s4').s;
    const dim = seg(lt, b('run').s + .2, b('run').e + .3), end = seg(lt, CUR.dur - .38, CUR.dur - .02);
    return { bloom: .65 + .15 * burst, vignette: .55 + .1 * dim, grain: .06, contrast: .2, sat: .1 + .12 * burst, aberr: burst ? 3 : 0, tint: [['#3a54c8', .2, 'soft-light'], ['#0a1030', .12, 'multiply']],
      fade: Math.max(1 - seg(lt, 0, .3), .66 * dim, end), fadeColor: '0,0,12' };
  },
  blur: lt => { const sh = SC.shot(lt); return sh === 'blast' || sh === 'run' ? 5 : 1; },
  over(lt) {
    const b = id => B(id), sh = SC.shot(lt), o = b('open'), all = b('all'), ch = b('chime'), run = b('run');
    // the first lights of the night, named as they come on
    sfxWord(lt, o.s + .1, 'DING!', 800, 640, { fill: '#ffffff', size: 112, rot: .07 });
    sfxWord(lt, o.s + .5, 'BWEEP BWEEP', 330, 650, { fill: A6.ALARM.bed.hex, size: 92, rot: -.07, hold: .38 });
    sfxWord(lt, ch.s, 'DING DONG', 790, 660, { fill: '#ffe135', size: 104, rot: -.05, hold: .45 });
    // every alarm at once, each in its own color
    if (sh === 'blast') {
      sfxWord(lt, all.s + .1, 'BEEP', 250, 560, { fill: A6.ALARM.pump.hex, size: 120, rot: -.12, hold: .55 });
      sfxWord(lt, all.s + .4, 'PING', 830, 520, { fill: A6.ALARM.pulse.hex, size: 120, rot: .1, hold: .55 });
      sfxWord(lt, all.s + .7, 'HONK', 250, 670, { fill: A6.ALARM.chair.hex, size: 112, rot: -.08, hold: .5 });
      sfxWord(lt, all.s + 1.0, 'EEEE', 830, 670, { fill: A6.ALARM.door.hex, size: 112, rot: .08, hold: .5 });
    }
    if (sh === 'run') sfxWord(lt, run.s + .16, 'WHOOSH', 330, 640, { fill: '#ffe135', size: 110, rot: -.08, hold: .5 });
    // the hopeful break, and its answer
    const sg = seg(lt, b('m3').s + .1, b('m3').s + .4) * (1 - seg(lt, b('s3').e - .15, b('s3').e + .1));
    if (sg > 0) breakSign(900, 600, sg, seg(lt, wordT('s3', 'nobody', b('s3').s + .5), wordT('s3', 'nobody', b('s3').s + .5) + .35));
    ratioHud(lt);
  },
};

window.__EP8_SCENES = window.__EP8_SCENES || {};
window.__EP8_SCENES.hall = SC;
})();
