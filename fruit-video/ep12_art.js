'use strict';
/* SHIFT HAPPENS, Episode 12 art kit (window.A12): the helpers shared by the Episode 12 scene modules.
 *
 * Why this file exists (the alignment pass): a sign, poster, banner or board is either WHOLE in the frame or not drawn at all in that shot, never sliced by the edge, and a character is either
 * sharp and complete or out of the shot (no soft, half-cut neighbours in the foreground). These helpers measure the object in screen space, through the camera and every transform in force,
 * so a scene can decide per frame instead of guessing per shot.
 *
 *   A12.box(x0, y0, x1, y1)         screen box [x0, y0, x1, y1] of a rectangle given in the current local frame (the camera, zoom, roll and any rotation in force are applied)
 *   A12.whole(b, m)                 the screen box b lies inside the frame, m px from every edge (default 24)
 *   A12.gone(b)                     the screen box b is entirely outside the frame
 *   A12.clear(b)                    b keeps clear of the caption zone and the clock pill of the scene being drawn (for hero text)
 *   A12.charBox(o)                  screen box of a character built by a constructor (drawChar options): the body, the leaves or cap on top, the feet
 *   A12.charWhole(o, m)             the whole character is inside the frame; only the sides and the top count when it sits behind a table (o.noLegs)
 *   A12.sfx(lt, t0, str, x, y, o)   a sound word (Bangers, pops in, holds, fades), placed by the UI kit; call it from over()
 */
(() => {
window.A12 = window.A12 || {};
const A = window.A12;

A.box = (x0, y0, x1, y1) => screenBox(x0, y0, x1, y1);
A.whole = (b, m = 24) => b[0] >= m && b[1] >= m && b[2] <= W - m && b[3] <= H - m;
A.gone = b => b[2] <= 0 || b[0] >= W || b[3] <= 0 || b[1] >= H;
A.clear = b => {
  const S = EP.SCENES[CUR.id] || {};
  const hit = (r) => b[2] > r[0] && b[0] < r[2] && b[3] > r[1] && b[1] < r[3];
  return !( (!S.noScrim && hit([0, 1380, W, 1700])) || (!S.noChyron && hit([48, 116, 500, 244])) );
};

// the body of a character in screen px: its widest part, the leaves, the cap or the hair on top (generous), the soles of the feet
A.charBox = o => {
  const k = KINDS[o.kind] || KINDS.lemon, s = o.s || 1, leg = o.noLegs ? 0 : (k.leg || 90);
  const rx = k.rx * 1.12 * s, top = o.y - (o.lift || 0) - (leg + k.ry * 1.9 + 70) * s;
  return screenBox(o.x - rx, top, o.x + rx, o.y + 14 * s);
};
A.charWhole = (o, m = 24) => {
  const b = A.charBox(o);
  return b[0] >= m && b[2] <= W - m && b[1] >= m && (o.noLegs || b[3] <= H - m);
};

// a sound word: it pops in (scale 1.25 to 1 in .14 s), holds, then fades. Hero text: placed by the kit, kept inside the frame by construction (it shrinks to maxW)
A.sfx = (lt, t0, str, x, y, o = {}) => {
  const k = seg(lt, t0, t0 + .14), hold = o.hold ?? .5, f = 1 - seg(lt, t0 + hold, t0 + hold + .2);
  if (k <= 0 || f <= 0) return;
  const sc = lerp(1.25, 1, easeOut(k));
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.rotate(o.rot ?? -.08); ctx.scale(sc, sc);
  UI.label(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', stroke: '#150f22', lw: 14, spacing: 3, shadow: 14, maxW: o.maxW ?? 760 });
  ctx.restore();
};
})();
