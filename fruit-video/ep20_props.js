'use strict';
/* SHIFT HAPPENS, Episode 20: The Snow Day. Shared props: window.P20 (owner: BLACKOUT). Loaded before the scene files (sync_index_n.py puts ep20_props.js in the kit group).
 *
 * Convention (as P18): P20.name(ctx, o); o.x / o.y = anchor (a floor or table prop: bottom centre; a wall prop: centre), o.s = scale (1 = natural size at zoom 1), plus named state fields. Every prop is a PURE
 * function of its fields (no Math.random, no clock; o.t = scene-local seconds drives flicker and blink only; randomness only from the hash below). The prop draws in the transform in force (the scene camera)
 * and saves / restores the context. Text goes through the UI kit and is SET DRESSING (hero:false, crop:true) unless it comes out at 31 px or more on the screen (then it is hero) or o.hero is given.
 * Light is drawn with FX18 when it is there (glow) and a stand-in when not; the darkening and the real light cones are the SCENE's job (L20.pass); a prop only draws its own small glow.
 *
 * ------------------------------------------------------------------ HELD PROPS (hold: { l | r: 'name' } + grip: { l | r: [x, y] } as always; they are drawn around the hand)
 *  fp20_flashlight     a chunky torch, the lens end points along o.flAng (radians in SCREEN space as FX18.cone: 0 = +x right, PI/2 = down, -PI/2 = up, PI = left; default up and outward).
 *                      o.flOn 0..1 (the lens lights and glows), o.flColor (body, default '#f0b400'), o.flOld 0..1 (dented, dusty, faded: Brenda's from 2019), o.flTag ('2019': a strip of masking tape),
 *                      o.flScale (default 1). The prop's box is registered with the audit (nearFace).
 *  P20.flashlightPose(o, t) -> { x, y, ang, hx, hy } the lens position, the beam direction (same convention as flAng) and the hand, in the WORLD units the character is placed in (same units as o.x / o.y).
 *                      Needs o.hold + o.grip for the holding hand (the pose is computed from them, as ep18_station's handOf does). Add the L20 cone and SN20.beam there.
 *  fp20_phonelight     a phone held up like a torch, its flash at the top end: o.plOn 0..1, o.plAng (as flAng), o.plColor (case, default '#2b3140'). P20.phonePose(o, t) -> { x, y, ang, hx, hy } as above.
 *  fp20_stopwatch      a chunky round sports stopwatch with a seven-segment LCD "M:SS.s" (drawn as shapes, so it never touches the text gate): o.swTime (seconds, clamped 0..599.9),
 *                      o.swOn 0..1 (the backlight and the digits; default 1), o.swRun (1 while running: the colon blinks slowly), o.swScale (default 1). Green-blue LCD glow (FX18.glow).
 *  P20.stopwatchPose(o, t) -> { x, y, hx, hy } the LCD centre (world units), for the L20 point light.
 *
 * ------------------------------------------------------------------ SET PIECES
 *  P20.ledCandle(ctx, o)        o = { x, y (bottom centre), s, on 0..1, t, seed, kind 'pillar' (default, 42 x 96) | 'tea' (a battery tea light, 56 x 24), sticker 0..1 (an APPROVED label on the body), glow (default 1) }.
 *                               Returns { fx, fy, r } the flame centre and a glow radius (current coordinates) for the scene's point light. The flicker is slow and soft (under 1.2 Hz, +-5 percent).
 *  (the rest of the contract lands in the following blocks of this file: cot, moon, outlet, coffeeMaker, exitSign, emergencyLamp)
 */
(() => {
window.P20 = window.P20 || {};
const P20 = window.P20;
const PI = Math.PI, TAU = PI * 2;
const OUT = 'rgba(20,14,26,.86)';                                             /* the ink outline of a prop */
const c01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const hsh = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const rgbOf = col => { if (Array.isArray(col)) return col; col = String(col).trim(); if (col[0] === '#') return V2.rgb(col); const m = col.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [255, 255, 255]; };
const mixc = (a, b, k) => V2.rgba(V2.mix(rgbOf(a), rgbOf(b), c01(k)), 1);
const lgr = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
/* draw with `c` as the engine's current context (rr(), ell() and the UI kit draw on the global ctx), saving and restoring around the body */
function run(c, fn) {
  const prev = ctx; if (c && c !== ctx) ctx = c;
  try { ctx.save(); fn(ctx); ctx.restore(); } finally { ctx = prev; }
}
/* a label that is hero when it comes out at 31 px or more on the screen (or when o.hero says so), set dressing (allowed to be cut or small) otherwise */
function lab(str, cx, cy, o) {
  if (typeof UI === 'undefined') return null;
  const hero = o.hero !== undefined ? !!o.hero : (o.size || 30) * scrOf(ctx) >= 31;
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: !hero }));
}
const fx = () => (typeof FX18 !== 'undefined' && FX18) || null;
function glow(g, x, y, r, color, a, core) {
  if (a <= 0.003) return;
  const F = fx();
  if (F && typeof F.glow === 'function') F.glow(g, { x, y, r, color, alpha: a, core: core || 0 });
  else V2.glow(x, y, r, rgbOf(color).join(','), Math.min(1, a), 'screen', .3);
}
function outline(lw = 3, col = OUT) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
P20._ = { PI, TAU, OUT, c01, sg, ss, hsh, rgbOf, mixc, lgr, scrOf, run, lab, glow, outline };

// ------------------------------------------------------------------ the pose of a held torch: where the lens is, and where it points (world units, from the character's options)
/* the hand (grip) of the character that holds prop `name`, in the units of o.x / o.y: A15.centre-style body centre plus the grip offset */
function handOf(o, name) {
  const key = o.hold && (o.hold.r === name ? 'r' : o.hold.l === name ? 'l' : null);
  const k = KINDS[o.kind] || KINDS.lemon, s = o.s || 1, fl = o.flip ? -1 : 1;
  const leg = (o.noLegs || o.center) ? 0 : (k.leg || 90), up = o.center ? 0 : (leg + k.ry * .9);
  const cx = o.x, cy = o.y - (o.lift || 0) - s * up, g = key && o.grip && o.grip[key];
  const side = key === 'l' ? -1 : 1;
  const hx = g ? cx + g[0] * s * fl : cx + side * (k.rx * .9 + 40) * s * fl, hy = g ? cy + g[1] * s : cy + 40 * s;
  return { key, side, hx, hy, s, fl };
}
const FL_LENS = 66;                                                          /* the lens is 66 px beyond the hand along the barrel */
P20.flashlightPose = (o, t) => {
  const h = handOf(o, 'fp20_flashlight'), ang = o.flAng ?? (h.side > 0 ? -.55 : PI + .55), L = FL_LENS * (o.flScale ?? 1) * h.s;
  return { x: h.hx + Math.cos(ang) * L, y: h.hy + Math.sin(ang) * L, ang, hx: h.hx, hy: h.hy };
};
const PL_TIP = 62;
P20.phonePose = (o, t) => {
  const h = handOf(o, 'fp20_phonelight'), ang = o.plAng ?? (h.side > 0 ? -.7 : PI + .7), L = PL_TIP * h.s;
  return { x: h.hx + Math.cos(ang) * L, y: h.hy + Math.sin(ang) * L, ang, hx: h.hx, hy: h.hy };
};

