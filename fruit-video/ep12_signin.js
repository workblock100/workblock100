'use strict';
/* SHIFT HAPPENS, Episode 12: "The In-Service". Scene module: signin (2:58 PM, THE CONFERENCE ROOM, 26.20 s).
 *
 * The sign-in sheet on the long table. The Administrator stands at the head with a remote; the staff sit along the far side of the table, facing the camera.
 * Clementine signs with a flourish (a heart over the i), Mango holds the clipboard, Strawberry says she is per diem and not in her contract,
 * Lemon reads that Persimmon is not attending (agency). The pizza cart is wheeled in and a slice comes out. Strawberry signs under protest,
 * and at the end she stands up, steps toward the door and stops by the table, still in the room.
 *
 * Shots (scene-local seconds; the beat names are the script's):
 *   0.00 open: wide on the table                              | 1.60 a1: wide, the Administrator with the remote, a slow push
 *   3.85 cuC: Clementine "Sure!" (close)                      | 4.50 sign: INSERT, the sheet; Clementine's name in bubble letters, a heart over the i
 *   5.56 two1: two-shot, Mango with the clipboard and Clementine  | 7.13 cuS1: Strawberry "I'm per diem."
 *   8.12 two2: the Administrator's cheerful face and Strawberry's flat one (one frame) | 10.39 cuS2: "Then it's not in my contract."
 *  12.22 cuL: Lemon, deadpan, "Persimmon is not attending."     | 14.97 cuS3: "Lucky."
 *  15.76 pizza: the cart rolls in from the back right; push-in on the boxes, steam, a slice rises out of the top box
 *  17.06 wide3: the Administrator holds the slice and points at the cart | 19.38 cuS4: "Then I'm an attendee."
 *  20.66 sign2: INSERT, Strawberry's signature writes live, then "(under protest)"  | 21.71 cuS5: "Under protest." (flat)
 *  22.81 last: the Administrator smiles; Strawberry stands and steps back, stays by the table at the far side (kept in frame; she does not leave)
 *  24.85 end: hold on the wide.
 * Layout (world units, the room set S12room): far-side seats at Z 1110, X -440 (Clementine), -180 (Mango), 80 (Lemon), 340 (Strawberry);
 * the Administrator at X 500, Z 880 (beside the table's head); the table X -500..480, Z 760..1000; the pizza cart at X -520, Z 1230 (by the door, rolled in from the left).
 */
