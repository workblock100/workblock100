"""Episode 22 audio: THE SECRET SANTA. A fresh copy of the Episode 15 to 21 mixer wrapper (build_audio21.py, the final one) mapped to this episode: its own paths, scene ids, voices, rooms,
effects and score (build_music22.py). Episode 21's split, whispers, PA, scanner and avalanche are gone; the series' machinery is kept unchanged.

Everything build_audio15 explains applies: the per-line voice cache under <out>/voice/, the dip of every cue under dialogue (DUCK_DB), the footsteps from the animation (build/ep22/events.json),
the collision foley (build/ep22/phys_events.json, now with the soft bodies), the loudness trim, the peak limiter, the AAC guard, the timeline comparison against the frozen build/ep22/timeline.json and
the dialogue margin of every line.

WHAT IS NEW IN EPISODE 22 (scene ids: title, draw, wrap, santa, swap, carol, end)
  THE VOICES    Melon as Santa (a touch more chest; a jolly bounce on 'Ho ho ho!' and on the 'Ho ho' of 'Ho ho... what?': every 'ho' scoops up and back with an accent; 'This is the best Christmas.'
                swings in the sling: a slow pendulum in the field and the level, no pitch change); Brenda inside the closet (boxy, muffled, dry, as in Episode 21); the Moon (Episode 20's window);
                the whole 3-11 at once for 'Pudding!' (five voices, delighted, tight); THE RESIDENTS' CAROL (five old voices, warm, each with its own tremor, pitch and speed, every voice's onset
                aligned to the lead's and the lead's onset placed ON the downbeat: CAROL_PRE; in the day room's small reverb).
  THE CAROL     carol: the score's 112 bpm grid (the intro bar from 4.047 s scene-local, a bar every 2.143 s): the seven lines land on the seven downbeats; carol_onsets() measures every line's onset
                in the voice stem against its downbeat and the cue report lists the offsets.
  SOFT BODIES   the soft events of phys_events.json (name 'soft': paper, chux, fabric, canvas, ribbon, tape, tinsel, nitrile, string; tear, crinkle, hit, slide, squeak, stretch, pop, flap) have a
                designed family per material and kind (sfx_soft), scaled by the magnitude, panned, thinned (density caps, nothing within 60 ms of a scripted cue of the same family, quieter and
                sparser under speech); the rigid 'phys' events (the swap's gift pile) keep the series' material voices with cardboard boxes and a mug.
  THE ROOMS     the station with a radio playing holiday muzak far away (Deck the Halls, O Christmas Tree, We Wish You a Merry Christmas: public-domain tunes on a small speaker), the hall's evening
                hum, the day room with the tree lights' hum and a fireplace video's crackle on the television; sleigh bells on Santa's every move (designed events).

Usage: python3 build_audio22.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep22_sound] [--events build/ep22/events.json] [--phys build/ep22/phys_events.json]
                                [--keep-stems] [--publish]
  --publish     after the timeline matches build/ep22/timeline.json: copy audio.wav into build/ep22/ and encode audio.m4a (and check the decoded m4a's true peak)
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
import build_music22 as M22   # the score
from build_audio import SR, tarr, osc, ar, midi, expdecay
from build_audio6 import norm6, rng6, noise6
from build_audio7 import _smooth_rand, _sum
from build_audio10 import _nth, _burst, _thump, _ping
from build_audio13 import _place, _edge, _lp4, _hp4, _bp4, _tv_filter, _glide, _sin_of, _glass, _fade_end, _call_ding
from build_audio14 import _res, _band, _unit, _key

HERE = A6.HERE
SCRIPT = "script_ep22.json"
EPD = "build/ep22"       # the lead's folder (the frozen timeline and the event files)
FXV = "22.1"             # bump to rebuild every treated voice line


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
        o.who = who          # the speaker's id in the script ('onion', 'rall' ...), so the mixer can place the voice by who it is
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
    """Read a clip through a delay that wanders by +- depth_s seconds at `rate` Hz (vibrato). The length is unchanged."""
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


def _envs(x, n):
    """The 10 ms envelope of x interpolated back to n samples (for treatments that ride the words)."""
    e = _env10(x)
    return np.interp(np.arange(n), np.arange(len(e)) * 480 + 240, e)


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


# ---------------------------------------------------------------- the dialogue de-esser (new in Episode 22)
DEESS = dict(f=5500.0, thr=.35, ratio=3.0, maxcut=8.0, rel=.025, glitch=.025, glitchcut=14.0)
DEESS_V = "3"


def _deess(x):
    """A dialogue de-esser applied to every line before its treatment (new in Episode 22). The voices' loudest sibilants (and a few TTS bursts of 7 kHz ringing) reach the line's own peak in
    the band above 5.5 kHz; the mixer's soft clip turns them into harmonics near the Nyquist frequency and the AAC encoder overshoots on them. The band above 5.5 kHz (split off with a
    zero-phase filter, so that wherever nothing is cut the line is untouched to the sample) is compressed 3:1 where its 1 ms peak exceeds 0.35 of the line's peak, at most 8 dB, an instant
    attack one millisecond ahead and a 25 ms release; an isolated burst over the threshold (nothing else over it within 40 ms) shorter than 25 ms (a TTS glitch, not a sibilant) is
    limited to the threshold outright (up to 14 dB).
    Ordinary consonants are not touched."""
    x = np.asarray(x, dtype=float)
    sp = DEESS
    hi = signal.sosfiltfilt(signal.butter(4, sp["f"] / (SR / 2), "high", output="sos"), x)
    lo = x - hi
    pk = np.max(np.abs(x)) + 1e-12
    hop = 48
    nf = len(x) // hop + 1
    pad = np.zeros(nf * hop)
    pad[:len(x)] = np.abs(hi)
    env = pad.reshape(nf, hop).max(axis=1)
    over = np.maximum(20 * np.log10(env / (sp["thr"] * pk) + 1e-12), 0)
    cut = np.minimum(over * (1 - 1 / sp["ratio"]), sp["maxcut"])
    if not np.any(cut > 0):
        return x
    on = np.concatenate([[False], over > 0, [False]])                          # a TTS glitch (a chirp of 8 to 9 kHz a dozen milliseconds long at the line's full peak) is not a sibilant
    st_, en_ = np.where(on[1:] & ~on[:-1])[0], np.where(~on[1:] & on[:-1])[0]
    seg = []
    for a_, b_ in zip(st_, en_):                                                # clusters: bursts less than 40 ms apart are one sound (a sibilant crosses the threshold in many short bursts)
        if seg and (a_ - seg[-1][1]) * hop < .04 * SR:
            seg[-1][1] = b_
        else:
            seg.append([a_, b_])
    for a_, b_ in seg:
        if (b_ - a_) * hop < sp["glitch"] * SR:
            cut[a_:b_] = np.minimum(over[a_:b_], sp["glitchcut"])
    g_db = np.zeros(nf)
    st, rel = 0.0, np.exp(-hop / (sp["rel"] * SR))
    for i in range(nf):
        st = cut[i] if cut[i] > st else st * rel + cut[i] * (1 - rel)
        g_db[i] = st
    g_db = np.maximum(g_db, np.concatenate([g_db[1:], [0.0]]))
    g = 10 ** (-np.interp(np.arange(len(x)), (np.arange(nf) + .5) * hop, g_db) / 20)
    return lo + hi * g


# ---------------------------------------------------------------- the cast, as Episode 21 left them
def fx_bind(x):
    """Binder: a bright, cheerful assistant, slightly synthetic: a lift at 2.2 to 7.5 kHz, a faint detuned double (a 6 ms delay that flutters at 5.5 Hz: a plastic sheen) and a 10-bit grain."""
    y = x + .24 * _bp4(x, 2200, 7500, 2)
    y = y + .16 * _wobble(_delay(x, 6, 1.0), .0006, 5.5)
    y = np.round(y * 700) / 700
    return _match_active_rms(y, x)


def fx_onion(x, seed):
    """Onion: soft and tearful. A tremble (a 5.8 Hz tremolo at 12 percent and a 0.15 ms vibrato), the top rounded off (-3 dB above 4 kHz) and a breath of air riding the voice (-30 dB)."""
    n = len(x)
    t = np.arange(n) / SR
    y = _wobble(x, .00015, 5.8) * (1 - .12 * (.5 + .5 * np.sin(2 * np.pi * 5.8 * t)))
    y = y - .3 * _hp4(y, 4000)
    y = y + _bp4(rng6(seed).uniform(-1, 1, n), 1500, 6000) * _envs(x, n) * .05
    return _match_active_rms(y, x)


def fx_brenda(x, seed):
    """Brenda (bf_alice, 0.88, four semitones down): frail, dry and close. The close microphone's proximity (+2.5 dB under 250 Hz), a tremor in the pitch and the level (4.4 Hz: 0.2 ms and
    7 percent), the top softened (-2 dB above 5.5 kHz) and a breath riding the voice (-27 dB: she is out of air)."""
    n = len(x)
    t = np.arange(n) / SR
    y = x + .33 * _lp4(x, 250, 2)
    y = _wobble(y, .0002, 4.4) * (1 - .07 * (.5 + .5 * np.sin(2 * np.pi * 4.4 * t + 1)))
    y = y - .22 * _hp4(y, 5500)
    y = y + _bp4(rng6(seed + 11).uniform(-1, 1, n), 1800, 7500) * _envs(x, n) * .075
    return _match_active_rms(y, x)


def fx_res(x):
    """The residents (Mr. Pear, Mrs. Cranberry): the day room's warmth on the voice itself, +2 dB under 260 Hz and the top eased (-2.5 dB above 5 kHz), so old voices sit in lamp light."""
    y = x + .26 * _lp4(x, 260, 2) - .26 * _hp4(x, 5000)
    return _match_active_rms(y, x)


def fx_closet(x, seed):
    """Brenda inside the closet (swap br1, 'It is my candle. From twenty nineteen.'): her frail voice (fx_brenda) through a closed door. Muffled (a 24 dB/oct low-pass at 2.3 kHz, the air above
    it leaking at -20 dB), boxy (the closet's two modes: +4 dB at 420 Hz, +2 dB at 950 Hz), a tiny hard box around her (0.09 s, reflections at 1.1, 2.3 and 3.6 ms) and close (+2 dB under 200 Hz).
    No room (the mixer keeps her dry)."""
    n = len(x)
    y = fx_brenda(x, seed)
    lo = _lp4(y, 2300, 4)
    y = lo + .1 * _bp4(y, 2300, 5000, 1)
    y = y + .58 * _res(y, 420, 2.0) + .26 * _res(y, 950, 2.5)
    ir = _small_ir(seed + 13, rt=.09, pre=.0008, lo=150, hi=2400, taps=((.0011, .7), (.0023, .55), (.0036, .4)))
    y = y + .35 * signal.fftconvolve(y, ir)[:n]
    y = y + .26 * _lp4(y, 200, 2)
    return _match_active_rms(y, x) * 10 ** (-.5 / 20)


