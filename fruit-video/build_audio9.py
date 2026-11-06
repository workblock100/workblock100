"""Episode 9 audio: a thin wrapper on the Episode 8 / 7 / 6 mixer, plus five new sound effects.

Importing build_audio7 registers every Episode 7 effect and ambience (theme7, honk, the 'night' bed ...) on top of Episode 6's. This file adds what script_ep9.json
asks for beyond that - an office cheer, a cash register, a small sports car pulling away, tyres squealing, a five-star chime - registers them in the same registry
(build_audio.SFX, as build_audio7 does), changes the defaults (script, output folder, timeline variable, music module) and runs the Episode 7 peak limiter on the
finished wav, exactly as build_audio8.main does. Nothing is sampled: every sound is a few lines of numpy.

Usage: python3 build_audio9.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--events build/ep9/events.json]
"""
import os
import sys

import numpy as np

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7   # noqa: F401  (importing it registers its sfx and ambiences)
from build_audio import SR, tarr, osc, expdecay, ar, lp, bp, midi
from build_audio6 import noise6, rng6, norm6
from build_audio7 import _vowel


def _pan_st(x, pan):
    """A mono clip as (2, n) with a pan (a scalar or one value per sample, -1 left .. +1 right), equal power."""
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def _whoo(f0, d, seed):
    """One voice going 'whoo!': a breathy 'wh', then an 'oo' that scoops up in pitch on a little vibrato."""
    t = tarr(d)
    f = np.interp(t, [0, .12, d * .55, d], [f0 * .82, f0, f0 * 1.42, f0 * 1.28]) * (1 + .018 * np.sin(2 * np.pi * 5.6 * t + seed) * np.clip((t - .15) / .2, 0, 1))
    src = lp(osc("saw", f, d), 3200, 1) + .3 * osc("sine", f, d)
    v = _vowel(src, (310, 870, 2250), (1.0, .5, .2))
    v = v / (np.max(np.abs(v)) or 1)
    breath = bp(noise6(d, seed), 1000, 4500) * np.exp(-t / .05) * .35
    return (v + breath) * ar(d, .05, d * .5)


# ================================================================ sound effects
def sfx_cheer9():
    """A small office crowd cheering and applauding: seven 'whoo' voices of different pitch coming in one after another, over a patter of hand claps
    (about twelve a second at the start, thinning out), the whole thing decaying softly. Stereo."""
    d = 1.8
    n = int(d * SR)
    t = tarr(d)
    r = rng6(901)
    out = np.zeros((2, n))
    for k, (f0, at) in enumerate(zip((148, 176, 214, 252, 292, 338, 196), (.02, .07, .12, .19, .27, .33, .41))):
        vd = r.uniform(.5, .85)
        v = _whoo(f0 * r.uniform(.96, 1.05), vd, 902 + k)
        A6.place2(out, v, at, r.uniform(.55, 1.0) * .5, r.uniform(-.8, .8))
    time, claps = .03, []
    while time < d - .25:   # claps at a rate that starts near 12 a second and thins
        claps.append(time)
        time += r.exponential(1 / (11.5 * np.exp(-time / 1.2) + 1.2))
    for at in claps:
        c = r.uniform(1100, 3200)
        burst = np.zeros(int(.07 * SR))
        for off in (0, r.uniform(.004, .01), r.uniform(.01, .02)):   # a clap is a few hands a few milliseconds apart
            bb = bp(noise6(.05, int(at * 1e4) + int(off * 1e4)), c * .7, c * 1.6) * expdecay(.05, r.uniform(.008, .016))
            burst[int(off * SR):int(off * SR) + len(bb)] += bb[:len(burst) - int(off * SR)] * r.uniform(.5, 1)
        A6.place2(out, burst, at, r.uniform(.25, .7), r.uniform(-.85, .85))
    env = np.minimum(1, t / .05) * np.where(t < 1.0, 1.0, np.exp(-(t - 1.0) / .38)) * ar(d, .001, .15)
    return norm6(out * env, .78)


