'use strict';
/* TXA, the text gate (Episode 13 onward; any older episode can be run through it with TEXTGATE=1).
 *
 * The layout audit in engine.js only knew about faces, props and overlay text. Signs, banners, posters, sheets and labels drawn into the world were invisible to it,
 * which is how upside-down sheets, text running into text and posters sliced by the frame edge shipped. TXA closes that hole by hooking fillText on the canvas itself,
 * so every string drawn by any code, through text() or by a raw ctx.fillText, is recorded with its true on-screen quad (camera, rotation, mirroring and all).
 *
 * Geometry checks (every frame the audit visits; messages are stable so the audit can group them into time ranges):
 *   mirrored / upside-down / skewed text, text rotated more than 12 degrees
 *   text cut by the frame edge, or inside the safe margin (a fast pass through the edge during a whip is exempt)
 *   text over other text (different strings overlapping)
 *   text under the caption scrim, or under the clock pill, when the scene shows them
 *   text drawn on an offscreen canvas (cannot be audited: draw it live instead)
 * Pixel check (a second render of the same frame in "mask mode"): every text run is painted in a flat key colour and everything that is not opaque and normal is
 * skipped, so the share of each run's ink that survives to the picture is measured. Anything below 90 percent is covered by something drawn later (a chair in front of a
 * name tag, a character in front of a sign, the frame edge) and is reported with the share.
 *
 * Severity: a mirrored, upside-down, tilted, cut-off, overlapping or container-breaking string is always an error. Rules about margins, the caption zone, the clock pill, size and cover are errors only for
 * "hero" text (the viewer has to read it); for set dressing they are reported as NOTE lines, which are printed but do not fail the audit.
 *
 * Text options understood by text() and the UI kit (ui.js): crop (the text is allowed to be cut or covered on purpose), tilt (allowed rotation in radians), hero (the viewer
 * must be able to read it: held to a minimum size), id/cid (a name and the container it belongs to, so centring and containment are checked), grp (text that may overlap its group).
 */