def fx_moon(x, seed):
    """The Moon at the window (am_onyx, plus the series' own echoes baked in, as in Episodes 19 and 20): warm, slightly distant, a little air. A warm shelf (+2.5 dB under 200 Hz), the top rolled off
    above 6.5 kHz (-3 dB: glass between him and us), a window's reflections (a 0.7 s tail closed to 3 kHz at -15 dB) and air (-33 dB of 4 to 10 kHz riding the voice)."""
    n = len(x)
    y = x + .3 * _lp4(x, 200, 2) - .3 * _hp4(x, 6500)
    r = rng6(seed + 23)
    nir = int(.7 * SR)
    t = np.arange(nir) / SR
    ir = _lp4(r.uniform(-1, 1, nir), 3000, 2) * np.exp(-6.9 * t / .7)
    ir[:int(.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    y = y + .17 * signal.fftconvolve(y, ir)[:n]
    y = y + _bp4(r.uniform(-1, 1, n), 4000, 10000, 1) * _envs(x, n) * .022
    return _match_active_rms(y, x)


# ---------------------------------------------------------------- Santa (new in Episode 22)
def _syllables(x, prom=6.0, gap=.15, before_gap=False):
    """Sample positions where the voice rises into each syllable: the peaks of the 5 ms envelope (in dB, smoothed over 15 ms) that stand `prom` dB above their surroundings, at least `gap`
    seconds apart; each syllable starts where the envelope last climbed through 10 dB under its peak. `before_gap`: only the syllables before the line's last silence (under -40 dB for 50 ms
    or more: the pause in 'Ho ho... what?')."""
    from scipy.signal import find_peaks
    e = uniform_filter1d(_env10(x, 240), 3)
    edb = 20 * np.log10(e / e.max())
    pk, _ = find_peaks(edb, prominence=prom, distance=max(1, int(gap * 200)))
    if before_gap:
        q = edb < -40
        cut = None
        for i in range(len(q) - 10, 20, -1):
            if q[i:i + 10].all():
                cut = i
                break
        if cut is not None:
            while cut > 0 and q[cut - 1]:
                cut -= 1
            pk = [p for p in pk if p < cut]
    out = []
    for p in pk:
        j = p
        while j > 0 and edb[j - 1] > edb[p] - 10 and p - j < 20:
            j -= 1
        out.append(int(j * 240))
    return out


def fx_santa(x):
    """The Administrator as Santa (am_adam): a touch more bass and chest. +2.5 dB under 220 Hz, a round body at 140 Hz (+1.5 dB), the boxy 400 Hz eased a little (-1 dB)."""
    y = x + .33 * _lp4(x, 220, 2) + .19 * _res(x, 140, 1.2)
    y = y - .11 * _bp4(y, 320, 520, 1)
    return _match_active_rms(y, x)


def fx_santa_ho(x, count=None):
    """'Ho ho ho!' (santa me1) and the 'Ho ho' of 'Ho ho... what?' (santa me3): Santa's chest (fx_santa) and A JOLLY BOUNCE on every 'ho': the syllable is
    read through a delay that swells and returns over 0.2 s (sin squared, 1.3 ms deep), so its pitch scoops up about a third of a semitone and falls back (the delay is back at zero after each
    'ho', so nothing drifts and the clip keeps its length), and a punch on its attack (+2 dB, dying in 90 ms). The 'ho's are found by _syllables (for 'Ho ho... what?' only
    the first two: 'what?' is plain)."""
    y = fx_santa(x)
    n = len(y)
    i = np.arange(n, dtype=float)
    pos = i.copy()
    acc = np.ones(n)
    L, B = int(.2 * SR), .0013 * SR
    for s in _syllables(x)[:count]:
        j = np.arange(s, min(n, s + L))
        u = (j - s) / L
        pos[j] += B * np.sin(np.pi * u) ** 2
        k = np.arange(s, min(n, s + int(.4 * SR)))
        acc[k] += .26 * np.exp(-(k - s) / (.09 * SR))
    z = np.interp(np.clip(pos, 0, n - 1), i, y) * acc
    return _match_active_rms(z, x)


SWAY = dict(t0=23.55, A=.12, tau=1.3, w=2.3, off=(26.6, 27.3))   # the sling's sway in the picture (ep22_santa_sim.js T.sway, scene-local s): theta = A exp(-u/tau) sin(w u), u = t - t0


def _sway(t_loc):
    """The picture's sway angle (rad) at scene-local times t_loc: a kick as he leaves the chair, damped, calmed to nothing by 27.3 s."""
    W = SWAY
    u = np.asarray(t_loc, dtype=float) - W["t0"]
    off = 1 - _smoothstep((np.asarray(t_loc) - W["off"][0]) / (W["off"][1] - W["off"][0]))
    return np.where(u > 0, W["A"] * np.exp(-np.maximum(u, 0) / W["tau"]) * off * np.sin(u * W["w"]), 0.0)


def fx_sling(x, pan=.12):
    """'This is the best Christmas.' (santa me5), Santa swinging in the Hoyer's sling: his chest (fx_santa) and a gentle wobble that is NOT a pitch change, locked to the picture's own sway
    (SWAY: 0.37 Hz, damped): the voice moves across the field with him (up to +-0.25 of pan at the kick, about +-0.1 when he speaks, dying away) and its level and brightness swell a little with
    each swing (+-0.8 dB, +-1 dB above 3 kHz at the kick); all of it gains and a pan: no delay, so no Doppler. Stereo."""
    y = fx_santa(x)
    n = len(y)
    ln, sc = _line("santa", "me5"), _scene_info("santa")
    t0 = (ln["s"] - sc["start"]) if (ln and sc) else 24.632
    th = _sway(t0 + np.arange(n) / SR) / SWAY["A"]                          # -1..1 at the kick
    p = pan - .25 * th                                                       # theta > 0 turns the sling clockwise on screen: he swings to the left
    y = (y + .12 * th * _hp4(y, 3000, 2)) * 10 ** (.8 * th / 20)
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return _match_active_rms(np.stack([y * np.cos(a), y * np.sin(a)]), x)


# ---------------------------------------------------------------- the choruses: every voice spoken on its own, its onset found and aligned to the lead's
def _onset(x, db=-30.0, hop=48):
    """The first sample where the 1 ms RMS of x comes within `db` of its loudest 1 ms frame (the start of the line's sound)."""
    e = _env10(x, hop)
    k = np.where(e > e.max() * 10 ** (db / 20))[0]
    return int(k[0]) * hop if len(k) else 0


def _chorus_parts(kokoro, v, say, tag, plan):
    """Each voice of `plan` [(kokoro voice, speed factor, cents, ...), ...] speaks the line on its own (cached per voice under <out>/voice/<tag>.p<i>), read a few cents sharp or flat (a
    varispeed). Returns [(clip, onset sample)]."""
    parts = []
    for i, (name, sp, cents) in enumerate(p[:3] for p in plan):
        key = hashlib.sha1(json.dumps([name, v["speed"] * sp, v["lang"], say, "p22"]).encode()).hexdigest()[:16]

        def make(name=name, sp=sp):
            samples, sr = kokoro.create(say, voice=name, speed=v["speed"] * sp, lang=v["lang"])
            return signal.resample_poly(np.asarray(samples, dtype=float), SR // 1000, sr // 1000)
        q = _vox_cache(f"{tag}.p{i}", key, make)
        r = 2 ** (cents / 1200)
        if abs(r - 1) > 1e-6:
            q = np.interp(np.arange(0, len(q) - 1, r), np.arange(len(q)), q)
        q = BA.semis_resample(q, v.get("semis", 0)) / (np.max(np.abs(q)) + 1e-12)
        q = _deess(q)
        parts.append((q, _onset(q)))
    return parts


def _aligned(parts, plan, pre, tail=.12, dmax_ms=0.0):
    """Sum the parts in the field with every onset at sample `pre` (plus each voice's own small delay, plan[i][5] ms), stereo, faded `tail` seconds after the longest. Returns (2, n)."""
    L = max(len(q) - o for q, o in parts) + pre + int((dmax_ms + 1) * SR / 1000) + int(tail * SR)
    st = np.zeros((2, L))
    for (q, o), p in zip(parts, plan):
        pan, g = p[3], p[4]
        d = int(p[5] * SR / 1000) if len(p) > 5 else 0
        seg = q[o:]
        a = pre + d
        m = min(len(seg), L - a)
        th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        st[0, a:a + m] += seg[:m] * np.cos(th) * g
        st[1, a:a + m] += seg[:m] * np.sin(th) * g
        lead = q[max(0, o - pre):o]                                                 # the little that comes before the onset (a breath, the start of an F)
        st[0, a - len(lead):a] += lead * np.cos(th) * g
        st[1, a - len(lead):a] += lead * np.sin(th) * g
    k = int(tail * SR)
    st[:, -k:] *= np.linspace(1, 0, k)[None, :]
    return st


def _old(x, seed, rate, depth):
    """An old voice: a tremor in pitch and level (`rate` Hz, `depth` seconds of vibrato, 6 percent of tremolo), the warmth of the day room (fx_res) and a breath riding the words (-28 dB)."""
    n = len(x)
    t = np.arange(n) / SR
    r = rng6(seed)
    ph = r.uniform(0, 6.28)
    rr = rate * (1 + .08 * _smooth_rand(n / SR + .01, seed + 1, .7)[:n])
    y = _wobble(x, depth, rate, ph) * (1 - .06 * (.5 + .5 * np.sin(2 * np.pi * np.cumsum(rr) / SR + ph + 1)))
    y = y + .26 * _lp4(y, 260, 2) - .26 * _hp4(y, 5000)
    return y + _bp4(r.uniform(-1, 1, n), 1500, 6000) * _envs(x, n) * .04


# THE RESIDENTS: (kokoro voice, speed factor, cents, pan, gain, delay ms, tremor Hz, tremor depth s). The lead is Mr. Pear's voice; every onset is the lead's.
CAROL_PLAN = (("am_fenrir", 1.000, 0, .05, 1.00, 0, 4.8, .00022),
              ("am_echo", .975, -11, -.42, .80, 0, 5.4, .00026),
              ("bf_emma", 1.022, 14, .38, .78, 0, 5.9, .00024),
              ("am_puck", .986, -6, -.16, .72, 0, 4.4, .00028),
              ("bf_lily", 1.031, 9, .22, .66, 0, 6.3, .00022))
CAROL_PRE = .03          # the carol's clip starts this long before the lead's onset; the mixer places it this much early, so the onset is ON the downbeat
STAFF_PLAN = (("af_heart", 1.0, 0, -.12, 1.0, 0), ("af_bella", 1.02, 7, .42, .85, 11), ("am_michael", .98, -5, -.36, .8, 6),
              ("af_river", 1.01, 4, .18, .8, 17), ("bf_isabella", .99, -8, .58, .75, 9))
STAFF_PRE = 800          # 'Pudding!' starts where the plain clip does (800 samples of lead-in before its onset)


def fx_carol(kokoro, v, say, mono, tag):
    """THE RESIDENTS' CAROL (carol c1 to c7): five old voices (the script's four, am_fenrir, am_echo, bf_emma and am_puck, and bf_lily), each speaking the line on its own a little slower or faster
    (-2.5 to +3 percent: the words drift apart a little as a small choir's do) and a few cents sharp or flat (-11 to +14), each with its own tremor (4.4 to 6.3 Hz) and breath and the day room's
    warmth, spread from -0.42 to 0.38; EVERY VOICE'S ONSET (the first 1 ms within 30 dB of its loudest) IS PUT ON THE LEAD'S, never smeared, and the lead's onset sits CAROL_PRE into the clip (the
    mixer places it that much early, so the onset lands on the downbeat). As loud as the plain line. Stereo."""
    parts = _chorus_parts(kokoro, v, say, tag, CAROL_PLAN)
    seed = int(hashlib.sha1(tag.encode()).hexdigest()[:6], 16)
    parts = [(_old(q, seed + 7 * i, p[6], p[7]), o) for i, ((q, o), p) in enumerate(zip(parts, CAROL_PLAN))]
    return _match_active_rms(_aligned(parts, CAROL_PLAN, int(CAROL_PRE * SR), .14), mono)


def fx_staff(kokoro, v, say, mono, tag):
    """THE WHOLE 3-11 AT ONCE ('Pudding!', swap st1): the five voices of the script's list, delighted: tight (the onsets on the lead's, then 0 to 17 ms apart, as people who all burst out at once),
    across the station (-0.36 to 0.58), a little bright (+2 dB at 2.5 to 5 kHz, a lift of air above 7 kHz), 1 dB over a single voice. Stereo."""
    parts = _chorus_parts(kokoro, v, say, tag, STAFF_PLAN)
    c = _aligned(parts, STAFF_PLAN, STAFF_PRE, .08, 17)
    c = c + np.stack([.26 * _bp4(c[ch], 2500, 5000, 2) + .1 * _hp4(c[ch], 7000, 2) for ch in range(2)])
    return _match_active_rms(c, mono) * 10 ** (1.0 / 20)


# ---------------------------------------------------------------- which treatment does each line get? (scene, line id) first, then the speaker
LINE_KIND = {("santa", "me1"): "santa_ho", ("santa", "me3"): "santa_ho3", ("santa", "me5"): "sling", ("swap", "br1"): "closet"}
WHO_KIND = {"bind": "bind", "onion": "onion", "brenda": "closet", "pear": "res", "cran": "res", "melon": "santa", "moon": "moon", "staff": "staff", "rall": "carol"}
KIND_V = {"santa": "1", "santa_ho": "2", "santa_ho3": "3", "sling": "2", "carol": "1", "staff": "1", "closet": "2", "moon": "1"}


def line_kind(scene, lid, who):
    """The treatment of a line: the special cases first (keyed by scene and line id), then the speaker's own."""
    return LINE_KIND.get((scene, lid)) or WHO_KIND.get(who, "plain")


def apply_kind(kind, mono, seed, kokoro=None, v=None, say=None, tag=None):
    if kind == "bind":
        return fx_bind(mono)
    if kind == "onion":
        return fx_onion(mono, seed)
    if kind == "brenda":
        return fx_brenda(mono, seed)
    if kind == "res":
        return fx_res(mono)
    if kind == "closet":
        return fx_closet(mono, seed)
    if kind == "moon":
        return fx_moon(mono, seed)
    if kind == "santa":
        return fx_santa(mono)
    if kind == "santa_ho":
        return fx_santa_ho(mono)
    if kind == "santa_ho3":
        return fx_santa_ho(mono, count=2)
    if kind == "sling":
        return fx_sling(mono)
    if kind == "staff":
        return fx_staff(kokoro, v, say, mono, tag)
    if kind == "carol":
        return fx_carol(kokoro, v, say, mono, tag)
    return mono


# ---------------------------------------------------------------- the per-line cache (build/ep22_sound/voice/)
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
DEESSED = {}        # plain lines -> how much the de-esser took out (dB re the line's peak)


def _load_speech():
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    _SPEECH[:] = [(sc["id"], b) for sc in script["scenes"] for b in sc["beats"] if "pause" not in b]


def tts22(kokoro, v, say):
    """The mixer's tts6, replaced: the plain line (cached per line, the same keys as the trial build that produced the frozen timeline), plus the treated version that is placed in the mix
    (cached under the treatment's name; a chorus caches each of its voices too). The _Vox carries who is speaking and the line's tag."""
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
    dx_key = hashlib.sha1(json.dumps([raw_key, "deess", DEESS_V, DEESS], sort_keys=True).encode()).hexdigest()[:16]
    clean = _vox_cache(tag + ".dx", dx_key, lambda: _deess(mono))
    if not np.array_equal(clean, mono):
        DEESSED[tag] = float(20 * np.log10(np.max(np.abs(clean)) / (np.max(np.abs(mono)) + 1e-12)))
    if kind == "plain":
        return _Vox(mono, None if np.array_equal(clean, mono) else clean, who, tag)
    key = hashlib.sha1(json.dumps([dx_key, kind, FXV, KIND_V.get(kind, "")]).encode()).hexdigest()[:16]
    seed = int(hashlib.sha1(tag.encode()).hexdigest()[:6], 16)
    return _Vox(mono, _vox_cache(tag + ".fx", key, lambda: apply_kind(kind, clean, seed, kokoro, v, say, tag)), who, tag)


# ---------------------------------------------------------------- the rooms (impulse responses) and the reverb
ROOM22 = {   # rt: reverb time (s); wet: level of the tail against the dry sound; damp: where the tail is closed off; pre: pre-delay; taps: early reflections (s, gain)
    "title": dict(rt=.36, wet=.08, damp=6000, pre=.005, taps=((.009, .5), (.016, .4), (.027, .3))),     # a gift on a table
    "draw":  dict(rt=.52, wet=.13, damp=5200, pre=.008, taps=((.014, .4), (.027, .3), (.041, .2))),     # the nurses' station, tinsel and a small tree
    "wrap":  dict(rt=.72, wet=.15, damp=5400, pre=.012, taps=((.017, .45), (.031, .35), (.047, .25))),  # the hall at the med cart: hard floor, long walls
    "santa": dict(rt=.55, wet=.14, damp=4600, pre=.010, taps=((.015, .4), (.028, .3), (.043, .2))),     # the day room: carpet, chairs, the tree
    "swap":  dict(rt=.50, wet=.13, damp=5000, pre=.008, taps=((.014, .4), (.027, .3), (.041, .2))),     # the station at night
    "carol": dict(rt=.46, wet=.13, damp=4200, pre=.009, taps=((.013, .38), (.024, .28), (.037, .18))),  # the day room by the tree, lamps low: small and warm
    "end":   dict(rt=.38, wet=.08, damp=5200, pre=.006),                                                # an office
}
_IRS = {}


def _room_ir(name):
    """The stereo impulse response of a room in ROOM22 (cached): decaying noise closed off at `damp`, early reflections, normalised to unit energy as the series' rooms are."""
    if name in _IRS:
        return _IRS[name]
    sp = ROOM22[name]
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


def scene_reverb(sid, seg, a=None, hall=True):
    """The tail of scene `sid`'s dry signal `seg` (2, n) in its own room (ROOM22), scaled by the room's wet level; None for a scene without one."""
    if sid not in ROOM22:
        return None
    ir = _room_ir(sid)
    return np.stack([signal.fftconvolve(seg[c], ir[c], mode="full") for c in range(2)]) * ROOM22[sid]["wet"]


# ---------------------------------------------------------------- place2, patched: voices place their treated version where they are; cues dip under speech
DUCK_DB = {   # how far a cue is dipped (dB) while a voice speaks, by effect name; anything missing here is not dipped. The hits the picture lands on are never dipped.
    "sniffle": 4, "typing": 6, "step": 7, "shuffle": 4, "namewhoosh": 3, "grin": 3, "crinkle": 3, "chuxrustle": 3, "chuxfold": 3, "tapepull": 3, "glovesqueak": 3, "slingrustle": 4,
    "hoyerroll": 4, "hoyerlift": 3, "sleighbells": 3, "santajingle": 5, "balloondrift": 5, "phys": 4, "soft": 5, "giftpile": 3, "doorchime": 3, "jinglebells": 3,
    "bed_title": 3, "bed_draw": 4, "bed_wrap": 4, "bed_santa": 4, "bed_swap": 4, "bed_carol": 3, "bed_end": 2,
}
NOREV = ("bed_title", "bed_draw", "bed_wrap", "bed_santa", "bed_swap", "bed_carol", "bed_end")
DRY_WHO = ()                                         # voices that skip the room entirely
DRY_TAGS = ("swap_br1",)                             # Brenda inside the closet (its box is her room)
DRY_PART = {"moon": .4}                              # this much of the voice is kept out of the room (the Moon is beyond the glass; his window is baked in)
LINE_PAN = {}
_DRY = [None, None]                # [the mixer's dry buffer (the first buffer place2 is given), a buffer of the same size that holds only the NOREV cues and the dry voices]
_WIN = {}
_SM = [None]


def _dry_part(clip):
    if clip.who in DRY_WHO or clip.tag in DRY_TAGS:
        return 1.0
    return DRY_PART.get(clip.who, 0.0)


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


CARPET = ("santa", "carol")


def _scene_at(t):
    """The id of the scene playing at absolute time t (the frozen timeline)."""
    sid = None
    for sc in _timeline()["scenes"]:
        if t >= sc["start"]:
            sid = sc["id"]
    return sid


def _line_at(clip, at):
    """Where a voice's treated clip goes: the carol's lines CAROL_PRE early, so the lead's onset (CAROL_PRE into the clip) lands exactly on the line's start, the downbeat."""
    return at - CAROL_PRE if KINDS.get(clip.tag) == "carol" and clip.alt is not None else at


def reverb_22(seg, room):
    """The mixer's per-scene room (A6.reverb), replaced: each scene has its own room (ROOM22), minus the cues and voices that must stay dry. `seg` is a view of the mixer's dry buffer, so its
    offset in that buffer (the scene's first sample) is read from the memory address; the scene is the one that starts there."""
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


def place2_22(buf, clip, at, gain=1.0, pan=0.0):
    if _DRY[0] is None:                                  # the mixer places the voices into `dry` first
        _DRY[0] = buf
        _DRY[1] = np.zeros_like(buf)
    if isinstance(clip, _Vox):
        _WIN[round(float(at), 4)] = (float(at), len(clip) / SR)
        alt = clip.alt
        v = np.asarray(clip) if alt is None else alt
        pan = LINE_PAN.get(clip.tag, pan)
        at2 = _line_at(clip, at)
        _PLACE2(buf, v, at2, gain, pan)
        dp = _dry_part(clip)
        if dp and buf is _DRY[0]:
            _PLACE2(_DRY[1], v, at2, gain * dp, pan)
        return
    name = getattr(clip, "sfx", None) or "step"
    if name == "step" and _scene_at(at) in CARPET:                 # the day room is carpeted: the mixer's tile step closed off at 1.6 kHz, 3 dB softer, a duller thud
        c = np.asarray(clip, dtype=float)
        c = _lp4(c, 1600, 2) if c.ndim == 1 else np.stack([_lp4(ch, 1600, 2) for ch in c])
        clip = c * 10 ** (-3 / 20)
    db = DUCK_DB.get(name)
    if db and _WIN:
        i = int(round(at * SR))
        n = min(clip.shape[-1], buf.shape[1] - i)
        if n > 0:
            sm = _speech_gate(buf.shape[1])[i:i + n]
            clip = np.asarray(clip)[..., :n] * (1 - (1 - 10 ** (-db / 20)) * sm)
    if name in NOREV and buf is _DRY[0]:                 # the dry buffer holds the same (dipped) clip that the mix does, so that the reverb's input is exactly what is not dry
        _PLACE2(_DRY[1], np.asarray(clip), at, gain, pan)
    _PLACE2(buf, np.asarray(clip), at, gain, pan)


# ================================================================ the frozen timeline and the script's cue times
_TL = {}
_ABS = {}


def _timeline():
    """The frozen build/ep22/timeline.json (scene starts, beats and lines), read once."""
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


def _line(scene, lid):
    return next((x for x in _timeline()["lines"] if x["scene"] == scene and x["id"] == lid), None)


def _word_abs(scene, lid, word, k=0):
    """Absolute time of the k-th word of a line that starts with `word` (the frozen timeline's word times, the captions' own), or None."""
    ln = _line(scene, lid)
    if not ln:
        return None
    ws = [w for w in ln["words"] if str(w[0]).strip(".,!?:;'\"").lower().startswith(word.lower())]
    return ln["s"] + ws[k][1] if len(ws) > k else None


def carol_grid():
    """The carol's downbeats (absolute s): the intro bar's start (the script's `carol.intro` beat) plus k bars (carol.bar), k = 0 .. 8; [] when the script has no carol."""
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    c = script.get("carol")
    if not c:
        return []
    b = _beat_abs(c["scene"], c["intro"])
    return [b[0] + k * c["bar"] for k in range(9)] if b else []


# ================================================================ small clip helpers (the effects' building blocks)
class _P(np.ndarray):
    """A clip that adds like _sum: clips of different lengths are padded with silence."""

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


def _pan_curve(x, pan):
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def _smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def _put2(out, clip, at, g=1.0, pan=0.0):
    """Add a mono (n,) or stereo (2, n) clip into a stereo buffer (2, N) at `at` seconds (equal power)."""
    clip = np.asarray(clip, dtype=float)
    if clip.ndim == 1:
        clip = _ctr(clip, pan)
    i = int(round(at * SR))
    if i < 0:
        clip, i = clip[:, -i:], 0
    m = min(clip.shape[1], out.shape[1] - i)
    if m > 0:
        out[:, i:i + m] += clip[:, :m] * g


def _scrape(seed, d, lo, hi, rough=60.0, shape=None):
    """A pen or a fingernail on paper: a band of noise roughened at `rough` Hz (the fibres), in an envelope `shape` (a sine arch by default)."""
    t = tarr(d)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2 if shape is None else shape
    return _band(seed, d, lo, hi) * (.6 + .4 * np.abs(np.sin(2 * np.pi * rough * t + seed % 7))) * env


def _click(seed, f=3200.0, tau=.004, d=.03, q=6.0):
    """A small hard click: a burst of noise rung through one resonance (a plastic or metal part)."""
    t = tarr(d)
    return _res(_band(seed, d, 1500, 9000) * np.exp(-t / (tau * .5)), f, q) * 2.0 + _band(seed + 1, d, 3000, 10000) * np.exp(-t / (tau * .25)) * .5


def _arch(d, p=1.2):
    t = tarr(d)
    return np.sin(np.pi * np.clip(t / d, 0, 1)) ** p


def _hit_train(seed, d, n, lo, hi, tau, g0, g1, t0=0.0, t1=None, shape=1.0):
    """n small noise ticks scattered between t0 and t1 (denser early when shape > 1), each a band lo..hi that dies in tau: crackle, debris, the fibres of a tear. Returns (2, samples)."""
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


def _crackle(seed, d, rate, lo=1800, hi=8000, tau=(.0006, .0025), g=(.2, 1.0), env=None, mono=True):
    """Paper crackle: clicks at `rate` per second (a Poisson stream whose rate follows `env`, 0..1 per sample), each a band of noise lo..hi dying in tau; the clicks come in little bursts as
    stiff paper buckles. Mono (n,) or stereo."""
    r = rng6(seed)
    n = _n(d)
    out = np.zeros(n) if mono else np.zeros((2, n))
    e = np.ones(n) if env is None else env
    t = r.exponential(1 / max(rate, 1.0))
    j = 0
    while t < d - .005:
        i = int(t * SR)
        if r.uniform() < e[min(i, n - 1)]:
            dd = .008
            c = _band(seed + 11 + j % 97, dd, r.uniform(lo, lo * 1.5), r.uniform(hi * .7, hi)) * expdecay(dd, r.uniform(*tau))
            gg = r.uniform(*g) ** 2
            if mono:
                _place(out, c, t, gg)
            else:
                _put2(out, c, t, gg, r.uniform(-.6, .6))
            if r.uniform() < .3:                                            # a buckle: two or three clicks in a few ms
                for q in range(int(r.integers(1, 3))):
                    t2 = t + .002 + .003 * q
                    if mono:
                        _place(out, c * .6, t2, gg)
                    else:
                        _put2(out, c * .6, t2, gg, r.uniform(-.6, .6))
        t += r.exponential(1 / max(rate, 1.0))
        j += 1
    return out


# ================================================================ title and end: the gift, the ribbon, the paper, the bells; the assignment sheet, the typewriter, the stamp
KEY22 = 5                          # the bookends (and the carol) are in F major
TITLE_BEAT = .5                    # the title's grid (120 bpm, beats on 0.3 + 0.5k): the rips (1.8, 2.3) and the jingle bells (2.8) are on the beat
END_BEAT = .4875                   # the end card's: 0.1 to 4.0 s is two bars (123 bpm) and the stamp is the downbeat of the third


def _jingle(seed, d, n, lo=3200, hi=9000, shape=1.0, sw=.5):
    """Sleigh bells shaken (mono): `n` tiny jingles over `d` seconds, each a crotal bell (a metal ping near lo..hi Hz with the inharmonic partials of a pellet bell, 1.51x and 2.31x) and the rattle
    of its pellet, swelling and fading like a shake (`sw`: where the shake is fullest, 0..1). Its own generator, so the score's bells do not move when an effect is added."""
    r = rng6(seed)
    out = np.zeros(_n(d) + _n(.15))
    for i in range(n):
        u = r.uniform() ** shape
        at = u * max(.01, d - .02)
        f = r.uniform(lo, hi)
        t = tarr(.14)
        c = sum(a_ * np.sin(2 * np.pi * f * k * t + r.uniform(0, 6.28)) * np.exp(-t / (.05 / k)) for k, a_ in ((1, 1.0), (1.51, .5), (2.31, .3)))
        c = c + _bp4(r.uniform(-1, 1, len(t)), 4500, 10500) * np.exp(-t / .004) * .6
        env = np.exp(-((u - sw) / .45) ** 2)
        _place(out, c, at, r.uniform(.3, 1.0) * env)
    return out * .4


def _shakes(seed, times, d=.13, n=9, g=None, lo=3200, hi=9000):
    """A strap of jingle bells shaken on given times (s): each shake a burst of jingles `d` long."""
    T = max(times) + d + .3
    out = np.zeros(_n(T))
    for j, at in enumerate(times):
        _place(out, _jingle(seed + 17 * j, d, n, lo, hi, 1.0, .3), at, 1.0 if g is None else g[j])
    return out


def sfx_theme22():
    """The series' theme dressed for the holidays, as a sparkle layer, in F. TITLE (the cue at 0.2 s; the clip is laid out on the title's grid, 120 bpm, beats on 0.3 + 0.5k): a strap of sleigh bells
    on every beat of the first bar (0.3 to 1.8 s, light), a big shake on each rip (1.8, 2.3) with a glassy flourish (F A C rising on the first, an F major bloom on the second), then sleigh bells on
    beats 1 and 3 of the last bar while the title holds (4.3 to 6.3). END CARD (0.1 s): the theme's arpeggio on glass (F A C F C A C F) in eight beats (123 bpm) over a rising air, a shake on every
    second beat, and on the stamp (4.0) a held F major ninth on glass with one big shake."""
    k = _nth("theme22")
    if k == 0:
        t0 = .2
        x = np.zeros(_n(6.4))
        for j in range(4):
            _place(x, _jingle(3600 + j, .14, 9, sw=.3), .3 + j * TITLE_BEAT - t0, .5 if j % 2 else .7)
        for j, (at, big) in enumerate(((1.8, .8), (2.3, 1.0))):
            _place(x, _jingle(3610 + j, .45, 26, sw=.25), at - t0, big)
        for i, m in enumerate((77, 81, 84)):
            _place(x, _glass(midi(m + 12), .8, .25, .002) * .5, 1.8 - t0 + .06 * i, .32)
        for m, g_ in ((89, 1.0), (93, .8), (96, .7), (101, .5)):
            _place(x, _glass(midi(m), 1.6, .8, .004), 2.3 - t0, g_ * .22)
        for j, at in enumerate((4.3, 5.3, 6.3)):
            if at - t0 < 6.25:
                _place(x, _jingle(3620 + j, .2, 12, sw=.3), at - t0, .45)
        return norm6(_edge(x, .0004, .4), .5)
    step = END_BEAT
    x = np.zeros(_n(8 * step + 3.3))
    arp = tuple(m + KEY22 for m in (72, 76, 79, 84, 79, 76, 79, 84))
    for i, m in enumerate(arp):
        g = .3 + .45 * i / 7
        _place(x, _glass(midi(m + 12), 1.0, .26, .002) * .5, i * step, g * .8)
        if i % 2 == 1:
            _place(x, _jingle(3630 + i, .14, 9, sw=.3), i * step, .35)
    L = 8 * step
    t = tarr(L)
    _place(x, _tv_filter(noise6(L, 3605), _glide(500, 6000, L), 1.2, "bp") * (t / L) ** 2 * .08, 0.0, 1.0)
    for m, g_, tau in ((77, 1.0, 1.6), (84, .8, 1.5), (88, .7, 1.4), (91, .6, 1.3), (93, .5, 1.2)):
        _place(x, _glass(midi(m), 3.3, tau, .004), L, g_ * .38)
    _place(x, _jingle(3640, .5, 30, sw=.2), L, .8)
    return norm6(_edge(x, .0004, .4), .8)


def sfx_ribbonpull():
    """The gift's satin ribbon pulled loose (0.75 s): the ribbon drawn through its own knot (a silky hiss of 2 to 9 kHz with the weave's fine grain, a flutter that speeds up from 90 to 260 Hz as
    the pull does, brightening), the bow's two loops slipping out (two soft 'fwip's, 0.24 and 0.38 s), the knot letting go (a soft 'thup' of cloth, 0.46 s) and the free end whipping away (a quick
    falling whoosh)."""
    x = np.zeros(_n(.8))
    d = .46
    t = tarr(d)
    rate = 90 + 170 * (t / d) ** 1.5
    grain = .55 + .45 * np.abs(np.sin(np.pi * np.cumsum(rate) / SR))
    hiss = _tv_filter(noise6(d, 3650), 2500 + 4000 * (t / d), .7, "bp") * grain * np.interp(t, [0, .05, .4, d], [0, .6, 1, .3])
    _place(x, hiss, 0.0, .8)
    _place(x, _band(3651, d, 5000, 10000) * grain * np.interp(t, [0, .3, d], [0, .3, .6]), 0.0, .25)
    for j, at in enumerate((.24, .38)):
        dd = .07
        tt = tarr(dd)
        _place(x, _tv_filter(noise6(dd, 3652 + j), 1200 * (4500 / 1200) ** (tt / dd), 1.3, "bp") * np.sin(np.pi * np.clip(tt / dd, 0, 1)), at, .55 - .1 * j)
    tt = tarr(.08)
    _place(x, _band(3654, .08, 300, 1400) * np.exp(-tt / .012) * .8 + np.sin(2 * np.pi * 210 * tt) * np.exp(-tt / .02) * .35, .46, .7)
    dd = .2
    tt = tarr(dd)
    _place(x, _tv_filter(noise6(dd, 3655), 4500 * (900 / 4500) ** (tt / dd), 1.0, "bp") * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** 1.5, .5, .5)
    return norm6(_edge(x, .002, .08), .6)


def _tear(seed, d, bright=1.0, size=1.0):
    """Wrapping paper torn (mono): the tear's body (a rough band of 800 Hz to 6 kHz, roughened by the fibres breaking, a little brighter as it speeds up), the fibres themselves (a ragged
    stream of clicks at 250 to 700 a second in clusters: the rip's teeth), a short crinkle of the flap after it and the air of the flap moving (a soft 'fwump' under 400 Hz). `size`: a big sheet
    is lower and fuller."""
    r = rng6(seed)
    n = _n(d + .3)
    x = np.zeros(n)
    t = tarr(d)
    sp = (t / d) ** .7
    env = np.interp(t, [0, .012, d * .75, d], [0, 1, .9, 0]) * (.75 + .25 * _smooth_rand(d, seed + 1, 30)[:len(t)])
    body = _tv_filter(noise6(d, seed + 2), (1500 + 2500 * sp * bright) / size ** .3, .6, "bp") * env
    _place(x, body, 0.0, .7)
    rate = 250 + 450 * sp
    fib = _crackle(seed + 3, d, 520 * bright, 1800, 8500, (.0004, .0018), (.3, 1.0), np.interp(np.arange(_n(d)), [0, _n(d) - 1], [.6, 1.0]))
    _place(x, fib * (rate.mean() / 450), 0.0, .9)
    _place(x, _crackle(seed + 4, .28, 140, 1500, 7000, (.0008, .003), (.1, .6), np.linspace(1, 0, _n(.28)) ** 1.5), d * .8, .5)
    tt = tarr(.18)
    _place(x, _lp4(noise6(.18, seed + 5), 400 / size ** .5, 2) * np.sin(np.pi * np.clip(tt / .18, 0, 1)) * 1.2 * size, d * .6, .5)
    return x


def sfx_paperrip():
    """Wrapping paper torn open (a bright ragged rip and a crinkle, _tear). TITLE (two big tears of thick gift paper: 0.38 and 0.32 s, full, the second a little brighter). SANTA (the search, four
    tears 0.6 s apart: Strawberry tearing through the pile, rough and quick, 0.24 to 0.33 s, each with paper flying off: a flutter). SWAP (five gifts at once, four cues 0.15 s apart: short
    tears, 0.2 to 0.28 s, each a different sheet: different brightness and size)."""
    k, scene, i = _ctx("paperrip")
    r = rng6(3660 + k)
    if scene == "title":
        x = _tear(3661 + k, (.38, .32)[i % 2], (1.0, 1.15)[i % 2], 1.3)
        return norm6(_edge(x, .001, .1), .75)
    if scene == "santa":
        d = r.uniform(.24, .33)
        x = _tear(3670 + k, d, r.uniform(.9, 1.2), 1.0)
        dd = .25
        tt = tarr(dd)
        _place(x, _bp4(noise6(dd, 3675 + k), 500, 3000, 1) * (.55 + .45 * np.sin(2 * np.pi * r.uniform(26, 40) * tt)) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) * .35, d * .7, 1.0)
        return norm6(_edge(x, .001, .08), .72)
    d = r.uniform(.2, .28)
    x = _tear(3680 + k, d, r.uniform(.85, 1.3), r.uniform(.8, 1.15))
    return norm6(_edge(x, .001, .08), .7)


def sfx_jinglebells():
    """A strap of jingle bells shaken. TITLE (2.8 s, 2.0 s): in the rhythm of the score's 'Jingle bells, jingle bells' (shakes at 0, 0.25 and 0.5 s, and again a bar later at 1.0, 1.25, 1.5; the
    long notes get a longer shake). DRAW (the scene opens on Tomato in a Santa hat, 1.0 s): the hat's bells as she bounces in: two quick shakes and a little roll."""
    k, scene, i = _ctx("jinglebells")
    if scene == "title":
        x = np.zeros(_n(2.1))
        for j, (at, d, g) in enumerate(((0, .12, .8), (.25, .12, .8), (.5, .3, 1.0), (1.0, .12, .75), (1.25, .12, .75), (1.5, .4, 1.0))):
            _place(x, _jingle(3690 + j, d, int(8 + 30 * d), sw=.3), at, g)
        return norm6(_edge(x, .001, .2), .6)
    x = np.zeros(_n(1.1))
    for j, (at, d, g) in enumerate(((0, .14, 1.0), (.3, .14, .85), (.55, .4, .6))):
        _place(x, _jingle(3700 + j + 7 * k, d, int(8 + 30 * d), 3600, 9500, sw=.3), at, g)
    return norm6(_edge(x, .001, .2), .55)


def sfx_textding():
    """A text ding (1.0 s): a soft two-note bell, the tonic and the fifth of F: F6 then C7, the second 90 ms after the first, and a tiny sleigh-bell tinkle under it (the title and the end card)."""
    x = np.zeros(_n(1.0))
    _place(x, _call_ding(1396.9, .22), 0.0, .9)
    _place(x, _call_ding(2093.0, .3), .09, .8)
    _place(x, _jingle(3710 + _nth("textding"), .2, 7, 5000, 10000, sw=.3), .02, .3)
    return norm6(_edge(x, .0004, .2), .7)


def _typebar(seed, g=1.0, space=False):
    """One key of a manual typewriter: the key's knock (a 1.2 to 4 kHz clack), the type bar striking the platen (a short 2.6 kHz metal ring and a 180 Hz thud of the rubber roller) and, for the
    space bar, a softer, lower knock with no strike."""
    d = .09
    t = tarr(d)
    if space:
        return (_band(seed, d, 300, 1500) * np.exp(-t / .01) + np.sin(2 * np.pi * 150 * t) * np.exp(-t / .02) * .4) * g * .6
    clack = _band(seed, d, 1200, 4000) * np.exp(-t / .006)
    strike = _ping(2600 * (1 + .03 * (seed % 5 - 2)), d, .012, (1.0, 2.3), (1.0, .3), (1.0, .5)) * .35 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / .015) * .5
    return (clack + strike) * g


def _bell(f, d, tau, a=.002):
    """The series' call-light bell at any length: a sine with the 2.76x and 5.4x partials dying faster, a soft attack."""
    t = tarr(d)
    x = (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / (tau * .45)) + .2 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / (tau * .22))) * np.exp(-t / tau)
    return x * np.minimum(1, t / a)


