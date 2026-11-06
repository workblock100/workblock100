'use strict';
/* SHIFT HAPPENS, Episode 18: The Fire Drill. Shared props: window.P18 (owner: ALARM). Loaded before the scene files (sync_index_n.py puts ep18_props.js in the kit group).
 *
 * Signature convention: P18.name(ctx, o). o.x, o.y = anchor (a floor prop: bottom centre; a wall prop: centre), o.s = scale (1 = natural size at zoom 1; a person is about 400 tall at s 1),
 * plus the named state fields below. Every prop is a PURE function of its fields (no Math.random, no clock; o.t = scene-local seconds drives flicker and blink only). The prop draws in the
 * transform that is in force (the scene camera); it saves and restores the context. Text goes through the UI kit and is SET DRESSING (hero:false, crop:true) unless you pass o.hero = true
 * (then the gate holds it to 30 px on screen, 40 px from the edge and uncovered: use it in an insert where the prop is the subject). Light uses FX18 when it is there (lamp, glow) and a stand-in when not.
 *
 *  P18.fireDoor(ctx, o)      x, y = bottom centre of the DOORWAY. Frontal elevation of a steel fire door in its frame, hinged on the left (o.hinge = 1) or the right (-1) edge; the door swings TOWARD the viewer.
 *                            close 0..1 (0 = open, swung back against the wall: a thin slab beside the frame, the magnetic holder on the wall catching it; 1 = shut, flush in the frame, wire-glass window,
 *                            KEEP CLOSED sign); prop null | 'cart' | 'chair' | 'wedge' (what holds it open); glow 0..1 = the holder's LED (green; o.led = 'green' | 'red' | 'off'); beyond = what shows through the opening:
 *                            'dark' (default) | 'light' | a colour | false (nothing) | fn(ctx, rect) ; w, h = doorway size (default 320 x 520); window = false hides the wire glass; hero.
 *                            Returns { x0, y0, x1, y1 (the doorway rect in current coordinates), free: { x, top, bottom } (the leaf's free edge), holder: { x, y }, glass: { x, y } (window centre) }.
 *  P18.exitSign(ctx, o)      x, y = centre. A glowing green EXIT sign (running figure + EXIT, arrow optional). glow 0..1 (default 1), flicker 0..1 (needs t), runner 'man' (default) | 'strawberry' (the title card),
 *                            arrow null | 'l' | 'r' | 'd' | 'u', w, h (default 300 x 130), halo 0..1 (default 1), hero. Returns the rect { x0, y0, x1, y1 }.
 *  P18.pullStation(ctx, o)   x, y = centre. Red pebbled metal box, white FIRE, a lever PULL DOWN. pulled 0..1 (the lever drops 0..36 and locks), hero. Size 200 x 270. Returns { x0, y0, x1, y1, lever: { x, y, w, h } }.
 *  P18.hornStrobe(ctx, o)    x, y = centre. Wall horn + strobe: red housing, FIRE, a horn grille, a clear strobe lens. level 0..1 (pass FX18.strobe(k); 0 = the dead white-grey lens), mount 'wall' (default, 140 x 170) |
 *                            'ceiling' (a round disc seen from below, diameter 150), hero. Returns { lens: { x, y, r }, rect }.
 *  P18.panel(ctx, o)         x, y = centre. The fire alarm control panel, 440 x 580: grey metal box, a two-line LCD, a green / amber / red LED column, buttons ACK SILENCE RESET DRILL. state 'normal' | 'drill' | 'alarm' |
 *                            'snoozed' | 'trouble' (sets the default LCD text and LEDs); lcd [line1, line2] overrides the text; leds { power, alarm, supv, trouble, silenced } 0..1 override; blink 0..1 multiplies the ALARM LED
 *                            (pass FX18.hornOn(k)); press 'silence' | { id, k } (a button sinks); heroLcd = the LCD text is hero (the insert), hero = every string is. Returns { lcd: { x0, y0, x1, y1 }, buttons: { ack, silence, reset, drill }: rects }.
 *  Added by the other builders: P18.extinguisher / P18.extinguisherNozzle (ep18_marshal.js), P18.evacMap / P18.drillLog / P18.smokeDetector (ep18_station.js). Always write window.P18 = window.P18 || {} first.
 */
