'use strict';
/* SHIFT HAPPENS, Episode 13 art kit, shared by every Episode 13 scene module. Exposed as window.A13. Registers through the engine's EXT hooks, so earlier episodes are untouched.
 * Owner of changes: the vault builder (Brenda and her props). Constructors return the options object for drawChar, like A7 / A10 / A11.
 *
 *   A13.brenda(o)            Brenda, RN: a prune nurse who went on break in 2019 and was never relieved. Options on top of the usual drawChar ones:
 *                            dust (0..1, how much dust she still wears, default .55), web (0..1 the cobweb across her mouth, default 0), webT (seconds since the web snapped, -1 = intact),
 *                            tear (0..1 a dusty tear running down her cheek), specsDrop (0..1 how far the glasses have slid, default .7), capOff (hide the cap), look / expr / arms as always.
 *   A13.expr(name)           the face presets used for her (also registered on EXPR as brenda_weak, brenda_tear, brenda_relief)
 *   A13.penDir               the angle the held penlight points (o.penAim, radians, in the character's own frame)
 *   A13.cobweb(...)          a procedural spider web in a corner or across an opening, with a tear parameter
 *   A13.motes(...)           lit dust motes inside a cone
 *   A13.bar                  the wrapped granola bar (prop fp13_bar)
 * Props:  fp13_pen (a penlight, aimed with o.penAim), fp13_bar (the granola bar from the first scene, o.barOpen 0..1 unwrapped), fp13_cap (a scrub cap held to the chest). */
(() => {
const A = window.A13 = {};
const bodyClip = (o, k) => ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
const sr = (i, s = 0) => hash(i * 3.17 + s * 11.3 + 1.3);

// ------------------------------------------------------------------ faces: weak -> tearful -> relieved (EXPR presets read by v2_char: ang, raise, curve, lid, wide, pup)
EXPR.brenda_weak = { ang: -.38, raise: 4, curve: -.3, lid: .52, wide: .92, pup: .78, bags: true };
EXPR.brenda_tear = { ang: -.62, raise: 8, curve: -.7, lid: .3, wide: 1.0, pup: .9, bags: true };
EXPR.brenda_relief = { ang: -.18, raise: 10, curve: .9, lid: .25, wide: 1.0, pup: 1.0, bags: true };
EXPR.brenda_wake = { ang: -.28, raise: 14, curve: -.1, lid: .1, wide: 1.1, pup: .7, bags: true };
A.expr = n => EXPR['brenda_' + n] ? 'brenda_' + n : n;

// ------------------------------------------------------------------ Brenda
A.brenda = o => Object.assign({
  kind: 'prune', id: 'brenda', who: 'brenda', s: SC, y: G, seed: 133, topExtra: 26,
  colors: ['#a08ea0', '#665068', '#2a1b2e'], browColor: '#2a1830', browW: 9, eyeScale: 1.04,
  acc: ['fp13_scrubs', 'fp13_wrinkles', 'steth', 'badge7', 'fp13_dust', 'fp13_shut', 'fp13_specs', 'fp13_cap', 'fp13_webs', 'fp13_tear'],
  badgeText: 'RN', expr: 'brenda_weak', dust: .55, specsDrop: .7, web: 0, webT: -1, tear: 0,
}, o);

// the extra wrinkles of a very dry prune: forehead, between the brows, crow's feet, bags, the folds either side of the mouth, and long creases that follow the body
EXT.acc.fp13_wrinkles = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  ctx.save(); bodyClip(o, k);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ink = 'rgba(28,8,34,.68)', hi = 'rgba(255,238,255,.16)';
  const line = (pts, w = 3.4) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    const L = pts[pts.length - 1]; ctx.lineTo(L[0], L[1]);
    ctx.strokeStyle = hi; ctx.lineWidth = w; ctx.save(); ctx.translate(1.4, 2.4); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = ink; ctx.lineWidth = w; ctx.stroke();
  };
  // forehead (what shows under the cap): two lines, broken in the middle like a worry
  for (let i = 0; i < 2; i++) {
    const y = -78 + i * 11, w = 78 - i * 12;
    line([[-w, y + 6], [-w * .55, y - 3], [-w * .12, y + 1]], 3.8);
    line([[w * .12, y + 1], [w * .55, y - 3 + (i % 2) * 3], [w, y + 6]], 3.8);
  }
  // between the brows
  line([[-9, -66], [-11, -52], [-8, -42]], 3.2); line([[9, -66], [11, -52], [8, -42]], 3.2);
  // crow's feet
  for (const s of [-1, 1]) {
    const ex = s * (k.eyeX + k.er * 1.2);
    line([[ex + s * 4, k.eyeY - 10], [ex + s * 26, k.eyeY - 24]], 3); line([[ex + s * 6, k.eyeY + 2], [ex + s * 32, k.eyeY - 2]], 3); line([[ex + s * 4, k.eyeY + 14], [ex + s * 28, k.eyeY + 22]], 3);
    // bags, and the crease under them
    line([[s * (k.eyeX - 22), k.eyeY + 30], [s * k.eyeX, k.eyeY + 36], [s * (k.eyeX + 22), k.eyeY + 28]], 3.2);
    line([[s * (k.eyeX - 20), k.eyeY + 42], [s * k.eyeX, k.eyeY + 47], [s * (k.eyeX + 24), k.eyeY + 40]], 2.6);
    // the fold from nose to mouth corner, and a second one outside it
    line([[s * 14, k.eyeY + 34], [s * 36, k.mouthY - 8], [s * 44, k.mouthY + 22]], 3.8);
    line([[s * 22, k.eyeY + 60], [s * 52, k.mouthY + 8], [s * 60, k.mouthY + 36]], 3);
  }
  // chin: a dimple and two puckers, and the fine lines that fan out from the mouth
  line([[-14, k.mouthY + 40], [0, k.mouthY + 46], [14, k.mouthY + 40]], 3.4);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) line([[s * (k.mw ? k.mw + 10 : 36), k.mouthY - 8 + i * 8], [s * (74 + i * 4), k.mouthY - 12 + i * 12]], 2.4);
  // creases that follow the body, like a prune
  const R = [[-.84, -.2, .5], [.88, -.1, .5], [-.7, .42, .4], [.68, .5, .4], [-.4, .78, .3], [.38, .8, .3], [-.9, -.52, .4], [.9, -.5, .4], [-.55, -.8, .3], [.58, -.8, .3]];
  R.forEach(([cx, cy, ln], i) => {
    const x = cx * k.rx, y = cy * k.ry, a = Math.atan2(cy, cx) + PI / 2, L = ln * 70;
    line([[x - Math.cos(a) * L, y - Math.sin(a) * L], [x + Math.cos(a + PI / 2) * 9, y + Math.sin(a + PI / 2) * 9 + 4 * Math.sin(i)], [x + Math.cos(a) * L, y + Math.sin(a) * L]], 4.4);
  });
  ctx.restore();
};

