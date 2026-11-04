"""Episode 18 audio: THE FIRE DRILL. A copy of the Episode 15 to 17 mixer wrapper (build_audio17.py, the final one) with this episode's own paths, scene ids and cue contexts.

Everything build_audio15 explains applies unchanged: the per-line voice cache under <out>/voice/ (Binder's bright and slightly synthetic voice with a low menace on 'Great! I'll help.',
Onion's tremble, the Strawberries' chorus), the dip of every cue under dialogue (DUCK_DB), the physics foley family (build/ep18/phys_events.json), the footsteps from the animation
(build/ep18/events.json), the loudness trim, peak limiter and AAC guard, the timeline comparison against build/ep18/timeline.json, the dialogue margin of every line.

WHAT IS NEW IN EPISODE 18 (scene ids: title, notice, marshal, alarm, evac, clear, end)
  THE ALARM    `horn3` is not a one-shot but a BED that runs from its cue to the next `hornstop` (title 2.5 to 5.45 s, alarm 0.9 to 20.95 s, evac 0.5 s to the next scene's clear 0.5 s): the
               temporal-three of a real electronic fire horn (about 520 Hz, square-ish, hard 5 ms edges, a ripple, a reflection either side), pulses 0.5 s on / 0.5 s off three times and 1.5 s
               off (period 4.0 s) counted from the cue: the picture's FX18.hornOn(k) and FX18.strobe(k) use the same pattern. DOOR-KEYED MUFFLING: the alarm's door events
               (build/ep18/door_events.json, absolute seconds; a fixed schedule if the file does not exist) step the horn's low-pass cut-off and level down with every door that shuts (8 k, 4.5 k,
               3 k, 2 k, 1.3 k, 850 Hz, 520 Hz; 1.5 dB a door; a 150 ms glide); in the evacuation (all six doors shut) it stays muffled and opens a little (1.2 k) while the line leaves through
               the fire door. The bed ducks under dialogue (and further under the overhead page); the doors' own slams, bonk and latches come from the same file.
  THE PAGE     the voice `pa` is a ceiling speaker (band-pass 350 to 3200 Hz, a little saturation, a 90 ms slap, the corridor's reverb, a faint hiss); `pachime` is its two-tone chime.
  THE CHIRP    a smoke detector's low battery: perfectly dry (no hall reverb, no dip), the last sounds of the film.
  THE QUIET    the alarm's `quiet` beat: the horn cut with a 60 ms tail, then room tone, one flickering fluorescent tube and a single cart-wheel squeak near 21.9 s (nothing else).

Usage: python3 build_audio18.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep18_sound] [--events build/ep18/events.json] [--phys build/ep18/phys_events.json]
                                [--doors build/ep18/door_events.json] [--publish]
  --publish   after the timeline matches build/ep18/timeline.json: copy audio.wav into build/ep18/ and encode audio.m4a
"""
import hashlib
import json
import os
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
from build_audio import SR, tarr, osc, ar, midi, expdecay
from build_audio6 import norm6, rng6, noise6
from build_audio7 import _smooth_rand, _sum
from build_audio10 import _nth, _burst, _thump, _ping
from build_audio13 import _place, _edge, _lp4, _hp4, _bp4, _tv_filter, _glide, _sin_of, _glass, _fade_end, _call_ding
from build_audio14 import _res, _band, _unit, _key

HERE = A6.HERE
SCRIPT = "script_ep18.json"
FXV = "18.2"             # bump to rebuild every treated voice line


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

    def __new__(cls, mono, alt=None):
        o = np.asarray(mono, dtype=float).view(cls)
        o.alt = alt
        return o

    def __array_finalize__(self, o):
        self.alt = getattr(o, "alt", None)

    def __array_wrap__(self, out, context=None, return_scalar=False):
        out = np.asarray(out)
        return out[()] if out.ndim == 0 else out

    def __mul__(self, k):
        k = float(k)
        return _Vox(np.asarray(self) * k, None if self.alt is None else self.alt * k)

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


