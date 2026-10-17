"""Episode 10 audio: a thin wrapper on the Episode 9 / 8 / 7 / 6 mixer, plus the new sound effects script_ep10.json asks for.

Importing build_audio9 registers every Episode 9 effect (and, through it, Episode 7's and 6's) in build_audio.SFX. This file adds what Episode 10 needs beyond that
(a knock on a wooden door, a flyer's tab tearing off along its perforation, a pen, a heavy rubber stamp, a giant donut, a handful of coins, confetti, a balloon, a candle,
gears turning, a receipt printer, a pizza box, a deck of cards being dealt), registers them in the same registry (build_audio.SFX, as build_audio7 and 9 do), changes the
defaults (script, output folder, timeline variable, music module) and runs the same loudness trim and peak limiter as Episode 9. Episode 11 imports this module for the helpers
and the effects the two episodes share. Nothing is sampled: every sound is a few lines of numpy.

The mixer calls every effect with no arguments, so an effect that must differ from one cue to the next (three knocks, fourteen tears, two pens) takes its variation from
`_nth`, a counter of how many times it has been asked for. The cues are placed in script order, so a build is still deterministic.

Usage: python3 build_audio10.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--events build/ep10/events.json]
"""
import os
import sys

import numpy as np

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
from build_audio import SR, tarr, osc, expdecay, ar, lp, hp, bp, midi
from build_audio6 import noise6, rng6, norm6, place2
from build_audio7 import _sum, _smooth_rand

_CALLS = {}


def _nth(name):
    """How many times this effect has been asked for so far in this process (0 the first time). Seeds the per-cue variation."""
    k = _CALLS.get(name, 0)
    _CALLS[name] = k + 1
    return k


def _burst(seed, d, lo, hi, tau, order=2):
    """A band of noise that dies away exponentially: the building block of every click, tap and rustle below."""
    return bp(noise6(d, seed), lo, hi, order) * expdecay(d, tau)


def _ping(f, d, tau, ratios=(1.0, 2.76, 5.4), amps=(1.0, .4, .2), shrink=(1.0, .55, .3)):
    """A struck piece of metal or glass: inharmonic partials, the high ones dying faster."""
    t = tarr(d)
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (tau * s)) for r, a, s in zip(ratios, amps, shrink))


def _thump(f0, f1, d, tau):
    """A body falling on a hollow thing: a sine that sags from f0 to f1."""
    return osc("sine", np.linspace(f0, f1, int(d * SR)), d) * expdecay(d, tau)


def _pulses(n, times, amps, tau):
    """An envelope of exponential decays that start at `times` (seconds): a click train, a patter, a rattle."""
    env = np.zeros(n)
    L = int(min(.05, 9 * tau) * SR) + 1
    shape = np.exp(-np.arange(L) / (tau * SR))
    for ti, a in zip(times, amps):
        i = int(ti * SR)
        if 0 <= i < n:
            m = min(L, n - i)
            env[i:i + m] += a * shape[:m]
    return env


def _fit(x, d):
    """Pad or cut a clip to exactly d seconds."""
    n = int(d * SR)
    return np.pad(x, (0, max(0, n - len(x))))[:n]


# ================================================================ sound effects
def sfx_knock():
    """A knuckle on a wooden office door: the dull 'tok' of the panel, a hollow resonance behind it, the tick of bone on grain. Every knock is a little different (pitch, firmness)."""
    k = _nth("knock")
    r = rng6(1000 + k)
    d = .26
    t = tarr(d)
    f1 = r.uniform(300, 430)
    tok = sum(a * osc("sine", f1 * m * (1 + .1 * np.exp(-t / .012)), d) for m, a in ((1, 1.0), (2.0, .4), (3.1, .15))) * np.exp(-t / .024)
    f = r.uniform(150, 195)
    hollow = osc("sine", f, d) * np.exp(-t / .06) + .35 * osc("sine", f * 2.31, d) * np.exp(-t / .035)
    tick = _burst(1010 + k, d, 1000, 5200, .004)
    grain = _burst(1020 + k, d, 400, 2200, .01)                    # the mid 'wood' a small speaker can carry
    x = (tok * .8 + hollow * .55 + tick * .6 + grain * .6) * ar(d, .0005, .06)
    return norm6(x, .8 * r.uniform(.85, 1.0))


