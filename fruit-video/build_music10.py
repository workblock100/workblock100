"""Episode 10 score: two weeks' notice. A flyer with fourteen tabs, an office run on paperwork, a montage with the calendar flipping on the beat, an exit interview as cold as a
filing cabinet, a farewell waltz that cannot keep its feet, a march that deflates, and a gentle night with a glockenspiel on ACCEPT.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music10; the mixer ducks it under every voice.
  title    the series sting (riser, timpani roll, choir, bells: build_music7's cue) with a bouncy pizzicato theme that lands one note on each of the fourteen tears
  office   staccato strings and a woodblock like a typing pool; a muted trumpet for officialese; a horror sting on 'agency'; a comic heraldic fanfare for each pizza
  days     a brisk marimba and pizzicato groove whose bar lines are bent a hair so a downbeat lands on every calendar flip; four colours for four places
  exit     cold and dry: a clock, a low string, a lonely clarinet that sighs after every 'Money.', silence for the stamp
  party    a warm waltz that trips over the missing R, limps on four dollars and seventeen cents, and swells for 'I love you.' 'I know.'
  door     a stately march that loses a piece of itself with every deduction
  lot      a nylon guitar under the stars and, on ACCEPT, a glockenspiel
  end      build_music7's reprise
Instruments come from build_music6 / 7 / 8 / 9 plus the ones below (a nylon guitar, a piano, a solo violin, a clarinet, an oboe, a tuba, a muted trumpet, a kazoo, brushes); nothing
is sampled. build_music11 imports this module for them.
"""
import numpy as np

from build_audio import SR, tarr, osc, expdecay, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pluck, pizz, marimba, epiano, bell, vibes, sub_bass, saw_bass, pad, strings, brass, kick, snare, clap, hat, shaker, tom, timp, roll,
                          riser, impact, crash, tick, heart, MUSIC_GAIN, _n)
from build_music7 import CH7, woodblock, slide_brass, choir, music_box, moon_motif, taiko, hits, cue_title7, cue_end7
from build_music8 import beat_times, tock, root as root8
from build_music9 import grid, ss, spic, snap, uke

R10 = np.random.default_rng(2610)


# ================================================================ new instruments
def _fit_peak(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def nylon(m, d=1.0, bright=1.0, pos=.13):
    """A nylon-string guitar note: partials that die faster the higher they are (and a little stretched, like a real string), a plucking position that thins some of them, a
    twin string a hair out of tune so it beats slowly, a wooden body, and the click of the nail."""
    f = midi(m)
    t = tarr(d)
    x = np.zeros(len(t))
    for k in range(1, 16):
        fk = f * k * (1 + .00025 * k * k)
        if fk > 8500:
            break
        a = abs(np.sin(np.pi * k * pos)) / k * (bright if k > 3 else 1.0)
        tau = 1.4 / (1 + .8 * (k - 1)) * (1.0 if f > 180 else 1.3)
        e = np.exp(-t / tau)
        x += a * (np.sin(2 * np.pi * fk * t + .7 * k) + .6 * np.sin(2 * np.pi * fk * 1.0006 * t + 2 + .4 * k)) * e
    body = bp(x, 110, 290, 1) * .35
    nail = bp(R10.uniform(-1, 1, len(t)), 1800, 5600) * np.exp(-t / .004) * .06 * max(x.max(), .1)
    return _fit_peak((x * .55 + body + nail) * ar(d, .0007, min(.12, d * .4)), 1.0)


def piano(m, d=1.2, vel=.8):
    """A piano note: stretched partials with the low strings ringing longer, three strings a hair apart, a soft hammer thump."""
    f = midi(m)
    t = tarr(d)
    x = np.zeros(len(t))
    for k in range(1, 13):
        fk = f * k * np.sqrt(1 + .0004 * k * k)
        if fk > 8000:
            break
        a = 1 / k ** .9
        tau = 2.2 / k ** .8 * (1.0 if f > 200 else 1.6)
        for det in (1.0, 1.0007, .9993):
            x += a * np.sin(2 * np.pi * fk * det * t + k) * np.exp(-t / tau) / 3
    hammer = lp(R10.uniform(-1, 1, len(t)), 2500) * np.exp(-t / .012) * .15 * vel * max(x.max(), .1)
    return _fit_peak((x + hammer) * ar(d, .0005, min(.2, d * .5)), 1.0) * (.55 + .45 * vel)


def violin(m, d=1.0, vib=.006, a=.07, r=.12):
    """A solo violin: a bowed saw with a delayed vibrato, a small scoop up into the note, the body's two formants and a little bow noise."""
    t = tarr(d)
    fv = midi(m) * (1 + vib * np.sin(2 * np.pi * 5.8 * t) * np.clip((t - .18) / .3, 0, 1)) * (1 - .02 * np.exp(-t / .04))
    x = osc("saw", fv, d)
    y = lp(x, 3600, 2) + .5 * bp(x, 900, 1300, 1) + .35 * bp(x, 2300, 3100, 1)
    y += hp(R10.uniform(-1, 1, len(t)), 3500) * .02
    return _fit_peak(y * ar(d, a, min(r, d * .45)), .9)


def clarinet(m, d=1.0, vib=.005, a=.05, r=.12):
    """A clarinet: odd harmonics only (that hollow sound), a breath of noise, a slow vibrato that arrives late."""
    t = tarr(d)
    f = midi(m) * (1 + vib * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - .35) / .5, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum((1 / k ** .8 if k % 2 else .12 / k) * np.sin(k * ph) for k in range(1, 12))
    y = lp(x, 3200, 2) + bp(R10.uniform(-1, 1, len(t)), 1200, 3500, 1) * .04
    return _fit_peak(y * ar(d, a, min(r, d * .45)), .9)


def oboe(m, d=1.0, vib=.008, a=.06, r=.12):
    """An oboe: a reedy saw through a nasal formant around 1.1 kHz, with a vibrato that grows."""
    t = tarr(d)
    f = midi(m) * (1 + vib * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - .3) / .5, 0, 1))
    x = osc("saw", f, d)
    y = bp(x, 850, 1450, 2) + .25 * lp(x, 700) + .12 * bp(x, 2200, 3200, 1)
    return _fit_peak(y * ar(d, a, min(r, d * .45)), .9)


