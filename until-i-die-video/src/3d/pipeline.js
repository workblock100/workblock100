// Frame pipeline: render the active shot (or two, during a transition) into multisampled HDR
// targets, blend them, add bloom, grade, tone-map, then hand the frame to a 2D canvas for titles.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { W, H } from './util.js';

const TRANSITION = { none: 0, cut: 1, fade: 2, flash: 3, glitch: 4, dip: 5 };

const BlendShader = {
  uniforms: { tA: { value: null }, tB: { value: null }, uW: { value: 0 }, uType: { value: 0 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tA, tB; uniform float uW, uType, uTime; varying vec2 vUv;
    float h(float n){ return fract(sin(n) * 43758.5453); }
    void main(){
      vec4 a = texture2D(tA, vUv);
      if (uType < 0.5) { gl_FragColor = a; return; }
      vec4 b = texture2D(tB, vUv);
      vec4 c;
      if (uType < 1.5) c = uW < 0.5 ? a : b;
      else if (uType < 2.5) c = mix(a, b, uW);
      else if (uType < 3.5) { c = mix(a, b, smoothstep(0.35, 0.65, uW)); float f = sin(3.14159 * uW); c.rgb = mix(c.rgb, c.rgb * 1.6 + vec3(0.55, 0.5, 0.6), f * f * 0.85); }
      else if (uType < 4.5) {
        float k = sin(3.14159 * uW); float fr = floor(uTime * 30.0);
        float row = floor(vUv.y * 36.0 + h(fr) * 9.0);
        vec2 uv = vUv; if (h(row * 1.7 + fr * 3.1) < k * 0.75) uv.x += (h(row * 3.3 + fr) - 0.5) * 0.18 * k;
        float sh = 0.012 * k;
        if (uW < 0.5) c = vec4(texture2D(tA, uv + vec2(sh, 0.0)).r, texture2D(tA, uv).g, texture2D(tA, uv - vec2(sh, 0.0)).b, 1.0);
        else c = vec4(texture2D(tB, uv + vec2(sh, 0.0)).r, texture2D(tB, uv).g, texture2D(tB, uv - vec2(sh, 0.0)).b, 1.0);
      } else c = uW < 0.5 ? mix(a, vec4(0.0), uW * 2.0) : mix(vec4(0.0), b, uW * 2.0 - 1.0);
      gl_FragColor = c;
    }`,
};

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.45 }, uGrain: { value: 0.035 }, uLift: { value: 0.03 },
    uTint: { value: new THREE.Color(0x1c0f2e) }, uFade: { value: 1 }, uCA: { value: 1 }, uFlash: { value: 0 } },
  vertexShader: BlendShader.vertexShader,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain, uLift, uFade, uCA, uFlash; uniform vec3 uTint; varying vec2 vUv;
    void main(){
      vec2 d = vUv - 0.5; float ca = 0.0025 * uCA * dot(d, d) * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv + d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ca).b);
      c = c * (1.0 - uLift) + uLift * uTint;
      float v = smoothstep(0.98, 0.3, length(d * vec2(1.0, 0.85)));
      c *= mix(1.0 - uVig, 1.0, v);
      c += vec3(1.0, 0.95, 1.0) * uFlash;
      float n = fract(sin(dot(floor(vUv * vec2(960.0, 540.0)) + fract(uTime * 7.3) * 91.0, vec2(12.9898, 78.233))) * 43758.5453);
      c += (n - 0.5) * uGrain * (0.4 + 0.6 * (1.0 - dot(c, vec3(0.33))));
      gl_FragColor = vec4(c * uFade, 1.0);
    }`,
};

class ShotsPass extends Pass {
  constructor(pipe) {
    super();
    this.pipe = pipe;
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial(BlendShader));
  }
  render(renderer, writeBuffer) {
    const f = this.pipe.frame;
    const u = this.quad.material.uniforms;
    const draw = (shot, rt) => {
      renderer.setRenderTarget(rt);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      shot.beforeRender && shot.beforeRender(renderer);
      renderer.render(shot.scene, shot.camera);
    };
    draw(f.A, this.pipe.rtA);
    if (f.B) draw(f.B, this.pipe.rtB);
    u.tA.value = this.pipe.rtA.texture;
    u.tB.value = f.B ? this.pipe.rtB.texture : this.pipe.rtA.texture;
    u.uW.value = f.w;
    u.uType.value = f.B ? TRANSITION[f.type] ?? 2 : 0;
    u.uTime.value = f.t;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
}

export class Pipeline {
  constructor() {
    this.gl = document.createElement('canvas');
    this.gl.width = W; this.gl.height = H;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.gl, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1);
    r.setSize(W, H, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1.0;
    const rtOpts = { type: THREE.HalfFloatType, samples: 4 };
    this.rtA = new THREE.WebGLRenderTarget(W, H, rtOpts);
    this.rtB = new THREE.WebGLRenderTarget(W, H, rtOpts);
    this.composer = new EffectComposer(r, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }));
    this.composer.setPixelRatio(1);
    this.composer.setSize(W, H);
    this.shots = new ShotsPass(this);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.85);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.shots);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
    this.frame = null;
  }

  // frame: { A: shot, B: shot|null, w, type, t, look: { bloom, exposure, vig, grain, lift, fade, flash } }
  render(frame) {
    this.frame = frame;
    const L = frame.look || {};
    this.bloom.strength = L.bloom ?? 0.55;
    this.bloom.radius = L.bloomRadius ?? 0.6;
    this.bloom.threshold = L.threshold ?? 0.85;
    this.renderer.toneMappingExposure = L.exposure ?? 1.0;
    const g = this.grade.uniforms;
    g.uTime.value = frame.t;
    g.uVig.value = L.vig ?? 0.45;
    g.uGrain.value = L.grain ?? 0.035;
    g.uLift.value = L.lift ?? 0.03;
    g.uFade.value = L.fade ?? 1;
    g.uFlash.value = L.flash ?? 0;
    g.uCA.value = L.ca ?? 1;
    this.composer.render();
  }
}
