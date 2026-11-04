'use strict';
/* SHIFT HAPPENS, Episode 18: The Fire Drill.
 *
 * A full-length episode on the Episode 15 kits (the sheet: ep15_sheet.js, window.SH15; the tower: ep15_house.js, window.S15; the cast: ep15_art.js, window.A15; physics: phys2d.js,
 * window.PHYS2D; turnarounds: `yaw` in v2_char.js) plus the Episode 18 kits (ep18_fx.js, window.FX18: flames, smoke, foam, water, sparks, strobes and lighting washes;
 * ep18_props.js, window.P18: the fire door, the alarm panel and the other props). Registration only: each scene lives in its own module and registers itself on
 * window.__EP18_SCENES.<scene id> (title, end: ep18_title.js; notice, clear: ep18_station.js; marshal: ep18_marshal.js; alarm: ep18_alarm.js; evac: ep18_evac.js).
 * Any scene whose module has not been written yet is a plain placeholder card, so the episode always loads, audits and renders. Built on the v2 renderer.
 * textGate: the text gate (txaudit.js) is part of every audit of this episode. */
(() => {
if (!window.TIMELINE_EP18) return;
const { zoomTo } = window.H6;
const ids = 'title notice marshal alarm evac clear end'.split(' ');
const placeholder = id => ({
  shot: () => 'card',
  cam() { zoomTo(540, 960, 1); },
  draw() { ctx.fillStyle = '#2b0f12'; ctx.fillRect(0, 0, W, H); text('EP18  ' + id.toUpperCase(), W / 2, H / 2, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#150f22', hero: false }); },
  fx: () => ({ bloom: 0 }),
  blur: () => 1,
  over() {},
});
const ALL = {};
for (const id of ids) ALL[id] = (window.__EP18_SCENES || {})[id] || placeholder(id);
window.__EP18_ALL = ALL;
EPISODES[18] = { num: 18, v2: true, textGate: true, balanceCaps: true, blurMax: 16, title: 'Episode 18: The Fire Drill', TL: window.TIMELINE_EP18, SCENES: ALL, layout: 'v2', audio: 'build/ep18/audio.m4a' };
})();
