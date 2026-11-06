"""Episode 20 audio: THE SNOW DAY. A fresh copy of the Episode 15 to 19 mixer wrapper (build_audio19.py, the final one) mapped to this episode: its own paths, scene ids, voices, rooms, effects and score.

Everything build_audio15 explains applies unchanged: the per-line voice cache under <out>/voice/, the dip of every cue under dialogue (DUCK_DB), the footsteps from the animation
(build/ep21/events.json), the loudness trim, peak limiter, the timeline comparison against the frozen build/ep21/timeline.json and the dialogue margin of every line.

WHAT IS NEW IN EPISODE 20 (scene ids: title, forecast, lot, blackout, dayroom, night, end)
  THE WEATHER   `wind` is a designed blizzard bed (a low rumble, a tonal howl that rises with the gusts, a hush of falling snow). The lot is outdoors: no room reverb at all, every voice dry and thin, gusts
                at the plow's cues and a slow independent swell, boots that creak and crunch in snow (every footstep of the lot in events.json becomes a snow crunch). The indoor scenes leak the same wind through
                the wall (low-passed, quiet). The glass-door gust (`doorgust`) is a brief wideband rush.
  THE TEN       `blackout` is a building losing power (`powerdown`: the ballast buzz of six rooms dying left to right, fans and compressors spinning down, the HVAC sigh), a thick hush with breaths, the
  SECONDS       stopwatch's ticks (a designed tick per second from the moment Onion starts it), a dying battery, then `genstart` (the starter, two coughs, the catch, the transfer switch) and the emergency
                lights' buzz over the generator's drone as the new room tone.
  THE TIME-LAPSE `night` 10.65 to 18.65 s: build/ep21/lapse.json (10 Hz, absolute seconds: {t, worldMin, speed, sun, moonX}; a fixed curve when it does not exist, and the build says so) drives the room
                tone and wind (varispeed with the picture's world speed), the clock's ratchet (`clockspin`), the rounds' whooshes, the rising wind swell, and the bed decelerates into real time where the Moon speaks.
  THE DEVICES   every voice that comes out of a device is a device: the speakerphone (arti, melon), the TV (wx), the truck cab (turnip), the phone (egg, with a packet dropout), Onion buried in the snow, the Moon
                behind the weather and the Moon close, Binder's dying battery, two Strawberries (the oncoming one a semitone lower and 4 percent slower).
  THE GUARD     the AAC guard encodes with /usr/bin/ffmpeg (the encoder the publish step uses) and measures the DECODED m4a with `-af ebur128=peak=true`; the wav is dipped until it passes -1.5 dBTP.

Usage: python3 build_audio20.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep21_sound] [--events build/ep21/events.json] [--lapse build/ep21/lapse.json]
                                [--doors build/ep21/door_events.json] [--phys build/ep21/phys_events.json] [--keep-stems] [--publish]
  --publish     after the timeline matches build/ep21/timeline.json: copy audio.wav into build/ep21/ and encode audio.m4a (and check the decoded m4a's true peak)
  --keep-stems  keep stem_voice.wav, stem_sfx.wav and stem_music.wav in the output folder (they are removed otherwise)
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import uniform_filter1d

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
import build_audio10 as A10
import build_audio13 as A13
import build_audio14 as A14   # importing it registers every earlier effect (Episodes 6 to 14) in build_audio.SFX
import build_music21 as M20   # the score
from build_audio import SR, tarr, osc, ar, midi, expdecay
from build_audio6 import norm6, rng6, noise6
from build_audio7 import _smooth_rand, _sum
from build_audio10 import _nth, _burst, _thump, _ping
from build_audio13 import _place, _edge, _lp4, _hp4, _bp4, _tv_filter, _glide, _sin_of, _glass, _fade_end, _call_ding
from build_audio14 import _res, _band, _unit, _key

HERE = A6.HERE
SCRIPT = "script_ep21.json"
EPD = "build/ep21"       # the lead's folder (the frozen timeline and the event files)
FXV = "20.2"             # bump to rebuild every treated voice line


def _n(d):
    return int(d * SR)


def _arg(name, default=None):
    a = sys.argv
    return a[a.index(name) + 1] if name in a else default


# ================================================================ which cue is this? (the script says; the mixer asks in script order)
_CUE_TAB = {}


def _cue_table():
    """{effect name: [(scene id, index among that scene's cues of the name, cue gain), ...]} in the order the mixer asks for them, read from the script this build was given."""
    if not _CUE_TAB:
        try:
            script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
        except (OSError, ValueError):
            script = {"scenes": []}
        for sc in script["scenes"]:
            seen = {}
            for b in sc["beats"]:
                for cue in b.get("sfx", []):
                    i = seen.get(cue[0], 0)
                    seen[cue[0]] = i + 1
                    _CUE_TAB.setdefault(cue[0], []).append((sc["id"], i, cue[2]))
        _CUE_TAB.setdefault("", [])
    return _CUE_TAB


def _ctx(name):
    """(k, scene id, index within the scene) of this call of the effect `name`; (k, None, k) when the call is not a script cue (a designed event or a foley event)."""
    k = _nth(name)
    tab = _cue_table().get(name, [])
    if k < len(tab):
        return k, tab[k][0], tab[k][1]
    return k, None, k


def _note(f, d, tau, h=((1, 1.0), (2, .3), (3, .1)), a=.004):
    """A struck, pitched tone: harmonics h = ((multiple, level), ...) that die with time constant tau, a short attack so it never clicks."""
    t = tarr(d)
    x = sum(g * np.sin(2 * np.pi * f * m * t) for m, g in h if f * m < SR * .45) * np.exp(-t / tau)
    return x * np.minimum(1, t / a)


# ================================================================ the voices
class _Vox(np.ndarray):
    """A mono voice clip (what the mixer measures: lengths, lip-sync, levelling) that carries `.alt`, the version that is placed in the mix: mono, or stereo."""

    def __new__(cls, mono, alt=None, who=None, tag=None):
        o = np.asarray(mono, dtype=float).view(cls)
        o.alt = alt
        o.who = who          # the speaker's id in the script ('onion', 'arti' ...), so the mixer can place the voice by who it is
        o.tag = tag          # 'scene_beat'
        return o

    def __array_finalize__(self, o):
        self.alt = getattr(o, "alt", None)
        self.who = getattr(o, "who", None)
        self.tag = getattr(o, "tag", None)

    def __array_wrap__(self, out, context=None, return_scalar=False):
        out = np.asarray(out)
        return out[()] if out.ndim == 0 else out

    def __mul__(self, k):
        k = float(k)
        return _Vox(np.asarray(self) * k, None if self.alt is None else self.alt * k, self.who, self.tag)

    __rmul__ = __mul__


class _Tag(np.ndarray):
    """A cue's clip with the name of the effect that made it, so place2 can dip it under dialogue by what it is."""

    def __new__(cls, x, name):
        o = np.asarray(x, dtype=float).view(cls)
        o.sfx = name
        return o

    def __array_finalize__(self, o):
        self.sfx = getattr(o, "sfx", None)

    def __array_wrap__(self, out, context=None, return_scalar=False):
        out = np.asarray(out)
        return out[()] if out.ndim == 0 else out


def _wobble(x, depth_s, rate, phase=0.0):
    """Read a clip through a delay that wanders by +- depth_s seconds at `rate` Hz (vibrato; a call's jitter buffer). The length is unchanged."""
    n = len(x)
    i = np.arange(n)
    return np.interp(i - depth_s * SR * np.sin(2 * np.pi * rate * i / SR + phase), i, x)


def _delay(x, ms, g):
    k = max(1, int(ms * SR / 1000))
    y = np.zeros(len(x))
    y[k:] = x[:-k] * g
    return y


def _env10(x, hop=480):
    nf = len(x) // hop
    return np.sqrt(np.mean(np.asarray(x[:nf * hop]).reshape(nf, hop) ** 2, axis=1)) + 1e-9


def _match_active_rms(y, ref):
    """Scale y so that its active-speech RMS equals that of ref (the mixer's own measure: frames above a tenth of the loudest frame)."""
    def act(x):
        e = _env10(x, 960)
        return np.sqrt(np.mean(e[e > .1 * e.max()] ** 2))
    a, b = act(y), act(ref)
    return y * (b / a) if a > 0 else y


# ---------------------------------------------------------------- small DSP tools for the devices
def _comp(x, thresh_db=-24.0, ratio=3.0, atk=.004, rel=.08, makeup_db=0.0, block=240):
    """A feed-forward compressor on the peak envelope of 5 ms blocks (attack `atk`, release `rel`, in seconds): everything above `thresh_db` (dBFS) is reduced by 1 - 1/ratio."""
    x = np.asarray(x, dtype=float)
    n = len(x)
    nb = n // block + 1
    pad = np.zeros(nb * block)
    pad[:n] = np.abs(x)
    env = pad.reshape(nb, block).max(axis=1)
    a_a, a_r = np.exp(-block / (atk * SR)), np.exp(-block / (rel * SR))
    sm = np.zeros(nb)
    s = 0.0
    for i in range(nb):
        e = env[i]
        s = e + a_a * (s - e) if e > s else e + a_r * (s - e)
        sm[i] = s
    over = np.maximum(20 * np.log10(sm + 1e-9) - thresh_db, 0)
    g = 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)
    return x * np.interp(np.arange(n), (np.arange(nb) + .5) * block, g)


def _softclip(x, drive=1.6):
    """A soft limiter that keeps the peak where it was: tiny speakers distort a little."""
    pk = np.max(np.abs(x)) + 1e-12
    return np.tanh(drive * x / pk) * pk / np.tanh(drive)


def _small_ir(seed, rt=.3, pre=.003, lo=None, hi=3500, taps=((.007, .5), (.013, .4), (.021, .3))):
    """A short impulse response of unit energy: decaying noise closed off at `hi` (and opened at `lo`), early reflections `taps` (s, gain)."""
    n = int((rt * 1.2 + pre) * SR)
    t = np.arange(n) / SR
    r = rng6(seed)
    ir = r.standard_normal(n) * np.exp(-6.9 * t / rt)
    ir[:int(pre * SR)] = 0
    ir = _lp4(ir, hi, 2)
    if lo:
        ir = _hp4(ir, lo, 2)
    for tap, g in taps:
        ir[int(tap * SR)] += g
    return ir / np.sqrt(np.sum(ir ** 2))


def _bake_room(x, seed, wet=.2, **kw):
    """x plus its own small room: the voice as it sounds in the space it comes from (a conference table, a studio, a truck cab)."""
    ir = _small_ir(seed, **kw)
    return x + wet * signal.fftconvolve(x, ir)[:len(x)]


def _wsola(x, f, win_s=.030, search_s=.007):
    """Time-stretch x to f times its length without changing its pitch (waveform-similarity overlap-add, 50 percent overlap); f > 1 is slower. Used only on a few short voice lines."""
    x = np.asarray(x, dtype=float)
    n = len(x)
    W = int(win_s * SR) // 2 * 2
    H = W // 2
    S = int(search_s * SR)
    nout = int(round(n * f))
    ha = H / f
    pad = S + W
    xp = np.concatenate([np.zeros(pad), x, np.zeros(3 * W + 2 * S)])
    out = np.zeros(nout + 3 * W)
    wsum = np.zeros(nout + 3 * W)
    win = np.hanning(W)
    prev = pad
    out[:W] += xp[prev:prev + W] * win
    wsum[:W] += win
    k = 1
    while k * H < nout:
        nominal = pad + int(round(k * ha))
        ref = xp[prev + H: prev + H + W]
        lo = nominal - S
        seg = xp[lo: nominal + S + W]
        corr = signal.correlate(seg, ref, mode="valid", method="fft")
        en = np.sqrt(np.convolve(seg ** 2, np.ones(W), "valid") + 1e-9)
        start = lo + int(np.argmax(corr / en))
        out[k * H:k * H + W] += xp[start:start + W] * win
        wsum[k * H:k * H + W] += win
        prev = start
        k += 1
    wsum[wsum < 1e-3] = 1.0
    return (out / wsum)[:nout]


# ---------------------------------------------------------------- the cast, as Episode 19 left them
def fx_bind(x, menace=False):
    """Binder: a bright, cheerful assistant, slightly synthetic: a lift at 2.2 to 7.5 kHz, a faint detuned double (a 6 ms delay that flutters at 5.5 Hz: a plastic sheen) and a 10-bit grain."""
    y = x + .24 * _bp4(x, 2200, 7500, 2)
    y = y + .16 * _wobble(_delay(x, 6, 1.0), .0006, 5.5)
    y = np.round(y * 700) / 700
    if menace:
        y = _lp4(y, 5200, 2) + .55 * _lp4(x, 300, 2) + .2 * _lp4(_delay(x, 70, 1.0), 1400, 2)
        y = _wobble(y, .0004, 3.1)
    return _match_active_rms(y, x)


def fx_bind_dying(x, seed):
    """Binder on 'Great! I'll...' as his battery goes: the cheerful voice for the first half, then a tape-stop (the read speed falls to a third over the last 45 percent while the top is closed off and
    the grain coarsens), so the 'I'll' sags and stops. The length is unchanged."""
    y = fx_bind(x)
    n = len(y)
    t = np.arange(n) / SR
    T = n / SR
    t0 = .52 * T
    u = np.clip((t - t0) / (T - t0), 0, 1)
    s = 1 - .68 * u ** 1.25
    pos = np.cumsum(s) - s[0]
    y = np.interp(pos, np.arange(n), y)
    y = _tv_filter(y, 9000 * (1 - u) ** 1.5 + 500, .8, "lp")
    q = 700 * (1 - .93 * u ** 1.5)
    y = np.round(y * q) / q * (1 - .55 * u ** 1.4)
    return _match_active_rms(y, x)


def fx_onion(x, seed):
    """Onion: soft and tearful. A tremble (a 5.8 Hz tremolo at 12 percent and a 0.15 ms vibrato), the top rounded off (-3 dB above 4 kHz) and a breath of air riding the voice (-30 dB)."""
    n = len(x)
    t = np.arange(n) / SR
    y = _wobble(x, .00015, 5.8) * (1 - .12 * (.5 + .5 * np.sin(2 * np.pi * 5.8 * t)))
    y = y - .3 * _hp4(y, 4000)
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    y = y + _bp4(rng6(seed).uniform(-1, 1, n), 1500, 6000) * env * .05
    return _match_active_rms(y, x)


def fx_brenda(x, seed):
    """Brenda (bf_alice, 0.88, four semitones down): frail, dry and close. The close microphone's proximity (+2.5 dB under 250 Hz), a tremor in the pitch and the level (4.4 Hz: 0.2 ms and
    7 percent), the top softened (-2 dB above 5.5 kHz) and a breath riding the voice (-27 dB: she is out of air). The room does not get her (the mixer keeps her out of the reverb)."""
    n = len(x)
    t = np.arange(n) / SR
    y = x + .33 * _lp4(x, 250, 2)
    y = _wobble(y, .0002, 4.4) * (1 - .07 * (.5 + .5 * np.sin(2 * np.pi * 4.4 * t + 1)))
    y = y - .22 * _hp4(y, 5500)
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    y = y + _bp4(rng6(seed + 11).uniform(-1, 1, n), 1800, 7500) * env * .075
    return _match_active_rms(y, x)


def fx_moon(x, seed, close=False):
    """The Moon at the window (am_onyx, plus the series' own echoes baked in): warm, slightly distant, a little air. A warm shelf (+2.5 dB under 200 Hz), the top rolled off above 6.5 kHz (-3 dB:
    glass between him and us), a window's reflections (a 0.7 s tail closed to 3 kHz at -15 dB) and air (-33 dB of 4 to 10 kHz riding the voice). `close` (the night's setting Moon): nearer, the
    reflections at -21 dB, the top only -1.5 dB, a little more warmth (+3.5 dB under 200 Hz) and a breath of proximity."""
    n = len(x)
    y = x + (.42 if close else .3) * _lp4(x, 200, 2) - (.15 if close else .3) * _hp4(x, 6500)
    r = rng6(seed + 23)
    nir = int(.7 * SR)
    t = np.arange(nir) / SR
    ir = _lp4(r.uniform(-1, 1, nir), 3000, 2) * np.exp(-6.9 * t / .7)
    ir[:int(.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    y = y + (.09 if close else .17) * signal.fftconvolve(y, ir)[:n]
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    y = y + _bp4(r.uniform(-1, 1, n), 4000, 10000, 1) * env * (.03 if close else .022)
    return _match_active_rms(y, x)


def fx_res(x):
    """The residents (Pear, Banana, Cranberry, Goji): the day room's warmth on the voice itself, +2 dB under 260 Hz and the top eased (-2.5 dB above 5 kHz), so four old voices sit in lamp light."""
    y = x + .26 * _lp4(x, 260, 2) - .26 * _hp4(x, 5000)
    return _match_active_rms(y, x)


# ---------------------------------------------------------------- the devices and the weather (new in Episode 20)
def fx_speakerphone(x, seed):
    """Artichoke and Melon on the conference speakerphone: band-limited to 350 to 3400 Hz (a 24 dB/oct low-pass, a 18 dB/oct high-pass), the plastic horn's boxy mid (+3 dB at 1.25 kHz), a little
    speaker distortion, a touch of compression (3:1 over -26 dBFS), the far end's small hollow conference room (0.3 s, 450 to 2800 Hz, three hard early reflections of a glass table, -13 dB) and a
    faint digital artefact at the start of every line (the first 70 ms through a 6 kHz sample-and-hold and a 5-bit quantiser that fades into the clean voice, and a 2.3 kHz codec blip at -32 dB)."""
    n = len(x)
    y = _lp4(_hp4(x, 350, 3), 3400, 4)
    y = y + .4 * _res(y, 1250, 2.0)
    y = _softclip(y, 1.5)
    y = _comp(y, -26.0, 3.0, .003, .09, 3.0)
    ir = _small_ir(seed + 3, rt=.3, pre=.004, lo=450, hi=2800, taps=((.0053, .6), (.0097, .5), (.0143, .4)))
    y = y + .22 * signal.fftconvolve(y, ir)[:n]
    y = _lp4(_hp4(y, 330, 2), 3500, 2)
    k = min(n, int(.07 * SR))
    seg = y[:k].copy()
    sh = np.repeat(seg[::8], 8)[:k]
    sh = np.round(sh * 20) / 20
    w = np.linspace(1, 0, k) ** .8
    y[:k] = sh * w + seg * (1 - w)
    kb = min(n, int(.025 * SR))
    y[:kb] += np.sin(2 * np.pi * 2300 * np.arange(kb) / SR) * np.exp(-np.arange(kb) / (.006 * SR)) * .025 * (np.max(np.abs(y)) + 1e-9)
    return _match_active_rms(y, x)


def fx_tv(x, seed):
    """The weather anchor on the wall TV: bright, squashed and a little over-eager. A small speaker (a 190 Hz 18 dB/oct high-pass, closed at 7.5 kHz), a nasal lift at 1.5 kHz and a presence lift at
    3 kHz (+3 dB), broadcast compression (4:1 over -28 dBFS, fast), a gentle saturation, a faint studio (0.16 s, bright, -20 dB) and the TV's own hiss (-48 dB)."""
    n = len(x)
    y = _lp4(_hp4(x, 190, 3), 7500, 3)
    y = y + .25 * _res(y, 1500, 1.5) + .45 * _res(y, 3000, 1.2)
    y = _softclip(y, 2.0)
    y = _comp(y, -28.0, 4.0, .002, .06, 4.0)
    ir = _small_ir(seed + 5, rt=.16, pre=.003, lo=500, hi=7000, taps=((.0061, .5), (.0112, .4)))
    y = y + .1 * signal.fftconvolve(y, ir)[:n]
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    y = y + _bp4(rng6(seed + 8).uniform(-1, 1, n), 2500, 9000, 1) * (.004 + .01 * env / (env.max() + 1e-9)) * np.max(np.abs(x))
    return _match_active_rms(y, x)


def fx_cab(x, seed):
    """Turnip (am_onyx, 0.9, two semitones down: deep and flat) heard through a truck cab window: low-passed at 4 kHz (24 dB/oct), the lows under 85 Hz trimmed, the cab's two boxy resonances
    (230 Hz and 650 Hz, +2.5 dB) and a touch of cab reverb (0.11 s, hard metal walls: three reflections at 2.2, 3.8 and 6.1 ms, -9 dB). The engine is not here (it is the cue's, `plowengine`)."""
    n = len(x)
    y = _lp4(_hp4(x, 85, 2), 4000, 4)
    y = y + .3 * _res(y, 230, 1.5) + .25 * _res(y, 650, 2.0)
    ir = _small_ir(seed + 7, rt=.11, pre=.002, lo=250, hi=3200, taps=((.0022, .6), (.0038, .5), (.0061, .4)))
    y = y + .35 * signal.fftconvolve(y, ir)[:n]
    return _match_active_rms(y, x)


def fx_window_far(x, seed):
    """Turnip outside the window glass at dawn: heavily filtered (a high-pass at 140 Hz, a 24 dB/oct low-pass at 1.4 kHz), the glass pane's own thump (a resonance at 520 Hz), smeared by distance (a
    45 ms low-passed echo at -9 dB) and 5 dB quieter."""
    y = _lp4(_hp4(x, 140, 2), 1400, 4)
    y = y + .5 * _res(y, 520, 2.5)
    y = y * .85 + .35 * _lp4(_delay(y, 45, 1.0), 1000, 2)
    return _match_active_rms(y, x) * 10 ** (-5 / 20)


def fx_phone(x, seed):
    """Eggplant on Strawberry's phone, on speaker, from a ditch: 300 to 3400 Hz, mild compression (2.5:1), a thin tail (a tiny bright speaker room, 0.12 s, 900 to 3200 Hz, -19 dB) and one tiny packet
    dropout at a word boundary (28 ms of the next word's first sound lost, a few milliseconds of codec hiss in the hole) if the line has a word boundary in it, never more than one."""
    n = len(x)
    y = _lp4(_hp4(x, 300, 3), 3400, 4)
    y = _softclip(y, 1.4)
    y = _comp(y, -26.0, 2.5, .004, .07, 2.0)
    ir = _small_ir(seed + 9, rt=.12, pre=.002, lo=900, hi=3200, taps=((.0031, .5), (.0058, .4)))
    y = y + .11 * signal.fftconvolve(y, ir)[:n]
    hop = 240
    env = _env10(y, hop)
    pk = env.max()
    lo_, hi_ = int(.18 * len(env)), int(.88 * len(env))
    gap = 0
    for i in range(lo_, hi_):
        if env[i] < .25 * pk:
            gap += 1
            continue
        if gap >= 6 and env[i] > .5 * pk:               # a word begins after at least 30 ms of near silence
            a = i * hop - int(.004 * SR)
            L = int(.028 * SR)
            if 0 < a and a + L < n:
                fade = np.minimum(1, np.minimum(np.arange(L), L - np.arange(L)) / (.003 * SR))
                hole = _bp4(rng6(seed + 31).uniform(-1, 1, L), 1200, 3400, 1) * .12 * pk
                y[a:a + L] = y[a:a + L] * (1 - fade) + hole * fade
            break
        gap = 0
    return _match_active_rms(y, x)


def fx_outdoor(x):
    """A voice in falling snow: nothing to bounce off, everything absorbed. Thin and dry and close: the low shelf cut (-2 dB under 300 Hz), a high-pass at 130 Hz, the very top soaked up (-2 dB above
    6.5 kHz), 1 dB down. No room is added by the mixer (the lot has no reverb)."""
    y = x - .25 * _lp4(x, 300, 2)
    y = _hp4(y, 130, 2)
    y = y - .22 * _hp4(y, 6500, 2)
    return _match_active_rms(y, x) * 10 ** (-1 / 20)


def fx_buried(x, seed):
    """Onion with her head and her clipboard hand out of a wall of snow (`forecast` o3): her usual tremble, then everything above 900 Hz gone (a 24 dB/oct low-pass: a head in a drift), the chest
    of a close cavity (+4 dB at 380 Hz), no room at all and a faint breathy cold riding the words (a band of 400 to 1800 Hz air at -26 dB, shivering at 7 Hz). Slightly quieter: snow eats sound."""
    n = len(x)
    y = fx_onion(x, seed)
    y = _lp4(y, 900, 4)
    y = y + .5 * _res(y, 380, 2.0)
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    t = np.arange(n) / SR
    y = y + _bp4(rng6(seed + 41).uniform(-1, 1, n), 400, 1800, 1) * env * .06 * (.6 + .4 * np.sin(2 * np.pi * 7 * t))
    return _match_active_rms(y, x) * 10 ** (-1.5 / 20)


def fx_moon_weather(x, seed):
    """The Moon behind the weather (`dayroom` mo1): distant, closed at 2.5 kHz (24 dB/oct), smeared (a 60 ms echo at -17 dB), a little wind going through him (a howl band that wanders around 520 Hz
    at -17 dB under the voice) and 3 dB quieter. No warm pad (the score leaves him alone)."""
    n = len(x)
    t = np.arange(n) / SR
    y = _lp4(x, 2500, 4)
    y = y * .85 + .14 * _lp4(_delay(y, 60, 1.0), 1200, 2)
    fc = 520 * (1 + .22 * np.sin(2 * np.pi * .9 * t) + .1 * _smooth_rand(n / SR, seed + 51, .6))
    howl = _tv_filter(rng6(seed + 52).uniform(-1, 1, n), fc, 9.0, "bp") * (.55 + .45 * np.sin(2 * np.pi * .37 * t + 1))
    howl = howl * (np.sqrt(np.mean(y ** 2)) / (np.sqrt(np.mean(howl ** 2)) + 1e-12)) * 10 ** (-17 / 20)
    return _match_active_rms(y + howl, x) * 10 ** (-3 / 20)


def fx_oncoming(x, seed):
    """The oncoming Strawberry (`night` s4, s6): the same voice one semitone lower and 4 percent slower, so the twin shot reads as two women. The pitch is a varispeed drop of one semitone (which is
    5.9 percent slower) followed by a waveform-similarity time-compression of 1.8 percent (so the finished line is 4.0 percent longer than the original at the new pitch)."""
    y = BA.semis_resample(np.asarray(x, dtype=float), -1)
    y = _wsola(y, 1.04 * len(x) / len(y))
    return _match_active_rms(y, x)


# ---------------------------------------------------------------- which treatment does each line get? (scene, line id) first, then the speaker
LINE_KIND = {
    ("forecast", "o3"): "onion_buried",
    ("blackout", "b2"): "bind_dying",
    ("dayroom", "mo1"): "moon_weather",
    ("night", "mo1"): "moon_close", ("night", "mo2"): "moon_close", ("night", "mo3"): "moon_close",
    ("night", "tu3"): "window",
    ("night", "s4"): "oncoming", ("night", "s6"): "oncoming",
}
WHO_KIND = {"bind": "bind", "onion": "onion", "brenda": "brenda", "moon": "moon", "pear": "res", "banana": "res", "cran": "res", "goji": "res",
            "arti": "speaker", "melon": "speaker", "wx": "tv", "egg": "phone"}
KIND_V = {"speaker": "1", "tv": "1", "cab": "1", "phone": "1", "window": "1", "outdoor": "1", "onion_buried": "1", "moon_weather": "1", "oncoming": "1", "bind_dying": "1", "moon_close": "1", "onion_outdoor": "1"}


def line_kind(scene, lid, who):
    """The treatment of a line: the special cases first (keyed by scene and line id), then the lot (every voice outdoors, Turnip in his cab, Eggplant on her phone), then the speaker's own."""
    k = LINE_KIND.get((scene, lid))
    if k:
        return k
    if scene == "lot":
        if who == "turnip":
            return "cab"
        if who == "egg":
            return "phone"
        return "onion_outdoor" if who == "onion" else "outdoor"
    return WHO_KIND.get(who, "plain")


def apply_kind(kind, mono, seed):
    if kind == "bind":
        return fx_bind(mono)
    if kind == "bind_dying":
        return fx_bind_dying(mono, seed)
    if kind == "onion":
        return fx_onion(mono, seed)
    if kind == "onion_outdoor":
        return fx_outdoor(fx_onion(mono, seed))
    if kind == "onion_buried":
        return fx_buried(mono, seed)
    if kind == "brenda":
        return fx_brenda(mono, seed)
    if kind == "moon":
        return fx_moon(mono, seed)
    if kind == "moon_close":
        return fx_moon(mono, seed, close=True)
    if kind == "moon_weather":
        return fx_moon_weather(mono, seed)
    if kind == "res":
        return fx_res(mono)
    if kind == "speaker":
        return fx_speakerphone(mono, seed)
    if kind == "tv":
        return fx_tv(mono, seed)
    if kind == "cab":
        return fx_cab(mono, seed)
    if kind == "window":
        return fx_window_far(mono, seed)
    if kind == "phone":
        return fx_phone(mono, seed)
    if kind == "outdoor":
        return fx_outdoor(mono)
    if kind == "oncoming":
        return fx_oncoming(mono, seed)
    return mono


# ---------------------------------------------------------------- the per-line cache (build/ep21_sound/voice/)
VOX_DIR = [None]


def _vox_cache(tag, key, make):
    """A float64 wav under <out>/voice/ named by `tag`, valid while its .key file holds `key`; make() builds it (mono (n,) or stereo (2, n))."""
    base = os.path.join(VOX_DIR[0], tag)
    try:
        if open(base + ".key").read() == key:
            x, _ = sf.read(base + ".wav", dtype="float64")
            return x.T if x.ndim == 2 else x
    except (OSError, RuntimeError):
        pass
    x = np.asarray(make(), dtype=float)
    sf.write(base + ".wav", x.T if x.ndim == 2 else x, SR, subtype="DOUBLE")
    open(base + ".key", "w").write(key)
    return x


_SPEECH = []        # [(scene id, beat)] in the order the mixer asks for the voices
_TTS_K = [0]
_TTS_ORIG = [None]
KINDS = {}          # tag ('scene_beat') -> the treatment it got (for the cue report)


def _load_speech():
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    _SPEECH[:] = [(sc["id"], b) for sc in script["scenes"] for b in sc["beats"] if "pause" not in b]


def tts20(kokoro, v, say):
    """The mixer's tts6, replaced: the plain line (cached per line, the Episode 19 keys), plus the treated version that is placed in the mix (cached under the treatment's name). The _Vox carries who is speaking."""
    k = _TTS_K[0]
    _TTS_K[0] += 1
    sc, b = _SPEECH[k] if k < len(_SPEECH) else (None, None)
    if b is None or b.get("say") != say:
        return _Vox(_TTS_ORIG[0](kokoro, v, say), None)
    tag = f"{sc}_{b['id']}"
    raw_key = hashlib.sha1(json.dumps([v, say, "raw"], sort_keys=True).encode()).hexdigest()[:16]
    mono = _vox_cache(tag + ".raw", raw_key, lambda: _TTS_ORIG[0](kokoro, v, say))
    who = b["who"]
    kind = line_kind(sc, b["id"], who)
    KINDS[tag] = kind
    if kind == "plain":
        return _Vox(mono, None, who, tag)
    key = hashlib.sha1(json.dumps([raw_key, kind, FXV, KIND_V.get(kind, "")]).encode()).hexdigest()[:16]
    seed = int(hashlib.sha1(tag.encode()).hexdigest()[:6], 16)
    return _Vox(mono, _vox_cache(tag + ".fx", key, lambda: apply_kind(kind, mono, seed)), who, tag)


# ---------------------------------------------------------------- the rooms (impulse responses) and the reverb
ROOM20 = {   # rt: reverb time (s); wet: level of the tail against the dry sound; damp: where the tail is closed off; pre: pre-delay; taps: early reflections (s, gain)
    "title":    dict(rt=.42, wet=.14, damp=6500, pre=.006, taps=((.011, .5), (.019, .4), (.031, .3))),      # a study desk at night: small, wooden
    "forecast": dict(rt=.50, wet=.13, damp=5200, pre=.008, taps=((.014, .4), (.027, .3), (.041, .2))),      # the nurses' station: ceiling tile, carpet, glass doors
    "blackout": dict(rt=.55, wet=.14, damp=4200, pre=.008),                                                  # the same station in the dark: nothing has changed but it feels bigger
    "dayroom":  dict(rt=.62, wet=.16, damp=3400, pre=.014, taps=((.019, .3), (.033, .22))),                  # carpet, curtains, lamp light, as in Episode 19
    "night":    dict(rt=.52, wet=.12, damp=4400, pre=.010),                                                  # the station on the generator
    "end":      dict(rt=.40, wet=.10, damp=5200, pre=.006),                                                  # a TV room
}
OUTDOORS = ("lot",)       # no reverb at all
_IRS = {}


def _room_ir(name):
    """The stereo impulse response of a room in ROOM20 (cached): decaying noise closed off at `damp`, early reflections, normalised to unit energy as the series' rooms are."""
    if name in _IRS:
        return _IRS[name]
    sp = ROOM20[name]
    rt, pre = sp["rt"], sp.get("pre", .01)
    n = int((rt * 1.3 + pre) * SR)
    t = np.arange(n) / SR
    r = rng6(sum(map(ord, name)) + 77)
    ir = r.standard_normal((2, n)) * np.exp(-6.9 * t / rt)
    ir[:, :int(pre * SR)] = 0
    for c in range(2):
        ir[c] = _lp4(ir[c], sp.get("damp", 5200), 1)
    for tap, gn in sp.get("taps", ((.017, .5), (.029, .4), (.043, .3))):
        ir[0, int(tap * SR)] += gn
        ir[1, int((tap + .004) * SR)] += gn
    ir /= np.sqrt(np.sum(ir ** 2))
    _IRS[name] = ir
    return ir


def _rev(seg, name):
    """The tail of `seg` (2, n) in room `name`: the full convolution, scaled by the room's wet level."""
    ir = _room_ir(name)
    return np.stack([signal.fftconvolve(seg[c], ir[c], mode="full") for c in range(2)]) * ROOM20[name]["wet"]


def scene_reverb(sid, seg, a):
    """The reverb of scene `sid`'s dry signal `seg` (2, n) whose first sample is sample `a` of the film. The lot is outdoors in falling snow: no reverb at all (zeros)."""
    if sid in OUTDOORS:
        return np.zeros_like(seg)
    if sid in ROOM20:
        return _rev(seg, sid)
    return None


# ---------------------------------------------------------------- place2, patched: voices place their treated version; cues dip under speech
DUCK_DB = {   # how far a cue is dipped (dB) while a voice speaks, by effect name; anything missing here is not dipped. The hits the picture lands on are never dipped.
    "sniffle": 4, "typing": 6, "step": 7, "snowstep": 7, "plowengine": 5, "plowdist": 6, "windswell": 5, "windgust": 3, "stopwatchticks": 3, "swtick": 3, "slurp": 3, "cupset": 2,
    "clockspin": 4, "breath": 2, "shovel": 4, "flashlight": 3, "lapsewhoosh": 3, "whoosh_s": 3, "rustle": 3, "plowrumble": 6, "genstart": 9, "relay": 6, "powerdown": 6, "snowdump": 6, "doorgust": 4,
    "plowdump": 5, "plowscrape": 3, "thud": 3, "hum_on": 3,
    "bed_title": 3, "bed_forecast": 4, "bed_lot": 9, "bed_blackout": 3, "bed_dayroom": 4, "bed_night": 4, "bed_end": 2,
}
NOREV = ("bed_title", "bed_forecast", "bed_lot", "bed_blackout", "bed_dayroom", "bed_night", "bed_end", "genstart", "lapsewhoosh", "clockspin", "windswell", "whoosh_s", "rustle", "glint", "plowrumble")
DRY_WHO = ("brenda",)                                  # voices that skip the room: close and dry
DRY_TAGS = ("forecast_o3", "night_tu3")                # lines that skip the room: a head in a snow drift, a voice outside the glass
LINE_PAN = {"night_s3": -.30, "night_s5": -.30, "night_s4": .30, "night_s6": .30}      # the twin shot: the outgoing Strawberry on the left, the oncoming one on the right
PHONE_TAGS = ("lot_e1", "lot_e2", "lot_e3", "lot_e4")
_DRY = [None, None]                # [the mixer's dry buffer (the first buffer place2 is given), a buffer of the same size that holds only the NOREV cues and the dry voices]
_WIN = {}
_SM = [None]


def _dry_vox(clip):
    return clip.who in DRY_WHO or clip.tag in DRY_TAGS


def _speech_gate(N):
    """The mixer's own 'someone is talking' curve (0..1), computed with a fast filter instead of a direct convolution."""
    if _SM[0] is None or len(_SM[0]) != N:
        sp = np.zeros(N)
        for a, d in _WIN.values():
            sp[max(0, int((a - .08) * SR)):int((a + d + .2) * SR)] = 1.0
        _SM[0] = uniform_filter1d(sp, int(.18 * SR) | 1, mode="constant").clip(0, 1) ** .6
    return _SM[0]


_PLACE2 = A6.place2
_REVERB6 = A6.reverb
PHONE = {"t": None, "pan": None, "source": "none"}


def _phone_pan(at, n):
    """Eggplant's pan over a line: where the phone is in Strawberry's hand. From build/ep21/phone_path.json (absolute seconds, {t, pan} -1..1 or {t, x} in px of a 1080 px frame) when it exists; else
    Strawberry's own side of the frame (-0.14) with the small drift of a hand holding a phone."""
    t = at + np.arange(n) / SR
    if PHONE["t"] is not None:
        return np.interp(t, PHONE["t"], PHONE["pan"])
    return -.14 + .05 * np.sin(2 * np.pi * .35 * t) + .02 * np.sin(2 * np.pi * 1.3 * t + 1)


def reverb_20(seg, room):
    """The mixer's per-scene room (A6.reverb), replaced: each scene has its own room (ROOM20; the lot has none), minus the cues and voices that must stay dry. `seg` is a view of the mixer's dry buffer,
    so its offset in that buffer (the scene's first sample) is read from the memory address; the scene is the one that starts there."""
    dry, nr = _DRY
    if dry is not None and seg.base is dry:
        a = (seg.__array_interface__["data"][0] - dry.__array_interface__["data"][0]) // dry.itemsize
        sid = next((s["id"] for s in _timeline()["scenes"] if int(s["start"] * SR) == a), None)
        sub = nr[:, a:a + seg.shape[1]] if nr is not None else None
        x = seg - sub if (sub is not None and sub.shape == seg.shape and np.any(sub)) else seg
        r = scene_reverb(sid, x, a) if sid else None
        if r is not None:
            return r
        return _REVERB6(x, room)
    return _REVERB6(seg, room)


def place2_20(buf, clip, at, gain=1.0, pan=0.0):
    if _DRY[0] is None:                                  # the mixer places the voices into `dry` first
        _DRY[0] = buf
        _DRY[1] = np.zeros_like(buf)
    if isinstance(clip, _Vox):
        _WIN[round(float(at), 4)] = (float(at), len(clip) / SR)
        alt = clip.alt
        v = np.asarray(clip) if alt is None else alt
        pan = LINE_PAN.get(clip.tag, pan)
        if clip.tag in PHONE_TAGS and v.ndim == 1:
            pc = np.clip(_phone_pan(at, len(v)), -1, 1)
            th = (pc + 1) * np.pi / 4
            v, pan = np.stack([v * np.cos(th), v * np.sin(th)]), 0.0
        _PLACE2(buf, v, at, gain, pan)
        if _dry_vox(clip) and buf is _DRY[0]:
            _PLACE2(_DRY[1], v, at, gain, pan)
        return
    name = getattr(clip, "sfx", None) or "step"
    db = DUCK_DB.get(name)
    if db and _WIN:
        i = int(round(at * SR))
        n = min(clip.shape[-1], buf.shape[1] - i)
        if n > 0:
            sm = _speech_gate(buf.shape[1])[i:i + n]
            clip = np.asarray(clip)[..., :n] * (1 - (1 - 10 ** (-db / 20)) * sm)
    if name in NOREV and buf is _DRY[0]:                  # the dry buffer holds the same (dipped) clip that the mix does, so that the reverb's input is exactly what is not dry
        _PLACE2(_DRY[1], np.asarray(clip), at, gain, pan)
    _PLACE2(buf, np.asarray(clip), at, gain, pan)


# ================================================================ the frozen timeline and the script's cue times
_TL = {}
_ABS = {}


def _timeline():
    """The frozen build/ep21/timeline.json (scene starts, beats and lines), read once."""
    if not _TL:
        p = os.path.join(HERE, EPD, "timeline.json")
        _TL.update(json.load(open(p)) if os.path.exists(p) else {"scenes": [], "lines": []})
    return _TL


def _scene_info(sid):
    return next((s for s in _timeline()["scenes"] if s["id"] == sid), None)


def _cue_times(name):
    """Absolute times (s) of every cue of the script called `name`, in time order, from the frozen timeline's beat times."""
    if not _ABS:
        tab = _scene_table()
        for t, nm, g, p in (_scripted(tab) if tab else []):
            _ABS.setdefault(nm, []).append(t)
        for v in _ABS.values():
            v.sort()
        _ABS.setdefault("", [])
    return _ABS.get(name, [])


def _beat_abs(sid, beat):
    """(start, end) of a beat in absolute seconds, or None."""
    s = _scene_info(sid)
    if not s or beat not in s["beats"]:
        return None
    return s["start"] + s["beats"][beat]["s"], s["start"] + s["beats"][beat]["e"]


def _cue_local(sid, name, k=0):
    """Scene-local time of the k-th cue called `name` in scene `sid` (from the script and the frozen timeline), or None."""
    s = _scene_info(sid)
    if not s:
        return None
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    sc = next((x for x in script["scenes"] if x["id"] == sid), None)
    n = 0
    for b in (sc or {"beats": []})["beats"]:
        for c in b.get("sfx", []):
            if c[0] == name:
                if n == k:
                    bt = s["beats"][b["id"]]
                    return bt["e"] if c[1] == "end" else bt["s"] + c[1]
                n += 1
    return None


# ================================================================ the world: the time-lapse's clock, the wind, the engines
class _P(np.ndarray):
    """A clip that adds like _sum: clips of different lengths are padded with silence (the effects' small building blocks return these, so `thump + noise burst` is a sum of two events that need not be as long)."""

    def __new__(cls, x):
        return np.asarray(x, dtype=float).view(cls)

    def __array_wrap__(self, out, context=None, return_scalar=False):
        out = np.asarray(out)
        return out[()] if out.ndim == 0 else out.view(_P)

    def __add__(self, o):
        a, b = np.asarray(self), np.asarray(o)
        if a.ndim == 1 and b.ndim == 1 and a.shape != b.shape:
            r = np.zeros(max(len(a), len(b)))
            r[:len(a)] += a
            r[:len(b)] += b
            return _P(r)
        return _P(a + b)

    __radd__ = __add__

    def __sub__(self, o):
        return self.__add__(-np.asarray(o))

    def __rsub__(self, o):
        return _P(-np.asarray(self)).__add__(o)


def _wrapP(fn):
    def run(*a, **k):
        return _P(fn(*a, **k))
    run.__doc__ = fn.__doc__
    return run


_thump, _ping, _band, _glass = _wrapP(_thump), _wrapP(_ping), _wrapP(_band), _wrapP(_glass)


def _rms(x, r=1.0):
    """Scale x to RMS r (a bed's component)."""
    return x * (r / (np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-12))


def _ctr(x, pan=0.0):
    """A mono source placed in the field (equal power)."""
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def _st(x):
    x = np.asarray(x)
    return x if x.ndim == 2 else np.stack([x, x])


def _smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


class Lapse:
    """The time-lapse of `night` as the sound needs it: u(t) (0 in real time, 1 at the picture's fastest world speed), 10 Hz, absolute seconds.
    Read from build/ep21/lapse.json ({t, worldMin, speed, sun, moonX}; `speed` is world minutes per second, 1/60 outside the lapse) when it exists; else the fixed curve of the brief (an ease in over 0.7 s,
    a hold, an ease out over 0.9 s, across the `lapse` beat), and the build says which."""

    def __init__(self):
        self.source = "none"
        self.a = self.b = None
        self.ts = self.u = self.sun = self.wm = None
        self.fixed = True

    def setup(self, path=None):
        bt = _beat_abs("night", "lapse")
        sc = _scene_info("night")
        if not bt or not sc:
            return
        self.a, self.b = bt
        rows = None
        if path and os.path.exists(path):
            try:
                rows = json.load(open(path))
            except (OSError, ValueError):
                rows = None
        if isinstance(rows, dict):
            rows = rows.get("samples") or rows.get("rows") or rows.get("lapse")
        if rows and len(rows) > 20 and all("speed" in r for r in rows):
            rows = sorted(rows, key=lambda r: r["t"])
            shift = sc["start"] if rows[0]["t"] < sc["start"] - 1.0 else 0.0            # the brief says absolute seconds; a scene-local file is shifted
            ts = np.array([r["t"] + shift for r in rows], dtype=float)
            sp = np.array([float(r["speed"]) for r in rows], dtype=float)
            s0, s1 = sp.min(), sp.max()
            if s1 - s0 > 1.0:
                self.ts = ts
                self.u = uniform_filter1d(np.clip((sp - s0) / (s1 - s0), 0, 1), 3, mode="nearest")
                self.sun = np.array([float(r.get("sun", 0.0)) for r in rows], dtype=float)
                wm = np.array([float(r.get("worldMin", np.nan)) for r in rows], dtype=float)
                self.wm = wm if np.isfinite(wm).all() else None
                self.fixed = False
                self.source = f"{os.path.relpath(path, HERE)} ({len(rows)} samples, {ts[0]:.2f} to {ts[-1]:.2f} s, speed {s0:.3f} to {s1:.1f} min/s)"
                return
        ts = np.arange(sc["start"], sc["start"] + sc["dur"] + .05, .1)
        u = np.minimum(_smoothstep((ts - self.a) / .7), _smoothstep((self.b - ts) / .9)) * ((ts >= self.a) & (ts <= self.b))
        self.ts, self.u, self.sun = ts, u, np.clip((ts - self.a) / (self.b - self.a), 0, 1) ** 2
        self.fixed = True
        self.source = f"the fixed curve (ease in 0.7 s, hold, ease out 0.9 s across {self.a:.2f} to {self.b:.2f} s; lapse.json not found)"

    @property
    def active(self):
        return self.ts is not None

    def u_at(self, t):
        return np.interp(t, self.ts, self.u, left=0.0, right=0.0)


LAPSE = Lapse()


def warp(src, t0, n_out, rmax):
    """Read `src` (mono (n,) or (2, n)) as a tape whose speed follows the time-lapse: from absolute time t0, n_out output samples; the playback rate is 1 + (rmax - 1) u(t), so the sound
    speeds up and rises in pitch with the picture's world speed, then comes back down to real time. src sample 0 is read at t0. Returns the same shape as src with n_out samples."""
    t = t0 + np.arange(n_out) / SR
    r = 1.0 + (rmax - 1.0) * (LAPSE.u_at(t) if LAPSE.active else 0.0)
    pos = np.cumsum(r) - r[0]
    L = src.shape[-1]
    pos = np.minimum(pos, L - 1.001)
    i0 = pos.astype(np.int64)
    fr = pos - i0
    return src[..., i0] * (1 - fr) + src[..., i0 + 1] * fr


# ---------------------------------------------------------------- the wind
def _gust_shape(t, t0, dur):
    """One gust: rises over 30 percent of `dur`, dies away over about the rest (0..1)."""
    x = (t - t0) / dur
    return np.where(x < 0, 0.0, np.where(x < .3, (np.clip(x, 0, .3) / .3) ** 1.5, np.exp(-(x - .3) / .38)))


def _gust_env(d, seed, gusts=(), base=.5, var=.26):
    """The strength of the wind over `d` seconds, 0.08 to 1.7: a slow independent swell (two incommensurate wanders) plus the scripted gusts [(t0, duration, amplitude), ...]."""
    t = tarr(d)
    g = base + var * _smooth_rand(d, seed + 1, .11) + .5 * var * _smooth_rand(d, seed + 2, .37)
    for t0, dur, amp in gusts:
        g = g + amp * _gust_shape(t, t0, dur)
    return np.clip(g, .08, 1.7)


def wind(d, seed, gusts=(), wall=None, howl=1.0, rumble=1.0, hiss=1.0, base=.5, var=.26, env=None):
    """A blizzard (2, n), at unit RMS: a low rumble (noise under 110 Hz), the roar of the body (140 to 900 Hz), a tonal howl whose pitch and strength follow the gusts (a narrow resonance
    around 360 Hz that climbs to about 560 as the wind picks up, and a quieter one at 2.3 times that), and the hush of falling snow (a very soft 2.8 to 8 kHz). `gusts`: [(t0, duration, amplitude)];
    `wall`: a low-pass (Hz) that the wind is heard through (an indoor leak: the howl is thin and low); `env`: a ready-made strength curve instead of the random one."""
    n = _n(d)
    g = env if env is not None else _gust_env(d, seed, gusts, base, var)
    chans = []
    for c in range(2):
        s = seed + 100 * c
        rum = _rms(_lp4(noise6(d, s + 1), 110, 3)) * g ** 1.2 * rumble
        body = _rms(_bp4(noise6(d, s + 2), 140, 900, 2)) * g * .75
        hs = _rms(_bp4(noise6(d, s + 3), 2800, 8000, 1)) * (.35 + .65 * g) * .1 * hiss
        chans.append(rum + body + hs)
    wander = _smooth_rand(d, seed + 7, .18)
    fc = 360 * (.75 + .55 * np.clip(g, 0, 1.6)) * (1 + .12 * wander)
    h1 = _rms(_tv_filter(noise6(d, seed + 8), fc, 14.0, "bp")) * g ** 2.0 * .42 * howl
    h2 = _rms(_tv_filter(noise6(d, seed + 9), fc * 2.27, 10.0, "bp")) * g ** 2.4 * .17 * howl
    pan = .3 * _smooth_rand(d, seed + 10, .09)
    th = (pan + 1) * np.pi / 4
    chans[0] = chans[0] + (h1 + h2) * np.cos(th)
    chans[1] = chans[1] + (h1 + h2) * np.sin(th)
    out = np.stack(chans)
    if wall:
        out = _lp4(out, wall, 3)
    return _rms(out)


# ---------------------------------------------------------------- engines
def _diesel(d, fire, seed, knock=1.0, rumble=1.0, lp=700):
    """A diesel engine (mono): `fire` is the firing frequency in Hz (a number or one per sample). Each firing is a sharp rise and a long exponential die-away (the chug), low-passed at `lp`, over
    the knock of the combustion (a click of noise at 0.9 to 3.8 kHz on every firing, a little different each time) and the exhaust's rumble (noise under 150 Hz)."""
    n = _n(d)
    f = np.broadcast_to(np.asarray(fire, dtype=float), (n,))
    r = rng6(seed)
    jit = 1 + .012 * _smooth_rand(d, seed + 3, 9.0)
    ph = np.cumsum(f * jit) / SR
    frac = ph % 1.0
    pulse = np.exp(-frac * 8.0) * (1 - np.exp(-frac * 90.0))
    pulse = pulse - np.mean(pulse)
    body = _lp4(pulse, lp, 4)
    cyc = np.floor(ph).astype(np.int64)
    amp = r.uniform(.55, 1.0, int(cyc.max()) + 2)[cyc]
    kn = _bp4(noise6(d, seed + 1), 900, 3800, 2) * np.exp(-frac * 20.0) * (1 - np.exp(-frac * 300.0)) * amp
    rum = _lp4(noise6(d, seed + 2), 150, 2)
    return _rms(body) * 1.0 + _rms(kn) * .16 * knock + _rms(rum) * .30 * rumble


def _sleigh(d, seed, n_bells=40, lo=3200, hi=9000, density=1.0, tau=.07, tail=None):
    """Sleigh bells shaken (mono): `n_bells` tiny jingles spread over `d` seconds (a swell then a fade), each a small metal ping near 3 to 9 kHz with the inharmonic partials of a crotal bell and a
    burst of rattle. The colour of the winter."""
    r = rng6(seed)
    out = np.zeros(_n(d))
    for i in range(int(n_bells * density)):
        u = r.uniform() ** 1.2
        at = u * max(.01, d - .15)
        env = np.sin(np.pi * np.clip(at / d, 0, 1)) ** .7
        f = r.uniform(lo, hi)
        c = _sum(_ping(f, .18, tau * r.uniform(.5, 1.3), (1.0, 1.51, 2.31, 3.7), (1.0, .5, .3, .15), (1.0, .7, .5, .3)), _band(int(seed + i * 7), .02, 4500, 10500) * expdecay(.02, .002) * .5)
        _place(out, c, at, env * r.uniform(.25, 1.0))
    return out


def _mbox(f, d=1.0):
    """A music-box tine: the fundamental rings (tau 0.45 s), a faint octave, the clamped bar's high 6.27x partial that is gone in 30 ms, and the comb's pluck (a 3 ms click at 2 to 6 kHz)."""
    t = tarr(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .45) + .1 * np.sin(4 * np.pi * f * t) * np.exp(-t / .2) + .16 * np.sin(2 * np.pi * f * 6.27 * t) * np.exp(-t / .03)
    x = x * np.minimum(1, t / .0015)
    x[:int(.004 * SR)] += _band(int(f), .004, 2000, 6000) * np.hanning(int(.004 * SR)) * .12
    return x


# ================================================================ title: the snow globe
KEY20 = {0: 7, 1: 0}               # the series' theme in G major in the title (a music box) and in C major on the end card
STEP21 = {0: .375, 1: .4875}       # one eighth of the bar: the title's (80 bpm, 0.2 to 3.2 s) lands as the snow settles, the end card's (61.5 bpm, 0.1 to 4.0 s) on the stamp


def sfx_theme20():
    """The series' theme as a sparkle layer, in a new key each time. TITLE (G major, a music box at 80 bpm): the eight eighths of the arpeggio on music-box tines (a comb's pluck, the fundamental and
    its faint octave, the body an octave under at -9 dB) over a breath of rising air; at 3.0 s (the snow settles into the title) a G major bloom on glass and a sleigh-bell shimmer; at 5.25 s a soft G
    major seventh under the text ding. END CARD (C major, 61.5 bpm, 3.9 s of arpeggio on glass): on the stamp's downbeat a held C major seventh (C E G B and an E above), which does not resolve."""
    k = _nth("theme20")
    kk = 1 if k > 0 else 0
    key, step = KEY20[kk], STEP21[kk]
    L = 8 * step
    d = L + (3.3 if kk == 0 else 3.3)
    x = np.zeros(_n(d + .2))
    arp = tuple(m + key for m in (72, 76, 79, 84, 79, 76, 79, 84))
    for i, m in enumerate(arp):
        g = .3 + .45 * i / 7
        if kk == 0:
            _place(x, _mbox(midi(m + 12), 1.0), i * step, g * 1.0)
            _place(x, _mbox(midi(m), 1.0) * .35, i * step + .003, g * .6)
        else:
            _place(x, _glass(midi(m + 12), .8, .22, .002) * .5, i * step, g * .8)
            _place(x, _note(midi(m + 12), .6, .18, ((1, 1.0), (4, .25), (10, .06))) * .5, i * step, g * .45)
    t = tarr(L)
    _place(x, _tv_filter(noise6(L, 3000 + k), _glide(500, 6500, L), 1.2, "bp") * (t / L) ** 2 * .1, 0.0, 1.0)
    if kk == 0:
        for m, g_, tau in ((79, 1.0, 1.5), (83, .8, 1.4), (86, .7, 1.3), (91, .6, 1.2)):         # G major: G5 B5 D6 G6
            _place(x, _glass(midi(m), 3.0, tau, .008), L, g_ * .3)
        _place(x, _lp4(_sleigh(1.9, 3010, 34, 3400, 8800, tau=.09), 9000, 2), L - .05, .42)
        for m, g_ in ((79, 1.0), (83, .8), (86, .7), (90, .6)):                                  # G major seventh: G B D F-sharp
            _place(x, _glass(midi(m + 12), 1.6, .8, .004), 5.25, g_ * .13)
    else:
        for m, g_, tau in ((72, 1.0, 1.4), (76, .8, 1.3), (79, .75, 1.2), (83, .6, 1.2), (88, .45, 1.1)):     # C major seventh: C5 E5 G5 B5 E6
            _place(x, _glass(midi(m), 3.2, tau, .004), L, g_ * .4)
        _place(x, _glass(midi(95), .9, .3, .001), L + .05, .12)
    x = x[:_n(d)]
    return norm6(_edge(x, .0004, .5), .55)


def sfx_globeshake():
    """A glass snow globe grabbed and shaken (1.9 s): the base meets the wooden desk (a 120 Hz thunk and a ring of glass at 2.35 kHz), five jolts of the shake (each a slosh of liquid, a band of noise that
    climbs from 260 to 1100 Hz in 0.28 s, the glass inside knocking), a glitter of ninety tiny flakes (5 to 12 kHz ticks, densest in the middle of the shake) and a few bubbles rising, then the liquid
    settling (a slow wobble at 3 Hz that dies in a second)."""
    d = 1.9
    r = rng6(2020)
    x = np.zeros(_n(d))
    _place(x, _thump(120, 58, .16, .035) + _band(2021, .05, 600, 3000) * expdecay(.05, .008) * .6, 0.0, .8)
    _place(x, _glass(2350, .5, .11, .001) * .3, .01, 1.0)
    for j, (at, g) in enumerate(((.10, 1.0), (.27, .9), (.43, 1.0), (.60, .8), (.78, .6))):
        dd = .28
        t = tarr(dd)
        slosh = _tv_filter(noise6(dd, 2030 + j), _glide(260, 1100, dd), 1.6, "bp") * np.sin(np.pi * np.clip(t / dd, 0, 1)) ** 1.3
        _place(x, slosh, at, .55 * g)
        _place(x, _thump(140, 70, .1, .02) * .5 + _ping(1900 + 60 * j, .3, .05, (1.0, 2.3, 3.7), (1.0, .4, .2), (1.0, .5, .3)) * .4, at - .005, .5 * g)
    for i in range(90):
        at = .05 + 1.5 * r.beta(2.0, 3.0)
        f = r.uniform(5000, 9000)
        c = _band(2050 + i, .012, 6000, 12000) * expdecay(.012, .0025) + _ping(f, .06, .008, (1.0, 1.7), (.3, .1), (1.0, .6))
        _place(x, c, at, r.uniform(.05, .22))
    for i in range(7):
        dd = r.uniform(.02, .045)
        tt = tarr(dd)
        _place(x, np.sin(2 * np.pi * r.uniform(600, 1500) * tt * (1 + 2.2 * tt / dd)) * np.exp(-tt / (dd * .4)), r.uniform(.4, 1.3), r.uniform(.1, .25))
    tt = tarr(1.0)
    _place(x, _lp4(noise6(1.0, 2040), 700, 2) * (.5 + .5 * np.sin(2 * np.pi * 3.0 * tt)) * np.exp(-tt / .3), .8, .2)
    return norm6(_edge(x, .001, .2), .6)


def sfx_snowsettle():
    """The snow settling in the globe (2.4 s): a soft shimmering descent. Eleven glass notes fall down a G pentatonic scale from G7 to G5, quickly at first and then more slowly and more softly, over
    a sleigh-bell glitter that thins out, and a long soft 'shhh' of flakes coming to rest that swells at the end and fades."""
    d = 2.4
    x = np.zeros(_n(d))
    scale = (103, 100, 98, 95, 93, 91, 88, 86, 83, 81, 79)
    for i, m in enumerate(scale):
        at = 1.45 * (i / 10) ** 1.5
        g = .75 - .5 * i / 10
        _place(x, _glass(midi(m), .9, .35 + .03 * i, .003) * .5, at, g)
        _place(x, _mbox(midi(m), .6) * .25, at, g * .5)
    _place(x, _lp4(_sleigh(1.7, 2060, 36, 3000, 9000, tau=.08), 9500, 2), .05, .35)
    t = tarr(2.1)
    _place(x, _tv_filter(noise6(2.1, 2061), _glide(3200, 1500, 2.1), 1.0, "bp") * np.interp(t, [0, .6, 1.3, 2.1], [.15, .5, 1.0, 0]) * .1, .2, 1.0)
    return norm6(_edge(x, .003, .4), .5)


# ================================================================ forecast: the station, the TV, the speakerphone, the board, the door
def _tv_small(x):
    """What a small flat-panel TV does to a sound: no lows, a nasal lift, the top closed at 6.5 kHz."""
    y = _lp4(_hp4(x, 230, 3), 6500, 3)
    return y + .3 * _res(y, 1500, 1.5) + .25 * _res(y, 3000, 1.2)


def sfx_tvjingle():
    """The local news weather sting, parodied (1.25 s): a bright synth marimba runs up the C major arpeggio in sixteenths (C5 E5 G5 C6 E6), turns back (D6) and lands on a stab (G6) over a rising 'swish' of
    the graphic wiping in, and a last chord stab (C6 E6 G6 C7: a saw through a 3 kHz low-pass, 0.3 s) with a sparkle; everything played through the TV's small speaker."""
    x = np.zeros(_n(1.5))
    seq = ((0.00, 72), (.09, 76), (.18, 79), (.27, 84), (.36, 88), (.50, 86), (.61, 91))
    for at, m in seq:
        f = midi(m)
        t = tarr(.22)
        mar = (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / .05) + .22 * np.sin(2 * np.pi * 10.1 * f * t) * np.exp(-t / .012)) * np.exp(-t / .09) * np.minimum(1, t / .001)
        _place(x, mar, at, .6)
    d = .5
    t = tarr(d)
    _place(x, _tv_filter(noise6(d, 2070), _glide(600, 5200, d), 1.4, "bp") * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * .5, 0.15, 1.0)
    for m in (84, 88, 91, 96):
        dd = .38
        tt = tarr(dd)
        stab = _lp4(osc("saw", midi(m), dd) + .6 * osc("square", midi(m) * 1.004, dd), 3200, 2) * np.minimum(1, tt / .004) * np.exp(-tt / .12)
        _place(x, stab, .78, .16)
    _place(x, _glass(midi(103), .6, .2, .001) * .5, .8, .25)
    return norm6(_edge(_tv_small(x), .001, .12), .6)


def sfx_popper(seed_offset=0):
    """A party popper (1.2 s). A hard pop (a 15 ms burst of noise from 0.8 to 8 kHz over a 220 Hz thump that sags to 90 Hz, and a second crack as the case answers), the streamers: a rustle of
    paper ribbons unfurling (2 to 9 kHz noise fluttering at 55 Hz for 0.6 s) and forty confetti ticks (2 to 6 kHz, 6 to 15 ms) falling over 0.8 s, thinning out. The second one is a little
    deeper and a little longer (Tomato is the only one smiling)."""
    k = _nth("popper") % 2
    r = rng6(2080 + k)
    x = np.zeros(_n(1.3))
    _place(x, _band(2081 + k, .05, 800, 8500) * expdecay(.05, .006) * 1.1 + _thump(220 - 30 * k, 90, .09, .02) * .9, 0.0, 1.0)
    _place(x, _band(2083 + k, .03, 1500, 6000) * expdecay(.03, .004) * .6, .018, 1.0)
    d = .7
    t = tarr(d)
    rus = _band(2084 + k, d, 2000, 9000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * (55 + 8 * k) * t))) * np.interp(t, [0, .04, .3, d], [0, 1, .5, 0])
    _place(x, rus, .03, .42)
    for i in range(40 + 12 * k):
        u = r.uniform() ** 1.5
        dd = r.uniform(.006, .015)
        _place(x, _band(2090 + i + 100 * k, dd, 2000, 6000) * expdecay(dd, dd * .35), .08 + .85 * u, r.uniform(.1, .35) * (1 - .6 * u))
    return norm6(_edge(x, .0005, .2), .65)


def sfx_phoneclick():
    """The conference speakerphone joining or switching (0.4 s). A plastic button pressed (a 300 Hz tock of 25 ms and a click at 3.2 kHz), the relay of the line opening 60 ms later, a tiny two-tone
    'join' chirp (1.2 then 1.8 kHz, 40 ms each, soft) on the first and the line's hiss (600 to 3400 Hz) swelling and fading. The second (Melon's) is only the click and the hiss."""
    k = _nth("phoneclick") % 2
    x = np.zeros(_n(.42))
    t = tarr(.04)
    _place(x, np.sin(2 * np.pi * 300 * t) * np.exp(-t / .01) * .7 + _band(2100 + k, .04, 1500, 6500) * expdecay(.04, .0025) * .8, 0.0, 1.0)
    _place(x, _band(2102 + k, .01, 3000, 7000) * expdecay(.01, .0015) * .5, .06, 1.0)
    if k == 0:
        for j, f in enumerate((1200.0, 1800.0)):
            tt = tarr(.045)
            _place(x, np.sin(2 * np.pi * f * tt) * np.sin(np.pi * np.clip(tt / .045, 0, 1)) * .22, .1 + .06 * j, 1.0)
    d = .26
    tt = tarr(d)
    _place(x, _band(2104 + k, d, 600, 3400) * np.interp(tt, [0, .04, .12, d], [0, 1, .6, 0]) * .1, .08, 1.0)
    return norm6(_edge(_lp4(x, 7000, 2), .0004, .08), .55)


def sfx_boardflip():
    """The staffing board flipping to ONE NURSE (0.95 s): a wall of plastic leaves clacking over like a flip clock (sixteen clacks that speed up from 70 to 22 ms apart and slow again, each a bright
    plastic tick near 2.4 to 3.4 kHz with a hollow knock under it), then the whole panel falling flat with a heavy 'whap' (a 400 Hz knock, a slap of 1 to 5 kHz and the rattle of the marker tray)."""
    x = np.zeros(_n(1.0))
    r = rng6(2110)
    t_ = .0
    gaps = np.concatenate([np.linspace(.07, .022, 9), np.linspace(.022, .06, 8)])
    for i, gp in enumerate(gaps):
        f = r.uniform(2400, 3400)
        tt = tarr(.035)
        c = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .006) * .5 + _band(2111 + i, .035, 1200, 6000) * expdecay(.035, .004) * .6 + np.sin(2 * np.pi * 520 * tt) * np.exp(-tt / .012) * .3
        _place(x, c, t_, .55 + .3 * r.uniform())
        t_ += gp
    at = t_ + .03
    tt = tarr(.25)
    _place(x, np.sin(2 * np.pi * 400 * tt) * np.exp(-tt / .03) * .9 + _band(2130, .25, 800, 5000) * expdecay(.25, .01) * .8 + _thump(150, 70, .2, .04) * .5, at, .9)
    for j in range(7):
        _place(x, _ping(r.uniform(1800, 3200), .12, .02, (1.0, 2.4), (1.0, .4), (1.0, .5)), at + .05 + .035 * j + r.uniform(0, .02), .22 - .02 * j)
    return norm6(_edge(x, .0004, .1), .7)


