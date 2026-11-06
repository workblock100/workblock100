"""Episode 21 score: THE INSPECTION. Light but real: the series' orchestra (pizzicato strings, a bassoon, a bass clarinet, a felt piano, a celesta) and three set pieces.

build_audio21 (a fresh copy of build_audio20's wrapper) calls score(script, scenes, lines, N) through --music build_music21; the mixer ducks the bed under every voice (and so does this file:
_speech_dip). Instruments and helpers come from build_music6 to build_music20 (the series' orchestra); the shape of the score is Episode 15 to 20's: every scene is rendered on two tracks (U through
the room's reverb, D dry), muted spans are applied after the reverb. build_audio21 hands in SPLIT (the medpass divider: the side it squeezes is ducked) and BONK (when the last binder lands).

THE SURVEY MOTIF (SM): the State at work, two bars of 4/4 in D minor: D D F D A - G F | E E G E C-sharp - D - (clipped, fussy, counting). It is the title's tick-tock (pizzicato strings and a
typewriter's clacks, 150 bpm), the surveyors' procedure (arrive, on a bassoon), and the end card's form typing itself (D major, 123 bpm). The stamp turns it to D major.

THE SET PIECES
  PREP      the montage, CUT TO THE BEAT: 120 bpm, the downbeat on the montage's start (7.211 s scene-local), 24 beats in six bars: a kick and the bass on every cut (every 1.0 s, where every effect
            lands), a snare on the off-cut (+0.5 s, the picture's second hit), hats on the off-eighths (the small ticks), a clavinet on the off-beats, a brass hook in the gaps, a fill in the last
            bar and a BUTTON on beat 25 (19.211 s). The count-in under the four lines before it is on the same grid.
  MEDPASS   THE SPLIT: two pieces at once in one key (F major) and one tempo (a quarter is 0.5 s): a polite string quartet minuet (3/4) on the LEFT (the State's half) and frantic ragtime piano
            (2/4, honky-tonk) on the RIGHT (a normal night). Their harmony moves together every three seconds (two minuet bars are three ragtime bars). When the divider squeezes a side, its
            piece ducks (SPLIT.gain). Both stop on the dominant: the sting is the tonic.
  CLOSET    a suspense bed, a beat of nothing when the doors open, THE AVALANCHE (a timpani roll and a falling cascade of xylophone, harp and pizzicato that lands exactly on the last binder's bonk),
            the scanner's synth pulse (16ths that open as the sweep goes, a stab on the lock), a heartbeat under the questions, Brenda's music box from Episode 20 through the door, a sad trombone.
  EXIT      tension strings under the deficiency, silence for the break and then one warm held chord (D major) into the shift bell, the comic revert collage (the ragtime of a normal night is back
            for two bars, a hit on every cue), a fanfare for Eggplant, sleigh bells for spring, and a warm resolution under 'I took a break.' (the series' theme on a felt piano).
"""
import numpy as np

from build_audio import SR, tarr, osc, ar, lp, hp, bp, midi, expdecay
from build_music6 import Track, hall, pizz, marimba, bell, sub_bass, pad, strings, brass, hat, timp, shaker, riser, epiano, kick, snare, clap, tick, crash, roll, MUSIC_GAIN
from build_music7 import woodblock, music_box, choir, slide_brass
import build_music10 as M10
from build_music10 import brush, cue_dips, _fit_rms, _fit_peak, piano, violin, oboe, tuba, slide_whistle
from build_music9 import uke, rising, spic, snap
from build_music13 import _mute, _speech_dip, glass, ubass, vib, cello, clav, kick13, snare13, clack_hi, clack_lo
from build_music14 import horn, celesta, bassoon, bdrum, xylo, trem_strings, harp
from build_music15 import sob_clar, comp, MT_ARP, TP_MAJ, TP_MIN
from build_music19 import felt, sad_trombone
from build_music20 import bassclar, sleigh, SDT

MUTES = []
R21 = np.random.default_rng(2721)
INFO = {}            # what the score decided, for build_audio21's cue report
SPLIT = None         # the medpass divider (an object with .gain(side, t)), handed in by build_audio21
BONK = None          # when the last binder lands on Mr. Radish (absolute s), handed in by build_audio21


def _n(d):
    return int(d * SR)


# ================================================================ new instruments
def honky(m, d=.3, vel=.8):
    """A honky-tonk upright: the piano note and a second string 14 cents sharp (the tuner has not been in since 2019), a little brighter, a short ring."""
    x = piano(m, d, vel) + .7 * piano(m + .14, d, vel)
    return hp(x, 90) * .6


def synpulse(m, d=.11, fc=1200.0, vel=.8):
    """The scanner's synth: a square and a detuned saw through a resonant low-pass at `fc`, a fast pluck envelope: a cyan, clinical blip."""
    t = tarr(d)
    f = midi(m)
    x = np.sign(np.sin(2 * np.pi * f * t)) * .5 + osc("saw", f * 1.006, d) * .5
    y = lp(x, fc, 2) + .5 * bp(x, fc * .8, fc * 1.25, 2)
    return y * np.minimum(1, t / .002) * np.exp(-t / (d * .45)) * ar(d, .001, min(.02, d * .3)) * (.5 + .5 * vel)


def synstab(notes, d=.6, fc=2200.0):
    """A synth stab (saws, a filter that closes): the scanner locking on."""
    t = tarr(d)
    x = sum(osc("saw", midi(m), d) + osc("saw", midi(m) * 1.008, d) for m in notes) / (2 * max(1, len(notes)))
    return lp(x, fc, 2) * np.minimum(1, t / .003) * np.exp(-t / (d * .35)) * ar(d, .002, .1)


def typeclack(vel=1.0):
    """The title's typewriter-like percussion: a type bar's clack (a band of noise rung at 2.6 kHz) over a small platen thud."""
    d = .07
    t = tarr(d)
    x = bp(R21.uniform(-1, 1, len(t)), 1500, 5000) * np.exp(-t / .006) + np.sin(2 * np.pi * 2600 * t) * np.exp(-t / .01) * .3 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / .012) * .4
    return x * ar(d, .0003, .02) * vel


def gliss(T, at, lo, hi, d, inst, g, pan=0.0, scale=(0, 2, 4, 5, 7, 9, 11), root=0, down=False):
    """A glissando up (or down) the scale from midi lo to hi in d seconds on inst(midi, duration)."""
    notes = [m for m in range(lo, hi + 1) if (m - root) % 12 in scale]
    if down:
        notes = notes[::-1]
    for j, m in enumerate(notes):
        T.put(inst(m, .4), at + d * j / max(1, len(notes)), g * (.7 + .3 * j / max(1, len(notes))), pan)


def harpn(m, d=.4):
    return harp(m, max(d, .9), .6)


