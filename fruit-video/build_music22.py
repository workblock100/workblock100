"""Episode 22 score: THE SECRET SANTA. Light but real: the series' orchestra (pizzicato strings, a celesta, a felt piano, a bassoon, a tuba, a choir and an organ) dressed for December with
sleigh bells, and public-domain tunes only (Jingle Bells, Deck the Halls, The Twelve Days of Christmas; the radio's We Wish You a Merry Christmas is in build_audio22's beds).

build_audio22 (a fresh copy of build_audio21's wrapper) calls score(script, scenes, lines, N) through --music build_music22; the mixer ducks the bed under every voice (and so does this file:
_speech_dip). The shape is Episode 15 to 21's: every scene is rendered on two tracks (U through the room's reverb, D dry), muted spans are applied after the reverb.

THE SET PIECES
  TITLE   the series' theme in F (the arpeggio on a celesta over a pizzicato bass, 120 bpm, beats on 0.3 + 0.5k), the ribbon a harp glissando, the rips two accents (the second the downbeat of
          bar 2, tutti), Jingle Bells' first phrase from 2.8 s and a glint on the text ding.
  DRAW    Jingle Bells, bouncy, under Tomato; a deflating tuba on 'You're per diem.'; Binder's jingle (F G A C); a 'computing' arpeggio under THE DRAW that speeds up and lands on the ding; a
          cash-register hit under 'a hundred and twenty dollars'.
  WRAP    a light pizzicato wrapping cue in C (120 bpm from the wrap; a note never lands within 60 ms of the foley), three ticks on 'Dated, timed, initialed.', squeaky-toy balloons in rhythm and a
          toy-piano flourish as the balloons rise.
  SANTA   Deck the Halls as an oompah (a tuba, a brass band, a glockenspiel), stopped dead on 'what?', a frantic fa-la-la for the search, a mock-heavenly choir and organ that rise with the Hoyer and
          land on 'This is the best Christmas.'.
  SWAP    a frenzied gallop (Jingle Bells at 200 bpm, the rips on its eighths), a deadpan low note per 'A candle.', Brenda's music box through the door, a cascade into the gift pile's thump, a
          fanfare that sags on 'okayest' and a triumphant hit on 'Pudding!'.
  CAROL   THE TWELVE DAYS OF CHRISTMAS ON THE GRID: 112 bpm, the intro bar from 4.047 s (the pitch pipe gives F), the seven lines on the next seven downbeats; a piano and a celesta on the tune, light
          strings, a pizzicato bass and sleigh bells; 'five pudding cups' broadens (tutti, a horn, a timpani roll, held notes over C, G7, C); the tune resolves on F under 'That's not a carol.' and a
          warm chord holds under the Moon. In the sung bars the band does not dip under the choir: the mixer's own duck is evened out (its gaps filled at the ducked level) so the band is steady.
  END     the theme in F at 123 bpm (0.1 to 4.0 s), the stamp the downbeat, a held F major ninth.
"""
import numpy as np
from scipy.ndimage import uniform_filter1d

from build_audio import SR, tarr, osc, ar, lp, hp, bp, midi, expdecay
from build_music6 import Track, hall, pizz, marimba, bell, sub_bass, pad, strings, brass, hat, timp, shaker, riser, kick, snare, clap, crash, roll, MUSIC_GAIN
from build_music7 import woodblock, music_box, choir, organ, slide_brass
import build_music10 as M10
from build_music10 import brush, cue_dips, _fit_rms, _fit_peak, piano, violin, tuba, slide_whistle, mtrumpet
from build_music9 import spic
from build_music13 import _mute, _speech_dip, glass, ubass, cello, snare13
from build_music14 import horn, celesta, bassoon, bdrum, xylo, trem_strings, harp
from build_music15 import comp, MT_ARP
from build_music19 import felt, sad_trombone
from build_music20 import bassclar, SDT

MUTES = []
R22 = np.random.default_rng(2722)
INFO = {}            # what the score decided, for build_audio22's cue report


def _n(d):
    return int(d * SR)


# ================================================================ new instruments
def bells(seed, d, n, lo=3200, hi=9000, sw=.4, shape=1.0):
    """Sleigh bells shaken (mono): `n` crotal-bell jingles (a ping with partials at 1.51x and 2.31x, its pellet's rattle) over `d` seconds, fullest at `sw` (0..1). Its own generator."""
    r = np.random.default_rng(seed)
    out = np.zeros(_n(d) + _n(.15))
    for i in range(n):
        u = r.uniform() ** shape
        at = u * max(.01, d - .02)
        f = r.uniform(lo, hi)
        t = tarr(.14)
        c = sum(a_ * np.sin(2 * np.pi * f * k * t + r.uniform(0, 6.28)) * np.exp(-t / (.05 / k)) for k, a_ in ((1, 1.0), (1.51, .5), (2.31, .3)))
        c = c + bp(r.uniform(-1, 1, len(t)), 4500, 10500) * np.exp(-t / .004) * .6
        j = int(at * SR)
        m = min(len(c), len(out) - j)
        if m > 0:
            out[j:j + m] += c[:m] * r.uniform(.3, 1.0) * np.exp(-((u - sw) / .45) ** 2)
    return out * .4


def toypiano(m, d=.6, vel=.8):
    """A toy piano: a struck metal rod (the fundamental, a 2.76x and a 5.4x partial that die fast), a plinky little hammer click, a few cents sharp and a short ring."""
    t = tarr(d)
    f = midi(m) * 1.004
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .35) + .5 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / .06) + .25 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / .025)
    x = x + bp(R22.uniform(-1, 1, len(t)), 2000, 7000) * np.exp(-t / .002) * .3
    return x * np.minimum(1, t / .001) * ar(d, .0005, min(.08, d * .4)) * (.5 + .5 * vel)


def squeaky(m, d=.14, vel=.8):
    """A squeaky-toy note (a glove balloon rubbed in rhythm): a sine that scoops up a semitone into the pitch, chattering at 32 Hz like rubber, through a resonance an octave up."""
    t = tarr(d)
    f = midi(m) * 2 ** ((-1.0 * np.exp(-t / .02)) / 12)
    ph = np.cumsum(f) / SR
    x = np.sin(2 * np.pi * ph) + .4 * np.sin(4 * np.pi * ph)
    x = x * (.65 + .35 * np.sign(np.sin(2 * np.pi * 32 * t)))
    x = x + .5 * bp(x, midi(m) * 1.6, midi(m) * 2.6, 1)
    return x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .6 * (.5 + .5 * vel)


def sagtuba(m, d=1.0, sag=5.0, vel=.9):
    """A tuba that deflates: a round dark note that sags `sag` semitones by its end (slowly at first), its level drooping and wobbling as the air goes out."""
    t = tarr(d)
    f = midi(m) * 2 ** (-sag * (t / d) ** 1.6 / 12) * (1 - .03 * np.exp(-t / .05))
    ph = np.cumsum(f) / SR
    x = (2 * (ph % 1) - 1) * .8 + np.sign(np.sin(2 * np.pi * ph)) * .4
    y = lp(x, 520, 3) * ar(d, .04, min(.2, d * .3)) * (1 - .35 * (t / d) ** 2) * (1 + .12 * np.sin(2 * np.pi * 6.5 * t) * (t / d))
    return _fit_rms(y) * (.5 + .5 * vel)


def register(seed=1):
    """A cash register: the drawer's bell ('ching': two bright inharmonic bells at 2.7 and 3.62 kHz), the drawer springing out (a slide and a clunk) and the coins in the tray (a little rattle)."""
    d = 1.0
    t = tarr(d)
    r = np.random.default_rng(seed)
    x = (np.sin(2 * np.pi * 2700 * t) + .6 * np.sin(2 * np.pi * 3620 * t) + .3 * np.sin(2 * np.pi * 5480 * t)) * np.exp(-t / .35) * np.minimum(1, t / .001)
    sl = bp(r.uniform(-1, 1, _n(.12)), 800, 3500) * np.interp(tarr(.12), [0, .02, .12], [0, 1, 0]) * .5
    x[_n(.05):_n(.05) + len(sl)] += sl
    tt = tarr(.08)
    x[_n(.17):_n(.17) + len(tt)] += (np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / .02) + bp(r.uniform(-1, 1, len(tt)), 500, 2500) * np.exp(-tt / .008)) * .6
    for j in range(9):
        a = _n(.18 + r.uniform(0, .25))
        tt = tarr(.05)
        c = np.sin(2 * np.pi * r.uniform(3000, 6000) * tt) * np.exp(-tt / .01) * r.uniform(.05, .15)
        x[a:a + len(c)] += c[:len(x) - a]
    return x * .6


