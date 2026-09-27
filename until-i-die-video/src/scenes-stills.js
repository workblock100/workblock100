'use strict';
// One function per painted shot. Each moves a camera over its still and animates what's in it.
// Positions like (0.55, 0.26) are fractions of the source image (x, y).

// Beat-synced zoom kick inside choruses.
const kick = (I, amt = 0.006) => (I.section.startsWith('chorus') ? amt * beatPulse(I.t, SECTION_STARTS[I.section]) : 0);

// ---------------- intro ----------------
SCENES.s_intro = (g, I) => {
  const { t, lt } = I;
  const c = shotCam(I, { a: [1.0, 0.46, 0.42], b: [1.2, 0.44, 0.47], ease: sstep.bind(null, 0, 1) });
  g.save();
  const P = plate(g, '01_intro', c);
  const [lx, ly] = P.map(0.37, 0.035);
  flare(g, lx, ly, 70 * P.k, [215, 190, 255], 0.55 * flicker(t, 3));
  g.restore();
  // Puddle ripples on the street.
  warpRows(g, H * 0.72, H, y => Math.sin(y * 0.09 + t * 3.2) * 2.6 * remap(y, H * 0.72, H, 0, 1));
  drawSplashes(g, t, { n: 50, y0: H * 0.8, y1: H, alpha: 0.28, color: [215, 200, 255] });
  rain(g, t, { seed: 2 });
  rainFront(g, t);
  // Title.
  const a1 = window01(lt, 2.0, 9.4, 1.4, 1.0), a2 = window01(lt, 2.8, 9.4, 1.6, 1.0), a3 = window01(lt, 4.2, 9.4, 1.2, 1.0);
  g.save();
  g.textAlign = 'center';
  g.font = "700 30px 'Syncopate'";
  g.fillStyle = rgba([236, 228, 255], 0.92 * a1);
  spacedText(g, 'JUICE WRLD', W / 2, H * 0.33, 22);
  g.font = "400 150px 'New Rocker'";
  g.globalCompositeOperation = 'lighter';
  g.filter = 'blur(24px)';
  g.fillStyle = rgba([170, 90, 255], 0.55 * a2);
  g.fillText('Until I Die', W / 2, H * 0.47);
  g.filter = 'none';
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = rgba([248, 242, 255], a2);
  g.fillText('Until I Die', W / 2, H * 0.47);
  g.font = "400 19px 'Syncopate'";
  g.fillStyle = rgba([205, 190, 240], 0.85 * a3);
  spacedText(g, 'PARTY IN MY MIND', W / 2, H * 0.535, 12);
  g.restore();
};

// ---------------- chorus ----------------
SCENES.s_walk = (g, I) => {
  const { t } = I;
  const c = shotCam(I, { a: [1.12, 0.4, 0.5], b: [1.2, 0.42, 0.46], drift: 3 }, kick(I));
  // Footstep bob, two steps per beat pair.
  c.dy += Math.abs(Math.sin(t * Math.PI / beatLen())) * 3;
  g.save();
  const P = plate(g, '02_walk', c);
  const [ox, oy] = P.map(0.435, 0.3);
  const pulse = 0.8 + 0.2 * Math.sin(t * 2.4);
  g.globalCompositeOperation = 'lighter';
  glow(g, ox, oy, 220 * P.k, [180, 140, 255], 0.35 * pulse);
  glow(g, ox, oy, 46 * P.k, [255, 245, 255], 0.7 * pulse, 1);
  g.globalCompositeOperation = 'source-over';
  // Motes circling the orb.
  for (let i = 0; i < 9; i++) {
    const ang = t * (0.9 + 0.2 * hash(i, 4)) + i * TAU / 9;
    const rr = (70 + 40 * hash(i, 5)) * P.k;
    g.globalCompositeOperation = 'lighter';
    glow(g, ox + Math.cos(ang) * rr, oy + Math.sin(ang) * rr * 0.45, 8 * P.k, [230, 210, 255], 0.6);
  }
  g.globalCompositeOperation = 'source-over';
  g.restore();
  // The world slides back past him: fog and floor dust drift left.
  fog(g, t, { y0: H * 0.55, y1: H * 0.95, vx: -60, a: 0.14, c: [160, 120, 235] });
  particles(g, t, { n: 40, y0: H * 0.7, y1: H, vx: -90, vy: -4, size: 2, a: 0.5, seed: 8 });
  particles(g, t, { n: 50, kind: 'sparkle', y0: 0, y1: H * 0.45, vx: -4, vy: 0, size: 2, a: 0.5, seed: 12 });
  grade(g, I.v);
};

