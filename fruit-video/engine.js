'use strict';
/* SHIFT HAPPENS engine -- characters, sets, overlays and the frame driver shared by every episode.
 * Everything is drawn procedurally on a 1080x1920 canvas. renderAt(t) is a pure
 * function of time, so the same code drives live playback and frame capture.
 * Episode files (ep1.js, ep2.js) register their scenes in EPISODES. */

const W = 1080, H = 1920;
let TL = null;
const FPS = 30;
const EPISODES = {};
let EP = null;
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
  if (REG.on && !REG.suppress) {
    const w = ctx.measureText(str).width;
    if (maxW && w > maxW * 1.15) REG.errors.push(`squished text "${str}" (${Math.round(maxW / w * 100)}% width)`);
    if (REG.phase === 'over') {
      const ww = maxW ? Math.min(w, maxW) : w, x0 = align === 'left' ? 0 : align === 'right' ? -ww : -ww / 2;
      reg('otext', screenBox(x0, -size * .6, x0 + ww, size * .6), { name: str });
    }
  }
  ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// ------------------------------------------------------------------ layout audit
// While REG.on, drawing calls record screen-space boxes (faces, heads, bodies, held props,
// foreground set pieces, key signs, overlays, the caption panel). audit() then proves that
// nothing important is covered by something drawn later, and nothing is cut off.
const REG = { on: false, items: [], errors: [], order: 0, suppress: 0, phase: 'world' };
function screenBox(x0, y0, x1, y1) {
  const m = ctx.getTransform();
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
    const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f;
    a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y);
  }
  return [a, b, c, d];
}
function reg(type, box, meta = {}) {
  if (!REG.on || REG.suppress) return;
  REG.items.push(Object.assign({ type, box, order: REG.order++ }, meta));
}
function regLocal(type, x0, y0, x1, y1, meta) { if (REG.on && !REG.suppress) reg(type, screenBox(x0, y0, x1, y1), meta); }
const regKey = (id, x0, y0, x1, y1) => regLocal('key', x0, y0, x1, y1, { id });

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
  star:   { rx: 150, ry: 150, shape: 'star', c: ['#fbf6a6', '#dcd43c', '#6f7a12'], eyeY: -12, eyeX: 26, mouthY: 22, er: 18, mw: 20, leg: 70, hip: 60, shoe: '#2b2b33', shoe2: '#55525c' },
  melon:  { rx: 136, ry: 128, shape: 'round', tex: 'net', c: ['#f9e3b8', '#dcae70', '#86582a'], eyeY: -26, eyeX: 40, mouthY: 18, leg: 90, hip: 44, shoe: '#221c16', shoe2: '#4a3a2c' },
  kiwi:   { rx: 100, ry: 118, shape: 'round', tex: 'fuzz', c: ['#b89a68', '#7f5f36', '#3d2a14'], eyeY: -16, eyeX: 33, mouthY: 30, er: 20, leg: 88, hip: 32, shoe: '#f4f4f8', shoe2: '#b9c4d0' },
  capsule:{ rx: 50, ry: 80, shape: 'capsule', c: ['#ffffff', '#f0f0f0', '#b8b8b8'], eyeY: -8, eyeX: 18, mouthY: 20, er: 12, mw: 14, leg: 40, hip: 18, shoe: '#ffffff', shoe2: '#dddddd', arm1: 30, arm2: 28 },
  fig:    { rx: 116, ry: 132, shape: 'fig', c: ['#c58fbc', '#74325f', '#2a0b22'], eyeY: 8, eyeX: 36, mouthY: 52, leg: 86, hip: 36, shoe: '#1b1b1f', shoe2: '#3a3a40' },
  clem:   { rx: 104, ry: 100, shape: 'round', tex: 'peel', c: ['#ffc36e', '#ff8c1a', '#b24a00'], eyeY: -12, eyeX: 34, mouthY: 28, leg: 86, hip: 32, shoe: '#ffffff', shoe2: '#8fd3ff' },
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
    case 'capsule':
      p.roundRect(-rx, -ry, rx * 2, ry * 2, rx);
      break;
    case 'fig': // a teardrop: narrow neck on top, round bottom
      p.moveTo(0, -ry);
      p.bezierCurveTo(rx * .22, -ry, rx * .3, -ry * .72, rx * .55, -ry * .42);
      p.bezierCurveTo(rx * 1.02, -ry * .05, rx * 1.08, ry * .55, rx * .62, ry * .88);
      p.bezierCurveTo(rx * .35, ry * 1.04, -rx * .35, ry * 1.04, -rx * .62, ry * .88);
      p.bezierCurveTo(-rx * 1.08, ry * .55, -rx * 1.02, -ry * .05, -rx * .55, -ry * .42);
      p.bezierCurveTo(-rx * .3, -ry * .72, -rx * .22, -ry, 0, -ry);
      break;
    case 'star': {
      const r0 = rx * .54, pts = [];
      for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? r0 : rx; pts.push([Math.cos(a) * R, Math.sin(a) * R * ry / rx]); }
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const m0 = mid(pts[9], pts[0]); p.moveTo(m0[0], m0[1]);
      for (let i = 0; i < 10; i++) { const v = pts[i], m = mid(pts[i], pts[(i + 1) % 10]); p.quadraticCurveTo(v[0], v[1], m[0], m[1]); }
      break;
    }
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

const TOPS = { straw: 200, cherry: 225, lemon: 150, blue: 115, cran: 100, prune: 140, gfruit: 150, grape: 128, raisin: 62,
  banana: 168, apple: 150, pine: 280, coco: 115, pill: 100, star: 152, melon: 134, kiwi: 124, capsule: 84, fig: 158, clem: 150 };
function headTop(o, k) {
  let top = TOPS[o.kind] ?? k.ry * 1.05;
  const acc = o.acc || [];
  if (o.kind === 'straw' && o.cap === false) top = 180;
  if (acc.includes('bun')) top = Math.max(top, k.ry * 1.02 + 40 * k.rx / 100);
  if (acc.includes('curlers')) top = Math.max(top, k.ry * .9 + 32);
  if (acc.includes('bouffant')) top = Math.max(top, k.ry + 34);
  if (acc.includes('fedora')) top = Math.max(top, k.ry * .66 + 72);
  if (acc.includes('santa')) top = Math.max(top, k.ry * .8 + 146 * k.rx / 110);
  if (acc.includes('halo')) top = Math.max(top, k.ry + 50);
  return top;
}
function drawChar(o) {
  const k = KINDS[o.kind], s = o.s || 1, t = o.t ?? T;
  if (o.who && o.talk == null) o.talk = talk(o.who);
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
  const emph = o.who ? 1 + .03 * (o.talk || 0) : 1;
  ctx.scale((o.flip ? -1 : 1) * (1 + sq * .35) * (o.sx || 1), (1 - sq * .35) * (o.sy || 1) * emph);
  FLIP = !!o.flip;
  if (REG.on && !REG.suppress) {
    const id = o.id || o.kind, top = -headTop(o, k), bot = o.noLegs ? k.ry : k.ry * .8 + legLen + 22;
    const faceTop = k.eyeY - k.er * 2.9;
    regLocal('body', -k.rx * 1.08, top, k.rx * 1.08, bot, { id, transit: o.transit });
    if (!o.noFace) regLocal('head', -k.rx * .9, top, k.rx * .9, faceTop, { id, transit: o.transit });
  }
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
  const hipY = k.shape === 'straw' ? k.ry * .7 : k.shape === 'banana' ? k.ry * .78 : k.shape === 'star' ? k.ry * .74 : k.ry * .8;
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
  if (k.tex === 'net') {
    ctx.strokeStyle = 'rgba(250,236,205,.85)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    const pt = (i, j) => [i * 30 + (j % 2 ? 15 : 0) + (srand(i * 7 + j * 13) - .5) * 12, j * 26 + (srand(i * 11 + j * 5) - .5) * 10];
    for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
      const [x, y] = pt(i, j);
      if (Math.hypot(x / (rx * .62), (y - (k.eyeY + 20)) / (ry * .46)) < 1) continue;
      for (const [a, b] of [pt(i + 1, j), pt(i, j + 1)]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + a) / 2 + 3, (y + b) / 2 - 3, a, b); ctx.stroke(); }
    }
    return;
  }
  if (k.tex === 'peel') {
    for (let i = 0; i < 170; i++) {
      const x = (srand(i) * 2 - 1) * rx, y = (srand(i + 400) * 2 - 1) * ry;
      if (Math.hypot(x / (rx * .64), (y - k.eyeY - 20) / (ry * .46)) < 1) continue;
      ctx.fillStyle = i % 5 ? 'rgba(170,70,0,.22)' : 'rgba(255,230,170,.35)'; ell(x, y, 2.6, 2.6); ctx.fill();
    }
    return;
  }
  if (k.tex === 'fuzz') {
    ctx.lineCap = 'round';
    for (let i = 0; i < 220; i++) {
      const x = (srand(i) * 2 - 1) * rx, y = (srand(i + 300) * 2 - 1) * ry;
      if (Math.hypot(x / (rx * .62), (y - k.eyeY - 22) / (ry * .44)) < 1) continue;
      ctx.strokeStyle = i % 4 ? 'rgba(60,38,16,.35)' : 'rgba(235,210,160,.35)'; ctx.lineWidth = 2;
      const a = srand(i + 700) * PI; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); ctx.stroke();
    }
    return;
  }
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
    case 'capsule':
      ctx.fillStyle = '#e63946'; ctx.fillRect(-rx, -ry, rx * 2, ry);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-rx, -3, rx * 2, 6);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-rx * .7, -ry * .85, rx * .28, ry * 1.6);
      text(o.label || 'ER', 0, ry * .62, { size: 16, weight: 900, fill: '#e63946' });
      break;
    case 'star':
      ctx.strokeStyle = 'rgba(255,255,220,.55)'; ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rx * .6, Math.sin(a) * ry * .6); ctx.lineTo(Math.cos(a) * rx * .95, Math.sin(a) * ry * .95); ctx.stroke(); }
      ctx.fillStyle = 'rgba(110,120,20,.18)';
      for (let i = 0; i < 40; i++) { ell((srand(i) * 2 - 1) * rx, (srand(i + 50) * 2 - 1) * ry, 2.5, 2.5); ctx.fill(); }
      break;
    case 'fig':
      ctx.strokeStyle = 'rgba(255,215,240,.2)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const i of [-3, -2, 2, 3]) { ctx.beginPath(); ctx.moveTo(i * 7, -ry * .88); ctx.quadraticCurveTo(i * rx * .4, 0, i * rx * .21, ry * .95); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,225,245,.22)';
      for (let i = 0; i < 40; i++) { const x = (srand(i) * 2 - 1) * rx * .9, y = (srand(i + 40) * 2 - 1) * ry * .9; if (Math.abs(x) < rx * .62 && y > k.eyeY - 40 && y < k.mouthY + 30) continue; ell(x, y, 2.5, 2.5); ctx.fill(); }
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
      } else if (o.kind === 'melon') {
        ctx.fillStyle = '#6b4a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-7, -ry - 12, 14, 20, 5); ctx.fill(); ctx.stroke();
      } else if (o.kind === 'grape') {
        ctx.fillStyle = '#6b4a2a'; rr(-5, -ry - 18, 10, 26, 4); ctx.fill();
      } else if (o.kind === 'clem') {
        ctx.fillStyle = '#5a3a1a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-6, -ry - 14, 12, 20, 4); ctx.fill(); ctx.stroke();
        leaf(2, -ry - 8, .9, 58, 17, '#4fb046'); leaf(-2, -ry - 8, -1.1, 44, 14, '#3f9a3a');
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
    case 'fig':
      if (layer === 'front') { ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -ry + 6); ctx.quadraticCurveTo(8, -ry - 12, -4, -ry - 24); ctx.stroke(); }
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
  if (REG.on && !REG.suppress) {
    const hw = ex + er * 1.45, top = ey - er * 1.42 - Math.max(0, E.raise) - (o.browUp || 0) - 9;
    regLocal('face', -hw, top, hw, k.mouthY + 55 * (k.mw || 26) / 26, { id: o.id || o.kind, transit: o.transit });
  }
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
    if (o.sparkle) { ell(px + er * .2, py + er * .18, er * .09, er * .09); ctx.fill(); ell(px - er * .3, py + er * .1, er * .06, er * .06); ctx.fill(); }
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
    case 'capsule': return [side * k.rx * .96, 8];
    case 'star': return [side * k.rx * .58, -k.ry * .1];
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
    if (prop) {
      drawProp(prop, hx, hy, side, o, t);
      const e = typeof PROP_BOX[prop] === 'function' ? PROP_BOX[prop](o) : PROP_BOX[prop];
      if (e && REG.on && !REG.suppress) {
        const [a, b, c, d] = e, x0 = side < 0 && e.mirror ? -c : a, x1 = side < 0 && e.mirror ? -a : c;
        regLocal('prop', hx + x0, hy + b, hx + x1, hy + d, { id: prop, owner: o.id || o.kind, nearFace: e.nearFace, transit: o.transit });
      }
    }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
    ell(hx, hy, 15, 15); ctx.fill(); ctx.stroke();
    if (pose === 'thumb') { rr(hx - 5, hy - 34, 11, 26, 6); ctx.fill(); ctx.stroke(); }
    if (pose === 'point') { rr(hx + (side > 0 ? 6 : -34), hy - 5, 28, 10, 5); ctx.fill(); ctx.stroke(); }
    if (pose === 'stop') { rr(hx - 12, hy - 30, 24, 30, 8); ctx.fill(); ctx.stroke(); }
  }
}

