'use strict';
// "The Kid": an original faceless character in an oversized hoodie, hood up.
// Built as a tiny 2D rig (forward kinematics) and drawn as a silhouette with
// optional rim light, aura and glowing eyes.

// Proportions as fractions of standing height.
const KP = {
  thigh: 0.245, shin: 0.235, torso: 0.285, headR: 0.071,
  upper: 0.165, fore: 0.15,
  wThigh: 0.104, wShin: 0.09, wUpper: 0.08, wFore: 0.066, wTorso: 0.17,
  shoe: 0.052,
};

// ---------- poses ----------
// Side view angles are radians; 0 = limb hanging straight down, positive = toward facing direction.
// Knee/elbow values are bend amounts (knee bends backward, elbow bends forward).
function poseStand(breath = 0) {
  return {
    view: 'side', hipB: -0.05, kneeB: 0.06, hipF: 0.07, kneeF: 0.1,
    shB: -0.06 + breath * 0.02, elB: 0.25, shF: 0.08 - breath * 0.02, elF: 0.35,
    lean: 0.04, tilt: 0.16,
  };
}

function poseWalk(ph, amt = 1) {
  const a = TAU * ph, s = Math.sin(a);
  const kn = x => 0.08 + 0.78 * Math.pow(Math.max(0, x), 2);
  return {
    view: 'side',
    hipF: 0.43 * s * amt, kneeF: kn(Math.cos(a)) * amt + 0.05,
    hipB: -0.43 * s * amt, kneeB: kn(Math.cos(a + Math.PI)) * amt + 0.05,
    shF: -0.34 * s * amt, elF: 0.32 + 0.18 * Math.max(0, -s),
    shB: 0.34 * s * amt, elB: 0.32 + 0.18 * Math.max(0, s),
    lean: 0.07, tilt: 0.14,
  };
}

function poseFly(t = 0) {
  const w = Math.sin(t * 2.1) * 0.06;
  return {
    view: 'side', fixed: true,
    hipB: -0.22 + w, kneeB: 0.45, hipF: -0.05 - w, kneeF: 0.25,
    shF: Math.PI * 0.93, elF: -0.05, shB: -0.55 + w, elB: 0.2,
    lean: 0.0, tilt: -0.1,
  };
}

function poseSink(t = 0) {
  const w = Math.sin(t * 0.9);
  return {
    view: 'side', fixed: true,
    hipB: -0.25 + w * 0.08, kneeB: 0.55, hipF: 0.2 - w * 0.08, kneeF: 0.5,
    shF: Math.PI * 0.78 + w * 0.1, elF: 0.3, shB: Math.PI * 0.68 - w * 0.1, elB: 0.25,
    lean: -0.2, tilt: -0.45,
  };
}

function poseCrawl(ph) {
  const a = TAU * ph, s = Math.sin(a);
  return {
    view: 'side', groundHands: true,
    hipF: 0.1 + 0.2 * s, kneeF: 1.55, hipB: 0.1 - 0.2 * s, kneeB: 1.55,
    shF: 0.55 + 0.3 * Math.sin(a + 1.2), elF: 0.15, shB: 0.35 - 0.3 * Math.sin(a + 1.2), elB: 0.2,
    lean: 1.25, tilt: -0.55,
  };
}

function poseSit() {
  return {
    view: 'side', fixed: true,
    hipB: 1.45, kneeB: 1.35, hipF: 1.6, kneeF: 1.45,
    shB: 0.75, elB: 0.9, shF: 0.95, elF: 0.8,
    lean: 0.32, tilt: 0.35,
  };
}

function poseCompel(k = 1) {
  return {
    view: 'side',
    hipB: -0.32, kneeB: 0.12, hipF: 0.34, kneeF: 0.22,
    shF: lerp(0.1, Math.PI * 0.58, k), elF: lerp(0.35, -0.05, k),
    shB: lerp(-0.05, -0.35, k), elB: 0.3,
    lean: lerp(0.04, -0.05, k), tilt: lerp(0.15, -0.05, k),
  };
}

