"""Episode 7 score: a cue for every scene, written in notes and played on the small synthetic orchestra from build_music6, plus a few new instruments
(a drawbar organ with a rotating speaker, a choir, a theremin howl, a trombone slide, a siren, a music box, a woodblock).

build_audio6.main calls score(script, scenes, lines, N) through --music build_music7. The ideas:
  - the afternoon is sunny and a little too bright; the Moon never gets a cue of its own, only a four-note bell motif that follows it around
  - bingo night is a waltz on a church organ that refuses to notice anything happening around it, until a banana runs by
  - the howl scene is a medical mystery scored like a horror film, then a lullaby for the Moon
  - the Q word cuts the whole score to nothing; eight seconds later the building answers with every drum in the orchestra
  - the shift change goes sour on a record scratch
Nothing here is sampled; every instrument is a few lines of numpy.
"""
import numpy as np
from scipy import signal

import build_audio as BA
from build_audio import SR, tarr, osc, expdecay, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pluck, pizz, marimba, epiano, bell, vibes, sub_bass, saw_bass, pad, strings, brass, kick, snare, clap, hat, shaker, tom, timp,
                          roll, riser, impact, crash, tick, heart, sting_brass, env_adsr, MUSIC_GAIN, _n)

R7 = np.random.default_rng(2607)


# ================================================================ new instruments
def organ(notes, d, vel=1.0, leslie=6.3, bars=(1.0, .8, .55, .42, .22, .12)):
    """A drawbar organ chord: eight foot, four foot, two and two thirds and so on, a rotating speaker that wobbles the level, a key click."""
    t = tarr(d)
    x = np.zeros(_n(d))
    for m in notes:
        f = midi(m)
        for h, a in zip((1, 2, 3, 4, 6, 8), bars):
            x += a * np.sin(2 * np.pi * f * h * t + .02 * np.sin(2 * np.pi * leslie * t) * h)
    x = x / max(1, len(notes)) * (1 + .13 * np.sin(2 * np.pi * leslie * t)) * .35 * vel
    click = bp(R7.uniform(-1, 1, _n(.012)), 1500, 6000) * expdecay(.012, .003) * .5
    x[:len(click)] += click
    return lp(x, 4200, 1) * ar(d, .004, min(.06, d / 2))


def choir(notes, d, vowel="o", a=.5, r=.8):
    """Voices on a vowel: detuned saws pushed through two formants, one copy in each ear."""
    F = {"o": (450, 800), "a": (700, 1100), "u": (300, 870), "e": (400, 2000)}[vowel]
    t = tarr(d)
    L = np.zeros(_n(d))
    Rr = np.zeros(_n(d))
    for m in notes:
        vib = 1 + .004 * np.sin(2 * np.pi * 5.1 * t + m)
        L += osc("saw", midi(m - .09) * vib, d)
        Rr += osc("saw", midi(m + .09) * vib, d)
    out = np.stack([bp(L, F[0] * .86, F[0] * 1.16, 2) + .6 * bp(L, F[1] * .88, F[1] * 1.14, 2), bp(Rr, F[0] * .86, F[0] * 1.16, 2) + .6 * bp(Rr, F[1] * .88, F[1] * 1.14, 2)])
    return out * ar(d, a, r) / max(1, len(notes)) * 2.2


def theremin(m0, m1, d, vib=.016, a=.12, r=.3):
    """A gliding sine with a vibrato that grows as the note settles: the wolf, as the orchestra hears him."""
    t = tarr(d)
    f = np.interp(t, [0, d * .35, d], [midi(m0), midi(m1), midi(m1 - .6)]) * (1 + vib * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - .2) / .5, 0, 1))
    return (osc("sine", f, d) + .18 * osc("sine", f * 2, d)) * ar(d, a, r) * .55


def slide_brass(m0, m1, d, bright=1000):
    """A trombone sliding between two notes: the sound of a plan not working."""
    f = np.linspace(midi(m0), midi(m1), _n(d))
    x = osc("saw", f, d) + .6 * osc("saw", f * 1.004, d)
    return lp(x, bright, 2) * ar(d, .05, min(.25, d / 2)) * .5


