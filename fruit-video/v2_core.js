'use strict';
/* SHIFT HAPPENS v2 renderer (Episode 6 onward). Opt-in per episode with EP.v2 = true, so Episodes 1 to 5 never touch it.
 *
 * Frame pipeline (renderAt(t) is still a pure function of time):
 *   world  : perspective sets, characters, particles drawn to an offscreen 1080x1920 canvas
 *   bloom  : emissive sources are blurred at quarter size and added back
 *   grade  : tint, contrast, saturation, vignette and film grain on the visible canvas
 *   screen : HUD and captions, always crisp, never motion blurred
 * Motion blur accumulates several world samples inside the shutter interval (V2.captureFrames).
 *
 * Perspective: V2.setCam({cx, cy, cz, f, hy}) then V2.proj(X, Y, Z) maps world units (X right, Y up, Z forward) to the screen.
 * A character standing at world X, Z is placed with V2.at(X, Z); its scale is f / (Z - cz). */
const V2 = (() => {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const worldCv = mk(W, H), worldCtx = worldCv.getContext('2d');
  const accCv = mk(W, H), accCtx = accCv.getContext('2d');
  const auxCv = mk(W, H), auxCtx = auxCv.getContext('2d');
  const bloomCv = mk(W / 4, H / 4), bloomCtx = bloomCv.getContext('2d');
  const bloomTmp = mk(W / 4, H / 4), bloomTmpCtx = bloomTmp.getContext('2d');
  const SHUTTER = .6;   // fraction of a frame the virtual shutter stays open

  // ---------------------------------------------------------------- seeded random, noise tiles
  function rng(seed) { let a = (seed * 2654435761) >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function noiseTile(size, seed, lo, hi) {
    const c = mk(size, size), g = c.getContext('2d'), id = g.createImageData(size, size), r = rng(seed);
    for (let i = 0; i < size * size; i++) { const v = lo + r() * (hi - lo); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    g.putImageData(id, 0, 0); return c;
  }
  const grainTile = noiseTile(512, 7, 70, 190);
  const skinTile = noiseTile(128, 11, 100, 156);
  const grainPat = mainCtx.createPattern(grainTile, 'repeat');

  // ---------------------------------------------------------------- color helpers
  function rgb(c) {
    if (Array.isArray(c)) return c;
    if (typeof c === 'string' && c[0] === '#') { const n = parseInt(c.length === 4 ? c.slice(1).replace(/./g, '$&$&') : c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    return String(c).split(',').map(Number);
  }
  const rgba = (c, a = 1) => { const [r, g, b] = rgb(c); return `rgba(${r | 0},${g | 0},${b | 0},${a})`; };
  const mix = (a, b, t) => { const A = rgb(a), B2 = rgb(b); return [lerp(A[0], B2[0], t), lerp(A[1], B2[1], t), lerp(A[2], B2[2], t)]; };

  // ---------------------------------------------------------------- perspective camera
  const P0 = { cx: 0, cy: 360, cz: 0, f: 1400, hy: 860 };
  const P = Object.assign({}, P0);
  function setCam(o) { Object.assign(P, P0, o); }
  function proj(X, Y, Z) { const k = P.f / (Z - P.cz); return [W / 2 + (X - P.cx) * k, P.hy + (P.cy - Y) * k, k]; }
  const p2 = (X, Y, Z) => { const q = proj(X, Y, Z); return [q[0], q[1]]; };
  function at(X, Z, extra) { const [x, y, k] = proj(X, 0, Z); return Object.assign({ x, y, s: k }, extra); }
  function poly(pts, fill, stroke, lw) {
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  function quad3(a, b, c, d, fill, stroke, lw) { poly([p2(...a), p2(...b), p2(...c), p2(...d)], fill, stroke, lw); }
  function line3(a, b, stroke, lw, cap = 'butt') { const A = p2(...a), B2 = p2(...b); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...B2); ctx.stroke(); }
  function grad(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  function radial(x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }

  // ---------------------------------------------------------------- lights, glow, bloom
  const LIGHT0 = { key: [-.55, -.75], keyColor: '#fff3da', keyA: .22, shadow: '#1a1030', shadowA: .30, rim: '#9fc4ff', rimA: .45, bounce: '#ffd9a0', bounceA: .16, amb: '#ffffff', ambA: 0, back: null, frontDark: 0, shadowLong: 0 };
  const LIGHT = Object.assign({}, LIGHT0);
  const lights = [];   // dynamic colored lights {x, y, r, color, a} in scene drawing coordinates
  function setLight(o) { Object.assign(LIGHT, LIGHT0, o); lights.length = 0; }
  function addLight(l) { lights.push(l); }

  // a soft light added to the picture itself (screen blend) and to the bloom
  function glow(x, y, r, color, a = 1, mode = 'screen', bloom = .35) {
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = mode; ctx.fillStyle = radial(x, y, 0, r, [[0, rgba(color, a)], [.45, rgba(color, a * .4)], [1, rgba(color, 0)]]);
    ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
    if (bloom > 0) emit(x, y, r * .8, color, a * bloom);
  }
  // bloom-only source (the picture already shows the crisp shape)
  function emit(x, y, r, color, a = 1) {
    if (a <= 0) return;
    const m = ctx.getTransform();
    bloomCtx.save(); bloomCtx.setTransform(m.a * .25, m.b * .25, m.c * .25, m.d * .25, m.e * .25, m.f * .25);
    bloomCtx.globalCompositeOperation = 'lighter';
    const g = bloomCtx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(color, Math.min(1, a))); g.addColorStop(1, rgba(color, 0));
    bloomCtx.fillStyle = g; bloomCtx.fillRect(x - r, y - r, r * 2, r * 2); bloomCtx.restore();
  }
  // a light shaft: a trapezoid of light from a window or lamp, softly faded along its length
  function beam(x0, y0, x1, y1, w0, w1, color, a, mode = 'screen') {
    ctx.save(); ctx.globalCompositeOperation = mode;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.fillStyle = grad(x0, y0, x1, y1, [[0, rgba(color, a)], [.6, rgba(color, a * .45)], [1, rgba(color, 0)]]);
    ctx.beginPath(); ctx.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); ctx.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); ctx.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); ctx.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- particles (stateless: a pure function of time)
  function dust(x0, y0, x1, y1, t, o = {}) {
    const { n = 40, seed = 1, size = 3.2, color = '255,244,214', alpha = .6, speed = 14 } = o, r = rng(seed);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const bx = r(), by = r(), ph = r() * TAU, sz = (.4 + r() * .8) * size, tw = .5 + .5 * Math.sin(t * (.8 + r() * 1.4) + ph);
      const x = x0 + ((bx * (x1 - x0) + t * speed * (.4 + r()) * .5 + Math.sin(t * .6 + ph) * 18) % (x1 - x0) + (x1 - x0)) % (x1 - x0);
      const y = y0 + ((by * (y1 - y0) - t * speed * (.3 + r() * .7) + Math.cos(t * .5 + ph) * 12) % (y1 - y0) + (y1 - y0)) % (y1 - y0);
      ctx.fillStyle = rgba(color, alpha * tw * (.35 + .65 * r())); ctx.beginPath(); ctx.arc(x, y, sz, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // expanding ring (sound, shockwave); k in 0..1 is the age fraction
  function ring(x, y, k, o = {}) {
    if (k <= 0 || k >= 1) return;
    const { r0 = 20, r1 = 360, color = '255,255,255', lw = 8, alpha = .9, squash = 1, bloom = .5 } = o;
    const e = easeOut(k), r = lerp(r0, r1, e), a = alpha * (1 - k) * (1 - k);
    ctx.save(); ctx.translate(x, y); ctx.scale(1, squash);
    ctx.strokeStyle = rgba(color, a); ctx.lineWidth = lw * (1 - k * .7); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.restore();
    if (bloom > 0) emit(x, y, r * 1.05, color, a * bloom * .5);
  }
  function smoke(x, y, t, t0, o = {}) {
    const { n = 14, rate = 7, life = 2.6, rise = 150, spread = 60, size = 46, color = '70,66,74', alpha = .5, seed = 3 } = o, r = rng(seed);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const born = t0 + i / rate, a = (t - born) / life; r(); const ph = r() * TAU, sx = (r() - .5) * 2;
      if (a < 0 || a > 1) continue;
      const px = x + sx * spread * a + Math.sin(a * 5 + ph) * 18 * a, py = y - rise * a, rad = size * (.5 + 1.6 * a);
      ctx.fillStyle = radial(px, py, 0, rad, [[0, rgba(color, alpha * (1 - a) * Math.min(1, a * 6))], [1, rgba(color, 0)]]);
      ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    ctx.restore();
  }
  function sparks(x, y, t, t0, o = {}) {
    const { n = 18, speed = 520, life = .7, color = '255,214,120', g = 1400, size = 5, seed = 5 } = o, r = rng(seed), k = t - t0;
    if (k < 0 || k > life) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, v = speed * (.35 + r() * .65), px = x + Math.cos(a) * v * k, py = y + Math.sin(a) * v * k + .5 * g * k * k, f = 1 - k / life;
      ctx.fillStyle = rgba(color, f); ctx.beginPath(); ctx.arc(px, py, size * f + 1, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // depth of field: draw the background into a scratch canvas, then lay it down blurred
  const dofCv = mk(W, H), dofCtx = dofCv.getContext('2d');
  function dof(px, fn) {
    if (px <= .5) return fn();
    const prev = ctx, m = prev.getTransform();
    dofCtx.setTransform(1, 0, 0, 1, 0, 0); dofCtx.clearRect(0, 0, W, H); dofCtx.setTransform(m); ctx = dofCtx;
    fn();
    ctx = prev; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${px}px)`; ctx.drawImage(dofCv, 0, 0); ctx.filter = 'none'; ctx.restore();
  }
  // lens flare for a bright source at (x, y): ghosts along the line through the frame center, plus a soft streak
  function flare(x, y, a = 1, color = '255,226,170') {
    if (a <= 0) return;
    const cx = W / 2, cy = H / 2, dx = cx - x, dy = cy - y;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad(x - 420, y, x + 420, y, [[0, rgba(color, 0)], [.5, rgba(color, .35 * a)], [1, rgba(color, 0)]]); ctx.fillRect(x - 420, y - 5, 840, 10);
    [[.35, 54, .22, '255,120,60'], [.6, 90, .16, '120,255,200'], [.9, 40, .22, '255,230,120'], [1.25, 130, .12, '120,160,255'], [1.6, 62, .16, '255,150,200']].forEach(([f, r, al, c]) => {
      const gx = x + dx * f, gy = y + dy * f;
      ctx.fillStyle = radial(gx, gy, r * .2, r, [[0, rgba(c, 0)], [.7, rgba(c, al * a)], [1, rgba(c, 0)]]); ctx.beginPath(); ctx.arc(gx, gy, r, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- frame pipeline
  let fxNow = null;
  const opts = { reflect: false };       // per-frame switches a scene can flip: glossy-floor reflections
  const validators = [];                // extra audit checks registered by v2_char.js
  function worldAt(tt) {
    T = tt; CUR = sceneAt(tt);
    const lt = tt - CUR.start, S = EP.SCENES[CUR.id];
    REG.items = []; REG.errors = []; REG.order = 0; REG.phase = 'world';
    lights.length = 0; Object.assign(P, P0); Object.assign(LIGHT, LIGHT0); opts.reflect = false;
    CAM = { z: 1, x: W / 2, y: H / 2, r: 0, shake: 0 };
    fxNow = Object.assign({ vignette: .34, grain: .045, bloom: .45, contrast: .1, sat: .1, tint: null, aberr: 0, fade: 0, fadeColor: '0,0,0' }, S.fx ? S.fx(lt) : {});
    S.cam && S.cam(lt);
    ctx = worldCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    bloomCtx.setTransform(1, 0, 0, 1, 0, 0); bloomCtx.clearRect(0, 0, W / 4, H / 4);
    ctx.save();
    const dx = CAM.shake * vnoise(T * 37), dy = CAM.shake * vnoise(T * 41 + 50);
    ctx.translate(W / 2 + dx, H / 2 + dy); ctx.rotate(CAM.r); ctx.scale(CAM.z, CAM.z); ctx.translate(-CAM.x, -CAM.y);
    S.draw(lt);
    ctx.restore();
    if (fxNow.bloom > 0) {   // blur the emissive layer at quarter size, then add it back
      bloomTmpCtx.clearRect(0, 0, W / 4, H / 4); bloomTmpCtx.filter = 'blur(5px)'; bloomTmpCtx.drawImage(bloomCv, 0, 0); bloomTmpCtx.filter = 'none';
      bloomTmpCtx.globalCompositeOperation = 'lighter'; bloomTmpCtx.globalAlpha = .55; bloomTmpCtx.filter = 'blur(14px)'; bloomTmpCtx.drawImage(bloomCv, 0, 0); bloomTmpCtx.filter = 'none'; bloomTmpCtx.globalAlpha = 1; bloomTmpCtx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = fxNow.bloom; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bloomTmp, 0, 0, W, H); ctx.restore();
    }
    return lt;
  }

  function grade(fx) {
    const g = mainCtx;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    if (fx.aberr > 0) aberrate(fx.aberr);
    if (fx.contrast > 0) { g.globalCompositeOperation = 'soft-light'; g.globalAlpha = fx.contrast; g.drawImage(canvas, 0, 0); g.globalAlpha = 1; }
    if (fx.sat > 0) { g.globalCompositeOperation = 'saturation'; g.fillStyle = '#ff2d2d'; g.globalAlpha = fx.sat; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    for (const [c, a, mode] of fx.tint || []) {   // tint: [[color, alpha, blendMode], ...]
      g.globalCompositeOperation = mode || 'soft-light'; g.fillStyle = rgba(c, 1); g.globalAlpha = a; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    }
    if (fx.vignette > 0) {
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = radial(W / 2, H * .5, H * .24, H * .72, [[0, 'rgba(255,255,255,1)'], [1, `rgba(${40 + (1 - fx.vignette) * 60 | 0},${34 + (1 - fx.vignette) * 60 | 0},${48 + (1 - fx.vignette) * 60 | 0},1)`]]);
      g.fillRect(0, 0, W, H);
    }
    if (fx.grain > 0) {
      const fi = Math.round(T * FPS), ox = Math.floor(hash(fi * 1.7) * 512), oy = Math.floor(hash(fi * 3.1 + 9) * 512);
      g.globalCompositeOperation = 'overlay'; g.globalAlpha = fx.grain * 2.2; g.translate(-ox, -oy); g.fillStyle = grainPat; g.fillRect(ox, oy, W, H);
    }
    g.restore();
    if (fx.fade > 0) { g.save(); g.fillStyle = rgba(fx.fadeColor, fx.fade); g.fillRect(0, 0, W, H); g.restore(); }
  }
  // cheap chromatic aberration: the picture split into red, green and blue copies, offset from each other
  function aberrate(px) {
    const g = mainCtx;
    auxCtx.setTransform(1, 0, 0, 1, 0, 0); auxCtx.globalCompositeOperation = 'copy'; auxCtx.drawImage(canvas, 0, 0);
    g.globalCompositeOperation = 'copy'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (const [col, dx] of [['#ff0000', -px], ['#00ff00', 0], ['#0000ff', px]]) {
      // one channel at a time: the snapshot times the channel color, shifted sideways, then added back
      accCtx.setTransform(1, 0, 0, 1, 0, 0); accCtx.globalCompositeOperation = 'copy'; accCtx.drawImage(auxCv, 0, 0);
      accCtx.globalCompositeOperation = 'multiply'; accCtx.fillStyle = col; accCtx.fillRect(0, 0, W, H); accCtx.globalCompositeOperation = 'source-over';
      g.globalCompositeOperation = 'lighter'; g.drawImage(accCv, dx, 0);
    }
    g.globalCompositeOperation = 'source-over';
  }

  function compose(S, lt, src) {
    ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    ctx.drawImage(src, 0, 0);
    grade(fxNow);
    REG.phase = 'over';
    ctx.save();
    S.over && S.over(lt);
    ctx.restore();
    drawCaption(T);
    if (!S.noChyron) chyron(S, lt);
  }

  function renderFrame(S, lt) { worldAt(T); compose(S, lt, worldCv); }

  // frame capture with motion blur: several world samples inside the shutter, averaged
  function renderSampled(t) {
    TL = EP.TL;
    const T0 = clamp(t, 0, TL.duration - 1e-3), sc = sceneAt(T0), S = EP.SCENES[sc.id];
    T = T0; CUR = sc;   // a scene's blur() looks its beats up with B(), which reads the scene being drawn
    const n = Math.max(1, Math.min(10, Math.round(S.blur ? S.blur(T0 - sc.start) : 1)));
    if (n === 1) return renderAt(t);
    for (let i = 0; i < n; i++) {
      const tt = clamp(T0 + ((i + .5) / n - .5) * (SHUTTER / FPS), sc.start, sc.start + sc.dur - 1e-3);
      worldAt(tt);
      accCtx.setTransform(1, 0, 0, 1, 0, 0); accCtx.globalCompositeOperation = i ? 'source-over' : 'copy'; accCtx.globalAlpha = i ? 1 / (i + 1) : 1; accCtx.drawImage(worldCv, 0, 0);
    }
    accCtx.globalAlpha = 1; accCtx.globalCompositeOperation = 'source-over';
    // the overlays and grade belong to the true frame time; the world state is the last sample's, which is fine for them
    T = T0; CUR = sc;
    compose(S, T0 - sc.start, accCv);
  }
  function captureFrames(start, n) {
    const out = [];
    for (let i = 0; i < n; i++) { renderSampled((start + i) / FPS); out.push(canvas.toDataURL(window.FMT || 'image/jpeg', window.Q || .93)); }
    return out;
  }

  // ---------------------------------------------------------------- captions and chyron (screen space, never blurred)
  const CAP = { top: 1390, bottom: 1660 };
  function drawCaption(t) {
    // the legibility scrim lives under the caption zone for the whole episode so the picture does not jump around
    ctx.save(); ctx.fillStyle = grad(0, 1390, 0, H, [[0, 'rgba(8,6,16,0)'], [.3, 'rgba(8,6,16,.42)'], [1, 'rgba(8,6,16,.78)']]); ctx.fillRect(0, 1390, W, H - 1390); ctx.restore();
    const l = lineAt(t);
    if (!l) return;
    const lt = t - l.s;
    l._chunks = l._chunks || chunkWords(l.words);
    const chunk = l._chunks.find(c => lt < c[c.length - 1][2]) || l._chunks[l._chunks.length - 1];
    const size = 64, maxW = 960;
    ctx.save(); ctx.font = `900 ${size}px Nunito`;
    const space = ctx.measureText(' ').width + 14;
    const lines = [[]]; let lw = 0;
    for (const w of chunk) {
      const ww = ctx.measureText(w[0]).width;
      if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push([w, ww]); lw += ww + space;
    }
    if (lines.length > 2) REG.errors.push(`caption needs ${lines.length} lines: "${chunk.map(w => w[0]).join(' ')}"`);
    const fade = seg(lt, chunk[0][1] - .04, chunk[0][1] + .08);
    const baseY = 1536 - (lines.length - 1) * 38;
    // speaker chip
    ctx.font = '900 28px Nunito';
    const nw = Math.min(900, ctx.measureText(l.name).width + 44), py = baseY - (lines.length > 1 ? 88 : 80);
    ctx.fillStyle = l.color; rr(540 - nw / 2, py - 23, nw, 46, 23); ctx.fill();
    ctx.strokeStyle = 'rgba(10,8,18,.9)'; ctx.lineWidth = 4; ctx.stroke();
    const dark = ['#ffd60a', '#ffd23f', '#e8e8e8', '#f4a300', '#ff9f1c', '#c9d22a', '#e8a86a', '#9fb3c8', '#ffe135'].includes(l.color);
    text(l.name, 540, py + 1, { size: 28, fill: dark ? '#15111a' : '#fff', maxW: nw - 30 });
    reg('panel', [40, py - 28, 1040, baseY + (lines.length - 1) * 80 + 54], { id: 'caption' });
    lines.forEach((ln, i) => {
      const total = ln.reduce((a, [, ww]) => a + ww, 0) + space * (ln.length - 1);
      let x = 540 - total / 2;
      for (const [w, ww] of ln) {
        const said = lt >= w[1], active = said && lt < w[2];
        const pop = active ? 1 + .07 * Math.sin(seg(lt, w[1], w[1] + .12) * PI) : 1;
        ctx.save(); ctx.translate(x + ww / 2, baseY + i * 80); ctx.scale(pop, pop);
        text(w[0], 0, 0, { size, fill: active ? '#ffe135' : '#fff', lw: 11, stroke: '#0c0812', alpha: (said ? 1 : .5) * fade, shadow: 14 });
        ctx.restore();
        x += ww + space;
      }
    });
    ctx.restore();
  }
  // clock and place, top left, below the phone's status bar and above the picture's action
  function chyron(S, lt) {
    const clock = S.clock ? S.clock(lt) : CUR.clock, label = S.label ? S.label(lt) : CUR.label;
    if (!clock) return;
    const a = easeBack(seg(lt, .1, .45));
    ctx.save(); ctx.translate(48, 150); ctx.globalAlpha *= clamp(a * 2);
    ctx.font = '400 50px Bangers'; ctx.letterSpacing = '2px'; const cw = ctx.measureText(clock).width; ctx.letterSpacing = '0px';
    const w = cw + 74;
    ctx.fillStyle = 'rgba(10,8,18,.72)'; rr(0, -34, w, 68, 20); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; rr(0, -34, w, 68, 20); ctx.stroke();
    ctx.fillStyle = Math.sin(T * 5) > -.2 ? '#ff2d3d' : '#6a1d22'; ell(30, 0, 9, 9); ctx.fill();
    text(clock, 50, 3, { size: 50, font: 'Bangers', weight: 400, align: 'left', spacing: 2 });
    reg('overlay', [48, 116, 48 + w, 184], { id: 'chyron' });
    ctx.restore();
    if (label) {
      const la = seg(lt, .3, .6) * (1 - seg(lt, 3.4, 3.9));
      if (la > 0) {
        ctx.save(); ctx.globalAlpha *= la; ctx.font = '900 28px Nunito'; ctx.letterSpacing = '1px';
        const lw2 = ctx.measureText(label).width + 36; ctx.letterSpacing = '0px';
        ctx.fillStyle = '#ffd60a'; rr(48, 196, lw2, 46, 12); ctx.fill();
        text(label, 48 + lw2 / 2, 220, { size: 28, fill: '#15111a', spacing: 1 });
        reg('overlay', [48, 196, 48 + lw2, 242], { id: 'place-label' });
        ctx.restore();
      }
    }
  }

  function validate() {
    const V = [];
    for (const it of REG.items) if (it.box.some(v => !Number.isFinite(v))) V.push(`non-finite box for ${it.type}:${it.id || it.name || '?'}`);
    for (const f of validators) V.push(...f());
    return V;
  }

  return { mk, rng, rgb, rgba, mix, P, setCam, proj, p2, at, poly, quad3, line3, grad, radial, LIGHT, lights, setLight, addLight, glow, emit, beam, dust, ring, smoke, sparks, dof, flare,
    renderFrame, renderSampled, captureFrames, validate, validators, opts, skinTile, worldCv, CAP };
})();
window.V2 = V2;
