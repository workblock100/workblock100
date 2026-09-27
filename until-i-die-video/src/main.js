'use strict';
// Frame composer: finds the active shot(s), renders transitions, applies post-processing.
// Also runs the in-browser player (with optional audio file) unless ?render is in the URL.

const FPS = 30;
const R = { a: null, b: null, bloomS: null, bloomT: null, vignette: null, out: null, ready: false };

function initRenderer() {
  if (R.ready) return;
  initNoise();
  R.a = mkCanvas(W, H);
  R.b = mkCanvas(W, H);
  R.tmp = mkCanvas(W, H);
  R.bloomS = mkCanvas(W / 4, H / 4);
  R.bloomT = mkCanvas(W / 4, H / 4);
  R.vignette = mkCanvas(W, H);
  const g = R.vignette.getContext('2d');
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(0.65, 'rgba(0,0,0,0.16)');
  vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);
  R.ready = true;
}

function shotInfo(shot, t) {
  const lt = t - shot.start, dur = shot.end - shot.start;
  return { t, lt, dur, p: lt / dur, v: shot.v || 0, frame: Math.round(t * FPS), params: shot.params || {}, section: shot.section };
}

function renderShot(canvas, shot, t) {
  const g = canvas.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  const fn = SCENES[shot.scene];
  g.save();
  if (fn) fn(g, shotInfo(shot, t));
  else { g.fillStyle = '#300'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '40px monospace'; g.fillText('missing scene ' + shot.scene, 80, 120); }
  g.restore();
}

// Which shots are visible at t, and how they blend.
function activeAt(t) {
  const S = SHOTS;
  let i = S.findIndex(s => t >= s.start && t < s.end);
  if (i < 0) i = t < S[0].start ? 0 : S.length - 1;
  const cur = S[i];
  const nxt = S[i + 1];
  if (nxt && nxt.tin > 0 && t > nxt.start - nxt.tin / 2) {
    return { A: cur, B: nxt, w: sstep(nxt.start - nxt.tin / 2, nxt.start + nxt.tin / 2, t), type: nxt.tt, edge: nxt.start };
  }
  const prv = S[i - 1];
  if (prv && cur.tin > 0 && t < cur.start + cur.tin / 2) {
    return { A: prv, B: cur, w: sstep(cur.start - cur.tin / 2, cur.start + cur.tin / 2, t), type: cur.tt, edge: cur.start };
  }
  return { A: cur, B: null, w: 0, type: 'none', edge: cur.start };
}