// ------------------------------------------------------------------ props
const PROP_BOX = {
  clipboard: [-46, -40, 46, 88], purse: [-50, -32, 50, 64], cup: [-26, -98, 28, 18], carton: [-44, -150, 44, 20],
  urine: [-32, -78, 32, 8], handset: Object.assign([-44, -84, 44, 56], { nearFace: true }), cell: Object.assign([-34, -68, 34, 32], { nearFace: true }),
  sticky: [-78, -158, 78, -4], medcup: [-18, -30, 18, 6], pizza: [-92, -104, 92, 4], pen: [-10, -46, 10, 8], yogurt: [-24, -52, 24, 6],
  pestle: Object.assign([104, -78, 176, -8], { mirror: true }), mic: [-16, -62, 16, 10],
  gift: [-58, -104, 58, 4], suitcase: [-64, -8, 64, 100], horn: Object.assign([-10, -26, 150, 26], { mirror: true, nearFace: true }),
  stack: o => [-62, -14 - 22 * (o.stackN || 1) - 20, 62, 8], coffee: Object.assign([-30, -62, 40, 6], { nearFace: true }), notebook: [-36, -54, 36, 8], lunchbox: [-44, 4, 44, 70],
};
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
    case 'pizza':
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? '#e2b877' : '#ecc88c'; ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 3;
        rr(-90, -30 - i * 30, 180, 28, 4); ctx.fill(); ctx.stroke();
      }
      text('PIZZA', 0, -76, { size: 18, fill: '#b3001f' });
      break;
    case 'pen':
      ctx.rotate(-.5); ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(-5, -44, 10, 50, 3); ctx.fill(); ctx.stroke();
      break;
    case 'yogurt':
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-20, -48); ctx.lineTo(20, -48); ctx.lineTo(15, 4); ctx.lineTo(-15, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff8fb1'; ctx.fillRect(-18, -34, 36, 16);
      ctx.fillStyle = '#d9d9e0'; rr(-23, -54, 46, 8, 3); ctx.fill(); ctx.stroke();
      break;
    case 'pestle': {
      const sd = side < 0 ? -1 : 1;
      ctx.scale(sd, 1); ctx.rotate(-.3);
      ctx.fillStyle = '#c9a06a'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(120, -14); ctx.lineTo(120, 14); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8e2d6'; ell(146, 0, 32, 30); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(138, -10, 10, 6); ctx.fill();
      break;
    }
    case 'mic':
      ctx.fillStyle = '#2b2b33'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-7, -30, 14, 38, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#9aa3ad'; ell(0, -44, 15, 17); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-12, -44 + i * 7); ctx.lineTo(12, -44 + i * 7); ctx.stroke(); }
      break;
    case 'gift': {
      const op = o.giftOpen || 0;
      ctx.fillStyle = '#2a9d4a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-54, -86, 108, 86, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd60a'; ctx.fillRect(-8, -86, 16, 86); ctx.strokeRect(-8, -86, 16, 86);
      if (op > 0) { ctx.fillStyle = '#12301c'; rr(-50, -90, 100, 10, 4); ctx.fill(); }
      if (op < 1) {
        ctx.save(); ctx.translate(op * 70, -94 - op * 150); ctx.rotate(op * 1.1); ctx.globalAlpha *= 1 - seg(op, .55, 1);
        ctx.fillStyle = '#34b35a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-60, -10, 120, 22, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd60a'; ctx.fillRect(-8, -10, 16, 22);
        for (const sd of [-1, 1]) { ell(sd * 20, -18, 20, 11, sd * .4); ctx.fill(); ctx.stroke(); }
        ell(0, -14, 9, 9); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'suitcase':
      ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 6; rr(-20, -6, 40, 24, 8); ctx.stroke();
      ctx.fillStyle = '#2ab7a9'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-62, 14, 124, 84, 12); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 3; for (const x of [-30, 0, 30]) { ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, 92); ctx.stroke(); }
      ctx.save(); ctx.translate(-22, 52); ctx.rotate(-.18); ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ell(0, 0, 34, 16); ctx.fill(); ctx.stroke(); text('ARUBA', 0, 1, { size: 13, fill: '#d62828' }); ctx.restore();
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(36, 88); ctx.quadraticCurveTo(40, 62, 34, 42); ctx.stroke();
      for (const a of [-1.2, -.4, .4, 1.2]) leaf(34, 44, a, 22, 7, '#2f8f34');
      break;
    case 'horn': {
      const bl = o.hornBlow || 0, sd = side < 0 ? -1 : 1;
      ctx.scale(sd, 1);
      ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-6, -8, 28, 16, 4); ctx.fill(); ctx.stroke();
      const L = 24 + 112 * bl;
      ctx.fillStyle = '#ff3b55'; rr(20, -7, L, 14, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; for (let x = 30; x < 20 + L - 6; x += 18) ctx.fillRect(x, -7, 6, 14);
      if (bl < .95) { ctx.strokeStyle = '#ff3b55'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU * 1.4, r = 16 * (1 - bl) * (1 - i / 34); const x = 20 + L + Math.sin(a) * r, y = -r + Math.cos(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      break;
    }
    case 'stack': {
      const n = o.stackN || 1, wob = o.stackWobble || 0;
      for (let i = 0; i < n; i++) {
        const lean = wob * Math.sin(t * 9 + i * .4) * i * 1.6 + i * i * .35 * (o.stackLean || 0);
        ctx.save(); ctx.translate(lean, -8 - i * 22); ctx.rotate((hash(i + 3) - .5) * .12 + wob * .02 * Math.sin(t * 9));
        ctx.fillStyle = ['#fffdf5', '#ffe9a8', '#dff0ff', '#ffd9e4'][i % 4]; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
        ctx.fillRect(-56, -18, 112, 20); ctx.strokeRect(-56, -18, 112, 20);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-44, -11, 60 + (i % 3) * 10, 3);
        ctx.restore();
      }
      break;
    }
    case 'coffee':
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(-26, -54, 52, 56, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(28, -26, 11, -PI / 2, PI / 2); ctx.stroke();
      ctx.fillStyle = '#5a3210'; ell(0, -50, 22, 5); ctx.fill();
      text('3-11', 0, -24, { size: 13, fill: '#d62828' });
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; for (const dx of [-8, 8]) { ctx.beginPath(); ctx.moveTo(dx, -60); ctx.quadraticCurveTo(dx + 8 * Math.sin(t * 3 + dx), -72, dx, -84); ctx.stroke(); }
      break;
    case 'notebook':
      ctx.rotate(side * .1);
      ctx.fillStyle = '#ffd9e4'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-32, -50, 64, 56, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-26, -42, 52, 42);
      ctx.strokeStyle = '#8fa7c9'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-22, -34 + i * 10); ctx.lineTo(20, -34 + i * 10); ctx.stroke(); }
      ctx.fillStyle = '#9aa0a6'; for (let i = 0; i < 5; i++) { ell(-24 + i * 12, -50, 3, 3); ctx.fill(); }
      break;
    case 'lunchbox':
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, 8); ctx.quadraticCurveTo(0, -8, 14, 8); ctx.stroke();
      ctx.fillStyle = '#2ab7a9'; rr(-42, 8, 84, 60, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd60a'; ell(0, 38, 14, 14); ctx.fill();
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
        const bt = o.badgeText || 'NURSE';
        text(bt, 0, 28, { size: bt.length > 6 ? 8 : 10, fill: INK, maxW: 40 });
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
      case 'suit:mid': {
        ctx.save(); ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
        const y0 = k.ry * .5;
        ctx.fillStyle = o.suitColor || '#243a5e'; ctx.fillRect(-k.rx * 1.2, y0, k.rx * 2.4, k.ry);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-k.rx * .3, y0 - 2); ctx.lineTo(k.rx * .3, y0 - 2); ctx.lineTo(0, k.ry * 1.02); ctx.closePath(); ctx.fill();
        ctx.fillStyle = o.lapelColor || '#18294a';
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * k.rx * .3, y0 - 2); ctx.lineTo(sd * k.rx * .06, k.ry * .98); ctx.lineTo(sd * k.rx * .5, k.ry * .76); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = o.tieColor || '#d62828'; ctx.beginPath(); ctx.moveTo(-9, y0 + 2); ctx.lineTo(9, y0 + 2); ctx.lineTo(6, y0 + 16); ctx.lineTo(-6, y0 + 16); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-6, y0 + 16); ctx.lineTo(6, y0 + 16); ctx.lineTo(11, k.ry * .9); ctx.lineTo(0, k.ry); ctx.lineTo(-11, k.ry * .9); ctx.closePath(); ctx.fill();
        ctx.restore();
        break;
      }
      case 'nametag:front': {
        ctx.save(); ctx.translate(-k.rx * .46, k.ry * .7); ctx.rotate(-.06);
        ctx.font = '900 15px Nunito'; const tw = Math.max(88, ctx.measureText(o.tag || 'ADMIN').width + 18);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-tw / 2, -15, tw, 30, 6); ctx.fill(); ctx.stroke();
        text(o.tag || 'ADMIN', 0, 1, { size: 15, fill: '#243a5e' });
        ctx.restore();
        break;
      }
      case 'bouffant:front': {
        const cy = -k.ry * .9, c = o.capColor || '#2a9d8f';
        ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.ellipse(0, cy - 8, k.rx * .78, 30, 0, PI, TAU); ctx.lineTo(k.rx * .78, cy + 6);
        for (let i = 0; i <= 8; i++) ctx.lineTo(k.rx * .78 - i * k.rx * 1.56 / 8, cy + 6 + (i % 2 ? 6 : 0));
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 12; i++) { ell((srand(i) - .5) * k.rx * 1.3, cy - 14 + (srand(i + 3) - .5) * 20, 4, 4); ctx.fill(); }
        break;
      }
      case 'agency:front': {
        ctx.save(); ctx.translate(k.rx * .5, k.ry * .42); ctx.rotate(.06);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-34, -13, 68, 26, 5); ctx.fill(); ctx.stroke();
        text('AGENCY', 0, 1, { size: 13, fill: '#7a3fb0', maxW: 62 });
        ctx.restore();
        break;
      }
      case 'statecap:front': {
        const cy = -k.ry * .78;
        ctx.fillStyle = '#1d2b53'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.ellipse(0, cy, 40, 26, 0, PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
        rr(-8, cy - 2, 62, 10, 5); ctx.fill(); ctx.stroke();
        text('STATE', 0, cy - 10, { size: 13, fill: '#ffd60a' });
        break;
      }
      case 'bandage:front': {
        ctx.save(); ctx.translate(k.rx * .42, -k.ry * .62); ctx.rotate(.55);
        ctx.fillStyle = '#f2c79a'; ctx.strokeStyle = '#a0764a'; ctx.lineWidth = 2.5; rr(-30, -10, 60, 20, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e0ae7c'; ctx.fillRect(-10, -8, 20, 16);
        ctx.restore();
        break;
      }
      case 'jam:front': {
        ctx.fillStyle = '#9b0017';
        for (const [x, len, ph] of [[-60, 26, 0], [-18, 40, 1.3], [34, 22, 2.1], [70, 32, .7]]) {
          const d = len * (.7 + .3 * Math.sin(t * 2 + ph)), y0 = -k.ry * .86 + Math.abs(x) * .28;
          ctx.beginPath(); ctx.moveTo(x - 9, y0); ctx.lineTo(x + 9, y0); ctx.lineTo(x + 5, y0 + d); ctx.arc(x, y0 + d, 5, 0, PI); ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'sweat:front': {
        for (let i = 0; i < 3; i++) {
          const q = ((t * 1.4 + i / 3) % 1), x = (i % 2 ? 1 : -1) * (ex + er * 1.9), y = ey - er + q * 90;
          ctx.globalAlpha = 1 - q; ctx.fillStyle = '#8fd8ff'; ctx.strokeStyle = '#3a8fc0'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.quadraticCurveTo(x + 8, y + 2, x, y + 7); ctx.quadraticCurveTo(x - 8, y + 2, x, y - 12); ctx.fill(); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'tears:front': {
        ctx.fillStyle = 'rgba(120,200,255,.85)';
        for (const sd of [-1, 1]) {
          ctx.fillRect(sd * ex - 5, ey + er * .9, 10, 40 + 8 * Math.sin(t * 6));
          for (let i = 0; i < 2; i++) { const q = (t * 1.6 + i * .5 + (sd > 0 ? .25 : 0)) % 1; ell(sd * (ex + 8 + q * 30), ey + er + q * 70, 6, 8); ctx.fill(); }
        }
        break;
      }
      case 'fedora:front': {
        const yb = -k.ry * (k.shape === 'fig' ? .66 : .8), w = k.rx * .5;
        ctx.fillStyle = '#26262c'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
        ell(0, yb, k.rx * .82, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#34343e';
        ctx.beginPath(); ctx.moveTo(-w, yb - 4); ctx.lineTo(-w * .88, yb - 60); ctx.quadraticCurveTo(-w * .4, yb - 74, 0, yb - 62); ctx.quadraticCurveTo(w * .4, yb - 74, w * .88, yb - 60); ctx.lineTo(w, yb - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#0e0e12'; ctx.fillRect(-w * .97, yb - 22, w * 1.94, 14);
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * .7, yb - 50); ctx.quadraticCurveTo(-w * .3, yb - 60, -w * .1, yb - 54); ctx.stroke();
        ctx.fillStyle = '#26262c'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(0, yb, k.rx * .82, 15, 0, 0, PI); ctx.fill(); ctx.stroke();
        break;
      }
      case 'rose:front': {
        ctx.save(); ctx.translate(-k.rx * .42, k.ry * .5);
        ctx.fillStyle = '#2f8f34'; ell(12, 10, 12, 6, .6); ctx.fill();
        ctx.fillStyle = '#c1121f'; ctx.strokeStyle = '#5e0008'; ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ell(Math.cos(a) * 6, Math.sin(a) * 6, 8, 8); ctx.fill(); ctx.stroke(); }
        ctx.fillStyle = '#8a0c16'; ell(0, 0, 6, 6); ctx.fill();
        ctx.restore();
        break;
      }
      case 'santa:front': {
        const sc = k.rx / 110, yt = -k.ry * .8, rx = k.rx;
        ctx.fillStyle = '#d62828'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-rx * .62, yt);
        ctx.quadraticCurveTo(-rx * .45, yt - 120 * sc, rx * .05, yt - 138 * sc);
        ctx.quadraticCurveTo(rx * .55, yt - 142 * sc, rx * .84, yt - 80 * sc);
        ctx.quadraticCurveTo(rx * .5, yt - 104 * sc, rx * .3, yt - 62 * sc);
        ctx.quadraticCurveTo(rx * .5, yt - 30 * sc, rx * .62, yt);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ell(-rx * .2, yt - 90 * sc, 10 * sc, 30 * sc, -.5); ctx.fill();
        ctx.fillStyle = '#fbfbf8'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
        rr(-rx * .74, yt - 16 * sc, rx * 1.48, 30 * sc, 15 * sc); ctx.fill(); ctx.stroke();
        ell(rx * .86, yt - 78 * sc, 20 * sc, 20 * sc); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 9; i++) { ell(-rx * .64 + i * rx * .16, yt - 2 * sc + (i % 2) * 5, 4, 4); ctx.fill(); }
        break;
      }
      case 'partyhat:front': {
        const sc = k.rx / 110;
        ctx.save(); ctx.translate(k.rx * .34, -k.ry * .8); ctx.rotate(.38);
        ctx.beginPath(); ctx.moveTo(-30 * sc, 0); ctx.lineTo(0, -92 * sc); ctx.lineTo(30 * sc, 0); ctx.closePath();
        ctx.fillStyle = '#2a6fdb'; ctx.fill();
        ctx.save(); ctx.clip(); ctx.fillStyle = '#ffd60a'; for (let i = -4; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-40 * sc, i * 22 * sc); ctx.lineTo(40 * sc, i * 22 * sc - 30 * sc); ctx.lineTo(40 * sc, i * 22 * sc - 20 * sc); ctx.lineTo(-40 * sc, i * 22 * sc + 10 * sc); ctx.fill(); } ctx.restore();
        ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.fillStyle = '#ff3b55'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ell(Math.cos(a) * 8 * sc, -92 * sc + Math.sin(a) * 8 * sc, 6 * sc, 6 * sc); ctx.fill(); }
        ctx.restore();
        break;
      }
      case 'pricetag:front': {
        const sw = Math.sin(t * 3) * .12;
        ctx.save(); ctx.translate(18, k.ry * .77 + 12); ctx.rotate(sw);
        ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 22); ctx.stroke();
        ctx.fillStyle = '#fffdf0'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(4, 20); ctx.lineTo(40, 20); ctx.lineTo(40, 42); ctx.lineTo(4, 42); ctx.lineTo(-4, 31); ctx.closePath(); ctx.fill(); ctx.stroke();
        text('$89', 22, 31, { size: 12, fill: '#d62828', weight: 900 });
        ctx.restore();
        break;
      }
      case 'backpack:back': {
        ctx.fillStyle = '#7a3fb0'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
        rr(-k.rx * 1.12, -k.ry * .55, k.rx * 2.24, k.ry * 1.3, 34); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#9b5fd0'; rr(-k.rx * 1.2, -k.ry * .1, 36, k.ry * .7, 14); ctx.fill(); ctx.stroke(); rr(k.rx * 1.2 - 36, -k.ry * .1, 36, k.ry * .7, 14); ctx.fill(); ctx.stroke();
        break;
      }
      case 'backpack:front': {
        ctx.strokeStyle = '#5a2a8a'; ctx.lineWidth = 12; ctx.lineCap = 'round';
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * k.rx * .55, -k.ry * .72); ctx.quadraticCurveTo(sd * k.rx * .72, 0, sd * k.rx * .6, k.ry * .62); ctx.stroke(); }
        break;
      }
      case 'halo:front': {
        ctx.strokeStyle = '#ffe98a'; ctx.lineWidth = 7; ctx.shadowColor = 'rgba(255,240,150,.9)'; ctx.shadowBlur = 16;
        ell(0, -k.ry - 30 + Math.sin(t * 3) * 3, k.rx * .5, 11); ctx.stroke(); ctx.shadowColor = 'transparent';
        break;
      }
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
  regLocal('fg', x + 20, bodyTop - 5, x + 285, y + 94, { id: 'blanket' });
  regLocal('fg', x - 340, y - 50, x + 20, y + 94, { id: 'blanket-foot' });
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
  regLocal('fg', x - 10, y - 18, x + 440, y + 404, { id: 'medcart' });
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
function bgExterior(v = {}) {
  cached('ext' + (v.key || ''), () => {
    const sky = v.sky || ['#3fa9f5', '#bfe7ff'];
    const g = ctx.createLinearGradient(0, -PAD, 0, 1200); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1300 + PAD);
    ctx.fillStyle = v.sun || '#fff6b0'; ell(880, 260, 90, 90); ctx.fill();
    const sg = ctx.createRadialGradient(880, 260, 80, 880, 260, 260); sg.addColorStop(0, 'rgba(255,250,200,.6)'); sg.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = sg; ctx.fillRect(600, 0, 560, 560);
    if (v.behind) v.behind();
    // grass & lot
    ctx.fillStyle = v.grass || '#6cc04a'; ctx.fillRect(-PAD, 1360, W + PAD * 2, 200);
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
    const bush = v.bush || ['#3f9a3a', '#4fb046'];
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? bush[0] : bush[1]; ell(60 + i * 90, 1375, 70, 50); ctx.fill(); }
    // flag pole
    ctx.fillStyle = '#ccc'; ctx.fillRect(1000, 560, 10, 820);
    // ambulance
    const ax = 80, ay = 1560;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(ax, ay, 320, 150, 14); ctx.fill(); ctx.stroke();
    rr(ax + 320, ay + 50, 110, 100, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bfe3ff'; rr(ax + 340, ay + 62, 70, 40, 6); ctx.fill();
    ctx.fillStyle = '#e8193a'; ctx.fillRect(ax, ay + 70, 430, 18); ctx.fillRect(ax + 130, ay + 20, 60, 16); ctx.fillRect(ax + 152, ay - 2, 16, 60);
    ctx.fillStyle = '#222'; ell(ax + 80, ay + 155, 34, 34); ctx.fill(); ell(ax + 350, ay + 155, 34, 34); ctx.fill();
    if (v.front) v.front();
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
  reg('overlay', [x, y, x + 820, y + 90 + rows.length * 62], { id: 'card:' + title });
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
  regLocal('overlay', -w / 2, -size * .72, w / 2, size * .68, { id: 'banner:' + str });
  ctx.fillStyle = bg; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 8; rr(-w / 2, -size * .72, w, size * 1.4, 18); ctx.fill(); ctx.stroke();
  text(str, 0, 4, { size, font: 'Bangers', weight: 400, fill: fg, spacing: 3 });
  ctx.restore();
}

function slamText(p, str, x, y, size, fill, rot = 0) {
  if (p <= 0) return;
  const s = lerp(2.6, 1, easeOut(clamp(p * 1.4)));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  if (REG.on) { ctx.font = `400 ${size}px Bangers`; ctx.letterSpacing = '2px'; const w = ctx.measureText(str).width + 16; ctx.letterSpacing = '0px'; regLocal('overlay', -w / 2, -size * .62, w / 2, size * .62, { id: 'slam:' + str }); }
  text(str, 0, 0, { size, font: 'Bangers', weight: 400, fill, lw: 16, stroke: '#15111a', alpha: clamp(p * 4), spacing: 2 });
  ctx.restore();
}

function stamp(p, lines, x, y, rot = -.2) {
  if (p <= 0) return;
  const s = lerp(2.4, 1, easeOut(clamp(p * 2.5)));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 5) * .92;
  regLocal('overlay', -336, -116, 336, 116, { id: 'stamp:' + lines[0][0] });
  ctx.fillStyle = 'rgba(255,250,245,.82)'; rr(-330, -110, 660, 220, 20); ctx.fill();
  ctx.strokeStyle = '#d62828'; ctx.lineWidth = 12; rr(-330, -110, 660, 220, 20); ctx.stroke();
  ctx.lineWidth = 4; rr(-310, -92, 620, 184, 14); ctx.stroke();
  lines.forEach(([s2, size, dy]) => text(s2, 0, dy, { size, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 4 }));
  ctx.restore();
}

