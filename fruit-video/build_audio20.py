"""Episode 19 audio: THE POTLUCK. A fresh copy of the Episode 15 to 18 mixer wrapper (build_audio18.py, the final one) mapped to this episode: its own paths, scene ids, voices, rooms, effects and score.

Everything build_audio15 explains applies unchanged: the per-line voice cache under <out>/voice/, the dip of every cue under dialogue (DUCK_DB), the physics foley family
(build/ep20/phys_events.json: none expected), the footsteps from the animation (build/ep20/events.json), the loudness trim, peak limiter, the timeline comparison against the frozen
build/ep20/timeline.json and the dialogue margin of every line.

WHAT IS NEW IN EPISODE 19 (scene ids: title, signup, kitchen, plate, breakroom, thanks, end)
  THE ROOMS     every scene has its own room (reverb_19): the title a small kitchen, the sign-up a lobby hall, the kitchen stainless steel (short, bright, metallic: Chef Cabbage's voice also gets a
                little steel of its own), the break room tiled and small (Brenda is dry and close: her voice skips the room), the day room warm and carpeted, the end card the lobby.
  THE ONE-TAKE  `plate` is one camera move through five spaces. build/ep20/plate_path.json (10 Hz, absolute seconds: {t, x, room, speakerX}; a fixed schedule when it does not exist, and the build
                says so) drives (1) the room tone (a bed per space, cross-faded with the camera: steel-kitchen exhaust, corridor air, a busy station, a quiet hall, a med room with a wall clock),
                (2) the reverb (the five rooms' impulse responses, cross-faded the same way) and (3) every voice's pan, (speakerX - x) / 540 clipped to +-0.7 with a little distance loss.
  THE BATON     (build_music20) the plate's score is one waltz melody that changes instrument on the words that start each hand-off.
  THE GRID      the microwave's three beeps set the break room's tempo: 8 eighths to a bar from 0.3 s, bent by 1 percent so the timer's ding (14.429 s) is a downbeat; build/ep20_sound/mw_grid.json.
  THE FOLEY     viscosity (pourcoffee then three glops of nectar, honey, pudding), the texture line (carve, chop, blender, moldpress), the lid rattle, baskets, the microwave, the timer, the sweep.
  THE GUARD     the AAC guard encodes with /usr/bin/ffmpeg (the encoder the publish step uses) and measures the DECODED m4a with `-af ebur128=peak=true`; the wav is dipped until it passes -1.5 dBTP.

Usage: python3 build_audio19.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep20_sound] [--events build/ep20/events.json] [--phys build/ep20/phys_events.json]
                                [--path build/ep20/plate_path.json] [--keep-stems] [--publish]
  --publish     after the timeline matches build/ep20/timeline.json: copy audio.wav into build/ep20/ and encode audio.m4a (and check the decoded m4a's true peak)
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
for _n in ('wind',):   # TRIAL: ambience names the sound builder will implement; until then a hum stands in
    A6.AMB.setdefault(_n, A6.AMB['hum'])
import build_audio7 as A7
import build_audio9 as A9
import build_audio10 as A10
import build_audio13 as A13
import build_audio14 as A14   # importing it registers every earlier effect (Episodes 6 to 14) in build_audio.SFX
import build_music20 as M19   # the score (mw_grid, the break room's clock, is shared with the mixer)
from build_audio import SR, tarr, osc, ar, midi, expdecay
from build_audio6 import norm6, rng6, noise6
from build_audio7 import _smooth_rand, _sum
from build_audio10 import _nth, _burst, _thump, _ping
from build_audio13 import _place, _edge, _lp4, _hp4, _bp4, _tv_filter, _glide, _sin_of, _glass, _fade_end, _call_ding
from build_audio14 import _res, _band, _unit, _key

HERE = A6.HERE
SCRIPT = "script_ep20.json"
FXV = "19.3"             # bump to rebuild every treated voice line


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
    """(k, scene id, index within the scene) of this call of the effect `name`; (k, None, k) when the call is not a script cue (a foley event)."""
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
    """A mono voice clip (what the mixer measures: lengths, lip-sync, levelling) that carries `.alt`, the version that is placed in the mix: mono, or stereo for the chorus."""

    def __new__(cls, mono, alt=None, who=None, tag=None):
        o = np.asarray(mono, dtype=float).view(cls)
        o.alt = alt
        o.who = who          # the speaker's id in the script ('chef', 'brenda' ...), so the mixer can place the voice by who it is
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
    """Scale y so that its active-speech RMS equals that of ref (the mixer's own measure: frames above a tenth of the loudest frame). A stereo y is matched on its POWER against the same
    clip panned to the centre by the mixer (each ear gets 0.707 of it), so a chorus spread across the field is exactly as loud as a single voice."""
    def act(x):
        if x.ndim == 2:
            e = np.sqrt((_env10(x[0], 960) ** 2 + _env10(x[1], 960) ** 2) / 2)
        else:
            e = _env10(x, 960)
        return np.sqrt(np.mean(e[e > .1 * e.max()] ** 2))
    a, b = act(y), act(ref) * (0.7071 if y.ndim == 2 else 1.0)
    return y * (b / a) if a > 0 else y


def fx_bind(x, menace=False):
    """Binder: a bright, cheerful assistant, slightly synthetic: a lift at 2.2 to 7.5 kHz, a faint detuned double (a 6 ms delay that flutters at 5.5 Hz: a plastic sheen) and a 10-bit grain.
    On 'Great! I'll help.' the same voice gets a low menace: the highs rounded off, a dark shelf under 300 Hz, a slow wobble and a dark slap-back 70 ms behind it."""
    y = x + .24 * _bp4(x, 2200, 7500, 2)
    y = y + .16 * _wobble(_delay(x, 6, 1.0), .0006, 5.5)
    y = np.round(y * 700) / 700
    if menace:
        y = _lp4(y, 5200, 2) + .55 * _lp4(x, 300, 2) + .2 * _lp4(_delay(x, 70, 1.0), 1400, 2)
        y = _wobble(y, .0004, 3.1)
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


def _steel_ir(seed, rt=.34, pre=.005):
    """A short, bright, metallic impulse response: noise closed to 1.6 to 9.5 kHz that dies in `rt` seconds, a few early reflections off hard walls and the ring of steel panels (decaying
    sines near 1.18, 2.43, 3.87 and 5.2 kHz): the sound of a stainless kitchen."""
    n = int((rt + pre) * SR)
    t = np.arange(n) / SR
    r = rng6(seed)
    ir = _bp4(r.uniform(-1, 1, n), 1600, 9500, 2) * np.exp(-6.9 * t / rt)
    for f, tau, g in ((1180, .13, .5), (2430, .1, .4), (3870, .08, .3), (5210, .06, .25)):
        ir += g * np.sin(2 * np.pi * f * t + r.uniform(0, 6.28)) * np.exp(-t / tau) * .35
    for at, g in ((.0, 1.0), (.0041, .55), (.0087, .45), (.0139, .35), (.0213, .25)):
        ir[int(at * SR)] += g * 1.6
    ir[:int(pre * SR)] *= 0
    return ir / np.sqrt(np.sum(ir ** 2))


def fx_chef(x, seed):
    """Chef Cabbage (bm_fable at 0.92, three semitones down: slow, low, flat) in a steel kitchen. A little chest (+1.5 dB under 220 Hz), the hard room's presence lift (+2 dB near 2.8 kHz) and
    the room's own short, bright, metallic reverb baked into the line at -10 dB (see _steel_ir), so he sounds as if he were standing at the pass; the kitchen's reverb comes on top."""
    n = len(x)
    y = x + .2 * _lp4(x, 220, 2) + .18 * _res(x, 2800, 1.5)
    y = y + .3 * signal.fftconvolve(y, _steel_ir(seed))[:n]
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


def fx_moon(x, seed):
    """The Moon at the window (am_onyx, plus the series' own echoes baked in): warm, slightly distant, a little air. A warm shelf (+2.5 dB under 200 Hz), the top rolled off above 6.5 kHz (-3 dB:
    glass between him and us), a window's reflections (a 0.7 s tail closed to 3 kHz at -15 dB) and air (-33 dB of 4 to 10 kHz riding the voice)."""
    n = len(x)
    y = x + .3 * _lp4(x, 200, 2) - .3 * _hp4(x, 6500)
    r = rng6(seed + 23)
    nir = int(.7 * SR)
    t = np.arange(nir) / SR
    ir = _lp4(r.uniform(-1, 1, nir), 3000, 2) * np.exp(-6.9 * t / .7)
    ir[:int(.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    y = y + .17 * signal.fftconvolve(y, ir)[:n]
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    y = y + _bp4(r.uniform(-1, 1, n), 4000, 10000, 1) * env * .022
    return _match_active_rms(y, x)


def fx_res(x):
    """The residents (Pear, Banana, Cranberry, Goji): the day room's warmth on the voice itself, +2 dB under 260 Hz and the top eased (-2.5 dB above 5 kHz), so four old voices sit in lamp light."""
    y = x + .26 * _lp4(x, 260, 2) - .26 * _hp4(x, 5000)
    return _match_active_rms(y, x)


_PAN6 = (-.8, -.45, -.15, .15, .45, .8)
_DLY6 = (0, 7, 3, 11, 5, 9)


def fx_chor(kokoro, v, say, mono, tag, pans=None, delays=None):
    """Six Strawberries, six real voices (the script's own list), each from the same line, a little detuned in speed (as the plain chorus is), spread from far left to far right, each a few
    milliseconds apart as a crowd is, then trimmed exactly as the plain clip was. Returns a (2, len(mono)) clip. `pans`: the spread (the residents' four voices sit in a narrower arc); `delays`:
    the milliseconds each voice comes in after the first (the residents: slower to start, a group that has to catch up with itself)."""
    pans = pans or _PAN6
    dl = delays or _DLY6
    names = v["chorus"]
    parts = []
    for i, name in enumerate(names):
        detune = 1 + .03 * (i % 3 - 1)
        key = hashlib.sha1(json.dumps([name, v["speed"] * detune, v["lang"], say, "p"]).encode()).hexdigest()[:16]

        def make(name=name, detune=detune):
            samples, sr = kokoro.create(say, voice=name, speed=v["speed"] * detune, lang=v["lang"])
            return signal.resample_poly(np.asarray(samples, dtype=float), SR // 1000, sr // 1000)
        parts.append(_vox_cache(f"{tag}.p{i}", key, make))
    L = max(len(p) for p in parts)
    summ = np.zeros(L)
    st = np.zeros((2, L + 600 + int(max(dl) * SR / 1000)))
    for i, p in enumerate(parts):
        q = p / np.max(np.abs(p))
        summ[:len(q)] += q
        th = (pans[i % len(pans)] + 1) * np.pi / 4
        d = int(dl[i % len(dl)] * SR / 1000)
        st[0, d:d + len(q)] += q * np.cos(th)
        st[1, d:d + len(q)] += q * np.sin(th)
    st = st[:, :L + int(max(dl) * SR / 1000)]
    a = np.abs(BA.semis_resample(summ, v.get("semis", 0)))
    idx = np.where(a > .01 * a.max())[0]
    lo, hi = max(0, idx[0] - 800), idx[-1] + 2400
    out = st[:, lo:hi]
    n = len(mono)
    if out.shape[1] < n:
        out = np.pad(out, ((0, 0), (0, n - out.shape[1])))
    out = out[:, :n]
    return _match_active_rms(out, mono)


# ---------------------------------------------------------------- the per-line cache (build/ep20_sound/voice/)
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


def _load_speech():
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    _SPEECH[:] = [(sc["id"], b) for sc in script["scenes"] for b in sc["beats"] if "pause" not in b]


def tts15(kokoro, v, say):
    """The mixer's tts6, replaced: the plain line (cached per line), plus the treated version that is placed in the mix (same length, always). The _Vox carries who is speaking."""
    k = _TTS_K[0]
    _TTS_K[0] += 1
    sc, b = _SPEECH[k] if k < len(_SPEECH) else (None, None)
    if b is None or b.get("say") != say:
        return _Vox(_TTS_ORIG[0](kokoro, v, say), None)
    tag = f"{sc}_{b['id']}"
    raw_key = hashlib.sha1(json.dumps([v, say, "raw"], sort_keys=True).encode()).hexdigest()[:16]
    mono = _vox_cache(tag + ".raw", raw_key, lambda: _TTS_ORIG[0](kokoro, v, say))
    who = b["who"]
    if who not in TREATED:
        return _Vox(mono, None, who, tag)
    menace = who == "bind" and say.startswith("Great!")
    key = hashlib.sha1(json.dumps([raw_key, who, FXV, menace]).encode()).hexdigest()[:16]
    seed = int(hashlib.sha1(tag.encode()).hexdigest()[:6], 16)

    def make():
        if who == "bind":
            return fx_bind(mono, menace)
        if who == "onion":
            return fx_onion(mono, seed)
        if who == "chef":
            return fx_chef(mono, seed)
        if who == "brenda":
            return fx_brenda(mono, seed)
        if who == "moon":
            return fx_moon(mono, seed)
        if who == "rall":                                           # the residents together: softer (-2 dB) than a single voice, the top eased, and slower to gather (the voices come in 0 to 40 ms apart, not 0 to 11)
            c = fx_chor(kokoro, v, say, mono, tag, pans=(-.55, -.18, .18, .55), delays=(0, 40, 18, 32))
            return (c - .22 * _hp4(c, 4500)) * .8
        return fx_res(mono)                                         # pear, banana, cran, goji
    return _Vox(mono, _vox_cache(tag + ".fx", key, make), who, tag)


TREATED = ("bind", "onion", "chef", "brenda", "moon", "rall", "pear", "banana", "cran", "goji")


# ---------------------------------------------------------------- the camera's path through the building (the plate's one take)
ROOMS5 = ("kitchen", "corridor", "station", "hall", "medroom")
# the fixed schedule used only when build/ep20/plate_path.json does not exist: (end of the room in plate-local seconds, room), the camera's speed in px/s in each, and where each speaker sits
# in the frame (their offset from the camera in px: the camera slows for a speaker, who settles near the middle)
FIXED_ROOMS = ((3.5, "kitchen"), (8.0, "corridor"), (12.0, "station"), (16.0, "hall"), (99.0, "medroom"))
FIXED_SPEED = (95.0, 190.0, 120.0, 150.0, 80.0)
FIXED_SPEAK = (   # (line id, offset at the start of the line, offset at its end), px; the voice is panned by offset / 540
    ("m1", 0, 0), ("l1", 330, 90), ("t1", 150, 30), ("o1", -60, -60), ("pe1", 300, 180), ("m3", -250, -250), ("b1", 20, 20), ("s1", 240, 100), ("m2", -220, -220), ("s2", 60, 60))
PAN_SPAN = 540.0           # px of camera-to-speaker distance that is a full pan (the pan is clipped to PAN_CLIP)
PAN_CLIP = .7


class PlatePath:
    """The camera of the one-take `plate` as the sound needs it: x(t), the room (a weight for each of ROOMS5, 250 ms smoothed) and the speaker's offset (speakerX - x) * zoom / PAN_SPAN.
    Read from build/ep20/plate_path.json (absolute seconds, 10 Hz: {t, x, room, speakerX}) when it exists, else the fixed schedule above (the build says which)."""

    def __init__(self):
        self.source = "none"
        self.t0 = self.t1 = None
        self.ts = self.xs = self.sp = self.rm = self.zm = None

    def setup(self, path=None):
        sc = _scene_info("plate")
        if not sc:
            return
        self.t0, self.t1 = sc["start"], sc["start"] + sc["dur"]
        rows = None
        if path and os.path.exists(path):
            try:
                rows = json.load(open(path))
            except (OSError, ValueError):
                rows = None
        if isinstance(rows, dict):                                       # tolerate {"samples": [...]} or {"path": [...]}
            rows = rows.get("samples") or rows.get("path") or rows.get("rows")
        if rows and len(rows) > 5:
            rows = sorted(rows, key=lambda r: r["t"])
            shift = sc["start"] if rows[0]["t"] < sc["start"] - 1.0 else 0.0   # the brief says absolute seconds; a scene-local file is shifted
            for r in rows:
                r["t"] = r["t"] + shift
            self.ts = np.array([r["t"] for r in rows], dtype=float)
            self.xs = np.array([r.get("x", 0.0) for r in rows], dtype=float)
            self.sp = np.array([np.nan if r.get("speakerX") is None else r["speakerX"] for r in rows], dtype=float)
            self.zm = np.array([float(r.get("zoom", 1.0) or 1.0) for r in rows], dtype=float)         # the camera's zoom: a world offset is zoom times bigger on the screen
            self.rm = np.array([ROOMS5.index(r["room"]) if r.get("room") in ROOMS5 else 0 for r in rows], dtype=int)
            self.source = f"{os.path.relpath(path, HERE)} ({len(rows)} samples, {self.ts[0]:.2f} to {self.ts[-1]:.2f} s)"
            return
        T = np.arange(0.0, sc["dur"] + .05, .1)
        x, xs = 0.0, []
        for lt in T:
            k = next(i for i, (e, _) in enumerate(FIXED_ROOMS) if lt < e)
            x += FIXED_SPEED[k] * .1
            xs.append(x)
        self.ts = self.t0 + T
        self.xs = np.array(xs)
        self.rm = np.array([ROOMS5.index(next(r for e, r in FIXED_ROOMS if lt < e)) for lt in T], dtype=int)
        self.sp = np.full(len(T), np.nan)
        self.zm = np.ones(len(T))
        for lid, o0, o1 in FIXED_SPEAK:
            b = _beat_abs("plate", lid)
            if not b:
                continue
            m = (self.ts >= b[0]) & (self.ts <= b[1] + .05)
            if m.any():
                self.sp[m] = self.xs[m] + np.linspace(o0, o1, int(m.sum()))
        self.source = "the fixed schedule (kitchen 0-3.5 s, corridor to 8, station to 12, hall to 16, med room to the end; plate_path.json not found)"

    @property
    def active(self):
        return self.ts is not None

    def _fine(self, a, b, step=.01):
        return np.arange(a, b, step)

    def weights(self, t):
        """(5, len(t)): how much of each room is heard at the absolute times t. The room of each 10 Hz sample is a one-hot; two box passes of 125 ms make the 250 ms triangle that smooths the hand-over."""
        tf = np.arange(self.ts[0] - .5, self.ts[-1] + .5, .01)
        idx = np.clip(np.searchsorted(self.ts, tf, side="right") - 1, 0, len(self.ts) - 1)
        hot = np.zeros((5, len(tf)))
        hot[self.rm[idx], np.arange(len(tf))] = 1.0
        k = 13
        hot = uniform_filter1d(uniform_filter1d(hot, k, axis=1, mode="nearest"), k, axis=1, mode="nearest")
        return np.stack([np.interp(t, tf, hot[i]) for i in range(5)])

    def cam_x(self, t):
        return np.interp(t, self.ts, self.xs)

    def offset(self, t, a, b, fallback):
        """(speakerX - x) * zoom / PAN_SPAN at the times t of a voice that speaks from a to b (absolute): the speaker's offset from the camera as it is SEEN (the file's `zoom`, 1 when it has none:
        the brief's formula is the zoom-1 case), from the speaker's own samples inside the line (gaps filled from the nearest), smoothed 250 ms; `fallback` (a static pan) when the file has no speaker
        for the line."""
        m = (self.ts >= a - .05) & (self.ts <= b + .05) & ~np.isnan(self.sp)
        if m.sum() < 2:
            return np.full(len(t), fallback)
        tt, off = self.ts[m], (self.sp[m] - self.xs[m]) * self.zm[m] / PAN_SPAN
        off = uniform_filter1d(off, 3, mode="nearest")
        return np.interp(t, tt, off)


PLATE = PlatePath()


# ---------------------------------------------------------------- the rooms (impulse responses) and the reverb
ROOM19 = {   # rt: reverb time (s); wet: level of the tail against the dry sound; damp: where the tail is closed off; pre: pre-delay; taps: early reflections (s, gain); ring: metal's resonances (Hz, tau, gain); hp: low cut
    "title":     dict(rt=.42, wet=.14, damp=6500, pre=.006, taps=((.011, .5), (.019, .4), (.031, .3))),                                   # a small kitchen counter at night
    "signup":    dict(rt=.85, wet=.17, damp=5200, pre=.012),                                                                                 # the lobby hall, the series' own
    "kitchen":   dict(rt=.95, wet=.24, damp=10500, pre=.008, hp=250, taps=((.007, .55), (.013, .5), (.021, .4), (.034, .3)),               # stainless steel: bright, hard, ringing
                      ring=((1180, .14, .5), (2430, .1, .4), (3870, .08, .3), (5210, .06, .25))),
    "breakroom": dict(rt=.48, wet=.13, damp=7500, pre=.006, taps=((.004, .5), (.009, .4), (.017, .3))),                                     # a small tiled room
    "thanks":    dict(rt=.62, wet=.16, damp=3400, pre=.014, taps=((.019, .3), (.033, .22))),                                                 # the day room: carpet, curtains, lamp light
    "end":       dict(rt=.85, wet=.17, damp=5200, pre=.012),
    # the five spaces of the one take
    "kitchen_o":  dict(rt=.95, wet=.24, damp=10500, pre=.008, hp=250, taps=((.007, .55), (.013, .5), (.021, .4), (.034, .3)), ring=((1180, .14, .5), (2430, .1, .4), (3870, .08, .3), (5210, .06, .25))),
    "corridor":   dict(rt=.75, wet=.20, damp=6200, pre=.010, taps=((.045, .65), (.09, .38), (.135, .22))),                                   # a long hard corridor: a slap
    "station":    dict(rt=.33, wet=.10, damp=4200, pre=.006, taps=((.012, .3),)),                                                             # a busy desk: absorbent
    "hall":       dict(rt=1.15, wet=.17, damp=5000, pre=.016),                                                                                # a big quiet hall
    "medroom":    dict(rt=.28, wet=.08, damp=3600, pre=.004),                                                                                 # a small soft room
}
ROOM5_KEY = ("kitchen_o", "corridor", "station", "hall", "medroom")
_IRS = {}


def _room_ir(name):
    """The stereo impulse response of a room in ROOM19 (cached): decaying noise closed off at `damp`, early reflections, metal's rings, normalised to unit energy as the series' rooms are."""
    if name in _IRS:
        return _IRS[name]
    sp = ROOM19[name]
    rt, pre = sp["rt"], sp.get("pre", .01)
    n = int((rt * 1.3 + pre) * SR)
    t = np.arange(n) / SR
    r = rng6(sum(map(ord, name)) + 77)
    ir = r.standard_normal((2, n)) * np.exp(-6.9 * t / rt)
    ir[:, :int(pre * SR)] = 0
    for c in range(2):
        ir[c] = _lp4(ir[c], sp.get("damp", 5200), 1)
        if sp.get("hp"):
            ir[c] = _hp4(ir[c], sp["hp"], 2)
    for tap, gn in sp.get("taps", ((.017, .5), (.029, .4), (.043, .3))):
        ir[0, int(tap * SR)] += gn
        ir[1, int((tap + .004) * SR)] += gn
    for f, tau, g in sp.get("ring", ()):
        for c in range(2):
            ir[c] += g * .35 * np.sin(2 * np.pi * f * t + r.uniform(0, 6.28)) * np.exp(-t / tau)
    ir /= np.sqrt(np.sum(ir ** 2))
    _IRS[name] = ir
    return ir


def _rev(seg, name):
    """The tail of `seg` (2, n) in room `name`: the full convolution, scaled by the room's wet level."""
    ir = _room_ir(name)
    return np.stack([signal.fftconvolve(seg[c], ir[c], mode="full") for c in range(2)]) * ROOM19[name]["wet"]


def scene_reverb(sid, seg, a):
    """The reverb of scene `sid`'s dry signal `seg` (2, n) whose first sample is sample `a` of the film. The one-take is the five rooms cross-faded by the camera's path."""
    if sid == "plate" and PLATE.active:
        n = seg.shape[1]
        revs = [_rev(seg, nm) for nm in ROOM5_KEY]
        L = max(r.shape[1] for r in revs)
        t = a / SR + np.arange(L) / SR
        w = PLATE.weights(t)
        out = np.zeros((2, L))
        for i, r in enumerate(revs):
            out[:, :r.shape[1]] += r * w[i][:r.shape[1]]
        return out
    if sid in ROOM19:
        return _rev(seg, sid)
    return None


# ---------------------------------------------------------------- place2, patched: voices place their treated version; cues dip under speech
DUCK_DB = {   # how far a cue is dipped (dB) while a voice speaks, by effect name; anything missing here is not dipped. The hits the picture lands on are never dipped.
    "peel": 3, "typing": 6, "sniffle": 4, "poof": 6, "phys": 12, "step": 7, "grin": 4, "dialog": 7, "probebeep": 3, "lidrattle": 3, "steam": 4, "clatter": 4, "glop": 3, "callchime": 6,
    "bed_title": 3, "bed_signup": 4, "bed_kitchen": 4, "bed_oner": 4, "bed_break": 4, "bed_day": 4, "bed_end": 2,
}
NOREV = ("bed_title", "bed_signup", "bed_kitchen", "bed_oner", "bed_break", "bed_day", "bed_end", "mwbeep", "probebeep")      # cues that never go through the scene's reverb: a bed has its room baked in; the microwave's and the thermometer's beeps are perfectly dry
DRY_WHO = ("brenda",)                                                                                                         # voices that skip the room: close and dry
_DRY = [None, None]                # [the mixer's dry buffer (the first buffer place2 is given), a buffer of the same size that holds only the NOREV cues]
_WIN = {}
_SM = [None]


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
_STATIC_PAN = {}      # who -> the script's static pan (filled by main), the fallback of a voice in the one take


def _spatial_voice(mono, at, who):
    """A voice of the one take as a (2, n) clip: panned by (speakerX - x) * zoom / 540 (the brief's (speakerX - x) / 540 as the camera shows it; clipped to +-0.7, 250 ms smoothed, so you hear the camera move past the speaker), a little quieter and
    a little duller with distance (up to -4 dB net of 1.5 dB of make-up, and a softened top, when the speaker is a frame away). None outside the plate or when the path is not loaded."""
    if not PLATE.active or not (PLATE.t0 - .02 <= at < PLATE.t1):
        return None
    n = len(mono)
    t = at + np.arange(n) / SR
    off = PLATE.offset(t, at, at + n / SR, _STATIC_PAN.get(who, 0.0))
    off = uniform_filter1d(off, int(.25 * SR) | 1, mode="nearest")
    pan = np.clip(off, -PAN_CLIP, PAN_CLIP)
    dist = np.abs(off)
    g = 10 ** ((1.5 - 4.5 * np.minimum(dist, 1.2)) / 20)             # 1.5 dB of make-up: the one take is as loud as the scenes around it
    lo = _lp4(mono, 3600, 2)
    m = np.clip(dist / 1.2, 0, 1) * .5
    y = (mono * (1 - m) + lo * m) * g
    th = (pan + 1) * np.pi / 4
    return np.stack([y * np.cos(th), y * np.sin(th)])


def reverb_19(seg, room):
    """The mixer's per-scene room (A6.reverb), replaced: each scene has its own room (ROOM19; the one take's five rooms follow the camera), minus the cues and voices that must stay dry. `seg`
    is a view of the mixer's dry buffer, so its offset in that buffer (the scene's first sample) is read from the memory address; the scene is the one that starts there."""
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


def place2_19(buf, clip, at, gain=1.0, pan=0.0):
    if _DRY[0] is None:                                  # the mixer places the voices into `dry` first
        _DRY[0] = buf
        _DRY[1] = np.zeros_like(buf)
    if isinstance(clip, _Vox):
        _WIN[round(float(at), 4)] = (float(at), len(clip) / SR)
        alt = clip.alt
        v = np.asarray(clip) if alt is None else alt
        if v.ndim == 1:
            sv = _spatial_voice(v, at, clip.who)
            if sv is not None:
                v, pan = sv, 0.0
        _PLACE2(buf, v, at, gain, pan)
        if clip.who in DRY_WHO and buf is _DRY[0]:
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


# ================================================================ the sheet: clicks, the merge, dialogs, keys


def sfx_dialog():
    """A warning chime (0.9 s): the faint thud of a modal dialog opening (a 150 Hz thock and a soft tick), then two bell notes falling a major third, E6 and C6 (0.15 s apart), soft
    enough to be plastic-friendly. The warning is polite; it is still a warning."""
    x = np.zeros(_n(1.0))
    _place(x, _sum(_thump(190, 85, .07, .016) * .5, _band(1620, .03, 400, 1800) * expdecay(.03, .006) * .5), 0.0, .7)
    _place(x, _call_ding(1318.5, .2), .02, 1.0)
    _place(x, _call_ding(1046.5, .32), .17, .9)
    return norm6(_edge(_lp4(x, 7000, 2), .0004, .12), .75)


def sfx_key():
    """A single keycap press (0.14 s). The first cue is Ctrl (a heavy modifier: a low thock at 300 Hz and a clear click), the second is Z (a lighter, brighter key: a tick at 2.4 kHz and
    a 600 Hz knock). Ctrl then Z, the way a nurse undoes."""
    k, scene, i = _ctx("key")
    t = tarr(.06)
    if i % 2 == 0:
        x = np.sin(2 * np.pi * 300 * t) * np.exp(-t / .012) * .8 + _band(1670, .06, 500, 2200) * expdecay(.06, .006) * .8 + _band(1671, .06, 2500, 6500) * expdecay(.06, .0014) * .6
        x = _lp4(x, 6000, 2)
    else:
        x = np.sin(2 * np.pi * 600 * t) * np.exp(-t / .007) * .5 + _band(1672, .06, 1000, 3400) * expdecay(.06, .005) * .8 + _band(1673, .06, 3000, 8000) * expdecay(.06, .0012) * .6
    return norm6(_edge(x, .0003, .02), .65)


def sfx_textding():
    """A text ding (1.0 s): a soft two-note bell, the tonic and the fifth of the key of the scene that finishes typing itself: B-flat6 then F7 in the title (B-flat major), E-flat6 then B-flat6 on
    the end card (E-flat major), the second 90 ms after the first."""
    k, scene, i = _ctx("textding")
    f1, f2 = (1244.5, 1864.7) if scene == "end" else (1864.7, 2793.0)
    x = np.zeros(_n(1.0))
    _place(x, _call_ding(f1, .22), 0.0, .9)
    _place(x, _call_ding(f2, .3), .09, .8)
    return norm6(_edge(x, .0004, .2), .7)


# ================================================================ the characters
def _vowel(f, d, f1=500.0, f2=1300.0, q=3.0):
    """A voiced sound: a saw at the pitch path f (Hz per sample) through two formants."""
    x = osc("saw", f, d)
    return _res(x, f1, q) * .8 + _res(x, f2, q) * .5 + _lp4(x, 400, 1) * .15


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


def sfx_poof():
    """A cartoon smoke puff (0.45 s). Five calls in a row are five different puffs: the n-th has its own pitch for the 'foomp' (230, 170, 300, 140, 200 Hz), its own length and its own
    ending (a tiny sparkle on the first and fourth, a pop on the third, a fading hiss on the second and fifth): smoke, not a balloon."""
    k = _nth("poof")
    v = k % 5
    f0 = (230, 170, 300, 140, 200)[v]
    d = (.42, .5, .34, .55, .45)[v]
    x = np.zeros(_n(d + .15))
    t = tarr(d)
    cut = 300 + 4200 * np.exp(-t / .07)
    puff = _tv_filter(noise6(d, 1930 + k), cut, .9, "lp") * np.minimum(1, t / .006) * np.exp(-t / (d * .3))
    x[:len(t)] += puff * 1.1
    tt = tarr(.25)
    x[:len(tt)] += _sin_of(f0 * (1 - .6 * (1 - np.exp(-tt / .06)))) * np.exp(-tt / .06) * .9
    if v in (0, 3):
        for j, fq in enumerate((3136.0, 4186.0, 3520.0)):
            _place(x, _glass(fq, .25, .07, .001), .12 + .05 * j, .12)
    elif v == 2:
        _place(x, _band(1940, .02, 1500, 6000) * expdecay(.02, .003) * 1.1, .26, 1.0)
    else:
        _place(x, _band(1941 + k, .3, 3000, 8000) * np.exp(-tarr(.3) / .1) * .15, .1, 1.0)
    return norm6(_edge(x, .001, .15), .65)


# ================================================================ the crane and the tower
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


# ================================================================ the Merge theme, the stinger, the stings


# ================================================================ physics foley: one short impact per collision, by the pair of materials
PHYS_EVENTS = []      # the tuned events of name 'phys', in the order the mixer asks for them (filled by main)
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
    """One collision from the simulation (build/ep20/phys_events.json), 0.1 to 0.5 s, by the pair of materials 'a+b': each material has its own short voice (wood a knock at 360 Hz, metal a
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


# ================================================================ the frozen timeline and the script's cue times
_TL = {}
_ABS = {}


def _timeline():
    """The frozen build/ep20/timeline.json (scene starts, beats and lines), read once."""
    if not _TL:
        p = os.path.join(HERE, "build/ep20/timeline.json")
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


# ================================================================ Episode 19: the sign-up, the slow cooker and the kitchen
def sfx_click():
    """A crisp mouse click, two tones (0.14 s): the button going down (a bright tick at 2.1 kHz with a burst of 1.8 to 7 kHz) and, 68 ms later, coming back up (softer, 1.35 kHz)."""
    k = _nth("click")
    r = rng6(1500 + k)
    s = 1 + .04 * r.uniform(-1, 1)
    x = np.zeros(_n(.14))
    for j, (at, f, g, lo, hi) in enumerate(((0.0, 2100 * s, 1.0, 1800, 7000), (.068, 1350 * s, .5, 1000, 4500))):
        t = tarr(.03)
        c = _band(1510 + 3 * k + j, .03, lo, hi) * expdecay(.03, .0016) * .8 + np.sin(2 * np.pi * f * t) * np.exp(-t / .0045) * .6
        _place(x, c, at, g)
    return norm6(_edge(x, .0003, .02), .7)


def sfx_basket():
    """A wicker basket of rolls set down on a wooden table (0.4 s): a soft wooden 'tock' (a 190 Hz body that sags and a 330 Hz mode), the wicker settling (six tiny dry creaks between 0.9 and
    3.4 kHz, quieter and quieter) and the cloth lining sighing down (a soft swish of noise, 1.2 to 4.5 kHz). Every cue has its own pitch: eleven baskets are eleven sizes of the same basket."""
    k = _nth("basket")
    r = rng6(2400 + k)
    ps = (1.0, .93, 1.08, .97, 1.05, 1.13, .9, 1.02, .95, 1.09, 1.0)[k % 11]
    x = np.zeros(_n(.4))
    t = tarr(.22)
    body = _sin_of(190 * ps * (1 - .22 * (1 - np.exp(-t / .02)))) * np.exp(-t / .034) + .4 * np.sin(2 * np.pi * 330 * ps * t) * np.exp(-t / .02)
    _place(x, body + _band(2410 + k, .22, 500, 2600) * expdecay(.22, .004) * .7, 0.0, 1.0)
    for j in range(6):
        d = .03
        _place(x, _band(2420 + 7 * k + j, d, r.uniform(900, 1500), r.uniform(2200, 3400)) * expdecay(d, .006), r.uniform(.012, .15), .42 - .05 * j)
    tt = tarr(.2)
    _place(x, _band(2415 + k, .2, 1200, 4500) * np.minimum(1, tt / .03) * np.exp(-tt / .07) * .34, .02, 1.0)
    return norm6(_edge(x, .0005, .08), .55)


def sfx_dedupe():
    """Remove Duplicates (1.0 s): the dialog opening (a soft 150 Hz 'thock' and two plastic-friendly chime notes, E6 then C6), eleven row-ticks scanning down the sheet (30 ms apart, climbing from
    1.1 to 2.6 kHz) and a rewind swoosh: a band of air that sweeps up from 400 Hz to 3.8 kHz in 0.4 s with a flutter, swells and is cut with a small zip, as eleven baskets are pulled back into one."""
    x = np.zeros(_n(1.05))
    _place(x, _sum(_thump(190, 85, .07, .016) * .6, _band(2430, .03, 400, 1800) * expdecay(.03, .006) * .5), 0.0, .7)
    _place(x, _call_ding(1318.5, .2), .02, .8)
    _place(x, _call_ding(1046.5, .32), .17, .7)
    for i in range(11):
        f = 1100 + 150 * i
        tt = tarr(.02)
        _place(x, np.sin(2 * np.pi * f * tt) * np.exp(-tt / .004) + _band(2431 + i, .02, 2500, 7000) * expdecay(.02, .0015) * .3, .12 + .03 * i, .32)
    d = .42
    t = tarr(d)
    f = _glide(400, 3800, d)
    sw = _tv_filter(noise6(d, 2445), f, 2.2, "bp") * (1 + .35 * np.sin(2 * np.pi * 38 * t)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2
    _place(x, sw * 1.6 + _sin_of(f * .5) * .05 * np.sin(np.pi * np.clip(t / d, 0, 1)), .28, .8)
    _place(x, _band(2446, .03, 3000, 9000) * expdecay(.03, .006) * .5, .7, .6)
    return norm6(_edge(x, .0004, .15), .7)


LID_HITS = {0: ((0.0, 1.0), (.085, .72), (.16, .85), (.215, .5), (.31, .7), (.365, .42), (.47, .6), (.525, .33), (.65, .42), (.82, .25)),            # the slow cooker's lid, hit by hit: time, strength
            1: ((0.0, 1.0), (.06, .8), (.125, .9), (.19, .6), (.25, .75), (.335, .55), (.41, .62), (.5, .45), (.62, .5), (.75, .38), (.9, .3), (1.05, .2))}


def sfx_lidrattle():
    """A slow cooker's glass lid rattling on its steam (the first 1.3 s, the second 1.55 s): a quick, irregular clatter, ten and then twelve hits that start hard and die away as the pressure goes,
    each a glass lid on a stoneware rim (a bright ping near 2.85 kHz with inharmonic partials, a hollow body tone near 820 Hz and a dull tick), over a little hiss of steam. The hit times are
    LID_HITS, the same table the score reads: the lid is the percussion of the title."""
    k = _nth("lidrattle") % 2
    hits = LID_HITS[k]
    d = hits[-1][0] + .55
    x = np.zeros(_n(d))
    r = rng6(2500 + k)
    for j, (at, g) in enumerate(hits):
        ps = r.uniform(.92, 1.1)
        c = _ping(2850 * ps, .28, .028, (1.0, 2.31, 3.9, 6.1), (1.0, .5, .3, .15), (1.0, .6, .4, .3))
        c = _sum(c, _ping(820 * ps, .2, .03, (1.0, 2.1), (.6, .25), (1.0, .6)), _band(2510 + j, .02, 1800, 6500) * expdecay(.02, .002) * .8)
        _place(x, c, at, g * (1.15 if k == 1 else 1.0))
    t = tarr(d)
    hiss = _band(2520 + k, d, 3200, 9500) * np.interp(t, [0, .05, d * .5, d], [0, 1, .55, 0]) * (1 + .15 * np.sin(2 * np.pi * 6.5 * t))
    x += hiss * (.2 if k == 0 else .26)
    return norm6(_edge(x, .0004, .12), .6)


def sfx_steam():
    """A soft hiss that fades (1.9 s): steam let out of a slow cooker. A band of noise from 2.4 to 10 kHz that swells in 0.25 s, holds and thins away over 1.4 s, a breath of lower air under
    it (500 to 1500 Hz), a slow flutter of turbulence."""
    d = 1.9
    t = tarr(d)
    env = np.interp(t, [0, .25, .65, d], [0, 1, .75, 0]) ** 1.2
    hiss = _band(2530, d, 2400, 10000) * env * (1 + .12 * np.sin(2 * np.pi * 5.2 * t) + .08 * np.sin(2 * np.pi * 8.3 * t + 1))
    air = _band(2531, d, 500, 1500) * np.interp(t, [0, .3, 1.0, d], [0, 1, .5, 0]) * .35
    return norm6(_edge(hiss + air, .02, .3), .5)


def sfx_clatter():
    """Pans and a ladle in a steel kitchen. The first cue (0.55 s): a lid set down on a pan (a ringing steel plate near 640 Hz with the plate modes at 1.59, 2.14 and 2.65 times) and the nest
    of pans shifting (five bright pings, 1.2 to 2.8 kHz, 70 ms apart). The second (0.9 s): a ladle tapped on a pot rim, three times, and dragged across it with a thin scrape."""
    k = _nth("clatter")
    x = np.zeros(_n(1.0))
    if k % 2 == 0:
        _place(x, _ping(640, .5, .13, (1.0, 1.59, 2.14, 2.65, 3.8), (1.0, .6, .45, .3, .2), (1.0, .7, .55, .4, .3)) + _band(2540, .5, 600, 5000) * expdecay(.5, .004) * .6, 0.0, 1.0)
        r = rng6(2541)
        for j in range(5):
            f = r.uniform(1200, 2800)
            _place(x, _sum(_ping(f, .2, .045, (1.0, 2.4, 4.1), (1.0, .4, .2), (1.0, .6, .4)), _band(2542 + j, .02, 2000, 7000) * expdecay(.02, .002) * .5), .07 * (j + 1) + r.uniform(0, .02), .6 - .08 * j)
    else:
        for j, (at, f) in enumerate(((0.0, 1450), (.19, 1380), (.36, 1130))):
            _place(x, _sum(_ping(f, .3, .06, (1.0, 2.7, 4.8), (1.0, .45, .25), (1.0, .55, .35)), _band(2550 + j, .03, 2000, 6500) * expdecay(.03, .003) * .7), at, 1.0 - .1 * j)
        d = .36
        t = tarr(d)
        sc = _tv_filter(noise6(d, 2555), _glide(1800, 3200, d), 3.0, "bp") * (.6 + .4 * np.sign(np.sin(2 * np.pi * 55 * t))) * np.sin(np.pi * np.clip(t / d, 0, 1))
        _place(x, sc, .5, .45)
        _place(x, _ping(980, .3, .08, (1.0, 2.5, 4.4), (.8, .4, .2), (1.0, .6, .4)), .84, .35)
    return norm6(_edge(x, .0004, .1), .65)


def sfx_carve():
    """A carving knife through a roast turkey (0.8 s): three long strokes (a friction band of 1.2 to 5 kHz that swells and fades over 0.19 s, roughened at 38 Hz like a saw's teeth, a little
    higher each stroke), the soft moist 'thup' of each slice falling on the tray (a 140 Hz body and a muffled slap) and, at the end, the blade meeting the board (a 400 Hz knock)."""
    x = np.zeros(_n(.85))
    for j in range(3):
        at = .22 * j
        d = .19
        t = tarr(d)
        fr = _tv_filter(noise6(d, 2560 + j), _glide(1500 + 250 * j, 3200 + 300 * j, d), 1.6, "bp") * (.65 + .35 * np.sign(np.sin(2 * np.pi * 38 * t + j))) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .8
        _place(x, fr, at, 1.0)
        tt = tarr(.12)
        _place(x, _sin_of(150 * (1 - .3 * (1 - np.exp(-tt / .03)))) * np.exp(-tt / .035) * .7 + _lp4(noise6(.12, 2570 + j), 900, 2) * np.exp(-tt / .02) * .5, at + d - .02, .75)
    tt = tarr(.08)
    _place(x, np.sin(2 * np.pi * 400 * tt) * np.exp(-tt / .018) * .6 + _band(2575, .08, 500, 2500) * expdecay(.08, .006) * .8, .68, .8)
    return norm6(_edge(x, .004, .1), .6)


def sfx_chop():
    """A cleaver on a board (0.6 s): three quick chops (0, 0.15 and 0.29 s), each a wooden thock (a 260 Hz body that sags to 190 and a 540 Hz mode), the bright 'tsk' of the blade (1.5 to 5.5 kHz,
    6 ms) and the dull thud of meat (a low-passed noise); after them the chopped pieces settling (six tiny dry ticks)."""
    x = np.zeros(_n(.62))
    for j, (at, g) in enumerate(((0.0, 1.0), (.15, .85), (.29, .95))):
        t = tarr(.16)
        ps = (1.0, 1.05, .96)[j]
        _place(x, _sin_of(260 * ps * (1 - .27 * (1 - np.exp(-t / .02)))) * np.exp(-t / .024) + .5 * np.sin(2 * np.pi * 540 * ps * t) * np.exp(-t / .012)
               + _band(2580 + j, .16, 1500, 5500) * expdecay(.16, .004) * .9 + _lp4(noise6(.16, 2585 + j), 700, 2) * np.exp(-t / .025) * .8, at, g)
    r = rng6(2590)
    for j in range(6):
        _place(x, _band(2591 + j, .015, 1200, 4500) * expdecay(.015, .003), .38 + r.uniform(0, .17), r.uniform(.12, .3))
    return norm6(_edge(x, .001, .1), .7)


def _blend(d, k):
    """The blender's motor and contents for a run of `d` seconds. k = 0: the turkey (a motor that winds up from 190 to 540 Hz in 0.45 s, a rattle of lumps that thins out as it purees and
    settles into a smooth whir); k = 1: the whole pie (lower, 140 to 400 Hz, labouring: the pitch sags when the crust hits, with crunches of crust and pecans and heavier lumps, then a smooth whir).
    Both are spun down in the last 0.15 s."""
    t = tarr(d)
    hev = 1 if k else 0
    f_top = 400.0 if hev else 540.0
    f_low = 140.0 if hev else 190.0
    f = np.interp(t, [0, .45 + .15 * hev, d], [f_low, f_top, f_top * 1.02])
    if hev:
        for at in (.14, .32, .55, .78):                                                    # the crust catches the blades
            f = f * (1 - .16 * np.exp(-((t - at) / .05) ** 2))
    f = f * np.interp(t, [d - .22, d], [1.0, .55])                                         # the spin-down
    ph = np.cumsum(f) / SR
    mot = sum(a * np.sin(2 * np.pi * h * ph) for h, a in ((1, 1.0), (2, .55), (3, .4), (4, .22), (6, .12)))
    mot = _lp4(mot, 2600, 2) * .8 + _lp4(2 * (ph % 1) - 1, 900, 2) * .25
    air = _tv_filter(noise6(d, 2600 + k), 1500 + 1500 * np.interp(t, [0, .5, d], [.3, 1, 1]), 1.0, "bp") * .25
    lumps = np.zeros(len(t))
    r = rng6(2610 + k)
    nl = 34 if hev else 22
    span = (1.15 if hev else .8)
    for i in range(nl):
        at = span * r.uniform() ** 1.3
        dd = .03
        c = (_band(2620 + 7 * k + i, dd, 300, 1800 if hev else 2200) * expdecay(dd, .008) * 1.0 + np.sin(2 * np.pi * r.uniform(180, 420) * tarr(dd)) * np.exp(-tarr(dd) / .01) * .5)
        j = int(at * SR)
        m = min(len(c), len(lumps) - j)
        if m > 0:
            lumps[j:j + m] += c[:m] * (1.0 - .8 * at / span) * r.uniform(.5, 1)
    if hev:
        for i in range(30):                                                                 # crust and pecans
            at = 1.05 * r.uniform() ** 1.2
            dd = .012
            j = int(at * SR)
            c = _band(2700 + i, dd, 1800, 6500) * expdecay(dd, .003) * r.uniform(.4, 1.0)
            m = min(len(c), len(lumps) - j)
            if m > 0:
                lumps[j:j + m] += c[:m] * (1.0 - .6 * at / 1.05) * .9
    env = np.interp(t, [0, .05, d - .22, d], [0, 1, 1, 0])
    return (mot * np.interp(t, [0, .4, d], [.7, 1.0, 1.0]) + air + lumps * .8) * env


def sfx_blender():
    """A blender, twice. The texture line's (1.4 s, to the mold's thump): a motor that whines up under chunky contents and settles to a smooth whir. The pie going in whole (1.9 s): heavier,
    labouring, with the crunch of crust and pecans, then smooth. See _blend."""
    k = _nth("blender") % 2
    d = 1.9 if k else 1.4
    return norm6(_edge(_blend(d, k), .006, .05), .62)


def sfx_moldpress():
    """A silicone mold pressed down and released (0.8 s): the thump of the press on the tray (a 110 Hz body that sags to 60 Hz, the squish of silicone, the steel counter answering at 180 Hz), a creak of
    the silicone holding (a short squeak), and 0.4 s in the wet suction as it lifts (a band that climbs from 600 to 2.2 kHz in 90 ms through a resonance, a small pop, two wet clicks)."""
    x = np.zeros(_n(.85))
    t = tarr(.3)
    _place(x, _sin_of(110 * (1 - .45 * (1 - np.exp(-t / .03)))) * np.exp(-t / .055) * 1.0 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / .09) * .35 + _lp4(noise6(.3, 2630), 1200, 2) * np.exp(-t / .03) * .7, 0.0, 1.0)
    tt = tarr(.14)
    _place(x, _tv_filter(noise6(.14, 2631), _glide(500, 1000, .14), 2.5, "bp") * np.sin(np.pi * np.clip(tt / .14, 0, 1)) * .25, .06, 1.0)
    tt = tarr(.12)
    _place(x, np.sin(2 * np.pi * np.cumsum(_glide(1100, 1450, .12)) / SR) * np.sin(np.pi * np.clip(tt / .12, 0, 1)) * .06, .24, 1.0)
    d = .1
    tt = tarr(d)
    suck = _tv_filter(noise6(d, 2632), _glide(600, 2200, d), 4.0, "bp") * np.minimum(1, tt / .01) * np.exp(-tt / .06)
    _place(x, suck * 1.4, .42, 1.0)
    tt = tarr(.04)
    _place(x, np.sin(2 * np.pi * 380 * tt) * np.exp(-tt / .008) * .5 + _band(2633, .04, 700, 2500) * expdecay(.04, .004) * .6, .52, 1.0)
    for j, at in enumerate((.58, .66)):
        _place(x, _band(2634 + j, .02, 900, 3200) * expdecay(.02, .004) * .5, at, 1.0)
    return norm6(_edge(x, .003, .1), .7)


def sfx_pourcoffee():
    """Coffee poured into a cup, bright and thin (0.9 s): the stream (a band of 1.8 to 7.5 kHz, flickering at 40 to 120 Hz like a thin ribbon of water), the cup's air column filling (a resonance that
    climbs from 380 to 950 Hz as the level rises, fed by the same stream), tiny bubbles (sixteen 10 to 25 ms blips between 0.9 and 2.2 kHz), a splash tick at the start and three drips at the end."""
    d = .9
    t = tarr(d)
    flick = 1 + .5 * _smooth_rand(d, 2640, 110) * 1.0
    stream = _band(2641, d, 1800, 7500) * np.clip(flick, .3, 1.6)
    stream = stream * np.interp(t, [0, .03, .72, .85, d], [0, 1, 1, .35, 0])
    cav = _tv_filter(noise6(d, 2642), _glide(380, 950, d), 6.0, "bp") * np.interp(t, [0, .06, .8, d], [0, 1, .9, 0]) * 1.2
    x = stream * .55 + cav
    r = rng6(2643)
    for i in range(16):
        dd = r.uniform(.01, .025)
        tt = tarr(dd)
        _place(x, np.sin(2 * np.pi * r.uniform(900, 2200) * tt * (1 + 2.5 * tt / dd)) * np.exp(-tt / (dd * .4)) * .5, r.uniform(.03, .78), r.uniform(.3, .8))
    _place(x, _band(2644, .02, 2000, 8000) * expdecay(.02, .003) * .8, 0.0, 1.0)
    for j, at in enumerate((.78, .84, .9 - .03)):
        tt = tarr(.06)
        _place(x, np.sin(2 * np.pi * (1500 + 250 * j) * tt) * np.exp(-tt / .012) * .35, at, 1.0)
    return norm6(_edge(x, .003, .08), .55)


def sfx_glop():
    """Coffee thickened, three times, thicker each time (the viscosity gag). Nectar (0.45 s): a slow gloopy squelch (a 14 Hz glug in a band of soft noise, two bubbles that sag 520 to 330 Hz) with a
    tiny suction as it lets go. Honey (0.6 s): slower and heavier (a 9 Hz glug, bubbles 360 to 220 Hz, a long viscous stretch and a sticky tick, a longer suction). Pudding (0.75 s): a deep, heavy
    PLOP (a body that falls 190 to 62 Hz in 80 ms, the slap of its surface), the whole mass wobbling at 7 Hz and one last bubble."""
    k = _nth("glop") % 3
    x = np.zeros(_n(.8))
    if k == 0:
        d = .4
        t = tarr(d)
        _place(x, _lp4(noise6(d, 2650), 1100, 2) * (.55 + .45 * np.sin(2 * np.pi * 14 * t)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .8 * .8, 0.0, 1.0)
        for at, f0 in ((.0, 520), (.15, 470)):
            tt = tarr(.14)
            _place(x, _sin_of(_glide(f0, f0 * .63, .14)) * np.exp(-tt / .05) * np.minimum(1, tt / .004), at, .9)
        tt = tarr(.07)
        _place(x, _sin_of(_glide(600, 1300, .07)) * np.sin(np.pi * np.clip(tt / .07, 0, 1)) * .4, .36, .7)
    elif k == 1:
        d = .55
        t = tarr(d)
        _place(x, _lp4(noise6(d, 2651), 700, 2) * (.5 + .5 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .7 * 1.0, 0.0, 1.0)
        for at, f0 in ((.0, 360), (.2, 320)):
            tt = tarr(.2)
            _place(x, _sin_of(_glide(f0, f0 * .61, .2)) * np.exp(-tt / .08) * np.minimum(1, tt / .005), at, 1.0)
        _place(x, _band(2652, .012, 1500, 4000) * expdecay(.012, .003) * .6, .44, 1.0)
        tt = tarr(.1)
        _place(x, _sin_of(_glide(400, 900, .1)) * np.sin(np.pi * np.clip(tt / .1, 0, 1)) * .45, .46, 1.0)
    else:
        t = tarr(.35)
        _place(x, _sin_of(_glide(190, 62, .35)) * np.exp(-t / .09) * 1.3 + _lp4(noise6(.35, 2653), 1000, 2) * np.exp(-t / .025) * 1.0 + np.sin(2 * np.pi * 120 * t) * np.exp(-t / .12) * .4, 0.0, 1.0)
        tt = tarr(.5)
        _place(x, np.sin(2 * np.pi * 70 * tt) * (.5 + .5 * np.sin(2 * np.pi * 7 * tt)) * np.exp(-tt / .18) * .35, .06, 1.0)
        tt = tarr(.14)
        _place(x, _sin_of(_glide(150, 100, .14)) * np.exp(-tt / .06) * .5, .24, 1.0)
    return norm6(_edge(x, .002, .1), .75)


def sfx_doorbell():
    """A service-window bell (1.4 s): a small brass call bell struck once. A bright strike tone near 2.35 kHz with the inharmonic partials of a dome bell (2.32, 3.93 and 6.2 times), the
    fundamental ringing 1.1 s, a slow beat of 3 Hz between two twin partials and the dry click of the plunger on the front."""
    d = 1.4
    t = tarr(d)
    f = 2350.0
    x = sum(a * np.sin(2 * np.pi * f * r_ * t) * np.exp(-t / tau) for r_, a, tau in ((1.0, 1.0, .5), (1.003, .6, .45), (2.32, .45, .22), (3.93, .3, .12), (6.2, .14, .06)))
    x = x * (1 + .08 * np.sin(2 * np.pi * 3 * t))
    x[:int(.006 * SR)] *= np.linspace(0, 1, int(.006 * SR))
    tt = tarr(.03)
    _place(x, _band(2660, .03, 1500, 6000) * expdecay(.03, .004) * .9 + np.sin(2 * np.pi * 600 * tt) * np.exp(-tt / .006) * .5, 0.0, 1.0)
    return norm6(_edge(x, .0004, .3), .65)


def sfx_plateclink():
    """A plate set down on the pass-through rail (0.55 s): a ceramic 'tink' (a ring near 2.6 kHz with partials at 2.3 and 3.7 times, 45 ms), the steel rail's low 'tonk' (680 Hz, 40 ms) with
    its own bright ring above (1.9 kHz, 0.12 s, quiet), and the short scrape of stoneware settling on steel."""
    x = np.zeros(_n(.6))
    _place(x, _sum(_ping(2600, .3, .045, (1.0, 2.3, 3.7), (1.0, .45, .25), (1.0, .5, .3)), _band(2670, .02, 2500, 8000) * expdecay(.02, .002) * .5), 0.0, 1.0)
    t = tarr(.2)
    _place(x, np.sin(2 * np.pi * 680 * t) * np.exp(-t / .04) * .7 + np.sin(2 * np.pi * 1900 * t) * np.exp(-t / .12) * .12, 0.0, 1.0)
    d = .09
    _place(x, _band(2671, d, 3000, 7500) * np.sin(np.pi * np.clip(tarr(d) / d, 0, 1)) * .18, .07, 1.0)
    return norm6(_edge(x, .0004, .12), .6)


def sfx_peel():
    """A sticker peeled and pressed. The first (Lemon's yellow HOLD note, 0.45 s): a sticky note lifted off its pad, a soft paper rasp (a band that rises from 1.5 to 3.6 kHz, roughened at 95 Hz as
    the glue lets go) and a soft pat onto the plate. The second (Tomato's round FUN COMMITTEE sticker, 0.9 s): glossier, quicker and higher (2.2 to 5.2 kHz), a small squeak as it is smoothed down
    and, a beat later, the party popper that goes with it (a pop and a sprinkle of thirty confetti ticks)."""
    k = _nth("peel") % 2
    x = np.zeros(_n(.95))
    if k == 0:
        d = .13
        t = tarr(d)
        ras = _tv_filter(noise6(d, 2680), _glide(1500, 3600, d), 1.3, "bp") * (.55 + .45 * np.sign(np.sin(2 * np.pi * 95 * t))) * np.minimum(1, t / .02) * np.interp(t, [0, d * .8, d], [1, 1, 0])
        _place(x, ras, 0.0, .9)
        tt = tarr(.1)
        _place(x, _sin_of(210 * (1 - .3 * (1 - np.exp(-tt / .02)))) * np.exp(-tt / .03) * .6 + _band(2681, .1, 600, 3000) * expdecay(.1, .012) * .7, .15, 1.0)
        _place(x, _band(2682, .08, 2500, 6500) * np.sin(np.pi * np.clip(tarr(.08) / .08, 0, 1)) * .16, .2, 1.0)
    else:
        d = .12
        t = tarr(d)
        ras = _tv_filter(noise6(d, 2683), _glide(2200, 5200, d), 1.6, "bp") * (.6 + .4 * np.sign(np.sin(2 * np.pi * 130 * t))) * np.minimum(1, t / .015) * np.interp(t, [0, d * .8, d], [1, 1, 0])
        _place(x, ras, 0.0, .85)
        tt = tarr(.06)
        _place(x, _band(2684, .06, 1800, 6000) * expdecay(.06, .006) * .6 + np.sin(2 * np.pi * 330 * tt) * np.exp(-tt / .015) * .4, .14, 1.0)
        tt = tarr(.1)
        _place(x, _sin_of(_glide(1900, 2500, .1)) * np.sin(np.pi * np.clip(tt / .1, 0, 1)) * .09, .2, 1.0)
        tt = tarr(.2)
        _place(x, _band(2685, .2, 400, 6500) * expdecay(.2, .012) * 1.1 + _thump(170, 70, .2, .03) * .7, .34, .8)
        r = rng6(2686)
        for i in range(30):
            _place(x, _band(2690 + i, .01, 4500, 9500) * expdecay(.01, .002), .38 + .35 * r.uniform() ** 1.6, r.uniform(.08, .26))
    return norm6(_edge(x, .003, .12), .75)


def sfx_probebeep():
    """A digital food thermometer (0.36 s): two short chirps of a piezo (a 2.95 kHz square wave through a 2.2 to 4.4 kHz band, 75 ms each, the second a little higher), perfectly dry."""
    x = np.zeros(_n(.4))
    for j, (at, f) in enumerate(((0.0, 2950.0), (.125, 3150.0))):
        d = .075
        t = tarr(d)
        sq = _bp4(np.sign(np.sin(2 * np.pi * f * t)) * .7 + np.sin(2 * np.pi * f * t) * .4, 2200, 4600, 2) * np.minimum(1, t / .0015) * np.minimum(1, (d - t) / .006)
        _place(x, sq, at, 1.0)
    return norm6(x, .55)


def _bell(f, d, tau, a=.002):
    """The series' call-light bell at any length: a sine with the 2.76x and 5.4x partials dying faster, a soft attack."""
    t = tarr(d)
    x = (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / (tau * .45)) + .2 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / (tau * .22))) * np.exp(-t / tau)
    return x * np.minimum(1, t / a)


