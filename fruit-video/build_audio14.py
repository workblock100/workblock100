"""Episode 14 audio: a thin wrapper on the Episode 13 / 12 / 11 / 10 / 9 / 7 / 6 mixer, plus the sound effects only this episode needs.

Importing build_audio13 registers every earlier effect (Episodes 6 to 13) in the same registry (build_audio.SFX). This file adds the nature documentary: a dawn chorus, a sedan
rolling over gravel, a phone buzzing on five different surfaces, rubber-toy meerkat squeaks, a junk-room door bursting and (in slow motion) a landslide of wheelchairs, a trail
camera, a binder dropped on a desk with a call bell on it, a Plinko board whose pegs climb a pentatonic scale, a ball that lands in the worst slot, a cartoon siren and klaxon,
a rubber stamp and a very large rubber stamp, five people finally sitting down, and a call light. A few existing names are redefined for this episode only (see the end of the sfx
section) because the cue list asks for something the old sound cannot be: the registry is rebuilt in every process, so Episodes 6 to 13 are untouched.
It changes the defaults (script, output folder, timeline variable, music module) and runs the same loudness trim, peak limiter and AAC guard as Episodes 10 to 13.
Nothing is sampled: every sound is a few lines of numpy. Where a name is used more than once with a different job (birds, crash, clatter, thud, stamp, ding1, sting, squeak, buzz,
plink ...), the effect takes its variation from _nth, the count of how many times it has been asked for; the mixer asks for cues in script order, so a build is deterministic.

Usage: python3 build_audio14.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep14_sound] [--events build/ep14/events.json]
"""
import os
import sys

import numpy as np
from scipy import signal

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
import build_audio10 as A10
import build_audio13 as A13   # importing it registers every earlier effect (Episodes 6 to 13) in build_audio.SFX
from build_audio import SR, tarr, osc, ar, midi
from build_audio6 import norm6, rng6, noise6, place2
from build_audio7 import _smooth_rand, _sum
from build_audio10 import _nth, _burst, _thump, _ping
from build_audio13 import _place, _edge, _lp4, _hp4, _bp4, _tv_filter, _glide, _sin_of, _glass, _fade_end, _call_ding


# ================================================================ helpers
def _res(x, f, q):
    """A resonant peak at f Hz with quality q: what a table top, a tray or a mug does to a vibration."""
    b, a = signal.iirpeak(min(f, SR * .45) / (SR / 2), q)
    return signal.lfilter(b, a, x)


def _band(seed, d, lo, hi):
    """A band of noise (second-order sections, so it is stable at any corner)."""
    return _bp4(noise6(d, seed), lo, hi)


def _unit(x):
    m = np.max(np.abs(x))
    return x / m if m > 0 else x


def _stereo(x, pan=0.0):
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def _wood_tick(seed, d=.03, lo=900, hi=4200, tau=.004):
    return _burst(seed, d, lo, hi, tau)