function timeCard(p, str, bg) {
  if (p <= 0 || p >= 1) return;
  const a = Math.min(seg(p, 0, .15), 1 - seg(p, .85, 1));
  reg('overlay', [0, 0, W, H], { id: 'timecard', full: true });
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


// ------------------------------------------------------------------ shared world props
// A mason jar of strawberry jam, bottom-centre at (x, y). o.eyes: 'open' | 'sleep' | 'dead' | null.
function jamJar(x, y, s = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  if (!o.noReg) regLocal(o.key ? 'key' : 'fg', -160, -470, 160, 0, { id: 'jar' });
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 0, 150, 18); ctx.fill();
  ctx.fillStyle = 'rgba(210,235,255,.5)'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-140, -380, 280, 380, 40); ctx.fill(); ctx.stroke();
  const lvl = o.level ?? 1, marm = o.flavor === 'marmalade';
  ctx.fillStyle = marm ? '#e8761a' : '#b3001f'; rr(-128, -12 - 318 * lvl, 256, 318 * lvl, 30); ctx.fill();
  ctx.fillStyle = marm ? '#ffd28a' : '#ffe58a'; for (let i = 0; i < 20; i++) { const yy = -40 - hash(i + 5) * 270; if (yy > -12 - 318 * lvl) { ell((hash(i) - .5) * 220, yy, 4, 6); ctx.fill(); } }
  // lid: 1 = on, 0..1 = lifted above the jar, fly 0..1 = popping off and leaving the frame, lid <= 0 = no lid
  const lid = o.lid ?? 1, fly = o.fly || 0;
  if (fly > 0 && fly < 1) {
    ctx.save(); ctx.translate(fly * 260, -420 + 28 - fly * 2600); ctx.rotate(fly * 9); ctx.fillStyle = '#e8c07a'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-155, -28, 310, 56, 12); ctx.fill(); ctx.stroke(); ctx.restore();
  } else if (!fly && lid > 0) {
    const ly = -420 - (1 - lid) * 160, lr = (1 - lid) * .5;
    ctx.save(); ctx.translate(0, ly + 28); ctx.rotate(lr); ctx.fillStyle = '#e8c07a'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-155, -28, 310, 56, 12); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  if (o.label !== false) {
    ctx.fillStyle = '#fff6e0'; ctx.lineWidth = 5; rr(-120, -250, 240, 140, 12); ctx.fill(); ctx.stroke();
    const lc = marm ? '#c85a00' : '#b3001f';
    text(marm ? 'CLEMENTINE' : 'STRAWBERRY', 0, -222, { size: 30, fill: lc, font: 'Bangers', weight: 400, spacing: 2 });
    text(marm ? 'MARMALADE' : 'JAM', 0, -180, { size: marm ? 38 : 46, fill: lc, font: 'Bangers', weight: 400, spacing: marm ? 2 : 4 });
    text(o.sub || 'fresh off the 3-11', 0, -136, { size: 20, fill: INK, italic: true, maxW: 220 });
  }
  if (o.eyes) {
    const blink = o.eyes === 'sleep' || (T % 2.3) < .12, half = o.eyes === 'dead';
    if (!o.noReg) regLocal('face', -64, -330, 64, -270, { id: 'jar-face' });
    for (const sd of [-1, 1]) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(sd * 36, -300, 20, blink ? 3 : 22); ctx.fill(); ctx.stroke();
      if (!blink) { ctx.fillStyle = INK; ell(sd * 36, -296, 9, 9); ctx.fill(); if (half) { ctx.fillStyle = marm ? '#e8761a' : '#b3001f'; ctx.fillRect(sd * 36 - 21, -323, 42, 20); } }
    }
    if (o.eyes === 'sleep') for (let i = 0; i < 3; i++) { const q = ((T * .6 + i / 3) % 1); text('Z', 90 + q * 60 + i * 8, -380 - q * 120, { size: 34 + i * 12, font: 'Bangers', weight: 400, fill: '#c9c3ff', alpha: 1 - q }); }
  }
  ctx.restore();
}

