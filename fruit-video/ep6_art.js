'use strict';
/* SHIFT HAPPENS, Episode 6 art kit: Mr. Lime, Fire Marshal Pomegranate, their costumes and props, the alarm vocabulary
 * (colors, rings, tags) and the on-screen graphics. Registers through the engine's EXT hooks, so earlier episodes are
 * untouched. Exposed to ep6_sets.js and ep6.js as window.A6. */
(() => {
const A = window.A6 = {};

// ------------------------------------------------------------------ new fruit
Object.assign(KINDS, {
  lime: { rx: 98, ry: 104, shape: 'lime', tex: 'zest', c: ['#f0ffa8', '#9bdc3c', '#3f7d14'], eyeY: -10, eyeX: 33, mouthY: 30, er: 21, leg: 78, hip: 30, shoe: '#e6dfcf', shoe2: '#6b5b45' },
  pom:  { rx: 128, ry: 122, shape: 'pom', tex: 'pom', c: ['#ff8272', '#c8102e', '#5e0012'], eyeY: -4, eyeX: 42, mouthY: 42, er: 24, mw: 28, leg: 86, hip: 40, shoe: '#2a2630', shoe2: '#ffd23f' },
});
Object.assign(TOPS, { lime: 132, pom: 206 });

EXT.shape.lime = (p, k) => {
  const { rx, ry } = k;
  p.moveTo(0, -ry);
  p.bezierCurveTo(rx * .46, -ry * .97, rx * 1.02, -ry * .52, rx, 0);
  p.bezierCurveTo(rx * 1.02, ry * .52, rx * .46, ry * .97, 0, ry);
  p.bezierCurveTo(-rx * .46, ry * .97, -rx * 1.02, ry * .52, -rx, 0);
  p.bezierCurveTo(-rx * 1.02, -ry * .52, -rx * .46, -ry * .97, 0, -ry);
};
EXT.shape.pom = (p, k) => {
  const { rx, ry } = k;
  p.moveTo(-rx * .34, -ry * .97);
  p.bezierCurveTo(-rx * .66, -ry * .96, -rx * 1.04, -ry * .62, -rx * 1.02, -ry * .08);
  p.bezierCurveTo(-rx * 1.0, ry * .55, -rx * .6, ry * 1.02, 0, ry * 1.02);
  p.bezierCurveTo(rx * .6, ry * 1.02, rx * 1.0, ry * .55, rx * 1.02, -ry * .08);
  p.bezierCurveTo(rx * 1.04, -ry * .62, rx * .66, -ry * .96, rx * .34, -ry * .97);
  p.bezierCurveTo(rx * .16, -ry * 1.0, -rx * .16, -ry * 1.0, -rx * .34, -ry * .97);
};

EXT.tex.zest = (o, k) => {
  const { rx, ry } = k;
  for (let i = 0; i < 120; i++) {
    const x = (srand(i) * 2 - 1) * rx, y = (srand(i + 200) * 2 - 1) * ry;
    if (Math.hypot(x / (rx * .62), (y - k.eyeY - 18) / (ry * .46)) < 1) continue;
    ctx.fillStyle = i % 3 ? 'rgba(40,90,10,.28)' : 'rgba(255,255,200,.3)'; ell(x, y, 2.4 + srand(i + 9) * 1.4, 1.8); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,220,.18)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-rx * .1, -ry * .9); ctx.quadraticCurveTo(rx * .7, 0, -rx * .1, ry * .9); ctx.stroke();
};
EXT.tex.pom = (o, k) => {
  const { rx, ry } = k;
  for (let i = 0; i < 30; i++) {
    const x = (srand(i + 5) * 2 - 1) * rx, y = (srand(i + 60) * 2 - 1) * ry;
    if (Math.hypot(x / (rx * .64), (y - k.eyeY - 18) / (ry * .5)) < 1) continue;
    ctx.fillStyle = i % 2 ? 'rgba(90,0,16,.16)' : 'rgba(255,200,170,.14)'; ell(x, y, 16 + srand(i + 3) * 26, 10 + srand(i + 8) * 18, srand(i) * 3); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,230,200,.35)';
  for (let i = 0; i < 40; i++) { const x = (srand(i + 11) * 2 - 1) * rx, y = (srand(i + 70) * 2 - 1) * ry; if (Math.hypot(x / (rx * .64), (y - k.eyeY - 18) / (ry * .5)) < 1) continue; ell(x, y, 1.6, 1.6); ctx.fill(); }
  const g = ctx.createLinearGradient(0, -ry, 0, -ry * .4); g.addColorStop(0, 'rgba(90,0,16,.35)'); g.addColorStop(1, 'rgba(90,0,16,0)');
  ctx.fillStyle = g; ctx.fillRect(-rx * 1.2, -ry * 1.1, rx * 2.4, ry * .8);
};
EXT.top.lime = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.fillStyle = '#6b8f2a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(0, -k.ry - 3, 9, 6); ctx.fill(); ctx.stroke();
  leaf(5, -k.ry - 4, .9, 44, 13, '#58b83a');
};
EXT.top.pom = (o, k, t, layer) => {
  if (layer !== 'front' || (o.acc || []).includes('firehelmet')) return;
  const y = -k.ry * .96;
  ctx.fillStyle = '#9a1a28'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath();
  ctx.moveTo(-40, y + 8);
  for (let i = 0; i < 5; i++) { const x = -40 + i * 20; ctx.lineTo(x + 5, y - 34 - (i % 2) * 8); ctx.lineTo(x + 14, y + 2); }
  ctx.lineTo(40, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
};

// ---- costumes
const bodyClip = (o, k) => ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
EXT.acc.cardigan = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  ctx.save(); bodyClip(o, k);
  const top = k.mouthY + 34, col = o.cardColor || '#b8742e';
  const g = V2.grad(0, top, 0, k.ry, [[0, col], [1, V2.rgba(V2.mix(col, '#000', .35), 1)]]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-k.rx * 1.2, top + 10); ctx.lineTo(-18, top); ctx.lineTo(0, top + 40); ctx.lineTo(18, top); ctx.lineTo(k.rx * 1.2, top + 10); ctx.lineTo(k.rx * 1.2, k.ry * 1.2); ctx.lineTo(-k.rx * 1.2, k.ry * 1.2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,20,10,.35)'; ctx.lineWidth = 2.4;
  for (let x = -k.rx; x <= k.rx; x += 17) { ctx.beginPath(); ctx.moveTo(x, top + 16); ctx.bezierCurveTo(x + 7, top + 36, x - 7, top + 56, x, k.ry * 1.1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(20,10,5,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-18, top); ctx.lineTo(0, top + 40); ctx.lineTo(18, top); ctx.stroke();
  ctx.fillStyle = '#f4e6c8'; for (const y of [top + 62, top + 88]) { ell(0, y, 6, 6); ctx.fill(); ctx.strokeStyle = 'rgba(20,10,5,.7)'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore();
};
EXT.acc.firecoat = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  ctx.save(); bodyClip(o, k);
  const top = k.mouthY + 40;
  ctx.fillStyle = V2.grad(0, top, 0, k.ry, [[0, '#ffd23a'], [1, '#d99a00']]);
  ctx.beginPath(); ctx.moveTo(-k.rx * 1.2, top + 12); ctx.quadraticCurveTo(0, top - 14, k.rx * 1.2, top + 12); ctx.lineTo(k.rx * 1.2, k.ry * 1.2); ctx.lineTo(-k.rx * 1.2, k.ry * 1.2); ctx.closePath(); ctx.fill();
  for (const y of [top + 38, top + 74]) {
    ctx.fillStyle = '#cfd6dc'; ctx.fillRect(-k.rx * 1.2, y, k.rx * 2.4, 11);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-k.rx * 1.2, y + 2, k.rx * 2.4, 3);
    ctx.fillStyle = 'rgba(40,40,50,.18)'; ctx.fillRect(-k.rx * 1.2, y + 8, k.rx * 2.4, 3);
  }
  ctx.strokeStyle = 'rgba(70,40,0,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, top + 6); ctx.lineTo(0, k.ry * 1.2); ctx.stroke();
  ctx.fillStyle = '#8a8f96'; for (const y of [top + 20, top + 56, top + 92]) { rr(-9, y, 18, 10, 3); ctx.fill(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-k.rx * 1.2, top + 12); ctx.quadraticCurveTo(0, top - 14, k.rx * 1.2, top + 12); ctx.stroke();
  ctx.restore();
};
EXT.acc.firehelmet = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const by = -k.ry * .5, w = k.rx * .98;
  ctx.save();
  // brim (long at the back, short at the front), dome, ridge and shield
  ctx.fillStyle = '#b87a00'; ctx.strokeStyle = INK; ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.moveTo(-w - 18, by + 14); ctx.quadraticCurveTo(0, by + 40, w + 18, by + 14); ctx.quadraticCurveTo(0, by - 4, -w - 18, by + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(-w, by - 90, w, by, [[0, '#ffe46a'], [.5, '#ffc61a'], [1, '#c98a00']]);
  ctx.beginPath(); ctx.moveTo(-w, by + 8); ctx.bezierCurveTo(-w, by - 50, -w * .6, by - 104, 0, by - 106); ctx.bezierCurveTo(w * .6, by - 104, w, by - 50, w, by + 8); ctx.quadraticCurveTo(0, by + 26, -w, by + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d99a00'; ctx.beginPath(); ctx.moveTo(-14, by - 100); ctx.lineTo(14, by - 100); ctx.lineTo(18, by + 14); ctx.lineTo(-18, by + 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-w * .45, by - 64, 16, 40, -.4); ctx.fill();
  ctx.fillStyle = '#d81f2f'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-30, by - 62); ctx.lineTo(30, by - 62); ctx.lineTo(30, by - 24); ctx.quadraticCurveTo(0, by - 2, -30, by - 24); ctx.closePath(); ctx.fill(); ctx.stroke();
  text('FM', 0, by - 40, { size: 26, font: 'Bangers', weight: 400, fill: '#ffe46a' });
  ctx.restore();
};
EXT.acc.vestknit = EXT.acc.cardigan;

// ---- props held in hands (drawn around the hand; boxes registered for the audit)
Object.assign(PROP_BOX, {
  pocketwatch: [-34, -36, 34, 74], basin: [-48, -22, 48, 30], flashlight: [-26, -84, 26, 44], battery9v: [-18, -50, 18, 20],
  popcornbag: [-40, -92, 40, 40], stethhead: [-34, -34, 34, 70], detector: [-42, -48, 42, 34], clipboard6: Object.assign([-6, -150, 92, 12], { mirror: true }),
});
EXT.prop.pocketwatch = (side, o, t) => {
  ctx.strokeStyle = '#d9b341'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(side * 22, 36, side * 8, 62); ctx.stroke();
  ctx.fillStyle = '#f2d36b'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ell(0, -8, 27, 27); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffdf2'; ell(0, -8, 21, 21); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,.55)'; ctx.lineWidth = 1.6; ctx.stroke();
  const m = (o.watchMin ?? 20), h = (o.watchHr ?? 3);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(Math.sin(m / 60 * TAU) * 17, -8 - Math.cos(m / 60 * TAU) * 17); ctx.stroke();
  ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(Math.sin((h + m / 60) / 12 * TAU) * 11, -8 - Math.cos((h + m / 60) / 12 * TAU) * 11); ctx.stroke();
  ctx.fillStyle = '#d9b341'; rr(-4, -39, 8, 8, 2); ctx.fill();
};
EXT.prop.basin = (side, o, t) => {
  ctx.fillStyle = '#4fb3c8'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-46, 2); ctx.quadraticCurveTo(0, -30, 46, 2); ctx.quadraticCurveTo(30, 30, -6, 28); ctx.quadraticCurveTo(-40, 26, -46, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(-10, -5, 22, 5, .1); ctx.fill();
};
EXT.prop.flashlight = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.12);
  ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-13, -52, 26, 86, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a2630'; rr(-16, -74, 32, 26, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff6c8'; ell(0, -76, 12, 5); ctx.fill();
  ctx.fillStyle = '#8f0f1e'; ctx.fillRect(-13, -14, 26, 8);
  ctx.restore();
};
EXT.prop.battery9v = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.1);
  ctx.fillStyle = '#3b4552'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-17, -32, 34, 52, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2f8fe0'; ctx.fillRect(-17, -20, 34, 22);
  ctx.fillStyle = '#d6dde6'; rr(-9, -46, 18, 15, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d6dde6'; ell(8, -36, 5, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '900 13px Nunito'; ctx.textAlign = 'center'; ctx.fillText('9V', 0, -4);
  ctx.restore();
};
EXT.prop.popcornbag = (side, o, t) => {
  ctx.fillStyle = '#2a2428'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-34, -72); ctx.lineTo(34, -72); ctx.lineTo(42, 30); ctx.lineTo(-42, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a4a22'; ctx.fillRect(-34, -72, 68, 14);
  ctx.fillStyle = '#e8e2d2'; for (let i = 0; i < 6; i++) { ell(-24 + i * 10, -76 - (i % 2) * 6, 7, 6); ctx.fill(); }
  text('POP', 0, -24, { size: 22, font: 'Bangers', weight: 400, fill: '#7a5a30' });
};
EXT.prop.detector = (side, o, t) => {
  ctx.fillStyle = V2.grad(-38, -38, 38, 38, [[0, '#ffffff'], [1, '#c8ccd3']]); ctx.strokeStyle = INK; ctx.lineWidth = 4; ell(0, -6, 38, 38); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,60,70,.5)'; ctx.lineWidth = 2.4; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, -6 + Math.sin(a) * 14); ctx.lineTo(Math.cos(a) * 30, -6 + Math.sin(a) * 30); ctx.stroke(); }
  const on = o.detLed ?? 0; ctx.fillStyle = on > .05 ? `rgba(255,50,50,${.4 + .6 * on})` : '#4a1a1a'; ell(22, -22, 5.5, 5.5); ctx.fill();
  ctx.strokeStyle = '#c93a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, 24); ctx.quadraticCurveTo(-4, 44, 8, 34); ctx.stroke();
};
// a clipboard gripped by its lower edge: the board rises from the glove and points away from the body, so the hand never covers the writing
EXT.prop.clipboard6 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.1);
  ctx.save(); ctx.scale(side, 1);
  ctx.fillStyle = '#b8864a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-4, -140, 96, 134, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(4, -126, 80, 104);
  ctx.fillStyle = '#9aa0a6'; ctx.lineWidth = 3; rr(24, -148, 40, 18, 5); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#8fa7c9'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(12, -58 + i * 13); ctx.lineTo(74 - (i % 3) * 12, -58 + i * 13); ctx.stroke(); }
  ctx.restore();
  if (o.clipText) text(o.clipText, side * 44, -92, { size: 17, fill: '#e8193a', weight: 900 });
  ctx.restore();
};
EXT.prop.stethhead = (side, o, t) => {
  ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(side * 6, 38); ctx.quadraticCurveTo(side * 30, 80, side * 8, 120); ctx.stroke();
  ctx.fillStyle = '#c8d0da'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ell(0, 0, 30, 30); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eef2f6'; ell(0, 0, 21, 21); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(-8, -9, 7, 4, -.6); ctx.fill();
};