def sfx_callchime():
    """The call light's chime, ding-dong (A5 then E5, the series' own). In the one-take it is far away in the building: shut in (closed off at 2.6 kHz), 5 dB down, the room's tail does the rest.
    In the day room (2.2 s) it is close and unhurried: a softer attack, the two notes ringing on (0.5 and 0.8 s) so that it sits in the held chord and resolves it instead of cutting it."""
    k, scene, i = _ctx("callchime")
    if scene == "thanks":
        x = np.zeros(_n(2.3))
        _place(x, _bell(880.0, 1.3, .55, .004), 0.0, .9)
        _place(x, _bell(659.26, 1.9, .8, .005), .44, .9)
        return norm6(_edge(_lp4(x, 6000, 2), .001, .5), .6)
    x = np.zeros(_n(1.5))
    _place(x, _bell(880.0, .6, .32), 0.0, 1.0)
    _place(x, _bell(659.26, .7, .36), .42, .9)
    return norm6(_edge(_lp4(x, 2600, 2), .001, .2), .42)


def sfx_mwbeep():
    """A microwave's beep (0.17 s): a clean 2 kHz tone with the faint odd and even harmonics of a piezo (4 kHz at 10 percent, 6 kHz at 6), a 3 ms attack and an 8 ms release. Dry."""
    d = .17
    t = tarr(d)
    x = np.sin(2 * np.pi * 2000 * t) + .1 * np.sin(2 * np.pi * 4000 * t) + .06 * np.sin(2 * np.pi * 6000 * t)
    x = x * np.minimum(1, t / .003) * np.minimum(1, (d - t) / .008)
    return norm6(x, .6)