def fx_arti(x, seed, glitch_t=None, drops=1):
    """Mr. Artichoke on a laggy video call. The voice stays deep and smooth (that is the joke) but the call shows through: band-limited to 85 Hz .. 5.2 kHz, a faint codec comb (1.3 ms),
    a soft saturation, a jitter buffer that wanders (0.25 ms at 0.7 Hz and 0.1 ms at 5 Hz), a faint hiss, and the damage: a held vowel (a 20 ms grain of a voiced stretch looped for 60 to 90
    ms: the robot hold of packet-loss concealment) and, in a pause between words, a dropout with a click. Where the script has a glitch cue the line stutters there (the 60 ms before it,
    twice, bit-crushed) so the picture's freeze is heard. Nothing is removed from the middle of a word."""
    n = len(x)
    r = rng6(seed)
    y = _bp4(x, 85, 5200, 2)
    y = y + _delay(y, 1.3, .09)
    pk = np.max(np.abs(y)) + 1e-9
    y = np.tanh(1.5 * y / pk) * pk / 1.2
    y = _wobble(_wobble(y, .00025, .7), .0001, 5.0, 1.3)
    y = y + _hp4(rng6(seed + 7).uniform(-1, 1, n), 3000) * .0025 * pk
    env = _env10(y)
    nf = len(env)
    strong = np.where(env > .55 * env.max())[0]
    strong = strong[(strong > 15) & (strong < nf - 25)]
    quiet = np.where(env < .09 * env.max())[0]
    quiet = quiet[(quiet > 12) & (quiet < nf - 12)]
    spans = []
    if glitch_t is not None:
        g0 = int(glitch_t * SR)
        grain = y[max(0, g0 - int(.06 * SR)):g0].copy()
        if len(grain) > 100:
            crushed = np.round(grain / pk * 28) / 28 * pk
            hold = np.repeat(crushed[::5], 5)[:len(grain)]
            k = len(grain)
            for j, src in enumerate((crushed, hold)):
                a0 = g0 + j * k
                m = min(k, n - a0)
                if m > 0:
                    fade = np.minimum(1, np.minimum(np.arange(m) / 90, (m - np.arange(m)) / 90))
                    y[a0:a0 + m] = src[:m] * fade + y[a0:a0 + m] * (1 - fade) * 0
            spans.append((glitch_t, glitch_t + .15))
    hops = 480
    for _ in range(1 if n / SR > .7 else 0):                      # a held vowel
        cand = [f for f in strong if all(abs(f * hops / SR - a) > .3 and abs(f * hops / SR - b) > .3 for a, b in spans)]
        if cand:
            f = int(r.choice(cand))
            i0 = f * hops
            gr = y[i0:i0 + int(.02 * SR)].copy()
            L = int(r.uniform(.06, .09) * SR)
            rep = np.tile(gr, L // len(gr) + 1)[:L]
            w = np.minimum(1, np.minimum(np.arange(L) / 120, (L - np.arange(L)) / 120))
            m = min(L, n - i0)
            y[i0:i0 + m] = rep[:m] * w[:m] + y[i0:i0 + m] * (1 - w[:m])
            spans.append((i0 / SR, i0 / SR + L / SR))
    for _ in range(drops if n / SR > 1.2 else 0):                 # a dropout in a pause
        cand = [f for f in quiet if all(abs(f * hops / SR - a) > .25 and abs(f * hops / SR - b) > .25 for a, b in spans)]
        if cand:
            f = int(r.choice(cand))
            i0 = f * hops
            L = int(.05 * SR)
            m = min(L, n - i0)
            w = np.minimum(1, np.minimum(np.arange(m) / 100, (m - np.arange(m)) / 100))
            y[i0:i0 + m] *= 1 - w
            y[i0:i0 + 40] += r.uniform(-1, 1, len(y[i0:i0 + 40])) * .02 * pk
            spans.append((i0 / SR, i0 / SR + L / SR))
    return _match_active_rms(y, x)


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


def fx_broc(x):
    """Broccoli: booming and jolly. A low shelf (+4 dB under 180 Hz), a little warmth (soft saturation) and a touch of chest at 400 Hz."""
    y = x + .55 * _lp4(x, 180, 2) + .25 * _bp4(x, 300, 520, 1)
    pk = np.max(np.abs(y)) + 1e-9
    y = np.tanh(1.3 * y / pk) * pk / 1.1
    return _match_active_rms(y, x)


def fx_pa(clean, ref, seed):
    """The overhead page (Episode 18): a ceiling speaker in a long corridor. `clean` is the plain voice (trimmed and normalised, 0.25 s shorter than `ref`, the plain page that the timeline
    was measured on); the result has exactly the length of `ref`. A band-pass from 350 Hz to 3.2 kHz (a cheap horn driver), two cone resonances (1.15 and 2.7 kHz), a mild saturation (the
    amplifier), a slap echo 90 ms behind it (the far wall) and a second, fainter one at 175 ms, the corridor's own reverb (0.9 s, darker than the voice) and a faint hiss that rides the page
    (an open line: it starts 100 ms before the voice and stays 150 ms after it)."""
    n = len(ref)
    x = np.zeros(n)
    m = min(len(clean), n)
    x[:m] = clean[:m]
    y = _bp4(x, 350, 3200, 2)
    y = y + .3 * _res(y, 1150, 3.0) + .14 * _res(y, 2700, 4.0)
    pk = np.max(np.abs(y)) + 1e-9
    y = np.tanh(1.9 * y / pk) * pk / 1.3
    y = _bp4(y, 330, 3400, 1)                                  # the saturation puts lows back: the driver cannot play them
    side = _bp4(y, 420, 2600, 1)
    y = y + _delay(side, 90, .3) + _delay(side, 175, .12)
    r = rng6(seed + 5)
    nir = int(.95 * SR)
    t = np.arange(nir) / SR
    ir = _bp4(r.uniform(-1, 1, nir) * np.exp(-6.9 * t / .9), 300, 3600, 1)
    ir[:int(.012 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    y = y + signal.fftconvolve(y, ir)[:n] * .22
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    on = uniform_filter1d((env > .02 * env.max()).astype(float), int(.25 * SR) | 1)
    on = np.clip(on * 3.0, 0, 1)
    y = y + _bp4(r.uniform(-1, 1, n), 2500, 7000, 1) * on * .0035 * pk
    k = int(.03 * SR)
    y[-k:] *= np.linspace(1, 0, k)
    return _match_active_rms(y, ref) * 1.41          # +3 dB: the mixer already places the page 5 dB under the other voices, and it speaks over the horn


def fx_marshal(x, seed):
    """Fire Marshal Pomegranate (bm_daniel, deadpan): the voice is a clean baritone, so he gets a little gravel. A chest shelf (+3 dB under 220 Hz), a roughness (the level jitters by up to 20
    percent at about 65 Hz: a worn vocal cord, not a growl), a soft saturation for the grit, and the very top rolled off by 2 dB (forty years of sirens)."""
    n = len(x)
    y = x + .5 * _lp4(x, 220, 2)
    rough = _bp4(rng6(seed).uniform(-1, 1, n), 40, 95, 1)
    rough = rough / (np.max(np.abs(rough)) + 1e-9)
    y = y * (1 + .2 * rough)
    pk = np.max(np.abs(y)) + 1e-9
    y = np.tanh(1.6 * y / pk) * pk / 1.2
    y = y - .2 * _hp4(y, 5500, 2)
    return _match_active_rms(y, x)


_PAN6 = (-.8, -.45, -.15, .15, .45, .8)
_DLY6 = (0, 7, 3, 11, 5, 9)


def fx_chor(kokoro, v, say, mono, tag, pans=None):
    """Six Strawberries, six real voices (the script's own list), each from the same line, a little detuned in speed (as the plain chorus is), spread from far left to far right, each a few
    milliseconds apart as a crowd is, then trimmed exactly as the plain clip was. Returns a (2, len(mono)) clip. `pans`: the spread (the residents' four voices sit in a narrower arc)."""
    pans = pans or _PAN6
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
    st = np.zeros((2, L + 600))
    for i, p in enumerate(parts):
        q = p / np.max(np.abs(p))
        summ[:len(q)] += q
        th = (pans[i % len(pans)] + 1) * np.pi / 4
        d = int(_DLY6[i % 6] * SR / 1000)
        st[0, d:d + len(q)] += q * np.cos(th)
        st[1, d:d + len(q)] += q * np.sin(th)
    st = st[:, :L]
    a = np.abs(BA.semis_resample(summ, v.get("semis", 0)))
    idx = np.where(a > .01 * a.max())[0]
    lo, hi = max(0, idx[0] - 800), idx[-1] + 2400
    out = st[:, lo:hi]
    n = len(mono)
    if out.shape[1] < n:
        out = np.pad(out, ((0, 0), (0, n - out.shape[1])))
    out = out[:, :n]
    return _match_active_rms(out, mono)


# ---------------------------------------------------------------- the per-line cache (build/ep18_sound/voice/)
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
    """The mixer's tts6, replaced: the plain line (cached per line), plus the treated version that is placed in the mix (same length, always)."""
    k = _TTS_K[0]
    _TTS_K[0] += 1
    sc, b = _SPEECH[k] if k < len(_SPEECH) else (None, None)
    if b is None or b.get("say") != say:
        return _Vox(_TTS_ORIG[0](kokoro, v, say), None)
    tag = f"{sc}_{b['id']}"
    raw_key = hashlib.sha1(json.dumps([v, say, "raw"], sort_keys=True).encode()).hexdigest()[:16]
    mono = _vox_cache(tag + ".raw", raw_key, lambda: _TTS_ORIG[0](kokoro, v, say))
    who = b["who"]
    if who not in ("bind", "onion", "chor", "pa", "marshal", "rall"):
        return _Vox(mono, None)
    glitch = [c[1] for c in b.get("sfx", []) if c[0] == "glitch" and isinstance(c[1], (int, float))]
    menace = who == "bind" and say.startswith("Great!")
    key = hashlib.sha1(json.dumps([raw_key, who, FXV, glitch, menace]).encode()).hexdigest()[:16]
    seed = int(hashlib.sha1(tag.encode()).hexdigest()[:6], 16)

    def make():
        if who == "bind":
            return fx_bind(mono, menace)
        if who == "onion":
            return fx_onion(mono, seed)
        if who == "marshal":
            return fx_marshal(mono, seed)
        if who == "pa":
            clean = _TTS_ORIG[0](kokoro, dict(v, fx=None), say)       # the plain voice, without the registry's own page filter
            return fx_pa(clean, mono, seed)
        if who == "rall":
            return fx_chor(kokoro, v, say, mono, tag, pans=(-.55, -.18, .18, .55))
        return fx_chor(kokoro, v, say, mono, tag)
    return _Vox(mono, _vox_cache(tag + ".fx", key, make))


# ---------------------------------------------------------------- place2, patched: voices place their treated version; cues dip under speech
DUCK_DB = {   # how far a cue is dipped (dB) while a voice speaks, by effect name; anything missing here is not dipped. The hits the picture lands on are never dipped.
    "peel": 11, "heartbeat": 9, "typing": 8, "keyboard": 8, "sniffle": 8, "sob": 6, "spinner": 7, "counter": 7, "flip": 7, "cranemotor": 9, "cablecreak": 7, "groan": 8,
    "rumble": 8, "sink": 6, "banner": 6, "crowd": 6, "fillpop": 7, "poof": 6, "phys": 12, "step": 7, "grin": 8, "dialog": 7, "glitch": 5, "stars": 7, "cablewhip": 5, "error": 5,
    "yulecrackle": 9, "wheelchair": 4, "printer": 3, "boots": 3,                      # Episode 18: the fire's crackle is a bed (the TV is behind the talk), the rest only a little
}
NOREV = ("chirp", "roomtone", "horn3")      # Episode 18: cues that never go through the scene's reverb (the smoke detector's chirp stays perfectly dry; a room tone is already a room; the horn bed has its own room baked in)
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


def reverb_18(seg, room):
    """The mixer's per-scene room (A6.reverb) minus the cues that must stay dry: their direct sound is in `seg`, their reverb is not added. `seg` is a view of the mixer's dry buffer, so
    its offset in that buffer is read from the memory address (the mixer calls the room scene by scene, dry[:, a:b])."""
    dry, nr = _DRY
    if nr is not None and seg.base is dry:
        a = (seg.__array_interface__["data"][0] - dry.__array_interface__["data"][0]) // dry.itemsize
        sub = nr[:, a:a + seg.shape[1]]
        if sub.shape == seg.shape and np.any(sub):
            return _REVERB6(seg - sub, room)
    return _REVERB6(seg, room)


def place2_15(buf, clip, at, gain=1.0, pan=0.0):
    if _DRY[0] is None:                                  # the mixer places the voices into `dry` first
        _DRY[0] = buf
        _DRY[1] = np.zeros_like(buf)
    if isinstance(clip, _Vox):
        _WIN[round(float(at), 4)] = (float(at), len(clip) / SR)
        alt = clip.alt
        _PLACE2(buf, np.asarray(clip) if alt is None else alt, at, gain, pan)
        return
    name = getattr(clip, "sfx", None) or "step"
    if name in NOREV and buf is _DRY[0]:
        _PLACE2(_DRY[1], np.asarray(clip), at, gain, pan)
    db = DUCK_DB.get(name)
    if db and _WIN:
        i = int(round(at * SR))
        n = min(clip.shape[-1], buf.shape[1] - i)
        if n > 0:
            sm = _speech_gate(buf.shape[1])[i:i + n]
            clip = np.asarray(clip)[..., :n] * (1 - (1 - 10 ** (-db / 20)) * sm)
    _PLACE2(buf, np.asarray(clip), at, gain, pan)


# ================================================================ the sheet: clicks, the merge, dialogs, keys
def _remote_click(k):
    """A television remote's button (0.14 s): a soft rubber dome going over ('tk': a 1.6 kHz tick of 4 ms) and its plastic body ('tok': a 700 Hz knock, 12 ms), a hair of the battery cover rattling."""
    x = np.zeros(_n(.16))
    t = tarr(.05)
    _place(x, _band(1590, .05, 900, 5000) * expdecay(.05, .003) * .7 + np.sin(2 * np.pi * 1600 * t) * np.exp(-t / .004) * .5, 0.0, 1.0)
    _place(x, np.sin(2 * np.pi * 700 * t) * np.exp(-t / .012) * .5 + _band(1591, .05, 300, 1600) * expdecay(.05, .01) * .4, .004, 1.0)
    _place(x, _band(1592, .02, 1500, 4000) * expdecay(.02, .004) * .12, .07, 1.0)
    return norm6(_edge(x, .0003, .03), .6)


def _panel_click(k):
    """The SILENCE button on the fire alarm panel (0.2 s): a firm membrane pushbutton ('clack': a 2.2 kHz tick and a 900 Hz body, 6 ms) and, 35 ms later, the panel's piezo acknowledging it (a 2.7 kHz pip, 70 ms)."""
    x = np.zeros(_n(.22))
    t = tarr(.05)
    _place(x, _band(1595, .05, 1200, 6500) * expdecay(.05, .0028) * .8 + np.sin(2 * np.pi * 2200 * t) * np.exp(-t / .005) * .5 + np.sin(2 * np.pi * 900 * t) * np.exp(-t / .01) * .5, 0.0, 1.0)
    d = .07
    tt = tarr(d)
    _place(x, np.sin(2 * np.pi * 2700 * tt) * np.minimum(1, np.minimum(tt / .002, (d - tt) / .004)) * .45, .035, 1.0)
    return norm6(_edge(x, .0003, .05), .65)


def sfx_click():
    """A crisp mouse click, two tones: the button going down (a bright tick at 2.1 kHz with a burst of 1.8 to 7 kHz) and, 68 ms later, the button coming back up (softer, lower, 1.35 kHz).
    Each call is a hair different (pitch within 4 percent)."""
    k, scene, i = _ctx("click")
    if scene == "evac":
        return _remote_click(k)
    if scene == "clear":
        return _panel_click(k)
    r = rng6(1500 + k)
    s = 1 + .04 * r.uniform(-1, 1)
    x = np.zeros(_n(.14))
    for j, (at, f, g, lo, hi) in enumerate(((0.0, 2100 * s, 1.0, 1800, 7000), (.068, 1350 * s, .5, 1000, 4500))):
        t = tarr(.03)
        c = _band(1510 + 3 * k + j, .03, lo, hi) * expdecay(.03, .0016) * .8 + np.sin(2 * np.pi * f * t) * np.exp(-t / .0045) * .6
        _place(x, c, at, g)
    return norm6(_edge(x, .0003, .02), .7)


def sfx_merge():
    """Merge & Center (1.5 s): the cell borders snap together in a soft ratchet (four clicks climbing, 0 to 0.1 s), the cells slide and join (a glide from 330 to 990 Hz with a breath of
    air, 0.05 to 0.4 s), the join lands on a soft 'thock' and a bright chime (E6, G6, C7 and a glint of G7, 0.36 s: the same F-to-C resolution the music lands on); the announce's merge is
    a little fuller (a low C5 under the chime and one more glint)."""
    k = _nth("merge")
    x = np.zeros(_n(1.6))
    for j, at in enumerate((0.0, .034, .068, .102)):
        t = tarr(.02)
        _place(x, _band(1600 + j, .02, 1500 + 280 * j, 6500) * expdecay(.02, .0013) * .8 + np.sin(2 * np.pi * (1800 + 260 * j) * t) * np.exp(-t / .003) * .5, at, .5 + .12 * j)
    gd = .36
    t = tarr(gd)
    f = _glide(330, 990, gd)
    sw = np.sin(np.pi * np.clip(t / gd, 0, 1)) ** 1.4
    _place(x, (_sin_of(f) + .3 * _sin_of(2 * f)) * sw * .5 + _band(1610, gd, 2200, 7500) * sw * .12, .05, .9)
    land = .37
    _place(x, _sum(_thump(150, 70, .12, .03) * .8, _band(1611, .04, 300, 1500) * expdecay(.04, .008) * .5), land - .01, .6)
    for fq, g, tau in ((1318.5, 1.0, .6), (1568.0, .8, .55), (2093.0, .7, .5), (3136.0, .3, .3)):
        _place(x, _glass(fq, 1.2, tau, .0025), land, g * .45)
    if k > 0:
        _place(x, _glass(523.25, 1.3, .7, .003), land, .55)
        _place(x, _glass(4186.0, .5, .2, .002), land + .09, .12)
    return norm6(_edge(x, .0003, .25), .8)


def sfx_dialog():
    """A warning chime (0.9 s): the faint thud of a modal dialog opening (a 150 Hz thock and a soft tick), then two bell notes falling a major third, E6 and C6 (0.15 s apart), soft
    enough to be plastic-friendly. The warning is polite; it is still a warning."""
    x = np.zeros(_n(1.0))
    _place(x, _sum(_thump(190, 85, .07, .016) * .5, _band(1620, .03, 400, 1800) * expdecay(.03, .006) * .5), 0.0, .7)
    _place(x, _call_ding(1318.5, .2), .02, 1.0)
    _place(x, _call_ding(1046.5, .32), .17, .9)
    return norm6(_edge(_lp4(x, 7000, 2), .0004, .12), .75)


def sfx_callconnect():
    """A video-call join chime (0.9 s): three soft rising blips (A5, E6, A6: triangle waves through a low-pass, 0.11 s apart) over a breath of room opening up."""
    x = np.zeros(_n(1.0))
    for j, f in enumerate((880.0, 1318.5, 1760.0)):
        d = .22 if j < 2 else .5
        t = tarr(d)
        tri = osc("tri", f, d) + .25 * osc("sine", 2 * f, d)
        _place(x, _lp4(tri, 3200, 2) * np.exp(-t / (.07 if j < 2 else .2)) * np.minimum(1, t / .006), .11 * j, .8 if j < 2 else 1.0)
    _place(x, _band(1630, .5, 800, 4500) * np.sin(np.pi * np.clip(tarr(.5) / .5, 0, 1)) * .04, 0.0, 1.0)
    return norm6(_edge(x, .0005, .2), .7)


def sfx_spinner():
    """A loading spinner (0.6 s): eight tiny blips 65 ms apart whose pitch walks round a circle (1.0 to 1.8 kHz and back, 12 ms each, a soft tick on the front), the last two fading."""
    x = np.zeros(_n(.65))
    for j in range(8):
        f = 1400 + 400 * np.sin(2 * np.pi * j / 8)
        t = tarr(.025)
        _place(x, np.sin(2 * np.pi * f * t) * np.exp(-t / .008) + _band(1640 + j, .025, 3000, 8000) * expdecay(.025, .0015) * .3, .065 * j, 1.0 if j < 6 else .6 - .2 * (j - 6))
    return norm6(_edge(x, .0004, .04), .6)


def sfx_glitch():
    """A digital stutter (0.55 s): 80 ms of buzzing voice-like noise (a 190 Hz saw and a band of noise) repeated four times, each repeat held at 8 kHz / 24 kHz and crushed to
    4 bits, then a 90 Hz-chopped square buzz at 1.7 kHz that falls away: a call that has given up."""
    k = _nth("glitch")
    t = tarr(.08)
    base = (osc("saw", 190, .08) * .5 + _band(1650 + k, .08, 500, 3500) * .5) * np.sin(np.pi * np.clip(t / .08, 0, 1)) ** .5
    x = np.zeros(_n(.6))
    for j in range(4):
        q = 2 ** (4 + 0)
        c = np.round(base * q) / q
        c = np.repeat(c[::(2 + j)], 2 + j)[:len(base)]
        _place(x, c, .08 * j, 1.0 - .1 * j)
    d = .2
    t = tarr(d)
    buzz = np.sign(np.sin(2 * np.pi * 1700 * t)) * (np.sign(np.sin(2 * np.pi * 90 * t)) * .5 + .5) * np.exp(-t / .07)
    _place(x, _lp4(buzz, 5000, 2) * .5, .33, 1.0)
    return norm6(_edge(x, .0004, .05), .7)


def sfx_keyboard():
    """A laptop keyboard (0.65 s): ten strokes in two bursts (the consultants typing up the optimization), each a soft thock and a click, a space bar between the bursts, closed off at 4.5 kHz."""
    r = rng6(1660)
    x = np.zeros(_n(.7))
    t = .02
    for i in range(10):
        g_ = r.uniform(.45, 1.0)
        _place(x, _key(1661 + i, i == 5), t, g_)
        _place(x, _band(1675 + i, .012, 2500, 7000) * expdecay(.012, .0015), t, g_ * .35)
        t += r.uniform(.045, .085) + (.08 if i == 4 else 0)
    return norm6(_edge(_lp4(x, 4500, 2), .001, .05), .6)


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


def sfx_error():
    """A UI error (0.45 s): a low, flat two-tone, nothing like the harsh one. Two soft rounded squares, G4 then E-flat4 (a falling minor third, 0.14 s each), through a low-pass at 1.6 kHz with
    a muffled thud under the first. The second cue (Ctrl+Z refused) is a little lower and longer."""
    k, scene, i = _ctx("error")
    lo = 1 if (scene in ("close", "quiz")) else 0
    f1, f2 = (392.0, 311.1) if not lo else (349.2, 277.2)
    d = .17 + .06 * lo
    x = np.zeros(_n(.5 + .1 * lo))
    for j, (f, at) in enumerate(((f1, 0.0), (f2, .15 + .03 * lo))):
        t = tarr(d)
        sq = osc("square", f, d) * .5 + osc("sine", f, d)
        _place(x, _lp4(sq, 1600, 2) * np.exp(-t / (.09 + .03 * lo)) * np.minimum(1, t / .004), at, 1.0)
    _place(x, _thump(120, 70, .06, .02) * .5, 0.0, 1.0)
    return norm6(_edge(x, .0005, .1), .7)


def sfx_counter():
    """A rapid ticking counter that climbs in pitch for 4 seconds: ticks that start at 7 a second and end at 40, each a 5 ms blip whose pitch walks up from 700 Hz to 2.4 kHz with a
    click on the front, getting louder, and under them a thin sine that rises with the count; it ends a little before 4 s with a last tick and nothing."""
    d = 4.0
    x = np.zeros(_n(d + .1))
    t, i = 0.0, 0
    while t < 3.85:
        u = t / 3.85
        f = 700 * 3.45 ** u
        g = .3 + .7 * u ** .8
        tt = tarr(.02)
        _place(x, np.sin(2 * np.pi * f * tt) * np.exp(-tt / .004) + _band(1680 + (i % 7), .02, 2500, 8000) * expdecay(.02, .0012) * .35, t, g)
        t += 1 / (7 + 33 * u ** 1.5)
        i += 1
    u = np.linspace(0, 1, _n(d + .1))
    sw = _sin_of(300 * 4 ** u) * np.interp(u, [0, .05, .9, 1], [0, .06, .14, 0])
    return norm6(_edge(x + sw, .0005, .06), .7)


def sfx_flip():
    """A split-flap board turning (0.55 s): fourteen tiny cards falling in a clatter that quickens (each a 3 ms plastic click and a 1.3 kHz tock), a larger card at the end. Every call
    has its own sequence of timings and pitches."""
    k = _nth("flip")
    r = rng6(1700 + k)
    x = np.zeros(_n(.6))
    t = .0
    for i in range(14):
        tt = tarr(.03)
        f = r.uniform(1100, 1700)
        _place(x, _band(1710 + 5 * k + i, .03, 1800, 7500) * expdecay(.03, .0013) * .7 + np.sin(2 * np.pi * f * tt) * np.exp(-tt / .006) * .55, t, r.uniform(.5, 1.0))
        t += .05 - .028 * (i / 13) + r.uniform(0, .008)
    tt = tarr(.06)
    _place(x, np.sin(2 * np.pi * 900 * tt) * np.exp(-tt / .014) * .8 + _band(1790 + k, .06, 600, 3000) * expdecay(.06, .006) * .6, t + .03, .9)
    return norm6(_edge(_lp4(x, 8000, 2), .0004, .05), .65)


def sfx_insertrow():
    """A row slid into a table (0.8 s): a slide (a band of air swept up 300 to 2400 Hz with a sine whine under it, 0.34 s) that ends in a click and a low thunk of the row seating (a 105 Hz
    body with a soft rap on top)."""
    x = np.zeros(_n(.8))
    d = .34
    t = tarr(d)
    sw = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2
    air = _tv_filter(noise6(d, 1720), _glide(300, 2400, d), 1.8, "bp") * sw
    _place(x, air * 1.8 + _sin_of(_glide(400, 900, d)) * sw * .15, .0, 1.0)
    _place(x, _band(1721, .03, 1800, 7000) * expdecay(.03, .0016) * 1.0, d, .9)
    _place(x, _sum(_thump(150, 70, .22, .06) * 1.0, _band(1722, .06, 300, 1400) * expdecay(.06, .01) * .8), d + .012, .9)
    return norm6(_edge(x, .001, .1), .8)


def sfx_fillpop():
    """One of the fill-down pops (0.25 s): a bright bubble (a sine that jumps up 1.6x in 30 ms) with a pluck on top (a triangle at the octave) and a tick; the n-th call is the n-th note
    of a major pentatonic that climbs from G4 over fifteen pops, so the sixteen clones arrive as a rising ripple."""
    k = _nth("fillpop")
    pent = (0, 2, 4, 7, 9)
    m = 67 + 12 * (k // 5) + pent[k % 5]
    f = midi(m)
    d = .26
    t = tarr(d)
    fr = f * (1 + .6 * (1 - np.exp(-t / .012)))
    bub = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / .045)
    pl = (osc("tri", 2 * f, d) * .35 + osc("sine", 3 * f, d) * .12) * np.exp(-t / .08)
    tick = _band(1730 + k, d, 3000, 9000) * expdecay(d, .0015) * .3
    return norm6(_edge(bub + pl + tick, .0003, .05), .6)


def sfx_textding():
    """A text ding (0.9 s): a soft two-note bell, E6 and, 90 ms later, B6, the way a title finishes typing itself."""
    x = np.zeros(_n(1.0))
    _place(x, _call_ding(1318.5, .22), 0.0, .9)
    _place(x, _call_ding(1975.5, .3), .09, .8)
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
    k, scene, i = _ctx("grin")
    return norm6(_edge(x, .0005, .25), .65) * (.3 if scene == "alarm" else 1.0)           # Episode 18: in the alarm's silence it is only a glint


def sfx_peel():
    """Artichoke's layers (1.1 s): a dry, papery, leafy rustle that crinkles (about forty tiny bursts of 2.5 to 8 kHz at random strengths, densest in the middle), two soft tears of fibre
    (a band of noise that slides from 4 kHz to 1.2 kHz in 130 ms with a 90 Hz flutter) and a handful of petals falling (six soft taps below 900 Hz, quieter and quieter). Gentle, and a
    little comic; nothing like a banana."""
    r = rng6(1810)
    d = 1.15
    x = np.zeros(_n(d))
    for i in range(44):
        at = d * .8 * (.5 + .5 * np.sin(np.pi * (r.uniform() - .5)))
        dd = r.uniform(.006, .02)
        _place(x, _band(1811 + i, dd, r.uniform(2500, 4000), r.uniform(5500, 9000)) * expdecay(dd, dd / 3), at, r.uniform(.15, .6))
    for at, dd in ((.18, .13), (.52, .15)):
        t = tarr(dd)
        tear = _tv_filter(noise6(dd, 1850 + int(at * 10)), _glide(4000, 1200, dd), 2.0, "bp") * (1 + .5 * np.sin(2 * np.pi * 90 * t)) * np.sin(np.pi * np.clip(t / dd, 0, 1)) ** .7
        _place(x, tear, at, .7)
    for j, at in enumerate((.62, .72, .81, .93, 1.0, 1.06)):
        tt = tarr(.05)
        _place(x, _lp4(noise6(.05, 1860 + j), 900, 2) * np.exp(-tt / .012) + np.sin(2 * np.pi * (180 - 8 * j) * tt) * np.exp(-tt / .015) * .4, at, .55 - .07 * j)
    return norm6(_edge(x, .001, .15), .6)


def sfx_heartbeat():
    """A tiny, fast heart (anxious): lub-dub at 150 a minute, pitched up (a 230 Hz thump that sags to 120 Hz in 40 ms with a clear tick on the front, then a smaller 270 Hz one 130 ms later).
    The announce's is 1.0 s (it must be gone before 'What changes?'); the closing's is 1.5 s and swells."""
    k, scene, i = _ctx("heartbeat")
    d = 1.0 if scene == "announce" else 1.5
    x = np.zeros(_n(d + .15))
    t = 0.0
    j = 0
    while t < d - .2:
        u = t / d
        g = (1.0 - .5 * u) if scene == "announce" else (.55 + .45 * np.sin(np.pi * u))
        tt = tarr(.1)
        _place(x, _sum(_sin_of(230 * (1 - .48 * (1 - np.exp(-tt / .02)))) * np.exp(-tt / .028), _band(1870 + j, .1, 900, 2600) * expdecay(.1, .004) * .7), t, g)
        tt = tarr(.08)
        _place(x, _sum(_sin_of(270 * (1 - .45 * (1 - np.exp(-tt / .02)))) * np.exp(-tt / .024), _band(1880 + j, .08, 900, 2600) * expdecay(.08, .003) * .4), t + .13, g * .6)
        t += .4
        j += 1
    return norm6(_edge(x, .001, .12), .6)


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


def sfx_sob():
    """Onion's sob (0.95 s), comic: 'hic, hic, uh-uh-uhhh': two hiccups (a 90 ms vowel at 400 Hz with a sharp glottal start) then a falling whimper (a vowel that slides 430 to 230 Hz
    over 0.4 s with an 8 Hz tremor), a snuffly inhale after. A saw through two formants, so it is voice-like and not a voice."""
    k = _nth("sob")
    x = np.zeros(_n(1.0))
    for j, at in enumerate((0.0, .17)):
        d = .09
        t = tarr(d)
        f = (400 - 30 * j) * (1 + .12 * np.exp(-t / .02))
        _place(x, _vowel(f, d, 520, 1250) * np.exp(-t / .05) * np.minimum(1, t / .004), at, .9)
    d = .45
    t = tarr(d)
    f = _glide(430, 230, d) * (1 + .03 * np.sin(2 * np.pi * 8 * t))
    _place(x, _vowel(f, d, 480, 1100) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .6 * (1 - .25 * (.5 + .5 * np.sin(2 * np.pi * 8 * t))), .36, 1.0)
    dd = .18
    t = tarr(dd)
    _place(x, _tv_filter(noise6(dd, 1920 + k), _glide(600, 1800, dd), 2.0, "bp") * np.sin(np.pi * np.clip(t / dd, 0, 1)) ** 1.4, .78, .35)
    return norm6(_edge(_lp4(x, 6000, 2), .002, .1), .6)


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


def sfx_bonk():
    """Two foreheads (0.7 s): a woody cartoon bonk. A hollow block (a sine that falls 540 to 300 Hz in 60 ms with a 2.4x partial and a bright knock of band-passed noise at 700 to 3500
    Hz), the thump of two heads (a 110 Hz body) and, after it, a loose springy 'doing' (a sine that wobbles 230 to 170 Hz at 14 Hz for 0.3 s)."""
    x = np.zeros(_n(.7))
    t = tarr(.35)
    f = 300 + 240 * np.exp(-t / .02)
    _place(x, _sin_of(f) * np.exp(-t / .06) + .7 * _sin_of(f * 2.4) * np.exp(-t / .03) + _band(1950, .35, 700, 3500) * expdecay(.35, .008) * 1.3, 0.0, 1.0)
    _place(x, _sum(_thump(130, 60, .2, .05) * 1.1, _band(1951, .02, 1500, 5000) * expdecay(.02, .002) * .8), 0.0, .8)
    d = .33
    t = tarr(d)
    f = _glide(230, 170, d) * (1 + .1 * np.sin(2 * np.pi * 14 * t) * np.exp(-t / .15))
    _place(x, (_sin_of(f) + .4 * _sin_of(2 * f)) * np.exp(-t / .1) * np.minimum(1, t / .004), .09, .4)
    return norm6(_edge(x, .0004, .1), .8)


def sfx_stars():
    """A tiny twinkle of stars circling (1.0 s): eight glass pings on the notes of a C major pentatonic (G6 to A7), 70 ms apart, circling from left to right and back (a stereo clip),
    each quiet and short, with a dizzy slide-whistle wobble underneath."""
    out = np.zeros((2, _n(1.1)))
    for j, m in enumerate((91, 93, 96, 98, 100, 98, 96, 93)):
        c = _glass(midi(m), .3, .08, .0015)
        pan = np.sin(2 * np.pi * j / 8) * .85
        th = (pan + 1) * np.pi / 4
        i0 = int((.07 * j) * SR)
        out[0, i0:i0 + len(c)] += c * np.cos(th) * (.8 - .05 * j)
        out[1, i0:i0 + len(c)] += c * np.sin(th) * (.8 - .05 * j)
    d = .7
    t = tarr(d)
    wob = _sin_of(1200 + 500 * np.sin(2 * np.pi * 3.2 * t) * np.exp(-t / .4)) * np.sin(np.pi * np.clip(t / d, 0, 1)) * .1
    out[0, :len(wob)] += wob
    out[1, :len(wob)] += wob
    return norm6(_edge(out, .0005, .2), .6)


def sfx_crowd():
    """Forty tired Strawberries (1.0 s): a low murmuring sigh. Twenty-four overlapping vowels (saws between 170 and 330 Hz, each through its own pair of formants) swell together and slump
    (every pitch falls 12 percent), over an exhaled breath of noise that falls from 2 kHz to 400 Hz. It must be gone before 'I'm one person.'"""
    r = rng6(1960)
    d = 1.0
    x = np.zeros(_n(d))
    for i in range(24):
        f0 = r.uniform(170, 330)
        dur = r.uniform(.5, .85)
        t = tarr(dur)
        f = f0 * (1 - .12 * t / dur)
        v = _vowel(f, dur, r.uniform(420, 650), r.uniform(950, 1500), 2.5)
        _place(x, v * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5, r.uniform(0, .25), r.uniform(.3, .6))
    t = tarr(d)
    x += _tv_filter(noise6(d, 1961), _glide(2000, 400, d), 1.2, "bp") * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * .6
    x *= np.interp(t, [0, .3, .65, 1.0], [0, 1, .75, 0])
    return norm6(_lp4(x, 3800, 2), .65)


def sfx_typing():
    """Typing, by cue. The consultants' laptop, short and soft (a thock and a click per stroke, closed off at 4.2 kHz): the model2 lookup (0.85 s: 'Strawberry', ten strokes and an Enter),
    the replace scene's two entries (1.0 s: 'break'; 1.45 s: 'pending', each ending on an Enter) and the end card's file name (1.5 s, steady, an Enter). Each stroke is a little
    different; the pace slows and speeds like a person looking at a screen."""
    k, scene, i = _ctx("typing")
    plan = {("count", 0): (.9, 9, .07), ("model2", 0): (.85, 10, .06), ("replace", 0): (1.0, 5, .1), ("replace", 1): (1.45, 7, .12), ("end", 0): (1.5, 14, .085)}.get((scene, i), (1.0, 8, .09))
    d, strokes, iv = plan
    r = rng6(1970 + k)
    x = np.zeros(_n(d + .1))
    t = .03
    for j in range(strokes):
        g_ = r.uniform(.5, 1.0)
        _place(x, _key(1971 + 11 * k + j, j == 6 and strokes > 10), t, g_)
        _place(x, _band(2000 + 13 * k + j, .012, 2500, 7000) * expdecay(.012, .0015), t, g_ * .35)
        t += iv * r.uniform(.75, 1.3) + (.05 if j in (3, 8) else 0)
    _place(x, _key(1990 + k) * 1.2, min(t + .04, d - .05), .9)
    _place(x, _thump(210, 110, .05, .015) * .4, min(t + .04, d - .05), .9)
    return norm6(_edge(_lp4(x, 4200, 2), .001, .04), .6)


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


def sfx_cranemotor():
    """A crane (variable length): a diesel with a firing rate of 26 Hz and an uneven beat (a saw through a 420 Hz low-pass and a noise pulsed with it), the knock of its injectors (a 400 to 2200
    Hz band pulsed at the firing rate, so a phone speaker has something to play), a winch whine (a sine near 480 Hz with its 2nd and 3rd, rising and falling with the load) and the drum's
    ratchet ticks. The first (1.1 s) is the engine catching and settling into idle, gone before Binder speaks; the second (3.6 s) is the lowering, the whine climbing, then easing, and
    cut dead as the building lands; the third (2.4 s, the row going in) is lighter."""
    k, scene, i = _ctx("cranemotor")
    d, whine = ((1.1, .5) if (scene == "dock" and i == 0) else (3.6, 1.0) if scene == "dock" else (2.4, .7))
    t = tarr(d)
    wob = 1 + .06 * np.sin(2 * np.pi * 1.3 * t) + .04 * np.sin(2 * np.pi * 3.7 * t + 1)
    fire = 26 * wob * np.interp(t, [0, .25, d], [1.5 if d < 2 else 1.2, 1.0, 1.0])
    ph = np.cumsum(fire) / SR
    eng = _lp4(2 * (ph % 1) - 1, 420, 2) * 1.0
    pulse = (1 + .6 * np.cos(2 * np.pi * ph)) * _lp4(noise6(d, 2100 + k), 300, 2) * 1.2
    knock = _band(2105 + k, d, 400, 2200) * (np.maximum(0, np.cos(2 * np.pi * ph)) ** 3) * 1.1
    wf = np.interp(t, [0, d * .45, d * .8, d], [430, 640 if whine > .6 else 520, 560, 500]) * (1 + .01 * np.sin(2 * np.pi * 7 * t))
    wn = _sin_of(wf) + .5 * _sin_of(2 * wf) + .3 * _sin_of(3 * wf)
    wamp = whine * .22 * np.interp(t, [0, d * .2, d * .85, d], [0, 1, 1, 1 if d > 3 else 0])
    x = (eng + pulse) * .7 + knock * .5 + wn * wamp
    rr = rng6(2110 + k)
    for a in np.arange(.15, d - .05, .2 + .05 * (k % 2)):
        _place(x, _band(2120 + int(a * 10), .01, 1500, 4500) * expdecay(.01, .002), a + rr.uniform(0, .03), .2 * whine)
    x *= np.interp(t, [0, .15, d - .1, d], [0, 1, 1, 0 if d < 3 else .9])
    if d > 3:
        x = _edge(x, .05, .02)
    return norm6(x, .7)


def sfx_cablecreak():
    """Steel cable under load (2.3 s): a stick-slip groan (a 105 Hz saw whose pitch jitters between 90 and 150 Hz, through a band that rises from 400 to 1200 Hz), three short squeals (2.0 to 2.8
    kHz glides with a tremble), strands popping (a dozen tiny 3 to 8 kHz ticks) and a swell of strain toward the end: the cable is not happy."""
    d = 2.3
    t = tarr(d)
    jit = _smooth_rand(d, 2200, 9) * 28
    f = 105 + jit + 12 * np.sin(2 * np.pi * 1.7 * t)
    gr = osc("saw", f, d) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 11 * t + 4 * _smooth_rand(d, 2201, 6))))
    gr = _tv_filter(gr, _glide(420, 1200, d), 2.5, "bp") * 1.5 + _lp4(gr, 300, 2) * .5
    x = gr * np.interp(t, [0, .3, 1.6, 2.1, d], [.1, .5, .8, 1.0, .1])
    for at, dd, a, b in ((.5, .22, 2000, 2500), (1.25, .18, 2300, 2800), (1.85, .3, 2100, 2700)):
        tt = tarr(dd)
        sq = _sin_of(np.interp(tt, [0, dd], [a, b]) * (1 + .02 * np.sin(2 * np.pi * 30 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1))
        _place(x, sq, at, .12)
    x += _hit_train(2210, d, 14, 3000, 8000, .003, .12, .3, .2, 2.2)[0]
    return norm6(_edge(_lp4(x, 7000, 2), .01, .08), .65)


IMPACT_PEAK = .65    # the dock impact's peak (before the mixer's gain): tuned from the measured build so the finished file peaks near 0.70 there and the master limiter never touches it


def _squash(x, thr, rel=.1, look=.004):
    """A look-ahead compressor for a stereo clip: peaks over `thr` are pulled down by a gain that follows the envelope (instant attack over `look`, release `rel`), so the body of a hit is as
    loud as its crack. It works on the envelope, not the waveform (the release is long against a bass cycle), so it does not distort the boom."""
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    p = maximum_filter1d(np.abs(x).max(axis=0), int(look * SR) * 2 + 1)
    a = np.exp(-1 / (rel * SR))
    env = np.empty_like(p)
    e = 0.0
    for i in range(len(p)):
        e = p[i] if p[i] > e else e * a
        env[i] = e
    g = uniform_filter1d(np.minimum(1.0, thr / np.maximum(env, 1e-9)), int(look * SR) | 1)
    return x * g


def sfx_dockimpact():
    """THE BIG ONE (5.0 s, stereo): a building lands on a roof. A contact crack (1.5 to 9 kHz, 12 ms), a boom that falls from 133 Hz to 48 Hz over 0.75 s with a second body, a sub at 27 Hz
    underneath, the crunch of concrete (a 900 Hz low-passed body, 0.22 s) and timber (six resonant snaps between 500 and 1500 Hz in the first 0.6 s), a metal ring (inharmonic partials from
    310 Hz, ringing 1.2 s), gravel and debris scattered across the stereo field for four seconds and a rumble of the floor settling. The energy is in the low end but not in the very
    lowest octave (phones play 50 Hz and not 30), and the sum is shaped for loudness without clipping: an envelope compressor that only holds the top 3 dB (threshold 0.5 of the peak, release 80 ms, so the
    boom still decays: 3.4 dB down at 0.4 s, 10 dB at 1.0 s) and a gentle soft knee (tanh at drive 1.2), then set to IMPACT_PEAK. Measured alone at the same peak it is 3 LU louder (momentary) than a plain sum of the parts; in the film it is the loudest momentary block by 2 LU."""
    d = 5.0
    t = tarr(d)
    f = 48 + 85 * np.exp(-t / .18)
    boom = _sin_of(f) * np.exp(-t / .75) + .55 * _sin_of(62 + 120 * np.exp(-t / .12)) * np.exp(-t / .35) + .35 * _sin_of(2 * f) * np.exp(-t / .28) + .35 * np.sin(2 * np.pi * 27 * t) * np.exp(-t / 1.1)
    boom = np.tanh(1.1 * boom) / 1.1 * np.minimum(1, t / .003)
    body = _lp4(noise6(d, 2310), 900, 2) * np.exp(-t / .22) * 1.0 + _band(2311, d, 90, 450) * np.exp(-t / .5) * .9
    crack = _band(2312, d, 1500, 9000) * np.exp(-t / .012) * .9
    snaps = np.zeros(len(t))
    rr = rng6(2313)
    for a in (.03, .09, .17, .26, .38, .55):
        dd = .08
        sn = _band(2320 + int(a * 100), dd, rr.uniform(500, 800), rr.uniform(1000, 1500)) * expdecay(dd, .02) * 1.4
        _place(snaps, sn, a + rr.uniform(0, .02), rr.uniform(.4, .9))
    ring = sum(g * np.sin(2 * np.pi * 310 * r_ * t) * np.exp(-t / (tau)) for r_, g, tau in ((1.0, .35, 1.2), (2.32, .22, .8), (3.9, .15, .5), (5.7, .1, .3)))
    rumble = _lp4(noise6(d, 2330), 160, 2) * np.exp(-t / 1.4) * .9 * np.minimum(1, t / .05)
    wall = _band(2350, d, 220, 3500) * np.exp(-t / .3) * np.minimum(1, t / .004)
    mono = boom * 1.0 + body * .9 + crack * .6 + snaps * .7 + ring * .15 + rumble * .5 + wall * .5
    deb = _hit_train(2340, d, 90, 800, 6000, .006, .18, .04, .1, 4.2, 1.8)
    deb2 = _hit_train(2341, d, 14, 2500, 9000, .02, .1, .02, .15, 3.0, 1.3)
    out = np.stack([mono, mono]) + deb * .55 + deb2 * .4
    out *= np.interp(t, [0, 4.0, d], [1, 1, 0])[None, :]
    out = out / np.max(np.abs(out))
    out = _squash(out, .5, .08)
    out = np.tanh(1.2 * out / np.max(np.abs(out))) / np.tanh(1.2)
    out = _edge(out, .0002, .4)
    return out * (IMPACT_PEAK / np.max(np.abs(out)))


def sfx_groan():
    """The tower settling (2.7 s): structural groans in a long decay. Three stick-slip wooden groans (a saw that slides 64 to 46 Hz with jitter, through a 900 Hz low-pass, each shorter and
    quieter than the last, with a body formant at 250 to 700 Hz so they are heard on a phone), a steel answer to each (a saw near 110 Hz sliding down, through a narrow band) and the tink
    of a bolt letting go, over a low settle."""
    d = 2.7
    t = tarr(d)
    x = np.zeros(len(t))
    for j, (at, dd, g) in enumerate(((.0, .9, 1.0), (.8, .75, .7), (1.55, .65, .45))):
        tt = tarr(dd)
        fw = _glide(64 - 4 * j, 46 - 3 * j, dd) * (1 + .08 * _smooth_rand(dd, 2400 + j, 10))
        w0 = osc("saw", fw, dd) * (.55 + .45 * np.sign(np.sin(2 * np.pi * (9 + 2 * j) * tt)))
        w = _lp4(w0, 900, 2) * .7 + _tv_filter(w0, _glide(520, 330, dd), 2.2, "bp") * 1.6
        _place(x, w * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** .8, at, g * 1.1)
        fs = _glide(115 - 6 * j, 92 - 4 * j, dd * .8) * (1 + .05 * _smooth_rand(dd * .8, 2410 + j, 14))
        s_ = _tv_filter(osc("saw", fs, dd * .8), 700 + 200 * j, 5.0, "bp") * np.sin(np.pi * np.clip(tarr(dd * .8) / (dd * .8), 0, 1))
        _place(x, s_, at + .22, g * .5)
        _place(x, _glass(1500 - 150 * j, .35, .1, .001), at + .5 + .1 * j, .07 * g)
    x += _lp4(noise6(d, 2420), 90, 2) * np.exp(-t / 1.2) * .4
    return norm6(_edge(_lp4(x, 3000, 2), .02, .35), .7)


def sfx_cablewhip():
    """A loose cable whipping (0.8 s): a whistle that falls from 3.2 kHz to 1 kHz in 0.12 s into a crack (a 3 to 10 kHz burst, 3 ms) and a metallic ring-down (1.7 kHz, with the 2.76x
    partial), then two lesser lashes that whistle past, quieter, further off."""
    x = np.zeros(_n(.9))
    d = .12
    t = tarr(d)
    _place(x, _sin_of(_glide(3200, 1000, d)) * np.sin(np.pi * np.clip(t / d, 0, 1)) * .35 + _tv_filter(noise6(d, 2500), _glide(3500, 1200, d), 3.0, "bp") * .4, 0.0, 1.0)
    _place(x, _sum(_band(2501, .04, 3000, 10000) * expdecay(.04, .003) * 1.2, _lp4(noise6(.03, 2502), 800, 2) * expdecay(.03, .006) * .5), d, 1.0)
    _place(x, _ping(1700, .5, .12, (1.0, 2.76), (1.0, .35), (1.0, .5)) * .3, d, 1.0)
    for j, (at, g) in enumerate(((.3, .35), (.5, .2))):
        dd = .1
        tt = tarr(dd)
        _place(x, _sum(_sin_of(_glide(2600 - 400 * j, 900, dd)) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) * .3, _band(2510 + j, .02, 3000, 9000) * expdecay(.02, .004) * .6), at, g)
    return norm6(_edge(x, .0004, .15), .7)