def pz(m, d=.3):
    """A pizzicato note by midi number."""
    return pizz(midi(m), max(.12, min(d, .5)))


def harpn(m, d=.4):
    return harp(m, max(d, .9), .6)


def gliss(T, at, lo, hi, d, inst, g, pan=0.0, scale=(0, 2, 4, 5, 7, 9, 11), root=0, down=False):
    """A glissando up (or down) the scale from midi lo to hi in d seconds on inst(midi, duration)."""
    notes = [m for m in range(lo, hi + 1) if (m - root) % 12 in scale]
    if down:
        notes = notes[::-1]
    for j, m in enumerate(notes):
        T.put(inst(m, .4), at + d * j / max(1, len(notes)), g * (.7 + .3 * j / max(1, len(notes))), pan)


def shake(T, at, d=.13, n=9, g=.03, pan=.25, seed=0, lo=3200, hi=9000, sw=.3):
    T.put(bells(7000 + seed, d, n, lo, hi, sw), at, g, pan)


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


def near(at, cues, w=.06):
    return any(abs(at - c) < w for c in cues if c is not None)


CH22 = {"F": (53, 57, 60, 65), "C": (48, 52, 55, 60), "C7": (48, 52, 55, 58), "G7": (55, 59, 62, 65), "Bb": (50, 53, 58, 62), "Dm": (50, 53, 57, 62), "Gm": (55, 58, 62, 67),
        "A7": (57, 61, 64, 67), "D7": (54, 57, 60, 62), "G": (55, 59, 62, 67), "Am": (57, 60, 64, 69), "E7": (52, 56, 59, 62)}
ROOT22 = {"F": 41, "C": 36, "C7": 36, "G7": 43, "Bb": 46, "Dm": 38, "Gm": 43, "A7": 45, "D7": 38, "G": 43, "Am": 45, "E7": 40}


# ================================================================ title: the gift, the theme, the rips, Jingle Bells
JB = ((0, 69, .5), (.5, 69, .5), (1, 69, 1), (2, 69, .5), (2.5, 69, .5), (3, 69, 1), (4, 69, .5), (4.5, 72, .5), (5, 65, .75), (5.75, 67, .25), (6, 69, 2))   # 'Jingle bells, jingle bells, jingle all the way' (James Lord Pierpont, 1857; public domain): beats in half notes of the song
JB_CH = ((0, "F"), (2, "F"), (4, "F"), (5, "C7"), (6, "F"))


def cue_title22(T, t0, d, beats, D):
    """The gift (6.8 s), on a 120 bpm grid (beats on 0.3 + 0.5k). Bar 1 (0.3 to 2.3): the series' theme (the arpeggio F A C F C A C F) on a celesta in eighths over a pizzicato bass (F, C on every
    beat) and a soft string pad; the ribbon (1.1) a harp glissando up the F major scale; the first rip (1.8) a pizzicato chord and a snare tap. THE SECOND RIP (2.3) is the downbeat of bar 2:
    tutti F major (a brass stab, a timpani, a bass drum, a cymbal, the strings). From 2.8 Jingle Bells' first phrase ('Jingle bells, jingle bells, jingle all the way') on a celesta and a
    glockenspiel in eighths over the bass; on the text ding (5.2) a celesta glint; the last A (5.8) over a held F major (strings, a horn, a felt piano) to the cut."""
    bl = .5
    a = t0 + .3
    ribbon = cue_abs("ribbonpull", "title") or t0 + 1.1
    rips = [cue_abs("paperrip", "title", j) for j in range(2)]
    for j, m in enumerate(MT_ARP):
        at = a + j * bl / 2
        T.put(celesta(m + 5 + 12, .5, .6), at, .05 * (.7 + .3 * (j % 4 == 0)), .2)
    for k in range(4):
        T.put(pz((41, 48)[k % 2], .35), a + k * bl, .12, -.1)
    T.put(strings([53, 57, 60, 65, 69], 2.0, .4, .5, 5.0, 2400), a, .03, 0)
    gliss(T, ribbon, 65, 89, .45, harpn, .04, .25, root=5, scale=(0, 2, 4, 5, 7, 9, 11))
    r1 = rips[0] or t0 + 1.8
    for m in (53, 60, 65, 69):
        T.put(pz(m, .25), r1, .05, .1)
    D.put(snare(.12), r1, .03, .1)
    land = rips[1] or t0 + 2.3
    T.put(brass([53, 57, 60, 65], .4, .01, .18, 2400), land + .01, .06, 0)
    D.put(timp(87.3, 1.1), land, .1, 0)
    D.put(bdrum(.8, .8), land, .08, 0)
    D.put(crash(1.2) * np.exp(-tarr(1.2) / .3), land + .01, .035, .15)
    T.put(strings([41, 53, 57, 60, 65, 69], 1.2, .02, .8, 5.0, 2600), land, .08, 0)
    jb = t0 + 2.8                                                               # the song's quarter is an eighth here (0.25 s): JB's beats are in units of 0.5 s
    for b, m, du in JB:
        T.put(celesta(m + 12, min(1.2, du * bl * 1.2), .7), jb + b * bl, .055, .2)
        T.put(bell(midi(m + 24), .5) * .5, jb + b * bl, .014, .35)
    for b, ch in JB_CH:
        at = jb + b * bl
        T.put(pz(ROOT22[ch], .35), at, .09, -.1)
        comp(T, at + bl / 2, [m + 12 for m in CH22[ch][1:]], .25, .022, .3)
    T.put(celesta(101, 1.0, .6), (cue_abs("textding", "title") or t0 + 5.2) + .03, .04, .35)
    fin = jb + 6 * bl
    T.put(strings([41, 53, 57, 60, 65, 69], t0 + d - fin + .2, .3, .6, 5.0, 2400), fin, .09, 0)
    T.put(horn(57, 1.0, .5, a=.1, r=.4), fin, .035, .1)
    T.put(felt(53, 1.2, .5), fin, .05, -.1)
    T.fade(t0 + d - .6, t0 + d, 1, 0)
    D.fade(t0 + d - .6, t0 + d, 1, 0)
    INFO["title"] = "the theme in F at 120 bpm (beats on 0.3 + 0.5k), the ribbon a harp glissando (1.10), the second rip the downbeat of bar 2 (%.2f, tutti), Jingle Bells from 2.80, a glint on the ding" % (land - t0)


# ================================================================ draw: Jingle Bells under Tomato, the deflating tuba, Binder, the computing, the cash register
def blip(m, d=.09, fc=1500.0, vel=.8):
    """Binder's computing: a square and a detuned saw through a low-pass at `fc`, a fast pluck: a small clean digital blip."""
    t = tarr(d)
    f = midi(m)
    x = np.sign(np.sin(2 * np.pi * f * t)) * .5 + osc("saw", f * 1.006, d) * .5
    y = lp(x, fc, 2) + .4 * bp(x, fc * .8, fc * 1.25, 2)
    return y * np.minimum(1, t / .002) * np.exp(-t / (d * .4)) * ar(d, .001, min(.02, d * .3)) * (.5 + .5 * vel)