// ------------------------------------------------------------------ fp20_flashlight
const flBox = o => {   /* the rotated barrel's bounding box in the hand's frame */
  const a = o.flAng ?? -.55, S = o.flScale ?? 1, ca = Math.cos(a), sa = Math.sin(a), xs = [], ys = [];
  for (const [x, y] of [[-70, -34], [70, -34], [70, 34], [-70, 34]]) { xs.push((x * ca - y * sa) * S); ys.push((x * sa + y * ca) * S); }
  return Object.assign([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], { nearFace: true });
};
PROP_BOX.fp20_flashlight = flBox;
EXT.prop.fp20_flashlight = (side, o, t) => {
  const on = c01(o.flOn ?? 0), old = c01(o.flOld ?? 0), ang = o.flAng ?? (side > 0 ? -.55 : PI + .55), S = o.flScale ?? 1;
  ctx.save(); ctx.rotate(ang); ctx.scale(S, S); if (Math.cos(ang) < 0) ctx.scale(1, -1);                 /* keep the switch on top when the torch points left */
  ctx.lineJoin = 'round';
  const body = mixc(o.flColor || '#f0b400', '#7a6a48', old * .7), dark = mixc('#2a2630', '#4a4540', old * .5), hi = mixc(body, '#ffffff', .35 - old * .2);
  /* a soft shadow under the barrel */
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ell(2, 22, 66, 7); ctx.fill();
  ctx.fillStyle = dark; rr(-68, -17, 20, 34, 7); ctx.fill(); outline(3);                                  /* the tail cap */
  ctx.fillStyle = lgr(0, -16, 0, 16, [[0, hi], [.45, body], [1, mixc(body, '#000000', .35)]]); rr(-52, -15, 72, 30, 6); ctx.fill(); outline(3);   /* the handle */
  ctx.strokeStyle = 'rgba(20,14,26,.45)'; ctx.lineWidth = 2.2; for (const x of [-42, -32, -22, -12]) { ctx.beginPath(); ctx.moveTo(x, -13); ctx.lineTo(x, 13); ctx.stroke(); }   /* grip rings */
  ctx.fillStyle = dark; rr(-30, -23, 24, 10, 4); ctx.fill(); outline(2.6);                                 /* the switch */
  ctx.fillStyle = mixc('#e0443a', '#6a3a30', old * .6); rr(-24, -22, 12, 4, 2); ctx.fill();
  ctx.fillStyle = dark; rr(18, -20, 12, 40, 4); ctx.fill(); outline(3);                                    /* the collar */
  ctx.fillStyle = lgr(0, -30, 0, 30, [[0, hi], [.45, body], [1, mixc(body, '#000000', .35)]]);              /* the flared head */
  ctx.beginPath(); ctx.moveTo(30, -20); ctx.lineTo(60, -31); ctx.lineTo(60, 31); ctx.lineTo(30, 20); ctx.closePath(); ctx.fill(); outline(3);
  ctx.fillStyle = dark; rr(58, -34, 11, 68, 5); ctx.fill(); outline(3);                                    /* the bezel */
  /* the lens: a dull grey glass off, a hot white-yellow disc on */
  ctx.save(); ctx.beginPath(); ctx.ellipse(66, 0, 6, 26, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = on > .02 ? mixc('#8a8f94', '#fffbe0', on) : '#8a8f94'; ctx.fillRect(56, -30, 20, 60);
  if (on < .98) { ctx.fillStyle = 'rgba(255,255,255,' + (.5 * (1 - on)) + ')'; ctx.fillRect(60, -22, 4, 22); }
  ctx.restore();
  /* age: scratches, a dent, dust, a strip of masking tape */
  if (old > .05) {
    ctx.save(); ctx.globalAlpha *= old;
    ctx.strokeStyle = 'rgba(30,22,10,.55)'; ctx.lineWidth = 1.6; for (const [a, b, c, d] of [[-40, -10, -22, -3], [-10, 6, 8, 12], [36, -12, 50, -4], [38, 8, 52, 14]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
    ctx.fillStyle = 'rgba(30,22,10,.35)'; ell(46, 20, 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(215,205,185,.34)'; for (let i = 0; i < 22; i++) { ell(-62 + hsh(i + 3) * 120, -16 + hsh(i + 9) * 32, 1.8 + hsh(i) * 2.4, 1.4); ctx.fill(); }
    ctx.restore();
  }
  if (o.flTag) {
    ctx.save(); ctx.translate(-16, 1); ctx.rotate(-.1);
    ctx.fillStyle = '#e8dcb4'; rr(-17, -9.5, 34, 19, 2); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,20,.5)'; ctx.lineWidth = 1.4; ctx.stroke();
    lab(o.flTag, 0, 0.5, { size: 13, weight: 900, fill: '#5a3a1a', maxW: 30 });
    ctx.restore();
  }
  if (on > .02) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 70, 0, 64, '#fff2c0', .85 * on, .8); }
  ctx.restore();
};

// ------------------------------------------------------------------ fp20_phonelight: a phone held up like a torch
PROP_BOX.fp20_phonelight = o => { const a = o.plAng ?? -.7, ca = Math.cos(a), sa = Math.sin(a), xs = [], ys = []; for (const [x, y] of [[-48, -30], [64, -30], [64, 30], [-48, 30]]) { xs.push(x * ca - y * sa); ys.push(x * sa + y * ca); } return Object.assign([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], { nearFace: true }); };
EXT.prop.fp20_phonelight = (side, o, t) => {
  const on = c01(o.plOn ?? 0), ang = o.plAng ?? (side > 0 ? -.7 : PI + .7);
  ctx.save(); ctx.rotate(ang); if (Math.cos(ang) < 0) ctx.scale(1, -1); ctx.lineJoin = 'round';
  const cs = o.plColor || '#2b3140';
  ctx.fillStyle = lgr(0, -26, 0, 26, [[0, mixc(cs, '#ffffff', .22)], [1, mixc(cs, '#000000', .3)]]); rr(-46, -26, 108, 52, 12); ctx.fill(); outline(3);                /* the phone seen from its back, long axis along the beam */
  ctx.fillStyle = 'rgba(255,255,255,.1)'; rr(-42, -22, 100, 12, 6); ctx.fill();
  ctx.fillStyle = '#12151c'; rr(32, -19, 24, 38, 7); ctx.fill(); outline(2.4);                                                                                       /* the camera island */
  ctx.fillStyle = '#3a4252'; ell(43, -8, 5.6, 5.6); ctx.fill(); ell(43, 9, 5.6, 5.6); ctx.fill();
  ctx.fillStyle = on > .02 ? mixc('#8a8f94', '#ffffff', on) : '#8a8f94'; ell(52, 0, 4.2, 4.2); ctx.fill();                                                           /* the flash */
  if (on > .02) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 56, 0, 50, '#e8f4ff', .9 * on, .9); }
  ctx.restore();
};

