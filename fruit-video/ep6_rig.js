'use strict';
/* Episode 6-only two-bone rig. All coordinates are character-local after the
 * engine body transform. The old rig remains byte-for-byte active for EP 1-5. */
(() => {
  const profiles = {
    straw: { arm: [71, 67], leg: [56, 51], shoulder: .88, hip: .30 },
    mango: { arm: [69, 65], leg: [55, 51], shoulder: .90, hip: .32 },
    kum:   { arm: [48, 46], leg: [42, 39], shoulder: .91, hip: .32 },
    melon: { arm: [76, 70], leg: [54, 51], shoulder: .92, hip: .34 },
    pear:  { arm: [65, 61], leg: [50, 48], shoulder: .91, hip: .32 },
  };
  let violations = [], grips = [], joints = [];
  const finite = v => Number.isFinite(v[0]) && Number.isFinite(v[1]);
  function beginFrame() { violations = []; grips = []; joints = []; }
  function IK(a, b, target, l1, l2, bend, label) {
    const dx = target[0] - a[0], dy = target[1] - a[1];
    const dist = Math.hypot(dx, dy) || .0001;
    const min = Math.abs(l1 - l2) + 4, max = l1 + l2 - 3;
    if (dist > max + 11 || dist < min - 11) violations.push(label + ': target outside arm/leg reach by ' + Math.round(dist > max ? dist - max : min - dist) + 'px');
    const d = Math.max(min, Math.min(max, dist));
    const ux = dx / dist, uy = dy / dist;
    const point = [a[0] + ux * d, a[1] + uy * d];
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const normal = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const elbow = [a[0] + ux * along - uy * normal * bend, a[1] + uy * along + ux * normal * bend];
    if (!finite(point) || !finite(elbow)) violations.push(label + ': non-finite joint');
    joints.push({ label, a, elbow, point, l1, l2 });
    return { elbow, hand: point };
  }
  function targetFor(o, k, side, pose, s) {
    const key = side < 0 ? 'l' : 'r';
    if (o.grip && o.grip[key]) return o.grip[key];
    const x = s[0], y = s[1], R = k.rx;
    const presets = {
      rest: [x + side * 17, y + 85],
      down: [x + side * 12, y + 91],
      hips: [side * R * .68, k.ry * .42],
      hold: [x + side * 25, y + 64],
      offer: [x + side * 87, y - 2],
      point: [x + side * 101, y - 25],
      stop: [x + side * 85, y - 57],
      up: [x + side * 44, y - 96],
      cheer: [x + side * 44, y - 96],
      wave: [x + side * (55 + 8 * Math.sin(T * 10)), y - 80],
      thumb: [x + side * 80, y - 37],
      phone: [side * R * .67, -k.ry * .23],
      shrug: [x + side * 60, y - 39],
      reach: [x + side * 87, y - 40],
    };
    return presets[pose] || presets.rest;
  }
  function drawArms(o, k, t) {
    const arms = o.arms || {}, P = profiles[o.kind] || {};
    for (const side of [-1, 1]) {
      const key = side < 0 ? 'l' : 'r', pose = arms[key] || 'rest';
      if (pose === 'none') continue;
      const S = P.shoulder == null ? shoulder(k, side) : [side*k.rx*P.shoulder, k.ry*(o.kind==='straw'?-.10:.10)];
      const l1 = P.arm?.[0] || k.arm1 || 56, l2 = P.arm?.[1] || k.arm2 || 52;
      let q = targetFor(o, k, side, pose, S);
      // Built-in acting poses adapt to each fruit's anatomy; explicit grip
      // targets do NOT get silently fixed, because misplaced props must fail QC.
      if (!(o.grip && o.grip[key])) {
        const dx=q[0]-S[0],dy=q[1]-S[1],d=Math.hypot(dx,dy),reach=l1+l2-6;
        if(d>reach)q=[S[0]+dx*reach/d,S[1]+dy*reach/d];
      }
      const { elbow, hand } = IK(S, S, q, l1, l2, -side, (o.id || o.kind) + '.' + key);
      ctx.save();
      ctx.strokeStyle = '#26212e'; ctx.lineWidth = 15; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(...S); ctx.lineTo(...elbow); ctx.lineTo(...hand); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(...S); ctx.lineTo(...elbow); ctx.stroke();
      ctx.fillStyle = '#302b38'; ell(...elbow, 9, 9); ctx.fill();
      const prop = o.hold && o.hold[key];
      if (prop) {
        drawProp(prop, hand[0], hand[1], side, o, t);
        const e = typeof PROP_BOX[prop] === 'function' ? PROP_BOX[prop](o) : PROP_BOX[prop];
        if (e && REG.on && !REG.suppress) {
          const [a,b,c,d] = e;
          regLocal('prop',hand[0]+a,hand[1]+b,hand[0]+c,hand[1]+d,
            { id:prop, owner:o.id||o.kind, nearFace:e.nearFace, transit:o.transit });
        }
        if (!(o.grip && o.grip[key])) violations.push((o.id||o.kind)+'.'+key+': held prop lacks explicit handle grip');
        grips.push({ label:(o.id||o.kind)+'.'+key, prop, hand, anchor:[hand[0],hand[1]], authored:o.grip?.[key] });
      }
      ctx.fillStyle = '#fbfaf5'; ctx.strokeStyle = '#20202a'; ctx.lineWidth = 3.5;
      ell(hand[0], hand[1], 16, 16); ctx.fill(); ctx.stroke();
      if (prop) { // thumb crosses the prop's handle; not a detached circular mitten
        ctx.strokeStyle = '#f9f8f0'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hand[0]-side*9,hand[1]-8);
        ctx.quadraticCurveTo(hand[0]+side*10,hand[1]-15,hand[0]+side*13,hand[1]+5); ctx.stroke();
        ctx.strokeStyle = '#24212a'; ctx.lineWidth = 2; ctx.stroke();
      }
      if (pose==='point') { ctx.fillStyle='#fbfaf5';ctx.strokeStyle='#24212a';ctx.lineWidth=3;
        rr(hand[0]+side*4-5,hand[1]-5,side*22,9,4);ctx.fill();ctx.stroke(); }
      ctx.restore();
    }
    return true;
  }
  function drawLegs(o,k,t) {
    const P=profiles[o.kind]||{}, len=k.leg||90, hipY=k.ry*(k.shape==='straw'?.7:.8);
    const Hx=P.hip!=null?k.rx*P.hip:k.hip||k.rx*.32;
    for(const side of [-1,1]){
      const key=side<0?'l':'r';
      const phase=o.walk==null?0:o.walk+(side===1?0:Math.PI);
      const stride=o.walk==null?0:Math.cos(phase)*19;
      const lift=o.walk==null?0:Math.max(0,Math.sin(phase))*14;
      // Hip is translated upward by walkBob in drawChar; compensate feet downward.
      const compensation=o.walk==null?0:Math.abs(Math.sin(o.walk))*9;
      const start=[side*Hx,hipY-12], foot=[side*Hx+stride,hipY+len-8-lift+compensation];
      const l1=P.leg?.[0]||len*.57, l2=P.leg?.[1]||len*.52;
      const {elbow,hand}=IK(start,start,foot,l1,l2,side,(o.id||o.kind)+'.leg.'+key);
      ctx.strokeStyle='#26212e';ctx.lineWidth=13;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(...start);ctx.lineTo(...elbow);ctx.lineTo(...hand);ctx.stroke();
      ctx.fillStyle=k.shoe||'#fff';ctx.strokeStyle='#1d1a22';ctx.lineWidth=3.5;
      ell(hand[0]+side*11+5,hand[1]+4,27,14);ctx.fill();ctx.stroke();
      ctx.fillStyle=k.shoe2||'#ddd';ell(hand[0]+side*11+5,hand[1]+10,23,5);ctx.fill();
    }
    return true;
  }
  function validateFrame() {
    const errors=[...violations];
    for(const j of joints){
      if(Math.abs(Math.hypot(j.a[0]-j.elbow[0],j.a[1]-j.elbow[1])-j.l1)>1)
        errors.push(j.label+': upper segment changed length');
      if(Math.abs(Math.hypot(j.point[0]-j.elbow[0],j.point[1]-j.elbow[1])-j.l2)>1)
        errors.push(j.label+': lower segment changed length');
    }
    for(const g of grips) {
      if(Math.hypot(g.hand[0]-g.anchor[0],g.hand[1]-g.anchor[1])>.1)
        errors.push(g.label+': hand detached from '+g.prop);
      if(g.authored && Math.hypot(g.hand[0]-g.authored[0],g.hand[1]-g.authored[1])>2)
        errors.push(g.label+': contact missed authored grip for '+g.prop);
    }
    return errors;
  }
  window.EP6_RIG={beginFrame,drawArms,drawLegs,validateFrame};
})();