def _tear_clip(k):
    """Tab number k tearing off a flyer along its perforation: a quick ratchet of tiny paper pops (one per hole), a hiss of fibre, a snap as it comes free and a flutter as it
    falls. Every k gives a different tab (length, speed, brightness)."""
    r = rng6(1300 + k)
    d = .36
    n, t = int(d * SR), tarr(d)
    rip = r.uniform(.11, .17)                                    # how long the strip takes to part
    holes, c = [], 0.0
    while c < rip:
        holes.append(c)
        c += r.uniform(.0035, .0065)                             # a hole every 4 to 6 ms: about 200 pops a second
    env = _pulses(n, holes, r.uniform(.45, 1.0, len(holes)), .0011)
    shape = np.where(t < rip, np.sin(np.pi * np.clip(t / rip, 0, 1) ** .7), 0.0)
    lo, hi = r.uniform(1200, 1900), r.uniform(5800, 7600)
    zip_ = bp(noise6(d, 1310 + k), lo, hi, 2) * env * shape
    fibre = bp(noise6(d, 1320 + k), 2800, 8500) * shape * .14
    body = bp(noise6(d, 1330 + k), 450, 1700) * shape * (.3 + .12 * _smooth_rand(d, 1335 + k, 30))
    x = zip_ + fibre + body
    s = int(rip * SR)                                            # the snap and the flap of the freed tab
    x[s:s + int(.03 * SR)] += _burst(1340 + k, .03, 1300, 6500, .005) * .9
    x[s:s + int(.05 * SR)] += lp(noise6(.05, 1350 + k), 1100) * expdecay(.05, .015) * .35
    for j in range(int(r.integers(1, 4))):                       # paper falling: a few soft whisks
        wd = r.uniform(.04, .08)
        w = bp(noise6(wd, 1360 + 7 * k + j), 1000, 3600) * np.hanning(int(wd * SR)) * r.uniform(.06, .15)
        a = s + int((.03 + .06 * j + r.uniform(0, .03)) * SR)
        x[a:a + len(w)] += w[:max(0, len(x) - a)]
    return norm6(x, .8)


def sfx_tear():
    """A flyer's tear-off tab ripping away. Fourteen of these play 0.22 s apart in the title, so each call is the next tab."""
    return _tear_clip(_nth("tear"))


def sfx_penscratch():
    """A pen writing: short strokes of dry scratch on paper with small gaps between them and longer ones between words. Each call is another pen and another hand."""
    k = _nth("penscratch")
    r = rng6(1400 + k)
    d = r.uniform(.74, .86)
    n = int(d * SR)
    env, c = np.zeros(n), r.uniform(0, .03)
    while c < d - .07:
        L = r.uniform(.035, .1)
        i, j = int(c * SR), min(n, int((c + L) * SR))
        if j - i > 2:
            env[i:j] += r.uniform(.45, 1.0) * np.hanning(j - i)
        c += L + (r.uniform(.012, .035) if r.random() > .22 else r.uniform(.07, .14))
    f0 = r.uniform(2700, 4300)                                   # every pen has its own scratch
    grain = bp(noise6(d, 1410 + k), f0 * .55, f0 * 1.9, 2)
    grain *= .55 + .45 * np.abs(_smooth_rand(d, 1415 + k, 350))  # paper fibre: the scratch crackles
    rub = lp(noise6(d, 1420 + k), 600) * .12                     # the hand moving on the desk
    return norm6((grain + rub) * env, .5)


def sfx_pizzabox():
    """A pizza box dropped on a desk: a soft, heavy thump with a puff of air from the box, the flap of the lid and a cardboard rattle as it settles."""
    k = _nth("pizzabox")
    r = rng6(1500 + k)
    d = .7
    out = np.zeros(int(d * SR))
    BA.place(out, _thump(125, 58, .35, .07), 0, .7)
    BA.place(out, _thump(260, 150, .2, .035), 0, .55)                                       # the box's own body, which a phone can play
    BA.place(out, lp(noise6(.15, 1510 + k), 900) * expdecay(.15, .035), 0, .7)
    BA.place(out, _burst(1520 + k, .08, 700, 4200, .02) * ar(.08, .002, .03), .01, .8)
    for j in range(int(r.integers(5, 8))):                       # the cardboard rattling itself still
        at = .05 + j * r.uniform(.04, .075)
        BA.place(out, _burst(1530 + 9 * k + j, .09, 500, 2600, r.uniform(.012, .03)), at, .35 * (1 - j / 9))
    BA.place(out, osc("sine", r.uniform(180, 240), .3) * expdecay(.3, .05), .01, .22)
    return norm6(out, .85)


