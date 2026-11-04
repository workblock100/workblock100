'use strict';
/* SHIFT HAPPENS, Episode 19: The Potluck.
 *
 * A full-length episode on the Episode 15 kits (the sheet: ep15_sheet.js, window.SH15; the cast: ep15_art.js, window.A15; physics: phys2d.js, window.PHYS2D; turnarounds: `yaw` in v2_char.js), the Episode 18 effects kit
 * (ep18_fx.js, window.FX18) and the Episode 19 food kit (ep19_food.js, window.F19: the dishes, the steam, the thickened pour). Registration only: each scene lives in its own module and registers itself on
 * window.__EP19_SCENES.<scene id> (title, end: ep19_title.js; signup, thanks: ep19_signup.js; kitchen: ep19_kitchen.js; plate: ep19_plate.js; breakroom: ep19_break.js).
 * Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer.
 * textGate: the text gate (txaudit.js) is part of every audit of this episode. */
(() => {
if (!window.TIMELINE_EP19) return;
const { zoomTo } = window.H6;
const ids = 'title signup kitchen plate breakroom thanks end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#2a1d0f'; ctx.fillRect(0, 0, W, H); text('EP19  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP19_SCENES || {})[id] || placeholder(id);
window.__EP19_ALL = ALL;
EPISODES[19] = { num: 19, v2: true, textGate: true, balanceCaps: true, blurMax: 16, title: 'Episode 19: The Potluck', TL: window.TIMELINE_EP19, SCENES: ALL, layout: 'v2', audio: 'build/ep19/audio.m4a' };
})();
