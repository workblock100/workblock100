'use strict';
/* ART STATUS: v1  (final for Episode 14: Mr. Stateman and the Kumquat, props fp14_clip, fp14_pen, fp14_binder, fp14_binocs, fp14_napkin, fp14_frame, accessory fp14_sauce; the API below is complete)
 *
 * SHIFT HAPPENS, Episode 14 art kit, shared by every Episode 14 scene module. Exposed as window.A14. Constructors return the options object for drawChar, like A7 / A10 / A13.
 * Registers through the engine's EXT hooks (kinds star14 and kumquat, accessories and props with the prefix fp14_), so earlier episodes are untouched. Owner: E14-C.
 *
 *   A14.stateman(o)   Mr. Stateman, the State surveyor: the Starfruit of Episode 2 (a five-pointed body, kind 'star14', the same shape as 'star') rebuilt for the v2 renderer.
 *                     Soft, unflappable, observing. A slate-blue windbreaker with a gold-ringed STATE crest, a white-and-slate lanyard with his STATE ID card, a pocket protector,
 *                     reading glasses (half-moon) on a gold chain, a clipboard in the crook of one arm with a pen on a string. who: 'star'. Default s .44, y 1316 (the dollhouse).
 *   A14.kumquat(o)    the trainee: a small kumquat (kind 'kumquat', oval, rx 64 ry 74, a leaf on top), a slate junior vest, a TRAINEE lanyard, a pencil tucked behind the ear, wide
 *                     eyes and a clipboard that is far too big for him. who: 'kum'. Default s = .72 x the adult scale (.317), y 1316.
 *   A14.pear(o), A14.goji(o)   Mr. Pear and Mr. Goji (delegate to A7; the same dressing at the same scale as everybody else).
 * Reuse for the rest of the cast: A7.straw / A11.straw (per diem look), A7.lemon, A7.mango, A10.clem, A9.melon, A7.cran, A7.banana.
 *
 * OPTIONS on top of the usual drawChar ones (x, y = feet, s, who, expr, look, lid, arms, grip, hold, hand, flip, transit, plant, noLegs ... see GUIDE.md):
 *  Stateman
 *   pose        'carry' (default: the clipboard on the left forearm against his belly, the pen in the right hand, tapping now and then) | 'write' (the board up at the chest, the pen on it:
 *               o.writing 0..1 scribbles) | 'read' (the board held up a little, the glasses tipped toward it) | 'rest' (arms down, nothing in the hands) | 'free' (use the arms / grip /
 *               hold you pass: the constructor sets none)
 *   expr        'neutral' (a tiny smile that never changes, hooded calm eyes) | 'stateman_brow' (one eyebrow raised) | 'stateman_noted' (eyes closed, serene) | 'stateman_alarm' (mild alarm, barely)
 *               | 'stateman_warm' (the rare real smile, for the last scene) | any engine expression (the brows follow it)
 *   brow        0..1 raises ONE eyebrow by hand (default: 1 under 'stateman_brow', else 0); browSide -1 / +1 picks the screen side (default +1, the right-hand eyebrow)
 *   noted       0..1 plays the whole "Noted." gesture over that progress: the eyes close once (a slow blink), a single nod (a squash with the shoes planted), a faint smile. Drive it with seg(lt, a, b)
 *   slowBlink   0 turns the idle slow blink off (default on: one slow, heavy blink about every 6 seconds); idle also taps the pen (pose 'carry') and breathes
 *   specs       1 = the reading glasses are on his nose (default), 0 = hanging on the chain on his chest, between = on the way (lift them to read)
 *   jacket      false takes the windbreaker off (the bare starfruit), cap: true puts on the STATE cap of Episode 2
 *   clipPage    0..1 how much of the form on the clipboard is filled (ticks and lines); clipScale scales the board; clipRot, clipAt override the pose
 *   writing     0..1 how hard the pen scribbles (the hand wiggles and the page fills)
 *  Kumquat
 *   pose        'carry' (default: the huge board hugged across his tummy in both hands, its top under his chin) | 'write' (the same board, the pencil on it; writing 0..1 scribbles) | 'side' (the
 *               board held out at his left side in one hand, bigger) | 'rest' (arms down) | 'free' (use the arms / grip / hold you pass)
 *   expr        'kum_eager' (default) | 'kum_puzzled' | 'kum_crushed' | any engine expression
 *   tongue      0..1 sticks the tongue out the corner of the mouth (concentrating); writing 0..1 the pencil scribbles; clipPage, clipScale, clipRot, clipAt as above
 *   pencil      false takes the pencil from behind his ear
 *  Props (use through o.hold, drawn around the hand; registered in PROP_BOX)
 *   fp14_clip   a clipboard with a form (shapes only; ticks, lines, a pen on a string). A14.clip(x, y, o) draws the same board as a set piece.
 *   fp14_pen    a pen (or a pencil with o.pencil) in the fist, the tip at the hand; o.penAng aims it
 *   fp14_binder a huge three-ring binder (tabs on the edge, a label); o.binderLabel, o.binderColor, o.binderRot; A14.drawBinder(cx, cy, w, h, o) draws one anywhere (o.color, o.label, o.sub, o.rot, o.cid, o.noLabel)
 *   fp14_binocs binoculars held to the eyes (o.focus 0..1 pulls the barrels out and sharpens the glint; o.binocK 0..1 slides them from the hand (0) to the eyes (1); o.binocA 0..1 brings them out). Registered nearFace. Needs o.grip.l (the left hand on the left barrel).
 *   fp14_napkin a stained paper napkin in the fist (nearFace); fp14_frame a gilt picture frame held round the face, o.frameA 0..1 raises it (nearFace, hold it in the LEFT hand with grip l at about [-92, 14])
 *  Stateman's lanyard card: o.idLabel 0..1 fades the tiny STATE ID lettering (a scene fades it while somebody passes in front of the card); it is not lettered at all in the 'write' and 'read' poses (the board lies over it)
 *  Accessories (o.acc, any face): fp14_sauce (o.sauce 0..1 dabs of pizza sauce at the mouth, o.sauceSmile 0..1 a wide red smear across the lower face: the Administrator's pizza smile)
 *  The art draws its own tiny dressing text (STATE ID, TRAINEE) only when it would be at least 8 px on the screen, always as set dressing (hero: false). The constructors set no .transit: scenes pass it while a body slides through the frame edge.
 */
(() => {
if (!window.TIMELINE_EP14) return;
const A = window.A14 = {};
const SC = .44, G = 1316;   /* the dollhouse scale of a standing adult, and its floor line */
const sr = (i, s = 0) => hash(i * 3.17 + s * 11.3 + 1.3);
const rgbaOf = (c, a = 1) => V2.rgba(c, a);
const mixc = (a, b, t) => V2.rgba(V2.mix(a, b, t), 1);
const bodyP = (o, k) => PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k));
/* printed dressing on a character (the ID card, the TRAINEE card) is only drawn when it would be at least 8 px on screen: smaller than that it is a speck, and the text gate ignores it anyway */
const bigEnough = size => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) * size >= 8; };

