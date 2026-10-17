"""Episode 10 audio: a thin wrapper on the Episode 9 / 8 / 7 / 6 mixer.

Importing build_audio9 registers every Episode 9 effect (and, through it, Episode 7's and 6's) in build_audio.SFX. This file will hold the new effects script_ep10.json
asks for beyond that, changes the defaults (script, output folder, timeline variable, music module) and runs the same loudness trim and peak limiter as Episode 9.

Usage: python3 build_audio10.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--events build/ep10/events.json]
"""
import os
import sys

import numpy as np

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
from build_audio import SR, tarr, osc, expdecay, ar, lp, bp, midi
from build_audio6 import noise6, rng6, norm6

# ================================================================ sound effects (none yet)

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
