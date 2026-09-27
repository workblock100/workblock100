// Cel-shading kit: stepped toon materials with a hard colored rim light, and inked outlines
// drawn as back-face hulls pushed out along the normals.
import * as THREE from 'three';

// Shared per-frame settings. Each shot sets these before it renders.
export const LOOK = {
  rimColor: { value: new THREE.Color(0xb070ff) },
  rimDir: { value: new THREE.Vector3(-0.6, 0.3, 0.2) }, // view space, points toward the rim light
  rimStrength: { value: 1.0 },
  outline: { value: 0.004 },                             // world units, scaled with camera distance
};

function gradient(steps) {
  const data = new Uint8Array(steps);
  const t = new THREE.DataTexture(data, steps.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}
const GRAD = gradient([118, 196, 255]);
const GRAD_SOFT = gradient([120, 175, 220, 255]);

// Toon material. rim scales the rim light for this surface; soft uses four bands instead of three.
export function toon(color, o = {}) {
  const m = new THREE.MeshToonMaterial({
    color, gradientMap: o.soft ? GRAD_SOFT : GRAD,
    emissive: o.emissive || 0x000000, emissiveIntensity: o.emissiveIntensity ?? 1,
    map: o.map || null, transparent: !!o.transparent, side: o.side || THREE.FrontSide,
  });
  if (o.transparent) { m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  const rimK = o.rim ?? 1;
  m.onBeforeCompile = sh => {
    sh.uniforms.uRimColor = LOOK.rimColor;
    sh.uniforms.uRimDir = LOOK.rimDir;
    sh.uniforms.uRimStrength = LOOK.rimStrength;
    sh.uniforms.uRimK = { value: rimK };
    sh.fragmentShader = 'uniform vec3 uRimColor; uniform vec3 uRimDir; uniform float uRimStrength; uniform float uRimK;\n' +
      sh.fragmentShader.replace('#include <opaque_fragment>', `
        {
          vec3 vd = normalize(vViewPosition);
          float f = 1.0 - clamp(dot(normal, vd), 0.0, 1.0);
          float side = clamp(dot(normal, normalize(uRimDir)), 0.0, 1.0);
          float rim = smoothstep(0.6, 0.72, f) * smoothstep(0.1, 0.45, side);
          outgoingLight += uRimColor * rim * uRimStrength * uRimK;
        }
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'toon-rim-' + rimK + (o.soft ? 's' : '');
  return m;
}

// Ink outline hull. k scales the line weight for this mesh.
const _outlines = new Map();
export function outline(k = 1, color = 0x0a0612) {
  const key = k + '|' + color;
  if (_outlines.has(key)) return _outlines.get(key);
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = sh => {
    sh.uniforms.uOutline = LOOK.outline;
    sh.vertexShader = 'uniform float uOutline;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `vec3 transformed = vec3(position) + normalize(normal) * uOutline * ${k.toFixed(3)};`);
  };
  m.customProgramCacheKey = () => 'outline-' + k;
  _outlines.set(key, m);
  return m;
}

// Adds an outline hull to a mesh (skinned meshes get a skinned hull on the same skeleton).
export function inked(mesh, k = 1) {
  let hull;
  if (mesh.isSkinnedMesh) {
    hull = new THREE.SkinnedMesh(mesh.geometry, outline(k));
    hull.bind(mesh.skeleton, mesh.bindMatrix);
  } else {
    hull = new THREE.Mesh(mesh.geometry, outline(k));
  }
  hull.frustumCulled = false;
  hull.userData.hull = true;
  mesh.add(hull);
  return mesh;
}

// Unlit glowing material for neon, lamps, eyes of demons, etc. (bloom picks it up).
export function glowMat(color, intensity = 1, o = {}) {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  return new THREE.MeshBasicMaterial({ color: c, transparent: !!o.transparent, opacity: o.opacity ?? 1,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !o.additive, side: o.side || THREE.FrontSide, fog: o.fog ?? true });
}
