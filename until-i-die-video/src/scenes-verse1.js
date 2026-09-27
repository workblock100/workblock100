'use strict';
// Verse 1 shots: mirror, burning highway, shockwave crowd, city walk at dusk,
// sailboat (calm, then hail storm), demons and sigil, light figure.

// ---------------------------------------------------------------- mirror with a glitching reflection
SCENES.mirrorSelf = (g, I) => {
  const { lt, t, dur, frame } = I;
  const p = clamp(lt / dur);
  const gy = H * 0.86, kh = 470;
  const mx = W * 0.66, mTop = H * 0.14, mw = 440, mh = gy - mTop;
  g.save();
  camera(g, { zoom: 1.0 + p * 0.06, x: -p * 40, t });
  fillBG(g, [[0, [3, 6, 12]], [0.7, [10, 12, 30]], [1, [2, 2, 5]]]);
  g.fillStyle = vgrad(g, gy, H, [[0, [14, 14, 30]], [1, [2, 2, 6]]]);
  g.fillRect(-W, gy, W * 3, H);
  drawFog(g, t, { y: gy - 40, color: [40, 60, 110], alpha: 0.2, n: 8, seed: 12 });
  // Mirror shape: rounded top.
  const mirror = new Path2D();
  mirror.moveTo(mx - mw / 2, gy);
  mirror.lineTo(mx - mw / 2, mTop + mw / 2);
  mirror.arc(mx, mTop + mw / 2, mw / 2, Math.PI, 0);
  mirror.lineTo(mx + mw / 2, gy);
  mirror.closePath();
  g.save();
  g.clip(mirror);
  const mg = g.createLinearGradient(mx - mw / 2, 0, mx + mw / 2, 0);
  mg.addColorStop(0, '#0d1426'); mg.addColorStop(0.5, '#1b2140'); mg.addColorStop(1, '#0a0f1e');
  g.fillStyle = mg; g.fillRect(mx - mw, mTop - 10, mw * 2, mh + 20);
  // The reflection lags, drifts, then turns to face us with red eyes.
  const turn = sstep(0.5, 0.62, p);
  const jump = hash(Math.floor(t * 6), 3) > 0.85 ? hashs(Math.floor(t * 6), 4) * 26 : 0;
  const rx = mx - 30 + jump;
  const breathR = Math.sin((t - 0.45) * 1.6);
  for (const [c, dx] of [[[255, 40, 80], -6], [[40, 220, 255], 6]]) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35;
    if (turn < 0.5) { const ps = poseStand(breathR); ps.facing = -1; drawKid(g, rx + dx, gy, kh * 0.96, ps, { fill: c }); }
    else drawKid(g, rx + dx, gy, kh * 0.96, poseFront({ tilt: 0.1 * Math.sin(t) }), { fill: c });
    g.restore();
  }
  if (turn < 0.5) { const ps = poseStand(breathR); ps.facing = -1; drawKid(g, rx, gy, kh * 0.96, ps, { fill: [16, 18, 34], rim: { c: [120, 160, 255], a: 0.6, dx: -0.006, dy: -0.004 } }); }
  else drawKid(g, rx, gy, kh * 0.96, poseFront({ tilt: 0.1 * Math.sin(t) }), { fill: [16, 18, 34], rim: { c: [255, 80, 110], a: 0.6, dx: 0, dy: -0.004 }, eyes: { c: PAL.blood, a: turn } });
  // Glitch slices inside the mirror.
  const gk = 0.3 + 0.7 * turn;
  for (let i = 0; i < 8; i++) {
    if (hash(i, frame) > 0.25 * gk) continue;
    const y = mTop + hash(i, frame, 1) * mh, hh = 4 + hash(i, frame, 2) * 30;
    g.drawImage(g.canvas, mx - mw / 2, y, mw, hh, mx - mw / 2 + hashs(i, frame, 3) * 40, y, mw, hh);
  }
  // Glass sheen.
  const sh = g.createLinearGradient(mx - mw / 2, mTop, mx + mw / 2, gy);
  sh.addColorStop(0, 'rgba(255,255,255,0.12)'); sh.addColorStop(0.3, 'rgba(255,255,255,0)'); sh.addColorStop(0.55, 'rgba(255,255,255,0.06)'); sh.addColorStop(0.62, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(mx - mw, mTop, mw * 2, mh);
  g.restore();
  // Frame.
  g.lineWidth = 26; g.strokeStyle = '#0a0710'; g.stroke(mirror);
  g.save(); g.strokeStyle = rgba([130, 150, 255], 0.5); g.lineWidth = 2; g.stroke(mirror); g.restore();
  // Crack spreads near the end.
  const ck = sstep(0.78, 0.95, p);
  if (ck > 0) {
    const ox = mx + 40, oy = mTop + mh * 0.38;
    neonStroke(g, gg => {
      for (let r = 0; r < 11; r++) {
        const an = (r / 11) * TAU + hash(r, 8) * 0.4;
        let x = ox, y = oy;
        gg.moveTo(x, y);
        const len = (120 + 240 * hash(r, 9)) * ck;
        for (let s = 1; s <= 6; s++) {
          x = ox + Math.cos(an + hashs(r, s) * 0.25) * len * s / 6;
          y = oy + Math.sin(an + hashs(r, s) * 0.25) * len * s / 6;
          gg.lineTo(x, y);
        }
      }
    }, [220, 235, 255], 1.4, ck);
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, ox, oy, 60, PAL.white, ck * 0.8, 1); g.restore();
  }
  // The real Kid, in profile, not turning.
  const ps = poseStand(Math.sin(t * 1.6));
  drawKid(g, W * 0.34, gy, kh, ps, { tint: [150, 170, 255], lit: 0.45, rim: { c: [140, 170, 255], a: 0.8, dx: 0.008, dy: -0.004 }, aura: { c: [60, 80, 200], a: 0.3, blur: 18 } });
  g.restore();
};

