'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back.
 *
 * Registration only: each scene lives in its own module (ep11_art.js, ep11_title.js, ep11_arrival.js, ep11_orient.js, ep11_floor.js, ep11_vault.js, ep11_exit.js) and registers itself on window.__EP11_SCENES.<scene id>.
 * Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer. */
(() => {
if (!window.TIMELINE_EP11) return;
const { zoomTo } = window.H6;
const ids = 'title arrival orient floor vault exit lot end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#2b2740'; ctx.fillRect(0, 0, W, H); text('EP11  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22' }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP11_SCENES || {})[id] || placeholder(id);
window.__EP11_ALL = ALL;
EPISODES[11] = { num: 11, v2: true, balanceCaps: true, title: 'Episode 11: Welcome Back', TL: window.TIMELINE_EP11, SCENES: ALL, layout: 'v2', audio: 'build/ep11/audio.m4a' };
})();
