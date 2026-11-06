'use strict';
/* SHIFT HAPPENS, Episode 10: Two Weeks' Notice.
 *
 * Registration only: each scene lives in its own module (ep10_art.js, ep10_title.js, ep10_office.js, ep10_days.js, ep10_party.js, ep10_door.js) and registers itself on window.__EP10_SCENES.<scene id>.
 * Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer. */
(() => {
if (!window.TIMELINE_EP10) return;
const { zoomTo } = window.H6;
const ids = 'title office days exit party door lot end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#2b2740'; ctx.fillRect(0, 0, W, H); text('EP10  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22' }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP10_SCENES || {})[id] || placeholder(id);
window.__EP10_ALL = ALL;
EPISODES[10] = { num: 10, v2: true, balanceCaps: true, title: "Episode 10: Two Weeks' Notice", TL: window.TIMELINE_EP10, SCENES: ALL, layout: 'v2', audio: 'build/ep10/audio.m4a' };
})();