def bounce(T, D, a, bl, lvl=1.0, until=None, melody=True, bars=2, seed=0):
    """The bouncy Jingle Bells groove from `a` (a beat is `bl`): a pizzicato bass on the beats (the root, the fifth), the chord on the off-beats (pizzicato and a celesta), sleigh bells on the
    off-eighths and, if `melody`, the chorus's first phrase on a celesta and a glockenspiel (the song's quarter is a beat). Stops at `until`."""
    end = until if until is not None else a + bars * 4 * bl
    for k in range(int(bars * 4)):
        at = a + k * bl
        if at >= end - .05:
            break
        ch = "C7" if (k // 4) % 2 == 1 and k % 4 >= 2 else "F"
        T.put(pz(ROOT22[ch] + (7 if k % 2 else 0), .3), at, .11 * lvl, -.1)
        comp(T, at + bl / 2, [m + 12 for m in CH22[ch][1:]], .2, .028 * lvl, .3)
        shake(T, at + bl / 2, .1, 7, .022 * lvl, .35, seed + k)
    if melody:
        for b, m, du in JB:
            at = a + 2 * b * bl
            if at < end - .05:
                T.put(celesta(m + 12, min(1.0, 2 * du * bl), .7), at, .06 * lvl, .2)
                T.put(bell(midi(m + 24), .4) * .5, at, .02 * lvl, .35)


def cue_draw22(T, t0, d, beats, D):
    """3:15 PM, THE DRAW (30.1 s). Jingle Bells, bouncy (132 bpm: a pizzicato bass, the chord on the off-beats, sleigh bells, the tune on a celesta) under Tomato's 'Secret Santa! Ten dollar limit!'
    and lighter under Onion; a flat bassoon on each 'candle'; a hopeful celesta on 'list?' and A DEFLATING TUBA on 'You're per diem.' (an F that sags five semitones); Binder's jingle (F G A C on a
    marimba and a glockenspiel) under his offer; a brass hit on 'Yes!'. THE DRAW: a soft tick while the hat is shaken, then from the first name a COMPUTING ARPEGGIO (Binder's blips and a celesta
    climbing the F major arpeggio, speeding up from 8 to 22 notes a second, the filter opening) that LANDS ON THE DING (an F major chord on glass, a celesta and a pizzicato F). A low tremolo and a
    timpani under 'Everyone drew Strawberry.'; a pizzicato question; Onion's choir on 'Per policy, that is allowed.'; the groove again for 'Ten dollars each!'; A CASH-REGISTER HIT under 'a
    hundred and twenty dollars' (on 'dollars'); a festive flourish for 'Merry Christmas!'."""
    t1, o1, m1, l0, s1, t2, b1, t3, dr, l1, s2, b2, o2, t4, s3, t5 = (beats[k] for k in ("t1", "o1", "m1", "l0", "s1", "t2", "b1", "t3", "draw", "l1", "s2", "b2", "o2", "t4", "s3", "t5"))
    bl = 60 / 132
    bounce(T, D, t0 + .3, bl, 1.0, until=m1[0] - .1, bars=3, seed=10)
    T.put(bassoon(41, .5, .8), W("m1", "candle") + .05, .08, -.1)
    T.put(bassoon(40, .55, .8), W("l0", "candle") + .05, .08, -.1)
    T.put(celesta(84, .6, .6), W("s1", "list") + .02, .045, .3)
    T.put(celesta(89, .7, .6), W("s1", "list") + .14, .04, .3)
    T.put(sagtuba(41, 1.1, 5.0), W("t2", "per") - .02, .16, 0)
    for j, m in enumerate((77, 79, 81, 84)):
        T.put(marimba(midi(m), .25), b1[0] + .05 + j * .12, .07, -.1)
        T.put(bell(midi(m + 12), .6) * .5, b1[0] + .05 + j * .12, .04, .25)
    for j in range(4):
        T.put(ubass((41, 48)[j % 2], .35, .7), b1[0] + .05 + j * .5, .09, -.1)
    hp_ = W("b1", "help")
    for j, m in enumerate((77, 79, 81, 84)):
        T.put(marimba(midi(m + 12), .2), hp_ + .02 + j * .08, .04, .1)
    hit = t3[0] - .02
    T.put(brass([53, 57, 60, 65, 69], .3, .006, .12, 2600), hit, .08, 0)
    D.put(timp(87.3, .8), hit, .09, 0)
    sh = cue_abs("shuffle", "draw") or dr[0] + .1
    w0 = cue_abs("namewhoosh", "draw") or dr[0] + .8
    dg = cue_abs("ding", "draw") or dr[0] + 3.2
    k = 0
    while sh + k * .125 < w0 - .05:
        D.put(woodblock(.05) * .6, sh + k * .125, .012 + .006 * (k % 2 == 0), .2)
        k += 1
    arp = [m for m in range(65, 102) if m % 12 in (5, 9, 0)]
    at, j = w0, 0
    span = dg - w0
    while True:
        u = (at - w0) / span
        if at > dg - .03:
            break
        m = arp[j % len(arp)] if j < len(arp) else arp[-3 + j % 3]
        T.put(blip(m, .08, 900 + 3500 * u, .8), at, .03 + .04 * u, -.5 + 1.0 * ((j * 5) % 9) / 8)
        if j % 2 == 0:
            T.put(celesta(min(m + 12, 101), .3, .6), at, .02 + .02 * u, .3)
        at += .125 - .08 * u ** .8
        j += 1
    for m in (89, 93, 96):
        T.put(glass(m, 1.2, .05, .8), dg + .06, .016, .25)
    T.put(celesta(89, 1.0, .7), dg + .07, .035, .3)
    T.put(pz(41, .5), dg + .01, .1, -.1)
    D.put(timp(87.3, .8), dg + .01, .035, 0)
    T.put(trem_strings([41, 48], l1[1] - l1[0] + .3, 10.0, .3, .3, 1800), l1[0], .05, 0)
    D.put(timp(87.3, .9), W("l1", "strawberry"), .08, 0)
    for j, m in enumerate((60, 64, 67)):
        T.put(pz(m, .2), s2[0] + .08 + .12 * j, .05, .2)
    T.put(choir([65, 69, 72, 77], o2[1] - o2[0] + .4, "a", a=.25, r=.5), o2[0] - .05, .06, 0)
    gliss(T, o2[0], 65, 89, .5, harpn, .04, .2, root=5)
    T.put(celesta(93, 1.0, .6), W("o2", "allowed") + .05, .045, .3)
    bounce(T, D, t4[0] - .05, bl, .9, until=t4[1] + .35, bars=1, seed=40)
    rg = W("s3", "dollars") - .03
    T.put(register(3), rg, .09, .15)
    T.put(brass([53, 58, 62, 65], .22, .005, .1, 2800), rg + .02, .06, 0)
    D.put(timp(87.3, .5), rg + .02, .05, 0)
    a5 = t5[0] - .05
    for b, m, du in ((0, 69, .5), (.5, 72, .5), (1, 65, .75), (1.75, 67, .25), (2, 69, 1)):
        T.put(celesta(m + 12, .6, .7), a5 + b * bl, .06, .2)
        T.put(pz(m, .25), a5 + b * bl, .04, .25)
    for k in range(3):
        T.put(pz((41, 48, 41)[k], .3), a5 + k * bl, .1, -.1)
        shake(T, a5 + k * bl + bl / 2, .1, 7, .022, .35, 60 + k)
    T.put(strings([53, 57, 60, 65], .9, .05, .4, 5.0, 2600), a5 + 2 * bl, .05, 0)
    sg = cue_abs("sting", "draw") or t5[1] + .4
    T.fade(sg - .25, sg + .05, 1, 0)
    T.gate(sg + .05, t0 + d + 1, 0.0, .02)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)
    INFO["draw"] = "Jingle Bells bouncy at 132 bpm from 0.30 under Tomato; the deflating tuba on 'per' (%.2f); the computing arpeggio %.2f to the ding %.2f; the cash register on 'dollars' (%.2f)" % (
        W("t2", "per") - t0, w0 - t0, dg - t0, rg - t0)