// ---------------------------------------------------------------- burning highway, rear view of the car
SCENES.hellDrive = (g, I) => {
  const { lt, t, dur } = I;
  const p = clamp(lt / dur);
  const hz = H * 0.44, f = 900, camH = 1.3, speed = 38;
  const sway = Math.sin(t * 1.3) * 0.35 + noise1(t * 2, 7) * 0.2;
  const proj = (X, z) => [W / 2 + ((X - sway * 0.4) * f) / z, hz + (camH * f) / z];
  g.save();
  camera(g, { zoom: 1.04 + 0.02 * Math.sin(t * 9), rot: -sway * 0.03, t, shake: 0.55, seed: 9 });
  // Burning sky.
  fillBG(g, [[0, [8, 1, 2]], [0.55, [70, 10, 6]], [0.78, [150, 40, 10]], [1, [30, 4, 2]]], 0, hz + 40);
  drawClouds(g, t, { seed: 77, y: -60, h: 420, base: '#1c0503', lit: '#a1300c', speed: 60, alpha: 0.9 });
  g.save(); g.globalCompositeOperation = 'lighter';
  g.save(); g.translate(W / 2, hz); g.scale(1, 0.25); glow(g, 0, 0, 900, PAL.ember, 0.6); g.restore();
  g.restore();
  // Ground and road.
  g.fillStyle = vgrad(g, hz, H, [[0, [40, 8, 4]], [1, [6, 1, 1]]]);
  g.fillRect(-W, hz, W * 3, H);
  const [l0x, l0y] = proj(-2.4, 60), [r0x] = proj(2.4, 60), [l1x, l1y] = proj(-2.4, 1.2), [r1x] = proj(2.4, 1.2);
  g.fillStyle = '#0d0506';
  g.beginPath(); g.moveTo(l0x, l0y); g.lineTo(r0x, l0y); g.lineTo(r1x, l1y); g.lineTo(l1x, l1y); g.closePath(); g.fill();
  // Center dashes streaming toward us.
  g.fillStyle = 'rgba(255,190,120,0.8)';
  for (let k = 0; k < 18; k++) {
    const z0 = 1.2 + ((k * 4 - (t * speed) % 4) + 4) % 72;
    const z1 = z0 + 1.6;
    const [a1x, a1y] = proj(-0.08, z0), [b1x] = proj(0.08, z0), [a2x, a2y] = proj(-0.08, z1), [b2x] = proj(0.08, z1);
    g.globalAlpha = clamp(1 - z0 / 60);
    g.beginPath(); g.moveTo(a1x, a1y); g.lineTo(b1x, a1y); g.lineTo(b2x, a2y); g.lineTo(a2x, a2y); g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
  // Walls of fire on both sides.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 260; i++) {
    const side = i % 2 ? 1 : -1;
    const zb = 1.5 + fract(hash(i, 1) - (t * speed) / 70) * 70;
    const X = side * (3.0 + hash(i, 2) * 2.2);
    const [sx, sy] = proj(X, zb);
    const life = fract(t * (1.2 + hash(i, 3)) + hash(i, 4));
    const hgt = (2.2 + 2 * hash(i, 5)) * f / zb * life * 0.9;
    const r = (0.9 + hash(i, 6)) * f / zb * (1 - life * 0.6) * 0.55;
    const col = life < 0.25 ? PAL.gold : life < 0.6 ? PAL.ember : PAL.blood;
    const fx = sx + noise1(t * 3 + i, 5) * r * 0.4, fy = sy - hgt;
    g.save(); g.translate(fx, fy); g.scale(0.55, 1.6); glow(g, 0, 0, r, col, 0.6 * (1 - life) * clamp(1.4 - zb / 60)); g.restore();
  }
  // Embers flying past the camera.
  for (let i = 0; i < 90; i++) {
    const z = 0.6 + fract(hash(i, 11) - t * 0.7 * (0.6 + hash(i, 12))) * 18;
    const X = hashs(i, 13) * 6, Y = -hash(i, 14) * 4 + 0.5;
    const sx = W / 2 + (X * f) / z, sy = hz + ((camH + Y) * f) / z;
    glow(g, sx, sy, 3 + 30 / z, [PAL.gold, PAL.ember][i % 2], clamp(1 - z / 18) * 0.9, 1);
  }
  // Speed streaks from the vanishing point.
  for (let i = 0; i < 40; i++) {
    const an = hash(i, 21) * TAU, ph = fract(hash(i, 22) + t * 1.6);
    const r0 = 80 + ph * 1400, r1 = r0 + 60 + ph * 300;
    g.strokeStyle = rgba([255, 200, 150], 0.25 * ph);
    g.lineWidth = 1 + ph * 2;
    g.beginPath(); g.moveTo(W / 2 + Math.cos(an) * r0, hz + Math.sin(an) * r0 * 0.6); g.lineTo(W / 2 + Math.cos(an) * r1, hz + Math.sin(an) * r1 * 0.6); g.stroke();
  }
  g.restore();
  // The car.
  drawCarRear(g, W / 2 + sway * 60, H * 0.9, 620, t, { brake: 0.5 + 0.5 * Math.abs(Math.sin(t * 3)), plate: '999' });
  g.restore();
  // Dash cluster (screen space): speedometer pinned, seatbelt light blinking.
  const hx = 190, hy = H - 170;
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.beginPath(); g.arc(hx, hy, 130, 0, TAU); g.fill();
  neonStroke(g, gg => gg.arc(hx, hy, 118, Math.PI * 0.75, Math.PI * 2.25), [255, 140, 90], 1.6, 0.8);
  for (let i = 0; i <= 12; i++) {
    const an = Math.PI * 0.75 + (i / 12) * Math.PI * 1.5;
    g.strokeStyle = i > 9 ? 'rgba(255,50,60,0.9)' : 'rgba(255,200,170,0.8)';
    g.lineWidth = i % 3 === 0 ? 4 : 2;
    g.beginPath(); g.moveTo(hx + Math.cos(an) * 100, hy + Math.sin(an) * 100); g.lineTo(hx + Math.cos(an) * 114, hy + Math.sin(an) * 114); g.stroke();
  }
  const sp = clamp(0.55 + p * 0.5 + 0.03 * Math.sin(t * 20));
  const na = Math.PI * 0.75 + sp * Math.PI * 1.5;
  neonStroke(g, gg => { gg.moveTo(hx, hy); gg.lineTo(hx + Math.cos(na) * 108, hy + Math.sin(na) * 108); }, PAL.blood, 2.5, 1);
  g.fillStyle = rgba([255, 220, 200], 0.95);
  g.font = "400 44px 'Share Tech Mono'"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(Math.round(90 + sp * 110)), hx, hy + 52);
  g.font = "400 14px 'Share Tech Mono'"; g.fillStyle = 'rgba(255,200,180,0.7)';
  g.fillText('MPH', hx, hy + 82);
  const blink = Math.floor(t * 3) % 2 === 0 ? 1 : 0.15;
  drawSeatbeltIcon(g, hx + 200, hy + 10, 46, PAL.blood, blink);
  g.font = "400 16px 'Share Tech Mono'"; g.fillStyle = rgba(PAL.blood, 0.9 * blink); g.textAlign = 'left';
  g.fillText('BELT', hx + 180, hy + 60);
  g.restore();
};

