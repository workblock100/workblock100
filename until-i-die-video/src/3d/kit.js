// Set-building kit: sky, stars, moon, rain, particles, city, lights, neon, ground, water, clouds.
// Anything animated takes its time from a shared uniform, so frames stay a pure function of time.
import * as THREE from 'three';
import { toon, inked, glowMat } from './toon.js';
import { mulberry32, clamp, lerp, TAU } from './util.js';

export const TIME = { value: 0 };

// ---------------------------------------------------------------- textures
const _tex = new Map();
function cached(key, make) { if (!_tex.has(key)) _tex.set(key, make()); return _tex.get(key); }

export function glowTexture() {
  return cached('glow', () => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,0.75)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.3)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

export function cloudTexture(seed = 1) {
  return cached('cloud' + seed, () => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const rnd = mulberry32(seed * 977);
    for (let i = 0; i < 26; i++) {
      const x = 60 + rnd() * 136, y = 80 + rnd() * 96, r = 30 + rnd() * 50;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// Building facade: dark wall with a grid of windows, some lit.
function windowTexture(seed, lit = [255, 200, 140], litRatio = 0.28) {
  return cached('win' + seed + lit.join(), () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#0d0a14'; g.fillRect(0, 0, 256, 512);
    const rnd = mulberry32(seed);
    for (let y = 6; y < 506; y += 16) for (let x = 6; x < 250; x += 16) {
      const on = rnd() < litRatio;
      const k = 0.35 + 0.65 * rnd();
      g.fillStyle = on ? `rgb(${lit[0] * k | 0},${lit[1] * k | 0},${lit[2] * k | 0})` : '#120e1a';
      g.fillRect(x, y, 9, 7);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

// ---------------------------------------------------------------- lights and glow
export function glowSprite(color, size, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}

// Additive cone of light: apex at the origin pointing down -y.
export function lightCone(len, radius, color, opacity = 0.25) {
  const geo = new THREE.ConeGeometry(radius, len, 40, 1, true);
  geo.translate(0, -len / 2, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uLen: { value: len } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ vY = -position.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; uniform float uLen; varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ float along = 1.0 - clamp(vY/uLen, 0.0, 1.0); float edge = pow(abs(dot(vN, vV)), 1.6);
        gl_FragColor = vec4(uColor * uOpacity * along * along * edge, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

export function streetLight(o = {}) {
  const { height = 4.2, color = 0xd9b8ff, coneOpacity = 0.12, light = true, intensity = 40 } = o;
  const g = new THREE.Group();
  const dark = toon(0x1a1622, { rim: 0.8 });
  const pole = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, height, 12), dark), 1);
  pole.position.y = height / 2;
  const arm = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 10), dark), 1);
  arm.rotation.z = Math.PI / 2; arm.position.set(0.42, height - 0.05, 0);
  const head = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.14, 16), dark), 1);
  head.position.set(0.85, height - 0.1, 0);
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), glowMat(color, 4));
  bulb.rotation.x = Math.PI / 2; bulb.position.set(0.85, height - 0.175, 0);
  const halo = glowSprite(color, 1.8, 0.9); halo.position.set(0.85, height - 0.25, 0);
  const cone = lightCone(height - 0.2, 1.7, color, coneOpacity); cone.position.set(0.85, height - 0.18, 0);
  g.add(pole, arm, head, bulb, halo, cone);
  if (light) {
    const pl = new THREE.PointLight(color, intensity, 12, 1.6); pl.position.set(0.85, height - 0.4, 0); g.add(pl);
    g.userData.light = pl;
  }
  g.userData.parts = { bulb, halo, cone };
  return g;
}

export function neonTube(a, b, color, intensity = 5, radius = 0.025) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 10), glowMat(color, intensity));
  g.add(tube);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(radius * 16, len * 1.04), new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.x = 1;
  g.add(halo);
  g.position.copy(A).add(B).multiplyScalar(0.5);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  g.userData = { tube, halo, base: intensity, color: new THREE.Color(color) };
  return g;
}

