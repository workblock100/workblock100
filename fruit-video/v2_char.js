'use strict';
/* v2 character renderer. Same fruit, same KINDS, same props and accessories as Episodes 1 to 5, but:
 *   - bodies are lit by the scene's key, rim, bounce and any colored practical lights (V2.setLight, V2.addLight)
 *   - soft contact shadows and an optional glossy-floor reflection
 *   - tapered two-bone arms with elbows, real hands (open, fist, point, grip, thumb, flat, wave) and tapered legs
 *   - a gait driven by distance traveled, so planted feet do not slide
 *   - faces with lid shading, catchlights, tapered brows, smooth blinks, micro eye movement
 *   - mouths driven by per-frame openness, spread and teeth from the recorded voice (l.mouth, l.vis)
 * Called from drawChar() when EP.v2 is set. All of it is a pure function of the object passed in and the time. */
const V2C = (() => {
  const viol = [];
  let M0 = null;
  const reflCv = V2.mk(1100, 560), reflCtx = reflCv.getContext('2d');
  const skinPat = mainCtx.createPattern(V2.skinTile, 'repeat');
  const state = {};

  // ---------------------------------------------------------------- voice -> mouth
  function mouthState(who) {
    for (const l of TL.lines) {
      if (l.who !== who || T < l.s || T >= l.e) continue;
      const f = (T - l.s) * FPS, i = Math.min(l.mouth.length - 1, Math.floor(f)), j = Math.min(l.mouth.length - 1, i + 1), u = f - i;
      const dg = n => (l.mouth.charCodeAt(n) - 48) / 9;
      const open = lerp(dg(i), dg(j), u);
      if (l.vis) {
        const vg = n => (l.vis.charCodeAt(n) - 48) / 9;
        return { open, spread: lerp(vg(i * 2), vg(j * 2), u), teeth: lerp(vg(i * 2 + 1), vg(j * 2 + 1), u) };
      }
      return { open, spread: .5, teeth: 0 };
    }
    return { open: 0, spread: .5, teeth: 0 };
  }

  // ---------------------------------------------------------------- small geometry helpers
  function ik2(ax, ay, tx, ty, l1, l2, bend, label) {
    const dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy) || .001;
    const max = l1 + l2 - 1, min = Math.abs(l1 - l2) + 2;
    if (d > max + 12) viol.push(`${label}: hand target ${Math.round(d - max)}px beyond reach`);
    const dd = clamp(d, min, max), ux = dx / d, uy = dy / d;
    const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    return { ex: ax + ux * a - uy * h * bend, ey: ay + uy * a + ux * h * bend, hx: ax + ux * dd, hy: ay + uy * dd };
  }
  // tapered limb through 3 points with widths w0, w1, w2
  function limb(P, W3, fill, rim) {
    const n = [];
    for (let i = 0; i < 3; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(2, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; n.push([-dy / L, dx / L]);
    }
    const left = P.map((p, i) => [p[0] + n[i][0] * W3[i] / 2, p[1] + n[i][1] * W3[i] / 2]);
    const right = P.map((p, i) => [p[0] - n[i][0] * W3[i] / 2, p[1] - n[i][1] * W3[i] / 2]);
    ctx.beginPath(); ctx.moveTo(...left[0]); ctx.quadraticCurveTo(left[1][0], left[1][1], ...left[2]);
    ctx.arc(P[2][0], P[2][1], W3[2] / 2, Math.atan2(n[2][1], n[2][0]), Math.atan2(-n[2][1], -n[2][0]), true);   // round end cap, through the direction of travel
    ctx.quadraticCurveTo(right[1][0], right[1][1], ...right[0]);
    ctx.arc(P[0][0], P[0][1], W3[0] / 2, Math.atan2(-n[0][1], -n[0][0]), Math.atan2(n[0][1], n[0][0]), true);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = rim || 'rgba(255,255,255,.1)'; ctx.stroke();
    // soft highlight on the lit side
    const kx = V2.LIGHT.key[0], ky = V2.LIGHT.key[1];
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = Math.max(2, W3[1] * .28); ctx.lineCap = 'round';
    const off = (kx < 0 ? 1 : -1) * W3[1] * .22;
    ctx.beginPath(); ctx.moveTo(P[0][0] + n[0][0] * off, P[0][1] + n[0][1] * off); ctx.quadraticCurveTo(P[1][0] + n[1][0] * off, P[1][1] + n[1][1] * off, P[2][0] + n[2][0] * off, P[2][1] + n[2][1] * off); ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- shadow and reflection (feet at the origin, unscaled coordinates)
  function floorShadow(o, k, s, lift) {
    const h = 1 / (1 + lift / 110), kx = V2.LIGHT.key[0];
    const rx = k.rx * s * .92 * h, a = (o.shadowA ?? .5) * h;
    if (V2.LIGHT.shadowLong > 0) {   // light from behind: the shadow stretches toward the camera
      const len = V2.LIGHT.shadowLong * s * 520 * h, w0 = k.rx * s * .62;
      ctx.save(); ctx.translate(0, 4 * s);
      ctx.fillStyle = V2.grad(0, 0, 0, len, [[0, `rgba(6,4,14,${a * .8})`], [.6, `rgba(6,4,14,${a * .4})`], [1, 'rgba(6,4,14,0)']]);
      ctx.beginPath(); ctx.moveTo(-w0, 0); ctx.lineTo(w0, 0); ctx.lineTo(w0 * 1.9, len); ctx.lineTo(-w0 * 1.9, len); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.save();
    // soft cast shadow, pushed away from the key light
    ctx.translate(-kx * 46 * s, 5 * s); ctx.scale(1, .16 + .02 / Math.max(.4, s));
    ctx.fillStyle = V2.radial(0, 0, 0, rx * 1.25, [[0, `rgba(6,4,14,${a * .46})`], [.7, `rgba(6,4,14,${a * .2})`], [1, 'rgba(6,4,14,0)']]);
    ctx.beginPath(); ctx.arc(0, 0, rx * 1.25, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save();
    // tight contact shadow right under the shoes
    ctx.translate(0, 3 * s); ctx.scale(1, .13);
    ctx.fillStyle = V2.radial(0, 0, 0, rx * .85, [[0, `rgba(4,2,10,${a * .95})`], [.6, `rgba(4,2,10,${a * .5})`], [1, 'rgba(4,2,10,0)']]);
    ctx.beginPath(); ctx.arc(0, 0, rx * .85, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function reflection(o, k, s, lift, t) {
    const g = reflCtx, prev = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 1100, 560);
    g.translate(550, 4); g.scale(s, -s);
    ctx = g;
    const legLen = o.noLegs ? 0 : (k.leg || 90);
    g.translate(0, -(legLen + k.ry * .9) - lift / s);
    if (o.flip) g.scale(-1, 1);
    const p = PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k));
    g.fillStyle = bodyFill(k, o.colors || k.c); g.fill(p);
    legs(o, k, t, true);
    ctx = prev;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in';
    const f = g.createLinearGradient(0, 0, 0, 240 * Math.max(.6, s)); f.addColorStop(0, 'rgba(0,0,0,.28)'); f.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = f; g.fillRect(0, 0, 1100, 560); g.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha *= o.reflectA ?? 1; ctx.drawImage(reflCv, -550, 0); ctx.restore();
  }

  // ---------------------------------------------------------------- body lighting
  function localPt(x, y) {
    const inv = ctx.getTransform().inverse(), p = M0.transformPoint(new DOMPoint(x, y));
    return inv.transformPoint(p);
  }
  function shade(o, k, p) {
    const L = V2.LIGHT, R = Math.max(k.rx, k.ry), kx = L.key[0], ky = L.key[1];
    const gx = kx * R * .9, gy = ky * R * .9;
    ctx.save();
    // terminator: the side facing away from the key light falls into shadow
    ctx.fillStyle = V2.grad(gx, gy, -gx, -gy, [[0, V2.rgba(L.shadow, 0)], [.42, V2.rgba(L.shadow, 0)], [1, V2.rgba(L.shadow, L.shadowA)]]);
    ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
    // key light wraps around the lit shoulder
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = V2.radial(gx * .62, gy * .62, 0, R * 1.05, [[0, V2.rgba(L.keyColor, L.keyA)], [1, V2.rgba(L.keyColor, 0)]]);
    ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
    // warm bounce from the floor along the bottom edge
    ctx.fillStyle = V2.radial(-gx * .1, k.ry * 1.05, 0, R * .9, [[0, V2.rgba(L.bounce, L.bounceA)], [1, V2.rgba(L.bounce, 0)]]);
    ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
    ctx.globalCompositeOperation = 'source-over';
    // colored practical lights (alarm domes, screens, the microwave window)
    if (V2.lights.length && M0) for (const l of V2.lights) {
      const q = localPt(l.x, l.y), d = Math.hypot(q.x, q.y), rad = (l.r || 500) / (o.s || 1);
      const f = clamp(1 - d / rad); if (f <= 0) continue;
      const a = (l.a ?? .6) * f * f;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = V2.radial(q.x, q.y, 0, rad, [[0, V2.rgba(l.color, a * .55)], [1, V2.rgba(l.color, 0)]]);
      ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
      ctx.globalCompositeOperation = 'source-over';
      const ang = Math.atan2(q.y, q.x), ex = Math.cos(ang) * R * 1.05, ey = Math.sin(ang) * R * 1.05;
      ctx.strokeStyle = V2.grad(ex, ey, ex * .15, ey * .15, [[0, V2.rgba(l.color, Math.min(.95, a * 1.5))], [1, V2.rgba(l.color, 0)]]);
      ctx.lineWidth = 16; ctx.stroke(p);
    }
    // cool rim on the shadow side, so the figure separates from the wall behind it
    ctx.strokeStyle = V2.grad(-gx, -gy, -gx * .25, -gy * .25, [[0, V2.rgba(L.rim, L.rimA)], [1, V2.rgba(L.rim, 0)]]);
    ctx.lineWidth = 15; ctx.stroke(p);
    // backlight: a bright rim all the way round the silhouette, a dim face
    if (L.back) {
      ctx.strokeStyle = V2.rgba(L.back.color, L.back.a); ctx.lineWidth = L.back.w || 22; ctx.globalCompositeOperation = 'screen'; ctx.stroke(p); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = V2.radial(0, k.ry * .1, R * .2, R * 1.1, [[0, V2.rgba(L.shadow, L.frontDark)], [1, V2.rgba(L.shadow, 0)]]); ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
    }
    // ambient color of the room
    if (L.ambA > 0) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = V2.rgba(L.amb, L.ambA); ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3); ctx.globalCompositeOperation = 'source-over'; }
    // fine skin grain kills banding in the gradients and adds a little tooth
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha *= .16; ctx.fillStyle = skinPat; ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
    ctx.restore();
  }
  function body(o, k, t) {
    const p = PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k));
    const col = o.colors || k.c;
    drawTop(o, k, t, 'back');
    ctx.fillStyle = bodyFill(k, col); ctx.fill(p);
    ctx.save(); ctx.clip(p);
    drawTexture(o, k, t);
    const R = Math.max(k.rx, k.ry);
    const g2 = ctx.createRadialGradient(-k.rx * .1, -k.ry * .1, R * .65, 0, 0, R * 1.08);
    g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.2)');
    ctx.fillStyle = g2; ctx.fillRect(-k.rx * 1.4, -k.ry * 1.4, k.rx * 2.8, k.ry * 2.8);
    shade(o, k, p);
    ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(25,10,20,.92)'; ctx.stroke(p);
    if (k.shape !== 'banana' && k.shape !== 'pill') {   // glossy skin: a crisp window highlight plus a soft sheen along the lit edge
      const kx = V2.LIGHT.key[0], ky = V2.LIGHT.key[1], ang = Math.atan2(ky, kx) + PI / 2;
      ctx.save(); ctx.clip(p);
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(0, 0, k.rx * .93, k.ry * .93, 0, Math.atan2(ky, kx) + PI - .7, Math.atan2(ky, kx) + PI + .2); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(kx * k.rx * .52, ky * k.ry * .58); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(255,255,255,.58)'; ell(0, 0, k.rx * .2, k.ry * .085); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.36)'; ell(k.rx * .3, k.ry * .12, k.rx * .05, k.ry * .05); ctx.fill();
      ctx.restore();
    }
    // leaves, stems and crowns lag behind the body a little
    ctx.save(); const sw = (o.sway || 0) + (o.vx || 0) * -.00022 + Math.sin(t * 2.3 + (o.seed || 0)) * .012;
    ctx.translate(0, -k.ry * .8); ctx.rotate(clamp(sw, -.2, .2)); ctx.translate(0, k.ry * .8);
    drawTop(o, k, t, 'front'); ctx.restore();
  }

  // ---------------------------------------------------------------- face
  function face(o, k, t, seed) {
    if (o.noFace) return;
    const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {});
    const er = k.er * E.wide * (o.eyeScale || 1), ex = k.eyeX, ey = k.eyeY;
    const bt = (t + seed * .37) % 4.1, blink = bt < .17 ? Math.sin(bt / .17 * PI) : 0;
    const look = o.look || [0, 0], lx = look[0] + .05 * vnoise(t * 1.1 + seed), ly = look[1] + .04 * vnoise(t * .9 + seed + 7);
    const faceX = k.shape === 'banana' ? k.face : 0, kc = o.colors || k.c, skin = V2.rgba(V2.mix(kc[0], kc[1], .34), 1);   // lids match the lit skin around the eyes
    ctx.save(); ctx.translate(faceX, 0);
    if (REG.on && !REG.suppress) {
      const hw = ex + er * 1.45, top = ey - er * 1.42 - Math.max(0, E.raise) - (o.browUp || 0) - 9;
      regLocal('face', -hw, top, hw, k.mouthY + 55 * (k.mw || 26) / 26, { id: o.id || o.kind, transit: o.transit });
    }
    // cheeks
    ctx.fillStyle = 'rgba(255,110,150,.30)';
    for (const side of [-1, 1]) { ell(side * (ex + er * .55), ey + er * 1.55, er * .78, er * .42); ctx.fill(); }
    for (const side of [-1, 1]) {
      const x = side * ex, y = ey, eh = er * 1.15;
      // eye white with a soft shadow under the upper lid
      ctx.save(); ell(x, y, er, eh); ctx.clip();
      ctx.fillStyle = V2.grad(0, y - eh, 0, y + eh, [[0, '#f3f4fa'], [.5, '#ffffff'], [1, '#e4e6f2']]); ctx.fillRect(x - er, y - eh, er * 2, eh * 2);
      ctx.fillStyle = V2.grad(0, y - eh, 0, y - eh * .1, [[0, 'rgba(30,20,50,.34)'], [1, 'rgba(30,20,50,0)']]); ctx.fillRect(x - er, y - eh, er * 2, eh);
      const px = x + lx * er * .42, py = y + ly * er * .45, pr = er * .54 * E.pup;
      ctx.fillStyle = V2.radial(px, py, 0, pr, [[0, '#2a2236'], [.7, INK], [1, '#0e0b14']]); ell(px, py, pr, pr); ctx.fill();
      ctx.strokeStyle = 'rgba(140,170,255,.32)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(px, py, pr * .8, .25 * PI, .8 * PI); ctx.stroke();
      ctx.fillStyle = '#fff'; ell(px - pr * .34, py - pr * .42, pr * .3, pr * .3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ell(px + pr * .36, py + pr * .34, pr * .14, pr * .14); ctx.fill();
      if (o.sparkle) { ctx.fillStyle = '#fff'; ell(px + pr * .5, py - pr * .2, pr * .1, pr * .1); ctx.fill(); ell(px - pr * .6, py + pr * .2, pr * .07, pr * .07); ctx.fill(); }
      // lids: upper (expression, blink, override) and lower (squint)
      let lid = Math.max(E.lid, blink);
      if (o.twitch && side === 1) lid = Math.max(lid, .35 + .6 * Math.abs(Math.sin(t * 38)));
      if (o.lid != null) lid = Math.max(o.lid, blink);
      const slant = (E.ang || 0) * er * .34 * (side < 0 ? 1 : -1) * (lid > 0.05 ? 1 : 0);
      if (lid > 0) {
        const ly2 = y - eh + eh * 2 * lid;
        ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(x - er - 3, y - eh - 6); ctx.lineTo(x + er + 3, y - eh - 6); ctx.lineTo(x + er + 3, ly2 - slant); ctx.quadraticCurveTo(x, ly2 + eh * .14 * (1 - lid), x - er - 3, ly2 + slant); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - er, ly2 + slant); ctx.quadraticCurveTo(x, ly2 + eh * .14 * (1 - lid), x + er, ly2 - slant); ctx.stroke();
      }
      const sq = o.squint ?? (E.curve > .85 ? .12 : 0);
      if (sq > 0) {   // lower lid pushed up by a smile: a curved edge, not a block
        const ly3 = y + eh - eh * 2 * sq;
        ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(x - er - 3, y + eh + 6); ctx.lineTo(x - er - 3, ly3 + eh * .12); ctx.quadraticCurveTo(x, ly3 - eh * .28, x + er + 3, ly3 + eh * .12); ctx.lineTo(x + er + 3, y + eh + 6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - er, ly3 + eh * .12); ctx.quadraticCurveTo(x, ly3 - eh * .28, x + er, ly3 + eh * .12); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ell(x, y, er, eh); ctx.stroke();
      if (o.lashes) {   // three lashes fanning off the outer upper lid
        ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        for (const phi of [.3, .65, 1.0]) {
          const bx = x + side * er * Math.cos(phi), by2 = y - eh * Math.sin(phi);
          ctx.beginPath(); ctx.moveTo(bx, by2); ctx.lineTo(bx + side * Math.cos(phi) * 10, by2 - Math.sin(phi) * 10); ctx.stroke();
        }
      }
      if (E.bags) { ctx.strokeStyle = 'rgba(40,20,50,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y + eh * .95, er * .8, .15 * PI, .85 * PI); ctx.stroke(); }
      // brow: tapered, arched, angled by the expression
      const ang = E.asym ? (side < 0 ? E.ang : -.3) : E.ang, by = y - er * 1.42 - E.raise - (o.browUp || 0);
      ctx.save(); ctx.translate(x, by); ctx.rotate(side < 0 ? ang : -ang);
      const bw = er * .92, thI = (o.browW || 8) * 1.1, thO = (o.browW || 8) * .62, arch = E.arch ?? (E.curve > .5 ? 5 : -1);
      ctx.fillStyle = o.browColor || INK; ctx.beginPath();
      ctx.moveTo(-side * bw, -thI / 2); ctx.quadraticCurveTo(0, -arch - thI / 2, side * bw, -thO / 2); ctx.lineTo(side * bw, thO / 2); ctx.quadraticCurveTo(0, -arch + thI / 2, -side * bw, thI / 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(-side * bw, 0, thI / 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(side * bw, 0, thO / 2, 0, TAU); ctx.fill();
      ctx.restore();
    }
    mouth(o, k, E);
    ctx.restore();
  }

  function mouth(o, k, E) {
    const ms = o.mouthState || { open: 0, spread: .5, teeth: 0 }, w = k.mw || 26, sc = w / 26;
    const open = Math.max(clamp(o.talk || 0), o.mouthOpen || 0), spread = o.mouthState ? ms.spread : .5, teethAmt = ms.teeth || 0;
    ctx.save(); ctx.translate(0, k.mouthY);
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (open > .04) {
      // width follows the vowel (round to wide), height follows the jaw
      const ww = w * (.64 + .62 * spread) + 8 * open * sc * .6, h = (7 + 46 * open) * sc * (1.1 - .3 * spread);
      ctx.beginPath(); let tongueY, topY;
      if (E.curve >= .3) { ctx.moveTo(-ww, 0); ctx.quadraticCurveTo(0, 5, ww, 0); ctx.ellipse(0, 0, ww, h, 0, 0, PI); tongueY = h * .8; topY = 0; }
      else if (E.curve <= -.3) { ctx.moveTo(ww, h * .7); ctx.ellipse(0, h * .7, ww, h * .95, 0, 0, PI, true); ctx.quadraticCurveTo(0, h * .55, ww, h * .7); tongueY = h * .62; topY = -h * .25; }
      else { ctx.ellipse(0, h * .45, ww * .88, h * .62, 0, 0, TAU); tongueY = h * .9; topY = -h * .15; }
      ctx.closePath();
      ctx.fillStyle = V2.grad(0, topY, 0, topY + h * 1.6, [[0, '#3a0510'], [1, '#6a0f20']]); ctx.fill();
      ctx.save(); ctx.clip();
      const toothH = (4 + 9 * Math.max(teethAmt, E.curve > .5 ? .35 : 0)) * sc;
      ctx.fillStyle = '#fff'; ctx.fillRect(-ww, topY - 4, ww * 2, 4 + Math.min(toothH, h * .34));
      ctx.fillStyle = '#ff6f86'; ell(0, tongueY, ww * .6, h * .32); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ell(-ww * .15, tongueY - h * .06, ww * .22, h * .08); ctx.fill();
      ctx.restore(); ctx.stroke();
    } else if (E.o) {
      ctx.fillStyle = '#4a0716'; ell(0, 6 * sc, 12 * sc, 17 * sc); ctx.fill(); ctx.stroke();
    } else if (E.smirk) {
      ctx.beginPath(); ctx.moveTo(-w * .8, 2); ctx.quadraticCurveTo(w * .2, 12, w, -10); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, E.curve * 30 * sc, w, 0); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- hands
  const GLOVE = '#f6f7fb';
  function hand(kind, side, o) {
    // drawn in a frame where +x runs along the fingers and +y points to the thumb side
    const gl = V2.grad(0, -16, 0, 16, [[0, '#ffffff'], [1, '#d9deea']]);
    ctx.lineWidth = 3.4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fillStroke = () => { ctx.fillStyle = gl; ctx.fill(); ctx.stroke(); };
    const seam = (x0, y0, x1, y1) => { ctx.save(); ctx.strokeStyle = 'rgba(30,20,40,.5)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); };
    switch (kind) {
      case 'fist': case 'grip': {
        const r = kind === 'grip' ? 16 : 14.5;
        ctx.beginPath(); ctx.ellipse(10, 0, r, r * .97, 0, 0, TAU); fillStroke();
        ctx.beginPath(); ctx.ellipse(9, r * .62, 9.5, 6.6, .3, 0, TAU); fillStroke();
        for (const y of [-7, -2.5, 2]) seam(17, y, 24, y + .5);
        break;
      }
      case 'point':
        ctx.beginPath(); ctx.ellipse(8, 0, 13.5, 13, 0, 0, TAU); fillStroke();
        ctx.beginPath(); ctx.roundRect(14, -10, 30, 9.5, 4.7); fillStroke();
        ctx.beginPath(); ctx.ellipse(8, 11, 8.5, 6, .3, 0, TAU); fillStroke();
        break;
      case 'thumb':
        ctx.beginPath(); ctx.ellipse(9, 0, 14, 13.5, 0, 0, TAU); fillStroke();
        ctx.beginPath(); ctx.roundRect(1, -34, 10, 26, 5); fillStroke();
        for (const y of [-6, -1.5, 3]) seam(16, y, 22, y);
        break;
      case 'flat':
        ctx.beginPath(); ctx.ellipse(16, 0, 22, 10.5, 0, 0, TAU); fillStroke();
        ctx.beginPath(); ctx.ellipse(6, 11, 9, 5.5, .35, 0, TAU); fillStroke();
        for (const y of [-5, 0, 5]) seam(28, y, 36, y);
        break;
      case 'wave':
        ctx.beginPath(); ctx.ellipse(8, 0, 12.5, 12.5, 0, 0, TAU); fillStroke();
        for (const a of [-.62, -.22, .18, .58]) { ctx.save(); ctx.translate(13, a * 11); ctx.rotate(a * .95); ctx.beginPath(); ctx.roundRect(0, -4, 21, 8, 4); fillStroke(); ctx.restore(); }
        ctx.beginPath(); ctx.ellipse(5, 13, 8, 5.5, .6, 0, TAU); fillStroke();
        break;
      default:   // open mitten with a thumb
        ctx.beginPath(); ctx.ellipse(11, 0, 15.5, 13.5, 0, 0, TAU); fillStroke();
        ctx.beginPath(); ctx.ellipse(7, 12.5, 8.5, 5.8, .5, 0, TAU); fillStroke();
        for (const y of [-6, -.5, 5]) seam(19, y, 25, y);
    }
  }
  const HAND = { rest: 'open', down: 'open', hips: 'open', hold: 'grip', offer: 'open', point: 'point', phone: 'grip', thumb: 'thumb', stop: 'flat', shrug: 'open', flail: 'open', reach: 'open', cheer: 'open', run: 'fist', up: 'open', wave: 'wave' };

  function arms(o, k, t) {
    const A = o.arms || {}, scale = o.armScale || 1.12;
    for (const side of [-1, 1]) {
      const key = side < 0 ? 'l' : 'r', pose = A[key] || 'rest';
      if (pose === 'none') continue;
      const [sx, sy] = shoulder(k, side), L1 = (k.arm1 || 56) * scale, L2 = (k.arm2 || 52) * scale;
      let sol;
      const grip = o.grip && o.grip[key];
      if (grip) sol = ik2(sx, sy, grip[0], grip[1], L1, L2, -side, `${o.id || o.kind} ${key} arm`);
      else {
        const [a1, a2] = poseAngles(pose, t + (side > 0 ? .5 : 0));
        const ex = sx + side * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
        sol = { ex, ey, hx: ex + side * Math.sin(a1 + a2) * L2, hy: ey + Math.cos(a1 + a2) * L2 };
      }
      const wid = [17, 14.5, 12.5];
      limb([[sx, sy], [sol.ex, sol.ey], [sol.hx, sol.hy]], wid, LIMB);
      ctx.fillStyle = '#3a3342'; ell(sx, sy, 9.5, 9.5); ctx.fill();   // shoulder cap hides the join with the body
      const prop = o.hold && o.hold[key];
      const hx = sol.hx, hy = sol.hy, ang = Math.atan2(hy - sol.ey, hx - sol.ex);
      if (prop) {
        drawProp(prop, hx, hy, side, o, t);
        const e = typeof PROP_BOX[prop] === 'function' ? PROP_BOX[prop](o) : PROP_BOX[prop];
        if (e && REG.on && !REG.suppress) {
          const [a, b, c, d] = e, x0 = side < 0 && e.mirror ? -c : a, x1 = side < 0 && e.mirror ? -a : c;
          regLocal('prop', hx + x0, hy + b, hx + x1, hy + d, { id: prop, owner: o.id || o.kind, nearFace: e.nearFace, transit: o.transit });
        }
      }
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang); if (side < 0) ctx.scale(1, -1);
      // cuff at the wrist, then the glove
      ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
      hand((o.hand && o.hand[key]) || (prop ? 'grip' : HAND[pose] || (Array.isArray(pose) ? 'open' : 'open')), side, o);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- legs and shoes
  function legs(o, k, t, silhouette) {
    const hipY = k.shape === 'straw' ? k.ry * .7 : k.shape === 'banana' ? k.ry * .78 : k.shape === 'star' ? k.ry * .74 : k.ry * .8;
    const hx = k.hip || k.rx * .32, L = k.leg || 90, cx = k.shape === 'banana' ? k.rx * .12 : 0;
    const A = o.stride || 30;   // half stride in local units (a longer stride for a confident walk)
    for (const side of [-1, 1]) {
      let fx = cx + side * hx, fy = hipY + L, lift = 0, rot = 0;
      if (o.gait != null || o.gaitW != null) {
        // distance-driven gait. o.gaitW is the distance walked in world units (o.gait in screen px), o.dir the direction
        // (+1 right, or toward the camera with o.axis === 'z'). One full cycle is 4A local units: half a cycle of stance moves
        // the planted foot back 2A while the body moves 2A forward, so the foot is stationary on the floor and nothing slides.
        const dir = o.dir || 1, cyc = (o.gaitW != null ? o.gaitW : o.gait / (o.s || 1)) / (4 * A);
        const ph = ((cyc + (side > 0 ? 0 : .5)) % 1 + 1) % 1;   // 0..1; stance in [0,.5), swing in [.5,1)
        const off = ph < .5 ? A - 2 * A * (ph / .5) : -A + 2 * A * easeIO((ph - .5) / .5);
        if (o.axis === 'z') fy += dir * off * .5; else fx += dir * off;
        if (ph >= .5) lift = Math.sin((ph - .5) / .5 * PI) * 17;
      } else if (o.walk != null) {
        const a = Math.sin(o.walk + (side > 0 ? 0 : PI)) * .55; fx += Math.sin(a) * L; fy = hipY + Math.cos(a) * L; lift = Math.max(0, Math.cos(o.walk + (side > 0 ? 0 : PI))) * 0;
      }
      if (o.legs === 'kick') { const a = side * .5 + .35 * Math.sin(t * 22 + side * 2); fx = cx + side * hx + Math.sin(a) * L; fy = hipY + Math.cos(a) * L; }
      if (o.legs === 'splay') { const a = side * .55; fx = cx + side * hx + Math.sin(a) * L; fy = hipY + Math.cos(a) * L; }
      if (o.legs === 'tap' && side > 0) lift = Math.max(0, Math.sin(t * 16)) * 11;
      if (!o.walk && o.gait == null && !o.legs) fx += Math.sin(t * .9 + (o.seed || 0)) * 1.2 * side;   // idle weight shift
      fy -= lift;
      const kneeOut = side * (4 + lift * .3);
      const P = [[cx + side * hx, hipY - 12], [(cx + side * hx + fx) / 2 + kneeOut, (hipY + fy) / 2], [fx, fy - 6]];
      if (!silhouette) {
        limb(P, [16, 13.5, 12], LIMB);
        shoe(o, k, side, fx, fy, lift);
      } else { ctx.strokeStyle = LIMB; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...P[0]); ctx.lineTo(...P[2]); ctx.stroke(); ctx.fillStyle = k.shoe || '#fff'; ell(fx + side * 8 + 6, fy + 3, 27, 14); ctx.fill(); }
    }
  }
  function shoe(o, k, side, fx, fy, lift) {
    const cx = fx + side * 8 + 6, c1 = k.shoe || '#fff', c2 = k.shoe2 || '#ddd';
    ctx.save(); ctx.translate(cx, fy + 3); ctx.rotate(side * .06 - lift * .004 * side);
    ctx.fillStyle = c2; ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.ellipse(0, 6, 28, 8.5, 0, 0, TAU); ctx.fill(); ctx.stroke();   // sole
    ctx.fillStyle = V2.grad(0, -14, 0, 12, [[0, c1], [1, V2.rgba(V2.mix(c1, '#6a6a80', .28), 1)]]);
    ctx.beginPath(); ctx.ellipse(0, 0, 27.5, 14.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(-8, -6, 11, 3.8); ctx.fill();
    ctx.save(); ctx.scale(side, 1); ctx.strokeStyle = 'rgba(30,20,40,.35)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(14, 1, 10, -1.1, 1.1); ctx.stroke(); ctx.restore();
    if (o.kind === 'straw') { ctx.fillStyle = 'rgba(0,0,0,.25)'; for (const dx of [-8, 2, 12]) { ell(dx, -1, 2.5, 2.5); ctx.fill(); } }
    ctx.restore();
  }

  // ---------------------------------------------------------------- entry point
  function drawChar(o) {
    if (o.yaw || o.headYaw || o.turnTo || o.headTurnTo) { const Y = turnYaws(o); if (Y) return drawCharYaw(o, Y); }   /* TURN (Episode 15): a turned character takes the yaw path below; yaw 0 and no headYaw is the code underneath, untouched */
    const k = KINDS[o.kind], s = o.s || 1, t = o.t ?? T;
    // `node render.js events` records every walking character's gait phase so footsteps can be placed on the exact frames the feet land
    if (window.__REC && !o.noLegs && !o.noFoley && (o.gaitW != null || o.gait != null)) {
      const p = ctx.getTransform().transformPoint(new DOMPoint(o.x, o.y));
      window.__REC.push({ key: o.kind + ':' + (o.id || ''), cyc: (o.gaitW != null ? o.gaitW : o.gait / (o.s || 1)) / (4 * (o.stride || 30)), x: p.x, y: p.y, s: s * ctx.getTransform().a });
    }
    const ms = o.who ? mouthState(o.who) : null;
    if (ms) { o.mouthState = ms; if (o.talk == null) o.talk = ms.open; }
    const seed = o.seed ?? (o.kind.charCodeAt(0) * 13 + o.kind.length * 7);
    const legLen = o.noLegs ? 0 : (k.leg || 90), lift = o.lift || 0;
    M0 = ctx.getTransform();
    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.filter) ctx.filter = o.filter;
    if (!o.noShadow && !o.noLegs && !o.center) floorShadow(o, k, s, lift);
    if (V2.opts.reflect && !o.noReflect && !o.noLegs && !o.center) reflection(o, k, s, lift, t);
    ctx.translate(0, -lift);
    ctx.scale(s, s);
    const walkBob = (o.gait != null || o.gaitW != null) ? -Math.abs(Math.sin((o.gaitW != null ? o.gaitW : o.gait / s) / (2 * (o.stride || 30)) * PI)) * 7 : o.walk != null ? -Math.abs(Math.sin(o.walk)) * 9 : 0;
    const bob = o.noBob ? 0 : Math.sin(t * 2.6 + seed) * 2.2 + walkBob;
    if (!o.center) ctx.translate(0, -(legLen + k.ry * .9) + bob); else ctx.translate(0, bob);
    const lean = clamp((o.vx || 0) * .00007, -.09, .09);
    if (o.rot || lean) ctx.rotate((o.rot || 0) + lean);
    if (o.shake) ctx.translate(o.shake * vnoise(t * 50 + seed), o.shake * vnoise(t * 47 + seed + 9));
    const sq = o.squash || 0, emph = o.who ? 1 + .03 * (o.talk || 0) : 1, breathe = 1 + .006 * Math.sin(t * 2.2 + seed);
    if (o.plant && sq && !o.center) ctx.translate(0, (legLen + k.ry * .9) * sq * .35);   // opt-in: the squash is about the body centre, which lifts the shoes; this keeps the soles where the shadow is
    ctx.scale((o.flip ? -1 : 1) * (1 + sq * .35) * (o.sx || 1), (1 - sq * .35) * (o.sy || 1) * emph * breathe);
    FLIP = !!o.flip;
    if (REG.on && !REG.suppress) {
      const id = o.id || o.kind, top = -headTop(o, k), bot = o.noLegs ? k.ry : k.ry * .8 + legLen + 22;
      const faceTop = k.eyeY - k.er * 2.9;
      regLocal('body', -k.rx * 1.08, top, k.rx * 1.08, bot, { id, transit: o.transit });
      if (!o.noFace) regLocal('head', -k.rx * .9, top, k.rx * .9, faceTop, { id, transit: o.transit });
    }
    if (!o.noLegs) legs(o, k, t);
    drawAcc(o, k, t, 'back');
    body(o, k, t);
    drawAcc(o, k, t, 'mid');
    face(o, k, t, seed);
    drawAcc(o, k, t, 'front');
    if (!o.noArms) arms(o, k, t);
    FLIP = false;
    ctx.restore();
  }

  // ================================================================ TURN (Episode 15): the yaw rig
  // o.yaw turns the body, arms, legs and chest dressing; o.headYaw turns the face, the top (stem, leaves, cap, hat) and what sits on the face (it defaults to yaw).
  // Radians: 0 = front, + turns the face toward screen right, +-PI/2 = profile, PI = back. A character with no yaw (or 0) and no headYaw takes the original path above, untouched.
  // Each fruit is a spheroid turning about its vertical axis: a feature at longitude L sits at x = R sin(L + yaw) and is as wide as cos(L + yaw) of its front width (see GUIDE_TURN.md).
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const yawNorm = a => { a = a % TAU; return a > PI ? a - TAU : a <= -PI ? a + TAU : a; };
  const sgn = x => x < 0 ? -1 : 1;
  function turnLerp(a, b, u) { return a + yawNorm(b - a) * sstep(0, 1, u); }                   // ease a turn from a to b the short way round, u 0..1
  function turnPair(a, b, u, lead = .3) { return { headYaw: turnLerp(a, b, u / (1 - lead)), yaw: turnLerp(a, b, (u - lead) / (1 - lead)) }; }   // the head finishes `lead` of the time before the body does
  function turnYaws(o) {
    let y = o.yaw || 0, h = o.headYaw;
    if (o.turnTo) y = turnLerp(o.turnTo[0], o.turnTo[1], o.turnTo[2]);
    if (o.headTurnTo) h = turnLerp(o.headTurnTo[0], o.headTurnTo[1], o.headTurnTo[2]);
    y = yawNorm(y); h = h == null ? y : yawNorm(h);
    if (Math.abs(y) < 1e-4 && Math.abs(h) < 1e-4) return null;
    return { y, h, sy: Math.sin(y), cy: Math.cos(y), sh: Math.sin(h), ch: Math.cos(h) };
  }
  function yawInfo(o) { return turnYaws(o) || { y: 0, h: 0, sy: 0, cy: 1, sh: 0, ch: 1 }; }
  function faceDir(o) { const Y = turnYaws(o), d = Y && Y.sh < 0 ? -1 : 1; return o.flip ? -d : d; }   // +1 the face points to screen right, -1 to the left (a back view counts as the side it last turned to)
  function yawToward(dx, o = {}) { return (o.max ?? 1.15) * Math.tanh(dx / (o.k ?? 220)); }   // a smooth yaw that points a character toward something dx pixels to the right (negative: left); for a velocity use { max: PI / 2, k: 80 }
  const YAW_ACC = {}, YAW_TEX = {}, YAW_TOP = {};   // per-accessory / per-texture / per-top yaw-aware art, see GUIDE_TURN.md

  // ---------------------------------------------------------------- the silhouette of a kind, measured once: its centre line and half width at 48 heights
  const PROF = {}, pcv = document.createElement('canvas'), pctx = (pcv.width = pcv.height = 4, pcv.getContext('2d'));
  function profile(o, k) {
    const key = o.kind, c0 = PROF[key];
    if (c0 && c0.rx === k.rx && c0.ry === k.ry && c0.shape === k.shape) return c0;
    const path = PATHS[key] || (PATHS[key] = bodyPath(k));
    const N = 48, y0 = -k.ry * 1.04, dy = k.ry * 2.08 / N, ext = k.rx * 1.5, inside = (x, y) => pctx.isPointInPath(path, x, y);
    const P = { rx: k.rx, ry: k.ry, shape: k.shape, N, y0, dy, c: [], w: [] };
    for (let i = 0; i <= N; i++) {
      const y = y0 + i * dy; let a = null, b = null;
      for (let x = -ext; x <= ext; x += 3) if (inside(x, y)) { a = x; break; }
      for (let x = ext; x >= -ext; x -= 3) if (inside(x, y)) { b = x; break; }
      if (a == null) { P.c.push(0); P.w.push(0); continue; }
      let lo = a - 3, hi = a; for (let j = 0; j < 4; j++) { const m = (lo + hi) / 2; if (inside(m, y)) hi = m; else lo = m; } a = hi;
      lo = b; hi = b + 3; for (let j = 0; j < 4; j++) { const m = (lo + hi) / 2; if (inside(m, y)) lo = m; else hi = m; } b = lo;
      P.c.push((a + b) / 2); P.w.push((b - a) / 2);
    }
    let asym = 0; for (let i = 0; i <= N; i++) if (P.w[i] > k.rx * .25) asym = Math.max(asym, Math.abs(P.c[i]) / k.rx);
    P.asym = asym;
    P.mode = k.yawMode || (k.shape === 'star' || k.flat ? 'flat' : asym > .04 ? 'tube' : 'sym');   // sym: the silhouette never changes; tube: a curved body whose centre line swings with cos(yaw); flat: a sprite that squeezes
    return PROF[key] = P;
  }
  function profAt(P, y, arr) { const f = clamp((y - P.y0) / P.dy, 0, P.N - .001), i = Math.floor(f), u = f - i; return lerp(arr[i], arr[i + 1], u); }
  const profW = (P, y) => Math.max(8, profAt(P, y, P.w)), profC = (P, y) => profAt(P, y, P.c);

  // the silhouette at this yaw: the original path for a sphere-like kind, a squeezed copy for a flat sprite, a re-swung centre line for a curved body (cached per angle)
  const YPATH = {};
  function yawPath(o, k, P, Y) {
    const base = PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k));
    if (P.mode === 'sym') return base;
    const cb = Y.cy;
    if (P.mode === 'flat') {
      const sx = flatSx(k, Y), key = o.kind + ':f:' + Math.round(sx * 400);
      if (YPATH[key]) return YPATH[key];
      const q = new Path2D(); q.addPath(base, new DOMMatrix([sx, 0, 0, 1, 0, 0])); return YPATH[key] = q;
    }
    const key = o.kind + ':t:' + Math.round(cb * 300);
    if (YPATH[key]) return YPATH[key];
    const R = [], L = [];
    for (let i = 0; i <= P.N; i++) if (P.w[i] > .6) { const y = P.y0 + i * P.dy, c = P.c[i] * cb; R.push([c + P.w[i], y]); L.push([c - P.w[i], y]); }
    const a = R[0], b = R[R.length - 1], pts = [[(a[0] + L[0][0]) / 2, a[1] - P.dy * .6]].concat(R, [[(b[0] + L[L.length - 1][0]) / 2, b[1] + P.dy * .6]], L.slice().reverse());
    const q = new Path2D(), n = pts.length, mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
    let m0 = mid(pts[n - 1], pts[0]); q.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const v = pts[i], m = mid(v, pts[(i + 1) % n]); q.quadraticCurveTo(v[0], v[1], m[0], m[1]); }
    q.closePath(); return YPATH[key] = q;
  }


  // ---------------------------------------------------------------- face under yaw: every feature is painted on the head spheroid
  // A feature at front x sits at longitude L = asin(x / R); after the turn it is at fc + R sin(L + ang) and as wide as cos(L + ang) / cos(L) of its front width; hidden beyond the horizon.
  // Past about 40 degrees the face turns a little less than the head (FACE_COMP) so the near eye and the mouth stay readable at the edge, and the face lingers a few degrees past profile.
  const FACE_COMP = .26;
  function faceAng(h) { const a = Math.abs(h); return h - sgn(h) * FACE_COMP * sstep(.6, 1.45, a) * (1 - sstep(1.75, 2.5, a)); }
  const arcPts = (cx, cy, rx, ry, a0, a1, n) => { const r = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; r.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return r; };
  const quadPts = (p0, c, p1, n) => { const r = []; for (let i = 0; i <= n; i++) { const u = i / n, a = 1 - u; r.push([a * a * p0[0] + 2 * a * u * c[0] + u * u * p1[0], a * a * p0[1] + 2 * a * u * c[1] + u * u * p1[1]]); } return r; };
  const polyP = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
  const faceR = (k, P, y) => P.mode === 'flat' ? (k.yawThick ?? Math.min(profW(P, y) * .42, 60)) : profW(P, y) * .94;   // radius of the sphere a feature at height y is painted on

  function faceYaw(o, k, t, seed, Y, P) {
    if (o.noFace) return;
    const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {});
    const er = k.er * E.wide * (o.eyeScale || 1), ex = k.eyeX, ey = k.eyeY;
    const bt = (t + seed * .37) % 4.1, blink = bt < .17 ? Math.sin(bt / .17 * PI) : 0;
    const look = o.look || [0, 0], lx = look[0] + .05 * vnoise(t * 1.1 + seed), ly = look[1] + .04 * vnoise(t * .9 + seed + 7);
    const kc = o.colors || k.c, skin = V2.rgba(V2.mix(kc[0], kc[1], .34), 1);
    const ang = faceAng(Y.h), fc = (k.shape === 'banana' ? k.face : 0) * Y.cy;
    const place = (x, y) => { const R = faceR(k, P, y), lam = Math.asin(clamp(x / R, -.96, .96)), lo = lam + ang, cz = Math.cos(lo); return { X: fc + R * Math.sin(lo), cz, sc: clamp(cz / Math.cos(lam), .1, 1.3), vis: sstep(.04, .26, cz) }; };
    const eyes = [];
    for (const side of [-1, 1]) { const pl = place(side * ex, ey); if (pl.vis > .01) eyes.push({ side, pl }); }
    eyes.sort((a, b) => a.pl.cz - b.pl.cz);   // the far eye first
    let x0 = 1e9, x1 = -1e9;
    ctx.save();
    // cheeks
    ctx.fillStyle = 'rgba(255,110,150,.30)';
    for (const side of [-1, 1]) {
      const cy = ey + er * 1.55, pl = place(side * (ex + er * .55), cy);
      if (pl.vis <= .01) continue;
      ctx.save(); ctx.globalAlpha *= pl.vis; ell(pl.X, cy, er * .78 * pl.sc, er * .42); ctx.fill(); ctx.restore();
    }
    for (const { side, pl } of eyes) { eyeYaw(o, k, E, t, side, pl, er, ey, lx, ly, blink, skin); x0 = Math.min(x0, pl.X - er * 1.45 * pl.sc); x1 = Math.max(x1, pl.X + er * 1.45 * pl.sc); }
    const mx = mouthYaw(o, k, E, Y, P, fc, ang);
    if (mx) { x0 = Math.min(x0, mx[0]); x1 = Math.max(x1, mx[1]); }
    ctx.restore();
    if (REG.on && !REG.suppress && x1 > x0) {
      const top = ey - er * 1.42 - Math.max(0, E.raise) - (o.browUp || 0) - 9;
      regLocal('face', x0, top, x1, k.mouthY + 55 * (k.mw || 26) / 26, { id: o.id || o.kind, transit: o.transit });
    }
  }

  // one eye, squeezed to `pl.sc` of its front width at x = pl.X (outlines keep their full thickness: a path built under the squeeze is stroked after the squeeze is undone)
  function eyeYaw(o, k, E, t, side, pl, er, y, lx, ly, blink, skin) {
    const eh = er * 1.15, sx = pl.sc;
    ctx.save(); ctx.globalAlpha *= pl.vis; ctx.translate(pl.X, y);
    const strokeU = (lw, style) => { ctx.save(); ctx.scale(1 / sx, 1); ctx.lineWidth = lw; ctx.strokeStyle = style; ctx.stroke(); ctx.restore(); };
    // eye white with a soft shadow under the upper lid
    ctx.save(); ctx.scale(sx, 1); ell(0, 0, er, eh); ctx.clip();
    ctx.fillStyle = V2.grad(0, -eh, 0, eh, [[0, '#f3f4fa'], [.5, '#ffffff'], [1, '#e4e6f2']]); ctx.fillRect(-er, -eh, er * 2, eh * 2);
    ctx.fillStyle = V2.grad(0, -eh, 0, -eh * .1, [[0, 'rgba(30,20,50,.34)'], [1, 'rgba(30,20,50,0)']]); ctx.fillRect(-er, -eh, er * 2, eh);
    const px = lx * er * .42, py = ly * er * .45, pr = er * .54 * E.pup;
    ctx.fillStyle = V2.radial(px, py, 0, pr, [[0, '#2a2236'], [.7, INK], [1, '#0e0b14']]); ell(px, py, pr, pr); ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, pr * .8, .25 * PI, .8 * PI); strokeU(2.6, 'rgba(140,170,255,.32)');
    ctx.fillStyle = '#fff'; ell(px - pr * .34, py - pr * .42, pr * .3, pr * .3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ell(px + pr * .36, py + pr * .34, pr * .14, pr * .14); ctx.fill();
    if (o.sparkle) { ctx.fillStyle = '#fff'; ell(px + pr * .5, py - pr * .2, pr * .1, pr * .1); ctx.fill(); ell(px - pr * .6, py + pr * .2, pr * .07, pr * .07); ctx.fill(); }
    // lids: upper (expression, blink, override) and lower (squint)
    let lid = Math.max(E.lid, blink);
    if (o.twitch && side === 1) lid = Math.max(lid, .35 + .6 * Math.abs(Math.sin(t * 38)));
    if (o.lid != null) lid = Math.max(o.lid, blink);
    const slant = (E.ang || 0) * er * .34 * (side < 0 ? 1 : -1) * (lid > 0.05 ? 1 : 0);
    if (lid > 0) {
      const ly2 = -eh + eh * 2 * lid;
      ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(-er - 3, -eh - 6); ctx.lineTo(er + 3, -eh - 6); ctx.lineTo(er + 3, ly2 - slant); ctx.quadraticCurveTo(0, ly2 + eh * .14 * (1 - lid), -er - 3, ly2 + slant); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-er, ly2 + slant); ctx.quadraticCurveTo(0, ly2 + eh * .14 * (1 - lid), er, ly2 - slant); strokeU(4, INK);
    }
    const sq = o.squint ?? (E.curve > .85 ? .12 : 0);
    if (sq > 0) {
      const ly3 = eh - eh * 2 * sq;
      ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(-er - 3, eh + 6); ctx.lineTo(-er - 3, ly3 + eh * .12); ctx.quadraticCurveTo(0, ly3 - eh * .28, er + 3, ly3 + eh * .12); ctx.lineTo(er + 3, eh + 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-er, ly3 + eh * .12); ctx.quadraticCurveTo(0, ly3 - eh * .28, er, ly3 + eh * .12); strokeU(3, INK);
    }
    ctx.restore();
    ctx.save(); ctx.scale(sx, 1); ell(0, 0, er, eh); ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.stroke();
    if (o.lashes) {   // three lashes fanning off the outer upper lid
      ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      for (const phi of [.3, .65, 1.0]) {
        const bx = side * er * Math.cos(phi) * sx, by2 = -eh * Math.sin(phi);
        ctx.beginPath(); ctx.moveTo(bx, by2); ctx.lineTo(bx + side * Math.cos(phi) * 10 * Math.max(.45, sx), by2 - Math.sin(phi) * 10); ctx.stroke();
      }
    }
    if (E.bags) { ctx.save(); ctx.scale(sx, 1); ctx.beginPath(); ctx.arc(0, eh * .95, er * .8, .15 * PI, .85 * PI); ctx.restore(); ctx.strokeStyle = 'rgba(40,20,50,.35)'; ctx.lineWidth = 3; ctx.stroke(); }
    // brow: tapered, arched, angled by the expression; it keeps its tilt and only gets shorter along its own axis
    const ang = E.asym ? (side < 0 ? E.ang : -.3) : E.ang, by = -er * 1.42 - E.raise - (o.browUp || 0);
    ctx.save(); ctx.translate(0, by); ctx.rotate(side < 0 ? ang : -ang); ctx.scale(Math.max(sx, .28), 1);
    const bw = er * .92, thI = (o.browW || 8) * 1.1, thO = (o.browW || 8) * .62, arch = E.arch ?? (E.curve > .5 ? 5 : -1);
    ctx.fillStyle = o.browColor || INK; ctx.beginPath();
    ctx.moveTo(-side * bw, -thI / 2); ctx.quadraticCurveTo(0, -arch - thI / 2, side * bw, -thO / 2); ctx.lineTo(side * bw, thO / 2); ctx.quadraticCurveTo(0, -arch + thI / 2, -side * bw, thI / 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(-side * bw, 0, thI / 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(side * bw, 0, thO / 2, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }


  // the mouth: the front outline is sampled, then mapped onto the head sphere; toward profile it morphs (point by point) into a side view that lies along the silhouette edge,
  // its outer lip overhanging the edge a few pixels so the profile reads. Lip-sync (open, spread, teeth) works at every angle.
  function mouthYaw(o, k, E, Y, P, fc, ang) {
    const aa = Math.abs(ang), vis = 1 - sstep(1.6, 1.95, aa);
    if (vis <= .01) return null;
    const ms = o.mouthState || { open: 0, spread: .5, teeth: 0 }, w = k.mw || 26, sc = w / 26;
    const open = Math.max(clamp(o.talk || 0), o.mouthOpen || 0), spread = o.mouthState ? ms.spread : .5, teethAmt = ms.teeth || 0;
    const my = k.mouthY, R = faceR(k, P, my), Rlim = profW(P, my) * .985, sd = sgn(Y.sh), pm = sstep(.95, 1.3, aa);
    let outline, type = 'line', uref = w, topY = 0, h = 0, ww = w, tongueY = 0;
    if (open > .04) {
      ww = w * (.64 + .62 * spread) + 8 * open * sc * .6; h = (7 + 46 * open) * sc * (1.1 - .3 * spread); type = 'open'; uref = ww;
      if (E.curve >= .3) { outline = quadPts([-ww, 0], [0, 5], [ww, 0], 8).concat(arcPts(0, 0, ww, h, 0, PI, 18)); tongueY = h * .8; topY = 0; }
      else if (E.curve <= -.3) { outline = arcPts(0, h * .7, ww, h * .95, 0, -PI, 18).concat(quadPts([-ww, h * .7], [0, h * .55], [ww, h * .7], 8)); tongueY = h * .62; topY = -h * .25; }
      else { outline = arcPts(0, h * .45, ww * .88, h * .62, 0, TAU, 28); tongueY = h * .9; topY = -h * .15; }
    } else if (E.o) { type = 'o'; uref = 12 * sc; outline = arcPts(0, 6 * sc, 12 * sc, 17 * sc, 0, TAU, 20); }
    else if (E.smirk) outline = quadPts([-w * .8, 2], [w * .2, 12], [w, -10], 14);
    else outline = quadPts([-w, 0], [0, E.curve * 30 * sc], [w, 0], 14);
    let v0 = 1e9, v1 = -1e9; for (const p of outline) { v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); }
    const vc = (v0 + v1) / 2, L = uref * 1.2 + 8, bump = 7 * Math.max(.7, sc), curl = type === 'open' ? 0 : E.curve * 12 * sc;
    const M = (u, v) => {
      const lam = Math.asin(clamp(u / R, -.96, .96)), lo = clamp(lam + ang, -PI / 2, PI / 2), xs = fc + R * Math.sin(lo);
      if (pm <= 0) return [xs, v];
      const d = (1 - sd * clamp(u / uref, -1, 1)) / 2, xp = fc + sd * (Rlim + bump - (bump + L) * d), vp = type === 'open' ? (v - vc) * (.62 + .8 * (1 - d)) + vc : v - curl * d * d;
      return [lerp(xs, xp, pm), lerp(v, vp, pm)];
    };
    const mp = pts => pts.map(p => M(p[0], p[1]));
    ctx.save(); ctx.translate(0, my); ctx.globalAlpha *= vis;
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pts = mp(outline);
    if (type === 'open') {
      polyP(pts); ctx.closePath(); ctx.fillStyle = V2.grad(0, topY, 0, topY + h * 1.6, [[0, '#3a0510'], [1, '#6a0f20']]); ctx.fill();
      ctx.save(); ctx.clip();
      const toothH = (4 + 9 * Math.max(teethAmt, E.curve > .5 ? .35 : 0)) * sc, ty1 = topY + Math.min(toothH, h * .34), band = [];
      for (let i = 0; i <= 8; i++) band.push(M(-ww + 2 * ww * i / 8, topY - 4));
      for (let i = 8; i >= 0; i--) band.push(M(-ww + 2 * ww * i / 8, ty1));
      polyP(band); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
      polyP(mp(arcPts(0, tongueY, ww * .6, h * .32, 0, TAU, 16))); ctx.closePath(); ctx.fillStyle = '#ff6f86'; ctx.fill();
      polyP(mp(arcPts(-ww * .15, tongueY - h * .06, ww * .22, h * .08, 0, TAU, 10))); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill();
      ctx.restore();
      polyP(pts); ctx.closePath(); ctx.stroke();
    } else if (type === 'o') { polyP(pts); ctx.closePath(); ctx.fillStyle = '#4a0716'; ctx.fill(); ctx.stroke(); }
    else { polyP(pts); ctx.stroke(); }
    ctx.restore();
    let a0 = 1e9, a1 = -1e9; for (const p of pts) { a0 = Math.min(a0, p[0]); a1 = Math.max(a1, p[0]); }
    return [a0 - 3, a1 + 3];
  }


  // ---------------------------------------------------------------- body under yaw
  const flatSx = (k, Y) => sgn(Y.cy) * lerp(k.yawMin ?? .55, 1, Math.abs(Y.cy));   // a flat sprite squeezes to yawMin of its width at profile and mirrors at the back
  function bodyYaw(o, k, t, Y, P) {
    const p = yawPath(o, k, P, Y), col = o.colors || k.c;
    topYaw(o, k, t, 'back', Y, P);
    ctx.fillStyle = bodyFill(k, col); ctx.fill(p);
    ctx.save(); ctx.clip(p);
    texYaw(o, k, t, Y, P);
    const R = Math.max(k.rx, k.ry);
    const g2 = ctx.createRadialGradient(-k.rx * .1, -k.ry * .1, R * .65, 0, 0, R * 1.08);
    g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.2)');
    ctx.fillStyle = g2; ctx.fillRect(-k.rx * 1.4, -k.ry * 1.4, k.rx * 2.8, k.ry * 2.8);
    shade(o, k, p);
    ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(25,10,20,.92)'; ctx.stroke(p);
    if (k.shape !== 'banana' && k.shape !== 'pill') {   // glossy skin: the key light does not turn with the body, so the highlights stay where they were
      const kx = V2.LIGHT.key[0], ky = V2.LIGHT.key[1], ang = Math.atan2(ky, kx) + PI / 2;
      ctx.save(); ctx.clip(p);
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(0, 0, k.rx * .93, k.ry * .93, 0, Math.atan2(ky, kx) + PI - .7, Math.atan2(ky, kx) + PI + .2); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(kx * k.rx * .52, ky * k.ry * .58); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(255,255,255,.58)'; ell(0, 0, k.rx * .2, k.ry * .085); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.36)'; ell(k.rx * .3, k.ry * .12, k.rx * .05, k.ry * .05); ctx.fill();
      ctx.restore();
    }
    // leaves, stems and crowns lag behind the body a little
    ctx.save(); const sw = (o.sway || 0) + (o.vx || 0) * -.00022 + Math.sin(t * 2.3 + (o.seed || 0)) * .012;
    ctx.translate(0, -k.ry * .8); ctx.rotate(clamp(sw, -.2, .2)); ctx.translate(0, k.ry * .8);
    topYaw(o, k, t, 'front', Y, P); ctx.restore();
  }

  // surface texture: a hand-written YAW_TEX entry maps its marks onto the sphere; any other texture is panned and squeezed (a cheap fake that never breaks)
  function texYaw(o, k, t, Y, P) {
    const fn = YAW_TEX[o.kind] || YAW_TEX[k.tex] || YAW_TEX['shape:' + k.shape];
    if (fn) fn(o, k, t, Y, P); else texFallback(o, k, t, Y, P);
  }
  function texFallback(o, k, t, Y, P) {
    if (P.mode === 'flat') { ctx.save(); ctx.scale(flatSx(k, Y), 1); drawTexture(o, k, t); ctx.restore(); return; }
    if (P.mode === 'tube') { ctx.save(); ctx.scale(Y.cy, 1); drawTexture(o, k, t); ctx.restore(); return; }
    const sx = Math.max(.5, Math.abs(Y.cy)), dx = k.rx * Y.sy * .55, step = 2 * k.rx * sx * .98;
    for (const m of [-1, 0, 1]) { ctx.save(); ctx.translate(dx + m * step * (Y.cy < 0 ? -1 : 1), 0); ctx.scale(sx, 1); drawTexture(o, k, t); ctx.restore(); }
  }

  // stems, leaves, crowns and hats turn with the head. A hand-written YAW_TOP[kind] (or the strawberry below) places each piece in 3D;
  // any other top is drawn by topSoft: a ring of leaves, a cap or a stub as it is, anything else as a sprite that turns about the stem (62 percent wide at profile, mirrored at the back)
  function topYaw(o, k, t, layer, Y, P) {
    const fn = YAW_TOP[o.kind];
    if (fn) { fn(o, k, t, layer, Y, P); return; }
    if (o.kind === 'straw') { strawTop(o, k, t, layer, Y, P); return; }
    topSoft(o, k, t, layer, Y, P);
  }
  // a leaf drawn exactly like engine.js leaf() when sx is 1, squeezed by sx about the stem, its outline keeping a constant thickness
  function leafS(x, y, ang, len, w, fill, sx, stroke = '#143d12') {
    ctx.save(); ctx.scale(sx, 1); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w, -len * .5, 0, -len); ctx.quadraticCurveTo(-w, -len * .5, 0, 0);
    ctx.fillStyle = fill; ctx.fill(); ctx.restore();
    ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke();
  }
  function strawTop(o, k, t, layer, Y, P) {
    if (layer !== 'front') return;
    const { ry } = k, gy = -ry * .86, c = Y.ch, s = Y.sh;
    const g = ctx.createLinearGradient(0, gy - 50, 0, gy + 20); g.addColorStop(0, '#7ddc5a'); g.addColorStop(1, '#2f8f2a');
    // the calyx is two fans of leaves crossed like a plus seen from above: the front fan narrows as the head turns, the side fan opens
    const fan = (sx, phase) => { for (let i = 0; i < 7; i++) { const a = -1.35 + i * .45 + phase; leafS(Math.sin(a) * 18, gy + 6, a * 1.05 + (a > 0 ? .5 : -.5), 62 - Math.abs(phase) * 30, 17, g, sx); } };
    const sA = sgn(c) * Math.max(.14, Math.abs(c)), sB = Math.abs(s);
    if (sB > .06) { if (Math.abs(c) > sB) { fan(sB, .225); fan(sA, 0); } else { fan(sA, 0); fan(sB, .225); } } else fan(sA, 0);
    ctx.fillStyle = '#3a8d2c'; rr(-6, gy - 34, 12, 30, 5); ctx.fill();
    if (o.cap === false) return;
    // the nurse cap: its silhouette is a flattened bowl, the pink band wraps round it, the cross sits on the front and slides round with the head (a plain cap from behind)
    const wc = lerp(.8, 1, Math.abs(c)), capPath = () => { ctx.beginPath(); ctx.moveTo(-62, 12); ctx.lineTo(-48, -34); ctx.quadraticCurveTo(0, -46, 48, -34); ctx.lineTo(62, 12); ctx.quadraticCurveTo(0, 22, -62, 12); };
    ctx.save(); ctx.translate(0, gy - 38); ctx.rotate(-.06);
    ctx.save(); ctx.scale(wc, 1); capPath(); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
    ctx.save(); ctx.scale(wc, 1); capPath(); ctx.restore(); ctx.save(); ctx.clip();
    ctx.fillStyle = '#ffd5de'; ctx.fillRect(-62 * wc, 0, 124 * wc, 8);
    if (c > .05) {
      const Rc = 44 * wc, cx = Rc * s, sc = c;   // a decal on the front of the cap
      ctx.fillStyle = '#e8193a'; ctx.fillRect(cx - 6 * sc, -30, 12 * sc, 28); ctx.fillRect(cx - 14 * sc, -22, 28 * sc, 12);
    } else if (c < -.05) {   // the back: a small seam where the cap is gathered
      ctx.strokeStyle = 'rgba(120,110,150,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-s * 2, -36); ctx.lineTo(-s * 4, 10); ctx.stroke();
    }
    ctx.restore(); ctx.restore();
  }


  // ---------------------------------------------------------------- legs and shoes under yaw
  // Hips sit at +-hip across the frontal axis, so after the yaw they are cos(yaw) apart; the gait still moves the feet along the screen x (planted feet stay planted: the body moves, the foot does not).
  // The far leg (the one turned away from the viewer) is drawn first and a touch darker; knees bend toward the face side in profile; shoes point where the face points and show their length.
  const LIMB_FAR = V2.rgba(V2.mix(LIMB, '#000000', .32), 1), LIMB_STEPS = Array.from({ length: 9 }, (_, i) => V2.rgba(V2.mix(LIMB, '#000000', .32 * i / 8), 1));
  const limbTone = f => LIMB_STEPS[Math.round(clamp(f) * 8)];   // 0 = lit limb, 1 = a limb turned away from us
  function legsYaw(o, k, t, Y, P, silhouette) {
    const hipY = k.shape === 'straw' ? k.ry * .7 : k.shape === 'banana' ? k.ry * .78 : k.shape === 'star' ? k.ry * .74 : k.ry * .8;
    const hx = k.hip || k.rx * .32, L = k.leg || 90, cb = Y.cy, sb = Y.sy, cx = (k.shape === 'banana' ? k.rx * .12 : 0) * cb;
    const A = o.stride || 30, fd = sb < 0 ? -1 : 1, sides = sb >= 0 ? [1, -1] : [-1, 1];
    for (const side of sides) {
      const far = side * sb > 0.02, tone = far ? sstep(.05, .35, Math.abs(sb)) : 0;   /* for yaw > 0 the right-hand leg is the far one; it darkens as the body turns */
      let fx = cx + side * hx * cb, fy = hipY + L, lift = 0;
      if (o.gait != null || o.gaitW != null) {
        const dir = o.dir || fd, cyc = (o.gaitW != null ? o.gaitW : o.gait / (o.s || 1)) / (4 * A);
        const ph = ((cyc + (side > 0 ? 0 : .5)) % 1 + 1) % 1;
        const off = ph < .5 ? A - 2 * A * (ph / .5) : -A + 2 * A * easeIO((ph - .5) / .5);
        if (o.axis === 'z') fy += dir * off * .5; else fx += dir * off;
        if (ph >= .5) lift = Math.sin((ph - .5) / .5 * PI) * 17;
      } else if (o.walk != null) {
        const a = Math.sin(o.walk + (side > 0 ? 0 : PI)) * .55; fx += Math.sin(a) * L * (Math.abs(sb) > .5 ? 1 : cb); fy = hipY + Math.cos(a) * L;
      }
      if (o.legs === 'kick') { const a = side * .5 + .35 * Math.sin(t * 22 + side * 2); fx = cx + side * hx * cb + Math.sin(a) * L * cb; fy = hipY + Math.cos(a) * L; }
      if (o.legs === 'splay') { const a = side * .55; fx = cx + side * hx * cb + Math.sin(a) * L * cb; fy = hipY + Math.cos(a) * L; }
      if (o.legs === 'tap' && side > 0) lift = Math.max(0, Math.sin(t * 16)) * 11;
      if (!o.walk && o.gait == null && !o.legs) fx += Math.sin(t * .9 + (o.seed || 0)) * 1.2 * side + fd * (far ? -6 : 5) * Math.abs(sb);   /* idle weight shift; standing in profile one foot is a little ahead of the other */
      fy -= lift;
      const hipx = cx + side * hx * cb, kneeX = side * (4 + lift * .3) * Math.abs(cb) + fd * (3 + lift * .3) * Math.abs(sb);
      const Pt = [[hipx, hipY - 12], [(hipx + fx) / 2 + kneeX, (hipY + fy) / 2], [fx, fy - 6]];
      if (!silhouette) { limb(Pt, [16, 13.5, 12], limbTone(tone)); shoeYaw(o, k, side, fx, fy, lift, Y, tone); }
      else {
        ctx.strokeStyle = LIMB; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...Pt[0]); ctx.lineTo(...Pt[2]); ctx.stroke();
        const a = lerp(27, 33, Math.abs(sb)); ctx.fillStyle = k.shoe || '#fff'; ell(fx + (side * 8 + 6) * cb + fd * 8 * Math.abs(sb), fy + 3, a, 14); ctx.fill();
      }
    }
  }
  function shoeYaw(o, k, side, fx, fy, lift, Y, tone) {
    const cb = Y.cy, sb = Y.sy, ab = Math.abs(sb), fd = sb < 0 ? -1 : 1;
    const a = lerp(27.5, 33.5, ab), cxs = fx + (side * 8 + 6) * cb + fd * 8 * ab;
    let c1 = k.shoe || '#fff', c2 = k.shoe2 || '#ddd';
    if (tone > .01) { c1 = V2.mix(c1, '#3c3c52', .34 * tone); c2 = V2.mix(c2, '#3c3c52', .34 * tone); }
    const cs = c => typeof c === 'string' ? c : V2.rgba(c, 1);
    ctx.save(); ctx.translate(cxs, fy + 3); ctx.rotate((side * .06 - lift * .004 * side) * Math.abs(cb) - fd * lift * .006 * ab);
    ctx.fillStyle = cs(c2); ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.ellipse(0, 6, a + .5, 8.5, 0, 0, TAU); ctx.fill(); ctx.stroke();   // sole
    ctx.fillStyle = V2.grad(0, -14, 0, 12, [[0, cs(c1)], [1, V2.rgba(V2.mix(c1, '#6a6a80', .28), 1)]]);
    ctx.beginPath(); ctx.ellipse(0, 0, a, 14.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(-8 * (1 - ab) - fd * 6 * ab, -6, 11, 3.8); ctx.fill();
    if (cb > -.3) {   // the toe-cap seam: on the outer side from the front, at the toe from the side; a heel from behind
      ctx.save(); ctx.strokeStyle = 'rgba(30,20,40,.35)'; ctx.lineWidth = 2.4;
      const sx = lerp(side * 14, fd * (a - 14), ab); ctx.beginPath(); ctx.arc(sx, 1, 10, sx < 0 ? PI - 1.1 : -1.1, sx < 0 ? PI + 1.1 : 1.1); ctx.stroke(); ctx.restore();
    } else { ctx.fillStyle = 'rgba(30,20,40,.25)'; ell(0, 3, a * .5, 9); ctx.fill(); }
    if (o.kind === 'straw') { ctx.fillStyle = 'rgba(0,0,0,.25)'; for (const dx of [-8, 2, 12]) { ell(dx * (1 - ab * .3) * (cb < 0 ? -1 : 1) + fd * ab * 4, -1, 2.5, 2.5); ctx.fill(); } }
    ctx.restore();
  }

  // ---------------------------------------------------------------- arms under yaw
  // Shoulders sit at +-90 degrees of longitude: x = shoulderX cos(yaw), depth = -shoulderX sin(yaw) (the arm on the side the face turns away from is the far one, drawn before the body).
  // Poses are frontal-plane angles; for a yaw they foreshorten (x by cos), the gesture poses twist toward the face side (POSE_TWIST, o.armTwist), and a forward / back swing axis (o.swingZ, automatic for walkers) swings along the walk.
  const FWD_POSE = { hold: 1, phone: 1, point: 1, offer: 1, stop: 1, reach: 1, thumb: 1, shrug: 1 };
  const POSE_TWIST = { hips: [-.6, .9], point: 1, reach: 1, offer: 1, stop: 1, thumb: .6, phone: .8, shrug: .5, wave: .7, up: .3, cheer: 0, hold: .5, flail: .3, run: .8, rest: 0, down: 0 };
  function armGeom(o, k, t, side, Y, P) {
    const A = o.arms || {}, key = side < 0 ? 'l' : 'r', pose = A[key] || 'rest';
    if (pose === 'none') return null;
    const scale = o.armScale || 1.12, [sx0, sy] = shoulder(k, side), cb = Y.cy, sb = Y.sy, fd = sb < 0 ? -1 : 1;
    const sxw = sx0 * cb, near = sx0 * sb < 0 || Math.abs(sb) < .02, L1 = (k.arm1 || 56) * scale, L2 = (k.arm2 || 52) * scale;
    const grip = o.grip && o.grip[key];
    let sol;
    if (grip) {
      const bend = Math.abs(cb) > .25 ? -side * sgn(cb) : fd;
      sol = ik2(sxw, sy, grip[0], grip[1], L1, L2, bend, `${o.id || o.kind} ${key} arm`);
    } else {
      const [a1, a2] = poseAngles(pose, t + (side > 0 ? .5 : 0));
      // twist (gesture poses reach toward the face side) and swing (forward / back along the walk)
      let tw0 = o.armTwist != null ? (typeof o.armTwist === 'object' && !Array.isArray(o.armTwist) ? o.armTwist[key] ?? 0 : o.armTwist) : (typeof pose === 'string' ? POSE_TWIST[pose] ?? 0 : sstep(.5, 1.4, a1) * .8);
      const tw1 = Array.isArray(tw0) ? tw0[1] : tw0; if (Array.isArray(tw0)) tw0 = tw0[0];   // a pair twists the upper arm and the forearm differently (hands on the hips: the elbow goes back, the hand comes forward again)
      const psi = tw0 * Math.abs(sb) * PI / 2, psi2 = tw1 * Math.abs(sb) * PI / 2;
      let b1 = 0, b2 = 0;
      const sz = o.swingZ != null ? (typeof o.swingZ === 'number' ? o.swingZ : o.swingZ[key] ?? 0) : null;
      if (sz != null) { b1 = sz; b2 = sz + (sz > 0 ? .3 * sz : 0) + .12; }
      else if ((o.gait != null || o.gaitW != null) && (pose === 'rest' || pose === 'down')) {
        const A2 = o.stride || 30, cyc = (o.gaitW != null ? o.gaitW : o.gait / (o.s || 1)) / (4 * A2), ph = ((cyc + (side > 0 ? 0 : .5)) % 1 + 1) % 1;
        const off = ph < .5 ? A2 - 2 * A2 * (ph / .5) : -A2 + 2 * A2 * easeIO((ph - .5) / .5);
        const amp = (o.armSwing ?? .62) * sstep(.15, .9, Math.abs(sb)), dr = (o.dir || fd) * fd;
        b1 = -amp * off / A2 * dr; b2 = b1 + amp * (.35 + .25 * (b1 / Math.max(.01, amp)));
      }
      const dirOf = (a, b, ps) => {
        const xl = side * Math.sin(a), yl = Math.cos(a) * Math.cos(b), zl = Math.cos(a) * Math.sin(b) + Math.abs(xl) * Math.sin(ps);
        return [xl * Math.cos(ps) * cb + zl * sb, yl];
      };
      const d1 = dirOf(a1, b1, psi), d2 = dirOf(a1 + a2, b2, psi2);
      const ex = sxw + d1[0] * L1, ey = sy + d1[1] * L1;
      sol = { ex, ey, hx: ex + d2[0] * L2, hy: ey + d2[1] * L2 };
    }
    const ssd = Math.abs(sxw) > 6 ? sgn(sxw) : (near ? -fd : fd);
    const fwd = !!grip || (typeof pose === 'string' && FWD_POSE[pose]);   // an arm held out in front of the body is behind the body when the back is turned to us
    return { side, key, pose, sx: sxw, sy, sol, near, tone: near ? 0 : sstep(.05, .35, Math.abs(sb)), flip: ssd < 0, front: near ? 1 : 1 - sstep(.08, .28, Math.abs(sb)), behindW: fwd ? sstep(.05, -.3, cb) : 0 };
  }
  function armDraw(o, k, t, g, alpha) {
    const { side, key, pose, sx, sy, sol } = g;
    ctx.save(); if (alpha < 1) ctx.globalAlpha *= alpha;
    const wid = [17, 14.5, 12.5];
    limb([[sx, sy], [sol.ex, sol.ey], [sol.hx, sol.hy]], wid, limbTone(g.tone));
    ctx.fillStyle = V2.rgba(V2.mix('#3a3342', '#27222f', g.tone), 1); ell(sx, sy, 9.5, 9.5); ctx.fill();   // shoulder cap hides the join with the body
    const prop = o.hold && o.hold[key];
    const hx = sol.hx, hy = sol.hy, ang = Math.atan2(hy - sol.ey, hx - sol.ex);
    if (prop) {
      drawProp(prop, hx, hy, side, o, t);
      const e = typeof PROP_BOX[prop] === 'function' ? PROP_BOX[prop](o) : PROP_BOX[prop];
      if (e && REG.on && !REG.suppress && alpha >= 1) {
        const [a, b, c, d] = e, x0 = side < 0 && e.mirror ? -c : a, x1 = side < 0 && e.mirror ? -a : c;
        regLocal('prop', hx + x0, hy + b, hx + x1, hy + d, { id: prop, owner: o.id || o.kind, nearFace: e.nearFace, transit: o.transit });
      }
    }
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang); if (g.flip) ctx.scale(1, -1);
    ctx.fillStyle = V2.rgba(V2.mix('#4a4258', '#2e2a38', g.tone), 1); ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
    hand((o.hand && o.hand[key]) || (prop ? 'grip' : HAND[pose] || 'open'), side, o);
    ctx.restore(); ctx.restore();
  }


  // ---------------------------------------------------------------- accessories under yaw
  // Each accessory has a class: 'face' (on the face: turns with the head, hidden when the face turns away), 'head' (hats and hair: turns with the head), 'wrap' (clothes), anything else is dressing on the chest (turns with the body, hidden behind it).
  // A hand-written YAW_ACC[name] = (o, k, t, layer, yaw, Y, P) => {...} replaces the generic fallback (a pan and a squeeze); give it .cls = 'face' | 'head' | 'chest' | 'wrap' to say which yaw it is handed.
  const ACC_CLS = {
    glasses: 'face', readers: 'face', sunglasses: 'face', mustache: 'face', cannula: 'face', mask: 'face', toothpick: 'face', sweat: 'face', tears: 'face', whitebrows: 'face', sleepmask: 'face', bandage: 'face', bandage7: 'face', visor: 'face',
    fp13_specs: 'face', fp14_specs: 'face', fp14_stbrow: 'face', fp14_kqface: 'face', fp13_wrinkles: 'face', fp13_tear: 'face', fp13_shut: 'face', fp14_sauce: 'face', cucumbers: 'face', shades9: 'face', cuke9: 'face', cuke11: 'face', tears10: 'face',
    curlers: 'head', bun: 'head', bouffant: 'head', fedora: 'head', santa: 'head', partyhat: 'head', partyhat10: 'head', halo: 'head', newsboy: 'head', nightcap: 'head', wolfears: 'head', statecap: 'head', headmirror: 'head', sunglassesHead: 'head', jam: 'head', firehelmet: 'head', fp13_cap: 'head', fp14_cap: 'head', turban9: 'head', airpods: 'head',
    suit: 'wrap', cardigan: 'wrap', firecoat: 'wrap', gown: 'wrap', vestknit: 'wrap', fp13_scrubs: 'wrap', suspenders: 'wrap', peeled: 'wrap', gaitbelt: 'wrap', gaitbelt7: 'wrap', robe9: 'wrap', excoat11: 'wrap',
  };
  Object.assign(ACC_CLS, { badge: 'decal', badge7: 'decal', unionpin: 'decal', unionpin7: 'decal', perdiem: 'decal', perdiem9: 'decal', nametag: 'decal', nametag9: 'decal', agency: 'decal', pricetag: 'decal', keys: 'decal', keys7: 'decal', rose: 'decal',
    bandage: 'fdecal', bandage7: 'fdecal', partyhat: 'fdecal', partyhat10: 'fdecal' });
  const nameW = o => { ctx.font = '900 15px Nunito'; return Math.max(88, ctx.measureText(o.tag || 'ADMIN').width + 18); };
  const ACC_W = { nametag9: nameW, nametag: nameW, badge: 44, badge7: 40, perdiem9: 60, perdiem: 60, unionpin: 30, unionpin7: 30, agency: 68, pricetag: 40, rose: 24, keys: 40, keys7: 40, bandage: 58, bandage7: 52, partyhat: 60, partyhat10: 60 };   // front width of each patch, so its two ends can be mapped
  const ONE_ACC = {};
  function accYaw(o, k, t, layer, Y, P) {
    const list = o.acc;
    if (!list || !list.length) return;
    const fx = k.shape === 'banana' ? k.face : 0;
    for (let i = 0; i < list.length; i++) { ctx.save(); try { accOne(list[i], o, k, t, layer, Y, P, fx); } finally { ctx.restore(); } }
  }
  function accOne(a, o, k, t, layer, Y, P, fx) {
    const ov = YAW_ACC[a], cls = (ov && ov.cls) || ACC_CLS[a] || 'chest';
    if (ov) { ctx.translate(fx * Y.cy, 0); ov(o, k, t, layer, cls === 'face' || cls === 'head' || cls === 'fdecal' ? Y.h : Y.y, Y, P); return; }
    const keep = o.acc; o.acc = ONE_ACC[a] || (ONE_ACC[a] = [a]);   /* drawAcc draws exactly the accessory named in o.acc: hand it just this one */
    const f0 = FLIP;
    try {
      if (cls === 'decal' || cls === 'fdecal') {   // a patch on the skin or the chest: its first translate() is its anchor, which is moved to where that spot of the sphere has turned to; the patch is squeezed to match
        const yw = cls === 'fdecal' ? faceAng(Y.h) : Y.y, cx = ctx, saveT = cx.translate;
        let first = true, skipped = false;
        cx.translate = function (x, y) {
          if (!skipped && x === fx && y === 0) { skipped = true; return saveT.call(cx, x, y); }   /* drawAcc's own offset for a banana's face */
          if (!first) return saveT.call(cx, x, y);
          first = false;
          const Rs = profW(P, y), R = Math.max(10, cls === 'fdecal' ? faceR(k, P, k.eyeY) : Rs * .94);
          if (cls === 'decal' && Math.abs(x) > Rs * .94) {   // hangs off the body (a key ring at the hip): it swings round the axis like a point on a disc, it is not painted on the skin
            const dep = -x * Math.sin(yw), X = x * Math.cos(yw);
            if (dep < 0 && Math.abs(X) < Rs * .92) cx.globalAlpha *= 0;   /* behind the body */
            saveT.call(cx, fx * Y.cy - fx + X, y); return;
          }
          // the patch is moved to where that spot of the sphere has turned to and squeezed by the foreshortening; a wide label is then kept inside the silhouette (it wraps round the curve instead of sticking out past the edge)
          const lam = Math.asin(clamp(x / R, -.96, .96)), lo = lam + yw, c = Math.cos(lo), vis = sstep(.1, .36, c), sc = clamp(c / Math.cos(lam), .12, 1.3);
          const w = typeof ACC_W[a] === 'function' ? ACC_W[a](o) : ACC_W[a] || 40, lim = Rs * .97 - w * .5 * sc;
          let Xc = R * Math.sin(lo); if (lim > 0 && Math.abs(x) + w * .5 <= Rs * .97) Xc = clamp(Xc, -lim, lim);   /* only a label that sits inside the silhouette at the front is kept inside */
          cx.globalAlpha *= vis; saveT.call(cx, fx * Y.cy - fx + Xc, y); cx.scale(sc, 1);
        };
        try { drawAcc(o, k, t, layer); } finally { delete cx.translate; }
        return;
      }
      if (cls === 'face') {
        const ang = faceAng(Y.h), c = Math.cos(ang), R = faceR(k, P, k.eyeY), vis = sstep(.04, .26, c);
        if (vis <= .01) return;
        ctx.globalAlpha *= vis; ctx.translate(fx * Y.cy + R * Math.sin(ang) - fx, 0); ctx.scale(clamp(c, .12, 1), 1);
      } else if (cls === 'head') {
        const c = Y.ch, sx = sgn(c) * Math.max(.6, Math.abs(c)); ctx.scale(sx, 1); if (sx < 0) FLIP = !FLIP;   /* lettering on the back of a hat reads the right way round */
      } else if (cls === 'wrap') {
        ctx.translate(.35 * profW(P, k.ry * .3) * Y.sy, 0);
      } else {
        const c = Y.cy, R = profW(P, k.ry * .3) * .9, vis = sstep(.04, .26, c);
        if (vis <= .01) return;
        ctx.globalAlpha *= vis; ctx.translate(R * Y.sy * .9, 0); ctx.scale(clamp(c, .12, 1), 1);
      }
      drawAcc(o, k, t, layer);
    } finally { o.acc = keep; FLIP = f0; }
  }

  // ---------------------------------------------------------------- the entry point for a turned character
  function reflectionYaw(o, k, s, lift, t, Y, P) {
    const g = reflCtx, prev = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 1100, 560);
    g.translate(550, 4); g.scale(s, -s);
    ctx = g;
    const legLen = o.noLegs ? 0 : (k.leg || 90);
    g.translate(0, -(legLen + k.ry * .9) - lift / s);
    if (o.flip) g.scale(-1, 1);
    g.fillStyle = bodyFill(k, o.colors || k.c); g.fill(yawPath(o, k, P, Y));
    legsYaw(o, k, t, Y, P, true);
    ctx = prev;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in';
    const f = g.createLinearGradient(0, 0, 0, 240 * Math.max(.6, s)); f.addColorStop(0, 'rgba(0,0,0,.28)'); f.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = f; g.fillRect(0, 0, 1100, 560); g.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha *= o.reflectA ?? 1; ctx.drawImage(reflCv, -550, 0); ctx.restore();
  }
  function drawCharYaw(o, Y) {
    const k = KINDS[o.kind], s = o.s || 1, t = o.t ?? T;
    if (window.__REC && !o.noLegs && !o.noFoley && (o.gaitW != null || o.gait != null)) {
      const p = ctx.getTransform().transformPoint(new DOMPoint(o.x, o.y));
      window.__REC.push({ key: o.kind + ':' + (o.id || ''), cyc: (o.gaitW != null ? o.gaitW : o.gait / (o.s || 1)) / (4 * (o.stride || 30)), x: p.x, y: p.y, s: s * ctx.getTransform().a });
    }
    const ms = o.who ? mouthState(o.who) : null;
    if (ms) { o.mouthState = ms; if (o.talk == null) o.talk = ms.open; }
    const seed = o.seed ?? (o.kind.charCodeAt(0) * 13 + o.kind.length * 7);
    const legLen = o.noLegs ? 0 : (k.leg || 90), lift = o.lift || 0, P = profile(o, k);
    M0 = ctx.getTransform();
    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.filter) ctx.filter = o.filter;
    if (!o.noShadow && !o.noLegs && !o.center) floorShadow(o, k, s, lift);
    if (V2.opts.reflect && !o.noReflect && !o.noLegs && !o.center) reflectionYaw(o, k, s, lift, t, Y, P);
    ctx.translate(0, -lift);
    ctx.scale(s, s);
    const walkBob = (o.gait != null || o.gaitW != null) ? -Math.abs(Math.sin((o.gaitW != null ? o.gaitW : o.gait / s) / (2 * (o.stride || 30)) * PI)) * 7 : o.walk != null ? -Math.abs(Math.sin(o.walk)) * 9 : 0;
    const bob = o.noBob ? 0 : Math.sin(t * 2.6 + seed) * 2.2 + walkBob;
    if (!o.center) ctx.translate(0, -(legLen + k.ry * .9) + bob); else ctx.translate(0, bob);
    const lean = clamp((o.vx || 0) * .00007, -.09, .09);
    if (o.rot || lean) ctx.rotate((o.rot || 0) + lean);
    if (o.shake) ctx.translate(o.shake * vnoise(t * 50 + seed), o.shake * vnoise(t * 47 + seed + 9));
    const sq = o.squash || 0, emph = o.who ? 1 + .03 * (o.talk || 0) : 1, breathe = 1 + .006 * Math.sin(t * 2.2 + seed);
    if (o.plant && sq && !o.center) ctx.translate(0, (legLen + k.ry * .9) * sq * .35);
    ctx.scale((o.flip ? -1 : 1) * (1 + sq * .35) * (o.sx || 1), (1 - sq * .35) * (o.sy || 1) * emph * breathe);
    FLIP = !!o.flip;
    if (REG.on && !REG.suppress) {
      const id = o.id || o.kind, top = -headTop(o, k), bot = o.noLegs ? k.ry : k.ry * .8 + legLen + 22;
      const faceTop = k.eyeY - k.er * 2.9;
      regLocal('body', -k.rx * 1.08, top, k.rx * 1.08, bot, { id, transit: o.transit });
      if (!o.noFace) regLocal('head', -k.rx * .9, top, k.rx * .9, faceTop, { id, transit: o.transit });
    }
    if (!o.noLegs) legsYaw(o, k, t, Y, P);
    const geoms = o.noArms ? [] : [-1, 1].map(sd => armGeom(o, k, t, sd, Y, P)).filter(Boolean);
    for (const g of geoms) if (!g.near || g.behindW > 0) armDraw(o, k, t, g, 1);   // the far arm hangs behind the body (so does an arm held out in front of it, once the back is turned)
    accYaw(o, k, t, 'back', Y, P);
    bodyYaw(o, k, t, Y, P);
    accYaw(o, k, t, 'mid', Y, P);
    faceYaw(o, k, t, seed, Y, P);
    accYaw(o, k, t, 'front', Y, P);
    for (const g of geoms) { const a = (g.near ? 1 : g.front) * (1 - g.behindW); if (a > .01 && !(g.behindW > 0 && !g.near && false)) armDraw(o, k, t, g, a); }   // near arms in front; a far arm eases behind the body between 5 and 16 degrees of yaw
    FLIP = false;
    ctx.restore();
  }


  // ---------------------------------------------------------------- skin textures painted on the sphere
  // A mark at front (x, y) sits at longitude asin(x / R) and gets a twin on the far side, so the whole fruit is covered as it turns; its width is cos of its longitude after the turn. The patch of skin under the face (the old art leaves it bare) follows the head.
  const faceZone = (k, P, Y, wx = .63, wy = .45, dy = 22) => {
    const ang = faceAng(Y.h); if (Math.abs(ang) > 1.95) return null;
    const c = Math.max(.3, Math.cos(ang)), y = k.eyeY + dy;
    return { cx: faceR(k, P, y) * Math.sin(ang), cy: y, ax: k.rx * wx * c, ay: k.ry * wy };
  };
  const inZone = (z, x, y) => z && Math.hypot((x - z.cx) / z.ax, (y - z.cy) / z.ay) < 1;
  // every mark i of a front generator, on both sides of the sphere: fn(X, y, cz, i, x, y0) for each one that is visible and not under the face
  function scatterSkin(P, k, Y, n, gen, zone, fn) {
    for (let i = 0; i < n; i++) {
      const [x, y] = gen(i), R = profW(P, y);
      if (Math.abs(x) >= R * .98) continue;
      const lam = Math.asin(x / R);
      for (let b = 0; b < 2; b++) {
        const lo = (b ? PI - lam : lam) + Y.y, cz = Math.cos(lo);
        if (cz < .06) continue;
        const X = R * Math.sin(lo);
        if (inZone(zone, X, y)) continue;
        fn(X, y, cz, i, b);
      }
    }
  }
  YAW_TEX['shape:straw'] = (o, k, t, Y, P) => {
    if (P.mode !== 'sym') return texFallback(o, k, t, Y, P);
    const z = faceZone(k, P, Y, .62, .44, 22), w = sstep(0, .5, Math.abs(Y.y));   // w 0: the flat lattice of the front art (so a turn begins without a jump), w 1: equal arc length on the sphere
    ctx.fillStyle = '#ffe58a'; ctx.strokeStyle = 'rgba(120,70,0,.6)'; ctx.lineWidth = 1.5;
    for (let row = 0; row < 10; row++) {
      const y = -k.ry * .8 + row * 29, R = profW(P, y), N = Math.max(6, Math.round(TAU * R / 29)), st = row % 2 ? 14 / 29 : 0;
      for (let i = 0; i < N; i++) {
        const m = i <= N / 2 ? i : i - N, lamOld = Math.asin(clamp((m + st) * 29 / R, -1, 1)), lamNew = (m + st) * TAU / N;
        const lo = lerp(lamOld, lamNew, w) + Y.y, cz = Math.cos(lo);
        if (cz < .08) continue;
        const X = R * Math.sin(lo);
        if (inZone(z, X, y)) continue;
        ell(X, y, 4 * lerp(1, Math.max(cz, .3), w), 6.5); ctx.fill(); ctx.stroke();
      }
    }
  };
  const dotsTex = (n, off, fillFn, r, wx, wy, dy) => (o, k, t, Y, P) => {
    if (P.mode !== 'sym') return texFallback(o, k, t, Y, P);
    scatterSkin(P, k, Y, n, i => [(srand(i) * 2 - 1) * k.rx, (srand(i + off) * 2 - 1) * k.ry], wx ? faceZone(k, P, Y, wx, wy, dy) : null, (X, y, cz, i) => { ctx.fillStyle = fillFn(i); ell(X, y, r * Math.max(cz, .3), r); ctx.fill(); });
  };
  YAW_TEX['shape:lemon'] = dotsTex(90, 99, () => 'rgba(150,110,0,.18)', 2.6, 0);   /* the front art of these two leaves no bare patch under the face */
  YAW_TEX['shape:gfruit'] = dotsTex(90, 99, () => 'rgba(150,40,20,.16)', 2.6, 0);
  YAW_TEX.peel = dotsTex(170, 400, i => i % 5 ? 'rgba(170,70,0,.22)' : 'rgba(255,230,170,.35)', 2.6, .64, .46, 20);
  YAW_TEX.fuzz = (o, k, t, Y, P) => {
    if (P.mode !== 'sym') return texFallback(o, k, t, Y, P);
    ctx.lineCap = 'round'; ctx.lineWidth = 2;
    scatterSkin(P, k, Y, 220, i => [(srand(i) * 2 - 1) * k.rx, (srand(i + 300) * 2 - 1) * k.ry], faceZone(k, P, Y, .62, .44, 22), (X, y, cz, i) => {
      const a = srand(i + 700) * PI; ctx.strokeStyle = i % 4 ? 'rgba(60,38,16,.35)' : 'rgba(235,210,160,.35)';
      ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + Math.cos(a) * 8 * Math.max(cz, .3), y + Math.sin(a) * 8); ctx.stroke();
    });
  };
  YAW_TEX['shape:coco'] = (o, k, t, Y, P) => {
    if (P.mode !== 'sym') return texFallback(o, k, t, Y, P);
    ctx.lineCap = 'round'; ctx.lineWidth = 2.5;
    scatterSkin(P, k, Y, 140, i => [(srand(i) * 2 - 1) * k.rx, (srand(i + 500) * 2 - 1) * k.ry], faceZone(k, P, Y, .6, .45, 25), (X, y, cz, i) => {
      const a = srand(i + 900) * PI; ctx.strokeStyle = i % 3 ? 'rgba(40,20,5,.45)' : 'rgba(230,190,140,.35)';
      ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + Math.cos(a) * 14 * Math.max(cz, .3), y + Math.sin(a) * 14); ctx.stroke();
    });
  };
  YAW_TEX.pear = (o, k, t, Y, P) => {
    if (P.mode !== 'sym') return texFallback(o, k, t, Y, P);
    const { rx, ry } = k;
    ctx.fillStyle = 'rgba(90,70,20,.5)';
    scatterSkin(P, k, Y, 70, i => [(srand(i) * 2 - 1) * rx, (srand(i + 70) * 2 - 1) * ry], faceZone(k, P, Y, .64, .5, 20), (X, y, cz, i) => { ell(X, y, (1.7 + srand(i + 3) * 1.2) * Math.max(cz, .3), 1.4); ctx.fill(); });
    const g = ctx.createLinearGradient(0, ry * .2, 0, ry); g.addColorStop(0, 'rgba(200,120,40,0)'); g.addColorStop(1, 'rgba(200,120,40,.28)');
    ctx.fillStyle = g; ctx.fillRect(-rx * 1.2, ry * .2, rx * 2.4, ry);
  };
  // the mango: a green blush that rides round with the skin, dots, a sheen stroke
  YAW_TEX.mango = (o, k, t, Y, P) => {
    if (P.mode !== 'sym') return texFallback(o, k, t, Y, P);
    const { rx, ry } = k, R0 = rx * .95;
    for (const b of [0, 1]) {
      const lam1 = Math.asin(-.4 * rx / R0), lam2 = Math.asin(-.3 * rx / R0), s = b ? PI : 0, sg = b ? -1 : 1;
      const lo1 = (b ? PI - lam1 : lam1) + Y.y, lo2 = (b ? PI - lam2 : lam2) + Y.y, cz = Math.cos(lo2);
      if (cz < -.2) continue;
      const g = ctx.createRadialGradient(R0 * Math.sin(lo1), -ry * .85, 5, R0 * Math.sin(lo2), -ry * .6, rx * .95 * Math.max(.45, cz));
      g.addColorStop(0, 'rgba(140,190,60,.8)'); g.addColorStop(1, 'rgba(140,190,60,0)');
      ctx.save(); ctx.globalAlpha *= sstep(-.2, .35, cz); ctx.fillStyle = g; ctx.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6); ctx.restore();
    }
    ctx.fillStyle = 'rgba(120,50,10,.30)';
    scatterSkin(P, k, Y, 46, i => [(srand(i) * 2 - 1) * rx, (srand(i + 90) * 2 - 1) * ry], faceZone(k, P, Y, .64, .46, 20), (X, y, cz) => { ell(X, y, 2.2 * Math.max(cz, .4), 2.2); ctx.fill(); });
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 6; ctx.lineCap = 'round';   // the sheen stroke, sampled along its curve and mapped
    const sheen = quadPts([rx * .52, -ry * .55], [rx * .78, -ry * .1], [rx * .62, ry * .3], 12);
    for (let side = 0; side < 2; side++) {
      let started = false; ctx.beginPath();
      for (const [x, y] of sheen) {
        const R = profW(P, y), lam = Math.asin(clamp(x / R, -.98, .98)), lo = (side ? PI - lam : lam) + Y.y;
        if (Math.cos(lo) < .08) { started = false; continue; }
        const X = R * Math.sin(lo); started ? ctx.lineTo(X, y) : ctx.moveTo(X, y); started = true;
      }
      ctx.stroke();
    }
  };
  // melon netting: the old lattice nodes (so the front matches the old art), carried round the sphere; a second lattice covers the far side
  YAW_TEX.net = (o, k, t, Y, P) => {
    if (P.mode !== 'sym') return texFallback(o, k, t, Y, P);
    const z = faceZone(k, P, Y, .62, .46, 20);
    ctx.strokeStyle = 'rgba(250,236,205,.85)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    const pt = (i, j) => [i * 30 + (j % 2 ? 15 : 0) + (srand(i * 7 + j * 13) - .5) * 12, j * 26 + (srand(i * 11 + j * 5) - .5) * 10];
    const map = (x, y, b) => { const R = profW(P, y), lam = Math.asin(clamp(x / R, -.995, .995)), lo = (b ? PI - lam : lam) + Y.y, cz = Math.cos(lo); return [R * Math.sin(lo), y, cz]; };
    for (let b = 0; b < 2; b++) for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
      const [x, y] = pt(i, j); if (Math.abs(x) > k.rx * 1.02) continue;
      const A = map(x, y, b); if (A[2] < .05 || inZone(z, A[0], A[1])) continue;
      for (const [x2, y2] of [pt(i + 1, j), pt(i, j + 1)]) {
        if (Math.abs(x2) > k.rx * 1.02) continue;
        const B = map(x2, y2, b); if (B[2] < .05 || inZone(z, B[0], B[1])) continue;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo((A[0] + B[0]) / 2 + 3, (A[1] + B[1]) / 2 - 3, B[0], B[1]); ctx.stroke();
      }
    }
  };


  // ---------------------------------------------------------------- accessories that wrap round the body: necklaces, glasses, the suit
  // A loop worn round the shoulders (stethoscope, lanyard): its front half is a curve in front coordinates, mirrored, closed behind the body at height yBack. Only the half turned toward the viewer is drawn.
  function ringStroke(P, yaw, half, yBack, color, lw, cap = 'round') {
    const pts = half.map(([x, y]) => [Math.asin(clamp(Math.abs(x) / (profW(P, y) * .97), 0, .985)), y]), last = pts[pts.length - 1];
    for (let i = 1; i <= 12; i++) { const u = i / 12; pts.push([lerp(last[0], PI, u), lerp(last[1], yBack, sstep(0, 1, u))]); }   /* behind the shoulders the loop climbs to the nape, near the top of the head */
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.lineJoin = 'round';
    const nFront = half.length, ext = sstep(.03, .3, Math.abs(yaw));   // the part behind the shoulders fades in as the body turns, so the front view is exactly the old V
    for (const sd of [-1, 1]) for (let part = 0; part < 2; part++) {
      if (part && ext <= .01) continue;
      ctx.save(); if (part) ctx.globalAlpha *= ext;
      ctx.beginPath(); let on = false;
      for (let i = part ? nFront - 1 : 0; i < (part ? pts.length : nFront); i++) {
        const [lam, y] = pts[i], lo = sd * lam + yaw, cz = Math.cos(lo);
        if (cz < .03) { on = false; continue; }
        const X = profW(P, y) * .97 * Math.sin(lo); on ? ctx.lineTo(X, y) : ctx.moveTo(X, y); on = true;
      }
      ctx.stroke(); ctx.restore();
    }
  }
  // a spot of the front surface after the turn: [X, cz, scale relative to its front width], or null when it has turned out of sight
  function surf(P, yaw, x, y, R) {
    R = R || profW(P, y) * .97; const lam = Math.asin(clamp(x / R, -.985, .985)), lo = lam + yaw, cz = Math.cos(lo);
    return cz < .03 ? null : [R * Math.sin(lo), cz, cz / Math.cos(lam)];
  }
  YAW_ACC.steth = (o, k, t, layer, yaw, Y, P) => {
    if (layer !== 'front') return;
    const { rx, ry } = k;
    ringStroke(P, yaw, quadPts([-rx * .06, ry * .55], [-rx * .62, ry * .5], [-rx * .86, -ry * .08], 14), -ry * .45, '#2f3a4a', 7);
    const tail = quadPts([0, ry * .56], [-4, ry * .68], [14, ry * .74], 8).map(([x, y]) => { const s = surf(P, yaw, x, y); return s && [s[0], y]; }).filter(Boolean);
    if (tail.length > 1) { ctx.strokeStyle = '#2f3a4a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); tail.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
    const cp = surf(P, yaw, 18, ry * .77);
    if (cp) { ctx.fillStyle = '#c9d2dc'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(cp[0], ry * .77, 13 * Math.max(.25, cp[2]), 13); ctx.fill(); ctx.stroke(); }
  };
  YAW_ACC.steth.cls = 'chest';
  // the lanyard: a V strap round the neck with a few cards and keys hung at the dip (lanyard7 sits lower on the body than the engine's lanyard)
  const lanyardYaw = (xs, ys, yd, hang) => (o, k, t, layer, yaw, Y, P) => {
    if (layer !== 'front') return;
    const { rx, ry } = k;
    ringStroke(P, yaw, quadPts([0, ry * yd], [-rx * .2, ry * (yd - .06)], [-rx * xs, ry * ys], 12), -ry * .45, '#2a6fdb', 6, 'butt');
    const c = surf(P, yaw, 0, ry * hang, profW(P, ry * hang) * .97);
    if (!c) return;
    ctx.save(); ctx.translate(c[0], ry * hang); ctx.scale(c[1], 1); ctx.strokeStyle = '#c0c6cf'; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(-.5 + i * .33 + Math.sin(t * 3) * .1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 28); ctx.stroke(); ctx.fillStyle = '#d7dde5'; rr(-6, 22, 12, 16, 3); ctx.fill(); ctx.restore(); }
    ctx.restore();
  };
  YAW_ACC.lanyard7 = lanyardYaw(.7, .14, .86, .88); YAW_ACC.lanyard = lanyardYaw(.62, .08, .56, .58);
  YAW_ACC.lanyard7.cls = YAW_ACC.lanyard.cls = 'chest';
  // glasses and readers: each lens is placed like an eye (the far one narrower), a bridge between them, a temple arm running back to the near ear
  const glassesYaw = reading => (o, k, t, layer, yaw, Y, P) => {
    if (layer !== 'front') return;
    const ang = faceAng(Y.h), er = k.er, ex = k.eyeX, ey = k.eyeY, R = faceR(k, P, ey), dy = reading ? er * .7 : 0, h = er * (reading ? 1.35 : 2.2), w = er * 1.25;
    const pl = [-1, 1].map(s => { const lam = Math.asin(clamp(s * ex / R, -.96, .96)), lo = lam + ang, cz = Math.cos(lo); return { s, X: R * Math.sin(lo), cz, sc: clamp(cz / Math.cos(lam), .1, 1.3), vis: sstep(.04, .26, cz) }; });
    ctx.save(); ctx.strokeStyle = reading ? '#7a3d1a' : '#2a2a35'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const q of pl.slice().sort((a, b) => a.cz - b.cz)) {
      if (q.vis <= .01) continue;
      ctx.save(); ctx.globalAlpha *= q.vis; ctx.fillStyle = 'rgba(200,230,255,.18)';
      ctx.beginPath(); ctx.roundRect(q.X - w * q.sc, ey - er * 1.1 + dy, w * 2 * q.sc, h, Math.min(12, w * q.sc)); ctx.fill(); ctx.stroke();
      // the temple arm: from the outer top corner back along the head to the ear, only on the side whose ear is turned toward us
      const earLo = q.s * (PI / 2 - .12) + ang, ez = Math.cos(earLo);
      if (ez > .2) { ctx.globalAlpha *= sstep(.2, .45, ez); const Xe = R * Math.sin(earLo), outer = q.X + q.s * w * q.sc, len = Math.min(Math.abs(Xe - outer), er * 2.6); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(outer, ey - er * .6 + dy); ctx.lineTo(outer + Math.sign(Xe - outer) * len, ey - er * .45 + dy); ctx.stroke(); ctx.lineWidth = 5; }
      ctx.restore();
    }
    if (pl[0].vis > .3 && pl[1].vis > .3) { ctx.beginPath(); ctx.moveTo(pl[0].X + w * pl[0].sc, ey - er * .3 + dy); ctx.lineTo(pl[1].X - w * pl[1].sc, ey - er * .3 + dy); ctx.stroke(); }
    ctx.restore();
  };
  YAW_ACC.glasses = glassesYaw(false); YAW_ACC.readers = glassesYaw(true);
  YAW_ACC.glasses.cls = YAW_ACC.readers.cls = 'face';

  // the suit jacket: the cloth wraps the body whatever the angle; the shirt, lapels and tie are painted on the front and turn with it; from behind there is a centre seam and a collar
  YAW_ACC.suit = (o, k, t, layer, yaw, Y, P) => {
    if (layer !== 'mid') return;
    const { rx, ry } = k, y0 = ry * .5, by = yaw;
    ctx.save(); ctx.clip(yawPath(o, k, P, Y));
    ctx.fillStyle = o.suitColor || '#243a5e'; ctx.fillRect(-rx * 1.2, y0, rx * 2.4, ry);
    const mapP = pts => pts.map(([x, y]) => { const R = profW(P, y) * .97, lam = Math.asin(clamp(x / R, -.985, .985)), lo = clamp(lam + by, -PI / 2, PI / 2); return [R * Math.sin(lo), y]; });
    const front = Math.cos(by) > .02;
    if (front) {
      const poly = (pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); mapP(pts).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
      const seg3 = (a, b, n = 6) => { const r = []; for (let i = 0; i <= n; i++) r.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]); return r; };
      const path = (...legs) => legs.flatMap((l, i) => i ? l.slice(1) : l);
      poly(path(seg3([-rx * .3, y0 - 2], [rx * .3, y0 - 2]), seg3([rx * .3, y0 - 2], [0, ry * 1.02], 10), seg3([0, ry * 1.02], [-rx * .3, y0 - 2], 10)), '#fff');
      for (const sd of [-1, 1]) poly(path(seg3([sd * rx * .3, y0 - 2], [sd * rx * .06, ry * .98], 10), seg3([sd * rx * .06, ry * .98], [sd * rx * .5, ry * .76]), seg3([sd * rx * .5, ry * .76], [sd * rx * .3, y0 - 2], 8)), o.lapelColor || '#18294a');
      const tc = o.tieColor || '#d62828';
      poly(path(seg3([-9, y0 + 2], [9, y0 + 2], 3), seg3([9, y0 + 2], [6, y0 + 16], 3), seg3([6, y0 + 16], [-6, y0 + 16], 3), seg3([-6, y0 + 16], [-9, y0 + 2], 3)), tc);
      poly(path(seg3([-6, y0 + 16], [6, y0 + 16], 3), seg3([6, y0 + 16], [11, ry * .9], 6), seg3([11, ry * .9], [0, ry], 3), seg3([0, ry], [-11, ry * .9], 3), seg3([-11, ry * .9], [-6, y0 + 16], 6)), tc);
    }
    // the back of the jacket: a centre seam with a vent at the hem, and the collar band across the top edge (seen from behind and from the side)
    const bz = -Math.cos(by);
    if (bz > .03) {
      const R = profW(P, ry * .8) * .97, X = -R * Math.sin(by), a = sstep(.03, .3, bz);
      ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(8,16,36,.55)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(X, y0 + 12); ctx.lineTo(X * 1.02, ry * 1.02); ctx.stroke();
      ctx.fillStyle = o.lapelColor || '#18294a'; ctx.beginPath(); ctx.moveTo(X - 30 * bz, y0 - 1); ctx.lineTo(X + 30 * bz, y0 - 1); ctx.lineTo(X + 24 * bz, y0 + 13); ctx.lineTo(X - 24 * bz, y0 + 13); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  YAW_ACC.suit.cls = 'chest';


  // ---------------------------------------------------------------- Mr. Stateman (the flat starfruit) and the waist belt
  // The starfruit is a flat sprite: skin and windbreaker squeeze together; from behind the windbreaker has no zip, crest or pocket protector, just a collar, a seam and the stripe. The two sides cross-fade round profile.
  YAW_TEX.star14 = (o, k, t, Y, P) => {
    const sx = flatSx(k, Y), back = sstep(.12, -.22, Y.cy), E = EXT.tex.star14;
    ctx.save(); ctx.scale(sx, 1);
    if (back < .999) { ctx.save(); ctx.globalAlpha *= 1 - back; E(o, k, t); ctx.restore(); }
    if (back > .001) {
      ctx.save(); ctx.globalAlpha *= back;
      const o2 = Object.create(o); o2.jacket = false; E(o2, k, t);
      const y0 = 40;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.fillStyle = V2.grad(0, y0 - 6, 0, 136, [[0, '#4d73a6'], [.42, '#33527a'], [1, '#1f3554']]);
      ctx.beginPath(); ctx.moveTo(-210, y0 + 14); ctx.quadraticCurveTo(-120, y0 - 6, 0, y0 - 6); ctx.quadraticCurveTo(120, y0 - 6, 210, y0 + 14); ctx.lineTo(210, 220); ctx.lineTo(-210, 220); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1f3554'; ctx.beginPath(); ctx.moveTo(-64, y0 - 8); ctx.quadraticCurveTo(0, y0 - 14, 64, y0 - 8); ctx.lineTo(56, y0 + 10); ctx.quadraticCurveTo(0, y0 + 16, -56, y0 + 10); ctx.closePath(); ctx.fill();   /* the collar */
      ctx.strokeStyle = 'rgba(16,28,48,.55)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, y0 + 14); ctx.lineTo(0, 150); ctx.stroke();   /* the back seam */
      ctx.fillStyle = 'rgba(244,247,252,.9)'; ctx.fillRect(-210, 100, 420, 5); ctx.fillRect(-210, 109, 420, 2);
      ctx.restore();
    }
    ctx.restore();
  };
  // the waist belt (gait belt): a band right round the body, its buckle on the front only
  const beltYaw = (yf, h, bw, bx) => (o, k, t, layer, yaw, Y, P) => {
    if (layer !== 'front') return;
    ctx.save(); ctx.clip(yawPath(o, k, P, Y));
    const y0 = k.ry * yf, x0 = -k.rx * 1.2, w = k.rx * 2.4;
    ctx.fillStyle = '#f2f1ea'; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = '#2a6fdb'; ctx.fillRect(x0, y0 + (h > 28 ? 5 : 4), w, 4); ctx.fillRect(x0, y0 + h - (h > 28 ? 9 : 8), w, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, w, h);
    const s = surf(P, yaw, bx + bw / 2, y0 + h / 2);
    if (s) { ctx.globalAlpha *= sstep(.04, .3, s[1]); ctx.fillStyle = '#c9d2dc'; rr(s[0] - bw / 2 * Math.max(.2, s[2]), y0 - 4, bw * Math.max(.2, s[2]), h + 8, 6); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  };
  YAW_ACC.gaitbelt7 = beltYaw(.7, 26, 38, -34); YAW_ACC.gaitbelt = beltYaw(.38, 30, 38, -34);
  YAW_ACC.gaitbelt7.cls = YAW_ACC.gaitbelt.cls = 'chest';


  // ---------------------------------------------------------------- tops by kind, hair and straps
  // How the engine's own stems, leaves and crowns turn. 'sym': a ring of leaves, a cap, a stub: the same from every side. 'soft' (the default): a sprite that turns about the stem and narrows to 62 percent at profile.
  const TOP_SYM = { sun: 1, dragon: 1, pom: 1, persimmon: 1, kumquat: 0, 'shape:pill': 1, 'shape:capsule': 1, 'shape:lemon': 1, 'shape:prune': 1, 'shape:raisin': 1, melon: 1, grape: 1, blue: 1, cran: 1 };
  function topSoft(o, k, t, layer, Y, P) {
    const c = Y.ch, f0 = FLIP;
    if (TOP_SYM[o.kind] || TOP_SYM['shape:' + k.shape]) { drawTop(o, k, t, layer); return; }
    const sx = sgn(c) * (.62 + .38 * Math.abs(c));
    ctx.save(); ctx.scale(sx, 1); if (sx < 0) FLIP = !FLIP; drawTop(o, k, t, layer); FLIP = f0; ctx.restore();
  }
  // curlers: a row of rollers across the crown; the row turns with the head (it is a flat arc, so it narrows to 40 percent at profile and the order reverses behind)
  YAW_ACC.curlers = (o, k, t, layer, yaw) => {
    if (layer !== 'back') return;
    const cols = ['#ff8fc7', '#8fd3ff', '#fff07a', '#b7ff8f'], c = Math.cos(yaw), sx = sgn(c) * lerp(.4, 1, Math.abs(c)), order = [0, 1, 2, 3, 4].sort((a, b) => (a - 2) * -Math.sin(yaw) * Math.sign(1) - (b - 2) * -Math.sin(yaw));
    for (const i of order) {
      const x = (-60 + i * 30) * sx, y = -k.ry * .9 - 8 + Math.abs(i - 2) * 9;
      ctx.fillStyle = cols[i % 4]; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x - 14, y - 22, 28, 34, 10); ctx.fill(); ctx.stroke();
    }
  };
  YAW_ACC.curlers.cls = 'head';
  // suspenders: two straps over the shoulders in front and two behind, a belt that goes right round and a buckle on the front
  YAW_ACC.suspenders = (o, k, t, layer, yaw, Y, P) => {
    if (layer !== 'mid') return;
    const { rx, ry } = k, by = yaw;
    ctx.save(); ctx.clip(yawPath(o, k, P, Y));
    ctx.fillStyle = '#4a3b2a'; ctx.fillRect(-rx * 1.2, ry * .66, rx * 2.4, 26);
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 14; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    const lam0 = Math.asin(clamp(.74 * rx / profW(P, 0), 0, .97));
    for (const lon of [-lam0, lam0, PI - lam0, PI + lam0]) {
      const lo = lon + by, cz = Math.cos(lo); if (cz < .04) continue;
      ctx.save(); ctx.globalAlpha *= sstep(.04, .2, cz); ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const y = lerp(-ry * .55, ry * .66, i / 10), X = profW(P, y) * .97 * Math.sin(lo); i ? ctx.lineTo(X, y) : ctx.moveTo(X, y); }
      ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = '#d4af37';
    const bk = surf(P, by, 0, ry * .66 + 13); if (bk) { ctx.save(); ctx.globalAlpha *= sstep(.04, .25, bk[1]); rr(bk[0] - 12 * Math.max(.2, bk[2]), ry * .66 + 3, 24 * Math.max(.2, bk[2]), 20, 4); ctx.fill(); ctx.restore(); }
    for (const sd of [-1, 1]) { const g = surf(P, by, sd * .74 * rx, ry * .62); if (g) { ctx.save(); ctx.globalAlpha *= sstep(.04, .25, g[1]); ell(g[0], ry * .62, 8 * Math.max(.3, g[2]), 8); ctx.fill(); ctx.restore(); } }
    ctx.restore();
  };
  YAW_ACC.suspenders.cls = 'chest';

  // @@TURN-APPEND@@

  V2.validators.push(() => { const v = viol.splice(0); return v; });
  return { drawChar, mouthState, state, ik2, limb, hand, faceDir, yawToward, turnLerp, turnPair, YAW_ACC, YAW_TEX, YAW_TOP, ACC_CLS, yawInfo };
})();
