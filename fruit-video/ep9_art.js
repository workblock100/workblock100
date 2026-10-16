'use strict';
/* SHIFT HAPPENS, Episode 9 art kit: Agency Nurse Persimmon (per diem), her badge, earbuds, cucumber slices, iced coffee and the facility key ring,
 * the Administrator on the v2 renderer, and the shared pieces of the SHIFTGO staffing app (phone frame, app icon, five stars, money text).
 * Registers through the engine's EXT hooks, so earlier episodes are untouched. Exposed as window.A9. */
(() => {
const A = window.A9 = {};
const bodyClip = (o, k) => ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
const skipFace = (x, y, k, a = .62, b = .46) => Math.hypot(x / (k.rx * a), (y - k.eyeY - 18) / (k.ry * b)) < 1;

// ------------------------------------------------------------------ the agency nurse: a persimmon (per diem), squat and calm
Object.assign(KINDS, {
  persimmon: { rx: 114, ry: 100, shape: 'persimmon', tex: 'persimmon', c: ['#ffb85c', '#ff7c16', '#b03c06'], eyeY: -8, eyeX: 38, mouthY: 34, er: 19, leg: 84, hip: 36, shoe: '#ffffff', shoe2: '#2ec4b6' },
});
Object.assign(TOPS, { persimmon: 142 });

EXT.shape.persimmon = (p, k) => {   // a Fuyu persimmon: a soft square with a flat shoulder, a little wider than it is tall
  const { rx, ry } = k;
  p.moveTo(0, -ry * .94);
  p.bezierCurveTo(rx * .5, -ry * .98, rx * .98, -ry * .84, rx, -ry * .2);
  p.bezierCurveTo(rx * 1.02, ry * .5, rx * .72, ry, 0, ry);
  p.bezierCurveTo(-rx * .72, ry, -rx * 1.02, ry * .5, -rx, -ry * .2);
  p.bezierCurveTo(-rx * .98, -ry * .84, -rx * .5, -ry * .98, 0, -ry * .94);
};
EXT.tex.persimmon = (o, k) => {
  const { rx, ry } = k;
  ctx.strokeStyle = 'rgba(150,60,0,.06)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const f of [-.62, -.22, .22, .62]) { ctx.beginPath(); ctx.moveTo(f * rx * .3, -ry * .9); ctx.bezierCurveTo(f * rx * 1.05, -ry * .3, f * rx * 1.12, ry * .35, f * rx * .55, ry * .96); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, -ry, 0, -ry * .2, [[0, 'rgba(255,238,150,.42)'], [1, 'rgba(255,238,150,0)']]); ctx.fillRect(-rx * 1.2, -ry * 1.1, rx * 2.4, ry * .9);
  ctx.fillStyle = V2.grad(0, ry * .2, 0, ry, [[0, 'rgba(160,50,0,0)'], [1, 'rgba(160,50,0,.34)']]); ctx.fillRect(-rx * 1.2, ry * .2, rx * 2.4, ry * .85);
  for (let i = 0; i < 40; i++) {
    const x = (srand(i + 5) * 2 - 1) * rx * .94, y = (srand(i + 51) * 2 - 1) * ry * .94;
    if (skipFace(x, y, k, .72, .62)) continue;
    ctx.fillStyle = i % 3 ? 'rgba(130,50,0,.18)' : 'rgba(255,230,160,.28)'; ell(x, y, 2 + srand(i + 9) * 2.2, 1.8 + srand(i + 4) * 1.4, srand(i) * 3); ctx.fill();
  }
};
EXT.top.persimmon = (o, k, t, layer) => {   // the calyx: four leafy lobes laid over the flat shoulder and a stubby stem
  if (layer !== 'front') return;
  const y0 = -k.ry * .93, rx = k.rx;
  ctx.save(); ctx.translate(0, y0); ctx.lineJoin = 'round';
  const lobe = (s, len, up, fill) => {
    ctx.save(); ctx.scale(s, 1);
    ctx.fillStyle = V2.grad(0, -26, 0, 14, [[0, '#9cc740'], [1, fill]]); ctx.strokeStyle = '#2f4a12'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(0, -4 - up); ctx.bezierCurveTo(len * .3, -28 - up, len * .8, -16 - up * .6, len, 14); ctx.bezierCurveTo(len * .66, 6, len * .3, 8, 0, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,70,10,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8, -2 - up * .6); ctx.quadraticCurveTo(len * .45, -10 - up * .4, len * .82, 8); ctx.stroke();
    ctx.restore();
  };
  lobe(-1, rx * .3, 20, '#5a7f1e'); lobe(1, rx * .3, 20, '#5a7f1e');            // the two small lobes at the back
  ctx.fillStyle = '#7a5a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-6, -30, 12, 32, 4); ctx.fill(); ctx.stroke();   // stem
  lobe(-1, rx * .5, 0, '#6f9a2c'); lobe(1, rx * .5, 0, '#6f9a2c');              // the two big side lobes, drooping over the shoulders
  ctx.restore();
};

// ------------------------------------------------------------------ costume
EXT.acc.perdiem = (o, k, t, layer) => {   // a clip-on PER DIEM badge on a short reel cord, hung low and to the side, well clear of the mouth
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .57, k.ry * .34); ctx.rotate(.05 * Math.sin(t * 2.1));   // the card's right edge is 10 px clear of the left end of an open mouth
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
  ctx.fillStyle = '#c0c6cf'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-9, -7, 18, 12, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.lineWidth = 3; rr(-30, 12, 60, 58, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; rr(-30, 12, 60, 18, 6); ctx.fill(); ctx.stroke();
  text('PER DIEM', 0, 22, { size: 9, fill: '#fff', weight: 900, spacing: .6, maxW: 54 });
  ctx.fillStyle = '#c9d2f0'; ell(0, 44, 11, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; rr(-18, 59, 36, 5, 2); ctx.fill();
  ctx.restore();
};
EXT.acc.airpods = (o, k, t, layer) => {   // white earbuds at both ears
  if (layer !== 'front') return;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * k.rx * .97, k.eyeY - 16);   // at the ears, above the shoulder joints (they used to sit right under them)
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    rr(-2.6, 2, 5.2, 26, 2.6); ctx.fill(); ctx.stroke();
    ell(0, 0, 7.5, 9.5); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
};
EXT.acc.cucumbers = (o, k, t, layer) => {   // two cucumber slices over the eyes: a spa break, eyes closed
  if (layer !== 'front') return;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * k.eyeX, k.eyeY); ctx.rotate(s * .18);
    const r = k.er * 1.55;
    ctx.fillStyle = '#4f8a2a'; ctx.strokeStyle = '#2f5a14'; ctx.lineWidth = 3; ell(0, 0, r, r * .96); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d7eeaa'; ell(0, 0, r * .84, r * .8); ctx.fill();
    ctx.fillStyle = '#e9f7cc'; ell(0, 0, r * .52, r * .5); ctx.fill();
    ctx.fillStyle = '#a8cf70'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ell(Math.cos(a) * r * .36, Math.sin(a) * r * .34, 2.6, 4.2, a + PI / 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, r * .86, PI * 1.05, PI * 1.45); ctx.stroke();
    ctx.restore();
  }
};

