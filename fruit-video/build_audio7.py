"""Episode 7 audio: new sound effects, ambiences and the build entry point.

Reuses the Episode 6 mixer (build_audio6.main: stereo voices, per-scene rooms, lip-sync tracks, foley from the animation, ducking and
loudness) and adds what this episode needs: a formant-synthesized old-man howl, the bingo hall (cage, balls, daubers, a landline), the taxi,
a peeling banana, a failing fluorescent tube, the Moon's rise, and three new beds (an afternoon lot, a night facility, a busy activity room).
Nothing is sampled: every sound is a few lines of numpy.

Usage: python3 build_audio7.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin
"""
import os
import sys

import numpy as np

import build_audio as BA
import build_audio6 as A6
from build_audio import SR, tarr, osc, expdecay, ar, lp, hp, bp, midi
from build_audio6 import noise6, rng6, place2, tone_env


# ================================================================ small helpers
def _smooth_rand(d, seed, fc):
    """Low-passed noise scaled to roughly +-1: a slow random wobble."""
    x = lp(noise6(d, seed), fc, 1)
    return x / (np.max(np.abs(x)) or 1)


def _sum(*xs):
    """Add clips of different lengths, padding the short ones with silence."""
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[:len(x)] += x
    return out


def _vowel(src, formants, gains=(1.0, .55, .28), bw=.09):
    return sum(g * bp(src, f * (1 - bw), f * (1 + bw), 2) for f, g in zip(formants, gains))


# ================================================================ sound effects
def sfx_howl7():
    """Mr. Goji, ninety-four, doing the wolf: a scoop up into an 'oo', a wavering 'oh', a voice crack, a sagging fall. Formant-synthesized."""
    d = 2.9
    n = int(d * SR)
    t = tarr(d)
    f0 = np.interp(t, [0, .14, .7, 1.0, 1.52, 1.6, 1.68, 2.1, 2.55, 2.9], [135, 172, 326, 346, 336, 640, 304, 268, 188, 150])
    vib = 1 + .024 * np.sin(2 * np.pi * 5.1 * t + 1.2 * np.sin(2 * np.pi * .7 * t)) * np.clip((t - .45) / .6, 0, 1)
    f = f0 * vib * (1 + .012 * _smooth_rand(d, 91, 30))
    src = lp(osc("saw", f, d), 2600, 1) + .35 * osc("sine", f, d)
    oo, oh, aw = _vowel(src, (300, 870, 2240)), _vowel(src, (450, 800, 2830)), _vowel(src, (690, 1100, 2600))
    w_oo = np.clip(1 - t / .55, 0, 1)
    w_aw = np.clip((t - 1.45) / .5, 0, 1)
    w_oh = 1 - w_oo - w_aw
    voice = oo * w_oo + oh * np.clip(w_oh, 0, 1) + aw * w_aw
    env = np.interp(t, [0, .06, .35, 1.4, 1.58, 2.0, 2.6, 2.9], [0, .55, 1, 1, .7, .55, .22, 0]) * (1 + .06 * np.sin(2 * np.pi * 7.3 * t))
    breath = bp(noise6(d, 92), 900, 4200) * (.1 + .12 * np.exp(-t / .12) + .1 * np.clip((t - 2.0) / .7, 0, 1)) * env
    out = voice * env * .5 + breath
    return A6.norm6(out, .72)


def sfx_moonrise7():
    """The Moon comes up: a sub swell, a glass pad whose filter opens, a shimmer, and a few high glints."""
    d = 3.4
    n = int(d * SR)
    t = tarr(d)
    sub = osc("sine", np.linspace(41.2, 49.0, n), d) * ar(d, 1.7, 1.3) * .5
    pad = sum(osc("saw", midi(m) * (1 + .003 * np.sin(2 * np.pi * .3 * t + m)), d) for m in (45, 52, 57, 64))
    lo, mid, hi = lp(pad, 380), lp(pad, 1300), lp(pad, 3200)
    k = t / d
    pad = lo * np.clip(1 - 2 * k, 0, 1) + mid * (1 - np.abs(2 * k - 1)) + hi * np.clip(2 * k - 1, 0, 1)
    pad *= ar(d, 1.5, 1.2) * .1
    glass = sum(osc("sine", f * (1 + .35 * k ** 1.6), d) * (.5 + .5 * np.sin(2 * np.pi * (.4 + i * .13) * t + i)) for i, f in enumerate((1320.0, 1980.0, 2640.0))) * ar(d, 1.4, 1.0) * .05
    out = sub + pad + glass
    for j, m in enumerate((88, 91, 95, 100)):
        BA.place(out, osc("sine", midi(m), .6) * expdecay(.6, .16) * ar(.6, .003, .05), 1.9 + j * .21, .1)
    return A6.norm6(out, .62)


