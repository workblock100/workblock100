'use strict';
/* SHIFT HAPPENS, Episode 10: Two Weeks' Notice. Scene module: days (THE NEXT TWO WEEKS, 35.09 s; the script gives no clock, so the clock pill carries the countdown).
 *
 * The device: a flip calendar. Every part of the montage hangs a countdown pad on its own wall (14, 10, 7, 3). Before each flip the camera dives into that pad until the page fills the frame
 * (DIVE .22 s + HOLD .05 s), the page is torn off at the flip cue (flipcal +0.00, whoosh2 +0.05, paper tear +0.02: the first lift shows on the first frame), a riffle of pages peels away
 * (14 to 10, 10 to 7, 7 to 3; the pill follows the pages), and the camera pulls back from the next pad into the next place. The cover ("TWO WEEKS' NOTICE", hit at open +0.05) does the same
 * into the hall. peel() is a real page fold (crease, reflected back, shadow on the next sheet, fly-off); blur is 10 samples while the page moves, 1 otherwise.
 *
 * PART 1  THE HALL, day 14 (0 to 9.9). Bright afternoon, a hall with sun windows. Lemon's whiteboard NOTICE PERIOD POLICY with a pointer that rides down the checkboxes, and a giant
 *         stamp for each rule (DENIED at 3.45, 4.42, 5.40). wide 1.1-2.58 | medium Lemon + board 2.58-5.80 (Strawberry a blur in the foreground) | CU Strawberry 5.80-7.93
 *         (four fingers on "four years") | CU Lemon 7.93-9.63 ("Then nothing changes.", pointer hangs) | dive 9.63-9.85 | flip1 9.90.
 * PART 2  THE STATION, day 10 (10.8 to 16.8). Warm, confetti, STAFF APPRECIATION WEEK banner, balloons. The Administrator's jazz hands, the donut (car tire sized, on a caster stand,
 *         glaze, sprinkles, a "1" flag) rolls in pushed by Mango and stops dead on "donut"; Mango pokes it on "very" (it wobbles), hops into the hole on "large".
 *         medium 10.8-11.95 (camera holds, the donut rolls in) | pan to wide 11.95-12.75 | CU Strawberry 13.68-14.96 ("That's one donut.") | wide 14.96-16.57 | dive | flip2 16.84.
 * PART 3  THE BREAK ROOM, day 7 (17.74 to 23.7). Tired fluorescent tube, grey afternoon, vending machine, fridge, microwave at 3:34. Mango brings the job board to Strawberry.
 *         two-shot 17.8-18.25 | full-screen tablet 18.25-21.95 (two postings, same words; $34.00 pops on "thirty-four", $100 rolls to $118.00 on "hundred" to "eighteen", 2 vs 4,000
 *         applicants) | CU Strawberry 21.95-22.40 | three-shot, the Administrator leans in 22.40-23.46 ("Different budget.") | dive | flip3 23.73.
 * PART 4  THE SUPPLY CLOSET, day 3 (24.6 to 35.09). Dim, a bare bulb that flickers, a crooked pad, a Q-word sign with the Q crossed out, shelves with nothing on them but one glove, a cobweb
 *         and a spider, an empty carton. Clementine hops in (24.32-25.10) and copies Strawberry's every pose 0.42 s late (fists on hips, a hand over the eye on "replacement", a palm up on
 *         "supplies", a shrug on "There aren't any."). two-shot 24.6-27.41 | marmalade jar insert 27.41-28.34 | CU Clementine 28.34-29.6 | two-shot 29.6-31.2 | CU "Sure!" 31.2-31.88 |
 *         the reveal, they step apart, a tumbleweed rolls through 31.88-32.85 | CU frozen smile, a drop of sweat 32.85-33.55 | the empty closet 33.55-35.09 (trombone 33.84: WAH WAH,
 *         the bulb sags, fade out).
 *
 * Layout numbers worth knowing: the pad pages are 540 x 960 units drawn at COVER 2.02 for a full frame; the clock pill is "N DAYS LEFT" in the pill's own family. The hall cast stands at
 * x 158 (Strawberry) and x 421 (Lemon) with the board at BD.x 528 so that Lemon's pointer (a tight box on the shaft) clears her face on one side and the lettering on the other. */
(() => {
if (!window.TIMELINE_EP10) return;
const { zoomTo, faceC, drawBg, localOf } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, S6 = window.S6, S7 = window.S7;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 ones)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const nbr = o => V2.dof(6, () => drawBg(o));
const bgDof = (px, fn) => { if (px > .5) REG.suppress++; try { V2.dof(px, fn); } finally { if (px > .5) REG.suppress--; } };   // a blurred set: drawn, not audited
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const logMix = (a, b, k) => a * Math.pow(b / a, k);
const lerpA2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const { confetti, runner } = window.H6;

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
    text("TWO WEEKS'", 270, 300, { size: 118, font: 'Bangers', weight: 400, fill: '#1c1b26', spacing: 3 });
    text('NOTICE', 270, 430, { size: 172, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 5 });
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
  const d0 = nx * w + ny * h + 8, d1 = -230, e = .08 + .92 * Math.pow(p, o.pow ?? 1.35), d = lerp(d0, d1, e);
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
const DIVE = .22, HOLD = .05;
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

// ------------------------------------------------------------------ shared helpers for the parts
const { box3, onZ, kz, shell, backWindow, ceilingLamp, plant3, table3, chair3 } = S6;
const { p2, poly, grad, radial } = V2;
const { straw, mango, lemon } = A7, melon = A9.melon, clem = A10.clem;
// aim a hand at a point in scene coordinates: blend from a resting grip (local px) toward it, stopping short of the arm's full reach
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}
// the camera that keeps shoes at y 1360 on the screen (clear of the speaker chip at 1386): x is the scene point at the centre, z the zoom
const feetCam = (x, z, o = {}) => ({ x, y: (o.feet ?? 1369) - 400 / z, z });
// a decaying shake kick: the strength k0 at t0, gone after dur
const kick = (lt, t0, dur, k0) => lt >= t0 && lt < t0 + dur ? k0 * (1 - (lt - t0) / dur) ** 2 : 0;
// a damped wobble that starts at t0
const wob = (lt, t0, f, damp) => lt < t0 ? 0 : Math.sin((lt - t0) * f * TAU) * Math.exp(-(lt - t0) * damp);