def sfx_doorgust():
    """The glass doors flung open into a gale (1.9 s). The push bar meets its stop (a 110 Hz thump that sags to 45 Hz, a clank of steel) and the glass rings and rattles (a 1.95 kHz plate ring, five
    rattles), then a wideband rush of wind that comes in with a bang (a 25 ms attack, a low-pass that closes from 9 kHz to 1.2 kHz as it passes), a howl that sweeps 700 to 1500 Hz and back, and a
    flurry of blown snow hissing on the floor (4 to 9 kHz) that fades by 1.7 s."""
    d = 1.9
    x = np.zeros(_n(d))
    t = tarr(d)
    _place(x, _thump(110, 45, .35, .07) * 1.1 + _ping(520, .3, .06, (1.0, 2.7, 4.8), (.8, .4, .2), (1.0, .6, .4)) * .5 + _band(2140, .05, 400, 4000) * expdecay(.05, .006) * .8, 0.0, .9)
    _place(x, _ping(1950, .7, .12, (1.0, 2.33, 3.9), (1.0, .5, .3), (1.0, .6, .4)) * .4, .01, 1.0)
    r = rng6(2141)
    for j in range(5):
        _place(x, _ping(r.uniform(1500, 2600), .15, .03, (1.0, 2.5), (1.0, .4), (1.0, .5)), .12 + .09 * j, .22 - .03 * j)
    rush = _tv_filter(noise6(d, 2142), _glide(9000, 1200, d), .8, "lp") * np.interp(t, [0, .025, .25, .8, d], [0, 1, .85, .3, 0])
    _place(x, rush * .9, 0.0, 1.0)
    howl = _tv_filter(noise6(d, 2143), 700 + 800 * np.sin(np.pi * np.clip(t / 1.4, 0, 1)), 11.0, "bp") * np.interp(t, [0, .1, .6, 1.4, d], [0, .6, 1, .3, 0])
    _place(x, _rms(howl) * .45 * (np.interp(t, [0, .1, .6, 1.4, d], [0, .6, 1, .3, 0])), 0.0, 1.0)
    _place(x, _band(2144, 1.5, 4000, 9000) * np.interp(tarr(1.5), [0, .15, .6, 1.5], [0, 1, .5, 0]) * .1, .05, 1.0)
    return norm6(_edge(x, .0004, .3), .8)


