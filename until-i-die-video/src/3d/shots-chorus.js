// Shot builders for the choruses (and the ascent that closes the last one).
import * as THREE from 'three';
import { SHOT_BUILDERS, COLORWAYS, baseScene, moveCam, rimSetup, addLead, placeShadow, beatPulse, BEAT } from './shots.js';
import { toon, inked, glowMat, LOOK } from './toon.js';
import * as K from './kit.js';
import { POSES, REST, blend, layer, idle, walk } from './poses.js';
import { clamp, lerp, sstep, smooth, easeInOut, easeOut, easeIn, noise1, fbm1, hash, mulberry32, TAU } from './util.js';
import { SECTION_STARTS } from './timeline.js';

const chorusHit = (I, sharp = 6) => (I.section.startsWith('chorus') ? beatPulse(I.t, SECTION_STARTS[I.section], sharp) : 0);

// Singing mouth: opens and closes in phrases, not a steady flap.
export function singMouth(t, seed = 0) {
  const phrase = sstep(-0.2, 0.3, noise1(t * 0.9, seed + 40));
  const syl = 0.5 + 0.5 * Math.sin(t * 9.5 + 2 * Math.sin(t * 2.3 + seed));
  return clamp(0.08 + 0.6 * phrase * syl);
}

// ---------------------------------------------------------------- lone walk with an orb of light
SHOT_BUILDERS.walk = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: cw.fog, density: 0.06, sky: cw.sky, fov: 30 });
  K.lights(scene, { ambient: 0x2a1c44, ambientI: 0.5, keyI: 0.35, back: cw.rim, backI: 1.3, backPos: [-4, 3, -3] });
  scene.add(K.ground({ color: 0x0c0916 }));
  scene.add(K.stars({ n: 1200, seed: 5 }));
  const mist = K.cloudLayer({ count: 60, area: [90, 16], y: 0.35, size: [5, 11], color: new THREE.Color(cw.rim).multiplyScalar(0.55), opacity: 0.35, seed: 3 });
  mist.position.z = -3;
  scene.add(mist);
  scene.add(K.particles({ count: 500, box: [60, 3.5, 10], center: [20, 1.6, -1], vel: [0, 0.03, 0], color: 0xd8c8ff, size: 3, opacity: 0.7, seed: 12 }));
  const ch = addLead(scene);
  ch.group.rotation.y = Math.PI / 2;
  // The orb: a hot core, a halo, and a light that paints his face.
  const orb = new THREE.Group();
  orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), glowMat(0xffffff, 3)));
  orb.add(K.glowSprite(cw.rim, 0.9, 0.9), K.glowSprite(0xffffff, 0.25, 1));
  const orbLight = new THREE.PointLight(new THREE.Color(cw.rim).lerp(new THREE.Color(0xffffff), 0.4), 5, 4, 1.5);
  orb.add(orbLight);
  scene.add(orb);
  const floorGlow = K.puddleGlint(cw.rim, 1.4, 1.4, 0.35); scene.add(floorGlow);
  let x = 0;
  const focus = () => new THREE.Vector3(x, 1.3, 0);
  return {
    scene, camera, look: { bloom: 0.8, vig: 0.5 },
    beforeRender: rimSetup(cw.rim, [0.6, 0.4, -0.3], 1.1)(camera, focus),
    update(I) {
      const lt = I.lt + 2;
      const w = walk(lt, { period: 1.15 });
      x = w.dist - 2.4;
      ch.group.position.x = x;
      const pose = layer(w.pose, { head: [0.08, -0.05, 0], neck: [0.05, 0, 0] });
      pose.face = { look: [0.3, 0.3], seed: 2 };
      pose.wind = 0.35;
      ch.update(I.t, pose);
      placeShadow(ch);
      const bob = Math.sin(I.t * 2.2) * 0.05;
      orb.position.set(x + 0.42 + 0.05 * Math.sin(I.t * 1.3), 1.62 + bob, 0.28);
      orbLight.intensity = 5 + 1.5 * chorusHit(I);
      floorGlow.position.set(orb.position.x, 0.012, 0.3);
      moveCam(camera, I, [x + 0.2, 1.2, 4.6], [x + 0.35, 1.3, 3.9], [x + 0.3, 1.25, 0], [x + 0.4, 1.35, 0], { ease: t => t });
      camera.zoom = 1 + 0.012 * chorusHit(I); camera.updateProjectionMatrix();
      mist.children.forEach((s, i) => { s.position.x = s.userData.base.x + Math.sin(I.t * 0.2 + i) * 1.5; });
    },
  };
};

// ---------------------------------------------------------------- giant eye with a static pupil
function eyeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: K.TIME, uGlow: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime, uGlow; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 p = (vUv - 0.5) * vec2(2.0, 1.0);
        float lid = 0.42 * (1.0 - p.x * p.x) ;
        float inside = smoothstep(lid + 0.01, lid - 0.01, abs(p.y));
        float r = length(p - vec2(0.05, 0.0));
        vec3 sclera = mix(vec3(0.75, 0.68, 0.92), vec3(0.35, 0.25, 0.55), smoothstep(0.1, 0.5, abs(p.y) / max(lid, 0.01)));
        float ang = atan(p.y, p.x - 0.05);
        float fib = 0.5 + 0.5 * sin(ang * 60.0 + h(vec2(floor(ang * 20.0), 1.0)) * 6.0);
        vec3 iris = mix(vec3(0.25, 0.1, 0.5), vec3(0.75, 0.5, 1.0), fib * smoothstep(0.34, 0.17, r));
        float irisM = smoothstep(0.36, 0.34, r);
        float pupM = smoothstep(0.19, 0.17, r);
        vec2 cell = floor(vUv * vec2(260.0, 130.0)) + floor(uTime * 24.0) * 17.0;
        float n = h(cell);
        vec3 stat = vec3(n) * 0.9 + 0.1 * vec3(0.7, 0.6, 1.0);
        vec3 c = mix(sclera, iris, irisM);
        c = mix(c, stat, pupM);
        c += vec3(0.6, 0.4, 1.0) * smoothstep(0.37, 0.35, r) * smoothstep(0.3, 0.36, r) * 1.5;
        float shade = smoothstep(lid, lid * 0.4, abs(p.y + 0.12));
        c *= 0.55 + 0.45 * shade;
        float lidLine = smoothstep(0.03, 0.0, abs(abs(p.y) - lid)) * step(abs(p.x), 1.0);
        vec3 col = c * inside * uGlow + vec3(0.55, 0.35, 0.9) * lidLine * 0.8;
        float a = max(inside, lidLine * 0.8);
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true, depthWrite: false, fog: false,
  });
}