// ---------------------------------------------------------------- shockwave rings through a crowd
SCENES.shockwave = (g, I) => {
  const { lt, t, dur } = I;
  const hzY = H * 0.6, kx = W * 0.5, gy = H * 0.93, kh = 430;
  g.save();
  const rings = [0.2, 1.2, 2.2].map(s => s * dur / 3.3);
  const hit = rings.reduce((m, s) => Math.max(m, Math.exp(-Math.max(0, lt - s) * 6) * (lt > s ? 1 : 0)), 0);
  camera(g, { zoom: 1.02 + lt * 0.01, t, shake: 0.2 + hit * 1.2, seed: 13 });
  fillBG(g, [[0, [4, 3, 12]], [0.55, [24, 12, 44]], [0.6, [40, 20, 60]], [1, [5, 3, 10]]]);
  drawStars(g, t, { n: 140, alpha: 0.5, y1: hzY, seed: 17 });
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(W / 2, hzY); g.scale(1, 0.1); glow(g, 0, 0, W * 0.6, PAL.violet, 0.4); g.restore();
  g.fillStyle = vgrad(g, hzY, H, [[0, [16, 8, 28]], [1, [3, 2, 6]]]);
  g.fillRect(-W, hzY, W * 3, H);
  // Crowd on the horizon, faces lit by phones. They never look up.
  const crowd = [];
  for (let i = 0; i < 46; i++) {
    const depth = hash(i, 1);
    crowd.push({ i, x: W * 0.04 + hash(i, 2) * W * 0.92, y: hzY + 20 + depth * 130, s: 60 + depth * 90 });
  }
  crowd.sort((a, b) => a.y - b.y);
  for (const c of crowd) {
    let bump = 0;
    for (const s of rings) {
      const age = lt - s;
      if (age < 0 || age > 2) continue;
      const R = age * 1300;
      const d = Math.hypot((c.x - kx) / 1.0, (c.y - gy) / 0.28);
      bump += Math.exp(-Math.pow((d - R) / 90, 2)) * 1;
    }
    const pose = poseFront({ armL: 0.05, armR: 0.28, elR: -1.9, tilt: 0.25, back: false });
    drawKid(g, c.x + bump * 6, c.y, c.s * (1 + bump * 0.05), pose, { generic: true, fill: [8, 5, 14], detail: false });
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, c.x + c.s * 0.06, c.y - c.s * 0.82, c.s * 0.14, [150, 200, 255], 0.6);
    g.restore();
  }
  // Rings along the ground and in the air.
  for (const s of rings) {
    const age = lt - s;
    if (age < 0 || age > 2.2) continue;
    const R = age * 1300, a = clamp(1 - age / 2.2);
    neonStroke(g, gg => gg.ellipse(kx, gy - 10, R, R * 0.28, 0, 0, TAU), PAL.violet, 3 * a + 0.5, a);
    neonStroke(g, gg => gg.arc(kx, gy - kh * 0.6, R * 0.8, 0, TAU), PAL.cyan, 2 * a, a * 0.55);
    // Dust kicked up by the ring.
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 40; k++) {
      const an = hash(k, s * 10) * TAU;
      const px = kx + Math.cos(an) * R, py = gy - 10 + Math.sin(an) * R * 0.28 - hash(k, 3) * 40 * a;
      glow(g, px, py, 10, [180, 150, 255], 0.35 * a, 1);
    }
    g.restore();
  }
  // The Kid, arms thrown back, pushing everything he has out.
  const k = hit;
  const pose = poseFront({ armL: 0.55 + 0.25 * k, armR: 0.55 + 0.25 * k, elL: 0.25, elR: 0.25, legL: 0.14, legR: 0.14, tilt: 0 });
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, kx, gy - kh * 0.55, 360, PAL.violet, 0.3 + 0.5 * k); g.restore();
  drawKid(g, kx, gy, kh, pose, { tint: [215, 195, 255], lit: 0.5 + 0.3 * k, rim: { c: [210, 180, 255], a: 0.9, dx: 0, dy: -0.006 }, aura: { c: PAL.violet, a: 0.4 + 0.4 * k, blur: 22 } });
  g.restore();
};

