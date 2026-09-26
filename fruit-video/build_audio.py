"""Build the voice track, sound effects, music bed and timeline for SHIFT HAPPENS.

Reads script.json, voices every line with Kokoro TTS, synthesizes all SFX and
music with numpy, mixes to build/audio.wav, and writes build/timeline.json,
which the animation (index.html) uses for scene timing, captions and lip sync.

Usage: python3 build_audio.py --model PATH/kokoro-v1.0.onnx --voices PATH/voices-v1.0.bin \
           [--script script_ep2.json --out build/ep2 --var TIMELINE_EP2]
"""
import argparse
import hashlib
import json
import os
import re

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
CACHE = os.path.join(HERE, "build", "tts_cache")
DEFAULT_GAP = 0.2

rng = np.random.default_rng(7)


# ---------------------------------------------------------------- dsp helpers
def tarr(d):
    return np.arange(int(d * SR)) / SR


def osc(kind, f, d):
    """Oscillator; f may be a scalar or an array (for sweeps)."""
    n = int(d * SR)
    f = np.broadcast_to(np.asarray(f, dtype=float), (n,))
    ph = np.cumsum(f) / SR
    if kind == "sine":
        return np.sin(2 * np.pi * ph)
    if kind == "saw":
        return 2 * (ph % 1.0) - 1
    if kind == "square":
        return np.sign(np.sin(2 * np.pi * ph))
    if kind == "tri":
        return 2 * np.abs(2 * (ph % 1.0) - 1) - 1
    raise ValueError(kind)


def noise(d):
    return rng.uniform(-1, 1, int(d * SR))


def expdecay(d, tau):
    return np.exp(-tarr(d) / tau)


def ar(d, a, r):
    """Attack / release envelope over d seconds."""
    n = int(d * SR)
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


def place(buf, clip, at, gain=1.0):
    i = int(round(at * SR))
    if i < 0:
        clip, i = clip[-i:], 0
    j = min(len(buf), i + len(clip))
    if j > i:
        buf[i:j] += clip[: j - i] * gain


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# ---------------------------------------------------------------- sfx library
def sfx_whoosh():
    d = 0.45
    e = np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 2
    return norm(bp(noise(d), 400, 3500) * e, 0.6)


def sfx_zip():
    d = 0.35
    f = np.linspace(300, 2200, int(d * SR))
    e = ar(d, 0.02, 0.2)
    return norm(0.5 * osc("sine", f, d) * e + bp(noise(d), 1500, 6000) * e * 0.8, 0.7)


def chime(f, d=0.7):
    x = osc("sine", f, d) + 0.3 * osc("sine", 2.01 * f, d) + 0.1 * osc("sine", 3.02 * f, d)
    return x * expdecay(d, 0.22) * ar(d, 0.003, 0.05)


def sfx_ding1():
    out = np.zeros(int(1.1 * SR))
    place(out, chime(midi(88)), 0)
    place(out, chime(midi(84), 0.9), 0.3)
    return norm(out, 0.7)


def sfx_callbells():
    out = np.zeros(int(2.0 * SR))
    for k in range(14):
        t = k * 0.075 + rng.uniform(0, 0.03)
        place(out, chime(midi(84 + [0, 4, 7, 12, 4, 7][k % 6] + rng.uniform(-0.2, 0.2)), 0.6), t, 0.55)
    return norm(out, 0.8)


def sfx_alarm():
    out = np.zeros(int(3.4 * SR))
    for rep in range(3):
        for k in range(3):
            b = osc("square", midi(83), 0.1) * ar(0.1, 0.005, 0.02)
            place(out, lp(b, 3000), rep * 1.1 + k * 0.17)
    return norm(out, 0.5)


def sfx_thud():
    d = 0.45
    f = np.linspace(95, 38, int(d * SR))
    x = osc("sine", f, d) * expdecay(d, 0.12) + 0.6 * lp(noise(d), 300) * expdecay(d, 0.05)
    return norm(x, 0.95)


def sfx_stamp():
    d = 0.3
    x = osc("sine", np.linspace(160, 60, int(d * SR)), d) * expdecay(d, 0.06)
    x += 0.8 * bp(noise(d), 800, 5000) * expdecay(d, 0.02)
    return norm(x, 0.9)


def brass_chord(notes, d, cutoff=1400):
    x = np.zeros(int(d * SR))
    for n in notes:
        for det in (-0.08, 0.0, 0.08):
            x += osc("saw", midi(n + det), d)
    x = lp(x, cutoff, 2)
    return x * ar(d, 0.015, 0.12)


def sfx_sting():
    out = np.zeros(int(2.4 * SR))
    place(out, brass_chord([38, 45, 50, 53], 0.22), 0.0)
    place(out, brass_chord([38, 45, 50, 53], 0.22), 0.3)
    long = brass_chord([37, 44, 49, 52], 1.7, 1100)
    long *= 1 + 0.25 * np.sin(2 * np.pi * 6 * tarr(1.7))
    place(out, long, 0.62)
    for t in (0.0, 0.3, 0.62):
        place(out, sfx_thud() * 0.6, t)
    return norm(out, 0.9)


def sfx_drone():
    d = 2.6
    x = osc("saw", 55, d) + osc("saw", 55.7, d) + 0.5 * osc("saw", 82.4, d)
    x = lp(x, 380) * (0.7 + 0.3 * np.sin(2 * np.pi * 3.5 * tarr(d)))
    return norm(x * ar(d, 0.6, 0.6), 0.6)


def sfx_boom():
    d = 1.6
    x = osc("sine", np.linspace(90, 32, int(d * SR)), d) * expdecay(d, 0.45)
    x += 0.5 * lp(noise(d), 200) * expdecay(d, 0.3)
    return norm(x, 0.95)


