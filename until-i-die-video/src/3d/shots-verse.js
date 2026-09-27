// Shot builders for the two verses.
import * as THREE from 'three';
import { SHOT_BUILDERS, COLORWAYS, baseScene, moveCam, rimSetup, addLead, placeShadow, beatPulse, BEAT } from './shots.js';
import { toon, inked, glowMat, LOOK } from './toon.js';
import * as K from './kit.js';
import { POSES, REST, blend, layer, idle, walk, crawl, SIT_LEDGE, SIT_HUG } from './poses.js';
import { clamp, lerp, sstep, smooth, easeInOut, easeOut, easeIn, noise1, fbm1, hash, mulberry32, keyed, TAU } from './util.js';
import { SECTION_STARTS } from './timeline.js';

// Quick flickering flash for each strike time in a list (local seconds).
function strike(lt, times, len = 0.35) {
  let v = 0;
  for (const s of times) {
    const d = lt - s;
    if (d < 0 || d > len) continue;
    v = Math.max(v, Math.exp(-d * 9) * (0.75 + 0.25 * Math.sin(d * 60)));
  }
  return v;
}

// A bright zig-zag bolt made of glowing segments, regenerated per strike.
function boltMesh(color = 0xe6dcff) {
  const g = new THREE.Group();
  const mat = glowMat(color, 6, { transparent: true, opacity: 1, additive: true, fog: false });
  const halo = new THREE.MeshBasicMaterial({ map: K.glowTexture(), color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  g.userData.build = (seed, from, to) => {
    g.clear();
    const rnd = mulberry32(seed);
    let p = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to), n = 14;
    for (let i = 1; i <= n; i++) {
      const q = p.clone().lerp(end, 1 / (n - i + 1));
      if (i < n) q.add(new THREE.Vector3((rnd() - 0.5) * 6, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2));
      const len = p.distanceTo(q);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, len, 5), mat);
      seg.position.copy(p).add(q).multiplyScalar(0.5);
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize());
      g.add(seg);
      const hl = new THREE.Mesh(new THREE.PlaneGeometry(3, len * 1.2), halo);
      hl.position.copy(seg.position); hl.quaternion.copy(seg.quaternion);
      g.add(hl);
      p = q;
    }
  };
  return g;
}

// ---------------------------------------------------------------- demons
function makeDemon(rnd) {
  const g = new THREE.Group();
  const skin = toon(0x08060a, { rim: 1.4 });
  const h = 1.9 + rnd() * 0.7;
  const body = inked(new THREE.Mesh(new THREE.CapsuleGeometry(0.28, h * 0.5, 6, 14), skin), 1.2);
  body.scale.set(1, 1, 0.75); body.position.y = h * 0.45; g.add(body);
  const head = inked(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), skin), 1.2);
  head.scale.set(1, 1.15, 1); head.position.set(0, h * 0.86, 0.05); g.add(head);
  for (const s of [-1, 1]) {
    const horn = inked(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.55, 8), skin), 1);
    horn.position.set(s * 0.14, h * 0.86 + 0.28, 0); horn.rotation.z = -s * 0.45; g.add(horn);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), glowMat(0xff2030, 8));
    eye.position.set(s * 0.08, h * 0.87, 0.23); g.add(eye);
    const eg = K.glowSprite(0xff2030, 0.28, 0.8); eg.position.copy(eye.position); g.add(eg);
    const arm = new THREE.Group();
    arm.position.set(s * 0.32, h * 0.7, 0);
    const a = inked(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, h * 0.45, 4, 8), skin), 1);
    a.position.y = -h * 0.25; arm.add(a);
    const claw = inked(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), skin), 1);
    claw.position.y = -h * 0.52; claw.rotation.x = Math.PI; arm.add(claw);
    g.add(arm);
    g.userData['arm' + (s > 0 ? 'L' : 'R')] = arm;
  }
  g.userData.h = h;
  return g;
}

// ---------------------------------------------------------------- mirror with a glitching reflection
SHOT_BUILDERS.mirror = (params, v) => {
  const { scene, camera } = baseScene({ fog: 0x05070a, density: 0.05, fov: 34 });
  scene.add(new THREE.AmbientLight(0x2a3040, 0.5));
  const tube = new THREE.PointLight(0xcfffe6, 5, 6, 1.3); tube.position.set(0, 2.45, -0.7); scene.add(tube);
  const tubeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), glowMat(0xd8ffea, 4)); tubeMesh.rotation.z = Math.PI / 2; tubeMesh.position.set(0, 2.45, -1.1); scene.add(tubeMesh);
  const tiles = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#2a3a3c'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#141c1e'; g.lineWidth = 6;
    for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    const rnd = mulberry32(3); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(20,10,10,${rnd() * 0.25})`; g.fillRect(rnd() * 256, rnd() * 256, 8 + rnd() * 30, 20 + rnd() * 60); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 4); return t;
  })();
  const wallMat = toon(0xffffff, { map: tiles, rim: 0 });
  const wz = -1.2;
  // Wall with a mirror opening (x -0.75..0.75, y 1.1..2.2); behind it, the reflected room.
  [[4, 6, -2.75, 2], [4, 6, 2.75, 2], [1.5, 1.1, 0, 0.55], [1.5, 3, 0, 3.7]].forEach(([w, h, x, y]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), wallMat); m.position.set(x, y, wz); scene.add(m);
  });
  const back = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.1), wallMat); back.position.set(0, 2, -3.6); scene.add(back);
  const frameMat = toon(0x9aa0a8, { rim: 0.6 });
  [[0, 1.1, 1.6, 0.05], [0, 2.2, 1.6, 0.05], [-0.78, 1.65, 0.05, 1.15], [0.78, 1.65, 0.05, 1.15]].forEach(([x, y, w, h]) => {
    const m = inked(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), frameMat), 0.6); m.position.set(x, y, wz + 0.06); scene.add(m);
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ color: 0x9ad0c0, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false }));
  glass.position.set(0, 1.65, wz + 0.02); scene.add(glass);
  const sink = inked(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.5), toon(0xd8dde2, { rim: 0.4 })), 0.8); sink.position.set(0, 0.86, -0.95); scene.add(sink);
  const ped = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 12), toon(0xc8cdd2, { rim: 0.3 })), 0.8); ped.position.set(0, 0.4, -1.0); scene.add(ped);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), toon(0x1c2224, { rim: 0 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ch = addLead(scene);
  ch.group.rotation.y = Math.PI;
  ch.group.position.set(0, 0, -0.05);
  // The reflection: a mirrored twin standing in the room behind the glass.
  const twin = new Character2(scene);
  const focus = () => new THREE.Vector3(0, 1.65, -1.2);
  const look = { bloom: 0.6, vig: 0.6, ca: 1 };
  return {
    scene, camera, look,
    beforeRender: rimSetup(0xbfffe0, [0, 0.8, -0.5], 0.8)(camera, focus),
    lookAt: () => ({ ca: look.ca }),
    update(I) {
      const t = I.t;
      const fl = noise1(t * 11, 71) > 0.55 ? 0.35 : 1;
      tube.intensity = 5 * fl; tubeMesh.material.color.setRGB(0.85 * 4 * fl, 4 * fl, 0.92 * 4 * fl);
      const pose = layer({ ...REST, upperArmL: [-0.55, 0, 0.12], foreArmL: [-0.35, 0, 0], handL: [-0.6, 0, 0], upperArmR: [-0.55, 0, -0.12], foreArmR: [-0.35, 0, 0], handR: [-0.6, 0, 0], curlL: 0.3, curlR: 0.3, spine: [0.18, 0, 0], chest: [0.1, 0, 0] }, idle(t, 0.5));
      pose.head = [0.05, 0, 0]; pose.face = { look: [0, 0.1], blink: 0, seed: 7 };
      ch.update(t, pose);
      placeShadow(ch);
      const burst = sstep(0.55, 0.6, (I.lt / 1.1) % 1) * (1 - sstep(0.78, 0.84, (I.lt / 1.1) % 1));
      const tp = { ...pose, face: { look: [0, -0.1], smile: 1, mouth: 0.25, brow: -0.4, seed: 7 } };
      twin.update(t, tp, burst, I.frame);
      look.ca = 1 + 7 * burst;
      moveCam(camera, I, [0.55, 1.75, 1.3], [0.4, 1.72, 0.9], [-0.1, 1.6, -2.2], [-0.15, 1.62, -2.2], { ease: smooth, shake: 0.6 });
    },
  };
};

// Mirrored twin for the reflection shot. Jitters and splits in color during glitch bursts.
class Character2 {
  constructor(scene) {
    this.ch = addLead(scene, { shadow: false });
    this.ch.group.scale.x = -1;
    this.ch.group.position.set(0, 0, -2.35);
    this.ghosts = [0xff3060, 0x30e0ff].map(c => {
      const g = addLead(scene, { shadow: false });
      g.group.scale.x = -1;
      g.group.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }); } });
      return g;
    });
  }
  update(t, pose, burst, frame) {
    this.ch.update(t, pose);
    const j = burst > 0.05 ? (hash(frame, 3) - 0.5) * 0.12 * burst : 0;
    this.ch.group.position.x = j;
    this.ghosts.forEach((g, i) => {
      g.update(t, pose);
      g.group.visible = burst > 0.05;
      g.group.position.set(j + (i ? -1 : 1) * 0.03 * burst, 0, -2.35);
    });
  }
}

// ---------------------------------------------------------------- the car and the burning horizon
function roadTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#16121c'; g.fillRect(0, 0, 256, 1024);
  const rnd = mulberry32(5);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.05})`; g.fillRect(rnd() * 256, rnd() * 1024, 2, 2); }
  g.fillStyle = '#d8d0b0'; for (let y = 0; y < 1024; y += 256) g.fillRect(124, y, 8, 130);
  g.fillStyle = '#9a92a8'; g.fillRect(10, 0, 6, 1024); g.fillRect(240, 0, 6, 1024);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

