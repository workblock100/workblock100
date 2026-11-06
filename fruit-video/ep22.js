'use strict';
/* SHIFT HAPPENS, Episode 22: The Secret Santa.
 *
 * A full-length episode on the Episode 15 kits (SH15 sheet, A15 cast, PHYS2D physics, `yaw` turnarounds), the Episode 18 effects kit (FX18), the Episode 19 food kit (F19), the Episode 20 kits (SN20, L20, A20,
 * P20), the Episode 21 kits (A21, H21), the soft-body library soft2d.js (window.SOFT2D: cloth that drapes, wraps and tears, tape, ribbons, belts, slings, inflated gloves) and the Episode 22 art kit
 * (ep22_art.js: window.A22, Santa, the holiday props, the tree and its lights). Registration only: each scene registers itself on window.__EP22_SCENES.<scene id> (title, end: ep22_title.js; draw, swap:
 * ep22_station.js; wrap: ep22_wrap.js; santa: ep22_santa.js; carol: ep22_carol.js). Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and
 * renders. Built on the v2 renderer. textGate: the text gate (txaudit.js) is part of every audit of this episode. */
(() => {
if (!window.TIMELINE_EP22) return;
const { zoomTo } = window.H6;
const ids = 'title draw wrap santa swap carol end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#16233a'; ctx.fillRect(0, 0, W, H); text('EP22  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#e8f4ff', lw: 12, stroke: '#0b1530', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP22_SCENES || {})[id] || placeholder(id);
window.__EP22_ALL = ALL;
EPISODES[22] = { num: 22, v2: true, textGate: true, balanceCaps: true, blurMax: 16, title: 'Episode 22: The Secret Santa', TL: window.TIMELINE_EP22, SCENES: ALL, layout: 'v2', audio: 'build/ep22/audio.m4a' };
})();
