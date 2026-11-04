"""Episode 19 score: THE POTLUCK. Warm, domestic, a little deadpan: a slow-cooker lullaby, a march of mandatory fun, a cooking-show jazz, one waltz that is passed from hand to hand, the microwave's
groove, a hymn.

build_audio19 (a fresh copy of build_audio18's wrapper) calls score(script, scenes, lines, N) through --music build_music19; the mixer ducks the bed under every voice (and so does this file:
_speech_dip). Instruments and helpers come from build_music6 to build_music16 (the series' orchestra); the shape of the score is Episode 15 to 18's: every scene is rendered on two tracks (U through
the room's reverb, D dry), muted spans are applied after the reverb. New here: a felt piano, an accordion, a plucked ukulele line and a tempo map (the baton).

MOTIFS AND SCENES
  MERGE THEME   in B-flat major in the title, a slow-cooker lullaby at 80 bpm (the arpeggio rocks on a felt piano and a music box, 0.2 to 3.2 s; the lid's second rattle is the downbeat of the
                landing; the tune's first notes D C B-flat; the last chord B-flat major seventh, held under the text ding) and in E-flat major on the end card (61.5 bpm: the arpeggio runs for one
                long bar and the STAMP is the downbeat on which an E-flat major seventh lands and is held, the tune G F and then D, the seventh, unresolved).
  SIGN-UP       'mandatory fun': a bouncy ukulele-and-glockenspiel march (C major, 120 bpm) that a deadpan bassoon keeps trying to slow down; the baskets are pizzicato pops (the eight at the
                table a rising scale); the dedupe is a rewind swoosh and a tuba walking down a scale on the six poofs; Binder's jingle (C D E G) bounces under his offer and curdles.
  KITCHEN       a cooking-show jazz (F major, 97 bpm swing: an upright bass, brushes, a clarinet) with a mechanical conveyor ostinato on the texture line (triplet eighths of 0.2 s from 10.076 s that
                get smoother at each station), a sad trombone on 'beige turkey', the viscosity (marimba, then clarinet, then tuba on Nectar, Honey, Pudding), a rising blender crescendo on the pie
                and a flat waltz on 'It is beige.'
  PLATE         THE BATON: one waltz melody in D major, in 3/4 at a walking pace, that never stops from 1.3 to 21.3 s and changes instrument on the first word of each hand-off (Mango pizzicato,
                Lemon a dry oboe, Tomato a ukulele, Onion a clarinet that sobs on her sniffle, Pear an accordion, Binder a marimba, Strawberry a lone cello). The tempo bends so that each hand-off
                lands on a beat.
  BREAKROOM     the microwave's three beeps are the tempo (build_audio19's mw_grid: 85 bpm, bent by 1 percent so the timer's ding is a downbeat): a muted upright bass, brushes, a Rhodes and a
                woodblock for the queue's steps in A minor; the ding is the one hit; a hush for Brenda, her own six notes (C G F E D C, Episode 13) on a solo cello under 'It was a good year.'
  THANKS        a simple hymn in A major on a felt piano and soft strings; the sit beat is one held chord (D major, with a ninth) and a music-box note; the call chime (A5, E5) resolves the chord to
                A major instead of cutting it; a warm pad under the Moon, and the Moon's four falling bells.
"""
import os

import numpy as np

from build_audio import SR, tarr, ar, lp, bp, midi
from build_music6 import Track, hall, pizz, marimba, bell, sub_bass, pad, strings, brass, hat, timp, roll, riser, epiano, pluck, MUSIC_GAIN
from build_music7 import woodblock, slide_brass, music_box
import build_music10 as M10
from build_music10 import tuba, mtrumpet, clarinet, oboe, brush, cue_dips, ride, _fit_rms, _fit_peak
from build_music9 import uke
from build_music13 import _mute, _speech_dip, glass, revcym, sub_swell, ubass, kick13, cello, vib
from build_music14 import horn, celesta, xylo, bassoon, bdrum
from build_music15 import sob_clar, bounce, comp, binder_bed, BJ, BJ_MINOR, TP_MAJ, TP_MIN, MT_ARP, CHORDS, W

MUTES = []
R19 = np.random.default_rng(2719)


# ================================================================ the microwave's clock (shared with build_audio19)
def _cue_local(scene, script, name, k=0):
    """Scene-local time of the k-th cue called `name` in this scene of the script, or None."""
    sc = next((s for s in script["scenes"] if s["id"] == scene["id"]), None)
    n = 0
    for b in (sc or {"beats": []})["beats"]:
        for c in b.get("sfx", []):
            if c[0] == name:
                if n == k:
                    bt = scene["beats"][b["id"]]
                    return bt["e"] if c[1] == "end" else bt["s"] + c[1]
                n += 1
    return None


