'use strict';
/* SHIFT HAPPENS, Episode 6: Alarm Fatigue.
 *
 * Thirty-one alarms, four matter, and the one everybody answers is the microwave.
 * Built on the v2 renderer (v2_core.js, v2_char.js): perspective sets (ep6_sets.js, ep6_rooms.js), new fruit and graphics
 * (ep6_art.js), scenes here. Every position below is a world coordinate: X right, Z forward, from V2.at(X, Z). */
(() => {
if (!window.TIMELINE_EP6) return;
const { straw, mango, pear, lime, pom } = window.A6;
const A6 = window.A6;
const inB = (lt, id) => lt >= B(id).s && lt < B(id).e;
const aft = (lt, id) => lt >= B(id).e;
const bef = (lt, id) => lt < B(id).s;
const lerpA = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// distance walked along a path fn(t) -> [X, Z], integrated from t = 0 (world units: drives the gait so feet do not slide)
function pathDist(fn, lt) {
  let d = 0, p = fn(0);
  for (let t = .04; ; t += .04) { const tt = Math.min(t, lt), q = fn(tt); d += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; if (tt >= lt) break; }
  return d;
}
// a character placed on a path: position, gait, lean and facing all come from the same function of time
function person(ctor, fn, lt, extra = {}) {
  const [X, Z] = fn(lt), q = V2.at(X, Z), dt = .03, a = fn(lt - dt), b = fn(lt + dt);
  const vX = (b[0] - a[0]) / (2 * dt), vZ = (b[1] - a[1]) / (2 * dt), speed = Math.hypot(vX, vZ);
  const o = Object.assign(q, extra);
  if (speed > 9) {
    const axisZ = Math.abs(vZ) > Math.abs(vX) * 1.2;
    o.gaitW = pathDist(fn, lt); o.axis = axisZ ? 'z' : 'x'; o.dir = axisZ ? -Math.sign(vZ) : Math.sign(vX); o.vx = vX * q.s;
  }
  return ctor(o);
}
const still = (X, Z) => () => [X, Z];
// a dashing character: the legs cycle at a readable rate whatever the speed, so nothing strobes at 30 fps
function runner(ctor, fn, lt, extra = {}, rate = 300) {
  const [X, Z] = fn(lt), q = V2.at(X, Z), dt = .03, a = fn(lt - dt), b = fn(lt + dt), vX = (b[0] - a[0]) / (2 * dt), vZ = (b[1] - a[1]) / (2 * dt), sp = Math.hypot(vX, vZ);
  const o = Object.assign(q, extra);
  if (sp > 30) { const axisZ = Math.abs(vZ) > Math.abs(vX) * 1.2; o.gaitW = lt * rate; o.axis = axisZ ? 'z' : 'x'; o.dir = axisZ ? -Math.sign(vZ) : Math.sign(vX); o.vx = clamp(vX * q.s, -1400, 1400); }
  return ctor(o);
}
const move = (t0, t1, a, b, ease = easeIO) => lt => [lerp(a[0], b[0], ease(seg(lt, t0, t1))), lerp(a[1], b[1], ease(seg(lt, t0, t1)))];
// aim the 2D camera so a point in scene coordinates sits at the frame center, zoomed
const zoomTo = (x, y, z) => { CAM.x = x; CAM.y = y; CAM.z = z; };
// a character's face center (between the eyes and the mouth) in scene coordinates, from its own proportions
const faceC = o => { const k = KINDS[o.kind], legLen = o.noLegs ? 0 : (k.leg || 90), s = o.s || 1; return [o.x, o.y - (o.lift || 0) - (legLen + k.ry * .9 - (k.eyeY + k.mouthY) / 2) * s]; };
// frame a face for a close-up: the face lands `up` pixels above the center of the frame, clear of the caption zone
const faceZoom = (o, z, up = 90) => { const [fx, fy] = faceC(o); zoomTo(fx, fy + up / z, z); };
const faceOf = (q, k = 300) => [q.x, q.y - k * q.s];
// in a close-up everyone but the subject is a neighbor at the edge of the frame or out of focus: drawn, but not held to the layout audit
const drawBg = o => { REG.suppress++; drawChar(o); REG.suppress--; };
const drawCast = (list, subject) => { for (const o of list) { if (subject && o.kind !== subject) drawBg(o); else drawChar(o); } };

const SCENES = {};

// ============================================================================ the lobby, 2:59 PM
SCENES.lobby = {
  cam(lt) {
    V2.setCam({ f: 1500, cy: 300, hy: 900, cz: 0 });
    const c = B('beep'), s3 = B('s3');
    if (lt >= c.s + .12) { const k = easeOut(seg(lt, c.s + .12, c.s + .45)), p = person(straw, SCENES.lobby.path, lt); { const [fx, fy] = faceC(p); zoomTo(...lerpA([W / 2, H / 2], [fx, fy + 90 / 1.9], k), lerp(1, 1.9, k)); } }
    if (lt >= s3.s) { const k = seg(lt, s3.s, s3.e); CAM.z += .06 * k; }
  },
  path: lt => lt < .6 ? [0, 1700] : lt < 5.0 ? [0, lerp(1700, 1010, easeIO(seg(lt, .6, 5.0)))] : [0, 1010],
  draw(lt) {
    const door = B('door'), s2 = B('s2'), bp = B('beep'), s3 = B('s3');
    V2.setLight({ key: [.25, -.55], keyColor: '#ffe2b0', keyA: .22, rim: '#ffc27a', rimA: .55, shadow: '#2a1428', shadowA: .42, back: { color: '255,218,160', a: .95, w: 26 }, frontDark: .4, shadowLong: .9,
      bounce: '#ffd29a', bounceA: .22, amb: '#ffe2c0', ambA: .08 });
    V2.opts.reflect = true;
    const open = easeOut(seg(lt, door.s + .2, door.s + .9));
    V2.dof(lt >= bp.s + .1 ? 7 : 0, () => S6.lobby({ doorOpen: open, sun: 1 }));
    V2.dust(60, 500, 1020, 1500, lt, { n: 90, alpha: .75, size: 3.2, speed: 10 });
    const p = SCENES.lobby.path(lt);
    const walking = lt > .6 && lt < 5.0;
    const sip = seg(lt, s2.s - .1, s2.s + .5) * (1 - seg(lt, s2.e - .1, s2.e + .3));
    const alert = lt >= bp.s;
    drawChar(person(straw, SCENES.lobby.path, lt, {
      stride: 42, look: alert ? [.0, .15] : [.7, -.1], expr: lt < B('s1').s ? 'neutral' : alert ? (lt >= s3.s ? 'dead' : 'shock') : 'chill',
      lid: lt >= s2.s - .1 && lt < bp.s ? .55 : undefined, hold: { r: 'coffee' },
      arms: { l: walking ? [.28 + .35 * Math.sin(pathDist(SCENES.lobby.path, lt) / 84 * PI), .25] : 'rest', r: sip > 0 ? [1.95, 1.7] : alert ? [1.95, 1.7] : 'hold' },
    }));
    if (open > .05) V2.flare(...V2.p2(0, 240, 1750), .35 * open * (alert ? .4 : 1));
    // the alarms begin: rings climb in from the screen edges
    if (lt >= bp.s) {
      V2.ring(40, 760, ((lt - bp.s - .0) % .9) / .9, { color: A6.ALARM.chair.rgb, r1: 560, lw: 8, alpha: .5 });
      if (lt > bp.s + .35) V2.ring(1040, 980, ((lt - bp.s - .35) % 1.1) / 1.1, { color: A6.ALARM.pulse.rgb, r1: 520, lw: 8, alpha: .5 });
      if (lt > bp.s + .6) V2.ring(540, 1500, ((lt - bp.s - .6) % 1.0) / 1.0, { color: A6.ALARM.bed.rgb, r1: 600, lw: 8, alpha: .45 });
    }
  },
  fx: lt => ({ bloom: .55, contrast: .14, sat: .16, vignette: .5, tint: [['#ff9a40', .2, 'soft-light']], fade: 1 - easeOut(seg(lt, 0, .45)), fadeColor: '255,240,210' }),
  blur: lt => lt > 1 && lt < 5 ? 2 : 1,
  over() {},
};

// ============================================================================ title
SCENES.title = {
  noChyron: true,
  cam(lt) { const hit = B('logo').s + 2.2; CAM.shake = lt > hit && lt < hit + .6 ? 22 * (1 - (lt - hit) / .6) : 0; },
  draw(lt) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0c26'); g.addColorStop(.55, '#1c1250'); g.addColorStop(1, '#0a0820');
    ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, H + 200);
    const hit = B('logo').s + 2.2, kinds = ['chair', 'pump', 'pulse', 'bed', 'door', 'call'];
    // the sting's arpeggio: a ring on every note, a big one on each downbeat
    for (let i = 0; i < 8; i++) { const t0 = B('logo').s + i * .25; A6.ring(540, 930, (lt - t0) / 1.3, kinds[i % 6], { r1: 340 + i * 30, lw: 7, alpha: .8 }); }
    for (const [i, t0] of [0, 1, 2].map((v, i) => [i, B('logo').s + v])) A6.ring(540, 930, (lt - t0) / 1.8, kinds[(i * 2) % 6], { r0: 40, r1: 900, lw: 16, alpha: .55 });
    A6.ring(540, 930, (lt - hit) / 1.6, 'door', { r0: 60, r1: 1300, lw: 26, alpha: .9 });
    // a monitor trace running across the frame, spiking with each note, then flaring on the hit
    const prog = clamp((lt - B('logo').s) / 2.2), y0 = 930;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const u = i / 160, x = -40 + u * (W + 80); if (u > prog) break;
      const beat = ((u * 2.2) % .25) / .25, spike = Math.exp(-Math.pow((beat - .35) * 9, 2)) * (beat < .55 ? -1 : .5);
      pts.push([x, y0 + spike * 150 * (1 - .4 * u)]);
    }
    for (const [lw, a] of [[18, .12], [8, .3], [3.5, 1]]) { ctx.strokeStyle = `rgba(110,255,170,${a})`; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
    if (pts.length) { const [hx, hy] = pts[pts.length - 1]; V2.emit(hx, hy, 70, '120,255,180', 1); ctx.fillStyle = '#eaffef'; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, TAU); ctx.fill(); }
    ctx.restore();
    // the logo slams on the final chord
    const k = seg(lt, hit, hit + .4);
    if (k > 0) {
      const sc = lerp(1.8, 1, easeOut(k)), a = clamp(k * 3);
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(540, 700); ctx.scale(sc, sc);
      text('SHIFT HAPPENS', 0, 0, { size: 124, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 20, stroke: '#150f22', spacing: 4, shadow: 24 });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp((lt - hit - .1) * 4); ctx.translate(540, 940); ctx.scale(lerp(1.5, 1, easeOut(seg(lt, hit + .1, hit + .5))), lerp(1.5, 1, easeOut(seg(lt, hit + .1, hit + .5))));
      text('ALARM', 0, -70, { size: 220, font: 'Bangers', weight: 400, fill: '#fff', lw: 24, stroke: '#150f22', spacing: 6, shadow: 30 });
      text('FATIGUE', 0, 130, { size: 220, font: 'Bangers', weight: 400, fill: '#ff4a5e', lw: 24, stroke: '#150f22', spacing: 6, shadow: 30 });
      ctx.restore();
      V2.glow(540, 940, 760, '255,70,90', .28 * a, 'screen', .8);
      const chip = easeBack(seg(lt, hit + .35, hit + .75));
      if (chip > 0) { ctx.save(); ctx.translate(540, 1260); ctx.scale(chip, chip); ctx.fillStyle = '#ff3b55'; rr(-150, -34, 300, 68, 34); ctx.fill(); ctx.strokeStyle = '#150f22'; ctx.lineWidth = 6; ctx.stroke(); text('EPISODE 6', 0, 3, { size: 40, fill: '#fff', spacing: 3 }); ctx.restore(); }
    }
  },
  fx: lt => { const hit = B('logo').s + 2.2; return { bloom: .9, vignette: .55, grain: .06, aberr: lt > hit && lt < hit + .5 ? 9 * (1 - (lt - hit) / .5) : 0, fade: lt < .3 ? 1 - lt / .3 : 0 }; },
  blur: lt => lt > B('logo').s + 2.1 && lt < B('logo').s + 2.7 ? 3 : 1,
  over() {},
};