def sfx_rumble():
    """A building rumbling (2.35 s), for the row going in: a bed of sub (30, 38 and 46 Hz sines that drift), a grinding of the floors that a phone can play (noise between 90 and 700 Hz
    fluttering at 9 Hz, and a mid growl of 150 to 450 Hz that swells) and a crumbling patter of fine gravel that grows; it swells for two seconds and is gone before the building stops."""
    d = 2.35
    t = tarr(d)
    x = sum(g * np.sin(2 * np.pi * np.cumsum(f0 * (1 + .04 * np.sin(2 * np.pi * r_ * t))) / SR) for f0, g, r_ in ((30, 1.0, .6), (38, .8, .9), (46, .55, 1.3)))
    fl = (.6 + .4 * np.sin(2 * np.pi * 9 * t + 3 * _smooth_rand(d, 2601, 4)))
    grind = _band(2602, d, 90, 700) * fl
    growl = _band(2603, d, 150, 450) * (.5 + .5 * np.sin(2 * np.pi * 5.5 * t + 2 * _smooth_rand(d, 2604, 3))) * np.interp(t, [0, d * .8, d], [.2, 1, .8])
    x = x * .45 + grind * 1.8 + growl * 1.4
    x += _hit_train(2610, d, 90, 500, 4000, .004, .05, .25, 0.2, d - .2, .8)[0] * 1.0
    x *= np.interp(t, [0, 1.8, 2.15, d], [.08, 1.0, .9, 0])
    return norm6(x, .75)


