"""Episode 6 audio: voices, stereo mix, room reverb, ambience, alarm sound design, music, foley and lip-sync tracks.

Builds on build_audio.py (its DSP helpers and Kokoro wrapper) without changing it, so Episodes 1 to 5 are untouched.
What is new here:
  - stereo: every voice and effect is panned to where it is on screen
  - a synthetic room per scene (reverb), and ambience under every scene (HVAC, birds, fluorescent buzz, the alarm bed)
  - a family of real-sounding alarms (chair pad, IV pump, pulse ox, bed, exit door, call light, smoke detector, fire horn, microwave)
  - lip-sync tracks per line: `mouth` (jaw openness) and `vis` (vowel spread and teeth) from LPC formants of the recorded voice
  - foley placed by the animation: build/ep6/events.json is written by `node render.js events` from the footfalls and contacts in the scenes
  - the master is measured and normalized to about -16 LUFS with a true-peak safe limiter

Usage: python3 build_audio6.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--script script_ep6.json --out build/ep6 --var TIMELINE_EP6]
"""
import argparse
import hashlib
import json
import os

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.linalg import solve_toeplitz

import build_audio as BA
from build_audio import SR, FPS, tarr, osc, expdecay, ar, lp, hp, bp, midi

HERE = BA.HERE
BUILD = os.path.join(HERE, "build", "ep6")
CACHE6 = os.path.join(HERE, "build", "tts_cache")


def rng6(seed):
    return np.random.default_rng(seed)


def noise6(d, seed=1):
    return rng6(seed).uniform(-1, 1, int(d * SR))


def norm6(x, peak=0.9):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def place2(buf, clip, at, gain=1.0, pan=0.0):
    """Add a mono (n,) or stereo (2, n) clip into a stereo buffer (2, N), equal-power panned."""
    i = int(round(at * SR))
    if clip.ndim == 1:
        th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        clip = np.stack([clip * np.cos(th), clip * np.sin(th)])
    if i < 0:
        clip, i = clip[:, -i:], 0
    n = min(clip.shape[1], buf.shape[1] - i)
    if n > 0:
        buf[:, i:i + n] += clip[:, :n] * gain


# ================================================================ sound effects
def tone_env(f, d, a=0.002, r=0.01, harm=(1.0,), kind="sine"):
    x = sum(h * osc(kind, f * (k + 1), d) for k, h in enumerate(harm))
    return x * ar(d, a, r)


def sfx_a_chair():
    """Pressure-pad chair alarm: three flat 1 kHz beeps."""
    out = np.zeros(int(0.9 * SR))
    for k in range(3):
        d = 0.13
        x = tone_env(1000, d, .004, .012, (1, .35, .2), "square") * 0.5 + tone_env(1000, d, .004, .012) * 0.5
        BA.place(out, x, 0.02 + k * 0.22, 0.6)
    return lp(out, 6500)


def sfx_a_pump():
    """IV pump occlusion: three rising chirps and a low bonk."""
    out = np.zeros(int(1.1 * SR))
    for k, f in enumerate((1568.0, 1976.0, 2349.0)):
        d = 0.085
        BA.place(out, tone_env(f, d, .002, .02, (1, .25)) * expdecay(d, .12), 0.02 + k * 0.1, 0.55)
    d = 0.3
    BA.place(out, (tone_env(784, d, .004, .1, (1, .5, .25), "tri")) * expdecay(d, .18), 0.4, 0.7)
    return out


def sfx_a_pulse():
    """Pulse oximeter: soft falling pips."""
    out = np.zeros(int(1.0 * SR))
    for k, f in enumerate((1480.0, 1400.0, 1320.0)):
        d = 0.075
        BA.place(out, tone_env(f, d, .003, .03) * expdecay(d, .05), 0.02 + k * 0.3, 0.5)
    return out


