'use strict';
/* Episode 8 scene module: dawn, 6:40 AM, Room 14. The reverse of the howl: the Moon SETS.
 * Strawberry at the bedside after sixteen hours, Mr. Goji asleep, the Moon in the big window. The sky runs from night blue to sunrise gold
 * across the scene, the light in the room follows it, and god-rays reach the floor and the bed at the end. Registers window.__EP8_SCENES.dawn. */
(() => {
if (!window.TIMELINE_EP8) return;
const { zoomTo, faceC, drawBg, inB } = window.H6;
const A7 = window.A7, S7 = window.S7;
const { straw, goji } = A7;
window.__EP8_SCENES = window.__EP8_SCENES || {};

// ---- helpers (copies of the Episode 7 ones)
// a neighbor of the subject in a close-up: out of focus, behind the shot, never audited
const nbr = o => V2.dof(6, () => drawBg(o));
// draw a cast in depth order with the subject sharp and everything farther softened; no subject: everyone sharp
function layered(items, subj, blurPx, back, keep = [], only = null) {
  const list = items.filter(c => !only || only.includes(c.id)).sort((a, b) => b.z - a.z), si = list.findIndex(c => c.id === subj);
  if (si < 0 || blurPx <= 0) { back(); for (const c of list) c.draw(si < 0 || c.id === subj); return; }
  V2.dof(blurPx, () => { back(); for (const c of list.slice(0, si)) c.draw(false); });
  list[si].draw(true);
  const near = list.slice(si + 1).filter(c => keep.includes(c.id));
  if (near.length) V2.dof(blurPx, () => { for (const c of near) c.draw(false); });
}
const hexc = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mixc = (a, b, k) => hexc(V2.mix(a, b, clamp(k)));
const mixr = (a, b, k) => V2.mix(a, b, clamp(k)).map(v => Math.round(v)).join(',');

const R = S7.ROOM, STRAW_AT = [-215, 1230], GOJI_AT = [250, 1700];
const hasB = id => !!CUR.beats[id];

// ---- time: how far the night has turned to day (0 night .. 1 full gold), and where the Moon is on its way down
const dayK = lt => lerp(0, .2, easeIO(seg(lt, 0, B('set').s))) + .8 * easeIO(seg(lt, B('set').s - .2, B('set').e + 1.9));
// 0: riding high, 1: low with its face just above the roofs ("nearly gone"), 2: below the sill, not drawn at all
const moonF = lt => {
  const s0 = B('set').s, s1 = B('set').e, s6 = B('s6');
  if (lt < s0) return .16 * easeIO(seg(lt, 0, s0));
  if (lt < s1) return lerp(.16, .93, easeIO(seg(lt, s0, s1)));
  if (lt < s6.s - .1) return lerp(.93, 1.0, seg(lt, s1, s6.s - .1));
  return lerp(1.0, 2.1, easeIn(seg(lt, s6.s - .1, s6.e + .25)));
};
const yawnK = lt => { const a = B('set').s + .1, b = a + 1.15; return lt < a || lt > b ? 0 : Math.pow(Math.sin(PI * seg(lt, a, b)), .7); };

// ---- the sky in the pane
const NIGHT = ['#070a24', '#17214f', '#33418a'], MID = ['#26397e', '#8a5a9c', '#ff8f5a'], DAY = ['#5d9ee0', '#ffb67e', '#ffe493'];
const skyStops = D => { const st = [0, .62, 1].map((o, i) => [o, D < .5 ? mixc(NIGHT[i], MID[i], D / .5) : mixc(MID[i], DAY[i], (D - .5) / .5)]); return st; };
// rooftops and trees along the bottom of the pane: the Moon sets behind them
const ROOFS = Array.from({ length: 11 }, (_, i) => ({ x: i / 10, w: .1 + .06 * hash(i + 3), h: .035 + .05 * hash(i * 2 + 5), tree: hash(i + 9) > .62 }));
function skyline(f, D) {
  const bx = f[0][0], by = f[0][1], ww = f[1][0] - f[0][0];
  ctx.fillStyle = mixc('#0b0f2c', '#4a2a44', D * 1.1);
  ctx.beginPath(); ctx.moveTo(bx - 4, by + 4);
  for (const r of ROOFS) {
    const x0 = bx + ww * (r.x - .04), x1 = x0 + ww * r.w, y = by - ww * r.h;
    if (r.tree) { ctx.lineTo(x0, by - ww * .02); ctx.quadraticCurveTo(x0 + (x1 - x0) * .5, y - ww * .045, x1, by - ww * .02); }
    else { ctx.lineTo(x0, by - ww * .02); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, by - ww * .02); }
  }
  ctx.lineTo(bx + ww + 4, by + 4); ctx.closePath(); ctx.fill();
  if (D > .35) { ctx.strokeStyle = `rgba(255,190,110,${.55 * seg(D, .35, .9)})`; ctx.lineWidth = 2.5; ctx.stroke(); }
}
function paneBirds(f, lt) {
  const t0 = B('set').s + .35, ww = f[1][0] - f[0][0], hh = f[0][1] - f[2][1];
  ctx.save(); ctx.strokeStyle = 'rgba(46,28,52,.85)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2.4, ww * .008);
  for (let i = 0; i < 5; i++) {
    const u = (lt - t0 - i * .18) / 3.2; if (u < 0 || u > 1) continue;
    const x = f[0][0] + ww * (1.12 - 1.26 * u), y = f[2][1] + hh * (.2 + .09 * i - .1 * u) + Math.sin(u * 8 + i) * 5, fl = Math.sin(lt * 13 + i * 1.7), sc = ww * .0016 * (1 + .12 * (i % 2));
    ctx.beginPath(); ctx.moveTo(x - 26 * sc, y - 10 * sc * fl - 4 * sc); ctx.quadraticCurveTo(x - 12 * sc, y - 18 * sc * fl, x, y); ctx.quadraticCurveTo(x + 12 * sc, y - 18 * sc * fl, x + 26 * sc, y - 10 * sc * fl - 4 * sc); ctx.stroke();
  }
  ctx.restore();
}
// the geometry of the pane in scene coordinates, from the camera as it is now
function pane() {
  const w = R.win, k = 1400 / R.zb, [bx, by] = V2.p2(w.x0, w.y0, R.zb), [tx, ty] = V2.p2(w.x1, w.y1, R.zb), ww = tx - bx;
  return { cx: (bx + tx) / 2, cy: (by + ty) / 2, ww, bx, by, tx, ty, k };
}
// where the Moon's centre and radius are in the pane for a given lt
function moonPose(lt, P = pane()) {
  const f = moonF(lt), r0 = .3 * P.ww, r = r0 * lerp(1, .84, clamp(f));
  const hor = P.by - P.ww * .075, yHigh = P.ty + r0 + P.ww * .03, yNear = hor - r * .7 - 8, yGone = P.by + r + P.ww * .06;
  const y = f <= 1 ? lerp(yHigh, yNear, f) : lerp(yNear, yGone, f - 1);
  return { f, r, x: P.cx - P.ww * .14, y, gone: y - r >= P.by - P.ww * .02 };   // the whole disc is under the roofs: nothing of the Moon is drawn
}

const SCENE = {
  shot(lt) {
    const b = id => B(id);
    const order = [['wide', b('s1').s - .05], ['cuS', b('m1').s - .1], ['moon', b('s2').s - .1], ['cuS', b('m2').s - .1], ['moon', b('s3').s - .1], ['cuS', b('m3').s - .1], ['moon', b('s4').s - .1],
      ['two', b('set').s + .25], ['wideSet', b('m4').s - .05], ['moon', b('s5').s - .1], ['cuS', b('m5').s - .1], ['moon', b('s6').s - .1], ['two', 1e9]];
    return order.find(([, e]) => lt < e)[0];
  },
  cast(lt) {
    const b = id => B(id), out = {}, S = b('set');
    const gq = V2.at(...GOJI_AT), breath = Math.sin(lt * 1.9);
    out.goji = goji({ x: gq.x, y: gq.y - 150 * gq.s + 1.6 * breath, s: gq.s * 1.02, noLegs: true, noShadow: true, noReflect: true, who: 'goji', expr: 'sleep', look: [0, 0], lid: 1, rot: .1 + .012 * breath, arms: { l: 'rest', r: 'rest' } });
    // Strawberry dozes on her feet while the Moon yawns, and the first sun in the window jolts her awake
    const doze = seg(lt, S.s + .2, S.s + .9) * (1 - seg(lt, S.s + 1.55, S.s + 1.62)), jolt = lt >= S.s + 1.55 ? 1 - seg(lt, S.s + 1.55, S.s + 2.0) : 0, glare = seg(lt, S.s + 1.55, S.s + 1.9) * (1 - seg(lt, S.s + 2.5, S.s + 3.0));
    const sq = V2.at(...STRAW_AT);
    const expr = lt < b('s1').s ? 'dead' : inB(lt, 's1') ? 'dead' : inB(lt, 'm1') ? 'dead' : inB(lt, 's2') ? 'dead' : inB(lt, 'm2') ? 'neutral' : inB(lt, 's3') ? 'hopeful' : inB(lt, 'm3') ? 'neutral' : inB(lt, 's4') ? 'chill'
      : lt < S.s + 1.55 ? (doze > .3 ? 'sleep' : 'chill') : lt < S.s + 1.9 ? 'shock' : lt < b('m4').s ? 'sour' : inB(lt, 'm4') ? 'sour' : inB(lt, 's5') ? 'dead' : inB(lt, 'm5') ? 'sour' : lt >= b('s6').s ? 'smug' : 'chill';
    out.straw = straw(Object.assign(sq, { lift: 22 * Math.sin(PI * jolt) * (jolt > 0 ? 1 : 0), rot: doze * (.07 * Math.sin(lt * 2.4) - .05) + (lt >= b('s4').s && lt < S.s ? 0 : 0),
      look: lt < b('s1').s + .6 ? [.5, .55] : lt < S.s + 1.55 && lt >= S.s ? [.2, .5] : [.7, -.25], expr, hold: { l: 'clipboard6', r: 'mug7' }, grip: { l: [-100, 30], r: [78, 48] }, clipText: 'ROUNDS', arms: { l: 'hold', r: 'hold' },
      lid: doze > .3 ? 1 : (lt < S.s + 1.55 ? .55 : lt < b('m4').s ? .62 : .5) }));
    out.glare = glare;
    return out;
  },
  moonFace(lt) {
    const b = id => B(id), S = b('set'), y = yawnK(lt);
    const expr = lt < b('m1').s ? 'dead' : inB(lt, 'm1') ? 'dead' : inB(lt, 's2') ? 'dead' : inB(lt, 'm2') ? 'sad' : inB(lt, 's3') ? 'sad' : lt < S.s ? 'chill' : y > 0 ? 'dead' : lt < b('m4').s ? 'chill' : inB(lt, 'm5') ? 'smug' : lt >= b('s6').s ? 'happy' : 'chill';
    const o = { expr, look: lt < S.s ? [-.55, .5] : [-.5, .55], lid: y > 0 ? .86 : expr === 'dead' ? .5 : undefined };
    if (y > 0) { o.who = null; o.mouthState = { open: y * .95, spread: .15, teeth: 0 }; o.talk = y * .95; }
    return o;
  },
  cam(lt) {
    const sh = SCENE.shot(lt), b = id => B(id);
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    const P = pane(), m = moonPose(lt, P), c = SCENE.cast(lt);
    const fz = (o, z, up = 80) => { const [fx, fy] = faceC(o); zoomTo(fx, fy + up / z, z); };
    if (sh === 'wide') { const k = seg(lt, 0, b('s1').s); zoomTo(lerp(520, 505, k), lerp(1010, 990, k), lerp(1.0, 1.07, k)); }
    else if (sh === 'cuS') { const id = ['s1', 's2', 's3', 's5', 's6'].find(i => lt >= b(i).s - .1 && lt < b(i).e + .4) || 's1', k = seg(lt, b(id).s - .1, b(id).e + .4); fz({ kind: 'straw', x: c.straw.x, y: c.straw.y, s: c.straw.s }, lerp(1.9, 2.08, easeOut(k)), 80); }
    else if (sh === 'moon') {
      const id = ['m1', 'm2', 'm3', 'm4', 'm5'].find(i => lt >= b(i).s - .12 && lt < b(i).e + .5) || 'm1', k = seg(lt, b(id).s - .12, b(id).e + .5), z = lerp(1.55, 1.7, k) + { m1: 0, m2: .08, m3: .16, m4: 0, m5: .05 }[id];
      zoomTo(P.cx + 10, m.y + 20 + 110 / z, z);
    }
    else if (sh === 'two') {
      const fs = faceC({ kind: 'straw', x: c.straw.x, y: c.straw.y, s: c.straw.s }), k = seg(lt, b('s4').s - .4, b('set').s + .25), kk = seg(lt, b('s6').s - .1, b('s6').e + .4);
      const late = lt > b('set').s + .5;
      if (!late) zoomTo(462, lerp(fs[1] - 30, fs[1] - 20, k) + 120 / 1.4, lerp(1.22, 1.30, k));   // wide enough that Strawberry's clipboard and Goji's hand and Z are both inside
      else zoomTo(469, lerp(960, 945, kk), lerp(1.25, 1.36, kk));
    }
    else if (sh === 'wideSet') { const k = seg(lt, b('set').s + .25, b('m4').s); zoomTo(lerp(470, 520, k), lerp(980, 1010, k), lerp(1.3, 1.0, easeIO(k))); }
  },
  draw(lt) {
    const sh = SCENE.shot(lt), t = id => B(id), D = dayK(lt), c = SCENE.cast(lt), S = t('set');
    const warmUp = seg(D, .45, 1), P = pane(), mp = moonPose(lt, P);
    V2.setLight({ key: [lerp(.2, -.35, D), -.7], keyColor: mixc('#cfd8ff', '#ffd9a2', D * 1.2), keyA: lerp(.2, .36, D), rim: mixc('#8fb8ff', '#ffb878', D * 1.2), rimA: lerp(.55, .62, D), shadow: mixc('#080a22', '#34203a', D), shadowA: lerp(.5, .36, D),
      amb: mixc('#9aa6e0', '#ffe2b4', D), ambA: lerp(.1, .15, D), bounce: '#ffd29a', bounceA: lerp(.3, .36, D) });
    V2.opts.reflect = true;
    const moonFace = SCENE.moonFace(lt), inFocus = ['moon', 'two', 'wide', 'wideSet'].includes(sh);
    const paintSky = f => {
      const [bx, by] = f[0], ww = f[1][0] - f[0][0], cx = (f[0][0] + f[1][0]) / 2, ty = f[2][1], hor = by - ww * .075;
      A7.stars(lt, ty + (by - ty) * .95, { n: 110, seed: 5, a: .9 * (1 - seg(D, .12, .6)) });
      A7.clouds(lt, ty + 30, by - 70, { n: 3, tint: mixr('130,140,200', '255,200,150', D * 1.3), belly: mixr('40,50,110', '200,110,120', D * 1.2), a: lerp(.3, .55, D), speed: 5, seed: 9, scale: .4 });
      // the horizon glow and the first of the sun, rising behind the roofs on the left
      if (D > .2) {
        const g = seg(D, .2, 1);
        V2.glow(bx + ww * .26, hor + ww * .03, ww * (.45 + .5 * g), '255,170,90', .55 * g, 'screen', .3);
        const rise = easeOut(seg(D, .55, 1)), sy = hor + ww * .1 - rise * ww * .19;
        ctx.fillStyle = mixc('#ffcf7a', '#fff6c8', rise); ctx.beginPath(); ctx.arc(bx + ww * .22, sy, ww * .085, 0, TAU); ctx.fill();
        V2.glow(bx + ww * .22, sy, ww * .5, '255,214,140', .5 * rise, 'screen', .4);
      }
      if (!mp.gone) A7.moon(mp.x, mp.y, mp.r / 150, { t: lt, haloA: .8 * (1 - clamp(mp.f * .6)) * (1 - warmUp * .55) * (1 - seg(mp.f, 1.0, 1.5)), warm: warmUp * .65, suppress: !inFocus || mp.f > 1.3, char: moonFace });
      if (lt > S.s + .3) paneBirds(f, lt);
      skyline(f, D);
    };
    const wc = V2.p2(0, 355, R.zb);
    const back = () => {
      S7.room14Back({ t: lt, sky: skyStops(D), paintSky });
      // moonlight on the floor, turning to gold: a lit copy of the window that leans toward the bed as the sun gets up
      const lean = lerp(-190, 150, easeIO(seg(D, .3, 1))), wp = [V2.p2(R.win.x0 + lean, 0, 1300), V2.p2(R.win.x1 + lean, 0, 1300), V2.p2(R.win.x1, 0, R.zb - 14), V2.p2(R.win.x0, 0, R.zb - 14)];
      A7.gobo(wp, { color: mixr('190,215,255', '255,208,130', D * 1.4), a: lerp(.5, .6, D) * (1 - .0), mull: 2 });
      const ns = S7.nightstand({ lampA: lerp(.5, .16, D) }); S7.bedBack();
      V2.addLight({ x: ns.lamp[0], y: ns.lamp[1], r: 700, color: '255,200,120', a: lerp(.55, .22, D) });
      V2.addLight({ x: wc[0], y: wc[1], r: 1100, color: mixr('170,200,255', '255,196,120', D * 1.3), a: lerp(.45, .6, D) });
      V2.glow(wc[0], wc[1], 700, mixr('190,210,255', '255,214,150', D * 1.3), lerp(.18, .3, D), 'screen', .5);
      // god-rays: soft shafts from the pane to the floor and across the bed, building through the last third of the scene
      const gr = seg(D, .55, 1);
      if (gr > 0) {
        const fl = (u, z) => V2.p2(lerp(R.win.x0, R.win.x1, u) + lean * (1900 - z) / 600, 0, z);
        for (const u of [.12, .38, .64, .9]) { const a = V2.p2(lerp(R.win.x0, R.win.x1, u), 300 + 60 * u, R.zb - 14), b2 = fl(u, 1350); V2.beam(a[0], a[1], b2[0], b2[1], 34, 120, '255,214,140', .24 * gr * (.75 + .25 * Math.sin(lt * .8 + u * 9))); }
      }
    };
    const bedLight = () => { const gr = seg(D, .55, 1); if (gr <= 0) return; const q = [V2.p2(100, 166, 1130), V2.p2(380, 166, 1130), V2.p2(380, 180, 1640), V2.p2(100, 180, 1640)]; A7.gobo(q.map(([x, y], i) => [x + (i < 2 ? -50 : 60), y]), { color: '255,214,140', a: .32 * gr, mull: 2, bars: 0 }); };
    const subj = sh === 'cuS' ? 'straw' : null;
    const gq0 = V2.at(...GOJI_AT), zx = gq0.x + 34, zy = gq0.y - 150 * gq0.s - 94 * gq0.s * 1.02 - 24;
    const gojiDraw = s => { (s || !subj ? drawChar : drawBg)(c.goji); S7.bedFront(); bedLight();
      for (let i = 0; i < 3; i++) { const q = ((lt * .42 + i / 3) % 1); text('Z', zx + q * 34 + i * 8, zy - q * 100 - i * 12, { size: 34 + i * 14, font: 'Bangers', weight: 400, fill: mixc('#c9d8ff', '#ffe6b8', D), alpha: Math.min(1, q * 5) * (1 - q) * .95, lw: 6, stroke: 'rgba(20,16,40,.6)' }); } };
    const list = [{ id: 'goji', z: GOJI_AT[1], o: c.goji, draw: gojiDraw }, { id: 'straw', z: STRAW_AT[1], o: c.straw, draw: s => (s || !subj ? drawChar : drawBg)(c.straw) }];
    const only = sh === 'moon' ? ['goji'] : null;
    layered(list, subj, subj ? 8 : 0, back, [], only);
    V2.dust(60, 700, 1020, 1300, lt, { n: 36, alpha: lerp(.35, .55, D), color: mixr('200,215,255', '255,226,170', D * 1.3) });
    if (c.glare > 0) V2.flare(W * .62, 760, .5 * c.glare, '255,226,170');
  },
  fx(lt) {
    const D = dayK(lt), S = B('set'), g = seg(lt, S.s + 1.5, S.s + 1.75) * (1 - seg(lt, S.s + 1.75, S.s + 2.6));
    return { bloom: lerp(.6, .8, D), vignette: lerp(.55, .42, D), grain: .06, contrast: .18, sat: lerp(.1, .22, D), tint: [['#3a54c8', .2 * (1 - D), 'soft-light'], ['#0a1030', .12 * (1 - D), 'multiply'], ['#ff9a4a', .3 * D, 'soft-light']], fade: .2 * g, fadeColor: '255,236,190' };
  },
  blur: lt => 1,
  clock: lt => lt >= B('m5').s - .3 ? '6:58 AM' : lt >= B('set').s + 1.0 ? '6:52 AM' : CUR.clock,
  over(lt) {},
};
window.__EP8_SCENES.dawn = SCENE;
})();
