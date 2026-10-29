'use strict';
/* SHIFT HAPPENS, episode 99: the UI kit test. NOT part of any release. It exercises every helper of ui.js with torture strings and proves the text gate (txaudit.js) works.
 *
 *   labels  (3.0 s, keeps the clock pill and the caption scrim) pills, signs, buttons, a tag and a stamp: centred and left aligned, long names, descenders, all caps, numbers, letter spacing, italic
 *   text    (3.0 s) paragraphs that wrap and shrink to their box, blocks of lines on a baseline grid (left, centre, right), a word wider than its line, a grid of cells, a pill sized with UI.sizeOf
 *   paper   (3.0 s) a ruled page with handwriting on the rules, a table (one cell with a too-long name), a sign-in sheet with a separate signature column, a quiz card with a timer ring
 *   zoom    (4.2 s) the same sign under zoomTo-style camera moves (zoom 1, 1.5, 2) and rotations (0, 3, 6 degrees): the gate must still pass
 *   stack   (3.0 s) a title card and an end card built with UI.stack, perfectly centred
 *   bad     (3.0 s, keeps the clock pill and the scrim) DELIBERATE violations, one per object: tools_gate_selftest.sh checks that the gate reports every one of them and nothing else anywhere
 * Every scene except `bad` must audit with zero issues, notes included.
 */
