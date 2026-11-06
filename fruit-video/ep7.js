'use strict';
/* SHIFT HAPPENS, Episode 7: The Actual Full Moon.
 *
 * Fully staffed on paper, a bingo card that predicts the shift, a ninety-four-year-old who is the wolf, and one word nobody may say.
 * Built on the v2 renderer (v2_core.js, v2_char.js) and the Episode 6 sets (ep6_rooms.js) plus ep7_art.js, ep7_sets.js, ep7_ins.js.
 * Every position below is a world coordinate: X right, Z forward, from V2.at(X, Z). */
(() => {
if (!window.TIMELINE_EP7) return;
const { person, runner, pathDist, move, zoomTo, faceC, faceZoom, drawBg, drawCast, inB, aft, bef, lerpA, pointAt, localToScreen, grad2, confetti, hallDoors, flick, HALL, KINDS6 } = window.H6;
const A7 = window.A7, S7 = window.S7, A6 = window.A6, S6 = window.S6;
const { papaya, goji, lemon, cran, banana, pine, apple, drag, straw, mango, pear } = A7;
const still = (X, Z) => () => [X, Z];
// scene-relative time of a spoken word, from the recorded line's word timings
const wordT = (id, word) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return l.s - CUR.start + w[1]; };
const MOON = [800, 405], MOON_S = .9;   // where the Moon hangs in the lot sky (scene coordinates)


// a route through keyed positions [t, X, Z, ease]: linear travel between keys (so a walker never stops mid-route), 'io' or 'out' to ease a leg
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// scene coordinates to screen coordinates through the current 2D camera (for overlays that follow something in the world)
const toScr = (x, y) => [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z];
// draw a cast in depth order with the subject sharp and everything farther softened. What is nearer than the subject is left out of a close-up
// (the camera is "over there"), or drawn softened if the shot lists it in `keep`. With no subject, everyone is drawn sharp.
function layered(items, subj, blurPx, back, keep = [], only = null) {
  const list = items.filter(c => !only || only.includes(c.id)).sort((a, b) => b.z - a.z), si = list.findIndex(c => c.id === subj);
  if (si < 0 || blurPx <= 0) { back(); for (const c of list) c.draw(si < 0 || c.id === subj); return; }   // no subject: everyone is sharp, so everyone is audited
  V2.dof(blurPx, () => { back(); for (const c of list.slice(0, si)) c.draw(false); });
  list[si].draw(true);
  const near = list.slice(si + 1).filter(c => keep.includes(c.id));
  if (near.length) V2.dof(blurPx, () => { for (const c of near) c.draw(false); });
}
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}

// a neighbor of the subject in a close-up: out of focus, behind the shot, never audited
const nbr = o => V2.dof(6, () => drawBg(o));
// a soft contact shadow under a chair, so its legs stand on the floor like everything else
const chairShadow = (X, Z) => { const [px, py] = V2.p2(X, 0, Z), k = S6.kz(Z); ctx.save(); ctx.fillStyle = 'rgba(14,10,34,.26)'; ctx.beginPath(); ctx.ellipse(px, py + 3 * k, 70 * k, 15 * k, 0, 0, TAU); ctx.fill(); ctx.restore(); };

const SCENES = {};

// ============================================================================ the parking lot, 2:59 PM
SCENES.lot = {
  shot(lt) {
    const b = id => B(id);
    if (lt < b('m1').s - .1) return 'wide';
    if (lt < b('s1').s - .05) return 'moon';
    if (lt < b('m2').s - .05) return 'cuS';
    if (lt < b('s2').s - .05) return 'moon';
    if (lt < b('m3').s - .05) return 'cuS';
    if (lt < b('run').s - .05) return 'moon';
    if (lt < b('g1').s - .05) return 'run';
    if (lt < b('g2').s - .05) return 'two';
    if (lt < b('s3').s - .05) return 'card';
    if (lt < b('s4').s - .05) return 'two';
    if (lt < b('g4').s - .05) return 'cardMid';
    if (lt < b('s5').s - .05) return 'two';
    return 'cuS';
  },
  strawPath: lt => lt < .3 ? [250, 1090] : lt < 2.75 ? [lerp(250, -150, easeIO(seg(lt, .3, 2.75))), lerp(1090, 1100, seg(lt, .3, 2.75))] : [-150, 1100],
  mangoPath: lt => { const a = B('run'); return lt < a.s ? [1000, 1050] : [lerp(1000, 150, easeOut(seg(lt, a.s, a.e - .1))), 1050]; },
  cam(lt) {
    const sh = SCENES.lot.shot(lt);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    const sp = person(straw, SCENES.lot.strawPath, lt), m = (x, y, k) => zoomTo(MOON[0] + x, MOON[1] + 180 / k + y, k);
    if (sh === 'wide') { const k = seg(lt, 0, B('m1').s); zoomTo(lerp(560, 520, k), lerp(990, 960, k), lerp(1, 1.1, k)); }
    else if (sh === 'moon') {
      const id = ['m1', 'm2', 'm3'].find(i => lt >= B(i).s - .1 && lt < B(i).e + .35) || 'm1', k = seg(lt, B(id).s - .1, B(id).e + .3);
      if (id === 'm3') m(lerp(-30, 0, k), 0, lerp(2.0, 1.55, easeIO(k))); else if (id === 'm2') m(lerp(20, -10, k), 20, lerp(2.1, 2.25, k)); else m(0, 0, lerp(2.0, 2.15, easeOut(k)));
    }
    else if (sh === 'cuS') faceZoom(sp, lt >= B('s5').s ? lerp(2.0, 2.16, seg(lt, B('s5').s, B('s5').e + .6)) : 2.05, 100);
    else if (sh === 'run') zoomTo(540, 1040, 1.0);
    else if (sh === 'two') { const k = seg(lt, B('g1').s, B('s5').s); zoomTo(540, 1010, lerp(1.1, 1.18, k)); }
  },
  draw(lt) {
    const sh = SCENES.lot.shot(lt), t = id => B(id);
    if (sh === 'card' || sh === 'cardMid') { SCENES.lot.cardShot(lt, sh); return; }
    V2.setLight({ key: [-.55, -.7], keyColor: '#fff0cf', keyA: .26, rim: '#9fd0ff', rimA: .5, shadow: '#3a3060', shadowA: .32, bounce: '#d8e8c0', bounceA: .2, amb: '#fff6e0', ambA: .05 });
    V2.opts.reflect = false;
    const blurPx = sh === 'moon' ? 0 : sh === 'cuS' ? 6 : 0;
    V2.dof(blurPx, () => S7.lotDay({ t: lt + 3, hers: true, hersZ: 1060, brake: lt < .15 ? .9 : 0 }));
    // the Moon, pale in the afternoon sky
    const mid = ['m1', 'm2', 'm3'].find(i => inB(lt, i)), mExpr = inB(lt, 'm1') ? 'smug' : inB(lt, 'm2') ? 'happy' : inB(lt, 'm3') ? 'chill' : (lt < t('m1').s ? 'neutral' : 'smug');
    A7.moon(MOON[0], MOON[1], MOON_S, { alpha: lerp(0, .74, easeOut(seg(lt, 1.8, 2.8))), haloA: .45, t: lt, char: { expr: mExpr, look: sh === 'moon' ? [mid === 'm3' ? .2 : -.55, .5] : [-.6, .5], lid: inB(lt, 'm1') ? .38 : undefined } });
    if (sh !== 'moon' || lt < t('m1').s) { /* the rest of the cast is in the lot below */ }
    // the cast
    const walking = lt > .3 && lt < 2.75, sip = seg(lt, B('s2').s - .2, B('s2').s + .4) * (1 - seg(lt, B('s2').e - .2, B('s2').e + .3));
    const sp = person(straw, SCENES.lot.strawPath, lt, { stride: 42, look: lt < t('m1').s ? [-.7, -.1] : [.55, -.55], expr: lt < t('m1').s ? 'chill' : inB(lt, 's1') ? 'dead' : inB(lt, 's2') ? 'sour' : inB(lt, 's3') ? 'shock' : inB(lt, 's4') ? 'sour' : inB(lt, 's5') ? 'dead' : 'dead',
      hold: { r: 'mug7' }, grip: { r: [78, 48] }, arms: { l: walking ? [.28 + .35 * Math.sin(pathDist(SCENES.lot.strawPath, lt) / 84 * PI), .25] : 'rest', r: sip > 0 ? [1.95, 1.7] : 'hold' }, lid: lt >= t('m1').s && lt < t('s2').e ? .5 : undefined });
    if (lt >= t('run').s - .1) {
      const mp = person(mango, SCENES.lot.mangoPath, lt, { stride: 46, look: [-.8, 0], expr: lt < t('g1').s ? 'happy' : inB(lt, 'g3') ? 'happy' : inB(lt, 'g4') ? 'happy' : 'happy', transit: lt < t('run').e,
        hold: { l: 'card7' }, grip: { l: lt < t('g1').s ? [-96, 40] : [-100, -30] }, arms: { l: 'hold', r: lt < t('run').e ? 'run' : inB(lt, 'g3') ? 'shrug' : 'rest' }, cardMarks: [], cardNow: lt });
      if (lt < t('run').e - .05) { mp.gaitW = pathDist(SCENES.lot.mangoPath, lt); mp.axis = 'x'; mp.dir = -1; }
      const subj = sh === 'cuS' ? 'straw' : null;
      (subj === 'straw' || sh === 'moon' ? nbr : drawChar)(mp); (sh === 'moon' ? nbr : drawChar)(sp);
    } else (sh === 'moon' ? nbr : drawChar)(sp);
    V2.dust(60, 400, 1020, 1500, lt, { n: 36, alpha: .5, size: 3 });
  },
  cardShot(lt, sh) {
    const t = id => B(id), l = wordT('g2', 'leaves'), h = wordT('g2', 'howls'), p = wordT('g2', 'peeled');
    const hi = sh === 'cardMid' ? [12] : lt >= p ? [2] : lt >= h ? [1] : lt >= l ? [0] : [];
    const zoom = sh === 'cardMid' ? lerp(1, 1.1, seg(lt, t('s4').s, t('s4').e)) : 1;
    A7.insCard(CUR.start + lt, lt - (t('g2').s - .4), { hi, appear: sh === 'card' ? undefined : 1, zoom, circle: sh === 'cardMid' ? [12, seg(lt, t('s4').s - .1, t('s4').s + .6)] : null });
  },
  fx: lt => ({ bloom: .5, contrast: .14, sat: .14, vignette: .42, tint: [['#ffb060', .12, 'soft-light']], fade: Math.max(.35 * (1 - easeOut(seg(lt, 0, .45))), seg(lt, CUR.dur - .25, CUR.dur - .02)), fadeColor: lt > CUR.dur / 2 ? '0,0,10' : '255,240,210' }),
  blur: lt => lt > .3 && lt < 2.8 ? 2 : 1,
  over(lt) {
    const t = id => B(id), a = seg(lt, t('m1').s - .1, t('m1').s + .25) * (1 - seg(lt, t('m3').e - .25, t('m3').e + .05));
    if (a > 0) A7.moonHud(lt, { appear: a, roll: seg(lt, t('m1').s + .5, t('m1').e), sub: 'FULL' });
  },
};