// ---------------------------------------------------------------- sky
export function skyDome({ top = 0x05030c, mid = 0x1a0d2e, bottom = 0x2a1340, radius = 400 } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTop: { value: new THREE.Color(top) }, uMid: { value: new THREE.Color(mid) }, uBot: { value: new THREE.Color(bottom) } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uTop, uMid, uBot; varying vec3 vP;
      void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(uMid, uTop, smoothstep(0.0, 0.55, y)) : mix(uMid, uBot, smoothstep(0.0, -0.3, y)); gl_FragColor = vec4(c,1.0); }`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  m.renderOrder = -10;
  return m;
}

export function stars({ n = 1500, radius = 350, seed = 3, size = 2.2, minY = -0.05 } = {}) {
  const rnd = mulberry32(seed);
  const pos = [], ph = [];
  while (pos.length < n * 3) {
    const u = rnd() * 2 - 1, a = rnd() * TAU, r = Math.sqrt(1 - u * u);
    if (u < minY) continue;
    pos.push(Math.cos(a) * r * radius, u * radius, Math.sin(a) * r * radius);
    ph.push(rnd() * 100, 0.4 + rnd() * rnd() * 1.6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 2));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: TIME, uSize: { value: size } },
    vertexShader: `attribute vec2 aPh; uniform float uTime; uniform float uSize; varying float vA;
      void main(){ vA = aPh.y * (0.6 + 0.4*sin(uTime*1.7 + aPh.x)); gl_PointSize = uSize * aPh.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying float vA; void main(){ vec2 d = gl_PointCoord-0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(vec3(0.9,0.88,1.0)*vA*a, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const p = new THREE.Points(geo, mat);
  p.renderOrder = -9;
  return p;
}

export function moon(r = 8, color = 0xf3ecff) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.95), fog: false }));
  // Craters as faint darker blotches.
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const cg = c.getContext('2d'); const rnd = mulberry32(11);
  cg.fillStyle = '#fff'; cg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 14; i++) { cg.fillStyle = `rgba(150,140,190,${0.12 + rnd() * 0.18})`; cg.beginPath(); cg.arc(40 + rnd() * 176, 40 + rnd() * 176, 8 + rnd() * 26, 0, TAU); cg.fill(); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  disc.material.map = tx;
  const halo = glowSprite(color, r * 5, 0.28);
  g.add(halo, disc);
  return g;
}

