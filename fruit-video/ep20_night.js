'use strict';
/* SHIFT HAPPENS, Episode 20: "The Snow Day". Builder E20-NIGHT. Scene `night` (10:59 PM to 7:00 AM, THE LONG NIGHT, 34.362 s). Registers window.__EP20_SCENES.night.
 *
 * THE ROOM is the perspective room of the earlier stations (S6.shell, one-point perspective, back wall at Z 1900) at night on the generator: a big window in the back wall (the blizzard, the Moon, the sill
 * that fills with snow), the glass doors of the entrance to its right, four camp cots (P20.cot) along the wall at the left with Mango, Lemon, Tomato and Onion asleep, the counter (S13.counter) with a desk lamp
 * and a dead coffee maker, the med cart (S13.medCart) with a 3-11 sticker, a dark TV, the wall clock above the window, half the ceiling lamps off, red-amber emergency lamps, a green exit sign. ONE lighting pass
 * (L20.pass) turns it into a night and, over the lapse, into a sunrise: ambient, tint and the window's colour follow the sim's sky (ep20_lapse_sim.js, shared with tools_lapse.js -> build/ep20/lapse.json).
 * Every shot is the same perspective camera plus a 2D camera (zoomTo); close-ups are the same room, out of focus behind the face.
 *
 * SHOTS (scene-local seconds; the list is SH below)
 *   open 0-1.90 wide push-in (clocktick .40) | s1 1.90-3.32 Strawberry "Is the oncoming nurse here?", cold breath, looks at the doors then the clock | w1 3.32-4.17 the clock and the window: the minute hand drops
 *   onto 11:00 (tick 3.316), the gust in the window (windgust 3.516) | w2 4.17-4.87 her shoulders drop | s2 4.87-6.25 "I am the oncoming nurse." a slow turn to the camera |
 *   THE TWIN: t1 6.25-7.94 the two-shot, the outgoing (3-11) reports, the oncoming peels her badge sticker (badgepeel 6.766) and re-sticks it as 11-7 | t2 7.94-8.97 the oncoming "Any concerns?" |
 *   t3 8.97-9.85 the outgoing "I am tired." | t4 9.85-10.65 the two-shot, "Noted." (she writes it down) |
 *   THE LAPSE 10.65-18.65 one locked wide (lapsewhoosh 10.653, clockspin 10.853, windswell 11.653): the world clock 11 PM to 7 AM, the sky, the Moon, the snow, the sleepers, Strawberry's rounds as a ghost trail |
 *   mo1 18.67-20.31 the Moon in the pane, setting, golden light begins to fall | s7r 20.31-20.84 Strawberry wakes to it | s7 20.84-21.45 "What time is it?" (she looks up) | ck 21.45-21.85 clock and window: 7:00 |
 *   mo2 21.85-22.90 the Moon "Seven." | s8 22.90-23.72 "In the morning?" | mo3 23.72-24.78 "Yes." | s9 24.78-25.69 "Okay." |
 *   dawn 25.69-27.74 wide, push-in, golden light, the sleepers stir, the amber beacon at the glass (plowdist 25.989) | tu3 27.74-29.61 the plow passes in the window, Turnip raises his mug "I plowed the lot.",
 *   the wave of snow slides up the glass doors | o5 29.61-31.34 Onion sits up on her cot, crying "The entrance is blocked." (sniffle 31.205) | s10 31.34-32.41 Strawberry "Of course." |
 *   end 32.41-34.36 a held wide: Strawberry small at the med cart in the sunrise, the buried doors, the cots, the snow glittering (sting 32.512).
 *
 * KITS: SN20 / L20 (ep20_fx.js) and P20 (ep20_props.js) are called when they exist; a small stand-in of the same shape is drawn for what has not landed yet (checked at DRAW time). A20 (ep20_art.js) likewise. */
