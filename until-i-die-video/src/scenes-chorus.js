'use strict';
// Intro, the three chorus passes, the finale and the end card.
// Chorus shots repeat with a different palette each pass (v = 0, 1, 2) so the hook
// reads as a visual refrain: violet night, then red, then gold.

const VARS = [
  { a: PAL.purple, b: PAL.cyan, c: PAL.magenta, bg: [10, 5, 24], hi: [205, 175, 255], floor: [18, 10, 36] },
  { a: PAL.blood, b: PAL.magenta, c: PAL.ember, bg: [20, 3, 9], hi: [255, 170, 180], floor: [30, 6, 14] },
  { a: PAL.gold, b: PAL.ice, c: PAL.purple, bg: [14, 9, 6], hi: [255, 232, 196], floor: [26, 18, 10] },
];
const vp = v => VARS[v] || VARS[0];

function lampFlicker(lt, seed = 1) {
  if (lt < 0.7) return 0;
  if (lt < 1.6) return hash(Math.floor(lt * 17), seed) > 0.42 ? 1 : 0.12;
  if (lt > 6.1 && lt < 6.55) return hash(Math.floor(lt * 20), seed + 1) > 0.5 ? 1 : 0.35;
  return 1;
}

// ---------------------------------------------------------------- intro
SCENES.titleRain = (g, I) => {
  const { lt, t } = I;
  const P = vp(0);
  const groundY = H * 0.8;
  const on = lampFlicker(lt);
  const fl = flashAt(lt, [5.55, 5.8, 9.45, 9.62]);
  g.save();
  camera(g, { zoom: 1.02 + lt * 0.011, y: -lt * 2.5, x: -lt * 3, t });
  fillBG(g, [[0, [3, 2, 9]], [0.5, [13, 7, 28]], [0.72, [20, 10, 38]], [1, [4, 2, 8]]]);
  drawStars(g, t, { n: 110, alpha: 0.45, y1: H * 0.5, seed: 3 });
  drawClouds(g, t, { seed: 8, y: -40, h: 420, base: '#0d0820', lit: '#3b2a70', speed: 6, alpha: 0.9, flash: fl * 0.8 });
  if (fl > 0.05) drawBolt(g, W * 0.18, -20, W * 0.26, H * 0.62, 41 + (lt > 9 ? 7 : 0), fl, P.hi, 2.2, 2);
  drawCity(g, 11, H * 0.74, 300, 300 + t * 3, { col: '#0a0617', win: '#9c7bff', winP: 0.07, minH: 0.2 });
  drawFog(g, t, { y: H * 0.7, color: [70, 45, 140], alpha: 0.22, n: 10, seed: 4 });
  // Wet asphalt.
  g.fillStyle = vgrad(g, H * 0.74, H, [[0, [12, 7, 22]], [1, [2, 1, 4]]]);
  g.fillRect(-W, H * 0.74, W * 3, H);
  // Streetlight.
  const lx = W * 0.68, ly = H * 0.2;
  g.fillStyle = '#07040c';
  g.fillRect(lx + 150, ly - 10, 14, groundY - ly + 20);
  g.fillRect(lx + 20, ly - 12, 144, 10);
  g.beginPath(); g.moveTo(lx - 30, ly); g.lineTo(lx + 40, ly); g.lineTo(lx + 28, ly - 18); g.lineTo(lx - 18, ly - 18); g.closePath(); g.fill();
  const lampC = [255, 214, 160];
  // Cone of light: three nested cones, blurred, so the edges fall off softly.
  const conePath = wd => { const c = new Path2D(); c.moveTo(lx - 20, ly + 2); c.lineTo(lx + 20, ly + 2); c.lineTo(lx + wd, groundY + 30); c.lineTo(lx - wd, groundY + 30); c.closePath(); return c; };
  const cone = conePath(310);
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.filter = 'blur(16px)';
  for (const [wd, al] of [[330, 0.13], [230, 0.14], [140, 0.16]]) {
    const cg = g.createLinearGradient(0, ly, 0, groundY);
    cg.addColorStop(0, rgba(lampC, al * 2 * on)); cg.addColorStop(1, rgba(lampC, al * 0.35 * on));
    g.fillStyle = cg; g.fill(conePath(wd));
  }
  g.filter = 'none';
  glow(g, lx, ly + 4, 140, lampC, 0.9 * on);
  glow(g, lx, ly + 4, 34, PAL.white, on, 1);
  // Pool of light and its reflection streak on the wet road.
  g.save(); g.translate(lx, groundY + 20); g.scale(1, 0.22); glow(g, 0, 0, 420, lampC, 0.35 * on); g.restore();
  g.save(); g.translate(lx, H * 0.93); g.scale(0.25, 1); glow(g, 0, 0, 260, lampC, 0.22 * on); g.restore();
  g.restore();
  // Rain: faint everywhere, bright inside the cone.
  drawRain(g, t, { n: 420, alpha: 0.18, seed: 2 });
  g.save(); g.clip(cone); drawRain(g, t, { n: 700, alpha: 0.55 * on, color: [255, 230, 200], seed: 5 }); g.restore();
  drawSplashes(g, t, { n: 40, y0: groundY - 10, y1: H * 0.98, alpha: 0.35, x0: lx - 380, x1: lx + 380, color: [255, 225, 190] });
  // The Kid under the lamp, head down.
  const breath = Math.sin(t * 1.6);
  const kid = poseFront({ armL: 0.06, armR: 0.07, elL: 0.12, elR: 0.1, tilt: 0.1, sway: breath * 0.2 });
  const kx = lx - 10, kh = 330;
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.ellipse(kx, groundY + 4, 78, 11, 0, 0, TAU); g.fill();
  g.save(); g.globalAlpha = 0.16; g.translate(0, groundY * 2 + 6); g.scale(1, -1); drawKid(g, kx, groundY, kh, kid, {}); g.restore();
  drawKid(g, kx, groundY, kh, kid, { tint: lampC, lit: 0.12 + 0.5 * on, rim: { c: lampC, a: 0.9 * on, dx: 0, dy: -0.006 }, aura: { c: [120, 80, 220], a: 0.35, blur: 20 } });
  g.restore();

  // Title card (screen space).
  const x0 = W * 0.1, ttl = window01(lt, 1.8, 9.3, 0.9, 0.9);
  if (ttl > 0) {
    const drift = -sstep(8.3, 9.3, lt) * 30;
    g.save();
    g.textBaseline = 'alphabetic';
    g.textAlign = 'left';
    // Artist.
    const a1 = window01(lt, 1.8, 9.3, 0.8, 0.9);
    g.font = "700 40px 'Syncopate'";
    g.fillStyle = rgba([235, 228, 255], a1);
    spacedText(g, 'JUICE WRLD', x0, H * 0.34 + drift, lerp(34, 16, easeOut((lt - 1.8) / 1.6)));
    // Song title, blur-in.
    const a2 = window01(lt, 2.7, 9.3, 1.1, 0.9);
    const bl = (1 - easeOut((lt - 2.7) / 1.3)) * 18;
    g.font = "400 176px 'New Rocker'";
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.filter = 'blur(26px)';
    g.fillStyle = rgba(P.a, 0.55 * a2);
    g.fillText('Until I Die', x0 - 6, H * 0.52 + drift);
    g.restore();
    if (bl > 0.3) g.filter = `blur(${bl.toFixed(1)}px)`;
    const tg = g.createLinearGradient(0, H * 0.4, 0, H * 0.53);
    tg.addColorStop(0, rgba([255, 250, 255], a2)); tg.addColorStop(1, rgba([200, 170, 255], a2));
    g.fillStyle = tg;
    g.fillText('Until I Die', x0 - 6, H * 0.52 + drift);
    g.filter = 'none';
    // Subtitle.
    const a3 = window01(lt, 3.9, 9.3, 0.9, 0.9);
    g.font = "400 21px 'Syncopate'";
    g.fillStyle = rgba([200, 185, 240], 0.85 * a3);
    spacedText(g, 'PARTY IN MY MIND', x0 + 4, H * 0.595 + drift, 12);
    g.fillStyle = rgba(P.a, 0.9 * a3);
    g.fillRect(x0 + 4, H * 0.62 + drift, 90 * easeOut((lt - 3.9) / 1.2), 3);
    g.restore();
  }
};

