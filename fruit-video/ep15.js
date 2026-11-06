'use strict';
/* SHIFT HAPPENS, Episode 15: The Merger.
 *
 * The day Fruit Bowl is acquired, carried out as operations in a spreadsheet (the sheet: ep15_sheet.js, window.SH15; the tower: ep15_house.js, window.S15; the new cast: ep15_art.js, window.A15;
 * physics: phys2d.js, window.PHYS2D, DOM-free simulations in ep15_<scene>_sim.js; turnarounds: `yaw` in v2_char.js). Registration only: each scene lives in its own module and registers itself on
 * window.__EP15_SCENES.<scene id> (ep15_title.js: title, end; ep15_announce.js: announce; ep15_dock.js: dock; ep15_model1.js, ep15_model2.js: model1, model2; ep15_replace.js: replace;
 * ep15_close.js: close). Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer.
 * textGate: the text gate (txaudit.js) is part of every audit of this episode. blurMax: the shutter-sample cap is 24 (see v2_core.js) so fast whips are smooth. */
(() => {
if (!window.TIMELINE_EP15) return;
const { zoomTo } = window.H6;
const ids = 'title announce dock model1 model2 replace close end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#0f2b22'; ctx.fillRect(0, 0, W, H); text('EP15  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP15_SCENES || {})[id] || placeholder(id);
window.__EP15_ALL = ALL;
EPISODES[15] = { num: 15, v2: true, textGate: true, balanceCaps: true, blurMax: 24, title: 'Episode 15: The Merger', TL: window.TIMELINE_EP15, SCENES: ALL, layout: 'v2', audio: 'build/ep15/audio.m4a' };
})();