SCENES.s_eye = (g, I) => {
  const { t, frame } = I;
  const c = shotCam(I, { a: [1.0, 0.5, 0.42], b: [1.3, 0.55, 0.3] }, kick(I));
  g.save();
  const P = plate(g, '03_eye', c);
  const [px, py] = P.map(0.553, 0.262);
  const r = 0.068 * P.dw;
  // Live TV static in the pupil.
  g.save();
  g.beginPath(); g.arc(px, py, r, 0, TAU); g.clip();
  g.globalCompositeOperation = 'overlay';
  drawStatic(g, px - r, py - r, r * 2, r * 2, Math.floor(frame / 2), 0.9, 1.4);
  g.globalCompositeOperation = 'screen';
  drawStatic(g, px - r, py - r, r * 2, r * 2, Math.floor(frame / 2) + 3, 0.18, 1.4);
  g.restore();
  g.globalCompositeOperation = 'lighter';
  glow(g, px, py, r * 2.2, [190, 150, 255], 0.22 + 0.08 * Math.sin(t * 3));
  g.restore();
  lightning(g, t, [I.t - I.lt + I.dur * 0.62], { a: 0.35 });
  rain(g, t, { seed: 4, alpha: 0.16 });
  grade(g, I.v);
};

SCENES.s_perform = (g, I) => {
  const { t } = I;
  const close = !!I.params.close;
  const m = close ? { a: [1.4, 0.5, 0.26], b: [1.52, 0.5, 0.24] } : { a: [1.05, 0.5, 0.36], b: [1.14, 0.5, 0.3] };
  const c = shotCam(I, m, kick(I, 0.01) + 0.004 * Math.sin(t * 1.6));
  g.save();
  const P = plate(g, '04_perform', c);
  // Neon tubes breathe and hit on the beat.
  const hit = I.section.startsWith('chorus') ? beatPulse(t, SECTION_STARTS[I.section], 5) : 0;
  g.globalCompositeOperation = 'lighter';
  [[0.155, [255, 80, 230]], [0.305, [90, 200, 255]], [0.73, [90, 200, 255]], [0.87, [255, 80, 230]]].forEach(([u, col], i) => {
    const [x, y0] = P.map(u, 0.03), [, y1] = P.map(u, 0.86);
    const f = flicker(t, 20 + i, 0.5) * (0.55 + 0.45 * hit);
    g.globalAlpha = 0.18 * f;
    g.drawImage(glowSprite(col), x - 90 * P.k, y0, 180 * P.k, y1 - y0);
  });
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.restore();
  // Wind in the hair.
  warpRows(g, 0, H * (close ? 0.45 : 0.3), y => Math.sin(y * 0.035 + t * 2.1) * 1.6);
  fog(g, t, { y0: H * 0.75, y1: H * 1.05, vx: 30, a: 0.16, c: [190, 90, 240] });
  rain(g, t, { seed: 6, alpha: 0.18 });
  lightSweep(g, t, I.t - I.lt + 0.2, I.dur * 0.9, { a: 0.12 });
  grade(g, I.v);
};

SCENES.s_shards = (g, I) => {
  const { t } = I;
  const c = shotCam(I, { a: [1.05, 0.5, 0.45], b: [1.22, 0.5, 0.4], rot: [-0.012, 0.018] }, kick(I));
  g.save();
  plate(g, '05_shards', c);
  g.restore();
  particles(g, t, { n: 70, kind: 'sparkle', vx: 0, vy: -6, size: 3, a: 0.7, c: [220, 200, 255], seed: 21 });
  particles(g, t, { n: 40, vx: 8, vy: -14, size: 2, a: 0.45, seed: 22 });
  lightSweep(g, t, I.t - I.lt + 0.4, 2.2, { a: 0.2, c: [230, 210, 255], width: 260, ang: -0.5 });
  grade(g, I.v);
};