// ---------------------------------------------------------------- walk toward the city at dusk
function heartPath(g, x, y, s) {
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 0.1, y + s * 0.2, x - s * 0.6, y + s * 0.05, x - s * 0.5, y - s * 0.3);
  g.bezierCurveTo(x - s * 0.42, y - s * 0.58, x - s * 0.05, y - s * 0.55, x, y - s * 0.28);
  g.bezierCurveTo(x + s * 0.05, y - s * 0.55, x + s * 0.42, y - s * 0.58, x + s * 0.5, y - s * 0.3);
  g.bezierCurveTo(x + s * 0.6, y + s * 0.05, x + s * 0.1, y + s * 0.2, x, y + s * 0.35);
}

SCENES.returnWorld = (g, I) => {
  const { lt, t } = I;
  const gy = H * 0.8, kh = 380;
  g.save();
  camera(g, { zoom: 1.03, t });
  fillBG(g, [[0, [18, 8, 44]], [0.45, [90, 24, 90]], [0.66, [230, 90, 90]], [0.74, [255, 170, 110]], [0.76, [60, 20, 40]], [1, [8, 3, 10]]]);
  drawStars(g, t, { n: 90, alpha: 0.5, y1: H * 0.35, seed: 29 });
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, W * 0.72, H * 0.73, 420, [255, 150, 90], 0.55);
  glow(g, W * 0.72, H * 0.73, 110, [255, 230, 180], 0.9, 1);
  g.restore();
  drawCity(g, 51, H * 0.76, 330, 900 + lt * 18, { col: '#1a0a1e', win: '#ffcf8a', winP: 0.18, minH: 0.25 });
  drawCity(g, 52, H * 0.8, 240, 300 + lt * 40, { col: '#0c050e', win: '#ff9f6a', winP: 0.12, minH: 0.18 });
  // Bridge deck and railing.
  g.fillStyle = '#060207';
  g.fillRect(-W, gy, W * 3, H - gy + 50);
  g.fillStyle = 'rgba(255,170,120,0.25)';
  g.fillRect(-W, gy, W * 3, 3);
  g.strokeStyle = '#060207'; g.lineWidth = 6;
  g.beginPath();
  g.moveTo(-W, gy - 70); g.lineTo(W * 2, gy - 70);
  for (let i = 0; i < 30; i++) { const x = i * 90 - ((lt * 150) % 90); g.moveTo(x, gy - 70); g.lineTo(x, gy); }
  g.stroke();
  // Birds heading the same way.
  g.strokeStyle = 'rgba(20,6,20,0.9)'; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const bx = W * 0.3 + i * 110 + lt * 60 + Math.sin(i) * 40, by = H * 0.3 + hash(i, 2) * 120 + Math.sin(t * 2 + i) * 8;
    const fl = Math.sin(t * 8 + i) * 10;
    g.beginPath(); g.moveTo(bx - 16, by - fl); g.quadraticCurveTo(bx - 6, by - 4, bx, by); g.quadraticCurveTo(bx + 6, by - 4, bx + 16, by - fl); g.stroke();
  }
  // The Kid walking toward the light, carrying something warm.
  const pose = poseWalk(lt * 0.8);
  pose.shF = 0.9; pose.elF = 0.9; pose.tilt = 0.02;
  const kx = W * 0.4 + lt * 10;
  const res = drawKid(g, kx, gy, kh, pose, { tint: [255, 196, 160], lit: 0.66, rim: { c: [255, 190, 140], a: 0.9, dx: 0.008, dy: -0.004 }, aura: { c: [255, 120, 110], a: 0.25, blur: 16 } });
  const hand = [kx + res.J.AF.hand[0], res.py + res.J.AF.hand[1]];
  const beat = 1 + 0.08 * Math.pow(Math.max(0, Math.sin(t * 5)), 8);
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, hand[0] + 10, hand[1] - 20, 150 * beat, [255, 90, 120], 0.6);
  g.restore();
  g.fillStyle = rgba([255, 120, 150]);
  g.beginPath(); heartPath(g, hand[0] + 10, hand[1] - 22, 46 * beat); g.fill();
  g.fillStyle = rgba([255, 220, 230], 0.8);
  g.beginPath(); g.arc(hand[0] - 2, hand[1] - 34, 5, 0, TAU); g.fill();
  g.restore();
};