def sfx_a_bed():
    """Bed-exit alarm: an urgent two-tone warble."""
    d = 1.3
    t = tarr(d)
    ph = (t * 3.3) % 1
    f = np.where(ph < .5, 659.0, 523.0)
    x = osc("square", f, d) * 0.35 + osc("sine", f, d) * 0.5
    gate = np.convolve(np.where(ph < .86, 1.0, 0.0), np.ones(60) / 60, mode="same")
    return lp(x * gate * ar(d, .01, .08), 5200) * 0.8


def sfx_a_door():
    """Exit-door wander alarm: a rasping siren sweep."""
    d = 1.5
    t = tarr(d)
    f = 760 + 340 * (0.5 + 0.5 * np.sin(2 * np.pi * 1.9 * t - np.pi / 2))
    x = osc("saw", f, d) * 0.5 + osc("square", f * 1.003, d) * 0.3
    return lp(x, 3200) * ar(d, .02, .15) * 0.8


def sfx_a_call():
    """Call-light chime: ding, dong."""
    out = np.zeros(int(1.4 * SR))
    for k, f in enumerate((880.0, 659.0)):
        d = 0.9
        x = (osc("sine", f, d) + .3 * osc("sine", f * 2.76, d) * expdecay(d, .12) + .12 * osc("sine", f * 5.4, d) * expdecay(d, .05)) * expdecay(d, .32)
        BA.place(out, x * ar(d, .002, .05), k * 0.42, 0.55)
    return out


def sfx_a_chirp():
    """Smoke-detector low-battery chirp: a sharp piezo tick that rings for a moment."""
    d = 0.2
    t = tarr(d)
    x = np.sin(2 * np.pi * 3150 * t) + .35 * np.sin(2 * np.pi * 6300 * t) + .1 * np.sin(2 * np.pi * 9450 * t)
    env = np.where(t < .05, 1.0, np.exp(-(t - .05) / .035))
    x = x * env * ar(d, .0004, .05)
    # a little room slap so it sits in a hallway
    out = np.concatenate([x, np.zeros(int(.4 * SR))])
    n = int(.09 * SR)
    out[n:] += out[:-n] * .22
    return out * .8


def sfx_a_ding():
    """Microwave: one bright bell."""
    d = 1.6
    x = (osc("sine", 2093, d) + .5 * osc("sine", 2093 * 2.0, d) * expdecay(d, .25) + .25 * osc("sine", 2093 * 2.76, d) * expdecay(d, .09)) * expdecay(d, .55)
    click = BA.bp(noise6(.02, 3), 1500, 7000) * expdecay(.02, .006)
    out = np.concatenate([x * ar(d, .001, .1) * .6, np.zeros(1)])
    out[:len(click)] += click * .3
    return out


def sfx_a_fire():
    """Fire horn, temporal-3: three blasts, a pause. Harsh, loud, impossible to mistake."""
    d = 4.5
    t = tarr(d)
    gate = np.zeros_like(t)
    for k in range(3):
        a, b = int((.0 + k * 1.0) * SR), int((.5 + k * 1.0) * SR)
        gate[a:b] = 1.0
    gate = np.convolve(gate, np.ones(160) / 160, mode="same")
    x = osc("square", 520, d) * .5 + osc("square", 523.5, d) * .4 + osc("saw", 1040, d) * .2
    x = hp(lp(x, 4200), 260)
    # the cycle repeats once
    cyc = (x * gate)[: int(3.5 * SR)]
    out = np.zeros(int(7.2 * SR))
    BA.place(out, cyc, 0, 1.0)
    BA.place(out, cyc, 3.6, 1.0)
    return out * .75 * ar(7.2, .01, .3)


def sfx_battery():
    """A 9-volt battery snapping in or out: click, tink, a small plastic rattle."""
    out = np.zeros(int(.6 * SR))
    BA.place(out, bp(noise6(.03, 4), 1500, 8000) * expdecay(.03, .006), 0.0, .9)
    BA.place(out, osc("sine", 3400, .12) * expdecay(.12, .03) * ar(.12, .001, .04), 0.012, .35)
    for k in range(4):
        BA.place(out, bp(noise6(.02, 10 + k), 900, 5000) * expdecay(.02, .005), .09 + k * .045 + (k % 2) * .01, .28)
    return out


