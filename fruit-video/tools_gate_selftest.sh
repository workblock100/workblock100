#!/bin/bash
# tools_gate_selftest.sh -- regression test for the text gate (txaudit.js) and the UI kit (ui.js), using the test episode ep99.
#
#   bash tools_gate_selftest.sh            run the audit of episode 99 (about 10 s), check it, then run the pixel checks of the kit (about 5 s more)
#   SELFTEST_LOG=file bash tools_gate_selftest.sh    check a saved audit log instead (to see what a failure looks like); the pixel stage is skipped
#   SELFTEST_PIXELS=0 | 1                  force the pixel stage off | on
#
# Three promises are checked:
#   1. nothing is reported outside the `bad` scene: every other scene of ep99 is drawn with the kit and must be clean (notes included), so a kit or gate change that
#      misplaces a label, mis-centres a title or raises a false alarm shows up here;
#   2. the `bad` scene reports every deliberate violation (the nine the brief asks for, then the extras): a gate change that stops seeing one of them shows up here;
#   3. the kit's alignment guarantees hold on the PICTURE, not just in the gate's own geometry (the gate cannot judge looks): the kit draws red text on blue panels, the pixels are read
#      back, and the ink is compared with the container: centred within 1.5 px at zoom 1, 1.5, 2 and camera roll 0, 3, 6 degrees, cap band within 2 px, ink edges on their anchors
#      (letter spacing included), title stacks centred, text on its rules (upright and turned), one baseline per table row, typed-in text that does not move.
# Exit status 0 = all hold, 1 = not (with the reason), 2 = the audit itself did not run.
cd "$(dirname "$0")" || exit 2
LOG=${SELFTEST_LOG:-}
if [ -z "$LOG" ]; then
  LOG=$(mktemp /tmp/gate_selftest.XXXXXX)
  EP=99 node render.js audit 0.1 > "$LOG" 2>&1
fi
[ -s "$LOG" ] || { echo "GATE SELFTEST: the audit printed nothing"; exit 2; }

fail=0
bad() { echo "  FAIL  $1"; fail=$((fail + 1)); }
ok() { echo "  ok    $1"; }

# 0. the audit ran over the whole episode, with no page errors
frames=$(sed -n 's/.* issue-frames, [0-9]* distinct issues, \([0-9]*\) frames checked.*/\1/p' "$LOG" | tail -1)
if [ -z "$frames" ]; then bad "no audit summary line (the audit did not finish)"; sed -n '1,15p' "$LOG"; echo "GATE SELFTEST: FAIL"; exit 2; fi
[ "$frames" -ge 150 ] && ok "the audit checked $frames frames" || bad "the audit checked only $frames frames (the episode should have about 190)"
for s in labels text paper zoom stack bad; do grep -q "id: '$s'" build/ep99/timeline.js || bad "scene '$s' is missing from build/ep99/timeline.js"; done
if grep -E "PAGE ERROR|^console:|Error:" "$LOG" > /dev/null; then
  bad "the page reported errors:"; grep -E "PAGE ERROR|^console:|Error:" "$LOG" | head -5 | sed 's/^/          /'
  # a script the page loads that does not even parse (often a file another builder is writing right now)
  for f in $(grep -o 'src="[^"]*\.js"' index.html | sed 's/src="//;s/"//'); do
    [ -f "$f" ] && ! node -e "new Function(require('fs').readFileSync(process.argv[1], 'utf8'))" "$f" 2> /dev/null && echo "          syntax error in $f (loaded by index.html)"
  done
fi

# 1. nothing outside the bad scene (grouped lines look like "0.00-2.90s  labels    <message>  (x30)")
outside=$(grep -E '^[0-9.]+-[0-9.]+s +[A-Za-z0-9_]+ ' "$LOG" | awk '{ if ($2 != "bad") print }')
if [ -n "$outside" ]; then bad "issues outside the bad scene (every other scene must audit clean):"; echo "$outside" | sed 's/^/          /' | head -25; else ok "no issue outside the bad scene"; fi
other=$(grep -vE '^[0-9.]+-[0-9.]+s +[A-Za-z0-9_]+ |issue-frames|^$|PAGE ERROR|^console:|Error:' "$LOG" | head -5)
if [ -n "$other" ]; then bad "unexpected output from the audit:"; echo "$other" | sed 's/^/          /'; fi

