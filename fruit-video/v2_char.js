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

  V2.validators.push(() => { const v = viol.splice(0); return v; });
  return { drawChar, mouthState, state, ik2, limb, hand };
})();
