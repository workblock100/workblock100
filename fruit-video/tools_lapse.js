#!/usr/bin/env node
'use strict';
/* tools_lapse.js (Episode 20, owner NIGHT): writes build/ep20/lapse.json for the sound builder from the world clock of the time-lapse (ep20_lapse_sim.js, DOM-free: the picture reads the SAME functions).
 *
 *   node tools_lapse.js            writes build/ep20/lapse.json (reads build/ep20/timeline.json for the scene start and checks the sim's frozen beats against it)
 *   node tools_lapse.js --check    also prints the world-time curve every 0.5 s of the lapse
 *
 * The file is an array sampled at 10 Hz over the whole scene `night`, ABSOLUTE seconds (scene start + scene-local time):
 *   { t, worldMin: the world clock in minutes after midnight (1380 = 11:00 PM, 1860 = 7:00 AM next day),
 *     speed: world minutes per video second (1/60 = 0.0167 at real time; about 66.7 at the hold of the lapse, 10.653 .. 18.653 scene-local),
 *     sun: 0..1 the light of the sunrise (0 until 5:40 AM, .55 at 7:00, 1 at the dawn),
 *     moonX: -1..1 where the Moon is across the window pane (left to right), for a pan }
 * Outside the lapse the speed is the real-time rate, 1/60 minute per second. The lapse's own cues (script): lapsewhoosh 10.653, clockspin 10.853, windswell 11.653 (scene-local).
 * Run it again after any change to ep20_lapse_sim.js and tell the lead. */
const fs = require('fs'), path = require('path');
const root = __dirname, dir = path.join(root, 'build', 'ep20');
const api = require('./ep20_lapse_sim.js'), S = api.build();
let start = S.START;
try {
  const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8')), sc = tl.scenes.find(s => s.id === 'night');
  if (sc) {
    if (Math.abs(sc.start - S.START) > 1e-6) console.error('WARNING: the sim assumes scene start ' + S.START + ' but timeline.json says ' + sc.start);
    if (Math.abs(sc.dur - S.DUR) > 1e-6) console.error('WARNING: the sim assumes scene length ' + S.DUR + ' but timeline.json says ' + sc.dur);
    start = sc.start;
    for (const id in S.B) { const b = sc.beats[id]; if (!b || Math.abs(b.s - S.B[id][0]) > 6e-4 || Math.abs(b.e - S.B[id][1]) > 6e-4) console.error('WARNING: beat ' + id + ' differs from timeline.json (' + JSON.stringify(b) + ' vs ' + JSON.stringify(S.B[id]) + ')'); }
  }
} catch (e) { console.error('no timeline.json: using the built-in scene start ' + S.START); }
const rows = S.pathRows().map(r => Object.assign({}, r, { t: +(start + (r.t - S.START)).toFixed(3) }));
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'lapse.json'), JSON.stringify(rows) + '\n');
const at = lt => rows.reduce((b, r) => Math.abs(r.t - (start + lt)) < Math.abs(b.t - (start + lt)) ? r : b, rows[0]);
const clk = m => { const mm = Math.floor(m + 1e-6) % 1440, h = Math.floor(mm / 60), mi = mm % 60; return (h % 12 || 12) + ':' + String(mi).padStart(2, '0') + (h >= 12 ? ' PM' : ' AM'); };
console.log('lapse.json: ' + rows.length + ' samples at 10 Hz, t ' + rows[0].t + ' .. ' + rows[rows.length - 1].t + ' (scene start ' + start + '), worldMin ' + rows[0].worldMin + ' .. ' + rows[rows.length - 1].worldMin +
  ', speed max ' + Math.max(...rows.map(r => r.speed)).toFixed(2) + ' min/s, lapse ' + S.L.t0 + ' .. ' + S.L.t1 + ' (scene-local)');
console.log('world time at 5 points: ' + [S.L.t0, S.L.t0 + 2, S.L.t0 + 4, S.L.t0 + 6, S.L.t1].map(lt => { const r = at(lt); return (lt - 0).toFixed(2) + 's ' + clk(r.worldMin) + ' (' + r.worldMin.toFixed(1) + ', x' + (r.speed * 60).toFixed(0) + ')'; }).join(' | '));
if (process.argv.includes('--check')) for (let lt = S.L.t0 - .5; lt <= S.L.t1 + .5; lt += .5) { const r = at(lt); console.log(lt.toFixed(2).padStart(6), r.worldMin.toFixed(1).padStart(8), clk(r.worldMin).padEnd(9), 'speed', r.speed.toFixed(3).padStart(7), 'sun', r.sun.toFixed(2), 'moonX', r.moonX.toFixed(2)); }