(() => {
if (!window.TIMELINE_EP12) return;
const R = window.S12room, HP = window.H6;   /* (not H: that is the frame height, and a fill of H high painted nothing) */
const { zoomTo, faceZoom, faceC, inB } = HP;
const A12 = window.A12;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11;
const { p2 } = V2;

// ------------------------------------------------------------------ helpers (sk: the eased segment, as in ep11_orient.js)
const sk = (t, a, b) => easeIO(seg(t, a, b));
// ------------------------------------------------------------------ timing: beat starts are read at run time (CUR is set per frame), never at load
const beat = id => CUR.beats[id];
const tS = id => beat(id).s;

// the shot in force at scene time lt (each cut lands on the start of a beat)
const SHOTS = () => [
  ['open', 0], ['a1', tS('a1')], ['cuC', tS('c1') - .05], ['ins1', tS('sign') - .02], ['two1', tS('m1') - .03],
  ['cuS1', tS('s1') - .05], ['two2', tS('a2') - .05], ['cuS2', tS('s2') - .05], ['cuL', tS('l1') - .05],
  ['cuS3', tS('s3') - .05], ['pizza', tS('pizza') - .05], ['wide3', tS('a3') - .05], ['cuS4', tS('s4') - .05],
  ['ins2', tS('sign2') - .05], ['cuS5', tS('s5') - .05], ['last', tS('a4') - .05], ['end', tS('end') - .05],
];
const shotOf = lt => { let n = 'open'; for (const [k, t0] of SHOTS()) if (lt >= t0) n = k; return n; };
const shotStart = n => { const s = SHOTS().find(([k]) => k === n); return s ? s[1] : 0; };
const isIns = sh => sh === 'ins1' || sh === 'ins2';

// ------------------------------------------------------------------ the cast: where everyone is, and what they do, at lt
const SEAT = { clem: [-440, 1110], mango: [-180, 1110], lemon: [80, 1110], straw: [340, 1110] };
const ADMIN = [545, 880];
const WIDE_Z = 1.0, WIDE_CX = 650;   /* the wide frames are centred on the whole cast: Clementine's seat to the Administrator's remote */
const CART = { Z: R.LAY.pizza.Z };
// Strawberry's walk: she stands up after "I'm an attendee" is over, and steps toward the door; she stops beside the table end
const standK = lt => sk(lt, tS('a4') + .05, tS('a4') + .55);
const walkK = lt => sk(lt, tS('a4') + .4, tS('a4') + 1.4);
// the pizza cart: wheeled in from the back right, stops at X 700
const cartX = lt => { const a = tS('pizza') - .2, b = tS('pizza') + 1.05; return lt < a ? -1300 : lerp(-1300, R.LAY.pizza.X, easeOut(seg(lt, a, b))); };   /* rolls in from beyond the frame in every shot */

function bodyAdmin(lt) {
  const o = R.pt(ADMIN[0], 0, ADMIN[1]);
  const base = { x: o.x, y: o.y, s: o.s * 1.22, who: 'melon', expr: 'happy', look: [0, 0] };
  if (lt >= tS('a3') - .02 && lt < tS('a4')) Object.assign(base, { arms: { l: 'hold', r: 'point' }, hold: { l: 'slice12' }, grip: { l: [-140, 120] } });
  else if (lt >= tS('pizza') && lt < tS('a3') - .02) Object.assign(base, { arms: { l: 'hips', r: 'hold' }, hold: { r: 'remote12' }, grip: { r: [96, 30] }, look: [-.3, .1] });
  else if (lt >= tS('a4')) Object.assign(base, { expr: 'happy', arms: { l: 'hips', r: 'wave' } });
  else Object.assign(base, { arms: { l: 'hips', r: 'hold' }, hold: { r: 'remote12' }, grip: { r: [96, 30] }, look: [-.2, 0] });
  return A9.melon(base);
}
function bodySeated(id, extra) {
  const [X, Z] = SEAT[id], p = R.seatPt(X, Z);
  return Object.assign({ x: p.x, y: p.y, s: p.s, noLegs: true, lift: 26 * p.s }, extra);   /* seated a little tall: the table top would hide their badges */
}
function bodyClem(lt) {
  let o;
  if (inB(lt, 'c1')) o = bodySeated('clem', { expr: 'hopeful', arms: { l: 'rest', r: 'up' }, look: [0, 0], sy: 1 - .04 * Math.sin((lt - tS('c1')) * 22) * (1 - seg(lt, tS('c1') + .3, beat('c1').e)) });
  else if (lt >= tS('sign') + .02 && lt < beat('sign').e - .05) o = bodySeated('clem', { expr: 'hopeful', arms: { l: 'rest', r: 'hold' }, hold: { r: 'pen12' }, grip: { r: [40, 130] }, look: [0, .3] });
  else o = bodySeated('clem', { expr: 'hopeful', arms: { l: 'rest', r: 'rest' }, look: [0, 0] });
  return A10.clem(o);
}
function bodyMango(lt) {
  let o;
  if (lt >= tS('m1') - .1 && lt < beat('m1').e + .1) o = bodySeated('mango', { expr: 'happy', arms: { l: 'hold', r: 'point' }, hold: { l: 'sign12' }, grip: { l: [-118, 50] }, look: [.6, 0] });
  else o = bodySeated('mango', { expr: 'happy', arms: { l: 'rest', r: 'rest' }, look: [.3, 0] });
  return A7.mango(o);
}
function bodyLemon(lt) {
  const o = bodySeated('lemon', inB(lt, 'l1') ? { expr: 'dead', look: [-.5, .3], arms: { l: 'rest', r: 'rest' } } : { expr: 'neutral', look: [-.4, .1], arms: { l: 'rest', r: 'rest' } });
  return A7.lemon(o);
}
function bodyStraw(lt) {
  const st = standK(lt);
  if (lt >= tS('a4') + .05) {
    const k = walkK(lt), X = lerp(340, 320, k), Z = lerp(1110, 1190, k), q = R.pt(X, lerp(120, 0, st), Z);
    return A11.straw({ x: q.x, y: q.y, s: q.s, noLegs: st < .5, lift: 26 * q.s * (1 - st), expr: 'chill', look: [.4, 0], arms: { l: 'rest', r: 'rest' } });   /* the seated lift eases away as she rises: no pop */
  }
  let o;
  if (inB(lt, 's1')) o = bodySeated('straw', { expr: 'sour', arms: { l: 'rest', r: 'rest' }, look: [.5, 0], lid: .34 });
  else if (inB(lt, 's2')) o = bodySeated('straw', { expr: 'dead', arms: { l: 'shrug', r: 'rest' }, look: [.3, 0], lid: .5 });
  else if (inB(lt, 's3')) o = bodySeated('straw', { expr: 'chill', arms: { l: 'rest', r: 'rest' }, look: [-.2, 0], lid: .4 });
  else if (inB(lt, 's4')) o = bodySeated('straw', { expr: 'neutral', arms: { l: 'rest', r: 'rest' }, lid: .4 });
  else if (lt >= tS('sign2') - .05 && lt < beat('sign2').e - .05) o = bodySeated('straw', { expr: 'sour', arms: { l: 'rest', r: 'hold' }, hold: { r: 'pen12' }, grip: { r: [40, 130] }, lid: .4, look: [0, .3] });
  else if (inB(lt, 's5')) o = bodySeated('straw', { expr: 'dead', arms: { l: 'rest', r: 'rest' }, lid: .5 });
  else o = bodySeated('straw', { expr: 'sour', arms: { l: 'rest', r: 'rest' } });
  return A11.straw(o);
}
// the body (constructed options) of a character by id, for the camera to frame
const bodyOf = (id, lt) => id === 'admin' ? bodyAdmin(lt) : id === 'straw' ? bodyStraw(lt) : id === 'clem' ? bodyClem(lt) : id === 'mango' ? bodyMango(lt) : bodyLemon(lt);

// ------------------------------------------------------------------ props: the clipboard, the pen on its string, the remote, the pizza slice
Object.assign(PROP_BOX, {
  sign12: [-44, -96, 44, 22], pen12: [-14, -96, 14, 60], remote12: [-16, -44, 16, 14], slice12: [-54, -92, 54, 16],
});
EXT.prop.sign12 = (side, o, t) => {   // the sign-in clipboard: a board with a clip at the top and the printed sheet, names in tiny type
  ctx.save(); ctx.rotate(side * .04); ctx.lineJoin = 'round';
  ctx.fillStyle = '#7d5b36'; ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = 3; rr(-40, -88, 80, 108, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fbf8ef'; rr(-32, -74, 64, 90, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7f8691'; rr(-16, -96, 32, 16, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9c4b5'; for (let i = 0; i < 5; i++) ctx.fillRect(-24, -56 + i * 14, 48, 2);
  ctx.fillStyle = '#2a5ac8'; ctx.fillRect(-24, -62, 22, 3);
  ctx.restore();
};
EXT.prop.pen12 = (side, o, t) => {   // a blue ballpoint on a short string: the pen is held by the barrel, the string runs up to the clip
  ctx.save(); ctx.rotate(side * .08); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(25,16,30,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(-12, -60, 0, -92); ctx.stroke();
  ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = 'rgba(25,16,30,.62)'; ctx.lineWidth = 2.6; rr(-6, -26, 12, 60, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c0c6cf'; rr(3, -20, 3.5, 30, 2); ctx.fill();
  ctx.fillStyle = '#c0c6cf'; ctx.beginPath(); ctx.moveTo(-6, 34); ctx.lineTo(6, 34); ctx.lineTo(0, 46); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
};
EXT.prop.remote12 = (side, o, t) => {   // the Administrator's presenter clicker: a black remote, a red button, a green tip
  ctx.save(); ctx.rotate(side * .1); ctx.lineJoin = 'round';
  ctx.fillStyle = '#2b2a33'; ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = 2.6; rr(-13, -40, 26, 56, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d6202e'; ell(0, -22, 5.5, 5.5); ctx.fill();
  ctx.fillStyle = '#3ac46a'; ell(0, -2, 4, 4); ctx.fill();
  ctx.fillStyle = '#5c5a66'; for (let i = 0; i < 3; i++) ctx.fillRect(-7, 6 + i * 6, 14, 2.4);
  ctx.restore();
};
EXT.prop.slice12 = (side, o, t) => {   // a slice of cheese pizza held by its crust: a wedge, cheese drips, two pepperoni
  ctx.save(); ctx.rotate(side * -.12); ctx.lineJoin = 'round';
  ctx.fillStyle = '#f2c44b'; ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-52, -6); ctx.quadraticCurveTo(0, -94, 52, -6); ctx.quadraticCurveTo(0, 10, -52, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9934a'; ctx.beginPath(); ctx.moveTo(-54, -4); ctx.quadraticCurveTo(0, 12, 54, -4); ctx.quadraticCurveTo(54, 10, 0, 16); ctx.quadraticCurveTo(-54, 10, -54, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c7322b'; ell(-12, -46, 9, 9); ctx.fill(); ell(14, -30, 8, 8); ctx.fill();
  ctx.restore();
};

// ------------------------------------------------------------------ the sign-in sheet lying on the table top (set dressing: shapes only)
// Seen from the camera's side the sheet is a flat, foreshortened paper: its lettering would be a few pixels high and squashed, so it carries none here (the inserts show the real sheet,
// in the UI kit's table). Its marks are bars and scribbles: the printed names, Clementine's orange signature, Persimmon's red line and Strawberry's red signature, at their story times.
// The plane transform keeps local x to the right and local y TOWARD the camera (down the screen): nothing on it is flipped.
function sheetOnTable(lt) {
  const cX = -20, cZ = 880, Y = R.LAY.table.top + 1, hw = 150, hd = 104;
  const O = p2(cX, Y, cZ), ex = p2(cX + hw, Y, cZ), ey = p2(cX, Y, cZ - hd);
  ctx.save();
  ctx.transform((ex[0] - O[0]) / hw, (ex[1] - O[1]) / hw, (ey[0] - O[0]) / hd, (ey[1] - O[1]) / hd, O[0], O[1]);
  ctx.fillStyle = 'rgba(40,30,20,.22)'; rr(-hw + 6, -hd + 8, 2 * hw, 2 * hd, 3); ctx.fill();
  ctx.fillStyle = '#fbf8ef'; rr(-hw, -hd, 2 * hw, 2 * hd, 3); ctx.fill();
  ctx.fillStyle = '#1f2640'; rr(-hw + 14, -hd + 12, 150, 11, 3); ctx.fill();            /* the heading */
  ctx.fillStyle = '#b3aec0'; rr(-hw + 14, -hd + 30, 190, 5, 2); ctx.fill();            /* the small print */
  ctx.strokeStyle = '#1f2640'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-hw + 10, -hd + 52); ctx.lineTo(hw - 10, -hd + 52); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const y = -hd + 72 + i * 36, nameW = [78, 42, 44, 70, 76][i];
    ctx.fillStyle = '#3a3550'; rr(-hw + 14, y - 5, nameW, 8, 3); ctx.fill();                                     /* the printed name */
    ctx.strokeStyle = '#b9b4a6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-hw + 10, y + 14); ctx.lineTo(hw - 10, y + 14); ctx.stroke();
  }
  const scribble = (x0, y, len, col, lw, amp) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); for (let u = 0; u <= 1.001; u += .05) { const x = x0 + u * len, yy = y + Math.sin(u * 17) * amp * (.5 + .5 * Math.sin(u * 5)); u ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); };
  if (lt >= tS('sign') + .4) scribble(-hw + 96, -hd + 72, 100, '#ff7a1a', 4, 6);
  if (lt >= tS('l1') + .8) { ctx.fillStyle = '#d6202e'; rr(-hw + 96, -hd + 72 + 4 * 36 - 5, 118, 8, 3); ctx.fill(); }
  if (lt >= tS('sign2') + .95) scribble(-hw + 96, -hd + 72 + 3 * 36, 86, '#d62a3a', 3, 5);
  ctx.restore();
}

// ------------------------------------------------------------------ the world: the room, the staff, the Administrator, the pizza cart
// which staff are in focus in each shot (null: everyone, a wide). A character who is not the subject is drawn only when the WHOLE of him is in the frame (a soft neighbour at some depth);
// one that the frame would cut is not drawn at all: the close-ups are clean singles and two-shots, never an over-the-shoulder blur
const FOCUS = { cuC: ['clem'], two1: ['clem', 'mango'], cuS1: ['straw'], two2: ['straw', 'admin'], cuS2: ['straw'], cuL: ['lemon'], cuS3: ['straw'], cuS4: ['straw'], cuS5: ['straw'], pizza: ['cart'] };
const WIDE = ['open', 'a1', 'wide3', 'last', 'end'];
function world(lt, t) {
  R.cam();
  R.light({});
  R.shell({ flick: t });
  R.back({ min: 58, hr: 2 });
  R.screen({ down: 0 });
  // (the projector cart is for the slides scene: in this wide it would stand in front of Clementine)
  // who is in this shot: the chairs of the staff who are not drawn are not drawn either (no empty chair where somebody should be sitting)
  const sh = shotOf(lt), focus = FOCUS[sh];
  const IDS = ['clem', 'mango', 'lemon', 'straw'], shown = {};
  for (const id of IDS) {
    const o = bodyOf(id, lt);
    shown[id] = !focus || focus.includes(id) || (sh !== 'pizza' && A12.charWhole(o, 20));   /* (a neighbour of the subject is drawn only when the whole of him is in the frame, and then sharp) */
  }
  IDS.forEach((id, i) => { if (shown[id] || sh === 'pizza' || (focus && focus.includes('cart'))) R.chair(R.LAY.seats.xs[i], R.LAY.seats.far, {}); });
  // the pizza cart by the door: wheeled in on its beat; the top box lands on its tap; a slice rises from the top box
  const cx = cartX(lt), pzZ = CART.Z;
  const lift = lt < tS('pizza') + .9 ? 46 * (1 - seg(lt, tS('pizza') + .3, tS('pizza') + .9)) : 0;
  R.pizza({ at: { X: cx, Z: pzZ }, boxes: 4, lift, tap: lt >= tS('pizza') + .9 ? 1 : 0 });
  if (lt >= tS('pizza') + .15 && lt < tS('pizza') + 1.5) {
    const k = seg(lt, tS('pizza') + .15, tS('pizza') + .8), sc = R.kzP(pzZ) * .9;
    const [sx, sy] = p2(cx - 10, 120 + 60 * k, pzZ);
    ctx.save(); ctx.translate(sx, sy); ctx.scale(sc, sc); ctx.fillStyle = '#f2c44b'; ctx.strokeStyle = 'rgba(25,16,30,.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-52, 0); ctx.quadraticCurveTo(0, -94, 52, 0); ctx.quadraticCurveTo(0, 14, -52, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    if (lt < tS('pizza') + 1.3) V2.smoke(sx, sy - 40, lt, tS('pizza') + .3, { n: 10, rate: 9, life: 1.3, rise: 170, spread: 40, size: 34, color: '235,226,210', alpha: .42, seed: 5 });
  }
  // the table, then the staff across it, clipped at the table's far edge so the table hides their laps
  R.table({ t });
  const yEdge = p2(0, R.LAY.table.top, R.LAY.table.z1)[1];
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, yEdge); ctx.clip();
  for (const id of IDS) {
    if (sh === 'pizza') break;   /* the push-in on the boxes: the staff are out of the frame */
    if (id === 'straw' && standK(lt) > .01) continue;
    if (!shown[id]) continue;
    const o = bodyOf(id, lt);
    if (!focus || focus.includes(id)) drawChar(o);
    else { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, yEdge); ctx.clip(); HP.drawBg(o); ctx.restore(); }   /* whole and sharp (drawBg only leaves him out of the audit, as a background resident) */
  }
  ctx.restore();
  sheetOnTable(lt);
  // Strawberry on her feet (drawn without the clip: she has left the table's edge)
  if (lt >= tS('a4') + .05) drawChar(bodyStraw(lt));
  // the Administrator at the head, standing (a soft neighbour only when the whole of him is in the frame)
  { const ao = bodyAdmin(lt);
    if (!focus || focus.includes('admin')) drawChar(ao);
    else if (sh !== 'pizza' && A12.charWhole(ao, 20)) HP.drawBg(ao); }   /* never soft: whole and sharp, or not drawn (the push-in on the cart is an empty room) */
  // the empty near-side chairs (the camera's side of the table): only in the wides, they would cover the faces in a close-up
  if (WIDE.includes(sh)) for (const X of R.LAY.seats.xs.slice(0, 3)) R.chair(X, R.LAY.seats.near, {});   /* (the fourth stands where the Administrator does: a chair there would cover his name tag) */
}

// ------------------------------------------------------------------ the inserts: the sign-in sheet, large, the writing done live (drawn flat, in place of the world)
// The sheet is a UI.table: printed NAME column, a SEPARATE SIGNATURE column (handwriting never sits on a printed cell), a PER DIEM? column. The handwriting is placed by the table's own cells,
// on the same baseline as the printed name of its row.
const PAPER = { w: 860, h: 980, cx: 540, cy: 800, rowH: 126 };
function insert(lt, who) {
  const { w, h, cx, cy } = PAPER, pop = easeOut(seg(lt, 0, .18));
  ctx.save(); ctx.fillStyle = V2.grad(0, 0, 0, 1920, [[0, '#3d2f42'], [1, '#1a1423']]); ctx.fillRect(-60, -60, W + 120, 1920 + 120); ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.012); ctx.scale(lerp(.96, 1, pop), lerp(.96, 1, pop));
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(-w / 2 + 12, -h / 2 + 16, w, h, 10); ctx.fill();
  UI.panel([-w / 2, -h / 2, w, h], { fill: '#fbf8ef', r: 10, stroke: 'rgba(25,16,30,.55)', lw: 3, id: 'sheet-paper', pad: 24 });
  UI.label('IN-SERVICE SIGN-IN', 0, -h / 2 + 76, { size: 72, font: 'Bangers', fill: '#1f2640', maxW: w - 120, cid: 'sheet-paper' });
  UI.label('Fruit Bowl Rehab & Nursing  ·  3-11 shift  ·  MANDATORY', 0, -h / 2 + 130, { size: 28, fill: '#6b6578', maxW: w - 120, hero: false, cid: 'sheet-paper' });
  // the table: header, five rows. Persimmon's line appears after Lemon says she is not attending; Strawberry's YES is circled on her own insert
  const showPersimmon = lt >= tS('l1') + .8, rows = ['CLEMENTINE', 'MANGO', 'LEMON', 'STRAWBERY', 'PERSIMMON'];
  const choice = r => ({ t: '', draw: (x0, y0, x1, y1, rec) => {
    const yc = (y0 + y1) / 2, xa = x0 + (x1 - x0) * .3, xb = x0 + (x1 - x0) * .73;
    UI.label('YES', xa, yc, { size: 32, fill: '#5b5570', cid: rec.id });
    UI.label('NO', xb, yc, { size: 32, fill: '#5b5570', cid: rec.id });
    if (r === 3 && who === 'straw') {   /* Strawberry's YES, circled in red: the pen goes round it in the first moments of her insert */
      const k = seg(lt, tS('sign2') - .04, tS('sign2') + .16);
      if (k > 0) { ctx.save(); ctx.strokeStyle = '#d6202e'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(xa, yc, 44, 29, -.06, -PI * .5, -PI * .5 + TAU * 1.04 * k); ctx.stroke(); ctx.restore(); }
    }
  } });
  const x0t = -w / 2 + 30, y0t = -h / 2 + 176, rowH = PAPER.rowH;
  const T = UI.table([x0t, y0t, w - 60, rowH * 6], [{ w: 250, weight: 900, fill: '#2b2640' }, { w: 340 }, { w: 210, align: 'center' }],
    rows.map((n, r) => [n, '', choice(r)]),
    { header: ['NAME', 'SIGNATURE', 'PER DIEM?'], size: 32, rowH, id: 'sheet', fill: '#fffdf6', headFill: '#ece6d4', headText: { fill: '#3a3358' }, vgrid: true, grid: 'rgba(60,45,30,.28)', stroke: '#9d957d', lw: 3, r: 8 });
  { const hb = T.rowTop(0); ctx.strokeStyle = '#1f2640'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0t, hb); ctx.lineTo(x0t + w - 60, hb); ctx.stroke(); }   /* the rule under the header */
  // handwriting: written on the baseline of the printed name, inside the signature cell. A wipe reveals it left to right (the text is cropped on purpose while the pen is on it)
  const hand = (cell, str, o, k) => {
    const x = cell.x0 + 18;
    if (k >= 1) return UI.write(str, x, o.base ?? cell.base, Object.assign({ cid: cell.id }, o));
    if (k <= 0) return null;
    const bb = UI.sizeOf(str, o);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 12, cell.y0, (bb.w + 30) * k, cell.y1 - cell.y0); ctx.clip();
    const r = UI.write(str, x, o.base ?? cell.base, Object.assign({}, o, { cid: cell.id, crop: true }));
    ctx.restore();
    return r;
  };
  const clemDone = who === 'clem' ? seg(lt, tS('sign') + .1, tS('sign') + .75) : 1, clemCell = T.cell(0, 1);
  const cl = { size: 44, font: 'Lucky', fill: '#ff7a1a', stroke: '#2b1a0a', lw: 6 };
  const sg = hand(clemCell, 'Clementine', cl, clemDone);
  if (sg && clemDone >= 1) {
    const hk = who === 'clem' ? easeOut(seg(lt, tS('sign') + .8, tS('sign') + 1.0)) : 1;   /* the heart over the i */
    if (hk > 0) {
      const iw = UI.sizeOf('Clementi', cl).w, ww = UI.sizeOf('i', cl).w, hx = sg.x0 + iw - ww * .5 + 1, hy = clemCell.base - UI.metrics('Lucky', 400).cap * cl.size - 14;
      ctx.save(); ctx.translate(hx, hy); ctx.scale(hk, hk); ctx.fillStyle = '#ff3b6b'; ctx.strokeStyle = '#2b1a0a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-20, -2, -12, -20, 0, -8); ctx.bezierCurveTo(12, -20, 20, -2, 0, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
  if (showPersimmon) {   /* Persimmon's line, in red, across her signature cell: two lines, both on the cell's own grid */
    const c = T.cell(4, 1);
    UI.write('NOT ATTENDING', c.x0 + 18, c.y0 + 54, { size: 32, font: 'Lucky', fill: '#d6202e', cid: c.id });
    UI.write('(AGENCY)', c.x0 + 18, c.y0 + 98, { size: 32, font: 'Lucky', fill: '#d6202e', cid: c.id });
  }
  if (who === 'straw') {
    const c = T.cell(3, 1), k = seg(lt, tS('sign2') + .1, tS('sign2') + .62), k2 = seg(lt, tS('sign2') + .62, tS('sign2') + .92);
    hand(c, 'Strawberry', { size: 48, weight: 900, italic: true, fill: '#d62a3a', base: c.y0 + 64 }, k);
    hand(c, '(under protest)', { size: 32, weight: 900, italic: true, fill: '#d62a3a', base: c.y0 + 106 }, k2);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the scene object
const SC = {
  shot: lt => shotOf(lt),
  cam(lt) {
    const sh = shotOf(lt);
    R.cam();
    const face = id => faceC(bodyOf(id, lt));
    const at = (id, z, up) => faceZoom(bodyOf(id, lt), z, up);
    const wideZ = () => zoomTo(WIDE_CX, 1060, WIDE_Z + .02 * sk(lt, 0, 1.6));
    if (sh === 'open' || sh === 'a1') wideZ();
    else if (sh === 'cuC') at('clem', 2.4, 150);
    else if (sh === 'ins1' || sh === 'ins2') zoomTo(540, 960, 1);
    else if (sh === 'two1') { const a = face('clem'), b = face('mango'); zoomTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 60, 1.9); }
    else if (sh === 'cuS1' || sh === 'cuS2' || sh === 'cuS3' || sh === 'cuS4' || sh === 'cuS5') { const z = 2.5 + .08 * sk(lt, shotStart(sh), shotStart(sh) + 1.2); at('straw', z, 150); }
    else if (sh === 'two2') { const a = face('admin'), b = face('straw'); zoomTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 80, 1.9); }
    else if (sh === 'cuL') at('lemon', 2.5, 150);
    else if (sh === 'pizza') { const k = sk(lt, tS('pizza'), tS('pizza') + 1.2), [px, py] = p2(cartX(lt), 150, CART.Z); zoomTo(lerp(WIDE_CX, px, k), lerp(1060, py, k), lerp(WIDE_Z + .02, 2.3, k)); }
    else if (sh === 'wide3') zoomTo(WIDE_CX, 1060, WIDE_Z + .02);
    else if (sh === 'last') { const k = sk(lt, shotStart('last'), shotStart('last') + 1.8); zoomTo(lerp(WIDE_CX, WIDE_CX + 12, k), 1060, WIDE_Z + .02); }
    else zoomTo(WIDE_CX, 1060, WIDE_Z + .02);
  },
  draw(lt) {
    const sh = shotOf(lt);
    if (isIns(sh)) { insert(lt, sh === 'ins1' ? 'clem' : 'straw'); return; }
    world(lt, lt);
  },
  fx: lt => ({ bloom: .34, vignette: .34, grain: .04, contrast: .12, sat: .08, tint: [['#ffe2b0', .08, 'soft-light']] }),
  blur: lt => (isIns(shotOf(lt)) ? 1 : 1),
  over() {},
};

window.__EP12_SCENES = window.__EP12_SCENES || {};
window.__EP12_SCENES.signin = SC;
})();