def sfx_sink():
    """The tower sinks one floor (1.5 s): a deep earth rumble that falls from 62 to 32 Hz, the crunch of soil (fine noise bursts between 200 and 1500 Hz, dense and then fewer: loud enough
    for a phone), a stone grinding (a band at 150 to 700 Hz chopped at 18 Hz, in the middle) and a soft settle at the end."""
    d = 1.5
    t = tarr(d)
    x = _sin_of(_glide(62, 32, d)) * np.interp(t, [0, .1, 1.1, d], [0, 1, .8, 0]) * .8 + _lp4(noise6(d, 2700), 120, 2) * .6 * np.interp(t, [0, .2, 1.2, d], [0, 1, .6, 0])
    x += _hit_train(2710, d, 90, 200, 1500, .01, .6, .2, 0.0, 1.3, 1.2)[0] * 1.6
    gr = _band(2720, d, 150, 700) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 18 * t + 2 * _smooth_rand(d, 2721, 5)))) * np.interp(t, [.2, .5, 1.0, 1.3], [0, 1, 1, 0])
    x += gr * 1.5
    x += _band(2722, d, 600, 3000) * np.interp(t, [0, .1, .6, 1.2], [0, .6, .3, 0]) * (.5 + .5 * np.sin(2 * np.pi * 23 * t)) * .5
    _place(x, _thump(75, 36, .3, .09), 1.18, .8)
    return norm6(_edge(x, .003, .1), .8)


def sfx_thud():
    """The tower stops (1.5 s): one very large, very low thud (a sine that falls 95 to 38 Hz, 0.16 s) with a wooden knock and a slap of concrete on top (a phone has something to play), a
    short groan as the frame takes the weight (a 58 Hz saw through 700 Hz, 0.5 s) and a patter of dust and small things coming down, fading."""
    k, scene, i = _ctx("thud")
    d = 1.5
    t = tarr(d)
    x = _sin_of(38 + 57 * np.exp(-t / .06)) * np.exp(-t / .22) * .9 + np.sin(2 * np.pi * 30 * t) * np.exp(-t / .5) * .4
    x += _lp4(noise6(d, 2800), 900, 2) * np.exp(-t / .1) * 1.5 + _band(2801, d, 700, 3500) * expdecay(d, .012) * 1.0 + _band(2802, d, 150, 500) * np.exp(-t / .15) * 1.2
    gd = .5
    tt = tarr(gd)
    _place(x, _lp4(osc("saw", _glide(60, 52, gd), gd) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 10 * tt))), 800, 2) * np.sin(np.pi * np.clip(tt / gd, 0, 1)) * .6, .12, 1.0)
    x += _hit_train(2810, d, 30, 800, 5000, .005, .2, .02, .1, 1.4, 1.0)[0] * .9
    return norm6(_edge(x, .0004, .3), .85)


def sfx_banner():
    """A big cloth banner unfurling in wind (1.5 s): a flapping whoosh (noise through a band that opens from 200 to 1400 Hz, chopped by a flap that runs at 7 to 13 Hz and is never even),
    the rope creaking once, and, at 1.05 s, a soft snap as the cloth comes taut (a 800 to 4000 Hz burst and a 90 Hz thump)."""
    d = 1.5
    t = tarr(d)
    flap = (.5 + .5 * np.sin(2 * np.pi * np.cumsum(7 + 6 * (t / d) + 1.5 * _smooth_rand(d, 2900, 3)) / SR)) ** 1.6
    air = _tv_filter(noise6(d, 2901), _glide(200, 1400, d), 1.1, "bp") * (.25 + .75 * flap)
    x = air * np.interp(t, [0, .2, .9, 1.1, d], [0, .6, 1.0, .5, .1])
    _place(x, _sin_of(_glide(310, 260, .25)) * np.sin(np.pi * np.clip(tarr(.25) / .25, 0, 1)) * .08, .45, 1.0)
    _place(x, _sum(_band(2902, .06, 800, 4000) * expdecay(.06, .012) * 1.2, _thump(120, 70, .15, .04) * .6), 1.05, .8)
    return norm6(_edge(x, .01, .2), .7)


# ================================================================ the Merge theme, the stinger, the stings
KEY = {0: 4, 1: 9}      # the Merge theme's transposition from C in semitones: the title in E major, the end card in A major (Episode 15 was C, 16 D, 17 F)
STEP18 = {0: .275, 1: .325}   # one eighth of the bar: the title's (0.2 to 2.4 s) lands on the pull, the end card's (0.1 to 2.7 s) on its own downbeat
LAND = ((84, 1.0, .9), (86, .8, .9), (91, .85, .6), (98, .4, .6), (72, .6, .9))               # the end card's landing chord (C-based MIDI note, level, decay): a suspended second (root, second, fifth)


def sfx_theme15():
    """The Merge theme's sparkle layer. TITLE (E major, 2.2 s, cut dead at 2.2 s: the pull): eight eighth-notes of an arpeggio (the tonic triad climbing and falling, a glockenspiel over a marimba, climbing in
    level) under a riser of air and a quick shimmer on the subdominant on the last half beat, and then nothing: the downbeat where the landing chord should be is the pull station's click (a 4 ms
    stop, so it is heard as an interruption). END CARD (A major, 4.7 s): the same run, then the landing on the downbeat 2.6 s in: an A suspended-second chord (A B E) that does not resolve."""
    k = _nth("theme15")
    kk = 1 if k > 0 else 0
    key, step = KEY[kk], STEP18[kk]
    L = 8 * step
    d = L if kk == 0 else L + 2.0
    x = np.zeros(_n(d + .2))
    arp = tuple(m + key for m in (72, 76, 79, 84, 79, 76, 79, 84))
    for i, m in enumerate(arp):
        g = .3 + .45 * i / 7
        _place(x, _glass(midi(m + 12), .45, .1, .001) * .5, i * step, g * .8)
        _place(x, _note(midi(m), .3, .09, ((1, 1.0), (4, .3), (10, .08))), i * step, g)
    t = tarr(L)
    _place(x, _tv_filter(noise6(L, 3000 + k), _glide(500, 6500, L), 1.2, "bp") * (t / L) ** 2 * .14, 0.0, 1.0)
    for m in (89 + key, 93 + key, 96 + key):
        _place(x, _glass(midi(m), .5, .12, .001), L - step * .5, .22)
    if kk == 1:
        for m, g, tau in LAND:
            _place(x, _glass(midi(m + key), 2.0, tau, .002), L, g * .4)
        _place(x, _note(midi(60 + key), 1.4, .5, ((1, 1.0), (2, .4), (3, .15))), L, .35)
        _place(x, _glass(midi(103 + key), .8, .25, .001), L + .04, .16)
    x = x[:_n(d)]
    return norm6(_edge(x, .0004, .004 if kk == 0 else .4), .75)


AVAIL_PENDING = {'quiz': 2.0}   # seconds from the stinger's cue to the end of its scene: the stinger is re-timed to end with the scene (the end card's theme starts right after)


def sfx_pending():
    """The stinger that ends the episode's joke (2.8 s, shorter where the scene ends sooner): two low notes (D2, then C-sharp2 a semitone under it: a trombone and a cello that do not want to
    be there) and, over the second, a held tone that rises like the end of a question and is never answered: a soft, hollow tone (a triangle with a trace of odd harmonics) that glides from A4
    up to a quarter tone short of B4, swells and is let go without arriving. Under it, a shiver of cymbal. All the times scale with the room the scene leaves (f), the pitches do not."""
    k, scene, i = _ctx("pending")
    f = min(1.0, AVAIL_PENDING.get(scene, 2.8) / 2.8)
    x = np.zeros(_n(2.8 * f))
    for at, fq, dd in ((0.0, 73.4, .55 * f), (.5 * f, 69.3, .9 * f)):
        t = tarr(dd)
        sw = osc("saw", fq, dd) + .6 * osc("saw", fq * 1.004, dd) + .5 * osc("sine", fq * 2, dd)
        _place(x, _lp4(sw, 520, 2) * np.minimum(1, t / .03) * np.exp(-t / (dd * .9)) * 1.1, at, .9)
    d = 2.1 * f
    t = tarr(d)
    fr = np.interp(t, np.array([0, .5, 1.4, 1.75, 2.1]) * f, [440.0, 441.0, 452.0, 478.0, 480.0]) * (1 + .006 * np.minimum(1, t / (1.2 * f)) * np.sin(2 * np.pi * 5.2 * t))
    tone = _sin_of(fr) * .8 + .25 * _sin_of(3 * fr) + .12 * _sin_of(5 * fr)
    env = np.interp(t, np.array([0, .35, 1.5, 1.85, 2.1]) * f, [0, .6, 1.0, .85, 0])
    _place(x, _lp4(tone, 2600, 2) * env, .55 * f, .5)
    tt = tarr(2.2 * f)
    _place(x, _band(3010, 2.2 * f, 5000, 11000) * np.interp(tt, [0, 1.1 * f, 2.2 * f], [0, 1, 0]) ** 2 * .06, .4 * f, 1.0)
    return norm6(_edge(x, .005, .5 * f), .75)


AVAIL_STING = {'marshal': 1.45}   # seconds of sting a scene can hold (its end plus 0.3 s of ring-over into the next scene); the others have 1.35 s and the 0.3 s of ring-over


def sfx_sting():
    """The series' stings, one fitted to each scene (1.0 to 1.5 s). notice (after 'Fire rises!'): an office DUN, a minor-seventh brass chord with a timpani and a call bell glint. marshal (after 'Now
    there is a slip hazard.'): a slip: a slide whistle that falls from 1.5 kHz to 190 Hz in 0.4 s, the soft thump of a body on foam, a rubbery 'doing' and a cheeky pizzicato plink. alarm (after 'The wrong
    one.'): a door DUN: a low D minor brass chord and a timpani with a steel door's clang and crack on the front (nothing is open any more). evac (after 'Unassigned.'): the deflating 'wah, wah, waaah'
    of Episode 15's 'Unassigned!' (a muted horn through a moving filter, three notes falling a semitone each). clear (after the last chirp): two tuba notes that sag, a 'womp, womp', quiet."""
    k, scene, i = _ctx("sting")
    v = {"notice": 1, "marshal": 5, "alarm": 6, "evac": 2, "clear": 0}.get(scene, k % 5)
    x = np.zeros(_n(1.5))
    if v == 0:
        for at, f in ((0.0, 116.5), (.3, 92.4)):
            dd = .5
            t = tarr(dd)
            sw = osc("saw", f * (1 - .03 * t / dd), dd) + .5 * osc("saw", f * 1.004, dd)
            _place(x, _lp4(sw, 1400, 2) * ar(dd, .02, .2) * 1.2, at, 1.0)
            _place(x, _band(3100 + int(at * 10), .03, 1500, 5000) * expdecay(.03, .004) * .4, at, 1.0)
    elif v == 1:
        _place(x, BA.brass_chord([48, 55, 58, 63], .3, 1500), 0.0, 1.0)
        _place(x, _thump(100, 40, .7, .2), 0.0, .6)
        _place(x, _glass(2960.0, .8, .25, .002), .02, .12)
    elif v == 2:
        for at, f, dd in ((0.0, 466.2, .24), (.27, 440.0, .24), (.55, 415.3, .7)):
            t = tarr(dd)
            ff = f * (1 - (.06 * t / dd if dd > .5 else 0)) * (1 + .01 * np.sin(2 * np.pi * 5.5 * t))
            sw = osc("saw", ff, dd)
            wah = _tv_filter(sw, 500 + 1500 * np.sin(np.pi * np.clip(t / dd, 0, 1)) ** .8, 3.0, "bp")
            _place(x, wah * ar(dd, .02, min(.2, dd * .5)) * 1.2, at, .8)
    elif v == 3:
        _place(x, BA.brass_chord([55, 60, 64, 67], .17, 1800), 0.0, .9)
        _place(x, BA.brass_chord([51, 58, 63, 66], .75, 1000) * np.interp(tarr(.75), [0, .05, .75], [0, 1, 0]), .2, 1.0)
        _place(x, _thump(110, 45, .5, .12), .2, .6)
        _place(x, _band(3130, .3, 3000, 9000) * expdecay(.3, .08) * .25, 0.0, 1.0)
    elif v == 5:
        d = .42
        t = tarr(d)
        f = _glide(1500, 190, d)
        sw = (_sin_of(f) + .3 * _sin_of(2 * f)) * np.interp(t, [0, .015, d * .85, d], [0, 1, .7, 0]) * (1 + .1 * np.sin(2 * np.pi * 7 * t))
        _place(x, sw * .7 + _tv_filter(noise6(d, 3150), f, 3.0, "bp") * .12, 0.0, 1.0)
        _place(x, _sum(_thump(105, 52, .3, .08) * 1.0, _lp4(noise6(.1, 3151), 700, 2) * expdecay(.1, .03) * .7), .43, .9)
        dd = .3
        tt = tarr(dd)
        _place(x, (_sin_of(_glide(250, 175, dd) * (1 + .1 * np.sin(2 * np.pi * 14 * tt) * np.exp(-tt / .12))) + .4 * _sin_of(_glide(500, 350, dd))) * np.exp(-tt / .1) * np.minimum(1, tt / .004), .5, .35)
        _place(x, _note(midi(88), .3, .08, ((1, 1.0), (3, .2), (6, .1))) * 1.0, .82, .3)
    elif v == 6:
        _place(x, BA.brass_chord([38, 45, 50, 53], .42, 1100) * np.interp(tarr(.42), [0, .015, .42], [0, 1, .25]), 0.0, 1.0)
        _place(x, _thump(72, 38, .9, .28), 0.0, .9)
        _place(x, _ping(310, 1.1, .32, (1.0, 2.32, 3.9, 5.7), (1.0, .5, .3, .2), (1.0, .55, .35, .2)) * .22, 0.0, 1.0)
        _place(x, _band(3160, .05, 600, 6500) * expdecay(.05, .006) * .7, 0.0, 1.0)
    else:
        _place(x, BA.brass_chord([36, 43, 48, 51, 55], .35, 1500) * np.interp(tarr(.35), [0, .02, .35], [0, 1, .3]), 0.0, 1.0)
        _place(x, _thump(90, 36, .9, .3), 0.0, .9)
        _place(x, _band(3140, .45, 3000, 9000) * np.interp(tarr(.45), [0, .006, .35, .45], [0, 1, .5, 0]) * .5, 0.0, 1.0)
    x = x[:_n(AVAIL_STING.get(scene, 1.6))]
    return norm6(_edge(x, .0005, .3), .8)


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
    """Vinyl tile over concrete (Episode 18's corridor): a short dry 'tak' (a 1.3 kHz knock that dies in 8 ms, a click of 800 Hz to 3.5 kHz) over a dull slab thud (90 Hz) and a faint ring."""
    d = .2 * ds
    t = tarr(d)
    return np.sin(2 * np.pi * 1300 * ps * t) * np.exp(-t / .008) + _band(seed, d, 800, 3500) * np.exp(-t / .004) * .8 + _sin_of((50 + 50 * np.exp(-t / .03)) * ps) * np.exp(-t / .05) * .6