// Manual pill crusher sitting on a surface, bottom-centre at (x, y). down: 0 (raised) .. 1 (crushing)
function pillCrusher(x, y, down) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#c9d2dc'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-90, -24, 180, 24, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a95a3'; rr(-80, -150, 22, 130, 6); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(-69, -140); ctx.rotate(-.9 + .9 * down);
  ctx.fillStyle = '#e63946'; rr(0, -14, 190, 28, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9aa3ad'; rr(110, 10, 40, 36, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function sanitizer(x, y, pump) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#e8eef3'; ctx.strokeStyle = '#6d7a88'; ctx.lineWidth = 4; rr(-40, -70, 80, 130, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6ec3ff'; rr(-30, -20, 60, 56, 8); ctx.fill();
  ctx.fillStyle = '#6d7a88'; rr(-18, 60 + pump * 10, 36, 14, 5); ctx.fill();
  text('HAND', 0, -50, { size: 14, fill: '#2a6fdb' }); text('RUB', 0, -34, { size: 14, fill: '#2a6fdb' });
  ctx.restore();
}

function poof(x, y, p, r = 90) {
  if (p <= 0 || p >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - p;
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.fillStyle = i % 2 ? '#ffffff' : '#e8e4f0'; ell(x + Math.cos(a) * r * p, y + Math.sin(a) * r * .7 * p, r * .45 * (1 - p * .4), r * .38 * (1 - p * .4)); ctx.fill(); }
  ctx.restore();
}

// ------------------------------------------------------------------ panel-layout kit (Episode 2+)
// Layout contract for panel episodes (stage is 1080x1480, captions live in the panel below it):
//   y 150-520   key band: signs and boards the jokes depend on (never covered)
//   y 548-816   overlay band: cards, banners, stamps (never over a face or a key sign)
//   y 830-1400  characters, feet on G = 1400
const G = 1400, SC = 1.35;
const OV = 548, OV_B = 816;
const STRAW_ACC = ['steth', 'badge', 'bandage'];
const KIWI_CAPS = ['#2a9d8f', '#7a3fb0', '#2a6fdb', '#e76f51', '#d4a017'];

const straw = o => Object.assign({ kind: 'straw', id: 'straw', who: 'straw', s: SC, y: G, acc: STRAW_ACC }, o);
const lemon = o => Object.assign({ kind: 'lemon', id: 'lemon', who: 'lemon', s: SC, y: G, acc: ['readers', 'lanyard'], hold: { l: 'clipboard' }, arms: { l: 'hold', r: 'rest' }, clipText: 'STAFFING', expr: 'sour' }, o);
const star = o => Object.assign({ kind: 'star', id: 'star', who: 'star', s: 1.15, y: G, acc: ['glasses', 'statecap'], hold: { l: 'clipboard', r: 'pen' }, arms: { l: 'hold', r: [.75, 1.25] }, clipText: 'STATE', expr: 'dead' }, o);
const melon = o => Object.assign({ kind: 'melon', id: 'melon', who: 'melon', s: 1.22, y: G, acc: ['suit', 'nametag'], tag: 'ADMINISTRATOR', expr: 'happy' }, o);
const kiwi = (i, o) => Object.assign({ kind: 'kiwi', id: 'kiwi' + i, who: 'kiwis', s: .95, y: G, acc: ['bouffant', 'agency'], capColor: KIWI_CAPS[i], expr: 'happy', seed: 40 + i * 9 }, o);
const gfruit = o => Object.assign({ kind: 'gfruit', id: 'gfruit', who: 'gfruit', s: .9, expr: 'smug', acc: ['sunglasses', 'chain'], hold: { r: 'yogurt' }, arms: { l: 'rest', r: 'hold' }, look: [-.6, 0] }, o);

// overlay kit (screen space, all registered)
function card(p, title, rows, accent = '#2a9d4a', reveal = rows.length) {
  if (p <= 0) return;
  const w = 900, h = 84 + rows.length * 58 + 14, x = 90, y = OV + (OV_B - OV - h) / 2;
  reg('overlay', [x, y, x + w, y + h], { id: 'card:' + title });
  const a = clamp(p * 1.6), s = lerp(.94, 1, easeOut(clamp(p)));
  ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(540, y + h / 2); ctx.scale(s, s); ctx.translate(-540, -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#fffdf6'; rr(x, y, w, h, 22); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = accent; rr(x, y, w, 70, [22, 22, 0, 0]); ctx.fill();
  text(title, 540, y + 37, { size: 40, fill: '#fff', font: 'Bangers', weight: 400, spacing: 2 });
  rows.forEach(([k, v], i) => {
    const ry = y + 70 + 36 + i * 58, ra = i < reveal ? 1 : 0;
    if (!ra) return;
    text(k, x + 34, ry, { size: 27, fill: accent, align: 'left', weight: 900 });
    text(v, x + w - 34, ry, { size: 30, fill: INK, align: 'right', weight: 800, italic: true, maxW: 540 });
    if (i < rows.length - 1) { ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(x + 30, ry + 29, w - 60, 2); }
  });
  ctx.restore();
}
function banner2(p, str, bg = '#e8193a', fg = '#fff', size = 86, cy = (OV + OV_B) / 2) {
  if (p <= 0) return;
  ctx.font = `400 ${size}px Bangers`; ctx.letterSpacing = '3px';
  const w = Math.min(1000, ctx.measureText(str).width + 80); ctx.letterSpacing = '0px';
  const h = size * 1.45;
  reg('overlay', [540 - w / 2, cy - h / 2, 540 + w / 2, cy + h / 2], { id: 'banner:' + str });
  const s = lerp(.85, 1, easeBack(clamp(p)));
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(540, cy); ctx.scale(s, s);
  ctx.fillStyle = bg; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 8; rr(-w / 2, -h / 2, w, h, 20); ctx.fill(); ctx.stroke();
  text(str, 0, 4, { size, font: 'Bangers', weight: 400, fill: fg, spacing: 3, maxW: w - 50 });
  ctx.restore();
}
function stamp2(p, lines, cy = (OV + OV_B) / 2, rot = -.08) {
  if (p <= 0) return;
  const s = lerp(1.25, 1, easeOut(clamp(p * 2.2)));
  ctx.save(); ctx.translate(540, cy); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 5);
  regLocal('overlay', -330, -112, 330, 112, { id: 'stamp:' + lines[0][0] });
  ctx.fillStyle = 'rgba(255,250,245,.92)'; rr(-330, -112, 660, 224, 20); ctx.fill();
  ctx.strokeStyle = '#d62828'; ctx.lineWidth = 12; rr(-330, -112, 660, 224, 20); ctx.stroke();
  ctx.lineWidth = 4; rr(-310, -94, 620, 188, 14); ctx.stroke();
  lines.forEach(([str, size, dy]) => text(str, 0, dy, { size, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 4, maxW: 580 }));
  ctx.restore();
}
function tag(x, y, str, bg, fg = '#fff', icon) {
  ctx.font = '900 30px Nunito';
  const w = ctx.measureText(str).width + 48 + (icon ? 44 : 0), h = 60;
  reg('overlay', [x, y, x + w, y + h], { id: 'tag:' + str });
  ctx.fillStyle = bg; rr(x, y, w, h, 14); ctx.fill();
  let tx = x + 24;
  if (icon === 'rew') { ctx.fillStyle = fg; for (const dx of [0, 18]) { ctx.beginPath(); ctx.moveTo(tx + dx + 16, y + 16); ctx.lineTo(tx + dx, y + 30); ctx.lineTo(tx + dx + 16, y + 44); ctx.fill(); } tx += 44; }
  if (icon === 'pause') { ctx.fillStyle = fg; ctx.fillRect(tx, y + 16, 9, 28); ctx.fillRect(tx + 17, y + 16, 9, 28); tx += 44; }
  text(str, tx, y + h / 2 + 1, { size: 30, fill: fg, align: 'left' });
}
function logo2(x, y, s, a = 1, label = EP.title.toUpperCase(), pw = 540) {
  reg('overlay', [x - 470 * s, y - 196 * s, x + 470 * s, y + 262 * s], { id: 'logo' });
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-.05); ctx.globalAlpha *= a;
  text('SHIFT', 0, -80, { size: 200, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 22, stroke: '#2a0010', spacing: 6, shadow: 20 });
  text('HAPPENS', 0, 90, { size: 200, font: 'Bangers', weight: 400, fill: '#ff3b55', lw: 22, stroke: '#2a0010', spacing: 6, shadow: 20 });
  ctx.fillStyle = '#15111a'; rr(-pw / 2, 190, pw, 64, 32); ctx.fill();
  text(label, 0, 223, { size: 36, fill: '#fff', spacing: 2 });
  ctx.restore();
}
function redWash(a) { ctx.fillStyle = `rgba(255,20,40,${a})`; ctx.fillRect(0, 0, W, STAGE_H); }