// ---------------------------------------------------------------- chorus: lone walk, orb light
SCENES.voidWalk = (g, I) => {
  const { lt, t, v } = I;
  const P = vp(v);
  const gy = H * 0.74, kh = v === 2 ? 400 : 380;
  const speed = 250;
  g.save();
  camera(g, { zoom: 1.04 + lt * 0.01, x: -lt * 6, t });
  fillBG(g, [[0, [2, 1, 5]], [0.62, P.bg], [0.74, mixc(P.bg, P.a, 0.12)], [1, [1, 0, 2]]]);
  // Horizon haze.
  g.save(); g.globalCompositeOperation = 'lighter';
  g.translate(W / 2, gy); g.scale(1, 0.12); glow(g, 0, 0, W * 0.7, P.a, 0.28); g.restore();
  // Far eyes watching in the dark.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const ex = fract(hash(i, 5) - (lt * speed * 0.12) / W) * W * 1.2 - W * 0.1;
    const ey = gy - 60 - hash(i, 6) * 260;
    const blink = sstep(0.0, 0.08, fract(t * 0.3 + hash(i, 7))) * (1 - sstep(0.85, 0.92, fract(t * 0.3 + hash(i, 7))));
    const a = 0.5 * blink * (0.4 + 0.6 * hash(i, 8));
    glow(g, ex, ey, 12, P.b, a, 1); glow(g, ex + 22, ey, 12, P.b, a, 1);
  }
  g.restore();
  // Reflective floor with receding lines.
  g.save();
  g.strokeStyle = rgba(P.a, 0.12);
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = -20; i <= 20; i++) {
    const xb = W / 2 + i * 180 - ((lt * speed) % 180);
    g.moveTo(W / 2 + (xb - W / 2) * 0.08, gy); g.lineTo(xb + (xb - W / 2) * 1.8, H + 40);
  }
  for (let k = 1; k < 12; k++) {
    const yy = gy + Math.pow(k / 12, 2.2) * (H - gy + 40);
    g.moveTo(-W, yy); g.lineTo(W * 2, yy);
  }
  g.stroke();
  g.restore();
  // The Kid walking; his orb light is the only thing that reveals anything.
  const ph = lt * 0.85;
  const pose = poseWalk(ph);
  const kx = W * 0.42 + lt * 6;
  const orbX = kx + 120 + Math.sin(t * 1.7) * 14, orbY = gy - kh * 0.62 + Math.sin(t * 2.3) * 10;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.save(); g.translate(kx + 40, gy + 10); g.scale(1, 0.18); glow(g, 0, 0, 460, P.a, 0.4); g.restore();
  glow(g, orbX, orbY, 260, P.a, 0.35);
  g.restore();
  g.save(); g.globalAlpha = 0.2; g.translate(0, gy * 2); g.scale(1, -1); drawKid(g, kx, gy, kh, pose, {}); g.restore();
  drawKid(g, kx, gy, kh, pose, { tint: P.hi, lit: 0.5, rim: { c: P.hi, a: 0.85, dx: 0.008, dy: -0.004 }, aura: { c: P.a, a: 0.25, blur: 18 } });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, orbX, orbY, 70, P.a, 0.9);
  glow(g, orbX, orbY, 18, PAL.white, 1, 1);
  // Dust motes in the light.
  for (let i = 0; i < 60; i++) {
    const dx = orbX + hashs(i, 1) * 320 + Math.sin(t * 0.7 + i) * 20;
    const dy = orbY + hashs(i, 2) * 200 + Math.cos(t * 0.5 + i) * 16;
    const d = Math.hypot(dx - orbX, dy - orbY);
    glow(g, dx, dy, 5, P.hi, 0.7 * clamp(1 - d / 330), 1);
  }
  g.restore();
  g.restore();
};

