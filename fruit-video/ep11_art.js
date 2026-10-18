'use strict';
/* SHIFT HAPPENS, Episode 11 art kit (window.A11): the cast as they stand in Episode 11, so every scene module dresses them the same way.
 * Strawberry has gone per diem (her staff badge is gone, the PER DIEM clip is on), Clementine keeps the Episode 10 look. Registers nothing new with the engine. */
(() => {
const A = window.A11 = {};
const A7 = window.A7, A10 = window.A10;

// Strawberry, per diem: steth and bandage as always, no staff badge, the clip-on PER DIEM badge from Episode 9 (perdiem9 swings with `badgeSwing`)
A.straw = o => { const r = A7.straw(o); if (!o || !o.acc) r.acc = ['steth', 'bandage7', 'perdiem9']; return r; };
// Clementine, still wearing the price tag and the steth; the badge text is the scene's call (NEW, or her predecessor's name)
A.clem = o => A10.clem(o);
})();