// ------------------------------------------------------------------ constructors
A.lime = o => Object.assign({ kind: 'lime', id: 'lime', who: 'lime', s: 1.2, y: 1400, acc: ['readers', 'cardigan'], expr: 'happy', cardColor: '#c98a2e', seed: 71 }, o);
A.pom = o => Object.assign({ kind: 'pom', id: 'pom', who: 'marshal', s: 1.3, y: 1400, acc: ['firehelmet', 'firecoat', 'mustache'], expr: 'neutral', topExtra: 18, seed: 83 }, o);
A.mango = o => Object.assign({ kind: 'mango', id: 'mango', who: 'mango', s: SC, y: G, acc: ['badge', 'gaitbelt', 'keys'], badgeText: 'CNA' , expr: 'neutral' }, o);
A.pear = o => Object.assign({ kind: 'pear', id: 'pear', who: 'pear', s: SC, y: G, acc: ['newsboy', 'suspenders', 'unionpin'], expr: 'neutral' }, o);
A.straw = o => Object.assign({ kind: 'straw', id: 'straw', who: 'straw', s: SC, y: G, acc: STRAW_ACC, lashes: true }, o);

// ------------------------------------------------------------------ the alarm vocabulary
A.ALARM = {
  chair: { rgb: '255,170,40', name: 'CHAIR', hex: '#ffaa28' },
  pump: { rgb: '80,165,255', name: 'IV PUMP', hex: '#50a5ff' },
  pulse: { rgb: '90,230,130', name: 'PULSE OX', hex: '#5ae682' },
  bed: { rgb: '255,205,70', name: 'BED EXIT', hex: '#ffcd46' },
  door: { rgb: '255,70,70', name: 'EXIT DOOR', hex: '#ff4646' },
  call: { rgb: '255,255,255', name: 'CALL LIGHT', hex: '#ffffff' },
  chirp: { rgb: '255,90,90', name: 'CHIRP', hex: '#ff5a5a' },
  fire: { rgb: '255,60,40', name: 'FIRE', hex: '#ff3c28' },
  micro: { rgb: '255,236,140', name: 'MICROWAVE', hex: '#ffec8c' },
};