def sfx_doorbang():
    """A heavy door flung open: wood crack, thump, a long hall tail."""
    out = np.zeros(int(1.4 * SR))
    BA.place(out, bp(noise6(.06, 5), 300, 4200) * expdecay(.06, .012), 0, 1.0)
    BA.place(out, osc("sine", np.linspace(120, 48, int(.35 * SR)), .35) * expdecay(.35, .09), 0, .9)
    BA.place(out, lp(noise6(.5, 6), 500) * expdecay(.5, .15), .02, .5)
    return out


def sfx_stampede():
    """Everyone running at once: a rumble, hundreds of footfalls, a squeaking wheelchair or two."""
    d = 4.6
    out = np.zeros((2, int(d * SR)))
    r = rng6(21)
    env = np.minimum(1, np.arange(out.shape[1]) / (.5 * SR)) * np.exp(-np.maximum(0, np.arange(out.shape[1]) / SR - 3.4) / 0.6)
    rumble = lp(noise6(d, 22), 160) * 3.0
    out += np.stack([rumble, rumble * .95]) * env * .25
    for _ in range(230):
        at = r.uniform(0, 4.2) ** 1.0
        pan = r.uniform(-1, 1)
        g = (.5 + r.uniform(0, .5)) * (min(1, at / .5) * (1 if at < 3.4 else max(0, 1 - (at - 3.4) / .9)))
        d2 = .07
        step = (bp(noise6(d2, int(at * 1000) + 31), 120, 1800) * expdecay(d2, .02) + .5 * osc("sine", r.uniform(70, 120), d2) * expdecay(d2, .03))
        place2(out, step, at, g * .22, pan)
    for k in range(3):
        at = r.uniform(.3, 2.6)
        sq = bp(noise6(.5, 40 + k), 1500, 3800) * (0.5 + 0.5 * np.sin(2 * np.pi * r.uniform(7, 12) * tarr(.5))) * ar(.5, .05, .15)
        place2(out, sq, at, .1, r.uniform(-.8, .8))
    return out


def sfx_theme6():
    """Title sting: alarm tones tuned into a chord that resolves with a downbeat."""
    d = 4.6
    out = np.zeros(int(d * SR))
    notes = [(0.0, 76), (0.25, 79), (0.5, 83), (0.75, 86), (1.0, 88), (1.25, 86), (1.5, 83), (1.75, 79)]
    for at, n in notes:
        dd = .22
        BA.place(out, tone_env(midi(n), dd, .002, .06, (1, .3, .12)) * expdecay(dd, .1), at, .35)
    for at in (0.0, 1.0, 2.0):
        BA.place(out, osc("sine", np.linspace(120, 48, int(.25 * SR)), .25) * expdecay(.25, .07), at, .7)
    for k, n in enumerate((52, 59, 64, 68)):
        dd = 2.2
        BA.place(out, (osc("saw", midi(n), dd) * .25 + osc("sine", midi(n), dd) * .5) * ar(dd, .08, 1.4), 2.2, .35)
    BA.place(out, bp(noise6(.5, 8), 800, 6000) * expdecay(.5, .18), 2.2, .3)
    return lp(out, 9000)


def sfx_stamp6():
    """The 'ALARMS' counter slamming onto the screen."""
    out = np.zeros(int(.7 * SR))
    BA.place(out, osc("sine", np.linspace(150, 50, int(.3 * SR)), .3) * expdecay(.3, .08), 0, .9)
    BA.place(out, bp(noise6(.05, 9), 400, 5000) * expdecay(.05, .012), 0, .7)
    BA.place(out, osc("sine", 1568, .4) * expdecay(.4, .12) * ar(.4, .001, .05), .02, .22)
    return out


def sfx_birds6():
    out = np.zeros(int(2.4 * SR))
    r = rng6(77)
    for _ in range(9):
        at = r.uniform(0, 2.0)
        f0 = r.uniform(2400, 4200)
        n = int(r.uniform(.05, .14) * SR)
        f = f0 * (1 + r.uniform(-.25, .4) * np.linspace(0, 1, n) ** r.uniform(.6, 1.6))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(n)
        BA.place(out, x, at, r.uniform(.06, .12))
    return lp(out, 7500)