(() => {
window.P18 = window.P18 || {};
const P18 = window.P18;
const PI = Math.PI, TAU = PI * 2;
const OUT = 'rgba(20,14,26,.86)';                                             /* the ink outline of a prop */
const c01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const rgbOf = col => { if (Array.isArray(col)) return col; col = String(col).trim(); if (col[0] === '#') return V2.rgb(col); const m = col.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [255, 255, 255]; };
const mixc = (a, b, k) => V2.rgba(V2.mix(rgbOf(a), rgbOf(b), c01(k)), 1);
const lgr = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const hsh = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* draw with `c` as the engine's current context (rr(), ell() and the UI kit draw on the global ctx), saving and restoring around the body */
function run(c, fn) {
  const prev = ctx; if (c && c !== ctx) ctx = c;
  try { ctx.save(); fn(ctx); ctx.restore(); } finally { ctx = prev; }
}
/* a label that is set dressing unless o.hero: not held to size, margins or cover, and allowed to be cut by the frame */
function lab(str, cx, cy, o, hero) {
  if (typeof UI === 'undefined') return null;
  return UI.label(str, cx, cy, Object.assign({ hero: hero === true, crop: hero !== true }, o));
}
const fx = () => (typeof FX18 !== 'undefined' && FX18) || null;
function glow(g, x, y, r, color, a, core) {
  if (a <= 0.003) return;
  const F = fx();
  if (F && typeof F.glow === 'function') F.glow(g, { x, y, r, color, alpha: a, core: core || 0 });
  else V2.glow(x, y, r, rgbOf(color).join(','), Math.min(1, a), 'screen', .3);
}
function outline(lw = 3, col = OUT) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }

// ------------------------------------------------------------------ exitSign
P18.exitSign = (c, o = {}) => {
  let res = null;
  run(c, g => {
    const s = o.s ?? 1, t = o.t || 0, w = o.w ?? 300, h = o.h ?? 130, fl = o.flicker || 0;
    let br = c01(o.glow ?? 1);
    if (fl > 0) { const n = hsh(Math.floor(t * 17) * 1.93 + 3.1), m = hsh(Math.floor(t * 5) * 2.7 + 9.4); br *= 1 - fl * (n > .5 ? Math.min(1, (n - .5) * 2.2) : 0) * (m > .25 ? 1 : .35); }
    g.translate(o.x ?? 0, o.y ?? 0); g.scale(s, s);
    res = { x0: (o.x ?? 0) - w * s / 2, y0: (o.y ?? 0) - h * s / 2, x1: (o.x ?? 0) + w * s / 2, y1: (o.y ?? 0) + h * s / 2 };
    const halo = c01(o.halo ?? 1);
    if (halo > 0) glow(g, 0, 0, w * .86, '#38ff7a', .42 * br * halo, 0);
    /* housing */
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16; g.shadowOffsetY = 7;
    rr(-w / 2, -h / 2, w, h, 14); g.fillStyle = lgr(0, -h / 2, 0, h / 2, [[0, '#4a5058'], [1, '#262a30']]); g.fill(); g.restore();
    rr(-w / 2, -h / 2, w, h, 14); outline(3.5);
    /* the lit face */
    const fx0 = -w / 2 + 9, fy0 = -h / 2 + 9, fw = w - 18, fh = h - 18;
    rr(fx0, fy0, fw, fh, 8);
    g.fillStyle = lgr(0, fy0, 0, fy0 + fh, [[0, mixc('#0b3a20', '#35e57e', br)], [.55, mixc('#09301a', '#19b95e', br)], [1, mixc('#072814', '#0f9a4a', br)]]); g.fill();
    g.save(); rr(fx0, fy0, fw, fh, 8); g.clip();
    g.fillStyle = 'rgba(255,255,255,' + (.16 * br) + ')'; g.fillRect(fx0, fy0, fw, fh * .38);                                  /* the gloss band */
    g.restore();
    rr(fx0 + 3, fy0 + 3, fw - 6, fh - 6, 6); g.strokeStyle = 'rgba(255,255,255,' + (.55 * br + .1) + ')'; g.lineWidth = 2.4; g.stroke();
    /* pictogram: a running figure, or the running strawberry of the title card */
    const ink = mixc('#6fa488', '#ffffff', br), px = -w / 2 + 62, py = 2, ps = h / 130;
    g.save(); g.translate(px, py); g.scale(ps, ps); g.lineCap = 'round'; g.lineJoin = 'round';
    if (o.runner === 'strawberry') {
      /* a strawberry running: body tipped forward, a leaf cap, seeds, arms and legs in the running pose */
      g.strokeStyle = ink; g.lineWidth = 8;
      g.beginPath(); g.moveTo(-8, 22); g.lineTo(-24, 40); g.lineTo(-40, 38); g.moveTo(8, 24); g.lineTo(26, 36); g.lineTo(24, 52); g.stroke();      /* legs */
      g.beginPath(); g.moveTo(-18, -4); g.lineTo(-38, 6); g.moveTo(16, -6); g.lineTo(34, -18); g.lineTo(46, -10); g.stroke();                       /* arms */
      g.save(); g.rotate(.2);
      g.beginPath(); g.moveTo(0, -34); g.bezierCurveTo(26, -34, 32, -4, 18, 22); g.bezierCurveTo(10, 36, -10, 36, -18, 22); g.bezierCurveTo(-32, -4, -26, -34, 0, -34); g.closePath();
      g.fillStyle = mixc('#5b7a68', '#ff4a5a', br); g.fill(); g.strokeStyle = mixc('#2d4a39', '#a5122a', br); g.lineWidth = 3.4; g.stroke();
      g.fillStyle = mixc('#8aa493', '#ffe9a8', br); for (const [sx, sy] of [[-10, -14], [8, -16], [-2, -2], [14, 0], [-14, 6], [4, 12], [-4, 22]]) { g.beginPath(); g.ellipse(sx, sy, 2.2, 3.2, 0, 0, TAU); g.fill(); }
      g.fillStyle = mixc('#2a5a3a', '#4adf74', br); g.beginPath(); g.moveTo(0, -34); g.lineTo(-14, -46); g.lineTo(-4, -36); g.lineTo(0, -52); g.lineTo(5, -37); g.lineTo(15, -47); g.lineTo(10, -33); g.closePath(); g.fill();
      g.restore();
    } else {
      g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 9;
      g.beginPath(); g.arc(14, -38, 9.5, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(8, -24); g.lineTo(-4, 6); g.stroke();                                                                               /* torso */
      g.beginPath(); g.moveTo(7, -20); g.lineTo(26, -8); g.lineTo(38, -16); g.moveTo(5, -18); g.lineTo(-14, -22); g.lineTo(-24, -10); g.stroke();  /* arms */
      g.beginPath(); g.moveTo(-4, 6); g.lineTo(14, 22); g.lineTo(10, 46); g.moveTo(-4, 6); g.lineTo(-20, 26); g.lineTo(-38, 30); g.stroke();       /* legs */
    }
    g.restore();
    /* the word, and an arrow if there is one */
    const tx = o.arrow ? 22 : 38;
    lab('EXIT', tx, 2, { size: h * .6, weight: 900, font: 'Nunito', fill: mixc('#8fb59f', '#ffffff', br), stroke: mixc('#073a1e', '#0a6a34', br), lw: 3, spacing: 5, maxW: w - 130 - (o.arrow ? 46 : 0) }, o.hero);
    if (o.arrow) {
      const ax = w / 2 - 38, ay = 2, rot = { l: PI, r: 0, d: PI / 2, u: -PI / 2 }[o.arrow] ?? 0;
      g.save(); g.translate(ax, ay); g.rotate(rot); g.fillStyle = mixc('#8fb59f', '#fff', br);
      g.beginPath(); g.moveTo(16, 0); g.lineTo(-2, -17); g.lineTo(-2, -7); g.lineTo(-16, -7); g.lineTo(-16, 7); g.lineTo(-2, 7); g.lineTo(-2, 17); g.closePath(); g.fill(); g.restore();
    }
  });
  return res;
};

// ------------------------------------------------------------------ pullStation
P18.pullStation = (c, o = {}) => {
  let res = null;
  run(c, g => {
    const s = o.s ?? 1, pulled = c01(o.pulled ?? 0), W0 = 200, H0 = 270, drop = 36 * pulled;
    g.translate(o.x ?? 0, o.y ?? 0); g.scale(s, s);
    res = { x0: (o.x ?? 0) - W0 * s / 2, y0: (o.y ?? 0) - H0 * s / 2, x1: (o.x ?? 0) + W0 * s / 2, y1: (o.y ?? 0) + H0 * s / 2, lever: { x: -70, y: 12 + drop, w: 140, h: 112 } };
    /* the back box (the wall mounting plate), then the red body with its pebbled finish */
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 20; g.shadowOffsetY = 9;
    rr(-W0 / 2 - 6, -H0 / 2 - 6, W0 + 12, H0 + 12, 20); g.fillStyle = '#7b0f14'; g.fill(); g.restore();
    rr(-W0 / 2, -H0 / 2, W0, H0, 16); g.fillStyle = lgr(-W0 / 2, -H0 / 2, W0 / 2, H0 / 2, [[0, '#f0443f'], [.45, '#d42228'], [1, '#a5131a']]); g.fill();
    g.save(); rr(-W0 / 2, -H0 / 2, W0, H0, 16); g.clip();
    for (let i = 0; i < 150; i++) {                                                                                                                   /* the pebble texture */
      const px = (hsh(i * 3.1 + 1) - .5) * W0, py = (hsh(i * 5.3 + 2) - .5) * H0, r = 1.6 + hsh(i * 7.7 + 3) * 2.2;
      g.fillStyle = i % 2 ? 'rgba(255,170,150,.16)' : 'rgba(70,0,6,.2)'; g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(-W0 / 2, -H0 / 2, 14, H0);                                                                      /* the lit left edge */
    g.fillStyle = 'rgba(40,0,6,.22)'; g.fillRect(-W0 / 2, H0 / 2 - 18, W0, 18);
    g.restore();
    rr(-W0 / 2, -H0 / 2, W0, H0, 16); outline(3.5);
    rr(-W0 / 2 + 7, -H0 / 2 + 7, W0 - 14, H0 - 14, 11); g.strokeStyle = 'rgba(255,200,190,.28)'; g.lineWidth = 2; g.stroke();
    /* FIRE in raised white letters (a dark offset under it) */
    lab('FIRE', 1.5, -H0 / 2 + 48 + 2.5, { size: 62, weight: 900, font: 'Nunito', fill: 'rgba(70,0,8,.55)', spacing: 7, grp: 'psfire', maxW: W0 - 40 }, o.hero);
    lab('FIRE', 0, -H0 / 2 + 48, { size: 62, weight: 900, font: 'Nunito', fill: '#fff6f0', spacing: 7, grp: 'psfire', maxW: W0 - 40 }, o.hero);
    /* the slot the lever slides in, the key lock, then the lever */
    rr(-76, 6, 152, 124, 12); g.fillStyle = 'rgba(40,0,8,' + (.5 + .35 * pulled) + ')'; g.fill();
    g.beginPath(); g.arc(W0 / 2 - 28, -H0 / 2 + 92, 11, 0, TAU); g.fillStyle = lgr(0, -10, 0, 10, [[0, '#e6e9ee'], [1, '#8a919c']]); g.fill(); outline(2.4);
    g.fillStyle = '#2a2d36'; g.fillRect(W0 / 2 - 30, -H0 / 2 + 85, 4, 14);
    const L = res.lever;
    g.save(); g.shadowColor = 'rgba(40,0,6,.5)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
    rr(L.x, L.y, L.w, L.h, 12); g.fillStyle = lgr(0, L.y, 0, L.y + L.h, [[0, '#e8322f'], [1, '#bd1a21']]); g.fill(); g.restore();
    rr(L.x, L.y, L.w, L.h, 12); outline(3);
    g.fillStyle = 'rgba(70,0,8,.5)'; for (let i = 0; i < 3; i++) g.fillRect(L.x + 22, L.y + L.h - 30 + i * 8, L.w - 44, 3.4);                         /* the grip ridges */
    lab('PULL', L.x + L.w / 2, L.y + 26, { size: 34, weight: 900, fill: '#fff6f0', spacing: 3, maxW: L.w - 24 }, o.hero);
    lab('DOWN', L.x + L.w / 2, L.y + 62, { size: 34, weight: 900, fill: '#fff6f0', spacing: 3, maxW: L.w - 24 }, o.hero);
    g.fillStyle = '#fff6f0'; g.beginPath(); g.moveTo(L.x + L.w / 2 - 12, L.y + 78); g.lineTo(L.x + L.w / 2 + 12, L.y + 78); g.lineTo(L.x + L.w / 2, L.y + 92); g.closePath(); g.fill();
  });
  return res;
};
// ------------------------------------------------------------------ hornStrobe
/* the strobe lens: FX18.lamp when the kit has it (hot core, bloom, rays; a dead pale disc at level 0), else a stand-in with the same job */
function lens(g, x, y, r, level) {
  const F = fx();
  g.beginPath(); g.arc(x, y, r + 7, 0, TAU); g.fillStyle = '#4a0f12'; g.fill(); outline(2.6);
  g.beginPath(); g.arc(x, y, r + 3, 0, TAU); g.fillStyle = lgr(x - r, y - r, x + r, y + r, [[0, '#e9edf1'], [1, '#aeb6bf']]); g.fill();
  if (F && typeof F.lamp === 'function') { F.lamp(g, { x, y, level, r }); return; }
  g.beginPath(); g.arc(x, y, r, 0, TAU);
  g.fillStyle = V2.radial(x - r * .25, y - r * .3, 1, r, [[0, mixc('#ffffff', '#ffffff', 1)], [.6, mixc('#dfe4ea', '#fffdf4', level)], [1, mixc('#aab2bb', '#ffe9c4', level)]]); g.fill();
  if (level > .02) { glow(g, x, y, r * 3.2, '#fff2d8', .75 * level, .6); g.strokeStyle = 'rgba(255,248,230,' + .8 * level + ')'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + .2; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2); g.lineTo(x + Math.cos(a) * r * (1.9 + .5 * level), y + Math.sin(a) * r * (1.9 + .5 * level)); g.stroke(); } }
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - r * .35, y - r * .4, r * .28, r * .16, -.5, 0, TAU); g.fill();
}
P18.hornStrobe = (c, o = {}) => {
  let res = null;
  run(c, g => {
    const s = o.s ?? 1, lvl = c01(o.level ?? 0), ox = o.x ?? 0, oy = o.y ?? 0;
    g.translate(ox, oy); g.scale(s, s);
    if (o.mount === 'ceiling') {
      const R = 75;
      g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 14; g.shadowOffsetY = 6; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fillStyle = lgr(0, -R, 0, R, [[0, '#f4f6f8'], [1, '#bcc3cb']]); g.fill(); g.restore();
      g.beginPath(); g.arc(0, 0, R, 0, TAU); outline(3.2);
      g.beginPath(); g.arc(0, 0, R - 8, 0, TAU); g.strokeStyle = 'rgba(180,20,28,.9)'; g.lineWidth = 6; g.stroke();
      g.strokeStyle = 'rgba(60,66,76,.7)'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + .1; g.beginPath(); g.moveTo(Math.cos(a) * 44, Math.sin(a) * 44); g.lineTo(Math.cos(a) * 58, Math.sin(a) * 58); g.stroke(); }
      lens(g, 0, 0, 24, lvl);
      res = { lens: { x: ox, y: oy, r: 24 * s }, rect: { x0: ox - R * s, y0: oy - R * s, x1: ox + R * s, y1: oy + R * s } };
      return;
    }
    const w = 140, h = 170;
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 8;
    rr(-w / 2, -h / 2, w, h, 12); g.fillStyle = lgr(-w / 2, -h / 2, w / 2, h / 2, [[0, '#f4503f'], [.5, '#d02229'], [1, '#97121a']]); g.fill(); g.restore();
    rr(-w / 2, -h / 2, w, h, 12); outline(3.4);
    rr(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 8); g.strokeStyle = 'rgba(255,210,200,.3)'; g.lineWidth = 2; g.stroke();
    lab('FIRE', 0, -h / 2 + 26, { size: 34, weight: 900, fill: '#fff6f0', spacing: 5, maxW: w - 30 }, o.hero);
    rr(-52, -h / 2 + 46, 104, 44, 7); g.fillStyle = '#5a0c12'; g.fill();                       /* the horn grille: slits in a dark well */
    g.fillStyle = '#efe3df'; for (let i = 0; i < 5; i++) g.fillRect(-46, -h / 2 + 52 + i * 8, 92, 3.6);
    lens(g, 0, 40, 30, lvl);
    res = { lens: { x: ox, y: oy + 40 * s, r: 30 * s }, rect: { x0: ox - w * s / 2, y0: oy - h * s / 2, x1: ox + w * s / 2, y1: oy + h * s / 2 } };
  });
  return res;
};