# 2. the bad scene reports each deliberate violation, by object (the nine from the brief, then the extras)
BAD=$(grep -E '^[0-9.]+-[0-9.]+s +bad +' "$LOG")
expect() {   # expect "<label>" "<extended regex on the message>"
  if echo "$BAD" | grep -Eq "$2"; then ok "bad: $1"; else bad "bad: $1 was NOT reported (looked for: $2)"; fi
}
expect "a vertically flipped string is 'upside down'"                 'text "FLIPPED" is upside down'
expect "a mirrored string is 'mirrored'"                             'text "MIRRORED" is mirrored'
expect "a string cut by the frame edge is 'cut off'"                 'text "CUT OFF" is cut off by the frame edge'
expect "two strings printed over each other 'overlaps text'"         'text "(OVERLAP|TEXT)" overlaps text "(TEXT|OVERLAP)"'
expect "a label 12 px off its pill's centre is 'off centre'"         'text "OFF CENTRE" is off centre in its pill'
expect "a string tilted 20 degrees is 'tilted too far'"              'text "TILTED 20" is tilted too far'
expect "a hero string under the captions 'sits under the caption zone'" 'text "UNDER THE CAPTIONS" sits under the caption zone'
expect "a hero string covered by a rectangle is 'partly covered'"    'hero text "COVERED SIGN" is (partly covered|hidden)'
expect "an 18 px hero string is 'too small to read'"                  'hero text "TOO SMALL TO READ" is too small to read'
expect "(extra) text running out of its sign 'runs outside'"          'text "RUNS OUT OF ITS SIGN" runs outside its sign'
expect "(extra) a container nobody registered is named"               'text "NO CONTAINER" names the container "ghost" but none was registered'
expect "(extra) UI.fit that cannot fit says 'text does not fit'"      'text does not fit: "Supercalifragilistic"'
expect "(extra) a table cell cut with an ellipsis is reported"        'table cell cut with an ellipsis'
expect "(extra) hero text inside the safe margin"                     'hero text "MARGIN" is inside the safe margin'
expect "(extra) text under the clock pill"                            'text "UNDER CLOCK" sits under the clock pill'
expect "(extra) sheared text is 'skewed'"                             'text "SKEWED" is skewed'


# 3. the pixel stage
PIXELS=${SELFTEST_PIXELS:-auto}
if [ "$PIXELS" = 1 ] || { [ "$PIXELS" = auto ] && [ -z "$SELFTEST_LOG" ]; }; then
  PX=$(mktemp /tmp/ui_pixels.XXXXXX.js)
  cat > "$PX" <<'JS_END'
