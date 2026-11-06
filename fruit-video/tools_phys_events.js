#!/usr/bin/env node
'use strict';
/* tools_phys_events.js: turn the physics simulations of an episode into the foley event list for the sound builder.
 *
 *   node tools_phys_events.js <ep>          e.g.  node tools_phys_events.js 15
 *
 * Reads    build/ep<ep>/phys_sims.json   { "<scene id>": "path/to/ep15_<scene>_sim.js" }   (path relative to the project folder or to the json;
 *                                         "file.js#name" picks the export `name` instead of `build`)
 *                                         a scene may map to an ARRAY of sim modules (Episode 22: a rigid PHYS2D sim and a SOFT2D sim):
 *                                         { "swap": ["ep22_swap_rigid_sim.js", "ep22_swap_sim.js"] }   their events are merged
 *          build/ep<ep>/timeline.json     scenes[].{id,start}   (scene start times; absolute seconds)
 * Runs     each sim module's build(), which returns { world, T, screen: { w, h, cx, cam }, sceneStart?, maxEvents? }
 *          (the world is run for T seconds here unless build() already ran it). A world with kind === 'soft' (soft2d.js)
 *          goes through SOFT2D.eventsToFoley (name:'soft'), any other through PHYS2D.eventsToFoley (name:'phys').
 * Writes   build/ep<ep>/phys_events.json  a flat array sorted by time (absolute seconds):
 *          [{ t, name:'phys', mat:'metal+wood', mag:0.62, pan:-0.3, x, y, k:'hit'|'slide'|'roll'|'break', tag:'chair+floor', scene:'dock' }, ...]
 *          [{ t, name:'soft', mat:'paper' | 'chux+cardboard', mag, pan, x, y, k:'tear'|'crinkle'|'hit'|'slide'|'squeak'|'stretch'|'pop'|'flap', tag, scene }, ...]
 * Prints   a one-line summary per sim and the total.
 * Episodes 15 to 21 (one PHYS2D sim per scene) give byte-identical output to the earlier version of this tool.
 */
const fs = require('fs');
const path = require('path');
const PHYS2D = require('./phys2d.js');
let SOFT2D = null;   // loaded only when a soft world appears

const ep = process.argv[2];
if (!ep) { console.error('usage: node tools_phys_events.js <ep>   (reads build/ep<ep>/phys_sims.json)'); process.exit(2); }
const root = __dirname, dir = path.join(root, 'build', 'ep' + ep);
function readJson(p, optional) {
  if (!fs.existsSync(p)) { if (optional) return null; console.error('missing ' + path.relative(root, p)); process.exit(2); }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
const simsPath = path.join(dir, 'phys_sims.json');
const sims = readJson(simsPath), timeline = readJson(path.join(dir, 'timeline.json'), true);
const starts = {};
if (timeline && Array.isArray(timeline.scenes)) for (const s of timeline.scenes) starts[s.id] = s.start;

/* run one sim module for scene `id`; returns its foley events (with scene set) and its raw event count */
function runSim(id, spec, label) {
  const [file, exp] = String(spec).split('#');
  let abs = path.resolve(root, file);
  if (!fs.existsSync(abs)) abs = path.resolve(dir, file);
  if (!fs.existsSync(abs)) throw new Error('sim module not found: ' + file);
  const mod = require(abs);
  const build = exp ? mod[exp] : (typeof mod.build === 'function' ? mod.build : mod);
  if (typeof build !== 'function') throw new Error('module has no build() export' + (exp ? ' named ' + exp : ''));
  const t0 = process.hrtime.bigint();
  const out = build();
  if (!out || !out.world) throw new Error('build() must return { world, T, screen }');
  const w = out.world;
  if (!w._ran) w.run(out.T, { sampleHz: out.sampleHz || 120 });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const start = starts[id] != null ? starts[id] : (out.sceneStart != null ? out.sceneStart : 0);
  const soft = w.kind === 'soft';
  if (soft && !SOFT2D) SOFT2D = require('./soft2d.js');
  const ev = (soft ? SOFT2D : PHYS2D).eventsToFoley(w.events, Object.assign({ sceneStart: start, screen: out.screen || { w: 1080, h: 1920, cx: 540 }, maxEvents: out.maxEvents || 120 }, out.foley || {}));
  for (const e of ev) e.scene = id;
  const mx = ev.reduce((m, e) => Math.max(m, e.mag), 0);
  console.log(label.padEnd(14) + ' start ' + start.toFixed(2).padStart(7) + ' s  sim ' + String(Math.round(ms)).padStart(5) + ' ms  raw events ' + String(w.events.length).padStart(5) + '  kept ' + String(ev.length).padStart(4) + '  loudest ' + mx.toFixed(2) + (w.warnings.length ? '  WARNINGS ' + w.warnings.length : '') + (soft ? '  (soft)' : ''));
  if (w.warnings.length) console.log('   ' + w.warnings.slice(0, 3).join('\n   '));
  return { ev: ev, raw: w.events.length };
}

const all = [];
let failed = 0, total = 0, nsim = 0;
for (const id of Object.keys(sims)) {
  const list = Array.isArray(sims[id]) ? sims[id] : [sims[id]];
  for (let i = 0; i < list.length; i++) {
    nsim++;
    const label = list.length > 1 ? id + '[' + i + ']' : id;
    try {
      const r = runSim(id, list[i], label);
      all.push.apply(all, r.ev);
      total += r.raw;
    } catch (e) {
      failed++;
      console.error(label.padEnd(14) + ' FAILED: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
    }
  }
}
all.sort(function (a, b) { return a.t - b.t || (a.scene < b.scene ? -1 : 1); });
const outPath = path.join(dir, 'phys_events.json');
fs.writeFileSync(outPath, JSON.stringify(all) + '\n');
console.log('wrote ' + path.relative(root, outPath) + ': ' + all.length + ' events from ' + (nsim - failed) + (nsim === Object.keys(sims).length ? ' scene(s)' : ' sim(s) in ' + Object.keys(sims).length + ' scene(s)') + ' (' + total + ' before thinning)');
process.exit(failed ? 1 : 0);