# ================================================================ wrap: the pizzicato wrapping cue, the label, the balloons
WRAP_MEL = (67, 72, 76, 72, 67, 72, 76, 79, 77, 76, 74, 72, 71, 74, 79, 77, 76, 79, 84, 79, 76, 72, 67, 72)    # 24 eighths in C: G C E C G C E G | F E D C B D G F | E G C G E C G C
WRAP_BASS = (48, 43, 48, 43, 50, 43, 47, 43, 48, 43, 40, 36)


def cue_wrap22(T, t0, d, beats, D):
    """6:00 PM, THE WRAPPING (26.2 s). 'When?' one low pizzicato C and a bassoon. THE WRAP (3.26 to 9.26): a light pizzicato wrapping cue in C at 120 bpm from the wrap's start (a perky line in eighths
    on pizzicato violins, a pizzicato bass on the beats, a woodblock on the off-beats), no note within 60 ms of a foley cue, the line falling away under the breath into the glove (from the
    inflation) while a harp climbs with it, a plink when the knot is tied. A celesta on 'festive'; two deadpan notes on 'Pudding. Sugar free.'; three rising ticks on 'Dated, timed, initialed.'; a
    warm celesta on 'twelve'. THE BALLOONS (19.12 to 21.52): squeaky-toy notes in rhythm (eighths, C E G E C E G C) and a TOY-PIANO FLOURISH up two octaves as the balloons rise, landing on the
    ceiling's bump with a soft chord. Onion's two notes of bass clarinet on 'latex hazard'; a pizzicato button after 'They're nitrile.'."""
    m1, s1, wr, m2, s2, m3, s2b, o1, s3, pe1, s4, bal, o2, s5 = (beats[k] for k in ("m1", "s1", "wrap", "m2", "s2", "m3", "s2b", "o1", "s3", "pe1", "s4", "balloons", "o2", "s5"))
    T.put(pz(36, .4), s1[1] + .05, .1, -.1)
    T.put(bassoon(36, .5, .8), s1[1] + .07, .06, -.1)
    foley = [cue_abs(n, "wrap", j) for n in ("chuxrustle", "chuxfold", "tapepull", "glovesnap", "gloveinflate", "glovesqueak", "labelgun", "balloonbonk") for j in range(3)]
    foley = [x for x in foley if x is not None]
    a = wr[0]
    bl = .5
    inf = cue_abs("gloveinflate", "wrap") or a + 4.3
    for j, m in enumerate(WRAP_MEL):
        at = a + j * bl / 2
        if near(at, foley):
            continue
        g = .034 * (1.0 if at < inf - .05 else .35)
        T.put(pz(m, .2), at, g, .25 - .1 * (j % 2))
    for k, m in enumerate(WRAP_BASS):
        at = a + k * bl
        if near(at, foley):
            continue
        T.put(pz(m, .3), at, .06 * (1.0 if at < inf else .5), -.1)
        if not near(at + bl / 2, foley):
            D.put(woodblock(.06) * .5, at + bl / 2, .008 * (1.0 if at < inf else .4), .3)
    gliss(T, inf + .05, 60, 84, .9, harpn, .03, .1, root=0)
    kn = cue_abs("glovesqueak", "wrap") or wr[1] - .6
    T.put(pz(84, .3), kn + .3, .05, .2)
    T.put(pz(72, .3), kn + .3, .05, .2)
    T.put(celesta(84, .5, .6), W("s2", "festive") + .02, .04, .3)
    T.put(celesta(88, .5, .6), W("s2", "festive") + .12, .035, .3)
    T.put(celesta(91, .7, .6), W("s2", "festive") + .22, .03, .3)
    T.put(pz(48, .3), W("s2b", "pudding") + .05, .07, -.1)
    T.put(pz(43, .35), W("s2b", "free") + .05, .07, -.1)
    for j, w in enumerate(("dated", "timed", "initialed")):
        at = W("s3", w)
        if at and not near(at, foley, .04):
            T.put(xylo(79 + 2 * j, .2, .8), at + .02, .045, .2)
    tw = W("s4", "twelve")
    for j, m in enumerate((72, 76, 79, 84)):
        T.put(celesta(m + 12, .8, .6), tw + .02 + .07 * j, .04, .3)
    ba = bal[0]
    bonk = cue_abs("balloonbonk", "wrap") or bal[0] + 1.8
    for j, m in enumerate((72, 76, 79, 76, 72, 76, 79, 84)):
        at = ba + j * .25
        if at < bonk - .1 and not near(at, foley):
            T.put(squeaky(m, .14, .8), at, .034, (-.4, .4)[j % 2])
    fl = [m for m in range(72, 97) if m % 12 in (0, 4, 7, 2, 5, 9, 11)]
    f0 = ba + .5
    for j, m in enumerate(fl):
        at = f0 + (bonk - .02 - f0) * j / len(fl)
        T.put(toypiano(m, .5, .7), at, .034 + .016 * j / len(fl), -.3 + .6 * j / len(fl))
    for m in (72, 76, 79, 84):
        T.put(toypiano(m, 1.0, .6), bonk, .03, .1)
    T.put(celesta(96, 1.0, .6), bonk + .02, .03, .3)
    T.put(bassclar(52, .35, .8, a=.03, r=.08), W("o2", "latex") + .03, .07, -.2)
    T.put(bassclar(48, .5, .8, a=.03, r=.12), W("o2", "hazard") + .03, .07, -.2)
    T.put(pz(48, .3), s5[1] + .06, .09, -.1)
    T.put(pz(55, .3), s5[1] + .06, .07, .1)
    sg = cue_abs("sting", "wrap") or s5[1] + .4
    T.gate(sg - .02, t0 + d + 1, 0.0, .02)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)
    INFO["wrap"] = "pizzicato wrapping cue in C at 120 bpm %.2f to %.2f (no note within 60 ms of the foley); squeaky balloons from %.2f and the toy-piano flourish to the bump at %.2f" % (
        a - t0, wr[1] - t0, ba - t0, bonk - t0)


# ================================================================ santa: Deck the Halls as an oompah, the search, the heavenly Hoyer
DECK = ((0, 72, 1.5), (1.5, 70, .5), (2, 69, 1), (3, 67, 1), (4, 65, 1), (5, 67, 1), (6, 69, 1), (7, 65, 1), (8, 67, .5), (8.5, 69, .5), (9, 70, .5), (9.5, 67, .5), (10, 69, 1.5),
        (11.5, 67, .5), (12, 65, 1), (13, 64, 1), (14, 65, 2))                      # Deck the Halls (traditional Welsh): 'Deck the halls with boughs of holly, fa la la la la, la la la la'
DECK_H = ("F", "C7", "F", "F", "C7", "F", "C7", "F")                                # the harmony of each half bar