// ============================================================================ title
SCENES.title = {
  noChyron: true,
  cam(lt) { const hit = B('logo').s + 2.2; CAM.shake = lt > hit && lt < hit + .6 ? 20 * (1 - (lt - hit) / .6) : 0; },
  draw(lt) {
    const hit = B('logo').s + 2.2;
    ctx.fillStyle = grad2(0, 0, 0, H, '#070a26', '#1b1450'); ctx.fillRect(-100, -100, W + 200, H + 200);
    A7.stars(lt, 1100, { n: 120, a: easeOut(seg(lt, .2, 1.6)) });
    A7.clouds(lt, 500, 1500, { n: 5, tint: '90,100,170', belly: '30,36,90', a: .5, speed: 22, seed: 4, scale: 1.4 });
    // the Moon rises behind the title, warm at the horizon and white by the downbeat
    const rise = easeOut(seg(lt, .1, hit)), my = lerp(2300, 1130, rise), warm = 1 - easeIO(seg(lt, 1.0, hit));
    A7.rays(540, my, 290, 1500, lt, { n: 16, color: '220,232,255', a: .09 * easeOut(seg(lt, .8, hit + .4)), spin: .03 });
    A7.moon(540, my, 1.75, { warm, t: lt, char: { expr: lt < hit ? 'chill' : 'smug', look: [0, .1], transit: rise < 1 } });
    // shockwave rings on the downbeat
    for (let i = 0; i < 3; i++) A6.ring(540, my, (lt - hit - i * .12) / 1.4, 'moon', { r0: 290, r1: 1300, lw: 16 - i * 3, alpha: .8 });
    // the cast, as silhouettes against the Moon
    V2.setLight({ key: [0, 0], keyA: 0, rim: '#cfe0ff', rimA: .6, shadow: '#05061a', shadowA: .9, shadowLong: 0, back: { color: '205,224,255', a: .9, w: 22 }, frontDark: .8, bounceA: 0 });
    const s0 = easeBack(seg(lt, 1.2, 1.7)), m0 = easeBack(seg(lt, 1.4, 1.9));
    const dark = ['#2a1c4a', '#160f30', '#0a0620'];
    if (s0 > 0) drawChar(Object.assign(straw({ x: 250, y: 1640, s: 1.2 * s0, expr: 'dead', look: [.4, -.4], arms: { l: 'rest', r: 'rest' }, transit: lt < 2.0, noReflect: true, colors: dark, acc: [] })));
    if (m0 > 0) drawChar(Object.assign(mango({ x: 830, y: 1640, s: 1.2 * m0, expr: 'shock', look: [-.4, -.6], arms: { l: 'rest', r: 'rest' }, transit: lt < 2.0, noReflect: true, colors: dark, acc: [] })));
    // the logo slams on the downbeat
    const k = seg(lt, hit, hit + .4);
    if (k > 0) {
      const sc = lerp(1.7, 1, easeOut(k)), a = clamp(k * 3);
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(540, 250); ctx.scale(sc, sc);
      text('SHIFT HAPPENS', 0, 0, { size: 96, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 16, stroke: '#150f22', spacing: 4, shadow: 20 }); ctx.restore();
      // the title lands with a short punch; no line is ever wider than the frame (FULL MOON is 906 px at rest) and the two lines never touch
      const k2 = seg(lt, hit + .08, hit + .5), e2 = easeOut(k2), sc2 = lerp(1.4, 1, e2);
      ctx.save(); ctx.globalAlpha *= clamp(k2 * 3); ctx.translate(540, 520); ctx.scale(sc2, sc2);
      text('THE ACTUAL', 0, 0, { size: 150, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 20, stroke: '#150f22', spacing: 5, shadow: 26 }); ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp(k2 * 3); ctx.translate(540, 710 + 14 * (1 - e2)); ctx.scale(lerp(1.08, 1, e2), lerp(1.18, 1, e2));
      text('FULL MOON', 0, 0, { size: 230, font: 'Bangers', weight: 400, fill: '#d8e6ff', lw: 24, stroke: '#150f22', spacing: 6, shadow: 34 }); ctx.restore();
      V2.glow(540, 640, 800, '170,200,255', .3 * a, 'screen', .8);
      const chip = easeBack(seg(lt, hit + .35, hit + .75));
      if (chip > 0) { ctx.save(); ctx.translate(540, 384); ctx.scale(chip, chip); ctx.fillStyle = '#7b61ff'; rr(-150, -34, 300, 68, 34); ctx.fill(); ctx.strokeStyle = '#150f22'; ctx.lineWidth = 6; ctx.stroke(); text('EPISODE 7', 0, 3, { size: 40, fill: '#fff', spacing: 3 }); ctx.restore(); }
    }
  },
  fx: lt => { const hit = B('logo').s + 2.2; return { bloom: .9, vignette: .55, grain: .06, aberr: lt > hit && lt < hit + .5 ? 8 * (1 - (lt - hit) / .5) : 0, fade: lt < .3 ? 1 - lt / .3 : (lt > hit && lt < hit + .12 ? .5 * (1 - (lt - hit) / .12) : 0), fadeColor: lt > hit ? '230,240,255' : '0,0,0' }; },
  blur: lt => lt > B('logo').s + 2.1 && lt < B('logo').s + 2.7 ? 3 : 1,
  over() {},
};


// ============================================================================ the nurses' station, 3:05 PM
const STAFF = { straw: [-175, 1000], mango: [175, 1000], lemon: [0, 1060] };
// each line on the whiteboard: p is how much of it has been written, check how much of its tick
const boardLines = (p2, c2, p3, p4) => [
  { t: '3 TO 11', x: .05, y: .16, size: .12, color: '#2a5ac8', rot: -.02, p: 1 },
  { t: 'STAFFING: FULL', x: .05, y: .34, size: .105, color: '#1f9a52', rot: -.01, p: p2, check: c2 },
  { t: 'MOON: NOT A FACTOR', x: .05, y: .51, size: .092, color: '#2a5ac8', p: p3 },
  { t: 'CNAs: 2 CALLED OUT', x: .05, y: .68, size: .092, color: '#d62a3a', p: p4 },
];
const boardDay = lt => boardLines(seg(lt, B('l1').s + .9, B('l1').s + 1.7), seg(lt, B('l1').s + 1.75, B('l1').s + 2.15), seg(lt, B('l2').s + .9, B('l2').s + 2.7), seg(lt, B('l4').s + .3, B('l4').e - .2));
const boardDone = boardLines(1, 1, 1, 1);
// a tube failing: irregular on and off at 15 Hz inside a window, steady outside it
const lampFlicker = (lt, t0, t1) => lt >= t0 && lt < t1 ? (hash(Math.floor(lt * 15) + 3) > .42 ? 1 : .08) : 1;
SCENES.station = {
  shot(lt) {
    const b = id => B(id);
    if (lt < b('l1').s) return 'wide';
    if (lt < b('s1').s - .05) return 'cuL';
    if (lt < b('l2').s - .05) return 'cuS';
    if (lt < b('g1').s - .05) return 'cuL';
    if (lt < b('s2').s - .05) return 'cuM';
    if (lt < b('l4').s - .05) return 'cuS';
    if (lt < b('g2').s - .05) return 'cuL';
    if (lt < b('rule').s - .05) return 'cuM';
    if (lt < b('s3').s - .05) return 'wide';
    if (lt < b('g3').s - .05) return 'cuS';
    if (lt < b('flick').s - .02) return 'cuM';
    if (lt < b('s4').s - .05) return 'sign';
    if (lt < b('g4').s - .05) return 'cuS';
    return 'cuM';
  },
  cam(lt) {
    const sh = SCENES.station.shot(lt), sp = V2.at(...STAFF.straw), mp = V2.at(...STAFF.mango);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    if (sh === 'wide') { const k = seg(lt, 0, B('l1').s + 3); zoomTo(540, lerp(990, 975, k), lerp(1, 1.05, k)); }
    else if (sh === 'cuL') { const k = seg(lt, B('l1').s, B('l4').e); zoomTo(lerp(540, 546, k), 950, lerp(1.26, 1.32, k)); }
    else if (sh === 'cuS') faceZoom({ kind: 'straw', x: sp.x, y: sp.y, s: sp.s }, 2.0, 80);
    else if (sh === 'cuM') faceZoom({ kind: 'mango', x: mp.x, y: mp.y, s: mp.s }, 2.0, 80);
    else if (sh === 'sign') { const k = seg(lt, B('flick').s, B('flick').e); zoomTo(457, 553, lerp(2.3, 2.5, k)); }
  },
  draw(lt) {
    const sh = SCENES.station.shot(lt), t = id => B(id), fl = lampFlicker(lt, t('flick').s, t('flick').e);
    V2.setLight({ key: [-.35, -.8], keyColor: '#fff4dc', keyA: .22, rim: '#8fb8ff', rimA: .42, shadow: '#2a2038', shadowA: .3, amb: '#fff0d8', ambA: .05 });
    V2.opts.reflect = true;
    // sign: 41 hours, until Mango says the word
    const reset = lt >= t('flick').s + .45, hrs = reset ? 0 : 41, flash = lt >= t('flick').s && lt < t('flick').e + .3 ? (Math.sin(lt * 30) > 0 ? 1 : .3) : 0;
    const flicker = lt >= t('flick').s && lt < t('flick').s + .45 ? (hash(Math.floor(lt * 20)) > .4 ? 1 : .1) : 1;
    const blurPx = sh === 'cuS' || sh === 'cuM' ? 9 : sh === 'cuL' ? 3 : sh === 'sign' ? 0 : 0;
    V2.dof(blurPx, () => S7.stationBack({ noLabel: sh !== 'wide', t: lt + 5, hours: hrs, qFlash: flash, qFlicker: flicker, board: boardDay(lt), lampsOn: fl, min: 5, hr: 3, lamps: [] }));
    const lm = SCENES.station.lemon(lt), sp = SCENES.station.straw(lt), mp = SCENES.station.mango(lt);
    const bg = (o, who) => (sh === 'cuS' && who !== 'straw') || (sh === 'cuM' && who !== 'mango') || (sh === 'cuL' && who !== 'lemon') ? nbr(o) : drawChar(o);
    S7.stationCounter({ night: false });
    if (sh !== 'sign') { bg(lm, 'lemon'); bg(sp, 'straw'); bg(mp, 'mango'); }
    if (lt >= t('flick').s && lt < t('flick').e + .3) V2.glow(540, 700, 900, '255,40,50', .22 * flash, 'screen', .6);
    V2.dust(60, 600, 1020, 1400, lt, { n: 30, alpha: .35 });
  },
  lemon(lt) {
    const q = V2.at(...STAFF.lemon), b = id => B(id), talk = ['l1', 'l2', 'l3', 'l4'].some(i => inB(lt, i));
    const o = lemon(Object.assign(q, { look: lt < b('g1').s ? [-.55, .15] : lt < b('g2').s ? [.5, .1] : [.1, .1], expr: inB(lt, 'l1') ? 'happy' : inB(lt, 'l2') ? 'neutral' : inB(lt, 'l3') ? 'smug' : inB(lt, 'l4') ? 'neutral' : lt >= b('rule').s && lt < b('s4').s ? 'neutral' : 'neutral',
      hold: { l: 'clipboard6' }, grip: { l: [-100, 30] }, clipText: 'ROSTER', arms: { l: 'hold', r: inB(lt, 'l2') ? 'point' : inB(lt, 'l4') ? 'up' : 'rest' } }));
    if (inB(lt, 'l2')) { const [bx, by] = V2.p2(-60, 560, 1900); pointAt(o, 1, bx + 60 * Math.sin(lt * 3), by, .98); o.hold = Object.assign({}, o.hold, { r: 'pen' }); }
    return o;
  },
  straw(lt) {
    const q = V2.at(...STAFF.straw), b = id => B(id);
    return straw(Object.assign(q, { look: [.5, -.05], expr: lt < b('s1').s ? 'chill' : inB(lt, 's1') ? 'sour' : inB(lt, 's2') ? 'dead' : inB(lt, 's3') ? 'smug' : inB(lt, 's4') ? 'dead' : lt >= b('g3').s ? 'shock' : 'dead',
      arms: { l: inB(lt, 's1') ? 'hips' : 'rest', r: inB(lt, 's2') ? 'shrug' : inB(lt, 's3') ? 'point' : 'rest' }, lid: lt < b('s1').s ? .5 : undefined }));
  },
  mango(lt) {
    const q = V2.at(...STAFF.mango), b = id => B(id);
    return mango(Object.assign(q, { look: [-.5, -.05], expr: inB(lt, 'g1') ? 'hopeful' : inB(lt, 'g2') ? 'happy' : inB(lt, 'g3') ? 'happy' : lt >= b('flick').s ? 'shock' : inB(lt, 'g4') ? 'sad' : lt >= b('l4').e ? 'happy' : 'neutral',
      arms: { l: inB(lt, 'g1') ? 'up' : 'rest', r: inB(lt, 'g2') ? 'thumb' : inB(lt, 'g3') ? 'rest' : 'rest' } }));
  },
  fx: lt => { const t = id => B(id), fl = lampFlicker(lt, t('flick').s, t('flick').e); return { bloom: .5, vignette: .42, grain: .045, contrast: .15, sat: .14, tint: [['#ffd9a0', .1, 'soft-light']], fade: (1 - fl) * .55, fadeColor: '0,0,10' }; },
  blur: lt => 1,
  over(lt) {
    const t = id => B(id), rk = seg(lt, t('rule').s, t('rule').s + .5) * (1 - seg(lt, t('rule').e - .22, t('rule').e - .02));
    if (rk > 0) A7.ruleCard(rk, { y: 470 });
    A7.ballWipe(seg(lt, CUR.dur - .5, CUR.dur - .06), 7);
  },
};