def sfx_scramble():
    out = np.zeros(int(1.6 * SR))
    for k in range(34):
        t = rng.uniform(0, 1.4)
        c = bp(noise(0.03), 2500, 7000) * expdecay(0.03, 0.006)
        place(out, c, t, rng.uniform(0.4, 1.0))
    for k in range(10):
        place(out, osc("sine", midi(rng.integers(79, 91)), 0.06) * expdecay(0.06, 0.02), rng.uniform(0, 1.4), 0.3)
    return norm(out, 0.7)


def sfx_tick():
    out = np.zeros(int(1.4 * SR))
    for k in range(12):
        c = hp(noise(0.012), 3000) * expdecay(0.012, 0.003)
        place(out, c, k * 0.1)
    return norm(out, 0.6)


def sfx_shrivel():
    d = 0.9
    f = np.linspace(900, 140, int(d * SR)) * (1 + 0.08 * np.sin(2 * np.pi * 18 * tarr(d)))
    x = osc("sine", f, d) * ar(d, 0.02, 0.2) * 0.6
    x += bp(noise(d), 1500, 5000) * (rng.random(int(d * SR)) > 0.985) * 1.2
    return norm(x, 0.7)


def sfx_slide():
    d = 0.5
    f = np.concatenate([np.linspace(420, 1500, int(0.35 * SR)), np.linspace(1500, 1300, int(0.15 * SR))])
    x = (osc("sine", f, d) + 0.15 * osc("sine", 2 * f, d)) * ar(d, 0.02, 0.1)
    return norm(x, 0.6)


def sfx_bedalarm():
    out = np.zeros(int(3.2 * SR))
    for k in range(14):
        f = 2350 if k % 2 == 0 else 1760
        b = lp(osc("square", f, 0.11), 4000) * ar(0.11, 0.005, 0.02)
        place(out, b, k * 0.22)
    return norm(out, 0.45)


def sfx_paper():
    out = np.zeros(int(1.6 * SR))
    for k, t in enumerate([0.0, 0.12, 0.22, 0.3, 0.36]):
        place(out, sfx_stamp(), t, 1.0 - k * 0.12)
    place(out, bp(noise(0.9), 1500, 6000) * expdecay(0.9, 0.25) * 0.3, 0.05)
    return norm(out, 0.9)


def phone_band(x):
    return bp(x, 320, 3300, 3)


def sfx_ringback():
    out = np.zeros(int(2.4 * SR))
    for t in (0.0, 1.35):
        r = osc("sine", 440, 1.0) + osc("sine", 480, 1.0)
        place(out, r * ar(1.0, 0.01, 0.02), t)
    return norm(phone_band(out), 0.5)


def sfx_vmbeep():
    return norm(osc("sine", 1000, 0.4) * ar(0.4, 0.005, 0.02), 0.5)


def sfx_stomps():
    out = np.zeros(int(1.0 * SR))
    for t in (0.0, 0.26, 0.52):
        place(out, sfx_thud(), t, 0.8)
    return norm(out, 0.9)


def sfx_siren():
    d = 1.1
    f = 950 + 350 * np.sin(2 * np.pi * 2.2 * tarr(d))
    x = lp(osc("saw", f, d), 2500) * ar(d, 0.05, 0.3)
    return norm(x, 0.5)


def sfx_wheels():
    d = 1.4
    x = lp(noise(d), 600) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 14 * tarr(d))))
    x += 0.4 * bp(noise(d), 2000, 5000) * (rng.random(int(d * SR)) > 0.992)
    return norm(x * ar(d, 0.1, 0.3), 0.6)


def sfx_scratch():
    d = 0.38
    f = np.concatenate([np.linspace(900, 180, int(0.2 * SR)), np.linspace(180, 700, int(0.18 * SR))])
    x = bp(noise(d), 800, 4000) * ar(d, 0.005, 0.08) + 0.5 * osc("saw", f, d) * ar(d, 0.005, 0.08)
    return norm(lp(x, 5000), 0.8)


def sfx_ringing():
    d = 1.8
    return norm(osc("sine", 4200, d) * ar(d, 0.15, 0.8), 0.25)


def voice_ah(f0, d):
    t = tarr(d)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t)
    x = np.zeros(len(t))
    for k in range(1, 28):
        fk = k * f0
        if fk > 5000:
            break
        g = (np.exp(-((fk - 750) / 180) ** 2) + 0.6 * np.exp(-((fk - 1150) / 200) ** 2)
             + 0.25 * np.exp(-((fk - 2600) / 300) ** 2) + 0.02) / k ** 0.5
        x += g * np.sin(2 * np.pi * np.cumsum(np.full(len(t), fk) * vib) / SR)
    return x


def sfx_choir():
    d = 2.6
    x = np.zeros(int(d * SR))
    for n in (60, 64, 67, 72, 76):
        for det in (-0.12, 0.0, 0.12):
            x += voice_ah(midi(n + det), d)
    return norm(x * ar(d, 0.5, 0.4), 0.7)


def sfx_squelch():
    out = np.zeros(int(1.2 * SR))
    for k in range(4):
        d = 0.22
        f = np.linspace(420 - k * 60, 90, int(d * SR))
        place(out, osc("sine", f, d) * ar(d, 0.01, 0.08), k * 0.2, 0.8)
    place(out, lp(noise(1.0), 500) * ar(1.0, 0.05, 0.5) * 0.6, 0.0)
    return norm(out, 0.8)