// pixel checks of the UI kit's alignment guarantees: draw real kit output on the page canvas, find the ink by colour and compare with the geometry it should have
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const ROOT = path.resolve(process.argv[2] || '.');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json' };
(async () => {
  // a private minimal page (engine, gate, v2, kit, the ep99 timeline and scenes): the pixel checks do not depend on the other episodes' scene files, which other builders may be writing
  const PAGE = '<!doctype html><html><head><meta charset="utf-8"><style>@font-face{font-family:Bangers;src:url(fonts/Bangers-Regular.ttf)}@font-face{font-family:Lucky;src:url(fonts/LuckiestGuy-Regular.ttf)}@font-face{font-family:Nunito;src:url(fonts/Nunito.ttf);font-weight:200 1000}</style></head><body><canvas id="c" width="1080" height="1920"></canvas><audio id="audio"></audio><button id="play"></button>' +
    ['engine.js', 'txaudit.js', 'v2_core.js', 'v2_char.js', 'ui.js', 'build/ep99/timeline.js', 'ep99.js', 'main.js'].map(f => '<script src="' + f + '"></script>').join('') + '</body></html>';
  const srv = http.createServer((req, res) => {
    if (req.url.startsWith('/__selftest.html')) { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(PAGE); }
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const browser = await playwright.chromium.launch({ args: ['--disable-gpu', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/__selftest.html?capture&ep=99`);
  await page.evaluate(() => window.READY);
  const results = await page.evaluate(() => {
    const out = [], cv = document.getElementById('c'), mc = cv.getContext('2d', { willReadFrequently: true });
    ctx = mc;
    const add = (name, ok, detail) => out.push({ name, ok, detail });
    const clear = (c = '#000') => { mc.setTransform(1, 0, 0, 1, 0, 0); mc.globalAlpha = 1; mc.fillStyle = c; mc.fillRect(0, 0, W, H); };
    const isRed = (r, g, b) => r > 128 && g < 120 && b < 150;
    // every red (text) pixel of the picture, in the local frame of matrix M
    const redPts = (M, pred = isRed) => { const d = mc.getImageData(0, 0, W, H).data, inv = M.inverse(), pts = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (pred(d[i], d[i + 1], d[i + 2])) pts.push(inv.transformPoint({ x: x + .5, y: y + .5 })); } return pts; };
    const ext = (pts, z = 1) => ({ x0: Math.min(...pts.map(p => p.x)) - .5 / z, x1: Math.max(...pts.map(p => p.x)) + .5 / z, y0: Math.min(...pts.map(p => p.y)) - .5 / z, y1: Math.max(...pts.map(p => p.y)) + .5 / z });   /* pixel centres in the local frame: the ink edge is half a pixel beyond the outermost centre */
    // text lines of the picture (bands of rows with red pixels), screen px
    const bands = () => {
      const d = mc.getImageData(0, 0, W, H).data, rows = [];
      for (let y = 0; y < H; y++) { let any = false; for (let x = 0; x < W && !any; x++) { const i = (y * W + x) * 4; any = isRed(d[i], d[i + 1], d[i + 2]); } rows.push(any); }
      const res = []; let y = 0;
      while (y < H) {
        if (!rows[y]) { y++; continue; }
        let y1 = y; while (y1 < H && (rows[y1] || rows[y1 + 1] || rows[y1 + 2])) y1++;
        let x0 = 1e9, x1 = -1e9;
        for (let yy = y; yy < y1; yy++) for (let x = 0; x < W; x++) { const i = (yy * W + x) * 4; if (isRed(d[i], d[i + 1], d[i + 2])) { if (x < x0) x0 = x; if (x > x1) x1 = x; } }
        res.push({ x0, x1: x1 + 1, y0: y, y1, cx: (x0 + x1 + 1) / 2 }); y = y1;
      }
      return res;
    };

    // 1. a centred label lands within 1.5 px (sideways) of its container's centre and its cap band within 2 px (up and down), at every zoom and camera roll
    {
      const cases = [
        ['sign HEIL', 'flat', () => UI.sign([300, 900, 400, 160], 'HEIL', { fill: '#0000ff', size: 72, ink: '#ff0000', id: 'c' })],
        ['sign gypsy Jumpy', 'round', () => UI.sign([300, 900, 400, 160], 'gypsy Jumpy', { fill: '#0000ff', size: 72, ink: '#ff0000', id: 'c' })],
        ['sign shrunk 19 chars', 'shrunk', () => UI.sign([300, 900, 400, 160], 'Bartholomew Wilhelm', { fill: '#0000ff', size: 60, ink: '#ff0000', id: 'c' })],
        ['sign Lucky HEEL', 'flat', () => UI.sign([300, 900, 400, 160], 'HEEL', { fill: '#0000ff', size: 80, font: 'Lucky', ink: '#ff0000', id: 'c' })],
        ['pill HEEL', 'flat', () => UI.pill('HEEL', 540, 960, { fill: '#0000ff', size: 60, ink: '#ff0000', id: 'c' })],
        ['pill Bangers spacing 12', 'round', () => UI.pill('SHIFT HAPPENS', 540, 960, { fill: '#0000ff', size: 60, font: 'Bangers', spacing: 12, ink: '#ff0000', id: 'c' })],
        ['pill Nunito spacing 8', 'round', () => UI.pill('RESIDENT COUNCIL', 540, 960, { fill: '#0000ff', size: 40, spacing: 8, ink: '#ff0000', id: 'c' })],
        ['pill italic', 'round', () => UI.pill('Italic HEEL', 540, 960, { fill: '#0000ff', size: 50, italic: true, ink: '#ff0000', id: 'c' })],
      ];
      let wdx = 0, wdy = 0, n = 0, shrunkOk = true, wcase = '';
      for (const z of [1, 1.5, 2]) for (const roll of [0, 3, 6]) for (const [name, kind, draw] of cases) {
        clear(); mc.translate(540, 960); mc.rotate(roll * Math.PI / 180); mc.scale(z, z); mc.translate(-540, -980);
        const r = draw(), M = mc.getTransform(), g = r.panel || r, e = ext(redPts(M), z);
        const dx = ((e.x0 + e.x1) / 2 - (g.x0 + g.x1) / 2) * z, dy = ((e.y0 + e.y1) / 2 - (g.y0 + g.y1) / 2) * z;
        if (Math.abs(dx) > wdx) { wdx = Math.abs(dx); wcase = `${name} z${z} roll${roll}`; }
        if (kind === 'flat') wdy = Math.max(wdy, Math.abs(dy));
        if (kind === 'shrunk' && !(r.k < 1 && r.k >= .5)) shrunkOk = false;
        n++;
      }
      add(`centred sideways at zoom 1/1.5/2 x roll 0/3/6 (${n} cases)`, wdx <= 1.5, `worst ${wdx.toFixed(2)} px (${wcase}), limit 1.5`);
      add('cap band centred in its container (same cases, flat-topped strings)', wdy <= 2, `worst ${wdy.toFixed(2)} px, limit 2`);
      add('a long string shrinks (never below half size) instead of overflowing', shrunkOk, shrunkOk ? 'k between 0.5 and 1' : 'k out of range');
    }
    // 2. alignment edges: ink edge exactly at the anchor, letter spacing included (no half-gap)
    {
      let worst = 0, wn = '';
      for (const [font, size, sp] of [['Nunito', 80, 0], ['Nunito', 80, 14], ['Bangers', 90, 12], ['Lucky', 90, 0]]) for (const al of ['left', 'center', 'right']) {
        clear(); UI.label('HEIL', 540, 960, { size, font, spacing: sp, align: al, fill: '#ff0000', hero: false });
        const b = bands()[0], err = Math.abs(540 - (al === 'left' ? b.x0 : al === 'right' ? b.x1 : b.cx));
        if (err > worst) { worst = err; wn = `${font} spacing ${sp} ${al}`; }
      }
      add('ink edge / centre sits on the anchor (3 fonts, letter spacing 0-14, left/centre/right)', worst <= 1.5, `worst ${worst.toFixed(2)} px (${wn}), limit 1.5`);
    }
    // 3. a title stack: every line centred on x, the block centred on y (ink to ink)
    {
      clear();
      const st = UI.stack([
        { t: 'SHIFT HAPPENS', font: 'Bangers', size: 150, spacing: 10, fill: '#ff0000', gap: 44 },
        { pill: 'EPISODE 99', font: 'Bangers', size: 46, spacing: 5, bg: '#0000ff', ink: '#ff0000', gap: 56 },
        { t: 'The UI Kit Test', font: 'Lucky', size: 84, fill: '#ff0000', gap: 44 },
        { lines: ['Everything is centred.', 'Nothing is squished.'], size: 46, weight: 800, fill: '#ff0000', gap: 70 },
        { t: 'a gypsy Jumpy production', size: 34, weight: 800, fill: '#ff0000' },
      ], { cx: 540, cy: 960, maxW: 960 });
      const bs = bands(), wx = Math.max(...bs.map(b => Math.abs(b.cx - 540))), cy = (bs[0].y0 + bs[bs.length - 1].y1) / 2;
      add('stack: every line centred on x', bs.length === 6 && wx <= 1.5, `${bs.length} lines, worst ${wx.toFixed(2)} px, limit 1.5`);
      add('stack: block centred on y (ink to ink)', Math.abs(cy - 960) <= 2, `centre ${cy} (want 960), limit 2`);
    }
    // 4. text typed in keeps the place of the whole string
    {
      clear(); UI.label('HELLO WORLD', 540, 960, { size: 80, fill: '#ff0000', reveal: 1 }); const full = bands()[0];
      clear(); UI.label('HELLO WORLD', 540, 960, { size: 80, fill: '#ff0000', reveal: .3 }); const part = bands()[0];
      add('typed-in text does not move while it grows', Math.abs(full.x0 - part.x0) <= 1 && part.x1 < full.x1 - 100, `first glyph at ${part.x0} (full string: ${full.x0}), partial ends at ${part.x1} of ${full.x1}`);
    }
    // 5. page: text sits on its rules (baseline = rule - 0.24 x pitch), upright and turned
    {
      let worst = 0;
      for (const rot of [0, .06, -.1]) {
        clear();
        const pg = UI.page([200, 300, 640, 760], { pitch: 80, top: 120, fill: '#0000ff', rule: '#00ff00', ruleLw: 2, shadow: 0, edge: '#0000ff', rot });
        ['HEIL', 'EEL HEIL', 'LIEH', 'HELIE EH', 'IIII', 'HEIL HEIL', 'EL', 'HE'].forEach((s, i) => UI.onRule(s, pg.inner[0] + 10, i, pg, { fill: '#ff0000', italic: false, weight: 900 }));
        const M = new DOMMatrix().translate(pg.cx, pg.cy).rotate(rot * 180 / Math.PI).translate(-pg.cx, -pg.cy);
        const red = redPts(M), green = redPts(M, (r, g, b) => g > 150 && r < 100 && b < 100);
        pg.rules.forEach((ry, i) => {
          const gy = green.filter(p => Math.abs(p.y - ry) < 6).map(p => p.y), gm = gy.reduce((a, b) => a + b, 0) / (gy.length || 1);
          const bottom = Math.max(...red.filter(p => p.y > ry - pg.pitch * .9 && p.y < ry + 4).map(p => p.y)) + .5;
          worst = Math.max(worst, Math.abs((gm - bottom) - pg.pitch * .24));
        });
      }
      add('page: text baseline sits 0.24 x pitch above its rule, upright and rotated (24 lines)', worst <= 1.5, `worst ${worst.toFixed(2)} px, limit 1.5`);
    }
    // 6. table: one baseline per row (mixed sizes, shrunk and cut cells), ink inside its cell, neighbours never touch
    {
      clear();
      const T = UI.table([100, 300, 880, 6 * 80], [{ w: 160, align: 'center', size: 30 }, { w: 300, size: 44 }, { w: 220, size: 36, align: 'right' }, { size: 28 }], [
        ['HE', 'HEIL HEIL', 'EEL', 'LIE'], ['EL', 'HEIL HEIL HEIL HEIL HEIL', 'HEIL EEL HEIL', 'HELIE HELIE HELIE'], ['HI', 'LEHI', 'IIII', 'HEIL'],
        ['EE', 'HHHHHHHHHHHHHHHHHHHHHHHH', 'LLLLLLLLLLLLLLLLLLLL', 'EEEEEEEEEEEEEEEEEEEEEEEEEE'], ['HE', 'HEIL', 'EEL', 'LIE'],
      ], { header: ['HE', 'HEIL', 'EEL', 'LIE'], fill: '#0000ff', grid: 'rgba(0,0,0,0)', stroke: null, lw: 0, text: { fill: '#ff0000' }, headText: { fill: '#ff0000' }, headFill: '#0000ff', id: 'T', hero: false });
      const red = redPts(mc.getTransform());
      let baseErr = 0, outside = 0, touch = 0, cells = 0, cut = 0, shrunk = 0;
      for (let r = -1; r < 5; r++) {
        let ink = [];
        for (let c = 0; c < 4; c++) {
          const cell = T.cell(r, c), pts = red.filter(p => p.x >= cell.x0 && p.x < cell.x1 && p.y >= cell.y0 && p.y < cell.y1);
          if (!pts.length) continue;
          const e = ext(pts); cells++; ink.push(e);
          baseErr = Math.max(baseErr, Math.abs(e.y1 - cell.base));
          if (e.x0 < cell.x0 + T.padX - 1.5 || e.x1 > cell.x1 - T.padX + 1.5) outside++;
          if (cell.ellipsis) cut++; if (cell.shrunk) shrunk++;
        }
        for (let i = 1; i < ink.length; i++) if (ink[i].x0 - ink[i - 1].x1 < 4) touch++;
      }
      add(`table: all cells of a row share one baseline (${cells} cells, sizes 17-44)`, baseErr <= 1, `worst ${baseErr.toFixed(2)} px off the row baseline, limit 1`);
      add('table: ink stays inside its cell padding, neighbouring cells never touch', outside === 0 && touch === 0, `${outside} outside, ${touch} touching`);
      add('table: too-long cells shrink, then get an ellipsis', shrunk >= 3 && cut >= 2, `${shrunk} shrunk, ${cut} cut with an ellipsis`);
    }
    return out;
  });
  for (const r of results) console.log(`  ${r.ok ? 'ok  ' : 'FAIL'}  pixels: ${r.name}: ${r.detail}`);
  await browser.close(); srv.close();
  process.exit(results.every(r => r.ok) ? 0 : 1);
})();
JS_END
  pxout=$(node "$PX" "$(pwd)" 2>&1 | grep -v 'Canvas2D: Multiple readback')
  rm -f "$PX"
  echo "$pxout"
  nfail=$(echo "$pxout" | grep -c '^  FAIL')
  [ "$nfail" -gt 0 ] && fail=$((fail + nfail))
  echo "$pxout" | grep -q '^  ok' || bad "the pixel stage printed no result (it did not run)"
fi

echo
if [ "$fail" -eq 0 ]; then
  [ -z "$SELFTEST_LOG" ] && rm -f "$LOG"
  echo "GATE SELFTEST: PASS"; exit 0
fi
echo "GATE SELFTEST: FAIL ($fail problem(s)); full audit log: $LOG"
exit 1