_MV = {"tile": _m_tile, "paper": _m_paper, "leaf": _m_paper, "wood": _m_wood, "metal": _m_metal, "plastic": _m_plastic, "glass": _m_glass, "ceramic": _m_ceramic, "cardboard": _m_cardboard, "fabric": _m_fabric, "concrete": _m_concrete,
       "rubber": _m_rubber, "soil": _m_soil}


def sfx_phys():
    """One collision from the simulation (build/ep18/phys_events.json), 0.1 to 0.5 s, by the pair of materials 'a+b': each material has its own short voice (wood a knock at 360 Hz, metal a
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





# ================================================================ Episode 18: the frozen timeline, the cue times and the door table
_TL = {}
_ABS = {}
DOOR_PATH = [None]


def _timeline():
    """The frozen build/ep18/timeline.json (scene starts, beats and lines), read once."""
    if not _TL:
        p = os.path.join(HERE, "build/ep18/timeline.json")
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


FIXED_DOORS = (9.9, 10.5, 11.1, 11.7, 12.3, 12.9)      # alarm-scene seconds at which the six doors shut, used only when build/ep18/door_events.json does not exist
FIXED_DEPTH = (.95, .78, .6, .42, .25, .08)            # ... and how far each one is (1 = the far end of the corridor, 0 = at the camera)
FIXED_GAIN = (.5, .58, .68, .8, .9, 1.0)
FIXED_PAN = (.04, -.12, .16, -.22, .3, -.08)
DOOR = {"source": None, "slams": [], "latches": [], "states": []}


def _load_doors():
    """The alarm's door table. From build/ep18/door_events.json (absolute seconds; written by the ALARM builder from the same table the picture reads): the `doorslam` events, the
    `doorlatch` events and the horn's state after every slam (`hornstate`, doors shut so far; derived from the slams if the file has none). Without the file, a fixed schedule (the six doors at
    9.9 to 12.9 s of the alarm scene, 0.6 s apart). Returns DOOR = {source, slams: [event], latches: [event], states: [(t, doors shut)]}."""
    if DOOR["source"]:
        return DOOR
    path = DOOR_PATH[0] or os.path.join(HERE, "build/ep18/door_events.json")
    raw = []
    if os.path.exists(path):
        try:
            raw = json.load(open(path))
        except ValueError:
            raw = []
    slams = sorted((e for e in raw if e.get("name") == "doorslam"), key=lambda e: e["t"])
    if slams:
        DOOR["source"] = "file " + os.path.relpath(path, HERE)
        DOOR["slams"] = [{"t": float(e["t"]), "vol": float(e.get("gain", 1.0)), "pan": float(e.get("pan", 0)), "depth": float(e.get("depth", .5)), "door": int(e.get("door", i))}
                         for i, e in enumerate(slams)]
        DOOR["latches"] = [{"t": float(e["t"]), "vol": float(e.get("gain", .5)), "pan": float(e.get("pan", 0)), "depth": float(e.get("depth", .5)), "door": int(e.get("door", 0))}
                           for e in sorted((e for e in raw if e.get("name") == "doorlatch"), key=lambda e: e["t"])]
        st = sorted((float(e["t"]), int(e.get("closed", 0))) for e in raw if e.get("name") == "hornstate")
        DOOR["states"] = st or [(e["t"], i + 1) for i, e in enumerate(DOOR["slams"])]
    else:
        a0 = (_scene_info("alarm") or {"start": 77.479})["start"]
        DOOR["source"] = "fixed schedule (no door_events.json)"
        DOOR["slams"] = [{"t": round(a0 + FIXED_DOORS[i], 3), "vol": FIXED_GAIN[i], "pan": FIXED_PAN[i], "depth": FIXED_DEPTH[i], "door": i} for i in range(6)]
        DOOR["latches"] = []
        DOOR["states"] = [(e["t"], i + 1) for i, e in enumerate(DOOR["slams"])]
    return DOOR


def _duck_curve(t0, n, depth, depth_pa=None, lead=.06, hold=.14, ramp=.1):
    """A gain curve (n samples from absolute time t0) that dips a bed under every spoken line of the frozen timeline: `depth` dB under any voice, `depth_pa` under the overhead page (which is
    mixed 5 dB softer than the others and speaks over the horn), the dip starting `lead` s before the voice and ending `hold` s after it, edges `ramp` s long."""
    dep = np.zeros(n)
    for ln in _timeline()["lines"]:
        a, b = int((ln["s"] - lead - t0) * SR), int((ln["e"] + hold - t0) * SR)
        if b <= 0 or a >= n:
            continue
        d = depth_pa if (ln.get("who") == "pa" and depth_pa) else depth
        dep[max(0, a):min(n, b)] = np.maximum(dep[max(0, a):min(n, b)], d)
    k = int(ramp * SR) | 1
    dep = uniform_filter1d(uniform_filter1d(dep, k, mode="nearest"), k, mode="nearest")
    return 10 ** (-dep / 20)


# ================================================================ Episode 18: THE ALARM (the horn bed, its muffling, the stop, the page's chime)
HORN_F0 = 520.0
HORN_CUT = (8000.0, 4500.0, 3000.0, 2000.0, 1300.0, 850.0, 520.0)   # the low-pass cut-off (Hz) once 0, 1, ... 6 doors have shut
HORN_STEP_DB = 1.5                                                   # and the level (dB) that goes with every door
HORN_LEVEL = 1.2                                                     # the bed's peak at full brightness (before the mixer's cue gain and .6)
HORN_DUCK = {"title": 6, "alarm": 15, "evac": 12}                    # dB the bed dips under any voice, by scene
HORN_DUCK_PA = 24                                                    # ... under the overhead page


def _horn_tone(n, seed=0):
    """The horn's raw tone, n samples, mono, peak 1: two cones a hair apart (520 and 526 Hz: the 6 Hz flutter between them is the buzz) of a square-ish wave (odd harmonics at 1/k, a trace of the even
    ones: a diaphragm is never symmetrical) up to 9 kHz, a ripple in the level (97 Hz, 7 percent) and a breath of turbulence."""
    t = np.arange(n) / SR
    x = np.zeros(n)
    for j, (f, g, ph0) in enumerate(((HORN_F0, 1.0, 0.0), (HORN_F0 * 1.012, .22, 1.3))):
        ph = 2 * np.pi * f * t + ph0
        k = 1
        while f * k < 9000:
            x += g * (1.0 if k % 2 else .1) / k * np.sin(k * ph)
            k += 1
    x *= 1 + .07 * np.sin(2 * np.pi * 97 * t + 1.1)
    x += _bp4(rng6(seed + 31).uniform(-1, 1, n), 800, 6000, 1) * .04
    return x / np.max(np.abs(x))


def _pulse_gate(n, T):
    """The temporal-three gate for a bed of n samples whose horn clock starts at sample 0: pulses 0.5 s long at k = 0, 1, 2 s of every 4.0 s, 5 ms edges. T: the bed's length in seconds
    (the last pulse is cut where the bed ends)."""
    g = np.zeros(n)
    e = int(.005 * SR)
    cyc = 0
    while cyc * 4.0 < T:
        for p in (0.0, 1.0, 2.0):
            a, b = cyc * 4.0 + p, min(cyc * 4.0 + p + .5, T)
            if b <= a:
                continue
            ia, ib = int(round(a * SR)), int(round(b * SR))
            seg = np.ones(ib - ia)
            m = min(e, len(seg) // 2)
            seg[:m] = np.linspace(0, 1, m)
            seg[len(seg) - m:] *= np.linspace(1, 0, m)
            g[ia:ib] = seg
        cyc += 1
    return g


def _horn_keys(scene, T0, T1):
    """[(t_start, t_end, cut-off Hz, level dB)] in absolute seconds: how the bed is muffled, as it changes. Alarm: every door that shuts steps it down (the glide ends 90 ms after the slam, so
    the horn is already dulling as the leaf swings). Evac: all six doors are shut from the start, and while the line leaves through the fire door (the `line` beat) it opens to 1.2 kHz."""
    keys = []
    if scene == "alarm":
        for t, c in _load_doors()["states"]:
            if T0 - 2 < t < T1:
                c = int(min(max(c, 0), 6))
                keys.append((t - .06, t + .09, HORN_CUT[c], -HORN_STEP_DB * c))
    elif scene == "evac":
        w = _beat_abs("evac", "line")
        if w:
            keys.append((w[0] - .15, w[0], 1200.0, -HORN_STEP_DB * 6 + 4.0))
            keys.append((w[1], w[1] + .15, HORN_CUT[6], -HORN_STEP_DB * 6))
    return keys


def _horn_curves(n, T0, init, keys):
    """The per-sample muffling index u (0 = bright .. 6 = six doors, from the log of the cut-off) and the level in dB, from the initial state and the keyframes."""
    ts, cs, ds = [0.0], [np.log(init[0])], [init[1]]
    for a, b, c, d in keys:
        ts += [max(a - T0, ts[-1]), max(b - T0, ts[-1])]
        cs += [cs[-1], np.log(c)]
        ds += [ds[-1], d]
    t = np.arange(n) / SR
    lc = np.interp(t, ts, cs)
    db = np.interp(t, ts, ds)
    xp = np.log(np.array(HORN_CUT[::-1]))
    u = np.interp(lc, xp, np.arange(len(HORN_CUT))[::-1].astype(float))
    return u, db


def sfx_horn3():
    """THE ALARM: a bed, not a one-shot (the mixer places it at its `horn3` cue; it ends at the next `hornstop`). An electronic fire horn in the temporal-three, counted from the cue: 0.5 s on,
    0.5 s off, three times, then 1.5 s off, period 4.0 s (the picture's FX18.hornOn / FX18.strobe use the same clock). The tone is square-ish at about 520 Hz with a buzz (see _horn_tone),
    5 ms edges, a hair of strobe tick on every pulse (the xenon tube) and a reflection off each wall (7 and 12 ms behind, darker). THE DOORS: the alarm scene's bed is run through seven low-passes
    (8 k, 4.5 k, 3 k, 2 k, 1.3 k, 850 Hz, 520 Hz) that are blended by the number of doors shut (see _load_doors): each slam steps it down, 1.5 dB a door, over 150 ms; as more doors shut the horn
    also loses its edges (a short smear) and gains the thump of air that walls pass on. The evacuation's bed stays at the six-door setting and opens to 1.2 kHz while the line leaves. The bed is dipped
    under the voices (6, 15 or 12 dB by scene; 24 under the overhead page). A bed that is cut in the middle of a pulse (the snooze) gets a 60 ms ring-down: the diaphragm settling."""
    k, scene, i = _ctx("horn3")
    starts, stops = _cue_times("horn3"), _cue_times("hornstop")
    known = k < len(starts)
    if known:
        T0 = starts[k]
        T1 = next((s for s in stops if s > T0), T0 + 3.0)
    else:
        scene, T0, T1 = None, 0.0, 3.0
    T = T1 - T0
    n = _n(T + .12)
    x = _horn_tone(n, 40 + k)
    g = _pulse_gate(n, T)
    ia = int(round(T * SR))
    e5 = int(.005 * SR)
    if (T % 4.0) < .5 or 1.0 <= (T % 4.0) < 1.5 or 2.0 <= (T % 4.0) < 2.5:       # cut in the middle of a pulse: no fade to nothing, a 60 ms ring-down from where it was
        tail = int(.06 * SR)
        g[ia - e5:ia] = np.linspace(1, .4, e5)
        g[ia:ia + tail] = .4 * np.exp(-np.arange(tail) / (.02 * SR))
    init = (HORN_CUT[6], -HORN_STEP_DB * 6) if scene == "evac" else (HORN_CUT[0], 0.0)
    u, db = _horn_curves(n, T0, init, _horn_keys(scene, T0, T1))
    lo, hi = int(np.floor(u.min())), int(np.ceil(u.max()))
    y = np.zeros(n)
    for j in range(max(lo, 0), min(hi, 6) + 1):
        y += np.clip(1 - np.abs(u - j), 0, 1) * _lp4(x, HORN_CUT[j], 4)
    wall = np.clip(u / 6.0, 0, 1)
    ir = _lp4(rng6(77).uniform(-1, 1, int(.05 * SR)) * np.exp(-np.arange(int(.05 * SR)) / (.012 * SR)), 900, 2)
    ir /= np.sqrt(np.sum(ir ** 2))
    y = y * (1 - .55 * wall) + signal.fftconvolve(y, ir)[:n] * .55 * wall                  # the walls smear the edges
    y = y * g
    for o in np.where(np.diff(np.concatenate([[0], (g > .5).astype(float)])) > 0)[0]:       # on every pulse onset
        m = min(int(.09 * SR), n - o)
        tt = np.arange(m) / SR
        y[o:o + m] += np.sin(2 * np.pi * 105 * tt) * np.exp(-tt / .03) * .32 * wall[o] ** 1.5      # the air that the walls pass on
        c = min(int(.004 * SR), n - o)
        y[o:o + c] += rng6(900 + o % 997).uniform(-1, 1, c) * np.linspace(1, 0, c) * .05 * (1 - wall[o]) ** 2     # the strobe tube's tick
    y *= 10 ** (db / 20)
    if known and _timeline()["lines"]:
        y *= _duck_curve(T0, n, HORN_DUCK.get(scene, 10), HORN_DUCK_PA)
    side = _lp4(y, 4500, 2)
    out = np.stack([y + .30 * _delay(side, 7, 1.0), y + .30 * _delay(side, 12, 1.0)]) * HORN_LEVEL / 1.25
    room = {"evac": "room"}.get(scene, "hall")                                   # the scene's room (A6.ROOMS), baked in here: the bed is kept out of the mixer's reverb (NOREV) so that the snooze
    rt, wet = A6.ROOMS.get(room, (.5, .1))                                       # cuts it DEAD: the room's tail is cut with the horn, 60 ms after it, and then there is only room tone
    ir = A6.make_ir(rt, seed=sum(map(ord, room)))
    out = out + np.stack([signal.fftconvolve(out[c], ir[c])[:n] for c in range(2)]) * wet
    end = min(n, ia + int(.06 * SR))
    out[:, end:] = 0.0
    k20 = int(.02 * SR)
    out[:, end - k20:end] *= np.linspace(1, 0, k20)
    return out


def sfx_hornstop():
    """The panel lets go. The horn bed itself ends at this cue (see sfx_horn3); this is what the room does about it. The title's (after the third pulse): a relay's tick and a breath of
    the amplifier settling. The alarm's (the snooze): almost nothing, because the quiet is the joke: a relay tick and a very faint 120 Hz ring-down of the power supply (0.12 s). The all clear's:
    the same tick, then a long falling exhale of hum (a 120 Hz transformer easing off) and the strobes' capacitors discharging in four ticks that slow down."""
    k, scene, i = _ctx("hornstop")
    d = .6 if k < 2 else 1.4
    x = np.zeros(_n(d))
    _place(x, _sum(_band(5100 + k, .006, 1800, 6500) * expdecay(.006, .0014) * .8, _thump(210, 90, .04, .01) * .5), 0.0, 1.0)
    t = tarr(.5 if k < 2 else 1.3)
    hum = (np.sin(2 * np.pi * 120 * t) + .5 * np.sin(2 * np.pi * 240 * t) + .2 * np.sin(2 * np.pi * 360 * t)) * np.exp(-t / (.04 if k == 1 else .12 if k == 0 else .35))
    _place(x, hum, .006, .16 if k == 1 else .3 if k == 0 else .35)
    if k == 2:
        for j, at in enumerate((.35, .62, .95, 1.35)):
            if at < d - .05:
                _place(x, _band(5110 + j, .005, 2500, 7000) * expdecay(.005, .0012) * .5, at, .35 - .06 * j)
    return norm6(_edge(x, .0004, .1), .5)


def sfx_pachime():
    """The page's two-tone ceiling chime (1.3 s), a major third down: E5 and C5, each a soft tubular bell (a sine and its 2.76x partial that fades quickly, a faint octave), 0.42 s apart, through
    the same cheap driver as the voice that follows it (350 Hz to 3.6 kHz, a little saturation) and a small slap echo (110 ms). Ding, dong; nobody is listening."""
    x = np.zeros(_n(1.5))
    for at, f, g in ((0.0, 659.25, 1.0), (.42, 523.25, .9)):
        d = .95
        t = tarr(d)
        bell = (np.sin(2 * np.pi * f * t) + .22 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / .12) + .1 * np.sin(4 * np.pi * f * t) * np.exp(-t / .25)) * np.exp(-t / .38)
        _place(x, bell * np.minimum(1, t / .004), at, g)
    y = np.tanh(1.5 * _bp4(x, 350, 3600, 2) / (np.max(np.abs(x)) + 1e-9)) * .7
    y = y + _delay(_bp4(y, 400, 2800, 1), 110, .22)
    return norm6(_edge(y, .002, .2), .6)