const TXA = (() => {
  const cfg = { margin: 40, tiltDeg: 12, skewDeg: 25, overlap: .06, transitPx: 300, heroPx: 30, minAlpha: .5, visMin: .9, noteVis: .75, capTop: 1380, capBottom: 1700, chyron: [48, 116, 500, 244] };
  const st = { rec: false, mask: false, eng: 0, opts: null, runs: [], prev: null, prevT: -1, offscreen: new Map(), cur: null };
  const proto = CanvasRenderingContext2D.prototype;
  const origFill = proto.fillText, origStroke = proto.strokeText;
  const origF = proto.fill, origFR = proto.fillRect, origS = proto.stroke, origSR = proto.strokeRect, origDI = proto.drawImage;
  const KEY = '#fe01fd';

  const pxOf = f => { const m = /(\d+(?:\.\d+)?)px/.exec(f); return m ? parseFloat(m[1]) : 16; };
  const isScreen = c => c === canvas || (window.V2 && c === V2.worldCv);
  const isSoft = c => window.V2 && c === V2.dofCv;
  const transparentFill = s => typeof s === 'string' && (s === 'transparent' || /rgba\([^)]*,\s*0(\.0+)?\)$/.test(s));

  function record(c, str, x, y, maxW) {
    const cv = c.canvas;
    if (!isScreen(cv) && !isSoft(cv)) {   // offscreen: not auditable
      const e = st.offscreen.get(cv) || { n: 0, sample: [] }; e.n++; if (e.sample.length < 8 && !e.sample.includes(str)) e.sample.push(str); st.offscreen.set(cv, e);
      return;
    }
    if (!st.rec || REG.suppress || !str || !String(str).trim()) return;
    const m = c.getTransform(), mt = c.measureText(str), o = st.opts || {};
    const px = pxOf(c.font), w = mt.width;
    const f = maxW && w > maxW ? maxW / w : 1;
    const pad = (o.lw || 0) / 2;
    const L = x - mt.actualBoundingBoxLeft * f - pad, R = x + mt.actualBoundingBoxRight * f + pad, Tp = y - mt.actualBoundingBoxAscent - pad, Bt = y + mt.actualBoundingBoxDescent + pad;
    const pts = [[L, Tp], [R, Tp], [R, Bt], [L, Bt]].map(([u, v]) => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const det = m.a * m.d - m.b * m.c, sc = Math.sqrt(Math.abs(det));
    const angX = Math.atan2(m.b, m.a) * 180 / PI, angY = Math.atan2(-m.c, m.d) * 180 / PI;
    const capH = o.center && c.textBaseline === 'alphabetic' ? c.measureText('H').actualBoundingBoxAscent : 0;
    st.runs.push({
      s: String(str), q: pts, capH, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), px: px * sc,
      det, a: m.a, d: m.d, angX, angY, alpha: c.globalAlpha, soft: isSoft(cv) || (c.filter && c.filter !== 'none'), eng: st.eng > 0, phase: REG.phase,
      comp: c.globalCompositeOperation, clear: transparentFill(c.fillStyle), o,
      ref: { str: String(str), x, y, maxW: maxW || 0, font: c.font, align: c.textAlign, base: c.textBaseline, ls: c.letterSpacing || '0px', m: [m.a, m.b, m.c, m.d, m.e, m.f] },
    });
  }

  proto.fillText = function (str, x, y, maxW) {
    if (st.rec) record(this, str, x, y, maxW);
    if (st.mask && isScreen(this.canvas)) {   // mask mode: flat key colour, no outline, no shadow, no blend
      const keep = [this.fillStyle, this.globalAlpha, this.shadowColor, this.shadowBlur, this.globalCompositeOperation, this.filter];
      if (this.globalCompositeOperation !== 'source-over') return;
      this.fillStyle = KEY; this.globalAlpha = 1; this.shadowColor = 'transparent'; this.shadowBlur = 0;
      const r = origFill.call(this, str, x, y, ...(maxW ? [maxW] : []));
      [this.fillStyle, this.globalAlpha, this.shadowColor, this.shadowBlur, this.globalCompositeOperation, this.filter] = keep;
      return r;
    }
    return maxW ? origFill.call(this, str, x, y, maxW) : origFill.call(this, str, x, y);
  };
  proto.strokeText = function (str, x, y, maxW) {
    if (st.mask && isScreen(this.canvas)) return;
    return maxW ? origStroke.call(this, str, x, y, maxW) : origStroke.call(this, str, x, y);
  };
  // mask mode: only opaque, normal-blend drawing may cover text (glows, light, tints and low-alpha veils are ignored)
  const skipMask = c => st.mask && isScreen(c.canvas) && (c.globalCompositeOperation !== 'source-over' || c.globalAlpha < .5);
  proto.fill = function (...a) { return skipMask(this) ? undefined : origF.apply(this, a); };
  proto.fillRect = function (...a) { return skipMask(this) ? undefined : origFR.apply(this, a); };
  proto.stroke = function (...a) { return skipMask(this) ? undefined : origS.apply(this, a); };
  proto.strokeRect = function (...a) { return skipMask(this) ? undefined : origSR.apply(this, a); };
  proto.drawImage = function (...a) { return skipMask(this) ? undefined : origDI.apply(this, a); };

  // ---------------------------------------------------------------- geometry
  const area = r => Math.max(0, r.x1 - r.x0) * Math.max(0, r.y1 - r.y0);
  const inter = (a, b) => { const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); return w > 0 && h > 0 ? w * h : 0; };
  const onScreen = r => r.x1 > 0 && r.x0 < W && r.y1 > 0 && r.y0 < H;
  // do two (possibly rotated) quads overlap? separating-axis test; returns the AABB overlap area as the measure when they do
  function quadsOverlap(a, b) {
    for (const Q of [a.q, b.q]) for (let i = 0; i < 4; i++) {
      const p = Q[i], n = Q[(i + 1) % 4], ax = -(n[1] - p[1]), ay = n[0] - p[0];
      let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
      for (const [x, y] of a.q) { const v = x * ax + y * ay; a0 = Math.min(a0, v); a1 = Math.max(a1, v); }
      for (const [x, y] of b.q) { const v = x * ax + y * ay; b0 = Math.min(b0, v); b1 = Math.max(b1, v); }
      if (a1 < b0 || b1 < a0) return false;
    }
    return true;
  }
  const nm = r => `"${r.s.length > 34 ? r.s.slice(0, 33) + '…' : r.s}"`;

  function begin(t, dt) { st.runs = []; st.curT = t; st.dt = dt || 1 / 30; UIREG.clear(); }
  function end() { st.prev = st.runs.filter(r => !r.soft && !r.eng); st.prevT = st.curT; }

  // the geometry checks for the frame just rendered
  function check() {
    const V = [], S = EP.SCENES[CUR.id] || {};
    const runs = st.runs.filter(r => !r.soft && !r.eng && !r.clear && r.alpha >= cfg.minAlpha * .5 && r.px >= 8 && onScreen(r));   // under 8 px a string is a speck, not text
    const dt = st.dt, prev = st.prev || [];
    for (const r of runs) {
      r.vis = r.alpha >= cfg.minAlpha && r.comp === 'source-over';
      if (!r.vis) continue;
      // fast pass through the edge during a whip: matched against the previous frame by string and nearest centre
      let speed = 0;
      for (const p of prev) if (p.s === r.s && Math.abs(p.px - r.px) < r.px * .5 + 1) {
        const d = Math.hypot((p.x0 + p.x1 - r.x0 - r.x1) / 2, (p.y0 + p.y1 - r.y0 - r.y1) / 2);
        if (d < Math.max(70, cfg.transitPx * dt * 2)) speed = Math.max(speed, d / dt);
      }
      const transit = speed >= cfg.transitPx || r.o.transit;
      const tag = nm(r), hero = !!r.o.hero, soft = msg => hero ? msg : 'NOTE ' + msg;
      if (r.det < 0) V.push(r.d < 0 && r.a > 0 ? `text ${tag} is upside down (vertical flip)` : `text ${tag} is mirrored`);
      else if (Math.abs(r.angX) > 90) V.push(`text ${tag} is upside down (rotated ${Math.round(r.angX)} degrees)`);
      else if (Math.abs(r.angX) > (r.o.tilt ? r.o.tilt * 180 / PI : cfg.tiltDeg) + .5) V.push(`text ${tag} is tilted too far (${Math.round(r.angX)} degrees)`);
      if (Math.abs(r.angX - r.angY) > cfg.skewDeg && r.det > 0) V.push(`text ${tag} is skewed (${Math.round(r.angX)} vs ${Math.round(r.angY)} degrees)`);
      if (!r.o.crop && !transit) {
        const box = [Math.round(r.x0), Math.round(r.y0), Math.round(r.x1), Math.round(r.y1)];
        if (r.x0 < 0 || r.y0 < 0 || r.x1 > W || r.y1 > H) V.push(`text ${tag} is cut off by the frame edge [${box}]`);
        else if (hero && (r.x0 < cfg.margin || r.y0 < cfg.margin || r.x1 > W - cfg.margin || r.y1 > H - cfg.margin)) V.push(`hero text ${tag} is inside the safe margin [${box}]`);
      }
      if (!r.o.crop && !r.o.zone) {
        if (!S.noScrim && inter(r, { x0: 0, y0: cfg.capTop, x1: W, y1: cfg.capBottom }) > area(r) * .1) V.push(soft(`text ${tag} sits under the caption zone`));
        if (!S.noChyron && inter(r, { x0: cfg.chyron[0], y0: cfg.chyron[1], x1: cfg.chyron[2], y1: cfg.chyron[3] }) > area(r) * .05) V.push(soft(`text ${tag} sits under the clock pill`));
      }
      if (hero && r.px < cfg.heroPx) V.push(`hero text ${tag} is too small to read (${r.px.toFixed(0)} px)`);
    }
    // text over text
    const vis = runs.filter(r => r.vis && !r.o.crop);
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const a = vis[i], b = vis[j];
      if (a.o.grp && a.o.grp === b.o.grp) continue;
      const I = inter(a, b);
      if (I <= 0) continue;
      const ca = [(a.x0 + a.x1) / 2, (a.y0 + a.y1) / 2], cb = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
      if (a.s === b.s && Math.hypot(ca[0] - cb[0], ca[1] - cb[1]) < Math.max(a.px, b.px) * .2) continue;   // the same word drawn twice as its own shadow
      if (I / Math.min(area(a), area(b)) > cfg.overlap && quadsOverlap(a, b)) V.push(`text ${nm(a)} overlaps text ${nm(b)}`);
    }
    // containers: text that declares a container (cid) must sit inside it and, if it asks to be centred, be centred in it. The container is registered by the UI kit with its
    // local rectangle and the transform in force when it was drawn, so rotated and zoomed signs are checked in their own frame.
    for (const r of runs) if (r.o.cid && r.vis) {
      const c = UIREG.get(r.o.cid);
      if (!c) { V.push(`text ${nm(r)} names the container "${r.o.cid}" but none was registered this frame`); continue; }
      const M = c.m, det = M[0] * M[3] - M[1] * M[2], sc = Math.sqrt(Math.abs(det)) || 1;
      const inv = p => { const x = p[0] - M[4], y = p[1] - M[5]; return [(M[3] * x - M[2] * y) / det, (-M[1] * x + M[0] * y) / det]; };
      const pts = r.q.map(inv), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const [rx0, ry0, rx1, ry1] = c.rect, pad = c.pad || 0, tol = 1 / sc;
      if (x0 < rx0 + pad - tol || x1 > rx1 - pad + tol || y0 < ry0 + pad - tol || y1 > ry1 - pad + tol) V.push(`text ${nm(r)} runs outside its ${c.kind} "${r.o.cid}"`);
      else if (r.o.center) {
        const dx = ((x0 + x1) / 2 - (rx0 + rx1) / 2) * sc;
        const my = r.capH ? (r.ref.y - r.capH / 2) : (y0 + y1) / 2;   // a baseline-placed label is centred on its cap band, not on its descenders
        const dy = r.capH ? (my - (ry0 + ry1) / 2) * sc : ((y0 + y1) / 2 - (ry0 + ry1) / 2) * sc;
        if (Math.abs(dx) > 2.5 || (r.o.centerY !== false && Math.abs(dy) > 3.5)) V.push(`text ${nm(r)} is off centre in its ${c.kind} "${r.o.cid}" [${dx.toFixed(1)},${dy.toFixed(1)}]`);
      }
    }
    return V;
  }

  // a registry the UI kit fills each frame: containers (signs, panels, pages) with their screen boxes
  const UIREG = new Map();

  // the pixel pass: render the frame again with every string in a flat key colour, then count how much of each run's ink survived
  function visibility() {
    const V = [], S = EP.SCENES[CUR.id] || {};
    const targets = st.runs.filter(r => !r.soft && !r.eng && !r.clear && r.phase === 'world' && r.alpha >= .85 && r.comp === 'source-over' && !r.o.crop && r.px >= 9 && onScreen(r));
    if (!targets.length || !window.V2 || !V2.worldAt) return V;
    const keepRuns = st.runs, keepRec = st.rec;
    st.mask = true; st.rec = false; st.runs = [];
    const saveReg = REG.on; REG.on = false;
    V2.worldAt(T);
    REG.on = saveReg; st.mask = false; st.rec = keepRec; st.runs = keepRuns;
    const wctx = V2.worldCv.getContext('2d');
    const sc = document.createElement('canvas'), sctx = sc.getContext('2d', { willReadFrequently: true });
    for (const r of targets) {
      const ox = Math.floor(r.x0) - 2, oy = Math.floor(r.y0) - 2, w = Math.min(1400, Math.ceil(r.x1 - r.x0) + 5), h = Math.min(700, Math.ceil(r.y1 - r.y0) + 5);
      if (w < 4 || h < 4) continue;
      sc.width = w; sc.height = h;
      const f = r.ref;
      sctx.setTransform(f.m[0], f.m[1], f.m[2], f.m[3], f.m[4] - ox, f.m[5] - oy);
      sctx.font = f.font; sctx.textAlign = f.align; sctx.textBaseline = f.base; sctx.letterSpacing = f.ls; sctx.fillStyle = '#000';
      if (f.maxW) origFill.call(sctx, f.str, f.x, f.y, f.maxW); else origFill.call(sctx, f.str, f.x, f.y);
      const ref = sctx.getImageData(0, 0, w, h).data;
      // the part of the world canvas under the run (outside the canvas reads as transparent, so a cut-off run loses ink here too)
      const gx0 = Math.max(0, ox), gy0 = Math.max(0, oy), gx1 = Math.min(W, ox + w), gy1 = Math.min(H, oy + h);
      let tot = 0, ok = 0;
      const world = gx1 > gx0 && gy1 > gy0 ? wctx.getImageData(gx0, gy0, gx1 - gx0, gy1 - gy0) : null;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (ref[(y * w + x) * 4 + 3] < 160) continue;
        const X = ox + x - gx0, Y = oy + y - gy0;
        if (!world || X < 0 || Y < 0 || X >= world.width || Y >= world.height) continue;   // outside the frame: the geometry check reports a cut, not a cover
        tot++;
        const k = (Y * world.width + X) * 4, d = world.data;
        if (d[k] > 200 && d[k + 2] > 200 && d[k + 1] < 90) ok++;
      }
      if (tot < 30) continue;
      const share = ok / tot, hero = !!r.o.hero, box = `[${Math.round(r.x0)},${Math.round(r.y0)},${Math.round(r.x1)},${Math.round(r.y1)}]`;
      if (hero && share < cfg.visMin) V.push(`hero text ${nm(r)} is ${share < .05 ? 'hidden' : 'partly covered'} (${Math.round(share * 100)}% of the ink shows) ${box}`);
      else if (!hero && share >= .05 && share < cfg.noteVis) V.push(`NOTE text ${nm(r)} is partly covered (${Math.round(share * 100)}% of the ink shows) ${box}`);
    }
    return V;
  }

  function offscreenReport() {
    const out = [];
    for (const [cv, e] of st.offscreen) if (!cv.__txOK) out.push(`${EP.textGate ? '' : 'NOTE '}${e.n} text draw(s) on an offscreen ${cv.width}x${cv.height} canvas (not auditable; draw text live, or set canvas.__txOK = true for a flat silhouette buffer): ${e.sample.map(s => JSON.stringify(s)).join(', ')}`);
    return out;
  }

  // every distinct text run in a time range (for the text atlas): where it is, how big, how it is turned, and the moment it is most visible
  function inventory(from, to, step) {
    const map = new Map();
    st.rec = true; REG.on = true;
    for (let t = from; t < to; t += step) {
      begin(t, step); renderAt(t);
      for (const r of st.runs) {
        if (r.soft || r.eng || r.clear || r.alpha < .5) continue;
        const key = CUR.id + '|' + r.s + '|' + Math.round(r.px / 4);
        const vis = onScreen(r) ? inter(r, { x0: 0, y0: 0, x1: W, y1: H }) / Math.max(1, area(r)) : 0;
        let e = map.get(key);
        if (!e) { e = { scene: CUR.id, s: r.s, first: t, last: t, px: r.px, best: t, bestVis: -1, box: null, ang: r.angX, phase: r.phase, hero: !!r.o.hero }; map.set(key, e); }
        e.last = t;
        if (vis > e.bestVis + 1e-6 || (Math.abs(vis - e.bestVis) < 1e-6 && Math.abs(t - (e.first + e.last) / 2) < Math.abs(e.best - (e.first + e.last) / 2))) { e.bestVis = vis; e.best = t; e.box = [r.x0, r.y0, r.x1, r.y1]; e.ang = r.angX; e.px = r.px; }
      }
    }
    st.rec = false; REG.on = false;
    return [...map.values()].sort((a, b) => a.first - b.first);
  }

  return { cfg, st, UIREG, begin, end, check, visibility, offscreenReport, inventory, KEY,
    get rec() { return st.rec; }, set rec(v) { st.rec = v; }, get mask() { return st.mask; }, get eng() { return st.eng; }, set eng(v) { st.eng = v; }, get opts() { return st.opts; }, set opts(v) { st.opts = v; } };
})();
window.TXA = TXA;
