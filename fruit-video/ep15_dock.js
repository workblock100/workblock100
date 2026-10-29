'use strict';
/* SHIFT HAPPENS, Episode 15, scene `dock` (32.4 s, 3:20 PM, THE MERGE). Builder E15-K. FIRST VERSION: the kit's test harness (window.__K15 overrides the state and the camera); the real scene replaces it. */
(() => {
if (!window.TIMELINE_EP15 || !window.S15 || !window.H6) return;
const { zoomTo } = window.H6;
const SC = {
  shot() { return 'wide'; },
  cam(lt) { const K = window.__K15; if (K && K.on) { const c = S15.cam(K.view || 'wide', K.st || {}, K.o || {}); zoomTo(c.x, c.y, c.z); return; } const c = S15.cam('wide', { stack: 1 }); zoomTo(c.x, c.y, c.z); },
  draw(lt) { const K = window.__K15, st = K && K.on ? K.st || {} : { stack: 1 }; S15.light(st); S15.tower(lt, st); S15.front(lt, st); },
  fx() { return { bloom: .5, vignette: .4, grain: .045, contrast: .13, sat: .12 }; },
  blur() { return 1; },
  over() {},
};
window.__EP15_SCENES = window.__EP15_SCENES || {};
window.__EP15_SCENES.dock = SC;
})();