def sfx_stamp10():
    """The giant rubber stamp: a heavier version of stamp7. A low thump that sags under 50 Hz, the wooden block meeting the desk, the pad's wet squish, a few drops of ink
    flung off the edge and the letter's paper fluttering as it settles."""
    r = rng6(1700)
    d = .8
    out = np.zeros(int(d * SR))
    BA.place(out, _thump(100, 44, .32, .08), 0, .75)
    BA.place(out, _thump(330, 170, .16, .028), 0, .9)                                         # the wooden block meeting the desk: the 'thock' a phone can play
    BA.place(out, osc("sine", 215, .2) * expdecay(.2, .03), 0, .4)
    BA.place(out, _burst(1701, .07, 300, 3200, .014), 0, 1.0)
    BA.place(out, lp(noise6(.16, 1702), 1600) * expdecay(.16, .04) * ar(.16, .004, .06), .004, .55)   # the squish
    for j in range(6):                                                                        # ink flicking off
        BA.place(out, _burst(1710 + j, .02, 1500, 6500, .004), .05 + r.uniform(0, .17), .16 * r.uniform(.5, 1))
    for j in range(4):                                                                        # the letter lifts and settles
        wd = r.uniform(.05, .09)
        BA.place(out, bp(noise6(wd, 1720 + j), 1200, 4800) * np.hanning(int(wd * SR)), .09 + .08 * j + r.uniform(0, .03), .2 * (1 - j / 5))
    return norm6(out, .9)


def sfx_donut():
    """A car-tyre-sized donut put down on its stand: a soft round 'bwoomp', then the whole thing wobbles like jelly and a few sprinkles rain off the top."""
    r = rng6(1800)
    d = .8
    t = tarr(d)
    out = np.zeros(int(d * SR))
    f = 150 * np.exp(-t / .16) + 70
    base = (osc("sine", f, d) + .5 * osc("sine", f * 2, d) + .2 * osc("sine", f * 3, d)) * np.exp(-t / .1) * ar(d, .008, .1)
    wob = 1 + .5 * np.sin(2 * np.pi * 7.2 * t) * np.exp(-t / .32)
    fj = 235 * (1 - .12 * np.exp(-t / .25) * np.sin(2 * np.pi * 7.2 * t))
    jelly = (osc("sine", fj, d) + .45 * osc("sine", fj * 2, d)) * wob * np.exp(-t / .3) * ar(d, .03, .2) * .5
    out += base * .8 + jelly
    out += lp(noise6(d, 1801), 2200) * np.exp(-t / .07) * ar(d, .004, .1) * .4             # the squish
    for j in range(8):
        BA.place(out, _burst(1810 + j, .02, 3000, 7500, .004), .07 + j * r.uniform(.03, .05), .12 * r.uniform(.5, 1))
    return norm6(out, .85)


def _tinks(out, times, r, lo=2800, hi=6800, gain=.2, tau=(.012, .04), pan=None):
    """Drop a coin's little metallic ring (inharmonic partials, a few milliseconds of attack click) at each time. `out` is mono (n,) or stereo (2, n)."""
    for ti in times:
        f = r.uniform(lo, hi)
        d = r.uniform(*tau) * 5
        c = _ping(f, d, d / 5, (1.0, 2.32, 4.1), (1.0, .5, .3), (1.0, .6, .35)) * ar(d, .0003, d * .5)
        g = gain * r.uniform(.4, 1.0)
        if out.ndim == 2:
            place2(out, c, ti, g, r.uniform(-.9, .9) if pan is None else pan)
        else:
            BA.place(out, c, ti, g)


def _coin_spin(f0, d, r):
    """A coin spinning down on a table: a ring whose wobble speeds up (9 to 70 times a second) as it falls flat, then a short rattle and silence."""
    t = tarr(d)
    wob = 9 + 61 * (t / d) ** 2.2
    ph = 2 * np.pi * np.cumsum(wob) / SR
    am = .5 * (1 + np.sin(ph)) * (.35 + .65 * (t / d) ** 1.5)
    ring = _ping(f0, d, 9.0, (1.0, 1.51, 2.4), (1.0, .4, .25), (1.0, 1.0, 1.0))
    x = ring * am * ar(d, .01, .004)
    x[-int(.025 * SR):] += _burst(int(f0), .025, 2000, 7000, .006)[-int(.025 * SR):] * .5
    return x


