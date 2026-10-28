'use strict';
/* SHIFT HAPPENS, Episode 13: ep13_vault (work in progress: room and light test) */
(() => {
if (!window.TIMELINE_EP13) return;
const { person, zoomTo, faceC, faceZoom, drawBg, inB } = window.H6;
const A7 = window.A7, A10 = window.A10, A11 = window.A11, A13 = window.A13, S6 = window.S6, S7 = window.S7;
const { p2, poly, grad, radial, rgba } = V2;
const { box3, onZ, kz, lit, table3, chair3, wallClock, ceilingLamp, backWindow } = S6;
const bs = id => B(id).s, be = id => B(id).e;
const sr = (i, s = 0) => hash(i * 3.17 + s * 11.3 + 1.3);
const cl01 = x => Math.max(0, Math.min(1, x));
const sk = (t, a, b) => { const k = cl01((t - a) / (b - a)); return k * k * (3 - 2 * k); };

// ------------------------------------------------------------------ the room (world units: X right, Y up, Z forward; the camera looks north from the door wall)
const ZB = 2200, HW = 460, CH = 600;
const CAMP = { f: 1400, cy: 330, hy: 860 };
const TBL = { x: -60, z: 1380, w: 150, d: 66, h: 135 };
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => hex(V2.rgb(c).map(v => v * f));

// ------------------------------------------------------------------ the light map: everything is drawn as if the room were lit, then multiplied by what the lights actually reach
const LM = { cv: V2.mk(540, 960), s: .5 };
LM.g = LM.cv.getContext('2d');
function lmBegin(amb) {   // amb: [r, g, b] 0..255, the level of the whole room
  const g = LM.g, m = ctx.getTransform();
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.fillStyle = `rgb(${amb[0] | 0},${amb[1] | 0},${amb[2] | 0})`; g.fillRect(0, 0, LM.cv.width, LM.cv.height);
  g.setTransform(m.a * LM.s, m.b * LM.s, m.c * LM.s, m.d * LM.s, m.e * LM.s, m.f * LM.s);
  g.globalCompositeOperation = 'lighter';
}
// a soft elliptical patch of light: centre, radii, rotation, colour 'r,g,b', strength, hardness (0 soft .. 1 hard edge)
function lmSpot(x, y, rx, ry, color, a, o = {}) {
  if (a <= 0) return;
  const g = LM.g, hard = o.hard ?? .45;
  g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, `rgba(${color},${a})`); gr.addColorStop(Math.max(.05, hard), `rgba(${color},${a * (o.mid ?? .9)})`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}
// a lit cone's footprint plus the air between the lamp and it (a light shaft of lighter fog)
function lmPoly(pts, color, a) {
  const g = LM.g; g.save(); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = `rgba(${color},${a})`; g.fill(); g.restore();
}
function lmApply() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(LM.cv, 0, 0, W, H); ctx.restore();
}

// ------------------------------------------------------------------ cones of light in the air: soft, layered, widening from the lamp to the thing it hits
function beamVol(S, T, r0, r1, color, a, o = {}) {
  const dx = T[0] - S[0], dy = T[1] - S[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const layers = [[1, .22], [.72, .3], [.46, .38], [.24, .5]];
  for (const [k, w] of layers) {
    ctx.fillStyle = V2.grad(S[0], S[1], T[0], T[1], [[0, rgba(color, a * w * (o.near ?? 1))], [.55, rgba(color, a * w * .72)], [1, rgba(color, a * w * (o.far ?? .5))]]);
    ctx.beginPath(); ctx.moveTo(S[0] + nx * r0 * k, S[1] + ny * r0 * k); ctx.lineTo(T[0] + nx * r1 * k, T[1] + ny * r1 * k); ctx.lineTo(T[0] - nx * r1 * k, T[1] - ny * r1 * k); ctx.lineTo(S[0] - nx * r0 * k, S[1] - ny * r0 * k); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.vault = {
  shot: () => 'test',
  cam() { V2.setCam(CAMP); zoomTo(540, 960, 1); },
  draw(lt) {
    V2.setLight({ key: [-.3, -.85], keyColor: '#fff0d8', keyA: .3, rim: '#9fc4ff', rimA: .35, shadow: '#101a24', shadowA: .4, amb: '#cfe0d8', ambA: .06 });
    S6.shell({ zb: ZB, hw: HW, ch: CH, wall: '#a7b3a8', wain: '#5f7f80', floorA: '#b4b8ad', floorB: '#8b9187', ceil: '#a9b1a8', fog: '#5b6b6a', fogAmt: .35, tile: 110, bright: .9, rail: 100 });
    table3(TBL.x, TBL.z, { w: TBL.w, d: TBL.d, h: TBL.h, color: '#b89a68' });
    const sx = 140 + 120 * Math.sin(lt * 1.3);
    lmBegin([14, 20, 24]);
    lmSpot(540, 880, 150, 150, '255,240,205', .95);
    lmSpot(sx, 1150, 110, 110, '255,240,205', .9);
    lmApply();
    beamVol([sx - 80, 1500], [sx, 1150], 8, 90, '255,240,210', .5);
  },
  fx: () => ({ bloom: .5, vignette: .6 }),
  blur: () => 1,
  over() {},
};
})();