def sfx_timerding():
    """A mechanical kitchen timer going off (1.6 s): ONE bell strike, bright and clean on the instant (a steel dome bell near 2.25 kHz with partials at 2.76 and 5.4 times, ringing 0.55 s), and under
    it the buzz of the clapper shivering against the bell as the spring runs down (the bell re-struck 56 times a second, each a little weaker, for 0.9 s), and the 'tk' of the winder."""
    d = 1.6
    t = tarr(d)
    f = 2250.0
    bell = sum(a * np.sin(2 * np.pi * f * r_ * t) * np.exp(-t / tau) for r_, a, tau in ((1.0, 1.0, .55), (1.006, .5, .5), (2.76, .4, .2), (5.4, .2, .08)))
    strike = bell * np.minimum(1, t / .0015)
    buzz = bell * (np.maximum(0, np.sin(2 * np.pi * 56 * t - 1.2)) ** 2) * np.interp(t, [0, .08, .9, 1.0, d], [0, .75, .5, 0, 0]) * 1.0
    x = strike + buzz * .8
    tt = tarr(.03)
    _place(x, _band(2730, .03, 1500, 5500) * expdecay(.03, .004) * .8 + np.sin(2 * np.pi * 480 * tt) * np.exp(-tt / .008) * .4, 0.0, 1.0)
    return norm6(_edge(x, .0003, .25), .7)


