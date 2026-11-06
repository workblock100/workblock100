'use strict';
/* SHIFT HAPPENS, Episode 10 art kit: the new hire, Clementine, on the v2 renderer (she was a v1 character in Episode 4 and a background face in Episode 6),
 * plus the props the Episode 10 and 11 scene modules share. Exposed as window.A10. Registers through the engine's EXT hooks, so earlier episodes are untouched. */
(() => {
const A = window.A10 = {};
const A7 = window.A7;

// ------------------------------------------------------------------ constructors
// Clementine: small, round, eager. A brand-new hire's steth, her price tag still on, an ID badge that says NEW.
A.clem = o => Object.assign({ kind: 'clem', id: 'clem', who: 'clem', s: SC, y: G, acc: ['steth', 'pricetag', 'badge7'], badgeText: 'NEW', expr: 'hopeful', seed: 91 }, o);
})();