// ------------------------------------------------------------------ P20.ledCandle: a battery candle with a flame-shaped LED
P20.ledCandle = (c, o = {}) => {
  const out = { fx: o.x ?? 0, fy: o.y ?? 0, r: 120 };
  run(c, g => {
    const s = o.s ?? 1, on = c01(o.on ?? 1), t = o.t || 0, seed = o.seed ?? 0, kind = o.kind || 'pillar', x = o.x ?? 0, y = o.y ?? 0;
    const fl = on * (1 + .05 * Math.sin(t * 4.1 + seed * 3.7) + .03 * Math.sin(t * 7.3 + seed * 1.9));   /* 0.65 and 1.2 Hz: slow and soft, never a strobe */
    g.translate(x, y); g.scale(s, s); g.lineJoin = 'round';
    const w = kind === 'tea' ? 56 : 42, h = kind === 'tea' ? 24 : 96, wax = mixc('#f2ead6', '#ffe0a0', .55 * on), shade = mixc('#c8bfa8', '#b88a50', .5 * on);
    g.fillStyle = 'rgba(0,0,0,.22)'; ell(2, 2, w * .62, 6); g.fill();
    if (kind === 'tea') {
      g.fillStyle = lgr(-w / 2, 0, w / 2, 0, [[0, 'rgba(230,236,244,.85)'], [.5, 'rgba(190,200,214,.7)'], [1, 'rgba(120,130,150,.8)']]); rr(-w / 2, -h, w, h, 5); g.fill(); outline(2.6);   /* the clear plastic cup */
      g.fillStyle = lgr(-w / 2, 0, w / 2, 0, [[0, wax], [1, shade]]); rr(-w / 2 + 4, -h + 5, w - 8, h - 8, 3); g.fill();
    } else {
      g.fillStyle = lgr(-w / 2, 0, w / 2, 0, [[0, mixc(wax, '#ffffff', .25)], [.55, wax], [1, shade]]); rr(-w / 2, -h, w, h, 6); g.fill(); outline(3);
      /* the top of the wax glows from within when the LED is on */
      if (on > .02) { g.save(); rr(-w / 2, -h, w, h, 6); g.clip(); g.fillStyle = lgr(0, -h, 0, -h * .35, [[0, 'rgba(255,196,96,' + (.6 * fl) + ')'], [1, 'rgba(255,196,96,0)']]); g.fillRect(-w / 2, -h, w, h * .65); g.restore(); }
      g.strokeStyle = 'rgba(20,14,26,.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w * .22, -h + 12); g.quadraticCurveTo(-w * .26, -h + 34, -w * .16, -h + 42); g.stroke();   /* a drip */
    }
    g.fillStyle = mixc(wax, '#fff6d8', .5); ell(0, -h, w / 2 - 1.5, 6.5); g.fill(); outline(2.4);                                                              /* the rim of the wax */
    /* the flame: a teardrop LED; off it is a dull cream plastic drop */
    const fh = kind === 'tea' ? 22 : 28, sway = Math.sin(t * 2.3 + seed * 2.1) * 1.6 * on, fyb = -h - 1;
    g.save(); g.translate(sway, fyb);
    g.beginPath(); g.moveTo(0, -fh); g.bezierCurveTo(10, -fh * .55, 10, -3, 0, 0); g.bezierCurveTo(-10, -3, -10, -fh * .55, 0, -fh); g.closePath();
    g.fillStyle = on > .02 ? lgr(0, -fh, 0, 0, [[0, mixc('#ffe9a0', '#fffbe8', fl)], [.55, mixc('#ffb94a', '#ffd36b', fl)], [1, mixc('#ff8a2a', '#ffb04a', fl)]]) : '#d8cfb4'; g.fill();
    g.strokeStyle = on > .02 ? 'rgba(255,150,40,.8)' : 'rgba(20,14,26,.6)'; g.lineWidth = 2; g.stroke();
    if (on > .02) { g.fillStyle = 'rgba(255,255,240,' + (.9 * fl) + ')'; g.beginPath(); g.ellipse(0, -fh * .38, 2.8, fh * .26, 0, 0, TAU); g.fill(); }
    g.restore();
    out.fx = x + sway * s; out.fy = y + (fyb - fh * .45) * s; out.r = 120 * s;
    if (o.sticker > 0 && kind !== 'tea') {   /* an APPROVED label pressed onto the body */
      const k = c01(o.sticker), sc = .6 + .4 * Math.min(1, k * 1.4);
      g.save(); g.globalAlpha *= c01(k * 4); g.translate(0, -h * .42); g.rotate(-.05); g.scale(sc, sc);
      g.fillStyle = '#f4f7ee'; rr(-34, -13, 68, 26, 4); g.fill(); g.strokeStyle = '#2f8f4a'; g.lineWidth = 2.4; g.stroke();
      lab('APPROVED', 0, 0.5, { size: 12.5, weight: 900, fill: '#1f7a3a', maxW: 60, spacing: .4 });
      g.restore();
    }
    if (on > .02 && o.glow !== 0) {
      g.globalCompositeOperation = 'lighter';
      glow(g, sway, fyb - fh * .45, 70, '#ffb04a', .55 * fl, .5);
      glow(g, sway, fyb - fh * .45, 190, '#ff9a3a', .16 * fl, 0);
    }
  });
  return out;
};
})();
(() => {
/* ---- block 2: the stopwatch (held), the cot, the Moon in a pane */
const P20 = window.P20, { PI, TAU, OUT, c01, sg, ss, hsh, rgbOf, mixc, lgr, scrOf, run, lab, glow, outline } = P20._;

// ------------------------------------------------------------------ fp20_stopwatch: a chunky round sports stopwatch with a seven-segment LCD (shapes, not text)
const SW = { R: 58, cy: -50, lcdW: 96, lcdH: 44 };
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function segPoly(g, name, x, y, w, h, th) {   /* one segment of a digit whose top-left is (x, y): a flat hexagon bar */
  const hw = th / 2, m = h / 2, p = [];
  const hor = yy => [[x + hw + 1, yy], [x + hw + 2 + hw, yy - hw], [x + w - hw - 2 - hw, yy - hw], [x + w - hw - 1, yy], [x + w - hw - 2 - hw, yy + hw], [x + hw + 2 + hw, yy + hw]];
  const ver = (xx, y0, y1) => [[xx, y0 + hw + 1], [xx + hw, y0 + hw + 2 + hw], [xx + hw, y1 - hw - 2 - hw], [xx, y1 - hw - 1], [xx - hw, y1 - hw - 2 - hw], [xx - hw, y0 + hw + 2 + hw]];
  switch (name) {
    case 'a': p.push(...hor(y)); break; case 'g': p.push(...hor(y + m)); break; case 'd': p.push(...hor(y + h)); break;
    case 'f': p.push(...ver(x, y, y + m)); break; case 'e': p.push(...ver(x, y + m, y + h)); break;
    case 'b': p.push(...ver(x + w, y, y + m)); break; case 'c': p.push(...ver(x + w, y + m, y + h)); break;
  }
  g.beginPath(); p.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill();
}
/* "M:SS.s" for a time in seconds (floored to a tenth) */
const swString = sec => { const v = Math.min(599.9, Math.max(0, sec || 0)), tt = Math.floor(v * 10 + 1e-6), m = Math.floor(tt / 600), s = Math.floor((tt % 600) / 10), d = tt % 10; return m + ':' + (s < 10 ? '0' : '') + s + '.' + d; };
P20.swString = swString;
function lcd(g, str, cx, cy, dw, dh, th, lit, ghost, on) {
  const gap = 4.4, parts = [...str].map(ch => ch === ':' ? 6 : ch === '.' ? 5 : dw);
  const total = parts.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  let x = cx - total / 2; const y = cy - dh / 2;
  [...str].forEach((ch, i) => {
    const w = parts[i];
    if (ch === ':' || ch === '.') {
      g.fillStyle = lit; g.globalAlpha = on;
      if (ch === ':') { g.fillRect(x + 1, y + dh * .3, 4, 4.4); g.fillRect(x + 1, y + dh * .66, 4, 4.4); } else g.fillRect(x + .5, y + dh - 4.4, 4.4, 4.4);
      g.globalAlpha = 1;
    } else {
      g.fillStyle = ghost; for (const sname of 'abcdefg') segPoly(g, sname, x, y, w, dh, th);
      g.fillStyle = lit; g.globalAlpha = on; for (const sname of SEG[ch]) segPoly(g, sname, x, y, w, dh, th); g.globalAlpha = 1;
    }
    x += w + gap;
  });
}
P20.stopwatchPose = (o, t) => {
  const h = (function () { const key = o.hold && (o.hold.r === 'fp20_stopwatch' ? 'r' : o.hold.l === 'fp20_stopwatch' ? 'l' : null); const k = KINDS[o.kind] || KINDS.lemon, s = o.s || 1, fl = o.flip ? -1 : 1, leg = (o.noLegs || o.center) ? 0 : (k.leg || 90), up = o.center ? 0 : (leg + k.ry * .9); const cx = o.x, cy = o.y - (o.lift || 0) - s * up, g = key && o.grip && o.grip[key]; const side = key === 'l' ? -1 : 1; return { hx: g ? cx + g[0] * s * fl : cx + side * (k.rx * .9 + 40) * s * fl, hy: g ? cy + g[1] * s : cy + 40 * s, s }; })();
  const S = o.swScale ?? 1;
  return { x: h.hx, y: h.hy + SW.cy * S * h.s, hx: h.hx, hy: h.hy };
};
PROP_BOX.fp20_stopwatch = o => { const S = o.swScale ?? 1; return Object.assign([-70 * S, (SW.cy - SW.R - 22) * S, 70 * S, 16 * S], { nearFace: true }); };
EXT.prop.fp20_stopwatch = (side, o, t) => {
  const S = o.swScale ?? 1, on = c01(o.swOn ?? 1), R = SW.R, cy = SW.cy, str = swString(o.swTime);
  ctx.save(); ctx.scale(S, S); ctx.rotate(side * -.05); ctx.lineJoin = 'round';
  /* the crown and the side buttons behind the body */
  ctx.fillStyle = '#8c929e'; rr(-10, cy - R - 17, 20, 18, 4); ctx.fill(); outline(2.6);
  ctx.fillStyle = '#d6422f'; rr(-13, cy - R - 24, 26, 10, 4); ctx.fill(); outline(2.6);
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * R * .74, cy - R * .74); ctx.rotate(sd * .78); ctx.fillStyle = '#8c929e'; rr(-6, -13, 12, 12, 3); ctx.fill(); outline(2.4); ctx.restore(); }
  /* the body: charcoal with a bright rim, a bezel ring with 12 ticks */
  ctx.fillStyle = lgr(-R, cy - R, R, cy + R, [[0, '#6c7480'], [.5, '#3c424c'], [1, '#22262d']]); ell(0, cy, R, R); ctx.fill(); outline(3.4);
  ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, cy, R - 3.5, PI * 1.05, PI * 1.62); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(0, cy, R - 9, R - 9); ctx.fill();
  ctx.strokeStyle = 'rgba(210,220,235,.55)'; ctx.lineWidth = 2.2;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = R - 10, r1 = R - (i % 3 ? 14 : 17); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); }
  /* the LCD window */
  const lw = SW.lcdW, lh = SW.lcdH, lc = cy - 4;
  ctx.fillStyle = lgr(0, lc - lh / 2, 0, lc + lh / 2, [[0, mixc('#0b1c20', '#0f4a50', on)], [1, mixc('#08161a', '#0a3a3e', on)]]); rr(-lw / 2, lc - lh / 2, lw, lh, 7); ctx.fill(); outline(2.8, 'rgba(8,12,16,.9)');
  ctx.save(); rr(-lw / 2, lc - lh / 2, lw, lh, 7); ctx.clip();
  lcd(ctx, str, 0, lc, 13, 26, 3.5, '#9dfff0', 'rgba(120,255,235,' + (.07 + .05 * on) + ')', on);
  ctx.fillStyle = 'rgba(255,255,255,' + (.07 * (0.4 + on)) + ')'; ctx.fillRect(-lw / 2, lc - lh / 2, lw, lh * .38);                         /* glass sheen */
  ctx.restore();
  /* two little buttons' legends (dots) under the window */
  ctx.fillStyle = 'rgba(210,220,235,.45)'; ell(-18, cy + 31, 3, 3); ctx.fill(); ell(0, cy + 31, 3, 3); ctx.fill(); ell(18, cy + 31, 3, 3); ctx.fill();
  if (on > .02) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, lc, 150, '#4ff5d6', .5 * on, .6); glow(ctx, 0, lc, 64, '#b8fff4', .35 * on, .5); }
  ctx.restore();
};

