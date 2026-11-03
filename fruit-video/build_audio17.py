"""Episode 17 audio: THE MODULE. A copy of the Episode 15 mixer wrapper (build_audio15.py, the final one) with this episode's own paths, scene ids and cue contexts.

Everything build_audio15 explains applies unchanged: the per-line voice cache under <out>/voice/ (Artichoke's laggy call on the training video, Binder's bright and slightly synthetic voice
with a low menace on 'Great! I'll help.', Onion's tremble), the dip of every cue under dialogue (DUCK_DB), the physics foley family (build/ep17/phys_events.json), the footsteps from the
animation (build/ep17/events.json), the loudness trim, peak limiter and AAC guard, the timeline comparison against build/ep17/timeline.json, the dialogue margin of every line.
What is different here: the scene ids (title, assign, video, quiz, end), the stings (the assignment: two sagging tuba notes; the video that never finishes: an office DUN; the quiz: one
orchestral stab under the pending stinger), the low UI error on the quiz, and the Merge theme's sparkle layer in F major whose last chord is a suspension that does not resolve (the title
lands on the click at 2.8 s).

Usage: python3 build_audio17.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep17_sound] [--events build/ep17/events.json] [--phys build/ep17/phys_events.json] [--publish]
  --publish   after the timeline matches build/ep17/timeline.json: copy audio.wav into build/ep17/ and encode audio.m4a
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
SCRIPT = "script_ep17.json"
FXV = "15.4"             # bump to rebuild every treated voice line


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


_PAN6 = (-.8, -.45, -.15, .15, .45, .8)
_DLY6 = (0, 7, 3, 11, 5, 9)


def fx_chor(kokoro, v, say, mono, tag):
    """Six Strawberries, six real voices (the script's own list), each from the same line, a little detuned in speed (as the plain chorus is), spread from far left to far right, each a few
    milliseconds apart as a crowd is, then trimmed exactly as the plain clip was. Returns a (2, len(mono)) clip."""
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
        th = (_PAN6[i % 6] + 1) * np.pi / 4
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


# ---------------------------------------------------------------- the per-line cache (build/ep17_sound/voice/)
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
    if who not in ("arti", "bind", "onion", "broc", "chor"):
        return _Vox(mono, None)
    glitch = [c[1] for c in b.get("sfx", []) if c[0] == "glitch" and isinstance(c[1], (int, float))]
    menace = who == "bind" and say.startswith("Great!")
    key = hashlib.sha1(json.dumps([raw_key, who, FXV, glitch, menace]).encode()).hexdigest()[:16]
    seed = int(hashlib.sha1(tag.encode()).hexdigest()[:6], 16)

    def make():
        if who == "arti":
            return fx_arti(mono, seed, glitch[0] if glitch else None, 1)
        if who == "bind":
            return fx_bind(mono, menace)
        if who == "onion":
            return fx_onion(mono, seed)
        if who == "broc":
            return fx_broc(mono)
        return fx_chor(kokoro, v, say, mono, tag)
    return _Vox(mono, _vox_cache(tag + ".fx", key, make))


# ---------------------------------------------------------------- place2, patched: voices place their treated version; cues dip under speech
DUCK_DB = {   # how far a cue is dipped (dB) while a voice speaks, by effect name; anything missing here is not dipped. The hits the picture lands on are never dipped.
    "peel": 11, "heartbeat": 9, "typing": 8, "keyboard": 8, "sniffle": 8, "sob": 6, "spinner": 7, "counter": 7, "flip": 7, "cranemotor": 9, "cablecreak": 7, "groan": 8,
    "rumble": 8, "sink": 6, "banner": 6, "crowd": 6, "fillpop": 7, "poof": 6, "phys": 12, "step": 7, "grin": 8, "dialog": 7, "glitch": 5, "stars": 7, "cablewhip": 5, "error": 5,
}
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


def place2_15(buf, clip, at, gain=1.0, pan=0.0):
    if isinstance(clip, _Vox):
        _WIN[round(float(at), 4)] = (float(at), len(clip) / SR)
        alt = clip.alt
        _PLACE2(buf, np.asarray(clip) if alt is None else alt, at, gain, pan)
        return
    name = getattr(clip, "sfx", None) or "step"
    db = DUCK_DB.get(name)
    if db and _WIN:
        i = int(round(at * SR))
        n = min(clip.shape[-1], buf.shape[1] - i)
        if n > 0:
            sm = _speech_gate(buf.shape[1])[i:i + n]
            clip = np.asarray(clip)[..., :n] * (1 - (1 - 10 ** (-db / 20)) * sm)
    _PLACE2(buf, np.asarray(clip), at, gain, pan)


# ================================================================ the sheet: clicks, the merge, dialogs, keys
def sfx_click():
    """A crisp mouse click, two tones: the button going down (a bright tick at 2.1 kHz with a burst of 1.8 to 7 kHz) and, 68 ms later, the button coming back up (softer, lower, 1.35 kHz).
    Each call is a hair different (pitch within 4 percent)."""
    k = _nth("click")
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
    return norm6(_edge(x, .0005, .25), .65)


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
KEY = 5                 # the Merge theme's transposition from C in semitones (F major)
STEP15 = .325               # one eighth of the title's bar: the resolution lands 2.6 s after the cue (0.2 to 2.8 s, on the click)
LAND = {0: ((84, 1.0, .9), (86, .8, .9), (91, .85, .6), (98, .4, .6), (72, .6, .9)), 1: ((84, 1.0, .9), (89, .8, .9), (91, .85, .6), (96, .4, .6), (72, .6, .9))}               # the landing chord (C-based MIDI note, level, decay) for the title (0) and for the end card (1)


def sfx_theme15():
    """The Merge theme's sparkle layer (4.4 s), in F major this episode. Eight eighth-notes of an arpeggio (the tonic triad climbing and falling, a glockenspiel over a marimba, climbing in
    level) under a riser of air, a quick shimmer on the subdominant on the last half beat, then the landing on the downbeat 2.6 s in (click): an F suspended-second chord (F G C) that does not resolve. The end card's
    is the same run with its own last chord (F suspended-fourth, still unresolved)."""
    k = _nth("theme15")
    L = 8 * STEP15
    d = L + 2.0
    x = np.zeros(_n(d))
    arp = tuple(m + KEY for m in (72, 76, 79, 84, 79, 76, 79, 84))
    for i, m in enumerate(arp):
        g = .3 + .45 * i / 7
        _place(x, _glass(midi(m + 12), .45, .1, .001) * .5, i * STEP15, g * .8)
        _place(x, _note(midi(m), .3, .09, ((1, 1.0), (4, .3), (10, .08))), i * STEP15, g)
    t = tarr(L)
    _place(x, _tv_filter(noise6(L, 3000 + k), _glide(500, 6500, L), 1.2, "bp") * (t / L) ** 2 * .14, 0.0, 1.0)
    for m in (89 + KEY, 93 + KEY, 96 + KEY):
        _place(x, _glass(midi(m), .5, .12, .001), L - STEP15 * .5, .22)
    for m, g, tau in LAND[1 if k > 0 else 0]:
        _place(x, _glass(midi(m + KEY), 2.0, tau, .002), L, g * .4)
    _place(x, _note(midi(60 + KEY), 1.4, .5, ((1, 1.0), (2, .4), (3, .15))), L, .35)
    _place(x, _glass(midi(103 + KEY), .8, .25, .001), L + .04, .16)
    return norm6(_edge(x, .0004, .4), .75)


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


AVAIL_STING = {'assign': 1.15, 'video': 1.15}   # seconds of sting a scene can hold (its end plus 0.3 s of ring-over into the next scene)


def sfx_sting():
    """The series' stings, one fitted to each place (1.0 to 1.4 s). dock (after 'You are.'): two tuba notes that sag, a 'womp, womp'. model1 (after 'The one with seniority.'): an office
    DUN: a minor-seventh brass chord with a timpani and a call bell glint. model2 (after 'Unassigned!'): a deflating 'wah, wah, waaah' (a muted horn through a moving filter, three notes
    falling a semitone each). replace (after the third 'Pending!'): a fake 'ta-DAH' that lands in the minor. close (with the pending stinger): one orchestral stab, a timpani and a
    cymbal choked dead."""
    k, scene, i = _ctx("sting")
    v = {"assign": 0, "video": 1, "quiz": 4}.get(scene, k % 5)
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
    else:
        _place(x, BA.brass_chord([36, 43, 48, 51, 55], .35, 1500) * np.interp(tarr(.35), [0, .02, .35], [0, 1, .3]), 0.0, 1.0)
        _place(x, _thump(90, 36, .9, .3), 0.0, .9)
        _place(x, _band(3140, .45, 3000, 9000) * np.interp(tarr(.45), [0, .006, .35, .45], [0, 1, .5, 0]) * .5, 0.0, 1.0)
    x = x[:_n(AVAIL_STING.get(scene, 1.5))]
    return norm6(_edge(x, .0005, .3), .8)


# ================================================================ physics foley: one short impact per collision, by the pair of materials
PHYS_EVENTS = []      # the tuned events of name 'phys', in the order the mixer asks for them (filled by main)
LOUD = {"metal": 1.0, "glass": .9, "ceramic": .85, "concrete": 1.0, "wood": 1.0, "plastic": .75, "rubber": .7, "cardboard": .6, "soil": .55, "fabric": .4}
HARD = ("metal", "glass", "ceramic", "concrete", "wood", "plastic", "rubber", "cardboard", "soil", "fabric")


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


_MV = {"wood": _m_wood, "metal": _m_metal, "plastic": _m_plastic, "glass": _m_glass, "ceramic": _m_ceramic, "cardboard": _m_cardboard, "fabric": _m_fabric, "concrete": _m_concrete,
       "rubber": _m_rubber, "soil": _m_soil}


def sfx_phys():
    """One collision from the simulation (build/ep17/phys_events.json), 0.1 to 0.5 s, by the pair of materials 'a+b': each material has its own short voice (wood a knock at 360 Hz, metal a
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
# build/ep17/events.json (footsteps, written by the animation) and build/ep17/phys_events.json (collisions, written from the simulations) are never edited here. This turns them into one tuned
# copy in the output folder (events.tuned.json) which the mixer reads. Footsteps: the tower scenes show the staff small, so their steps are turned down; steps that land on the same instant
# are spread by a few milliseconds. Collisions: gain follows the magnitude, density is capped (at most two events in any 100 ms and fourteen in a second, the loudest kept), every first
# impact of a pair of objects is kept, and nothing is placed within 40 ms of a scripted big cue (the dock impact, the thud, the bonk ...) which would double it.
STEP_SCALE = {"title": 1.0, "assign": .9, "video": .9, "quiz": .9, "end": 1.0}
RUSH_AT = (0.0, .03, .055, .08)
BIG_CUES = ("dockimpact", "thud", "bonk", "sink", "cablewhip", "banner")


def _scene_table():
    tl = json.load(open(os.path.join(HERE, "build/ep17/timeline.json")))
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


def _make_events(src, phys_src, out_dir):
    """Write <out_dir>/events.tuned.json from the footsteps (src) and the collisions (phys_src); returns its path, or '' when there is nothing to place."""
    tab = _scene_table()
    steps = json.load(open(src)) if src and os.path.exists(src) else []
    phys = json.load(open(phys_src)) if phys_src and os.path.exists(phys_src) else []
    ev = _tune_steps(steps, tab) + _select_phys(phys, _scripted(tab))
    PHYS_EVENTS[:] = [e for e in ev if e.get("name") == "phys"]
    if not ev:
        return ""
    dst = os.path.join(out_dir, "events.tuned.json")
    os.makedirs(out_dir, exist_ok=True)
    json.dump(ev, open(dst, "w"), indent=0)
    return dst


# ================================================================ checks: the timeline, the dialogue margin, the loudness and the silences
def compare_timeline(out_dir):
    """Scene starts, scene lengths and every line's start and end of this build against the frozen build/ep17/timeline.json. Returns the list of differences (empty: identical)."""
    a = json.load(open(os.path.join(HERE, out_dir, "timeline.json")))
    b = json.load(open(os.path.join(HERE, "build/ep17/timeline.json")))
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


def measure(out_dir):
    wav = os.path.join(HERE, out_dir, "audio.wav")
    x, sr = sf.read(wav, dtype="float64")
    sp, tp = true_peak_db(x)
    tl = json.load(open(os.path.join(HERE, out_dir, "timeline.json")))
    print(f"measure: {A9._lufs(wav):.2f} LUFS integrated, sample peak {sp:.2f} dBFS, true peak {tp:.2f} dBTP, {len(x) / sr:.2f} s")
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
    per = {}
    for e in PHYS_EVENTS:
        per[_scene_of(e["t"], tab)] = per.get(_scene_of(e["t"], tab), 0) + 1
    lines.append(f"physics foley placed: {len(PHYS_EVENTS)} " + str(per))
    open(os.path.join(HERE, out_dir, "cue_report.txt"), "w").write("\n".join(lines) + "\n")


def publish(out_dir):
    import shutil
    import subprocess
    src = os.path.join(HERE, out_dir, "audio.wav")
    dst = os.path.join(HERE, "build/ep17/audio.wav")
    shutil.copyfile(src, dst)
    subprocess.run(["/usr/bin/ffmpeg", "-y", "-loglevel", "error", "-i", dst, "-c:a", "aac", "-b:a", "192k", os.path.join(HERE, "build/ep17/audio.m4a")], check=True)
    print("published: build/ep17/audio.wav and build/ep17/audio.m4a")


def master(wav):
    """The loudness trim, peak limiter and AAC guard of Episodes 10 to 14: the finished file measures -14.8 LUFS and its AAC encode stays under -1 dBTP."""
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
    for k, v in (("--script", SCRIPT), ("--out", "build/ep17_sound"), ("--var", "TIMELINE_EP17"), ("--music", "build_music17")):
        if k not in argv:
            argv += [k, v]
    out = argv[argv.index("--out") + 1]
    out_dir = os.path.join(A6.HERE, out)
    os.makedirs(out_dir, exist_ok=True)
    src = argv[argv.index("--events") + 1] if "--events" in argv else ""
    if "--events" in argv:
        del argv[argv.index("--events"):argv.index("--events") + 2]
    if not src:                                         # the animation's footsteps, if they are in the output folder or in build/ep17: they are always tuned first
        for p in (os.path.join(out_dir, "events.json"), os.path.join(A6.HERE, "build/ep17/events.json")):
            if os.path.exists(p):
                src = p
                break
    if phys_src is None:
        p = os.path.join(A6.HERE, "build/ep17/phys_events.json")
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
    A10._CALLS.clear()
    os.environ["STEMS"] = "1"
    A6.main()
    bad = compare_timeline(out)
    if bad:
        print("TIMELINE MISMATCH (not published):")
        for b in bad[:20]:
            print("  ", b)
    else:
        print("timeline: identical to build/ep17/timeline.json (scene starts, lengths, every line's start and end)")
    write_cue_report(out)
    dialogue_margin(out)
    for nm in ("stem_voice.wav", "stem_sfx.wav", "stem_music.wav"):
        try:
            os.remove(os.path.join(out_dir, nm))
        except OSError:
            pass
    wav = os.path.join(out_dir, "audio.wav")
    master(wav)
    measure(out)
    if do_publish:
        if bad:
            print("not published: the timeline differs")
            sys.exit(3)
        publish(out)


if __name__ == "__main__":
    main()