// ---------------------------------------------------------------- rain
// Streaks as camera-facing quads, animated entirely in the vertex shader.
export function rain({ count = 4000, box = [30, 16, 30], center = [0, 6, 0], speed = 14, length = 0.32, width = 0.007, color = 0xc9c0ff, opacity = 0.3, wind = [0.12, 0.05], seed = 5 } = {}) {
  const base = new THREE.PlaneGeometry(1, 1); base.translate(0, -0.5, 0);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; geo.attributes.position = base.attributes.position; geo.attributes.uv = base.attributes.uv;
  const rnd = mulberry32(seed);
  const off = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { off[i * 4] = rnd(); off[i * 4 + 1] = rnd(); off[i * 4 + 2] = rnd(); off[i * 4 + 3] = 0.7 + rnd() * 0.6; }
  geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
  geo.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: TIME, uBox: { value: new THREE.Vector3(...box) }, uCenter: { value: new THREE.Vector3(...center) }, uSpeed: { value: speed },
      uLen: { value: length }, uW: { value: width }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uWind: { value: new THREE.Vector2(...wind) } },
    vertexShader: `attribute vec4 aOff; uniform float uTime, uSpeed, uLen, uW; uniform vec3 uBox, uCenter; uniform vec2 uWind; varying float vFade; varying vec2 vUv;
      void main(){
        float sp = uSpeed * aOff.w;
        vec3 vel = normalize(vec3(uWind.x, -1.0, uWind.y));
        float fall = fract(aOff.y - uTime * sp / uBox.y);
        vec3 p = uCenter + vec3((aOff.x - 0.5) * uBox.x, (fall - 0.5) * uBox.y, (aOff.z - 0.5) * uBox.z);
        p.xz += vel.xz * (fall - 0.5) * uBox.y * -1.0;
        vec3 camToP = normalize(p - cameraPosition);
        vec3 side = normalize(cross(vel, camToP));
        vec3 wp = p + vel * (-position.y) * uLen * aOff.w + side * position.x * uW;
        vFade = smoothstep(0.0, 0.08, fall) * smoothstep(1.0, 0.9, fall);
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vFade; varying vec2 vUv;
      void main(){ float a = (1.0 - abs(vUv.x - 0.5) * 2.0) * smoothstep(0.0, 0.5, vUv.y); gl_FragColor = vec4(uColor * uOpacity * vFade * a, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  return m;
}

// Expanding ripples on a wet floor (y = 0 plane in the group's space).
export function ripples({ count = 120, area = [16, 16], center = [0, 0.005, 0], color = 0xd7ccff, opacity = 0.35, rate = 1.6, seed = 7 } = {}) {
  const base = new THREE.PlaneGeometry(1, 1); base.rotateX(-Math.PI / 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; geo.attributes.position = base.attributes.position; geo.attributes.uv = base.attributes.uv;
  const rnd = mulberry32(seed);
  const off = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { off[i * 3] = rnd(); off[i * 3 + 1] = rnd(); off[i * 3 + 2] = rnd(); }
  geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3));
  geo.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: TIME, uArea: { value: new THREE.Vector2(...area) }, uCenter: { value: new THREE.Vector3(...center) }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uRate: { value: rate } },
    vertexShader: `attribute vec3 aOff; uniform float uTime, uRate; uniform vec2 uArea; uniform vec3 uCenter; varying vec2 vUv; varying float vLife;
      float h(float n){ return fract(sin(n) * 43758.5453); }
      void main(){
        float ph = uTime * uRate + aOff.z * 10.0; float cyc = floor(ph); vLife = fract(ph);
        vec2 xz = vec2(h(cyc * 7.1 + aOff.x * 91.0), h(cyc * 3.7 + aOff.y * 57.0)) - 0.5;
        vec3 p = uCenter + vec3(xz.x * uArea.x, 0.0, xz.y * uArea.y) + position * (0.05 + 0.4 * vLife);
        vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; varying float vLife;
      void main(){ float r = length(vUv - 0.5) * 2.0; float ring = smoothstep(0.75, 0.9, r) * smoothstep(1.0, 0.92, r);
        gl_FragColor = vec4(uColor * ring * uOpacity * (1.0 - vLife), 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------- floating particles
// kind: 'dust' (soft dots), 'ember' (warm, rising), 'bubble' (rings), 'spark' (twinkling stars).
export function particles({ count = 400, box = [10, 6, 10], center = [0, 3, 0], vel = [0, 0.1, 0], color = 0xe0d0ff, size = 6, opacity = 0.8, kind = 'dust', seed = 9, jitter = 0.3 } = {}) {
  const rnd = mulberry32(seed);
  const pos = new Float32Array(count * 3), ph = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) { pos[i * 3] = rnd(); pos[i * 3 + 1] = rnd(); pos[i * 3 + 2] = rnd(); ph[i * 2] = rnd() * 100; ph[i * 2 + 1] = 0.5 + rnd(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPh', new THREE.BufferAttribute(ph, 2));
  const K = { dust: 0, ember: 1, bubble: 2, spark: 3 }[kind];
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: TIME, uBox: { value: new THREE.Vector3(...box) }, uCenter: { value: new THREE.Vector3(...center) }, uVel: { value: new THREE.Vector3(...vel) },
      uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uOpacity: { value: opacity }, uJit: { value: jitter } },
    vertexShader: `attribute vec2 aPh; uniform float uTime, uSize, uJit; uniform vec3 uBox, uCenter, uVel; varying float vTw;
      void main(){
        vec3 p = fract(position + uVel * uTime * aPh.y / uBox) - 0.5;
        p = uCenter + p * uBox + uJit * vec3(sin(uTime * 0.7 + aPh.x), sin(uTime * 0.9 + aPh.x * 1.3), cos(uTime * 0.6 + aPh.x));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vTw = 0.55 + 0.45 * sin(uTime * (1.5 + aPh.y * 2.0) + aPh.x);
        gl_PointSize = uSize * aPh.y * (${K === 3 ? '0.6 + 1.4 * vTw' : '1.0'}) * 30.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vTw;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float a;
        ${K === 2 ? 'a = smoothstep(0.7, 0.85, r) * smoothstep(1.0, 0.9, r) + 0.25 * smoothstep(0.35, 0.0, length(d + vec2(0.18)));'
        : K === 3 ? 'a = smoothstep(0.12, 0.0, abs(d.x) * abs(d.y) * 12.0) * smoothstep(1.0, 0.0, r) + smoothstep(0.35, 0.0, r);'
        : 'a = smoothstep(1.0, 0.0, r); a *= a;'}
        gl_FragColor = vec4(uColor * a * uOpacity * ${K === 2 ? '1.0' : 'vTw'}, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const m = new THREE.Points(geo, mat);
  m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------- city
// A block of buildings with lit windows. Returns a group of instanced boxes.
export function city({ seed = 1, count = 60, x = [-40, 40], z = [-60, -20], h = [6, 30], w = [3, 7], litColor = [255, 200, 150], litRatio = 0.3, wallColor = 0x14101c, fogged = true } = {}) {
  const rnd = mulberry32(seed);
  const tex = windowTexture(seed, litColor, litRatio);
  const mat = new THREE.MeshLambertMaterial({ color: wallColor, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.1, map: null, fog: fogged });
  mat.onBeforeCompile = sh => {
    // Stretch the window grid to each building's size so windows stay square.
    sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
      #ifdef USE_INSTANCING
        vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vec2 rep = abs(normal.y) > 0.5 ? vec2(0.0) : vec2((abs(normal.x) > 0.5 ? sc.z : sc.x) / 12.0, sc.y / 20.0);
        vEmissiveMapUv = uv * rep + vec2(fract(instanceMatrix[3].x * 0.37), fract(instanceMatrix[3].z * 0.21));
      #endif`);
  };
  mat.customProgramCacheKey = () => 'citywin';
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const M = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const bw = lerp(w[0], w[1], rnd()), bd = lerp(w[0], w[1], rnd()), bh = lerp(h[0], h[1], Math.pow(rnd(), 1.6));
    M.makeScale(bw, bh, bd);
    M.setPosition(lerp(x[0], x[1], rnd()), 0, lerp(z[0], z[1], rnd()));
    inst.setMatrixAt(i, M);
  }
  inst.frustumCulled = false;
  return inst;
}

