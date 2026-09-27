// Shot builders. Each returns { scene, camera, update(I), beforeRender(), look } where I carries
// global time t, local time lt, duration dur, progress p, colorway v, params and section.
import * as THREE from 'three';
import { Character } from './character.js';
import { LOOK, toon, inked, glowMat } from './toon.js';
import * as K from './kit.js';
import { POSES, REST, blend, layer, idle, walk, crawl, SIT_LEDGE, SIT_HUG } from './poses.js';
import { clamp, lerp, sstep, smooth, easeInOut, easeOut, easeIn, noise1, fbm1, keyed, hash, TAU } from './util.js';
import { drawTitle } from './overlay.js';

export const SHOT_BUILDERS = {};
const V3 = (a) => new THREE.Vector3(...a);

// ---------------------------------------------------------------- shared helpers
// Colorways for the three choruses: violet, crimson, gold.
export const COLORWAYS = [
  { rim: 0xb37bff, neonA: 0xd05cff, neonB: 0x55c8ff, fog: 0x1a0c2b, sky: [0x05030c, 0x1d0f33, 0x2a1340] },
  { rim: 0xff5a7a, neonA: 0xff3a5a, neonB: 0xff9a5a, fog: 0x2a0a14, sky: [0x0c0306, 0x33101a, 0x401420] },
  { rim: 0xffc070, neonA: 0xffb04a, neonB: 0xfff0c0, fog: 0x2a1a0c, sky: [0x0c0804, 0x332210, 0x40301a] },
];

export function baseScene({ fog = 0x1a0c2b, density = 0.045, sky = null, fov = 35 } = {}) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(fog, density);
  scene.background = new THREE.Color(fog);
  if (sky) scene.add(K.skyDome({ top: sky[0], mid: sky[1], bottom: sky[2] }));
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.05, 900);
  return { scene, camera };
}

// Camera move between two positions and targets, with a little handheld drift.
export function moveCam(cam, I, from, to, lookFrom, lookTo, o = {}) {
  const e = (o.ease || easeInOut)(clamp(I.p));
  const pos = V3(from).lerp(V3(to), e), tgt = V3(lookFrom).lerp(V3(lookTo), e);
  const hh = o.shake ?? 1, t = I.t, s = o.seed || 1;
  pos.x += 0.02 * hh * fbm1(t * 0.5, s); pos.y += 0.015 * hh * fbm1(t * 0.45, s + 4);
  tgt.x += 0.012 * hh * fbm1(t * 0.4, s + 8); tgt.y += 0.01 * hh * fbm1(t * 0.5, s + 12);
  cam.position.copy(pos);
  cam.lookAt(tgt);
  if (o.roll) cam.rotateZ(o.roll);
  // Punch-in right after a hard cut.
  const punch = I.tt === 'cut' ? 1 + 0.04 * Math.exp(-I.lt * 7) : 1;
  cam.zoom = (o.zoom || 1) * punch;
  cam.updateProjectionMatrix();
  return tgt;
}

// Rim light and outline weight for this shot, applied right before it renders.
export function rimSetup(color, dir = [-0.7, 0.4, 0.2], strength = 1) {
  const c = new THREE.Color(color), d = new THREE.Vector3(...dir);
  return (cam, focus) => () => {
    LOOK.rimColor.value.copy(c);
    LOOK.rimDir.value.copy(d);
    LOOK.rimStrength.value = strength;
    LOOK.outline.value = 0.0026 * cam.position.distanceTo(focus());
  };
}

// Beat helpers: sections are 16 bars, so a beat is a 64th of a section.
export const BEAT = { len: 26.4 / 64 };
export const beatPulse = (t, from, sharp = 6) => { const b = BEAT.len, ph = (((t - from) % b) + b) % b / b; return Math.exp(-ph * sharp); };

// Adds a character to a scene with a blob shadow that follows him.
export function addLead(scene, o = {}) {
  const ch = new Character();
  scene.add(ch.group);
  if (o.shadow !== false) {
    const sh = K.blobShadow(0.55, o.shadowOpacity ?? 0.65);
    scene.add(sh);
    ch.shadow = sh;
  }
  return ch;
}
export function placeShadow(ch, y = 0) {
  if (!ch.shadow) return;
  const p = new THREE.Vector3();
  ch.bones.hips.getWorldPosition(p);
  ch.shadow.position.set(p.x, y + 0.006, p.z);
}

