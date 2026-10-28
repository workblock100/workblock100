'use strict';
/* Episode 14, scene module ep14_voices.js: DEV GALLERY (temporary, replaced by the real scene). Registers on window.__EP14_SCENES.voices. */
(() => {
if (!window.TIMELINE_EP14) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A6 = window.A6, A10 = window.A10, A11 = window.A11, A14 = window.A14;
window.__EP14_SCENES = window.__EP14_SCENES || {};
const LIST = [
  ['cran', () => A7.cran({ expr: 'happy' })], ['pear', () => A7.pear({ expr: 'neutral' })], ['banana', () => A7.banana({ expr: 'happy' })], ['goji', () => A7.goji({ expr: 'neutral' })],
  ['lime', () => A6.lime({ expr: 'happy' })], ['star', () => A14.stateman({})], ['kum', () => A14.kumquat({})], ['straw', () => A11.straw({})],
  ['lemon', () => A7.lemon({})], ['mango', () => A7.mango({})], ['clem', () => A10.clem({})], ['melon', () => (window.A9 ? A9.melon({}) : A7.lemon({}))],
];
window.__EP14_SCENES.voices = {
  shot: () => 'gal',
  cam() { zoomTo(540, 960, 1); },
  draw(lt) {
    ctx.fillStyle = '#d9b98a'; ctx.fillRect(0, 0, W, H);
    V2.setLight({ key: [-.55, -.75], keyColor: '#ffe9c8', keyA: .26, rim: '#ffd9a0', rimA: .4, shadow: '#2a1c14', shadowA: .3, bounce: '#ffd9a0', bounceA: .16 });
    LIST.forEach(([id, mk], i) => {
      const c = i % 4, r = (i / 4) | 0;
      const o = mk();
      Object.assign(o, { x: 135 + c * 270, y: 560 + r * 470, s: .8, id, who: undefined });
      drawChar(o);
    });
  },
  fx: () => ({ bloom: .3, vignette: .3 }),
  blur: () => 1,
  over() {},
};
})();
