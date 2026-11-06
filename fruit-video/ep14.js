'use strict';
/* SHIFT HAPPENS, Episode 14: The Survey.
 *
 * A nature documentary about the State. Registration only: each scene lives in its own module and registers itself on window.__EP14_SCENES.<scene id>
 * (ep14_title.js: title, end; ep14_colony.js: colony; ep14_adapt.js: adapt; ep14_arrive.js: arrive; ep14_tracer.js: tracer; ep14_closet.js: closet; ep14_voices.js: voices;
 * ep14_verdict.js: verdict; ep14_house.js (window.S14, the dollhouse) and ep14_art.js (window.A14, the new cast) are shared kits). Any scene whose module has not been written yet is a plain
 * placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer. textGate: the text gate (txaudit.js) is part of every audit of this episode. */
(() => {
if (!window.TIMELINE_EP14) return;
const { zoomTo } = window.H6;
const ids = 'title colony adapt arrive tracer closet voices verdict end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#2b2740'; ctx.fillRect(0, 0, W, H); text('EP14  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP14_SCENES || {})[id] || placeholder(id);
window.__EP14_ALL = ALL;
EPISODES[14] = { num: 14, v2: true, textGate: true, balanceCaps: true, blurMax: 24, title: 'Episode 14: The Survey', TL: window.TIMELINE_EP14, SCENES: ALL, layout: 'v2', audio: 'build/ep14/audio.m4a' };
})();
