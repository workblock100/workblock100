'use strict';
/* SHIFT HAPPENS, Episode 14 art kit, shared by every Episode 14 scene module. Exposed as window.A14. Constructors return the options object for drawChar, like A7 / A10 / A13.
 *
 * STUB written by the lead so every builder can start at once. The constructor names and options below are final; the art agent (brief E14-C) replaces the looks (the surveyor's
 * pith-free safari-style vest and lanyard, the trainee's tiny kumquat body and huge clipboard, the binder, the clipboard prop) and documents extra options here.
 *
 *   A14.stateman(o)   Mr. Stateman, the State surveyor (the Starfruit of Episode 2, kind 'star'): soft, deadpan, clipboard, STATE lanyard. who: 'star'.
 *   A14.kumquat(o)    the trainee surveyor (a small kumquat, kind 'kumquat', rx 66 ry 74): earnest, TRAINEE lanyard, carries a clipboard that is too big. who: 'kum'.
 *   A14.pear(o)       Mr. Pear (kind 'pear' as in Episodes 5 to 8), the resident who still honours the paid break clause. who: 'pear'.
 *   A14.goji(o)       Mr. Goji, the wolf (Episodes 7 and 8). who: 'goji'.
 * Reuse for the rest of the cast: A7.straw / A11.straw (per diem look), A7.lemon, A7.mango, A10.clem, A9.melon, A7.cran, A7.banana.
 * Props (EXT.prop, prefix fp14_): fp14_clip (a clipboard, o.clipPage 0..1 how full it is), fp14_binder (a huge binder), fp14_binocs (binoculars).
 */
(() => {
if (!window.TIMELINE_EP14) return;
const A = window.A14 = {};
const SC = .44, G = 1316;
A.stateman = o => Object.assign({ kind: 'star', id: 'stateman', who: 'star', s: SC, y: G, acc: ['badge7'], badgeText: 'STATE', expr: 'neutral', seed: 141 }, o);
A.kumquat = o => Object.assign({ kind: 'clem', id: 'kumquat', who: 'kum', s: SC * .72, y: G, acc: ['badge7'], badgeText: 'TRAINEE', expr: 'hopeful', seed: 142 }, o);
A.pear = o => (window.A7 && A7.pear ? A7.pear(o) : Object.assign({ kind: 'cran', id: 'pear', who: 'pear', s: SC, y: G, expr: 'neutral' }, o));
A.goji = o => (window.A7 && A7.goji ? A7.goji(o) : Object.assign({ kind: 'cran', id: 'goji', who: 'goji', s: SC, y: G, expr: 'angry' }, o));
})();