// sets
function bgStation2() {
  cached('station2', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1000); g.addColorStop(0, '#c7e6db'); g.addColorStop(1, '#a3d1c1');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1300);
    ceiling();
    ctx.fillStyle = '#c89f6d'; ctx.fillRect(-PAD, 862, W + PAD * 2, 18);
    ctx.fillStyle = '#8fbcae'; ctx.fillRect(-PAD, 880, W + PAD * 2, 70);
    // counter
    ctx.fillStyle = '#6f9d8f'; ctx.fillRect(-PAD, 968, W + PAD * 2, 250);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < W; x += 180) ctx.fillRect(x, 980, 6, 220);
    ctx.fillStyle = '#efe5d1'; ctx.fillRect(-PAD, 938, W + PAD * 2, 32);
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(-PAD, 970, W + PAD * 2, 8);
    ctx.fillStyle = '#4f7a6d'; ctx.fillRect(-PAD, 1196, W + PAD * 2, 22);
    floorPaint(1218, '#ddd5c4', '#b9af9b');
    // counter-top items (kept below the overlay band)
    ['#d62828', '#2a6fdb', '#2a9d8f', '#f4a300'].forEach((c, i) => { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(40 + i * 34, 872 - (i % 2) * 8, 30, 68 + (i % 2) * 8, 3); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = '#e9e1d0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(210, 900, 120, 40, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; rr(930, 880, 70, 58, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(1003, 908, 15, -PI / 2, PI / 2); ctx.stroke();
    // bulletin board frame
    ctx.fillStyle = '#8a5a2b'; rr(40, 168, 432, 354, 10); ctx.fill();
    ctx.fillStyle = '#d4a26a'; ctx.fillRect(54, 182, 404, 326);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 220; i++) { ell(54 + srand(i) * 404, 182 + srand(i + 3) * 326, 2, 2); ctx.fill(); }
    // staffing board frame
    ctx.fillStyle = '#b7bec7'; rr(608, 168, 432, 354, 12); ctx.fill();
    ctx.fillStyle = '#fdfdfd'; ctx.fillRect(622, 182, 404, 326);
    ctx.fillStyle = '#2a6fdb'; ctx.fillRect(622, 182, 404, 52);
    text("TODAY'S STAFFING", 824, 209, { size: 30, fill: '#fff' });
    [['NURSES', 290], ['RESIDENTS', 370], ['RATIO', 450]].forEach(([k, y]) => text(k, 646, y, { size: 32, fill: '#1f3b8f', align: 'left', weight: 900 }));
    ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(640, 328, 370, 3); ctx.fillRect(640, 408, 370, 3);
    // clock frame
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 9; ell(540, 244, 56, 56); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = INK; ell(540 + Math.sin(a) * 43, 244 - Math.cos(a) * 43, 3.5, 3.5); ctx.fill(); }
    // ceiling PA speaker
    ctx.fillStyle = '#dfe3e6'; ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 3; ell(360, 118, 34, 20); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a95a3'; for (let i = -2; i <= 2; i++) { ell(360 + i * 10, 118, 2.5, 2.5); ctx.fill(); }
  });
}
function paper2(x, y, w, h, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#e8193a'; ell(0, -h / 2 + 9, 6, 6); ctx.fill();
}