def sfx_snowdump():
    """A heap of snow collapsing. The first (forecast, 2.4 s): the wall of snow behind the glass doors slumps into the lobby onto Onion: a heavy soft WHUMP (a 70 Hz thump that sags to 32 Hz, a 400 Hz
    cushion of noise), the clipboard's papers fluttering in the gust (a 25 Hz flutter of 2 to 7 kHz), the sandwich-board sign toppling (three hollow plastic knocks at 0.45, 0.6 and 0.72 s) and a long slide
    and crumble (a 900 Hz low-passed hush for 1.6 s and 150 granular ticks, thinning out). The second (lot, 1.6 s): the block of snow sliding out of the car's open door onto Strawberry's knees: a
    softer whump, a shorter slide, fewer crumbs."""
    k = _nth("snowdump") % 2
    big = k == 0
    d = 2.4 if big else 1.6
    r = rng6(2150 + k)
    x = np.zeros(_n(d))
    t = tarr(d)
    _place(x, _thump(70 if big else 60, 32 if big else 36, .6, .13 if big else .1) * 1.2 + _lp4(noise6(.4, 2151 + k), 400, 2) * expdecay(.4, .1) * 1.0, 0.0, 1.0 if big else .8)
    _place(x, _lp4(noise6(d, 2152 + k), 900, 2) * np.interp(t, [0, .08, .5, d - .1, d], [0, 1, .6, .12, 0]) * .8, .02, 1.0)
    nt = 150 if big else 70
    for i in range(nt):
        u = r.uniform() ** 1.6
        dd = r.uniform(.004, .012)
        _place(x, _band(2160 + i + 300 * k, dd, 500, 3500) * expdecay(dd, dd * .4), .05 + (d - .35) * u, r.uniform(.1, .5) * (1 - .7 * u))
    if big:
        tt = tarr(.55)
        _place(x, _band(2153, .55, 2000, 7000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 25 * tt))) * np.interp(tt, [0, .05, .25, .55], [0, 1, .5, 0]) * .2, .25, 1.0)
        for j, at in enumerate((.45, .6, .72)):
            _place(x, _ping(r.uniform(300, 520), .2, .035, (1.0, 2.2, 3.6), (1.0, .5, .3), (1.0, .6, .4)) * .35 + _band(2154 + j, .03, 600, 3000) * expdecay(.03, .006) * .4, at, 1.0)
    return norm6(_edge(x, .001, .35), .8 if big else .65)


# ================================================================ lot: the plow, the shovel, the ice, the phone
def _pan_curve(x, pan):
    """A mono clip placed with a pan that moves (one value per sample, -1..1): (2, n)."""
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def sfx_plowengine():
    """A diesel pickup with a plow on the front, twice. The first (7.4 s, with the cue at 0.3 s): the truck comes in from the left (a pass: the engine revs from an idle at 26 Hz firing to 44 Hz and the level swells,
    the tyre chains jingle, the pan sweeps from -0.8 to +0.5), works under load as the blade bites (1.6 to 2.6 s, heavier knock) and settles into an idle at 27 Hz firing in the cab-window shot: a close,
    lumpy diesel bed that stays under Turnip's two lines. The second (5.6 s, the cue at 7.14 s): a rev to 78 Hz, a gear change, and the truck drives off to the right: the level falls away over four seconds
    and the top is closed off as the distance grows."""
    k = _nth("plowengine") % 2
    if k == 0:
        d = 7.4
        t = tarr(d)
        fire = np.interp(t, [0, 1.0, 1.6, 2.6, 3.3, 4.5, d], [26, 44, 40, 36, 27, 28.5, 27]) * (1 + .02 * _smooth_rand(d, 2171, .8))
        eng = _diesel(d, fire, 2170, knock=1.0, rumble=1.0, lp=650)
        lvl = np.interp(t, [0, 1.2, 2.4, 3.3, 3.6, 5.0, d - .4, d], [.15, 1.0, 1.0, .7, .62, .62, .55, 0])
        x = eng * lvl
        r = rng6(2172)
        for i in range(16):                                          # the chains
            at = .5 + 2.3 * r.uniform()
            _place(x, _ping(r.uniform(2200, 4200), .1, .02, (1.0, 2.6), (1.0, .4), (1.0, .5)) * .09, at, 1.0)
        pan = np.interp(t, [0, 2.6, 3.4, d], [-.8, .5, .3, .3])
        return norm6(_edge(_pan_curve(x, pan), .02, .4), .75)
    d = 5.6
    t = tarr(d)
    fire = np.interp(t, [0, .5, 1.0, 1.25, 2.0, 3.5, d], [27, 62, 78, 58, 68, 52, 40])
    eng = _diesel(d, fire, 2175, knock=1.2, rumble=1.0, lp=800)
    lvl = np.interp(t, [0, .6, 1.2, 2.5, 4.0, d], [.6, 1.0, 1.0, .5, .15, 0])
    eng = _tv_filter(eng, np.interp(t, [0, .8, 5.0, d], [4000, 2500, 400, 300]), .7, "lp")
    pan = np.interp(t, [0, 2.5, d], [.3, .5, .7])
    return norm6(_edge(_pan_curve(eng * lvl, pan), .005, .5), .75)