def sfx_hold7():
    """The Q word lands: a sub thump, a sagging drone that detunes as it falls, one glass ping, then the room holds its breath."""
    d = 2.2
    n = int(d * SR)
    t = tarr(d)
    out = np.zeros(n)
    BA.place(out, osc("sine", np.linspace(90, 38, int(.7 * SR)), .7) * expdecay(.7, .22), 0, .9)
    fall = np.linspace(233, 110, n)
    drone = (osc("saw", fall, d) + osc("saw", fall * 1.012, d)) * .5
    cut = lp(drone, 700, 2) * np.exp(-t / 1.1)
    BA.place(out, cut * ar(d, .05, .5), 0, .35)
    BA.place(out, (osc("sine", 2093, 1.6) + .3 * osc("sine", 2093 * 2.76, 1.6)) * expdecay(1.6, .5) * ar(1.6, .002, .1), .12, .16)
    return A6.norm6(out, .7)


def sfx_stamp7():
    """A rubber stamp on a clipboard: pad squish, a wooden thud, a slap of paper."""
    d = .6
    out = np.zeros(int(d * SR))
    BA.place(out, osc("sine", np.linspace(130, 58, int(.18 * SR)), .18) * expdecay(.18, .05), 0, .9)
    BA.place(out, bp(noise6(.06, 101), 500, 3200) * expdecay(.06, .012), 0, .8)
    BA.place(out, lp(noise6(.12, 102), 900) * expdecay(.12, .03), .005, .4)
    BA.place(out, bp(noise6(.04, 103), 1800, 6000) * expdecay(.04, .008), .06, .25)
    return A6.norm6(out, .85)


def sfx_flicker():
    """A fluorescent tube failing: irregular bursts of mains hum, a click at every strike, a ballast whine in between."""
    d = 1.0
    n = int(d * SR)
    t = tarr(d)
    r = rng6(111)
    gate = np.zeros(n)
    clicks = []
    pos, on = 0.0, True
    while pos < d:
        dur = r.uniform(.012, .09) if on else r.uniform(.006, .07)
        if on:
            gate[int(pos * SR):int(min(d, pos + dur) * SR)] = 1.0
            clicks.append(pos)
        pos += dur
        on = not on
    gate = np.convolve(gate, np.ones(24) / 24, mode="same")
    hum = sum(a * np.sin(2 * np.pi * 120 * k * t + k) for k, a in ((1, .5), (2, .22), (3, .16), (5, .08)))
    out = hum * gate * .42 + bp(noise6(d, 112), 2500, 7500) * gate * .035
    for c in clicks:
        BA.place(out, bp(noise6(.012, int(c * 1000) + 113), 2000, 9000) * expdecay(.012, .003), c, .5)
        BA.place(out, osc("sine", 3300, .05) * expdecay(.05, .01), c, .06)
    return A6.norm6(out * ar(d, .004, .06), .7)


def sfx_cage():
    """A bingo cage turning: the wire frame creaking round, a dozen plastic balls clacking against each other."""
    d = 1.15
    n = int(d * SR)
    t = tarr(d)
    r = rng6(121)
    rot = .55 + .45 * np.sin(2 * np.pi * 2.3 * t)
    out = lp(noise6(d, 122), 420, 2) * rot * .45
    out += bp(noise6(d, 123), 1800, 3600) * (.5 + .5 * np.sin(2 * np.pi * 2.3 * t + 2)) ** 3 * .05
    for _ in range(20):
        at = r.uniform(.02, d - .12)
        f = r.uniform(900, 1700)
        c = _sum(bp(noise6(.03, int(at * 1000) + 124), 1200, 5200) * expdecay(.03, .006) * .8, osc("sine", f, .06) * expdecay(.06, .012) * .22)
        BA.place(out, c, at, r.uniform(.3, .85))
    creak = osc("sine", 1500 + 260 * np.sin(2 * np.pi * 2.3 * t), d) * (.5 + .5 * np.sin(2 * np.pi * 2.3 * t + .6)) ** 6 * .03
    return A6.norm6((out + creak) * ar(d, .05, .08), .6)