// ---------------------------------------------------------------- chorus: giant eye, static pupil
SCENES.blindEye = (g, I) => {
  const { lt, t, v, dur, frame } = I;
  const P = vp(v);
  const cx = W / 2, cy = H * 0.4;
  const open = clamp(easeOutBack(clamp((lt - 0.1) / 0.9)) * (1 - sstep(dur - 0.35, dur, lt)))
    * (1 - 0.95 * Math.exp(-Math.pow((lt - 2.2) / 0.07, 2)));
  g.save();
  camera(g, { zoom: 1.0 + lt * 0.018, t, shake: 0.15 });
  fillBG(g, [[0, [2, 1, 4]], [0.4, P.bg], [1, [1, 0, 2]]]);
  drawClouds(g, t, { seed: 12, y: H * 0.05, h: 600, base: '#0c0718', lit: '#40285e', speed: 14, alpha: 0.7 });
  // God rays from the eye down to the Kid.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const an = Math.PI / 2 + (i - 3) * 0.12 + Math.sin(t * 0.4 + i) * 0.02;
    const len = H;
    g.fillStyle = vgrad(g, cy, cy + len * 0.7, [[0, P.a, 0.1 * open], [1, P.a, 0]]);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(an - 0.03) * len, cy + Math.sin(an - 0.03) * len);
    g.lineTo(cx + Math.cos(an + 0.03) * len, cy + Math.sin(an + 0.03) * len);
    g.closePath(); g.fill();
  }
  glow(g, cx, cy, 700, P.a, 0.2 * open);
  g.restore();
  // Eye.
  const ew = 560, eh = 250;
  const lookX = noise1(t * 0.9, 3) * 120, lookY = noise1(t * 0.7, 4) * 40;
  g.save();
  g.beginPath(); eyePath(g, cx, cy, ew, eh, Math.max(0.001, open));
  g.save();
  g.clip();
  const sg = g.createRadialGradient(cx, cy, 20, cx, cy, ew);
  sg.addColorStop(0, rgba(mixc(P.bg, P.a, 0.35))); sg.addColorStop(1, rgba([4, 2, 8]));
  g.fillStyle = sg; g.fillRect(cx - ew, cy - eh * 1.4, ew * 2, eh * 2.8);
  const ix = cx + lookX, iy = cy + lookY, ir = 170;
  const ig = g.createRadialGradient(ix, iy, ir * 0.35, ix, iy, ir);
  ig.addColorStop(0, rgba(P.b)); ig.addColorStop(0.55, rgba(P.a)); ig.addColorStop(1, rgba(mixc(P.a, PAL.ink, 0.7)));
  g.fillStyle = ig; g.beginPath(); g.arc(ix, iy, ir, 0, TAU); g.fill();
  g.strokeStyle = rgba(PAL.white, 0.14); g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i < 64; i++) {
    const an = (i / 64) * TAU;
    g.moveTo(ix + Math.cos(an) * ir * 0.45, iy + Math.sin(an) * ir * 0.45);
    g.lineTo(ix + Math.cos(an) * ir * (0.9 + 0.08 * hash(i, 3)), iy + Math.sin(an) * ir * (0.9 + 0.08 * hash(i, 3)));
  }
  g.stroke();
  // The pupil shows only static.
  g.save();
  g.beginPath(); g.arc(ix, iy, ir * 0.43, 0, TAU); g.clip();
  g.fillStyle = '#000'; g.fillRect(ix - ir, iy - ir, ir * 2, ir * 2);
  drawStatic(g, ix - ir, iy - ir, ir * 2, ir * 2, frame, 0.85, 1.4);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = rgba(mixc(P.hi, PAL.white, 0.3)); g.fillRect(ix - ir, iy - ir, ir * 2, ir * 2);
  g.restore();
  glow(g, ix - 50, iy - 55, 36, PAL.white, 0.5, 1);
  // Scanlines.
  g.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = cy - eh * 1.3; y < cy + eh * 1.3; y += 6) g.fillRect(cx - ew, y + (t * 40) % 6, ew * 2, 2);
  g.restore();
  neonStroke(g, gg => eyePath(gg, cx, cy, ew, eh, Math.max(0.001, open)), P.a, 3.2, 0.9);
  // Lashes.
  neonStroke(g, gg => {
    for (let i = 0; i < 9; i++) {
      const u = (i + 0.5) / 9;
      const x = cx - ew + u * ew * 2;
      const yb = cy - eh * open * 1.25 * 0.75 * Math.sin(Math.PI * u) - 6;
      gg.moveTo(x, yb); gg.lineTo(x + (u - 0.5) * 90, yb - 40 - 30 * Math.sin(Math.PI * u) * open);
    }
  }, P.a, 2, 0.6 * open);
  g.restore();
  // Tiny Kid below, looking up.
  const pose = poseFront({ armL: 0.1, armR: 0.1, tilt: -0.1, back: true });
  drawKid(g, cx, H * 0.95, 170, pose, { tint: P.hi, lit: 0.35, rim: { c: P.hi, a: 0.9, dx: 0, dy: -0.01 }, aura: { c: P.a, a: 0.3, blur: 12 } });
  g.restore();
};

