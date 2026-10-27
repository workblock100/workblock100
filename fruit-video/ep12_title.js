'use strict';
/* SHIFT HAPPENS, Episode 12: The In-Service. Scene module E12-A: the scenes `title` and `end` (registered on window.__EP12_SCENES).
 *
 * Copied, not shared (the earlier episodes' private code is not exported): the night card (sky, skyline, stage, teaser pill and its projector icon) is from ep11_title.js SC_END;
 * the cast set-up follows the ep10 and ep11 end cards; the title's cut rhythm follows ep10_title.js.
 *
 * title (5.2 s, no clock, no label, no scrim). A projector in the top-left corner of a dark conference room throws a warm beam across the frame onto a screen that fills it.
 *   The four clacks (0.45, 1.10, 1.75, 2.40) are the only cuts, one slide change each; blur is 1 on those frames so no cut is double-exposed.
 *   0.00  fanwhir: the fan spins up (its blade shadow crosses the screen until about 2.9 s)
 *   0.12  textding: the power chime; the lamp catches and warms (0.12 to 0.45) while the screen comes up out of black
 *   0.45  slide 1: DIGNITY FIRST pops in; the first clack makes the bulb hiccup once (0.46 to 0.56)
 *   1.10  slide 2: a red rubber stamp, MANDATORY, slams onto a blank slide (scale 1.7 to 1 in 0.14 s, a camera knock)
 *   1.75  slide 3: the series logo, SHIFT HAPPENS (Bangers, yellow, dark outline), pops in on the navy slide
 *   2.40  slide 4: the EPISODE 12 chip drops in, then THE IN-SERVICE rises under the logo, which stays where it is
 *   3.00  the fan has wound down and the dust has gone; from here nothing moves over the logo. The frame only pushes in (1.00 to 1.07) until 5.2.
 *   Layout (scene coordinates): projector body 70..296 x 60..148, lens at (344, 104); screen 90..990 x 240..1700 (bezel 18 px);
 *   the logo centred on x 540: SHIFT at y 770, HAPPENS at 980, EPISODE 12 chip at 1160, THE IN-SERVICE at 1318. The table edge sits at y 1790.
 *
 * end (8.0 s, no clock, no scrim; the label THANKS FOR WATCHING comes from the script). The night card: sky, stars, the skyline, the Moon at (860, 960), and the cast in a row above y 1500.
 *   Clementine (x 124), Strawberry (x 304) holding the framed certificate CERTIFIED IN SAYING NO by its two top corners, the Administrator in front (552), Lemon (790), Mango (945).
 *   Lockup SHIFT HAPPENS / THE IN-SERVICE (0.1), THANKS FOR WATCHING (0.5), the dedication (1.0), "There is no slide for no." in yellow (2.8),
 *   "You are worth every R." (4.2), and the teaser pill NEXT: EPISODE 13 / The Float Pool at y 1710 (5.4), the ep11 pill with the projector icon.
 */
