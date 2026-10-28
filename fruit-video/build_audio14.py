"""Episode 14 audio: a thin wrapper on the Episode 13 / 12 / 11 / 10 / 9 / 7 / 6 mixer, plus the sound effects only this episode needs.

PLACEHOLDER written by the lead so the timeline could be built and frozen: the sound builder replaces the three first-draft effects below (buzz, plink, plinkland), refines the cue
list and writes the final main(). Importing build_audio13 registers every earlier effect (Episodes 6 to 13) in the same registry (build_audio.SFX).
Usage: python3 build_audio14.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep14_sound]
"""
import os
import sys

import numpy as np

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
import build_audio10 as A10
import build_audio13 as A13
from build_audio import SR, tarr, osc, ar, lp, bp, hp, noise, expdecay, norm


def sfx_buzz():
    """A phone vibrating on a table: two short buzzes."""
    d = .34
    t = tarr(d)
    x = (osc("saw", 170, d) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t)))) * ar(d, .01, .1)
    out = np.zeros(int(.7 * SR))
    for k, off in enumerate((0, .16)):
        i = int(off * SR)
        out[i:i + len(x)] += x[:len(out) - i]
    return norm(lp(out, 900), .6)


def sfx_plink():
    """One peg of the Plinko board: a short, bright wooden-bell tick."""
    d = .22
    t = tarr(d)
    x = (np.sin(2 * np.pi * 1760 * t) + .5 * np.sin(2 * np.pi * 2637 * t)) * expdecay(d, .05)
    x += .5 * bp(noise(d), 2500, 6000) * expdecay(d, .008)
    return norm(x, .7)


def sfx_plinkland():
    """The ball lands in its slot: a low thunk and a bell."""
    d = .8
    t = tarr(d)
    x = np.sin(2 * np.pi * 110 * t) * expdecay(d, .12) + .4 * (np.sin(2 * np.pi * 880 * t) + np.sin(2 * np.pi * 1320 * t)) * expdecay(d, .3)
    return norm(x, .8)


BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep14.json"), ("--out", "build/ep14"), ("--var", "TIMELINE_EP14"), ("--music", "build_music14")):
        if k not in argv:
            argv += [k, v]
    sys.argv = [sys.argv[0]] + argv
    A6.main()


if __name__ == "__main__":
    main()