def sfx_ball():
    """One ball drops out of the cage: a hollow plastic tok, then it rolls down the chute and settles."""
    d = .6
    out = np.zeros(int(d * SR))
    BA.place(out, _sum(osc("sine", np.linspace(820, 520, int(.06 * SR)), .06) * expdecay(.06, .02), bp(noise6(.02, 131), 1500, 6000) * expdecay(.02, .004)), 0, .8)
    roll = lp(noise6(.34, 132), 600) * expdecay(.34, .12) * (.6 + .4 * np.sin(2 * np.pi * 21 * tarr(.34)))
    BA.place(out, roll, .05, .35)
    for at, g in ((.2, .35), (.31, .2)):
        BA.place(out, _sum(osc("sine", 760, .04) * expdecay(.04, .01), bp(noise6(.015, int(at * 100) + 133), 1500, 5500) * expdecay(.015, .004)), at, g)
    return A6.norm6(out, .85)


def sfx_dab():
    """A bingo dauber: a foam tip pressed on a card, a wet pock."""
    d = .24
    out = np.zeros(int(d * SR))
    BA.place(out, lp(noise6(.05, 141), 1400) * expdecay(.05, .012), 0, .7)
    BA.place(out, osc("sine", np.linspace(330, 170, int(.08 * SR)), .08) * expdecay(.08, .025), 0, .8)
    BA.place(out, bp(noise6(.08, 142), 700, 2600) * expdecay(.08, .02) * ar(.08, .004, .03), .035, .35)
    return out


def sfx_bingo_ding():
    """The card accepts a square: a short two-note bell."""
    d = .7
    out = np.zeros(int(d * SR))
    for k, (f, at) in enumerate(((1568.0, 0), (2093.0, .09))):
        x = (osc("sine", f, .55) + .3 * osc("sine", f * 2.76, .55) * expdecay(.55, .1)) * expdecay(.55, .16) * ar(.55, .002, .05)
        BA.place(out, x, at, .55)
    return out


def sfx_phonering():
    """An office landline: the two-tone burr, twice."""
    d = 1.3
    out = np.zeros(int(d * SR))
    for at in (0.0, .62):
        dd = .42
        t = tarr(dd)
        x = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 20 * t)))
        x = lp(np.tanh(x * 1.4), 3800) * ar(dd, .005, .02)
        BA.place(out, x, at, .5)
    return out


def sfx_honk():
    """A taxi leaning on its horn, heard through a window."""
    d = .95
    out = np.zeros(int(d * SR))
    for at, dd in ((0.0, .22), (.3, .42)):
        t = tarr(dd)
        x = osc("square", 405, dd) * .5 + osc("saw", 509, dd) * .4 + osc("sine", 405, dd) * .3
        BA.place(out, lp(x, 2400) * ar(dd, .006, .03), at, .6)
    return out


def sfx_peel():
    """A banana peel coming off in one long rip, and a wet slap."""
    d = .6
    t = tarr(d)
    rip_d = .34
    tr = tarr(rip_d)
    rip = bp(noise6(rip_d, 151), 1400, 5200) * (.5 + .5 * np.sign(np.sin(2 * np.pi * (70 + 120 * tr / rip_d) * tr))) * ar(rip_d, .02, .06)
    out = np.zeros(int(d * SR))
    BA.place(out, rip, 0, .55)
    BA.place(out, lp(noise6(.1, 152), 800) * expdecay(.1, .03), .34, .8)
    BA.place(out, osc("sine", np.linspace(210, 90, int(.12 * SR)), .12) * expdecay(.12, .04), .34, .5)
    return out


def sfx_thermo():
    """A digital thermometer: three quick beeps."""
    d = .7
    out = np.zeros(int(d * SR))
    for k in range(3):
        BA.place(out, (osc("sine", 2048, .09) + .3 * osc("square", 2048, .09)) * ar(.09, .004, .012), k * .15, .4)
    return lp(out, 7000)


