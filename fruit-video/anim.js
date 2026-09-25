'use strict';
/* SHIFT HAPPENS -- a fruit soap opera for nurses.
 * Everything is drawn procedurally on a 1080x1920 canvas. renderAt(t) is a pure
 * function of time, so the same code drives live playback and frame capture. */

const W = 1080, H = 1920;
const TL = window.TIMELINE;
const FPS = TL.fps;
const PI = Math.PI, TAU = PI * 2;
const canvas = document.getElementById('c');
const mainCtx = canvas.getContext('2d');
let ctx = mainCtx;
let T = 0, CUR = null, CAM = null, FLIP = false;

// ------------------------------------------------------------------ utils
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const easeBack = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeElastic = t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (TAU / 3)) + 1;
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = lerp(pa >> 16, pb >> 16, t), g = lerp((pa >> 8) & 255, (pb >> 8) & 255, t), bl = lerp(pa & 255, pb & 255, t);
  return `rgb(${r | 0},${g | 0},${bl | 0})`;
}

// ------------------------------------------------------------------ timeline
function sceneAt(t) { for (const s of TL.scenes) if (t < s.start + s.dur) return s; return TL.scenes[TL.scenes.length - 1]; }
const B = id => CUR.beats[id];
function lineAt(t) { for (const l of TL.lines) if (t >= l.s && t < l.e) return l; return null; }
function talk(who) {
  for (const l of TL.lines) {
    if (l.who === who && T >= l.s && T < l.e) {
      const i = Math.min(l.mouth.length - 1, Math.floor((T - l.s) * FPS));
      return (l.mouth.charCodeAt(i) - 48) / 9;
    }
  }
  return 0;
}
const speaking = who => talk(who) > 0 || TL.lines.some(l => l.who === who && T >= l.s && T < l.e);