// ---------------------------------------------------------------- ground
export function ground({ size = 200, color = 0x0d0a14, rim = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), toon(color, { rim }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

// Fake wet-floor reflection of a light: a soft vertical streak lying on the ground toward the camera.
export function puddleGlint(color, length = 4, width = 0.7, opacity = 0.5) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, length), new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.01;
  return m;
}

export function blobShadow(r = 0.5, opacity = 0.6) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0x000000, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006;
  return m;
}

// ---------------------------------------------------------------- clouds
export function cloudLayer({ count = 30, area = [120, 60], y = 20, size = [20, 40], color = 0x6a5a90, opacity = 0.5, seed = 4 } = {}) {
  const g = new THREE.Group();
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const m = new THREE.SpriteMaterial({ map: cloudTexture(1 + (i % 4)), color, transparent: true, opacity: opacity * (0.5 + 0.5 * rnd()), depthWrite: false });
    const s = new THREE.Sprite(m);
    const sz = lerp(size[0], size[1], rnd());
    s.scale.set(sz, sz * 0.55, 1);
    s.position.set((rnd() - 0.5) * area[0], y + (rnd() - 0.5) * 6, (rnd() - 0.5) * area[1]);
    s.userData.base = s.position.clone();
    g.add(s);
  }
  return g;
}