# ================================================================ the colony: dawn, a car on gravel, phones, meerkats
def _whistle(d, times, freqs, h2=.12, vib=0.0, shape=.8):
    """A bird's whistle: a (nearly) pure tone that follows a pitch contour (Hz at the given times), a trace of its octave, an optional fast vibrato and a smooth bump of an envelope."""
    t = tarr(d)
    f = np.interp(t, times, freqs)
    if vib:
        f = f * (1 + vib * np.sin(2 * np.pi * 26 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + h2 * np.sin(2 * ph)
    return x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** shape


def _song(seed, notes=5, lo=1900, hi=3300, nd=(.07, .17), gap=(.025, .07)):
    """A thrush's phrase: a few whistled notes, each an arch, a rise or a fall inside the band lo..hi, with small gaps between them."""
    r = rng6(seed)
    out, at = [], 0.0
    for _ in range(notes):
        d = r.uniform(*nd)
        a, b = r.uniform(lo, hi), r.uniform(lo, hi)
        mid = (a + b) / 2 * r.uniform(.95, 1.12)
        out.append((at, _whistle(d, [0, d / 2, d], [a, mid, b], vib=r.choice([0, 0, .012]))))
        at += d + r.uniform(*gap)
    clip = np.zeros(int((at + .05) * SR))
    for a_, c in out:
        _place(clip, c, a_)
    return clip


def _trill(f0, rate, depth, d):
    """A warbler's trill: a tone that swings by `depth` Hz at `rate` per second, gated at the same rate."""
    t = tarr(d)
    f = f0 + depth * np.sin(2 * np.pi * rate * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (.55 + .45 * np.sin(2 * np.pi * rate * t + .6))
    return x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .7


def _tweet(seed, n=4, f0=3300):
    """A sparrow's chirps: short upward slurs, irregularly spaced."""
    r = rng6(seed)
    clip = np.zeros(int(.8 * SR))
    at = 0.0
    for _ in range(n):
        d = r.uniform(.035, .06)
        _place(clip, _whistle(d, [0, d], [f0 * r.uniform(.8, .95), f0 * r.uniform(1.15, 1.4)], h2=.2, shape=.6), at)
        at += d + r.uniform(.04, .1)
    return clip[:int((at + .05) * SR)]


def _coo(d=.9):
    """A collared dove, far off: coo, coo-coo, soft and low, closed off at 1.2 kHz."""
    out = np.zeros(int(d * SR))
    for at, dd, f in ((0.0, .28, 430.0), (.36, .13, 470.0), (.54, .22, 440.0)):
        t = tarr(dd)
        fr = np.interp(t, [0, .25 * dd, dd], [f * .93, f, f * .9]) * (1 + .008 * np.sin(2 * np.pi * 6 * t))
        ph = 2 * np.pi * np.cumsum(fr) / SR
        x = (np.sin(ph) + .28 * np.sin(2 * ph)) * ar(dd, .06, .08)
        _place(out, x, at)
    return _lp4(out, 1200, 2)


def sfx_birds():
    """The first call (the title, 4.9 s) is a dawn chorus that wakes up: a far dove, then a thrush's whistled phrases, a trill, sparrow chirps, each placed somewhere in the stereo
    field and a little duller the further away it is, thickening for three seconds and thinning as the horn comes in. The second (the colony's opening pause, 1.3 s) is the same
    place in daylight: a dove, two phrases and a chirp. High and thin on purpose (nothing below 400 Hz but the dove), so the horn and the narrator have the middle."""
    k = _nth("birds")
    r = rng6(1601 + k)
    if k == 0:
        d = 4.95
        n = int(d * SR)
        out = np.zeros((2, n))
        place2(out, _coo(), .05, .42, -.55)
        place2(out, _coo(), 2.2, .3, .6)
        t = .45
        i = 0
        while t < 4.35:
            kind = ("song", "tweet", "song", "trill", "tweet", "song")[i % 6]
            pan = float(r.uniform(-.9, .9))
            far = r.uniform(0, 1)
            g = r.uniform(.3, .7) * (1 - .5 * far) * min(1.0, .35 + t / 1.6) * (1 - .8 * np.clip((t - 3.9) / .6, 0, 1))
            if kind == "song":
                c = _song(int(t * 1000) + 5, int(r.integers(3, 7)), 1800 + 300 * r.integers(0, 3), 3000 + 400 * r.integers(0, 3))
            elif kind == "tweet":
                c = _tweet(int(t * 1000) + 6, int(r.integers(3, 6)), float(r.choice([3100, 3600, 4100])))
            else:
                c = _trill(float(r.choice([2600, 3000, 3400])), float(r.uniform(18, 30)), float(r.uniform(300, 600)), float(r.uniform(.35, .6)))
            c = _lp4(c, 7500 - 3500 * far, 2)
            place2(out, c, t, g, pan)
            # a faint echo off the building: the far ones come back 0.12 s late, duller
            if far > .5:
                place2(out, _lp4(c, 3000, 2), t + .12, g * .25, -pan * .6)
            t += r.uniform(.25, .65) * (1.5 - min(1.0, t / 3.0) * .75)
            i += 1
        air = _stereo(_lp4(noise6(d, 1609), 2600, 2) * np.interp(tarr(d), [0, 1.2, 3.5, 4.95], [0, .35, .6, 0]) * .012, 0)
        out += air
        return norm6(_edge(out, .002, .15), .5)
    d = 1.35
    out = np.zeros((2, int(d * SR)))
    place2(out, _coo(.8), .0, .35, -.4)
    place2(out, _lp4(_song(1621, 4, 2000, 3200), 6000, 2), .12, .55, .5)
    place2(out, _lp4(_song(1622, 5, 1900, 3400), 5000, 2), .55, .4, -.7)
    place2(out, _lp4(_tweet(1623, 3, 3500), 5500, 2), .9, .35, .2)
    return norm6(_edge(out, .002, .2), .45)


def sfx_car():
    """A white sedan pulling into a gravel lot, 1.5 s: tyres on loose stone (a hundred small crunches a second at first, thinning to a few as the car comes to rest at 1.1 s; every stone
    is a short burst of noise somewhere between 0.7 and 6 kHz and a faint thump of rubber under it), a quiet four-cylinder idle (a 26 Hz firing rate, rounded off at 220 Hz, so it is
    felt more than heard), the disc brake's thin squeak as it stops, the car settling on its springs, the parking brake's three ratchet clicks and the engine switching off with a
    small shudder. The level rises as the car comes closer and the gravel is kept light, because the narrator is speaking over all of it."""
    d = 1.55
    n = int(d * SR)
    t = tarr(d)
    r = rng6(1630)
    v = np.where(t < 1.1, (1 - np.clip(t / 1.1, 0, 1)) ** 1.3, 0.0)            # speed, falling to a stop at 1.1 s
    near = .3 + .7 * np.minimum(1, t / .55) ** 1.3                                # it is getting closer
    lam = 150 * v + 6                                                              # stones per second
    cum = np.cumsum(lam) / SR
    x = np.zeros(n)
    stones = [_burst(1640 + j, .03, r.uniform(700, 1500), r.uniform(3500, 6500), r.uniform(.003, .008)) for j in range(14)]
    k = 1
    for i in range(n):
        if cum[i] >= k:
            k += 1
            g = r.lognormal(0, .5) * (.25 + .75 * v[i] ** .5) * near[i]
            _place(x, stones[int(r.integers(0, 14))], i / SR, g * .4)
            if r.random() < .25:
                _place(x, _thump(120, 70, .03, .008), i / SR, g * .1)
    f0 = 26 * (1 + .04 * np.sin(2 * np.pi * 2.1 * t))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    eng = sum(np.sin(h * ph + h) * h ** -.9 for h in range(1, 14))
    off = np.clip((t - 1.32) / .12, 0, 1)
    fo = f0 * (1 - .4 * off)
    eng = _lp4(eng, 220, 4) * np.where(t < 1.32, 1.0, np.exp(-(t - 1.32) / .05)) * (.35 + .65 * np.minimum(1, t / .4))
    x += _unit(eng) * .3
    sq = _sin_of(np.interp(t[:int(.13 * SR)], [0, .13], [1500, 1100])) * np.hanning(int(.13 * SR))
    _place(x, sq, .98, .03)
    _place(x, _thump(75, 50, .12, .04), 1.12, .22)                                 # the springs settle
    for j in range(3):
        _place(x, _burst(1660 + j, .02, 900, 3200, .003), 1.2 + j * .035, .2)       # the parking brake
    _place(x, _burst(1664, .05, 700, 2500, .006) + _thump(180, 110, .05, .015) * .5, 1.31, .22)   # the key turns: the engine stops
    x = _lp4(x, 6500, 2)
    return norm6(_edge(x, .004, .09), .5)


def sfx_carclose():
    """A sedan's door shut by a man who is not in a hurry, 1.0 s: the slab meets the seal (a body that sags from 140 to 78 Hz in 80 ms, the cabin booming at 95 Hz, a dull knock of
    sheet metal between 350 and 1100 Hz), the latch runs home 12 ms later (a hard click and a 3.1 kHz ping), the seal sighs, the building across the lot gives a duller echo 0.115 s
    later, and last the car locks itself with two polite beeps at 0.5 s and 0.66 s: the State is thorough."""
    d = 1.0
    t = tarr(d)
    x = _sin_of(_glide(140, 78, d)) * np.exp(-t / .045) * 1.0
    x += np.sin(2 * np.pi * 95 * t) * np.exp(-t / .09) * .5
    x += _band(1671, d, 350, 1100) * np.exp(-t / .012) * .9
    x += _lp4(noise6(d, 1672), 1500, 2) * np.exp(-t / .05) * .35
    _place(x, _burst(1673, .03, 2200, 6500, .003) * .8 + np.sin(2 * np.pi * 3100 * tarr(.03)) * np.exp(-tarr(.03) / .012) * .2, .012)
    first = x[:int(.09 * SR)].copy()
    _place(x, _lp4(first, 1800, 2), .115, .22)
    for at in (.5, .66):
        tt = tarr(.055)
        _place(x, (np.sin(2 * np.pi * 2650 * tt) + .3 * np.sin(4 * np.pi * 2650 * tt)) * ar(.055, .004, .014), at, .2)
    return norm6(_edge(x, .0003, .1), .8)


def _buzz_pulse(f, d, spin=.035):
    """One burst of a phone's vibration motor: a rotating weight spins up from 40 percent of its pitch in `spin` seconds, runs at f and spins down again at the end."""
    t = tarr(d)
    fr = f * (np.minimum(1, .4 + .6 * t / spin) * np.minimum(1, .45 + .55 * (d - t) / (spin * 1.3)))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return (np.sin(ph) + .35 * np.sin(2 * ph + .7) + .12 * np.sin(3 * ph + 1.9)) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .01)


def sfx_buzz():
    """A phone vibrating on something, five times, each on a different surface so the chain across the building does not repeat. Every buzz is the same two bursts of a vibration
    motor (about 170 Hz) 60 ms apart, but the thing it sits on answers differently: (1) a wooden desk, warm, the table top booming at 210 and 390 Hz with a soft rattle; (2) a
    laminate counter, harder, the case chattering at 55 Hz in the upper mids; (3) a metal tray, ringing (four inharmonic modes between 0.86 and 3.4 kHz that outlast the buzz);
    (4) a phone in a hand, muffled, nothing above 700 Hz; (5) a mug on a table, a glassy ring at 1.9 kHz. About 0.5 s each, kept out of the narrator's consonants."""
    k = _nth("buzz")
    s = k % 5
    r = rng6(1680 + s)
    d = .62
    n = int(d * SR)
    base = np.zeros(n)
    for at, dd in ((0.0, .17), (.23, .2)):
        _place(base, _buzz_pulse((172, 168, 176, 160, 180)[s], dd), at)
    gate = (base != 0).astype(float)
    chat = noise6(d, 1690 + s) * (.5 + .5 * np.sign(np.sin(2 * np.pi * (45 + 10 * s) * tarr(d)))) * gate
    if s == 0:
        x = _res(base, 210, 5) * 1.6 + _res(base, 390, 4) * 1.0 + _res(base, 740, 3) * .35 + base * .35 + _lp4(chat, 1300, 2) * .35
        x = _lp4(x, 2100, 2)
    elif s == 1:
        x = base * .3 + _res(base, 480, 6) * .8 + _res(base, 1150, 5) * .5 + _bp4(chat, 1600, 4600) * .5
        x = _lp4(x, 5200, 2)
    elif s == 2:
        ex = base * .5 + _bp4(chat, 1200, 5000) * .6
        x = base * .25 + sum(a * _res(ex, f, 28) for f, a in ((280, .8), (860, 1.0), (1420, .85), (2340, .7), (3350, .4)))
        x = _lp4(x, 5600, 2)
    elif s == 3:
        x = _lp4(base * .8 + _lp4(chat, 900, 2) * .25, 700, 3)
        x = x * .9
    else:
        ex = base * .3 + _bp4(chat, 2500, 6000) * .7
        x = base * .2 + _res(ex, 1900, 40) * 2.2 + _res(ex, 3600, 40) * 1.0 + _res(base, 330, 8) * .5
        x = _lp4(x, 6200, 2)
    x = x * np.exp(-np.maximum(0, tarr(d) - .46) / .06) if s in (2, 4) else x * np.minimum(1, (d - tarr(d)) / .04)
    return norm6(_edge(x, .001, .03), (.62, .6, .55, .5, .52)[s])


def sfx_squeak():
    """A meerkat popping up, played by a rubber toy: a reed that squeals up a third in 35 ms and slides back down over 100 ms, bright and nasal (the odd harmonics, a resonance near 2.2 kHz),
    a quiver of 38 Hz in the level, a puff of air at the start. Four different animals at (nearly) the same instant: Lemon, Strawberry, Clementine (the smallest, the highest)
    and Mango (the biggest, the lowest). 0.16 s."""
    k = _nth("squeak")
    f0 = (1500.0, 1850.0, 2300.0, 1300.0)[k % 4]
    d = .17
    t = tarr(d)
    f = f0 * (1 + .33 * np.minimum(1, t / .035) - .45 * np.clip((t - .045) / .11, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .55 * np.sin(3 * ph + .4) + .3 * np.sin(5 * ph + 1.1) + .35 * np.sin(2 * ph)
    x = _bp4(x, 700, 5800)
    x = x * (1 + .22 * np.sin(2 * np.pi * 38 * t)) * np.minimum(1, t / .004) * np.exp(-np.maximum(0, t - .06) / .05)
    x += _burst(1700 + k, d, 1800, 6000, .006) * .25
    return norm6(_edge(x, .0004, .03), .6)


def sfx_stab():
    """The colony freezes: a hard orchestral stab, 1.0 s. A cluster in the brass (G minor with a flat ninth on top, 0.3 s, closed off at 1.9 kHz), a tremolo of high strings on the same
    notes that rings a little longer, a deep drum under it (100 Hz sagging to 36 Hz) and a short crash of cymbal; it ends in a smooth fade so the silence after it is dead."""
    d = 1.0
    t = tarr(d)
    x = np.zeros(len(t))
    brass = BA.brass_chord([43, 50, 55, 58, 62, 63], .34, 1900)
    _place(x, brass * 1.0, 0.0)
    ph = 2 * np.pi * 12 * t
    strs = sum(np.sin(2 * np.pi * midi(m) * t + m) + .5 * np.sin(4 * np.pi * midi(m) * t) for m in (74, 79, 82, 86)) * (.6 + .4 * np.sin(ph))
    x += _lp4(strs, 4200, 2) * np.exp(-t / .22) * .12
    x += _sin_of(_glide(100, 36, d)) * np.exp(-t / .2) * .9
    x += _hp4(noise6(d, 1710), 3200) * np.exp(-t / .12) * .3
    x += _lp4(noise6(d, 1711), 400, 2) * np.exp(-t / .1) * .4
    return norm6(_edge(x, .0004, .22), .85)


# ================================================================ adapt: charting, a camera trap, the Administrator's display, and a door that gives up
def _junk_hit(kind, seed, pitch=1.0, stretch=1.0, crack=1.0, d=None):
    """One piece of the shower room's stash meeting the floor. `pitch` and `stretch` slow it down (the closet's landslide is in slow motion: everything a third lower and twice as long),
    `crack` is how much of the hard, bright strike is left in it (never harsh: the slow versions keep a quarter).
    chair   a wheelchair frame: tube steel ringing (four inharmonic modes), the thump of a tyre, the footplates rattling
    pole    an IV pole: a thin tube that rings for a long time, a clank
    bucket  a mop bucket: hollow plastic
    box     a cardboard box: a dull thump, a rustle
    tv      a CRT television: a deep thump, the case cracking, the tube's glass
    tree    a Christmas tree in its box: branches rustling, ornaments, tinsel
    fan     a box fan: plastic ticks and a short whirr
    rail    a bed rail: one long, soft ring
    sign    a flat plastic sign flipping over"""
    r = rng6(seed)
    d = d or {"chair": .9, "pole": 1.0, "bucket": .35, "box": .5, "tv": 1.0, "tree": .9, "fan": .45, "rail": 1.2, "sign": .3}[kind] * stretch
    t = tarr(d)
    x = np.zeros(len(t))
    sk = stretch
    if kind == "chair":
        x += _ping(480 * pitch * r.uniform(.95, 1.05), d, .1 * sk, (1.0, 2.32, 3.9, 5.7), (1.0, .65, .4, .22), (1.0, .7, .45, .3)) * .7
        x += _thump(95 * pitch, 55 * pitch, d, .05 * sk) * .8
        x += _burst(seed + 1, d, 500, 4000, .006 * sk) * .8 * crack
        for j in range(3):
            _place(x, _ping(r.uniform(1200, 2200) * pitch, .12 * sk, .03 * sk, (1.0, 2.7), (1.0, .4), (1.0, .5)), (.04 + .06 * j + r.uniform(0, .03)) * sk, .22)
    elif kind == "pole":
        x += _ping(760 * pitch * r.uniform(.96, 1.04), d, .2 * sk, (1.0, 2.76, 5.4), (1.0, .5, .25), (1.0, .55, .3)) * .55
        x += _burst(seed + 2, d, 700, 5000, .004 * sk) * .7 * crack
        x += _thump(130 * pitch, 90 * pitch, d, .03 * sk) * .5
    elif kind == "bucket":
        x += np.sin(2 * np.pi * 210 * pitch * t) * np.exp(-t / (.035 * sk)) + .5 * np.sin(2 * np.pi * 480 * pitch * t) * np.exp(-t / (.02 * sk))
        x += _burst(seed + 3, d, 400, 1500, .008 * sk) * .6
    elif kind == "box":
        x += _lp4(noise6(d, seed + 4), 700 * pitch ** .5, 2) * np.exp(-t / (.035 * sk)) * 1.0
        x += np.sin(2 * np.pi * 105 * pitch * t) * np.exp(-t / (.05 * sk)) * .8
        x += _burst(seed + 5, d, 700, 3000, .06 * sk) * .3 * (.4 + .6 * crack)
    elif kind == "tv":
        x += _sin_of(_glide(70 * pitch, 40 * pitch, d)) * np.exp(-t / (.14 * sk)) * 1.2
        x += _burst(seed + 6, d, 600, 2800, .01 * sk) * .7 * crack
        x += _ping(2400 * pitch, d, .05 * sk, (1.0, 2.3), (1.0, .5), (1.0, .6)) * .25
        x += np.sin(2 * np.pi * 170 * pitch * t) * np.exp(-t / (.04 * sk)) * .5
    elif kind == "tree":
        env = np.minimum(1, t / (.03 * sk)) * np.exp(-t / (.3 * sk))
        x += _band(seed + 7, d, 1500, 6000) * env * .5
        for j in range(int(r.integers(4, 8))):
            _place(x, _glass(r.uniform(1800, 4200) * pitch, .25 * sk, .06 * sk, .002), r.uniform(.02, .4) * sk, r.uniform(.08, .2))
        x += _lp4(noise6(d, seed + 8), 500, 2) * np.exp(-t / (.08 * sk)) * .4
    elif kind == "fan":
        for j in range(6):
            _place(x, _burst(seed + 10 + j, .03, 500, 2500, .004 * sk), (.03 + .045 * j * (1 - .1 * j)) * sk, .6 * (1 - j / 9))
        _place(x, _lp4(osc("saw", np.linspace(90, 40, int(.15 * sk * SR)), .15 * sk), 900, 2) * np.hanning(int(.15 * sk * SR)), .02 * sk, .3)
    elif kind == "rail":
        x += _ping(330 * pitch, d, .22 * sk, (1.0, 2.45, 4.2), (1.0, .5, .25), (1.0, .6, .35)) * .55
        x += _burst(seed + 12, d, 500, 3000, .004 * sk) * .5 * crack
    elif kind == "sign":
        x += _burst(seed + 13, d, 900, 3000, .008 * sk) * .8 * crack + np.sin(2 * np.pi * 380 * pitch * t) * np.exp(-t / (.02 * sk)) * .5
    return x


def _rolling(d, p0, p1, seed, f=150.0, tau=.012, gain=1.0):
    """A wheel rolling over a floor that is not quite flat: a bump every p seconds, p growing from p0 to p1 as the wheel slows (each bump a tiny thump and a tick), the bumps dying with it."""
    x = np.zeros(int(d * SR))
    r = rng6(seed)
    at, i = 0.0, 0
    while at < d - .02:
        u = at / d
        g = (1 - u) ** 1.2 * r.uniform(.7, 1.0) * gain
        _place(x, _thump(f * r.uniform(.9, 1.1), f * .6, .04, tau * 2.4) * .8 + _burst(seed + i, .04, 600, 2800, tau * .4) * .35, at, g)
        at += p0 + (p1 - p0) * u
        i += 1
    return x


def sfx_crash():
    """Three crashes in two jobs, told apart by how many times they have been asked for. The first is the adapt scene's door bursting, in real time: the stash leans on a door that has
    held for years, so a crack of wood and a hinge's snap, a deep push (60 to 32 Hz), and then everything in the room comes out at once: a wheelchair, an IV pole, a mop bucket, a
    box, a box fan, a second chair, a bed rail ringing (1.5 s). The other two are the closet's landslide in slow motion (the picture runs it at about a third speed), so everything is
    lower and longer and the hard edge is rounded off: first the wheelchairs and an IV pole, then the Christmas tree and the television (a deep, dull 'whump' with the glass
    rustling in it). Never harsh: closed off at 2.8 kHz."""
    k = _nth("crash")
    if k == 0:
        d = 1.55
        x = np.zeros(int(d * SR))
        _place(x, _burst(1801, .08, 300, 3500, .005) * 1.1 + _ping(1900, .08, .01, (1.0, 2.2), (1.0, .5), (1.0, .6)) * .35, 0.0)
        _place(x, _thump(60, 32, .4, .12) * 1.0, 0.0)
        _place(x, _lp4(noise6(.3, 1802), 500, 2) * np.exp(-tarr(.3) / .08) * .7, 0.0)
        for at, kind, sd, g, pi in ((.03, "chair", 1810, 1.0, 1.0), (.08, "pole", 1811, .9, 1.0), (.15, "bucket", 1812, .8, 1.0), (.21, "box", 1813, .8, 1.0), (.30, "fan", 1814, .6, 1.0),
                                    (.38, "chair", 1815, .6, .9), (.52, "rail", 1816, .5, 1.0), (.66, "box", 1817, .35, .9)):
            _place(x, _junk_hit(kind, sd, pi), at, g)
        _place(x, _lp4(noise6(.9, 1818), 1100, 2) * np.interp(tarr(.9), [0, .1, .9], [0, 1, 0]) * .25, .1)
        return norm6(_edge(x, .0004, .25), .9)
    if k == 1:
        d = 1.55
        x = np.zeros(int(d * SR))
        for at, kind, sd, g, pi in ((0.0, "chair", 1830, 1.0, .58), (.14, "pole", 1831, .8, .55), (.42, "chair", 1832, .6, .5), (.7, "bucket", 1833, .45, .5)):
            _place(x, _junk_hit(kind, sd, pi, 1.8, .25), at, g)
        x += _sin_of(_glide(60, 34, d)) * np.exp(-tarr(d) / .35) * .55
        return norm6(_edge(_lp4(x, 2800, 2), .003, .3), .85)
    d = 1.55
    x = np.zeros(int(d * SR))
    for at, kind, sd, g, pi in ((0.0, "tv", 1840, 1.0, .6), (.07, "tree", 1841, .8, .55), (.3, "box", 1842, .6, .5), (.45, "rail", 1843, .45, .5)):
        _place(x, _junk_hit(kind, sd, pi, 1.8, .25), at, g)
    x += _sin_of(_glide(55, 32, d)) * np.exp(-tarr(d) / .3) * .5
    return norm6(_edge(_lp4(x, 2800, 2), .003, .3), .85)


def sfx_clatter():
    """What follows each crash. The first (adapt, 1.3 s) is the spill: a wheelchair that has got out of the room and is rolling away on its own, slowing, with small things skittering
    after it. The other two are the landslide's slow-motion tail: an IV pole pinwheeling over the floor (a soft, pitched-down 'tonk' every revolution, slowing) with the mop buckets
    bonking; then the boxes bursting open, the HOURS SINCE THE Q WORD sign flipping over and a cloud of old tinsel settling (a soft shimmer that goes on after the last box). The
    last one is gone by 0.75 s so the narrator's line is clear. (From the fourth call on it is the old skitter, which is what the ambience beds ask for.)"""
    k = _nth("clatter")
    if k >= 3:
        return A6.sfx_clatter()
    if k == 0:
        d = 1.3
        x = _rolling(d, .035, .15, 1850, 150, .012, 1.0)
        r = rng6(1851)
        for j in range(8):
            at = r.uniform(.05, .8)
            _place(x, _ping(r.uniform(900, 2600), .15, r.uniform(.02, .05), (1.0, 2.5), (1.0, .4), (1.0, .5)), at, r.uniform(.1, .3) * (1 - at / 1.1))
        _place(x, _junk_hit("bucket", 1852, 1.0, 1.0, .8), .5, .45)
        return norm6(_edge(x, .001, .25), .6)
    if k == 1:
        d = 1.2
        x = _rolling(d, .09, .26, 1860, 100, .02, .8)
        for j, (at, f) in enumerate(((.05, 420), (.33, 410), (.64, 395), (.98, 380))):                  # the pinwheeling pole: once a revolution
            _place(x, _ping(f * .6, .5, .22, (1.0, 2.76, 5.4), (1.0, .45, .2), (1.0, .55, .3)), at, .55 * (1 - j * .15))
        _place(x, _junk_hit("bucket", 1861, .6, 1.8, .25), .2, .6)
        _place(x, _junk_hit("bucket", 1862, .55, 1.8, .25), .7, .45)
        return norm6(_edge(_lp4(x, 3000, 2), .003, .3), .65)
    d = .78
    x = np.zeros(int(d * SR))
    _place(x, _junk_hit("box", 1870, .6, 1.6, .25, d=.5), 0.0, 1.0)
    _place(x, _junk_hit("box", 1871, .5, 1.6, .25, d=.5), .17, .6)
    _place(x, _junk_hit("sign", 1872, .6, 1.6, .25), .3, .55)
    t = tarr(d)
    shimmer = _band(1873, d, 3500, 8500) * np.interp(t, [0, .1, .35, .78], [0, .6, 1, 0])
    shimmer *= (.5 + .5 * (noise6(d, 1874) > .6))
    x += _lp4(shimmer, 6500, 2) * .13
    return norm6(_edge(_lp4(x, 3200, 2), .003, .3), .5)


def _key(seed, space=False):
    """One keystroke on a membrane keyboard: the thock of the key bottoming (500 to 1500 Hz), a click of the contact and, for the space bar, a lower and longer knock."""
    d = .05 if space else .03
    t = tarr(d)
    if space:
        return _burst(seed, d, 300, 1100, .012) * 1.0 + np.sin(2 * np.pi * 150 * t) * np.exp(-t / .02) * .5
    return _burst(seed, d, 600, 1700, .006) * .9 + _burst(seed + 1, d, 2800, 6500, .0015) * .35 + np.sin(2 * np.pi * 230 * t) * np.exp(-t / .008) * .25


def sfx_typing():
    """Lemon charting three weeks in nine minutes: a frantic keyboard, 2.0 s. The keys come in words of four to seven strokes that get faster from 85 ms apart to 35 ms, a space bar
    between them, each stroke a little different, with a mouse click once in a while; then, as the narrator finishes 'minutes', one hard final Enter (two strokes, heavier) and
    nothing. Closed off at 4.5 kHz and kept below the narrator's level: it is a texture under his sentence, not a second voice."""
    d = 2.0
    x = np.zeros(int(d * SR))
    r = rng6(1880)
    t, i, w = .02, 0, 0
    wl = int(r.integers(4, 7))
    while t < 1.8:
        u = min(1.0, t / 1.3)
        iv = (.085 - .05 * u * u * (3 - 2 * u)) * r.uniform(.8, 1.25)
        _place(x, _key(1890 + i), t, r.uniform(.45, 1.0))
        w += 1
        t += iv
        i += 1
        if w >= wl:
            _place(x, _key(1990 + i, True), t, r.uniform(.7, 1.0))
            t += iv * 1.5 + .02
            w, wl = 0, int(r.integers(4, 8))
    for at, g in ((1.4, .5),):
        _place(x, _burst(1960, .02, 1500, 5000, .003) * .8 + np.sin(2 * np.pi * 900 * tarr(.02)) * np.exp(-tarr(.02) / .004) * .2, at, g)   # a mouse click
    _place(x, _key(1970) * 1.4, 1.84, 1.0)                                                                                              # Enter
    _place(x, _thump(220, 120, .05, .015) * .4, 1.84, 1.0)
    _place(x, _key(1971) * 1.7, 1.905, 1.0)
    _place(x, _thump(200, 100, .06, .02) * .6, 1.905, 1.0)
    return norm6(_edge(_lp4(x, 4500, 2), .001, .03), .5)


def sfx_shutter():
    """A trail camera's shutter, twice (0.9 s apart): the relay's 'kchk' (a hard click and a knock of the housing at 320 Hz), 50 ms later the infrared cut filter flipping over (softer,
    lower), and as the flash charges a thin whine climbs from 3 to 6.5 kHz and falls away (very quiet) with a last tick when the capacitor is full. The second one is a little duller:
    the batteries are not what they were. 0.8 s."""
    k = _nth("shutter")
    d = .8
    t = tarr(d)
    x = np.zeros(len(t))
    x += _burst(1900 + k, d, 1800, 6500, .004) * 1.0 + np.sin(2 * np.pi * (320 - 30 * k) * t) * np.exp(-t / .012) * .45
    _place(x, _burst(1902 + k, .03, 1000, 3500, .006) * .55 + _thump(260, 160, .03, .01) * .25, .05)
    wh = _sin_of(np.interp(t, [0, .5, .7], [3000, 6500, 5200])) * np.interp(t, [0, .06, .35, .7], [0, 1, .5, 0]) * .05
    x += _bp4(wh, 2500, 7000)
    _place(x, _burst(1904 + k, .01, 2500, 8000, .002) * .3, .62)
    return norm6(_edge(_lp4(x, 7000 - 800 * k, 2), .0005, .05), .7)


def sfx_scribble():
    """Clementine dating the insulin pens: a felt-tip marker, six strokes over 0.7 s (a short line, a loop, a tick), each stroke a squeal of felt on plastic that glides a little (1.6
    to 3.6 kHz) with the scratch of the nib under it, and the cap tapped on the table at the end."""
    d = .8
    x = np.zeros(int(d * SR))
    r = rng6(1910)
    at = .02
    for i in range(6):
        sd = r.uniform(.07, .12)
        t = tarr(sd)
        fc = r.uniform(1700, 3000)
        sq = _bp4(noise6(sd, 1911 + i), fc * .85, fc * 1.35) * (.55 + .45 * np.sin(2 * np.pi * r.uniform(40, 70) * t))
        scr = _bp4(noise6(sd, 1921 + i), 3500, 7500) * .25
        _place(x, (sq + scr) * np.sin(np.pi * t / sd) ** .7, at, r.uniform(.6, 1.0))
        at += sd + r.uniform(.015, .04)
    _place(x, _burst(1930, .03, 700, 2800, .005) + np.sin(2 * np.pi * 520 * tarr(.03)) * np.exp(-tarr(.03) / .008) * .4, at + .02, .6)
    return norm6(_edge(x, .002, .06), .4)


def sfx_pizzabox():
    """The Administrator's display: nine pizza boxes fanned open behind him like a peacock's tail, 0.8 s. Each box is a cardboard flap (a puff of low noise and a dry slap), they follow
    one another 28 ms apart and slow a little, getting brighter as the fan opens, and the last one is a box set down on the desk with a soft thud and a small rattle."""
    d = .85
    x = np.zeros(int(d * SR))
    at = .0
    for j in range(9):
        fl = _lp4(noise6(.06, 1940 + j), 900 + 150 * j, 2) * np.exp(-tarr(.06) / .012) * .9
        fl += _burst(1950 + j, .06, 700 + 150 * j, 2600 + 250 * j, .006) * .7
        _place(x, fl, at, .6 + .05 * j)
        at += .028 + .004 * j
    _place(x, _thump(125, 62, .3, .07) * .8, at + .03, 1.0)
    _place(x, _lp4(noise6(.15, 1960), 800, 2) * np.exp(-tarr(.15) / .035) * .6, at + .03, 1.0)
    for j in range(4):
        _place(x, _burst(1961 + j, .06, 500, 2600, .018), at + .09 + j * .05, .22 * (1 - j / 5))
    return norm6(_edge(x, .001, .1), .8)


# ================================================================ arrive: a sliding door, a binder on a desk, binoculars
def sfx_slidedoor():
    """The lobby's automatic doors opening on the afternoon, 1.6 s: the belt motor spins up and eases off (90 Hz to 240 Hz and back to 140 Hz through a round filter), the two glass
    panes slide on their track (a soft 'sshhh' of 0.7 to 3.5 kHz), the rubber stop takes them at 0.82 s, and the entry chime says its two notes (G5 then C6, a fourth up, a little
    bell with a fast-dying overtone). The mixer ducks it under speech, which matters because the surveyor's first words begin as the chime rings out."""
    d = 1.6
    t = tarr(d)
    f = np.interp(t, [0, .15, .5, .85], [90, 200, 240, 140])
    ph = np.cumsum(f) / SR
    motor = (2 * (ph % 1) - 1) * .6 + np.sin(2 * np.pi * ph) * .5
    motor = _lp4(motor, 1300, 2) * np.interp(t, [0, .06, .6, .88], [0, 1, .8, 0]) * .45
    glide = _band(2001, d, 700, 3500) * np.interp(t, [0, .08, .45, .82], [0, .7, 1.0, 0]) * .5
    x = motor + glide
    _place(x, _sum(_thump(95, 60, .15, .05) * .5, _burst(2002, .04, 800, 3000, .006) * .5), .82)
    for at, fq, g in ((.55, 784.0, .5), (.8, 1046.5, .55)):
        tt = tarr(.8)
        _place(x, (np.sin(2 * np.pi * fq * tt) + .4 * np.sin(2 * np.pi * 2.76 * fq * tt) * np.exp(-tt / .08)) * np.exp(-tt / .22) * np.minimum(1, tt / .003), at, g)
    return norm6(_edge(x, .002, .15), .55)


def sfx_thud():
    """Two soft landings, told apart by how many times they have been asked for. The first is the entrance conference's binder, the size of a cinder block, put on a wooden desk
    (1.4 s): a push of air as the slab comes down, the desk top booming (105 Hz sagging to 55 Hz, and its second mode at 190 Hz), a slap of paper, the pen cup and the stapler
    rattling, and 40 ms after it the desk bell, jolted by the blow, goes 'ting' (2.35 kHz with a bell's overtones, a quick decay) and, rocking, a smaller second 'ting' 0.3 s later.
    The second is the Administrator's face on a pizza box (0.6 s): a hollow, soft 'foomp' of cardboard giving way, a wet little squish, a flap of the lid."""
    k = _nth("thud")
    if k == 0:
        d = 1.4
        t = tarr(d)
        x = _lp4(noise6(d, 2010), 700, 2) * np.exp(-t / .05) * .8
        x += (_sin_of(_glide(105, 55, d)) * np.exp(-t / .11) * 1.0 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / .05) * .5)
        x += _burst(2011, d, 900, 4500, .005) * .5 + _burst(2012, d, 1500, 6000, .03) * .15
        x += np.sin(2 * np.pi * 340 * t) * np.exp(-t / .03) * .75 + _band(2014, d, 250, 900) * np.exp(-t / .02) * .6      # the desk's knock: what a phone speaker can play
        x += np.sin(2 * np.pi * 210 * t) * np.exp(-t / .07) * .9 + _band(2015, d, 120, 450) * np.exp(-t / .05) * 1.1        # and the whump of the slab, in the band a small speaker keeps
        r = rng6(2013)
        for j in range(5):
            _place(x, _ping(r.uniform(1400, 3200), .1, r.uniform(.015, .03), (1.0, 2.6), (1.0, .4), (1.0, .5)), .02 + .035 * j + r.uniform(0, .03), .14)
        for at, g, tau in ((.04, .3, .26), (.34, .14, .2)):
            tt = tarr(.9)
            bell = (np.sin(2 * np.pi * 2350 * tt) + .55 * np.sin(2 * np.pi * 2350 * 2.76 * tt) * np.exp(-tt / (tau * .4)) + .25 * np.sin(2 * np.pi * 2350 * 5.4 * tt) * np.exp(-tt / (tau * .2)))
            _place(x, bell * np.exp(-tt / tau) * np.minimum(1, tt / .0015), at, g)
        return norm6(_edge(x, .0004, .2), .85)
    d = .6
    t = tarr(d)
    x = _lp4(noise6(d, 2020), 600, 2) * np.interp(t, [0, .012, .05, .16], [0, 1, .5, 0]) * .9
    x += _sin_of(_glide(120, 66, d)) * np.exp(-t / .07) * .8
    _place(x, _burst(2021, .15, 600, 2200, .05) * .25, .02)
    _place(x, _sum(_sin_of(_glide(330, 130, .07)) * np.exp(-tarr(.07) / .03) * .35, _lp4(noise6(.06, 2022), 1200, 2) * np.exp(-tarr(.06) / .02) * .3), .07)
    _place(x, _burst(2023, .12, 900, 3200, .035) * .16, .2)
    return norm6(_edge(x, .0004, .1), .75)


def sfx_slowwhoosh():
    """The surveyor raises his binoculars, 0.85 s: a soft swell of air and the rustle of a windbreaker (300 Hz to 1.8 kHz), then the focus ring's little servo, a thin whirr that steps up
    in two notches (1.8 then 2.4 kHz, with an 80 Hz flutter) as the view settles on its subject. It ends before the lock-on blip, which has the next word."""
    d = .85
    t = tarr(d)
    air = _band(2030, d, 300, 1800) * np.interp(t, [0, .35, .6, .85], [0, 1, .5, 0]) * .8
    cloth = _band(2031, d, 1500, 5000) * np.interp(t, [0, .04, .2, .3], [0, .5, .2, 0]) * .25
    servo = np.zeros(len(t))
    for a, b, fq in ((.42, .62, 1800.0), (.62, .78, 2400.0)):
        m = (t >= a) & (t < b)
        servo[m] = np.sin(2 * np.pi * fq * t[m]) * (.6 + .4 * np.sin(2 * np.pi * 80 * t[m])) * np.sin(np.pi * (t[m] - a) / (b - a)) ** .5
    x = air + cloth + _bp4(servo, 1200, 3500) * .09
    _place(x, _burst(2032, .02, 1200, 5000, .003) * .25, .62)
    return norm6(_edge(x, .004, .1), .5)


def sfx_click():
    """The binocular rangefinder locks on, 0.35 s: a small tick, then a two-note blip going up (G6 for 55 ms, C7 for 140 ms), a triangle wave with a hint of its octave, soft edges."""
    d = .35
    x = np.zeros(int(d * SR))
    _place(x, _burst(2040, .01, 1800, 6000, .002) * .5, 0.0)
    for at, f, dd, tau in ((.012, 1568.0, .06, .05), (.07, 2093.0, .26, .09)):
        t = tarr(dd)
        tri = 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
        _place(x, (tri + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / tau) * ar(dd, .004, .02), at, .9)
    return norm6(_edge(_lp4(x, 6500, 2), .0005, .04), .5)


# ================================================================ tracer: a run, three call lights, a banana peel
def sfx_whoosh():
    """The camera whips along the floor after Strawberry (0.55 s, stereo): a band of air that sweeps up from 500 Hz to 3.8 kHz in 0.2 s and falls back to 800 Hz, travelling from left
    to right across the picture, with a push of low air under it at the start."""
    d = .55
    t = tarr(d)
    fc = np.interp(t, [0, .2, .55], [500, 3800, 800])
    w = _tv_filter(noise6(d, 2050), fc, 1.4, "bp")
    w = w / (np.abs(w).max() + 1e-9) * np.minimum(1, t / .04) * np.exp(-np.maximum(0, t - .18) / .15)
    th = (np.interp(t, [0, .3, .55], [-.6, .3, .8]) + 1) * np.pi / 4
    out = np.stack([w * np.cos(th), w * np.sin(th)])
    low = _thump(130, 70, d, .08) * np.minimum(1, t / .01) * .35
    out += np.stack([low * .7, low * .7])
    out = np.stack([_lp4(out[0], 6000, 2), _lp4(out[1], 6000, 2)])
    return norm6(_edge(out, .002, .12), .6)


def _foley_cloth(seed, d, lo=300, hi=2200, peak=.5):
    t = tarr(d)
    return _band(seed, d, lo, hi) * np.sin(np.pi * t / d) ** 1.4 * peak


def sfx_scramble():
    """Strawberry sprinting the middle floor, 3.3 s of what her hands and her scrubs do while her feet (the animation lays those itself) go flat out: a rustle of cloth that never lets
    up, and three flurries that finish just before each call light rings (at 1.0 s, 2.0 s and 2.8 s into this sound): ROOM 4 (a blanket flicked straight, the bed alarm switched on with
    a double blip, a cord tucked in), ROOM 7 (a blanket, a candy wrapper pocketed, a name tag snapped on) and the shower room door (a button pressed home, her cap flying off with a
    small flap). Quiet: it is the nurse, not the music."""
    d = 3.3
    x = np.zeros(int(d * SR))
    t = tarr(d)
    run = _band(2060, d, 250, 2600) * (.35 + .25 * np.sin(2 * np.pi * 4.6 * t)) * np.interp(t, [0, .15, 2.9, 3.3], [0, 1, 1, 0]) * .22
    x += run
    _place(x, _foley_cloth(2061, .3, 300, 2500, .55), .0, 1.0)

    def blip(at, f, dd=.04):
        tt = tarr(dd)
        _place(x, np.sin(2 * np.pi * f * tt) * ar(dd, .003, .01) * .2, at, 1.0)

    def snap(at, sd):
        _place(x, _burst(sd, .02, 1800, 6500, .003) * .8 + _burst(sd + 1, .02, 2500, 7000, .0015) * .4, at, 1.0)

    _place(x, _foley_cloth(2062, .22, 400, 2200, .5), .5, 1.0)                              # ROOM 4: a blanket flicked straight
    snap(.7, 2063)
    blip(.74, 1250.0)
    blip(.80, 1250.0)                                                                       # the bed alarm
    _place(x, _band(2064, .12, 2500, 6500) * np.hanning(int(.12 * SR)) * .35, .82)         # a cord tucked in
    _place(x, _foley_cloth(2065, .22, 400, 2200, .5), 1.5, 1.0)                             # ROOM 7: a blanket
    r = rng6(2066)
    for j in range(24):                                                                     # a wrapper pocketed
        at = 1.66 + r.uniform(0, .18)
        _place(x, _burst(2070 + j, .01, r.uniform(2200, 4500), 9000, r.uniform(.001, .003)), at, r.uniform(.1, .45))
    snap(1.92, 2067)
    snap(1.95, 2068)                                                                        # the name tag
    snap(2.55, 2069)                                                                        # the button pressed home
    _place(x, _foley_cloth(2095, .16, 500, 3000, .4), 2.62, 1.0)                            # her cap flies off
    return norm6(_edge(x, .003, .2), .45)


def sfx_ding1():
    """The call light's chime, the series' own (a sine with the bell partials at 2.76 and 5.4 times, the high ones dying fast): a ding at 880 Hz and a dong a fourth down at 659 Hz.
    The first three are the tracer's (Strawberry puts a call button within reach of Mr. Banana, of Mrs. Cranberry, and at the shower room door; each is a test of the button, so it
    is short and close and a little brighter every time: 1.0 s). The fourth is the exit conference's, from the hall into a room full of people who have just sat down for the first
    time in years: the same two notes, rounder, with the dong a little longer and the hall's echo coming back 0.13 s later, duller (1.4 s)."""
    k = _nth("ding1")
    if k < 3:
        d = 1.0
        x = np.zeros(int(d * SR))
        _place(x, _call_ding(880, .15), 0.0, 1.0)
        _place(x, _call_ding(659, .17), .3, .85)
        return norm6(_edge(_lp4(x, (3800, 4800, 6500)[k], 2), .0005, .08), .6)
    d = 1.4
    x = np.zeros(int(d * SR))
    _place(x, _call_ding(880, .2), 0.0, 1.0)
    _place(x, _call_ding(659, .27), .4, .9)
    echo = _lp4(x[:int(1.0 * SR)], 2600, 2)
    _place(x, echo, .13, .22)
    return norm6(_edge(_lp4(x, 5200, 2), .0005, .2), .7)


def sfx_peel():
    """Mr. Banana's foot finds the peel, 0.45 s: the squelch of a heel on the inside of a banana (a wet, low-passed burst with a pitch that drops from 260 to 110 Hz) and, on the
    heel of it, the skid: a rubber squeal that slides up and falls back (650 Hz to 1.5 kHz and down to 900 Hz in a quarter of a second), nasal."""
    d = .45
    t = tarr(d)
    x = _lp4(noise6(d, 2110), 900, 2) * np.exp(-t / .04) * .9 + _sin_of(_glide(260, 110, d)) * np.exp(-t / .05) * .5
    sd = .26
    tt = tarr(sd)
    f = np.interp(tt, [0, .1, sd], [650, 1500, 900])
    ph = 2 * np.pi * np.cumsum(f) / SR
    sq = (np.sin(ph) + .5 * np.sin(2 * ph) + .3 * np.sin(3 * ph)) * np.sin(np.pi * tt / sd) ** .8
    _place(x, _bp4(sq, 500, 4200) * .3 + _bp4(noise6(sd, 2111), 1500, 3500) * np.sin(np.pi * tt / sd) * .12, .05)
    return norm6(_edge(x, .0005, .08), .6)


def sfx_boing():
    """A cartoon spring, 0.7 s: a note that leaps from 180 Hz to 440 Hz and wobbles on its way down (13 Hz, dying), with its octave and a ring at 1.4 kHz where the spring itself answers."""
    d = .7
    t = tarr(d)
    f = 180 + 260 * (1 - np.exp(-9 * t)) + 70 * np.sin(2 * np.pi * 13 * t) * np.exp(-3 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + .4 * np.sin(2 * ph + .5) + .15 * np.sin(3 * ph)) * ar(d, .008, .3)
    x += _res(_burst(2120, d, 800, 3000, .01) * .6, 1400, 20) * .25
    return norm6(_edge(x, .002, .1), .55)


# ================================================================ closet: a door that strains, and a room that lets go
def sfx_creak():
    """A door holding back a room full of furniture, 0.62 s: the hinge groans as the stash leans on it (a stick-slip note that rises from 85 to 130 Hz through two wooden resonances at
    450 and 900 Hz, swelling and trembling), the tape across it stretching (a few small ticks), one knock of wood as a wheelchair shifts behind the door at 0.35 s, and the strain
    easing at the end. It is gone before Strawberry says 'Stand back.'"""
    d = .62
    t = tarr(d)
    f = np.interp(t, [0, .3, .55], [85, 130, 118]) * (1 + .05 * _smooth_rand(d, 2130, 30))
    ph = np.cumsum(f) / SR
    saw = (2 * (ph % 1) - 1) * rng6(2131).uniform(.6, 1.0, int(ph.max()) + 3)[ph.astype(int)]
    body = _bp4(saw, 330, 620) + .8 * _bp4(saw, 700, 1150) + .35 * _bp4(saw, 1300, 1900)
    x = _unit(body) * np.interp(t, [0, .12, .3, .5, .62], [0, .7, 1, .6, 0]) * (.85 + .15 * np.sin(2 * np.pi * 17 * t)) * .8
    for at, g in ((.12, .12), (.19, .18), (.26, .1), (.41, .15), (.47, .1)):
        _place(x, _burst(int(at * 1e4) + 2132, .02, 2200, 6500, .002), at, g)
    _place(x, np.sin(2 * np.pi * 140 * tarr(.12)) * np.exp(-tarr(.12) / .03) * .6 + _burst(2133, .12, 700, 3000, .008) * .5, .35)
    return norm6(_edge(x, .004, .08), .55)


def sfx_slowmo():
    """The picture drops to a third of its speed, 1.5 s: a band of air that falls from 3.2 kHz to 160 Hz (the tape dragging), a tone that sags from 420 to 60 Hz with its octave, a deep
    breath of sub bass under it and a soft, reversed swell of noise that peaks at 0.6 s."""
    d = 1.5
    t = tarr(d)
    fc = 3200 * (160 / 3200) ** np.minimum(1, t / 1.2)
    air = _tv_filter(noise6(d, 2140), fc, 1.2, "bp")
    air = air / (np.abs(air).max() + 1e-9) * np.interp(t, [0, .15, .5, 1.5], [0, 1, .6, 0]) * .8
    tone = _sin_of(_glide(420, 60, d)) + .35 * _sin_of(_glide(840, 120, d))
    x = air + tone * np.interp(t, [0, .2, .8, 1.5], [0, .6, .4, 0])
    x += np.sin(2 * np.pi * 42 * t) * np.interp(t, [0, .3, 1.0, 1.5], [0, .5, .35, 0])
    swell = _band(2141, d, 600, 3500) * np.interp(t, [0, .6, .65, 1.5], [0, 1, .2, 0]) ** 1.5 * .25
    return norm6(_edge(_lp4(x + swell, 4200, 2), .004, .2), .6)


def sfx_rumble():
    """A room full of furniture beginning to move, 2.45 s: a low rolling (noise under 110 Hz, a 40 Hz sub), wheels turning on tile (a slow beat of 7 down to 3.5 Hz in the level), a dozen
    heavy thumps as things shift, and far-off metal ringing very quietly. It swells to its peak at 0.8 s, thins from 1.5 s and is gone by 2.4 s, so the narrator, who starts 2.55 s
    after this begins, speaks over a settled room. Never harsh: nothing above 700 Hz that is not a quiet ring."""
    d = 2.45
    t = tarr(d)
    env = np.interp(t, [0, .25, .8, 1.5, 2.1, 2.45], [0, .3, 1.0, .75, .2, 0])
    low = _unit(_lp4(noise6(d, 2150), 110, 3)) * env
    beat = .6 + .4 * np.sin(2 * np.pi * np.cumsum(np.interp(t, [0, d], [7, 3.5])) / SR)
    roll = _unit(_band(2151, d, 70, 320)) * env * beat * .55
    sub = np.sin(2 * np.pi * np.cumsum(np.interp(t, [0, d], [42, 33])) / SR) * env * .6
    x = low + roll + sub
    r = rng6(2152)
    for j in range(12):
        at = r.uniform(.25, 1.9)
        _place(x, _thump(r.uniform(70, 120), r.uniform(40, 60), .25, r.uniform(.05, .09)) * .9, at, float(np.interp(at, [0, .8, 1.5, 2.1], [.3, 1, .7, .2])) * r.uniform(.4, .9))
    for j in range(5):
        at = r.uniform(.4, 1.8)
        _place(x, _ping(r.uniform(350, 620), .5, .2, (1.0, 2.4, 4.1), (1.0, .4, .2), (1.0, .6, .4)), at, .045)
    return norm6(_edge(_lp4(x, 900, 2), .003, .25), .65)


# ================================================================ verdict: a snare roll, two stamps, a Plinko board
def _snare_stroke(seed, d=.03):
    t = tarr(d)
    return _burst(seed, d, 900, 5000, .009) * .8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / .012) * .35


def _roll(d, rate, lo, hi, seed):
    """A closed snare roll: `rate` strokes a second (a little uneven, left and right hand a hair apart in strength), growing from level `lo` to `hi` and cut off in the last 25 ms."""
    x = np.zeros(int(d * SR))
    r = rng6(seed)
    strokes = [_snare_stroke(seed + 7 * j) for j in range(8)]
    at, i = 0.0, 0
    while at < d - .02:
        g = lo + (hi - lo) * (at / d) ** 1.4
        _place(x, strokes[int(r.integers(0, 8))], at, g * r.uniform(.75, 1.0) * (1.0 if i % 2 == 0 else .85))
        at += r.uniform(.85, 1.15) / rate
        i += 1
    return x


def sfx_drumroll():
    """A quiet snare roll under the exit conference, twice. The first (0.82 s) is the room holding its breath before the surveyor speaks: it swells from nothing and is cut off at the
    end of the beat, so the first word is clean. The second (3.15 s) is the build to the Plinko ball: it starts as he reads 'F seven twenty-five', grows through the whole line, and is
    cut dead 50 ms before the first peg, so the pegs have the air to themselves. Strokes between 0.9 and 5 kHz, closed off at 5 kHz and kept low: it is a tension, not a drum solo."""
    k = _nth("drumroll")
    if k == 0:
        d = .82
        x = _roll(d, 26, .1, .7, 2400)
    else:
        d = 3.15
        x = _roll(d, 24, .12, .8, 2410)
    x = _lp4(x, 5000, 2)
    return norm6(_edge(x, .01, .03), .45)


def sfx_stamp():
    """Two stamps. The first (4.1 s into the exit conference) is the letter D going onto F-761: a rubber stamp brought down on a pad of forms on a conference table (0.45 s), a body that
    sags from 180 to 95 Hz, the squish of rubber, the slap of the paper, the table answering at 130 Hz and a tiny squelch as the stamp lifts. The second is the NEW TAG, the biggest sound
    in the film so far (2.3 s): a deep boom (120 Hz falling to 38 Hz and a 60 Hz sub under it), the slam of a very large stamp on a very large table (900 Hz and a hard crack), the
    floor answering, and then a bell in C major: partials at 1, 1.5, 2, 2.5 and 3 times 523 Hz, the highest dying first, and a handful of glints (G7, B7, D8) that are the gold in
    green-and-gold. Light and a swell: the score does the swell, this is the hit."""
    k = _nth("stamp")
    if k == 0:
        d = .45
        t = tarr(d)
        x = _sin_of(_glide(180, 95, d)) * np.exp(-t / .035) * 1.0
        x += _lp4(noise6(d, 2200), 1200, 2) * np.exp(-t / .02) * .6
        x += _burst(2201, d, 1500, 5000, .004) * .5
        x += np.sin(2 * np.pi * 130 * t) * np.exp(-t / .06) * .5
        _place(x, _sin_of(_glide(700, 300, .02)) * np.hanning(int(.02 * SR)) * .12, .03)
        return norm6(_edge(x, .0004, .08), .85)
    d = 2.3
    t = tarr(d)
    x = _sin_of(_glide(120, 38, d)) * np.exp(-t / .35) * 1.0 + np.sin(2 * np.pi * 60 * t) * np.exp(-t / .5) * .45
    x += _lp4(noise6(d, 2210), 900, 2) * np.exp(-t / .06) * .9
    x += _burst(2211, d, 1000, 6000, .01) * .6
    x += np.sin(2 * np.pi * 95 * t) * np.exp(-t / .15) * .4
    for fq, a, tau in ((523.25, .4, .5), (784.0, .22, .4), (1046.5, .22, .35), (1318.5, .14, .25), (1568.0, .1, .2)):
        x += np.sin(2 * np.pi * fq * t) * np.exp(-t / tau) * a * np.minimum(1, t / .004)
    for j, fq in enumerate((3136.0, 3951.0, 4699.0)):
        _place(x, _glass(fq, .5, .16, .002), .03 + .035 * j, .1)
    return norm6(_edge(x, .0004, .4), .92)


PLINK_F = (523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0, 2349.32)   # C major pentatonic from C5: C D E G A C D E G A C D


def sfx_plink():
    """One peg of the Plinko board: the ball touches a wooden peg (a soft 'tok', a 360 Hz knock) and the peg rings like a small glass bell. Twelve calls, one per row from the top, and
    the n-th is the n-th note of a major pentatonic scale from C5 (523 Hz) to D7 (2.35 kHz), so the ball can be heard climbing as it falls; the bell is a hair shorter at the top and the
    level is corrected a little for the ear. The twelfth is the last peg, where the ball hangs and trembles: the same D7, but 1.5 s long, its pitch wobbling and its level beating at a
    rate that slows from 13 to 4.5 times a second, a tick-tick-tick of the ball settling that speeds up and stops, and a level that falls away so the Administrator's 'We had five
    nurses.' (0.2 s later) is not buried."""
    k = _nth("plink") % 12
    f = PLINK_F[k]
    if k < 11:
        d = .42
        x = np.zeros(int(d * SR))
        tau = .13 - .004 * k
        _place(x, _glass(f, .38, tau, .0015, .6), 0.0, 1.0)
        _place(x, _glass(f * 2.0, .2, tau * .5, .0015, .3), 0.0, .12)
        _place(x, _burst(2300 + k, .02, 1500, 4200, .003) * .55 + np.sin(2 * np.pi * 360 * tarr(.02)) * np.exp(-tarr(.02) / .01) * .25, 0.0)
        x *= (f / 1000.0) ** -.25
        return norm6(_edge(x, .0003, .06), .7)
    d = 1.5
    t = tarr(d)
    wob = 1 + .004 * np.sin(2 * np.pi * np.cumsum(np.interp(t, [0, 1.2, d], [14, 5, 5])) / SR)
    ph = 2 * np.pi * np.cumsum(f * wob) / SR
    env = np.interp(t, [0, .004, .22, .5, d], [0, 1, .75, .3, 0])
    trem = 1 + .35 * np.sin(2 * np.pi * np.cumsum(np.interp(t, [0, 1.2, d], [13, 4.5, 4.5])) / SR)
    x = (np.sin(ph) + .16 * np.sin(2.76 * ph) * np.exp(-t / .12) + .1 * np.sin(2 * ph) * np.exp(-t / .2)) * env * trem
    at = .03
    for j, iv in enumerate((.06, .055, .05, .045, .04, .034, .028, .022, .016)):
        _place(x, _burst(2310 + j, .012, 2000, 6000, .0015), at, (1 - j / 12) * .35)
        at += iv
    _place(x, _burst(2320, .02, 1500, 4200, .003) * .55 + np.sin(2 * np.pi * 360 * tarr(.02)) * np.exp(-tarr(.02) / .01) * .25, 0.0)
    x *= (f / 1000.0) ** -.25
    return norm6(_edge(x, .0003, .2), .7)


def sfx_plinkland():
    """The ball drops into slot L, the worst one, 1.6 s (mono: the script pans it hard right, to the slot): a hollow wooden clunk (a body that sags from 200 to 120 Hz, a 330 Hz
    resonance of the slot, a dull knock), then, 70 ms behind it, a rising game-show bell that celebrates the worst news of the afternoon: C6, E6, G6 and a long C7 (a bell's
    overtones at 2.76 and 5.4 times, the last note ringing for 0.4 s), a red lamp beginning to turn (a 70 Hz motor and a soft swish at 1.8 times a second that swells in from 0.4 s)
    and a handful of glints. The clunk and the first bell fall under the surveyor's 'You had one.', which is the joke; the bright part is short."""
    d = 1.6
    t = tarr(d)
    x = np.zeros(len(t))
    ct = tarr(.25)
    clunk = _sin_of(_glide(200, 120, .25)) * np.exp(-ct / .06) + np.sin(2 * np.pi * 330 * ct) * np.exp(-ct / .1) * .4 + _burst(2400, .25, 400, 1400, .02) * .5
    _place(x, clunk, 0.0, 1.0)
    bt = tarr(.9)
    for at, f, g, tau in ((.07, 1046.5, .55, .2), (.17, 1318.5, .65, .2), (.27, 1568.0, .75, .2), (.40, 2093.0, 1.0, .4)):
        bell = (np.sin(2 * np.pi * f * bt) + .45 * np.sin(2 * np.pi * 2.76 * f * bt) * np.exp(-bt / (tau * .5)) + .2 * np.sin(2 * np.pi * 5.4 * f * bt) * np.exp(-bt / (tau * .25)))
        _place(x, bell * np.exp(-bt / tau) * np.minimum(1, bt / .002), at, g)
    lamp = (np.sin(2 * np.pi * 70 * t) * .5 + _band(2401, d, 400, 1600) * (.5 + .5 * np.sin(2 * np.pi * 1.8 * t - 1.2)) ** 2 * 1.4) * np.interp(t, [0, .3, .6, 1.3, 1.6], [0, 0, .22, .18, 0])
    x += lamp
    r = rng6(2402)
    for j in range(8):
        _place(x, _glass(r.uniform(4000, 7000), .3, .08, .002), .5 + j * .07 + r.uniform(0, .03), .1)
    return norm6(_edge(x, .0004, .25), .8)


def sfx_siren():
    """IMMEDIATE JEOPARDY, the siren, 0.98 s: a cartoon 'whoop, whoop' (a tone that rises from 560 Hz to 1.2 kHz in 0.46 s and starts again), a triangle wave with a sine inside it,
    rounded off at 2.8 kHz so it is an alarm and not an ice pick. It is gone by 0.98 s, 1.1 s before the surveyor's next word."""
    d = .98
    t = tarr(d)
    f = 560 + 640 * ((t / .46) % 1) ** .8
    ph = 2 * np.pi * np.cumsum(f) / SR
    tri = 2 * np.abs(2 * ((ph / (2 * np.pi)) % 1) - 1) - 1
    x = _lp4(tri * .7 + np.sin(ph) * .4, 2800, 2) * np.interp(t, [0, .02, .86, .98], [0, 1, 1, 0])
    return norm6(_edge(x, .003, .1), .5)


def sfx_klaxon():
    """The klaxon that goes with it, 0.85 s: a submarine's 'AH-oo-GA' played as a joke (a low blast that sags a little, 392 Hz to 370 Hz for 0.34 s, then a second that climbs from 294 Hz
    to 466 Hz for 0.44 s), a saw and a square rounded off at 1.7 kHz with a growl in the level at 45 Hz. Two blasts, not three, and over by 0.84 s."""
    d = .86
    t = tarr(d)
    x = np.zeros(len(t))
    for a, b, f0, f1 in ((0.0, .34, 392.0, 370.0), (.4, .84, 294.0, 466.0)):
        n = int((b - a) * SR)
        tt = np.arange(n) / SR
        f = np.interp(tt, [0, b - a], [f0, f1]) * (1 + .004 * np.sin(2 * np.pi * 6 * tt))
        ph = 2 * np.pi * np.cumsum(f) / SR
        w = (2 * ((ph / (2 * np.pi)) % 1) - 1) * .6 + np.sign(np.sin(ph)) * .4
        w = w * (1 + .3 * np.sin(2 * np.pi * 45 * tt)) * ar(b - a, .012, .04)
        _place(x, w, a)
    return norm6(_edge(_lp4(x, 1700, 2), .002, .06), .5)


def sfx_sit():
    """Somebody sitting down in a conference chair, four times (0.6 s each), a little different: the cushion lets go of its air (a low-passed sigh that falls from 1.1 kHz to 300 Hz),
    the body (120 Hz sagging to 70 Hz), the frame creaks (a short stick-slip note from 150 Hz to 112 Hz through 600 Hz to 1.4 kHz), the back of the chair knocks (230 Hz and a dull
    burst) and clothing rustles. The weights are 0.85, 1.1, 0.65 and 0.95; the heavy one (the second) creaks longer and squeaks on a wheel, the light one (the third) bounces once.
    Nobody has sat in this building for years, so none of it is hurried."""
    k = _nth("sit") % 4
    w = (.85, 1.1, .65, .95)[k]
    d = .6
    t = tarr(d)
    x = np.zeros(len(t))
    sigh = _tv_filter(noise6(d, 2510 + k), _glide(1100, 300, d), 1.2, "lp") * np.interp(t, [0, .015, .1, .32], [0, 1, .55, 0])
    x += _unit(sigh) * .55 * w
    x += _sin_of(_glide(120, 70, d)) * np.exp(-t / (.06 * w)) * .6 * w
    cd = .2 * (1.3 if k == 1 else 1.0)
    cph = np.cumsum(np.interp(tarr(cd), [0, cd], [150, 112])) / SR
    cr = _bp4(2 * (cph % 1) - 1, 600, 1400) * np.sin(np.pi * np.linspace(0, 1, len(cph))) ** 1.5
    _place(x, _unit(cr), .03, .22 * (1.3 if k == 1 else 1.0))
    _place(x, _sum(np.sin(2 * np.pi * 230 * tarr(.1)) * np.exp(-tarr(.1) / .02), _burst(2520 + k, .1, 500, 2500, .006) * .6), .12, .28 * w)
    _place(x, _band(2530 + k, .12, 1200, 4000) * np.hanning(int(.12 * SR)), 0.0, .12)
    if k == 1:
        _place(x, _sin_of(_glide(1500, 1100, .08)) * np.hanning(int(.08 * SR)), .2, .08)
    if k == 2:
        _place(x, _sin_of(_glide(130, 80, .1)) * np.exp(-tarr(.1) / .04), .17, .3)
    return norm6(_edge(x, .0005, .1), .6)


def sfx_chair():
    """The last chair, the long one (0.9 s): the cushion takes her weight slowly (the air sighs out for half a second, a low-passed noise that falls from 1.4 kHz to 260 Hz), the vinyl
    creaks as it gives (a slow stick-slip note, 120 Hz to 95 Hz, a little louder than the others), the frame settles with a soft knock at 0.46 s and, over it, a long breath out:
    noise through three vowel resonances (650 Hz, 1.1 kHz, 2.5 kHz), rising for 0.12 s and falling for 0.3 s. Replaces the old chair squeak for this episode. It is the sit
    that matters; the call light, 0.55 s later, has to be heard, so the breath is over by 0.6 s."""
    d = .9
    t = tarr(d)
    x = np.zeros(len(t))
    sigh = _tv_filter(noise6(d, 2540), np.interp(t, [0, .5, d], [1400, 260, 200]), 1.1, "lp") * np.interp(t, [0, .06, .2, .55, d], [0, .6, 1, .35, 0])
    x += _unit(sigh) * .6
    cd = .42
    cph = np.cumsum(np.interp(tarr(cd), [0, cd], [120, 95])) / SR
    cr = _bp4(2 * (cph % 1) - 1, 500, 1100) * np.sin(np.pi * np.linspace(0, 1, len(cph))) ** 1.3
    _place(x, _unit(cr), .05, .3)
    _place(x, _sum(np.sin(2 * np.pi * 200 * tarr(.12)) * np.exp(-tarr(.12) / .03) * .6, _burst(2541, .12, 500, 2200, .01) * .4), .46)
    bd = .6
    bn = noise6(bd, 2542)
    breath = _bp4(bn, 500, 800) + .8 * _bp4(bn, 900, 1300) + .4 * _bp4(bn, 2200, 2800)
    _place(x, _unit(breath) * np.interp(tarr(bd), [0, .12, .3, bd], [0, 1, .6, 0]) * .26, .08)
    _place(x, _band(2543, .25, 1200, 4000) * np.hanning(int(.25 * SR)), .0, .08)
    return norm6(_edge(x, .001, .15), .55)


# ================================================================ the series sting, three ways
def _sting_core(hit, long, d, tail):
    """The series' sting: 'dun, dun, DUUUN' (two short brass chords 0.3 s apart and, at 0.62 s, a long one that falls a semitone, with a 6 Hz tremolo and a drum under each)."""
    out = np.zeros(int(d * SR))
    for at in (0.0, .3):
        _place(out, BA.brass_chord(hit, .22, 1600), at, 1.0)
        _place(out, _thump(110, 45, .3, .09), at, .6)
    long_c = BA.brass_chord(long, tail, 1100) * (1 + .25 * np.sin(2 * np.pi * 6 * tarr(tail)))
    _place(out, long_c, .62, .9)
    _place(out, _thump(100, 38, .6, .2), .62, .7)
    return out


def sfx_sting():
    """The series sting, three times, each fitted to its place. The first (the colony, 1.5 s) and the second (the entrance conference, 1.8 s) are the old gesture, short enough to be gone
    before the next scene's narrator: two brass hits and a long chord that falls a semitone (D minor to C sharp minor for the colony; a fifth higher for the surveyor's 'Perfect.').
    The third (the last frame of the story, 1.7 s) is the same gesture turned to the major: three horn-and-brass hits on the notes of the horn theme (G, C, E: the top voice of each
    chord) and a long, warm C major chord with a ninth, a soft drum and three bell glints (E6, G6, C7). The surveyor has been kind; the sting says so."""
    k = _nth("sting") % 3
    if k == 0:
        d = 1.5
        out = _sting_core([38, 45, 50, 53], [37, 44, 49, 52], d, .85)
        return norm6(_edge(out, .001, .35), .85)
    if k == 1:
        d = 1.8
        out = _sting_core([40, 47, 52, 55], [39, 46, 51, 54], d, 1.15)
        return norm6(_edge(out, .001, .4), .85)
    d = 1.7
    out = np.zeros(int(d * SR))
    for at, notes, dd in ((0.0, [43, 50, 55, 59, 67], .25), (.3, [48, 55, 60, 64, 72], .25)):
        _place(out, BA.brass_chord(notes, dd, 1300), at, 1.0)
        _place(out, _thump(100, 45, .3, .09), at, .4)
    lt = 1.08
    chord = BA.brass_chord([36, 48, 55, 60, 64, 67, 76], lt, 1250) * np.interp(tarr(lt), [0, .05, .5, lt], [0, 1, .8, 0])
    _place(out, chord, .62, .95)
    _place(out, _thump(65, 36, .8, .25), .62, .5)
    for j, f in enumerate((1318.5, 1568.0, 2093.0)):
        _place(out, _glass(f, 1.0, .3, .003), .66 + j * .07, .09)
    return norm6(_edge(out, .001, .4), .85)


# ---------------------------------------------------------------- registration (keep this line at the end of the sfx section)
BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})