function bgRoom2(v) {
  cached('room2-' + v.num, () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1230); g.addColorStop(0, v.wall[0]); g.addColorStop(1, v.wall[1]);
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1330 + PAD);
    ceiling('#f3f1ec');
    ctx.fillStyle = '#9a8f80'; ctx.fillRect(-PAD, 1212, W + PAD * 2, 22);
    floorPaint(1232, '#e2d9c6', '#bfb39c');
    ctx.fillStyle = '#b7bec7'; rr(598, 168, 444, 354, 12); ctx.fill();
    ctx.fillStyle = '#fdfdfd'; ctx.fillRect(612, 182, 416, 326);
    ctx.fillStyle = '#2a6fdb'; ctx.fillRect(612, 182, 416, 52);
    text('ROOM ' + v.num, 820, 209, { size: 30, fill: '#fff' });
    v.board.forEach(([s, c], i) => text(s, 634, 284 + i * 60, { size: 30, fill: c || '#1f3b8f', align: 'left', weight: 800, italic: true, maxW: 376 }));
    ctx.fillStyle = '#dfe5ea'; rr(890, 560, 140, 100, 10); ctx.fill();
    ctx.fillStyle = '#2a9d4a'; ell(930, 600, 14, 14); ctx.fill(); text('O2', 930, 632, { size: 15, fill: '#2a9d4a' });
    ctx.fillStyle = '#e0e0e0'; ctx.strokeStyle = '#777'; ctx.lineWidth = 3; ell(990, 600, 14, 14); ctx.fill(); ctx.stroke(); text('VAC', 990, 632, { size: 13, fill: '#555' });
    ctx.fillStyle = '#9ad1c9';
    ctx.beginPath(); ctx.moveTo(-PAD, 150); ctx.lineTo(34, 150);
    for (let y = 150; y <= 1180; y += 40) ctx.lineTo(28 + Math.sin(y * .05) * 8, y);
    ctx.lineTo(-PAD, 1180); ctx.fill();
  });
}
const bedTop = (cy, k, s) => cy + k.ry * s * .96;

function bgHall2() {
  cached('hall2', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1240); g.addColorStop(0, '#f2ead8'); g.addColorStop(1, '#e2d6bd');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1340 + PAD);
    ceiling('#f6f3ea');
    ctx.fillStyle = '#b9d3c9'; ctx.fillRect(-PAD, 1012, W + PAD * 2, 228);
    floorPaint(1240, '#e8e2d4', '#bdb3a0');
    for (const [x, num] of [[50, '14'], [790, '15']]) {
      ctx.fillStyle = '#8a6a48'; ctx.fillRect(x - 10, 588, 260, 652);
      const g3 = ctx.createLinearGradient(x, 0, x + 240, 0); g3.addColorStop(0, '#caa27a'); g3.addColorStop(1, '#b08660');
      ctx.fillStyle = g3; ctx.fillRect(x, 600, 240, 640);
      ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 7; i++) ctx.fillRect(x + 20 + i * 32, 610, 3, 620);
      ctx.fillStyle = '#d9dde2'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x + 190, 900, 36, 16, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#555'; rr(x + 60, 540, 120, 40, 8); ctx.fill(); ctx.stroke();
      text('ROOM ' + num, x + 120, 561, { size: 20, fill: INK });
    }
    ctx.fillStyle = '#b8895a'; ctx.strokeStyle = '#6e4d2c'; ctx.lineWidth = 3;
    ctx.fillRect(-PAD, 990, W + PAD * 2, 22); ctx.strokeRect(-PAD, 990, W + PAD * 2, 22);
    ctx.fillStyle = '#8a8f96'; for (let x = 20; x < W; x += 180) ctx.fillRect(x, 1012, 12, 26);
    // falls sign frame
    ctx.fillStyle = '#1d2b53'; rr(356, 168, 368, 330, 16); ctx.fill();
    ctx.fillStyle = '#fffdf2'; rr(372, 184, 336, 298, 10); ctx.fill();
    text('DAYS WITHOUT', 540, 236, { size: 38, font: 'Bangers', weight: 400, fill: '#1d2b53', spacing: 2 });
    text('A FALL', 540, 280, { size: 38, font: 'Bangers', weight: 400, fill: '#1d2b53', spacing: 2 });
  });
}
function fallSign(n, flip, key) {
  const s = Math.abs(Math.cos(flip * PI));
  ctx.save(); ctx.translate(540, 390); ctx.scale(1, Math.max(.02, s));
  ctx.fillStyle = '#1d2b53'; rr(-70, -76, 140, 152, 12); ctx.fill();
  text(String(n), 0, 6, { size: 130, font: 'Bangers', weight: 400, fill: n ? '#7dff9a' : '#ff3b55' });
  ctx.restore();
  if (key) regKey('fall-sign', 356, 168, 724, 498);
}

