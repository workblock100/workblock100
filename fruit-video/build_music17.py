"""Episode 17 score: THE MODULE. A corporate training video.

build_audio17 (a copy of build_audio15's wrapper) calls score(script, scenes, lines, N) through --music build_music17; the mixer ducks the bed under every voice (and so does this file:
_speech_dip). Instruments and helpers come from build_music15 and build_music16 (the Merge theme in a new key, the tape stop, the stutter of a call that gives up); the shape of the score is the
same as Episode 15's: two tracks a scene (U through the room's reverb, D dry), muted spans applied after the reverb.

MOTIFS
  MERGE THEME   in F major (the title lands on the click at 2.80 s, so the bar is 2.6 s). Its last chord is F suspended (F G C) and it does not resolve: the title's tune ends on G, the end
                card holds F suspended-fourth (F B-flat C) and ticks. The progress bar that never finishes.
  BINDER JINGLE C D E G, cheerful in the assignment (marimba, glockenspiel, ukulele), curdled on 'Great! I'll help.'.
  ARTICHOKE THEME the elevator-jazz sax over a Rhodes, band-limited like the call; when the call glitches it stutters and drops out. Always a little too smooth.
  TOMATO'S PIZZICATO (major then minor) on her lines; ONION'S CLARINET SOB is not needed here (her one line is the certificate's).
  THE LOOPS: the video's progress bar is a two-bar loop that restarts every 1.2 s and never lands; the quiz's clock-out is a rising phrase that restarts before it reaches the top.
"""
import numpy as np

from build_audio import SR, tarr, osc, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pizz, marimba, bell, sub_bass, pad, strings, brass, hat, shaker, timp, roll, riser, impact, crash, tick, heart, kick, snare, clap, tom,
                          epiano, MUSIC_GAIN, _n)
from build_music7 import woodblock, taiko, choir, slide_brass
import build_music10 as M10
from build_music10 import tuba, mtrumpet, clarinet, violin, brush, cue_dips, slide_whistle
from build_music9 import grid, snap, uke, spic, rising
from build_music13 import _mute, _speech_dip, glass, revcym, sub_swell, ubass, kick13, snare13, cello, vib
from build_music14 import horn, trumpet, harp, celesta, xylo, bassoon, bdrum, tamtam
from build_music15 import (whistle, sax, sob_clar, bounce, callfx, stutter, stock, binder_bed, at_theme, accel_roll, stab, fanfare, cough, comp, CHORDS, ROOTS, BJ, BJ_MINOR, TP_MAJ, TP_MIN, W)
from build_music16 import merge_bar1, merge_land, merge_tune, tape_stop, BL16

MUTES = []
TR17 = 5            # F major


# ================================================================ helpers
def far_chime(T, at, g=.03):
    """A call light chiming somewhere down the hall: the series' ding (E6 then C6) low-passed and quiet, off to one side."""
    for j, m in enumerate((88, 84)):
        T.put(lp(bell(midi(m), 1.0), 2200, 2) * .5, at + .16 * j, g, .6)