# ---------------------------------------------------------------- the animation's footsteps, balanced for this mix
# build/ep14/events.json (written by the animation, never edited here) says where every footfall lands and how hard. The build reads it through --events (or finds it in the output
# folder); this turns it into a tuned copy in the output folder (events.tuned.json) and the mixer reads that instead. The dollhouse scenes show the staff at 0.44 scale through a
# cutaway wall, so their footsteps are turned well down; the full-frame sets (the lobby, the dining room, the conference room) keep more of theirs; steps that land on the same
# instant would add as one identical clip, so they are spread by a few milliseconds.
SCENE_STARTS = (("title", 0.0), ("colony", 5.2), ("adapt", 32.041), ("arrive", 56.457), ("tracer", 80.611), ("closet", 107.67), ("voices", 118.351), ("verdict", 143.009), ("end", 184.022))
STEP_SCALE = {"colony": .5, "adapt": .5, "arrive": .8, "tracer": .75, "closet": .5, "voices": .8, "verdict": .8}
RUSH_AT = (0.0, .03, .055, .08)


def _scene_of(t):
    name = None
    for nm, a in SCENE_STARTS:
        if t >= a:
            name = nm
    return name


def _tune_events(events):
    out = []
    for ev in events:
        ev = dict(ev)
        if ev.get("name") == "step":
            ev["vol"] = round(ev.get("vol", .5) * STEP_SCALE.get(_scene_of(ev["t"]), 1.0), 4)
        out.append(ev)
    steps = sorted((e for e in out if e.get("name") == "step"), key=lambda e: e["t"])
    for i, e in enumerate(steps):
        same = [x for x in steps if abs(x["t"] - e["t"]) < .005 and x is not e]
        if same and all(e["t"] <= x["t"] for x in same):
            group = sorted([e] + same, key=lambda x: str(x.get("key", "")))
            for j, x in enumerate(group):
                x["t"] = round(x["t"] + RUSH_AT[min(j, len(RUSH_AT) - 1)], 3)
                x["vol"] = round(x["vol"] * .8, 4)
    return sorted(out, key=lambda e: e["t"])


