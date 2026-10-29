# GUIDE_SHEET: GridSheet, the spreadsheet UI kit of Episode 15 (`ep15_sheet.js`, `window.SH15`)

Owner: E15-SHEET. Everything below is implemented and gate-tested in `sheet_demo.html` (open `sheet_demo.html?t=<seconds>`; the demo is a small episode 98 of 17 scenes that exercises every call; `window.audit(from, to, step)` runs the text gate over it). GridSheet is an invented app: never add a real product's name, logo, icon or clip art. The assistant is **Binder**, never anything else.

## The kit in one screen

Everything draws on the current `ctx` in a **local frame whose origin is the sheet window's top-left**; you translate and scale. Every call is a pure function of its arguments (`t` seconds, `u` progress 0..1). All text goes through the UI kit (`UI.label` / `UI.write` / `UI.lines`); text is drawn live every frame.

```js
// a full-screen insert (the window IS the frame): 1080 x 1920 sheet units at scale 1
SH15.sheet({ cells: { A1: { v: 'Name', bold: true }, B1: 'Role', D2: 31 }, sel: 'A1:B1', ribbon: { tab: 'Home', hot: 'merge', press: .6 } }, t);
// the same sheet on the rolling TV: a 1280 x 720 window at scale .5, all of it set dressing
ctx.save(); ctx.translate(tvX, tvY); ctx.scale(.5, .5); SH15.sheet({ w: 1280, h: 720, ui: .8, dressing: true, ... }, t); ctx.restore();
// aim at things: all rects are in the window's local frame (apply your own translate/scale to get screen coordinates)
const r = SH15.cellRect('B3', opts);  const b = SH15.buttonRect('merge', opts);  const d = SH15.dialogRect({ kind: 'warn', w: 1080, h: 1920 }, 'ok');   // each has .aim = a point that misses the label
// the signature merge, a dialog, the pointer
SH15.merge({ sheet: opts, range: 'A1:C1', after: lt - tDone }, u, t);   SH15.dialog({ kind: 'warn', w: 1080, h: 1920 }, uPop);   SH15.pointer(x, y, { kind: 'arrow', press: 0..1, s: 1.2 });
```

| call | what |
|---|---|
| `SH15.sheet(o, t)` | the whole window: title bar, ribbon (5 tabs, original icons), formula bar, column letters, row numbers, grid, cells, merged cells, frozen rows/columns, scroll, zoom, selection with fill handle, in-cell edit, sheet tabs, status bar. Returns the layout `L`. |
| `SH15.merge(o, u, t)` or `sheet({ merge })` | THE merge animation, exact on the last frame |
| `SH15.dialog(o, u)` | modal over the dimmed sheet: `warn` `info` `error` `cantUndo` `findReplace` `saveAs` `removeDuplicates` |
| `SH15.pointer(x, y, o)`, `SH15.cursorPath(pts, t)` | the friendly mouse pointer (`arrow` `hand` `cross` `text`), press ring, drag trail; a waypoint path with overshoot and clicks |
| `SH15.flipText(from, to, u, o)` | letter by letter odometer flip (BREAK to PENDING) for cells and world signs |
| `SH15.insertRow(o, u, t)` `removeDuplicates(o, u, t)` `fillDrag(o, u, t)` | the three operations (each DRAWS THE SHEET itself: do not also call `sheet()`) |
| `SH15.errorCell(ref, text, u, o)` | `#N/A` cell with corner marker, shake and tooltip (an overlay: call it after `sheet()`) |
| `SH15.call(o, t)` | the laggy video call window (lag, freeze, screen share, chat, hand, muted banner) |
| `SH15.binder(o, t)` | Binder's chat bubble: tail, typewriter, Yes / No (the No runs away) |
| `SH15.keys(keys, cx, cy, o)`, `SH15.typed(n, len)` | key caps (Ctrl + Z); the `typed` value for exactly n letters |
| `SH15.cellRect(ref, o)` `colX(col, o)` `rowY(row, o)` `buttonRect(id, o)` `dialogRect(o, what)` `binderRect(o, id)` `layout(o)` | layout queries |