SCENES.s_photos = (g, I) => {
  const { t } = I;
  const c = shotCam(I, { a: [1.16, 0.36, 0.42], b: [1.16, 0.6, 0.55], rot: [0.01, -0.01] }, kick(I));
  g.save();
  const P = plate(g, '06_photos', c);
  // Ink running off the bottom edges of the photos.
  const edges = [[0.1, 0.34, 0.6], [0.58, 0.82, 0.55], [0.42, 0.6, 0.93]];
  g.fillStyle = 'rgba(8,4,14,0.9)';
  edges.forEach(([u0, u1, v], k) => {
    for (let i = 0; i < 6; i++) {
      const u = lerp(u0, u1, hash(i, k, 31));
      const ph = fract(t * (0.35 + 0.25 * hash(i, k, 32)) + hash(i, k, 33));
      const [x, y] = P.map(u, v);
      const fall = ph * ph * 260 * P.k;
      const rr = (3 + 3 * hash(i, k, 34)) * P.k;
      g.globalAlpha = 1 - ph;
      g.beginPath(); g.ellipse(x, y + fall, rr, rr * (1.4 + ph * 2), 0, 0, TAU); g.fill();
    }
  });
  g.globalAlpha = 1;
  g.restore();
  particles(g, t, { n: 45, vx: 10, vy: -10, size: 2.5, a: 0.5, c: [255, 190, 170], seed: 23 });
  lightSweep(g, t, I.t - I.lt, I.dur, { a: 0.14, c: [255, 170, 150], width: 500 });
  grade(g, I.v);
};

SCENES.s_closeup = (g, I) => {
  const { t } = I;
  const c = shotCam(I, { a: [1.06, 0.5, 0.45], b: [1.2, 0.56, 0.4], drift: 4 }, kick(I, 0.008));
  g.save();
  const P = plate(g, '07_closeup', c);
  const [ex, ey] = P.map(0.625, 0.345);
  g.globalCompositeOperation = 'lighter';
  const tw = 0.6 + 0.4 * Math.sin(t * 1.3);
  drawGlint(g, ex, ey, 26 * P.k * tw, [240, 230, 255], 0.55 * tw);
  const [rx, ry] = P.map(0.97, 0.3);
  glow(g, rx, ry, 420 * P.k, [255, 60, 220], 0.12 * flicker(t, 31));
  g.globalCompositeOperation = 'source-over';
  g.restore();
  warpRows(g, 0, H * 0.42, y => Math.sin(y * 0.022 + t * 1.7) * 2.2 * remap(y, H * 0.42, 0, 0, 1));
  // Soft bokeh drifting behind the rain.
  particles(g, t, { n: 14, vx: 12, vy: -5, size: 18, a: 0.16, c: [120, 170, 255], seed: 33 });
  rain(g, t, { seed: 7, alpha: 0.2 });
  rainFront(g, t, { seed: 11, a: 0.16 });
  grade(g, I.v);
};

// Beads of water sliding down a pane inside a screen rectangle.
function windowDrops(g, t, x0, y0, x1, y1, o = {}) {
  const { n = 70, seed = 41 } = o;
  g.save();
  g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(i, seed) * (x1 - x0);
    const sp = 30 + 90 * hash(i, seed, 1);
    const y = y0 + fract(hash(i, seed, 2) + t * sp / (y1 - y0)) * (y1 - y0);
    const r = 2 + 3 * hash(i, seed, 3);
    const trail = 40 + 90 * hash(i, seed, 4);
    const gr = g.createLinearGradient(x, y - trail, x, y);
    gr.addColorStop(0, 'rgba(210,200,255,0)');
    gr.addColorStop(1, 'rgba(210,200,255,0.14)');
    g.strokeStyle = gr; g.lineWidth = r * 0.8;
    g.beginPath(); g.moveTo(x, y - trail); g.lineTo(x, y); g.stroke();
    g.fillStyle = 'rgba(235,228,255,0.32)';
    g.beginPath(); g.arc(x, y, r * 0.8, 0, TAU); g.fill();
  }
  g.restore();
}