def sfx_chaching9():
    """A cash register: key clack, the drawer's rattling slide and its thunk ('cha-'), a two-bell ding ('-ching'), and coins jingling in the tray."""
    d = 1.1
    n = int(d * SR)
    out = np.zeros(n)
    r = rng6(911)
    BA.place(out, bp(noise6(.03, 912), 1200, 6500) * expdecay(.03, .006), 0, .6)
    BA.place(out, osc("sine", np.linspace(220, 110, int(.06 * SR)), .06) * expdecay(.06, .016), 0, .6)
    sd = .24                                            # the drawer: a noise sweep that climbs, with a mechanical rattle in it
    ts = tarr(sd)
    src = noise6(sd, 913)
    edges = (400, 800, 1500, 2900, 5500)
    slide = sum(bp(src, lo, hi, 2) * np.exp(-((ts / sd - (i + .5) / 4) / .2) ** 2) for i, (lo, hi) in enumerate(zip(edges[:-1], edges[1:])))
    BA.place(out, slide * (.65 + .35 * np.sign(np.sin(2 * np.pi * 95 * ts))) * ar(sd, .02, .05), .03, 1.1)
    BA.place(out, osc("sine", np.linspace(140, 55, int(.14 * SR)), .14) * expdecay(.14, .04), .27, .8)
    BA.place(out, lp(noise6(.1, 914), 600) * expdecay(.1, .025), .27, .4)
    for f, at, g, tau in ((2637.0, .3, 1.0, .3), (3322.0, .31, .65, .26)):   # the bell: bright, inharmonic partials
        bd = .78
        x = sum(a * osc("sine", f * q, bd) * expdecay(bd, tau * s) for a, q, s in ((1, 1, 1), (.55, 2.32, .6), (.35, 4.25, .35), (.2, 6.63, .2)))
        BA.place(out, x * ar(bd, .0008, .1), at, .5 * g)
    for k in range(10):                                  # the coin jingle
        at = .56 + k * .05 + r.uniform(0, .03)
        f = r.uniform(3300, 7200)
        cd = .12
        x = osc("sine", f, cd) + .5 * osc("sine", f * 1.47, cd) + .3 * osc("sine", f * 2.09, cd)
        BA.place(out, x * expdecay(cd, r.uniform(.02, .04)) * ar(cd, .0005, .03), at, .17 * (1 - k / 14))
    return norm6(out * ar(d, .001, .12), .8)


def sfx_engine9():
    """A small sports car pulling away: a buzzy engine that climbs through three gears (two shifts, each with a lift and a few exhaust pops), a burble under it,
    getting quieter and duller as it goes while it swings from the middle out to the right. Stereo."""
    d = 2.2
    n = int(d * SR)
    t = tarr(d)
    f = np.interp(t, [0, .08, .74, .84, .9, 1.45, 1.54, 1.6, 2.2], [42, 80, 188, 118, 122, 205, 138, 142, 226])
    src = osc("saw", f, d) * .6 + osc("square", f * .5, d) * .35 + osc("saw", f * 2.003, d) * .12
    rpm = (f - 40) / 190
    b = np.clip(.12 + .8 * rpm - .45 * t / d, 0, 1)
    voice = lp(src, 380) * (1 - b) ** 2 + lp(src, 1000) * 2 * b * (1 - b) + lp(src, 2600) * b ** 2
    burble = lp(noise6(d, 921), 330, 2) * (.55 + .45 * np.sin(2 * np.pi * np.cumsum(f * .5) / SR)) ** 2 * (.5 + .5 * np.sin(2 * np.pi * 11 * t)) * .8
    lift = np.ones(n)
    for a, z in ((.73, .94), (1.44, 1.64)):
        lift -= .75 * np.exp(-((t - (a + z) / 2) / ((z - a) / 2.4)) ** 2)
    y = (voice * .55 + burble * .6) * lift
    for at in (.78, .83, .88, .93, 1.49, 1.54, 1.59, 1.65):   # exhaust pops on the lifts
        BA.place(y, lp(noise6(.05, int(at * 100) + 922), 1500) * expdecay(.05, .01), at, .45)
    y += lp(noise6(d, 923), 900) * .06   # tyres
    y *= np.exp(-t / 1.15) * np.minimum(1, t / .03) * ar(d, .001, .1)
    return norm6(_pan_st(y, .12 + .88 * (t / d) ** .8), .8)