def mw_grid(scene, script):
    """The break room's clock. The microwave's first beep (0.3 s) is the downbeat of bar 0; the beeps are eighth notes (0.35 s: 85.7 bpm), and the grid is bent by about one percent so that a
    whole number of bars (5 bars, 40 eighths) ends exactly on the timer's ding (14.429 s), which is therefore a downbeat. Everything in the scene that has a rhythm (the bass, the brushes, the
    Rhodes, the woodblock of the queue's steps) is on this grid. Times are scene-local."""
    if not scene:
        return None
    o = _cue_local(scene, script, "mwbeep", 0)
    ding = _cue_local(scene, script, "timerding", 0)
    if o is None or ding is None:
        return None
    n = max(8, int(round((ding - o) / .35 / 8)) * 8)
    e = (ding - o) / n
    return {"origin": o, "eighth": e, "bpm": 60.0 / (2 * e), "bar": 8 * e, "ding": ding, "ding_bar": n // 8, "n_eighths": n}


# ================================================================ new instruments
def felt(m, d=1.2, vel=.6):
    """A felt-damped upright piano: soft hammers (a slow 6 ms attack, the upper partials weak and short), a warm closed-off tone, a muffled thud of felt, long on the low strings."""
    f = midi(m)
    t = tarr(d)
    tau0 = 2.6 if f < 200 else 1.8 if f < 500 else 1.1
    x = np.zeros(len(t))
    for k, a in enumerate((1.0, .5, .26, .14, .08, .05, .03), 1):
        fk = f * k * np.sqrt(1 + .0003 * k * k)
        if fk > 6000:
            break
        for det in (1.0, 1.0006):
            x += a * np.sin(2 * np.pi * fk * det * t + k) * np.exp(-t / (tau0 / (k ** .55))) / 2
    x = lp(x, 2200 + 900 * vel, 2)
    thud = lp(R19.uniform(-1, 1, len(t)), 320) * np.exp(-t / .02) * .12 * max(x.max(), .1)
    return _fit_peak((x + thud) * ar(d, .006, min(.3, d * .5)), 1.0) * (.35 + .65 * vel)


def accordion(m, d=.5, vel=.8, a=.025, r=.07):
    """An accordion: three reeds a few cents apart (the musette's shimmer), every harmonic of the reed (odd and even) through a mild low-pass, the bellows' breath on the attack and a very slow
    pulse in the level."""
    t = tarr(d)
    f = midi(m)
    x = np.zeros(len(t))
    for det in (-.0075, 0.0, .0075):
        ph = 2 * np.pi * f * (1 + det) * t
        x += sum(g * np.sin(k * ph + .4 * k) for k, g in ((1, 1.0), (2, .62), (3, .5), (4, .3), (5, .22), (6, .12), (7, .08)))
    x = lp(x, 3300, 2) + bp(R19.uniform(-1, 1, len(t)), 700, 3000) * np.exp(-t / .05) * .06
    return _fit_rms(x * ar(d, a, min(r, d * .45)) * (1 + .03 * np.sin(2 * np.pi * 5.3 * t)), .25) * (.45 + .55 * vel)


def ukenote(m, d=.4, vel=.8):
    """A single plucked ukulele string: a short triangle pluck (bright at the strike, closing in 60 ms) with the soft nylon body under it."""
    return pluck(midi(m), d, 3400, .13, "tri") * (.5 + .5 * vel)


def sad_trombone(T, at, notes, g=.1, pan=.1):
    """The sad trombone: 'wah, wah, wah, waaah': notes is [(midi, seconds)], each a muted trombone slide (a saw through a closing filter), the last one bends down and wobbles."""
    t = at
    for j, (m, dd) in enumerate(notes):
        last = j == len(notes) - 1
        T.put(slide_brass(m + (0 if not last else .3), m - (0 if not last else 1.6), dd, 900 if not last else 700) * 1.3, t, g, pan)
        t += dd + (.03 if not last else 0)


# ================================================================ context: the cue table (absolute times of the script's cues)
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


# ================================================================ title and end: the Merge theme, a lullaby in B-flat and a long bar in E-flat
TR_TITLE, TR_END = -2, 3
BL_TITLE, BL_END = .75, .975        # a beat of the theme: the title's bar is 3.0 s (0.2 to 3.2: the landing is the lid's second rattle), the end card's 3.9 s (0.1 to 4.0: the stamp)


def lullaby_bar(T, D, t0, tr, bl, felt_g=.1, lowbell=True):
    """Bar 1 of the Merge theme as a lullaby: the arpeggio in eighths on a felt piano (an octave under the series' marimba) with a music box above it, a warm pad that breathes, an upright
    bass on 1 and 3 and a brush that swishes on 2 and 4; the last beat is the subdominant."""
    st = bl / 2
    for i, m in enumerate(MT_ARP):
        lv = (.55 + .45 * i / 7)
        n = m + tr
        T.put(felt(n - 12, 1.0, .5), t0 + i * st, felt_g * lv, -.2 + .05 * i)
        if lowbell:
            T.put(music_box(midi(n + 12), 1.0) * .5, t0 + i * st + .004, .035 * lv, .3)
    root = 36 + tr + 12
    for k, (r_, g) in enumerate(((0, .16), (7, .12))):
        T.put(ubass(root + r_, bl * 1.6, .6), t0 + 2 * k * bl, g, -.1)
    T.put(pad([48 + tr, 52 + tr, 55 + tr, 60 + tr], 3 * bl, .6, .4, 1400), t0, .085)
    T.put(pad([53 + tr, 57 + tr, 60 + tr, 65 + tr], bl + .1, .15, .3, 1500), t0 + 3 * bl, .085)
    for k in (1, 3):
        D.put(brush(.3), t0 + k * bl, .05, .2)


def cue_title19(T, t0, d, beats, D):
    """The slow cooker (6.8 s). 0.2 to 3.2: the Merge theme's arpeggio as a lullaby in B-flat major at 80 bpm (felt piano, music box, a pad that breathes, an upright bass; see lullaby_bar). The
    slow cooker's lid is the percussion: a brush on the beats and the first rattle (1.2 s) a third of a beat after the second beat; the second rattle (3.2 s) is the downbeat of the landing, a soft
    B-flat added-ninth chord (strings, a horn, a soft timpani). The tune (3.2 to 5.45: D for a beat and a half, C, B-flat) on a warm clarinet and a felt piano over the chords. At 5.45, under the text
    ding (5.4, B-flat and F), the last chord: B-flat major seventh (B-flat F A D, strings, a horn, a celesta on the A) held to the cut."""
    a = t0 + .2
    land = a + 4 * BL_TITLE
    lullaby_bar(T, D, a, TR_TITLE, BL_TITLE)
    T.put(riser(2.6, 500, 4200, .3), a + .3, .02, 0)
    for at, g in ((1.2, .5), (3.2, 1.0)):                       # the lid's own downbeats get a soft tick of a brush
        D.put(brush(.2), t0 + at - .01, .03 * g, -.1)
    ch = [46, 50, 53, 58, 62]                                   # B-flat add9: B-flat D F B-flat C... (the ninth, C, on top)
    T.put(strings(ch + [72], 2.4, .12, 1.2, 5.0, 2200), land, .1, 0)
    T.put(horn(53, 1.6, .55, a=.08, r=.7), land, .06, .1)
    D.put(timp(58.3, 1.0), land, .07, 0)
    tune = ((0, 74, 1.5), (1.5, 72, .5), (2, 70, 1))            # D5 C5 B-flat4: the tune's first notes in B-flat
    for off, m, dd in tune:
        at = land + off * BL_TITLE
        T.put(clarinet(m, dd * BL_TITLE * .95, a=.05, r=.1), at, .075, .15)
        T.put(felt(m - 12, 1.2, .55), at, .07, -.1)
    for k, m in enumerate((46, 53, 46)):
        T.put(ubass(m, .5, .6), land + k * 1.5 * BL_TITLE, .14, -.1)
    T.put(pad([53, 57, 60, 65], 1.0, .3, .3, 1400), land + 1.5 * BL_TITLE, .05)
    fin = t0 + 5.45
    ch7 = [46, 53, 57, 62, 65]                                  # B-flat major seventh: B-flat F A D (and F)
    T.put(strings(ch7 + [69, 74], 1.9, .12, .9, 5.0, 2600), fin, .13, 0)             # B-flat F A D F A D: the third (D) and the seventh (A) are in it twice
    T.put(horn(62, 1.6, .55, a=.08, r=.6), fin, .06, .1)                           # the horn plays the third
    T.put(felt(58, 2.0, .5), fin, .08, -.1)
    T.put(felt(65, 2.0, .45), fin + .02, .06, 0)
    T.put(felt(69, 2.0, .45), fin + .04, .06, .1)
    T.put(felt(74, 2.0, .45), fin + .05, .05, .15)
    T.put(celesta(81, 1.6, .6), fin + .06, .05, .3)               # A6 on top: the seventh
    T.put(ubass(46, 1.4, .6), fin, .15, -.1)
    D.put(timp(58.3, 1.2), fin, .09, 0)
    T.fade(t0 + d - .8, t0 + d, 1, 0)
    D.fade(t0 + d - .8, t0 + d, 1, 0)


def cue_end19(T, t0, d, beats, D):
    """The end card (7.5 s). The Merge theme in E-flat major, slow (61.5 bpm): the arpeggio is one long bar (0.1 to 4.0 s, a felt piano and a music box over a pad and an upright bass) and the
    STAMP (4.0 s) is the downbeat on which the chord arrives: E-flat major seventh (E-flat B-flat D G), strings, a horn, a soft timpani and a bass drum with the stamp, the tune G, F over it
    and then D, the major seventh, held. It is not resolved and it fades away by 7.2 s. The text ding (5.1 s) is E-flat and B-flat, inside the chord."""
    a = t0 + .1
    land = a + 4 * BL_END
    lullaby_bar(T, D, a, TR_END, BL_END, felt_g=.095)
    for k in range(6):                                          # six rows are typed in (1.1 to 3.4 s): the quietest woodblock taps
        D.put(woodblock(), t0 + 1.3 + k * .4, .012, .3 if k % 2 else -.3)
    chm = [39, 46, 50, 55, 58, 62]                               # E-flat major seventh: E-flat B-flat D G B-flat D
    T.put(strings(chm + [67, 74], 3.4, .08, 1.7, 5.0, 2400), land, .14, 0)
    T.put(horn(55, 2.8, .6, a=.08, r=1.0), land, .08, .1)
    T.put(brass([51, 58, 62, 67], 1.6, .04, .8, 1500), land, .045, 0)
    T.put(pad([51, 55, 58, 62], 3.0, .4, 1.4, 1300), land + .1, .06)                     # E-flat G B-flat D: the body of the chord that is held
    D.put(timp(77.8, 1.4), land, .09, 0)
    D.put(bdrum(.7, .8), land, .09, 0)
    for off, m, dd in ((0, 79, 1.5), (1.5, 77, .5), (2, 74, 2.4)):         # G5, F5 and then D5 (the major seventh, unresolved)
        at = land + off * BL_END
        last = off == 2
        T.put(clarinet(m, dd * BL_END * .95 if not last else 1.5, a=.06, r=.2), at, .07 if not last else .045, .15)
        T.put(felt(m - 12, 2.2 if dd > 1 else 1.0, .55), at, .075 if not last else .05, -.1)
        T.put(celesta(m + 12, 1.4, .5), at, .035, .3)
    T.put(felt(63, 3.0, .5), land + .02, .08, -.1)
    T.put(ubass(39, 2.2, .6), land, .15, -.1)
    T.put(celesta(86, 2.0, .6), land + 1.6 * BL_END, .04, .3)
    T.fade(t0 + 6.2, t0 + 7.3, 1, 0)
    D.fade(t0 + 6.2, t0 + 7.3, 1, 0)


# ================================================================ signup: mandatory fun
SU_BL = .5                       # 120 bpm: the march
SU_CH = (("C", 36), ("C", 36), ("F", 41), ("C", 36))          # chord and bass root per bar of the tune
SU_TUNE = ((0, 0, 72, 1), (0, 1, 72, 1), (0, 2, 74, 1), (0, 3, 76, 1),                # C C D E
           (1, 0, 76, 2), (1, 2, 74, 1), (1, 3, 72, 1),                                # E (two beats) D C
           (2, 0, 79, 1), (2, 1, 79, 1), (2, 2, 81, 1), (2, 3, 79, 1),                # G G A G
           (3, 0, 76, 3))                                                              # E (three beats)


def march19(T, D, a, b, lvl=1.0, tune_until=None, bl=SU_BL):
    """The sign-up's march from a to b (a = the downbeat, 120 bpm, C major): an upright bass on 1 and 3 (root, then fifth), a ukulele chop on every off-beat, a woodblock on 2 and 4, a hat, and
    the tune (C C D E / E D C / G G A G / E, four bars) on a glockenspiel and a marimba, over and over. `tune_until`: the glockenspiel stops there."""
    nb = int((b - a) / bl) + 1
    for k in range(nb):
        at = a + k * bl
        if at >= b - .02:
            break
        bar, beat = divmod(k, 4)
        ch, rt = SU_CH[bar % 4]
        T.put(ubass(rt + 12 + (0 if beat in (0, 1) else 7), .4, .75), at, .15 * lvl, -.1) if beat in (0, 2) else None
        comp(T, at + bl / 2, list(CHORDS[ch]), .3, .055 * lvl, .35)
        if beat in (1, 3):
            D.put(woodblock(), at, .03 * lvl, .3)
        D.put(hat(), at + bl / 2, .025 * lvl, -.2)
    for i in range(0, 8):
        for bar, beat, m, dd in SU_TUNE:
            at = a + ((i * 4 + bar) * 4 + beat) * bl
            if at >= b - .05 or (tune_until is not None and at > tune_until):
                continue
            du = dd * bl * (.9 if dd < 2 else .95)
            T.put(bell(midi(m + 12), min(du + .3, 1.0)) * .5, at, .075 * lvl, .25)
            T.put(marimba(midi(m), min(du, .5)), at, .075 * lvl, -.1)


def slowing_beats(a, b, bl0=.5, bl1=.85, ramp=4.0):
    """Beat times from a to b whose length grows from bl0 to bl1 over `ramp` seconds (a march that is being talked down)."""
    out, t = [], a
    while t < b - .02:
        out.append(t)
        u = np.clip((t - a) / ramp, 0, 1)
        t += bl0 + (bl1 - bl0) * (u * u * (3 - 2 * u))
    return out


def cue_signup19(T, t0, d, beats, D):
    """3:15 PM, the sign-up (25.7 s). MANDATORY FUN (1.2 to 9.2): a march in C major at 120 bpm (an upright bass, a ukulele on the off-beats, a woodblock, a glockenspiel and a marimba on the
    tune: C C D E / E D C / G G A G / E) that starts on 'Potluck!' (1.2 s). A DEADPAN BASSOON keeps trying to slow it down: after each 'Rolls.' (4.48, 6.40, 8.14) it sags a semitone and the band
    takes no notice. The baskets are pizzicato pops (4.31, 6.23, 7.97: C, E, G) and the eight at the table (8.339 + 0.15 k) a rising scale on a pizzicato, C5 to C6. Then the march is talked down
    (9.2 to 14.75): the beats stretch from 120 to 70 bpm, the glockenspiel drops out, the bassoon takes the bass, and Onion's two sniffles (11.79, 14.02) are a clarinet sob. Binder's jingle
    (C D E G) bounces in on his offer (14.6) over a bright bed; 'No.' (17.21) is a hole; on 'Great! I'll help.' (17.76) the jingle curdles (C D E-flat G-flat, slow, a drone on D). THE DEDUPE
    (18.70): a reversed cymbal that is the rewind, and a tuba that walks down G F E D C G on the six poofs; 'Rolls: one!' a muted trumpet's two-note fanfare; 'That is not a potluck.' one
    bassoon note that sags; 'Efficiency.' the band's last stab (a brass chord, a ukulele strum, a glockenspiel) before the sting (24.39, the sfx's)."""
    o1, m2, o2, b1, s2, b2, ddp, b3, l2, t5, en = (beats[k] for k in ("o1", "m2", "o2", "b1", "s2", "b2", "dedupe", "b3", "l2", "t5", "end"))
    tb = beats["table"]
    G0 = t0 + 1.2
    # the opening: a two-beat pickup (0.2 to 1.2) of woodblocks and a bell, then the march
    for k in range(4):
        D.put(woodblock(), t0 + .2 + k * .25, .03 + .01 * k, -.2 + .1 * k)
    T.put(bell(midi(84), 1.0) * .5, G0 - .02, .06, .2)
    march19(T, D, G0, t0 + 9.2, 1.0, tune_until=tb[0] - .05)
    # the bassoon's sags after each 'Rolls.' and a deepening droop of the whole scene
    for line in ("t2", "t3", "t4"):
        e = LN("signup", line)["e"]
        T.put(bassoon(43, .35, .8, a=.03, r=.1), e - .05, .12, -.15)
        T.put(slide_brass(43, 41, .45, 600) * 1.1, e + .28, .08, -.15)
    # the baskets
    for k, at in enumerate((cue_abs("basket", "signup", 0), cue_abs("basket", "signup", 1), cue_abs("basket", "signup", 2))):
        if at:
            m = (72, 76, 79)[k]
            T.put(pizz(midi(m), .22), at, .16, -.3 + .3 * k)
            T.put(bell(midi(m + 12), .6) * .4, at, .05, .3)
    for k in range(8):
        at = tb[0] + .0 + .15 * k
        m = (72, 74, 76, 77, 79, 81, 83, 84)[k]
        T.put(pizz(midi(m), .2), at, .15, -.4 + .1 * k)
        T.put(bell(midi(m + 12), .5) * .35, at, .04, .3)
    # the march is talked down: stretched beats, the bassoon on the bass
    bt = slowing_beats(t0 + 9.2, b1[0] - .1, .5, .85, 4.0)
    for k, at in enumerate(bt):
        bar, beat = divmod(k, 4)
        ch, rt = SU_CH[(bar + 1) % 4]
        if beat in (0, 2):
            T.put(bassoon(rt + 12 + (0 if beat == 0 else 7), min(1.1 * (bt[k + 1] - at if k + 1 < len(bt) else .6), 1.0), .7, a=.05, r=.15, vd=.003), at, .13, -.15)
        elif k % 2:
            comp(T, at + .12, list(CHORDS[ch]), .3, .04, .35)
        if beat in (1, 3):
            D.put(woodblock(), at, .018, .3)
    for at in (cue_abs("sniffle", "signup", 0), cue_abs("sniffle", "signup", 1)):
        if at:
            T.put(sob_clar(72, 67, .5, .55), at - .02, .06, -.3)
    # Binder: the helpful jingle, then the curdled one
    bounce(T, b1[0] - .15, BJ, .09, .125, .05)
    binder_bed(T, D, b1[0] + .45, s2[0] - .02, 120, .85)
    T.gate(s2[0] - .02, b2[0] - .02, 0.0, .01)
    D.gate(s2[0] - .02, b2[0] - .02, 0.0, .01)
    bounce(T, b2[0] - .02, BJ_MINOR, .09, .22, 0.0, True)
    T.put(strings([38, 45], ddp[0] - b2[0], .5, .6, 4.0, 700), b2[0], .06)
    # the dedupe: a rewind and a tuba walking down on the poofs
    T.gate(ddp[0] - .1, ddp[0] + .03, 0.0, .01)
    D.put(revcym(.3, 1500, 8000), ddp[0], .07, 0)
    for k, m in enumerate((55, 53, 52, 50, 48, 43)):
        at = cue_abs("poof", "signup", k)
        if at:
            T.put(tuba(m, .17 if k < 5 else .6, a=.02, r=.06 if k < 5 else .25), at, .17, -.1)
    # 'Rolls: one!' a fanfare, deadpan
    T.put(mtrumpet(67, .12, 1.0), b3[0] + .05, .09, .2)
    T.put(mtrumpet(72, .5, 1.0, wah=0), b3[0] + .2, .09, .2)
    T.put(bell(midi(96), .8) * .4, b3[0] + .2, .04, .3)
    # 'That is not a potluck.': the bassoon, alone
    T.put(bassoon(48, l2[1] - l2[0] - .1, .85, a=.1, r=.35, vd=.004), l2[0] + .05, .13, -.1)
    T.put(slide_brass(48, 45.5, .7, 600) * 1.2, l2[1] - .55, .09, -.1)
    # 'Efficiency.': the band comes back for one stab
    st = t5[0] + .05
    T.put(brass([48, 55, 60, 64, 67], .28, .012, .1, 2300), st, .08, 0)
    uke(T, st, [60, 64, 67, 72], .08, .3)
    T.put(bell(midi(96), .9) * .5, st, .05, .3)
    T.put(marimba(midi(84), .3), st, .1, -.1)
    D.put(kick13(.8), st, .1, 0)
    T.put(bassoon(36, en[0] - t5[1] + .45, .8, a=.05, r=.3), t5[1] - .05, .1, -.1)
    T.fade(t0 + d - .6, t0 + d, 1, 0)
    D.fade(t0 + d - .6, t0 + d, 1, 0)


# ================================================================ kitchen: a cooking show
KI_BL = .6                                                         # 100 bpm; the grid is anchored on the carve (10.076 s), so the triplet eighth is exactly 0.2 s
KI_ANCHOR = 10.076
KI_PROG = (("Fmaj7", (41, 48, 45, 39), (57, 60, 64, 67)), ("Dm7", (38, 45, 41, 42), (53, 57, 60, 64)),
           ("Gm7", (43, 50, 46, 47), (58, 62, 65, 69)), ("C7", (48, 55, 52, 40), (52, 55, 58, 62)))       # chord, walking bass (one note a beat), rootless comping voicing


def jazz19(T, D, t0, a, b, lvl=1.0, comp_on=True, brushes=True, bass_g=.15):
    """The cooking show's band from a to b on the grid anchored at the carve (10.076 s of the scene): a walking upright bass in quarter notes through Fmaj7 / Dm7 / Gm7 / C7, a Rhodes that
    comps on 2 and 4 (rootless voicings), brushes (a ride on every beat with the skip note after 2 and 4, a swish on 2 and 4) and nothing loud: it is a show about turkeys."""
    anchor = t0 + KI_ANCHOR
    k0 = int(np.ceil((a - anchor) / KI_BL - 1e-6))
    k1 = int(np.floor((b - anchor) / KI_BL + 1e-6))
    for k in range(k0, k1 + 1):
        at = anchor + k * KI_BL
        if at >= b - .02:
            continue
        beat, bar = k % 4, (k // 4) % 4
        name, walk, voc = KI_PROG[bar]
        T.put(ubass(walk[beat], KI_BL * .85, .7), at, bass_g * lvl, -.15)
        if comp_on and beat in (1, 3):
            for q, m in enumerate(voc):
                T.put(epiano(midi(m), .45, .45), at + .02 * q + (.1 if beat == 3 else 0), .026 * lvl, .2 + .05 * q)
        if brushes:
            D.put(ride(.35) * .5, at, .022 * lvl, .25)
            if beat in (1, 3):
                D.put(ride(.25) * .4, at + KI_BL * 2 / 3, .016 * lvl, .25)
                D.put(brush(.3), at, .04 * lvl, -.2)


def lick(T, at, notes, step=.15, g=.08, pan=.25, long_last=0.5):
    """A clarinet lick: eighth-note triplets from `at`, the last note held."""
    for j, m in enumerate(notes):
        last = j == len(notes) - 1
        T.put(clarinet(m, long_last if last else step * .9, a=.03, r=.08 if not last else .25), at + j * step, g, pan)


OST = (0, 4, 7, 4, 7, 4)                                           # the conveyor's figure: a rising arpeggio that never gets anywhere (semitones above the station's root)
STATIONS = ((0.0, 0, 65, "xylo"), (.8, 2, 65, "marimba"), (1.2, 4, 65, "vib"), (1.6, 5, 65, "epiano"), (3.0, 7, 65, "felt"))      # (start in the carve beat, semitones up, F4, instrument)


def conveyor(T, D, t0, a, b):
    """THE TEXTURE LINE (10.076 to 13.476 s): the conveyor as a mechanical ostinato in triplet eighths of exactly 0.2 s, the same six-note figure at every station but a step higher and a softer
    instrument each time (a xylophone at REGULAR, a marimba at MECH SOFT, vibes at MINCED, a Rhodes at PUREE, a felt piano at MOLD), so the turkey and the music both lose their edges. A woodblock clacks on every beat,
    a sub note under it is the motor, and the walking bass carries on."""
    n = int(round((b - a) / .2))
    for i in range(n):
        at = a + i * .2
        loc = at - a
        st = max((s for s in STATIONS if s[0] <= loc + 1e-6), key=lambda s: s[0])
        m = st[2] + st[1] + OST[i % 6] + 12
        g = .075
        if st[3] == "xylo":
            T.put(xylo(m, .14, .9), at, g * 1.1, -.3 + .1 * (i % 6))
        elif st[3] == "marimba":
            T.put(marimba(midi(m), .2), at, g * 1.2, -.2 + .08 * (i % 6))
        elif st[3] == "vib":
            T.put(vib(m, .35, .55, 3.5, .12), at, g * .9, -.1 + .05 * (i % 6))
        elif st[3] == "epiano":
            T.put(epiano(midi(m), .3, .55), at, g * .9, 0.0)
        else:
            T.put(felt(m - 12, .5, .55), at, g * 1.1, 0.1)
        if i % 3 == 0:
            D.put(woodblock(), at, .03, .3)
    T.put(sub_bass(midi(29), b - a), a, .05, 0)


def cue_kitchen19(T, t0, d, beats, D):
    """5:00 PM, the kitchen (42.8 s). A COOKING SHOW (0.48 to 9.9): an upright bass walking through F major (Fmaj7 / Dm7 / Gm7 / C7, 100 bpm, grid anchored on the carve at 10.076 so the
    texture line sits exactly on it), brushes, a Rhodes on 2 and 4 and a clarinet that has a lick for every pause. THE TEXTURE LINE (10.076 to 13.476): a mechanical ostinato in 0.2 s triplets
    that gets a step higher and a softer instrument at each of the five stations (xylophone, marimba, vibes, Rhodes, felt piano), a woodblock for the belt, a sub for the motor; it ends on the
    mold's thump (13.076) with one tidy chord. 'It is a beige turkey.' (14.49): a SAD TROMBONE on 'beige turkey', wah, wah, wah, waaah. THE VISCOSITY (18.23 to 20.9): 'Nectar.' a short marimba note,
    'Honey.' a clarinet that slides and will not arrive, 'Pudding.' a tuba that lands like a pudding. The jazz carries on, drier, under Strawberry's deadpan and Pineapple's pie. THE PIE (30.58 to 32.48):
    a rising blender crescendo (a riser, a timpani roll that speeds up, a sub that climbs) cut dead on the mold's press (32.477), and quiet after it. 'I am the manager.' a bassoon. 'It is beige.'
    (39.5): a flat waltz in 3/4 (a tuba on 1, a clarinet and a bassoon that are a third of a semitone flat on 2 and 3) that does not finish: the sting (41.44) is the sfx's."""
    c3, c4, c5, c6, c7, c8, p4 = (beats[k] for k in ("c3", "c4", "c5", "c6", "c7", "c8", "p4"))
    carve = beats["carve"]
    s1, s2 = beats["s1"], beats["s2"]
    jazz19(T, D, t0, t0 + .46, carve[0] - .02, 1.0)
    lick(T, t0 + .98, (77, 81, 84, 81), .15, .07)
    lick(T, t0 + 9.3, (72, 76, 79, 84), .15, .06, long_last=.4)
    # the texture line
    m_press = cue_abs("moldpress", "kitchen", 0) or (t0 + 13.076)
    conveyor(T, D, t0, carve[0], m_press)
    jazz19(T, D, t0, carve[0], m_press, .6, comp_on=False, brushes=False, bass_g=.1)
    T.put(brass([53, 57, 60, 64, 69], .45, .01, .2, 2000), m_press, .06, 0)
    T.put(epiano(midi(77), .9, .6), m_press, .04, .2)
    D.put(woodblock(), m_press, .05, 0)
    jazz19(T, D, t0, m_press + .02, c3[0] + .9, .8)
    # the sad trombone on 'beige turkey.'
    wb = W("c3", "beige")
    avail = (cue_abs("pourcoffee", "kitchen", 0) or (t0 + 17.284)) - .12 - wb
    f = avail / 1.95
    sad_trombone(T, wb, [(53, .3 * f), (52, .3 * f), (51, .3 * f), (50, .95 * f)], .1)
    jazz19(T, D, t0, c3[0] + .9, wb - .02, .6, bass_g=.12)
    T.put(ubass(41, .5, .5), wb - .03, .1, -.1)
    # the viscosity: the three glops (18.534, 19.134, 19.734) are the beats: marimba, clarinet, tuba
    g1, g2, g3 = (cue_abs("glop", "kitchen", k) for k in range(3))
    g1, g2, g3 = g1 or (t0 + 18.534), g2 or (t0 + 19.134), g3 or (t0 + 19.734)
    T.put(marimba(midi(72), .18), g1 - .03, .12, -.1)
    T.put(bell(midi(84), .6) * .4, g1 - .03, .04, .3)
    T.put(clarinet(69, .62, a=.04, r=.15), g2 - .03, .09, .2)
    T.put(slide_brass(70, 66, .5, 900) * 1.1, g2, .05, .2)
    T.put(tuba(41, 1.0, a=.06, r=.35), g3 - .03, .19, -.1)
    D.put(bdrum(.6, .8), g3, .05, 0)
    T.put(sub_bass(midi(29), 1.0), g3, .07, 0)
    jazz19(T, D, t0, c4[1] + .0, t0 + 24.6, .7, bass_g=.12)
    lick(T, t0 + 22.6, (65, 69, 72, 77), .15, .06, long_last=.7)
    lick(T, c5[1] - .75, (79, 77, 76, 72), .14, .07, long_last=.45)
    # Pineapple and the pie: the same band, even drier
    jazz19(T, D, t0, t0 + 24.6, beats["smoothie"][0] - .02, .6, comp_on=False, bass_g=.11)
    # the rising blender crescendo and the press
    bl0 = cue_abs("blender", "kitchen", 1) or (t0 + 30.577)
    mp2 = cue_abs("moldpress", "kitchen", 1) or (t0 + 32.477)
    T.put(riser(mp2 - bl0 - .02, 220, 5200, .7), bl0, .04, 0)
    T.put(sub_swell(40, 110, mp2 - bl0 - .02) * .8, bl0, .08, 0)
    D.put(roll(70, mp2 - bl0 - .05, 34), bl0, .07, -.1)
    for j, m in enumerate((53, 57, 60, 64, 65, 69, 72, 76)):
        T.put(marimba(midi(m), .18), bl0 + .2 + j * (mp2 - bl0 - .35) / 8, .04 + .008 * j, -.4 + .1 * j)
    T.gate(mp2 - .03, mp2 + .2, 0.0, .004)
    D.gate(mp2 - .03, mp2 + .2, 0.0, .004)
    MUTES.append((mp2 - .03, mp2 + .22, .004))
    # 'Pie smoothie.': nothing, then the band tiptoes back
    T.put(ubass(41, .6, .5), c6[0] - .15, .08, -.1)
    jazz19(T, D, t0, c6[1] + .1, c7[0] - .05, .5, comp_on=False, brushes=False, bass_g=.09)
    T.put(bassoon(41, c7[1] - c7[0] - .2, .8, a=.08, r=.3), c7[0] + .05, .1, -.1)
    # the flat waltz on 'It is beige.'
    bw = c8[0] - .05
    wl = .5
    T.put(tuba(41, .45, a=.03, r=.1), bw, .16, -.1)
    for beat in (1, 2):
        T.put(clarinet(65 - .35, .38, a=.04, r=.1), bw + beat * wl, .075, .2)
        T.put(bassoon(57 - .35, .38, .7), bw + beat * wl + .01, .075, -.2)
    bw2 = bw + 3 * wl
    T.put(tuba(41, .45, a=.03, r=.1), bw2, .15, -.1)
    for j, (beat, m) in enumerate(((1, 70), (2, 69))):
        T.put(clarinet(m - .4, .3 if j == 0 else .6, a=.04, r=.15), bw2 + beat * wl, .07, .2)
    MUTES.append((t0 + 41.36, t0 + 41.9, .03))
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ plate: the baton
# One waltz melody in D major, in 3/4, passed from instrument to instrument. (bar, beat in the bar, MIDI, length in beats). 44 beats from the first word (1.3 s) to the last (21.3 s).
BATON = ((0, 0, 66, 1), (0, 1, 69, 1), (0, 2, 74, 1),
         (1, 0, 76, 1.5), (1, 1.5, 74, .5), (1, 2, 73, 1),
         (2, 0, 71, 1), (2, 1, 69, 1), (2, 2, 67, 1),
         (3, 0, 64, 1.5), (3, 1.5, 66, .5), (3, 2, 67, 1),
         (4, 0, 69, 1), (4, 1, 74, 1), (4, 2, 78, 1),
         (5, 0, 76, 1.5), (5, 1.5, 74, .5), (5, 2, 71, 1),
         (6, 0, 67, 1), (6, 1, 71, 1), (6, 2, 76, 1),
         (7, 0, 73, 2), (7, 2, 69, 1),
         (8, 0, 66, 1), (8, 1, 69, 1), (8, 2, 74, 1),
         (9, 0, 73, 1.5), (9, 1.5, 74, .5), (9, 2, 76, 1),
         (10, 0, 74, 1), (10, 1, 71, 1), (10, 2, 67, 1),
         (11, 0, 69, 1.5), (11, 1.5, 67, .5), (11, 2, 66, 1),
         (12, 0, 74, 1), (12, 1, 66, 2),
         (13, 0, 67, 1.5), (13, 1.5, 66, .5), (13, 2, 64, 1),
         (14, 0, 62, 3))
BATON_CH = ("D", "D", "G", "A7", "D", "Bm", "Em", "A7", "D", "F#m", "G", "A7", "D", "G", "D")                   # the chord of each bar
BATON_ROOT = {"D": 38, "G": 43, "A7": 45, "Bm": 47, "Em": 40, "F#m": 42}
BATON_PAH = {"D": (62, 66, 69), "G": (59, 62, 67), "A7": (61, 64, 67), "Bm": (62, 66, 71), "Em": (59, 64, 67), "F#m": (61, 66, 69)}
BATON_HANDOFFS = (0, 6, 12, 17, 24, 32, 37, 44)                                                                    # beat index of each hand-off: the first word of m1, l1, t1, o1, pe1, b1, s1 and the end
BATON_LINES = ("m1", "l1", "t1", "o1", "pe1", "b1", "s1")
BATON_WHO = ("pizz", "oboe", "uke", "clar", "acc", "mar", "cello")                                                 # who plays beats [0,6), [6,12), [12,17), [17,24), [24,32), [32,37), [37,44]


def baton_times(beats, scene="plate"):
    """Absolute time of every beat index 0..44 of the baton: the first word of each hand-off line is a beat (BATON_HANDOFFS), the last beat is the end of 'What time is it?'. Inside a segment
    the beats are equally long, then smoothed (a three-beat average) and rescaled so that every hand-off still lands exactly: the waltz walks at between 113 and 140 bpm and the tempo bends
    toward each speaker."""
    anchors = [LN(scene, l)["s"] - .015 for l in BATON_LINES] + [LN(scene, "s2")["e"] - .0]
    anchors[0] = beats["m1"][0] - .015
    n = BATON_HANDOFFS[-1]
    raw = np.zeros(n)
    for j in range(7):
        i0, i1 = BATON_HANDOFFS[j], BATON_HANDOFFS[j + 1]
        raw[i0:i1] = (anchors[j + 1] - anchors[j]) / (i1 - i0)
    sm = np.convolve(np.pad(raw, 1, mode="edge"), np.ones(3) / 3, mode="valid")
    for j in range(7):
        i0, i1 = BATON_HANDOFFS[j], BATON_HANDOFFS[j + 1]
        sm[i0:i1] *= (anchors[j + 1] - anchors[j]) / sm[i0:i1].sum()
    bt = np.concatenate([[anchors[0]], anchors[0] + np.cumsum(sm)])
    return bt, anchors


def _bt_at(bt, x):
    """Time of the (fractional) beat index x."""
    i = int(np.floor(x))
    i = min(max(i, 0), len(bt) - 2)
    return bt[i] + (x - i) * (bt[i + 1] - bt[i])


BATON_GAIN = {"pizz": .75, "oboe": 1.1, "uke": 1.0, "clar": 1.3, "acc": 1.25, "mar": .8, "cello": 1.4}      # the instruments' own loudness evened out: the tune is as loud in every hand


def baton_note(T, who, m, at, dur, pan=0.0, sob=None):
    """One note of the melody on the instrument that holds the baton."""
    k = BATON_GAIN[who]
    if who == "pizz":
        T.put(pizz(midi(m), min(dur, .3)), at, .16 * k, -.1)
        T.put(bell(midi(m + 12), .5) * .3, at, .025 * k, .25)
    elif who == "oboe":
        T.put(oboe(m, dur * .96, vib=.0025, a=.03, r=.07), at, .075 * k, .1)
    elif who == "uke":
        T.put(ukenote(m + 12, min(dur, .45)), at, .09 * k, .25)
        T.put(ukenote(m, min(dur, .45)), at + .006, .05 * k, .15)
    elif who == "clar":
        T.put(clarinet(m, dur * .97, a=.05, r=.1), at, .08 * k, -.15)
    elif who == "acc":
        T.put(accordion(m, dur * .96, .75, a=.03, r=.07), at, .075 * k, .15)
    elif who == "mar":
        T.put(marimba(midi(m + 12), min(dur + .1, .55)), at, .12 * k, .2)
        T.put(marimba(midi(m), min(dur + .1, .55)), at + .004, .05 * k, .1)
    else:
        T.put(cello(m, dur * 1.02, 1.0, a=.1, r=.35), at, .11 * k, 0)


def cue_plate19(T, t0, d, beats, D):
    """7:45 PM, the plate (23.2 s). THE BATON. One waltz melody in D major, in 3/4 at a walking pace, never stops from the first word (1.3 s) to the end of the last (21.3 s) and changes
    instrument on the first word of each hand-off: Mango's pizzicato (1.3), Lemon's dry oboe (4.14, 'I will hold it.'), Tomato's ukulele (6.75, 'Fun Committee!'), Onion's clarinet (9.2, 'It is
    seventy-eight degrees.'; on her sniffle (11.2) the note sobs down), Pear's accordion (12.5, 'Is that turkey?'), Binder's marimba (15.9, 'I'll help!') and Strawberry's lone cello (18.14, 'I am on
    med pass.'), which carries the tune home to a held D under 'What time is it?'. Under it all one accompaniment, an upright bass on 1 and pizzicato chords on 2 and 3 (D D G A7 / D Bm Em A7 / D F#m
    G A7 / D G D), which thins to a bass note and a pad for the cello. The beats bend a little toward each speaker (see baton_times). The sting (21.61) is the sfx's."""
    bt, anchors = baton_times(beats)
    last = len(bt) - 1
    # the accompaniment: oom-pah-pah, one bar at a time
    for i in range(last):
        bar, beat = divmod(i, 3)
        if bar >= len(BATON_CH):
            break
        ch = BATON_CH[bar]
        at = bt[i]
        thin = i >= BATON_HANDOFFS[6]
        if beat == 0:
            T.put(ubass(BATON_ROOT[ch] + 12, (bt[i + 1] - at) * 1.6, .7), at, .14 if not thin else .09, -.1)
        elif not thin:
            for q, m in enumerate(BATON_PAH[ch]):
                T.put(pizz(midi(m), .16), at + .008 * q, .05, -.2 + .15 * q)
            if beat == 1 and (bar % 2 == 1):
                D.put(woodblock(), at, .012, .3)
    # the pad under the cello, the only thing that holds on
    c0 = _bt_at(bt, BATON_HANDOFFS[6])
    T.put(strings([50, 57, 62, 66], _bt_at(bt, 39) - c0, .5, .4, 4.8, 1500), c0, .04)
    T.put(strings([43, 50, 55, 59], _bt_at(bt, 42) - _bt_at(bt, 39), .4, .4, 4.8, 1500), _bt_at(bt, 39), .04)
    T.put(strings([38, 45, 50, 54, 57], (bt[last] - _bt_at(bt, 42)) + .5, .4, .9, 4.8, 1600), _bt_at(bt, 42), .05)
    # the melody
    sob_at = cue_abs("sniffle", "plate", 0)
    for bar, off, m, ln in BATON:
        x = bar * 3 + off
        if x >= last - .01 and not (bar == 14):
            continue
        who = BATON_WHO[max(j for j in range(7) if BATON_HANDOFFS[j] <= x + 1e-6)]
        at = _bt_at(bt, x)
        dur = _bt_at(bt, x + ln) - at
        if bar == 14:                                                    # the last D rings on to the end of the line
            dur = bt[last] - at + .25
        if who == "clar" and sob_at is not None and at <= sob_at - .02 < at + dur and ln >= 2:
            T.put(clarinet(m, sob_at - at - .02, a=.05, r=.04), at, .08 * BATON_GAIN["clar"], -.15)            # the clarinet breaks off ...
            T.put(sob_clar(m, m - 3.5, at + dur - sob_at + .04, .7), sob_at - .02, .075 * BATON_GAIN["clar"], -.15)    # ... and sobs down
            continue
        baton_note(T, who, m, at, dur)
    # Binder's marimba gets a grace note, as a joke: a flick of the pop on 'I'll help!'
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)
    MUTES.append((bt[last] + .45, t0 + d, .2))


# ================================================================ breakroom: the microwave's groove, then Brenda
BR_PROG = (("Am7", 45, (57, 60, 64, 67)), ("Dm7", 50, (53, 57, 60, 64)), ("G7", 43, (59, 62, 65, 69)), ("Cmaj7", 48, (52, 55, 59, 62)),
           ("Am7", 45, (57, 60, 64, 67)))
BRENDA = (72, 79, 77, 76, 74, 72)                                                  # Brenda's six notes from Episode 13: C G F E D C
BR_BASS = ((0, 0, 3), (3, 7, 1), (4, 0, 2), (6, 7, 1.5))                         # (eighth in the bar, semitones above the root, length in eighths)


def tomato19(T, at, g=.08, minor=False):
    """Tomato's pizzicato: a rising chord on pizzicato strings, major (it is a party) or minor (it is not)."""
    for q, m in enumerate(TP_MIN if minor else TP_MAJ):
        T.put(pizz(midi(m + 12), .16), at + q * .05, g, .3)


def groove19(T, D, G, a, b, lvl=1.0, rhodes=True, brushes=True, steps=True, prog_off=0):
    """The break room's groove on the microwave's grid G (mw_grid, absolute): a muted upright bass (root, fifth, root, fifth through Am7 / Dm7 / G7 / Cmaj7 / Am7: one chord a bar of eight
    eighths), brushes with the backbeat on 2 and 4, a Rhodes that comps on the 1 and the 'and' of 2, and a woodblock for the queue's steps on every quarter note. From a to b."""
    e, o = G["eighth"], G["origin"]
    k0 = int(np.ceil((a - o) / e - 1e-6))
    k1 = int(np.floor((b - o) / e + 1e-6))
    for k in range(k0, k1 + 1):
        at = o + k * e
        if at >= b - .02 or k < 0:
            continue
        bar, ei = divmod(k, 8)
        name, root, voc = BR_PROG[min(max(bar + prog_off, 0), 4)]
        for ee, semi, ln in BR_BASS:
            if ei == ee:
                T.put(ubass(root + semi, ln * e * .9, .6), at, .12 * lvl, -.15)
        if rhodes and ei in (0, 3):
            for q, m in enumerate(voc):
                T.put(epiano(midi(m), (3.0 if ei == 0 else 2.0) * e, .5), at + .012 * q, .032 * lvl, .1 + .08 * q)
        if brushes:
            D.put(brush(.2), at, (.045 if ei in (2, 6) else .014) * lvl, -.2 + .05 * (ei % 4))
            if ei in (0, 4):
                D.put(ride(.3) * .4, at, .014 * lvl, .25)
        if steps and ei in (0, 2, 4, 6):
            D.put(woodblock(), at, (.03 if ei in (0, 4) else .02) * lvl, .3 if ei % 4 else -.3)


def cue_breakroom19(T, t0, d, beats, D):
    """8:00 PM, the break room (30.3 s). THE MICROWAVE IS THE METRONOME: the three beeps (0.3, 0.65, 1.0) are the first three eighths of the grid (build_music19.mw_grid: 84.9 bpm, eight eighths a
    bar from 0.3 s, bent by one percent so the timer's ding at 14.429 s is the downbeat of bar 5). The groove (muted upright bass, brushes, a Rhodes, a woodblock for the queue's steps; Am7
    Dm7 G7 Cmaj7 Am7) comes in on the third beat of bar 0 (1.71 s). Onion's sniffle (9.42) is a clarinet sob; Tomato's pizzicato is major on 'It is a party!' (9.65). The groove thins under
    'Per policy, it is discarded.' (a pedal and a brush) and the DING (14.429) is the only hit: a Rhodes chord, the bass and a timpani on the downbeat, then the music is cut so that the sweep
    (15.18 to 16.98) and the two bins are heard clean, and stays out through 'That was my break.' THEN A HUSH FOR BRENDA: a soft cello pedal (A) under 'I have a sandwich.' (18.26), the music box
    counting 'nineteen' (Episode 13's falling E D C) on 'twenty nineteen' (br2), strings that warm toward C major and, under 'It was a good year.' (26.6), a solo cello that plays Brenda's six notes
    (C G F E D C) and holds the last, over a Cmaj7. The sting (28.98) is the sfx's: C major."""
    q1, q4, o1, t1, o2, s1, tm, sw, s2, br1, m1, l1, br2, s3, br3, en = (beats[k] for k in ("q1", "q4", "o1", "t1", "o2", "s1", "timer", "sweep", "s2", "br1", "m1", "l1", "br2", "s3", "br3", "end"))
    g = mw_grid({"id": "breakroom", "beats": {k: {"s": v[0] - t0, "e": v[1] - t0} for k, v in beats.items()}}, CTX["script"])
    G = dict(g, origin=t0 + g["origin"], ding=t0 + g["ding"])
    e, o = G["eighth"], G["origin"]
    ding = G["ding"]
    bar_t = lambda b: o + b * G["bar"]
    # the groove: in on beat 3 of bar 0, full to bar 3, thinner in bar 4, out at the ding
    D.put(woodblock(), o + 3 * e, .03, .3)                                  # the fourth tick of the count-in: the queue's first step
    groove19(T, D, G, o + 4 * e, bar_t(3) + .01, 1.0)
    groove19(T, D, G, bar_t(3), bar_t(4) - .01, .85)
    # Onion's sniffle: a clarinet sob; Tomato's pizzicato
    sn = cue_abs("sniffle", "breakroom", 0)
    if sn:
        T.put(sob_clar(76, 71, .55, .6), sn - .02, .065, -.3)
    tomato19(T, t1[0] + .08, .08)
    # bar 4 (11.6 to 14.43): the room is being cleared: a bass pedal, a brush and a Rhodes that falls (Am7 to E7 on the last two beats)
    groove19(T, D, G, bar_t(4), ding - 4 * e - .01, .7, steps=False)
    T.put(ubass(40, 4 * e * .98, .6), ding - 4 * e, .1, -.15)
    for q, m in enumerate((56, 59, 62, 65)):
        T.put(epiano(midi(m), 4 * e, .5), ding - 4 * e + .012 * q, .034, .1 + .08 * q)
    tomato19(T, o2[0] + .6, .06, minor=True)
    # THE DING: one hit on the downbeat
    T.put(epiano(midi(57), 2.0, .8), ding, .06, 0)
    for q, m in enumerate((60, 64, 67, 71, 74)):
        T.put(epiano(midi(m), 1.6, .75), ding + .008 * q, .045, -.2 + .1 * q)
    T.put(ubass(33, 1.2, .8), ding, .17, -.1)
    D.put(timp(55, 1.2), ding, .09, 0)
    D.put(woodblock(), ding, .05, 0)
    # the music is out for the sweep and 'That was my break.'
    T.gate(ding + .55, br1[0] - .25, 0.0, .15)
    D.gate(ding + .2, br1[0] - .25, 0.0, .05)
    # the hush
    T.put(cello(45, br1[1] - br1[0] + 1.3, .9, a=.7, r=.8), br1[0] - .1, .1, 0)
    T.put(glass(88, br1[1] - br1[0] + .4, 1.1, .8), br1[0] + .25, .04, .3)
    T.put(clarinet(64, .22, a=.03, r=.08), m1[0] + .12, .07, .2)             # 'Brenda?'
    T.put(clarinet(67, .5, a=.04, r=.18), m1[0] + .33, .07, .2)
    nn = W("br2", "nineteen")
    for k, m in enumerate((76, 74, 72)):                                     # the music box counts 'nineteen' as it did in Episode 13: E D C, a little flat
        T.put(music_box(midi(m + 12 - .15), 1.0), nn + .05 + k * .24, .08, .3)
    T.put(strings([45, 52, 57, 60, 64], br2[1] - br2[0] + .4, .9, .8, 4.8, 1500), br2[0] - .05, .045)
    # 'It was a good year.': Brenda's six notes on a solo cello over a Cmaj7
    cm = br3[0] - .12
    T.put(strings([48, 52, 55, 59, 64], br3[1] - br3[0] + 2.4, .5, 1.2, 4.8, 1800), cm, .06)
    T.put(epiano(midi(48), 3.0, .4), cm, .035, -.1)
    t_ = br3[0] - .05
    for m, dd in zip(BRENDA, (.46, .4, .34, .34, .52, 3.0)):
        T.put(cello(m - 12, dd * .98, 1.0, a=.12, r=.4 if dd > 1 else .15), t_, .12, 0)
        t_ += dd
    T.fade(t0 + d - 1.0, t0 + d, 1, 0)
    D.fade(t0 + d - 1.0, t0 + d, 1, 0)


# ================================================================ thanks: a hymn
# A hymn in A major, 4/4, four bars of two chords from 0.2 s to the held chord of the sit beat; the beat is bent a hair (0.98 s) so that bar 5 begins at 15.9 s, just after 'A chair.'
HYMN_CH = (("A", 45, (57, 61, 64)), ("D", 38, (57, 62, 66)),          # bar 1
           ("A", 45, (57, 61, 64)), ("E", 40, (56, 59, 64)),          # bar 2
           ("F#m", 42, (57, 61, 66)), ("Bm", 47, (59, 62, 66)),       # bar 3
           ("E", 40, (56, 59, 64)), ("E", 40, (59, 62, 64)))          # bar 4: the dominant, then a suspension that waits
HYMN_TUNE = ((0, 69, 1), (1, 73, 1), (2, 74, 1), (3, 69, 1),                          # A C# | D A
             (4, 76, 1.5), (5.5, 73, .5), (6, 71, 1), (7, 68, 1),                      # E C# B G# (over A, E)
             (8, 69, 1.5), (9.5, 73, .5), (10, 74, 1), (11, 78, 1),                    # A C# D F# (over F#m, Bm)
             (12, 76, 2), (14, 74, 1), (15, 71, 1))                                    # E (two beats) D B (over E, E7: it waits)
HYMN_BL = (15.9 - .2) / 16


def cue_thanks19(T, t0, d, beats, D):
    """10:40 PM, the last round (24.2 s). A HYMN in A major (original, simple, four bars of two chords at about 61 bpm from 0.2 to 15.9 s: A D / A E / F#m Bm / E E7): a felt piano on the tune and
    the chords (a soft bass on every chord) with soft strings that come in at bar 3. It goes on, unbothered, under the four thankful lines and under 'It is a UTI.' (Lemon is deadpan, the hymn
    does not notice). The last bar waits on the dominant through 'Sit.' and the held beat, and when Strawberry says 'A chair.' (15.32) it lands on bar 5 (15.9) as the subdominant: D major with a
    ninth, strings, a low D on the felt piano, and ONE MUSIC-BOX NOTE (F-sharp, 16.1): nothing else moves for the sit beat (16.0 to 17.6). The call chime (17.77, A5 then E5) is inside the chord and
    RESOLVES it: the strings move D to A (the plagal amen, C-sharp E A) under the chime instead of stopping, and hold. 'Okay.' (18.62) a soft rising A major arpeggio; the Moon (19.48): a warm
    pad under him (A major, swelling), his four falling bells (E C-sharp A F-sharp) and nothing else. The sting (22.31, an amen) is the sfx's."""
    r1, s0, r2, beat, s1, sit, call, s2, mo1, en = (beats[k] for k in ("r1", "s0", "r2", "beat", "s1", "sit", "call", "s2", "mo1", "end"))
    a = t0 + .2
    bl = HYMN_BL
    for i, (name, root, voc) in enumerate(HYMN_CH):
        at = a + i * 2 * bl
        T.put(ubass(root + 12, 2 * bl * 1.3, .6), at, .1, -.1)
        for q, m in enumerate(voc):
            T.put(felt(m, 2 * bl * 1.2, .5), at + .02 * q + .01, .042, -.15 + .1 * q)
        if i >= 4:
            T.put(strings(list(voc) + [voc[0] - 12], 2 * bl + .3, .5, .6, 4.8, 1600), at, .04 + .012 * (i - 4))
    for off, m, ln in HYMN_TUNE:
        at = a + off * bl
        T.put(felt(m, ln * bl * 1.3 + .3, .62), at, .085, .1)
        if off >= 8:
            T.put(celesta(m + 12, 1.0, .4), at + .005, .018, .3)
    # bar 5: the sit beat: one chord and one music-box note
    land = a + 16 * bl
    ch_d = [38, 45, 50, 54, 57, 64]                                # D major with a ninth: D A D F# A E
    T.put(strings(ch_d, call[0] + .3 - land + 1.4, .35, 1.0, 4.8, 1500), land, .075)
    T.put(felt(38, 3.0, .45), land + .02, .08, -.1)
    T.put(felt(50, 3.0, .4), land + .03, .035, 0)
    T.put(music_box(midi(90), 1.8), sit[0] + .12, .075, .3)           # F-sharp 6
    chime = cue_abs("callchime", "thanks", 0) or (t0 + 17.772)
    T.put(strings([45, 52, 61, 69, 73, 76], 4.3, .45, 1.8, 4.8, 1900), chime - .04, .09)          # A2 E3 C#4 A4 C#5 E5: the third is in it three times
    T.put(felt(45, 4.0, .45), chime, .08, -.1)
    T.put(felt(61, 3.5, .4), chime + .02, .04, 0)
    T.put(music_box(midi(93), 1.6), chime + .45, .05, .3)             # the music-box note moves up to A6 as the chord settles
    # 'Okay.': a soft rising A major arpeggio
    for k, m in enumerate((57, 61, 64, 69, 73)):
        T.put(felt(m, 1.6, .5), s2[0] + .02 + k * .1, .05, -.2 + .1 * k)
    # the Moon: a warm pad and four falling bells
    mo = mo1[0] - .25
    pad_len = t0 + d - mo
    T.put(strings([45, 52, 57, 61, 64, 69, 73], pad_len, 1.2, 1.4, 4.6, 1500), mo, .085)
    T.put(pad([45, 52, 57, 61, 64], pad_len, 1.4, 1.6, 1100), mo, .05)
    T.put(sub_bass(midi(33), min(4.0, pad_len)) * .6, mo + .1, .06, 0)
    for k, m in enumerate((85, 81, 78, 73)):                           # C-sharp6 A5 F-sharp5 C-sharp5: the Moon's four falling bells, an A major sixth chord
        T.put(bell(midi(m), 1.3) * .6, mo1[0] - .1 + k * .42, .045, .3 - .15 * k)
    T.fade(t0 + d - 1.4, t0 + d, 1, 0)
    D.fade(t0 + d - 1.4, t0 + d, 1, 0)


# ================================================================ the cue table, levels and the score
CUES = {"title": cue_title19, "signup": cue_signup19, "kitchen": cue_kitchen19, "plate": cue_plate19, "breakroom": cue_breakroom19, "thanks": cue_thanks19, "end": cue_end19}
LEVEL19 = {"title": 1.6, "signup": 2.0, "kitchen": 2.0, "plate": 2.1, "breakroom": 2.0, "thanks": 2.2, "end": 1.7}
TAIL19 = {"title": .5, "signup": .4, "kitchen": .4, "plate": .4, "breakroom": .5, "thanks": .6, "end": .3}
DIP19 = {"title": 1.0, "signup": .62, "kitchen": .6, "plate": .8, "breakroom": .6, "thanks": .7, "end": 1.0}
REVERB19 = {"title": (.4, 1.0), "signup": (.25, .8), "kitchen": (.2, .7), "plate": (.25, .9), "breakroom": (.25, .7), "thanks": (.45, 1.6), "end": (.45, 1.4)}
DIPS19 = {"stamp": (4, .3, .3), "timerding": (4, .6, .3), "textding": (3, .2, .2), "doorbell": (3, .4, .3), "moldpress": (3, .3, .25), "glop": (3, .35, .2), "callchime": (3, .9, .5),
          "mwbeep": (2, .1, .1), "lidrattle": (2, .5, .3), "chairsit": (3, .6, .4), "dedupe": (3, .3, .2), "bagsweep": (4, .8, .3), "bin": (3, .2, .2), "probebeep": (3, .15, .15)}


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    M10._CTX["lines"] = {(ln["scene"], ln["id"]): ln for ln in lines}
    CTX["script"], CTX["scenes"] = script, scenes
    MUTES.clear()
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
        wet, rt = REVERB19.get(sc["id"], (.3, 1.0))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL19.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP19.get(sc["id"], .6)
        dips = DIPCACHE.setdefault(key, None)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        out[:, a:b] += seg * LEVEL19.get(sc["id"], 1.0) * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS19)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