SHOT_BUILDERS.eye = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: cw.fog, density: 0.012, sky: cw.sky, fov: 40 });
  K.lights(scene, { ambient: 0x2a1c44, ambientI: 0.5, keyI: 0.2, back: cw.rim, backI: 1.6, backPos: [0, 6, -6] });
  scene.add(K.stars({ n: 800, seed: 8 }));
  const eye = new THREE.Mesh(new THREE.PlaneGeometry(130, 65), eyeMaterial());
  eye.position.set(10, 62, -150);
  eye.lookAt(0, 2, 6);
  scene.add(eye);
  const eyeGlow = K.glowSprite(cw.rim, 260, 0.35); eyeGlow.position.copy(eye.position); scene.add(eyeGlow);
  const storm = K.cloudLayer({ count: 70, area: [260, 60], y: 62, size: [40, 90], color: 0x3a2a60, opacity: 0.55, seed: 9 });
  storm.position.z = -150;
  scene.add(storm);
  scene.add(K.city({ seed: 21, count: 120, x: [-160, 160], z: [-140, -45], h: [6, 26], w: [6, 14], litColor: [220, 170, 255], litRatio: 0.2 }));
  const roof = inked(new THREE.Mesh(new THREE.BoxGeometry(12, 1, 12), toon(0x120e1a, { rim: 0 })), 0.6);
  roof.position.set(0, -0.5, -2); scene.add(roof);
  const ledge = inked(new THREE.Mesh(new THREE.BoxGeometry(12, 0.35, 0.3), toon(0x1a1424, { rim: 0.4 })), 0.8);
  ledge.position.set(0, 0.17, -5); scene.add(ledge);
  scene.add(K.rain({ count: 3000, box: [16, 12, 16], center: [0, 5, -1], opacity: 0.22 }));
  const ch = addLead(scene);
  ch.group.rotation.y = Math.PI;
  const bolt = new THREE.Mesh(new THREE.PlaneGeometry(3, 60), new THREE.MeshBasicMaterial({ map: K.glowTexture(), color: 0xd8c8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  bolt.position.set(-50, 55, -140); bolt.rotation.z = 0.2; scene.add(bolt);
  const focus = () => new THREE.Vector3(0, 1.5, 0);
  return {
    scene, camera, look: { bloom: 0.85, vig: 0.55 },
    beforeRender: rimSetup(cw.rim, [0, 0.8, -0.6], 1.2)(camera, focus),
    update(I) {
      const pose = layer(POSES.rest, idle(I.t, 0.6));
      pose.head = [-0.55, 0.05, 0]; pose.neck = [-0.2, 0, 0]; pose.spine = [-0.05, 0, 0];
      pose.wind = 0.3;
      ch.update(I.t, pose);
      placeShadow(ch);
      const strike = sstep(0.55, 0.58, I.p) * (1 - sstep(0.6, 0.75, I.p));
      bolt.material.opacity = strike * 0.9;
      eye.material.uniforms.uGlow.value = 1 + 0.6 * strike + 0.3 * chorusHit(I);
      storm.children.forEach((s, i) => { const b = s.userData.base, a = I.t * 0.03 + i; s.position.x = b.x + Math.cos(a) * 6; s.position.y = b.y + Math.sin(a) * 3; });
      moveCam(camera, I, [0.9, 0.7, 3.4], [0.7, 0.8, 2.8], [0.8, 17, -45], [1.2, 20, -45], { ease: easeOut });
      scene.fog.color.setHex(cw.fog).lerp(new THREE.Color(0x8070c0), strike * 0.3);
    },
  };
};

// ---------------------------------------------------------------- performance: neon, rain, hand over heart
SHOT_BUILDERS.perform = (params, v) => {
  const cw = COLORWAYS[v];
  const close = !!params.close;
  const { scene, camera } = baseScene({ fog: 0x0a0612, density: 0.08, fov: close ? 28 : 32 });
  K.lights(scene, { ambient: 0x221838, ambientI: 0.45, key: 0xffe4d8, keyI: 1.1, keyPos: [1.5, 2.5, 3], back: cw.neonA, backI: 1.4, backPos: [-2, 2.5, -3] });
  scene.add(K.ground({ color: 0x08060e }));
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), toon(0x0c0914, { rim: 0 })); wall.position.set(0, 5, -3.5); scene.add(wall);
  const tubes = [];
  [[-1.9, cw.neonA], [-1.0, cw.neonB], [1.0, cw.neonB], [1.9, cw.neonA]].forEach(([x, c], i) => {
    const tb = K.neonTube([x, 0.2, -2.6], [x, 3.4, -2.6], c, close ? 3.5 : 6, 0.03);
    scene.add(tb); tubes.push(tb);
    const gl = K.puddleGlint(c, 3.2, 0.5, 0.35); gl.position.set(x * 0.9, 0.012, -1.1); scene.add(gl);
  });
  const pl = new THREE.PointLight(cw.neonA, 3, 6, 1.5); pl.position.set(-1.5, 2, -2); scene.add(pl);
  const pl2 = new THREE.PointLight(cw.neonB, 2, 6, 1.5); pl2.position.set(1.5, 2, -2); scene.add(pl2);
  const haze = K.cloudLayer({ count: 22, area: [8, 3], y: 0.4, size: [2.5, 5], color: new THREE.Color(cw.neonA).multiplyScalar(0.5), opacity: 0.4, seed: 14 });
  haze.position.z = -1.5; scene.add(haze);
  scene.add(K.rain({ count: 2000, box: [6, 5, 3], center: [0, 2.5, -1.3], opacity: 0.3, speed: 11 }));
  const ch = addLead(scene, { shadowOpacity: 0.4 });
  const seed = hash(Math.round(v * 10 + (close ? 3 : 0)), 5) * 10;
  const focus = () => new THREE.Vector3(0, close ? 1.62 : 1.45, 0);
  return {
    scene, camera, look: { bloom: 0.9, vig: 0.5 },
    beforeRender: rimSetup(cw.neonA, [-0.7, 0.4, -0.2], 1.4)(camera, focus),
    update(I) {
      const hit = chorusHit(I, 5);
      tubes.forEach((tb, i) => { tb.userData.tube.material.color.copy(tb.userData.color).multiplyScalar(tb.userData.base * (0.7 + 0.6 * hit) * (0.93 + 0.07 * Math.sin(I.t * 30 + i))); });
      pl.intensity = 2.5 + 3 * hit; pl2.intensity = 1.5 + 2 * hit;
      const sway = Math.sin(I.t * 1.1 + seed);
      const pose = layer(POSES.heart, idle(I.t, 1.2, seed));
      pose.head = [-0.2 + 0.05 * Math.sin(I.t * 1.7), 0.08 * sway, 0.06 * sway];
      pose.neck = [-0.08, 0, 0];
      pose.spine = [-0.04, 0.05 * sway, 0];
      pose.face = { closed: 1, mouth: singMouth(I.t, seed), brow: 0.5 };
      pose.wind = 0.3;
      ch.update(I.t, pose);
      placeShadow(ch);
      if (close) moveCam(camera, I, [0.22, 1.66, 1.25], [0.14, 1.66, 1.02], [0, 1.6, 0], [0, 1.62, 0], { ease: smooth });
      else moveCam(camera, I, [0.45, 1.42, 2.6], [0.3, 1.46, 2.15], [0, 1.4, 0], [0, 1.45, 0], { ease: smooth });
      camera.zoom *= 1 + 0.01 * hit; camera.updateProjectionMatrix();
    },
  };
};

