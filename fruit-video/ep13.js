'use strict';
/* SHIFT HAPPENS, Episode 13: The Float Pool.
 *
 * A heist film: the float pool plans to steal thirty minutes of break. Registration only: each scene lives in its own module and registers itself on window.__EP13_SCENES.<scene id>
 * (ep13_title.js: title, end; ep13_crew.js: crew; ep13_open.js: open; ep13_plan.js: plan; ep13_hall.js: hall; ep13_cross.js: cross; ep13_vault.js: vault; ep13_station.js and
 * ep13_art.js are shared kits). Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders.
 * Built on the v2 renderer. textGate: the text gate (txaudit.js) is part of every audit of this episode: no mirrored, upside-down, cut-off, overlapping or covered text. */
(() => {
if (!window.TIMELINE_EP13) return;
const { zoomTo } = window.H6;
const ids = 'title open plan crew hall cross vault end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#2b2740'; ctx.fillRect(0, 0, W, H); text('EP13  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP13_SCENES || {})[id] || placeholder(id);
window.__EP13_ALL = ALL;
EPISODES[13] = { num: 13, v2: true, textGate: true, balanceCaps: true, title: 'Episode 13: The Float Pool', TL: window.TIMELINE_EP13, SCENES: ALL, layout: 'v2', audio: 'build/ep13/audio.m4a' };
})();
