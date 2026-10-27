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
 * the Administrator at X 500, Z 880 (beside the table's head); the table X -500..480, Z 760..1000; the pizza cart at X -560, Z 1230 (by the door, rolled in from the left).
 */
(() => {
if (!window.TIMELINE_EP12) return;
const R = window.S12room, H = window.H6;
const { zoomTo, faceZoom, faceC, inB } = H;
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
const ADMIN = [500, 880];
const CART = { Z: R.LAY.pizza.Z };
// Strawberry's walk: she stands up after "I'm an attendee" is over, and steps toward the door; she stops beside the table end
const standK = lt => sk(lt, tS('a4') + .05, tS('a4') + .55);
const walkK = lt => sk(lt, tS('a4') + .4, tS('a4') + 1.4);
// the pizza cart: wheeled in from the back right, stops at X 700
const cartX = lt => { const a = tS('pizza') - .2, b = tS('pizza') + 1.05; return lt < a ? -960 : lerp(-960, R.LAY.pizza.X, easeOut(seg(lt, a, b))); };

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
  return Object.assign({ x: p.x, y: p.y, s: p.s, noLegs: true, lift: 0 }, extra);
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
    return A11.straw({ x: q.x, y: q.y, s: q.s, noLegs: st < .5, lift: 0, expr: 'chill', look: [.4, 0], arms: { l: 'rest', r: 'rest' } });
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

// ------------------------------------------------------------------ the sign-in sheet lying on the table top: a plane transform from the table's (X, Z)
function sheetOnTable(lt) {
  const cX = -20, cZ = 880, Y = R.LAY.table.top + 1, hw = 150, hd = 104;
  const O = p2(cX, Y, cZ), ex = p2(cX + hw, Y, cZ), ey = p2(cX, Y, cZ + hd);
  ctx.save();
  ctx.transform((ex[0] - O[0]) / hw, (ex[1] - O[1]) / hw, (ey[0] - O[0]) / hd, (ey[1] - O[1]) / hd, O[0], O[1]);
  ctx.fillStyle = 'rgba(40,30,20,.22)'; rr(-hw + 6, -hd + 8, 2 * hw, 2 * hd, 3); ctx.fill();
  ctx.fillStyle = '#fbf8ef'; rr(-hw, -hd, 2 * hw, 2 * hd, 3); ctx.fill();
  ctx.fillStyle = '#1f2640'; ctx.font = '900 19px Nunito'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('IN-SERVICE SIGN-IN', -hw + 14, -hd + 20);
  ctx.fillStyle = '#6b6578'; ctx.font = '800 11px Nunito'; ctx.fillText('NAME  ·  SIGNATURE  ·  PER DIEM? (circle one)', -hw + 14, -hd + 40);
  ctx.strokeStyle = '#b9b4a6'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { const y = -hd + 58 + i * 36; ctx.beginPath(); ctx.moveTo(-hw + 10, y); ctx.lineTo(hw - 10, y); ctx.stroke(); }
  const names = ['CLEMENTINE', 'MANGO', 'LEMON', 'STRAWBERY', 'PERSIMMON'];
  ctx.fillStyle = '#3a3550'; ctx.font = '900 13px Nunito';
  names.forEach((n, i) => ctx.fillText(n, -hw + 14, -hd + 70 + i * 36));
  if (lt >= tS('sign') + .4) { ctx.fillStyle = '#ff7a1a'; ctx.font = '900 22px Lucky, Nunito'; ctx.fillText('Clementine', -hw + 96, -hd + 70); }
  if (lt >= tS('l1') + .8) { ctx.fillStyle = '#d6202e'; ctx.font = '900 13px Nunito'; ctx.fillText('NOT ATTENDING (AGENCY)', -hw + 96, -hd + 70 + 4 * 36); }
  if (lt >= tS('sign2') + .95) { ctx.fillStyle = '#d62a3a'; ctx.font = 'italic 900 16px Nunito'; ctx.fillText('Strawberry', -hw + 96, -hd + 70 + 3 * 36); }
  ctx.restore();
}

// ------------------------------------------------------------------ the world: the room, the staff, the Administrator, the pizza cart
// which staff are in focus in each shot (null: everyone, a wide)
const FOCUS = { cuC: ['clem'], two1: ['clem', 'mango'], cuS1: ['straw'], two2: ['straw', 'admin'], cuS2: ['straw'], cuL: ['lemon'], cuS3: ['straw'], cuS4: ['straw'], cuS5: ['straw'], pizza: ['cart'] };
const WIDE = ['open', 'a1', 'wide3', 'last', 'end'];
function world(lt, t) {
  R.cam();
  R.light({});
  R.shell({ flick: t });
  R.back({ min: 58, hr: 2 });
  R.screen({ down: 0 });
  // (the projector cart is for the slides scene: in this wide it would stand in front of Clementine)
  // the far-side chairs, behind the seated staff
  for (const X of R.LAY.seats.xs) R.chair(X, R.LAY.seats.far, {});
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
  // in a close-up the staff who are not the subject are soft neighbours (drawn out of focus, left out of the audit)
  const sh = shotOf(lt), focus = FOCUS[sh];
  for (const id of ['clem', 'mango', 'lemon', 'straw']) {
    if (sh === 'pizza') break;   /* the push-in on the boxes: the staff are out of the frame */
    if (id === 'straw' && standK(lt) > .01) continue;
    const o = bodyOf(id, lt);
    if (focus && !focus.includes(id)) V2.dof(7, () => { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, yEdge); ctx.clip(); H.drawBg(o); ctx.restore(); });
    else drawChar(o);
  }
  ctx.restore();
  sheetOnTable(lt);
  // Strawberry on her feet (drawn without the clip: she has left the table's edge)
  if (lt >= tS('a4') + .05) drawChar(bodyStraw(lt));
  // the Administrator at the head, standing (a soft neighbour in a close-up of someone else)
  { const ao = bodyAdmin(lt); if (focus && !focus.includes('admin')) V2.dof(7, () => { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, W * 2); ctx.clip(); H.drawBg(ao); ctx.restore(); }); else drawChar(ao); }
  // the empty near-side chairs (the camera's side of the table): only in the wides, they would cover the faces in a close-up
  if (WIDE.includes(sh)) for (const X of R.LAY.seats.xs) R.chair(X, R.LAY.seats.near, {});
}

// ------------------------------------------------------------------ the inserts: the sign-in sheet, large, the writing done live (drawn flat, in place of the world)
function insert(lt, who) {
  const cx = 540, cy = 800, w = 760, h = 980, rot = -.012, pop = easeOut(seg(lt, 0, .18));
  ctx.save(); ctx.fillStyle = '#2a2236'; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(lerp(.96, 1, pop), lerp(.96, 1, pop));
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(-w / 2 + 12, -h / 2 + 16, w, h, 10); ctx.fill();
  ctx.fillStyle = '#fbf8ef'; rr(-w / 2, -h / 2, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(25,16,30,.55)'; ctx.lineWidth = 3; rr(-w / 2, -h / 2, w, h, 10); ctx.stroke();
  text('IN-SERVICE SIGN-IN', 0, -h / 2 + 70, { size: 66, font: 'Bangers', weight: 400, fill: '#1f2640', align: 'center' });
  text('Fruit Bowl Rehab & Nursing  ·  3-11 shift  ·  MANDATORY', 0, -h / 2 + 118, { size: 24, font: 'Nunito', weight: 900, fill: '#6b6578', align: 'center' });
  const x1 = -w / 2 + 40, x2 = -w / 2 + 300, x3 = w / 2 - 150;   /* columns: names, signatures (to x3 - 20), per diem */
  text('NAME', x1, -h / 2 + 175, { size: 26, font: 'Nunito', weight: 900, fill: '#5b5570', align: 'left' });
  text('SIGNATURE', x2, -h / 2 + 175, { size: 26, font: 'Nunito', weight: 900, fill: '#5b5570', align: 'left' });
  text('PER DIEM?', x3, -h / 2 + 175, { size: 26, font: 'Nunito', weight: 900, fill: '#5b5570', align: 'left' });
  ctx.strokeStyle = '#1f2640'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2 + 30, -h / 2 + 196); ctx.lineTo(w / 2 - 30, -h / 2 + 196); ctx.stroke();
  const rows = ['CLEMENTINE', 'MANGO', 'LEMON', 'STRAWBERY', 'PERSIMMON'];
  rows.forEach((n, i) => {
    const y = -h / 2 + 262 + i * 128;
    text(n, x1, y, { size: 30, font: 'Nunito', weight: 900, fill: '#2b2640', align: 'left' });
    ctx.strokeStyle = 'rgba(25,16,30,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x2 - 18, y + 36); ctx.lineTo(w / 2 - 36, y + 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y + 36); ctx.lineTo(x2 - 26, y + 36); ctx.stroke();
  });
  // PER DIEM? : the choices, Strawberry's YES circled in red
  text('YES  NO', x3, -h / 2 + 262, { size: 24, font: 'Nunito', weight: 900, fill: '#5b5570', align: 'left' });
  ctx.strokeStyle = '#d6202e'; ctx.lineWidth = 4; ell(x3 + 46, -h / 2 + 262 + 3 * 128 - 6, 40, 28); ctx.stroke();
  // Persimmon's line: NOT ATTENDING (AGENCY), in red across the signature space
  text('NOT ATTENDING (AGENCY)', x2 + 8, -h / 2 + 262 + 4 * 128 - 4, { size: 22, font: 'Lucky', weight: 400, fill: '#d6202e', align: 'left' });
  if (who === 'clem') {
    const k = seg(lt, tS('sign') + .1, tS('sign') + .75);
    ctx.save(); ctx.beginPath(); ctx.rect(x2 - 10, -h / 2 + 262 - 60, (w / 2 - 40 - (x2 - 10)) * k + 1, 120); ctx.clip();
    text('Clementine', x2 + 4, -h / 2 + 262 - 2, { size: 46, font: 'Lucky', weight: 400, fill: '#ff7a1a', stroke: '#2b1a0a', lw: 7, align: 'left' });
    ctx.restore();
    const hk = easeOut(seg(lt, tS('sign') + .8, tS('sign') + 1.0));
    if (hk > 0) { ctx.save(); ctx.translate(x2 + 196, -h / 2 + 262 - 66); ctx.scale(hk, hk); ctx.fillStyle = '#ff3b6b'; ctx.strokeStyle = '#2b1a0a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-24, -2, -14, -24, 0, -10); ctx.bezierCurveTo(14, -24, 24, -2, 0, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  if (who === 'straw') {
    const k = seg(lt, tS('sign2') + .1, tS('sign2') + .62), k2 = seg(lt, tS('sign2') + .62, tS('sign2') + .92);
    const yS = -h / 2 + 262 + 3 * 128;
    ctx.save(); ctx.beginPath(); ctx.rect(x2 - 10, yS - 80, (w / 2 - 40 - (x2 - 10)) * k + 1, 110); ctx.clip();
    text('Strawberry', x2 + 4, yS - 16, { size: 52, font: 'Nunito', weight: 900, italic: true, fill: '#d62a3a', align: 'left' });
    ctx.restore();
    if (k2 > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x2 + 4, yS + 6, (w / 2 - 40 - (x2 + 4)) * k2 + 1, 60); ctx.clip(); text('(under protest)', x2 + 8, yS + 28, { size: 24, font: 'Nunito', weight: 900, italic: true, fill: '#d62a3a', align: 'left' }); ctx.restore(); }
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
    const wideZ = () => zoomTo(580, 1060, 1.17 + .05 * sk(lt, 0, 1.6));
    if (sh === 'open' || sh === 'a1') wideZ();
    else if (sh === 'cuC') at('clem', 2.4, 150);
    else if (sh === 'ins1' || sh === 'ins2') zoomTo(540, 960, 1);
    else if (sh === 'two1') { const a = face('clem'), b = face('mango'); zoomTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 60, 1.9); }
    else if (sh === 'cuS1' || sh === 'cuS2' || sh === 'cuS3' || sh === 'cuS4' || sh === 'cuS5') { const z = 2.5 + .08 * sk(lt, shotStart(sh), shotStart(sh) + 1.2); at('straw', z, 150); }
    else if (sh === 'two2') { const a = face('admin'), b = face('straw'); zoomTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 80, 1.9); }
    else if (sh === 'cuL') at('lemon', 2.5, 150);
    else if (sh === 'pizza') { const k = sk(lt, tS('pizza'), tS('pizza') + 1.2), [px, py] = p2(cartX(lt), 150, CART.Z); zoomTo(lerp(580, px, k), lerp(1060, py, k), lerp(1.2, 2.3, k)); }
    else if (sh === 'wide3') zoomTo(580, 1060, 1.2);
    else if (sh === 'last') { const k = sk(lt, shotStart('last'), shotStart('last') + 1.8); zoomTo(lerp(580, 600, k), 1060, 1.2); }
    else zoomTo(580, 1060, 1.2);
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