(() => {
if (!window.TIMELINE_EP99) return;
const BG = '#241f3a', INK = '#15111a', YEL = '#ffe135', RED = '#ff3b55', PAPER = '#fbf7e8', NAVY = '#1f3b73', TEAL = '#7be0d0', PINK = '#ff9db1', LILAC = '#c9b8ff', PEACH = '#ffd0a0';
const GRADE = { bloom: 0, vignette: 0, grain: 0, contrast: 0, sat: 0 };
const bg = (c = BG) => { ctx.fillStyle = c; ctx.fillRect(-3000, -3000, 7000, 8000); };
const scene = (draw, extra) => Object.assign({ shot: () => 'card', cam() { CAM.x = W / 2; CAM.y = H / 2; CAM.z = 1; }, draw, fx: () => GRADE, blur: () => 1, over() {} }, extra);
const SCENES = {};

// ============================================================================ labels
SCENES.labels = scene(lt => {
  bg();
  // the 44-character name must shrink to fit its pill, and stay readable
  UI.pill('Bartholomew Wilhelmina Montgomery-Fitzgerald', 540, 322, { size: 44, maxW: 860, id: 'long' });
  // pills in two columns: descenders, all caps, numbers, letter spacing in Bangers and in Nunito, italic, an edge-anchored pill
  const L = 290, R = 790;
  UI.pill('NURSE', L, 420, { size: 40 });
  UI.pill('gypsy Jumpy', R, 420, { size: 40, fill: TEAL });
  UI.pill('ALL CAPS NAME', L, 500, { size: 40 });
  UI.pill('1234567890', R, 500, { size: 40, fill: PINK });
  UI.pill('SHIFT HAPPENS', L, 580, { size: 50, font: 'Bangers', spacing: 8 });
  UI.pill('RESIDENT COUNCIL', R, 580, { size: 34, spacing: 6, fill: LILAC });
  UI.pill('Italic Quipper', L, 660, { size: 40, italic: true });
  UI.pill('left anchored', 570, 660, { size: 36, anchor: 'left', fill: PEACH });
  // signs: two lines, one line that has to shrink, three lines of different sizes
  const sx = UI.rowX(3, 60, 1020, { w: 300 });
  UI.sign([sx[0], 735, 300, 200], ['NURSES', 'STATION'], { fill: NAVY, stroke: '#fff', lw: 4, size: 54, pad: 20, tstroke: '#06122e', tlw: 8, id: 'sg1' });
  UI.sign([sx[1], 735, 300, 200], 'gypsy Jumpy', { fill: '#f6f0dc', ink: BG, size: 60, pad: 20, id: 'sg2' });
  UI.sign([sx[2], 735, 300, 200], [{ t: 'ROOM 12', size: 56 }, { t: 'Mr. Bartholomew', size: 34, weight: 700 }, { t: 'FALL RISK', size: 32, fill: '#ff6b81', gap: 4 }], { fill: '#2b2740', stroke: YEL, lw: 4, pad: 20, id: 'sg3' });
  // left and right aligned labels on one baseline grid inside a panel, a tag and a stamp beside it
  const pa = UI.panel([60, 970, 480, 190], { fill: '#f6f0dc', r: 18, id: 'pa' });
  const ix = pa.inner[0], ir = pa.inner[0] + pa.inner[2];
  UI.label('Name', ix, 1020, { align: 'left', size: 36, fill: '#7a6f8a', weight: 800, cid: 'pa' });
  UI.label('Bob Applegate', ir, 1020, { align: 'right', size: 36, fill: INK, cid: 'pa' });
  UI.label('Room', ix, 1070, { align: 'left', size: 36, fill: '#7a6f8a', weight: 800, cid: 'pa' });
  UI.label('12B', ir, 1070, { align: 'right', size: 36, fill: INK, cid: 'pa' });
  UI.label('Allergies', ix, 1120, { align: 'left', size: 36, fill: '#7a6f8a', weight: 800, cid: 'pa' });
  UI.label('gypsy, Jumpy', ir, 1120, { align: 'right', size: 36, fill: INK, cid: 'pa' });
  UI.tag(['HELLO, I AM', { t: 'Strawberry', size: 52 }], 800, 1010, { size: 30, fill: PAPER, id: 'tag1' });
  UI.stamp('APPROVED', 800, 1130, { size: 50 });
  // buttons in a row with equal gaps
  const bx = UI.rowX(3, 60, 1020, { w: 290 });
  UI.button('YES', bx[0] + 145, 1245, { size: 40, fill: '#5be08a' });
  UI.button('NO WAY', bx[1] + 145, 1245, { size: 40, fill: RED, ink: '#fff', tstroke: '#7a0a1c', tlw: 6 });
  UI.button('Maybe later', bx[2] + 145, 1245, { size: 40, fill: YEL, maxW: 290 });
  UI.strike('Double shift', 300, 1330, { size: 44, fill: '#fff', align: 'center' });
  UI.label('Single shift', 780, 1330, { size: 44, fill: YEL, reveal: seg(lt, .2, 1.6) });   /* typed in: the whole string keeps its place */
});

// ============================================================================ text
SCENES.text = scene(() => {
  bg('#2a2540');
  // paragraphs: wrapped by words, shrunk (never squished) until they fit the box height
  const p1 = UI.panel([50, 70, 480, 360], { fill: '#f6f0dc', r: 22, id: 'p1' });
  UI.para('The sign-in sheet was blank at 3:00 PM, so Strawberry signed for everyone, including the pizza.', [p1.inner[0], p1.inner[1], p1.inner[2], p1.inner[3]], { size: 40, fill: INK, align: 'left', valign: 'top', cid: 'p1' });
  const p2 = UI.panel([550, 70, 480, 360], { fill: NAVY, r: 22, id: 'p2' });
  UI.para('Per diem staff must wear the good cuff, never say the Q-word, and keep the pizza budget at exactly zero dollars. Sure! Please sign in the signature column, not on the printed cells. gypsy Jumpy will check.',
    [p2.inner[0], p2.inner[1], p2.inner[2], p2.inner[3]], { size: 44, fill: '#fff', align: 'center', valign: 'middle', cid: 'p2' });
  // blocks of lines on a baseline grid: left, centre and right aligned (the ink edge sits exactly on the anchor)
  const lx = UI.rowX(3, 50, 1030, { w: 300 });
  const al = ['left', 'center', 'right'], ax = [lx[0] + 30, lx[1] + 150, lx[2] + 270];
  al.forEach((a, i) => {
    UI.panel([lx[i], 470, 300, 250], { fill: '#3a3358', r: 18, id: 'lb' + i });
    UI.lines(['MENU BOARD', { t: 'Pizza Friday', size: 40, fill: YEL }, { t: 'Budget: $0.00', size: 40 }, { t: 'gypsy Jumpy', size: 40, fill: TEAL }], ax[i], 535, { size: 34, fill: '#fff', align: a, lh: 1.35, maxW: 260 });
  });
  // a word wider than its line shrinks the whole block; wrap() and lines() compose
  const w = UI.wrap('Supercalifragilistic words are wide', 440, { size: 46 });
  UI.panel([50, 760, 480, 230], { fill: '#f6f0dc', r: 18, id: 'wb' });
  UI.lines(w, 70, 830, { size: w.size, fill: INK, lh: 1.25, cid: 'wb' });
  // sizeOf: a pill built by hand from measured numbers, label centred in it
  const sz = UI.sizeOf('Sized by sizeOf', { size: 42 }), pw = Math.ceil(sz.w + 70);
  UI.panel([550 + (480 - pw) / 2, 770, pw, 80], { fill: PINK, r: 40, id: 'so', pad: 10 });
  UI.label('Sized by sizeOf', 790, 810, { size: 42, fill: INK, cid: 'so', center: true });
  UI.label('snap(137) = ' + UI.snap(137), 790, 885, { size: 34, fill: '#d8d0f0' });
  UI.label('snap(137, 50) = ' + UI.snap(137, 50), 790, 930, { size: 34, fill: '#d8d0f0' });
  // two pills that share one id in the same frame must not disturb each other's centring check
  UI.pill('same id', 665, 990, { size: 30, fill: LILAC, id: 'dup' });
  UI.pill('twice over', 905, 990, { size: 30, fill: PEACH, id: 'dup' });
  // a grid of cells with equal gaps, a figure centred in each
  const g = UI.gridX(3, 2, [50, 1050, 980, 380], { gap: 24 });
  g.forEach((c, i) => {
    UI.panel(c, { fill: [YEL, '#ffb000'], r: 24, id: 'g' + i, shadow: 12 });
    UI.label(String(i + 1), c[0] + c[2] / 2, c[1] + c[3] / 2, { size: 110, font: 'Lucky', fill: INK, cid: 'g' + i, center: true });
  });
}, { noChyron: true, noScrim: true });

// ============================================================================ paper
SCENES.paper = scene(() => {
  bg('#2a2540');
  // a ruled page with handwriting ON the rules (baseline = rule - 0.24 x pitch), turned a little on the desk
  const pg = UI.page([50, 70, 500, 650], { pitch: 70, top: 105, fold: true, marginLine: true, rot: -.035, id: 'page' });
  ['Check vitals', 'gypsy Jumpy', 'Room 12B', 'Call light OFF', 'Pizza Friday!', 'Q-word banned', 'Sure! x3', 'Per diem: none'].forEach((s, i) => UI.onRule(s, pg.inner[0] + 14, i, pg));
  // a quiz card: title, three answer buttons, a timer ring
  UI.panel([590, 70, 440, 650], { fill: NAVY, stroke: '#fff', lw: 5, r: 34, shadow: 24, id: 'quiz' });
  UI.sign([620, 100, 380, 150], ['Who may', 'sign the sheet?'], { fill: '#17294f', size: 44, r: 22, pad: 16, id: 'quiz-title' });
  UI.button('A  Strawberry', 810, 315, { size: 40, fill: '#fff', maxW: 380 });
  UI.button('B  gypsy Jumpy', 810, 410, { size: 40, fill: TEAL, maxW: 380 });
  UI.button('C  Mr. Bartholomew', 810, 505, { size: 40, fill: PEACH, maxW: 380 });
  UI.ring(810, 630, 56, .65, { text: '13', size: 54, color: YEL });
  // a table with a header and six rows; one name is too long for its column and shrinks (never squished)
  UI.table([60, 790, 960, 448], [{ w: 100, align: 'center' }, { w: 380 }, { w: 300 }, { align: 'right' }], [
    ['12A', 'Strawberry Applegate', 'Metoprolol 25 mg', '4:00 PM'],
    ['12B', 'gypsy Jumpy', 'Lisinopril 10 mg', '4:00 PM'],
    ['14', 'Montgomery-Fitzgerald', 'Aspirin 81 mg', '4:30 PM'],
    ['15A', 'Bob Applegate', 'Insulin 12 units', '5:00 PM'],
    ['15B', 'Mr. Bartholomew', 'Vitamin D 1000 IU', '5:00 PM'],
    ['16', 'Ms. Pea', 'Metformin 500 mg', '5:30 PM'],
  ], { header: ['Rm', 'Resident', 'Medication', 'Due'], size: 34, zebra: 'rgba(60,40,120,.07)', id: 'meds' });
  // a sign-in sheet: the handwriting has its own column, never on top of a printed cell
  UI.table([60, 1280, 960, 448], [{ w: 90, align: 'center' }, { w: 390 }, { w: 200, align: 'center' }, { fill: '#23408e', italic: true, weight: 800 }], [
    ['1', 'Strawberry Applegate', '2:58 PM', 'S. Applegate'],
    ['2', 'gypsy Jumpy', '2:59 PM', 'gypsy J.'],
    ['3', 'Montgomery-Fitzgerald', '3:01 PM', 'M-Fitz'],
    ['4', 'Bob Applegate', '3:02 PM', 'B. Applegate'],
    ['5', 'Mr. Bartholomew', '3:02 PM', 'Mr. B'],
    ['6', 'Ms. Pea', '3:04 PM', 'Ms. Pea'],
  ], { header: ['#', 'Name', 'Time in', 'Signature'], size: 34, headFill: '#5a2d4a', id: 'sheet' });
}, { noChyron: true, noScrim: true });

// ============================================================================ zoom
// the same sign under camera moves: zoom 1, 1.5, 2 x camera roll 0, 3, 6 degrees, then the sign itself turned 3, 6 and -6 degrees. Each pose is held 0.35 s and eased into.
// pose = [zoom, camera roll (deg), sign roll (deg), camera dx, camera dy]
const POSES = [[1, 0, 0, 0, 0], [1, 3, 0, 0, 0], [1, 6, 0, 0, 0], [1.5, 0, 0, 0, 0], [1.5, 3, 0, 40, -30], [1.5, 6, 0, -40, 30], [2, 0, 0, 0, 0], [2, 3, 0, 20, 15], [2, 6, 0, -20, -15], [1.5, 0, 3, 0, 0], [1.5, 0, 6, 0, 0], [1.5, 0, -6, 0, 0]];
const HOLD = .35;
const pose = lt => {
  const i = clamp(Math.floor(lt / HOLD), 0, POSES.length - 1), f = (lt - i * HOLD) / HOLD, a = POSES[Math.max(0, i - 1)], b = POSES[i], k = easeIO(seg(f, 0, .3));
  return b.map((v, j) => lerp(a[j], v, k));
};
SCENES.zoom = scene(lt => {
  bg('#d9d2bf');
  ctx.strokeStyle = 'rgba(80,60,40,.25)'; ctx.lineWidth = 3;
  for (let y = 600; y <= 1400; y += 100) { ctx.beginPath(); ctx.moveTo(-500, y); ctx.lineTo(1600, y); ctx.stroke(); }
  const p = pose(lt);
  UI.sign([320, 870, 440, 220], [{ t: 'NURSES STATION', size: 44 }, { t: 'gypsy Jumpy', size: 36, weight: 700 }], { fill: NAVY, stroke: '#fff', lw: 5, pad: 24, rot: p[2] * PI / 180, shadow: 14, id: 'zs' });
  UI.pill('COUNCIL', 540, 1160, { size: 36, spacing: 6, fill: '#fff', stroke: INK, lw: 4, id: 'zp' });
  UI.label('Italic Quipper', 540, 790, { size: 48, italic: true, fill: INK });
}, {
  noChyron: true, noScrim: true,
  cam(lt) { const p = pose(lt); CAM.x = 540 + p[3]; CAM.y = 980 + p[4]; CAM.z = p[0]; CAM.r = p[1] * PI / 180; },
  over(lt) { const p = pose(lt); UI.label(`zoom ${p[0].toFixed(2)}  roll ${p[1].toFixed(1)}  sign ${p[2].toFixed(1)}`, 540, 1860, { size: 28, fill: '#fff', hero: false }); },
});

// ============================================================================ stack
const titleCard = () => {
  bg(); ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#3a2a6a'], [1, '#161028']]); ctx.fillRect(0, 0, W, H);
  UI.stack([
    { t: 'SHIFT HAPPENS', font: 'Bangers', size: 150, spacing: 10, fill: YEL, stroke: INK, lw: 16, gap: 44 },
    { pill: 'EPISODE 99', font: 'Bangers', size: 46, spacing: 5, bg: RED, ink: '#fff', gap: 56 },
    { t: 'The UI Kit Test', font: 'Lucky', size: 84, fill: '#fff', stroke: INK, lw: 10, gap: 44 },
    { lines: ['Everything is centred.', 'Nothing is squished.'], size: 46, weight: 800, fill: '#d8d0f0', gap: 70 },
    { t: 'a gypsy Jumpy production', size: 34, weight: 800, fill: '#a79ec4' },
  ], { cx: 540, cy: 960, maxW: 960 });
};
const endCard = () => {
  bg(); ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#6a2a4a'], [1, '#1a0f1e']]); ctx.fillRect(0, 0, W, H);
  UI.stack([
    { t: 'THE END', font: 'Lucky', size: 170, spacing: 6, fill: YEL, stroke: INK, lw: 18, gap: 40 },
    { t: 'See you next shift', size: 64, fill: '#fff', gap: 50 },
    { pill: 'EPISODE 100: SOON', size: 38, spacing: 3, bg: '#fff', ink: INK, gap: 64 },
    { lines: ['Written by gypsy Jumpy', 'Drawn entirely in code'], size: 36, weight: 800, fill: '#d8c6d8' },
  ], { cx: 540, cy: 960, maxW: 960 });
};
SCENES.stack = scene(lt => { if (lt < 1.5) titleCard(); else endCard(); }, { noChyron: true, noScrim: true });

// ============================================================================ bad: deliberate violations, one per object (tools_gate_selftest.sh looks for each of them by name)
SCENES.bad = scene(() => {
  bg('#2a1530');
  const T = (s, x, y, o = {}) => text(s, x, y, Object.assign({ size: 48, fill: '#fff', hero: true }, o));
  // 1 upside down: a vertically flipped string
  ctx.save(); ctx.translate(290, 330); ctx.scale(1, -1); T('FLIPPED', 0, 0, { size: 56 }); ctx.restore();
  // 2 mirrored
  ctx.save(); ctx.translate(790, 330); ctx.scale(-1, 1); T('MIRRORED', 0, 0, { size: 56 }); ctx.restore();
  // 3 cut off by the frame edge
  T('CUT OFF', 1040, 440, { size: 56 });
  // 4 two different strings printed over each other
  T('OVERLAP', 290, 440, { size: 56 }); T('TEXT', 330, 452, { size: 56, fill: YEL });
  // 5 a label 12 px off the centre of its pill (it declares its container and asks to be centred)
  UI.panel([100, 540, 380, 80], { id: 'offc', kind: 'pill', r: 40, fill: YEL, pad: 12 });
  UI.label('OFF CENTRE', 290 + 12, 580, { size: 44, fill: INK, cid: 'offc', center: true });
  // 6 tilted 20 degrees
  T('TILTED 20', 790, 580, { size: 52, rot: 20 * PI / 180 });
  // 7 a hero string under the caption zone (this scene keeps the scrim)
  T('UNDER THE CAPTIONS', 540, 1500, { size: 52 });
  // 8 a hero string covered by a rectangle drawn later
  T('COVERED SIGN', 290, 700, { size: 52 }); ctx.fillStyle = '#6a5acd'; ctx.fillRect(290, 660, 200, 80);
  // 9 a hero string 18 px tall
  T('TOO SMALL TO READ', 790, 700, { size: 18 });
  // 10 (extra) text that runs out of the sign it names as its container
  UI.panel([60, 795, 260, 70], { id: 'tiny', kind: 'sign', fill: '#3a3358', pad: 8 });
  UI.write('RUNS OUT OF ITS SIGN', 70, 842, { size: 36, cid: 'tiny' });
  // 11 (extra) UI.fit cannot fit this in 100 px even at its minimum size
  UI.fit('Supercalifragilistic', 100, { size: 40, min: 30 });
  // 12 (extra) a table cell too long even at the smallest size: cut with an ellipsis, and reported
  UI.table([580, 790, 440, 80], [{ w: 120 }, { w: 320 }], [['ROW', 'Supercalifragilisticexpialidocious']], { size: 34, rowH: 80, id: 'ell' });
  // 13 (extra) hero text inside the safe margin
  T('MARGIN', 30, 960, { size: 44, align: 'left' });
  // 14 (extra) hero text under the clock pill
  T('UNDER CLOCK', 250, 170, { size: 40 });
  // 15 (extra) sheared text
  ctx.save(); ctx.translate(790, 960); ctx.transform(1, 0, -.6, 1, 0, 0); T('SKEWED', 0, 0, { size: 50 }); ctx.restore();
  // 16 (extra) a label that names a container nobody registered
  UI.write('NO CONTAINER', 100, 1100, { size: 40, cid: 'ghost' });
});

EPISODES[99] = { num: 99, v2: true, textGate: true, balanceCaps: true, title: 'UI kit test', TL: window.TIMELINE_EP99, SCENES, layout: 'v2', audio: '' };
})();