function makeCar() {
  const g = new THREE.Group();
  const paint = toon(0x0b0a10, { rim: 1.3 });
  const body = inked(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.6), paint), 1.2); body.position.y = 0.55; g.add(body);
  const cabin = inked(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 2.0), paint), 1.2); cabin.position.set(0, 1.02, -0.2); g.add(cabin);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.38), new THREE.MeshBasicMaterial({ color: 0x3a1818 })); glass.position.set(0, 1.03, 0.81); glass.rotation.x = -0.35; g.add(glass);
  const driver = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: 0x050306 })); driver.position.set(-0.35, 1.05, 0.2); g.add(driver);
  const tl = glowMat(0xff1a30, 6);
  for (const s of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.05), tl); lamp.position.set(s * 0.55, 0.66, 2.31); g.add(lamp);
    const halo = K.glowSprite(0xff2030, 1.4, 0.8); halo.position.set(s * 0.55, 0.66, 2.4); g.add(halo);
    for (const zz of [-1.45, 1.45]) {
      const w = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 18), toon(0x050506, { rim: 0.5 })), 1);
      w.rotation.z = Math.PI / 2; w.position.set(s * 0.9, 0.34, zz); g.add(w);
    }
  }
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), new THREE.MeshBasicMaterial({ map: plateTexture() })); plate.position.set(0, 0.46, 2.31); g.add(plate);
  const exhaust = K.glowSprite(0xff7030, 0.5, 0.7); exhaust.position.set(0.6, 0.3, 2.45); g.add(exhaust);
  return g;
}
function plateTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 84; const g = c.getContext('2d');
  g.fillStyle = '#e8e4ee'; g.fillRect(0, 0, 256, 84); g.fillStyle = '#18121e'; g.font = "700 60px 'Share Tech Mono', monospace"; g.textAlign = 'center'; g.fillText('999', 128, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

SHOT_BUILDERS.drive = () => {
  const { scene, camera } = baseScene({ fog: 0x2a0806, density: 0.012, sky: [0x080204, 0x3a0a08, 0x8a2a10], fov: 38 });
  K.lights(scene, { ambient: 0x3a1410, ambientI: 0.6, key: 0xff9a60, keyI: 1.2, keyPos: [0, 3, -10], back: 0xff5020, backI: 1.8, backPos: [0, 2, -8] });
  const tex = roadTexture();
  tex.repeat.set(1, 40);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 400), toon(0xffffff, { map: tex, rim: 0 })); road.rotation.x = -Math.PI / 2; road.position.z = -150; scene.add(road);
  const desert = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), toon(0x1a0806, { rim: 0 })); desert.rotation.x = -Math.PI / 2; desert.position.y = -0.02; scene.add(desert);
  // Wall of fire along the horizon.
  const flames = [];
  const rnd = mulberry32(81);
  for (let i = 0; i < 140; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: K.glowTexture(), color: new THREE.Color().setHSL(0.03 + rnd() * 0.06, 1, 0.55), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    const x = (rnd() - 0.5) * 420, z = -170 - rnd() * 30;
    s.userData = { x, z, h: 10 + rnd() * 26, ph: rnd() * 10, w: 16 + rnd() * 20 };
    scene.add(s); flames.push(s);
  }
  const horizonGlow = K.glowSprite(0xff5a20, 500, 0.6); horizonGlow.scale.set(700, 120, 1); horizonGlow.position.set(0, 10, -190); scene.add(horizonGlow);
  scene.add(K.particles({ count: 900, box: [40, 12, 80], center: [0, 5, -30], vel: [0, 0.8, 9], kind: 'ember', color: 0xff8a40, size: 7, seed: 83 }));
  // Roadside reflector posts rushing past.
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), toon(0x2a2026, { rim: 1 }), 40);
  const refl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.12, 0.11), glowMat(0xffa060, 3), 40);
  scene.add(posts, refl);
  const car = makeCar(); scene.add(car);
  const M = new THREE.Matrix4();
  return {
    scene, camera, look: { bloom: 0.95, vig: 0.55 },
    beforeRender: rimSetup(0xff7a40, [0, 0.5, -1], 1.4)(camera, () => car.position.clone().add(new THREE.Vector3(0, 0.8, 0))),
    update(I) {
      const t = I.t, speed = 38;
      tex.offset.y = (t * speed / 10) % 1;
      flames.forEach((s, i) => {
        const u = s.userData, fl = 0.7 + 0.3 * Math.sin(t * 7 + u.ph) * Math.sin(t * 3.1 + u.ph * 2);
        s.scale.set(u.w, u.h * fl, 1); s.position.set(u.x, u.h * fl * 0.42, u.z);
      });
      for (let i = 0; i < 40; i++) {
        const side = i % 2 ? 1 : -1, z = 8 - ((i * 12 + t * speed) % 240);
        M.makeTranslation(side * 6, 0.45, z); posts.setMatrixAt(i, M);
        M.makeTranslation(side * 6, 0.8, z); refl.setMatrixAt(i, M);
      }
      posts.instanceMatrix.needsUpdate = true; refl.instanceMatrix.needsUpdate = true;
      car.position.set(0.9 + 0.1 * Math.sin(t * 0.7), 0.02 * Math.sin(t * 23), 0);
      car.rotation.z = 0.01 * Math.sin(t * 17);
      moveCam(camera, I, [0.9, 1.25, 8.2], [0.9, 1.1, 6.3], [0.9, 1.0, -8], [0.9, 1.15, -10], { ease: easeIn, shake: 2.2 });
    },
  };
};

// ---------------------------------------------------------------- shockwave through a crowd
function crowdMeshes(n, mat) {
  const body = new THREE.CapsuleGeometry(0.24, 0.8, 4, 10); body.scale(1.15, 1, 0.8); body.translate(0, 0.62, 0);
  const hood = new THREE.SphereGeometry(0.2, 12, 10); hood.scale(1, 1.2, 1.1); hood.translate(0, 1.33, -0.02);
  return [new THREE.InstancedMesh(body, mat, n), new THREE.InstancedMesh(hood, mat, n)];
}

