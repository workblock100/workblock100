"""Episode 13 audio: a thin wrapper on the Episode 12 / 11 / 10 / 9 / 7 / 6 mixer, plus the sound effects only this episode needs.

Importing build_audio12 registers every earlier effect (Episodes 6 to 12) in the same registry (build_audio.SFX). This file adds the heist: a vault dial, a heavy bolt, a record
scratch, the blueprint hologram, the call-light lasers in slow motion, a radio click, the creak of a door that has been shut since 2019, and a wall of call lights going off at once.
It changes the defaults (script, output folder, timeline variable, music module) and runs the same loudness trim, peak limiter and AAC guard as Episodes 10 to 12.
Nothing is sampled: every sound is a few lines of numpy. Every function here is a first draft until the sound pass refines it.

Usage: python3 build_audio13.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep13_sound]
"""
import os
import sys

import numpy as np

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
import build_audio10 as A10
import build_audio12 as A12
from build_audio import SR, tarr, osc, ar, lp, bp
from build_audio6 import norm6, rng6, noise6
from build_audio10 import _nth, _burst


def _fade_end(x, n):
    n = min(n, len(x))
    x[len(x) - n:] *= np.linspace(1, 0, n)
    return x


def _place(x, clip, at, g=1.0):
    j = int(at * SR)
    m = min(len(clip), len(x) - j)
    if j >= 0 and m > 0:
        x[j:j + m] += clip[:m] * g


# ================================================================ sound effects (first drafts)
def sfx_vaultdial():
    """A combination dial turning: 26 ratchet clicks that slow down as the dial finds its number, over a low servo whir."""
    d = 2.45
    x = np.zeros(int(d * SR))
    r = rng6(1301)
    for i in range(26):
        at = d * .96 * (1 - (1 - i / 26) ** 1.8)
        _place(x, _burst(1310 + i, .03, 1800, 6500, .0016) * r.uniform(.6, 1.0), at)
    t = tarr(d)
    x += .12 * np.sin(2 * np.pi * np.cumsum(70 + 30 * (1 - t / d)) / SR) * ar(d, .1, .6)
    return norm6(x, .7)


def sfx_clunk():
    """A heavy bolt shooting home: a low thud, a metal knock and a short ring."""
    k = _nth("clunk")
    d = .6
    t = tarr(d)
    thud = osc("sine", 68, d) * np.exp(-t / .12)
    knock = _burst(1320 + k, d, 600, 3000, .012) * .5
    ring = (np.sin(2 * np.pi * 1180 * t) + .5 * np.sin(2 * np.pi * 1760 * t)) * np.exp(-t / .09) * .18
    return norm6(_fade_end(thud + knock + ring, 200), .85)


def sfx_recscratch():
    """A record scratch: noise through a band that sweeps down and back, with a pitch-bent wobble under it."""
    d = .42
    t = tarr(d)
    n = noise6(d, 1330)
    fc = 900 + 3200 * np.abs(np.sin(2 * np.pi * 2.2 * t)) * np.exp(-t / .25)
    out = np.zeros_like(n)
    for lo, hi, w in ((300, 1200, .6), (1200, 4200, .9)):
        out += w * bp(n, lo, hi, 2)
    wob = np.sin(2 * np.pi * np.cumsum(180 + 420 * np.abs(np.sin(2 * np.pi * 3 * t))) / SR)
    return norm6(_fade_end((out * (.4 + .6 * fc / fc.max()) + .35 * wob) * np.exp(-t / .3), 400), .75)


def sfx_holoon():
    """A hologram table powering up: a rising shimmer sweep with a little tail of sparkle."""
    d = .6
    t = tarr(d)
    f = 280 + 1900 * (t / d) ** 1.7
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * ar(d, .08, .3) + .35 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * ar(d, .12, .25)
    return norm6(x, .55)


def sfx_holoblip():
    """A small interface blip: two quick sine tones a fifth apart."""
    d = .16
    t = tarr(d)
    x = np.sin(2 * np.pi * 1568 * t) * np.exp(-t / .03) + .6 * np.sin(2 * np.pi * 2349 * np.maximum(t - .045, 0)) * (t > .045) * np.exp(-np.maximum(t - .045, 0) / .035)
    return norm6(_fade_end(x, 96), .5)