SCENES.s_window = (g, I) => {
  const { t } = I;
  const c = shotCam(I, { a: [1.08, 0.46, 0.45], b: [1.18, 0.52, 0.42] }, kick(I));
  g.save();
  const P = plate(g, '08_window', c);
  const [wx0, wy0] = P.map(0.3, 0.02), [wx1, wy1] = P.map(0.97, 0.8);
  windowDrops(g, t, wx0, wy0, wx1, wy1);
  g.restore();
  const s0 = I.t - I.lt;
  lightning(g, t, [s0 + I.dur * 0.3, s0 + I.dur * 0.36], { a: 0.5 });
  grade(g, I.v);
};

SCENES.s_stage = (g, I) => {
  const { t } = I;
  // The whole frame sways a hair, like the strings are being worked.
  const c = shotCam(I, { a: [1.0, 0.5, 0.5], b: [1.16, 0.5, 0.44], rot: [0, 0] }, kick(I));
  c.rot += Math.sin(t * 1.3) * 0.004;
  g.save();
  const P = plate(g, '09_stage', c);
  // Strings from the wrists and shoulders up into the dark.
  const anchors = [[0.405, 0.6], [0.615, 0.6], [0.45, 0.38], [0.56, 0.38]];
  g.globalCompositeOperation = 'lighter';
  g.lineWidth = 1.4;
  anchors.forEach(([u, v], i) => {
    const [x, y] = P.map(u, v);
    const sway = Math.sin(t * 1.3 + i) * 6 * P.k;
    g.strokeStyle = rgba([230, 220, 255], 0.35 + 0.15 * Math.sin(t * 4 + i));
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sway, (y + P.oy) / 2, x + sway * 2, P.oy - 10); g.stroke();
  });
  g.globalCompositeOperation = 'source-over';
  const [sx0] = P.map(0.4, 0), [sx1] = P.map(0.6, 0);
  g.restore();
  particles(g, t, { n: 60, x0: sx0, x1: sx1, y0: 0, y1: H * 0.95, vx: 3, vy: -8, size: 2, a: 0.55, c: [255, 245, 230], seed: 51 });
  grade(g, I.v);
};

SCENES.s_headparty = (g, I) => {
  const { t, frame } = I;
  const sec = SECTION_STARTS[I.section] || 0;
  const hit = beatPulse(t, sec, 4);
  const c = shotCam(I, { a: [1.04, 0.5, 0.5], b: [1.14, 0.5, 0.46], rot: [-0.008, 0.008] }, kick(I, 0.012));
  g.save();
  const P = plate(g, '10_headparty', c);
  const [ox, oy] = P.map(0.52, 0.47);
  // Sweeping laser fans.
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const ang = -Math.PI / 2 + Math.sin(t * 0.9 + i * 0.9) * 0.9;
    const len = 900 * P.k;
    const col = i % 2 ? [90, 200, 255] : [255, 70, 220];
    const a = (0.25 + 0.5 * hit) * (0.6 + 0.4 * Math.sin(t * 3 + i));
    g.strokeStyle = rgba(col, 0.2 * a); g.lineWidth = 14 * P.k;
    g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(ang) * len, oy + Math.sin(ang) * len); g.stroke();
    g.strokeStyle = rgba(mixc(col, [255, 255, 255], 0.6), 0.8 * a); g.lineWidth = 2.5 * P.k;
    g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(ang) * len, oy + Math.sin(ang) * len); g.stroke();
  }
  glow(g, ox, oy, 160 * P.k, [255, 120, 240], 0.35 + 0.4 * hit);
  // A pulse racing along the heartbeat line.
  const [, ly] = P.map(0, 0.83);
  const run = fract((t - sec) / (beatLen() * 2));
  const hx = lerp(-100, W + 100, run);
  glow(g, hx, ly, 90, [255, 90, 220], 0.7);
  glow(g, hx, ly, 18, [255, 255, 255], 0.9, 1);
  g.restore();
  g.restore();
  particles(g, t, { n: 50, kind: 'sparkle', vx: 0, vy: 40, size: 2, a: 0.6, c: [255, 180, 255], seed: 61 });
  // The whole frame flashes a touch on the downbeat of each bar (slow, photosensitivity-safe).
  const bar = beatPulse(t, sec, 9) * (Math.floor((t - sec) / beatLen()) % 4 === 0 ? 1 : 0);
  if (bar > 0.02) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rgba([255, 200, 255], 0.12 * bar); g.fillRect(0, 0, W, H); g.restore(); }
  if (frame % 1 === 0) grade(g, I.v);
};

