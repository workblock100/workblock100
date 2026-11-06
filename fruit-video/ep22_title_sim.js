'use strict';
/* SHIFT HAPPENS, Episode 22, scene `title` (6.8 s): the DOM-free soft bodies of the title card (builder ART): the gold ribbon pulled off the gift and the red tree-print paper on its front torn open.
 * window.__EP22_SIMS.title = { build, T, L } and module.exports = the same. World time = scene-local time (tools_phys_events.js adds the scene start, 0).
 *
 * ONE SOFT2D WORLD in the title's world px (the camera eases from zoom 1.16 at (540, 1000) to 1 at (540, 960) between 2.4 and 3.4 s):
 *  RIBBON  a rope (mat ribbon, 48 wide, 30 segments) lying up the middle of the box front and over the lid to the bow (540, 1290 -> 540, 804). Every particle is held where it lies until `ribbonpull`
 *          (T.pull 1.1); the head (at the bow) is then yanked up and to the upper right out of frame (accelerating, 0.65 s); the rest slides off the box after it and whips away.
 *  PAPER   a cloth (mat paper, 28 x 20 particles, 540 x 384: the box front x 270..810, y 906..1290) in the screen plane, its border held (folded round the box edges), no gravity until the first rip.
 *          `paperrip` 1 (T.rip1 1.8): w.rip unzips a ragged line from the top edge down the middle and along the bottom fold to the left edge (0.22 s); the left half's top and left edges come off the box,
 *          gravity on, and an unseen hand (a grip of 6 pins near the torn edge) yanks it away to the left and toward us; released at T.rip1 + 0.6 it flies on out of frame.
 *          `paperrip` 2 (T.rip2 2.3): the right half tears off along the bottom fold to the right edge, its top and right edges come off, and it is yanked away to the right.
 *          A thin strip of paper stays glued along the bottom edge of the box (the bottom row is never released), ragged along the tear.
 *  SCRAPS  ten little flat pieces of paper (3 x 3, plane xz) torn loose at each rip: held out of sight until their rip, flicked off the tear line, they flutter down and settle on the table (a floor at
 *          y 1302, drawn with view ky .42).
 * Deterministic (no Math.random, no clock, no Math.sin/cos: the paths are polynomials). Built once (lazily) by the scene and sampled with world.at(min(lt, T)); never stepped by a render.
 * Until SOFT2D is loaded, build() returns null and the scene draws its hand-animated stand-in. */
