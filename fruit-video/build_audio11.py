"""Episode 11 audio: a thin wrapper on the Episode 10 / 9 / 8 / 7 / 6 mixer, plus the sound effects only this episode needs.

Importing build_audio10 registers Episode 10's effects (knock, tear, stamp10, coinpour, confetti, carddeal ...) on top of Episode 9's, 7's and 6's, and gives this file its helpers.
New here: the administrator's vault (a round steel door that spins, unbolts, groans and hisses open, then an avalanche of gold), a moth, a time clock, an LED clock and its
11:00:00 chime, two slow-motion whooshes, a coin purse clasp and an adding machine. It registers them in the same registry (build_audio.SFX), changes the defaults (script, output
folder, timeline variable, music module) and runs the same loudness trim and peak limiter as Episode 9. Nothing is sampled: every sound is a few lines of numpy.

Usage: python3 build_audio11.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--events build/ep11/events.json]
"""
import os
import sys

import numpy as np

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
import build_audio10 as A10
from build_audio import SR, tarr, osc, expdecay, ar, lp, hp, bp, midi
from build_audio6 import noise6, rng6, norm6, place2
from build_audio7 import _smooth_rand, _sum
from build_audio10 import _nth, _burst, _ping, _thump, _tinks, _coin_spin, _pulses, _fit


# ================================================================ sound effects
def sfx_vaultopen():
    """A round steel vault door, start to finish (cue it when the hand reaches the wheel): the spoked wheel spun hard (a ratchet of metal clicks), three bolts drawn back (low
    clunk, long ring), the seal breaking with a hiss of air, the hinge groaning on its stick-slip, and the door arriving at its stop. About 1.8 s."""
    r = rng6(3000)
    d = 1.85
    n, t = int(d * SR), tarr(d)
    out = np.zeros(n)
    at, gap, j = 0.0, .012, 0
    while at < .3:                                                       # the wheel: clicks that spread out as it slows
        BA.place(out, _burst(3010 + j, .014, 1700, 7000, .0025), at, .5)
        BA.place(out, _ping(r.uniform(2000, 2700), .07, .02, (1.0, 2.7), (1.0, .4), (1.0, .5)), at, .22)
        if j % 4 == 0:
            BA.place(out, _thump(230, 140, .06, .02), at, .45)
        at += gap
        gap *= 1.07
        j += 1
    whirr = bp(noise6(.4, 3020), 350, 1300) * (.5 + .5 * np.sin(2 * np.pi * 22 * tarr(.4))) * ar(.4, .02, .12)
    BA.place(out, whirr, 0, .22)
    for k, (bt, f) in enumerate(((.2, 520), (.27, 600), (.34, 690))):    # the bolts: kuh-CHUNK
        BA.place(out, _thump(200, 72, .22, .06), bt, .75 + .12 * k)
        BA.place(out, _thump(420, 210, .1, .02), bt, .5)
        BA.place(out, _ping(f, .55, .17, (1, 1.48, 2.35, 3.9), (1, .6, .4, .25), (1, .8, .6, .4)), bt + .004, .32)
        BA.place(out, _burst(3030 + k, .02, 1400, 6500, .004), bt, .6)
    hd = .95                                                             # the seal: a hiss of pressure leaving
    BA.place(out, hp(noise6(hd, 3040), 2200) * np.exp(-tarr(hd) / .28) * ar(hd, .03, .2), .34, .42)
    gd = 1.5                                                             # the hinge
    tg = tarr(gd)
    fg = np.interp(tg, [0, .35, .8, 1.5], [58, 82, 74, 64])
    body = lp(osc("saw", fg, gd) + .6 * osc("saw", fg * 1.5, gd), 520, 2)
    slip = .5 + .5 * np.sign(np.sin(2 * np.pi * 34 * tg + 1.4 * _smooth_rand(gd, 3050, 7)))
    slip = np.convolve(slip, np.ones(80) / 80, mode="same")
    squeal = osc("sine", np.interp(tg, [0, .5, 1.5], [390, 560, 430]) * (1 + .03 * _smooth_rand(gd, 3051, 40)), gd) * slip
    ge = np.interp(tg, [0, .18, .6, .95, 1.5], [0, .5, 1.0, .8, 0])
    BA.place(out, (body * .6 + squeal * .13 + bp(noise6(gd, 3052), 600, 2200) * slip * .06) * ge, .13, 1.0)
    BA.place(out, _thump(85, 38, .5, .12), .72, .8)                      # the door reaches its stop
    BA.place(out, _ping(260, .6, .2, (1.0, 2.1), (1.0, .4), (1.0, .6)), .72, .22)
    return norm6(out, .85)


