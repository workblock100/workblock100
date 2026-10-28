'use strict';
/* SHIFT HAPPENS, Episode 12: The In-Service.
 *
 * Registration only: each scene lives in its own module (ep12_art.js, ep12_title.js, ep12_room.js, ep12_signin.js, ep12_slides.js, ep12_drill.js, ep12_award.js) and registers itself on window.__EP12_SCENES.<scene id>.
 * Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer. */
(() => {
if (!window.TIMELINE_EP12) return;
const { zoomTo } = window.H6;
const ids = 'title signin slides drill award end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#2b2740'; ctx.fillRect(0, 0, W, H); text('EP12  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22' }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP12_SCENES || {})[id] || placeholder(id);
window.__EP12_ALL = ALL;
EPISODES[12] = { num: 12, v2: true, balanceCaps: true, textGate: true, title: 'Episode 12: The In-Service', TL: window.TIMELINE_EP12, SCENES: ALL, layout: 'v2', audio: 'build/ep12/audio.m4a' };
})();
