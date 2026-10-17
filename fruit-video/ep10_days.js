'use strict';
/* SHIFT HAPPENS, Episode 10: Two Weeks' Notice. Scene module: days (THE NEXT TWO WEEKS, no script clock: the clock pill carries the countdown).
 * WORK IN PROGRESS: infrastructure pass (calendar, peel, dive / pull camera) with placeholder sets. */
(() => {
if (!window.TIMELINE_EP10) return;
const { person, zoomTo, faceC, faceZoom, drawBg, inB, localOf } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, S6 = window.S6, S7 = window.S7;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 ones)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const nbr = o => V2.dof(6, () => drawBg(o));
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const logMix = (a, b, k) => a * Math.pow(b / a, k);

// ------------------------------------------------------------------ the countdown calendar: one page design, used on the walls and full screen
const PW = 540, PH = 960;               // a page in its own units: exactly the 9:16 frame at scale 2
const COVER = 2.02;                      // full-frame scale (a hair over 2 so no wall or board ever shows at the edge)
const JOKE = { cover: 'TEAR OFF ONE PAGE PER DAY', 14: 'Lemon has a policy for this.', 10: 'Staff Appreciation Week', 7: 'Same job. Different budget.', 3: 'Supplies: see supplies.' };
const pageHash = (i, j) => hash(i * 7.31 + j * 3.17);
function pageFront(n) {
  const cover = n === 'cover';
  ctx.fillStyle = V2.grad(0, 0, 0, PH, [[0, '#fffbf0'], [1, '#f2e9d4']]); ctx.fillRect(0, 0, PW, PH);
  ctx.strokeStyle = 'rgba(120,90,50,.05)'; ctx.lineWidth = 1.4;                       // faint paper fibres
  for (let i = 0; i < 26; i++) { const y = 190 + pageHash(i, 1) * 760, x = pageHash(i, 2) * 400; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60 + pageHash(i, 3) * 120, y + (pageHash(i, 4) - .5) * 4); ctx.stroke(); }
  // header band (the pills of the chyron sit over its left end: the words live below them, at y 142)
  ctx.fillStyle = V2.grad(0, 0, 0, 176, [[0, '#ec2c43'], [1, '#c4162e']]); ctx.fillRect(0, 0, PW, 176);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, 170, PW, 6);
  for (const x of [150, 390]) { ctx.fillStyle = '#7a0c1e'; ell(x, 38, 15, 15); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.55)'; ell(x, 40, 11, 11); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let x = 20; x < PW - 10; x += 16) { ell(x, 14, 2.6, 2.6); ctx.fill(); }   // the perforation
  text('FRUIT BOWL REHAB & NURSING', 270, 142, { size: 25, fill: '#ffe9ee', weight: 900, spacing: 2 });
  if (cover) {
    text("TWO WEEKS'", 270, 300, { size: 150, font: 'Bangers', weight: 400, fill: '#1c1b26', spacing: 4 });
    text('NOTICE', 270, 440, { size: 190, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 6 });
    ctx.save(); ctx.translate(270, 610); ctx.rotate(-.05);   // an envelope with a red seal
    ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 7; rr(-110, -70, 220, 140, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-110, -60); ctx.lineTo(0, 20); ctx.lineTo(110, -60); ctx.stroke();
    ctx.fillStyle = '#e8193a'; ell(0, 20, 27, 27); ctx.fill(); ctx.stroke(); ctx.restore();
  } else {
    const word = n === 1 ? 'DAY LEFT' : 'DAYS LEFT', size = 470;
    text(String(n), 280, 388, { size, font: 'Bangers', weight: 400, fill: '#e8283e', spacing: 2 });          // a red echo, then the ink on top
    text(String(n), 270, 378, { size, font: 'Bangers', weight: 400, fill: '#1c1b26', spacing: 2 });
    text(word, 270, 640, { size: 108, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 6 });
    // fourteen boxes, one crossed off for every page already gone
    const gone = 14 - n;
    for (let i = 0; i < 14; i++) {
      const x = 22 + i * 36, y = 716;
      ctx.fillStyle = i < gone ? 'rgba(230,200,190,.55)' : '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 3; rr(x, y, 28, 36, 5); ctx.fill(); ctx.stroke();
      if (i < gone) { ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 4.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 5, y + 6); ctx.lineTo(x + 23, y + 30); ctx.moveTo(x + 23, y + 6); ctx.lineTo(x + 5, y + 30); ctx.stroke(); }
    }
  }
  text(JOKE[n] || 'TEAR OFF ONE PAGE PER DAY', 270, cover ? 760 : 805, { size: cover ? 34 : 30, fill: '#5b5368', weight: 900, spacing: cover ? 4 : 1 });
}
function pageBack() {   // the back of a sheet: tan stock, a ruled notes page, and the pizza ad nobody told the staff about (mirrored in sheet space, so it reads right once the sheet is turned)
  ctx.fillStyle = V2.grad(0, 0, PW, PH, [[0, '#f0e1b4'], [1, '#dcc895']]); ctx.fillRect(0, 0, PW, PH);
  ctx.save(); ctx.translate(PW, 0); ctx.scale(-1, 1);
  ctx.strokeStyle = 'rgba(120,80,40,.22)'; ctx.lineWidth = 2; for (let y = 300; y < PH; y += 44) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(PW - 30, y); ctx.stroke(); }
  ctx.save(); ctx.translate(270, 250); ctx.rotate(-.12);   // a big pizza slice
  ctx.fillStyle = '#f2b441'; ctx.strokeStyle = '#7a4a14'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-120, -110); ctx.lineTo(120, -110); ctx.lineTo(0, 150); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c27a'; ctx.beginPath(); ctx.moveTo(-120, -110); ctx.lineTo(120, -110); ctx.lineTo(112, -86); ctx.lineTo(-112, -86); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d62a2a'; for (const [x, y] of [[-48, -40], [30, -30], [-8, 40], [52, -76], [-70, -72]]) { ell(x, y, 21, 21); ctx.fill(); ctx.strokeStyle = '#7a1414'; ctx.lineWidth = 4; ctx.stroke(); }
  ctx.restore();
  text('PIZZA FRIDAY!', 270, 520, { size: 96, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 4 });
  text('(STAFF NOT INCLUDED)', 270, 590, { size: 30, fill: '#6a4a2a', weight: 900, spacing: 3 });
  ctx.restore();
}