// ---------------------------------------------------------------- mirror shards orbiting him
SHOT_BUILDERS.shards = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x07040e, density: 0.07, fov: 34 });
  K.lights(scene, { ambient: 0x201636, ambientI: 0.5, keyI: 0.5, back: cw.rim, backI: 1.5 });
  scene.add(K.ground({ color: 0x07050c }));
  const rnd = mulberry32(31 + v);
  const shardMat = new THREE.MeshPhongMaterial({ color: 0x1c1430, specular: 0xffffff, shininess: 140, emissive: new THREE.Color(cw.rim).multiplyScalar(0.08), flatShading: true, side: THREE.DoubleSide });
  const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(cw.rim).multiplyScalar(1.6), transparent: true, opacity: 0.8 });
  const shards = [];
  for (let i = 0; i < 70; i++) {
    const s = new THREE.Shape();
    const n = 3 + (rnd() < 0.4 ? 1 : 0), R = 0.15 + rnd() * 0.35;
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU + rnd() * 0.8; const r = R * (0.5 + rnd() * 0.7); k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.015, bevelEnabled: false });
    const m = new THREE.Mesh(geo, shardMat);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edgeMat));
    const rad = 1.0 + rnd() * 2.2, ang = rnd() * TAU, y = 0.2 + rnd() * 3.0;
    m.userData = { rad, ang, y, spin: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.4), sp: (rnd() - 0.5) * 0.25 + 0.12, ph: rnd() * TAU };
    scene.add(m); shards.push(m);
  }
  const l1 = new THREE.PointLight(cw.rim, 8, 7, 1.5), l2 = new THREE.PointLight(0x70d8ff, 6, 7, 1.5);
  scene.add(l1, l2);
  scene.add(K.particles({ count: 300, box: [8, 4, 8], center: [0, 2, 0], vel: [0, 0.08, 0], kind: 'spark', color: 0xe8dcff, size: 5, seed: 17 }));
  const ch = addLead(scene);
  const focus = () => new THREE.Vector3(0, 1.3, 0);
  return {
    scene, camera, look: { bloom: 0.85, vig: 0.5 },
    beforeRender: rimSetup(cw.rim, [0.5, 0.5, -0.4], 1.2)(camera, focus),
    update(I) {
      const t = I.t;
      shards.forEach(m => {
        const u = m.userData, a = u.ang + t * u.sp;
        m.position.set(Math.cos(a) * u.rad, u.y + 0.15 * Math.sin(t * 0.8 + u.ph), Math.sin(a) * u.rad);
        m.rotation.set(u.spin.x * t + u.ph, u.spin.y * t, u.spin.z * t);
      });
      l1.position.set(Math.cos(t * 0.9) * 2.5, 2.2, Math.sin(t * 0.9) * 2.5);
      l2.position.set(Math.cos(-t * 0.7 + 2) * 2.5, 1.0, Math.sin(-t * 0.7 + 2) * 2.5);
      const pose = layer(blend(POSES.rest, POSES.spread, 0.25), idle(t, 1));
      pose.head = [-0.18, 0.1 * Math.sin(t * 0.5), 0]; pose.face = { look: [0.2, -0.4], seed: 4 };
      pose.wind = 0.3;
      ch.update(t, pose);
      placeShadow(ch);
      const orbit = -0.5 + I.p * 0.6;
      moveCam(camera, I, [Math.sin(orbit) * 3.4, 0.45, Math.cos(orbit) * 3.4], [Math.sin(orbit + 0.3) * 2.8, 0.6, Math.cos(orbit + 0.3) * 2.8], [0, 1.5, 0], [0, 1.5, 0], { ease: t => t });
      camera.zoom *= 1 + 0.01 * chorusHit(I); camera.updateProjectionMatrix();
    },
  };
};

