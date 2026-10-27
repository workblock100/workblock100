"""Episode 12 audio: a thin wrapper on the Episode 11 / 10 / 9 / 7 / 6 mixer, plus the few sound effects only this episode needs.

Importing build_audio11 registers every earlier effect (Episodes 6 to 11) in the same registry (build_audio.SFX). This file adds the projector's slide clack and fan,
a crowd's applause, the fire alarm bell and an award gong, changes the defaults (script, output folder, timeline variable, music module) and runs the same loudness trim,
peak limiter and AAC guard as Episodes 10 and 11. Nothing is sampled: every sound is a few lines of numpy.

Usage: python3 build_audio12.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--events build/ep12/events.json]
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
from build_audio import SR, tarr, osc, ar
from build_audio6 import norm6, rng6
from build_audio10 import _nth, _burst


# ================================================================ sound effects (first drafts; the sound pass refines them)
def sfx_clack():
    """A projector slide changing: a small plastic-and-wood click with a bright ring on top."""
    k = _nth("clack")
    r = rng6(4000 + k)
    d = .09
    t = tarr(d)
    x = _burst(4010 + k, d, 1800, 6000, .006) + .5 * osc("sine", r.uniform(1900, 2600), d) * np.exp(-t / .01)
    return norm6(x, .7 * r.uniform(.85, 1.0))


def sfx_fanwhir():
    """A projector's fan: a low hum that spins up under a soft wash of air."""
    k = _nth("fanwhir")
    d = 1.2
    hum = sum(a * osc("sine", f, d) for f, a in ((112, 1.0), (224, .35), (336, .15)))
    air = _burst(4110 + k, d, 300, 2400, 1.0)
    return norm6((hum * .5 + air * .25) * ar(d, .25, .3), .5)


def sfx_applause():
    """A small crowd clapping: about forty claps, dense at first and thinning out, each a short band of noise."""
    k = _nth("applause")
    r = rng6(4200 + k)
    d = 1.6
    n = int(d * SR)
    x = np.zeros(n)
    for i in range(40):
        at = d * (1 - (1 - i / 40) ** 1.6) * .95 + r.uniform(-.01, .01)
        j = int(max(0.0, at) * SR)
        c = _burst(4210 + 100 * k + i, .06, 1400, 5200, .014)
        m = min(len(c), n - j)
        if m > 0:
            x[j:j + m] += c[:m] * r.uniform(.5, 1.0)
    return norm6(x, .6)


def sfx_firebell():
    """A fire alarm bell: two electric strikes a beat apart, each a hard metallic ring with a buzz on top."""
    d = .9
    t = tarr(d)
    x = np.zeros(len(t))
    for on in (0.0, .42):
        dt = t - on
        ring = osc("sine", 1120, d) + .6 * osc("sine", 1490, d) + .3 * osc("sine", 2240, d)
        buzz = np.sign(osc("sine", 60, d))
        x += np.where((dt >= 0) & (dt < .38), ring * np.exp(-np.clip(dt, 0, None) / .12) * (.6 + .4 * buzz), 0.0)
    return norm6(x, .75)


def sfx_gong():
    """An award gong: a struck metal disc, a low fundamental and inharmonic partials that ring out for about two seconds."""
    k = _nth("gong")
    d = 2.4
    t = tarr(d)
    x = sum(a * osc("sine", f, d) * np.exp(-t / tau) for f, a, tau in ((96, 1.0, 1.4), (152, .6, 1.1), (233, .45, .9), (371, .3, .6), (518, .2, .4)))
    x = x + .3 * _burst(4300 + k, d, 60, 300, .04)
    return norm6(x * ar(d, .002, .4), .85)


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