# ================================================================ the motifs
# THE SURVEY MOTIF: (beat, midi, beats), two bars of 4/4 in D minor
SM = ((0, 62, .5), (.5, 62, .5), (1, 65, .5), (1.5, 62, .5), (2, 69, 1), (3, 67, .5), (3.5, 65, .5),
      (4, 64, .5), (4.5, 64, .5), (5, 67, .5), (5.5, 64, .5), (6, 61, 1), (7, 62, 1))


def sm(T, at, bl, inst, g, major=False, octave=0, pan=0.0, bars=(0, 1), tail=.9):
    """Play the survey motif from `at` (the first chosen bar's downbeat), `bl` a beat in seconds; `major` raises the F to F-sharp (the stamp has landed). Returns the end time."""
    t0 = min(bars) * 4
    end = at
    for b, m, du in SM:
        if int(b // 4) not in bars:
            continue
        mm = m + 1 if (major and m % 12 == 5) else m
        t = at + (b - t0) * bl
        T.put(inst(mm + 12 * octave, du * bl * tail), t, g, pan)
        end = max(end, t + du * bl)
    return end


def pz(m, d=.3):
    """A pizzicato note by midi number."""
    return pizz(midi(m), max(.12, min(d, .5)))


# ================================================================ context: the cue table (absolute times of the script's cues) and the lines
CTX = {"script": None, "scenes": []}


def cue_abs(name, scene=None, k=0):
    """Absolute time (s) of the k-th cue of this name in the script (optionally in one scene), or None."""
    by = {x["id"]: x for x in CTX["scenes"]}
    n = 0
    for sc in (CTX["script"] or {"scenes": []})["scenes"]:
        if scene and sc["id"] != scene:
            continue
        ts = by.get(sc["id"])
        if ts is None:
            continue
        for b in sc["beats"]:
            for c in b.get("sfx", []):
                if c[0] == name:
                    if n == k:
                        bt = ts["beats"][b["id"]]
                        return ts["start"] + (bt["e"] if c[1] == "end" else bt["s"] + c[1])
                    n += 1
    return None


def W(line, word, k=0):
    """Absolute time of a word in a line of the current scene (the same proportional word times the captions use)."""
    try:
        return M10.wt(line, word, k)
    except Exception:
        ln = M10._CTX["lines"].get((M10._CTX["scene"], line))
        return ln["s"] if ln else 0.0


def _side(t, side):
    """The divider's gain for a side at absolute time t (1.0 when build_audio21 has not handed SPLIT in)."""
    if SPLIT is None:
        return 1.0
    return float(SPLIT.gain(side, np.asarray([t]))[0])


# ================================================================ title: the checklist, the tick-tock and the stamp
BL_T = .4                          # the title's beat (150 bpm); the bars start at 0.6 s, the pickup at 0.2; the stamp is the downbeat of bar 3 (3.8 s) and the text ding of bar 4 (5.4 s)
BL_E = .4875                       # the end card's (123 bpm): 0.1 to 4.0 s is two bars and the stamp is the downbeat of the third


def cue_title21(T, t0, d, beats, D):
    """The surveyor's clipboard (6.8 s). 0.2: a pizzicato pickup (A). Bars 1 and 2 (0.6 to 3.8): THE SURVEY MOTIF in D minor on pizzicato violins over a tick-tock pizzicato bass (D, A on every beat),
    the typewriter-like percussion (a clack on every eighth, a heavier one on 2 and 4) and a cello pedal; the pen's ticks fall inside it (1.8, 2.4, 3.0). 3.0 to 3.8: a snare roll and a riser as the
    reticle slides to the title. THE STAMP (3.8) is the downbeat: D major (a brass stab, a timpani, a bass drum, a cymbal, the strings), and bar 3 plays the motif again in D MAJOR on pizzicato and a
    glockenspiel an octave up. THE TEXT DING (5.4): the last chord, D major ninth, strings, a horn and a celesta F-sharp on top, held to the cut."""
    a = t0 + .6
    T.put(pz(57, .3), t0 + .2, .1, -.1)
    sm(T, a, BL_T, lambda m, dd: pz(m + 12, dd), .1, pan=.15)
    sm(T, a, BL_T, lambda m, dd: spic(m, min(.09, dd)), .025, pan=-.2)
    for k in range(8):
        T.put(pz((38, 33)[k % 2], .35), a + k * BL_T, .12, -.1)
    for k in range(16):
        D.put(typeclack(1.0 if k % 4 == 2 else .55), a + k * BL_T / 2, .03 if k % 4 == 2 else .018, .25 if k % 2 else -.15)
    T.put(cello(38, 1.7, .7, a=.3, r=.4), a, .05, 0)
    T.put(cello(33, 1.5, .7, a=.3, r=.3), a + 4 * BL_T, .05, 0)
    land = t0 + 3.8
    for j in range(16):
        D.put(snare(.1), land - .8 + j * .05, .008 + .03 * (j / 15) ** 1.5, .1 * np.sin(j))
    T.put(riser(.8, 500, 5000, .4), land - .8, .025, 0)
    T.put(brass([50, 54, 57, 62], .45, .01, .2, 2400), land, .06, 0)
    D.put(timp(73.4, 1.2), land, .1, 0)
    D.put(bdrum(.9, 1.0), land, .1, 0)
    D.put(crash(1.4), land, .04, .15)
    T.put(strings([38, 50, 54, 57, 62, 66], 1.6, .03, .9, 5.0, 2600), land, .1, 0)
    sm(T, land, BL_T, lambda m, dd: pz(m + 12, dd), .08, major=True, pan=.15, bars=(0,))
    sm(T, land, BL_T, lambda m, dd: bell(midi(m + 24), .6) * .5, .035, major=True, pan=.3, bars=(0,))
    for k in range(4):
        T.put(pz((38, 45)[k % 2], .35), land + k * BL_T, .1, -.1)
    fin = t0 + 5.4
    T.put(strings([38, 45, 50, 57, 61, 64, 66], 1.4, .1, .8, 5.0, 2600), fin, .12, 0)
    T.put(horn(57, 1.2, .55, a=.08, r=.5), fin, .05, .1)
    T.put(celesta(90, 1.2, .6), fin + .04, .045, .3)
    T.put(felt(50, 1.3, .5), fin, .06, -.1)
    D.put(timp(73.4, 1.0), fin, .06, 0)
    T.fade(t0 + d - .6, t0 + d, 1, 0)
    D.fade(t0 + d - .6, t0 + d, 1, 0)
    INFO["title"] = "the survey motif in D minor at 150 bpm (bars from 0.6 s), the stamp the downbeat of bar 3 (3.8 s, D major), the last chord on the ding (5.4 s)"


# ================================================================ arrive: the silhouettes, the whisper chain, the best day, the PA, 'Yes!'
def cue_arrive21(T, t0, d, beats, D):
    """3:02 PM, the arrival (24.7 s). THE SILHOUETTES (the sting is the sfx's, 0.7 s): from 0.75 s a low tense drone (a cello D and a sub), a high string cluster in tremolo, so quiet it is more a
    held breath, and a soft timpani heartbeat (every 0.8 s) under Ms. Kale's line. THE WHISPER CHAIN (5.12 to 8.57): a tense whisper of pizzicato eighths in D minor (140 bpm, pianissimo) that
    travels from left to right with the camera, a brush under it. ONION'S JOY (8.67): a choir 'aah' on D major that swells under both her lines, a harp glissando up on 'The State is here!' and a
    celesta on 'best' and 'life'. RADISH (12.45): the procedure, the survey motif on a dry bassoon (100 bpm). THE PA (15.11 to 18.19): a drum roll (a snare and a timpani) that climbs under the
    page, choked on 'stations' as everyone scatters. BINDER (18.39): his four rising notes (D E F-sharp A) on a marimba and a glockenspiel, a pizzicato bass. 'YES!' (20.72): a cartoon hit (a brass
    chord, a timpani, a cymbal) on the word. 'Great! I'll hide everything.': a sneaky descending pizzicato (D C B-flat A) and a low bassoon A under the grin. The sting is the sfx's."""
    op, ka1, m1, l1, t1, o1, o2, ra0, me1, b1, st1, b2, en = (beats[k] for k in ("open", "ka1", "m1", "l1", "t1", "o1", "o2", "ra0", "me1", "b1", "st1", "b2", "end"))
    dr = t0 + .75
    dl = m1[0] - dr + .3
    T.put(cello(38, dl, .8, a=.6, r=.5), dr, .06, 0)
    T.put(sub_bass(midi(26), dl) * np.minimum(1, tarr(dl) / .4), dr, .035, 0)
    T.put(trem_strings([88, 89], dl, 12.0, .8, .6, 4200), dr, .012, .2)
    k = 0
    while ka1[0] + k * .8 < ka1[1] + .3:
        D.put(timp(73.4, .6), ka1[0] + k * .8, .035 if k % 2 == 0 else .022, 0)
        k += 1
    a, b = m1[0] - .05, t1[1] + .05
    pat = (62, 64, 65, 64, 62, 61, 62, 57)
    n = int((b - a) / .214)
    for j in range(n):
        at = a + j * .214
        T.put(pz(pat[j % 8] + 12, .16), at, .08, -.6 + 1.2 * j / max(1, n - 1))
        if j % 2 == 0:
            D.put(brush(.18), at, .025, -.6 + 1.2 * j / max(1, n - 1))
    jd = o2[1] + .3 - o1[0]
    ch = choir([62, 66, 69, 74], jd, "a", a=.6, r=.9)
    T.put(ch, o1[0] - .1, .07, 0)
    gliss(T, o1[0], 62, 86, .5, harpn, .05, .2, root=2, scale=(0, 2, 4, 5, 7, 9, 11))
    T.put(celesta(86, 1.2, .6), W("o2", "best") + .02, .05, .3)
    T.put(celesta(90, 1.6, .6), W("o2", "life") + .02, .05, .3)
    bl = .6
    sm(T, ra0[0] + .05, bl, lambda m, dd: bassoon(m - 24, dd * .7, .8), .09, pan=-.1, bars=(0,))
    for j in range(4):
        T.put(pz((50, 57)[j % 2], .2), ra0[0] + .05 + j * bl + bl / 2, .035, .25)
    ra, rb = me1[0], me1[1] - .04
    t = ra
    while t < rb:
        u = (t - ra) / (rb - ra)
        D.put(snare(.1), t, .006 + .03 * u ** 1.6, .15 * np.sin(t * 40))
        t += 1 / (14 + 10 * u ** 1.5)
    D.put(roll(55, rb - ra, int((rb - ra) * 9)) * np.interp(tarr(rb - ra + .6), [0, rb - ra, rb - ra + .6], [.3, 1, 0]), ra, .04, 0)
    D.put(crash(.5) * np.exp(-tarr(.5) / .12), rb, .06, .1)
    D.put(bdrum(.8, .5), rb, .08, 0)
    for j, m in enumerate((62, 64, 66, 69)):
        T.put(marimba(midi(m), .25), b1[0] + .05 + j * .12, .07, -.1)
        T.put(bell(midi(m + 12), .6) * .5, b1[0] + .05 + j * .12, .045, .25)
    for j in range(4):
        T.put(ubass((38, 45)[j % 2], .35, .7), b1[0] + .05 + j * .5, .1, -.1)
        if j % 2:
            comp(T, b1[0] + .05 + j * .5, [62, 66, 69], .3, .04, .35)
    hit = st1[0] - .03
    T.put(brass([50, 54, 57, 62, 66], .3, .006, .12, 2600), hit, .08, 0)
    D.put(timp(73.4, .8), hit, .1, 0)
    D.put(crash(.9) * np.exp(-tarr(.9) / .2), hit, .04, .15)
    for j, m in enumerate((62, 60, 58, 57)):
        T.put(pz(m, .18), b2[0] + .1 + j * .2, .06, .2 - .1 * j)
    T.put(bassoon(33, .9, .8), (cue_abs("grin", "arrive") or b2[1] - .3), .07, -.1)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)
    INFO["arrive"] = "drone and heartbeat 0.75 to %.2f; whisper pizzicato %.2f to %.2f (pan -0.6 to 0.6); choir from %.2f; PA roll %.2f to %.2f; 'Yes!' hit %.2f" % (
        m1[0] - t0, a - t0, b - t0, o1[0] - .1 - t0, ra - t0, rb - t0, hit - t0)