// ---------------------------------------------------------------- floating photos bleeding ink
function photoTexture(kind) {
  const c = document.createElement('canvas'); c.width = 360; c.height = 440;
  const g = c.getContext('2d');
  g.fillStyle = '#efe8dc'; g.fillRect(0, 0, 360, 440);
  g.save(); g.beginPath(); g.rect(24, 24, 312, 312); g.clip();
  const sky = g.createLinearGradient(0, 24, 0, 336);
  const pal = [['#ff9a5a', '#c04a8a', '#3a1a5a'], ['#6a4aa0', '#2a1a4a', '#120a22'], ['#ffb070', '#e06a6a', '#6a3a8a'], ['#1a1030', '#2a1a50', '#40306a']][kind];
  sky.addColorStop(0, pal[2]); sky.addColorStop(0.6, pal[1]); sky.addColorStop(1, pal[0]);
  g.fillStyle = sky; g.fillRect(24, 24, 312, 312);
  if (kind === 0) {
    g.fillStyle = '#ffe0a0'; g.beginPath(); g.arc(200, 240, 40, 0, TAU); g.fill();
    g.fillStyle = '#1a0e24'; g.beginPath(); g.moveTo(24, 336); g.quadraticCurveTo(180, 200, 336, 300); g.lineTo(336, 336); g.fill();
    g.fillRect(120, 240, 4, 40); g.beginPath(); g.arc(122, 236, 16, 0, TAU); g.fill();
  } else if (kind === 1) {
    g.fillStyle = '#140c20'; g.fillRect(24, 290, 312, 46);
    g.beginPath(); g.moveTo(110, 290); g.lineTo(110, 210); g.lineTo(180, 160); g.lineTo(250, 210); g.lineTo(250, 290); g.fill();
    g.fillStyle = '#ffd890'; g.fillRect(160, 225, 30, 30);
    g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 30; i++) g.fillRect(30 + (i * 97) % 300, 30 + (i * 53) % 150, 2, 2);
  } else if (kind === 2) {
    g.fillStyle = '#1a0e24'; g.fillRect(24, 300, 312, 36);
    g.strokeStyle = '#1a0e24'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(120, 300); g.lineTo(150, 170); g.lineTo(250, 170); g.lineTo(280, 300); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(180, 170); g.lineTo(180, 250); g.moveTo(220, 170); g.lineTo(220, 240); g.stroke();
    g.fillStyle = '#1a0e24'; g.fillRect(170, 250, 22, 6); g.fillRect(210, 240, 22, 6);
    g.beginPath(); g.arc(181, 236, 8, 0, TAU); g.arc(221, 226, 8, 0, TAU); g.fill();
  } else {
    g.fillStyle = '#0a0612';
    for (let i = 0; i < 12; i++) { const w = 18 + (i * 37) % 30, h = 60 + (i * 71) % 150; g.fillRect(24 + i * 27, 336 - h, w, h); }
    g.fillStyle = '#ffd0a0'; for (let i = 0; i < 60; i++) g.fillRect(30 + (i * 67) % 300, 200 + (i * 41) % 130, 3, 4);
  }
  g.restore();
  // Ink bleeding down from the image into the white border.
  g.fillStyle = '#0c0714';
  for (let i = 0; i < 9; i++) {
    const x = 40 + ((i * 71 + kind * 29) % 280), len = 30 + ((i * 53 + kind * 17) % 90), w = 5 + (i % 3) * 3;
    g.fillRect(x - w / 2, 300, w, len + 36);
    g.beginPath(); g.arc(x, 336 + len, w * 0.9, 0, TAU); g.fill();
  }
  g.globalAlpha = 0.5; g.fillRect(24, 318, 312, 22); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

SHOT_BUILDERS.photos = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x0c0718, density: 0.06, fov: 36 });
  K.lights(scene, { ambient: 0x3a2c54, ambientI: 0.8, keyI: 0.6, back: cw.rim, backI: 1 });
  const photos = [];
  const rnd = mulberry32(51);
  const texs = [0, 1, 2, 3].map(photoTexture);
  for (let i = 0; i < 11; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ map: texs[i % 4], side: THREE.DoubleSide, color: 0xd8d0e0 }));
    m.userData = { p: new THREE.Vector3((rnd() - 0.5) * 6, 0.6 + rnd() * 2.8, -rnd() * 5), r: new THREE.Vector3((rnd() - 0.5) * 0.8, (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.9), sp: rnd() };
    scene.add(m); photos.push(m);
  }
  // Ink drops falling from the photos.
  const inkMat = new THREE.MeshBasicMaterial({ color: 0x07040c });
  const drops = [];
  for (let i = 0; i < 60; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), inkMat); d.scale.y = 1.8; d.userData = { src: i % photos.length, ox: (rnd() - 0.5) * 0.7, ph: rnd(), sp: 0.5 + rnd() * 0.6 }; scene.add(d); drops.push(d); }
  scene.add(K.particles({ count: 260, box: [9, 5, 8], center: [0, 2, -2], vel: [0.05, 0.05, 0], color: 0xffc8b0, size: 3, opacity: 0.6, seed: 19 }));
  const warm = new THREE.PointLight(0xff9a70, 4, 8, 1.5); warm.position.set(2, 3, 1); scene.add(warm);
  const focus = () => new THREE.Vector3(0, 1.8, -2);
  return {
    scene, camera, look: { bloom: 0.7, vig: 0.5 },
    beforeRender: rimSetup(cw.rim)(camera, focus),
    update(I) {
      const t = I.t;
      photos.forEach((m, i) => {
        const u = m.userData;
        m.position.set(u.p.x + 0.2 * Math.sin(t * 0.4 + i), u.p.y + 0.15 * Math.sin(t * 0.55 + i * 2), u.p.z);
        m.rotation.set(u.r.x + 0.2 * Math.sin(t * 0.3 + i), u.r.y + t * 0.15 * (u.sp - 0.5), u.r.z + 0.1 * Math.sin(t * 0.5 + i));
        m.updateMatrixWorld();
      });
      const tmp = new THREE.Vector3();
      drops.forEach(d => {
        const u = d.userData, src = photos[u.src];
        const ph = (t * u.sp * 0.6 + u.ph) % 1;
        tmp.set(u.ox, -0.55, 0.01).applyMatrix4(src.matrixWorld);
        d.position.copy(tmp); d.position.y -= ph * ph * 2.4;
        d.visible = ph > 0.02;
      });
      moveCam(camera, I, [-1.2, 1.6, 3.2], [0.9, 2.0, 2.6], [-0.4, 1.8, -2], [0.4, 1.9, -2], { ease: t => t });
    },
  };
};