// ---------------------------------------------------------------- chorus: orbiting mirror shards
SCENES.shards = (g, I) => {
  const { lt, t, v, dur } = I;
  const P = vp(v);
  const cx = W / 2, gy = H * 0.9, kh = 520;
  const close = easeInOut(clamp(lt / dur));
  g.save();
  camera(g, { zoom: 1.0 + lt * 0.02, rot: Math.sin(t * 0.3) * 0.01, t });
  fillBG(g, [[0, [2, 1, 4]], [0.5, P.bg], [1, [2, 1, 3]]]);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, cx, H * 0.55, 700, P.a, 0.22); g.restore();
  const pose = poseFront({ armL: 0.12, armR: 0.12, elL: -2.3, elR: -2.3, tilt: 0.12, legL: 0.03, legR: 0.03 });
  drawKid(g, cx, gy, kh, pose, { tint: P.hi, lit: 0.55, rim: { c: P.hi, a: 0.6, dx: 0, dy: -0.005 }, aura: { c: P.a, a: 0.28, blur: 20 } });
  // Orbiting shards that close in around him.
  const n = 16;
  for (let i = 0; i < n; i++) {
    const rnd = mulberry32(100 + i);
    const base = rnd() * TAU;
    const rad = lerp(330 + rnd() * 260, 150 + rnd() * 60, close);
    const an = base + t * (0.25 + rnd() * 0.25) * (i % 2 ? 1 : -1);
    const sx = cx + Math.cos(an) * rad * 1.15, sy = H * 0.55 + Math.sin(an) * rad * 0.8;
    const sz = 90 + rnd() * 120;
    const k = 3 + Math.floor(rnd() * 2);
    const pts = [];
    for (let j = 0; j < k; j++) { const a2 = (j / k) * TAU + rnd() * 0.8; pts.push([Math.cos(a2) * sz * (0.6 + rnd() * 0.5), Math.sin(a2) * sz * (0.6 + rnd() * 0.5)]); }
    const spin = t * (rnd() - 0.5) * 1.2 + rnd() * 3;
    g.save();
    g.translate(sx, sy); g.rotate(spin);
    const shape = new Path2D();
    pts.forEach(([x, y], j) => (j ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    const rc = i % 3 === 0 ? P.b : i % 3 === 1 ? P.a : P.c;
    g.save();
    g.clip(shape);
    const bgc = g.createLinearGradient(-sz, -sz, sz, sz);
    bgc.addColorStop(0, rgba(mixc(rc, PAL.ink, 0.72))); bgc.addColorStop(1, rgba(PAL.ink));
    g.fillStyle = bgc; g.fillRect(-sz * 2, -sz * 2, sz * 4, sz * 4);
    // Each shard reflects a fragment of him: hood and shoulders, off-kilter.
    g.rotate(-spin + hashs(i, 5) * 0.4);
    const kh2 = sz * 2.3;
    drawKid(g, hashs(i, 3) * sz * 0.3, kh2 * 0.9 + hashs(i, 4) * sz * 0.25, kh2, pose, { fill: mixc(rc, PAL.ink, 0.82), rim: { c: rc, a: 0.95, dx: 0.012 * (i % 2 ? 1 : -1), dy: -0.006 } });
    g.rotate(spin - hashs(i, 5) * 0.4);
    const sh = g.createLinearGradient(-sz, -sz, sz, sz);
    sh.addColorStop(0, 'rgba(255,255,255,0.22)'); sh.addColorStop(0.42, 'rgba(255,255,255,0.02)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.14)'); sh.addColorStop(0.58, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(-sz * 2, -sz * 2, sz * 4, sz * 4);
    g.restore();
    neonStroke(g, gg => { pts.forEach(([x, y], j) => (j ? gg.lineTo(x, y) : gg.moveTo(x, y))); gg.closePath(); }, mixc(rc, PAL.white, 0.35), 1.3, 0.8);
    g.restore();
  }
  g.restore();
};

// ---------------------------------------------------------------- chorus: floating photos, ink bleed
const _memCache = [];
function memoryPic(k) {
  if (_memCache[k]) return _memCache[k];
  const w = 300, h = 240, c = mkCanvas(w, h), g = c.getContext('2d');
  const skies = [[[255, 150, 90], [120, 60, 140]], [[40, 60, 120], [10, 10, 40]], [[255, 190, 120], [200, 90, 110]], [[90, 70, 160], [20, 12, 50]]];
  const [s1, s2] = skies[k % 4];
  const sg = g.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, rgba(s2)); sg.addColorStop(0.7, rgba(s1)); sg.addColorStop(1, rgba(mixc(s1, [0, 0, 0], 0.5)));
  g.fillStyle = sg; g.fillRect(0, 0, w, h);
  g.fillStyle = '#120a14';
  if (k % 4 === 0) { // two figures on a hill at sunset
    g.globalCompositeOperation = 'lighter'; g.drawImage(glowSprite([255, 200, 120]), w * 0.55 - 70, h * 0.6 - 70, 140, 140); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#120a14';
    g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * 0.5, h * 0.55, w, h * 0.8); g.lineTo(w, h); g.fill();
    for (const x of [w * 0.44, w * 0.53]) { g.fillRect(x - 6, h * 0.5, 12, 34); g.beginPath(); g.arc(x, h * 0.48, 8, 0, TAU); g.fill(); }
  } else if (k % 4 === 1) { // house with a lit window
    g.fillRect(w * 0.25, h * 0.45, w * 0.5, h * 0.55);
    g.beginPath(); g.moveTo(w * 0.2, h * 0.47); g.lineTo(w * 0.5, h * 0.25); g.lineTo(w * 0.8, h * 0.47); g.fill();
    g.fillStyle = '#ffcf7a'; g.fillRect(w * 0.42, h * 0.58, w * 0.12, h * 0.12);
    g.globalCompositeOperation = 'lighter'; g.drawImage(glowSprite([255, 200, 120]), w * 0.48 - 50, h * 0.64 - 50, 100, 100);
  } else if (k % 4 === 2) { // street court hoop
    g.fillRect(0, h * 0.82, w, h * 0.18);
    g.fillRect(w * 0.62, h * 0.25, 7, h * 0.6);
    g.fillRect(w * 0.5, h * 0.22, w * 0.2, h * 0.12);
    g.strokeStyle = '#120a14'; g.lineWidth = 3; g.beginPath(); g.ellipse(w * 0.55, h * 0.37, 16, 5, 0, 0, TAU); g.stroke();
  } else { // car under a streetlight
    g.fillRect(0, h * 0.8, w, h * 0.2);
    g.beginPath(); g.moveTo(w * 0.2, h * 0.8); g.lineTo(w * 0.24, h * 0.68); g.lineTo(w * 0.38, h * 0.6); g.lineTo(w * 0.62, h * 0.6); g.lineTo(w * 0.74, h * 0.7); g.lineTo(w * 0.82, h * 0.8); g.fill();
    g.fillRect(w * 0.1, h * 0.2, 5, h * 0.6);
    g.globalCompositeOperation = 'lighter'; g.drawImage(glowSprite([255, 220, 150]), w * 0.11 - 60, h * 0.2 - 60, 120, 120);
  }
  _memCache[k] = c;
  return c;
}

