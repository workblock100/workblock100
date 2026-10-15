'use strict';
/* Episode 7 sets, built on the Episode 6 perspective kit (S6): a bright afternoon parking lot with a pale Moon in the sky, a front-on
 * nurses' station with a whiteboard and an hours-since-the-Q-word sign, the activity room at bingo hour, and a resident's room with a
 * big window for the Moon to rise in. Plus the props they need: a taxi, a wheelchair, a bingo flashboard.
 * World units: X right, Y up, Z forward, exactly as S6; V2.at(X, Z) places a character. */
const S7 = (() => {
  const { proj, p2, poly, quad3, grad, radial, rgba, mix } = V2;
  const S6 = window.S6, A7 = window.A7;
  const { box3, shell, ceilingLamp, chair3, table3, plant3, wallClock, onZ, kz, lit } = S6;
  const ink = 'rgba(25,16,30,.62)';
  const hexc = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const litH = (c, f) => hexc(V2.rgb(c).map(v => v * f));   // like S6.lit, but a color that V2.mix (the fog) can read back
  const box = b => { const base = b.color ?? '#b8946a'; return box3(Object.assign({ top: litH(base, 1.14), side: litH(base, .78), front: base }, b)); };

  // a soft contact shadow on the ground under a footprint (screen space ellipse from a world rectangle)
  function groundShadow(x0, x1, z0, z1, a = .3, dx = 40) {
    const [ax, ay] = p2(x0 + dx, 0, z0), [bx, by] = p2(x1 + dx, 0, z1), cx = (ax + bx) / 2, cy = (ay + by) / 2, rx = Math.abs(bx - ax) / 2 * 1.08, ry = Math.abs(by - ay) / 2 * 1.2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, Math.max(.05, ry / Math.max(1, rx)));
    ctx.fillStyle = radial(0, 0, 0, rx, [[0, `rgba(20,24,44,${a})`], [.7, `rgba(20,24,44,${a * .55})`], [1, 'rgba(20,24,44,0)']]); ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
  }

  // ---------------------------------------------------------------- a car seen from behind, with a fog color that suits the time of day
  function car(X, Z, o = {}) {
    const w = o.w ?? 165, len = o.len ?? 440, c = o.color ?? '#2c8f9a', brake = o.brake ?? .2, fog = o.fog ?? { color: '#cfe4f4', amt: .2, zFar: 2400 };
    if (!o.noShadow) groundShadow(X - w, X + w, Z, Z + len, o.shadowA ?? .3, 50);
    for (const sx of [-1, 1]) box({ x0: sx < 0 ? X - w - 6 : X + w - 34, x1: sx < 0 ? X - w + 34 : X + w + 6, y1: 64, z0: Z + 70, z1: Z + 160, color: '#16141c', lw: 1.2, fog });
    box({ x0: X - w, x1: X + w, y0: 30, y1: 120, z0: Z, z1: Z + len, color: c, front: litH(c, 1.0), side: litH(c, .66), top: litH(c, 1.24), fog });
    box({ x0: X - w * .74, x1: X + w * .74, y0: 120, y1: 204, z0: Z + len * .16, z1: Z + len * .66, color: c, front: litH(c, .92), side: litH(c, .64), top: litH(c, 1.3), fog });
    { const a = [p2(X - w * .64, 128, Z + len * .16), p2(X + w * .64, 128, Z + len * .16), p2(X + w * .64, 196, Z + len * .16), p2(X - w * .64, 196, Z + len * .16)];
      poly(a, grad(0, a[2][1], 0, a[0][1], [[0, o.glass ?? '#8fb8e0'], [1, o.glass2 ?? '#3a5a8a']]), 'rgba(10,8,20,.7)', 2);
      ctx.save(); ctx.beginPath(); a.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(a[0][0] + 20, a[0][1]); ctx.lineTo(a[0][0] + 70, a[0][1]); ctx.lineTo(a[3][0] + 120, a[3][1]); ctx.lineTo(a[3][0] + 70, a[3][1]); ctx.closePath(); ctx.fill(); ctx.restore(); }
    box({ x0: X - w - 2, x1: X + w + 2, y0: 22, y1: 46, z0: Z - 14, z1: Z + 6, color: litH(c, .5), lw: 1.4 });
    const k = kz(Z);
    for (const [a, b] of [[X - w + 8, X - w + 66], [X + w - 66, X + w - 8]]) { onZ(Z - 14, a, b, 62, 100, `rgb(255,${58 + 120 * (1 - brake) | 0},${58 + 120 * (1 - brake) | 0})`, 'rgba(20,8,12,.7)', 1.6); if (brake > .3) { const [gx, gy] = p2((a + b) / 2, 81, Z - 14); V2.glow(gx, gy, 90 * k, '255,50,50', .5 * brake, 'screen', .7); } }
    onZ(Z - 14, X - 34, X + 34, 48, 78, '#f0eee4', 'rgba(20,16,24,.7)', 1.6);
  }

  // ---------------------------------------------------------------- the parking lot, afternoon
  function lotDay(o = {}) {
    const t = o.t ?? 0, Zb = 2100, hy = V2.P.hy, k = kz(Zb), fogD = { color: '#cfe4f4', amt: .2, zFar: 2400 };
    ctx.fillStyle = grad(0, 0, 0, hy + 140, [[0, '#4694e4'], [.42, '#84c2f4'], [.8, '#d0eafb'], [1, '#fff0d6']]); ctx.fillRect(-100, -100, W + 200, hy + 360);
    V2.glow(40, -60, 1100, '255,242,200', .5, 'screen', .5);
    A7.rays(40, -60, 160, 1800, t, { n: 12, color: '255,246,214', a: .06, spin: .008 });
    A7.clouds(t, 80, 520, { n: 8, a: .95, speed: 9, seed: 2, scale: 1.2 });
    A7.birds(t, 160, 520, { n: 5, seed: 3, speed: 55 });
    // trees at the edges, behind the building line
    for (const [x, r, sd] of [[-1560, 300, 1], [1580, 330, 2], [-1180, 210, 3], [1240, 230, 4]]) {
      const [tx, ty] = p2(x, 0, Zb + 60), rr0 = r * k;
      ctx.fillStyle = '#6a4a2e'; ctx.fillRect(tx - 18 * k, ty - 300 * k, 36 * k, 300 * k);
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + sd, cx = tx + Math.cos(a) * rr0 * .55, cy = ty - 420 * k - 70 * k + Math.sin(a) * rr0 * .42; ctx.fillStyle = grad(cx, cy - rr0, cx, cy + rr0, [[0, '#6fcf6a'], [1, '#2f8a3e']]); ctx.beginPath(); ctx.arc(cx, cy, rr0 * .56, 0, TAU); ctx.fill(); }
      ctx.fillStyle = grad(tx, ty - 700 * k, tx, ty - 200 * k, [[0, '#7fdc72'], [1, '#2f8a3e']]); ctx.beginPath(); ctx.arc(tx, ty - 470 * k, rr0 * .62, 0, TAU); ctx.fill();
    }
    // the building: warm stone, a roof band, rows of windows that reflect the sky, an entrance under a canopy
    const hw = 1500, bh = 640;
    { const a = p2(-hw, 0, Zb), b = p2(hw, bh, Zb);
      onZ(Zb, -hw, hw, 0, bh, grad(0, b[1], 0, a[1], [[0, '#efdfc2'], [1, '#cdb894']]));
      onZ(Zb, -hw, hw, bh - 36, bh + 22, '#8a6a4a', ink, 2); onZ(Zb, -hw, hw, 0, 34, '#a9926f'); }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
      const x0 = -1120 + c * 250, y0 = [130, 310, 490][r];
      if (Math.abs(x0 + 62) < 260 && r === 0) continue;
      const f = [p2(x0, y0, Zb), p2(x0 + 124, y0, Zb), p2(x0 + 124, y0 + 110, Zb), p2(x0, y0 + 110, Zb)];
      poly(f, grad(0, f[2][1], 0, f[0][1], [[0, '#a8d4f4'], [1, '#e2f2fd']]), ink, 2.2);
      onZ(Zb, x0 + 60, x0 + 64, y0, y0 + 110, 'rgba(255,255,255,.8)'); onZ(Zb, x0, x0 + 124, y0 + 52, y0 + 56, 'rgba(255,255,255,.8)');
      ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(f[0][0] + 6, f[0][1]); ctx.lineTo(f[0][0] + 30 * k, f[0][1]); ctx.lineTo(f[3][0] + 70 * k, f[3][1]); ctx.lineTo(f[3][0] + 46 * k, f[3][1]); ctx.closePath(); ctx.fill(); ctx.restore();
      if ((r * 9 + c) % 4 === 1) { const bl = [p2(x0 + 6, y0 + 60, Zb), p2(x0 + 118, y0 + 60, Zb), p2(x0 + 118, y0 + 104, Zb), p2(x0 + 6, y0 + 104, Zb)]; ctx.fillStyle = 'rgba(244,236,214,.92)'; ctx.fillRect(bl[0][0], bl[3][1], bl[1][0] - bl[0][0], bl[0][1] - bl[3][1]); ctx.strokeStyle = 'rgba(120,100,70,.3)'; ctx.lineWidth = 1.2; for (let q = 1; q < 5; q++) { const yy = lerp(bl[3][1], bl[0][1], q / 5); ctx.beginPath(); ctx.moveTo(bl[0][0], yy); ctx.lineTo(bl[1][0], yy); ctx.stroke(); } }
    }
    { const f = [p2(-190, 0, Zb), p2(190, 0, Zb), p2(190, 260, Zb), p2(-190, 260, Zb)]; poly(f, grad(0, f[2][1], 0, f[0][1], [[0, '#bfe6ff'], [1, '#f2fbff']]), ink, 3);
      onZ(Zb, -4, 4, 0, 260, 'rgba(60,70,90,.55)'); onZ(Zb, -190, 190, 128, 132, 'rgba(60,70,90,.45)'); }
    box3({ x0: -300, x1: 300, y0: 268, y1: 300, z0: Zb - 190, z1: Zb, color: '#2f6f78', top: '#4f9aa4', lw: 1.6 });
    onZ(Zb, -520, 520, bh + 40, bh + 140, '#1f5058', 'rgba(255,255,255,.6)', 2.6);
    { const [sx, sy] = p2(0, bh + 90, Zb); ctx.fillStyle = '#fff4d6'; ctx.font = `900 ${42 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = `${4 * k}px`; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.letterSpacing = '0px'; }
    // the sidewalk and a hedge along the foot of the building
    poly([p2(-2600, 0, Zb), p2(2600, 0, Zb), p2(2600, 0, Zb - 380), p2(-2600, 0, Zb - 380)], grad(0, p2(0, 0, Zb)[1], 0, p2(0, 0, Zb - 380)[1], [[0, '#d8d3c8'], [1, '#bdb8ac']]));
    for (let x = -2200; x < 2200; x += 260) { if (Math.abs(x) < 260) continue; const [hx, hy2] = p2(x, 0, Zb - 20), hh = 90 * k; ctx.fillStyle = grad(0, hy2 - hh, 0, hy2, [[0, '#4fb857'], [1, '#2a7a3a']]); rr(hx - 120 * k, hy2 - hh, 240 * k, hh, 18 * k); ctx.fill(); ctx.strokeStyle = 'rgba(10,50,20,.5)'; ctx.lineWidth = 2; ctx.stroke(); }
    // asphalt, with stall lines in true perspective
    { const yb = p2(0, 0, Zb - 380)[1]; ctx.fillStyle = grad(0, yb - 2, 0, H, [[0, '#7d7f8e'], [.5, '#5a5c6a'], [1, '#3f414e']]); ctx.fillRect(-100, yb - 2, W + 200, H - yb + 120);
      ctx.fillStyle = 'rgba(40,40,52,.12)'; for (let i = 0; i < 18; i++) { const [sx, sy] = p2(-1200 + hash(i) * 2400, 0, 600 + hash(i + 3) * 1000); ctx.save(); ctx.translate(sx, sy); ctx.scale(1, .2); ctx.beginPath(); ctx.arc(0, 0, 30 + 40 * hash(i + 9), 0, TAU); ctx.fill(); ctx.restore(); } }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineCap = 'butt';
    for (const x of [-780, -390, 0, 390, 780]) { const a = p2(x, 0, 1350), b = p2(x, 0, Zb - 420); ctx.lineWidth = Math.max(2, 9 * kz(1350)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    { const a = p2(-1100, 0, 1350), b = p2(1100, 0, 1350); ctx.lineWidth = Math.max(2, 9 * kz(1350)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    car(-585, 1480, { color: '#2c8f9a', fog: fogD }); car(195, 1560, { color: '#8a2d46', w: 160, fog: fogD }); car(-195, 1700, { color: '#c9a23a', w: 150, fog: fogD }); car(780, 1500, { color: '#3b4a9a', fog: fogD });
    if (o.hers !== false) car(470, o.hersZ ?? 1060, { color: '#d9304f', brake: o.brake ?? 0, fog: { color: '#cfe4f4', amt: .05, zFar: 2400 }, len: 420 });
    for (const x of [-720, 720]) { const hh = 640, side = x < 0 ? 1 : -1; box({ x0: x - 8, x1: x + 8, y1: hh, z0: 1260, z1: 1276, color: '#4a4a56', lw: 1.2, fog: fogD }); box({ x0: Math.min(x, x + side * 90), x1: Math.max(x, x + side * 90), y0: hh - 8, y1: hh + 8, z0: 1254, z1: 1282, color: '#4a4a56', lw: 1.2, fog: fogD }); }
  }

  // ---------------------------------------------------------------- a window with no cross bars: one big pane for the Moon to sit in
  // paint(f) receives the screen corners [bottom-left, bottom-right, top-right, top-left] with the clip already set
  function winPane(zb, r, paint, o = {}) {
    const { x0, x1, y0, y1 } = r, frame = o.frame ?? '#efe6d2', f = [p2(x0, y0, zb), p2(x1, y0, zb), p2(x1, y1, zb), p2(x0, y1, zb)], k = kz(zb);
    onZ(zb, x0 - 18, x1 + 18, y0 - 18, y1 + 18, frame, ink, 2.6);
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    ctx.fillStyle = grad(0, f[2][1], 0, f[0][1], o.sky ?? [[0, '#0a1030'], [1, '#34408a']]); ctx.fillRect(f[0][0] - 4, f[2][1] - 4, f[1][0] - f[0][0] + 8, f[0][1] - f[2][1] + 8);
    if (paint) paint(f);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(f[0][0] + (f[1][0] - f[0][0]) * .08, f[0][1]); ctx.lineTo(f[0][0] + (f[1][0] - f[0][0]) * .3, f[0][1]); ctx.lineTo(f[3][0] + (f[2][0] - f[3][0]) * .56, f[3][1]); ctx.lineTo(f[3][0] + (f[2][0] - f[3][0]) * .34, f[3][1]); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (o.sill !== false) onZ(zb, x0 - 28, x1 + 28, y0 - 30, y0 - 10, '#e4dac6', ink, 2);
    if (o.curtains) for (const [a0, a1] of [[x0 - 40, x0 + (x1 - x0) * .14], [x1 - (x1 - x0) * .14, x1 + 40]]) onZ(zb, a0, a1, y0 - 24, y1 + 30, o.curtains, 'rgba(25,16,30,.35)', 1.6);
    return f;
  }

  // ---------------------------------------------------------------- red seven-segment digits for the hours-since sign
  const SEG7 = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  function digit7(x, y, w, h, d, on = 1, color = '255,60,60') {
    const lw = Math.max(4, w * .16), i = lw * .55, m = h / 2;
    const sg = { a: [x + i, y, x + w - i, y], b: [x + w, y + i, x + w, y + m - i], c: [x + w, y + m + i, x + w, y + h - i], d: [x + i, y + h, x + w - i, y + h], e: [x, y + m + i, x, y + h - i], f: [x, y + i, x, y + m - i], g: [x + i, y + m, x + w - i, y + m] };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = lw;
    for (const [nm, [ax, ay, bx, by]] of Object.entries(sg)) {
      ctx.strokeStyle = d != null && SEG7[d].includes(nm) ? `rgba(${color},${.55 + .45 * on})` : 'rgba(80,16,16,.55)';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    ctx.restore();
  }
  // the sign: HOURS SINCE THE Q WORD, two digits; `hours` may be fractional while it ticks over, `flash` pulses the frame red
  function qSign(zb, rect, hours, o = {}) {
    const { x0, x1, y0, y1 } = rect, f = [p2(x0, y0, zb), p2(x1, y0, zb), p2(x1, y1, zb), p2(x0, y1, zb)], k = kz(zb), flash = o.flash ?? 0;
    poly(f, '#15131c', 'rgba(255,255,255,.22)', 3);
    const cx = (f[0][0] + f[1][0]) / 2, w = f[1][0] - f[0][0], h = f[0][1] - f[2][1], top = f[2][1];
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.font = `900 ${h * .16}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = `${h * .02}px`; ctx.fillText(o.title ?? 'HOURS SINCE THE Q WORD', cx, top + h * .17); ctx.letterSpacing = '0px'; ctx.restore();
    const v = Math.max(0, Math.round(hours)), dg = [Math.floor(v / 10) % 10, v % 10], dw = w * .15, dh = h * .46, gap = dw * .5, tx = cx - (2 * dw + gap) / 2, ty = top + h * .34;
    const flicker = o.flicker ?? 1;
    dg.forEach((d, i) => digit7(tx + i * (dw + gap), ty, dw, dh, v < 10 && i === 0 ? null : d, flicker));
    const [gx, gy] = [cx, ty + dh / 2]; V2.glow(gx, gy, w * .5, '255,50,50', (.32 + .5 * flash) * flicker, 'screen', .5);
    if (flash > 0) { ctx.strokeStyle = `rgba(255,70,70,${flash})`; ctx.lineWidth = 6; ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke(); }
    return f;
  }

  // a whiteboard with marker writing. lines: [{t, x, y, size, color, rot, p}] (p = 0..1 how much is written so far)
  function whiteboard(zb, rect, lines, o = {}) {
    const { x0, x1, y0, y1 } = rect, f = [p2(x0, y0, zb), p2(x1, y0, zb), p2(x1, y1, zb), p2(x0, y1, zb)], k = kz(zb);
    onZ(zb, x0 - 14, x1 + 14, y0 - 14, y1 + 14, '#c3c9d2', ink, 2.4);
    poly(f, grad(0, f[2][1], 0, f[0][1], [[0, '#ffffff'], [1, '#e8edf2']]), 'rgba(25,16,30,.4)', 2);
    onZ(zb, x0 - 14, x1 + 14, y0 - 30, y0 - 12, '#aab2bd', ink, 1.6);
    const w = f[1][0] - f[0][0], h = f[0][1] - f[2][1];
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    for (const L of lines) {
      const p = L.p ?? 1; if (p <= 0) continue;
      const lx = f[3][0] + L.x * w, ly = f[3][1] + L.y * h;
      let tw = 0;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(L.rot ?? 0);
      ctx.font = `italic 900 ${L.size * h}px Nunito`; tw = ctx.measureText(L.t).width;
      ctx.beginPath(); ctx.rect(-6, -L.size * h, tw * p + 12, L.size * h * 1.5); ctx.clip();
      ctx.fillStyle = L.color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(L.t, 0, 0);
      ctx.restore();
      if (L.check && p >= 1) { const cx2 = lx + tw + L.size * h * .35, cy2 = ly - L.size * h * .3, ss = L.size * h * .55, ck = clamp(L.check); ctx.strokeStyle = L.checkColor || L.color; ctx.lineWidth = Math.max(4, h * .03); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(lerp(cx2, cx2 + ss * .35, clamp(ck * 2)), lerp(cy2, cy2 + ss * .4, clamp(ck * 2))); if (ck > .5) ctx.lineTo(lerp(cx2 + ss * .35, cx2 + ss * 1.1, (ck - .5) * 2), lerp(cy2 + ss * .4, cy2 - ss * .7, (ck - .5) * 2)); ctx.stroke(); }
      if (L.under && p >= 1) { ctx.strokeStyle = L.color; ctx.lineWidth = Math.max(3, h * .012); ctx.beginPath(); ctx.moveTo(lx, ly + h * .02); ctx.quadraticCurveTo(lx + w * .2, ly + h * .035, lx + w * L.under, ly + h * .015); ctx.stroke(); }
    }
    ctx.restore();
    return f;
  }

  // ---------------------------------------------------------------- the nurses' station, front-on. back(): wall and everything behind the staff. counter(): the desk, drawn in front of whoever stands behind it
  const NIGHT = { wall: '#6e78a6', wain: '#32505c', floorA: '#585a76', floorB: '#42445e', ceil: '#6a6e92', fog: '#262a50' };
  const DAYC = { wall: '#f1e6cf', wain: '#4f8f96', floorA: '#d6cab2', floorB: '#aaa088', ceil: '#f2efe6', fog: '#b9c4d6' };
  function stationBack(o = {}) {
    const night = !!o.night, pal = night ? NIGHT : DAYC, zb = 1900, hw = 760, ch = 900, t = o.t ?? 0;
    shell({ zb, hw, ch, wall: pal.wall, wain: pal.wain, floorA: pal.floorA, floorB: pal.floorB, ceil: pal.ceil, fog: pal.fog, fogAmt: night ? .3 : .26, tile: 120, rail: 110 });
    // the window, right: afternoon sky, or night with stars; the Moon (night) is painted inside the glass so the frame crops it
    const win = winPane(zb, { x0: 250, x1: 650, y0: 230, y1: 700 }, f => {
      const [bx, by] = f[0], [tx2, ty] = f[2], cx = (f[0][0] + f[1][0]) / 2, cy = (ty + by) / 2;
      if (night) { A7.stars(t, ty + (by - ty) * .95, { n: 110, seed: 5, a: .9 }); A7.clouds(t, ty + 30, by - 60, { n: 3, tint: '120,130,190', belly: '40,50,110', a: .3, speed: 4, seed: 7, scale: .4 }); }
      else { A7.clouds(t, ty + 20, by - 60, { n: 3, a: .9, speed: 6, seed: 3, scale: .5 }); }
      if (o.moon) { const m = o.moon, ww = f[1][0] - f[0][0]; A7.moon(cx + (m.dx ?? 0) * ww, cy + (m.dy ?? 0) * ww, (m.s ?? .8) * ww / 295, Object.assign({ t, alpha: 1 }, m.o || {}, { char: Object.assign({ expr: m.expr ?? 'neutral', look: m.look ?? [-.5, .4] }, m.char || {}) })); }
    }, { sky: night ? [[0, '#070a24'], [.6, '#16204e'], [1, '#2c3a82']] : [[0, '#6fb4f2'], [1, '#cfe9fb']], curtains: night ? '#3a3f78' : '#d98a5c' });
    // the whiteboard and the sign above it, centre
    const wb = whiteboard(zb, { x0: -290, x1: 130, y0: 330, y1: 690 }, o.board || [], {});   // clear of the window, so the Moon is never behind it
    const sg = qSign(zb, { x0: -290, x1: 130, y0: 720, y1: 860 }, o.hours ?? 41, { flash: o.qFlash ?? 0, flicker: o.qFlicker ?? 1, title: o.qTitle });
    // the call-light board and a clock, left
    { const pts = [p2(-700, 330, zb), p2(-450, 330, zb), p2(-450, 740, zb), p2(-700, 740, zb)]; poly(pts, '#20242c', 'rgba(255,255,255,.18)', 2.4);
      const lamps = o.lamps || [];
      for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { const i = r * 4 + c, L = lamps[i], [lx, ly] = p2(-676 + c * 56, 690 - r * 54, zb), kk = kz(zb); ctx.fillStyle = L ? `rgb(${L[0]})` : '#3a3f48'; ctx.beginPath(); ctx.ellipse(lx + 12 * kk, ly, 13 * kk, 17 * kk, 0, 0, TAU); ctx.fill(); if (L) V2.glow(lx + 12 * kk, ly, 80 * kk, L[0], .8 * (L[1] ?? 1), 'screen', .5); }
      if (!o.noLabel) text('CALL LIGHTS', ...p2(-575, 775, zb), { size: 20 * kz(zb), fill: '#cdd5e0', weight: 900, spacing: 2 }); }   // close-ups crop the panel at the frame edge, and the word with it
    wallClock(-346, 800, zb, 0, o.min ?? 5, o.hr ?? 3, 44);   // clear of the sign's left end, and still inside the frame in the close-up on the sign
    for (const z of [300, 900, 1500]) { ceilingLamp(-300, z, ch, o.lampsOn ?? 1, night ? '255,226,170' : '255,248,226'); ceilingLamp(300, z, ch, o.lampsOn ?? 1, night ? '255,226,170' : '255,248,226'); }
    plant3(690, 1500, 1.0);
    return { zb, win, wb, sg };
  }
  function stationCounter(o = {}) {
    const night = !!o.night, zc = 1500;
    groundShadow(-640, 640, zc, zc + 150, .25, 0);
    box({ x0: -640, x1: 640, y1: 190, z0: zc, z1: zc + 150, color: night ? '#8a6a44' : '#c9a26a', front: night ? '#74562f' : '#b88c58', top: night ? '#9a7a54' : '#ecdcb4', side: night ? '#5a4024' : '#9a7444' });
    box({ x0: -640, x1: 640, y0: 190, y1: 220, z0: zc + 80, z1: zc + 150, color: night ? '#6a4a2c' : '#8a6a44', top: night ? '#8a6a46' : '#a9835a', front: night ? '#5a3c20' : '#7a5a38' });
    // on the counter: a monitor (seen from behind), a phone, a coffee, a stack of charts, a service bell. The middle stays clear for whoever stands in front of it
    box({ x0: -520, x1: -380, y0: 220, y1: 330, z0: zc + 96, z1: zc + 118, color: '#20242c', front: '#1a1d24', lw: 1.6 });
    box({ x0: -460, x1: -440, y0: 220, y1: 246, z0: zc + 102, z1: zc + 114, color: '#2a2e38', lw: 1 });
    box({ x0: 330, x1: 450, y0: 220, y1: 236, z0: zc + 56, z1: zc + 118, color: '#d9d9de', front: '#e8e8ee', lw: 1.6 });
    box({ x0: 500, x1: 552, y0: 220, y1: 270, z0: zc + 60, z1: zc + 108, color: '#f6f3ee', front: '#ffffff', top: '#5a3420', lw: 1.4 });
    for (let i = 0; i < 4; i++) box({ x0: -330 + i * 3, x1: -190 + i * 3, y0: 220 + i * 9, y1: 229 + i * 9, z0: zc + 50, z1: zc + 124, color: ['#f4efe0', '#e9f0f7', '#f7ead8', '#eef4e6'][i], lw: 1.2 });
    { const [bx, by] = p2(600, 228, zc + 70), kk = kz(zc + 70); ctx.fillStyle = '#d7b64a'; ctx.strokeStyle = ink; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(bx, by, 30 * kk, 9 * kk, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f0d66a'; ctx.beginPath(); ctx.ellipse(bx, by - 7 * kk, 22 * kk, 8 * kk, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(bx - 4 * kk, by - 16 * kk, 8 * kk, 8 * kk); }
    if (night) { const [lx, ly] = p2(-60, 300, zc + 100); V2.glow(lx, ly, 360 * kz(zc + 100), '255,214,140', .5, 'screen', .6); }
  }

  // ---------------------------------------------------------------- the taxi (side view, a flat card in the world plane)
  function taxi(x, y, s, t, o = {}) {
    const dir = o.dir ?? 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = 'rgba(10,12,30,.3)'; ctx.beginPath(); ctx.ellipse(10, 4, 190, 14, 0, 0, TAU); ctx.fill();
    // body
    ctx.fillStyle = V2.grad(0, -110, 0, -20, [[0, '#ffe36a'], [1, '#e8a800']]); ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-190, -26); ctx.lineTo(-190, -64); ctx.quadraticCurveTo(-186, -84, -150, -90); ctx.lineTo(-96, -96); ctx.lineTo(-60, -140); ctx.quadraticCurveTo(-52, -150, -36, -150); ctx.lineTo(70, -150); ctx.quadraticCurveTo(88, -150, 100, -134); ctx.lineTo(130, -96); ctx.lineTo(176, -86); ctx.quadraticCurveTo(196, -80, 196, -60); ctx.lineTo(196, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
    // windows
    ctx.fillStyle = V2.grad(0, -140, 0, -98, [[0, '#9fd0ee'], [1, '#4a7ca8']]); ctx.beginPath(); ctx.moveTo(-84, -100); ctx.lineTo(-54, -136); ctx.lineTo(8, -136); ctx.lineTo(8, -100); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(24, -100); ctx.lineTo(24, -136); ctx.lineTo(70, -136); ctx.quadraticCurveTo(82, -136, 90, -122); ctx.lineTo(112, -100); ctx.closePath(); ctx.fill(); ctx.stroke();
    // checker stripe and the door line
    ctx.save(); ctx.beginPath(); ctx.rect(-190, -66, 386, 18); ctx.clip(); for (let i = 0; i < 40; i++) { ctx.fillStyle = i % 2 ? '#15111a' : '#ffffff'; ctx.fillRect(-190 + i * 10, -66, 10, 9); ctx.fillStyle = i % 2 ? '#ffffff' : '#15111a'; ctx.fillRect(-190 + i * 10, -57, 10, 9); } ctx.restore();
    ctx.strokeStyle = 'rgba(80,50,0,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -98); ctx.lineTo(10, -30); ctx.moveTo(-98, -98); ctx.lineTo(-98, -30); ctx.stroke();
    ctx.fillStyle = '#cfd4da'; rr(-8, -84, 22, 6, 3); ctx.fill();
    // roof sign
    ctx.fillStyle = '#fff6c0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-34, -178, 72, 28, 6); ctx.fill(); ctx.stroke();
    text('TAXI', 2, -164, { size: 22, font: 'Bangers', weight: 400, fill: '#15111a', spacing: 3 });
    // lights and bumpers
    ctx.fillStyle = '#fffbe0'; ell(190, -62, 10, 14); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8283c'; ell(-188, -62, 6, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2830'; rr(-200, -30, 400, 14, 6); ctx.fill();
    // wheels
    for (const wx of [-118, 120]) { ctx.save(); ctx.translate(wx, -26); ctx.fillStyle = '#15131a'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.fill(); ctx.fillStyle = '#c7ccd4'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill(); ctx.stroke(); ctx.rotate((o.roll ?? 0) * dir); ctx.strokeStyle = '#6a7078'; ctx.lineWidth = 4; for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 20); ctx.stroke(); } ctx.restore(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- a wheelchair, three-quarter view. back() sits behind the occupant, front() in front of them
  function wheelchairBack(x, y, s, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-70, -26); ctx.lineTo(-70, -210); ctx.lineTo(-96, -226); ctx.moveTo(70, -26); ctx.lineTo(70, -210); ctx.lineTo(96, -226); ctx.stroke();
    ctx.fillStyle = '#2a2a34'; rr(-76, -204, 152, 30, 10); ctx.fill();
    ctx.restore();
  }
  function wheelchairFront(x, y, s, o = {}) {
    const roll = o.roll ?? 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * 112, -86);
      ctx.fillStyle = '#15131a'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 0, 26, 86, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#9aa2ae'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 62, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#666c78'; ctx.lineWidth = 3.4; for (let i = 0; i < 6; i++) { const a = roll + i / 6 * PI; ctx.beginPath(); ctx.moveTo(-Math.sin(a) * 4, -Math.cos(a) * 58); ctx.lineTo(Math.sin(a) * 4, Math.cos(a) * 58); ctx.stroke(); }
      ctx.strokeStyle = '#c7ccd4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(side * 3, 0, 22, 74, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#3a3a48'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-92, -132, 184, 26, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6d9e0'; rr(-60, -24, 44, 14, 6); ctx.fill(); ctx.stroke(); rr(16, -24, 44, 14, 6); ctx.fill(); ctx.stroke();
    for (const side of [-1, 1]) { ctx.fillStyle = '#1d1a22'; ctx.beginPath(); ctx.arc(side * 58, -12, 12, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- the activity room at bingo hour
  function flashboard(zb, rect, called, o = {}) {
    const { x0, x1, y0, y1 } = rect, f = [p2(x0, y0, zb), p2(x1, y0, zb), p2(x1, y1, zb), p2(x0, y1, zb)], k = kz(zb);
    onZ(zb, x0 - 16, x1 + 16, y0 - 16, y1 + 16, '#2a2234', 'rgba(255,255,255,.3)', 2.6);
    poly(f, '#0f0c18');
    const w = f[1][0] - f[0][0], h = f[0][1] - f[2][1], cw = w / 5, hh = h / 16;
    ['B', 'I', 'N', 'G', 'O'].forEach((L, c) => { ctx.fillStyle = ['#4a8af0', '#ff5a6a', '#ffc928', '#3fc47a', '#b06af0'][c]; ctx.fillRect(f[3][0] + c * cw + 2, f[3][1] + 2, cw - 4, hh - 4); text(L, f[3][0] + (c + .5) * cw, f[3][1] + hh / 2 + 1, { size: hh * .74, font: 'Bangers', weight: 400, fill: '#fff' }); });
    for (let c = 0; c < 5; c++) for (let r = 0; r < 15; r++) {
      const n = c * 15 + r + 1, on = called.get(n), x = f[3][0] + c * cw, y = f[3][1] + (r + 1) * hh;
      ctx.fillStyle = on != null ? '#ffe36a' : 'rgba(255,255,255,.1)'; ctx.fillRect(x + 3, y + 2, cw - 6, hh - 4);
      ctx.fillStyle = on != null ? '#3a2400' : 'rgba(255,255,255,.4)'; ctx.font = `900 ${hh * .66}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), x + cw / 2, y + hh / 2 + 1);
      if (on != null) { const pulse = clamp(1 - on / .8); if (pulse > 0) V2.glow(x + cw / 2, y + hh / 2, 60 * k + 40 * pulse, '255,230,120', .7 * pulse, 'screen', .6); }
    }
    return f;
  }
  function activityBack(o = {}) {
    const zb = 2300, hw = 900, ch = 760, t = o.t ?? 0;
    shell({ zb, hw, ch, wall: '#e6defa', wain: '#7a66cc', floorA: '#dcbc90', floorB: '#b4916a', ceil: '#f4f1f8', fog: '#cdc4ee', fogAmt: .26, tile: 150, rail: 120 });
    // pennants strung across the back wall
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(60,40,70,.6)';
    for (const [xa, xb, yy] of [[-860, 0, 700], [0, 860, 700]]) { const a = p2(xa, yy, zb), b = p2(xb, yy, zb), mid = [(a[0] + b[0]) / 2, a[1] + 40 * kz(zb)]; ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(mid[0], mid[1] + 40 * kz(zb), ...b); ctx.stroke();
      for (let i = 1; i < 14; i++) { const u = i / 14, x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mid[0] + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * (mid[1] + 40 * kz(zb)) + u * u * b[1]; ctx.fillStyle = ['#ff5a6a', '#ffc928', '#3fc47a', '#4a8af0', '#b06af0'][i % 5]; ctx.beginPath(); ctx.moveTo(x - 16 * kz(zb), y); ctx.lineTo(x + 16 * kz(zb), y); ctx.lineTo(x, y + 36 * kz(zb)); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    if (!o.noBanner) { const [bx, by] = p2(-385, 660, zb), kk = kz(zb); ctx.save(); ctx.translate(bx, by); ctx.rotate(-.015); text('BINGO NIGHT', 0, 0, { size: 104 * kk, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12 * kk, stroke: '#2a1a4a', spacing: 6 * kk, shadow: 10 }); ctx.restore(); }
    // glass doors out to the lot, left: sky, the lot, and whatever is parked in it
    const doors = { x0: -820, x1: -430, y0: 0, y1: 470 };
    const df = [p2(doors.x0, doors.y0, zb), p2(doors.x1, doors.y0, zb), p2(doors.x1, doors.y1, zb), p2(doors.x0, doors.y1, zb)];
    onZ(zb, doors.x0 - 20, doors.x1 + 20, doors.y0, doors.y1 + 24, '#efe6d2', ink, 2.6);
    poly(df, grad(0, df[2][1], 0, df[0][1], [[0, '#7fbfee'], [1, '#e6f4fd']]));
    ctx.save(); ctx.beginPath(); df.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    ctx.fillStyle = grad(0, df[0][1] - 120 * kz(zb), 0, df[0][1], [[0, '#8a8c98'], [1, '#5e606e']]); ctx.fillRect(df[0][0], df[0][1] - 120 * kz(zb), df[1][0] - df[0][0], 130 * kz(zb));
    if (o.taxi != null) taxi(lerp(df[1][0] + 260 * kz(zb), (df[0][0] + df[1][0]) / 2, easeOut(clamp(o.taxi))), df[0][1] - 24 * kz(zb), .46 * kz(zb) / .737, t, { dir: -1, roll: t * 6 * (1 - clamp(o.taxi)) });
    ctx.restore();
    onZ(zb, (doors.x0 + doors.x1) / 2 - 5, (doors.x0 + doors.x1) / 2 + 5, 0, 470, 'rgba(60,70,90,.7)'); onZ(zb, doors.x0, doors.x1, 232, 238, 'rgba(60,70,90,.5)');
    onZ(zb, doors.x0 - 20, doors.x1 + 20, doors.y1 + 24, doors.y1 + 74, '#2f6f78', ink, 2); text('EXIT', ...p2((doors.x0 + doors.x1) / 2, doors.y1 + 50, zb), { size: 34 * kz(zb), font: 'Bangers', weight: 400, fill: '#ff5a5a', spacing: 4 });
    // the flashboard and clock
    const fb = flashboard(zb, { x0: 130, x1: 600, y0: 160, y1: 600 }, o.called || new Map(), {});
    wallClock(740, 560, zb, 0, o.min ?? 30, o.hr ?? 5, 56);
    // balloons
    for (const [bx, by, c] of [[672, 236, '#ff5a6a'], [714, 288, '#ffc928'], [758, 236, '#4a8af0'], [736, 184, '#3fc47a'], [786, 292, '#b06af0']]) { const [px, py] = p2(bx, by, zb), kk = kz(zb); ctx.strokeStyle = 'rgba(60,40,70,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py + 34 * kk); ctx.lineTo(px - 26 * kk, py + 180 * kk); ctx.stroke(); ctx.fillStyle = V2.grad(px - 34 * kk, py - 42 * kk, px + 34 * kk, py + 42 * kk, [[0, '#ffffff'], [.25, c], [1, c]]); ctx.beginPath(); ctx.ellipse(px, py, 34 * kk, 42 * kk, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 2.4; ctx.stroke(); }
    for (const z of [400, 1000, 1600]) { ceilingLamp(-420, z, ch, 1, '255,240,220', 100, 160); ceilingLamp(420, z, ch, 1, '255,240,220', 100, 160); }
    return { zb, hw, ch, flash: fb, door: df };
  }

  // ---------------------------------------------------------------- a resident's room at night, with the big window
  const ROOM = { zb: 1900, hw: 430, ch: 620, win: { x0: -250, x1: 250, y0: 170, y1: 540 } };
  function room14Back(o = {}) {
    const { zb, hw, ch, win: w } = ROOM, t = o.t ?? 0;
    shell({ zb, hw, ch, wall: '#58628f', wain: '#2f4a58', floorA: '#4e506c', floorB: '#3a3c56', ceil: '#585c80', fog: '#202448', fogAmt: .32, tile: 100, rail: 100 });
    const sky = o.sky ?? [[0, '#070a24'], [.6, '#17214f'], [1, '#33418a']];
    const win = winPane(zb, w, f => { o.paintSky && o.paintSky(f); }, { sky, curtains: '#3a3f78' });
    ceilingLamp(0, 700, ch, .12, '255,226,170', 80, 130);
    return { zb, hw, ch, win };
  }
  // moonlight through the window falls on the floor in front of it: a lit copy of the window, shifted toward the camera and the left
  function moonPatch(a = .3, shift = -190) {
    const { zb, win: w } = ROOM, pts = [p2(w.x0 + shift, 0, 1300), p2(w.x1 + shift, 0, 1300), p2(w.x1, 0, zb - 14), p2(w.x0, 0, zb - 14)];
    A7.gobo(pts, { color: '190,215,255', a, mull: 2 });
  }
  // the bed in two pieces so the patient can sit between them: frame, mattress and pillows behind, the blanket (with his knees under it) in front
  function bedBack() {
    box3({ x0: 90, x1: 390, y1: 70, z0: 1020, z1: 1780, color: '#6a5a4a', top: '#7a6a58' });
    box3({ x0: 96, x1: 384, y0: 70, y1: 130, z0: 1030, z1: 1770, color: '#cfd8e8', top: '#e8eef8', side: '#aab6cc' });
    box3({ x0: 90, x1: 390, y0: 70, y1: 330, z0: 1770, z1: 1788, color: '#5a4a3a' });
    box3({ x0: 150, x1: 330, y0: 130, y1: 165, z0: 1610, z1: 1760, color: '#eef2fa', top: '#ffffff', side: '#cfd8e8' });
  }
  function bedFront(o = {}) {
    box3({ x0: 96, x1: 384, y0: 130, y1: 160, z0: 1030, z1: 1520, color: '#4f7fa8', top: '#6ea0cc', side: '#3a6890' });
    box3({ x0: 100, x1: 380, y0: 130, y1: 178, z0: 1520, z1: 1690, color: '#4f7fa8', top: '#6ea0cc', side: '#3a6890' });
    box3({ x0: 96, x1: 384, y0: 70, y1: 130, z0: 1020, z1: 1036, color: '#6a5a4a' });
  }
  function nightstand(o = {}) {
    box3({ x0: -10, x1: 80, y1: 150, z0: 1640, z1: 1740, color: '#a98a62', top: '#c8a878', front: '#9a7c56', side: '#7a6040' });
    box3({ x0: 20, x1: 52, y0: 150, y1: 170, z0: 1670, z1: 1702, color: '#d8d0c0' });
    const [lx, ly] = p2(36, 230, 1686), kk = kz(1686);
    ctx.fillStyle = '#ffe9b8'; ctx.strokeStyle = ink; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(lx - 30 * kk, ly + 20 * kk); ctx.lineTo(lx - 16 * kk, ly - 28 * kk); ctx.lineTo(lx + 16 * kk, ly - 28 * kk); ctx.lineTo(lx + 30 * kk, ly + 20 * kk); ctx.closePath(); ctx.fill(); ctx.stroke();
    V2.glow(lx, ly, 380 * kk, '255,200,120', o.lampA ?? .5, 'screen', .6);
    const [px, py] = p2(-2, 150, 1690);
    ctx.fillStyle = 'rgba(170,215,245,.9)'; ctx.strokeStyle = ink; ctx.lineWidth = 2.6; rr(px - 20 * kk, py - 66 * kk, 40 * kk, 64 * kk, 8 * kk); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8eef5'; rr(px - 24 * kk, py - 74 * kk, 48 * kk, 12 * kk, 5 * kk); ctx.fill(); ctx.stroke();
    return { lamp: [lx, ly], pitcher: [px, py] };
  }

  return { car, lotDay, winPane, qSign, whiteboard, stationBack, stationCounter, taxi, wheelchairBack, wheelchairFront, flashboard, activityBack, room14Back, moonPatch, bedBack, bedFront, nightstand, groundShadow, ROOM, NIGHT, DAYC };
})();
window.S7 = S7;