def corporate(T, D, a, b, bpm=128.0, lvl=1.0, prog=("F", "C", "Dm", "Bb")):
    """Over-enthusiastic stock music from a to b: the office bed of Episode 15 (a ukulele on the offbeats, claps, a quantised marimba) with a glockenspiel sparkling on every off eighth and a
    kick on every beat; too happy for a Monday."""
    stock(T, D, a, b, bpm, lvl, prog)
    for k, at in enumerate(grid(a, b, bpm, .5)):
        ch = prog[(k // 8) % len(prog)]
        T.put(bell(midi(CHORDS[ch][k % 3] + 24), .6) * .4, at + 60 / bpm / 4, .03 * lvl, .3 if k % 2 else -.3)
        if k % 2 == 0:
            D.put(kick13(.7), at, .05 * lvl, 0)


def gameshow(T, D, a, b, bpm=132.0, lvl=1.0, prog=("C", "F", "G", "C")):
    """A quiz bed: a pizzicato bass walking the chord, a brass stab on every offbeat, a vibraphone arpeggio, a snare on 2 and 4 and a ticking clock (a woodblock and a tick on every beat)."""
    bl = 60 / bpm
    for k, at in enumerate(grid(a, b, bpm, 1.0)):
        bar, beat = divmod(k, 4)
        ch = prog[bar % len(prog)]
        T.put(ubass(ROOTS[ch] + (0, 7, 12, 7)[beat], .35, .75), at, .14 * lvl, -.1)
        T.put(brass(list(CHORDS[ch]), .12, .008, .05, 2000), at + bl / 2, .05 * lvl, .3)
        for q, m in enumerate(CHORDS[ch]):
            T.put(vib(m + 12, .5, .6), at + q * bl / 3, .035 * lvl, -.3 + .3 * q)
        D.put(woodblock(), at, .05 * lvl, .2)
        D.put(tick(), at + bl / 2, .03 * lvl, -.2)
        if beat in (1, 3):
            D.put(snare13(.7), at, .05 * lvl, 0)


def tick_run(D, a, b, r0, r1, g0, g1):
    """A clock whose tick speeds up from r0 to r1 a second between a and b, getting louder: the certificate's countdown."""
    t = a
    while t < b:
        u = (t - a) / (b - a)
        D.put(woodblock(), t, g0 + (g1 - g0) * u, .15 * (1 if int((t - a) * 4) % 2 else -1))
        D.put(tick(), t, (g0 + (g1 - g0) * u) * .6, 0)
        t += 1 / (r0 + (r1 - r0) * u ** 1.3)


# ================================================================ title and end
def cue_title17(T, t0, d, beats, D):
    """A learning-platform page becomes the title (6.2 s). 0.2 to 2.8: the Merge theme's first bar in F major on a marimba and a glockenspiel over a pizzicato bass and claps; the click (1.2)
    and the spinner (1.8) get woodblock ticks; on the click at 2.80 the landing: F suspended (F G C), brass and strings, a timpani; the tune (2.8 to 5.4) ends on G, which does not resolve; the
    text ding (4.0) a glockenspiel and harp shimmer, a held F-G-C pad that fades."""
    a, land = t0 + .2, t0 + 2.8
    merge_bar1(T, D, a, TR17, "uke")
    for at in (1.2, 1.8, 2.8):
        D.put(woodblock(), t0 + at, .07, .2 if at > 2 else -.2)
    merge_land(T, D, land, TR17, "uke", "sus2")
    merge_tune(T, D, land, 1, TR17, "uke")
    for k, m in enumerate((89, 91, 94, 98, 101)):
        T.put(celesta(m, 1.2, .8), t0 + 3.98 + .045 * k, .05, -.4 + .2 * k)
        T.put(harp(m - 12, 1.6, .6), t0 + 4.0 + .05 * k, .055, -.3 + .15 * k)
    T.put(pad([53, 55, 60, 67, 72], 2.0, .3, 1.0, 1700), t0 + 4.3, .09)
    T.fade(t0 + d - .6, t0 + d, 1, 0)
    D.fade(t0 + d - .6, t0 + d, 1, 0)


def cue_end17(T, t0, d, beats, D):
    """The end card (7.0 s): the Merge theme in full corporate band in F major. Bar 1 (0.1 to 2.7) the arpeggio and the landing on F suspended at 2.7; the tune over F C / Dm Bb; the
    stamp (4.0) gets a bass drum. The last chord (5.3 to 7.0) is F suspended-fourth (F B-flat C), held, and under it a clock ticks twice and stops: unresolved, like the progress bar."""
    merge_bar1(T, D, t0 + .1, TR17, "uke", 1.1)
    land = t0 + .1 + 4 * BL16
    merge_land(T, D, land, TR17, "uke", "sus2")
    merge_tune(T, D, land, 1, TR17, "uke")
    D.put(bdrum(.9, .8), t0 + 4.0, .13, 0)
    fin = t0 + 5.3
    T.put(brass([53, 58, 60, 65, 72, 77], 1.7, .04, .9, 2300), fin, .09, 0)
    T.put(strings([53, 58, 60, 65, 72, 77], 1.8, .05, 1.0, 5.0, 2600), fin, .11)
    T.put(whistle(79, 1.4, .7, .1, .6), fin, .05, 0)
    D.put(timp(87, 1.2), fin, .14, 0)
    for at in (5.9, 6.4):
        D.put(woodblock(), t0 + at, .07, .2)
        D.put(tick(), t0 + at, .05, 0)
    T.fade(t0 + d - .9, t0 + d, 1, 0)
    D.fade(t0 + d - .9, t0 + d, 1, 0)


# ================================================================ assign
def cue_assign17(T, t0, d, beats, D):
    """9:15 PM, the assignment (13.9 s). Stock music, over-enthusiastic: a ukulele and a glockenspiel at 128 bpm in F (a marimba figure, claps, a kick on every beat) from 0.35; it thins to a
    bass and a tick under Lemon's 'eight hours of residents' (4.9 to 7.0: deadpan); Tomato's 'Efficiency.' is her pizzicato, major then minor. Binder's four rising notes (C D E G) bounce under his
    offer (8.0 to 9.8); on 'Great! I'll help.' (10.42) they curdle (slow, flat, a drone on D); the stock music comes back brighter than before under 'Due before you clock out.' (11.4 to 12.9) and
    ends on a slide whistle that sags (12.8). The sting (13.02) is the sfx's."""
    t1, m1, t2, l1, t3, b1, s1, b2, t4 = (beats[k] for k in ("t1", "m1", "t2", "l1", "t3", "b1", "s1", "b2", "t4"))
    corporate(T, D, t0 + .35, l1[0] - .05, 128, .95)
    T.put(tuba(41, .5), t2[0] + .35, .1, 0)
    for k, at in enumerate(grid(l1[0], t3[0] - .05, 128, 1.0)):
        T.put(ubass((41, 36, 38, 34)[k % 4], .4, .7), at, .1, -.1)
        D.put(tick(), at, .04, .3)
    for j, ch in enumerate((TP_MAJ, TP_MIN)):
        for q, m in enumerate(ch):
            T.put(pizz(midi(m + 12), .16), t3[0] + .1 + j * .3 + q * .05, .08, .3)
    binder_bed(T, D, b1[0] - .1, s1[0] - .05, 120, 1.0)
    binder_bed(T, D, b2[0] - .02, t4[0] + .1, 90, 1.0, minor=True)
    T.put(strings([38, 45, 50], 1.4, .5, .5, 4.5, 700), b2[0], .05)
    corporate(T, D, t4[0] + .15, t0 + 12.8, 128, 1.05)
    T.put(slide_whistle(86, 74, .45), t0 + 12.82, .06, .1)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ video
def cue_video17(T, t0, d, beats, D):
    """9:50 PM, the video (23.3 s). Mr. Artichoke's elevator-jazz theme (a Rhodes, a brush, an upright and a too-smooth sax) plays over the call the whole way, band-limited like the call
    (260 Hz to 3.6 kHz); at the glitch (10.94) it stutters (the last 80 ms three times) and drops out for half a second. Under it a dry office: a call light chiming far away (E6, C6, low
    and to one side) at 3.4, 12.6 and 16.7 s; a held tension tone (a low D and A in the strings and a high A that swells) under Strawberry's 'A call light is on.' (6.45 to 7.6). From 'Ninety-
    nine percent complete!' (19.58) the progress bar is a two-bar loop, F A C D on a marimba and a celesta over a pizzicato F, that restarts every 1.2 s and never lands on the tonic: it
    plays three times and is still going when the scene ends. The sting (22.45) is the sfx's."""
    ar1, b1, s1, b2, ar2, l1, ar3, s2, ar4, b3, s3 = (beats[k] for k in ("ar1", "b1", "s1", "b2", "ar2", "l1", "ar3", "s2", "ar4", "b3", "s3"))
    V = Track(T.N)
    at_theme(V, t0 + .35, ar4[1] + .2, 1.0, prog=("Cmaj9", "Dm9", "G13", "Cmaj9"))
    i0, i1 = int((t0 + .2) * SR), int((ar4[1] + .8) * SR)
    V.buf[:, i0:i1] = callfx(V.buf[:, i0:i1])
    stutter(V.buf, t0 + 10.941, .08, 3, hold=.45)
    T.buf += V.buf
    for at in (3.4, 12.6, 16.7):
        far_chime(T, t0 + at)
    T.put(strings([38, 45], 1.5, .6, .6, 4.0, 700), s1[0] - .2, .06)
    T.put(glass(93, 1.3, .5, .6), s1[0] - .05, .035, .3)
    loop = (77, 81, 84, 86)
    lb = 1.2
    k = 0
    at = b3[0] - .03
    while at < t0 + d - .1:
        for j, m in enumerate(loop):
            T.put(marimba(midi(m), .22), at + j * .3 * 1.0, .08, -.2)
            T.put(celesta(m + 12, .5, .6), at + j * .3, .04, .3)
        T.put(pizz(midi(41), .3), at, .1, -.1)
        D.put(woodblock(), at + .6, .05, .2)
        at += lb
        k += 1
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ quiz
def cue_quiz17(T, t0, d, beats, D):
    """10:59 PM, the quiz (22.8 s). A game-show bed in C (0.2 to 7.35): a pizzicato bass, brass stabs on the offbeats, a vibraphone arpeggio, a snare on 2 and 4 and a clock ticking on every beat.
    'D.' (7.39) locks in with a timpani and a bell; 'Correct! You scored one hundred percent!' (7.97) is the score ringing (E7 twice), a confetti glissando (a harp sweep up three octaves with
    glass sparkles), a short trumpet fanfare and a cymbal. The certificate's countdown (9.66 to 13.2) is a clock that speeds up from 2 to 14 ticks a second under a string pedal that swells.
    From 13.2 the clock-out is a rising pizzicato phrase (C D E G A, 1.1 s) that restarts before it reaches the top, seven times, a little louder each time, over a drone; it is cut dead at
    'Until you clock out.' (19.95) and the last second of the scene is quiet (the error beep, the stinger and the sting are the sfx's)."""
    b1, m1, b2, s1, b3, o1, l1, t1, s2, o2, s3, t2 = (beats[k] for k in ("b1", "m1", "b2", "s1", "b3", "o1", "l1", "t1", "s2", "o2", "s3", "t2"))
    gameshow(T, D, t0 + .25, s1[0] - .05, 132, 1.0)
    D.put(timp(98, .9), s1[0] + .15, .14, 0)
    T.put(bell(midi(96), 1.2) * .6, s1[0] + .15, .06, .2)
    ring = b3[0] + .02
    for j, m in enumerate((100, 100, 103)):
        T.put(bell(midi(m), 1.4) * .6, ring + .12 * j, .07, -.3 + .3 * j)
    for k, m in enumerate(range(48, 96, 2)):
        T.put(harp(m, 1.2, .65), ring + .1 + .018 * k, .04, -.6 + .05 * k)
    for k in range(10):
        T.put(glass(96 + (k * 5) % 12, .5, .1, .3), ring + .2 + .06 * k, .025, -.5 + .1 * k)
    fanfare(T, D, ring + .05, .7, (72, 76, 79, 84), (.1, .1, .1, .6), .14)
    D.put(crash(1.4) * .6, ring, .06, .1)
    c0, c1 = o1[0] + .1, t0 + 13.2
    tick_run(D, c0, c1, 2, 14, .05, .12)
    T.put(strings([36, 43], c1 - c0 + .3, 1.5, .3, 4.0, 900), c0, .06)
    phr = (48, 50, 52, 55, 57)
    at = c1
    n = 0
    while at < t0 + 19.9:
        g = .07 + .012 * n
        for j, m in enumerate(phr):
            T.put(pizz(midi(m), .2), at + j * .2, g, -.2 + .1 * j)
            T.put(marimba(midi(m + 12), .18), at + j * .2, g * .8, .2)
        T.put(strings([m for m in phr[:1 + n % 5]] + [60], 1.0, .1, .5, 5.0, 1400), at, .03 + .006 * n)
        at += 1.1
        n += 1
    T.put(sub_swell(33, 36, 6.6) * .5, c1, .05, 0)
    MUTES.append((t0 + 19.96, t0 + d - .02, .01))                                                     # the last second is quiet; the span ends with the scene, never into the end card
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


CUES = {"title": cue_title17, "assign": cue_assign17, "video": cue_video17, "quiz": cue_quiz17, "end": cue_end17}
LEVEL17 = {"title": .95, "assign": 1.55, "video": 1.55, "quiz": 1.5, "end": .95}
TAIL17 = {"title": .5, "assign": .4, "video": .4, "quiz": .3, "end": 1.0}
DIP17 = {"title": 1.0, "assign": .6, "video": .6, "quiz": .6, "end": 1.0}
REVERB17 = {"title": (.4, 1.2), "assign": (.3, 1.0), "video": (.3, .9), "quiz": (.3, .9), "end": (.4, 1.2)}
DIPS17 = {"click": (3, .1, .1), "textding": (3, .2, .2), "glitch": (4, .3, .2)}


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    M10._CTX["lines"] = {(ln["scene"], ln["id"]): ln for ln in lines}
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
        wet, rt = REVERB17.get(sc["id"], (.35, 1.1))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL17.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP17.get(sc["id"], .6)
        dips = DIPCACHE.setdefault(key, None)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        out[:, a:b] += seg * LEVEL17.get(sc["id"], 1.0) * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS17)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