function composite(ctx, t) {
  const act = activeAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  if (!act.B) {
    renderShot(R.a, act.A, t);
    // Small punch-in right after a hard cut.
    const since = t - act.A.start;
    const punch = act.A.tt === 'cut' ? 0.035 * Math.exp(-since * 7) : 0;
    drawScaled(ctx, R.a, 1 + punch);
    return act;
  }
  renderShot(R.a, act.A, t);
  renderShot(R.b, act.B, t);
  const w = act.w;
  switch (act.type) {
    case 'flash': {
      ctx.drawImage(R.a, 0, 0);
      ctx.globalAlpha = w;
      ctx.drawImage(R.b, 0, 0);
      ctx.globalAlpha = 1;
      const f = Math.sin(Math.PI * w);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba([255, 240, 255], 0.85 * f * f);
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'glitch': {
      ctx.drawImage(w < 0.5 ? R.a : R.b, 0, 0);
      const k = Math.sin(Math.PI * w);
      const fr = Math.round(t * FPS);
      const n = 26;
      for (let i = 0; i < n; i++) {
        if (hash(i, fr) > k * 0.9) continue;
        const y = Math.floor(hash(i, fr, 1) * H);
        const hh = 6 + hash(i, fr, 2) * 90;
        const src = hash(i, fr, 3) < w ? R.b : R.a;
        const dx = hashs(i, fr, 4) * 140 * k;
        ctx.drawImage(src, 0, y, W, hh, dx, y, W, hh);
      }
      // RGB split on the whole frame.
      rgbSplit(ctx, 14 * k);
      break;
    }
    case 'dip': {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = clamp(1 - w * 2);
      ctx.drawImage(R.a, 0, 0);
      ctx.globalAlpha = clamp(w * 2 - 1);
      ctx.drawImage(R.b, 0, 0);
      ctx.globalAlpha = 1;
      break;
    }
    case 'cut': {
      ctx.drawImage(w < 0.5 ? R.a : R.b, 0, 0);
      break;
    }
    default: {
      ctx.drawImage(R.a, 0, 0);
      ctx.globalAlpha = w;
      ctx.drawImage(R.b, 0, 0);
      ctx.globalAlpha = 1;
    }
  }
  return act;
}

function drawScaled(ctx, src, s) {
  if (Math.abs(s - 1) < 0.0005) { ctx.drawImage(src, 0, 0); return; }
  const w = W * s, h = H * s;
  ctx.drawImage(src, (W - w) / 2, (H - h) / 2, w, h);
}

// Chromatic split: red channel shifted one way, green+blue the other.
function rgbSplit(ctx, d) {
  if (d < 0.5) return;
  const c = ctx.canvas;
  const tg = R.tmp.getContext('2d');
  tg.globalCompositeOperation = 'source-over';
  tg.drawImage(c, 0, 0);
  tg.globalCompositeOperation = 'multiply';
  tg.fillStyle = '#ff0000';
  tg.fillRect(0, 0, W, H);
  tg.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(R.tmp, d, 0);
  ctx.restore();
}

function post(ctx, t, act) {
  // Bloom: threshold-ish at quarter res, two blur radii, added back.
  const bs = R.bloomS.getContext('2d'), bt = R.bloomT.getContext('2d');
  bs.globalCompositeOperation = 'source-over';
  bs.filter = 'brightness(0.7) contrast(3.4)';
  bs.drawImage(ctx.canvas, 0, 0, W / 4, H / 4);
  bs.filter = 'none';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  bt.clearRect(0, 0, W / 4, H / 4);
  bt.filter = 'blur(3px)';
  bt.drawImage(R.bloomS, 0, 0);
  bt.filter = 'none';
  ctx.globalAlpha = 0.2;
  ctx.drawImage(R.bloomT, 0, 0, W, H);
  bt.clearRect(0, 0, W / 4, H / 4);
  bt.filter = 'blur(12px)';
  bt.drawImage(R.bloomS, 0, 0);
  bt.filter = 'none';
  ctx.globalAlpha = 0.26;
  ctx.drawImage(R.bloomT, 0, 0, W, H);
  // Anamorphic streaks: smear the bright pass sideways, tint it blue, add it back.
  bt.clearRect(0, 0, W / 4, H / 4);
  bt.globalCompositeOperation = 'lighter';
  for (let k = 1; k <= 6; k++) {
    bt.globalAlpha = 0.34 / k;
    bt.drawImage(R.bloomS, k * 14, 0);
    bt.drawImage(R.bloomS, -k * 14, 0);
  }
  bt.globalAlpha = 1;
  bt.globalCompositeOperation = 'multiply';
  bt.fillStyle = '#7f9dff';
  bt.fillRect(0, 0, W / 4, H / 4);
  bt.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.14;
  ctx.drawImage(R.bloomT, 0, 0, W, H);
  ctx.restore();
  // A faint violet lift in the blacks, then vignette.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(28,14,48,0.07)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(R.vignette, 0, 0);
  // Grain (changes every other frame to stay gentle on the encoder).
  const fr = Math.floor(t * FPS / 2);
  ctx.globalCompositeOperation = 'overlay';
  drawStatic(ctx, 0, 0, W, H, fr, 0.03, 1.5);
  ctx.restore();
}

function renderFrame(ctx, t) {
  initRenderer();
  const act = composite(ctx, t);
  post(ctx, t, act);
  // Global fade in/out at the very ends.
  const a = sstep(0, 0.6, t) * (1 - sstep(VIDEO_LEN - 1.6, VIDEO_LEN, t));
  if (a < 1) {
    ctx.fillStyle = `rgba(0,0,0,${1 - a})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---------------- page wiring ----------------
(function () {
  const canvas = document.getElementById('c');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(location.search);
  const fontsReady = Promise.all([
    "400 100px 'New Rocker'", "700 100px 'Syncopate'", "400 100px 'Syncopate'", "400 100px 'Share Tech Mono'",
  ].map(f => document.fonts.load(f))).catch(() => {});
  window.__ready = Promise.all([fontsReady, loadArt()]).then(() => { initRenderer(); return true; });
  window.renderAt = (t, q = 0.93) => { renderFrame(ctx, t); return canvas.toDataURL('image/jpeg', q); };
  window.shotList = () => SHOTS.map(s => ({ scene: s.scene, start: +s.start.toFixed(2), end: +s.end.toFixed(2), section: s.section }));

  if (params.has('render')) { document.body.classList.add('render'); return; }

  const ui = {
    play: document.getElementById('play'), scrub: document.getElementById('scrub'), time: document.getElementById('time'),
    file: document.getElementById('file'), label: document.getElementById('sect'), full: document.getElementById('full'),
  };
  let playing = false, base = params.has('t') ? parseFloat(params.get('t')) : 0, wall = 0, audio = null;
  const now = () => (audio ? audio.currentTime : playing ? base + (performance.now() - wall) / 1000 : base);
  const setPlaying = p => {
    if (audio) { p ? audio.play() : audio.pause(); }
    else if (p) { wall = performance.now(); } else { base = now(); }
    playing = p;
    ui.play.textContent = p ? 'Pause' : 'Play';
  };
  ui.play.onclick = () => setPlaying(!playing);
  ui.scrub.max = VIDEO_LEN;
  ui.scrub.oninput = () => {
    const v = parseFloat(ui.scrub.value);
    if (audio) audio.currentTime = Math.min(v, audio.duration || v);
    base = v; wall = performance.now();
  };
  ui.file.onchange = () => {
    const f = ui.file.files[0];
    if (!f) return;
    if (audio) audio.pause();
    audio = new Audio(URL.createObjectURL(f));
    audio.currentTime = 0;
    audio.onended = () => setPlaying(false);
    setPlaying(false);
    base = 0;
  };
  ui.full.onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
  document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); } });
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const loop = () => {
    let t = now();
    if (!audio && t >= VIDEO_LEN) { t = VIDEO_LEN; if (playing) setPlaying(false); base = 0; }
    renderFrame(ctx, Math.min(t, VIDEO_LEN - 0.001));
    if (document.activeElement !== ui.scrub) ui.scrub.value = t;
    const act = SHOTS.find(s => t >= s.start && t < s.end);
    ui.time.textContent = fmt(t) + ' / ' + fmt(VIDEO_LEN);
    ui.label.textContent = act ? act.section : '';
    requestAnimationFrame(loop);
  };
  window.__ready.then(() => requestAnimationFrame(loop));
})();
