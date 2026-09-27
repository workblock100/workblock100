// 2D layer drawn over the finished 3D frame: the title card and the 999 end card.
import { W, H, TAU, clamp, sstep, lerp, easeInOut, window01, hash, mulberry32 } from './util.js';

const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function spaced(g, str, x, y, spacing) {
  g.letterSpacing = spacing + 'px';
  g.fillText(str, x, y);
  g.letterSpacing = '0px';
}

export function drawTitle(g, lt, alpha = 1) {
  const a1 = window01(lt, 2.0, 9.4, 1.4, 1.0), a2 = window01(lt, 2.8, 9.4, 1.6, 1.0), a3 = window01(lt, 4.2, 9.4, 1.2, 1.0);
  g.save();
  g.globalAlpha = alpha;
  g.textAlign = 'center';
  g.font = "700 30px 'Syncopate'";
  g.fillStyle = rgba([238, 230, 255], 0.92 * a1);
  spaced(g, 'JUICE WRLD', W / 2, H * 0.16, 22);
  g.font = "400 150px 'New Rocker'";
  g.globalCompositeOperation = 'lighter';
  g.filter = 'blur(26px)';
  g.fillStyle = rgba([160, 90, 255], 0.6 * a2);
  g.fillText('Until I Die', W / 2, H * 0.3);
  g.filter = 'none';
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = rgba([250, 244, 255], a2);
  g.fillText('Until I Die', W / 2, H * 0.3);
  g.font = "400 19px 'Syncopate'";
  g.fillStyle = rgba([210, 196, 245], 0.85 * a3);
  spaced(g, 'PARTY IN MY MIND', W / 2, H * 0.365, 12);
  g.restore();
}

// A handwritten 9: a loop, then a tail that drops and hooks left.
function ninePoints(cx, cy, s) {
  const pts = [];
  const r = s * 0.36, ly = cy - s * 0.3;
  for (let i = 0; i <= 11; i++) { const a = -(i / 11) * TAU; pts.push([cx + Math.cos(a) * r, ly + Math.sin(a) * r]); }
  const tail = [[0.36, 0.05], [0.34, 0.3], [0.27, 0.52], [0.13, 0.66], [-0.05, 0.7], [-0.2, 0.64]];
  for (const [x, y] of tail) pts.push([cx + x * s, cy + y * s]);
  return pts;
}

let _stars = null;
function starField() {
  if (_stars) return _stars;
  const rnd = mulberry32(71);
  _stars = Array.from({ length: 320 }, () => [rnd() * W, rnd() * H, 0.4 + rnd() * 1.4, rnd() * 100]);
  return _stars;
}

function glowDot(g, x, y, r, c, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(c, a)); gr.addColorStop(0.3, rgba(c, a * 0.35)); gr.addColorStop(1, rgba(c, 0));
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

export function drawEndCard(g, lt, t, alpha = 1) {
  const gold = [255, 206, 120];
  g.save();
  g.globalAlpha = alpha;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#030208'); bg.addColorStop(0.7, '#0c071a'); bg.addColorStop(1, '#040208');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (const [x, y, r, ph] of starField()) {
    g.fillStyle = rgba([235, 228, 255], 0.35 + 0.35 * Math.sin(t * 1.7 + ph));
    g.fillRect(x, y, r, r);
  }
  const form = easeInOut(clamp(lt / 2.6));
  const glyphs = [W / 2 - 250, W / 2, W / 2 + 250].map(x => ninePoints(x, H * 0.33, 250));
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = rgba(gold, 0.28 * form);
  g.lineWidth = 1.4;
  g.beginPath();
  for (const pts of glyphs) pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  // Stars fly in from the bottom center and settle into the three nines.
  glyphs.forEach((pts, gi) => pts.forEach(([x, y], i) => {
    const sx = W / 2 + (hash(i, gi) * 2 - 1) * 120, sy = H * 0.95 + hash(i, gi + 3) * 60;
    const u = easeInOut(clamp((lt - 0.2 - hash(i, gi + 5) * 0.8) / 1.8));
    const px = lerp(sx, x, u), py = lerp(sy, y, u);
    const tw = 0.7 + 0.3 * Math.sin(t * 3 + i + gi);
    glowDot(g, px, py, 26, gold, 0.6 * tw);
    glowDot(g, px, py, 6, [255, 255, 255], 0.95 * tw);
  }));
  g.globalCompositeOperation = 'source-over';
  const a = sstep(1.6, 2.8, lt);
  g.textAlign = 'center';
  g.font = "700 34px 'Syncopate'";
  g.fillStyle = rgba([240, 232, 255], a);
  spaced(g, 'JUICE WRLD', W / 2, H * 0.68, 16);
  g.font = "400 116px 'New Rocker'";
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(20px)'; g.fillStyle = rgba(gold, 0.45 * a); g.fillText('Until I Die', W / 2, H * 0.8); g.restore();
  g.fillStyle = rgba([255, 244, 225], a);
  g.fillText('Until I Die', W / 2, H * 0.8);
  const b = sstep(2.6, 3.6, lt);
  g.font = "400 18px 'Syncopate'";
  g.fillStyle = rgba([225, 215, 250], 0.95 * b);
  spaced(g, 'LLJW   1998 - 2019', W / 2, H * 0.865, 10);
  g.font = "400 15px 'Share Tech Mono'";
  g.fillStyle = rgba([190, 180, 220], 0.7 * b);
  g.fillText('unofficial fan-made visual', W / 2, H * 0.94);
  g.restore();
}