SCENES.memories = (g, I) => {
  const { lt, t, v, dur } = I;
  const P = vp(v);
  const pol = clamp(lt / dur);
  g.save();
  fillBG(g, [[0, [2, 1, 4]], [0.5, mixc(P.bg, [0, 0, 0], 0.3)], [1, [1, 0, 2]]]);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, H / 2, 800, P.a, 0.12); g.restore();
  const camZ = lt * 1.1;
  const items = [];
  for (let i = 0; i < 14; i++) {
    const z = 1.2 + i * 0.55 - camZ;
    if (z < 0.25 || z > 7) continue;
    items.push({ i, z });
  }
  items.sort((a, b) => b.z - a.z);
  for (const { i, z } of items) {
    const X = hashs(i, 1) * 0.9 + (i % 2 ? 0.5 : -0.5);
    const Y = hashs(i, 2) * 0.55;
    const s = 900 / z;
    const x = W / 2 + X * s * 0.9, y = H / 2 + Y * s * 0.9;
    const fw = 0.42 * s, fh = 0.5 * s;
    const fade = sstep(7, 5.5, z) * sstep(0.25, 0.6, z);
    g.save();
    g.translate(x, y);
    g.rotate(hashs(i, 3) * 0.25 + Math.sin(t * 0.5 + i) * 0.03);
    g.globalAlpha = fade;
    g.fillStyle = rgba([160, 150, 138]);
    g.fillRect(-fw / 2, -fh / 2, fw, fh);
    const pw = fw * 0.88, ph = fh * 0.7;
    g.save();
    g.beginPath(); g.rect(-pw / 2, -fh / 2 + fw * 0.06, pw, ph); g.clip();
    g.drawImage(memoryPic(i), -pw / 2, -fh / 2 + fw * 0.06, pw, ph);
    // Ink creeps in and drains the color.
    const inkA = clamp(pol * 1.3 + hash(i, 4) * 0.2 - 0.1);
    g.globalCompositeOperation = 'saturation';
    g.fillStyle = rgba([128, 128, 128], inkA * 0.9);
    g.fillRect(-pw, -ph, pw * 2, ph * 2);
    g.globalCompositeOperation = 'source-over';
    for (let k = 0; k < 6; k++) {
      const bx = hashs(i, 10 + k) * pw * 0.5, by = -fh / 2 + fw * 0.06 + hash(i, 20 + k) * ph;
      const r = pw * (0.1 + 0.55 * inkA) * (0.5 + hash(i, 30 + k));
      g.globalAlpha = fade * 0.85;
      g.drawImage(glowSprite([4, 2, 6]), bx - r, by - r, r * 2, r * 2);
    }
    g.restore();
    g.globalAlpha = fade * 0.9;
    // Smoke rising off the photo.
    for (let k = 0; k < 5; k++) {
      const ph2 = fract(t * 0.35 + hash(i, 40 + k));
      const sxx = hashs(i, 50 + k) * fw * 0.4 + Math.sin(t + k) * 10;
      const syy = -fh / 2 - ph2 * fh * 0.9;
      g.globalAlpha = fade * 0.45 * (1 - ph2) * pol;
      g.drawImage(glowSprite([30, 18, 50]), sxx - fw * 0.3, syy - fw * 0.3, fw * 0.6, fw * 0.6);
    }
    g.restore();
  }
  g.restore();
};