def sfx_bagsweep():
    """A forearm sweeping plates, glasses and plastic off a table into a trash bag (1.5 s): one long clatter that falls into the bag. A sweep of about fifty objects (ceramic clinks, glass tinks,
    plastic knocks, the ring of a metal lid), denser and louder toward the edge and dragged by a rough scrape (0 to 0.55 s), then the fall: muffled thuds, the crinkle of the bag and the
    tumbling clinks inside it, thinning out by 1.4 s."""
    d = 1.5
    x = np.zeros(_n(d))
    r = rng6(2740)
    for i in range(52):
        u = r.uniform() ** 1.4
        at = .02 + .52 * u
        g = (.35 + .65 * u) * r.uniform(.5, 1.0)
        kind = int(r.integers(0, 4))
        if kind == 0:
            c = _ping(r.uniform(1500, 2600), .14, .03, (1.0, 2.3, 3.8), (1.0, .45, .2), (1.0, .5, .3))
        elif kind == 1:
            c = _glass(r.uniform(2800, 4600), .16, .035, .001)
        elif kind == 2:
            tt = tarr(.04)
            c = np.sin(2 * np.pi * r.uniform(900, 1400) * tt) * np.exp(-tt / .01) + _band(2750 + i, .04, 1500, 5000) * expdecay(.04, .004) * .6
        else:
            c = _ping(r.uniform(500, 900), .3, .07, (1.0, 2.7, 5.0), (1.0, .5, .3), (1.0, .6, .4))
        _place(x, c, at, g)
    t1 = tarr(.58)
    _place(x, _lp4(noise6(.58, 2741), 1900, 2) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 31 * t1))) * np.interp(t1, [0, .5, .58], [.15, 1, 0]) * .55, 0.0, 1.0)
    for i in range(16):
        at = .45 + .85 * r.uniform() ** .9
        tt = tarr(.12)
        _place(x, _lp4(noise6(.12, 2810 + i), 700, 2) * np.exp(-tt / .03) * .8 + np.sin(2 * np.pi * r.uniform(80, 170) * tt) * np.exp(-tt / .04) * .7, at, r.uniform(.3, .8) * (1.0 - .5 * (at - .45)))
    for i in range(70):
        at = .45 + .95 * r.uniform() ** 1.3
        _place(x, _band(2830 + i, .012, 2200, 6500) * expdecay(.012, .003), at, r.uniform(.1, .32) * (1.0 - .6 * (at - .45) / .95))
    for i in range(7):
        at = .6 + .7 * r.uniform()
        _place(x, _lp4(_ping(r.uniform(900, 2200), .25, .05, (1.0, 2.4, 4.1), (1.0, .4, .2), (1.0, .6, .4)), 2400, 2), at, .3 * (1.0 - .5 * (at - .6) / .7))
    return norm6(_edge(x, .003, .15), .65)