def sfx_dial():
    """Six touch-tones: the on-call doctor's number, dialed from memory."""
    out = np.zeros(int(.9 * SR))
    freqs = {"5": (770, 1336), "0": (941, 1336), "1": (697, 1209), "4": (770, 1209)}
    for i, ch in enumerate("555014"):
        lo, hi = freqs[ch]
        d = .07
        t = tarr(d)
        BA.place(out, (np.sin(2 * np.pi * lo * t) + np.sin(2 * np.pi * hi * t)) * ar(d, .002, .004), i * .105, .28)
    return out


def sfx_carclose():
    """A car door shut in a parking lot: a deep thunk, a metal latch."""
    d = .6
    out = np.zeros(int(d * SR))
    BA.place(out, osc("sine", np.linspace(150, 60, int(.2 * SR)), .2) * expdecay(.2, .06), 0, .9)
    BA.place(out, lp(noise6(.15, 161), 700) * expdecay(.15, .04), 0, .5)
    BA.place(out, bp(noise6(.05, 162), 1800, 6500) * expdecay(.05, .01), .05, .45)
    BA.place(out, osc("sine", 2600, .1) * expdecay(.1, .02), .06, .12)
    return out


def sfx_theme7():
    """Title sting: a horn calls the wolf's rising fifth over a swelling drone and moon-glass, then a full minor chord lands 2.2 s in."""
    d = 4.8
    n = int(d * SR)
    t = tarr(d)
    out = np.zeros(n)
    # the drone, swelling
    out += (osc("sine", 55, d) * .6 + osc("saw", 55, d) * .18) * ar(d, 1.8, 1.8) * .38
    # the horn call: A3 climbing to E4, a wavering sustained note, falling a little
    hd = 2.2
    th = tarr(hd)
    hf = np.interp(th, [0, .35, .9, 1.4, 2.2], [midi(57), midi(57), midi(64) * .985, midi(64), midi(63.4)]) * (1 + .012 * np.sin(2 * np.pi * 5.3 * th) * np.clip((th - .5) / .5, 0, 1))
    horn = lp(osc("saw", hf, hd) + .6 * osc("saw", hf * 1.004, hd), 1500, 2) * ar(hd, .25, .35)
    BA.place(out, horn, 0, .34)
    # moon glass: a shimmer that climbs as the logo approaches
    for j, m in enumerate((88, 91, 95, 98, 100)):
        BA.place(out, osc("sine", midi(m), .7) * expdecay(.7, .2) * ar(.7, .003, .06), .5 + j * .3, .14)
    # the downbeat
    land = 2.2
    BA.place(out, osc("sine", np.linspace(120, 40, int(.5 * SR)), .5) * expdecay(.5, .14), land, .8)
    BA.place(out, bp(noise6(.9, 171), 700, 7000) * expdecay(.9, .26), land, .3)
    for m in (45, 52, 57, 60, 64):
        dd = 2.5
        BA.place(out, (osc("saw", midi(m), dd) * .3 + osc("sine", midi(m), dd) * .5) * ar(dd, .06, 1.6), land, .22)
    BA.place(out, lp(osc("saw", midi(69), 2.4) + osc("saw", midi(69.08), 2.4), 2200) * ar(2.4, .08, 1.5), land, .16)
    return A6.norm6(lp(out, 9000), .85)


BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})
A6.DUCK_SFX.add("howl7")   # the howl rings on into the next line; it ducks under speech


# ================================================================ ambience (stereo)
def babble(d, seed, nv=7):
    """Distant conversation: several voiced sources with drifting pitch, vowel formants and syllable-rate gating. Never words, always people."""
    r = rng6(seed)
    t = tarr(d)
    out = np.zeros(int(d * SR))
    for v in range(nv):
        f0 = r.uniform(105, 250) * (1 + .06 * _smooth_rand(d, seed + 10 + v, 3))
        src = lp(osc("saw", f0, d), 2800, 1)
        f1, f2 = r.uniform(360, 720), r.uniform(1000, 2200)
        y = bp(src, f1 * .86, f1 * 1.14, 2) + .55 * bp(src, f2 * .88, f2 * 1.12, 2)
        syl = (.5 + .5 * np.sin(2 * np.pi * r.uniform(3.2, 5.4) * t + r.uniform(0, 6.3) + 1.6 * _smooth_rand(d, seed + 30 + v, 5))) ** 2
        phrase = np.clip((lp(noise6(d, seed + 50 + v), 1.4, 1) / .035) + r.uniform(-.2, .5), 0, 1)
        out += y * syl * phrase * r.uniform(.5, 1.0)
    return out / nv