def _tuned_events_path(src, out_dir):
    import json
    ev = json.load(open(src))
    dst = os.path.join(out_dir, "events.tuned.json")
    os.makedirs(out_dir, exist_ok=True)
    json.dump(_tune_events(ev), open(dst, "w"), indent=0)
    return dst


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep14.json"), ("--out", "build/ep14"), ("--var", "TIMELINE_EP14"), ("--music", "build_music14")):
        if k not in argv:
            argv += [k, v]
    out = argv[argv.index("--out") + 1]
    if "--events" not in argv:                          # the animation's footsteps, if they are in the output folder: they are always tuned first
        p = os.path.join(A6.HERE, out, "events.json")
        if os.path.exists(p):
            argv += ["--events", p]
    if "--events" in argv and argv[argv.index("--events") + 1]:
        i = argv.index("--events") + 1
        argv[i] = _tuned_events_path(argv[i], os.path.join(A6.HERE, out))
    sys.argv = [sys.argv[0]] + argv
    A10._CALLS.clear()
    A6.main()
    wav = os.path.join(A6.HERE, out, "audio.wav")
    import shutil
    import soundfile as sf
    base = wav + ".pre"
    shutil.copyfile(wav, base)
    # the same loudness trim and peak limiter as Episodes 10 to 13, run until the finished file measures -14.8 LUFS (the limiter takes a few tenths of a decibel off what the trim
    # aimed at, and by a different amount in every episode, so the trim target is corrected from the measurement)
    target = -14.7
    for attempt in range(3):
        shutil.copyfile(base, wav)
        g = A9.trim_loudness(wav, target=target)
        dip = A7.peak_limit(wav)
        if sf.info(wav).subtype != "PCM_16":   # the limiter only rewrites the file when something was over the ceiling
            x, sr = sf.read(wav, dtype="float64")
            sf.write(wav, np.clip(x, -1, 1), sr, subtype="PCM_16")
        final = A9._lufs(wav)
        print(f"loudness trim: {g:+.2f} dB (aimed at {target:.2f} LUFS)")
        print(f"peak limiter: deepest gain dip {dip:.2f} dB, finished file {final:.2f} LUFS")
        if abs(final + 14.8) <= .04:
            break
        target += -14.8 - final
    os.remove(base)
    dips, deep = A10.aac_guard(wav)
    print(f"aac guard: {dips} dip(s), deepest {deep:.2f} dB (keeps the AAC encode under -1 dBTP)")


if __name__ == "__main__":
    main()