// ---------------------------------------------------------------- chorus: rain on the window
SCENES.stormWindow = (g, I) => {
  const { lt, t, v } = I;
  const P = vp(v);
  const wx = W * 0.5, wy = H * 0.43, ww = 920, wh = 640;
  const strikes = [0.35, 1.9, 2.15].map(s => s + v * 0.2);
  const fl = flashAt(lt, strikes, 0.28);
  g.save();
  camera(g, { zoom: 1.03 - lt * 0.006, x: Math.sin(t * 0.2) * 8, t });
  // Room.
  fillBG(g, [[0, [5, 3, 9]], [1, [2, 1, 4]]]);
  const win = new Path2D(); win.rect(wx - ww / 2, wy - wh / 2, ww, wh);
  // Outside.
  g.save();
  g.clip(win);
  fillBG(g, [[0, [6, 6, 20]], [0.6, mixc(P.bg, [20, 30, 70], 0.6)], [1, [10, 8, 20]]], wy - wh / 2, wy + wh / 2);
  drawClouds(g, t, { seed: 31, y: wy - wh / 2 - 80, h: 420, base: '#0d0b22', lit: '#384a88', speed: 26, flash: fl });
  if (fl > 0.05) drawBolt(g, wx + 180, wy - wh / 2 - 20, wx + 60, wy + 120, 90 + Math.floor(lt), fl, [210, 220, 255], 3, 3);
  // City bokeh.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 60; i++) {
    const bx = wx - ww / 2 + hash(i, 1) * ww, by = wy + wh * 0.1 + hash(i, 2) * wh * 0.4;
    const c = [PAL.gold, P.a, [255, 120, 90], PAL.cyan][i % 4];
    glow(g, bx + Math.sin(t * 0.2 + i) * 4, by, 18 + 30 * hash(i, 3), c, 0.35 + 0.3 * hash(i, 4));
  }
  g.restore();
  drawRain(g, t, { n: 900, alpha: 0.4, len: 60, speed: 2600, angle: 0.22, x0: wx - ww, x1: wx + ww, color: [180, 200, 255] });
  g.restore();
  // Droplets on the glass.
  g.save(); g.clip(win);
  for (let i = 0; i < 90; i++) {
    const dx = wx - ww / 2 + hash(i, 71) * ww;
    const run = hash(i, 72) > 0.7;
    const dy = wy - wh / 2 + (run ? fract(hash(i, 73) + t * (0.08 + 0.1 * hash(i, 74))) : hash(i, 73)) * wh;
    const r = 2 + 5 * hash(i, 75);
    if (run) { g.strokeStyle = 'rgba(200,215,255,0.12)'; g.lineWidth = r * 0.8; g.beginPath(); g.moveTo(dx, dy - 60); g.lineTo(dx, dy); g.stroke(); }
    g.fillStyle = 'rgba(210,225,255,0.28)'; g.beginPath(); g.arc(dx, dy, r, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(dx - r * 0.3, dy - r * 0.3, r * 0.3, 0, TAU); g.fill();
  }
  g.restore();
  // Window frame and mullions.
  g.fillStyle = '#040206';
  g.fillRect(wx - ww / 2 - 30, wy - wh / 2 - 30, ww + 60, 30);
  g.fillRect(wx - ww / 2 - 30, wy + wh / 2, ww + 60, 44);
  g.fillRect(wx - ww / 2 - 30, wy - wh / 2, 30, wh);
  g.fillRect(wx + ww / 2, wy - wh / 2, 30, wh);
  g.fillRect(wx - 9, wy - wh / 2, 18, wh);
  g.fillRect(wx - ww / 2, wy - 9, ww, 18);
  // Lightning throws the window shape onto the floor.
  if (fl > 0.02) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const fy = wy + wh / 2 + 44;
    g.fillStyle = rgba([170, 180, 255], 0.28 * fl);
    for (const [a, b] of [[-1, -0.02], [0.02, 1]]) {
      g.beginPath();
      g.moveTo(wx + a * ww / 2, fy); g.lineTo(wx + b * ww / 2, fy);
      g.lineTo(wx + b * ww * 0.9, H); g.lineTo(wx + a * ww * 0.9, H); g.closePath(); g.fill();
    }
    g.restore();
  }
  // The Kid at the glass, hand pressed against it.
  // Cool light from the window on the floor and wall.
  g.save(); g.globalCompositeOperation = 'lighter';
  g.save(); g.translate(wx, wy + wh / 2 + 150); g.scale(1, 0.25); glow(g, 0, 0, 700, [90, 110, 200], 0.28); g.restore();
  glow(g, wx, wy, 900, [60, 70, 150], 0.12);
  g.restore();
  const pose = poseFront({ armL: 0.1, armR: 1.15, elL: 0.12, elR: 1.1, tilt: 0.1, legL: 0.04, legR: 0.05, back: true });
  drawKid(g, wx + 110, H * 0.99, 540, pose, { tint: [150, 170, 255], lit: 0.28 + 0.5 * fl, rim: { c: mixc([150, 170, 255], PAL.white, fl), a: 0.55 + 0.45 * fl, dx: 0, dy: -0.004 }, aura: { c: [110, 130, 230], a: 0.45 + 0.3 * fl, blur: 16 } });
  g.restore();
  if (fl > 0.02) { g.fillStyle = rgba([200, 205, 255], 0.12 * fl); g.fillRect(0, 0, W, H); }
};