// ============================================================================ the hallway shared by the station, run, still and ding scenes
const HALL = [
  { side: -1, z: 1700, n: '12', color: '#6d8f88' }, { side: -1, z: 2500, n: '4', color: '#9d6b74' }, { side: -1, z: 3300, n: '8', color: '#a8744f' },
  { side: -1, z: 4100, n: '16', color: '#9d6b74' }, { side: -1, z: 4900, n: '20', color: '#a8744f' }, { side: -1, z: 5700, n: '24', color: '#6d8f88' }, { side: -1, z: 6500, n: '28', color: '#9d6b74' },
  { side: 1, z: 1300, n: '7', color: '#9d6b74' }, { side: 1, z: 2100, n: '5', color: '#6d8f88' }, { side: 1, z: 2900, n: '3', color: '#8e6f55' },
  { side: 1, z: 3700, n: '9', color: '#8e6f55' }, { side: 1, z: 4500, n: '11', color: '#6d8f88' }, { side: 1, z: 5300, n: '13', color: '#9d6b74' }, { side: 1, z: 6100, n: '15', color: '#8e6f55' }, { side: 1, z: 6900, n: '17', color: '#6d8f88' },
];
const KINDS6 = ['chair', 'pump', 'pulse', 'bed', 'call', 'door'];
// a flickering dome for background alarms: density 0..1 says how much of the building is going off
function bgDome(i, lt, dens) {
  if (hash(i + 60) > dens + .12) return null;
  const per = 1.5 + hash(i) * 1.7, u = ((lt + hash(i + 30) * per) % per) / per;
  const on = u < .2 + .3 * dens ? 1 : 0;
  return on ? [A6.ALARM[KINDS6[i % 6]].rgb, .6 + .4 * Math.sin(lt * 15 + i)] : null;
}
const flick = (lt, t0, t1, rate = 3) => lt >= t0 && lt <= t1 ? (Math.sin((lt - t0) * TAU * rate) > -.25 ? 1 : .15) : 0;
const domeXY = (side, z, camP) => V2.proj(side * 330, 480, z);
// the doors for this frame: key alarms by (side, number), everything else from the building's background noise
function hallDoors(lt, dens, key = {}) {
  return HALL.map((d, i) => {
    const k = key[d.n], dome = k ? (k[2] ? [A6.ALARM[k[2]].rgb, k[0]] : null) : bgDome(i, lt, dens);
    return Object.assign({}, d, { dome: dome && dome[1] > .02 ? dome : null, open: d.open ?? 0 });
  });
}

// ============================================================================ the nurses' station, 3:05 PM
SCENES.station = {
  shot(lt) {
    const b = id => B(id);
    if (lt < b('s1').s) return 'wide';
    if (lt < b('s1').s + .85) return 'cuS';
    if (lt < b('s2').s + 1.0) return 'wide12';
    if (lt < b('l1').e + .1) return 'room12';
    if (lt < b('s4').s - .1) return 'two';
    if (lt < b('m3').s - .1) return 'pump';
    if (lt < b('s6').s - .1) return 'two';
    if (lt < b('m4').s - .1) return 'pulse';
    if (lt < b('s7').s - .1) return 'cuM';
    if (lt < b('s8').s - .1) return 'thumb';
    if (lt < b('s9').s - .1) return 'exit';
    if (lt < b('p1').s - .1) return 'clock';
    if (lt < b('m5').s - .1) return 'pear';
    if (lt < b('s10').s - .1) return 'two';
    if (lt < b('s12').s - .1) return 'wideEnd';
    return 'cuS2';
  },
  // blocking: Strawberry holds the station, Mango arrives from the right during the first line
  straw: lt => [-175, 1040],
  mango: lt => [lerp(760, 140, easeOut(seg(lt, .0, 1.25))), 1010],
  cam(lt) {
    const sh = SCENES.station.shot(lt), sp = person(straw, SCENES.station.straw, lt), mp = person(mango, SCENES.station.mango, lt);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    if (sh === 'cuS' || sh === 'cuS2') { const k = sh === 'cuS2' ? seg(lt, B('s12').s - .1, B('s12').e) : seg(lt, B('s1').s, B('s1').s + .85); faceZoom(sp, lerp(2.15, sh === 'cuS2' ? 2.5 : 2.4, k), sh === 'cuS2' ? 60 : 90); }
    else if (sh === 'cuM') faceZoom(mp, 2.2);
    else if (sh === 'two') { const m = (sp.x + mp.x) / 2; zoomTo(m, sp.y - 250 * sp.s, 1.26); }
    else if (sh === 'wideEnd') { const k = easeIO(seg(lt, B('m5').e, B('s11').e)); V2.setCam({ f: 1400, cy: 360, hy: 860, cz: -420 * k }); }
    else if (sh === 'wide' || sh === 'wide12') { const k = seg(lt, 0, 3.4); zoomTo(540 + 0, 960 + 0, 1 + .06 * k); }
  },
  draw(lt) {
    const sh = SCENES.station.shot(lt), s = id => B(id), isIns = ['pump', 'pulse', 'thumb', 'exit', 'clock', 'pear'].includes(sh);
    // ---- inserts: full-frame macro shots
    if (sh === 'pump') { A6.insPump(lt - s('s4').s, 1, seg(lt, s('s4').e - .5, s('s4').e - .3)); return; }
    if (sh === 'pulse') { A6.insPulse(lt - s('s6').s, lt > s('s6').s + .9 ? 1 : 0, 0); return; }
    if (sh === 'thumb') { A6.insPulse(lt - s('s7').s, seg(lt, s('s7').s + 1.2, s('s7').s + 1.6), seg(lt, s('s7').s + .2, s('s7').s + .3)); return; }
    if (sh === 'clock') { A6.insClock(lt - s('s9').s, 1); return; }
    if (sh === 'room12') { SCENES.station.room12(lt); return; }
    if (sh === 'exit' || sh === 'pear') { SCENES.station.exitShot(lt, sh); return; }
    // ---- the hall
    V2.setLight({ key: [-.3, -.85], keyColor: '#f4f6ff', keyA: .22, rim: '#8fb8ff', rimA: .45, shadow: '#1a1830', shadowA: .3, amb: '#dfe6ff', ambA: .05 });
    V2.opts.reflect = true;
    const dens = lerp(.18, 1, easeIO(seg(lt, s('s3').s, s('s10').s))) ;
    const key = {
      '12': [flick(lt, s('s1').s, s('s1').s + 1.5) + .0, 0, 'chair'], '4': [flick(lt, s('s4').s, s('s4').s + 1.5), 0, 'pump'], '7': [flick(lt, s('s6').s, s('s6').s + 1.5), 0, 'pulse'],
    };
    for (const n of ['12', '4', '7']) if (key[n][0] <= 0) key[n] = [.0, 0, null];
    const doors = hallDoors(lt, dens, key);
    const blurPx = sh === 'cuS' || sh === 'cuS2' || sh === 'cuM' ? 9 : sh === 'two' ? 4 : 0;
    V2.dof(blurPx, () => {
      S6.corridor({ doors, fog: '#c4cfe2', fogAmt: .32, signs: [{ z: 1500, text: 'ROOMS 1 - 30', c: '#2a5a9a' }, { z: 3400, text: 'EXIT  >', c: '#1a7a4a' }], decor: [{ side: -1, z: 2100, c: '#e6a23c' }, { side: 1, z: 1700, c: '#6cc1d9' }, { side: 1, z: 3300, c: '#d96c8a' }, { side: -1, z: 4500, c: '#9bd96c' }] });
      S6.stationDesk({ lamps: doors.slice(0, 12).map(d => d.dome ? d.dome[1] : 0), colors: doors.slice(0, 12).map(d => d.dome ? d.dome[0] : '255,170,60') });
    });
    for (const d of doors) if (d.dome) { const [x, y] = V2.proj(d.side * 330, 480, d.z); V2.addLight({ x, y, r: 800, color: d.dome[0], a: .7 * d.dome[1] }); }
    // rings from the key domes
    for (const [n, kind, t0] of [['12', 'chair', s('s1').s], ['4', 'pump', s('s4').s], ['7', 'pulse', s('s6').s]]) {
      const d = HALL.find(h => h.n === n), [x, y, k] = V2.proj(d.side * 330, 480, d.z);
      A6.pulse(x, y, lt, t0, t0 + 1.5, kind, 3, { r0: 14 * k, r1: 340 * k + 60, lw: 7, alpha: .85, life: .9 });
    }
    // people
    const sp = person(straw, SCENES.station.straw, lt, { arms: { l: 'rest', r: 'rest' } }), mp = person(mango, SCENES.station.mango, lt);
    const mTalk = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'].some(id => inB(lt, id));
    const eyes = lt < s('s3').s ? .86 : (lt >= s('s4').s && lt < s('s4').e + .2 ? .86 : undefined);
    (sh === 'cuM' ? drawBg : drawChar)(Object.assign(sp, { lid: eyes, expr: lt < s('s1').s ? 'chill' : inB(lt, 's5') ? 'dead' : inB(lt, 's3') || inB(lt, 's7') || lt >= s('s12').s ? 'smug' : 'chill', look: [.5, -.15],
      arms: { l: 'rest', r: inB(lt, 's1') || inB(lt, 's4') || inB(lt, 's6') ? 'point' : 'rest' } }));
    (sh === 'cuS' || sh === 'cuS2' ? drawBg : drawChar)(Object.assign(mp, { transit: lt < 1.4, hold: sh === 'cuM' ? undefined : { l: 'clipboard6' }, grip: { l: [-88, 62] }, look: [-.7, 0], expr: lt >= s('m7').s && lt < s('s12').s ? 'sad' : lt >= s('s10').s ? 'shock' : inB(lt, 'm3') ? 'shock' : 'neutral',
      arms: { l: sh === 'cuM' ? 'rest' : 'hold', r: mTalk ? 'up' : 'rest' }, clipText: 'ALARMS' }));
    V2.dust(60, 600, 1020, 1400, lt, { n: 40, alpha: .4 });
  },
  // Room 12: Mr. Lime in his chair, bouncing on the pressure pad
  room12(lt) {
    const c1 = B('c1'), l1 = B('l1');
    V2.setCam({ f: 1400, cy: 340, hy: 860 });
    V2.setLight({ key: [.6, -.5], keyColor: '#ffd9a0', keyA: .25, rim: '#ffb45a', rimA: .55, shadow: '#2a1a28', shadowA: .34, amb: '#ffe8c8', ambA: .06 });
    V2.opts.reflect = true;
    V2.dof(3, () => S6.patientRoom({}));
    const hits = [c1.s + .1, c1.s + .55, c1.s + 1.0, l1.s + .05], t = lt;
    let hop = 0; for (const h of hits) { const k = (t - h) / .42; if (k > 0 && k < 1) hop = Math.max(hop, Math.sin(k * PI) * (h === l1.s + .05 ? 90 : 34)); }
    const pos = V2.at(-30, 820), seat = pos.y - 150 * pos.s;
    S6.chair3(-30, 880, { color: '#8a5a34', w: 52, d: 46, seat: 140, back: 300 });
    drawChar(lime(Object.assign({ x: pos.x, y: seat - hop * .9, s: pos.s * .98, noLegs: true, look: [.0, -.1], expr: inB(lt, 'l1') ? 'happy' : 'smug', talk: inB(lt, 'l1') ? undefined : 0,
      arms: { l: 'rest', r: inB(lt, 'l1') ? 'cheer' : 'rest' }, squash: hop > 4 ? -.08 : .06, noShadow: true })));
    S6.box3({ x0: -82, x1: 22, y0: 140, y1: 164, z0: 834, z1: 926, color: '#b0452e', top: '#c85a40', side: '#8a3322' });   // the seat in front of his body
    // the pad's amber pulse and the CHAIR ALARM tag
    const [px, py] = V2.p2(-30, 170, 880);
    for (const h of hits.slice(0, 3)) A6.ring(px, py, (lt - h) / 1.0, 'chair', { r0: 30, r1: 420, lw: 8, alpha: .8 });
    if (lt >= c1.s - .2) A6.tag(540, 520, 'chair', 'CHAIR ALARM  RM 12', easeOut(seg(lt, c1.s - .2, c1.s + .15)), {});
    V2.glow(px, py, 200, '255,170,40', .4 * Math.max(0, 1 - ((lt - c1.s) % .45) / .45) * (lt >= c1.s ? 1 : 0), 'screen', .4);
  },
  // the exit: Mr. Pear at the end of the hall, door alarm going
  exitShot(lt, sh) {
    const s8 = B('s8'), p1 = B('p1');
    const near = sh === 'pear';
    V2.setCam({ f: 1400, cy: 360, hy: 860, cz: 5900 });
    V2.setLight({ key: [-.3, -.85], keyColor: '#f4f6ff', keyA: .2, rim: '#ff6a5a', rimA: .5, shadow: '#1a1830', shadowA: .3 });
    V2.opts.reflect = true;
    const red = flick(lt, s8.s, s8.s + 2.6, 2.2);
    V2.dof(near ? 7 : 2, () => S6.corridor({ doors: HALL.filter(d => d.z > 6000).map(d => Object.assign({}, d, { dome: red > 0 ? [A6.ALARM.door.rgb, red] : null })), fog: '#b9c6da', fogAmt: .4, zFar: 7600 }));
    const sirenX = 540, sirenY = 620;
    A6.pulse(sirenX, sirenY, lt, s8.s, s8.s + 2.6, 'door', 2.2, { r0: 40, r1: 700, lw: 12, alpha: .75, life: 1.1 });
    V2.addLight({ x: 540, y: 700, r: 900, color: A6.ALARM.door.rgb, a: .7 * red });
    const pp = V2.at(0, near ? 6900 : 6980);
    if (near) { zoomTo(pp.x, pp.y - 280 * pp.s, 2.3); }
    drawChar(pear(Object.assign(pp, { look: [0, .3], expr: near ? 'smug' : 'neutral', watchMin: 20, watchHr: 3, hold: { l: 'pocketwatch' }, arms: { l: 'hold', r: 'rest' } })));
    if (!near) A6.tag(540, 470, 'door', 'EXIT DOOR  MR. PEAR', easeOut(seg(lt, s8.s + .1, s8.s + .4)), {});
  },
  fx: lt => { const sh = SCENES.station.shot(lt); return { bloom: .5, vignette: .42, grain: .045, contrast: .17, sat: .16, tint: sh === 'room12' ? [['#ff9a40', .16, 'soft-light']] : [['#8fb0ff', .1, 'soft-light']] }; },
  blur: lt => 1,
  over(lt) {
    const s = id => B(id), sh = SCENES.station.shot(lt);
    const n31 = seg(lt, s('s10').e - .05, s('s10').e + .95), f31 = 1 - seg(lt, s('s10').e + .8, s('s10').e + 1.1);
    A6.slam(Math.min(n31, f31), '31', 420, { size: 300, sub: 'ALARMS', fill: '#ffbe3c' });
    const n4 = seg(lt, s('s11').e - .05, s('s11').e + .95), f4 = 1 - seg(lt, s('s11').e + .8, s('s11').e + 1.1);
    A6.slam(Math.min(n4, f4), '4', 445, { size: 300, sub: 'MATTER', fill: '#ff5a6a' });
    if (lt >= s('s10').e + 1.1) A6.hud(31, { appear: seg(lt, s('s10').e + 1.1, s('s10').e + 1.45), matter: lt >= s('s11').e + .9 ? 1 : 0 });
  },
};