## Scale, hero text and the text gate (read this first)

- Sizes are **sheet units**. At scale 1 the default cell text is 26 px, dialog body text 34 px, button labels 32 px, field text 34 px. It is vector: right from scale 0.35 (a TV) to 3 (a close-up of one cell).
- **Hero** text (held to 30 px on screen, 40 px from the frame edge, outside the caption zone and the clock pill, uncovered) is only: dialog message, button labels and fields (when the pop-in `u == 1`), the merged title at `u == 1`, the Binder text and buttons (`pop == 1`), key caps, the tooltip of fillDrag (`hero: true`), and any cell you flag `hero: true` (size >= 30 at your scale). Everything else (ribbon, title bar, tabs, headers, status, ordinary cells, the call window) is `hero: false`: the gate only NOTES it.
- `dressing: true` (on `sheet`, `dialog`, `call`, `binder`, `flipText`, `keys`) marks ALL its text `hero: false, crop: true`: use it whenever the sheet is small (the TV), partly off screen (a pan, a close-up that cuts neighbours) or **under a modal dialog** (the dialog's panel hides the sheet's text; without `dressing` the gate reports the covered text). An explicit `hero: true` (a cell, `final.hero`, the call's `hero: ['freeze']`) still counts as hero inside a dressing call: a close-up on one cell is `dressing: true` plus `hero: true` on that cell, set only while the camera scale makes it >= 30 px.
- Without dressing, text is still checked for edge cuts, overlaps, tilt and mirroring. The kit never lets two cell strings overlap: cells shrink the text, then cut it with an ellipsis; text of a partly visible row is cropped or skipped; wrapped cells lose words rather than spill.
- Do not draw the pointer over hero text: aim at `buttonRect(id, o).aim` / `dialogRect(o, 'ok').aim` (a point on the button that misses its label). The pointer over ordinary cells only makes NOTE lines.
- A fast pointer or a camera whip may carry text through the frame edge: only for `transit` / dressing.
- Grid text under the caption zone (y 1380 to 1700) is a NOTE (non-hero): end the window above y 1380 (`h: 1340`) or switch the scrim off.
- Cost (measured in the demo with a pixel read-back after each call, software rendering, shared machine): the full window with 200 filled cells about 6 ms (5 ms as dressing); a dialog about 7 ms (its big shadow); the merge scene about 7 ms; fillDrag about 5 ms; the call with a screen share and chat about 2.5 ms; Binder's bubble about 2.5 ms; a whole engine frame of the 30-row demo sheet 8 ms, never over 25 ms in any demo scene. The limit of the brief is 40 ms.

## `SH15.sheet(o, t)`

```
w, h        window size, default 1080 x 1920          ui   chrome scale, default 1 (use .7 to .8 for a 1280 x 720 TV window)
doc         title bar document name (default 'SYNERGY_MODEL_v47_FINAL_REAL')       saved  false = 'Unsaved changes', or any string
show        { title, ribbon, formula, headers, sheetTabs, status }  all true; hide what a TV does not need (headers:false hides letters and numbers)
ribbon      { tab: 'Home'|'Insert'|'Data'|'Review'|'View', hot: 'merge', hotK: 0..1, press: 0..1, collapsed: true } | false
            button ids: undo redo save merge insert insertCol delete fill sort find dupes filter chart table comment validate lookup spell lock track freeze grid zoom
            Home: undo redo save | merge | insert fill | sort find     Insert: insert insertCol delete | chart table comment     Data: dupes sort filter fill | validate lookup
formula     string | { text, typed: 0..1, caret } (default: the active cell's `f` or value)         nameBox  text of the name box (default: the active ref)
active      'A1'      sel  'A1:C1' | ['A1:A3', 'C2']  blue outline, light fill, fill handle (selFill:false, handle:false, selK 0..1, selColor, selWidth, ants:true = marching ants)
cells       { A1: 'text' | 12 | { v, f, align, bold, italic, size, color, fill, font, weight, spacing, stroke, lw, fmt, border, dy, pad, wrap, hero,
                                 typed: 0..1, strike: 0..1, strikeColor, pulse: 0..1, pulseColor, alpha, flip: { from, u } } }
            fmt: 'usd' 'usd0' 'num' 'int' 'dec1' 'dec2' 'pct' 'pct1' or a function. Numbers align right; #N/A #REF! #VALUE! #NAME? #DIV/0! are red, bold and centred. Fills must be #hex.
            border: true | '#hex' | { t, r, b, l }.  wrap: true breaks long text over lines inside the cell (set the row taller).  flip: the text changes letter by letter from `from` to `v` at progress u.
            pulse: a wash that fades (0 = full, 1 = gone) after a change.  typed: types the text in.  strike: a red line draws through the text.
cols        { A: 280, C: 200 } | [280, ..]  widths (colW 160)      rows  { 1: 64 } (1-based) | [..]  heights (rowH 52)      zoom  1 (scales the grid and its text, not the chrome)
merges      ['A1:C1']  static merged regions (centred)             merge  { range, u, ... }  the animated merge, see below
fills       [{ range: 'A5:D5', color: '#ffbf1f', a: .4 }]  washes under the text        edit  { ref, text, typed: 0..1 }  a cell being typed in (white, blue frame, caret)
freeze      1 | { rows: 1, cols: 0 }       scroll  [x, y] grid pixels      renumber  true: row numbers count only rows still there     grid  false hides the grid lines
tabs        ['Sheet1', { name: 'Sheet16', u: 0..1, color }]  (an object tab grows in with u: the Episode 16 teaser)         tab  'Staff'
status      'Ready'   stats ['Sum: 31', 'Count: 4']          r  window corner radius, shadow  drop shadow (a laptop window)         dressing  see above
```

Layout queries take the same options object: `SH15.cellRect('B3' | 'A1:C1', o)` gives `{ x, y, w, h, x1, y1, cx, cy }` (window-local, scroll and zoom included); `SH15.colX('C', o)`, `SH15.rowY(12, o)`; `SH15.buttonRect('merge', o)` gives the ribbon tile `{ x, y, w, h, cx, cy, ix, iy, aim: [x, y] }` (it finds the tab the button lives on); `SH15.layout(o)` is the whole layout (`gx0 gy0 gx1 gy1` grid rect, `rowStart(r)`, `rect(c0, r0, c1, r1)` with 0-based indexes). `SH15.sheet` returns the same `L`.

## The merge: `SH15.merge(o, u, t)` or `sheet({ ..., merge: { range, u, ... } })`

The values stay in `cells` (`A1: SHIFT HAPPENS`, `B1: EPISODE 15`, `C1: THE MERGER`); the top-left value survives (`survivor: 1` picks another cell, in reading order; `texts: [...]` overrides the values). `u` 0..1: the outline pulses (0 to .14); the borders between the cells retract and dissolve (.08 to .44); the other values tremble, then every letter drops and spins away (.14 to .4; rotation stays under 80 degrees so the gate stays happy); the survivor glides to the centre (.30 to .6) and its face changes (Nunito to Bangers) while it is still small, then it grows to the final size with a little overshoot (.44 to .84); the cell fills blend into the final background; the outline tightens and springs back (.05 to .85); a flash builds on the last frames. **At `u == 1` the merged cell is exact**: the text is ink-centred on the region's centre (measured on the rendered frame with a sub-pixel coverage measurement: the ink box of SHIFT HAPPENS is centred within 0.06 px in x and 0.12 px in y of the region's centre) and is hero. Keep passing `merge` with `u: 1` for the rest of the shot: it IS the merged cell.
`final: { text, font ('Bangers'), weight, size (min(row height x .62, 150)), fill ('#ffe135'), bg ('#103a2c'), stroke, lw, spacing (4), fitW (.9), hero }`; `after: seconds since u reached 1` makes the flash fade and sends a ring out (without `after` the last frame carries the peak flash: use that for the chime frame, then pass `after`); `fall` gravity, `t0` when the falls start, `sel: false` hides the outline, `selK` fades it; the region cells may carry `fill` (hex) and sizes. Two big cells on a TV: `SH15.merge({ sheet: { w: 1280, h: 720, ui: .8, dressing: true, show: { formula: false }, cols: { A: 600, B: 600 }, rows: { 1: 330 }, cells }, range: 'A1:B1', final: { hero: true } }, u, t)`.