// ------------------------------------------------------------------ text
function text(str, x, y, o = {}) {
  const { size = 60, font = 'Nunito', weight = 900, fill = '#fff', stroke = '#15111a', lw = 0, align = 'center',
    base = 'middle', alpha = 1, rot = 0, maxW = 0, italic = false, spacing = 0, shadow = 0 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (FLIP) ctx.scale(-1, 1);
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`;
  ctx.textAlign = align; ctx.textBaseline = base;
  if (spacing) ctx.letterSpacing = spacing + 'px';
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = shadow; ctx.shadowOffsetY = shadow / 3; }
  if (lw) {
    ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = stroke;
    if (maxW) ctx.strokeText(str, 0, 0, maxW); else ctx.strokeText(str, 0, 0);
    ctx.shadowColor = 'transparent';
  }
  ctx.fillStyle = fill;
  if (maxW) ctx.fillText(str, 0, 0, maxW); else ctx.fillText(str, 0, 0);
  ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); }

// ------------------------------------------------------------------ characters
const INK = '#1d1a22', LIMB = '#2a2530';
const KINDS = {
  straw:  { rx: 118, ry: 132, shape: 'straw', c: ['#ff8a94', '#e8193a', '#7e0718'], eyeY: -40, eyeX: 37, mouthY: 14, leg: 92, hip: 30, shoe: '#f7f7fb', shoe2: '#ff8fb1' },
  cherry: { rx: 112, ry: 112, shape: 'round', c: ['#ff6f8a', '#c4002f', '#530013'], eyeY: -20, eyeX: 37, mouthY: 32, leg: 92, hip: 36, shoe: '#ffffff', shoe2: '#ff5f7e' },
  lemon:  { rx: 108, ry: 140, shape: 'lemon', c: ['#fff7a8', '#ffd60a', '#b88900'], eyeY: -32, eyeX: 35, mouthY: 30, leg: 90, hip: 34, shoe: '#34313a', shoe2: '#5a5660' },
  blue:   { rx: 118, ry: 110, shape: 'round', c: ['#a5b1ff', '#4152d6', '#161c6e'], eyeY: -16, eyeX: 38, mouthY: 36 },
  cran:   { rx: 100, ry: 98, shape: 'round', c: ['#ff7b98', '#d10f45', '#5e001c'], eyeY: -12, eyeX: 32, mouthY: 32 },
  prune:  { rx: 108, ry: 124, shape: 'prune', c: ['#94679f', '#4e2660', '#1d0926'], eyeY: -22, eyeX: 35, mouthY: 36 },
  gfruit: { rx: 150, ry: 146, shape: 'gfruit', c: ['#ffcdb5', '#ff7359', '#a8331f'], eyeY: -24, eyeX: 48, mouthY: 44, leg: 95, hip: 50, shoe: '#18151c', shoe2: '#3a3640' },
  grape:  { rx: 102, ry: 108, shape: 'round', c: ['#d9adef', '#8e44ad', '#3a1150'], eyeY: -16, eyeX: 33, mouthY: 30 },
  raisin: { rx: 64, ry: 56, shape: 'raisin', c: ['#a0704c', '#5a3219', '#24100a'], eyeY: -10, eyeX: 21, mouthY: 20, er: 13, mw: 14 },
  banana: { rx: 110, ry: 150, shape: 'banana', c: ['#fff39a', '#ffd23f', '#c48c00'], eyeY: -44, eyeX: 26, mouthY: 6, leg: 80, hip: 26, shoe: '#ffe600', shoe2: '#f1c400', er: 19, face: 36 },
  apple:  { rx: 118, ry: 112, shape: 'apple', c: ['#ff8080', '#d62828', '#640a0a'], eyeY: -10, eyeX: 37, mouthY: 38 },
  pine:   { rx: 110, ry: 138, shape: 'pine', c: ['#ffe596', '#f2a400', '#8f5100'], eyeY: -24, eyeX: 35, mouthY: 34, leg: 92, hip: 34, shoe: '#efe2c4', shoe2: '#b08a5a' },
  coco:   { rx: 118, ry: 112, shape: 'coco', c: ['#b88559', '#6f4526', '#2b170b'], eyeY: -14, eyeX: 38, mouthY: 36 },
  pill:   { rx: 64, ry: 90, shape: 'pill', c: ['#ffc36b', '#ff8c00', '#a65400'], eyeY: -4, eyeX: 22, mouthY: 30, leg: 50, hip: 24, shoe: '#ffffff', shoe2: '#dddddd', er: 13, mw: 16, arm1: 38, arm2: 34 },
};
for (const k of Object.values(KINDS)) k.er = k.er || k.rx * .2;

const PATHS = {};
function bodyPath(k) {
  const { rx, ry } = k, p = new Path2D();
  switch (k.shape) {
    case 'straw':
      p.moveTo(0, ry);
      p.bezierCurveTo(-rx * .55, ry * .85, -rx * 1.08, ry * .1, -rx * .98, -ry * .42);
      p.bezierCurveTo(-rx * .9, -ry * .98, rx * .9, -ry * .98, rx * .98, -ry * .42);
      p.bezierCurveTo(rx * 1.08, ry * .1, rx * .55, ry * .85, 0, ry);
      break;
    case 'lemon':
      p.moveTo(0, -ry);
      p.bezierCurveTo(rx * .3, -ry * .98, rx * 1.02, -ry * .66, rx, 0);
      p.bezierCurveTo(rx * 1.02, ry * .66, rx * .3, ry * .98, 0, ry);
      p.bezierCurveTo(-rx * .3, ry * .98, -rx * 1.02, ry * .66, -rx, 0);
      p.bezierCurveTo(-rx * 1.02, -ry * .66, -rx * .3, -ry * .98, 0, -ry);
      break;
    case 'apple':
      p.moveTo(0, -ry * .72);
      p.bezierCurveTo(-rx * .55, -ry * 1.12, -rx * 1.18, -ry * .62, -rx * .98, ry * .2);
      p.bezierCurveTo(-rx * .84, ry * .92, -rx * .3, ry * 1.06, 0, ry * .9);
      p.bezierCurveTo(rx * .3, ry * 1.06, rx * .84, ry * .92, rx * .98, ry * .2);
      p.bezierCurveTo(rx * 1.18, -ry * .62, rx * .55, -ry * 1.12, 0, -ry * .72);
      break;
    case 'raisin':
      for (let i = 0; i <= 48; i++) {
        const a = i / 48 * TAU, r = 1 + .08 * Math.sin(a * 5) + .05 * Math.sin(a * 9 + 1) + .04 * Math.sin(a * 13 + 2);
        const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
        i ? p.lineTo(x, y) : p.moveTo(x, y);
      }
      break;
    case 'banana': {
      const N = 30, pts = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, y = -ry + 2 * ry * u;
        const cx = rx * .5 * Math.sin(PI * u) - rx * .1;
        const th = rx * .78 * Math.pow(Math.sin(PI * u), .5) + 7;
        pts.push([cx, y, th]);
      }
      pts.forEach(([x, y, th], i) => { const X = x + th * .62; i ? p.lineTo(X, y) : p.moveTo(X, y); });
      for (let i = N; i >= 0; i--) { const [x, y, th] = pts[i]; p.lineTo(x - th * .62, y); }
      break;
    }
    case 'pill':
      p.roundRect(-rx, -ry * .7, rx * 2, ry * 1.7, 20);
      break;
    default:
      p.ellipse(0, 0, rx, ry, 0, 0, TAU);
  }
  p.closePath();
  return p;
}

const EXPR = {
  neutral: { ang: 0, raise: 0, curve: .35, lid: 0, wide: 1, pup: 1 },
  happy: { ang: -.12, raise: 8, curve: 1, lid: 0, wide: 1, pup: 1 },
  angry: { ang: .55, raise: -6, curve: -.8, lid: .12, wide: 1, pup: .85 },
  shock: { ang: -.25, raise: 18, curve: 0, lid: 0, wide: 1.22, pup: .5, o: true },
  panic: { ang: -.45, raise: 16, curve: -.6, lid: 0, wide: 1.28, pup: .42, o: true },
  sad: { ang: -.45, raise: 4, curve: -.75, lid: .2, wide: 1, pup: 1 },
  smug: { ang: .3, raise: 0, curve: .6, lid: .45, wide: 1, pup: 1, smirk: true, asym: true },
  sour: { ang: .38, raise: -4, curve: -.55, lid: .42, wide: .95, pup: 1 },
  dead: { ang: 0, raise: -2, curve: 0, lid: .55, wide: 1, pup: .65 },
  chill: { ang: -.05, raise: 2, curve: .8, lid: .42, wide: 1, pup: 1 },
  sleep: { ang: 0, raise: 0, curve: .15, lid: 1, wide: 1, pup: 1 },
  weak: { ang: -.35, raise: 2, curve: -.35, lid: .5, wide: .9, pup: .8 },
  grumpy: { ang: .42, raise: -8, curve: -.85, lid: .25, wide: 1, pup: 1 },
  hopeful: { ang: -.3, raise: 12, curve: .7, lid: 0, wide: 1.1, pup: 1.1 },
};

function poseAngles(p, t) {
  if (Array.isArray(p)) return p;
  switch (p) {
    case 'rest': return [.28 + .05 * Math.sin(t * 2.2), .25];
    case 'down': return [.1, .05];
    case 'hips': return [.85, -2.15];
    case 'up': return [2.55 + .18 * Math.sin(t * 19), .35];
    case 'wave': return [2.3, .55 + .55 * Math.sin(t * 15)];
    case 'hold': return [.7, .95];
    case 'offer': return [1.1, .5];
    case 'point': return [1.5, .05];
    case 'phone': return [1.75, 1.95];
    case 'thumb': return [1.2, 1.6];
    case 'stop': return [1.45, -.15];
    case 'shrug': return [1.25, -1.75];
    case 'flail': return [1.7 + .95 * Math.sin(t * 17), .6 + .5 * Math.sin(t * 13)];
    case 'reach': return [1.9, .3];
    case 'cheer': return [2.8, .2];
    case 'run': return [1.2 + .8 * Math.sin(t * 30), .8];
    default: return [.3, .25];
  }
}

function drawChar(o) {
  const k = KINDS[o.kind], s = o.s || 1, t = o.t ?? T;
  const seed = o.seed ?? (o.kind.charCodeAt(0) * 13 + o.kind.length * 7);
  const legLen = o.noLegs ? 0 : (k.leg || 90);
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.filter) ctx.filter = o.filter;
  if (!o.noShadow && !o.noLegs && !o.center) {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 4, k.rx * s * .85, 15 * s); ctx.fill();
  }
  ctx.scale(s, s);
  const walkBob = o.walk != null ? -Math.abs(Math.sin(o.walk)) * 9 : 0;
  const bob = o.noBob ? 0 : Math.sin(t * 2.6 + seed) * 2.5 + walkBob;
  if (!o.center) ctx.translate(0, -(legLen + k.ry * .9) + bob); else ctx.translate(0, bob);
  if (o.rot) ctx.rotate(o.rot);
  if (o.shake) ctx.translate(o.shake * vnoise(t * 50 + seed), o.shake * vnoise(t * 47 + seed + 9));
  const sq = o.squash || 0;
  ctx.scale((o.flip ? -1 : 1) * (1 + sq * .35) * (o.sx || 1), (1 - sq * .35) * (o.sy || 1));
  FLIP = !!o.flip;
  if (!o.noLegs) drawLegs(o, k, t);
  drawAcc(o, k, t, 'back');
  drawBody(o, k, t);
  drawAcc(o, k, t, 'mid');
  drawFace(o, k, t, seed);
  drawAcc(o, k, t, 'front');
  if (!o.noArms) drawArms(o, k, t);
  FLIP = false;
  ctx.restore();
}

function drawLegs(o, k, t) {
  const hipY = k.shape === 'straw' ? k.ry * .7 : k.shape === 'banana' ? k.ry * .78 : k.ry * .8;
  const hx = k.hip || k.rx * .32, L = k.leg || 90;
  const cx = k.shape === 'banana' ? k.rx * .12 : 0;
  for (const side of [-1, 1]) {
    let a = 0;
    if (o.walk != null) a = Math.sin(o.walk + (side > 0 ? 0 : PI)) * .55;
    if (o.legs === 'kick') a = side * .5 + .35 * Math.sin(t * 22 + side * 2);
    if (o.legs === 'splay') a = side * .55;
    if (o.legs === 'tap' && side > 0) a = .18 * Math.max(0, Math.sin(t * 16));
    const fx = cx + side * hx + Math.sin(a) * L, fy = hipY + Math.cos(a) * L;
    ctx.strokeStyle = LIMB; ctx.lineWidth = 13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + side * hx, hipY - 12); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.fillStyle = k.shoe || '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ell(fx + side * 8 + 6, fy + 3, 27, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = k.shoe2 || '#ddd';
    ctx.beginPath(); ctx.ellipse(fx + side * 8 + 6, fy + 8, 25, 6, 0, 0, PI); ctx.fill();
    if (o.kind === 'straw') { // clog holes
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      for (const dx of [-8, 2, 12]) { ell(fx + side * 8 + dx, fy - 1, 2.5, 2.5); ctx.fill(); }
    }
  }
}

function bodyFill(k, col) {
  const g = ctx.createRadialGradient(-k.rx * .38, -k.ry * .45, k.rx * .06, -k.rx * .12, -k.ry * .12, Math.max(k.rx, k.ry) * 1.3);
  g.addColorStop(0, col[0]); g.addColorStop(.55, col[1]); g.addColorStop(1, col[2]);
  return g;
}

function drawBody(o, k, t) {
  const p = PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k));
  const col = o.colors || k.c;
  drawTop(o, k, t, 'back');
  ctx.fillStyle = bodyFill(k, col); ctx.fill(p);
  ctx.save(); ctx.clip(p);
  drawTexture(o, k, t);
  const R = Math.max(k.rx, k.ry);
  const g2 = ctx.createRadialGradient(-k.rx * .1, -k.ry * .1, R * .65, 0, 0, R * 1.08);
  g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = g2; ctx.fillRect(-k.rx * 1.4, -k.ry * 1.4, k.rx * 2.8, k.ry * 2.8);
  // rim light
  ctx.globalAlpha *= .25; ctx.strokeStyle = '#fff'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.ellipse(k.rx * .06, k.ry * .08, k.rx * .95, k.ry * .95, 0, .1, 1.1); ctx.stroke();
  ctx.restore();
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(25,10,20,.92)'; ctx.stroke(p);
  if (k.shape !== 'banana' && k.shape !== 'pill') {
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.5)';
    ell(-k.rx * .45, -k.ry * .5, k.rx * .19, k.ry * .09, -.6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-k.rx * .66, -k.ry * .24, k.rx * .05, k.ry * .05); ctx.fill();
    ctx.restore();
  }
  drawTop(o, k, t, 'front');
}

function srand(i) { return hash(i * 3.17 + 1.3); }

function drawTexture(o, k, t) {
  const { rx, ry } = k;
  switch (k.shape) {
    case 'straw':
      for (let row = 0; row < 10; row++) {
        const y = -ry * .8 + row * 29;
        for (let i = -5; i <= 5; i++) {
          const x = i * 29 + (row % 2 ? 14 : 0);
          if (Math.hypot(x / (rx * .62), (y - (k.eyeY + 22)) / (ry * .44)) < 1) continue;
          ctx.fillStyle = '#ffe58a'; ctx.strokeStyle = 'rgba(120,70,0,.6)'; ctx.lineWidth = 1.5;
          ell(x, y, 4, 6.5); ctx.fill(); ctx.stroke();
        }
      }
      break;
    case 'prune': case 'raisin': {
      ctx.strokeStyle = 'rgba(10,0,10,.45)'; ctx.lineWidth = k.shape === 'raisin' ? 3 : 4; ctx.lineCap = 'round';
      const n = k.shape === 'raisin' ? 9 : 7;
      for (let i = 0; i < n; i++) {
        const a = srand(i + 10) * TAU, r = .45 + srand(i + 20) * .4;
        const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
        if (Math.abs(x) < rx * .5 && y > k.eyeY - k.er * 2 && y < k.mouthY + 12) continue;
        ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.quadraticCurveTo(x, y - 14 + srand(i) * 10, x + 22, y + 4); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) { const y = -ry * .7 + i * ry * .33; ctx.beginPath(); ctx.moveTo(-rx, y); ctx.quadraticCurveTo(0, y + 18, rx, y - 6); ctx.stroke(); }
      break;
    }
    case 'pine':
      ctx.strokeStyle = 'rgba(120,60,0,.55)'; ctx.lineWidth = 3;
      for (let i = -8; i <= 8; i++) {
        ctx.beginPath(); ctx.moveTo(i * 34 - ry, -ry); ctx.lineTo(i * 34 + ry, ry); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i * 34 + ry, -ry); ctx.lineTo(i * 34 - ry, ry); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(110,55,0,.5)';
      for (let i = -8; i <= 8; i++) for (let j = -6; j <= 6; j++) { const x = i * 34 + (j % 2 ? 17 : 0), y = j * 17 * 2; ell(x, y + 17, 3, 3); ctx.fill(); }
      // soften the face area
      { const g = ctx.createRadialGradient(0, k.eyeY + 25, 10, 0, k.eyeY + 25, rx * .75); g.addColorStop(0, 'rgba(255,215,110,.85)'); g.addColorStop(1, 'rgba(255,215,110,0)'); ctx.fillStyle = g; ctx.fillRect(-rx, -ry, rx * 2, ry * 2); }
      break;
    case 'coco':
      ctx.lineCap = 'round';
      for (let i = 0; i < 140; i++) {
        const x = (srand(i) * 2 - 1) * rx, y = (srand(i + 500) * 2 - 1) * ry;
        if (Math.hypot(x / (rx * .6), (y - k.eyeY - 25) / (ry * .45)) < 1) continue;
        ctx.strokeStyle = i % 3 ? 'rgba(40,20,5,.45)' : 'rgba(230,190,140,.35)'; ctx.lineWidth = 2.5;
        const a = srand(i + 900) * PI;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); ctx.stroke();
      }
      break;
    case 'gfruit': case 'lemon':
      ctx.fillStyle = k.shape === 'gfruit' ? 'rgba(150,40,20,.16)' : 'rgba(150,110,0,.18)';
      for (let i = 0; i < 90; i++) { ell((srand(i) * 2 - 1) * rx, (srand(i + 99) * 2 - 1) * ry, 2.6, 2.6); ctx.fill(); }
      break;
    case 'banana':
      ctx.strokeStyle = 'rgba(150,100,0,.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-rx * .02, -ry * .9); ctx.quadraticCurveTo(rx * .75, 0, -rx * .02, ry * .9); ctx.stroke();
      ctx.fillStyle = 'rgba(90,50,0,.55)';
      for (let i = 0; i < 16; i++) { ell(-rx * .2 + srand(i) * rx * .9, -ry * .8 + srand(i + 7) * ry * 1.6, 3 + srand(i + 3) * 4, 2.5); ctx.fill(); }
      break;
    case 'pill': {
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-rx * .8, -ry * .7, rx * .25, ry * 1.7);
      ctx.fillStyle = '#fdfaf2'; ctx.fillRect(-rx, -ry * .38, rx * 2, ry * 1.05);
      ctx.fillStyle = '#e53946'; ctx.fillRect(-rx, ry * .5, rx * 2, 8);
      text(o.label || 'Rx', 0, ry * .58, { size: 13, weight: 900, fill: INK });
      break;
    }
  }
}

function leaf(x, y, ang, len, w, fill, stroke = '#143d12') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w, -len * .5, 0, -len); ctx.quadraticCurveTo(-w, -len * .5, 0, 0);
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}

function drawTop(o, k, t, layer) {
  const { rx, ry } = k;
  switch (k.shape) {
    case 'straw':
      if (layer === 'front') {
        const gy = -ry * .86;
        const g = ctx.createLinearGradient(0, gy - 50, 0, gy + 20); g.addColorStop(0, '#7ddc5a'); g.addColorStop(1, '#2f8f2a');
        for (let i = 0; i < 7; i++) { const a = -1.35 + i * .45; leaf(Math.sin(a) * 18, gy + 6, a * 1.05 + (a > 0 ? .5 : -.5), 62, 17, g); }
        ctx.fillStyle = '#3a8d2c'; rr(-6, gy - 34, 12, 30, 5); ctx.fill();
        if (o.cap !== false) {
          ctx.save(); ctx.translate(0, gy - 38); ctx.rotate(-.06);
          ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(-62, 12); ctx.lineTo(-48, -34); ctx.quadraticCurveTo(0, -46, 48, -34); ctx.lineTo(62, 12); ctx.quadraticCurveTo(0, 22, -62, 12); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffd5de'; ctx.fillRect(-58, 0, 116, 8);
          ctx.fillStyle = '#e8193a'; ctx.fillRect(-6, -30, 12, 28); ctx.fillRect(-14, -22, 28, 12);
          ctx.restore();
        }
      }
      break;
    case 'round':
      if (layer !== 'front') break;
      if (o.kind === 'cherry') {
        ctx.strokeStyle = '#3d6b1f'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -ry * .9); ctx.quadraticCurveTo(10, -ry * 1.45, 45, -ry * 1.7); ctx.stroke();
        leaf(45, -ry * 1.7, 1.1, 60, 18, '#5cbf3a');
      } else if (o.kind === 'blue' || o.kind === 'cran') {
        ctx.fillStyle = o.kind === 'blue' ? '#1b1f5c' : '#4a1020';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 9 : 24; ctx.lineTo(Math.cos(a) * r, -ry * .88 + Math.sin(a) * r * .6); }
        ctx.fill();
      } else if (o.kind === 'grape') {
        ctx.fillStyle = '#6b4a2a'; rr(-5, -ry - 18, 10, 26, 4); ctx.fill();
      }
      break;
    case 'apple':
      if (layer !== 'front') break;
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -ry * .7); ctx.quadraticCurveTo(4, -ry * 1.0, -6, -ry * 1.15); ctx.stroke();
      leaf(0, -ry * 1.0, .9, 58, 18, '#58b83a');
      break;
    case 'prune':
      if (layer === 'front') { ctx.fillStyle = '#4a3320'; rr(-4, -ry - 14, 8, 20, 3); ctx.fill(); }
      break;
    case 'banana':
      if (layer === 'front') {
        ctx.fillStyle = '#5c4122'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
        rr(-rx * .1 - 7, -ry - 16, 14, 26, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#3b2a18'; ell(-rx * .1, ry - 2, 7, 6); ctx.fill();
      }
      break;
    case 'lemon':
      if (layer === 'front') { ctx.fillStyle = '#5a8a2a'; ell(0, -ry - 2, 8, 6); ctx.fill(); }
      break;
    case 'pill':
      if (layer === 'front') {
        ctx.fillStyle = '#fbfbfb'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
        rr(-rx - 6, -ry * .7 - 34, rx * 2 + 12, 40, 8); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
        for (let x = -rx; x <= rx; x += 12) { ctx.beginPath(); ctx.moveTo(x, -ry * .7 - 28); ctx.lineTo(x, -ry * .7); ctx.stroke(); }
      }
      break;
    case 'pine':
      drawPineCrown(o, k, t, layer);
      break;
  }
}

function strand(bx, by, cx, cy, ex, ey, w, fill, stroke = '#1e5a1c') {
  const N = 14, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = 1 - u;
    const x = a * a * bx + 2 * a * u * cx + u * u * ex, y = a * a * by + 2 * a * u * cy + u * u * ey;
    const dx = 2 * a * (cx - bx) + 2 * u * (ex - cx), dy = 2 * a * (cy - by) + 2 * u * (ey - cy);
    const len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, ww = w * (1 - u * .92) / 2;
    L.push([x + nx * ww, y + ny * ww]); R.push([x - nx * ww, y - ny * ww]);
  }
  ctx.beginPath(); L.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke();
}

function drawPineCrown(o, k, t, layer) {
  // Pineapple leaves styled as the asymmetric "can I speak to your manager" bob
  const sw = Math.sin(t * 3) * 3;
  const g1 = '#2f8f34', g2 = '#46b04a', hi = '#ffe26b';
  if (layer === 'back') {
    [[-50, -120, -85, -175, -125, -222, 26], [-28, -128, -48, -195, -72, -258, 26], [-66, -108, -112, -140, -158, -165, 22], [-8, -130, -18, -200, -30, -262, 22]]
      .forEach(([a, b, c, d, e, f, w], i) => strand(a, b, c + sw, d, e + sw, f, w, i % 2 ? g1 : g2));
    return;
  }
  [[-40, -126, -10, -275, 132, -130, 46], [-12, -130, 48, -262, 150, -64, 46], [18, -128, 102, -228, 152, 8, 42], [48, -122, 136, -170, 140, 64, 34]]
    .forEach(([a, b, c, d, e, f, w], i) => strand(a, b, c + sw, d, e + sw * .5, f, w, i % 2 ? g2 : g1));
  [[-20, -130, 30, -262, 146, -90, 12], [30, -126, 118, -214, 150, 30, 10]].forEach(([a, b, c, d, e, f, w]) => strand(a, b, c + sw, d, e, f, w, hi, '#b89400'));
  strand(-98, -92, -20, -182, 118, -100, 34, g2);
  strand(-80, -100, -10, -170, 100, -108, 10, hi, '#b89400');
}

function drawFace(o, k, t, seed) {
  if (o.noFace) return;
  const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {});
  const er = k.er * E.wide * (o.eyeScale || 1), ex = k.eyeX, ey = k.eyeY;
  const blink = ((t + seed * .37) % 4.3) < .12 && E.lid < 1;
  const look = o.look || [0, 0];
  const faceX = k.shape === 'banana' ? k.face : 0;
  ctx.save(); ctx.translate(faceX, 0);
  ctx.fillStyle = 'rgba(255,110,150,.33)';
  for (const side of [-1, 1]) { ell(side * (ex + er * .55), ey + er * 1.55, er * .75, er * .42); ctx.fill(); }
  for (const side of [-1, 1]) {
    const x = side * ex, y = ey;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
    ell(x, y, er, er * 1.15); ctx.fill(); ctx.stroke();
    ctx.save(); ell(x, y, er, er * 1.15); ctx.clip();
    const px = x + look[0] * er * .42, py = y + look[1] * er * .45;
    ctx.fillStyle = INK; ell(px, py, er * .54 * E.pup, er * .54 * E.pup); ctx.fill();
    ctx.fillStyle = '#fff'; ell(px - er * .18, py - er * .22, er * .17, er * .17); ctx.fill();
    let lid = blink ? 1 : E.lid;
    if (o.twitch && side === 1) lid = Math.max(lid, .35 + .6 * Math.abs(Math.sin(t * 38)));
    if (o.lid != null) lid = o.lid;
    if (lid > 0) {
      const ly = y - er * 1.15 + er * 2.3 * lid;
      ctx.fillStyle = (o.colors || k.c)[1]; ctx.fillRect(x - er - 3, y - er * 1.3, er * 2 + 6, ly - (y - er * 1.3));
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - er, ly); ctx.lineTo(x + er, ly); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ell(x, y, er, er * 1.15); ctx.stroke();
    // brow
    const ang = E.asym ? (side < 0 ? E.ang : -.3) : E.ang;
    ctx.save(); ctx.translate(x, y - er * 1.42 - E.raise - (o.browUp || 0)); ctx.rotate(side < 0 ? ang : -ang);
    ctx.strokeStyle = o.browColor || INK; ctx.lineWidth = o.browW || 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-er * .9, 0); ctx.lineTo(er * .9, 0); ctx.stroke(); ctx.restore();
  }
  drawMouth(o, k, E);
  ctx.restore();
}

function drawMouth(o, k, E) {
  const tk = clamp(o.talk || 0), w = k.mw || 26;
  ctx.save(); ctx.translate(0, k.mouthY);
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const open = Math.max(tk, o.mouthOpen || 0);
  const sc = w / 26;
  if (open > .04) {
    const h = (8 + 46 * open) * sc, ww = (w * .95 + 8 * open * sc);
    ctx.beginPath();
    let tongueY, topY;
    if (E.curve >= .3) { ctx.moveTo(-ww, 0); ctx.quadraticCurveTo(0, 5, ww, 0); ctx.ellipse(0, 0, ww, h, 0, 0, PI); tongueY = h * .8; topY = 0; }
    else if (E.curve <= -.3) { ctx.moveTo(ww, h * .7); ctx.ellipse(0, h * .7, ww, h * .95, 0, 0, PI, true); ctx.quadraticCurveTo(0, h * .55, ww, h * .7); tongueY = h * .62; topY = -h * .25; }
    else { ctx.ellipse(0, h * .45, ww * .82, h * .6, 0, 0, TAU); tongueY = h * .9; topY = -h * .15; }
    ctx.closePath();
    ctx.fillStyle = '#4a0716'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(-ww, topY - 4, ww * 2, 4 + Math.min(11 * sc, h * .28));
    ctx.fillStyle = '#ff6f86'; ell(0, tongueY, ww * .6, h * .32); ctx.fill();
    ctx.restore();
    ctx.stroke();
  } else if (E.o) {
    ctx.fillStyle = '#4a0716'; ell(0, 6 * sc, 12 * sc, 17 * sc); ctx.fill(); ctx.stroke();
  } else if (E.smirk) {
    ctx.beginPath(); ctx.moveTo(-w * .8, 2); ctx.quadraticCurveTo(w * .2, 12, w, -10); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, E.curve * 30 * sc, w, 0); ctx.stroke();
  }
  ctx.restore();
}

function shoulder(k, side) {
  switch (k.shape) {
    case 'straw': return [side * k.rx * .88, -k.ry * .1];
    case 'banana': return [k.rx * .1 + side * k.rx * .5, 8];
    case 'pill': return [side * k.rx * .98, 12];
    case 'lemon': case 'pine': return [side * k.rx * .95, k.ry * .05];
    default: return [side * k.rx * .92, k.ry * .1];
  }
}

function drawArms(o, k, t) {
  const arms = o.arms || {};
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'l' : 'r';
    const pose = arms[key] || 'rest';
    if (pose === 'none') continue;
    const [a1, a2] = poseAngles(pose, t + (side > 0 ? .5 : 0));
    const [sx, sy] = shoulder(k, side);
    const L1 = k.arm1 || 56, L2 = k.arm2 || 52;
    const ex = sx + side * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
    const hx = ex + side * Math.sin(a1 + a2) * L2, hy = ey + Math.cos(a1 + a2) * L2;
    ctx.strokeStyle = LIMB; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    const prop = o.hold && o.hold[key];
    if (prop) drawProp(prop, hx, hy, side, o, t);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
    ell(hx, hy, 15, 15); ctx.fill(); ctx.stroke();
    if (pose === 'thumb') { rr(hx - 5, hy - 34, 11, 26, 6); ctx.fill(); ctx.stroke(); }
    if (pose === 'point') { rr(hx + (side > 0 ? 6 : -34), hy - 5, 28, 10, 5); ctx.fill(); ctx.stroke(); }
    if (pose === 'stop') { rr(hx - 12, hy - 30, 24, 30, 8); ctx.fill(); ctx.stroke(); }
  }
}

// ------------------------------------------------------------------ props
function drawProp(name, x, y, side, o, t) {
  ctx.save(); ctx.translate(x, y);
  switch (name) {
    case 'clipboard':
      ctx.rotate(side * -.08);
      ctx.fillStyle = '#b8864a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-44, -30, 88, 116, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-36, -18, 72, 96);
      ctx.fillStyle = '#9aa0a6'; rr(-20, -38, 40, 18, 5); ctx.fill();
      ctx.strokeStyle = '#8fa7c9'; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-28, -2 + i * 13); ctx.lineTo(24 - (i % 3) * 10, -2 + i * 13); ctx.stroke(); }
      if (o.clipText) text(o.clipText, 0, 8, { size: 17, fill: '#e8193a', weight: 900 });
      break;
    case 'purse':
      ctx.strokeStyle = '#7a2a4a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(0, -30, 20, 0); ctx.stroke();
      ctx.fillStyle = '#ff7eb6'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-40, 8); ctx.lineTo(40, 8); ctx.lineTo(48, 62); ctx.lineTo(-48, 62); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd24a'; rr(-8, 16, 16, 10, 3); ctx.fill();
      break;
    case 'cup':
      ctx.fillStyle = '#f4f7fb'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-22, -52); ctx.lineTo(22, -52); ctx.lineTo(17, 16); ctx.lineTo(-17, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6ec3ff'; ctx.fillRect(-20, -40, 40, 5);
      ctx.fillStyle = '#3a86d8'; rr(-25, -60, 50, 10, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ff5a8a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(6, -60); ctx.lineTo(10, -88); ctx.lineTo(24, -96); ctx.stroke();
      break;
    case 'carton':
      ctx.rotate(side * -.05);
      ctx.fillStyle = '#6a2c8a'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-42, -118); ctx.lineTo(0, -148); ctx.lineTo(42, -118); ctx.lineTo(42, 18); ctx.lineTo(-42, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; rr(-36, -110, 72, 118, 6); ctx.fill();
      text('PRUNE', 0, -96, { size: 17, fill: '#6a2c8a' });
      text('JUICE', 0, -78, { size: 17, fill: '#6a2c8a' });
      ctx.fillStyle = '#5a2a6a'; ell(0, -44, 20, 23); ctx.fill();
      ctx.fillStyle = '#fff'; ell(-7, -48, 5, 6); ctx.fill(); ell(7, -48, 5, 6); ctx.fill();
      ctx.fillStyle = INK; ell(-7, -47, 2.5, 3); ctx.fill(); ell(7, -47, 2.5, 3); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, -40, 7, .3, PI - .3); ctx.stroke();
      text('100% GARY', 0, -6, { size: 14, fill: '#e8193a' });
      break;
    case 'urine':
      ctx.fillStyle = 'rgba(230,240,255,.85)'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      rr(-26, -64, 52, 70, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(-23, -30, 46, 33);
      ctx.fillStyle = '#ff9f1c'; rr(-30, -76, 60, 16, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-20, -54, 40, 16);
      text('U/A', 0, -46, { size: 13, fill: INK });
      break;
    case 'handset':
      ctx.rotate(side * .45);
      ctx.fillStyle = '#e9e1d0'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      rr(-14, -70, 28, 110, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#cfc6b3'; ell(0, -64, 20, 14); ctx.fill(); ctx.stroke(); ell(0, 36, 20, 14); ctx.fill(); ctx.stroke();
      break;
    case 'cell':
      ctx.rotate(side * .3);
      ctx.fillStyle = '#1b1b22'; ctx.strokeStyle = '#555'; ctx.lineWidth = 3; rr(-22, -60, 44, 84, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7fd3ff'; rr(-17, -52, 34, 66, 6); ctx.fill();
      break;
    case 'sticky':
      ctx.rotate(-.08);
      ctx.fillStyle = '#fff176'; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8;
      ctx.fillRect(-70, -150, 140, 140); ctx.shadowColor = 'transparent'; ctx.strokeRect(-70, -150, 140, 140);
      text('MEDS:', 0, -122, { size: 22, fill: '#2a3b8f', weight: 900 });
      text('"the little', 0, -90, { size: 20, fill: '#2a3b8f', weight: 800, italic: true });
      text('white one"', 0, -64, { size: 20, fill: '#2a3b8f', weight: 800, italic: true });
      text('+ vibes', 0, -34, { size: 18, fill: '#e8193a', weight: 900 });
      break;
    case 'medcup':
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-16, -28); ctx.lineTo(16, -28); ctx.lineTo(12, 4); ctx.lineTo(-12, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ['#ff5a5a', '#fff', '#5ab0ff'].forEach((c, i) => { ctx.fillStyle = c; ell(-7 + i * 7, -6, 4, 3); ctx.fill(); });
      break;
  }
  ctx.restore();
}

function drawAcc(o, k, t, layer) {
  const acc = o.acc || [];
  if (!acc.length) return;
  const ex = k.eyeX, ey = k.eyeY, er = k.er;
  const fx = k.shape === 'banana' ? k.face : 0;
  for (const a of acc) {
    ctx.save(); ctx.translate(fx, 0);
    switch (a + ':' + layer) {
      case 'glasses:front': case 'readers:front': {
        const dy = a === 'readers' ? er * .7 : 0;
        ctx.strokeStyle = a === 'readers' ? '#7a3d1a' : '#2a2a35'; ctx.lineWidth = 5; ctx.fillStyle = 'rgba(200,230,255,.18)';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(s * ex - er * 1.25, ey - er * 1.1 + dy, er * 2.5, er * (a === 'readers' ? 1.35 : 2.2), 12); ctx.fill(); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-ex + er * 1.25, ey - er * .3 + dy); ctx.lineTo(ex - er * 1.25, ey - er * .3 + dy); ctx.stroke();
        break;
      }
      case 'sunglasses:front': case 'sunglassesHead:front': {
        const y = a === 'sunglassesHead' ? -k.ry * .72 : ey;
        ctx.fillStyle = '#121218'; ctx.strokeStyle = '#121218'; ctx.lineWidth = 6;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(s * ex - er * 1.3, y - er * .8, er * 2.6, er * 1.7, [6, 6, 20, 20]); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(-ex + er, y - er * .5); ctx.lineTo(ex - er, y - er * .5); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * ex - er * .9, y - er * .5); ctx.lineTo(s * ex - er * .3, y - er * .5); ctx.lineTo(s * ex - er * .8, y + er * .4); ctx.fill(); }
        break;
      }
      case 'mustache:front': {
        ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = '#9a9a9a'; ctx.lineWidth = 3;
        const my = k.mouthY - 8;
        ctx.beginPath(); ctx.moveTo(0, my - 6);
        ctx.bezierCurveTo(-20, my - 22, -52, my - 6, -62, my + 10); ctx.bezierCurveTo(-40, my + 4, -18, my + 8, 0, my + 2);
        ctx.bezierCurveTo(18, my + 8, 40, my + 4, 62, my + 10); ctx.bezierCurveTo(52, my - 6, 20, my - 22, 0, my - 6);
        ctx.fill(); ctx.stroke();
        break;
      }
      case 'cannula:front': {
        ctx.strokeStyle = 'rgba(210,235,255,.95)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        const cy = k.mouthY - 16;
        ctx.beginPath(); ctx.moveTo(-k.rx * 1.0, cy + 30); ctx.quadraticCurveTo(-k.rx * .6, cy - 4, 0, cy - 2); ctx.quadraticCurveTo(k.rx * .6, cy - 4, k.rx * 1.0, cy + 30); ctx.stroke();
        ctx.strokeStyle = 'rgba(120,160,190,.8)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#dff0ff'; ell(-7, cy - 6, 4, 6); ctx.fill(); ell(7, cy - 6, 4, 6); ctx.fill();
        break;
      }
      case 'whitebrows:front':
        break;
      case 'curlers:back': {
        const cols = ['#ff8fc7', '#8fd3ff', '#fff07a', '#b7ff8f'];
        for (let i = 0; i < 5; i++) { const x = -60 + i * 30, y = -k.ry * .9 - 8 + Math.abs(i - 2) * 9; ctx.fillStyle = cols[i % 4]; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x - 14, y - 22, 28, 34, 10); ctx.fill(); ctx.stroke(); }
        break;
      }
      case 'pearls:front': {
        ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.5;
        for (let i = 0; i <= 12; i++) { const a = PI * .15 + i / 12 * PI * .7; const x = Math.cos(a) * k.rx * .72, y = k.ry * .25 + Math.sin(a) * k.ry * .42; ell(x, y, 7, 7); ctx.fill(); ctx.stroke(); }
        break;
      }
      case 'bun:back': {
        ctx.fillStyle = '#e6e3ea'; ctx.strokeStyle = '#8a8594'; ctx.lineWidth = 3;
        const s = k.rx / 100;
        ell(0, -k.ry * 1.02, 46 * s, 38 * s); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -k.ry * 1.04, 22 * s, 0, TAU * .8); ctx.stroke();
        ctx.fillStyle = '#ff8fc7'; ell(34 * s, -k.ry * .92, 9 * s, 6 * s); ctx.fill();
        break;
      }
      case 'chain:front': {
        ctx.strokeStyle = '#ffcf33'; ctx.lineWidth = 7; ctx.setLineDash([9, 5]);
        ctx.beginPath(); ctx.arc(0, k.ry * .05, k.rx * .78, PI * .2, PI * .8); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ffcf33'; ctx.strokeStyle = '#a07800'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, k.ry * .05 + k.rx * .78 + 12, 18, 0, TAU); ctx.fill(); ctx.stroke();
        text('$', 0, k.ry * .05 + k.rx * .78 + 13, { size: 22, fill: '#a07800' });
        break;
      }
      case 'toothpick:front':
        ctx.strokeStyle = '#e8c890'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(22, k.mouthY + 2); ctx.lineTo(62, k.mouthY - 12); ctx.stroke();
        break;
      case 'lei:front': {
        const cols = ['#ff5fa2', '#ffd84a', '#ff8a3d', '#b86bff'];
        for (let i = 0; i <= 9; i++) { const a = PI * .12 + i / 9 * PI * .76; const x = Math.cos(a) * k.rx * .85, y = k.ry * .3 + Math.sin(a) * k.ry * .5; ctx.fillStyle = cols[i % 4]; for (let p = 0; p < 5; p++) { ell(x + Math.cos(p * 1.26) * 8, y + Math.sin(p * 1.26) * 8, 7, 7); ctx.fill(); } ctx.fillStyle = '#fff'; ell(x, y, 4, 4); ctx.fill(); }
        break;
      }
      case 'steth:front': {
        ctx.strokeStyle = '#2f3a4a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-k.rx * .86, -k.ry * .08); ctx.quadraticCurveTo(-k.rx * .62, k.ry * .5, -k.rx * .06, k.ry * .55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(k.rx * .86, -k.ry * .08); ctx.quadraticCurveTo(k.rx * .62, k.ry * .5, k.rx * .06, k.ry * .55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, k.ry * .56); ctx.quadraticCurveTo(-4, k.ry * .68, 14, k.ry * .74); ctx.stroke();
        ctx.fillStyle = '#c9d2dc'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(18, k.ry * .77, 13, 13); ctx.fill(); ctx.stroke();
        break;
      }
      case 'badge:front': {
        ctx.save(); ctx.translate(k.rx * .56, k.ry * .1); ctx.rotate(.08);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-22, -14, 44, 56, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8193a'; ctx.fillRect(-16, -8, 32, 22);
        text('NURSE', 0, 28, { size: 10, fill: INK });
        ctx.restore();
        break;
      }
      case 'lanyard:front': {
        ctx.strokeStyle = '#2a6fdb'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-k.rx * .62, k.ry * .08); ctx.quadraticCurveTo(-k.rx * .2, k.ry * .52, 0, k.ry * .56); ctx.quadraticCurveTo(k.rx * .2, k.ry * .52, k.rx * .62, k.ry * .08); ctx.stroke();
        ctx.strokeStyle = '#c0c6cf'; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(0, k.ry * .58); ctx.rotate(-.5 + i * .33 + Math.sin(t * 3) * .1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 28); ctx.stroke(); ctx.fillStyle = '#d7dde5'; rr(-6, 22, 12, 16, 3); ctx.fill(); ctx.restore(); }
        break;
      }
      case 'bag:front': {
        ctx.strokeStyle = '#3a2a5a'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(k.rx * .82, -k.ry * .3); ctx.quadraticCurveTo(k.rx * 1.05, k.ry * .1, k.rx * .95, k.ry * .3); ctx.stroke();
        ctx.fillStyle = '#6b5bd6'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(k.rx * .62, k.ry * .25, 90, 80, 10); ctx.fill(); ctx.stroke();
        text('RN', k.rx * .62 + 45, k.ry * .25 + 42, { size: 20, fill: '#fff' });
        break;
      }
      case 'mask:front': {
        const y = o.maskUp ? -k.ry * .7 : ey;
        ctx.fillStyle = '#ff9ec7'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
        rr(-ex - er * 1.6, y - er * 1.1, (ex + er * 1.6) * 2, er * 2.2, 22); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#7a2a4a'; ctx.lineWidth = 4;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * ex, y - 2, er * .6, .2, PI - .2); ctx.stroke(); }
        break;
      }
      case 'headmirror:front': {
        ctx.strokeStyle = '#333'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-k.rx * .95, -k.ry * .55); ctx.quadraticCurveTo(0, -k.ry * .75, k.rx * .95, -k.ry * .55); ctx.stroke();
        ctx.fillStyle = '#dfe7ef'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ell(0, -k.ry * .62, 28, 28); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ell(-6, -k.ry * .66, 8, 8); ctx.fill();
        break;
      }
      case 'wristband:front':
        break;
      case 'redface:front': {
        ctx.fillStyle = `rgba(255,0,0,${o.red || .3})`; ctx.fill(PATHS[o.kind]);
        break;
      }
    }
    ctx.restore();
  }
}

// ------------------------------------------------------------------ background cache
const CACHE = {};
const PAD = 90, CS = 1.25;
function cached(key, draw) {
  let c = CACHE[key];
  if (!c) {
    c = document.createElement('canvas');
    c.width = (W + PAD * 2) * CS; c.height = (H + PAD * 2) * CS;
    const g = c.getContext('2d');
    g.scale(CS, CS); g.translate(PAD, PAD);
    const prev = ctx; ctx = g; draw(); ctx = prev;
    CACHE[key] = c;
  }
  ctx.drawImage(c, -PAD, -PAD, W + PAD * 2, H + PAD * 2);
}

function floorPaint(y0, c1, c2) {
  const g = ctx.createLinearGradient(0, y0, 0, H + PAD); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(-PAD, y0, W + PAD * 2, H - y0 + PAD);
  ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const y = y0 + Math.pow(i / 11, 1.6) * (H - y0 + PAD); ctx.beginPath(); ctx.moveTo(-PAD, y); ctx.lineTo(W + PAD, y); ctx.stroke(); }
  for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(540 + i * 90, y0); ctx.lineTo(540 + i * 260, H + PAD); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,.07)';
  for (let i = 0; i < 400; i++) { ell(srand(i) * (W + PAD * 2) - PAD, y0 + srand(i + 77) * (H - y0 + PAD), 2 + srand(i + 5) * 3, 1.5); ctx.fill(); }
  const g2 = ctx.createLinearGradient(0, y0, 0, y0 + 220); g2.addColorStop(0, 'rgba(255,255,255,.25)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g2; ctx.fillRect(-PAD, y0, W + PAD * 2, 220);
}

function ceiling(col = '#eef2ee') {
  ctx.fillStyle = col; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 150 + PAD);
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(-PAD, 148, W + PAD * 2, 6);
  for (const x of [180, 540, 900]) {
    const g = ctx.createRadialGradient(x, 150, 10, x, 150, 260); g.addColorStop(0, 'rgba(255,255,240,.55)'); g.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 280, 150, 560, 300);
    ctx.fillStyle = '#fffff4'; ctx.strokeStyle = '#c9cfc9'; ctx.lineWidth = 4; rr(x - 130, 60, 260, 56, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 130 + i * 65, 62); ctx.lineTo(x - 130 + i * 65, 114); ctx.stroke(); }
  }
}

function paper(x, y, w, h, rot, col, lines) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#e8193a'; ell(0, -h / 2 + 8, 6, 6); ctx.fill();
  lines.forEach(([s, size, c, dy]) => text(s, 0, -h / 2 + dy, { size, fill: c || INK, maxW: w - 16 }));
  ctx.restore();
}

// ---- nurses' station
function bgStation() {
  cached('station', () => {
    const g = ctx.createLinearGradient(0, 150, 0, 1300); g.addColorStop(0, '#c7e6db'); g.addColorStop(1, '#9fcfbf');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ceiling();
    ctx.fillStyle = '#86b8a8'; ctx.fillRect(-PAD, 1000, W + PAD * 2, 300);
    ctx.fillStyle = '#c89f6d'; ctx.fillRect(-PAD, 988, W + PAD * 2, 22);
    floorPaint(1290, '#ddd5c4', '#b9af9b');
    // bulletin board
    ctx.fillStyle = '#8a5a2b'; rr(50, 300, 380, 330, 10); ctx.fill();
    ctx.fillStyle = '#d4a26a'; ctx.fillRect(64, 314, 352, 302);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 200; i++) { ell(64 + srand(i) * 352, 314 + srand(i + 3) * 302, 2, 2); ctx.fill(); }
    paper(160, 420, 170, 170, -.05, '#fff', [['EMPLOYEE', 20, INK, 30], ['OF THE MONTH', 17, INK, 52]]);
    ctx.save(); ctx.translate(160, 420); ctx.rotate(-.05); ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 5; ctx.strokeRect(-45, -10, 90, 80); text('?', 0, 30, { size: 50, fill: '#bbb' }); text('(position open)', 0, 78, { size: 13, fill: '#888', italic: true }); ctx.restore();
    paper(330, 400, 150, 120, .06, '#fff27a', [['FALL', 26, '#c0392b', 36], ['PREVENTION', 18, '#c0392b', 62], ['MONTH', 18, '#c0392b', 86]]);
    paper(320, 545, 160, 110, -.04, '#ffd1e3', [['PIZZA PARTY', 20, INK, 34], ['FRIDAY!', 18, INK, 60]]);
    ctx.save(); ctx.translate(320, 560); ctx.rotate(-.25); ctx.strokeStyle = '#d62828'; ctx.lineWidth = 4; ctx.strokeRect(-72, -20, 144, 40); text('CANCELLED', 0, 1, { size: 26, fill: '#d62828' }); ctx.restore();
    // call light panel frame
    ctx.fillStyle = '#39414d'; rr(620, 290, 410, 330, 16); ctx.fill();
    ctx.fillStyle = '#262c35'; rr(636, 306, 378, 298, 10); ctx.fill();
    text('CALL LIGHTS', 825, 328, { size: 22, fill: '#9fb3c8' });
    // clock frame
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 10; ell(525, 250, 72, 72); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = INK; ell(525 + Math.sin(a) * 56, 250 - Math.cos(a) * 56, 4, 4); ctx.fill(); }
    // counter
    ctx.fillStyle = '#6f9d8f'; ctx.fillRect(-PAD, 1090, W + PAD * 2, 210);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < W; x += 180) ctx.fillRect(x, 1100, 6, 190);
    ctx.fillStyle = '#efe5d1'; ctx.fillRect(-PAD, 1060, W + PAD * 2, 34);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-PAD, 1094, W + PAD * 2, 8);
    // monitor
    ctx.fillStyle = '#222'; rr(700, 880, 250, 160, 10); ctx.fill();
    ctx.fillStyle = '#1b5fa8'; ctx.fillRect(712, 892, 226, 136);
    ctx.fillStyle = '#fff'; ctx.fillRect(724, 904, 120, 10); ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 6; i++) ctx.fillRect(724, 924 + i * 15, 190 - (i % 3) * 40, 7);
    ctx.fillStyle = '#333'; ctx.fillRect(812, 1040, 26, 22);
    // chart binders
    ['#d62828', '#2a6fdb', '#2a9d8f', '#f4a300', '#8e44ad'].forEach((c, i) => { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(40 + i * 34, 930 - (i % 2) * 10, 30, 130 + (i % 2) * 10, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(46 + i * 34, 960, 18, 30); });
    // desk phone
    ctx.fillStyle = '#e9e1d0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(250, 1010, 130, 54, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#cfc6b3'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ell(320 + i * 16, 1028 + j * 16, 5, 5); ctx.fill(); }
    // mug
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(520, 990, 80, 74, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(604, 1024, 18, -PI / 2, PI / 2); ctx.stroke();
    text("WORLD'S", 560, 1012, { size: 13, fill: '#e8193a' }); text('OKAYEST', 560, 1030, { size: 15, fill: '#e8193a' }); text('NURSE', 560, 1049, { size: 15, fill: '#e8193a' });
    // sanitizer
    ctx.fillStyle = '#e8eef3'; ctx.strokeStyle = '#8b98a5'; ctx.lineWidth = 3; rr(470, 700, 70, 110, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6ec3ff'; ctx.fillRect(480, 740, 50, 40);
  });
}

function stationDyn(opt) {
  // clock hands
  const [hh, mm] = (opt.clock || '3:00').split(':').map(Number);
  const spin = opt.spin || 0;
  const ma = (mm / 60) * TAU + spin * TAU * 8, ha = ((hh % 12) / 12 + mm / 720) * TAU + spin * TAU * (8 / 12);
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(525, 250); ctx.lineTo(525 + Math.sin(ha) * 34, 250 - Math.cos(ha) * 34); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(525, 250); ctx.lineTo(525 + Math.sin(ma) * 52, 250 - Math.cos(ma) * 52); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ell(525, 250, 7, 7); ctx.fill();
  // call lights
  const lit = opt.lights || 0;
  for (let i = 0; i < 12; i++) {
    const c = i % 4, r = Math.floor(i / 4);
    const x = 690 + c * 90, y = 395 + r * 78;
    const on = i < lit || (opt.litSet && opt.litSet.includes(i));
    const blink = on && (Math.sin(T * 9 + i * 1.7) > -.3);
    ctx.fillStyle = blink ? '#ff2d3d' : '#4a1d22';
    ell(x, y, 26, 26); ctx.fill();
    if (blink) {
      const g = ctx.createRadialGradient(x, y, 5, x, y, 60); g.addColorStop(0, 'rgba(255,60,60,.6)'); g.addColorStop(1, 'rgba(255,60,60,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 60, y - 60, 120, 120);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(x - 8, y - 8, 7, 5); ctx.fill();
    }
    text(String(i + 1), x, y + 40, { size: 15, fill: '#9fb3c8' });
  }
}

// ---- resident room
const SKY = {
  day: ['#6ec6ff', '#c9ecff'], golden: ['#ff9d5c', '#ffe0a3'], dusk: ['#5b4b8a', '#ff8a7a'], night: ['#0d1330', '#27305e'],
};
function bgRoom(v) {
  cached('room' + v.num, () => {
    const g = ctx.createLinearGradient(0, 150, 0, 1300); g.addColorStop(0, v.wall[0]); g.addColorStop(1, v.wall[1]);
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ceiling('#f3f1ec');
    ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(-PAD, 1040, W + PAD * 2, 250);
    ctx.fillStyle = '#9a8f80'; ctx.fillRect(-PAD, 1270, W + PAD * 2, 24);
    floorPaint(1290, v.floor ? v.floor[0] : '#e2d9c6', v.floor ? v.floor[1] : '#bfb39c');
    // whiteboard
    ctx.fillStyle = '#b7bec7'; rr(540, 250, 490, 330, 12); ctx.fill();
    ctx.fillStyle = '#fdfdfd'; ctx.fillRect(554, 264, 462, 302);
    ctx.fillStyle = '#2a6fdb'; ctx.fillRect(554, 264, 462, 48);
    text('ROOM ' + v.num, 785, 290, { size: 30, fill: '#fff' });
    v.board.forEach(([s, c], i) => text(s, 580, 345 + i * 52, { size: 30, fill: c || '#1f3b8f', align: 'left', weight: 800, italic: true, maxW: 420 }));
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(560, 566, 450, 12);
    ['#d62828', '#2a6fdb', '#111'].forEach((c, i) => { ctx.fillStyle = c; rr(600 + i * 40, 556, 32, 12, 4); ctx.fill(); });
    // headwall: O2 + suction
    ctx.fillStyle = '#dfe5ea'; rr(880, 640, 150, 120, 10); ctx.fill();
    ctx.fillStyle = '#2a9d4a'; ell(920, 700, 16, 16); ctx.fill(); text('O2', 920, 736, { size: 16, fill: '#2a9d4a' });
    ctx.fillStyle = '#e0e0e0'; ctx.strokeStyle = '#777'; ctx.lineWidth = 3; ell(985, 700, 16, 16); ctx.fill(); ctx.stroke(); text('VAC', 985, 736, { size: 14, fill: '#555' });
    if (v.sign) {
      ctx.save(); ctx.translate(430, 700); ctx.rotate(.04);
      ctx.fillStyle = '#ffd400'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(-80, -80, 160, 160, 14); ctx.fill(); ctx.stroke();
      text('FALL', 0, -40, { size: 34, fill: INK }); text('RISK', 0, -4, { size: 34, fill: INK });
      ctx.fillStyle = '#ffe96b'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-30, 50); ctx.quadraticCurveTo(-10, 20, 0, 30); ctx.quadraticCurveTo(10, 20, 30, 50); ctx.quadraticCurveTo(0, 38, -30, 50); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // privacy curtain on the left edge
    ctx.fillStyle = '#9ad1c9';
    ctx.beginPath(); ctx.moveTo(-PAD, 160); ctx.lineTo(40, 160);
    for (let y = 160; y <= 1200; y += 40) ctx.lineTo(34 + Math.sin(y * .05) * 10, y);
    ctx.lineTo(-PAD, 1200); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 3; for (let x = -60; x < 40; x += 22) { ctx.beginPath(); ctx.moveTo(x, 170); ctx.lineTo(x, 1190); ctx.stroke(); }
    ctx.fillStyle = '#bbb'; ctx.fillRect(-PAD, 150, W * .3, 10);
  });
}

function windowDyn(sky, x = 80, y = 250, w = 400, h = 430) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, SKY[sky][0]); g.addColorStop(1, SKY[sky][1]);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  if (sky === 'night') { ctx.fillStyle = '#fff'; for (let i = 0; i < 18; i++) { ell(x + srand(i) * w, y + srand(i + 9) * h * .7, 2, 2); ctx.fill(); } ctx.fillStyle = '#fff7cc'; ell(x + w * .72, y + h * .25, 32, 32); ctx.fill(); }
  else if (sky === 'day') { ctx.fillStyle = 'rgba(255,255,255,.9)'; const cx = x + ((T * 12) % (w + 200)) - 100; ell(cx, y + 110, 60, 24); ctx.fill(); ell(cx + 40, y + 96, 44, 28); ctx.fill(); }
  else { ctx.fillStyle = sky === 'golden' ? '#ffd27a' : '#ffb07a'; ell(x + w * .3, y + h * .82, 60, 60); ctx.fill(); }
  ctx.fillStyle = '#3d4a3a'; ctx.beginPath(); ctx.moveTo(x, y + h); for (let i = 0; i <= 8; i++) ctx.lineTo(x + i * w / 8, y + h - 50 - srand(i + 40) * 60); ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.fillStyle = 'rgba(245,245,240,.9)';
  for (let i = 0; i < 7; i++) ctx.fillRect(x, y + i * 26, w, 16);
  ctx.strokeStyle = '#f6f6f2'; ctx.lineWidth = 16; ctx.strokeRect(x, y, w, h);
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
  ctx.fillStyle = '#e6e2d8'; ctx.fillRect(x - 20, y + h + 4, w + 40, 20);
}

function drawBedBack(x, y) {
  // headboard on the right
  ctx.fillStyle = '#c9ccd1'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  rr(x + 230, y - 250, 40, 330, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#9aa'; ctx.lineWidth = 3;
  ell(x + 150, y - 40, 110, 55); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e9edf2'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  rr(x - 320, y - 10, 590, 60, 16); ctx.fill(); ctx.stroke();
}
function drawBedFront(x, y, blanket, bodyTop, alarm) {
  ctx.fillStyle = blanket; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 330, y + 55);
  ctx.quadraticCurveTo(x - 320, y - 40, x - 180, y - 45);
  ctx.quadraticCurveTo(x - 60, y - 70, x + 30, bodyTop);
  ctx.lineTo(x + 250, bodyTop - 5); ctx.quadraticCurveTo(x + 280, bodyTop + 30, x + 270, y + 55); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 250 + i * 110, y - 20); ctx.quadraticCurveTo(x - 220 + i * 110, y + 20, x - 240 + i * 110, y + 50); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.fillRect(x + 30, bodyTop - 4, 220, 18);
  // frame + rail
  ctx.fillStyle = '#b4bac2'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  rr(x - 340, y + 50, 620, 44, 10); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#8a929c'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 40, y - 34); ctx.lineTo(x + 230, y - 34); ctx.moveTo(x - 40, y + 20); ctx.lineTo(x + 230, y + 20);
  for (let px = x - 40; px <= x + 230; px += 54) { ctx.moveTo(px, y - 34); ctx.lineTo(px, y + 20); } ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = '#6d747e'; for (const dx of [-300, 230]) { ctx.fillRect(x + dx, y + 94, 16, 120); ctx.fillStyle = '#222'; ell(x + dx + 8, y + 220, 22, 22); ctx.fill(); ctx.fillStyle = '#6d747e'; }
  if (alarm) {
    const on = Math.sin(T * 14) > 0;
    ctx.fillStyle = on ? '#ff2d3d' : '#5a1d22'; ell(x - 300, y + 72, 12, 12); ctx.fill();
    if (on) { const g = ctx.createRadialGradient(x - 300, y + 72, 4, x - 300, y + 72, 90); g.addColorStop(0, 'rgba(255,40,40,.55)'); g.addColorStop(1, 'rgba(255,40,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - 390, y - 20, 180, 180); }
  }
}

function overbedTable(x, y, cupFull) {
  ctx.fillStyle = '#c4a57e'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(x - 110, y, 220, 24, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8b9199'; ctx.fillRect(x + 80, y + 24, 16, 260); ctx.fillRect(x + 20, y + 280, 130, 14);
  // pitcher + cup
  ctx.fillStyle = '#e0f0ff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x - 90, y - 90, 60, 90, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8b04a'; ctx.fillRect(x - 90, y - 90, 60, 18);
  ctx.fillStyle = '#f4f7fb'; ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x + 40, y - 70); ctx.lineTo(x + 36, y); ctx.lineTo(x + 4, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (cupFull) { ctx.fillStyle = '#7fcfff'; ctx.fillRect(x + 4, y - 58, 32, 56); }
  text('FULL', x + 20, y - 34, { size: 12, fill: INK, alpha: cupFull ? 1 : 0 });
}

function pulseOx(x, y, val, flash) {
  ctx.fillStyle = '#8b9199'; ctx.fillRect(x - 6, y, 12, 620);
  ctx.fillRect(x - 70, y + 610, 140, 14);
  ctx.fillStyle = '#2c3440'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(x - 110, y - 140, 220, 170, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0b0f14'; rr(x - 94, y - 124, 188, 138, 8); ctx.fill();
  const on = flash && Math.sin(T * 12) > 0;
  text('SpO2', x - 50, y - 100, { size: 20, fill: '#7fd3ff' });
  text(String(val), x + 20, y - 58, { size: 70, fill: on ? '#ff3b3b' : '#7fd3ff', font: 'Bangers', weight: 400 });
  text('%', x + 72, y - 44, { size: 22, fill: '#7fd3ff' });
  text('HR 72', x - 50, y - 6, { size: 20, fill: '#7dff9a' });
  ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i < 60; i++) { const px = x + 2 + i * 1.5, ph = (i / 60 + T * 1.2) % 1; ctx.lineTo(px, y - 12 - (ph > .45 && ph < .5 ? 22 : ph > .5 && ph < .53 ? -8 : 0)); }
  ctx.stroke();
  if (on) { ctx.fillStyle = '#ff3b3b'; ell(x + 90, y - 124, 12, 12); ctx.fill(); }
}

// ---- med room
function bgMed() {
  cached('med', () => {
    const g = ctx.createLinearGradient(0, 150, 0, 1300); g.addColorStop(0, '#d5dde8'); g.addColorStop(1, '#b3c0d1');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ceiling('#eef0f4');
    floorPaint(1260, '#d6d9dd', '#a9aeb5');
    // shelves
    for (let r = 0; r < 3; r++) {
      const y = 330 + r * 150;
      ctx.fillStyle = '#f2f2f2'; ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 3; ctx.fillRect(40, y, 560, 14); ctx.strokeRect(40, y, 560, 14);
      for (let i = 0; i < 13; i++) {
        const x = 60 + i * 42, h = 60 + srand(i + r * 20) * 40;
        if (srand(i * 7 + r) > .7) { ctx.fillStyle = ['#fff', '#e3f2ff', '#ffe9e3'][i % 3]; ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 2; ctx.fillRect(x, y - h, 36, h); ctx.strokeRect(x, y - h, 36, h); ctx.fillStyle = ['#2a6fdb', '#d62828', '#2a9d4a'][i % 3]; ctx.fillRect(x + 4, y - h + 10, 28, 8); }
        else { ctx.fillStyle = 'rgba(255,140,0,.85)'; ctx.fillRect(x + 4, y - h + 14, 28, h - 14); ctx.fillStyle = '#fff'; ctx.fillRect(x + 2, y - h, 32, 16); ctx.fillStyle = '#fdfaf2'; ctx.fillRect(x + 4, y - h * .6, 28, h * .3); }
      }
    }
    // counter + sink + sharps
    ctx.fillStyle = '#8fa3bb'; ctx.fillRect(-PAD, 1000, 640 + PAD, 260);
    ctx.fillStyle = '#eceff3'; ctx.fillRect(-PAD, 980, 660 + PAD, 26);
    ctx.fillStyle = '#d62828'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(470, 880, 110, 100, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(480, 900, 90, 24); text('SHARPS', 525, 913, { size: 16, fill: '#d62828' });
    // mini fridge with sign
    ctx.fillStyle = '#f7f7f7'; ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 4; rr(60, 1040, 230, 210, 10); ctx.fill(); ctx.stroke();
    paper(175, 1120, 190, 110, -.03, '#fff27a', [['NO FOOD', 26, '#d62828', 36], ['IN MED FRIDGE', 17, '#d62828', 62], ['(THIS MEANS YOU)', 13, INK, 86]]);
    // door frame (right)
    ctx.fillStyle = '#7d8896'; ctx.fillRect(640, 460, 340, 810);
    ctx.fillStyle = '#10131a'; ctx.fillRect(660, 480, 300, 790);
  });
}
function medDoor(open, glow) {
  // light from the doorway
  if (glow > 0) {
    const g = ctx.createRadialGradient(810, 900, 20, 810, 900, 420); g.addColorStop(0, `rgba(255,240,200,${.95 * glow})`); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.fillRect(660, 480, 300, 790);
    ctx.save(); ctx.globalAlpha = .25 * glow; ctx.fillStyle = '#fff';
    for (let i = 0; i < 6; i++) { const y = 1000 + i * 45 + Math.sin(T * 1.3 + i) * 20; ell(810 + Math.sin(T * .7 + i * 2) * 120, y, 200, 34); ctx.fill(); }
    ctx.restore();
  }
  // door leaf swinging open (towards us, hinged on the right)
  const w = 300 * (1 - open * .82);
  ctx.fillStyle = '#c4ccd6'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(960 - w, 480 - open * 20); ctx.lineTo(960, 480); ctx.lineTo(960, 1270); ctx.lineTo(960 - w, 1270 + open * 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (open < .5) { ctx.fillStyle = '#fff'; rr(960 - w + w * .2, 620, w * .6, 70, 6); ctx.fill(); text('MED ROOM', 960 - w / 2, 655, { size: 26 * (1 - open), fill: '#d62828' }); }
  ctx.fillStyle = '#9aa'; ell(960 - w + 30, 900, 12, 12); ctx.fill();
}
function medCart(x, y) {
  ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  rr(x, y, 430, 360, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e9eef5'; rr(x - 10, y - 18, 450, 30, 8); ctx.fill(); ctx.stroke();
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
    ctx.fillStyle = '#4f8ae6'; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3;
    rr(x + 20 + c * 205, y + 30 + r * 78, 185, 64, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dfe7ef'; rr(x + 90 + c * 205, y + 56 + r * 78, 44, 12, 5); ctx.fill();
  }
  ctx.fillStyle = '#fff'; rr(x + 110, y + 332, 210, 24, 6); ctx.fill(); text('MED CART 2', x + 215, y + 345, { size: 18, fill: '#2a6fdb' });
  ctx.fillStyle = '#222'; for (const dx of [30, 400]) { ell(x + dx, y + 380, 24, 24); ctx.fill(); }
}

// ---- hallway
function bgHall(exit) {
  cached('hall' + (exit ? 'X' : ''), () => {
    const g = ctx.createLinearGradient(0, 150, 0, 1300); g.addColorStop(0, '#f2ead8'); g.addColorStop(1, '#e2d6bd');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ceiling('#f6f3ea');
    ctx.fillStyle = '#b9d3c9'; ctx.fillRect(-PAD, 1080, W + PAD * 2, 200);
    floorPaint(1270, '#e8e2d4', '#bdb3a0');
    // reflections of ceiling lights
    for (const x of [180, 540, 900]) { const g2 = ctx.createRadialGradient(x, 1420, 10, x, 1420, 170); g2.addColorStop(0, 'rgba(255,255,255,.45)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g2; ctx.save(); ctx.scale(1, .35); ctx.fillRect(x - 200, 1420 / .35 - 170, 400, 340); ctx.restore(); }
    const door = (x, num, label) => {
      ctx.fillStyle = '#8a6a48'; ctx.fillRect(x - 10, 560, 300, 720);
      const g3 = ctx.createLinearGradient(x, 0, x + 280, 0); g3.addColorStop(0, '#caa27a'); g3.addColorStop(1, '#b08660');
      ctx.fillStyle = g3; ctx.fillRect(x, 572, 280, 708);
      ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 8; i++) ctx.fillRect(x + 20 + i * 33, 580, 3, 690);
      ctx.fillStyle = '#d9dde2'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x + 220, 900, 40, 18, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#555'; rr(x + 70, 470, 140, 60, 8); ctx.fill(); ctx.stroke();
      text(num, x + 140, 492, { size: 26, fill: INK }); if (label) text(label, x + 140, 518, { size: 14, fill: '#555' });
      ctx.fillStyle = '#ddd'; ctx.fillRect(x + 110, 530, 60, 24);
    };
    if (exit) {
      door(40, '21', 'ROOM');
      // EXIT double doors
      ctx.fillStyle = '#6f7a86'; ctx.fillRect(560, 520, 460, 760);
      ctx.fillStyle = '#aeb8c4'; ctx.fillRect(578, 538, 206, 742); ctx.fillRect(796, 538, 206, 742);
      ctx.fillStyle = '#dfe7f0'; ctx.fillRect(610, 590, 140, 220); ctx.fillRect(828, 590, 140, 220);
      ctx.fillStyle = '#c9d2dc'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(590, 900, 180, 26, 8); ctx.fill(); ctx.stroke(); rr(808, 900, 180, 26, 8); ctx.fill(); ctx.stroke();
    } else {
      door(60, '16', "MOM'S ROOM");
      door(720, '17', 'ROOM');
      paper(560, 700, 150, 170, .03, '#fff', [['HAND', 26, '#2a6fdb', 40], ['HYGIENE', 22, '#2a6fdb', 70], ['SAVES', 22, '#2a6fdb', 100], ['LIVES', 22, '#2a6fdb', 130]]);
    }
    // handrail
    ctx.fillStyle = '#b8895a'; ctx.strokeStyle = '#6e4d2c'; ctx.lineWidth = 3;
    ctx.fillRect(-PAD, 1052, W + PAD * 2, 22); ctx.strokeRect(-PAD, 1052, W + PAD * 2, 22);
    ctx.fillStyle = '#8a8f96'; for (let x = 20; x < W; x += 180) ctx.fillRect(x, 1074, 12, 26);
  });
}
function exitDyn(glow) {
  const on = .8 + .2 * Math.sin(T * 7);
  ctx.fillStyle = '#1b3a1b'; rr(700, 420, 180, 70, 8); ctx.fill();
  ctx.fillStyle = `rgba(80,255,120,${on})`; rr(710, 430, 160, 50, 6); ctx.fill();
  text('EXIT', 790, 457, { size: 44, fill: '#eaffea', font: 'Bangers', weight: 400 });
  if (glow > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(790, 850, 30, 790, 850, 700); g.addColorStop(0, `rgba(255,250,220,${.5 * glow})`); g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g; ctx.fillRect(-PAD, 0, W + PAD * 2, H);
    for (let i = 0; i < 9; i++) {
      const a = -PI + .25 + i * (PI - .5) / 8 + Math.sin(T * .8 + i) * .04;
      ctx.fillStyle = `rgba(255,245,200,${.07 * glow})`;
      ctx.beginPath(); ctx.moveTo(790, 800); ctx.lineTo(790 + Math.cos(a - .05) * 1600, 800 + Math.sin(a - .05) * 1600); ctx.lineTo(790 + Math.cos(a + .05) * 1600, 800 + Math.sin(a + .05) * 1600); ctx.fill();
    }
    ctx.restore();
  }
}
function hallLights(set) {
  for (const [x, on] of set) {
    const lit = on && Math.sin(T * 8 + x) > -.4;
    ctx.fillStyle = lit ? '#ff3b3b' : '#6b2a2a'; rr(x - 26, 420, 52, 26, 8); ctx.fill();
    if (lit) { const g = ctx.createRadialGradient(x, 433, 4, x, 433, 90); g.addColorStop(0, 'rgba(255,60,60,.55)'); g.addColorStop(1, 'rgba(255,60,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 90, 343, 180, 180); }
  }
}

// ---- exterior
function bgExterior() {
  cached('ext', () => {
    const g = ctx.createLinearGradient(0, -PAD, 0, 1200); g.addColorStop(0, '#3fa9f5'); g.addColorStop(1, '#bfe7ff');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1300 + PAD);
    ctx.fillStyle = '#fff6b0'; ell(880, 260, 90, 90); ctx.fill();
    const sg = ctx.createRadialGradient(880, 260, 80, 880, 260, 260); sg.addColorStop(0, 'rgba(255,250,200,.6)'); sg.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = sg; ctx.fillRect(600, 0, 560, 560);
    // grass & lot
    ctx.fillStyle = '#6cc04a'; ctx.fillRect(-PAD, 1360, W + PAD * 2, 200);
    ctx.fillStyle = '#7a7f86'; ctx.fillRect(-PAD, 1520, W + PAD * 2, 500);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; for (let x = -40; x < W + 80; x += 170) { ctx.beginPath(); ctx.moveTo(x, 1560); ctx.lineTo(x - 60, 1900); ctx.stroke(); }
    // building
    ctx.fillStyle = '#c98f6b'; ctx.fillRect(40, 900, 1000, 470);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 910; y < 1370; y += 18) for (let x = 40 + ((y / 18) % 2) * 20; x < 1040; x += 40) ctx.fillRect(x, y, 36, 2);
    ctx.fillStyle = '#8c5a3c'; ctx.fillRect(20, 880, 1040, 30);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
      if (c === 2 || c === 3) continue;
      const x = 80 + c * 160, y = 960 + r * 180;
      ctx.fillStyle = '#e8f4ff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.fillRect(x, y, 110, 120); ctx.strokeRect(x, y, 110, 120);
      ctx.fillStyle = 'rgba(100,150,200,.35)'; ctx.fillRect(x, y, 110, 60);
    }
    // entrance
    ctx.fillStyle = '#5a3d2b'; ctx.fillRect(420, 1080, 240, 290);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(440, 1100, 95, 270); ctx.fillRect(545, 1100, 95, 270);
    ctx.fillStyle = '#2a6fdb'; ctx.beginPath(); ctx.moveTo(380, 1080); ctx.lineTo(700, 1080); ctx.lineTo(680, 1030); ctx.lineTo(400, 1030); ctx.fill();
    // sign
    ctx.fillStyle = '#5a3d2b'; ctx.fillRect(250, 830, 16, 60); ctx.fillRect(814, 830, 16, 60);
    ctx.fillStyle = '#fff8ea'; ctx.strokeStyle = '#5a3d2b'; ctx.lineWidth = 10; rr(150, 610, 780, 240, 24); ctx.fill(); ctx.stroke();
    text('FRUIT BOWL', 540, 700, { size: 118, font: 'Lucky', weight: 400, fill: '#e8193a', stroke: '#5a0010', lw: 10 });
    text('REHAB & NURSING', 540, 790, { size: 46, font: 'Nunito', weight: 900, fill: '#2a6f3a' });
    // bushes
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#3f9a3a' : '#4fb046'; ell(60 + i * 90, 1375, 70, 50); ctx.fill(); }
    // flag pole
    ctx.fillStyle = '#ccc'; ctx.fillRect(1000, 560, 10, 820);
    // ambulance
    const ax = 80, ay = 1560;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(ax, ay, 320, 150, 14); ctx.fill(); ctx.stroke();
    rr(ax + 320, ay + 50, 110, 100, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bfe3ff'; rr(ax + 340, ay + 62, 70, 40, 6); ctx.fill();
    ctx.fillStyle = '#e8193a'; ctx.fillRect(ax, ay + 70, 430, 18); ctx.fillRect(ax + 130, ay + 20, 60, 16); ctx.fillRect(ax + 152, ay - 2, 16, 60);
    ctx.fillStyle = '#222'; ell(ax + 80, ay + 155, 34, 34); ctx.fill(); ell(ax + 350, ay + 155, 34, 34); ctx.fill();
  });
}
function exteriorDyn() {
  // clouds + flag + ambulance lights
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  for (let i = 0; i < 4; i++) { const x = ((srand(i) * 1400 + T * (18 + i * 6)) % 1500) - 200, y = 140 + i * 110; ell(x, y, 90, 34); ctx.fill(); ell(x + 50, y - 18, 60, 36); ctx.fill(); ell(x - 50, y - 6, 50, 26); ctx.fill(); }
  ctx.fillStyle = '#e8193a'; ctx.beginPath(); ctx.moveTo(1010, 570);
  for (let i = 0; i <= 10; i++) ctx.lineTo(1010 - i * 14, 570 + Math.sin(T * 6 + i * .7) * 6 * i / 10);
  for (let i = 10; i >= 0; i--) ctx.lineTo(1010 - i * 14, 650 + Math.sin(T * 6 + i * .7) * 6 * i / 10);
  ctx.fill();
  const on = Math.sin(T * 10) > 0;
  ctx.fillStyle = on ? '#ff2d3d' : '#3b7bff'; rr(220, 1540, 60, 22, 6); ctx.fill();
}

// ---- bedroom
function bgBedroom() {
  cached('bedroom', () => {
    const g = ctx.createLinearGradient(0, 0, 0, 1300); g.addColorStop(0, '#141836'); g.addColorStop(1, '#1f2550');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    floorPaint(1300, '#2a2440', '#171327');
    ctx.fillStyle = '#0b0e22'; ctx.fillRect(120, 260, 380, 420);
    ctx.fillStyle = '#fff'; for (let i = 0; i < 24; i++) { ell(130 + srand(i) * 360, 270 + srand(i + 4) * 300, 2, 2); ctx.fill(); }
    ctx.fillStyle = '#fff7cc'; ell(400, 360, 44, 44); ctx.fill(); ctx.fillStyle = '#0b0e22'; ell(385, 350, 40, 40); ctx.fill();
    ctx.strokeStyle = '#3a3f6a'; ctx.lineWidth = 14; ctx.strokeRect(120, 260, 380, 420); ctx.beginPath(); ctx.moveTo(310, 260); ctx.lineTo(310, 680); ctx.stroke();
    // poster
    ctx.fillStyle = '#2d335e'; rr(640, 300, 300, 380, 10); ctx.fill();
    text('NCLEX', 790, 400, { size: 60, font: 'Bangers', weight: 400, fill: '#8f9bd6' });
    text('SURVIVOR', 790, 470, { size: 44, font: 'Bangers', weight: 400, fill: '#8f9bd6' });
  });
}

// ------------------------------------------------------------------ overlays
function chunkWords(words) {
  const out = []; let cur = [];
  for (const w of words) {
    cur.push(w);
    const end = /(\.\.\.|[.!?,:])["']?$/.test(w[0]);
    if (cur.length >= 5 || (end && cur.length >= 2)) { out.push(cur); cur = []; }
  }
  if (cur.length) { if (cur.length === 1 && out.length) out[out.length - 1].push(...cur); else out.push(cur); }
  return out;
}

function drawCaption(t) {
  const l = lineAt(t);
  if (!l) return;
  const lt = t - l.s;
  l._chunks = l._chunks || chunkWords(l.words);
  let chunk = l._chunks.find(c => lt < c[c.length - 1][2]) || l._chunks[l._chunks.length - 1];
  const size = 70;
  ctx.save();
  ctx.font = `900 ${size}px Nunito`;
  const space = ctx.measureText(' ').width + 16;
  const lines = [[]]; let lw = 0;
  for (const w of chunk) {
    const ww = ctx.measureText(w[0]).width;
    if (lw + ww > 940 && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push([w, ww]); lw += ww + space;
  }
  const baseY = 1600 - (lines.length - 1) * 42;
  const pop = easeBack(seg(lt, chunk[0][1] - .02, chunk[0][1] + .12));
  // speaker pill
  const name = l.name;
  ctx.font = '900 32px Nunito';
  const nw = ctx.measureText(name).width + 44;
  const py = baseY - 92;
  ctx.fillStyle = l.color; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 5;
  rr(540 - nw / 2, py - 26, nw, 52, 26); ctx.fill(); ctx.stroke();
  const dark = ['#ffd60a', '#ffd23f', '#e8e8e8', '#f4a300', '#ff9f1c'].includes(l.color);
  text(name, 540, py + 1, { size: 32, fill: dark ? '#15111a' : '#fff' });
  lines.forEach((ln, i) => {
    const total = ln.reduce((a, [, ww]) => a + ww, 0) + space * (ln.length - 1);
    let x = 540 - total / 2;
    const y = baseY + i * 84;
    for (const [w, ww] of ln) {
      const active = lt >= w[1] && lt < w[2];
      const said = lt >= w[1];
      const sc = (active ? 1.1 : 1) * lerp(.6, 1, pop);
      ctx.save(); ctx.translate(x + ww / 2, y); ctx.scale(sc, sc);
      text(w[0], 0, 0, { size, fill: active ? '#ffe135' : said ? '#ffffff' : '#ffffff', lw: 14, stroke: '#15111a', alpha: said ? 1 : .88 });
      ctx.restore();
      x += ww + space;
    }
  });
  ctx.restore();
}

function drawChip(sc, lt) {
  if (!sc.clock) return;
  const a = easeBack(seg(lt, .05, .35));
  ctx.save(); ctx.translate(48, 160); ctx.scale(a, a);
  ctx.fillStyle = 'rgba(12,10,18,.82)'; rr(0, -40, 260, 80, 18); ctx.fill();
  ctx.fillStyle = Math.sin(T * 5) > -.2 ? '#ff2d3d' : '#6a1d22'; ell(34, 0, 12, 12); ctx.fill();
  text(sc.clock, 150, 3, { size: 54, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 });
  ctx.restore();
  const la = seg(lt, .25, .5) * (1 - seg(lt, 2.8, 3.2));
  if (la > 0 && sc.label) {
    ctx.font = '900 30px Nunito';
    const w = ctx.measureText(sc.label).width + 36;
    ctx.fillStyle = `rgba(255,214,10,${la})`; rr(48, 214, w, 48, 12); ctx.fill();
    text(sc.label, 48 + w / 2, 239, { size: 30, fill: '#15111a', alpha: la });
  }
}

function drawWatermark() {
  text('SHIFT HAPPENS', 1030, 150, { size: 40, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 8, align: 'right', spacing: 1 });
  text('EP. 1', 1030, 190, { size: 22, fill: '#fff', lw: 6, align: 'right' });
}

function grain() {
  const v = ctx.createRadialGradient(540, 900, 500, 540, 960, 1250);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// generic "nature documentary" fact card
function factCard(p, title, rows, y = 330, accent = '#2a9d4a') {
  if (p <= 0) return;
  const x = lerp(-900, 60, easeBack(p));
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#fffdf6'; rr(0, 0, 820, 90 + rows.length * 62, 22); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = accent; rr(0, 0, 820, 74, [22, 22, 0, 0]); ctx.fill();
  text(title, 410, 39, { size: 40, fill: '#fff', font: 'Bangers', weight: 400, spacing: 2 });
  rows.forEach(([k, v], i) => {
    text(k, 36, 118 + i * 62, { size: 30, fill: accent, align: 'left', weight: 900 });
    text(v, 784, 118 + i * 62, { size: 32, fill: INK, align: 'right', weight: 800, italic: true, maxW: 520 });
  });
  ctx.restore();
}

function banner(p, str, y, bg = '#e8193a', fg = '#fff', size = 84, rot = -.04) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(540, y); ctx.rotate(rot); const s = easeBack(p); ctx.scale(s, s);
  ctx.font = `400 ${size}px Bangers`;
  const w = ctx.measureText(str).width + 80;
  ctx.fillStyle = bg; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 8; rr(-w / 2, -size * .72, w, size * 1.4, 18); ctx.fill(); ctx.stroke();
  text(str, 0, 4, { size, font: 'Bangers', weight: 400, fill: fg, spacing: 3 });
  ctx.restore();
}

function slamText(p, str, x, y, size, fill, rot = 0) {
  if (p <= 0) return;
  const s = lerp(2.6, 1, easeOut(clamp(p * 1.4)));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  text(str, 0, 0, { size, font: 'Bangers', weight: 400, fill, lw: 16, stroke: '#15111a', alpha: clamp(p * 4), spacing: 2 });
  ctx.restore();
}

function stamp(p, lines, x, y, rot = -.2) {
  if (p <= 0) return;
  const s = lerp(2.4, 1, easeOut(clamp(p * 2.5)));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 5) * .92;
  ctx.fillStyle = 'rgba(255,250,245,.82)'; rr(-330, -110, 660, 220, 20); ctx.fill();
  ctx.strokeStyle = '#d62828'; ctx.lineWidth = 12; rr(-330, -110, 660, 220, 20); ctx.stroke();
  ctx.lineWidth = 4; rr(-310, -92, 620, 184, 14); ctx.stroke();
  lines.forEach(([s2, size, dy]) => text(s2, 0, dy, { size, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 4 }));
  ctx.restore();
}

function timeCard(p, str, bg) {
  if (p <= 0 || p >= 1) return;
  const a = Math.min(seg(p, 0, .15), 1 - seg(p, .85, 1));
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) { ctx.fillStyle = `rgba(255,255,255,${.06 + .04 * (i % 2)})`; ctx.beginPath(); ctx.moveTo(540, 960); const a0 = i / 16 * TAU + T * .5; ctx.lineTo(540 + Math.cos(a0) * 1600, 960 + Math.sin(a0) * 1600); ctx.lineTo(540 + Math.cos(a0 + .2) * 1600, 960 + Math.sin(a0 + .2) * 1600); ctx.fill(); }
  const s = 1 + .08 * Math.sin(p * PI);
  ctx.translate(540, 960); ctx.scale(s, s); ctx.rotate(-.05);
  text(str, 0, 0, { size: 150, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 18, stroke: '#3a1d00', spacing: 4 });
  ctx.restore();
}

function speedLines(x, y, len, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) { ctx.lineWidth = 6 + (i % 3) * 3; const yy = y - 200 + i * 55; ctx.beginPath(); ctx.moveTo(x - len * (0.6 + .4 * hash(i)), yy); ctx.lineTo(x - 40, yy); ctx.stroke(); }
  ctx.restore();
}

function logo(x, y, s, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-.05); ctx.globalAlpha *= a;
  text('SHIFT', 0, -80, { size: 200, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 22, stroke: '#2a0010', spacing: 6, shadow: 20 });
  text('HAPPENS', 0, 90, { size: 200, font: 'Bangers', weight: 400, fill: '#ff3b55', lw: 22, stroke: '#2a0010', spacing: 6, shadow: 20 });
  ctx.fillStyle = '#15111a'; rr(-230, 190, 460, 64, 32); ctx.fill();
  text('EPISODE 1: THE 3-11', 0, 223, { size: 36, fill: '#fff', spacing: 2 });
  ctx.restore();
}

// ------------------------------------------------------------------ scenes
const GROUND = 1440;
const straw = (o) => Object.assign({ kind: 'straw', s: 1.45, y: GROUND, acc: ['steth', 'badge'] }, o);

const SCENES = {
  title: {
    cam(lt) { const p = easeIO(seg(lt, B('jingle').e - .3, CUR.dur)); CAM.z = 1.02 + .16 * p; CAM.y = 960 - 170 * p; },
    draw(lt) { bgExterior(); exteriorDyn(); },
    over(lt) {
      const j = B('jingle');
      const a = 1 - seg(lt, j.e - .25, j.e + .2);
      if (a > 0) {
        ctx.fillStyle = `rgba(8,6,12,${a})`; ctx.fillRect(0, 0, W, H);
        text('THE FOLLOWING IS BASED ON', 540, 860, { size: 50, alpha: a * seg(lt, .15, .4), weight: 800 });
        text('A TRUE STORY', 540, 950, { size: 96, font: 'Bangers', weight: 400, alpha: a * seg(lt, .3, .55), spacing: 4 });
        text('(every. single. shift.)', 540, 1050, { size: 46, italic: true, fill: '#ffd60a', alpha: a * seg(lt, .8, 1.0) });
      }
      const p = seg(lt, B('n2').e - .05, B('n2').e + .3);
      if (p > 0) {
        ctx.fillStyle = `rgba(10,5,20,${.55 * p})`; ctx.fillRect(0, 0, W, H);
        logo(540, 820, lerp(2.2, 1, easeOut(p)) * (1 + .02 * Math.sin(lt * 6)), clamp(p * 3));
      }
    },
  },

  handoff: {
    cam(lt) { const n = B('n1'), p = easeIO(seg(lt, n.s, n.s + 1.4)); CAM.z = 1 + .02 * lt / CUR.dur + .3 * p; CAM.x = lerp(540, 330, p); CAM.y = lerp(960, 1060, p); },
    draw(lt) {
      bgStation();
      const L = B('lights');
      stationDyn({ clock: '2:59', lights: Math.floor(seg(lt, L.s + .05, L.s + 1.05) * 12) + (lt > L.s + 1.05 ? 12 : 0) });
      const c2 = B('c2'), leave = seg(lt, c2.s + .35, c2.s + .7);
      if (leave < 1) {
        if (leave > 0) speedLines(lerp(760, 1500, easeIn(leave)) - 60, 1150, 500, 1 - leave);
        drawChar({ kind: 'cherry', x: lerp(780, 1600, easeIn(leave)), y: GROUND, s: 1.4, talk: talk('cherry'), expr: 'happy', look: [-.7, 0],
          arms: lt >= c2.s ? { l: 'hold', r: 'wave' } : { l: 'hold', r: 'rest' }, hold: { l: 'purse' }, acc: ['sunglassesHead'], walk: leave > 0 ? lt * 30 : null, rot: leave * .2 });
      }
      // dust puff where she stood
      const dp = seg(lt, c2.s + .35, c2.s + 1.2);
      if (dp > 0 && dp < 1) { ctx.fillStyle = `rgba(230,220,200,${.8 * (1 - dp)})`; for (let i = 0; i < 6; i++) { ell(780 + (i - 2.5) * 50 * (1 + dp), GROUND - 20 - hash(i) * 60 * dp, 40 + 50 * dp, 30 + 30 * dp); ctx.fill(); } }
      // report page floating down
      const fp = seg(lt, c2.s + .5, L.s + 1.2);
      if (fp > 0) {
        ctx.save(); ctx.translate(760 + Math.sin(fp * 9) * 60, lerp(820, 1405, easeOut(fp))); ctx.rotate(fp < 1 ? Math.sin(fp * 9) * .35 : .08);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.fillRect(-90, -60, 180, 120); ctx.strokeRect(-90, -60, 180, 120);
        text('REPORT:', 0, -30, { size: 26, fill: INK }); text('everyone fine :)', 0, 8, { size: 24, fill: '#2a6fdb', italic: true }); text('- Cherry', 30, 40, { size: 18, fill: '#c2003a', italic: true });
        ctx.restore();
      }
      const e = easeOut(seg(lt, 0, .8));
      const shocked = lt > L.s + .15, n1 = lt > B('n1').s;
      drawChar(straw({ x: lerp(-250, 300, e), walk: e < 1 ? lt * 14 : null, talk: talk('straw'),
        expr: n1 ? 'dead' : shocked ? 'panic' : 'neutral', look: shocked && !n1 ? [.6, -.9] : n1 ? [0, .1] : [.7, 0],
        arms: shocked && !n1 ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, shake: shocked && !n1 ? 3 : 0 }));
    },
    over(lt) {
      const n = B('n1');
      factCard(seg(lt, n.s + .1, n.s + .5), 'FIELD NOTES', [['SPECIES', 'Day Shift Cherry'], ['CLOCKED OUT', '2:59:59 PM'], ['CHARTING DONE', '0%'], ['STATUS', 'Already in the car']], 420, '#c2003a');
    },
  },

  ratio: {
    cam(lt) {
      const tw = B('twitch'), n = B('n1');
      const zin = easeOut(seg(lt, tw.s - .1, tw.s + .25)) * (1 - easeIO(seg(lt, n.s - .15, n.s + .35)));
      CAM.z = lerp(1.02, 2.5, zin); CAM.x = lerp(540, 300, zin); CAM.y = lerp(960, 1040, zin);
      CAM.shake = zin * 10 * (lt < tw.e ? 1 : 0);
    },
    draw(lt) {
      bgStation(); stationDyn({ clock: '3:05', lights: 12 });
      const l2 = B('l2'), tw = B('twitch'), n = B('n1');
      const hopeful = lt > B('s1').s && lt < l2.s + .9;
      const hit = lt > l2.s + .9;
      drawChar(straw({ x: 290, talk: talk('straw'), expr: lt > n.s ? 'dead' : hit ? 'shock' : hopeful ? 'hopeful' : 'neutral', look: [.8, 0], twitch: lt > tw.s - .1 && lt < n.s + 1.5,
        arms: hopeful && !hit ? { l: [.5, 1.9], r: [.5, 1.9] } : { l: 'rest', r: 'rest' } }));
      drawChar({ kind: 'lemon', x: 800, y: GROUND, s: 1.45, talk: talk('lemon'), expr: 'sour', look: [-.7, 0], acc: ['readers', 'lanyard'], hold: { l: 'clipboard' }, arms: { l: 'hold', r: 'rest' }, clipText: 'STAFFING' });
    },
    over(lt) {
      const tw = B('twitch'), n = B('n1');
      const p = seg(lt, tw.s, tw.s + .3) * (1 - seg(lt, n.s - .2, n.s + .1));
      if (p > 0) {
        const r = ctx.createRadialGradient(540, 960, 300, 540, 960, 1100); r.addColorStop(0, 'rgba(255,0,40,0)'); r.addColorStop(1, `rgba(255,0,40,${.45 * p * (.8 + .2 * Math.sin(T * 20))})`);
        ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
        slamText(seg(lt, tw.s + .05, tw.s + .4), '1 NURSE', 540, 470, 150, '#ffe135', -.06);
        slamText(seg(lt, tw.s + .35, tw.s + .7), '40 RESIDENTS', 540, 640, 130, '#ff3b55', .04);
      }
      factCard(seg(lt, n.s + .2, n.s + .6), 'SPECIES PROFILE', [['NAME', 'Fragaria nursicus'], ['HABITAT', 'The 3-11'], ['DIET', 'Coffee. Spite.'], ['BATHROOM BREAKS', 'Mythical']], 380);
    },
  },

  blue: {
    cam(lt) { CAM.z = 1.02 + .04 * lt / CUR.dur; const st = B('stamp'); if (lt > st.s) { CAM.shake = 14 * (1 - seg(lt, st.s + .15, st.s + .5)) * (lt > st.s + .15 ? 1 : 0); } },
    draw(lt) {
      bgRoom({ num: 12, wall: ['#e2dcf5', '#c9c0ea'], board: [['NURSE: STRAWBERRY', '#d62828'], ['GOAL: stay blue :)'], ['O2: 2L NC'], ['FAV SONG: Blue (Da Ba Dee)', '#2a9d4a']] });
      windowDyn('day');
      const s1 = B('s1');
      pulseOx(560, 760, 87, lt < B('b1').e);
      drawBedBack(740, 1130);
      drawChar({ kind: 'blue', x: 880, y: 985, s: 1.35, noLegs: true, talk: talk('blue'), expr: lt > B('b1').s ? 'chill' : 'neutral', look: [-.8, 0],
        acc: ['glasses', 'mustache', 'cannula'], browColor: '#f0f0f0', browW: 12, arms: lt > B('b1').s && lt < B('b1').e + .2 ? { l: [1.3, -1.3 + .3 * Math.sin(lt * 5)], r: 'rest' } : { l: 'rest', r: 'rest' } });
      drawBedFront(740, 1130, '#9fb4ff', 1060);
      const e = easeOut(seg(lt, 0, .5));
      const panic = lt < B('b1').s + .6;
      drawChar(straw({ x: lerp(-250, 250, e), walk: e < 1 ? lt * 18 : null, talk: talk('straw'), expr: panic ? 'panic' : lt > B('n1').s ? 'neutral' : 'dead',
        look: [.8, 0], arms: panic ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, shake: panic && lt > s1.s ? 4 : 0 }));
    },
    over(lt) {
      const st = B('stamp');
      stamp(seg(lt, st.s + .15, st.s + .5), [['BASELINE:', 96, -36], ['BLUE', 118, 58]], 540, 640, -.14);
    },
  },

  cran: {
    cam(lt) { CAM.z = 1.02 + .05 * lt / CUR.dur; CAM.x = 560; },
    draw(lt) {
      bgRoom({ num: 7, wall: ['#ffe3d3', '#f5c9b0'], board: [['NURSE: STRAWBERRY', '#d62828'], ['TODAY IS: FRIDAY'], ['YEAR: 2026 (not 1962)'], ['GOAL: stay in bed', '#2a9d4a']] });
      windowDyn('day');
      drawBedBack(740, 1130);
      const c1 = B('c1'), frantic = lt >= c1.s - .2 && lt < c1.e + .3;
      drawChar({ kind: 'cran', x: 870, y: 990, s: 1.35, noLegs: true, talk: talk('cran'), expr: frantic ? 'panic' : 'neutral', look: [-.6, -.2],
        acc: ['curlers', 'glasses', 'pearls'], hold: { r: 'purse' }, arms: frantic ? { l: 'flail', r: 'hold' } : { l: 'rest', r: 'hold' }, rot: frantic ? Math.sin(lt * 14) * .08 : 0, shake: frantic ? 3 : 0 });
      drawBedFront(740, 1130, '#ffb3c4', 1070);
      // thought bubble: the factory, 1962
      const tb = seg(lt, c1.s + .3, c1.s + .6) * (1 - seg(lt, B('s1').e, B('s1').e + .3));
      if (tb > 0) {
        ctx.save(); ctx.translate(760, 620); ctx.scale(easeBack(tb), easeBack(tb));
        ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
        for (const [x, y, r] of [[0, 0, 150], [-110, 30, 90], [110, 30, 90], [-60, -80, 90], [70, -80, 90]]) { ell(x, y, r, r * .8); ctx.fill(); }
        ell(0, 0, 150, 120); ctx.stroke(); ctx.fill();
        ctx.fillStyle = '#fff'; ell(80, 170, 26, 22); ctx.fill(); ctx.stroke(); ell(110, 230, 14, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8c5a3c'; ctx.fillRect(-100, -10, 170, 80); ctx.fillRect(40, -80, 26, 80);
        ctx.fillStyle = '#ccc'; ell(56, -100 - (lt % 1) * 20, 22, 16); ctx.fill();
        ctx.fillStyle = '#ffe9a8'; for (let i = 0; i < 3; i++) ctx.fillRect(-84 + i * 50, 10, 30, 24);
        text('1962', -10, -70, { size: 54, font: 'Bangers', weight: 400, fill: '#d62828' });
        ctx.restore();
      }
      const s1 = B('s1');
      drawChar(straw({ x: 250, talk: talk('straw'), expr: lt > c1.s + .8 ? 'dead' : 'neutral', look: [.8, -.1],
        hold: lt > s1.s - .1 ? { r: 'urine' } : {}, arms: lt > s1.s - .1 ? { l: 'rest', r: 'offer' } : { l: 'rest', r: 'rest' } }));
    },
    over(lt) {
      const n = B('n1');
      banner(seg(lt, n.e - .5, n.e - .2), "IT'S ALWAYS A UTI.", 480, '#ffe135', '#15111a', 96);
    },
  },

  prune: {
    cam(lt) {
      const st = B('stare'), p2 = B('p2'), h = B('hold');
      const zin = easeIO(seg(lt, st.s, p2.s + .3)) * (1 - easeIO(seg(lt, h.e - .2, h.e + .4)));
      CAM.z = lerp(1.02, 1.55, zin); CAM.x = lerp(560, 720, zin); CAM.y = lerp(960, 900, zin);
    },
    draw(lt) {
      bgRoom({ num: 3, wall: ['#dff1dc', '#bfe0b8'], board: [['NURSE: STRAWBERRY', '#d62828'], ['GOAL: POOP', '#d62828'], ['LAST BM: 6 DAYS AGO'], ['BOWEL PROTOCOL: ON']] });
      windowDyn('golden');
      drawBedBack(740, 1130);
      const p2 = B('p2');
      const e = lt > B('stare').s && lt < p2.e + .2 ? 'shock' : lt >= p2.e + .2 ? 'sad' : 'grumpy';
      drawChar({ kind: 'prune', x: 870, y: 985, s: 1.35, noLegs: true, talk: talk('prune'), expr: e, look: lt > B('s2').s ? [-.9, .3] : [-.7, 0],
        browColor: '#f2f2f2', browW: 13, arms: lt > B('p1').s && lt < B('p1').e ? { l: 'flail', r: 'rest' } : { l: 'rest', r: 'rest' } });
      drawBedFront(740, 1130, '#c7a8e8', 1070);
      const s2 = B('s2'), offering = lt > s2.s - .1;
      drawChar(straw({ x: 280, talk: talk('straw'), expr: lt > p2.e ? 'sad' : offering ? 'happy' : 'neutral', look: [.8, 0],
        hold: offering ? { r: 'carton' } : { l: 'clipboard' }, arms: offering ? { l: 'rest', r: lt > p2.e + .3 ? 'hold' : 'offer' } : { l: 'hold', r: 'rest' }, clipText: 'BM LOG' }));
    },
    over(lt) {
      const n = B('n1'), p = seg(lt, n.s - .1, n.s + .3);
      if (p > 0) {
        ctx.save(); ctx.translate(540, 520); const s = easeBack(p); ctx.scale(s, s);
        ctx.fillStyle = '#2b2233'; ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 14; rr(-260, -250, 520, 520, 16); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#fff6c2'; ctx.lineWidth = 8; ell(0, -150, 90, 22); ctx.stroke();
        drawChar({ kind: 'prune', x: 0, y: -20, s: .95, center: true, noLegs: true, expr: 'happy', acc: ['sunglasses'], arms: { l: 'thumb', r: 'rest' }, t: lt });
        text('GARY', 0, 150, { size: 72, font: 'Bangers', weight: 400, fill: '#fff', spacing: 6 });
        text('Loving cousin. Great with fiber.', 0, 215, { size: 28, fill: '#e6d7ff', italic: true, maxW: 470 });
        for (const x of [-200, 200]) { ctx.fillStyle = '#fff4d6'; ctx.fillRect(x - 12, 170, 24, 70); const f = 1 + .15 * Math.sin(T * 20 + x); ctx.fillStyle = '#ffb347'; ell(x, 158, 11 * f, 20 * f); ctx.fill(); ctx.fillStyle = '#fff3a0'; ell(x, 162, 5, 10); ctx.fill(); }
        ctx.restore();
      }
    },
  },

  gfruit: {
    cam(lt) { const g1 = B('g1'); CAM.z = 1.02 + .18 * easeIO(seg(lt, B('enter').e - .3, g1.e)) - .16 * easeIO(seg(lt, B('p1').s, B('p1').s + .2)); CAM.x = lerp(540, 700, easeIO(seg(lt, B('enter').e - .3, g1.e)) * (1 - seg(lt, B('p1').s, B('p1').s + .2))); const b = seg(lt, 1.0 + B('enter').s, 1.4 + B('enter').s); CAM.shake = b > 0 && b < 1 ? 16 * (1 - b) : 0; },
    draw(lt) {
      bgMed();
      const en = B('enter'), open = easeIO(seg(lt, en.s + .1, en.s + .9)), reveal = seg(lt, en.s + 1.0, en.s + 1.25);
      medDoor(open, open * (1 - .4 * reveal));
      if (open > .2) drawChar({ kind: 'gfruit', x: 820, y: 1275, s: 1.15, talk: talk('gfruit'), expr: 'smug', look: [-.7, .1], acc: ['sunglasses', 'chain', 'toothpick'],
        arms: { l: lt > B('g1').s ? [1.2, -1.9] : 'rest', r: 'hips' }, filter: reveal < 1 ? `brightness(${lerp(.05, 1, reveal)})` : null, alpha: clamp((open - .2) * 3) });
      medCart(330, 1200);
      const p1 = B('p1'), p2 = B('p2'), run = seg(lt, p2.s + .15, p2.s + 1.1);
      const scared = lt > en.s + 1.0;
      [[480, 'SIMVASTATIN', 'pill1', 0], [660, 'ATORVASTATIN', 'pill2', .08]].forEach(([x0, label, who, d]) => {
        const r = seg(lt, p2.s + .1 + d, p2.s + 1.0 + d);
        const x = lerp(x0, -300, easeIn(r)), y = 1182 + (r > .45 ? Math.pow((r - .45) * 3, 2) * 200 : 0) - Math.abs(Math.sin(lt * 25)) * 12 * (r > 0 ? 1 : 0);
        drawChar({ kind: 'pill', x, y, s: 1.2, label, talk: talk(who), expr: scared ? 'panic' : 'neutral', look: scared ? [.8, 0] : [-.5, 0], shake: scared && r === 0 ? 5 : 0,
          walk: r > 0 ? lt * 30 : null, arms: r > 0 ? { l: 'run', r: 'run' } : scared ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, flip: false });
      });
      if (run > 0 && run < 1) speedLines(lerp(700, 0, run) + 300, 1150, 400, 1 - run);
      drawChar(straw({ x: 190, talk: talk('straw'), expr: scared ? 'angry' : 'neutral', look: scared ? [.9, 0] : [.5, .4], hold: scared ? {} : { r: 'medcup' }, arms: scared ? { l: 'rest', r: 'stop' } : { l: 'rest', r: 'offer' } }));
    },
    over(lt) {
      const n = B('n1'), p = seg(lt, n.s + .1, n.s + .45);
      if (p > 0) {
        ctx.save(); ctx.translate(lerp(1500, 560, easeBack(p)), 560); ctx.rotate(.05);
        ctx.fillStyle = '#f3e3c3'; ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8; rr(-280, -330, 560, 640, 10); ctx.fill(); ctx.stroke();
        text('WANTED', 0, -260, { size: 110, font: 'Bangers', weight: 400, fill: '#6b1a00', spacing: 8 });
        ctx.fillStyle = '#d9c7a3'; ctx.fillRect(-170, -190, 340, 280);
        drawChar({ kind: 'gfruit', x: 0, y: -50, s: .72, center: true, noLegs: true, expr: 'smug', acc: ['sunglasses'], noArms: true, t: lt });
        text('GRAPEFRUIT', 0, 130, { size: 56, font: 'Bangers', weight: 400, fill: '#6b1a00', spacing: 4 });
        text('CRIMES: CYP3A4 inhibition,', 0, 190, { size: 28, fill: '#3a2410' });
        text('statin toxicity, ruining your MAR', 0, 228, { size: 28, fill: '#3a2410' });
        text('LAST SEEN: breakfast tray', 0, 275, { size: 26, fill: '#6b1a00', italic: true });
        ctx.restore();
      }
    },
  },

  raisin: {
    cam(lt) { CAM.z = 1.02 + .05 * lt / CUR.dur; const L = B('later'); const sh = seg(lt, L.s + .75, L.s + 1.35); CAM.shake = sh > 0 && sh < 1 ? 8 : 0; },
    draw(lt) {
      const L = B('later'), after = lt > L.s + .35;
      bgRoom({ num: 9, wall: ['#ece0f6', '#d3bfe6'], board: [['NURSE: STRAWBERRY', '#d62828'], ['FLUIDS: ENCOURAGE!!!', '#d62828'], ['INTAKE: 0 mL'], ['GOAL: hydrate']] });
      windowDyn(after ? 'night' : 'dusk');
      drawBedBack(740, 1130);
      const sh = seg(lt, L.s + .75, L.s + 1.35);
      const r1 = B('r1');
      if (sh < .5) {
        const k = sh * 2;
        drawChar({ kind: 'grape', x: 870, y: 990 + k * 40, s: 1.35 * (1 - .45 * k), noLegs: true, talk: talk('grape'), expr: k > 0 ? 'shock' : after ? 'neutral' : 'happy', look: [-.7, 0],
          acc: ['bun', 'glasses'], colors: k > 0 ? [mixColor('#d9adef', '#a0704c', k), mixColor('#8e44ad', '#5a3219', k), mixColor('#3a1150', '#24100a', k)] : null,
          arms: lt > B('g1').s && lt < B('g1').e + .2 ? { l: 'stop', r: 'rest' } : { l: 'rest', r: 'rest' }, shake: k > 0 ? 6 : 0 });
      } else {
        const k = (sh - .5) * 2;
        drawChar({ kind: 'raisin', x: 870, y: 1040, s: 1.35 * lerp(.85, 1, easeBack(k)), noLegs: true, talk: talk('raisin'), expr: 'weak', look: [-.7, 0], acc: ['bun', 'glasses'],
          arms: lt > r1.s ? { l: 'reach', r: 'rest' } : { l: 'rest', r: 'rest' }, shake: k < 1 ? 5 : 0 });
      }
      drawBedFront(740, 1130, '#b7a3e8', 1080);
      overbedTable(560, 1180, true);
      const s1 = B('s1');
      drawChar(straw({ x: 250, talk: talk('straw'), expr: after ? 'dead' : 'happy', look: [.8, 0], hold: { r: 'cup' }, arms: { l: 'rest', r: lt > s1.s - .1 && !after ? 'offer' : 'hold' } }));
    },
    over(lt) {
      const L = B('later');
      timeCard(seg(lt, L.s, L.s + .75), '2 HOURS LATER', '#7a3fb0');
      const n = B('n1');
      factCard(seg(lt, n.s + .05, n.s + .45), 'NURSING DIAGNOSIS', [['DX', 'Deficient Fluid Volume'], ['R/T', '"I had a sip on Tuesday"'], ['AEB', 'Literally a raisin'], ['GOAL', 'Grape again by 0700']], 380, '#7a3fb0');
    },
  },

  banana: {
    cam(lt) { CAM.z = 1.02; const sl = B('slip'); const th = seg(lt, sl.s + 1.15, sl.s + 1.6); CAM.shake = th > 0 && th < 1 ? 22 * (1 - th) : 0; const n = B('n1'); const pe = seg(lt, n.e - .1, n.e + .4); if (pe > 0 && pe < 1) CAM.shake = 16 * (1 - pe); },
    draw(lt) {
      bgRoom({ num: 4, wall: ['#fff4cf', '#f6e3a3'], sign: true, board: [['NURSE: STRAWBERRY', '#d62828'], ['CALL, DON\'T FALL!!', '#d62828'], ['FALLS THIS WEEK: III'], ['BED ALARM: ON']] });
      windowDyn('night');
      drawBedBack(740, 1130);
      drawBedFront(740, 1130, '#ffe08a', 1100, lt > B('slip').s + 1.2);
      const sl = B('slip');
      // peel on the floor
      const peelX = 560 + easeOut(seg(lt, sl.s + .45, sl.s + 1.2)) * 380;
      ctx.save(); ctx.translate(peelX, 1440); ctx.rotate(seg(lt, sl.s + .45, sl.s + 1.2) * 4);
      ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      for (const a of [-1.2, 0, 1.2]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -70, 14, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#6b4a22'; ell(0, 0, 12, 8); ctx.fill();
      ctx.restore();
      // Mr. Banana: walk, slip, flip, land
      const walkP = seg(lt, sl.s, sl.s + .45), air = seg(lt, sl.s + .45, sl.s + 1.15);
      if (air <= 0) {
        drawChar({ kind: 'banana', x: lerp(980, 580, walkP), y: GROUND, s: 1.25, walk: lt * 14, expr: 'happy', look: [-.8, 0], arms: { l: 'rest', r: 'rest' }, flip: true });
      } else if (air < 1) {
        const x = lerp(580, 470, air), y = lerp(GROUND - 250, GROUND - 60, air) - Math.sin(air * PI) * 380;
        drawChar({ kind: 'banana', x, y, s: 1.25, center: true, rot: -air * (TAU + PI / 2), expr: 'panic', arms: { l: 'flail', r: 'flail' }, legs: 'kick', flip: true });
      } else {
        const n = B('n1');
        drawChar({ kind: 'banana', x: 520, y: GROUND - 75, s: 1.25, center: true, rot: -PI / 2, talk: talk('banana'), expr: lt < B('b1').s ? 'dead' : 'happy', look: [0, -.8], legs: 'splay', flip: true,
          arms: lt > B('b1').s && lt < B('b1').e ? { l: 'thumb', r: 'rest' } : { l: 'rest', r: 'rest' }, noShadow: true });
        // stars circling
        const sp = 1 - seg(lt, B('b1').s, B('b1').e);
        if (sp > 0) for (let i = 0; i < 4; i++) { const a = T * 5 + i * TAU / 4; ctx.save(); ctx.translate(380 + Math.cos(a) * 80, 1310 + Math.sin(a) * 22); ctx.globalAlpha = sp; ctx.fillStyle = '#ffe135'; ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 7 : 16, b = j * PI / 5; ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r); } ctx.fill(); ctx.restore(); }
        // the incident report
        const pe = seg(lt, n.e - .25, n.e + .05);
        if (pe > 0) {
          const y = lerp(-600, 0, easeIn(pe));
          ctx.save(); ctx.translate(820, 1450 + y);
          for (let i = 0; i < 26; i++) { ctx.fillStyle = i % 2 ? '#fdfdfd' : '#f0f0f0'; ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.fillRect(-120 + Math.sin(i * 2.1) * 6, -i * 26 - 26, 240, 26); ctx.strokeRect(-120 + Math.sin(i * 2.1) * 6, -i * 26 - 26, 240, 26); }
          ctx.fillStyle = '#fff'; ctx.fillRect(-130, -720, 260, 40);
          text('INCIDENT REPORT', 0, -700, { size: 26, fill: '#d62828' });
          text('(page 1 of 17)', 0, -660, { size: 20, fill: INK, italic: true });
          ctx.restore();
        }
      }
      const en = easeOut(seg(lt, sl.s + 1.3, sl.s + 1.9));
      if (en > 0) drawChar(straw({ x: lerp(-250, 190, en), walk: en < 1 ? lt * 16 : null, talk: talk('straw'), expr: 'dead', look: [.7, .8], arms: { l: 'hips', r: 'hips' } }));
    },
    over(lt) {},
  },

  doctor: {
    cam(lt) { CAM.z = 1.04; CAM.x = 500; },
    draw(lt) {
      bgStation();
      const n = B('n1');
      stationDyn({ clock: '9:15', lights: 9, spin: easeIO(seg(lt, n.s + .6, n.e)) });
      // coiled cord
      ctx.strokeStyle = '#d8cfbd'; ctx.lineWidth = 5; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40; ctx.lineTo(lerp(300, 420, u) + Math.sin(u * 60) * 8, lerp(1030, 1010, u) + Math.sin(u * PI) * 60 + Math.cos(u * 60) * 8); }
      ctx.stroke();
      const r = B('ring'), a1 = B('a1');
      drawChar(straw({ x: 330, talk: talk('straw'), expr: lt < a1.s ? 'sour' : lt < B('beat').s ? 'dead' : 'dead', look: lt > B('beat').s ? [0, .15] : [.4, -.3], hold: { r: 'handset' }, arms: { l: 'hips', r: 'phone' }, legs: lt < a1.s ? 'tap' : null }));
      if (lt < a1.s) text('RING... RING...', 520, 800 + Math.sin(lt * 10) * 4, { size: 48, font: 'Bangers', weight: 400, fill: '#fff', lw: 10, alpha: seg(lt, .1, .3) });
    },
    over(lt) {
      const a1 = B('a1'), p = seg(lt, a1.s - .3, a1.s + .1) * (1 - seg(lt, a1.e + .5, a1.e + .8));
      if (p > 0) {
        ctx.save(); ctx.translate(lerp(1400, 770, easeBack(p)), 700); ctx.rotate(.04);
        ctx.fillStyle = '#111'; rr(-230, -420, 460, 840, 60); ctx.fill();
        ctx.fillStyle = '#f2f2f7'; rr(-210, -400, 420, 800, 44); ctx.fill();
        text('Voicemail', 0, -340, { size: 36, fill: '#111' });
        // beach photo of Dr. Apple
        ctx.save(); rr(-170, -300, 340, 340, 28); ctx.clip();
        const g = ctx.createLinearGradient(0, -300, 0, 40); g.addColorStop(0, '#46b6ff'); g.addColorStop(.6, '#9fe1ff'); g.addColorStop(.61, '#2a9dd8'); g.addColorStop(.75, '#f3d9a4'); g.addColorStop(1, '#e8c98a');
        ctx.fillStyle = g; ctx.fillRect(-170, -300, 340, 340);
        ctx.fillStyle = '#fff3a0'; ell(110, -240, 34, 34); ctx.fill();
        ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-140, 40); ctx.quadraticCurveTo(-120, -120, -90, -200); ctx.stroke();
        for (let i = 0; i < 5; i++) leaf(-90, -200, -1.8 + i * .75, 110, 22, '#3fae3a');
        drawChar({ kind: 'apple', x: 20, y: -90, s: .88, center: true, noLegs: true, talk: talk('apple'), expr: 'happy', acc: ['sunglasses', 'headmirror'], arms: { l: 'thumb', r: 'rest' }, t: lt });
        // cocktail
        ctx.fillStyle = 'rgba(255,120,160,.9)'; ctx.beginPath(); ctx.moveTo(90, -40); ctx.lineTo(150, -40); ctx.lineTo(120, 0); ctx.fill(); ctx.fillStyle = '#ccc'; ctx.fillRect(117, 0, 6, 30);
        ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(100, -40); ctx.lineTo(145, -75); ctx.lineTo(150, -40); ctx.fill();
        ctx.restore();
        text('Dr. Apple', 0, 90, { size: 44, fill: '#111' });
        text('Away. Always away.', 0, 136, { size: 26, fill: '#777', italic: true });
        // waveform
        for (let i = 0; i < 26; i++) { const v = talk('apple') * (.4 + .6 * Math.abs(Math.sin(i * 1.7 + T * 12))); ctx.fillStyle = '#2a6fdb'; rr(-180 + i * 14, 220 - 6 - v * 50, 8, 12 + v * 100, 4); ctx.fill(); }
        ctx.fillStyle = '#e53935'; ell(0, 340, 36, 36); ctx.fill(); ctx.fillStyle = '#fff'; rr(-14, 334, 28, 12, 3); ctx.fill();
        ctx.restore();
      }
      const n = B('n1'), q = seg(lt, n.s + .5, n.s + .9);
      if (q > 0) {
        ctx.save(); ctx.translate(540, lerp(-200, 330, easeBack(q)));
        ctx.fillStyle = 'rgba(245,245,250,.97)'; rr(-470, -80, 940, 160, 34); ctx.fill();
        ctx.fillStyle = '#e53935'; rr(-440, -52, 104, 104, 24); ctx.fill();
        drawChar({ kind: 'apple', x: -388, y: 0, s: .32, center: true, noLegs: true, noArms: true, expr: 'smug', t: lt });
        text('DR. APPLE', -310, -30, { size: 34, fill: '#111', align: 'left' });
        text('Returning your call at 3:00 AM', -310, 18, { size: 30, fill: '#444', align: 'left', weight: 700 });
        ctx.restore();
      }
    },
  },

  pine: {
    cam(lt) {
      const st = B('stomp'); const n = B('n1');
      let sh = 0; for (const d of [0, .26, .52]) { const q = seg(lt, st.s + d, st.s + d + .2); if (q > 0 && q < 1) sh = Math.max(sh, 16 * (1 - q)); }
      CAM.shake = sh;
      const z = easeIO(seg(lt, n.s, n.s + .8));
      CAM.z = lerp(1.02, 1.7, z); CAM.x = lerp(540, 800, z); CAM.y = lerp(960, 900, z);
    },
    draw(lt) {
      bgHall(false); hallLights([[200, true], [860, false]]);
      const st = B('stomp');
      const inP = seg(lt, st.s, st.s + .7);
      const step = Math.floor(inP * 3);
      const x = lerp(1350, 800, easeOut(inP));
      const p1 = B('p1'), p2 = B('p2'), n = B('n1');
      drawChar({ kind: 'pine', x, y: GROUND, s: 1.4, talk: talk('pine'), expr: 'angry', look: [-.8, 0], acc: ['sunglassesHead'], hold: { r: 'purse' }, walk: inP < 1 ? step * PI + inP * 9 : null,
        arms: lt > p1.s && lt < p2.s ? { l: 'point', r: 'hold' } : lt >= p2.s ? { l: 'hips', r: 'hold' } : { l: 'rest', r: 'hold' }, flip: true, shake: lt > p1.s && lt < p1.e ? 2 : 0 });
      drawChar(straw({ x: 270, talk: talk('straw'), expr: lt > p1.s ? 'dead' : 'neutral', look: [.8, 0], arms: lt > B('s1').s && lt < B('s1').e + .3 ? { l: 'shrug', r: 'shrug' } : { l: 'rest', r: 'rest' } }));
      // documentary callout on the crown
      const c = seg(lt, n.s + .6, n.s + 1.0);
      if (c > 0) {
        ctx.save(); ctx.strokeStyle = '#ffe135'; ctx.lineWidth = 8; ctx.setLineDash([22, 12]); ctx.lineDashOffset = -T * 60;
        ctx.beginPath(); ctx.ellipse(835, 830, 200 * easeBack(c), 150 * easeBack(c), -.2, 0, TAU); ctx.stroke(); ctx.restore();
      }
    },
    over(lt) {
      const n = B('n1'), c = seg(lt, n.s + 1.2, n.s + 1.6);
      factCard(c, 'RARE FORMATION', [['LATIN NAME', 'Ananas managerus'], ['SEEN', 'Every visiting hour'], ['THREAT LEVEL', 'State survey']], 300, '#f4a300');
    },
  },

  coco: {
    cam(lt) {
      const sc = B('scream'); const z = easeOut(seg(lt, sc.s, sc.s + .25));
      CAM.z = lerp(1.02, 2.6, z); CAM.x = lerp(540, 300, z); CAM.y = lerp(960, 1040, z); CAM.shake = z * 9;
    },
    draw(lt) {
      bgStation();
      stationDyn({ clock: '10:55', lights: 12 });
      ctx.fillStyle = 'rgba(20,20,60,.28)'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
      const ro = B('roll'), c1 = B('c1'), sc = B('scream');
      if (lt > ro.s) { const on = Math.sin(T * 14) > 0; ctx.fillStyle = on ? 'rgba(255,30,60,.16)' : 'rgba(40,90,255,.16)'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2); }
      const rp = easeOut(seg(lt, ro.s + .1, ro.s + 1.1));
      const gx = lerp(1450, 800, rp);
      // stretcher
      ctx.fillStyle = '#6d747e'; ctx.fillRect(gx - 200, 1300, 400, 18); for (const dx of [-170, 150]) { ctx.fillRect(gx + dx, 1318, 14, 90); ctx.fillStyle = '#222'; ell(gx + dx + 7, 1412, 18, 18); ctx.fill(); ctx.fillStyle = '#6d747e'; }
      ctx.fillStyle = '#e9edf2'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(gx - 220, 1250, 440, 56, 14); ctx.fill(); ctx.stroke();
      drawChar({ kind: 'coco', x: gx + 20, y: 1150, s: 1.25, noLegs: true, talk: talk('coco'), expr: 'chill', look: [-.8, 0], acc: ['sunglasses', 'lei'],
        hold: lt > c1.s + .6 ? { l: 'sticky' } : {}, arms: lt > c1.s + .6 ? { l: 'offer', r: [.9, -1.8] } : { l: 'rest', r: [.9, -1.8] } });
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(gx - 200, 1230, 300, 40, 12); ctx.fill(); ctx.stroke();
      const scared = lt > sc.s;
      drawChar(straw({ x: 290, talk: talk('straw'), expr: scared ? 'panic' : lt > ro.s + .3 ? 'shock' : 'hopeful', look: scared ? [0, 0] : lt > ro.s + .3 ? [.8, 0] : [.3, -.9], acc: ['steth', 'badge', 'bag'], twitch: scared,
        arms: scared ? { l: [.2, 0], r: [.2, 0] } : { l: 'rest', r: 'rest' }, shake: scared ? 4 : 0 }));
    },
    over(lt) {
      const sc = B('scream'), n = B('n1');
      // freedom progress bar
      const a = seg(lt, n.s, n.s + .3) * (1 - seg(lt, sc.s + 1.2, sc.s + 1.5));
      if (a > 0) {
        const pct = lt < sc.s ? lerp(.9, .98, seg(lt, n.s, n.e)) : lerp(.98, 0, easeOut(seg(lt, sc.s, sc.s + .4)));
        ctx.save(); ctx.globalAlpha = a; ctx.translate(540, 420);
        ctx.fillStyle = 'rgba(12,10,18,.85)'; rr(-440, -70, 880, 150, 24); ctx.fill();
        text(lt < sc.s ? 'FREEDOM LOADING...' : 'ADMISSION: 3 HRS OF CHARTING', 0, -30, { size: 38, fill: lt < sc.s ? '#7dff9a' : '#ff3b55', font: 'Bangers', weight: 400, spacing: 2 });
        ctx.fillStyle = '#333'; rr(-400, 10, 800, 44, 22); ctx.fill();
        ctx.fillStyle = lt < sc.s ? '#2ecc71' : '#e8193a'; rr(-400, 10, Math.max(44, 800 * pct), 44, 22); ctx.fill();
        text(Math.round(pct * 100) + '%', 0, 33, { size: 30, fill: '#fff', lw: 6 });
        ctx.restore();
      }
      if (lt > sc.s + .15) {
        const q = seg(lt, sc.s + .15, sc.s + .45);
        ctx.save(); ctx.translate(540 + vnoise(T * 40) * 10, 1500 + vnoise(T * 37) * 10); ctx.rotate(-.05);
        text('*internal', 0, -70, { size: 110 * easeBack(q), font: 'Bangers', weight: 400, fill: '#fff', lw: 16, spacing: 3 });
        text('screaming*', 0, 60, { size: 130 * easeBack(q), font: 'Bangers', weight: 400, fill: '#ff3b55', lw: 16, spacing: 3 });
        ctx.restore();
      }
    },
  },

  jam: {
    cam(lt) { const n = B('n1'); const z = easeIO(seg(lt, B('melt').s, B('melt').s + 1.5)) * (1 - easeIO(seg(lt, n.s - .3, n.s + .3))); CAM.z = 1.02 + .35 * z; CAM.x = lerp(540, 500, z); CAM.y = lerp(960, 1180, z); },
    draw(lt) {
      bgHall(true);
      const w = B('walk'), l1 = B('l1'), m = B('melt'), n = B('n1');
      const block = seg(lt, l1.s - .3, l1.s - .05);
      exitDyn(seg(lt, w.s, w.s + .8) * (1 - block));
      const lx = lerp(1350, 820, easeOut(block));
      const wp = seg(lt, w.s, w.e);
      const sx = lerp(100, 400, easeIO(wp));
      const mp = seg(lt, m.s + .35, m.s + 1.4);
      if (mp <= 0) {
        drawChar(straw({ x: sx, walk: wp > 0 && wp < 1 && block === 0 ? lt * 13 : null, talk: talk('straw'), expr: block > 0 ? 'shock' : 'happy', look: block > 0 ? [.8, -.1] : [.8, -.3],
          acc: ['steth', 'badge', 'bag'], arms: block > 0 ? { l: 'down', r: 'down' } : { l: 'rest', r: 'rest' } }));
      } else if (lt < n.s - .1) {
        // melting into jam
        const k = easeIn(mp);
        const puddle = seg(mp, .55, 1);
        if (puddle > 0) {
          ctx.save(); ctx.translate(sx, GROUND - 10);
          const pw = lerp(120, 330, easeOut(puddle));
          ctx.fillStyle = '#c4001f'; ctx.strokeStyle = '#5a0010'; ctx.lineWidth = 5;
          ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = 1 + .08 * Math.sin(a * 6 + lt); ctx.lineTo(Math.cos(a) * pw * r, Math.sin(a) * pw * .22 * r); } ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-pw * .3, -pw * .06, pw * .25, pw * .04); ctx.fill();
          ctx.fillStyle = '#ffe58a'; for (let i = 0; i < 16; i++) { ell((hash(i) - .5) * pw * 1.6, (hash(i + 3) - .5) * pw * .3, 4, 6); ctx.fill(); }
          ctx.restore();
        }
        if (puddle < 1) drawChar(straw({ x: sx, s: 1.45, expr: 'dead', look: [0, .2], acc: ['steth', 'badge', 'bag'], sy: 1 - .8 * k, sx: 1 + .8 * k, noLegs: k > .3, y: GROUND - (k > .3 ? 150 * (1 - k) : 0), alpha: 1 - puddle, arms: { l: 'down', r: 'down' } }));
        if (puddle > .4) { // eyes floating in the puddle
          ctx.save(); ctx.translate(sx, GROUND - 22);
          for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(s * 34, 0, 22, 18); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ell(s * 34, 3, 9, 9); ctx.fill(); ctx.fillStyle = '#c4001f'; ctx.fillRect(s * 34 - 23, -20, 46, 16); }
          ctx.restore();
        }
      } else {
        // the jar
        const jp = easeBack(seg(lt, n.s - .1, n.s + .3));
        ctx.save(); ctx.translate(sx, GROUND); ctx.scale(jp, jp);
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 0, 150, 18); ctx.fill();
        ctx.fillStyle = 'rgba(210,235,255,.5)'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-140, -380, 280, 380, 40); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b3001f'; rr(-128, -330, 256, 320, 30); ctx.fill();
        ctx.fillStyle = '#ffe58a'; for (let i = 0; i < 20; i++) { ell((hash(i) - .5) * 220, -40 - hash(i + 5) * 270, 4, 6); ctx.fill(); }
        ctx.fillStyle = '#e8c07a'; ctx.strokeStyle = INK; rr(-155, -420, 310, 56, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff6e0'; rr(-120, -250, 240, 140, 12); ctx.fill(); ctx.stroke();
        text('STRAWBERRY', 0, -222, { size: 30, fill: '#b3001f', font: 'Bangers', weight: 400, spacing: 2 });
        text('JAM', 0, -180, { size: 46, fill: '#b3001f', font: 'Bangers', weight: 400, spacing: 4 });
        text('fresh off the 3-11', 0, -136, { size: 20, fill: INK, italic: true });
        const blink = (lt % 2.2) < .12;
        for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(s * 36, -300, 20, blink ? 3 : 22); ctx.fill(); ctx.stroke(); if (!blink) { ctx.fillStyle = INK; ell(s * 36, -296, 9, 9); ctx.fill(); } }
        ctx.restore();
      }
      if (block > 0) drawChar({ kind: 'lemon', x: lx, y: GROUND, s: 1.45, talk: talk('lemon'), expr: lt > n.s ? 'neutral' : 'sour', look: lt > m.s + .5 ? [-.6, .8] : [-.8, 0], acc: ['readers', 'lanyard'],
        hold: { l: 'clipboard' }, arms: lt > n.s ? { l: 'hold', r: 'shrug' } : { l: 'hold', r: 'rest' }, clipText: 'OT SIGN-UP' });
    },
    over(lt) {},
  },

  end: {
    cam() {},
    draw(lt) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b0f3a'); g.addColorStop(1, '#4a0d3d');
      ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
      for (let i = 0; i < 60; i++) { const x = (hash(i) * W + Math.sin(T + i) * 30), y = ((hash(i + 9) * H + lt * (120 + hash(i + 4) * 200)) % (H + 100)) - 50; ctx.save(); ctx.translate(x, y); ctx.rotate(T * 2 + i); ctx.fillStyle = ['#ffe135', '#ff3b55', '#5b6cff', '#2ecc71', '#ff9f1c'][i % 5]; ctx.fillRect(-8, -4, 16, 8); ctx.restore(); }
      const cast = [['cherry', {}], ['lemon', { acc: ['readers'] }], ['blue', { acc: ['glasses', 'mustache'], browColor: '#eee' }], ['cran', { acc: ['curlers'] }], ['prune', { browColor: '#eee' }], ['gfruit', { acc: ['sunglasses'] }],
        ['raisin', { acc: ['bun', 'glasses'] }], ['banana', {}], ['pine', { acc: ['sunglassesHead'] }], ['coco', { acc: ['sunglasses', 'lei'] }], ['apple', { acc: ['headmirror'] }], ['pill', { label: 'STATIN' }]];
      cast.forEach(([kind, extra], i) => {
        const row = i < 6 ? 0 : 1, col = i % 6;
        const x = 110 + col * 172, y = row ? 1760 : 1560;
        const hop = Math.abs(Math.sin(lt * 5 + i)) * 26;
        const pop = easeBack(seg(lt, .8 + i * .08, 1.1 + i * .08));
        if (pop > 0) drawChar(Object.assign({ kind, x, y: y - hop, s: .55 * pop, expr: 'happy', arms: { l: 'cheer', r: 'wave' }, t: lt + i }, extra));
      });
    },
    over(lt) {
      logo(540, 430, easeBack(seg(lt, 0, .35)) * .8);
      const lines = [['Dedicated to every nurse', 44, '#fff', .9], ["who hasn't peed since 2:45 PM.", 44, '#ffe135', 1.3], ['Drink water. Take your break.', 40, '#fff', 2.0], ['(You won\'t.)', 40, '#ff8fa3', 2.6]];
      lines.forEach(([s, size, c, at], i) => text(s, 540, 820 + i * 70, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 8 }));
      const r = seg(lt, 3.3, 3.6);
      if (r > 0) banner(r, 'SEASON 2: EVERY OTHER WEEKEND', 1220, '#2a6fdb', '#fff', 58, .03);
    },
  },

  post: {
    cam(lt) { const a1 = B('a1'); const z = easeOut(seg(lt, a1.e, a1.e + .3)); CAM.z = lerp(1.05, 1.9, z); CAM.x = lerp(540, 470, z); CAM.y = lerp(960, 980, z); CAM.shake = z * 8; },
    draw(lt) {
      bgBedroom();
      const r = B('ringing'), a1 = B('a1');
      const up = lt > r.e - .2;
      // bed
      ctx.fillStyle = '#3a3566'; rr(80, 1100, 820, 280, 30); ctx.fill();
      ctx.fillStyle = '#e9e4f5'; ell(760, 1080, 150, 60); ctx.fill();
      drawChar(straw({ x: up ? 560 : 700, y: up ? 1020 : 1070, s: 1.3, noLegs: true, rot: up ? 0 : -1.2, talk: talk('straw'), expr: up ? (lt > a1.e ? 'angry' : 'dead') : 'sleep', look: [0, .2], cap: false, acc: ['mask'], maskUp: up,
        hold: up ? { r: 'cell' } : {}, arms: up ? { l: 'rest', r: 'phone' } : { l: 'down', r: 'down' }, colors: lt > a1.e ? ['#ff6060', '#ff0020', '#700010'] : null, shake: lt > a1.e ? 6 : 0 }));
      ctx.fillStyle = '#5b4fa0'; ctx.strokeStyle = '#231c4a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(60, 1400); ctx.lineTo(60, 1180); ctx.quadraticCurveTo(300, up ? 1140 : 1100, up ? 460 : 520, up ? 1130 : 1080); ctx.quadraticCurveTo(700, 1150, 920, 1180); ctx.lineTo(920, 1400); ctx.closePath(); ctx.fill(); ctx.stroke();
      // nightstand + phone + clock
      ctx.fillStyle = '#4a3b2a'; rr(910, 1140, 170, 260, 12); ctx.fill();
      ctx.fillStyle = '#111'; rr(930, 1070, 110, 60, 8); ctx.fill(); text('3:00', 985, 1101, { size: 40, fill: '#ff3030', font: 'Bangers', weight: 400 });
      if (!up) {
        const buzz = Math.sin(lt * 60) * 4;
        ctx.save(); ctx.translate(975 + buzz, 1150);
        const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 260); glow.addColorStop(0, 'rgba(120,200,255,.5)'); glow.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = glow; ctx.fillRect(-260, -260, 520, 520);
        ctx.fillStyle = '#111'; rr(-40, -16, 80, 30, 6); ctx.fill(); ctx.fillStyle = '#7fd3ff'; rr(-34, -12, 68, 22, 4); ctx.fill();
        ctx.restore();
        text('Bzzzt', 975 + buzz, 1020, { size: 40, font: 'Bangers', weight: 400, fill: '#7fd3ff', lw: 8, alpha: seg(lt, r.s, r.s + .2) });
        // Zzz
        for (let i = 0; i < 3; i++) { const q = ((lt * .6 + i / 3) % 1); text('Z', 640 + q * 80 + i * 10, 860 - q * 160, { size: 40 + i * 16, font: 'Bangers', weight: 400, fill: '#c9c3ff', alpha: (1 - q) * (1 - seg(lt, r.s, r.s + .5)) }); }
      }
      if (lt > a1.e) { // steam
        for (let i = 0; i < 6; i++) { const q = ((lt * 1.8 + i / 6) % 1); ctx.fillStyle = `rgba(255,255,255,${.6 * (1 - q)})`; ell(560 + (i % 2 ? 1 : -1) * (80 + q * 60), 800 - q * 200, 30 + q * 40, 24 + q * 30); ctx.fill(); }
      }
    },
    over(lt) {
      const r = B('ringing');
      if (lt < r.e + .1 && lt > r.s) {
        ctx.save(); ctx.translate(540, lerp(-200, 330, easeBack(seg(lt, r.s, r.s + .35))));
        ctx.fillStyle = 'rgba(245,245,250,.97)'; rr(-470, -80, 940, 160, 34); ctx.fill();
        ctx.fillStyle = '#e53935'; rr(-440, -52, 104, 104, 24); ctx.fill();
        drawChar({ kind: 'apple', x: -388, y: 0, s: .32, center: true, noLegs: true, noArms: true, expr: 'happy', t: lt });
        text('DR. APPLE', -310, -30, { size: 34, fill: '#111', align: 'left' });
        text('Incoming call... (3:00 AM)', -310, 18, { size: 30, fill: '#444', align: 'left', weight: 700 });
        ctx.restore();
      }
      const f = seg(lt, CUR.dur - .7, CUR.dur);
      if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); text('SHIFT HAPPENS', 540, 960, { size: 110, font: 'Bangers', weight: 400, fill: '#ffe135', alpha: f, spacing: 4 }); }
    },
  },
};

// ------------------------------------------------------------------ frame
function renderAt(t) {
  T = clamp(t, 0, TL.duration - 1e-3);
  CUR = sceneAt(T);
  const lt = T - CUR.start;
  const S = SCENES[CUR.id];
  ctx = mainCtx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  CAM = { z: 1, x: W / 2, y: H / 2, r: 0, shake: 0 };
  S.cam(lt);
  const trans = CUR.id !== 'title' ? 1 - easeOut(seg(lt, 0, .35)) : 0;
  ctx.save();
  const dx = CAM.shake * vnoise(T * 37), dy = CAM.shake * vnoise(T * 41 + 50);
  ctx.translate(W / 2 + dx, H / 2 + dy); ctx.rotate(CAM.r + trans * .03);
  const z = CAM.z * (1 + .1 * trans);
  ctx.scale(z, z); ctx.translate(-CAM.x, -CAM.y);
  S.draw(lt);
  ctx.restore();
  grain();
  S.over(lt);
  if (CUR.id !== 'title' && CUR.id !== 'end') { drawChip(CUR, lt); drawWatermark(); }
  drawCaption(T);
  if (trans > 0) { ctx.fillStyle = `rgba(255,255,255,${.75 * trans * trans})`; ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ playback / capture
async function fontsReady() {
  await Promise.all([document.fonts.load('400 40px Bangers'), document.fonts.load('400 40px Lucky'), document.fonts.load('900 40px Nunito'), document.fonts.load('italic 800 40px Nunito'), document.fonts.load('700 40px Nunito')]);
}
window.renderAt = renderAt;
window.captureFrames = (start, n) => {
  const out = [];
  for (let i = 0; i < n; i++) { renderAt((start + i) / FPS); out.push(canvas.toDataURL(window.FMT || 'image/jpeg', window.Q || .93)); }
  return out;
};
window.READY = fontsReady().then(() => { renderAt(0); return TL.duration; });

if (new URLSearchParams(location.search).has('capture')) {
  document.body.classList.add('capture');
} else {
  const audio = document.getElementById('audio'), btn = document.getElementById('play');
  let playing = false;
  const loop = () => { renderAt(audio.currentTime); if (playing) requestAnimationFrame(loop); };
  btn.addEventListener('click', () => { audio.currentTime = audio.ended ? 0 : audio.currentTime; audio.play(); playing = true; btn.style.display = 'none'; loop(); });
  audio.addEventListener('ended', () => { playing = false; btn.style.display = ''; btn.querySelector('span').textContent = 'Watch again'; });
  window.READY.then(() => renderAt(1.2));
}