SHOT_BUILDERS.shockwave = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x0c0616, density: 0.06, sky: cw.sky, fov: 36 });
  K.lights(scene, { ambient: 0x2a1c44, ambientI: 0.6, keyI: 0.4, back: cw.rim, backI: 1.4 });
  scene.add(K.ground({ color: 0x09070f }));
  const mat = toon(0x0c0912, { rim: 1.1 });
  const N = 90;
  const [bodies, hoods] = crowdMeshes(N, mat);
  scene.add(bodies, hoods);
  const rnd = mulberry32(91);
  const people = [];
  const camA = Math.atan2(4.6, 3.0);
  while (people.length < N) {
    const a = rnd() * TAU, r = 2.0 + rnd() * 8;
    let da = Math.abs(((a - camA) % TAU + TAU) % TAU); da = Math.min(da, TAU - da);
    if (da < 0.75 && r < 7.5) continue;
    people.push([Math.cos(a) * r, Math.sin(a) * r, a, r, rnd()]);
  }
  const ringMat = (c, w) => new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0 }, uW: { value: w }, uA: { value: 1 }, uC: { value: new THREE.Color(c) } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uR, uW, uA; uniform vec3 uC; varying vec2 vP;
      void main(){ float d = abs(length(vP) - uR); float a = exp(-d * d / (uW * uW)) + 0.25 * exp(-d / (uW * 6.0)) * step(length(vP), uR);
        gl_FragColor = vec4(uC * a * uA, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const rings = [[cw.rim, 0.12], [0xffffff, 0.05]].map(([c, w]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), ringMat(new THREE.Color(c).multiplyScalar(3), w));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.05; scene.add(m); return m;
  });
  const burst = new THREE.PointLight(cw.rim, 0, 12, 1.2); burst.position.set(0, 1.4, 0); scene.add(burst);
  scene.add(K.particles({ count: 400, box: [12, 4, 12], center: [0, 1.5, 0], vel: [0, 0.3, 0], color: 0xd0b0ff, size: 4, seed: 93 }));
  const ch = addLead(scene);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  const focus = () => new THREE.Vector3(0, 1.3, 0);
  const look = { bloom: 0.95, vig: 0.5, flash: 0 };
  return {
    scene, camera, look,
    beforeRender: rimSetup(cw.rim, [0, 0.6, -0.6], 1.3)(camera, focus),
    lookAt: () => ({ flash: look.flash }),
    update(I) {
      const bar = BEAT.len * 4;
      const since = ((I.lt - 0.1) % bar + bar) % bar, hitK = Math.exp(-since * 5);
      const R = since * 11;
      rings[0].material.uniforms.uR.value = R; rings[0].material.uniforms.uA.value = clamp(1 - since / (bar * 0.8));
      rings[1].material.uniforms.uR.value = R * 0.8; rings[1].material.uniforms.uA.value = clamp(1 - since / (bar * 0.5));
      burst.intensity = 30 * hitK;
      people.forEach(([x, z, a, r, k], i) => {
        const passed = R - r;
        const push = passed > 0 ? Math.exp(-passed * 0.6) * (1 - Math.exp(-passed * 8)) : 0;
        const d = 0.8 * push;
        P.set(x + Math.cos(a) * d, 0, z + Math.sin(a) * d);
        E.set(Math.sin(a) * 0.5 * push, -a + Math.PI / 2, -Math.cos(a) * 0.5 * push);
        Q.setFromEuler(E);
        M.compose(P, Q, S); bodies.setMatrixAt(i, M); hoods.setMatrixAt(i, M);
      });
      bodies.instanceMatrix.needsUpdate = true; hoods.instanceMatrix.needsUpdate = true;
      const pose = layer(POSES.spread, idle(I.t, 0.6));
      pose.head = [-0.35, 0, 0]; pose.spine = [-0.1, 0, 0]; pose.face = { closed: 1, mouth: 0.4 };
      pose.upperArmL = [-0.3, 0, 1.15 + 0.2 * hitK]; pose.upperArmR = [-0.3, 0, -1.15 - 0.2 * hitK];
      pose.wind = 0.9;
      ch.update(I.t, pose);
      placeShadow(ch);
      look.flash = 0.18 * hitK;
      moveCam(camera, I, [3.4, 2.4, 5.4], [2.7, 2.0, 4.3], [0, 1.1, 0], [0, 1.3, 0], { ease: smooth, shake: 1 + 4 * hitK });
    },
  };
};