def sfx_bin():
    """A thud into a hollow plastic bin (0.45 s). The first (a whole slow cooker going in): heavy, a 105 Hz body that sags, the plastic shell's hollow resonance (430 Hz, with a small 'boing' as the
    wall flexes) and a knock. The second (Strawberry's plate): lighter and higher, 150 Hz, with the little clink of ceramic on the rim."""
    k = _nth("bin") % 2
    heavy = k == 0
    d = .45
    t = tarr(d)
    f0 = 105 if heavy else 150
    x = _sin_of(f0 * (1 - .25 * (1 - np.exp(-t / .03)))) * np.exp(-t / (.07 if heavy else .045))
    fs = 430 if heavy else 560
    x = x + .45 * _sin_of(fs * (1 - .28 * (1 - np.exp(-t / .05)))) * np.exp(-t / .05) + _band(2760 + k, d, 400, 3000) * expdecay(d, .006) * (.8 if heavy else .6)
    if not heavy:
        _place(x, _ping(2100, .2, .04, (1.0, 2.3, 3.7), (1.0, .4, .2), (1.0, .5, .3)) * .45, .012, 1.0)
    return norm6(_edge(x, .0008, .1), .7)


def sfx_chairsit():
    """A chair taking weight (1.7 s): the cushion's soft thump (a 75 Hz body and a muffled slap), the frame's creak (a stick-slip squeak that climbs 520 to 610 Hz with a 28 Hz roughness, 0.3 s)
    and a smaller one as she settles, and the long exhale of someone who has not sat down all day (a breath through two soft formants, 500 and 1.5 kHz, that swells for 0.5 s and sighs out for 1.1)."""
    d = 1.7
    x = np.zeros(_n(d))
    t = tarr(.3)
    _place(x, _sin_of(75 * (1 - .2 * (1 - np.exp(-t / .05)))) * np.exp(-t / .08) * .6 + _lp4(noise6(.3, 2770), 450, 2) * np.exp(-t / .06) * .5, 0.0, 1.0)
    for at, f0, dd, g in ((.07, 520, .3, .28), (.5, 470, .2, .16)):
        tt = tarr(dd)
        f = _glide(f0, f0 * 1.17, dd) * (1 + .02 * np.sin(2 * np.pi * 5 * tt))
        sq = (_sin_of(f) + .35 * _sin_of(2 * f)) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 28 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** .7
        _place(x, _res(sq, f0 * 1.1, 4.0) * .8, at, g)
    dd = 1.5
    tt = tarr(dd)
    br = noise6(dd, 2771)
    breath = (_res(br, 500, 2.0) * .9 + _res(br, 1500, 2.5) * .5 + _lp4(br, 3000, 2) * .25) * np.interp(tt, [0, .5, 1.0, dd], [0, 1, .55, 0]) * (1 + .1 * np.sin(2 * np.pi * 1.3 * tt))
    _place(x, _lp4(breath, 2600, 2) * .5, .2, 1.0)
    return norm6(_edge(x, .003, .25), .4)