def sfx_typing():
    """The SECRET SANTA ASSIGNMENTS sheet typing itself in (2.7 s): a manual typewriter, words of four to seven keys at about 85 ms with a space bar between, and at the end of each of the two rows
    the carriage bell (a small bell at 2.1 kHz) and the carriage return (a ratcheting zip of 0.2 s and the carriage's thump)."""
    k = _nth("typing")
    r = rng6(3720 + k)
    d = 2.7
    x = np.zeros(_n(d + .2))
    t = .03
    j = 0
    rows = (1.15, 2.4)
    row = 0
    while t < d - .1:
        if row < len(rows) and t >= rows[row]:
            _place(x, _bell(2100.0, .6, .25) * .35, t, 1.0)
            dd = .2
            tt = tarr(dd)
            rat = _band(3721 + row, dd, 1000, 5000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 55 * tt))) * np.interp(tt, [0, .03, dd], [0, 1, .3])
            _place(x, rat, t + .12, .5)
            _place(x, _thump(160, 90, .12, .03), t + .33, .6)
            t += .5
            row += 1
            continue
        space = j % 6 == 5
        _place(x, _typebar(3730 + 7 * k + j, r.uniform(.55, 1.0), space), t, 1.0)
        t += .085 * r.uniform(.75, 1.3) + (.05 if space else 0)
        j += 1
    return norm6(_edge(_lp4(x, 6000, 2), .001, .08), .6)


def sfx_stamp():
    """A rubber stamp brought down hard on the assignment sheet (APPROVED PER POLICY, 0.6 s): the handle's rush of air (20 ms), the impact (a deep thump that sags from 95 to 58 Hz), the rubber's flat
    slap on paper (a 300 to 2500 Hz burst), the desk knocked (a wooden knock at 180 and 520 Hz, a little room), then the inked rubber's tacky lift (a short 'tchk' at 1 to 4 kHz, 0.13 s later)."""
    k = _nth("stamp")
    x = np.zeros(_n(.6))
    _place(x, _band(3740 + k, .02, 800, 5000) * np.linspace(0, 1, _n(.02)) ** 2 * .25, 0.0, 1.0)
    at = .02
    tt = tarr(.25)
    _place(x, _sin_of(58 + 37 * np.exp(-tt / .03)) * np.exp(-tt / .06) * 1.0, at, 1.0)
    _place(x, (np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / .03) * .6 + np.sin(2 * np.pi * 520 * tt) * np.exp(-tt / .012) * .35), at, 1.0)
    _place(x, _band(3741 + k, .06, 300, 2500) * expdecay(.06, .012) * 1.1, at, 1.0)
    _place(x, _band(3742 + k, .05, 1000, 4000) * expdecay(.05, .006) * .3, at + .13, 1.0)
    x = x + .12 * signal.fftconvolve(x, _small_ir(3743, rt=.25, pre=.004, lo=150, hi=4000))[:len(x)]
    return norm6(_edge(x, .0003, .1), .8)


# ================================================================ draw: the hat, the names, Binder's graph
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


def _sniff(k):
    """Onion's double sniffle: a wet inhale through the nose, twice (a band of noise that moves up through two nasal formants, 700 then 1500 Hz) and a snort of 'nnk' at the end, a few wet crackles."""
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
    return x


def _sob(k, joy=True):
    """A sob in Onion's voice, closed-mouthed: a catch in the throat (a glottal click), then a voiced 'hnn' (a breathy pulse train through a nasal hum's formants, 280 Hz, 1.1 and 2.3 kHz) with a
    tremble. JOY: high, rising (330 to 440 Hz), quick (0.3 s), a laugh caught in a cry."""
    d = .3 if joy else .42
    t = tarr(d)
    f0 = (330 * (440 / 330) ** (t / d)) if joy else (390 * (270 / 390) ** (t / d))
    rate = 7.5 if joy else 5.5
    f = f0 * (1 + .03 * np.sin(2 * np.pi * rate * t))
    src = osc("saw", f, d) * .7 + noise6(d, 1960 + k) * .25
    v = _res(src, 280, 3.0) * 1.0 + _res(src, 1100, 4.0) * .5 + _res(src, 2300, 5.0) * .3
    env = np.interp(t, [0, .03, d * .6, d], [0, 1, .7, 0]) * (1 - .4 * (.5 + .5 * np.sin(2 * np.pi * rate * t + 1)))
    y = _lp4(v * env, 4500, 2)
    tt = tarr(.012)
    y[:len(tt)] += _band(1970 + k, .012, 800, 4000) * np.hanning(len(tt)) * np.max(np.abs(y)) * .6
    return y


def _one_sniff(k):
    """One wet inhale through the nose (0.2 s): a band of noise that climbs through the nasal formants (850 to 1700 Hz) and the 'nnk' at its end."""
    d = .17
    t = tarr(d)
    x = np.zeros(_n(.22))
    _place(x, _tv_filter(noise6(d, 1891 + 2 * k), _glide(850, 1700, d), 2.2, "bp") * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * .85, 0.0, 1.0)
    _place(x, _lp4(osc("saw", 165, .04), 1200, 2) * np.hanning(_n(.04)) * .35, d - .02, 1.0)
    return x


def sfx_sniffle():
    """Onion's tears of joy (she is speaking about policy). DRAW ('Gifts over five dollars must be reported.'): a SOB OF JOY ON THE CUE (the voiced 'hnn' rising like a laugh caught in a cry,
    0.3 s) and one quick wet sniff after it. SWAP ('A candle!'): the sob only (Tomato speaks 0.27 s later)."""
    k, scene, i = _ctx("sniffle")
    if scene is None:
        return norm6(_edge(_sniff(k), .003, .08), .55)
    sb = _sob(k, True)
    out = np.zeros(_n(.6))
    _place(out, sb / (np.max(np.abs(sb)) + 1e-9), 0.0, .85)
    if scene == "draw":
        sn = _one_sniff(k)
        _place(out, sn / (np.max(np.abs(sn)) + 1e-9), .28, .7)
    return norm6(_edge(out, .002, .06), .55)