// ---------------------------------------------------------------- sailboat at sea (params.storm: 0 calm, 1 hail storm)
SCENES.ocean = (g, I) => {
  const { lt, t, params } = I;
  const st = params.storm || 0;
  const hz = H * 0.46;
  const fl = st ? flashAt(lt, [0.4, 1.35, 1.55, 2.6]) : 0;
  g.save();
  camera(g, { zoom: 1.12 + lt * 0.015, y: 30, rot: st * Math.sin(t * 1.1) * 0.03, t, shake: st * 0.5, seed: 21 });
  if (!st) {
    fillBG(g, [[0, [4, 6, 20]], [0.7, [20, 26, 60]], [1, [40, 44, 90]]], 0, hz);
    drawStars(g, t, { n: 200, alpha: 0.8, y1: hz, seed: 31 });
    drawMoon(g, W * 0.64, H * 0.2, 90, [240, 236, 255], 1, 8);
  } else {
    fillBG(g, [[0, [3, 3, 8]], [1, [16, 18, 34]]], 0, hz);
    drawClouds(g, t, { seed: 41, y: -80, h: 560, base: '#0b0c18', lit: '#39406e', speed: 70, flash: fl });
    if (fl > 0.05) drawBolt(g, W * (0.3 + 0.4 * hash(Math.floor(lt * 2), 2)), -10, W * 0.5, hz + 20, 500 + Math.floor(lt * 2), fl, [210, 220, 255], 3.5, 3);
  }
  // Sea layers from horizon to foreground.
  const layers = 6;
  let boatY = hz, boatAng = 0;
  for (let L = 0; L < layers; L++) {
    const d = L / (layers - 1);
    const base = lerp(hz + 6, H * 1.0, Math.pow(d, 1.4));
    const amp = lerp(3, 60, d) * (1 + st * 1.5);
    const k = lerp(0.02, 0.006, d) * (1 - st * 0.45);
    const sp = (1.2 + d) * (1 + st * 0.9);
    const col = mixc([10, 16, 40], [2, 4, 12], d);
    g.beginPath();
    g.moveTo(-60, H + 60);
    for (let x = -60; x <= W + 60; x += 12) g.lineTo(x, waveY(x, t, base, amp, k, sp, L * 3.1));
    g.lineTo(W + 60, H + 60); g.closePath();
    g.fillStyle = vgrad(g, base - amp, H, [[0, mixc(col, [60, 70, 120], st ? 0.15 + fl * 0.4 : 0.25)], [1, [1, 2, 6]]]);
    g.fill();
    // Crest highlights.
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = rgba(st ? [170, 190, 255] : [200, 200, 255], (0.15 + 0.2 * d) * (1 + fl));
    g.lineWidth = 1 + d * 2;
    g.beginPath();
    for (let x = -60; x <= W + 60; x += 12) { const y = waveY(x, t, base, amp, k, sp, L * 3.1); x === -60 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
    g.restore();
    if (L === 2) {
      const bx = W * 0.5;
      boatY = waveY(bx, t, base, amp, k, sp, L * 3.1);
      const y2 = waveY(bx + 20, t, base, amp, k, sp, L * 3.1);
      boatAng = Math.atan2(y2 - boatY, 20) * (st ? 1.4 : 1);
      // Moon path on calm water.
      if (!st) {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 70; i++) {
          const yy = hz + 8 + Math.pow(hash(i, 3), 1.5) * (H - hz);
          const xx = W * 0.64 + hashs(i, 4) * (20 + (yy - hz) * 0.3) + Math.sin(t * 2 + i) * 6;
          g.fillStyle = rgba([220, 220, 255], 0.35 * (1 - (yy - hz) / (H - hz)) + 0.1);
          g.fillRect(xx - 12, yy, 24 + hash(i, 5) * 30, 2);
        }
        g.restore();
      }
      // The boat, and him on it.
      const bs = 150;
      drawBoat(g, bx, boatY - 4, bs, boatAng, { lamp: st ? 0.6 + 0.4 * Math.abs(Math.sin(t * 7)) : 1 });
      g.save(); g.translate(bx, boatY - 4); g.rotate(boatAng);
      drawKid(g, -bs * 0.25, -bs * 0.05, 92, poseStand(Math.sin(t * 1.5)), { tint: [210, 210, 255], lit: 0.45, rim: { c: st ? [200, 210, 255] : [230, 220, 255], a: 0.8, dx: 0.01, dy: -0.006 } });
      g.restore();
    }
  }
  if (st) {
    // Hail: short heavy streaks, and sparks where it hits the water.
    drawRain(g, t, { n: 420, speed: 3200, len: 22, width: 3.2, angle: 0.5, alpha: 0.6, color: [230, 238, 255], seed: 61, layers: 2 });
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 80; i++) {
      const ph = t * 3 + hash(i, 5), idx = Math.floor(ph), life = fract(ph);
      const x = hash(i, idx) * W, y = hz + 40 + hash(i, idx, 3) * (H - hz);
      glow(g, x, y, 10 * (1 - life) + 3, [230, 240, 255], 0.5 * (1 - life), 1);
    }
    g.restore();
    // Spray.
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const life = fract(t * 1.2 + hash(i, 9));
      glow(g, W * 0.5 + hashs(i, 10) * 200 + life * 80, boatY - life * 120 - 20, 20 * (1 - life) + 6, [200, 215, 255], 0.3 * (1 - life));
    }
    g.restore();
  }
  g.restore();
  if (fl > 0.02) { g.fillStyle = rgba([200, 210, 255], 0.18 * fl); g.fillRect(0, 0, W, H); }
};