def sfx_step_tile():
    d = .09
    return (bp(noise6(d, 61), 160, 2200) * expdecay(d, .018) * .9 + .6 * osc("sine", 95, d) * expdecay(d, .025)) * ar(d, .001, .02)


def sfx_step_hard():
    d = .1
    return (bp(noise6(d, 62), 300, 3600) * expdecay(d, .02) + .5 * osc("sine", 120, d) * expdecay(d, .03)) * ar(d, .0008, .02)


def sfx_click():
    d = .03
    return (bp(noise6(d, 63), 1800, 7000) * expdecay(d, .005) + .4 * osc("sine", 2600, d) * expdecay(d, .006))


def sfx_silence_btn():
    """Pressing a silence button: a soft tick, then the alarm cutting off."""
    d = .06
    return (bp(noise6(d, 64), 600, 4200) * expdecay(d, .01) + .5 * osc("sine", 520, d) * expdecay(d, .02))


def sfx_squeak():
    d = .28
    t = tarr(d)
    f = 2200 + 900 * np.sin(2 * np.pi * 7 * t)
    return osc("sine", f, d) * ar(d, .01, .1) * .35


def sfx_thump_soft():
    d = .25
    return osc("sine", np.linspace(130, 55, int(d * SR)), d) * expdecay(d, .07) * .9


def sfx_tap():
    d = .06
    return (bp(noise6(d, 66), 500, 3000) * expdecay(d, .008) * .6 + .6 * osc("sine", 640, d) * expdecay(d, .01))


def sfx_scuff():
    d = .22
    return bp(noise6(d, 67), 400, 3400) * ar(d, .02, .15) * .35


def sfx_cough():
    d = .22
    t = tarr(d)
    x = (osc("saw", 140 + 40 * np.exp(-t / .05), d) * .4 + noise6(d, 68) * .35)
    return bp(x, 220, 3200, 2) * expdecay(d, .07) * ar(d, .004, .05)


def sfx_pop():
    d = .05
    return bp(noise6(d, 69), 800, 6000) * expdecay(d, .01)


def sfx_whoosh2():
    d = .35
    return bp(noise6(d, 70), 400, 3800) * ar(d, .12, .2) * .5


def sfx_clatter():
    out = np.zeros(int(.6 * SR))
    r = rng6(71)
    for k in range(7):
        BA.place(out, bp(noise6(.04, 72 + k), 1500, 6500) * expdecay(.04, .008) * ar(.04, .001, .02), k * .06 + r.uniform(0, .02), r.uniform(.35, .8))
    return out


DUCK_SFX = {"a_chair", "a_pump", "a_pulse", "a_bed", "a_door", "a_call", "a_fire", "stampede", "pa_chime"}


def make_step(seed, foot):
    """One footfall on vinyl tile in soft-soled shoes. Every call is its own random variation so a run of steps never machine-guns."""
    r = rng6(seed)
    d = .12
    heel = bp(noise6(d, seed), r.uniform(180, 340), r.uniform(1500, 2700)) * expdecay(d, r.uniform(.009, .016)) * .8
    thump = osc("sine", np.linspace(r.uniform(108, 138), r.uniform(66, 90), int(d * SR)), d) * expdecay(d, r.uniform(.02, .032)) * (.55 if foot == "L" else .68)
    x = (heel + thump) * ar(d, .0006, .03)
    if r.random() < .14:   # a chirp of rubber on tile
        sq = .05
        f = np.linspace(r.uniform(1500, 2100), r.uniform(2300, 3000), int(sq * SR))
        y = osc("sine", f, sq) * ar(sq, .004, .03) * .16
        x[:len(y)] += y
    return x


BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})


