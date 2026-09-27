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

// Visual order inside each section. Each entry fills one of 8 equal slots unless it spans more.
const CHORUS_SHOTS = ['voidWalk', 'blindEye', 'shards', 'memories', 'stormWindow', 'stage', 'headParty', 'headParty'];
const CHORUS3_SHOTS = ['voidWalk', 'blindEye', 'shards', 'memories', 'stormWindow', 'stage', 'headParty', 'ascend'];
const VERSE1_SHOTS = ['mirrorSelf', 'hellDrive', 'shockwave', 'returnWorld', ['ocean', { storm: 0 }], ['ocean', { storm: 1 }], ['demons', { mode: 'banish' }], 'truth'];
const VERSE2_SHOTS = ['underwater', 'nightRoof', ['road', { mode: 'walk' }], ['road', { mode: 'crawl' }], 'coffin', 'maze', ['demons', { mode: 'circle' }], 'diamonds'];

function buildShots() {
  const sec = {};
  for (const s of buildSections()) sec[s.id] = s;
  const shots = [];
  const addSection = (s, list, v, firstTrans) => {
    const d = (s.end - s.start) / list.length;
    let i = 0;
    while (i < list.length) {
      const entry = list[i];
      const [scene, params] = Array.isArray(entry) ? entry : [entry, {}];
      let j = i + 1;
      // Merge consecutive identical entries into one longer shot.
      while (j < list.length && !Array.isArray(list[j]) && list[j] === scene && !Array.isArray(entry)) j++;
      shots.push({
        scene, params, v,
        start: s.start + i * d, end: s.start + j * d,
        section: s.id,
        tt: i === 0 ? firstTrans : 'cut', tin: i === 0 ? 0.9 : 0,
      });
      i = j;
    }
  };
  shots.push({ scene: 'titleRain', params: {}, v: 0, start: sec.intro.start, end: sec.intro.end, section: 'intro', tt: 'fade', tin: 0 });
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