def sfx_plowscrape():
    """A steel blade dragged along the lot under the snow (1.9 s): a long grind that rises. A band of noise whose centre climbs from 500 to 2400 Hz (a resonance of 3) chattering at 35 Hz that speeds up to
    75 Hz, a squeal of the steel (a sine from 900 to 1700 Hz at -18 dB, shivering at 30 Hz), the roar of the berm being pushed (noise under 500 Hz), grit (a crackle of 2 to 7 kHz ticks) and four soft
    pillow thumps as the berm reaches the cars (0.3, 0.55, 0.8 and 1.05 s: one car every quarter second)."""
    d = 1.9
    t = tarr(d)
    env = np.interp(t, [0, .25, 1.3, 1.7, d], [0, .75, 1.0, .6, 0])
    chat = (.6 + .4 * np.sign(np.sin(2 * np.pi * np.cumsum(np.interp(t, [0, d], [35, 75])) / SR)))
    grind = _rms(_tv_filter(noise6(d, 2190), 500 * (2400 / 500) ** (t / d), 3.0, "bp")) * chat * env
    squeal = _sin_of(np.interp(t, [0, d], [900, 1700])) * (.6 + .4 * np.sin(2 * np.pi * 30 * t)) * env * .12
    roar = _rms(_lp4(noise6(d, 2191), 500, 2)) * env * .6
    r = rng6(2192)
    grit = np.zeros(len(t))
    for i in range(70):
        _place(grit, _band(2200 + i, .008, 2000, 7000) * expdecay(.008, .002), r.uniform(.1, 1.7), r.uniform(.1, .5))
    x = grind * .55 + squeal + roar * .45 + grit * .25
    for at in (.3, .55, .8, 1.05):
        _place(x, _thump(80, 40, .25, .07) * .5 + _lp4(noise6(.2, int(at * 100) + 2210), 400, 2) * expdecay(.2, .06) * .6, at, 1.0)
    return norm6(_edge(x, .01, .25), .7)


def sfx_plowdump():
    """The berm landing on the last car (1.8 s): a heavy WHUMP (a 55 Hz thump that sags to 30 Hz over 0.6 s and a 300 Hz cushion of noise), the snow crumbling over the roof (200 to 1800 Hz, 0.35 s),
    the car's body flexing under the weight (a stick-slip creak, a sine from 420 to 380 Hz with a 23 Hz roughness, 0.45 s, through a 400 Hz resonance, and a dull 150 Hz 'tonk' of a panel), the antenna
    shivering (a quiet 2.6 kHz wobble) and a last long settling hush."""
    d = 1.8
    x = np.zeros(_n(d))
    _place(x, _thump(55, 30, .7, .16) * 1.3 + _lp4(noise6(.4, 2220), 300, 2) * expdecay(.4, .09) * 1.0, 0.0, 1.0)
    _place(x, _band(2221, .5, 200, 1800) * expdecay(.5, .12) * .7, .04, 1.0)
    dd = .5
    tt = tarr(dd)
    cr = _sin_of(np.interp(tt, [0, dd], [420, 380])) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 23 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** .8
    _place(x, _res(cr, 400, 4.0) * .9, .12, .3)
    _place(x, _sin_of(np.full(int(.2 * SR), 150.0)) * np.exp(-tarr(.2) / .05) * .6, .1, .5)
    _place(x, np.sin(2 * np.pi * 2600 * tarr(.6)) * (1 + .4 * np.sin(2 * np.pi * 18 * tarr(.6))) * np.exp(-tarr(.6) / .18) * .05, .15, 1.0)
    tt = tarr(1.3)
    _place(x, _lp4(noise6(1.3, 2222), 600, 2) * np.exp(-tt / .45) * .25, .4, 1.0)
    return norm6(_edge(x, .001, .3), .8)


def sfx_partywhistle():
    """Tomato's party horn (1.0 s): a blow-out whistle. A reed (a square, a sine and its octave through a 3 kHz low-pass) that scoops up from 480 to 1080 Hz in half a second, holds, and sags, fluttering
    at 22 Hz like a paper tongue, over a breath of air, and the paper tube unrolling at the end (a feathery 'frrp', 1.5 to 5.5 kHz rising, 0.3 s)."""
    d = 1.0
    t = tarr(d)
    f = np.interp(t, [0, .1, .55, .72, d], [480, 540, 1080, 1080, 900])
    ph = 2 * np.pi * np.cumsum(f) / SR
    reed = np.sign(np.sin(ph)) * .5 + np.sin(ph) * .6 + np.sin(2 * ph) * .2
    reed = _lp4(reed, 3000, 2) * (1 + .25 * np.sin(2 * np.pi * 22 * t))
    env = np.interp(t, [0, .03, .6, .8, .9, d], [0, 1, 1, .5, .1, 0])
    x = reed * env + _band(2230, d, 2500, 7000) * env * .08
    tt = tarr(.3)
    _place(x, _tv_filter(noise6(.3, 2231), _glide(1500, 5500, .3), 2.0, "bp") * np.sin(np.pi * np.clip(tt / .3, 0, 1)) * .5, .45, 1.0)
    return norm6(_edge(x, .002, .12), .6)


def sfx_slip():
    """A boot on ice (0.55 s): the squeak-slide of rubber on a glaze (a sine that climbs 1100 to 2400 Hz and falls back to 1700, stick-slipping at 55 Hz, through a 1.8 kHz resonance, 0.36 s), three scrabbles of
    the other boot (rubber scuffs, 700 to 3000 Hz), the swish of an arm flung out and the clipboard leaving a hand (a plastic clack and the clip's ring at 3.1 kHz). No gasp: the sound is all boot."""
    d = .6
    x = np.zeros(_n(d))
    dd = .36
    t = tarr(dd)
    f = np.interp(t, [0, .2, dd], [1100, 2400, 1700])
    sq = _sin_of(f) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 55 * t))) * np.sin(np.pi * np.clip(t / dd, 0, 1)) ** .6
    _place(x, _res(sq, 1800, 2.5) * .8 + sq * .3, 0.0, .5)
    for j, at in enumerate((.1, .19, .28)):
        _place(x, _band(2240 + j, .07, 700, 3000) * np.sin(np.pi * np.clip(tarr(.07) / .07, 0, 1)) * .5, at, .6)
    tt = tarr(.25)
    _place(x, _tv_filter(noise6(.25, 2243), _glide(500, 2500, .25), 1.2, "bp") * np.sin(np.pi * np.clip(tt / .25, 0, 1)) * .3, .12, 1.0)
    _place(x, _ping(1500, .2, .03, (1.0, 2.5), (1.0, .4), (1.0, .5)) * .4 + _ping(3100, .3, .06, (1.0, 2.7), (1.0, .4), (1.0, .5)) * .25, .38, 1.0)
    return norm6(_edge(x, .003, .08), .6)


def sfx_thud():
    """A body landing on packed snow and sliding (1.5 s): soft. The landing (a 75 Hz thump that sags to 45 Hz, a muffled slap of noise under 700 Hz, the snow packing: a squeak and a crunch of grains, 600 to
    2500 Hz), the slide across the lot (a hush of 500 to 3000 Hz noise fading over 0.8 s with a flutter of crystals and a spray of snow), the clipboard coming down (two plastic clacks) and the snowman's
    head tumbling after her (three soft thumps that get quieter: 0.62, 0.86 and 1.06 s)."""
    d = 1.5
    x = np.zeros(_n(d))
    r = rng6(2250)
    t = tarr(.3)
    _place(x, _thump(75, 45, .3, .06) * 1.0 + _lp4(noise6(.3, 2251), 700, 2) * expdecay(.3, .035) * .9, 0.0, 1.0)
    for i in range(18):
        _place(x, _band(2252 + i, .008, 600, 2500) * expdecay(.008, .003), r.uniform(.0, .14), r.uniform(.15, .45))
    tt = tarr(.8)
    _place(x, _band(2253, .8, 500, 3000) * np.interp(tt, [0, .05, .3, .8], [0, 1, .6, 0]) * (1 + .3 * np.sin(2 * np.pi * 9 * tt)) * .35, .08, 1.0)
    for i in range(30):
        _place(x, _band(2260 + i, .01, 1500, 6000) * expdecay(.01, .003), .1 + .8 * r.uniform() ** 1.4, r.uniform(.05, .2))
    for at, f in ((.3, 1700), (.4, 2300)):
        _place(x, _ping(f, .15, .02, (1.0, 2.4), (1.0, .4), (1.0, .5)) * .3, at, 1.0)
    for at, g in ((.62, .7), (.86, .5), (1.06, .32)):
        _place(x, _thump(90, 52, .22, .045) * .8 + _lp4(noise6(.2, int(at * 100) + 2290), 500, 2) * expdecay(.2, .04) * .6, at, g)
    return norm6(_edge(x, .001, .25), .7)


def sfx_shovel():
    """A shovel biting snow and throwing it (0.7 s), three times, each a little different and a little more tired. The blade meeting a crust (a 'shk' of steel on ice, 2 to 6 kHz, 30 ms), the bite (a crunch
    of fourteen grains in 90 ms, 500 to 3500 Hz, and the squeak of dry snow), the lift (a low slide of 300 to 800 Hz noise swelling over 0.12 s) and the throw (a feathery 'fwp' of snow flying, 1 to 5 kHz,
    80 ms) landing as a soft patter of a dozen grains over the next 0.25 s."""
    k = _nth("shovel") % 3
    r = rng6(2300 + k)
    x = np.zeros(_n(.75))
    g_ = (1.0, .9, 1.1)[k]
    _place(x, _band(2301 + k, .03, 2000, 6000) * expdecay(.03, .005) * .7, 0.0, 1.0)
    for i in range(14):
        _place(x, _band(2310 + 20 * k + i, .01, 500, 3500) * expdecay(.01, .0035), .01 + .09 * r.uniform() ** 1.3, r.uniform(.2, .7) * g_)
    if r.uniform() < .8:
        dd = .05
        tt = tarr(dd)
        _place(x, _sin_of(np.linspace(r.uniform(1800, 2600), r.uniform(2800, 3400), int(dd * SR))) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 90 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) * .1, .06, 1.0)
    tt = tarr(.14)
    _place(x, _tv_filter(noise6(.14, 2302 + k), _glide(300, 800, .14), 1.5, "bp") * np.sin(np.pi * np.clip(tt / .14, 0, 1)) * .4, .12, 1.0)
    tt = tarr(.1)
    _place(x, _tv_filter(noise6(.1, 2303 + k), _glide(1000, 5000, .1), 1.2, "bp") * np.sin(np.pi * np.clip(tt / .1, 0, 1)) * .5, .27, 1.0)
    for i in range(12):
        _place(x, _band(2330 + 20 * k + i, .008, 700, 3200) * expdecay(.008, .003), .36 + .27 * r.uniform() ** 1.4, r.uniform(.1, .35))
    return norm6(_edge(x, .001, .12), .55)


def sfx_phonering():
    """A modern phone ring in a mitten (0.95 s): a bright two-operator bell (a sine and a 2x modulator that dies in 70 ms: a soft marimba-bell) playing a five-note figure (A5 E6 C-sharp6 E6 A6, 0.11 s
    apart) and a three-note answer (A6 E6 A5, 0.55 s on), over a soft pad of the A major triad; the speaker is small and the phone is in a thick mitten: closed off at 5 kHz."""
    d = .95
    x = np.zeros(_n(d))
    for fig, t0 in (((81, 88, 85, 88, 93), 0.0), ((93, 88, 81), .56)):
        for j, m in enumerate(fig):
            f = midi(m)
            tt = tarr(.4)
            idx = 1.8 * np.exp(-tt / .07)
            bell = np.sin(2 * np.pi * f * tt + idx * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt / .16) * np.minimum(1, tt / .002)
            _place(x, bell, t0 + j * .11, .55)
    tt = tarr(.9)
    pad = sum(np.sin(2 * np.pi * midi(m) * tt) for m in (69, 73, 76)) * np.interp(tt, [0, .05, .5, .9], [0, 1, .6, 0]) * .1
    x[:len(pad)] += pad
    return norm6(_edge(_lp4(_hp4(x, 300, 2), 5000, 3), .002, .1), .6)


def sfx_plowdist():
    """A plow far away (3.2 s), the first heard from the day room through the walls and the second at dawn through the window glass: a diesel at 29 Hz firing, low-passed at 260 Hz, that swells and passes
    (a Doppler of -3 percent); a long scrape of steel on road (noise from 500 to 1500 Hz at 18 Hz, -22 dB); and an amber hum, the beacon's motor (a 190 Hz triangle that glides 190 -> 210 -> 180 with a slow
    pulse) so faint that it is more a colour than a sound. The dawn one (3.6 s) is clearer and a little quieter: the snow has stopped and the world is silent."""
    k = _nth("plowdist") % 2
    d = 3.2 if k == 0 else 3.6
    t = tarr(d)
    fire = 29 * np.interp(t, [0, d * .45, d], [1.02, 1.0, .97])
    eng = _lp4(_diesel(d, fire, 2350 + k, knock=.4, rumble=1.0, lp=300), 260 if k == 0 else 380, 3)
    env = np.interp(t, [0, d * .45, d], [0, 1, 0]) ** 1.3
    x = _rms(eng) * env
    scr = _band(2352 + k, d, 500, 1500) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 18 * t))) * env ** 1.5
    x = x + _rms(scr) * .12 * env
    f = 190 * np.interp(t, [0, d * .5, d], [1.0, 1.1, .95])
    ph = np.cumsum(f) / SR
    hum = (2 * np.abs(2 * (ph % 1) - 1) - 1) * (.7 + .3 * np.sin(2 * np.pi * .8 * t)) * env
    x = x + hum * .04
    x = _lp4(x, 1100 if k == 0 else 1800, 2)
    return norm6(_edge(x, .3, .6), .45 if k == 0 else .35)


def sfx_snowstep():
    """One step in snow (0.22 s), the boots of the lot (every footstep of the lot in events.json): the crust giving way as a crunch of fourteen to twenty-three ice grains (500 to 7500 Hz, 3 to 9 ms),
    the soft 'fump' of the snow packing under the weight (a 80 Hz thump and a 380 Hz cushion) and, about one step in three, the squeak of dry cold snow (1.8 to 3.4 kHz, 40 ms). Each step is different."""
    k = _nth("snowstep")
    r = rng6(2400 + k)
    foot = k % 2
    x = np.zeros(_n(.22))
    for i in range(int(r.integers(14, 24))):
        u = r.uniform() ** 1.3
        dd = r.uniform(.003, .009)
        lo = r.uniform(500, 1800)
        _place(x, _band(2410 + 31 * k + i, dd, lo, min(lo + r.uniform(1200, 2800), 7500)) * expdecay(dd, dd * .4), .004 + .12 * u, r.uniform(.15, .6) * (1 - .5 * u))
    t = tarr(.1)
    x[:len(t)] += _lp4(noise6(.1, 2401 + k), 380, 2) * np.exp(-t / .03) * .5 + np.sin(2 * np.pi * (80 + 15 * foot) * t) * np.exp(-t / .03) * .3
    if r.uniform() < .35:
        dd = .045
        tt = tarr(dd)
        _place(x, _sin_of(np.linspace(r.uniform(1800, 3000), r.uniform(2200, 3400), int(dd * SR))) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 90 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) * .1, .05, 1.0)
    return norm6(_edge(x, .0005, .04), .5)


# ================================================================ blackout: the ten seconds
def _whine(f0, f1, dur, amp, harm=((1, 1.0), (2, .4), (3, .2)), curve=1.0):
    """A rotating machine spinning down (mono): a tone that falls from f0 to f1 along an exponential path (curve > 1 holds the pitch longer and drops late), with its harmonics, a soft attack and a
    long fade; the pitch of a fan or a compressor losing power."""
    tt = tarr(dur)
    f = f0 * (f1 / f0) ** ((tt / dur) ** curve)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(a * np.sin(h * ph) for h, a in harm if h * f0 < SR * .45)
    return x * np.interp(tt, [0, .06, dur * .45, dur], [0, 1, .75, 0]) * amp


def _ballasts(d, alive=False):
    """The fluorescent ballast buzz of the six rooms (stereo (2, n), each room in its own place from -0.85 to +0.85): 120 Hz and its harmonics to 960 Hz, a faint arc hiss at 2.5 to 6.5 kHz and the flicker of the
    tubes. With `alive` they simply run; otherwise room i is dimmed over 0.15 s from 0.25 i s (the cutaway's cascade: a room every quarter second): two quick 20 ms flickers as it starts to go, a sag in
    pitch as it dies and a small tick at the end."""
    n = _n(d)
    t = tarr(d)
    out = np.zeros((2, n))
    for i in range(6):
        td = .25 * i + .15
        f0 = 120.0 + .35 * (i - 2.5)
        pitch = np.ones(n) if alive else np.interp(t, [td - .12, td + .03], [1.0, .86])
        ph = 2 * np.pi * np.cumsum(f0 * pitch) / SR
        buzz = sum(a * np.sin(h * ph + h * i) for h, a in ((1, 1.0), (2, .6), (3, .5), (4, .32), (5, .22), (6, .18), (7, .1), (8, .08)))
        buzz = buzz * (1 + .12 * np.sin(2 * np.pi * 7.1 * t + i)) + _band(2501 + i, d, 2500, 6500) * .12
        env = np.ones(n) if alive else np.interp(t, [0, td - .15, td, d], [1, 1, 0, 0])
        if not alive:
            for fl in (td - .13, td - .06):
                env = env * (1 - .7 * np.exp(-.5 * ((t - fl) / .01) ** 2))
        y = buzz * env * .22
        if not alive:
            _place(y, _band(2510 + i, .02, 1500, 6000) * expdecay(.02, .003) * .8, td, 1.0)
        out += _ctr(y, -.85 + .34 * i)
    return out


def sfx_powerdown():
    """The whole building losing power (stereo, 2.9 s from the cue at 0.2 s). SIX ROOMS, left to right, a room every quarter second as the cutaway shows (see _ballasts): each room's ballast buzz flickers
    twice and sags as it dies over 0.15 s, with a small tick, in its own place from -0.85 to +0.85; the buzz comes in out of the lead-in hum (`hum_on`, 0.0 to 0.2 s) at a third of its level and surges to
    full in 0.12 s, as a failing ballast does. Under them the machines run down: a fan's whine from 900 to 70 Hz over 1.5 s, a compressor from 118 to 24 Hz over 1.6 s, a bearing from 2.6 kHz to 320 Hz,
    the HVAC's sigh (air that closes from 3.2 kHz to 180 Hz over 1.4 s, wide) and the main breaker's thunk at the start. Then a thick hush: only a 38 Hz hum that fades by 2.5 s."""
    d = 2.9
    n = _n(d)
    t = tarr(d)
    out = _ballasts(d) * np.interp(t, [0, .12], [.33, 1.0])
    fan = np.zeros(n)
    _place(fan, _whine(900, 70, 1.5, .34, ((1, 1.0), (2, .5), (3, .25)), 1.3), .3, 1.0)
    comp = np.zeros(n)
    _place(comp, _whine(118, 24, 1.6, .5, ((1, 1.0), (2, .6), (3, .4), (4, .25)), 1.2), .25, 1.0)
    brg = np.zeros(n)
    _place(brg, _whine(2600, 320, 1.2, .12, ((1, 1.0), (2, .3)), 1.4), .35, 1.0)
    out += _ctr(fan, -.3) + _ctr(comp, .4) + _ctr(brg, .7)
    dd = 1.5
    tt = tarr(dd)
    for c in range(2):
        sigh = _tv_filter(noise6(dd, 2530 + c), _glide(3200, 180, dd), .9, "lp") * np.interp(tt, [0, .1, .6, dd], [0, 1, .55, 0])
        _place(out[c], _rms(sigh) * .3 * np.interp(tt, [0, .1, .6, dd], [0, 1, .55, 0]), .2, 1.0)
    br = np.zeros(n)
    _place(br, _thump(75, 38, .3, .06) + _band(2540, .02, 600, 4500) * expdecay(.02, .003) * .7, 0.0, 1.0)
    out += _ctr(br, 0.0) * .9
    hum = np.sin(2 * np.pi * np.cumsum(np.interp(t, [0, 2.5], [38, 30])) / SR) * np.interp(t, [0, .4, 1.4, 2.5], [0, 1, .5, 0]) * .1
    out += _ctr(hum, 0.0)
    pk = np.max(np.abs(out))
    sfx_powerdown.k = .8 / pk                                                      # the lead-in hum is scaled by the same factor
    return norm6(_edge(out, .006, .3), .8)


def sfx_hum_on():
    """The building's lights humming before the failure (designed event, 0.25 s, at the start of the scene): the six ballasts alive at a third of the level they have when `powerdown` begins (0.2 s), crossfaded
    into it over 15 ms, so the loss of power comes out of the room tone and not out of nothing."""
    if not hasattr(sfx_powerdown, "k"):
        sfx_powerdown()
    d = .25
    x = _ballasts(d, alive=True) * .33 * sfx_powerdown.k
    t = tarr(d)
    return x * np.interp(t, [0, .004, .19, .215], [0, 1, 1, 0])


def sfx_relay():
    """A heavy relay, four times. The first three (0.75 s, panned across the building from the left to the right): the contactor of an exit sign's emergency supply (a 165 Hz thump that sags to 58 Hz, a
    320 Hz knock and a clack of steel from 0.5 to 3.2 kHz, a faint ring of the housing) and, 38 ms later, the sign lighting (a bright tick and the first buzz of its ballast, 120 Hz). Each is a little
    different (pitch 1.0, 0.93, 1.08). The fourth (1.5 s, the generator's TRANSFER SWITCH): two strokes, the contacts breaking (a hard clack and a ring at 1.1 kHz) and, 95 ms later, making (a 110 Hz thump that
    sags to 38 Hz, a heavy CHUNK of noise from 0.2 to 2.5 kHz, the cabinet's ring at 300 and 640 Hz), then the load coming on: a hum at 60, 120 and 180 Hz that swells to a steady level."""
    k = _nth("relay") % 4
    if k < 3:
        ps = (1.0, .93, 1.08)[k]
        x = np.zeros(_n(.75))
        tt = tarr(.25)
        clunk = _thump(165 * ps, 58, .25, .04) + np.sin(2 * np.pi * 320 * ps * tt) * np.exp(-tt / .03) * .4 + _band(2550 + k, .25, 500, 3200) * expdecay(.25, .007) * .8
        _place(x, clunk + _ping(780 * ps, .4, .06, (1.0, 2.76, 5.4), (.5, .3, .15), (1.0, .6, .4)) * .25, 0.0, 1.0)
        t2 = tarr(.03)
        _place(x, _band(2560 + k, .03, 3000, 8000) * expdecay(.03, .0015) * .6 + np.sin(2 * np.pi * 2900 * t2) * np.exp(-t2 / .004) * .3, .038, 1.0)
        t3 = tarr(.6)
        _place(x, (np.sin(2 * np.pi * 120 * t3) + .5 * np.sin(2 * np.pi * 240 * t3 + 1)) * np.interp(t3, [0, .12, .6], [0, 1, .5]) * .08, .05, 1.0)
        return _ctr(norm6(_edge(x, .0006, .15), .7), (-.6, .05, .6)[k])
    d = 1.5
    x = np.zeros(_n(d))
    _place(x, _band(2570, .1, 600, 5000) * expdecay(.1, .008) * .9 + _ping(1100, .3, .05, (1.0, 2.7, 4.6), (.8, .4, .2), (1.0, .6, .4)) * .4, 0.0, 1.0)
    tt = tarr(.5)
    _place(x, _thump(110, 38, .5, .09) * 1.3 + _band(2571, .5, 200, 2500) * expdecay(.5, .02) * .9 + _ping(560, .5, .1, (1.0, 2.3, 4.1), (1.0, .5, .3), (1.0, .6, .4)) * .4, .095, 1.0)
    _place(x, _ping(300, 1.0, .25, (1.0, 2.13), (.6, .3), (1.0, .6)) * .3 + _ping(640, .8, .18, (1.0, 2.4), (.4, .2), (1.0, .6)) * .2, .1, 1.0)
    t3 = tarr(1.3)
    hum = (np.sin(2 * np.pi * 60 * t3) + .7 * np.sin(2 * np.pi * 120 * t3 + 1) + .35 * np.sin(2 * np.pi * 180 * t3 + 2)) * np.interp(t3, [0, .12, .5, 1.3], [0, .5, 1, .8]) * .22
    _place(x, hum, .1, 1.0)
    return norm6(_edge(x, .0006, .2), .8)


def sfx_flashlight():
    """A flashlight switched on, twice. The first (0.7 s, the staff's torch): a rubber button pressed (a soft 'tk' of 1.1 kHz closed off at 5 kHz) and released 75 ms later, and a quiet hum of the LED driver (a
    4.3 kHz whine shivering at 37 Hz at -29 dB and a 150 Hz hum). The second (0.8 s, Brenda's from twenty nineteen): a metal slide switch ('clack', a 640 Hz barrel with inharmonic partials and a click of
    0.8 to 4.5 kHz) and a tired filament's hum (100 Hz and 200 Hz wobbling at 11 Hz)."""
    k = _nth("flashlight") % 2
    if k == 0:
        x = np.zeros(_n(.75))
        t = tarr(.03)
        tk = _lp4(_band(2580, .03, 600, 3500) * expdecay(.03, .005) + np.sin(2 * np.pi * 1100 * t) * np.exp(-t / .006) * .4, 5000, 2)
        _place(x, tk, 0.0, 1.0)
        _place(x, tk, .075, .5)
        tt = tarr(.6)
        whine = np.sin(2 * np.pi * 4300 * tt + 2 * np.sin(2 * np.pi * 37 * tt)) * np.interp(tt, [0, .08, .3, .6], [0, 1, .7, 0]) * .035
        hum = np.sin(2 * np.pi * 150 * tt) * np.interp(tt, [0, .08, .3, .6], [0, 1, .7, 0]) * .05
        _place(x, whine + hum, .09, 1.0)
        return norm6(_edge(x, .0004, .12), .5)
    x = np.zeros(_n(.85))
    _place(x, _ping(640, .3, .04, (1.0, 2.5, 4.4), (1.0, .5, .3), (1.0, .6, .4)) * .8 + _band(2581, .02, 800, 4500) * expdecay(.02, .003) * .8, 0.0, 1.0)
    _place(x, _band(2582, .01, 1500, 5000) * expdecay(.01, .002) * .4, .034, 1.0)
    tt = tarr(.7)
    hum = (np.sin(2 * np.pi * 100 * tt) + .5 * np.sin(2 * np.pi * 200 * tt + 1)) * np.interp(tt, [0, .06, .4, .7], [0, 1, .8, 0]) * (1 + .3 * np.sin(2 * np.pi * 11 * tt)) * .05
    _place(x, hum, .06, 1.0)
    return norm6(_edge(x, .0004, .15), .5)


