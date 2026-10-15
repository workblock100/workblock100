"""Episode 8 audio: a thin wrapper on the Episode 7 / Episode 6 mixer.

Importing build_audio7 registers every Episode 7 sound effect and ambience bed (howl, stamp, flicker, cage, ball, dab, bingo_ding, phonering, theme7,
the 'night' bed ...) on top of Episode 6's, so script_ep8.json needs nothing new. This file only changes the defaults (script, output folder, timeline
variable, music module) and runs the Episode 7 peak limiter on the finished wav, exactly as build_audio7.main does.

Usage: python3 build_audio8.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--events build/ep8/events.json]
"""
import os
import sys

import build_audio6 as A6
import build_audio7 as A7   # noqa: F401  (importing it registers its sfx and ambiences)


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep8.json"), ("--out", "build/ep8"), ("--var", "TIMELINE_EP8"), ("--music", "build_music8")):
        if k not in argv:
            argv += [k, v]
    sys.argv = [sys.argv[0]] + argv
    A6.main()
    out = argv[argv.index("--out") + 1]
    print(f"peak limiter: deepest gain dip {A7.peak_limit(os.path.join(A6.HERE, out, 'audio.wav')):.2f} dB")


if __name__ == "__main__":
    main()