// ---------------------------------------------------------------- walking toward the city at dusk
function grassField({ count = 5000, area = [30, 70], center = [0, 0, -25], gap = 2.2, seed = 5, base = 0x1a1020, tip = 0xa06a50, fog = 0x3a2230 }) {
  const blade = new THREE.PlaneGeometry(0.07, 0.9, 1, 4); blade.translate(0, 0.45, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: K.TIME, uBase: { value: new THREE.Color(base) }, uTip: { value: new THREE.Color(tip) }, uFog: { value: new THREE.Color(fog) } },
    vertexShader: `uniform float uTime; varying float vY; varying float vD;
      void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        float k = uv.y * uv.y; wp.x += sin(uTime * 1.8 + wp.z * 0.35 + wp.x * 0.2) * 0.14 * k; wp.z += cos(uTime * 1.3 + wp.x * 0.3) * 0.05 * k;
        vY = uv.y; vec4 mv = viewMatrix * wp; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uBase, uTip, uFog; varying float vY; varying float vD;
      void main(){ vec3 c = mix(uBase, uTip, smoothstep(0.55, 1.0, vY)); c = mix(c, uFog, 1.0 - exp(-vD * 0.02)); gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.DoubleSide,
  });
  const inst = new THREE.InstancedMesh(blade, mat, count);
  const rnd = mulberry32(seed);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    let x; do { x = (rnd() - 0.5) * area[0]; } while (Math.abs(x) < gap);
    P.set(center[0] + x, 0, center[2] + (rnd() - 0.5) * area[1]);
    Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI);
    const s = 0.6 + rnd() * 0.9; S.set(1, s, 1);
    M.compose(P, Q, S); inst.setMatrixAt(i, M);
  }
  inst.frustumCulled = false;
  return inst;
}

SHOT_BUILDERS.city = () => {
  const { scene, camera } = baseScene({ fog: 0x4a2a3a, density: 0.012, sky: [0x160c2a, 0x8a4a5a, 0xffa060], fov: 34 });
  K.lights(scene, { ambient: 0x4a3050, ambientI: 0.7, key: 0xffb070, keyI: 1.6, keyPos: [0, 2, -10], back: 0xffa060, backI: 1.2, backPos: [0, 3, -8] });
  const sun = K.glowSprite(0xffb070, 160, 0.9); sun.position.set(-20, 22, -320); scene.add(sun);
  const sunCore = K.glowSprite(0xfff0c0, 34, 1); sunCore.position.set(-20, 20, -315); scene.add(sunCore);
  scene.add(K.city({ seed: 101, count: 110, x: [-160, 160], z: [-300, -240], h: [8, 45], w: [8, 16], wallColor: 0x2a1830, litColor: [255, 200, 140], litRatio: 0.15 }));
  scene.add(K.stars({ n: 400, seed: 103 }));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), toon(0x1c1020, { rim: 0 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const tex = roadTexture(); tex.repeat.set(1, 20);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 400), toon(0xffffff, { map: tex, rim: 0 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -150); scene.add(road);
  scene.add(grassField({ count: 6000, area: [34, 80], center: [0, 0, -30], gap: 2.0, base: 0x140a18, tip: 0xc07a58, fog: 0x6a3a40 }));
  scene.add(K.particles({ count: 200, box: [16, 4, 30], center: [0, 1.5, -12], vel: [0.1, 0.05, 0], color: 0xffd0a0, size: 3, opacity: 0.5, seed: 107 }));
  const ch = addLead(scene, { shadowOpacity: 0.5 });
  ch.group.rotation.y = Math.PI;
  ch.shadow.scale.set(0.9, 3.2, 1);
  let z = 0;
  const focus = () => new THREE.Vector3(0, 1.3, z);
  return {
    scene, camera, look: { bloom: 0.8, vig: 0.45 },
    beforeRender: rimSetup(0xffb070, [0, 0.4, -1], 1.5)(camera, focus),
    update(I) {
      const w = walk(I.lt + 0.4, { period: 1.2 });
      z = -w.dist;
      ch.group.position.z = z;
      const pose = { ...w.pose, face: { seed: 9 }, wind: 0.4 };
      ch.update(I.t, pose);
      placeShadow(ch);
      ch.shadow.position.z += 1.4;
      moveCam(camera, I, [0.9, 1.0, z + 4.2], [0.6, 1.25, z + 3.6], [0, 1.5, z - 20], [0, 1.6, z - 20], { ease: t => t });
    },
  };
};

// ---------------------------------------------------------------- the sailboat, calm and in the storm
function makeBoat() {
  const g = new THREE.Group();
  const hullGeo = new THREE.SphereGeometry(1, 32, 16, 0, TAU, Math.PI / 2, Math.PI / 2); hullGeo.scale(0.95, 0.55, 2.6);
  const hull = inked(new THREE.Mesh(hullGeo, toon(0x1a1e3a, { rim: 1, side: THREE.DoubleSide })), 1.4); hull.position.y = 0.35; g.add(hull);
  const deck = inked(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.06, 32), toon(0x5a4030, { rim: 0.5 })), 1); deck.scale.set(0.92, 1, 2.5); deck.position.y = 0.34; g.add(deck);
  const mast = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 5, 8), toon(0x3a2a24, { rim: 0.8 })), 0.8); mast.position.set(0, 2.8, 0.5); g.add(mast);
  const boom = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8), toon(0x3a2a24, { rim: 0.8 })), 0.8); boom.rotation.x = Math.PI / 2; boom.position.set(0, 1.0, -0.6); g.add(boom);
  const sailShape = new THREE.Shape(); sailShape.moveTo(0, 0); sailShape.lineTo(0, 4.3); sailShape.quadraticCurveTo(-0.6, 2.0, -2.3, 0); sailShape.lineTo(0, 0);
  const sailGeo = new THREE.ShapeGeometry(sailShape, 16);
  const sp = sailGeo.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.sin((sp.getX(i) / -2.3) * Math.PI) * 0.25);
  sailGeo.computeVertexNormals();
  const sail = inked(new THREE.Mesh(sailGeo, toon(0xd8d0e0, { rim: 0.7, side: THREE.DoubleSide })), 0.8);
  sail.rotation.y = Math.PI / 2; sail.position.set(0, 1.05, 0.5); g.add(sail);
  g.userData.sail = sail;
  return g;
}

function sea(scene, o) {
  const w = K.water(o);
  scene.add(w);
  return w;
}

SHOT_BUILDERS.boat = () => {
  const { scene, camera } = baseScene({ fog: 0x0a0c20, density: 0.006, sky: [0x03040c, 0x141a3a, 0x28305a], fov: 34 });
  K.lights(scene, { ambient: 0x2a3050, ambientI: 0.7, key: 0xdce0ff, keyI: 1.0, keyPos: [0, 4, -10], back: 0xb0b8ff, backI: 1.4, backPos: [0, 3, -8] });
  scene.add(K.stars({ n: 2000, seed: 111 }));
  const moon = K.moon(14, 0xf0ecff); moon.position.set(-8, 34, -220); scene.add(moon);
  const w = sea(scene, { color: 0x0a1030, crest: 0x4a5a9a, amp: 0.14, freq: 0.4, speed: 0.9, moonDir: [-0.04, 0.16, -1] });
  const boat = makeBoat(); scene.add(boat);
  const ch = addLead(scene, { shadow: false });
  boat.add(ch.group);
  ch.group.position.set(0, 0.37, -1.3);
  ch.group.rotation.y = Math.PI * 0.95;
  const focus = () => new THREE.Vector3(0, 1.1, 0);
  return {
    scene, camera, look: { bloom: 0.8, vig: 0.5 },
    beforeRender: rimSetup(0xc8d0ff, [0, 0.5, -1], 1.3)(camera, focus),
    update(I) {
      const t = I.t, wh = w.userData.waveHeight;
      const h0 = wh(0, 0, t), hx = wh(1, 0, t) - wh(-1, 0, t), hz = wh(0, 2, t) - wh(0, -2, t);
      boat.position.y = h0 * 0.9 - 0.12; boat.rotation.set(-hz * 0.25, 0.4, hx * 0.4);
      const pose = layer(SIT_HUG, idle(t, 0.5));
      pose.head = [-0.15, -0.1, 0]; pose.face = { look: [0, -0.2], seed: 11 }; pose.wind = 0.4;
      ch.update(t, pose);
      const a = 0.32 - I.p * 0.22;
      moveCam(camera, I, [Math.sin(a) * 11, 1.4, Math.cos(a) * 11], [Math.sin(a - 0.08) * 9.5, 1.6, Math.cos(a - 0.08) * 9.5], [-1, 3.2, -6], [-1.2, 3.6, -6], { ease: t => t });
    },
  };
};

SHOT_BUILDERS.storm = () => {
  const { scene, camera } = baseScene({ fog: 0x10121e, density: 0.03, sky: [0x05060c, 0x14162a, 0x22243a], fov: 38 });
  const L = K.lights(scene, { ambient: 0x2a2e44, ambientI: 0.6, key: 0xc8ccff, keyI: 0.5, keyPos: [2, 6, 4], back: 0x9098ff, backI: 1.2 });
  const clouds = K.cloudLayer({ count: 50, area: [200, 120], y: 26, size: [40, 80], color: 0x2a2c44, opacity: 0.8, seed: 121 }); clouds.position.z = -40; scene.add(clouds);
  const w = sea(scene, { color: 0x04060f, crest: 0x2a3050, amp: 1.1, freq: 0.22, speed: 1.7, glitter: 0x6a70a0, moonDir: [0.3, 0.3, -1] });
  const boat = makeBoat(); scene.add(boat);
  const ch = addLead(scene, { shadow: false });
  boat.add(ch.group);
  ch.group.position.set(0, 0.37, -0.15);
  ch.group.rotation.y = 0.2;
  scene.add(K.rain({ count: 7000, box: [30, 18, 30], center: [0, 6, 0], opacity: 0.45, speed: 22, length: 0.6, width: 0.012, wind: [1.1, 0.3] }));
  scene.add(K.particles({ count: 600, box: [20, 14, 20], center: [0, 6, 0], vel: [2.5, -9, 0.5], color: 0xe8ecff, size: 5, opacity: 0.9, seed: 123 }));
  const bolt = boltMesh(); scene.add(bolt);
  const flashL = new THREE.DirectionalLight(0xe0e0ff, 0); flashL.position.set(-5, 10, -10); scene.add(flashL);
  const strikes = [0.35, 1.55, 2.6];
  let built = -1;
  const focus = () => new THREE.Vector3(0, 1.4, 0);
  const look = { bloom: 0.85, vig: 0.6, flash: 0 };
  return {
    scene, camera, look,
    beforeRender: rimSetup(0xb0b8ff, [0, 0.6, -1], 1.2)(camera, focus),
    lookAt: () => ({ flash: look.flash }),
    update(I) {
      const t = I.t, wh = w.userData.waveHeight;
      const h0 = wh(0, 0, t), hx = wh(1.5, 0, t) - wh(-1.5, 0, t), hz = wh(0, 2.5, t) - wh(0, -2.5, t);
      boat.position.y = h0 - 0.2; boat.rotation.set(-hz * 0.28, 0.5, hx * 0.35);
      const s = strike(I.lt, strikes);
      const k = strikes.findIndex(x => I.lt >= x && I.lt < x + 0.35);
      if (k !== built && k >= 0) { bolt.userData.build(k * 13 + 5, [-30 + k * 50, 40, -70], [-20 + k * 42, 0, -60]); built = k; }
      bolt.visible = s > 0.05;
      flashL.intensity = 6 * s;
      look.flash = 0.25 * s;
      const pose = layer({ ...REST, upperArmL: [-1.25, -0.9, 0.15], foreArmL: [-1.1, 0, 0], upperArmR: [-1.35, 0.9, -0.15], foreArmR: [-1.0, 0, 0], curlL: 0.9, curlR: 0.9,
        spine: [0.25, 0, 0], chest: [0.1, 0, 0], upperLegL: [-0.2, 0, 0.12], lowerLegL: [0.35, 0, 0], upperLegR: [0.1, 0, -0.12], lowerLegR: [0.25, 0, 0] }, idle(t, 1.5));
      pose.head = [0.15, 0.3, 0]; pose.face = { closed: 1, brow: 1 }; pose.wind = 1.4;
      ch.update(t, pose);
      moveCam(camera, I, [3.6, 2.6, 5.0], [3.0, 2.9, 4.2], [0, 1.9, 0], [0, 2.1, 0], { ease: smooth, shake: 3 });
    },
  };
};

// ---------------------------------------------------------------- holding the demons back with a sigil
function makeSigil(color) {
  const g = new THREE.Group();
  const m = glowMat(color, 4, { transparent: true, opacity: 1, additive: true });
  [1, 0.82, 0.55].forEach((r, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, i === 0 ? 0.025 : 0.014, 6, 96), m); g.add(t); });
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < 3; i++) {
      const a0 = k * Math.PI / 3 + i * TAU / 3, a1 = a0 + TAU / 3;
      const p0 = new THREE.Vector3(Math.cos(a0) * 0.82, Math.sin(a0) * 0.82, 0), p1 = new THREE.Vector3(Math.cos(a1) * 0.82, Math.sin(a1) * 0.82, 0);
      const len = p0.distanceTo(p1);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 5), m);
      seg.position.copy(p0).add(p1).multiplyScalar(0.5);
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
      g.add(seg);
    }
  }
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; const d = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), m); d.position.set(Math.cos(a) * 0.91, Math.sin(a) * 0.91, 0); g.add(d); }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.05, 48), new THREE.MeshBasicMaterial({ map: K.glowTexture(), color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  g.add(disc);
  return g;
}

SHOT_BUILDERS.demons = (params, v) => {
  const { scene, camera } = baseScene({ fog: 0x1c0306, density: 0.07, fov: 36 });
  K.lights(scene, { ambient: 0x3a1014, ambientI: 0.6, key: 0xff6a60, keyI: 0.5, keyPos: [0, 4, -4], back: 0xff2a3a, backI: 1.5, backPos: [0, 3, -6] });
  scene.add(K.ground({ color: 0x0c0306 }));
  const rnd = mulberry32(131);
  const demons = [];
  for (let i = 0; i < 16; i++) {
    const d = makeDemon(rnd);
    const row = Math.floor(i / 6);
    d.position.set((i % 6 - 2.5) * 0.9 + (row % 2) * 0.45 + (rnd() - 0.5) * 0.3, 0, -1.9 - row * 1.3 - rnd() * 0.4);
    d.userData.ph = rnd() * TAU;
    scene.add(d); demons.push(d);
  }
  const redFog = K.cloudLayer({ count: 30, area: [16, 10], y: 0.4, size: [3, 7], color: 0xa01020, opacity: 0.35, seed: 133 }); redFog.position.z = -3; scene.add(redFog);
  const sigil = makeSigil(0xc27bff); sigil.position.set(0.42, 1.42, -0.95); scene.add(sigil);
  const sigLight = new THREE.PointLight(0xb06aff, 8, 6, 1.4); sigLight.position.set(0.42, 1.42, -0.8); scene.add(sigLight);
  scene.add(K.particles({ count: 300, box: [2.4, 2.4, 0.4], center: [0.42, 1.42, -1.05], vel: [0, 0.4, 0], kind: 'spark', color: 0xffb0ff, size: 5, seed: 137 }));
  scene.add(K.particles({ count: 400, box: [14, 5, 10], center: [0, 2, -3], vel: [0, 0.5, 0], kind: 'ember', color: 0xff4030, size: 5, seed: 139 }));
  const ch = addLead(scene);
  ch.group.rotation.y = Math.PI;
  ch.group.position.set(0.25, 0, 0);
  const focus = () => new THREE.Vector3(0, 1.4, -1);
  return {
    scene, camera, look: { bloom: 1.0, vig: 0.6 },
    beforeRender: rimSetup(0xff3a4a, [0, 0.5, -1], 1.4)(camera, focus),
    update(I) {
      const t = I.t;
      sigil.rotation.z = t * 0.8;
      const pulse = 0.85 + 0.15 * Math.sin(t * 9) + 0.2 * beatPulse(t, I.start, 5);
      sigil.scale.setScalar(pulse);
      sigLight.intensity = 7 * pulse;
      demons.forEach((d, i) => {
        const u = d.userData, lunge = Math.max(0, Math.sin(t * 2.2 + u.ph));
        d.position.y = 0.03 * Math.sin(t * 4 + u.ph);
        d.rotation.x = 0.2 * lunge;
        u.armL.rotation.x = -1.2 - 0.4 * lunge; u.armR.rotation.x = -1.1 - 0.5 * Math.max(0, Math.sin(t * 2.2 + u.ph + 1));
      });
      const pose = layer({ ...POSES.palmOut, upperLegL: [-0.35, 0, 0.18], lowerLegL: [0.3, 0, 0], upperLegR: [0.3, 0, -0.12], lowerLegR: [0.1, 0, 0], spine: [0.12, 0, 0] }, idle(t, 0.8));
      pose.head = [0.05, 0, 0]; pose.face = { brow: -1, mouth: 0.15 }; pose.wind = 0.8;
      ch.update(t, pose);
      placeShadow(ch);
      moveCam(camera, I, [1.9, 1.3, 2.6], [1.5, 1.45, 2.1], [-0.3, 1.5, -2.5], [-0.3, 1.55, -2.5], { ease: smooth, shake: 1.6 });
    },
  };
};

// ---------------------------------------------------------------- a figure made of light
SHOT_BUILDERS.light = () => {
  const { scene, camera } = baseScene({ fog: 0x020104, density: 0.05, fov: 34 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x020104, transparent: true, opacity: 0.82 })); floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1; scene.add(floor);
  const glowBody = glowMat(0xf2eaff, 2.6);
  const makeGlow = () => {
    const c = addLead(scene, { shadow: false });
    c.group.traverse(o => { if (o.isMesh) { if (o.userData.hull || o.material.transparent) o.visible = false; else o.material = glowBody; } });
    return c;
  };
  const ch = makeGlow();
  const refl = makeGlow(); refl.group.scale.y = -1;
  const rays = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 14), new THREE.MeshBasicMaterial({ map: K.glowTexture(), color: 0xc8b0ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.geometry.translate(0, 7, 0); m.position.set(0, 1.3, -0.5); m.rotation.z = i / 14 * TAU; scene.add(m); rays.push(m);
  }
  const halo = K.glowSprite(0xd8c0ff, 5, 0.6); halo.position.set(0, 1.3, -0.3); scene.add(halo);
  scene.add(K.particles({ count: 500, box: [6, 5, 4], center: [0, 2, 0], vel: [0, 0.4, 0], kind: 'spark', color: 0xf0e0ff, size: 5, seed: 141 }));
  const focus = () => new THREE.Vector3(0, 1.2, 0);
  return {
    scene, camera, look: { bloom: 1.25, bloomRadius: 0.8, threshold: 0.6, vig: 0.55 },
    beforeRender: rimSetup(0xffffff, [0, 1, 0], 0)(camera, focus),
    update(I) {
      const t = I.t;
      const pose = blend(POSES.rest, POSES.spread, 0.3 + 0.05 * Math.sin(t));
      pose.head = [-0.12, 0, 0]; pose.hipsPos = [0, 0.06 + 0.02 * Math.sin(t * 1.3), 0]; pose.wind = 0.6;
      ch.update(t, pose); refl.update(t, pose);
      rays.forEach((m, i) => { m.rotation.z = i / 14 * TAU + t * 0.12; m.material.opacity = 0.14 + 0.1 * Math.sin(t * 1.3 + i * 1.7); });
      moveCam(camera, I, [0, 0.7, 5.2], [0, 0.95, 3.9], [0, 1.4, 0], [0, 1.35, 0], { ease: smooth });
    },
  };
};

// ---------------------------------------------------------------- sinking underwater
SHOT_BUILDERS.underwater = () => {
  const { scene, camera } = baseScene({ fog: 0x031030, density: 0.13, fov: 38 });
  scene.add(new THREE.AmbientLight(0x1a3470, 0.8));
  const top = new THREE.DirectionalLight(0xa0e0ff, 1.3); top.position.set(0.5, 10, 1); scene.add(top);
  const shimmer = new THREE.PointLight(0x9ad8ff, 6, 10, 1.2); scene.add(shimmer);
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShaderMaterial({
    uniforms: { uTime: K.TIME },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main(){ vec2 p = vUv * 40.0; float c = sin(p.x + uTime * 0.8) * sin(p.y * 1.3 - uTime * 0.6) + sin((p.x + p.y) * 0.7 + uTime);
        float l = smoothstep(0.6, 1.8, c); float d = length(vUv - 0.5); vec3 col = mix(vec3(0.1, 0.25, 0.5), vec3(0.6, 0.85, 1.0), l) * (1.2 - d * 1.6);
        gl_FragColor = vec4(col * 0.7, 1.0); }`,
    side: THREE.DoubleSide, fog: false,
  }));
  surface.rotation.x = Math.PI / 2; surface.position.y = 9; scene.add(surface);
  const shafts = [];
  const rnd = mulberry32(151);
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + rnd() * 1.5, 22), new THREE.MeshBasicMaterial({ map: K.glowTexture(), color: 0x9ad8ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set((rnd() - 0.5) * 12, 2, -2 - rnd() * 6); m.rotation.set(0, rnd() * 0.6 - 0.3, 0.25 + rnd() * 0.15); m.userData.ph = rnd() * TAU;
    scene.add(m); shafts.push(m);
  }
  scene.add(K.particles({ count: 220, box: [5, 10, 5], center: [0, 3, 0], vel: [0, 0.9, 0], kind: 'bubble', color: 0xd0f0ff, size: 3.5, opacity: 0.6, seed: 153 }));
  scene.add(K.particles({ count: 500, box: [14, 10, 14], center: [0, 3, -2], vel: [0.05, 0.05, 0], color: 0x9ac8ff, size: 3, opacity: 0.5, seed: 155 }));
  const ch = addLead(scene, { shadow: false });
  const focus = () => new THREE.Vector3(0, ch.group.position.y + 1.2, 0);
  return {
    scene, camera, look: { bloom: 0.9, vig: 0.6 },
    beforeRender: rimSetup(0x9ae0ff, [0, 1, -0.2], 1.2)(camera, focus),
    update(I) {
      const t = I.t;
      ch.group.position.y = 1.2 - I.lt * 0.35;
      ch.group.rotation.set(0.25 + 0.05 * Math.sin(t * 0.7), 0.3 * Math.sin(t * 0.25), 0.08 * Math.sin(t * 0.5));
      const f = Math.sin(t * 0.9);
      const pose = { ...REST, upperArmL: [-0.4, 0, 2.2 + 0.15 * f], foreArmL: [-0.4, 0, 0], upperArmR: [-0.45, 0, -2.1 - 0.15 * f], foreArmR: [-0.5, 0, 0], curlL: 0.1, curlR: 0.15,
        upperLegL: [-0.35, 0, 0.1], lowerLegL: [0.7 + 0.1 * f, 0, 0], upperLegR: [-0.1, 0, -0.08], lowerLegR: [0.4 - 0.1 * f, 0, 0], footL: [0.6, 0, 0], footR: [0.5, 0, 0],
        head: [-0.45, 0, 0], neck: [-0.15, 0, 0], spine: [-0.1, 0, 0], face: { closed: 1 }, wind: 1.3 };
      ch.update(t, pose);
      shimmer.position.set(Math.sin(t) * 2, ch.group.position.y + 4, Math.cos(t * 0.8) * 2);
      shimmer.intensity = 5 + 2 * Math.sin(t * 3.1);
      shafts.forEach(m => { m.material.opacity = 0.1 + 0.08 * Math.sin(t * 0.7 + m.userData.ph); });
      const y = ch.group.position.y;
      moveCam(camera, I, [2.4, y + 0.2, 4.4], [1.8, y + 0.5, 3.6], [0, y + 1.5, 0], [0, y + 1.3, 0], { ease: smooth });
    },
  };
};