def sfx_coinpour():
    """A handful of change poured into a palm: a dense patter of tiny coin rings that thins out, three bigger coins bouncing off the edge (each bounce closer and quieter than the
    last) and one that rolls away and spins down on the floor, nobody catching it."""
    k = _nth("coinpour")
    r = rng6(1900 + k)
    d = .9
    out = np.zeros(int(d * SR))
    pour, c = [], 0.0
    while c < .42:
        pour.append(c)
        c += r.exponential(1 / (190 * np.exp(-c / .22) + 25))       # about 190 a second at the start, a trickle at the end
    _tinks(out, pour, r, gain=.16)
    gap, at = .075, .38
    for j in range(3):
        _tinks(out, [at], r, lo=2300, hi=3300, gain=.55 * .7 ** j, tau=(.03, .07))
        at += gap
        gap *= .68
    BA.place(out, _coin_spin(r.uniform(3200, 3900), .3, r), .5, .3)
    return norm6(out, .85)


def sfx_confetti():
    """Confetti coming down after the cannons: a soft 'fwump' of air, then a thinning crackle of paper bits landing on each other and on the floor, with a faint hiss of flutter.
    Stereo, wide."""
    r = rng6(1600)
    d = 1.1
    n = int(d * SR)
    out = np.zeros((2, n))
    place2(out, lp(noise6(.12, 1601), 700) * expdecay(.12, .03) * ar(.12, .004, .05), 0, .55, 0)
    times, c = [], .03
    while c < d - .15:
        times.append(c)
        c += r.exponential(1 / (260 * np.exp(-c / .38) + 10))   # 260 a second at first, a few at the end
    for ti in times:
        L = int(r.uniform(.004, .014) * SR)
        f = r.uniform(2500, 9000)
        bit = bp(noise6(.016, int(ti * 1e4) + 1602), f * .7, min(f * 1.5, 20000), 1)[:L] * np.exp(-np.arange(L) / (L / 3))
        place2(out, bit, ti, r.uniform(.15, .55) * np.exp(-ti / .8), r.uniform(-.9, .9))
    flutter = bp(noise6(d, 1603), 2500, 7500) * (.5 + .5 * _smooth_rand(d, 1604, 14)) * np.exp(-tarr(d) / .35) * ar(d, .03, .3) * .05
    out += np.stack([flutter, np.roll(flutter, 400)])
    return norm6(out, .7)


def sfx_balloon():
    """A balloon squeaking against the ceiling: rubber on plaster, a stick-slip squeal that sags in pitch, with a soft 'thup' where it touches."""
    r = rng6(2000)
    d = .55
    t = tarr(d)
    base = np.interp(t, [0, .1, .3, .55], [1250, 1550, 1180, 900])
    f = base * (1 + .06 * _smooth_rand(d, 2001, 70))
    sq = osc("sine", f, d) + .45 * osc("sine", f * 2, d) + .2 * osc("sine", f * 3, d)
    slip = .55 + .45 * np.sign(np.sin(2 * np.pi * 52 * t + 1.3 * _smooth_rand(d, 2002, 9)))
    slip = np.convolve(slip, np.ones(60) / 60, mode="same")
    x = lp(sq * slip, 4800) * np.interp(t, [0, .02, .08, .4, .55], [0, .5, 1, .8, 0]) * .6
    out = x.copy()
    BA.place(out, lp(noise6(.1, 2003), 500) * expdecay(.1, .03) * .4 + _thump(150, 90, .1, .03) * .35, 0)
    return norm6(out, .6)


def sfx_cakecandle():
    """A candle on a cake going out: a tiny 'pff' of breath and a thread of smoke hiss."""
    d = .3
    puff = lp(noise6(d, 2100), 1800) * ar(d, .004, .09) * np.exp(-tarr(d) / .06)
    hiss = hp(noise6(d, 2101), 4500) * ar(d, .01, .15) * np.exp(-tarr(d) / .08) * .22
    return norm6(puff + hiss, .45)


def sfx_gearwhir():
    """Gears turning in a head that is trying very hard: a wind-up ratchet that speeds up a little, a clockwork whirr under it, and a small bell for the idea."""
    r = rng6(2200)
    d = .95
    n, t = int(d * SR), tarr(d)
    times, c = [], .02
    while c < .6:
        times.append(c)
        c += np.interp(c, [0, .6], [.062, .038])
    out = np.zeros(n)
    for j, ti in enumerate(times):
        BA.place(out, _burst(2210 + j, .015, 2200 + 40 * j, 4800 + 80 * j, .003), ti, .55 if j % 4 else .9)
        if j % 4 == 0:
            BA.place(out, osc("sine", 640, .03) * expdecay(.03, .008), ti, .3)
    f = np.interp(t, [0, .6, .95], [150, 235, 230])
    whirr = lp(osc("saw", f, d), 900) * (.6 + .4 * np.sin(2 * np.pi * 22 * t)) * ar(d, .08, .35) * np.interp(t, [0, .6, .95], [.2, .35, 0])
    out += whirr
    BA.place(out, _ping(2093, .4, .22, (1.0, 2.76), (1.0, .35), (1.0, .45)) * ar(.4, .001, .05), .62, .4)   # the idea
    return norm6(out, .7)


