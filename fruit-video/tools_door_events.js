#!/usr/bin/env node
'use strict';
/* tools_door_events.js (Episode 18, owner ALARM): writes build/ep18/door_events.json for the sound builder from the door timeline of the alarm scene (ep18_alarm_sim.js, DOM-free).
 *
 *   node tools_door_events.js            (reads build/ep18/timeline.json for the scene start; writes build/ep18/door_events.json)
 *
 * Each entry has ABSOLUTE seconds (scene start + scene-local time):
 *   { t, name: 'doorslam' | 'doorbonk' | 'doorlatch', door: 0..5 (the CLOSING ORDER: 0 = the farthest, 5 = the nearest), depth: 0..1 (0 = at the camera, 1 = the far end), pan: -1..1, gain: 0..1 }
 *   { t, name: 'hornstate', closed: n }   after every real slam: the number of doors shut so far (1..6); the horn is muffled one more step each time
 * Sorted by t (at equal t: doorbonk, doorslam, hornstate, doorlatch). The picture reads the same table, so the slam you see is the slam you hear (within one frame).
 * Run it again after any timing change in ep18_alarm_sim.js and tell the lead. */
const fs = require('fs'), path = require('path');
const root = __dirname, dir = path.join(root, 'build', 'ep18');
const sim = require('./ep18_alarm_sim.js').build();
let start = sim.sceneStart;
try { const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8')); const sc = tl.scenes.find(s => s.id === 'alarm'); if (sc) start = sc.start; } catch (e) { console.error('no timeline.json: using the built-in scene start ' + start); }
const ev = sim.events(start);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'door_events.json'), JSON.stringify(ev, null, 1) + '\n');
const slams = ev.filter(e => e.name === 'doorslam');
console.log('door_events.json: ' + ev.length + ' events (' + slams.length + ' slams, ' + ev.filter(e => e.name === 'doorbonk').length + ' bonk, ' + ev.filter(e => e.name === 'doorlatch').length + ' latches, ' + ev.filter(e => e.name === 'hornstate').length + ' hornstate); first t=' + ev[0].t + ', last t=' + ev[ev.length - 1].t + ' (scene start ' + start + ')');
for (const e of ev) console.log('  ' + e.t.toFixed(3) + '  ' + e.name.padEnd(10) + (e.door != null ? ' door ' + e.door + ' depth ' + e.depth + ' pan ' + e.pan + ' gain ' + e.gain : ' closed ' + e.closed));