def sfx_pips():
    """Thirty-two rooms lighting up: a fast run of tiny ascending pips."""
    d = 1.0
    x = np.zeros(int(d * SR))
    for i in range(32):
        at = i * .028
        t = tarr(.05)
        _place(x, np.sin(2 * np.pi * (900 + i * 38) * t) * np.exp(-t / .012), at, .5)
    return norm6(x, .5)


def sfx_holooff():
    """The hologram collapsing: the power-up sweep, backwards and quicker."""
    return norm6(sfx_holoon()[::-1].copy()[:int(.35 * SR)], .5)


def sfx_cardslam():
    """A card slammed on a table: a flat slap and a low thump."""
    k = _nth("cardslam")
    d = .3
    t = tarr(d)
    return norm6(_fade_end(_burst(1340 + k, d, 500, 5000, .014) * .8 + osc("sine", 95, d) * np.exp(-t / .07), 200), .8)


def sfx_laserhum():
    """A red beam humming: a 120 Hz buzz with a thin 2.6 kHz shimmer, swelling in and out."""
    d = 1.4
    t = tarr(d)
    x = np.sin(2 * np.pi * 120 * t) + .5 * np.sin(2 * np.pi * 240 * t) + .15 * np.sin(2 * np.pi * 2600 * t) * (1 + np.sin(2 * np.pi * 7 * t))
    return norm6(x * ar(d, .3, .5), .4)


def sfx_laserpass():
    """A beam sliding through a body: a short falling zap."""
    d = .32
    t = tarr(d)
    f = 3000 - 2200 * (t / d)
    return norm6(_fade_end(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .12), 300), .5)


def sfx_heartbeat():
    """Three slow heartbeats, each a lub and a dub."""
    d = 2.6
    x = np.zeros(int(d * SR))
    for i in range(3):
        for off, g in ((0, 1.0), (.2, .75)):
            t = tarr(.18)
            _place(x, np.sin(2 * np.pi * 52 * t) * np.exp(-t / .05) * ar(.18, .004, .1), .1 + i * .85 + off, g)
    return norm6(x, .7)


def sfx_beep3():
    """Three countdown beeps, the last one higher."""
    x = np.zeros(int(.9 * SR))
    for i, f in enumerate((880, 880, 1320)):
        t = tarr(.12)
        _place(x, np.sin(2 * np.pi * f * t) * ar(.12, .005, .04), i * .25)
    return norm6(x, .5)


def sfx_freezesnap():
    """A freeze-frame: a camera shutter and a short whoosh."""
    k = _nth("freezesnap")
    d = .45
    t = tarr(d)
    shut = _burst(1350 + k, .08, 1200, 7000, .006)
    wh = lp(noise6(d, 1360 + k), 2500, 2) * np.sin(np.pi * np.minimum(1, t / d)) * .5
    x = wh.copy()
    _place(x, shut, .02, 1.0)
    return norm6(x, .6)


def sfx_radioclick():
    """A radio key-up: a short squelch burst."""
    k = _nth("radioclick")
    return norm6(_fade_end(bp(noise6(.06, 1370 + k), 800, 3600, 2) * np.exp(-tarr(.06) / .02), 100), .4)


def sfx_doorcreak():
    """A door that has not moved since 2019: a long rusty creak, a pitch that wanders up and down with a rasp on top."""
    d = 2.2
    t = tarr(d)
    f = 240 + 90 * np.sin(2 * np.pi * .9 * t) + 60 * np.sin(2 * np.pi * 2.3 * t) + 40 * t
    saw = ((np.cumsum(f) / SR) % 1.0) * 2 - 1
    x = lp(saw, 1400, 2) * ar(d, .15, .5) * (.7 + .3 * np.sin(2 * np.pi * 11 * t)) + .2 * bp(noise6(d, 1380), 900, 3000, 2) * ar(d, .1, .4)
    return norm6(x, .55)