## Dialogs: `SH15.dialog(o, u)`

`o: { kind, w, h (the window it sits over), at: [cx, cy] (default upper middle), s (dialog scale), title, text, buttons: [{ id, t, def }], press: { id, k } | k + pressed: id, btnFocus: id, focus: 'find' | 'replace', t (seconds: the caret blinks), dressing, dim: false, dimA }`. `u` is the pop-in (scale .86 to 1 with a back ease, fade, the sheet dims; text is hero only at `u == 1`); draw the sheet first (with `dressing: true`), then the dialog. A pressed button sinks 2.5 px and darkens; its label never shrinks. Returns the geometry. `SH15.dialogRect(o, 'ok' | 'cancel' | 'panel' | 'find' | 'replace' | 'name' | ...)` gives rects with `.aim` on buttons.
- `warn`: amber triangle, "Merging keeps only the top-left value. Other values will be discarded." [OK] [Cancel]. `info` ("All done."), `error` (red cross), `cantUndo` ("Can't undo." with an undo-slashed icon) take `text` and `title`.
- `findReplace`: `find`, `replace` (a string or `[string, typed 0..1]`), `focus` (the field with the caret), `options: [['Match case', false], ...]`, `status: '214 replacements made'` (green, hero), buttons Find Next, Replace, Replace All (default), Close. `typed: [string, k]` is a shortcut for the focused field.
- `saveAs`: `name: ['FRUIT_SALAD_FINAL_v7_REAL', typed 0..1]` (or `typed`), `folders`, `folder`, `files`, `path`, `type`; buttons Save, Cancel.
- `removeDuplicates`: `columns: [['Name', true], ...]`, buttons OK, Cancel; `stage: 'result', removed: 12, remain: 28` shows "12 duplicate values found and removed. 28 unique values remain." [OK].
- To type exactly n letters pass `SH15.typed(n, len)` (the UI kit rounds a reveal up, so a plain `n / len` can show one letter too many).