// ---------------------------------------------------------------- extreme close-up in the rain
SHOT_BUILDERS.closeup = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x06040c, density: 0.05, fov: 30 });
  scene.add(new THREE.AmbientLight(0x2a2040, 0.6));
  const magenta = new THREE.PointLight(cw.neonA, 2.5, 3, 1.2); magenta.position.set(0.9, 1.9, -0.3); scene.add(magenta);
  const cyan = new THREE.PointLight(cw.neonB, 1.2, 3, 1.2); cyan.position.set(-1.0, 1.5, 0.6); scene.add(cyan);
  const key = new THREE.DirectionalLight(0xffe6dc, 0.9); key.position.set(-1, 2, 3); scene.add(key);
  const rnd = mulberry32(61);
  for (let i = 0; i < 26; i++) {
    const s = K.glowSprite(i % 2 ? cw.neonA : cw.neonB, 0.3 + rnd() * 0.6, 0.25 + rnd() * 0.3);
    s.position.set((rnd() - 0.5) * 5, 0.8 + rnd() * 2.4, -2 - rnd() * 3);
    scene.add(s);
  }
  scene.add(K.rain({ count: 1400, box: [3, 2.4, 2], center: [0, 1.7, -1.3], opacity: 0.3, speed: 8, length: 0.2 }));
  const ch = addLead(scene, { shadow: false });
  const tear = params.tear ? 1 : 0;
  const focus = () => new THREE.Vector3(0, 1.66, 0);
  return {
    scene, camera, look: { bloom: 0.8, vig: 0.55 },
    beforeRender: rimSetup(cw.neonA, [0.8, 0.3, -0.2], 1.1)(camera, focus),
    update(I) {
      const pose = layer(REST, idle(I.t, 0.8, 3));
      pose.head = [0.12, -0.18, 0.08]; pose.neck = [0.05, 0, 0];
      pose.face = { blink: 0.42, look: [0.1, 0.5], tear: tear * sstep(0.1, 0.9, I.p), brow: 0.4, seed: 5 };
      pose.wind = 0.25;
      ch.update(I.t, pose);
      moveCam(camera, I, [-0.05, 1.67, 0.62], [-0.02, 1.665, 0.5], [0.02, 1.655, 0], [0.02, 1.66, 0], { ease: smooth, shake: 0.4 });
    },
  };
};