// ---------------------------------------------------------------- chorus: marionette under a spotlight
SCENES.stage = (g, I) => {
  const { lt, t, v } = I;
  const P = vp(v);
  const curtain = [[70, 8, 60], [110, 8, 24], [120, 80, 20]][v] || [70, 8, 60];
  const cx = W / 2, gy = H * 0.84, kh = 500;
  g.save();
  camera(g, { zoom: 1.08 - lt * 0.012, y: 10, t });
  // Curtains with folds.
  for (let i = 0; i < 48; i++) {
    const x = (i / 48) * W, wd = W / 48 + 2;
    const sway = Math.sin(t * 0.8 + i * 0.7) * 4;
    const gr = g.createLinearGradient(x, 0, x + wd, 0);
    const d = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(i * 1.7));
    gr.addColorStop(0, rgba(scalec(curtain, d * 0.5))); gr.addColorStop(0.5, rgba(scalec(curtain, d * 1.4))); gr.addColorStop(1, rgba(scalec(curtain, d * 0.4)));
    g.fillStyle = gr; g.fillRect(x + sway, 0, wd, gy + 10);
  }
  // Valance.
  g.fillStyle = rgba(scalec(curtain, 0.5));
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 110);
  for (let i = 12; i >= 0; i--) { const x = (i / 12) * W; g.quadraticCurveTo(x + W / 24, 175, x, 110); }
  g.fill();
  // Floor.
  g.fillStyle = vgrad(g, gy, H, [[0, [30, 18, 14]], [1, [6, 3, 3]]]);
  g.fillRect(-100, gy, W + 200, H - gy + 100);
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.beginPath();
  for (let i = -12; i <= 12; i++) { g.moveTo(cx + i * 40, gy); g.lineTo(cx + i * 190, H + 20); }
  g.stroke();
  // Darkness outside the spotlight.
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(-100, -100, W + 200, H + 200);
  // Spotlight.
  const sp = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7);
  g.save(); g.globalCompositeOperation = 'lighter';
  const cone = new Path2D(); cone.moveTo(cx - 40, -60); cone.lineTo(cx + 40, -60); cone.lineTo(cx + 330, gy + 40); cone.lineTo(cx - 330, gy + 40); cone.closePath();
  const cg = g.createLinearGradient(0, 0, 0, gy); cg.addColorStop(0, rgba(P.hi, 0.35 * sp)); cg.addColorStop(1, rgba(P.hi, 0.1 * sp));
  g.fillStyle = cg; g.fill(cone);
  g.save(); g.translate(cx, gy + 18); g.scale(1, 0.16); glow(g, 0, 0, 520, P.hi, 0.55 * sp); g.restore();
  for (let i = 0; i < 70; i++) {
    const dx = cx + hashs(i, 1) * 300 * (0.3 + hash(i, 5)) + Math.sin(t * 0.6 + i) * 12;
    const dy = fract(hash(i, 2) + t * 0.03 * (0.5 + hash(i, 3))) * gy;
    glow(g, dx, dy, 4 + 3 * hash(i, 4), P.hi, 0.6, 1);
  }
  g.restore();
  // Puppet strings pull his arms in jerky steps.
  const step = k => { const x = t * 1.6 + k * 0.37; const i = Math.floor(x); return lerp(hash(i, 9 + k), hash(i + 1, 9 + k), sstep(0.75, 1, fract(x))); };
  const armL = 0.2 + 1.1 * step(0), armR = 0.2 + 1.1 * step(1);
  const pose = poseFront({ armL, armR, elL: -0.2 - 0.4 * step(2), elR: -0.2 - 0.4 * step(3), tilt: 0.25 * Math.sin(t * 0.7), legL: 0.05, legR: 0.05 });
  const res = drawKid(g, cx, gy, kh, pose, { tint: P.hi, lit: 0.9, rim: { c: P.hi, a: 0.9, dx: 0, dy: -0.006 }, aura: { c: P.a, a: 0.25, blur: 16 }, pendant: { c: P.a } });
  const J = res.J;
  const toW = p => [cx + p[0], res.py + p[1]];
  const strings = [toW(J.AL.hand), toW(J.AR.hand), toW(J.head)];
  neonStroke(g, gg => { for (const [sx, sy] of strings) { gg.moveTo(sx, sy); gg.lineTo(sx + (sx - cx) * 0.2, -40); } }, P.hi, 1.0, 0.8);
  // Empty seats in front.
  g.fillStyle = '#030104';
  for (let row = 0; row < 2; row++) for (let i = -1; i < 14; i++) {
    const sx = i * 150 + (row ? 75 : 0) - 20, sy = H - 60 + row * 70;
    g.beginPath(); g.ellipse(sx, sy, 62, 70, 0, Math.PI, TAU); g.fill();
    g.fillRect(sx - 62, sy - 1, 124, 90);
  }
  g.restore();
};

