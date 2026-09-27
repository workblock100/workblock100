'use strict';
// Verse 2 shots: underwater, rooftop ledge, night highway, coffin, maze, diamond burst.

// ---------------------------------------------------------------- underwater, sinking
SCENES.underwater = (g, I) => {
  const { lt, t, dur } = I;
  const p = clamp(lt / dur);
  g.save();
  camera(g, { zoom: 1.04 + p * 0.06, t });
  fillBG(g, [[0, [40, 150, 170]], [0.1, [14, 70, 110]], [0.45, [4, 28, 62]], [1, [1, 6, 18]]]);
  // Surface shimmer.
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(180,255,255,0.35)'; g.lineWidth = 3;
  for (let r = 0; r < 3; r++) {
    g.beginPath();
    for (let x = -20; x <= W + 20; x += 16) {
      const y = 40 + r * 26 + Math.sin(x * 0.012 + t * 1.6 + r) * 10 + Math.sin(x * 0.031 - t * 2.1) * 5;
      x === -20 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }
  // Light shafts swaying down from the surface.
  for (let i = 0; i < 9; i++) {
    const x0 = W * (0.05 + i * 0.12) + Math.sin(t * 0.4 + i) * 40;
    const sway = Math.sin(t * 0.3 + i * 1.3) * 0.08 + 0.12;
    const wd = 40 + 60 * hash(i, 2);
    g.fillStyle = vgrad(g, 0, H, [[0, [150, 240, 255], 0.16], [0.7, [80, 180, 230], 0.03], [1, [80, 180, 230], 0]]);
    g.beginPath(); g.moveTo(x0 - wd / 2, 0); g.lineTo(x0 + wd / 2, 0); g.lineTo(x0 + wd * 1.8 + sway * H, H); g.lineTo(x0 - wd * 0.8 + sway * H, H); g.closePath(); g.fill();
  }
  g.restore();
  // Drifting particles.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 140; i++) {
    const x = fract(hash(i, 1) + Math.sin(t * 0.1 + i) * 0.01) * W;
    const y = fract(hash(i, 2) - t * 0.01 * (0.5 + hash(i, 3))) * H;
    glow(g, x, y, 3 + 3 * hash(i, 4), [150, 230, 255], 0.35 * hash(i, 5), 1);
  }
  g.restore();
  // The Kid sinking, turning slowly.
  const ky = lerp(H * 0.36, H * 0.6, easeInOut(p));
  const pose = poseSink(t);
  pose.rot = -0.35 + Math.sin(t * 0.5) * 0.15;
  const kx = W * 0.5 + Math.sin(t * 0.6) * 20;
  drawKid(g, kx, ky, 400, pose, { tint: [100, 200, 235], lit: 0.45, rim: { c: [120, 230, 255], a: 0.8, dx: 0, dy: -0.01 }, aura: { c: [40, 170, 220], a: 0.35, blur: 20 } });
  // Bubbles rising off him.
  g.save();
  for (let i = 0; i < 40; i++) {
    const ph = fract(hash(i, 21) + t * (0.25 + 0.2 * hash(i, 22)));
    const bx = kx + hashs(i, 23) * 90 + Math.sin(t * 3 + i) * 10;
    const by = ky - 200 - ph * 700;
    const r = 3 + 9 * hash(i, 24) * (0.5 + ph);
    g.strokeStyle = `rgba(190,245,255,${0.55 * (1 - ph)})`; g.lineWidth = 1.5;
    g.beginPath(); g.arc(bx, by, r, 0, TAU); g.stroke();
    g.fillStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`;
    g.beginPath(); g.arc(bx - r * 0.35, by - r * 0.35, r * 0.25, 0, TAU); g.fill();
  }
  g.restore();
  // Thoughts: small neon glyphs circling his head and drifting up.
  const shapes = ['c', 't', 's', 'x'];
  for (let i = 0; i < 12; i++) {
    const an = t * (0.5 + 0.3 * hash(i, 31)) + (i / 12) * TAU;
    const rise = fract(t * 0.08 + hash(i, 32));
    const gx = kx + Math.cos(an) * (180 + 60 * hash(i, 33));
    const gyy = ky - 300 + Math.sin(an) * 60 - rise * 260;
    const s = 12 + 10 * hash(i, 34);
    const c = [[120, 240, 255], [180, 140, 255], [255, 255, 255]][i % 3];
    const a = 0.8 * Math.sin(rise * Math.PI);
    neonStroke(g, gg => {
      const k = shapes[i % 4];
      if (k === 'c') gg.arc(gx, gyy, s, 0, TAU);
      else if (k === 's') gg.rect(gx - s, gyy - s, s * 2, s * 2);
      else if (k === 't') { gg.moveTo(gx, gyy - s); gg.lineTo(gx + s, gyy + s); gg.lineTo(gx - s, gyy + s); gg.closePath(); }
      else { gg.moveTo(gx - s, gyy - s); gg.lineTo(gx + s, gyy + s); gg.moveTo(gx + s, gyy - s); gg.lineTo(gx - s, gyy + s); }
    }, c, 1.4, a);
  }
  g.restore();
};

// ---------------------------------------------------------------- rooftop ledge under the moon
SCENES.nightRoof = (g, I) => {
  const { lt, t } = I;
  const ledgeX = W * 0.56, ledgeY = H * 0.7;
  g.save();
  camera(g, { zoom: 1.02 + lt * 0.012, x: lt * 4, t });
  fillBG(g, [[0, [3, 4, 16]], [0.6, [22, 16, 52]], [0.8, [52, 26, 70]], [1, [10, 6, 20]]]);
  drawStars(g, t, { n: 260, alpha: 0.9, y1: H * 0.7, seed: 57 });
  drawMoon(g, W * 0.75, H * 0.27, 170, [240, 234, 255], 1, 11);
  // Shooting star.
  const ss = clamp((lt - 1.4) / 0.7);
  if (ss > 0 && ss < 1) {
    const x = lerp(W * 0.2, W * 0.5, ss), y = lerp(H * 0.08, H * 0.25, ss);
    neonStroke(g, gg => { gg.moveTo(x, y); gg.lineTo(x - 160, y - 80); }, [230, 230, 255], 1.6, Math.sin(ss * Math.PI));
  }
  drawCity(g, 71, H * 0.92, 420, 200 + t * 2, { col: '#0d0a22', win: '#8fb4ff', winP: 0.14, minH: 0.3 });
  drawCity(g, 72, H * 1.02, 330, 700 + t * 5, { col: '#07050f', win: '#ffcf7a', winP: 0.2, minH: 0.35 });
  drawFog(g, t, { y: H * 0.8, color: [80, 60, 150], alpha: 0.2, n: 10, seed: 31, add: true });
  // Rooftop in the foreground.
  g.fillStyle = '#030206';
  g.beginPath(); g.moveTo(-100, ledgeY); g.lineTo(ledgeX, ledgeY); g.lineTo(ledgeX, H + 100); g.lineTo(-100, H + 100); g.closePath(); g.fill();
  g.fillStyle = 'rgba(160,140,255,0.3)'; g.fillRect(-100, ledgeY - 2, ledgeX + 100, 2);
  g.fillStyle = '#030206';
  g.fillRect(W * 0.08, ledgeY - 90, 150, 90);
  g.fillRect(W * 0.2, ledgeY - 260, 6, 260);
  g.fillRect(W * 0.2 - 40, ledgeY - 250, 86, 4);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, W * 0.2 + 3, ledgeY - 262, 16, PAL.blood, 0.5 + 0.5 * Math.sin(t * 3), 1); g.restore();
  // Him on the ledge, legs over the edge.
  const pose = poseSit();
  pose.tilt = 0.3 + Math.sin(t * 0.6) * 0.06;
  const kh = 360;
  const res = drawKid(g, ledgeX - 30, ledgeY - 0.035 * kh, kh, pose, { tint: [205, 195, 255], lit: 0.5, rim: { c: [200, 190, 255], a: 0.9, dx: 0.01, dy: -0.006 }, aura: { c: [110, 90, 220], a: 0.25, blur: 14 } });
  // Thoughts rising like lanterns toward the moon.
  const hx = ledgeX - 30 + res.J.head[0], hy = res.py + res.J.head[1];
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 22; i++) {
    const ph = fract(hash(i, 41) + t * 0.12);
    const x = hx + ph * 520 * (0.6 + 0.6 * hash(i, 42)) + Math.sin(t + i) * 20;
    const y = hy - 60 - ph * 520 * (0.5 + 0.5 * hash(i, 43));
    const c = i % 3 ? [255, 200, 130] : [170, 190, 255];
    glow(g, x, y, 34, c, 0.4 * Math.sin(ph * Math.PI));
    glow(g, x, y, 6, PAL.white, 0.8 * Math.sin(ph * Math.PI), 1);
  }
  g.restore();
  g.restore();
};

// ---------------------------------------------------------------- night highway, distant finish arch
function finishArch(g, x, y, s, t, a = 1) {
  g.save();
  g.globalAlpha = a;
  g.fillStyle = '#120a10';
  g.fillRect(x - s, y - s * 1.1, s * 0.08, s * 1.1);
  g.fillRect(x + s * 0.92, y - s * 1.1, s * 0.08, s * 1.1);
  const cw = (s * 1.84) / 12, top = y - s * 1.1;
  for (let i = 0; i < 12; i++) for (let r = 0; r < 2; r++) {
    g.fillStyle = (i + r) % 2 ? '#f4efe6' : '#0a0608';
    g.fillRect(x - s * 0.92 + i * cw, top + r * cw, cw + 0.5, cw + 0.5);
  }
  g.globalCompositeOperation = 'lighter';
  glow(g, x, top + cw, s * 2.4, PAL.gold, 0.45 * (0.8 + 0.2 * Math.sin(t * 3)));
  g.restore();
}

SCENES.road = (g, I) => {
  const { lt, t, dur, params } = I;
  const crawl = params.mode === 'crawl';
  g.save();
  if (!crawl) {
    const hz = H * 0.56, f = 800, camH = 1.1;
    const proj = (X, z) => [W / 2 + (X * f) / z, hz + (camH * f) / z];
    camera(g, { zoom: 1.02 + lt * 0.01, t });
    fillBG(g, [[0, [5, 3, 14]], [0.45, [26, 12, 46]], [0.56, [130, 56, 96]], [0.57, [20, 8, 18]], [1, [4, 2, 5]]]);
    drawStars(g, t, { n: 200, alpha: 0.8, y1: hz, seed: 63 });
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(W / 2, hz); g.scale(1, 0.12); glow(g, 0, 0, W * 0.6, [255, 120, 140], 0.5); g.restore();
    g.fillStyle = vgrad(g, hz, H, [[0, [22, 10, 18]], [1, [4, 2, 4]]]);
    g.fillRect(-W, hz, W * 3, H);
    const [a0x, a0y] = proj(-1.8, 200), [b0x] = proj(1.8, 200), [a1x, a1y] = proj(-1.8, 1.0), [b1x] = proj(1.8, 1.0);
    g.fillStyle = '#0b0609';
    g.beginPath(); g.moveTo(a0x, a0y); g.lineTo(b0x, a0y); g.lineTo(b1x, a1y); g.lineTo(a1x, a1y); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,220,170,0.7)';
    const speed = 1.4;
    for (let k = 0; k < 40; k++) {
      const z0 = 1.0 + ((k * 3 - (t * speed) % 3) + 3) % 120, z1 = z0 + 1.2;
      const [p1x, p1y] = proj(-0.06, z0), [q1x] = proj(0.06, z0), [p2x, p2y] = proj(-0.06, z1), [q2x] = proj(0.06, z1);
      g.globalAlpha = clamp(1 - z0 / 110);
      g.beginPath(); g.moveTo(p1x, p1y); g.lineTo(q1x, p1y); g.lineTo(q2x, p2y); g.lineTo(p2x, p2y); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 30; k++) {
      const z = 1.5 + ((k * 6 - (t * speed) % 6) + 6) % 180;
      for (const sd of [-1, 1]) { const [px, py] = proj(sd * 2.3, z); glow(g, px, py - 300 / z, 60 / z + 2, sd > 0 ? PAL.blood : [255, 255, 255], clamp(1 - z / 170) * 0.8, 1); }
    }
    g.restore();
    finishArch(g, W / 2, hz + 2, 26, t);
    // Him walking away from us, head down.
    const ph = lt * 0.9;
    const s = Math.sin(TAU * ph);
    const pose = poseFront({ armL: 0.08 + 0.05 * s, armR: 0.08 - 0.05 * s, liftL: Math.max(0, s) * 0.35, liftR: Math.max(0, -s) * 0.35, tilt: 0.15, back: true });
    drawKid(g, W / 2 + Math.sin(t * 0.8) * 10, H * 0.94 - Math.abs(s) * 6, 400, pose, { tint: [255, 175, 195], lit: 0.42, rim: { c: [255, 170, 190], a: 0.8, dx: 0, dy: -0.006 }, aura: { c: [255, 90, 140], a: 0.2, blur: 14 } });
  } else {
    const hz = H * 0.6, gy = H * 0.84;
    camera(g, { zoom: 1.03, t });
    fillBG(g, [[0, [5, 3, 14]], [0.5, [30, 14, 50]], [0.6, [140, 60, 100]], [0.61, [20, 8, 18]], [1, [4, 2, 5]]]);
    drawStars(g, t, { n: 200, alpha: 0.8, y1: hz, seed: 64 });
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(W * 0.8, hz); g.scale(1, 0.14); glow(g, 0, 0, W * 0.5, [255, 120, 140], 0.5); g.restore();
    g.fillStyle = vgrad(g, hz, H, [[0, [24, 10, 20]], [1, [4, 2, 4]]]);
    g.fillRect(-W, hz, W * 3, H);
    finishArch(g, W * 0.86, hz + 2, 22, t);
    // Road band seen from the side.
    g.fillStyle = '#0b0609';
    g.fillRect(-W, gy - 40, W * 3, 120);
    g.fillStyle = 'rgba(255,220,170,0.6)';
    const off = (lt * 30) % 160;
    for (let x = -160; x < W + 160; x += 160) g.fillRect(x - off, gy + 20, 80, 5);
    // Crawl cycle with an uneven, slowing rhythm.
    const slow = lt * 0.45 - 0.12 * Math.sin(lt * 1.3);
    const pose = poseCrawl(slow);
    const kx = W * 0.36 + lt * 8;
    drawKid(g, kx, gy, 420, pose, { tint: [255, 175, 195], lit: 0.5, rim: { c: [255, 170, 190], a: 0.85, dx: 0.006, dy: -0.008 }, aura: { c: [255, 90, 140], a: 0.2, blur: 14 } });
    // Dust under his hands.
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 24; i++) {
      const life = fract(t * 0.8 + hash(i, 5));
      glow(g, kx + 120 + hashs(i, 6) * 80 + life * 40, gy - life * 50, 14 + 20 * life, [200, 150, 170], 0.18 * (1 - life));
    }
    g.restore();
  }
  // Heat shimmer / dust drifting across both shots.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 50; i++) {
    const x = fract(hash(i, 1) + t * 0.02 * (1 + hash(i, 2))) * W, y = H * 0.55 + hash(i, 3) * H * 0.4;
    glow(g, x, y, 3, [255, 200, 200], 0.3, 1);
  }
  g.restore();
  g.restore();
};

// ---------------------------------------------------------------- coffin bursts open, figure steps out
SCENES.coffin = (g, I) => {
  const { lt, t, dur, frame } = I;
  const p = clamp(lt / dur);
  const cx = W / 2, cy = H * 0.5, cs = 700;
  const burst = 0.3;
  const shake = p < burst ? sstep(0.05, burst, p) : 0;
  g.save();
  camera(g, { zoom: 1.05 - p * 0.04, t, shake: shake * 0.6 + (p > burst && p < burst + 0.08 ? 1.2 : 0), seed: 71 });
  // Crypt wall, gothic window with a moon beam.
  fillBG(g, [[0, [8, 6, 12]], [1, [3, 2, 5]]]);
  g.fillStyle = 'rgba(255,255,255,0.025)';
  for (let r = 0; r < 14; r++) for (let c = 0; c < 12; c++) g.fillRect(c * 170 + (r % 2) * 85, r * 80, 164, 74);
  const wx = W * 0.2, wy = H * 0.12;
  g.fillStyle = '#1a1c3a';
  g.beginPath(); g.moveTo(wx - 70, wy + 260); g.lineTo(wx - 70, wy + 70); g.quadraticCurveTo(wx, wy - 40, wx + 70, wy + 70); g.lineTo(wx + 70, wy + 260); g.closePath(); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = vgrad(g, wy, H, [[0, [150, 160, 255], 0.14], [1, [150, 160, 255], 0.02]]);
  g.beginPath(); g.moveTo(wx - 70, wy + 80); g.lineTo(wx + 70, wy + 80); g.lineTo(wx + 700, H); g.lineTo(wx + 300, H); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = vgrad(g, H * 0.85, H, [[0, [14, 10, 16]], [1, [3, 2, 4]]]);
  g.fillRect(-W, H * 0.85, W * 3, H);
  // Candles.
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1, k = i % 3;
    const x = cx + side * (330 + k * 150), y = H * 0.86 - k * 20;
    const hgt = 90 + 40 * hash(i, 2);
    g.fillStyle = '#d9cdb8'; g.fillRect(x - 9, y - hgt, 18, hgt);
    const fl = 0.8 + 0.2 * noise1(t * 12, i);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.save(); g.translate(x, y - hgt - 14); g.scale(0.5, 1); glow(g, 0, 0, 22, PAL.gold, fl, 1); g.restore();
    glow(g, x, y - hgt - 14, 110, PAL.ember, 0.35 * fl);
    g.restore();
  }
  // The coffin.
  const jx = shake * noise1(t * 40, 1) * 10, jr = shake * noise1(t * 35, 2) * 0.02;
  g.save();
  g.translate(cx + jx, cy + 20);
  g.rotate(jr);
  const body = coffinPath(cs);
  const wood = g.createLinearGradient(-cs * 0.17, 0, cs * 0.17, 0);
  wood.addColorStop(0, '#120807'); wood.addColorStop(0.5, '#2a1410'); wood.addColorStop(1, '#0e0605');
  if (p < burst) {
    g.fillStyle = wood; g.fill(body);
    g.strokeStyle = rgba(PAL.gold, 0.6); g.lineWidth = 4; g.stroke(body);
    // Light leaking through the seams.
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = rgba(PAL.gold, shake * 0.8); g.lineWidth = 3 + shake * 6; g.filter = 'blur(6px)'; g.stroke(body); g.filter = 'none';
    g.restore();
  } else {
    // Open coffin: glowing interior.
    const ig = g.createRadialGradient(0, 0, 10, 0, 0, cs * 0.5);
    ig.addColorStop(0, rgba([255, 220, 150])); ig.addColorStop(0.4, rgba([150, 80, 30])); ig.addColorStop(1, rgba([30, 12, 8]));
    g.fillStyle = ig; g.fill(body);
    g.strokeStyle = rgba(PAL.gold, 0.8); g.lineWidth = 8; g.stroke(body);
  }
  g.restore();
  if (p >= burst) {
    const q = clamp((p - burst) / 0.25);
    // Lid flying toward the camera and away.
    if (q < 1) {
      g.save();
      g.translate(cx + q * 520, cy + 20 - q * 260);
      g.rotate(q * 1.6);
      g.scale(1 + q * 1.6, 1 + q * 1.6);
      g.globalAlpha = 1 - q;
      g.fillStyle = wood; g.fill(body);
      g.strokeStyle = rgba(PAL.gold, 0.6); g.lineWidth = 4; g.stroke(body);
      g.restore();
    }
    // Dust burst.
    g.save(); g.globalCompositeOperation = 'lighter';
    const dq = clamp((p - burst) / 0.35);
    for (let i = 0; i < 60; i++) {
      const an = hash(i, 3) * TAU, r = dq * (200 + 500 * hash(i, 4));
      glow(g, cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.7, 30 + 40 * hash(i, 5), [200, 170, 130], 0.25 * (1 - dq));
    }
    glow(g, cx, cy, 700, PAL.gold, 0.9 * Math.exp(-(p - burst) * 10));
    g.restore();
    // He steps out into the light, arms slightly out.
    const rise = easeOut(clamp((p - burst - 0.03) / 0.3));
    const pose = poseFront({ armL: 0.32, armR: 0.32, elL: 0.35, elR: 0.35, legL: 0.07, legR: 0.07, tilt: -0.05 });
    const kx = cx, ky = H * 0.9 + (1 - rise) * 70;
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, kx, ky - 260, 420, PAL.gold, 0.35 * rise); g.restore();
    const res = drawKid(g, kx, ky, 520, pose, { alpha: rise, tint: [255, 228, 180], lit: 0.9, rim: { c: [255, 225, 170], a: 1, dx: 0, dy: -0.006 }, aura: { c: PAL.gold, a: 0.35, blur: 20 }, pendant: { c: PAL.ice } });
    // Glints across the fit.
    const J = res.J;
    const spots = [J.head, J.neck, J.AL.hand, J.AR.hand, J.L.ankle, J.R.ankle, [0, -0.12 * 520]];
    spots.forEach(([sx, sy], i) => {
      const tw = Math.pow(Math.max(0, Math.sin(t * 3 + i * 1.7)), 6);
      drawGlint(g, kx + sx + hashs(i, 9) * 20, res.py + sy, 26 + 20 * tw, PAL.white, rise * (0.3 + 0.7 * tw));
    });
    // Glass reflection streaks.
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x0 = W * (0.15 + i * 0.3) + p * 200;
      g.fillStyle = `rgba(255,255,255,${0.035 * rise})`;
      g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 120, 0); g.lineTo(x0 - 380, H); g.lineTo(x0 - 500, H); g.closePath(); g.fill();
    }
    g.restore();
  }
  g.restore();
};

// ---------------------------------------------------------------- maze inside a head silhouette
SCENES.maze = (g, I) => {
  const { lt, t, dur, frame } = I;
  const p = clamp(lt / dur);
  const hx = W * 0.5, hy = H * 0.52, hs = 860, flip = -1;
  const C = [60, 240, 220];
  g.save();
  camera(g, { zoom: 1.03 + p * 0.05, rot: Math.sin(t * 0.4) * 0.015, t, shake: sstep(0.6, 1, p) * 0.4, seed: 81 });
  fillBG(g, [[0, [2, 6, 8]], [1, [1, 3, 5]]]);
  // Clocks spinning out of control around the head.
  const spin = t * (2 + p * 10);
  drawClock(g, W * 0.14, H * 0.24, 110, t, spin, [150, 255, 240], 0.55);
  drawClock(g, W * 0.86, H * 0.72, 140, t, -spin * 1.3, [150, 255, 240], 0.45);
  drawClock(g, W * 0.84, H * 0.2, 70, t, spin * 2.1, [150, 255, 240], 0.35);
  const head = new Path2D();
  curveThroughPath(head, HEAD_PROFILE.map(([x, y]) => [hx + x * hs * flip, hy + y * hs]));
  g.fillStyle = '#020a0c';
  g.fill(head);
  g.save();
  g.clip(head);
  const n = 16;
  const M = mazeWalls(n, 1234);
  const cs = (0.74 * hs) / n, ox = hx - 0.3 * hs, oy = hy - 0.56 * hs;
  neonStroke(g, gg => { for (const [x0, y0, x1, y1] of M.segs) { gg.moveTo(ox + x0 * cs, oy + y0 * cs); gg.lineTo(ox + x1 * cs, oy + y1 * cs); } }, C, 1.6, 0.75);
  // A tiny light (him) wandering the corridors, trailing its path.
  const cell = c => [ox + ((c % n) + 0.5) * cs, oy + (Math.floor(c / n) + 0.5) * cs];
  const k = lt * 7.5;
  const pos = kk => { const i = Math.floor(kk) % (M.walk.length - 1); const a = cell(M.walk[i]), b = cell(M.walk[i + 1]); const u = fract(kk); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let j = 30; j >= 0; j--) { const [x, y] = pos(Math.max(0, k - j * 0.15)); glow(g, x, y, 14, PAL.white, 0.5 * (1 - j / 30), 1); }
  const [dx, dy] = pos(k);
  glow(g, dx, dy, 60, C, 0.8); glow(g, dx, dy, 14, PAL.white, 1, 1);
  g.restore();
  g.restore();
  neonStroke(g, gg => curveThroughPath(gg, HEAD_PROFILE.map(([x, y]) => [hx + x * hs * flip, hy + y * hs])), C, 3.5, 0.95);
  // Glitch slices ramp up toward the end.
  const gk = sstep(0.4, 1, p);
  for (let i = 0; i < 10; i++) {
    if (hash(i, frame) > gk * 0.5) continue;
    const y = hash(i, frame, 1) * H, hh = 4 + hash(i, frame, 2) * 60;
    g.drawImage(g.canvas, 0, y, W, hh, hashs(i, frame, 3) * 80 * gk, y, W, hh);
  }
  g.restore();
};

// ---------------------------------------------------------------- diamond shards bursting from a hooded profile
SCENES.diamonds = (g, I) => {
  const { lt, t, dur } = I;
  const p = clamp(lt / dur);
  const headX = W * 0.28, headY = H * 0.5;
  const ex = headX + 0.46 * 760, ey = headY + 0.22 * 760;
  g.save();
  camera(g, { zoom: 1.0 + p * 0.08, x: -p * 60, t, shake: 0.2 + p * 0.5, seed: 91 });
  fillBG(g, [[0, [1, 3, 10]], [0.6, [4, 14, 34]], [1, [1, 2, 8]]]);
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, ex + 300, ey, 900, [60, 140, 255], 0.25 + 0.25 * p);
  g.restore();
  // Close-up: his head in profile, lit from inside.
  const fs = 760;
  drawKidHead(g, headX, headY, fs * 1.1, { facing: 1, tilt: -0.05, face: { eyes: 0.15, mouth: 0.35 + 0.25 * p } }, { tint: PAL.ice, lit: 0.55, rim: { c: PAL.ice, a: 0.85, dx: 0.004, dy: -0.003 } });
  // Glow from the face.
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, ex, ey, 170 + 130 * p, PAL.ice, 0.55 + 0.4 * p);
  glow(g, ex, ey, 30 + 24 * p, PAL.white, 1, 1);
  g.restore();
  // Diamonds and spirit wisps streaming out.
  const N = 110;
  for (let i = 0; i < N; i++) {
    const period = 1.6 + hash(i, 1);
    const age = fract(t / period + hash(i, 2)) * period;
    const on = sstep(0, 0.15, p - hash(i, 9) * 0.5);
    if (on <= 0) continue;
    const an = hashs(i, 3) * 0.75 - 0.05;
    const sp = 500 + 900 * hash(i, 4);
    const x = ex + Math.cos(an) * sp * age, y = ey + Math.sin(an) * sp * age + 60 * age * age;
    const s = (10 + 22 * hash(i, 5)) * (1 - age / period * 0.5);
    const c = [PAL.ice, PAL.cyan, [200, 220, 255], [180, 160, 255]][i % 4];
    const a = on * (1 - age / period);
    if (i % 3 === 0) {
      neonStroke(g, gg => { for (let k = 0; k <= 8; k++) { const aa = age - k * 0.03; if (aa < 0) break; const px = ex + Math.cos(an) * sp * aa + Math.sin(aa * 9 + i) * 20, py = ey + Math.sin(an) * sp * aa + 60 * aa * aa + Math.cos(aa * 9 + i) * 20; k ? gg.lineTo(px, py) : gg.moveTo(px, py); } }, c, 1.8, a * 0.7);
    } else {
      drawDiamond(g, x, y, s, t * 3 * hashs(i, 6) + i, c, a);
      if (hash(i, Math.floor(t * 6)) > 0.8) drawGlint(g, x, y - s, s * 2.2, PAL.white, a);
    }
  }
  g.restore();
  // Build to a white-out for the last chorus.
  const wo = sstep(0.82, 1, p);
  if (wo > 0) { g.fillStyle = rgba([235, 245, 255], wo * 0.75); g.fillRect(0, 0, W, H); }
};