def sfx_shuffle():
    """The names shaken in Tomato's Santa hat (0.9 s): four shakes at about 5 a second, each a handful of folded paper slips knocking together inside the felt (soft papery ticks of 1 to 5 kHz,
    a dozen per shake, closed off at 4 kHz by the felt) over the hat's own swish (a soft 300 to 1500 Hz rustle of felt that swings with the hand)."""
    r = rng6(3750)
    x = np.zeros(_n(1.0))
    for s, at in enumerate((0.0, .19, .4, .6)):
        for j in range(12):
            dd = .02
            tt = tarr(dd)
            c = _band(3751 + 13 * s + j, dd, r.uniform(1000, 1800), r.uniform(3500, 5500)) * np.exp(-tt / r.uniform(.002, .005))
            _place(x, c, at + r.uniform(0, .09), r.uniform(.25, .8))
        dd = .16
        _place(x, _bp4(noise6(dd, 3790 + s), 300, 1500, 1) * _arch(dd, 1.5) * .45, at, 1.0 - .15 * (s == 3))
    return norm6(_edge(_lp4(x, 4000, 2), .002, .1), .55)


def sfx_namewhoosh():
    """A name flying out of the hat and unfolding in the air (0.4 s, four of them, each its own pitch): a small whoosh (a band of air that rises and falls, the slip's flutter at 30 to 45 Hz)
    and the paper snapping open at the top of its flight (a crisp papery flick at 2 to 7 kHz, 15 ms)."""
    k = _nth("namewhoosh")
    r = rng6(3800 + k)
    x = np.zeros(_n(.42))
    d = .26
    t = tarr(d)
    f = 900 * (1 + 2.2 * np.sin(np.pi * np.clip(t / d, 0, 1))) * (1 + .12 * (k % 4 - 1.5) / 1.5)
    fl = .6 + .4 * np.sin(2 * np.pi * r.uniform(30, 45) * t)
    _place(x, _tv_filter(noise6(d, 3801 + k), f, 1.4, "bp") * fl * _arch(d, 1.3), 0.0, .8)
    tt = tarr(.03)
    _place(x, _band(3805 + k, .03, 2000, 7000) * np.exp(-tt / .004) * 1.0 + _band(3809 + k, .03, 600, 2000) * np.exp(-tt / .006) * .35, .2 + .02 * (k % 2), .7)
    return norm6(_edge(x, .002, .06), .55)


def sfx_ding():
    """DRAW (the assignment graph lands, 1.0 s): Binder's answer: a clear notification ding (C7 and a glassy G7 on top, 40 ms apart, a bell's partials) over a soft digital blip (a 1.05 kHz square
    pip, 25 ms). SANTA ('Merry Christmas!' with her teeth back, 0.8 s): the smile's gleam: a high glass ting (D8) with a quick shimmer of glints above it."""
    k, scene, i = _ctx("ding")
    if scene == "santa":
        x = np.zeros(_n(.8))
        _place(x, _glass(midi(110), .6, .2, .0008, 1.4), 0.0, .9)
        r = rng6(3820)
        for j in range(8):
            _place(x, _glass(r.uniform(6000, 9500), .2, .03, .001), .03 + j * .025, .2 - .015 * j)
        return norm6(_edge(x, .0005, .2), .6)
    x = np.zeros(_n(1.0))
    tt = tarr(.025)
    _place(x, np.sign(np.sin(2 * np.pi * 1050 * tt)) * np.hanning(len(tt)) * .15, 0.0, 1.0)
    _place(x, _bell(2093.0, .9, .35), .01, .8)
    _place(x, _glass(3136.0, .8, .3, .002), .05, .45)
    return norm6(_edge(x, .0004, .2), .65)


def sfx_grin():
    """A menacing glint (1.3 s): a tiny rising bell (E7 then B7, 70 ms apart, each with a little upward slide) and a low sustain that swells under it (A2 and B-flat2 saws, a minor second, through
    a 450 Hz low-pass, with their octave up at 220 Hz so a phone has it), the kind of sound a friendly assistant should not make."""
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


def _soft(notes, d, a=.04, tau=None, lp=1800, saw=.5):
    """A warm chord for the stings: sines and a little saw, a slow attack, closed off at `lp`."""
    t = tarr(d)
    tau = tau or d * .6
    x = sum(np.sin(2 * np.pi * midi(m) * t) + saw * osc("saw", midi(m) * 1.002, d) * .4 for m in notes) / max(1, len(notes))
    return _lp4(x, lp, 2) * np.minimum(1, t / a) * np.exp(-t / tau)


def sfx_sting():
    """The stings, one fitted to each scene (1.2 to 1.6 s).
    draw (after Tomato's 'Merry Christmas!'): the last three notes of Jingle Bells' chorus ('...o-pen sleigh', D E F on pizzicato and a celesta), a shake of bells and a woodblock button.
    wrap (after 'They're nitrile.'): a rubbery button: a squeaky-toy 'bwip' up a fifth, a pizzicato C and G, a soft balloon bump.
    santa (after 'This is the best Christmas.'): a heavenly button: a choir 'ah' and an organ on F major, a harp sweep and a long shake of sleigh bells.
    swap (after 'Pudding!'): a little triumph: a brass F major stab with a timpani and a tambourine-bright shake.
    carol (after the Moon's 'Merry Christmas, three to eleven.'): warm: an F major ninth on soft strings and a celesta, one small bell and the softest shake of bells."""
    k, scene, i = _ctx("sting")
    x = np.zeros(_n(1.7))
    if scene == "draw":
        for j, (at, m) in enumerate(((0.0, 74), (.16, 76), (.32, 77))):
            _place(x, M22.pizz(midi(m - 12), .3), at, .7)
            _place(x, M22.celesta(m + 12, .6, .6), at, .35)
        _place(x, _jingle(3830, .5, 28, sw=.2), .32, .7)
        tt = tarr(.12)
        _place(x, _res(_band(3831, .12, 800, 3000) * np.exp(-tt / .01), 1200, 6) * .8, .32, .6)
    elif scene == "wrap":
        d = .22
        t = tarr(d)
        f = 420 * (1.5 ** np.clip(t / .12, 0, 1)) * (1 + .02 * np.sin(2 * np.pi * 30 * t))
        sq = _res(_sin_of(f) * (.7 + .3 * np.sign(np.sin(2 * np.pi * 45 * t))), 900, 2) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .7
        _place(x, sq, 0.0, .35)
        _place(x, M22.pizz(midi(48), .4), .3, .7)
        _place(x, M22.pizz(midi(55), .4), .3, .5)
        _place(x, _bonk1(3832, .6), .5, .35)
    elif scene == "santa":
        ch = M22.choir([65, 69, 72, 77], 1.4, "a", a=.08, r=.6)
        _place(x, ch[0] * .5 + ch[1] * .5, 0.0, .6)
        _place(x, M22.organ([53, 60, 65, 69, 72], 1.4, .8), 0.0, .35)
        for j, m in enumerate(range(65, 90)):
            if m % 12 in (5, 9, 0):
                _place(x, M22.harp(m, .9, .6), .02 + j * .012, .12)
        _place(x, _jingle(3833, 1.2, 50, sw=.3), .05, .55)
    elif scene == "swap":
        _place(x, M22.brass([53, 57, 60, 65, 69], .45, .006, .2, 2600), 0.0, .7)
        _place(x, M22.timp(87.3, 1.0), 0.0, .6)
        _place(x, _jingle(3834, .6, 34, 4000, 10000, sw=.15), 0.0, .7)
    else:                                                                                   # carol
        d = 1.6
        _place(x, _soft((41, 48, 53, 57, 60, 67), d, .15, .9, 1800), 0.0, 1.0)
        _place(x, M22.celesta(89, 1.4, .5), .05, .25)
        _place(x, _bell(1396.9, 1.4, .6) * .2, .2, 1.0)
        _place(x, _jingle(3835, .6, 14, sw=.4), .1, .25)
    x = x[:_n(1.6)]
    return norm6(_edge(x, .0005, .3), .72)


# ================================================================ wrap: the Chux, the paper tape, the glove balloons
def _plastic_crinkle(seed, d, rate, env=None, lo=600, hi=4500):
    """The Chux's backing (soft polyethylene under a quilted top): a softer, lower crinkle than paper (clicks of 0.6 to 4.5 kHz that ring 1 to 3 ms) over the quilt's smooth rustle."""
    x = _crackle(seed, d, rate, lo, hi, (.001, .003), (.15, .8), env)
    e = np.ones(_n(d)) if env is None else env
    return x + _bp4(noise6(d, seed + 1), 500, 2500, 1) * e * .12


def sfx_chuxrustle():
    """A blue Chux pad shaken out of its fold and draped over the pudding's box (1.1 s): the soft plastic crinkle of the backing as it opens (rising and falling, 0 to 0.55 s), a whump of air as it is
    flapped out (a swell under 500 Hz, 0.3 s), the quilted top's smooth rustle, then the drape: the pad settling over the box ('fff', 0.6 s) and its soft weight on the cardboard (a pat and a hollow
    180 Hz knock)."""
    d = 1.1
    t = tarr(d)
    env = np.interp(t, [0, .08, .3, .55, .7, d], [0, 1, .8, .9, .25, 0])
    x = _plastic_crinkle(3850, d, 160, env)
    _place(x, _lp4(noise6(.35, 3851), 500, 2) * _arch(.35, 1.4) * .9, .12, 1.0)
    _place(x, _bp4(noise6(.3, 3852), 600, 3000, 1) * _arch(.3, 1.0) * .35, .58, 1.0)
    tt = tarr(.1)
    _place(x, _band(3853, .1, 250, 1800) * np.exp(-tt / .015) * .5 + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / .025) * .3, .78, 1.0)
    return norm6(_edge(x, .003, .1), .6)


def sfx_chuxfold():
    """The pad folded round the box (0.55 s, twice: each a little different): a short burst of the backing's crinkle as it bends (0.25 s), the crease pressed flat with a palm (a soft pat and a
    papery crackle), and the box's hollow body answering (a soft 170 to 200 Hz knock)."""
    k = _nth("chuxfold")
    d = .55
    t = tarr(d)
    env = np.interp(t, [0, .04, .2, .3, d], [0, 1, .7, .1, 0])
    x = _plastic_crinkle(3860 + 5 * k, d, 220, env)
    tt = tarr(.09)
    at = .27 + .03 * k
    _place(x, _band(3862 + k, .09, 300, 2200) * np.exp(-tt / .012) * .7 + np.sin(2 * np.pi * (175 + 25 * k) * tt) * np.exp(-tt / .02) * .35, at, 1.0)
    _place(x, _crackle(3864 + k, .1, 300, 1500, 6000, (.0006, .002), (.2, .6)), at + .01, .4)
    return norm6(_edge(x, .002, .06), .58)


def sfx_tapepull():
    """Paper tape peeled off the roll (0.55 s): the adhesive letting go in a rasp of tiny releases (a pulse train that speeds up from 300 to 900 a second as the hand pulls, a band of 1.2 to 6 kHz,
    its pitch climbing), the tape torn off against a thumbnail (a short ragged tear, 50 ms) and pressed onto the pad (a soft pat, a crinkle of the Chux under it)."""
    k = _nth("tapepull")
    r = rng6(3870 + k)
    d = .3 + .05 * k
    t = tarr(d)
    rate = 300 + 600 * (t / d) ** 1.3
    pulse = np.clip(np.sin(2 * np.pi * np.cumsum(rate) / SR), 0, 1) ** 6
    rasp = _tv_filter(noise6(d, 3871 + k), 1800 + 2600 * (t / d), .8, "bp") * (.25 + .75 * pulse) * np.interp(t, [0, .02, d * .85, d], [0, 1, 1, .2])
    x = np.zeros(_n(.6))
    _place(x, rasp, 0.0, .9)
    _place(x, _tear(3873 + k, .05, 1.2, .5), d + .01, .45)
    tt = tarr(.07)
    _place(x, _band(3875 + k, .07, 300, 2000) * np.exp(-tt / .01) * .5, d + .13, 1.0)
    _place(x, _plastic_crinkle(3877 + k, .08, 250, np.linspace(1, 0, _n(.08))), d + .14, .3)
    return norm6(_edge(x, .002, .06), .6)


def _rubber_squeak(seed, d, f0, f1, rough=55.0, q=2.5):
    """Nitrile rubbed on nitrile (stick-slip): a buzzy tone that glides from f0 to f1, chattering at `rough` Hz, through the glove's own resonance."""
    t = tarr(d)
    f = f0 * (f1 / f0) ** (t / d)
    r = rng6(seed)
    ch = .55 + .45 * np.sign(np.sin(2 * np.pi * rough * (1 + .2 * _smooth_rand(d, seed, 8)[:len(t)]) * t + r.uniform(0, 6)))
    src = _sin_of(f) * .8 + .4 * _sin_of(2 * f) + .2 * _sin_of(3 * f)
    return _res(src * ch, (f0 + f1) * .6, q) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .8


def sfx_glovesnap():
    """A purple nitrile glove snapped on (0.4 s): the cuff stretched over the wrist (a short rubbery squeak, 0.12 s, gliding up), then the SNAP of the cuff on the skin (a sharp slap: a burst of
    500 Hz to 4 kHz with a hard 3 ms front, a rubbery 'pk' at 1.6 kHz and a low 'thwp' at 210 Hz)."""
    x = np.zeros(_n(.42))
    _place(x, _rubber_squeak(3880, .12, 450, 700, 60), 0.0, .35)
    tt = tarr(.08)
    at = .14
    _place(x, _band(3881, .08, 500, 4000) * np.exp(-tt / .006) * 1.2, at, 1.0)
    _place(x, np.sin(2 * np.pi * 1600 * tt) * np.exp(-tt / .006) * .45 + np.sin(2 * np.pi * 210 * tt) * np.exp(-tt / .02) * .6, at, 1.0)
    return norm6(_edge(x, .001, .06), .7)


def _finger_pop(seed, f0=260.0):
    """One finger of a glove puffing out: a rubbery 'bwip' (a sine that rises from f0 to 2.6 f0 in 30 ms and dies) and a soft tick."""
    d = .07
    t = tarr(d)
    f = f0 * (1 + 1.6 * (1 - np.exp(-t / .012)))
    return _sin_of(f) * np.exp(-t / .02) * np.minimum(1, t / .002) + _band(seed, d, 1500, 5000) * np.exp(-t / .003) * .25


def sfx_gloveinflate():
    """A breath blown into a glove, the rubber stretching. WRAP (the bow, 1.15 s): a long breath (a breathy 'hoo' of 400 Hz to 3 kHz through the mouth's formants at 1.1 and 2.4 kHz, swelling),
    the nitrile stretching under it (a low creak of stick-slip that climbs from 180 to 420 Hz, in three or four catches) and the five fingers puffing out one by one (rubbery 'bwip's from 0.45 to
    0.85 s, each a little higher). THE BALLOONS (two cues, six gloves each, 1.25 s, stereo around the cue's pan): no breath, a soft hiss of air filling, the stretch creaks overlapping and thirty
    finger pops scattered over 0.9 s."""
    k, scene, i = _ctx("gloveinflate")
    r = rng6(3890 + k)
    if scene == "wrap" and i == 0:
        d = 1.15
        t = tarr(d)
        x = np.zeros(_n(d))
        br = _bp4(noise6(.9, 3891), 400, 3000, 1)
        br = _res(br, 1100, 2.0) * .6 + _res(br, 2400, 3.0) * .3 + br * .3
        _place(x, br * np.interp(tarr(.9), [0, .25, .7, .9], [0, 1, .8, 0]), 0.0, .7)
        for j, (at, dd) in enumerate(((.12, .16), (.33, .14), (.52, .18), (.78, .12))):
            _place(x, _rubber_squeak(3892 + j, dd, 180 + 60 * j, 240 + 60 * j, 35, 2.0), at, .22)
        for j in range(5):
            _place(x, _finger_pop(3897 + j, 230 + 25 * j), .45 + j * .095 + r.uniform(-.01, .01), .5)
        return norm6(_edge(x, .004, .1), .6)
    d = 1.25
    out = np.zeros((2, _n(d)))
    t = tarr(d)
    hs = _bp4(noise6(d, 3900 + k), 2500, 8000, 1) * np.interp(t, [0, .1, .9, d], [0, 1, .7, 0]) * .08
    _put2(out, np.stack([hs, np.roll(hs, 900)]), 0.0, 1.0)
    for g in range(6):
        pan = r.uniform(-.7, .7)
        _put2(out, _rubber_squeak(3902 + 6 * k + g, .2, 190, 380, 35, 2.0), r.uniform(0, .5), .12, pan)
        for j in range(5):
            _put2(out, _finger_pop(3910 + 30 * k + 5 * g + j, r.uniform(230, 360)), r.uniform(.15, 1.05), r.uniform(.2, .45), pan + r.uniform(-.15, .15))
    return norm6(_edge(out, .004, .1), .6)


def sfx_glovesqueak():
    """Nitrile squeaking. WRAP (the bow's knot tied, 0.5 s): two rubbery squeaks as the cuff is twisted and knotted (700 to 1100 Hz, then 900 to 1400) and a tight little snap of the knot. THE
    BALLOONS (0.6 s): the gloves rubbing each other as they rise (three squeaks of different pitches, overlapping, spread)."""
    k, scene, i = _ctx("glovesqueak")
    if scene == "wrap" and i == 0:
        x = np.zeros(_n(.5))
        _place(x, _rubber_squeak(3940, .14, 700, 1100, 60), 0.0, .6)
        _place(x, _rubber_squeak(3941, .12, 900, 1400, 70), .18, .55)
        tt = tarr(.04)
        _place(x, _band(3942, .04, 800, 3500) * np.exp(-tt / .004) * .6, .34, 1.0)
        return norm6(_edge(x, .002, .06), .55)
    out = np.zeros((2, _n(.65)))
    for j, (at, f0, f1, pan) in enumerate(((0.0, 650, 950, -.4), (.12, 900, 1300, .35), (.27, 750, 1050, 0.0))):
        _put2(out, _rubber_squeak(3945 + j, .16, f0, f1, 55 + 10 * j), at, .5, pan)
    return norm6(_edge(out, .002, .08), .55)


def sfx_labelgun():
    """A label gun (0.6 s): the applicator's 'ka-CHUNK' (a 900 Hz plastic knock over a 150 Hz thump, a hard click on top), the trigger's ratchet letting go (three fast clicks), the label torn off
    its backing (a tacky rasp) and pressed onto the pad (a flat pat). DATED, TIMED, INITIALED."""
    x = np.zeros(_n(.6))
    t = tarr(.12)
    knock = np.sin(2 * np.pi * 900 * t) * np.exp(-t / .012) * .6 + _band(3950, .12, 700, 4000) * np.exp(-t / .006) * .7 + np.sin(2 * np.pi * 150 * t) * np.exp(-t / .03) * .5
    _place(x, knock + _click(3951, 2800, .003) * .5, 0.0, 1.0)
    for j in range(3):
        _place(x, _click(3952 + j, 2600 + 300 * j, .002), .045 + j * .017, .3)
    d = .07
    tt = tarr(d)
    _place(x, _band(3956, d, 2000, 6500) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 110 * tt))) * np.minimum(1, tt / .006) * np.exp(-tt / (d * .45)), .1, .45)
    tt = tarr(.06)
    _place(x, _band(3957, .06, 300, 2500) * np.exp(-tt / .008) * .7, .17, 1.0)
    return norm6(_edge(x, .0003, .06), .75)