// the State's colours
const SLATE = '#33527a', SLATE_HI = '#4d73a6', SLATE_LO = '#1f3554', PAPER = '#f4f1e6', GOLD = '#d9a93a', GOLD_HI = '#f4d982', BOARD = '#a9794a', STEEL = '#c3cad4';

// ------------------------------------------------------------------ kinds
// Mr. Stateman: the engine's five-pointed star with his own colours. A new kind name so the Episode 2 starfruit (kind 'star') is never touched.
KINDS.star14 = Object.assign({}, KINDS.star, { tex: 'star14', c: ['#f7f2a0', '#dfd53f', '#78861a'], eyeY: -12, eyeX: 26, mouthY: 24, er: 18, mw: 17, leg: 70, hip: 56, shoe: '#2d2c36', shoe2: '#57545f' });
TOPS.star14 = 156;
// the Kumquat: a small egg of an orange, a little wider at the bottom
KINDS.kumquat = { rx: 64, ry: 74, shape: 'kumquat', tex: 'kumquat', c: ['#ffc060', '#ff8f12', '#a84a00'], eyeY: -24, eyeX: 24, mouthY: 8, er: 16, mw: 13, leg: 50, hip: 22, shoe: '#ffffff', shoe2: '#6fb7ee', arm1: 36, arm2: 32 };
TOPS.kumquat = 126;
EXT.shape.kumquat = (p, k) => {
  const { rx, ry } = k;
  p.moveTo(0, -ry);
  p.bezierCurveTo(rx * .56, -ry * 1.0, rx * .99, -ry * .5, rx, ry * .06);
  p.bezierCurveTo(rx * 1.0, ry * .66, rx * .6, ry, 0, ry);
  p.bezierCurveTo(-rx * .6, ry, -rx * 1.0, ry * .66, -rx, ry * .06);
  p.bezierCurveTo(-rx * .99, -ry * .5, -rx * .56, -ry * 1.0, 0, -ry);
};

// ------------------------------------------------------------------ faces (EXPR presets read by v2_char: ang, raise, curve, lid, wide, pup, asym, bags, arch)
EXPR.stateman = { ang: 0, raise: 3, curve: .55, lid: .24, wide: 1, pup: 1 };
EXPR.stateman_brow = { ang: .05, raise: 3, curve: .4, lid: .26, wide: 1, pup: 1, sbrow: 1 };
EXPR.stateman_noted = { ang: -.06, raise: 6, curve: .7, lid: .9, wide: 1, pup: 1 };
EXPR.stateman_alarm = { ang: -.2, raise: 12, curve: .02, lid: 0, wide: 1.1, pup: .8 };
EXPR.stateman_warm = { ang: -.14, raise: 8, curve: 1, lid: .06, wide: 1, pup: 1.08, warm: 1 };
EXPR.kum_eager = { ang: -.3, raise: 12, curve: 1, lid: 0, wide: 1.1, pup: 1.1 };
EXPR.kum_puzzled = { ang: .3, raise: 6, curve: -.18, lid: 0, wide: 1.06, pup: .92, asym: true };
EXPR.kum_crushed = { ang: -.56, raise: 6, curve: -.9, lid: .16, wide: 1.2, pup: 1.14 };

// ------------------------------------------------------------------ Mr. Stateman
const STATE_ACC = ['fp14_stbrow', 'fp14_specs', 'fp14_id', 'fp14_cap'];
function stPose(name, o) {
  const T0 = typeof T === 'number' ? T : 0;
  if (name === 'rest') return { arms: { l: 'rest', r: 'rest' } };
  if (name === 'free') return {};
  const wr = o.writing || 0;
  const scrib = wr ? [Math.sin(T0 * 31) * 5 * wr, Math.cos(T0 * 23) * 2.5 * wr] : [0, 0];
  const tap = !wr && name === 'carry' ? Math.max(0, Math.sin(T0 * 15.7 + 1)) * (((T0 + (o.seed || 141) * .13) % 6.2) < 1.15 ? 1 : 0) * 5 : 0;
  /* the face box reaches down to y 60 (an open mouth), so every board hangs from a hand at y >= 66 */
  if (name === 'write') return { arms: { l: 'hold', r: 'hold' }, grip: { l: [-40, 74], r: [24 + scrib[0], 94 + scrib[1]] }, hold: { l: 'fp14_clip', r: 'fp14_pen' }, clipAt: [.1, .08], clipRot: .0, penAng: -.35 };
  if (name === 'read') return { arms: { l: 'hold', r: 'hold' }, grip: { l: [-46, 70], r: [30, 96] }, hold: { l: 'fp14_clip', r: 'fp14_pen' }, clipAt: [.1, .08], clipRot: .05, penAng: -.4 };
  return { arms: { l: 'hold', r: 'hold' }, grip: { l: [-85, 72], r: [84, 98 - tap] }, hold: { l: 'fp14_clip', r: 'fp14_pen' }, clipAt: [.2, .1], clipRot: -.1, penAng: -1.9 };
}
A.stateman = o => {
  o = o || {};
  const pose = o.pose || 'carry';
  const T0 = typeof T === 'number' ? T : 0, seed = o.seed ?? 141;
  const r = Object.assign({ kind: 'star14', id: 'stateman', who: 'star', s: SC, y: G, acc: STATE_ACC, expr: 'stateman', seed, browColor: 'rgba(0,0,0,0)', specs: 1, jacket: true,
    clipPage: .35, clipScale: 1 }, stPose(pose, Object.assign({ seed }, o)), o);
  // idle: a slow, heavy blink about every six seconds (on top of the engine's quick one)
  if (o.slowBlink !== 0 && o.lid == null) {
    const u = ((T0 + seed * .71) % 6.1) / .62;
    if (u > 0 && u < 1) r.lid = Math.pow(Math.sin(u * PI), .8) * .82;
  }
  // "Noted.": the eyes close once, a single nod, a faint smile
  const n = o.noted || 0;
  if (n > 0 && n < 1) {
    const close = Math.pow(Math.sin(PI * seg(n, 0, .82)), .6), nod = Math.sin(PI * seg(n, .12, .78));
    r.lid = Math.max(r.lid || 0, close * .96);
    r.squash = (r.squash || 0) + .075 * nod; r.plant = true;
  }
  r.brow = o.brow ?? ((EXPR[r.expr] || {}).sbrow ? 1 : 0);
  return r;
};