// the pad on a wall: backing board, binding, a nail, the stack's edge, a shadow and the top page. (px, py) is the page's top left; s the wall scale
function wallPad(px, py, s, n, o = {}) {
  ctx.save(); ctx.translate(px, py); ctx.scale(s, s);
  if (o.rot) { ctx.translate(PW / 2, 0); ctx.rotate(o.rot); ctx.translate(-PW / 2, 0); }
  ctx.shadowColor = 'rgba(30,20,10,.38)'; ctx.shadowBlur = 24 * s; ctx.shadowOffsetX = 10 * s; ctx.shadowOffsetY = 14 * s;
  ctx.fillStyle = '#8a6a44'; rr(-22, -64, PW + 44, PH + 96, 14); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(25,16,10,.75)'; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = '#a07e52'; rr(-14, -56, PW + 28, 40, 8); ctx.fill();
  for (let i = 3; i >= 1; i--) { ctx.fillStyle = i % 2 ? '#efe6d0' : '#e2d7be'; ctx.strokeStyle = 'rgba(60,40,20,.5)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.rect(2 + i * 2, 4 + i * 3, PW - 4 - i * 4, PH); ctx.fill(); ctx.stroke(); }
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, PW, PH); ctx.clip(); pageFront(n); ctx.restore();
  ctx.strokeStyle = 'rgba(40,24,10,.6)'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, PW, PH);
  for (const x of [150, 390]) { ctx.strokeStyle = '#b9bdc6'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, -42); ctx.lineTo(x, 46); ctx.stroke(); ctx.strokeStyle = '#6c7280'; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.fillStyle = '#c9ccd4'; rr(60, -52, PW - 120, 16, 8); ctx.fill(); ctx.strokeStyle = '#555a66'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ paper: a page peeled up from its lower right corner, with a rolled crease, a shadow and a fly-off