// ------------------------------------------------------------------ panel
const PANEL_STATE = {
  normal:  { lcd: ['SYSTEM NORMAL', '8:00 PM   UNIT B'], leds: { power: 1 }, tone: 'green' },
  drill:   { lcd: ['DRILL', 'UNIT B   8:00 PM'], leds: { power: 1, supv: 1 }, tone: 'amber' },
  alarm:   { lcd: ['CODE RED', 'UNIT B   ALARM'], leds: { power: 1, alarm: 1 }, tone: 'red' },
  snoozed: { lcd: ['SNOOZED 10:00', 'ALARM SILENCED'], leds: { power: 1, silenced: 1 }, tone: 'amber' },
  trouble: { lcd: ['DOORS: PENDING', 'TROUBLE   UNIT B'], leds: { power: 1, trouble: 1 }, tone: 'amber' },
};
const LCD_TONE = { green: ['#dff0a8', '#b0cf6c', '#1b2a0c', '190,235,120'], amber: ['#f5e6a0', '#dcc060', '#2d2208', '255,214,110'], red: ['#ffc9b8', '#f08e78', '#3a0c06', '255,120,90'] };
const LED_COL = { power: '#37e06d', alarm: '#ff3a30', supv: '#ffb21c', trouble: '#ffb21c', silenced: '#ffb21c' };
const LED_ROWS = [['power', 'POWER'], ['alarm', 'ALARM'], ['supv', 'SUPV'], ['trouble', 'TROUBLE'], ['silenced', 'SILENCED']];
const BTN = [['ack', 'ACK', 6, -40, '#46505d', '#fff'], ['silence', 'SILENCE', 106, -40, '#d9952c', '#2b1a04'], ['reset', 'RESET', 6, 40, '#46505d', '#fff'], ['drill', 'DRILL', 106, 40, '#c4332f', '#fff']];
P18.panel = (c, o = {}) => {
  let res = null;
  run(c, g => {
    const s = o.s ?? 1, ox = o.x ?? 0, oy = o.y ?? 0, W0 = 440, H0 = 580, st = PANEL_STATE[o.state || 'normal'] || PANEL_STATE.normal, lcd = o.lcd || st.lcd;
    const lit = Object.assign({ power: 0, alarm: 0, supv: 0, trouble: 0, silenced: 0 }, st.leds, o.leds || {});
    if (o.blink != null && (o.state === 'alarm') && !(o.leds && o.leds.alarm != null)) lit.alarm = c01(o.blink);
    const tone = LCD_TONE[st.tone] || LCD_TONE.green, press = typeof o.press === 'string' ? { id: o.press, k: 1 } : o.press || null, on = o.lcdOn !== false;
    g.translate(ox, oy); g.scale(s, s);
    const R = (lx0, ly0, lx1, ly1) => ({ x0: ox + lx0 * s, y0: oy + ly0 * s, x1: ox + lx1 * s, y1: oy + ly1 * s });
    /* the housing: grey painted steel, a bevel, four screws */
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24; g.shadowOffsetY = 11;
    rr(-W0 / 2, -H0 / 2, W0, H0, 22); g.fillStyle = lgr(-W0 / 2, -H0 / 2, W0 / 2, H0 / 2, [[0, '#cdd3da'], [.5, '#a2abb5'], [1, '#808995']]); g.fill(); g.restore();
    rr(-W0 / 2, -H0 / 2, W0, H0, 22); outline(3.6);
    rr(-W0 / 2 + 9, -H0 / 2 + 9, W0 - 18, H0 - 18, 16); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2.4; g.stroke();
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(sx * (W0 / 2 - 24), sy * (H0 / 2 - 24), 7, 0, TAU); g.fillStyle = lgr(0, -7, 0, 7, [[0, '#f1f3f6'], [1, '#7b838e']]); g.fill(); outline(1.8); g.strokeStyle = 'rgba(40,44,52,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx * (W0 / 2 - 24) - 4, sy * (H0 / 2 - 24) + 1); g.lineTo(sx * (W0 / 2 - 24) + 4, sy * (H0 / 2 - 24) - 1); g.stroke(); }
    /* the red name plate */
    rr(-188, -H0 / 2 + 26, 376, 46, 8); g.fillStyle = lgr(0, -H0 / 2 + 26, 0, -H0 / 2 + 72, [[0, '#d02a2e'], [1, '#98141a']]); g.fill(); outline(2.6);
    lab('FIRE ALARM CONTROL PANEL', 0, -H0 / 2 + 49, { size: 22, weight: 900, fill: '#fff4ee', spacing: 1.6, maxW: 350 }, o.hero);
    /* the LCD: a black bezel, a backlit two-line screen */
    const lx0 = -184, ly0 = -196, lw = 368, lh = 128;
    rr(lx0 - 12, ly0 - 12, lw + 24, lh + 24, 14); g.fillStyle = '#12161b'; g.fill(); outline(2.6);
    rr(lx0, ly0, lw, lh, 7);
    g.fillStyle = on ? lgr(0, ly0, 0, ly0 + lh, [[0, tone[0]], [1, tone[1]]]) : '#222c22'; g.fill();
    if (on) { g.save(); rr(lx0, ly0, lw, lh, 7); g.clip(); g.fillStyle = 'rgba(0,0,0,.06)'; for (let y = ly0 + 2; y < ly0 + lh; y += 4) g.fillRect(lx0, y, lw, 1.4); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(lx0, ly0, lw, 22); g.restore(); }
    const heroL = o.hero === true || o.heroLcd === true;
    if (on) {
      lab(String(lcd[0] || ''), 0, ly0 + 36, { size: 44, weight: 900, fill: tone[2], spacing: 2, maxW: lw - 28 }, heroL);
      lab(String(lcd[1] || ''), 0, ly0 + 92, { size: 33, weight: 900, fill: tone[2], spacing: 1.6, maxW: lw - 28 }, heroL);
      glow(g, 0, ly0 + lh / 2, 260, 'rgb(' + tone[3] + ')', .26, 0);
    }
    res = { lcd: R(lx0, ly0, lx0 + lw, ly0 + lh), buttons: {} };
    /* the LED column on the left */
    LED_ROWS.forEach(([id, name], i) => {
      const ly = -22 + i * 44, v = c01(lit[id] || 0), col = LED_COL[id];
      g.beginPath(); g.arc(-170, ly, 12, 0, TAU); g.fillStyle = mixc('#2a2326', col, v); g.fill(); outline(2.4);
      if (v > .02) { g.beginPath(); g.arc(-173, ly - 3, 4, 0, TAU); g.fillStyle = 'rgba(255,255,255,' + .6 * v + ')'; g.fill(); glow(g, -170, ly, 46, col, .75 * v, .35); }
      lab(name, -148, ly + 1, { size: 21, weight: 900, fill: '#27303a', align: 'left', spacing: 1, maxW: 110 }, o.hero);
    });
    /* the four buttons */
    for (const [id, name, bx, by, fill, ink] of BTN) {
      const pr = press && press.id === id ? c01(press.k) : 0, w = 94, h = 58, y = by + pr * 3;
      g.save(); if (!pr) { g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 8; g.shadowOffsetY = 4; }
      rr(bx, y, w, h, 12); g.fillStyle = mixc(fill, '#000000', pr * .25); g.fill(); g.restore();
      rr(bx, y, w, h, 12); outline(2.8);
      g.fillStyle = 'rgba(255,255,255,' + (.2 - .12 * pr) + ')'; rr(bx + 5, y + 4, w - 10, 14, 7); g.fill();
      lab(name, bx + w / 2, y + h / 2 + 3, { size: 21, weight: 900, fill: ink, spacing: .6, maxW: w - 16 }, o.hero);
      res.buttons[id] = R(bx, y, bx + w, y + h);
    }
    /* the keyswitch, a speaker grille and the zone plate on the lower part */
    g.beginPath(); g.arc(-130, 215, 30, 0, TAU); g.fillStyle = lgr(0, 185, 0, 245, [[0, '#d9dde3'], [1, '#7f8792']]); g.fill(); outline(2.8);
    g.fillStyle = '#20242b'; rr(-134, 200, 8, 30, 3); g.fill();
    g.beginPath(); g.arc(-130, 215, 38, 0, TAU); g.strokeStyle = 'rgba(40,46,54,.55)'; g.lineWidth = 3; g.stroke();
    rr(-60, 184, 230, 62, 10); g.fillStyle = '#6d7681'; g.fill(); outline(2.4);
    g.fillStyle = 'rgba(20,24,30,.8)'; for (let r = 0; r < 4; r++) for (let q = 0; q < 14; q++) { g.beginPath(); g.arc(-40 + q * 15.5, 198 + r * 13, 3, 0, TAU); g.fill(); }
    lab('ZONE 2   UNIT B', 0, H0 / 2 - 24, { size: 20, weight: 900, fill: '#2f3944', spacing: 2, maxW: 300 }, o.hero);
  });
  return res;
};
// ------------------------------------------------------------------ fireDoor
/* The leaf is drawn by a small perspective (viewer 3000 in front of the door plane, eye 80 above the floor): the free edge swings TOWARD the viewer, so it grows a little and the leaf stays on the floor line.
 * Leaf coordinates (u across from the hinge, v up from the floor, both 0..1) map through M(u, v) so every fitting (window, sign, plates, hinges, closer) follows the swing. */