// ---------------------------------------------------------------- rooftop ledge under the moon
SHOT_BUILDERS.rooftop = () => {
  const { scene, camera } = baseScene({ fog: 0x0a0c20, density: 0.008, sky: [0x03030a, 0x121638, 0x242a58], fov: 34 });
  K.lights(scene, { ambient: 0x2a2c50, ambientI: 0.7, key: 0xdce0ff, keyI: 1.0, keyPos: [0, 5, -10], back: 0xc0c8ff, backI: 1.5, backPos: [0, 4, -10] });
  scene.add(K.stars({ n: 1800, seed: 161 }));
  const moon = K.moon(24, 0xf6f0ff); moon.position.set(8, 16, -260); scene.add(moon);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 8), toon(0x14121e, { rim: 0 })); roof.position.set(0, -0.5, 2.5); scene.add(roof);
  const ledge = inked(new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 0.35), toon(0x1e1a2a, { rim: 0.8 })), 1); ledge.position.set(0, 0.25, -1.3); scene.add(ledge);
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(14, 60, 1), toon(0x0e0c16, { rim: 0 })); bldg.position.set(0, -30.5, -1.6); scene.add(bldg);
  const city = K.city({ seed: 163, count: 260, x: [-200, 200], z: [-260, -20], h: [10, 50], w: [6, 14], litColor: [255, 210, 160], litRatio: 0.3 });
  city.position.y = -60; scene.add(city);
  const ch = addLead(scene, { shadow: false });
  ch.group.rotation.y = Math.PI;
  ch.group.position.set(0, 0.06, -1.3);
  const focus = () => new THREE.Vector3(0, 1.4, -1.3);
  return {
    scene, camera, look: { bloom: 0.8, vig: 0.5 },
    beforeRender: rimSetup(0xd0d8ff, [0, 0.6, -1], 1.4)(camera, focus),
    update(I) {
      const pose = layer(SIT_LEDGE, idle(I.t, 0.6));
      pose.head = [-0.18, 0.15, 0]; pose.lowerLegL = [1.45 + 0.1 * Math.sin(I.t * 1.1), 0, 0]; pose.lowerLegR = [1.5 + 0.1 * Math.sin(I.t * 1.1 + 2), 0, 0];
      pose.wind = 0.6;
      ch.update(I.t, pose);
      moveCam(camera, I, [-1.5, 1.7, 2.6], [-1.2, 1.65, 1.9], [0.4, 1.2, -8], [0.6, 1.5, -8], { ease: smooth });
    },
  };
};

