'use strict';
/* TEST SCAFFOLD (replaced by the real scene) */
(() => {
if (!window.TIMELINE_EP13) return;
const { zoomTo, person } = window.H6;
const A7 = window.A7, A11 = window.A11, S13 = window.S13;
const SC = {
  shot: () => 'door',
  cam(lt) { if (lt > 12) { S13.cam('hall', { cz: 0 }); } else S13.cam('foyer', { cz: 200 }); zoomTo(540, 960, 1); },
  draw(lt) {
    if (lt > 12) { S13.light('hall'); V2.opts.reflect = true; S13.hall({ t: lt, lit: (i) => i === 5 ? ['255,59,78', 1] : null });
      drawChar(person(A7.banana, () => [-230, 1100], lt, { look: [.4, 0], expr: 'happy', arms: { l: 'rest', r: 'rest' } })); return; }
    S13.light('foyer');
    V2.opts.reflect = true;
    const f = S13.foyer({ t: lt });
    const u = lt;
    const rel = a => seg(u, a, a + .3);
    S13.breakDoor(f.x, f.y, f.k, { t: lt, locks: { reader: seg(u, 4, 5), tape: rel(8), wet: seg(u, 9, 9.6), bolt1: rel(6), bolt2: rel(7), padlock: rel(10), chain: seg(u, 10.2, 10.8) }, ajar: seg(u, 12, 13) * .15, dust: seg(u, 12, 13), rd: { state: u < 3 ? 'idle' : u < 4 ? 'read' : 'ok', k: seg(u, 4, 6) } });
    drawChar(person(A11.straw, () => [-330, 1200], lt, { look: [.8, 0], expr: 'dead', lid: .4, arms: { l: 'rest', r: 'rest' } }));
  },
  fx: lt => ({ bloom: .5, vignette: .45, grain: .045, contrast: .15, sat: .12, tint: [['#9fb8ff', .1, 'soft-light']] }),
  blur: () => 1,
  over() {},
};
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.cross = SC;
})();