# ================================================================ ambience (stereo)
def amb_hum(d, seed=1):
    t = tarr(d)
    x = .5 * np.sin(2 * np.pi * 60 * t) + .25 * np.sin(2 * np.pi * 120 * t + 1) + .12 * np.sin(2 * np.pi * 180 * t + 2)
    air = lp(noise6(d, seed), 700, 2) * (.6 + .4 * np.sin(2 * np.pi * .13 * t))
    m = x * .12 + air * .5
    return np.stack([m, np.roll(m, 440)]) * .6


def amb_lobby(d):
    out = amb_hum(d, 2) * .6
    for k in range(int(d * 1.6)):
        r = rng6(300 + k)
        BA.place(out[0] if r.random() < .5 else out[1], sfx_birds6()[: int(r.uniform(.3, .9) * SR)], r.uniform(0, max(.1, d - 1)), r.uniform(.08, .2))
    far = lp(noise6(d, 3), 420, 2) * (.5 + .5 * np.sin(2 * np.pi * .07 * tarr(d) + 1))
    out += np.stack([far, far * .9]) * .35
    return out


def amb_break(d):
    t = tarr(d)
    buzz = (np.sin(2 * np.pi * 120 * t) * .5 + np.sin(2 * np.pi * 240 * t) * .2) * (.7 + .3 * np.sin(2 * np.pi * 7.3 * t + 1)) * .1
    fridge = np.sin(2 * np.pi * 58 * t) * .5 * (.8 + .2 * np.sin(2 * np.pi * .4 * t))
    m = buzz + fridge * .14 + lp(noise6(d, 5), 600, 2) * .18
    return np.stack([m, np.roll(m, 300)]) * .8


def amb_alarms(d, ramp=(.4, 1.0), seed=9):
    """A building full of beeps: alarms start at random places and times, thickening over the scene."""
    out = amb_hum(d, 4) * .5
    r = rng6(seed)
    kinds = ["a_chair", "a_pump", "a_pulse", "a_bed", "a_call", "a_door"]
    t = 0.2
    while t < d:
        k = kinds[int(r.integers(0, len(kinds)))]
        dens = ramp[0] + (ramp[1] - ramp[0]) * (t / d)
        clip = BA.SFX[k]()
        pan = float(r.uniform(-.9, .9))
        reps = int(r.integers(1, 3))
        for q in range(reps):
            place2(out, lp(clip, float(r.uniform(2500, 7000))), t + q * (len(clip) / SR + .25), float(r.uniform(.12, .3)) * dens, pan)
        t += float(r.uniform(.25, .9)) / max(.3, dens)
    return out


AMB = {"hum": lambda d, ramp=None: amb_hum(d), "lobby": lambda d, ramp=None: amb_lobby(d), "break": lambda d, ramp=None: amb_break(d),
       "alarms": lambda d, ramp=None: amb_alarms(d, tuple(ramp or (.4, 1.0)))}


# ================================================================ rooms (reverb)
def make_ir(rt60, predelay=.012, damp=5200, seed=1):
    n = int((rt60 + predelay) * SR)
    g = rng6(seed)
    t = np.arange(n) / SR
    ir = g.standard_normal((2, n)) * np.exp(-6.9 * t / rt60)
    ir[:, :int(predelay * SR)] = 0
    for c in range(2):
        ir[c] = lp(ir[c], damp, 1)
    for tap, gn in ((.017, .5), (.029, .4), (.043, .3)):
        ir[0, int(tap * SR)] += gn
        ir[1, int((tap + .004) * SR)] += gn
    ir /= np.sqrt(np.sum(ir ** 2))
    return ir


ROOMS = {"lobby": (1.1, .2), "hall": (.85, .17), "break": (.42, .12), "outside": (.3, .05), "room": (.4, .12)}


def reverb(seg, room):
    rt, wet = ROOMS.get(room, (.5, .1))
    ir = make_ir(rt, seed=sum(map(ord, room)))
    out = np.stack([signal.fftconvolve(seg[c], ir[c], mode="full") for c in range(2)])
    return out * wet