// ---------------------------------------------------------------- demons (params.mode: 'banish' or 'circle')
SCENES.demons = (g, I) => {
  const { lt, t, dur, params } = I;
  const p = clamp(lt / dur);
  const circle = params.mode === 'circle';
  const gy = H * 0.84;
  const strobe = circle ? 0.5 + 0.5 * Math.sin(t * TAU * 1.1) : 0;
  g.save();
  camera(g, { zoom: 1.02 + p * 0.05, t, shake: circle ? 0.35 : 0.15 + sstep(0.4, 0.5, p) * 0.8 * (1 - sstep(0.5, 0.7, p)), seed: 31 });
  fillBG(g, [[0, [3, 1, 3]], [0.6, [26, 4, 8]], [0.78, [70, 10, 14]], [0.8, [18, 3, 5]], [1, [3, 1, 2]]]);
  drawClouds(g, t, { seed: 81, y: -40, h: 440, base: '#140305', lit: '#6a1420', speed: 10, alpha: 0.9 });
  g.save(); g.globalCompositeOperation = 'lighter';
  g.translate(W / 2, gy); g.scale(1, 0.16); glow(g, 0, 0, W * 0.6, PAL.blood, 0.35 + 0.35 * strobe); g.restore();
  g.fillStyle = vgrad(g, gy - 20, H, [[0, [20, 3, 6]], [1, [2, 0, 1]]]);
  g.fillRect(-W, gy - 20, W * 3, H);
  drawFog(g, t, { y: gy, color: [90, 10, 20], alpha: 0.35, n: 12, seed: 19, add: true });
  if (!circle) {
    const kx = W * 0.3;
    const raise = easeOut(clamp((p - 0.35) / 0.15));
    const freeze = sstep(0.42, 0.52, p);
    const kneel = sstep(0.55, 0.75, p);
    const gone = sstep(0.8, 0.98, p);
    // Demons rise from the ground in a loose arc facing him.
    for (let i = 0; i < 5; i++) {
      const dx = W * (0.52 + i * 0.105) + hashs(i, 2) * 30;
      const dy = gy + hash(i, 3) * 50 - 20;
      const s = 280 + hash(i, 4) * 120;
      const rise = easeOut(clamp((p - i * 0.03) / 0.3));
      const tt = lerp(t, 0.4 * t + 2, freeze);
      g.save();
      g.beginPath(); g.rect(-W, -H, W * 3, dy + H + 8); g.clip();
      drawDemon(g, dx, dy + (1 - rise) * s, s, tt, 400 + i, { kneel, alpha: 1 - gone, eye: mixc(PAL.blood, PAL.white, freeze * 0.3 * (Math.sin(t * 30 + i) > 0 ? 1 : 0)) });
      g.restore();
      if (gone > 0) {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 10; k++) glow(g, dx + hashs(i, k) * 80, dy - s * 0.5 - gone * 200 * hash(k, i), 40, [120, 30, 50], 0.3 * gone * (1 - gone));
        g.restore();
      }
    }
    const pose = poseCompel(raise);
    const res = drawKid(g, kx, gy, 440, pose, { tint: [170, 240, 255], lit: 0.4 + 0.25 * raise, rim: { c: PAL.cyan, a: 0.5 + 0.5 * raise, dx: 0.008, dy: -0.004 }, aura: { c: PAL.cyan, a: 0.2 + 0.4 * raise, blur: 18 } });
    const hand = [kx + res.J.AF.hand[0], res.py + res.J.AF.hand[1]];
    const sr = 60 + 120 * easeOutBack(clamp((p - 0.4) / 0.2));
    drawSigil(g, hand[0] + 70, hand[1], sr, t, PAL.cyan, raise * (1 - gone * 0.7));
    // Shockwave from the sigil.
    const wv = clamp((p - 0.45) / 0.2);
    if (wv > 0 && wv < 1) neonStroke(g, gg => gg.ellipse(hand[0] + 70, hand[1], wv * 1400, wv * 700, 0, 0, TAU), PAL.cyan, 3 * (1 - wv), 1 - wv);
  } else {
    // They circle and dance around him.
    const cx = W / 2;
    const items = [];
    for (let i = 0; i < 8; i++) {
      const an = t * 0.9 + (i / 8) * TAU;
      items.push({ i, x: cx + Math.cos(an) * 640, y: gy - 20 + Math.sin(an) * 110, depth: Math.sin(an) });
    }
    items.push({ kid: true, depth: 0 });
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) {
      if (it.kid) {
        const pose = poseFront({ armL: 0.06, armR: 0.06, tilt: 0.25 * Math.sin(t * 0.8), legL: 0.03, legR: 0.03 });
        g.save(); g.globalCompositeOperation = 'lighter'; glow(g, cx, gy - 200, 330, [255, 60, 80], 0.35); g.restore();
        drawKid(g, cx, gy + 6, 400, pose, { tint: [255, 150, 160], lit: 0.55, rim: { c: [255, 150, 160], a: 1, dx: 0, dy: -0.006 }, aura: { c: [255, 70, 90], a: 0.6, blur: 18 } });
        continue;
      }
      const s = (280 + hash(it.i, 4) * 100) * (0.85 + 0.2 * it.depth);
      const bounce = Math.abs(Math.sin(t * 4.2 + it.i)) * 40;
      drawDemon(g, it.x, it.y - bounce, s, t * 1.6, 600 + it.i, { alpha: 0.95 });
    }
    // Fire orbs tossed between them.
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {
      const ph = fract(t * 0.7 + k / 5);
      const a0 = t * 0.9 + (k / 5) * TAU, a1 = a0 + Math.PI * 0.9;
      const x = lerp(cx + Math.cos(a0) * 560, cx + Math.cos(a1) * 560, ph);
      const y = lerp(gy - 300, gy - 300, ph) - Math.sin(ph * Math.PI) * 260;
      glow(g, x, y, 70, PAL.ember, 0.7); glow(g, x, y, 16, PAL.gold, 1, 1);
    }
    g.restore();
  }
  g.restore();
  if (strobe > 0) { g.fillStyle = rgba([255, 40, 60], 0.06 * strobe); g.fillRect(0, 0, W, H); }
};