def sfx_trombone():
    notes = [(55, 0.42), (54, 0.42), (53, 0.42), (52, 1.5)]
    out = np.zeros(int(3.0 * SR))
    t0 = 0.0
    for i, (n, d) in enumerate(notes):
        tt = tarr(d)
        f = midi(n) * (1 + (0.012 * np.sin(2 * np.pi * 5.5 * tt) * np.clip(tt / 0.3, 0, 1) if i == 3 else 0))
        x = osc("saw", f, d) + 0.5 * osc("saw", f * 1.003, d)
        cut = 500 + 1600 * np.clip(np.sin(np.pi * np.minimum(tt / 0.35, 1)), 0, 1)
        # time-varying "wah": crossfade two lowpass versions
        lo, hi = lp(x, 500), lp(x, 2100)
        mix = (cut - 500) / 1600
        x = lo * (1 - mix) + hi * mix
        place(out, x * ar(d, 0.04, 0.1), t0)
        t0 += d
    return norm(out, 0.7)


def sfx_ringtone():
    out = np.zeros(int(2.0 * SR))
    pattern = [76, 83, 88, 83, 76, 83, 88, 91]
    for rep in range(2):
        for k, n in enumerate(pattern):
            d = 0.3
            x = (osc("sine", midi(n), d) + 0.35 * osc("sine", midi(n) * 4, d) * expdecay(d, 0.02)) * expdecay(d, 0.12)
            place(out, x, rep * 0.95 + k * 0.11)
    return norm(out, 0.6)


def sfx_theme():
    """Short bouncy fanfare for the title and end card."""
    bpm = 132
    b = 60 / bpm
    out = np.zeros(int(3.2 * SR))
    lead = [(67, 0, 0.5), (72, 0.5, 0.5), (76, 1.0, 0.5), (79, 1.5, 0.75), (76, 2.5, 0.5), (79, 3.0, 0.5), (84, 3.5, 2.0)]
    for n, s, dd in lead:
        d = dd * b
        x = osc("square", midi(n), d) * 0.5 + osc("saw", midi(n) * 1.004, d) * 0.5
        place(out, lp(x, 3200) * ar(d, 0.01, 0.06) * 0.5, s * b)
    chords = [([48, 55, 60, 64], 0, 1.0), ([53, 57, 60, 65], 1.0, 1.0), ([55, 59, 62, 67], 2.0, 1.5), ([48, 55, 60, 64, 72], 3.5, 2.0)]
    for notes, s, dd in chords:
        place(out, brass_chord(notes, dd * b, 1800) * 0.35, s * b)
    for s in np.arange(0, 3.5, 0.5):
        place(out, osc("sine", np.linspace(120, 45, int(0.18 * SR)), 0.18) * expdecay(0.18, 0.05), s * b, 0.6)
    crash = hp(noise(1.6), 4000) * expdecay(1.6, 0.4)
    place(out, crash * 0.35, 3.5 * b)
    return norm(out, 0.85)


def sfx_rewind():
    d = 0.7
    t = tarr(d)
    f = 500 + 1900 * t / d + 260 * np.sin(2 * np.pi * 31 * t)
    x = lp(osc("saw", f, d), 5000) * 0.35 + bp(noise(d), 2000, 7000) * 0.5
    return norm(x * ar(d, 0.03, 0.12), 0.6)


def sfx_static():
    d = 0.2
    return norm(bp(noise(d), 900, 6500) * expdecay(d, 0.07), 0.55)


def sfx_car():
    d = 2.0
    t = tarr(d)
    f = 48 + 8 * np.sin(2 * np.pi * 3 * t) + 10 * np.clip(1 - t, 0, 1)
    x = lp(osc("saw", f, d) + 0.6 * osc("square", f * 0.5, d), 420) + 0.5 * lp(noise(d), 300)
    return norm(x * ar(d, 0.5, 0.6), 0.7)


def sfx_squeal():
    d = 0.55
    t = tarr(d)
    x = osc("sine", 1750 + 90 * np.sin(2 * np.pi * 23 * t), d) * 0.5 + bp(noise(d), 1400, 3200) * 0.6
    return norm(x * ar(d, 0.02, 0.25), 0.5)


def sfx_doorclose():
    out = np.zeros(int(0.6 * SR))
    place(out, sfx_thud(), 0.0, 0.9)
    place(out, hp(noise(0.03), 3000) * expdecay(0.03, 0.008), 0.06, 0.6)
    return norm(out, 0.85)


def sfx_rattle():
    out = np.zeros(int(0.9 * SR))
    for k in range(9):
        f = rng.uniform(2300, 3600)
        place(out, osc("sine", f, 0.12) * expdecay(0.12, 0.025), k * 0.085 + rng.uniform(0, 0.02), rng.uniform(0.4, 0.9))
    return norm(out, 0.55)


def sfx_pop():
    d = 0.16
    x = osc("sine", np.linspace(900, 160, int(d * SR)), d) * expdecay(d, 0.03) + 0.7 * bp(noise(d), 400, 3000) * expdecay(d, 0.012)
    return norm(x, 0.85)


def sfx_boing():
    d = 0.6
    t = tarr(d)
    f = 180 + 220 * (1 - np.exp(-t * 9)) + 60 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 3)
    return norm(osc("sine", f, d) * ar(d, 0.01, 0.3), 0.55)


def sfx_pachime():
    out = np.zeros(int(1.6 * SR))
    for k, n in enumerate([67, 76, 72]):
        place(out, chime(midi(n), 0.9), k * 0.32, 0.8)
    return norm(out, 0.6)


def sfx_klaxon():
    out = np.zeros(int(1.4 * SR))
    for k in range(2):
        d = 0.55
        f = np.linspace(280, 560, int(d * SR))
        x = lp(osc("square", f, d) + 0.5 * osc("saw", f * 1.01, d), 2200) * ar(d, 0.02, 0.1)
        place(out, x, k * 0.65)
    return norm(out, 0.55)