# ================================================================ lip-sync tracks
def _lpc(x, order):
    r = np.correlate(x, x, "full")[len(x) - 1:len(x) + order]
    if r[0] < 1e-9:
        return None
    try:
        a = solve_toeplitz(r[:order], r[1:order + 1])
    except Exception:
        return None
    return np.concatenate([[1.0], -a])


def formants(frame, fs, order=12):
    x = frame * np.hamming(len(frame))
    x = np.append(x[0], x[1:] - 0.97 * x[:-1])
    a = _lpc(x, order)
    if a is None:
        return []
    roots = np.roots(a)
    roots = roots[np.imag(roots) > 0.01]
    ang = np.arctan2(np.imag(roots), np.real(roots))
    freqs = ang * fs / (2 * np.pi)
    bw = -0.5 * (fs / (2 * np.pi)) * np.log(np.abs(roots))
    return sorted(f for f, b in zip(freqs, bw) if 90 < f < fs / 2 - 200 and b < 420)


def viseme_tracks(clip):
    """Per 1/30 s frame: jaw openness 0..1 and a (spread, teeth) pair, from the voice itself.
    Vowel formants decide how wide or round the mouth is (F1 -> jaw, F2 -> spread); hissing consonants show the teeth;
    quiet frames close the mouth. Returns (mouth_digits, vis_digits) as strings."""
    fs = 10000
    x = signal.resample_poly(clip, 5, 24)   # 48 kHz -> 10 kHz
    hop = fs // FPS
    n = int(np.ceil(len(x) / hop))
    rms = np.zeros(n)
    jaw = np.zeros(n)
    spread = np.full(n, .5)
    teeth = np.zeros(n)
    for i in range(n):
        c = i * hop + hop // 2
        seg = x[max(0, c - 125): c + 125]
        if len(seg) < 100:
            continue
        rms[i] = np.sqrt(np.mean(seg ** 2) + 1e-12)
    ref = np.percentile(rms, 90) or 1.0
    for i in range(n):
        e = rms[i] / ref
        if e < .1:
            continue
        c = i * hop + hop // 2
        seg = x[max(0, c - 125): c + 125]
        zcr = np.mean(np.abs(np.diff(np.sign(seg)))) / 2
        F = formants(seg, fs)
        if zcr > .32 and e < 1.1:                       # s, sh, f: teeth together, a little open
            jaw[i], spread[i], teeth[i] = .22, .72, 1.0
        elif F:
            f1 = next((f for f in F if 250 < f < 1000), 500)
            f2 = next((f for f in F if f > f1 + 250 and f < 3200), 1500)
            jaw[i] = np.clip((f1 - 300) / 460, .12, 1)
            spread[i] = np.clip((f2 - 950) / 1300, 0, 1)
            teeth[i] = .85 if (f1 < 460 and f2 > 1950) else (.25 if f2 > 1700 else 0)
        else:
            jaw[i] = .4
    k = np.array([.25, .5, .25])
    sm = lambda a: np.convolve(np.pad(a, 1, mode="edge"), k, mode="valid")
    jaw, spread, teeth = sm(jaw), sm(spread), sm(teeth)
    openness = np.clip((rms / ref) ** .7 * (.5 + .65 * jaw), 0, 1)
    openness[rms / ref < .1] = 0
    mouth = "".join(str(int(round(v * 9))) for v in openness)
    vis = "".join(f"{int(round(np.clip(s, 0, 1) * 9))}{int(round(np.clip(t, 0, 1) * 9))}" for s, t in zip(spread, teeth))
    return mouth, vis


# ================================================================ voices
def fx_robot(x):
    t = np.arange(len(x)) / SR
    y = bp(x, 260, 3800, 3)
    y = y * (.55 + .45 * np.sin(2 * np.pi * 64 * t))
    return np.tanh(2.2 * y) * .75


def tts6(kokoro, v, say):
    fx = v.get("fx")
    if fx in ("robot",):
        key = hashlib.sha1(json.dumps([v["voice"], v.get("speed"), v.get("semis", 0), fx, say, "v6"]).encode()).hexdigest()[:16]
        path = os.path.join(CACHE6, key + ".wav")
        if os.path.exists(path):
            return sf.read(path)[0]
        base = BA.tts(kokoro, dict(v, fx=None), say)
        x = BA.norm(fx_robot(base), .85)
        sf.write(path, x, SR)
        return x
    return BA.tts(kokoro, v, say)