def _swtick(k=0, g=1.0):
    """One tick of the stopwatch (0.05 s): a tiny 'tk' of the case, a 2.8 kHz ping of 5 ms and a 1.3 kHz body under it."""
    tt = tarr(.05)
    return (np.sin(2 * np.pi * 2800 * tt) * np.exp(-tt / .005) * .5 + _band(2590 + k, .05, 3000, 8500) * expdecay(.05, .0012) * .55 + np.sin(2 * np.pi * 1300 * tt) * np.exp(-tt / .01) * .25) * g


def sfx_swtick():
    """One quiet tick of Onion's stopwatch (designed event, one per whole second it shows, from 3.4 s to 8.4 s of the blackout)."""
    k = _nth("swtick")
    return norm6(_edge(_swtick(k, 1.0), .0004, .01), .4)


def sfx_stopwatchticks():
    """The count (3.7 s from the cue at 9.02 s, while the stopwatch reads 6.6 to 10.0): a quiet digital tick on every whole second it shows (9.40, 10.40, 11.40 and 12.40 s of the scene, each a bit stronger and
    the last one doubled) over a tension pad that is NOT music: a low rumble under 200 Hz swelling with a sine that creeps from 62 to 118 Hz (and its octave) and a faint whine that climbs 3.1 to 4.4 kHz, all
    chopped by a tremolo that accelerates from 1.2 to 7 Hz (a heartbeat that speeds up without ever being a beat), gone before the generator's crank (the pad ends at 3.3 s)."""
    d = 3.7
    n = _n(d)
    t = tarr(d)
    x = np.zeros(n)
    for j, g in enumerate((.8, .9, 1.0, 1.15)):
        _place(x, _swtick(10 + j, g), .381 + j, 1.0)
    _place(x, _swtick(14, .8), .381 + 3 + .09, 1.0)
    u = np.clip(t / 3.3, 0, 1)
    f = np.interp(t, [0, 3.3], [62, 118])
    low = _sin_of(f) + .5 * _sin_of(2 * f)
    pad = _rms(low) * .7 + _rms(_lp4(noise6(d, 2595), 200, 2)) * .5
    rate = 1.2 + (7.0 - 1.2) * u ** 2
    trem = 1 - .35 * (.5 + .5 * np.sin(2 * np.pi * np.cumsum(rate) / SR))
    env = u ** 2 * np.interp(t, [3.0, 3.3, d], [1, 0, 0])
    whine = _sin_of(np.interp(t, [0, 3.3], [3100, 4400])) * u ** 3 * .02
    x = x + (pad * trem * env * .55 + whine * np.interp(t, [3.0, 3.3, d], [1, 0, 0]))
    return norm6(_edge(x, .003, .1), .5)


def sfx_genstart():
    """The generator starting (2.8 s from the cue at 12.33 s). 0 to 0.58 s: the starter motor (a whine from 190 to 360 Hz through a 1.5 kHz low-pass) turning the engine over (compression strokes
    at 6 Hz that speed up to 11 Hz: 'rurr, rurr'); COUGH ONE at 0.12 s (a pop-thump of 130 Hz that sags to 55 Hz, with a puff of noise from 150 to 1500 Hz: this is the 2 px shudder of the picture),
    COUGH TWO at 0.38 s (smaller); THE CATCH at 0.58 s, the diesel fires on every stroke (the firing frequency climbs from 14 to 60 Hz in 0.9 s, the knock and the exhaust) and settles into a steady deep
    rumble at 60 Hz that fills the building, low-passed at 380 Hz as it is through the walls. The transfer switch is the next cue (`relay`, 0.8 s later)."""
    d = 2.8
    n = _n(d)
    t = tarr(d)
    x = np.zeros(n)
    ts = np.interp(t, [0, .62, .66], [1, 1, 0])
    rate = np.interp(t, [0, .6, d], [6, 11, 11])
    chug = _diesel(d, rate, 2600, knock=.3, rumble=.6, lp=260) * ts
    st = _lp4(osc("saw", np.interp(t, [0, .6, d], [190, 360, 360]), d) + .5 * osc("square", np.interp(t, [0, .6, d], [95, 180, 180]), d), 1500, 2) * np.interp(t, [0, .04, .55, .64], [0, 1, .9, 0])
    x += _rms(chug) * ts * .8 + _rms(st) * .22 * np.interp(t, [0, .04, .55, .64], [0, 1, .9, 0])
    for at, g in ((.12, 1.0), (.38, .6)):
        _place(x, _thump(130, 55, .18, .035) * 1.1 + _tv_filter(noise6(.25, int(at * 100) + 2610), _glide(1500, 150, .25), 1.0, "bp") * expdecay(.25, .05) * .9, at, g)
    fire = np.interp(t, [0, .58, 1.5, d], [14, 14, 60, 60])
    eng = _diesel(d, fire, 2620, knock=.6, rumble=1.2, lp=420)
    envc = np.interp(t, [.56, .75, 1.3, 1.8, 2.3, d], [0, .5, 1.0, .8, .25, 0])
    eng = _lp4(eng, 380, 3) * envc
    x += _rms(eng) * envc * 1.1
    return norm6(_edge(x, .0006, .4), .8)


def sfx_lowbattery():
    """Binder's low battery (1.3 s): a descending two-tone device chime (E6 then B5, a bright sine with its octave, 0.2 s apart), the click of the screen going off and the power-down whine (a sine that falls
    from 2.9 kHz to 180 Hz in 0.7 s while it dies, with its octave at a third of the level)."""
    d = 1.3
    x = np.zeros(_n(d))
    for j, f in enumerate((1318.5, 987.8)):
        tt = tarr(.22)
        _place(x, (np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt) * np.exp(-tt / .05)) * np.exp(-tt / .09) * np.minimum(1, tt / .003), .2 * j, .7)
    dd = .7
    tt = tarr(dd)
    f = _glide(2900, 180, dd)
    wh = _sin_of(f) * np.exp(-tt / .28) * np.minimum(1, tt / .004) + .3 * _sin_of(f * 2.01) * np.exp(-tt / .15)
    _place(x, wh, .45, .5)
    _place(x, _band(2630, .02, 1500, 6500) * expdecay(.02, .003) * .5, .42, 1.0)
    return norm6(_edge(_lp4(x, 8000, 2), .0006, .1), .55)


def sfx_candleclick():
    """A tiny LED candle's switch (0.12 s), three times (Tomato's three candles): a small plastic slide-switch click (a 2 to 6 kHz burst of 10 ms, a 1.6 kHz tick) and a faint glass tink on the lens at
    4.2 kHz, each a little different."""
    k = _nth("candleclick")
    ps = (1.0, 1.06, .95)[k % 3]
    x = np.zeros(_n(.14))
    t = tarr(.04)
    _place(x, _band(2640 + k, .04, 2000, 6500) * expdecay(.04, .003) * .7 + np.sin(2 * np.pi * 1600 * ps * t) * np.exp(-t / .004) * .3, 0.0, 1.0)
    _place(x, _ping(4200 * ps, .1, .02, (1.0, 2.4), (1.0, .3), (1.0, .5)) * .2, .012, 1.0)
    return norm6(_edge(x, .0003, .03), .45)


def sfx_clickdead():
    """Brenda's flashlight clicking with nothing happening (0.3 s), twice: a hollow click of the switch (a 520 Hz body of a plastic case that dies in 12 ms, a click of 0.9 to 3 kHz) and nothing after it. The
    second is a double tap (the click, 70 ms later, softer)."""
    k = _nth("clickdead") % 2
    x = np.zeros(_n(.3))
    t = tarr(.06)
    c = np.sin(2 * np.pi * 520 * t) * np.exp(-t / .012) * .6 + _band(2650, .06, 900, 3000) * expdecay(.06, .005) * .6
    _place(x, c, 0.0, 1.0)
    if k == 1:
        _place(x, c, .07, .55)
    return norm6(_edge(x, .0004, .06), .5)


def sfx_breath():
    """A person breathing in the dark (designed event, 0.8 s): an inhale through the nose (a band of noise that rises through two soft formants, 500 and 1.4 kHz, over 0.3 s) and a longer, softer exhale
    (0.4 s), a little different each time."""
    k = _nth("breath")
    r = rng6(2660 + k)
    x = np.zeros(_n(.9))
    for at, dd, g, f2 in ((0.0, .3, .6, 1400), (.32, .5, .9, 1100)):
        tt = tarr(dd)
        nz = noise6(dd, 2661 + 3 * k + int(at * 10))
        b = (_res(nz, 500 * r.uniform(.9, 1.1), 2.0) * .9 + _res(nz, f2 * r.uniform(.9, 1.1), 2.5) * .5 + _lp4(nz, 3000, 2) * .25) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** 1.4
        _place(x, _lp4(b, 2800, 2), at, g)
    return norm6(_edge(x, .02, .2), .35)


# ================================================================ dayroom: cups of snow
def sfx_cupset():
    """A paper cup set down on wood (0.3 s), four times (Mango's scoop from the sill, then the line of cups): a soft hollow tock (a 500 to 2600 Hz burst of 10 ms, a 1.05 kHz body and a 300 Hz knock), the
    cup's paper creaking as it takes the weight and three grains of snow shifting in it. Each is a little different."""
    k = _nth("cupset")
    r = rng6(2700 + k)
    ps = (1.0, 1.07, .94, 1.03)[k % 4]
    x = np.zeros(_n(.3))
    t = tarr(.1)
    _place(x, _band(2701 + k, .1, 500, 2600) * expdecay(.1, .01) * .8 + np.sin(2 * np.pi * 1050 * ps * t) * np.exp(-t / .014) * .35 + np.sin(2 * np.pi * 300 * t) * np.exp(-t / .02) * .25, 0.0, 1.0)
    _place(x, _band(2702 + k, .08, 2500, 7000) * np.sin(np.pi * np.clip(tarr(.08) / .08, 0, 1)) * .12, .03, 1.0)
    for j in range(3):
        _place(x, _band(2710 + 5 * k + j, .008, 1500, 5000) * expdecay(.008, .003), .045 + .05 * j + r.uniform(0, .02), r.uniform(.1, .3))
    return norm6(_edge(x, .0005, .07), .5)


def sfx_slurp():
    """Water from a paper cup drunk with real pleasure (0.8 s), twice per resident: the suction (a band of noise that climbs from 480 to 1700 Hz in 0.38 s, bubbling at 30 Hz), the gurgle of six small bubbles
    (12 to 25 ms blips, 700 to 1800 Hz), the swallow (a low 'glk', a sine that falls from 190 to 105 Hz in 90 ms, with a throat click) and a satisfied breath out (a soft formant at 600 Hz, 0.25 s)."""
    k = _nth("slurp")
    r = rng6(2720 + k)
    x = np.zeros(_n(.85))
    dd = .38
    t = tarr(dd)
    suck = _tv_filter(noise6(dd, 2721 + k), _glide(480, 1700, dd), 3.5, "bp") * (1 + .5 * np.sin(2 * np.pi * (30 + 4 * (k % 3)) * t)) * np.interp(t, [0, .05, .25, dd], [0, 1, .9, 0])
    _place(x, suck, 0.0, .7)
    for i in range(6):
        dd2 = r.uniform(.012, .025)
        tt = tarr(dd2)
        _place(x, np.sin(2 * np.pi * r.uniform(700, 1800) * tt * (1 + 1.5 * tt / dd2)) * np.exp(-tt / (dd2 * .4)), r.uniform(.04, .34), r.uniform(.15, .4))
    tt = tarr(.09)
    _place(x, _sin_of(_glide(190, 105, .09)) * np.exp(-tt / .035) * .8 + _band(2722 + k, .09, 300, 1500) * expdecay(.09, .01) * .3, .44, .7)
    tt = tarr(.25)
    _place(x, _res(noise6(.25, 2723 + k), 600, 2.0) * np.sin(np.pi * np.clip(tt / .25, 0, 1)) * .35, .56, 1.0)
    return norm6(_edge(x, .01, .1), .5)


def sfx_pentick():
    """Lemon ticking the clipboard (0.3 s): the scratch of a ballpoint making a check mark (a 70 ms swell of 2 to 8 kHz noise, a down stroke and an up stroke) and the firm tap of the pen on the plastic board
    (a 900 Hz tk)."""
    x = np.zeros(_n(.32))
    tt = tarr(.07)
    _place(x, _band(2730, .07, 2000, 8000) * (np.sin(np.pi * np.clip(tt / .07, 0, 1)) ** 1.2) * (1 + .5 * np.sin(2 * np.pi * 70 * tt)) * .45, 0.0, 1.0)
    t = tarr(.05)
    _place(x, np.sin(2 * np.pi * 900 * t) * np.exp(-t / .008) * .5 + _band(2731, .05, 1000, 5000) * expdecay(.05, .004) * .7, .1, 1.0)
    return norm6(_edge(x, .0005, .05), .5)


# ================================================================ night: the clock, the wind, the time-lapse
def _bell(f, d, tau, a=.002):
    """The series' call-light bell at any length: a sine with the 2.76x and 5.4x partials dying faster, a soft attack."""
    t = tarr(d)
    x = (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / (tau * .45)) + .2 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / (tau * .22))) * np.exp(-t / tau)
    return x * np.minimum(1, t / a)


def sfx_clocktick():
    """The big wall clock of the station (a school-room regulator with a loud escapement). The first (1.7 s, the open): tick (a sharp click at 0.9 to 4.5 kHz over a hollow case at 1.45 kHz and 470 Hz) and,
    a second later, tock (lower, 1.15 kHz). The second (2.0 s, the wait): tick, tock and at 1.12 s the minute hand dropping to 11:00 with a heavier 'ka-chunk' (a 220 Hz clunk, a steel clack at 700 Hz and the
    spring of the movement)."""
    k = _nth("clocktick") % 2
    x = np.zeros(_n(2.0 if k else 1.7))

    def tk(freq, g):
        tt = tarr(.12)
        return (_band(2740, .12, 900, 4500) * expdecay(.12, .004) * .8 + np.sin(2 * np.pi * freq * tt) * np.exp(-tt / .018) * .6 + np.sin(2 * np.pi * (freq / 3.1) * tt) * np.exp(-tt / .035) * .4) * g
    _place(x, tk(1450, 1.0), 0.0, 1.0)
    _place(x, tk(1150, .85), 1.0, 1.0)
    if k == 1:
        tt = tarr(.3)
        _place(x, np.sin(2 * np.pi * 220 * tt) * np.exp(-tt / .04) * .9 + _band(2741, .3, 400, 3500) * expdecay(.3, .01) * .8 + _ping(700, .4, .07, (1.0, 2.5, 4.4), (.8, .4, .2), (1.0, .6, .4)) * .35, 1.12, 1.0)
        _place(x, tk(1700, .6), 1.2, 1.0)
    return norm6(_edge(x, .0004, .25), .55)


def sfx_windgust():
    """A gust against the glass (2.0 s, indoors): the building takes it (a roar closed at 520 Hz that swells in 0.25 s and falls away), a howl through the frame (a resonance that climbs from 380 to 630 Hz and
    back), the pane shivering (small ticks near 1.65 kHz) and the snow that comes with it hissing on the glass (4 to 9 kHz, 1.2 s)."""
    d = 2.0
    t = tarr(d)
    env = np.interp(t, [0, .25, .7, d], [0, 1, .55, 0]) ** 1.2
    roar = _rms(_lp4(noise6(d, 2750), 520, 3)) * env
    howl = _rms(_tv_filter(noise6(d, 2751), 380 + 250 * env, 12.0, "bp")) * env ** 2 * .6
    r = rng6(2752)
    x = roar + howl
    for i in range(14):
        _place(x, _ping(r.uniform(1500, 1800), .08, .015, (1.0, 2.4), (1.0, .4), (1.0, .5)) * .05, r.uniform(.1, 1.2), 1.0)
    x = x + _band(2753, d, 4000, 9000) * np.interp(t, [0, .35, .9, d], [0, 1, .5, 0]) * .1
    return norm6(_edge(x, .02, .4), .5)


def sfx_badgepeel():
    """A sticker peeled off a badge and pressed on again (0.9 s): the lifting (a paper rasp from 2 to 5 kHz roughened at 110 Hz as the glue lets go, 0.2 s), the pat of the sticker on the plastic (a 200 Hz thump
    and a 1.5 kHz tick) and the thumb smoothing it down (a 1 to 4 kHz rub fluttering at 14 Hz for 0.25 s, with one small squeak)."""
    x = np.zeros(_n(.95))
    d = .2
    t = tarr(d)
    _place(x, _tv_filter(noise6(d, 2760), _glide(2000, 5000, d), 1.4, "bp") * (.55 + .45 * np.sign(np.sin(2 * np.pi * 110 * t))) * np.minimum(1, t / .02) * np.interp(t, [0, d * .8, d], [1, 1, 0]), 0.0, .9)
    tt = tarr(.1)
    _place(x, np.sin(2 * np.pi * 200 * tt) * np.exp(-tt / .025) * .6 + _band(2761, .1, 1000, 4500) * expdecay(.1, .008) * .6, .27, 1.0)
    dd = .25
    t2 = tarr(dd)
    _place(x, _band(2762, dd, 1000, 4000) * (.6 + .4 * np.sin(2 * np.pi * 14 * t2)) * np.sin(np.pi * np.clip(t2 / dd, 0, 1)) * .2, .38, 1.0)
    _place(x, _sin_of(_glide(1900, 2500, .06)) * np.sin(np.pi * np.clip(tarr(.06) / .06, 0, 1)) * .06, .5, 1.0)
    return norm6(_edge(x, .003, .12), .6)


def sfx_lapsewhoosh():
    """The time-lapse begins (1.9 s, stereo): a big whoosh like a tape winding up. A band of air that climbs from 250 Hz to 7 kHz (a different noise in each ear, a resonance of 1.6) swelling to a peak at 0.6 s and
    falling away by 1.9 s, a sine that winds up from 90 to 1400 Hz under it, a hard 'thwip' at the start and a soft low whump of displaced air."""
    d = 1.9
    t = tarr(d)
    env = np.interp(t, [0, .05, .6, 1.2, d], [0, .6, 1.0, .5, 0])
    out = np.zeros((2, _n(d)))
    for c in range(2):
        out[c] = _rms(_tv_filter(noise6(d, 2770 + c), 250 * (7000 / 250) ** (np.clip(t / 1.4, 0, 1)), 1.6, "bp")) * env * .6
    wind_up = _sin_of(90 * (1400 / 90) ** (np.clip(t / 1.3, 0, 1))) * env * .1
    out += np.stack([wind_up, wind_up])
    for c in range(2):
        _place(out[c], _band(2772 + c, .03, 2500, 9000) * expdecay(.03, .004) * .8 + _lp4(noise6(.2, 2774 + c), 300, 2) * expdecay(.2, .05) * .5, 0.0, 1.0)
    return norm6(_edge(out, .003, .4), .7)


def sfx_whoosh_s():
    """A small whoosh (0.55 s, stereo; designed event): the rounds, or a sleeper changing pose, in the time-lapse. A soft band of air (1.6 kHz sliding down to 800 Hz), a fast pan from one side to the other
    (the side alternates from one to the next), a soft attack."""
    k = _nth("whoosh_s")
    d = .55
    t = tarr(d)
    nz = _tv_filter(noise6(d, 2780 + k), _glide(1600, 800, d), 1.8, "bp") * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    side = 1 if k % 2 else -1
    pan = side * np.interp(t, [0, d], [-.8, .8])
    return norm6(_edge(_pan_curve(nz, pan), .01, .15), .35)


def sfx_rustle():
    """A sleeper turning over under a grey blanket (0.5 s; designed event): the cloth (noise from 200 to 2500 Hz in three irregular swells) and the creak of the cot's frame (a 380 Hz squeak of 0.15 s)."""
    k = _nth("rustle")
    r = rng6(2790 + k)
    x = np.zeros(_n(.55))
    for j, (at, dd) in enumerate(((0.0, .22), (.17, .18), (.33, .15))):
        tt = tarr(dd)
        _place(x, _band(2791 + 3 * k + j, dd, 200, 2500) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** 1.2, at, r.uniform(.5, 1.0))
    dd = .15
    tt = tarr(dd)
    _place(x, _sin_of(_glide(360, 400, dd)) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 30 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) * .1, .05, 1.0)
    return norm6(_edge(x, .01, .1), .3)


def sfx_glint():
    """A single tiny glint tone for the sunrise (designed event, 1.4 s): G7 on glass with its faint 2.76x partial, which rings and goes."""
    return norm6(_edge(_glass(midi(103), 1.4, .45, .002) * .8 + _glass(midi(115), .5, .12, .001) * .12, .001, .3), .25)


def sfx_clockspin():
    """The clock in the time-lapse (from the cue to the end of the lapse and a hair past it): the wall clock's ratchet speeds up with the picture's world speed, from one tick a second to sixty, so the ticks run
    together into a flutter, under a whir of gears whose pitch follows the rate (120 Hz plus 6 Hz for every tick a second); as the speed eases out it falls back to single ticks and a last, heavier tock at the
    end of the lapse (7:00). Reads the lapse's curve (build/ep21/lapse.json, or the fixed curve)."""
    cue = (_cue_times("clockspin") or [LAPSE.a + .2])[0]
    end = LAPSE.b
    d = (end - cue) + .5
    t = tarr(d)
    ta = cue + t
    u = LAPSE.u_at(ta)
    rate = 60.0 ** u
    ph = np.cumsum(rate) / SR
    cross = np.where(np.diff(np.floor(ph)) > 0)[0] + 1
    x = np.zeros(_n(d))
    r = rng6(2800)
    for j, i in enumerate(cross):
        if ta[i] > end - .02:
            break
        uu = u[i]
        f = 1450 - 250 * (j % 2) + 350 * uu
        tt = tarr(.04)
        c = _band(2801 + j % 16, .04, 900, 4500) * expdecay(.04, .004) * .8 + np.sin(2 * np.pi * f * tt) * np.exp(-tt / .008) * .6
        _place(x, c, i / SR, (1.0 / (1 + 4 * uu)) * (.85 + .3 * r.uniform()))
    mh = np.cumsum(1.1 * u) / SR                                                    # the minute hand: 66 minutes a second is 1.1 turns a second, once round per sweep of the whir
    whir = _sin_of(120 + 6 * rate * (1 + .04 * u * np.sin(2 * np.pi * .37 * t))) * (.65 + .35 * np.sin(2 * np.pi * mh)) * u ** 1.5
    x = x + _lp4(whir, 2500, 2) * .18
    ti = int((end - cue) * SR)
    tt = tarr(.16)
    _place(x, (np.sin(2 * np.pi * 1000 * tt) * np.exp(-tt / .03) * .8 + _band(2820, .16, 600, 4000) * expdecay(.16, .006)) * 1.0, ti / SR, 1.0)
    return norm6(_edge(x, .003, .15), .5)


def sfx_windswell():
    """The wind rises with the time-lapse (from the cue at 11.65 s to the Moon's first word at 18.70 s): a blizzard (see wind) whose strength follows the picture's world speed (0.35 + 0.9 u), speeded up like a
    tape by the same curve (a rate of 1 to 2.1, so its gusts flutter and its howl climbs), rising slowly to the peak at 16.9 s and falling away to nothing as the lapse ends and the snow's silence arrives."""
    cue = (_cue_times("windswell") or [LAPSE.a + 1.0])[0]
    end = LAPSE.b
    d = (end + .4) - cue
    n = _n(d)
    src_d = d * 2.3 + 1.0
    ta = cue + np.arange(_n(src_d)) / SR
    u = LAPSE.u_at(np.minimum(ta, end + 5))
    g = np.clip(.35 + .9 * np.interp(np.arange(_n(src_d)) / SR, np.arange(n) / SR, LAPSE.u_at(cue + np.arange(n) / SR), right=0.0), .08, 1.7)
    w = wind(src_d, 2830, env=g, howl=1.3)
    w = warp(w, cue, n, 2.1)
    t = tarr(d)
    amp = np.interp(t, [0, .8, 2.5, d - 2.0, d - .9, d], [0, .12, .5, 1.0, .35, 0])
    return norm6(_edge(w * amp, .02, .25), .55)