// ============================================================================ bingo night, 5:30 PM
const SEAT = { pear: [-440, 1500], banana: [-150, 1500], prune: [107, 1500], cran: [330, 1450], star: [-385, 2200], coco: [318, 2200], fig: [556, 2200] };
const CALLER = [10, 2150], CTABLE = [10, 2020], PEEL = [235, 1190];
const CALLS = [['p2', 7], ['p3', 22], ['p4', 45], ['p5', 52]];
const BRT = {
  straw: route([[0, -200, 1000], [4.6, -200, 1000], [5.5, 20, 1260, 'io'], [8.7, 20, 1260], [11.3, -300, 1450, 'io']]),
  mango: route([[0, 215, 1000], [19.0, 215, 1000], [21.0, -45, 1060, 'io'], [30.9, -45, 1060], [32.9, 700, 960], [33.8, -22, 1060]]),
  pear: route([[0, SEAT.pear[0], SEAT.pear[1]], [12.0, SEAT.pear[0], SEAT.pear[1]], [12.5, -440, 1560, 'io'], [16.4, -440, 1560], [19.4, -620, 2240]]),
  banana: route([[0, SEAT.banana[0], SEAT.banana[1]], [30.55, SEAT.banana[0], SEAT.banana[1]], [31.5, -90, 1160], [32.3, 300, 940], [33.3, 900, 900]]),
};
SCENES.bingo = {
  shot(lt) {
    const b = id => B(id);
    const order = [['wide', b('p1').s + 1.0], ['cuP', b('cage1').s], ['cage', b('p2').s - .56], ['ball', b('r7').s], ['cranUp', b('c1').s + .12], ['cuC', b('s1').s - .05], ['cuS', b('c2').s - .05], ['cuC', b('p3').s - .56],
      ['ball', b('x1').s], ['door', b('pe1').s - .05], ['cuPe', b('s2').s - .05], ['cuS', b('pe2').s - .05], ['cuPe', b('s3').s - .05], ['cuS', b('s3').e + .05], ['leave', b('p4').s - .56],
      ['ball', b('ring').s], ['phone', b('pi1').s - .05], ['cuSp', b('pi2').s + 1.1], ['cuMp', b('pi2').s + 2.0], ['cuSp', b('p5').s - .56], ['ball', b('ba1').s], ['banana', b('ba1').e + .3], ['chase', b('g2').s - .05],
      ['cuM', b('s6').s - .05], ['cuS', b('g3').s - .05], ['cuM', b('p6').s - .1], ['wideEnd', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  callAt(lt) { const c = CALLS.find(([id]) => lt >= B(id).s - .3 && lt < B(id).e + .1); return c ? { n: c[1], t: lt - (B(c[0]).s - .3) } : null; },
  cam(lt) {
    const sh = SCENES.bingo.shot(lt), cast = SCENES.bingo.cast(lt), by = id => cast.find(c => c.id === id).o;
    V2.setCam(['wide', 'wideEnd', 'chase'].includes(sh) ? { f: 1400, cy: 900, hy: 330 } : { f: 1400, cy: 360, hy: 860 });   // the room shots look down on it from high up, so the back rows show clear over the front
    const fz = (id, z, up = 80) => { const o = by(id); faceZoom({ kind: o.kind, x: o.x, y: o.y - (o.seatUp || 0), s: o.s, noLegs: o.noLegs }, z / o.s * (o.zk || 1), up); };
    if (sh === 'wide') { const k = seg(lt, 0, 6); zoomTo(540, lerp(1070, 1060, k), lerp(.97, 1.0, k)); }
    else if (sh === 'cuP') { const k = seg(lt, B('p1').s + 1.0, B('cage1').s); fz('papa', lerp(1.9, 2.1, k), 70); }
    else if (sh === 'cranUp') fz('cran', 1.9, 120);
    else if (sh === 'cuC') fz('cran', 2.0, 80);
    else if (sh === 'cuS' || sh === 'cuSp') fz('straw', 2.0, 80);
    else if (sh === 'cuPe') fz('pear', 2.0, 80);
    else if (sh === 'cuM' || sh === 'cuMp') fz('mango', 2.0, 80);
    else if (sh === 'banana') { fz('banana', 1.8, 100); CAM.shake = 6; }
    else if (sh === 'door') { const k = seg(lt, B('x1').s - .2, B('x1').e); zoomTo(lerp(185, 150, k), 930, lerp(2.2, 2.4, k)); }
    else if (sh === 'phone') fz('straw', 1.5, 100);
    else if (sh === 'leave') fz('pear', 1.5, 90);
    else if (sh === 'chase') { const k = seg(lt, B('ba1').e + .3, B('g2').s); zoomTo(lerp(520, 565, easeIO(k)), 1190, 1.0); }
    else if (sh === 'wideEnd') { const k = seg(lt, B('p6').s - .1, B('p6').s + 2.0); zoomTo(lerp(540, 560, easeIO(k)), lerp(1090, 1100, k), lerp(.97, 1.01, easeIO(k))); }
  },
  // the cast for this frame: every person with their depth and a draw function (drawn sharp for the subject, as a background neighbor otherwise)
  cast(lt) {
    const b = id => B(id), items = [], add = (id, ctor, o, z, bgAlways = false, pre, post) => items.push({ id, o, z, draw: sharp => { if (pre) pre(); (sharp && !bgAlways ? drawChar : drawBg)(o); if (post) post(); }, ctor });
    const seatedBase = (ctor, name, extra, chair = '#8a5a34', wheel = false) => {
      const [X, Z] = SEAT[name], q = V2.at(X, Z), sc = .98;
      const o = ctor(Object.assign({ x: q.x, y: q.y - 100 * q.s, s: q.s * sc, noLegs: true, noShadow: true, look: [X < 0 ? .75 : -.75, 0], seatUp: 0 }, extra));
      o.seatUp = 0;
      return { o, q, chair };
    };
    // papaya, calling, behind her table
    { const q = V2.at(...CALLER), talk = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].some(i => inB(lt, i)), o = papaya(Object.assign(q, { s: q.s * .98, look: [.1, .15], expr: inB(lt, 'p6') ? 'hopeful' : 'happy', hold: { r: 'mic7' }, grip: { r: [46, 78] }, arms: { l: talk ? 'wave' : 'rest', r: 'hold' }, noReflect: true }));
      items.push({ id: 'papa', o, z: CALLER[1], draw: sharp => { (sharp ? drawChar : drawBg)(o); } }); }
    // the caller's table and the cage on it
    items.push({ id: 'ctable', o: { x: 0, y: 0 }, z: CTABLE[1] - 1, draw: () => { S6.table3(-50, CTABLE[1], { w: 230, d: 60, h: 140, color: '#d8c0a0' }); const [cx, cy] = V2.p2(-175, 140, CTABLE[1] - 20), k = S6.kz(CTABLE[1]); ctx.save(); A7.drawCage(cx, cy - 78 * k, 78 * k, lt * (inB(lt, 'cage1') ? 1 : .15), { balls: 14 }); ctx.restore(); } });
    // residents
    const res = (name, ctor, extra, id = name) => { const r = seatedBase(ctor, name, extra); items.push({ id, o: r.o, z: SEAT[name][1] + 70, draw: sharp => { chairShadow(SEAT[name][0], SEAT[name][1] + 70); S6.chair3(SEAT[name][0], SEAT[name][1] + 70, { color: r.chair, w: 46, d: 40, seat: 100, back: 240 }); drawBg(r.o); }, bg: true }); };   // set dressing: always the unaudited background, always behind the named characters
    res('star', (o) => Object.assign({ kind: 'star', id: 'star', s: SC, y: G, acc: ['glasses'], expr: 'happy' }, o), { who: null });
    res('prune', (o) => Object.assign({ kind: 'prune', id: 'prune', s: SC, y: G, expr: 'sour' }, o), { who: null });
    res('coco', (o) => Object.assign({ kind: 'coco', id: 'coco', s: SC, y: G, expr: 'happy' }, o), { who: null });
    res('fig', (o) => Object.assign({ kind: 'fig', id: 'fig', s: SC, y: G, acc: ['fedora'], expr: 'smug' }, o), { who: null });
    // Mrs. Cranberry in her wheelchair: she keeps bobbing out of the seat to test the pad
    { const [X, Z] = SEAT.cran, q = V2.at(X, Z), hop = [b('r7').s + .03, b('r7').s + .25, b('r7').s + .47].reduce((m, h) => { const k = (lt - h) / .2; return k > 0 && k < 1 ? Math.max(m, Math.sin(k * PI) * 46 * q.s) : m; }, 0);
      const o = cran(Object.assign({ x: q.x, y: q.y - 118 * q.s, s: q.s, noLegs: true, noShadow: true, lift: hop, look: [-.7, 0], expr: inB(lt, 'r7') ? 'shock' : inB(lt, 'c1') ? 'happy' : inB(lt, 'c2') ? 'smug' : 'happy', arms: { l: 'rest', r: 'rest' } }));
      items.push({ id: 'cran', o, z: Z + 70, draw: sharp => { S7.wheelchairBack(q.x, q.y, q.s); (sharp ? drawChar : drawBg)(o); S7.wheelchairFront(q.x, q.y, q.s); } }); }
    // Mr. Pear: waits with his briefcase, rises for the taxi, walks out to it
    { const p = BRT.pear(lt), standing = lt >= 11.9, q = V2.at(p[0], p[1]), seated = !standing, rise = seg(lt, 11.9, 12.25), walking = lt > 16.4;
      const o = pear(Object.assign(q, standing ? { s: q.s, lift: Math.sin(rise * PI) * 18 } : { y: q.y - 100 * q.s, s: q.s * .98, noLegs: true, noShadow: true }, { look: lt < 11.9 ? [.7, 0] : inB(lt, 's2') ? [.9, 0] : [.8, 0], expr: lt < b('x1').s ? 'neutral' : inB(lt, 'pe1') ? 'happy' : inB(lt, 'pe2') ? 'smug' : lt > b('s3').s ? 'happy' : 'neutral', hold: { r: 'briefcase' }, arms: { l: 'hips', r: 'hold' } }));   // in his right hand, the one toward the room: held on the left it hung off the edge of the frame
      if (walking) { o.gaitW = pathDist(BRT.pear, lt) - pathDist(BRT.pear, 16.4); o.axis = 'z'; o.dir = -1; o.transit = true; o.noFoley = false; }
      if (lt < 19.9) items.push({ id: 'pear', o, z: p[1] + (seated ? 70 : 0), draw: sharp => { if (seated) { chairShadow(SEAT.pear[0], SEAT.pear[1] + 70); S6.chair3(SEAT.pear[0], SEAT.pear[1] + 70, { color: '#8a5a34', w: 46, d: 40, seat: 100, back: 240 }); } (sharp ? drawChar : drawBg)(o); } }); }
    // Mr. Banana: sits, peels, bolts across the room
    { const p = BRT.banana(lt), run = lt >= 30.55, q = V2.at(p[0], p[1]), pk = seg(lt, b('ba1').s - .1, b('ba1').s + .3), air = run ? Math.max(0, Math.sin(seg(lt, 30.55, 30.95) * PI)) * 90 * q.s : 0;
      const o = banana(Object.assign(q, run ? { s: q.s, lift: air } : { y: q.y - 100 * q.s, s: q.s * .98, noLegs: true, noShadow: true }, { look: run ? [.6, 0] : [.75, 0], expr: lt < b('p5').e ? 'happy' : 'happy', acc: lt >= b('ba1').s - .15 ? ['peeled'] : [], peelOpen: easeOut(pk), arms: run ? { l: 'run', r: 'run' } : { l: 'rest', r: 'rest' }, vx: run ? 700 : 0 }));
      if (run && lt > 30.95) { o.gaitW = pathDist(BRT.banana, lt) * 1.0; o.axis = Math.abs(p[1] - BRT.banana(lt - .05)[1]) > Math.abs(p[0] - BRT.banana(lt - .05)[0]) * 1.2 ? 'z' : 'x'; o.dir = o.axis === 'z' ? -1 : 1; o.transit = true; }
      items.push({ id: 'banana', o, z: p[1] + (run ? 0 : 70), draw: sharp => { if (!run) { chairShadow(SEAT.banana[0], SEAT.banana[1] + 70); S6.chair3(SEAT.banana[0], SEAT.banana[1] + 70, { color: '#8a5a34', w: 46, d: 40, seat: 100, back: 240 }); } if (lt < 33.4 || lt > 34) (sharp ? drawChar : drawBg)(o); } }); }
    // Strawberry and Mango
    { const p = BRT.straw(lt), q = V2.at(...p), calling = lt >= b('ring').s - .1 && lt < b('d3').s + .2, onPhone = lt >= b('pi1').s - .15 && lt < b('d3').s + .1, walk = lt > 4.6 && lt < 5.4 || lt > 8.7 && lt < 11.2;
      const o = straw(Object.assign(q, { stride: 38, look: lt < b('c2').e ? [.6, .1] : lt < b('x1').s ? [-.5, 0] : [-.9, 0], expr: inB(lt, 's1') ? 'chill' : inB(lt, 's2') ? 'sour' : inB(lt, 's3') ? 'dead' : inB(lt, 's4') ? 'sour' : inB(lt, 's5') ? 'dead' : inB(lt, 's6') ? 'sour' : inB(lt, 'p6') ? 'dead' : 'chill',
        hold: calling ? { l: 'handset' } : undefined, arms: { l: calling ? 'phone' : 'rest', r: 'rest' }, lid: lt >= b('p6').s ? .55 : undefined }));
      if (walk) { o.gaitW = pathDist(BRT.straw, lt); o.axis = lt > 8 ? 'x' : 'z'; o.dir = lt > 8 ? -1 : 1; }
      if (calling && lt >= b('ring').s && lt < b('pi1').s) { o.rot = .03 * Math.sin(lt * 40); }
      items.push({ id: 'straw', o, z: p[1], draw: sharp => (sharp ? drawChar : drawBg)(o) }); }
    { const p = BRT.mango(lt), q = V2.at(...p), chasing = lt >= 30.9 && lt < 32.9, back = lt >= 32.9 && lt < 33.8;
      const o = mango(Object.assign(q, { stride: 46, look: [-.6, 0], expr: inB(lt, 'g1') ? 'angry' : inB(lt, 'g2') ? 'happy' : inB(lt, 'g3') ? 'happy' : lt >= b('ba1').s ? 'shock' : lt >= b('pi2').s && lt < b('s5').s ? 'sour' : 'neutral',
        hold: { l: 'card7' }, grip: { l: [-100, -8] }, cardMarks: A7.marks(CUR.start + lt), cardNow: lt, arms: { l: 'hold', r: chasing ? 'flail' : inB(lt, 'g3') ? 'cheer' : 'rest' } }));
      if (chasing) { o.gaitW = lt * 360; o.axis = 'x'; o.dir = 1; o.transit = true; o.vx = 700; }
      if (back) { o.gaitW = pathDist(BRT.mango, lt); o.axis = 'x'; o.dir = -1; o.transit = true; }
      items.push({ id: 'mango', o, z: p[1], draw: sharp => (sharp ? drawChar : drawBg)(o) }); }
    // the peel Mr. Banana shed on his way across the room
    if (lt >= 31.5) { const [px, pz] = PEEL, pq = V2.at(px, pz), land = easeOut(seg(lt, 31.5, 31.75)); items.push({ id: 'peel', o: { x: pq.x, y: pq.y }, z: pz, draw: () => A7.peelFloor(pq.x, pq.y, pq.s, land) }); }
    return items;
  },
  draw(lt) {
    const sh = SCENES.bingo.shot(lt), t = id => B(id);
    if (sh === 'cage') { A7.insCage(lt - t('cage1').s, {}); return; }
    if (sh === 'ball') { const c = CALLS.find(([id]) => lt >= B(id).s - .7 && lt < B(id).e + .1) || CALLS[0]; A7.insBall(lt - (B(c[0]).s - .56), c[1]); return; }
    V2.setLight({ key: [-.3, -.8], keyColor: '#fff0d8', keyA: .22, rim: '#b8a0ff', rimA: .45, shadow: '#2a2048', shadowA: .3, amb: '#ffe8d0', ambA: .05 });
    V2.opts.reflect = true;
    const spec = { cuP: { subj: 'papa' }, cranUp: { subj: 'cran' }, cuC: { subj: 'cran' }, cuPe: { subj: 'pear' }, cuS: { subj: 'straw' }, cuSp: { subj: 'straw' }, cuM: { subj: 'mango' }, cuMp: { subj: 'mango' }, banana: { subj: 'banana' }, leave: { subj: 'pear' }, phone: { subj: 'straw' }, door: { only: [] } }[sh] || {}, subj = spec.subj;
    const called = new Map(CALLS.filter(([id]) => lt >= B(id).s).map(([id, n]) => [n, lt - B(id).s]));
    const taxiK = lt < t('x1').s - .6 ? null : lt < t('x1').s + .2 ? seg(lt, t('x1').s - .6, t('x1').s + .2) : 1;
    const taxiGo = lt > 19.2;
    const back = () => S7.activityBack({ t: lt + 2, called, taxi: taxiGo ? 1 + seg(lt, 19.2, 20.5) * 1.5 : taxiK, min: 30, hr: 5, noBanner: !['wide', 'wideEnd', 'chase'].includes(sh) });   // the banner only shows where it can be read whole; close-ups would crop it mid-word behind the HUD
    layered(SCENES.bingo.cast(lt), subj, subj ? 8 : 0, back, spec.keep || [], spec.only || null);
    V2.dust(60, 600, 1020, 1400, lt, { n: 30, alpha: .3 });
  },
  fx: lt => ({ bloom: .55, vignette: .42, grain: .045, contrast: .15, sat: .16, tint: [['#ffc890', .1, 'soft-light']], fade: seg(lt, 0, .01) * 0 }),
  blur: lt => ['banana', 'chase'].includes(SCENES.bingo.shot(lt)) ? 5 : 1,
  over(lt) {
    const t = id => B(id), sh = SCENES.bingo.shot(lt), ins = sh === 'cage' || sh === 'ball';
    A7.ballWipe(1 - seg(lt, .02, .5), 7);
    // the card, filling in as the squares are called
    const hk = seg(lt, t('d1').s, t('d1').s + .3);
    if (hk > 0 && !ins) A7.cardHud(CUR.start + lt, { appear: hk });
    else if (hk > 0 && ins) A7.cardHud(CUR.start + lt, { appear: hk });
    // alarm and taxi tags, following the thing they name
    const cast = SCENES.bingo.cast(lt);
    if (!ins) {
      const c = cast.find(q => q.id === 'cran').o, [cx, cy] = toScr(c.x, c.y - 330 * c.s);
      if (lt >= t('r7').s - .05 && lt < t('c1').e) A6.tag(clamp(cx, 340, 740), Math.min(cy - 90, 400), 'chair', 'CHAIR ALARM', seg(lt, t('r7').s - .05, t('r7').s + .25) * (1 - seg(lt, t('c1').e - .3, t('c1').e)), {});
      sfxWord(lt, t('x1').s + .05, 'HONK', 950, 700, { fill: '#ffd63c', size: 96, rot: .06 });
      sfxWord(lt, t('ring').s + .05, 'BRRRING', 560, 395, { fill: '#7be0a0', size: 120, hold: .8 });
      sfxWord(lt, t('ba1').s - .1, 'RRRIP', 540, 335, { fill: '#ffe135', size: 112, rot: -.1 });
    }
    // Pineapple on the phone, and the sock
    const pa = seg(lt, t('pi1').s - .15, t('pi1').s + .15) * (1 - seg(lt, t('pi3').e + .1, t('pi3').e + .4));
    if (pa > 0) {
      const sp = inB(lt, 'pi1') || inB(lt, 'pi2') || inB(lt, 'pi3');
      A7.pip(890, 404, 118, { appear: pa, ring: '#7be0a0', label: 'MRS. PINEAPPLE', ping: sp, id: 'pine' }, r => {
        ctx.fillStyle = V2.grad(0, -r, 0, r, [[0, '#2a3a6a'], [1, '#101a3a']]); ctx.fillRect(-r, -r, 2 * r, 2 * r);
        drawChar(pine({ x: 0, y: 36, s: .78, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, look: [0, .1], expr: inB(lt, 'pi3') ? 'sour' : 'neutral', id: 'pine-pip' }));
      });
    }
    const sk = seg(lt, t('pi2').s + 1.4, t('pi2').s + 1.7) * (1 - seg(lt, t('pi3').e + .1, t('pi3').e + .4));
    if (sk > 0 && lt > t('pi2').s + 1.4) {
      ctx.save(); ctx.translate(890, 690); ctx.scale(easeBack(clamp(sk)), easeBack(clamp(sk)));
      reg('overlay', [890 - 114, 690 - 100, 890 + 114, 690 + 90], { id: 'sock-bubble' });
      ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, 108, 78, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, -74); ctx.lineTo(8, -100); ctx.lineTo(26, -70); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.fillRect(-8, -76, 30, 8);
      const lk = easeOut(seg(lt, t('pi3').s, t('pi3').s + .2));
      A7.icon(4, lerp(-34, -60, lk), 0, lerp(46, 40, lk), lt);
      if (lk > 0) { ctx.save(); ctx.globalAlpha *= lk; text('LEFT', 46, 6, { size: 46, font: 'Bangers', weight: 400, fill: '#e8193a', spacing: 3 }); ctx.restore(); }
      ctx.restore();
    }
  },
};


// ============================================================================ room 14, 7:48 PM
const HROUTE = {
  straw: route([[0, -900, 1000], [10.0, -900, 1000], [11.7, -335, 1200, 'out']]),
  mango: route([[0, -900, 1000], [10.4, -900, 1000], [12.1, -100, 1300, 'out']]),
};
const GOJI_AT = [250, 1700];
SCENES.howl = {
  moonY(lt) { return 1 - easeOut(seg(lt, .2, 3.3)); },   // 1: below the sill, 0: risen
  howlOpen(lt) { const k = lt - (B('howl').s + .1); return k < 0 || k > 2.9 ? 0 : lerp(0, 1, 0) + [[0, 0], [.06, .5], [.35, 1], [1.4, 1], [1.58, .45], [1.7, .9], [2.0, .7], [2.6, .3], [2.9, 0]].reduce((v, p, i, a) => i && k >= a[i - 1][0] && k < p[0] ? lerp(a[i - 1][1], p[1], (k - a[i - 1][0]) / (p[0] - a[i - 1][0])) : v, 0); },
  shot(lt) {
    const b = id => B(id);
    const order = [['rise', b('m1').s - .15], ['moon', b('howl').s - .1], ['cuG', b('howl').e - .2], ['wideH', b('g1').s - .02], ['cuM', b('s1').s - .05], ['cuS', b('go1').s - .15], ['cuG', b('go1').e - .55], ['thermo', b('g2').s - .1], ['cuM', b('s3').s - .05],
      ['cuS', wordT('s3', 'water') - .1], ['pitcher', b('s3').e + .1], ['dial', b('s4').s - .02], ['cuS', b('a1').s - .1], ['cuA', b('s5').s - .05], ['cuS', b('a2').s - .05], ['cuA', b('s6').s - .05], ['cuS', b('a3').s - .05], ['cuA', b('s7').s - .15], ['wideW', b('m2').s - .1],
      ['moon', b('d5').s - .1], ['wideEnd', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  cast(lt) {
    const b = id => B(id), out = {};
    const gq = V2.at(...GOJI_AT), howling = lt >= b('howl').s && lt < b('howl').e + .6, awake = lt >= b('howl').s - .05, open = SCENES.howl.howlOpen(lt);
    const gy = gq.y - 150 * gq.s;
    out.goji = goji(Object.assign({ x: gq.x, y: gy, s: gq.s * 1.02, noLegs: true, noShadow: true, noReflect: true, who: 'goji',
      expr: !awake ? 'sleep' : lt < b('go1').s - .2 ? (howling ? 'angry' : 'shock') : inB(lt, 'go1') ? 'angry' : lt >= b('m2').s ? 'sleep' : lt >= b('a3').e ? 'weak' : 'grumpy',
      look: [-.8, -.6], rot: howling ? -.22 + .03 * Math.sin(lt * 9) : lt >= b('go1').s - .2 && lt < b('go1').e ? -.05 : 0, lid: !awake || lt >= b('m2').s ? 1 : undefined,
      arms: howling || inB(lt, 'go1') ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, hand: howling || inB(lt, 'go1') ? { l: 'wave', r: 'wave' } : undefined,
      mouthState: howling ? { open, spread: .05, teeth: 0 } : undefined, talk: howling ? open : undefined }));
    if (howling) out.goji.who = null;
    const sp = HROUTE.straw(lt), mp = HROUTE.mango(lt), walkS = lt > 10.0 && lt < 11.7, walkM = lt > 10.4 && lt < 12.1;
    const calling = lt >= b('call').s + .3 && lt < b('a3').e + .5;
    out.straw = straw(Object.assign(V2.at(...sp), { stride: 38, look: lt < b('go1').s ? [.5, 0] : lt >= b('s7').s - .2 ? [.3, -.6] : [.4, 0], expr: inB(lt, 's1') ? 'sour' : inB(lt, 's2') ? 'dead' : inB(lt, 's3') ? 'sour' : inB(lt, 's4') ? 'sour' : inB(lt, 's5') ? 'dead' : inB(lt, 's6') ? 'sour' : inB(lt, 's7') ? 'chill' : 'dead',
      hold: calling ? { l: 'cell' } : undefined, arms: { l: calling ? 'phone' : 'rest', r: 'rest' }, lid: lt >= b('s2').s && lt < b('s3').s ? .55 : undefined }));
    if (walkS) { out.straw.gaitW = pathDist(HROUTE.straw, lt); out.straw.axis = 'x'; out.straw.dir = 1; out.straw.transit = true; }
    out.mango = mango(Object.assign(V2.at(...mp), { stride: 46, look: [.7, 0], expr: inB(lt, 'g1') ? 'shock' : inB(lt, 'g2') ? 'shock' : lt < b('g1').s ? 'neutral' : 'neutral', arms: { l: 'rest', r: 'rest' } }));
    if (walkM) { out.mango.gaitW = pathDist(HROUTE.mango, lt); out.mango.axis = 'x'; out.mango.dir = 1; out.mango.transit = true; }
    return out;
  },
  cam(lt) {
    const sh = SCENES.howl.shot(lt), c = SCENES.howl.cast(lt), R = S7.ROOM, wq = V2.p2(0, 355, R.zb);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    const fz = (o, z, up = 80) => faceZoom({ kind: o.kind, x: o.x, y: o.y, s: o.s, noLegs: o.noLegs }, z, up);
    if (sh === 'rise') { const k = easeIO(seg(lt, 0, B('m1').s)); zoomTo(lerp(540, wq[0] + 38, k), lerp(1000, wq[1] + 60, k), lerp(1, 1.75, k)); }
    else if (sh === 'moon') { const k = seg(lt, B(inB(lt, 'm1') || lt < B('m1').e ? 'm1' : 'm2').s, B(inB(lt, 'm1') || lt < B('m1').e ? 'm1' : 'm2').e); zoomTo(wq[0] + 38, wq[1] + 40 / 2.1, lerp(2.0, 2.25, k)); }
    else if (sh === 'cuG') { fz(c.goji, 2.9, 90); CAM.shake = lt >= B('howl').s && lt < B('howl').e + .3 ? 5 : 0; }
    else if (sh === 'cuM') fz(c.mango, 2.0, 80);
    else if (sh === 'cuS') fz(c.straw, 2.0, 80);
    else if (sh === 'cuA') zoomTo(540, 960, 1);
    else if (sh === 'wideH') { const k = seg(lt, B('howl').s, B('g1').s); zoomTo(lerp(560, 600, k), 1000, lerp(1.1, 1.3, k)); }
    else if (sh === 'wideW') { const k = seg(lt, B('s7').s - .1, B('m2').s); zoomTo(lerp(380, 470, k), 960, 1.06); }
    else if (sh === 'wideEnd') { const k = seg(lt, B('d5').s, B('d5').e + .5); zoomTo(lerp(500, 470, k), 960, lerp(0.96, 1.0, k)); }
  },
  draw(lt) {
    const sh = SCENES.howl.shot(lt), t = id => B(id), R = S7.ROOM;
    if (sh === 'thermo') { A7.insThermo(lt - (t('go1').e - .55)); return; }
    if (sh === 'pitcher') { A7.insPitcher(lt - (wordT('s3', 'water') - .1)); return; }
    if (sh === 'dial') { A7.insDial(lt - t('call').s); return; }
    if (sh === 'cuA') { SCENES.howl.appleCU(lt); return; }
    const my = SCENES.howl.moonY(lt), c = SCENES.howl.cast(lt), warm = lerp(.9, .15, easeOut(seg(lt, .4, 3.4)));
    const mExpr = lt < t('m1').s - .1 ? 'neutral' : inB(lt, 'm1') ? 'neutral' : lt < t('howl').s + .3 ? 'smug' : lt < t('howl').e + .5 ? 'panic' : inB(lt, 'm2') ? (lt > t('m2').s + 1.2 ? 'happy' : 'sad') : lt >= t('m2').e ? 'happy' : 'neutral';
    const moonPaint = f => {
      const [bx, by] = f[0], ww = f[1][0] - f[0][0], cx = (f[0][0] + f[1][0]) / 2, cy = (f[2][1] + f[0][1]) / 2;
      A7.stars(lt, f[2][1] + (by - f[2][1]) * .95, { n: 110, seed: 5, a: .9 * (1 - my * .5) }); A7.clouds(lt, f[2][1] + 30, by - 60, { n: 3, tint: '130,140, 200', belly: '40,50,110', a: .3, speed: 5, seed: 9, scale: .4 });
      A7.moon(cx + 0, cy + my * ww * .85 + 10, (.34 * ww / 150) * lerp(1.0, .86, 1 - my) * (1 + .05 * Math.sin(lt * 2)), { warm: warm * (my > 0 ? 1 : 1), t: lt, haloA: .8, suppress: !['rise', 'moon', 'wideH'].includes(sh), char: { expr: mExpr, look: [-.5, .5], acc: inB(lt, 'm2') && lt > t('m2').s + .4 ? ['tears'] : [], lid: undefined } });
    };
    V2.setLight({ key: [.2, -.7], keyColor: '#cfd8ff', keyA: .2, rim: '#8fb8ff', rimA: .55, shadow: '#080a22', shadowA: .5, amb: '#9aa6e0', ambA: .1, bounce: '#ffd29a', bounceA: .3 });
    V2.opts.reflect = true;
    const blurPx = ['cuG', 'cuM', 'cuS'].includes(sh) ? 8 : sh === 'moon' ? 0 : 0;
    const back = () => {
      S7.room14Back({ t: lt, paintSky: moonPaint });
      const lit = 1 - my; S7.moonPatch(.5 * lit * (1 + .08 * Math.sin(lt)), -190);
      const ns = S7.nightstand({ lampA: .5 }); S7.bedBack();
      V2.addLight({ x: ns.lamp[0], y: ns.lamp[1], r: 700, color: '255,200,120', a: .55 });
      const wc = V2.p2(0, 355, R.zb); V2.addLight({ x: wc[0], y: wc[1], r: 1000, color: '170,200,255', a: .5 * (1 - my) });
      V2.glow(wc[0], wc[1], 700, '190,210,255', .22 * (1 - my), 'screen', .5);
    };
    const subj = { cuG: 'goji', cuM: 'mango', cuS: 'straw' }[sh], only = sh === 'moon' ? ['goji'] : null;
    const list = [{ id: 'goji', z: GOJI_AT[1], o: c.goji, draw: s => { (s || (!subj && !['rise', 'moon', 'cuA'].includes(sh)) ? drawChar : drawBg)(c.goji); S7.bedFront(); } }, { id: 'straw', z: HROUTE.straw(lt)[1], o: c.straw, draw: s => (s || !subj ? drawChar : drawBg)(c.straw) }, { id: 'mango', z: HROUTE.mango(lt)[1], o: c.mango, draw: s => (s || !subj ? drawChar : drawBg)(c.mango) }];
    layered(list, subj, blurPx, back, [], only);
    V2.dust(60, 700, 1020, 1300, lt, { n: 36, alpha: .35, color: '200,215,255' });
    // sound rings out of Mr. Goji's mouth
    if (lt >= t('howl').s + .1 && lt < t('howl').e + .4) { const g = c.goji, [mx, my2] = localToScreen(g, 0, KINDS.goji.mouthY); for (let i = 0; i < 4; i++) A6.ring(mx, my2, (((lt - t('howl').s) * 1.0 - i * .24) % 1 + 1) % 1, 'howl', { r0: 30, r1: 520, lw: 10, alpha: .75 }); }
  },
  appleCU(lt) {   // Dr. Apple at home, in a nightcap, being woken up
    const t = id => B(id);
    A6.bokeh(lt, ['255,200,120', '120,180,255'], ['#141838', '#262b58']);
    V2.setLight({ key: [-.5, -.5], keyColor: '#ffd9a0', keyA: .3, rim: '#8fb8ff', rimA: .45, shadow: '#0c0a24', shadowA: .45, amb: '#ffe0b0', ambA: .06 });
    // the bedroom: a wood headboard, a pillow behind his head, a lamp's warm pool on the left, the clock on the nightstand on the right
    ctx.fillStyle = V2.grad(0, 520, 0, 700, [[0, 'rgba(38,40,88,0)'], [1, '#262858']]); ctx.fillRect(0, 520, W, 180); ctx.fillStyle = V2.grad(0, 700, 0, 1500, [[0, '#262858'], [1, '#14163a']]); ctx.fillRect(0, 700, W, 800);
    ctx.fillStyle = '#7a5434'; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 5; rr(90, 700, 700, 760, 40); ctx.fill(); ctx.stroke();
    ctx.fillStyle = V2.grad(0, 840, 0, 1300, [[0, '#f4f4fc'], [1, '#cfd0e4']]); rr(170, 860, 540, 330, 120); ctx.fill(); ctx.stroke();
    V2.glow(120, 760, 560, '255,190,110', .45, 'screen', .4);
    ctx.fillStyle = '#4a3320'; rr(830, 1100, 200, 380, 20); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(930, 1040); ctx.fillStyle = '#e8e2d4'; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 5; rr(-84, -66, 168, 132, 24); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#10161a'; rr(-66, -46, 132, 80, 12); ctx.fill();
    text(lt >= t('a3').s + 1.0 ? '3:00' : '8:01', 0, -6, { size: 62, font: 'Bangers', weight: 400, fill: '#ff5a4a', spacing: 2 }); ctx.restore();
    V2.glow(930, 1040, 160, '255,80,60', .3, 'screen', .3);
    drawChar(apple({ x: 450, y: 1270, s: 1.7, noLegs: true, noShadow: true, noReflect: true, hold: { r: 'cell' }, arms: { l: 'rest', r: 'phone' }, expr: inB(lt, 'a1') ? 'dead' : inB(lt, 'a2') ? 'sour' : inB(lt, 'a3') ? 'dead' : 'dead', look: [0, .1], lid: lt > t('a3').s + 2.0 ? 1 : .85, who: 'apple' }));
    // the quilt over his lap
    ctx.save(); ctx.fillStyle = V2.grad(0, 1270, 0, 1430, [[0, '#5a78c8'], [1, '#34488a']]); ctx.strokeStyle = '#15111a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-20, 1302); ctx.quadraticCurveTo(300, 1254, 540, 1288); ctx.quadraticCurveTo(800, 1258, 1100, 1302); ctx.lineTo(1100, 1500); ctx.lineTo(-20, 1500); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 6; for (let i = -2; i < 12; i++) { ctx.beginPath(); ctx.moveTo(i * 120, 1230); ctx.lineTo(i * 120 - 90, 1500); ctx.stroke(); } ctx.restore();
  },
  fx: lt => ({ bloom: .65, vignette: .55, grain: .06, contrast: .2, sat: .1, tint: [['#3a54c8', .2, 'soft-light'], ['#0a1030', .12, 'multiply']] }),
  blur: lt => 1,
  over(lt) {
    const t = id => B(id);
    A7.cardHud(CUR.start + lt, { appear: seg(lt, 0, .3) });
    if (lt >= t('howl').s + .1 && lt < t('howl').e + .4) { sfxWord(lt, t('howl').s + .15, 'AWOOOO!', 650, 385, { fill: '#cfe0ff', size: 150, hold: 1.8, rot: -.06 }); }
    const pa = seg(lt, t('a1').s - .15, t('a1').s + .1) * (1 - seg(lt, t('a3').e, t('a3').e + .3)), sh = SCENES.howl.shot(lt);
    if (pa > 0 && sh !== 'cuA' && sh !== 'dial') A7.pip(905, 398, 112, { appear: pa, ring: '#7be0a0', label: 'DR. APPLE', ping: true, id: 'apple' }, r => {
      ctx.fillStyle = V2.grad(0, -r, 0, r, [[0, '#2a2a5a'], [1, '#10103a']]); ctx.fillRect(-r, -r, 2 * r, 2 * r);
      drawChar(apple({ x: 0, y: 46, s: .82, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, look: [0, .1], expr: 'dead', lid: .8, id: 'apple-pip', who: 'apple' }));
    });
  },
};


// ============================================================================ the night station, 10:31 PM
const QS = { straw: [-150, 1000], mango: [172, 1000] };
// the hallway at night with the building going off: every dome, in the alarm colors
function hallNight(lt, dens, o = {}) {
  V2.setLight({ key: [-.3, -.85], keyColor: '#cfd8ff', keyA: .16, rim: '#7f9cff', rimA: .5, shadow: '#0a0a1e', shadowA: .42, amb: '#aab4e8', ambA: .12 });
  V2.opts.reflect = true;
  const doors = hallDoors(lt, dens, {}).map(d => Object.assign(d, { open: 0 }));
  V2.dof(o.blur || 0, () => {
    S6.corridor({ doors, fog: '#4a5278', fogAmt: .5, wall: '#cfc6b4', wain: '#46707a', lampOn: o.lampOn ?? .55, bright: .72, signs: [] });
    S6.stationDesk({ lamps: doors.slice(0, 12).map(d => d.dome ? d.dome[1] : 0), colors: doors.slice(0, 12).map(d => d.dome ? d.dome[0] : '255,170,60') });
  });
  for (const d of doors) if (d.dome) { const [x, y] = V2.proj(d.side * 330, 480, d.z); V2.addLight({ x, y, r: 800, color: d.dome[0], a: .7 * d.dome[1] }); }
  doors.forEach((d, i) => { if (!d.dome || i % 2) return; const [x, y, k] = V2.proj(d.side * 330, 480, d.z); A6.ring(x, y, ((lt * 1.8 + hash(i)) % 1), KINDS6[i % 6], { r0: 14 * k, r1: 340 * k + 40, lw: 7, alpha: .65 }); });
  return doors;
}
const qLamps = (lt, n = 28) => Array.from({ length: n }, (_, i) => [A6.ALARM[KINDS6[(i + Math.floor(lt * 7)) % 6]].rgb, .6 + .4 * Math.sin(lt * 14 + i)]);
SCENES.quiet = {
  shot(lt) {
    const b = id => B(id), c0 = b('chaos').s;
    const order = [['calm', b('s1').s - .05], ['cuS', b('freeze').s], ['dolly', b('freeze').e], ['cuM', b('s2').s - .05], ['cuS', b('m1').s - .05], ['moon', b('chaos').s],
      ['hall', c0 + 1.3], ['card', c0 + 1.8], ['wheel', c0 + 2.9], ['panel', c0 + 3.9], ['card', c0 + 4.4], ['banana', c0 + 5.5], ['desk', c0 + 6.4], ['card', b('chaos').e],
      ['cuM', b('s3').s - .05], ['card', b('s4').s - .05], ['cuS', b('g4').s - .05], ['cuM', b('clock').s - .02], ['clock', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  frozen: lt => lt >= B('freeze').s && lt < B('g1').s ? B('freeze').s : undefined,
  cast(lt) {
    const b = id => B(id), fr = SCENES.quiet.frozen(lt), after = lt >= b('chaos').e;
    const sq = V2.at(...QS.straw), mq = V2.at(...QS.mango), sip = seg(lt, 1.6, 2.1) * (1 - seg(lt, 2.4, 2.7));
    const eyesCam = lt >= b('freeze').s && lt < b('g1').s;
    const straw0 = straw(Object.assign(sq, { t: fr, noBob: fr != null, look: eyesCam ? [0, 0] : [.55, .1], expr: lt < b('s1').s ? 'chill' : inB(lt, 's1') ? 'chill' : eyesCam ? 'shock' : inB(lt, 's2') ? 'dead' : after ? (inB(lt, 's3') ? 'dead' : inB(lt, 's4') ? 'dead' : 'dead') : 'dead',
      hold: { l: 'clipboard6', r: 'mug7' }, grip: { l: [-100, 30], r: [78, 48] }, clipText: 'CHARTS', arms: { l: 'hold', r: sip > 0 ? [1.95, 1.7] : 'hold' }, lid: lt < b('s1').s ? .5 : undefined }));
    const mango0 = mango(Object.assign(mq, { t: fr, noBob: fr != null, look: eyesCam ? [0, 0] : [-.5, .1], expr: lt < b('s1').s ? 'happy' : eyesCam ? 'shock' : inB(lt, 'g1') ? 'sour' : inB(lt, 'g2') ? 'hopeful' : inB(lt, 'g3') ? 'happy' : inB(lt, 'g4') || lt >= b('s4').s ? 'sad' : 'neutral',
      hold: { l: 'card7' }, grip: { l: [-92, 4] }, cardMarks: A7.marks(CUR.start + lt), cardNow: lt, arms: { l: 'hold', r: inB(lt, 'g2') ? 'cheer' : 'rest' } }));
    return { straw: straw0, mango: mango0 };
  },
  cam(lt) {
    const sh = SCENES.quiet.shot(lt), b = id => B(id), c = SCENES.quiet.cast(lt), c0 = b('chaos').s;
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    const wq = V2.p2(390, 465, 1900);
    if (sh === 'calm') { const k = seg(lt, 0, b('s1').s); zoomTo(lerp(540, 530, k), lerp(980, 1000, k), lerp(1, 1.08, k)); }
    else if (sh === 'cuS') faceZoom({ kind: 'straw', x: c.straw.x, y: c.straw.y, s: c.straw.s }, 1.8, 80);
    else if (sh === 'cuM') faceZoom({ kind: 'mango', x: c.mango.x, y: c.mango.y, s: c.mango.s }, 2.0, 80);
    else if (sh === 'dolly') { const k = easeIO(seg(lt, b('freeze').s, b('freeze').e)), cz = -1300 * k, Zs = 1000; V2.setCam({ f: 1400 * (Zs - cz) / Zs, cz, cy: 360, hy: 860 }); zoomTo(540, 1000, 1.0); }
    else if (sh === 'moon') { const k = seg(lt, b('m1').s, b('m1').e); zoomTo(wq[0], wq[1] + 20, lerp(2.65, 2.85, k)); }
    else if (sh === 'panel') { const k = seg(lt, c0 + 2.9, c0 + 3.9); zoomTo(lerp(150, 120, k), 735, lerp(2.5, 2.9, k)); CAM.shake = 7; }
    else if (sh === 'desk') { const k = seg(lt, c0 + 5.5, c0 + 6.4); zoomTo(540, 990, lerp(1.0, 1.15, k)); CAM.shake = 8; }
    else if (sh === 'hall') CAM.shake = 7;
    else if (sh === 'wheel') CAM.shake = 9;
    else if (sh === 'banana') CAM.shake = 8;
  },
  draw(lt) {
    const sh = SCENES.quiet.shot(lt), b = id => B(id), c0 = b('chaos').s, k = lt - c0, abs = CUR.start + lt;
    if (sh === 'card') { A7.insCard(abs, lt, { appear: 1, hi: lt >= b('chaos').e - 1.2 ? [12] : [], tilt: -.03 + .02 * Math.sin(lt * 3), zoom: lt >= b('chaos').e ? lerp(1, 1.1, seg(lt, b('s3').s, b('g3').e)) : 1 }); return; }
    if (sh === 'clock') { A7.insClock(lt - b('clock').s); return; }
    const c = SCENES.quiet.cast(lt);
    if (sh === 'hall' || sh === 'wheel' || sh === 'banana') { SCENES.quiet.chaosHall(lt, sh, k); return; }
    // the station, at night: lit by the lamp on the counter and the Moon in the window
    const lampsOn = lt >= b('freeze').s + .3 && lt < b('g1').s + .2 ? .12 + .1 * hash(Math.floor(lt * 18)) : (lt >= b('g1').s && lt < c0 ? (hash(Math.floor(lt * 14) + 2) > .3 ? 1 : .15) : lt >= c0 && lt < b('chaos').e ? (hash(Math.floor(lt * 16)) > .4 ? 1 : .12) : lt >= b('chaos').e + 1.0 ? (hash(Math.floor(lt * 5) + 1) > .15 ? 1 : .2) : 1);
    const hrs = lt < b('freeze').s + .12 ? 7 : 0, flash = lt >= b('freeze').s && lt < b('freeze').e ? (Math.sin(lt * 30) > 0 ? 1 : .3) : lt >= c0 && lt < b('chaos').e ? .5 : 0;
    const mExpr = lt < b('freeze').s ? 'chill' : lt < b('m1').s ? 'shock' : inB(lt, 'm1') ? 'panic' : lt < b('chaos').e ? 'shock' : 'dead';
    V2.setLight({ key: [-.35, -.8], keyColor: '#ffd9a0', keyA: .26, rim: '#8fb8ff', rimA: .5, shadow: '#0a0a24', shadowA: .45, amb: '#9aa6e0', ambA: .1, bounce: '#ffcf99', bounceA: .22 });
    V2.opts.reflect = true;
    const blurPx = sh === 'cuS' || sh === 'cuM' ? 9 : sh === 'panel' ? 5 : 0;
    const lamps = lt >= c0 && lt < b('chaos').e ? qLamps(lt) : [];
    V2.dof(blurPx, () => S7.stationBack({ noLabel: sh !== 'calm', night: true, t: lt + 7, hours: hrs, qFlash: flash, qFlicker: lt >= b('freeze').s && lt < b('freeze').e ? (hash(Math.floor(lt * 20)) > .35 ? 1 : .2) : 1, board: boardDone, lampsOn, min: lt >= b('clock').s ? 59 + seg(lt, b('clock').s + .3, b('clock').e - .1) : 31, hr: 10, lamps,
      moon: { s: .62, expr: mExpr, look: [-.2, .5], o: { suppress: !['calm', 'dolly', 'moon'].includes(sh) }, char: { acc: inB(lt, 'm1') ? ['sweat'] : [] } } }));
    S7.stationCounter({ night: true });
    if (sh === 'moon') { const wq = V2.p2(390, 465, 1900); V2.glow(wq[0], wq[1], 520, '190,210,255', .18, 'screen', .4); }
    if (sh !== 'moon' && sh !== 'panel' && sh !== 'clock') {
      const sp = c.straw, mp = c.mango, subj = sh === 'cuS' ? 'straw' : sh === 'cuM' ? 'mango' : null;
      if (sh === 'desk') { SCENES.quiet.deskShot(lt); } else { (subj && subj !== 'straw' ? nbr : drawChar)(sp); (subj && subj !== 'mango' ? nbr : drawChar)(mp); }
    }
    V2.addLight({ x: 400, y: 1000, r: 800, color: '255,200,120', a: .35 });
    if (lt >= c0 && lt < b('chaos').e) for (let i = 0; i < 3; i++) A6.ring(116, 735, (((lt - c0) * 1.5 - i * .33) % 1 + 1) % 1, KINDS6[i * 2 % 6], { r0: 20, r1: 340, lw: 8, alpha: .7 });
    V2.dust(60, 600, 1020, 1400, lt, { n: 26, alpha: .3, color: '200,215,255' });
  },
  chaosHall(lt, sh, k) {
    const c0 = B('chaos').s, dens = clamp(.35 + k * .12, 0, 1);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    hallNight(lt, dens, { blur: 0, lampOn: hash(Math.floor(lt * 14)) > .35 ? .7 : .12 });
    const t0 = sh === 'hall' ? c0 : sh === 'wheel' ? c0 + 1.8 : c0 + 4.4, u = lt - t0;
    if (sh === 'hall') {
      const sP = lt2 => [-70, lerp(760, 2600, easeIn(seg(lt2, c0, c0 + 1.3)))], mP = lt2 => [80, lerp(3400, 780, easeIn(seg(lt2, c0 + .1, c0 + 1.3)))];
      drawChar(runner(mango, mP, lt, { arms: { l: 'run', r: 'run' }, expr: 'panic', look: [0, .3], hold: { l: 'card7' }, grip: { l: [-100, -20] }, cardMarks: A7.marks(CUR.start + lt), transit: true }, 360));
      drawChar(runner(straw, sP, lt, { arms: { l: 'run', r: 'run' }, expr: 'angry', look: [0, .2], transit: true }, 360));
    } else if (sh === 'wheel') {
      const P = lt2 => [lerp(-50, 40, seg(lt2, t0, t0 + 1.1)) + 30 * Math.sin(lt2 * 11), lerp(3600, 900, easeIn(seg(lt2, t0, t0 + 1.1)))], p = P(lt), q = V2.at(...p), roll = (lt * 40) % TAU;
      const sP = lt2 => [-235, lerp(4600, 1500, easeIn(seg(lt2, t0 + .1, t0 + 1.1)))];
      drawChar(runner(straw, sP, lt, { arms: { l: 'run', r: 'run' }, expr: 'panic', look: [0, .3], transit: true }, 360));
      S7.wheelchairBack(q.x, q.y, q.s);
      drawChar(cran({ x: q.x, y: q.y - 118 * q.s, s: q.s, noLegs: true, noShadow: true, noReflect: true, expr: 'happy', look: [0, .2], arms: { l: 'cheer', r: 'cheer' }, transit: true, vx: 800 }));
      S7.wheelchairFront(q.x, q.y, q.s, { roll });
    } else if (sh === 'banana') {
      const bP = lt2 => [lerp(-380, 420, seg(lt2, t0, t0 + 1.0)), 1250 + 40 * Math.sin(lt2 * 6)], mP = lt2 => [lerp(-640, 260, seg(lt2, t0 + .25, t0 + 1.25)), 1230];
      drawChar(runner(mango, mP, lt, { arms: { l: 'flail', r: 'flail' }, expr: 'angry', look: [.8, 0], hold: { l: 'card7' }, grip: { l: [-100, -20] }, cardMarks: A7.marks(CUR.start + lt), transit: true }, 340));
      drawChar(runner(banana, bP, lt, { acc: ['peeled'], peelOpen: 1, arms: { l: 'run', r: 'run' }, expr: 'happy', look: [.7, 0], transit: true, vx: 900 }, 380));
    }
  },
  deskShot(lt) {   // Straw at the desk with every phone ringing
    const sq = V2.at(0, 1080);
    drawChar(straw(Object.assign(sq, { look: [0, .3], expr: 'panic', hold: { l: 'handset', r: 'cell' }, arms: { l: 'phone', r: 'phone' }, rot: .03 * Math.sin(lt * 31), transit: true })));
    const [cx, cy] = V2.p2(-200, 330, 1650); for (let i = 0; i < 3; i++) A6.ring(cx, cy, (((lt * 1.6) - i * .33) % 1 + 1) % 1, 'phone', { r0: 20, r1: 260, lw: 7, alpha: .7 });
  },
  fx: lt => {
    const b = id => B(id), sh = SCENES.quiet.shot(lt), c0 = b('chaos').s;
    const dark = lt >= b('freeze').s + .3 && lt < b('g1').s ? .38 : 0, chaos = lt >= c0 && lt < b('chaos').e;
    return { bloom: .7, vignette: .55, grain: .06, contrast: .2, sat: chaos ? .22 : .1, aberr: sh === 'dolly' ? 3 : chaos ? 2.5 : 0, tint: [['#3a54c8', .2, 'soft-light'], ['#0a1030', .12, 'multiply']], fade: dark * (hash(Math.floor(lt * 20)) > .3 ? 1 : .3) + (lt >= b('chaos').e - .1 && lt < b('chaos').e + .02 ? .5 : 0), fadeColor: '0,0,12' };
  },
  blur: lt => { const sh = SCENES.quiet.shot(lt); return sh === 'wheel' || sh === 'banana' || sh === 'hall' ? 6 : 1; },
  clock: lt => lt >= B('clock').s + .75 ? '11:00 PM' : CUR.clock,   // the time pill follows the clock insert when it jumps to eleven
  over(lt) {
    const b = id => B(id), c0 = b('chaos').s, sh = SCENES.quiet.shot(lt);
    A7.cardHud(CUR.start + lt, { appear: 1 });
    // each square, named as it falls
    if (lt >= c0 && lt < b('chaos').e && sh !== 'card') {
      for (const d of A7.dabs()) { const a = CUR.start + lt - d.t; if (a < 0 || a > .4 || d.i < 7) continue; const k = seg(a, 0, .12), f = 1 - seg(a, .22, .4); ctx.save(); ctx.globalAlpha *= f; ctx.translate(540, (sh === 'hall' ? 380 : sh === 'desk' ? 315 : 1320) + (d.i % 3) * 14); ctx.scale(lerp(1.15, 1, easeOut(k)), lerp(1.15, 1, easeOut(k))); ctx.rotate(((d.i * 7) % 5 - 2) * .03);
        text(A7.CARD[d.i] + '!', 0, 0, { size: 96, font: 'Bangers', weight: 400, fill: '#ff7ac8', lw: 14, stroke: '#150f22', spacing: 3, shadow: 12 }); ctx.restore(); }
    }
    if (lt >= b('freeze').s && lt < b('freeze').e + .5) { const a = seg(lt, b('freeze').s, b('freeze').s + .2) * (1 - seg(lt, b('freeze').e + .1, b('freeze').e + .5)); if (a > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(540, 1500); ctx.scale(lerp(1.15, 1, easeOut(seg(lt, b('freeze').s, b('freeze').s + .2))), lerp(1.15, 1, easeOut(seg(lt, b('freeze').s, b('freeze').s + .2)))); text('Q WORD', 0, 0, { size: 132, font: 'Bangers', weight: 400, fill: '#ff3c5a', lw: 16, stroke: '#150f22', spacing: 4, shadow: 16 }); ctx.restore(); } }
  },
};

// ============================================================================ shift change, 11:00 PM
SCENES.report = {
  shot(lt) {
    const b = id => B(id);
    const order = [['wide', b('d1').s - .1], ['cuD', b('s1').s - .05], ['cuS', b('stamp').s], ['report', b('stamp').e], ['cuD', b('flick2').s], ['two', b('s2').s - .05], ['cuS', b('m2').s - .1], ['moon', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  dpath: route([[0, 760, 1000], [.25, 760, 1000], [1.7, 90, 1000, 'out']]),
  cast(lt) {
    const b = id => B(id), dp = SCENES.report.dpath(lt), walking = lt > .25 && lt < 1.75;
    const d = drag(Object.assign(V2.at(...dp), { stride: 40, look: [-.7, 0], expr: inB(lt, 'd1') ? 'happy' : inB(lt, 'd2') ? 'happy' : lt >= b('flick2').s && lt < b('s2').s ? (lt > b('flick2').s + .5 ? 'shock' : 'happy') : lt >= b('s2').s ? 'panic' : 'chill',
      hold: { l: 'lunchbox' }, grip: { l: [-82, 92] }, arms: { l: 'hold', r: inB(lt, 'd1') || inB(lt, 'd2') ? 'wave' : 'rest' }, acc: ['sleepmask', 'badge7'], badgeText: 'NIGHTS' }));
    if (walking) { d.gaitW = pathDist(SCENES.report.dpath, lt); d.axis = 'x'; d.dir = -1; d.transit = lt < 1.7; }
    const s0 = straw(Object.assign(V2.at(-170, 1000), { look: [.6, .1], expr: inB(lt, 's1') ? 'dead' : inB(lt, 's2') ? 'smug' : lt >= b('flick2').s ? 'smug' : 'chill', hold: { l: 'clipboard6' }, grip: { l: [-110, 30] }, clipText: lt >= b('stamp').e ? 'QUIET' : 'CHARTS', arms: { l: 'hold', r: inB(lt, 's2') ? 'thumb' : 'rest' }, lid: lt < b('s1').s ? .45 : undefined }));
    return { drag: d, straw: s0 };
  },
  cam(lt) {
    const sh = SCENES.report.shot(lt), c = SCENES.report.cast(lt), b = id => B(id);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    const wq = V2.p2(390, 465, 1900);
    if (sh === 'wide') { const k = seg(lt, 0, b('d1').s); zoomTo(505, lerp(990, 975, k), lerp(1, 1.06, k)); }
    else if (sh === 'cuD') { const k = seg(lt, b('flick2').s, b('flick2').e); const kk = lt >= b('flick2').s ? lerp(1.5, 2.5, easeIO(k)) : 1.5; faceZoom({ kind: 'dragon', x: c.drag.x, y: c.drag.y, s: c.drag.s }, kk, 80); }
    else if (sh === 'cuS') faceZoom({ kind: 'straw', x: c.straw.x, y: c.straw.y, s: c.straw.s }, 1.7, 80);
    else if (sh === 'two') zoomTo(446, 1010, 1.12);
    else if (sh === 'moon') { const k = seg(lt, b('m2').s, b('m2').e); zoomTo(wq[0], wq[1] + 20, lerp(2.65, 2.95, k)); }
  },
  draw(lt) {
    const sh = SCENES.report.shot(lt), b = id => B(id);
    if (sh === 'report') { A7.insReport(lt - b('stamp').s); return; }
    const c = SCENES.report.cast(lt), fl = lt >= b('flick2').s ? (hash(Math.floor(lt * 15) + 7) > .38 ? 1 : .1) : 1, lampsOn = lt >= b('flick2').s ? fl : 1;
    V2.setLight({ key: [-.35, -.8], keyColor: '#ffd9a0', keyA: .26, rim: '#8fb8ff', rimA: .5, shadow: '#0a0a24', shadowA: .45, amb: '#9aa6e0', ambA: .1, bounce: '#ffcf99', bounceA: .22 });
    V2.opts.reflect = true;
    const subj = sh === 'cuD' ? 'drag' : sh === 'cuS' ? 'straw' : null, blurPx = subj ? 9 : 0;
    const mExpr = lt < b('m2').s ? (lt >= b('flick2').s ? 'panic' : 'chill') : 'sad';
    V2.dof(blurPx, () => S7.stationBack({ noLabel: sh !== 'wide', night: true, t: lt + 11, hours: 0, qFlash: lt >= b('flick2').s ? .5 : 0, qFlicker: fl, board: boardDone, lampsOn, min: 0, hr: 11, lamps: lt >= b('flick2').s ? qLamps(lt, 6) : [],
      moon: { s: .62, expr: mExpr, look: [-.1, .4], o: { suppress: !['wide', 'moon'].includes(sh) }, char: { acc: sh === 'moon' && lt > b('m2').s + .5 ? ['sweat'] : [] } } }));
    S7.stationCounter({ night: true });
    if (sh !== 'moon') { (subj && subj !== 'straw' ? nbr : drawChar)(c.straw); (subj && subj !== 'drag' ? nbr : drawChar)(c.drag); }
    else { const wq = V2.p2(390, 465, 1900); V2.glow(wq[0], wq[1], 520, '190,210,255', .18, 'screen', .4); }
    V2.addLight({ x: 400, y: 1000, r: 800, color: '255,200,120', a: .35 * lampsOn });
    V2.dust(60, 600, 1020, 1400, lt, { n: 26, alpha: .3, color: '200,215,255' });
  },
  fx: lt => { const b = id => B(id), fl = lt >= b('flick2').s ? (hash(Math.floor(lt * 15) + 7) > .38 ? 1 : .1) : 1; return { bloom: .7, vignette: .55, grain: .06, contrast: .2, sat: .1, tint: [['#3a54c8', .2, 'soft-light'], ['#0a1030', .12, 'multiply']], fade: ((1 - fl) * .5) * (1 - seg(lt, B('m2').e + .1, B('m2').e + .5)) + seg(lt, B('m2').e + .1, B('m2').e + .5), fadeColor: '0,0,10' }; },
  blur: lt => 1,
  clock: lt => lt < B('m2').e + .35 ? CUR.clock : '',
  over(lt) { ctx.save(); ctx.globalAlpha *= 1 - seg(lt, B('m2').e + .1, B('m2').e + .45); A7.cardHud(CUR.start + lt, { appear: 1 }); ctx.restore(); },
};

// ============================================================================ end card
SCENES.end = {
  noChyron: true,
  cam() {},
  draw(lt) {
    ctx.fillStyle = grad2(0, 0, 0, H, '#0a0c26', '#1d1252'); ctx.fillRect(-100, -100, W + 200, H + 200);
    A7.stars(lt, 1200, { n: 100, a: 1 });
    const mp = 1 + .02 * Math.sin(lt * 1.4);
    A7.rays(540, 990, 262, 1400, lt, { n: 14, color: '220,232,255', a: .08, spin: .03 });
    A7.moon(540, 990, 1.28 * mp, { t: lt, char: { expr: lt < 4.5 ? 'happy' : 'smug', look: [0, .15], who: null } });
    confetti(lt, .7);
    const fy = 1540; ctx.fillStyle = V2.grad(0, fy - 20, 0, H, [[0, 'rgba(26,18,70,.0)'], [.08, 'rgba(34,24,88,.9)'], [1, 'rgba(8,6,24,1)']]); ctx.fillRect(0, fy - 20, W, H - fy + 20);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, fy + 6, 10, 560, [[0, 'rgba(170,160,255,.34)'], [1, 'rgba(170,160,255,0)']]); ctx.beginPath(); ctx.ellipse(540, fy + 6, 560, 70, 0, 0, TAU); ctx.fill(); ctx.restore();
    V2.setLight({ key: [-.4, -.8], keyColor: '#e8ecff', keyA: .26, rim: '#9fc4ff', rimA: .6, shadow: '#0a0a24', shadowA: .45, amb: '#8a90ff', ambA: .1 });
    V2.opts.reflect = true;
    const row = [['straw', { x: 180, s: .82, acc: ['steth', 'badge', 'bandage'], expr: 'happy', lashes: true }], ['mango', { x: 360, s: .82, acc: ['badge7', 'gaitbelt7', 'keys7'], badgeText: 'CNA', expr: 'happy' }], ['papaya', { x: 540, s: .86, acc: ['visor', 'lanyard'], expr: 'happy' }],
      ['goji', { x: 720, s: .82, acc: ['wolfears', 'gown'], expr: 'happy', browColor: '#f2f2f2', browW: 11 }], ['dragon', { x: 900, s: .8, acc: ['sleepmask', 'badge7'], badgeText: 'NIGHTS', expr: 'chill' }]];
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
    text('THE ACTUAL FULL MOON', 0, 450, { size: 112, font: 'Bangers', weight: 400, fill: '#d8e6ff', lw: 18, stroke: '#150f22', spacing: 4, shadow: 24 });
    ctx.restore(); }
    const lines = [['For every nurse who has ever blamed the moon.', 42, '#ffffff', .8], ['It was a UTI. It is almost always a UTI.', 42, '#ffe135', 1.9], ['Never say the Q word.', 44, '#ffd1e6', 3.0]];
    lines.forEach(([s2, size, c, at], i) => text(s2, 540, 584 + i * 76, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 9, maxW: 1000 }));
    const tk = easeBack(seg(lt, 4.2, 4.6));
    if (tk > 0) {
      ctx.save(); ctx.translate(540, 1710); ctx.scale(tk, tk);
      reg('overlay', [540 - 440 * tk, 1710 - 80 * tk, 540 + 440 * tk, 1710 + 80 * tk], { id: 'teaser' });
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(14,10,36,.92)'; rr(-440, -80, 880, 160, 80); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,214,150,.9)'; ctx.lineWidth = 4; rr(-440, -80, 880, 160, 80); ctx.stroke();
      ctx.font = '900 30px Nunito'; ctx.letterSpacing = '6px'; const w1 = ctx.measureText('NEXT TIME').width; ctx.letterSpacing = '0px';
      ctx.font = '400 56px Bangers'; ctx.letterSpacing = '2px'; const w2 = ctx.measureText('The Double Shift').width; ctx.letterSpacing = '0px';
      const cx0 = -(108 + 40 + Math.max(w1, w2)) / 2 + 54, tx0 = cx0 + 54 + 40;   // clock centre and the left edge of the words, centred as one group
      // a wall clock showing a quarter past eleven, with a second hand sweeping
      ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; ell(cx0, 0, 54, 54); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.lineWidth = i % 3 ? 2 : 4; ctx.beginPath(); ctx.moveTo(cx0 + Math.sin(a) * 42, -Math.cos(a) * 42); ctx.lineTo(cx0 + Math.sin(a) * 49, -Math.cos(a) * 49); ctx.stroke(); }
      ctx.lineCap = 'round'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx0, 0); ctx.lineTo(cx0 + Math.sin(.5 * TAU / 4 * 3 / 3 + 3.14) * 0, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx0, 0); ctx.lineTo(cx0 + Math.sin(TAU * 11.25 / 12) * 26, -Math.cos(TAU * 11.25 / 12) * 26); ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx0, 0); ctx.lineTo(cx0 + Math.sin(TAU * .25) * 36, -Math.cos(TAU * .25) * 36); ctx.stroke();
      const sa = (lt * 6) % 60 / 60 * TAU; ctx.strokeStyle = '#e8193a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx0, 0); ctx.lineTo(cx0 + Math.sin(sa) * 44, -Math.cos(sa) * 44); ctx.stroke();
      text('NEXT TIME', tx0, -34, { size: 30, fill: '#ffd1e6', weight: 900, align: 'left', spacing: 6 });
      text('The Double Shift', tx0, 22, { size: 56, font: 'Bangers', weight: 400, fill: '#ffffff', align: 'left', lw: 10, stroke: '#150f22', spacing: 2 });
      ctx.restore();
    }
  },
  label: () => 'THANKS FOR WATCHING',
};


window.__EP7_SCENES = SCENES;
EPISODES[7] = { num: 7, v2: true, balanceCaps: true, title: 'Episode 7: The Actual Full Moon', TL: window.TIMELINE_EP7, SCENES, layout: 'v2', audio: 'build/ep7/audio.m4a' };
})();