// ---------------------------------------------------------------- rain on the window
function dropsMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: K.TIME },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      float h(float n){ return fract(sin(n) * 43758.5453); }
      void main(){
        vec2 uv = vUv * vec2(28.0, 1.0); float col = floor(uv.x); float fx = fract(uv.x) - 0.5;
        float sp = 0.05 + 0.12 * h(col * 3.1); float y = fract(h(col * 7.7) - uTime * sp);
        float d = (vUv.y - y); float trail = smoothstep(0.0, 0.25, d) * smoothstep(0.35, 0.0, d) * smoothstep(0.08, 0.0, abs(fx));
        float bead = smoothstep(0.012, 0.0, length(vec2(fx * 0.035, d)));
        vec2 g = vUv * vec2(60.0, 34.0); vec2 gi = floor(g); vec2 gf = fract(g) - 0.5;
        float dot = smoothstep(0.18, 0.05, length(gf + vec2(h(gi.x * 1.3 + gi.y) - 0.5, h(gi.y * 2.1 + gi.x) - 0.5) * 0.5)) * step(0.72, h(gi.x * 91.0 + gi.y * 7.0));
        float a = trail * 0.18 + bead * 0.45 + dot * 0.18;
        gl_FragColor = vec4(vec3(0.85, 0.82, 1.0) * a, 1.0);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

SHOT_BUILDERS.window = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x0a0616, density: 0.012, sky: cw.sky, fov: 34 });
  scene.add(new THREE.AmbientLight(0x241a3a, 0.5));
  const fill = new THREE.DirectionalLight(0x6a5a9a, 0.35); fill.position.set(-2, 2, 4); scene.add(fill);
  const win = new THREE.DirectionalLight(new THREE.Color(cw.rim).lerp(new THREE.Color(0xffffff), 0.5), 1.2); win.position.set(0.5, 2, -5); scene.add(win);
  const room = toon(0x100c18, { rim: 0 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), room); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // Wall with a big window opening (x -1.6..2.2, y 0.4..3.4) at z = -0.95.
  const wz = -0.95;
  const wallPart = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), room); m.position.set(x, y, wz); scene.add(m); };
  wallPart(4, 6, -3.6, 3); wallPart(4, 6, 4.2, 3); wallPart(3.8, 0.4, 0.3, 0.2); wallPart(3.8, 3, 0.3, 4.9);
  const frame = toon(0x1c1628, { rim: 0.6 });
  [[-1.6, 1.9, 0.08, 3.1], [2.2, 1.9, 0.08, 3.1], [0.3, 0.42, 3.8, 0.08], [0.3, 3.38, 3.8, 0.08], [0.9, 1.9, 0.06, 3.0], [0.3, 2.3, 3.8, 0.05]].forEach(([x, y, w, h]) => {
    const m = inked(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frame), 0.8); m.position.set(x, y, wz); scene.add(m);
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.0), dropsMaterial()); glass.position.set(0.3, 1.9, wz + 0.06); scene.add(glass);
  scene.add(K.city({ seed: 33, count: 90, x: [-120, 120], z: [-220, -60], h: [10, 60], w: [6, 14], litColor: [230, 180, 255], litRatio: 0.18 }));
  scene.add(K.stars({ n: 500, seed: 13 }));
  const bolt = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 45), new THREE.MeshBasicMaterial({ map: K.glowTexture(), color: 0xe0d0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  bolt.position.set(18, 30, -100); bolt.rotation.z = -0.25; scene.add(bolt);
  const ch = addLead(scene, { shadowOpacity: 0.5 });
  ch.group.rotation.y = Math.PI;
  ch.group.position.set(0.1, 0, -0.1);
  const focus = () => new THREE.Vector3(0.1, 1.5, -0.1);
  return {
    scene, camera, look: { bloom: 0.8, vig: 0.55 },
    beforeRender: rimSetup(new THREE.Color(cw.rim).lerp(new THREE.Color(0xffffff), 0.3), [0, 0.4, -1], 1.4)(camera, focus),
    update(I) {
      const s = sstep(0.28, 0.3, I.p) * (1 - sstep(0.32, 0.45, I.p)) + 0.6 * sstep(0.36, 0.37, I.p) * (1 - sstep(0.38, 0.5, I.p));
      bolt.material.opacity = s;
      win.intensity = 1.2 + 3 * s;
      scene.background.setHex(0x0a0616).lerp(new THREE.Color(0x9080d0), s * 0.4);
      const pose = layer(POSES.windowPalm, idle(I.t, 0.6));
      pose.head = [0.1, 0.1, 0]; pose.wind = 0.1;
      ch.update(I.t, pose);
      placeShadow(ch);
      moveCam(camera, I, [-0.9, 1.35, 4.6], [-0.6, 1.45, 3.8], [0.25, 1.75, -1], [0.25, 1.8, -1], { ease: smooth });
    },
  };
};

// ---------------------------------------------------------------- marionette under a spotlight
SHOT_BUILDERS.stage = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x050308, density: 0.05, fov: 32 });
  scene.add(new THREE.AmbientLight(0x1a1224, 0.35));
  const planks = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
    g.fillStyle = '#3a2418'; g.fillRect(0, 0, 512, 512);
    for (let x = 0; x < 512; x += 32) { g.fillStyle = `rgba(0,0,0,${0.2 + 0.2 * ((x / 32) % 2)})`; g.fillRect(x, 0, 2, 512); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t;
  })();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), toon(0xffffff, { map: planks, rim: 0 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const curtMat = toon(0x5a0e1c, { rim: 0.5 });
  for (const s of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(3, 7, 40, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 7) * 0.12);
    geo.computeVertexNormals();
    const c = new THREE.Mesh(geo, curtMat); c.position.set(s * 4.2, 3.5, -1.5); c.rotation.y = -s * 0.35; scene.add(c);
  }
  const spot = new THREE.SpotLight(0xfff4e6, 60, 14, 0.32, 0.5, 1.5); spot.position.set(0, 9, 0.5); spot.target.position.set(0, 0, 0); scene.add(spot, spot.target);
  const cone = K.lightCone(9, 2.4, 0xfff0dd, 0.16); cone.position.set(0, 9, 0.2); scene.add(cone);
  const pool = K.puddleGlint(0xfff0dd, 3.2, 3.2, 0.45); pool.position.set(0, 0.01, 0.1); scene.add(pool);
  scene.add(K.particles({ count: 300, box: [3, 8, 3], center: [0, 4, 0.2], vel: [0.02, -0.03, 0], color: 0xfff4e6, size: 3, opacity: 0.6, seed: 23 }));
  const strMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6e8).multiplyScalar(1.5), transparent: true, opacity: 0.8 });
  const strings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 5), strMat); scene.add(m); return m; });
  const ch = addLead(scene);
  const focus = () => new THREE.Vector3(0, 1.3, 0);
  const tmp = new THREE.Vector3(), top = new THREE.Vector3();
  return {
    scene, camera, look: { bloom: 0.75, vig: 0.6 },
    beforeRender: rimSetup(0xfff0dd, [0, 1, -0.2], 0.9)(camera, focus),
    update(I) {
      const t = I.t;
      const tugL = Math.pow(Math.max(0, Math.sin(t * 2.3)), 6), tugR = Math.pow(Math.max(0, Math.sin(t * 2.3 + 2.1)), 6);
      const pose = { ...POSES.limp };
      pose.upperArmL = [-0.25 * tugL, 0, 0.14 + 0.5 * tugL]; pose.foreArmL = [-0.1 - 0.5 * tugL, 0, 0];
      pose.upperArmR = [-0.25 * tugR, 0, -0.14 - 0.5 * tugR]; pose.foreArmR = [-0.1 - 0.5 * tugR, 0, 0];
      pose.head = [0.55 - 0.3 * Math.max(tugL, tugR), 0.1 * Math.sin(t * 0.7), 0.15];
      pose.hipsPos = [0, 0.02 * Math.max(tugL, tugR), 0];
      pose.face = { closed: 1 };
      ch.update(t, pose);
      placeShadow(ch);
      ch.group.updateMatrixWorld(true);
      const anchors = [ch.bones.handL, ch.bones.handR, ch.bones.upperArmL, ch.bones.upperArmR];
      anchors.forEach((b, i) => {
        b.getWorldPosition(tmp);
        top.set(tmp.x * 0.6, 9, tmp.z);
        const m = strings[i];
        m.position.copy(tmp).add(top).multiplyScalar(0.5);
        m.scale.y = tmp.distanceTo(top);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(tmp).normalize());
      });
      moveCam(camera, I, [0, 1.4, 5.8], [0, 1.45, 4.6], [0, 1.6, 0], [0, 1.5, 0], { ease: smooth });
    },
  };
};