def sfx_plowrumble():
    """The plow passes the window at dawn, close (3.4 s; designed event): a diesel at 27 to 33 Hz firing that swells as it passes (peak at 1.1 s), low-passed at 520 Hz, the blade's scrape (steel on the road,
    500 to 1500 Hz at 16 Hz, -20 dB), the amber beacon's motor hum (a triangle at 190 Hz) and the glass shivering in its frame at the peak (a faint resonance at 190 Hz). Stereo: it passes from left to right."""
    d = 3.4
    t = tarr(d)
    fire = np.interp(t, [0, 1.1, d], [27, 33, 29])
    eng = _lp4(_diesel(d, fire, 2840, knock=.5, rumble=1.0, lp=420), 520, 3)
    env = np.interp(t, [0, 1.1, d], [0, 1, 0]) ** 1.2
    scr = _band(2841, d, 500, 1500) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 16 * t))) * env
    hum = (2 * np.abs(2 * ((np.cumsum(np.full(len(t), 190.0)) / SR) % 1) - 1) - 1) * env * .03
    glass = _res(noise6(d, 2842), 190, 6.0) * env ** 2 * .05
    x = _rms(eng) * env + _rms(scr) * .12 * env + hum + glass
    return norm6(_edge(_pan_curve(x, np.interp(t, [0, d], [-.7, .7])), .3, .6), .5)


# ================================================================ the text ding, the stings
def sfx_textding():
    """A text ding (1.0 s): a soft two-note bell, the tonic and the fifth of the key of the scene that finishes typing itself: G6 then D7 in the title (G major), C6 then G6 on the end card (C major), the
    second 90 ms after the first."""
    k, scene, i = _ctx("textding")
    f1, f2 = (1046.5, 1568.0) if scene == "end" else (1568.0, 2349.3)
    x = np.zeros(_n(1.0))
    _place(x, _call_ding(f1, .22), 0.0, .9)
    _place(x, _call_ding(f2, .3), .09, .8)
    return norm6(_edge(x, .0004, .2), .7)


def _soft(notes, d, a=.04, tau=None, lp=1800, saw=.5):
    """A warm chord for the stings: sines and a little saw, a slow attack, closed off at `lp`."""
    t = tarr(d)
    tau = tau or d * .6
    x = sum(np.sin(2 * np.pi * midi(m) * t) + saw * osc("saw", midi(m) * 1.002, d) * .4 for m in notes) / max(1, len(notes))
    return _lp4(x, lp, 2) * np.minimum(1, t / a) * np.exp(-t / tau)


def sfx_sting():
    """The series' stings, one fitted to each scene (1.0 to 1.55 s).
    forecast (after Tomato's second 'Snow day!', Onion in her snow pile): a bright glass 'ding-ding' (C6 then E6) that the bass clarinet answers with a flat low E-flat that sags: the party, and the policy.
    lot (the five in a row): a shake of sleigh bells that thins out and two plucked notes falling (G3, D3: plink, plonk) over a breath of wind.
    blackout (after 'It was a good flashlight.'): warm. An F major chord on soft strings and a cello (the key of the lullaby), a music-box glint on top, and, at the end, so quiet that it is more a feeling,
    the hollow click of a switch with nothing behind it.
    dayroom (after the Moon): the celesta's four falling notes (C7 A6 F6 C6) over a warm F major pad, and a breath of the weather that the Moon could not see through.
    night (the held beat of the sunrise): G major, the title's own key: soft strings, a glass chord, a sleigh-bell shimmer and one low, tired pizzicato at the end."""
    k, scene, i = _ctx("sting")
    x = np.zeros(_n(1.6))
    if scene == "forecast":
        _place(x, _bell(1046.5, .7, .3), 0.0, .5)
        _place(x, _bell(1318.5, .8, .35), .13, .55)
        _place(x, _glass(midi(100), .5, .15, .001) * .3, .13, .6)
        _place(x, M20.bassclar(51, 1.0, .85) * 1.0, .42, .55)
        _place(x, _soft((39,), .9, .05, .5, 500), .42, .35)
    elif scene == "lot":
        _place(x, _lp4(_sleigh(.9, 2860, 26, 3200, 8500, tau=.08), 9000, 2), 0.0, .6)
        for at, m in ((.18, 55), (.62, 50)):
            _place(x, M20.pizz(midi(m), .5), at, .9)
        t = tarr(1.4)
        _place(x, _tv_filter(noise6(1.4, 2861), 420 + 100 * np.sin(2 * np.pi * .5 * t), 8.0, "bp") * np.interp(t, [0, .5, 1.4], [0, 1, 0]) * .08, 0.0, 1.0)
    elif scene == "blackout":
        d = 1.5
        _place(x, _soft((41, 48, 53, 57, 60, 64), d, .12, .8, 1700), 0.0, 1.0)
        _place(x, _soft((29,), d, .1, .8, 600), 0.0, 1.0)
        _place(x, _mbox(midi(89), 1.2) * .5, .22, 1.0)
        _place(x, _mbox(midi(93), 1.2) * .4, .42, 1.0)
        tt = tarr(.06)
        _place(x, np.sin(2 * np.pi * 520 * tt) * np.exp(-tt / .012) * .12 + _band(2862, .06, 900, 3000) * expdecay(.06, .005) * .1, 1.2, 1.0)
    elif scene == "dayroom":
        for j, m in enumerate((96, 93, 89, 84)):
            _place(x, M20.celesta(m, 1.0, .6) * .8, .1 + .22 * j, .6)
        _place(x, _soft((41, 48, 53, 57, 60, 64), 1.5, .12, .7, 1500, .3), 0.0, .9)
        t = tarr(1.5)
        _place(x, _tv_filter(noise6(1.5, 2863), 480 + 140 * np.sin(2 * np.pi * .6 * t), 9.0, "bp") * np.interp(t, [0, .6, 1.5], [0, 1, 0]) * .06, 0.0, 1.0)
    else:                                                                                     # night
        d = 1.55
        _place(x, _soft((43, 50, 55, 59, 62, 67), d, .1, .85, 1900), 0.0, 1.0)
        for j, m in enumerate((79, 83, 86)):
            _place(x, _glass(midi(m + 12), 1.2, .6, .002) * .4, .08 + .06 * j, .7)
        _place(x, _lp4(_sleigh(1.2, 2864, 22, 3400, 8800, tau=.1), 9000, 2), .05, .35)
        _place(x, M20.pizz(midi(38), .6), 1.0, .8)
    x = x[:_n(1.55)]
    return norm6(_edge(x, .0005, .3), .75)


# ---------------------------------------------------------------- reused from Episode 19, verbatim: the room tones' parts, Binder's pop, Onion's sniffle, the typing, the physics foley family
def sfx_binderpop():
    """Binder appears (0.4 s): a cartoon pop (a sine that jumps from 300 to 1500 Hz in 25 ms, plus a bright tick) and the springy boing of a wire handle (a sine at 330 Hz that sags to 240
    with a 16 Hz wobble that dies in 0.3 s, a hair of twang under the pop)."""
    x = np.zeros(_n(.4))
    t = tarr(.1)
    f = 300 + 1200 * (1 - np.exp(-t / .008))
    _place(x, _sum(_sin_of(f) * np.exp(-t / .02) * 1.3, _band(1800, .1, 2500, 8000) * expdecay(.1, .002) * .7), 0.0, 1.0)
    d = .34
    t = tarr(d)
    fb = (330 - 90 * (1 - np.exp(-t / .12))) * (1 + .08 * np.sin(2 * np.pi * 16 * t) * np.exp(-t / .12))
    _place(x, (_sin_of(fb) + .5 * _sin_of(2 * fb) + .25 * _sin_of(3 * fb)) * np.exp(-t / .09) * np.minimum(1, t / .004), .03, .3)
    return norm6(_edge(x, .0004, .08), .7)


def sfx_sniffle():
    """Onion's sniffle (0.5 s): a wet inhale through the nose, twice (a band of noise that moves up through two nasal formants, 700 then 1500 Hz) and a snort of 'nnk' at the end (a 150 Hz
    nasal buzz for 40 ms), a few wet crackles. Each call is a little different."""
    k = _nth("sniffle")
    r = rng6(1880 + k)
    x = np.zeros(_n(.55))
    for j, at in enumerate((0.0, .2 + .03 * r.uniform())):
        d = .17
        t = tarr(d)
        air = _tv_filter(noise6(d, 1890 + 2 * k + j), _glide(700 + 150 * j, 1500 + 200 * j, d), 2.2, "bp") * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
        _place(x, air, at, .6 + .25 * j)
        _place(x, _lp4(osc("saw", 150 + 15 * j, .04), 1200, 2) * np.hanning(_n(.04)) * .35, at + d - .02, 1.0)
    for i in range(9):
        _place(x, _band(1900 + 9 * k + i, .006, 1500, 4500) * expdecay(.006, .002), r.uniform(.02, .36), r.uniform(.1, .3))
    return norm6(_edge(x, .003, .08), .55)


def _hit_train(seed, d, n, lo, hi, tau, g0, g1, t0=0.0, t1=None, shape=1.0):
    """n small noise ticks scattered between t0 and t1 (denser early when shape > 1), each a band lo..hi that dies in tau: gravel, splinters, strands, debris. Returns (2, samples)."""
    r = rng6(seed)
    out = np.zeros((2, _n(d)))
    t1 = d if t1 is None else t1
    for i in range(n):
        u = r.uniform() ** shape
        at = t0 + (t1 - t0) * u
        dd = min(.08, max(.01, tau * 6))
        c = _band(seed + 1 + i, dd, r.uniform(lo, lo * 1.4), r.uniform(hi * .7, hi)) * expdecay(dd, tau * r.uniform(.6, 1.4))
        pan = r.uniform(-.9, .9)
        th = (pan + 1) * np.pi / 4
        g = (g0 + (g1 - g0) * u) * r.uniform(.4, 1.0)
        j = int(at * SR)
        m = min(len(c), out.shape[1] - j)
        if m > 0:
            out[0, j:j + m] += c[:m] * np.cos(th) * g
            out[1, j:j + m] += c[:m] * np.sin(th) * g
    return out


PHYS_EVENTS = []


LOUD = {"tile": .9, "metal": 1.0, "glass": .9, "ceramic": .85, "concrete": 1.0, "wood": 1.0, "plastic": .75, "rubber": .7, "cardboard": .6, "paper": .5, "leaf": .45, "soil": .55, "fabric": .4}


HARD = ("metal", "glass", "ceramic", "tile", "concrete", "wood", "plastic", "rubber", "cardboard", "paper", "leaf", "soil", "fabric")


def _m_wood(ps, ds, seed):
    d = .15 * ds
    t = tarr(d)
    return np.sin(2 * np.pi * 360 * ps * t) * np.exp(-t / (.016 * ds)) + .5 * np.sin(2 * np.pi * 860 * ps * t) * np.exp(-t / (.008 * ds)) + _band(seed, d, 500, 2600) * np.exp(-t / (.006 * ds)) * .9


def _m_metal(ps, ds, seed):
    d = .5 * ds
    return _ping(820 * ps, d, .08 + .1 * ds, (1.0, 2.76, 5.4, 8.9), (1.0, .5, .25, .12), (1.0, .55, .3, .2)) + _band(seed, d, 3000, 9000) * expdecay(d, .002) * .4


def _m_plastic(ps, ds, seed):
    d = .1 * ds
    t = tarr(d)
    return np.sin(2 * np.pi * 1150 * ps * t) * np.exp(-t / (.01 * ds)) + _band(seed, d, 2000, 6500) * np.exp(-t / .004) * .8


def _m_glass(ps, ds, seed):
    d = .35 * ds
    return _glass(2600 * ps, d, .05 + .05 * ds, .001) + _band(seed, d, 3000, 9000) * expdecay(d, .0015) * .3


def _m_ceramic(ps, ds, seed):
    d = .25 * ds
    return _ping(1900 * ps, d, .03 + .04 * ds, (1.0, 2.3, 4.1), (1.0, .45, .2), (1.0, .5, .3)) + _band(seed, d, 3000, 8000) * expdecay(d, .002) * .35


def _m_cardboard(ps, ds, seed):
    d = .13 * ds
    t = tarr(d)
    return _lp4(noise6(d, seed), 1300, 2) * np.exp(-t / (.02 * ds)) + np.sin(2 * np.pi * 170 * ps * t) * np.exp(-t / .02) * .5


def _m_fabric(ps, ds, seed):
    d = .16 * ds
    t = tarr(d)
    return _lp4(noise6(d, seed), 380, 2) * np.exp(-t / (.035 * ds)) + np.sin(2 * np.pi * 85 * ps * t) * np.exp(-t / .03) * .6


def _m_concrete(ps, ds, seed):
    d = .26 * ds
    t = tarr(d)
    return _sin_of((62 + 78 * np.exp(-t / .03)) * ps) * np.exp(-t / (.05 * ds)) + _band(seed, d, 150, 1500) * np.exp(-t / .02) * .8 + _band(seed + 1, d, 2000, 7000) * np.exp(-t / .002) * .25


def _m_rubber(ps, ds, seed):
    d = .18 * ds
    t = tarr(d)
    return _sin_of((210 + 120 * np.exp(-t / .03)) * ps) * np.exp(-t / .03) + _lp4(noise6(d, seed), 900, 2) * np.exp(-t / .01) * .4


def _m_soil(ps, ds, seed):
    d = .22 * ds
    t = tarr(d)
    return _lp4(noise6(d, seed), 800, 2) * np.exp(-t / (.05 * ds)) + _hit_train(seed + 5, d, 8, 400, 2500, .004, .2, .05)[0] * .5 + np.sin(2 * np.pi * 70 * ps * t) * np.exp(-t / .06) * .5


def _m_paper(ps, ds, seed):
    d = .14 * ds
    t = tarr(d)
    return _band(seed, d, 1500, 7500) * np.exp(-t / (.02 * ds)) * .9 + _lp4(noise6(d, seed + 3), 500, 2) * np.exp(-t / .012) * .3 + _band(seed + 5, d, 300, 1200) * np.exp(-t / (.04 * ds)) * .25


def _m_tile(ps, ds, seed):
    """Vinyl tile over concrete (the corridor): a short dry 'tak' (a 1.3 kHz knock that dies in 8 ms, a click of 800 Hz to 3.5 kHz) over a dull slab thud (90 Hz) and a faint ring."""
    d = .2 * ds
    t = tarr(d)
    return np.sin(2 * np.pi * 1300 * ps * t) * np.exp(-t / .008) + _band(seed, d, 800, 3500) * np.exp(-t / .004) * .8 + _sin_of((50 + 50 * np.exp(-t / .03)) * ps) * np.exp(-t / .05) * .6


_MV = {"tile": _m_tile, "paper": _m_paper, "leaf": _m_paper, "wood": _m_wood, "metal": _m_metal, "plastic": _m_plastic, "glass": _m_glass, "ceramic": _m_ceramic, "cardboard": _m_cardboard, "fabric": _m_fabric, "concrete": _m_concrete,
       "rubber": _m_rubber, "soil": _m_soil}


def sfx_phys():
    """One collision from the simulation (build/ep21/phys_events.json), 0.1 to 0.5 s, by the pair of materials 'a+b': each material has its own short voice (wood a knock at 360 Hz, metal a
    ring with inharmonic partials, plastic a tick, glass a ping, ceramic a clink, cardboard a dull flap, fabric a soft thump, concrete a heavy dull thud with grit, rubber a bwip, soil a
    crunch); the harder of the two carries 60 percent. The magnitude sets the length (0.75 to 1.35 of the voice's), lowers the pitch (a heavy hit is lower: 1.35 down to 0.75 of the
    voice's) and, through the event's own gain, the level; a seed from the event's index and time makes every repeat different. A 'slide' is a scrape."""
    k = _nth("phys")
    ev = PHYS_EVENTS[k] if k < len(PHYS_EVENTS) else {"mat": "plastic+plastic", "mag": .3, "t": k}
    mag = float(np.clip(ev.get("mag", .3), 0, 1))
    seed = 4000 + 3 * k + int(ev.get("t", 0) * 1000) % 997
    r = rng6(seed)
    if ev.get("k") == "slide":
        d = .2 + .3 * mag
        t = tarr(d)
        x = _band(seed, d, 400, 2600) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 38 * t))) * np.sin(np.pi * np.clip(t / d, 0, 1))
        return norm6(_edge(x, .01, .05), .6)
    ps = (1.35 - .6 * mag) * r.uniform(.94, 1.06)
    ds = .75 + .6 * mag
    if "can" in str(ev.get("tag", "")).split("+"):      # the extinguisher: a hollow steel can (a bong that rings, a buzz as it rattles on whatever it hit), whatever the other thing is
        d = .6 * ds
        t = tarr(d)
        f0 = 360 * ps
        x = sum(a_ * np.sin(2 * np.pi * f0 * r_ * t) * np.exp(-t / (.2 * s_)) for r_, a_, s_ in ((1.0, 1.0, 1.0), (2.4, .5, .55), (3.9, .3, .35), (5.6, .18, .25)))
        x += _band(seed, d, 700, 4500) * np.exp(-t / .004) * .8
        buzz = _band(seed + 9, .16, 400, 2200) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 95 * tarr(.16)))) * np.exp(-tarr(.16) / .05) * .5
        _place(x, buzz, .01, 1.0)
        other = [m for m in str(ev.get("mat", "")).split("+") if m in _MV and m != "metal"]
        if other:
            _place(x, _unit(_MV[other[0]](ps, ds * .6, seed + 21)) * .5, 0.0, 1.0)
        return norm6(_edge(x, .0003, .05), .7)
    mats = [m for m in str(ev.get("mat", "plastic+plastic")).split("+") if m in _MV] or ["plastic"]
    if len(mats) == 1:
        mats = mats * 2
    a, b = sorted(mats[:2], key=HARD.index)
    ca = _unit(_MV[a](ps, ds, seed)) * .6
    cb = _unit(_MV[b](ps * r.uniform(.9, 1.1), ds, seed + 17)) * .4
    n = max(len(ca), len(cb))
    x = np.zeros(n)
    x[:len(ca)] += ca
    x[:len(cb)] += cb
    x *= (LOUD[a] + LOUD[b]) / 2
    return norm6(_edge(x, .0003, .02), .7)


def sfx_typing():
    """The end card's rows typing themselves in (2.3 s): a soft keyboard, a thock and a click per stroke (closed off at 4.2 kHz), words of four to seven strokes at about 95 ms with a space between
    and an Enter at the end of each of the six rows. Each stroke is a little different."""
    k = _nth("typing")
    r = rng6(1970 + k)
    d = 2.3
    x = np.zeros(_n(d + .1))
    t = .03
    j = 0
    while t < d - .12:
        g_ = r.uniform(.5, 1.0)
        _place(x, _key(1971 + 11 * k + j, j % 6 == 5), t, g_)
        _place(x, _band(2000 + 13 * k + j, .012, 2500, 7000) * expdecay(.012, .0015), t, g_ * .35)
        t += .095 * r.uniform(.75, 1.3) + (.07 if j % 18 == 17 else 0)
        j += 1
    return norm6(_edge(_lp4(x, 4200, 2), .001, .06), .6)


def _wob(d, seed, fc=.2, depth=.25):
    """A slow level wobble around 1."""
    return 1 + depth * _smooth_rand(d, seed, fc)


def _diffuse(fn, seed):
    """A diffuse texture: two independent takes of the same recipe, one per ear."""
    return np.stack([fn(seed), fn(seed + 500)])


def _hvac(d, seed, duct=160.0, low=420.0):
    """Air handling: a low rumble of noise that breathes (to `low` Hz), a thin hiss (1.5 to 5 kHz) and a faint duct tone."""
    t = tarr(d)
    return (_lp4(noise6(d, seed), low, 2) * _wob(d, seed + 1, .18, .3) * 1.0 + _band(seed + 2, d, 1500, 5000) * .06 * _wob(d, seed + 3, .22, .3)
            + np.sin(2 * np.pi * duct * t) * .02 * _wob(d, seed + 4, .1, .4))


def _hum(d, f0, harm=((1, 1.0), (2, .4), (3, .2))):
    t = tarr(d)
    return sum(a * np.sin(2 * np.pi * f0 * h * t + h) for h, a in harm)


def _ticks(d, seed, period=1.0, t0=.37, fs=(1700, 1300)):
    """A wall clock: tick and tock, `period` seconds apart."""
    out = np.zeros(_n(d))
    t, j = t0, 0
    while t < d - .05:
        tt = tarr(.04)
        c = np.sin(2 * np.pi * fs[j % 2] * tt) * np.exp(-tt / .004) * .6 + _band(seed + j % 7, .04, 900, 4500) * expdecay(.04, .003) * .8
        _place(out, c, t, 1.0 if j % 2 == 0 else .8)
        t += period
        j += 1
    return out


def _babble(d, seed, voices=3, lo=160, hi=2600):
    """Distant conversation: for each talker, phrases of 0.7 to 2.4 s (a voiced buzz at 105 to 235 Hz that wanders, through two vowel formants, switched on and off 3 to 5.5 times a second like
    syllables) separated by pauses; the sum closed to `lo` to `hi` Hz. Not words: the murmur of people in another room."""
    r = rng6(seed)
    out = np.zeros(_n(d))
    for v in range(voices):
        f0 = r.uniform(105, 235)
        t = r.uniform(0, 1.5)
        while t < d:
            ph = r.uniform(.7, 2.4)
            nn = _n(ph)
            tt = np.arange(nn) / SR
            syl = np.clip(.5 + .5 * np.sin(2 * np.pi * r.uniform(3.2, 5.5) * tt + r.uniform(0, 6.28)), 0, 1) ** 1.5
            f = f0 * (1 + .08 * np.sin(2 * np.pi * r.uniform(.6, 1.3) * tt + r.uniform(0, 6.28)) + .1 * tt / ph * r.uniform(-1, 1))
            sw = 2 * ((np.cumsum(f) / SR) % 1) - 1
            seg = (_res(sw, r.uniform(400, 750), 3.0) * .9 + _res(sw, r.uniform(1100, 2000), 3.5) * .5) * syl * np.hanning(nn) ** .6
            i = int(t * SR)
            m = min(nn, len(out) - i)
            if m > 0:
                out[i:i + m] += seg[:m] * r.uniform(.5, 1.0)
            t += ph + r.uniform(.4, 2.8)
    return _bp4(out, lo, hi, 2)


def _phone(d, seed, every=(5.5, 9.0), lpf=2400):
    """A distant telephone: the double ring (440 and 480 Hz, a 20 Hz warble, 0.4 s on, 0.2 off, 0.4 on) every few seconds, closed off as if it were down the hall."""
    r = rng6(seed)
    out = np.zeros(_n(d))
    t = r.uniform(1.0, 3.5)
    while t < d - 1.2:
        for at in (0.0, .6):
            tt = tarr(.4)
            ring = (np.sin(2 * np.pi * 440 * tt) + np.sin(2 * np.pi * 480 * tt)) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 20 * tt))) * np.minimum(1, np.minimum(tt / .01, (.4 - tt) / .02))
            _place(out, ring, t + at, 1.0)
        t += r.uniform(*every)
    return _lp4(out, lpf, 2)


def _typing_far(d, seed, bursts=(2.0, 5.0)):
    """Somebody typing at a desk down the hall: bursts of 6 to 20 soft key taps."""
    r = rng6(seed)
    out = np.zeros(_n(d))
    t = r.uniform(.3, 1.5)
    while t < d - 1.0:
        for j in range(int(r.integers(6, 20))):
            _place(out, _key(int(seed + t * 7 + j)) * .6, t, r.uniform(.4, 1.0))
            t += r.uniform(.07, .16)
        t += r.uniform(*bursts)
    return _lp4(out, 3500, 2)


def _chimes_far(d, seed, every=(6.0, 10.0)):
    """The call light's chime, far away at the other end of the building: ding-dong, closed off at 2.2 kHz."""
    r = rng6(seed)
    out = np.zeros(_n(d))
    t = r.uniform(2.5, 5.0)
    while t < d - 1.2:
        _place(out, _bell(880.0, .6, .3), t, 1.0)
        _place(out, _bell(659.26, .7, .34), t + .42, .9)
        t += r.uniform(*every)
    return _lp4(out, 2200, 2)


def _tv_far(d, seed, level=1.0):
    """A television in another room: two talkers closed to 250 Hz to 2 kHz, a swell of audience laughter every ten seconds or so (a band of noise breathing at 6.5 Hz for 1.2 s)."""
    x = _bp4(_babble(d, seed, 2, 250, 2800), 250, 2000, 2)
    r = rng6(seed + 9)
    lau = np.zeros(_n(d))
    t = r.uniform(3.0, 6.0)
    while t < d - 1.5:
        tt = tarr(1.2)
        _place(lau, _bp4(noise6(1.2, int(seed + t)), 500, 3500, 2) * (.6 + .4 * np.sin(2 * np.pi * 6.5 * tt)) * np.sin(np.pi * np.clip(tt / 1.2, 0, 1)) ** 1.5, t, 1.0)
        t += r.uniform(8.0, 13.0)
    return (_rms(x, 1.0) + _rms(lau, .6) * (np.sqrt(np.mean(lau ** 2)) > 0)) * level