// faded scrubs: a V-neck top in a washed-out teal, a pocket with a pen, a seam; dusty at the shoulders
EXT.acc.fp13_scrubs = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  ctx.save(); bodyClip(o, k);
  const top = k.mouthY + 28, vn = 38, dust = o.dust ?? .55;
  const g = V2.grad(0, top, 0, k.ry, [[0, '#6aa59f'], [.55, '#4f8a86'], [1, '#2f5654']]);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-k.rx * 1.2, top + 14); ctx.lineTo(-24, top + 2); ctx.lineTo(0, top + vn); ctx.lineTo(24, top + 2); ctx.lineTo(k.rx * 1.2, top + 14); ctx.lineTo(k.rx * 1.2, k.ry * 1.2); ctx.lineTo(-k.rx * 1.2, k.ry * 1.2); ctx.closePath(); ctx.fill();
  // fabric: faint weave, side seams
  ctx.strokeStyle = 'rgba(20,50,50,.28)'; ctx.lineWidth = 2;
  for (let x = -k.rx; x <= k.rx; x += 14) { ctx.beginPath(); ctx.moveTo(x, top + 24); ctx.lineTo(x * 1.04, k.ry * 1.1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(10,30,32,.6)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-24, top + 2); ctx.lineTo(0, top + vn); ctx.lineTo(24, top + 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(210,235,225,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, top + 5); ctx.lineTo(0, top + vn - 9); ctx.lineTo(18, top + 5); ctx.stroke();
  // the chest pocket, a pen and a tongue depressor
  ctx.save(); ctx.translate(-52, top + 54);
  ctx.fillStyle = '#5b9a94'; ctx.strokeStyle = 'rgba(10,30,32,.6)'; ctx.lineWidth = 2.6; rr(-22, -4, 44, 40, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e2d0'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(-9, -22, 5, 34, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9a441'; rr(5, -16, 8, 28, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a6fdb'; ctx.fillRect(-9, -16, 5, 5);
  ctx.restore();
  // dust settled on the top edge of the fabric and the drift of it on the shoulders of the top
  ctx.fillStyle = `rgba(200,196,190,${.38 * dust})`;
  ctx.beginPath(); ctx.moveTo(-k.rx * 1.2, top + 14); ctx.lineTo(-24, top + 2); ctx.lineTo(-24, top + 14); ctx.lineTo(-k.rx * 1.2, top + 28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(k.rx * 1.2, top + 14); ctx.lineTo(24, top + 2); ctx.lineTo(24, top + 14); ctx.lineTo(k.rx * 1.2, top + 28); ctx.closePath(); ctx.fill();
  ctx.restore();
};

// dust on a prune: a grey bloom over the upper body, a fine speckle, and heavy drifts lying on the shoulders and the cap. `dust` fades as she shakes it off
EXT.acc.fp13_dust = (o, k, t, layer) => {
  const d = o.dust ?? .55;
  if (d <= .01) return;
  if (layer === 'mid') {
    ctx.save(); bodyClip(o, k);
    // matte: the skin's glossy window highlight is painted over with dry, dusty skin (a dried prune does not shine)
    { const kx = V2.LIGHT.key[0], ky = V2.LIGHT.key[1], ang = Math.atan2(ky, kx) + PI / 2;
      ctx.save(); ctx.translate(kx * k.rx * .52, ky * k.ry * .58); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(112,84,118,.82)'; ell(0, 0, k.rx * .26, k.ry * .13); ctx.fill(); ell(k.rx * .3, k.ry * .12, k.rx * .09, k.ry * .09); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.fillStyle = 'rgba(108,80,114,.55)'; ctx.beginPath(); ctx.ellipse(0, 0, k.rx * .96, k.ry * .96, 0, Math.atan2(ky, kx) + PI - .75, Math.atan2(ky, kx) + PI + .25); ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(108,80,114,.55)'; ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = V2.radial(0, -k.ry * .5, 10, k.rx * 1.1, [[0, `rgba(196,190,184,${.30 * d})`], [.7, `rgba(196,190,184,${.18 * d})`], [1, 'rgba(196,190,184,0)']]);
    ctx.fillRect(-k.rx * 1.3, -k.ry * 1.3, k.rx * 2.6, k.ry * 2);
    // the leathery tooth of dried skin: short ticks across the body
    ctx.strokeStyle = 'rgba(30,10,36,.22)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = (sr(i, 12) * 2 - 1) * k.rx * .96, y = (sr(i, 13) * 2 - 1) * k.ry * .96;
      if (Math.abs(x) < k.eyeX + k.er * 1.5 && y > k.eyeY - k.er * 2 && y < k.mouthY + 34) continue;
      const a = sr(i, 14) * PI, L = 5 + sr(i, 15) * 9;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
    }
    for (let i = 0; i < 90; i++) {
      const x = (sr(i, 2) * 2 - 1) * k.rx * .95, y = (sr(i, 3) * 2 - 1) * k.ry * .95;
      if (Math.abs(x) < k.eyeX + k.er * 1.4 && y > k.eyeY - k.er * 1.8 && y < k.mouthY + 30) continue;
      ctx.fillStyle = `rgba(205,200,194,${(.14 + .2 * sr(i, 4)) * d})`; ell(x, y, 1.6 + sr(i, 5) * 3.4, 1.2 + sr(i, 6) * 2.2, sr(i, 7) * 3); ctx.fill();
    }
    ctx.restore();
  } else if (layer === 'front') {
    // a low drift of dust lying on each shoulder (where the arm leaves the body), flat and lumpy, with a bright crest
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * (k.rx * .93 + 8), 2); ctx.rotate(s * .5);
      const h = 13 * d + 3;
      ctx.fillStyle = `rgba(212,207,200,${.96 * d})`; ctx.strokeStyle = `rgba(116,110,106,${.55 * d})`; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-26, 4); ctx.bezierCurveTo(-22, -h * .9, -8, -h * 1.15, 2, -h); ctx.bezierCurveTo(12, -h * 1.2, 24, -h * .7, 30, 4); ctx.quadraticCurveTo(2, 9, -26, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,250,${.4 * d})`; ell(-2, -h * .6, 14, 2.6); ctx.fill();
      ctx.restore();
    }
  }
};

// closed eyes: a relaxed downward arc with a few lashes, over the lids (shut 0..1)
EXT.acc.fp13_shut = (o, k, t, layer) => {
  const sh = o.shut ?? 0;
  if (layer !== 'front' || sh < .05) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha *= clamp(sh * 1.5);
  const breathe = Math.sin(t * 1.5 + 1) * .6;
  for (const s of [-1, 1]) {
    const x = s * k.eyeX, y = k.eyeY + 6 + breathe, w = k.er * .98;
    ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 4.4;
    ctx.beginPath(); ctx.moveTo(x - w, y - 5); ctx.quadraticCurveTo(x, y + 13, x + w, y - 5); ctx.stroke();
    ctx.lineWidth = 2.6;
    for (const u of [-.7, -.25, .25, .7]) { const px = x + u * w, py = y + 3.6 - 9 * (u * u - .5) * 0 + 2.6 * (1 - u * u); ctx.beginPath(); ctx.moveTo(px, py + 2); ctx.lineTo(px + s * 1.5 * u * 3, py + 9); ctx.stroke(); }
  }
  ctx.restore();
};

// glasses that have slid down her nose: round wire frames, the lenses furred with dust, one swiped clean. specsDrop 0 = on her eyes, 1 = on the tip of the nose
EXT.acc.fp13_specs = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const drop = o.specsDrop ?? .7, ex = k.eyeX, r = k.er * 1.16, yTop = k.eyeY - 12 + 26 * drop, cy = yTop + r;
  ctx.save(); ctx.translate(0, cy); ctx.rotate(.045);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 4;   /* temples back to the sides of the head */
  ctx.beginPath(); ctx.moveTo(-ex - r, -2); ctx.lineTo(-k.rx * .97, -12); ctx.moveTo(ex + r, -2); ctx.lineTo(k.rx * .97, -12); ctx.stroke();
  for (const s of [-1, 1]) {
    const cx = s * ex;
    ctx.fillStyle = 'rgba(214,208,200,.3)'; ctx.beginPath(); ctx.arc(cx, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.arc(cx, 0, r * .62, PI * 1.1, PI * 1.45); ctx.stroke();   /* the swipe */
    ctx.strokeStyle = '#8a7648'; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.arc(cx, 0, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,236,170,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, 0, r + 1.3, PI * 1.05, PI * 1.5); ctx.stroke();
  }
  ctx.strokeStyle = '#8a7648'; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(-ex + r, -3); ctx.quadraticCurveTo(0, -r * .5, ex - r, -3); ctx.stroke();
  ctx.restore();
};

// the cap: a faded floral scrub cap, askew, with the prune's stem poking out of the top, a cobweb hanging from its tail and a drift of dust on it
EXT.acc.fp13_cap = (o, k, t, layer) => {
  if (layer !== 'front' || o.capOff) return;
  const d = o.dust ?? .55, sway = Math.sin(t * 1.3 + 2) * .012, X = k.rx * 1.0, TOP = -k.ry * 1.13;
  ctx.save(); ctx.rotate(-.06 + sway);
  const hem = x => -88 + Math.pow(x / X, 2) * 38;
  const rim = i => { const x = -X + (i / 10) * 2 * X; return [x, hem(x) + (i % 2 ? 9 : 2)]; };
  ctx.beginPath();
  ctx.moveTo(-X, hem(-X) + 6);
  ctx.bezierCurveTo(-X * 1.08, -k.ry * .86, -X * .6, TOP - 2, 6, TOP);
  ctx.bezierCurveTo(X * .66, TOP + 2, X * 1.08, -k.ry * .84, X, hem(X) + 6);
  for (let i = 10; i >= 0; i--) { const [x, y] = rim(i); ctx.lineTo(x, y); }
  ctx.closePath();
  ctx.fillStyle = V2.grad(0, TOP, 0, -70, [[0, '#a9cdbd'], [1, '#76a698']]); ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 24; i++) {   /* faded little flowers */
    const x = (sr(i, 8) * 2 - 1) * X * .96, y = TOP + 6 + sr(i, 9) * (-72 - TOP - 6);
    ctx.fillStyle = i % 3 ? 'rgba(244,206,214,.72)' : 'rgba(250,238,176,.72)';
    for (let p = 0; p < 5; p++) { ell(x + Math.cos(p * 1.257) * 5.4, y + Math.sin(p * 1.257) * 5.4, 4, 4); ctx.fill(); }
    ctx.fillStyle = 'rgba(120,90,60,.7)'; ell(x, y, 2.4, 2.4); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(40,70,64,.32)'; ctx.lineWidth = 2.4;   /* the gathers */
  for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(6, TOP); ctx.quadraticCurveTo(i * 28, -k.ry * .9, i * 24, hem(i * 24) + 4); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, TOP - 6, 0, -k.ry * .86, [[0, `rgba(226,222,216,${.85 * d})`], [1, 'rgba(226,222,216,0)']]); ctx.fillRect(-X * 1.3, TOP - 10, X * 2.6, k.ry * .4);
  ctx.restore();
  ctx.lineWidth = 4.4; ctx.strokeStyle = 'rgba(25,10,20,.9)'; ctx.stroke();
  ctx.beginPath(); for (let i = 0; i <= 10; i++) { const [x, y] = rim(i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }   /* the scalloped band */
  ctx.strokeStyle = 'rgba(25,10,20,.9)'; ctx.lineWidth = 3.6; ctx.stroke();
  ctx.fillStyle = `rgba(222,218,210,${.9 * d})`; ctx.strokeStyle = `rgba(120,114,108,${.5 * d})`; ctx.lineWidth = 2;   /* a drift on the crown */
  ctx.beginPath(); ctx.moveTo(-34, TOP + 14); ctx.bezierCurveTo(-26, TOP - 2, -8, TOP - 8, 10, TOP - 4); ctx.bezierCurveTo(28, TOP - 8, 40, TOP + 2, 48, TOP + 16); ctx.quadraticCurveTo(6, TOP + 24, -34, TOP + 14); ctx.closePath(); if (d > .08) { ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(6, TOP + 1); ctx.quadraticCurveTo(12, TOP - 6, 20, TOP - 14); ctx.stroke();   /* the stem */
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(4, TOP); ctx.quadraticCurveTo(10, TOP - 7, 17, TOP - 15); ctx.stroke();
  ctx.restore();
};

// cobwebs on her: a strand from the cap to the shoulder, a little web at the cap's tail, and the web across her mouth (web 1 = intact, webT >= 0: it has snapped that many seconds ago)
EXT.acc.fp13_webs = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const web = o.web ?? 0, wt = o.webT ?? -1, d = o.dust ?? .55;
  ctx.save(); ctx.lineCap = 'round';
  if (d > .12) {
    // cap tail to shoulder
    ctx.strokeStyle = `rgba(235,235,232,${.7 * Math.min(1, d * 1.6)})`; ctx.lineWidth = 1.8;
    const sw = Math.sin(t * 1.6) * 3;
    ctx.beginPath(); ctx.moveTo(-96, -92); ctx.quadraticCurveTo(-128 + sw, -44, -112, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-86, -80); ctx.quadraticCurveTo(-114 + sw, -40, -100, 4); ctx.stroke();
    for (const u of [.3, .55, .8]) { const x0 = lerp(-96, -112, u) - 14 * Math.sin(u * PI) * 0, y0 = lerp(-92, 12, u); ctx.beginPath(); ctx.moveTo(x0 - 3, y0); ctx.quadraticCurveTo(x0 + 6, y0 + 4 + sw * .1, x0 + 10, y0 - 2); ctx.stroke(); }
    // a tuft on the cap's far side
    ctx.strokeStyle = `rgba(235,235,232,${.6 * Math.min(1, d * 1.6)})`;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(94, -86); ctx.quadraticCurveTo(110 + i * 4, -70 + i * 6 + sw * .3, 116 + i * 6, -52 + i * 12); ctx.stroke(); }
  }
  // the mouth: a few fine threads from the lips to the cheeks and chin, drawn taut across a closed mouth and stretched thin as it opens
  if (web > .02) {
    const m = clamp(o.talk || 0), w = k.mw || 26, my = k.mouthY, gape = 4 + 34 * m;
    const strand = (ax, ay, bx, by, sag) => { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag, bx, by); ctx.stroke(); };
    if (wt < 0) {   // intact
      ctx.strokeStyle = `rgba(248,248,244,${.85 * web})`; ctx.lineWidth = 1.7;
      for (const s of [-1, 1]) {
        strand(s * (w + 4), my - 2, s * (w + 40), my - 16, 3); strand(s * (w + 4), my, s * (w + 44), my + 4, 4); strand(s * (w + 4), my + 3, s * (w + 34), my + 30, 3);
        strand(s * (w + 4), my + 2, s * 6, my + gape + 8, 4 + 6 * m);
      }
      strand(-w - 6, my - 4, w + 6, my - 4, 2 + 4 * m); strand(-w - 6, my + 3, w + 6, my + 3, gape * .9 + 4);
      strand(-8, my - 6, -6, my + gape + 12, 0); strand(10, my - 6, 8, my + gape + 12, 0);
    } else {   // snapped: the threads recoil to the cheeks and hang
      const r = easeOut(clamp(wt / .3)), a = (1 - clamp((wt - .9) / 1.1)) * web;
      if (a > .02) {
        ctx.strokeStyle = `rgba(248,248,244,${.85 * a})`; ctx.lineWidth = 1.7;
        for (const s of [-1, 1]) {
          const hang = (len, dy, ph) => strand(s * (w + 4), my + dy, s * (w + 4 + (1 - r) * len + r * 8), my + dy + 10 + r * 26 + 4 * Math.sin(t * 6 + ph) * (1 - r), 4);
          hang(36, -2, 0); hang(40, 0, 1); hang(30, 3, 2);
        }
      }
    }
  }
  ctx.restore();
};

// a dusty tear: a drop that runs from her eye down the wrinkles of the cheek, leaving a clean track in the dust
EXT.acc.fp13_tear = (o, k, t, layer) => {
  const p = o.tear ?? 0;
  if (layer !== 'front' || p <= 0) return;
  const side = o.tearSide ?? -1, x0 = side * (k.eyeX + 14), y0 = k.eyeY + 12;
  const path = u => [x0 + side * (4 + 12 * Math.sin(u * 2.4)), y0 + 20 + u * 78];
  const u = easeIO(clamp(p));
  ctx.save(); ctx.lineCap = 'round';
  // the clean track, widest where the drop has been longest
  ctx.strokeStyle = 'rgba(240,226,238,.55)'; ctx.lineWidth = 5;
  ctx.beginPath(); for (let i = 0; i <= 20; i++) { const [x, y] = path(u * i / 20); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  ctx.strokeStyle = 'rgba(110,70,120,.45)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); for (let i = 0; i <= 20; i++) { const [x, y] = path(u * i / 20); i ? ctx.lineTo(x + 3, y) : ctx.moveTo(x + 3, y); } ctx.stroke();
  const [hx, hy] = path(u);
  ctx.fillStyle = 'rgba(205,230,255,.95)'; ctx.strokeStyle = 'rgba(60,90,130,.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hx, hy - 12); ctx.quadraticCurveTo(hx + 9, hy + 2, hx, hy + 8); ctx.quadraticCurveTo(hx - 9, hy + 2, hx, hy - 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ell(hx - 2.4, hy - 2, 2, 3.4); ctx.fill();
  ctx.restore();
};

// ------------------------------------------------------------------ props
Object.assign(PROP_BOX, { fp13_pen: [-14, -64, 14, 14], fp13_bar: [-34, -42, 34, 22], fp13_cap: [-46, -40, 46, 26] });
// a penlight: slim, white with a clip, the lit lens at the tip. o.penAim is the angle it points, in the character's own frame (0 = straight up); o.penOn 0..1 the brightness
EXT.prop.fp13_pen = (side, o, t) => {
  ctx.save(); ctx.rotate(o.penAim ?? 0);
  ctx.fillStyle = V2.grad(-6, 0, 6, 0, [[0, '#f4f4ee'], [1, '#b8bcc4']]); ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-6, -52, 12, 62, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a6fdb'; ctx.fillRect(-6, -8, 12, 6);
  ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(6, -40); ctx.lineTo(10, -40); ctx.lineTo(10, -18); ctx.stroke();
  ctx.fillStyle = '#3a3f4a'; rr(-7, -62, 14, 14, 3); ctx.fill(); ctx.stroke();
  const on = o.penOn ?? 1;
  ctx.fillStyle = `rgba(255,248,226,${.35 + .65 * on})`; ell(0, -63, 7.4, 5); ctx.fill();
  ctx.restore();
};
// the granola bar from the first scene: wrapped (barOpen 0) or with the wrapper peeled down and the bar bitten (barOpen 1; barBite 0..1)
EXT.prop.fp13_bar = (side, o, t) => {
  const op = clamp(o.barOpen ?? 0), bite = clamp(o.barBite ?? 0);
  ctx.save(); ctx.rotate(side * -.5 + (o.barRot ?? 0));
  // the bar
  ctx.fillStyle = '#c99a58'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-30, -14); ctx.lineTo(26 - 22 * bite, -14); ctx.quadraticCurveTo(34 - 22 * bite, -4, 26 - 22 * bite, 10); ctx.lineTo(-30, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e2c27a'; for (let i = 0; i < 7; i++) { ell(-24 + i * 7, -6 + (i % 3) * 5, 3, 2.6); ctx.fill(); }
  ctx.fillStyle = '#6a3a1e'; for (let i = 0; i < 4; i++) { ell(-20 + i * 13, 2 + (i % 2) * 4, 3.4, 2.6); ctx.fill(); }
  // the wrapper: covers the bar when closed, rolled back toward the hand when open
  const cover = 1 - op;
  ctx.fillStyle = V2.grad(-30, -16, 30, 12, [[0, '#2f6fc0'], [.5, '#dfe6f2'], [1, '#e8a23a']]); ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-36, -16); ctx.lineTo(-36 + 66 * cover - 6, -16); ctx.lineTo(-36 + 66 * cover + 6, -10); ctx.lineTo(-36 + 66 * cover - 6, -4); ctx.lineTo(-36 + 66 * cover + 6, 2); ctx.lineTo(-36 + 66 * cover - 6, 8); ctx.lineTo(-36 + 66 * cover, 12); ctx.lineTo(-36, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// a scrub cap held over the heart (hats off)
EXT.prop.fp13_cap = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .25);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-34, 6); ctx.lineTo(-24, -26); ctx.quadraticCurveTo(0, -34, 24, -26); ctx.lineTo(34, 6); ctx.quadraticCurveTo(0, 14, -34, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd5de'; ctx.fillRect(-31, -2, 62, 6);
  ctx.fillStyle = '#e8193a'; ctx.fillRect(-4, -22, 8, 20); ctx.fillRect(-10, -16, 20, 8);
  ctx.restore();
};

// ------------------------------------------------------------------ shared drawing helpers
/* a spider web. kind 'corner' fans out of a corner (x, y) toward (dx, dy) directions; kind 'orb' is a round web; kind 'curtain' spans an opening [x0, y0, x1, y1] with sagging threads.
 * tear 0..1 snaps threads progressively from `from` (0 left, 1 right); alpha is the overall opacity. Draws in the current transform. */
A.cobweb = (kind, a, o = {}) => {
  const alpha = o.alpha ?? .6, seed = o.seed ?? 1, lw = o.lw ?? 1.4, col = o.color ?? '236,240,238', tear = o.tear ?? 0, t = o.t ?? 0;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${col},${alpha})`; ctx.lineWidth = lw;
  if (kind === 'corner') {   // a = [x, y, ux, uy, vx, vy, len]: the corner point, two unit directions along the walls, and the radius
    const [x, y, ux, uy, vx, vy, R] = a, spokes = 6;
    for (let i = 0; i <= spokes; i++) {
      const f = i / spokes, dx = lerp(ux, vx, f), dy = lerp(uy, vy, f), L = Math.hypot(dx, dy) || 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx / L * R * (.85 + .15 * sr(i, seed)), y + dy / L * R * (.85 + .15 * sr(i, seed))); ctx.stroke();
    }
    for (let ring = 1; ring <= 5; ring++) {
      const rr0 = R * ring / 5.4;
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const f = i / spokes, dx = lerp(ux, vx, f), dy = lerp(uy, vy, f), L = Math.hypot(dx, dy) || 1, sag = (1 - Math.abs(f - .5) * 2) * rr0 * .1;
        const px = x + dx / L * rr0 - dx / L * sag * 0 + (i % 2 ? 0 : 0), py = y + dy / L * rr0 + sag;
        i ? ctx.quadraticCurveTo((ctx.__px + px) / 2, (ctx.__py + py) / 2 + sag * .7, px, py) : ctx.moveTo(px, py);
        ctx.__px = px; ctx.__py = py;
      }
      ctx.stroke();
    }
  } else if (kind === 'orb') {   // a = [cx, cy, R]
    const [cx, cy, R] = a, spokes = 9;
    for (let i = 0; i < spokes; i++) { const an = i / spokes * TAU + seed; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * R, cy + Math.sin(an) * R); ctx.stroke(); }
    for (let ring = 1; ring <= 6; ring++) {
      const rr0 = R * ring / 6;
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const an = i / spokes * TAU + seed, px = cx + Math.cos(an) * rr0 * (1 + .04 * sr(i + ring, seed)), py = cy + Math.sin(an) * rr0 * (1 + .04 * sr(i + ring, seed)) + 2;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
  } else if (kind === 'curtain') {   // a = [x0, y0, x1, y1]: the opening. A grid of sagging threads, snapped from the side `from` as `tear` goes 0 to 1
    const [x0, y0, x1, y1] = a, nx = o.nx ?? 9, ny = o.ny ?? 12, from = o.from ?? 0;
    const alive = (key, f) => { const thr = tear * 1.5 - (from ? 1 - f : f) * .5 - sr(key, seed) * .25; return thr < 0; };
    for (let j = 0; j <= ny; j++) {
      const fy = j / ny, y = lerp(y0, y1, fy);
      for (let i = 0; i < nx; i++) {
        const f0 = i / nx, f1 = (i + 1) / nx, xa = lerp(x0, x1, f0), xb = lerp(x0, x1, f1);
        const sag = 6 + 10 * sr(i + j * 31, seed + 4), wob = Math.sin(t * 1.7 + i * 2 + j) * 2;
        if (alive(i + j * 13, (f0 + f1) / 2)) { ctx.beginPath(); ctx.moveTo(xa, y + (sr(i + j, seed) - .5) * 8); ctx.quadraticCurveTo((xa + xb) / 2, y + sag + wob, xb, y + (sr(i + j + 1, seed) - .5) * 8); ctx.stroke(); }
      }
    }
    for (let i = 0; i <= nx; i++) {
      const fx = i / nx, x = lerp(x0, x1, fx);
      for (let j = 0; j < ny; j++) {
        const fa = j / ny, fb = (j + 1) / ny, ya = lerp(y0, y1, fa), yb = lerp(y0, y1, fb);
        if (alive(i * 7 + j * 3 + 101, fx)) { ctx.beginPath(); ctx.moveTo(x + (sr(i + j, seed + 2) - .5) * 6, ya); ctx.lineTo(x + (sr(i + j + 3, seed + 2) - .5) * 6 + Math.sin(t * 1.3 + i) * 2, yb); ctx.stroke(); }
      }
    }
  }
  ctx.restore();
};

/* dust motes inside a cone: S the source, T the target (screen/scene points), r0 and r1 the half widths at each end; every mote is a pure function of t */
A.motes = (S, T, r0, r1, t, o = {}) => {
  const n = o.n ?? 70, seed = o.seed ?? 1, size = o.size ?? 2.6, a = o.alpha ?? .85, color = o.color ?? '255,246,224';
  const dx = T[0] - S[0], dy = T[1] - S[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const u = (sr(i, seed) + t * (.01 + .02 * sr(i, seed + 1))) % 1, v = (sr(i, seed + 2) * 2 - 1) * .9, ph = sr(i, seed + 3) * TAU;
    const w = lerp(r0, r1, u), x = S[0] + dx * u + nx * v * w + Math.sin(t * .7 + ph) * 8 * (.4 + u), y = S[1] + dy * u + ny * v * w + Math.cos(t * .6 + ph) * 6 + ((t * (6 + 8 * sr(i, seed + 4))) % 40);
    const tw = .45 + .55 * Math.sin(t * (1.1 + 1.6 * sr(i, seed + 5)) + ph), sz = size * (.45 + sr(i, seed + 6) * .9);
    ctx.fillStyle = `rgba(${color},${a * tw * (.35 + .65 * sr(i, seed + 7)) * (1 - u * .25)})`; ctx.beginPath(); ctx.arc(x, y, sz, 0, TAU); ctx.fill();
  }
  ctx.restore();
};
})();
