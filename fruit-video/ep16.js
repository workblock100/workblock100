'use strict';
/* SHIFT HAPPENS, Episode 16: The Vote.
 *
 * A short episode built from the Episode 15 kits (the sheet: ep15_sheet.js, window.SH15; the tower: ep15_house.js, window.S15; the cast: ep15_art.js, window.A15; physics: phys2d.js,
 * window.PHYS2D; turnarounds: `yaw` in v2_char.js). Registration only: each scene lives in its own module and registers itself on window.__EP16_SCENES.<scene id>
 * (ep16_title.js: title, end; ep16_ballot.js: ballot; ep16_count.js: count; ep16_prize.js: prize). Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer.
 * textGate: the text gate (txaudit.js) is part of every audit of this episode. */
(() => {
if (!window.TIMELINE_EP16) return;
const { zoomTo } = window.H6;
const ids = 'title ballot count prize end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#0f2b22'; ctx.fillRect(0, 0, W, H); text('EP16  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP16_SCENES || {})[id] || placeholder(id);
window.__EP16_ALL = ALL;
EPISODES[16] = { num: 16, v2: true, textGate: true, balanceCaps: true, blurMax: 16, title: 'Episode 16: The Vote', TL: window.TIMELINE_EP16, SCENES: ALL, layout: 'v2', audio: 'build/ep16/audio.m4a' };
})();