def sfx_fridge():
    out = np.zeros(int(1.0 * SR))
    place(out, lp(noise(0.12), 700) * expdecay(0.12, 0.04), 0.0, 1.0)
    hum = (osc("sine", 60, 0.9) + 0.4 * osc("sine", 120, 0.9)) * ar(0.9, 0.2, 0.3)
    place(out, hum, 0.08, 0.35)
    return norm(out, 0.6)


def sfx_slam():
    out = np.zeros(int(0.6 * SR))
    place(out, sfx_thud(), 0.0, 1.0)
    place(out, lp(noise(0.25), 1500) * expdecay(0.25, 0.05), 0.0, 0.7)
    return norm(out, 0.95)


def sfx_fanfare():
    out = np.zeros(int(1.3 * SR))
    for k, n in enumerate([67, 72, 76]):
        place(out, brass_chord([n, n - 12], 0.13, 2600), k * 0.13, 0.7)
    place(out, brass_chord([60, 67, 72, 76, 79], 0.75, 2400), 0.4, 0.9)
    return norm(out, 0.75)


def sfx_whooshes():
    out = np.zeros(int(1.3 * SR))
    for k in range(5):
        d = 0.28
        e = np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 2
        place(out, bp(noise(d), 700 + k * 150, 5000) * e, k * 0.17, 0.6)
    return norm(out, 0.55)


def sfx_flips():
    out = np.zeros(int(0.6 * SR))
    for k in range(3):
        place(out, bp(noise(0.05), 1800, 4500) * expdecay(0.05, 0.01), k * 0.13, 0.9)
    return norm(out, 0.6)


def sfx_pumps():
    out = np.zeros(int(1.4 * SR))
    t, gap = 0.0, 0.2
    for k in range(10):
        squish = lp(noise(0.08), 1200) * expdecay(0.08, 0.025) + 0.3 * osc("sine", np.linspace(500, 250, int(0.08 * SR)), 0.08) * expdecay(0.08, 0.03)
        place(out, squish, t, 0.8)
        t += gap
        gap = max(0.07, gap * 0.82)
    return norm(out, 0.6)


def sfx_scribble():
    d = 0.7
    t = tarr(d)
    x = bp(noise(d), 2500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 17 * t)))
    return norm(x * ar(d, 0.02, 0.1), 0.35)


def sfx_stab():
    out = np.zeros(int(1.2 * SR))
    place(out, brass_chord([43, 50, 55, 58, 62], 0.5, 1800), 0.0, 1.0)
    place(out, sfx_boom(), 0.0, 0.7)
    return norm(out, 0.9)


def sfx_wobble():
    d = 0.9
    t = tarr(d)
    return norm(osc("sine", 300 * (1 + 0.35 * np.sin(2 * np.pi * 7 * t)), d) * ar(d, 0.03, 0.3), 0.4)


def sfx_slowwhoosh():
    d = 1.6
    e = np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 1.5
    return norm(bp(noise(d), 150, 1200) * e, 0.6)


def sfx_poofs():
    out = np.zeros(int(1.6 * SR))
    for k in range(5):
        d = 0.22
        x = lp(noise(d), 1800) * ar(d, 0.005, 0.15) + 0.4 * osc("sine", np.linspace(300, 700, int(d * SR)), d) * expdecay(d, 0.05)
        place(out, x, k * 0.24, 0.8)
    return norm(out, 0.6)


def sfx_bell():
    out = np.zeros(int(1.4 * SR))
    for k in range(3):
        f = midi(93)
        x = sum(osc("sine", f * m, 0.9) * g for m, g in ((1, 1), (2.76, 0.4), (5.4, 0.2))) * expdecay(0.9, 0.25)
        place(out, x, k * 0.14, 0.7)
    return norm(out, 0.6)


def sleigh_hit(d=0.12):
    x = np.zeros(int(d * SR))
    for f in (2900, 4100, 5300, 6700, 7900):
        x += osc("sine", f * rng.uniform(0.97, 1.03), d) * rng.uniform(0.3, 1.0)
    return x * expdecay(d, 0.03) + 0.6 * bp(noise(d), 5000, 11000) * expdecay(d, 0.02)


def sleigh_pattern(d, step):
    out = np.zeros(int(d * SR))
    for k, t in enumerate(np.arange(0, d - 0.15, step)):
        place(out, sleigh_hit(), t + rng.uniform(0, 0.01), 0.55 + 0.45 * (k % 2 == 0))
    return out


def sfx_sleighbells():
    out = sleigh_pattern(1.8, 0.1)
    for k in range(18):  # shake-off at the end
        place(out, sleigh_hit(0.06), 1.4 + rng.uniform(0, 0.3), 0.35)
    return norm(out, 0.55)


def sfx_theme3():
    """The title fanfare with sleigh bells on it."""
    out = sfx_theme()
    bells = sleigh_pattern(len(out) / SR, 60 / 132 / 2)
    return norm(out + 0.35 * norm(bells, 1.0), 0.85)


def sfx_fight():
    d = 1.9
    out = lp(noise(d), 180) * ar(d, 0.15, 0.4) * 0.6
    for k in range(14):
        place(out, sfx_thud(), rng.uniform(0.0, 1.6), rng.uniform(0.3, 0.6))
    for k in range(7):
        place(out, sfx_pop(), rng.uniform(0.1, 1.6), rng.uniform(0.3, 0.6))
    for t in (0.35, 0.9, 1.4):
        place(out, sfx_boing(), t, 0.4)
    place(out, sfx_scramble(), 0.1, 0.4)
    return norm(out, 0.85)


def sfx_creak():
    d = 0.9
    t = tarr(d)
    f = 150 - 40 * t / d + 25 * lp(noise(d), 12) * 8
    x = osc("saw", f, d) * (0.6 + 0.4 * np.abs(lp(noise(d), 30) * 6).clip(0, 1))
    return norm(bp(x, 500, 3200) * ar(d, 0.08, 0.2), 0.45)