def _bonk1(seed, g=1.0):
    """One glove balloon bumping a ceiling tile: a rubbery 'bunk' (a damped thump that sags from 240 to 160 Hz), the balloon's squeak on the tile (a 30 ms rub) and the tile's papery 'tff'
    (mineral fibreboard: a soft 800 Hz to 3 kHz puff)."""
    d = .18
    t = tarr(d)
    x = _sin_of(160 + 80 * np.exp(-t / .03)) * np.exp(-t / .05) * np.minimum(1, t / .003)
    x = x + _band(seed, d, 800, 3000) * np.exp(-t / .008) * .35
    x[:_n(.03)] += _rubber_squeak(seed + 1, .03, 500, 650, 70)[: _n(.03)] * .3
    return x * g


def sfx_balloonbonk():
    """Glove balloons bumping along the ceiling tiles (0.75 s): three soft rubbery bumps (_bonk1), each softer than the last, 0.18 and 0.4 s apart, the last a little to one side."""
    x = np.zeros(_n(.8))
    for j, (at, g) in enumerate(((0.0, 1.0), (.18, .65), (.4, .4))):
        _place(x, _bonk1(3960 + j), at, g)
    return norm6(_edge(x, .002, .1), .6)


# ================================================================ santa: the sleigh bells, the gait belt, the teeth, the Hoyer
def sfx_sleighbells():
    """Santa arrives (1.4 s, stereo): a harness of sleigh bells shaken in a trot (four shakes 0.23 s apart, each a little fuller, then a long roll that fades), wide (each shake a little further
    across, as he walks in), the big bells lower (2.6 to 7 kHz) than a hat's."""
    out = np.zeros((2, _n(1.45)))
    for j in range(4):
        at = j * .23
        _put2(out, _jingle(3970 + j, .16, 14, 2600, 7500, sw=.3), at, .7 + .1 * j, -.35 + .2 * j)
    roll = _jingle(3975, .8, 60, 2600, 8000, sw=.25)
    _put2(out, np.stack([roll, np.roll(roll, 700)]) * .7, .92, .8)
    return norm6(_edge(out, .002, .25), .6)


def sfx_santajingle():
    """Santa moves (a designed event, 0.4 s): the bells on his suit jingle once, a small quick shake (2.8 to 8 kHz), each a little different."""
    k = _nth("santajingle")
    r = rng6(3980 + k)
    x = _jingle(3981 + k, r.uniform(.12, .22), int(r.integers(6, 12)), 2800, 8000, sw=.3)
    return norm6(_edge(x, .002, .08), .45)


def sfx_beltbuckle():
    """The gait belt buckled round Santa's middle (0.65 s): the canvas strap fed through the metal buckle (a coarse scrape of 600 Hz to 4 kHz roughened at 70 Hz, 0.25 s, speeding up), the
    buckle's teeth catching (three metal clicks), then the cinch: a short tug (a quick canvas zip) and the buckle's clink (a small steel ping at 2.2 kHz with an inharmonic 3.7 kHz partial)."""
    x = np.zeros(_n(.7))
    d = .25
    t = tarr(d)
    sc = _tv_filter(noise6(d, 3990), 1200 + 1800 * (t / d), .7, "bp") * (.6 + .4 * np.abs(np.sin(2 * np.pi * 70 * (1 + .5 * t / d) * t))) * np.interp(t, [0, .03, d * .8, d], [0, 1, 1, .3])
    _place(x, sc, 0.0, .7)
    for j in range(3):
        _place(x, _click(3991 + j, 3000 + 400 * j, .0025), .22 + .035 * j, .35)
    dd = .08
    tt = tarr(dd)
    _place(x, _band(3995, dd, 800, 4500) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 90 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)), .36, .55)
    _place(x, _ping(2200, .35, .07, (1.0, 1.68, 2.9), (1.0, .5, .25), (1.0, .55, .3)) * .55 + _band(3996, .03, 3000, 9000) * expdecay(.03, .002) * .6, .44, 1.0)
    return norm6(_edge(x, .001, .1), .65)


def sfx_belttug():
    """The belt tugged to check it (0.55 s): the canvas snapping taut ('thwup': a 300 Hz to 2 kHz slap with a 140 Hz body), the strap's creak (a short low stick-slip), the buckle rattling in its
    loop (four small metal ticks) and Santa's bells jingling with the jolt."""
    x = np.zeros(_n(.6))
    tt = tarr(.1)
    _place(x, _band(4000, .1, 300, 2000) * np.exp(-tt / .012) * 1.0 + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / .025) * .5, 0.0, 1.0)
    _place(x, _rubber_squeak(4001, .09, 220, 260, 28, 1.5) * .5, .05, .5)
    for j in range(4):
        _place(x, _ping(2800 + 300 * j, .06, .01, (1.0, 2.2), (1.0, .3), (1.0, .5)), .06 + .035 * j, .2 - .03 * j)
    _place(x, _jingle(4005, .25, 12, 2800, 8000, sw=.2), .04, .45)
    return norm6(_edge(x, .001, .08), .62)


def sfx_dentureclack():
    """Mrs. Cranberry's teeth found in the pile (0.55 s): the denture cup's lid popped off (a plastic 'pok' at 1.3 kHz), then the dentures themselves clacking in the hand, three quick hard clacks
    of acrylic on acrylic (bright clicks of 2 to 5 kHz rung through a hollow 1.25 kHz palate, 70 ms apart, like wind-up chattering teeth)."""
    x = np.zeros(_n(.55))
    tt = tarr(.06)
    _place(x, np.sin(2 * np.pi * 1300 * tt) * np.exp(-tt / .008) * .7 + _band(4010, .06, 900, 4000) * np.exp(-tt / .004) * .6, 0.0, .8)
    for j in range(3):
        c = _res(_band(4011 + j, .04, 2000, 6000) * np.exp(-tarr(.04) / .0025), 1250 + 60 * j, 5) * 1.5 + _click(4014 + j, 3800, .002) * .7
        _place(x, c, .16 + j * .07, 1.0 - .15 * j)
    return norm6(_edge(x, .0005, .08), .7)


def sfx_hoyerroll():
    """The Hoyer lift rolled across the day room (0.65 s): four small casters rumbling (a rolling noise under 260 Hz with the wheels' tick at 9 Hz, slowing), the steel base's legs rattling, one
    caster's short squeak and, at 0.48 s, the brake pedal stepped on (a metal clack)."""
    d = .6
    t = tarr(d)
    rate = 9.0 * np.interp(t, [0, d], [1.0, .6])
    ph = np.cumsum(rate) / SR
    rum = _lp4(noise6(d, 4020), 260, 2) * (.7 + .3 * np.abs(np.sin(np.pi * ph)))
    rat = _hit_train(4021, d, 14, 1500, 5500, .003, .5, .2)[0]
    sq = _sin_of(1550 * (1 + .03 * np.sin(2 * np.pi * ph))) * np.clip(np.sin(2 * np.pi * ph) - .7, 0, 1) * 1.5
    x = (_rms(rum) + _rms(rat) * .35 + _rms(sq) * .08) * np.interp(t, [0, .05, .4, d], [0, 1, .7, .2])
    x = np.concatenate([x, np.zeros(_n(.1))])
    _place(x, _ping(1700, .18, .025, (1.0, 2.4, 3.9), (1.0, .4, .2), (1.0, .5, .3)) * .9 + _band(4022, .05, 1500, 6000) * expdecay(.05, .004), .48, .5)
    return norm6(_edge(x, .01, .08), .58)


def sfx_slingrustle():
    """The Hoyer's sling slid in behind Santa and hooked on (0.6 s): a soft synthetic swish (a smooth band of 800 Hz to 5 kHz, two strokes) and the sling's loops dropped onto the spreader bar's
    hooks (two small steel 'tink's and the plastic clip's click)."""
    x = np.zeros(_n(.6))
    for j, (at, dd) in enumerate(((0.0, .22), (.17, .18))):
        _place(x, _bp4(noise6(dd, 4030 + j), 800, 5000, 1) * _arch(dd, 1.3) * .5, at, 1.0 - .2 * j)
    for j, at in enumerate((.38, .47)):
        _place(x, _ping(2900 + 260 * j, .2, .03, (1.0, 2.6, 4.4), (1.0, .35, .15), (1.0, .5, .3)) * .5 + _click(4033 + j, 2400, .002) * .3, at, 1.0)
    return norm6(_edge(x, .002, .08), .55)


def sfx_hoyerlift():
    """The Hoyer lift raising Santa (1.5 s): the hand control's relay clicks, the electric actuator's motor spins up (a DC motor: a buzzy 105 Hz with its harmonics and a gear whine at 1.4 kHz,
    rising 8 percent in 0.12 s) and STRAINS as his weight comes onto the boom at 0.3 s (the pitch sags 6 percent, the gears grind a little louder), the boom and the sling straps creak under him
    (two stick-slip creaks at 0.35 and 0.85 s), and the motor stops at 1.3 s (a quick spin-down and the relay again)."""
    d = 1.3
    t = tarr(d)
    f0 = 105 * (1 + .08 * (1 - np.exp(-t / .04))) * (1 - .06 * _smoothstep((t - .28) / .15)) * (1 + .006 * _smooth_rand(d, 4040, 6)[:len(t)])
    ph = np.cumsum(f0) / SR
    mot = sum(a * np.sin(2 * np.pi * h * ph) for h, a in ((1, 1.0), (2, .6), (3, .45), (4, .3), (6, .2), (8, .12)))
    whine = np.sin(2 * np.pi * 13.3 * ph) * .25
    grind = _bp4(noise6(d, 4041), 2000, 5000, 1) * (.06 + .05 * _smoothstep((t - .28) / .15))
    env = np.interp(t, [0, .03, d - .1, d], [0, 1, 1, 0])
    x = np.zeros(_n(1.55))
    _place(x, _click(4042, 2600, .003) * .5, 0.0, 1.0)
    _place(x, (mot * .5 + whine + grind) * env, .02, .6)
    for j, (at, dd) in enumerate(((.35, .22), (.85, .18))):
        _place(x, _rubber_squeak(4043 + j, dd, 300 + 40 * j, 380 + 30 * j, 22 + 4 * j, 1.6), at, .3)
    _place(x, _click(4045, 2400, .003) * .45, d + .04, 1.0)
    return norm6(_edge(x, .002, .1), .6)


# ================================================================ swap: the exchange
def sfx_ribbonzip():
    """Curling ribbon zipped off a gift (0.35 s): a fast bright 'zzip' (a band of noise that rises from 2 to 8 kHz in 0.16 s with the ribbon's ridges rattling at 320 Hz) and the freed end curling
    up (a tiny springy boing at 700 Hz that sags)."""
    x = np.zeros(_n(.36))
    d = .16
    t = tarr(d)
    rid = .55 + .45 * np.sign(np.sin(2 * np.pi * 320 * t))
    _place(x, _tv_filter(noise6(d, 4050), 2000 * (8000 / 2000) ** (t / d), 1.1, "bp") * rid * np.interp(t, [0, .01, d * .8, d], [0, 1, .9, 0]), 0.0, .9)
    dd = .15
    tt = tarr(dd)
    _place(x, _sin_of(700 * (1 - .25 * (1 - np.exp(-tt / .05))) * (1 + .05 * np.sin(2 * np.pi * 22 * tt))) * np.exp(-tt / .04) * .25, .17, 1.0)
    return norm6(_edge(x, .001, .05), .6)


def sfx_crinkle():
    """Wrapping paper balled up (0.65 s): a dense crackle (clicks at up to 900 a second that swell and thin as the hands crush it) over the muffled crush of the ball (a 200 to 800 Hz body)."""
    d = .65
    t = tarr(d)
    env = np.interp(t, [0, .05, .35, d], [0, 1, .8, 0])
    x = _crackle(4060, d, 900, 1500, 8000, (.0005, .0022), (.2, 1.0), env)
    x = x + _bp4(noise6(d, 4061), 200, 800, 1) * env * .25
    return norm6(_edge(x, .002, .08), .6)


def _box(seed, size=1.0, full=.3):
    """A gift box hitting another (cardboard): a hollow thump that sags (its pitch from the box's size), the cardboard's 'tok' and the contents shifting inside (`full`: how much rattles)."""
    d = .22
    t = tarr(d)
    f = 220 / size ** .7
    x = _sin_of(f * (1 + .35 * np.exp(-t / .02))) * np.exp(-t / (.04 * size)) + _band(seed, d, 600, 1600) * np.exp(-t / .006) * .7
    x = x + _hit_train(seed + 1, d, 5, 1500, 5000, .003, .4, .1)[0] * full
    return x


def sfx_giftpile():
    """Every gift piled onto Strawberry (1.1 s, stereo): boxes tumbling onto boxes, a dozen hollow cardboard knocks of every size that come faster and then settle (each with its own pan), the
    paper and the bows crackling on them, a mug clinking in its box halfway (a ceramic ping at 1.9 kHz) and a last slither of the pile."""
    r = rng6(4070)
    out = np.zeros((2, _n(1.15)))
    t = 0.0
    for j in range(12):
        size = r.uniform(.6, 1.6)
        _put2(out, _box(4071 + 3 * j, size, r.uniform(.1, .5)), t, r.uniform(.4, .9) * (1 - .3 * (j > 8)), r.uniform(-.6, .6))
        t += .11 * (1 - .4 * np.sin(np.pi * j / 11)) * r.uniform(.6, 1.3)
    _put2(out, _ping(1900, .4, .09, (1.0, 2.3, 4.1), (1.0, .45, .2), (1.0, .5, .3)) * .35, .5, 1.0, .2)
    _put2(out, _crackle(4110, .9, 260, 1500, 7000, (.0006, .002), (.1, .6), mono=False), .02, .5)
    _put2(out, _bp4(noise6(.3, 4111), 500, 3000, 1) * _arch(.3) * .25, .8, 1.0)
    return norm6(_edge(out, .002, .12), .7)


def sfx_giftthump():
    """The last gift lands on the top of the pile (0.45 s): a heavier box (a hollow 110 Hz thunk, a 500 Hz knock of the lid), what is in it bumping (a small rattle) and the pile giving under it
    (a soft crunch of paper)."""
    x = np.zeros(_n(.45))
    x[:_n(.22)] += _box(4120, 1.8, .45)[:_n(.22)] * 1.0
    tt = tarr(.1)
    _place(x, np.sin(2 * np.pi * 500 * tt) * np.exp(-tt / .012) * .4, .004, 1.0)
    _place(x, _crackle(4121, .2, 200, 1200, 6000, (.0008, .003), (.1, .5)), .03, .4)
    return norm6(_edge(x, .001, .08), .72)


# ================================================================ carol: the pitch pipe, the door
def sfx_pitchpipe():
    """A chromatic pitch pipe blown on F (1.05 s): Mr. Pear gives the key. A free reed (the harmonic series of a reed, its body around 1.6 and 2.8 kHz, a little nasal), a breathy attack (the air
    before the reed speaks, 40 ms), the pitch settling up into F4 (349.2 Hz) from 25 cents flat in 70 ms, a faint wavering of breath, 0.9 s, and the breath's end."""
    d = .95
    t = tarr(d)
    f = 349.23 * 2 ** ((-25 * np.exp(-t / .03) + 3 * _smooth_rand(d, 4130, 3)[:len(t)]) / 1200)
    ph = np.cumsum(f) / SR
    reed = sum((1 / k ** .8) * np.sin(2 * np.pi * k * ph) for k in range(1, 16) if 349.23 * k < 9000)
    reed = reed + .5 * _res(reed, 1600, 2.5) + .3 * _res(reed, 2800, 3.0)
    env = np.interp(t, [0, .04, .12, d - .12, d], [0, .5, 1, .9, 0])
    x = np.zeros(_n(1.05))
    _place(x, _bp4(noise6(.12, 4131), 800, 5000, 1) * np.interp(tarr(.12), [0, .04, .12], [0, 1, 0]) * .25, 0.0, 1.0)
    _place(x, reed * env * (1 + .03 * np.sin(2 * np.pi * 4.2 * t)), .02, 1.0)
    _place(x, _bp4(noise6(d, 4132), 1500, 6000, 1) * env * .03, .02, 1.0)
    return norm6(_edge(x, .002, .06), .55)


def sfx_doorchime():
    """The day room's door flung open (Eggplant bursts in, on time, 1.5 s): the unit's entry chime, the shop-door 'ding-dong' (two soft electronic bells a major third apart: E6 then C6), a push of
    air, the door banging its stop (a hollow thump, the glass shivering) and the cold corridor blowing in for a moment."""
    x = np.zeros(_n(1.5))
    for at, f, g in ((0.0, 1318.5, 1.0), (.3, 1046.5, .85)):
        d = 1.1
        t = tarr(d)
        tone = (np.sin(2 * np.pi * f * t) + .12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / .08)) * np.exp(-t / .42) * np.minimum(1, t / .006)
        _place(x, tone, at, g)
    tt = tarr(.3)
    _place(x, _lp4(noise6(.3, 4140), 900, 2) * np.interp(tt, [0, .2, .3], [0, 1, .4]) * .3, 0.0, 1.0)
    _place(x, _thump(150, 95, .14, .025) * .7 + _band(4141, .1, 400, 2500) * expdecay(.1, .01) * .45 + _glass(2350, .3, .05, .001) * .12, .22, 1.0)
    d = 1.2
    t = tarr(d)
    _place(x, _bp4(noise6(d, 4142), 200, 2600, 2) * np.interp(t, [0, .25, .5, d], [0, 1, .45, 0]) * .15, .2, 1.0)
    return norm6(_edge(x, .001, .3), .55)


# ================================================================ the rooms' tones (one bed per scene, a designed event at the scene's start)
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
    """A television in another room: two talkers closed to 250 Hz to 2 kHz, a swell of audience laughter every ten seconds or so."""
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


def _fluoro(d, seed, f0=120.0):
    """Fluorescent tubes overhead: the ballast's buzz (120 Hz and its harmonics to 600 Hz, a slow shimmer in its level)."""
    t = tarr(d)
    b = sum(a * np.sin(2 * np.pi * f0 * h * t + h) for h, a in ((1, 1.0), (2, .45), (3, .3), (4, .16), (5, .1)))
    return b * (1 + .06 * _smooth_rand(d, seed, 1.5))


def _feet_far(d, seed, every=(1.5, 4.0), steps=(4, 9), rate=(.13, .2), lpf=2200):
    """Somebody walking down a hall out of sight: runs of footsteps (tile under rubber soles), closed off as if around a corner."""
    r = rng6(seed)
    out = np.zeros(_n(d))
    t = r.uniform(.2, 1.5)
    while t < d - .8:
        for s in range(int(r.integers(*steps))):
            tt = tarr(.05)
            _place(out, _band(int(seed + t * 13 + s), .05, 300, 3000) * np.exp(-tt / .01) + np.sin(2 * np.pi * 120 * tt) * np.exp(-tt / .015) * .5, t, r.uniform(.5, 1.0))
            t += r.uniform(*rate)
        t += r.uniform(*every)
    return _lp4(out, lpf, 2)


# ---------------------------------------------------------------- the radio far away (holiday muzak; public-domain tunes only)
WISH = ((-1, 60, 1), (0, 65, 1), (1, 65, .5), (1.5, 67, .5), (2, 65, .5), (2.5, 64, .5), (3, 62, 1), (4, 62, 1), (5, 62, 1), (6, 67, 1), (7, 67, .5), (7.5, 69, .5), (8, 67, .5),
        (8.5, 65, .5), (9, 64, 1), (10, 60, 1), (11, 60, 1), (12, 69, 1), (13, 69, .5), (13.5, 70, .5), (14, 69, .5), (14.5, 67, .5), (15, 65, 1), (16, 62, 1), (17, 60, .5), (17.5, 60, .5),
        (18, 62, 1), (19, 67, 1), (20, 64, 1), (21, 65, 2))                                          # We Wish You a Merry Christmas (traditional, English West Country), F major, 3/4
