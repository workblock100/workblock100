"""Episode 12 audio: a thin wrapper on the Episode 11 / 10 / 9 / 7 / 6 mixer, plus the few sound effects only this episode needs.

Importing build_audio11 registers every earlier effect (Episodes 6 to 11) in the same registry (build_audio.SFX). This file adds the projector's slide clack and fan,
a crowd's applause, the fire alarm bell and an award gong, changes the defaults (script, output folder, timeline variable, music module) and runs the same loudness trim,
peak limiter and AAC guard as Episodes 10 and 11. Nothing is sampled: every sound is a few lines of numpy.

Usage: python3 build_audio12.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep12_sound]
"""
import os
import sys

import numpy as np

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
import build_audio10 as A10
import build_audio11 as A11
from build_audio import SR, tarr, osc, ar, lp, bp
from build_audio6 import norm6, rng6, noise6
from build_audio10 import _nth, _burst


def _fade_end(x, n):
    """A short linear fade to zero over the last n samples of a clip, so no clip ends mid-wave."""
    n = min(n, len(x))
    x[len(x) - n:] *= np.linspace(1, 0, n)
    return x


# ================================================================ sound effects (refined in the sound pass; the registration is at the end of this section)
def sfx_clack():
    """A projector slide changing: a dry plastic-and-wood click. A 1.2 ms tick on top, a wooden body near 700 Hz that dies in about 15 ms, and a quieter, faster
    plastic ring near 2.4 kHz. Bright, nothing much above 5 kHz, so it is not harsh. The peak varies a little from cue to cue."""
    k = _nth("clack")
    r = rng6(4000 + k)
    d = .1
    t = tarr(d)
    body = osc("sine", r.uniform(640, 780), d) * np.exp(-t / .015)
    ring = osc("sine", r.uniform(2200, 2700), d) * np.exp(-t / .008) * .45
    tick_ = _burst(4010 + k, d, 2000, 7000, .0012)
    rattle = _burst(4020 + k, d, 1500, 4000, .02) * .15
    x = .35 * body + ring + tick_ + rattle
    return norm6(_fade_end(x, 96), .7 * r.uniform(.85, 1.0))


def sfx_fanwhir():
    """A projector's fan spinning up: a low blade hum that climbs from about 46 Hz to 104 Hz (two quiet overtones, nothing above about 330 Hz, so it never whines),
    under a wash of air through a 700 Hz low-pass that swells as the fan speeds up."""
    k = _nth("fanwhir")
    d = 1.2
    t = tarr(d)
    u = t / d
    ph = np.cumsum(46 + 58 * u ** 1.6) / SR
    hum = np.sin(2 * np.pi * ph) + .35 * np.sin(4 * np.pi * ph) + .12 * np.sin(6 * np.pi * ph)
    air = lp(noise6(d, 4110 + k), 700, 2) * (.3 + .7 * u ** 2)
    air = air / np.max(np.abs(air))
    x = (hum * (.55 + .45 * u) * .5 + air * .3) * ar(d, .25, .3)
    return norm6(x, .5)


def sfx_applause():
    """A small crowd: forty claps. The clap times follow a curve that is dense at the start (the first ten fall inside about 0.15 s, some overlapping) and thins out
    (the last ten are spread over the final 0.8 s), so it reads as people clapping and not as a machine gun. Each clap has its own band, length and level and, now and
    then, a double hit. A soft wash of crowd sits underneath and dies away by about 1.4 s."""
    k = _nth("applause")
    r = rng6(4200 + k)
    d = 1.6
    n = int(d * SR)
    t = tarr(d)
    x = np.zeros(n)
    for i in range(40):
        at = d * .95 * (i / 40) ** 1.7 + r.uniform(-.008, .008)
        lvl = r.uniform(.35, 1.0) * (1 - .5 * i / 40)
        c = _burst(4210 + 100 * k + i, r.uniform(.035, .06), r.uniform(900, 1800), r.uniform(2800, 4600), r.uniform(.008, .016))
        hit_list = [(max(0.0, at), 1.0)]
        if r.uniform() < .3:
            hit_list.append((max(0.0, at) + r.uniform(.01, .016), .55))
        for when, g in hit_list:
            j = int(when * SR)
            m = min(len(c), n - j)
            if m > 0:
                x[j:j + m] += c[:m] * lvl * g
    wash = lp(noise6(d, 4290 + k), 3000, 2) * np.minimum(1, t / .15) * np.exp(-t / .45)
    x += .12 * wash / np.max(np.abs(wash))
    return norm6(x, .6)


def sfx_firebell():
    """A fire alarm bell: two electric strikes 0.42 s apart. Each strike is a hard click, then a metallic ring (partials at 1.12, 1.49, 2.24 and 3.1 kHz, the high ones
    dying first) with a 120 Hz buzz riding on it, the way an electric bell buzzes. The rings run out through the clip; nothing is cut off."""
    d = .9
    t = tarr(d)
    x = np.zeros(len(t))
    for on in (0.0, .42):
        live = t >= on
        dt = np.where(live, t - on, 0.0)
        ring = sum(a * np.sin(2 * np.pi * f * dt) * np.exp(-dt / tau) for f, a, tau in ((1120, 1.0, .13), (1490, .55, .09), (2240, .32, .06), (3100, .14, .04)))
        buzz = 1 - .45 * (.5 + .5 * np.sin(2 * np.pi * 120 * t))
        click = bp(noise6(d, 4400 + int(on * 100)), 1500, 9000, 2) * np.exp(-dt / .0015) * np.minimum(1, dt / .0004)
        x += live * (ring * buzz + .35 * click)
    return norm6(_fade_end(x, int(.02 * SR)), .75)


def sfx_gong():
    """An award gong, struck: a bright beater click (1.2 to 8 kHz, 4 ms) on top of a long low bloom. Seven inharmonic modes on a 78 Hz fundamental (ratios 1, 1.52, 2.07,
    2.73, 3.34, 4.12, 5.0), each a detuned pair so the bloom shimmers and beats. The low modes ring for almost 2 s, the high ones die in under half a second, and the
    fundamental sags about 1.5 percent in the first tenth of a second, the way a struck gong does."""
    k = _nth("gong")
    d = 2.4
    t = tarr(d)
    glide = 1 + .015 * np.exp(-t / .1)
    bloom = np.zeros(len(t))
    for ratio, a, tau in ((1.0, 1.0, 1.8), (1.52, .62, 1.5), (2.07, .5, 1.2), (2.73, .38, .9), (3.34, .22, .6), (4.12, .14, .42), (5.0, .09, .3)):
        ph = np.cumsum(78.0 * ratio * glide) / SR
        for det in (1.0, 1.0035):
            bloom += .5 * a * np.sin(2 * np.pi * ph * det) * np.exp(-t / tau)
    strike = bp(noise6(d, 4300 + k), 1200, 8000, 2) * np.exp(-t / .004) * 2.6 + .8 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t / .008)
    return norm6((bloom + strike) * ar(d, .002, .45), .85)


BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep12.json"), ("--out", "build/ep12"), ("--var", "TIMELINE_EP12"), ("--music", "build_music12")):
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