// the starfruit's skin and, over it, the jacket (painted in the texture hook so the room's light falls on it like on the body)
EXT.tex.star14 = (o, k, t) => {
  const { rx, ry } = k, P = bodyP(o, k);
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // the darker green of the thin rib edges, running just inside the outline
  ctx.strokeStyle = 'rgba(98,114,20,.46)'; ctx.lineWidth = 24; ctx.stroke(P);
  ctx.strokeStyle = 'rgba(255,255,214,.2)'; ctx.lineWidth = 9; ctx.save(); ctx.translate(-3, -4); ctx.stroke(P); ctx.restore();
  // ridges down the middle of each point and the grooves in the valleys between them
  for (let i = 0; i < 5; i++) {
    const a = -PI / 2 + i * TAU / 5, ca = Math.cos(a), sa = Math.sin(a);
    ctx.strokeStyle = 'rgba(255,255,226,.5)'; ctx.lineWidth = 5.5;
    ctx.beginPath(); ctx.moveTo(ca * rx * .5, sa * ry * .5); ctx.lineTo(ca * rx * .93, sa * ry * .93); ctx.stroke();
    const b = a + PI / 5, cb = Math.cos(b), sb = Math.sin(b);
    ctx.strokeStyle = 'rgba(108,124,24,.4)'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(cb * rx * .3, sb * ry * .3); ctx.lineTo(cb * rx * .62, sb * ry * .62); ctx.stroke();
  }
  // freckles of a ripe starfruit
  for (let i = 0; i < 46; i++) {
    const x = (sr(i, 3) * 2 - 1) * rx * .9, y = (sr(i, 4) * 2 - 1) * ry * .9;
    ctx.fillStyle = i % 3 ? 'rgba(118,104,20,.2)' : 'rgba(255,252,210,.3)';
    ell(x, y, 1.8 + sr(i, 5) * 2.2, 1.6 + sr(i, 6) * 1.6, sr(i, 7) * 3); ctx.fill();
  }
  ctx.restore();
  if (o.jacket !== false) windbreaker(o, k);
};

function windbreaker(o, k) {
  const y0 = 40;   /* the collar line, just under his chin */
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // the jacket: slate, lighter across the chest, darker at the hem
  ctx.fillStyle = V2.grad(0, y0 - 6, 0, 136, [[0, SLATE_HI], [.42, SLATE], [1, SLATE_LO]]);
  ctx.beginPath(); ctx.moveTo(-210, y0 + 14); ctx.quadraticCurveTo(-120, y0 - 8, -56, y0 - 8); ctx.lineTo(0, y0 + 46); ctx.lineTo(56, y0 - 8); ctx.quadraticCurveTo(120, y0 - 8, 210, y0 + 14); ctx.lineTo(210, 220); ctx.lineTo(-210, 220); ctx.closePath(); ctx.fill();
  // the white tee in the V of the collar
  ctx.fillStyle = '#e9edf4'; ctx.beginPath(); ctx.moveTo(-52, y0 - 10); ctx.lineTo(52, y0 - 10); ctx.lineTo(0, y0 + 42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(40,60,100,.18)'; ctx.beginPath(); ctx.moveTo(-52, y0 - 10); ctx.lineTo(52, y0 - 10); ctx.lineTo(52, y0 - 2); ctx.lineTo(-52, y0 - 2); ctx.closePath(); ctx.fill();
  // the collar: two darker flaps with white piping
  for (const s of [-1, 1]) {
    ctx.fillStyle = SLATE_LO; ctx.beginPath(); ctx.moveTo(s * 60, y0 - 12); ctx.lineTo(s * 14, y0 + 8); ctx.lineTo(0, y0 + 48); ctx.lineTo(s * 8, y0 + 40); ctx.lineTo(s * 40, y0 + 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f2f5fa'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(s * 60, y0 - 12); ctx.lineTo(s * 8, y0 + 44); ctx.stroke();
  }
  // zip down the front and the pull at the throat
  ctx.strokeStyle = '#c8d3e2'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(0, y0 + 48); ctx.lineTo(0, 140); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,34,56,.55)'; ctx.lineWidth = 1.6; ctx.setLineDash([2.5, 3.5]); ctx.beginPath(); ctx.moveTo(0, y0 + 48); ctx.lineTo(0, 140); ctx.stroke(); ctx.setLineDash([]);
  // a white colour-block stripe across the chest, and the hem band
  ctx.fillStyle = 'rgba(244,247,252,.9)'; ctx.fillRect(-210, 100, 420, 5);
  ctx.fillStyle = 'rgba(244,247,252,.9)'; ctx.fillRect(-210, 109, 420, 2);
  // slanted welt pockets
  ctx.strokeStyle = 'rgba(16,28,48,.6)'; ctx.lineWidth = 2.6;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 70, 118); ctx.lineTo(s * 46, 138); ctx.stroke(); }
  // a soft fold across the middle, so the nylon is not flat
  ctx.strokeStyle = 'rgba(160,190,230,.25)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-60, 86); ctx.quadraticCurveTo(-24, 94, -8, 118); ctx.stroke(); ctx.beginPath(); ctx.moveTo(60, 88); ctx.quadraticCurveTo(26, 98, 10, 122); ctx.stroke();
  // the crest on the wearer's left chest (screen right): a gold ring, a slate disc, a white five-pointed star, a tiny check inside it. An original mark.
  const cx = 38, cy = 66;
  ctx.fillStyle = GOLD; ell(cx, cy, 20, 20); ctx.fill();
  ctx.fillStyle = SLATE_LO; ell(cx, cy, 16, 16); ctx.fill();
  ctx.fillStyle = '#f6f8fc'; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? 5.4 : 12.5; ctx.lineTo(cx + Math.cos(a) * R, cy + 1 + Math.sin(a) * R); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = GOLD_HI; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, 18.4, PI * 1.05, PI * 1.55); ctx.stroke();
  // the pocket protector on the wearer's right chest (screen left): a white shell with three pens
  const px = -44, py = 62;
  ctx.fillStyle = '#2b4b74'; rr(px - 17, py - 6, 34, 42, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(14,26,44,.6)'; ctx.lineWidth = 2; rr(px - 17, py - 6, 34, 42, 4); ctx.stroke();
  for (const [dx, col, up] of [[-8, '#2a6fdb', 15], [0, '#d62f2f', 19], [8, '#1d1a22', 13]]) {
    ctx.fillStyle = col; rr(px + dx - 2.6, py - 6 - up, 5.2, up + 8, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(px + dx - 1, py - 6 - up + 2, 1.4, up - 2);
  }
  ctx.fillStyle = '#f1f4f8'; rr(px - 19, py + 2, 38, 28, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(90,110,140,.7)'; ctx.lineWidth = 1.8; rr(px - 19, py + 2, 38, 28, 4); ctx.stroke();
  ctx.fillStyle = 'rgba(120,140,170,.28)'; ctx.fillRect(px - 16, py + 6, 32, 3);
  ctx.restore();
}

// the brows (the face's own are made invisible by browColor; these are drawn on top, so ONE can be raised), plus the warm smile's lines
EXT.acc.fp14_stbrow = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), er = k.er * E.wide * (o.eyeScale || 1);
  const raiseOne = clamp(o.brow ?? 0), side1 = o.browSide || 1;
  const col = '#2f2a14', W0 = o.browW || 9.5;
  for (const side of [-1, 1]) {
    const x = side * k.eyeX, y = k.eyeY;
    let ang = E.asym ? (side < 0 ? E.ang : -.3) : E.ang, lift = 0;
    if (side === side1) { lift = 18 * raiseOne; ang += (side < 0 ? -1 : 1) * -.22 * raiseOne; }
    else ang += (side < 0 ? 1 : -1) * .1 * raiseOne;
    const by = y - er * 1.42 - E.raise - (o.browUp || 0) - lift + (side === -side1 ? 3 * raiseOne : 0);
    ctx.save(); ctx.translate(x, by); ctx.rotate(side < 0 ? ang : -ang);
    const bw = er * .98, thI = W0 * 1.1, thO = W0 * .66, arch = (E.arch ?? (E.curve > .5 ? 4 : -1)) + (side === side1 ? 6 * raiseOne : 0);
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(-side * bw, -thI / 2); ctx.quadraticCurveTo(0, -arch - thI / 2, side * bw, -thO / 2); ctx.lineTo(side * bw, thO / 2); ctx.quadraticCurveTo(0, -arch + thI / 2, -side * bw, thI / 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(-side * bw, 0, thI / 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(side * bw, 0, thO / 2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  if (E.warm) {   /* the rare real smile: laugh lines at the corners of the mouth and the eyes */
    ctx.strokeStyle = 'rgba(70,64,10,.5)'; ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.arc(s * (k.mw + 3), k.mouthY - 2, 10, s < 0 ? PI * .55 : -PI * .05, s < 0 ? PI * 1.05 : PI * .45); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * (k.eyeX + er * 1.15 + 4), k.eyeY + 4); ctx.lineTo(s * (k.eyeX + er * 1.15 + 14), k.eyeY + 8); ctx.moveTo(s * (k.eyeX + er * 1.15 + 4), k.eyeY + 12); ctx.lineTo(s * (k.eyeX + er * 1.15 + 13), k.eyeY + 19); ctx.stroke();
    }
  }
};

// reading glasses on a gold chain. specs 1 = low on the nose, 0 = hanging against his chest on the chain
EXT.acc.fp14_specs = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const u = clamp(o.specs ?? 1), E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), er = k.er * E.wide * (o.eyeScale || 1);
  const w = er * 1.28, h = er * 1.22, ex = k.eyeX;
  const yTop = lerp(70, k.eyeY + er * .22, easeIO(u)), sc = lerp(.86, 1, u), sway = (1 - u) * Math.sin(t * 1.7 + (o.seed || 0)) * 2;
  const frame = '#2c2a33';
  // the chain: from the end of each temple, out and down over the shoulders (the arms are drawn over its far end)
  const tx = ex + w * sc + 5;
  ctx.save(); ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3.4; ctx.setLineDash([3.4, 2.2]);
    ctx.beginPath(); ctx.moveTo(s * tx, yTop + 4); ctx.bezierCurveTo(s * (tx + 34), yTop + 6, s * 104, lerp(yTop + 6, -4, u) + 6, s * 92, lerp(40, 22, u)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,240,170,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s * tx, yTop + 3); ctx.bezierCurveTo(s * (tx + 34), yTop + 5, s * 104, lerp(yTop + 5, -5, u) + 5, s * 92, lerp(39, 21, u)); ctx.stroke();
  }
  ctx.translate(sway, 0);
  ctx.strokeStyle = frame; ctx.lineWidth = 3.2; ctx.lineJoin = 'round';
  // the temples reach back from the top outer corners
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * (ex + w * sc), yTop + 2); ctx.lineTo(s * tx, yTop + 3); ctx.stroke(); }
  // half-moon lenses: flat on top, round below
  for (const s of [-1, 1]) {
    const cx = s * ex, lw = w * sc, lh = h * sc;
    ctx.beginPath(); ctx.moveTo(cx - lw, yTop); ctx.lineTo(cx + lw, yTop); ctx.bezierCurveTo(cx + lw * 1.02, yTop + lh * 1.28, cx - lw * 1.02, yTop + lh * 1.28, cx - lw, yTop); ctx.closePath();
    ctx.fillStyle = 'rgba(196,222,255,.2)'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(cx - lw * .5, yTop + lh * .82); ctx.lineTo(cx - lw * .05, yTop + lh * .16); ctx.stroke(); ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(-ex + w * sc, yTop + 1); ctx.quadraticCurveTo(0, yTop - 7 * sc, ex - w * sc, yTop + 1); ctx.stroke();
  ctx.restore();
};