def sfx_chair():
    out = np.zeros(int(0.6 * SR))
    for k in range(3):
        d = 0.12
        tt = tarr(d)
        f = np.linspace(1100, 1450, len(tt)) * (1 + 0.02 * np.sin(2 * np.pi * 40 * tt))
        place(out, osc("sine", f, d) * ar(d, 0.01, 0.05), k * 0.15, 0.8 - k * 0.15)
    return norm(out, 0.35)


def sfx_paperslide():
    d = 0.6
    e = np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 2
    out = np.zeros(int(0.8 * SR))
    place(out, bp(noise(d), 1200, 6000) * e, 0.0)
    place(out, lp(noise(0.05), 900) * expdecay(0.05, 0.015), 0.58, 0.8)
    return norm(out, 0.5)


def sfx_drumroll():
    out = np.zeros(int(2.2 * SR))
    n = int(1.2 * 28)
    for k in range(n):
        hit = bp(noise(0.03), 1500, 6000) * expdecay(0.03, 0.01)
        place(out, hit, k / 28 + rng.uniform(0, 0.004), 0.3 + 0.7 * k / n)
    place(out, hp(noise(0.9), 4000) * expdecay(0.9, 0.3), 1.22, 0.9)
    place(out, sfx_thud(), 1.22, 0.7)
    return norm(out, 0.7)


def sfx_shutter():
    out = np.zeros(int(0.7 * SR))
    place(out, hp(noise(0.012), 2500) * expdecay(0.012, 0.003), 0.0, 1.0)
    place(out, hp(noise(0.02), 1500) * expdecay(0.02, 0.006), 0.07, 0.8)
    d = 0.35
    place(out, osc("sine", np.linspace(3000, 7000, int(d * SR)), d) * ar(d, 0.05, 0.1), 0.12, 0.12)
    return norm(out, 0.7)


def sfx_partyhorn():
    d = 0.9
    t = tarr(d)
    f = 420 * (1 - 0.28 * (t / d) ** 2)
    x = osc("saw", f, d) * (0.65 + 0.35 * np.sign(np.sin(2 * np.pi * 38 * t)))
    x = lp(x, 3500) * ar(d, 0.02, 0.25)
    x[: int(0.3 * SR)] += bp(noise(0.3), 3000, 8000) * (rng.random(int(0.3 * SR)) > 0.97) * 0.8
    return norm(x, 0.6)


def sfx_textding():
    out = np.zeros(int(0.6 * SR))
    for k, n in enumerate((86, 93)):
        d = 0.3
        x = (osc("sine", midi(n), d) + 0.25 * osc("sine", midi(n) * 3, d) * expdecay(d, 0.03)) * expdecay(d, 0.09)
        place(out, x * ar(d, 0.003, 0.05), k * 0.09)
    return norm(out, 0.55)


def sfx_flipcal():
    out = np.zeros(int(1.2 * SR))
    t = 0.0
    for k in range(12):
        place(out, bp(noise(0.04), 1800, 5000) * expdecay(0.04, 0.012), t, 0.9)
        t += 0.1 * 0.85 ** k + 0.02
    place(out, lp(noise(0.08), 900) * expdecay(0.08, 0.02), t + 0.05, 0.9)
    return norm(out, 0.6)


def music_box(notes, bpm):
    """notes: (midi, start_beat, len_beats); a plucked music-box timbre."""
    b = 60 / bpm
    end = max(s + l for _, s, l in notes) * b + 1.0
    out = np.zeros(int(end * SR))
    for n, s, l in notes:
        d = max(0.5, l * b + 0.4)
        f = midi(n)
        x = osc("sine", f, d) + 0.3 * osc("sine", f * 4.2, d) * expdecay(d, 0.05) + 0.15 * osc("sine", f * 2, d)
        place(out, x * expdecay(d, 0.35) * ar(d, 0.002, 0.08), s * b)
    return out


def sfx_auld():
    """'Auld Lang Syne' (traditional, public domain), first phrase, on a music box."""
    m = [(72, 0, 1), (77, 1, 1.5), (77, 2.5, 0.5), (77, 3, 1), (81, 4, 1), (79, 5, 1.5), (77, 6.5, 0.5), (79, 7, 1), (81, 8, 1)]
    bass = [(53, 1, 3), (48, 5, 3)]
    out = music_box(m, 120)
    b = music_box([(n, s, l) for n, s, l in bass], 120)
    out[: len(b)] += 0.5 * b[: len(out)]
    return norm(out, 0.55)


def sfx_birds():
    out = np.zeros(int(1.8 * SR))
    for k in range(11):
        d = rng.uniform(0.05, 0.09)
        tt = tarr(d)
        f0 = rng.uniform(2600, 3600)
        f = f0 + rng.uniform(600, 1400) * tt / d + 180 * np.sin(2 * np.pi * 45 * tt)
        place(out, osc("sine", f, d) * ar(d, 0.005, 0.02), rng.uniform(0, 1.5) if k > 2 else k * 0.12, rng.uniform(0.4, 0.9))
    return norm(out, 0.4)


def sfx_harp():
    """Dream-sequence glissando up a C major scale."""
    notes = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84]
    out = np.zeros(int(2.2 * SR))
    for k, n in enumerate(notes):
        place(out, pluck(midi(n), 1.2) * 0.6, k * 0.055)
        place(out, pluck(midi(n) * 2, 0.6) * 0.15, k * 0.055)
    return norm(out, 0.6)


def sfx_sparkle():
    out = np.zeros(int(1.0 * SR))
    for k in range(9):
        f = rng.uniform(2400, 5200)
        d = 0.35
        place(out, osc("sine", f, d) * expdecay(d, 0.08) * ar(d, 0.002, 0.05), k * 0.06 + rng.uniform(0, 0.03), rng.uniform(0.4, 1.0))
    return norm(out, 0.45)