// ---------------------------------------------------------------- light figure facing him
SCENES.truth = (g, I) => {
  const { lt, t, dur } = I;
  const p = clamp(lt / dur);
  const gy = H * 0.86;
  const lx = W * 0.64;
  const bright = 0.5 + 0.5 * sstep(0.1, 0.5, p) + sstep(0.85, 1, p) * 0.8;
  g.save();
  camera(g, { zoom: 1.0 + p * 0.1, x: -p * 60, t });
  fillBG(g, [[0, [4, 4, 10]], [0.7, [16, 16, 34]], [1, [3, 3, 8]]]);
  g.fillStyle = vgrad(g, gy, H, [[0, [22, 22, 40]], [1, [4, 4, 8]]]);
  g.fillRect(-W, gy, W * 3, H);
  // Rays from the light figure.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    const an = (i / 16) * TAU + t * 0.05;
    const len = 1600;
    g.fillStyle = rgba([220, 230, 255], 0.035 * bright);
    g.beginPath(); g.moveTo(lx, gy - 260);
    g.lineTo(lx + Math.cos(an - 0.05) * len, gy - 260 + Math.sin(an - 0.05) * len);
    g.lineTo(lx + Math.cos(an + 0.05) * len, gy - 260 + Math.sin(an + 0.05) * len);
    g.closePath(); g.fill();
  }
  glow(g, lx, gy - 250, 700, [180, 200, 255], 0.35 * bright);
  g.save(); g.translate(lx, gy + 8); g.scale(1, 0.14); glow(g, 0, 0, 600, [200, 215, 255], 0.5 * bright); g.restore();
  g.restore();
  // The light figure, facing him, hand reaching out.
  const reach = easeInOut(clamp((p - 0.2) / 0.4));
  const lp = poseStand(Math.sin(t * 1.2));
  lp.facing = -1; lp.shF = lerp(0.1, 1.35, reach); lp.elF = lerp(0.35, 0.05, reach); lp.tilt = 0.05;
  drawKid(g, lx, gy, 470, lp, { light: { c: [240, 244, 255] }, aura: { c: [150, 180, 255], a: 0.8 * bright, blur: 30 } });
  // Particles drifting off it.
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const ph = fract(hash(i, 1) + t * 0.15);
    glow(g, lx + hashs(i, 2) * 220 + Math.sin(t + i) * 20, gy - ph * 700, 5, [220, 230, 255], (1 - ph) * 0.9, 1);
  }
  g.restore();
  // The Kid, dark, facing the light; he reaches back.
  const kp = poseStand(Math.sin(t * 1.6));
  kp.shF = lerp(0.1, 1.05, sstep(0.45, 0.8, p)); kp.elF = lerp(0.35, 0.1, sstep(0.45, 0.8, p)); kp.tilt = -0.05;
  drawKid(g, W * 0.36, gy, 470, kp, { tint: [215, 228, 255], lit: 0.42, rim: { c: [210, 225, 255], a: 1, dx: 0.01, dy: -0.004 } });
  g.restore();
};