def siren(m0, m1, d, rate=.9):
    """A civil defense siren: a sine swept up and down."""
    t = tarr(d)
    f = midi(m0) + (midi(m1) - midi(m0)) * (.5 + .5 * np.sin(2 * np.pi * rate * t - np.pi / 2))
    return (osc("sine", f, d) + .25 * osc("sine", f * 3, d)) * ar(d, .08, .2) * .4


def music_box(f, d=.9):
    x = osc("sine", f, d) + .4 * osc("sine", f * 2.76, d) * expdecay(d, .1) + .15 * osc("sine", f * 5.4, d) * expdecay(d, .04)
    return x * expdecay(d, .32) * ar(d, .001, .1) * .8


def woodblock(d=.12):
    return (osc("sine", 880, d) * expdecay(d, .03) + bp(R7.uniform(-1, 1, _n(d)), 1200, 4000) * expdecay(d, .006) * .5) * ar(d, .0005, .02) * .8


def taiko(f=62, d=.7):
    x = osc("sine", np.linspace(f * 1.6, f, _n(d)), d) * expdecay(d, .22) + .5 * bp(R7.uniform(-1, 1, _n(d)), 200, 1500) * expdecay(d, .05)
    return x * ar(d, .0008, .08) * 1.1


def hits(T, at, gain=.4):
    """An orchestra hit: brass cluster, timpani and a crash, all at once."""
    T.put(brass([57, 60, 64, 69], .5, .01, .2, 2400), at, gain * .6)
    T.put(timp(55, 1.0), at, gain)
    T.put(crash(1.4), at, gain * .5)


# ================================================================ harmony
CH7 = {"D": [50, 54, 57], "Bm": [47, 50, 54], "G": [43, 47, 50], "A": [45, 49, 52], "F": [53, 57, 60], "C7": [48, 52, 55, 58], "Bb": [58, 62, 65], "Dm7": [50, 53, 57, 60],
       "G7": [43, 47, 50, 53], "Cmaj7": [48, 52, 55, 59], "Am7": [45, 48, 52, 55], "Am": [45, 52, 57, 60, 64], "Em": [52, 55, 59], "Fm": [53, 56, 60], "E": [52, 56, 59], "C": [48, 52, 55]}


def up7(ch, o=0):
    return [n + o for n in CH7[ch]]


# the Moon's motif: four bells, falling
MOON = [88, 84, 81, 79]


def moon_motif(T, at, gain=.1, pan=.3, rate=.24):
    for k, n in enumerate(MOON):
        T.put(bell(midi(n), 1.1) * .6, at + k * rate, gain, pan - .15 * k)


# ================================================================ scene cues
def cue_lot(T, t0, d, beats):
    """2:59 PM. Sun on the asphalt: a bright groove, thinned to a few bells whenever the Moon speaks."""
    bpm = 108
    b = 60 / bpm
    prog = ["D", "Bm", "G", "A"]
    moonwin = [(beats["m1"][0] - .1, beats["m1"][1] + .1), (beats["m2"][0] - .1, beats["m2"][1] + .1), (beats["m3"][0] - .1, beats["m3"][1] + .1)]
    run0, run1 = beats["run"]
    stop = beats["s5"][0] - .08
    quiet = lambda at: any(a <= at < c for a, c in moonwin)
    start = t0 + .3
    nb = int((stop - start) / (b * 4)) + 1
    for i in range(nb):
        ch = prog[i % 4]
        bar = start + i * 4 * b
        if bar >= stop:
            break
        T.put(pad(up7(ch, 12), 4 * b + .4, .5, .6, 1700), bar, .05)
        for j in range(8):
            at = bar + j * b / 2
            if at >= stop:
                break
            T.put(shaker(), at, .05 if j % 2 else .04, .3 if j % 2 else -.3)
            if not quiet(at):
                T.put(marimba(midi(CH7[ch][[0, 1, 2, 1, 2, 1, 2, 0][j] % 3] + 24), .3), at, .1, -.3 + .1 * j)
            if j in (2, 6) and not quiet(at):
                T.put(clap() * .8, at, .12, .2)
        T.put(pluck(midi(CH7[ch][0] - 12), .5, 900, .25), bar, .2, 0)
        T.put(pluck(midi(CH7[ch][2] - 12), .4, 900, .2), bar + 2 * b, .14, 0)
    # the Moon speaks: its bells
    moon_motif(T, beats["m1"][0] - .35, .1, .35)
    moon_motif(T, beats["m3"][0] - .3, .09, .3, .3)
    # Mango runs in
    for k, n in enumerate((74, 76, 78, 81, 83, 86)):
        T.put(marimba(midi(n), .22), run0 + .05 + k * .1, .14, -.5 + k * .2)
    T.put(clap(), run1 - .02, .22, .1)
    # the deadpan last line: the groove stops, a low pluck, a trombone
    T.put(pizz(midi(38), .4), stop + .08, .3, 0)
    T.put(slide_brass(62, 55, .9), beats["s5"][1] - .85, .14, .1)
    T.fade(t0 + d - .8, t0 + d, 1, 0)