// ------------------------------------------------------------------ props
Object.assign(PROP_BOX, { icedcup: Object.assign([-20, -86, 20, 4], { nearFace: true }), keyring9: [-44, -24, 44, 106] });
EXT.prop.icedcup = (side, o, t) => {   // an iced coffee: clear cup, cream swirled into the coffee, ice, a dome lid and a straw
  ctx.save(); ctx.scale(.78, .78); ctx.translate(0, 0);
  ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
  ctx.fillStyle = 'rgba(235,245,255,.55)'; ctx.beginPath(); ctx.moveTo(-23, -72); ctx.lineTo(23, -72); ctx.lineTo(17, 2); ctx.lineTo(-17, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.moveTo(-21, -66); ctx.lineTo(21, -66); ctx.lineTo(16, 0); ctx.lineTo(-16, 0); ctx.closePath(); ctx.clip();
  ctx.fillStyle = V2.grad(0, -66, 0, 0, [[0, '#d9b48a'], [.5, '#8a5a30'], [1, '#4a2a12']]); ctx.fillRect(-26, -66, 52, 70);
  ctx.fillStyle = 'rgba(255,240,215,.7)'; ctx.beginPath(); ctx.moveTo(-26, -58); for (let i = 0; i <= 8; i++) ctx.lineTo(-26 + i * 6.5, -58 + 6 * Math.sin(i * 1.7 + t * 2)); ctx.lineTo(26, -42); ctx.lineTo(-26, -42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; for (const [x, y] of [[-8, -44], [6, -34], [-2, -22], [9, -12]]) { rr(x - 5, y - 5, 10, 10, 2.4); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(-18, -66); ctx.lineTo(-16, -8); ctx.lineTo(-12, -8); ctx.lineTo(-14, -66); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f4f8'; rr(-26, -80, 52, 10, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(244,244,248,.9)'; ctx.beginPath(); ctx.moveTo(-20, -80); ctx.quadraticCurveTo(0, -96, 20, -80); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(4, -48); ctx.lineTo(8, -88); ctx.lineTo(13, -108); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(6.5, -84); ctx.lineTo(13, -107); ctx.stroke();
  ctx.restore();
};
EXT.prop.keyring9 = (side, o, t) => {   // the facility's key ring: far too many keys and a laminated tag, swinging a little
  ctx.save(); ctx.rotate(Math.sin(t * 3.1 + 1) * .09 + (o.keySwing || 0));
  const cols = ['#d4af37', '#c0c6cf', '#d4af37', '#b87333', '#c0c6cf', '#d4af37', '#c0c6cf', '#b87333', '#d4af37'];
  for (let i = 0; i < 9; i++) {
    ctx.save(); ctx.translate(0, 12); ctx.rotate(-1.0 + i * .25); ctx.translate(0, 8);
    ctx.fillStyle = cols[i]; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-4, 0, 8, 38 + (i % 3) * 8, 3); ctx.fill(); ctx.stroke();
    ell(0, 44 + (i % 3) * 8, 8, 8); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 5.4; ell(0, 6, 17, 17); ctx.stroke();
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.save(); ctx.translate(0, 8); ctx.rotate(.1); rr(-26, 22, 52, 34, 5); ctx.fill(); ctx.stroke();
  text('MED RM', 0, 34, { size: 10, fill: '#d62828', weight: 900, spacing: 1 }); text('ALL KEYS', 0, 46, { size: 9, fill: INK, weight: 900 }); ctx.restore();
  if (o.keyGlint > 0) {   // a glint that rides on the keys themselves (o.keyGlint is its strength, 0 to 1)
    const r = 28; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(-38, 56);   // on the tip of a key, off the tag so ALL KEYS stays readable
    ctx.fillStyle = `rgba(255,250,220,${o.keyGlint})`;
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .12, -r * .12, r, 0); ctx.quadraticCurveTo(r * .12, r * .12, 0, r); ctx.quadraticCurveTo(-r * .12, r * .12, -r, 0); ctx.quadraticCurveTo(-r * .12, -r * .12, 0, -r); ctx.fill(); ctx.restore();
  }
  ctx.restore();
};

// ------------------------------------------------------------------ constructors
A.persimmon = o => Object.assign({ kind: 'persimmon', id: 'persimmon', who: 'persimmon', s: SC, y: G, acc: ['perdiem', 'airpods'], expr: 'neutral', lid: .3, seed: 77 }, o);
EXT.acc.nametag9 = (o, k, t, layer) => {   // the Administrator's tag, nearer the middle of the chest so a hand on the hip no longer lands on its end
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .3, k.ry * .7); ctx.rotate(-.06);
  ctx.font = '900 15px Nunito'; const tw = Math.max(88, ctx.measureText(o.tag || 'ADMIN').width + 18);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-tw / 2, -15, tw, 30, 6); ctx.fill(); ctx.stroke();
  text(o.tag || 'ADMIN', 0, 1, { size: 15, fill: '#243a5e' });
  ctx.restore();
};
A.melon = o => Object.assign({ kind: 'melon', id: 'melon', who: 'melon', s: 1.22, y: G, acc: ['suit', 'nametag9'], tag: 'ADMINISTRATOR', expr: 'happy' }, o);

