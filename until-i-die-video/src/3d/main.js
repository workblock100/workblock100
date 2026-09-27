// Frame composer and player. Finds the active shot(s) for time t, updates them, renders through the
// pipeline, then draws titles on a 2D canvas. Also runs the in-browser player unless ?render is set.
import * as THREE from 'three';
import { Pipeline } from './pipeline.js';
import { SHOT_BUILDERS } from './shots.js';
import './shots-chorus.js';
import './shots-verse.js';
import { buildShots, VIDEO_LEN, SECTION_STARTS } from './timeline.js';
import { TIME } from './kit.js';
import { drawTitle, drawEndCard } from './overlay.js';
import { W, H, clamp, sstep } from './util.js';

const FPS = 30;
const SHOTS = buildShots();
const pipe = new Pipeline();
const out = document.getElementById('c');
const ctx = out.getContext('2d');

// 2D-only shots draw over a black 3D frame.
SHOT_BUILDERS.endCard = () => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 10);
  return { scene, camera, look: { bloom: 0 }, update() {}, overlay: (g, I, a) => drawEndCard(g, I.lt, I.t, a) };
};

const cache = new Map();
function instance(shot, slot) {
  const key = shot.scene + JSON.stringify(shot.params) + '|' + shot.v + '|' + slot;
  if (!cache.has(key)) {
    const make = SHOT_BUILDERS[shot.scene] || SHOT_BUILDERS.placeholder;
    cache.set(key, make(shot.params || {}, shot.v || 0));
  }
  return cache.get(key);
}

function info(shot, t) {
  const lt = t - shot.start, dur = shot.end - shot.start;
  return { t, lt, dur, p: lt / dur, v: shot.v || 0, params: shot.params || {}, section: shot.section, tt: shot.tt, frame: Math.round(t * FPS), start: shot.start };
}

function activeAt(t) {
  let i = SHOTS.findIndex(s => t >= s.start && t < s.end);
  if (i < 0) i = t < SHOTS[0].start ? 0 : SHOTS.length - 1;
  const cur = SHOTS[i], nxt = SHOTS[i + 1], prv = SHOTS[i - 1];
  if (nxt && nxt.tin > 0 && t > nxt.start - nxt.tin / 2) return { A: cur, B: nxt, w: sstep(nxt.start - nxt.tin / 2, nxt.start + nxt.tin / 2, t), type: nxt.tt };
  if (prv && cur.tin > 0 && t < cur.start + cur.tin / 2) return { A: prv, B: cur, w: sstep(cur.start - cur.tin / 2, cur.start + cur.tin / 2, t), type: cur.tt };
  return { A: cur, B: null, w: 0, type: 'none' };
}

const lerpLook = (a = {}, b = {}, w) => {
  const o = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k], y = b[k];
    o[k] = x === undefined ? y : y === undefined ? x : x + (y - x) * w;
  }
  return o;
};

export function renderFrame(t) {
  const act = activeAt(t);
  TIME.value = t;
  const IA = info(act.A, t);
  const A = instance(act.A, 'a');
  A.update(IA);
  let B = null, IB = null;
  if (act.B) {
    IB = info(act.B, t);
    B = instance(act.B, act.B.scene === act.A.scene ? 'b' : 'a');
    B.update(IB);
  }
  const look = { ...lerpLook(A.look, B ? B.look : A.look, B ? act.w : 0) };
  if (A.lookAt) Object.assign(look, A.lookAt(IA));
  // Global fade in and out at the very ends.
  look.fade = sstep(0, 0.6, t) * (1 - sstep(VIDEO_LEN - 1.6, VIDEO_LEN, t));
  pipe.render({ A, B, w: act.w, type: act.type, t, look });
  ctx.globalAlpha = 1;
  ctx.drawImage(pipe.gl, 0, 0);
  const wA = B ? 1 - act.w : 1;
  if (A.overlay) A.overlay(ctx, IA, act.type === 'cut' ? (act.w < 0.5 ? 1 : 0) : wA * look.fade);
  if (B && B.overlay) B.overlay(ctx, IB, act.type === 'cut' ? (act.w < 0.5 ? 0 : 1) : act.w * look.fade);
}

// ---------------- page wiring ----------------
const params = new URLSearchParams(location.search);
const fontsReady = Promise.all(["400 100px 'New Rocker'", "700 100px 'Syncopate'", "400 100px 'Syncopate'", "400 100px 'Share Tech Mono'"]
  .map(f => document.fonts.load(f))).catch(() => {});
window.__ready = fontsReady.then(() => true);
window.renderAt = (t, q = 0.93) => { renderFrame(t); return out.toDataURL('image/jpeg', q); };
window.shotList = () => SHOTS.map(s => ({ scene: s.scene, start: +s.start.toFixed(2), end: +s.end.toFixed(2), section: s.section }));
window.VIDEO_LEN = VIDEO_LEN;
window.SECTION_STARTS = SECTION_STARTS;

if (params.has('render')) {
  document.body.classList.add('render');
} else {
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
    renderFrame(Math.min(t, VIDEO_LEN - 0.001));
    if (document.activeElement !== ui.scrub) ui.scrub.value = t;
    const act = SHOTS.find(s => t >= s.start && t < s.end);
    ui.time.textContent = fmt(t) + ' / ' + fmt(VIDEO_LEN);
    ui.label.textContent = act ? act.section : '';
    requestAnimationFrame(loop);
  };
  window.__ready.then(() => requestAnimationFrame(loop));
}