def _mix(parts, d):
    """Sum (stereo, level) parts and trim to the length of the bed."""
    n = _n(d)
    out = np.zeros((2, n))
    for p, g in parts:
        p = np.asarray(p)
        if p.ndim == 1:
            p = np.stack([p, p])
        out[:, :min(n, p.shape[1])] += p[:, :n] * g
    return out


PHYS_BOOST = {}


def _tagkey(e):
    """The first of the boosted names that the event's tag ('can+floor', 'easel+can' ...) contains, else ''."""
    parts = str(e.get("tag", "")).split("+")
    return next((k for k in PHYS_BOOST if k in parts), "")


def _select_phys(phys, scripted):
    """Choose the collisions that are heard: every first impact of a pair of objects, then the loudest, with the density cap and the 40 ms rule."""
    ev = sorted((dict(e) for e in phys if e.get("name", "phys") == "phys"), key=lambda e: e["t"])
    seen, first = set(), set()
    for i, e in enumerate(ev):
        tag = e.get("tag") or e.get("mat")
        if tag not in seen:
            seen.add(tag)
            first.add(i)
    big = [t for t, nm, g, p in scripted if nm in BIG_CUES]
    order = sorted(range(len(ev)), key=lambda i: (i not in first, -ev[i].get("mag", 0)))
    keep = []
    for i in order:
        e = ev[i]
        if any(abs(e["t"] - tb) < .04 for tb in big):
            continue
        if e.get("mag", 0) < .05 and i not in first:
            continue
        near = [j for j in keep if abs(ev[j]["t"] - e["t"]) < .05]
        sec = [j for j in keep if int(ev[j]["t"]) == int(e["t"])]
        if len(near) >= 2 or len(sec) >= 14:
            continue
        keep.append(i)
    out = []
    for i in sorted(keep, key=lambda j: ev[j]["t"]):
        e = ev[i]
        mag = float(e.get("mag", .3))
        out.append({"t": round(e["t"] + (.0 if i in first else .0), 3), "name": "phys", "mat": e.get("mat", "plastic+plastic"), "mag": round(mag, 3), "k": e.get("k", "hit"), "tag": e.get("tag", ""),
                    "vol": round(min(.9, (.05 + .30 * mag ** 1.3) * (.6 if e.get("k") == "slide" else 1.0) * PHYS_BOOST.get(_tagkey(e), 1.0)), 4), "pan": float(np.clip(e.get("pan", 0), -1, 1)), "room": "hall"})
    return out




# ================================================================ Episode 20: the room tone of every space (beds)
# A bed is a designed event the script does not list (see _designed_events): a stereo texture that fills one scene. It is returned at unit RMS; the event's gain sets its level (BED_DB: dB under a
# spoken line). Beds skip the scene's reverb (NOREV): each already has its room baked in (the lot has no room at all).
BED_DB = {"title": -34, "forecast": -25, "lot": -8, "blackout": -19, "dayroom": -24, "night": -24, "end": -40}
BED_SCENE = {"title": "title", "forecast": "forecast", "lot": "lot", "blackout": "blackout", "dayroom": "dayroom", "night": "night", "end": "end"}


def _gen_drone(d, seed, lp=420, hunt=.07):
    """The generator, heard through the walls (mono): a four-cylinder diesel on a 1800 rpm set fires 60 times a second, so the room tone is a 60 Hz chug with the alternator's hum (60, 120 and 180 Hz) over it,
    closed off at `lp` Hz, with the slow hunting of the governor (a few percent, twice a second or so)."""
    t = tarr(d)
    f = 60.0 * (1 + .004 * _smooth_rand(d, seed + 1, .6))
    eng = _diesel(d, f, seed, knock=.25, rumble=.6, lp=lp)
    ph = 2 * np.pi * np.cumsum(f) / SR
    hum = np.sin(ph) + .7 * np.sin(2 * ph + 1) + .35 * np.sin(3 * ph + 2)
    x = (_rms(eng) * .8 + _rms(hum) * .5) * (1 + hunt * _smooth_rand(d, seed + 2, .5))
    return _lp4(x, lp + 60, 2)


def _emerg_buzz(d, seed):
    """The emergency lights: the buzz of a small ballast (120 Hz and its harmonics to 600 Hz, a 7 Hz shimmer in its level) and the exit signs' thin 180 Hz hum."""
    t = tarr(d)
    buzz = sum(a * np.sin(2 * np.pi * 120 * h * t + h) for h, a in ((1, 1.0), (2, .5), (3, .35), (4, .2), (5, .12)))
    buzz = buzz * (1 + .12 * np.sin(2 * np.pi * 7.1 * t + 1) + .05 * _smooth_rand(d, seed, 3.0))
    return _rms(buzz) * 1.0 + _rms(np.sin(2 * np.pi * 180 * t)) * .22


def _breaths_bed(d, seed, who=5, every=(2.2, 4.2), level=1.0):
    """Cold breaths of `who` people standing in the snow (stereo): each is a soft exhale (a band of air through one formant at 700 Hz, 0.45 s) every few seconds, each person in their own place."""
    r = rng6(seed)
    out = np.zeros((2, _n(d)))
    pans = np.linspace(-.6, .65, who)
    for p in range(who):
        t = r.uniform(.2, every[1])
        while t < d - .6:
            dd = r.uniform(.35, .55)
            tt = tarr(dd)
            nz = noise6(dd, int(seed + 31 * p + t * 10))
            b = (_res(nz, r.uniform(600, 800), 2.0) * .9 + _lp4(nz, 2500, 2) * .3) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** 1.6
            seg = _ctr(_lp4(b, 2800, 2), pans[p] + r.uniform(-.08, .08)) * r.uniform(.5, 1.0) * level
            i = int(t * SR)
            m = min(seg.shape[1], out.shape[1] - i)
            if m > 0:
                out[:, i:i + m] += seg[:, :m]
            t += dd + r.uniform(*every)
    return out


def room_title(d, seed=2000):
    """A study desk at night (6.8 s): the room's hush, the wind outside the frosted window (heard through the glass, low and soft), a desk lamp's thin buzz and a small clock."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 140.0, 300.0), 1.0), seed)
    return _mix([(air, 1.0), (wind(d, seed + 5, wall=420, howl=.7, base=.45), .75), (_ctr(_rms(_hum(d, 100.0, ((1, 1.0), (2, .4))), .05), .35), 1.0),
                 (_ctr(_rms(_ticks(d, seed + 9, 1.0, .41), .1), .4), 1.0)], d)


def _door_env(d, t_open, rise=.04, fall=.9, rest=.35):
    """0 before the door is flung open at `t_open`, then 1 and settling to `rest` (the doorway stays open onto the white)."""
    t = tarr(d)
    return np.where(t < t_open, 0.0, np.minimum(1.0, (t - t_open) / rise) * (rest + (1 - rest) * np.exp(-(t - t_open) / fall)))


def room_forecast(d, seed=2100):
    """The nurses' station at two in the afternoon: air handling, the murmur of a few staff, a telephone, a keyboard, the call light's chime far away, the wall TV's weather murmur, the hum of the monitors, and the
    wind leaking round the glass doors and the window (low-passed by the wall at 520 Hz, a quiet howl that grows as the storm closes in). THE DOOR (`doorgust`): the wall opens for a moment, as Episode 18's
    muffling did with its doors: the leak is replaced by the open wind (a full-band blizzard, brighter and louder) that settles to a lasting 35 percent of that, because the doorway stays open onto the white."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 150.0, 340.0), 1.0), seed)
    bab = _diffuse(lambda s: _rms(_babble(d, s, 3), 1.0), seed + 11)
    leak = wind(d, seed + 20, wall=520, howl=1.0, base=.45, var=.22)
    leak = leak * np.interp(tarr(d), [0, d], [.6, 1.0])
    tdoor = _cue_local("forecast", "doorgust", 0)
    parts = [(air, .8), (bab, .3), (_ctr(_rms(_phone(d, seed + 21, (9.0, 14.0)), .3), .5), 1.0), (_ctr(_rms(_typing_far(d, seed + 31, (3.0, 7.0)), .22), -.5), 1.0),
             (_ctr(_rms(_chimes_far(d, seed + 41, (9.0, 14.0)), .12), .25), 1.0), (_ctr(_rms(_tv_far(d, seed + 5, 1.0), .16), .6), 1.0), (_ctr(_rms(_hum(d, 120.0, ((1, 1.0), (2, .3))), .05)), 1.0)]
    if tdoor is not None:
        env = uniform_filter1d(_door_env(d, tdoor), 480)
        opened = _lp4(wind(d, seed + 25, howl=1.0, base=.6, var=.2), 4500, 2)
        parts += [(leak * (1 - .7 * env), 1.4), (opened * env, 1.8)]
    else:
        parts += [(leak, 1.4)]
    return _mix(parts, d)


def room_lot(d, seed=2200):
    """The parking lot in the blizzard (28.1 s), wind-led: a low rumble and the roar of the body with a tonal howl that climbs on every gust, the hush of falling snow, and gusts at the plow's cues (the blade
    1.5 s, the berm 2.7 s, the car's snow 14.1 s, the slip 16.7 s) on top of a slow independent swell; the five of them breathing cold puffs, the far hum of a lamp post and the building's rooftop fans."""
    g = []
    for nm, k, dur, amp in (("plowscrape", 0, 2.2, .85), ("plowdump", 0, 1.6, .7), ("snowdump", 1, 1.4, .35), ("slip", 0, 1.6, .5)):
        a = _cue_local("lot", nm, k)
        if a is not None:
            g.append((a - .15, dur, amp))
    w = wind(d, seed, gusts=g, base=.5, var=.26)
    return _mix([(w, 1.0), (_breaths_bed(d, seed + 50), .16), (_ctr(_rms(_hum(d, 60.0, ((1, 1.0), (2, .3))), .04), .6), 1.0), (_ctr(_rms(_lp4(noise6(d, seed + 60), 160, 2), .05), -.5), 1.0)], d)


def room_blackout(d, seed=2300):
    """The station for 36.9 s. 0 to 0.25 s: the lights' own hum (the ballasts, which `powerdown` then kills room by room). 0.3 to 12.9 s: a thick hush: only the wind leaking round the window (low and soft)
    and a sub-bass of still air. From the generator's catch (12.9 s, fully in by 13.9) the new room tone: the generator's drone (60 Hz, through the walls), the emergency lights' buzz and the exit signs'
    hum, with the same wind leak."""
    t = tarr(d)
    hum_on = _rms(sum(a * np.sin(2 * np.pi * 120 * h * t + h) for h, a in ((1, 1.0), (2, .6), (3, .5), (4, .3), (5, .2))), 1.0) * .5 + _rms(_lp4(noise6(d, seed), 300, 2), 1.0) * .3
    hum_on = hum_on * np.interp(t, [0, .19, .225, d], [1, 1, 0, 0])
    leak = wind(d, seed + 5, wall=480, howl=.9, base=.45, var=.22) * np.interp(t, [0, .35, .9, 12.9, 13.9, d], [0, 0, 1.0, 1.0, .75, .75])
    sub = _ctr(_rms(_lp4(noise6(d, seed + 6), 55, 2), 1.0), 0.0) * np.interp(t, [0, .4, 1.2, 12.9, 13.9, d], [0, 0, .12, .12, .05, .05])
    gen = _diffuse(lambda s: _gen_drone(d, s), seed + 10)
    gen = gen * np.interp(t, [0, 12.8, 13.9, d], [0, 0, 1.0, 1.0])
    em = _ctr(_emerg_buzz(d, seed + 20), .15) * np.interp(t, [0, 12.9, 13.9, d], [0, 0, .2, .2])
    return _mix([(_st(hum_on), 1.0), (leak, 1.0), (sub, 1.0), (gen, .5), (em, 1.0)], d)


def room_dayroom(d, seed=2400):
    """The day room at night on the generator (20.9 s): the drone of the set at the other end of the building, the emergency lights' faint buzz, a soft hush of air, the wind at the big window (a quiet howl,
    low-passed by the wall and the frost) and the snow's own silence."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 110.0, 240.0), 1.0), seed)
    gen = _diffuse(lambda s: _gen_drone(d, s, 330), seed + 10)
    leak = wind(d, seed + 20, wall=460, howl=1.0, base=.45, var=.22)
    return _mix([(air, .3), (gen, .35), (_ctr(_emerg_buzz(d, seed + 30), -.3), .08), (leak, 1.6)], d)


def room_night(d, seed=2500):
    """The station at night on the generator (34.4 s), and the time-lapse. The same elements as the day room (the drone, the emergency buzz, the hush of the heating that is not working, the wind leaking
    round the window) are made longer than the scene, then played as a tape that follows the lapse (lapse.json, or the fixed curve): at the picture's top speed the drone is 2.4 times faster and a fifth
    higher, the wind flutters and howls and rises with it (windswell), and the tape slows to 1x exactly where the Moon speaks (18.70 s). After the lapse the wind falls away to a hush in two seconds: the
    snow has stopped."""
    sc = _scene_info("night")
    n = _n(d)
    src_d = d * 2.5 + 2.0
    base = _mix([(_diffuse(lambda s: _rms(_hvac(src_d, s, 120.0, 260.0), 1.0), seed), .3), (_diffuse(lambda s: _gen_drone(src_d, s, 340), seed + 10), .45),
                 (_ctr(_emerg_buzz(src_d, seed + 20), -.2), .1)], src_d)
    r_tone = warp(base, sc["start"], n, 2.4)
    leak = warp(wind(src_d, seed + 30, wall=470, howl=1.0, base=.45, var=.22), sc["start"], n, 2.4)
    t = tarr(d)
    b = (LAPSE.b - sc["start"]) if LAPSE.active else 18.65
    a = (LAPSE.a - sc["start"]) if LAPSE.active else 10.65
    uu = LAPSE.u_at(sc["start"] + t) if LAPSE.active else np.zeros(len(t))
    lvl = np.interp(t, [0, a, b, b + 1.8, d], [1.0, 1.0, 1.0, .1, .1]) * (1 + .9 * uu)
    return _mix([(r_tone, 1.0), (leak * lvl, 1.6)], d)


def room_end(d, seed=2600):
    """The end card: a news room's hush so the held chord has a floor: air, the hum of a studio monitor (a faint 50 Hz and its harmonic) and a television in the next room."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 130.0, 280.0), 1.0), seed)
    return _mix([(air, 1.0), (_ctr(_rms(_hum(d, 50.0), .06)), 1.0), (_ctr(_rms(_tv_far(d, seed + 5, 1.0), .12), .5), 1.0)], d)


ROOM_FN = {"title": room_title, "forecast": room_forecast, "lot": room_lot, "blackout": room_blackout, "dayroom": room_dayroom, "night": room_night, "end": room_end}


def _make_bed(name):
    def run():
        sid = BED_SCENE[name]
        s = _scene_info(sid)
        d = (s["dur"] if s else 10.0) + .3
        x = _rms(ROOM_FN[name](d), 1.0)
        fade = np.minimum(1, np.minimum(np.arange(x.shape[1]) / (.25 * SR), (x.shape[1] - np.arange(x.shape[1])) / (.3 * SR)))
        return x * fade
    run.__doc__ = f"The room tone of the {BED_SCENE[name]} scene (see room_*), at unit RMS."
    return run


for _bn in BED_SCENE:
    globals()["sfx_bed_" + _bn] = _make_bed(_bn)
    BA.SFX["bed_" + _bn] = globals()["sfx_bed_" + _bn]


def amb_wind(d, ramp=None):
    """The script's `wind` ambience (the mixer's own under-layer, very quiet): a soft blizzard at about the level of the old hum."""
    return _rms(wind(d, 2900, base=.5), .04)


A6.AMB["wind"] = amb_wind


# ================================================================ registration (keep this at the end of the sfx section)
BOOST = {   # sustained textures that sat 15 to 20 dB under the voice at the script's gains: lifted so they register (the dialogue dip still takes them down under speech)
    "sniffle": 1.6, "typing": 1.2, "partywhistle": .6, "powerdown": 1.25,
    "cupset": 1.9, "slurp": 1.7, "pentick": 1.8, "candleclick": 1.8, "clickdead": 1.8, "flashlight": 1.5, "clocktick": 1.6, "phoneclick": 1.7, "boardflip": 1.4, "plowdist": 2.2, "shovel": 1.2,
    "badgepeel": 1.2, "windgust": 1.3,
}


def _tagged(name, fn):
    k = BOOST.get(name, 1.0)

    def run():
        return _Tag(fn() * k, name)
    run.__doc__ = fn.__doc__
    return run


BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})
for _nm in list(BA.SFX):
    BA.SFX[_nm] = _tagged(_nm, BA.SFX[_nm])


# ================================================================ the snow material for the physics foley (the lot's slide, if the animation writes one)
def _m_snow(ps, ds, seed):
    """Snow struck or landed on (a collision from phys_events.json): a soft low fump (a 85 Hz thump), a muffled cushion of noise under 600 Hz and a small crunch of grains."""
    d = .24 * ds
    t = tarr(d)
    return np.sin(2 * np.pi * 85 * ps * t) * np.exp(-t / (.04 * ds)) * .8 + _lp4(noise6(d, seed), 600, 2) * np.exp(-t / (.03 * ds)) + _hit_train(seed + 5, d, 8, 700, 3000, .004, .25, .05)[0] * .5


_MV["snow"] = _m_snow
LOUD["snow"] = .5
HARD = tuple(HARD) + ("snow",)


# ================================================================ the animation's footsteps and the simulation's collisions, balanced for this mix
def _scene_table():
    if not os.path.exists(os.path.join(HERE, EPD, "timeline.json")):
        return []
    tl = json.load(open(os.path.join(HERE, EPD, "timeline.json")))
    return [(s["id"], s["start"], s["start"] + s["dur"], s["beats"]) for s in tl["scenes"]]


def _scene_of(t, tab):
    name = None
    for nm, a, b, _ in tab:
        if t >= a:
            name = nm
    return name


def _scripted(tab):
    """[(absolute time, effect name, gain, pan)] of every cue of the script, from the frozen timeline's beat times."""
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    by = {nm: (a, bt) for nm, a, b, bt in tab}
    out = []
    for sc in script["scenes"]:
        a, bt = by[sc["id"]]
        for b in sc["beats"]:
            for c in b.get("sfx", []):
                s = bt[b["id"]]["e"] if c[1] == "end" else bt[b["id"]]["s"] + c[1]
                out.append((round(a + s, 3), c[0], c[2], c[3] if len(c) > 3 else 0))
    return out


BIG_CUES = ("powerdown", "relay", "genstart", "doorgust", "snowdump", "plowdump", "plowscrape", "popper", "boardflip", "stamp", "thud", "slip", "shovel")      # scripted hits that a collision from a simulation must not double
STEP_SCALE = {"title": 1.0, "forecast": .9, "lot": .85, "blackout": .7, "dayroom": .8, "night": .8, "end": 1.0}
RUSH_AT = (0.0, .03, .055, .08)
BED_VOL = {}        # bed name -> the event's gain (filled by _designed_events from BED_DB)
SOURCES = {"steps": "none", "phys": "none", "lapse": "none", "doors": "none", "phone": "none"}


def _tune_steps(events, tab):
    """The animation's footsteps, balanced for this mix: each scene's own scale; every step of the lot becomes a snow crunch (`snowstep`); the footsteps inside the time-lapse are dropped (the picture shows
    the rounds as a ghost trail, the sound as whooshes); steps that land on the same instant are spread by a few milliseconds (a crowd is never one foot)."""
    out = []
    la, lb = (LAPSE.a, LAPSE.b) if LAPSE.active else (None, None)
    for ev in events:
        ev = dict(ev)
        if ev.get("name") == "step":
            sc = _scene_of(ev["t"], tab)
            if sc == "night" and la is not None and la - .05 <= ev["t"] <= lb + .05:
                continue
            ev["vol"] = round(ev.get("vol", .5) * STEP_SCALE.get(sc, 1.0), 4)
            if sc == "lot":
                ev["name"] = "snowstep"
                ev["vol"] = round(ev["vol"] * 1.15, 4)
        out.append(ev)
    steps = sorted((e for e in out if e.get("name") in ("step", "snowstep")), key=lambda e: e["t"])
    for e in steps:
        same = [x for x in steps if abs(x["t"] - e["t"]) < .005 and x is not e]
        if same and all(e["t"] <= x["t"] for x in same):
            group = sorted([e] + same, key=lambda x: str(x.get("key", "")))
            for j, x in enumerate(group):
                x["t"] = round(x["t"] + RUSH_AT[min(j, len(RUSH_AT) - 1)], 3)
                x["vol"] = round(x["vol"] * .8, 4)
    return out


def _lapse_events(tab):
    """The time-lapse's designed sounds: the rounds (a whoosh each time Strawberry's hour comes round: on every full world hour from midnight to 6 AM, from lapse.json's world time; evenly spaced when the file
    has none), four sleepers turning over (rustles) and the sunrise glint at the end of the lapse (7:00)."""
    sc = next((x for x in tab if x[0] == "night"), None)
    if not sc or not LAPSE.active:
        return []
    a, b = LAPSE.a, LAPSE.b
    ev = []
    ts = None
    if not LAPSE.fixed and LAPSE.wm is not None:
        ts = []
        for h in range(1440, 1860, 60):                                              # 24:00 to 6:00 in minutes since midnight of the first day
            i = np.where(LAPSE.wm >= h)[0]
            if len(i):
                ts.append(float(LAPSE.ts[i[0]]))
    if not ts:
        ts = list(np.linspace(a + 1.0, b - 1.2, 7))
    for j, t in enumerate(ts):
        if a + .3 < t < b - .3:
            ev.append({"t": round(t - .12, 3), "name": "whoosh_s", "vol": .5, "pan": 0.0, "room": "hall"})
    r = rng6(2950)
    for j in range(4):
        ev.append({"t": round(a + 1.5 + (b - a - 3.0) * (j + r.uniform(.15, .85)) / 4, 3), "name": "rustle", "vol": .5, "pan": float(r.choice([-.7, -.35, .3, .7])), "room": "hall"})
    ev.append({"t": round(b + .03, 3), "name": "glint", "vol": .5, "pan": .1, "room": "hall"})
    return ev


def _designed_events(tab, steps_in_lot):
    """The events the script does not list: the room-tone beds (one per scene, a level in dB under a spoken line), the stopwatch's quiet ticks before the count, the breaths of the dark, the time-lapse's
    whooshes, rustles and glint, the plow passing the window at dawn, the sleepers stirring at sunrise, Onion's steps to the ice when the animation wrote none."""
    ev = []
    by = {nm: (a, b) for nm, a, b, bt in tab}
    for nm, sid in BED_SCENE.items():
        if sid not in by:
            continue
        BED_VOL[nm] = round(.1 * 10 ** (BED_DB[nm] / 20) / .6, 5)
        ev.append({"t": round(by[sid][0], 3), "name": "bed_" + nm, "vol": BED_VOL[nm], "pan": 0.0, "room": "hall"})
    if "blackout" in by:
        a0 = by["blackout"][0]
        ev.append({"t": round(a0, 3), "name": "hum_on", "vol": .7, "pan": 0.0, "room": "hall"})                # the lights' hum before the failure (crossfades into `powerdown` at 0.2 s)
        for j in range(6):                                                           # the stopwatch shows 1.0 at 3.4 s, 2.0 at 4.4 ... 6.0 at 8.4 s (it started at 2.4 s)
            ev.append({"t": round(a0 + 3.4 + j, 3), "name": "swtick", "vol": .8, "pan": -.2, "room": "hall"})
        for t, p in ((9.55, -.25), (10.2, .3), (10.9, -.1)):
            ev.append({"t": round(a0 + t, 3), "name": "breath", "vol": .3, "pan": p, "room": "hall"})
    ev += _lapse_events(tab)
    if "night" in by:
        a0 = by["night"][0]
        tu3 = _beat_abs("night", "tu3")
        if tu3:
            ev.append({"t": round(tu3[0] + .5, 3), "name": "plowrumble", "vol": .8, "pan": 0.0, "room": "hall"})
        dawn = _beat_abs("night", "dawn")
        if dawn:
            for dt, p in ((.5, -.6), (1.3, .5)):
                ev.append({"t": round(dawn[0] + dt, 3), "name": "rustle", "vol": .45, "pan": p, "room": "hall"})
    if "lot" in by and not steps_in_lot:
        for dt, p in ((16.05, -.35), (16.3, -.3), (16.55, -.32)):                    # Onion walks onto the ice (o1 starts at 15.81 s, the slip is at 16.71 s)
            ev.append({"t": round(by["lot"][0] + dt, 3), "name": "snowstep", "vol": .5, "pan": p, "room": "hall"})
    return ev


def _load_json(path):
    try:
        return json.load(open(path)) if path and os.path.exists(path) else []
    except (OSError, ValueError):
        return []