const clipHalf = (poly, nx, ny, d, sg) => {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], sa = sg * (nx * a[0] + ny * a[1] - d), sb = sg * (nx * b[0] + ny * b[1] - d);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); }
  }
  return out;
};
const pathPoly = P => { ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };
function peel(frontFn, belowFn, p, o = {}) {
  const w = PW, h = PH, psi = o.psi ?? .5, nx = Math.sin(psi), ny = Math.cos(psi);
  const d0 = nx * w + ny * h + 8, d1 = -230, e = .05 + .95 * Math.pow(p, o.pow ?? 1.4), d = lerp(d0, d1, e);
  const R = [[0, 0], [w, 0], [w, h], [0, h]], A = clipHalf(R, nx, ny, d, -1), Bq = clipHalf(R, nx, ny, d, 1);
  belowFn();
  if (Bq.length > 2) {   // the page below, shadowed where the sheet used to lie
    ctx.save(); pathPoly(Bq); ctx.clip(); const g = ctx.createLinearGradient(d * nx, d * ny, (d + 260) * nx, (d + 260) * ny);
    g.addColorStop(0, 'rgba(30,14,10,.62)'); g.addColorStop(1, 'rgba(30,14,10,0)'); ctx.fillStyle = g; ctx.fillRect(-60, -60, w + 120, h + 120); ctx.restore();
  }
  if (A.length > 2) {    // what is still stuck down, darkening toward the crease
    ctx.save(); pathPoly(A); ctx.clip(); frontFn();
    const g = ctx.createLinearGradient((d - 110) * nx, (d - 110) * ny, d * nx, d * ny); g.addColorStop(0, 'rgba(30,14,10,0)'); g.addColorStop(1, 'rgba(30,14,10,.34)');
    ctx.fillStyle = g; ctx.fillRect(-60, -60, w + 120, h + 120); ctx.restore();
  }
  if (Bq.length > 2) {   // the lifted sheet, seen from behind: reflected across the crease, then thrown off toward the camera
    const fly = seg(p, .42, 1), fe = easeIn(fly), a = 1 - 2 * nx * nx, b = -2 * nx * ny, dd = 1 - 2 * ny * ny;
    ctx.save();
    ctx.translate(w / 2 - 190 * fe, h / 2 - 520 * fe * fe); ctx.rotate(-.55 * fe); ctx.scale(1 + .35 * fe, 1 + .35 * fe); ctx.translate(-w / 2, -h / 2);
    ctx.transform(a, b, b, dd, 2 * d * nx, 2 * d * ny);
    ctx.shadowColor = 'rgba(30,14,10,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = 14; ctx.shadowOffsetY = 24;
    pathPoly(Bq); ctx.fillStyle = '#e8d7a8'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); pathPoly(Bq); ctx.clip(); pageBack();
    const g = ctx.createLinearGradient(d * nx, d * ny, (d + 110) * nx, (d + 110) * ny); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(.3, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(60,30,10,.12)');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, w + 600, h + 600); ctx.restore();
    pathPoly(Bq); ctx.strokeStyle = 'rgba(90,60,30,.7)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }
}

// ------------------------------------------------------------------ the plan: when each flip hits, which pages go, when the camera dives and pulls back
const PEEL_T = [0, .09, .17, .24, .30], PEEL_D = [.22, .16, .15, .15, .15];
const PAGES = [['cover', 14], [14, 13, 12, 11, 10], [10, 9, 8, 7], [7, 6, 5, 4, 3]];
const DIVE = .30, HOLD = .07;
function plan() {
  const ids = ['open', 'flip1', 'flip2', 'flip3'], hits = [B('open').s + .05, B('flip1').s, B('flip2').s, B('flip3').s];
  return ids.map((id, i) => {
    const pages = PAGES[i], n = pages.length - 1, starts = PEEL_T.slice(0, n), durs = PEEL_D.slice(0, n);
    if (i === 0) durs[0] = .28;
    const riffEnd = starts[n - 1] + durs[n - 1] + .03, hit = hits[i], pullEnd = i === 0 ? B('open').e : B(id).e - .02;
    return { i, hit, pages, starts, durs, riffEnd, pullEnd, dive0: hit - HOLD - DIVE, dive1: hit - HOLD };
  });
}
// what the frame is: the full-screen cover page, a part of the day, the camera diving into its calendar, the held page, the riffle, or the pull-back into the next place
function frameOf(lt) {
  const pl = plan();
  for (let i = 0; i < 4; i++) {
    const f = pl[i];
    if (lt < f.hit) {
      if (i === 0) return { mode: 'cover', f, page: 'cover' };
      if (lt >= f.dive1) return { mode: 'hold', f, page: f.pages[0] };
      if (lt >= f.dive0) return { mode: 'dive', part: i - 1, f, k: seg(lt, f.dive0, f.dive1) };
      return { mode: 'part', part: i - 1, f };
    }
    if (lt < f.hit + f.riffEnd) return { mode: 'rip', f, t: lt - f.hit };
    if (lt < f.pullEnd) return { mode: 'pull', part: i, f, k: seg(lt, f.hit + f.riffEnd, f.pullEnd) };
  }
  return { mode: 'part', part: 3, f: pl[3] };
}
// the number the clock pill shows: it follows the pages as they come off
function dayAt(lt) {
  const F = frameOf(lt);
  if (F.mode === 'cover') return 14;
  if (F.mode === 'rip') { const f = F.f; let j = 0; while (j < f.pages.length - 1 && (F.t - f.starts[j]) / f.durs[j] >= .5) j++; return f.pages[j] === 'cover' ? 14 : f.pages[j]; }
  if (F.mode === 'hold') return F.f.pages[0];
  if (F.mode === 'pull') return F.f.pages[F.f.pages.length - 1];
  return [14, 10, 7, 3][F.part];
}

// ------------------------------------------------------------------ the parts of the montage (placeholders in this pass)
const mkPart = (i, col, cal) => ({
  camP: { f: 1400, cy: 360, hy: 860 }, cal,
  cam: lt => ({ x: 540, y: 960, z: 1 }),
  cover() { return { x: cal.px + PW * cal.s / 2, y: cal.py + PH * cal.s / 2, z: COVER / cal.s, r: cal.rot || 0 }; },
  draw(lt, F) { ctx.fillStyle = col; ctx.fillRect(-300, -300, W + 600, H + 600); text('PART ' + (i + 1), 540, 600, { size: 120, font: 'Bangers', weight: 400, fill: '#fff' }); wallPad(cal.px, cal.py, cal.s, [14, 10, 7, 3][i], { rot: cal.rot }); },
  fx: lt => ({}),
});
const PARTS = [mkPart(0, '#3a5a7a', { px: 820, py: 560, s: .3 }), mkPart(1, '#7a5a3a', { px: 120, py: 500, s: .22 }), mkPart(2, '#3a7a5a', { px: 800, py: 520, s: .26 }), mkPart(3, '#4a3a6a', { px: 150, py: 560, s: .3, rot: -.04 })];

// ------------------------------------------------------------------ the scene
const mixCam = (a, b, e) => ({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: logMix(a.z, b.z, e), r: lerp(a.r || 0, b.r || 0, e) });
const SC = {
  shot(lt) { return frameOf(lt).mode; },
  clock(lt) { return dayAt(lt) + ' DAYS LEFT'; },
  cam(lt) {
    const F = frameOf(lt);
    if (F.mode === 'cover' || F.mode === 'hold' || F.mode === 'rip') { zoomTo(540, 960, 1); return; }
    const P = PARTS[F.part]; V2.setCam(P.camP);
    let c;
    if (F.mode === 'part') c = P.cam(lt);
    else if (F.mode === 'dive') c = mixCam(P.cam(F.f.dive0), P.cover(), Math.pow(F.k, 2.2));
    else c = mixCam(P.cover(), P.cam(F.f.pullEnd), 1 - Math.pow(1 - F.k, 2.2));
    CAM.x = c.x; CAM.y = c.y; CAM.z = c.z; CAM.r = c.r || 0; CAM.shake = c.shake || 0;
  },
  draw(lt) {
    const F = frameOf(lt);
    if (F.mode === 'cover' || F.mode === 'hold') {
      ctx.save(); ctx.translate(540, 960); ctx.scale(COVER, COVER); ctx.translate(-PW / 2, -PH / 2); pageFront(F.page); ctx.restore(); return;
    }
    if (F.mode === 'rip') {
      const f = F.f, pg = f.pages, t = F.t;
      ctx.save(); ctx.translate(540, 960); ctx.scale(COVER, COVER); ctx.translate(-PW / 2, -PH / 2);
      const rec = j => {
        if (j >= pg.length - 1) { pageFront(pg[pg.length - 1]); return; }
        const p = clamp((t - f.starts[j]) / f.durs[j]);
        if (p >= 1) return rec(j + 1);
        if (p <= 0) { pageFront(pg[j]); return; }
        peel(() => pageFront(pg[j]), () => rec(j + 1), p);
      };
      rec(0); ctx.restore(); return;
    }
    PARTS[F.part].draw(lt, F);
  },
  fx: lt => ({ bloom: .5, vignette: .4, grain: .045, contrast: .12, sat: .1, fade: Math.max(1 - seg(lt, 0, .22), seg(lt, CUR.dur - .35, CUR.dur - .02)), fadeColor: '0,0,10' }),
  blur: lt => { const F = frameOf(lt); return F.mode === 'dive' ? 8 : F.mode === 'rip' ? 5 : F.mode === 'pull' ? 6 : 1; },
  over(lt) {},
};
window.__DAYS_DBG = { peel, pageFront, wallPad };
window.__EP10_SCENES = window.__EP10_SCENES || {};
window.__EP10_SCENES.days = SC;
})();