// the STATE ID card on its lanyard, and the STATE cap of Episode 2 when o.cap is set
EXT.acc.fp14_id = (o, k, t, layer) => {
  if (layer !== 'front' || o.jacket === false) return;
  const sw = Math.sin(t * 1.9 + (o.seed || 0)) * .025;
  ctx.save();
  // the strap: white with a slate stripe, from behind the collar down to the card clip
  for (const s of [-1, 1]) {
    ctx.strokeStyle = '#f4f6fa'; ctx.lineWidth = 6.4; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(s * 30, 38); ctx.quadraticCurveTo(s * 20, 64, 0, 80); ctx.stroke();
    ctx.strokeStyle = SLATE; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(s * 30, 38); ctx.quadraticCurveTo(s * 20, 64, 0, 80); ctx.stroke();
  }
  ctx.translate(0, 78); ctx.rotate(sw);
  ctx.fillStyle = '#9aa4b3'; rr(-5, -2, 10, 9, 2); ctx.fill();
  ctx.translate(0, 7);
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#fafbfd'; ctx.strokeStyle = 'rgba(25,40,70,.85)'; ctx.lineWidth = 2.4; rr(-21, 0, 42, 54, 4); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = SLATE; rr(-21, 0, 42, 14, 4); ctx.fill(); ctx.fillRect(-21, 8, 42, 6);
  // the photo: a pale star
  ctx.fillStyle = '#e6e8a0'; ctx.strokeStyle = 'rgba(30,40,20,.7)'; ctx.lineWidth = 1.4; rr(-14, 18, 20, 22, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5d6b14'; ell(-6, 25, 2, 2.4); ctx.fill(); ell(-1, 25, 2, 2.4); ctx.fill();
  ctx.fillStyle = 'rgba(40,60,100,.55)'; ctx.fillRect(9, 20, 9, 2.6); ctx.fillRect(9, 26, 9, 2.6); ctx.fillRect(9, 32, 6, 2.6); ctx.fillRect(-14, 45, 28, 2.6);
  if (!o.flip && bigEnough(9.5) && o.pose !== 'write' && o.pose !== 'read' && (o.idLabel ?? 1) > .02) { ctx.save(); ctx.globalAlpha *= clamp(o.idLabel ?? 1); UI.label('STATE ID', 0, 7, { size: 9.5, fill: '#fff', hero: false, spacing: .6, maxW: 36, transit: o.transit, crop: !!o.transit }); ctx.restore(); }
  ctx.restore();
  if (o.cap) {   /* the STATE cap of Episode 2: a slate crown with a short brim and a gold star */
    const cy = -k.ry * .82;
    ctx.save(); ctx.fillStyle = SLATE_LO; ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.ellipse(0, cy, 44, 28, 0, PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
    rr(-30, cy - 4, 82, 11, 5.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? 4.4 : 10; ctx.lineTo(Math.cos(a) * R, cy - 14 + Math.sin(a) * R); } ctx.closePath(); ctx.fill();
    ctx.restore();
  }
};
EXT.acc.fp14_cap = () => {};   /* reserved (the cap is drawn by fp14_id) */

// ------------------------------------------------------------------ the Kumquat
EXT.tex.kumquat = (o, k, t) => {
  const { rx, ry } = k;
  ctx.save();
  ctx.fillStyle = V2.grad(0, -ry, 0, -ry * .1, [[0, 'rgba(255,238,160,.36)'], [1, 'rgba(255,238,160,0)']]); ctx.fillRect(-rx * 1.2, -ry * 1.1, rx * 2.4, ry);
  ctx.fillStyle = V2.grad(0, ry * .3, 0, ry, [[0, 'rgba(170,60,0,0)'], [1, 'rgba(170,60,0,.3)']]); ctx.fillRect(-rx * 1.2, ry * .3, rx * 2.4, ry * .8);
  for (let i = 0; i < 90; i++) {
    const x = (sr(i, 31) * 2 - 1) * rx * .96, y = (sr(i, 32) * 2 - 1) * ry * .96;
    if (Math.hypot(x / (rx * .74), (y - k.eyeY - 14) / (ry * .56)) < 1) continue;
    ctx.fillStyle = i % 4 ? 'rgba(150,56,0,.24)' : 'rgba(255,238,180,.36)'; ell(x, y, 1.2 + sr(i, 33) * 1.2, 1 + sr(i, 34) * 1, sr(i, 35) * 3); ctx.fill();
  }
  ctx.restore();
  if (o.vest !== false) kumquatVest(o, k);
};
function kumquatVest(o, k) {
  const y0 = 38;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = V2.grad(0, y0, 0, 80, [[0, SLATE_HI], [.5, SLATE], [1, SLATE_LO]]);
  ctx.beginPath(); ctx.moveTo(-90, y0 + 8); ctx.quadraticCurveTo(-52, y0 - 4, -26, y0 - 4); ctx.lineTo(0, y0 + 24); ctx.lineTo(26, y0 - 4); ctx.quadraticCurveTo(52, y0 - 4, 90, y0 + 8); ctx.lineTo(90, 120); ctx.lineTo(-90, 120); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e9edf4'; ctx.beginPath(); ctx.moveTo(-24, y0 - 6); ctx.lineTo(24, y0 - 6); ctx.lineTo(0, y0 + 22); ctx.closePath(); ctx.fill();
  for (const s of [-1, 1]) { ctx.strokeStyle = '#f2f5fa'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(s * 28, y0 - 6); ctx.lineTo(s * 4, y0 + 22); ctx.stroke(); }
  ctx.strokeStyle = '#c8d3e2'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, y0 + 24); ctx.lineTo(0, 96); ctx.stroke();
  ctx.fillStyle = 'rgba(244,247,252,.9)'; ctx.fillRect(-90, 66, 180, 3);
  ctx.restore();
}
EXT.top.kumquat = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const y = -k.ry + 3;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // calyx: five tiny sepals lying flat on the crown
  ctx.fillStyle = '#4f9b3a'; ctx.strokeStyle = 'rgba(14,50,14,.9)'; ctx.lineWidth = 2.4;
  for (const a of [-1.15, -.58, 0, .58, 1.15]) { ctx.save(); ctx.translate(0, y + 2); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-3.4, 0); ctx.quadraticCurveTo(0, -13, 3.4, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1, y - 15); ctx.stroke();
  // the leaf
  ctx.save(); ctx.translate(2, y - 12); ctx.rotate(.78);
  ctx.fillStyle = V2.grad(0, 0, 0, -50, [[0, '#2f8f2f'], [1, '#7ad65a']]); ctx.strokeStyle = 'rgba(14,50,14,.95)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(21, -22, 2, -52); ctx.quadraticCurveTo(-17, -24, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,255,170,.6)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0, -3); ctx.quadraticCurveTo(3, -25, 2, -48); ctx.stroke();
  ctx.restore(); ctx.restore();
};