// ---------------------------------------------------------------- the party inside his head
function headProfile() {
  // Profile facing +x, about 9 m tall, feet of the outline at y = 0.
  const pts = [[-2.2, 0.2], [-2.4, 2.2], [-2.8, 4.2], [-2.6, 6.2], [-1.6, 7.9], [0.2, 8.7], [2.0, 8.3], [3.1, 6.9], [3.4, 5.4], [3.3, 4.6], [4.0, 3.6], [3.4, 3.4], [3.5, 2.8], [3.2, 2.4], [3.4, 2.0], [2.9, 1.2], [1.6, 1.0], [1.4, 0.2]];
  return new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal');
}

SHOT_BUILDERS.headParty = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x0a0514, density: 0.03, fov: 38 });
  K.lights(scene, { ambient: 0x2a1a44, ambientI: 0.6, keyI: 0.3, back: cw.neonA, backI: 1.6, backPos: [0, 4, -6] });
  scene.add(K.ground({ color: 0x07050c }));
  scene.add(K.stars({ n: 700, seed: 29 }));
  const outline = new THREE.Mesh(new THREE.TubeGeometry(headProfile(), 200, 0.07, 8, false), glowMat(cw.neonA, 4));
  outline.position.set(-0.6, 0, -9); outline.scale.setScalar(1.25);
  scene.add(outline);
  const outlineHalo = new THREE.Mesh(new THREE.TubeGeometry(headProfile(), 200, 0.3, 8, false), glowMat(cw.neonA, 0.6, { transparent: true, opacity: 0.25, additive: true }));
  outlineHalo.position.copy(outline.position); outlineHalo.scale.copy(outline.scale); scene.add(outlineHalo);
  // Lasers fanning out from inside the head.
  const lasers = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 30, 6), glowMat(i % 2 ? cw.neonB : cw.neonA, 5, { transparent: true, opacity: 0.8, additive: true }));
    m.geometry.translate(0, 15, 0);
    m.position.set(0.8, 5.5, -8.5);
    scene.add(m); lasers.push(m);
  }
  // Crowd: hooded silhouettes bouncing on the beat.
  const body = new THREE.CapsuleGeometry(0.22, 0.75, 4, 10); body.scale(1.2, 1, 0.8); body.translate(0, 0.58, 0);
  const headG = new THREE.SphereGeometry(0.16, 12, 10); headG.translate(0, 1.22, 0);
  const crowdMat = toon(0x0b0812, { rim: 0.55 });
  const rnd = mulberry32(71);
  const N = 110;
  const bodies = new THREE.InstancedMesh(body, crowdMat, N), heads = new THREE.InstancedMesh(headG, crowdMat, N);
  const spots = [];
  for (let i = 0; i < N; i++) {
    let x, z;
    do { x = (rnd() - 0.5) * 12; z = -1 - rnd() * 7; } while (Math.abs(x) < 0.9 && z > -2.5);
    spots.push([x, z, rnd() * TAU, 0.85 + rnd() * 0.3]);
  }
  scene.add(bodies, heads);
  // Heartbeat line along the floor of the head.
  const ecgN = 240;
  const ecgGeo = new THREE.BufferGeometry();
  ecgGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ecgN * 2 * 3), 3));
  const idx = []; for (let i = 0; i < ecgN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  ecgGeo.setIndex(idx);
  const ecg = new THREE.Mesh(ecgGeo, glowMat(0xff6ad0, 5, { side: THREE.DoubleSide }));
  ecg.frustumCulled = false;
  scene.add(ecg);
  const pulse = K.glowSprite(0xffffff, 1.2, 1); scene.add(pulse);
  scene.add(K.particles({ count: 400, box: [14, 8, 10], center: [0, 4, -4], vel: [0, -0.6, 0], kind: 'spark', color: 0xffc0ff, size: 6, seed: 37 }));
  const ch = addLead(scene, { shadowOpacity: 0.5 });
  ch.group.position.set(0, 0, -1.2);
  const focus = () => new THREE.Vector3(0, 1.6, -1.2);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  const sec = SECTION_STARTS;
  return {
    scene, camera, look: { bloom: 0.95, vig: 0.5 },
    beforeRender: rimSetup(cw.neonA, [0, 0.6, -0.8], 1.3)(camera, focus),
    update(I) {
      const t = I.t, from = sec[I.section] || 0;
      const hit = beatPulse(t, from, 4);
      const beatN = Math.floor((t - from) / BEAT.len);
      lasers.forEach((m, i) => {
        const a = Math.sin(t * 0.9 + i * 0.8) * 0.9, b = 0.35 + 0.25 * Math.sin(t * 0.6 + i);
        m.rotation.set(-Math.PI / 2 + b, 0, a);
        m.rotation.order = 'YXZ';
        m.material.opacity = 0.35 + 0.55 * hit;
      });
      spots.forEach(([x, z, ph, sc], i) => {
        const jump = Math.max(0, Math.sin((t - from) / BEAT.len * Math.PI + ph * 0.3)) * 0.22 * sc;
        P.set(x, jump, z); Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(ph + t) * 0.3); S.set(sc, sc, sc);
        M.compose(P, Q, S); bodies.setMatrixAt(i, M); heads.setMatrixAt(i, M);
      });
      bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
      // Heartbeat trace scrolling left, with a bright pulse riding it.
      const arr = ecgGeo.attributes.position.array;
      const x0 = -7, x1 = 7, yb = 0.55, zz = -6;
      const beatPos = ((t - from) / (BEAT.len * 2)) % 1;
      for (let i = 0; i < ecgN; i++) {
        const u = i / (ecgN - 1), x = lerp(x0, x1, u);
        const ph = ((u * 3 - (t - from) / (BEAT.len * 2)) % 1 + 1) % 1;
        const y = yb + (ph > 0.42 && ph < 0.46 ? (ph - 0.42) * 25 : ph >= 0.46 && ph < 0.5 ? 1 - (ph - 0.46) * 40 : ph >= 0.5 && ph < 0.53 ? -0.6 + (ph - 0.5) * 20 : 0) * 0.5;
        arr.set([x, y - 0.025, zz, x, y + 0.025, zz], i * 6);
      }
      ecgGeo.attributes.position.needsUpdate = true;
      pulse.position.set(lerp(x0, x1, beatPos), yb, zz + 0.05);
      // The lead jumps with the crowd, arms up.
      const jump = Math.max(0, Math.sin((t - from) / BEAT.len * Math.PI)) * 0.12;
      const pose = blend(POSES.rest, { ...POSES.rest, upperArmL: [-2.7, 0, 0.35], foreArmL: [-0.4, 0, 0], upperArmR: [-2.7, 0, -0.35], foreArmR: [-0.4, 0, 0], curlL: 0.8, curlR: 0.8 }, 0.5 + 0.5 * Math.sin(t * 1.3));
      pose.hipsPos = [0, jump, 0]; pose.lowerLegL = [0.3 * (1 - jump * 6), 0, 0]; pose.lowerLegR = [0.3 * (1 - jump * 6), 0, 0];
      pose.upperLegL = [-0.15 * (1 - jump * 6), 0, 0]; pose.upperLegR = [-0.15 * (1 - jump * 6), 0, 0];
      pose.head = [-0.25, 0.1 * Math.sin(t * 2), 0]; pose.face = { closed: 1, mouth: 0.35 + 0.3 * hit, smile: 1 };
      pose.wind = 0.5;
      ch.update(t, pose);
      placeShadow(ch);
      const loopBeat = beatN % 4 === 0 ? beatPulse(t, from, 8) : 0;
      this.look.flash = 0.06 * loopBeat;
      moveCam(camera, I, [1.2, 1.2, 3.2], [0.4, 1.6, 2.2], [0, 3.2, -6], [0, 3.6, -7], { ease: smooth, roll: 0.02 * Math.sin(t * 0.8) });
      camera.zoom *= 1 + 0.015 * hit; camera.updateProjectionMatrix();
    },
  };
};