(function () {
const SOFT2D = (typeof window !== 'undefined' && window.SOFT2D) || (typeof module === 'object' && module.exports ? (() => { try { return require('./soft2d.js'); } catch (e) { return null; } })() : null);

/* the cue times (scene-local, snapped to frames: the title starts at 0, so 1.1, 1.8 and 2.3 are frame times already) */
const T = { pull: 1.1, rip1: 1.8, rip2: 2.3, run: 4.6 };
const L = {
  box: { x0: 270, x1: 810, y0: 906, y1: 1290 },            /* the box front: the paper covers it exactly */
  bowY: 804,                                              /* the bow's centre on the closed lid: the ribbon's head */
  floor: 1302,                                            /* the table, for the scraps */
  cols: 28, rows: 20,
  rip1: [[.556, 0], [.535, .3], [.505, .62], [.47, .9], [.44, .968], [0, .968]],   /* rest space: u across, v down */
  rip2: [[.44, .968], [1, .968]],
};
const sm = u => { u = u < 0 ? 0 : u > 1 ? 1 : u; return u * u * (3 - 2 * u); };
const clamp01 = u => u < 0 ? 0 : u > 1 ? 1 : u;

function build(opts = {}) {
  if (!SOFT2D || !SOFT2D.world) return null;
  const S = SOFT2D, B = L.box, W = B.x1 - B.x0, H = B.y1 - B.y0, cols = L.cols, rows = L.rows, du = W / (cols - 1), dv = H / (rows - 1);
  const w = S.world({ gravity: [0, 1500], dt: 1 / 240, iterations: 12, seed: 2201, damping: .02 });
  const table = w.collider({ floor: L.floor, mat: 'wood', tag: 'table' });

  /* the ribbon: held on the box until the pull, then the head is yanked away */
  const N = 30, rope = w.rope({ from: [540, B.y1], to: [540, L.bowY], segments: N, width: 48, thickness: 4, mat: 'ribbon', tag: 'ribbon', collide: [],
    pins: [] });
  for (let k = 0; k < N; k++) w.pin(rope.id, k, undefined, { until: T.pull });
  const head = t => { const u = clamp01((t - T.pull) / .65), e = u * u * (1.4 - .4 * u); return [540 + 980 * e * e + 140 * e, L.bowY - 1650 * e, 60 * e]; };
  w.pin(rope.id, -1, head, { until: T.pull + .66 });

  /* the paper on the box front: the border held, no gravity until the first rip */
  const pins = [];
  for (let i = 0; i < cols; i++) { pins.push({ i, j: 0 }); pins.push({ i, j: rows - 1 }); }
  for (let j = 1; j < rows - 1; j++) { pins.push({ i: 0, j }); pins.push({ i: cols - 1, j }); }
  const paper = w.cloth({ x: B.x0, y: B.y0, width: W, height: H, cols, rows, mat: 'paper', tag: 'wrap', gravityScale: 0, collide: [], pins, tear: { strain: 3, jag: .4 } });
  const ripCol = Math.round(L.rip1[0][0] * (cols - 1));   /* the column where the rip meets the top edge */

  /* paperrip 1: the rip, then the left half comes off its edges and is yanked away to the left */
  w.rip(paper.id, { path: L.rip1, t0: T.rip1, t1: T.rip1 + .22, jag: .5 });
  w.schedule(T.rip1, ww => {
    ww.set(paper.id, { gravityScale: 1 });
    for (let i = 0; i <= ripCol; i++) ww.unpin(paper.id, paper.index(i, 0));
    for (let j = 1; j < rows - 1; j++) ww.unpin(paper.id, paper.index(0, j));
  });
  /* the rip line's u at a height v (rest space), to grip each row one cell inside the torn edge */
  const ripU = v => { const P = L.rip1; for (let k = 1; k < P.length; k++) if (v <= P[k][1] || k === P.length - 1) { const a = P[k - 1], b = P[k], r = (v - a[1]) / ((b[1] - a[1]) || 1); return a[0] + (b[0] - a[0]) * clamp01(r); } return P[0][0]; };
  /* an unseen hand takes the torn edge (every row of it) and pulls it across the half and away: the half folds over itself (its white back shows) and is carried off out of frame */
  const grip = (side, t0, dur, d) => {
    for (let j = 1; j <= rows - 3; j++) {
      const v = j / (rows - 1), ue = ripU(v) * (cols - 1), i = side < 0 ? Math.floor(ue) - 1 : Math.ceil(ue) + 1;
      if (i < 1 || i > cols - 2) continue;
      const x0 = B.x0 + i * du, y0 = B.y0 + j * dv, lag = .012 * Math.abs(j - 6);   /* the middle of the edge leads, the ends follow */
      w.pin(paper.id, paper.index(i, j), t => { const u = clamp01((t - t0 - lag) / dur), e = sm(u) * (.35 + .65 * u); return [x0 + d[0] * e, y0 + d[1] * e - 60 * sm(u * 2) * (1 - u), d[2] * sm(u * 1.4)]; }, { from: t0, until: t0 + dur + .2 });
    }
  };
  grip(-1, T.rip1 + .04, .62, [-1150, 140, 220]);

  /* paperrip 2: the right half tears off the bottom fold, comes off its edges and is yanked away to the right */
  w.rip(paper.id, { path: L.rip2, t0: T.rip2, t1: T.rip2 + .16, jag: .5 });
  w.schedule(T.rip2, ww => {
    for (let i = ripCol; i < cols; i++) ww.unpin(paper.id, paper.index(i, 0));
    for (let j = 1; j < rows - 1; j++) ww.unpin(paper.id, paper.index(cols - 1, j));
  });
  grip(1, T.rip2 + .03, .6, [1150, -80, 220]);

  /* the scraps: flat little pieces, held out of sight until their rip, flicked off the tear line, fluttering down onto the table */
  const scraps = [];
  const R = w.rand ? () => w.rand() : (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const along = (path, u) => { let best = path[0]; const n = path.length - 1, f = u * n, k = Math.min(n - 1, Math.floor(f)), r = f - k; best = [path[k][0] + (path[k + 1][0] - path[k][0]) * r, path[k][1] + (path[k + 1][1] - path[k][1]) * r]; return [B.x0 + best[0] * W, B.y0 + best[1] * H]; };
  for (let n = 0; n < 10; n++) {
    const first = n < 5, t0 = (first ? T.rip1 : T.rip2) + .02 + .03 * (n % 5), p = first ? along(L.rip1, .08 + .17 * (n % 5)) : along(L.rip2, .12 + .19 * (n % 5));
    const side = first ? -1 : 1, vx = side * (140 + 220 * R()), vy = -(160 + 220 * R()), vz = 60 + 120 * R(), sw = 18 + 10 * R(), sh = 13 + 8 * R();
    const sc = w.cloth({ cx: p[0], cy: p[1], z: 18, width: sw, height: sh, cols: 3, rows: 3, plane: 'xz', mat: 'paper', tag: 'scrap', collide: [table.id], pins: [] });
    for (let k = 0; k < 9; k++) w.pin(sc.id, k, undefined, { until: t0 });
    w.pin(sc.id, 4, t => { const d = Math.max(0, t - t0); return [p[0] + vx * d, p[1] + vy * d, 18 + vz * d]; }, { from: t0, until: t0 + .06 });
    scraps.push({ id: sc.id, t0 });
  }

  w.run(opts.T || T.run, { sampleHz: opts.sampleHz || 120 });
  return { world: w, T: T.run, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 1000, z: 1.16 } }, maxEvents: 60, sampleHz: 120,
    meta: { paper: paper.id, ribbon: rope.id, scraps, table: table.id, ripCol } };
}
const api = { build, T, L };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP22_SIMS = window.__EP22_SIMS || {}; window.__EP22_SIMS.title = api; }
})();
