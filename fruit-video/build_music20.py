"""Episode 20 score: THE SNOW DAY. A cosy winter chamber-jazz trio (an upright bass, brushes, a vibraphone and a celesta with sleigh-bell colours), warm and slightly wry.

build_audio20 (a fresh copy of build_audio19's wrapper) calls score(script, scenes, lines, N) through --music build_music20; the mixer ducks the bed under every voice (and so does this file:
_speech_dip). Instruments and helpers come from build_music6 to build_music19 (the series' orchestra); the shape of the score is Episode 15 to 19's: every scene is rendered on two tracks (U through
the room's reverb, D dry), muted spans are applied after the reverb. New here: a bass clarinet (Onion's instrument), sleigh bells, a hold-music bed that is a telephone's, a tempo that follows the
time-lapse's speed (build_audio20 hands the lapse's curve in as LAPSE).

THE SNOW-DAY TUNE (SDT), one motif in three moods. Four bars of 4/4 in C: G E G A C6 A | G E D C | A F A B D6 B | A G F E (the first phrase leaps up and falls home, the second says it a step higher
and stops one note short of home, so that it is always asking for the next bar). It is written once (SDT) and played three ways:
  THE SNOW DAY   bright and major (C, 120 bpm): glockenspiel and marimba, a ukulele on the off-beats, sleigh bells, an upright bass: Tomato's mood (forecast).
  THE POLICY     its deadpan minor-mode twin (the third, sixth and seventh lowered), two octaves down, on a bass clarinet with no vibrato and no hurry: Onion's mood. It answers every Onion line.
  THE LULLABY    the tune on a music box and a celesta over soft strings, in F, slow: Brenda's flashlight (blackout) and the day room.

MOTIFS AND SCENES
  TITLE     the series' theme in G major as a music box (the arpeggio rocks 0.2 to 3.2 s at 80 bpm on a music box and a felt piano, a warm pad, a sleigh-bell shimmer when the snow settles at 3.2 s), the
            tune on a celesta (3.2 to 5.45 s), and the last chord, G major seventh, held under the text ding.
  FORECAST  the TV's own weather bed (1.6 to 4.0 s, a soft synth pad through a small speaker), the bright march on Tomato's two 'Snow day!' (4.2 and 26.2 s: a sleigh-bell shake, a glockenspiel run, a ukulele
            strum on the party popper), the bass clarinet on every Onion line (5.17, 21.46, 24.57 s: the policy, with a sob on the sniffle), a hold-music bed from the speakerphone's click (8.2 to 15.9 s,
            band-limited, plastic), the slow tiptoe of a pizzicato to the door and a bass drum and a timpani on the snow.
  LOT       wind-led: a lonely trudging bass (one note a bar, 8.3 to 18.7 s), a far drone, a three-note flourish for Tomato, the policy on Onion's fall risk, a falling pizzicato on the slip; the call-out is a dry
            comic pizzicato (A DITCH is two notes falling, WHICH DITCH? three rising, SPRING a pluck and a bell).
  BLACKOUT  no music in the dark but a very low drone (0.2 to 12.3 s); the generator's catch is the first bar (13.13 s, a warm chord and a bass); a stumbling pizzicato for the candles (one note on each
            click); the bass clarinet on Onion; a flat waltz for 'Coffee is not life safety.' (24.1 to 27.0 s); Brenda's music box for the flashlight (the lullaby); the two dead clicks are silence;
            the scene ends on one held note.
  DAYROOM   a candlelit lullaby: the snow-day tune slowed and softened (F, 56 bpm) on a celesta and a music box over soft strings; a celesta drop for 'Water.'; the plow's amber light is a slow swell; the Moon
            is left almost alone (a single high note, the weather).
  NIGHT     a sparse felt piano under the report (D minor, one chord a line, a low D and a cello pedal), the lapse (a glockenspiel and vibraphone ostinato whose RATE FOLLOWS THE PICTURE'S SPEED, a rising
            string and a held shimmer), the Moon over a warm G major pad (the title's key) with three falling bells, the dawn (a G major chord that opens with bells and a horn), the callbacks almost unscored.
  END       the news-weather sting in full (a synth marimba, a ukulele, a bass and sleigh bells at 123 bpm, 0.1 to 4.0 s), the stamp as a downbeat (a bass drum, a timpani, the strings) and a held C major
            seventh for the teaser.
"""
import os

import numpy as np

from build_audio import SR, tarr, ar, lp, hp, bp, midi, osc, expdecay
from build_music6 import Track, hall, pizz, marimba, bell, sub_bass, pad, strings, brass, hat, timp, shaker, riser, epiano, MUSIC_GAIN
from build_music7 import woodblock, music_box
import build_music10 as M10
from build_music10 import clarinet, brush, ride, cue_dips, _fit_rms, _fit_peak
from build_music9 import uke, rising
from build_music13 import _mute, _speech_dip, glass, ubass, vib, cello
from build_music14 import horn, celesta, bassoon, bdrum, xylo
from build_music15 import sob_clar, comp, MT_ARP, TP_MAJ, TP_MIN, callfx
from build_music19 import felt

MUTES = []
R20 = np.random.default_rng(2720)
INFO = {}            # what the score decided, for build_audio20's cue report
LAPSE = None         # the time-lapse's curve (an object with .u_at(t), .a, .b, .active), handed in by build_audio20


def _n(d):
    return int(d * SR)


# ================================================================ new instruments
def bassclar(m, d=1.0, vel=.8, a=.05, r=.15, sag=0.0):
    """A bass clarinet in its low register: hollow and woody (odd harmonics 1/k^0.7 with a trace of the even ones, closed off at 1.8 kHz, a body formant between 380 and 700 Hz), the click of the reed at
    the start, a breath of air, NO vibrato at all: deadpan. `sag`: the number of semitones the note droops by its end (a deflating note)."""
    t = tarr(d)
    f0 = midi(m)
    f = f0 * 2 ** (-sag * (t / d) ** 2 / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum((1 / k ** .7 if k % 2 else .1 / k) * np.sin(k * ph) for k in range(1, 14) if f0 * k < 5000)
    y = lp(x, 1800, 2) + .6 * bp(x, 380, 700, 1)
    y = y + bp(R20.uniform(-1, 1, len(t)), 700, 2400, 1) * np.exp(-t / .05) * .06 + bp(R20.uniform(-1, 1, len(t)), 500, 3000, 1) * .012
    return _fit_rms(y * ar(d, a, min(r, d * .45))) * (.45 + .55 * vel)


def sleigh(d=.5, n=24, lo=3200, hi=9000, shape=1.0):
    """Sleigh bells shaken (mono): `n` tiny jingles over `d` seconds, each a small metal ping near `lo` to `hi` Hz with the inharmonic partials of a crotal bell and a burst of rattle, swelling and fading
    like a shake. The colour of the winter."""
    out = np.zeros(_n(d))
    for i in range(n):
        at = R20.uniform() ** shape * max(.01, d - .12)
        f = R20.uniform(lo, hi)
        t = tarr(.14)
        c = sum(a_ * np.sin(2 * np.pi * f * k * t + R20.uniform(0, 6.28)) * np.exp(-t / (.05 / k)) for k, a_ in ((1, 1.0), (1.51, .5), (2.31, .3))) + bp(R20.uniform(-1, 1, len(t)), 4500, 10500) * np.exp(-t / .004) * .6
        j = int(at * SR)
        m = min(len(c), len(out) - j)
        if m > 0:
            out[j:j + m] += c[:m] * R20.uniform(.3, 1.0) * np.sin(np.pi * min(1.0, at / max(d, .01))) ** .5
    return out * .4


def synmar(m, d=.25):
    """A bright synth marimba, the news station's: a marimba's sine with a hard 4x partial, a short xylophone click and a square pulse at the front."""
    t = tarr(d)
    f = midi(m)
    x = marimba(f, d) + .35 * xylo(m + 12, d, .8)[:len(t)] * np.exp(-t / .05) + .12 * np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t / .03)
    return x