def sfx_receipt():
    """A thermal receipt printer: a line at a time, each a short buzzing step of the print head and its stepper motor, then the paper torn off against the serrated bar."""
    r = rng6(2300)
    d = 1.35
    n = int(d * SR)
    out = np.zeros(n)
    at = .02
    for j in range(9):
        L = r.uniform(.052, .075)
        t = tarr(L)
        buzz = lp(osc("square", r.uniform(1750, 2100), L), 5200) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 118 * t)))
        motor = bp(noise6(L, 2310 + j), 350, 800) * .8
        hiss = hp(noise6(L, 2320 + j), 3500) * .12
        BA.place(out, (buzz * .4 + motor * .45 + hiss) * ar(L, .004, .012), at, .8)
        at += L + r.uniform(.028, .05)
    BA.place(out, _tear_clip(100), at + .05, .85)                                           # torn off
    BA.place(out, _burst(2330, .03, 700, 2500, .006) * 1.0, at + .02, .45)                  # the clack of the bar
    return norm6(out, .75)


def sfx_toteempty():
    """A tote bag emptied onto a desk: the whump of canvas, then everything she carried hitting the wood at its own weight (badge, keys, torch, scissors, a glove) and a lollipop
    rolling off. The low-mid 'thud' under the clatter and the rattle."""
    r = rng6(2500)
    d = .8
    out = np.zeros(int(d * SR))
    BA.place(out, lp(noise6(.15, 2501), 520) * expdecay(.15, .05) * ar(.15, .004, .06), 0, .6)
    BA.place(out, _thump(190, 90, .18, .05), 0, .6)
    for j in range(9):
        f = r.uniform(180, 520)
        hit = _sum(_thump(f, f * .5, .1, .03) * .8, _burst(2510 + j, .03, 800, 4500, .008) * .6, _ping(r.uniform(900, 2600), .15, .05, (1.0, 2.3), (.35, .15)))
        BA.place(out, hit, .02 + r.uniform(0, .38), r.uniform(.3, .75))
    BA.place(out, lp(noise6(.25, 2520), 700) * (.6 + .4 * np.sin(2 * np.pi * 17 * tarr(.25))) * ar(.25, .02, .12), .42, .18)
    return norm6(out, .8)


def sfx_pentick():
    """A pen ticking an item off a list: one small flick of the nib on paper. Every call is a slightly different tick."""
    k = _nth("pentick")
    d = .09
    return norm6(_burst(2600 + k, d, 1800, 6500, .012) * ar(d, .001, .03) + _thump(210, 150, d, .01) * .2, .4)


def sfx_carddeal():
    """A dozen playing cards dealt in a flurry: each is a flick of the edge across the thumb and a soft tap on the pile, the pace picking up as the dealer finds her rhythm."""
    r = rng6(2400)
    d = 1.05
    out = np.zeros(int(d * SR))
    at, gap = .01, .092
    for j in range(13):
        BA.place(out, bp(noise6(.03, 2410 + j), 2200, 8500, 1) * expdecay(.03, .007) * ar(.03, .0008, .01), at, .8 * r.uniform(.7, 1.0))
        BA.place(out, _burst(2430 + j, .04, 700, 2200, .01), at + .028, .3)
        at += gap
        gap = max(.052, gap * .95)
    return norm6(out, .6)


# ================================================================ register
BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep10.json"), ("--out", "build/ep10"), ("--var", "TIMELINE_EP10"), ("--music", "build_music10")):
        if k not in argv:
            argv += [k, v]
    sys.argv = [sys.argv[0]] + argv
    A6.main()
    out = argv[argv.index("--out") + 1]
    wav = os.path.join(A6.HERE, out, "audio.wav")
    print(f"loudness trim: {A9.trim_loudness(wav):+.2f} dB")
    print(f"peak limiter: deepest gain dip {A7.peak_limit(wav):.2f} dB")
    import soundfile as sf
    if sf.info(wav).subtype != "PCM_16":   # the limiter only rewrites the file when something was over the ceiling
        x, sr = sf.read(wav, dtype="float64")
        sf.write(wav, np.clip(x, -1, 1), sr, subtype="PCM_16")


if __name__ == "__main__":
    main()