// ---------------------------------------------------------------- chorus: neon lasers inside a head silhouette
SCENES.headParty = (g, I) => {
  const { lt, t, v, dur } = I;
  const P = vp(v);
  const hx = W * 0.5, hy = H * 0.5, hs = 880;
  const flick = (0.5 + 0.5 * Math.sin(t * TAU * 0.9)) * (v === 1 ? 0.8 : 0.55);
  g.save();
  camera(g, { zoom: 1.02 + lt * 0.012, t, shake: 0.35 + v * 0.2, seed: 5 });
  fillBG(g, [[0, [2, 1, 4]], [1, [3, 1, 6]]]);
  // Grid floor far behind.
  g.save(); g.strokeStyle = rgba(P.a, 0.08); g.lineWidth = 1; g.beginPath();
  for (let i = 0; i < 30; i++) { g.moveTo(0, i * 40); g.lineTo(W, i * 40); g.moveTo(i * 70, 0); g.lineTo(i * 70, H); }
  g.stroke(); g.restore();
  const head = new Path2D();
  { const pts = HEAD_PROFILE.map(([x, y]) => [hx + x * hs, hy + y * hs]); const tmp = new Path2D(); curveThroughPath(tmp, pts); head.addPath(tmp); }
  g.fillStyle = rgba(mixc(P.bg, [0, 0, 0], 0.4));
  g.fill(head);
  g.save();
  g.clip(head);
  // Pulsing background inside the head.
  g.fillStyle = rgba(mixc(P.bg, P.a, 0.2 + 0.2 * flick), 1);
  g.fillRect(0, 0, W, H);
  // Laser emitters.
  const emit = [[hx - 250, hy - 300], [hx + 60, hy - 380], [hx - 60, hy + 200], [hx + 250, hy - 120], [hx - 330, hy - 40]];
  emit.forEach(([ex, ey], k) => {
    const col = [P.a, P.b, P.c][k % 3];
    for (let j = 0; j < 5; j++) {
      const an = t * (0.6 + 0.3 * k) * (k % 2 ? 1 : -1) + j * 0.55 + Math.sin(t * 1.3 + k) * 0.6;
      neonStroke(g, gg => { gg.moveTo(ex, ey); gg.lineTo(ex + Math.cos(an) * 1400, ey + Math.sin(an) * 1400); }, col, 2.2, 0.55);
    }
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, ex, ey, 60, col, 0.9, 1); g.restore();
  });
  // Lightning inside the mind.
  const fl = flashAt(lt, [0.6, 2.4, 3.1, 4.6, 5.9].map(x => x * dur / 6.6));
  if (fl > 0.05) drawBolt(g, hx - 300, hy - 420, hx + 200, hy + 260, 300 + Math.floor(lt * 3), fl, P.hi, 3, 3);
  // Confetti.
  g.save();
  for (let i = 0; i < 160; i++) {
    const cxp = hx - 450 + hash(i, 1) * 900 + Math.sin(t * 2 + i) * 20;
    const cyp = hy - 500 + fract(hash(i, 2) + t * (0.12 + 0.1 * hash(i, 3))) * 1000;
    g.save(); g.translate(cxp, cyp); g.rotate(t * 4 * hashs(i, 4));
    g.fillStyle = rgba([P.a, P.b, P.c, PAL.white][i % 4], 0.85);
    g.fillRect(-7, -3, 14, 6 * Math.abs(Math.sin(t * 5 + i)));
    g.restore();
  }
  g.restore();
  // Spark bursts.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let b = 0; b < 6; b++) {
    const ph = t * 1.4 + b * 0.37;
    const idx = Math.floor(ph), life = fract(ph);
    const bx = hx - 300 + hash(idx, b) * 600, by = hy - 300 + hash(idx, b + 9) * 500;
    for (let s = 0; s < 14; s++) {
      const an = hash(idx, s, b) * TAU, r = life * (60 + 120 * hash(idx, s + 3, b));
      glow(g, bx + Math.cos(an) * r, by + Math.sin(an) * r, 8, [P.a, P.b, PAL.white][s % 3], (1 - life) * 0.9, 1);
    }
  }
  g.restore();
  // The Kid flying through it, with afterimages.
  const fx = lerp(hx - 380, hx + 280, easeInOut(clamp(lt / dur)));
  const fy = hy - 40 + Math.sin(t * 2.2) * 60;
  for (let k = 4; k >= 0; k--) {
    const pose = poseFly(t - k * 0.05);
    pose.rot = Math.PI / 2 - 0.25 + Math.sin(t * 2.2 + 1) * 0.12;
    const ghost = k > 0;
    drawKid(g, fx - k * 48, fy + Math.sin(t * 2.2 - k * 0.2) * 8, 360, pose, ghost
      ? { fill: P.a, alpha: 0.12 * (5 - k) / 5 }
      : { tint: [255, 245, 255], lit: 0.62, rim: { c: PAL.white, a: 0.9, dx: 0.006, dy: -0.006 }, aura: { c: P.b, a: 0.5, blur: 18 } });
  }
  g.restore();
  neonStroke(g, gg => { const pts = HEAD_PROFILE.map(([x, y]) => [hx + x * hs, hy + y * hs]); curveThrough(gg, pts, false); gg.closePath(); }, P.a, 4, 0.95);
  g.restore();
  // Heartbeat under it all: steady, frantic, then strong.
  const ecgA = sstep(dur * 0.45, dur * 0.6, lt);
  const cfg = [{ bpm: 76, flat: null }, { bpm: 128, flat: [I.t - lt + dur * 0.62, I.t - lt + dur * 0.8] }, { bpm: 88, flat: null }][v];
  drawECG(g, t, { y: H * 0.86, amp: 110, bpm: cfg.bpm, flat: cfg.flat, c: v === 1 ? PAL.blood : PAL.green, a: ecgA, sweep: 2.4 });
};

// Path2D-friendly version of curveThrough (closed-open curve then closed).
function curveThroughPath(p, pts) {
  curveThrough(p, pts, false);
  p.closePath();
}

// ---------------------------------------------------------------- finale: ascent through the clouds
SCENES.ascend = (g, I) => {
  const { lt, t, dur } = I;
  const P = vp(2);
  const k = clamp(lt / dur);
  g.save();
  camera(g, { zoom: 1.0 + k * 0.05, t, shake: 0.25 * (1 - k) });
  // Sky shifts from storm to clear night above the clouds.
  const top = mixc([10, 6, 22], [4, 6, 20], k), mid = mixc([30, 16, 40], [24, 18, 60], k);
  fillBG(g, [[0, top], [0.6, mid], [1, mixc([12, 8, 20], [60, 40, 90], k)]]);
  drawStars(g, t, { n: 260, alpha: sstep(0.3, 0.8, k), y1: H * 0.8, seed: 44 });
  drawMoon(g, W * 0.7, H * 0.28 + (1 - k) * 200, 150, [255, 240, 215], sstep(0.35, 0.9, k));
  // Clouds rush downward past the camera: layers scroll down as he climbs.
  for (let L = 0; L < 3; L++) {
    const yy = lerp(-200, H * 0.85, k) + L * 140 - 100 + (L * 90) * k;
    drawClouds(g, t, { seed: 60 + L, y: yy, h: 520, base: L === 2 ? '#1a1030' : '#120a24', lit: '#7a5aa8', speed: 20 + L * 8, alpha: 0.95, flash: flashAt(lt, [0.3, 1.1, 1.5].map(s => s + L * 0.12)) * (1 - k) });
  }
  // The Kid climbing, arms out.
  const pose = poseFly(t);
  pose.shB = Math.PI * 0.62; pose.elB = 0.1; pose.shF = Math.PI * 0.95;
  pose.rot = -0.1 + Math.sin(t * 1.3) * 0.05;
  const ky = lerp(H * 0.95, H * 0.42, easeOut(k));
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 80; i++) {
    const ph = fract(hash(i, 1) + t * 0.6);
    glow(g, W * 0.5 + hashs(i, 2) * 60 + Math.sin(t * 3 + i) * 8, ky + 120 + ph * 420, 6 + 8 * (1 - ph), [PAL.gold, PAL.white, P.b][i % 3], (1 - ph) * 0.8, 1);
  }
  g.restore();
  drawKid(g, W * 0.5, ky, 320, pose, { tint: [255, 232, 196], lit: 0.62, rim: { c: PAL.white, a: 0.95, dx: 0.004, dy: -0.008 }, aura: { c: PAL.gold, a: 0.55, blur: 24 } });
  g.restore();
};

// ---------------------------------------------------------------- end card
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
  // Stars fly in from where the Kid dissolved (bottom center).
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