WISH_CH = ((0, (41, 57, 60, 65)), (3, (46, 58, 62, 65)), (6, (43, 59, 62, 65)), (9, (48, 58, 60, 64)), (12, (45, 57, 61, 64)), (15, (46, 58, 62, 65)), (18, (48, 58, 60, 64)), (21, (41, 57, 60, 65)))
DECK = ((0, 72, 1.5), (1.5, 70, .5), (2, 69, 1), (3, 67, 1), (4, 65, 1), (5, 67, 1), (6, 69, 1), (7, 65, 1), (8, 67, .5), (8.5, 69, .5), (9, 70, .5), (9.5, 67, .5), (10, 69, 1.5),
        (11.5, 67, .5), (12, 65, 1), (13, 64, 1), (14, 65, 2))                                       # Deck the Halls (traditional Welsh), F major, 4/4: one phrase ('...fa la la la la, la la la la')
DECK_CH = ((0, (41, 57, 60, 65)), (2, (48, 58, 60, 64)), (4, (41, 57, 60, 65)), (6, (46, 58, 62, 65)), (8, (48, 58, 60, 64)), (10, (41, 57, 60, 65)), (12, (48, 58, 60, 64)), (14, (41, 57, 60, 65)))


def _ep(m, d, g=1.0):
    """The muzak's electric piano: a sine with a soft bell partial (an FM tine), a quick decay."""
    t = tarr(d)
    f = midi(m)
    return (np.sin(2 * np.pi * f * t + 1.2 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / .3)) * np.exp(-t / .9) + .2 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / .12)) * np.minimum(1, t / .004) * g


def _radio(d, seed, tunes=(WISH, DECK), bpm=(138, 120), start=0.0):
    """A radio on a shelf at the far end of the station playing holiday muzak: each tune (melody on an electric piano, the chords held, a round bass on the bar, a brush on the off-beats) in turn,
    with a short gap, from `start` seconds into the first; then the radio itself: a small speaker (350 Hz to 3.2 kHz, a little distortion) far down the room (closed off at 2.3 kHz, a slap)."""
    out = np.zeros(_n(d) + _n(4.0))
    t0 = -start
    j = 0
    while t0 < d:
        tune, ch = ((WISH, WISH_CH), (DECK, DECK_CH))[j % 2] if tunes == (WISH, DECK) else (tunes[j % len(tunes)], WISH_CH)
        bl = 60.0 / bpm[j % len(bpm)]
        length = (max(b + du for b, m, du in tune) + .5) * bl
        for b, m, du in tune:
            at = t0 + (b + 1) * bl
            if 0 <= at < d:
                _place(out, _ep(m + 12, min(1.4, du * bl * 1.4), .5), at, 1.0)
        for b, notes in ch:
            at = t0 + (b + 1) * bl
            if 0 <= at < d:
                _place(out, _ep(notes[0], 1.2, .7) + sum(_ep(m, 1.2, .18) for m in notes[1:]), at, .8)
        k = 0
        while (k + .5) * bl < length:
            at = t0 + (k + 1.5) * bl
            if 0 <= at < d:
                _place(out, _bp4(noise6(.08, seed + 31 + k % 7), 2000, 7000, 1) * expdecay(.08, .02), at, .12)
            k += 1
        t0 += length + 1.2
        j += 1
    x = out[:_n(d)]
    y = _bp4(x, 350, 3200, 2)
    pk = np.max(np.abs(y)) + 1e-9
    y = np.tanh(1.6 * y / pk) * pk
    y = _lp4(y, 2300, 2) + _delay(_lp4(y, 1600, 2), 38, .25)
    return y


# ---------------------------------------------------------------- the day room: the tree's lights, the fireplace video on the television
def _tree_hum(d, seed):
    """The tree's string lights: a cheap transformer's hum (120 Hz and its harmonics, a hair of 60 Hz) and the faint high buzz of its windings (a narrow band at 3.6 kHz that breathes)."""
    t = tarr(d)
    h = sum(a * np.sin(2 * np.pi * 120.0 * k * t + k * 1.3) for k, a in ((1, 1.0), (2, .5), (3, .35), (4, .2), (5, .12))) + .25 * np.sin(2 * np.pi * 60.0 * t)
    bz = _res(noise6(d, seed), 3600, 12.0) * .05 * _wob(d, seed + 1, .3, .4)
    return h * (1 + .05 * _smooth_rand(d, seed + 2, 1.0)) * .2 + bz


def _fire_tv(d, seed):
    """A fireplace video on the day room's television: a cosy fire through a small speaker. A hush of roar (noise under 400 Hz that breathes at 0.3 Hz), a sizzle of sap (3 to 7 kHz in tiny random
    bursts), about eight pops a second of random strength (every tenth a snap with a 700 to 1200 Hz 'tock'), a log shifting now and then; all of it through a television speaker (250 Hz to
    5.5 kHz, a little distortion)."""
    n = _n(d)
    t = np.arange(n) / SR
    r = rng6(seed)
    x = _lp4(noise6(d, seed + 1), 400, 2) * (.5 + .5 * np.sin(2 * np.pi * .3 * t + 1)) * .35
    gate = (_smooth_rand(d, seed + 2, 40) > .45).astype(float)
    x = x + _band(seed + 3, d, 3000, 7000) * gate * .06
    at, j = .05, 0
    while at < d - .06:
        big = j % 10 == 9
        g = r.uniform(.15, 1.0) ** 2 * (1.3 if big else 1.0)
        dd = .05 if big else .02
        c = _band(seed + 10 + j % 50, dd, r.uniform(1200, 2500), r.uniform(3500, 6000)) * expdecay(dd, .012 if big else r.uniform(.0015, .005))
        if big:
            tt = tarr(dd)
            c = c + np.sin(2 * np.pi * r.uniform(700, 1200) * tt) * np.exp(-tt / .008) * .4
        _place(x, c, at, g * .6)
        at += r.exponential(1 / 8.0) + .01
        j += 1
    for a in np.arange(r.uniform(1.5, 3.0), d - .4, 4.7):
        _place(x, _sum(_thump(150, 70, .15, .05) * .8, _band(seed + 70 + int(a), .12, 800, 4500) * expdecay(.12, .03) * .7), a, .6)
    y = _bp4(x, 250, 5500, 2)
    pk = np.max(np.abs(y)) + 1e-9
    return np.tanh(1.3 * y / pk) * pk


def room_title(d, seed=4300):
    """The gift on a table (6.8 s): a room's hush (the air handling, soft) and nothing else; the bells and the paper are the title."""
    return _mix([(_diffuse(lambda s: _rms(_hvac(d, s, 140.0, 320.0), 1.0), seed), 1.0)], d)


def room_draw(d, seed=4400):
    """The nurses' station decorated at 3:15 PM (30.1 s): the air handling, the staff's murmur further down, the string lights' faint hum on the tinsel, a phone now and then, the call light far
    off, and the radio on a shelf at the far end playing holiday muzak (We Wish You a Merry Christmas, then Deck the Halls), on the left."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 150.0, 340.0), 1.0), seed)
    bab = _diffuse(lambda s: _rms(_babble(d, s, 3), 1.0), seed + 11)
    parts = [(air, .9), (bab, .22), (_ctr(_rms(_radio(d, seed + 21, start=3.0), .55), -.55), 1.0), (_ctr(_rms(_tree_hum(d, seed + 31), .05), .3), 1.0),
             (_ctr(_rms(_phone(d, seed + 41, (11.0, 16.0)), .1), .55), 1.0), (_ctr(_rms(_chimes_far(d, seed + 51, (9.0, 13.0)), .08), .3), 1.0),
             (_ctr(_rms(_fluoro(d, seed + 61), .035), 0.0), 1.0)]
    return _mix(parts, d)


def room_wrap(d, seed=4500):
    """The hall at the med cart at 6:00 PM (26.2 s): the hall's evening hum (the air, the fluorescent tubes, a television in a resident's room, a call light far off, somebody walking at the far end)."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 130.0, 300.0), 1.0), seed)
    parts = [(air, .9), (_ctr(_rms(_fluoro(d, seed + 3), .06), .1), 1.0), (_ctr(_rms(_tv_far(d, seed + 5, 1.0), .16), .55), 1.0),
             (_ctr(_rms(_chimes_far(d, seed + 7, (8.0, 12.0)), .09), -.4), 1.0), (_ctr(_rms(_feet_far(d, seed + 9, (3.0, 6.0)), .12), -.5), 1.0)]
    return _mix(parts, d)


def room_santa(d, seed=4600):
    """The day room at 7:30 PM (27.6 s): the tree lit (its lights' hum, on the left), a fireplace video crackling on the television (on the right), the residents in their Santa hats murmuring and
    stirring, a soft hush of air."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 110.0, 260.0), 1.0), seed)
    bab = _diffuse(lambda s: _rms(_babble(d, s, 4, 180, 2400), 1.0), seed + 11)
    parts = [(air, .55), (bab, .25), (_ctr(_rms(_tree_hum(d, seed + 21), .14), -.45), 1.0), (_ctr(_rms(_fire_tv(d, seed + 31), .34), .55), 1.0)]
    return _mix(parts, d)


def room_swap(d, seed=4700):
    """The station at 9:00 PM (26.9 s): quieter: the air, the lights, the string lights' hum, the radio still playing muzak at the far end (lower, the night's volume) and a phone once."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 140.0, 320.0), 1.0), seed)
    parts = [(air, .9), (_ctr(_rms(_radio(d, seed + 21, start=7.5), .4), -.55), 1.0), (_ctr(_rms(_tree_hum(d, seed + 31), .05), .3), 1.0),
             (_ctr(_rms(_phone(d, seed + 41, (14.0, 20.0)), .08), .55), 1.0), (_ctr(_rms(_fluoro(d, seed + 61), .035), 0.0), 1.0)]
    return _mix(parts, d)


def room_carol(d, seed=4800):
    """The day room at 10:55 PM by the tree, lamps low (30.9 s): very quiet: the tree's hum, the fireplace video crackling low on the television, the building's breath."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 110.0, 240.0), 1.0), seed)
    return _mix([(air, .5), (_ctr(_rms(_tree_hum(d, seed + 21), .12), -.35), 1.0), (_ctr(_rms(_fire_tv(d, seed + 31), .22), .5), 1.0)], d)


def room_end(d, seed=4900):
    """The end card: an office's hush so the held chord has a floor."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 130.0, 280.0), 1.0), seed)
    return _mix([(air, 1.0), (_ctr(_rms(_fluoro(d, seed + 3), .06)), 1.0)], d)


BED_DB = {"title": -34, "draw": -26, "wrap": -26, "santa": -25, "swap": -28, "carol": -31, "end": -40}
BED_SCENE = {k: k for k in BED_DB}
ROOM_FN = {"title": room_title, "draw": room_draw, "wrap": room_wrap, "santa": room_santa, "swap": room_swap, "carol": room_carol, "end": room_end}


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


def amb_hum22(d, ramp=None):
    """The script's `hum` ambience (the mixer's own under-layer, very quiet): the building's air at about the level of the old hum."""
    return _rms(_diffuse(lambda s: _rms(_hvac(d, s, 120.0, 300.0), 1.0), 4950), .006)


A6.AMB["hum"] = amb_hum22


# ================================================================ the simulations' foley: the soft bodies (new in Episode 22) and the rigid collisions (the swap's gift pile)
SOFT_EVENTS = []
PHYS_EVENTS = []
SOFT_LOUD = {"paper": 1.0, "chux": .7, "fabric": .55, "canvas": .8, "ribbon": .6, "tape": .75, "tinsel": .35, "nitrile": .8, "string": .45}
KIND_LOUD = {"tear": 1.0, "crinkle": .8, "hit": .9, "slide": .6, "squeak": .8, "stretch": .6, "pop": 1.0, "flap": .55}
SOFT_FAMILY = {   # the scripted cues that already carry a material's sound: a soft event within 60 ms of one of them is not doubled
    "paper": ("paperrip", "crinkle", "ribbonpull", "giftpile", "namewhoosh", "shuffle"), "chux": ("chuxrustle", "chuxfold"), "tape": ("tapepull",),
    "nitrile": ("glovesnap", "gloveinflate", "glovesqueak", "balloonbonk"), "canvas": ("beltbuckle", "belttug"), "fabric": ("slingrustle", "hoyerlift"), "ribbon": ("ribbonzip", "ribbonpull"),
    "tinsel": (), "string": ()}
SOFT_ALIAS = {"felt": "fabric", "wool": "fabric", "sling": "fabric", "gauze": "fabric", "satin": "ribbon", "foil": "tinsel", "latex": "nitrile", "glove": "nitrile",
              "tissue": "paper", "cellophane": "paper", "giftwrap": "paper", "pad": "chux", "cord": "string"}
SOFT_PRI = ("paper", "tape", "nitrile", "chux", "canvas", "ribbon", "tinsel", "fabric", "string")
KIND_PRI = {"tear": ("paper", "tape", "ribbon"), "crinkle": ("paper", "chux", "tinsel"), "squeak": ("nitrile", "canvas", "fabric"), "stretch": ("nitrile", "canvas", "fabric", "tape", "ribbon"),
            "pop": ("nitrile",), "flap": ("paper", "chux", "ribbon", "tinsel", "fabric")}


def _soft_pair(mat, kind=""):
    """(soft material, the other material) of a soft event: soft2d's eventsToFoley joins the body's material and the collider's in alphabetical order ('cardboard+chux' is the Chux on a box), so the
    soft one is picked out of the pair (a scene's own cloth names map onto the families: felt is fabric ...); with two soft materials, the one the kind belongs to."""
    parts = [SOFT_ALIAS.get(m, m) for m in str(mat or "paper").split("+") if m]
    soft = [m for m in parts if m in SOFT_LOUD]
    if not soft:
        return "fabric" if not parts else ("paper" if parts[0] not in _MV else "fabric"), (parts[0] if parts else "")
    pref = tuple(KIND_PRI.get(kind, ())) + SOFT_PRI
    sm = min(soft, key=lambda m: pref.index(m))
    rest = list(parts)
    rest.remove(sm)
    return sm, (rest[0] if rest else "")


def _flutter(seed, d, lo, hi, rate):
    """A light thing fluttering through the air: a band of noise lo..hi shaken at `rate` Hz in an arch."""
    t = tarr(d)
    return _bp4(noise6(d, seed), lo, hi, 1) * (.55 + .45 * np.sin(2 * np.pi * rate * t)) * _arch(d, 1.3)


def _soft_voice(mat, kind, mag, seed, other=""):
    """The designed sound of one soft-body event (mono), by material and kind, its length and brightness set by the magnitude (0..1):
    paper    tear: a short ragged rip (_tear); crinkle (and stretch, squeak, pop): a crackle of 300 to 900 clicks a second; hit: a papery slap; slide: paper on paper or card, a dry scrape;
             flap: a sheet fluttering through the air.
    chux     the blue pad (soft plastic under a quilted top, never tears): crinkle, slide and flap a soft low plastic crinkle with the quilt's rustle; hit: a soft pat.
    fabric   the Hoyer sling, a scarf: slide and flap a soft cloth swish; hit: a soft thump; stretch: the webbing's low creak.
    canvas   the gait belt: slide: the strap through the buckle (a coarse rough scrape); stretch: the strap pulled taut (a creak and a 'thwp'); hit: a strap slap and the metal buckle's clink.
    ribbon   slide and stretch: a bright quick zip; flap: a light flutter; hit, pop: a light tick.
    tape     stretch and slide: the peel's rasp; tear: a tiny tear of paper tape; hit: a sticky pat.
    tinsel   anything: a quiet shimmer (a few tiny metallic glints, 5 to 10 kHz).
    nitrile  squeak: a rubbery squeak; stretch: the rubber's low creak; pop: a finger puffing out ('bwip'), or a glove bursting (mag over 0.85); hit: a rubbery bump (a balloon on a ceiling tile);
             slide: a rub; flap: a rubbery wobble.
    string   flap and slide: a light whip; hit: a tick.
    A hit on a second material (mat 'paper+wood') carries a little of that material's knock (the rigid voices)."""
    r = rng6(seed)
    if mat == "paper":
        if kind == "tear":
            x = _tear(seed, .05 + .22 * mag, r.uniform(.9, 1.25), .7 + .5 * mag)
        elif kind == "hit":
            d = .1 + .06 * mag
            t = tarr(d)
            x = _band(seed, d, 400, 4500) * np.exp(-t / (.006 + .006 * mag)) + _crackle(seed + 1, d, 300, 1500, 7000, (.0005, .002), (.1, .5)) * .5
        elif kind == "slide":
            x = _scrape(seed, .08 + .25 * mag, 1200, 6000, 45)
        elif kind == "flap":
            x = _flutter(seed, .12 + .2 * mag, 500, 3500, r.uniform(25, 40))
        else:
            d = .06 + .2 * mag
            x = _crackle(seed, d, 300 + 600 * mag, 1600, 8000, (.0005, .002), (.2, 1.0), _arch(d, .8))
    elif mat == "chux":
        if kind == "hit":
            d = .12
            t = tarr(d)
            x = _band(seed, d, 250, 1800) * np.exp(-t / .012) + np.sin(2 * np.pi * 170 * t) * np.exp(-t / .025) * .3
        else:
            d = .08 + .25 * mag
            x = _plastic_crinkle(seed, d, 120 + 260 * mag, _arch(d, 1.0)) * (.7 if kind == "flap" else 1.0)
    elif mat == "fabric":
        if kind == "hit":
            d = .14
            t = tarr(d)
            x = _lp4(noise6(d, seed), 450, 2) * np.exp(-t / .03) + np.sin(2 * np.pi * 95 * t) * np.exp(-t / .03) * .5
        elif kind == "stretch":
            x = _rubber_squeak(seed, .1 + .15 * mag, 160, 210, 20, 1.4) * .7
        else:
            d = .1 + .3 * mag
            x = _bp4(noise6(d, seed), 300, 3000, 1) * _arch(d, 1.2) * (.6 + .4 * _smooth_rand(d, seed + 1, 18)[:_n(d)])
    elif mat == "canvas":
        if kind == "slide":
            d = .08 + .2 * mag
            t = tarr(d)
            x = _bp4(noise6(d, seed), 500, 3500, 1) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 70 * t))) * _arch(d, 1.0)
        elif kind == "stretch":
            d = .1
            t = tarr(d)
            x = _rubber_squeak(seed, .09, 200, 240, 26, 1.5) * .6 + _band(seed + 1, d, 300, 1800) * np.exp(-t / .01) * .7
        else:
            d = .25
            t = tarr(d)
            x = _band(seed, d, 300, 2500) * np.exp(-t / .006)
            if other == "metal" or mag > .5:
                x = x + _ping(2200 * r.uniform(.95, 1.05), d, .05, (1.0, 1.68, 2.9), (1.0, .5, .25), (1.0, .55, .3)) * .35
    elif mat == "ribbon":
        if kind in ("slide", "stretch"):
            d = .06 + .12 * mag
            t = tarr(d)
            x = _tv_filter(noise6(d, seed), 2000 * (6000 / 2000) ** (t / d), 1.1, "bp") * (.6 + .4 * np.sign(np.sin(2 * np.pi * 300 * t))) * _arch(d, .8)
        elif kind == "flap":
            x = _flutter(seed, .1 + .15 * mag, 2000, 7000, r.uniform(40, 60))
        else:
            x = _click(seed, 2600 * r.uniform(.9, 1.1), .002) * .5
    elif mat == "tape":
        if kind == "tear":
            x = _tear(seed, .04 + .05 * mag, 1.2, .5)
        elif kind == "hit":
            d = .08
            t = tarr(d)
            x = _band(seed, d, 300, 2000) * np.exp(-t / .01) + _band(seed + 1, d, 2000, 6000) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 110 * t))) * np.exp(-t / .02) * .3
        else:
            d = .08 + .2 * mag
            t = tarr(d)
            pulse = np.clip(np.sin(2 * np.pi * np.cumsum(300 + 500 * t / d) / SR), 0, 1) ** 6
            x = _bp4(noise6(d, seed), 1200, 6000, 1) * (.25 + .75 * pulse) * _arch(d, .7)
    elif mat == "tinsel":
        d = .3
        x = np.zeros(_n(d))
        for j in range(int(3 + 5 * mag)):
            _place(x, _glass(r.uniform(5000, 10000), .2, .03, .001), r.uniform(0, .15), r.uniform(.2, .6))
    elif mat == "nitrile":
        if kind == "pop":
            if mag > .85:
                d = .2
                t = tarr(d)
                x = _band(seed, d, 300, 8000) * np.exp(-t / .006) * 1.5 + _sin_of(120 + 200 * np.exp(-t / .01)) * np.exp(-t / .03) * .6
            else:
                x = _finger_pop(seed, r.uniform(220, 380))
        elif kind == "hit":
            x = _bonk1(seed, 1.0)
        elif kind == "stretch":
            x = _rubber_squeak(seed, .1 + .15 * mag, 180, 320, 30, 1.8)
        elif kind == "flap":
            d = .15
            t = tarr(d)
            x = _sin_of(150 * (1 + .1 * np.sin(2 * np.pi * 12 * t))) * _arch(d, 1.0) * .6
        else:
            f0 = r.uniform(600, 1000)
            x = _rubber_squeak(seed, .06 + .2 * mag, f0, f0 * r.uniform(1.15, 1.5), r.uniform(45, 75))
    else:                                                                                            # string (and anything not in the list)
        if kind == "hit":
            x = _click(seed, 2000 * r.uniform(.8, 1.2), .002) * .4
        else:
            d = .08 + .1 * mag
            t = tarr(d)
            x = _tv_filter(noise6(d, seed), 3000 * (1200 / 3000) ** (t / d), 1.2, "bp") * _arch(d, 1.0)
    other = {"felt": "fabric", "skin": "fabric"}.get(other, other)
    if other in _MV and kind == "hit":
        x = _sum(np.asarray(x) * .75, _unit(_MV[other](1.2 - .4 * mag, .7 + .5 * mag, seed + 3)) * np.max(np.abs(x)) * .35)
    return np.asarray(x, dtype=float)


