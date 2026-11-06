'use strict';
/* SHIFT HAPPENS, Episode 21: The Inspection.
 *
 * A full-length episode on the Episode 15 kits (SH15 sheet, A15 cast, PHYS2D physics, `yaw` turnarounds), the Episode 18 effects kit (FX18), the Episode 19 food kit (F19), the Episode 20 kits (SN20, L20, A20,
 * P20) and the Episode 21 kits (ep21_art.js: window.A21, the State surveyors and the survey props; ep21_hud.js: window.H21, the HUD and split-screen kit). Registration only: each scene registers itself on
 * window.__EP21_SCENES.<scene id> (title, end: ep21_title.js; arrive, exit: ep21_arrive.js; prep: ep21_prep.js; medpass: ep21_medpass.js; closet: ep21_closet.js). Any scene whose module has not been written
 * yet is a plain placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer. textGate: the text gate (txaudit.js) is part of every audit of this episode. */
(() => {
if (!window.TIMELINE_EP21) return;
const { zoomTo } = window.H6;
const ids = 'title arrive prep medpass closet exit end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#16233a'; ctx.fillRect(0, 0, W, H); text('EP21  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#e8f4ff', lw: 12, stroke: '#0b1530', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP21_SCENES || {})[id] || placeholder(id);
window.__EP21_ALL = ALL;
EPISODES[21] = { num: 21, v2: true, textGate: true, balanceCaps: true, blurMax: 16, title: 'Episode 21: The Inspection', TL: window.TIMELINE_EP21, SCENES: ALL, layout: 'v2', audio: 'build/ep21/audio.m4a' };
})();