// ---------------------------------------------------------------- intro: rain under a streetlight
SHOT_BUILDERS.intro = () => {
  const cw = COLORWAYS[0];
  const { scene, camera } = baseScene({ fog: 0x160a24, density: 0.05, sky: cw.sky, fov: 32 });
  K.lights(scene, { ambient: 0x2a2044, ambientI: 0.55, key: 0xe6d0ff, keyI: 0.25, keyPos: [1, 6, 3], back: 0xa66cff, backI: 1.6, backPos: [-2, 3, -4] });
  scene.add(K.ground({ color: 0x0b0812 }));
  // Sidewalk curb.
  const curb = inked(new THREE.Mesh(new THREE.BoxGeometry(60, 0.14, 3.2), toon(0x15101c, { rim: 0 })), 0.8);
  curb.position.set(0, 0.07, -0.6);
  scene.add(curb);
  const lamp = K.streetLight({ color: 0xdcc4ff, intensity: 14 }); lamp.position.set(-0.85, 0.14, -0.5); scene.add(lamp);
  const lamp2 = K.streetLight({ color: 0xffb0e0, light: false, coneOpacity: 0.15 }); lamp2.position.set(-11, 0.14, -0.5); scene.add(lamp2);
  const lamp3 = K.streetLight({ color: 0xb8c8ff, light: false, coneOpacity: 0.15 }); lamp3.position.set(10, 0.14, -0.5); scene.add(lamp3);
  scene.add(K.city({ seed: 3, count: 26, x: [-30, 30], z: [-16, -9], h: [8, 22], w: [4, 8], litColor: [255, 190, 150], litRatio: 0.18 }));
  scene.add(K.city({ seed: 8, count: 60, x: [-90, 90], z: [-80, -30], h: [15, 60], w: [5, 12], litColor: [200, 160, 255], litRatio: 0.3 }));
  // Neon signs on the storefronts.
  scene.add(K.neonTube([-6.5, 3.2, -7.9], [-3.5, 3.2, -7.9], 0xff4fd8, 6));
  scene.add(K.neonTube([4.2, 2.6, -7.9], [4.2, 5.2, -7.9], 0x5ad0ff, 6));
  scene.add(K.neonTube([2.0, 3.8, -7.9], [3.6, 3.8, -7.9], 0x5ad0ff, 5));
  // Wet street: light streaks under the lamps and signs.
  const g1 = K.puddleGlint(0xcfb4ff, 7, 1.2, 0.35); g1.position.set(0, 0.012, 2.5); scene.add(g1);
  const g2 = K.puddleGlint(0xff4fd8, 6, 0.6, 0.25); g2.position.set(-5, 0.012, -3); scene.add(g2);
  const g3 = K.puddleGlint(0x5ad0ff, 6, 0.5, 0.25); g3.position.set(4.2, 0.012, -3); scene.add(g3);
  scene.add(K.rain({ count: 4000, box: [18, 12, 16], center: [0, 5, 1] }));
  scene.add(K.ripples({ count: 120, area: [14, 10], center: [0, 0.015, 1], opacity: 0.25 }));
  const ch = addLead(scene);
  const focus = () => new THREE.Vector3(0, 1.35, 0);
  return {
    scene, camera,
    look: { bloom: 0.7, vig: 0.5 },
    beforeRender: rimSetup(0xb38aff, [-0.6, 0.5, -0.1], 1.1)(camera, focus),
    overlay: (g, I, a) => drawTitle(g, I.lt, a),
    update(I) {
      const up = sstep(6.5, 8.5, I.lt);
      const pose = layer(POSES.pockets, idle(I.t, 1));
      pose.head = [0.38 - 0.34 * up, 0, 0.04];
      pose.neck = [0.12 - 0.1 * up, 0, 0];
      pose.face = { look: [0, 0.7 - 0.8 * up], seed: 1 };
      pose.wind = 0.15;
      ch.update(I.t, pose);
      placeShadow(ch);
      moveCam(camera, I, [1.6, 0.5, 9.5], [0.5, 1.05, 3.6], [0, 1.9, 0], [0.05, 1.6, 0], { ease: smooth });
    },
  };
};

// Stand-in for shots that are not built yet: the lead idling in a violet void.
SHOT_BUILDERS.placeholder = () => {
  const { scene, camera } = baseScene({ fog: 0x120a1e, density: 0.06, fov: 32 });
  K.lights(scene, {});
  scene.add(K.ground({}));
  const ch = addLead(scene);
  const focus = () => new THREE.Vector3(0, 1.2, 0);
  return {
    scene, camera, look: {},
    beforeRender: rimSetup(0xb37bff)(camera, focus),
    update(I) { ch.update(I.t, layer(REST, idle(I.t))); placeShadow(ch); moveCam(camera, I, [0, 1.3, 5], [0, 1.3, 4.4], [0, 1.1, 0], [0, 1.1, 0]); },
  };
};