# ================================================================ Episode 18: the doors
DOOR_EVENTS = []        # the `doorslam` / `doorlatch` events in the order the mixer asks for them (filled by main from the door table)
LATCH_EVENTS = []


def _corridor(x, depth, seed, rt0=.22, rt1=.95, wet0=.08, wet1=.5):
    """What the corridor does to a door slam: darker and wetter with distance (depth 0 = at the camera, 1 = the far end). A low-pass (10 kHz close, 1.7 kHz far), then a reverb whose length
    (0.22 to 0.95 s) and wet level (8 to 50 percent of the direct sound's energy) follow the depth."""
    fc = 1700 + 8500 * (1 - depth) ** 1.5
    y = _lp4(x, fc, 2)
    rt = rt0 + (rt1 - rt0) * depth
    n = int((rt * 1.2 + .02) * SR)
    t = np.arange(n) / SR
    ir = _lp4(rng6(seed).uniform(-1, 1, n) * np.exp(-6.9 * t / rt), 2600 + 3000 * (1 - depth), 2)
    ir[:int(.006 * SR)] = 0
    for tap, g in ((.011, .6), (.019, .4), (.033, .3)):
        ir[int(tap * SR)] += g * .6
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = wet0 + (wet1 - wet0) * depth
    w = signal.fftconvolve(y, ir)
    out = np.zeros(len(w))
    out[:len(y)] += y * (1 - .5 * wet)
    out += w * wet * 1.6
    return out


def _slam_core(seed, weight=1.0, door=0):
    """The leaf of a steel fire door meeting its frame (about 0.6 s, mono, before the corridor): a crack of steel on steel (12 ms of 600 Hz to 7 kHz), the leaf's own modes (a big sheet of
    steel: 140, 233, 361, 540 and 790 Hz, the low ones ringing 0.35 s, each door a few percent off from the others), the body (a sine that falls from 105 to 48 Hz, with the push of air
    behind it), a bounce of the leaf on its stop 85 ms later (a third of the size) and the hinges and strike plate rattling (six small impacts that die away)."""
    r = rng6(seed)
    d = .7
    t = tarr(d)
    x = np.zeros(len(t))
    x += _band(seed, d, 600, 7000) * np.exp(-t / .006) * 1.0
    x += _band(seed + 1, d, 250, 1800) * np.exp(-t / .02) * .7
    detune = 1 + .03 * np.sin(door * 2.1 + 1)
    for f, a, tau in ((140, .55, .36), (233, .5, .3), (361, .4, .22), (540, .3, .16), (790, .22, .11), (1710, .12, .05)):
        x += a * np.sin(2 * np.pi * f * detune * t) * np.exp(-t / tau)
    fb = 48 + 57 * np.exp(-t / .045)
    x += _sin_of(fb) * np.exp(-t / .1) * 1.25 + .4 * _sin_of(2 * fb) * np.exp(-t / .05)
    x += _lp4(noise6(d, seed + 2), 260, 2) * np.exp(-t / .12) * .6
    b = np.zeros(len(t))
    _place(b, _sum(_band(seed + 3, .05, 500, 5500) * expdecay(.05, .008) * .9, _sin_of(56 + 40 * np.exp(-tarr(.3) / .04)) * np.exp(-tarr(.3) / .08) * .6), .085, 1.0)
    x += b * .33
    at = .03
    for j in range(7):
        _place(x, _band(seed + 10 + j, .03, 1500, 5200) * expdecay(.03, .004), at, (.34 - .04 * j) * r.uniform(.6, 1.0))
        at += r.uniform(.016, .045)
    return x * weight


def _latch(seed, depth=0.0):
    """The latch bolt snapping into the strike plate (0.2 s, mono): a bright tick (a 3.4 kHz burst, 3 ms), a knock of the bolt in its keeper (1.1 kHz, 15 ms), a small steel ring (2.7 kHz and its 2.4x partial)
    and the closer's final settling hiss."""
    d = .2
    t = tarr(d)
    x = _band(seed, d, 2500, 7500) * np.exp(-t / .0025) * 1.0
    x += np.sin(2 * np.pi * 1100 * t) * np.exp(-t / .012) * .7 + _band(seed + 1, d, 500, 2400) * np.exp(-t / .01) * .6
    x += (np.sin(2 * np.pi * 2700 * t) + .5 * np.sin(2 * np.pi * 6480 * t) * np.exp(-t / .02)) * np.exp(-t / .035) * .25
    x += _band(seed + 2, d, 3000, 8000) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * .05
    return x


def sfx_doorslam():
    """A heavy fire door shutting (about 1.2 s with its corridor). One call per `doorslam` event of the door table (see _load_doors): the leaf on its frame, the body, the bounce and the
    rattle (see _slam_core), the latch's click folded in when the table has no separate `doorlatch` events, and then the corridor (see _corridor): a far door is quieter (the event's own gain),
    duller and wetter, a near one is a crack. Each door is a little different (its own modes, its own rattle)."""
    k = _nth("doorslam")
    ev = DOOR_EVENTS[k] if k < len(DOOR_EVENTS) else {"depth": .5, "door": k}
    depth = float(np.clip(ev.get("depth", .5), 0, 1))
    seed = 6000 + 17 * k
    x = _slam_core(seed, 1.0, int(ev.get("door", k)))
    if not LATCH_EVENTS:
        _place(x, _latch(seed + 40, depth), .03, .45)
    y = _corridor(x, depth, seed + 7)
    return norm6(_edge(y, .0002, .15), .9)


def sfx_doorlatch():
    """The latch of a fire door (0.35 s): a tick and a knock with a small steel ring (see _latch), a little duller and wetter the farther the door (the event's depth)."""
    k = _nth("doorlatch")
    ev = LATCH_EVENTS[k] if k < len(LATCH_EVENTS) else {"depth": .5}
    depth = float(np.clip(ev.get("depth", .5), 0, 1))
    y = _corridor(_latch(6500 + 11 * k, depth), depth, 6600 + k, .2, .8, .05, .4)[:_n(.55)]
    return norm6(_edge(y, .0002, .2), .8)


def sfx_doorbonk():
    """The linen cart's wheel jams the nearest door (0.85 s): the door's edge meets the wheel (a rubbery thud: a sine that falls from 150 to 68 Hz, a dull burst of 200 to 1500 Hz, a 380 Hz
    knock), the cart shivers (a rattle of a wire frame on four casters: fourteen ticks that die away over 0.45 s, a 620 Hz frame ring, a soft fall of linen at 0.5 s), and the door bounces back and slams
    on the frame behind it, a lighter version of the others (0.3 s later, 55 percent)."""
    d = .9
    t = tarr(d)
    x = np.zeros(len(t))
    x += _sin_of(68 + 82 * np.exp(-t / .035)) * np.exp(-t / .06) * 1.9
    x += _lp4(noise6(d, 6700), 1500, 2) * np.exp(-t / .022) * 1.4 + _band(6701, d, 200, 1500) * np.exp(-t / .03) * .8
    x += np.sin(2 * np.pi * 380 * t) * np.exp(-t / .03) * .8
    x += _band(6702, d, 800, 4500) * np.exp(-t / .004) * .8
    r = rng6(6703)
    at = .03
    for j in range(14):
        g = (.42 - .027 * j) * r.uniform(.55, 1.0)
        _place(x, _band(6710 + j, .03, 1000 + 120 * (j % 4), 4200) * expdecay(.03, .005), at, g)
        at += .022 + .011 * j * r.uniform(.6, 1.2) / 1.0
    x += np.sin(2 * np.pi * 620 * t) * np.exp(-t / .1) * .18 * np.minimum(1, t / .02) + np.sin(2 * np.pi * 1490 * t) * np.exp(-t / .06) * .08
    _place(x, _lp4(noise6(.25, 6720), 500, 2) * np.sin(np.pi * np.clip(tarr(.25) / .25, 0, 1)) ** 1.5 * .5, .5, 1.0)
    _place(x, _edge(_slam_core(6730, 1.0, 5)[:_n(.5)], 0.0, .2), .3, .4)
    return norm6(_edge(_corridor(x, .15, 6740, .22, .5, .08, .25), .0003, .12), .85)


# ================================================================ Episode 18: the marshal, the pull, the extinguisher
def sfx_pullclick():
    """The lever of the pull station (0.55 s): the handle sliding in its slot (a short scrape), the latch breaking (a hard, bright clack, 12 ms of 900 Hz to 7.5 kHz and a small steel ring at
    2.35 kHz), the box answering (a thin metal box on a plaster wall: a 330 Hz knock), the lever meeting its stop (a duller clack 40 ms later) and the spring: a coil twang that wobbles
    (three partials at 1.28, 2.23 and 3.29 kHz with a 26 Hz phase wobble, dying in 0.1 s)."""
    x = np.zeros(_n(.55))
    t = tarr(.01)
    _place(x, _band(5200, .01, 1500, 4200) * np.sin(np.pi * np.clip(t / .01, 0, 1)) * .3, 0.0, 1.0)
    _place(x, _sum(_band(5201, .03, 900, 7500) * expdecay(.03, .0022) * 1.0, _ping(2350, .08, .018, (1.0, 2.31, 3.97), (1, .5, .3), (1, .6, .4)) * .5), .008, 1.0)
    _place(x, _sum(_thump(330, 150, .06, .016) * .7, _band(5202, .04, 300, 1400) * expdecay(.04, .008) * .5), .01, 1.0)
    _place(x, _sum(_band(5203, .02, 500, 3500) * expdecay(.02, .004) * .7, _thump(240, 110, .05, .014) * .5), .05, 1.0)
    d = .45
    t = tarr(d)
    tw = sum(a * np.sin(2 * np.pi * f * t + 2.2 * np.sin(2 * np.pi * 26 * t)) * np.exp(-t / tau) for f, a, tau in ((1280, 1.0, .11), (2230, .55, .07), (3290, .35, .045)))
    _place(x, tw * np.minimum(1, t / .002), .08, .35)
    return norm6(_edge(x, .0003, .1), .8)


def _boot(seed, w=1.0):
    """One heavy step on vinyl tile (0.35 s): the heel (a body that falls from 120 to 52 Hz, a 1.8 to 5.5 kHz tick, the leather's slap), the sole coming down 75 ms later (softer), a creak of
    leather and the jingle of a belt: keys and a radio clip (two pings, 3.1 and 4.4 kHz, a dozen milliseconds apart, quiet)."""
    d = .35
    x = np.zeros(_n(d))
    _place(x, _sum(_thump(120, 52, .15, .032) * 1.0, _band(seed, .03, 1800, 5500) * expdecay(.03, .003) * .5, _band(seed + 1, .1, 250, 2200) * expdecay(.1, .016) * .7), 0.0, w)
    _place(x, _sum(_thump(95, 60, .1, .022) * .6, _band(seed + 2, .08, 200, 1500) * expdecay(.08, .018) * .5), .075, w)
    r = rng6(seed + 3)
    f0 = r.uniform(620, 900)
    tt = tarr(.07)
    _place(x, _sin_of(f0 * (1 + .25 * tt / .07)) * np.sin(np.pi * np.clip(tt / .07, 0, 1)) * .06 * (1 + .5 * np.sin(2 * np.pi * 90 * tt)), .03, w)
    for fq in (3100, 4400):
        _place(x, _glass(fq * r.uniform(.97, 1.03), .18, .06, .0008) * .16, r.uniform(.02, .09), w)
    _place(x, _band(seed + 5, .15, 400, 3000) * np.sin(np.pi * np.clip(tarr(.15) / .15, 0, 1)) * .12, .01, w)
    return x


def sfx_boots():
    """The Marshal arrives (1.2 s): three heavy steps (0.36 s apart; the second and third a hair harder) and a fourth, lighter one where he plants his feet (see _boot). Soles of a man who
    has done this for forty years."""
    x = np.zeros(_n(1.4))
    for j, (at, w) in enumerate(((0.0, .9), (.36, 1.0), (.72, 1.05), (.98, .55))):
        _place(x, _boot(5300 + 9 * j, 1.0), at, w)
    return norm6(_edge(_lp4(x, 7500, 2), .001, .2), .95)


def sfx_flashclick():
    """A flashlight's switch (0.3 s): a rubber button with a metal contact: the 'tk' of the button going over (a 2.1 kHz tick and a 1.0 kHz body, 5 ms), 45 ms later the contact seating
    ('tok', lower, softer) and the faint rattle of a battery in a barrel (three small taps, 90 to 130 ms later)."""
    x = np.zeros(_n(.3))
    t = tarr(.03)
    _place(x, _band(5400, .03, 1500, 6500) * expdecay(.03, .0024) * .9 + np.sin(2 * np.pi * 2100 * t) * np.exp(-t / .005) * .5 + np.sin(2 * np.pi * 1000 * t) * np.exp(-t / .012) * .4, 0.0, 1.0)
    _place(x, _band(5401, .03, 700, 3500) * expdecay(.03, .004) * .7 + np.sin(2 * np.pi * 800 * t) * np.exp(-t / .01) * .4, .045, .6)
    for j, at in enumerate((.095, .112, .13)):
        _place(x, _band(5402 + j, .02, 1800, 5200) * expdecay(.02, .003), at, .16 - .03 * j)
    return norm6(_edge(x, .0003, .05), .7)


def sfx_pinpull():
    """The tamper seal and the pin (0.6 s): the plastic seal snapping (a crisp 'tick-crack', 3 to 9 kHz, 2 ms, and a little pop of the plastic), the pin sliding out of the handle (a metal-on-metal
    rasp: a 2 to 6 kHz band that rises and falls over 90 ms with a 3.9 kHz ring) and the ring, free, jingling against the handle (two pings at 2.7 and 4.1 kHz and three small rattles)."""
    x = np.zeros(_n(.6))
    _place(x, _sum(_band(5500, .01, 3000, 9000) * expdecay(.01, .0018) * 1.0, _thump(900, 400, .02, .006) * .3), 0.0, 1.0)
    d = .09
    t = tarr(d)
    rasp = _tv_filter(noise6(d, 5501), 2000 + 3000 * np.sin(np.pi * np.clip(t / d, 0, 1)), 2.5, "bp") * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .7
    _place(x, rasp * 1.0 + np.sin(2 * np.pi * 3900 * t) * np.sin(np.pi * np.clip(t / d, 0, 1)) * .1, .035, 1.0)
    for fq, at, g in ((2700, .14, .5), (4100, .15, .35)):
        _place(x, _glass(fq, .3, .09, .0006), at, g)
    for j, at in enumerate((.2, .26, .32)):
        _place(x, _sum(_band(5510 + j, .03, 2000, 6500) * expdecay(.03, .006), _glass(3300 + 400 * j, .1, .03, .0006) * .3), at, .22 - .05 * j)
    return norm6(_edge(x, .0003, .15), .75)