def sfx_goldrush():
    """An avalanche of coins and gold bars: a few coins sliding out, then hundreds all at once, bars clonking down the heap, a low sliding rumble underneath, glints off
    the gold, and at the end coins rolling away across a carpet. Stereo, about 2.1 s, most of it in the first second."""
    r = rng6(3100)
    d = 2.1
    n = int(d * SR)
    out = np.zeros((2, n))
    times, c = [], .0
    while c < d - .2:                                                    # coin density: a trickle, a flood, then a long ebb
        rate = 22 + 130 * min(1, c / .3) ** 2 if c < .3 else 440 * np.exp(-(c - .3) / .5) + 14
        times.append(c)
        c += r.exponential(1 / rate)
    _tinks(out, times, r, lo=2200, hi=6800, gain=.2, tau=(.012, .045))
    for k in range(13):                                                  # the bars
        at = r.uniform(.3, 1.25)
        bar = _sum(_thump(r.uniform(210, 300), 110, .16, .045) * .8, _ping(r.uniform(650, 1500), .3, .09, (1.0, 2.1, 3.4), (1.0, .45, .25), (1.0, .6, .4)) * .35)
        place2(out, _sum(bar, _burst(3110 + k, .02, 1200, 5500, .004) * .5), at, r.uniform(.25, .6), r.uniform(-.8, .8))
    mass = lp(noise6(d, 3120), 190, 2) * np.interp(tarr(d), [0, .25, .6, 1.2, 2.1], [0, .5, 1.0, .45, 0]) * 2.4   # the heap sliding
    out += np.stack([mass, np.roll(mass, 220)]) * .55
    for k in range(10):                                                  # sunlight on gold
        at = r.uniform(.35, 1.7)
        g = _ping(r.uniform(5200, 9200), .4, .13, (1.0, 1.6), (1.0, .3), (1.0, .6)) * ar(.4, .001, .1)
        place2(out, g, at, .06 * r.uniform(.5, 1), r.uniform(-.9, .9))
    place2(out, _coin_spin(3300, .3, r), .95, .22, -.5)
    place2(out, _coin_spin(3700, .3, r), 1.3, .18, .6)
    return norm6(out, .85)


def sfx_moth():
    """A moth coming out of an empty purse and circling a lamp: soft bursts of papery wing flutter that pan round the room (louder as it passes the front), with a tiny dry squeak
    of effort. Stereo, 1.3 s."""
    r = rng6(3200)
    d = 1.3
    n, t = int(d * SR), tarr(d)
    fb = 30 + 5 * _smooth_rand(d, 3201, 4)                                # wing beat, about 30 a second
    beat = np.abs(np.sin(np.pi * np.cumsum(fb) / SR)) ** 1.6
    wings = bp(noise6(d, 3202), 220, 1100, 2) * beat + bp(noise6(d, 3203), 1500, 4200, 1) * beat * .18
    gate = np.zeros(n)
    for a, b in ((.0, .3), (.36, .64), (.7, .96), (1.02, 1.26)):          # flutter, glide, flutter
        i, j = int(a * SR), int(b * SR)
        gate[i:j] = np.hanning(j - i) ** .6
    pan = .7 * np.sin(2 * np.pi * 1.05 * t + 1.0)
    near = .65 + .35 * np.cos(2 * np.pi * 1.05 * t + 1.0 - np.pi / 2)    # passes the front, then the back of the lamp
    x = wings * gate * near
    sq_d = .07
    sq = osc("sine", np.linspace(3300, 4150, int(sq_d * SR)), sq_d) * np.hanning(int(sq_d * SR)) * .5
    sq += osc("sine", np.linspace(6600, 8300, int(sq_d * SR)), sq_d) * np.hanning(int(sq_d * SR)) * .08
    i = int(.74 * SR)
    x[i:i + len(sq)] += sq
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return norm6(np.stack([x * np.cos(th), x * np.sin(th)]), .45)