## The operations (each draws the sheet itself; their `sheet` option is the options you would pass to `sheet()`)

- `SH15.insertRow({ sheet, at: 2, row: { A: 'Executive Suite', B: ... }, fill: '#cfe0ff', select: false }, u, t)`: `sheet.cells` are the cells BEFORE the insertion; the new row grows from nothing (blue, selected), the rows below slide down one row height, the new cells fade in, numbers renumber. Keep calling it with `u: 1` for the rest of the shot.
- `SH15.removeDuplicates({ sheet, rows: [7, 12, ...], cols: 'A:D' }, u, t)`: amber wash (0 to .3), red strike through the values (.24 to .55), then the rows collapse one after another, top to bottom (.5 to 1), the rows below slide up, the row numbers tick down. Then show the `removeDuplicates` result dialog.
- `SH15.fillDrag({ sheet, from: 'A2:D2', to: 41, values: (rowOffset, col /* 0-based index */, sourceCell) => cell, tip: n => string, hero, keep }, u, t)`: the fill handle is dragged down (the sheet scrolls to follow), a dashed outline stretches, a count tooltip follows, each copy appears with a blue ripple as the handle passes. Returns `{ L, handle: { x, y }, count, scrollY }`: draw `SH15.pointer(handle.x, handle.y, { kind: 'cross', press: 1 })` yourself. At `u == 1` the filled range is selected.
- `SH15.errorCell('F2', '#N/A', u, { sheet, tip, size, hero, tipHero, dressing })`: call it AFTER `sheet()`, leave the cell's own value out of `cells` while it runs (it paints the cell). `u` 0 to .45 shake and pop, .35 to .62 the tooltip ("Value not found in table" for #N/A). Tooltips are dressing unless `tipHero`.

## Letter by letter text: `SH15.flipText(from, to, u, o)`