// ---------------- verse 1 ----------------
SCENES.s_mirror = (g, I) => {
  const { t, frame } = I;
  const c = shotCam(I, { a: [1.04, 0.56, 0.45], b: [1.22, 0.7, 0.42] });
  g.save();
  const P = plate(g, '11_mirror', c);
  const [mx0, my0] = P.map(0.52, 0.08), [mx1, my1] = P.map(0.96, 0.9);
  const [lx, ly] = P.map(0.72, 0.03);
  const fl = flicker(t, 71, 1.2);
  g.globalCompositeOperation = 'lighter';
  glow(g, lx, ly, 260 * P.k, [200, 255, 220], 0.18 * fl);
  g.restore();
  // The tube stutters: the room darkens with it.
  if (fl < 0.95) { g.save(); g.fillStyle = `rgba(0,0,0,${(0.95 - fl) * 0.6})`; g.fillRect(0, 0, W, H); g.restore(); }
  // The reflection glitches in bursts.
  const burst = window01(fract(I.lt / 1.1), 0.55, 0.8, 0.04, 0.06);
  glitchRect(g, mx0, my0, mx1, my1, frame, 0.25 + 0.75 * burst);
};

SCENES.s_drive = (g, I) => {
  const { t } = I;
  const c = shotCam(I, { a: [1.02, 0.5, 0.5], b: [1.2, 0.5, 0.45], shake: 0.35, ease: easeIn });
  g.save();
  const P = plate(g, '12_drive', c);
  const [vx, vy] = P.map(0.5, 0.36);
  [[0.37, 0.845], [0.63, 0.845]].forEach(([u, v], i) => {
    const [x, y] = P.map(u, v);
    g.globalCompositeOperation = 'lighter';
    glow(g, x, y, 150 * P.k, [255, 40, 50], 0.35 * flicker(t, 80 + i, 0.2));
  });
  g.globalCompositeOperation = 'source-over';
  g.restore();
  // Heat shimmer over the fire line.
  warpRows(g, H * 0.2, H * 0.48, y => Math.sin(y * 0.2 + t * 9) * 2.4);
  // Speed streaks radiating from the vanishing point.
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const ang = hash(i, 91) * TAU;
    const ph = fract(hash(i, 92) + t * (0.9 + hash(i, 93)));
    const r0 = 200 + ph * ph * 1300, r1 = r0 + 60 + ph * 260;
    g.strokeStyle = rgba([255, 170, 120], 0.35 * ph);
    g.lineWidth = 1 + 2 * ph;
    g.beginPath();
    g.moveTo(vx + Math.cos(ang) * r0, vy + Math.sin(ang) * r0 * 0.6);
    g.lineTo(vx + Math.cos(ang) * r1, vy + Math.sin(ang) * r1 * 0.6);
    g.stroke();
  }
  g.restore();
  particles(g, t, { n: 60, kind: 'ember', vx: 160, vy: 90, size: 2.5, a: 0.75, c: [255, 140, 60], seed: 94 });
  particles(g, t, { n: 40, kind: 'ember', vx: -160, vy: 90, size: 2.5, a: 0.75, c: [255, 120, 50], seed: 95 });
};