def sfx_grin():
    """A menacing glint (1.3 s): a tiny rising bell (E7 then B7, 70 ms apart, each with a little upward slide: loud enough to be heard first) and a low sustain that swells under it (A2
    and B-flat2 saws, a minor second, through a 450 Hz low-pass, with their octave up at 220 Hz so a phone has it), the kind of sound a friendly assistant should not make."""
    x = np.zeros(_n(1.4))
    for j, f in enumerate((2637.0, 3951.0)):
        d = .5
        t = tarr(d)
        fr = f * (.97 + .03 * np.minimum(1, t / .05))
        _place(x, _sin_of(fr) * np.exp(-t / .2) * np.minimum(1, t / .002) + .25 * _sin_of(fr * 2.76) * np.exp(-t / .06), .07 * j, 1.5 - .3 * j)
    d = 1.15
    t = tarr(d)
    low = _lp4(osc("saw", 110.0, d) + osc("saw", 116.5, d) + .6 * osc("saw", 55.0, d), 450, 2) + .7 * _lp4(osc("saw", 220.0, d) + osc("saw", 233.0, d), 900, 2)
    _place(x, low * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6 * (1 + .12 * np.sin(2 * np.pi * 5 * t)), .05, .35)
    return norm6(_edge(x, .0005, .25), .65)


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


# ================================================================ the Merge theme and the stings
KEY = {0: -2, 1: 3}          # the Merge theme's transposition from C in semitones: the title in B-flat major (a slow-cooker lullaby), the end card in E-flat major (Episodes 15 to 18 were C, D, F, then E and A)
STEP20 = {0: .375, 1: .4875}  # one eighth of the bar: the title's (80 bpm: 0.2 to 3.2 s) lands on the second lid rattle, the end card's (61.5 bpm: 0.1 to 4.0 s) on the stamp
LAND19 = {0: ((82, 1.0, 1.0), (86, .8, .9), (89, .7, .8), (93, .6, .8)),                                   # B-flat major seventh, in C-based MIDI note, level and decay (B-flat5 D6 F6 A6)
          1: ((75, 1.0, 1.4), (79, .8, 1.3), (82, .75, 1.2), (86, .6, 1.2), (91, .45, 1.1))}                 # E-flat major seventh (E-flat5 G5 B-flat5 D6 G6)


def sfx_theme15():
    """The Merge theme's sparkle layer, in a new key each time. TITLE (B-flat major, a lullaby at 80 bpm): the eight eighths of the arpeggio on glass (a music box, climbing in level) over a breath of
    rising air, and on the downbeat at 3.0 s a soft shimmer of the B-flat major seventh. END CARD (E-flat major, 61.5 bpm, 3.9 s): the same run, then on the stamp's downbeat a held E-flat major
    seventh in glass (the seventh, D, on top: it does not resolve)."""
    k = _nth("theme15")
    kk = 1 if k > 0 else 0
    key, step = KEY[kk], STEP20[kk]
    L = 8 * step
    d = L + (2.0 if kk == 0 else 3.2)
    x = np.zeros(_n(d + .2))
    arp = tuple(m + key for m in (72, 76, 79, 84, 79, 76, 79, 84))
    for i, m in enumerate(arp):
        g = .3 + .45 * i / 7
        _place(x, _glass(midi(m + 12), .8, .22, .002) * .5, i * step, g * .8)
        _place(x, _note(midi(m + 12), .6, .18, ((1, 1.0), (4, .25), (10, .06))) * .5, i * step, g * .45)
    t = tarr(L)
    _place(x, _tv_filter(noise6(L, 3000 + k), _glide(500, 6500, L), 1.2, "bp") * (t / L) ** 2 * .1, 0.0, 1.0)
    for m, g, tau in LAND19[kk]:
        _place(x, _glass(midi(m + 12 if kk == 0 else m), 3.0, tau * (1.0 if kk == 0 else 1.5), .006 if kk == 0 else .004), L, g * (.3 if kk == 0 else .4))
    if kk == 1:
        _place(x, _glass(midi(103 + key - 12), .9, .3, .001), L + .05, .12)
    x = x[:_n(d)]
    return norm6(_edge(x, .0004, .5), .55)


def _soft(notes, d, a=.04, tau=None, lp=1800, saw=.5):
    """A warm chord for the stings: sines and a little saw, a slow attack, closed off at `lp`."""
    t = tarr(d)
    tau = tau or d * .6
    x = sum(np.sin(2 * np.pi * midi(m) * t) + saw * osc("saw", midi(m) * 1.002, d) * .4 for m in notes) / max(1, len(notes))
    return _lp4(x, lp, 2) * np.minimum(1, t / a) * np.exp(-t / tau)


def sfx_sting():
    """The series' stings, one fitted to each scene (1.0 to 1.5 s).
    signup (after 'Efficiency.'): a party popper and its confetti, then a bright 'ta-da' (G5 to C6, marimba and glass) over a hollow bassoon note (C3) that sags a quarter tone: efficient, and empty.
    kitchen (after 'It is beige.'): a muffled service bell, a spoon on a plate, and two tuba notes that sag, F2 and E2, a 'bwomp, bwomp': beige.
    plate (after 'What time is it?', on 7:59): a clock, tick and tock, and under it a low brass swell with a soft timpani that does not resolve.
    breakroom (after 'It was a good year.'): warm. A C major chord on soft strings and a cello that swell together (the key Brenda's six notes end in), a music-box glint on top, nothing sharp.
    thanks (after the Moon): an amen, a plagal cadence on soft glass and strings (D major, then A major), very quiet."""
    k, scene, i = _ctx("sting")
    x = np.zeros(_n(1.6))
    if scene == "signup":
        _place(x, _sum(_band(3101, .08, 500, 6500) * expdecay(.08, .01) * 1.0, _thump(170, 70, .1, .02) * .6), 0.0, .8)
        r = rng6(3102)
        for j in range(20):
            _place(x, _band(3110 + j, .01, 4500, 9500) * expdecay(.01, .002), .05 + .4 * r.uniform() ** 1.5, r.uniform(.08, .22))
        for j, (at, m) in enumerate(((.08, 79), (.2, 84))):
            _place(x, _note(midi(m), .5, .12, ((1, 1.0), (4, .35), (10, .1))), at, .5)
            _place(x, _glass(midi(m + 12), .6, .2, .001) * .4, at, .5)
        d = 1.05
        t = tarr(d)
        fr = midi(48) * (1 - .015 * np.clip((t - .3) / .6, 0, 1))
        bas = _lp4(osc("saw", fr, d) * .8 + osc("square", fr, d) * .3, 700, 2) * np.minimum(1, t / .03) * np.exp(-t / .5)
        _place(x, bas, .2, .5)
    elif scene == "kitchen":
        _place(x, _lp4(_bell(2350.0, .8, .25) * .8, 3000, 2), 0.0, .35)
        _place(x, _ping(1700, .4, .05, (1.0, 2.5, 4.4), (1.0, .4, .2), (1.0, .5, .3)), .08, .22)
        for at, f, dd in ((.18, 87.3, .5), (.7, 82.4, .8)):
            t = tarr(dd)
            ff = f * (1 - .04 * t / dd)
            x_ = _lp4(osc("saw", ff, dd) * .8 + osc("square", ff, dd) * .4, 520, 3) * np.minimum(1, t / .02) * np.exp(-t / (dd * .6))
            _place(x, x_ * 1.3, at, .7)
    elif scene == "plate":
        for j, at in enumerate((0.0, .5)):
            tt = tarr(.05)
            _place(x, np.sin(2 * np.pi * (1700 - 220 * j) * tt) * np.exp(-tt / .006) * .5 + _band(3120 + j, .05, 800, 4000) * expdecay(.05, .003) * .6, at, .5)
        d = 1.4
        t = tarr(d)
        br = _lp4(osc("saw", 73.4, d) + .6 * osc("saw", 73.4 * 1.004, d) + .5 * osc("saw", 110.0, d), 600, 2)
        _place(x, br * np.minimum(1, t / .12) * np.exp(-t / .9), .02, .9)
        _place(x, _thump(72, 40, .6, .18), .02, .6)
    elif scene == "breakroom":
        d = 1.5
        _place(x, _soft((48, 55, 60, 64, 67, 72), d, .12, .8, 1700), 0.0, 1.0)
        _place(x, _soft((36,), d, .1, .8, 600), 0.0, 1.2)
        _place(x, _glass(midi(91), .9, .3, .002) * .35, .25, 1.0)
        _place(x, _glass(midi(88), .9, .3, .002) * .3, .42, 1.0)
    else:                                                                                     # thanks
        d1, d2 = .6, 1.2
        _place(x, _soft((50, 57, 62, 66, 74), d1, .03, .35, 2400, .2), 0.0, 1.0)
        _place(x, _soft((45, 52, 57, 61, 64, 69, 76), d2, .06, .6, 2400, .2), .5, 1.1)
        _place(x, _glass(midi(81), 1.0, .4, .002) * .4, .5, .8)
    x = x[:_n(1.55)]
    return norm6(_edge(x, .0005, .3), .75)


# ================================================================ Episode 19: the room tone of every space (beds)
# A bed is a designed event the script does not list (see _make_events): a stereo texture that fills one scene (the one-take's is five textures cross-faded by the camera's path). It is
# returned at unit RMS; the event's gain sets its level (BED_DB: dB under a spoken line). Beds skip the scene's reverb (NOREV): each already has its room baked in.
BED_DB = {"title": -34, "signup": -34, "kitchen": -29, "oner": -24, "break": -31, "day": -31, "end": -40}


