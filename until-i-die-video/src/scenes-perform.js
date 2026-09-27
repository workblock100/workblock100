'use strict';
// Performance inserts: the Kid close to camera, feeling the song under stage light.
// params.close: tighter framing. The camera side alternates per shot.

SCENES.perform = (g, I) => {
  const { lt, t, v, params } = I;
  const P = vp(v);
  const start = t - lt;
  const side = params.side || (hash(Math.round(start * 10), 17) > 0.5 ? 1 : -1);
  const close = !!params.close;
  const key = [[220, 205, 255], [255, 178, 182], [255, 226, 186]][v] || [220, 205, 255];
  g.save();
  camera(g, { zoom: 1.0 + lt * 0.03, x: side * (36 - lt * 14), t, shake: 0.1, seed: 44 });
  fillBG(g, [[0, mixc(P.bg, [0, 0, 0], 0.55)], [0.55, P.bg], [1, [2, 1, 4]]]);
  // Neon tubes behind him.
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    const x = W * (0.04 + i * 0.13) - side * 40;
    const c = [P.a, P.b, P.c][i % 3];
    const fl = 0.8 + 0.2 * Math.sin(t * 1.6 + i * 1.7);
    const y0 = H * (0.06 + 0.05 * (i % 2)), y1 = H * 0.78;
    g.filter = 'blur(10px)';
    g.fillStyle = rgba(c, 0.5 * fl);
    g.fillRect(x - 9, y0, 18, y1 - y0);
    g.filter = 'none';
    g.fillStyle = rgba(mixc(c, PAL.white, 0.7), 0.85 * fl);
    g.fillRect(x - 2.5, y0, 5, y1 - y0);
    g.save(); g.translate(x, (y0 + y1) / 2); g.scale(0.35, 1.6); glow(g, 0, 0, 260, c, 0.28 * fl); g.restore();
  }
  g.restore();
  drawFog(g, t, { y: H * 0.55, h: 500, color: mixc(P.a, [40, 30, 60], 0.5), alpha: 0.22, n: 12, seed: 90, add: true, speed: 30 });
  drawRain(g, t, { n: 260, alpha: 0.16, speed: 1600, len: 50, seed: 77, color: [210, 210, 255] });
  // Backlight burst behind his head.
  const h = close ? 2500 : 1850;
  const headY = close ? H * 0.42 : H * 0.35;
  const pelvisY = headY + 0.372 * h;
  const sway = Math.sin(t * 1.2);
  const nod = Math.sin(t * 2.4);
  const kx = W * 0.5 + side * (close ? 150 : 90) + sway * 16;
  g.save(); g.globalCompositeOperation = 'lighter';
  glow(g, kx - side * 60, headY - 60, close ? 900 : 700, P.a, 0.45);
  glow(g, kx - side * 60, headY - 60, 180, mixc(P.b, PAL.white, 0.5), 0.35);
  g.restore();
  // Him: eyes mostly closed, head moving with the song, one hand up.
  const gest = 0.5 + 0.5 * Math.sin(t * 0.8 + 1);
  const eyes = 0.12 + 0.88 * sstep(0.55, 0.9, 0.5 + 0.5 * Math.sin(t * 0.55 + v));
  const heart = hash(Math.round(start * 10), 23) > 0.45;
  const pose = heart
    ? poseFront({ armL: 0.16 + 0.03 * gest, elL: -2.42 - 0.06 * gest, armR: 0.1, elR: 0.16, tilt: 0.07 * sway, sway })
    : poseFront({ armL: 0.1 + 0.02 * sway, elL: 0.16, armR: 0.1 - 0.02 * sway, elR: 0.16, tilt: 0.07 * sway, sway });
  pose.fixed = true;
  pose.face = { eyes, mouth: 0.1 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.7)), nod, seed: v };
  drawKid(g, kx, pelvisY + nod * 5, h, pose, {
    tint: key, lit: 0.92,
    rim: { c: mixc(P.b, PAL.white, 0.3), a: 0.95, dx: -side * 0.0035, dy: -0.002 },
    aura: { c: P.a, a: 0.35, blur: 34 },
  });
  // A slow light sweep across the frame.
  const sw = fract(lt * 0.35 + hash(Math.round(start * 10), 5));
  g.save(); g.globalCompositeOperation = 'lighter';
  const sx = lerp(-W * 0.3, W * 1.3, sw);
  g.fillStyle = `rgba(255,255,255,${0.05 * Math.sin(sw * Math.PI)})`;
  g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx + 160, 0); g.lineTo(sx - 240, H); g.lineTo(sx - 400, H); g.closePath(); g.fill();
  g.restore();
  // Foreground rain: big, soft, fast.
  g.save(); g.filter = 'blur(2px)';
  drawRain(g, t, { n: 90, alpha: 0.35, speed: 2600, len: 120, width: 2.4, seed: 88, layers: 1, color: [230, 225, 255] });
  g.restore();
  g.restore();
};