def sfx_wind():
    """A cold draught down a corridor: low-passed noise that breathes."""
    d = 2.0
    t = tarr(d)
    return norm6(lp(noise6(d, 1390), 600, 2) * (.5 + .5 * np.sin(2 * np.pi * .7 * t)) * ar(d, .4, .6), .35)


def sfx_drip():
    """One drip: a short falling sine plink."""
    d = .3
    t = tarr(d)
    return norm6(np.sin(2 * np.pi * np.cumsum(1700 - 900 * np.minimum(1, t / .06)) / SR) * np.exp(-t / .05), .35)


def sfx_gasp():
    """Several people drawing breath at once: shaped air."""
    d = .5
    t = tarr(d)
    return norm6(bp(noise6(d, 1400), 500, 3500, 2) * np.sin(np.pi * np.minimum(1, t / d)) ** 2, .45)


def sfx_bonecreak():
    """An old joint straightening: a run of dry creaks and two pops."""
    d = 1.2
    x = np.zeros(int(d * SR))
    r = rng6(1410)
    for i in range(14):
        _place(x, _burst(1420 + i, .03, 500, 2600, .008) * r.uniform(.3, 1.0), i * .075 + r.uniform(0, .03))
    return norm6(x, .6)


def sfx_dust():
    """A cloud of dust shaken out: a soft puff."""
    d = .6
    t = tarr(d)
    return norm6(lp(noise6(d, 1430), 1800, 2) * np.exp(-t / .2) * ar(d, .01, .3), .3)


def sfx_steps():
    """Slow shuffling steps: four soft pats."""
    d = 2.0
    x = np.zeros(int(d * SR))
    for i in range(4):
        _place(x, _burst(1440 + i, .12, 150, 900, .03), .1 + i * .45, .8)
    return norm6(x, .45)


def sfx_wrapper():
    """A granola bar wrapper opening: crinkle bursts."""
    d = .9
    x = np.zeros(int(d * SR))
    r = rng6(1450)
    for i in range(18):
        _place(x, _burst(1460 + i, .02, 2500, 9000, .006) * r.uniform(.3, 1.0), r.uniform(0, .8))
    return norm6(x, .4)


def sfx_munch():
    """One bite of something crunchy."""
    k = _nth("munch")
    d = .3
    return norm6(_fade_end(_burst(1470 + k, d, 800, 5000, .02) * .9 + _burst(1480 + k, d, 200, 900, .03) * .5, 200), .6)


def sfx_callcascade():
    """Every call light in the building at once: forty dings, more and more of them, panning across the room."""
    d = 1.8
    x = np.zeros((2, int(d * SR)))
    r = rng6(1490)
    for i in range(40):
        at = d * .8 * (i / 40) ** 1.6
        f = r.choice([1568, 1760, 1976, 2093])
        t = tarr(.5)
        ding = (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / .12) * r.uniform(.25, .7)
        pan = r.uniform(-1, 1)
        j = int(at * SR)
        m = min(len(ding), x.shape[1] - j)
        x[0, j:j + m] += ding[:m] * (1 - pan) / 2 * 1.4
        x[1, j:j + m] += ding[:m] * (1 + pan) / 2 * 1.4
    mono = x.mean(axis=0)
    return norm6(mono, .7)


BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep13.json"), ("--out", "build/ep13"), ("--var", "TIMELINE_EP13"), ("--music", "build_music13")):
        if k not in argv:
            argv += [k, v]
    sys.argv = [sys.argv[0]] + argv
    A6.main()
    out = argv[argv.index("--out") + 1]
    wav = os.path.join(A6.HERE, out, "audio.wav")
    print(f"loudness trim: {A9.trim_loudness(wav):+.2f} dB")
    print(f"peak limiter: deepest gain dip {A7.peak_limit(wav):.2f} dB")
    import soundfile as sf
    if sf.info(wav).subtype != "PCM_16":
        x, sr = sf.read(wav, dtype="float64")
        sf.write(wav, np.clip(x, -1, 1), sr, subtype="PCM_16")
    dips, deep = A10.aac_guard(wav)
    print(f"aac guard: {dips} dip(s), deepest {deep:.2f} dB (keeps the AAC encode under -1 dBTP)")


if __name__ == "__main__":
    main()