// an alarm tag: a small glass pill that points at its source
A.tag = (x, y, kind, label, p = 1, o = {}) => {
  if (p <= 0) return;
  const al = A.ALARM[kind], s = easeBack(clamp(p));
  ctx.save(); ctx.globalAlpha *= clamp(p * 2.2); ctx.translate(x, y); ctx.scale(s, s);
  ctx.font = '900 30px Nunito'; ctx.letterSpacing = '1px'; const w = ctx.measureText(label).width + 86; ctx.letterSpacing = '0px';
  const h = 62, x0 = o.left ? 0 : -w / 2;
  reg('overlay', [x + x0 * s, y - h / 2 * s, x + (x0 + w) * s, y + h / 2 * s], { id: 'tag:' + label });
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = 'rgba(12,10,24,.88)'; rr(x0, -h / 2, w, h, h / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = `rgba(${al.rgb},.95)`; ctx.lineWidth = 3.5; rr(x0, -h / 2, w, h, h / 2); ctx.stroke();
  ctx.fillStyle = `rgba(${al.rgb},1)`; ell(x0 + 32, 0, 12, 12); ctx.fill();
  ctx.fillStyle = `rgba(${al.rgb},.35)`; ell(x0 + 32, 0, 20, 20); ctx.fill();
  text(label, x0 + 60, 2, { size: 30, fill: '#fff', align: 'left', spacing: 1 });
  ctx.restore();
};

// the ACTIVE ALARMS counter, top right
A.hud = (n, o = {}) => {
  const { appear = 1, flash = 0, matter = 0, unknown = 0, vol = null } = o;
  if (appear <= 0) return;
  const x = 520, y = 128, w = 512, h = 112, s = easeBack(clamp(appear));
  const cx = x + w / 2, cy = y + h / 2;
  reg('overlay', [x, y, x + w, y + h + (vol != null ? 34 : 0)], { id: 'hud-alarms' });
  ctx.save(); ctx.globalAlpha *= clamp(appear * 2); ctx.translate(cx, cy); ctx.scale(s * (1 + .06 * flash), s * (1 + .06 * flash)); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = 'rgba(10,8,22,.9)'; rr(x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  const edge = unknown ? '255,90,90' : '255,190,60';
  ctx.strokeStyle = `rgba(${edge},${.9 + .1 * Math.sin(T * 8)})`; ctx.lineWidth = 4; rr(x, y, w, h, 28); ctx.stroke();
  // bell
  ctx.fillStyle = `rgba(${edge},.18)`; ell(x + 58, cy, 36, 36); ctx.fill();
  ctx.fillStyle = `rgb(${edge})`; ctx.beginPath(); ctx.moveTo(x + 40, cy + 12); ctx.quadraticCurveTo(x + 42, cy - 22, x + 58, cy - 22); ctx.quadraticCurveTo(x + 74, cy - 22, x + 76, cy + 12); ctx.closePath(); ctx.fill();
  ctx.fillRect(x + 36, cy + 10, 44, 6); ell(x + 58, cy + 22, 6, 5); ctx.fill();
  const r1 = (T * 1.4) % 1; ctx.strokeStyle = `rgba(${edge},${1 - r1})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 58, cy, 24 + r1 * 26, -.9, .9 + PI, true); ctx.stroke();
  text(unknown ? 'UNKNOWN ALARM' : 'ACTIVE ALARMS', x + 112, y + 32, { size: 21, fill: unknown ? '#ffb0b0' : '#ffd88a', align: 'left', spacing: 2 });
  text(String(n), x + w - 34, y + 70, { size: 84, font: 'Bangers', weight: 400, fill: flash ? '#fff' : (unknown ? '#ff6a6a' : '#ffbe3c'), align: 'right', spacing: 2 });
  if (matter) { ctx.fillStyle = '#ff3b55'; rr(x + 112, y + 54, 150, 40, 12); ctx.fill(); text('4 MATTER', x + 187, y + 75, { size: 26, fill: '#fff', spacing: 1 }); }
  ctx.restore();
  if (vol != null) {
    ctx.save(); ctx.globalAlpha *= clamp(appear * 2);
    const by = y + h + 18; ctx.fillStyle = 'rgba(10,8,22,.8)'; rr(x, by - 14, w, 32, 16); ctx.fill();
    text('VOLUME', x + 22, by + 2, { size: 17, fill: '#9fb3c8', align: 'left', spacing: 2 });
    ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(x + 120, by - 6, w - 190, 16, 8); ctx.fill();
    ctx.fillStyle = '#5ae682'; rr(x + 120, by - 6, Math.max(14, (w - 190) * vol), 16, 8); ctx.fill();
    text(Math.round(vol * 100) + '%', x + w - 20, by + 2, { size: 20, fill: '#fff', align: 'right', weight: 900 });
    ctx.restore();
  }
};

// the search tally, in the same pill as the alarm counter: rooms checked, and what was found
A.tally = (n, found, o = {}) => {
  const { appear = 1, total = 30 } = o;
  if (appear <= 0) return;
  const x = 520, y = 128, w = 512, h = 112, s = easeBack(clamp(appear)), cx = x + w / 2, cy = y + h / 2;
  reg('overlay', [x, y, x + w, y + h], { id: 'hud-tally' });
  ctx.save(); ctx.globalAlpha *= clamp(appear * 2); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = 'rgba(10,8,22,.9)'; rr(x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(120,170,255,.9)'; ctx.lineWidth = 4; rr(x, y, w, h, 28); ctx.stroke();
  // a door that opens a little more with every room
  ctx.fillStyle = 'rgba(120,170,255,.18)'; ell(x + 58, cy, 36, 36); ctx.fill();
  ctx.fillStyle = '#7fb0ff'; ctx.strokeStyle = '#0c0812'; ctx.lineWidth = 3; rr(x + 44, cy - 24, 28, 48, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd60a'; ell(x + 66, cy + 2, 3.4, 3.4); ctx.fill();
  text('ROOMS CHECKED', x + 112, y + 32, { size: 21, fill: '#b8d0ff', align: 'left', spacing: 2 });
  text(`${n}`, x + 112, y + 80, { size: 64, font: 'Bangers', weight: 400, fill: '#fff', align: 'left', spacing: 2 });
  ctx.font = '400 64px Bangers'; const wN = ctx.measureText(`${n}`).width + 2 * `${n}`.length;
  text(`/ ${total}`, x + 112 + wN + 14, y + 82, { size: 30, fill: '#8aa0c8', align: 'left', spacing: 1 });
  ctx.fillStyle = found ? '#5ae682' : '#ff3b55'; rr(x + w - 168, y + 52, 142, 40, 12); ctx.fill(); text(found ? 'FOUND IT' : 'FOUND: 0', x + w - 97, y + 73, { size: 24, fill: '#fff', spacing: 1 });
  ctx.restore();
};

// a slammed word, like the other episodes' stamps but cleaner: no rotation, so its box is exact
A.slam = (p, str, y, o = {}) => {
  if (p <= 0) return;
  const { size = 120, fill = '#ffe135', sub = '', subFill = '#fff' } = o;
  const s = lerp(1.4, 1, easeOut(clamp(p * 1.6))), a = clamp(p * 4);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(540, y); ctx.scale(s, s);
  ctx.font = `400 ${size}px Bangers`; ctx.letterSpacing = '3px'; const w = ctx.measureText(str).width; ctx.letterSpacing = '0px';
  reg('overlay', [540 - w / 2 * s, y - size * .62 * s, 540 + w / 2 * s, y + (size * .62 + (sub ? 70 : 0)) * s], { id: 'slam:' + str, transit: s > 1.04 });
  text(str, 0, 0, { size, font: 'Bangers', weight: 400, fill, lw: 16, stroke: '#150f22', spacing: 3, shadow: 18 });
  if (sub) text(sub, 0, size * .72, { size: 40, fill: subFill, lw: 10, stroke: '#150f22', spacing: 2 });
  ctx.restore();
};

// a sound ring in the color of its alarm
A.ring = (x, y, k, kind, o = {}) => V2.ring(x, y, k, Object.assign({ color: A.ALARM[kind].rgb, r0: 22, r1: 300, lw: 9, alpha: .95 }, o));
// rings repeating at a rate over a window of time
A.pulse = (x, y, lt, t0, t1, kind, rate = 2.4, o = {}) => {
  const life = o.life ?? 1.2;
  for (let i = Math.max(0, Math.floor((lt - life - t0) * rate)); i < 400; i++) {
    const ti = t0 + i / rate;
    if (ti > t1 || ti > lt) break;
    const k = (lt - ti) / life;
    if (k > 0 && k < 1) A.ring(x, y, k, kind, o);
  }
};
})();