// Front/back view (symmetric). arm lift: 0 = hanging, 1 = horizontal, 2 = straight up.
function poseFront({ armL = 0.08, armR = 0.08, elL = 0.15, elR = 0.15, legL = 0.05, legR = 0.05, liftL = 0, liftR = 0, tilt = 0, sway = 0, back = false } = {}) {
  return { view: 'front', armL, armR, elL, elR, legL, legR, liftL, liftR, tilt, sway, back };
}

function poseMix(a, b, t) {
  if (a.view !== b.view) return t < 0.5 ? a : b;
  const o = { ...b };
  for (const k in a) if (typeof a[k] === 'number' && typeof b[k] === 'number') o[k] = lerp(a[k], b[k], t);
  return o;
}

// ---------- side view geometry ----------
function sideJoints(p, h) {
  const f = p.facing || 1;
  const leg = (hip, knee) => {
    const kx = Math.sin(hip) * f * KP.thigh * h, ky = Math.cos(hip) * KP.thigh * h;
    const a2 = hip - knee;
    return { knee: [kx, ky], ankle: [kx + Math.sin(a2) * f * KP.shin * h, ky + Math.cos(a2) * KP.shin * h], a2 };
  };
  const B = leg(p.hipB, p.kneeB), F = leg(p.hipF, p.kneeF);
  const up = [Math.sin(p.lean) * f, -Math.cos(p.lean)];
  const neck = [up[0] * KP.torso * h, up[1] * KP.torso * h];
  const shoulder = [neck[0] - up[0] * 0.035 * h - f * 0.012 * h, neck[1] - up[1] * 0.035 * h];
  const arm = (sh, el) => {
    const ex = shoulder[0] + Math.sin(sh) * f * KP.upper * h, ey = shoulder[1] + Math.cos(sh) * KP.upper * h;
    const a2 = sh + el;
    return { elbow: [ex, ey], hand: [ex + Math.sin(a2) * f * KP.fore * h, ey + Math.cos(a2) * KP.fore * h], a2 };
  };
  const AB = arm(p.shB, p.elB), AF = arm(p.shF, p.elF);
  const ha = p.lean + (p.tilt || 0);
  const head = [neck[0] + Math.sin(ha) * f * KP.headR * 1.25 * h, neck[1] - Math.cos(ha) * KP.headR * 1.25 * h];
  const hem = [-up[0] * 0.045 * h, -up[1] * 0.045 * h];
  return { f, B, F, neck, shoulder, AB, AF, head, ha, hem, up };
}