def amb_day(d, ramp=None):
    """An afternoon parking lot: wind, a far road, birds, and a car or two going by."""
    t = tarr(d)
    wind = lp(noise6(d, 181), 520, 2) * (.5 + .5 * np.sin(2 * np.pi * .11 * t + 1)) * .5
    road = lp(noise6(d, 182), 240, 2) * (.6 + .4 * np.sin(2 * np.pi * .06 * t)) * .5
    out = np.stack([wind + road, np.roll(wind, 260) + road * .9])
    r = rng6(183)
    for k in range(int(d * 1.4)):
        clip = A6.sfx_birds6()[: int(r.uniform(.3, .9) * SR)]
        place2(out, clip, r.uniform(0, max(.1, d - 1)), r.uniform(.05, .16), r.uniform(-.9, .9))
    for k in range(max(1, int(d / 9))):
        at = r.uniform(.5, max(.6, d - 2.5))
        dd = 2.1
        td = tarr(dd)
        env = np.sin(np.pi * td / dd) ** 2
        car = lp(noise6(dd, 190 + k), 900, 2) * env * .5
        place2(out, car, at, .25, r.uniform(-.8, .8))
    return out * .8


def amb_night(d, ramp=None):
    """A facility at night: the air handler, a fridge somewhere, crickets through a window, a far call light."""
    out = A6.amb_hum(d, 7) * .7
    r = rng6(191)
    for k in range(int(d * .5) + 1):
        clip = BA.SFX["crickets"]()[: int(r.uniform(1.2, 2.8) * SR)]
        place2(out, lp(clip, 6500), r.uniform(0, max(.1, d - 2)), r.uniform(.05, .11), r.uniform(-.9, .9))
    for k in range(int(d / 6)):
        place2(out, lp(BA.SFX["a_call"](), 1800), r.uniform(1, max(1.1, d - 2)), r.uniform(.04, .08), r.uniform(-.9, .9))
    return out


def amb_bingo(d, ramp=None):
    """The activity room at bingo hour: forty people murmuring, cups and chairs, a hum under it all."""
    out = A6.amb_hum(d, 8) * .5
    a = babble(d, 201)
    b = babble(d, 202)
    out += np.stack([a * .55 + b * .2, a * .2 + b * .55]) * .9
    r = rng6(203)
    for k in range(int(d * .8) + 1):
        place2(out, BA.SFX["clatter"]() if "clatter" in BA.SFX else A6.sfx_clatter(), r.uniform(0, max(.1, d - .8)), r.uniform(.03, .08), r.uniform(-.9, .9))
    return out


A6.AMB.update({"day": amb_day, "night": amb_night, "bingo": amb_bingo})


def peak_limit(path, ceiling=.72, look=.006):
    """Keep every sample under the ceiling with a short, smooth gain dip. An AAC encode adds about a decibel of overshoot on a hard
    transient (here, the loudest consonant in the voices), so the ceiling sits low enough that the MP4's audio stays under -1 dBTP."""
    import soundfile as sf
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    x, sr = sf.read(path, dtype="float64")
    p = np.abs(x).max(axis=1)
    if p.max() <= ceiling:
        return 0.0
    n = int(look * sr)
    g = minimum_filter1d(np.minimum(1.0, ceiling / np.maximum(p, 1e-9)), size=2 * n + 1)   # the gain each peak needs, held for the lookahead
    g = uniform_filter1d(uniform_filter1d(g, n + 1), n + 1)                                  # two box passes: a smooth dip no wider than the hold
    sf.write(path, x * g[:, None], sr, subtype="PCM_16")
    return float(20 * np.log10(g.min()))


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep7.json"), ("--out", "build/ep7"), ("--var", "TIMELINE_EP7"), ("--music", "build_music7")):
        if k not in argv:
            argv += [k, v]
    sys.argv = [sys.argv[0]] + argv
    A6.main()
    out = argv[argv.index("--out") + 1]
    print(f"peak limiter: deepest gain dip {peak_limit(os.path.join(out, 'audio.wav')):.2f} dB")


if __name__ == "__main__":
    main()