// ------------------------------------------------------------------ P20.cot: a folding camp cot, a grey blanket, a pillow, an optional sleeper
const SLEEP = { mango: () => window.A7 && A7.mango, lemon: () => window.A7 && A7.lemon, tom: () => window.A15 && A15.tomato, tomato: () => window.A15 && A15.tomato, onion: () => window.A15 && A15.onion };
const SLEEP_WHO = { mango: 'mango', lemon: 'lemon', tom: 'tom', tomato: 'tom', onion: 'onion' };
P20.cot = (c, o = {}) => {
  const out = { x0: 0, y0: 0, x1: 0, y1: 0, head: [0, 0] };
  run(c, g => {
    const s = o.s ?? 1, t = o.t || 0, x = o.x ?? 0, y = o.y ?? 0, sl = o.sleeper || null;
    g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
    out.x0 = x - 205 * s; out.x1 = x + 205 * s; out.y0 = y - 250 * s; out.y1 = y + 8 * s; out.head = [x - 112 * s, y - 138 * s];
    g.fillStyle = 'rgba(0,0,0,.24)'; ell(0, 4, 215, 11); g.fill();
    /* the legs: two X frames of steel tube */
    const leg = (cx0, back) => {
      g.strokeStyle = back ? '#3c424c' : '#59616e'; g.lineWidth = 9; g.beginPath(); g.moveTo(cx0 - 30, -8); g.lineTo(cx0 + 30, -68); g.moveTo(cx0 + 30, -8); g.lineTo(cx0 - 30, -68); g.stroke();
      g.strokeStyle = back ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.28)'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx0 - 31, -12); g.lineTo(cx0 + 29, -70); g.stroke();
      g.fillStyle = '#23272e'; rr(cx0 - 38, -10, 16, 8, 3); g.fill(); rr(cx0 + 22, -10, 16, 8, 3); g.fill();
    };
    leg(-142, true); leg(146, true);
    /* the rails and the canvas, sagging a little in the middle */
    g.strokeStyle = '#59616e'; g.lineWidth = 9; g.beginPath(); g.moveTo(-198, -80); g.lineTo(198, -80); g.stroke();
    g.fillStyle = lgr(0, -88, 0, -56, [[0, '#a6a074'], [1, '#6f6a48']]);
    g.beginPath(); g.moveTo(-200, -84); g.quadraticCurveTo(0, -48, 200, -84); g.lineTo(200, -72); g.quadraticCurveTo(0, -34, -200, -72); g.closePath(); g.fill(); outline(2.8);
    g.strokeStyle = 'rgba(40,36,20,.4)'; g.lineWidth = 1.6; g.setLineDash([7, 6]); g.beginPath(); g.moveTo(-190, -78); g.quadraticCurveTo(0, -43, 190, -78); g.stroke(); g.setLineDash([]);
    leg(-142, false); leg(146, false);
    /* the pillow */
    g.fillStyle = lgr(0, -128, 0, -86, [[0, '#f2f4f8'], [1, '#c4cad6']]); g.beginPath(); g.moveTo(-196, -90); g.quadraticCurveTo(-200, -128, -150, -128); g.quadraticCurveTo(-96, -130, -92, -90); g.quadraticCurveTo(-140, -76, -196, -90); g.closePath(); g.fill(); outline(2.8);
    g.strokeStyle = 'rgba(100,110,130,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-182, -104); g.quadraticCurveTo(-148, -112, -110, -104); g.stroke();
    /* the sleeper: lying on the cot with the head on the pillow (rotated a quarter turn), eyes shut, under the blanket */
    if (sl && SLEEP[sl] && SLEEP[sl]()) {
      const ctor = SLEEP[sl](), ch = ctor({ t, who: undefined });
      Object.assign(ch, { x: -112, y: -138, s: .62, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, noBob: true, rot: -PI / 2, expr: sl === 'onion' ? 'onion_stoic' : 'chill', lid: .97, who: undefined, t, look: [0, 0] });
      if (sl === 'onion') ch.cry = 0;
      g.save(); drawChar(ch); g.restore();
    }
    /* the blanket: a long mound over the body, folded at the top edge, with plaid stripes */
    const mound = sl ? 56 : 22;
    g.fillStyle = lgr(0, -96 - mound, 0, -70, [[0, '#9aa0ac'], [1, '#6c7280']]);
    g.beginPath(); g.moveTo(-58, -76); g.quadraticCurveTo(-52, -96 - mound, 6, -98 - mound * .95); g.quadraticCurveTo(100, -102 - mound * .8, 188, -96 - mound * .35); g.quadraticCurveTo(204, -88, 200, -74); g.quadraticCurveTo(70, -58, -58, -76); g.closePath(); g.fill(); outline(3);
    g.save(); g.clip(); g.strokeStyle = 'rgba(40,46,60,.32)'; g.lineWidth = 7; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-30 + i * 42, -150); g.lineTo(-10 + i * 42, -40); g.stroke(); } g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-8 + i * 42, -150); g.lineTo(12 + i * 42, -40); g.stroke(); } g.restore();
    g.fillStyle = 'rgba(255,255,255,.24)'; g.beginPath(); g.moveTo(-54, -80); g.quadraticCurveTo(-48, -96 - mound, 6, -98 - mound * .95); g.lineTo(8, -88 - mound * .9); g.quadraticCurveTo(-36, -88 - mound * .7, -44, -78); g.closePath(); g.fill();   /* the folded-over edge */
    /* the zzz drifting up and out of the sleeper's head */
    if (o.zzz && sl) {
      for (let i = 0; i < 3; i++) {
        const ph = ((t * .45 + i / 3) % 1), a = Math.sin(PI * ph);
        g.save(); g.globalAlpha *= a * .95; lab('Z', -92 + ph * 40 + i * 10, -196 - ph * 64, { size: 34 + i * 10, font: 'Bangers', weight: 400, fill: '#dfe9ff', stroke: '#1a2440', lw: 5 });
        g.restore();
      }
    }
  });
  return out;
};

