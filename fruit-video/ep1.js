'use strict';
/* SHIFT HAPPENS, Episode 1: The 3-11 */
(() => {
const GROUND = 1440;
const straw = (o) => Object.assign({ kind: 'straw', s: 1.45, y: GROUND, acc: ['steth', 'badge'] }, o);

const SCENES = {
  title: {
    cam(lt) { const p = easeIO(seg(lt, B('jingle').e - .3, CUR.dur)); CAM.z = 1.02 + .16 * p; CAM.y = 960 - 170 * p; },
    draw(lt) { bgExterior(); exteriorDyn(); },
    over(lt) {
      const j = B('jingle');
      const a = 1 - seg(lt, j.e - .25, j.e + .2);
      if (a > 0) {
        ctx.fillStyle = `rgba(8,6,12,${a})`; ctx.fillRect(0, 0, W, H);
        text('THE FOLLOWING IS BASED ON', 540, 860, { size: 50, alpha: a * seg(lt, .15, .4), weight: 800 });
        text('A TRUE STORY', 540, 950, { size: 96, font: 'Bangers', weight: 400, alpha: a * seg(lt, .3, .55), spacing: 4 });
        text('(every. single. shift.)', 540, 1050, { size: 46, italic: true, fill: '#ffd60a', alpha: a * seg(lt, .8, 1.0) });
      }
      const p = seg(lt, B('n2').e - .05, B('n2').e + .3);
      if (p > 0) {
        ctx.fillStyle = `rgba(10,5,20,${.55 * p})`; ctx.fillRect(0, 0, W, H);
        logo(540, 820, lerp(2.2, 1, easeOut(p)) * (1 + .02 * Math.sin(lt * 6)), clamp(p * 3));
      }
    },
  },

  handoff: {
    cam(lt) { const n = B('n1'), p = easeIO(seg(lt, n.s, n.s + 1.4)); CAM.z = 1 + .02 * lt / CUR.dur + .3 * p; CAM.x = lerp(540, 330, p); CAM.y = lerp(960, 1060, p); },
    draw(lt) {
      bgStation();
      const L = B('lights');
      stationDyn({ clock: '2:59', lights: Math.floor(seg(lt, L.s + .05, L.s + 1.05) * 12) + (lt > L.s + 1.05 ? 12 : 0) });
      const c2 = B('c2'), leave = seg(lt, c2.s + .35, c2.s + .7);
      if (leave < 1) {
        if (leave > 0) speedLines(lerp(760, 1500, easeIn(leave)) - 60, 1150, 500, 1 - leave);
        drawChar({ kind: 'cherry', x: lerp(780, 1600, easeIn(leave)), y: GROUND, s: 1.4, talk: talk('cherry'), expr: 'happy', look: [-.7, 0],
          arms: lt >= c2.s ? { l: 'hold', r: 'wave' } : { l: 'hold', r: 'rest' }, hold: { l: 'purse' }, acc: ['sunglassesHead'], walk: leave > 0 ? lt * 30 : null, rot: leave * .2 });
      }
      // dust puff where she stood
      const dp = seg(lt, c2.s + .35, c2.s + 1.2);
      if (dp > 0 && dp < 1) { ctx.fillStyle = `rgba(230,220,200,${.8 * (1 - dp)})`; for (let i = 0; i < 6; i++) { ell(780 + (i - 2.5) * 50 * (1 + dp), GROUND - 20 - hash(i) * 60 * dp, 40 + 50 * dp, 30 + 30 * dp); ctx.fill(); } }
      // report page floating down
      const fp = seg(lt, c2.s + .5, L.s + 1.2);
      if (fp > 0) {
        ctx.save(); ctx.translate(760 + Math.sin(fp * 9) * 60, lerp(820, 1405, easeOut(fp))); ctx.rotate(fp < 1 ? Math.sin(fp * 9) * .35 : .08);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.fillRect(-90, -60, 180, 120); ctx.strokeRect(-90, -60, 180, 120);
        text('REPORT:', 0, -30, { size: 26, fill: INK }); text('everyone fine :)', 0, 8, { size: 24, fill: '#2a6fdb', italic: true }); text('- Cherry', 30, 40, { size: 18, fill: '#c2003a', italic: true });
        ctx.restore();
      }
      const e = easeOut(seg(lt, 0, .8));
      const shocked = lt > L.s + .15, n1 = lt > B('n1').s;
      drawChar(straw({ x: lerp(-250, 300, e), walk: e < 1 ? lt * 14 : null, talk: talk('straw'),
        expr: n1 ? 'dead' : shocked ? 'panic' : 'neutral', look: shocked && !n1 ? [.6, -.9] : n1 ? [0, .1] : [.7, 0],
        arms: shocked && !n1 ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, shake: shocked && !n1 ? 3 : 0 }));
    },
    over(lt) {
      const n = B('n1');
      factCard(seg(lt, n.s + .1, n.s + .5), 'FIELD NOTES', [['SPECIES', 'Day Shift Cherry'], ['CLOCKED OUT', '2:59:59 PM'], ['CHARTING DONE', '0%'], ['STATUS', 'Already in the car']], 420, '#c2003a');
    },
  },

  ratio: {
    cam(lt) {
      const tw = B('twitch'), n = B('n1');
      const zin = easeOut(seg(lt, tw.s - .1, tw.s + .25)) * (1 - easeIO(seg(lt, n.s - .15, n.s + .35)));
      CAM.z = lerp(1.02, 2.5, zin); CAM.x = lerp(540, 300, zin); CAM.y = lerp(960, 1040, zin);
      CAM.shake = zin * 10 * (lt < tw.e ? 1 : 0);
    },
    draw(lt) {
      bgStation(); stationDyn({ clock: '3:05', lights: 12 });
      const l2 = B('l2'), tw = B('twitch'), n = B('n1');
      const hopeful = lt > B('s1').s && lt < l2.s + .9;
      const hit = lt > l2.s + .9;
      drawChar(straw({ x: 290, talk: talk('straw'), expr: lt > n.s ? 'dead' : hit ? 'shock' : hopeful ? 'hopeful' : 'neutral', look: [.8, 0], twitch: lt > tw.s - .1 && lt < n.s + 1.5,
        arms: hopeful && !hit ? { l: [.5, 1.9], r: [.5, 1.9] } : { l: 'rest', r: 'rest' } }));
      drawChar({ kind: 'lemon', x: 800, y: GROUND, s: 1.45, talk: talk('lemon'), expr: 'sour', look: [-.7, 0], acc: ['readers', 'lanyard'], hold: { l: 'clipboard' }, arms: { l: 'hold', r: 'rest' }, clipText: 'STAFFING' });
    },
    over(lt) {
      const tw = B('twitch'), n = B('n1');
      const p = seg(lt, tw.s, tw.s + .3) * (1 - seg(lt, n.s - .2, n.s + .1));
      if (p > 0) {
        const r = ctx.createRadialGradient(540, 960, 300, 540, 960, 1100); r.addColorStop(0, 'rgba(255,0,40,0)'); r.addColorStop(1, `rgba(255,0,40,${.45 * p * (.8 + .2 * Math.sin(T * 20))})`);
        ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
        slamText(seg(lt, tw.s + .05, tw.s + .4), '1 NURSE', 540, 470, 150, '#ffe135', -.06);
        slamText(seg(lt, tw.s + .35, tw.s + .7), '40 RESIDENTS', 540, 640, 130, '#ff3b55', .04);
      }
      factCard(seg(lt, n.s + .2, n.s + .6), 'SPECIES PROFILE', [['NAME', 'Fragaria nursicus'], ['HABITAT', 'The 3-11'], ['DIET', 'Coffee. Spite.'], ['BATHROOM BREAKS', 'Mythical']], 380);
    },
  },

  blue: {
    cam(lt) { CAM.z = 1.02 + .04 * lt / CUR.dur; const st = B('stamp'); if (lt > st.s) { CAM.shake = 14 * (1 - seg(lt, st.s + .15, st.s + .5)) * (lt > st.s + .15 ? 1 : 0); } },
    draw(lt) {
      bgRoom({ num: 12, wall: ['#e2dcf5', '#c9c0ea'], board: [['NURSE: STRAWBERRY', '#d62828'], ['GOAL: stay blue :)'], ['O2: 2L NC'], ['FAV SONG: Blue (Da Ba Dee)', '#2a9d4a']] });
      windowDyn('day');
      const s1 = B('s1');
      pulseOx(560, 760, 87, lt < B('b1').e);
      drawBedBack(740, 1130);
      drawChar({ kind: 'blue', x: 880, y: 985, s: 1.35, noLegs: true, talk: talk('blue'), expr: lt > B('b1').s ? 'chill' : 'neutral', look: [-.8, 0],
        acc: ['glasses', 'mustache', 'cannula'], browColor: '#f0f0f0', browW: 12, arms: lt > B('b1').s && lt < B('b1').e + .2 ? { l: [1.3, -1.3 + .3 * Math.sin(lt * 5)], r: 'rest' } : { l: 'rest', r: 'rest' } });
      drawBedFront(740, 1130, '#9fb4ff', 1060);
      const e = easeOut(seg(lt, 0, .5));
      const panic = lt < B('b1').s + .6;
      drawChar(straw({ x: lerp(-250, 250, e), walk: e < 1 ? lt * 18 : null, talk: talk('straw'), expr: panic ? 'panic' : lt > B('n1').s ? 'neutral' : 'dead',
        look: [.8, 0], arms: panic ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, shake: panic && lt > s1.s ? 4 : 0 }));
    },
    over(lt) {
      const st = B('stamp');
      stamp(seg(lt, st.s + .15, st.s + .5), [['BASELINE:', 96, -36], ['BLUE', 118, 58]], 540, 640, -.14);
    },
  },

  cran: {
    cam(lt) { CAM.z = 1.02 + .05 * lt / CUR.dur; CAM.x = 560; },
    draw(lt) {
      bgRoom({ num: 7, wall: ['#ffe3d3', '#f5c9b0'], board: [['NURSE: STRAWBERRY', '#d62828'], ['TODAY IS: FRIDAY'], ['YEAR: 2026 (not 1962)'], ['GOAL: stay in bed', '#2a9d4a']] });
      windowDyn('day');
      drawBedBack(740, 1130);
      const c1 = B('c1'), frantic = lt >= c1.s - .2 && lt < c1.e + .3;
      drawChar({ kind: 'cran', x: 870, y: 990, s: 1.35, noLegs: true, talk: talk('cran'), expr: frantic ? 'panic' : 'neutral', look: [-.6, -.2],
        acc: ['curlers', 'glasses', 'pearls'], hold: { r: 'purse' }, arms: frantic ? { l: 'flail', r: 'hold' } : { l: 'rest', r: 'hold' }, rot: frantic ? Math.sin(lt * 14) * .08 : 0, shake: frantic ? 3 : 0 });
      drawBedFront(740, 1130, '#ffb3c4', 1070);
      // thought bubble: the factory, 1962
      const tb = seg(lt, c1.s + .3, c1.s + .6) * (1 - seg(lt, B('s1').e, B('s1').e + .3));
      if (tb > 0) {
        ctx.save(); ctx.translate(760, 620); ctx.scale(easeBack(tb), easeBack(tb));
        ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
        for (const [x, y, r] of [[0, 0, 150], [-110, 30, 90], [110, 30, 90], [-60, -80, 90], [70, -80, 90]]) { ell(x, y, r, r * .8); ctx.fill(); }
        ell(0, 0, 150, 120); ctx.stroke(); ctx.fill();
        ctx.fillStyle = '#fff'; ell(80, 170, 26, 22); ctx.fill(); ctx.stroke(); ell(110, 230, 14, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8c5a3c'; ctx.fillRect(-100, -10, 170, 80); ctx.fillRect(40, -80, 26, 80);
        ctx.fillStyle = '#ccc'; ell(56, -100 - (lt % 1) * 20, 22, 16); ctx.fill();
        ctx.fillStyle = '#ffe9a8'; for (let i = 0; i < 3; i++) ctx.fillRect(-84 + i * 50, 10, 30, 24);
        text('1962', -10, -70, { size: 54, font: 'Bangers', weight: 400, fill: '#d62828' });
        ctx.restore();
      }
      const s1 = B('s1');
      drawChar(straw({ x: 250, talk: talk('straw'), expr: lt > c1.s + .8 ? 'dead' : 'neutral', look: [.8, -.1],
        hold: lt > s1.s - .1 ? { r: 'urine' } : {}, arms: lt > s1.s - .1 ? { l: 'rest', r: 'offer' } : { l: 'rest', r: 'rest' } }));
    },
    over(lt) {
      const n = B('n1');
      banner(seg(lt, n.e - .5, n.e - .2), "IT'S ALWAYS A UTI.", 480, '#ffe135', '#15111a', 96);
    },
  },

  prune: {
    cam(lt) {
      const st = B('stare'), p2 = B('p2'), h = B('hold');
      const zin = easeIO(seg(lt, st.s, p2.s + .3)) * (1 - easeIO(seg(lt, h.e - .2, h.e + .4)));
      CAM.z = lerp(1.02, 1.55, zin); CAM.x = lerp(560, 720, zin); CAM.y = lerp(960, 900, zin);
    },
    draw(lt) {
      bgRoom({ num: 3, wall: ['#dff1dc', '#bfe0b8'], board: [['NURSE: STRAWBERRY', '#d62828'], ['GOAL: POOP', '#d62828'], ['LAST BM: 6 DAYS AGO'], ['BOWEL PROTOCOL: ON']] });
      windowDyn('golden');
      drawBedBack(740, 1130);
      const p2 = B('p2');
      const e = lt > B('stare').s && lt < p2.e + .2 ? 'shock' : lt >= p2.e + .2 ? 'sad' : 'grumpy';
      drawChar({ kind: 'prune', x: 870, y: 985, s: 1.35, noLegs: true, talk: talk('prune'), expr: e, look: lt > B('s2').s ? [-.9, .3] : [-.7, 0],
        browColor: '#f2f2f2', browW: 13, arms: lt > B('p1').s && lt < B('p1').e ? { l: 'flail', r: 'rest' } : { l: 'rest', r: 'rest' } });
      drawBedFront(740, 1130, '#c7a8e8', 1070);
      const s2 = B('s2'), offering = lt > s2.s - .1;
      drawChar(straw({ x: 280, talk: talk('straw'), expr: lt > p2.e ? 'sad' : offering ? 'happy' : 'neutral', look: [.8, 0],
        hold: offering ? { r: 'carton' } : { l: 'clipboard' }, arms: offering ? { l: 'rest', r: lt > p2.e + .3 ? 'hold' : 'offer' } : { l: 'hold', r: 'rest' }, clipText: 'BM LOG' }));
    },
    over(lt) {
      const n = B('n1'), p = seg(lt, n.s - .1, n.s + .3);
      if (p > 0) {
        ctx.save(); ctx.translate(540, 520); const s = easeBack(p); ctx.scale(s, s);
        ctx.fillStyle = '#2b2233'; ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 14; rr(-260, -250, 520, 520, 16); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#fff6c2'; ctx.lineWidth = 8; ell(0, -150, 90, 22); ctx.stroke();
        drawChar({ kind: 'prune', x: 0, y: -20, s: .95, center: true, noLegs: true, expr: 'happy', acc: ['sunglasses'], arms: { l: 'thumb', r: 'rest' }, t: lt });
        text('GARY', 0, 150, { size: 72, font: 'Bangers', weight: 400, fill: '#fff', spacing: 6 });
        text('Loving cousin. Great with fiber.', 0, 215, { size: 28, fill: '#e6d7ff', italic: true, maxW: 470 });
        for (const x of [-200, 200]) { ctx.fillStyle = '#fff4d6'; ctx.fillRect(x - 12, 170, 24, 70); const f = 1 + .15 * Math.sin(T * 20 + x); ctx.fillStyle = '#ffb347'; ell(x, 158, 11 * f, 20 * f); ctx.fill(); ctx.fillStyle = '#fff3a0'; ell(x, 162, 5, 10); ctx.fill(); }
        ctx.restore();
      }
    },
  },

  gfruit: {
    cam(lt) { const g1 = B('g1'); CAM.z = 1.02 + .18 * easeIO(seg(lt, B('enter').e - .3, g1.e)) - .16 * easeIO(seg(lt, B('p1').s, B('p1').s + .2)); CAM.x = lerp(540, 700, easeIO(seg(lt, B('enter').e - .3, g1.e)) * (1 - seg(lt, B('p1').s, B('p1').s + .2))); const b = seg(lt, 1.0 + B('enter').s, 1.4 + B('enter').s); CAM.shake = b > 0 && b < 1 ? 16 * (1 - b) : 0; },
    draw(lt) {
      bgMed();
      const en = B('enter'), open = easeIO(seg(lt, en.s + .1, en.s + .9)), reveal = seg(lt, en.s + 1.0, en.s + 1.25);
      medDoor(open, open * (1 - .4 * reveal));
      if (open > .2) drawChar({ kind: 'gfruit', x: 820, y: 1275, s: 1.15, talk: talk('gfruit'), expr: 'smug', look: [-.7, .1], acc: ['sunglasses', 'chain', 'toothpick'],
        arms: { l: lt > B('g1').s ? [1.2, -1.9] : 'rest', r: 'hips' }, filter: reveal < 1 ? `brightness(${lerp(.05, 1, reveal)})` : null, alpha: clamp((open - .2) * 3) });
      medCart(330, 1200);
      const p1 = B('p1'), p2 = B('p2'), run = seg(lt, p2.s + .15, p2.s + 1.1);
      const scared = lt > en.s + 1.0;
      [[480, 'SIMVASTATIN', 'pill1', 0], [660, 'ATORVASTATIN', 'pill2', .08]].forEach(([x0, label, who, d]) => {
        const r = seg(lt, p2.s + .1 + d, p2.s + 1.0 + d);
        const x = lerp(x0, -300, easeIn(r)), y = 1182 + (r > .45 ? Math.pow((r - .45) * 3, 2) * 200 : 0) - Math.abs(Math.sin(lt * 25)) * 12 * (r > 0 ? 1 : 0);
        drawChar({ kind: 'pill', x, y, s: 1.2, label, talk: talk(who), expr: scared ? 'panic' : 'neutral', look: scared ? [.8, 0] : [-.5, 0], shake: scared && r === 0 ? 5 : 0,
          walk: r > 0 ? lt * 30 : null, arms: r > 0 ? { l: 'run', r: 'run' } : scared ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, flip: false });
      });
      if (run > 0 && run < 1) speedLines(lerp(700, 0, run) + 300, 1150, 400, 1 - run);
      drawChar(straw({ x: 190, talk: talk('straw'), expr: scared ? 'angry' : 'neutral', look: scared ? [.9, 0] : [.5, .4], hold: scared ? {} : { r: 'medcup' }, arms: scared ? { l: 'rest', r: 'stop' } : { l: 'rest', r: 'offer' } }));
    },
    over(lt) {
      const n = B('n1'), p = seg(lt, n.s + .1, n.s + .45);
      if (p > 0) {
        ctx.save(); ctx.translate(lerp(1500, 560, easeBack(p)), 560); ctx.rotate(.05);
        ctx.fillStyle = '#f3e3c3'; ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8; rr(-280, -330, 560, 640, 10); ctx.fill(); ctx.stroke();
        text('WANTED', 0, -260, { size: 110, font: 'Bangers', weight: 400, fill: '#6b1a00', spacing: 8 });
        ctx.fillStyle = '#d9c7a3'; ctx.fillRect(-170, -190, 340, 280);
        drawChar({ kind: 'gfruit', x: 0, y: -50, s: .72, center: true, noLegs: true, expr: 'smug', acc: ['sunglasses'], noArms: true, t: lt });
        text('GRAPEFRUIT', 0, 130, { size: 56, font: 'Bangers', weight: 400, fill: '#6b1a00', spacing: 4 });
        text('CRIMES: CYP3A4 inhibition,', 0, 190, { size: 28, fill: '#3a2410' });
        text('statin toxicity, ruining your MAR', 0, 228, { size: 28, fill: '#3a2410' });
        text('LAST SEEN: breakfast tray', 0, 275, { size: 26, fill: '#6b1a00', italic: true });
        ctx.restore();
      }
    },
  },

  raisin: {
    cam(lt) { CAM.z = 1.02 + .05 * lt / CUR.dur; const L = B('later'); const sh = seg(lt, L.s + .75, L.s + 1.35); CAM.shake = sh > 0 && sh < 1 ? 8 : 0; },
    draw(lt) {
      const L = B('later'), after = lt > L.s + .35;
      bgRoom({ num: 9, wall: ['#ece0f6', '#d3bfe6'], board: [['NURSE: STRAWBERRY', '#d62828'], ['FLUIDS: ENCOURAGE!!!', '#d62828'], ['INTAKE: 0 mL'], ['GOAL: hydrate']] });
      windowDyn(after ? 'night' : 'dusk');
      drawBedBack(740, 1130);
      const sh = seg(lt, L.s + .75, L.s + 1.35);
      const r1 = B('r1');
      if (sh < .5) {
        const k = sh * 2;
        drawChar({ kind: 'grape', x: 870, y: 990 + k * 40, s: 1.35 * (1 - .45 * k), noLegs: true, talk: talk('grape'), expr: k > 0 ? 'shock' : after ? 'neutral' : 'happy', look: [-.7, 0],
          acc: ['bun', 'glasses'], colors: k > 0 ? [mixColor('#d9adef', '#a0704c', k), mixColor('#8e44ad', '#5a3219', k), mixColor('#3a1150', '#24100a', k)] : null,
          arms: lt > B('g1').s && lt < B('g1').e + .2 ? { l: 'stop', r: 'rest' } : { l: 'rest', r: 'rest' }, shake: k > 0 ? 6 : 0 });
      } else {
        const k = (sh - .5) * 2;
        drawChar({ kind: 'raisin', x: 870, y: 1040, s: 1.35 * lerp(.85, 1, easeBack(k)), noLegs: true, talk: talk('raisin'), expr: 'weak', look: [-.7, 0], acc: ['bun', 'glasses'],
          arms: lt > r1.s ? { l: 'reach', r: 'rest' } : { l: 'rest', r: 'rest' }, shake: k < 1 ? 5 : 0 });
      }
      drawBedFront(740, 1130, '#b7a3e8', 1080);
      overbedTable(560, 1180, true);
      const s1 = B('s1');
      drawChar(straw({ x: 250, talk: talk('straw'), expr: after ? 'dead' : 'happy', look: [.8, 0], hold: { r: 'cup' }, arms: { l: 'rest', r: lt > s1.s - .1 && !after ? 'offer' : 'hold' } }));
    },
    over(lt) {
      const L = B('later');
      timeCard(seg(lt, L.s, L.s + .75), '2 HOURS LATER', '#7a3fb0');
      const n = B('n1');
      factCard(seg(lt, n.s + .05, n.s + .45), 'NURSING DIAGNOSIS', [['DX', 'Deficient Fluid Volume'], ['R/T', '"I had a sip on Tuesday"'], ['AEB', 'Literally a raisin'], ['GOAL', 'Grape again by 0700']], 380, '#7a3fb0');
    },
  },

  banana: {
    cam(lt) { CAM.z = 1.02; const sl = B('slip'); const th = seg(lt, sl.s + 1.15, sl.s + 1.6); CAM.shake = th > 0 && th < 1 ? 22 * (1 - th) : 0; const n = B('n1'); const pe = seg(lt, n.e - .1, n.e + .4); if (pe > 0 && pe < 1) CAM.shake = 16 * (1 - pe); },
    draw(lt) {
      bgRoom({ num: 4, wall: ['#fff4cf', '#f6e3a3'], sign: true, board: [['NURSE: STRAWBERRY', '#d62828'], ['CALL, DON\'T FALL!!', '#d62828'], ['FALLS THIS WEEK: III'], ['BED ALARM: ON']] });
      windowDyn('night');
      drawBedBack(740, 1130);
      drawBedFront(740, 1130, '#ffe08a', 1100, lt > B('slip').s + 1.2);
      const sl = B('slip');
      // peel on the floor
      const peelX = 560 + easeOut(seg(lt, sl.s + .45, sl.s + 1.2)) * 380;
      ctx.save(); ctx.translate(peelX, 1440); ctx.rotate(seg(lt, sl.s + .45, sl.s + 1.2) * 4);
      ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      for (const a of [-1.2, 0, 1.2]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -70, 14, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#6b4a22'; ell(0, 0, 12, 8); ctx.fill();
      ctx.restore();
      // Mr. Banana: walk, slip, flip, land
      const walkP = seg(lt, sl.s, sl.s + .45), air = seg(lt, sl.s + .45, sl.s + 1.15);
      if (air <= 0) {
        drawChar({ kind: 'banana', x: lerp(980, 580, walkP), y: GROUND, s: 1.25, walk: lt * 14, expr: 'happy', look: [-.8, 0], arms: { l: 'rest', r: 'rest' }, flip: true });
      } else if (air < 1) {
        const x = lerp(580, 470, air), y = lerp(GROUND - 250, GROUND - 60, air) - Math.sin(air * PI) * 380;
        drawChar({ kind: 'banana', x, y, s: 1.25, center: true, rot: -air * (TAU + PI / 2), expr: 'panic', arms: { l: 'flail', r: 'flail' }, legs: 'kick', flip: true });
      } else {
        const n = B('n1');
        drawChar({ kind: 'banana', x: 520, y: GROUND - 75, s: 1.25, center: true, rot: -PI / 2, talk: talk('banana'), expr: lt < B('b1').s ? 'dead' : 'happy', look: [0, -.8], legs: 'splay', flip: true,
          arms: lt > B('b1').s && lt < B('b1').e ? { l: 'thumb', r: 'rest' } : { l: 'rest', r: 'rest' }, noShadow: true });
        // stars circling
        const sp = 1 - seg(lt, B('b1').s, B('b1').e);
        if (sp > 0) for (let i = 0; i < 4; i++) { const a = T * 5 + i * TAU / 4; ctx.save(); ctx.translate(380 + Math.cos(a) * 80, 1310 + Math.sin(a) * 22); ctx.globalAlpha = sp; ctx.fillStyle = '#ffe135'; ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 7 : 16, b = j * PI / 5; ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r); } ctx.fill(); ctx.restore(); }
        // the incident report
        const pe = seg(lt, n.e - .25, n.e + .05);
        if (pe > 0) {
          const y = lerp(-600, 0, easeIn(pe));
          ctx.save(); ctx.translate(820, 1450 + y);
          for (let i = 0; i < 26; i++) { ctx.fillStyle = i % 2 ? '#fdfdfd' : '#f0f0f0'; ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.fillRect(-120 + Math.sin(i * 2.1) * 6, -i * 26 - 26, 240, 26); ctx.strokeRect(-120 + Math.sin(i * 2.1) * 6, -i * 26 - 26, 240, 26); }
          ctx.fillStyle = '#fff'; ctx.fillRect(-130, -720, 260, 40);
          text('INCIDENT REPORT', 0, -700, { size: 26, fill: '#d62828' });
          text('(page 1 of 17)', 0, -660, { size: 20, fill: INK, italic: true });
          ctx.restore();
        }
      }
      const en = easeOut(seg(lt, sl.s + 1.3, sl.s + 1.9));
      if (en > 0) drawChar(straw({ x: lerp(-250, 190, en), walk: en < 1 ? lt * 16 : null, talk: talk('straw'), expr: 'dead', look: [.7, .8], arms: { l: 'hips', r: 'hips' } }));
    },
    over(lt) {},
  },

  doctor: {
    cam(lt) { CAM.z = 1.04; CAM.x = 500; },
    draw(lt) {
      bgStation();
      const n = B('n1');
      stationDyn({ clock: '9:15', lights: 9, spin: easeIO(seg(lt, n.s + .6, n.e)) });
      // coiled cord
      ctx.strokeStyle = '#d8cfbd'; ctx.lineWidth = 5; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40; ctx.lineTo(lerp(300, 420, u) + Math.sin(u * 60) * 8, lerp(1030, 1010, u) + Math.sin(u * PI) * 60 + Math.cos(u * 60) * 8); }
      ctx.stroke();
      const r = B('ring'), a1 = B('a1');
      drawChar(straw({ x: 330, talk: talk('straw'), expr: lt < a1.s ? 'sour' : lt < B('beat').s ? 'dead' : 'dead', look: lt > B('beat').s ? [0, .15] : [.4, -.3], hold: { r: 'handset' }, arms: { l: 'hips', r: 'phone' }, legs: lt < a1.s ? 'tap' : null }));
      if (lt < a1.s) text('RING... RING...', 520, 800 + Math.sin(lt * 10) * 4, { size: 48, font: 'Bangers', weight: 400, fill: '#fff', lw: 10, alpha: seg(lt, .1, .3) });
    },
    over(lt) {
      const a1 = B('a1'), p = seg(lt, a1.s - .3, a1.s + .1) * (1 - seg(lt, a1.e + .5, a1.e + .8));
      if (p > 0) {
        ctx.save(); ctx.translate(lerp(1400, 770, easeBack(p)), 700); ctx.rotate(.04);
        ctx.fillStyle = '#111'; rr(-230, -420, 460, 840, 60); ctx.fill();
        ctx.fillStyle = '#f2f2f7'; rr(-210, -400, 420, 800, 44); ctx.fill();
        text('Voicemail', 0, -340, { size: 36, fill: '#111' });
        // beach photo of Dr. Apple
        ctx.save(); rr(-170, -300, 340, 340, 28); ctx.clip();
        const g = ctx.createLinearGradient(0, -300, 0, 40); g.addColorStop(0, '#46b6ff'); g.addColorStop(.6, '#9fe1ff'); g.addColorStop(.61, '#2a9dd8'); g.addColorStop(.75, '#f3d9a4'); g.addColorStop(1, '#e8c98a');
        ctx.fillStyle = g; ctx.fillRect(-170, -300, 340, 340);
        ctx.fillStyle = '#fff3a0'; ell(110, -240, 34, 34); ctx.fill();
        ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-140, 40); ctx.quadraticCurveTo(-120, -120, -90, -200); ctx.stroke();
        for (let i = 0; i < 5; i++) leaf(-90, -200, -1.8 + i * .75, 110, 22, '#3fae3a');
        drawChar({ kind: 'apple', x: 20, y: -90, s: .88, center: true, noLegs: true, talk: talk('apple'), expr: 'happy', acc: ['sunglasses', 'headmirror'], arms: { l: 'thumb', r: 'rest' }, t: lt });
        // cocktail
        ctx.fillStyle = 'rgba(255,120,160,.9)'; ctx.beginPath(); ctx.moveTo(90, -40); ctx.lineTo(150, -40); ctx.lineTo(120, 0); ctx.fill(); ctx.fillStyle = '#ccc'; ctx.fillRect(117, 0, 6, 30);
        ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(100, -40); ctx.lineTo(145, -75); ctx.lineTo(150, -40); ctx.fill();
        ctx.restore();
        text('Dr. Apple', 0, 90, { size: 44, fill: '#111' });
        text('Away. Always away.', 0, 136, { size: 26, fill: '#777', italic: true });
        // waveform
        for (let i = 0; i < 26; i++) { const v = talk('apple') * (.4 + .6 * Math.abs(Math.sin(i * 1.7 + T * 12))); ctx.fillStyle = '#2a6fdb'; rr(-180 + i * 14, 220 - 6 - v * 50, 8, 12 + v * 100, 4); ctx.fill(); }
        ctx.fillStyle = '#e53935'; ell(0, 340, 36, 36); ctx.fill(); ctx.fillStyle = '#fff'; rr(-14, 334, 28, 12, 3); ctx.fill();
        ctx.restore();
      }
      const n = B('n1'), q = seg(lt, n.s + .5, n.s + .9);
      if (q > 0) {
        ctx.save(); ctx.translate(540, lerp(-200, 330, easeBack(q)));
        ctx.fillStyle = 'rgba(245,245,250,.97)'; rr(-470, -80, 940, 160, 34); ctx.fill();
        ctx.fillStyle = '#e53935'; rr(-440, -52, 104, 104, 24); ctx.fill();
        drawChar({ kind: 'apple', x: -388, y: 0, s: .32, center: true, noLegs: true, noArms: true, expr: 'smug', t: lt });
        text('DR. APPLE', -310, -30, { size: 34, fill: '#111', align: 'left' });
        text('Returning your call at 3:00 AM', -310, 18, { size: 30, fill: '#444', align: 'left', weight: 700 });
        ctx.restore();
      }
    },
  },

  pine: {
    cam(lt) {
      const st = B('stomp'); const n = B('n1');
      let sh = 0; for (const d of [0, .26, .52]) { const q = seg(lt, st.s + d, st.s + d + .2); if (q > 0 && q < 1) sh = Math.max(sh, 16 * (1 - q)); }
      CAM.shake = sh;
      const z = easeIO(seg(lt, n.s, n.s + .8));
      CAM.z = lerp(1.02, 1.7, z); CAM.x = lerp(540, 800, z); CAM.y = lerp(960, 900, z);
    },
    draw(lt) {
      bgHall(false); hallLights([[200, true], [860, false]]);
      const st = B('stomp');
      const inP = seg(lt, st.s, st.s + .7);
      const step = Math.floor(inP * 3);
      const x = lerp(1350, 800, easeOut(inP));
      const p1 = B('p1'), p2 = B('p2'), n = B('n1');
      drawChar({ kind: 'pine', x, y: GROUND, s: 1.4, talk: talk('pine'), expr: 'angry', look: [-.8, 0], acc: ['sunglassesHead'], hold: { r: 'purse' }, walk: inP < 1 ? step * PI + inP * 9 : null,
        arms: lt > p1.s && lt < p2.s ? { l: 'point', r: 'hold' } : lt >= p2.s ? { l: 'hips', r: 'hold' } : { l: 'rest', r: 'hold' }, flip: true, shake: lt > p1.s && lt < p1.e ? 2 : 0 });
      drawChar(straw({ x: 270, talk: talk('straw'), expr: lt > p1.s ? 'dead' : 'neutral', look: [.8, 0], arms: lt > B('s1').s && lt < B('s1').e + .3 ? { l: 'shrug', r: 'shrug' } : { l: 'rest', r: 'rest' } }));
      // documentary callout on the crown
      const c = seg(lt, n.s + .6, n.s + 1.0);
      if (c > 0) {
        ctx.save(); ctx.strokeStyle = '#ffe135'; ctx.lineWidth = 8; ctx.setLineDash([22, 12]); ctx.lineDashOffset = -T * 60;
        ctx.beginPath(); ctx.ellipse(835, 830, 200 * easeBack(c), 150 * easeBack(c), -.2, 0, TAU); ctx.stroke(); ctx.restore();
      }
    },
    over(lt) {
      const n = B('n1'), c = seg(lt, n.s + 1.2, n.s + 1.6);
      factCard(c, 'RARE FORMATION', [['LATIN NAME', 'Ananas managerus'], ['SEEN', 'Every visiting hour'], ['THREAT LEVEL', 'State survey']], 300, '#f4a300');
    },
  },

  coco: {
    cam(lt) {
      const sc = B('scream'); const z = easeOut(seg(lt, sc.s, sc.s + .25));
      CAM.z = lerp(1.02, 2.6, z); CAM.x = lerp(540, 300, z); CAM.y = lerp(960, 1040, z); CAM.shake = z * 9;
    },
    draw(lt) {
      bgStation();
      stationDyn({ clock: '10:55', lights: 12 });
      ctx.fillStyle = 'rgba(20,20,60,.28)'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
      const ro = B('roll'), c1 = B('c1'), sc = B('scream');
      if (lt > ro.s) { const on = Math.sin(T * 14) > 0; ctx.fillStyle = on ? 'rgba(255,30,60,.16)' : 'rgba(40,90,255,.16)'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2); }
      const rp = easeOut(seg(lt, ro.s + .1, ro.s + 1.1));
      const gx = lerp(1450, 800, rp);
      // stretcher
      ctx.fillStyle = '#6d747e'; ctx.fillRect(gx - 200, 1300, 400, 18); for (const dx of [-170, 150]) { ctx.fillRect(gx + dx, 1318, 14, 90); ctx.fillStyle = '#222'; ell(gx + dx + 7, 1412, 18, 18); ctx.fill(); ctx.fillStyle = '#6d747e'; }
      ctx.fillStyle = '#e9edf2'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(gx - 220, 1250, 440, 56, 14); ctx.fill(); ctx.stroke();
      drawChar({ kind: 'coco', x: gx + 20, y: 1150, s: 1.25, noLegs: true, talk: talk('coco'), expr: 'chill', look: [-.8, 0], acc: ['sunglasses', 'lei'],
        hold: lt > c1.s + .6 ? { l: 'sticky' } : {}, arms: lt > c1.s + .6 ? { l: 'offer', r: [.9, -1.8] } : { l: 'rest', r: [.9, -1.8] } });
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(gx - 200, 1230, 300, 40, 12); ctx.fill(); ctx.stroke();
      const scared = lt > sc.s;
      drawChar(straw({ x: 290, talk: talk('straw'), expr: scared ? 'panic' : lt > ro.s + .3 ? 'shock' : 'hopeful', look: scared ? [0, 0] : lt > ro.s + .3 ? [.8, 0] : [.3, -.9], acc: ['steth', 'badge', 'bag'], twitch: scared,
        arms: scared ? { l: [.2, 0], r: [.2, 0] } : { l: 'rest', r: 'rest' }, shake: scared ? 4 : 0 }));
    },
    over(lt) {
      const sc = B('scream'), n = B('n1');
      // freedom progress bar
      const a = seg(lt, n.s, n.s + .3) * (1 - seg(lt, sc.s + 1.2, sc.s + 1.5));
      if (a > 0) {
        const pct = lt < sc.s ? lerp(.9, .98, seg(lt, n.s, n.e)) : lerp(.98, 0, easeOut(seg(lt, sc.s, sc.s + .4)));
        ctx.save(); ctx.globalAlpha = a; ctx.translate(540, 420);
        ctx.fillStyle = 'rgba(12,10,18,.85)'; rr(-440, -70, 880, 150, 24); ctx.fill();
        text(lt < sc.s ? 'FREEDOM LOADING...' : 'ADMISSION: 3 HRS OF CHARTING', 0, -30, { size: 38, fill: lt < sc.s ? '#7dff9a' : '#ff3b55', font: 'Bangers', weight: 400, spacing: 2 });
        ctx.fillStyle = '#333'; rr(-400, 10, 800, 44, 22); ctx.fill();
        ctx.fillStyle = lt < sc.s ? '#2ecc71' : '#e8193a'; rr(-400, 10, Math.max(44, 800 * pct), 44, 22); ctx.fill();
        text(Math.round(pct * 100) + '%', 0, 33, { size: 30, fill: '#fff', lw: 6 });
        ctx.restore();
      }
      if (lt > sc.s + .15) {
        const q = seg(lt, sc.s + .15, sc.s + .45);
        ctx.save(); ctx.translate(540 + vnoise(T * 40) * 10, 1500 + vnoise(T * 37) * 10); ctx.rotate(-.05);
        text('*internal', 0, -70, { size: 110 * easeBack(q), font: 'Bangers', weight: 400, fill: '#fff', lw: 16, spacing: 3 });
        text('screaming*', 0, 60, { size: 130 * easeBack(q), font: 'Bangers', weight: 400, fill: '#ff3b55', lw: 16, spacing: 3 });
        ctx.restore();
      }
    },
  },

  jam: {
    cam(lt) { const n = B('n1'); const z = easeIO(seg(lt, B('melt').s, B('melt').s + 1.5)) * (1 - easeIO(seg(lt, n.s - .3, n.s + .3))); CAM.z = 1.02 + .35 * z; CAM.x = lerp(540, 500, z); CAM.y = lerp(960, 1180, z); },
    draw(lt) {
      bgHall(true);
      const w = B('walk'), l1 = B('l1'), m = B('melt'), n = B('n1');
      const block = seg(lt, l1.s - .3, l1.s - .05);
      exitDyn(seg(lt, w.s, w.s + .8) * (1 - block));
      const lx = lerp(1350, 820, easeOut(block));
      const wp = seg(lt, w.s, w.e);
      const sx = lerp(100, 400, easeIO(wp));
      const mp = seg(lt, m.s + .35, m.s + 1.4);
      if (mp <= 0) {
        drawChar(straw({ x: sx, walk: wp > 0 && wp < 1 && block === 0 ? lt * 13 : null, talk: talk('straw'), expr: block > 0 ? 'shock' : 'happy', look: block > 0 ? [.8, -.1] : [.8, -.3],
          acc: ['steth', 'badge', 'bag'], arms: block > 0 ? { l: 'down', r: 'down' } : { l: 'rest', r: 'rest' } }));
      } else if (lt < n.s - .1) {
        // melting into jam
        const k = easeIn(mp);
        const puddle = seg(mp, .55, 1);
        if (puddle > 0) {
          ctx.save(); ctx.translate(sx, GROUND - 10);
          const pw = lerp(120, 330, easeOut(puddle));
          ctx.fillStyle = '#c4001f'; ctx.strokeStyle = '#5a0010'; ctx.lineWidth = 5;
          ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = 1 + .08 * Math.sin(a * 6 + lt); ctx.lineTo(Math.cos(a) * pw * r, Math.sin(a) * pw * .22 * r); } ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-pw * .3, -pw * .06, pw * .25, pw * .04); ctx.fill();
          ctx.fillStyle = '#ffe58a'; for (let i = 0; i < 16; i++) { ell((hash(i) - .5) * pw * 1.6, (hash(i + 3) - .5) * pw * .3, 4, 6); ctx.fill(); }
          ctx.restore();
        }
        if (puddle < 1) drawChar(straw({ x: sx, s: 1.45, expr: 'dead', look: [0, .2], acc: ['steth', 'badge', 'bag'], sy: 1 - .8 * k, sx: 1 + .8 * k, noLegs: k > .3, y: GROUND - (k > .3 ? 150 * (1 - k) : 0), alpha: 1 - puddle, arms: { l: 'down', r: 'down' } }));
        if (puddle > .4) { // eyes floating in the puddle
          ctx.save(); ctx.translate(sx, GROUND - 22);
          for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(s * 34, 0, 22, 18); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ell(s * 34, 3, 9, 9); ctx.fill(); ctx.fillStyle = '#c4001f'; ctx.fillRect(s * 34 - 23, -20, 46, 16); }
          ctx.restore();
        }
      } else {
        // the jar
        const jp = easeBack(seg(lt, n.s - .1, n.s + .3));
        ctx.save(); ctx.translate(sx, GROUND); ctx.scale(jp, jp);
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 0, 150, 18); ctx.fill();
        ctx.fillStyle = 'rgba(210,235,255,.5)'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-140, -380, 280, 380, 40); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b3001f'; rr(-128, -330, 256, 320, 30); ctx.fill();
        ctx.fillStyle = '#ffe58a'; for (let i = 0; i < 20; i++) { ell((hash(i) - .5) * 220, -40 - hash(i + 5) * 270, 4, 6); ctx.fill(); }
        ctx.fillStyle = '#e8c07a'; ctx.strokeStyle = INK; rr(-155, -420, 310, 56, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff6e0'; rr(-120, -250, 240, 140, 12); ctx.fill(); ctx.stroke();
        text('STRAWBERRY', 0, -222, { size: 30, fill: '#b3001f', font: 'Bangers', weight: 400, spacing: 2 });
        text('JAM', 0, -180, { size: 46, fill: '#b3001f', font: 'Bangers', weight: 400, spacing: 4 });
        text('fresh off the 3-11', 0, -136, { size: 20, fill: INK, italic: true });
        const blink = (lt % 2.2) < .12;
        for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(s * 36, -300, 20, blink ? 3 : 22); ctx.fill(); ctx.stroke(); if (!blink) { ctx.fillStyle = INK; ell(s * 36, -296, 9, 9); ctx.fill(); } }
        ctx.restore();
      }
      if (block > 0) drawChar({ kind: 'lemon', x: lx, y: GROUND, s: 1.45, talk: talk('lemon'), expr: lt > n.s ? 'neutral' : 'sour', look: lt > m.s + .5 ? [-.6, .8] : [-.8, 0], acc: ['readers', 'lanyard'],
        hold: { l: 'clipboard' }, arms: lt > n.s ? { l: 'hold', r: 'shrug' } : { l: 'hold', r: 'rest' }, clipText: 'OT SIGN-UP' });
    },
    over(lt) {},
  },

  end: {
    cam() {},
    draw(lt) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b0f3a'); g.addColorStop(1, '#4a0d3d');
      ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
      for (let i = 0; i < 60; i++) { const x = (hash(i) * W + Math.sin(T + i) * 30), y = ((hash(i + 9) * H + lt * (120 + hash(i + 4) * 200)) % (H + 100)) - 50; ctx.save(); ctx.translate(x, y); ctx.rotate(T * 2 + i); ctx.fillStyle = ['#ffe135', '#ff3b55', '#5b6cff', '#2ecc71', '#ff9f1c'][i % 5]; ctx.fillRect(-8, -4, 16, 8); ctx.restore(); }
      const cast = [['cherry', {}], ['lemon', { acc: ['readers'] }], ['blue', { acc: ['glasses', 'mustache'], browColor: '#eee' }], ['cran', { acc: ['curlers'] }], ['prune', { browColor: '#eee' }], ['gfruit', { acc: ['sunglasses'] }],
        ['raisin', { acc: ['bun', 'glasses'] }], ['banana', {}], ['pine', { acc: ['sunglassesHead'] }], ['coco', { acc: ['sunglasses', 'lei'] }], ['apple', { acc: ['headmirror'] }], ['pill', { label: 'STATIN' }]];
      cast.forEach(([kind, extra], i) => {
        const row = i < 6 ? 0 : 1, col = i % 6;
        const x = 110 + col * 172, y = row ? 1760 : 1560;
        const hop = Math.abs(Math.sin(lt * 5 + i)) * 26;
        const pop = easeBack(seg(lt, .8 + i * .08, 1.1 + i * .08));
        if (pop > 0) drawChar(Object.assign({ kind, x, y: y - hop, s: .55 * pop, expr: 'happy', arms: { l: 'cheer', r: 'wave' }, t: lt + i }, extra));
      });
    },
    over(lt) {
      logo(540, 430, easeBack(seg(lt, 0, .35)) * .8);
      const lines = [['Dedicated to every nurse', 44, '#fff', .9], ["who hasn't peed since 2:45 PM.", 44, '#ffe135', 1.3], ['Drink water. Take your break.', 40, '#fff', 2.0], ['(You won\'t.)', 40, '#ff8fa3', 2.6]];
      lines.forEach(([s, size, c, at], i) => text(s, 540, 820 + i * 70, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 8 }));
      const r = seg(lt, 3.3, 3.6);
      if (r > 0) banner(r, 'SEASON 2: EVERY OTHER WEEKEND', 1220, '#2a6fdb', '#fff', 58, .03);
    },
  },

  post: {
    cam(lt) { const a1 = B('a1'); const z = easeOut(seg(lt, a1.e, a1.e + .3)); CAM.z = lerp(1.05, 1.9, z); CAM.x = lerp(540, 470, z); CAM.y = lerp(960, 980, z); CAM.shake = z * 8; },
    draw(lt) {
      bgBedroom();
      const r = B('ringing'), a1 = B('a1');
      const up = lt > r.e - .2;
      // bed
      ctx.fillStyle = '#3a3566'; rr(80, 1100, 820, 280, 30); ctx.fill();
      ctx.fillStyle = '#e9e4f5'; ell(760, 1080, 150, 60); ctx.fill();
      drawChar(straw({ x: up ? 560 : 700, y: up ? 1020 : 1070, s: 1.3, noLegs: true, rot: up ? 0 : -1.2, talk: talk('straw'), expr: up ? (lt > a1.e ? 'angry' : 'dead') : 'sleep', look: [0, .2], cap: false, acc: ['mask'], maskUp: up,
        hold: up ? { r: 'cell' } : {}, arms: up ? { l: 'rest', r: 'phone' } : { l: 'down', r: 'down' }, colors: lt > a1.e ? ['#ff6060', '#ff0020', '#700010'] : null, shake: lt > a1.e ? 6 : 0 }));
      ctx.fillStyle = '#5b4fa0'; ctx.strokeStyle = '#231c4a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(60, 1400); ctx.lineTo(60, 1180); ctx.quadraticCurveTo(300, up ? 1140 : 1100, up ? 460 : 520, up ? 1130 : 1080); ctx.quadraticCurveTo(700, 1150, 920, 1180); ctx.lineTo(920, 1400); ctx.closePath(); ctx.fill(); ctx.stroke();
      // nightstand + phone + clock
      ctx.fillStyle = '#4a3b2a'; rr(910, 1140, 170, 260, 12); ctx.fill();
      ctx.fillStyle = '#111'; rr(930, 1070, 110, 60, 8); ctx.fill(); text('3:00', 985, 1101, { size: 40, fill: '#ff3030', font: 'Bangers', weight: 400 });
      if (!up) {
        const buzz = Math.sin(lt * 60) * 4;
        ctx.save(); ctx.translate(975 + buzz, 1150);
        const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 260); glow.addColorStop(0, 'rgba(120,200,255,.5)'); glow.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = glow; ctx.fillRect(-260, -260, 520, 520);
        ctx.fillStyle = '#111'; rr(-40, -16, 80, 30, 6); ctx.fill(); ctx.fillStyle = '#7fd3ff'; rr(-34, -12, 68, 22, 4); ctx.fill();
        ctx.restore();
        text('Bzzzt', 975 + buzz, 1020, { size: 40, font: 'Bangers', weight: 400, fill: '#7fd3ff', lw: 8, alpha: seg(lt, r.s, r.s + .2) });
        // Zzz
        for (let i = 0; i < 3; i++) { const q = ((lt * .6 + i / 3) % 1); text('Z', 640 + q * 80 + i * 10, 860 - q * 160, { size: 40 + i * 16, font: 'Bangers', weight: 400, fill: '#c9c3ff', alpha: (1 - q) * (1 - seg(lt, r.s, r.s + .5)) }); }
      }
      if (lt > a1.e) { // steam
        for (let i = 0; i < 6; i++) { const q = ((lt * 1.8 + i / 6) % 1); ctx.fillStyle = `rgba(255,255,255,${.6 * (1 - q)})`; ell(560 + (i % 2 ? 1 : -1) * (80 + q * 60), 800 - q * 200, 30 + q * 40, 24 + q * 30); ctx.fill(); }
      }
    },
    over(lt) {
      const r = B('ringing');
      if (lt < r.e + .1 && lt > r.s) {
        ctx.save(); ctx.translate(540, lerp(-200, 330, easeBack(seg(lt, r.s, r.s + .35))));
        ctx.fillStyle = 'rgba(245,245,250,.97)'; rr(-470, -80, 940, 160, 34); ctx.fill();
        ctx.fillStyle = '#e53935'; rr(-440, -52, 104, 104, 24); ctx.fill();
        drawChar({ kind: 'apple', x: -388, y: 0, s: .32, center: true, noLegs: true, noArms: true, expr: 'happy', t: lt });
        text('DR. APPLE', -310, -30, { size: 34, fill: '#111', align: 'left' });
        text('Incoming call... (3:00 AM)', -310, 18, { size: 30, fill: '#444', align: 'left', weight: 700 });
        ctx.restore();
      }
      const f = seg(lt, CUR.dur - .7, CUR.dur);
      if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); text('SHIFT HAPPENS', 540, 960, { size: 110, font: 'Bangers', weight: 400, fill: '#ffe135', alpha: f, spacing: 4 }); }
    },
  },
};

EPISODES[1] = { num: 1, title: 'Episode 1: The 3-11', TL: window.TIMELINE, SCENES, layout: 'classic', audio: 'build/audio.m4a' };
})();
