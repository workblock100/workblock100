'use strict';
/* SHIFT HAPPENS, Episode 20: The Snow Day.
 *
 * A full-length episode on the Episode 15 kits (the sheet: ep15_sheet.js, window.SH15; the cast: ep15_art.js, window.A15; physics: phys2d.js, window.PHYS2D; turnarounds: `yaw` in v2_char.js), the Episode 18
 * effects kit (ep18_fx.js, window.FX18), the Episode 19 food kit (ep19_food.js, window.F19) and the Episode 20 weather and light kits (ep20_fx.js: window.SN20 snow and cold, window.L20 light; ep20_art.js: window.A20
 * winter gear, Turnip, Eggplant). Registration only: each scene lives in its own module and registers itself on window.__EP20_SCENES.<scene id> (title, end: ep20_title.js; forecast, dayroom: ep20_forecast.js;
 * lot: ep20_lot.js; blackout: ep20_blackout.js; night: ep20_night.js). Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders.
 * Built on the v2 renderer. textGate: the text gate (txaudit.js) is part of every audit of this episode. */
(() => {
if (!window.TIMELINE_EP20) return;
const { zoomTo } = window.H6;
const ids = 'title forecast lot blackout dayroom night end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#16233a'; ctx.fillRect(0, 0, W, H); text('EP20  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#e8f4ff', lw: 12, stroke: '#0b1530', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP20_SCENES || {})[id] || placeholder(id);
window.__EP20_ALL = ALL;
EPISODES[20] = { num: 20, v2: true, textGate: true, balanceCaps: true, blurMax: 16, title: 'Episode 20: The Snow Day', TL: window.TIMELINE_EP20, SCENES: ALL, layout: 'v2', audio: 'build/ep20/audio.m4a' };
})();
