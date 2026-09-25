"""Build the voice track, sound effects, music bed and timeline for SHIFT HAPPENS.

Reads script.json, voices every line with Kokoro TTS, synthesizes all SFX and
music with numpy, mixes to build/audio.wav, and writes build/timeline.json,
which the animation (index.html) uses for scene timing, captions and lip sync.

Usage: python3 build_audio.py --model PATH/kokoro-v1.0.onnx --voices PATH/voices-v1.0.bin
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
CACHE = os.path.join(BUILD, "tts_cache")
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


SFX = {k[4:]: v for k, v in globals().items() if k.startswith("sfx_")}


# ---------------------------------------------------------------- music bed
def music_bed(duration):
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
    key = hashlib.sha1(json.dumps([v["voice"], v["lang"], v["speed"], v.get("semis", 0), v.get("fx"), say]).encode()).hexdigest()[:16]
    path = os.path.join(CACHE, key + ".wav")
    if os.path.exists(path):
        x, _ = sf.read(path)
        return x
    samples, sr = kokoro.create(say, voice=v["voice"], speed=v["speed"], lang=v["lang"])
    x = signal.resample_poly(np.asarray(samples, dtype=float), SR // 1000, sr // 1000)
    x = semis_resample(x, v.get("semis", 0))
    # trim silence
    a = np.abs(x)
    idx = np.where(a > 0.01 * a.max())[0]
    x = x[max(0, idx[0] - 800): idx[-1] + 2400]
    if v.get("fx") == "phone":
        x = np.tanh(phone_band(x) * 3.0) * 0.6
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
    args = ap.parse_args()
    os.makedirs(CACHE, exist_ok=True)

    from kokoro_onnx import Kokoro
    kokoro = Kokoro(args.model, args.voices)

    script = json.load(open(os.path.join(HERE, "script.json")))
    voices = script["voices"]

    scenes_out, lines_out, cues = [], [], []
    voice_clips = []
    T = 0.0
    for sc in script["scenes"]:
        cursor = sc.get("head", 0.2)
        beats = {}
        for b in sc["beats"]:
            gap = b.get("gap", DEFAULT_GAP)
            if "pause" in b:
                s, e = cursor, cursor + b["pause"]
                gap = b.get("gap", 0.0)
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
            for name, off, gain in b.get("sfx", []):
                at = e if off == "end" else s + off
                cues.append((T + at, name, gain))
            cursor = e + gap
        dur = cursor + sc.get("tail", 0.4)
        scenes_out.append({"id": sc["id"], "start": round(T, 3), "dur": round(dur, 3), "clock": sc["clock"],
                           "label": sc["label"], "beats": beats})
        if sc["id"] not in ("title", "end"):
            cues.append((T, "whoosh", 0.35))
        T += dur

    total = T
    mix = np.zeros(int((total + 1) * SR))
    for at, clip in voice_clips:
        place(mix, clip, at, 0.95)

    # music bed with ducking, only through the main story
    start = next(s["start"] for s in scenes_out if s["id"] == "handoff")
    stop = next(s["start"] + s["dur"] for s in scenes_out if s["id"] == "coco")
    bed = music_bed(stop - start)
    gain = np.full(len(bed), 0.16)
    for ln in lines_out:
        a, b = int((ln["s"] - start - 0.1) * SR), int((ln["e"] - start + 0.2) * SR)
        if b > 0 and a < len(gain):
            gain[max(a, 0):min(b, len(gain))] = 0.06
    for sc in scenes_out:  # drop the bed for dramatic moments
        for bid in ("enter", "scream", "twitch"):
            if bid in sc["beats"]:
                a = int((sc["start"] + sc["beats"][bid]["s"] - start) * SR)
                b = int((sc["start"] + sc["beats"][bid]["e"] - start) * SR)
                gain[max(a, 0):max(0, min(b, len(gain)))] = 0.0
    gain = np.convolve(gain, np.ones(2400) / 2400, mode="same")
    fade = ar(len(bed) / SR, 0.6, 1.0)
    place(mix, bed * gain * fade, start)

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
        f.write("window.TIMELINE=" + json.dumps(timeline) + ";\n")
    print(f"duration {total:.2f}s, {len(lines_out)} lines, {len(cues)} cues")
    for s in scenes_out:
        print(f"  {s['id']:<8} {s['start']:7.2f}  +{s['dur']:.2f}")


if __name__ == "__main__":
    main()
