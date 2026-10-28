'use strict';
/* TEST SCAFFOLD (replaced by the real scene) */
(() => {
if (!window.TIMELINE_EP13) return;
const { zoomTo, person } = window.H6;
const A7 = window.A7, A11 = window.A11, S13 = window.S13;
const SC = {
  shot: () => 'wide',
  cam(lt) { S13.cam('station', { cz: -300 + 300 * seg(lt, 0, 5) }); zoomTo(540, 960, 1); },
  draw(lt) {
    S13.light('evening');
    V2.opts.reflect = true;
    S13.station(lt, { t: lt, sky: .1 + .3 * seg(lt, 0, 20), ping: lt > .25 ? lt - .25 : -1 });
    S13.medCart(-150, 1260, { t: lt });
    S13.chair(60, 1230);
    drawChar(person(A11.straw, () => [-250, 1130], lt, { look: [.6, 0], expr: 'dead', lid: .4, arms: { l: 'rest', r: 'rest' } }));
    drawChar(A7.lemon(Object.assign(V2.at(340, 1600), { y: V2.p2(340, 150, 1600)[1], noLegs: true, noShadow: true, look: [-.3, .1], expr: 'neutral', arms: { l: 'rest', r: 'rest' } })));
    S13.counter({ t: lt, phoneRing: lt > .25 && lt < 1.5 ? 1 : 0 });
    V2.dust(60, 600, 1020, 1400, lt, { n: 30, alpha: .35 });
  },
  fx: lt => ({ bloom: .5, vignette: .42, grain: .045, contrast: .15, sat: .12, tint: [['#ffd9a0', .1, 'soft-light']] }),
  blur: () => 1,
  over() {},
};
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.open = SC;
})();
