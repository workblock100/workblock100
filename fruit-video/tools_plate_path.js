#!/usr/bin/env node
'use strict';
/* tools_plate_path.js (Episode 19, owner PLATE): writes build/ep19/plate_path.json for the sound builder from the camera of the one-take shot (ep19_plate_sim.js, DOM-free: the picture reads the SAME functions).
 *
 *   node tools_plate_path.js            writes build/ep19/plate_path.json (reads build/ep19/timeline.json for the scene start and checks the sim's frozen beats against it)
 *   node tools_plate_path.js --check    also prints the framing report (screen x of every cast member every 0.5 s) and the room changes
 *
 * The file is an array sampled at 10 Hz over the scene, ABSOLUTE seconds (scene start + scene-local time):
 *   { t, x: the camera's world x, room: 'kitchen' | 'corridor' | 'station' | 'hall' | 'medroom', speakerX: the world x of whoever is speaking (null in the pauses),
 *     zoom: the camera zoom, who: the speaker's voice id (null in the pauses), pan: the speaker's TRUE on-screen position -1..1 (left..right of the frame; (speakerX - x) * zoom / 540, clipped) }
 * x and speakerX are in world units (a person is about 400 tall); the picture shows the world at `zoom` pixels per unit, so a pan of (speakerX - x) / 540 understates how far off centre the speaker
 * is by a factor `zoom` (1.2 to 2.3): use `pan` when you want what the viewer sees. Rooms follow the set: kitchen x < 900, corridor 900..1900, station 1900..2880, hall 2880..4020, medroom beyond (corridor C and the med cart).
 * Run it again after any change to ep19_plate_sim.js and tell the lead. */
const fs = require('fs'), path = require('path');
const root = __dirname, dir = path.join(root, 'build', 'ep19');
const api = require('./ep19_plate_sim.js'), S = api.build();
let start = S.START;
try {
  const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8')), sc = tl.scenes.find(s => s.id === 'plate');
  if (sc) {
    if (Math.abs(sc.start - S.START) > 1e-6) console.error('WARNING: the sim assumes scene start ' + S.START + ' but timeline.json says ' + sc.start);
    start = sc.start;
    for (const id in S.B) { const b = sc.beats[id]; if (!b || Math.abs(b.s - S.B[id][0]) > 6e-4 || Math.abs(b.e - S.B[id][1]) > 6e-4) console.error('WARNING: beat ' + id + ' differs from timeline.json (' + JSON.stringify(b) + ' vs ' + JSON.stringify(S.B[id]) + ')'); }
  }
} catch (e) { console.error('no timeline.json: using the built-in scene start ' + S.START); }
const rows = S.pathRows().map(r => Object.assign({}, r, { t: +(start + (r.t - S.START)).toFixed(3) }));
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'plate_path.json'), JSON.stringify(rows) + '\n');
const rooms = [], seen = {};
for (const r of rows) { if (!rooms.length || rooms[rooms.length - 1].room !== r.room) rooms.push({ room: r.room, from: +(r.t - start).toFixed(2) }); seen[r.room] = (seen[r.room] || 0) + 1; }
console.log('plate_path.json: ' + rows.length + ' samples at 10 Hz, t ' + rows[0].t + ' .. ' + rows[rows.length - 1].t + ' (scene start ' + start + '), x ' + Math.round(Math.min(...rows.map(r => r.x))) + ' .. ' + Math.round(Math.max(...rows.map(r => r.x))) + ', speaker on ' + rows.filter(r => r.speakerX != null).length + ' samples');
console.log('rooms (scene-local): ' + rooms.map((r, i) => r.room + ' from ' + r.from + 's' + (rooms[i + 1] ? ' to ' + rooms[i + 1].from + 's' : ' to the end')).join(' | '));
if (process.argv.includes('--check')) {
  for (let lt = 0; lt <= S.DUR; lt += .5) {
    const c = S.camAt(lt), row = [];
    for (const k of Object.keys(S.T)) { const x = S.T[k].x(lt), sx = S.screenX(x, c); row.push(k + ' ' + (sx > -150 && sx < 1230 ? '*' : ' ') + Math.round(sx)); }
    console.log(lt.toFixed(1).padStart(5), 'cam', Math.round(c.x), 'z', c.z.toFixed(2), 'y', Math.round(c.y), c.room.padEnd(8), row.join('  '));
  }
}