def stab(notes, d=.3):
    """A synth stab (the news sting's chord): saws through a 3 kHz low-pass, short."""
    t = tarr(d)
    x = sum(osc("saw", midi(m), d) + .6 * osc("square", midi(m) * 1.004, d) for m in notes) / max(1, len(notes))
    return lp(x, 3000, 2) * np.minimum(1, t / .004) * np.exp(-t / (d * .4)) * ar(d, .002, min(.05, d * .4))


def holdlead(m, d=.4):
    """The hold music's lead: a plastic synth flute (a square through a 2.6 kHz low-pass, a fast shallow vibrato, a hint of chorus), a bland, sustained, well-meaning sound."""
    t = tarr(d)
    f = midi(m) * (1 + .004 * np.sin(2 * np.pi * 6.2 * t))
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 + np.sin(2 * np.pi * np.cumsum(f * 1.004) / SR) * .5
    return _fit_rms(lp(x, 2600, 2) * ar(d, .03, min(.1, d * .4)), .22)


# ================================================================ the tune
# (beat, midi in C major, beats) of the four bars; the same notes in every mood
SDT = ((0, 79, .5), (.5, 76, .5), (1, 79, .5), (1.5, 81, .5), (2, 84, 1.5), (3.5, 81, .5),
       (4, 79, 1), (5, 76, .5), (5.5, 74, .5), (6, 72, 2),
       (8, 81, .5), (8.5, 77, .5), (9, 81, .5), (9.5, 83, .5), (10, 86, 1.5), (11.5, 83, .5),
       (12, 81, 1), (13, 79, .5), (13.5, 77, .5), (14, 76, 2))
SDT_CH = (("C", 36), ("C", 36), ("F", 41), ("G", 43))        # chord and bass root per bar
CHORDS = {"C": (60, 64, 67), "F": (60, 65, 69), "G": (59, 62, 67), "Cm": (60, 63, 67), "Fm": (60, 65, 68), "Am": (57, 60, 64), "Dm": (57, 62, 65)}
MINOR_PC = (4, 9, 11)       # the third, the sixth and the seventh of C: lowered in the twin