def sfx_timelapse():
    """A clock ticking faster and faster (hours passing in seconds)."""
    out = np.zeros(int(6.4 * SR))
    t, gap = 0.0, 0.28
    while t < 5.6:
        c = hp(noise(0.012), 3000) * expdecay(0.012, 0.003)
        place(out, c, t, 0.9)
        t += gap
        gap = max(0.035, gap * 0.93)
    d = 5.6
    place(out, bp(noise(d), 300, 3000) * np.linspace(0, 1, int(d * SR)) ** 2 * 0.25, 0.0)
    return norm(out, 0.6)


def sfx_hangup():
    out = np.zeros(int(1.0 * SR))
    place(out, lp(noise(0.03), 1500) * expdecay(0.03, 0.008), 0.0, 1.0)
    d = 0.8
    tone = (osc("sine", 350, d) + osc("sine", 440, d)) * ar(d, 0.02, 0.1)
    place(out, phone_band(tone) * 0.5, 0.15)
    return norm(out, 0.55)


SFX = {k[4:]: v for k, v in globals().items() if k.startswith("sfx_")}


# ---------------------------------------------------------------- scene beds (replace the music bed in one scene)
def pluck(f, d):
    t = tarr(d)
    x = sum(np.sin(2 * np.pi * k * f * t) * np.exp(-t * (18 + 7 * k)) / k for k in range(1, 7))
    return x * ar(d, 0.002, 0.02)


def bed_mob(duration):
    """Mandolin tremolo over a slow accordion minor progression: the staffing office underscore."""
    bar = 2.4
    chords = [(57, [45, 52, 57, 60, 64]), (62, [50, 57, 62, 65, 69]), (56, [52, 56, 59, 62, 64]), (57, [45, 52, 57, 60, 64])]
    tops = [76, 77, 71, 69]
    out = np.zeros(int(duration * SR) + SR)
    t, i = 0.0, 0
    while t < duration:
        root, notes = chords[i % 4]
        top = tops[i % 4]
        pad = sum(osc("saw", midi(n) * (1 + det), bar) for n in notes[:3] for det in (-0.003, 0.003))
        place(out, lp(pad, 900) * ar(bar, 0.4, 0.4) * 0.05, t)
        for k in range(int(bar * 12)):
            place(out, pluck(midi(top), 0.12) * 0.25 + pluck(midi(top - 12), 0.12) * 0.1, t + k / 12)
        t += bar
        i += 1
    out = out[: int(duration * SR)]
    return norm(out * ar(duration, 0.6, 0.8), 0.5)


def bed_dreamy(duration):
    """Soft harp arpeggios over a pastel pad: the NCLEX Land underscore."""
    chords = [[60, 64, 67, 71], [53, 57, 60, 64]]  # Cmaj7, Fmaj7
    bar = 2.0
    out = np.zeros(int(duration * SR) + SR)
    t, i = 0.0, 0
    while t < duration:
        notes = chords[i % 2]
        pad = sum(osc("sine", midi(n) * (1 + det), bar) for n in notes for det in (-0.002, 0.002))
        place(out, pad * ar(bar, 0.6, 0.6) * 0.05, t)
        arp = notes + [notes[0] + 12, notes[2] + 12, notes[1] + 12, notes[3]]
        for k, n in enumerate(arp):
            place(out, pluck(midi(n + 12), 0.8) * 0.2, t + k * bar / len(arp))
        t += bar
        i += 1
    out = out[: int(duration * SR)]
    return norm(out * ar(duration, 0.4, 0.5), 0.5)


BEDS = {k[4:]: v for k, v in globals().items() if k.startswith("bed_")}


# ---------------------------------------------------------------- music bed
def music_bed(duration, bells=False):
    bpm = 116
    beat = 60 / bpm
    out = np.zeros(int(duration * SR) + SR)
    prog = [48, 45, 41, 43]  # C  Am  F  G
    qual = {48: [0, 4, 7], 45: [0, 3, 7], 41: [0, 4, 7], 43: [0, 4, 7]}
    t, bar = 0.0, 0
    while t < duration:
        root = prog[bar % 4]
        # bass: root, root, octave bounce
        for s, n in ((0, root), (1.5, root + 12), (2, root), (3.5, root + 7)):
            d = 0.28
            x = osc("tri", midi(n - 12), d) + 0.4 * osc("sine", midi(n), d)
            place(out, x * expdecay(d, 0.09) * ar(d, 0.004, 0.03) * 0.55, t + s * beat)
        # offbeat staccato chords
        for s in (1, 3):
            d = 0.16
            x = sum(osc("sine", midi(root + 12 + iv), d) + 0.3 * osc("sine", 2 * midi(root + 12 + iv), d) for iv in qual[root])
            place(out, x * expdecay(d, 0.05) * 0.16, t + s * beat)
        # kick / snap / hat
        for s in (0, 2):
            place(out, osc("sine", np.linspace(110, 45, int(0.15 * SR)), 0.15) * expdecay(0.15, 0.04), t + s * beat, 0.5)
        for s in (1, 3):
            place(out, bp(noise(0.08), 1200, 5000) * expdecay(0.08, 0.02), t + s * beat, 0.22)
        for s in np.arange(0, 4, 0.5):
            place(out, hp(noise(0.03), 7000) * expdecay(0.03, 0.008), t + s * beat, 0.12)
        # little glockenspiel hook every 4 bars
        if bar % 4 == 3:
            for k, n in enumerate([84, 88, 91, 88]):
                d = 0.25
                x = osc("sine", midi(n), d) * expdecay(d, 0.1) + 0.2 * osc("sine", midi(n) * 2.76, d) * expdecay(d, 0.03)
                place(out, x * 0.12, t + (2 + k * 0.5) * beat)
        if bells:  # holiday episodes: sleigh bells on the eighths
            for s in np.arange(0, 4, 0.5):
                place(out, sleigh_hit(0.08), t + s * beat, 0.05 if s % 1 else 0.08)
        t += 4 * beat
        bar += 1
    return out[: int(duration * SR)]