def _make_events(src, phys_src, doors_src, out_dir):
    """Write <out_dir>/events.tuned.json from the footsteps (src), the collisions (phys_src), the door events and the designed events; returns its path, or '' when there is nothing to place."""
    tab = _scene_table()
    if not tab:
        return ""
    steps = _load_json(src)
    phys = _load_json(phys_src)
    doors = _load_json(doors_src)
    SOURCES["steps"] = f"{os.path.relpath(src, HERE)} ({len([e for e in steps if e.get('name') == 'step'])} steps)" if steps else "none (no events.json yet)"
    SOURCES["phys"] = f"{os.path.relpath(phys_src, HERE)} ({len(phys)} events)" if phys else "none"
    SOURCES["doors"] = f"{os.path.relpath(doors_src, HERE)} ({len(doors)} events)" if doors else "none"
    tuned = _tune_steps(steps, tab)
    lot = next((x for x in tab if x[0] == "lot"), None)
    in_lot = [e for e in tuned if e.get("name") == "snowstep"]
    ev = tuned + _select_phys(phys, _scripted(tab))
    PHYS_EVENTS[:] = [e for e in ev if e.get("name") == "phys"]
    for d_ in doors:                                                                 # door events from the picture (none expected): a gust at each door that is flung open
        if d_.get("name") in ("doorgust", "dooropen"):
            ev.append({"t": round(float(d_["t"]), 3), "name": "doorgust", "vol": float(d_.get("gain", .5)), "pan": float(d_.get("pan", 0)), "room": "hall"})
    ev += _designed_events(tab, in_lot)
    dst = os.path.join(out_dir, "events.tuned.json")
    os.makedirs(out_dir, exist_ok=True)
    json.dump(ev, open(dst, "w"), indent=0)
    return dst


# ================================================================ checks: the timeline, the dialogue margin, the loudness and the silences
def compare_timeline(out_dir):
    """Scene starts, scene lengths and every line's start and end of this build against the frozen build/ep21/timeline.json. Returns the list of differences (empty: identical)."""
    if not os.path.exists(os.path.join(HERE, EPD, "timeline.json")):
        return []
    a = json.load(open(os.path.join(HERE, out_dir, "timeline.json")))
    b = json.load(open(os.path.join(HERE, EPD, "timeline.json")))
    bad = []
    if abs(a["duration"] - b["duration"]) > 1e-6:
        bad.append(f"duration {a['duration']} vs {b['duration']}")
    if len(a["scenes"]) != len(b["scenes"]) or len(a["lines"]) != len(b["lines"]):
        bad.append(f"counts {len(a['scenes'])}/{len(a['lines'])} vs {len(b['scenes'])}/{len(b['lines'])}")
        return bad
    for x, y in zip(a["scenes"], b["scenes"]):
        if (x["id"], x["start"], x["dur"]) != (y["id"], y["start"], y["dur"]):
            bad.append(f"scene {x['id']}: {x['start']},{x['dur']} vs {y['start']},{y['dur']}")
        for k, v in y["beats"].items():
            if x["beats"].get(k) != v:
                bad.append(f"beat {x['id']}.{k}: {x['beats'].get(k)} vs {v}")
    for x, y in zip(a["lines"], b["lines"]):
        if (x["scene"], x["id"], x["s"], x["e"]) != (y["scene"], y["id"], y["s"], y["e"]):
            bad.append(f"line {x['scene']}.{x['id']}: {x['s']},{x['e']} vs {y['s']},{y['e']}")
    return bad


def dialogue_margin(out_dir):
    """For EVERY spoken line: the level of the line's voice (its treated clip as placed, plus the room's reverb of it) against everything else in the mix (the mix minus the voice: music,
    effects, ambience, the other voices and their rooms) over the line's window, 20 ms frames, gated to the frames where the voice is within 20 dB of its own loudest. The mix is the
    mixer's own, before the master chain, returned to the linear domain (the mixer's soft clip is undone), so the numbers are those of the build. Writes dialogue_margin.csv."""
    d = os.path.join(HERE, out_dir)
    tl = json.load(open(os.path.join(d, "timeline.json")))
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    room = {s["id"]: s.get("room", "hall") for s in script["scenes"]}
    voice, _ = sf.read(os.path.join(d, "stem_voice.wav"), dtype="float64")
    audio, _ = sf.read(os.path.join(d, "audio.wav"), dtype="float64")
    n = min(len(audio), len(voice))
    voice, mixk = voice[:n].T, np.arctanh(np.clip(audio[:n].T / .92, -.9995, .9995))
    vw = voice.copy()
    for ln in tl["lines"]:
        if ln["who"] in DRY_WHO or f"{ln['scene']}_{ln['id']}" in DRY_TAGS:                  # a dry voice (Brenda, a head in a drift) skips the room, so its reverb is not part of the line's level
            vw[:, int(ln["s"] * SR):int(ln["e"] * SR) + 1] = 0.0
    vt = voice.copy()
    for sc in tl["scenes"]:
        a, b = int(sc["start"] * SR), min(n, int((sc["start"] + sc["dur"]) * SR))
        w = scene_reverb(sc["id"], vw[:, a:b], a)
        if w is None:
            w = _REVERB6(vw[:, a:b], room[sc["id"]])
        m = min(w.shape[1], n - a)
        vt[:, a:a + m] += w[:, :m]
    rest = mixk - vt
    rows, hop = [], int(.02 * SR)
    for ln in tl["lines"]:
        a, b = int(ln["s"] * SR), min(n, int(ln["e"] * SR))
        v, r = vt[:, a:b], rest[:, a:b]
        nf = (b - a) // hop
        if nf < 2:
            continue
        pv = np.mean(v[:, :nf * hop].reshape(2, nf, hop) ** 2, axis=(0, 2))
        pr = np.mean(r[:, :nf * hop].reshape(2, nf, hop) ** 2, axis=(0, 2))
        act = pv > pv.max() * .01
        mv, mr = pv[act].mean(), pr[act].mean() + 1e-12
        rows.append((ln["scene"], ln["id"], ln["who"], ln["s"], ln["e"], 10 * np.log10(mv / mr), 10 * np.log10(mv + 1e-12), 10 * np.log10(mr)))
    with open(os.path.join(d, "dialogue_margin.csv"), "w") as f:
        f.write("scene,beat,who,start,end,margin_db,voice_db,rest_db\n")
        for r in rows:
            f.write(f"{r[0]},{r[1]},{r[2]},{r[3]:.3f},{r[4]:.3f},{r[5]:.2f},{r[6]:.2f},{r[7]:.2f}\n")
    ms = np.array([r[5] for r in rows])
    worst = sorted(rows, key=lambda r: r[5])[:5]
    print(f"dialogue margin over {len(rows)} lines: median {np.median(ms):.1f} dB, 5th percentile {np.percentile(ms, 5):.1f} dB, min {ms.min():.1f} dB, "
          f"{int((ms < 7).sum())} line(s) under 7 dB")
    print("  worst five: " + "; ".join(f"{r[0]}.{r[1]} ({r[2]}) {r[5]:.1f} dB" for r in worst))
    return rows


def true_peak_db(x):
    """Sample peak and 4x-oversampled true peak (dBFS) of an (n,) or (n, 2) float array."""
    x = np.atleast_2d(x.T if x.ndim == 2 else x)
    pk = 0.0
    for ch in x:
        pk = max(pk, np.max(np.abs(signal.resample_poly(ch, 4, 1))))
    return 20 * np.log10(np.max(np.abs(x)) + 1e-12), 20 * np.log10(pk + 1e-12)


def _lra(path):
    """The EBU R128 loudness range (LU) of a wav, from the same ffmpeg ebur128 summary the integrated loudness is read from."""
    import imageio_ffmpeg
    r = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"LRA:\s+(-?\d+\.?\d*) LU", r.stderr)
    return float(m[-1]) if m else float("nan")


DELIBERATE = (("blackout", 8.9, 12.4), ("night", 3.2, 4.9), ("night", 10.5, 18.8))      # silences that are the joke (the dark count, the wait, the time-lapse's end): nothing is expected to be flagged there


def measure(out_dir):
    wav = os.path.join(HERE, out_dir, "audio.wav")
    x, sr = sf.read(wav, dtype="float64")
    sp, tp = true_peak_db(x)
    tl = json.load(open(os.path.join(HERE, out_dir, "timeline.json")))
    print(f"measure: {A9._lufs(wav):.2f} LUFS integrated, loudness range {_lra(wav):.1f} LU, sample peak {sp:.2f} dBFS, true peak {tp:.2f} dBTP, {len(x) / sr:.2f} s")
    mono = np.mean(x, axis=1) if x.ndim == 2 else x
    hop = int(.05 * sr)
    nf = len(mono) // hop
    lv = 20 * np.log10(np.sqrt(np.mean(mono[:nf * hop].reshape(nf, hop) ** 2, axis=1)) + 1e-9)
    quiet = lv < -58
    runs, i = [], 0
    while i < nf:
        if quiet[i]:
            j = i
            while j < nf and quiet[j]:
                j += 1
            if (j - i) * .05 > 1.0:
                runs.append((i * .05, j * .05))
            i = j
        else:
            i += 1
    for a, b in runs:
        sc = next((s["id"] for s in tl["scenes"] if s["start"] <= a < s["start"] + s["dur"]), "?")
        local = a - next((s["start"] for s in tl["scenes"] if s["id"] == sc), 0)
        print(f"  silence {a:7.2f} to {b:7.2f} s ({b - a:.2f} s) in {sc} at {local:.2f} s")
    if not runs:
        print("  no silence longer than 1.0 s anywhere (the quietest 50 ms block is "
              f"{lv[:nf - 2].min():.1f} dB)")
    win = int(.4 * sr)
    seg = mono[:len(mono) // win * win].reshape(-1, win)
    lm = 10 * np.log10(np.mean(seg ** 2, axis=1) + 1e-12)
    top = np.argsort(lm)[::-1][:3]
    print("  loudest 400 ms blocks: " + ", ".join(f"{(i * win) / sr:.1f}s {lm[i]:.1f} dB" for i in top))
    # the room tone's floor in the deliberate quiet beats (so the silence is tender, not empty)
    for sid, a, b in DELIBERATE:
        s0 = next((s["start"] for s in tl["scenes"] if s["id"] == sid), None)
        if s0 is None:
            continue
        i0, i1 = int((s0 + a) * sr), int((s0 + b) * sr)
        seg_ = mono[i0:i1]
        print(f"  quiet beat {sid} {a:.1f} to {b:.1f} s: RMS {20 * np.log10(np.sqrt(np.mean(seg_ ** 2)) + 1e-9):.1f} dBFS")
    return runs


def write_cue_report(out_dir):
    """The cue list as built (scene-local time, absolute time, name, gain, pan) for the script's cues, then the designed events the script does not list (the room-tone beds with their levels and
    the others), the voice treatments, the lapse's source and the event files read."""
    tab = _scene_table()
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    by = {nm: (a, bt) for nm, a, b, bt in tab}
    lines = ["scene  scene_time  abs_time  name  gain  pan"]
    names = set()
    for sc in script["scenes"]:
        a, bt = by[sc["id"]]
        for b in sc["beats"]:
            for c in b.get("sfx", []):
                s = bt[b["id"]]["e"] if c[1] == "end" else bt[b["id"]]["s"] + c[1]
                names.add(c[0])
                lines.append(f"{sc['id']:<10} {s:8.3f} {a + s:9.3f}  {c[0]:<14} {c[2]:<5} {c[3] if len(c) > 3 else 0}" + ("" if c[0] in BA.SFX else "   (missing sfx)"))
    lines.append("")
    lines.append(f"cue names in the script: {len(names)}; missing from the registry: {sorted(n for n in names if n not in BA.SFX) or 'none'}")
    lines.append("")
    lines.append("designed events (not in the script): the room-tone beds, one per scene, cue gain from BED_DB (dB under a spoken line)")
    for nm, sid in BED_SCENE.items():
        if sid in by:
            a = by[sid][0]
            s = _scene_info(sid)
            lines.append(f"{sid:<10} {0:8.3f} {a:9.3f}  bed_{nm:<10} {BED_VOL.get(nm, 0):<8} 0.0   {BED_DB[nm]} dB, {s['dur'] + .3:.2f} s")
    ev = _load_json(os.path.join(HERE, out_dir, "events.tuned.json"))
    others = [e for e in ev if not str(e.get("name", "")).startswith(("bed_", "step", "snowstep", "phys"))]
    for e in sorted(others, key=lambda e: e["t"]):
        sc = _scene_of(e["t"], tab)
        loc = e["t"] - by[sc][0] if sc in by else e["t"]
        lines.append(f"{sc:<10} {loc:8.3f} {e['t']:9.3f}  {e['name']:<14} {e['vol']:<8} {e.get('pan', 0)}")
    n_steps = {}
    for e in ev:
        if e.get("name") in ("step", "snowstep"):
            n_steps[_scene_of(e["t"], tab)] = n_steps.get(_scene_of(e["t"], tab), 0) + 1
    lines.append(f"footsteps placed per scene: {n_steps or 'none'} ({SOURCES['steps']})")
    lines.append("")
    lines.append("voice treatments (scene_line: treatment):")
    for tag, kind in KINDS.items():
        if kind != "plain":
            lines.append(f"  {tag:<14} {kind}")
    lines.append("")
    lines.append("the time-lapse: " + LAPSE.source)
    lines.append(f"phone pan: {PHONE['source']}; collisions: {SOURCES['phys']}; door events: {SOURCES['doors']}")
    sn = M20.INFO
    if sn:
        lines.append("the score: " + "; ".join(f"{k}: {v}" for k, v in sn.items()))
    open(os.path.join(HERE, out_dir, "cue_report.txt"), "w").write("\n".join(lines) + "\n")


# ================================================================ the AAC guard (fixed in Episode 20)
FF = "/usr/bin/ffmpeg" if os.path.exists("/usr/bin/ffmpeg") else (shutil.which("ffmpeg") or "ffmpeg")       # the encoder the publish step uses; Episode 18's guard encoded with the ffmpeg that imageio ships (7.0.2), whose AAC overshoots differently: -0.8 dBTP came out of a guard that passed
TP_LIMIT = -1.5              # dBTP of the DECODED m4a


def decoded_true_peak(m4a):
    """The true peak (dBTP) of an AAC file, measured the way the brief says: `ffmpeg -i audio.m4a -af ebur128=peak=true -f null -` (the decoder inside ffmpeg, EBU R128's 4x oversampled peak)."""
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", m4a, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"True peak:\s+Peak:\s+(-?\d+\.?\d*) dBFS", r.stderr)
    return float(m[-1]) if m else float("nan")


def aac_guard20(path, limit_db=TP_LIMIT, tries=8):
    """Encode the wav as the release does (/usr/bin/ffmpeg, aac, 192k), measure the decoded m4a's true peak with ebur128=peak=true and, while it is over `limit_db` (with 0.05 dB in hand), dip the
    wav at every spot where the decoded signal's 4x-oversampled peak is over (a smooth 16 ms hann-shaped dip, as deep as the overshoot plus 4 percent) and try again. If `tries` rounds of dips
    have not done it, the whole file is lowered by what is left plus 0.1 dB, again and again, each time re-measured (an AAC encode is not linear: a quieter file can overshoot differently).
    Returns (dips, deepest dip in dB, the decoded true peak of the FINAL wav, measured on a fresh encode of it)."""
    import tempfile
    lim = 10 ** (limit_db / 20)
    x, sr = sf.read(path, dtype="float64")
    n_dips, deepest = 0, 0.0
    tp = float("nan")
    for it in range(tries + 8):
        with tempfile.TemporaryDirectory() as tmp:
            m4a, dec = os.path.join(tmp, "a.m4a"), os.path.join(tmp, "a.wav")
            subprocess.run([FF, "-y", "-loglevel", "error", "-i", path, "-c:a", "aac", "-b:a", "192k", m4a], check=True)
            tp = decoded_true_peak(m4a)
            if tp <= limit_db - .05:
                return n_dips, deepest, tp
            if it >= tries:
                g = 10 ** ((limit_db - .1 - tp) / 20)
                x *= g
                sf.write(path, x, sr, subtype="PCM_16")
                deepest = min(deepest, 20 * np.log10(g))
                print(f"  aac guard: the whole file lowered {20 * np.log10(g):.2f} dB (decoded true peak was {tp:.2f} dBTP)")
                continue
            subprocess.run([FF, "-y", "-loglevel", "error", "-i", m4a, dec], check=True)
            y, _ = sf.read(dec, dtype="float64")
        n = min(len(x), len(y))
        pk = np.abs(signal.resample_poly(y[:n], 4, 1, axis=0)).max(axis=1).reshape(n, 4).max(axis=1)
        over = np.where(pk > lim)[0]
        if len(over) == 0:                                  # the decode shows nothing over (the two measures differ in the last hundredth): lower the whole file a hair and measure again
            x[:n] *= 10 ** (-.1 / 20)
            sf.write(path, x, sr, subtype="PCM_16")
            continue
        gain = np.ones(n)
        h = int(.008 * SR)
        i = 0
        while i < len(over):
            j = i
            while j + 1 < len(over) and over[j + 1] - over[j] < int(.01 * SR):
                j += 1
            grp = over[i:j + 1]
            c = int(grp[np.argmax(pk[grp])])
            g = lim * .96 / pk[c]
            a, b = max(0, c - h), min(n, c + h)
            gain[a:b] = np.minimum(gain[a:b], 1 - (1 - g) * np.hanning(2 * h)[a - (c - h):b - (c - h)])
            n_dips += 1
            deepest = min(deepest, 20 * np.log10(g))
            print(f"  aac guard: dip at {c / sr:.3f} s, {20 * np.log10(g):.2f} dB (decoded true peak was {tp:.2f} dBTP)")
            i = j + 1
        x[:n] *= gain[:, None]
        sf.write(path, x, sr, subtype="PCM_16")
    return n_dips, deepest, tp


def publish(out_dir):
    import shutil
    src = os.path.join(HERE, out_dir, "audio.wav")
    dst = os.path.join(HERE, "build/ep21/audio.wav")
    m4a = os.path.join(HERE, "build/ep21/audio.m4a")
    shutil.copyfile(src, dst)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", dst, "-c:a", "aac", "-b:a", "192k", m4a], check=True)
    tp = decoded_true_peak(m4a)
    print(f"published: build/ep21/audio.wav and build/ep21/audio.m4a; the decoded m4a's true peak is {tp:.2f} dBTP (limit {TP_LIMIT})")
    if not tp <= TP_LIMIT:
        print("TRUE PEAK OVER THE LIMIT: the guard did not pass")
        sys.exit(4)


def end_fade(wav, duration, fade=.18):
    """The renderer muxes with -shortest, so the audio is cut at the timeline's duration. Fade the last `fade` seconds before that instant with a raised cosine that reaches exactly zero at it
    (and zero everything after it), so the cut has no tick. Every sample before the fade is untouched (the wav is 16-bit, so reading and writing it back is bit-exact)."""
    x, sr = sf.read(wav, dtype="float64")
    n_end = int(round(duration * sr))
    n0 = n_end - int(fade * sr)
    if 0 < n0 < n_end <= len(x):
        g = .5 * (1 + np.cos(np.pi * np.arange(n_end - n0) / (n_end - n0)))
        x[n0:n_end] *= g[:, None] if x.ndim == 2 else g
        x[n_end:] = 0.0
    sf.write(wav, x, sr, subtype="PCM_16")
    print(f"end fade: {fade * 1000:.0f} ms raised cosine to zero at {n_end / sr:.3f} s (the timeline's end), silence after")


def master(wav, duration=None):
    """The loudness trim, peak limiter, end fade and AAC guard: the finished file measures -14.8 LUFS and the DECODED AAC stays under -1.5 dBTP (see aac_guard20)."""
    import shutil
    base = wav + ".pre"
    shutil.copyfile(wav, base)
    target = -14.7
    for attempt in range(3):
        shutil.copyfile(base, wav)
        g = A9.trim_loudness(wav, target=target)
        dip = A7.peak_limit(wav)
        if sf.info(wav).subtype != "PCM_16":   # the limiter only rewrites the file when something was over the ceiling
            x, sr = sf.read(wav, dtype="float64")
            sf.write(wav, np.clip(x, -1, 1), sr, subtype="PCM_16")
        final = A9._lufs(wav)
        print(f"loudness trim: {g:+.2f} dB (aimed at {target:.2f} LUFS)")
        print(f"peak limiter: deepest gain dip {dip:.2f} dB, finished file {final:.2f} LUFS")
        if abs(final + 14.8) <= .04:
            break
        target += -14.8 - final
    os.remove(base)
    if duration:
        end_fade(wav, duration)
    dips, deep, tp = aac_guard20(wav)
    print(f"aac guard: {dips} dip(s), deepest {deep:.2f} dB; the decoded m4a's true peak is {tp:.2f} dBTP (limit {TP_LIMIT}, measured with /usr/bin/ffmpeg -af ebur128=peak=true)")




def _load_phone(path):
    """build/ep21/phone_path.json (optional, from the LOT scene): where Strawberry's phone is on screen over time, absolute seconds, {t, pan} (-1..1) or {t, x} (px of the 1080 px frame)."""
    rows = _load_json(path)
    if isinstance(rows, dict):
        rows = rows.get("samples") or rows.get("rows") or []
    if rows and len(rows) > 3:
        rows = sorted(rows, key=lambda r: r["t"])
        PHONE["t"] = np.array([r["t"] for r in rows], dtype=float)
        PHONE["pan"] = np.array([float(r["pan"]) if "pan" in r else (float(r["x"]) - 540.0) / 540.0 for r in rows], dtype=float)
        PHONE["source"] = f"{os.path.relpath(path, HERE)} ({len(rows)} samples)"
    else:
        PHONE["source"] = "Strawberry's side of the frame (-0.14) with a small drift (no phone_path.json)"


def main():
    argv = sys.argv[1:]
    do_publish = "--publish" in argv
    argv = [a for a in argv if a != "--publish"]

    def take(flag, default):
        nonlocal argv
        if flag in argv:
            i = argv.index(flag)
            v = argv[i + 1]
            del argv[i:i + 2]
            return v
        return default
    phys_src = take("--phys", os.path.join(HERE, EPD, "phys_events.json"))
    lapse_src = take("--lapse", os.path.join(HERE, EPD, "lapse.json"))
    doors_src = take("--doors", os.path.join(HERE, EPD, "door_events.json"))
    phone_src = take("--phone", os.path.join(HERE, EPD, "phone_path.json"))
    keep_stems = "--keep-stems" in argv
    argv = [a for a in argv if a != "--keep-stems"]
    for k, v in (("--script", SCRIPT), ("--out", "build/ep21_sound"), ("--var", "TIMELINE_EP21"), ("--music", "build_music21")):
        if k not in argv:
            argv += [k, v]
    out = argv[argv.index("--out") + 1]
    out_dir = os.path.join(A6.HERE, out)
    os.makedirs(out_dir, exist_ok=True)
    src = argv[argv.index("--events") + 1] if "--events" in argv else ""
    if "--events" in argv:
        del argv[argv.index("--events"):argv.index("--events") + 2]
    if not src:                                         # the animation's footsteps, if they are in the output folder or in build/ep21: they are always tuned first
        for p in (os.path.join(out_dir, "events.json"), os.path.join(A6.HERE, EPD, "events.json")):
            if os.path.exists(p):
                src = p
                break
    LAPSE.setup(lapse_src)
    M20.LAPSE = LAPSE                                    # the score's lapse ostinato follows the same curve
    SOURCES["lapse"] = LAPSE.source
    print(f"the time-lapse: {LAPSE.source}")
    _load_phone(phone_src)
    tuned = _make_events(src, phys_src, doors_src, out_dir)
    print(f"events: footsteps {SOURCES['steps']}, collisions {SOURCES['phys']} ({len(PHYS_EVENTS)} placed), doors {SOURCES['doors']}, {len(BED_VOL)} room-tone beds")
    if tuned:
        argv += ["--events", tuned]
    sys.argv = [sys.argv[0]] + argv
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    VOX_DIR[0] = os.path.join(out_dir, "voice")
    os.makedirs(VOX_DIR[0], exist_ok=True)
    _load_speech()
    _TTS_ORIG[0] = A6.tts6
    A6.tts6 = tts20
    A6.place2 = place2_20
    A6.reverb = reverb_20
    A10._CALLS.clear()
    os.environ["STEMS"] = "1"
    A6.main()
    bad = compare_timeline(out)
    if bad:
        print("TIMELINE MISMATCH (not published):")
        for b in bad[:20]:
            print("  ", b)
    else:
        print("timeline: identical to build/ep21/timeline.json (scene starts, lengths, every line's start and end)")
    write_cue_report(out)
    json.dump(M20.INFO, open(os.path.join(out_dir, "score_info.json"), "w"), indent=1)
    dialogue_margin(out)
    for nm in ("stem_voice.wav", "stem_sfx.wav", "stem_music.wav"):
        if keep_stems:
            break
        try:
            os.remove(os.path.join(out_dir, nm))
        except OSError:
            pass
    wav = os.path.join(out_dir, "audio.wav")
    master(wav, json.load(open(os.path.join(out_dir, "timeline.json")))["duration"])
    measure(out)
    if do_publish:
        if bad:
            print("not published: the timeline differs")
            sys.exit(3)
        publish(out)


if __name__ == "__main__":
    main()
