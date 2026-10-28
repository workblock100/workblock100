/* hand-written timeline for the UI test episode (ep99.js): no spoken lines, so no captions; the scenes are laid out back to back.
 * labels and bad keep the clock pill and the caption scrim (so the caption-zone rules are exercised); the others switch both off. */
window.TIMELINE_EP99 = {
  fps: 30, duration: 19.2,
  scenes: [
    { id: 'labels', start: 0.0, dur: 3.0, clock: '3:00 PM', label: 'UI KIT TEST', beats: {} },
    { id: 'text', start: 3.0, dur: 3.0, clock: '', label: '', beats: {} },
    { id: 'paper', start: 6.0, dur: 3.0, clock: '', label: '', beats: {} },
    { id: 'zoom', start: 9.0, dur: 4.2, clock: '', label: '', beats: {} },
    { id: 'stack', start: 13.2, dur: 3.0, clock: '', label: '', beats: {} },
    { id: 'bad', start: 16.2, dur: 3.0, clock: '3:30 PM', label: 'DELIBERATE VIOLATIONS', beats: {} },
  ],
  lines: [],
};
