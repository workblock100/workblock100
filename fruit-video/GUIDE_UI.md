# GUIDE_UI: placing text with the UI kit (`ui.js`)

Read this before you draw any sign, label, sheet, name, price, title or table. It is the other half of the text gate (`txaudit.js`): the gate *finds* misplaced text, the kit makes good placement the default.

**The one rule: never position a string by guess.** Hand-placed `text(str, x, y)` with `base: 'middle'` is how we shipped upside-down sheets, names printed over each other, labels off-centre in their pills, text off the ruled lines of a page, and letter-spaced titles a few pixels left of centre. `UI.*` measures every string (its real ink box, the font's cap height, letter spacing) and places it by construction. Text that does not fit is **shrunk, never squished**, and still-too-long text is reported.

The kit draws on the current `ctx`, in whatever transform you have set (camera zoom and roll, a rotated prop, `V2.dof`): nothing to configure. It works in `draw()` and in `over()`, in any episode (the gate registration only happens while the gate records). Examples that audit clean live in `ep99.js`; copy from there.

```js
UI.label('NURSES STATION', 540, 300, { size: 56, fill: '#fff', stroke: '#15111a', lw: 8 });   // ink-centred on x, CAP BAND centred on y
UI.pill('Bob Applegate', 540, 420, { size: 40, fill: '#ffe135', maxW: 600 });                 // pill sized to the text, symmetric padding, shrinks to maxW
UI.sign([320, 800, 440, 220], [{ t: 'ROOM 12', size: 64 }, { t: 'Mr. Bartholomew', size: 36, weight: 700 }], { fill: '#1f3b73', stroke: '#fff', lw: 5, pad: 24, id: 'door12' });
```

## Hero text and where it may go

Every string the kit draws is **hero** unless you pass `hero: false`: the viewer has to read it, so the gate holds it to **30 px on screen**, **40 px from every frame edge**, outside the **caption zone** (y 1380 to 1700, unless the scene has `noScrim`) and the **clock pill** (x 48-500, y 116-244, unless `noChyron`), and it must not be covered by anything drawn later. Set dressing (a tiny label on a far wall) is `hero: false`: the same rules then only produce NOTE lines. Mirrored, upside-down, tilted, cut-off, overlapping and container-breaking text is an error for everything.

Options understood by every function: `size, font ('Nunito' weight 900 | 'Bangers' | 'Lucky', 400), weight, italic, fill, stroke, lw (outline), spacing (letter spacing px), alpha, shadow (blur px), hero, id, tilt, crop, grp, zone, transit`.
`crop: true` = the text may be cut or covered on purpose (a poster running off the edge). `grp: 'x'` = strings of the same group may overlap (deliberate copies). `tilt: radians` = the allowed rotation on screen **including camera roll**; it replaces the default 12 degrees, it does not add to it. `rot` turns labels, panels, signs, pills, pages, stamps and tags about their own centre; the text inside turns with them. `UI.write`, `lines`, `para` and `stack` take no `rot`: rotate the `ctx` about the pivot you want and draw inside it.

**Containers mix two kinds of options.** `fill, stroke, lw, shadow, alpha, r, pad, id, kind` belong to the panel (so `stroke`/`lw` are its border). The text inside takes `size, font, weight, italic, spacing`, `ink` (its colour), `tstroke`/`tlw` (its outline), `talpha`, or a whole `text: {...}` object; a line given as `{t, fill, stroke, lw, ...}` uses the plain text names.

## Functions

**Single strings**
- `UI.label(str, cx, cy, o)` -> `{x0,y0,x1,y1,size,base,cx,cy,w,h,k}`. One line, centred on its **ink** at `cx` (not its advance box, so letter-spaced titles are truly centred) and on its **cap band** at `cy`. `o.align: 'left' | 'right'` anchors the ink edge at `cx`. `o.maxW` shrinks to fit (`o.min`, default 0.6 x size). `o.reveal` 0..1 types it in without moving it. `cid: 'id'` names the container the label belongs to (the gate then checks it stays inside); add `center: true` to have the gate verify the label is centred in it. Signs, pills, rings, stamps and tags do both by themselves.
- `UI.write(str, x, baseline, o)`: the same with the baseline given exactly (`o.align` anchors the ink at `x`). Use it when you own the baseline grid.
- `UI.fit(str, maxW, o)` -> `{size, spacing, lw, k, w, overflow}`: the largest size <= `o.size` whose ink width (outline included) fits. `k` is the scale applied to size, spacing and outline. On overflow at the minimum it reports "text does not fit".
- `UI.sizeOf(str, o)` -> `{w, h, cap, asc, desc, adv, inkH}` for layout maths; `UI.metrics(font, weight, italic)` -> `{cap, x, asc, desc}` as fractions of the size (Nunito 900: cap .714, x .501, tallest letter .743, descender .191; Bangers cap .740; Lucky cap .702; read from the pixels, so they are the real letter heights).
- `UI.strike(str, cx, cy, o)`: a label with a multiply-blended strike line (`o.k` 0..1 draws it on, `o.line` colour). The gate ignores the line, so a deliberate strike is not "covered text".

**Blocks**
- `UI.lines(arr, x, y, o)`: lines on a baseline grid. `arr` = strings or `{t, size, fill, ..., gap}`; `o.lh` = line height (a multiplier below 5, else px; default 1.2), `o.pitch` px, `o.align`, `o.v`: `'base'` (y is the first baseline, default), `'top'` (y is the top of the tallest letters), `'mid'` (cap top of the first line to baseline of the last centred on y). `o.maxW` shrinks the whole block by one factor.
- `UI.wrap(str, maxW, o)` -> lines (greedy by words, `\n` honoured; a word wider than `maxW` shrinks the size: `lines.size`). `UI.para(str, [x,y,w,h], o)` -> `{size, lines, boxes, overflow}`: wrapped, then shrunk (down to `o.min`, default half) until it fits the box height; `o.valign 'top'|'middle'|'bottom'`, `o.align`.
- `UI.stack(items, o)`: title and end cards. Items: `{t | lines, size, font, weight, fill, stroke, lw, spacing, lh, gap}`, `{pill: 'EPISODE 12', size, bg, ink, ...}` or `{h, draw(cx, y0, y1)}`; `gap` = space after, measured from the block's last baseline to the next block's cap top. `o.cx` and `o.top` (cap top of the first line) or `o.cy` (the whole stack centred on its ink height), `o.maxW` per line.

**Containers** (they register themselves with the gate; text inside them names them with `cid`)
- `UI.panel([x,y,w,h], o)` -> `{id, inner:[x,y,w,h], ...}`: `r, fill (colour | [top, bottom]), stroke, lw, shadow, alpha, rot, pad (default 0.08 x min(w,h)), id, kind`. `fill: false` for none.
- `UI.sign(box, content, o)`: a panel and its text block, centred both ways. `content` = string, or array of strings / `{t, size, fill, weight, font, spacing, gap}`. The block is shrunk as one (so the hierarchy survives) to the inner width and height. Text style defaults: `o.size, o.font, o.weight, o.italic, o.spacing, o.ink` (text colour), `o.text = {...}`. `o.minK` (default 0.5): below it, it reports "text does not fit".
- `UI.pill(str, cx, cy, o)` / `UI.button`: sized to the text. `o.anchor 'left'|'right'` puts `cx` at an edge, `o.padX, o.h, o.minW, o.maxW`, `fill` is the pill, `ink` the text, `stroke/lw` the border.
- `UI.page([x,y,w,h], o)` -> `{rules, base(i), inner, n, apply(), restore()}`: paper, `pitch`, `top` (offset of the first rule from the page top), `fold`, `marginLine`, `rot`. `UI.onRule(str, x, i, page, o)` puts left-aligned text **on** rule `i` (baseline = rule - 0.24 x pitch, so descenders clear the line), default handwriting style. Anything else you draw on a rotated page goes between `page.apply()` and `page.restore()`.
- `UI.table([x,y,w,h], cols, rows, o)`: `cols = [{w (px, or a fraction of the width), align, size, font, weight, fill, italic}]`, `rows = [[cell,...]]` (a cell is a string or `{t, fill, size, align, ..., draw(x0,y0,x1,y1)}`), `o.header`, `o.size, o.rowH, o.padX, o.zebra, o.grid, o.vgrid, o.headFill, o.headText, o.hero`. Fixed row pitch; **one baseline per row**; each cell is shrunk to its column, then cut with an ellipsis and **reported**. Returns `cell(r, c)` -> `{x0,y0,x1,y1,cx,cy,base,size,shrunk,ellipsis}` (header is row -1), `rowTop(r)`, `rowBase(r)`.
- `UI.stamp(str, cx, cy, o)` (tilted ink stamp, `rot` clamped to +-0.2 unless `tilt`), `UI.tag(lines, cx, cy, o)` (name tag with a punched hole), `UI.ring(cx, cy, r, k, o)` (progress ring, `o.text` centred in it).
- `UI.container(id, kind, rect, pad)`: register a board you drew by hand, right after drawing it, then `UI.label(..., { cid: id, center: true })`.

**Layout helpers**: `UI.rowX(n, x0, x1, {w, centers, snap})` (n boxes of width `w`, equal gaps; reports a row that does not fit), `UI.gridX(cols, rows, box, {gap})` -> `[x,y,w,h]` cells, `UI.snap(v, grid = 8)`.

## Recipes

*A sign-in sheet.* A table with a **separate signature column**; handwriting and stamps never go on top of a printed cell.
```js
const sheet = UI.table([60, 300, 960, 7 * 64], [{ w: 90, align: 'center' }, { w: 390 }, { w: 200, align: 'center' }, { fill: '#23408e', italic: true, weight: 800 }],
  rows, { header: ['#', 'Name', 'Time in', 'Signature'], size: 34, id: 'sheet' });
const c = sheet.cell(2, 3);   // a pen scribble instead of text: draw a path inside c.x0..c.x1
```
*Handwriting on a ruled page.* `const pg = UI.page([50, 70, 500, 650], { pitch: 70, top: 105, rot: -.035 }); list.forEach((s, i) => UI.onRule(s, pg.inner[0] + 14, i, pg));`
*A title card.* `UI.stack([{ t: 'SHIFT HAPPENS', font: 'Bangers', size: 150, spacing: 10, fill: YEL, stroke: INK, lw: 16, gap: 44 }, { pill: 'EPISODE 13', font: 'Bangers', size: 46, bg: RED, ink: '#fff', gap: 56 }, { t: 'Subtitle', size: 84, font: 'Lucky', fill: '#fff' }], { cx: 540, cy: 960, maxW: 960 })`.
*Text that pops in or types in.* Scale about the label's centre (`ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy)`) and draw `UI.label(str, cx, cy, ...)` inside it; type with `reveal: seg(lt, a, b)` (the whole string keeps its place, nothing shifts as it grows).
*Zoom.* Nothing to do: draw the sign inside the camera transform. The kit registers the transform in force (camera zoom, roll and your own rotation) and the gate checks the sign in its own frame (`zoom` scene of ep99, zoom 1 to 2, roll 0 to 6 degrees).
*A prop you draw yourself with text on it.* Draw the board, `UI.container('board', 'board', [x0, y0, x1, y1], 12)`, then `UI.label(s, cx, cy, { cid: 'board', center: true, maxW: w - 24 })`.
*Cached wall art.* The gate cannot audit text drawn into an offscreen sprite. Blit the cached board, call `UI.container` for its rectangle (nothing is drawn), and draw the text live with `UI.label(..., { cid })` over it.

## What the gate says, and what to do

| message | cause | fix |
|---|---|---|
| `is upside down (vertical flip)` / `(rotated N degrees)` | `scale(1, -1)`, or turned past 90 degrees | remove the flip; sheets read upright |
| `is mirrored` | `scale(-1, 1)` around the text (a flipped character or prop) | draw the text outside the mirrored transform |
| `is tilted too far (N degrees)` | more than 12 degrees on screen, camera roll included | turn less, or declare `tilt: radians` |
| `is skewed` | a shear transform | remove it |
| `is cut off by the frame edge` / `inside the safe margin` | text within 0 / 40 px of an edge | move it; `crop: true` only if the cut is the joke; `hero: false` for dressing |
| `sits under the caption zone` / `the clock pill` | y 1380-1700, or the top-left pill | move it, or the scene sets `noScrim` / `noChyron` |
| `hero text ... is too small to read (N px)` | under 30 px on screen: a long string shrinking in a small box, or a far-away sign | bigger box, shorter string, or `hero: false` |
| `overlaps text` | two different strings overlap | separate them; deliberate copies share a `grp` |
| `runs outside its sign "id#n"` | text larger than its container's inner box | let `UI.sign` / `UI.pill` fit it, or pass `maxW` |
| `is off centre in its pill "id#n" [dx,dy]` | the label was placed by hand | `UI.label(str, cx, cy, { cid, center: true })` with the container's centre |
| `names the container "id" but none was registered this frame` | the label is drawn before its container, or the id is misspelt | draw the container first; same id |
| `hero text ... is partly covered / hidden (N% of the ink shows)` | something drawn later covers it (a character, a prop) | draw the text last; `crop: true` if deliberate |
| `text does not fit: "..." [w > maxW px]` | the shrink floor was reached | a bigger container or a shorter string |
| `table cell cut with an ellipsis` / `paragraph does not fit its box` / `line N is off the page` / `row of N boxes does not fit` | the matching helper ran out of room | widen the column / box / use fewer lines / narrower boxes |
| `N text draw(s) on an offscreen canvas` | text drawn into a cached sprite | draw text live; `canvas.__txOK = true` for a flat silhouette |

The `#n` in container ids is the kit's per-label alias (see the note at the top of `ui.js`); it is harmless.

## Traps

- Do not pass `maxW` to `text()` for fitting: it squishes. Use `UI.fit` / `maxW` on a kit function.
- Do not centre a letter-spaced string with `text(..., { align: 'center', spacing })`: the last glyph carries a gap, so it sits half a gap left. `UI.label` centres the ink.
- Do not centre text vertically with `base: 'middle'`: that centres the em box, not the letters. The kit centres the cap band (and shares one baseline per row and per block).
- Fonts: only `Nunito`, `Bangers`, `Lucky` are loaded; weight 400 for the last two. Italic is synthetic.
- Build the container first, the text after it; keep other drawing (characters, props) from covering a hero string. An `id` may be reused in one frame (two signs both called `'door'`).
- Table and paragraph text is hero too: fine print needs `hero: false` (or a size of 30 px and up).
- The gate runs in the usual audit (`audit_scene.sh`, `node render.js audit`) for episodes that set `textGate: true` (ep99 and Episode 13 on); `TEXTGATE=1` holds an older episode to it.
- Run `bash tools_gate_selftest.sh` after changing `ui.js` or `txaudit.js`: it re-proves the gate and the kit (about 12 s; the log of a failure is kept).