// ---------------------------------------------------------------- night highway toward the finish arch
function highwaySet(scene) {
  const tex = roadTexture(); tex.repeat.set(1, 60);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 600), toon(0xffffff, { map: tex, rim: 0 })); road.rotation.x = -Math.PI / 2; road.position.z = -280; scene.add(road);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), toon(0x07060c, { rim: 0 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
  for (let i = 0; i < 12; i++) {
    for (const s of [-1, 1]) {
      const l = K.streetLight({ color: 0xc8b8ff, light: false, coneOpacity: 0.1, height: 5 });
      l.position.set(s * 5.2, 0, 6 - i * 26); l.rotation.y = s > 0 ? Math.PI : 0; scene.add(l);
      const gl = K.puddleGlint(0xc8b8ff, 5, 1.5, 0.22); gl.position.set(s * 4.4, 0.012, 6 - i * 26 + 2); scene.add(gl);
    }
  }
  const arch = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.22, 10, 80, Math.PI), glowMat(0xffffff, 5)); arch.add(ring);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(9, 1.4, 10, 80, Math.PI), glowMat(0xd8c8ff, 0.8, { transparent: true, opacity: 0.25, additive: true })); arch.add(halo);
  const core = K.glowSprite(0xe8dcff, 26, 0.5); core.position.y = 4; arch.add(core);
  arch.position.set(0, 0, -170); scene.add(arch);
  const beacon = new THREE.PointLight(0xe0d8ff, 40, 80, 1.2); beacon.position.set(0, 5, -160); scene.add(beacon);
  return { arch, tex };
}

SHOT_BUILDERS.highway = () => {
  const { scene, camera } = baseScene({ fog: 0x0e0a1c, density: 0.018, sky: [0x040308, 0x120c24, 0x1e1638], fov: 32 });
  K.lights(scene, { ambient: 0x2a2248, ambientI: 0.7, key: 0xd8d0ff, keyI: 0.6, keyPos: [0, 4, -10], back: 0xd8c8ff, backI: 1.6, backPos: [0, 3, -10] });
  highwaySet(scene);
  scene.add(K.rain({ count: 3000, box: [16, 12, 20], center: [0, 5, -4], opacity: 0.25 }));
  const ch = addLead(scene);
  ch.group.rotation.y = Math.PI;
  let z = 0;
  const focus = () => new THREE.Vector3(0, 1.3, z);
  return {
    scene, camera, look: { bloom: 0.85, vig: 0.5 },
    beforeRender: rimSetup(0xe0d8ff, [0, 0.4, -1], 1.4)(camera, focus),
    update(I) {
      const w = walk(I.lt + 0.2, { period: 1.25 });
      z = -w.dist;
      ch.group.position.set(0.3, 0, z);
      ch.update(I.t, { ...w.pose, face: { seed: 13 }, wind: 0.3 });
      placeShadow(ch);
      moveCam(camera, I, [1.1, 1.1, z + 5.5], [0.8, 1.35, z + 4.4], [0.2, 2.2, z - 40], [0.2, 2.6, z - 40], { ease: t => t });
    },
  };
};

SHOT_BUILDERS.crawl = () => {
  const { scene, camera } = baseScene({ fog: 0x0e0a1c, density: 0.02, sky: [0x040308, 0x120c24, 0x1e1638], fov: 30 });
  K.lights(scene, { ambient: 0x2a2248, ambientI: 0.6, key: 0xd8d0ff, keyI: 0.5, keyPos: [0, 4, -10], back: 0xd8c8ff, backI: 1.8, backPos: [0, 3, -10] });
  highwaySet(scene);
  scene.add(K.rain({ count: 3500, box: [10, 8, 12], center: [0, 3.5, -2], opacity: 0.35 }));
  scene.add(K.ripples({ count: 160, area: [8, 12], center: [0, 0.015, -2], opacity: 0.3 }));
  const ch = addLead(scene, { shadowOpacity: 0.5 });
  ch.group.rotation.y = Math.PI;
  let z = 0;
  const focus = () => new THREE.Vector3(0, 0.6, z);
  return {
    scene, camera, look: { bloom: 0.9, vig: 0.6 },
    beforeRender: rimSetup(0xe0d8ff, [0, 0.5, -1], 0.8)(camera, focus),
    update(I) {
      const c = crawl(I.lt, { period: 2.0 });
      z = -c.dist;
      ch.group.position.set(0, 0, z);
      const pose = { ...c.pose, face: { closed: 0, blink: 0.5, brow: 1 }, wind: 0.2 };
      ch.update(I.t, pose);
      placeShadow(ch);
      moveCam(camera, I, [2.2, 0.45, z + 3.2], [1.8, 0.5, z + 2.6], [0, 0.7, z - 10], [0, 0.9, z - 12], { ease: smooth });
    },
  };
};