def _rms(x, r=1.0):
    """Scale x to RMS r (a bed's component)."""
    return x * (r / (np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-12))


def _wob(d, seed, fc=.2, depth=.25):
    """A slow level wobble around 1."""
    return 1 + depth * _smooth_rand(d, seed, fc)


def _ctr(x, pan=0.0):
    """A mono source placed in the field (equal power)."""
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


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


def _bubbles(d, seed, rate=9.0, lo=240, hi=700):
    """A simmer: soft bubbles breaking (15 to 45 ms blips whose pitch rises as they close), `rate` a second on average."""
    r = rng6(seed)
    out = np.zeros(_n(d))
    t = r.uniform(0, .2)
    while t < d - .05:
        dd = r.uniform(.015, .045)
        tt = tarr(dd)
        c = np.sin(2 * np.pi * r.uniform(lo, hi) * tt * (1 + 1.8 * tt / dd)) * np.exp(-tt / (dd * .45)) * r.uniform(.3, 1.0)
        _place(out, c, t, 1.0)
        t += r.exponential(1 / rate)
    return out


def _pings(d, seed, every=(2.5, 6.0), lo=800, hi=2400, lpf=4500):
    """Distant metal: pans and ladles touching somewhere in the kitchen, one every few seconds."""
    r = rng6(seed)
    out = np.zeros(_n(d))
    t = r.uniform(.4, 2.0)
    while t < d - .4:
        f = r.uniform(lo, hi)
        _place(out, _sum(_ping(f, .4, r.uniform(.05, .13), (1.0, 2.5, 4.4), (1.0, .4, .2), (1.0, .6, .4)), _band(int(seed + t * 10), .02, 2000, 6500) * expdecay(.02, .003) * .5), t, r.uniform(.4, 1.0))
        t += r.uniform(*every)
    return _lp4(out, lpf, 2)


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


# ---------------------------------------------------------------- one bed per space (each returns a (2, n) texture at unit RMS)
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


def room_kitchen(d, seed=1930):
    """The steel kitchen: the exhaust hood's fan (a broad low rush of air with a 118 Hz motor and a 187 Hz blade tone), the steam table simmering and hissing, a compressor, pans touching far off."""
    fan = _diffuse(lambda s: _rms(_lp4(noise6(d, s), 900, 2) * _wob(d, s + 1, .12, .25) + _bp4(noise6(d, s + 2), 1000, 5200, 1) * .05, 1.0), seed)
    t = tarr(d)
    motor = (np.sin(2 * np.pi * 118 * t) + .4 * np.sin(2 * np.pi * 236 * t + 1)) * _wob(d, seed + 3, .08, .2)
    blade = np.sin(2 * np.pi * 187 * t) * (.5 + .5 * np.sin(2 * np.pi * 3.1 * t))
    simmer = _diffuse(lambda s: _rms(_bubbles(d, s, 11, 200, 520), 1.0), seed + 20)
    hiss = _diffuse(lambda s: _rms(_band(s, d, 2800, 8000) * _wob(d, s + 1, .3, .3), 1.0), seed + 30)
    pings = _pings(d, seed + 40)
    return _mix([(fan, 1.0), (_rms(motor, .1), 1.0), (_rms(blade, .045), 1.0), (simmer, .24), (hiss, .1), (_ctr(_rms(pings, .16), -.4), 1.0), (_ctr(_rms(_hum(d, 56.0), .08)), 1.0)], d)


def room_corridor(d, seed=1940):
    """A long hospital corridor: air handling with a duct tone, the hiss of a vent, now and then a far door and a cart's wheel."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 150.0, 380.0), 1.0), seed)
    r = rng6(seed + 7)
    far = np.zeros(_n(d))
    for k in range(int(d / 3.5)):
        at = r.uniform(.5, d - .6)
        tt = tarr(.18)
        _place(far, _lp4(noise6(.18, seed + 10 + k), 500, 2) * np.exp(-tt / .04) + np.sin(2 * np.pi * r.uniform(70, 110) * tt) * np.exp(-tt / .05) * .6, at, r.uniform(.3, .7))
    return _mix([(air, 1.0), (_ctr(_rms(far, .14), r.uniform(-.5, .5)), 1.0), (_ctr(_rms(_hum(d, 100.0, ((1, 1.0), (2, .5))), .03)), 1.0)], d)


def room_station(d, seed=1950):
    """A busy nurses' station: air, three conversations, a telephone, somebody typing, the low hum of a printer and a monitor."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 170.0, 360.0), 1.0), seed)
    bab = _diffuse(lambda s: _rms(_babble(d, s, 3), 1.0), seed + 11)
    ph = _phone(d, seed + 21)
    ty = _typing_far(d, seed + 31)
    return _mix([(air, .7), (bab, .6), (_ctr(_rms(ph, .35), .45), 1.0), (_ctr(_rms(ty, .3), -.4), 1.0), (_ctr(_rms(_hum(d, 120.0, ((1, 1.0), (2, .3))), .05)), 1.0)], d)


def room_hall(d, seed=1960):
    """A quiet hall: a hush of air, a television far away in a day room, a clock somewhere, the call light's chime at the far end."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 130.0, 300.0), 1.0), seed)
    tv = _tv_far(d, seed + 5, 1.0)
    return _mix([(air, 1.0), (_ctr(_rms(tv, .3), .5), 1.0), (_ctr(_rms(_ticks(d, seed + 9, 1.0, .61), .08), -.3), 1.0), (_ctr(_rms(_chimes_far(d, seed + 15), .13), .3), 1.0)], d)


def room_medroom(d, seed=1970):
    """The med room at the end of the corridor: almost nothing. A very soft hush, the wall clock's tick (it is 7:59), the faint rattle of cups on the cart."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 120.0, 240.0), 1.0), seed)
    r = rng6(seed + 3)
    cups = np.zeros(_n(d))
    for k in range(int(d / 4.0)):
        _place(cups, _ping(r.uniform(2200, 3600), .12, .02, (1.0, 2.4), (1.0, .3), (1.0, .5)), r.uniform(.5, d - .5), r.uniform(.3, .7))
    return _mix([(air, 1.0), (_ctr(_rms(_ticks(d, seed + 5, 1.0, .5), .2), .15), 1.0), (_ctr(_rms(cups, .05), -.2), 1.0)], d)


def room_title(d, seed=1900):
    """A kitchen counter in the evening: the room's hush, the slow cooker simmering (soft bubbles and a thread of steam), a refrigerator and a clock."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 140.0, 300.0), 1.0), seed)
    simmer = _diffuse(lambda s: _rms(_bubbles(d, s, 6, 170, 420), 1.0), seed + 20)
    return _mix([(air, 1.0), (simmer, .45), (_ctr(_rms(_hum(d, 51.0), .08)), 1.0), (_ctr(_rms(_ticks(d, seed + 9, 1.0, .41), .12), .4), 1.0)], d)


def room_signup(d, seed=1920):
    """The lobby hall by the nurses' station, afternoon: air, the murmur of a few staff, a telephone, a keyboard, the chime of a call light far away."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 150.0, 340.0), 1.0), seed)
    bab = _diffuse(lambda s: _rms(_babble(d, s, 3), 1.0), seed + 11)
    return _mix([(air, .8), (bab, .35), (_ctr(_rms(_phone(d, seed + 21, (9.0, 14.0)), .3), .5), 1.0), (_ctr(_rms(_typing_far(d, seed + 31, (3.0, 7.0)), .25), -.5), 1.0),
                 (_ctr(_rms(_chimes_far(d, seed + 41, (9.0, 14.0)), .14), .25), 1.0)], d)


def room_break(d, seed=1980):
    """The break room: a refrigerator whose compressor kicks in with a shudder and a click, the flicker of a fluorescent tube (120 Hz and a hum of 60), the murmur of a queue in the doorway and, now
    and then, the call light's chime a long way off."""
    t = tarr(d)
    fridge = _hum(d, 54.0, ((1, 1.0), (2, .5), (3, .3), (5, .1))) * (.7 + .3 * np.interp(t, [0, 2.0, 2.2, 9.0, 9.3, 18.0, 18.2, d], [.0, .0, 1, 1, .0, .0, 1, 1]))
    tube = (np.sin(2 * np.pi * 120 * t) * .6 + np.sin(2 * np.pi * 240 * t + 1) * .25) * (1 + .15 * np.sign(_smooth_rand(d, seed + 3, 9)))
    air = _diffuse(lambda s: _rms(_hvac(d, s, 130.0, 300.0), 1.0), seed)
    bab = _diffuse(lambda s: _rms(_babble(d, s, 3, 150, 2200), 1.0), seed + 11)
    click = np.zeros(_n(d))
    for at in (2.0, 9.0, 18.0):
        if at < d - .2:
            tt = tarr(.06)
            _place(click, np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / .015) + _band(int(seed + at), .06, 600, 3000) * expdecay(.06, .006), at, 1.0)
    return _mix([(air, .8), (_ctr(_rms(fridge, .35), -.35), 1.0), (_ctr(_rms(tube, .12), .3), 1.0), (bab, .22), (_ctr(_rms(click, .06), -.35), 1.0),
                 (_ctr(_rms(_chimes_far(d, seed + 41, (7.0, 11.0)), .12), .35), 1.0)], d)


def room_day(d, seed=1990):
    """The day room at night: carpet and curtains, a warm low hush of air, a television far away in the next room (it dips while Strawberry sits: the sit beat is room tone and breath), a clock."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 110.0, 260.0), 1.0), seed)
    tv = _tv_far(d, seed + 5, 1.0)
    sit = _beat_abs("thanks", "sit")
    sc = _scene_info("thanks")
    t = tarr(d)
    if sit and sc:
        a, b = sit[0] - sc["start"] - .3, sit[1] - sc["start"] + .3
        tv = tv * np.interp(t, [a - .4, a, b, b + .5], [1.0, .12, .12, 1.0])
    return _mix([(air, 1.0), (_ctr(_rms(tv, .32), .5), 1.0), (_ctr(_rms(_ticks(d, seed + 9, 1.0, .43, (1500, 1150)), .08), -.45), 1.0)], d)


def room_end(d, seed=1995):
    """The end card: almost silence, so the last chord has a floor: a very soft hush of air and a refrigerator."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 130.0, 280.0), 1.0), seed)
    return _mix([(air, 1.0), (_ctr(_rms(_hum(d, 52.0), .06)), 1.0)], d)


ROOM_FN = {"title": room_title, "signup": room_signup, "kitchen": room_kitchen, "break": room_break, "day": room_day, "end": room_end}
BED_SCENE = {"title": "title", "signup": "signup", "kitchen": "kitchen", "oner": "plate", "break": "breakroom", "day": "thanks", "end": "end"}


ROOM_LEVEL = (1.0, .6, .85, .4, .25)      # how loud each space of the one take is against the others: the kitchen's hood, a corridor, a busy station, a quiet hall, a med room


def room_oner(d, t0):
    """The one take's room tone: the five spaces' beds cross-faded by the camera's path (equal power, 250 ms), so the exhaust hood of the kitchen gives way to the corridor's air, a busy station,
    a quiet hall and a med room with a wall clock, whose tick comes up as the camera pushes in on it at the end."""
    beds = [_rms(b, lv) for b, lv in zip((room_kitchen(d, 1931), room_corridor(d, 1941), room_station(d, 1951), room_hall(d, 1961), room_medroom(d, 1971)), ROOM_LEVEL)]
    t = t0 + np.arange(_n(d)) / SR
    w = np.sqrt(PLATE.weights(t)) if PLATE.active else np.sqrt(np.array([1.0, 0, 0, 0, 0])[:, None] * np.ones(_n(d)))
    out = sum(b * w[i] for i, b in enumerate(beds))
    sc = _scene_info("plate")
    if sc:                                                                                    # the push-in on the clock
        end = sc["start"] + sc["dur"]
        out = out + np.stack([_ticks(d, 1977, 1.0, .5) * .16] * 2) * np.interp(t, [end - 4.0, end - 1.6], [0, 1.0]) * w[4]
    return out


def _make_bed(name):
    def run():
        sid = BED_SCENE[name]
        s = _scene_info(sid)
        d = (s["dur"] if s else 10.0) + .3
        x = room_oner(d, s["start"]) if name == "oner" else ROOM_FN[name](d)
        x = _rms(x, 1.0)
        fade = np.minimum(1, np.minimum(np.arange(x.shape[1]) / (.25 * SR), (x.shape[1] - np.arange(x.shape[1])) / (.3 * SR)))
        return x * fade
    run.__doc__ = f"The room tone of the {BED_SCENE[name]} scene (see room_*), at unit RMS."
    return run


for _bn in BED_SCENE:
    globals()["sfx_bed_" + _bn] = _make_bed(_bn)
    BA.SFX["bed_" + _bn] = globals()["sfx_bed_" + _bn]