def sfx_screech9():
    """Tyres squealing: noise through a bank of narrow band-passes, weighted to follow a wobbling, sagging centre frequency, with a thin whistle on top and a quick fade."""
    d = .9
    t = tarr(d)
    fc = 2900 + 420 * np.sin(2 * np.pi * 8.5 * t) + 330 * np.sin(2 * np.pi * 2.3 * t + 1) - 650 * t
    src = noise6(d, 931)
    centres = (1500, 2000, 2600, 3300, 4100, 5000)
    sq = sum(bp(src, c * .93, c * 1.07, 2) * np.exp(-(np.log(fc / c) / .2) ** 2) for c in centres)
    sq = sq / (np.max(np.abs(sq)) or 1)
    whistle = osc("sine", fc, d) * .3 + osc("sine", fc * 2.01, d) * .1
    env = np.interp(t, [0, .02, .5, .9], [0, 1, .85, 0]) * (1 + .25 * np.sin(2 * np.pi * 14 * t))
    return norm6((sq * .8 + whistle) * env, .75)


def sfx_stars9():
    """A five-star rating: five glockenspiel notes up a major pentatonic run (C D E G A), each a little louder, and a sparkle on the last one."""
    d = 1.0
    out = np.zeros(int(d * SR))
    r = rng6(941)
    for k, m in enumerate((84, 86, 88, 91, 93)):
        dd = .6
        f = midi(m)
        x = (osc("sine", f, dd) + .35 * osc("sine", f * 2.76, dd) * expdecay(dd, .12) + .18 * osc("sine", f * 5.4, dd) * expdecay(dd, .05)) * expdecay(dd, .2 + .03 * k) * ar(dd, .001, .08)
        BA.place(out, x, .02 + k * .1, .3 + .14 * k)
    BA.place(out, osc("sine", midi(105), .5) * expdecay(.5, .3) * ar(.5, .001, .1), .46, .3)
    for j in range(11):                                  # the sparkle: tiny glints, high up the same scale
        f = midi(96 + (0, 2, 4, 7, 9, 12)[j % 6])
        BA.place(out, osc("sine", f, .12) * expdecay(.12, .03) * ar(.12, .001, .04), .5 + j * .04 + r.uniform(0, .02), .16 * (1 - j / 14))
    return norm6(out, .75)


BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})
A6.DUCK_SFX.update({"cheer9", "engine9"})   # the cheer and the car both ring on into the next line; they duck under speech


def _lufs(path):
    """Integrated loudness of a wav in LUFS (ITU-R BS.1770, measured with the ffmpeg that imageio_ffmpeg ships)."""
    import re
    import subprocess

    import imageio_ffmpeg
    r = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    return float(re.findall(r"I:\s+(-?\d+\.?\d*) LUFS", r.stderr)[-1])


def trim_loudness(path, target=-14.7, lim=2.0):
    """This episode has long silent beats, so the Episode 6 mixer (which sets the dialogue level) lands about a decibel under the series' -14.8 LUFS: nudge the
    finished wav by the measured difference (at most +-lim dB) before the peak limiter. Written as 32-bit float so nothing clips ahead of the limiter."""
    import soundfile as sf
    g = float(np.clip(target - _lufs(path), -lim, lim))
    if abs(g) >= .05:
        x, sr = sf.read(path, dtype="float64")
        sf.write(path, x * 10 ** (g / 20), sr, subtype="FLOAT")
    return g


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep9.json"), ("--out", "build/ep9"), ("--var", "TIMELINE_EP9"), ("--music", "build_music9")):
        if k not in argv:
            argv += [k, v]
    sys.argv = [sys.argv[0]] + argv
    A6.main()
    out = argv[argv.index("--out") + 1]
    wav = os.path.join(A6.HERE, out, "audio.wav")
    print(f"loudness trim: {trim_loudness(wav):+.2f} dB")
    print(f"peak limiter: deepest gain dip {A7.peak_limit(wav):.2f} dB")
    import soundfile as sf
    if sf.info(wav).subtype != "PCM_16":   # the limiter only rewrites the file when something was over the ceiling
        x, sr = sf.read(wav, dtype="float64")
        sf.write(wav, np.clip(x, -1, 1), sr, subtype="PCM_16")


if __name__ == "__main__":
    main()