`o: { cx, cy (the ink centre and cap-band centre, like UI.label), align: 'center' | 'left' | 'right', size, font, weight, italic, fill, stroke, lw, spacing, shadow, alpha, maxW, dur (.45), hero (default true), cid, center, centerY, id, dressing }`. An odometer: the old letter slides out upward, the new one slides in from below inside a clip, one slot after another (letters that only leave go first, right to left; letters that change go left to right; letters that only arrive go last). The common start and end of the two strings stay and glide, so BREAK ROOM becomes PENDING ROOM with ROOM gliding; the widths animate smoothly and the centre stays centred. `u <= 0` draws `from` and `u >= 1` draws `to` with `UI.label` (exact, hero as asked; at `u == 1` it is pixel-identical to `UI.sign` with the same text, size, face, outline and spacing: measured, 0 differing pixels, so a scene may swap the plain sign in afterwards); the frames between are `hero: false, crop: true`.
```js
UI.panel([120, 300, 840, 260], { id: 'door', kind: 'sign', fill: '#1f3b73', stroke: '#fff', lw: 6, r: 28 });          // the world sign
SH15.flipText('BREAK ROOM', 'PENDING ROOM', u, { cx: 540, cy: 430, size: 130, font: 'Bangers', fill: '#fff', stroke: '#06122e', lw: 12, spacing: 6, maxW: 780, cid: 'door', center: true });
// in a cell: cells: { C7: { v: 'PENDING ROOM', flip: { from: 'BREAK ROOM', u } } }
```

## Pointer and cursor path

`SH15.pointer(x, y, { kind: 'arrow' | 'hand' | 'cross' | 'text', press: 0..1, s: 1, trail: [[x, y], ...], ripple: 0..1, color })`: `(x, y)` is the hot spot (arrow tip, fingertip, centre of the cross, centre of the I-beam). The arrow is 44 sheet units tall at `s = 1`; use `s` 2 to 3 on a TV. `SH15.cursorPath([{ t, x, y, kind, click: [t0, t1] | [[t0, t1], ...], hold, over, arc }, ...], t)` returns `{ x, y, press, kind, moving }`: `t` is the ARRIVAL time at each waypoint; the pointer rests there until the click ends (or `hold`), moves on with a slight arc and a natural overshoot and arrives exactly on the next `t`; `kind` sticks until changed. Put a click on the sound cue (`click: [cue - .08, cue + .12]`: the press peaks in the middle). Draw the pointer last.

## The video call: `SH15.call(o, t)`

`o: { w: 1280, h: 720, ui, r (18), shadow, dressing, hero: ['names', 'chat', 'banner', 'freeze', 'title'] | true, title, time (seconds or '00:42'), signal 0..4, main: { name, draw(rect, tt), color, initials, muted, speaking }, others: [{ name, draw, color, initials, muted, hand, speaking }], lag: 0..1, freeze: 0..1, frozenAt: seconds, share: { sheet: <sheet options>, label, dressing }, chat: [{ who, text, t0 }], chatOpen, typing, hand, muted, cam, sharing }`. Tile pictures are drawn by your callbacks in the call's local frame, clipped to the tile (draw `A15.artichoke` with `drawChar` there; `rect` is `{ x, y, w, h }`); `lag` stutters their time (`tt`) and pixelates them (up to 10 pixels per block); `freeze` (0..1) stops the main picture on `frozenAt`, dims it, adds glitch bars, a spinner and a "Connection unstable" pill; `share` fills the stage with the shared sheet (set its `w`, `h`, `ui` for a 16:9 fit) and moves the speaker to a thumbnail in the corner, with the other tiles in the strip; `chatOpen` replaces the strip by the chat panel, messages slide in at `t0`; `hand` lights the raise-hand control, a tile's `hand` shows an amber hand badge; `muted` shows "You are muted". Returns the rects `{ main, strip, share, chat }`. On the TV (scale .3 to .6) use `dressing: true`; for an insert on the frozen tile zoom the camera (scale 1.6) and use `dressing: true, hero: ['freeze']`.

## Binder's bubble: `SH15.binder(o, t)`