def sdt(T, at, bl, inst, g, bars=(0, 1, 2, 3), tr=0, minor=False, octave=0, pan=0.0, tail=1.0, stretch=1.0, gains=None):
    """Play the snow-day tune from `at`: `bars` picks the bars (0 to 3), `bl` is a beat in seconds, `tr` transposes (semitones), `minor` lowers the third, sixth and seventh, `octave` moves it (octaves),
    `inst(midi, duration)` makes a note. Returns the time at which the last chosen bar ends."""
    t0 = None
    end = at
    for k, (b, m, du) in enumerate(SDT):
        bar = int(b // 4)
        if bar not in bars:
            continue
        if t0 is None:
            t0 = bar * 4
        mm = m - 1 if (minor and m % 12 in MINOR_PC) else m
        t = at + (b - t0) * bl * stretch
        d_ = du * bl * stretch * .93 * tail
        T.put(inst(mm + tr + 12 * octave, d_), t, g * (1.0 if gains is None else gains[k % len(gains)]), pan)
        end = max(end, t + du * bl * stretch)
    return end


def chord_u(T, at, name, g=.07, tr=0, pan=.3, minor=False):
    """A ukulele strum of a chord of the march (the minor mode lowers the third)."""
    ch = list(CHORDS[name])
    if minor:
        ch = [m - 1 if m % 12 in (4, 9, 11) else m for m in ch]
    uke(T, at, [m + tr for m in ch], g, pan)


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


def LN(scene, line):
    """The finished line (absolute s, e, words) of a spoken beat."""
    return M10._CTX["lines"][(scene, line)]


def W(line, word, k=0):
    """Absolute time of a word in a line of the current scene (the same proportional word times the captions use)."""
    return M10.wt(line, word, k)


def lapse_u(t):
    """The time-lapse's intensity u (0 in real time, 1 at the picture's top speed) at absolute times t: build_audio20's curve (lapse.json), or the fixed ease in (0.7 s), hold, ease out (0.9 s)."""
    t = np.asarray(t, dtype=float)
    if LAPSE is not None and getattr(LAPSE, "active", False):
        return LAPSE.u_at(t)
    sc = next((s for s in CTX["scenes"] if s["id"] == "night"), None)
    if sc is None:
        return np.zeros_like(t)
    a, b = sc["start"] + sc["beats"]["lapse"]["s"], sc["start"] + sc["beats"]["lapse"]["e"]
    x = lambda v: np.clip(v, 0, 1) ** 2 * (3 - 2 * np.clip(v, 0, 1))
    return np.minimum(x((t - a) / .7), x((b - t) / .9)) * ((t >= a) & (t <= b))


# ================================================================ title and end: the globe in G major and the news in C
TR_TITLE = 7                       # G major
BL_T = .75                         # a beat of the title's theme (80 bpm): the bar is 3.0 s, 0.2 to 3.2 s, and the landing is the snow settling
BL_E = .4875                       # a beat of the end card's (123 bpm): 0.1 to 4.0 s is eight beats and the stamp is the downbeat


def tomato20(T, at, g=.08, minor=False):
    """Tomato's pizzicato: a rising chord on pizzicato strings, major (it is a party) or minor (it is not)."""
    for q, m in enumerate(TP_MIN if minor else TP_MAJ):
        T.put(pizz(midi(m + 12), .16), at + q * .05, g, .3)


def cue_title20(T, t0, d, beats, D):
    """The snow globe (6.8 s). 0.2 to 3.2: the series' theme's arpeggio in G major at 80 bpm on a felt piano with a music box over it (the sfx's tines are the sparkle), a warm pad that breathes, an
    upright bass on 1 and 3 and a brush on 2 and 4 (the globe's shake at 1.1 s is a brush too); the last beat is the subdominant. THE SNOW SETTLES at 3.2 s: the landing is a soft G add-ninth on strings,
    a horn and a timpani, a sleigh-bell shimmer; then the tune's first notes (B A G) on a celesta over a felt piano (3.2 to 5.45). Under the text ding (5.4 s, G and D) the last chord: G major seventh
    (G D F-sharp B), strings, a horn on the third, a celesta on the F-sharp on top, held to the cut."""
    a = t0 + .2
    st = BL_T / 2
    land = a + 4 * BL_T
    for i, m in enumerate(MT_ARP):
        lv = .55 + .45 * i / 7
        n = m + TR_TITLE
        T.put(felt(n - 12, 1.0, .5), a + i * st, .1 * lv, -.2 + .05 * i)
        T.put(music_box(midi(n + 12), 1.0) * .5, a + i * st + .004, .03 * lv, .3)
    root = 36 + TR_TITLE + 12
    for k, (r_, g) in enumerate(((0, .16), (7, .12))):
        T.put(ubass(root + r_, BL_T * 1.6, .6), a + 2 * k * BL_T, g, -.1)
    T.put(pad([48 + TR_TITLE, 52 + TR_TITLE, 55 + TR_TITLE, 60 + TR_TITLE], 3 * BL_T, .6, .4, 1400), a, .085)
    T.put(pad([53 + TR_TITLE, 57 + TR_TITLE, 60 + TR_TITLE, 65 + TR_TITLE], BL_T + .1, .15, .3, 1500), a + 3 * BL_T, .085)
    for k in (1, 3):
        D.put(brush(.3), a + k * BL_T, .05, .2)
    D.put(brush(.4), t0 + 1.1, .045, 0)
    T.put(riser(2.6, 500, 4200, .3), a + .3, .02, 0)
    T.put(strings([43, 50, 55, 59, 62, 69], 2.4, .12, 1.2, 5.0, 2200), land, .1, 0)
    T.put(horn(55, 1.6, .55, a=.08, r=.7), land, .06, .1)
    D.put(timp(98.0, 1.0), land, .07, 0)
    D.put(sleigh(1.5, 26, 3400, 8800) * .6, land - .05, .04, .1)
    for off, m, dd in ((0, 83, 1.5), (1.5, 81, .5), (2, 79, 1)):                         # B5 A5 G5: the tune's first notes in G
        at = land + off * BL_T
        T.put(celesta(m, dd * BL_T * .95 + .3, .7), at, .08, .15)
        T.put(felt(m - 12, 1.2, .55), at, .06, -.1)
    for k, m in enumerate((43, 50, 43)):
        T.put(ubass(m, .5, .6), land + k * 1.5 * BL_T, .14, -.1)
    fin = t0 + 5.45
    T.put(strings([43, 50, 54, 59, 62, 66, 74], 1.9, .12, .9, 5.0, 2600), fin, .13, 0)
    T.put(horn(59, 1.6, .55, a=.08, r=.6), fin, .06, .1)
    T.put(felt(55, 2.0, .5), fin, .08, -.1)
    T.put(felt(62, 2.0, .45), fin + .02, .06, 0)
    T.put(felt(66, 2.0, .45), fin + .04, .06, .1)
    T.put(celesta(90, 1.6, .6), fin + .06, .05, .3)
    T.put(ubass(43, 1.4, .6), fin, .15, -.1)
    D.put(timp(98.0, 1.2), fin, .09, 0)
    T.fade(t0 + d - .8, t0 + d, 1, 0)
    D.fade(t0 + d - .8, t0 + d, 1, 0)


def cue_end20(T, t0, d, beats, D):
    """The closings (7.5 s). 0.1 to 4.0 s: THE NEWS-WEATHER STING IN FULL, eight beats at 123 bpm in C: a synth marimba climbs the arpeggio of each chord in sixteenths and lands on a held note and a
    turn (C, Am, F, G), under a ukulele on the off-beats, an upright bass on every beat, sleigh bells on 2 and 4, a woodblock and a rising riser into THE STAMP (4.0 s), the downbeat on which the
    chord arrives: C major seventh (C G B E), strings and a horn, a stab, a bass drum and a timpani, then held and unresolved to the cut (a celesta B on top; the text ding at 5.1 s is C and G, inside
    it)."""
    a = t0 + .1
    land = t0 + 4.0
    bars = ((72, 76, 79, 84, 88, 86, "C", 36), (69, 72, 76, 81, 84, 83, "Am", 33), (65, 69, 72, 77, 81, 79, "F", 29), (67, 71, 74, 79, 83, 81, "G", 31))
    for q, (m0, m1, m2, m3, m4, m5, ch, rt) in enumerate(bars):
        b0 = a + q * 2 * BL_E
        for j, m in enumerate((m0, m1, m2, m3)):
            T.put(synmar(m, .2), b0 + j * BL_E / 4, .085, -.15 + .1 * j)
        T.put(synmar(m4, .45), b0 + BL_E, .09, .15)
        T.put(synmar(m5, .2), b0 + 1.5 * BL_E, .07, .2)
        for k in range(2):
            T.put(ubass(rt + 12 + (0 if k == 0 else 7), BL_E * .9, .7), b0 + k * BL_E, .15, -.1)
            comp(T, b0 + k * BL_E + BL_E / 2, list(CHORDS[ch]), .3, .05, .35)
        D.put(woodblock(), b0 + BL_E, .025, .3)
        D.put(woodblock(), b0 + 2 * BL_E - .01, .02, -.3)
        D.put(sleigh(.3, 10), b0 + BL_E, .035, .2)
    T.put(riser(.9, 800, 6200, .4), land - .9, .03, 0)
    chm = [36, 43, 47, 52, 55, 59]
    T.put(strings(chm + [64, 71], 3.4, .08, 1.7, 5.0, 2400), land, .15, 0)
    T.put(horn(52, 2.8, .6, a=.08, r=1.0), land, .08, .1)
    T.put(stab([60, 64, 67, 71, 76], .5), land, .06, 0)
    D.put(timp(65.4, 1.4), land, .09, 0)
    D.put(bdrum(.7, .8), land, .09, 0)
    T.put(ubass(36, 2.4, .6), land, .15, -.1)
    T.put(felt(59, 3.0, .5), land + .02, .07, -.1)
    T.put(celesta(95, 2.4, .6), land + .8, .04, .3)
    T.put(celesta(88, 2.0, .6), land + .3, .035, .2)
    T.fade(t0 + 6.4, t0 + 7.35, 1, 0)
    D.fade(t0 + 6.4, t0 + 7.35, 1, 0)


# ================================================================ forecast: the snow day, the policy and the hold music
def hold_music(N, a, b):
    """The speakerphone's hold music from a to b (absolute seconds), a stereo clip the length of the whole mix: a corporate loop at 96 bpm in C (Cmaj7, Am7, Dm7, G7, two beats of a bar each, a thin
    electric piano on the chords, a bland synth flute on a tune that goes nowhere, a drum machine's hat and a rim click), closed off like a telephone (350 Hz to 3.4 kHz with a little grit), very low. It
    stops dead at b, as when someone is taken off hold."""
    H = Track(N)
    bl = 60 / 96.0
    prog = ((48, 52, 55, 59), (45, 48, 52, 55), (50, 53, 57, 60), (43, 47, 50, 53))
    mel = ((76, 2), (79, 1), (81, 1), (79, 2), (76, 1), (74, 1), (72, 2), (74, 1), (76, 1), (74, 4))
    t = a
    k = 0
    while t < b - .05:
        ch = prog[k % 4]
        for q, m in enumerate(ch):
            H.put(epiano(midi(m + 12), 2.0 * bl, .5), t + .012 * q, .045, -.1 + .08 * q)
        H.put(sub_bass(midi(ch[0] - 12), 1.8 * bl), t, .05, 0)
        t += 2 * bl
        k += 1
    t = a + bl
    for m, n in mel * 2:
        if t > b - .05:
            break
        H.put(holdlead(m, n * bl * .9), t, .05, .2)
        t += n * bl
    for i in range(int((b - a) / (bl / 2))):
        at = a + i * bl / 2
        if at < b - .02:
            H.put(hat(.04), at, .02 if i % 2 else .03, .3)
            if i % 4 == 2:
                H.put(woodblock(), at, .018, -.2)
    H.fade(b - .03, b, 1, 0)
    H.gate(0, a, 0.0, .005)
    H.gate(b, b + 3.0, 0.0, .005)
    H.buf = callfx(H.buf, 350, 3400)
    return H.buf


def cue_forecast20(T, t0, d, beats, D):
    """2:00 PM, the station (28.8 s). THE TV'S BED (1.5 to 4.1): the weather channel's soft synth chords (F major seventh, G) through a small speaker under the anchor. TOMATO'S 'SNOW DAY!' (4.2): a
    sleigh-bell shake, then on the popper (4.6) a ukulele strum and the bright tune's first notes on a glockenspiel (G E G A, fast) and a C that Onion's line cuts. THE POLICY (5.17 to 7.6): on Onion's
    'Per policy, healthcare is essential.' the tune's minor twin, a bass clarinet two octaves down at 97 bpm, one bar (G E-flat G A-flat C A-flat), whose last note lands with her sniffle (7.27: a
    sob); 'Essential.' (7.46) a pedal C. THE HOLD MUSIC (8.2 to 15.95) is the speakerphone's, band-limited and plastic, under the Artichoke, Strawberry and Melon; it is cut dead after 'There is pizza.'.
    'Of course.' has no music. THE TIPTOE (16.95 to 20.5): a pizzicato pendulum on A and E under the day shift that cannot leave and the night shift that cannot arrive, a cello pedal, a vibraphone note
    on 'arrive'. 'You are.' (21.46): the policy, two notes (G, E-flat, sagging) on the words. THE DOOR (22.52): a rising pizzicato tiptoe, silence on the gust (22.82), a bass drum, a timpani and a
    low string swell on the snow (23.02). 'The entrance is blocked.' (24.57): one bass clarinet note that deflates. TOMATO AGAIN (26.2): the shake, the strum on the popper (26.55) and the bar's first
    notes, the C held to the sting."""
    w1, t1, o1, l1, ar1, s1, me1, s2, m1, l2, s3, o2, door, o3, t2, en = (beats[k] for k in ("w1", "t1", "o1", "l1", "ar1", "s1", "me1", "s2", "m1", "l2", "s3", "o2", "door", "o3", "t2", "end"))
    clar = lambda m, dd: bassclar(m, dd, .8, a=.05, r=.12)
    # the TV's bed
    tv = hall(callfx(pad([53, 57, 60, 64], 1.5, .3, .4, 1300), 300, 3600), wet=.1, rt=.4) * .5
    T.put(tv, w1[0] - .1, .05, .3)
    T.put(callfx(pad([55, 59, 62, 65], 1.5, .3, .5, 1300), 300, 3600), w1[0] + 1.3, .05, .3)
    # Tomato: the bright tune, interrupted
    pop1 = cue_abs("popper", "forecast", 0) or t1[0] + .4
    T.put(sleigh(.45, 22), t1[0], .06, .2)
    chord_u(T, pop1, "C", .1, 12, .35)
    for j, m in enumerate((79, 76, 79, 81)):
        T.put(bell(midi(m + 12), .9) * .5, pop1 + j * .125, .07, .25)
        T.put(marimba(midi(m), .2), pop1 + j * .125, .07, -.1)
    T.put(bell(midi(96), .5) * .5, pop1 + .5, .06, .25)
    T.put(pizz(midi(36), .25), pop1, .16, -.1)
    T.put(pizz(midi(43), .25), pop1 + .25, .12, -.1)
    # Onion: the policy
    end = sdt(T, o1[0], .62, clar, .1, bars=(0,), tr=0, minor=True, octave=-2, pan=-.1)
    sn = cue_abs("sniffle", "forecast", 0)
    if sn:
        T.put(sob_clar(70, 62, .55, .6), sn - .05, .05, -.3)
    T.put(clar(48, 1.2), l1[0] + .05, .06, 0)
    # the hold music
    pc1, pc2 = cue_abs("phoneclick", "forecast", 0) or ar1[0] - .25, cue_abs("phoneclick", "forecast", 1) or me1[0] - .2
    hm = hold_music(T.N, pc1 + .1, me1[1] + .1)
    T.buf += hm * .8
    # the tiptoe under the day shift and the night shift
    for k in range(7):
        at = m1[0] + .05 + k * .86
        if at > s3[0] - .3:
            break
        T.put(pizz(midi((45, 52)[k % 2]), .3), at, .07, -.2 if k % 2 else .2)
    T.put(cello(33, l2[1] - m1[0] + .4, .8, a=.8, r=.6), m1[0] - .05, .06, 0)
    T.put(vib(81, 1.6, .6), l2[1] - .3, .06, .3)
    T.put(timp(55.0, 1.2), s3[1] - .3, .06, 0)
    # 'You are.'
    y, a_ = W("o2", "you"), W("o2", "are")
    T.put(clar(55, .5), y - .02, .1, -.1)
    T.put(bassclar(51, 1.0, .8, a=.05, r=.2, sag=1.2), a_ - .02, .1, -.1)
    # the door
    for k, m in enumerate((43, 45, 47, 48, 50)):
        T.put(pizz(midi(m), .2), door[0] + .03 + k * .09, .07, -.3 + .1 * k)
    dg = cue_abs("doorgust", "forecast", 0) or door[0] + .3
    sd = cue_abs("snowdump", "forecast", 0) or dg + .2
    MUTES.append((dg - .02, sd - .05, .01))
    D.put(bdrum(.8, 1.4), sd, .12, 0)
    D.put(timp(49.0, 1.6), sd + .02, .07, 0)
    T.put(strings([36, 43, 48], 1.8, .15, 1.2, 5.0, 900), sd, .06, 0)
    # 'The entrance is blocked.'
    T.put(bassclar(51, o3[1] - o3[0] + .2, .8, a=.1, r=.3, sag=1.6), o3[0] + .05, .1, -.2)
    # Tomato again
    pop2 = cue_abs("popper", "forecast", 1) or t2[0] + .35
    T.put(sleigh(.45, 22), t2[0] - .05, .06, .2)
    chord_u(T, pop2, "C", .1, 12, .35)
    for j, m in enumerate((79, 76, 79, 81)):
        T.put(bell(midi(m + 12), .9) * .5, pop2 + j * .125, .07, .25)
        T.put(marimba(midi(m), .2), pop2 + j * .125, .07, -.1)
    T.put(bell(midi(96), .9) * .5, pop2 + .5, .07, .25)
    T.put(marimba(midi(84), .6), pop2 + .5, .07, -.1)
    T.put(pizz(midi(36), .25), pop2, .16, -.1)
    T.fade(t0 + d - .3, t0 + d, 1, 0)
    D.fade(t0 + d - .3, t0 + d, 1, 0)
    INFO["forecast"] = "tv bed 1.5 to 4.1; policy (bass clarinet, 97 bpm) from 5.17; hold music %.2f to %.2f s; tiptoe 17.0 to 20.5" % (pc1 + .1 - t0, me1[1] + .1 - t0)


# ================================================================ lot: the trudge and the call-out
def cue_lot20(T, t0, d, beats, D):
    """4:30 PM, the parking lot (28.1 s): wind-led, almost no music. A FAR DRONE (a bowed A at 55 Hz and a sub under it, 3.4 s to the end, so low it is more a weight) is the plow somewhere else; A
    LONELY TRUDGING BASS (an upright, a note a second and a tenth, 8.35 to 18.7 s: C G C G B-flat F B-flat G C). TOMATO (14.56): a five-note bright flourish on a glockenspiel (G E G A C) and a
    ukulele. ONION'S FALL RISK (15.81): the policy, a bass clarinet (G E-flat D C, minor, two octaves down); THE SLIP (16.71): six falling pizzicato notes (A F D B G E); THE THUD (17.11): a bass
    clarinet C, short and low (the oof); 'Incident report.' a held E-flat that sags, and a sob on the sniffle (17.98). THE CALL-OUT (19.03 to 26.1) is a dry comic pizzicato: the ring a double pluck
    and a tick, 'I am stuck.' a bass pluck, 'Where?' one woodblock, A DITCH two notes falling (G then D, F then C the second time), WHICH DITCH? three rising (C D E), 'When will you be here?' a
    held bass, SPRING a pluck, a bell and a shake of sleigh bells. The last held bass note (26.5 s) is the lot's."""
    tu1, m1, tu2, lv, s1, l1, s2, dig, t1, o1, o2, ring, e1, s3, e2, m2, e3, s4, e4, en = (beats[k] for k in ("tu1", "m1", "tu2", "leave", "s1", "l1", "s2", "dig", "t1", "o1", "o2", "ring", "e1", "s3", "e2", "m2", "e3", "s4", "e4", "end"))
    clar = lambda m, dd: bassclar(m, dd, .8, a=.05, r=.12)
    T.put(cello(33, t0 + d - tu1[0] - .6, .7, a=2.0, r=1.5), tu1[0] - .2, .045, 0)
    T.put(sub_bass(midi(33), min(24.0, d - 3.4)), tu1[0] - .2, .06, 0)
    for k, m in enumerate((36, 43, 36, 43, 34, 41, 34, 43, 36)):
        at = lv[0] + .05 + k * 1.1
        T.put(ubass(m + 12, .95, .5), at, .1 - .004 * k, -.1)
    # Tomato's flourish
    for j, m in enumerate((79, 76, 79, 81, 84)):
        at = t1[0] + .08 + j * .2
        T.put(bell(midi(m + 12), .9) * .5, at, .08, .25)
        T.put(marimba(midi(m), .25), at, .07, -.1)
    chord_u(T, t1[0] + .08, "C", .08, 12, .35)
    # Onion falls
    sdt(T, o1[0] + .03, .45, clar, .1, bars=(1,), tr=0, minor=True, octave=-2, pan=-.2)
    sl = cue_abs("slip", "lot", 0) or o1[0] + .9
    th = cue_abs("thud", "lot", 0) or sl + .4
    for j, m in enumerate((93, 89, 86, 83, 79, 76)):
        T.put(pizz(midi(m), .18), sl + j * .055, .09, -.3)
    T.put(bassclar(36, .5, .9, a=.01, r=.2), th - .02, .1, -.3)
    T.put(bassclar(51, o2[1] - o2[0] + .1, .8, a=.1, r=.3, sag=.8), o2[0] + .02, .08, -.2)
    sn = cue_abs("sniffle", "lot", 0)
    if sn:
        T.put(sob_clar(70, 62, .5, .6), sn - .05, .05, -.3)
    # the call-out
    for q, f in enumerate((72, 79)):
        T.put(pizz(midi(f), .2), ring[0] + .05 + q * .22, .09, .3)
    D.put(woodblock(), ring[0] + .55, .04, .3)
    for k, at in enumerate((e1[0] + .02, e1[0] + .55)):
        T.put(ubass(36 + 12 * (k == 0), .4, .8), at, .12, .2)
    D.put(woodblock(), s3[0] + .02, .045, -.3)
    for lid, (m_a, m_b), g in (("e2", (55, 50), .1), ("e3", (53, 48), .1)):
        T.put(pizz(midi(m_a), .25), W(lid, "a"), g, .25)
        T.put(pizz(midi(m_b), .35), W(lid, "ditch"), g, .25)
    for j, m in enumerate((48, 50, 52)):
        T.put(pizz(midi(m), .2), m2[0] + .08 + j * .17, .09, .3)
    T.put(ubass(36, 1.2, .6), s4[0] + .1, .09, .1)
    sp = W("e4", "spring")
    T.put(pizz(midi(48), .4), sp, .12, .2)
    T.put(bell(midi(91), 1.2) * .5, sp + .22, .06, .3)
    T.put(sleigh(.7, 16), sp + .2, .04, .25)
    T.put(ubass(36, 1.8, .6), en[0] + .05, .09, 0)
    T.fade(t0 + d - .6, t0 + d, 1, 0)
    D.fade(t0 + d - .6, t0 + d, 1, 0)
    INFO["lot"] = "wind-led: far drone from 3.2 s, trudging bass 8.4 to 18.7 s, call-out pizzicato 19.0 to 26.1 s"


# ================================================================ blackout: the ten seconds and what comes after
def cue_blackout20(T, t0, d, beats, D):
    """6:12 PM, the blackout (36.9 s). NO MUSIC IN THE DARK: a very low drone (C at 65 Hz and G below it, swelling from 0.4 to 12.2 s, cut on the crank at 12.3). THE GENERATOR'S CATCH is the first bar
    (13.13 s, the transfer switch, at 100 bpm): a C major ninth on strings that swells from the catch, an upright bass walking C E G A, a brush, and a vibraphone arpeggio (C E G B); 'Within code.'
    (13.98) is the bass clarinet, two notes (G, E-flat). 'CANDLE PARTY!' (15.33): A STUMBLING PIZZICATO, one note on each candle's click (C5 15.68, E5 15.93, G5 late by 60 ms, then a tripping C B C
    figure), a woodblock out of step; 'Open flames are prohibited.' the policy (a bass clarinet, G E-flat D C); 'They are LED.' Tomato's major pizzicato; 'Approved.' a pizzicato chord and a bell, tidy.
    Mango's outlet (20.88): a pad and one electric piano chord. 'COFFEE IS NOT LIFE SAFETY.' (24.26): a flat waltz (3/4 at 100 bpm: a bass on one, a felt piano on two and three, a brush; no tune,
    no dynamics) that stops dead after 'It is to me.' BRENDA'S FLASHLIGHT (27.15): the lullaby, the tune in F on a music box and a celesta (66 bpm), under her first two lines; it stops for the two dead
    clicks (31.29, 31.74: silence); under 'It was a good flashlight.' the phrase falls home (C A G F) and the scene ends on ONE HELD NOTE (F on a cello, a celesta over it), the sting's chord after it."""
    lo, o1, b1, s1, b2, cnt, l1, gen, o1b, t1, o3, t2, o4, m1, s2, o2, s3, br1, br2, br3, en = (beats[k] for k in ("lightsout", "o1", "b1", "s1", "b2", "count", "l1", "gen", "o1b", "t1", "o3", "t2", "o4", "m1", "s2", "o2", "s3", "br1", "br2", "br3", "end"))
    clar = lambda m, dd: bassclar(m, dd, .8, a=.05, r=.12)
    crank = gen[0] - .03
    T.put(sub_bass(midi(36), crank - lo[0] - .4), lo[0] + .3, .06, 0)
    T.put(sub_bass(midi(31), crank - lo[0] - .4) * .7, lo[0] + .3, .05, 0)
    T.fade(lo[0] + 8.0, crank, 1.0, 1.7)
    T.gate(crank, crank + 1.0, 0.0, .06)
    # the first bar
    rl = cue_abs("relay", "blackout", 3) or gen[0] + .8
    bl = .6
    T.put(strings([36, 43, 48, 52, 55, 59, 62], 2.6, .45, 1.0, 5.0, 1800), rl - .2, .075, 0)
    for k, m in enumerate((36, 40, 43, 45)):
        T.put(ubass(m + 12, bl * .9, .7), rl + k * bl, .15, -.1)
    for k in (1, 3):
        D.put(brush(.25), rl + k * bl, .045, .2)
    for k, m in enumerate((72, 76, 79, 83)):
        T.put(vib(m, 1.2, .6), rl + k * bl * .5, .05, .1 + .1 * k)
    T.put(bassclar(55, .6, .8, a=.05, r=.1), o1b[0] + .05, .09, -.1)
    T.put(bassclar(51, .9, .8, a=.05, r=.2, sag=.8), o1b[0] + .55, .09, -.1)
    # the candles: a stumble
    cc = [cue_abs("candleclick", "blackout", k) for k in range(3)]
    D.put(woodblock(), t1[0] + .04, .03, .3)
    D.put(woodblock(), t1[0] + .3, .025, -.3)
    for k, (m, late) in enumerate(((72, 0.0), (76, 0.0), (79, .06))):
        if cc[k]:
            T.put(pizz(midi(m), .2), cc[k] + late, .11, .2 + .1 * k)
    if cc[2]:
        for j, m in enumerate((72, 71, 72)):
            T.put(pizz(midi(m), .12), cc[2] + .22 + j * .09, .08, .3)
    sdt(T, o3[0] + .05, .5, clar, .1, bars=(1,), tr=0, minor=True, octave=-2, pan=-.1)
    tomato20(T, t2[0] + .08, .09)
    chord_u(T, o4[0] + .15, "C", .09, 12, .3)
    T.put(bell(midi(96), 1.0) * .5, o4[0] + .18, .06, .3)
    # Mango's outlet
    T.put(pad([48, 55, 59, 64], m1[1] - m1[0], .8, .8, 1100), m1[0], .035)
    T.put(epiano(midi(60), 2.4, .5), m1[0] + .15, .035, .1)
    # the flat waltz
    wb = .6
    w0 = o2[0]
    w_end = s3[1] + .02
    for k in range(int((w_end - w0) / wb)):
        at = w0 + k * wb
        bar, beat = divmod(k, 3)
        if beat == 0:
            T.put(ubass((36, 41)[bar % 2] + 12, wb * 1.4, .6), at, .13, -.1)
        else:
            for q, m in enumerate(CHORDS["Cm" if bar % 2 == 0 else "Fm"]):
                T.put(felt(m, wb * .8, .45), at + .012 * q, .04, .05 + .06 * q)
            D.put(brush(.2), at, .03, .2)
    T.gate(w_end, br1[0], 0.0, .02)
    # Brenda's flashlight: the lullaby
    ck = [cue_abs("clickdead", "blackout", k) for k in range(2)]
    fl = cue_abs("flashlight", "blackout", 1) or br1[0] - .25
    lb = .9
    stop = (ck[0] - .12) if ck[0] else br2[1] - 1.0
    for j, (b, m, du) in enumerate(SDT):
        if b >= 8:
            continue
        at = fl + .12 + b * lb
        if at > stop:
            continue
        T.put(music_box(midi(m + 5), min(du * lb * 2 + .4, 1.6)), at, .05, .25)
        T.put(celesta(m + 5 - 12, du * lb + .5, .5), at, .035, .1)
    T.put(strings([41, 48, 53, 57, 60], stop - fl + .3, .8, .9, 4.8, 1400), fl, .035)
    T.gate(stop, br3[0] - .25, 0.0, .1)
    pre = br3[0] - .12
    T.put(strings([41, 48, 53, 57, 60, 64], d - pre - .9, .9, 1.4, 4.8, 1500), pre, .05)
    for k, (m, off) in enumerate(((84, 0.0), (81, 1.0), (79, 1.5), (77, 2.0))):
        T.put(music_box(midi(m), 1.6), br3[0] + off, .06, .3)
    held = br3[1] + .25
    T.put(cello(41, t0 + d - held - .3, .9, a=.5, r=.6), held, .1, 0)
    T.put(celesta(89, 3.0, .6), held + .05, .04, .3)
    T.fade(t0 + d - .9, t0 + d, 1, 0)
    D.fade(t0 + d - .9, t0 + d, 1, 0)
    INFO["blackout"] = "no music 0.2 to 12.3 s but a sub drone; first bar at the transfer switch %.2f s; flat waltz %.2f to %.2f s; lullaby stops %.2f s" % (rl - t0, w0 - t0, w_end - t0, stop - t0)


# ================================================================ dayroom: a lullaby by candlelight
def cue_dayroom20(T, t0, d, beats, D):
    """8:40 PM, the day room (20.9 s): A CANDLELIT LULLABY. The snow-day tune slowed and softened (F, 57 bpm), four bars from 0.2 s to the Moon (17.0 s): a celesta on the tune with a music box an octave
    over it, soft strings that swell on each bar's chord (F, F, B-flat, C), a felt bass note on each bar and one tiny shake of sleigh bells at its start; nothing is flat, nothing is loud. 'Water.' (go2)
    is a single high celesta drop. The plow's amber light (15.55 to 16.95) is a slow swell of strings that rises over the last bar and is gone when the Moon speaks. THE MOON (17.0 to 19.1) is left almost
    alone: one high harmonic (F6) over the weather, no pad."""
    go2, pl, mo1, en = (beats[k] for k in ("go2", "plowlight", "mo1", "end"))
    bl = 1.05
    a = t0 + .2
    for j, (b, m, du) in enumerate(SDT):
        at = a + b * bl
        if at > mo1[0] - .1:
            continue
        T.put(celesta(m + 5 - 12, du * bl * 1.3 + .4, .55), at, .06, .15)
        T.put(music_box(midi(m + 5), min(du * bl * 1.5 + .3, 1.5)) * .5, at + .004, .03, .3)
    for bar, (ch, rt) in enumerate((("F", 29), ("F", 29), ("B", 34), ("C", 36))):
        at = a + bar * 4 * bl
        if at > mo1[0] - .6:
            break
        vs = {"F": (41, 48, 53, 57, 60), "B": (46, 53, 58, 62, 65), "C": (48, 55, 60, 64, 67)}[ch]
        T.put(strings(list(vs), 4 * bl + .5, .9, 1.2, 4.8, 1400), at, .045, 0)
        T.put(felt(rt + 12, 4 * bl * .9, .5), at, .07, -.1)
        T.put(sleigh(.5, 10, 3400, 8000), at, .02, .3)
    T.put(celesta(101, 1.6, .6), W("go2", "water") + .12, .045, .3)
    T.put(strings([41, 48, 53, 57, 60, 64, 67, 72], pl[1] - pl[0] + .4, 1.0, .6, 5.0, 1700), pl[0] - .1, .05, 0)
    T.gate(mo1[0] - .05, mo1[0] + .02, 0.0, .03)
    T.fade(mo1[0] - .6, mo1[0] - .05, 1.0, .2)
    T.put(glass(89, 2.4, .8, 1.2), mo1[0] + .1, .03, .2)
    T.fade(t0 + d - .8, t0 + d, 1, 0)
    D.fade(t0 + d - .8, t0 + d, 1, 0)
    INFO["dayroom"] = "lullaby in F at 57 bpm from 0.2 s; amber swell 15.45 to 17.0; the Moon alone from 17.0 s"


# ================================================================ night: the report, the lapse, the dawn
def lapse_ostinato(T, D, a, b):
    """The time-lapse's engine: a rising ostinato of vibraphone and glockenspiel notes whose RATE FOLLOWS THE PICTURE'S SPEED (from 1.6 notes a second at real time to about 12.6 at the top speed, the
    phase of the pattern integrated at 200 Hz so a note falls whenever the pattern turns over), climbing the D minor pentatonic across three octaves as the lapse goes on (D F G A C), louder as it
    speeds up, and a last G on the glockenspiel at the end (the first note of the day). Returns the number of notes."""
    pent = (0, 3, 5, 7, 10)
    dt = 1 / 200.0
    t = a
    ph = 0.0
    n = 0
    while t < b:
        u = float(lapse_u(t))
        ph += (1.6 + 11.0 * u) * dt
        if ph >= 1.0:
            ph -= 1.0
            prog = (t - a) / (b - a)
            idx = (n % 5) + 5 * int(min(2, prog * 2.4 + (n // 5 % 2) * .3))
            m = 62 + pent[idx % 5] + 12 * (idx // 5) + (0 if prog < .8 else 0)
            g = .03 + .045 * u
            if m < 86:
                T.put(vib(m, .5, .55 + .3 * u), t, g, -.25 + .5 * ((n % 7) / 6.0))
            else:
                T.put(bell(midi(m), .5) * .5, t, g * .8, .2)
            if n % 3 == 0:
                T.put(bell(midi(m + 12), .6) * .4, t + .01, g * .5, .3)
            n += 1
        t += dt
    T.put(bell(midi(91), 1.6) * .6, b, .07, .2)
    return n


def cue_night20(T, t0, d, beats, D):
    """10:59 PM, the long night (34.4 s). THE REPORT: a felt piano that says as little as it can (a low D at 0.2 s; 'I am the oncoming nurse.' one A; then one chord a line for the twin shot, each a few
    notes rolled slowly: D minor ninth on 'Report.', B-flat major seventh on 'Any concerns?', G minor seventh on 'I am tired.', A seventh on 'Noted.') over a cello's D; the wait (3.3 to 4.8 s) is
    nothing but the clock and the wind. THE LAPSE (10.65 to 18.65): lapse_ostinato (a vibraphone and glockenspiel pattern whose rate follows the picture's world speed), a string that rises from D to D an
    octave up (and a fifth above it) over the eight seconds and a held high shimmer (D7 on glass); at 18.65 the last glockenspiel note is G, the first of the day. THE MOON (18.70): the title's key, G
    major: a warm pad of strings and a soft low pad under him, a bell on 'Seven.', three falling bells on his first line (G D B), a rising G major arpeggio on 'Okay.'. THE DAWN (25.69): the chord opens
    (G D G B D F-sharp A D on strings, a horn on G, a celesta cascade up the G major scale, a shimmer of sleigh bells, a glass harmonic). The callbacks (27.74 to 32.0) are almost unscored: the held
    G and, under 'blocked', one bass clarinet note that sags. The sting (32.5 s) is the sfx's."""
    op, s1, wait, s2, s3, s4, s5, s6, lap, mo1, s7, mo2, s8, mo3, s9, dawn, tu3, o5, s10, en = (beats[k] for k in ("open", "s1", "wait", "s2", "s3", "s4", "s5", "s6", "lapse", "mo1", "s7", "mo2", "s8", "mo3", "s9", "dawn", "tu3", "o5", "s10", "end"))
    # the report
    T.put(felt(38, 3.2, .5), op[0], .08, -.1)
    T.put(celesta(81, 1.6, .5), op[0] + .8, .025, .2)
    T.put(felt(57, 1.5, .5), W("s2", "oncoming"), .05, .05)
    chords = ((s3, (38, 45, 53, 60, 64)), (s4, (34, 41, 45, 50)), (s5, (31, 38, 41, 46)), (s6, (33, 40, 43, 49)))
    for (bt, vs) in chords:
        for q, m in enumerate(vs):
            T.put(felt(m, 2.0, .5), bt[0] + .02 + .09 * q, .06 - .004 * q, -.2 + .1 * q)
    T.put(cello(38, s6[1] - s3[0] + .5, .9, a=.8, r=.5), s3[0] - .1, .05, 0)
    # the lapse
    a, b = lap
    n = lapse_ostinato(T, D, a, b)
    T.put(rising(50, 62, b - a + .2), a, .05, -.2)
    T.put(rising(57, 69, b - a + .2) * .8, a, .04, .25)
    T.put(glass(98, b - a + 1.0, 2.5, 1.2), a, .022, .1)
    T.put(sub_bass(midi(26), b - a) * .5, a, .04, 0)
    # the Moon
    mo = mo1[0] - .25
    pad_len = s9[1] + .8 - mo
    T.put(strings([43, 50, 55, 59, 62], pad_len, 1.0, 1.4, 4.8, 1500), mo, .08, 0)
    T.put(pad([43, 50, 55, 59, 62], pad_len, 1.2, 1.6, 1100), mo, .05, 0)
    T.put(sub_bass(midi(31), min(4.0, pad_len)) * .6, mo + .1, .04, 0)
    for k, m in enumerate((91, 86, 83)):
        T.put(bell(midi(m), 1.4) * .6, mo1[0] + .05 + k * .32, .055, .3 - .15 * k)
    T.put(bell(midi(91), 1.6) * .6, W("mo2", "seven") + .03, .05, .3)
    for k, m in enumerate((55, 59, 62, 67, 71)):
        T.put(felt(m, 1.6, .5), s9[0] + .02 + k * .1, .05, -.2 + .1 * k)
    # the dawn
    dw = dawn[0]
    T.put(strings([43, 50, 55, 59, 62, 66, 69, 74], dawn[1] - dw + 2.4, 1.1, 1.5, 4.8, 2600), dw, .1, 0)
    T.put(horn(55, 2.6, .6, a=.2, r=.9), dw + .1, .07, .1)
    for k, m in enumerate((79, 83, 86, 91, 95, 98)):
        T.put(celesta(m, 1.8, .6), dw + .1 + .13 * k, .05, -.3 + .12 * k)
    T.put(sleigh(1.6, 28, 3400, 8800), dw + .2, .05, .1)
    T.put(glass(91, 3.0, .6, 1.4), dw + .2, .035, .2)
    # the callbacks
    T.put(bassclar(43, 1.4, .8, a=.1, r=.4, sag=1.5), W("o5", "blocked") - .1, .08, -.1)
    T.fade(t0 + d - 1.4, t0 + d, 1, 0)
    D.fade(t0 + d - 1.4, t0 + d, 1, 0)
    INFO["night"] = "lapse ostinato: %d notes (rate 1.6 + 11 u a second, u from %s); Moon pad G major from 18.45; dawn chord 25.69" % (n, "lapse.json" if (LAPSE is not None and not getattr(LAPSE, "fixed", True)) else "the fixed curve")


# ================================================================ the cue table, levels and the score
CUES = {"title": cue_title20, "forecast": cue_forecast20, "lot": cue_lot20, "blackout": cue_blackout20, "dayroom": cue_dayroom20, "night": cue_night20, "end": cue_end20}
LEVEL20 = {"title": 1.6, "forecast": 2.0, "lot": 1.7, "blackout": 1.9, "dayroom": 2.2, "night": 2.1, "end": 1.7}
TAIL20 = {"title": .5, "forecast": .4, "lot": .4, "blackout": .5, "dayroom": .5, "night": .6, "end": .3}
DIP20 = {"title": 1.0, "forecast": .62, "lot": .6, "blackout": .6, "dayroom": .7, "night": .7, "end": 1.0}
REVERB20 = {"title": (.4, 1.0), "forecast": (.25, .8), "lot": (.06, .5), "blackout": (.3, 1.0), "dayroom": (.45, 1.6), "night": (.35, 1.2), "end": (.4, 1.4)}
DIPS20 = {"stamp": (4, .3, .3), "textding": (3, .2, .2), "powerdown": (8, 1.2, .6), "genstart": (6, 1.5, .5), "relay": (3, .2, .2), "doorgust": (5, .8, .4), "snowdump": (4, .6, .4),
          "plowdump": (4, .4, .3), "plowscrape": (3, .5, .3), "popper": (3, .2, .15), "boardflip": (3, .3, .2), "thud": (3, .3, .2), "slip": (3, .2, .2), "lowbattery": (4, .6, .3),
          "phonering": (3, .4, .2), "lapsewhoosh": (4, .5, .4), "binderpop": (2, .2, .2), "stopwatchticks": (3, 1.0, .5), "globeshake": (2, .4, .3), "tvjingle": (3, .8, .3)}


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
        wet, rt = REVERB20.get(sc["id"], (.3, 1.0))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL20.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP20.get(sc["id"], .6)
        dips = DIPCACHE.setdefault(key, None)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        out[:, a:b] += seg * LEVEL20.get(sc["id"], 1.0) * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS20)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