def cue_title7(T, t0, d, beats):
    """The logo: a riser, a timpani roll, a choir on the downbeat, and the Moon rising on the glass."""
    land = t0 + .2 + 2.2
    T.put(riser(2.2, 240, 6200, .85), land - 2.2, .28)
    T.put(roll(70, 2.0, 26), land - 2.0, .26, -.1)
    T.put(impact(1.8), land, .4)
    T.put(crash(2.2), land, .22, .1)
    T.put(choir([45, 52, 57, 60, 64], 2.6, "o", .08, 1.5), land, .18)
    for i, m in enumerate((81, 84, 88, 93)):
        T.put(bell(midi(m), 1.6) * .6, land + .1 + i * .13, .1, -.4 + i * .27)


def cue_station(T, t0, d, beats):
    """3:05 PM. Corporate bossa nova: electric piano, a walking bass, brushes. It is very calm and it has no idea."""
    bpm = 104
    b = 60 / bpm
    prog = ["Dm7", "G7", "Cmaj7", "Am7"]
    stop = beats["g3"][0] - .04          # "Quiet?" stops the music dead
    s0 = t0 + .2
    nb = int((stop - s0) / (b * 4)) + 1
    for i in range(nb):
        ch = prog[i % 4]
        bar = s0 + i * 4 * b
        for j, off in enumerate((0, 1.5, 2.5, 3.5)):
            at = bar + off * b
            if at >= stop - .1:
                continue
            T.put(epiano(midi(CH7[ch][1] + 12), .6, .5), at, .1, -.2)
            T.put(epiano(midi(CH7[ch][2] + 12), .6, .4), at + .01, .075, .2)
            T.put(epiano(midi(CH7[ch][3] + 12), .6, .4), at + .02, .06, .1)
        for j in range(4):
            at = bar + j * b
            if at >= stop - .1:
                continue
            root = CH7[ch][0] - (12 if j % 2 == 0 else 5)
            T.put(pizz(midi(root), .3), at, .2, 0)
            T.put(hat(), at, .06, .35)
            T.put(hat(), at + b / 2, .04, -.35)
        if bar + 3.5 * b < stop - .1:
            T.put(woodblock(), bar + 3.5 * b, .06, .3)
    # the rule: a timpani hit and a short brass stab on the stamp
    T.put(timp(62, .9), beats["rule"][0] + .15, .4)
    T.put(brass([57, 60, 64], .22, .01, .08, 1600), beats["rule"][0] + .15, .16)
    # "Quiet?": everything stops; the tube flickers; a low bassoon note answers
    T.gate(stop, beats["s4"][0], .0, .02)
    T.put(pad([33, 40, 45], beats["g4"][1] - beats["flick"][0] + 1.2, .5, 1.2, 520), beats["flick"][0], .12)
    T.put(slide_brass(50, 43, .8, 800), beats["g4"][0] - .05, .16, 0)
    T.fade(t0 + d - .8, t0 + d, 1, 0)