def sfx_punchclock():
    """A time clock taking a card: the CLUNK of the lever and frame, a ratchet's quick 'ka', a gap for the stamp's print (the cue after it lands 0.12 s in), then a tiny bell as the
    card pops out, and a spring still shivering."""
    r = rng6(3300)
    d = .95
    out = np.zeros(int(d * SR))
    BA.place(out, _thump(150, 70, .25, .07), 0, 1.0)
    BA.place(out, _thump(380, 190, .12, .02), 0, .6)
    BA.place(out, _ping(560, .25, .07, (1.0, 1.8, 2.9), (1.0, .5, .3)), 0, .42)
    BA.place(out, _burst(3310, .03, 900, 5200, .006), 0, .7)
    at = .045
    for j in range(5):                                                   # the mechanism catching up
        BA.place(out, _burst(3320 + j, .014, 1500, 6000, .003), at, .5 * (1 - j / 6))
        at += r.uniform(.011, .019)
    BA.place(out, _ping(1850, .09, .022, (1.0, 2.4), (1.0, .5)), .07, .45)
    BA.place(out, _ping(2637, .75, .25, (1.0, 2.32, 4.25, 6.63), (1.0, .5, .3, .15), (1.0, .6, .35, .2)) * ar(.75, .001, .1), .29, .3)
    sh = bp(noise6(.4, 3330), 1200, 3800) * (.5 + .5 * np.sin(2 * np.pi * 45 * tarr(.4))) * np.exp(-tarr(.4) / .12)
    BA.place(out, sh, .16, .1)
    return norm6(out, .85)


def sfx_clockdigit():
    """One tick of an LED wall clock: a crisp electronic 'tk' with a very short ring. Alternate calls are a slightly lower tick, so a run of them goes tick, tock."""
    k = _nth("clockdigit")
    f = 2400 if k % 2 == 0 else 1950
    d = .06
    x = _burst(3400 + k, d, 1800, 7000, .0018) * .8 + osc("sine", f, d) * expdecay(d, .007) * .6 + _thump(110, 75, d, .012) * .15
    return norm6(x, .6)


def sfx_clockding():
    """11:00:00. A bright bell struck once (a sine and its inharmonic partials, long ringing), the warm octave below it, a soft swell of air for the flash on the clock and a low
    thump under it all. 1.6 s."""
    d = 1.6
    out = np.zeros(int(d * SR))
    BA.place(out, _ping(1760, d, .85, (1.0, 2.76, 5.4, 8.93), (1.0, .42, .22, .1), (1.0, .55, .28, .12)) * ar(d, .0008, .2), 0, .62)
    BA.place(out, osc("sine", 880, 1.0) * expdecay(1.0, .45) * ar(1.0, .002, .1), 0, .3)
    BA.place(out, lp(noise6(.5, 3500), 4200) * np.sin(np.pi * np.linspace(0, 1, int(.5 * SR))) ** 1.5, .0, .12)
    BA.place(out, _thump(78, 46, .4, .11), 0, .55)
    return norm6(out, .8)


def _sweep_down(d, c0, c1, seed, width=.4, shape=1.0):
    """Noise whose pitch falls from c0 to c1 over d seconds: a bank of fixed band-passes cross-faded along an exponential path (a time-varying filter without the cost)."""
    t = np.linspace(0, 1, int(d * SR))
    fc = c0 * (c1 / c0) ** (t ** shape)
    src = noise6(d, seed)
    centres = np.geomspace(c1 * .8, c0 * 1.2, 10)
    out = np.zeros_like(t)
    for c in centres:
        out += bp(src, c * .78, min(c * 1.28, 20000), 2) * np.exp(-(np.log(fc / c) / width) ** 2)
    return out / (np.max(np.abs(out)) or 1)


def sfx_slowmo():
    """A short slow-motion whoosh: the air stretched out, a band of noise that falls in pitch while a low tone sags and swells. 0.8 s."""
    d = .8
    t = tarr(d)
    env = np.interp(t, [0, .3, .55, .8], [0, 1, .55, 0])
    x = _sweep_down(d, 2600, 220, 3600) * env * .8
    x += (osc("sine", np.linspace(210, 62, int(d * SR)), d) + .35 * osc("sine", np.linspace(420, 124, int(d * SR)), d)) * env * .45
    return norm6(x, .7)