// ------------------------------------------------------------------ P20.moon: the series' Moon in a window pane with sky, stars and cloud
/* o = { x, y (the pane's centre), w, h (the pane, default 5.2 r by 6.6 r), r (the Moon's radius), t, cloud 0..1 (1 = only a glow behind the weather), rise -1..1 (-1 low left, 0 high, 1 low right), expr, rad (corner radius),
 *       frame (true: a plain white frame and cross bar), warm 0..1, sky (false: leave the pane transparent, only the Moon and the cloud) }. Returns { x0, y0, x1, y1, mx, my } (the Moon's centre). */
P20.moon = (c, o = {}) => {
  const res = { x0: 0, y0: 0, x1: 0, y1: 0, mx: 0, my: 0 };
  run(c, g => {
    const r = o.r ?? 120, w = o.w ?? r * 5.2, h = o.h ?? r * 6.6, x = o.x ?? 0, y = o.y ?? 0, t = o.t || 0, cloud = c01(o.cloud ?? 0), rise = Math.max(-1, Math.min(1, o.rise ?? 0)), rad = o.rad ?? 10;
    const x0 = x - w / 2, y0 = y - h / 2, mq = rise * rise;
    const mx = x + rise * w * .3, my = y0 + h * (.74 - .5 * (1 - mq));
    Object.assign(res, { x0, y0, x1: x0 + w, y1: y0 + h, mx, my });
    g.save(); rr(x0, y0, w, h, rad); g.clip();
    if (o.sky !== false) {
      g.fillStyle = lgr(0, y0, 0, y0 + h, [[0, mixc('#060d26', '#1a2338', cloud * .5)], [.6, mixc('#13264a', '#2a3550', cloud * .5)], [1, mixc('#2a4472', '#4a5a78', cloud * .5)]]); g.fillRect(x0, y0, w, h);
      /* stars: fewer behind the weather */
      for (let i = 0; i < 34; i++) {
        const sx = x0 + hsh(i + 1) * w, sy = y0 + hsh(i + 50) * h * .72, tw = .55 + .45 * Math.sin(t * (.7 + hsh(i + 9) * 1.3) + i * 2.1), a = (1 - cloud) * tw * (.35 + .65 * hsh(i + 20));
        if (a < .03 || Math.hypot(sx - mx, sy - my) < r * 1.5) continue;
        g.fillStyle = 'rgba(235,242,255,' + a + ')'; ell(sx, sy, 1.5 + hsh(i + 33) * 1.4, 1.5 + hsh(i + 33) * 1.4); g.fill();
      }
    }
    /* the Moon himself, fainter behind the weather */
    if (window.A7 && A7.moon) A7.moon(mx, my, r / 150, { t, alpha: 1 - .86 * cloud, haloA: 1 - cloud * .4, warm: o.warm || 0, char: { expr: o.expr || 'neutral' } });
    /* the weather: two drifting cloud banks in front, a glow where he is */
    if (cloud > .01) {
      for (let layer = 0; layer < 2; layer++) {
        const n = 7, drift = t * (7 + layer * 5), span = w + r * 3;
        for (let i = 0; i < n; i++) {
          const cxp = x0 - r * 1.5 + (((i / n) * span + drift * (layer ? 1.4 : 1) + layer * 130) % span), cyp = my + (layer ? .55 : -.25) * r + (hsh(i + 7 * layer) - .5) * r * 1.5, rr0 = r * (.85 + hsh(i + 3 + layer) * .7);
          const a = cloud * (layer ? .62 : .5);
          g.fillStyle = V2.radial(cxp, cyp, rr0 * .1, rr0, [[0, 'rgba(' + (layer ? '58,72,104' : '96,112,148') + ',' + a + ')'], [1, 'rgba(58,72,104,0)']]);
          g.fillRect(cxp - rr0, cyp - rr0, rr0 * 2, rr0 * 2);
        }
      }
      g.globalCompositeOperation = 'screen'; g.fillStyle = V2.radial(mx, my, r * .2, r * 2.4, [[0, 'rgba(190,210,255,' + (.42 * cloud) + ')'], [1, 'rgba(190,210,255,0)']]); g.fillRect(mx - r * 2.4, my - r * 2.4, r * 4.8, r * 4.8);
    }
    g.restore();
    if (o.frame) {
      g.strokeStyle = '#d9dde4'; g.lineWidth = 12; g.lineJoin = 'round'; rr(x0, y0, w, h, rad); g.stroke();
      g.lineWidth = 8; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + h); g.moveTo(x0, y0 + h * .46); g.lineTo(x0 + w, y0 + h * .46); g.stroke();
      g.strokeStyle = 'rgba(20,14,26,.5)'; g.lineWidth = 3; rr(x0 - 6, y0 - 6, w + 12, h + 12, rad + 4); g.stroke();
    }
  });
  return res;
};
})();
(() => {
/* ---- block 3: the outlet, the coffee maker, the exit sign, the emergency lamp */
const P20 = window.P20, { PI, TAU, OUT, c01, sg, ss, hsh, rgbOf, mixc, lgr, scrOf, run, lab, glow, outline } = P20._;

/* a small label plate: the plate is registered as a container so the label is checked as centred in it (hero when it comes out at 31 px or more on the screen) */
let LABN = 0;
function plate(g, str, cx, cy, w, h, o) {
  const id = 'p20plate' + (o.id || '');
  g.fillStyle = o.fill || '#fff'; rr(cx - w / 2, cy - h / 2, w, h, o.r ?? 4); g.fill(); outline(o.lw ?? 2.2, o.stroke || OUT);
  if (typeof UI !== 'undefined') {
    const hero = o.hero !== undefined ? !!o.hero : (o.size || 20) * scrOf(g) >= 31;
    UI.container(id, 'sign', [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], 3);
    UI.label(str, cx, cy, { size: o.size || 20, weight: 900, fill: o.ink || '#b3141c', spacing: o.spacing ?? .6, maxW: w - 10, hero, crop: !hero, cid: id, center: true });
  }
}

// ------------------------------------------------------------------ P20.outlet: a wall plate with two sockets, an optional plug and cord, an optional RED = EMERGENCY label
/* o = { x, y (the centre of the plate), s, color 'white' | 'red', plug null | 'coffee' | 'oxygen' | 'phone' (plugged into the lower socket), label (a string under the plate: 'RED = EMERGENCY' for the red one; false = none; default
 *       the RED = EMERGENCY label for color 'red', none for white), cordTo [x, y] (where the cord goes, current coordinates: it sags to there; default a short stub hanging down), t, hero }.
 * Returns { x0, y0, x1, y1 (the plate), plugAt: [x, y] (the plug's body), cordEnd }. Natural plate 112 x 176. */
P20.outlet = (c, o = {}) => {
  const res = { x0: 0, y0: 0, x1: 0, y1: 0, plugAt: null, cordEnd: null };
  run(c, g => {
    const s = o.s ?? 1, x = o.x ?? 0, y = o.y ?? 0, red = o.color === 'red', pw = 112, ph = 176;
    g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
    Object.assign(res, { x0: x - pw / 2 * s, y0: y - ph / 2 * s, x1: x + pw / 2 * s, y1: y + ph / 2 * s });
    const body = red ? '#d3262e' : '#f2f3ee', rim = red ? '#8a1219' : '#b9bcb4', hi = red ? '#f06a6e' : '#ffffff';
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(-pw / 2 + 4, -ph / 2 + 6, pw, ph, 14); g.fill();                                  /* a soft shadow on the wall */
    g.fillStyle = lgr(-pw / 2, -ph / 2, pw / 2, ph / 2, [[0, hi], [.3, body], [1, mixc(body, '#000000', .22)]]); rr(-pw / 2, -ph / 2, pw, ph, 14); g.fill(); outline(3.4);
    g.strokeStyle = rim; g.lineWidth = 3; rr(-pw / 2 + 7, -ph / 2 + 7, pw - 14, ph - 14, 9); g.stroke();
    const sock = (cy, hidden) => {
      g.fillStyle = mixc(body, '#000000', .3); rr(-34, cy - 30, 68, 60, 20); g.fill(); outline(2.4);
      if (hidden) return;
      g.fillStyle = '#16161c'; rr(-17, cy - 14, 6, 20, 2); g.fill(); rr(11, cy - 14, 6, 20, 2); g.fill();                  /* the two slots and the ground */
      g.beginPath(); g.arc(0, cy + 14, 5.4, PI, 0); g.lineTo(5.4, cy + 19); g.lineTo(-5.4, cy + 19); g.closePath(); g.fill();
    };
    const plugged = o.plug === 'coffee' || o.plug === 'oxygen' || o.plug === 'phone';
    sock(-40, false); sock(40, plugged);
    g.fillStyle = mixc(body, '#000000', .35); ell(0, 0, 3.4, 3.4); g.fill();                                              /* the centre screw */
    if (red) { g.fillStyle = 'rgba(255,255,255,.22)'; rr(-pw / 2 + 12, -ph / 2 + 12, pw - 24, 8, 4); g.fill(); }
    /* the plug and its cord */
    if (plugged) {
      const kind = o.plug, py = 40, pc = kind === 'coffee' ? '#26262c' : kind === 'oxygen' ? '#d9ddd5' : '#f6f7f4', cord = kind === 'coffee' ? '#1c1c22' : kind === 'oxygen' ? '#aab3a8' : '#f2f2ee';
      const tx = o.cordTo ? (o.cordTo[0] - x) / s : 0, ty = o.cordTo ? (o.cordTo[1] - y) / s : py + 120;
      g.strokeStyle = OUT; g.lineWidth = kind === 'oxygen' ? 11.5 : 9.5; g.beginPath(); g.moveTo(0, py + 20); g.bezierCurveTo(0, py + 20 + Math.max(60, (ty - py) * .55), tx, ty - Math.max(30, (ty - py) * .3), tx, ty); g.stroke();
      g.strokeStyle = cord; g.lineWidth = kind === 'oxygen' ? 8 : 6; g.beginPath(); g.moveTo(0, py + 20); g.bezierCurveTo(0, py + 20 + Math.max(60, (ty - py) * .55), tx, ty - Math.max(30, (ty - py) * .3), tx, ty); g.stroke();
      g.fillStyle = pc; rr(-24, py - 22, 48, 50, 10); g.fill(); outline(3);                                              /* the plug body, covering the socket */
      g.fillStyle = 'rgba(255,255,255,.28)'; rr(-19, py - 18, 10, 38, 5); g.fill();
      if (kind === 'oxygen') { g.fillStyle = '#2faa4e'; ell(0, py + 4, 6, 6); g.fill(); outline(1.8); }                  /* the green dot of a hospital-grade plug */
      res.plugAt = [x + 0, y + py * s]; res.cordEnd = [x + tx * s, y + ty * s];
    }
    /* the label under the plate */
    const lbl = o.label === undefined ? (red ? 'RED = EMERGENCY' : false) : o.label;
    if (lbl) plate(g, lbl, 0, ph / 2 + 24, red ? 244 : 160, 36, { size: red ? 21 : 18, fill: red ? '#fff7f2' : '#ffffff', ink: '#b3141c', hero: o.hero });
  });
  return res;
};

// ------------------------------------------------------------------ P20.coffeeMaker: a drip coffee maker with a glass pot and a clock display
/* o = { x, y (bottom centre), s, power 0/1 (the warming plate glows, the LED is on), display '12:00' | '--:--' | '' , pot 0..1 (coffee in the glass pot), sad 0..1 (the little status LED dies, the display fades), t, hero }.
 * Returns { x0, y0, x1, y1, cordAt: [x, y] (where the cord leaves the back, for P20.outlet's cordTo), led: [x, y], display: [x0, y0, x1, y1] }. Natural size 210 x 276. */
P20.coffeeMaker = (c, o = {}) => {
  const res = { x0: 0, y0: 0, x1: 0, y1: 0, cordAt: [0, 0], led: [0, 0], display: [0, 0, 0, 0] };
  run(c, g => {
    const s = o.s ?? 1, x = o.x ?? 0, y = o.y ?? 0, t = o.t || 0, pw = o.power ? 1 : 0, sad = c01(o.sad ?? 0), pot = c01(o.pot ?? .7), disp = o.display === undefined ? '12:00' : o.display;
    g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
    Object.assign(res, { x0: x - 105 * s, y0: y - 276 * s, x1: x + 105 * s, y1: y });
    g.fillStyle = 'rgba(0,0,0,.26)'; ell(0, 3, 112, 9); g.fill();
    /* the back column with the water tank */
    g.fillStyle = lgr(-105, 0, 105, 0, [[0, '#4a4f5a'], [1, '#2a2e36']]); rr(34, -270, 70, 258, 10); g.fill(); outline(3.4);
    g.fillStyle = 'rgba(150,200,235,.34)'; rr(46, -250, 46, 196, 8); g.fill(); outline(2, 'rgba(10,14,20,.7)');
    g.fillStyle = 'rgba(95,160,215,.55)'; rr(46, -250 + 196 * (1 - .56), 46, 196 * .56, 6); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.6; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(78, -240 + i * 30); g.lineTo(91, -240 + i * 30); g.stroke(); }
    /* the base and the warming plate */
    g.fillStyle = lgr(0, -26, 0, 0, [[0, '#454a55'], [1, '#22262d']]); rr(-102, -26, 204, 26, 8); g.fill(); outline(3.4);
    g.fillStyle = pw ? '#7a2a1c' : '#3a3e48'; rr(-84, -30, 120, 9, 4); g.fill(); outline(2);
    if (pw) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, -24, -28, 54, '#ff7a3a', .3, 0); g.restore(); }
    /* the head: the housing over the pot, the filter basket under it */
    g.fillStyle = lgr(0, -270, 0, -196, [[0, '#59606e'], [1, '#2c3039']]); g.beginPath(); g.moveTo(-96, -196); g.lineTo(-96, -246); g.quadraticCurveTo(-96, -270, -72, -270); g.lineTo(104, -270); g.lineTo(104, -196); g.closePath(); g.fill(); outline(3.4);
    g.fillStyle = '#16181e'; g.beginPath(); g.moveTo(-82, -196); g.lineTo(-18, -196); g.lineTo(-30, -172); g.lineTo(-70, -172); g.closePath(); g.fill(); outline(2.6);
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-86, -246); g.quadraticCurveTo(-86, -262, -70, -262); g.lineTo(-30, -262); g.stroke();
    /* the display: a small dark window with the clock; it fades with the power */
    const dx0 = -76, dy0 = -250, dw = 92, dh = 34, dimm = pw ? 1 - .35 * sad : 0;
    g.fillStyle = '#0a1210'; rr(dx0, dy0, dw, dh, 6); g.fill(); outline(2.2, 'rgba(0,0,0,.8)');
    res.display = [x + dx0 * s, y + dy0 * s, x + (dx0 + dw) * s, y + (dy0 + dh) * s];
    if (disp && typeof UI !== 'undefined') {
      const hero = o.hero !== undefined ? !!o.hero : 30 * scrOf(g) >= 31, lit = pw ? mixc('#7cf0a0', '#2c6a40', sad) : '#2c4a3a';
      UI.container('p20disp', 'panel', [dx0, dy0, dx0 + dw, dy0 + dh].map((v, i) => v), 2);
      UI.label(disp, dx0 + dw / 2, dy0 + dh / 2, { size: 30, font: 'Bangers', weight: 400, fill: lit, spacing: 3, maxW: dw - 12, alpha: pw ? .55 + .45 * dimm : .5, hero, crop: !hero, cid: 'p20disp', center: true });
    }
    if (pw && disp) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, dx0 + dw / 2, dy0 + dh / 2, 56, '#58ff90', .22 * dimm, 0); g.restore(); }
    /* the status LED (it dies when sad = 1) and the button */
    const ledOn = pw * (1 - sad), lx = 34, ly = -230;
    g.fillStyle = ledOn > .02 ? mixc('#6a2020', '#ff5a3a', ledOn) : '#3a2a2a'; ell(lx, ly, 6.4, 6.4); g.fill(); outline(2);
    if (ledOn > .02) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lx, ly, 34, '#ff4a2a', .55 * ledOn, .3); g.restore(); }
    res.led = [x + lx * s, y + ly * s];
    g.fillStyle = '#d6d9df'; rr(50, -240, 30, 18, 5); g.fill(); outline(2.2); g.strokeStyle = 'rgba(40,44,52,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(65, -236); g.lineTo(65, -226); g.stroke();
    /* the glass pot: a rounded carafe with a handle, coffee inside, a black lid */
    g.save(); g.translate(-24, 0);
    g.strokeStyle = OUT; g.lineWidth = 9; g.beginPath(); g.moveTo(-50, -118); g.quadraticCurveTo(-82, -118, -82, -84); g.quadraticCurveTo(-82, -52, -52, -52); g.stroke();           /* the handle */
    g.strokeStyle = '#2a2d36'; g.lineWidth = 5.4; g.stroke();
    const body = () => { g.beginPath(); g.moveTo(-52, -150); g.lineTo(52, -150); g.quadraticCurveTo(62, -150, 60, -138); g.lineTo(56, -48); g.quadraticCurveTo(54, -32, 38, -32); g.lineTo(-38, -32); g.quadraticCurveTo(-54, -32, -56, -48); g.lineTo(-60, -138); g.quadraticCurveTo(-62, -150, -52, -150); g.closePath(); };
    body(); g.fillStyle = 'rgba(205,228,240,.3)'; g.fill();
    g.save(); body(); g.clip();
    const top = -138 + (1 - pot) * 100;
    if (pot > .02) { g.fillStyle = lgr(0, top, 0, -32, [[0, '#6a3a1c'], [1, '#2a1408']]); g.fillRect(-64, top, 128, 110); g.fillStyle = 'rgba(190,130,70,.5)'; ell(0, top, 56, 5); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-48, -140, 10, 96);
    g.restore();
    body(); outline(3.2);
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.8; for (const yy of [-110, -90, -70]) { g.beginPath(); g.moveTo(46, yy); g.lineTo(55, yy); g.stroke(); }
    g.fillStyle = '#1a1c22'; rr(-44, -160, 88, 14, 5); g.fill(); outline(2.6); ell(0, -164, 10, 7); g.fill(); outline(2.2);
    g.restore();
    res.cordAt = [x + 100 * s, y - 20 * s];
    g.strokeStyle = OUT; g.lineWidth = 8; g.beginPath(); g.moveTo(104, -16); g.quadraticCurveTo(116, -16, 118, -4); g.stroke();       /* the stub of the cord leaving the back */
    g.strokeStyle = '#1c1c22'; g.lineWidth = 5; g.stroke();
    if (pw && pot > .05) { for (let i = 0; i < 3; i++) { const ph = ((t * .5 + i / 3) % 1); g.save(); g.globalAlpha *= Math.sin(PI * ph) * .32; g.strokeStyle = '#e8f0f8'; g.lineWidth = 5; g.beginPath(); g.moveTo(-40 + i * 16, -168 - ph * 50); g.quadraticCurveTo(-34 + i * 16, -184 - ph * 50, -42 + i * 16, -198 - ph * 50); g.stroke(); g.restore(); } }
  });
  return res;
};