def cue_bingo(T, t0, d, beats):
    """5:30 PM. A waltz on a church organ: oom, pah, pah, whatever happens. It speeds up for exactly one banana."""
    bpm = 132
    b = 60 / bpm
    prog = ["F", "C7", "F", "Bb", "F", "C7", "F", "F"]
    chase0, chase1 = beats["ba1"][0] + .3, beats["g2"][0] - .05
    end0 = beats["p6"][0]
    t = t0 + .2
    bar = 0
    while t < t0 + d - .3:
        ch = prog[bar % 8]
        fast = chase0 <= t < chase1
        sad = t >= end0 - .1
        bb = b * (.62 if fast else 1.5 if sad else 1.0)
        root = CH7[ch][0] - 12
        T.put(organ([root], bb * .95, .6), t, .24, -.1)
        T.put(organ(up7(ch, 12), bb * .7, .5), t + bb, .13, .2)
        T.put(organ(up7(ch, 12), bb * .7, .5), t + 2 * bb, .12, .25)
        if bar % 2 == 0 and not sad:   # a tune, now and then
            tune = [72, 76, 77, 76, 74, 72] if ch == "F" else [74, 77, 79, 77, 76, 74]
            for k, nn in enumerate(tune[:3]):
                T.put(organ([nn + 12 - 12], bb * .9, .5, 5.8), t + k * bb, .12, -.2)
        if fast:
            T.put(snare() * .8, t + bb, .18)
            T.put(kick(), t, .3)
            T.put(marimba(midi(CH7[ch][1] + 24), .2), t + bb * 1.5, .16, .4)
        t += 3 * bb
        bar += 1
    # the calls: a quick marimba flick as each ball drops
    for cid in ("p2", "p3", "p4", "p5"):
        for k, n in enumerate((72, 76, 79, 84)):
            T.put(marimba(midi(n), .2), beats[cid][0] - .4 + k * .07, .12, -.3 + .2 * k)
    # the banana: a cartoon chase (xylophone line over galloping toms), then the room goes quiet
    for k in range(int((chase1 - chase0) / .22)):
        at = chase0 + k * .22
        T.put(marimba(midi([79, 83, 86, 83, 81, 84, 88, 84][k % 8] + 0), .18), at, .13, -.4 + .1 * (k % 8))
        T.put(tom(95 + 12 * (k % 2)), at, .16)
    T.put(slide_brass(65, 53, 1.3, 900), end0 - .05, .14, 0)
    T.fade(t0 + d - 1.0, t0 + d, 1, 0)