def oompah(T, D, a, bl, until, lvl=1.0, mel=True, beats=16, seed=0):
    """Deck the Halls as an oompah band from `a` (a beat is `bl`): a tuba on beats one and three (the root, the fifth), the brass's 'pah' on two and four, a soft bass drum on one, the tune on a
    glockenspiel and a muted trumpet. Nothing starts at or after `until`."""
    for k in range(beats):
        at = a + k * bl
        if at >= until - .02:
            break
        ch = DECK_H[(k // 2) % 8]
        if k % 2 == 0:
            T.put(tuba(ROOT22[ch] + (7 if k % 4 == 2 else 0), bl * .8), at, .14 * lvl, -.05)
            if k % 4 == 0:
                D.put(bdrum(.5, .4), at, .03 * lvl, 0)
        else:
            T.put(brass([m for m in CH22[ch][1:]], bl * .45, .006, .06, 2200), at, .035 * lvl, .2)
    if mel:
        for b, m, du in DECK:
            at = a + b * bl
            if at >= until - .02:
                break
            T.put(bell(midi(m + 12), .6) * .5, at, .035 * lvl, .3)
            T.put(mtrumpet(m, min(du * bl * .9, until - at), .8), at, .03 * lvl, .1)


def cue_santa22(T, t0, d, beats, D):
    """7:30 PM, SANTA'S VISIT (27.6 s). DECK THE HALLS AS AN OOMPAH (120 bpm from the sleigh bells: a tuba, the brass's 'pah', a bass drum, the tune on a glockenspiel and a muted trumpet) under 'Ho ho
    ho!' and the fall-risk screening, a slide whistle down the chimney on 'Down', the last 'la' cut off by 'Gait belt.'. THE BELT: a pizzicato run up into the buckle, a xylophone zip and a chord on
    the tug. 'Ho ho... what?': the oompah starts again for two beats and dies on 'what?' (one low tuba blat). Tomato's proud pizzicato. THE SEARCH: a frantic fa-la-la at 200 bpm, the rips on its
    beats, stopped for the teeth (a glockenspiel 'ta-da'). A fa-la-la button after 'Merry Christmas!'; a sad tuba 'womp womp' on 'I can't get up.'; a pizzicato call to action. THE HOYER: a walking
    pizzicato as it rolls in, then A MOCK-HEAVENLY CHOIR AND ORGAN that rise with the lift (F, B-flat, C, F an octave up, a harp sweeping up, a cymbal swell) and LAND on 'This is the best
    Christmas.' (a full F major held under the line, an 'Amen' (B-flat to F) on 'Christmas')."""
    me1, o1, me2, o2, bt, cr1, me3, t1, se, s1, cr2, me4, l1, hy, me5 = (beats[k] for k in ("me1", "o1", "me2", "o2", "belt", "cr1", "me3", "t1", "search", "s1", "cr2", "me4", "l1", "hoyer", "me5"))
    bl = .5
    oa = me1[0] - .2                                                            # the band strikes up with 'Ho ho ho!' (Santa's sleigh bells ring alone before it)
    oompah(T, D, oa, bl, o2[0] - .04, 1.0, beats=16, seed=1)
    T.gate(o2[0] - .04, o2[0] + .1, 0.0, .03)
    dn = W("me2", "down")
    T.put(slide_whistle(86, 70, .5), dn + .02, .03, .25)
    bk = cue_abs("beltbuckle", "santa") or bt[0] + .4
    tg = cue_abs("belttug", "santa") or bt[0] + .9
    for j, m in enumerate((60, 62, 64, 65)):
        T.put(pz(m, .15), bk - .36 + .09 * j, .05, .2)
    for j, m in enumerate(range(72, 90, 2)):
        T.put(xylo(m, .1, .7), tg - .16 + j * .017, .02, -.2)
    for m in (53, 60, 65, 69):
        T.put(pz(m, .3), tg + .03, .05, .1)
    h0 = W("me3", "ho")
    oompah(T, D, h0, .4, h0 + .78, 1.0, mel=False, beats=2, seed=2)
    T.put(bell(midi(84), .5) * .5, h0, .035, .3)
    T.put(bell(midi(81), .5) * .5, h0 + .4, .035, .3)
    wt_ = W("me3", "what")
    T.put(tuba(36, .22), wt_ + .02, .16, 0)
    for j, m in enumerate((65, 69, 72, 77)):
        T.put(pz(m, .2), t1[0] + .1 + .1 * j, .05, .2)
    T.put(celesta(89, .6, .6), t1[1] - .1, .035, .3)
    rp = [cue_abs("paperrip", "santa", j) for j in range(4)]
    r0 = rp[0] or se[0] + .2
    teeth = cue_abs("dentureclack", "santa") or se[0] + 2.8
    fb = .3
    fa = ((0, 67), (.5, 69), (1, 70), (1.5, 67), (2, 69), (3, 67), (3.5, 65), (4, 64), (5, 65), (6, 67), (6.5, 69), (7, 70), (7.5, 67), (8, 69))
    k = -1
    while r0 + k * fb < teeth - .12:
        at = r0 + k * fb
        ch = ("C7", "F")[(k // 2) % 2] if k >= 0 else "C7"
        if k % 2 == 0:
            T.put(tuba(ROOT22[ch], fb * .7), at, .08, -.05)
        else:
            T.put(brass([m for m in CH22[ch][1:]], fb * .4, .004, .05, 2400), at, .021, .2)
            D.put(snare13(.6), at, .02, .1)
        k += 1
    for b, m in fa:
        at = r0 + b * fb
        if at < teeth - .12:
            T.put(xylo(m + 12, .12, .8), at, .028, .25)
    T.put(bell(midi(96), .8) * .6, teeth + .34, .045, .3)
    T.put(brass([65, 69, 72], .25, .005, .12, 2600), teeth + .34, .04, 0)
    for j, m in enumerate((72, 70, 69, 67, 65)):
        T.put(celesta(m + 12, .4, .6), cr2[1] + .05 + j * .11, .045, .3)
    up = W("me4", "up")
    sad_trombone(T, up + .08, [(41, .3), (40, .3), (39, .55)], .08, -.05)
    for j, m in enumerate((53, 60, 65)):
        T.put(pz(m, .2), l1[0] + .15 + .13 * j, .06, .2)
    D.put(snare(.1), l1[0] + .41, .02, .1)
    ro = cue_abs("hoyerroll", "santa") or hy[0] + .1
    for j, m in enumerate((41, 43, 45, 46, 48)):
        T.put(pz(m, .25), ro + .02 + .12 * j, .045, -.15)
    lf = cue_abs("hoyerlift", "santa") or hy[0] + 1.2
    land = me5[0]
    steps = (("F", (53, 60, 65, 69)), ("Bb", (58, 62, 65, 70)), ("C", (60, 64, 67, 72)), ("F", (65, 69, 72, 77)))
    seg = (land - lf) / len(steps)
    for j, (nm, notes) in enumerate(steps):
        at = lf + j * seg
        T.put(choir(list(notes), seg + .35, "a", a=.12, r=.3), at, .045 + .012 * j, 0)
        T.put(organ([n - 12 for n in notes], seg + .25, .7), at, .03 + .008 * j, 0)
    gliss(T, lf + .1, 65, 101, land - lf - .15, harpn, .03, .2, root=5)
    D.put(riser(land - lf, 800, 6000, .4), lf, .015, 0)
    D.put(crash(1.4) * np.exp(-tarr(1.4) / .5), land - .02, .03, .1)
    hold = me5[1] - land + .4
    T.put(choir([53, 57, 60, 65, 69, 72], hold, "a", a=.08, r=.5), land, .085, 0)
    T.put(organ([41, 53, 60, 65, 69], hold, .8), land, .045, 0)
    am = W("me5", "christmas")
    T.put(organ([46, 58, 62, 65], .55, .7), am - .05, .03, 0)
    T.put(celesta(89, 1.2, .6), land + .03, .045, .3)
    T.put(harp(77, 1.5, .6), land + .02, .04, .2)
    sg = cue_abs("sting", "santa") or me5[1] + .4
    T.fade(sg - .4, sg + .02, 1, 0)
    T.gate(sg + .02, t0 + d + 1, 0.0, .02)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)
    INFO["santa"] = "Deck the Halls oompah at 120 bpm %.2f to %.2f ('Gait belt.' cuts it); the search at 200 bpm from %.2f (rips on the beats), the teeth %.2f; the heavenly choir and organ %.2f to %.2f, landing on 'This is the best Christmas.'" % (
        oa - t0, o2[0] - t0, r0 - t0, teeth - t0, lf - t0, land - t0)


# ================================================================ swap: the gallop, the candles, Brenda's music box, the pile, 'Pudding!'
def cue_swap22(T, t0, d, beats, D):
    """9:00 PM, THE EXCHANGE (26.9 s). A snare roll under 'Everybody open at once!' into THE RIP: A FRENZIED GALLOP (Jingle Bells at 200 bpm in 2/4 from the first rip: a tuba and a pizzicato bass on
    the beats, brass and a snare on the off-beats, the tune on a xylophone in eighths, the four rips on its eighths), stopped dead before 'A candle.'. A DEADPAN LOW NOTE PER 'A candle.' (the same F,
    a pizzicato and a bassoon, every time, and once more for 'It's the same candle.'). BRENDA'S MUSIC BOX through the closet door (her snow-day tune, slow, muffled). A pizzicato climb into THE
    PILE: a cascade falling from F6 to F3 (a xylophone, pizzicato and a harp, faster as it goes) that LANDS ON THE LAST GIFT'S THUMP (a woodblock, a timpani, a choked cymbal). Onion's choir on
    'Yellow. Fall risk.'; a fanfare that sags on 'okayest'; a warm celesta and strings under 'And these are from me.'; A TRIUMPHANT HIT ON 'Pudding!' (brass, a timpani, a cymbal, a bass drum,
    sleigh bells, the strings)."""
    t1, rp, l1, m1, o1, t2, br1, l2, pl, s1, o2, s2, l3, s3, s4, st1 = (beats[k] for k in ("t1", "rip", "l1", "m1", "o1", "t2", "br1", "l2", "pile", "s1", "o2", "s2", "l3", "s3", "s4", "st1"))
    g0 = cue_abs("paperrip", "swap") or rp[0] + .1
    a = t1[0] + .4
    t = a
    while t < g0 - .02:
        u = (t - a) / max(.1, g0 - a)
        D.put(snare(.1), t, .006 + .03 * u ** 1.5, .15 * np.sin(t * 40))
        t += 1 / (12 + 12 * u)
    stop = l1[0] - .1
    bl = .3
    k = 0
    while g0 + k * bl < stop - .05:
        at = g0 + k * bl
        ch = ("F", "F", "F", "F", "F", "C7", "F", "F")[(k // 2) % 8]
        T.put(tuba(ROOT22[ch] + (7 if k % 2 else 0), bl * .6), at, .08, -.05)
        T.put(pz(ROOT22[ch] + (7 if k % 2 else 0), .2), at, .04, -.1)
        if at + bl / 2 < stop - .05:
            T.put(brass(list(CH22[ch][1:]), bl * .3, .003, .04, 2600), at + bl / 2, .024, .2)
            D.put(snare13(.7), at + bl / 2, .025, .1)
        k += 1
    D.put(crash(.8) * np.exp(-tarr(.8) / .2), g0, .03, .15)
    for b, m, du in JB:
        at = g0 + b * bl
        if at < stop - .05:
            T.put(xylo(m + 12, .12, .9), at, .034, .25)
            T.put(pz(m, .15), at, .02, .25)
    D.put(crash(.4) * np.exp(-tarr(.4) / .04), stop - .12, .04, .1)
    T.gate(stop - .05, l1[0] + .2, 0.0, .02)
    for ln in ("l1", "m1", "o1"):
        at = W(ln, "candle") + .03
        T.put(pz(41, .45), at, .14, -.05)
        T.put(bassoon(41, .45, .8), at, .07, -.05)
    sc = W("t2", "candle") + .03
    T.put(pz(41, .5), sc, .14, -.05)
    T.put(bassoon(41, .6, .8), sc, .08, -.05)
    lb = .9
    LT = Track(T.N)
    for b, m, du in SDT:
        if b >= 8:
            continue
        at = br1[0] + .1 + b * lb
        if at > br1[1] + .3:
            break
        LT.put(music_box(midi(m + 5), min(du * lb * 2 + .4, 1.6)), at, .07, .35)
    LT.put(strings([41, 48, 53, 57], br1[1] - br1[0] + .4, .8, .6, 4.8, 1200), br1[0], .022, .3)
    LT.buf = np.stack([lp(LT.buf[0], 1400, 2), lp(LT.buf[1], 1400, 2)])
    T.buf += LT.buf
    for j, m in enumerate((65, 67, 69, 70, 72, 74, 76, 77)):
        T.put(pz(m, .15), l2[0] + .35 + j * .2, .04 + .004 * j, .2)
    gp = cue_abs("giftpile", "swap") or pl[0] + .2
    th = cue_abs("giftthump", "swap") or pl[0] + 1.2
    notes = [m for m in range(89, 52, -1) if m % 12 in (5, 7, 9, 10, 0, 2, 4)]
    span = th - gp
    for j, m in enumerate(notes):
        u = j / max(1, len(notes) - 1)
        at = gp + span * (1 - (1 - u) ** 1.35) * .96
        if at > th - .04:
            break
        inst = (lambda mm: xylo(mm, .2, .8)) if m > 72 else (lambda mm: pz(mm, .2))
        T.put(inst(m), at, .035, -.5 + 1.0 * ((j * 7) % 11) / 10)
        if j % 3 == 0:
            T.put(harpn(m - 12), at, .018, .2)
    D.put(woodblock(), th + .02, .035, .05)
    D.put(timp(87.3, .9), th + .02, .055, 0)
    D.put(crash(.4) * np.exp(-tarr(.4) / .06), th + .02, .022, .1)
    T.gate(th + .05, s1[0] - .02, 0.0, .03)
    T.put(choir([65, 69, 72, 77], o2[1] - o2[0] + .3, "a", a=.2, r=.4), o2[0] - .05, .05, 0)
    T.put(celesta(93, .8, .6), W("o2", "risk") + .05, .04, .3)
    ok = W("s3", "okayest")
    for j, m in enumerate((65, 69, 72)):
        T.put(mtrumpet(m, .16, .9), ok - .32 + .11 * j, .05, .1)
    T.put(slide_brass(72, 70, .6, 1400), ok + .02, .05, .1)
    T.put(sagtuba(48, .7, 2.0), ok + .02, .07, -.1)
    T.put(strings([53, 57, 60, 65, 69], s4[1] - s4[0] + .3, .4, .3, 4.5, 1800), s4[0] - .05, .05, 0)
    for j, m in enumerate((84, 81, 77)):
        T.put(celesta(m, .8, .6), s4[0] + .15 + .25 * j, .035, .3)
    hit = st1[0] - .02
    T.put(brass([53, 57, 60, 65, 69, 72], .45, .006, .18, 2800), hit, .1, 0)
    T.put(strings([41, 53, 60, 65, 69, 72], .9, .02, .5, 5.0, 2800), hit, .1, 0)
    D.put(timp(87.3, 1.0), hit, .11, 0)
    D.put(bdrum(.9, .9), hit, .09, 0)
    D.put(crash(1.4) * np.exp(-tarr(1.4) / .35), hit + .01, .05, .15)
    shake(T, hit, .5, 30, .06, .3, 90, 3600, 9500, .2)
    sg = cue_abs("sting", "swap") or st1[1] + .4
    T.fade(sg - .3, sg + .02, 1, 0)
    T.gate(sg + .02, t0 + d + 1, 0.0, .02)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)
    INFO["swap"] = "a roll into the gallop (Jingle Bells, 200 bpm) %.2f to %.2f; a low F per 'candle'; Brenda's music box from %.2f; the cascade %.2f to the thump %.2f; the hit on 'Pudding!' %.2f" % (
        g0 - t0, stop - t0, br1[0] - t0, gp - t0, th - t0, hit - t0)


# ================================================================ carol: THE TWELVE DAYS OF CHRISTMAS ON THE GRID (112 bpm, F major)
# The tune (traditional English; Frederic Austin's 1909 setting, public domain), re-barred so that each sung line begins on its bar's downbeat: (beat, midi, beats) per bar, and the harmony.
TWELVE = (((0, 60, .5), (.5, 60, .5), (1, 65, 1), (2, 65, .5), (2.5, 65, .5), (3, 65, .5), (3.5, 64, .5)),          # On the fifth day of Christ-mas
          ((0, 65, .5), (.5, 67, .5), (1, 69, .5), (1.5, 70, .5), (2, 67, .5), (2.5, 69, 1.5)),                          # my true love gave to me
          ((0, 72, 1.5), (1.5, 74, 1.0), (2.5, 71, .5), (3, 72, 1)),                                                    # FIVE GOLD-EN RINGS (broadened)
          ((0, 72, 1), (1, 70, .5), (1.5, 69, .5), (2, 67, 2)),                                                         # four call-ing birds
          ((0, 72, 1), (1, 70, 1), (2, 69, 2)),                                                                         # three French hens
          ((0, 67, 1), (1, 69, .5), (1.5, 70, .5), (2, 67, 2)),                                                         # two tur-tle doves
          ((0, 69, .5), (.5, 70, .5), (1, 72, .5), (1.5, 74, .25), (1.75, 70, .25), (2, 69, .5), (2.5, 65, .5), (3, 67, 1)),   # and a par-tri-dge in a pear
          ((0, 65, 3),))                                                                                                # tree
TWELVE_H = (((0, "F"), (3, "C7")), ((0, "F"), (1.5, "C7"), (2.5, "F")), ((0, "C"), (1.5, "G7"), (3, "C")), ((0, "F"), (1, "C7")), ((0, "F"), (1, "C7"), (2, "F")),
            ((0, "C7"), (1, "F"), (1.5, "Bb"), (2, "C7")), ((0, "F"), (1.5, "Bb"), (2, "F"), (3, "C7")), ((0, "F"),))
CAROL = {"g": []}


def carol_bar(T, D, b0, B, k, lvl=1.0, big=False):
    """One bar of the carol (k = 0 .. 7, the downbeat at b0, a beat B): the tune on a piano (and a celesta an octave up), the pizzicato bass on the downbeat (exactly on it) and on beat three,
    the piano's chord on two and four, light strings on each chord, sleigh bells (a shake on the downbeat, small ones on two and four). `big`: the broadening (bar 3)."""
    mel, har = TWELVE[k], TWELVE_H[k]
    for b, m, du in mel:
        at = b0 + b * B
        T.put(piano(m + 12, min(2.0, du * B * 1.6), .75), at, .07 * lvl * (1.12 if big else 1.0), .1)
        T.put(celesta(m + 24, min(1.2, du * B * 1.4), .6), at, .022 * lvl, .3)
        if big:
            T.put(horn(m, du * B * .95, .7, a=.04, r=.15), at, .032 * lvl, -.1)
            T.put(violin(m + 12, du * B * .95, vib=.005, a=.05, r=.12), at, .03 * lvl, .25)
    segs = list(har) + [(4, None)]
    for (hb, ch), (nb, _) in zip(segs[:-1], segs[1:]):
        at, dd = b0 + hb * B, (nb - hb) * B
        root = ROOT22[ch]
        T.put(strings([root + 12] + list(CH22[ch][1:]), dd + .1, .06 if not big else .03, .25, 5.0, 2200), at, (.022 if not big else .045) * lvl, 0)
        if big:
            T.put(strings([root, root + 12, root + 24], dd + .1, .03, .25, 5.0, 2000), at, .03 * lvl, 0)
    for beat in range(4):
        at = b0 + beat * B
        ch = [c for hb, c in har if hb <= beat][-1]
        root = ROOT22[ch]
        if beat in (0, 2):
            T.put(pz(root + (7 if beat == 2 and ch == [c for hb, c in har if hb <= 0][-1] else 0), .4), at, .12 * lvl, -.1)
            if big:
                T.put(cello(root, B * 1.8, .8, a=.02, r=.2), at, .032 * lvl, -.1)
        else:
            for q, m in enumerate(CH22[ch][1:]):
                T.put(piano(m, .45, .45), at + .004 * q, .022 * lvl, -.2)
    shake(T, b0, .16 if not big else .5, 10 if not big else 30, .035 * lvl * (1.3 if big else 1.0), .3, 200 + k, sw=.2)
    for beat in (1, 3):
        shake(T, b0 + beat * B, .1, 6, .016 * lvl, .35, 300 + 10 * k + beat)


def cue_carol22(T, t0, d, beats, D):
    """10:55 PM, THE CAROL (30.9 s). Before it, the tree's lights as a celesta twinkling now and then over the softest F major on strings. THE INTRO BAR (4.047 s): the pitch pipe gives F (the sfx), the
    residents hum it (a soft choir 'oo' on F), and on beats three and four the band counts in (the piano's F and C7, the pizzicato bass, a shake of bells). THE SEVEN BARS (112 bpm, the downbeats
    6.190 ... 19.048 s): The Twelve Days of Christmas (carol_bar): bar 3, 'five pudding cups!', BROADENS (a timpani roll and a cymbal swell into it, the tune doubled by a horn and violins, full
    strings in octaves over C, G7 and C, a cello, a roll of bells); bar 8 (21.190 s) RESOLVES ON F under 'That's not a carol.' (strings, the piano, a celesta, a soft timpani) and holds, softening,
    under 'It's a care plan.' until the door. A brass 'ta-da' on 'On time!'; a harp and a celesta on 'miracle'; A WARM CHORD HOLDS UNDER THE MOON (F major with an added ninth on strings, a soft
    choir 'oh', a celesta) into the sting."""
    pe1, s1, intro, s2, pe2, eg1, s3, mo1 = (beats[k] for k in ("pe1", "s1", "intro", "s2", "pe2", "eg1", "s3", "mo1"))
    script = CTX["script"] or {}
    bar = (script.get("carol") or {}).get("bar", 4 * 60 / 112)
    g = [intro[0] + k * bar for k in range(9)]
    CAROL["g"] = g
    B = bar / 4
    T.put(strings([41, 53, 57, 60, 65], intro[0] - t0 - .2, 1.2, .8, 4.5, 1300), t0 + .3, .018, 0)
    r = np.random.default_rng(2223)
    at = t0 + .6
    while at < intro[0] - .2:
        T.put(celesta(int(r.choice((89, 93, 96, 101))), .9, .5), at, .018, r.uniform(-.5, .5))
        at += r.uniform(.6, 1.1)
    T.put(choir([53, 65], g[1] - (g[0] + .4) + .05, "u", a=.4, r=.25), g[0] + .4, .02, 0)
    T.put(pz(41, .4), g[0] + 2 * B, .1, -.1)
    T.put(pz(48, .4), g[0] + 3 * B, .1, -.1)
    for q, m in enumerate((57, 60, 65)):
        T.put(piano(m, .5, .5), g[0] + 2 * B + .004 * q, .03, -.2)
    for q, m in enumerate((55, 58, 60, 64)):
        T.put(piano(m, .5, .5), g[0] + 3 * B + .004 * q, .03, -.2)
    shake(T, g[0] + 2 * B, .12, 8, .025, .3, 190)
    shake(T, g[0] + 3 * B, .12, 8, .028, .3, 191)
    for k in range(7):
        carol_bar(T, D, g[k + 1], B, k, 1.0, big=(k == 2))
    D.put(roll(87.3, 2 * B, 16) * np.interp(tarr(2 * B + .6), [0, 2 * B, 2 * B + .35], [.2, 1, 0]), g[3] - 2 * B, .035, 0)
    D.put(crash(2 * B) * np.interp(tarr(2 * B), [0, 2 * B], [0, 1]) ** 2, g[3] - 2 * B, .022, .1)
    D.put(timp(87.3 * 1.5, 1.2), g[3], .06, 0)
    D.put(crash(1.5) * np.exp(-tarr(1.5) / .4), g[3] + .005, .024, .15)
    res = g[8]
    door = cue_abs("doorchime", "carol") or eg1[0] - .3
    hold = door - res
    T.put(piano(65 + 12, 2.0, .7), res, .07, .1)
    T.put(strings([41, 48, 53, 57, 60, 65, 69], hold, .05, .5, 4.5, 2000), res, .07, 0)
    for q, m in enumerate((53, 57, 60, 65)):
        T.put(piano(m, 2.0, .5), res + .004 * q, .03, -.2)
    T.put(pz(41, .6), res, .12, -.1)
    T.put(celesta(89, 1.6, .6), res + .02, .035, .3)
    D.put(timp(87.3, 1.2), res, .05, 0)
    shake(T, res, .4, 22, .035, .3, 290, sw=.2)
    T.fade(res + 1.2, door - .02, 1, .45)
    T.gate(door - .02, mo1[0] - .3, 0.0, .03)
    ot = W("eg1", "on") - .02
    T.put(brass([53, 57, 60, 65], .14, .005, .06, 2600), ot - .14, .05, 0)
    T.put(brass([57, 60, 65, 69], .3, .005, .12, 2800), ot, .06, 0)
    D.put(timp(87.3, .6), ot, .06, 0)
    mi = W("s3", "miracle")
    gliss(T, mi - .1, 65, 96, .5, harpn, .035, .2, root=5)
    T.put(celesta(96, 1.0, .6), mi + .4, .04, .3)
    ma = mo1[0] - .2
    sg = cue_abs("sting", "carol") or mo1[1] + .5
    md = sg + .2 - ma
    T.put(strings([41, 48, 53, 57, 60, 67], md, .6, .5, 4.5, 1600), ma, .06, 0)
    T.put(choir([53, 57, 60, 65], md, "o", a=.6, r=.4), ma + .1, .035, 0)
    for j, m in enumerate((89, 93, 96)):
        T.put(celesta(m, 1.4, .5), ma + .3 + .45 * j, .025, .3 - .2 * j)
    T.fade(sg - .3, sg + .2, 1, 0)
    T.gate(sg + .2, t0 + d + 1, 0.0, .02)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)
    INFO["carol"] = ("The Twelve Days of Christmas in F at 112 bpm: the intro bar from %.3f (the pitch pipe at %.3f), downbeats %s s scene-local; bar 3 broadened; resolved on F at %.3f, held to the "
                     "door (%.2f); the warm chord under the Moon from %.2f") % (g[0] - t0, (cue_abs("pitchpipe", "carol") or 0) - t0, ", ".join(f"{x - t0:.3f}" for x in g[1:8]), res - t0,
                                                                             door - t0, ma - t0)


# ================================================================ end: the assignment sheet, the stamp
BL_E = .4875                       # the end card's beat (123 bpm): 0.1 to 4.0 s is two bars and the stamp is the downbeat of the third


def cue_end22(T, t0, d, beats, D):
    """The end card (7.5 s). 0.1 to 4.0 s: the series' theme in F (the arpeggio F A C F C A C F on pizzicato violins and a glockenspiel, twice) over a pizzicato bass on every beat, brushes, at
    123 bpm while the sheet types itself; THE STAMP (4.0) is the downbeat: APPROVED: an F major ninth (strings and a horn, a brass stab, a timpani, a bass drum, a felt piano), held and unresolved
    to the cut, a celesta on top; the text ding (5.1) sits inside it."""
    a = t0 + .1
    for rep in range(2):
        for i, m in enumerate(MT_ARP):
            at = a + (rep * 8 + i) * BL_E / 2
            T.put(pz(m + 5 + 12, .25), at, .06, .15)
            T.put(bell(midi(m + 5 + 24), .5) * .5, at, .018, .3)
    for k in range(8):
        T.put(pz((41, 48)[k % 2], .35), a + k * BL_E, .1, -.1)
    D.put(brush(.3), a + 2 * BL_E, .02, .2)
    D.put(brush(.3), a + 6 * BL_E, .02, .2)
    land = t0 + 4.0
    T.put(strings([41, 53, 60, 64, 67, 69, 72], 3.4, .12, 1.6, 5.0, 2400), land + .02, .11, 0)
    T.put(horn(57, 2.8, .6, a=.12, r=1.0), land + .03, .06, .1)
    T.put(brass([53, 60, 65, 69], .45, .03, .18, 2400), land + .05, .035, 0)
    D.put(timp(87.3, 1.4), land + .03, .05, 0)
    D.put(bdrum(.7, .8), land + .03, .045, 0)
    T.put(ubass(41, 2.4, .6), land, .14, -.1)
    T.put(felt(64, 3.0, .5), land + .02, .06, -.1)
    T.put(celesta(93, 2.4, .6), land + .7, .04, .3)
    shake(T, land, .5, 26, .04, .3, 390, sw=.2)
    T.fade(t0 + 6.4, t0 + 7.35, 1, 0)
    D.fade(t0 + 6.4, t0 + 7.35, 1, 0)
    INFO["end"] = "the theme in F at 123 bpm 0.1 to 4.0 s; the stamp the downbeat (4.0 s), F major ninth held"


# ================================================================ the cue table, levels and the score
CUES = {"title": cue_title22, "draw": cue_draw22, "wrap": cue_wrap22, "santa": cue_santa22, "swap": cue_swap22, "carol": cue_carol22, "end": cue_end22}
LEVEL22 = {"title": 1.8, "draw": 2.2, "wrap": 2.2, "santa": 2.2, "swap": 2.2, "carol": 2.9, "end": 1.8}
TAIL22 = {"title": .5, "draw": .4, "wrap": .4, "santa": .4, "swap": .4, "carol": .5, "end": .3}
DIP22 = {"title": 1.0, "draw": .62, "wrap": .62, "santa": .62, "swap": .62, "carol": .62, "end": 1.0}
REVERB22 = {"title": (.3, 1.0), "draw": (.3, 1.0), "wrap": (.25, .9), "santa": (.3, 1.1), "swap": (.25, .9), "carol": (.32, 1.2), "end": (.35, 1.3)}
DIPS22 = {"stamp": (4, .3, .3), "textding": (3, .2, .2), "paperrip": (2, .15, .15), "ribbonpull": (2, .3, .2), "ding": (3, .3, .3), "grin": (2, .5, .3), "binderpop": (2, .2, .2),
          "labelgun": (3.5, .12, .15), "glovesnap": (3, .15, .15), "gloveinflate": (3, .6, .3), "balloonbonk": (2, .2, .2), "beltbuckle": (3, .2, .2), "belttug": (3, .2, .2),
          "dentureclack": (4, .3, .3), "giftpile": (3, .6, .3), "giftthump": (4, .2, .3), "pitchpipe": (6, .9, .3), "doorchime": (3, .6, .3), "chuxrustle": (2, .5, .2),
          "tapepull": (2, .3, .2), "chuxfold": (2, .3, .2), "shuffle": (2, .5, .2), "hoyerroll": (2, .4, .2), "sleighbells": (3, .9, .3), "sting": (3, .6, .4),
          "ribbonzip": (4, .2, .2), "crinkle": (4, .45, .2), "jinglebells": (3, 1.6, .3), "namewhoosh": (2, .25, .15)}
DUCK_MIX = .62                     # the mixer's own duck of the music under speech (build_audio6: 1 - 0.62 x the smoothed speech gate)


def _mixer_gate(lines, N):
    """The mixer's own 'someone is talking' curve (build_audio6 main: 1 over each line from 80 ms before to 200 ms after, a 0.18 s moving average, clipped, to the power 0.6)."""
    sp = np.zeros(N)
    for ln in lines:
        sp[max(0, int((ln["s"] - .08) * SR)):int((ln["e"] + .2) * SR)] = 1.0
    return uniform_filter1d(sp, int(.18 * SR) | 1, mode="constant").clip(0, 1) ** .6


def _carol_curve(lines, N, base):
    """The carol's sung bars: the score's own dip is lifted (1.0) and the mixer's duck is evened out: from the first downbeat to the resolution the band is multiplied by (1 - 0.62) / (1 - 0.62 gate),
    so that after the mixer's duck it plays at one steady level (the ducked one) through the lines and the gaps between them; 0.15 s crossfades at both ends."""
    g = CAROL["g"]
    if not g:
        return base
    a, b = g[1] - .15, g[8] + .05
    gate = _mixer_gate(lines, N)
    i, j = max(0, int(a * SR)), min(N, int(b * SR))
    w = np.zeros(N)
    w[i:j] = 1.0
    k = int(.15 * SR) | 1
    w = uniform_filter1d(w, k, mode="constant")
    comp_ = (1 - DUCK_MIX) / (1 - DUCK_MIX * gate)
    return base * (1 - w) + comp_ * w


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
        wet, rt = REVERB22.get(sc["id"], (.3, 1.0))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL22.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP22.get(sc["id"], .6)
        dips = DIPCACHE.get(key)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        if sc["id"] == "carol":
            dips = _carol_curve(lines, N, dips)
        out[:, a:b] += seg * LEVEL22.get(sc["id"], 1.0) * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS22)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