# ================================================================ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    ap.add_argument("--script", default="script_ep6.json")
    ap.add_argument("--out", default="build/ep6")
    ap.add_argument("--var", default="TIMELINE_EP6")
    ap.add_argument("--events", default="")
    args = ap.parse_args()
    global BUILD
    BUILD = os.path.join(HERE, args.out)
    os.makedirs(CACHE6, exist_ok=True)
    os.makedirs(BUILD, exist_ok=True)
    from kokoro_onnx import Kokoro
    kokoro = Kokoro(args.model, args.voices)
    script = json.load(open(os.path.join(HERE, args.script)))
    voices = script["voices"]

    scenes_out, lines_out, cues, voice_clips = [], [], [], []
    T = 0.0
    for sc in script["scenes"]:
        cursor = sc.get("head", .2)
        beats = {}
        for b in sc["beats"]:
            gap = b.get("gap", BA.DEFAULT_GAP)
            if "pause" in b:
                s, e = cursor, cursor + b["pause"]
                gap = b.get("gap", 0.0)
            else:
                v = dict(voices[b["who"]])
                if "speed" in b:
                    v["speed"] = b["speed"]
                if "semis" in b:
                    v["semis"] = b["semis"]
                clip = tts6(kokoro, v, b["say"])
                s, e = cursor, cursor + len(clip) / SR
                pan = b.get("pan", voices[b["who"]].get("pan", 0))
                voice_clips.append((T + s, clip, pan, sc.get("room", "hall"), b["who"]))
                mouth, vis = viseme_tracks(clip)
                lines_out.append({"scene": sc["id"], "id": b["id"], "who": b["who"], "name": v["name"], "color": v["color"],
                                  "s": round(T + s, 3), "e": round(T + e, 3), "text": b["text"],
                                  "words": BA.word_times(b["text"], e - s), "mouth": mouth, "vis": vis})
            beats[b["id"]] = {"s": round(s, 3), "e": round(e, 3)}
            for cue in b.get("sfx", []):
                name, off, gain = cue[:3]
                pan = cue[3] if len(cue) > 3 else 0
                cues.append((T + (e if off == "end" else s + off), name, gain, pan, sc.get("room", "hall")))
            cursor = e + gap
        dur = cursor + sc.get("tail", .4)
        scenes_out.append({"id": sc["id"], "start": round(T, 3), "dur": round(dur, 3), "clock": sc["clock"], "label": sc["label"], "beats": beats})
        T += dur
    total = T

    # foley the animation asked for (written by `node render.js events`)
    ev_path = os.path.join(BUILD, "events.json")
    if args.events or os.path.exists(ev_path):
        for ev in json.load(open(args.events or ev_path)):
            nm = ev["name"] + ev.get("foot", "") if ev["name"] == "step" else ev["name"]
            cues.append((ev["t"], nm, ev.get("vol", .5), ev.get("pan", 0), ev.get("room", "hall")))

    N = int((total + 1.5) * SR)
    speech = np.zeros(N)
    for ln in lines_out:
        speech[int((ln["s"] - .08) * SR):int((ln["e"] + .2) * SR)] = 1.0
    kk = int(.18 * SR)
    sm = np.convolve(speech, np.ones(kk) / kk, mode="same").clip(0, 1) ** .6   # smooth 0..1 "someone is talking"
    dry = np.zeros((2, N))
    stems = {k: np.zeros((2, N)) for k in ("voice", "sfx")}

    if script.get("level_lines"):
        def active_rms(x):
            fr = x[: len(x) // 960 * 960].reshape(-1, 960)
            r = np.sqrt(np.mean(fr ** 2, axis=1))
            return np.sqrt(np.mean(r[r > .1 * r.max()] ** 2))
        target = np.median([active_rms(c) for _, c, *_ in voice_clips])
        voice_clips = [(at, c * min(2.0, target / active_rms(c)), *rest) for at, c, *rest in voice_clips]
    for at, clip, pan, room, who in voice_clips:
        g = .95 * (.55 if who == "pa" else 1.0)
        place2(dry, clip, at, g, pan)
        place2(stems["voice"], clip, at, g, pan)
    for at, name, gain, pan, room in cues:
        if name.startswith("step"):
            clip = make_step(int(at * 997) + 17, name[-1])
        elif name not in BA.SFX:
            print("  (missing sfx)", name)
            continue
        else:
            clip = BA.SFX[name]()
            if name in DUCK_SFX:   # a sustained alarm never sits on top of a line of dialogue
                i = int(round(at * SR)); n = min(clip.shape[-1], N - i)
                if n > 0:
                    clip = clip.copy(); clip[..., :n] = clip[..., :n] * (1 - .72 * sm[i:i + n])
        place2(dry, clip, at, gain * .6, pan)
        place2(stems["sfx"], clip, at, gain * .6, pan)

    # per-scene room: a little reverb on everything that was spoken or struck in that scene
    wet = np.zeros_like(dry)
    for sc in scenes_out:
        room = next(s for s in script["scenes"] if s["id"] == sc["id"]).get("room", "hall")
        a, b = int(sc["start"] * SR), min(N, int((sc["start"] + sc["dur"]) * SR))
        w = reverb(dry[:, a:b], room)
        n = min(w.shape[1], N - a)
        wet[:, a:a + n] += w[:, :n]
    dry += wet

    # ambience under each scene
    amb = np.zeros_like(dry)
    for sc in scenes_out:
        spec = next(s for s in script["scenes"] if s["id"] == sc["id"]).get("amb")
        if not spec:
            continue
        d = sc["dur"] + .2
        a = AMB[spec["name"]](d, spec.get("ramp"))
        fade = ar(d, .3, .3)
        i = int(sc["start"] * SR)
        n = min(a.shape[1], N - i)
        amb[:, i:i + n] += a[:, :n] * fade[:n] * spec.get("gain", .5) * .35

    # music: scene beds from build_music6
    music = np.zeros_like(dry)
    try:
        import build_music6 as BM
        music = BM.score(script, scenes_out, lines_out, N)
    except ImportError:
        pass

    # duck the music and ambience under speech with a smooth sidechain
    duck = 1 - .62 * sm
    mix = dry + (amb + music) * duck

    # master: dialogue to about -15 dBFS RMS, then loudness-normalize
    sp = np.zeros(N, bool)
    for ln in lines_out:
        sp[int(ln["s"] * SR):int(ln["e"] * SR)] = True
    rms = np.sqrt(np.mean(mix[:, sp] ** 2))
    kgain = 10 ** (-16.2 / 20) / rms
    mix = np.tanh(mix * kgain) * .92   # a little under full scale so the AAC encode never overshoots
    if os.environ.get("STEMS"):
        for name, st in stems.items():
            sf.write(os.path.join(BUILD, f"stem_{name}.wav"), (st * kgain).T, SR, subtype="PCM_16")
        sf.write(os.path.join(BUILD, "stem_music.wav"), (music * duck * kgain).T, SR, subtype="PCM_16")
    sf.write(os.path.join(BUILD, "audio.wav"), mix.T[: int((total + 1) * SR)], SR, subtype="PCM_16")

    timeline = {"fps": FPS, "duration": round(total, 3), "scenes": scenes_out, "lines": lines_out}
    json.dump(timeline, open(os.path.join(BUILD, "timeline.json"), "w"))
    open(os.path.join(BUILD, "timeline.js"), "w").write(f"window.{args.var}=" + json.dumps(timeline) + ";\n")
    print(f"duration {total:.2f}s, {len(lines_out)} lines, {len(cues)} cues")
    for s in scenes_out:
        print(f"  {s['id']:<8} {s['start']:7.2f}  +{s['dur']:.2f}")


if __name__ == "__main__":
    main()