function bgMed2() {
  cached('med2', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1300); g.addColorStop(0, '#d5dde8'); g.addColorStop(1, '#b3c0d1');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ceiling('#eef0f4');
    floorPaint(1300, '#d6d9dd', '#a9aeb5');
    for (let r = 0; r < 3; r++) {
      const y = 290 + r * 115;
      ctx.fillStyle = '#f2f2f2'; ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 3; ctx.fillRect(40, y, 460, 12); ctx.strokeRect(40, y, 460, 12);
      for (let i = 0; i < 10; i++) {
        const x = 56 + i * 44, h = 54 + srand(i + r * 20) * 34;
        ctx.fillStyle = 'rgba(255,140,0,.85)'; ctx.fillRect(x + 4, y - h + 14, 30, h - 14); ctx.fillStyle = '#fff'; ctx.fillRect(x + 2, y - h, 34, 16); ctx.fillStyle = '#fdfaf2'; ctx.fillRect(x + 4, y - h * .6, 30, h * .3);
      }
    }
    ctx.fillStyle = '#8fa3bb'; ctx.fillRect(-PAD, 1000, 540 + PAD, 300);
    ctx.fillStyle = '#eceff3'; ctx.fillRect(-PAD, 980, 556 + PAD, 26);
    ctx.fillStyle = '#d62828'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(380, 890, 100, 90, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(390, 906, 80, 22); text('SHARPS', 430, 918, { size: 15, fill: '#d62828' });
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(548, 336, 444, 972);
  });
}
// Floor-standing medication fridge; open 0..1 swings the door out to the left.
function fridge(open, inside, key) {
  const x0 = 560, y0 = 350, w = 420, h = 950;
  ctx.fillStyle = '#e9eef3'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(x0, y0, w, h, 18); ctx.fill(); ctx.stroke();
  if (open > 0) {
    ctx.fillStyle = '#dbe8f4'; ctx.fillRect(x0 + 18, y0 + 18, w - 36, h - 36);
    const gl = ctx.createLinearGradient(0, y0, 0, y0 + 300); gl.addColorStop(0, 'rgba(255,255,255,.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(x0 + 18, y0 + 18, w - 36, 300);
    ctx.strokeStyle = '#a8b8c8'; ctx.lineWidth = 6;
    for (const y of [560, 760]) { ctx.beginPath(); ctx.moveTo(x0 + 22, y); ctx.lineTo(x0 + w - 22, y); ctx.stroke(); }
    ['#8fd3ff', '#fff', '#ffd1e3'].forEach((c, i) => { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(x0 + 60 + i * 110, 480, 70, 76, 8); ctx.fill(); ctx.stroke(); text('INSULIN', x0 + 95 + i * 110, 520, { size: 12, fill: INK }); });
    inside();
  }
  const ang = open * 1.95, c = Math.cos(ang), far = x0 + w * c, bulge = 36 * Math.sin(ang);
  ctx.fillStyle = c > 0 ? '#f4f7fa' : '#cfd8e2'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(far, y0 - bulge); ctx.lineTo(far, y0 + h + bulge); ctx.lineTo(x0, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (open > 0 && open < 1) regLocal('fg', Math.min(x0, far), y0 - bulge, Math.max(x0, far), y0 + h + bulge, { id: 'fridge-door', transit: true });
  if (c > .6) {
    ctx.save(); ctx.translate(x0, 0); ctx.scale(c, 1);
    ctx.fillStyle = '#9aa3ad'; rr(w - 50, y0 + 360, 16, 200, 8); ctx.fill();
    ctx.fillStyle = '#fff27a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(40, y0 + 60, w - 80, 170); ctx.strokeRect(40, y0 + 60, w - 80, 170);
    text('NO FOOD', w / 2, y0 + 112, { size: 48, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 });
    text('IN MED FRIDGE', w / 2, y0 + 160, { size: 32, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 });
    text('(this means you)', w / 2, y0 + 200, { size: 20, fill: INK, italic: true });
    ctx.restore();
    if (key) regKey('fridge-sign', x0 + 40, y0 + 60, x0 + w - 40, y0 + 230);
  }
}

function wheelchair(x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = '#4a4f57'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-70, -330); ctx.lineTo(-60, -150); ctx.lineTo(90, -150); ctx.lineTo(110, -20); ctx.stroke();
  ctx.fillStyle = '#2a6fdb'; rr(-70, -175, 170, 30, 8); ctx.fill(); rr(-78, -330, 26, 170, 8); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 12; ell(-20, -110, 100, 100); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#8a8f96'; for (let i = 0; i < 6; i++) { const a = i / 6 * PI; ctx.beginPath(); ctx.moveTo(-20 + Math.cos(a) * 94, -110 + Math.sin(a) * 94); ctx.lineTo(-20 - Math.cos(a) * 94, -110 - Math.sin(a) * 94); ctx.stroke(); }
  ctx.fillStyle = '#222'; ell(110, -14, 16, 16); ctx.fill();
  ctx.restore();
}

// shared helpers used by Episode 3 onward (station clock and boards, call panel, calls, flashes)
function wordTimes(lineId) {
  const l = TL.lines.find(l => l.scene === CUR.id && l.id === lineId);
  return l ? l.words.map(w => l.s - CUR.start + w[1]) : [];
}
function labelWidth(str) { ctx.save(); ctx.font = '900 36px Nunito'; ctx.letterSpacing = '2px'; const w = ctx.measureText(str).width; ctx.restore(); return w + 90; }
function stationClock(clock) {
  const [hh, mm] = clock.split(':').map(Number);
  const ma = mm / 60 * TAU, ha = ((hh % 12) / 12 + mm / 720) * TAU;
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(540, 244); ctx.lineTo(540 + Math.sin(ha) * 26, 244 - Math.cos(ha) * 26); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(540, 244); ctx.lineTo(540 + Math.sin(ma) * 40, 244 - Math.cos(ma) * 40); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ell(540, 244, 6, 6); ctx.fill();
}
function memorial(x, y, name, rot) {
  paper2(x, y, 170, 180, rot, '#2b2233');
  ctx.strokeStyle = '#fff6c2'; ctx.lineWidth = 4; ell(0, -44, 32, 8); ctx.stroke();
  ctx.fillStyle = '#5a2a6a'; ell(0, -8, 36, 40); ctx.fill();
  ctx.fillStyle = '#fff'; ell(-12, -14, 8, 9); ctx.fill(); ell(12, -14, 8, 9); ctx.fill();
  ctx.fillStyle = INK; ell(-12, -12, 4, 4); ctx.fill(); ell(12, -12, 4, 4); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 2, 12, .3, PI - .3); ctx.stroke();
  text('R.I.P. ' + name, 0, 60, { size: 22, font: 'Bangers', weight: 400, fill: '#fff6c2', spacing: 2 });
  ctx.restore();
}
// Paper pennant string with one letter per flag, from x0 to x1 at y (sags a little).
function pennants(x0, y, x1, str, cols, size = 30) {
  const chars = [...str], n = chars.length, step = (x1 - x0) / n;
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - 10, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 22, x1 + 10, y); ctx.stroke();
  chars.forEach((c, i) => {
    if (c === ' ') return;
    const cx = x0 + step * (i + .5), u = (cx - x0) / (x1 - x0), yy = y + 44 * u * (1 - u) + 2;
    ctx.save(); ctx.translate(cx, yy); ctx.rotate(Math.sin(T * 1.6 + i) * .04);
    ctx.fillStyle = cols[i % cols.length]; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-step * .46, 0); ctx.lineTo(step * .46, 0); ctx.lineTo(0, size * 1.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    text(c, 0, size * .55, { size, font: 'Bangers', weight: 400, fill: '#fff', lw: 5, stroke: INK });
    ctx.restore();
  });
}
const BX0 = 622, BY0 = 182, BX1 = 1026, BY1 = 508;
function boardFace(col = '#fdfdfd') { ctx.fillStyle = col; ctx.fillRect(BX0, BY0, BX1 - BX0, BY1 - BY0); }
const CALL_ORDER = Array.from({ length: 40 }, (_, i) => i).sort((a, b) => hash(a * 3.3) - hash(b * 3.3));
function callPanel(lit, xmas) {
  boardFace('#262c35');
  ctx.fillStyle = '#39414d'; ctx.fillRect(BX0, BY0, BX1 - BX0, 46);
  text('CALL LIGHTS', 824, BY0 + 24, { size: 26, fill: '#c9d6e6', spacing: 2 });
  const on = new Set(CALL_ORDER.slice(0, Math.round(lit)));
  for (let i = 0; i < 40; i++) {
    const c = i % 8, r = Math.floor(i / 8), x = BX0 + 27 + c * 50, y = BY0 + 78 + r * 54;
    const lamp = on.has(i), blink = lamp && Math.sin(T * 9 + i * 1.7) > -.35;
    const col = xmas ? (i % 2 ? '#2bd45a' : '#ff2d3d') : '#ff2d3d', dim = xmas ? (i % 2 ? '#173d22' : '#4a1d22') : '#4a1d22';
    if (blink) { const g = ctx.createRadialGradient(x, y, 3, x, y, 40); g.addColorStop(0, col + '99'); g.addColorStop(1, col + '00'); ctx.fillStyle = g; ctx.fillRect(x - 40, y - 40, 80, 80); }
    ctx.fillStyle = blink ? col : dim; ell(x, y, 16, 16); ctx.fill();
    if (blink) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(x - 5, y - 5, 5, 4); ctx.fill(); }
  }
}
function staffNumbers() {
  [[290, '1'], [370, '40'], [450, '1:40']].forEach(([y, v]) => text(v, 930, y + 2, { size: 58, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 }));
}
function deskPhone(x, y, ring, lifted) {
  const sh = ring ? Math.sin(T * 60) * 3 : 0;
  ctx.save(); ctx.translate(x + sh, y);
  if (ring) { ctx.strokeStyle = 'rgba(255,230,120,.9)'; ctx.lineWidth = 4; for (let i = 1; i <= 3; i++) { const q = (T * 2 + i / 3) % 1; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(0, -40, 50 + q * 60, -PI * .85, -PI * .15); ctx.stroke(); } ctx.globalAlpha = 1; }
  ctx.fillStyle = '#e9e1d0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-60, -40, 120, 40, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#cfc6b3'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ell(10 + i * 14, -28 + j * 13, 4, 4); ctx.fill(); }
  if (!lifted) { ctx.fillStyle = '#e9e1d0'; ctx.strokeStyle = INK; rr(-64, -60, 70, 22, 10); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function nightShade() {
  ctx.fillStyle = 'rgba(14,18,54,.42)'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
  const g = ctx.createRadialGradient(540, 930, 60, 540, 930, 620); g.addColorStop(0, 'rgba(255,214,150,.22)'); g.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = g; ctx.fillRect(-PAD, 300, W + PAD * 2, 1300);
}
// o: clock, board ('sched' | 'calls' | 'staff' | 'sched27'), lit, bulletin ('oct' | 'xmas' | 'nye'), deco ('xmas' | 'nye'), frantic, night, keyBoard, keyClock
function flash(p) { if (p <= 0 || p >= 1) return; reg('overlay', [0, 0, W, STAGE_H], { id: 'flash', full: true }); ctx.fillStyle = `rgba(255,255,255,${1 - p})`; ctx.fillRect(0, 0, W, STAGE_H); }
function confetti(lt, t0, n = 70) {
  const k = lt - t0; if (k < 0) return;
  const cols = ['#ffe135', '#ff3b55', '#5b6cff', '#2ecc71', '#ff9f1c', '#fff'];
  for (let i = 0; i < n; i++) {
    const x = hash(i) * W + Math.sin(k * 2 + i) * 40, y = -40 + k * (260 + hash(i + 9) * 240) - hash(i + 4) * 300;
    if (y < -30 || y > STAGE_H) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * 6 + i); ctx.fillStyle = cols[i % 6]; ctx.fillRect(-9, -4, 18, 8); ctx.restore();
  }
}
function callCard(p, name, sub, col) {
  if (p <= 0) return;
  const x = 90, y = OV + 20, w = 900, h = 150;
  reg('overlay', [x, y, x + w, y + h], { id: 'call' });
  ctx.save(); ctx.globalAlpha = clamp(p * 1.4);
  ctx.fillStyle = 'rgba(245,245,250,.97)'; rr(x, y, w, h, 34); ctx.fill();
  ctx.fillStyle = col; rr(x + 30, y + 24, 102, 102, 24); ctx.fill();
  REG.suppress++; drawChar({ kind: 'apple', x: x + 81, y: y + 82, s: .3, center: true, noLegs: true, noArms: true, expr: 'happy', t: T, acc: ['sunglasses'] }); REG.suppress--;
  text(name, x + 160, y + 52, { size: 34, fill: '#111', align: 'left' });
  text(sub, x + 160, y + 100, { size: 28, fill: '#444', align: 'left', weight: 700, maxW: 700 });
  ctx.restore();
}

// ------------------------------------------------------------------ frame driver
const STAGE_H = 1480;
let STAGE = [0, 0, W, H];

function vignette(h) {
  const v = ctx.createRadialGradient(540, h * .47, h * .26, 540, h * .5, h * .68);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.4)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, h);
}

function applyCam(trans) {
  const dx = CAM.shake * vnoise(T * 37), dy = CAM.shake * vnoise(T * 41 + 50);
  const cy = EP.layout === 'panel' ? STAGE_H / 2 : H / 2;
  ctx.translate(W / 2 + dx, cy + dy); ctx.rotate(CAM.r + trans * .03);
  const z = CAM.z * (1 + .1 * trans);
  ctx.scale(z, z); ctx.translate(-CAM.x, -CAM.y);
}