def sfx_soft():
    """One soft-body event from the simulations (build/ep22/phys_events.json, name 'soft'): its material's and kind's designed sound (_soft_voice), a seed from the event's index and time so
    every repeat is different. The level is the event's (set by _select_soft from the magnitude, the material and the kind); the pan is the event's."""
    k = _nth("soft")
    ev = SOFT_EVENTS[k] if k < len(SOFT_EVENTS) else {"mat": "paper", "k": "crinkle", "mag": .3, "t": k}
    kind = str(ev.get("k", "hit"))
    sm, other = _soft_pair(ev.get("mat", "paper"), kind)
    seed = 5000 + 7 * k + int(ev.get("t", 0) * 1000) % 997
    x = _soft_voice(sm, kind, float(np.clip(ev.get("mag", .3), 0, 1)), seed, other)
    return norm6(_edge(x, .0004, .02), .6)


def _select_soft(ev, scripted, lines):
    """Choose the soft events that are heard: every first event of an object and kind, then the strongest; nothing within 60 ms of a scripted cue of the same material's family (the designed
    cue carries it); under a spoken line only the strong ones (magnitude 0.3 or more), a little quieter; at most two within 40 ms, twelve in any second and five per material and kind in any
    second. The level: (0.03 + 0.3 mag^1.2) times the material's and the kind's loudness."""
    ev = sorted((dict(e) for e in ev if e.get("name") == "soft"), key=lambda e: e["t"])
    seen, first = set(), set()
    for i, e in enumerate(ev):
        key = (e.get("tag") or e.get("id") or e.get("mat"), e.get("k"))
        if key not in seen:
            seen.add(key)
            first.add(i)
    fam = {}
    for t, nm, g, p in scripted:
        for m, names in SOFT_FAMILY.items():
            if nm in names:
                fam.setdefault(m, []).append(t)
    talk = [(ln["s"] - .05, ln["e"] + .05) for ln in lines]
    order = sorted(range(len(ev)), key=lambda i: (i not in first, -ev[i].get("mag", 0)))
    keep = []
    for i in order:
        e = ev[i]
        mat = _soft_pair(e.get("mat"), e.get("k"))[0]
        mag = float(e.get("mag", 0))
        if any(abs(e["t"] - t) < .06 for t in fam.get(mat, ())):
            continue
        if mag < .04 and i not in first:
            continue
        under = any(a <= e["t"] <= b for a, b in talk)
        if under and mag < .3:
            continue
        near = [j for j in keep if abs(ev[j]["t"] - e["t"]) < .04]
        sec = [j for j in keep if abs(ev[j]["t"] - e["t"]) < .5]
        same = [j for j in sec if ev[j].get("k") == e.get("k") and _soft_pair(ev[j].get("mat"), ev[j].get("k"))[0] == mat]
        if len(near) >= 2 or len(sec) >= 12 or len(same) >= 5:
            continue
        keep.append(i)
    out = []
    for i in sorted(keep, key=lambda j: ev[j]["t"]):
        e = ev[i]
        mat = _soft_pair(e.get("mat"), e.get("k"))[0]
        mag = float(e.get("mag", .3))
        under = any(a <= e["t"] <= b for a, b in talk)
        vol = (.03 + .3 * mag ** 1.2) * SOFT_LOUD.get(mat, .5) * KIND_LOUD.get(e.get("k"), .7) * (.6 if under else 1.0)
        out.append({"t": round(e["t"], 3), "name": "soft", "mat": e.get("mat", "paper"), "k": e.get("k", "hit"), "mag": round(mag, 3), "tag": e.get("tag", ""),
                    "vol": round(min(.5, vol), 4), "pan": float(np.clip(e.get("pan", 0), -1, 1)), "room": "hall"})
    return out


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
    """A gift box: a hollow cardboard knock (a dull flap of noise under 1.3 kHz and the box's body at 170 Hz) and the paper on it (a short papery tick)."""
    d = .13 * ds
    t = tarr(d)
    return (_lp4(noise6(d, seed), 1300, 2) * np.exp(-t / (.02 * ds)) + np.sin(2 * np.pi * 170 * ps * t) * np.exp(-t / .02) * .5
            + _band(seed + 1, d, 2000, 6000) * np.exp(-t / .003) * .25)


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


def _m_paper(ps, ds, seed):
    d = .14 * ds
    t = tarr(d)
    return _band(seed, d, 1500, 7500) * np.exp(-t / (.02 * ds)) * .9 + _lp4(noise6(d, seed + 3), 500, 2) * np.exp(-t / .012) * .3 + _band(seed + 5, d, 300, 1200) * np.exp(-t / (.04 * ds)) * .25


def _m_tile(ps, ds, seed):
    d = .2 * ds
    t = tarr(d)
    return np.sin(2 * np.pi * 1300 * ps * t) * np.exp(-t / .008) + _band(seed, d, 800, 3500) * np.exp(-t / .004) * .8 + _sin_of((50 + 50 * np.exp(-t / .03)) * ps) * np.exp(-t / .05) * .6


_MV = {"tile": _m_tile, "paper": _m_paper, "leaf": _m_paper, "wood": _m_wood, "metal": _m_metal, "plastic": _m_plastic, "glass": _m_glass, "ceramic": _m_ceramic, "cardboard": _m_cardboard,
       "fabric": _m_fabric, "concrete": _m_concrete, "rubber": _m_rubber, "soil": _m_paper, "felt": _m_fabric, "skin": _m_fabric}
LOUD.update({"felt": .4, "skin": .45})


def sfx_phys():
    """One rigid collision from the simulation (build/ep22/phys_events.json, name 'phys': the swap's gift pile), 0.1 to 0.5 s, by the pair of materials 'a+b' (the series' voices: wood a knock,
    metal a ring, plastic a tick, glass a ping, ceramic a clink (the mug), cardboard a hollow box knock with its paper, fabric a soft thump ...); the harder of the two carries 60 percent. The
    magnitude sets the length, lowers the pitch (a heavy box is lower) and, through the event's own gain, the level. A 'slide' is a scrape (a box sliding off the pile)."""
    k = _nth("phys")
    ev = PHYS_EVENTS[k] if k < len(PHYS_EVENTS) else {"mat": "cardboard+cardboard", "mag": .3, "t": k}
    mag = float(np.clip(ev.get("mag", .3), 0, 1))
    seed = 5400 + 3 * k + int(ev.get("t", 0) * 1000) % 997
    r = rng6(seed)
    if ev.get("k") == "slide":
        d = .2 + .3 * mag
        t = tarr(d)
        x = _band(seed, d, 400, 2600) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 38 * t))) * np.sin(np.pi * np.clip(t / d, 0, 1))
        return norm6(_edge(x, .01, .05), .6)
    ps = (1.35 - .6 * mag) * r.uniform(.94, 1.06)
    ds = .75 + .6 * mag
    mats = [m for m in str(ev.get("mat", "cardboard+cardboard")).split("+") if m in _MV] or ["cardboard"]
    if len(mats) == 1:
        mats = mats * 2
    a, b = sorted(mats[:2], key=lambda m: HARD.index(m) if m in HARD else len(HARD))
    ca = _unit(_MV[a](ps, ds, seed)) * .6
    cb = _unit(_MV[b](ps * r.uniform(.9, 1.1), ds, seed + 17)) * .4
    loud = (LOUD.get(a, .6) + LOUD.get(b, .6)) / 2
    n = max(len(ca), len(cb))
    x = np.zeros(n)
    x[:len(ca)] += ca
    x[:len(cb)] += cb
    if any(w in str(ev.get("tag", "")) for w in ("head", "nurse")):           # a gift landing on Strawberry: the box's knock and a soft comic bump (a thump that sags from 230 to 150 Hz)
        d = .16
        t = tarr(d)
        bump = _sin_of(150 + 80 * np.exp(-t / .025)) * np.exp(-t / .045) * np.minimum(1, t / .002)
        x = _sum(x * .7, _unit(bump) * .6)
    return norm6(_edge(x * loud, .0003, .02), .7)


def _select_phys(phys, scripted):
    """Choose the rigid collisions that are heard: every first impact of a pair of objects, then the loudest, with the density cap (at most three within 50 ms, twenty in any one second) and the
    40 ms rule (nothing within 40 ms of a scripted hit the picture lands on)."""
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
        if len(near) >= 3 or len(sec) >= 20:
            continue
        keep.append(i)
    out = []
    for i in sorted(keep, key=lambda j: ev[j]["t"]):
        e = ev[i]
        mag = float(e.get("mag", .3))
        out.append({"t": round(e["t"], 3), "name": "phys", "mat": e.get("mat", "cardboard+cardboard"), "mag": round(mag, 3), "k": e.get("k", "hit"), "tag": e.get("tag", ""),
                    "vol": round(min(.8, (.05 + .30 * mag ** 1.3) * (.6 if e.get("k") == "slide" else 1.0)), 4), "pan": float(np.clip(e.get("pan", 0), -1, 1)), "room": "hall"})
    return out


def sfx_hatjingle():
    """The bell on the pom of Tomato's Santa hat (a designed event on her lines, 0.35 s): one small jingle bell and a tinkle, light and high."""
    k = _nth("hatjingle")
    x = _jingle(5500 + k, .1, 5, 4500, 9500, sw=.2)
    return norm6(_edge(x, .001, .08), .4)


def sfx_balloondrift():
    """A glove balloon drifting along the ceiling (a designed event in the wrap after the balloons rise, 0.25 s): one soft rubbery bump on a tile, each its own pitch."""
    k = _nth("balloondrift")
    r = rng6(5520 + k)
    x = _bonk1(5521 + k, 1.0)
    x = np.interp(np.arange(0, len(x) - 1, r.uniform(.85, 1.2)), np.arange(len(x)), x)
    return norm6(_edge(x, .001, .05), .4)