def sfx_foamhiss():
    """THE EXTINGUISHER GOES OFF (2.8 s, stereo): a valve's thump and a crack as the pressure is released (a sine that falls from 150 to 60 Hz and a broadband burst), then the jet: noise
    through a resonant band whose centre falls with the pressure like a leaking tyre (5 kHz to 1.5 kHz, Q 2) and whose level falls with it, under it a roar (noise below 500 Hz) and a slow
    turbulence (20 percent at about 14 Hz); the can is a loose steel cylinder in a spray: a buzz (a 180 Hz saw through a 700 to 1100 Hz band, the rattle of the can on its own jet) at a low level; in the
    last 0.6 s the gas gives out in coughs (a gate that chops at 14 to 25 Hz and slows) and the pitch sinks. Its pan travels with the can: from the left of the centre, away down the corridor to the right,
    then back toward the Marshal. The collisions are the physics foley's; this is the jet."""
    d = 2.8
    t = tarr(d)
    p = np.exp(-t / 1.35) * np.interp(t, [0, .06, d], [0, 1, 1])
    p2 = np.exp(-t / 1.0)
    fc = 1500 + 3500 * p2
    jet = _tv_filter(noise6(d, 5600), fc, 2.0, "bp") * 1.6 + _hp4(noise6(d, 5601), 2500, 2) * .35
    turb = 1 + .2 * _smooth_rand(d, 5602, 14)
    jet = jet * turb * p ** .8
    roar = _lp4(noise6(d, 5603), 500, 2) * p ** .9 * 1.1
    can = _tv_filter(osc("saw", 180 * (.8 + .2 * p), d), 700 + 400 * p, 3.0, "bp") * .5 * p ** .6 * (.5 + .5 * _smooth_rand(d, 5604, 9) ** 2)
    x = jet + roar + can
    g = np.ones(len(t))
    cough = t > 2.15
    gate = (np.sign(np.sin(2 * np.pi * np.cumsum(25 - 11 * np.clip((t - 2.15) / .65, 0, 1)) / SR)) * .5 + .5)
    g[cough] = .35 + .65 * gate[cough]
    x = x * g
    _place(x, _sum(_thump(150, 60, .2, .05) * 1.3, _band(5605, .05, 400, 7000) * expdecay(.05, .01) * .9), 0.0, 1.0)
    x *= np.interp(t, [0, 2.3, d], [1, 1, 0])
    pan = np.interp(t, [0, .6, 1.4, 2.2, d], [-.1, .35, .65, .3, .1])
    th = (pan + 1) * np.pi / 4
    return norm6(_edge(np.stack([x * np.cos(th), x * np.sin(th)]), .0005, .15), .85)


def sfx_foamsplat():
    """A big foam cloud lands on the Marshal's face (1.0 s): the thump of a mass of wet foam (a body that falls from 170 to 70 Hz), the slap (a 300 to 3500 Hz burst, 25 ms), the squelch of it spreading
    (a resonant band that falls from 900 to 250 Hz over 0.25 s, Q 4, chopped by a 40 Hz flutter), the bubbles (about twenty tiny pops, each a sine that chirps up 400 to 1500 Hz in 6 to 15 ms, thinning over
    0.7 s) and a last drip. Thick and wet, not a balloon."""
    d = 1.0
    t = tarr(d)
    x = _sum(_thump(170, 70, .25, .045) * 1.2, _band(5700, d, 300, 3500) * np.exp(-t / .025) * 1.0)
    sq = _tv_filter(noise6(d, 5701), np.interp(t, [0, .25, d], [900, 250, 250]), 4.0, "bp") * np.interp(t, [0, .02, .2, .35], [0, 1, .6, 0]) * (.6 + .4 * np.sin(2 * np.pi * 40 * t))
    x += sq * 2.2
    r = rng6(5702)
    for j in range(22):
        at = .03 + .7 * r.uniform() ** 1.6
        dd = r.uniform(.006, .015)
        tt = tarr(dd)
        f = r.uniform(400, 900) * (1 + 1.5 * tt / dd)
        _place(x, _sin_of(f) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) * .25, at, 1.0 - .8 * at)
    tt = tarr(.08)
    _place(x, _sin_of(500 + 900 * tt / .08) * np.sin(np.pi * np.clip(tt / .08, 0, 1)) * .18, .86, 1.0)
    return norm6(_edge(_lp4(x, 7000, 2), .0004, .15), .85)


# ================================================================ Episode 18: the cart, the printer, the clipboard, the line, the television
WALTZ_BL = .8333      # a beat of the line's shuffling waltz (72 bpm): the walker's taps are on these beats, and the score (build_music18) plays the waltz on the same ones


def sfx_cartrattle():
    """A linen cart on vinyl tile (a wire frame, four hard casters). The first (marshal, 1.4 s): the cart is struck and jolts: the casters hop and clatter (twelve ticks that thin out), the wire
    shelves ring (a band at 500 to 2500 Hz that swells and dies over 0.5 s), the linen shifts (two soft thumps) and a caster squeaks once. The second (evac, 2.5 s): the cart is pushed along with the line: a
    rumble of wheels on tile (90 to 600 Hz with the beat of a flat spot at 6 Hz), a loose wire frame (a scatter of small ticks) and a squeak that comes and goes; it swells and passes."""
    k, scene, i = _ctx("cartrattle")
    r = rng6(7000 + k)
    if scene == "marshal" or k == 0:
        d = 1.4
        t = tarr(d)
        x = np.zeros(len(t))
        at = .02
        for j in range(12):
            _place(x, _sum(_band(7010 + j, .03, 900, 4800) * expdecay(.03, .005), _thump(190, 110, .04, .012) * .5), at, (.7 - .045 * j) * r.uniform(.6, 1.0))
            at += .03 + .028 * j * r.uniform(.7, 1.3)
        ring = _tv_filter(noise6(d, 7020), 1200 + 600 * np.sin(2 * np.pi * 3 * t), 3.0, "bp") * np.interp(t, [0, .02, .15, .55, d], [0, 1, .6, .15, 0])
        x += ring * .7
        for j, at in enumerate((.25, .6)):
            _place(x, _lp4(noise6(.15, 7030 + j), 400, 2) * np.sin(np.pi * np.clip(tarr(.15) / .15, 0, 1)) * .5, at, 1.0)
        tt = tarr(.14)
        _place(x, _sin_of(2200 + 500 * tt / .14) * np.sin(np.pi * np.clip(tt / .14, 0, 1)) * (.7 + .3 * np.sign(np.sin(2 * np.pi * 42 * tt))) * .16, .3, 1.0)
        return norm6(_edge(x, .0004, .3), .75)
    d = 2.5
    t = tarr(d)
    wheel = _band(7040, d, 90, 600) * (.6 + .4 * np.sin(2 * np.pi * 6 * t))
    frame = np.zeros(len(t))
    for j in range(46):
        _place(frame, _band(7050 + j, .02, 1200, 4500) * expdecay(.02, .004), r.uniform(.05, d - .1), r.uniform(.08, .35))
    sq = np.zeros(len(t))
    for at in (.5, 1.45):
        tt = tarr(.22)
        _place(sq, _sin_of(1900 + 600 * np.sin(np.pi * tt / .22)) * np.sin(np.pi * np.clip(tt / .22, 0, 1)) * (.65 + .35 * np.sign(np.sin(2 * np.pi * 36 * tt))) * .1, at, 1.0)
    x = (wheel * .9 + frame + sq) * np.interp(t, [0, .5, 1.6, d], [.1, 1, 1, 0])
    return norm6(_edge(x, .01, .3), .6)


def sfx_printer():
    """A small inkjet printing the evacuation map (1.7 s, stereo): the paper picked up (a roller whir that climbs, the slide of the sheet, the tray's thunk), five passes of the carriage (each 0.2 s
    and sweeping across the field: a band of 1.8 to 5 kHz chopped at 220 Hz by the nozzles, a motor whine that sweeps 380 to 520 Hz and back, the carriage's rail), a paper-feed ratchet between the passes
    (six ticks) and the sheet ejected (a rising rustle and a small flap)."""
    d = 1.7
    out = np.zeros((2, _n(d)))

    def put(x, at, p0, p1):
        i = int(at * SR)
        n = min(len(x), out.shape[1] - i)
        pan = np.linspace(p0, p1, n)
        th = (pan + 1) * np.pi / 4
        out[0, i:i + n] += x[:n] * np.cos(th)
        out[1, i:i + n] += x[:n] * np.sin(th)
    t = tarr(.28)
    pick = _sin_of(130 + 120 * (t / .28) ** 1.5) * .35 + _lp4(osc("saw", 130 + 120 * (t / .28) ** 1.5, .28), 900, 2) * .4
    pick += _band(7100, .28, 2000, 7000) * np.sin(np.pi * np.clip(t / .28, 0, 1)) * .3
    put(pick * np.minimum(1, t / .02), 0.0, -.1, -.1)
    put(_sum(_thump(150, 80, .1, .03) * .5, _band(7101, .03, 400, 3000) * expdecay(.03, .006) * .5), .05, -.2, -.2)
    for j in range(5):
        a = .3 + .235 * j
        dd = .2
        tt = tarr(dd)
        direction = 1 if j % 2 == 0 else -1
        noz = _band(7110 + j, dd, 1800, 5000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 220 * tt)))
        mot = _sin_of(np.interp(tt, [0, dd / 2, dd], [380, 520, 380]) * (1 + .01 * np.sin(2 * np.pi * 60 * tt))) * .22 + _lp4(osc("saw", np.interp(tt, [0, dd / 2, dd], [380, 520, 380]), dd), 1500, 2) * .15
        rail = _band(7120 + j, dd, 300, 1500) * .15
        env = np.minimum(1, np.minimum(tt / .01, (dd - tt) / .015))
        put((noz * .5 + mot + rail) * env, a, -.45 * direction, .45 * direction)
        for q in range(6):
            _place_st(out, _band(7130 + 6 * j + q, .004, 1500, 5000) * expdecay(.004, .0012), a + dd + .004 + q * .007, .22, -.05)
    tail = _band(7140, .3, 1000, 5500) * np.interp(tarr(.3), [0, .12, .3], [0, 1, 0]) * .5
    put(tail, 1.42, .2, .4)
    put(_sum(_band(7141, .04, 1500, 6000) * expdecay(.04, .01) * .6, _thump(210, 110, .05, .015) * .3), 1.62, .4, .4)
    return norm6(_edge(out, .003, .08), .7)


def _place_st(out, clip, at, g, pan):
    th = (pan + 1) * np.pi / 4
    i = int(at * SR)
    n = min(len(clip), out.shape[1] - i)
    if i >= 0 and n > 0:
        out[0, i:i + n] += clip[:n] * g * np.cos(th)
        out[1, i:i + n] += clip[:n] * g * np.sin(th)


def sfx_clipboard():
    """The drill log changes hands (0.45 s): a clipboard slapped onto a palm (a hardboard slap: a 600 Hz to 5 kHz burst of 7 ms, a 420 Hz knock of the board), the metal clip clacking 28 ms later (a 3.1 kHz ring
    with a 5.2 kHz overtone), and the sheets of paper flapping and settling (a band of 1.5 to 6 kHz that swells over 0.15 s)."""
    x = np.zeros(_n(.45))
    t = tarr(.1)
    _place(x, _band(7200, .1, 600, 5000) * np.exp(-t / .007) * 1.0 + np.sin(2 * np.pi * 420 * t) * np.exp(-t / .028) * .6 + _band(7201, .1, 150, 700) * np.exp(-t / .02) * .5, 0.0, 1.0)
    _place(x, _sum(_glass(3100, .15, .03, .0006) * .5, _glass(5200, .1, .015, .0006) * .25), .028, 1.0)
    d = .22
    tt = tarr(d)
    _place(x, _band(7202, d, 1500, 6000) * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.2 * (.6 + .4 * np.sign(np.sin(2 * np.pi * 55 * tt))) * .5, .05, 1.0)
    return norm6(_edge(x, .0003, .1), .8)


def sfx_wheelchair():
    """The line leaves the day room (3.0 s): soft rubber wheels rolling on tile (a low rumble of 90 to 500 Hz with the slow beat of the tyre's seam at 1.6 Hz, swelling in the middle), two squeaks (a 1.9 to
    2.4 kHz tone that sticks and slips at 38 Hz, 0.15 s), a walker's rubber tips (a damped 700 Hz tock with a tick of aluminium, four of them on the beats of the waltz, 0.833 s apart, and a second walker
    off the beat and softer), and slippers shuffling (soft swishes every 0.42 s)."""
    d = 3.0
    t = tarr(d)
    r = rng6(7300)
    x = _band(7301, d, 90, 500) * (.7 + .3 * np.sin(2 * np.pi * 1.6 * t)) * .55 * np.interp(t, [0, .6, 2.2, d], [.2, 1, 1, .3])
    for at, f0 in ((.55, 1900), (1.75, 2100)):
        tt = tarr(.15)
        _place(x, _sin_of(f0 + 450 * tt / .15) * np.sin(np.pi * np.clip(tt / .15, 0, 1)) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 38 * tt))) * .1, at, 1.0)

    def tip(at, g):
        tt = tarr(.06)
        _place(x, np.sin(2 * np.pi * 700 * tt) * np.exp(-tt / .008) * .8 + _band(int(7310 + at * 10), .06, 1200, 4500) * expdecay(.06, .0025) * .5 + _glass(2400, .06, .01, .0005) * .1, at, g)
    for j in range(4):
        tip(.15 + WALTZ_BL * j, .9)
    for j in range(3):
        tip(.15 + WALTZ_BL * (j + .33), .45)
    for at in np.arange(.2, 2.8, .42):
        _place(x, _band(int(7330 + at * 10), .12, 250, 1800) * np.sin(np.pi * np.clip(tarr(.12) / .12, 0, 1)) * .18, at + r.uniform(-.03, .03), r.uniform(.5, 1.0))
    return norm6(_edge(x, .01, .3), .85)


def sfx_tvoff():
    """A television switched off with the remote (0.9 s): the CRT's last act. The speaker's thunk as the supply drops (a 70 Hz thump and a 2 kHz pop), the deflection collapsing (a whistle that falls from 4.2 kHz to
    110 Hz in 0.32 s along a curve that speeds up, with its second harmonic, and a buzz of 15 kHz-fed hiss), a crackle of static as the tube discharges (a 2 to 8 kHz noise burst, 90 ms, with 20 sparks) and the final
    soft knock of the degauss relay 0.38 s later."""
    d = .9
    x = np.zeros(_n(d))
    _place(x, _sum(_thump(110, 60, .15, .04) * 1.0, _band(7400, .02, 800, 4500) * expdecay(.02, .004) * .8), 0.0, 1.0)
    dw = .34
    t = tarr(dw)
    f = 110 + (4200 - 110) * (1 - t / dw) ** 2.6
    whistle = (_sin_of(f) + .35 * _sin_of(2 * f)) * np.interp(t, [0, .02, dw * .85, dw], [0, 1, .7, 0])
    _place(x, whistle * .75, .01, 1.0)
    d2 = .1
    t2 = tarr(d2)
    stat = _band(7401, d2, 2000, 8000) * np.sin(np.pi * np.clip(t2 / d2, 0, 1)) * .5
    r = rng6(7402)
    for j in range(20):
        _place(stat, _band(7410 + j, .004, 3000, 9000) * expdecay(.004, .001), r.uniform(0, .09), r.uniform(.3, 1.0))
    _place(x, stat, .09, .7)
    _place(x, _sum(_thump(80, 45, .2, .06) * .8, _band(7403, .03, 300, 1800) * expdecay(.03, .006) * .5), .38, .8)
    return norm6(_edge(x, .0003, .15), .8)


def sfx_yulecrackle():
    """The Yule log on the television (a bed that runs from its cue to the next `tvoff`, ending dead with it): a cosy fire through a small speaker. A hush of roar (noise below 400 Hz that breathes at
    0.3 Hz), a sizzle of sap (a 3 to 7 kHz band gated in tiny random bursts), about nine pops a second of random strength (a burst of 1.2 to 6 kHz that dies in 1.5 to 5 ms; every tenth a snap with a 700 to
    1200 Hz 'tock' and a 12 ms tail) and now and then a big log shifting (a 150 Hz thump with a crackle on top). All of it through a television speaker (250 Hz to 5.5 kHz, a little distortion)."""
    starts, stops = _cue_times("yulecrackle"), _cue_times("tvoff")
    k, scene, i = _ctx("yulecrackle")
    T = 10.3
    if k < len(starts):
        T = next((s for s in stops if s > starts[k]), starts[k] + T) - starts[k]
    n = _n(T)
    t = np.arange(n) / SR
    r = rng6(7500)
    x = _lp4(noise6(T, 7501), 400, 2) * (.5 + .5 * np.sin(2 * np.pi * .3 * t + 1)) * .35
    gate = (_smooth_rand(T, 7502, 40) > .45).astype(float)
    x += _band(7503, T, 3000, 7000) * gate * .06
    at = .05
    j = 0
    while at < T - .02:
        big = (j % 10 == 9)
        g = r.uniform(.15, 1.0) ** 2 * (1.0 if not big else 1.3)
        dd = .02 if not big else .05
        c = _band(7510 + j, dd, r.uniform(1200, 2500), r.uniform(3500, 6000)) * expdecay(dd, r.uniform(.0015, .005) if not big else .012)
        if big:
            tt = tarr(dd)
            c = c + np.sin(2 * np.pi * r.uniform(700, 1200) * tt) * np.exp(-tt / .008) * .4
        _place(x, c, at, g * .6)
        at += r.exponential(1 / 9.0) + .01
        j += 1
    for at in (2.3, 6.1, 9.0):
        if at < T - .3:
            _place(x, _sum(_thump(150, 70, .15, .05) * .8, _band(7520 + int(at), .12, 800, 4500) * expdecay(.12, .03) * .7), at, .6)
    x = np.tanh(2.2 * _bp4(x, 250, 5500, 2) / (np.max(np.abs(x)) + 1e-9)) * .8
    k2 = int(.015 * SR)
    x[-k2:] *= np.linspace(1, 0, k2)
    x[:k2] *= np.linspace(0, 1, k2)
    return x * (.9 / (np.max(np.abs(x)) + 1e-9))