// ------------------------------------------------------------------ P20.exitSign: a green running-man exit sign (a pictogram: no lettering) with a soft glow
/* o = { x, y (centre), s, glow 0..1 (0 = the dull unlit plate), t (a faint hum: the glow breathes 2 percent), w, h (default 168 x 72), halo (0..1, default 1) }. Returns { x0, y0, x1, y1 }. */
P20.exitSign = (c, o = {}) => {
  const res = { x0: 0, y0: 0, x1: 0, y1: 0 };
  run(c, g => {
    const s = o.s ?? 1, x = o.x ?? 0, y = o.y ?? 0, w = o.w ?? 168, h = o.h ?? 72, t = o.t || 0, br = c01(o.glow ?? 1) * (1 + .02 * Math.sin(t * 6.1)), halo = o.halo ?? 1;
    Object.assign(res, { x0: x - w / 2 * s, y0: y - h / 2 * s, x1: x + w / 2 * s, y1: y + h / 2 * s });
    if (br > .02 && halo > 0) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, 210 * s, '#38ff7a', .34 * br * halo, 0); glow(g, x, y, 84 * s, '#7dffb0', .3 * br * halo, .3); g.restore(); }
    g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = '#1a1d22'; rr(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 10); g.fill(); outline(2.6);                                          /* the housing */
    const face = mixc('#0f3a22', '#17c060', br), edge = mixc('#0a2a18', '#8affb8', br);
    g.fillStyle = lgr(0, -h / 2, 0, h / 2, [[0, mixc(face, '#ffffff', .12 * br)], [1, face]]); rr(-w / 2, -h / 2, w, h, 7); g.fill();
    g.strokeStyle = edge; g.lineWidth = 2.4; rr(-w / 2 + 3.5, -h / 2 + 3.5, w - 7, h - 7, 5); g.stroke();
    /* the pictogram: an arrow, a running figure, a doorway */
    const ink = mixc('#1c5a38', '#ffffff', .25 + .75 * br);
    g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 5.2;
    const fx0 = -2, fy0 = 2;
    g.beginPath(); g.arc(fx0 + 3, fy0 - 22, 6.4, 0, TAU); g.fill();                                                                           /* the head */
    g.beginPath(); g.moveTo(fx0 + 1, fy0 - 13); g.lineTo(fx0 - 5, fy0 + 4); g.stroke();                                                       /* the leaning torso */
    g.beginPath(); g.moveTo(fx0 + 1, fy0 - 12); g.lineTo(fx0 + 15, fy0 - 5); g.lineTo(fx0 + 22, fy0 - 14); g.moveTo(fx0 + 1, fy0 - 11); g.lineTo(fx0 - 10, fy0 - 3); g.lineTo(fx0 - 17, fy0 - 10); g.stroke();   /* the arms */
    g.beginPath(); g.moveTo(fx0 - 5, fy0 + 4); g.lineTo(fx0 + 8, fy0 + 12); g.lineTo(fx0 + 1, fy0 + 25); g.moveTo(fx0 - 5, fy0 + 4); g.lineTo(fx0 - 15, fy0 + 14); g.lineTo(fx0 - 28, fy0 + 12); g.stroke();   /* the legs */
    g.lineWidth = 4.4; g.beginPath(); g.moveTo(w / 2 - 50, h / 2 - 14); g.lineTo(w / 2 - 50, -h / 2 + 14); g.lineTo(w / 2 - 17, -h / 2 + 14); g.lineTo(w / 2 - 17, h / 2 - 14); g.stroke();   /* the doorway frame */
    g.lineWidth = 4.4; g.beginPath(); g.moveTo(-w / 2 + 48, 0); g.lineTo(-w / 2 + 18, 0); g.moveTo(-w / 2 + 28, -10); g.lineTo(-w / 2 + 18, 0); g.lineTo(-w / 2 + 28, 10); g.stroke();   /* the arrow */
  });
  return res;
};