// ============================================================================ helpers shared by the later scenes
// where a screen point falls in a character's local coordinates (so a hand can be aimed at it)
function localOf(o, x, y) {
  const k = KINDS[o.kind], legLen = o.noLegs ? 0 : (k.leg || 90), s = o.s || 1;
  const u = (x - o.x) / s * (o.flip ? -1 : 1), v = (y - o.y + (o.lift || 0)) / s + (legLen + k.ry * .9);
  return [u, v];
}
// aim an arm at a screen point; the hand stops short of full reach so the pose is always legal
function pointAt(o, side, x, y, frac = .9) {
  const k = KINDS[o.kind], [sx, sy] = shoulder(k, side), [u, v] = localOf(o, x, y), reach = ((k.arm1 || 56) + (k.arm2 || 52)) * (o.armScale || 1.12) * frac;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d);
  o.grip = Object.assign(o.grip || {}, { [side < 0 ? 'l' : 'r']: [sx + dx * f, sy + dy * f] });
  o.hand = Object.assign(o.hand || {}, { [side < 0 ? 'l' : 'r']: 'point' });
  o.arms = Object.assign(o.arms || {}, { [side < 0 ? 'l' : 'r']: 'hold' });
  return o;
}
const smokeHaze = (a, y0 = 0, y1 = 900) => { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = V2.grad(0, y0, 0, y1, [[0, `rgba(60,56,64,${.85 * a})`], [.55, `rgba(80,76,86,${.4 * a})`], [1, 'rgba(90,86,96,0)']]); ctx.fillRect(0, y0, W, y1 - y0); ctx.restore(); };

// ============================================================================ the run, 4:10 PM
SCENES.run = {
  count(lt) {
    // the counter: 31, minus one for every alarm silenced, then the building answers back with nine more
    const hits = [.55, 1.3, 2.2, 3.0, 3.8, 4.5].filter(h => lt >= h).length, jump = lt >= 5.2 ? 9 + hits : 0;
    return lt < 5.2 ? 31 - hits : 31 - 6 + 9 + Math.floor(seg(lt, 5.2, 5.8) * 4);
  },
  shot(lt) {
    if (lt < 6.3) {
      if (lt < .75) return 'm1'; if (lt < 1.5) return 'm2'; if (lt < 3.4) return 'map'; if (lt < 4.1) return 'm3'; if (lt < 5.0) return 'zip'; return 'm4';
    }
    if (lt < B('s2').s - .1) return 'two';
    if (lt < B('s3').s) return 'two';
    if (lt < B('m4').s) return 'cuS';
    if (lt < B('m5').s - .1) return 'two2';
    if (lt < B('s5').s - .1) return 'cuS';
    return 'steth';
  },
  cam(lt) {
    const sh = SCENES.run.shot(lt);
    const cams = { m1: { cx: -90, cy: 300, cz: 700, hy: 800, f: 1400 }, m2: { cx: 160, cy: 300, cz: 900, hy: 900, f: 1400 }, m3: { cx: 0, cy: 560, cz: 500, hy: 760, f: 1400 }, zip: { cx: 0, cy: 330, cz: 0, hy: 860, f: 1400 } };
    V2.setCam(cams[sh] || { f: 1400, cy: 360, hy: 860 });
    if (sh === 'm1') CAM.r = -.05; if (sh === 'm3') CAM.r = .05; if (sh === 'zip') CAM.shake = 7;
    if (sh === 'cuS') faceZoom(person(straw, () => [-190, 1040], lt), 2.0); if (sh === 'two2') zoomTo(540, 980, 1.35);
    if (sh === 'two') { const k = seg(lt, B('m1').s, B('s2').e); zoomTo(540, 1000, 1.25 + .1 * k); }
  },
  draw(lt) {
    const sh = SCENES.run.shot(lt), s = id => B(id);
    if (sh === 'map') { SCENES.run.mapShot(lt); return; }
    if (sh === 'steth') { A6.insSteth(lt - s('s5').s, 1); return; }
    V2.setLight({ key: [-.3, -.85], keyColor: '#f4f6ff', keyA: .2, rim: '#8fb8ff', rimA: .45, shadow: '#1a1830', shadowA: .3, amb: '#dfe6ff', ambA: .05 });
    V2.opts.reflect = true;
    // domes: a storm of alarms, with the ones near the action dying as she hits them
    const killAt = { m1: [.55, '12', 'chair'], m2: [1.3, '7', 'pulse'] };
    const dens = lt < 5 ? .95 : 1;
    const key = {};
    if (lt >= .55 && lt < 1.3) key['12'] = [0, 0, null]; else if (lt >= 1.3) key['12'] = [0, 0, null];
    const doors = hallDoors(lt, dens, key);
    const blurPx = sh === 'cuS' ? 9 : sh === 'two' || sh === 'two2' ? 4 : 0;
    const pumpX = 30, pumpZ = 1250;
    V2.dof(blurPx, () => { S6.corridor({ doors, ch: 700, fog: '#c4cfe2', fogAmt: .32, signs: [{ z: 1500, text: 'ROOMS 1 - 30', c: '#2a5a9a' }, { z: 3400, text: 'EXIT  >', c: '#1a7a4a' }] }); S6.stationDesk({ lamps: doors.slice(0, 12).map(d => d.dome ? d.dome[1] : 0), colors: doors.slice(0, 12).map(d => d.dome ? d.dome[0] : '255,170,60') }); });
    for (const d of doors) if (d.dome) { const [x, y] = V2.proj(d.side * 330, 480, d.z); V2.addLight({ x, y, r: 800, color: d.dome[0], a: .7 * d.dome[1] }); }
    // rings from a handful of the lit domes
    doors.forEach((d, i) => { if (!d.dome || i % 3) return; const [x, y, k] = V2.proj(d.side * 330, 480, d.z); A6.ring(x, y, ((lt * 1.6 + hash(i)) % 1), KINDS6[i % 6], { r0: 14 * k, r1: 360 * k + 40, lw: 7, alpha: .7 }); });
    // the dash: speed lines streaming out of the vanishing point
    if (sh === 'zip') {
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 56; i++) { const a = hash(i + 4) * TAU, r0 = 240 + 380 * hash(i + 9) + 900 * ((lt * 2.3 + hash(i)) % 1), len = 160 + 360 * hash(i + 2);
        ctx.strokeStyle = `rgba(24,44,120,${.1 + .2 * hash(i + 6)})`; ctx.lineWidth = 2 + 6 * hash(i + 7); ctx.beginPath(); ctx.moveTo(540 + Math.cos(a) * r0, 860 + Math.sin(a) * r0 * 1.2); ctx.lineTo(540 + Math.cos(a) * (r0 + len), 860 + Math.sin(a) * (r0 + len) * 1.2); ctx.stroke(); }
      ctx.restore();
    }
    // the people
    if (lt < 6.3) SCENES.run.montageCast(lt, sh); else SCENES.run.talkCast(lt, sh);
    V2.dust(60, 600, 1020, 1400, lt, { n: 36, alpha: .35 });
  },
  mapShot(lt) {
    A6.bokeh(lt, ['80,165,255', '120,255,170'], ['#070b22', '#101a3a']);
    const hits = [.55, 1.3, 2.2, 3.0].filter(h => lt >= h).length;
    const card = A6.mapCard(lt, { appear: easeOut(seg(lt, 1.45, 1.75)), dots: [], route: null });
    if (!card) return;
    const { hx0, hx1, hy, hh } = card;
    const dots = []; for (let i = 0; i < 16; i++) { const rx = hx0 + 58 + (i % 8) * 108, ry = i < 8 ? hy - hh / 2 - 100 : hy + hh / 2 + 100; if (hash(i + 5) > .22 + .04 * (4 - hits)) dots.push({ x: rx, y: ry, kind: KINDS6[i % 6] }); }
    const k = easeIO(seg(lt, 1.7, 3.3)), px = lerp(hx0 + 30, hx1 - 30, k), route = [[hx0 + 30, hy], [px, hy]];
    A6.mapCard(lt, { appear: easeOut(seg(lt, 1.45, 1.75)), dots, route, pos: [px, hy] });
  },
  montageCast(lt, sh) {
    const P = t => SCENES.run.strawPath(t), zip = sh === 'zip';
    const sp = zip ? runner(straw, P, lt, {}, 380) : person(straw, P, lt, {});
    let x = 0, z = 1100, pose = { l: 'rest', r: 'rest' };
    if (sh === 'm1') { sp.arms = { l: 'rest', r: seg(lt, .45, .6) > 0 ? [2.4, .3] : 'flail' }; sp.expr = 'angry'; sp.look = [.6, .2]; }
    if (sh === 'm2') { sp.arms = { l: [1.6, .5], r: 'point' }; sp.expr = 'smug'; sp.look = [-.6, .2]; }
    if (sh === 'm3') { sp.arms = { l: 'run', r: 'run' }; sp.expr = 'panic'; sp.squash = .06; sp.look = [0, .5]; }
    if (sh === 'm4') { sp.arms = { l: 'rest', r: 'rest' }; sp.expr = 'dead'; sp.lid = .55; }
    if (zip) {
      Object.assign(sp, { arms: { l: 'run', r: 'run' }, expr: 'panic', squash: .04, look: [0, .4] });
      // afterimages: the nurse a few frames earlier, fading behind her
      REG.suppress++;
      for (const [d, a] of [[.2, .1], [.14, .18], [.08, .3]]) { if (lt - d < 4.12) continue; const g = runner(straw, P, lt - d, { arms: { l: 'run', r: 'run' }, expr: 'panic', noReflect: true, transit: true, noFoley: true }, 380); ctx.save(); ctx.globalAlpha *= a; drawChar(g); ctx.restore(); }
      REG.suppress--;
    }
    drawChar(sp);
  },
  strawPath(lt) {
    if (lt < .75) return [-80, 1650]; if (lt < 1.5) return [150, 1300]; if (lt < 4.1) return [-60, 1100];
    if (lt < 5.0) return [lerp(60, -60, easeOut(seg(lt, 4.1, 5.0))), lerp(4200, 1100, easeOut(seg(lt, 4.1, 5.0)))];
    return [-60, 1100];
  },
  talkCast(lt, sh) {
    const s = id => B(id);
    const sp = person(straw, () => [-190, 1040], lt, {}), mp = person(mango, () => [lerp(-330, 150, easeOut(seg(lt, 6.0, 6.6))), 1010], lt, {});
    const pumpPose = inB(lt, 'm1') || inB(lt, 's1') || inB(lt, 'm2');
    // the pump on its pole between them, silence key at a fixed spot on the screen
    const pq = V2.at(10, 1150), kx = pq.x + 40 * pq.s, ky = pq.y - 330 * pq.s;
    // Mango reaches for the key; Strawberry catches her wrist
    mp.transit = lt < 6.8; mp.expr = inB(lt, 'm1') ? 'happy' : inB(lt, 'm3') ? 'shock' : inB(lt, 'm2') ? 'sour' : 'neutral';
    if (inB(lt, 'm1') || inB(lt, 's1') || inB(lt, 'm2')) { pointAt(mp, -1, kx, ky, .98); mp.arms.r = 'rest'; }
    if (inB(lt, 's1') || inB(lt, 'm2')) { const [hx, hy] = [kx - 10, ky + 20]; pointAt(sp, 1, hx, hy, .95); sp.hand.r = 'fist'; }
    sp.expr = inB(lt, 's1') ? 'angry' : inB(lt, 's2') ? 'smug' : inB(lt, 's3') ? 'dead' : inB(lt, 's4') ? 'chill' : 'sour'; sp.look = [.4, 0];
    if (inB(lt, 'm4') || inB(lt, 'm5')) mp.expr = 'neutral';
    // the pump, drawn between them
    SCENES.run.pumpPole(10, 1150, lt, inB(lt, 'm1') || inB(lt, 's1') || inB(lt, 'm2'));
    drawChar(sp); drawChar(mp);
    // the PA speaker in the ceiling and the volume bar
    const pa = s('pa1');
    if (lt >= pa.s - .8 && lt < pa.e + .2) { const [x, y] = V2.p2(0, 700, 1100); for (let i = 0; i < 4; i++) A6.ring(x, y, (((lt - pa.s) * 1.3 - i * .25) % 1 + 1) % 1, 'call', { r0: 30, r1: 520, lw: 8, alpha: .6, squash: .5 }); }
  },
  pumpPole(X, Z, lt, hot) {
    const q = V2.at(X, Z), s = q.s, x = q.x, y = q.y;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 6 * s, 80 * s, 14 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c3ccd6'; ctx.lineWidth = 10 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -470 * s); ctx.stroke();
    for (const a of [-2.5, -.65, .65, 2.5]) { ctx.beginPath(); ctx.moveTo(0, -2 * s); ctx.lineTo(Math.sin(a) * 64 * s, 8 * s); ctx.stroke(); }
    ctx.fillStyle = grad2(0, -420 * s, 0, -250 * s, '#eef2f6', '#b9c3cf'); ctx.strokeStyle = 'rgba(20,14,30,.85)'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.roundRect(-62 * s, -440 * s, 124 * s, 170 * s, 16 * s); ctx.fill(); ctx.stroke();
    const f = hot ? (Math.sin(lt * 9) > -.2 ? 1 : .3) : .0;
    ctx.fillStyle = '#06151f'; ctx.beginPath(); ctx.roundRect(-48 * s, -424 * s, 96 * s, 62 * s, 8 * s); ctx.fill();
    ctx.fillStyle = hot ? `rgba(255,${90 + 80 * (1 - f) | 0},80,${.5 + .5 * f})` : '#59e08b'; ctx.font = `900 ${14 * s}px Nunito`; ctx.textAlign = 'center'; ctx.fillText(hot ? 'OCCLUSION' : 'RUNNING', 0, -388 * s);
    ctx.fillStyle = '#ffb703'; ctx.beginPath(); ctx.roundRect(18 * s, -348 * s, 36 * s, 22 * s, 6 * s); ctx.fill(); ctx.strokeStyle = 'rgba(20,14,30,.85)'; ctx.stroke();
    ctx.restore();
    if (hot) V2.glow(x, y - 400 * s, 140 * s, '255,70,70', .35 * f, 'screen', .3);
  },
  fx: lt => { const sh = SCENES.run.shot(lt); return { bloom: .5, vignette: .45, grain: .045, contrast: .17, sat: .16, aberr: sh === 'zip' ? 3 : 0, tint: [['#8fb0ff', .1, 'soft-light']] }; },
  blur: lt => SCENES.run.shot(lt) === 'zip' ? 6 : 1,
  over(lt) {
    const s = id => B(id), n = SCENES.run.count(lt), pa = s('pa1');
    const vol = lt >= pa.s ? lerp(1, .6, easeIO(seg(lt, pa.s + 1.2, pa.s + 3.0))) : 1;
    A6.hud(n, { appear: seg(lt, 0, .3), flash: lt >= 5.2 && lt < 5.5 ? 1 : 0, vol: lt >= pa.s - .3 ? vol : null });
    const hit = [[.55, 'BONK'], [1.3, 'PIP'], [2.2, 'TING'], [3.0, 'THUP'], [3.8, 'TSK']].find(([t]) => lt >= t && lt < t + .45);
    if (hit && lt < 6.3) { const k = seg(lt, hit[0], hit[0] + .15); ctx.save(); ctx.globalAlpha *= 1 - seg(lt, hit[0] + .3, hit[0] + .45); ctx.translate(820 - 160 * (hit[1].length % 2), SCENES.run.shot(lt) === 'map' ? 330 : 520); ctx.scale(lerp(1.6, 1, easeOut(k)), lerp(1.6, 1, easeOut(k))); ctx.rotate(-.1); text(hit[1], 0, 0, { size: 120, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore(); }
  },
};
function grad2(x0, y0, x1, y1, a, b) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }

// ============================================================================ the silence and the chirp, 6:30 PM
const STILL_CH = 900;
SCENES.still = {
  chirps: [5.01, 9.79, 11.24, 12.69, 14.14, 27.87],   // seconds into the scene when a chirp sounds (matches the script's cues)
  chirpPan: [0, .6, -.6, .25, -.35, 0],
  led(lt) { let v = 0; for (const t of SCENES.still.chirps) { const k = lt - t; if (k >= 0 && k < .5) v = Math.max(v, 1 - k / .5); } return v; },
  shot(lt) {
    const t = id => B(id);
    const order = [['hush', t('m1').s - .05], ['two1', t('chirp1').s + .15], ['led', t('m2').s - .05], ['lib', t('hunt').s], ['h1', t('hunt').s + 1.5], ['h2', t('hunt').s + 3.0], ['h3', t('hunt').s + 4.5],
      ['h4', t('l1').s], ['limeDoor', t('s4').s - .02], ['aid', t('l2').s - .02], ['limeCU', t('m3').s - .1], ['two2', t('s6').s - .1], ['cuS', t('freeze').s], ['freeze', t('m5').s - .02],
      ['cuMup', t('m5').s + .85], ['det', t('s7').s - .05], ['two3', t('m6').s - .05], ['stack', t('pull').s - .05], ['batt', t('m7').s - .1], ['stack2', t('s9').s - .1], ['cuS2', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  stack(lt) {
    // Mango crouches, Strawberry hops on her head, Mango stands with Strawberry on top
    const m6 = B('m6'), s8 = B('s8'), cr = easeIO(seg(lt, m6.s + .5, m6.s + 1.1)) * (1 - easeIO(seg(lt, m6.s + 1.9, s8.s + .5)));
    const hop = seg(lt, m6.s + 1.25, m6.s + 1.95);
    return { crouch: cr, hop, up: seg(lt, m6.s + 1.9, s8.s + .5) };
  },
  cam(lt) {
    const sh = SCENES.still.shot(lt);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    const sp = person(straw, () => [-190, 1040], lt), mp = person(mango, () => [140, 1010], lt);
    if (sh === 'hush') { const k = easeIO(seg(lt, 0, 2.4)); zoomTo(520, 960 - 20 * k, .97 + .03 * k); }
    else if (sh === 'two1' || sh === 'two2') zoomTo(506, 1030, 1.25);
    else if (sh === 'two3') zoomTo(506, 1030, 1.2);
    else if (sh === 'led') { const k = easeOut(seg(lt, B('chirp1').s, B('chirp1').s + .5)); zoomTo(lerp(540, 506, k), lerp(960, 1030, k), lerp(1, 1.3, k)); }
    else if (sh === 'cuS') faceZoom(sp, 2.3);
    else if (sh === 'cuMup') faceZoom(mp, 2.2);
    else if (sh === 'freeze') { const k = seg(lt, B('freeze').s, B('freeze').e); zoomTo(540, 900 - 40 * k, 1 + .1 * k); }
    else if (sh === 'limeCU') { faceZoom(Object.assign({ kind: 'lime' }, V2.at(255, 1180)), 2.3); }
    else if (sh === 'stack' || sh === 'stack2') zoomTo(676, 980, 1.03);   // the whole stack, floor to ceiling detector, above the caption
    else if (sh === 'cuS2') zoomTo(620, 560, 2.0);
    else if (sh === 'h1') zoomTo(330, 980, 1.4);
    else if (sh === 'h3') zoomTo(500, 1010, 1.2);
    else if (sh === 'h4') zoomTo(620, 1000, 1.3);
    if (sh === 'cuS' || sh === 'cuS2') CAM.r = 0;
  },
  draw(lt) {
    const sh = SCENES.still.shot(lt), t = id => B(id);
    if (sh === 'lib') { A6.bokeh(lt, ['80,165,255', '255,90,90'], ['#070b22', '#101a3a']); A6.libraryCard(lt, { appear: easeOut(seg(lt, t('m2').s, t('m2').s + .35)), checked: lt >= t('s2').s ? 31 : Math.floor(seg(lt, t('m2').s + .3, t('s2').s) * 31), unknown: lt >= t('s3').s ? seg(lt, t('s3').s, t('s3').s + .25) : 0, t0: t('m2').s + .3 }); return; }
    if (sh === 'aid') { A6.insHearing(lt - t('s4').s); return; }
    if (sh === 'det') { A6.insDetector(lt - t('s7').s, { led: SCENES.still.led(lt) > .05 ? 1 : .2 }); return; }
    if (sh === 'batt') { A6.insBattery(lt - t('pull').s, seg(lt, t('pull').s + .35, t('pull').s + .85)); return; }
    this.hall(lt, sh);
  },
  hall(lt, sh) {
    const t = id => B(id), led = SCENES.still.led(lt);
    V2.setLight({ key: [-.3, -.85], keyColor: '#cfd8ff', keyA: .16, rim: '#7f9cff', rimA: .5, shadow: '#0a0a1e', shadowA: .42, amb: '#aab4e8', ambA: .12 });
    V2.opts.reflect = true;
    const blurPx = ['cuS', 'cuS2', 'cuMup', 'limeCU'].includes(sh) ? 9 : ['two1', 'two2', 'two3', 'stack', 'stack2'].includes(sh) ? 3 : 0;
    const doors = hallDoors(lt, 0, { '12': [0, 0, null] }).map(d => Object.assign(d, { open: (sh === 'h2' && lt > t('hunt').s + 3.0 && d.n === '12') || (sh === 'limeDoor' && d.n === '7') ? 1 : 0, dome: null }));
    V2.dof(blurPx, () => {
      S6.corridor({ doors, ch: STILL_CH, lampOn: .55, bright: .72, fog: '#4a5278', fogAmt: .5, wall: '#cfc6b4', wain: '#46707a', signs: [] });
      S6.stationDesk({}); S6.detector(140, 1100, STILL_CH, { led }); S6.detector(-60, 5200, STILL_CH, { led: SCENES.still.led(lt) }); if (sh === 'h3') SCENES.still.cart(lt);
    });
    // the first chirp, far down the hall: a ring around the far detector
    for (let i = 0; i < SCENES.still.chirps.length; i++) { const c = SCENES.still.chirps[i]; if (lt < c || lt > c + 1.1) continue; const far = i === 0, [x, y, k] = V2.proj(far ? -60 : 140, STILL_CH, far ? 5200 : 1100), px = i === 5 ? x : (i === 0 ? x : 540 + SCENES.still.chirpPan[i] * 460);
      const yy = i >= 1 && i <= 4 ? 640 : y; A6.ring(px, yy, (lt - c) / 1.0, 'chirp', { r0: 16, r1: far ? 260 : 520, lw: 9, alpha: .9 }); A6.ring(px, yy, (lt - c - .12) / 1.0, 'chirp', { r0: 16, r1: far ? 220 : 440, lw: 5, alpha: .6 }); }
    // the people
    const cast = SCENES.still.cast(lt, sh);
    const subj = { cuS: 'straw', cuMup: 'mango', limeCU: 'lime', cuS2: 'straw', h1: 'straw', h4: 'mango' }[sh];
    drawCast(cast.filter(o => !o._late), subj);
    if (sh === 'h3') SCENES.still.cartFront(lt);
    for (const o of cast) if (o._late) { const cq = V2.at(60, 1000); ctx.save(); ctx.beginPath(); ctx.rect(-600, -600, W + 1200, 600 + cq.y - 252 * cq.s); ctx.clip(); drawChar(o); ctx.restore(); }
    V2.dust(60, 500, 1020, 1400, lt, { n: 46, alpha: .5 });
    if (sh === 'h1' || sh === 'h4') V2.dof(0, () => {});
  },
  cart(lt) {   // a laundry cart, drawn after Mango so only her legs show
    const q = V2.at(60, 1000);
    ctx.save(); ctx.translate(q.x, q.y); const s = q.s;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 6 * s, 150 * s, 20 * s, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  cartFront(lt) {
    const q = V2.at(60, 1000), s = q.s;
    ctx.save(); ctx.translate(q.x, q.y); ctx.scale(s, s);
    ctx.fillStyle = grad2(0, -262, 0, 0, '#6a9ed0', '#3e6a9c'); ctx.strokeStyle = 'rgba(20,14,30,.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-150, -262); ctx.lineTo(150, -262); ctx.lineTo(132, -18); ctx.lineTo(-132, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8eef5'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(-120 + i * 34, -268 + (i % 2) * -10, 30, 22, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-132, -250, 264, 12);
    ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 6; for (const x of [-100, 100]) { ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x, -4); ctx.stroke(); ctx.fillStyle = '#2a2530'; ctx.beginPath(); ctx.arc(x, 0, 14, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  cast(lt, sh) {
    const t = id => B(id), out = [], st = SCENES.still.stack(lt);
    const frozen = sh === 'hush' || sh === 'freeze' ? 3.3 : undefined;
    let sp = person(straw, () => [-190, 1040], lt, { t: frozen }), mp = person(mango, () => [140, 1010], lt, { t: frozen });
    sp.look = [.4, 0]; mp.look = [-.5, 0];
    if (sh === 'hush') {   // everything stops mid-motion: she is mid-stride, Mango carries a basin
      mp = person(mango, () => [105, 1010], lt, { t: frozen });
      Object.assign(sp, { gaitW: 31, axis: 'x', dir: 1, expr: 'neutral', arms: { l: [.8, .6], r: [.3, .3] } });
      Object.assign(mp, { hold: { r: 'basin' }, arms: { l: 'rest', r: 'hold' }, expr: 'neutral' });
    }
    if (sh === 'two1') { sp.expr = inB(lt, 's1') ? 'sour' : 'chill'; mp.expr = inB(lt, 'm1') ? 'happy' : 'neutral'; sp.look = [.2, -.2]; mp.arms = { l: 'rest', r: 'rest' }; }
    if (sh === 'led') { sp.expr = 'shock'; mp.expr = 'shock'; sp.look = [0, -.8]; mp.look = [0, -.8]; sp.arms = { l: 'rest', r: 'stop' }; }
    if (sh === 'h1') {   // stethoscope against the wall: the building has a pulse
      sp = person(straw, () => [-250, 1040], lt, {}); const q = V2.at(-250, 1040); sp.expr = 'neutral'; sp.lid = .8; sp.look = [-.9, .3];
      pointAt(sp, -1, q.x - 150, q.y - 215 * q.s, .97); sp.hold = { l: 'stethhead' }; sp.hand = { l: 'grip' };
      mp.expr = 'sour'; mp.look = [-.7, 0]; mp.arms = { l: 'rest', r: 'rest' };
      const hx = q.x - 160, hy = q.y - 215 * q.s; for (let i = 0; i < 3; i++) A6.ring(hx - 20, hy, (((lt - t('hunt').s) * 1.5 - i * .33) % 1 + 1) % 1, 'chirp', { r0: 10, r1: 230, lw: 6, alpha: .6 });
    }
    if (sh === 'h2') {   // rooms, rooms, rooms: the pair dash from door to door and every room has nothing in it
      const h0 = t('hunt').s + 1.5, kk = lt - h0, stops = [[-140, 1500], [150, 1300], [-130, 2300], [160, 1800]], idx = clamp(Math.floor(kk / .38), 0, 3), nxt = Math.min(3, idx + 1), u = easeIO(seg(kk - idx * .38, .22, .38));
      const pos = (j, off) => [lerp(stops[idx][0], stops[nxt][0], u) + off, lerp(stops[idx][1], stops[nxt][1], u)];
      sp = runner(straw, () => pos(0, 0), lt, { expr: 'neutral', look: [.8, 0], arms: { l: 'run', r: 'run' } }); mp = runner(mango, () => pos(0, 190), lt, { expr: 'neutral', look: [.8, 0], arms: { l: 'run', r: 'run' } });
    }
    if (sh === 'h3') {   // Mango, head first in the laundry cart
      const q = V2.at(60, 1000);
      mp = mango({ x: q.x, y: q.y + 2 * q.s, s: q.s, rot: PI, legs: 'kick', expr: 'panic', t: lt * 1.0, noShadow: true, noReflect: true, arms: { l: 'flail', r: 'flail' }, _late: true });
      sp = person(straw, () => [-150, 1040], lt, { expr: 'dead', look: [.7, .3], arms: { l: 'rest', r: 'rest' } });
    }
    if (sh === 'h4') {   // a glass against the door, an ear against the glass
      mp = person(mango, () => [170, 1100], lt, { rot: .16, expr: 'neutral', lid: .7, look: [.9, 0], hold: { r: 'cup' }, arms: { l: 'rest', r: 'hold' } }); const q = V2.at(170, 1100);
      pointAt(mp, 1, q.x + 190, q.y - 235 * q.s, .98); mp.hand = { r: 'grip' }; mp.hold = { r: 'cup' };
      sp = person(straw, () => [-160, 1040], lt, { expr: 'sour', look: [.8, 0], arms: { l: 'rest', r: 'rest' } });
    }
    if (sh === 'limeDoor' || sh === 'limeCU') {
      mp = person(mango, () => [-5, 1010], lt, { expr: 'neutral', look: [.8, 0] });
      const lq = V2.at(255, 1180); out.push(lime(Object.assign(lq, { look: [-.9, 0], expr: inB(lt, 'l2') ? 'sour' : 'happy', arms: { l: 'rest', r: inB(lt, 'l2') ? 'up' : 'rest' }, face: inB(lt, 'l2') ? { ang: -.3 } : undefined })));
      sp.expr = inB(lt, 's4') ? 'sour' : 'neutral';
    }
    if (sh === 'two2') { sp.expr = inB(lt, 'm4') ? 'dead' : inB(lt, 's5') ? 'smug' : 'sour'; mp.expr = inB(lt, 'm3') ? 'sour' : inB(lt, 'm4') ? 'smug' : 'neutral'; }
    if (sh === 'cuS') { sp.expr = 'angry'; sp.look = [0, 0]; sp.arms = { l: 'rest', r: 'stop' }; }
    if (sh === 'freeze') { sp = person(straw, () => [-215, 1040], lt, { t: frozen }); mp = person(mango, () => [95, 1010], lt, { t: frozen }); sp.expr = 'neutral'; mp.expr = 'neutral'; sp.look = [.2, -.9]; mp.look = [-.2, -.9]; const lq = V2.at(300, 1200); out.push(lime(Object.assign(lq, { t: 3.3, look: [-.9, -.2], expr: 'neutral' }))); }
    if (sh === 'cuMup') { mp.expr = 'shock'; mp.look = [0, -.9]; }
    if (sh === 'two3') { sp.expr = 'smug'; mp.expr = 'dead'; sp.look = [.1, -.9]; mp.look = [0, -.9]; }
    if (sh === 'stack' || sh === 'stack2' || sh === 'cuS2') {
      const mq = V2.at(140, 1010), crouch = sh === 'stack' ? st.crouch : 0, kM = KINDS.mango, top = ((kM.leg || 86) + kM.ry * .9 + TOPS.mango * (1 - crouch * .35 * .0)) * mq.s * (1 - crouch * .12);
      mp = person(mango, () => [140, 1010], lt, { squash: sh === 'stack' ? crouch * .28 : 0, expr: sh === 'stack' ? (crouch > .3 ? 'sour' : 'dead') : 'dead', look: [0, -.2], arms: { l: 'rest', r: 'rest' }, noBob: true });
      const base = V2.at(-90, 1010), headY = mq.y - top + 14 * mq.s, sc = mq.s * .82;
      const k = sh === 'stack' ? st.hop : 1, arc = sh === 'stack' ? Math.sin(k * PI) * 260 : 0;
      const sx = lerp(base.x, mq.x, easeIO(k)), sy = lerp(base.y, headY, easeIO(k)) - arc;
      sp = straw({ x: sx, y: sy, s: lerp(base.s, sc, easeIO(k)), look: [.1, -.8], expr: sh === 'stack' ? (k > .98 ? 'angry' : 'neutral') : lt >= t('s9').s ? 'smug' : 'smug', noBob: k >= 1,
        arms: sh === 'stack' ? (k > .98 ? { l: [2.7, .3], r: [2.7, .3] } : { l: 'rest', r: 'rest' }) : { l: [2.7, .3], r: 'hold' }, hold: sh === 'stack2' || sh === 'cuS2' ? { r: 'battery9v' } : undefined, noShadow: k >= .5, lift: 0, noReflect: k > .2 });
      if (sh === 'stack' && k >= 1) sp.rot = .03 * Math.sin(lt * 9);
    }
    if (sh === 'hush' || sh === 'freeze') { sp.noBob = true; mp.noBob = true; }
    if (sh === 'stack' || sh === 'stack2' || sh === 'cuS2') out.unshift(mp, sp); else out.unshift(sp, mp);
    return out;
  },
  fx: lt => { const sh = SCENES.still.shot(lt); return { bloom: .6, vignette: .6, grain: .06, contrast: .18, sat: .1, aberr: 0, tint: [['#4060d0', .18, 'soft-light'], ['#0a1030', .16, 'multiply']] }; },
  blur: lt => 1,
  over(lt) {
    const t = id => B(id), sh = SCENES.still.shot(lt);
    if (sh === 'lib' && lt >= t('s3').s) A6.hud('?', { appear: seg(lt, t('s3').s, t('s3').s + .3), unknown: 1 });
    if (sh === 'hush') { const n = Math.max(0, Math.round(38 * (1 - easeOut(seg(lt, .1, 1.9))))); A6.hud(n, { appear: seg(lt, 0, .2) }); }
    if (sh === 'two1' || sh === 'led') A6.hud(0, { appear: 1 });
    if (sh === 'two3') {
      const k = easeBack(seg(lt, t('s7').s, t('s7').s + .3)), cx = 786, cy = 350, R = 206;
      if (k > 0) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
        reg('overlay', [cx - R * k, cy - R * k, cx + R * k, cy + R * k], { id: 'inset-detector' });
        ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.fillStyle = '#10142a'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R - 8, 0, TAU); ctx.clip();
        ctx.fillStyle = grad2(0, -R, 0, R, '#9aa4c4', '#5a6490'); ctx.fillRect(-R, -R, 2 * R, 2 * R);
        ctx.strokeStyle = 'rgba(40,50,90,.28)'; ctx.lineWidth = 3; for (let g = -R; g <= R; g += 70) { ctx.beginPath(); ctx.moveTo(g, -R); ctx.lineTo(g, R); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-R, g); ctx.lineTo(R, g); ctx.stroke(); }
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.arc(6, 10, 112, 0, TAU); ctx.fill();
        ctx.fillStyle = grad2(-110, -110, 110, 110, '#ffffff', '#c3c8d2'); ctx.strokeStyle = 'rgba(30,30,44,.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 108, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(60,60,76,.5)'; ctx.lineWidth = 4; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 42, Math.sin(a) * 42); ctx.lineTo(Math.cos(a) * 92, Math.sin(a) * 92); ctx.stroke(); }
        ctx.fillStyle = '#e4e7ec'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4a1a1a'; ctx.beginPath(); ctx.arc(62, -46, 9, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, R - 4, 0, TAU); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= clamp(k); ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 7; ctx.setLineDash([4, 16]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy + R + 14); ctx.lineTo(cx, cy + R + 118); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.moveTo(cx - 22, cy + R + 112); ctx.lineTo(cx + 22, cy + R + 112); ctx.lineTo(cx, cy + R + 146); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
    if (lt >= SCENES.still.chirps[0] && lt < SCENES.still.chirps[0] + .9 && sh === 'led') { const k = seg(lt, SCENES.still.chirps[0], SCENES.still.chirps[0] + .2); ctx.save(); ctx.globalAlpha *= 1 - seg(lt, SCENES.still.chirps[0] + .6, SCENES.still.chirps[0] + .9); ctx.translate(540, 420); ctx.scale(lerp(1.6, 1, easeOut(k)), lerp(1.6, 1, easeOut(k))); text('chirp.', 0, 0, { size: 130, font: 'Bangers', weight: 400, fill: '#ff6a6a', lw: 14, stroke: '#150f22', spacing: 3, shadow: 16 }); ctx.restore(); }
    // the hunt: a tally of rooms checked, none of them it
    if (['h1', 'h2', 'h3', 'h4'].includes(sh)) A6.tally(Math.min(14, Math.floor(seg(lt, t('hunt').s, t('hunt').e) * 14.99)), false, { appear: seg(lt, t('hunt').s, t('hunt').s + .3) });
  },
};

// ============================================================================ the one alarm everybody answers, 7:00 PM
const CROWD = [
  ['lemon', { acc: ['readers', 'lanyard'], expr: 'angry' }], ['melon', { acc: ['suit', 'nametag'], tag: 'ADMINISTRATOR', expr: 'happy' }], ['apple', { hold: { r: 'cell' }, expr: 'panic' }], ['banana', { acc: ['bandage'], expr: 'happy' }],
  ['cran', { acc: ['pearls'], expr: 'happy' }], ['blue', { expr: 'panic' }], ['prune', { expr: 'angry' }], ['star', { acc: ['glasses', 'statecap'], expr: 'happy' }], ['fig', { acc: ['fedora'], expr: 'smug' }],
  ['pine', { acc: ['chain'], expr: 'angry' }], ['clem', { acc: ['pricetag'], expr: 'happy' }], ['kiwi', { acc: ['bouffant', 'agency'], expr: 'happy', capColor: '#ff8fb1' }], ['dragon', { acc: ['sleepmask'], expr: 'chill' }],
  ['coco', { expr: 'happy' }], ['cherry', { expr: 'happy' }], ['grape', { expr: 'panic' }], ['lime', { acc: ['readers', 'cardigan'], expr: 'happy', cardColor: '#c98a2e' }], ['pear', { acc: ['newsboy', 'suspenders', 'unionpin'], expr: 'smug' }],
];
const crowdLanes = Array.from({ length: 28 }, (_, i) => { const c = CROWD[i % CROWD.length]; return { kind: c[0], extra: c[1], lane: (hash(i * 3.1) * 2 - 1) * 170, side: i % 2 ? 1 : -1, delay: hash(i + 7) * 1.7, dur: 1.2 + hash(i + 13) * .8, zs: 1500 + hash(i + 21) * 3600, sc: .95 + hash(i + 31) * .25 }; });

SCENES.ding = {
  shot(lt) {
    const t = id => B(id);
    if (lt < t('ding').s) return 'calm';
    if (lt < t('ding').e + .3) return 'bell';
    if (lt < t('pa1').s) return 'stampede';
    if (lt < t('m1').s) return 'crowd';
    if (lt < t('s2').s - .05) return 'cuM';
    if (lt < t('m2').s - .05) return 'cuS';
    if (lt < t('s3').s - .05) return 'cuM';
    if (lt < t('s4').s - .05) return 'cuS';
    if (lt < t('m3').s - .05) return 'two';
    return 'cuM';
  },
  smoke(lt) { return clamp(seg(lt, B('pa1').s, B('s4').e)); },
  cam(lt) {
    const sh = SCENES.ding.shot(lt);
    if (sh === 'stampede') { V2.setCam({ f: 1400, cy: 330, hy: 860 }); CAM.shake = 6 * easeIO(seg(lt, B('stampede').s, B('stampede').s + .6)); return; }
    V2.setCam({ f: 1400, cy: 330, hy: 860 });
    const sp = SCENES.ding.seatS(lt), mp = SCENES.ding.seatM(lt);
    if (sh === 'calm') { const k = seg(lt, 0, B('ding').s); zoomTo(500, 990, 1.2 + .1 * k); }
    else if (sh === 'bell') { zoomTo(lerp(500, 760, easeOut(seg(lt, B('ding').s, B('ding').s + .2))), 960, 1.6); CAM.shake = 10 * (1 - seg(lt, B('ding').s, B('ding').e + .3)); }
    else if (sh === 'crowd') zoomTo(580, 960, 1.2);
    else if (sh === 'cuM') faceZoom({ kind: 'mango', x: mp.x, y: mp.ref, s: mp.s, noLegs: true }, 2.2);
    else if (sh === 'cuS') faceZoom({ kind: 'straw', x: sp.x, y: sp.ref, s: sp.s, noLegs: true }, 2.2);
    else if (sh === 'two') zoomTo(500, 1000, 1.25);
  },
  seatS: lt => { const q = V2.at(-170, 1060); return Object.assign(q, { ref: q.y - 100 * q.s }); },
  seatM: lt => { const q = V2.at(110, 1060); return Object.assign(q, { ref: q.y - 100 * q.s }); },
  draw(lt) {
    const sh = SCENES.ding.shot(lt), t = id => B(id);
    if (sh === 'stampede') { SCENES.ding.stampedeShot(lt); return; }
    const sm = SCENES.ding.smoke(lt), cnt = Math.max(0, 5 - Math.floor(lt / .56));
    V2.setLight({ key: [-.35, -.8], keyColor: '#ffe9c2', keyA: .24, rim: '#ffb067', rimA: .55, shadow: '#2a1a28', shadowA: .38, amb: '#ffe2c0', ambA: .06, bounce: '#ffcf99', bounceA: .22 });
    V2.opts.reflect = true;
    const burn = lt >= t('ding').s ? 1 : 0, doorOpen = lt >= t('stampede').s ? 1 : 0;
    const blurPx = ['cuM', 'cuS'].includes(sh) ? 8 : sh === 'two' ? 3 : 0;
    V2.dof(blurPx, () => { S6.breakRoom({ door: doorOpen }); S6.wallClock(-460, 520, 1500, -1, 0, 7, 40); });
    V2.addLight({ x: V2.proj(350, 280, 1500)[0], y: V2.proj(350, 280, 1500)[1], r: 700, color: '255,190,90', a: .6 });
    // the microwave counts down to the ding, then the door opens on a black bag of popcorn
    const mdoor = lt >= t('m1').s - .3 ? easeOut(seg(lt, t('m1').s - .3, t('m1').s + .2)) : 0;
    const mw = S6.microwave(350, 1500, { on: lt < t('ding').s ? 1 : lt < t('m1').s ? .7 : .2, door: mdoor, display: lt < t('ding').s ? `0:0${Math.max(0, 5 - Math.floor(lt / .55))}` : '0:00' });
    if (lt >= t('ding').s) for (let i = 0; i < 3; i++) A6.ring(mw.disp[0], mw.disp[1], (((lt - t('ding').s) * 1.3 - i * .3) % 1 + 1) % 1, 'micro', { r0: 20, r1: 520, lw: 9, alpha: .7 });
    // everyone from the stampede, crowded round the microwave (farther than the table, so drawn first, and soft when the lens is on the nurses)
    if (lt >= t('stampede').s + 3.4) V2.dof(blurPx > 0 ? 8 : 0, () => SCENES.ding.gather(lt));
    // the table, chairs and the two nurses behind it
    const sp = SCENES.ding.seatS(lt), mp = SCENES.ding.seatM(lt);
    S6.chair3(-170, 1130, { color: '#c47a52', w: 50, d: 44, seat: 120, back: 280 }); S6.chair3(110, 1130, { color: '#c47a52', w: 50, d: 44, seat: 120, back: 280 });
    const Dd = (o, kind) => ((sh === 'cuM' || sh === 'bell') && kind !== 'mango') || (sh === 'cuS' && kind !== 'straw') ? drawBg(o) : drawChar(o);
    Dd(straw({ x: sp.x, y: sp.ref, s: sp.s, noLegs: true, noShadow: true, who: 'straw', look: [.6, 0], hold: { r: 'coffee' }, grip: { r: [96, 6] }, arms: { l: 'rest', r: 'hold' },
      expr: lt < t('s1').s ? 'chill' : inB(lt, 's1') ? 'happy' : lt < t('m1').s ? 'shock' : inB(lt, 's2') || inB(lt, 's3') || inB(lt, 's4') ? 'sour' : 'dead', lid: lt < t('s1').s ? .7 : undefined }), 'straw');
    Dd(mango({ x: mp.x, y: mp.ref, s: mp.s, noLegs: true, noShadow: true, who: 'mango', look: [-.4, 0], hold: { l: 'coffee' }, grip: { l: [-96, 6] }, arms: { l: 'hold', r: 'rest' },
      expr: lt < t('s1').s ? 'chill' : lt < t('ding').s ? 'happy' : inB(lt, 'm1') || inB(lt, 'm2') ? 'sour' : inB(lt, 'm3') ? 'happy' : 'shock' }), 'mango');
    S6.table3(-30, 1060, { w: 210, d: 70, h: 135, color: '#c9a26a' });
    if (sm > 0) { V2.smoke(V2.proj(350, 330, 1500)[0], V2.proj(350, 330, 1500)[1], lt, t('pa1').s, { n: 22, rate: 5, life: 3.2, rise: 480, spread: 150, size: 70, alpha: .55 }); }
    S6.detector(0, 1400, 600, { led: 0 });
    if (sm > 0) smokeHaze(sm, 0, 760 + 300 * sm);
    V2.dust(60, 600, 1020, 1400, lt, { n: 30, alpha: .3 });
  },
  gather(lt) {
    const spots = [[215, 1230], [300, 1290], [150, 1320], [255, 1370], [40, 1250], [330, 1190], [120, 1230], [-90, 1290], [200, 1450], [305, 1440]];
    const k = easeOut(seg(lt, B('stampede').s + 3.4, B('stampede').s + 4.2));
    crowdLanes.slice(0, spots.length).forEach((c, i) => {
      const [X, Z] = spots[i], q = V2.at(lerp(X + 120 * (i % 2 ? 1 : -1), X, k), Z + (1 - k) * 200);
      drawBg(Object.assign({ kind: c.kind, id: 'g' + i, who: null, s: q.s * c.sc * (KINDS[c.kind].rx > 120 ? .85 : 1), x: q.x, y: q.y, noReflect: true, look: [.9, -.1], transit: k < 1, arms: { l: 'rest', r: 'rest' } }, c.extra, { expr: lt >= B('m1').s ? 'shock' : 'happy', look: [.9, -.05] }));
    });
  },
  stampedeShot(lt) {
    const t = id => B(id), st = t('stampede').s;
    V2.setLight({ key: [-.3, -.85], keyColor: '#f4f6ff', keyA: .22, rim: '#8fb8ff', rimA: .45, shadow: '#1a1830', shadowA: .3, amb: '#dfe6ff', ambA: .05 });
    V2.opts.reflect = false;
    const doors = hallDoors(lt, 1, {}).map(d => Object.assign(d, { open: 0 }));
    S6.corridor({ doors, ch: 700, fog: '#c4cfe2', fogAmt: .32, signs: [] });
    S6.stationDesk({ lamps: doors.slice(0, 12).map(d => d.dome ? d.dome[1] : 0), colors: doors.slice(0, 12).map(d => d.dome ? d.dome[0] : '255,170,60') });
    for (const d of doors) if (d.dome) { const [x, y, k] = V2.proj(d.side * 330, 480, d.z); V2.addLight({ x, y, r: 800, color: d.dome[0], a: .7 * d.dome[1] }); }
    // every alarm in the building is still going: nobody turns a head
    doors.forEach((d, i) => { if (!d.dome || i % 2) return; const [x, y, k] = V2.proj(d.side * 330, 480, d.z); A6.ring(x, y, ((lt * 1.8 + hash(i)) % 1), KINDS6[i % 6], { r0: 14 * k, r1: 340 * k + 40, lw: 7, alpha: .65 }); });
    const runners = crowdLanes.map((c, i) => {
      const u = seg(lt, st + c.delay, st + c.delay + c.dur), e = Math.pow(u, 1.35), Z = lerp(c.zs, 170, e), side = c.side * 260, X = lerp(side, c.lane, easeOut(seg(u, 0, .45)));
      return { c, i, Z, X, u };
    }).filter(r => r.u > 0 && r.u < 1 && r.Z > 190).sort((a, b) => b.Z - a.Z);
    for (const r of runners) {
      const q = V2.at(r.X, r.Z), kind = r.c.kind, base = { kind, id: 'x' + r.i, who: null, s: q.s * r.c.sc * (KINDS[kind].rx > 120 ? .85 : 1), x: q.x, y: q.y, noReflect: true, gaitW: lt * 330 + r.i * 47, axis: 'z', dir: 1, transit: true, vx: 0,
        arms: { l: 'run', r: 'run' }, rot: .1 * Math.sin(lt * 14 + r.i), look: [0, .3] };
      drawChar(Object.assign(base, r.c.extra, { s: base.s, kind }));
    }
    for (let i = 0; i < 18; i++) { const k = (lt * 3 + hash(i)) % 1; V2.dust(0, 0, 0, 0, lt, { n: 0 }); void k; }
    V2.dust(0, 500, W, 1500, lt, { n: 70, alpha: .55, size: 3.6, speed: 90 });
  },
  fx: lt => { const sh = SCENES.ding.shot(lt); return { bloom: .55, vignette: .5, grain: .05, contrast: .17, sat: .16, aberr: sh === 'bell' ? 7 * (1 - seg(lt, B('ding').s, B('ding').e + .3)) : 0, tint: sh === 'stampede' ? [['#8fb0ff', .1, 'soft-light']] : [['#ff9a40', .16, 'soft-light']] }; },
  blur: lt => SCENES.ding.shot(lt) === 'stampede' ? 5 : 1,
  over(lt) {
    const t = id => B(id), sh = SCENES.ding.shot(lt);
    if (sh === 'stampede') { A6.hud(38, { appear: 1 }); const k = seg(lt, t('stampede').e - 1.0, t('stampede').e - .6); if (k > 0) A6.slam(Math.min(k, 1 - seg(lt, t('stampede').e - .05, t('stampede').e + .3)), '3.4 SEC', 430, { size: 220, fill: '#58ff7a', sub: 'FASTEST RESPONSE OF THE SHIFT' }); }
    if (lt >= t('ding').s && lt < t('ding').e + .6) { const k = seg(lt, t('ding').s, t('ding').s + .12); ctx.save(); ctx.globalAlpha *= 1 - seg(lt, t('ding').e, t('ding').e + .6); ctx.translate(540, 560); ctx.scale(lerp(1.8, 1, easeOut(k)), lerp(1.8, 1, easeOut(k))); text('DING!', 0, 0, { size: 230, font: 'Bangers', weight: 400, fill: '#ffec8c', lw: 20, stroke: '#150f22', spacing: 4, shadow: 22 }); ctx.restore(); }
  },
};

// ============================================================================ the Fire Marshal, 7:05 PM
// the break-room staging: the staff stand in a V with a clear center lane, and the Marshal holds the middle at the front
const STAFF = { lime: [-370, 1210], straw: [-190, 1140], mango: [205, 1140], pear: [385, 1200] }, MARSHAL_AT = [-5, 1040];
SCENES.marshal = {
  horn: 28.65,
  strobe(lt) { const k = lt - SCENES.marshal.horn; return k < 0 ? 0 : (((k % 1.15) < .38) ? 1 : 0); },
  shot(lt) {
    const t = id => B(id);
    const order = [['door', t('f1').s + .9], ['wide1', t('point').s], ['point', t('f2').s - .05], ['cuP', t('s1').s - .05], ['cuS', t('f3').s + .35], ['det', t('f3').e - .05], ['cuP', t('s2').s - .05], ['cuS', t('f4').s - .05], ['cuP', t('s3').s - .05], ['cuS', t('f5').s - .05],
      ['punch', t('f6').s - .05], ['cuP', t('s4').s - .05], ['cuS', t('f7').s - .05], ['cuP', t('a1').s - .05], ['all', t('install').s - .05], ['batt', t('install').s + .75], ['horn', t('s5').s - .05], ['cuS', t('f8').s - .05], ['cuP', t('m1').s - .05], ['cuM', t('f9').s - .05], ['exit', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  marshalPos(lt) {
    if (lt < SCENES.marshal.cutAt) { const u = easeIO(seg(lt, .75, SCENES.marshal.cutAt)); return [lerp(-180, -110, u), lerp(2120, 1760, u)]; }
    return MARSHAL_AT;
  },
  cutAt: 2.0,
  cam(lt) {
    const sh = SCENES.marshal.shot(lt), t = id => B(id);
    V2.setCam({ f: 1400, cy: sh === 'door' || sh === 'wide1' ? 250 : 330, hy: sh === 'door' || sh === 'wide1' ? 800 : 860 });
    const [mx, mz] = SCENES.marshal.marshalPos(lt), pq = V2.at(mx, mz), sq = V2.at(...STAFF.straw), mq = V2.at(...STAFF.mango);
    if (sh === 'door') { const k = easeOut(seg(lt, 0, 1)); zoomTo(lerp(540, 470, k), lerp(900, 880, k), lerp(1.0, 1.5, k)); }
    else if (sh === 'wide1') zoomTo(540, 940, .94);
    else if (sh === 'point') zoomTo(540, 950, .94);
    else if (sh === 'cuP') faceZoom({ kind: 'pom', x: pq.x, y: pq.y, s: pq.s * .96 }, 2.1);
    else if (sh === 'cuS') faceZoom({ kind: 'straw', x: sq.x, y: sq.y, s: sq.s }, 2.2);
    else if (sh === 'cuM') faceZoom({ kind: 'mango', x: mq.x, y: mq.y, s: mq.s }, 2.2);
    else if (sh === 'punch') { const k = seg(lt, t('f5').s, t('f6').s); faceZoom({ kind: 'pom', x: pq.x, y: pq.y, s: pq.s * .96 }, lerp(2.3, 2.45, k), 30); CAM.shake = 12 * (1 - seg(lt, t('f5').s, t('f5').s + .5)); }
    else if (sh === 'all') zoomTo(540, 960, .94);
    else if (sh === 'horn') { const k = seg(lt, t('install').s + .75, t('s5').s); zoomTo(540, lerp(900, 940, k), .94); CAM.shake = 3; }
    else if (sh === 'exit') { zoomTo(540, 950, .94); CAM.shake = 3; }
  },
  draw(lt) {
    const sh = SCENES.marshal.shot(lt), t = id => B(id), strobe = SCENES.marshal.strobe(lt);
    if (sh === 'det') { A6.insDetector(lt - t('f3').s, { led: 0, open: seg(lt, t('f3').s + .4, t('f3').s + .8), nobatt: 1 }); return; }
    if (sh === 'batt') { const k = 1 - easeIO(seg(lt, t('install').s + .1, t('install').s + .6)); A6.insBattery(lt - t('install').s, k); return; }
    V2.setLight({ key: [.2, -.7], keyColor: '#ffbf80', keyA: .26, rim: '#ff8a4a', rimA: .6, shadow: '#1a0f14', shadowA: .46, amb: '#ffb890', ambA: .1, bounce: '#ff9a60', bounceA: .22 });
    V2.opts.reflect = true;
    const blurPx = ['cuP', 'cuS', 'cuM', 'punch'].includes(sh) ? 9 : 0;
    const sm = clamp(.75 + .25 * Math.sin(lt * .5));
    V2.dof(blurPx, () => { S6.breakRoom({ door: 1, sky: ['#30203a', '#d07a4a'] }); S6.wallClock(-460, 520, 1500, -1, 5, 7, 40); S6.microwave(350, 1500, { on: .1, door: 1, display: '0:00' }); S6.detector(0, 1400, 600, { led: sh === 'horn' || lt > SCENES.marshal.horn ? (strobe ? 1 : .3) : 0 }); S6.table3(-345, 1560, { w: 95, d: 250, h: 135, color: '#c9a26a' }); tableStuff(); });
    const [mx, mz] = SCENES.marshal.marshalPos(lt), moving = lt > .75 && lt < SCENES.marshal.cutAt;
    // the silhouette in the doorway: backlit, with a beam of hall light cutting through the smoke
    const back = sh === 'door' && lt < 1.2;
    if (back) V2.setLight({ key: [0, -.5], keyColor: '#fff6dc', keyA: .1, rim: '#fff6dc', rimA: .6, back: { color: '255,246,220', a: .95, w: 26 }, frontDark: .7, shadow: '#0a0608', shadowA: .6, shadowLong: .8 });
    const [dxp, dyp] = V2.p2(-180, 215, 2200); if (lt < 2.6) V2.beam(dxp, dyp + 80, dxp + 120, dyp + 900, 160 * kzz(2200), 620 * kzz(2200), '255,240,210', .32 * (1 - seg(lt, 1.2, 2.6)));
    // everyone else, standing in the smoke: Lime, Strawberry, Mango, Pear
    const cast = SCENES.marshal.cast(lt, sh, strobe);
    if (cast.marshal && lt > .9 && sh !== 'det') { const m = cast.marshal; V2.beam(m.x + 70 * m.s, m.y - 200 * m.s, m.x + 560, m.y - 40 * m.s, 36, 220, '255,244,200', .12); }
    const subj = { cuP: 'pom', punch: 'pom', cuS: 'straw', cuM: 'mango' }[sh];
    if (sh !== 'door') drawCast(cast.back, subj);
    if (cast.marshal) { const m = cast.marshal; if (moving) m.gaitW = pathDist(SCENES.marshal.marshalPos, lt), m.axis = 'z', m.dir = 1; drawCast([m], subj); }
    if (sh !== 'door') drawCast(cast.front, subj);
    smokeHaze(sm * .75, 0, 900); smokeHaze(sm * .25, 800, 1400);
    V2.smoke(V2.proj(350, 330, 1500)[0], V2.proj(350, 330, 1500)[1], lt, -2, { n: 30, rate: 5, life: 3.6, rise: 520, spread: 170, size: 80, alpha: .5, seed: 9 });
    V2.dust(60, 400, 1020, 1400, lt, { n: 50, alpha: .5, size: 3.6 });
    // the alarm: rings from the detector, and a red-white strobe over the room
    if (lt >= SCENES.marshal.horn) { const [x, y] = V2.p2(0, 600, 1400); for (let i = 0; i < 3; i++) A6.ring(x, y, (((lt - SCENES.marshal.horn) * 1.7 - i * .33) % 1 + 1) % 1, 'fire', { r0: 40, r1: 900, lw: 16, alpha: .8, squash: 1 }); V2.glow(x, y, 600, '255,50,40', .6 * strobe, 'screen', .9); }
  },
  cast(lt, sh, strobe) {
    const t = id => B(id), talkK = id => inB(lt, id);
    const [mx, mz] = SCENES.marshal.marshalPos(lt), mq = V2.at(mx, mz);
    const mExpr = lt < t('f1').s ? 'neutral' : talkK('f1') ? 'angry' : talkK('f2') ? 'angry' : talkK('f3') ? 'dead' : talkK('f4') ? 'angry' : talkK('f5') ? 'shock' : talkK('f6') ? 'sour' : talkK('f7') ? 'dead' : lt >= t('install').s ? 'angry' : 'sour';
    const marshal = pom(Object.assign(mq, { hold: { r: 'flashlight' }, grip: { r: [110, 46] }, arms: { l: inB(lt, 'f9') || inB(lt, 'f8') ? 'hips' : 'rest', r: 'hold' }, expr: mExpr, look: [lt < 6 ? .35 * Math.sin(lt * 1.6) : -.1, 0], who: 'marshal', s: mq.s * .96 }));
    if (talkK('f5') || talkK('f9')) marshal.arms.l = 'up';
    const back = [], front = [];
    const stand = (ctor, X, Z, extra) => ctor(Object.assign(V2.at(X, Z), extra));
    const pointing = sh === 'point';
    const sp = stand(straw, ...STAFF.straw, { expr: 'sour', look: [.4, 0], lid: .5, arms: { l: 'rest', r: 'rest' } }), mp = stand(mango, ...STAFF.mango, { expr: 'sour', look: [-.4, 0], arms: { l: 'rest', r: 'rest' }, hold: { l: 'popcornbag' } });
    const pr = stand(pear, ...STAFF.pear, { expr: 'smug', look: [-.5, 0], hold: { l: 'briefcase' }, arms: { l: 'hold', r: 'rest' } }), lm = stand(lime, ...STAFF.lime, { expr: 'happy', look: [.5, 0], arms: { l: 'rest', r: 'rest' }, cardColor: '#c98a2e' });
    sp.expr = talkK('s1') ? 'sour' : talkK('s2') ? 'sour' : talkK('s3') ? 'dead' : talkK('s4') ? 'smug' : talkK('s5') ? 'dead' : 'sour';
    if (inB(lt, 'a1')) for (const o of [sp, mp, pr, lm]) { o.who = 'all'; o.expr = 'dead'; o.look = [0, 0]; }
    mp.expr = inB(lt, 'm1') ? 'dead' : 'sour';
    if (pointing || (lt >= t('point').s - .1 && lt < t('point').e)) {   // the circle of blame: each points at the next
      const c = [[lm, sp], [sp, lm], [mp, pr], [pr, mp]];   // neighbors blame each other across the Marshal
      for (const [a, b] of c) { pointAt(a, a.x < b.x ? 1 : -1, b.x, b.y - 270 * b.s, .95); a.expr = 'smug'; a.look = [b.x > a.x ? .8 : -.8, 0]; }
    }
    // the group stands up after the last line and walks out through the doorway
    const leave = seg(lt, t('f9').s, t('f9').s + 1.9);
    const walkers = [[sp, ...STAFF.straw, 0], [mp, ...STAFF.mango, .35], [pr, ...STAFF.pear, .7], [lm, ...STAFF.lime, 1.0]];
    if (lt >= t('f9').s && sh === 'exit') walkers.forEach(([o, X, Z, d]) => { const u = easeIO(seg(lt, t('f9').s + d, t('f9').s + d + 1.9)), pos = V2.at(lerp(X, -180, u), lerp(Z, 2140, u)); Object.assign(o, pos, { gaitW: u * 700 + d * 90, axis: 'z', dir: -1, expr: 'dead', look: [0, 0], arms: { l: 'rest', r: 'rest' }, transit: true }); });
    const row = [lm, sp, mp, pr].sort((a, b) => a.y - b.y);
    for (const o of row) (o.y < marshal.y ? back : front).push(o);
    return { marshal, back, front };
  },
  fx: lt => { const sh = SCENES.marshal.shot(lt), st = SCENES.marshal.strobe(lt), horn = lt >= SCENES.marshal.horn; return { bloom: .75, vignette: .46, grain: .06, contrast: .18, sat: .14, aberr: horn ? 2 * st : 0, tint: [['#ff7a30', .2, 'soft-light'], ...(horn ? [['#ff2a20', .36 * st, 'screen']] : [])] }; },
  blur: lt => SCENES.marshal.shot(lt) === 'door' ? 2 : 1,
  over(lt) {
    const t = id => B(id);
    if (lt >= SCENES.marshal.horn - .05 && lt < SCENES.marshal.horn + 1.6) { const k = seg(lt, SCENES.marshal.horn, SCENES.marshal.horn + .15); ctx.save(); ctx.globalAlpha *= 1 - seg(lt, SCENES.marshal.horn + 1.0, SCENES.marshal.horn + 1.6); ctx.translate(540, 420); ctx.scale(lerp(1.7, 1, easeOut(k)), lerp(1.7, 1, easeOut(k))); text('BWAAAP', 0, 0, { size: 200, font: 'Bangers', weight: 400, fill: '#ff5a4a', lw: 18, stroke: '#150f22', spacing: 4, shadow: 20 }); ctx.restore(); }
  },
};
const kzz = z => V2.P.f / (z - V2.P.cz);
// the break-room table dressing: a donut box and two coffee cups (the table is a left-wall table at X -440..-250, Z 1310..1810, top at y 151)
function tableStuff() {
  S6.box3({ x0: -420, x1: -300, y0: 151, y1: 175, z0: 1380, z1: 1500, color: '#f4d9b0', front: '#ffe6c4', side: '#cdb08a', top: '#fff0d6' });
  S6.box3({ x0: -412, x1: -308, y0: 175, y1: 181, z0: 1388, z1: 1492, color: '#ff8fb8', front: '#ffa7c8', side: '#cf6f95', top: '#ffbcd6' });
  for (const z of [1600, 1700]) S6.box3({ x0: -350, x1: -318, y0: 151, y1: 196, z0: z, z1: z + 32, color: '#f6f3ee', front: '#ffffff', side: '#d6d2cb', top: '#5a3420' });
}

// ============================================================================ end card
// where a point in a character's local coordinates lands on screen (the inverse of localOf)
function localToScreen(o, u, v) {
  const k = KINDS[o.kind], legLen = o.noLegs ? 0 : (k.leg || 90), s = o.s || 1;
  return [o.x + u * s * (o.flip ? -1 : 1), o.y - (o.lift || 0) + (v - legLen - k.ry * .9) * s];
}
const confetti = (lt, t0, n = 64) => {
  if (lt < t0) return;
  const cols = ['#ffaa28', '#50a5ff', '#5ae682', '#ffcd46', '#ff4646', '#ffffff'];
  ctx.save();
  for (let i = 0; i < n; i++) {
    const v = 150 + 170 * hash(i + 11), y0 = -80 - 900 * hash(i + 3), x = (hash(i + 21) * 1.1 - .05) * W + 34 * Math.sin((lt - t0) * 1.7 + i), y = y0 + (lt - t0) * v;
    if (y < -20 || y > H + 20) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate((lt - t0) * (2 + 3 * hash(i + 5)) + i); ctx.scale(1, Math.cos((lt - t0) * (3 + 2 * hash(i + 8)) + i)); ctx.globalAlpha = .9 * seg(lt, t0, t0 + .4);
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-8, -5, 16, 10); ctx.restore();
  }
  ctx.restore();
};
SCENES.end = {
  noChyron: true,
  cam() {},
  draw(lt) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0c26'); g.addColorStop(.55, '#1d1252'); g.addColorStop(.78, '#150e3c'); g.addColorStop(1, '#07061a'); ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, H + 200);
    V2.glow(540, 1120, 760, '110,100,255', .34, 'screen', .8);
    const kinds = ['chair', 'pump', 'pulse', 'bed', 'door', 'call'];
    for (let i = 0; i < 6; i++) A6.ring(540, 740, (((lt * .5) - i / 6 * 1) % 1 + 1) % 1, kinds[i], { r0: 40, r1: 980, lw: 10, alpha: .42 });
    confetti(lt, .7);
    // the floor: a dark glossy stage with a pool of light under the cast
    const fy = 1428; ctx.fillStyle = V2.grad(0, fy - 20, 0, H, [[0, 'rgba(26,18,70,.0)'], [.08, 'rgba(34,24,88,.9)'], [1, 'rgba(8,6,24,1)']]); ctx.fillRect(0, fy - 20, W, H - fy + 20);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, fy + 6, 10, 560, [[0, 'rgba(170,160,255,.34)'], [1, 'rgba(170,160,255,0)']]); ctx.beginPath(); ctx.ellipse(540, fy + 6, 560, 70, 0, 0, TAU); ctx.fill(); ctx.restore();
    V2.setLight({ key: [-.4, -.8], keyColor: '#e8ecff', keyA: .26, rim: '#ff6a8a', rimA: .6, shadow: '#0a0a24', shadowA: .45, amb: '#8a90ff', ambA: .1 });
    V2.opts.reflect = true;
    const row = [['straw', { x: 150, s: 1.0, acc: STRAW_ACC, expr: 'happy', lashes: true }], ['mango', { x: 345, s: 1.0, acc: ['badge', 'gaitbelt', 'keys'], badgeText: 'CNA', expr: 'happy' }], ['pom', { x: 540, s: 1.06, acc: ['firehelmet', 'firecoat', 'mustache'], topExtra: 18, expr: 'neutral' }],
      ['pear', { x: 735, s: .98, acc: ['newsboy', 'suspenders', 'unionpin'], expr: 'smug' }], ['lime', { x: 930, s: .96, acc: ['readers', 'cardigan'], cardColor: '#c98a2e', expr: 'happy' }]];
    REG.suppress++;
    row.forEach(([kind, extra], i) => { const hop = Math.abs(Math.sin(lt * 4.2 + i)) * 14, pop = easeBack(seg(lt, .6 + i * .12, .95 + i * .12));
      if (pop > 0) drawChar(Object.assign({ kind, id: kind, y: fy - hop, arms: { l: 'cheer', r: 'wave' }, t: lt + i, transit: pop < 1 }, extra, { s: extra.s * pop })); });
    REG.suppress--;
  },
  fx: lt => ({ bloom: .7, vignette: .5, grain: .05, fade: lt < .25 ? 1 - lt / .25 : 0 }),
  blur: lt => 1,
  over(lt) {
    const k = easeBack(seg(lt, 0, .45));
    ctx.save(); ctx.translate(540, 0); ctx.scale(k, k);
    text('SHIFT HAPPENS', 0, 330, { size: 92, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 18, stroke: '#150f22', spacing: 4, shadow: 20 });
    text('ALARM FATIGUE', 0, 470, { size: 150, font: 'Bangers', weight: 400, fill: '#ff4a5e', lw: 20, stroke: '#150f22', spacing: 4, shadow: 24 });
    ctx.restore();
    const lines = [['For every nurse who has ever pulled the battery.', 42, '#ffffff', .8], ['Four matter. You find out when you get there.', 42, '#ffe135', 1.9], ['Answer the microwave. Check the batteries.', 40, '#ffe7c2', 3.0]];
    lines.forEach(([s2, size, c, at], i) => text(s2, 540, 650 + i * 76, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 9, maxW: 1000 }));
    // the teaser card, low on the screen under the cast
    const tk = easeBack(seg(lt, 4.2, 4.6));
    if (tk > 0) {
      ctx.save(); ctx.translate(540, 1640); ctx.scale(tk, tk);
      reg('overlay', [540 - 440 * tk, 1640 - 80 * tk, 540 + 440 * tk, 1640 + 80 * tk], { id: 'teaser' });
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(14,10,36,.92)'; rr(-440, -80, 880, 160, 80); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,214,150,.9)'; ctx.lineWidth = 4; rr(-440, -80, 880, 160, 80); ctx.stroke();
      V2.glow(-340, 0, 150, '255,236,200', .55, 'screen', .6);
      ctx.fillStyle = V2.grad(-396, -52, -284, 52, [[0, '#fffbe8'], [1, '#f2dcae']]); ctx.beginPath(); ctx.arc(-340, 0, 54, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(190,160,120,.3)'; for (const [dx, dy, r2] of [[-16, -14, 13], [14, 8, 10], [-4, 26, 8], [22, -22, 6]]) { ctx.beginPath(); ctx.arc(-340 + dx, dy, r2, 0, TAU); ctx.fill(); }
      text('NEXT TIME', -250, -34, { size: 30, fill: '#ffd1e6', weight: 900, align: 'left', spacing: 6 });
      text('The Actual Full Moon', -250, 22, { size: 56, font: 'Bangers', weight: 400, fill: '#ffffff', align: 'left', lw: 10, stroke: '#150f22', spacing: 2 });
      ctx.restore();
    }
    const hk = easeBack(seg(lt, 2.4, 2.8)); if (hk > 0) A6.hud(33, { appear: hk, flash: lt > 2.4 && lt < 2.6 ? 1 : 0 });
  },
  label: () => 'THANKS FOR WATCHING',
};

// ============================================================================ the parking lot, 7:31 PM
SCENES.post = {
  fadeAt: 3.04,
  cam() {},
  chirp(lt) { const e = (a, d) => lt >= a ? Math.max(0, 1 - (lt - a) / d) : 0; return Math.max(e(.6, .5), e(3.2, .3)); },
  mark: { pom: [250, 1100], straw: [-280, 1100], mango: [-10, 1130] },
  draw(lt) {
    const ph = Math.sin(lt * 9) > 0, chirp = SCENES.post.chirp(lt), M = SCENES.post.mark;
    V2.setLight({ key: [-.5, -.55], keyColor: '#ffc08a', keyA: .26, rim: ph ? '#ff4050' : '#4a80ff', rimA: .6, shadow: '#1a0f28', shadowA: .46, amb: '#8a90c0', ambA: .12 });
    V2.opts.reflect = false;
    S6.lot({ t: lt, flash: 1, ph });
    const sp = straw(Object.assign(V2.at(...M.straw), { look: [.85, 0], expr: lt >= B('s1').s ? 'dead' : 'chill', arms: { l: 'rest', r: 'rest' } }));
    const mp = mango(Object.assign(V2.at(...M.mango), { look: [.5, 0], expr: 'sour', arms: { l: 'rest', r: 'rest' }, hold: { l: 'popcornbag' } }));
    const m = pom(Object.assign(V2.at(...M.pom), { look: [-.7, 0], expr: lt >= B('f1').s ? 'angry' : 'neutral', who: 'marshal', hold: { r: 'detector' }, detLed: chirp, arms: { l: 'hips', r: 'hold' }, grip: { r: [122, 64] }, s: V2.at(...M.pom).s * .96 }));
    drawChar(sp); drawChar(mp); drawChar(m);
    const [dx, dy] = localToScreen(m, 122, 64 - 8);
    SCENES.post.det = [dx, dy];
    for (const a of [.6, 3.2]) if (lt >= a && lt < a + 1.1) A6.ring(dx, dy, (lt - a) / 1.1, 'chirp', { r0: 24, r1: 340, lw: 8, alpha: .85 });
  },
  fx: lt => ({ bloom: .6, vignette: .5, grain: .05, tint: [['#ff8a50', .12, 'soft-light']], fade: seg(lt, SCENES.post.fadeAt, SCENES.post.fadeAt + .14) }),
  blur: lt => 1,
  over(lt) {
    // the last chirp, heard and seen in the dark: a red LED floating in black
    if (lt >= SCENES.post.fadeAt + .1 && SCENES.post.det) {
      const [x, y] = SCENES.post.det, c = SCENES.post.chirp(lt), a = clamp(.15 + .85 * c);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(x, y, 2, 120, [[0, `rgba(255,70,70,${.9 * a})`], [1, 'rgba(255,70,70,0)']]); ctx.beginPath(); ctx.arc(x, y, 120, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,120,120,${a})`; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.restore();
    }
  },
};

// shared helpers for later v2 episodes (Episode 7 reuses the placement, camera and hallway helpers below)
window.H6 = { pathDist, person, still, runner, move, zoomTo, faceC, faceZoom, faceOf, drawBg, drawCast, inB, aft, bef, lerpA, localOf, pointAt, localToScreen, smokeHaze, hallDoors, bgDome, flick, HALL, KINDS6, grad2, confetti, CROWD };
window.__EP6_SCENES = SCENES;
EPISODES[6] = { num: 6, v2: true, title: 'Episode 6: Alarm Fatigue', TL: window.TIMELINE_EP6, SCENES, layout: 'v2', audio: 'build/ep6/audio.m4a' };
})();