function fdBeyond(g, bey, x0, y0, x1, y1) {
  g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  if (typeof bey === 'function') bey(g, { x0, y0, x1, y1 });
  else if (bey === 'light') { g.fillStyle = lgr(0, y0, 0, y1, [[0, '#f1f6fa'], [1, '#bdcad8']]); g.fillRect(x0, y0, x1 - x0, y1 - y0); g.fillStyle = 'rgba(80,100,120,.18)'; g.fillRect(x0, y1 - 56, x1 - x0, 56); }
  else if (typeof bey === 'string' && bey !== 'dark') { g.fillStyle = bey; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.fillStyle = lgr(0, y0, 0, y1, [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(x0, y0, x1 - x0, y1 - y0); }
  else {
    g.fillStyle = lgr(0, y0, 0, y1, [[0, '#0b1018'], [.7, '#1a2230'], [1, '#2a3446']]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = 'rgba(70,84,108,.35)'; g.fillRect(x0, y1 - 54, x1 - x0, 54);                                                       /* the far floor */
    g.fillStyle = 'rgba(255,230,170,.07)'; g.beginPath(); g.moveTo((x0 + x1) / 2 - 30, y0 + 40); g.lineTo((x0 + x1) / 2 + 30, y0 + 40); g.lineTo(x1 - 20, y1); g.lineTo(x0 + 20, y1); g.closePath(); g.fill();
  }
  g.restore();
}
function fdProp(g, kind, x, hg) {
  g.save(); g.translate(x, 0); g.lineJoin = 'round'; g.lineCap = 'round';
  if (kind === 'wedge') {
    g.beginPath(); g.moveTo(-38, 0); g.lineTo(38, 0); g.lineTo(38, -9); g.lineTo(-38, -30); g.closePath(); g.fillStyle = lgr(0, -30, 0, 0, [[0, '#ff8a2a'], [1, '#d4501a']]); g.fill(); outline(3);
    g.strokeStyle = 'rgba(80,20,0,.4)'; g.lineWidth = 2.4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-26 + i * 14, -4 - i * 0); g.lineTo(-24 + i * 14, -8 - (4 - i) * 3.6); g.stroke(); }
  } else if (kind === 'chair') {
    g.fillStyle = '#b07a46'; g.strokeStyle = OUT; g.lineWidth = 3;
    rr(-46, -112, 92, 16, 5); g.fill(); g.stroke();                                                                                          /* seat */
    rr(-46, -240, 16, 134, 5); g.fill(); g.stroke(); rr(30, -240, 16, 134, 5); g.fill(); g.stroke();                                          /* back posts */
    for (let i = 0; i < 3; i++) { rr(-34, -228 + i * 36, 68, 22, 5); g.fillStyle = '#c28c52'; g.fill(); g.stroke(); }                         /* slats */
    g.fillStyle = '#9a6a3a'; rr(-42, -98, 12, 98, 4); g.fill(); g.stroke(); rr(30, -98, 12, 98, 4); g.fill(); g.stroke();                     /* legs */
  } else if (kind === 'cart') {
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 70, -17, 16, 0, TAU); g.fillStyle = '#23252c'; g.fill(); outline(2.6); g.beginPath(); g.arc(sx * 70, -17, 6, 0, TAU); g.fillStyle = '#9aa2ad'; g.fill(); }
    rr(-92, -62, 184, 26, 6); g.fillStyle = lgr(0, -62, 0, -36, [[0, '#9aa5b3'], [1, '#68727f']]); g.fill(); outline(3);
    const bundle = [['#6ea8e6', -92], ['#8cc0f2', -140], ['#5f98d8', -188], ['#a3caf4', -228]];                                              /* the linen */
    bundle.forEach(([col, y], i) => { rr(-80 + (i % 2) * 6, y, 160 - (i % 2) * 10, 44, 14); g.fillStyle = col; g.fill(); outline(2.6); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-60, y + 14); g.lineTo(60, y + 14); g.stroke(); });
    g.strokeStyle = 'rgba(210,218,228,.95)'; g.lineWidth = 4;                                                                               /* the wire cage */
    for (const sx of [-86, 86]) { g.beginPath(); g.moveTo(sx, -62); g.lineTo(sx, -262); g.stroke(); }
    for (const y of [-120, -176, -232, -262]) { g.beginPath(); g.moveTo(-86, y); g.lineTo(86, y); g.stroke(); }
    g.lineWidth = 1.6; g.globalAlpha = .6; for (let x = -70; x < 86; x += 24) { g.beginPath(); g.moveTo(x, -62); g.lineTo(x, -262); g.stroke(); } g.globalAlpha = 1;
  }
  g.restore();
}
P18.fireDoor = (c, o = {}) => {
  let res = null;
  run(c, g => {
    const s = o.s ?? 1, ox = o.x ?? 0, oy = o.y ?? 0, Wd = o.w ?? 320, Hd = o.h ?? 520, hg = o.hinge === -1 ? -1 : 1, FW = 24, LH = Hd - 4;
    const close = c01(o.close ?? 1), A = (1 - close) * 84 * PI / 180, ca = Math.cos(A), sa = Math.sin(A), prop = o.prop || null, led = o.led || 'green';
    g.translate(ox, oy); g.scale(s, s);
    const D = 3000, E = 80, pj = (X, Y, Z) => { const k = D / (D - Z); return [X * k, -(E + (Y - E) * k)]; };
    const Xh = -hg * Wd / 2;
    const M = (u, v) => pj(Xh + hg * Wd * ca * u, v * LH, Wd * sa * u);
    const poly = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    const qd = (u0, v0, u1, v1) => [M(u0, v0), M(u1, v0), M(u1, v1), M(u0, v1)];
    const x0 = -Wd / 2, x1 = Wd / 2, y0 = -Hd, y1 = 0;
    /* what is seen through the doorway */
    const bey = o.beyond === undefined ? 'dark' : o.beyond;
    if (bey !== false) fdBeyond(g, bey, x0, y0, x1, y1);
    /* the frame: two jambs and a head in painted steel, the black seal in the rebate */
    const steel = (xa, ya, xb, yb) => lgr(xa, ya, xb, yb, [[0, '#7d8997'], [.5, '#5f6b79'], [1, '#48525f']]);
    g.fillStyle = steel(x0 - FW, 0, x0, 0); g.fillRect(x0 - FW, y0 - FW, FW, Hd + FW); g.fillStyle = steel(x1, 0, x1 + FW, 0); g.fillRect(x1, y0 - FW, FW, Hd + FW);
    g.fillStyle = steel(0, y0 - FW, 0, y0); g.fillRect(x0 - FW, y0 - FW, Wd + 2 * FW, FW);
    g.strokeStyle = OUT; g.lineWidth = 3.2; g.lineJoin = 'round'; g.strokeRect(x0 - FW, y0 - FW, Wd + 2 * FW, Hd + FW); g.strokeRect(x0, y0, Wd, Hd);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x0 - FW + 3, y0 - FW + 3, Wd + 2 * FW - 6, 4); g.fillRect(x0 - FW + 3, y0 - FW + 3, 4, Hd + FW - 6);
    g.fillStyle = 'rgba(10,10,14,.75)'; g.fillRect(x0, y0, Wd, 5); g.fillRect(x0, y0, 5, Hd); g.fillRect(x1 - 5, y0, 5, Hd);
    /* the magnetic holder on the wall beside the hinge jamb, with its LED */
    const hx = Xh - hg * (FW + 40), hy = -160, lg0 = o.glow ?? (led === 'off' ? 0 : .9), lcol = led === 'red' ? '#ff3a30' : '#37e06d';
    rr(hx - 18, hy - 36, 36, 72, 9); g.fillStyle = lgr(hx - 18, 0, hx + 18, 0, [[0, '#cfd5dc'], [1, '#8a929d']]); g.fill(); outline(3);
    g.beginPath(); g.arc(hx, hy + 12, 13, 0, TAU); g.fillStyle = lgr(0, hy - 2, 0, hy + 26, [[0, '#4a525d'], [1, '#20252c']]); g.fill(); outline(2.4);
    g.beginPath(); g.arc(hx, hy - 17, 7, 0, TAU); g.fillStyle = led === 'off' ? '#33292b' : mixc('#2a2326', lcol, c01(lg0)); g.fill(); outline(2.2);
    if (led !== 'off' && lg0 > .02) glow(g, hx, hy - 17, 54, lcol, .8 * c01(lg0), .4);
    /* the leaf: a steel quad (with the vision panel cut out), embossed panel, kick plate, hinges, closer, push plate, KEEP CLOSED sign */
    const leaf = qd(0, 0, 1, 1), win = (o.window === false) ? null : qd(.30, .55, .70, .90);
    const g0 = M(0, .5), g1 = M(1, .5);
    g.save(); g.shadowColor = 'rgba(0,0,0,' + (.28 * (1 - close * .6)) + ')'; g.shadowBlur = 14; g.shadowOffsetX = -hg * 6 * (1 - close);
    g.beginPath(); leaf.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    if (win) { win.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }
    g.fillStyle = lgr(g0[0], 0, g1[0] + (g1[0] === g0[0] ? 1 : 0), 0, [[0, '#cdd4db'], [.5, '#adb6c0'], [1, '#919ba7']]); g.fill('evenodd'); g.restore();
    poly(leaf); outline(3.4);
    const sl = hg > 0 ? 1 : -1; void sl;
    g.save(); poly(leaf); g.clip();
    poly(qd(.07, .16, .93, .965)); g.strokeStyle = 'rgba(70,80,92,.45)'; g.lineWidth = 2.6; g.stroke();                                     /* the pressed panel line */
    poly(qd(.07, .16, .93, .965)); g.fillStyle = 'rgba(255,255,255,.07)'; g.fill();
    poly(qd(0, 0, 1, .14)); g.fillStyle = lgr(0, M(0, .14)[1], 0, M(0, 0)[1], [[0, '#d8dde3'], [1, '#98a1ad']]); g.fill(); poly(qd(0, 0, 1, .14)); g.strokeStyle = 'rgba(40,46,56,.6)'; g.lineWidth = 2.4; g.stroke();   /* kick plate */
    g.fillStyle = 'rgba(60,66,78,.8)'; for (const u of [.1, .5, .9]) { const p = M(u, .07); g.beginPath(); g.arc(p[0], p[1], 3.2, 0, TAU); g.fill(); }
    g.restore();
    for (const v of [.1, .5, .9]) { poly(qd(-.004, v - .035, .035, v + .035)); g.fillStyle = '#39414d'; g.fill(); outline(2); }                       /* hinge knuckles */
    { const cb = qd(.08, .925, .34, .985); poly(cb); g.fillStyle = lgr(0, M(0, .985)[1], 0, M(0, .925)[1], [[0, '#8f98a5'], [1, '#5c6672']]); g.fill(); outline(2.4);        /* the door closer and its arm */
      const p0 = M(.34, .955), p1 = M(.62, .93); g.strokeStyle = '#59636f'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
    { const pp = qd(.76, .24, .93, .46); poly(pp); g.fillStyle = lgr(0, M(0, .46)[1], 0, M(0, .24)[1], [[0, '#eef1f5'], [1, '#a3abb6']]); g.fill(); outline(2.4); }   /* the push plate */
    /* the vision panel: wire glass with its diamond mesh and a sheen; what is behind the door shows through the hole */
    if (win) {
      g.save(); poly(win); g.clip(); g.fillStyle = 'rgba(150,196,215,.22)'; g.fillRect(-Wd, -Hd * 1.3, Wd * 2, Hd * 1.5);
      g.strokeStyle = 'rgba(205,224,232,.55)'; g.lineWidth = 1.5;
      for (let i = -8; i <= 16; i++) { const a = M(.30 + i * .05, .55), b = M(.30 + (i + 8) * .05, .90), c2 = M(.30 + i * .05, .90), d = M(.30 + (i + 8) * .05, .55); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.moveTo(c2[0], c2[1]); g.lineTo(d[0], d[1]); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.2)'; const q = [M(.32, .56), M(.42, .56), M(.60, .89), M(.5, .89)]; poly(q); g.fill();
      g.restore(); poly(win); g.strokeStyle = '#4a545f'; g.lineWidth = 7; g.stroke(); poly(win); g.strokeStyle = '#c4ccd4'; g.lineWidth = 2; g.stroke();
    }
    { const sg = qd(.12, .30, .88, .46); poly(sg); g.fillStyle = lgr(0, M(0, .46)[1], 0, M(0, .30)[1], [[0, '#d9333a'], [1, '#a31820']]); g.fill(); outline(2.6);
      if (A < .3 && close > .8) {
        const mid = M(.5, .38);
        lab('FIRE DOOR', mid[0], mid[1] - 13, { size: 20, weight: 900, fill: '#fff4ee', spacing: 2.4, maxW: Wd * .6 }, o.hero);
        lab('KEEP CLOSED', mid[0], mid[1] + 14, { size: 25, weight: 900, fill: '#fff4ee', spacing: 1.4, maxW: Wd * .66 }, o.hero);
      } }
    /* what is holding it open */
    const f0 = M(1, 0), f1 = M(1, 1);
    if (prop && close < .97) fdProp(g, prop, f0[0] + hg * (prop === 'cart' ? 52 : prop === 'chair' ? 40 : 6), hg);
    const center = win ? M(.5, .725) : M(.5, .5);
    res = { x0: ox + x0 * s, y0: oy + y0 * s, x1: ox + x1 * s, y1: oy + y1 * s, free: { x: ox + f0[0] * s, top: oy + f1[1] * s, bottom: oy + f0[1] * s }, holder: { x: ox + hx * s, y: oy + (hy - 17) * s }, glass: { x: ox + center[0] * s, y: oy + center[1] * s } };
  });
  return res;
};
/* @@NEXT@@ */
})();