# ---------------------------------------------------------------- tts
def semis_resample(x, semis):
    """Varispeed pitch shift (duration scales too) -- chipmunk / slowed villain."""
    if not semis:
        return x
    ratio = 2 ** (semis / 12)
    n = int(len(x) / ratio)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)


def tts(kokoro, v, say):
    key = hashlib.sha1(json.dumps([v["voice"], v["lang"], v["speed"], v.get("semis", 0), v.get("fx"), say]
                                  + ([v["chorus"]] if v.get("chorus") else [])).encode()).hexdigest()[:16]
    path = os.path.join(CACHE, key + ".wav")
    if os.path.exists(path):
        x, _ = sf.read(path)
        return x
    parts = []
    for i, name in enumerate(v.get("chorus") or [v["voice"]]):
        detune = 1 + 0.03 * (i % 3 - 1) if v.get("chorus") else 1
        samples, sr = kokoro.create(say, voice=name, speed=v["speed"] * detune, lang=v["lang"])
        parts.append(signal.resample_poly(np.asarray(samples, dtype=float), SR // 1000, sr // 1000))
    x = np.zeros(max(len(p) for p in parts))
    for p in parts:
        x[:len(p)] += p / np.max(np.abs(p))
    x = semis_resample(x, v.get("semis", 0))
    # trim silence
    a = np.abs(x)
    idx = np.where(a > 0.01 * a.max())[0]
    x = x[max(0, idx[0] - 800): idx[-1] + 2400]
    if v.get("fx") == "phone":
        x = np.tanh(phone_band(x) * 3.0) * 0.6
    elif v.get("fx") == "muffled":
        x = lp(x, 900, 4)
    x = norm(x, 0.85)
    sf.write(path, x, SR)
    return x


def mouth_env(x):
    hop = SR // FPS
    n = int(np.ceil(len(x) / hop))
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    ref = np.percentile(rms, 90) or 1.0
    m = np.clip(rms / ref, 0, 1) ** 0.7
    m[m < 0.12] = 0
    return "".join(str(int(round(v * 9))) for v in m)


def word_times(text, dur):
    words = text.split()
    w = []
    for word in words:
        k = len(re.sub(r"[^\w]", "", word)) + 2
        if re.search(r"(\.\.\.|[,.!?:])[\"']?$", word):
            k += 4
        w.append(k)
    tot = sum(w)
    out, t = [], 0.0
    for word, k in zip(words, w):
        d = dur * k / tot
        out.append([word, round(t, 3), round(t + d, 3)])
        t += d
    return out


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    ap.add_argument("--script", default="script.json")
    ap.add_argument("--out", default="build")
    ap.add_argument("--var", default="TIMELINE")
    args = ap.parse_args()
    global BUILD
    BUILD = os.path.join(HERE, args.out)
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(BUILD, exist_ok=True)

    from kokoro_onnx import Kokoro
    kokoro = Kokoro(args.model, args.voices)

    script = json.load(open(os.path.join(HERE, args.script)))
    voices = script["voices"]
    ref = script.get("clips_from")  # earlier episode used for "previously on" clips
    if ref:
        ref_tl = json.load(open(os.path.join(HERE, ref["timeline"])))
        ref_audio, _ = sf.read(os.path.join(HERE, ref["audio"]))
        ref_audio = ref_audio.mean(axis=1) if ref_audio.ndim > 1 else ref_audio

    scenes_out, lines_out, cues = [], [], []
    voice_clips = []
    T = 0.0
    for sc in script["scenes"]:
        cursor = sc.get("head", 0.2)
        beats = {}
        for b in sc["beats"]:
            gap = b.get("gap", DEFAULT_GAP)
            src = None
            if "pause" in b:
                s, e = cursor, cursor + b["pause"]
                gap = b.get("gap", 0.0)
            elif "clip" in b:
                c = b["clip"]
                ln = next(l for l in ref_tl["lines"] if l["scene"] == c["scene"] and l["id"] == c["line"])
                w0 = c.get("from_word", 0)
                a0, a1 = ln["s"] + ln["words"][w0][1] - c.get("pad_before", 0.0), ln["e"] + c.get("pad_after", 0.0)
                seg_ = ref_audio[int(a0 * SR):int(a1 * SR)].copy()
                seg_ *= ar(len(seg_) / SR, 0.03, min(0.35, c.get("pad_after", 0.0) + 0.05))
                tail_at = int((ln["e"] - a0) * SR)
                seg_[tail_at:] *= 0.55  # the stings/trombone after the line sit under the dialogue level
                seg_ = bp(seg_, 140, 6000) + 0.004 * noise(len(seg_) / SR)  # worn-tape flashback
                s, e = cursor, cursor + len(seg_) / SR
                src = a0
                voice_clips.append((T + s, seg_))
                off = ln["s"] + ln["words"][w0][1] - a0
                lines_out.append({
                    "scene": sc["id"], "id": b["id"], "who": "clip:" + ln["who"], "name": ln["name"], "color": ln["color"],
                    "s": round(T + s + off, 3), "e": round(T + s + off + ln["e"] - ln["s"] - ln["words"][w0][1], 3),
                    "text": " ".join(w[0] for w in ln["words"][w0:]),
                    "words": [[w[0], round(w[1] - ln["words"][w0][1], 3), round(w[2] - ln["words"][w0][1], 3)] for w in ln["words"][w0:]],
                    "mouth": ln["mouth"],
                })
            else:
                v = voices[b["who"]]
                clip = tts(kokoro, v, b["say"])
                s, e = cursor, cursor + len(clip) / SR
                voice_clips.append((T + s, clip))
                lines_out.append({
                    "scene": sc["id"], "id": b["id"], "who": b["who"], "name": v["name"], "color": v["color"],
                    "s": round(T + s, 3), "e": round(T + e, 3), "text": b["text"],
                    "words": word_times(b["text"], e - s), "mouth": mouth_env(clip),
                })
            beats[b["id"]] = {"s": round(s, 3), "e": round(e, 3)}
            if src is not None:
                beats[b["id"]]["src"] = round(src, 3)
            for name, off, gain in b.get("sfx", []):
                at = e if off == "end" else s + off
                cues.append((T + at, name, gain))
            cursor = e + gap
        dur = cursor + sc.get("tail", 0.4)
        scenes_out.append({"id": sc["id"], "start": round(T, 3), "dur": round(dur, 3), "clock": sc["clock"],
                           "label": sc["label"], "beats": beats})
        if sc["id"] not in script.get("no_whoosh", ["title", "end"]):
            cues.append((T, "whoosh", 0.35))
        T += dur

    total = T
    mix = np.zeros(int((total + 1) * SR))
    if script.get("level_lines"):  # match every line's loudness while it is voiced, not its peak
        def active_rms(x):
            fr = x[: len(x) // 960 * 960].reshape(-1, 960)
            r = np.sqrt(np.mean(fr ** 2, axis=1))
            return np.sqrt(np.mean(r[r > 0.1 * r.max()] ** 2))
        target = np.median([active_rms(c) for _, c in voice_clips])
        voice_clips = [(at, c * min(2.0, target / active_rms(c))) for at, c in voice_clips]
    for at, clip in voice_clips:
        place(mix, clip, at, 0.95)

    # music bed with ducking, only through the main story
    music = script.get("music", {"from": "handoff", "to": "coco", "mute": ["enter", "scream", "twitch"]})
    start = next(s["start"] for s in scenes_out if s["id"] == music["from"])
    stop = next(s["start"] + s["dur"] for s in scenes_out if s["id"] == music["to"])
    bed = music_bed(stop - start, music.get("bells", False))
    gain = np.full(len(bed), 0.16)
    for ln in lines_out:
        a, b = int((ln["s"] - start - 0.1) * SR), int((ln["e"] - start + 0.2) * SR)
        if b > 0 and a < len(gain):
            gain[max(a, 0):min(b, len(gain))] = 0.06
    for sc in scenes_out:  # drop the bed for dramatic moments ("beat" or "scene:beat")
        for m in music["mute"]:
            sid, _, bid = m.rpartition(":")
            if (not sid or sid == sc["id"]) and bid in sc["beats"]:
                a = int((sc["start"] + sc["beats"][bid]["s"] - start) * SR)
                b = int((sc["start"] + sc["beats"][bid]["e"] - start) * SR)
                gain[max(a, 0):max(0, min(b, len(gain)))] = 0.0
    beds = script.get("beds", {})  # scenes that get their own underscore instead of the bed

    def bed_of(sc):  # "name", or {"name": ..., "until": beat} to end the underscore at that beat
        spec = beds[sc["id"]]
        name, until = (spec, None) if isinstance(spec, str) else (spec["name"], spec.get("until"))
        return name, (sc["beats"][until]["s"] if until else sc["dur"])
    for sc in scenes_out:
        if sc["id"] in beds:
            a, b = int((sc["start"] - start) * SR), int((sc["start"] + bed_of(sc)[1] - start) * SR)
            gain[max(a, 0):max(0, min(b, len(gain)))] = 0.0
    gain = np.convolve(gain, np.ones(2400) / 2400, mode="same")
    fade = ar(len(bed) / SR, 0.6, 1.0)
    place(mix, bed * gain * fade, start)
    for sc in scenes_out:
        if sc["id"] in beds:
            name, length = bed_of(sc)
            under = BEDS[name](length)
            g = np.full(len(under), 0.22)
            for ln in lines_out:
                a, b = int((ln["s"] - sc["start"] - 0.1) * SR), int((ln["e"] - sc["start"] + 0.2) * SR)
                if b > 0 and a < len(g):
                    g[max(a, 0):min(b, len(g))] = 0.09
            place(mix, under * np.convolve(g, np.ones(2400) / 2400, mode="same"), sc["start"])

    for at, name, g in cues:
        clip = SFX[name]()
        place(mix, clip, at, g * 0.6)

    # bring dialogue to about -15 dBFS RMS, then soft-limit the peaks
    speech = np.zeros(len(mix), bool)
    for ln in lines_out:
        speech[int(ln["s"] * SR):int(ln["e"] * SR)] = True
    rms = np.sqrt(np.mean(mix[speech] ** 2))
    mix = np.tanh(mix * (10 ** (-15 / 20) / rms)) * 0.97
    stereo = np.stack([mix, mix], axis=1)
    sf.write(os.path.join(BUILD, "audio.wav"), stereo, SR, subtype="PCM_16")

    timeline = {"fps": FPS, "duration": round(total, 3), "scenes": scenes_out, "lines": lines_out}
    with open(os.path.join(BUILD, "timeline.json"), "w") as f:
        json.dump(timeline, f)
    with open(os.path.join(BUILD, "timeline.js"), "w") as f:
        f.write(f"window.{args.var}=" + json.dumps(timeline) + ";\n")
    print(f"duration {total:.2f}s, {len(lines_out)} lines, {len(cues)} cues")
    for s in scenes_out:
        print(f"  {s['id']:<8} {s['start']:7.2f}  +{s['dur']:.2f}")


if __name__ == "__main__":
    main()