(() => {
if (!window.TIMELINE_EP12) return;
const { zoomTo, confetti, grad2 } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11;
const { lemon, mango } = A7;
window.__EP12_SCENES = window.__EP12_SCENES || {};
const ring = (lt, t0, tau) => lt < t0 ? 0 : Math.exp(-(lt - t0) / tau);
// the width a string takes in a given font, measured the way text() draws it
function widthOf(str, font, weight, size) { ctx.save(); ctx.font = `${weight} ${size}px ${font}`; const w = ctx.measureText(str).width; ctx.restore(); return w; }
// the largest size (at most `size`) that fits str into maxW, so text() never squeezes it
function fitSize(str, font, weight, size, maxW) { const w = widthOf(str, font, weight, size); return w > maxW ? Math.floor(size * maxW / w) : size; }
// an audited box for text that must stay on the frame; it is only recorded while the audit runs (coordinates are scene coordinates, the camera is applied)
const regBox = (id, x0, y0, x1, y1) => regLocal('otext', x0, y0, x1, y1, { name: id });

// ============================================================ title: the projector and its four slides
const SX0 = 90, SX1 = 990, SY0 = 240, SY1 = 1700, SW = SX1 - SX0, SH = SY1 - SY0, SCX = 540, SCY = (SY0 + SY1) / 2;
const LENS = [344, 104];                 // the projector's lens: the beam starts here
const CUTS = [.45, 1.10, 1.75, 2.40];    // the four clacks: one slide change each
const TBL = 1790;                        // the conference table's front edge, below the screen
const slideAt = lt => lt < CUTS[0] ? 0 : lt < CUTS[1] ? 1 : lt < CUTS[2] ? 2 : lt < CUTS[3] ? 3 : 4;
// the bulb: it warms from the power chime, and hiccups once on the first clack
const lampK = lt => easeIO(seg(lt, .12, .45)) * (lt >= .46 && lt < .5 ? .5 : lt >= .5 && lt < .56 ? .8 : 1);
// the fan: spins up over 1.6 s (quadratic), then holds 15 rad/s
const fanPhase = t => t < 1.6 ? 15 * t * t * t / (3 * 1.6 * 1.6) : 8 + 15 * (t - 1.6);

function room() {
  ctx.fillStyle = grad2(0, 0, 0, H, '#241a3e', '#0b0714'); ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.fillStyle = '#15111f'; rr(SX0 - 18, SY0 - 18, SW + 36, SH + 36, 12); ctx.fill();          // the screen's bezel
  ctx.fillStyle = grad2(0, TBL, 0, H + 300, '#4a2c1a', '#140a05'); ctx.fillRect(-300, TBL, W + 600, H + 300);   // the table, in front of the wall
  ctx.fillStyle = 'rgba(255,200,140,.28)'; ctx.fillRect(-300, TBL, W + 600, 4);
}
function projector(lt) {
  const L = lampK(lt);
  ctx.save();
  ctx.fillStyle = '#34344a'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(280, 84, 66, 40, 10); ctx.fill(); ctx.stroke();   // the lens barrel
  ctx.fillStyle = V2.radial(LENS[0] - 4, LENS[1], 2, 20, [[0, `rgba(255,255,240,${.6 + .4 * L})`], [1, 'rgba(255,200,130,.5)']]);
  ell(LENS[0] - 2, LENS[1], 12, 17); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = V2.grad(0, 60, 0, 148, [[0, '#4d4d64'], [1, '#222230']]); ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(70, 60, 226, 88, 22); ctx.fill(); ctx.stroke();   // the body
  ctx.fillStyle = '#121119'; ell(118, 104, 34, 34); ctx.fill(); ctx.strokeStyle = '#43435a'; ctx.lineWidth = 4; ctx.stroke();   // the fan grille
  ctx.save(); ctx.translate(118, 104); ctx.rotate(fanPhase(lt)); ctx.fillStyle = '#5b5b76';
  for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(15, 0, 16, 6, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  ell(250, 74, 6, 6); ctx.fillStyle = L > .9 ? '#38d86a' : '#2b3a30'; ctx.fill();   // the status light: green once the lamp is up
  ctx.restore();
}
function cream() {
  ctx.fillStyle = '#fbf4e2'; ctx.fillRect(SX0, SY0, SW, SH);
  ctx.strokeStyle = 'rgba(34,40,90,.5)'; ctx.lineWidth = 6; rr(SX0 + 44, SY0 + 44, SW - 88, SH - 88, 18); ctx.stroke();
  text('FRUIT BOWL REHAB & NURSING', SCX, SY0 + 150, { size: 30, fill: '#6a6488', weight: 900, spacing: 6 });
}
function navy() {
  ctx.fillStyle = V2.radial(SCX, SCY - 80, 40, 1000, [[0, '#4453bb'], [.55, '#1f2672'], [1, '#0b0f34']]); ctx.fillRect(SX0, SY0, SW, SH);
  ctx.strokeStyle = 'rgba(255,214,150,.6)'; ctx.lineWidth = 5; rr(SX0 + 44, SY0 + 44, SW - 88, SH - 88, 18); ctx.stroke();
  text('FRUIT BOWL REHAB & NURSING', SCX, SY0 + 150, { size: 30, fill: '#ffd1e6', weight: 900, spacing: 6 });
}
// slide 1: the heading, with a red rule under it
function dignity(lt) {
  const k = easeOut(seg(lt, CUTS[0], CUTS[0] + .16)), s = lerp(1.12, 1, k), sz = fitSize('DIGNITY', 'Nunito', 900, 176, 760);
  ctx.save(); ctx.globalAlpha *= clamp(k * 3); ctx.translate(SCX, 880); ctx.scale(s, s);
  text('DIGNITY', 0, -96, { size: sz, fill: '#22285a', weight: 900, lw: 0 });
  text('FIRST', 0, 96, { size: sz, fill: '#22285a', weight: 900, lw: 0 });
  ctx.fillStyle = '#d62a3a'; rr(-190, 170, 380, 14, 7); ctx.fill();
  ctx.restore();
}
// slide 2: the rubber stamp slams on, a little crooked, with specks where the ink did not take
function stamp(lt) {
  const k = easeOut(seg(lt, CUTS[1], CUTS[1] + .14)), s = lerp(1.7, 1, k), rot = lerp(-.26, -.1, k), sz = fitSize('MANDATORY', 'Bangers', 400, 170, 560);
  ctx.save(); ctx.translate(SCX, 940); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= clamp((lt - CUTS[1]) * 30);
  ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = 16; rr(-340, -120, 680, 240, 26); ctx.stroke();
  ctx.lineWidth = 5; rr(-318, -98, 636, 196, 16); ctx.stroke();
  text('MANDATORY', 2, 6, { size: sz, font: 'Bangers', weight: 400, fill: 'rgba(214,42,58,.45)', lw: 0 });   // the ink bleeds a little
  text('MANDATORY', 0, 0, { size: sz, font: 'Bangers', weight: 400, fill: '#d62a3a', lw: 0 });
  for (let i = 0; i < 70; i++) {
    if (hash(i * 5.3 + 2) < .6) continue;
    ctx.fillStyle = 'rgba(251,244,226,.9)'; const r = 1.5 + hash(i * 2.9) * 3; ell(-330 + hash(i * 3.7) * 660, -110 + hash(i * 7.1) * 220, r, r); ctx.fill();
  }
  ctx.restore();
}
// slide 3: the series logo, and slide 4 keeps it and adds the episode
function logo(lt) {
  const k = seg(lt, CUTS[2], CUTS[2] + .3), s = lerp(1.35, 1, easeBack(k)), sz = fitSize('HAPPENS', 'Bangers', 400, 240, 700);
  ctx.save(); ctx.globalAlpha *= clamp(k * 3); ctx.translate(SCX, 875); ctx.scale(s, s);
  text('SHIFT', 0, -105, { size: sz, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 22, stroke: '#150f22', spacing: 6, shadow: 24 });
  text('HAPPENS', 0, 105, { size: sz, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 22, stroke: '#150f22', spacing: 6, shadow: 24 });
  ctx.restore();
  regBox('logo', 140, 680, 940, 1090);
}
function episode(lt) {
  const c = easeBack(seg(lt, CUTS[3] + .02, CUTS[3] + .34));
  if (c > 0) {
    ctx.save(); ctx.translate(SCX, 1160); ctx.scale(c, c);
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; ctx.fillStyle = '#7b61ff'; rr(-230, -50, 460, 100, 50); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = INK; ctx.lineWidth = 7; rr(-230, -50, 460, 100, 50); ctx.stroke();
    text('EPISODE 12', 0, 4, { size: 76, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 0, spacing: 5 });
    ctx.restore();
  }
  const k = easeOut(seg(lt, CUTS[3] + .16, CUTS[3] + .5)), sz = fitSize('THE IN-SERVICE', 'Bangers', 400, 150, 700);
  ctx.save(); ctx.globalAlpha *= clamp(k * 2.5);
  text('THE IN-SERVICE', SCX, 1318 + 24 * (1 - k), { size: sz, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 20, stroke: '#150f22', spacing: 4, shadow: 22 });
  ctx.restore();
  regBox('chip', 310, 1110, 770, 1210); regBox('subtitle', 120, 1240, 960, 1420);
}
// the fan's blade shadow on the screen (multiply), turning while the fan spins up and winding down by 2.9 s
function fanShadow(lt) {
  const a = seg(lt, .2, .7) * (1 - seg(lt, 2.2, 2.9)) * .3;
  if (a <= 0) return;
  const cx = 230, cy = 300, ph = fanPhase(lt);   // in the beam just in front of the lens, clear of the kicker line
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(40,30,60,${a})`;
  for (let i = 0; i < 4; i++) { const an = ph + i * PI / 2; ctx.beginPath(); ctx.ellipse(cx + Math.cos(an) * 40, cy + Math.sin(an) * 40, 46, 14, an, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(cx, cy, 12, 0, TAU); ctx.fill();
  ctx.restore();
}
// the warm beam from the lens and the dust in it (the dust is gone by 3.0 s so nothing moves over the logo)
function beamAndDust(lt) {
  const L = lampK(lt);
  if (L > 0) {
    V2.beam(LENS[0], LENS[1], 1060, 1830, 24, 1250, '255,222,160', .2 * L, 'screen');
    V2.glow(LENS[0], LENS[1], 230, '255,226,170', .5 * L, 'screen', .5);
  }
  const dA = seg(lt, .2, .6) * (1 - seg(lt, 2.7, 3.0));
  if (dA > 0) V2.dust(60, 140, 900, 1300, lt, { n: 40, alpha: .55 * dA, size: 3.2, speed: 8, color: '255,240,210' });
}

const TITLE = {
  noChyron: true, noScrim: true,   // no spoken lines: nothing here is captioned
  cam(lt) {
    zoomTo(540, 960, 1 + .07 * easeIO(seg(lt, 0, 5.2)));
    CAM.shake = 3 * ring(lt, CUTS[0], .05) + 11 * ring(lt, CUTS[1], .07) + 4 * ring(lt, CUTS[2], .05) + 3 * ring(lt, CUTS[3], .05);   // the clacks knock the projector
  },
  draw(lt) {
    room();
    ctx.save(); ctx.beginPath(); ctx.rect(SX0, SY0, SW, SH); ctx.clip();
    const S = slideAt(lt);
    if (S <= 2) cream(); else navy();
    if (S === 1) dignity(lt);
    if (S === 2) stamp(lt);
    if (S >= 3) logo(lt);
    if (S >= 4) episode(lt);
    fanShadow(lt);
    const dim = 1 - lampK(lt);   // the screen is dark until the bulb is up, and dips on the hiccup
    if (dim > 0) { ctx.fillStyle = `rgba(10,8,22,${clamp(dim)})`; ctx.fillRect(SX0, SY0, SW, SH); }
    ctx.restore();
    beamAndDust(lt);
    projector(lt);
  },
  fx: lt => ({ bloom: .55, vignette: .34, grain: .05, contrast: .12, sat: .05, tint: [['#ffd9a0', .12, 'soft-light']], fade: lt < .26 ? 1 - lt / .26 : 0, fadeColor: '0,0,0' }),
  blur: lt => (CUTS.some(c => Math.abs(lt - c) < 1 / 30) || lt > 3) ? 1 : 3,
  over() {},
};
window.__EP12_SCENES.title = TITLE;

// ============================================================ end: the night card, the certificate and the teaser
const FEET = 1478;   // the feet line of the back row (the Administrator stands 18 px in front of it)
// the framed certificate (240 x 140 units), hung from its two top corners: the right hand's grip is the frame's top-right corner and the left hand's grip the top-left
EXT.prop.cert12 = (side, o, t) => {
  const w = 200, h = 130;
  ctx.save(); ctx.translate(-w / 2, 0);
  ctx.fillStyle = 'rgba(20,10,30,.32)'; rr(-w / 2 + 7, 9, w, h, 8); ctx.fill();   // its shadow on the chest
  ctx.fillStyle = V2.grad(-w / 2, 0, w / 2, h, [[0, '#ffe58a'], [.5, '#d9a441'], [1, '#9a6218']]); ctx.strokeStyle = INK; ctx.lineWidth = 5;
  rr(-w / 2, 0, w, h, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffaf0'; rr(-w / 2 + 13, 13, w - 26, h - 26, 4); ctx.fill();
  text('CERTIFIED', 0, 31, { size: 19, fill: '#6a6488', weight: 900, spacing: 5, lw: 0 });
  text('IN SAYING', 0, 62, { size: 40, font: 'Bangers', weight: 400, fill: '#22285a', lw: 0, spacing: 2 });
  text('NO', 0, 99, { size: 44, font: 'Bangers', weight: 400, fill: '#d62a3a', lw: 0 });
  ctx.restore();
};
Object.assign(PROP_BOX, { cert12: [-200, 0, 0, 130] });

// the night skyline (copied from ep11_title.js SC_END)
function nightSkyline() {
  ctx.fillStyle = '#1a1540'; for (let i = 0; i < 16; i++) { const bw = 70 + hash(i + 31) * 70, bh = 110 + hash(i + 40) * 250; rr(i * 70 - 20, FEET - bh, bw, bh + 4, 6); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,214,120,.8)'; for (let i = 0; i < 16; i++) for (let j = 0; j < 5; j++) if (hash(i * 7 + j + 31) > .55) { const bh = 110 + hash(i + 40) * 250; if (j * 40 + 24 < bh - 10) ctx.fillRect(i * 70 - 20 + 14 + (j % 2) * 24, FEET - bh + 18 + j * 40, 12, 18); }
}
// the teaser's icon: a little projector throwing a slide onto a screen (copied from ep11_title.js, where it is not exported). (0, 0) is the middle of the icon, about 190 wide
function slideIcon(lt) {
  ctx.save();
  const fl = .32 + .05 * Math.sin(lt * 13) + .03 * Math.sin(lt * 31);
  ctx.fillStyle = `rgba(255,240,180,${fl})`; ctx.beginPath(); ctx.moveTo(-34, -8); ctx.lineTo(10, -46); ctx.lineTo(10, 46); ctx.lineTo(-34, 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = V2.grad(0, -28, 0, 28, [[0, '#cfd6e6'], [1, '#7b86a2']]); ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; rr(-96, -26, 66, 52, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a2530'; ell(-28, 0, 13, 17); ctx.fill(); ctx.fillStyle = '#fff6c8'; ell(-28, 0, 7, 10); ctx.fill();
  ctx.fillStyle = '#e8193a'; ell(-80, -14, 4.5, 4.5); ctx.fill();
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-76, 26); ctx.lineTo(-84, 40); ctx.moveTo(-50, 26); ctx.lineTo(-42, 40); ctx.stroke();
  ctx.save(); ctx.translate(12, -44); ctx.rotate(.02 * Math.sin(lt * 2.4));
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; rr(0, 0, 84, 88, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7b61ff'; rr(0, 0, 84, 22, [7, 7, 0, 0]); ctx.fill(); ctx.strokeStyle = '#2a2530'; rr(0, 0, 84, 22, [7, 7, 0, 0]); ctx.stroke();
  ctx.fillStyle = '#fff'; rr(10, 8, 40, 6, 3); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i === 2 ? '#e8193a' : '#7b61ff'; ell(13, 36 + i * 17, 3.4, 3.4); ctx.fill(); ctx.fillStyle = '#b5b0cc'; rr(22, 33 + i * 17, 46 - i * 8, 6, 3); ctx.fill(); }
  ctx.strokeStyle = '#1f9a52'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(60, 70); ctx.lineTo(67, 77); ctx.lineTo(79, 62); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

const END = {
  noChyron: true, noScrim: true,
  cam(lt) { zoomTo(540, 960, 1 + .02 * easeIO(seg(lt, 0, 8))); },
  draw(lt) {
    // the night card: a deep sky, stars, the skyline, the Moon, the confetti
    ctx.fillStyle = grad2(0, 0, 0, H, '#0e1038', '#3a2a6a'); ctx.fillRect(-100, -100, W + 200, H + 200);
    A7.stars(lt, 980, { n: 100, a: .9 });
    nightSkyline();
    confetti(lt, .5);
    A7.moon(860, 960, .8, { t: lt, char: { expr: 'happy', look: [-.3, .5] } });
    // the stage: a dark floor with a warm pool under the cast
    ctx.fillStyle = V2.grad(0, FEET - 20, 0, H, [[0, 'rgba(26,18,70,0)'], [.08, 'rgba(30,22,84,.9)'], [1, 'rgba(8,6,24,1)']]); ctx.fillRect(0, FEET - 20, W, H - FEET + 20);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, FEET + 6, 10, 560, [[0, 'rgba(255,200,140,.28)'], [1, 'rgba(255,200,140,0)']]); ctx.beginPath(); ctx.ellipse(540, FEET + 6, 560, 70, 0, 0, TAU); ctx.fill(); ctx.restore();
    V2.setLight({ key: [-.4, -.8], keyColor: '#fff0d8', keyA: .26, rim: '#ffd9a0', rimA: .6, shadow: '#1a1236', shadowA: .45, amb: '#b0a0e0', ambA: .1 });
    V2.opts.reflect = true;
    // the cast: each one pops in on its own beat and then hops a little, out of step
    const member = (i, ctor, o) => {
      const pop = easeBack(seg(lt, .6 + i * .12, .95 + i * .12));
      if (pop <= 0) return;
      const hop = Math.abs(Math.sin(lt * 4.2 + i)) * (o.hop ?? 10);
      drawChar(ctor(Object.assign({ x: o.x, y: o.y - hop, s: o.s * pop, t: lt + i }, o.opt)));
    };
    member(0, A10.clem, { x: 124, y: FEET, s: .82, opt: { expr: 'hopeful', look: [.6, .1], arms: { l: 'hips', r: 'wave' } } });
    member(1, A11.straw, { x: 304, y: FEET, s: .9, hop: 4, opt: { expr: 'smug', lid: .3, arms: { l: 'hold', r: 'hold' }, grip: { l: [-92, 80], r: [108, 80] }, hold: { r: 'cert12' } } });
    member(2, lemon, { x: 790, y: FEET, s: .82, opt: { expr: 'neutral', look: [-.5, .1], arms: { l: 'hips', r: 'rest' } } });
    member(3, mango, { x: 945, y: FEET, s: .82, opt: { expr: 'happy', arms: { l: 'cheer', r: 'cheer' } } });
    member(4, A9.melon, { x: 552, y: FEET + 18, s: 1, opt: { expr: 'happy', arms: { l: 'hips', r: 'cheer' } } });
  },
  fx: lt => ({ bloom: .7, vignette: .45, grain: .05, contrast: .1, sat: .06, tint: [['#ffb890', .1, 'soft-light']], fade: lt < .25 ? 1 - lt / .25 : 0 }),
  blur: lt => 1,
  over(lt) {
    // the lockup drops in, then the lines type in one by one
    text('THANKS FOR WATCHING', 540, 150, { size: 34, fill: '#ffd1e6', weight: 900, spacing: 10, lw: 8, alpha: seg(lt, .5, .85), maxW: 940 });
    const k = easeBack(seg(lt, .1, .55));
    if (k > .06) {
      ctx.save(); ctx.translate(540, 0); ctx.scale(k, k);
      text('SHIFT HAPPENS', 0, 262, { size: 92, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 18, stroke: '#150f22', spacing: 4, shadow: 20 });
      text('THE IN-SERVICE', 0, 384, { size: 116, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 18, stroke: '#150f22', spacing: 4, shadow: 24 });
      ctx.restore();
    }
    const pop = (at, y) => { const q = easeOut(seg(lt, at, at + .3)); return { alpha: q, y: y + 14 * (1 - q) }; };
    [['For every nurse who was told', 520], ['it was voluntary.', 576]].forEach(([line, y], i) => {
      const q = pop(1.0 + i * .15, y); text(line, 540, q.y, { size: 44, fill: '#ffffff', weight: 900, lw: 9, alpha: q.alpha, maxW: 960 });
    });
    { const q = pop(2.8, 690); text('There is no slide for no.', 540, q.y, { size: 58, fill: '#ffe135', weight: 900, lw: 10, alpha: q.alpha, maxW: 980 }); }
    { const q = pop(4.2, 790); text('You are worth every R.', 540, q.y, { size: 58, fill: '#ffd1e6', weight: 900, lw: 10, alpha: q.alpha, maxW: 980 }); }
    // the teaser: the ep11 pill, a projector throwing the next episode's slide
    const tk = easeBack(seg(lt, 5.4, 5.8));
    if (tk > 0) {
      ctx.save(); ctx.translate(540, 1710); ctx.scale(tk, tk);
      regLocal('overlay', -440, -80, 440, 80, { id: 'teaser' });
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(14,10,36,.92)'; rr(-440, -80, 880, 160, 80); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,214,150,.9)'; ctx.lineWidth = 4; rr(-440, -80, 880, 160, 80); ctx.stroke();
      ctx.font = '900 30px Nunito'; ctx.letterSpacing = '5px'; const w1 = ctx.measureText('NEXT: EPISODE 13').width; ctx.letterSpacing = '0px';
      ctx.font = '400 62px Bangers'; ctx.letterSpacing = '2px'; const w2 = ctx.measureText('The Float Pool').width; ctx.letterSpacing = '0px';
      const IW = 196, GAP = 36, tw = Math.max(w1, w2), x0 = -(IW + GAP + tw) / 2, icx = x0 + IW / 2, tx0 = x0 + IW + GAP;
      ctx.save(); ctx.translate(icx, 0); slideIcon(lt); ctx.restore();
      text('NEXT: EPISODE 13', tx0, -34, { size: 30, fill: '#ffd1e6', weight: 900, align: 'left', spacing: 5 });
      text('The Float Pool', tx0, 22, { size: 62, font: 'Bangers', weight: 400, fill: '#ffffff', align: 'left', lw: 10, stroke: '#150f22', spacing: 2 });
      ctx.restore();
    }
  },
  label: () => 'THANKS FOR WATCHING',
};
window.__EP12_SCENES.end = END;
})();