// ---------------------------------------------------------------- water
export function water({ size = 300, color = 0x0b1030, crest = 0x6a7ad0, amp = 0.25, freq = 0.35, speed = 0.8, glitter = 0xe8e0ff, moonDir = [0, 0.35, -1] } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, 180, 180); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: TIME, uAmp: { value: amp }, uFreq: { value: freq }, uSpeed: { value: speed }, uColor: { value: new THREE.Color(color) }, uCrest: { value: new THREE.Color(crest) },
      uGlitter: { value: new THREE.Color(glitter) }, uMoon: { value: new THREE.Vector3(...moonDir).normalize() },
      fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 1000 } },
    vertexShader: `uniform float uTime, uAmp, uFreq, uSpeed; varying vec3 vW; varying float vH; varying vec3 vN;
      float wave(vec2 p){ float h = 0.0; h += sin(p.x*uFreq + uTime*uSpeed) * 1.0; h += sin(p.y*uFreq*1.3 - uTime*uSpeed*1.2 + p.x*0.2) * 0.7;
        h += sin((p.x+p.y)*uFreq*2.3 + uTime*uSpeed*1.7) * 0.3; h += sin((p.x-p.y*0.6)*uFreq*4.1 - uTime*uSpeed*2.3) * 0.12; return h * uAmp; }
      void main(){ vec3 p = (modelMatrix * vec4(position,1.0)).xyz; float h = wave(p.xz); p.y += h;
        float e = 0.3; vec3 dx = vec3(e, wave(p.xz+vec2(e,0.0))-h, 0.0), dz = vec3(0.0, wave(p.xz+vec2(0.0,e))-h, e);
        vN = normalize(cross(dz, dx)); vH = h / max(uAmp, 1e-3); vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p,1.0); }`,
    fragmentShader: `uniform vec3 uColor, uCrest, uGlitter, uMoon; uniform float uTime; uniform vec3 fogColor; uniform float fogDensity; varying vec3 vW; varying float vH; varying vec3 vN;
      void main(){ vec3 V = normalize(cameraPosition - vW); vec3 R = reflect(-V, vN);
        float band = step(0.55, vH * 0.5 + 0.5);
        vec3 c = mix(uColor, uCrest, 0.25 * smoothstep(-0.2, 1.2, vH) + 0.25 * band);
        float fres = pow(1.0 - max(dot(V, vN), 0.0), 4.0); c += uCrest * fres * 0.35;
        float g = pow(max(dot(R, uMoon), 0.0), 60.0); float sparkle = step(0.965, fract(sin(dot(floor(vW.xz*6.0), vec2(12.9,78.2)))*43758.5 + uTime*0.5));
        c += uGlitter * (step(0.6, g) * 2.5 + g * 0.8) * (0.6 + 0.8 * sparkle);
        float d = length(cameraPosition - vW); float f = 1.0 - exp(-fogDensity*fogDensity*d*d); c = mix(c, fogColor, f);
        gl_FragColor = vec4(c, 1.0); }`,
    fog: true,
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  m.userData.waveHeight = (x, z, t) => {
    const f = mat.uniforms.uFreq.value, s = mat.uniforms.uSpeed.value, a = mat.uniforms.uAmp.value;
    let h = Math.sin(x * f + t * s) + 0.7 * Math.sin(z * f * 1.3 - t * s * 1.2 + x * 0.2) + 0.3 * Math.sin((x + z) * f * 2.3 + t * s * 1.7) + 0.12 * Math.sin((x - z * 0.6) * f * 4.1 - t * s * 2.3);
    return h * a;
  };
  return m;
}

// Standard three-point toon lighting for a set: soft ambient, a key, and a colored back/rim light.
export function lights(scene, { ambient = 0x4a3a6a, ambientI = 1.1, key = 0xfff0e6, keyI = 1.8, keyPos = [3, 5, 4], back = 0xa060ff, backI = 1.2, backPos = [-3, 3, -4] } = {}) {
  const a = new THREE.AmbientLight(ambient, ambientI);
  const k = new THREE.DirectionalLight(key, keyI); k.position.set(...keyPos);
  const b = new THREE.DirectionalLight(back, backI); b.position.set(...backPos);
  scene.add(a, k, b);
  return { ambient: a, key: k, back: b };
}