def tuba(m, d=.5, a=.04, r=.1):
    """A tuba: a round, dark brass note with a small scoop up into it."""
    f = midi(m) * (1 - .03 * np.exp(-tarr(d) / .05))
    x = osc("saw", f, d) * .8 + osc("square", f, d) * .4
    return _fit_peak(lp(x, 520, 3) * ar(d, a, min(r, d * .45)), .9)


def mtrumpet(m, d=.4, vel=1.0, vib=.004, wah=0.0, a=.012, r=.06):
    """A harmon-muted trumpet: thin, nasal, all upper-middle. `wah` is how many times a second the mute is worked (the filter swings between a closed and an open vowel)."""
    t = tarr(d)
    x = osc("saw", midi(m) * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - .15) / .2, 0, 1)), d)
    if wah:
        w = .5 + .5 * np.sin(2 * np.pi * wah * t - np.pi / 2)
        y = (1 - w) * bp(x, 500, 1100, 2) + w * bp(x, 1300, 3200, 2)
    else:
        y = bp(x, 800, 2800, 2) + .3 * bp(x, 380, 800, 1)
    return _fit_peak(y * ar(d, a, min(r, d * .4)), .9) * vel


def kazoo(m, d=.3, a=.02, r=.05):
    """A kazoo: a buzzing membrane (a saw with its level chopped at about 150 Hz) through a small nasal horn."""
    t = tarr(d)
    x = osc("saw", midi(m) * (1 + .006 * np.sin(2 * np.pi * 6 * t) * np.clip(t / .2, 0, 1)), d)
    y = bp(x, 600, 3200, 2) * (.72 + .28 * np.sign(np.sin(2 * np.pi * 150 * t)))
    return _fit_peak(y * ar(d, a, min(r, d * .4)), .9)


def brush(d=.25):
    """A drummer's brush swept across a snare: a band of noise that swells and fades."""
    return bp(R10.uniform(-1, 1, _n(d)), 2500, 9000) * np.sin(np.pi * np.linspace(0, 1, _n(d))) ** 1.4 * .5


def ride(d=.6):
    """A ride cymbal tap: noise through the top octaves and a few inharmonic partials that ring."""
    t = tarr(d)
    x = hp(R10.uniform(-1, 1, _n(d)), 5500) * np.exp(-t / .15) * .5
    x += sum(a * np.sin(2 * np.pi * f * t) for f, a in ((3100, .2), (4700, .15), (6300, .1))) * np.exp(-t / .3) * .4
    return x * ar(d, .0004, .1)


# ================================================================ context: where we are and what is being said
_CTX = {"scene": None, "lines": {}}


def wt(line_id, word, k=0):
    """Absolute time (s) at which a word begins in a spoken line of the current scene: the same proportional word times the captions use."""
    ln = _CTX["lines"][(_CTX["scene"], line_id)]
    ws = [w for w in ln["words"] if w[0].strip(".,!?:;'\"").lower().startswith(word.lower())]
    return ln["s"] + ws[k][1]


def seq(T, inst, at, items, gain, pan=0.0, step=None):
    """Play a run of notes: items are (midi, beats-or-seconds offset, duration) tuples placed at `at` + offset (the offset is already in seconds)."""
    for it in items:
        m, off, dur = it[:3]
        g = gain * (it[3] if len(it) > 3 else 1.0)
        T.put(inst(m, dur), at + off, g, pan)


def groove_times(a, b, nbeats_per_bar=4, bpm=138.0):
    """Beat times from a to b with the tempo bent a hair so that a whole number of bars fits exactly (a downbeat lands on a and on b). Returns (times, beat length)."""
    nb = max(nbeats_per_bar, int(round((b - a) / (60 / bpm) / nbeats_per_bar)) * nbeats_per_bar)
    bl = (b - a) / nb
    return [a + i * bl for i in range(nb)], bl


CHORDS10 = {"Dm": [50, 53, 57], "Bb": [46, 50, 53], "A": [45, 49, 52], "Gm": [43, 46, 50], "F": [41, 45, 48], "C": [48, 52, 55], "G": [43, 47, 50], "Am": [45, 48, 52], "Em": [40, 43, 47],
            "Dm7": [50, 53, 57, 60], "D": [50, 54, 57], "Bm": [47, 50, 54], "Edim": [52, 55, 58], "Fmaj7": [41, 45, 48, 52], "E": [40, 44, 47], "C7": [48, 52, 55, 58], "A7": [45, 49, 52, 55]}


def score(script, scenes, lines, N):
    return np.zeros((2, N))