def cue_howl(T, t0, d, beats):
    """7:48 PM. The Moon rises over a bed. Then a medical mystery scored as a horror film, then a lullaby for the Moon."""
    rise0, rise1 = beats["rise"]
    T.put(pad([33, 40, 45, 52], rise1 - rise0 + 1.6, 2.2, 1.6, 700), rise0, .13)
    for k, n in enumerate((81, 88, 93)):
        T.put(bell(midi(n), 1.6) * .6, rise0 + 1.8 + k * .45, .08, -.3 + .3 * k)
    moon_motif(T, beats["m1"][0] - .1, .08, .35, .3)
    h0 = beats["howl"][0]
    T.put(strings([45, 52, 57, 63], 3.0, .12, 1.5, 6.0, 1500), h0 + .1, .1)      # a cluster that never resolves
    T.put(theremin(69, 76, 2.2), h0 + .2, .1, .3)
    T.put(impact(1.2) * .8, h0 + .08, .26)
    T.put(timp(55, 1.2), beats["g1"][0] - .05, .3)
    T.put(pizz(midi(40), .3), beats["g1"][0], .3)
    # the investigation: a slow walking bass under tiptoe marimba
    walk0, walk1 = beats["s1"][0], beats["call"][0]
    wb = 60 / 92
    seq = [45, 48, 50, 52, 50, 48, 45, 43]
    for k in range(int((walk1 - walk0) / (wb / 2))):
        at = walk0 + k * wb / 2
        T.put(pizz(midi(seq[k % 8]), .22), at, .17, -.2 if k % 2 else .2)
        if k % 2 == 0:
            T.put(marimba(midi(seq[(k // 2) % 8] + 24), .2), at, .07, .4)
    T.put(brass([45, 52], .6, .02, .25, 1100), beats["go1"][0] + .1, .22)    # "I am the wolf."
    T.put(timp(52, .9), beats["go1"][0] + .1, .26)
    T.put(woodblock(), beats["g2"][0], .1, .3)
    # the doctor: a sleepy lounge. Vibraphone, brushes and a double bass that has also been woken up
    c0 = beats["a1"][0] - .3
    cb = 60 / 72
    prog = ["Dm7", "G7", "Cmaj7", "Am7"]
    for i in range(int((beats["a3"][1] - c0) / (2 * cb)) + 1):
        ch = prog[i % 4]
        at = c0 + i * 2 * cb
        T.put(vibes(midi(CH7[ch][2] + 12), 1.6), at, .09, -.2)
        T.put(vibes(midi(CH7[ch][3] + 12), 1.6), at + .02, .07, .25)
        T.put(pizz(midi(CH7[ch][0] - 12), .4), at, .2, 0)
        T.put(hat(), at + cb, .035, .3)
    T.put(slide_brass(55, 48, 1.0, 800), beats["a3"][1] - .55, .13, 0)
    # "It's not you. It's a UTI.": the lullaby
    l0 = beats["s7"][0] - .1
    T.put(pad(up7("D", 12), beats["m2"][1] - l0 + 1.2, 1.0, 1.4, 1500), l0, .12)
    T.put(strings([57, 62, 66, 69], beats["m2"][1] - l0 + 1.0, .9, 1.2, 5.2, 2200), l0 + .2, .1)
    lull = [74, 78, 81, 78, 76, 74, 71, 74]
    for k, n in enumerate(lull):
        T.put(music_box(midi(n + 12), 1.0), beats["m2"][0] + .15 + k * .36, .14, -.3 + .08 * k)
    # the squares: two marimba plinks
    for k, n in enumerate((84, 88)):
        T.put(marimba(midi(n), .3), beats["d5"][0] + .1 + k * .4, .14, -.3 + .6 * k)
    T.fade(t0 + d - 1.2, t0 + d, 1, 0)


def cue_quiet(T, t0, d, beats):
    """10:31 PM. The calm before: a music box. Then nothing. Then every drum in the building."""
    s1 = beats["s1"]
    # calm: pad and a music box that walks up a C chord
    T.put(pad(up7("C", 12), s1[1] - t0 + .2, 1.2, .1, 1300), t0 + .1, .1)
    for k, n in enumerate((72, 76, 79, 76, 72, 79, 76, 72, 74, 77, 81, 77)):
        at = t0 + .3 + k * .26
        if at < s1[0] - .15:
            T.put(music_box(midi(n + 12), .8), at, .11, -.3 + .06 * k)
    T.gate(s1[1] + .02, beats["g1"][0] - .02, .0, .02)            # the Q word: the score stops mid-phrase
    # the freeze: a held low note that swells until it hurts
    fz0, fz1 = beats["freeze"]
    T.put(strings([33, 40, 44, 51], fz1 - fz0 + .4, .9, .08, 4.5, 1000), fz0, .16)
    T.put(heart(), fz0 + .1, .5)
    for k in range(3):
        T.put(heart(), fz0 + .5 + k * .45, .4 + .1 * k)
    T.gate(fz1 - .02, beats["m1"][0] - .05, .0, .02)
    T.put(strings([41, 48, 53, 60], 1.6, .5, .5, 5.0, 1200), beats["m1"][0] - .05, .1)
    # the building answers: 168 bpm of taiko, siren, marimba and brass
    c0, c1 = beats["chaos"]
    cb = 60 / 168
    T.put(riser(.9, 300, 5200, .7), c0 - .85, .35)
    root = 45
    for k in range(int((c1 - c0) / (cb / 2))):
        at = c0 + k * cb / 2
        lvl = min(1.0, .35 + .65 * (at - c0) / (c1 - c0))
        beat = k % 8
        if k % 2 == 0:
            T.put(kick(), at, .4 * lvl)
        if beat in (2, 6):
            T.put(snare(), at, .34 * lvl)
        T.put(hat(), at, .12 * lvl, .4 if k % 2 else -.4)
        if beat in (0, 3, 5):
            T.put(taiko(62 if beat == 0 else 74, .5), at, .3 * lvl)
        if k % 16 == 0 and at - c0 > .8:
            hits(T, at, .22 * lvl)
        if at - c0 > 1.6:
            T.put(marimba(midi([81, 84, 88, 84, 83, 86, 91, 86][k % 8]), .16), at, .11 * lvl, .5 if k % 2 else -.5)
        if at - c0 > 3.4 and k % 2 == 1:
            T.put(brass([57, 60] if (k // 8) % 2 == 0 else [55, 59], .14, .006, .05, 2000), at, .13 * lvl, 0)
    for k in range(4):
        at = c0 + 1.2 + k * 1.9
        if at < c1 - .6:
            T.put(siren(76 if k % 2 else 71, 88 if k % 2 else 83, 1.8, .9), at, .09, -.6 + .4 * k)
    T.put(roll(70, 1.0, 20), c1 - 1.0, .32)
    T.put(impact(1.4), c1 - .05, .5)
    T.put(crash(2.0), c1 - .05, .3)
    T.gate(c1 + .02, beats["g2"][0] + .85, .0, .3)                # the storm stops: the crash rings down while the line starts, then nothing under it
    # the aftermath: one hopeful note, a deadpan low one, a trombone
    T.put(marimba(midi(84), .5), beats["g2"][0] + .9, .12, .3)
    T.put(marimba(midi(88), .5), beats["g3"][0] + .2, .12, -.3)
    T.put(marimba(midi(91), .6), beats["g3"][0] + .55, .12, .3)
    T.put(pizz(midi(38), .5), beats["s4"][0] + .25, .3, 0)
    T.put(slide_brass(58, 49, 1.3, 800), beats["g4"][0] - .05, .18, 0)
    # the clock: ticks, then eleven o'clock
    cl0 = beats["clock"][0]
    for k in range(int((beats["clock"][1] - cl0) / .5)):
        T.put(tick(), cl0 + .05 + k * .5, .2, .2 * (1 if k % 2 else -1))
    T.put(timp(52, 1.6), cl0 + .55, .4)
    T.put(bell(midi(57), 2.4) * .6, cl0 + .55, .16, 0)
    T.fade(t0 + d - 1.0, t0 + d, 1, .2)


def cue_report(T, t0, d, beats):
    """11:00 PM. The night nurse brings a good mood. The word 'quiet' takes it away again."""
    e0, e1 = beats["enter"]
    bpm = 120
    b = 60 / bpm
    prog = ["G", "Em", "C", "D"]
    stop = beats["s1"][1] + .05
    nb = int((stop - e0) / (b * 4)) + 1
    for i in range(nb):
        ch = prog[i % 4]
        bar = e0 + i * 4 * b
        for j in range(8):
            at = bar + j * b / 2
            if at >= stop - .08:
                break
            T.put(shaker(), at, .05 if j % 2 else .035, .3 if j % 2 else -.3)
            if j % 2 == 0:
                T.put(epiano(midi(([55, 59, 62, 59][j // 2 % 4]) + 12), .5, .6), at, .1, -.2 + .1 * j)
        T.put(pizz(midi({"G": 43, "Em": 40, "C": 48, "D": 50}[ch]), .3), bar, .22, 0)
        T.put(pizz(midi({"G": 50, "Em": 47, "C": 43, "D": 45}[ch]), .25), bar + 2 * b, .16, 0)
    # the record scratch: down it goes
    T.put(bp(R7.uniform(-1, 1, _n(.4)), 600, 5000) * np.linspace(1, 0, _n(.4)) * .5, beats["s1"][1] - .02, .22, 0)
    T.gate(stop, beats["stamp"][1], .0, .02)
    T.put(brass([45, 52], .5, .01, .3, 1100), beats["stamp"][0] + .08, .16)
    # the ominous bed under "Oh, good!"
    T.put(pad([33, 40, 45, 51], beats["m2"][0] - beats["d2"][0] + .4, .6, .1, 600), beats["d2"][0] - .1, .12)
    T.put(strings([45, 52, 57, 63], beats["m2"][0] - beats["flick2"][0] + .8, .4, .2, 6.5, 1300), beats["flick2"][0], .1)
    for k in range(int((beats["m2"][0] - beats["flick2"][0]) / .22)):
        T.put(tick(), beats["flick2"][0] + k * .22, .06 + .02 * (k % 2), .3 * (1 if k % 2 else -1))
    T.put(pizz(midi(40), .3), beats["s2"][0] + .05, .3, 0)
    T.put(slide_brass(52, 40, 1.4, 800), beats["m2"][0] + .15, .2, 0)
    T.put(impact(1.5) * .7, beats["m2"][0] + .2, .3)
    T.fade(t0 + d - .7, t0 + d, 1, 0)


def cue_end7(T, t0, d, beats):
    """The reprise. The theme, in strings and horn, under the cast taking a bow; a clock for the teaser."""
    c0 = t0 + .15
    b = 60 / 96
    plan = [("Am", 0.0, 2.2), ("F", 2.2, 2.4), ("C", 4.6, 1.5), ("G", 6.1, 1.3), ("Am", 7.3, 1.2)]
    for ch, a, dd in plan:
        if c0 + a >= t0 + d + 1.0:
            break
        T.put(strings(up7(ch, 12), dd + .4, .12, .5, 5.5, 2800), c0 + a, .14)
        T.put(brass(up7(ch, 0), dd, .03, .3, 1500), c0 + a, .10, 0)
        T.put(sub_bass(midi(CH7[ch][0] - 12), dd), c0 + a, .26)
        for k in range(int(dd / (.5 * b))):
            T.put(marimba(midi(CH7[ch][k % 3] + 24), .3), c0 + a + k * .5 * b, .09, -.3 + .2 * (k % 4))
        for k in range(int(dd / b)):
            T.put(kick(), c0 + a + k * b, .34 if k % 2 == 0 else .2)
            if k % 2 == 1:
                T.put(clap(), c0 + a + k * b, .2)
    for k, n in enumerate((84, 88, 91, 96, 91, 88)):
        T.put(bell(midi(n), 1.2) * .6, c0 + 2.4 + k * .17, .12, -.6 + .24 * k)
    T.put(crash(2.4), c0 + 2.4, .33)
    T.put(timp(65, 1.4), c0 + 2.4, .33)
    T.put(choir([57, 60, 64], 2.2, "a", .1, 1.2), c0 + 2.4, .12)
    # the teaser card
    T.put(timp(55, .9), t0 + 4.25, .3)
    for k, n in enumerate((88, 93)):
        T.put(bell(midi(n), 1.2) * .6, t0 + 4.25 + k * .15, .12, .3)
    T.fade(t0 + d - 1.2, t0 + d, 1, 0)


CUES = {"lot": cue_lot, "title": cue_title7, "station": cue_station, "bingo": cue_bingo, "howl": cue_howl, "quiet": cue_quiet, "report": cue_report, "end": cue_end7}


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    T = Track(N)
    for sc in scenes:
        fn = CUES.get(sc["id"])
        if not fn:
            continue
        t0 = sc["start"]
        beats = {k: (t0 + v["s"], t0 + v["e"]) for k, v in sc["beats"].items()}
        fn(T, t0, sc["dur"], beats)
        T.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.0, 0.0, .15)   # a cue's tail never bleeds into the next scene
    return hall(T.buf, wet=.55, rt=1.6) * MUSIC_GAIN