# ================================================================ registration (keep this at the end of the sfx section)
BOOST = {   # sustained textures that sat 15 to 20 dB under the voice at the script's gains: lifted so they register (the dialogue dip still takes them down under speech)
    "sniffle": 1.6, "typing": 1.2,
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


# ================================================================ the animation's footsteps and the simulation's collisions, balanced for this mix


def _scene_table():
    if not os.path.exists(os.path.join(HERE, "build/ep20/timeline.json")):
        return []
    tl = json.load(open(os.path.join(HERE, "build/ep20/timeline.json")))
    return [(s["id"], s["start"], s["start"] + s["dur"], s["beats"]) for s in tl["scenes"]]


def _scene_of(t, tab):
    name = None
    for nm, a, b, _ in tab:
        if t >= a:
            name = nm
    return name


def _scripted(tab):
    """[(absolute time, effect name, gain)] of every cue of the script, from the frozen timeline's beat times."""
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


PHYS_BOOST = {}      # per-object boosts of a simulation's collisions (none in Episode 19: phys_events.json is not expected)


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


BIG_CUES = ("stamp", "moldpress", "doorbell", "timerding", "bagsweep", "bin", "plateclink", "chairsit", "carve", "chop")      # scripted hits that a collision from a simulation must not double (none is expected in this episode)
STEP_SCALE = {"title": 1.0, "signup": .9, "kitchen": .9, "plate": .85, "breakroom": .85, "thanks": .8, "end": 1.0}
RUSH_AT = (0.0, .03, .055, .08)
BED_VOL = {}        # bed name -> the event's gain (filled by _make_events from BED_DB)


def _tune_steps(events, tab):
    """The animation's footsteps, balanced for this mix: each scene's own scale, and steps that land on the same instant are spread by a few milliseconds (a crowd is never one foot)."""
    out = []
    for ev in events:
        ev = dict(ev)
        if ev.get("name") == "step":
            ev["vol"] = round(ev.get("vol", .5) * STEP_SCALE.get(_scene_of(ev["t"], tab), 1.0), 4)
        out.append(ev)
    steps = sorted((e for e in out if e.get("name") == "step"), key=lambda e: e["t"])
    for e in steps:
        same = [x for x in steps if abs(x["t"] - e["t"]) < .005 and x is not e]
        if same and all(e["t"] <= x["t"] for x in same):
            group = sorted([e] + same, key=lambda x: str(x.get("key", "")))
            for j, x in enumerate(group):
                x["t"] = round(x["t"] + RUSH_AT[min(j, len(RUSH_AT) - 1)], 3)
                x["vol"] = round(x["vol"] * .8, 4)
    return out


def _bed_events(tab):
    """One designed room-tone event per scene (not in the script): the bed starts with its scene and runs to its end. Its gain puts it BED_DB dB under a spoken line: dialogue sits near 0.1 in
    the mixer's units before its final gain, the clip is at unit RMS and the mixer multiplies a cue's gain by 0.6."""
    ev = []
    by = {nm: (a, b) for nm, a, b, bt in tab}
    for nm, sid in BED_SCENE.items():
        if sid not in by:
            continue
        BED_VOL[nm] = round(.1 * 10 ** (BED_DB[nm] / 20) / .6, 5)
        ev.append({"t": round(by[sid][0], 3), "name": "bed_" + nm, "vol": BED_VOL[nm], "pan": 0.0, "room": "hall"})
    return ev


def _make_events(src, phys_src, out_dir):
    """Write <out_dir>/events.tuned.json from the footsteps (src), the collisions (phys_src) and the designed room-tone beds; returns its path, or '' when there is nothing to place."""
    tab = _scene_table()
    if not tab:
        return ""
    steps = json.load(open(src)) if src and os.path.exists(src) else []
    phys = json.load(open(phys_src)) if phys_src and os.path.exists(phys_src) else []
    ev = _tune_steps(steps, tab) + _select_phys(phys, _scripted(tab))
    PHYS_EVENTS[:] = [e for e in ev if e.get("name") == "phys"]
    ev += _bed_events(tab)
    dst = os.path.join(out_dir, "events.tuned.json")
    os.makedirs(out_dir, exist_ok=True)
    json.dump(ev, open(dst, "w"), indent=0)
    return dst


# ================================================================ checks: the timeline, the dialogue margin, the loudness and the silences
def compare_timeline(out_dir):
    """Scene starts, scene lengths and every line's start and end of this build against the frozen build/ep20/timeline.json. Returns the list of differences (empty: identical)."""
    if not os.path.exists(os.path.join(HERE, "build/ep20/timeline.json")):
        return []
    a = json.load(open(os.path.join(HERE, out_dir, "timeline.json")))
    b = json.load(open(os.path.join(HERE, "build/ep20/timeline.json")))
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
        if ln["who"] in DRY_WHO:                                  # a dry voice (Brenda) skips the room, so its reverb is not part of the line's level
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
    import re
    import subprocess

    import imageio_ffmpeg
    r = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-nostats", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"LRA:\s+(-?\d+\.?\d*) LU", r.stderr)
    return float(m[-1]) if m else float("nan")


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
    # the loudest moments: the 400 ms momentary loudness (a quick K-less estimate by RMS) around each scripted big cue
    win = int(.4 * sr)
    seg = mono[:len(mono) // win * win].reshape(-1, win)
    lm = 10 * np.log10(np.mean(seg ** 2, axis=1) + 1e-12)
    top = np.argsort(lm)[::-1][:3]
    print("  loudest 400 ms blocks: " + ", ".join(f"{(i * win) / sr:.1f}s {lm[i]:.1f} dB" for i in top))
    return runs


def write_cue_report(out_dir):
    """The cue list as built (scene-local time, absolute time, name, gain, pan) for the script's cues, then the designed events the script does not list (the room-tone beds with their levels), the
    microwave grid, the lid's hit table, the one-take's path (its source and the rooms it passes through) and the physics foley."""
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
                lines.append(f"{sc['id']:<10} {s:8.3f} {a + s:9.3f}  {c[0]:<12} {c[2]:<5} {c[3] if len(c) > 3 else 0}" + ("" if c[0] in BA.SFX else "   (missing sfx)"))
    lines.append("")
    lines.append(f"cue names in the script: {len(names)}; missing from the registry: {sorted(n for n in names if n not in BA.SFX) or 'none'}")
    lines.append("")
    lines.append("designed events (not in the script): the room-tone beds, one per scene, cue gain from BED_DB (dB under a spoken line)")
    for nm, sid in BED_SCENE.items():
        if sid in by:
            a = by[sid][0]
            s = _scene_info(sid)
            lines.append(f"{sid:<10} {0:8.3f} {a:9.3f}  bed_{nm:<8} {BED_VOL.get(nm, 0):<8} 0.0   {BED_DB[nm]} dB, {s['dur'] + .3:.2f} s")
    lines.append("")
    lines.append("the one take: " + PLATE.source)
    if PLATE.active:
        rm = PLATE.rm
        start = 0
        for i in range(1, len(rm) + 1):
            if i == len(rm) or rm[i] != rm[start]:
                lines.append(f"  room {ROOMS5[rm[start]]:<9} {PLATE.ts[start] - PLATE.t0:6.2f} to {PLATE.ts[i - 1] - PLATE.t0 + .1:6.2f} s of the scene (camera x {PLATE.xs[start]:.0f} to {PLATE.xs[i - 1]:.0f})")
                start = i
    lines.append("")
    g = M19.mw_grid(_scene_info("breakroom"), script)
    if g:
        lines.append(f"microwave grid (breakroom): beeps at 0.3, 0.65, 1.0 s; eighth {g['eighth']:.6f} s ({g['bpm']:.2f} bpm), origin {g['origin']:.3f} s of the scene, a bar of 8 eighths from there "
                     f"({g['bar']:.4f} s); the timer's ding (14.429 s) is the downbeat of bar {g['ding_bar']} ({g['origin'] + g['bar'] * g['ding_bar']:.3f} s)")
    bi = M19.INFO.get("baton")
    if bi:
        bd = np.diff(bi["beats"])
        lines.append("the baton (plate): " + ", ".join(f"{who} on '{ln}' at {t:.3f} s" for ln, who, t in bi["handoffs"]) + f"; {len(bi['beats']) - 1} beats in 3/4, {60 / bd.max():.0f} to {60 / bd.min():.0f} bpm")
    per = {}
    for e in PHYS_EVENTS:
        per[_scene_of(e["t"], tab)] = per.get(_scene_of(e["t"], tab), 0) + 1
    lines.append(f"physics foley placed: {len(PHYS_EVENTS)} " + str(per))
    open(os.path.join(HERE, out_dir, "cue_report.txt"), "w").write("\n".join(lines) + "\n")


# ================================================================ the AAC guard (fixed in Episode 19)
FF = "/usr/bin/ffmpeg" if os.path.exists("/usr/bin/ffmpeg") else (shutil.which("ffmpeg") or "ffmpeg")       # the encoder the publish step uses; Episode 18's guard encoded with the ffmpeg that imageio ships (7.0.2), whose AAC overshoots differently: -0.8 dBTP came out of a guard that passed
TP_LIMIT = -1.5              # dBTP of the DECODED m4a


def decoded_true_peak(m4a):
    """The true peak (dBTP) of an AAC file, measured the way the brief says: `ffmpeg -i audio.m4a -af ebur128=peak=true -f null -` (the decoder inside ffmpeg, EBU R128's 4x oversampled peak)."""
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", m4a, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"True peak:\s+Peak:\s+(-?\d+\.?\d*) dBFS", r.stderr)
    return float(m[-1]) if m else float("nan")


def aac_guard19(path, limit_db=TP_LIMIT, tries=8):
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
    dst = os.path.join(HERE, "build/ep20/audio.wav")
    m4a = os.path.join(HERE, "build/ep20/audio.m4a")
    shutil.copyfile(src, dst)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", dst, "-c:a", "aac", "-b:a", "192k", m4a], check=True)
    tp = decoded_true_peak(m4a)
    print(f"published: build/ep20/audio.wav and build/ep20/audio.m4a; the decoded m4a's true peak is {tp:.2f} dBTP (limit {TP_LIMIT})")
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
    """The loudness trim, peak limiter, end fade and AAC guard: the finished file measures -14.8 LUFS and the DECODED AAC stays under -1.5 dBTP (see aac_guard19)."""
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
    dips, deep, tp = aac_guard19(wav)
    print(f"aac guard: {dips} dip(s), deepest {deep:.2f} dB; the decoded m4a's true peak is {tp:.2f} dBTP (limit {TP_LIMIT}, measured with /usr/bin/ffmpeg -af ebur128=peak=true)")


def main():
    argv = sys.argv[1:]
    do_publish = "--publish" in argv
    argv = [a for a in argv if a != "--publish"]
    phys_src = None
    if "--phys" in argv:
        i = argv.index("--phys")
        phys_src = argv[i + 1]
        del argv[i:i + 2]
    path_src = os.path.join(A6.HERE, "build/ep20/plate_path.json")
    if "--path" in argv:
        i = argv.index("--path")
        path_src = argv[i + 1]
        del argv[i:i + 2]
    keep_stems = "--keep-stems" in argv
    argv = [a for a in argv if a != "--keep-stems"]
    for k, v in (("--script", SCRIPT), ("--out", "build/ep20_sound"), ("--var", "TIMELINE_EP20"), ("--music", "build_music20")):
        if k not in argv:
            argv += [k, v]
    out = argv[argv.index("--out") + 1]
    out_dir = os.path.join(A6.HERE, out)
    os.makedirs(out_dir, exist_ok=True)
    src = argv[argv.index("--events") + 1] if "--events" in argv else ""
    if "--events" in argv:
        del argv[argv.index("--events"):argv.index("--events") + 2]
    if not src:                                         # the animation's footsteps, if they are in the output folder or in build/ep20: they are always tuned first
        for p in (os.path.join(out_dir, "events.json"), os.path.join(A6.HERE, "build/ep20/events.json")):
            if os.path.exists(p):
                src = p
                break
    if phys_src is None:
        p = os.path.join(A6.HERE, "build/ep20/phys_events.json")
        phys_src = p if os.path.exists(p) else ""
    PLATE.setup(path_src)
    print(f"the one take's path: {PLATE.source}")
    tuned = _make_events(src, phys_src, out_dir)
    print(f"events: footsteps from {src or 'none'}, collisions from {phys_src or 'none'} ({len(PHYS_EVENTS)} placed), {len(BED_VOL)} room-tone beds")
    if tuned:
        argv += ["--events", tuned]
    sys.argv = [sys.argv[0]] + argv
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    _STATIC_PAN.update({k: v.get("pan", 0.0) for k, v in script["voices"].items()})
    VOX_DIR[0] = os.path.join(out_dir, "voice")
    os.makedirs(VOX_DIR[0], exist_ok=True)
    _load_speech()
    _TTS_ORIG[0] = A6.tts6
    A6.tts6 = tts15
    A6.place2 = place2_19
    A6.reverb = reverb_19
    A10._CALLS.clear()
    os.environ["STEMS"] = "1"
    A6.main()
    bad = compare_timeline(out)
    if bad:
        print("TIMELINE MISMATCH (not published):")
        for b in bad[:20]:
            print("  ", b)
    else:
        print("timeline: identical to build/ep20/timeline.json (scene starts, lengths, every line's start and end)")
    write_cue_report(out)
    json.dump(M19.mw_grid(_scene_info("breakroom"), script) or {}, open(os.path.join(out_dir, "mw_grid.json"), "w"), indent=1)
    json.dump(M19.INFO, open(os.path.join(out_dir, "score_info.json"), "w"), indent=1)          # the baton: every beat time of the waltz and who holds it from when (for the picture to read, if it wants to)
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