# ================================================================ registration (keep this at the end of the sfx section)
BOOST = {   # textures that sat 15 to 20 dB under the voice at the script's gains: lifted so they register (the dialogue dip still takes them down under speech)
    "sniffle": 1.6, "typing": 1.8, "shuffle": 1.5, "namewhoosh": 1.6, "chuxrustle": 1.7, "chuxfold": 1.8, "tapepull": 1.6, "glovesnap": 1.4, "gloveinflate": 1.4, "glovesqueak": 1.3,
    "labelgun": 1.7, "balloonbonk": 1.6, "beltbuckle": 1.4, "belttug": 1.4, "dentureclack": 1.7, "hoyerroll": 1.4, "slingrustle": 1.5, "hoyerlift": 1.3, "ribbonzip": 1.8,
    "crinkle": 1.8, "pitchpipe": 1.2, "ribbonpull": 1.3, "paperrip": 1.2, "jinglebells": 1.8, "sleighbells": 1.8, "ding": 1.4, "giftthump": 1.5, "stamp": 1.25,
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


# ================================================================ the animation's footsteps, the simulations' events and the designed events
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


BIG_CUES = ("stamp", "giftthump", "giftpile", "dentureclack", "labelgun", "beltbuckle", "balloonbonk", "glovesnap", "hoyerlift")      # scripted hits a collision must not double
STEP_SCALE = {"title": 1.0, "draw": .85, "wrap": .85, "santa": .8, "swap": .85, "carol": .7, "end": 1.0}
RUSH_AT = (0.0, .03, .055, .08)
BED_VOL = {}        # bed name -> the event's gain (filled by _designed_events from BED_DB)
SOURCES = {"steps": "none", "phys": "none", "soft": "none"}
DESIGNED = []       # (scene, local time, name) of the designed events, for the cue report


def _tune_steps(events, tab):
    """The animation's footsteps, balanced for this mix: each scene's own scale; steps that land on the same instant are spread by a few milliseconds (a crowd is never one foot); during the
    carol's sung bars nothing walks (dropped)."""
    out = []
    g = carol_grid()
    for ev in events:
        ev = dict(ev)
        if ev.get("name") == "step":
            sc = _scene_of(ev["t"], tab)
            if g and g[1] - .1 <= ev["t"] <= g[8]:
                continue
            ev["vol"] = round(ev.get("vol", .5) * STEP_SCALE.get(sc, 1.0), 4)
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


def _raw_syllables(scene, lid, count=None):
    """Absolute times of the syllables of a line's plain clip (from the voice cache, placed at the line's start), or None before the first build."""
    ln = _line(scene, lid)
    p = os.path.join(VOX_DIR[0] or "", f"{scene}_{lid}.raw.wav")
    if not ln or not VOX_DIR[0] or not os.path.exists(p):
        return None
    x, _ = sf.read(p, dtype="float64")
    return [ln["s"] + q / SR for q in _syllables(x)[:count]]


def _santa_moves():
    """Absolute times (and gains) of Santa's moves that jingle: each 'ho' of 'Ho ho ho!' and of 'Ho ho... what?' and the double take on 'what?', a gesture on 'Every Christmas Eve.' and on
    'Down', rocking in the low chair on 'I can't get up.', the sling swaying as the Hoyer lifts him, and the ends of each swing under 'This is the best Christmas.'."""
    out = []
    hos = _raw_syllables("santa", "me1") or [_word_abs("santa", "me1", "ho", j) for j in range(3)]
    for t in hos:
        if t is not None:
            out.append((t + .03, .28))
    for w in ("every", "down"):
        t = _word_abs("santa", "me2", w)
        if t is not None:
            out.append((t + .05, .2))
    for t in (_raw_syllables("santa", "me3", 2) or [_word_abs("santa", "me3", "ho", j) for j in range(2)]):
        if t is not None:
            out.append((t + .03, .24))
    t = _word_abs("santa", "me3", "what")
    if t is not None:
        out.append((t, .3))
    me4 = _line("santa", "me4")
    if me4:
        for j in range(3):
            out.append((me4["s"] + .05 + .3 * j, .22))
    lift = _cue_times("hoyerlift")
    hb = _beat_abs("santa", "hoyer")
    if lift and hb:
        t = lift[0] + .3
        while t < hb[1] - .05:
            out.append((t, .16))
            t += .27
    sc = _scene_info("santa")
    if sc:                                                                   # the ends of each swing of the sling (the picture's sway), while it still swings
        k = 0
        while True:
            u = (np.pi / 2 + k * np.pi) / SWAY["w"]
            t = SWAY["t0"] + u
            if t > SWAY["off"][0] - .2:
                break
            amp = abs(float(_sway(t))) / SWAY["A"]
            if amp > .12:
                out.append((sc["start"] + t, round(.1 + .14 * amp, 3)))
            k += 1
    keep = []
    for t, g in sorted(out, key=lambda e: -e[1]):                            # two jingles closer than 0.12 s are one (the louder)
        if all(abs(t - u) >= .12 for u, _ in keep):
            keep.append((t, g))
    return sorted(keep)


def _designed_events(tab, phys):
    """The events the script does not list: the room-tone beds (one per scene, a level in dB under a spoken line), the sleigh bells on Santa's every move, the bell on Tomato's hat as she
    bounces through her lines, the glove balloons drifting along the ceiling after they rise."""
    ev = []
    DESIGNED.clear()
    by = {nm: (a, b) for nm, a, b, bt in tab}
    for nm, sid in BED_SCENE.items():
        if sid not in by:
            continue
        BED_VOL[nm] = round(.1 * 10 ** (BED_DB[nm] / 20) / .6, 5)
        ev.append({"t": round(by[sid][0], 3), "name": "bed_" + nm, "vol": BED_VOL[nm], "pan": 0.0, "room": "hall"})

    def add(t, name, vol, pan):
        if t is None:
            return
        sc = _scene_of(t, tab)
        ev.append({"t": round(t, 3), "name": name, "vol": round(vol, 4), "pan": round(pan, 3), "room": "hall"})
        DESIGNED.append((sc, round(t - by[sc][0], 3) if sc in by else t, name))
    for t, g in _santa_moves():
        add(t, "santajingle", g, .12)
    for lid in ("t1", "t3", "t4", "t5"):
        ln = _line("draw", lid)
        if ln:
            add(ln["s"] + .02, "hatjingle", .25, .15)
    ln = _line("swap", "t1")
    if ln:
        add(ln["s"] + .02, "hatjingle", .2, .15)
    bl = _beat_abs("wrap", "balloons")
    if bl:
        o2, s5 = _line("wrap", "o2"), _line("wrap", "s5")
        for t, p in ((bl[1] - .05, .3), ((o2["e"] + s5["s"]) / 2 if o2 and s5 else None, -.25), (s5["e"] + .15 if s5 else None, .1)):
            add(t, "balloondrift", .2, p)
    return ev


def _load_json(path):
    try:
        return json.load(open(path)) if path and os.path.exists(path) else []
    except (OSError, ValueError):
        return []


def _make_events(src, phys_src, out_dir):
    """Write <out_dir>/events.tuned.json from the footsteps (src), the simulations' events (phys_src: rigid 'phys' and soft 'soft') and the designed events; returns its path."""
    tab = _scene_table()
    if not tab:
        return ""
    steps = _load_json(src)
    phys = _load_json(phys_src)
    if isinstance(phys, dict):
        phys = phys.get("events", [])
    if isinstance(steps, dict):
        steps = steps.get("events", [])
    SOURCES["steps"] = f"{os.path.relpath(src, HERE)} ({len([e for e in steps if e.get('name') == 'step'])} steps, {len(steps)} events)" if steps else "none (no events.json yet)"
    n_r = len([e for e in phys if e.get("name", "phys") == "phys"])
    n_s = len([e for e in phys if e.get("name") == "soft"])
    SOURCES["phys"] = f"{os.path.relpath(phys_src, HERE)} ({n_r} rigid events)" if n_r else "none (no rigid events in phys_events.json yet)"
    SOURCES["soft"] = f"{os.path.relpath(phys_src, HERE)} ({n_s} soft events)" if n_s else "none (no soft events in phys_events.json yet)"
    scripted = _scripted(tab)
    tuned = _tune_steps([e for e in steps if e.get("name") not in ("phys", "soft")], tab)
    rigid = _select_phys(phys, scripted)
    soft = _select_soft(phys, scripted, _timeline()["lines"])
    PHYS_EVENTS[:] = rigid
    SOFT_EVENTS[:] = soft
    des = _designed_events(tab, phys)
    jt = [e["t"] for e in des if e["name"] == "santajingle"]
    for e in tuned:                                     # Santa's own footsteps (the animation's, key 'melon:...' or 'santa:...') jingle too, unless a designed jingle is already there
        if e.get("name") == "step" and any(w in str(e.get("key", "")).lower() for w in ("melon", "santa")) and not any(abs(e["t"] - t) < .15 for t in jt):
            des.append({"t": round(e["t"] + .012, 3), "name": "santajingle", "vol": round(min(.2, .1 + .25 * e.get("vol", .3)), 4), "pan": round(float(e.get("pan", .12)), 3), "room": "hall"})
            sc = _scene_of(e["t"], tab)
            DESIGNED.append((sc, round(e["t"] - next(a for nm, a, b, bt in tab if nm == sc), 3), "santajingle (a step)"))
    ev = tuned + rigid + soft + des
    ev = [e for e in ev if e.get("name") in BA.SFX or str(e.get("name", "")).startswith("step")]
    dst = os.path.join(out_dir, "events.tuned.json")
    os.makedirs(out_dir, exist_ok=True)
    json.dump(ev, open(dst, "w"), indent=0)
    return dst


# ================================================================ checks: the timeline, the dialogue margin, the carol's onsets, the loudness and the silences
def compare_timeline(out_dir):
    """Scene starts, scene lengths and every line's start and end of this build against the frozen build/ep22/timeline.json. Returns the list of differences (empty: identical)."""
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
        tag = f"{ln['scene']}_{ln['id']}"
        dp = 1.0 if (ln["who"] in DRY_WHO or tag in DRY_TAGS) else DRY_PART.get(ln["who"], 0.0)
        if dp:
            vw[:, int(ln["s"] * SR):int(ln["e"] * SR) + 1] *= (1.0 - dp)
    vt = voice.copy()
    for sc in tl["scenes"]:
        a, b = int(sc["start"] * SR), min(n, int((sc["start"] + sc["dur"]) * SR))
        w = scene_reverb(sc["id"], vw[:, a:b], a, hall=False)
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
    MARGIN.update(median=float(np.median(ms)), p5=float(np.percentile(ms, 5)), min=float(ms.min()), under7=int((ms < 7).sum()),
                  worst=[f"{r[0]}.{r[1]} ({r[2]}) {r[5]:.1f} dB" for r in worst])
    print(f"dialogue margin over {len(rows)} lines: median {np.median(ms):.1f} dB, 5th percentile {np.percentile(ms, 5):.1f} dB, min {ms.min():.1f} dB, "
          f"{int((ms < 7).sum())} line(s) under 7 dB")
    print("  worst five: " + "; ".join(MARGIN["worst"]))
    return rows


MARGIN = {}
ONSETS = []         # [(line id, downbeat abs s, onset offset ms at -30 dB, attack offset ms at -12 dB)]


def carol_onsets(out_dir):
    """The carol on the beat, measured: for each sung line, in the voice stem as placed (the mono sum of both ears, 1 ms RMS frames), the first frame from 50 ms before its downbeat that rises
    above 30 dB under the line's loudest frame after a frame below it (the onset) and the first above 12 dB under it (the attack: the vowel), against the grid's downbeat. Writes
    carol_onsets.csv."""
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    c = script.get("carol")
    g = carol_grid()
    if not c or not g:
        return []
    d = os.path.join(HERE, out_dir)
    v, _ = sf.read(os.path.join(d, "stem_voice.wav"), dtype="float64")
    mono = v.mean(axis=1) if v.ndim == 2 else v
    hop = 48
    ONSETS.clear()
    for k, lid in enumerate(c["lines"]):
        ln = _line(c["scene"], lid)
        if not ln:
            continue
        db = g[k + 1]
        a, b = int((db - .05) * SR), int(ln["e"] * SR)
        seg = mono[a:b]
        nf = len(seg) // hop
        e = np.sqrt(np.mean(seg[:nf * hop].reshape(nf, hop) ** 2, axis=1)) + 1e-12
        pk = e.max()

        def first(dbv):
            th = pk * 10 ** (dbv / 20)
            below = False
            for i, x in enumerate(e):
                if x < th:
                    below = True
                elif below:
                    return a / SR + i * hop / SR
            return float("nan")
        ONSETS.append((lid, db, (first(-30.0) - db) * 1000, (first(-12.0) - db) * 1000))
    with open(os.path.join(d, "carol_onsets.csv"), "w") as f:
        f.write("line,downbeat_abs,onset_ms_-30dB,attack_ms_-12dB\n")
        for r in ONSETS:
            f.write(f"{r[0]},{r[1]:.3f},{r[2]:.1f},{r[3]:.1f}\n")
    print("carol onsets against the downbeats (ms, -30 dB / -12 dB): " + "; ".join(f"{r[0]} {r[2]:+.0f}/{r[3]:+.0f}" for r in ONSETS))
    return ONSETS


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


DELIBERATE = ()                              # no deliberate silence in Episode 22
SILENCE_MAX = 1.5                            # a silence longer than this inside a scene is flagged (the brief)
MEAS = {}


def measure(out_dir):
    wav = os.path.join(HERE, out_dir, "audio.wav")
    x, sr = sf.read(wav, dtype="float64")
    sp, tp = true_peak_db(x)
    tl = json.load(open(os.path.join(HERE, out_dir, "timeline.json")))
    lufs = A9._lufs(wav)
    MEAS.update(lufs=lufs, lra=_lra(wav), sp=sp, tp=tp)
    print(f"measure: {lufs:.2f} LUFS integrated, loudness range {MEAS['lra']:.1f} LU, sample peak {sp:.2f} dBFS, true peak {tp:.2f} dBTP (the wav), {len(x) / sr:.2f} s")
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
            if (j - i) * .05 > .5:
                runs.append((i * .05, j * .05))
            i = j
        else:
            i += 1
    flagged = 0
    for a, b in runs:
        sc = next((s["id"] for s in tl["scenes"] if s["start"] <= a < s["start"] + s["dur"]), "?")
        local = a - next((s["start"] for s in tl["scenes"] if s["id"] == sc), 0)
        long_ = (b - a) > SILENCE_MAX and b < tl["duration"] - .05
        flagged += long_
        print(f"  quiet {a:7.2f} to {b:7.2f} s ({b - a:.2f} s) in {sc} at {local:.2f} s" + ("  <- OVER 1.5 s" if long_ else ""))
    MEAS["silences"] = flagged
    print(f"  silences over {SILENCE_MAX} s inside a scene: {flagged}; the quietest 50 ms block is {lv[:nf - 2].min():.1f} dBFS")
    win = int(.4 * sr)
    seg = mono[:len(mono) // win * win].reshape(-1, win)
    lm = 10 * np.log10(np.mean(seg ** 2, axis=1) + 1e-12)
    top = np.argsort(lm)[::-1][:3]
    print("  loudest 400 ms blocks: " + ", ".join(f"{(i * win) / sr:.1f}s {lm[i]:.1f} dB" for i in top))
    return runs


def write_cue_report(out_dir):
    """The cue list as built (scene-local time, absolute time, name, gain, pan) for the script's cues (each checked against the registry), the carol's grid and its measured onsets, the designed
    events the script does not list (the beds with their levels, the bells, the balloons), the simulations' events placed, the voice treatments and the score's decisions."""
    tab = _scene_table()
    script = json.load(open(os.path.join(HERE, _arg("--script", SCRIPT))))
    by = {nm: (a, bt) for nm, a, b, bt in tab}
    lines = ["scene      scene_time  abs_time  name            gain  pan"]
    names = set()
    for sc in script["scenes"]:
        a, bt = by[sc["id"]]
        for b in sc["beats"]:
            for c in b.get("sfx", []):
                s = bt[b["id"]]["e"] if c[1] == "end" else bt[b["id"]]["s"] + c[1]
                names.add(c[0])
                lines.append(f"{sc['id']:<10} {s:8.3f} {a + s:9.3f}  {c[0]:<15} {c[2]:<5} {c[3] if len(c) > 3 else 0}" + ("" if c[0] in BA.SFX else "   (missing sfx)"))
    lines.append("")
    lines.append(f"cue names in the script: {len(names)}; missing from the registry: {sorted(n for n in names if n not in BA.SFX) or 'none'}")
    g = carol_grid()
    if g:
        a0 = by["carol"][0]
        lines.append("the carol's grid (112 bpm, a bar of 2.143 s): downbeats " + ", ".join(f"{t - a0:.3f}" for t in g) + " s scene-local (the intro bar, the seven lines, 'That's not a carol.')")
        if ONSETS:
            lines.append("the carol's measured onsets against the downbeats (the voice stem; ms at -30 dB / at -12 dB under the line's loudest): " +
                         "; ".join(f"{r[0]} {r[2]:+.1f} / {r[3]:+.1f}" for r in ONSETS))
    lines.append("")
    lines.append("designed events (not in the script): the room-tone beds, one per scene, cue gain from BED_DB (dB under a spoken line)")
    for nm, sid in BED_SCENE.items():
        if sid in by:
            s = _scene_info(sid)
            lines.append(f"{sid:<10} {0:8.3f} {by[sid][0]:9.3f}  bed_{nm:<11} {BED_VOL.get(nm, 0):<8} 0.0   {BED_DB[nm]} dB, {s['dur'] + .3:.2f} s")
    ev = _load_json(os.path.join(HERE, out_dir, "events.tuned.json"))
    others = [e for e in ev if not str(e.get("name", "")).startswith(("bed_", "step", "phys", "soft"))]
    for e in sorted(others, key=lambda e: e["t"]):
        sc = _scene_of(e["t"], tab)
        loc = e["t"] - by[sc][0] if sc in by else e["t"]
        lines.append(f"{sc:<10} {loc:8.3f} {e['t']:9.3f}  {e['name']:<15} {e['vol']:<8} {e.get('pan', 0)}")
    cnt = {}
    for e in ev:
        nm = "step" if str(e.get("name", "")).startswith("step") else e.get("name")
        if nm in ("step", "phys", "soft"):
            key = (nm, _scene_of(e["t"], tab))
            cnt[key] = cnt.get(key, 0) + 1
    for nm, src in (("step", SOURCES["steps"]), ("phys", SOURCES["phys"]), ("soft", SOURCES["soft"])):
        per = {sc: n for (k, sc), n in cnt.items() if k == nm}
        lines.append(f"{nm} events placed per scene: {per} ({src})" if per else f"{nm} events placed: {src}")
    fams = {}
    for e in ev:
        if e.get("name") == "soft":
            key = f"{_soft_pair(e.get('mat'), e.get('k'))[0]}:{e.get('k')}"
            fams[key] = fams.get(key, 0) + 1
    if fams:
        lines.append("soft families placed (material:kind): " + ", ".join(f"{k} {v}" for k, v in sorted(fams.items())))
    lines.append("")
    if DEESSED:
        worst = sorted(DEESSED.items(), key=lambda kv: kv[1])[:6]
        lines.append(f"the dialogue de-esser (above 5.5 kHz, 3:1 over 0.35 of the line's peak) touched {len(DEESSED)} of {len(KINDS)} lines; the line peak fell most in " +
                     ", ".join(f"{k} {v:+.1f} dB" for k, v in worst))
    lines.append("voice treatments (scene_line: treatment):")
    for tag, kind in KINDS.items():
        if kind != "plain":
            lines.append(f"  {tag:<14} {kind}" + ("  (dry)" if tag in DRY_TAGS else "") + (f"  (placed {CAROL_PRE * 1000:.0f} ms early: the onset on the downbeat)" if kind == "carol" else ""))
    sn = M22.INFO
    if sn:
        lines.append("")
        lines.append("the score: " + "; ".join(f"{k}: {v}" for k, v in sn.items()))
    open(os.path.join(HERE, out_dir, "cue_report.txt"), "w").write("\n".join(lines) + "\n")


# ================================================================ the AAC guard (as Episode 21)
FF = "/usr/bin/ffmpeg" if os.path.exists("/usr/bin/ffmpeg") else (shutil.which("ffmpeg") or "ffmpeg")       # the encoder the publish step uses
TP_LIMIT = -1.5              # dBTP of the DECODED m4a


def decoded_true_peak(m4a):
    """The true peak (dBTP) of an AAC file, measured the way the brief says: `ffmpeg -i audio.m4a -af ebur128=peak=true -f null -` (the decoder inside ffmpeg, EBU R128's 4x oversampled peak)."""
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", m4a, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"True peak:\s+Peak:\s+(-?\d+\.?\d*) dBFS", r.stderr)
    return float(m[-1]) if m else float("nan")


def aac_guard22(path, limit_db=TP_LIMIT, tries=8):
    """Encode the wav as the release does (/usr/bin/ffmpeg, aac, 192k), measure the decoded m4a's true peak with ebur128=peak=true and, while it is over `limit_db` (with 0.05 dB in hand), dip the
    wav at every spot where the decoded signal's 4x-oversampled peak is over (a smooth 16 ms hann-shaped dip, as deep as the overshoot plus 4 percent) and try again. If `tries` rounds of dips
    have not done it, the whole file is lowered by what is left plus 0.1 dB, again and again, each time re-measured. Returns (dips, deepest dip in dB, the decoded true peak of the FINAL wav)."""
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
        if len(over) == 0:
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
    src = os.path.join(HERE, out_dir, "audio.wav")
    dst = os.path.join(HERE, EPD, "audio.wav")
    m4a = os.path.join(HERE, EPD, "audio.m4a")
    shutil.copyfile(src, dst)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", dst, "-c:a", "aac", "-b:a", "192k", m4a], check=True)
    tp = decoded_true_peak(m4a)
    MEAS["published_tp"] = tp
    print(f"published: {EPD}/audio.wav and {EPD}/audio.m4a; the decoded m4a's true peak is {tp:.2f} dBTP (limit {TP_LIMIT})")
    if not tp <= TP_LIMIT:
        print("TRUE PEAK OVER THE LIMIT: the guard did not pass")
        sys.exit(4)


def end_fade(wav, duration, fade=.18):
    """The renderer muxes with -shortest, so the audio is cut at the timeline's duration. Fade the last `fade` seconds before that instant with a raised cosine that reaches exactly zero at it
    (and zero everything after it), so the cut has no tick."""
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
    """The loudness trim, peak limiter, end fade and AAC guard: the finished file measures -14.8 LUFS and the DECODED AAC stays under -1.5 dBTP (see aac_guard22)."""
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
    dips, deep, tp = aac_guard22(wav)
    MEAS["guard_tp"] = tp
    print(f"aac guard: {dips} dip(s), deepest {deep:.2f} dB; the decoded m4a's true peak is {tp:.2f} dBTP (limit {TP_LIMIT}, measured with /usr/bin/ffmpeg -af ebur128=peak=true)")


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
    keep_stems = "--keep-stems" in argv
    argv = [a for a in argv if a != "--keep-stems"]
    for k, v in (("--script", SCRIPT), ("--out", "build/ep22_sound"), ("--var", "TIMELINE_EP22"), ("--music", "build_music22")):
        if k not in argv:
            argv += [k, v]
    out = argv[argv.index("--out") + 1]
    out_dir = os.path.join(A6.HERE, out)
    os.makedirs(out_dir, exist_ok=True)
    src = argv[argv.index("--events") + 1] if "--events" in argv else ""
    if "--events" in argv:
        del argv[argv.index("--events"):argv.index("--events") + 2]
    if not src:                                         # the animation's footsteps, if they are in build/ep22 (or the output folder): they are always tuned first
        for p in (os.path.join(A6.HERE, EPD, "events.json"), os.path.join(out_dir, "events.json")):
            if os.path.exists(p):
                src = p
                break
    VOX_DIR[0] = os.path.join(out_dir, "voice")
    os.makedirs(VOX_DIR[0], exist_ok=True)
    tuned = _make_events(src, phys_src, out_dir)
    print(f"events: footsteps {SOURCES['steps']}; rigid {SOURCES['phys']} ({len(PHYS_EVENTS)} placed); soft {SOURCES['soft']} ({len(SOFT_EVENTS)} placed); {len(BED_VOL)} room-tone beds; "
          f"{len(DESIGNED)} designed events")
    if tuned:
        argv += ["--events", tuned]
    sys.argv = [sys.argv[0]] + argv
    VOX_DIR[0] = os.path.join(out_dir, "voice")
    os.makedirs(VOX_DIR[0], exist_ok=True)
    _load_speech()
    _TTS_ORIG[0] = A6.tts6
    A6.tts6 = tts22
    A6.place2 = place2_22
    A6.reverb = reverb_22
    A10._CALLS.clear()
    os.environ["STEMS"] = "1"
    A6.main()
    bad = compare_timeline(out)
    if bad:
        print("TIMELINE MISMATCH (not published):")
        for b in bad[:20]:
            print("  ", b)
    else:
        print(f"timeline: identical to {EPD}/timeline.json (scene starts, lengths, every line's start and end)")
    carol_onsets(out)
    write_cue_report(out)
    json.dump(M22.INFO, open(os.path.join(out_dir, "score_info.json"), "w"), indent=1)
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
    json.dump({"measure": MEAS, "margin": MARGIN, "carol_onsets": ONSETS}, open(os.path.join(out_dir, "measure.json"), "w"), indent=1, default=float)
    if do_publish:
        if bad:
            print("not published: the timeline differs")
            sys.exit(3)
        publish(out)


if __name__ == "__main__":
    main()
