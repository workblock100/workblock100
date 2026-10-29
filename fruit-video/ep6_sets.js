'use strict';
/* Episode 6 sets: true one-point-perspective rooms and corridors built with V2.proj, lit by practical lights.
 * World units: X right, Y up, Z forward. A character at depth Z - cz = 740 is drawn at scale 1.35. */
const S6 = (() => {
  const { proj, p2, poly, quad3, grad, radial, rgba, mix } = V2;
  const HW = 330, CH0 = 700, DOOR_W = 150, DOOR_H = 430, RAIL = 108;

  // color of a surface at depth z, drifting toward the fog color with distance
  const fogAt = (base, fog, amt, z, zFar) => mix(base, fog, clamp((z - V2.P.cz) / Math.max(1, zFar - V2.P.cz)) ** .85 * amt);
  const col = c => V2.rgba(c, 1);

  // a horizontal gradient along a receding wall, with stops placed where the depth samples land on the screen
  function wallGrad(side, y, z0, z1, base, fog, amt, zFar, boost = 1) {
    const xa = proj(side * HW, y, z0)[0], xb = proj(side * HW, y, z1)[0], g = ctx.createLinearGradient(xa, 0, xb, 0);
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const z = lerp(z0, z1, i / n), x = proj(side * HW, y, z)[0], off = clamp((x - xa) / ((xb - xa) || 1));
      const c = fogAt(base, fog, amt, z, zFar).map(v => clamp(v * boost, 0, 255));
      g.addColorStop(off, col(c));
    }
    return g;
  }
  function wallRect(side, y0, y1, z0, z1, fill, stroke, lw) {
    const X = side * HW; poly([p2(X, y0, z0), p2(X, y1, z0), p2(X, y1, z1), p2(X, y0, z1)], fill, stroke, lw);
  }

  // ---------------------------------------------------------------- the hallway
  function corridor(o = {}) {
    const CH = o.ch ?? CH0;
    const z0 = V2.P.cz + 70, zFar = o.zFar ?? 7600, fog = o.fog ?? '#b4bfd0', fogAmt = o.fogAmt ?? .5;
    const wall = o.wall ?? '#e9e0cb', wain = o.wain ?? '#5c9298', floorA = o.floorA ?? '#d3c9b6', floorB = o.floorB ?? '#a89e8b', bright = o.bright ?? 1;
    const lamps = o.lamps ?? Array.from({ length: 9 }, (_, i) => 250 + i * 950), doors = o.doors ?? [];
    const [vx, vy] = p2(0, CH * .5, zFar);

    ctx.fillStyle = col(fog); ctx.fillRect(-200, -200, W + 400, H + 400);

    // ---- end wall with double doors and an exit sign
    const ew = [p2(-HW, 0, zFar), p2(HW, 0, zFar), p2(HW, CH, zFar), p2(-HW, CH, zFar)];
    poly(ew, col(fogAt(wall, fog, fogAmt, zFar, zFar)));
    if (o.endDoors !== false) {
      const dw = 120, a = p2(-dw, 0, zFar), b = p2(dw, DOOR_H, zFar);
      poly([a, [b[0], a[1]], b, [a[0], b[1]]], col(fogAt('#8a6a4a', fog, fogAmt, zFar, zFar)), 'rgba(20,12,30,.55)', 2);
      ctx.strokeStyle = 'rgba(20,12,30,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo((a[0] + b[0]) / 2, a[1]); ctx.lineTo((a[0] + b[0]) / 2, b[1]); ctx.stroke();
      const es = p2(0, DOOR_H + 52, zFar), esw = (b[0] - a[0]) * .3;
      ctx.fillStyle = '#1a6b3a'; ctx.fillRect(es[0] - esw / 2, es[1] - esw * .22, esw, esw * .44);
      ctx.fillStyle = '#9dffc0'; ctx.fillRect(es[0] - esw / 2 + 2, es[1] - esw * .22 + 2, esw - 4, esw * .44 - 4); ctx.fillStyle = '#0c4a24'; ctx.font = `900 ${esw * .26}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', es[0], es[1] + 1);
      V2.emit(es[0], es[1], 90, '120,255,170', .6);
    }

    // ---- ceiling
    const cg = ctx.createLinearGradient(0, p2(0, CH, z0)[1], 0, vy);
    cg.addColorStop(0, col(mix('#f4f4f2', fog, .05))); cg.addColorStop(1, col(fogAt('#eceae6', fog, fogAmt, zFar, zFar)));
    quad3([-HW, CH, z0], [HW, CH, z0], [HW, CH, zFar], [-HW, CH, zFar], cg);
    ctx.strokeStyle = 'rgba(80,80,90,.16)'; ctx.lineWidth = 1.5;
    for (let z = Math.ceil(z0 / 120) * 120; z < zFar; z += 120) { const a = p2(-HW, CH, z), b = p2(HW, CH, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    for (let x = -HW + 110; x < HW; x += 110) { const a = p2(x, CH, z0), b = p2(x, CH, zFar); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }

    // ---- floor: vinyl with a sheen
    const fgX = ctx.createLinearGradient(0, p2(0, 0, z0)[1], 0, vy);
    fgX.addColorStop(0, col(mix(floorA, '#ffffff', .02))); fgX.addColorStop(.5, col(fogAt(floorA, fog, fogAmt, (z0 + zFar) * .35, zFar))); fgX.addColorStop(1, col(fogAt(floorB, fog, fogAmt, zFar, zFar)));
    quad3([-HW, 0, z0], [HW, 0, z0], [HW, 0, zFar], [-HW, 0, zFar], fgX);
    ctx.save(); ctx.beginPath(); const f0 = [p2(-HW, 0, z0), p2(HW, 0, z0), p2(HW, 0, zFar), p2(-HW, 0, zFar)]; f0.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    ctx.lineWidth = 1.6;
    for (let z = Math.ceil(z0 / 110) * 110; z < zFar; z += 110) { const a = p2(-HW, 0, z), b = p2(HW, 0, z), k = clamp(1 - (z - z0) / (zFar - z0)); ctx.strokeStyle = `rgba(60,50,60,${.05 + .1 * k})`; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    for (let x = -HW + 110; x < HW; x += 110) { const a = p2(x, 0, z0), b = p2(x, 0, zFar); ctx.strokeStyle = 'rgba(60,50,60,.1)'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    // the ceiling lamps mirrored in the glossy floor: soft vertical smears centered under each lamp
    for (const z of lamps) {
      if (z < z0 + 40) continue;
      const k = V2.P.f / (z + 80 - V2.P.cz), sx = W / 2 - V2.P.cx * k, sy = V2.P.hy + (V2.P.cy + CH) * k, rh = 230 * k, rw = 120 * k;
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(sx, sy); ctx.scale(rw / rh, 1);
      ctx.fillStyle = radial(0, 0, 0, rh, [[0, `rgba(255,248,226,${.2 * bright})`], [.5, `rgba(255,248,226,${.07 * bright})`], [1, 'rgba(255,248,226,0)']]);
      ctx.beginPath(); ctx.arc(0, 0, rh, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    // pools of light on the floor under each lamp
    for (const z of lamps) {
      if (z < z0 + 40 || z > zFar) continue;
      const k = V2.P.f / (z - V2.P.cz), [cx2, cy2] = p2(0, 0, z), R = 300 * k;
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(cx2, cy2); ctx.scale(1, Math.min(.5, V2.P.cy / (z - V2.P.cz) * 1.3));
      ctx.fillStyle = radial(0, 0, 0, R, [[0, `rgba(255,246,222,${.2 * bright})`], [1, 'rgba(255,246,222,0)']]); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.restore();
    }

    // ---- side walls, far to near is implicit because each wall is one continuous surface
    for (const side of [-1, 1]) {
      const X = side * HW;
      // wall above the rail, wainscot below
      wallRect(side, RAIL, CH, z0, zFar, wallGrad(side, CH * .55, z0, zFar, wall, fog, fogAmt, zFar, bright));
      wallRect(side, 0, RAIL, z0, zFar, wallGrad(side, RAIL * .5, z0, zFar, wain, fog, fogAmt, zFar, bright));
      // a soft shadow where the wall meets the ceiling
      poly([p2(X, CH, z0), p2(X, CH - 50, z0), p2(X, CH - 50, zFar), p2(X, CH, zFar)], 'rgba(60,50,90,.16)');
      // chair rail and baseboard
      wallRect(side, RAIL - 5, RAIL + 5, z0, zFar, wallGrad(side, RAIL, z0, zFar, '#b98a5a', fog, fogAmt, zFar, bright));
      wallRect(side, 0, 24, z0, zFar, wallGrad(side, 12, z0, zFar, '#7d6a5a', fog, fogAmt, zFar, bright));
      // handrail standing off the wall, with brackets
      const hr = side * (HW - 14);
      ctx.strokeStyle = col(mix('#c99b6a', fog, .1)); ctx.lineWidth = Math.max(2, 9 * proj(HW, 0, z0 + 400)[2] * .35); ctx.lineCap = 'round';
      const a = p2(hr, RAIL + 54, z0), b = p2(hr, RAIL + 54, zFar); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,210,.35)'; ctx.lineWidth = 2; const a2 = p2(hr, RAIL + 58, z0), b2 = p2(hr, RAIL + 58, zFar); ctx.beginPath(); ctx.moveTo(...a2); ctx.lineTo(...b2); ctx.stroke();
      // framed pictures and notices between the doors
      for (const d of (o.decor ?? [])) if (d.side === side) {
        const zz = d.z, w = d.w ?? 90, y0 = d.y ?? 270, y1 = y0 + (d.h ?? 120);
        if (zz - w / 2 < z0) continue;
        wallRect(side, y0, y1, zz - w / 2, zz + w / 2, col(fogAt(d.c ?? '#d9a441', fog, fogAmt, zz, zFar)), 'rgba(40,30,30,.7)', 2.5);
        wallRect(side, y0 + 10, y1 - 10, zz - w / 2 + 8, zz + w / 2 - 8, col(fogAt(d.c2 ?? '#fff3d8', fog, fogAmt, zz, zFar)));
      }
    }
    // doors, domes and plaques, drawn far to near so closer ones overlap properly
    const sorted = doors.slice().sort((a, b) => b.z - a.z);
    for (const d of sorted) if (d.z - DOOR_W / 2 > z0) doorUnit(d, fog, fogAmt, zFar, bright);

    // ceiling light fixtures: a diffuser panel with a bright strip, a soft halo and a little bloom
    for (const [X, z] of lamps.flatMap(zz => [[-185, zz], [185, zz]])) {
      if (z < z0 + 40 || z > zFar) continue;
      const lit = (o.lampOn ?? 1), far = clamp((z - z0) / (zFar - z0));
      const pts = [p2(X - 66, CH - 2, z), p2(X + 66, CH - 2, z), p2(X + 66, CH - 2, z + 150), p2(X - 66, CH - 2, z + 150)];
      poly(pts, col(mix(lit > .5 ? '#f2f0e6' : '#9a98a0', fog, .05 + .35 * far * fogAmt)), 'rgba(110,110,125,.55)', 1.6);
      const inner = [p2(X - 50, CH - 3, z + 22), p2(X + 50, CH - 3, z + 22), p2(X + 50, CH - 3, z + 128), p2(X - 50, CH - 3, z + 128)];
      if (lit > 0) poly(inner, `rgba(255,252,238,${.55 + .35 * lit})`);
      const [lx, ly] = p2(X, CH - 2, z + 75), k = V2.P.f / (z + 75 - V2.P.cz);
      if (lit > 0) V2.emit(lx, ly, 130 * k, '255,248,226', .22 * lit * bright * clamp(k * 1.5, .1, 1));
      const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, 210 * k); gl.addColorStop(0, `rgba(255,248,226,${.16 * lit * bright * clamp(k * 1.5, .1, 1)})`); gl.addColorStop(1, 'rgba(255,248,226,0)');
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gl; ctx.fillRect(lx - 210 * k, ly - 210 * k, 420 * k, 420 * k); ctx.restore();
    }
    // ceiling clutter that makes the empty plane read as a real ceiling: sprinkler heads, vents, a sign hanging over the hall
    for (const z of (o.sprinklers ?? Array.from({ length: 9 }, (_, i) => 700 + i * 950))) {
      if (z < z0 + 40) continue;
      const [sx, sy] = p2(HW * .55, CH, z), k = V2.P.f / (z - V2.P.cz);
      ctx.fillStyle = col(mix('#d8d6d0', fog, .2)); ctx.beginPath(); ctx.ellipse(sx, sy, 12 * k, 4.2 * k, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b0382f'; ctx.beginPath(); ctx.ellipse(sx, sy + 3.2 * k, 3.2 * k, 3.6 * k, 0, 0, TAU); ctx.fill();
      const v = p2(-HW * .6, CH, z + 60), v2 = p2(-HW * .6 + 110, CH, z + 60), v3 = p2(-HW * .6 + 110, CH, z + 120), v4 = p2(-HW * .6, CH, z + 120);
      poly([v, v2, v3, v4], col(mix('#cfcdc8', fog, .25)), 'rgba(60,60,70,.4)', 1.2);
      ctx.strokeStyle = 'rgba(60,60,70,.35)'; ctx.lineWidth = 1; for (let i = 1; i < 5; i++) { const a = p2(-HW * .6 + 22 * i, CH, z + 60), b = p2(-HW * .6 + 22 * i, CH, z + 120); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    }
    // a duct run down the middle of the ceiling and wayfinding signs hung from it: detail where the frame was empty
    if (o.duct !== false) {
      const dz0 = Math.max(z0, V2.P.cz + 100), a = [p2(-48, CH - 64, dz0), p2(48, CH - 64, dz0), p2(48, CH - 64, zFar), p2(-48, CH - 64, zFar)];
      poly([p2(-48, CH, dz0), p2(-48, CH - 64, dz0), p2(-48, CH - 64, zFar), p2(-48, CH, zFar)], col(fogAt('#aeb3bb', fog, fogAmt, zFar * .5, zFar)));
      poly([p2(48, CH, dz0), p2(48, CH - 64, dz0), p2(48, CH - 64, zFar), p2(48, CH, zFar)], col(fogAt('#8d929b', fog, fogAmt, zFar * .5, zFar)));
      poly(a, grad(0, a[0][1], 0, a[2][1], [[0, col(fogAt('#c9cdd4', fog, fogAmt, dz0, zFar))], [1, col(fogAt('#b5bac2', fog, fogAmt, zFar, zFar))]]), 'rgba(40,44,52,.35)', 1.5);
      ctx.strokeStyle = 'rgba(40,44,52,.28)'; ctx.lineWidth = 1.4;
      for (let z = Math.ceil(dz0 / 260) * 260; z < zFar; z += 260) { const b1 = p2(-48, CH - 64, z), b2 = p2(48, CH - 64, z); ctx.beginPath(); ctx.moveTo(...b1); ctx.lineTo(...b2); ctx.stroke(); }
    }
    for (const sg of (o.signs ?? [])) {
      if (sg.z < z0 + 80) continue;
      const k = V2.P.f / (sg.z - V2.P.cz), [x, y] = p2(0, CH - 250, sg.z), w = 400 * k, h = 104 * k;
      ctx.strokeStyle = col(fogAt('#6c7280', fog, fogAmt, sg.z, zFar)); ctx.lineWidth = Math.max(2, 7 * k);
      for (const dx of [-.34, .34]) { const [rx, ry] = p2(dx * 400, CH - 64, sg.z); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(x + dx * w, y - h / 2); ctx.stroke(); }
      ctx.fillStyle = col(fogAt(sg.c ?? '#2a5a9a', fog, fogAmt, sg.z, zFar)); ctx.strokeStyle = 'rgba(20,16,34,.7)'; ctx.lineWidth = Math.max(2, 4 * k); ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 14 * k); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `900 ${46 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sg.text, x, y + 2 * k);
    }
  }

  // one door with frame, plaque, call-light dome and (when open) a glimpse of the lit room beyond
  function doorUnit(d, fog, fogAmt, zFar, bright) {
    const side = d.side, X = side * HW, z0 = d.z - DOOR_W / 2, z1 = d.z + DOOR_W / 2, open = d.open || 0;
    const body = fogAt(d.color ?? '#a8744f', fog, fogAmt, d.z, zFar), frame = fogAt('#e9e0cb', fog, fogAmt, d.z, zFar);
    // frame
    wallRect(side, 0, DOOR_H + 14, z0 - 12, z1 + 12, col(mix(frame, '#6b5446', .45)), 'rgba(25,18,30,.6)', 2);
    if (open > 0) {
      // the room beyond: a lit interior seen through the doorway, with a bed and a window patch
      const inter = d.room ?? '#caa86e';
      wallRect(side, 0, DOOR_H, z0, z1, col(fogAt(inter, fog, fogAmt * .6, d.z, zFar)));
      const lit = ctx.createLinearGradient(...p2(X, DOOR_H, z0), ...p2(X, 0, z1)); lit.addColorStop(0, 'rgba(255,240,200,.5)'); lit.addColorStop(1, 'rgba(255,240,200,0)');
      wallRect(side, 0, DOOR_H, z0, z1, lit);
      wallRect(side, 40, 190, z0 + 18, z1 - 18, col(fogAt('#d9e8f2', fog, fogAmt, d.z, zFar)), 'rgba(40,40,60,.35)', 1.5);   // a bed seen end-on
      wallRect(side, 190, 250, z0 + 26, z1 - 40, col(fogAt('#f5f0e6', fog, fogAmt, d.z, zFar)));
      const [gx, gy] = p2(X, DOOR_H * .45, d.z); V2.glow(gx, gy, 140 * V2.P.f / (d.z - V2.P.cz), '255,226,160', .28 * open * bright, 'screen', .4);
      // the door swung against the wall, seen edge-on
      const s0 = side * (HW - 6 - 70 * open);
      poly([p2(s0, 0, z1 + 4), p2(s0, DOOR_H, z1 + 4), p2(X, DOOR_H, z1 + 12), p2(X, 0, z1 + 12)], col(body), 'rgba(25,18,30,.65)', 2);
    } else {
      wallRect(side, 0, DOOR_H, z0, z1, col(body), 'rgba(25,18,30,.6)', 2);
      // panels and a wired-glass window
      wallRect(side, 60, 200, z0 + 18, z1 - 18, col(mix(body, '#000000', .1)), 'rgba(25,18,30,.35)', 1.5);
      wallRect(side, 260, 400, z0 + 18, z1 - 18, col(mix(body, '#000000', .1)), 'rgba(25,18,30,.35)', 1.5);
      wallRect(side, 214, 232, z1 - 34, z1 - 22, '#d8d2c6');   // lever handle
      if (d.glow) { const [gx, gy] = p2(X, 250, d.z); V2.glow(gx, gy, 170 * V2.P.f / (d.z - V2.P.cz), d.glow, .2 * bright, 'screen', .3); }
    }
    // plaque
    const pz = z1 + 32;
    wallRect(side, 330, 392, pz - 22, pz + 22, col(fogAt('#f2ede0', fog, fogAmt, d.z, zFar)), 'rgba(40,30,30,.7)', 1.6);
    const [px, py] = p2(X, 361, pz), pk = V2.P.f / (pz - V2.P.cz);
    if (pk > .35) { ctx.fillStyle = '#2b2530'; ctx.font = `900 ${32 * pk * .5}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.n || '', px, py + 1); }
    // call-light dome above the door
    const dz0 = d.z - 66, dz1 = d.z + 66, dy0 = 440, dy1 = 516;
    const on = d.dome ? d.dome[1] : 0, dc = d.dome ? d.dome[0] : '255,255,255';
    wallRect(side, dy0, dy1, dz0, dz1, on > 0 ? `rgba(${dc},${.35 + .65 * on})` : col(fogAt('#d7dbe0', fog, fogAmt, d.z, zFar)), 'rgba(30,24,40,.7)', 2);
    if (on > 0) {
      const [cx2, cy2] = p2(X, (dy0 + dy1) / 2, d.z), k = V2.P.f / (d.z - V2.P.cz);
      V2.glow(cx2, cy2, 440 * k * (.6 + .6 * on), dc, .95 * on * bright * clamp(k * 1.9, .2, 1), 'screen', 1.2);
      // light spills down the wall and onto the floor
      const [fx, fy] = p2(X * .92, 0, d.z); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(fx, fy); ctx.scale(1, Math.min(.4, V2.P.cy / (d.z - V2.P.cz)));
      ctx.fillStyle = radial(0, 0, 0, 190 * k, [[0, `rgba(${dc},${.34 * on})`], [1, `rgba(${dc},0)`]]); ctx.beginPath(); ctx.arc(0, 0, 190 * k, 0, TAU); ctx.fill(); ctx.restore();
      // vertical streak reflected in the glossy floor
      const rx = p2(X * .94, -(dy0 + dy1) / 2, d.z); ctx.save(); ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = grad(rx[0], rx[1] - 120 * k, rx[0], rx[1] + 150 * k, [[0, `rgba(${dc},0)`], [.3, `rgba(${dc},${.34 * on})`], [1, `rgba(${dc},0)`]]);
      ctx.fillRect(rx[0] - 22 * k, rx[1] - 120 * k, 44 * k, 270 * k); ctx.restore();
    }
  }

  return { corridor, HW, CH: CH0, DOOR_W, DOOR_H, RAIL, fogAt, wallRect };
})();
window.S6 = S6;