SCENES.s_shockwave = (g, I) => {
  const { t, lt } = I;
  const bar = beatLen() * 4;
  const since = ((lt - 0.15) % bar + bar) % bar;
  const hitA = Math.exp(-since * 5);
  const c = shotCam(I, { a: [1.16, 0.5, 0.5], b: [1.02, 0.5, 0.5], ease: easeOut }, 0.02 * hitA);
  c.dx += hashs(Math.floor(t * 30), 1) * 10 * hitA;
  c.dy += hashs(Math.floor(t * 30), 2) * 10 * hitA;
  g.save();
  const P = plate(g, '13_shockwave', c);
  const [cx, cy] = P.map(0.5, 0.56);
  const p = since / bar;
  ring(g, cx, cy, easeOut(p) * 1100 * P.k, 9 * P.k, [200, 140, 255], 0.8 * (1 - p) * (1 - p));
  ring(g, cx, cy, easeOut(clamp(p * 1.6)) * 800 * P.k, 6 * P.k, [255, 220, 255], 1 - clamp(p * 1.6));
  g.globalCompositeOperation = 'lighter';
  glow(g, cx, cy - 120 * P.k, 300 * P.k, [190, 130, 255], 0.25 + 0.4 * hitA);
  g.restore();
  particles(g, t, { n: 60, vx: 0, vy: -30, size: 2.5, a: 0.5, c: [210, 170, 255], seed: 101 });
  if (hitA > 0.05) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rgba([220, 190, 255], 0.2 * hitA); g.fillRect(0, 0, W, H); g.restore(); }
};

// ---------------- end card: three nines drawn as a constellation ----------------
function ninePoints(cx, cy, s) {
  // Loop starting at its right side, then a tail that drops and hooks left, like a handwritten 9.
  const pts = [];
  const r = s * 0.36, ly = cy - s * 0.3;
  for (let i = 0; i <= 11; i++) { const a = -(i / 11) * TAU; pts.push([cx + Math.cos(a) * r, ly + Math.sin(a) * r]); }
  const tail = [[0.36, 0.05], [0.34, 0.3], [0.27, 0.52], [0.13, 0.66], [-0.05, 0.7], [-0.2, 0.64]];
  for (const [x, y] of tail) pts.push([cx + x * s, cy + y * s]);
  return pts;
}

SCENES.endCard = (g, I) => {
  const { lt, t } = I;
  g.save();
  fillBG(g, [[0, [3, 2, 8]], [0.7, [12, 7, 26]], [1, [4, 2, 8]]]);
  drawStars(g, t, { n: 320, alpha: 0.8, y1: H, seed: 71 });
  const form = easeInOut(clamp(lt / 2.6));
  const glyphs = [W / 2 - 250, W / 2, W / 2 + 250].map(x => ninePoints(x, H * 0.33, 250));
  g.save(); g.globalCompositeOperation = 'lighter';
  // Constellation lines.
  g.strokeStyle = rgba(PAL.gold, 0.28 * form);
  g.lineWidth = 1.4;
  g.beginPath();
  for (const pts of glyphs) pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  // Stars fly in from the bottom center and settle into the three nines.
  glyphs.forEach((pts, gi) => pts.forEach(([x, y], i) => {
    const sx = W / 2 + hashs(i, gi) * 120, sy = H * 0.95 + hash(i, gi + 3) * 60;
    const u = easeInOut(clamp((lt - 0.2 - hash(i, gi + 5) * 0.8) / 1.8));
    const px = lerp(sx, x, u), py = lerp(sy, y, u);
    const tw = 0.7 + 0.3 * Math.sin(t * 3 + i + gi);
    glow(g, px, py, 26, PAL.gold, 0.6 * tw, 0);
    glow(g, px, py, 7, PAL.white, 0.95 * tw, 1);
  }));
  g.restore();
  // Text.
  const a = sstep(1.6, 2.8, lt);
  g.textAlign = 'center';
  g.font = "700 34px 'Syncopate'";
  g.fillStyle = rgba([240, 232, 255], a);
  spacedText(g, 'JUICE WRLD', W / 2, H * 0.68, 16);
  g.font = "400 116px 'New Rocker'";
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(20px)'; g.fillStyle = rgba(PAL.gold, 0.45 * a); g.fillText('Until I Die', W / 2, H * 0.8); g.restore();
  g.fillStyle = rgba([255, 244, 225], a);
  g.fillText('Until I Die', W / 2, H * 0.8);
  const b = sstep(2.6, 3.6, lt);
  g.font = "400 18px 'Syncopate'";
  g.fillStyle = rgba([225, 215, 250], 0.95 * b);
  spacedText(g, 'LLJW   1998 - 2019', W / 2, H * 0.865, 10);
  g.font = "400 15px 'Share Tech Mono'";
  g.fillStyle = rgba([190, 180, 220], 0.7 * b);
  g.fillText('unofficial fan-made visual', W / 2, H * 0.94);
  g.restore();
};