// ---------------------------------------------------------------- the coffin bursts open
function coffinGeo(w = 0.8, l = 2.1, h = 0.55) {
  const s = new THREE.Shape();
  s.moveTo(0, -l / 2); s.lineTo(w * 0.34, -l / 2); s.lineTo(w / 2, l * 0.22); s.lineTo(w * 0.38, l / 2); s.lineTo(-w * 0.38, l / 2); s.lineTo(-w / 2, l * 0.22); s.lineTo(-w * 0.34, -l / 2); s.lineTo(0, -l / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

SHOT_BUILDERS.coffin = () => {
  const { scene, camera } = baseScene({ fog: 0x0c0a16, density: 0.06, sky: [0x020206, 0x0c0a1a, 0x16122a], fov: 36 });
  const L = K.lights(scene, { ambient: 0x2a2440, ambientI: 0.6, key: 0xb8b0e0, keyI: 0.5, keyPos: [-4, 6, 3], back: 0x8a70d0, backI: 1.2 });
  scene.add(K.ground({ color: 0x0a0910 }));
  const moon = K.moon(10); moon.position.set(-30, 40, -120); scene.add(moon);
  const stone = toon(0x3a3848, { rim: 0.7 });
  const rnd = mulberry32(171);
  for (let i = 0; i < 16; i++) {
    const g = inked(new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 4, 10), stone), 1);
    g.scale.set(1, 1, 0.3); g.position.set((rnd() - 0.5) * 16, 0.45, -3 - rnd() * 14); g.rotation.set((rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.2);
    scene.add(g);
  }
  for (let i = 0; i < 4; i++) {
    const tr = new THREE.Group(), bark = toon(0x0a0810, { rim: 0.6 });
    const trunk = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 3.5, 7), bark), 1); trunk.position.y = 1.75; tr.add(trunk);
    for (let k = 0; k < 5; k++) { const b = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 1.4, 5), bark), 1); b.position.set(0, 2 + k * 0.35, 0); b.rotation.set(rnd() - 0.5, rnd() * TAU, 0.9 + rnd() * 0.5); b.translateY(0.6); tr.add(b); }
    tr.position.set((i % 2 ? 1 : -1) * (5 + rnd() * 4), 0, -6 - rnd() * 8); scene.add(tr);
  }
  const wood = toon(0x2a1a16, { rim: 0.8 });
  const box = inked(new THREE.Mesh(coffinGeo(), wood), 1.1); scene.add(box);
  const lid = inked(new THREE.Mesh(coffinGeo(0.84, 2.15, 0.08), wood), 1.1); scene.add(lid);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.9), glowMat(0xd8b0ff, 3)); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.3; scene.add(inner);
  const column = K.lightCone(10, 1.4, 0xd0a8ff, 0); column.rotation.x = Math.PI; column.position.y = 0.2; scene.add(column);
  const glowL = new THREE.PointLight(0xc080ff, 0, 10, 1.3); glowL.position.set(0, 1, 0); scene.add(glowL);
  const splinters = [];
  for (let i = 0; i < 40; i++) {
    const s = inked(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.15 + rnd() * 0.2), wood), 0.5);
    s.userData = { v: new THREE.Vector3((rnd() - 0.5) * 6, 3 + rnd() * 5, (rnd() - 0.5) * 6), spin: new THREE.Vector3(rnd() * 10, rnd() * 10, rnd() * 10) };
    scene.add(s); splinters.push(s);
  }
  scene.add(K.particles({ count: 300, box: [3, 6, 3], center: [0, 3, 0], vel: [0, 1.2, 0], kind: 'spark', color: 0xe0c8ff, size: 6, seed: 173 }));
  const ch = addLead(scene, { shadow: false });
  const focus = () => new THREE.Vector3(0, 1, 0);
  const look = { bloom: 0.95, vig: 0.6, flash: 0 };
  const T0 = 0.8;
  return {
    scene, camera, look,
    beforeRender: rimSetup(0xd0a8ff, [0, 0.7, -0.5], 1.4)(camera, focus),
    lookAt: () => ({ flash: look.flash }),
    update(I) {
      const lt = I.lt, t = I.t, e = lt - T0;
      const pre = lt < T0 ? sstep(0, T0, lt) : 1;
      if (e < 0) {
        lid.position.set(hashs2(I.frame) * 0.01 * pre, 0.55 + Math.abs(hashs2(I.frame + 1)) * 0.02 * pre, 0); lid.rotation.set(0, 0, 0);
      } else {
        lid.position.set(e * 1.5, 0.55 + e * 6 - 4.9 * e * e, -e * 2.2); lid.rotation.set(-e * 3, e * 1.2, e * 2);
      }
      splinters.forEach(s => {
        const u = s.userData; s.visible = e > 0;
        if (e > 0) { s.position.set(u.v.x * e, 0.5 + u.v.y * e - 4.9 * e * e, u.v.z * e); s.rotation.set(u.spin.x * e, u.spin.y * e, u.spin.z * e); }
      });
      const burst = e > 0 ? Math.exp(-e * 3) : 0;
      const on = e > 0 ? 1 : 0.15 * pre;
      column.material.uniforms.uOpacity.value = 0.25 * on + 0.3 * burst;
      glowL.intensity = 5 * on + 8 * burst;
      inner.material.color.setRGB(3 * on + 0.4, 2.2 * on + 0.3, 3.4 * on + 0.5);
      look.flash = 0.12 * burst;
      // He rises out of the light.
      const rise = sstep(0.25, 2.2, e);
      ch.group.position.set(0, -1.7 + rise * 1.95, 0);
      const pose = blend(POSES.rest, POSES.spread, 0.4);
      pose.head = [-0.3 + 0.2 * rise, 0, 0]; pose.face = { closed: rise < 0.7 ? 1 : 0, brow: 0.4 }; pose.wind = 1.2 - 0.6 * rise;
      pose.hipsPos = [0, 0, 0];
      ch.update(t, pose);
      moveCam(camera, I, [2.6, 0.9, 3.4], [1.8, 1.2, 2.5], [0, 0.8, 0], [0, 1.4, 0], { ease: smooth, shake: 1 + 6 * burst });
    },
  };
};
const hashs2 = n => hash(n, 77) * 2 - 1;

// ---------------------------------------------------------------- a maze inside the head
function headPolygon() {
  const pts = [[-2.2, 0.2], [-2.4, 2.2], [-2.8, 4.2], [-2.6, 6.2], [-1.6, 7.9], [0.2, 8.7], [2.0, 8.3], [3.1, 6.9], [3.4, 5.4], [3.3, 4.6], [4.0, 3.6], [3.4, 3.4], [3.5, 2.8], [3.2, 2.4], [3.4, 2.0], [2.9, 1.2], [1.6, 1.0], [1.4, 0.2]];
  const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, 0, -y)), true, 'centripetal');
  return c;
}
function inside(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}

SHOT_BUILDERS.maze = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x07040e, density: 0.03, fov: 40 });
  K.lights(scene, { ambient: 0x2a1c44, ambientI: 0.7, keyI: 0.5, keyPos: [2, 8, 3], back: cw.rim, backI: 1.2 });
  scene.add(K.ground({ color: 0x07050c }));
  const S = 2.2; // scale the head up
  const curve = headPolygon();
  const poly = curve.getPoints(80).map(p => [p.x * S, p.z * S]);
  const outline = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve.getPoints(160).map(p => new THREE.Vector3(p.x * S, 0.05, p.z * S)), true), 240, 0.09, 6, true), glowMat(cw.neonA, 4));
  scene.add(outline);
  // Maze on a grid, carved by a seeded depth-first walk, kept to the cells inside the head.
  const cs = 0.9, nx = 26, nz = 22, x0 = -3 * S, z0 = -9 * S;
  const cellIn = (i, j) => inside(poly, x0 + (i + 0.5) * cs * (8 * S / (nx * cs)), z0 + (j + 0.5) * cs * (9.6 * S / (nz * cs)));
  const sx = 8 * S / nx, sz = 9.6 * S / nz;
  const cx = i => x0 + (i + 0.5) * sx, cz = j => z0 + (j + 0.5) * sz;
  const open = new Set(), seen = new Set();
  const rnd = mulberry32(181);
  let start = null;
  for (let j = 0; j < nz && !start; j++) for (let i = 0; i < nx; i++) if (inside(poly, cx(i), cz(j))) { start = [i, j]; break; }
  const stack = [start]; seen.add(start.join());
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < nx && b < nz && !seen.has(a + ',' + b) && inside(poly, cx(a), cz(b)));
    if (!nb.length) { stack.pop(); continue; }
    const n = nb[Math.floor(rnd() * nb.length)];
    open.add([i, j, n[0], n[1]].join()); open.add([n[0], n[1], i, j].join());
    seen.add(n.join()); stack.push(n);
  }
  const walls = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (!seen.has(i + ',' + j)) continue;
    if (!open.has([i, j, i + 1, j].join())) walls.push([cx(i) + sx / 2, cz(j), 0.08, sz]);
    if (!open.has([i, j, i, j + 1].join())) walls.push([cx(i), cz(j) + sz / 2, sx, 0.08]);
    if (!seen.has(i - 1 + ',' + j)) walls.push([cx(i) - sx / 2, cz(j), 0.08, sz]);
    if (!seen.has(i + ',' + (j - 1))) walls.push([cx(i), cz(j) - sz / 2, sx, 0.08]);
  }
  const wallGeo = new THREE.BoxGeometry(1, 1, 1);
  const wallMesh = new THREE.InstancedMesh(wallGeo, toon(0x120c1e, { rim: 0.8 }), walls.length);
  const capMesh = new THREE.InstancedMesh(wallGeo, glowMat(cw.rim, 2.5), walls.length);
  const M = new THREE.Matrix4();
  walls.forEach(([x, z, w, d], k) => {
    M.makeScale(w + 0.02, 0.9, d + 0.02).setPosition(x, 0.45, z); wallMesh.setMatrixAt(k, M);
    M.makeScale(w + 0.03, 0.03, d + 0.03).setPosition(x, 0.91, z); capMesh.setMatrixAt(k, M);
  });
  scene.add(wallMesh, capMesh);
  scene.add(K.particles({ count: 300, box: [20, 3, 22], center: [1, 1.5, -10], vel: [0, 0.2, 0], kind: 'spark', color: 0xd8c0ff, size: 4, seed: 183 }));
  const ch = addLead(scene, { shadowOpacity: 0.5 });
  ch.group.position.set(cx(start[0]) + 0.1, 0, cz(start[1]) + 3.2);
  const cxm = 1.2, czm = -9;
  const focus = () => new THREE.Vector3(cxm, 0, czm);
  return {
    scene, camera, look: { bloom: 0.85, vig: 0.5 },
    beforeRender: rimSetup(cw.rim, [0, 1, 0], 1)(camera, focus),
    update(I) {
      const w = walk(I.lt, { period: 1.2 });
      const hx = cx(Math.floor(nx / 2)), hz = cz(Math.floor(nz * 0.6));
      ch.group.position.set(hx, 0, hz - w.dist * 0.5);
      ch.group.rotation.y = Math.PI;
      ch.update(I.t, { ...w.pose, face: { seed: 17 }, wind: 0.2 });
      placeShadow(ch);
      const a = 0.3 + I.p * 0.4;
      moveCam(camera, I, [hx + Math.sin(a) * 9, 14, hz + Math.cos(a) * 9], [hx + Math.sin(a + 0.2) * 7, 11, hz + Math.cos(a + 0.2) * 7], [cxm, 0, czm], [hx, 0, hz - 2], { ease: smooth });
    },
  };
};

