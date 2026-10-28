'use strict';
/* SHIFT HAPPENS, Episode 13 art kit, shared by every Episode 13 scene module. Exposed as window.A13. Registers through the engine's EXT hooks, so earlier episodes are untouched.
 * Owner of changes: the vault builder (Brenda and her props). Constructors return the options object for drawChar, like A7 / A10 / A11. */
(() => {
const A = window.A13 = {};
// Brenda, RN: a prune who went on break in 2019 and was never relieved. Dry, dusty, still wearing her scrubs and her badge. (First version: the vault builder refines the look.)
A.brenda = o => Object.assign({ kind: 'prune', id: 'brenda', who: 'brenda', s: SC, y: G, acc: ['steth', 'badge7'], badgeText: 'RN', expr: 'weak', seed: 133 }, o);
})();
