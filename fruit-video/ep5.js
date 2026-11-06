'use strict';
/* SHIFT HAPPENS, Episode 5: Full Moon
 *
 * The Moon is blamed for everything, keeps score, and is cleared by the staffing. New cast, new sets, new sounds.
 * Art lives in ep5_art.js (fruit, props, overlays) and ep5_sets.js (sets); `node render.js audit` checks every frame. */
(() => {
if (!window.TIMELINE_EP5) return;
const { glow, stars, moon, sun, archWindow, hud, mapCard, chartCard, lcdCard, mango, pear, drag, skyDusk, cloudStreaks, lotLayer, appleCore, breakDoor, bgBreak, breakLight,
  tableSet, chairBack, hallBG, vitalsCart, laundryCart, bgTemple, spotlight, goodCuff, bgLobby, lobbyDoors, bigClock, cow } = window.A5;
const EP5_LABEL = 'EPISODE 5: FULL MOON';
const playing = (lt, id) => lt >= B(id).s && lt < B(id).e;
const after = (lt, id) => lt >= B(id).e;
const clockHM = (h, m) => [h, m];

// a ceiling speaker with sound arcs while the page is talking
function paSpeaker(x, y, on, lt) {
  ctx.fillStyle = '#dfe3e6'; ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 3; ell(x, y, 40, 22); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a95a3'; for (let i = -2; i <= 2; i++) { ell(x + i * 11, y, 2.6, 2.6); ctx.fill(); }
  if (on) for (let i = 0; i < 3; i++) { const q = (lt * 2.2 + i / 3) % 1; ctx.strokeStyle = `rgba(255,236,150,${1 - q})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y + 6, 50 + q * 90, PI * .2, PI * .8); ctx.stroke(); }
}
function web(x, y, w, h, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(240,240,250,.75)'; ctx.lineWidth = 2;
  for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x + w * i / 6, y); ctx.quadraticCurveTo(x + w * i / 6 + 14, y + h * .5, x + w * (6 - i) / 6, y + h); ctx.stroke(); }
  for (let j = 1; j < 5; j++) { ctx.beginPath(); ctx.moveTo(x, y + h * j / 5); ctx.quadraticCurveTo(x + w / 2, y + h * j / 5 + 18, x + w, y + h * j / 5); ctx.stroke(); }
  ctx.restore();
}
function sheets(lt, t0, n, x0) {
  const k = lt - t0; if (k < 0 || k > 2.4) return;
  for (let i = 0; i < n; i++) {
    const vx = (hash(i) - .5) * 700, x = x0 + vx * k * .5 + Math.sin(k * 5 + i) * 30, y = 520 + hash(i + 7) * 200 + 330 * k * k * (.6 + hash(i + 3) * .5) - 280 * k;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * (3 + i % 3) + i); ctx.globalAlpha = 1 - seg(k, 1.8, 2.4);
    ctx.fillStyle = i % 3 ? '#f4f6fb' : '#dbe3f2'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(-40, -26, 80, 52); ctx.strokeRect(-40, -26, 80, 52); ctx.restore();
  }
}
function hudSun(p) {
  if (p <= 0) return;
  const x = 560, y = 22, w = 490, h = 100, cx = x + w / 2, cy = y + h / 2, s = easeBack(clamp(p));
  reg('overlay', [x, y, x + w, y + h], { id: 'hud-sun' });
  ctx.save(); ctx.globalAlpha *= clamp(p * 2); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.fillStyle = 'rgba(8,12,38,.95)'; rr(x, y, w, h, 24); ctx.fill(); ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 4; rr(x, y, w, h, 24); ctx.stroke();
  ctx.fillStyle = '#ffd22e'; ell(x + 50, cy, 24, 24); ctx.fill(); ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(x + 50 + Math.cos(a) * 31, cy + Math.sin(a) * 31); ctx.lineTo(x + 50 + Math.cos(a) * 40, cy + Math.sin(a) * 40); ctx.stroke(); }
  text('BLAMED ON THE SUN', x + 100, y + 31, { size: 20, fill: '#ffd88a', align: 'left', spacing: 1, maxW: 360 });
  text('SUNDOWNING', x + 100, y + 72, { size: 56, font: 'Bangers', weight: 400, fill: '#ffb703', align: 'left', spacing: 3, maxW: 370 });
  ctx.restore();
}
function night(a) { if (a > 0) { ctx.fillStyle = `rgba(6,8,30,${a})`; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2); } }
function vignetteDim(a) {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(540, 1000, 200, 540, 1000, 760); g.addColorStop(0, 'rgba(4,4,20,0)'); g.addColorStop(1, `rgba(4,4,20,${a})`);
  ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
}

const SCENES = {
  // ---------------------------------------------------------------- sunset: the handoff
  title: {
    cam(lt) { const p = easeIO(seg(lt, 0, CUR.dur)); CAM.z = 1 + .06 * p; CAM.y = 770 - 30 * p; },
    draw(lt) {
      const s1 = B('s1'), m1 = B('m1'), s2 = B('s2'), m2 = B('m2'), s3 = B('s3'), lg = B('logo');
      const p = seg(lt, 0, CUR.dur);
      skyDusk(easeIO(p) * .8); cloudStreaks(p, lt); stars(seg(p, .2, .6), 11, 80, 760);
      const sink = easeIn(seg(lt, s3.s + .15, s3.e + 1.2));
      if (sink < 1) sun(250, lerp(850, 1230, sink) + Math.sin(lt * 1.5) * 4, 1, { look: [.9, .1], noArms: false,
        expr: lt >= s3.s ? 'happy' : lt >= s2.s ? 'smug' : 'chill', arms: { l: 'rest', r: lt >= s3.s - .1 ? 'wave' : 'rest' } });
      const rise = easeOut(seg(lt, 0, lg.s + .6));
      moon(800, lerp(1210, 790, rise), 1.15, { look: [-.9, -.05], noArms: false, arms: { l: 'rest', r: 'rest' },
        expr: lt >= B('m3').e - 1.8 ? 'smug' : lt >= B('m3').s ? 'chill' : lt >= m2.s ? 'sour' : lt >= m1.s ? 'dead' : 'neutral', glow: .5 + .5 * rise });
      lotLayer();
    },
    over(lt) {
      const lg = B('logo'), m3 = B('m3'), p = seg(lt, lg.s, lg.s + .35);
      if (p > 0) logo2(540, 300, lerp(1.06, .82, easeOut(seg(lt, lg.s, m3.s + .3))) * (1 + .012 * Math.sin(lt * 6)), clamp(p * 3), EP5_LABEL, labelWidth(EP5_LABEL));
      hud(lt, { appear: seg(lt, m3.e - .15, m3.e + .25) });
    },
  },

  // ---------------------------------------------------------------- the break room
  break: {
    cam(lt) { const p = easeIO(seg(lt, 0, CUR.dur)); CAM.z = 1 + .04 * p; CAM.x = 540 + 20 * p; CAM.y = 740 + 20 * p; },
    draw(lt) {
      const door = B('door'), s1 = B('s1'), m1 = B('m1'), s2 = B('s2'), m2 = B('m2'), sit = B('sit'), s3 = B('s3'), ch = B('chime'), pa = B('pa1'), s4 = B('s4'), m3 = B('m3');
      bgBreak();
      const dOpen = lt < .3 ? 0 : easeOut(seg(lt, .3, .9)) * (1 - seg(lt, 2.2, 2.7));
      breakDoor(dOpen);
      const lit = lt < 1.3 ? 0 : lt < 1.9 ? (Math.sin(lt * 70) > 0 ? 1 : 0) : 1;
      archWindow(720, 190, 300, 360, () => moon(870, 372, .8, { look: playing(lt, 's4') || after(lt, 's4') ? [-.9, .5] : [-.7, .4], expr: lt >= m3.s ? 'sour' : lt >= s4.s ? 'shock' : lt >= m2.s ? 'smug' : 'dead' }), { seed: 7 });
      paSpeaker(700, 120, playing(lt, 'pa1'), lt);
      chairBack(830, 892, '#8a5a34', 250);
      appleCore(830, 1085, 1.1, lt, { tilt: lt > m2.s ? Math.min(.16, (lt - m2.s) * .1) : 0 });
      ctx.fillStyle = lit ? '#fffbe8' : '#8a897c'; rr(380, 46, 320, 36, 8); ctx.fill(); if (lit) glow(540, 90, 620, '255,246,214', .22);
      // Strawberry: walks in, stops, goes to the table, sits, gets paged, stands up angry
      const walkIn = seg(lt, .9, 2.0), toTable = easeIO(seg(lt, sit.s, sit.e - .1));
      const x = lt < sit.s ? lerp(-150, 330, easeOut(walkIn)) : lerp(330, 500, toTable);
      const plop = easeOut(seg(lt, sit.e - .25, sit.e - .05)) * (1 - seg(lt, s4.s, s4.s + .12));
      const walking = (lt > .9 && lt < 2.0) || (lt >= sit.s && lt < sit.e - .1);
      const eyesShut = playing(lt, 's3') ? .96 : null;
      drawChar(straw({ x, y: 1330 + 46 * plop, s: 1.3, walk: walking ? lt * 14 : null, transit: lt < 2.4, squash: .18 * Math.sin(plop * PI),
        look: lt < s1.s ? [.5, 0] : lt < m1.s ? [.6, -.2] : lt < sit.s ? [.9, 0] : lt < s4.s ? [.4, 0] : [.9, -.4],
        expr: lt < s1.s ? 'neutral' : lt < s2.s ? 'chill' : lt < sit.s ? 'shock' : playing(lt, 's3') ? 'chill' : lt < pa.s ? 'shock' : lt < s4.s ? 'dead' : lt < m3.s ? 'angry' : 'sour',
        lid: eyesShut ?? (lt >= ch.s - .1 && lt < pa.s ? .5 : undefined),
        arms: lt >= s4.s && lt < m3.s ? { l: 'hips', r: 'point' } : { l: 'rest', r: 'rest' } }));
      tableSet(380, 1040, 1240);
      // dust and the cobweb in the doorway
      web(34, 340, 190, 360, 1 - seg(lt, 1.15, 1.5));
      poof(130, 1300, seg(lt, 1.15, 1.75), 90);
      if (lt < 1.9) { ctx.fillStyle = `rgba(255,236,170,${.38 * dOpen * (1 - seg(lt, 1.3, 1.9))})`; ctx.beginPath(); ctx.moveTo(30, 1300); ctx.lineTo(228, 1300); ctx.lineTo(700, 1480); ctx.lineTo(-50, 1480); ctx.fill(); }
      night(.8 * (1 - lit) * (1 - seg(lt, 1.8, 1.9)));
      glow(130, 900, 330, '255,226,150', .5 * dOpen * (1 - lit));
    },
    over(lt) {
      const pa = B('pa1'), m3 = B('m3');
      banner2(Math.min(seg(lt, pa.s, pa.s + .25), 1 - seg(lt, pa.e - .15, pa.e)), 'PAGING NURSE STRAWBERRY', '#e8a86a', '#1d1a22', 52);
      banner2(seg(lt, m3.s + .2, m3.s + .5) * (1 - seg(lt, m3.e + .1, m3.e + .4)), 'BREAK TAKEN: 0:04', '#d62828', '#fff', 70);
      hud(lt);
    },
  },

  // ---------------------------------------------------------------- the hallway: Code Mauve
  hall: {
    cam(lt) { const p = easeIO(seg(lt, 0, CUR.dur)); CAM.z = 1 + .035 * p; CAM.x = 540 + 30 * p; },
    draw(lt) {
      const al = B('alarm'), pa = B('pa1'), s1 = B('s1'), g1 = B('g1'), p1 = B('p1'), s2 = B('s2'), p2 = B('p2'), s3 = B('s3'), p3 = B('p3'), lk = B('look'), g2 = B('g2'), s4 = B('s4'), m1 = B('m1');
      const ringing = (lt > al.s && lt < al.e + .9) || (lt > p2.s && lt < p2.s + .7);
      hallBG(0, { closet: true, exit: true, exitKey: true, alarm: ringing, flicker: true,
        moon: () => moon(520, 312, 1.05, { look: lt > g2.s ? [.4, .5] : [.7, .5], expr: lt >= m1.s ? 'sour' : lt >= s4.s ? 'smug' : 'dead' }) });
      paSpeaker(540, 100, playing(lt, 'pa1'), lt);
      // Mr. Pear works the exit bar
      const push = lt < al.e + .6 ? Math.abs(Math.sin(lt * 9)) : (lt > p2.s && lt < p2.s + .7 ? Math.abs(Math.sin((lt - p2.s) * 9)) : 0);
      const talking = lt >= p1.s;
      drawChar(pear({ x: 900 + (talking ? 0 : -push * 14), y: G, look: talking && !playing(lt, 'p2') ? [-.9, 0] : [.5, -.1], rot: talking ? 0 : -.04 * push,
        expr: lt < p1.s ? 'grumpy' : playing(lt, 'p2') ? 'smug' : playing(lt, 'p3') ? 'happy' : 'neutral', legs: lt < p1.s ? undefined : playing(lt, 'p3') ? undefined : undefined,
        arms: !talking || (lt > p2.s && lt < p2.s + .7) ? { l: 'hold', r: 'reach' } : playing(lt, 'p2') ? { l: 'hold', r: 'up' } : playing(lt, 'p3') ? { l: 'hold', r: 'hips' } : { l: 'hold', r: 'rest' } }));
      // Strawberry and Mango arrive after the page
      const arrive = easeOut(seg(lt, pa.e - 1.2, s1.s));
      const walk = lt > pa.e - 1.2 && arrive < 1;
      const face = lt >= lk.s && lt < g2.s ? 0 : 1;
      drawChar(straw({ x: lerp(-180, 250, arrive), walk: walk ? lt * 14 : null, transit: lt < s1.s + .3, look: lt >= lk.s && lt < g2.s + .3 ? [.9, 0] : [.9, -.05],
        expr: lt < s1.s ? 'neutral' : lt < s2.s ? 'sour' : lt < s3.s ? 'neutral' : lt < p3.s ? 'shock' : lt < s4.s ? 'dead' : lt < m1.s ? 'smug' : 'sour',
        arms: lt >= s4.s && lt < m1.s ? { l: 'hips', r: 'up' } : { l: 'rest', r: 'rest' } }));
      drawChar(mango({ x: lerp(-420, 520, arrive), walk: walk ? lt * 14 + 1 : null, transit: lt < s1.s + .3, look: lt >= lk.s && lt < g2.s ? [-.9, 0] : [.9, 0],
        expr: playing(lt, 'g2') ? 'chill' : lt >= g1.s ? 'smug' : 'neutral', arms: playing(lt, 'g1') ? { l: 'rest', r: 'point' } : { l: 'rest', r: 'rest' } }));
      vignetteDim(.25);
    },
    over(lt) {
      const pa = B('pa1'), m1 = B('m1');
      banner2(Math.min(seg(lt, pa.s, pa.s + .25), 1 - seg(lt, pa.e - .1, pa.e + .15)), 'CODE MAUVE', '#9b59b6', '#fff', 92);
      card(seg(lt, m1.s + .1, m1.s + .4) * (1 - seg(lt, m1.e + .2, m1.e + .5)), 'CARE PLAN: MR. PEAR', [['PAGE 4', 'Exit seeking, nightly'], ['SINCE', 'March']], '#2a9d4a');
      hud(lt);
    },
  },

  // ---------------------------------------------------------------- the vitals cart and the legend
  cuff: {
    cam(lt) { const g1 = B('g1'), mp = B('map'), p = easeIO(seg(lt, g1.s, mp.s)); CAM.z = 1 + .06 * p; CAM.x = 540 + 40 * p; },
    draw(lt) {
      const er = B('err'), s1 = B('s1'), g1 = B('g1'), s2 = B('s2'), g2 = B('g2'), s3 = B('s3'), g3 = B('g3'), mp = B('map');
      hallBG(0, { closet: true, moon: () => moon(560, 312, 1.05, { look: [-.5, .5], expr: 'dead' }) });
      vitalsCart(700, 1385, true, lt);
      const looksUp = lt >= mp.s;
      drawChar(straw({ x: 260, y: G, look: looksUp ? [.2, -.8] : lt < g1.s ? [.9, .1] : [.9, 0], expr: lt < s1.s ? 'sour' : lt < g2.s ? 'neutral' : lt < mp.s ? 'shock' : 'hopeful',
        arms: lt < s1.s ? { l: 'rest', r: 'rest' } : { l: 'hips', r: 'rest' } }));
      drawChar(mango({ x: 490, y: G, look: looksUp ? [.2, -.8] : [-.9, .1], expr: lt >= g1.s ? 'smug' : 'neutral', arms: playing(lt, 'g2') ? { l: 'rest', r: 'point' } : { l: 'rest', r: 'rest' } }));
      drawChar(pear({ x: 940, y: G, look: [-.9, .1], expr: 'grumpy', legs: 'tap', arms: { l: 'hold', r: 'rest' } }));
      vignetteDim(.32 * seg(lt, g1.s - .3, g1.s + .3));
    },
    over(lt) {
      const mp = B('map');
      mapCard(seg(lt, mp.s, mp.s + 1.45), lt);
      hud(lt);
    },
  },

  // ---------------------------------------------------------------- the temple
  temple: {
    cam(lt) {
      const sw = B('swap'), sh = B('shake'), p = easeIO(seg(lt, sw.s + .8, sw.e)), q = seg(lt, sh.s, sh.s + .15);
      CAM.z = 1 + .07 * p; CAM.x = 540 - 80 * p; CAM.y = 740 + 40 * p; CAM.shake = lt >= sh.s ? 16 * (1 - seg(lt, sh.e - .3, sh.e)) * q : 0;
    },
    draw(lt) {
      const dr = B('door'), rv = B('reveal'), s1 = B('s1'), sw = B('swap'), sh = B('shake');
      bgTemple();
      const lightOn = seg(lt, rv.s, rv.s + .25), flick = lt >= sh.s ? (Math.sin(lt * 40) > -.2 ? 1 : .35) : 1;
      // supplies tumble off the shelves in the quake
      if (lt >= sh.s) for (let i = 0; i < 9; i++) {
        const k = lt - sh.s - hash(i) * .5; if (k < 0) continue;
        const bx = (i % 2 ? 40 : 810) + hash(i + 3) * 220, by = 420 + hash(i + 8) * 400 + 700 * k * k;
        if (by > 1280) continue; ctx.save(); ctx.translate(bx, by); ctx.rotate(k * 3 * (i % 2 ? 1 : -1)); ctx.fillStyle = '#e9e4d6'; ctx.strokeStyle = '#14101e'; ctx.lineWidth = 3; ctx.fillRect(-30, -24, 60, 48); ctx.strokeRect(-30, -24, 60, 48); ctx.restore();
      }
      spotlight(lightOn * flick, lt);
      const taken = lt >= sw.s + 1.0;
      if (!taken) goodCuff(540, 976, lightOn, lt);
      else { ctx.save(); ctx.translate(520, 978); EXT.prop.ivbag(); ctx.restore(); }
      if (lt < s1.e + .3) regKey('pedestal-sign', 456, 1092, 624, 1220);
      const enter = easeOut(seg(lt, .4, dr.e - .1)), step = easeIO(seg(lt, s1.s, s1.e + .2));
      const x = lt < s1.s ? lerp(-150, 220, enter) : lt < sw.s ? lerp(220, 320, step) : lerp(320, 380, easeIO(seg(lt, sw.s, sw.s + .5)));
      const reach = lt >= sw.s + .55;
      const hasBag = lt >= sw.s && lt < sw.s + 1.0;
      drawChar(straw({ x, y: G, walk: enter < 1 && lt < s1.s ? lt * 13 : null, transit: lt < s1.s, shake: lt >= sw.s + 1.2 && lt < sh.s ? 3 : 0,
        look: lt < rv.s ? [.8, 0] : [.9, -.2], sparkle: lt >= rv.s && lt < sw.s,
        expr: lt < rv.s ? 'neutral' : lt < sw.s ? 'shock' : lt < sw.s + 1.0 ? 'sour' : lt < sh.s ? 'panic' : 'panic',
        acc: [...STRAW_ACC, ...(lt >= sw.s + .5 ? ['sweat'] : [])], cuffGlow: lightOn, cuffText: '',
        hold: taken ? { r: 'bpcuff' } : hasBag ? { l: 'ivbag' } : {},
        arms: taken ? { l: 'rest', r: lt >= sh.s ? [2.3, .4] : 'reach' } : hasBag ? { l: 'hold', r: lt >= sw.s + .5 ? 'reach' : 'rest' } : { l: 'rest', r: 'rest' } }));
      night(.8 * (1 - lightOn) + .22 * lightOn);
      if (lt < rv.s) { const g = ctx.createLinearGradient(0, 0, 460, 0); const a = .5 * seg(lt, .2, .6); g.addColorStop(0, `rgba(255,214,120,${a})`); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-60, 940); ctx.lineTo(40, 900); ctx.lineTo(560, 1290); ctx.lineTo(-60, 1300); ctx.fill(); }
    },
    over(lt) {
      const rv = B('reveal');
      hud(lt);
      flash(seg(lt, rv.s, rv.s + .35));
    },
  },

  // ---------------------------------------------------------------- the chase
  chase: {
    cam(lt) { const cr = B('crash'); CAM.shake = lt < 6.9 ? 3 + 3 * Math.sin(lt * 9) : lt < cr.e - .6 ? 14 * (1 - seg(lt, cr.s, cr.e - .6)) : 0; },
    draw(lt) {
      const rl = B('roll'), g1 = B('g1'), s1 = B('s1'), m1 = B('m1'), cr = B('crash'), er = B('err'), g2 = B('g2'), s2 = B('s2'), g3 = B('g3'), p1 = B('p1'), s3 = B('s3');
      const V = 1300, t0 = .1, t1 = 1.0, t2 = 6.9, t3 = 7.5;
      const off = lt < t0 ? 0 : lt < t1 ? V * (lt - t0) * (lt - t0) / (2 * (t1 - t0)) : lt < t2 ? V * (t1 - t0) / 2 + V * (lt - t1)
        : lt < t3 ? V * (t1 - t0) / 2 + V * (t2 - t1) + V * ((lt - t2) - (lt - t2) * (lt - t2) / (2 * (t3 - t2))) : V * (t1 - t0) / 2 + V * (t2 - t1) + V * (t3 - t2) / 2;
      const speed = lt < t0 || lt > t3 ? 0 : lt < t1 ? (lt - t0) / (t1 - t0) : lt < t2 ? 1 : 1 - (lt - t2) / (t3 - t2);
      const END = V * (t1 - t0) / 2 + V * (t2 - t1) + V * (t3 - t2) / 2;
      hallBG(off, { closet: true, closetOpen: true, moon: () => moon(820, 312, 1.0, { look: [-.9, .3], expr: lt >= m1.s ? 'sour' : 'dead' }) });
      // the Good Cuff dash: runaway laundry cart
      const cartX = lt < 1.4 ? -420 + 330 * easeOut(seg(lt, .2, 1.4)) : lt < 6.8 ? lerp(-90, 560, easeIn(seg(lt, 1.4, 6.8))) : lt < 7.2 ? lerp(560, 1500, easeIn(seg(lt, 6.8, 7.2))) : 2000;
      if (cartX < 1400) laundryCart(cartX, 1340, 1.0, Math.sin(lt * 17) * .03, lt);
      // the destination: vitals cart and Mr. Pear slide in from the right as the hall stops
      const px = END + 700 - off, cx = END + 920 - off;
      if (cx < 1300) vitalsCart(cx, 1385, true, lt, cx > 960 || lt < 7.8);
      if (px < 1300) drawChar(pear({ x: px, y: G, look: [-.9, 0], expr: lt >= p1.s ? 'smug' : 'neutral', who: 'pear', legs: undefined, transit: lt < 7.8, arms: { l: 'hold', r: 'rest' } }));
      sheets(lt, cr.s - .05, 16, 980);
      const run = lt < t3 + .2, hop = lt > 6.85 && lt < 7.3 ? Math.sin(seg(lt, 6.85, 7.3) * PI) * 110 : 0;
      const dive = lt > 6.85 && lt < 7.3 ? .5 * Math.sin(seg(lt, 6.85, 7.3) * PI) : 0;
      const arrived = lt >= cr.e;
      const sx = 420, mx = 170;
      speedLines(sx - 200, 1130, 420, .55 * speed);
      drawChar(straw({ x: sx, y: G - hop, transit: lt < cr.e + .9, walk: run ? lt * 30 : null, rot: dive, who: 'straw',
        expr: lt < g1.s ? 'panic' : lt < er.s ? 'panic' : lt < g2.s ? 'sour' : lt < p1.s ? 'dead' : 'sour', look: run ? [.8, 0] : [.9, 0], cuffGlow: .6, cuffText: lt >= er.s + 1.4 ? 'ERR' : '8888',
        hold: { r: 'bpcuff' }, arms: run ? { l: 'run', r: [2.5, .3] } : lt < er.s ? { l: 'rest', r: [2.5, .3] } : { l: 'hips', r: 'reach' } }));
      drawChar(mango({ x: mx, y: G - hop, transit: lt < cr.e + .9, walk: run ? lt * 30 + 1.3 : null, rot: dive * .8, look: run ? [-.4, .2] : [.9, 0],
        expr: lt < er.s ? 'panic' : 'neutral', arms: run ? { l: 'flail', r: 'flail' } : { l: 'rest', r: 'rest' } }));
      night(.12);
    },
    over(lt) {
      const cr = B('crash'), er = B('err');
      hud(lt);
      lcdCard(seg(lt, er.s + 1.45, er.s + 1.75) * (1 - seg(lt, B('p1').e - .1, B('p1').e + .2)), 'ERR', lt);
      flash(seg(lt, cr.s, cr.s + .3));
    },
  },

  // ---------------------------------------------------------------- charting in the lobby
  chart: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const ty = B('type'), s1 = B('s1'), ps = B('paste'), s2 = B('s2'), g1 = B('g1'), s3 = B('s3'), pa = B('pa1'), s4 = B('s4'), cw = B('cow'), s5 = B('s5'), g2 = B('g2'), m1 = B('m1');
      bgLobby();
      archWindow(60, 180, 400, 470, () => moon(260, 392, 1.1, { look: [.5, .5], expr: lt >= m1.s ? 'sour' : lt >= s5.s ? 'smug' : 'dead' }), { seed: 4 });
      bigClock(620, 292, 10, 41);
      lobbyDoors(0);
      paSpeaker(840, 110, playing(lt, 'pa1'), lt);
      const dead = lt >= cw.s + .3, dying = lt >= pa.s + 1.5 && !dead;
      cow(700, 1395, dead ? 'dead' : dying ? 'dying' : 'ok', lt);
      const typing = lt > ty.s && lt < s2.s;
      drawChar(straw({ x: 430, look: lt < s2.s ? [.9, -.1] : lt >= m1.s ? [-.7, -.6] : [.4, 0], expr: lt < s2.s ? 'dead' : playing(lt, 's3') ? 'smug' : lt >= cw.s + .2 ? 'sour' : lt >= s4.s ? 'angry' : 'neutral',
        arms: typing ? { l: 'rest', r: [1.8 + .15 * Math.sin(lt * 25), .5] } : lt >= s5.s ? { l: 'rest', r: 'up' } : { l: 'rest', r: 'rest' } }));
      const mg = easeOut(seg(lt, g1.s - 1.5, g1.s - .2));
      if (lt > g1.s - 1.5) drawChar(mango({ x: lerp(-220, 150, mg), walk: mg < 1 ? lt * 14 : null, transit: mg < 1, look: [.9, 0],
        expr: playing(lt, 'g1') ? 'smug' : playing(lt, 'g2') ? 'chill' : 'neutral' }));
      // Mr. Pear sprints across the foreground while his note says "resting quietly in bed"
      const run = seg(lt, ps.s + .2, ps.s + 2.2);
      if (run > 0 && run < 1) { speedLines(lerp(1450, -100, run) + 260, 1280, 360, .5); drawChar(pear({ x: lerp(1300, -240, run), y: 1478, s: 1.0, transit: true, walk: lt * 26, look: [-.9, 0], expr: 'happy', who: null, arms: { l: 'hold', r: 'run' } })); }
    },
    over(lt) {
      const ty = B('type'), ps = B('paste'), pa = B('pa1'), s4 = B('s4'), cw = B('cow');
      const cardA = seg(lt, ty.s + .1, ty.s + .4) * (1 - seg(lt, pa.s - .2, pa.s));
      chartCard(lt, [['MR. PEAR', seg(lt, ty.s + .3, ps.s - .2)], ['MRS. PLUM', seg(lt, ps.s, ps.s + .25)], ['MR. LIME', seg(lt, ps.s + .5, ps.s + .75)]], { a: cardA });
      banner2(Math.min(seg(lt, pa.s + .2, pa.s + .5), 1 - seg(lt, pa.e - .1, pa.e + .2)), 'NEW WI-FI PASSWORD: ?????', '#e8a86a', '#1d1a22', 50);
      chartCard(lt, [], { a: seg(lt, cw.s + .3, cw.s + .6), expired: true });
      hud(lt);
    },
  },

  // ---------------------------------------------------------------- the tally
  tally: {
    cam(lt) { const m3 = B('m3'), d1 = B('door'), p = easeIO(seg(lt, 1.2, m3.e)) * (1 - easeIO(seg(lt, d1.s, d1.e + .6))); CAM.z = 1 + .07 * p; CAM.x = 540 - 120 * p; CAM.y = 740 - 20 * p;
      const m6 = B('m6'); CAM.shake = lt >= m6.s ? 12 * (1 - seg(lt, m6.s + .6, m6.e + .6)) : 0; },
    draw(lt) {
      const s1 = B('s1'), m1 = B('m1'), s2 = B('s2'), m2 = B('m2'), s3 = B('s3'), m3 = B('m3'), m4 = B('m4'), s4 = B('s4'), m5 = B('m5'), dr = B('door'), d1 = B('d1'), s5 = B('s5'), d2 = B('d2'), m6 = B('m6');
      bgLobby();
      const red = seg(lt, d2.e, d2.e + .3);
      const mexpr = lt >= m6.s ? 'angry' : lt >= d2.s ? 'shock' : lt >= m3.s && lt < m4.s ? 'happy' : lt >= m3.s ? 'chill' : lt >= m2.s ? 'chill' : 'dead';
      archWindow(60, 180, 400, 470, () => moon(260, 398, 1.15 + .1 * seg(lt, m6.s, m6.s + .2), { look: lt < dr.s ? [.6, .4] : [.9, .3], expr: mexpr, red: red > 0, who: lt >= m6.s ? 'moony' : 'moon', glow: 1 + .6 * red,
        acc: lt >= m3.s && lt < m4.e ? ['tears'] : [] }), { seed: 4 });
      const mm = 58 + seg(lt, 0, CUR.dur);
      bigClock(620, 292, 10, Math.floor(mm));
      const open = easeOut(seg(lt, dr.s, dr.s + .5)) * (1 - easeIn(seg(lt, s5.e + .4, s5.e + 1.0)));
      lobbyDoors(open);
      const walkIn = easeOut(seg(lt, dr.s + .2, d1.s + 1.2));
      if (lt > dr.s + .2) drawChar(drag({ x: lerp(1140, 785, walkIn), walk: walkIn < 1 ? lt * 13 : null, transit: walkIn < 1, look: lt >= d2.s ? [-.9, -.5] : [-.9, 0], expr: lt >= d2.s ? 'happy' : 'chill',
        hold: { l: 'pillow', r: 'thermos' }, arms: { l: 'hold', r: 'hold' } }));
      drawChar(straw({ x: 470, look: lt < s2.s ? [-.9, -.6] : lt >= dr.s ? [.9, 0] : [-.8, -.5], expr: lt < s1.s ? 'dead' : lt < s3.s ? 'sad' : lt < m4.s ? 'sad' : lt < dr.s ? 'neutral' : lt < d2.s ? 'chill' : 'dead',
        arms: { l: 'rest', r: lt >= dr.s ? 'rest' : 'rest' } }));
      if (red > 0) { ctx.fillStyle = `rgba(255,20,40,${.22 * red * (lt >= m6.s ? 1 : .6)})`; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2); }
      night(.18);
    },
    over(lt) {
      const m2 = B('m2'), m6 = B('m6');
      stamp2(Math.min(seg(lt, m2.e + .05, m2.e + .35), 1 - seg(lt, m2.e + 1.5, m2.e + 1.8)), [['ACTUAL CAUSE', 56, -44], ['STAFFING', 104, 42]], undefined, -.03);
      hud(lt, { staffing: seg(lt, m2.e, m2.e + .35) });
    },
  },

  // ---------------------------------------------------------------- end card
  end: {
    cam() {},
    draw(lt) {
      const g = ctx.createLinearGradient(0, 0, 0, STAGE_H); g.addColorStop(0, '#171748'); g.addColorStop(1, '#6a2a7a');
      ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
      stars(1, 21, 90, 1000);
      REG.suppress++;
      const row = [['moon', { x: 108, y: 1300, s: .7, center: true, noLegs: true, noArms: true, noShadow: true, expr: 'smug' }],
        ['straw', { x: 278, y: 1440, s: .74, acc: ['steth'], expr: 'happy' }], ['mango', { x: 448, y: 1440, s: .74, acc: ['badge', 'gaitbelt', 'keys'], badgeText: 'CNA', expr: 'happy' }],
        ['pear', { x: 618, y: 1440, s: .72, acc: ['newsboy', 'suspenders', 'unionpin'], expr: 'happy' }], ['dragon', { x: 788, y: 1440, s: .74, acc: ['sleepmask'], expr: 'chill' }],
        ['sun', { x: 955, y: 1300, s: .7, center: true, noLegs: true, noArms: true, noShadow: true, acc: ['sunglasses'], expr: 'happy' }]];
      row.forEach(([kind, extra], i) => {
        const hop = Math.abs(Math.sin(lt * 5 + i)) * 16, pop = easeBack(seg(lt, .8 + i * .1, 1.1 + i * .1));
        if (pop > 0) drawChar(Object.assign({ kind, expr: 'happy', arms: { l: 'cheer', r: 'wave' }, t: lt + i }, extra, { y: extra.y - hop, s: extra.s * pop }));
      });
      REG.suppress--;
    },
    over(lt) {
      logo2(540, 330, easeBack(seg(lt, 0, .35)) * .74, 1, EP5_LABEL, labelWidth(EP5_LABEL));
      const lines = [['For every nurse the moon got blamed for:', 34, '#fff', .9], ['"It is not the moon. It is the staffing."', 38, '#ffe135', 1.3], ['Take your fifteen. Check the batteries.', 32, '#ffe7c2', 2.0], ['NEXT TIME: The Actual Full Moon', 36, '#ffd1e6', 2.7]];
      lines.forEach(([s, size, c, at], i) => text(s, 540, 612 + i * 56, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 8 }));
      const sc = easeBack(seg(lt, 1.6, 2.0));
      if (sc > 0) {   // the final score, in the style of the counter
        const y = 850, h = 130;
        for (const [x, w, label, big, col, edge] of [[50, 470, 'BLAMED ON THE MOON', '7', '#ffe135', 'rgba(159,179,200,.85)'], [550, 480, 'ACTUAL CAUSE: STAFFING', '7', '#ff5a6a', '#ff5a6a']]) {
          reg('overlay', [x, y, x + w, y + h], { id: 'score:' + label });
          ctx.save(); ctx.globalAlpha *= clamp(sc * 2); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
          ctx.fillStyle = 'rgba(8,12,38,.95)'; rr(x, y, w, h, 26); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 5; rr(x, y, w, h, 26); ctx.stroke();
          text(label, x + 28, y + 36, { size: 22, fill: edge === '#ff5a6a' ? '#ffb3bb' : '#9fb3c8', align: 'left', spacing: 1, maxW: w - 140 });
          text(big, x + w - 40, y + 70, { size: 96, font: 'Bangers', weight: 400, fill: col, align: 'right', spacing: 2 });
          text(edge === '#ff5a6a' ? 'out of 7' : 'in one shift', x + 28, y + 88, { size: 28, fill: '#fff', align: 'left', weight: 800, maxW: w - 140 });
          ctx.restore();
        }
      }
    },
    panelLabel: () => 'THANKS FOR WATCHING',
  },

  // ---------------------------------------------------------------- post-credits: sundowning
  post: {
    cam(lt) { CAM.z = 1 + .03 * seg(lt, 0, CUR.dur); },
    draw(lt) {
      const m1 = B('m1'), s1 = B('s1'), m2 = B('m2'), s2 = B('s2'), m3 = B('m3');
      const p = seg(lt, 0, CUR.dur);
      skyDusk(1 - easeIO(seg(lt, 0, CUR.dur - 1)) * .85, true); cloudStreaks(.4, lt); stars(1 - seg(p, .1, .5), 3, 60, 700);
      const set = easeIn(seg(lt, m3.e - .4, CUR.dur));
      moon(250, lerp(800, 1100, set), 1.1, { look: [.9, 0], noArms: false, arms: { l: 'rest', r: 'rest' }, expr: lt >= m3.s ? 'sour' : lt >= s2.s ? 'shock' : lt >= m2.s ? 'dead' : lt >= m1.s ? 'sad' : 'dead', glow: .7 });
      const rise = easeOut(seg(lt, 0, s1.s + 1));
      sun(810, lerp(1210, 800, rise), 1, { look: [-.9, 0], noArms: false, arms: { l: 'rest', r: lt >= s1.s && lt < s1.e ? 'wave' : 'rest' }, expr: playing(lt, 's1') || playing(lt, 's2') ? 'smug' : 'chill' });
      lotLayer();
    },
    over(lt) {
      const s1 = B('s1');
      hud(lt);
      hudSun(seg(lt, s1.s + 1.0, s1.s + 1.4));
      const f = seg(lt, CUR.dur - .7, CUR.dur);
      if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, STAGE_H); }
    },
  },
};

EPISODES[5] = { num: 5, title: 'Episode 5: Full Moon', TL: window.TIMELINE_EP5, SCENES, layout: 'panel', audio: 'build/ep5/audio.m4a' };
})();