`o: { at: [x, y] (top-left), w: 640, s, tail: [x, y] (the point the tail aims at: the mascot's mouth), text, typed: 0..1, thinking, buttons: [{ id: 'yes', t: 'Yes please', def }, { id: 'no', t: 'No thanks' }], runaway: 0..1, runPath: [[dx, dy], ...] (offsets from home), press: { id, k }, pop: 0..1 (the bubble grows out of its tail), name, size (34), hero, dressing }`. White bubble, soft shadow, a clip glyph and "Binder", the text typed out line by line, a green default button and a greyed "No thanks" that hops away in three jumps (`runaway`, each with an arc and a squash; its label is hero only at rest). Returns `{ rect, tail, yes, no (its current rect), btns }`; `SH15.binderRect(o, 'yes')`. The mascot itself is drawn by `A15.binder` through `drawChar` at the tail.

## Key caps: `SH15.keys(['Ctrl', 'Z'], cx, cy, { size: 38, press: 0..1 | [..], hero, dressing })`

Caps side by side with a '+', pressed caps sink and darken. Returns `{ x0, y0, x1, y1, caps }`.

## Recipes for the Episode 15 scenes

- **title (the merge on the full-screen sheet)**: `cells: { A1: 'SHIFT HAPPENS', B1: 'EPISODE 15', C1: 'THE MERGER' }` (size 40, bold, centred, `cols: { A: 336, B: 336, C: 336 }`, `rows: { 1: 230 }`), `sel: 'A1:C1'` growing with the drag, pointer path (`cross` while dragging, `arrow` on `buttonRect('merge').aim`), `ribbon: { hot: 'merge', press }`, then `SH15.merge({ sheet, range: 'A1:C1', after: lt - tDone }, u, t)` with `u` from the merge cue (2.3) to the textding cue (4.0). The warn dialog may sit between the click and the merge.
- **announce (the TV)**: `SH15.call({ dressing: true, share: { sheet: { ... two big cells ... } }, ... })` at scale .4 to .6; Binder's bubble and the warn dialog on the TV as `dressing` too (`SH15.dialog({ kind: 'warn', w: 1280, h: 720, s: .8, dressing: true }, u)` inside a translate/scale of the TV).
- **model1 / model2 (the laptop at the station)**: `sheet({ r: 16, shadow: 30, ... })` scaled .6 to 1, `SH15.insertRow`, `removeDuplicates` (then the result dialog), `fillDrag` (the 40 Strawberries; press the pointer on `handle`), a lookup typed into the formula bar (`formula: { text, typed }`) then `errorCell`.
- **replace**: the `findReplace` dialog typing `BREAK` (`find: ['BREAK', SH15.typed(n, 5)]` per key cue), `PENDING`, Replace All pressed on the cue; `status` counting up to `214 replacements made`; the cells behind (`dressing: true`) or the world signs (`flipText`) flip on the flip cues.
- **close**: `SH15.keys(['Ctrl', 'Z'], ...)` pressed, `SH15.dialog({ kind: 'cantUndo' })`, Binder's last offer.
- **end**: `SH15.dialog({ kind: 'saveAs', name: ['FRUIT_SALAD_FINAL_v7_REAL', typed] })`, Save pressed; then `tabs: ['Sheet1', 'Staff', 'Policies', { name: 'Sheet16', u, color: '#ffbf1f' }]` with `tab: 'Sheet16'` for the Episode 16 teaser.

## Limits and quirks

- Fill colours in cells must be `#hex` (they are mixed). Column widths and row heights are in grid units at zoom 1.
- Rows are single-line unless `wrap: true`. Only one merge animation per sheet call.
- `sheet()` restores the dressing mode it found, so a sheet nested in a call or a TV does not change the text mode of what follows.
- All kit effects assume the window is drawn upright (text tilt over 12 degrees is a gate error; the falling merge letters declare their own tilt and stay under 80 degrees).
- Labels are nudged by at most half a unit so that baselines and ink edges fall on whole pixels at scale 1 (crisp letters); the merged title is never nudged.
- Cell text under a partly covered area (a dialog, a pointer) only produces NOTE lines when the cell is non-hero.