# ================================================================ prep: the count-in, THE MONTAGE (120 bpm, cut to the beat), the agency, Brenda's closet
MONT_PROG = (("Dm7", 38), ("G7", 43), ("Bbmaj7", 46), ("A7", 45), ("Dm7", 38), ("A7", 45))
CH21 = {"Dm7": (62, 65, 69, 72), "G7": (59, 62, 65, 67), "Bbmaj7": (58, 62, 65, 69), "A7": (61, 64, 67, 69), "D": (62, 66, 69, 74), "F": (60, 65, 69), "C7": (58, 60, 64, 67),
        "Bb": (58, 62, 65), "D7": (60, 62, 66, 69), "Gm7": (58, 62, 65, 67)}


def montage(T, D, m0, lvl=1.0):
    """THE MONTAGE from m0 (the downbeat, absolute s): six bars of 4/4 at 120 bpm (a beat is 0.5 s). Returns the button's time (beat 25)."""
    bl = .5
    for bar, (ch, root) in enumerate(MONT_PROG):
        b0 = m0 + bar * 4 * bl
        for beat in range(4):
            at = b0 + beat * bl
            if beat in (0, 2):
                D.put(kick13(1.0), at, .16 * lvl, 0)
                T.put(ubass(root + (0 if beat == 0 else 7), .4, .9), at, .16 * lvl, -.05)
                T.put(sub_bass(midi(root - 12), .35), at, .05 * lvl, 0)
            else:
                D.put(snare13(.9), at, .1 * lvl, .05)
                D.put(clap(.15), at + .004, .025 * lvl, -.1)
            D.put(hat(.04), at + bl / 2, .045 * lvl, .3)
            D.put(hat(.03), at + bl / 4, .015 * lvl, -.25)
            D.put(hat(.03), at + 3 * bl / 4, .015 * lvl, -.25)
            if beat in (1, 3):
                for q, m in enumerate(CH21[ch]):
                    T.put(clav(m, .12, .8), at + bl / 2 + .006 * q, .03 * lvl, .35 - .08 * q)
            else:
                T.put(clav(CH21[ch][0], .08, .5, mute=True), at + bl / 2, .025 * lvl, .35)
            if beat == 1:
                T.put(ubass(root + 12, .2, .7), at + bl / 2, .09 * lvl, -.05)
        if bar % 2 == 0 and bar < 5:
            for q, m in enumerate(CH21[ch][:3]):
                T.put(brass([m + 12], .16, .006, .06, 2600), b0 + 3.5 * bl + .25 * 0, .022 * lvl, .1 * q - .1)
                T.put(brass([m + 12], .22, .006, .08, 2600), b0 + 3.5 * bl + .25, .026 * lvl, .1 * q - .1)
    f0 = m0 + 5 * 4 * bl + 2 * bl
    for j in range(8):
        D.put(snare13(.6 + .4 * j / 7, ghost=j % 2 == 1), f0 + j * bl / 4, (.04 + .06 * j / 7) * lvl, .2 * np.sin(j))
    btn = m0 + 24 * bl
    T.put(brass([50, 57, 62, 66, 69, 71], .32, .005, .12, 2800), btn, .09 * lvl, 0)
    T.put(ubass(38, .5, .9), btn, .18 * lvl, 0)
    D.put(kick13(1.0), btn, .18 * lvl, 0)
    D.put(crash(.7) * np.exp(-tarr(.7) / .15), btn, .05 * lvl, .1)
    D.put(timp(73.4, .7), btn, .08 * lvl, 0)
    T.put(glass(98, .6, .01, .4), btn, .02 * lvl, .3)
    return btn