// ---------------------------------------------------------------- demons circling
SHOT_BUILDERS.circle = () => {
  const { scene, camera } = baseScene({ fog: 0x1c0306, density: 0.06, fov: 38 });
  K.lights(scene, { ambient: 0x3a1014, ambientI: 0.7, key: 0xff8070, keyI: 0.5, keyPos: [0, 8, 2], back: 0xff2a3a, backI: 1.4 });
  scene.add(K.ground({ color: 0x0c0306 }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.75, 96), glowMat(0xff2a3a, 3, { side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; scene.add(ring);
  const floorGlow = K.puddleGlint(0xff2030, 6, 6, 0.4); scene.add(floorGlow);
  const rnd = mulberry32(191);
  const demons = [];
  for (let i = 0; i < 11; i++) { const d = makeDemon(rnd); d.userData.a = i / 11 * TAU; scene.add(d); demons.push(d); }
  scene.add(K.particles({ count: 400, box: [12, 5, 12], center: [0, 2, 0], vel: [0, 0.6, 0], kind: 'ember', color: 0xff4030, size: 5, seed: 193 }));
  const redFog = K.cloudLayer({ count: 30, area: [16, 16], y: 0.3, size: [3, 7], color: 0x901020, opacity: 0.35, seed: 197 }); scene.add(redFog);
  const ch = addLead(scene);
  const focus = () => new THREE.Vector3(0, 1, 0);
  return {
    scene, camera, look: { bloom: 0.95, vig: 0.6 },
    beforeRender: rimSetup(0xff3a4a, [0, 0.8, -0.4], 1.3)(camera, focus),
    update(I) {
      const t = I.t;
      demons.forEach((d, i) => {
        const a = d.userData.a + t * 0.35, r = 3.4 + 0.2 * Math.sin(t * 1.5 + i);
        d.position.set(Math.cos(a) * r, 0.03 * Math.sin(t * 4 + i), Math.sin(a) * r);
        d.rotation.y = -a - Math.PI / 2 + 0.6;
        d.userData.armL.rotation.x = -0.9 - 0.3 * Math.sin(t * 2 + i); d.userData.armR.rotation.x = -0.8 - 0.3 * Math.sin(t * 2 + i + 1);
      });
      const pose = layer({ ...REST, curlL: 1, curlR: 1, upperArmL: [0.05, 0, 0.18], upperArmR: [0.05, 0, -0.18] }, idle(t, 1));
      pose.head = [0.05, 0.6 * Math.sin(t * 0.8), 0]; pose.face = { look: [Math.sin(t * 0.8), 0], brow: -0.8 };
      ch.update(t, pose);
      placeShadow(ch);
      const a = -I.p * 0.8 + 0.4;
      moveCam(camera, I, [Math.sin(a) * 7, 5.5, Math.cos(a) * 7], [Math.sin(a - 0.2) * 6, 4.6, Math.cos(a - 0.2) * 6], [0, 0.9, 0], [0, 1.0, 0], { ease: t => t });
    },
  };
};

// ---------------------------------------------------------------- diamond tears
SHOT_BUILDERS.diamonds = (params, v) => {
  const cw = COLORWAYS[v];
  const { scene, camera } = baseScene({ fog: 0x06040c, density: 0.05, fov: 30 });
  scene.add(new THREE.AmbientLight(0x2a2440, 0.7));
  const key = new THREE.DirectionalLight(0xe8f0ff, 1.1); key.position.set(-2, 2, 3); scene.add(key);
  const rim = new THREE.PointLight(cw.neonA, 3, 4, 1.2); rim.position.set(1.0, 1.9, -0.6); scene.add(rim);
  const gem = new THREE.MeshPhongMaterial({ color: 0xc8e8ff, specular: 0xffffff, shininess: 200, emissive: 0x203050, flatShading: true, transparent: true, opacity: 0.92 });
  const rnd = mulberry32(201);
  const floaters = [];
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.03 + rnd() * 0.06), gem);
    m.position.set((rnd() - 0.5) * 1.6, 1.2 + rnd() * 1.0, -0.4 - rnd() * 1.4);
    m.userData = { p: m.position.clone(), sp: rnd() * 2 + 0.5, ph: rnd() * TAU };
    scene.add(m); floaters.push(m);
  }
  const tears = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.009), gem);
    const gl = K.glowSprite(0xe0f0ff, 0.05, 0.9); m.add(gl);
    scene.add(m); tears.push(m);
  }
  scene.add(K.particles({ count: 200, box: [1.6, 1.4, 1.2], center: [0, 1.6, -0.6], vel: [0, -0.1, 0], kind: 'spark', color: 0xe8f4ff, size: 2.5, seed: 203 }));
  for (let i = 0; i < 16; i++) { const s = K.glowSprite(i % 2 ? cw.neonA : 0x70c0ff, 0.3 + rnd() * 0.5, 0.25); s.position.set((rnd() - 0.5) * 4, 1 + rnd() * 1.6, -2 - rnd() * 2); scene.add(s); }
  const ch = addLead(scene, { shadow: false });
  ch.group.rotation.y = -0.55;
  const focus = () => new THREE.Vector3(0, 1.66, 0);
  const eyeW = new THREE.Vector3();
  return {
    scene, camera, look: { bloom: 0.95, vig: 0.55 },
    beforeRender: rimSetup(cw.neonA, [0.8, 0.3, -0.3], 1.1)(camera, focus),
    update(I) {
      const t = I.t;
      const pose = layer(REST, idle(t, 0.6, 5));
      pose.head = [0.18, -0.1, -0.05]; pose.face = { blink: 0.5, look: [-0.3, 0.6], tear: 1, brow: 0.8, seed: 19 };
      pose.wind = 0.2;
      ch.update(t, pose);
      ch.group.updateMatrixWorld(true);
      // Tears slide from under his right eye down the cheek, then fall.
      ch.head.localToWorld(eyeW.set(-0.04, -0.005, 0.1));
      tears.forEach((m, i) => {
        const ph = ((t * 0.45 + i / tears.length) % 1);
        const slide = Math.min(ph, 0.5) / 0.5, fall = Math.max(0, ph - 0.5) / 0.5;
        m.position.set(eyeW.x - 0.005 * slide, eyeW.y - 0.05 * slide - 1.2 * fall * fall, eyeW.z + 0.005 + 0.02 * fall);
        m.rotation.set(t * 3 + i, t * 2, 0);
        m.scale.setScalar(0.8 + 0.6 * slide);
      });
      floaters.forEach(m => { const u = m.userData; m.position.y = u.p.y + 0.05 * Math.sin(t * u.sp + u.ph); m.rotation.set(t * u.sp * 0.5, t * u.sp, 0); });
      moveCam(camera, I, [0.42, 1.68, 0.62], [0.34, 1.67, 0.52], [0.0, 1.64, 0], [0.0, 1.645, 0], { ease: smooth, shake: 0.4 });
    },
  };
};