def sfx_slowmolong():
    """The long slow-motion walk: the same stretched air over two seconds, deeper, with a heartbeat slowed to half speed (lub-dub, lub-dub) underneath."""
    d = 2.0
    t = tarr(d)
    env = np.interp(t, [0, .6, 1.3, 2.0], [0, 1, .8, 0])
    x = _sweep_down(d, 2200, 150, 3610, shape=.8) * env * .7
    x += (osc("sine", np.linspace(150, 48, int(d * SR)), d) + .3 * osc("sine", np.linspace(300, 96, int(d * SR)), d)) * env * .4
    for at in (.55, 1.4):
        x[int(at * SR):int(at * SR) + int(.2 * SR)] += _thump(86, 48, .2, .06) * .6
        x[int((at + .2) * SR):int((at + .2) * SR) + int(.2 * SR)] += _thump(74, 44, .2, .055) * .42
    return norm6(x, .7)


def sfx_timelapse11():
    """A time-lapse that fits the beat it is cued on (Episode 9's `timelapse` runs 6.4 s and rides on under the next five lines): a clock whose ticks speed up from one every 0.2 s to
    a blur, a swell of wound-up noise that peaks at about 1.1 s, and a whoosh as the speed ramp lets go. 1.45 s, gone before the next line."""
    d = 1.45
    out = np.zeros(int(d * SR))
    t, gap = 0.0, .21
    while t < 1.2:
        BA.place(out, bp(noise6(.012, int(t * 1000) + 4000), 2800, 9000, 1) * expdecay(.012, .003), t, 1.2)
        t += gap
        gap = max(.022, gap * .86)
    out += bp(noise6(d, 4100), 300, 3200) * np.interp(tarr(d), [0, .9, 1.15, 1.45], [0, .5, 1.0, 0]) * .3
    BA.place(out, _sweep_down(.5, 3200, 400, 4110) * np.sin(np.pi * np.linspace(0, 1, int(.5 * SR))) ** 1.2 * .35, .95)
    return norm6(out, .6)


def sfx_purse():
    """A coin purse's kiss-lock clasp: a bright 'tik', a lighter 'tak', and the small hollow breath of a purse with nothing in it."""
    d = .3
    out = np.zeros(int(d * SR))
    BA.place(out, _sum(_burst(3700, .02, 2500, 8000, .002), _ping(3100, .06, .014, (1.0, 2.2), (.5, .2))), 0, .8)
    BA.place(out, _sum(_burst(3701, .02, 2500, 8000, .002) * .8, _ping(4200, .05, .011, (1.0, 2.2), (.4, .15))), .055, .6)
    BA.place(out, lp(noise6(.12, 3702), 500) * expdecay(.12, .03) * ar(.12, .006, .06), .07, .2)
    return norm6(out, .5)


def sfx_tapeprint():
    """An adding machine printing its tape: a column of figures struck one after another (a sharp 'tchk' and a soft thunk each), the paper advancing between them, and a long
    feed with a small bell at the total."""
    r = rng6(3800)
    d = 1.2
    out = np.zeros(int(d * SR))
    at = .02
    for j in range(7):
        BA.place(out, _burst(3810 + j, .02, 900, 4800, .005), at, .9)
        BA.place(out, _thump(170, 95, .06, .02), at, .45)
        BA.place(out, _burst(3820 + j, .045, 2500, 6500, .02) * ar(.045, .004, .02), at + .04, .22)
        at += r.uniform(.105, .135)
    feed = bp(noise6(.28, 3830), 1800, 6000) * np.linspace(.3, 1, int(.28 * SR)) * ar(.28, .02, .03)
    BA.place(out, feed, at + .03, .3)
    BA.place(out, _ping(2349, .5, .16, (1.0, 2.76), (1.0, .3), (1.0, .4)) * ar(.5, .001, .06), at + .32, .3)
    return norm6(out, .7)


# ================================================================ register
BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})
A6.DUCK_SFX.update({"rumble", "typing"})   # the rumble's swell runs on into 'Oh. We do have that one.', the typing into the invoice speech: both duck under speech


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep11.json"), ("--out", "build/ep11"), ("--var", "TIMELINE_EP11"), ("--music", "build_music11")):
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
    dips, deep = A10.aac_guard(wav)
    print(f"aac guard: {dips} dip(s), deepest {deep:.2f} dB (keeps the AAC encode under -1 dBTP)")


if __name__ == "__main__":
    main()