function kqPose(name, o) {
  const T0 = typeof T === 'number' ? T : 0, wr = o.writing || 0;
  const scrib = wr ? [Math.sin(T0 * 33) * 4 * wr, Math.cos(T0 * 27) * 2.2 * wr] : [0, 0];
  if (name === 'rest') return { arms: { l: 'rest', r: 'rest' } };
  if (name === 'free') return {};
  /* the face box ends at y 36, so the board (far too big for him) hangs from a hand at y >= 46: it stands on the floor against his tummy, its top under his chin */
  if (name === 'write') return { arms: { l: 'hold', r: 'hold' }, grip: { l: [-36, 48], r: [24 + scrib[0], 70 + scrib[1]] }, hold: { l: 'fp14_clip', r: 'fp14_pen' }, clipAt: [.1, .08], clipRot: -.03, clipScale: 1.2, penAng: -.5, pencil: true, penLen: .7 };
  if (name === 'side') return { arms: { l: 'hold', r: 'rest' }, grip: { l: [-100, 34] }, hold: { l: 'fp14_clip' }, clipAt: [.5, .2], clipRot: .05, clipScale: 1.5 };
  return { arms: { l: 'hold', r: 'hold' }, grip: { l: [-38, 48], r: [38, 52] }, hold: { l: 'fp14_clip' }, clipAt: [.12, .08], clipRot: 0, clipScale: 1.2 };
}
A.kumquat = o => {
  o = o || {};
  const pose = o.pose || 'carry', seed = o.seed ?? 142;
  const r = Object.assign({ kind: 'kumquat', id: 'kumquat', who: 'kum', s: SC * .72, y: G, acc: ['fp14_kqface', 'fp14_kqid'], expr: 'kum_eager', seed, clipPage: .1, clipScale: 1.2 }, kqPose(pose, o), o);
  if (r.expr === 'kum_crushed' && r.sparkle == null) r.sparkle = true;
  return r;
};
EXT.acc.fp14_kqface = (o, k, t, layer) => {
  if (layer === 'back') return;
  const tg = clamp(o.tongue || 0);
  if (layer === 'front') {
    if (tg > .02) {   /* the tongue out of the corner of the mouth, concentrating */
      ctx.save(); ctx.translate(k.mw * .55, k.mouthY + 2);
      ctx.fillStyle = '#ff6f86'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-8, 14 * tg + 2, 3, 15 * tg + 3); ctx.quadraticCurveTo(14, 14 * tg + 2, 11, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(160,30,60,.6)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(3, 2); ctx.lineTo(3, 9 * tg + 2); ctx.stroke();
      ctx.restore();
    }
    if (o.pencil !== false) {   /* the pencil behind the "ear": tucked into the side of the head, tilted, the lead end down */
      ctx.save(); ctx.translate(-k.rx * .86, -k.ry * .2); ctx.rotate(-.5);
      ctx.fillStyle = '#f2c230'; ctx.strokeStyle = INK; ctx.lineWidth = 2.8; rr(-4.5, -30, 9, 42, 2.6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8a0a0'; rr(-4.5, -34, 9, 8, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#b9bfc8'; ctx.fillRect(-4.5, -27, 9, 3.4);
      ctx.fillStyle = '#e9c590'; ctx.beginPath(); ctx.moveTo(-4.5, 12); ctx.lineTo(0, 22); ctx.lineTo(4.5, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a3340'; ctx.beginPath(); ctx.moveTo(-1.8, 19); ctx.lineTo(0, 22); ctx.lineTo(1.8, 19); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
};
EXT.acc.fp14_kqid = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const sw = Math.sin(t * 2.1 + (o.seed || 0)) * .03;
  ctx.save();
  for (const s of [-1, 1]) { ctx.strokeStyle = '#f4f6fa'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(s * 20, 34); ctx.quadraticCurveTo(s * 14, 50, 0, 58); ctx.stroke(); ctx.strokeStyle = SLATE; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(s * 20, 34); ctx.quadraticCurveTo(s * 14, 50, 0, 58); ctx.stroke(); }
  ctx.translate(0, 56); ctx.rotate(sw);
  ctx.fillStyle = '#9aa4b3'; rr(-4, -2, 8, 7, 2); ctx.fill();
  ctx.translate(0, 5);
  ctx.fillStyle = '#fafbfd'; ctx.strokeStyle = 'rgba(25,40,70,.85)'; ctx.lineWidth = 2.2; rr(-18, 0, 36, 32, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8641a'; rr(-18, 0, 36, 11, 4); ctx.fill(); ctx.fillRect(-18, 6, 36, 5);
  if (!o.flip && bigEnough(8.4)) UI.label('TRAINEE', 0, 5.6, { size: 8.4, fill: '#fff', hero: false, spacing: .5, maxW: 32, transit: o.transit, crop: !!o.transit });
  ctx.fillStyle = 'rgba(40,60,100,.5)'; ctx.fillRect(-13, 16, 26, 2.4); ctx.fillRect(-13, 22, 18, 2.4);
  ctx.restore();
};

// ------------------------------------------------------------------ props
// a clipboard: a hardboard back, a sheet with a form (shapes only), the steel clip, a pen on a string. Drawn around the hand: o.clipAt = where on the board the hand is (0..1, 0..1), o.clipRot, o.clipScale
function clipboard(w, h, o, t, opt = {}) {
  const page = clamp(o.clipPage ?? .35);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = V2.grad(0, 0, w, h, [[0, '#bf8c57'], [1, '#93673a']]); rr(0, 0, w, h, w * .07); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(30,16,8,.85)'; ctx.lineWidth = 3.2; rr(0, 0, w, h, w * .07); ctx.stroke();
  // the sheet
  const m = w * .08, sx = m, sy = h * .09, sw = w - m * 2, sh = h - sy - m * .8;
  ctx.fillStyle = PAPER; ctx.strokeStyle = 'rgba(60,50,30,.5)'; ctx.lineWidth = 1.8; ctx.fillRect(sx, sy, sw, sh); ctx.strokeRect(sx, sy, sw, sh);
  // the form: a slate header bar, a title scribble, rows of tick box + line
  ctx.fillStyle = SLATE; ctx.fillRect(sx, sy, sw, sh * .1);
  ctx.fillStyle = 'rgba(244,247,252,.85)'; ctx.fillRect(sx + sw * .08, sy + sh * .035, sw * .5, sh * .03);
  ctx.fillStyle = GOLD; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? sw * .03 : sw * .07; ctx.lineTo(sx + sw * .86 + Math.cos(a) * R, sy + sh * .05 + Math.sin(a) * R); } ctx.closePath(); ctx.fill();
  const rows = 7, r0 = sy + sh * .17, pitch = (sh * .8) / rows, bs = Math.min(pitch * .5, sw * .1);
  for (let i = 0; i < rows; i++) {
    const y = r0 + i * pitch, filled = i < Math.round(page * rows);
    ctx.strokeStyle = 'rgba(60,70,90,.8)'; ctx.lineWidth = 1.6; ctx.strokeRect(sx + sw * .08, y, bs, bs);
    ctx.fillStyle = 'rgba(70,80,100,.35)'; ctx.fillRect(sx + sw * .08 + bs + sw * .08, y + bs * .5 - 1, sw * (.5 - (i % 3) * .07), 2.2);
    ctx.fillRect(sx + sw * .08 + bs + sw * .08, y + bs * .5 + pitch * .3, sw * (.3 + (i % 2) * .1), 1.6);
    if (filled) {
      ctx.strokeStyle = i % 4 === 2 ? '#c23a2b' : '#1f6f3a'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(sx + sw * .08 + bs * .15, y + bs * .55); ctx.lineTo(sx + sw * .08 + bs * .42, y + bs * .9); ctx.lineTo(sx + sw * .08 + bs * 1.15, y - bs * .2); ctx.stroke();
      ctx.strokeStyle = '#27324f'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(sx + sw * .08 + bs + sw * .1, y + bs * .5 + 1); for (let j = 1; j <= 5; j++) ctx.lineTo(sx + sw * .08 + bs + sw * .1 + j * sw * .06, y + bs * .5 + (j % 2 ? -2.4 : 2.4)); ctx.stroke();
    }
  }
  // the steel clip
  ctx.fillStyle = V2.grad(0, -h * .04, 0, h * .1, [[0, '#e8edf4'], [1, '#98a2b0']]); ctx.strokeStyle = 'rgba(30,36,50,.9)'; ctx.lineWidth = 2.6;
  rr(w * .26, -h * .045, w * .48, h * .1, w * .04); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6c7584'; ell(w * .5, h * .005, w * .04, w * .04); ctx.fill();
  ctx.restore();
  // the pen's string: from the clip, a loop, to wherever the pen is (opt.pen = [x, y] in the board's frame) or hanging free
  ctx.save(); ctx.strokeStyle = '#4a5468'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  const sx0 = w * .74, sy0 = h * .01, ex = opt.pen ? opt.pen[0] : w * .98, ey = opt.pen ? opt.pen[1] : h * .46;
  ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.bezierCurveTo(w * 1.02, h * .06, ex + w * .1, Math.min(ey, h * .9) - h * .04 + h * .12, ex, ey); ctx.stroke();
  if (!opt.pen) { ctx.save(); ctx.translate(ex, ey); ctx.rotate(.1); ctx.fillStyle = SLATE; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(-3, 0, 6, h * .22, 2.4); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
EXT.prop.fp14_clip = (side, o, t) => {
  const S = o.clipScale || 1, w = 66 * S, h = 86 * S, at = o.clipAt || [.5, .5];
  ctx.save(); ctx.rotate(o.clipRot || 0); ctx.translate(-w * at[0], -h * at[1]);
  // the pen: when the other hand holds one, the string runs to it
  let pen = null;
  if (o.hold && o.hold.r === 'fp14_pen' && o.grip && o.grip.r && o.grip.l) {
    const dx = o.grip.r[0] - o.grip.l[0], dy = o.grip.r[1] - o.grip.l[1];
    const c = Math.cos(-(o.clipRot || 0)), s = Math.sin(-(o.clipRot || 0));
    pen = [w * at[0] + dx * c - dy * s, h * at[1] + dx * s + dy * c];
  }
  clipboard(w, h, o, t, { pen });
  ctx.restore();
};
PROP_BOX.fp14_clip = o => { const S = o.clipScale || 1, w = 66 * S, h = 86 * S, at = o.clipAt || [.5, .5], r = Math.max(w, h) * .55; return [-w * at[0] - 2, -h * at[1] - 2, w * (1 - at[0]) + 2, h * (1 - at[1]) + 2]; };
A.clip = (x, y, o = {}) => { const S = o.clipScale || 1, w = 66 * S, h = 86 * S; ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.translate(-w / 2, -h / 2); clipboard(w, h, o, T, {}); ctx.restore(); };

EXT.prop.fp14_pen = (side, o, t) => {
  const ang = o.penAng ?? -1.2, pencil = !!(o.pencil || o.kind === 'kumquat');
  ctx.save(); ctx.rotate(ang + PI / 2); ctx.scale(1, o.penLen || 1);   /* the tip points down-left at the board; the barrel runs up to the right */
  ctx.lineJoin = 'round';
  // tip at the origin, barrel toward -y in this frame
  if (pencil) {
    ctx.fillStyle = '#e9c590'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4.4, -12); ctx.lineTo(4.4, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3340'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-1.8, -5); ctx.lineTo(1.8, -5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f2c230'; ctx.strokeStyle = INK; rr(-4.4, -52, 8.8, 40, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b9bfc8'; ctx.fillRect(-4.4, -55, 8.8, 3.6); ctx.fillStyle = '#e8a0a0'; rr(-4.4, -62, 8.8, 8, 2.4); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = '#c3cad4'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3.6, -9); ctx.lineTo(3.6, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SLATE; rr(-4.6, -50, 9.2, 42, 3.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-2.6, -48, 2, 36);
    ctx.fillStyle = '#e9edf4'; rr(-4.6, -64, 9.2, 15, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = STEEL; ctx.fillRect(3.4, -62, 2.2, 22);
  }
  ctx.restore();
};
PROP_BOX.fp14_pen = o => { const a = o.penAng ?? -1.2, L = 62 * (o.penLen || 1), ex = Math.cos(a) * L, ey = Math.sin(a) * L; return [Math.min(0, ex) - 4, Math.min(0, ey) - 4, Math.max(0, ex) + 4, Math.max(0, ey) + 4]; };

// a three-ring binder, front view: a cover in vinyl, a spine at the left with the rings, a label window, index tabs on the right edge. UI.label draws the label (set dressing: hero false)
A.drawBinder = (cx, cy, w, h, o = {}) => {
  const col = o.color || '#27456f', label = o.label ?? 'SURVEY READY', hi = mixc(col, '#ffffff', .22), lo = mixc(col, '#000000', .4);
  ctx.save(); ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const x0 = -w / 2, y0 = -h / 2;
  // the pages show at the right and the bottom edge
  ctx.fillStyle = '#e9e5d6'; rr(x0 + w * .05, y0 + h * .03, w * .98, h * .96, 5); ctx.fill(); ctx.strokeStyle = 'rgba(40,36,24,.7)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(80,70,50,.35)'; ctx.lineWidth = 1.2; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x0 + w * (1.03 - .004 * i), y0 + h * .06); ctx.lineTo(x0 + w * (1.03 - .004 * i), y0 + h * .96); ctx.stroke(); }
  // the index tabs on the right edge, staggered
  const tabs = ['#d62f2f', '#e8a020', '#2f9a4a', '#2a6fdb', '#8a46c8'];
  tabs.forEach((c, i) => { const ty = y0 + h * (.12 + i * .16); ctx.fillStyle = c; ctx.strokeStyle = 'rgba(20,16,30,.8)'; ctx.lineWidth = 1.8; rr(x0 + w * 1.0, ty, w * .1, h * .1, 3); ctx.fill(); ctx.stroke(); });
  // the cover
  ctx.fillStyle = V2.grad(x0, y0, x0 + w, y0 + h, [[0, hi], [.5, col], [1, lo]]); rr(x0, y0, w, h, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(14,12,22,.9)'; ctx.lineWidth = 3; rr(x0, y0, w, h, 6); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x0 + w * .13, y0 + 3, 3, h - 6);   /* the hinge groove */
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x0 + w * .13 + 3, y0 + 3, 2, h - 6);
  // the label window
  const lw = w * .66, lh = h * .26, lx = x0 + w * .2, ly = y0 + h * .3;
  ctx.fillStyle = '#f6f3e4'; ctx.strokeStyle = 'rgba(14,12,22,.85)'; ctx.lineWidth = 2.4; rr(lx, ly, lw, lh, 4); ctx.fill(); ctx.stroke();
  UI.container(o.cid || 'fp14binder', 'label', [lx, ly, lx + lw, ly + lh], 3);
  if (label && !o.noLabel) UI.label(label, lx + lw / 2, ly + lh / 2, { size: Math.max(12, h * .12), fill: '#1b2540', hero: false, maxW: lw - 12, cid: o.cid || 'fp14binder', center: true });
  if (o.sub) UI.label(o.sub, lx + lw / 2, ly + lh + h * .07, { size: Math.max(10, h * .06), fill: '#f3f0e4', hero: false, maxW: lw });
  // the rings
  for (const f of [.2, .5, .8]) { const ry = y0 + h * f; ctx.fillStyle = V2.grad(x0, 0, x0 + 12, 0, [[0, '#f0f3f8'], [1, '#7e8898']]); ctx.strokeStyle = 'rgba(14,12,22,.8)'; ctx.lineWidth = 1.6; rr(x0 - 4, ry - 6, 14, 12, 4); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
EXT.prop.fp14_binder = (side, o, t) => {
  const w = 96, h = 120;
  ctx.save(); ctx.rotate(o.binderRot ?? -.05); ctx.translate(-w * .22, -h * .42);
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  A.drawBinder(w / 2, h / 2, w, h, { color: o.binderColor || '#27456f', label: o.binderLabel ?? 'SURVEY READY', cid: 'fp14heldbinder' });
  ctx.restore();
};
PROP_BOX.fp14_binder = [-40, -70, 76, 70];

// binoculars held to the eyes: two barrels with objective lenses facing us, a bridge with a focus wheel; o.focus 0..1 pulls the barrels out and sharpens the glint
EXT.prop.fp14_binocs = (side, o, t) => {
  const k = KINDS[o.kind] || KINDS.star14, g = (o.grip && o.grip.l) || [0, 0], f = clamp(o.focus ?? 0), q = clamp(o.binocK ?? 1), a = clamp(o.binocA ?? 1);
  if (a <= 0.01) return;
  ctx.save(); ctx.translate(-g[0] * q, (k.eyeY - g[1]) * q); ctx.scale(lerp(.45, 1, a), lerp(.45, 1, a)); ctx.globalAlpha *= clamp(a * 1.6);   /* binocK 0 = at the hand, 1 = at the eyes; binocA 0..1 brings them out of the jacket */
  const ex = k.eyeX, R = k.er * 1.55 + 6 + 3 * f, L = 26 + 14 * f;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // the bridge and the focus wheel
  ctx.fillStyle = '#2e3138'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-ex * .8, -9, ex * 1.6, 18, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6b7280'; ell(0, -4, 11, 8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 3.6 + Math.sin(f * 6) * 1.5, -10); ctx.lineTo(i * 3.6 + Math.sin(f * 6) * 1.5, 2); ctx.stroke(); }
  for (const s of [-1, 1]) {
    const cx = s * ex;
    // the barrel body (seen end-on it is a ring of rubber), the lens set inside it
    ctx.fillStyle = V2.radial(cx - 6, -6, R * .2, R * 1.2, [[0, '#4a4e58'], [1, '#17181d']]); ell(cx, 0, R + L * .2, R + L * .2); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, 0, R + L * .2 - 5, PI * 1.05, PI * 1.6); ctx.stroke();
    ctx.fillStyle = V2.radial(cx - R * .3, -R * .3, 1, R, [[0, '#9bd0ff'], [.45, '#2d5f9a'], [1, '#0b1a33']]); ell(cx, 0, R * .8, R * .8); ctx.fill(); ctx.strokeStyle = '#0a0a10'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${.5 + .4 * f})`; ell(cx - R * .28, -R * .3, R * .22, R * .12, -.6); ctx.fill();
    ctx.fillStyle = 'rgba(200,170,255,.35)'; ell(cx + R * .22, R * .26, R * .3, R * .12, .5); ctx.fill();
  }
  ctx.restore();
};
PROP_BOX.fp14_binocs = Object.assign([-70, -50, 70, 40], { nearFace: true });

// ------------------------------------------------------------------ small extras for the lobby scene (the Administrator's pizza, a picture frame to hide in)
// pizza sauce round the mouth: o.sauce 0..1 a few dabs at the corners, o.sauceSmile 0..1 a wide red smear wiped across the lower face (the "pizza smile"); drawn over the face
EXT.acc.fp14_sauce = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const a = clamp(o.sauce ?? 0), b = clamp(o.sauceSmile ?? 0);
  if (a <= .01 && b <= .01) return;
  const my = k.mouthY, mw = (k.mw || 26) + 6;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (a > .01) {
    ctx.fillStyle = `rgba(190,52,34,${.9 * a})`;
    for (const [dx, dy, r] of [[-mw - 4, 4, 7], [mw + 6, 10, 8], [-mw + 8, 22, 5.5], [mw - 10, 26, 6], [4, 30, 4.5]]) { ell(dx, my + dy, r * a + 1, r * .8 * a + 1, dx * .1); ctx.fill(); }
    ctx.fillStyle = `rgba(246,184,64,${.9 * a})`; for (const [dx, dy] of [[-mw + 2, 14], [mw + 2, 18]]) { ell(dx, my + dy, 4 * a + 1, 3 * a + 1); ctx.fill(); }
  }
  if (b > .01) {   /* the napkin dragged a wide red smile across the cheeks */
    ctx.strokeStyle = `rgba(196,56,38,${.85 * b})`; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(-mw * 2.1, my - 8); ctx.quadraticCurveTo(0, my + 38 * b, mw * 2.1, my - 8); ctx.stroke();
    ctx.strokeStyle = `rgba(246,184,64,${.7 * b})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-mw * 1.6, my - 2); ctx.quadraticCurveTo(0, my + 30 * b, mw * 1.6, my - 2); ctx.stroke();
  }
  ctx.restore();
};
// a paper napkin in the fist, stained with sauce
EXT.prop.fp14_napkin = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .4 + .2); ctx.lineJoin = 'round';
  ctx.fillStyle = '#fbfaf4'; ctx.strokeStyle = 'rgba(70,60,50,.75)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-18, -22); ctx.lineTo(8, -28); ctx.lineTo(24, -12); ctx.lineTo(20, 10); ctx.lineTo(-4, 16); ctx.lineTo(-22, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(200,60,40,.8)'; ell(4, -8, 7, 5, .4); ctx.fill(); ell(-8, 2, 4, 3); ctx.fill(); ctx.fillStyle = 'rgba(246,190,70,.75)'; ell(12, 2, 4, 3); ctx.fill();
  ctx.restore();
};
PROP_BOX.fp14_napkin = Object.assign([-26, -32, 28, 20], { nearFace: true });
// a picture frame held round the face: for somebody pretending to be a portrait. The face shows through it; registered nearFace. o.frameA 0..1 raises it
EXT.prop.fp14_frame = (side, o, t) => {
  const k = KINDS[o.kind] || KINDS.lemon, g = (o.grip && o.grip.l) || [0, 0], a = clamp(o.frameA ?? 1);
  if (a <= .01) return;
  const fw = (k.eyeX + k.er * 1.9) * 1.12, fh = (k.mouthY - k.eyeY + k.er * 3.5) * 1.1, cy = (k.eyeY + k.mouthY) / 2 + 2;
  ctx.save(); ctx.translate(-g[0], cy - g[1]); ctx.scale(lerp(.6, 1, a), lerp(.6, 1, a)); ctx.globalAlpha *= clamp(a * 1.5); ctx.lineJoin = 'round';
  ctx.strokeStyle = V2.grad(-fw, -fh, fw, fh, [[0, '#f6dc84'], [.5, '#b98a2c'], [1, '#8a6218']]); ctx.lineWidth = 17; rr(-fw, -fh, fw * 2, fh * 2, 10); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,24,6,.85)'; ctx.lineWidth = 3; rr(-fw - 8.5, -fh - 8.5, fw * 2 + 17, fh * 2 + 17, 12); ctx.stroke(); rr(-fw + 8.5, -fh + 8.5, fw * 2 - 17, fh * 2 - 17, 6); ctx.stroke();
  ctx.fillStyle = '#f6dc84'; for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ell(sx * (fw + 2), sy * (fh + 2), 10, 10); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,6,.8)'; ctx.lineWidth = 2.4; ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp14_frame = o => { const k = lerp(.6, 1, clamp(o.frameA ?? 1)); return Object.assign([-110 * k, -150 * k, 110 * k, 120 * k], { nearFace: true }); };   /* the box shrinks with the frame as it is lowered */

// ------------------------------------------------------------------ the rest of the cast (delegates)
A.pear = o => (window.A7 && A7.pear ? A7.pear(Object.assign({ s: SC, y: G }, o)) : Object.assign({ kind: 'pear', id: 'pear', who: 'pear', s: SC, y: G, expr: 'neutral' }, o));
A.goji = o => (window.A7 && A7.goji ? A7.goji(Object.assign({ s: SC, y: G }, o)) : Object.assign({ kind: 'goji', id: 'goji', who: 'goji', s: SC, y: G, expr: 'neutral' }, o));
})();