// ------------------------------------------------------------------ SHIFTGO, the staffing app (a rideshare for nurses)
A.money = (n, cents = true) => '$' + (cents ? n.toFixed(2) : String(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',').replace(/(\.\d\d)$/, '$1');
A.starPath = (x, y, r) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? r * .46 : r; i ? ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R) : ctx.moveTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } ctx.closePath(); };
// five rating stars; filled is how many are lit (a fraction pops the next one in), size is the star radius
A.starRow = (cx, cy, size, filled, o = {}) => {
  const gap = size * 2.35;
  for (let i = 0; i < 5; i++) {
    const x = cx + (i - 2) * gap, k = clamp(filled - i), pop = k > 0 ? 1 + .35 * Math.sin(clamp(k) * PI) : 1;
    ctx.save(); ctx.translate(x, cy); ctx.scale(pop, pop);
    A.starPath(0, 0, size); ctx.fillStyle = k > .5 ? V2.grad(0, -size, 0, size, [[0, '#ffe36a'], [1, '#ffb400']]) : (o.empty ?? 'rgba(255,255,255,.18)'); ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size * .12); ctx.strokeStyle = k > .5 ? '#b57f00' : 'rgba(255,255,255,.35)'; ctx.stroke();
    ctx.restore();
  }
};
// the app icon: a violet to pink tile with a lightning bolt through a clock tick
A.appIcon = (x, y, s, o = {}) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100);
  ctx.fillStyle = V2.grad(-50, -50, 50, 50, [[0, '#6c4bff'], [1, '#ff4fa3']]); rr(-50, -50, 100, 100, 24); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(8, -38); ctx.lineTo(-22, 6); ctx.lineTo(-2, 6); ctx.lineTo(-10, 38); ctx.lineTo(24, -10); ctx.lineTo(4, -10); ctx.closePath(); ctx.fill();
  ctx.restore();
};
// a phone: a dark body, a notch and a screen whose contents fn(w, h) draws in its own 0,0 to w,h space (clipped to the glass)
A.phoneFrame = (cx, cy, w, h, fn, o = {}) => {
  ctx.save(); ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); if (o.scale) ctx.scale(o.scale, o.scale);
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 20; ctx.fillStyle = '#15121c'; rr(-w / 2 - 18, -h / 2 - 18, w + 36, h + 36, 70); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#3a3646'; ctx.lineWidth = 4; rr(-w / 2 - 18, -h / 2 - 18, w + 36, h + 36, 70); ctx.stroke();
  ctx.save(); rr(-w / 2, -h / 2, w, h, 54); ctx.clip(); ctx.translate(-w / 2, -h / 2); fn(w, h); ctx.restore();
  ctx.fillStyle = '#15121c'; rr(-w * .16, -h / 2 + 12, w * .32, 32, 16); ctx.fill();
  ctx.restore();
};
})();