function renderAt(t) {
  TL = EP.TL;
  T = clamp(t, 0, TL.duration - 1e-3);
  CUR = sceneAt(T);
  const lt = T - CUR.start;
  const S = EP.SCENES[CUR.id];
  REG.items = []; REG.errors = []; REG.order = 0; REG.phase = 'world';
  ctx = mainCtx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (EP.layout === 'panel') return renderPanelFrame(S, lt);
  // classic layout (Episode 1): full-frame stage, captions over the picture
  STAGE = [0, 0, W, H];
  CAM = { z: 1, x: W / 2, y: H / 2, r: 0, shake: 0 };
  S.cam(lt);
  const trans = CUR.id !== 'title' ? 1 - easeOut(seg(lt, 0, .35)) : 0;
  ctx.save();
  applyCam(trans);
  S.draw(lt);
  ctx.restore();
  grain();
  REG.phase = 'over';
  S.over(lt);
  if (CUR.id !== 'title' && CUR.id !== 'end') { drawChip(CUR, lt); drawWatermark(); }
  drawCaption(T);
  if (trans > 0) { ctx.fillStyle = `rgba(255,255,255,${.75 * trans * trans})`; ctx.fillRect(0, 0, W, H); }
}

// Panel layout (Episode 2+): the picture lives in a 1080x1480 stage and every caption,
// clock and title lives in a dedicated panel underneath, so text never sits on the action.
function renderPanelFrame(S, lt) {
  STAGE = [0, 0, W, STAGE_H];
  CAM = { z: 1, x: W / 2, y: STAGE_H / 2, r: 0, shake: 0 };
  S.cam(lt);
  const trans = S.noTransition ? 0 : 1 - easeOut(seg(lt, 0, .35));
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, STAGE_H); ctx.clip();
  ctx.save(); applyCam(0); S.draw(lt); ctx.restore();
  vignette(STAGE_H);
  REG.phase = 'over';
  S.over(lt);
  if (trans > 0) { ctx.fillStyle = `rgba(255,255,255,${.75 * trans * trans})`; ctx.fillRect(0, 0, W, STAGE_H); }
  ctx.restore();
  drawPanel(S, lt);
}

function drawPanel(S, lt) {
  const y0 = STAGE_H;
  let g = ctx.createLinearGradient(0, y0, 0, H); g.addColorStop(0, '#1d1328'); g.addColorStop(1, '#0c0812');
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0);
  g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#ff3b55'); g.addColorStop(1, '#ffd60a');
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, 8);
  // info row: clock + place on the left, show title on the right
  const iy = y0 + 56;
  let x = 44;
  const clock = S.panelClock ? S.panelClock(lt) : CUR.clock;
  if (clock) {
    ctx.fillStyle = Math.sin(T * 5) > -.2 ? '#ff2d3d' : '#6a1d22'; ell(x + 11, iy, 11, 11); ctx.fill();
    ctx.font = '400 46px Bangers'; ctx.letterSpacing = '2px'; const cw = ctx.measureText(clock).width; ctx.letterSpacing = '0px';
    text(clock, x + 32, iy + 3, { size: 46, font: 'Bangers', weight: 400, align: 'left', spacing: 2 });
    x += 32 + cw + 22;
  }
  const label = S.panelLabel ? S.panelLabel(lt) : CUR.label;
  if (label) {
    if (clock) { ctx.fillStyle = '#6d6280'; ell(x - 11, iy, 4, 4); ctx.fill(); }
    text(label, x, iy + 1, { size: 28, fill: '#ffd60a', align: 'left', maxW: 700 - x });
  }
  text('SHIFT HAPPENS', W - 116, iy + 3, { size: 36, font: 'Bangers', weight: 400, fill: '#ffd60a', align: 'right', spacing: 1 });
  rr(W - 104, iy - 17, 60, 34, 17); ctx.fillStyle = '#ff3b55'; ctx.fill();
  text('EP.' + EP.num, W - 74, iy + 1, { size: 20, fill: '#fff' });
  drawPanelCaption(T);
  // episode progress
  const p = T / TL.duration;
  text(EP.title, 44, H - 70, { size: 22, weight: 800, fill: '#8f86a0', align: 'left' });
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  text(`${fmt(T)} / ${fmt(TL.duration)}`, W - 44, H - 70, { size: 22, weight: 800, fill: '#8f86a0', align: 'right' });
  rr(44, H - 46, W - 88, 10, 5); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill();
  rr(44, H - 46, Math.max(10, (W - 88) * p), 10, 5); ctx.fillStyle = '#ff3b55'; ctx.fill();
  reg('panel', [0, y0, W, H], { id: 'panel' });
}

function drawPanelCaption(t) {
  const l = lineAt(t);
  if (!l) return;
  const lt = t - l.s;
  l._chunks = l._chunks || chunkWords(l.words);
  const chunk = l._chunks.find(c => lt < c[c.length - 1][2]) || l._chunks[l._chunks.length - 1];
  const size = 62, maxW = 990;
  ctx.font = `900 ${size}px Nunito`;
  const space = ctx.measureText(' ').width + 14;
  const lines = [[]]; let lw = 0;
  for (const w of chunk) {
    const ww = ctx.measureText(w[0]).width;
    if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push([w, ww]); lw += ww + space;
  }
  if (lines.length > 2) REG.errors.push(`caption needs ${lines.length} lines: "${chunk.map(w => w[0]).join(' ')}"`);
  const fade = seg(lt, chunk[0][1] - .04, chunk[0][1] + .08);
  // speaker
  ctx.font = '900 28px Nunito';
  const nw = Math.min(900, ctx.measureText(l.name).width + 40), py = STAGE_H + 124;
  ctx.fillStyle = l.color; rr(540 - nw / 2, py - 23, nw, 46, 23); ctx.fill();
  const dark = ['#ffd60a', '#ffd23f', '#e8e8e8', '#f4a300', '#ff9f1c', '#c9d22a', '#e8a86a', '#9fb3c8'].includes(l.color);
  text(l.name, 540, py + 1, { size: 28, fill: dark ? '#15111a' : '#fff', maxW: nw - 30 });
  const top = lines.length === 1 ? STAGE_H + 214 : STAGE_H + 192;
  lines.forEach((ln, i) => {
    const total = ln.reduce((a, [, ww]) => a + ww, 0) + space * (ln.length - 1);
    let x = 540 - total / 2;
    for (const [w, ww] of ln) {
      const said = lt >= w[1], active = said && lt < w[2];
      text(w[0], x + ww / 2, top + i * 80, { size, fill: active ? '#ffe135' : '#fff', lw: 10, stroke: '#0c0812', alpha: (said ? 1 : .55) * fade });
      x += ww + space;
    }
  });
}

// Draw a frame of another episode (no captions or HUD) into `target`, e.g. for a recap.
function renderEpisodeFrame(num, t, target) {
  const saved = { TL, T, CUR, CAM, EP, ctx, STAGE };
  REG.suppress++;
  EP = EPISODES[num]; TL = EP.TL; T = clamp(t, 0, TL.duration - 1e-3); CUR = sceneAt(T);
  const lt = T - CUR.start, S = EP.SCENES[CUR.id];
  ctx = target.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  CAM = { z: 1, x: W / 2, y: H / 2, r: 0, shake: 0 };
  S.cam(lt);
  ctx.save(); applyCam(0); S.draw(lt); ctx.restore();
  grain(); S.over(lt);
  ({ TL, T, CUR, CAM, EP, ctx, STAGE } = saved);
  REG.suppress--;
}

// ------------------------------------------------------------------ audit
function checkFrame() {
  const V = [], items = REG.items;
  const area = b => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const inter = (a, b) => { const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); return w > 0 && h > 0 ? w * h : 0; };
  const shrink = (b, f) => { const w = b[2] - b[0], h = b[3] - b[1]; return [b[0] + w * f, b[1] + h * f, b[2] - w * f, b[3] - h * f]; };
  const COVERS = {
    face: ['body', 'prop', 'fg', 'overlay', 'panel'],
    head: ['overlay', 'panel'],
    key: ['body', 'prop', 'fg', 'overlay', 'panel'],
    prop: ['overlay', 'panel', 'fg'],
    overlay: ['overlay', 'panel'],
  };
  const name = i => `${i.type}:${i.id || i.name || '?'}`;
  for (const a of items) {
    const kinds = COVERS[a.type];
    const aa = area(a.box);
    if (kinds && aa > 0) for (const b of items) {
      if (b.order < a.order || !kinds.includes(b.type) || b.full || b.transit || a.transit) continue;
      if (b.type === 'body' && b.id === a.id) continue;
      if (b.type === 'prop' && b.owner === a.id && (a.type !== 'face' || b.nearFace)) continue;
      if (a.type === 'overlay' && b.type === 'overlay' && (a.id === b.id || (a.group && a.group === b.group))) continue;
      const r = inter(a.box, b.type === 'body' ? shrink(b.box, .12) : b.box) / aa;
      if (r > .01) V.push(`${name(b)} covers ${name(a)} (${Math.round(r * 100)}%)`);
    }
    if (!a.transit && ['face', 'head', 'key', 'overlay', 'prop', 'otext'].includes(a.type) && !a.full) {
      const [x0, y0, x1, y1] = a.type === 'otext' ? [0, 0, W, H] : STAGE, m = a.type === 'otext' ? 6 : 0;
      if (a.box[0] < x0 + m - .5 || a.box[1] < y0 + m - .5 || a.box[2] > x1 - m + .5 || a.box[3] > y1 - m + .5) V.push(`${name(a)} cut off at frame edge [${a.box.map(Math.round)}]`);
    }
  }
  return V.concat(REG.errors);
}
function audit(start, end, step) {
  const out = [];
  REG.on = true;
  for (let t = start; t < end; t += step) {
    renderAt(t);
    for (const m of checkFrame()) out.push([+t.toFixed(2), CUR.id, m]);
  }
  REG.on = false;
  return out;
}