function sideShapes(ctx, J, h, col) {
  const f = J.f;
  ctx.strokeStyle = col; ctx.fillStyle = col;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const seg = (a, b, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
  const legDraw = L => {
    seg([0, 0], L.knee, KP.wThigh * h);
    seg(L.knee, L.ankle, KP.wShin * h);
    // Chunky sneaker: heel to toe along the foot direction (perpendicular-ish to shin).
    const fa = L.a2 * 0.35;
    const toe = [L.ankle[0] + Math.cos(fa) * f * 0.085 * h, L.ankle[1] + 0.028 * h + Math.sin(fa) * 0.02 * h];
    const heel = [L.ankle[0] - f * 0.028 * h, L.ankle[1] + 0.03 * h];
    seg(heel, toe, KP.shoe * h);
  };
  legDraw(J.B);
  // Back arm behind torso.
  seg(J.shoulder, J.AB.elbow, KP.wUpper * h);
  seg(J.AB.elbow, J.AB.hand, KP.wFore * h);
  ctx.beginPath(); ctx.arc(J.AB.hand[0], J.AB.hand[1], 0.033 * h, 0, TAU); ctx.fill();
  // Torso (oversized hoodie): capsule from hem to shoulder, plus a pocket bulge.
  seg(J.hem, [J.neck[0] - J.up[0] * 0.05 * h, J.neck[1] - J.up[1] * 0.05 * h], KP.wTorso * h);
  ctx.beginPath();
  ctx.ellipse(J.up[0] * 0.08 * h + f * 0.03 * h, J.up[1] * 0.08 * h, 0.085 * h, 0.07 * h, Math.atan2(J.up[1], J.up[0]), 0, TAU);
  ctx.fill();
  legDraw(J.F);
  // Neck / hood drape.
  seg(J.neck, J.head, 0.088 * h);
  // Hood: rounded shell with a peak at the back and a brim that hides the face.
  const hr = KP.headR * h;
  const ang = J.ha;
  ctx.save();
  ctx.translate(J.head[0], J.head[1]);
  ctx.rotate(ang * f);
  ctx.scale(f, 1);
  ctx.beginPath();
  ctx.moveTo(0.95 * hr, 0.55 * hr);
  ctx.quadraticCurveTo(1.25 * hr, -0.15 * hr, 0.72 * hr, -0.95 * hr);
  ctx.quadraticCurveTo(0.1 * hr, -1.35 * hr, -0.75 * hr, -1.02 * hr);
  ctx.quadraticCurveTo(-1.35 * hr, -0.55 * hr, -1.2 * hr, 0.35 * hr);
  ctx.quadraticCurveTo(-1.05 * hr, 1.05 * hr, -0.2 * hr, 1.2 * hr);
  ctx.quadraticCurveTo(0.6 * hr, 1.15 * hr, 0.95 * hr, 0.55 * hr);
  ctx.fill();
  ctx.restore();
  // Front arm.
  seg(J.shoulder, J.AF.elbow, KP.wUpper * h);
  seg(J.AF.elbow, J.AF.hand, KP.wFore * h);
  ctx.beginPath(); ctx.arc(J.AF.hand[0], J.AF.hand[1], 0.034 * h, 0, TAU); ctx.fill();
}

// ---------- front view geometry ----------
function frontJoints(p, h) {
  const hipX = 0.055 * h;
  const leg = (side, spread, lift) => {
    const len = (KP.thigh + KP.shin) * h;
    const fs = 1 - 0.45 * lift; // foreshortening when a knee lifts toward camera
    const kx = side * hipX + Math.sin(spread * side) * KP.thigh * h * 0.6;
    const ky = KP.thigh * h * fs;
    return { hip: [side * hipX, 0], knee: [kx, ky], ankle: [side * hipX + Math.sin(spread * side) * len, len * fs] };
  };
  const L = leg(-1, p.legL, p.liftL), R = leg(1, p.legR, p.liftR);
  const neck = [p.sway * h * 0.02, -KP.torso * h];
  const shY = neck[1] + 0.04 * h, shX = 0.108 * h;
  const arm = (side, lift, el) => {
    // lift 0 hanging .. 1 horizontal .. 2 up
    const a = lift * Math.PI / 2; // angle from straight down, outward
    const sx = neck[0] + side * shX, sy = shY;
    const ex = sx + side * Math.sin(a) * KP.upper * h, ey = sy + Math.cos(a) * KP.upper * h;
    const a2 = a + el * side * 0 + el;
    return { sh: [sx, sy], elbow: [ex, ey], hand: [ex + side * Math.sin(a2) * KP.fore * h, ey + Math.cos(a2) * KP.fore * h] };
  };
  const AL = arm(-1, p.armL, p.elL), AR = arm(1, p.armR, p.elR);
  const head = [neck[0] + Math.sin(p.tilt) * 0.1 * h, neck[1] - KP.headR * 1.22 * h];
  return { L, R, neck, AL, AR, head };
}

function frontShapes(ctx, J, h, col) {
  ctx.strokeStyle = col; ctx.fillStyle = col;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const seg = (a, b, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
  [J.L, J.R].forEach((Lg, i) => {
    const sd = i ? 1 : -1;
    seg(Lg.hip, Lg.knee, KP.wThigh * h);
    seg(Lg.knee, Lg.ankle, KP.wShin * h * 1.06);
    // Chunky sneakers, toes turned slightly out.
    ctx.beginPath(); ctx.ellipse(Lg.ankle[0] + sd * 0.012 * h, Lg.ankle[1] + 0.028 * h, 0.05 * h, 0.031 * h, sd * 0.12, 0, TAU); ctx.fill();
  });
  // Oversized hoodie: sloped shoulders, boxy body, hem sitting low on the hips.
  const n = J.neck;
  ctx.beginPath();
  ctx.moveTo(n[0] - 0.05 * h, n[1] - 0.012 * h);
  ctx.quadraticCurveTo(n[0] - 0.118 * h, n[1] - 0.002 * h, n[0] - 0.134 * h, n[1] + 0.055 * h);
  ctx.quadraticCurveTo(n[0] - 0.146 * h, n[1] + 0.13 * h, n[0] - 0.128 * h, n[1] + 0.2 * h);
  ctx.lineTo(-0.121 * h, 0.045 * h);
  ctx.quadraticCurveTo(0, 0.072 * h, 0.121 * h, 0.045 * h);
  ctx.lineTo(n[0] + 0.128 * h, n[1] + 0.2 * h);
  ctx.quadraticCurveTo(n[0] + 0.146 * h, n[1] + 0.13 * h, n[0] + 0.134 * h, n[1] + 0.055 * h);
  ctx.quadraticCurveTo(n[0] + 0.118 * h, n[1] - 0.002 * h, n[0] + 0.05 * h, n[1] - 0.012 * h);
  ctx.closePath();
  ctx.fill();
  for (const A of [J.AL, J.AR]) {
    seg(A.sh, A.elbow, KP.wUpper * h);
    seg(A.elbow, A.hand, KP.wFore * h);
    ctx.beginPath(); ctx.arc(A.hand[0], A.hand[1], 0.031 * h, 0, TAU); ctx.fill();
  }
  seg(n, J.head, 0.09 * h);
  // Hood: soft peak on top, drapes out onto the shoulders.
  const hr = KP.headR * h, c = J.head;
  ctx.beginPath();
  ctx.moveTo(c[0], c[1] - 1.34 * hr);
  ctx.bezierCurveTo(c[0] + 0.92 * hr, c[1] - 1.32 * hr, c[0] + 1.3 * hr, c[1] - 0.5 * hr, c[0] + 1.24 * hr, c[1] + 0.35 * hr);
  ctx.quadraticCurveTo(c[0] + 1.26 * hr, c[1] + 1.1 * hr, c[0] + 1.8 * hr, c[1] + 1.6 * hr);
  ctx.lineTo(c[0] - 1.8 * hr, c[1] + 1.6 * hr);
  ctx.quadraticCurveTo(c[0] - 1.26 * hr, c[1] + 1.1 * hr, c[0] - 1.24 * hr, c[1] + 0.35 * hr);
  ctx.bezierCurveTo(c[0] - 1.3 * hr, c[1] - 0.5 * hr, c[0] - 0.92 * hr, c[1] - 1.32 * hr, c[0], c[1] - 1.34 * hr);
  ctx.fill();
}

// Fabric details picked out by the rim light: hood opening, seams, pocket.
function kidDetails(ctx, J, h, pose, c, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(c, a);
  const hr = KP.headR * h;
  if (pose.view === 'front') {
    const hc = J.head;
    if (!pose.back) {
      // Deep shadow inside the hood, with its lit edge.
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(hc[0], hc[1] + 0.14 * hr, 0.66 * hr, 0.86 * hr, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = Math.max(1, h * 0.0055);
      ctx.beginPath(); ctx.ellipse(hc[0], hc[1] + 0.14 * hr, 0.66 * hr, 0.86 * hr, 0, Math.PI * 0.85, Math.PI * 2.15); ctx.stroke();
      // Kangaroo pocket.
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = Math.max(1, h * 0.0035);
      ctx.beginPath();
      ctx.moveTo(-0.085 * h, -0.012 * h); ctx.lineTo(-0.066 * h, -0.088 * h); ctx.lineTo(0.066 * h, -0.088 * h); ctx.lineTo(0.085 * h, -0.012 * h);
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = Math.max(1, h * 0.004);
      ctx.beginPath(); ctx.moveTo(hc[0], hc[1] - 1.3 * hr); ctx.quadraticCurveTo(hc[0] + 0.05 * hr, hc[1] + 0.2 * hr, hc[0], hc[1] + 1.4 * hr); ctx.stroke();
    }
  } else {
    const f = J.f;
    ctx.save();
    ctx.translate(J.head[0], J.head[1]);
    ctx.rotate(J.ha * f);
    ctx.scale(f, 1);
    ctx.lineWidth = Math.max(1, h * 0.005);
    ctx.beginPath();
    ctx.moveTo(0.93 * hr, 0.5 * hr);
    ctx.quadraticCurveTo(1.18 * hr, -0.15 * hr, 0.7 * hr, -0.9 * hr);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ---------- public draw ----------
// x, y: ground point under the pelvis (or pelvis position if pose.fixed). h: height in px.
// style: { rim:{c,a,dx,dy}, aura:{c,a,blur}, eyes:{c,a}, alpha, light:{c}, fill, pendant:{c,a},
//          lit (0..1 how much base color shows), tint (key light color), generic (plain hooded figure) }
// By default this draws the detailed Kid (lead.js). style.generic draws the plain hooded silhouette,
// used for crowds. style.fill or style.light draw the Kid as a flat silhouette (reflections, ghosts).
function drawKid(ctx, x, y, h, pose, style = {}) {
  const view = pose.view || 'side';
  const J = view === 'side' ? sideJoints(pose, h) : frontJoints(pose, h);
  let py = y;
  if (!pose.fixed) {
    let low;
    if (view === 'side') {
      low = Math.max(J.B.ankle[1], J.F.ankle[1]) + 0.05 * h;
      if (pose.groundHands) low = Math.max(low, J.AB.hand[1] + 0.05 * h, J.AF.hand[1] + 0.05 * h, J.B.knee[1] + 0.055 * h, J.F.knee[1] + 0.055 * h);
    } else {
      low = Math.max(J.L.ankle[1], J.R.ankle[1]) + 0.065 * h;
    }
    py = y - low;
  }
  const generic = !!style.generic;
  const draw = (col) => {
    if (generic) return (view === 'side' ? sideShapes : frontShapes)(ctx, J, h, col || rgba(style.fill || PAL.ink, 1));
    if (col) return (view === 'side' ? leadSide : leadFront)(ctx, J, h, pose, null, col);
    return (view === 'side' ? leadSide : leadFront)(ctx, J, h, pose, leadShade(style), null);
  };
  ctx.save();
  if (style.alpha !== undefined) ctx.globalAlpha = style.alpha;
  const baseAlpha = ctx.globalAlpha;
  ctx.translate(x, py);
  if (pose.rot) ctx.rotate(pose.rot);
  if (pose.scaleX) ctx.scale(pose.scaleX, 1);
  if (style.aura) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = baseAlpha * style.aura.a;
    ctx.filter = `blur(${style.aura.blur || h * 0.04}px)`;
    draw(rgba(style.aura.c, 1));
    ctx.restore();
  }
  if (style.rim) {
    const r = style.rim;
    ctx.save();
    ctx.globalAlpha = baseAlpha * (r.a === undefined ? 1 : r.a);
    ctx.translate((r.dx || 0) * h, (r.dy || 0) * h);
    draw(rgba(r.c, 1));
    ctx.restore();
  }
  if (style.light) draw(rgba(style.light.c, 1));
  else if (style.fill || generic) draw(generic ? null : rgba(style.fill, 1));
  else draw(null);
  if (generic && style.rim && style.detail !== false) kidDetails(ctx, J, h, pose, style.rim.c, 0.55 * (style.rim.a === undefined ? 1 : style.rim.a));
  if (style.pendant && view === 'front' && !pose.back) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, J.neck[0], J.neck[1] + 0.08 * h, h * 0.05, style.pendant.c, 0.7 * (style.pendant.a || 1));
    ctx.restore();
  }
  if (style.eyes) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const e = style.eyes;
    if (view === 'front') {
      for (const s of [-1, 1]) glow(ctx, J.head[0] + s * 0.022 * h, J.head[1] - 0.003 * h, h * 0.03, e.c, e.a || 1, 1);
    } else {
      glow(ctx, J.head[0] + J.f * 0.042 * h, J.head[1] - 0.006 * h, h * 0.026, e.c, e.a || 1, 1);
    }
    ctx.restore();
  }
  ctx.restore();
  return { J, px: x, py };
}