// ------------------------------------------------------------------ P20.emergencyLamp: a twin-head battery emergency light on a wall
/* o = { x, y (centre), s, on 0..1 (the two heads light), color (default '#ffe2a8'), t }. The scene adds the L20 cones. Returns { x0, y0, x1, y1, heads: [{ x, y, ang }, { x, y, ang }] } (the head centres and their aim: down and outward, same convention as FX18.cone). Natural 176 x 78. */
P20.emergencyLamp = (c, o = {}) => {
  const res = { x0: 0, y0: 0, x1: 0, y1: 0, heads: [] };
  run(c, g => {
    const s = o.s ?? 1, x = o.x ?? 0, y = o.y ?? 0, on = c01(o.on ?? 0), col = o.color || '#ffe2a8', t = o.t || 0;
    Object.assign(res, { x0: x - 88 * s, y0: y - 39 * s, x1: x + 88 * s, y1: y + 39 * s });
    const hd = [[-74, -8], [74, -8]]; const aims = [PI / 2 + .55, PI / 2 - .55];
    res.heads = hd.map(([hx, hy], i) => ({ x: x + hx * s, y: y + hy * s, ang: aims[i] }));
    g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = 'rgba(0,0,0,.22)'; rr(-80, -26, 168, 62, 12); g.fill();
    g.fillStyle = lgr(0, -34, 0, 34, [[0, '#f4f2ea'], [1, '#c9c6b8']]); rr(-84, -34, 168, 64, 12); g.fill(); outline(3.2);                          /* the housing */
    g.fillStyle = '#2a2d34'; rr(-26, -14, 52, 30, 6); g.fill(); outline(2.4);                                                                    /* the charge panel */
    const led = on > .02 ? '#ff6a3a' : '#3aa85a';                                                                                             /* green = charged and waiting, red-orange = lamps on */
    g.fillStyle = led; ell(-10, 1, 4.4, 4.4); g.fill(); g.fillStyle = on > .02 ? '#ffd23a' : '#274a30'; ell(8, 1, 4.4, 4.4); g.fill();
    if (on <= .02) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, -10, 1, 20, '#3aff7a', .35, 0); g.restore(); }
    for (let i = 0; i < 2; i++) {
      const [hx, hy] = hd[i], sd = i ? 1 : -1, a = aims[i] - PI / 2;                                                                            /* each head: a stalk and a round pod turned toward the room */
      g.strokeStyle = OUT; g.lineWidth = 9; g.beginPath(); g.moveTo(sd * 52, -14); g.lineTo(hx, hy + 4); g.stroke();
      g.strokeStyle = '#8f949c'; g.lineWidth = 5; g.stroke();
      g.save(); g.translate(hx, hy + 6); g.rotate(a);
      g.fillStyle = lgr(-26, -26, 26, 26, [[0, '#eceff3'], [1, '#8a909a']]); ell(0, 0, 26, 24); g.fill(); outline(3);
      g.fillStyle = on > .02 ? mixc('#8a8f94', col, on) : '#5a5f68'; ell(0, 4, 17, 14); g.fill(); outline(2);
      if (on <= .02) { g.fillStyle = 'rgba(255,255,255,.35)'; ell(-6, -1, 5, 3); g.fill(); }
      g.restore();
    }
    for (let i = 0; i < 2; i++) if (on > .02) { const [hx, hy] = hd[i]; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, hx + (i ? 10 : -10), hy + 14, 66, col, .65 * on, .6); g.restore(); }
  });
  return res;
};
})();