def sfx_chirp():
    """A smoke detector's low-battery chirp (0.2 s): a piezo sounder, a bare 3.2 kHz tone for 90 ms with a sharp attack (1 ms) and a hard stop, the disc's ring (a 3.2 kHz tail that dies in 12 ms), a faint 2nd and
    3rd harmonic and a tiny room (three early reflections at 4.5, 9 and 15 ms and a 40 ms haze). Nothing else: it is perfectly dry (the mixer keeps it out of the scene's reverb), it is not dipped under dialogue and
    nothing in the score plays over it. The last sounds of the film."""
    d = .2
    t = tarr(d)
    tone = np.sin(2 * np.pi * 3200 * t) + .16 * np.sin(2 * np.pi * 6400 * t) + .05 * np.sin(2 * np.pi * 9600 * t)
    env = np.where(t < .087, 1.0, np.where(t < .09, 1 - .7 * (t - .087) / .003, .3 * np.exp(-(t - .09) / .008))) * np.clip(t / .001, 0, 1)
    x = tone * env
    y = x.copy()
    for ms, g in ((4.5, .22), (9, .12), (15, .07)):
        y += _delay(x, ms, g)
    y += _lp4(_delay(x, 22, 1.0), 4500, 2) * .05 * np.exp(-t / .02)
    return norm6(_edge(y, 0.0, .006), .8)


# ================================================================ Episode 18: the quiet (room tone, the tube, the wheel): events the script does not list, placed from the frozen timeline
EXTRA = {}      # name -> [event dict]: the quiet's designed events, in time order (filled by _make_events)


def _extra(name):
    k = _nth(name)
    lst = EXTRA.get(name, [])
    return lst[k] if k < len(lst) else {"dur": 3.0, "t": 0.0}


def sfx_roomtone():
    """The room under the alarm (a bed for the whole alarm scene; the horn hides it, the snooze reveals it): the mixer's own `hum` family (the building's ventilation and the ballasts: 60, 120 and 180 Hz
    with a breath of air) a little wider and quieter."""
    ev = _extra("roomtone")
    d = ev["dur"]
    x = A6.amb_hum(d, 41) * .5
    t = tarr(d)
    air = _band(7600, d, 200, 1400) * (.6 + .4 * _smooth_rand(d, 7601, .35)) * .05
    x = x + np.stack([air, np.roll(air, 330)])
    k = int(.4 * SR)
    x[:, :k] *= np.linspace(0, 1, k)
    x[:, -k:] *= np.linspace(1, 0, k)
    return x


def sfx_tubebuzz():
    """One fluorescent tube that is failing (a bed that starts as the horn is cut): a 120 Hz buzz with its harmonics up to 1.2 kHz (a ballast: 'mmmzzz'), a sizzle of 2.5 to 6 kHz, and a flicker: for the first
    1.6 s the tube strikes and drops out at random (segments of 30 to 200 ms, on or at 15 percent, a tick of the starter as it strikes), then it settles to a steady, fainter hum with one more stutter near
    the middle, and dies away at the end."""
    ev = _extra("tubebuzz")
    d = ev["dur"]
    n = _n(d)
    t = np.arange(n) / SR
    r = rng6(7700)
    buzz = sum(a * np.sin(2 * np.pi * 120 * m * t + m) for m, a in ((1, 1.0), (2, .5), (3, .55), (4, .3), (5, .25), (6, .15), (8, .1), (10, .07)))
    buzz = buzz * (1 + .05 * np.sin(2 * np.pi * .7 * t)) + _band(7701, d, 2500, 6000) * .06
    g = np.ones(n)
    at = 0.0
    ticks = []
    while at < 1.7:
        seg = r.uniform(.03, .2)
        lvl = 1.0 if r.random() < .5 else .15
        g[int(at * SR):int((at + seg) * SR)] = lvl
        if lvl == 1.0:
            ticks.append(at)
        at += seg
    g[int(1.7 * SR):] = .55
    mid = int(d * .45 * SR)
    g[mid:mid + int(.09 * SR)] = .12
    g[mid + int(.15 * SR):mid + int(.2 * SR)] = .3
    k = int(.008 * SR)
    g = uniform_filter1d(g, k)
    g *= np.interp(t, [0, 1.7, 2.4, d - 1.2, d], [1, 1, .55, .55, 0])
    x = buzz * g
    for a in ticks:
        _place(x, _band(7710 + int(a * 100), .006, 2000, 6500) * expdecay(.006, .0015) * 2.2, a, 1.0)
    return norm6(_lp4(x, 7000, 2), .5)


def sfx_cartsqueak():
    """One caster squeak in the silence (0.7 s): a med cart's wheel turns a quarter of a turn (a 2.2 to 2.9 kHz tone that sticks and slips at 33 Hz, 0.3 s, rising and settling) over the soft roll of the wheel on tile
    (a 120 to 500 Hz rumble for 0.55 s)."""
    d = .7
    t = tarr(d)
    ds = .3
    ts = tarr(ds)
    f = 2200 + 700 * np.sin(np.pi * np.clip(ts / ds, 0, 1) * .8) ** 1.0
    sq = _sin_of(f) * np.sin(np.pi * np.clip(ts / ds, 0, 1)) ** .8 * (.55 + .45 * np.sign(np.sin(2 * np.pi * 33 * ts + .5))) * .5
    sq += .25 * _sin_of(f * 2.02) * np.sin(np.pi * np.clip(ts / ds, 0, 1)) * .3
    x = np.zeros(len(t))
    _place(x, sq, .04, 1.0)
    _place(x, _band(7800, .55, 120, 500) * np.sin(np.pi * np.clip(tarr(.55) / .55, 0, 1)) * .22, .0, 1.0)
    return norm6(_edge(x, .004, .15), .55)


# ================================================================ registration (keep this at the end of the sfx section)
BOOST = {   # sustained textures that sat 15 to 20 dB under the voice at the script's gains: lifted so they register (the dialogue dip still takes them down under speech)
    "banner": 1.8, "sniffle": 1.4, "sob": 1.3, "stars": 1.4, "spinner": 1.4, "flip": 1.3, "typing": 1.4, "peel": 1.4, "cablewhip": 1.4, "keyboard": 1.3, "counter": 1.3, "heartbeat": 1.2,
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
# build/ep18/events.json (footsteps, written by the animation) and build/ep18/phys_events.json (collisions, written from the simulations) are never edited here. This turns them into one tuned
# copy in the output folder (events.tuned.json) which the mixer reads. Footsteps: the tower scenes show the staff small, so their steps are turned down; steps that land on the same instant
# are spread by a few milliseconds. Collisions: gain follows the magnitude, density is capped (at most two events in any 100 ms and fourteen in a second, the loudest kept), every first
# impact of a pair of objects is kept, and nothing is placed within 40 ms of a scripted big cue (the dock impact, the thud, the bonk ...) which would double it.
STEP_SCALE = {"title": 1.0, "notice": .9, "marshal": .9, "alarm": .8, "evac": .7, "clear": .9, "end": 1.0}
RUSH_AT = (0.0, .03, .055, .08)
BIG_CUES = ("foamsplat", "doorbonk", "doorslam", "tvoff", "pullclick", "stamp", "clipboard", "pinpull")


def _scene_table():
    tl = json.load(open(os.path.join(HERE, "build/ep18/timeline.json")))
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


def _tune_steps(events, tab):
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
                    "vol": round((.05 + .30 * mag ** 1.3) * (.6 if e.get("k") == "slide" else 1.0), 4), "pan": float(np.clip(e.get("pan", 0), -1, 1)), "room": "hall"})
    return out


QUIET_VOL = {"roomtone": .6, "tubebuzz": .08, "cartsqueak": .16}      # cue gains of the quiet's designed events (the mixer multiplies by .6 again)


def _quiet_extras():
    """The alarm scene's designed events (not in the script, placed from the frozen timeline's cue times): the ROOM TONE for the whole scene (the horn hides it, the snooze reveals it), ONE FLUORESCENT TUBE
    that starts buzzing and flickering as the horn is cut (`hornstop`) and runs to the scene's end, and ONE CART-WHEEL SQUEAK near 21.9 s in the silence (the `quiet` beat). Returns {name: [event]}."""
    a = _scene_info("alarm")
    if not a:
        return {}
    end = a["start"] + a["dur"]
    stops = [t for t in _cue_times("hornstop") if a["start"] < t < end]
    if not stops:
        return {}
    t_stop = stops[0]
    return {"roomtone": [{"t": a["start"], "dur": a["dur"] + .3, "vol": QUIET_VOL["roomtone"], "pan": 0.0}],
            "tubebuzz": [{"t": round(t_stop - .02, 3), "dur": round(end - t_stop - .1, 3), "vol": QUIET_VOL["tubebuzz"], "pan": .12}],
            "cartsqueak": [{"t": round(a["start"] + 21.9, 3), "dur": .7, "vol": QUIET_VOL["cartsqueak"], "pan": -.3}]}


def _make_events(src, phys_src, out_dir):
    """Write <out_dir>/events.tuned.json from the footsteps (src) and the collisions (phys_src); returns its path, or '' when there is nothing to place."""
    tab = _scene_table()
    steps = json.load(open(src)) if src and os.path.exists(src) else []
    phys = json.load(open(phys_src)) if phys_src and os.path.exists(phys_src) else []
    ev = _tune_steps(steps, tab) + _select_phys(phys, _scripted(tab))
    PHYS_EVENTS[:] = [e for e in ev if e.get("name") == "phys"]
    D = _load_doors()                                                     # Episode 18: the doors (slams and latches, from the door table) and the quiet's designed events
    DOOR_EVENTS[:] = D["slams"]
    LATCH_EVENTS[:] = D["latches"]
    for e in D["slams"]:
        ev.append({"t": round(e["t"], 3), "name": "doorslam", "vol": e["vol"], "pan": e["pan"], "room": "hall"})
    for e in D["latches"]:
        ev.append({"t": round(e["t"], 3), "name": "doorlatch", "vol": e["vol"], "pan": e["pan"], "room": "hall"})
    EXTRA.clear()
    EXTRA.update(_quiet_extras())
    for nm, lst in EXTRA.items():
        for e in lst:
            ev.append({"t": round(e["t"], 3), "name": nm, "vol": e["vol"], "pan": e.get("pan", 0), "room": "hall"})
    if not ev:
        return ""
    dst = os.path.join(out_dir, "events.tuned.json")
    os.makedirs(out_dir, exist_ok=True)
    json.dump(ev, open(dst, "w"), indent=0)
    return dst


# ================================================================ checks: the timeline, the dialogue margin, the loudness and the silences
def compare_timeline(out_dir):
    """Scene starts, scene lengths and every line's start and end of this build against the frozen build/ep18/timeline.json. Returns the list of differences (empty: identical)."""
    a = json.load(open(os.path.join(HERE, out_dir, "timeline.json")))
    b = json.load(open(os.path.join(HERE, "build/ep18/timeline.json")))
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
    vt = voice.copy()
    for sc in tl["scenes"]:
        a, b = int(sc["start"] * SR), min(n, int((sc["start"] + sc["dur"]) * SR))
        w = A6.reverb(voice[:, a:b], room[sc["id"]])
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
    """The cue list as built (scene-local time, absolute time, name, gain, pan) for the script's cues, then the designed events the script does not list (the doors' slams and latches from the door
    table, the quiet's room tone, tube and squeak), the horn's beds (start, stop, muffling) and the physics foley."""
    tab = _scene_table()
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    by = {nm: (a, bt) for nm, a, b, bt in tab}
    lines = ["scene  scene_time  abs_time  name  gain  pan"]
    for sc in script["scenes"]:
        a, bt = by[sc["id"]]
        for b in sc["beats"]:
            for c in b.get("sfx", []):
                s = bt[b["id"]]["e"] if c[1] == "end" else bt[b["id"]]["s"] + c[1]
                lines.append(f"{sc['id']:<8} {s:8.3f} {a + s:9.3f}  {c[0]:<12} {c[2]:<5} {c[3] if len(c) > 3 else 0}")
    D = _load_doors()
    lines.append("")
    lines.append(f"door table: {D['source']}: {len(D['slams'])} slams, {len(D['latches'])} latches; the horn's state after each slam: " + ", ".join(f"{t:.3f}:{n}" for t, n in D["states"]))
    for e in sorted(D["slams"] + [dict(x, kind="latch") for x in D["latches"]], key=lambda e: e["t"]):
        sc = _scene_of(e["t"], tab)
        loc = e["t"] - dict((nm, a) for nm, a, b, bt in tab).get(sc, 0)
        lines.append(f"{sc:<8} {loc:8.3f} {e['t']:9.3f}  {'doorlatch' if e.get('kind') == 'latch' else 'doorslam':<12} {e['vol']:<5} {e['pan']}  depth {e['depth']:.2f} door {e['door']}")
    for nm, lst in EXTRA.items():
        for e in lst:
            sc = _scene_of(e["t"], tab)
            loc = e["t"] - dict((n2, a) for n2, a, b, bt in tab).get(sc, 0)
            lines.append(f"{sc:<8} {loc:8.3f} {e['t']:9.3f}  {nm:<12} {e['vol']:<5} {e.get('pan', 0)}  dur {e['dur']:.2f} (designed, not in the script)")
    starts, stops = _cue_times("horn3"), _cue_times("hornstop")
    for t0 in starts:
        t1 = next((s for s in stops if s > t0), t0)
        sc = _scene_of(t0, tab)
        lines.append(f"horn bed: {t0:.3f} to {t1:.3f} s ({t1 - t0:.2f} s, from {sc})")
    per = {}
    for e in PHYS_EVENTS:
        per[_scene_of(e["t"], tab)] = per.get(_scene_of(e["t"], tab), 0) + 1
    lines.append(f"physics foley placed: {len(PHYS_EVENTS)} " + str(per))
    open(os.path.join(HERE, out_dir, "cue_report.txt"), "w").write("\n".join(lines) + "\n")


def publish(out_dir):
    import shutil
    import subprocess
    src = os.path.join(HERE, out_dir, "audio.wav")
    dst = os.path.join(HERE, "build/ep18/audio.wav")
    shutil.copyfile(src, dst)
    subprocess.run(["/usr/bin/ffmpeg", "-y", "-loglevel", "error", "-i", dst, "-c:a", "aac", "-b:a", "192k", os.path.join(HERE, "build/ep18/audio.m4a")], check=True)
    print("published: build/ep18/audio.wav and build/ep18/audio.m4a")


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
    """The loudness trim, peak limiter, end fade and AAC guard of Episodes 10 to 14: the finished file measures -14.8 LUFS and its AAC encode stays under -1 dBTP."""
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
    dips, deep = A10.aac_guard(wav)
    print(f"aac guard: {dips} dip(s), deepest {deep:.2f} dB (keeps the AAC encode under -1 dBTP)")


def main():
    argv = sys.argv[1:]
    do_publish = "--publish" in argv
    argv = [a for a in argv if a != "--publish"]
    phys_src = None
    if "--phys" in argv:
        i = argv.index("--phys")
        phys_src = argv[i + 1]
        del argv[i:i + 2]
    if "--doors" in argv:                                   # the alarm's door table (default build/ep18/door_events.json)
        i = argv.index("--doors")
        DOOR_PATH[0] = argv[i + 1]
        del argv[i:i + 2]
    keep_stems = "--keep-stems" in argv
    argv = [a for a in argv if a != "--keep-stems"]
    for k, v in (("--script", SCRIPT), ("--out", "build/ep18_sound"), ("--var", "TIMELINE_EP18"), ("--music", "build_music18")):
        if k not in argv:
            argv += [k, v]
    out = argv[argv.index("--out") + 1]
    out_dir = os.path.join(A6.HERE, out)
    os.makedirs(out_dir, exist_ok=True)
    src = argv[argv.index("--events") + 1] if "--events" in argv else ""
    if "--events" in argv:
        del argv[argv.index("--events"):argv.index("--events") + 2]
    if not src:                                         # the animation's footsteps, if they are in the output folder or in build/ep18: they are always tuned first
        for p in (os.path.join(out_dir, "events.json"), os.path.join(A6.HERE, "build/ep18/events.json")):
            if os.path.exists(p):
                src = p
                break
    if phys_src is None:
        p = os.path.join(A6.HERE, "build/ep18/phys_events.json")
        phys_src = p if os.path.exists(p) else ""
    tuned = _make_events(src, phys_src, out_dir)
    print(f"events: footsteps from {src or 'none'}, collisions from {phys_src or 'none'} ({len(PHYS_EVENTS)} placed)")
    if tuned:
        argv += ["--events", tuned]
    sys.argv = [sys.argv[0]] + argv
    VOX_DIR[0] = os.path.join(out_dir, "voice")
    os.makedirs(VOX_DIR[0], exist_ok=True)
    _load_speech()
    _TTS_ORIG[0] = A6.tts6
    A6.tts6 = tts15
    A6.place2 = place2_15
    A6.reverb = reverb_18
    A10._CALLS.clear()
    os.environ["STEMS"] = "1"
    A6.main()
    bad = compare_timeline(out)
    if bad:
        print("TIMELINE MISMATCH (not published):")
        for b in bad[:20]:
            print("  ", b)
    else:
        print("timeline: identical to build/ep18/timeline.json (scene starts, lengths, every line's start and end)")
    write_cue_report(out)
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

