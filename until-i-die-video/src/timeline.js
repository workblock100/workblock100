'use strict';
// Cue sheet. Scene timing is driven entirely by SECTION_STARTS: edit these numbers
// (seconds from the first sample of the audio file) and every shot re-times itself.
//
// Timed to the common 2:25 leak ("Party In My Mind (Until I Die)", JW3, prod. Rex Kudo & T-Minus).
// Section order: intro, chorus, verse 1, chorus, verse 2, chorus.
// The starts below are estimates from the song's structure (16-bar sections), not from the
// waveform. If a cut lands early or late, measure the real start of each section and edit here.

const SONG_LEN = 145.1;
const VIDEO_LEN = 148.0;

const SECTION_STARTS = {
  intro: 0.0,
  chorus1: 10.0,
  verse1: 36.4,
  chorus2: 62.8,
  verse2: 89.2,
  chorus3: 115.6,
  outro: 142.0,
};

function buildSections() {
  const ids = Object.keys(SECTION_STARTS);
  return ids.map((id, i) => ({ id, start: SECTION_STARTS[id], end: i + 1 < ids.length ? SECTION_STARTS[ids[i + 1]] : VIDEO_LEN }));
}

// Shot order inside each section. Each section is 8 equal slots (about 3.3 s each).
// Entry: 'scene' (one slot) or ['scene', params, slots]. Slots must add up to 8.
// Performance inserts take the back half of a slot so each story shot still starts on its line.
const CHORUS_SHOTS = [
  's_walk',
  ['s_eye', {}, 0.55], ['s_perform', {}, 0.45],
  's_shards',
  ['s_photos', {}, 0.55], ['s_closeup', {}, 0.45],
  's_window',
  ['s_stage', {}, 0.55], ['s_perform', { close: 1 }, 0.45],
  ['s_headparty', {}, 2],
];
const CHORUS3_SHOTS = [
  's_walk',
  ['s_eye', {}, 0.55], ['s_perform', {}, 0.45],
  's_shards',
  ['s_photos', {}, 0.55], ['s_closeup', {}, 0.45],
  's_window',
  ['s_stage', {}, 0.55], ['s_perform', { close: 1 }, 0.45],
  's_headparty',
  's_ascend',
];
const VERSE1_SHOTS = [
  's_mirror', 's_drive',
  ['s_shockwave', {}, 0.55], ['s_closeup', {}, 0.45],
  's_city', 's_boat', 's_storm',
  ['s_demons', {}, 0.6], ['s_perform', { close: 1 }, 0.4],
  's_light',
];
const VERSE2_SHOTS = [
  's_underwater',
  ['s_rooftop', {}, 0.55], ['s_closeup', {}, 0.45],
  's_highway', 's_crawl', 's_coffin',
  ['s_maze', {}, 0.55], ['s_perform', {}, 0.45],
  's_circle', 's_diamonds',
];

function buildShots() {
  const sec = {};
  for (const s of buildSections()) sec[s.id] = s;
  const shots = [];
  const addSection = (s, list, v, firstTrans) => {
    const d = (s.end - s.start) / 8;
    let at = 0;
    list.forEach((entry, i) => {
      const [scene, params = {}, slots = 1] = Array.isArray(entry) ? entry : [entry];
      shots.push({
        scene, params, v,
        start: s.start + at * d, end: s.start + (at + slots) * d,
        section: s.id,
        tt: i === 0 ? firstTrans : 'cut', tin: i === 0 ? 0.9 : 0,
      });
      at += slots;
    });
    if (Math.abs(at - 8) > 1e-6) throw new Error(`section ${s.id} has ${at} slots, expected 8`);
  };
  shots.push({ scene: 's_intro', params: {}, v: 0, start: sec.intro.start, end: sec.intro.end, section: 'intro', tt: 'fade', tin: 0 });
  addSection(sec.chorus1, CHORUS_SHOTS, 0, 'flash');
  addSection(sec.verse1, VERSE1_SHOTS, 0, 'glitch');
  addSection(sec.chorus2, CHORUS_SHOTS, 1, 'flash');
  addSection(sec.verse2, VERSE2_SHOTS, 1, 'glitch');
  addSection(sec.chorus3, CHORUS3_SHOTS, 2, 'flash');
  shots.push({ scene: 'endCard', params: {}, v: 2, start: sec.outro.start, end: sec.outro.end, section: 'outro', tt: 'fade', tin: 1.2 });
  return shots;
}

let SHOTS = buildShots();
function retime(starts) {
  Object.assign(SECTION_STARTS, starts);
  SHOTS = buildShots();
}