// "four years": four glove fingers fanned up from behind a fist, the thumb folded away
Object.assign(PROP_BOX, { fingers10: [-30, -62, 30, 14] });
EXT.prop.fingers10 = (side, o, t) => {
  ctx.save(); ctx.lineJoin = 'round';
  const fk = o.fingerK ?? 1, L = [28, 38, 36, 26].map(v => v * fk), X = [-15.5, -5.5, 5, 15], A = [-.2, -.07, .07, .2];
  L.forEach((len, i) => {
    ctx.save(); ctx.translate(X[i], -6); ctx.rotate(A[i]);
    ctx.fillStyle = V2.grad(-6, 0, 6, 0, [[0, '#ffffff'], [1, '#d9deea']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.roundRect(-5.5, -len - 14, 11, len + 16, 5.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,20,40,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -len * .55 - 14); ctx.lineTo(3, -len * .55 - 14); ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
};

// ------------------------------------------------------------------ PART 1: THE HALL (14 days). Lemon's board, a giant stamp for every rule
const BD = { x: 528, y: 790, w: 610, h: 350 };       // the whiteboard's writing surface, in scene px at the board's depth (Z 1010)
const BPAD = { px: BD.x + 458, py: BD.y + 30, s: .26 };   // the countdown pad clipped on the board's right
const ROW_Y = i => BD.y + 130 + i * 72;               // the three rules
const STAMP_AT = () => [3.45, 4.42, 5.40];             // impact of each stamp: the end of "call-outs", "vacation" and just before "days" lands
const SLOT_X = BD.x + 370;                              // centre of the STATUS slots
function boardSprite(lt, tr) {
  const sh = STAMP_AT();
  const shakeX = sh.reduce((a, t0) => a + wob(lt, t0, 7, 9) * 5, 0), shakeY = sh.reduce((a, t0) => a + wob(lt, t0 + .02, 9, 11) * 3, 0);
  ctx.save(); ctx.translate(shakeX, shakeY);
  const fy = 1359;   // the floor under the board's wheels
  // stand: two legs, a base bar, wheels, and the shadow on the floor
  ctx.fillStyle = 'rgba(20,18,40,.22)'; ell(BD.x + BD.w / 2, fy + 6, BD.w * .52, 20); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (const x of [BD.x + 70, BD.x + BD.w - 70]) { ctx.strokeStyle = '#8f98a8'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x, BD.y + BD.h); ctx.lineTo(x, fy - 36); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 8, BD.y + BD.h); ctx.lineTo(x + 8, fy - 36); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, fy - 52, 0, fy - 26, [[0, '#b9c1cf'], [1, '#79829a']]); ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(BD.x + 30, fy - 52, BD.w - 60, 24, 10); ctx.fill(); ctx.stroke();
  for (const x of [BD.x + 50, BD.x + BD.w - 50]) { ctx.fillStyle = '#25232c'; ell(x, fy - 12, 20, 20); ctx.fill(); ctx.fillStyle = '#9aa3b2'; ell(x, fy - 12, 8, 8); ctx.fill(); }
  // frame and surface
  ctx.fillStyle = V2.grad(0, BD.y - 14, 0, BD.y + BD.h + 14, [[0, '#d5dbe6'], [1, '#98a2b4']]); ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(BD.x - 14, BD.y - 14, BD.w + 28, BD.h + 28, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(BD.x, BD.y, BD.x + BD.w, BD.y + BD.h, [[0, '#ffffff'], [1, '#e6ecf3']]); rr(BD.x, BD.y, BD.w, BD.h, 6); ctx.fill();
  ctx.save(); rr(BD.x, BD.y, BD.w, BD.h, 6); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(BD.x + 90, BD.y); ctx.lineTo(BD.x + 190, BD.y); ctx.lineTo(BD.x + 20, BD.y + BD.h); ctx.lineTo(BD.x - 80, BD.y + BD.h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(120,140,170,.07)'; for (let i = 0; i < 7; i++) { ell(BD.x + 60 + hash(i + 3) * 380, BD.y + 80 + hash(i + 9) * 240, 30 + hash(i) * 40, 6 + hash(i + 5) * 8, hash(i + 1) * 3); ctx.fill(); }   // old ghosts of the marker
  ctx.restore();
  // the printed header, taped on
  ctx.save(); ctx.translate(BD.x + 228, BD.y + 48); ctx.rotate(-.012);
  ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = 'rgba(30,24,50,.55)'; ctx.lineWidth = 2.6; rr(-206, -34, 412, 68, 4); ctx.fill(); ctx.stroke();
  text('NOTICE PERIOD POLICY', 0, 3, { size: 46, font: 'Bangers', weight: 400, fill: '#1f3f9a', spacing: 2 });
  ctx.fillStyle = 'rgba(255,226,120,.8)'; for (const [x, r] of [[-206, -.5], [206, .5]]) { ctx.save(); ctx.translate(x, -34); ctx.rotate(r); ctx.fillRect(-22, -9, 44, 18); ctx.restore(); }
  ctx.restore();
  // the three rules, a checkbox and a STATUS slot each
  ['CALL-OUTS', 'VACATION', 'SICK DAYS'].forEach((lab, i) => {
    const y = ROW_Y(i);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1c1c28'; ctx.lineWidth = 4; rr(BD.x + 24, y - 15, 30, 30, 5); ctx.fill(); ctx.stroke();
    text(lab, BD.x + 66, y + 2, { size: 36, fill: '#1c1c28', weight: 900, italic: true, align: 'left', spacing: 1 });
    ctx.setLineDash([9, 7]); ctx.strokeStyle = '#8d97aa'; ctx.lineWidth = 3; rr(SLOT_X - 70, y - 29, 140, 58, 8); ctx.stroke(); ctx.setLineDash([]);
    text('STATUS', SLOT_X, y, { size: 18, fill: '#a3abbb', weight: 900, spacing: 3 });
  });
  text('Questions? Re-read the board.', BD.x + 30, BD.y + BD.h - 28, { size: 23, fill: '#4a5368', weight: 800, italic: true, align: 'left' });
  // the imprints
  sh.forEach((t0, i) => { const age = lt - t0; if (age < 0) return; const k = easeOut(clamp(age / .1)), y = ROW_Y(i);
    ctx.save(); ctx.translate(SLOT_X + (i - 1) * 3, y + 1); ctx.rotate([-.07, .05, -.04][i]); ctx.scale(lerp(1.2, 1, k), lerp(1.2, 1, k)); ctx.globalAlpha *= clamp(age / .04);
    ctx.strokeStyle = '#cf1f35'; ctx.fillStyle = '#cf1f35'; ctx.lineWidth = 5; rr(-66, -25, 132, 50, 8); ctx.stroke(); ctx.lineWidth = 2.2; rr(-60, -19, 120, 38, 5); ctx.stroke();
    text('DENIED', 0, 2, { size: 36, font: 'Bangers', weight: 400, fill: '#cf1f35', spacing: 2 });
    ctx.fillStyle = 'rgba(246,248,252,.8)'; for (let q = 0; q < 16; q++) { ell(-64 + hash(q + i * 17) * 128, -22 + hash(q + 40 + i * 9) * 44, 1.5 + hash(q + 3) * 2, 1.2 + hash(q + 5) * 1.5, hash(q) * 3); ctx.fill(); }   // worn ink
    ctx.restore(); });
  // the countdown pad, magnetted on
  wallPad(BPAD.px, BPAD.py, BPAD.s, 14, { rot: sh.reduce((a, t0) => a + wob(lt, t0, 5, 7) * .02, 0) });
  ctx.fillStyle = '#d6203a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; for (const dx of [8, BPAD.s * PW - 8]) { ell(BPAD.px + dx, BPAD.py - 12, 11, 11); ctx.fill(); ctx.stroke(); }
  // the tray, with its markers and the eraser
  ctx.fillStyle = V2.grad(0, BD.y + BD.h, 0, BD.y + BD.h + 22, [[0, '#c3cad6'], [1, '#8d97a8']]); ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(BD.x + 20, BD.y + BD.h + 4, BD.w - 40, 20, 6); ctx.fill(); ctx.stroke();
  [['#2f56d8', 120], ['#d8352e', 168], ['#1c1c28', 216]].forEach(([c, dx]) => { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(BD.x + dx, BD.y + BD.h - 12, 38, 14, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2f4f8'; rr(BD.x + dx + 28, BD.y + BD.h - 12, 10, 14, 4); ctx.fill(); });
  ctx.fillStyle = '#4a4f5c'; ctx.strokeStyle = INK; rr(BD.x + 300, BD.y + BD.h - 18, 62, 22, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d6dae2'; rr(BD.x + 300, BD.y + BD.h - 18, 62, 8, 4); ctx.fill();
  ctx.restore();
  // the board's lettering is a key sign: nothing may cover it
  regLocal('key', BD.x + 62, BD.y + 14, BD.x + 442, BD.y + BD.h - 6, { id: 'policy-board', transit: tr });
}
// the giant stamp: it comes down from above the frame on the rule that was just read, squashes, and lifts away
function bigStamp(cx, by, sq) {
  ctx.save(); ctx.translate(cx, by); ctx.scale(1 + .07 * sq, 1 - .1 * sq); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 6;
  ctx.fillStyle = V2.grad(-100, 0, 100, 0, [[0, '#6f4521'], [.45, '#a06a38'], [1, '#5a3618']]); rr(-100, -80, 200, 80, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c3162d'; rr(-94, -16, 188, 16, 6); ctx.fill();                                   // the inked rubber at the bottom edge
  ctx.strokeStyle = 'rgba(255,230,190,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-84, -62); ctx.lineTo(84, -62); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 6;
  ctx.fillStyle = V2.grad(-36, 0, 36, 0, [[0, '#7a4c26'], [.5, '#b98450'], [1, '#6a4020']]); rr(-34, -170, 68, 96, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(-70, -260, 70, -160, [[0, '#cf9560'], [1, '#7a4c26']]); ctx.beginPath(); ctx.ellipse(0, -196, 74, 60, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(-28, -218, 26, 12, -.5); ctx.fill();
  ctx.restore();
}
function stampLayer(lt) {
  STAMP_AT().forEach((t0, i) => {
    const a = t0 - .2, b = t0 + .14, c = t0 + .52;
    if (lt < a || lt > c) return;
    const base = ROW_Y(i) + 40;
    const y = lt < t0 ? lerp(-420, base, easeIn(seg(lt, a, t0))) : lt < b ? base : lerp(base, -430, easeOut(seg(lt, b, c)));
    const sq = lt >= t0 && lt < t0 + .12 ? 1 - seg(lt, t0, t0 + .12) : 0;
    bigStamp(SLOT_X, y, sq);
    if (lt >= t0 && lt < t0 + .5) {   // ink specks and a puff at the contact
      const k = (lt - t0) / .5;
      for (let q = 0; q < 12; q++) { const an = q / 12 * TAU + hash(q + i * 5), d = (50 + 90 * hash(q + 20)) * easeOut(k); ctx.fillStyle = `rgba(207,31,53,${.85 * (1 - k)})`; ell(SLOT_X + Math.cos(an) * d * 1.3, base - 8 + Math.sin(an) * d * .5 - 30 * k, 4 * (1 - k) + 1, 4 * (1 - k) + 1); ctx.fill(); }
    }
  });
}

// Lemon's telescoping pointer: the shaft runs from the fist along o.pointAng (set per frame) for o.pointLen local px, silver sections, a red rubber tip
Object.assign(PROP_BOX, { pointer10: o => { const L = o.pointLen ?? 150, a = o.pointAng ?? -.5, x1 = Math.cos(a) * L, y1 = Math.sin(a) * L; return [Math.min(-10, x1) - 6, Math.min(0, y1) - 10, Math.max(-10, x1) + 8, Math.max(0, y1) + 10]; } });
EXT.prop.pointer10 = (side, o, t) => {
  const L = o.pointLen ?? 150, a = o.pointAng ?? -.5;
  ctx.save(); ctx.rotate(a); ctx.lineCap = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(L, 0); ctx.stroke();
  ctx.strokeStyle = '#2a2630'; ctx.lineWidth = 7.4; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(30, 0); ctx.stroke();                         // the rubber grip
  ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 7.4; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(L * .62, 0); ctx.stroke();
  ctx.strokeStyle = '#e6e9ef'; ctx.lineWidth = 5.4; ctx.beginPath(); ctx.moveTo(L * .62, 0); ctx.lineTo(L - 10, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,40,60,.55)'; ctx.lineWidth = 2; for (const x of [L * .3, L * .62]) { ctx.beginPath(); ctx.moveTo(x, -4); ctx.lineTo(x, 4); ctx.stroke(); }
  ctx.fillStyle = '#d6203a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(L, 0, 8, 6.4); ctx.fill(); ctx.stroke();
  ctx.restore();
};

// the hall: a wide, bright hospital hall with doors, rails, ceiling panels and sun through a window at the end
const HALLD = { zb: 2700, hw: 520, ch: 700 };
function hallSet(lt) {
  const { zb, hw, ch } = HALLD;
  shell({ zb, hw, ch, wall: '#f6eedc', wain: '#5f989e', floorA: '#e4dbc6', floorB: '#b3a890', ceil: '#f6f3ea', fog: '#cfdae8', fogAmt: .3, tile: 150, bright: 1.05, rail: 108 });
  const wq = (side, y0, y1, z0, z1, fill, stroke, lw) => poly([p2(side * hw, y0, z0), p2(side * hw, y1, z0), p2(side * hw, y1, z1), p2(side * hw, y0, z1)], fill, stroke, lw);
  // the end wall: double doors with push bars, an exit sign, a notice board and the window that lights the hall
  onZ(zb, -170, 170, 0, 446, '#f0e8d6', 'rgba(25,16,30,.55)', 2.6);
  for (const [a, b] of [[-160, -4], [4, 160]]) { onZ(zb, a, b, 0, 430, '#a8744f', 'rgba(25,16,30,.6)', 2.4); onZ(zb, a + 22, b - 22, 250, 390, 'rgba(210,236,250,.6)', 'rgba(25,16,30,.45)', 1.8); onZ(zb, a + 22, b - 22, 50, 190, '#96623e', 'rgba(25,16,30,.3)', 1.4); }
  onZ(zb, -6, 6, 120, 134, '#c9ced8'); onZ(zb, -70, 70, 470, 520, '#1a6b3a', 'rgba(10,30,20,.7)', 2); { const [ex, ey] = p2(0, 495, zb); text('EXIT', ex, ey, { size: 30 * kz(zb), font: 'Bangers', weight: 400, fill: '#bfffd2', spacing: 3 }); V2.glow(ex, ey, 150 * kz(zb), '120,255,170', .45, 'screen', .3); }
  onZ(zb, -470, -250, 160, 420, '#b98a5a', 'rgba(25,16,30,.6)', 2.6); onZ(zb, -458, -262, 172, 408, '#d9b784');
  [[-440, 330, '#fff3a6'], [-370, 360, '#ffb3c6'], [-330, 260, '#bfe3ff'], [-440, 250, '#d8ffb0'], [-300, 340, '#ffe0a0']].forEach(([x, y, c]) => onZ(zb, x - 24, x + 24, y - 30, y + 30, c, 'rgba(25,16,30,.3)', 1.2));
  backWindow(zb, { x0: 230, x1: 430, y0: 170, y1: 430, sky: ['#7fc0f6', '#eaf6ff'], mull: 2, beam: '255,240,200', beamA: .2, beamLen: 1000, beamDx: -220 });
  // doors down both walls, with a call-light dome over each (dark: it is a calm afternoon)
  const sideDoor = (side, zc, col, n) => {
    wq(side, 0, 444, zc - 82, zc + 82, '#efe6d2', 'rgba(25,16,30,.55)', 2); wq(side, 0, 430, zc - 70, zc + 70, col, 'rgba(25,16,30,.6)', 2);
    wq(side, 60, 200, zc - 54, zc + 54, 'rgba(0,0,0,.1)'); wq(side, 250, 392, zc - 54, zc + 54, 'rgba(0,0,0,.1)'); wq(side, 214, 232, zc + 44, zc + 56, '#d8d2c6');
    wq(side, 450, 500, zc - 50, zc + 50, '#d7dbe0', 'rgba(30,24,40,.6)', 1.6);
    const [px, py] = p2(side * hw, 360, zc + 112), kk = kz(zc + 112); if (kk > .45) text(n, px, py, { size: 22 * kk, fill: '#2b2530', weight: 900 });
  };
  [[-1, 1700, '#9d6b74', '12'], [-1, 2350, '#6d8f88', '14'], [1, 1560, '#8e6f55', '7'], [1, 2150, '#a8744f', '9']].forEach(a => sideDoor(...a));
  // tall windows on the left wall: sky, mullions, a sill, and the sun they throw across the floor
  for (const [z0, z1] of [[1050, 1450], [1750, 2150]]) {
    wq(-1, 150, 470, z0 - 26, z1 + 26, '#f2ecdc', 'rgba(25,16,30,.55)', 2.4);
    const f = [p2(-hw, 170, z0), p2(-hw, 170, z1), p2(-hw, 450, z1), p2(-hw, 450, z0)];
    poly(f, grad(0, f[3][1], 0, f[0][1], [[0, '#7fc0f6'], [1, '#f2faff']])); V2.glow((f[0][0] + f[1][0]) / 2, (f[0][1] + f[3][1]) / 2, 150 * kz((z0 + z1) / 2), '255,244,214', .3, 'screen', .4);
    for (const zm of [(z0 + z1) / 2]) wq(-1, 170, 450, zm - 4, zm + 4, '#f2ecdc'); wq(-1, 308, 316, z0, z1, '#f2ecdc');
    wq(-1, 140, 152, z0 - 40, z1 + 40, '#e4dac6', 'rgba(25,16,30,.5)', 1.6);
  }
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [z0, z1, a] of [[1050, 1450, .3], [1750, 2150, .22]]) {   // two long warm parallelograms on the floor, leaning toward the right wall
    const q = [p2(-hw, 0, z0), p2(-hw, 0, z1), p2(-70, 0, z1 + 420), p2(-70, 0, z0 + 330)];
    ctx.fillStyle = grad(0, q[1][1], 0, q[0][1], [[0, `rgba(255,236,190,${a * .7})`], [1, `rgba(255,236,190,${a})`]]); ctx.beginPath(); ctx.moveTo(...q[0]); ctx.lineTo(...q[1]); ctx.lineTo(...q[2]); ctx.lineTo(...q[3]); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // little things on the walls: a notice board on the right, a red extinguisher, a sanitizer on the left, a hand-hygiene poster further down
  wq(1, 240, 430, 1650, 2050, '#b98a5a', 'rgba(25,16,30,.6)', 2.6); wq(1, 252, 418, 1662, 2038, '#d9b784');
  [[1700, 380, '#fff3a6'], [1790, 340, '#ffb3c6'], [1870, 390, '#bfe3ff'], [1960, 330, '#d8ffb0'], [1740, 300, '#ffe0a0'], [1990, 400, '#d9c2ff']].forEach(([z, y, c]) => wq(1, y - 34, y + 34, z - 30, z + 30, c, 'rgba(25,16,30,.3)', 1.2));
  wq(1, 110, 300, 1260, 1300, '#d6202e', 'rgba(25,16,30,.7)', 2); wq(1, 290, 330, 1272, 1288, '#2a2a30'); wq(1, 150, 260, 1255, 1305, 'rgba(255,255,255,.18)');
  wq(-1, 240, 360, 1500, 1590, '#f3f6fa', 'rgba(25,16,30,.55)', 2); wq(-1, 300, 346, 1514, 1576, '#7fb8ee'); wq(-1, 258, 290, 1530, 1560, '#cfd6e2');
  wq(-1, 250, 420, 2230, 2480, '#cdb89a', 'rgba(25,16,30,.55)', 2); wq(-1, 262, 408, 2242, 2468, '#fbf7ee'); for (const [y, c] of [[380, '#2a5ac8'], [345, '#d62a3a'], [310, '#7fb8ee']]) wq(-1, y - 8, y + 8, 2270, 2440, c);
  // rails along both walls
  for (const side of [-1, 1]) { const a = p2(side * (hw - 14), 162, 400), b = p2(side * (hw - 14), 162, zb); ctx.strokeStyle = '#c99b6a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,210,.4)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(a[0], a[1] - 3); ctx.lineTo(b[0], b[1] - 3); ctx.stroke(); }
  for (const z of [400, 1000, 1600, 2200]) { ceilingLamp(-230, z, ch, 1, '255,246,220', 90, 150); ceilingLamp(230, z, ch, 1, '255,246,220', 90, 150); }
  // the window's sun on the floor, a long bright wedge toward the camera
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const f0 = p2(230, 0, zb - 20), f1 = p2(430, 0, zb - 20), f2 = p2(380, 0, 900), f3 = p2(-90, 0, 900);
  ctx.fillStyle = grad(0, f0[1], 0, f2[1], [[0, 'rgba(255,244,210,.32)'], [1, 'rgba(255,244,210,0)']]); ctx.beginPath(); ctx.moveTo(...f0); ctx.lineTo(...f1); ctx.lineTo(...f2); ctx.lineTo(...f3); ctx.closePath(); ctx.fill(); ctx.restore();
  plant3(-470, 1400, 1.0); plant3(470, 1500, 1.0);
}
const P1CAST = { S: [-279, 1000], L: [-88, 1040] };   // Strawberry stands nearer the camera, so Lemon's clipboard is behind her, never across her face
// where the pointer rests: it glides from rule to rule as Lemon reads them
const ruleY = lt => { const sh = STAMP_AT(); return lerp(lerp(ROW_Y(0), ROW_Y(1), sk(lt, sh[0] + .05, sh[0] + .45)), ROW_Y(2), sk(lt, sh[1] + .05, sh[1] + .45)) + lerp(0, BD.y + BD.h - 30 - ROW_Y(2), sk(lt, B('l1').e + .1, B('l1').e + .7)); };
function p1cast(lt, F) {
  const b = id => B(id), sh = STAMP_AT(), tr = F && F.mode !== 'part';   // dive and pull: nobody is held to the frame edge
  const qS = V2.at(...P1CAST.S), qL = V2.at(...P1CAST.L);
  // Lemon: flat affect, reading a clipboard and pointing at each rule as she reads it; the slams never make her flinch
  const look = lt < b('l1').s ? [.3, .05] : lt < b('l1').e - .5 ? [.4, .1] : lt < b('l2').s ? [-.45, .02] : [-.3, 0];
  const lm = lemon(Object.assign(qL, { look, expr: 'dead', lid: lt >= b('l2').s ? .42 : .24, hold: { l: 'clipboard6', r: 'pointer10' }, grip: { l: [-100, 30] }, clipText: 'NOTICES', arms: { l: 'hold', r: 'rest' }, transit: tr }));
  {   // the pointer stays at the board's left margin the whole time: its tip rides down the checkboxes, then drops to the tray (it never crosses the lettering or her face)
    const tx = BD.x + 42, ty = ruleY(lt) + 14;
    handTo(lm, 1, BD.x + 12, ty + 70, 1, [106, 40]); lm.hand = { r: 'grip' };
    const [u, v] = localOf(lm, tx, ty), g = lm.grip.r;
    lm.pointAng = Math.atan2(v - g[1], u - g[0]); lm.pointLen = Math.max(50, Math.hypot(u - g[0], v - g[1]));
  }
  // Strawberry: tired, listening; every slam makes her jump a little, and on "four" she holds up four fingers
  const jump = sh.reduce((a, t0) => Math.max(a, lt >= t0 && lt < t0 + .22 ? Math.sin((lt - t0) / .22 * PI) * 12 * qS.s : 0), 0);
  const four = wordT('s1', 'four', b('s1').s + 1.24), up = sk(lt, four - .22, four + .06) * (1 - sk(lt, four + .5, four + .8));
  const sp = straw(Object.assign(qS, { look: [.62, .02], expr: 'dead', lid: .5, arms: { l: 'hips', r: 'rest' }, rot: .03 + .012 * Math.sin(lt * 1.3), sway: .05, lift: (qS.lift || 0) + jump, transit: tr }));
  if (up > .02) { handTo(sp, 1, sp.x + 150 * sp.s, sp.y - 330 * sp.s, up, [150, 90]); sp.hold = { r: 'fingers10' }; sp.hand = { r: 'fist' }; sp.fingerK = clamp((up - .35) / .65); }
  return { lm, sp, zs: P1CAST.S[1], zl: P1CAST.L[1] };
}
function p1shot(lt) { const b = id => B(id); return lt < 2.58 ? 'wide' : lt < b('s1').s - .05 ? 'ms' : lt < b('l2').s - .05 ? 'cuS' : 'cuL'; }
function p1cam(lt) {
  const b = id => B(id), sh = p1shot(lt), c = p1cast(lt), e = STAMP_AT();
  if (sh === 'wide') { const k = seg(lt, .5, 2.58); return feetCam(lerp(538, 543, k), lerp(.86, .9, k), { feet: 1433 }); }
  if (sh === 'ms') { const k = seg(lt, 2.58, b('s1').s), cam = feetCam(lerp(622, 632, k), lerp(1.04, 1.08, k)); cam.shake = e.reduce((a, t0) => a + kick(lt, t0, .22, 7), 0); return cam; }
  if (sh === 'cuS') { const k = seg(lt, b('s1').s - .05, b('s1').e), z = lerp(1.7, 1.82, k), [fx, fy] = faceC({ kind: 'straw', x: c.sp.x, y: c.sp.y, s: c.sp.s, lift: c.sp.lift }); return { x: fx + 10 - 20 * k, y: fy + 210 / z, z }; }
  const k = seg(lt, b('l2').s - .05, b('l2').e + .3), z = lerp(2.0, 2.16, k), [fx, fy] = faceC({ kind: 'lemon', x: c.lm.x, y: c.lm.y, s: c.lm.s });
  return { x: fx - 40, y: fy + 120 / z, z };
}
function p1draw(lt, F) {
  const sh = p1shot(lt), c = p1cast(lt, F), cu = sh === 'cuS' || sh === 'cuL';
  V2.setLight({ key: [-.4, -.8], keyColor: '#fff3dc', keyA: .26, rim: '#cfe0ff', rimA: .5, shadow: '#3a3048', shadowA: .3, bounce: '#ffe0b0', bounceA: .18, amb: '#fff6e6', ambA: .05 }); V2.opts.reflect = true;
  const tr = F && F.mode !== 'part';
  bgDof(cu ? 7 : 0, () => { hallSet(lt); V2.dust(40, 500, 1040, 1300, lt, { n: 30, alpha: .45, color: '255,246,214' }); });
  bgDof(cu ? 5 : 0, () => { boardSprite(lt, tr); stampLayer(lt); });
  const order = [['sp', c.zs, 'straw'], ['lm', c.zl, 'lemon']].sort((a, b2) => b2[1] - a[1]);
  for (const [k, , id] of order) { const o = c[k]; if ((cu && !((sh === 'cuS' && id === 'straw') || (sh === 'cuL' && id === 'lemon'))) || (sh === 'ms' && id === 'straw')) nbr(o); else drawChar(o); }
}

// ------------------------------------------------------------------ PART 2: THE STATION (10 days). Staff Appreciation Week, and one very large donut
const STN = { zb: 1900, hw: 760, ch: 900 };
const SPAD = { px: 236, py: 600, s: .22 };                 // the countdown pad on the station's back wall (scene px at identity camera)
const DN = { cx: 780, yb: 1040, R: 250, t: .4, H: 88, hr: 112 };   // the donut: centre x, y of the bottom ellipse, outer radius, tilt, thickness, hole radius (the stand's plate carries it)
const DN_YT = DN.yb - DN.H, DN_RY = DN.R * DN.t, DN_HRY = DN.hr * DN.t;
const tw = (str, size, o = {}) => { ctx.save(); ctx.font = `${o.weight || 400} ${size}px ${o.font || 'Bangers'}`; ctx.letterSpacing = (o.spacing || 0) + 'px'; const w = ctx.measureText(str).width; ctx.restore(); return w; };
const fitSize = (str, maxW, o = {}) => { ctx.save(); ctx.font = `${o.weight || 400} 100px ${o.font || 'Bangers'}`; ctx.letterSpacing = (o.spacing || 0) + 'px'; const w = ctx.measureText(str).width; ctx.restore(); return 100 * maxW / w; };
// copy of ep9_arrival's balloons: six bobbing balloons on strings from a weight on the floor
function balloons(Xc, Zc, t, seed) {
  const cols = ['#ff4f6d', '#ffd23a', '#4aa8ff', '#58c85a', '#c25bd6', '#ff9f1c'], k = kz(Zc), w = p2(Xc, 0, Zc);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#e9c34c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(w[0], w[1]); ctx.scale(k, k); rr(-22, -26, 44, 26, 5); ctx.fill(); ctx.stroke(); ctx.restore();
  const list = [];
  for (let i = 0; i < 6; i++) { const bob = Math.sin(t * 1.5 + i * 1.3 + seed) * 13, sway = Math.sin(t * 1.05 + i * .9 + seed) * 9; list.push({ i, x: Xc + (i - 2.5) * 36 + sway, y: 330 + (i % 3) * 58 + (i === 1 || i === 4 ? 40 : 0) + bob, z: Zc + (i % 2) * 20 }); }
  list.sort((a, b) => b.z - a.z);
  for (const b of list) {
    const q = p2(b.x, b.y, b.z), kk = kz(b.z), R = 62 * kk;
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kk); ctx.beginPath(); ctx.moveTo(w[0], w[1] - 24 * k); ctx.quadraticCurveTo(lerp(w[0], q[0], .5) + 16 * Math.sin(t + b.i), lerp(w[1], q[1], .6), q[0], q[1] + R * 1.12); ctx.stroke();
    ctx.fillStyle = V2.radial(q[0] - R * .3, q[1] - R * .35, R * .1, R * 1.1, [[0, '#ffffff'], [.25, cols[b.i]], [1, V2.rgba(V2.mix(cols[b.i], '#2a1030', .45), 1)]]);
    ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = Math.max(2, 2.6 * kk); ell(q[0], q[1], R * .82, R); ctx.fill(); ctx.stroke();
    ctx.fillStyle = cols[b.i]; ctx.beginPath(); ctx.moveTo(q[0] - 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0] + 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0], q[1] + R * 1.0 + 11 * kk); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(q[0] - R * .36, q[1] - R * .46, R * .14, R * .26, -.5); ctx.fill();
  }
  ctx.restore();
}
function sparkle(x, y, r, a, col = '#fff6c0') {   // a four-point glint (copy of ep9_floor's)
  if (a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const an = i * PI / 4 - PI / 2, R = i % 2 ? r * .22 : r; ctx.lineTo(Math.cos(an) * R, Math.sin(an) * R); } ctx.closePath(); ctx.fill(); ctx.restore();
}
function stationSet(lt, tr) {
  const { zb, hw, ch } = STN, k = kz(zb), t = lt + 3;
  shell({ zb, hw, ch, wall: '#f6e8cc', wain: '#4f8f96', floorA: '#dccfb4', floorB: '#aca28a', ceil: '#f5f2ea', fog: '#cdd6e4', fogAmt: .24, tile: 120, rail: 110, bright: 1.04 });
  S7.winPane(zb, { x0: 330, x1: 640, y0: 250, y1: 700 }, f => { A7.clouds(t, f[2][1] + 20, f[0][1] - 60, { n: 3, a: .9, speed: 6, seed: 3, scale: .5 }); }, { sky: [[0, '#6fb4f2'], [1, '#cfe9fb']], curtains: '#d98a5c' });
  // the call-light board, two lamps lit
  { const pts = [p2(-700, 330, zb), p2(-450, 330, zb), p2(-450, 740, zb), p2(-700, 740, zb)]; poly(pts, '#20242c', 'rgba(255,255,255,.18)', 2.4);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { const i = r * 4 + c, on = i === 9 || i === 22, [lx, ly] = p2(-676 + c * 56, 690 - r * 54, zb); ctx.fillStyle = on ? 'rgb(255,170,60)' : '#3a3f48'; ctx.beginPath(); ctx.ellipse(lx + 12 * k, ly, 13 * k, 17 * k, 0, 0, TAU); ctx.fill(); if (on) V2.glow(lx + 12 * k, ly, 70 * k, '255,170,60', .6, 'screen', .4); }
    const [cx0, cy0] = p2(-575, 775, zb); text('CALL LIGHTS', cx0, cy0, { size: 24 * k, fill: '#3a4556', weight: 900, spacing: 2 }); }
  // a corkboard of notices
  onZ(zb, -130, 230, 380, 660, '#b98a5a', 'rgba(25,16,30,.65)', 2.6); onZ(zb, -118, 218, 392, 648, '#d7b98a');
  [[-70, 600, '#fff3a6'], [20, 570, '#ffb3c6'], [120, 610, '#bfe3ff'], [170, 520, '#d8ffb0'], [-60, 490, '#ffe0a0'], [60, 450, '#d9c2ff'], [-10, 420, '#fff3a6']].forEach(([x, y, c]) => { onZ(zb, x - 34, x + 34, y - 36, y + 36, c, 'rgba(25,16,30,.35)', 1.2); for (let q = 0; q < 3; q++) onZ(zb, x - 24, x + 12 + q * 4, y + 16 - q * 14, y + 20 - q * 14, 'rgba(40,30,60,.45)'); });
  wallPad(SPAD.px, SPAD.py, SPAD.s, 10);
  for (const z of [300, 900, 1500]) { ceilingLamp(-300, z, ch, 1, '255,248,226'); ceilingLamp(300, z, ch, 1, '255,248,226'); }
  // the banner, hung across the top of the wall with a string of pennants
  { const X0 = -700, X1 = 700, Y0 = 745, Y1 = 885, wv = x => 4 * k * Math.sin(x * .008 + t * 1.6);
    const tl = p2(X0, Y1, zb), tr = p2(X1, Y1, zb), bl = p2(X0, Y0, zb), br = p2(X1, Y0, zb);
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(50,40,40,.7)'; ctx.lineWidth = 3; for (const [a, X] of [[tl, X0], [tr, X1]]) { const c = p2(X, 905, zb); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
    ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 14 * k; ctx.shadowOffsetY = 8 * k; ctx.fillStyle = V2.grad(0, tl[1], 0, bl[1], [[0, '#2f7fe0'], [1, '#1a56b0']]); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = Math.max(4, 7 * k);
    ctx.beginPath(); ctx.moveTo(tl[0], tl[1] + wv(0)); for (let i = 1; i <= 24; i++) ctx.lineTo(lerp(tl[0], tr[0], i / 24), tl[1] + wv(i * 36)); for (let i = 24; i >= 0; i--) ctx.lineTo(lerp(bl[0], br[0], i / 24), bl[1] + wv(i * 36 + 90)); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
    const mw = (tr[0] - tl[0]) * .84, size = fitSize('STAFF APPRECIATION WEEK', mw, { spacing: 4 }), cx0 = (tl[0] + tr[0]) / 2, cy0 = (tl[1] + bl[1]) / 2 + 2 * k;
    ctx.save(); ctx.translate(cx0, cy0); text('STAFF APPRECIATION WEEK', 0, 0, { size, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: size * .1, stroke: '#0e2c66', spacing: 4 }); ctx.restore();
    for (let i = 0; i < 17; i++) { const u = (i + .5) / 17, px = lerp(bl[0], br[0], u), py = bl[1] + wv(u * 24 * 36 + 90) + 3; ctx.fillStyle = ['#ffd23a', '#ff5a7a', '#58c85a', '#ff9f1c', '#c25bd6'][i % 5]; ctx.strokeStyle = 'rgba(30,16,36,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 15 * k, py); ctx.lineTo(px + 15 * k, py); ctx.lineTo(px, py + 30 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    regLocal('key', Math.min(tl[0], bl[0]) + (tr[0] - tl[0]) * .07, tl[1] - 4, Math.max(tr[0], br[0]) - (tr[0] - tl[0]) * .07, bl[1] + 4, { id: 'banner', transit: tr }); }
  plant3(690, 1500, 1.0); plant3(-690, 1560, .9);
  S7.stationCounter({ night: false });
  balloons(-620, 1580, t, 0); balloons(610, 1600, t, 2.3);
  // paper confetti on the floor
  ctx.save(); for (let i = 0; i < 46; i++) { const [x, y] = p2((hash(i) * 2 - 1) * 520, 0, 700 + hash(i + 9) * 800), kk = kz(700 + hash(i + 9) * 800); ctx.fillStyle = ['#ffaa28', '#50a5ff', '#5ae682', '#ff4646', '#ff7ad9', '#ffffff'][i % 6]; ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i + 4) * 3); ctx.scale(1, .45); ctx.fillRect(-7 * kk, -4 * kk, 14 * kk, 8 * kk); ctx.restore(); } ctx.restore();
}
// the donut, drawn in two passes: 'all' is the whole thing, 'near' only what stands in front of someone inside the hole (the front half of the ring and the outside wall)
function donut(part, w) {
  const { cx, yb, R, t, H, hr } = DN, yt = DN_YT, ry = DN_RY, hry = DN_HRY, near = part === 'near';
  ctx.save();
  const sx = 1 + .06 * w.sq, sy = 1 - .1 * w.sq;   // squash about the plate; w.dx pushes the whole thing sideways when it is poked
  ctx.translate(cx + w.dx, yb + ry); ctx.scale(sx, sy); ctx.transform(1, 0, w.lean || 0, 1, -(w.lean || 0) * 0, 0); ctx.translate(-cx, -(yb + ry));
  if (near) { ctx.beginPath(); ctx.rect(cx - R * 1.4, yt, R * 2.8, H * 3); ctx.clip(); }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // the outside wall: dough, darker toward the plate, with the glaze dripping over its top edge
  ctx.beginPath(); ctx.moveTo(cx - R, yt); ctx.bezierCurveTo(cx - R * 1.04, yt + H * .5, cx - R * .99, yb - 6, cx - R * .96, yb); ctx.ellipse(cx, yb, R * .96, ry * .96, 0, PI, 0, true);
  ctx.bezierCurveTo(cx + R * .99, yb - 6, cx + R * 1.04, yt + H * .5, cx + R, yt); ctx.ellipse(cx, yt, R, ry, 0, 0, PI, false); ctx.closePath();
  ctx.fillStyle = V2.grad(0, yt, 0, yb + ry, [[0, '#f0bd6e'], [.55, '#d58f40'], [1, '#9a5a22']]); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(120,60,10,.18)'; for (let i = 0; i < 40; i++) { ell(cx + (hash(i) * 2 - 1) * R * .95, yt + ry * .5 + hash(i + 7) * (H + ry), 5 + hash(i + 3) * 8, 2.5 + hash(i + 5) * 3); ctx.fill(); }   // crumb
  ctx.fillStyle = V2.grad(cx - R, 0, cx + R, 0, [[0, 'rgba(255,255,255,.16)'], [.35, 'rgba(255,255,255,0)'], [1, 'rgba(40,10,0,.3)']]); ctx.fillRect(cx - R * 1.1, yt - 10, R * 2.2, H + ry + 20); ctx.restore();
  for (let i = 0; i < 17; i++) {   // drips over the front edge
    const a = PI * (.06 + .88 * (i + hash(i + 4) * .6) / 17), x = cx + Math.cos(a) * R * .995, y = yt + Math.sin(a) * ry, len = 12 + 38 * hash(i + 9) ** 1.6, wd = 9 + 7 * hash(i + 1);
    ctx.fillStyle = V2.grad(0, y, 0, y + len, [[0, '#ff86b8'], [1, '#e8508c']]); ctx.strokeStyle = '#a22660'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - wd, y - 6); ctx.lineTo(x - wd * .8, y + len * .6); ctx.arc(x, y + len * .6, wd * .8, PI, 0, true); ctx.lineTo(x + wd, y - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(x - wd * .35, y + len * .4, 2.4, 6); ctx.fill();
  }
  if (!near) {   // the inside of the hole: the far wall of the dough, in shadow, with the glaze edge along its top
    const Hin = H * .86;
    ctx.beginPath(); ctx.ellipse(cx, yt, hr, hry, 0, PI, 0, false); ctx.lineTo(cx + hr * .97, yt + Hin); ctx.ellipse(cx, yt + Hin, hr * .97, hry * .97, 0, 0, PI, true); ctx.closePath();
    ctx.fillStyle = V2.grad(0, yt - hry, 0, yt + Hin, [[0, '#a8672a'], [1, '#6a3a14']]); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, yt + Hin, hr * .97, hry * .97, 0, 0, PI, true); ctx.fillStyle = '#7a4a22'; ctx.fill();
  }
  // the top: a ring of pink glaze
  ctx.beginPath(); ctx.ellipse(cx, yt, R, ry, 0, 0, TAU); ctx.ellipse(cx, yt, hr, hry, 0, 0, TAU, true);
  ctx.fillStyle = V2.grad(cx - R, yt - ry, cx + R, yt + ry, [[0, '#ffa3c8'], [.5, '#ff72ac'], [1, '#e4488a']]); ctx.fill('evenodd'); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, yt, R, ry, 0, 0, TAU); ctx.ellipse(cx, yt, hr, hry, 0, 0, TAU, true); ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(160,30,90,.35)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(cx, yt, hr * 1.12, hry * 1.12, 0, 0, TAU); ctx.stroke();      // the glaze pools around the hole
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.ellipse(cx, yt - 4, (R + hr) / 2, (ry + hry) / 2, 0, PI * 1.05, PI * 1.5); ctx.stroke();   // the window glint
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(cx, yt - 4, (R + hr) / 2, (ry + hry) / 2, 0, PI * 1.58, PI * 1.72); ctx.stroke();
  for (let i = 0; i < 84; i++) {   // sprinkles
    const th = hash(i * 1.7) * TAU, rho = lerp(hr * 1.16, R * .93, Math.sqrt(hash(i + 31))), x = cx + Math.cos(th) * rho, y = yt + Math.sin(th) * rho * t;
    if (th > PI * 1.05 && th < PI * 1.5 && Math.abs(rho - (R + hr) / 2) < 20) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i + 11) * PI); ctx.scale(1, .72); ctx.fillStyle = ['#ffffff', '#ffe135', '#3ab0ff', '#4cd964', '#ff9f1c', '#a78bfa'][i % 6]; ctx.strokeStyle = 'rgba(80,20,50,.55)'; ctx.lineWidth = 1.6; rr(-9, -3.4, 18, 6.8, 3.4); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  // the "1" flag: a toothpick and a tiny pennant in the glaze at the front right, waving
  { const fx = cx + R * .52, fy = yt + ry * .62, wave = Math.sin(w.t * 5) * .1 + w.flag * .5;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(.1 + w.flag * .3); ctx.strokeStyle = '#d8b46a'; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -92); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.translate(0, -90); ctx.rotate(wave); ctx.fillStyle = '#e8283e'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(48, 4 + 3 * Math.sin(w.t * 7)); ctx.lineTo(0, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
    text('1', 15, 19, { size: 28, font: 'Bangers', weight: 400, fill: '#fff', lw: 0 }); ctx.restore(); }
  ctx.restore();
}
function donutStand() {   // a cake stand: a wide plate on a column and a foot, on the floor at Z 1250
  const { cx, yb, R } = DN, pr = R + 40, pry = pr * DN.t, yp = yb + 22, fy = 1263;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.fillStyle = 'rgba(20,14,40,.25)'; ell(cx + 20, fy + 6, pr * .8, 26); ctx.fill();
  for (const dx of [-96, 96]) { ctx.fillStyle = '#25232c'; ell(cx + dx, fy + 16, 17, 17); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9aa3b2'; ell(cx + dx, fy + 16, 6, 6); ctx.fill(); }   // casters
  ctx.fillStyle = V2.grad(cx - 120, 0, cx + 120, 0, [[0, '#a8301f'], [.5, '#e8503a'], [1, '#8a2418']]); ctx.beginPath(); ctx.ellipse(cx, fy, 130, 28, 0, 0, TAU); ctx.fill(); ctx.stroke();   // the foot
  ctx.fillStyle = V2.grad(cx - 40, 0, cx + 40, 0, [[0, '#c9ced8'], [.45, '#f4f6fa'], [1, '#9aa3b2']]); rr(cx - 36, yp + pry * .7, 72, fy - yp - pry * .7, 12); ctx.fill(); ctx.stroke();   // the column
  ctx.fillStyle = '#d6dae2'; ctx.beginPath(); ctx.ellipse(cx, yp + 14, pr, pry, 0, 0, PI); ctx.lineTo(cx - pr, yb); ctx.ellipse(cx, yb, pr, pry, 0, PI, 0, true); ctx.closePath(); ctx.fill(); ctx.stroke();   // the plate's rim
  ctx.fillStyle = V2.grad(cx - pr, yb - pry, cx + pr, yb + pry, [[0, '#ffffff'], [1, '#d9dee8']]); ctx.beginPath(); ctx.ellipse(cx, yb, pr, pry, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(cx, yb, pr - 12, pry - 5, 0, 0, TAU); ctx.stroke();
  ctx.restore();
}
// the little sign on the stand's foot: ONE PER NURSE
function donutSign() {
  const x = DN.cx + 14, y = 1216;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.04);
  ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 68); ctx.lineTo(0, 12); ctx.stroke();
  ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-82, -52, 164, 70, 8); ctx.fill(); ctx.stroke();
  text('ONE PER', 0, -30, { size: 26, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 2 }); text('NURSE', 0, -2, { size: 32, font: 'Bangers', weight: 400, fill: '#1f3f9a', spacing: 2 });
  ctx.restore();
}
const P2POS = { M: [-178, 1000], S: [40, 1180], G: [395, 1100] };   // Melon, Strawberry, Mango (X, Z): Mango's is where she ends up, beside the stand
const P2T = () => ({ poke: wordT('a2', 'very', B('a2').s + .34), hop: wordT('a2', 'large', B('a2').s + .6), stop: wordT('a1', 'donut', B('a1').s + 1.62) + .03, roll0: 11.2, one: wordT('a1', 'one', B('a1').s + 1.36) });
// the donut arrives on its casters from the right, pushed by Mango, and stops dead on "donut"
const rollX = (lt, T2) => { const u = seg(lt, T2.roll0, T2.stop); return u >= 1 ? 0 : 800 * Math.pow(1 - u, 1.8); };
const rollV = (lt, T2) => { const u = seg(lt, T2.roll0, T2.stop); return u <= 0 || u >= 1 ? 0 : 800 * 1.8 * Math.pow(1 - u, .8) / (T2.stop - T2.roll0); };
function p2cast(lt, F) {
  const b = id => B(id), tr = F && F.mode !== 'part', T2 = P2T(), ox = rollX(lt, T2);
  const qM = V2.at(...P2POS.M), qS = V2.at(...P2POS.S), qG = V2.at(...P2POS.G);
  const hat = ['partyhat'];
  // the Administrator: jazz hands for the title, a presenting sweep as the donut arrives, hands on his hips once it is there
  const shake = Math.sin(lt * 21), jazz = lt < T2.one - .1, sweep = lt >= T2.one - .1 && lt < b('s2').s;
  const me = melon(Object.assign(qM, { acc: ['suit', 'nametag9', ...hat], look: sweep ? [.7, -.1] : [.1, -.1], expr: 'happy', transit: tr, arms: { l: 'rest', r: 'rest' }, hand: {} }));
  if (jazz) { me.arms = { l: [2.9 + .1 * shake, .2 + .16 * shake], r: [2.9 - .1 * shake, .2 - .16 * shake] };   /* hands up over his head, wiggling: they stay inside the frame */ me.hand = { l: 'wave', r: 'wave' }; }
  else if (sweep) { handTo(me, 1, me.x + 330, me.y - 205, sk(lt, T2.one - .1, T2.one + .3), [96, 40]); me.hand = { r: 'open' }; me.arms.l = 'hips'; }
  else me.arms = { l: 'hips', r: 'hips' };
  // Strawberry: tiny, dead-eyed, in the hat she was handed; at the end she looks straight into the lens
  const toCam = sk(lt, T2.hop + .3, T2.hop + .6);
  const sp = straw(Object.assign(qS, { acc: ['steth', 'bandage7', 'badge', ...hat], look: lerpA2([.55, -.1], [0, 0], toCam), expr: 'dead', lid: .5, arms: { l: 'rest', r: 'rest' }, rot: .02, sway: .04, transit: tr }));
  // Mango: pushes the donut in, claps, pokes it, hops up onto the stand and into the hole
  const crouch = sk(lt, T2.hop - .12, T2.hop) * (1 - sk(lt, T2.hop, T2.hop + .05)), fl = seg(lt, T2.hop, T2.hop + .34), land = lt >= T2.hop + .34 ? Math.max(0, 1 - (lt - T2.hop - .34) / .14) : 0;
  const pushing = lt >= T2.roll0 - .1 && lt < T2.stop + .08, gRest = DN.cx + 320;
  let mg;
  if (lt < T2.roll0 - .1) mg = null;
  else if (pushing) {
    const pathG = t => [(DN.cx + rollX(t, T2) + 322 - 540) / kz(1100) / 1 * 1, 1100];   // placeholder, replaced below
    mg = runner(mango, t => [((DN.cx + rollX(t, T2) + 322) - 540) / (1400 / 1100), 1100], lt, { look: [-.6, 0], expr: 'happy', acc: ['badge7', 'gaitbelt7', 'keys7', ...hat], badgeText: 'CNA', transit: tr || lt < T2.stop }, 320);
    handTo(mg, -1, DN.cx + ox + DN.R + 32, DN.yb + 28, 1, [-100, 40]); mg.hand = { l: 'flat' }; mg.arms.r = 'run';
    void pathG;
  } else {
    const gx = lerp(qG.x, DN.cx, easeIO(fl)), gyF = lerp(qG.y, DN.yb, easeIn(fl)) - 290 * Math.sin(fl * PI), gs = lerp(qG.s, kz(1250), fl);
    mg = mango({ x: gx, y: lt >= T2.hop ? gyF : qG.y, s: gs, look: [-.5, -.1], expr: lt >= T2.hop ? 'hopeful' : 'happy', acc: ['badge7', 'gaitbelt7', 'keys7', ...hat], badgeText: 'CNA', arms: { l: 'rest', r: 'rest' }, transit: tr, squash: .22 * crouch + .16 * land, plant: true });
    if (lt >= T2.hop) { mg.arms = { l: 'cheer', r: 'cheer' }; mg.noShadow = true; mg.noReflect = true; if (lt >= T2.hop + .34) { mg.arms = { l: 'cheer', r: 'wave' }; mg.expr = 'happy'; } }
    else if (lt >= T2.poke - .2 && lt < T2.poke + .45) { const k = sk(lt, T2.poke - .2, T2.poke) * (1 - sk(lt, T2.poke + .2, T2.poke + .45)); handTo(mg, -1, DN.cx + DN.R * .96, DN_YT + 70, k, [-100, 40]); mg.hand = { l: 'point' }; }
    else { const c = .5 + .5 * Math.sin(lt * 17); mg.grip = { l: [-lerp(8, 52, c), 74], r: [lerp(8, 52, c), 74] }; mg.arms = { l: 'hold', r: 'hold' }; mg.hand = { l: 'flat', r: 'flat' }; }
  }
  const gyNow = mg && lt >= T2.hop ? mg.y : 0, inHole = lt >= T2.hop && mg && ((fl >= 1) || (gyNow >= DN_YT + DN_HRY - 10 && fl > .5));
  return { me, sp, mg, inHole, zs: P2POS.S[1], zm: P2POS.M[1], T2, ox };
}
function p2wob(lt) {   // the donut's squash, push, lean and flag: it jolts when it stops, is poked once, and is jolted again when someone lands in the hole
  const T2 = P2T(), a = wob(lt, T2.poke, 3.6, 3.0), c = wob(lt, T2.hop + .34, 3.0, 2.6), d = wob(lt, T2.stop, 3.4, 3.0), v = rollV(lt, T2);
  return { sq: .55 * a + 1.0 * c + .8 * d + (lt >= T2.hop + .34 && lt < T2.hop + .4 ? .3 : 0), dx: -16 * a * (lt > T2.poke ? 1 : 0), lean: -.00007 * v + .1 * d, flag: .6 * Math.abs(a) + .6 * Math.abs(c) + .8 * Math.abs(d) + (v > 0 ? .6 : 0), t: lt };
}
function p2shot(lt) { const b = id => B(id); return lt < 11.35 ? 'ms1' : lt < b('s2').s - .06 ? 'wide2' : lt < b('a2').s - .06 ? 'cuS' : 'wide3'; }
function p2cam(lt) {
  const b = id => B(id), sh = p2shot(lt), c = p2cast(lt);
  const wide = k => feetCam(lerp(680, 700, k), lerp(.84, .9, k), { feet: 1369 }), ms1 = k => feetCam(510, lerp(1.0, 1.07, k), { feet: 1369 });
  if (sh === 'ms1') return ms1(seg(lt, 10.7, 11.5));
  if (sh === 'wide2') return mixCam(ms1(1), wide(0), easeIO(seg(lt, 11.95, 12.75)));
  if (sh === 'cuS') { const k = seg(lt, b('s2').s - .06, b('s2').e), z = lerp(1.8, 1.9, k), [fx, fy] = faceC({ kind: 'straw', x: c.sp.x, y: c.sp.y, s: c.sp.s }); return { x: fx + 40, y: fy + 150 / z, z }; }
  return wide(seg(lt, b('a2').s - .06, b('a2').e + .4));
}
function p2draw(lt, F) {
  const sh = p2shot(lt), c = p2cast(lt, F), cu = sh === 'cuS', w = p2wob(lt), T2 = c.T2;
  V2.setLight({ key: [-.35, -.8], keyColor: '#fff0d0', keyA: .28, rim: '#ffb0d8', rimA: .5, shadow: '#3a2a50', shadowA: .3, bounce: '#ffd9a0', bounceA: .2, amb: '#fff2e0', ambA: .05 }); V2.opts.reflect = true;
  const tr = F && F.mode !== 'part';
  bgDof(cu ? 7 : 0, () => { stationSet(lt, tr); confetti(lt, 10.9, 46); });
  V2.addLight({ x: 120, y: 700, r: 900, color: '255,120,180', a: .3 }); V2.addLight({ x: 980, y: 760, r: 900, color: '120,200,255', a: .26 });
  const stand = () => { ctx.save(); ctx.translate(c.ox, 0); donutStand(); donutSign(); donut('all', w);
    const sweep = seg(lt, T2.stop - .02, T2.stop + .5);   // glints that come and go on the glaze, and a shine that sweeps across it as it arrives
    for (let i = 0; i < 6; i++) { const q = ((lt * .5 + i * .17) % 1), a = Math.sin(q * PI) ** 2; sparkle(DN.cx + (hash(i + 3) * 2 - 1) * DN.R * .8, DN_YT + (hash(i + 8) * 2 - 1) * DN_RY * .7 - 6, 14 + 10 * hash(i), a * .9); }
    if (sweep > 0 && sweep < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const x0 = lerp(DN.cx - DN.R * 1.3, DN.cx + DN.R * 1.3, easeIO(sweep)); ctx.fillStyle = V2.grad(x0 - 90, 0, x0 + 90, 0, [[0, 'rgba(255,255,255,0)'], [.5, `rgba(255,255,255,${.55 * Math.sin(sweep * PI)})`], [1, 'rgba(255,255,255,0)']]);
      ctx.beginPath(); ctx.ellipse(DN.cx, DN_YT, DN.R, DN_RY, 0, 0, TAU); ctx.ellipse(DN.cx, DN_YT, DN.hr, DN_HRY, 0, 0, TAU, true); ctx.clip('evenodd'); ctx.fillRect(x0 - 100, DN_YT - DN_RY, 200, DN_RY * 2); ctx.restore(); }
    ctx.restore(); };
  if (c.ox < 700 || cu) bgDof(cu ? 5 : 0, stand);
  const list = [['sp', c.zs, 'straw'], ['me', c.zm, 'melon']].sort((a, b2) => b2[1] - a[1]);
  const focus = cu ? 'straw' : null, show = (o, id) => (focus && id !== focus ? nbr : drawChar)(o);
  if (c.inHole) { drawChar(c.mg); ctx.save(); ctx.translate(c.ox, 0); donut('near', w); ctx.restore(); for (const [k, , id] of list) show(c[k], id); }   // Strawberry and Melon stand nearer than the donut: they are drawn after its front half
  else { for (const [k, , id] of list) show(c[k], id); if (c.mg) show(c.mg, 'mango'); }
  // the dust where the stand stops dead
  { const u = seg(lt, T2.stop, T2.stop + .6); if (u > 0 && u < 1) for (let i = 0; i < 6; i++) { const a = (i / 6) * PI + .1, px = DN.cx + (i % 2 ? -1 : 1) * (60 + 140 * u) * Math.abs(Math.cos(a)) * 1.1 + 150, py = 1260 - 30 * u * (1 + i % 3 * .4), r = (40 + 46 * u) * (.7 + hash(i) * .6); ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(230,226,240,${.5 * (1 - u)})`], [1, 'rgba(230,226,240,0)']]); ctx.fillRect(px - r, py - r, r * 2, r * 2); } }
}

// ------------------------------------------------------------------ PART 3: THE BREAK ROOM (7 days). A tired fluorescent room, a tablet, and two job postings for the same job
const BRK = { zb: 2200, hw: 460, ch: 700 };
const BRK_CAM = { f: 1400, cy: 470, hy: 640 };              // a slightly raised camera: the wall stays clear above the heads, which is where the calendar hangs
const BPADR = { px: 502, py: 500, s: .2 };
const SEAT3 = [10, 1130], TAB3 = [20, 1060], MG3 = [270, 1040], AD3 = [-250, 1010];
const tube3 = lt => (lt > 18.0 && lt < 18.08) || (lt > 20.1 && lt < 20.3) || (lt > 22.5 && lt < 22.58) ? (hash(Math.floor(lt * 15) + 5) > .45 ? 1 : .1) : (hash(Math.floor(lt * 7) + 2) > .93 ? .55 : 1);   // a tired tube: mostly steady, now and then it hiccups
function breakSet(lt) {
  const { zb, hw, ch } = BRK, tb = tube3(lt), k = kz(zb);
  shell({ zb, hw, ch, wall: '#cdd8d3', wain: '#4f7b83', floorA: '#bcc7c3', floorB: '#8d9a98', ceil: '#dfe8e6', fog: '#8fa4ac', fogAmt: .3, tile: 110, bright: .96, rail: 100 });
  backWindow(zb, { x0: 130, x1: 350, y0: 200, y1: 470, sky: ['#9aa6b2', '#cfd6dc'], mull: 2, beam: '200,215,225', beamA: .1, beamLen: 700, beamDx: -140,
    draw: f => { const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1; ctx.fillStyle = '#7e8a96'; for (let i = 0; i < 7; i++) { rr(fx0 + w * hash(i) * .9, fy0 - h * (.1 + .22 * hash(i + 4)), w * .16, h * .24, 3); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(fx0, fy1, w, h * .3); } });   // an overcast afternoon and a grey parking lot
  // the door into the hall and its dark call-light dome
  onZ(zb, -264, -96, 0, 444, '#e3ebe8', 'rgba(25,16,30,.6)', 2.4); onZ(zb, -250, -110, 0, 430, '#a8bac1', 'rgba(25,16,30,.6)', 2); onZ(zb, -214, -146, 250, 380, 'rgba(212,236,250,.5)', 'rgba(25,16,30,.4)', 1.6);
  { const [dx, dy] = p2(-180, 540, zb - 4); ctx.save(); ctx.translate(dx, dy); ctx.scale(k, k); ctx.fillStyle = '#e8eef0'; ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = 3; rr(-48, -18, 96, 36, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7a2a30'; ctx.beginPath(); ctx.ellipse(0, -18, 32, 28, 0, PI, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // the countdown pad, between the door and the window, high enough that nobody's head reaches it
  wallPad(BPADR.px, BPADR.py, BPADR.s, 7);
  // vending machine back left, fridge back right, a counter along the right wall with the microwave, a corkboard on the left wall
  box3({ x0: -440, x1: -300, y1: 430, z0: 2000, z1: 2130, color: '#2a4f96', front: '#3566b4', side: '#21407a' }); onZ(2000, -424, -318, 150, 400, 'rgba(225,246,255,.82)', 'rgba(15,20,40,.8)', 2);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) onZ(2000, -414 + c * 32, -394 + c * 32, 180 + r * 58, 212 + r * 58, ['#e8193a', '#ffd23a', '#58b83a', '#ff9f1c'][(r + c) % 4]);
  { const [vx, vy] = p2(-370, 280, 2000); V2.glow(vx, vy, 300 * kz(2000), '190,235,255', .3, 'screen', .35); }
  box3({ x0: 340, x1: 450, y1: 480, z0: 2040, z1: 2180, color: '#e9eef2', front: '#f4f7fa', side: '#c9d2d9' }); onZ(2040, 350, 440, 235, 239, 'rgba(0,0,0,.25)'); onZ(2040, 352, 360, 300, 420, '#aab4bd');
  box3({ x0: 250, x1: 450, y1: 200, z0: 1100, z1: 2030, color: '#c9d3d3', top: '#55606a', front: '#b9c4c6', side: '#98a6a8' });
  { const X = -hw, q = [p2(X, 250, 1250), p2(X, 250, 1750), p2(X, 450, 1750), p2(X, 450, 1250)]; poly(q, '#b98a5a', 'rgba(25,16,30,.7)', 3); poly([p2(X, 262, 1262), p2(X, 262, 1738), p2(X, 438, 1738), p2(X, 438, 1262)], '#d7b98a');
    for (const [z, y, c] of [[1330, 380, '#fff3a6'], [1470, 340, '#ffb3c6'], [1600, 390, '#bfe3ff'], [1690, 330, '#d8ffb0'], [1400, 290, '#ffe0a0']]) poly([p2(X, y, z - 36), p2(X, y, z + 36), p2(X, y + 56, z + 36), p2(X, y + 56, z - 36)], c, 'rgba(25,16,30,.35)', 1.4); }
  S6.microwave(350, 1500, { on: 0, display: '3:34' });
  // two fluorescent panels, the near one the tired one
  ceilingLamp(0, 760, ch, tb, '210,234,255', 110, 170); ceilingLamp(0, 1480, ch, 1, '210,234,255', 110, 170);
  return tb;
}
// the tablet in Mango's hand: a dark slab with a lit screen showing two cards (the detail lives in the insert)
Object.assign(PROP_BOX, { tablet10: Object.assign([-72, -158, 72, 16], { nearFace: true }) });
EXT.prop.tablet10 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .1 + (o.tabTilt || 0)); ctx.lineJoin = 'round';
  ctx.fillStyle = '#20232c'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-64, -150, 128, 164, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8f2ff'; rr(-54, -140, 108, 144, 6); ctx.fill();
  ctx.fillStyle = '#2a78b8'; ctx.fillRect(-54, -140, 108, 16); text('JOBS', 0, -132, { size: 11, fill: '#fff', spacing: 1.5 });
  for (const [y, c] of [[-116, '#ffffff'], [-58, '#ffffff']]) { ctx.fillStyle = c; ctx.strokeStyle = 'rgba(60,70,90,.45)'; ctx.lineWidth = 1.6; rr(-48, y, 96, 50, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(40,50,80,.5)'; ctx.fillRect(-42, y + 6, 54, 6); ctx.fillStyle = '#d6203a'; ctx.fillRect(-42, y + 20, 30, 12); ctx.fillStyle = 'rgba(40,50,80,.3)'; ctx.fillRect(-42, y + 38, 70, 5); }
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(-54, -140); ctx.lineTo(-10, -140); ctx.lineTo(-54, -80); ctx.closePath(); ctx.fill();
  ctx.restore();
};
// a big white glove (the Episode 6 hand, scaled) for the inserts, the arm trailing off the near edge
function glove2(x, y, ang, sc, kind = 'grip', side = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc * side);
  ctx.fillStyle = LIMB; ctx.beginPath(); ctx.roundRect(-250, -9, 232, 18, 8); ctx.fill(); ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-26, -8.5, 10, 17, 3); ctx.fill();
  ctx.translate(-16, 0); V2C.hand(kind, 1, {}); ctx.restore();
}
// the job board, full frame: two postings of the same job, word for word, and the pay that appears as Strawberry reads it out
function insTablet(lt) {
  const b = id => B(id), tA = 18.25, tCardB = wordT('m1', 'twice', b('m1').s + 1.2) - .06, tP1 = wordT('s3', 'thirty', b('s3').s), tP2 = wordT('s3', 'hundred', b('s3').s + 1.25), tP2b = wordT('s3', 'eighteen', b('s3').s + 1.78);
  A6.bokeh(lt, ['150,220,200', '120,170,255'], ['#0c1a22', '#14303c']);
  const sway = Math.sin(lt * 1.4) * .006, push = 1 + .03 * seg(lt, tA, 22.0), pop0 = easeBack(seg(lt, tA - .05, tA + .22));
  ctx.save(); ctx.translate(540, 790); ctx.rotate(sway); ctx.scale(push * lerp(.8, 1, pop0), push * lerp(.8, 1, pop0)); ctx.translate(-540, -790); ctx.globalAlpha *= clamp(pop0 * 3);
  const X0 = 120, Y0 = 240, TW = 840, TH = 1100;
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 20; ctx.fillStyle = '#1a1c24'; rr(X0, Y0, TW, TH, 58); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#3a3e4c'; ctx.lineWidth = 5; rr(X0, Y0, TW, TH, 58); ctx.stroke();
  const sx = X0 + 26, sy = Y0 + 26, sw = TW - 52, sh = TH - 52;
  ctx.save(); rr(sx, sy, sw, sh, 36); ctx.clip();
  ctx.fillStyle = '#eef3f8'; ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = '#1d4f8a'; ctx.fillRect(sx, sy, sw, 124);                                                             // header bar
  text('FRUIT BOWL CAREERS', sx + 32, sy + 52, { size: 40, font: 'Bangers', weight: 400, fill: '#fff', align: 'left', spacing: 3 }); text('OPEN POSITIONS: 2', sx + 32, sy + 98, { size: 26, fill: '#bcd6f2', align: 'left', spacing: 3 });
  text('3:00', sx + sw - 32, sy + 52, { size: 30, fill: '#fff', align: 'right' });
  const CH = 396;
  const card = (y, o) => {   // one posting
    ctx.save(); ctx.translate(0, o.dy || 0); ctx.globalAlpha *= o.a ?? 1;
    ctx.shadowColor = 'rgba(30,50,90,.28)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = '#fff'; rr(sx + 26, y, sw - 52, CH, 28); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = o.edge; ctx.lineWidth = 5; rr(sx + 26, y, sw - 52, CH, 28); ctx.stroke();
    text(o.title, sx + 60, y + 46, { size: 56, font: 'Bangers', weight: 400, fill: '#1a2a4a', align: 'left', spacing: 2 });
    ctx.fillStyle = o.chip; rr(sx + 60, y + 80, 250, 38, 19); ctx.fill(); text(o.sub, sx + 185, y + 99, { size: 21, fill: '#fff', spacing: 2 });
    text('Passes meds. Answers call lights.', sx + 60, y + 142, { size: 28, fill: '#46506a', weight: 800, align: 'left' }); text('Finds the good cuff. Absorbs the building.', sx + 60, y + 174, { size: 28, fill: '#46506a', weight: 800, align: 'left' });
    const k = o.pay, pk = easeBack(clamp(k)), shown = k > 0;   // the pay: a dim slot until it pops
    if (!shown) { ctx.fillStyle = '#e6ebf2'; rr(sx + 60, y + 208, 330, 92, 18); ctx.fill(); text('PAY: ????', sx + 225, y + 254, { size: 42, font: 'Bangers', weight: 400, fill: '#aab4c6', spacing: 3 }); }
    else { ctx.save(); ctx.translate(sx + 60, y + 254); ctx.scale(lerp(1.5, 1, pk), lerp(1.5, 1, pk)); text(o.money, 0, 0, { size: 116, font: 'Bangers', weight: 400, fill: o.moneyCol, align: 'left', spacing: 2, lw: 0 }); ctx.restore(); }
    ctx.fillStyle = '#e9eef6'; rr(sx + 60, y + 308, sw - 172, 66, 33); ctx.fill();   // applicants: the number is big, the word small
    if (o.num) { const nz = 54; text(o.num, sx + 92, y + 343, { size: nz, font: 'Bangers', weight: 400, fill: o.numCol, align: 'left', spacing: 2 }); text('applicants', sx + 92 + tw(o.num, nz, { spacing: 2 }) + 14, y + 345, { size: 30, fill: '#2a3a5a', weight: 900, align: 'left' }); }
    const dots = o.dots; for (let i = 0; i < dots; i++) { ctx.fillStyle = ['#ff8a94', '#ffd23f', '#c79be0', '#7bd47e', '#ffb347', '#8ac8ff'][i % 6]; ell(sx + sw - 128 - i * 22, y + 341, 12, 12); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  };
  const ya = sy + 148, yb = sy + 148 + CH + 66;
  const a1 = easeOut(seg(lt, tA - .05, tA + .3));
  card(ya, { title: 'NURSE (STAFF)', sub: 'FULL-TIME  3-11', chip: '#2a8a5a', edge: '#2a8a5a', pay: seg(lt, tP1, tP1 + .2), money: '$34.00/hr', moneyCol: '#1c7a4c', num: '2', numCol: '#1c7a4c', dots: 2, dy: (1 - a1) * 120, a: a1 });
  const bk = easeBack(seg(lt, tCardB, tCardB + .28)), roll = clamp((lt - tP2) / (tP2b - tP2 - .1)), mon = lt >= tP2 ? '$' + (lt >= tP2b ? 118 : Math.round(lerp(100, 118, roll))) + '.00/hr' : '';
  if (bk > .01) card(yb, { title: 'NURSE (AGENCY)', sub: 'PER DIEM  3-11', chip: '#7a3fb0', edge: '#7a3fb0', pay: seg(lt, tP2, tP2 + .2), money: mon, moneyCol: '#b07a00', num: lt >= tCardB ? Math.round(4000 * easeOut(seg(lt, tCardB + .2, tCardB + .9))).toLocaleString('en-US') : '', numCol: '#7a3fb0', dots: 12, dy: (1 - bk) * 160, a: clamp(bk * 2) });
  // the "same job" badge between them, and the red POSTED TWICE stamp
  const eq = easeBack(seg(lt, tCardB + .12, tCardB + .4));
  if (eq > .01) { ctx.save(); ctx.translate(sx + sw / 2, ya + CH + 33); ctx.scale(eq, eq); ctx.fillStyle = '#1a2a4a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; rr(-262, -27, 524, 54, 27); ctx.fill(); ctx.stroke(); text('=  SAME JOB, WORD FOR WORD', 0, 2, { size: 25, fill: '#fff', spacing: 2 }); ctx.restore(); }
  const st = easeBack(seg(lt, tCardB + .55, tCardB + .78));
  if (st > .01) { ctx.save(); ctx.translate(sx + sw - 250, ya + 70); ctx.rotate(.18); ctx.scale(st * 1.0, st * 1.0); ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 7; rr(-150, -36, 300, 72, 12); ctx.stroke(); text('POSTED TWICE', 0, 4, { size: 46, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 2 }); ctx.restore(); }
  ctx.restore();
  // gold glints around the agency pay when it lands
  const g2 = seg(lt, tP2b, tP2b + .6); if (g2 > 0 && g2 < 1) { for (let i = 0; i < 9; i++) { const an = i / 9 * TAU + .4, d = 60 + 190 * easeOut(g2); sparkle(sx + 230 + Math.cos(an) * d * 1.5, yb + 258 + Math.sin(an) * d * .5, 18 * (1 - g2) + 6, 1 - g2, '#ffe36a'); } }
  ctx.restore();
  // Mango's gloves hold the tablet at its lower corners
  glove2(X0 + 30, Y0 + TH - 130, -.5, 1.9, 'grip', 1); glove2(X0 + TW - 30, Y0 + TH - 130, PI + .5, 1.9, 'grip', -1);
}
function p3cast(lt, F) {
  const b = id => B(id), tr = F && F.mode !== 'part';
  const qSeat = V2.at(...TAB3), qG = V2.at(...MG3), qA = V2.at(...AD3);
  // Strawberry in the chair: chin in her hand until the tablet arrives, then upright and reading it
  const up = sk(lt, b('m1').s + .2, b('m1').s + .6), blink = lerp(.5, 1, Math.sin(PI * seg(lt, 21.98, 22.32)));
  const so = straw({ x: qSeat.x, y: qSeat.y - 55 * qSeat.s, s: qSeat.s, noLegs: true, noShadow: true, noReflect: true, look: lt < b('m1').s + .3 ? [.2, .45] : [.55, .15], expr: 'dead', lid: Math.max(.5 - .06 * up, blink, .92 * sk(lt, 23.2, 23.5)), arms: { l: 'rest', r: 'rest' }, rot: lerp(.07, .01, up), sway: 0, transit: tr });
  if (up < 1) { handTo(so, 1, so.x + 58 * so.s, so.y - 85 * so.s, 1 - up, [74, 30]); so.hand = { r: 'open' }; }   // her chin in her hand
  // Mango: bounces up, hands over the news
  const hop = lt < b('m1').s + .1 ? Math.abs(Math.sin(lt * 7)) * 16 * qG.s * seg(lt, 17.3, 17.5) : 0, offer = sk(lt, b('m1').s + .1, b('m1').s + .5) * (1 - sk(lt, 22.1, 22.45) * 0);
  const mg = mango(Object.assign(qG, { look: [-.55, 0], expr: lt < b('m1').s ? 'happy' : lt < b('a3').s ? 'sad' : 'sad', lift: hop, hold: { l: 'tablet10' }, arms: { l: 'hold', r: 'hips' }, tabTilt: 0, transit: tr }));
  handTo(mg, -1, so.x + 205 * so.s, so.y - 135 * so.s, offer, [-96, 30]); mg.hand = { l: 'grip' };
  // the Administrator slides in from the left and leans over them: "Different budget."
  const enter = sk(lt, b('a3').s - .05, b('a3').s + .3), ax = lerp(-190, qA.x, enter), here = lt >= b('a3').s - .08;
  const ad = here ? melon(Object.assign(qA, { x: ax, look: [.7, .05], expr: 'happy', rot: lerp(.1, .3, enter), acc: ['suit', 'nametag9'], arms: { l: 'hips', r: 'hips' }, transit: tr || enter < 1 })) : null;
  return { so, mg, ad, zs: TAB3[1], zg: MG3[1], za: AD3[1] };
}
function p3shot(lt) { const b = id => B(id); return lt < 18.25 ? 'two' : lt < 21.95 ? 'tab' : lt < b('a3').s - .04 ? 'cuS' : 'three'; }
function p3cam(lt) {
  const b = id => B(id), sh = p3shot(lt), c = p3cast(lt);
  const base = (x, z) => feetCam(x, z, { feet: 1273, at: 330 });
  if (sh === 'tab') return { x: 540, y: 960, z: 1 };
  if (sh === 'two') { const k = seg(lt, 17.6, 18.25); return base(lerp(640, 690, k), lerp(1.25, 1.38, k)); }
  if (sh === 'cuS') { const k = seg(lt, 21.95, b('a3').s), z = lerp(1.9, 2.0, k), [fx, fy] = faceC({ kind: 'straw', x: c.so.x, y: c.so.y, s: c.so.s, noLegs: true }); return { x: fx + 10, y: fy + 140 / z, z }; }
  return base(lerp(520, 530, seg(lt, b('a3').s, b('a3').e + .4)), .9);
}
function p3draw(lt, F) {
  const sh = p3shot(lt);
  if (sh === 'tab') { insTablet(lt); return; }
  const c = p3cast(lt, F), cu = sh === 'cuS';
  V2.setLight({ key: [-.3, -.85], keyColor: '#dcecff', keyA: .22, rim: '#8fd0ff', rimA: .42, shadow: '#0e1830', shadowA: .4, amb: '#cfe6ff', ambA: .07, bounce: '#b8e0d0', bounceA: .12 }); V2.opts.reflect = true;
  const tb = tube3(lt);
  bgDof(cu ? 8 : 0, () => {
    breakSet(lt);
    { const [px, py] = p2(SEAT3[0], 0, 1130), kk = kz(1130); ctx.save(); ctx.fillStyle = 'rgba(14,10,34,.26)'; ctx.beginPath(); ctx.ellipse(px, py + 3 * kk, 70 * kk, 15 * kk, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    chair3(SEAT3[0], 1130, { color: '#c47a52', w: 50, d: 44, seat: 120, back: 280 });
  });
  V2.addLight({ x: 540, y: 560, r: 1100, color: '205,232,255', a: .26 * tb });
  // far to near: the chair-bound Strawberry first, her table, then whoever stands in front of the table
  const list = [['so', c.zs], ['mg', c.zg], ['ad', c.za]].filter(q => c[q[0]]).sort((a, b2) => b2[1] - a[1]);
  const bg = (o, id) => cu && id !== 'so' ? nbr(o) : drawChar(o);
  drawChar_(list, c, bg, lt, cu);
}
function drawChar_(list, c, bg, lt, cu) {
  // the table sits between Strawberry (behind it) and the standing ones (in front of it)
  const tableDraw = () => bgDof(cu ? 5 : 0, () => {
    table3(TAB3[0], TAB3[1], { w: 130, d: 70, h: 135, color: '#c9a26a' });
    const [mx, my] = p2(TAB3[0] - 96, 151, TAB3[1] + 20), k = kz(TAB3[1]); ctx.save(); ctx.translate(mx, my); ctx.scale(k, k); ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 2, 34, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(-26, -54, 52, 56, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(28, -26, 11, -PI / 2, PI / 2); ctx.stroke(); ctx.fillStyle = '#5a3210'; ell(0, -50, 22, 5); ctx.fill(); text('3-11', 0, -24, { size: 13, fill: '#d62828' });
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; for (const dx of [-2, 12]) { ctx.beginPath(); ctx.moveTo(dx, -60); ctx.quadraticCurveTo(dx + 6 * Math.sin(lt * 3 + dx), -70, dx, -80); ctx.stroke(); } ctx.restore(); });
  bg(c.so, 'so'); tableDraw();
  for (const [k] of list) if (k !== 'so') bg(c[k], k);
}

// ------------------------------------------------------------------ PART 4: THE SUPPLY CLOSET (3 days). The new hire, a mirror gag, and a great many empty shelves
const CLO = { zb: 1750, hw: 400, ch: 760 };
const CLO_CAM = { f: 1400, cy: 330, hy: 780 };
const CPAD = { px: 652, py: 474, s: .2, rot: -.05 };                       // the pad hangs crooked, high on the back wall, right of the bulb
const SHELF = { x0: -330, x1: 330, tiers: [40, 150, 260, 370], top: 470, depth: 96 };
const BULB = { x: -40, y: 560, z: 1500, cord: 760 };
// the bulb flickers on a few dips (as Clementine hops in, on the Q-word, on "There aren't any") and sags on the trombone
const DIPS4 = [[24.92, .06, .75], [25.01, .04, .5], [26.52, .08, .85], [28.92, .06, .6], [30.18, .05, .7], [30.26, .04, .5], [32.02, .1, .9], [32.44, .05, .6], [33.84, .12, .9], [34.2, .1, .85], [34.56, .1, .85]];
const bulb4 = lt => { let k = 1 - .05 * Math.abs(vnoise(lt * 9)); for (const [t0, d, dp] of DIPS4) if (lt >= t0 && lt < t0 + d) k *= 1 - dp; return k * (1 - .4 * seg(lt, 34.7, 35.05)); };
const wind4 = lt => seg(lt, 32.0, 32.5) * (1 - seg(lt, 34.5, 35.05));      // a draught from the door that arrives with the news
function dustBunny(x, y, z, r, a = .6) {
  const [px, py] = p2(x, y, z), k = kz(z) * r;
  ctx.save(); ctx.translate(px, py);
  ctx.fillStyle = `rgba(206,206,194,${a})`; for (let i = 0; i < 6; i++) { ell(Math.cos(i * 1.7) * 9 * k, -5 * k + Math.sin(i * 2.3) * 4 * k, 9 * k, 6.5 * k); ctx.fill(); }
  ctx.strokeStyle = `rgba(150,150,140,${a * .8})`; ctx.lineWidth = Math.max(1, 1.5 * k); ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(Math.cos(i * 1.3) * 6 * k, -4 * k); ctx.lineTo(Math.cos(i * 1.3) * 17 * k, -4 * k + Math.sin(i * 2.9) * 9 * k); ctx.stroke(); }
  ctx.restore();
}
// a web in a corner, its corner at (ax, ay): strands fan right and down; a small spider waits on a thread
function cobweb(ax, ay, R, sway, lt) {
  ctx.save(); ctx.translate(ax, ay); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const N = 5, rad = [];
  for (let i = 0; i <= N; i++) { const a = .05 + i / N * (PI / 2 - .1) + .05 * sway * i / N; rad.push([Math.cos(a), Math.sin(a)]); }
  ctx.strokeStyle = 'rgba(244,247,249,.6)'; ctx.lineWidth = 1.8;
  for (const [cx, cy] of rad) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cx * R, cy * R); ctx.stroke(); }
  ctx.lineWidth = 1.5;
  for (const f of [.3, .52, .74, .96]) {
    ctx.beginPath();
    rad.forEach(([cx, cy], i) => { const x = cx * R * f, y = cy * R * f; if (!i) ctx.moveTo(x, y); else { const [qx, qy] = rad[i - 1]; ctx.quadraticCurveTo((qx + cx) / 2 * R * f * .84, (qy + cy) / 2 * R * f * .84, x, y); } });
    ctx.stroke();
  }
  const sx = rad[3][0] * R * .5, sy = rad[3][1] * R * .5, by = sy + R * (.5 + .08 * Math.sin(lt * 1.3)), r = R * .06;
  ctx.strokeStyle = 'rgba(240,244,246,.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, by); ctx.stroke();
  ctx.strokeStyle = '#1a1620'; ctx.lineWidth = Math.max(1.6, r * .28);
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(sx, by + r * .2); ctx.lineTo(sx + sd * r * (1.1 + .25 * i), by + r * (-.8 + i * .55)); ctx.lineTo(sx + sd * r * (1.7 + .2 * i), by + r * (-.2 + i * .75)); ctx.stroke(); }
  ctx.fillStyle = '#1a1620'; ell(sx, by + r * .3, r * .8, r); ctx.fill(); ell(sx, by - r * .6, r * .5, r * .5); ctx.fill();
  ctx.fillStyle = '#fff'; ell(sx - r * .2, by - r * .65, r * .14, r * .14); ctx.fill(); ell(sx + r * .2, by - r * .65, r * .14, r * .14); ctx.fill();
  ctx.restore();
}
// the one glove left in the building, standing on the GLOVES shelf; the draught tips it
function lonelyGlove(lt, wd) {
  const gz = CLO.zb - SHELF.depth + 52, gy = SHELF.tiers[2] + 26, [px, py] = p2(70, gy, gz), kk = kz(gz) * 1.9;
  ctx.fillStyle = 'rgba(8,14,12,.35)'; ell(px, py + 2, 34 * kk, 7 * kk); ctx.fill();
  ctx.save(); ctx.translate(px, py - 3 * kk); ctx.rotate(-PI / 2 + .2 + .04 * Math.sin(lt * 1.2) + wd * .16 * Math.sin(lt * 8.5)); ctx.scale(kk, kk);
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand('open', 1, {});
  ctx.restore();
}
function closetSet(lt) {
  const { zb, hw, ch } = CLO, bl = bulb4(lt), wd = wind4(lt), { x0, x1, tiers, top, depth } = SHELF, zf = zb - depth, kb = kz(zb), kf = kz(zf);
  shell({ zb, hw, ch, wall: '#b3c2b6', wain: '#587670', floorA: '#a8afa6', floorB: '#7b837c', ceil: '#cdd6d0', fog: '#586a6c', fogAmt: .4, tile: 100, bright: .9, rail: 120 });
  // the shelf unit on the back wall: a dark recess, three uprights, four boards with their tags; nothing on any of them
  onZ(zb - 3, x0 - 6, x1 + 6, 8, top + 8, grad(0, p2(0, top, zb)[1], 0, p2(0, 0, zb)[1], [[0, '#2e3e44'], [1, '#1c282d']]), 'rgba(10,16,20,.8)', 2.4);
  for (const x of [x0 - 16, x1, -8]) box3({ x0: x, x1: x + 16, y0: 0, y1: top + 16, z0: zf, z1: zb - 3, color: '#7b8791', front: '#97a3ad', side: '#667079' });
  const tags = ['GAUZE', 'CUFFS', 'GLOVES', 'TUBING'];
  tiers.forEach((y, i) => {
    box3({ x0: x0 - 16, x1: x1 + 16, y0: y, y1: y + 26, z0: zf, z1: zb - 3, color: '#9aa6ac', top: '#cdd5d6', front: '#b0bbc0', side: '#8793a0' });
    const cx = x0 + 120 + (i % 2) * 40;
    onZ(zf, cx - 62, cx + 62, y + 4, y + 22, '#f7f7ee', 'rgba(20,20,30,.6)', 1.2);
    const [tx, ty] = p2(cx, y + 13, zf); text(tags[i], tx, ty, { size: 14 * kf, fill: '#2a3140', weight: 900, spacing: 1 });
  });
  dustBunny(-205, tiers[0] + 26, zb - 40, 1.2); dustBunny(150, tiers[0] + 26, zb - 60, 1); dustBunny(-90, tiers[1] + 26, zb - 50, .9); dustBunny(215, tiers[1] + 26, zb - 36, 1.1); dustBunny(-240, tiers[2] + 26, zb - 44, 1);
  lonelyGlove(lt, wd);
  { const [ax, ay] = p2(x0 - 16, top + 16, zb - 3); cobweb(ax, ay, 150 * kb, wd * Math.sin(lt * 6), lt); }
  // an empty carton at the foot of the shelves, flaps open
  box3({ x0: -150, x1: -20, y0: 0, y1: 74, z0: 1540, z1: 1650, color: '#b98a52', top: '#3a2c18', front: '#c99a60', side: '#a07a45' });
  poly([p2(-150, 74, 1540), p2(-20, 74, 1540), p2(-20, 74, 1650), p2(-150, 74, 1650)], '#2a2012', '#d9b27a', 3);
  onZ(1540, -130, -40, 16, 54, '#fffdf4', 'rgba(20,20,30,.5)', 1.2); { const [lx, ly] = p2(-85, 35, 1540); text('GLOVES L', lx, ly, { size: 14 * kz(1540), fill: '#2a3140', weight: 900 }); }
  dustBunny(-310, 0, 1450, 1.6, .5); dustBunny(120, 0, 1380, 1.3, .5);
  // shelves down the left wall, as empty as the others
  for (const y of [150, 300, 450]) box3({ x0: -hw, x1: -hw + 86, y0: y, y1: y + 14, z0: 1180, z1: 1740, color: '#9aa6ac', top: '#cdd5d6', front: '#b0bbc0', side: '#8793a0' });
  for (const z of [1180, 1456, 1726]) box3({ x0: -hw, x1: -hw + 12, y0: 0, y1: 480, z0: z, z1: z + 14, color: '#7b8791' });
  // the Q-word sign, taped over the shelves: the Q is crossed out
  { const [qx, qy] = p2(-250, 604, zb); ctx.save(); ctx.translate(qx, qy); ctx.rotate(-.04); ctx.scale(kb, kb);
    ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = 'rgba(30,24,40,.6)'; ctx.lineWidth = 3; rr(-92, -32, 184, 64, 4); ctx.fill(); ctx.stroke();
    text('QUIET', 0, 3, { size: 46, font: 'Bangers', weight: 400, fill: '#1c2a5a', spacing: 3 });
    ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-78, -22); ctx.lineTo(-40, 22); ctx.moveTo(-78, 22); ctx.lineTo(-40, -22); ctx.stroke();
    ctx.fillStyle = 'rgba(255,226,120,.8)'; for (const x of [-92, 92]) { ctx.save(); ctx.translate(x, -32); ctx.rotate(x < 0 ? -.5 : .5); ctx.fillRect(-18, -8, 36, 16); ctx.restore(); } ctx.restore(); }
  // the countdown pad, crooked, flapping a little when the draught comes
  wallPad(CPAD.px, CPAD.py, CPAD.s, 3, { rot: CPAD.rot + wd * .025 * Math.sin(lt * 11) });
  // the bare bulb on its cord, a green enamel shade, and the light it throws
  { const [bx, by] = p2(BULB.x, BULB.y, BULB.z), [cx0, cy0] = p2(BULB.x, BULB.cord, BULB.z), kk = kz(BULB.z), sw = Math.sin(lt * 1.1) * 4 * kk;
    ctx.strokeStyle = '#26232c'; ctx.lineWidth = Math.max(2, 3 * kk); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(bx + sw, by - 44 * kk); ctx.stroke();
    ctx.save(); ctx.translate(bx + sw, by); ctx.lineJoin = 'round';
    ctx.fillStyle = '#3d5a4d'; ctx.strokeStyle = INK; ctx.lineWidth = 3.2 * kk; ctx.beginPath(); ctx.moveTo(-50 * kk, 0); ctx.quadraticCurveTo(-44 * kk, -52 * kk, 0, -54 * kk); ctx.quadraticCurveTo(44 * kk, -52 * kk, 50 * kk, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ell(-18 * kk, -30 * kk, 14 * kk, 8 * kk); ctx.fill();
    ctx.fillStyle = `rgba(255,${Math.round(230 - 40 * (1 - bl))},${Math.round(160 - 60 * (1 - bl))},${.35 + .65 * bl})`; ctx.strokeStyle = INK; ctx.lineWidth = 2.6 * kk; ell(0, 16 * kk, 20 * kk, 24 * kk); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = `rgba(255,150,40,${.4 + .6 * bl})`; ctx.lineWidth = 2 * kk; ctx.beginPath(); ctx.moveTo(-6 * kk, 6 * kk); ctx.lineTo(-3 * kk, 22 * kk); ctx.lineTo(3 * kk, 12 * kk); ctx.lineTo(6 * kk, 24 * kk); ctx.stroke();
    ctx.restore();
    V2.glow(bx + sw, by + 20 * kk, 620 * kk, '255,228,150', .5 * bl, 'screen', .55);
    V2.beam(bx + sw, by + 20 * kk, bx + sw - 30 * kk, by + 860 * kk, 70 * kk, 820 * kk, '255,230,160', .11 * bl);
    const [fx, fy] = p2(BULB.x, 0, 1200); V2.glow(fx, fy, 480 * kz(1200), '255,226,150', .16 * bl, 'screen', .2); }
  // dust on the draught
  V2.dust(120, 560, 960, 1300, lt, { n: 26, alpha: .38 * bl, color: '255,236,190', speed: 10, seed: 7 });
  if (wd > 0) V2.dust(-100, 700, 1180, 1300, lt, { n: 30, alpha: .5 * wd, color: '240,240,230', speed: -120, seed: 11, size: 2.6 });
}
// a crumpled sheet of paper, rolling in on the draught: it crosses the floor in front of everybody
function tumbleweed(lt, cu) {
  const t0 = 32.25, t1 = 35.3; if (lt < t0 - .05 || lt > t1) return;
  const body = () => {
    const u = (lt - t0) / (t1 - t0), z = 940, k = kz(z), R = 44 * k, x = lerp(1250, -260, u), hop = Math.abs(Math.sin(lt * 5.4)) * 15 * k, fy = p2(0, 0, z)[1], y = fy - R * .92 - hop;
    ctx.fillStyle = 'rgba(10,16,14,.28)'; ell(x, fy + 2, R * .95 * (1 - hop / (60 * k)), R * .2); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(-(x / R) * .95); ctx.lineJoin = 'round';
    const N = 15, P = []; for (let i = 0; i < N; i++) { const a = i / N * TAU, rr_ = R * (.86 + .16 * hash(i + 3)); P.push([Math.cos(a) * rr_, Math.sin(a) * rr_]); }
    ctx.beginPath(); P.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath();
    ctx.fillStyle = V2.radial(-R * .3, -R * .35, R * .1, R * 1.15, [[0, '#fbf6e4'], [.7, '#e6dcc0'], [1, '#bfb08a']]); ctx.fill(); ctx.strokeStyle = 'rgba(40,30,20,.75)'; ctx.lineWidth = Math.max(2, 3 * k); ctx.stroke();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 9; i++) { const a0 = hash(i * 5 + 1) * TAU, a1 = a0 + .9 + hash(i + 9), q0 = [Math.cos(a0) * R * .2, Math.sin(a0) * R * .2]; ctx.beginPath(); ctx.moveTo(...q0); ctx.lineTo(Math.cos(a0) * R * 1.1, Math.sin(a0) * R * 1.1); ctx.lineTo(Math.cos(a1) * R * 1.1, Math.sin(a1) * R * 1.1); ctx.closePath(); ctx.fillStyle = `rgba(${hash(i + 2) > .5 ? '90,70,40' : '255,255,245'},${.1 + .12 * hash(i + 4)})`; ctx.fill(); }
    ctx.strokeStyle = 'rgba(70,60,50,.4)'; ctx.lineWidth = Math.max(1.4, 2 * k); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-R * .7, -R * .55 + i * R * .24); ctx.lineTo(R * (.1 + .5 * hash(i)), -R * .55 + i * R * .24 + R * .05 * (hash(i + 7) - .5)); ctx.stroke(); }
    ctx.restore(); ctx.restore();
  };
  cu ? V2.dof(9, body) : body();
}
// a bead of sweat: a clear drop that starts at her temple and runs down her cheek, while her smile stays exactly where it was
function sweatDrops(lt, o) {
  if (lt < 32.5) return;
  const [fx, fy] = faceC({ kind: 'clem', x: o.x, y: o.y, s: o.s, lift: o.lift }), s = o.s;
  for (const [t0, d, side] of [[32.55, .95, 1], [33.2, .9, -1], [33.95, .95, 1]]) {
    const u = (lt - t0) / d; if (u < 0 || u > 1) continue;
    const grow = easeOut(clamp(u * 5)), fall = easeIn(clamp((u - .18) / .82)), x = fx + side * (76 - 8 * fall) * s, y = fy + (-54 + 112 * fall) * s, w = 12 * s * grow, h = 24 * s * grow;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= 1 - seg(u, .86, 1); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, -h); ctx.bezierCurveTo(w * .35, -h * .35, w, 0, w, h * .35); ctx.arc(0, h * .35, w, 0, PI); ctx.bezierCurveTo(-w, 0, -w * .35, -h * .35, 0, -h); ctx.closePath();
    ctx.fillStyle = V2.grad(-w, 0, w, 0, [[0, '#d6f1ff'], [1, '#8fd0f0']]); ctx.fill(); ctx.strokeStyle = '#2f7fae'; ctx.lineWidth = Math.max(2, 2.6 * s); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(-w * .35, h * .25, w * .2, h * .22); ctx.fill();
    ctx.restore();
  }
}

// ---- the people
const P4POS = { S: [-150, 1060], C: [150, 1100] };                               // Strawberry, Clementine (X, Z)
const HOPS4 = [[24.32, 24.56, 560, 420], [24.56, 24.80, 420, 285], [24.80, 25.10, 285, 150]];   // Clementine bounds in from the door on the right: three hops
const MIRROR = .42;                                                               // the beat she is late by
const POSE4 = { rest: [.28, .25], hips: [1.0, -1.7], temple: [3.5, 1.58], offer: [1.06, 2.23], shrug: [1.15, 2.4], cheer: [2.8, .2] };   // temple: a hand over the eye; offer: a palm up beside the face; shrug: both
const poseOf4 = p => Array.isArray(p) ? p : POSE4[p];
// keys: [t, pose]: at each t the arm starts moving to its pose (taking .2 s)
function armAt(lt, keys, dur = .2) {
  let i = 0; while (i + 1 < keys.length && lt >= keys[i + 1][0]) i++;
  const to = poseOf4(keys[i][1]); if (!i) return to;
  const from = poseOf4(keys[i - 1][1]), k = sk(lt, keys[i][0], keys[i][0] + dur), a2 = to[1] + Math.round((from[1] - to[1]) / TAU) * TAU;   // the forearm takes the short way round
  return [lerp(from[0], to[0], k), lerp(from[1], a2, k)];
}
// Strawberry's arms, in her own time. Clementine copies them, mirrored, MIRROR seconds later
const S_L = [[0, 'hips'], [32.18, 'shrug']];
const S_R = [[0, 'rest'], [25.10, 'hips'], [25.95, 'temple'], [26.95, 'hips'], [30.25, 'offer'], [30.95, 'hips'], [32.18, 'shrug']];
const bump4 = (lt, t0, d = .24) => lt >= t0 && lt < t0 + d ? Math.sin((lt - t0) / d * PI) : 0;
const lookS4 = t => t < 31.9 ? [.62, .02] : lerpA2([.62, .02], [0, 0], sk(t, 31.9, 32.1));
const rotS4 = t => .02 * Math.sin(t * 1.3) - .05 * bump4(t, 25.98, .7);
function clemMove(lt) {
  const sC = V2.at(...P4POS.C).s, sS = V2.at(...P4POS.S).s;
  let XC = P4POS.C[0], arc = 0, sq = 0;
  if (lt < HOPS4[0][0]) XC = HOPS4[0][2];
  else for (const [t0, t1, xa, xb] of HOPS4) if (lt >= t0 && lt < t1) { const u = (lt - t0) / (t1 - t0); XC = lerp(xa, xb, u); arc = Math.sin(u * PI); }
  for (const tb of [HOPS4[0][1], HOPS4[1][1], HOPS4[2][1]]) { const d = Math.abs(lt - tb); if (d < .08) sq = Math.max(sq, .24 * (1 - d / .08)); }
  if (lt >= HOPS4[0][0] - .06 && lt < HOPS4[0][0]) sq = Math.max(sq, .2);
  let bn = 0; for (const t0 of [25.40, 25.98, 26.30, 28.37, 28.76, 29.04]) bn = Math.max(bn, bump4(lt, t0));
  bn = Math.max(bn, 1.7 * bump4(lt, 31.26, .3));
  const stepC = seg(lt, 32.40, 32.72), stepS = seg(lt, 31.98, 32.32);
  if (lt >= 32.40) XC = lerp(P4POS.C[0], 250, easeIO(stepC));
  const hopC = stepC > 0 && stepC < 1 ? Math.sin(stepC * PI) : 0, hopS = stepS > 0 && stepS < 1 ? Math.sin(stepS * PI) : 0;
  return { XC, XS: lerp(P4POS.S[0], -215, easeIO(stepS)), liftC: (arc * 78 + bn * 16 + hopC * 34) * sC, liftS: hopS * 14 * sS, sqC: Math.max(sq, .1 * bn, .12 * hopC) };
}
function p4cast(lt, F) {
  const tr = F && F.mode !== 'part', m = clemMove(lt), qS = V2.at(m.XS, P4POS.S[1]), qC = V2.at(m.XC, P4POS.C[1]);
  // Strawberry: unimpressed. Fists on her hips, a hand to her forehead at "replacement", a palm up at "supplies", both hands up in a shrug at "There aren't any."
  const lidS = Math.max(lerp(.5, .92, Math.sin(PI * seg(lt, 26.0, 26.6))), lerp(.5, .97, Math.sin(PI * seg(lt, 34.0, 34.5))));
  const sp = straw(Object.assign(qS, { look: lookS4(lt), expr: 'dead', lid: lidS, arms: { l: armAt(lt, S_L), r: armAt(lt, S_R) }, rot: rotS4(lt), sway: .03, lift: m.liftS, transit: tr }));
  // Clementine: three hops through the door, then she copies Strawberry's every pose a beat late (her left arm is Strawberry's right)
  const lc = lookS4(lt - MIRROR), gl = sk(lt, 32.42, 32.55) * (1 - sk(lt, 32.8, 32.95)), lookC = lerpA2([-lc[0], lc[1]], [-.35, -.55], gl);
  const ownL = lt < 24.56 ? [1.9, .3] : lt < 24.80 ? POSE4.cheer : POSE4.rest, waveP = [2.3, .55 + .55 * Math.sin(lt * 15)], ownR = lt < 24.56 ? [1.9, .3] : lt < 24.80 ? POSE4.cheer : lt < 25.15 ? waveP : POSE4.rest;
  const mix = sk(lt, 25.3, 25.55), mL = armAt(lt - MIRROR, S_R), mR = armAt(lt - MIRROR, S_L);
  const frozen = lt >= 32.8;   // after "There aren't any." her smile is set: it does not move, even to say "Sure!"
  const cl = clem(Object.assign(qC, { look: lookC, expr: lt < 31.2 ? 'hopeful' : 'happy', arms: { l: lerpA2(ownL, mL, mix), r: lerpA2(ownR, mR, mix) }, rot: -rotS4(lt - MIRROR) * (lt > 25.3 ? 1 : 0), lift: m.liftC, squash: m.sqC, plant: true,
    sparkle: lt >= 28.3 && lt < 31.9, transit: tr || lt < 25.15, talk: frozen ? 0 : undefined, face: frozen ? { pup: .5, wide: 1.18 } : undefined, twitch: lt >= 32.9 }));
  return { so: sp, cl, zs: P4POS.S[1], zc: P4POS.C[1] };
}
// ---- the shots: two-shot, the jar, Clementine, two-shot, Clementine, the reveal, Clementine frozen, the empty closet
const JAR = () => ({ t0: wordT('s4', 'marmalade', B('s4').s + .56) - .02, t1: B('c2').s - .03 });
function p4shot(lt) { const J = JAR(); return lt < J.t0 ? 'two' : lt < J.t1 ? 'jar' : lt < 29.6 ? 'cuC' : lt < 31.2 ? 'ms' : lt < 31.88 ? 'cuC2' : lt < 32.85 ? 'wide' : lt < 33.55 ? 'cuC3' : 'end'; }
const p4base = (x, z, o = {}) => ({ x, y: (o.feet ?? 1216) - (o.at ?? 370) / z, z });
function p4cam(lt) {
  const sh = p4shot(lt);
  if (sh === 'jar') return { x: 540, y: 960, z: 1 };
  const c = p4cast(lt), cf = faceC({ kind: 'clem', x: c.cl.x, y: c.cl.y, s: c.cl.s, lift: c.cl.lift });
  if (sh === 'two') { const k = seg(lt, 24.6, JAR().t0); return p4base(lerp(536, 548, k), lerp(1.26, 1.38, k)); }
  if (sh === 'cuC') { const k = seg(lt, 28.34, 29.6), z = lerp(1.95, 2.1, k); return { x: cf[0] - 16, y: cf[1] + 150 / z, z }; }
  if (sh === 'ms') { const k = seg(lt, 29.6, 31.2); return p4base(lerp(540, 536, k), lerp(1.36, 1.44, k)); }
  if (sh === 'cuC2') { const k = seg(lt, 31.2, 31.88), z = lerp(2.1, 2.25, k); return { x: cf[0] - 16, y: cf[1] + 150 / z, z }; }
  if (sh === 'wide') return p4base(540, lerp(1.04, 1.0, seg(lt, 31.88, 32.85)), { at: 330 });
  if (sh === 'cuC3') { const k = seg(lt, 32.85, 33.55), z = lerp(2.3, 2.42, k); return { x: cf[0] + 6, y: cf[1] + 120 / z, z }; }
  return p4base(540, lerp(.98, .86, easeIO(seg(lt, 33.55, 35.09))), { at: 330 });
}
// the one-second insert at "marmalade": a jar with a gingham lid, a tiny leaf, and a label that is a face
function insJar(lt) {
  const J = JAR(), age = lt - J.t0, fall = easeIn(seg(lt, J.t0, J.t0 + .13)), land = lt >= J.t0 + .13 ? Math.max(0, 1 - (lt - J.t0 - .13) / .14) : 0;
  const a2 = Math.max(0, age - .13), wob = Math.sin(a2 * 20) * Math.exp(-a2 * 6) * .035, push = 1 + .06 * seg(lt, J.t0, J.t1);
  A6.bokeh(lt, ['255,200,120', '255,150,80', '255,232,170'], ['#2a1408', '#4a2a10']);
  ctx.fillStyle = V2.grad(0, 1180, 0, 1560, [[0, '#b9824a'], [1, '#6a4422']]); ctx.fillRect(-20, 1180, W + 40, 820);   // the shelf
  ctx.fillStyle = 'rgba(255,236,190,.28)'; ctx.fillRect(-20, 1180, W + 40, 8);
  ctx.strokeStyle = 'rgba(40,20,8,.35)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const y = 1230 + i * 60; ctx.beginPath(); ctx.moveTo(-20, y); ctx.bezierCurveTo(300, y + 8, 700, y - 8, W + 20, y + 4); ctx.stroke(); }
  ctx.save(); ctx.translate(540, 1180); ctx.scale(1.2 * push, 1.2 * push); ctx.translate(-540, -1130);
  ctx.fillStyle = 'rgba(20,10,4,.4)'; ell(540, 1140, 270 + 30 * land, 30); ctx.fill();
  ctx.translate(540, 1130 - 340 * (1 - fall)); ctx.rotate(wob); ctx.scale(1 + .1 * land, 1 - .12 * land); ctx.translate(-540, -1130);
  const jx0 = 330, jx1 = 750, jyb = 1120, jyt = 640;
  const body = () => { ctx.beginPath(); ctx.moveTo(jx0 + 50, jyb); ctx.lineTo(jx1 - 50, jyb); ctx.quadraticCurveTo(jx1, jyb, jx1, jyb - 50); ctx.lineTo(jx1, jyt + 70); ctx.quadraticCurveTo(jx1, jyt, jx1 - 50, jyt - 14); ctx.lineTo(jx0 + 50, jyt - 14); ctx.quadraticCurveTo(jx0, jyt, jx0, jyt + 70); ctx.lineTo(jx0, jyb - 50); ctx.quadraticCurveTo(jx0, jyb, jx0 + 50, jyb); ctx.closePath(); };
  body(); ctx.fillStyle = 'rgba(210,235,245,.35)'; ctx.fill();
  ctx.save(); body(); ctx.clip();   // the marmalade, to just below the neck
  ctx.fillStyle = V2.grad(jx0, 0, jx1, 0, [[0, '#ff9a1c'], [.5, '#ffb43a'], [1, '#e8700c']]); ctx.fillRect(jx0, jyt + 30, jx1 - jx0, jyb - jyt);
  ctx.strokeStyle = 'rgba(160,70,0,.45)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; for (let i = 0; i < 16; i++) { const x = jx0 + 30 + hash(i) * 360, y = jyt + 70 + hash(i + 8) * 420, a = hash(i + 3) * PI; ctx.beginPath(); ctx.arc(x, y, 18 + hash(i + 5) * 14, a, a + 1.9); ctx.stroke(); }   // strands of peel
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; for (let i = 0; i < 9; i++) { const x = jx0 + 40 + hash(i + 20) * 340, y = jyt + 90 + hash(i + 25) * 400, r = 5 + hash(i + 30) * 9; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }   // bubbles
  ctx.fillStyle = 'rgba(255,255,255,.42)'; rr(jx0 + 26, jyt + 50, 30, 400, 15); ctx.fill(); rr(jx1 - 50, jyt + 80, 14, 200, 7); ctx.fill();   // the glass catches the light
  ctx.restore();
  body(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke();
  ctx.fillStyle = '#dfe4ec'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(jx0 + 36, jyt - 78, jx1 - jx0 - 72, 62, 14); ctx.fill(); ctx.stroke();   // the rim
  // the gingham lid, tied with twine, and one small leaf
  ctx.save(); ctx.beginPath(); ctx.moveTo(jx0 + 14, jyt - 56); ctx.quadraticCurveTo(540, jyt - 230, jx1 - 14, jyt - 56);
  for (let x = jx1 - 14; x > jx0 + 14; x -= 52) ctx.quadraticCurveTo(x - 26, jyt - 6, x - 52, jyt - 56); ctx.closePath(); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.clip();
  ctx.fillStyle = 'rgba(214,40,60,.62)'; for (let x = jx0; x < jx1 + 40; x += 68) ctx.fillRect(x, jyt - 240, 34, 260); for (let y = jyt - 240; y < jyt + 20; y += 68) ctx.fillRect(jx0, y, jx1 - jx0, 34);
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ell(470, jyt - 130, 60, 26); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(jx0 + 14, jyt - 56); ctx.quadraticCurveTo(540, jyt - 230, jx1 - 14, jyt - 56); for (let x = jx1 - 14; x > jx0 + 14; x -= 52) ctx.quadraticCurveTo(x - 26, jyt - 6, x - 52, jyt - 56); ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = '#c9a063'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(jx0 + 40, jyt - 60); ctx.quadraticCurveTo(540, jyt - 40, jx1 - 40, jyt - 60); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#c9a063'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(540 + sd * 34, jyt - 46, 30, 15, sd * .5, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(540, jyt - 176); ctx.quadraticCurveTo(544, jyt - 206, 560, jyt - 226); ctx.stroke();
  leaf(560, jyt - 222, .95, 96, 28, '#4fb046'); leaf(554, jyt - 214, -1.1, 76, 24, '#3f9a3a');
  // the label: a round face with huge eyes and a smile, and a price tag still tied on
  const lx = 540, ly = 900, blink = age > .42 && age < .52 ? 1 : 0;
  ctx.fillStyle = '#fff6dc'; ctx.strokeStyle = '#8a4a14'; ctx.lineWidth = 7; ell(lx, ly, 172, 168); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(138,74,20,.5)'; ctx.lineWidth = 3; ell(lx, ly, 154, 150); ctx.stroke();
  for (const sd of [-1, 1]) { const ex = lx + sd * 62, ey = ly - 36; ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ell(ex, ey, 40, blink ? 6 : 46); ctx.fill(); ctx.stroke();
    if (!blink) { ctx.fillStyle = INK; ell(ex - sd * 8, ey + 4, 22, 24); ctx.fill(); ctx.fillStyle = '#fff'; ell(ex - sd * 8 - 7, ey - 6, 7, 8); ctx.fill(); ell(ex - sd * 8 + 7, ey + 11, 3.4, 3.8); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,110,150,.35)'; ell(lx + sd * 98, ly + 28, 28, 16); ctx.fill(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx - 46, ly + 44); ctx.quadraticCurveTo(lx, ly + 92, lx + 46, ly + 44); ctx.stroke();
  text('MARMALADE', lx, ly + 126, { size: 36, font: 'Bangers', weight: 400, fill: '#b04a00', spacing: 3 });
  ctx.save(); ctx.translate(jx0 + 12, jyt + 40); ctx.rotate(-.35); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-44, 52); ctx.stroke();
  ctx.fillStyle = '#fffdf0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-84, 44); ctx.lineTo(-22, 44); ctx.lineTo(-22, 96); ctx.lineTo(-84, 96); ctx.lineTo(-96, 70); ctx.closePath(); ctx.fill(); ctx.stroke(); text('$89', -52, 71, { size: 28, fill: '#d62828', weight: 900 }); ctx.restore();
  ctx.restore();
  // a glint that crosses the glass just after it lands
  const gk = seg(lt, J.t0 + .2, J.t0 + .6); if (gk > 0 && gk < 1) sparkle(lerp(jx0 + 60, jx1 - 60, gk), 760 + 40 * Math.sin(gk * PI), 44, Math.sin(gk * PI), '#fff6c0');
}
function p4draw(lt, F) {
  const sh = p4shot(lt);
  if (sh === 'jar') { insJar(lt); return; }
  const c = p4cast(lt, F), cu = sh === 'cuC' || sh === 'cuC2' || sh === 'cuC3', bl = bulb4(lt);
  V2.setLight({ key: [-.2, -.9], keyColor: '#ffe9b0', keyA: .3, rim: '#8fe0c0', rimA: .35, shadow: '#0c1814', shadowA: .45, amb: '#cfe0d0', ambA: .05, bounce: '#ffd9a0', bounceA: .1 }); V2.opts.reflect = true;
  bgDof(cu ? 8 : 0, () => closetSet(lt));
  const [bx, by] = p2(BULB.x, BULB.y, BULB.z);
  V2.addLight({ x: bx, y: by, r: 1000, color: '255,226,150', a: .4 * bl });
  const list = [['cl', c.zc], ['so', c.zs]].sort((a, b2) => b2[1] - a[1]);
  for (const [k] of list) (cu && k !== 'cl' ? nbr : drawChar)(c[k]);
  sweatDrops(lt, c.cl);
  tumbleweed(lt, cu);
}

// ------------------------------------------------------------------ the parts of the montage
const PARTS = [{ camP: { f: 1400, cy: 360, hy: 860 }, cal: BPAD, cam: p1cam, cover() { return { x: BPAD.px + PW * BPAD.s / 2, y: BPAD.py + PH * BPAD.s / 2, z: COVER / BPAD.s, r: 0 }; }, draw: p1draw, fx: lt => ({ bloom: .62, vignette: .44, contrast: .2, sat: .28, tint: [['#ffe2a8', .16, 'soft-light'], ['#5a7fc8', .06, 'multiply']] }) }, { camP: { f: 1400, cy: 360, hy: 860 }, cal: SPAD, cam: p2cam, cover() { return { x: SPAD.px + PW * SPAD.s / 2, y: SPAD.py + PH * SPAD.s / 2, z: COVER / SPAD.s, r: 0 }; }, draw: p2draw, fx: lt => ({ bloom: .62, vignette: .42, contrast: .18, sat: .3, tint: [['#ffd0e0', .1, 'soft-light'], ['#ffe2a8', .08, 'soft-light']] }) }, { camP: BRK_CAM, cal: BPADR, cam: p3cam, cover() { return { x: BPADR.px + PW * BPADR.s / 2, y: BPADR.py + PH * BPADR.s / 2, z: COVER / BPADR.s, r: 0 }; }, draw: p3draw, fx: lt => ({ bloom: .5, vignette: .5, contrast: .2, sat: .06, tint: [['#8fd8c0', .16, 'soft-light'], ['#071a2c', .12, 'multiply']] }) }, { camP: CLO_CAM, cal: CPAD, cam: p4cam, cover() { const th = CPAD.rot, sc = CPAD.s; return { x: CPAD.px + PW * sc / 2 - Math.sin(th) * PH * sc / 2, y: CPAD.py + Math.cos(th) * PH * sc / 2, z: COVER / sc, r: -th }; }, draw: p4draw, fx: lt => { const bl = bulb4(lt); return { bloom: .55, vignette: .6, contrast: .22, sat: .08, tint: [['#ffe9a0', .1 * bl, 'soft-light'], ['#06100c', .2 + .22 * (1 - bl), 'multiply']] }; } }];

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
  fx: lt => { const F = frameOf(lt), base = { bloom: .5, vignette: .4, grain: .045, contrast: .12, sat: .1 }, own = F.part != null && F.mode !== 'rip' ? PARTS[F.part].fx(lt) : {}; return Object.assign(base, own, { fade: Math.max(1 - seg(lt, 0, .22), seg(lt, CUR.dur - .35, CUR.dur - .02)), fadeColor: '0,0,10' }); },
  blur: lt => { const F = frameOf(lt); return F.mode === 'dive' ? 10 : F.mode === 'rip' ? 10 : F.mode === 'pull' ? 10 : 1; },
  over(lt) { sfxWord(lt, B('end').s + .10, 'WAH WAH', 540, 470, { size: 120, rot: -.06, hold: .9 }); },
};
window.__EP10_SCENES = window.__EP10_SCENES || {};
window.__EP10_SCENES.days = SC;
})();