def cue_prep21(T, t0, d, beats, D):
    """3:05 PM, survey mode (31.6 s). THE COUNT-IN (0.3 s to the montage) is on the montage's own grid: a soft nervous hat on the off-eighths and a muted bass tick on the beat, growing; Tomato's lines
    get his rising pizzicato (major for 'Label everything!', minor for the Fun Committee), Onion's 'Date it. Time it. Initial it.' three bass-clarinet notes on the three 'it's and 'Laminate it.' a
    little rising zip; a snare roll and a riser lift into THE MONTAGE (see montage: 120 bpm, the downbeat at 7.211 s, the BUTTON at 19.211 s). Then the gleaming station is silent; the agency
    arrives as three rising pizzicato pops on the poofs (D, F-sharp, A) and a harp; 'Agency!' a brass 'ta-da'; 'Who are they?' a bassoon that asks; BRENDA'S CLOSET (25.33): her lullaby from
    Episode 20 (the snow-day tune on a music box, in F, slow) heard through the door; 'Survey ready.' a bright D major chord with a celesta glitter held to the sting."""
    t1, o1, t2, o1b, mt, me1, ag, ch1, s1, l1, br1, o2, en = (beats[k] for k in ("t1", "o1", "t2", "o1b", "montage", "me1", "agency", "ch1", "s1", "l1", "br1", "o2", "end"))
    m0 = mt[0]
    k = 1
    while m0 - k * .25 > t0 + .3:
        at = m0 - k * .25
        u = 1 - (m0 - at) / (m0 - t0 - .3)
        if k % 2 == 1:
            D.put(hat(.035), at, .016 + .026 * u, .3)
        if k % 2 == 0 and (k // 2) % 2 == 0:
            T.put(ubass(38, .18, .5), at, .045 + .06 * u, -.1)
        k += 1
    for q, m in enumerate(TP_MAJ):
        T.put(pz(m + 12, .16), t1[0] + .05 + q * .05, .07, .3)
    for q, m in enumerate(TP_MIN):
        T.put(pz(m + 12, .2), t2[1] - .2 + q * .07, .06, .3)
    for j in range(3):
        try:
            at = W("o1", "it", j)
        except Exception:
            at = o1[0] + .5 * j
        T.put(bassclar((50, 53, 57)[j], .3, .8, a=.03, r=.08), at, .08, -.2)
    for j, m in enumerate((62, 64, 66, 67, 69, 71, 73, 74)):
        T.put(pz(m + 12, .1), o1b[1] - .2 + j * .025, .035, .2)
    for j in range(16):
        D.put(snare(.1), m0 - 1.0 + j * .0625, .006 + .035 * (j / 15) ** 1.6, .1 * np.sin(j))
    T.put(riser(1.0, 400, 6000, .4), m0 - 1.0, .02, 0)
    btn = montage(T, D, m0, lvl=1.8)
    T.gate(btn + .35, me1[1] + .1, 0.0, .05)
    D.gate(btn + .35, me1[1] + .1, 0.0, .05)
    for j in range(3):
        at = cue_abs("poof", "prep", j) or ag[0] + .1 + .25 * j
        T.put(pz((74, 78, 81)[j] + 12, .25), at + .02, .08, -.3 + .3 * j)
    gliss(T, ag[0] + .1, 62, 86, .9, harpn, .04, 0, root=2)
    T.put(brass([62, 66, 69, 74], .3, .006, .12, 2600), ch1[0] - .02, .07, 0)
    D.put(timp(73.4, .7), ch1[0] - .02, .07, 0)
    T.put(bassoon(45, .35, .8), s1[0] + .05, .06, -.1)
    T.put(bassoon(50, .45, .8), s1[0] + .4, .06, -.1)
    for j, m in enumerate((62, 57)):
        T.put(pz(m, .25), l1[0] + .1 + .45 * j, .05, .2)
    lb = .9
    LT = Track(T.N)
    for j, (b, m, du) in enumerate(SDT):
        if b >= 8:
            continue
        at = br1[0] + .1 + b * lb
        if at > br1[1] + .3:
            break
        LT.put(music_box(midi(m + 5), min(du * lb * 2 + .4, 1.6)), at, .07, .3)
    LT.put(strings([41, 48, 53, 57], br1[1] - br1[0] + .4, .8, .6, 4.8, 1200), br1[0], .025, .2)
    LT.buf = np.stack([lp(LT.buf[0], 1400, 2), lp(LT.buf[1], 1400, 2)])
    T.buf += LT.buf
    T.put(strings([50, 57, 62, 66, 69, 74], en[0] + .2 - o2[0], .3, .4, 5.0, 2800), o2[0] + .05, .07, 0)
    T.put(celesta(93, 1.0, .6), W("o2", "ready") + .05, .05, .3)
    T.put(celesta(98, .9, .6), W("o2", "ready") + .2, .035, -.2)
    T.gate(en[0] + .1, t0 + d + 1, 0.0, .1)
    T.fade(t0 + d - .4, t0 + d, 1, 0)
    D.fade(t0 + d - .4, t0 + d, 1, 0)
    INFO["prep"] = "count-in from 0.3 s on the montage's grid; montage downbeat %.3f s scene-local, 120 bpm, 24 beats, kick and bass on every cut, the button at %.3f s; Brenda's lullaby (music box, through the door) from %.2f" % (
        m0 - t0, btn - t0, br1[0] - t0)


# ================================================================ medpass: THE SPLIT (a minuet on the left, ragtime on the right, one key, one tempo)
SPLIT_CH = ("F", "C7", "F", "Bb", "F", "D7", "C7", "C7")            # the harmony of each 3 s segment (two minuet bars = three ragtime bars)
RAG_CH = (("F", "F", "F"), ("C7", "C7", "C7"), ("F", "F", "F"), ("Bb", "Bb", "F"), ("F", "F", "F"), ("D7", "D7", "Gm7"), ("C7", "C7", "C7"), ("C7", "C7", "C7"))
RAG_ROOT = {"F": 29, "C7": 36, "Bb": 34, "D7": 38, "Gm7": 31}
MIN_MEL = ((72, 77, 81), (79, 77, 76), (76, 79, 82), (79, None, 76), (77, 81, 84), (82, 81, 79), (74, 77, 82), (81, 79, 77),
           (72, 77, 81), (79, 81, 82), (81, 78, 74), (82, 81, 79), (79, 76, 72), (70, 72, 76), (79, None, None), (76, 74, 72))
MIN_LOW = {"F": (41, (57, 60)), "C7": (36, (55, 58)), "Bb": (34, (53, 58)), "D7": (38, (54, 60)), "Gm7": (43, (58, 62))}


def minuet21(T, a, bl, lvl=1.0, pan=-.65):
    """The State's minuet (3/4, a quarter is `bl`): violin I on the tune (MIN_MEL, a light vibrato: polite), the cello on every downbeat, the viola and violin II on beats two and three (the
    'pah-pah'), a soft pizzicato under the cello. Sixteen bars from `a`; the harmony is SPLIT_CH (a chord per two bars). Placed on the left."""
    for bar in range(16):
        ch = SPLIT_CH[bar // 2] if bar < 14 else "C7"
        if bar == 11:
            ch = "Gm7"
        b0 = a + bar * 3 * bl
        mel = MIN_MEL[bar]
        for k in range(3):
            m = mel[k]
            if m is None:
                continue
            du = 1
            while k + du < 3 and mel[k + du] is None:
                du += 1
            g = _side(b0 + k * bl, "L")
            T.put(violin(m, du * bl * .92, vib=.003, a=.03, r=.08), b0 + k * bl, .045 * lvl * g, pan)
        root, inner = MIN_LOW[ch]
        g0 = _side(b0, "L")
        T.put(cello(root, bl * 1.5, .7, a=.04, r=.15), b0, .05 * lvl * g0, pan + .15)
        T.put(pz(root + 12, .25), b0, .03 * lvl * g0, pan + .15)
        for k in (1, 2):
            for q, m in enumerate(inner):
                T.put(spic(m, bl * .45), b0 + k * bl, .028 * lvl * _side(b0 + k * bl, "L"), pan - .15 + .1 * q)


def rag_bar(T, b0, bl, ch, lvl=1.0, pan=.65, fill=False):
    """One bar of the ragtime (2/4, a quarter is `bl`): the stride left hand (a low root on beat one, the chord on its 'and', the fifth on beat two, the chord again) and a frantic right hand in
    sixteenths (the chord's tones climbing and turning, accented 3 + 3 + 2, a chromatic lower neighbour into the top), all on a honky-tonk upright."""
    root = RAG_ROOT[ch]
    tones = sorted(set(m % 12 for m in CH21[ch]))
    g = lvl * _side(b0, "R")
    T.put(honky(root, .3, .9), b0, .07 * g, pan + .1)
    T.put(honky(root + 7, .3, .8), b0 + bl, .06 * g, pan + .1)
    for k in (.5, 1.5):
        for q, m in enumerate(CH21[ch][:3]):
            T.put(honky(m - 12, .18, .6), b0 + k * bl + .004 * q, .035 * g, pan - .05)
    ladder = [m for m in range(77, 98) if m % 12 in tones]
    pat = (0, 2, 1, 3, 2, 4, 3, 5) if not fill else (5, 4, 3, 2, 1, 0, 1, 2)
    st = bl / 4
    for j, p in enumerate(pat):
        m = ladder[min(len(ladder) - 1, p)]
        acc = j in (0, 3, 6)
        if j == 6 and not fill:
            T.put(honky(m - 1, st * .8, .6), b0 + j * st - st / 2, .02 * g, pan)
        T.put(honky(m, st * 1.2, .9 if acc else .6), b0 + j * st, (.05 if acc else .032) * g, pan - .1)


def cue_medpass21(T, t0, d, beats, D):
    """5:30 PM, the observation (27.3 s). From 1.0 s, when the divider has landed, TWO PIECES AT ONCE in F major with a quarter of 0.5 s (120 bpm): on the LEFT the State's string-quartet minuet
    (sixteen bars of 3/4: minuet21), on the RIGHT a normal night's frantic ragtime on a honky-tonk upright (twenty-four bars of 2/4: rag_bar); their chords change together every 3 s (two minuet bars
    are three ragtime bars). The divider's squeeze ducks the side it squeezes (Split.gain: under 'Six.' the ragtime falls about 5 dB). The cart rolling away (12.23) is a piano glissando down on
    the right; both pieces stop on the dominant (C7) at 25.0 s and the sting is the tonic."""
    a = t0 + 1.0
    bl = .5
    minuet21(T, a, bl)
    for seg in range(8):
        for k in range(3):
            b0 = a + seg * 3.0 + k * 1.0
            rag_bar(T, b0, bl, RAG_CH[seg][k], lvl=1.25, fill=(seg == 7 and k == 2))
    cr = cue_abs("cartroll", "medpass") or t0 + 12.23
    for j, m in enumerate(range(96, 59, -1)):
        if m % 12 in (0, 2, 4, 5, 7, 9, 11):
            T.put(honky(m, .12, .7), cr + .02 + j * .011, .025 * _side(cr, "R"), .8)
    end = a + 24.0
    T.gate(end + .25, t0 + d + 1.0, 0.0, .2)
    D.gate(end + .25, t0 + d + 1.0, 0.0, .2)
    T.fade(t0 + d - .3, t0 + d, 1, 0)
    sq = SPLIT.source if SPLIT is not None else "none"
    INFO["medpass"] = "minuet (left, 3/4) and ragtime (right, 2/4) in F at 120 bpm from 1.0 to 25.0 s, chords together every 3 s; ducked by the divider (%s)" % sq


# ================================================================ closet: the suspense, THE AVALANCHE, the scanner, the questions, 'Not Brenda.'
def cue_closet21(T, t0, d, beats, D):
    """7:10 PM, the policy closet (27.2 s). THE SUSPENSE (0.2 to 5.4): a low string drone (D and A), a high tremolo, a pizzicato D that ticks every 0.6 s; 'Of course.' two notes of Onion's bass
    clarinet. A BEAT OF NOTHING from just before the doors open to the pour (MUTES). THE AVALANCHE: a timpani roll that climbs from the pour to the bonk, a cascade that falls from D7 to D3 (a
    xylophone, a harp and pizzicato in sixteenths, faster as it goes) over a cymbal swell, and on THE LAST BINDER'S BONK (BONK, from the simulation) a woodblock, a timpani and a choked cymbal: the
    music lands on it, then silence. 'Policy seven point four. Revised Tuesday.' (8.03): a harp glissando up and Onion's policy (the survey motif's first bar on the bass clarinet, in D MAJOR: she is
    proud) and a glockenspiel on 'Tuesday'. 'Impressive.' one dry low bassoon D. THE SCANNER (12.28 to 14.48): the synth pulse (sixteenths on D F A C, 0.12 s, a filter that opens with the sweep),
    a synth stab and a sub drop on the lock (13.68). THE QUESTIONS (14.5 to 23.6): a heartbeat (a low synth D a second) and a high harmonic; through the closet door on Brenda's lines her music box
    (two notes each). The bed stops on the pen (23.6). 'Not Brenda.' (24.16): a sad trombone, the last 'waaah' after her line."""
    op, ra1, o1, av, o2, ra2, scn, ra3, br1, ra4, br2, ra5, o3, en = (beats[k] for k in ("open", "ra1", "o1", "avalanche", "o2", "ra2", "scan", "ra3", "br1", "ra4", "br2", "ra5", "o3", "end"))
    op_t = cue_abs("closetopen", "closet") or av[0] + .1
    pour = cue_abs("binderavalanche", "closet") or op_t + .2
    bk = BONK if (BONK is not None and pour + .6 < BONK < o2[0]) else t0 + 7.65
    sd = op_t - .05 - (t0 + .2)
    T.put(cello(38, sd, .8, a=.8, r=.3), t0 + .2, .05, 0)
    T.put(cello(45, sd, .7, a=1.0, r=.3), t0 + .25, .035, .1)
    T.put(trem_strings([86, 87], sd, 12.0, 1.0, .3, 4000), t0 + .3, .01, .2)
    k = 0
    while t0 + .4 + k * .6 < op_t - .1:
        T.put(pz(62, .2), t0 + .4 + k * .6, .04, -.2)
        k += 1
    T.put(bassclar(57, .35, .8, a=.03, r=.08), o1[0] + .05, .07, -.2)
    T.put(bassclar(62, .5, .8, a=.03, r=.12), o1[0] + .45, .07, -.2)
    MUTES.append((op_t - .08, pour - .02, .02))
    span = bk - pour
    D.put(roll(55, span, max(8, int(span * 14))) * np.interp(tarr(span + .6), [0, span, span + .6], [.2, 1, 0]), pour, .05, 0)
    D.put(riser(span, 3000, 9000, .5), pour, .02, 0)
    notes = [m for m in range(98, 49, -1) if m % 12 in (2, 4, 5, 7, 9, 10, 0)]
    for j, m in enumerate(notes):
        u = j / max(1, len(notes) - 1)
        at = pour + span * (1 - (1 - u) ** 1.35) * .96
        if at > bk - .04:
            break
        inst = (lambda mm, dd: xylo(mm, .2, .8)) if m > 74 else (lambda mm, dd: pz(mm, .2))
        T.put(inst(m, .2), at, .05, -.5 + 1.0 * ((j * 7) % 11) / 10)
        if j % 3 == 0:
            T.put(harpn(m - 12), at, .025, .2)
    D.put(woodblock(), bk, .07, .05)
    D.put(timp(73.4, .9), bk, .1, 0)
    D.put(crash(.4) * np.exp(-tarr(.4) / .06), bk, .05, .1)
    T.gate(bk + .05, o2[0] - .02, 0.0, .03)
    gliss(T, o2[0], 62, 86, .45, harpn, .045, .2, root=2)
    sm(T, o2[0] + .5, .42, lambda m, dd: bassclar(m - 12, dd * .9, .8, a=.03, r=.1), .08, major=True, pan=-.2, bars=(0,))
    T.put(bell(midi(93), 1.0) * .5, W("o2", "tuesday") + .1, .05, .3)
    T.put(bassoon(26, .6, .8), ra2[1] + .02, .07, 0)
    a, lock = scn[0], (cue_abs("scanlock", "closet") or scn[0] + 1.4)
    arp = (50, 53, 57, 60)
    j = 0
    while a + j * .12 < lock - .02:
        u = j * .12 / max(.1, lock - a)
        T.put(synpulse(arp[j % 4] + 12 * ((j // 4) % 2), .11, 600 + 2400 * u, .8), a + j * .12, .05 + .02 * u, -.4 + .8 * u)
        j += 1
    T.put(synstab([50, 53, 56, 62], .7, 2600), lock, .07, .2)
    T.put(sub_bass(midi(26), .6) * np.exp(-tarr(.6) / .2), lock, .06, 0)
    hb_end = (cue_abs("penscratch", "closet") or ra5[0] + .5)
    k = 0
    while scn[1] + .1 + k * 1.0 < hb_end - .1:
        at = scn[1] + .1 + k * 1.0
        T.put(synpulse(38, .3, 500, .9) * 1.0, at, .12, 0)
        T.put(synpulse(38, .25, 420, .6), at + .22, .075, 0)
        k += 1
    T.put(glass(86, hb_end - scn[1], .8, .6), scn[1] + .1, .012, .3)
    for ln, (m1_, m2_) in ((br1, (77, 76)), (br2, (79, 77))):
        LT = Track(T.N)
        LT.put(music_box(midi(m1_ + 5), 1.4), ln[0] + .1, .04, .4)
        LT.put(music_box(midi(m2_ + 5), 1.4), ln[0] + .55, .035, .4)
        LT.buf = np.stack([lp(LT.buf[0], 1300, 2), lp(LT.buf[1], 1300, 2)])
        T.buf += LT.buf
    T.gate(hb_end, o3[0] - .02, 0.0, .05)
    sad_trombone(T, o3[0] + .02, [(55, .3), (54, .3), (53, .3), (52, .75)], .07, .1)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)
    INFO["closet"] = "suspense 0.2 to %.2f; silence %.2f to %.2f; the avalanche lands on the bonk at %.3f s (%s); scanner pulse %.2f to %.2f, the lock %.2f; heartbeat to %.2f; sad trombone %.2f" % (
        op_t - t0, op_t - .08 - t0, pour - t0, bk - t0, "build_audio21's bonk" if (BONK is not None and abs(bk - BONK) < 1e-6) else "the default 7.65 s", scn[0] - t0, lock - t0, lock - t0, hb_end - t0, o3[0] - t0)


# ================================================================ exit: the deficiency, THE BREAK, the snap back, Eggplant, 'I took a break.'
def cue_exit21(T, t0, d, beats, D):
    """10:45 PM, the exit interview (32.9 s). TENSION STRINGS under the deficiency (a D minor cluster in tremolo that swells into 'We found one deficiency.'), a sforzando and a timpani on the gasp
    (3.0), a cello that sinks under 'Your nurse has not taken a break.', a pizzicato question on 'Which nurse?', and under 'The one.' a single low D and a high harmonic held over the beat. 'Per
    regulation, she takes one now.': the harmony turns to the major (a soft D major pad); 'Per regulation!' Onion's choir. The clock (13.07) and 'Okay.' have no music. THE BREAK (15.08 to
    18.68): silence for the chair and the exhale, then ONE WARM HELD CHORD (D major with an added ninth on soft strings and a pad, pianissimo) that swells into the shift bell (18.38) and fades
    under 'Deficiency corrected.'; the stamp (19.63) is a pizzicato and a timpani. THE SNAP BACK (20.65 to 23.05): the ragtime of a normal night bursts back for two bars with a hit on every
    cue (a slide whistle on the poof, a bassoon on the closet, a xylophone run on the coffee maker, a harp falling with the labels), cut on the door chime; a brass 'ta-da' for Eggplant; sleigh bells
    and the snow-day tune's first notes for 'Spring came early.'; under the report a warm D major bed and on 'I took a break.' the series' theme on a felt piano and a celesta, resolved."""
    op, ka1, me1, ra1, s1, ra2, ka2, o1, clk, s2, brk, ka3, rv, eg1, s3, eg2, s4, eg3, s5, en = (beats[k] for k in (
        "open", "ka1", "me1", "ra1", "s1", "ra2", "ka2", "o1", "clock", "s2", "break", "ka3", "revert", "eg1", "s3", "eg2", "s4", "eg3", "s5", "end"))
    gp = cue_abs("gasp", "exit") or ka1[0] + 1.5
    T.put(trem_strings([50, 53, 57, 64], gp - (t0 + .2) + .1, 10.0, 1.0, .15, 2600), t0 + .2, .04, 0)
    T.put(strings([38, 50, 53, 57, 61], .5, .01, .3, 5.0, 3000), gp, .09, 0)
    D.put(timp(73.4, 1.0), gp, .09, 0)
    T.put(cello(50, ra1[1] - ra1[0], .8, a=.3, r=.3), ra1[0], .05, 0)
    T.put(cello(49, s1[0] - ra1[1] + .3, .7, a=.2, r=.2), ra1[1] - .05, .04, 0)
    for j, m in enumerate((57, 62)):
        T.put(pz(m, .25), s1[0] + .1 + .25 * j, .05, .2)
    hold = ka2[0] - .1 - ra2[0]
    T.put(cello(26, hold, .8, a=.4, r=.5), ra2[0], .05, 0)
    T.put(glass(86, hold, .5, .6), ra2[0] + .1, .015, .3)
    T.put(pad([50, 54, 57, 62, 66], ka2[1] - ka2[0] + 1.0, .9, .8, 1400), ka2[0] + .6, .05, 0)
    T.put(choir([62, 66, 69, 74], o1[1] - o1[0] + .5, "a", a=.2, r=.5), o1[0], .06, 0)
    T.put(celesta(90, 1.0, .6), o1[0] + .3, .04, .3)
    ex = cue_abs("exhale", "exit") or brk[0] + .8
    bell_t = cue_abs("shiftbell", "exit") or brk[1] - .3
    ca = ex + .5
    cd = (ka3[0] + .6) - ca
    held = strings([38, 45, 50, 54, 57, 64], cd, cd * .75, .7, 4.5, 1500) + pad([50, 57, 62, 66, 69, 76], cd, cd * .7, .7, 1100) * .7
    T.put(held, ca, .025, 0)
    st = cue_abs("stamp", "exit") or ka3[0] + .9
    T.put(pz(50, .3), st, .08, 0)
    D.put(timp(73.4, .8), st, .07, 0)
    dc = cue_abs("doorclose", "exit") or rv[0] + .1
    ch_t = cue_abs("doorchime", "exit") or eg1[0] - .3
    for k, ch in enumerate(("F", "C7", "F", "C7")):
        b0 = dc + .08 + k * 1.0
        if b0 > ch_t - .3:
            break
        rag_bar(T, b0, .5, ch, lvl=1.55, pan=.2)
    T.gate(ch_t - .02, ch_t + 3.0, 0.0, .03)
    pf = cue_abs("poof", "exit")
    if pf:
        T.put(slide_whistle(84, 72, .35), pf, .03, -.2)
    co = cue_abs("closetopen", "exit")
    if co:
        T.put(bassoon(31, .3, .9), co, .08, .3)
    cm = cue_abs("coffeemaker", "exit")
    if cm:
        for j, m in enumerate((74, 77, 81, 84, 88)):
            T.put(xylo(m, .15, .8), cm + .03 + j * .05, .04, -.2)
    lp_ = cue_abs("labelpeel", "exit")
    if lp_:
        gliss(T, lp_, 70, 94, .4, harpn, .03, .2, root=5, down=True)
    T.put(brass([62, 66, 69, 74], .14, .005, .06, 2600), ch_t + .02, .06, 0)
    T.put(brass([66, 69, 74, 78], .3, .005, .12, 2800), ch_t + .17, .07, 0)
    D.put(timp(73.4, .6), ch_t + .17, .06, 0)
    T.put(sleigh(.6, 22, 3400, 8800), W("eg2", "spring"), .05, .3)
    for j, m in enumerate((81, 78, 81, 83)):
        T.put(celesta(m + 12, .5, .6), W("eg2", "spring") + .1 + j * .2, .035, .25)
    wa = s4[0] - .1
    T.put(strings([38, 50, 54, 57, 62], s5[0] - wa + .2, 1.2, .8, 4.5, 1500), wa, .04, 0)
    for i, m in enumerate(MT_ARP):
        T.put(felt(m + 2 - 12, 1.2, .5), s5[0] + .05 + i * .2, .05 * (.6 + .4 * i / 7), -.2 + .05 * i)
    T.put(celesta(86, 1.4, .6), W("s5", "break") + .05, .045, .3)
    fin = s5[1] + .05
    T.put(strings([38, 50, 54, 57, 62, 66, 69], en[0] + .3 - fin, .2, .6, 4.5, 1700), fin, .07, 0)
    T.put(felt(50, 1.5, .5), fin, .06, -.1)
    T.put(horn(57, 1.0, .5, a=.15, r=.5), fin + .05, .035, .1)
    T.gate(en[0] + .2, t0 + d + 1, 0.0, .15)
    T.fade(t0 + d - .6, t0 + d, 1, 0)
    D.fade(t0 + d - .6, t0 + d, 1, 0)
    INFO["exit"] = "tension 0.2 to %.2f; the break silent until %.2f, then one held D major add9 to %.2f (the bell %.2f); revert ragtime %.2f to %.2f; warm resolution from %.2f" % (
        gp - t0, ca - t0, ca + cd - t0, bell_t - t0, dc + .08 - t0, ch_t - t0, wa - t0)


# ================================================================ end: the statement of deficiencies
def cue_end21(T, t0, d, beats, D):
    """The end card (7.5 s). 0.1 to 4.0 s: the survey motif in D MAJOR, the form typing itself (pizzicato violins, a glockenspiel an octave up, a pizzicato bass on every beat, the typewriter's
    clack on the eighths) at 123 bpm; THE STAMP (4.0) is the downbeat: CORRECTED: a D major ninth (strings and a horn, a brass stab, a timpani and a bass drum), held and unresolved to the cut, a
    celesta F-sharp on top; the text ding (5.1) sits inside it."""
    a = t0 + .1
    sm(T, a, BL_E, lambda m, dd: pz(m + 12, dd), .09, major=True, pan=.15)
    sm(T, a, BL_E, lambda m, dd: bell(midi(m + 24), .5) * .5, .025, major=True, pan=.3)
    for k in range(8):
        T.put(pz((38, 45)[k % 2], .35), a + k * BL_E, .11, -.1)
    for k in range(16):
        D.put(typeclack(.9 if k % 4 == 2 else .5), a + k * BL_E / 2, .022 if k % 4 == 2 else .013, .2 if k % 2 else -.2)
    land = t0 + 4.0
    T.put(strings([38, 50, 57, 61, 64, 66, 69], 3.4, .05, 1.6, 5.0, 2400), land, .14, 0)
    T.put(horn(54, 2.8, .6, a=.08, r=1.0), land, .07, .1)
    T.put(brass([50, 57, 62, 66], .45, .01, .18, 2400), land, .06, 0)
    D.put(timp(73.4, 1.4), land, .09, 0)
    D.put(bdrum(.7, .8), land, .09, 0)
    T.put(ubass(38, 2.4, .6), land, .14, -.1)
    T.put(felt(61, 3.0, .5), land + .02, .06, -.1)
    T.put(celesta(90, 2.4, .6), land + .7, .04, .3)
    T.fade(t0 + 6.4, t0 + 7.35, 1, 0)
    D.fade(t0 + 6.4, t0 + 7.35, 1, 0)
    INFO["end"] = "the survey motif in D major at 123 bpm 0.1 to 4.0 s; the stamp the downbeat (4.0 s), D major ninth held"


# ================================================================ the cue table, levels and the score
CUES = {"title": cue_title21, "arrive": cue_arrive21, "prep": cue_prep21, "medpass": cue_medpass21, "closet": cue_closet21, "exit": cue_exit21, "end": cue_end21}
LEVEL21 = {"title": 1.8, "arrive": 2.2, "prep": 2.2, "medpass": 2.8, "closet": 2.2, "exit": 2.2, "end": 1.8}
TAIL21 = {"title": .5, "arrive": .4, "prep": .4, "medpass": .4, "closet": .4, "exit": .5, "end": .3}
DIP21 = {"title": 1.0, "arrive": .62, "prep": .62, "medpass": .75, "closet": .62, "exit": .62, "end": 1.0}
REVERB21 = {"title": (.3, 1.0), "arrive": (.3, 1.1), "prep": (.22, .8), "medpass": (.25, .9), "closet": (.3, 1.0), "exit": (.35, 1.2), "end": (.35, 1.3)}
DIPS21 = {"stamp": (4, .3, .3), "textding": (3, .2, .2), "dramatic": (4, .6, .4), "closetopen": (3, .3, .2), "binderavalanche": (3, 1.2, .6), "scanlock": (3, .3, .2), "gasp": (3, .3, .2),
          "doorclose": (3, .2, .2), "labelgun": (2.5, .15, .15), "padlock": (2.5, .15, .15), "spray": (2.5, .15, .15), "thermobeep": (2.5, .15, .15), "binderslam": (2.5, .15, .15),
          "mop": (2.5, .15, .15), "posterflip": (2.5, .15, .15), "closetslam": (2.5, .15, .15), "coffeehide": (2.5, .15, .15), "sanitizer": (2.5, .15, .15), "crashcart": (2.5, .15, .15),
          "sparkle": (2.5, .2, .2), "binderpop": (2, .2, .2), "pachime": (3, .6, .3), "splitwipe": (2, .3, .2), "cartroll": (2, .6, .4), "shiftbell": (3, .8, .5)}


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    M10._CTX["lines"] = {(ln["scene"], ln["id"]): ln for ln in lines}
    CTX["script"], CTX["scenes"] = script, scenes
    MUTES.clear()
    INFO.clear()
    DIPCACHE = {}
    out = np.zeros((2, N))
    for sc in scenes:
        fn = CUES.get(sc["id"])
        if not fn:
            continue
        M10._CTX["scene"] = sc["id"]
        t0 = sc["start"]
        beats = {k: (t0 + v["s"], t0 + v["e"]) for k, v in sc["beats"].items()}
        U, D = Track(N), Track(N)
        fn(U, t0, sc["dur"], beats, D)
        for X in (U, D):
            X.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.2, 0.0, .15)             # a cue's dry tail never bleeds into the next scene
        a, b = max(0, int((t0 - .05) * SR)), min(N, int((t0 + sc["dur"] + 3.2) * SR))
        wet, rt = REVERB21.get(sc["id"], (.3, 1.0))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL21.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP21.get(sc["id"], .6)
        dips = DIPCACHE.setdefault(key, None)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        out[:, a:b] += seg * LEVEL21.get(sc["id"], 1.0) * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS21)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