(() => {
if (!window.TIMELINE_EP20 || !window.H6 || !window.V2 || !window.S6 || !window.S13 || !window.A7 || !window.A11 || !window.A15 || !window.UI || !window.__EP20_SIMS || !window.__EP20_SIMS.lapse) return;
const { zoomTo, faceC, drawBg } = window.H6;
const S6 = window.S6, S13 = window.S13, A7 = window.A7, A11 = window.A11, A15 = window.A15;
const PI = Math.PI;
const SIM = window.__EP20_SIMS.lapse.build(), LAY = SIM.LAY, L = SIM.L;

// ------------------------------------------------------------------ small helpers (the models: ep18_station.js, ep19_signup.js)
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const rgbs = a => 'rgb(' + a.map(v => Math.round(v)).join(',') + ')';
const mixa = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
const heroAt = size => size * scrOf(ctx) >= 31;
const TLX = window.TIMELINE_EP20;
function tl(id) {
  const SCN = TLX.scenes.find(s => s.id === id), START = SCN.start, LN = {};
  for (const l of TLX.lines) if (l.scene === id) LN[l.id] = l;
  return { SCN, START, LN, bS: b => SCN.beats[b].s, bE: b => SCN.beats[b].e, wS: (b, i) => LN[b].s - START + LN[b].words[i][1], wE: (b, i) => LN[b].s - START + LN[b].words[i][2], snapT: t => Math.round((START + t) * 30) / 30 - START };
}
const NT = tl('night'), snapT = NT.snapT, bS = NT.bS, bE = NT.bE, wS = NT.wS, wE = NT.wE;
const CUE = SIM.CUE;                                                      /* the sound cues of the scene, snapped to the frame (the sim holds the list) */

// ------------------------------------------------------------------ the kits, called when they exist, with a stand-in of the same shape when not (checked at draw time)
const has = (ns, n) => window[ns] && typeof window[ns][n] === 'function';
function snowN(c, o) {                                                    /* falling snow in a rectangle (SN20.snow), a plain fall when the kit is missing */
  if (has('SN20', 'snow')) return SN20.snow(c, o);
  c.save(); c.beginPath(); c.rect(o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0); c.clip();
  const w = o.x1 - o.x0, h = o.y1 - o.y0, n = Math.round(70 * (o.density ?? 1) * w * h / (1080 * 1920) * 6);
  for (let i = 0; i < n; i++) {
    const z = sr(i, o.seed ?? 1), sp = 60 + 130 * z, x = o.x0 + (((sr(i, 2) * w + (o.wind ?? 0) * o.t * (.5 + z) + 14 * Math.sin(o.t * 1.3 + i)) % w) + w) % w, y = o.y0 + ((sr(i, 3) * h + sp * o.t) % h);
    c.fillStyle = 'rgba(255,255,255,' + (.35 + .5 * z) * (o.alpha ?? 1) + ')'; c.beginPath(); c.arc(x, y, 1.6 + 3.4 * z, 0, TAU); c.fill();
  }
  c.restore();
}
function frostN(c, o) {                                                   /* frost on a pane (SN20.frost): white lace growing in from the edges */
  if (has('SN20', 'frost')) return SN20.frost(c, o);
  const a = c01(o.amount); if (a < .02) return;
  c.save(); c.beginPath(); c.rect(o.x, o.y, o.w, o.h); c.clip();
  for (const [cx, cy] of [[o.x, o.y + o.h], [o.x + o.w, o.y + o.h], [o.x, o.y], [o.x + o.w, o.y]]) {
    const r = Math.min(o.w, o.h) * (.18 + .5 * a);
    c.fillStyle = V2.radial(cx, cy, r * .1, r, [[0, 'rgba(235,245,255,' + .55 * a + ')'], [1, 'rgba(235,245,255,0)']]); c.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  c.restore();
}
function sillN(c, o) {                                                    /* a snow heap along a ledge (SN20.sill) */
  if (has('SN20', 'sill')) return SN20.sill(c, o);
  const n = 18, w = o.x1 - o.x0;
  c.save(); c.fillStyle = o.tone === 'dark' ? '#e8f0ff' : '#f4f8ff'; c.beginPath(); c.moveTo(o.x0, o.y);
  for (let i = 0; i <= n; i++) { const u = i / n, e = Math.sin(u * PI) ** .6; c.lineTo(o.x0 + u * w, o.y - o.depth * e * (.7 + .3 * sr(i, o.seed ?? 1))); }
  c.lineTo(o.x1, o.y); c.closePath(); c.fill(); c.restore();
}
function bankN(c, o) {                                                    /* a mound of snow (SN20.bank) */
  if (has('SN20', 'bank')) return SN20.bank(c, o);
  c.save(); c.translate(o.x, o.y); if (o.flip) c.scale(-1, 1);
  c.fillStyle = lg(0, -o.h, 0, 0, [[0, '#f4f8ff'], [1, '#b9c9e6']]); c.beginPath(); c.moveTo(-o.w / 2, 0); c.bezierCurveTo(-o.w * .3, -o.h * 1.1, o.w * .3, -o.h * 1.1, o.w / 2, 0); c.closePath(); c.fill(); c.restore();
}
function breathN(c, o) {                                                  /* a puff of cold breath leaving a mouth (SN20.breath) */
  if (has('SN20', 'breath')) return SN20.breath(c, o);
  const per = o.period ?? 1.9, ph = (((o.t + (o.phase ?? 0)) % per) + per) % per / per, a = Math.sin(PI * Math.min(1, ph * 1.25)) * (o.alpha ?? 1) * .6, d = o.dir ?? 1, sz = o.size ?? 1;
  if (a < .02) return;
  c.save(); for (let i = 0; i < 4; i++) { const u = ph * (.6 + i * .15), r = (14 + 30 * u + i * 6) * sz; c.fillStyle = 'rgba(220,232,250,' + a * (1 - i * .18) * .5 + ')'; c.beginPath(); c.arc(o.x + d * (26 + 70 * u + i * 14) * sz, o.y - (10 + 28 * u) * sz, r, 0, TAU); c.fill(); } c.restore();
}
function flurryN(c, o) {                                                  /* a burst of powder (SN20.flurry) */
  if (has('SN20', 'flurry')) return SN20.flurry(c, o);
  if (window.FX18 && FX18.puff) FX18.puff(c, { x: o.x, y: o.y, r: o.r ?? 90, t: o.t, t0: o.t0, life: o.life ?? 1, color: '#eef4ff', seed: o.seed ?? 1 });
}
function sprayN(c, o) {                                                   /* snow thrown by a blade (SN20.spray) */
  if (has('SN20', 'spray')) return SN20.spray(c, o);
  if (window.FX18 && FX18.sparks) FX18.sparks(c, { x: o.x, y: o.y, t: o.t, t0: o.t0, count: 26, speed: 380, life: .9, gravity: 700, seed: o.seed ?? 2, color: '#f2f6ff' });
}
function beamN(c, o) {                                                    /* a headlight / flashlight beam in the snow (SN20.beam) */
  if (has('SN20', 'beam')) return SN20.beam(c, o);
  if (window.FX18 && FX18.cone) FX18.cone(c, { x: o.x, y: o.y, ang: o.ang, spread: o.spread ?? .5, len: o.len ?? 600, color: o.color ?? '#fff2c8', alpha: o.alpha ?? .4 });
}
const glowN = (x, y, r, rgbStr, a, core) => {                             /* the engine's glow (feeds the bloom layer) */
  if (a <= .003) return;
  if (window.FX18 && FX18.glow) FX18.glow(ctx, { x, y, r, color: 'rgb(' + rgbStr + ')', alpha: a, core: core ?? .4 }); else V2.glow(x, y, r, rgbStr, Math.min(1, a), 'screen', .3);
};

// ------------------------------------------------------------------ the camera of the room (every shot) and the world of this instant
const PC = { f: 1400, cy: 360, hy: 720, cz: -100, cx: -60 };
const ZB = LAY.zb, kzP = Z => V2.P.f / (Z - V2.P.cz);
const wbox = (X0, Y0, X1, Y1, Z = ZB) => S13.wallBox(Z, X0, Y0, X1, Y1);   /* the screen rectangle [x, y, w, h] of a rectangle on a wall at depth Z */
const wpt = (X, Y, Z = ZB) => V2.p2(X, Y, Z);
const clipRR = (x, y, w, h, r) => { rr(x, y, w, h, r); ctx.clip(); };
/* what the world looks like at scene-local time lt: the clock, the sky, the Moon, the snow, the light of the sun (all from the sim, so the picture and lapse.json agree) */
function envAt(lt) {
  const m = SIM.worldMin(lt), sk = SIM.sky(lt), mo = SIM.moon(lt), sun = SIM.sunLevel(lt), dep = has('SN20', 'depthAt') ? SN20.depthAt(m) : SIM.depth(lt), n = SIM.snowRate(m);
  return { lt, m, sk, mo, sun, dep, snow: n, stars: SIM.starsAlpha(m), lamp: SIM.lamp(lt), frost: c01(.26 + .42 * c01((m - 1380) / 480)) * (1 - .35 * sun) };
}

// ------------------------------------------------------------------ the sky behind the glass: gradient, sunrise glow, stars, the Moon and his weather, a far line of snowed-in cars
function skyIn(x, y, w, h, env, o = {}) {
  const sk = env.sk, g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgbs(sk.top)); g.addColorStop(.5, rgbs(sk.mid)); g.addColorStop(.84, rgbs(sk.hor)); g.addColorStop(1, rgbs(mixa(sk.hor, [226, 234, 252], .45)));
  ctx.fillStyle = g; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  if (env.sun > .02) {                                                     /* the sun is just under the roofs: a gold glow low on the right */
    V2.glow(x + w * .86, y + h * .84, w * .9, '255,176,96', .62 * env.sun, 'screen', .2);
    V2.glow(x + w * .86, y + h * .86, w * .38, '255,222,150', .55 * env.sun, 'screen', .2);
  }
  if (env.stars > .03) {
    ctx.save(); ctx.fillStyle = '#eef3ff';
    for (let i = 0; i < 46; i++) {
      const sx = x + sr(i, 1) * w, sy = y + sr(i, 2) * h * .66, tw = .6 + .4 * Math.sin(env.lt * (.9 + sr(i, 3) * 1.4) + i * 2.1), a = env.stars * tw * (.35 + .65 * sr(i, 4));
      ctx.globalAlpha = a; ell(sx, sy, 1.3 + sr(i, 5) * 1.5, 1.3 + sr(i, 5) * 1.5); ctx.fill();
    }
    ctx.restore();
  }
  const mo = env.mo;
  if (mo.alpha > .02 && !o.noMoon) {                                      /* the Moon, behind the weather early in the night, large and low at 7 AM */
    const mx = x + mo.u * w, my = y + (1 - mo.v) * h, rad = mo.r * h, a = mo.alpha * (1 - .86 * mo.cloud);
    if (A7.moon) A7.moon(mx, my, rad / 150, { t: env.lt, alpha: a, halo: true, haloA: 1 - mo.cloud * .4, warm: c01(env.sun * .9), suppress: !!o.suppressMoon, char: o.moonChar || {} });
    if (mo.cloud > .01) cloudBanks(x, y, w, h, mx, my, rad, mo.cloud, env.lt);
    o.moonAt = [mx, my, rad];
  }
  if (o.cars !== false) {                                                  /* the lot beyond the glass: snowed-in cars, a lamp post */
    ctx.save(); ctx.fillStyle = rgbs(mixa(sk.hor, [60, 74, 108], .55)); const gy = y + h * .87;
    for (const [cx, cw, ch] of [[.12, .17, .075], [.34, .13, .06], [.58, .2, .085], [.8, .12, .055], [.93, .1, .05]]) { ctx.beginPath(); ctx.ellipse(x + cx * w, gy, cw * w / 2, ch * h, 0, PI, 0); ctx.fill(); }
    ctx.fillRect(x, gy - 2, w, 4);
    ctx.fillStyle = rgbs(mixa(sk.hor, [40, 52, 84], .6)); ctx.fillRect(x + w * .68 - 2, gy - h * .26, 4, h * .26); ctx.fillRect(x + w * .68 - 14, gy - h * .26, 18, 4);
    ctx.restore();
  }
}
/* the weather in front of the Moon (the same two drifting banks as P20.moon): cloud 1 = only a glow */
function cloudBanks(x, y, w, h, mx, my, r, cloud, t) {
  ctx.save();
  for (let layer = 0; layer < 2; layer++) {
    const n = 7, drift = t * (7 + layer * 5), span = w + r * 3;
    for (let i = 0; i < n; i++) {
      const cxp = x - r * 1.5 + (((i / n) * span + drift * (layer ? 1.4 : 1) + layer * 130) % span), cyp = my + (layer ? .55 : -.25) * r + (sr(i + 7 * layer, 9) - .5) * r * 1.5, r0 = r * (.85 + sr(i + 3 + layer, 4) * .7), a = cloud * (layer ? .62 : .5);
      ctx.fillStyle = V2.radial(cxp, cyp, r0 * .1, r0, [[0, 'rgba(' + (layer ? '58,72,104' : '96,112,148') + ',' + a + ')'], [1, 'rgba(58,72,104,0)']]); ctx.fillRect(cxp - r0, cyp - r0, r0 * 2, r0 * 2);
    }
  }
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(mx, my, r * .2, r * 2.4, [[0, 'rgba(190,210,255,' + .42 * cloud + ')'], [1, 'rgba(190,210,255,0)']]); ctx.fillRect(mx - r * 2.4, my - r * 2.4, r * 4.8, r * 4.8);
  ctx.restore();
}
/* snow, frost and the heap on the outer sill inside one pane rectangle; `kids` draws extra things (the plow) between the sky and the snow */
function weatherIn(x, y, w, h, env, o = {}) {
  const lt = env.lt, pale = env.sun > .35;
  if (o.kids) o.kids(x, y, w, h);
  if (o.glints) o.glints(x, y, w, h);
  if (env.snow > .02) snowN(ctx, { x0: x, y0: y, x1: x + w, y1: y + h, t: lt, seed: o.seed ?? 7, layers: 3, density: (o.dens ?? 1.5) * env.snow, fall: 1, wind: 70, gusts: SIM.GUSTS, sway: 1, tone: pale ? 'light' : 'dark', fore: false, alpha: .95 });
  const hh = o.heap ?? (h * (.05 + .42 * env.dep * env.dep));
  sillN(ctx, { x0: x - 4, x1: x + w + 4, y: y + h + 2, depth: hh, seed: o.seed ?? 7, tone: pale ? 'light' : 'dark' });
  if (o.frost !== false) frostN(ctx, { x, y, w, h, amount: env.frost, seed: (o.seed ?? 7) + 2, t: lt, tone: pale ? 'light' : 'dark' });
}

// ------------------------------------------------------------------ the wall: frame of the big window, the glass doors, the clock, the TV, the call board, the exit sign, the emergency lamps
const WALL = '#d6cfbf', WAIN = '#4b7f86', INKC = 'rgba(25,16,30,.62)';
function bigWindow(lt, env, G, o = {}) {
  const W0 = LAY.win, [x, y, w, h] = wbox(W0.x0, W0.y0, W0.x1, W0.y1), fr = Math.max(8, 16 * kzP(ZB));
  ctx.save();
  ctx.fillStyle = '#ece7da'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; rr(x - fr, y - fr, w + 2 * fr, h + 2 * fr, 6); ctx.fill(); ctx.stroke();
  ctx.save(); clipRR(x, y, w, h, 3);
  { const rat = 2.2 * pulse(lt, CUE.windgust, 30, .22) + 1.2 * pulse(lt, CUE.windgust + .5, 26, .2); ctx.translate(rat, 0); }
  skyIn(x, y, w, h, env, { suppressMoon: o.suppressMoon, moonChar: o.moonChar });
  weatherIn(x, y, w, h, env, { seed: 7, dens: 7.5, kids: o.winKids, glints: (gx, gy, gw, gh) => paneGlints(lt, gx, gy, gw, gh) });
  ctx.globalCompositeOperation = 'screen';                                 /* a glint of the room on the glass */
  ctx.fillStyle = lg(x, y, x + w * .5, y + h, [[0, 'rgba(255,255,255,.07)'], [.5, 'rgba(255,255,255,.02)'], [1, 'rgba(255,255,255,0)']]);
  ctx.beginPath(); ctx.moveTo(x + w * .08, y); ctx.lineTo(x + w * .3, y); ctx.lineTo(x + w * .12, y + h); ctx.lineTo(x - w * .1, y + h); ctx.closePath(); ctx.fill();
  ctx.restore();
  const mx = x + w * (-LAY.win.x0 - 110) / (LAY.win.x1 - LAY.win.x0);       /* one mullion, off centre (the Moon sets in the wide right pane) */
  ctx.fillStyle = '#ece7da'; ctx.fillRect(mx - fr * .45, y, fr * .9, h); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.strokeRect(mx - fr * .45, y, fr * .9, h);
  ctx.fillStyle = '#e3dccb'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.2; rr(x - fr * 1.9, y + h + fr * .6, w + fr * 3.8, fr * 1.5, 4); ctx.fill(); ctx.stroke();   /* the inside ledge */
  ctx.restore();
  G.win = { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}
/* the glass doors of the entrance: two leaves, push bars, the lot and the drift outside; `bury` 0..1 is how high the snow stands on the glass */
function glassDoors(lt, env, G, o = {}) {
  const D = LAY.doors, [x, y, w, h] = wbox(D.x0, 0, D.x1, D.y1), fr = Math.max(7, 14 * kzP(ZB)), bury = o.bury ?? (.1 + .16 * env.dep);
  ctx.save();
  ctx.fillStyle = '#3d4350'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; rr(x - fr, y - fr, w + 2 * fr, h + fr, 5); ctx.fill(); ctx.stroke();
  ctx.save(); clipRR(x, y, w, h, 2);
  skyIn(x, y, w, h, env, { suppressMoon: true, cars: false, noMoon: true });
  const pane = (px, pw) => {                                              /* outside, seen through one leaf */
    ctx.save(); clipRR(px, y + fr, pw, h - fr * 2.4, 3);
    snowN(ctx, { x0: px, y0: y, x1: px + pw, y1: y + h, t: lt, seed: 11, layers: 3, density: 9 * env.snow, fall: 1, wind: 80, gusts: SIM.GUSTS, tone: env.sun > .35 ? 'light' : 'dark', fore: false, alpha: .95 });
    if (o.kids) o.kids(px, y, pw, h);
    snowMass(px, pw, y + h - fr * .8, bury * h, lt, env);
    frostN(ctx, { x: px, y: y + fr, w: pw, h: h - fr * 2.4, amount: env.frost * .8, seed: 13, t: lt, tone: 'dark' });
    ctx.restore();
  };
  const pw = (w - fr * 3) / 2;
  pane(x + fr * .5, pw); pane(x + fr * 2.5 + pw, pw);
  ctx.restore();
  ctx.fillStyle = '#8f98a6'; ctx.strokeStyle = INKC; ctx.lineWidth = 2;                                                  /* aluminium: the stile between the leaves, push bars, kick plates */
  rr(x + w / 2 - fr * .6, y, fr * 1.2, h, 3); ctx.fill(); ctx.stroke();
  for (const bx of [x + w / 2 - fr * 2.1, x + w / 2 + fr * 1.1]) { rr(bx, y + h * .52, fr * 1.0, h * .09, 4); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#6c7482'; ctx.fillRect(x + fr * .2, y + h - fr * 2.2, w - fr * .4, fr * 2.2);
  ctx.restore();
  G.doors = { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}
/* a smooth mass of snow standing against the glass: level hh (px) with a gently waving top, a leading crest while the wave rises (28.35 .. 29.35), blue shade below, sparkles */
function snowMass(px, pw, yb, hh, lt, env) {
  const wave = sg(lt, 28.35, 29.35) * (1 - sg(lt, 29.35, 29.6)), n = 14, tone = env.sun;
  if (hh < 3) return;
  ctx.save();
  const top = yb - hh;
  ctx.beginPath(); ctx.moveTo(px - 4, yb + 6);
  for (let i = 0; i <= n; i++) { const u = i / n, x = px + u * pw, y = top - 6 * Math.sin(u * 5 + lt * .9 + px * .01) - 14 * wave * Math.sin(u * PI * 1.5 + lt * 3); ctx.lineTo(x, y); }
  ctx.lineTo(px + pw + 4, yb + 6); ctx.closePath();
  ctx.fillStyle = lg(0, top, 0, yb, [[0, rgbs(mixa([246, 250, 255], [255, 240, 214], tone * .5))], [.55, rgbs(mixa([210, 222, 246], [240, 214, 190], tone * .5))], [1, rgbs(mixa([150, 170, 214], [196, 168, 170], tone * .5))]]); ctx.fill();
  ctx.strokeStyle = 'rgba(60,80,130,.35)'; ctx.lineWidth = 2; ctx.stroke();
  if (wave > .02) { for (let i = 0; i < 5; i++) { const u = (i + .5) / 5, r = (10 + 8 * sr(i, 31)) * wave; ctx.fillStyle = 'rgba(255,255,255,' + (.85 * wave) + ')'; ctx.beginPath(); ctx.arc(px + u * pw, top - 10 * wave * Math.sin(u * PI * 1.5 + lt * 3) - 4, r, 0, TAU); ctx.fill(); } }
  ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 7; i++) { const a = .5 + .5 * Math.sin(lt * 2.4 + i * 1.9); ctx.globalAlpha = a * .7; ell(px + sr(i, 41) * pw, top + 10 + sr(i, 43) * Math.max(4, hh - 14), 1.6, 1.6); ctx.fill(); }
  ctx.restore();
}
/* the wall clock: a round dial with hands that whirl in the lapse and a green LCD strip under it with the time (UI kit; hero only when it comes out big) */
function wallClock(lt, env, G, o = {}) {
  const C = LAY.clock, [cx, cy] = wpt(C.X, C.Y), R = C.r * kzP(ZB), tk = CUE.clocktick, tk2 = CUE.clocktick2;
  let m = env.m;
  if (lt >= tk2 && lt < tk2 + .2) m = lerp(1379 + tk2 / 60, 1380, eb(sg(lt, tk2, tk2 + .2)));                 /* the minute hand drops onto 11:00 on the tick */
  const Ph = SIM.clockParts(m), P = SIM.clockParts(env.m), jolt = (pulse(lt, tk, 40, .06) + pulse(lt, tk2, 40, .06)) * .05;
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(3, 5, R * 1.07, R * 1.07); ctx.fill();
  ctx.fillStyle = '#2b2f3a'; ell(0, 0, R * 1.06, R * 1.06); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = lg(0, -R, 0, R, [[0, '#fbf8ee'], [1, '#e4dfcf']]); ell(0, 0, R * .94, R * .94); ctx.fill();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = big ? Math.max(2, R * .06) : Math.max(1, R * .02); ctx.beginPath(); ctx.moveTo(Math.sin(a) * R * (big ? .74 : .82), -Math.cos(a) * R * (big ? .74 : .82)); ctx.lineTo(Math.sin(a) * R * .88, -Math.cos(a) * R * .88); ctx.stroke(); }
  const hand = (ang, len, wd, col) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-Math.sin(ang) * len * .14, Math.cos(ang) * len * .14); ctx.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len); ctx.stroke(); };
  hand(Ph.hourAng, R * .5, Math.max(3, R * .09), '#23202a'); hand(Ph.minAng + jolt, R * .78, Math.max(2.4, R * .06), '#23202a');
  ctx.fillStyle = '#c1121f'; ell(0, 0, R * .07, R * .07); ctx.fill();
  const bx = -R * .95, bw = R * 1.9, by = R * 1.2, bh = R * .56;                                                    /* the LCD strip */
  ctx.fillStyle = '#0d1f24'; ctx.strokeStyle = INKC; ctx.lineWidth = 2; rr(bx, by, bw, bh, bh * .24); ctx.fill(); ctx.stroke();
  UI.container('clk20', 'sign', [cx + bx, cy + by, cx + bx + bw, cy + by + bh], 2);
  ctx.restore();
  const hero = !!o.sharp && R * scrOf(ctx) * .36 >= 28;
  UI.label(P.text + ' ' + P.ampm, cx, cy + R * 1.2 + R * .28, { size: R * .34, weight: 900, fill: '#8dffd0', spacing: R * .01, maxW: R * 1.7, cid: 'clk20', center: true, hero, crop: !hero });
  glowN(cx, cy + R * 1.48, R * 1.4, '120,255,208', .12, 0);
  G.clock = { cx, cy, R, text: P.text };
}
function darkTV(lt, env, G) {
  const [x, y, w, h] = wbox(-760, 640, -480, 820), t = lt;
  ctx.save(); ctx.fillStyle = '#16181f'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; rr(x - 6, y - 6, w + 12, h + 12, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = lg(x, y, x + w, y + h, [[0, '#2a2f3d'], [.5, '#181b25'], [1, '#232837']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.beginPath(); ctx.moveTo(x + w * .1, y); ctx.lineTo(x + w * .34, y); ctx.lineTo(x + w * .16, y + h); ctx.lineTo(x - w * .08, y + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = Math.sin(t * 1.4) > -.3 ? '#ff3b30' : '#6a1d19'; ell(x + w - 10, y + h + 1, 2.6, 2.6); ctx.fill();    /* the standby LED */
  ctx.restore();
  G.tv = { x, y, w, h };
}
function callBoard(lt, G) {
  const [x, y, w, h] = wbox(370, 720, 620, 870);
  S13.callBoard(x, y, w, h, i => (i === 9 || i === 22) ? [S13.CALLCOL.red, .12 + .88 * c01(SIM.calls(lt, i === 9 ? 0 : 1))] : null, { t: lt, hero: false, title: '' });
  G.board = { x, y, w, h, d1: [x + w * .19, y + h * .44], d2: [x + w * .63, y + h * .8] };
}
function exitSignN(lt, G) {
  const [cx, cy] = wpt(495, 640), k = kzP(ZB);
  if (has('P20', 'exitSign')) P20.exitSign(ctx, { x: cx, y: cy, s: k * 1.1, t: lt });
  else {
    const w = 120 * k, h = 52 * k;
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#0f6a3a'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; rr(-w / 2, -h / 2, w, h, 5 * k); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eaffee'; ctx.beginPath(); ctx.arc(-w * .3, -h * .15, h * .1, 0, TAU); ctx.fill(); ctx.fillRect(-w * .34, -h * .05, h * .1, h * .3);
    ctx.restore();
    UI.label('EXIT', cx + w * .12, cy, { size: h * .5, weight: 900, fill: '#eaffee', maxW: w * .5, hero: false, crop: true });
    glowN(cx, cy, 130 * k, '60,255,140', .5, .3);
  }
  G.exit = { x: cx, y: cy };
}
function emLampN(lt, X, Y, G, name) {
  const [cx, cy] = wpt(X, Y), k = kzP(ZB);
  if (has('P20', 'emergencyLamp')) P20.emergencyLamp(ctx, { x: cx, y: cy, s: k * 1.2, on: 1, t: lt });
  else {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.fillStyle = '#e9ebef'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; rr(-34, -16, 68, 32, 6); ctx.fill(); ctx.stroke();
    for (const sx of [-1, 1]) { ctx.fillStyle = '#fff6d8'; ell(sx * 40, -4, 13, 11); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ff3b30'; ell(0, 3, 4, 4); ctx.fill();
    ctx.restore();
    glowN(cx + 40 * k, cy - 4 * k, 60 * k, '255,200,120', .22, .3); glowN(cx - 40 * k, cy - 4 * k, 60 * k, '255,200,120', .22, .3);
  }
  G[name] = { x: cx, y: cy };
}

const CSH = 170;                                                           /* the counter is shifted to the right by this much (S13.counter's X range is -120..720 and would hide the fourth cot) */
function counterShifted(fn) { const keep = V2.P.cx; V2.P.cx = keep - CSH; try { fn(); } finally { V2.P.cx = keep; } }
// ------------------------------------------------------------------ the counter's dressing: the desk lamp (it flickers once in the lapse) and the dead coffee maker
function deskLamp(lt, env, G) {
  const X = 20 + CSH, Z = 1450, [bx, by] = wpt(X, LAY.counter.top, Z), k = kzP(Z), on = c01(env.lamp);
  ctx.save(); ctx.translate(bx, by); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 2, 50, 10); ctx.fill();
  ctx.fillStyle = '#3a3f4b'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; rr(-34, -14, 68, 16, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#59616e'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-18, -104); ctx.lineTo(44, -150); ctx.stroke();
  ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-18, -104); ctx.lineTo(44, -150); ctx.stroke();
  ctx.save(); ctx.translate(44, -150); ctx.rotate(.55);
  ctx.fillStyle = on > .5 ? '#e0a63a' : '#a07a30'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-18, -14); ctx.lineTo(18, -14); ctx.lineTo(38, 30); ctx.lineTo(-38, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,190,' + (.35 + .65 * on) + ')'; ctx.fillRect(-30, 26, 60, 8);
  ctx.restore();
  ctx.restore();
  const lx = bx + 44 * k + Math.sin(.55) * 30 * k, ly = by - 150 * k + Math.cos(.55) * 30 * k;
  glowN(lx, ly, 120 * k, '255,210,130', .5 * on, .5);
  G.lamp = { x: lx, y: ly, k, on };
}
function coffeeMaker(lt, env, G) {
  const X = 560 + CSH - 90, Z = 1450, [bx, by] = wpt(X, LAY.counter.top, Z), k = kzP(Z);
  if (has('P20', 'coffeeMaker')) P20.coffeeMaker(ctx, { x: bx, y: by, s: k * .58, power: 0, display: '--:--', pot: .55, sad: 1, t: lt });
  else {
    ctx.save(); ctx.translate(bx, by); ctx.scale(k, k); ctx.lineJoin = 'round';
    ctx.fillStyle = '#2f343f'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; rr(-46, -190, 92, 30, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a404c'; rr(-46, -170, 18, 160, 6); ctx.fill(); ctx.stroke(); rr(-46, -14, 92, 14, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(200,220,255,.28)'; rr(-24, -150, 64, 128, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2a22'; rr(-20, -66, 56, 40, 8); ctx.fill();
    ctx.fillStyle = '#2a0f10'; ell(30, -178, 4, 4); ctx.fill();              /* the status LED: dead */
    ctx.restore();
  }
  G.coffee = { x: bx, y: by - 80 * k };
}
/* the med cart with a 3-11 sticker on its drawer front */
function medCart(lt, env, G, o = {}) {
  const C = LAY.cart, r = S13.medCart(C.X, C.Z, { t: lt, rimA: o.rimA ?? .3 });
  ctx.save(); ctx.translate(r.x, r.y); ctx.scale(r.k, r.k);
  UI.sign([18, -250, 74, 40], '3-11', { fill: '#ffd60a', stroke: '#2a2530', lw: 3, ink: '#2a2530', size: 28, font: 'Bangers', weight: 400, r: 10, hero: false, crop: true, id: 'cartstk' });
  ctx.restore();
  G.cart = { x: r.x, y: r.y, k: r.k };
  return r;
}

/* the counter without its dressing (the Moon shots: nothing in front of his face) */
function plainCounter() {
  const C = LAY.counter;
  S6.box3({ x0: C.x0 + CSH, x1: C.x1 + CSH, y0: 0, y1: C.top, z0: C.z0, z1: C.z1, color: '#b88c58', front: '#b88c58', top: '#ecdcb4', side: '#8a6438', lw: 2.4 });
  S6.box3({ x0: C.x0 - 10 + CSH, x1: C.x1 + 10 + CSH, y0: C.top, y1: C.top + 26, z0: C.z0 - 14, z1: C.z0 + 64, color: '#d6b27a', front: '#caa066', top: '#f6e8c4', side: '#9a7444', lw: 2 });
}
// ------------------------------------------------------------------ the cots (P20.cot) with the sleepers; a pose is a jump: 0 on the back, 1 on the other side (the cot mirrored), 2 and 3 a little curled
const COTW = ['mango', 'lemon', 'tom', 'onion'], COTK = .9;
function cotBase(lt, env, who, o = {}) {
  const C = LAY.cots[who], [cx, cy, k] = V2.proj(C.X, 0, C.Z), s = k * COTK, st = o.stir ?? 0;
  const pose = o.pose ?? 0, flip = pose === 1 || pose === 3, sq = pose >= 2 ? .9 : 1;
  const breathe = 1 + .012 * Math.sin(lt * 1.9 + C.X), tw = st * .03 * Math.sin(lt * 5.1 + C.X);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tw); if (flip) ctx.scale(-1, 1); ctx.scale(1, sq * breathe); ctx.translate(-cx, -cy);
  const r = P20.cot ? P20.cot(ctx, { x: cx, y: cy, s, sleeper: o.sitter ? null : who, zzz: 0, t: lt }) : null;
  ctx.restore();
  return { cx, cy, k, s, flip, r };
}
/* a sleeper sitting up (Tomato in the lapse, Onion at 29.6): the cot without its sleeper, the fruit rising from the pillow, the blanket over the lap */
function cotSitter(lt, env, who, amt, o = {}) {
  const u = easeIO(c01(amt));
  const C = cotBase(lt, env, who, { sitter: true, pose: o.pose ?? 0 }), s = C.s;
  if (u < .02) return null;
  const ctor = who === 'onion' ? A15.onion : who === 'tom' ? A15.tomato : who === 'lemon' ? A7.lemon : A7.mango;
  const ch = ctor(Object.assign({ t: lt, noLegs: true, noShadow: true, noReflect: true, noBob: true, center: true, s: s * lerp(.62, .84, u), x: C.cx + s * lerp(-112, -96, u) * (C.flip ? -1 : 1), y: C.cy - s * lerp(138, 196, u),
    rot: lerp(-PI / 2, -.04, u) * (C.flip ? -1 : 1), expr: o.expr || 'neutral', lid: o.lid ?? lerp(.97, .3, u), look: o.look || [0, .1], arms: { l: 'rest', r: 'rest' } }, o.extra || {}));
  if (who === 'onion') { ch.cry = o.cry ?? .6; ch.sob = o.sob ?? 0; }
  ch.who = o.who;
  drawChar(ch);
  ctx.save(); ctx.translate(C.cx, C.cy); if (C.flip) ctx.scale(-1, 1); ctx.scale(s, s);                      /* the blanket across the lap, folded */
  ctx.fillStyle = lg(0, -120, 0, -70, [[0, '#9aa0ac'], [1, '#6c7280']]); ctx.strokeStyle = 'rgba(20,14,26,.86)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-96, -78); ctx.quadraticCurveTo(-90, -118, -20, -120); ctx.quadraticCurveTo(100, -126, 196, -96); ctx.quadraticCurveTo(204, -86, 200, -74); ctx.quadraticCurveTo(70, -58, -96, -78); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  return { ch, base: C };
}

// ------------------------------------------------------------------ held props of this scene (fp20n_*): the oncoming nurse's tablet and pen, the report sheet, the shift sticker she peels and re-sticks
EXT.prop.fp20n_tablet = (side, o, t) => {
  const S = o.tabScale || 1, on = o.tabOn ?? 1;
  ctx.save(); ctx.rotate(o.tabRot ?? -.1); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = '#1f232c'; ctx.strokeStyle = 'rgba(15,10,22,.95)'; ctx.lineWidth = 3; rr(-40, 4, 80, 112, 9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = lg(0, 12, 0, 108, [[0, '#e6f3ff'], [1, '#a9cdf2']]); rr(-34, 10, 68, 96, 4); ctx.fill();
  ctx.fillStyle = '#2c4f7c'; ctx.fillRect(-34, 10, 68, 12);
  for (let i = 0; i < 5; i++) { const y = 34 + i * 15; ctx.strokeStyle = '#2f6fd0'; ctx.lineWidth = 2.4; ctx.strokeRect(-28, y - 5, 8, 8); if (i < 3 || (o.tabChecks ?? 0) > i - 2) { ctx.strokeStyle = '#1f9a58'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-27, y - 1); ctx.lineTo(-24, y + 2); ctx.lineTo(-20, y - 6); ctx.stroke(); } ctx.fillStyle = 'rgba(40,70,120,.55)'; ctx.fillRect(-14, y - 3, 38 - (i % 3) * 7, 4); }
  ctx.restore();
  if (on > .02) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .5 * on; ctx.fillStyle = V2.radial(0, 60, 6, 120, [[0, 'rgba(170,215,255,.55)'], [1, 'rgba(170,215,255,0)']]); ctx.fillRect(-120, -60, 240, 240); ctx.restore(); }
};
EXT.prop.fp20n_pen = (side, o, t) => {                                          /* the hand holds the back end; the tip points down and in */
  ctx.save(); ctx.rotate(o.penRot ?? .5); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(15,10,22,.95)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 52); ctx.stroke();
  ctx.strokeStyle = '#2a5ac8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, 46); ctx.stroke();
  ctx.strokeStyle = '#e8eef6'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(0, 54); ctx.stroke();
  ctx.restore();
};
EXT.prop.fp20n_sheet = (side, o, t) => {
  ctx.save(); ctx.rotate(o.sheetRot ?? -.06); ctx.lineJoin = 'round';
  ctx.fillStyle = '#fbf9f1'; ctx.strokeStyle = 'rgba(15,10,22,.9)'; ctx.lineWidth = 2.6; ctx.fillRect(-34, 4, 68, 92); ctx.strokeRect(-34, 4, 68, 92);
  ctx.fillStyle = '#b3261e'; ctx.fillRect(-34, 4, 68, 8);
  ctx.fillStyle = 'rgba(40,40,60,.5)'; for (let i = 0; i < 6; i++) ctx.fillRect(-26, 22 + i * 12, 52 - (i % 3) * 10, 3);
  ctx.restore();
};
/* the shift sticker: a round yellow label (3-11, turned over it reads 11-7), peeled from the badge (curl 0..1 lifts one edge), turned over (flip 0..1) and pressed back on */
EXT.prop.fp20n_sticker = (side, o, t) => {
  const R = 33 * (o.stkScale || 1), flip = c01(o.stkFlip ?? 0), curl = c01(o.stkCurl ?? 0), cs = Math.cos(flip * PI), back = flip > .5;
  ctx.save(); ctx.rotate(o.stkRot ?? -.15); ctx.translate(0, -R * 1.25);
  ctx.save(); ctx.scale(Math.max(.06, Math.abs(cs)), 1); ctx.lineJoin = 'round';
  ctx.fillStyle = back ? '#ffe36a' : '#ffd60a'; ctx.strokeStyle = 'rgba(40,28,6,.9)'; ctx.lineWidth = 3.2; ell(0, 0, R, R); ctx.fill(); ctx.stroke();
  if (curl > .02) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(R * .9, -R * .4); ctx.quadraticCurveTo(R * (.9 + .5 * curl), -R * .1, R * .6, R * .55 * curl + R * .1); ctx.lineTo(R * .55, R * .1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  const txt = back ? '11-7' : '3-11', wd = Math.abs(cs), hero = wd > .8 && heroAt(R * .86);
  if (wd > .22) { ctx.save(); ctx.scale(wd, 1); UI.label(txt, 0, 1, { size: R * (back ? .8 : .86), font: 'Bangers', weight: 400, fill: '#2a2530', maxW: R * 1.5, spacing: 1, hero, crop: !hero }); ctx.restore(); }
  ctx.restore();
};
Object.assign(PROP_BOX, { fp20n_tablet: Object.assign([-46, -2, 46, 120], { nearFace: true }), fp20n_pen: Object.assign([-12, -6, 12, 56], { nearFace: true }), fp20n_sheet: Object.assign([-38, 0, 38, 100], { nearFace: true }), fp20n_sticker: Object.assign([-34, -70, 34, 4], { nearFace: true }) });
/* the clip-on PER DIEM badge of the earlier episodes (perdiem9), with a slot for the shift sticker: o.stk = 'xx' draws it, o.stkPop 0..1 stamps it down */
EXT.acc.fp20n_idc = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(k.rx * .54, k.ry * .38); ctx.rotate(.05 * Math.sin(t * 2.1));
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
  ctx.fillStyle = '#c0c6cf'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-9, -7, 18, 12, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.lineWidth = 3; rr(-26, 12, 52, 58, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; rr(-26, 12, 52, 18, 6); ctx.fill(); ctx.stroke();
  if (!o.stkHeld) text('PER DIEM', 0, 22, { size: 9, fill: '#fff', weight: 900, spacing: .4, maxW: 50 });
  if (o.stk) {
    const pop = o.stkPop ?? 1, sc = pop < 1 ? 1 + .28 * Math.sin(pop * PI) : 1;
    ctx.save(); ctx.translate(0, 47); ctx.scale(sc, sc); ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = 'rgba(40,28,6,.9)'; ctx.lineWidth = 2.2; ell(0, 0, 15, 15); ctx.fill(); ctx.stroke();
    text(o.stk, 0, 1, { size: 13, font: 'Bangers', weight: 400, fill: '#2a2530', maxW: 26 });
    ctx.restore();
  } else { ctx.strokeStyle = 'rgba(120,110,90,.55)'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]); ell(0, 47, 14, 14); ctx.stroke(); ctx.setLineDash([]); }
  ctx.fillStyle = INK; rr(-18, 63, 36, 4, 2); ctx.fill();
  ctx.restore();
};
if (window.V2C && V2C.ACC_CLS) { V2C.ACC_CLS.fp20n_idc = 'decal'; if (V2C.ACC_W) V2C.ACC_W.fp20n_idc = 60; }

// ------------------------------------------------------------------ the shots (scene-local seconds, snapped to the video frame; a boundary frame belongs to the NEW shot: look up with an epsilon)
const SH = [
  { id: 'open', s: 0, e: 1.90, k: 'wide', z0: 1.12, z1: 1.24, cx: 530, cy: 850 },
  { id: 's1', s: 1.90, e: 3.316, k: 'cu', foc: 'straw', z: 2.15, dz: .2, up: 150 },
  { id: 'w1', s: 3.316, e: 3.90, k: 'clock', z: 2.2, dz: .2 },
  { id: 'w1b', s: 3.90, e: 4.30, k: 'doors', z: 2.0, dz: .08 },
  { id: 'w2', s: 4.30, e: 4.866, k: 'cu', foc: 'straw', z: 2.0, dz: .15, up: 150 },
  { id: 's2', s: 4.866, e: 6.249, k: 'cu', foc: 'straw', z: 2.1, dz: .3, up: 150 },
  { id: 't1', s: 6.249, e: 7.941, k: 'two', z: 1.2, dz: .12 },
  { id: 't2', s: 7.941, e: 8.967, k: 'cu', foc: 'on', z: 2.15, dz: .2, up: 150 },
  { id: 't3', s: 8.967, e: 9.845, k: 'cu', foc: 'out', z: 2.25, dz: .2, up: 150 },
  { id: 't4', s: 9.845, e: 10.653, k: 'two', z: 1.3, dz: .06 },
  { id: 'lapse', s: 10.653, e: 18.653, k: 'lapse', z: 1.3, cx: 530, cy: 850 },
  { id: 'mo1', s: 18.653, e: 20.70, k: 'moon', z: 1.75, dz: .12 },
  { id: 's7', s: 20.70, e: 21.55, k: 'cu', foc: 'straw', z: 2.15, dz: .12, up: 150 },
  { id: 'mo2', s: 21.55, e: 22.90, k: 'moon2', z: 1.5, dz: .08 },
  { id: 's8', s: 22.90, e: 23.718, k: 'cu', foc: 'straw', z: 2.2, dz: .1, up: 150 },
  { id: 'mo3', s: 23.718, e: 24.78, k: 'moon', z: 1.85, dz: .1 },
  { id: 's9', s: 24.78, e: 25.689, k: 'cu', foc: 'straw', z: 2.05, dz: .2, up: 150 },
  { id: 'dawn', s: 25.689, e: 27.739, k: 'wide', z0: 1.2, z1: 1.36, cx: 535, cy: 850, dx: 40 },
  { id: 'tu3', s: 27.739, e: 29.605, k: 'plow', z: 2.0 },
  { id: 'o5', s: 29.605, e: 31.338, k: 'cu', foc: 'onion', z: 3.0, dz: .2, up: 120 },
  { id: 's10', s: 31.338, e: 32.412, k: 'cu', foc: 'straw', z: 2.15, dz: .15, up: 150 },
  { id: 'end', s: 32.412, e: 99, k: 'wide', z0: 1.3, z1: 1.2, cx: 530, cy: 850 },
];
for (const sh of SH) sh.s = sh.s === 0 ? 0 : snapT(sh.s);
const shotAt = lt => { let r = SH[0]; for (const sh of SH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const nearCut = lt => SH.some(sh => sh.s > 0 && Math.abs(lt - sh.s) < .045);          /* motion blur is off around a cut (a cut inside the shutter is a double exposure) */

// ------------------------------------------------------------------ the cast
const mouthOf = o => { const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), yw = o.headYaw ?? o.yaw ?? 0; return [o.x + Math.sin(yw) * k.rx * .5 * s, o.y - (o.lift || 0) - (legLen + k.ry * .9 - k.mouthY) * s]; };
/* Strawberry (the per diem look of Episode 11: steth, bandage, PER DIEM badge with a slot for the shift sticker) placed on the floor of the room at world (X, Z) */
function strawAt(lt, X, Z, extra = {}) {
  const q = V2.at(X, Z);
  const o = A11.straw(Object.assign(q, { t: lt, expr: 'dead', lid: .5, plant: true, acc: ['steth', 'bandage7', 'fp20n_idc'], stk: '3-11' }, extra));
  return o;
}
const HOME = LAY.home;
/* the standing Strawberry of the first third: her head follows the doors, then the clock; the shoulders drop in w2; she turns to the camera in s2 */
function strawIdle(lt) {
  const sl = lt < 1.9 ? 0 : 1;
  const drop = ss(lt, 4.2, 4.75) * (1 - ss(lt, 4.87, 5.6));
  const toDoor = [.9, 0], toClock = [-.6, -.7];
  const lookv = lt < 2.9 ? toDoor : lt < 3.25 ? mixa(toDoor, toClock, ss(lt, 2.9, 3.2)) : lt < 4.2 ? toClock : mixa(toClock, [.1, .5], ss(lt, 4.2, 4.6));
  const yaw = lt < 4.866 ? K([[0, .45], [3.0, .55], [3.4, -.2], [4.2, -.25], [4.8, .1]], lt) : K([[4.866, .1], [5.4, .05], [6.2, 0]], lt);
  const hyaw = lt < 4.866 ? K([[0, .55], [2.8, .75], [3.25, -.45], [4.2, -.4], [4.8, 0]], lt) : K([[4.866, 0], [6.2, 0]], lt);
  return strawAt(lt, HOME.X, HOME.Z, { yaw, headYaw: hyaw, look: lookv, lid: lerp(.5, .66, drop), squash: .06 * drop, arms: { l: 'rest', r: 'rest' }, expr: lt >= 5.3 ? 'neutral' : 'dead', browUp: lt >= 5.3 ? ss(lt, 5.3, 5.9) * 6 : 0 });
}

// ------------------------------------------------------------------ the room, whole: shell, ceiling, the back wall, the cots; returns the geometry the lighting needs
const CEIL = [[-640, 1500, 0], [0, 1500, 1], [640, 1500, 0], [-640, 1760, 0], [0, 1760, 0], [640, 1760, 1]];        /* ceiling lamps: [X, Z, on]; half of them are off on the generator */
function doorBury(lt, env) {
  const base = .1 + .16 * env.dep, wave = ss(lt, 28.35, 29.35);                                                       /* the plow's wave slides up the glass at the end */
  return lerp(base, .93, wave);
}
function drawRoom(lt, env, o = {}) {
  const G = {};
  S6.shell({ zb: ZB, hw: LAY.hw, ch: LAY.ch, wall: WALL, wain: WAIN, floorA: '#c9c0ae', floorB: '#9d9482', ceil: '#d9d8d2', fog: '#8a90a8', fogAmt: .2, tile: 140, bright: 1, rail: 130 });
  CEIL.forEach(([X, Z, on]) => S6.ceilingLamp(X, Z, LAY.ch, on, '214,230,255', 90, 150));
  G.ceil = CEIL.filter(c => c[2]).map(([X, Z]) => wpt(X, LAY.ch - 2, Z + 75));
  darkTV(lt, env, G);
  bigWindow(lt, env, G, o);
  glassDoors(lt, env, G, { bury: doorBury(lt, env), kids: o.doorKids });
  wallClock(lt, env, G, o);
  callBoard(lt, G);
  exitSignN(lt, G);
  emLampN(lt, -560, 960, G, 'em1'); emLampN(lt, 740, 720, G, 'em2');
  /* the cots, heads to the left, against the back wall; the poses jump in the lapse, the sleepers stir at the dawn */
  const sl = SIM.sleepers(lt), stir = ss(lt, 25.5, 27.5) * (1 - ss(lt, 29.2, 29.6));
  G.cots = {};
  for (const who of COTW) {
    const sit = who === 'tom' ? sl.tom.sit : 0, onionUp = who === 'onion' ? ss(lt, 29.05, 29.6) : 0, amt = Math.max(sit, onionUp);
    const pose = lt >= L.t1 ? (who === 'mango' ? 2 : who === 'lemon' ? 0 : who === 'tom' ? 2 : 1) : sl[who].pose;
    if (o.noCots) continue;
    if (amt > .02) G.cots[who] = cotSitter(lt, env, who, amt, who === 'onion' ? { pose, cry: .62, sob: Math.max(0, 1 - Math.abs(lt - CUE.sniffle - .12) / .5), expr: 'onion_cry', lid: .3, who: o.onionWho } : { pose, expr: 'shock', lid: .1 });
    else G.cots[who] = cotBase(lt, env, who, { pose, stir });
  }
  return G;
}

// ------------------------------------------------------------------ the twin: ONE Strawberry drawn twice, facing each other across the med cart
const TW = { out: [-85, 1185], on: [285, 1185] };
function twinSpeaker(lt) { return lt < 7.89 ? 'out' : lt < 8.917 ? 'on' : lt < 9.795 ? 'out' : 'on'; }
function twinOut(lt, sh) {
  const sp = twinSpeaker(lt) === 'out' && lt < 10.5;
  const yaw = 0, hy = K([[6.1, .4], [6.6, .55], [8.0, .4], [8.9, .55]], lt);
  return strawAt(lt, TW.out[0], TW.out[1], { id: 'strawout', seed: 3, yaw, headYaw: hy, look: [.55, .2 + .3 * Math.sin(lt * .8)], expr: 'dead', lid: sp ? .5 : .62, squash: .06, rot: -.025, who: sp ? 'straw' : null, stk: '3-11',
    arms: { l: 'rest', r: 'hold' }, grip: { r: [78, 72 + 4 * Math.sin(lt * 1.6)] }, hold: { r: 'fp20n_sheet' }, sheetRot: .06, browUp: -3 });
}
function twinOn(lt, sh) {
  const sp = twinSpeaker(lt) === 'on', t0 = CUE.badgepeel;
  const yaw = 0, hy = K([[6.1, -.35], [6.6, -.55], [9.6, -.5]], lt);
  /* the badge: peel (6.77), lift and turn over (7.05 .. 7.45), press back (7.45 .. 7.72), then it reads 11-7 */
  const peel = ss(lt, t0, t0 + .28), held = lt >= t0 && lt < t0 + .98, flip = ss(lt, t0 + .36, t0 + .68), press = lt >= t0 + .98 ? 1 : 0;
  const stk = lt < t0 ? '3-11' : press ? '11-7' : null;
  const o = strawAt(lt, TW.on[0], TW.on[1], { id: 'strawon', seed: 11, yaw, headYaw: hy, look: [-.5, .1], expr: 'neutral', lid: .18, who: sp ? 'straw' : null, stk, stkHeld: held, stkPop: press ? c01((lt - t0 - .98) / .22) : 1, plant: true, acc: ['steth', 'bandage7', 'fp20n_idc'] });
  const writing = lt >= 9.7;
  if (held) {
    const up = easeIO(sg(lt, t0 + .1, t0 + .4)), back = easeIO(sg(lt, t0 + .72, t0 + .98));
    const gx = lerp(lerp(66, 112, up), 66, back), gy = lerp(lerp(98, 92, up), 98, back);
    Object.assign(o, { arms: { l: 'hold', r: 'hold' }, hold: { l: 'fp20n_tablet', r: 'fp20n_sticker' }, grip: { l: [-62, 76], r: [gx, gy] }, stkFlip: flip, stkCurl: 1 - ss(lt, t0 + .5, t0 + .7), stkRot: -.1, stkScale: .9, tabRot: .08, tabScale: .9 });
  } else {
    Object.assign(o, writing ? { arms: { l: 'hold', r: 'hold' }, hold: { l: 'fp20n_tablet', r: 'fp20n_pen' }, grip: { l: [-62, 78], r: [40 + 5 * Math.sin(lt * 13), 88 + 3 * Math.sin(lt * 17)] }, tabRot: .08, tabScale: .9, penRot: .9, tabChecks: 1.5 }
      : { arms: { l: 'hold', r: 'rest' }, hold: { l: 'fp20n_tablet' }, grip: { l: [-78, 70] }, tabRot: .08, tabScale: .9, tabChecks: 0 });
  }
  return o;
}
/* Strawberry after the night: tired, in the first sun; she follows the Moon, then the clock */
function strawPost(lt) {
  const x = HOME.X - 40;
  const yaw = K([[18.6, .2], [19.6, -.5], [20.8, -.55], [21.5, -.4], [22.9, .05], [24.0, .15], [25.7, .1], [28.0, -.35], [31.3, 0], [32.4, -.3], [33.3, -.55]], lt);
  const hyaw = K([[18.6, .2], [19.5, -.6], [20.8, -.6], [21.5, -.55], [22.2, -.5], [22.9, 0], [25.7, 0], [28.0, -.6], [31.3, .1], [32.5, -.4]], lt);
  const look = lt < 20.8 ? [-.5, -.1] : lt < 21.6 ? [-.5, -.9] : lt < 22.9 ? [-.4, -.5] : [0, .05];
  const blink = ss(lt, 25.0, 25.22) * (1 - ss(lt, 25.3, 25.55)), blink2 = ss(lt, 31.7, 31.85) * (1 - ss(lt, 31.95, 32.15));
  const happy = ss(lt, 25.4, 25.8) * (1 - ss(lt, 26.8, 27.4));
  return strawAt(lt, x, HOME.Z + 10, { yaw, headYaw: hyaw, look, lid: Math.max(lerp(.5, .4, ss(lt, 20.8, 21.2)), blink * .95, blink2 * .95), expr: happy > .05 ? 'chill' : 'dead', browUp: (lt >= 22.9 && lt < 23.7) ? 9 * ss(lt, 22.9, 23.1) : 0,
    arms: { l: lt >= 32.75 ? 'hold' : 'rest', r: 'rest' }, hold: lt >= 32.75 ? { l: 'fp18_medcup' } : {}, cupScale: 1.4, cupTip: .08 * Math.sin(lt * 2.1), grip: { l: [-98, 64 + 5 * ss(lt, 32.75, 33.4)] }, squash: .02 * Math.sin(lt * 1.3) });
}
// ------------------------------------------------------------------ the lapse: Strawberry's rounds with a ghost trail (earlier positions at fading alpha: motion trails instead of blur), drawn before her
function roundsOpts(tt, o = {}) {
  const r = SIM.rounds(tt), dxs = r.dx, dzs = r.dz, ax = Math.abs(dzs) > Math.abs(dxs) * 1.2 ? 'z' : 'x';
  const e = { yaw: r.yaw, headYaw: r.yaw, look: [r.walking ? 0 : .2, .1], expr: 'dead', lid: .5, arms: { l: 'rest', r: 'rest' } };
  if (r.walking) Object.assign(e, { gaitW: SIM.gait(tt), axis: ax, dir: ax === 'z' ? -Math.sign(dzs) : Math.sign(dxs), vx: clamp(dxs * 900, -1400, 1400) });
  return { o: strawAt(tt, r.X, r.Z, Object.assign(e, o)), r };
}

// ------------------------------------------------------------------ who is in the picture at lt: [{ name, o, z }] (the focus of a close-up is looked up by name)
function castFor(lt, sh) {
  const C = [];
  if (EMPTY(sh)) return C;
  const add = (name, o, z) => C.push({ name, o, z });
  if (lt < 6.249) add('straw', strawIdle(lt), HOME.Z);
  else if (lt < L.t0) { add('out', twinOut(lt, sh), TW.out[1]); add('on', twinOn(lt, sh), TW.on[1]); }
  else if (lt < L.t1) { const m = roundsOpts(lt); add('straw', m.o, m.r.Z); }
  else add('straw', strawPost(lt), HOME.Z + 10);
  return C;
}
const EMPTY = sh => sh.k === 'moon' || sh.k === 'moon2' || sh.k === 'clock' || sh.k === 'plow' || sh.k === 'doors';     /* shots with no one in them */
/* is this character entirely inside the frame? (one cut by the frame edge is left out of the shot instead: no half faces, no slivers) */
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function inFrame(o) {
  const b = boxOf(o, 34), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
const faceOf = o => { const f = faceC(o); return f; };

// ------------------------------------------------------------------ cameras: the perspective camera is the same for every shot; the 2D camera frames it
let FR = null;                                                            /* { sh, env, C } of the frame being drawn, built in cam() */
const WIDE = { x: 520, y: 776 };
function camFor(lt, sh, C, env) {
  const u = sg(lt, sh.s, Math.min(sh.e, sh.s + 3)), e = easeIO(sg(lt, sh.s, Math.min(sh.e, sh.s + 4)));
  const zz = sh.z0 !== undefined ? lerp(sh.z0, sh.z1, easeIO(sg(lt, sh.s, Math.min(sh.e, sh.s + 3.5)))) : (sh.z || 1) + (sh.dz || 0) * u;
  switch (sh.k) {
    case 'wide': zoomTo(sh.cx + (sh.dx || 0) * e, sh.cy, zz); break;
    case 'lapse': zoomTo(sh.cx, sh.cy, zz); break;
    case 'cu': {
      const f = sh.foc === 'onion' ? onionFace() : (C.find(c => c.name === sh.foc) || C[0]).o;
      if (sh.foc === 'onion') zoomTo(f[0], f[1] + sh.up / zz, zz);
      else { const [fx, fy] = faceC(f); zoomTo(fx, fy + sh.up / zz, zz); }
      break;
    }
    case 'two': {                                                           /* both Strawberries whole in the frame: the zoom is capped so that the pair fits with a margin */
      const A = C.find(c => c.name === 'out').o, B = C.find(c => c.name === 'on').o, a = faceC(A), b = faceC(B), ba = boxOf(A, 22), bb = boxOf(B, 22);
      const x0 = Math.min(ba[0], bb[0]), x1 = Math.max(ba[2], bb[2]), zf = Math.min(zz, (W - 110) / (x1 - x0));
      zoomTo((x0 + x1) / 2, (a[1] + b[1]) / 2 + 150 / zf, zf); break;
    }
    case 'doors': { const d = wbox(LAY.doors.x0, 0, LAY.doors.x1, LAY.doors.y1); zoomTo(d[0] + d[2] / 2 - 20, d[1] + d[3] * .42, zz); break; }
    case 'clock': { const g = wallClockPos(), w = winRect(); zoomTo(g.cx + 8, lerp(g.cy, w.y + w.h * .4, .62), zz); break; }
    case 'moon': { const w = winRect(), mo = env.mo; zoomTo(w.x + w.w * lerp(.5, mo.u, .55), w.y + w.h * lerp(.5, 1 - mo.v, .55) + 20, zz); break; }
    case 'moon2': { const g = wallClockPos(), w = winRect(); zoomTo(w.x + w.w * .55, lerp(g.cy, w.y + w.h * .55, .5) + 10, zz); break; }
    case 'plow': { const p = plowAt(lt); zoomTo(p.cabX + 70, p.gy - 254 * p.s + 40 / zz, zz); break; }
  }
}
const winRect = () => { const [x, y, w, h] = wbox(LAY.win.x0, LAY.win.y0, LAY.win.x1, LAY.win.y1); return { x, y, w, h }; };
const wallClockPos = () => { const [cx, cy] = wpt(LAY.clock.X, LAY.clock.Y); return { cx, cy, R: LAY.clock.r * kzP(ZB) }; };
/* Onion's face when she sits up on her cot (the cot is placed in the room, so this reads the same numbers as cotSitter) */
function onionFace() {
  const C = LAY.cots.onion, [cx, cy, k] = V2.proj(C.X, 0, C.Z), s = k * COTK, u = easeIO(c01(ss(FR ? FR.lt : 30, 29.05, 29.6)));
  return [cx + s * lerp(-112, -96, u), cy - s * lerp(138, 196, u) + 10 * s];
}

// ------------------------------------------------------------------ the light: ONE pass over the finished picture (L20.pass). Night is deep blue, never black; every speaking face has a light that is in the frame.
const NIGHT_TINT = [30, 48, 100], DAWN_TINT = [112, 92, 104];
function lightsFor(lt, env, G, sh, C) {
  const sun = env.sun, warm = c01(sun * 1.15), L_ = [];
  const winCol = hex(mixa([150, 184, 255], [255, 206, 140], warm)), dawnPow = 1 + .1 * sun;
  if (G.win) L_.push({ kind: 'rect', x: G.win.cx, y: G.win.cy, w: G.win.w, h: G.win.h, soft: .55, color: winCol, power: .7 * dawnPow, facing: PI / 2, spill: 820, soft: .9 });
  if (G.doors) L_.push({ kind: 'rect', x: G.doors.cx, y: G.doors.cy, w: G.doors.w, h: G.doors.h, soft: .5, color: winCol, power: .85, facing: PI / 2, spill: 520 });
  if (G.clock) L_.push({ kind: 'point', x: G.clock.cx, y: G.clock.cy + G.clock.R * .6, r: G.clock.R * 2.6, soft: .9, color: '#dbe8ff', power: .4 });
  if (G.lamp) L_.push({ kind: 'point', x: G.lamp.x, y: G.lamp.y, r: 430 * G.lamp.k, soft: .75, color: '#ffbc66', power: 1.0 * G.lamp.on, flicker: { seed: 5, amt: .05, rate: .8 } });
  if (G.exit) L_.push({ kind: 'point', x: G.exit.x, y: G.exit.y + 30, r: 190, soft: .8, color: '#46ff90', power: .55 });
  for (const k of ['em1', 'em2']) if (G[k]) L_.push({ kind: 'point', x: G[k].x, y: G[k].y + 40, r: 260, soft: .85, color: '#ff9a50', power: .5 });
  if (G.board) { L_.push({ kind: 'point', x: G.board.d1[0], y: G.board.d1[1], r: 70, soft: .6, color: '#ff5a64', power: .5 + .5 * SIM.calls(lt, 0) }); L_.push({ kind: 'point', x: G.board.d2[0], y: G.board.d2[1], r: 70, soft: .6, color: '#ff5a64', power: .5 + .5 * SIM.calls(lt, 1) }); }
  for (const p of G.ceil || []) L_.push({ kind: 'point', x: p[0], y: p[1] + 80, r: 280, soft: .8, color: '#cfe0ff', power: .6 });
  const cp = wpt(LAY.cart.X, 330, LAY.cart.Z), ck = kzP(LAY.cart.Z);
  L_.push({ kind: 'rect', x: cp[0] + 40 * ck, y: cp[1] - 10 * ck, w: 120 * ck, h: 70 * ck, soft: .6, color: '#bcd8ff', power: .8, facing: -PI / 2, spill: 300 });          /* the cart's screen */
  if (G.cots && G.cots.tom) { const c = G.cots.tom; L_.push({ kind: 'point', x: c.cx - 40, y: c.cy - 60, r: 520 * c.k, soft: .8, color: '#ffcf9a', power: .42 }); }
  /* the face of whoever the shot is on: lit by the cart's screen and the lamp (a soft fill; the speaker's key) */
  for (const c of C) {
    if (!(sh.k === 'cu' || sh.k === 'two' || sh.k === 'lapse' || sh.k === 'wide')) continue;
    const f = faceC(c.o), s = c.o.s || 1, own = sh.k === 'cu' ? (sh.foc === c.name ? 1 : .3) : sh.k === 'two' ? .75 : .4;
    L_.push({ kind: 'rect', x: f[0], y: f[1] + 30 * s, w: 250 * s * (sh.k === 'cu' ? 1.1 : 1), h: 330 * s, soft: 1, color: hex(mixa([196, 214, 255], [255, 206, 150], .5 + .4 * sun)), power: own * .7 });
  }
  return L_;
}
function lightPass(lt, env, G, sh, C) {
  const sun = env.sun, amb = .34 + .27 * Math.pow(sun, 1.1), tint = hex(mixa(NIGHT_TINT, DAWN_TINT, sun));
  if (!has('L20', 'pass')) return;
  L20.pass(ctx, { ambient: amb, tint, lights: lightsFor(lt, env, G, sh, C), bloom: .5, vignette: .22, lift: .1, t: lt, glow: .2 });
}

// ------------------------------------------------------------------ the draw of one frame
function drawScene(lt) {
  const { sh, env, C } = FR;
  const blurPx = sh.k === 'cu' ? 9 : sh.k === 'two' ? 5 : 0, sharpClock = sh.k === 'clock' || sh.k === 'moon2';
  const talkMoon = sh.k === 'moon' || sh.k === 'moon2';
  const warm = c01(env.sun * 1.2);
  V2.setLight({ key: [lerp(.5, -.5, warm), -.6], keyColor: hex(mixa([170, 196, 255], [255, 214, 160], warm)), keyA: .22, rim: '#ffb070', rimA: .4, shadow: '#101838', shadowA: .36, bounce: '#ffd9a0', bounceA: .1, amb: '#aab4e8', ambA: .08 });
  V2.opts.reflect = true;
  let G = {};
  const ro = { winKids: () => drawPlow(lt, env, 'win', sh.k === 'plow'), doorKids: () => drawPlow(lt, env, 'doors', false), sharp: sharpClock, suppressMoon: !talkMoon, moonChar: talkMoon ? { expr: 'chill', lid: .22 } : {}, onionWho: sh.id === 'o5' ? 'onion' : undefined, noCots: false };
  const furn = lt2 => [
    { z: 1450, fn: () => { if (sh.k === 'moon' || sh.k === 'moon2' || sh.k === 'plow' || sh.k === 'doors') plainCounter(); else { counterShifted(() => S13.counter({ t: lt, phoneRing: 0, plaque: false })); deskLamp(lt, env, G); coffeeMaker(lt, env, G); } } },
  ].concat(sh.id === 'o5' || sh.k === 'moon' || sh.k === 'moon2' || sh.k === 'plow' || sh.k === 'doors' ? [] : [{ z: LAY.cart.Z, fn: () => medCart(lt, env, G) }]);
  const room = () => { G = Object.assign(G, drawRoom(lt, env, ro)); };
  const chars = C.map(c => ({ z: c.z, fn: () => {
    const f = inFrame(c.o), foc = sh.foc === c.name || sh.k === 'lapse' || sh.k === 'wide';
    if (!foc && sh.k !== 'two' && (!f.inter || !f.whole)) return;
    drawChar(c.o);
  } }));
  if (sh.k === 'lapse') ghosts(lt);
  if (blurPx) {
    REG.suppress++; V2.dof(blurPx, () => { room(); for (const it of furn(lt)) it.fn(); }); REG.suppress--;
    for (const it of chars.sort((a, b) => b.z - a.z)) it.fn();
  } else {
    if (sh.id !== 'o5') REG.suppress++; room(); if (sh.id !== 'o5') REG.suppress--;
    for (const it of furn(lt).concat(chars).sort((a, b) => b.z - a.z)) it.fn();
  }
  /* cold breath (the building is on the generator) */
  for (const c of C) if (c.name !== 'on' || lt < 10) {
    if (sh.k === 'wide') continue;
    const o = c.o, dir = (o.headYaw ?? o.yaw ?? 0) >= 0 ? 1 : -1;
    if (lt < 18 && sh.k !== 'lapse') { const m = mouthOf(o); breathN(ctx, { x: m[0] + dir * 78 * (o.s || 1), y: m[1] - 12 * (o.s || 1), t: lt, seed: c.name === 'on' ? 9 : 4, period: 1.9, dir, size: (o.s || 1) * .85, alpha: .55, phase: c.name === 'on' ? .7 : 0 }); }
  }
  lightPass(lt, env, G, sh, C);
  FR.G = G;
}
/* the ghost trail of the lapse: five earlier positions of her round at fading alpha, drawn BEFORE her (not held to the layout audit: they are trails, not bodies) */
function ghosts(lt) {
  const main = SIM.rounds(lt);
  REG.suppress++;
  for (let g = 5; g >= 1; g--) {
    const tg = lt - g * .062; if (tg < SIM.R.t0 - .05) continue;
    const r = SIM.rounds(tg), d = Math.hypot(r.X - main.X, r.Z - main.Z); if (d < 26) continue;
    const m = roundsOpts(tg, { alpha: .46 * Math.pow(.72, g - 1), noReflect: true, noShadow: true, who: null });
    drawChar(m.o);
  }
  REG.suppress--;
}


/* light events in the pane: the amber of the plow's beacon sweeping the snow from the left before the truck is in view (plowdist 25.989), a sparkle of the sun on the drifts at the sting (32.512) */
function paneGlints(lt, x, y, w, h) {
  const a0 = ss(lt, CUE.plowdist, CUE.plowdist + .9) * (1 - ss(lt, 27.2, 27.8)), ph = .5 + .5 * Math.sin((lt - CUE.plowdist) * PI * 2 / 2.2 - 1.4);
  if (a0 > .02) { ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.glow(x + w * .04, y + h * .62, w * .5, '255,170,60', .55 * a0 * (.35 + .65 * ph), 'screen', .2); ctx.restore(); }
  const st = lt - CUE.sting, g = st > 0 && st < .9 ? Math.sin(PI * st / .9) : 0;
  if (g > .02) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 9; i++) { const sx = x + (.1 + .8 * sr(i, 71)) * w, sy = y + h * (.62 + .24 * sr(i, 73)), r = (7 + 10 * sr(i, 75)) * g, a = g * (.5 + .5 * sr(i, 77)); ctx.fillStyle = 'rgba(255,244,214,' + a * .8 + ')'; ctx.fillRect(sx - r, sy - 1, r * 2, 2); ctx.fillRect(sx - 1, sy - r, 2, r * 2); ell(sx, sy, 2.4, 2.4); ctx.fill(); }
    ctx.restore();
  }
}
// ------------------------------------------------------------------ the plow outside (A20.plowTruck + Turnip in the cab): enters from the left at the end of the dawn, passes the window while he speaks (tu3), the wave buries the doors
const PLOW = { s: 1.35, v: 192, cab0: 400, t0: 27.739 };
function plowAt(lt) {
  const gy = wpt(0, 0, ZB)[1] - 10, xc = PLOW.cab0 + PLOW.v * (lt - PLOW.t0);
  return { cabX: xc, xo: xc + 38 * PLOW.s, gy, s: PLOW.s, on: lt > 24.9 && lt < 30.6 };
}
function drawPlow(lt, env, where, reg) {
  const p = plowAt(lt); if (!p.on || !has('A20', 'plowTruck')) return;
  const push = ss(lt, 27.4, 28.2), T = A20.plowTruck(ctx, { x: p.xo, y: p.gy, s: p.s, facing: 1, t: lt, blade: .16 + .12 * push, load: .85, beacon: true, beaconOn: ss(lt, 25.9, 26.8), headlights: true, cab: true, wheelRot: p.xo / 58, snow: .3, seed: 11 });
  if (where === 'win' && has('A20', 'turnip') && T.cab) {
    const [x0, y0, x1, y1] = T.cab, cx = (x0 + x1) / 2, up = ss(lt, 27.93, 28.25) * (1 - ss(lt, 29.05, 29.4));
    if (!reg) REG.suppress++;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    const o = A20.turnip({ x: cx + 4 * p.s, y: y1 - 4 * p.s, s: .5 * p.s, noLegs: true, t: lt, mugUp: up, who: 'turnip', yaw: 0, look: [.3, 0] });
    drawChar(o);
    ctx.restore();
    if (!reg) REG.suppress--;
    if (A20.cabGlass) A20.cabGlass(ctx, { x: p.xo, y: p.gy, s: p.s, facing: 1, t: lt });
  }
  if (T.blade && ss(lt, 26.0, 27.0) > 0 && lt < 29.7) sprayN(ctx, { x: T.blade[0], y: T.blade[1], ang: -1.0, t: lt, t0: 25.9, t1: 29.8, seed: 5, power: 1, width: 1, gravity: 700 });
}

// ------------------------------------------------------------------ the scene
const NSC = {
  shot: lt => shotAt(lt).id,
  cam(lt) {
    V2.setCam(PC);
    const sh = shotAt(lt), env = envAt(lt), C = castFor(lt, sh);
    FR = { sh, env, C, lt, G: {} };
    camFor(lt, sh, C, env);
    if (window.__NTDBG) console.error('NTDBG', lt.toFixed(3), sh.id, sh.k, C.map(c => c.name).join(','), JSON.stringify({ x: CAM.x | 0, y: CAM.y | 0, z: +CAM.z.toFixed(2) }));
    CAM.x += 1.8 * hnoise(lt, 1.1, 1); CAM.y += 1.3 * hnoise(lt, .9, 2); CAM.r += .0012 * hnoise(lt, .7, 3);
  },
  draw(lt) { drawScene(lt); },
  fx(lt) {
    const sun = SIM.sunLevel(lt);
    return { bloom: .5, vignette: .3, grain: .05, contrast: .1, sat: .1, tint: [['#4a6ad0', .1 * (1 - sun), 'soft-light'], ['#ffb868', .16 * sun, 'soft-light']] };
  },
  blur: lt => nearCut(lt) ? 1 : shotAt(lt).k === 'lapse' ? 3 : 2,
  over(lt) {},
  clock(lt) { const P = SIM.clockParts(SIM.worldMin(lt)); return P.text + ' ' + P.ampm; },
};
window.__EP20_SCENES = window.__EP20_SCENES || {};
window.__EP20_SCENES.night = NSC;
})();