// ---------------------------------------------------------------- ascent through the clouds
SHOT_BUILDERS.ascend = (params, v) => {
  const { scene, camera } = baseScene({ fog: 0x6a4a3a, density: 0.012, sky: [0x2a1a3a, 0xb07a50, 0xffd9a0], fov: 36 });
  K.lights(scene, { ambient: 0x6a5060, ambientI: 0.8, key: 0xffe0b0, keyI: 1.6, keyPos: [0, 10, 2], back: 0xffc070, backI: 1.8, backPos: [0, 6, -4] });
  const sun = K.glowSprite(0xffe6b0, 60, 0.9); sun.position.set(0, 60, -30); scene.add(sun);
  const layers = [0, 1, 2].map(i => { const c = K.cloudLayer({ count: 45, area: [70, 70], y: 0, size: [8, 20], color: 0xffe2c8, opacity: 0.6, seed: 41 + i }); scene.add(c); return c; });
  const rays = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 80), new THREE.MeshBasicMaterial({ map: K.glowTexture(), color: 0xffe0a0, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.position.set((i - 3) * 4, 30, -20); m.rotation.z = (i - 3) * 0.06; scene.add(m); rays.push(m);
  }
  scene.add(K.particles({ count: 400, box: [12, 16, 12], center: [0, 2, 0], vel: [0, 0.6, 0], color: 0xfff0c0, size: 5, seed: 43 }));
  const ch = addLead(scene, { shadow: false });
  const focus = () => new THREE.Vector3(0, 1.3, 0);
  return {
    scene, camera, look: { bloom: 1.0, vig: 0.4, exposure: 1.05 },
    beforeRender: rimSetup(0xffd090, [0, 1, -0.3], 1.3)(camera, focus),
    update(I) {
      const t = I.t;
      layers.forEach((c, i) => c.children.forEach((s, k) => {
        const span = 70, y = ((s.userData.base.y + i * 23 - I.lt * (6 + i * 3)) % span + span) % span - span / 2;
        s.position.set(s.userData.base.x, y, s.userData.base.z);
      }));
      rays.forEach((m, i) => { m.material.opacity = 0.12 + 0.08 * Math.sin(t * 0.8 + i); });
      const pose = blend(POSES.rest, POSES.spread, 0.35 + 0.1 * Math.sin(t));
      pose.head = [-0.5, 0, 0]; pose.neck = [-0.15, 0, 0]; pose.spine = [-0.08, 0, 0];
      pose.lowerLegL = [0.25, 0, 0]; pose.lowerLegR = [0.15, 0, 0]; pose.footL = [0.5, 0, 0]; pose.footR = [0.4, 0, 0];
      pose.face = { closed: 1, smile: 0.6 }; pose.wind = 0.9;
      ch.update(t, pose);
      ch.group.rotation.y = 0.2 * Math.sin(t * 0.3);
      moveCam(camera, I, [2.0, 0.1, 3.6], [1.5, 0.5, 2.9], [0, 1.5, 0], [0, 1.9, 0], { ease: smooth });
    },
  };
};
