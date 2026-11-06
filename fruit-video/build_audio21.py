"""Episode 21 audio: THE INSPECTION. A fresh copy of the Episode 15 to 20 mixer wrapper (build_audio20.py, the final one) mapped to this episode: its own paths, scene ids, voices, rooms, effects and score.

Everything build_audio15 explains applies unchanged: the per-line voice cache under <out>/voice/, the dip of every cue under dialogue (DUCK_DB), the footsteps from the animation
(build/ep21/events.json), the collision foley (build/ep21/phys_events.json), the loudness trim, peak limiter, the timeline comparison against the frozen build/ep21/timeline.json and the dialogue
margin of every line.

WHAT IS NEW IN EPISODE 21 (scene ids: title, arrive, prep, medpass, closet, exit, end)
  THE VOICES    Ms. Kale (crisp, precise, a little dry: a close microphone, 60 percent of her kept out of the room) and Mr. Radish (low, flat and slow: a chest, a level held flat by a compressor);
                the whisper chain (arrive m1, l1, t1: the voice re-synthesised from noise through its own spectral envelope, breathy and unvoiced, a hiss on the S's, close and dry, panned left,
                centre, right with the camera); the overhead PA (arrive me1: a ceiling speaker, band-limited, a little distortion, a hall); Brenda inside a closet (boxy, muffled, close); Mr. Radish
                under a pile of binders (muffled, damped); the whole 3-11 at once (`staff`: five voices, tight and ragged) and the forty Strawberries (`chor`: six voices doubled into twelve, wide).
  THE MONTAGE   prep `montage` 7.21 to 19.21: the score is a 120 bpm grid with its downbeat on the montage start; every effect of the montage lands on a cut (every 1.0 s) and carries its own small
                second hit on the off-beat 0.5 s later (designed events), the grid's ticks are in the score, the button on beat 25.
  THE SPLIT     medpass: the stereo splits with the picture: the left half (the State's) is a soft, quiet room on the left, the right half (a normal night) a busy hallway on the right (call bells, a
                rattling cart, a phone, running feet, a TV); every line is spoken on the left. The room's reverb is split the same way (the voices and the left's cues in the State's soft room, the right half's cues sent to the long hallway, its tail on the right). The divider's position (build/ep21/split.json when it exists, else the brief's schedule) ducks the side it squeezes.
  THE AVALANCHE closet: `closetopen`, a beat of stillness, the designed `binderavalanche` roar and the collision foley of every binder from phys_events.json (cardboard and plastic, rings that rattle).
  THE SCANNER   `scanbeep`, `scanlock`, the sweep's hum and the data ticks of the tags typing in (designed events).
  THE BREAK     exit `break` 15.08 to 18.68: the room tone falls to almost nothing, the clock's second hand, her exhale, one warm held chord in the score, the shift bell at 11:00 as a soft chime.

Usage: python3 build_audio21.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep21_sound] [--events build/ep21/events.json] [--phys build/ep21/phys_events.json]
                                [--split build/ep21/split.json] [--keep-stems] [--publish]
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
import build_music21 as M21   # the score
from build_audio import SR, tarr, osc, ar, midi, expdecay
from build_audio6 import norm6, rng6, noise6
from build_audio7 import _smooth_rand, _sum
from build_audio10 import _nth, _burst, _thump, _ping
from build_audio13 import _place, _edge, _lp4, _hp4, _bp4, _tv_filter, _glide, _sin_of, _glass, _fade_end, _call_ding
from build_audio14 import _res, _band, _unit, _key

HERE = A6.HERE
SCRIPT = "script_ep21.json"
EPD = "build/ep21"       # the lead's folder (the frozen timeline and the event files)
FXV = "21.1"             # bump to rebuild every treated voice line


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


# ---------------------------------------------------------------- the cast, as Episode 20 left them
def fx_bind(x, menace=False):
    """Binder: a bright, cheerful assistant, slightly synthetic: a lift at 2.2 to 7.5 kHz, a faint detuned double (a 6 ms delay that flutters at 5.5 Hz: a plastic sheen) and a 10-bit grain."""
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


def fx_res(x):
    """The residents (Pear, Banana, Cranberry, Goji): the day room's warmth on the voice itself, +2 dB under 260 Hz and the top eased (-2.5 dB above 5 kHz), so four old voices sit in lamp light."""
    y = x + .26 * _lp4(x, 260, 2) - .26 * _hp4(x, 5000)
    return _match_active_rms(y, x)



# ---------------------------------------------------------------- the State (new in Episode 21)
def fx_kale(x):
    """Ms. Kale (bf_alice, 0.98): crisp, precise, a little dry: a clean close microphone. The lows under 110 Hz trimmed (12 dB/oct), the boxy 300 Hz eased (-1.5 dB), a presence lift at 3 to
    6.5 kHz (+2.5 dB) and air above 9 kHz (+1.5 dB), a gentle compressor (2:1 over -26 dBFS, fast) so every word lands at the same level. The mixer keeps 60 percent of her out of the room."""
    y = _hp4(x, 110, 2)
    y = y - .16 * _bp4(y, 220, 420, 1)
    y = y + .33 * _bp4(y, 3000, 6500, 2) + .19 * _hp4(y, 9000, 2)
    y = _comp(y, -26.0, 2.0, .003, .06, 1.5)
    return _match_active_rms(y, x)


def fx_radish(x):
    """Mr. Radish (am_echo, 0.92, two semitones down): low, flat and slow. A chest under the voice (+3 dB under 180 Hz), the top dulled (-2 dB above 4.5 kHz) and a compressor that holds
    the level flat (4:1 over -30 dBFS, a slow release): no word is louder than another."""
    y = x + .41 * _lp4(x, 180, 2)
    y = y - .21 * _hp4(y, 4500, 2)
    y = _comp(y, -30.0, 4.0, .006, .22, 4.0)
    return _match_active_rms(y, x)


# ---------------------------------------------------------------- the whisper chain, the PA, the closet, the pile
def _whisperise(x, seed, smooth_hz=380.0, nfft=1024, hop=256):
    """The voice re-synthesised as a whisper: its short-time spectrum is smoothed across frequency (so the harmonics of the voice are gone and only the vocal tract's envelope is left) and
    imposed on white noise of the same length, frame by frame (the voice's own timing, formants and fricatives, no pitch at all)."""
    x = np.asarray(x, dtype=float)
    _, _, X = signal.stft(x, SR, nperseg=nfft, noverlap=nfft - hop)
    mag = np.abs(X)
    k = max(3, int(round(smooth_hz / (SR / nfft))))
    env = uniform_filter1d(mag, k, axis=0, mode="nearest")
    _, _, Z = signal.stft(rng6(seed).standard_normal(len(x)), SR, nperseg=nfft, noverlap=nfft - hop)
    Z = Z[:, :env.shape[1]] / (np.abs(Z[:, :env.shape[1]]) + 1e-12)
    _, y = signal.istft(env * Z, SR, nperseg=nfft, noverlap=nfft - hop)
    y = np.asarray(y[:len(x)], dtype=float)
    return np.pad(y, (0, len(x) - len(y))) if len(y) < len(x) else y


def fx_whisper(x, seed, voiced=0.0):
    """THE WHISPER CHAIN (arrive m1, l1, t1): breathy, unvoiced, close. The voice whispered (_whisperise), the chest gone (a 280 Hz high-pass: a whisper has no lows), the formants brightened
    (+1.6 dB above 1.8 kHz, the vowels' formants held up), A HISS ON THE S'S (the frames whose energy is mostly above 4.5 kHz are lifted a further 4 dB at 4.5 to 10 kHz), the breath of a mouth at the ear
    (a soft 700 to 2400 Hz air at -24 dB riding the words) and no room (the mixer keeps it dry). `voiced` keeps that much of the plain voice under it (a stage whisper)."""
    n = len(x)
    w = _whisperise(x, seed)
    w = _hp4(w, 280, 3)
    w = w + .2 * _hp4(w, 1800, 2) + .12 * _bp4(w, 500, 2500, 1)
    hi = _bp4(w, 4500, 10000, 2)
    eh, ea = _env10(hi, 480), _env10(w, 480)
    sib = np.clip((eh / (ea + 1e-9) - .35) / .3, 0, 1)
    sib = np.interp(np.arange(n), np.arange(len(sib)) * 480 + 240, uniform_filter1d(sib, 3))
    w = w + hi * .55 * sib
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    w = w + _bp4(rng6(seed + 3).uniform(-1, 1, n), 700, 2400, 1) * env * .1
    if voiced:
        w = _match_active_rms(w, x) * (1 - voiced) + _hp4(x, 160, 2) * voiced
    return _match_active_rms(w, x) * .97


def fx_pa21(x, seed):
    """The overhead PA (arrive me1): a ceiling speaker in a lobby. Band-limited to 350 Hz to 3.4 kHz (a cheap horn driver), its two cone resonances (1.15 and 2.7 kHz), a little distortion (the
    amplifier), a slap off the far wall 95 ms behind and a fainter one at 190 ms, the lobby's own hall (1.1 s, darker than the voice, -12 dB) whose tail rings on for half a second after the
    last word, and the faint hiss of an open line. The mixer keeps it out of the scene's room (the hall is baked in)."""
    n = len(x)
    tail = int(.55 * SR)
    xx = np.concatenate([np.asarray(x, dtype=float), np.zeros(tail)])
    y = _bp4(xx, 350, 3400, 2)
    y = y + .3 * _res(y, 1150, 3.0) + .14 * _res(y, 2700, 4.0)
    pk = np.max(np.abs(y)) + 1e-9
    y = np.tanh(1.9 * y / pk) * pk / 1.3
    y = _bp4(y, 330, 3500, 1)
    side = _bp4(y, 420, 2600, 1)
    y = y + _delay(side, 95, .28) + _delay(side, 190, .11)
    r = rng6(seed + 5)
    nir = int(1.3 * SR)
    t = np.arange(nir) / SR
    ir = _bp4(r.uniform(-1, 1, nir) * np.exp(-6.9 * t / 1.1), 300, 3000, 1)
    ir[:int(.016 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    y = y + signal.fftconvolve(y, ir)[:len(y)] * .25
    env = np.interp(np.arange(len(y)), np.arange(len(_env10(xx))) * 480 + 240, _env10(xx))
    on = np.clip(uniform_filter1d((env > .02 * env.max()).astype(float), int(.3 * SR) | 1) * 3.0, 0, 1)
    y = y + _bp4(r.uniform(-1, 1, len(y)), 2500, 7000, 1) * on * .004 * pk
    k = int(.12 * SR)
    y[-k:] *= np.linspace(1, 0, k) ** 2
    return _match_active_rms(y, xx) * 1.05


def fx_closet(x, seed):
    """Brenda inside a closet (prep br1, closet br1 and br2): her frail voice (fx_brenda) through a closed door. Muffled (a 24 dB/oct low-pass at 2.3 kHz, the air above it leaking at -20 dB),
    boxy (the closet's two modes: +4 dB at 420 Hz, +2 dB at 950 Hz), a tiny hard box around her (0.09 s, reflections at 1.1, 2.3 and 3.6 ms) and close (+2 dB under 200 Hz). No room."""
    n = len(x)
    y = fx_brenda(x, seed)
    lo = _lp4(y, 2300, 4)
    y = lo + .1 * _bp4(y, 2300, 5000, 1)
    y = y + .58 * _res(y, 420, 2.0) + .26 * _res(y, 950, 2.5)
    ir = _small_ir(seed + 13, rt=.09, pre=.0008, lo=150, hi=2400, taps=((.0011, .7), (.0023, .55), (.0036, .4)))
    y = y + .35 * signal.fftconvolve(y, ir)[:n]
    y = y + .26 * _lp4(y, 200, 2)
    return _match_active_rms(y, x) * 10 ** (-.5 / 20)


def fx_buried21(x, seed):
    """Mr. Radish under a pile of binders (closet ra2 'Impressive.'): his flat voice (fx_radish) through cardboard: a 24 dB/oct low-pass at 1.5 kHz, a damped cavity (+3 dB at 300 Hz, no
    reflections at all), pages shifting on him as he speaks (a 1.5 to 5 kHz paper rustle at -28 dB that follows the words), 1.5 dB quieter. No room."""
    n = len(x)
    y = fx_radish(x)
    y = _lp4(y, 1500, 4)
    y = y + .41 * _res(y, 300, 1.6)
    env = np.interp(np.arange(n), np.arange(len(_env10(x))) * 480 + 240, _env10(x))
    t = np.arange(n) / SR
    rus = _bp4(rng6(seed + 17).uniform(-1, 1, n), 1500, 5000, 1) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 3.1 * t)))
    y = y + rus * env * .05
    return _match_active_rms(y, x) * 10 ** (-1.5 / 20)


# ---------------------------------------------------------------- the choruses (the staff's 'Yes!' and the forty Strawberries' 'Agency!')
def fx_chor(kokoro, v, say, mono, tag, pans, delays, double=False, tail=.1):
    """A chorus of the script's own voice list: each voice speaks the line (a little detuned in speed, as the plain chorus is), is placed at its own spot in the field and comes in its own few
    milliseconds late, as a crowd does; `double`: every voice is heard twice (the second take read 2.5 to 4 percent faster or slower, a varispeed, and 11 to 29 ms later, at the mirror position),
    so six voices become twelve. Trimmed exactly as the plain clip was, plus `tail` seconds (faded) so the late voices keep their last consonant. Returns a (2, n) clip."""
    names = v["chorus"]
    parts = []
    for i, name in enumerate(names):
        detune = 1 + .03 * (i % 3 - 1)
        key = hashlib.sha1(json.dumps([name, v["speed"] * detune, v["lang"], say, "p"]).encode()).hexdigest()[:16]

        def make(name=name, detune=detune):
            samples, sr = kokoro.create(say, voice=name, speed=v["speed"] * detune, lang=v["lang"])
            return signal.resample_poly(np.asarray(samples, dtype=float), SR // 1000, sr // 1000)
        parts.append(_vox_cache(f"{tag}.p{i}", key, make))
    takes = []
    for i, p in enumerate(parts):
        q = p / np.max(np.abs(p))
        takes.append((q, pans[i % len(pans)], delays[i % len(delays)], 1.0))
        if double:
            rate = (1.035, .972, 1.025, .965, 1.04, .975)[i % 6]
            q2 = np.interp(np.arange(0, len(q) - 1, rate), np.arange(len(q)), q)
            takes.append((q2, -pans[i % len(pans)] * .85, delays[i % len(delays)] + (11, 23, 17, 29, 14, 20)[i % 6], .8))
    L = max(len(q) for q, *_ in takes)
    dmax = max(int(d * SR / 1000) for _, _, d, _ in takes)
    summ = np.zeros(L)
    st = np.zeros((2, L + dmax + 2400))
    for q, pan, dl, g in takes:
        summ[:len(q)] += q
        th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        d = int(dl * SR / 1000)
        st[0, d:d + len(q)] += q * np.cos(th) * g
        st[1, d:d + len(q)] += q * np.sin(th) * g
    a = np.abs(BA.semis_resample(summ, v.get("semis", 0)))
    idx = np.where(a > .01 * a.max())[0]
    lo = max(0, idx[0] - 800)
    n = len(mono)
    m = n + int(tail * SR)
    out = st[:, lo:lo + m]
    if out.shape[1] < m:
        out = np.pad(out, ((0, 0), (0, m - out.shape[1])))
    k = int(tail * SR)
    if k:
        out[:, n:] *= np.linspace(1, 0, m - n)[None, :]
    return _match_active_rms(out, mono)


def fx_staff(kokoro, v, say, mono, tag):
    """THE WHOLE 3-11 AT ONCE ('Yes!', arrive st1): the five voices of the script's list, tight (they lean into one shot: a narrow arc, -0.5 to 0.5) and slightly ragged (0 to 25 ms apart),
    loud and desperate: driven into a soft saturation, a push at 2 to 4 kHz (+2 dB), 1.5 dB over a single voice."""
    c = fx_chor(kokoro, v, say, mono, tag, pans=(-.5, -.22, .05, .28, .5), delays=(0, 16, 7, 25, 11), tail=.08)
    pk = np.max(np.abs(c)) + 1e-9
    c = np.tanh(1.7 * c / pk) * pk
    c = c + .26 * np.stack([_bp4(c[0], 2000, 4000, 2), _bp4(c[1], 2000, 4000, 2)])
    return _match_active_rms(c, mono) * 10 ** (1.5 / 20)


def fx_agency(kokoro, v, say, mono, tag):
    """THE FORTY STRAWBERRIES ('Agency!', prep ch1): the six voices of the script's list, doubled into twelve, wide (from -0.9 to 0.9), 0 to 45 ms apart: a corridor full of the same nurse. A
    little of the corridor baked into the crowd (a 0.35 s room at -16 dB, so the back rows are further away than the front) and 1 dB over a single voice."""
    c = fx_chor(kokoro, v, say, mono, tag, pans=(-.9, -.55, -.2, .2, .55, .9), delays=(0, 9, 4, 15, 6, 12), double=True, tail=.14)
    ir = _small_ir(int(len(mono)) % 997 + 31, rt=.35, pre=.012, lo=200, hi=4500, taps=((.013, .4), (.024, .3)))
    c = c + .16 * np.stack([signal.fftconvolve(c[ch], ir)[:c.shape[1]] for ch in range(2)])
    return _match_active_rms(c, mono) * 10 ** (1.0 / 20)


# ---------------------------------------------------------------- which treatment does each line get? (scene, line id) first, then the speaker
PREP_PA = False          # prep me1 'Where is our staffing?': the Administrator on the PA (True) or in person (False); the picture decides
LINE_KIND = {
    ("arrive", "m1"): "whisper", ("arrive", "l1"): "whisper", ("arrive", "t1"): "whisper",
    ("arrive", "me1"): "pa",
    ("arrive", "b2"): "bind_menace",
    ("prep", "br1"): "closet", ("closet", "br1"): "closet", ("closet", "br2"): "closet",
    ("closet", "ra2"): "buried",
    ("medpass", "pe2"): "stage_whisper",
}
if PREP_PA:
    LINE_KIND[("prep", "me1")] = "pa"
WHO_KIND = {"bind": "bind", "onion": "onion", "brenda": "brenda", "pear": "res", "kale": "kale", "radish": "radish", "staff": "staff", "chor": "agency"}
KIND_V = {"whisper": "2", "stage_whisper": "2", "pa": "1", "closet": "2", "buried": "2", "kale": "1", "radish": "1", "staff": "1", "agency": "1", "bind_menace": "1"}


def line_kind(scene, lid, who):
    """The treatment of a line: the special cases first (keyed by scene and line id), then the speaker's own."""
    return LINE_KIND.get((scene, lid)) or WHO_KIND.get(who, "plain")


def apply_kind(kind, mono, seed, kokoro=None, v=None, say=None, tag=None):
    if kind == "bind":
        return fx_bind(mono)
    if kind == "bind_menace":
        return fx_bind(mono, menace=True)
    if kind == "onion":
        return fx_onion(mono, seed)
    if kind == "brenda":
        return fx_brenda(mono, seed)
    if kind == "res":
        return fx_res(mono)
    if kind == "kale":
        return fx_kale(mono)
    if kind == "radish":
        return fx_radish(mono)
    if kind == "whisper":
        return fx_whisper(mono, seed)
    if kind == "stage_whisper":
        return fx_res(fx_whisper(mono, seed, voiced=.45))
    if kind == "pa":
        return fx_pa21(mono, seed)
    if kind == "closet":
        return fx_closet(mono, seed)
    if kind == "buried":
        return fx_buried21(mono, seed)
    if kind == "staff":
        return fx_staff(kokoro, v, say, mono, tag)
    if kind == "agency":
        return fx_agency(kokoro, v, say, mono, tag)
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


def tts21(kokoro, v, say):
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
    if kind == "plain":
        return _Vox(mono, None, who, tag)
    key = hashlib.sha1(json.dumps([raw_key, kind, FXV, KIND_V.get(kind, "")]).encode()).hexdigest()[:16]
    seed = int(hashlib.sha1(tag.encode()).hexdigest()[:6], 16)
    return _Vox(mono, _vox_cache(tag + ".fx", key, lambda: apply_kind(kind, mono, seed, kokoro, v, say, tag)), who, tag)


# ---------------------------------------------------------------- the rooms (impulse responses) and the reverb
ROOM21 = {   # rt: reverb time (s); wet: level of the tail against the dry sound; damp: where the tail is closed off; pre: pre-delay; taps: early reflections (s, gain)
    "title":     dict(rt=.36, wet=.10, damp=6000, pre=.005, taps=((.009, .5), (.016, .4), (.027, .3))),     # a desk under a cold office light
    "arrive":    dict(rt=.72, wet=.15, damp=5600, pre=.012, taps=((.017, .45), (.031, .35), (.047, .25))),   # the lobby and the station: glass doors, a hard floor
    "prep":      dict(rt=.50, wet=.13, damp=5200, pre=.008, taps=((.014, .4), (.027, .3), (.041, .2))),      # the nurses' station
    "medpass_l": dict(rt=.30, wet=.075, damp=3600, pre=.006, taps=((.008, .35), (.015, .25))),               # the State's half: a resident's room, curtains, carpet, quiet
    "medpass_r": dict(rt=.85, wet=.19, damp=5800, pre=.014, taps=((.021, .5), (.037, .4), (.058, .3))),      # a normal night: the long hard hallway
    "closet":    dict(rt=.55, wet=.13, damp=4800, pre=.009, taps=((.015, .4), (.028, .3), (.044, .2))),      # the corridor by the station, evening
    "exit":      dict(rt=.42, wet=.10, damp=4400, pre=.007, taps=((.010, .45), (.019, .35), (.030, .25))),   # the conference room: a long table, carpet, a low ceiling
    "end":       dict(rt=.38, wet=.08, damp=5200, pre=.006),                                                 # an office
}
_IRS = {}


def _room_ir(name):
    """The stereo impulse response of a room in ROOM21 (cached): decaying noise closed off at `damp`, early reflections, normalised to unit energy as the series' rooms are."""
    if name in _IRS:
        return _IRS[name]
    sp = ROOM21[name]
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
    return np.stack([signal.fftconvolve(seg[c], ir[c], mode="full") for c in range(2)]) * ROOM21[name]["wet"]


def scene_reverb(sid, seg, a, hall=True):
    """The reverb of scene `sid`'s dry signal `seg` (2, n) whose first sample is sample `a` of the film. THE SPLIT (medpass): everything of the State's half (every voice, the left's cues) is in
    the State's soft room; the right half's cues (placed at pan 0.2 or more: the cups, the cart, the call bells) were sent instead to the long hallway (_HALL), whose tail stays on the right (the
    left ear gets a third of it). `hall` False: the soft room only (the dialogue margin's voice)."""
    if sid == "medpass":
        r = _rev(seg, "medpass_l")
        h = _HALL[0]
        if hall and h is not None:
            hs = h[:, a:a + seg.shape[1]]
            if hs.shape == seg.shape and np.any(hs):
                R = _rev(hs, "medpass_r")
                R = np.stack([R[0] * .35 + R[1] * .1, R[1] * 1.1])
                n = max(r.shape[1], R.shape[1])
                r = np.pad(r, ((0, 0), (0, n - r.shape[1]))) + np.pad(R, ((0, 0), (0, n - R.shape[1])))
        return r
    if sid in ROOM21:
        return _rev(seg, sid)
    return None


# ---------------------------------------------------------------- place2, patched: voices place their treated version where they are; cues dip under speech
DUCK_DB = {   # how far a cue is dipped (dB) while a voice speaks, by effect name; anything missing here is not dipped. The hits the picture lands on are never dipped.
    "sniffle": 4, "typing": 6, "step": 7, "clocktick": 2, "gasp": 3, "pachime": 3, "grin": 3, "cupclatter": 4, "cartroll": 5, "penscratch": 4, "shiftbell": 4, "labelpeel": 4,
    "doorchime": 3, "sparkle": 4, "binderavalanche": 6, "scanhum": 4, "dataticks": 3, "scanon": 3, "hudmark": 2, "badge": 4, "headturn": 4, "paperhand": 5, "cartlock": 3, "chaos": 6, "callbell": 5, "secondhand": 2, "scatter": 4, "crowdmurmur": 6, "offhit": 3,
    "bed_title": 3, "bed_arrive": 4, "bed_prep": 4, "bed_medpass": 5, "bed_closet": 4, "bed_exit": 3, "bed_end": 2,
}
NOREV = ("bed_title", "bed_arrive", "bed_prep", "bed_medpass", "bed_closet", "bed_exit", "bed_end", "chaos", "scanhum", "dataticks", "secondhand", "crowdmurmur")
DRY_WHO = ()                                                                   # voices that skip the room entirely
DRY_TAGS = ("arrive_m1", "arrive_l1", "arrive_t1", "arrive_me1", "prep_br1", "closet_br1", "closet_br2", "closet_ra2")   # whispers at the ear, the PA (its hall is its own), a closet, a pile
DRY_PART = {"kale": .6}                                                        # this much of the voice is kept out of the room (a little dry)
LINE_PAN = {"arrive_m1": -.55, "arrive_l1": 0.0, "arrive_t1": .55}            # the whisper chain follows the camera down the hall
MEDPASS_PAN = {"kale": -.52, "straw": -.42, "pear": -.34}                       # THE SPLIT: every line is spoken in the State's half, on the left
_DRY = [None, None]                # [the mixer's dry buffer (the first buffer place2 is given), a buffer of the same size that holds only the NOREV cues and the dry voices]
_HALL = [None]                     # the medpass's hallway send: the right half's cues (they skip the State's soft room and ring in the hallway instead)
_MED = {}
_WIN = {}
_SM = [None]


def _medpass_span():
    if "a" not in _MED:
        s = _scene_info("medpass")
        _MED["a"], _MED["b"] = (s["start"], s["start"] + s["dur"]) if s else (None, None)
    return _MED["a"], _MED["b"]


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


def _line_pan(clip, pan):
    if clip.tag in LINE_PAN:
        return LINE_PAN[clip.tag]
    if str(clip.tag).startswith("medpass_"):
        return MEDPASS_PAN.get(clip.who, -.4)
    return pan


def reverb_21(seg, room):
    """The mixer's per-scene room (A6.reverb), replaced: each scene has its own room (ROOM21; the medpass is split in two), minus the cues and voices that must stay dry. `seg` is a view of the
    mixer's dry buffer, so its offset in that buffer (the scene's first sample) is read from the memory address; the scene is the one that starts there."""
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


def place2_21(buf, clip, at, gain=1.0, pan=0.0):
    if _DRY[0] is None:                                  # the mixer places the voices into `dry` first
        _DRY[0] = buf
        _DRY[1] = np.zeros_like(buf)
        _HALL[0] = np.zeros_like(buf)
    if isinstance(clip, _Vox):
        _WIN[round(float(at), 4)] = (float(at), len(clip) / SR)
        alt = clip.alt
        v = np.asarray(clip) if alt is None else alt
        pan = _line_pan(clip, pan)
        _PLACE2(buf, v, at, gain, pan)
        dp = _dry_part(clip)
        if dp and buf is _DRY[0]:
            _PLACE2(_DRY[1], v, at, gain * dp, pan)
        return
    name = getattr(clip, "sfx", None) or "step"
    db = DUCK_DB.get(name)
    if db and _WIN:
        i = int(round(at * SR))
        n = min(clip.shape[-1], buf.shape[1] - i)
        if n > 0:
            sm = _speech_gate(buf.shape[1])[i:i + n]
            clip = np.asarray(clip)[..., :n] * (1 - (1 - 10 ** (-db / 20)) * sm)
    ma, mb = _medpass_span()
    send = ma is not None and ma <= at < mb and pan >= .2 and name not in NOREV        # the right half's cues ring in the hallway, not in the State's room
    if (name in NOREV or send) and buf is _DRY[0]:          # the dry buffer holds the same (dipped) clip that the mix does, so that the reverb's input is exactly what is not dry
        _PLACE2(_DRY[1], np.asarray(clip), at, gain, pan)
    if send and buf is _DRY[0]:
        _PLACE2(_HALL[0], np.asarray(clip), at, gain, pan)
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


# ================================================================ small clip helpers (the effects' building blocks)
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


# ================================================================ THE SPLIT: the divider's position over the medpass (who is squeezed, and how much)
class Split:
    """Where the divider of the split screen is (screen px of the 1080 px frame, 540 is the middle), 20 Hz, absolute seconds. From build/ep21/split.json ([{t, x}] absolute or scene-local seconds,
    or [{t, pan}] -1..1) when it exists; else the final picture's own schedule (ep21_medpass.js DIV): the middle, except under 'Six.' (s4) where it slides to squeeze the right half for a beat (to
    760 px over the 0.3 s from the frame of s4 - 0.06 s, held, back over the 0.3 s before the frame of pe2 - 0.06 s: 19.85 to 20.15 and 20.33 to 20.61 scene-local). gain(side, t): the level of a side, 1 at half the frame, falling as its half shrinks (a half of 320 px is about -10 dB: the squeeze is brief, so it has to read)."""

    def __init__(self):
        self.ts = self.x = None
        self.source = "none"

    def setup(self, path=None):
        sc = _scene_info("medpass")
        if not sc:
            return
        rows = _load_json(path) if path else []
        if isinstance(rows, dict):
            rows = rows.get("samples") or rows.get("rows") or []
        if rows and len(rows) > 3 and all(("x" in r or "pan" in r) and "t" in r for r in rows):
            rows = sorted(rows, key=lambda r: r["t"])
            shift = sc["start"] if rows[-1]["t"] < sc["start"] else 0.0
            self.ts = np.array([r["t"] + shift for r in rows], dtype=float)
            self.x = np.array([float(r["x"]) if "x" in r else 540.0 + 540.0 * float(r["pan"]) for r in rows], dtype=float)
            self.source = f"{os.path.relpath(path, HERE)} ({len(rows)} samples)"
            return
        a = sc["start"]
        s4, pe2 = _beat_abs("medpass", "s4"), _beat_abs("medpass", "pe2")
        ts = np.arange(a, a + sc["dur"] + .05, .05)
        x = np.full(len(ts), 540.0)
        if s4 and pe2:
            snap = lambda t: round(t * 30) / 30                                       # the picture's snapT: the nearest frame (30 fps, absolute)
            a, b = snap(s4[0] - .06), snap(pe2[0] - .06)
            k0, k1, k2, k3 = a, a + .3, b - .3, b - .02
            x = 540.0 + 220.0 * np.clip(np.minimum(_smoothstep((ts - k0) / (k1 - k0)), 1 - _smoothstep((ts - k2) / (k3 - k2))), 0, 1)
            self.source = (f"the final picture's schedule (ep21_medpass.js DIV: 760 px; out {k0 - sc['start']:.2f} to {k1 - sc['start']:.2f} s, "
                           f"back {k2 - sc['start']:.2f} to {k3 - sc['start']:.2f} s scene-local; no split.json)")
        self.ts, self.x = ts, x

    def x_at(self, t):
        if self.ts is None:
            return np.full(np.shape(t), 540.0)
        return np.interp(t, self.ts, self.x, left=540.0, right=540.0)

    def gain(self, side, t):
        x = self.x_at(np.asarray(t, dtype=float))
        w = (1080.0 - x) if side == "R" else x
        return np.clip(w / 540.0, .2, 1.0) ** 2.2


SPLIT = Split()


# ================================================================ title and end: the clipboard, the pen, the stamp, the typewriter
KEY21 = 2                          # the bookends are in D: the title's tick-tock is D minor, the stamp turns it to D major; the end card stays in D major
TITLE_BEAT = .4                    # the title's grid (150 bpm, bars from 0.6 s): the pen click, the first and third ticks, the stamp (bar 3) and the text ding (bar 4) are on the beat
END_BEAT = .4875                   # the end card's: 0.1 to 4.0 s is two bars (123 bpm) and the stamp is the downbeat of the third


def sfx_theme21():
    """The series' theme as a sparkle layer, in D. TITLE (the cue at 0.2 s; the clip is laid out on the title's grid): under the checklist, the quiet escapement of a desk clock on every beat
    (a tick at 1.9 kHz and a tock at 1.35 kHz, 0.2 to 3.4 s); ON THE STAMP (3.8 s) the theme's arpeggio in D major on a glockenspiel and glass in eighths (3.8 to 5.4 s, D F-sharp A D A F-sharp A D)
    and on the text ding (5.4 s) a D major seventh bloom on glass that rings to the cut. END CARD (0.1 s): the arpeggio on glass in eight beats (123 bpm) from 0.1 to 4.0 s over a rising air, and on
    the stamp a held D major ninth (D A C-sharp E F-sharp) that does not resolve."""
    k = _nth("theme21")
    x = np.zeros(_n(7.0))
    arp = tuple(m + KEY21 for m in (72, 76, 79, 84, 79, 76, 79, 84))
    if k == 0:
        t0 = .2
        for j in range(9):
            at = .2 + j * TITLE_BEAT - t0
            tt = tarr(.05)
            f = 1900.0 if j % 2 == 0 else 1350.0
            c = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .005) * .5 + _band(3100 + j % 3, .05, 1500, 6000) * np.exp(-tt / .002) * .5
            _place(x, c, at, .16 if j % 2 == 0 else .12)
        st = 3.8 - t0
        for i, m in enumerate(arp):
            g = .35 + .4 * i / 7
            _place(x, _glass(midi(m + 12), .9, .3, .002) * .55 + _note(midi(m + 12), .5, .12, ((1, 1.0), (4, .3), (10, .08))) * .45, st + i * .2, g)
        bl = 5.4 - t0
        for m, g_ in ((86, 1.0), (90, .8), (93, .7), (97, .55)):
            _place(x, _glass(midi(m), 1.6, .9, .006), bl, g_ * .28)
        x = x[:_n(6.4)]
    else:
        step = END_BEAT
        for i, m in enumerate(arp):
            g = .3 + .45 * i / 7
            _place(x, _glass(midi(m + 12), 1.0, .26, .002) * .5, i * step, g * .8)
        L = 8 * step
        t = tarr(L)
        _place(x, _tv_filter(noise6(L, 3105), _glide(500, 6000, L), 1.2, "bp") * (t / L) ** 2 * .08, 0.0, 1.0)
        for m, g_, tau in ((74, 1.0, 1.6), (81, .8, 1.5), (85, .7, 1.4), (88, .6, 1.3), (90, .5, 1.2)):
            _place(x, _glass(midi(m), 3.3, tau, .004), L, g_ * .38)
        x = x[:_n(L + 3.3)]
    return norm6(_edge(x, .0004, .4), .55)


def sfx_penclick():
    """A retractable ballpoint clicked (0.3 s): the plunger's sharp plastic click (a burst rung at 3.2 kHz), the spring's faint ring (4.6 kHz, 50 ms), and 45 ms later the cam settling (a smaller,
    lower click at 2.4 kHz)."""
    x = np.zeros(_n(.3))
    _place(x, _click(3120, 3200, .004), 0.0, 1.0)
    tt = tarr(.06)
    _place(x, np.sin(2 * np.pi * 4600 * tt) * np.exp(-tt / .012) * .08, .002, 1.0)
    _place(x, _click(3121, 2400, .003) * .45, .045, 1.0)
    return norm6(_edge(x, .0003, .05), .6)


def sfx_checktick():
    """An ink tick on paper (0.3 s), three times: the pen meets the paper (a soft 700 Hz tock of the clipboard), the short down-stroke (a 30 ms scratch at 1.5 to 6 kHz) and the long up-stroke that
    lifts away (70 ms, brighter, fading out). Each tick is a little different (the hand is quick but not a machine)."""
    k = _nth("checktick")
    r = rng6(3130 + k)
    x = np.zeros(_n(.3))
    tt = tarr(.04)
    _place(x, np.sin(2 * np.pi * (700 + 40 * k) * tt) * np.exp(-tt / .008) * .5 + _band(3131 + k, .04, 800, 3500) * np.exp(-tt / .003) * .4, 0.0, 1.0)
    d1 = .03 * r.uniform(.85, 1.15)
    _place(x, _scrape(3132 + k, d1, 1500, 6000, 70), .004, .8)
    d2 = .07 * r.uniform(.85, 1.2)
    t2 = tarr(d2)
    _place(x, _scrape(3134 + k, d2, 2200, 8000, 90, np.minimum(1, t2 / .008) * np.exp(-t2 / (d2 * .5))), .004 + d1 + .008, .9)
    return norm6(_edge(x, .0004, .04), .6)


def sfx_stamp():
    """A rubber stamp brought down hard (0.6 s): the handle's rush of air (20 ms), the impact (a deep thump that sags from 95 to 58 Hz), the rubber's flat slap on paper (a 300 to 2500 Hz burst) and
    the surface knocked: TITLE and END CARD a desk (a wooden knock at 180 and 520 Hz, a little room), EXIT a clipboard held in the hand (a lighter, higher plastic knock at 760 Hz, no thump); then
    the inked rubber's tacky lift (a short 'tchk' at 1 to 4 kHz, 0.13 s later)."""
    k, scene, i = _ctx("stamp")
    x = np.zeros(_n(.6))
    light = scene == "exit"
    _place(x, _band(3140 + k, .02, 800, 5000) * np.linspace(0, 1, _n(.02)) ** 2 * .25, 0.0, 1.0)
    at = .02
    tt = tarr(.25)
    if not light:
        _place(x, _sin_of(58 + 37 * np.exp(-tt / .03)) * np.exp(-tt / .06) * 1.0, at, 1.0)
        _place(x, (np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / .03) * .6 + np.sin(2 * np.pi * 520 * tt) * np.exp(-tt / .012) * .35), at, 1.0)
    else:
        _place(x, (np.sin(2 * np.pi * 760 * tt) * np.exp(-tt / .015) * .55 + _sin_of(140 + 60 * np.exp(-tt / .02)) * np.exp(-tt / .04) * .35), at, 1.0)
    _place(x, _band(3141 + k, .06, 300, 2500) * expdecay(.06, .012) * 1.1, at, 1.0)
    _place(x, _band(3142 + k, .05, 1000, 4000) * expdecay(.05, .006) * (.25 if light else .3), at + .13, 1.0)
    if not light:
        x = x + .12 * signal.fftconvolve(x, _small_ir(3143, rt=.25, pre=.004, lo=150, hi=4000))[:len(x)]
    return norm6(_edge(x, .0003, .1), .8 if not light else .7)


def sfx_textding():
    """A text ding (1.0 s): a soft two-note bell, the tonic and the fifth of D: D6 then A6, the second 90 ms after the first (the title and the end card)."""
    x = np.zeros(_n(1.0))
    _place(x, _call_ding(1174.7, .22), 0.0, .9)
    _place(x, _call_ding(1760.0, .3), .09, .8)
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
    """The state form typing itself in (2.7 s): a manual typewriter, words of four to seven keys at about 85 ms with a space bar between, and at the end of each of the two rows the carriage bell (a
    small bell at 2.1 kHz) and the carriage return (a ratcheting zip of 0.2 s and the carriage's thump)."""
    k = _nth("typing")
    r = rng6(3150 + k)
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
            rat = _band(3151 + row, dd, 1000, 5000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 55 * tt))) * np.interp(tt, [0, .03, dd], [0, 1, .3])
            _place(x, rat, t + .12, .5)
            _place(x, _thump(160, 90, .12, .03), t + .33, .6)
            t += .5
            row += 1
            continue
        space = j % 6 == 5
        _place(x, _typebar(3160 + 7 * k + j, r.uniform(.55, 1.0), space), t, 1.0)
        t += .085 * r.uniform(.75, 1.3) + (.05 if space else 0)
        j += 1
    return norm6(_edge(_lp4(x, 6000, 2), .001, .08), .6)


# ================================================================ arrive: the doors, the silhouettes, the PA, Binder
def sfx_doorchime():
    """The front doors' entry chime (1.4 s): the shop-door 'ding-dong' of an automatic door, two soft electronic bells a major third apart (E6 then C6, 0.3 s apart, pure sines with a faint 3x
    partial and a slow decay). ARRIVE: the glass doors swing open under it (a hush of outside air through the doorway, the weather strip brushing the floor). EXIT (Eggplant bursts in): the same
    chime, the glass doors flung open (a push of air, both leaves banging their stops, the glass shivering) and the snowy night blowing in for a moment (a cold rush of wind)."""
    k, scene, i = _ctx("doorchime")
    x = np.zeros(_n(1.5))
    for at, f, g in ((0.0, 1318.5, 1.0), (.3, 1046.5, .85)):
        d = 1.1
        t = tarr(d)
        tone = (np.sin(2 * np.pi * f * t) + .12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / .08)) * np.exp(-t / .42) * np.minimum(1, t / .006)
        _place(x, tone, at, g)
    if scene == "exit":
        tt = tarr(.3)
        _place(x, _lp4(noise6(.3, 3170), 900, 2) * np.interp(tt, [0, .2, .3], [0, 1, .4]) * .3, 0.0, 1.0)
        for j, at in enumerate((.22, .27)):
            _place(x, _thump(150, 95, .14, .025) * .7 + _band(3171 + j, .1, 400, 2500) * expdecay(.1, .01) * .45 + _glass(2350 + 140 * j, .3, .05, .001) * .12, at, 1.0 - .2 * j)
        d = 1.2
        t = tarr(d)
        _place(x, _bp4(noise6(d, 3172), 200, 2600, 2) * np.interp(t, [0, .25, .5, d], [0, 1, .45, 0]) * .2, .2, 1.0)
        _place(x, _band(3173, .9, 2500, 8000) * np.interp(tarr(.9), [0, .3, .9], [0, 1, 0]) * .04, .25, 1.0)
    else:
        d = 1.3
        t = tarr(d)
        _place(x, _lp4(noise6(d, 3173), 1800, 2) * np.interp(t, [0, .15, .6, d], [0, 1, .5, 0]) * .12, 0.0, 1.0)
        _place(x, _band(3174, .35, 1200, 5000) * np.sin(np.pi * np.clip(tarr(.35) / .35, 0, 1)) * .06, .05, 1.0)
    return norm6(_edge(x, .001, .3), .55)


def sfx_dramatic():
    """A mock-thriller sting for the two silhouettes in the doorway (1.9 s, stereo): a huge low brass 'BRAAAM' (saws on D1, D2, A2 and D3, a filter that opens from 300 Hz to 2 kHz in 0.3 s and
    closes again, driven into a soft distortion), a timpani and a bass drum on the hit, a high string screech over it (a cluster of B6, C7 and C-sharp7 in tremolo, 0.9 s) and a sub that drops from
    55 to 32 Hz. It dies before Kale's first word (1.0 s after the hit it is 20 dB down)."""
    d = 1.9
    t = tarr(d)
    env = np.minimum(1, t / .025) * np.exp(-t / .42)
    fc = 300 + 1700 * np.interp(t, [0, .3, 1.0, d], [0, 1, .3, 0])
    br = sum(osc("saw", midi(m) * (1 + .002 * j), d) for j, m in enumerate((26, 38, 45, 50)))
    br = _tv_filter(br, fc, .9, "lp")
    br = np.tanh(2.2 * br / (np.max(np.abs(br)) + 1e-9)) * env
    out = np.zeros((2, _n(d)))
    out += _ctr(br, -.15) * .8 + _ctr(_wobble(br, .0008, 5.5), .15) * .8
    tm = osc("sine", np.linspace(70, 55, _n(d)), d) * np.exp(-t / .5) + _lp4(noise6(d, 3180), 300, 2) * np.exp(-t / .08) * .6
    out += _ctr(tm * .9, 0.0)
    sc = sum(np.sin(2 * np.pi * midi(m) * t + m) for m in (95, 96, 97)) * (.6 + .4 * np.sin(2 * np.pi * 13 * t)) * np.interp(t, [0, .05, .9, 1.1], [0, 1, .3, 0], right=0)
    out += np.stack([sc, np.roll(sc, 300)]) * .06
    out += _ctr(_sin_of(55 * (32 / 55) ** np.clip(t / 1.2, 0, 1)) * np.exp(-t / .6) * .7, 0.0)
    return norm6(_edge(out, .0005, .5), .85)


def sfx_pachime():
    """The page's two-tone ceiling chime (1.3 s), a major third down: E5 and C5, each a soft tubular bell (a sine and its 2.76x partial that fades quickly, a faint octave), 0.42 s apart, through
    the same cheap driver as the voice that follows it (350 Hz to 3.6 kHz, a little saturation) and a small slap echo (110 ms). Ding, dong: CODE SURVEY."""
    x = np.zeros(_n(1.5))
    for at, f, g in ((0.0, 659.25, 1.0), (.42, 523.25, .9)):
        d = .95
        t = tarr(d)
        bell = (np.sin(2 * np.pi * f * t) + .22 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / .12) + .1 * np.sin(4 * np.pi * f * t) * np.exp(-t / .25)) * np.exp(-t / .38)
        _place(x, bell * np.minimum(1, t / .004), at, g)
    y = np.tanh(1.5 * _bp4(x, 350, 3600, 2) / (np.max(np.abs(x)) + 1e-9)) * .7
    y = y + _delay(_bp4(y, 400, 2800, 1), 110, .22)
    return norm6(_edge(y, .002, .2), .6)


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
    """Onion's sniffle (0.5 s, as Episode 20 left it): a wet inhale through the nose, twice (a band of noise that moves up through two nasal formants, 700 then 1500 Hz) and a snort of 'nnk' at the
    end (a 150 Hz nasal buzz for 40 ms), a few wet crackles."""
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
    tremble (7.5 Hz in pitch and level). JOY: high, rising (330 to 440 Hz), quick (0.3 s), a laugh caught in a cry. Sad: falling (390 to 270 Hz), slower and longer (0.42 s)."""
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
    """One wet inhale through the nose (0.2 s): a band of noise that climbs through the nasal formants (850 to 1700 Hz) and the 'nnk' at its end (a 165 Hz nasal buzz for 40 ms)."""
    d = .17
    t = tarr(d)
    x = np.zeros(_n(.22))
    _place(x, _tv_filter(noise6(d, 1891 + 2 * k), _glide(850, 1700, d), 2.2, "bp") * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * .85, 0.0, 1.0)
    _place(x, _lp4(osc("saw", 165, .04), 1200, 2) * np.hanning(_n(.04)) * .35, d - .02, 1.0)
    return x


def sfx_sniffle():
    """Onion's sniffles. ARRIVE (both cues, the picture's sobs of joy: 'The State is here!' and 'the best day of my life') and EXIT ('Per regulation!'): a SOB OF JOY ON THE CUE (the voiced 'hnn'
    rising like a laugh caught in a cry, 0.3 s), then one quick wet sniff where there is room before the next line (not after 'life': Mr. Radish speaks 0.25 s later). CLOSET ('Not Brenda.', under
    the sad trombone): Episode 20's plain double sniffle."""
    k, scene, i = _ctx("sniffle")
    if scene == "closet" or scene is None:
        return norm6(_edge(_sniff(k), .003, .08), .55)
    sb = _sob(k, True)
    out = np.zeros(_n(.6))
    _place(out, sb / (np.max(np.abs(sb)) + 1e-9), 0.0, .85)
    if not (scene == "arrive" and i == 1):
        sn = _one_sniff(k)
        _place(out, sn / (np.max(np.abs(sn)) + 1e-9), .28, .7)
    return norm6(_edge(out, .002, .06), .55)


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


def sfx_scatter():
    """'All staff to your stations.' (designed event, 1.1 s, stereo): everyone scatters at once in a comic burst: eight people's quick footsteps running off in every direction (each a run of five
    or six steps, 90 to 120 ms apart, moving out from the middle to its own side and fading), three cartoon zips (a band of air that rushes up from 900 Hz to 5 kHz in 0.18 s, flung left, right and
    left), a sheaf of papers flying and a desk chair left spinning."""
    r = rng6(3190)
    out = np.zeros((2, _n(1.2)))
    for p in range(8):
        side = (-1) ** p * r.uniform(.3, .95)
        t = r.uniform(0, .12)
        for s in range(int(r.integers(5, 7))):
            tt = tarr(.06)
            st = _band(3191 + 11 * p + s, .06, 300, 3500) * np.exp(-tt / .012) + np.sin(2 * np.pi * r.uniform(110, 160) * tt) * np.exp(-tt / .015) * .5
            _put2(out, st, t, .5 * (1 - s / 7), side * min(1, .2 + s * .18))
            t += r.uniform(.09, .12)
    for j, (at, pan) in enumerate(((.02, -.7), (.09, .75), (.17, -.4))):
        dd = .18
        tt = tarr(dd)
        z = _tv_filter(noise6(dd, 3200 + j), 900 * (5000 / 900) ** (tt / dd), 2.0, "bp") * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** 1.4
        _put2(out, z, at, .55, pan)
    _put2(out, _hit_train(3205, .5, 22, 1500, 7000, .006, .5, .1), .1, .35)
    tt = tarr(.8)
    _put2(out, _band(3206, .8, 400, 2000) * (.5 + .5 * np.sin(2 * np.pi * 9 * tt * (1 - .6 * tt / .8))) * np.exp(-tt / .35) * .2, .25, 1.0, .35)
    return norm6(_edge(out, .002, .2), .55)


def sfx_sting():
    """The stings, one fitted to each scene (1.2 to 1.6 s).
    arrive (the surveyors in the lobby, clipboards up, pens ready): the State's procedure in a nutshell: three dry pizzicato notes in D minor (D A D) and a bassoon that lands on a low D under a
    woodblock (the pen) and a soft timpani; the pen's last tick.
    prep (the perfect, terrifyingly clean station): a gleam: a glassy run up the D major scale, a 'too clean' choir chord (D major on 'ah') that is cut short, a high ting.
    medpass (the two halves): both pieces end on the same chord at once: on the left a polite string cadence (F major, a curtsy of a trill), on the right the ragtime's two bits ('shave and a
    haircut', the last two notes), the same F.
    closet (after the sad trombone of 'Not Brenda.'): a button: a low pizzicato D, a muffled timpani and the soft thud of one more binder sliding off the pile.
    exit (the last two-shot, after 'I took a break.'): warm: a D major ninth on soft strings and a felt piano (the score's last chord), the shift bell's chime once more, high and quiet."""
    k, scene, i = _ctx("sting")
    x = np.zeros(_n(1.7))
    if scene == "arrive":
        for at, m in ((0.0, 62), (.16, 69), (.32, 50)):
            _place(x, M21.pizz(midi(m), .3), at, .8)
        _place(x, M21.bassoon(38, .9, .8), .32, .55)
        tt = tarr(.05)
        _place(x, _res(_band(3210, .05, 1500, 6000) * np.exp(-tt / .003), 1900, 5) * 1.5, .32, .5)
        _place(x, M21.timp(73.4, 1.0), .32, .35)
        _place(x, _click(3211, 3000, .003), 1.05, .25)
    elif scene == "prep":
        for j, m in enumerate((86, 88, 90, 91, 93, 95, 97, 98)):
            _place(x, _glass(midi(m), .5, .15, .001) * .5, j * .045, .45 + .05 * j)
        ch = M21.choir([62, 66, 69, 74], .75, "a", a=.05, r=.2)
        _place(x, ch[0] * .5 + ch[1] * .5, .38, .55)
        _place(x, _glass(midi(105), 1.0, .3, .001), 1.13, .3)
    elif scene == "medpass":
        L = np.zeros(_n(1.7))
        for at, ns, dd in ((0.0, (65, 72, 77), .25), (.3, (67, 72, 76), .25), (.6, (53, 65, 69, 72, 77), .9)):
            for m in ns:
                _place(L, M21.spic(m, dd), at, .3)
        _place(L, M21.cello(41, .9, .8), .6, .25)
        R = np.zeros(_n(1.7))
        for at, ms in ((.3, (55, 59, 62)), (.6, (53, 57, 60, 65))):
            for m in ms:
                _place(R, M21.piano(m, .6, .8), at, .25)
        _place(R, M21.piano(29, .9, .8), .6, .35)
        out = np.stack([L * .95 + R * .3, L * .3 + R * .95])
        return norm6(_edge(out, .0005, .3), .75)
    elif scene == "closet":
        _place(x, M21.pizz(midi(38), .5), 0.0, .9)
        tt = tarr(.6)
        _place(x, _lp4(M21.timp(73.4, .6), 600, 2) * .8, 0.0, .6)
        _place(x, _unit(_m_binder(.8, 1.0, 3212)) * .35, .32, 1.0)
    else:                                                                                   # exit
        d = 1.6
        _place(x, _soft((38, 45, 50, 54, 57, 64), d, .15, .9, 1800), 0.0, 1.0)
        _place(x, M21.felt(50, 1.4, .5), .05, .35)
        _place(x, M21.felt(66, 1.2, .45), .12, .25)
        _place(x, _bell(1174.7, 1.4, .6) * .25, .2, 1.0)
    x = x[:_n(1.6)]
    return norm6(_edge(x, .0005, .3), .72)


def _soft(notes, d, a=.04, tau=None, lp=1800, saw=.5):
    """A warm chord for the stings: sines and a little saw, a slow attack, closed off at `lp`."""
    t = tarr(d)
    tau = tau or d * .6
    x = sum(np.sin(2 * np.pi * midi(m) * t) + saw * osc("saw", midi(m) * 1.002, d) * .4 for m in notes) / max(1, len(notes))
    return _lp4(x, lp, 2) * np.minimum(1, t / a) * np.exp(-t / tau)


# ================================================================ prep: the montage, cut to the beat (each effect carries its own smaller second hit exactly 0.5 s after the cut: the off-beat)
OFF = .5             # the off-beat of the montage's grid (120 bpm)


def _plastic_knock(seed, f=900.0, d=.12, body=150.0):
    t = tarr(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / .012) * .6 + _band(seed, d, 700, 4000) * np.exp(-t / .006) * .7 + np.sin(2 * np.pi * body * t) * np.exp(-t / .03) * .5


def _tacky(seed, d=.07, lo=2000, hi=6500):
    """Something sticky letting go: a rasp of noise roughened at 110 Hz, a fast rise and a dying tail."""
    t = tarr(d)
    return _band(seed, d, lo, hi) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 110 * t))) * np.minimum(1, t / .006) * np.exp(-t / (d * .45))


def sfx_labelgun():
    """A pricing label gun (0.8 s). ON THE CUT the applicator's 'ka-CHUNK' (a 900 Hz plastic knock over a 150 Hz thump, a hard click on top), then the trigger's ratchet letting go (three fast
    clicks), the label torn off its backing (a tacky rasp) and pressed onto the carton (a flat pat); on the off-beat a second, quicker label (a smaller clack and pat)."""
    x = np.zeros(_n(.85))
    _place(x, _plastic_knock(3223, 900, .12, 150) + _click(3228, 2800, .003) * .5, 0.0, 1.0)
    for j in range(3):
        _place(x, _click(3220 + j, 2600 + 300 * j, .002), .045 + j * .017, .3)
    _place(x, _tacky(3224), .1, .45)
    tt = tarr(.06)
    _place(x, _band(3225, .06, 300, 2500) * np.exp(-tt / .008) * .7, .17, 1.0)
    _place(x, _plastic_knock(3226, 980, .1, 160) * .55 + _tacky(3227, .05) * .25, OFF, 1.0)
    return norm6(_edge(x, .0003, .06), .75)


def sfx_padlock():
    """The snack drawer padlocked (0.85 s). ON THE CUT the shackle snapped home (a hard steel clack: a 2.7 kHz ring with an inharmonic 4.8 kHz partial over a 600 Hz body), the hasp rattling and the
    lock's body swinging against the drawer front (a dull clank 80 ms later); on the off-beat the lock tugged once to check it (a short rattle and a tap)."""
    x = np.zeros(_n(.9))
    clack = _ping(2700, .4, .05, (1.0, 1.78, 2.9), (1.0, .55, .3), (1.0, .5, .3)) + _band(3231, .05, 3000, 9000) * expdecay(.05, .002) * 1.2 + _thump(600, 420, .08, .012) * .5
    _place(x, clack, 0.0, 1.0)
    _place(x, _hit_train(3230, .08, 6, 2500, 7000, .003, .4, .2)[0], .015, .4)
    _place(x, _ping(1900, .25, .03, (1.0, 2.4), (1.0, .4), (1.0, .5)) * .4 + _thump(300, 200, .08, .015) * .4, .08, .7)
    _place(x, _hit_train(3232, .1, 7, 2000, 6500, .003, .5, .2)[0] + _ping(2300, .2, .02, (1.0, 2.6), (1.0, .3), (1.0, .5)) * .3, OFF, .6)
    return norm6(_edge(x, .0003, .08), .75)


def sfx_spray():
    """A spray bottle and a cloth (0.95 s): the trigger pulled twice (a plastic click and a fine mist, 'pssht', 1.8 to 9 kHz, 0.14 s, the first ON THE CUT, the second 0.13 s later), then on the
    off-beat the cloth's quick squeaky wipe (two strokes of a rubbery 1.1 kHz squeak) and the gleam: a small glass 'ting' at 3.5 kHz."""
    x = np.zeros(_n(1.0))
    for j in range(2):
        at = j * .13
        _place(x, _click(3240 + j, 2200, .003) * .5, at, 1.0)
        dd = .14
        tt = tarr(dd)
        _place(x, _band(3242 + j, dd, 1800, 9000) * np.minimum(1, tt / .003) * np.exp(-tt / .05) * 1.0, at + .002, 1.0 - .2 * j)
    for j, (at, dd) in enumerate(((OFF - .12, .1), (OFF - .01, .09))):
        tt = tarr(dd)
        sq = _sin_of(_glide(1050 + 80 * j, 1250 + 80 * j, dd)) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 45 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1))
        _place(x, _res(sq, 1150, 3.0) * .25 + _band(3244 + j, dd, 800, 3000) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) * .2, at, 1.0)
    _place(x, _glass(3520, .45, .14, .001) * .45, OFF + .06, 1.0)
    return norm6(_edge(x, .0004, .1), .7)


def sfx_thermobeep():
    """The fridge thermometer and its log (0.95 s): ON THE CUT the digital thermometer's double beep (two short 3.9 kHz beeps, 70 ms each, 50 ms apart), and on the off-beat the temperature log
    signed (a quick pen scribble of four strokes on paper on a clipboard)."""
    x = np.zeros(_n(1.0))
    for j in range(2):
        dd = .07
        tt = tarr(dd)
        b = (np.sin(2 * np.pi * 3900 * tt) + .3 * np.sin(2 * np.pi * 11700 * tt)) * np.minimum(1, np.minimum(tt / .002, (dd - tt) / .004))
        _place(x, b, j * .12, .45)
    for j, dd in enumerate((.05, .04, .06, .08)):
        _place(x, _scrape(3250 + j, dd, 1800, 7000, 80), OFF + .06 * j + .004 * (j % 2), .55 - .05 * j)
    tt = tarr(.04)
    _place(x, np.sin(2 * np.pi * 760 * tt) * np.exp(-tt / .008) * .3, OFF - .01, 1.0)
    return norm6(_edge(x, .0003, .08), .7)


def sfx_binderslam():
    """A row of policy binders slammed into place (0.9 s): ON THE CUT the row slammed home against the end of the shelf (a heavy wooden knock with a 95 Hz body, the vinyl boards' flat slap at 1.2 to
    3 kHz), the binders in the row knocking into each other just after it (two quick slaps) and the metal rings inside rattling; on the off-beat the last binder tipping upright against the row (a
    small slap and a ring tick)."""
    x = np.zeros(_n(.95))
    tt = tarr(.3)
    _place(x, _sin_of(95 + 60 * np.exp(-tt / .02)) * np.exp(-tt / .05) * 1.0 + np.sin(2 * np.pi * 380 * tt) * np.exp(-tt / .018) * .5 + _band(3263, .3, 300, 2500) * np.exp(-tt / .012), 0.0, 1.0)
    _place(x, _unit(_m_binder(.7, .9, 3260)) * .7, 0.0, 1.0)
    for j, at in enumerate((.03, .055)):
        _place(x, _unit(_m_binder(.8 + .1 * j, .8, 3261 + j)) * (.45 - .1 * j), at, 1.0)
    _place(x, _hit_train(3264, .2, 12, 2500, 6500, .004, .6, .1)[0], .01, .4)
    _place(x, _m_binder(.35, .7, 3265) * .8 + _ping(2900, .15, .02, (1.0, 2.5), (1.0, .3), (1.0, .5)) * .2, OFF, .55)
    return norm6(_edge(x, .0003, .08), .85)


def sfx_mop():
    """A wet mop and the WET FLOOR sign (0.95 s): ON THE CUT the wet mop head slapped onto the floor (a 'splat': a burst of 300 Hz to 3 kHz noise with a fast attack and a low wet thump), then its
    squelchy swipe across the floor (a band of noise from 2 kHz down to 600 Hz with a 22 Hz slosh, fading) and the drips of the strings; on the off-beat the yellow sign snapped open and set down (a
    plastic clack and a small hollow boing)."""
    x = np.zeros(_n(1.0))
    tt = tarr(.12)
    _place(x, _band(3274, .12, 300, 3000) * np.minimum(1, tt / .002) * np.exp(-tt / .025) * 1.0 + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / .03) * .6, 0.0, 1.0)
    dd = .3
    t = tarr(dd)
    sw = _tv_filter(noise6(dd, 3270), 2000 * (600 / 2000) ** (t / dd), 1.2, "bp") * (.6 + .4 * np.abs(np.sin(2 * np.pi * 22 * t))) * np.exp(-t / .12)
    _place(x, sw, .02, .9)
    _place(x, _lp4(noise6(dd, 3271), 600, 2) * np.exp(-t / .1) * .5, .02, 1.0)
    r = rng6(3272)
    for j in range(5):
        d2 = .03
        t2 = tarr(d2)
        _place(x, np.sin(2 * np.pi * r.uniform(900, 1700) * t2 * (1 + 1.5 * t2 / d2)) * np.exp(-t2 / .008), .2 + r.uniform(0, .2), r.uniform(.05, .15))
    _place(x, _plastic_knock(3273, 1100, .12, 200) * .8, OFF, 1.0)
    d3 = .3
    t3 = tarr(d3)
    _place(x, _sin_of(330 * (1 - .25 * (1 - np.exp(-t3 / .1))) * (1 + .06 * np.sin(2 * np.pi * 14 * t3) * np.exp(-t3 / .1))) * np.exp(-t3 / .08) * .3, OFF + .02, 1.0)
    return norm6(_edge(x, .001, .08), .7)


def sfx_posterflip():
    """The FUN COMMITTEE poster flipped to a hand-hygiene poster (0.85 s): the sheet whipped over in a quick 'fwip' (a band of air that rises from 900 Hz to 4.5 kHz in 50 ms, the paper's flutter
    at 40 Hz) and slapped flat on the board ON THE CUT (40 ms in: a papery smack and a 240 Hz knock of the board), and on the off-beat a thumb tack pushed in (a small hard click into cork)."""
    x = np.zeros(_n(.9))
    dd = .06
    tt = tarr(dd)
    _place(x, _tv_filter(noise6(dd, 3280), 900 * (4500 / 900) ** (tt / dd), 1.6, "bp") * (.6 + .4 * np.sin(2 * np.pi * 40 * tt)) * np.minimum(1, tt / .004) * .8, 0.0, 1.0)
    t2 = tarr(.1)
    _place(x, _band(3281, .1, 400, 4500) * np.exp(-t2 / .016) * 1.4 + np.sin(2 * np.pi * 240 * t2) * np.exp(-t2 / .015) * .45, .035, 1.0)
    _place(x, _click(3282, 2900, .003) * .6 + _thump(180, 120, .05, .01) * .2, OFF, 1.0)
    return norm6(_edge(x, .0005, .08), .7)


def sfx_closetslam():
    """A closet door slammed on Brenda (0.95 s): ON THE CUT the door's slam into the frame (a 110 Hz thud of a hollow-core door, a wooden knock at 420 Hz, a crack of the frame at 1 to 4 kHz), the
    latch catching just after it and the frame rattling; on the off-beat the NOT A CLOSET sign swinging on its nail (two small taps) and, from inside, a muffled 'hm' (a 220 Hz hum through the door)."""
    x = np.zeros(_n(1.0))
    t2 = tarr(.35)
    _place(x, _sin_of(110 * (1 - .2 * (1 - np.exp(-t2 / .03)))) * np.exp(-t2 / .07) * 1.0 + np.sin(2 * np.pi * 420 * t2) * np.exp(-t2 / .02) * .55 + _band(3291, .35, 200, 2500) * np.exp(-t2 / .02) * .8
           + _band(3295, .35, 1000, 4000) * np.exp(-t2 / .01) * .9 + np.sin(2 * np.pi * 700 * t2) * np.exp(-t2 / .012) * .35, 0.0, 1.0)
    _place(x, _hit_train(3292, .15, 8, 800, 3500, .004, .4, .1)[0] + _click(3293, 3100, .003) * .4, .03, .5)
    for j in range(2):
        _place(x, _plastic_knock(3294 + j, 1300, .06, 300) * .25, OFF + .07 * j, 1.0)
    t3 = tarr(.15)
    hm = _lp4(osc("saw", 220 * (1 - .05 * t3 / .15), .15), 500, 2) * np.sin(np.pi * np.clip(t3 / .15, 0, 1))
    _place(x, hm * .12, OFF + .1, 1.0)
    return norm6(_edge(x, .0005, .08), .85)


def sfx_coffeehide():
    """The coffee maker swept into a drawer (0.95 s): ON THE CUT the drawer slammed shut on it (a wooden bang with a 120 Hz body) and the glass carafe clinking inside (a bright clink at 2.3 kHz a
    hair after, a smaller one 0.1 s later), the drawer's runners rumbling to a stop; on the off-beat the last of the rattle (a tiny clink and a slosh)."""
    x = np.zeros(_n(1.0))
    t2 = tarr(.3)
    _place(x, _sin_of(120 + 70 * np.exp(-t2 / .02)) * np.exp(-t2 / .05) * .9 + np.sin(2 * np.pi * 510 * t2) * np.exp(-t2 / .015) * .4 + _band(3302, .3, 300, 2500) * np.exp(-t2 / .01) * .6, 0.0, 1.0)
    _place(x, _glass(2300, .4, .08, .001) * .55 + _glass(3450, .3, .05, .001) * .22, .012, 1.0)
    _place(x, _glass(2650, .3, .06, .001) * .25, .11, 1.0)
    _place(x, _lp4(noise6(.1, 3301), 800, 2) * np.exp(-tarr(.1) / .03) * .4, .02, 1.0)
    _place(x, _glass(2900, .25, .05, .001) * .18 + _lp4(noise6(.15, 3303), 1200, 2) * np.sin(np.pi * np.clip(tarr(.15) / .15, 0, 1)) * .12, OFF, 1.0)
    return norm6(_edge(x, .0005, .08), .8)


def sfx_sanitizer():
    """A wall dispenser of hand sanitizer. PREP (the montage): the refill bottle snapped into the dispenser (a plastic clack and a click) and on the off-beat one pump of foam (the piston's 'pshht-chk':
    a short hiss of foam and the lever's return click). MEDPASS (the State's half, twice): one careful pump each time (the lever, the foam's soft squish, the click), a little quieter."""
    k, scene, i = _ctx("sanitizer")
    x = np.zeros(_n(.95))

    def pump(seed, at, g):
        dd = .16
        tt = tarr(dd)
        _place(x, _plastic_knock(seed, 760, .08, 180) * .4, at, g)
        _place(x, _band(seed + 1, dd, 1200, 6000) * np.minimum(1, tt / .01) * np.exp(-tt / .05) * .55 + _lp4(noise6(dd, seed + 2), 900, 2) * np.exp(-tt / .04) * .4, at + .02, g)
        _place(x, _click(seed + 3, 2500, .003) * .35, at + .19, g)
    if scene == "prep":
        _place(x, _plastic_knock(3310, 820, .12, 160) + _click(3311, 2700, .003) * .5, 0.0, 1.0)
        pump(3312, OFF, .8)
    else:
        pump(3316 + 4 * k, 0.0, .8)
    return norm6(_edge(x, .001, .08), .7 if scene == "prep" else .55)


def sfx_crashcart():
    """The crash cart sealed with a fresh red tag (0.85 s): ON THE CUT the tag's lock snapped shut (a crisp plastic snap and a click of 2 to 8 kHz), then the spare strap zipped tight through it (a
    ratchet of fourteen teeth in 70 ms that fades), and on the off-beat a flat pat on the cart's lid (a hollow metal 'tunk' at 520 Hz)."""
    x = np.zeros(_n(.9))
    _place(x, _click(3330, 2200, .006) * 1.2 + _band(3331, .06, 1500, 8000) * expdecay(.06, .008) * 1.0 + _thump(400, 260, .06, .012) * .5
           + _ping(1500, .12, .03, (1.0, 2.6, 4.3), (1.0, .4, .2), (1.0, .5, .3)) * .35, 0.0, 1.0)
    for j in range(14):
        _place(x, _click(3320 + j % 5, 3000 + 40 * (j % 7), .0015, .012) * (.4 - .02 * j), .03 + j * .005, 1.0)
    _place(x, _ping(520, .25, .05, (1.0, 2.2, 3.9), (1.0, .4, .2), (1.0, .5, .3)) * .45 + _thump(200, 140, .1, .02) * .4, OFF, 1.0)
    return norm6(_edge(x, .0003, .08), .75)


def sfx_sparkle():
    """A sparkle (1.2 s): ON THE CUT one clear glass hit (D7 with a bright 2.76x partial), then a shimmering glissando of glass up the D major scale (twelve notes in 0.3 s from A6), a cluster of tiny
    high glints scattered over 0.6 s and, on the off-beat, one clear ting (D8). PREP's second (the station gleams under 'Survey ready.'): the same, softer and a little slower."""
    k, scene, i = _ctx("sparkle")
    r = rng6(3340 + k)
    x = np.zeros(_n(1.25))
    _place(x, _glass(midi(98), .6, .2, .0008, 1.4), 0.0, .9 if i == 0 else .5)
    sc = (93, 95, 97, 98, 100, 102, 103, 105, 107, 109, 110, 112)
    sp = .025 if i == 0 else .035
    for j, m in enumerate(sc):
        _place(x, _glass(midi(m), .5, .12, .001), .02 + j * sp, .25 + .03 * j)
    for j in range(18):
        _place(x, _glass(r.uniform(5000, 9500), .2, .03, .001), r.uniform(.05, .65), r.uniform(.05, .15))
    _place(x, _glass(midi(110), .7, .25, .001) * .6, OFF, 1.0)
    return norm6(_edge(x, .0005, .2), .7 if i == 0 else .45)


def _poof1(k):
    """One cartoon smoke puff (Episode 15's, verbatim): the k-th has its own pitch for the 'foomp' (230, 170, 300, 140, 200 Hz), its own length and its own ending (a tiny sparkle, a pop or a
    fading hiss)."""
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
    return x


def sfx_poof():
    """A cartoon smoke puff (0.45 s): the prep's three waves of agency Strawberries are three different puffs (Episode 15's family). EXIT (all forty vanish at once, 0.9 s, stereo): five puffs in
    35 ms across the field, a deep shared 'foomp' (a 110 Hz sine that sags) and a scatter of tiny glints as the badges go."""
    k, scene, i = _ctx("poof")
    if scene != "exit":
        return norm6(_edge(_poof1(k), .001, .15), .65)
    out = np.zeros((2, _n(.9)))
    for j in range(5):
        _put2(out, _poof1(j + 5), j * .009, .5, (-.7, .7, -.3, .35, 0.0)[j])
    tt = tarr(.4)
    _put2(out, _sin_of(110 * (1 - .5 * (1 - np.exp(-tt / .08)))) * np.exp(-tt / .1) * .8, 0.0, 1.0, 0.0)
    r = rng6(1950)
    for j in range(14):
        _put2(out, _glass(r.uniform(3000, 6000), .2, .05, .001) * .3, r.uniform(.1, .5), r.uniform(.3, .7), r.uniform(-.8, .8))
    return norm6(_edge(out, .001, .2), .7)


# ================================================================ medpass: the split, the cups, the cart, the call bells
def sfx_splitwipe():
    """The frame splits (0.6 s, stereo): the divider is already falling when the cue comes (the picture's band falls from 0.28 to 0.66 s and its whoosh peaks at 0.50): a whoosh that bursts in at once
    (an 8 ms attack) and falls from 5 kHz to 700 Hz as it dies (0.25 s, a different noise in each ear), a faint falling sine under it, and a soft glassy tick (2.4 kHz) 0.16 s after the cue, where
    the band lands at the foot of the frame."""
    d = .3
    t = tarr(d)
    out = np.zeros((2, _n(.6)))
    env = np.minimum(1, t / .008) * np.exp(-t / .085)
    for c in range(2):
        out[c, :len(t)] += _tv_filter(noise6(d, 3350 + c), 5000 * (700 / 5000) ** np.clip(t / .25, 0, 1), 1.5, "bp") * env * .7
    out[:, :len(t)] += _ctr(_sin_of(_glide(900, 350, d)) * env * .05, 0.0)
    _put2(out, _glass(2400, .3, .05, .001) * .5 + _click(3352, 2400, .002) * .25, .16, 1.0, 0.0)
    return norm6(_edge(out, .001, .1), .6)


def sfx_cupclatter():
    """Med cups on a normal night (the right half). The first (1.0 s): three paper med cups juggled: hollow little tocks (1.2 to 2.4 kHz) as they knock together and are caught, the pills inside
    rattling (a shaker of tiny ticks) and one cup bouncing on the cart. The second (1.0 s): a whole cup of pills tipped into Mr. Pear's mouth like a candy dispenser: a rattling cascade of pills
    (forty tiny ticks in 0.45 s that thin out) and a satisfied 'gulp' (a 180 Hz glk)."""
    k = _nth("cupclatter")
    r = rng6(3360 + k)
    x = np.zeros(_n(1.0))
    if k == 0:
        for j in range(7):
            at = j * .1 + (r.uniform(0, .04) if j else 0.0)
            tt = tarr(.06)
            f = r.uniform(1200, 2400)
            _place(x, np.sin(2 * np.pi * f * tt) * np.exp(-tt / .008) * .6 + _band(3361 + j, .06, 900, 4500) * np.exp(-tt / .004) * .6, at, 1.0 if j == 0 else r.uniform(.5, 1.0))
        _place(x, _hit_train(3370, .7, 34, 2500, 8000, .002, .35, .1)[0], .02, .6)
        for j, at in enumerate((.72, .84, .9)):
            _place(x, _plastic_knock(3371 + j, 1500, .05, 260) * (.4 - .1 * j), at, 1.0)
    else:
        _place(x, _hit_train(3375, .55, 44, 2800, 9000, .0018, .7, .1, shape=1.3)[0], 0.0, .8)
        tt = tarr(.09)
        _place(x, _sin_of(_glide(190, 110, .09)) * np.exp(-tt / .035) * .6 + _band(3376, .09, 300, 1500) * expdecay(.09, .01) * .3, .62, .8)
    return norm6(_edge(x, .001, .1), .6)


def sfx_cartroll():
    """The med cart rolls away down the hall by itself (2.6 s, stereo, on the right): four casters rumbling (rolling noise under 300 Hz with the wheels' thump at 7 Hz, slowing), the bottles and cups
    on top rattling, one caster's squeak (a 1.4 kHz squeal on every turn), all of it going away: the level falls, the top closes from 6 kHz to 1.3 kHz and it moves from 0.5 to 0.95 to the right;
    far down the hall, at 2.2 s, it bumps into something (a soft distant clunk). It starts ON the cue with the brake pedal let go (a metal clack)."""
    d = 2.6
    t = tarr(d)
    away = np.interp(t, [0, .2, d], [.6, 1.0, .05]) ** 1.2
    rate = 7.0 * np.interp(t, [0, d], [1.0, .75])
    ph = np.cumsum(rate) / SR
    rum = _lp4(noise6(d, 3380), 300, 2) * (.7 + .3 * np.abs(np.sin(np.pi * ph)))
    rat = _hit_train(3381, d, 60, 1500, 6000, .003, .5, .2)[0] * (.5 + .5 * np.abs(np.sin(np.pi * ph * 1.5)))
    sq = _sin_of(1400 * (1 + .03 * np.sin(2 * np.pi * ph))) * np.clip(np.sin(2 * np.pi * ph) - .55, 0, 1) * 2.0
    x = _rms(rum) * 1.0 + _rms(rat) * .35 + _rms(sq) * .12
    x = _tv_filter(x * away, 6000 * (1300 / 6000) ** (t / d), .8, "lp")
    _place(x, (_thump(140, 90, .2, .04) + _band(3382, .2, 300, 1500) * expdecay(.2, .02) * .5) * .12, 2.2, 1.0)
    tt = tarr(.15)
    _place(x, (_ping(1300, .15, .02, (1.0, 2.3), (1.0, .4), (1.0, .5)) * .5 + _band(3383, .15, 800, 4000) * np.exp(-tt / .006) * .7) * np.max(np.abs(x)), 0.0, .9)
    return norm6(_edge(_pan_curve(x, np.interp(t, [0, d], [.5, .95])), .02, .3), .55)


def _pan_curve(x, pan):
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


def sfx_cartlock():
    """The med cart locked (designed event, the State's half, on 'Always.', 0.25 s): the lock's plunger pushed home (a tight plastic click at 2.4 kHz, a small steel tick at 3.8 kHz) over the
    cart's hollow body answering (a soft 320 Hz knock). Small and quiet: by the book."""
    x = np.zeros(_n(.25))
    tt = tarr(.12)
    _place(x, _click(3610, 2400, .003) * .8 + _ping(3800, .1, .012, (1.0, 2.2), (1.0, .3), (1.0, .5)) * .25 + np.sin(2 * np.pi * 320 * tt) * np.exp(-tt / .02) * .35, 0.0, 1.0)
    _place(x, _click(3611, 1900, .002) * .3, .035, 1.0)
    return norm6(_edge(x, .0003, .05), .4)


def sfx_callbell():
    """A call light down the hall (designed event, the right half's normal night, 1.3 s): the series' chime (ding, dong: A5 and E5), a little far (closed off at 3 kHz) and a touch of the hallway."""
    x = np.zeros(_n(1.3))
    _place(x, _bell(880.0, .6, .3), 0.0, 1.0)
    _place(x, _bell(659.26, .7, .34), .42, .9)
    return norm6(_edge(_lp4(x, 3000, 2), .002, .2), .5)


# ================================================================ closet: the doors, the avalanche, the scanner
def sfx_closetopen():
    """A closet opened. CLOSET (the policy closet, 1.1 s): the latch of a double door (a metal click), both doors swinging open (two hinge creaks: a stick-slip squeak that climbs from 300 to 420 Hz,
    0.35 s, the second a little lower) and the air of the doorway. EXIT (Brenda's closet, 0.7 s): one door: the latch, one quick creak and a soft bump against the wall."""
    k, scene, i = _ctx("closetopen")
    x = np.zeros(_n(1.1))
    if scene == "closet":                                                       # the doors burst under the weight behind them: a crack of the latch, the leaves banging their stops
        tt = tarr(.2)
        _place(x, _band(3395, .2, 900, 5000) * np.exp(-tt / .008) * 1.2 + _thump(160, 100, .2, .04) * .9 + _click(3396, 2900, .004) * .8, 0.0, 1.0)
        for j, at in enumerate((.11, .15)):
            _place(x, _thump(140, 95, .15, .03) * .6 + _band(3397 + j, .1, 300, 2500) * expdecay(.1, .01) * .5, at, .7 - .15 * j)
    else:
        _place(x, _click(3390 + k, 2600, .004) * .6 + _thump(180, 120, .05, .01) * .3, 0.0, 1.0)
    creaks = ((.03, 300, .3, .35), (.08, 270, .28, .28)) if scene == "closet" else ((.05, 330, .22, .4),)
    for at, f0, dd, g in creaks:
        tt = tarr(dd)
        f = _glide(f0, f0 * 1.4, dd)
        sq = (_sin_of(f) + .4 * _sin_of(2 * f)) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 24 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** .8
        _place(x, _res(sq, f0 * 1.2, 3.0) * .9, at, g)
    dd = .5
    _place(x, _lp4(noise6(dd, 3393 + k), 700, 2) * np.sin(np.pi * np.clip(tarr(dd) / dd, 0, 1)) * .2, .1, 1.0)
    if scene != "closet":
        _place(x, _thump(150, 100, .08, .015) * .3, .45, 1.0)
        x = x[:_n(.7)]
    return norm6(_edge(x, .001, .1), .6)


def _m_binder(ps, ds, seed):
    """One policy binder landing (the closet's foley voice): a vinyl-covered board slapping down flat (a 1.2 to 3 kHz slap and a 150 Hz board thump), the pages inside riffling (a short 2 to 7 kHz
    flutter) and the three metal rings ticking (a small inharmonic ping at 2.9 kHz)."""
    d = .2 * ds
    t = tarr(d)
    slap = _band(seed, d, 1200, 3000) * np.exp(-t / .006) * .8 + np.sin(2 * np.pi * 150 * ps * t) * np.exp(-t / (.025 * ds)) * .9 + _band(seed + 1, d, 250, 900) * np.exp(-t / .015) * .5
    rif = _band(seed + 2, d, 2000, 7000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 60 * t))) * np.exp(-t / (.04 * ds)) * .3
    ring = _ping(2900 * ps, d, .02, (1.0, 2.5, 4.1), (1.0, .3, .15), (1.0, .5, .3)) * .12
    return slap + rif + ring


def sfx_binderavalanche():
    """THE AVALANCHE (2.5 s, stereo): the shelves give way (a deep 'whoomp': a 70 Hz thump and a crack of boards) and binders pour out: a roar of a hundred landings (cardboard and vinyl slaps at 150 to
    800 Hz, paper riffling, rings ticking) that builds in 0.3 s, peaks between 0.4 and 1.1 s and thins into single thumps by 2.0 s, spread across the pile (-0.6 to 0.6), a long slide of the pile
    settling under it, and the last few slow, separate landings. The collision foley of the simulation (phys_events.json) rides on top of it, binder by binder."""
    d = 2.5
    t = tarr(d)
    r = rng6(3400)
    out = np.zeros((2, _n(d)))
    tt = tarr(.4)
    _put2(out, _sin_of(70 * (1 - .3 * (1 - np.exp(-tt / .06)))) * np.exp(-tt / .1) * 1.0 + _band(3401, .4, 200, 2500) * np.exp(-tt / .03) * .6, 0.0, .9)
    for j in range(110):
        u = r.beta(1.6, 3.2)
        at = .05 + u * 2.1
        ps = r.uniform(.75, 1.3)
        c = _unit(_m_binder(ps, r.uniform(.8, 1.3), 3410 + j))
        _put2(out, c, at, r.uniform(.15, .5) * (1.15 - .5 * u), r.uniform(-.6, .6))
    env = np.interp(t, [0, .15, .45, 1.1, 2.0, d], [0, .6, 1.0, .8, .25, 0])
    for c in range(2):
        rum = _lp4(noise6(d, 3420 + c), 500, 2) * env
        out[c] += _rms(rum) * .25 * np.max(np.abs(out[c]))
        out[c] += _band(3422 + c, d, 1500, 6000) * env * .05 * np.max(np.abs(out[c]))
    for at, pan in ((2.05, -.3), (2.25, .25)):
        _put2(out, _unit(_m_binder(.85, 1.1, int(at * 100))), at, .35, pan)
    return norm6(_edge(out, .0005, .2), .85)


def sfx_scanbeep():
    """The scanner's soft two-tone beep (0.3 s): two clean sine tones a fourth apart (G6 then C7, 55 ms each, 15 ms between), each with a faint glassy partial and a 4 ms attack, and a tiny digital
    sparkle after them (a 7 kHz blip)."""
    k = _nth("scanbeep")
    x = np.zeros(_n(.3))
    for j, f in enumerate((1568.0, 2093.0) if k % 2 == 0 else (1760.0, 2349.3)):
        dd = .055
        tt = tarr(dd)
        tone = (np.sin(2 * np.pi * f * tt) + .12 * np.sin(2 * np.pi * 2.76 * f * tt)) * np.minimum(1, np.minimum(tt / .004, (dd - tt) / .008))
        _place(x, tone, j * .07, .5)
    tt = tarr(.012)
    _place(x, np.sin(2 * np.pi * 7000 * tt) * np.hanning(len(tt)) * .12, .15, 1.0)
    return norm6(_edge(x, .0003, .05), .45)


def sfx_scanlock():
    """The scanner locks on (1.0 s): a locking chirp (a sine that rushes up from 800 Hz to 3.2 kHz in 50 ms through a resonant zip), the reticle's brackets closing (two sharp clicks, 'chk-chk'), and a
    low thud under it (a 70 Hz sub thump and a 160 Hz body), then a two-note warning, low and red (E5 and C5, square-ish, quiet): UNKNOWN."""
    x = np.zeros(_n(1.0))
    dd = .05
    tt = tarr(dd)
    _place(x, _sin_of(800 * (3200 / 800) ** (tt / dd)) * np.minimum(1, tt / .003) * .5 + _tv_filter(noise6(dd, 3430), 800 * (3200 / 800) ** (tt / dd), 6.0, "bp") * .4, 0.0, 1.0)
    for j in range(2):
        _place(x, _click(3431 + j, 3400, .002) * .7, dd + j * .03, 1.0)
    t2 = tarr(.35)
    _place(x, _sin_of(70 * (1 - .2 * t2 / .35)) * np.exp(-t2 / .08) * 1.1 + np.sin(2 * np.pi * 160 * t2) * np.exp(-t2 / .03) * .5, dd, 1.0)
    for j, f in enumerate((659.25, 523.25)):
        d3 = .12
        t3 = tarr(d3)
        sq = _lp4(np.sign(np.sin(2 * np.pi * f * t3)) * .5 + np.sin(2 * np.pi * f * t3) * .5, 3000, 2) * np.minimum(1, np.minimum(t3 / .004, (d3 - t3) / .01))
        _place(x, sq, .42 + j * .16, .18)
    return norm6(_edge(x, .0003, .1), .65)


def sfx_scanhum():
    """The scan's sweep (designed event over the `scan` beat, 2.2 s, stereo): a filtered synth hum (saws on A2 and A3 through a band-pass whose centre climbs from 400 Hz to 2.4 kHz as the scan line
    moves, a 7 Hz shimmer) and a faint high whine (4.2 kHz), moving from left to right with the sweep, cut short where the scanner locks (1.4 s) to a short tail."""
    d = 2.2
    t = tarr(d)
    src = osc("saw", 110.0, d) + .6 * osc("saw", 220.4, d)
    fc = 400 * (2400 / 400) ** np.clip(t / 1.4, 0, 1)
    hum = _tv_filter(src, fc, 3.0, "bp") * (.75 + .25 * np.sin(2 * np.pi * 7 * t))
    wh = np.sin(2 * np.pi * 4200 * t) * .02
    env = np.interp(t, [0, .2, 1.35, 1.45, d], [0, 1, 1, .25, 0])
    x = (_rms(hum) * .3 + wh) * env
    return norm6(_edge(_pan_curve(x, np.interp(t, [0, 1.4, d], [-.6, .6, .6])), .02, .2), .4)


def sfx_dataticks():
    """A tag typing itself into the HUD (designed event, 0.3 s): eight tiny digital ticks 25 ms apart (3 to 5 kHz blips of 6 ms, each a little different) and a soft confirm blip at the end."""
    k = _nth("dataticks")
    r = rng6(3440 + k)
    x = np.zeros(_n(.32))
    for j in range(8):
        tt = tarr(.006)
        _place(x, np.sin(2 * np.pi * r.uniform(3000, 5000) * tt) * np.hanning(len(tt)), j * .025, r.uniform(.25, .45))
    tt = tarr(.04)
    _place(x, np.sin(2 * np.pi * 2637 * tt) * np.minimum(1, np.minimum(tt / .003, (.04 - tt) / .01)) * .3, .22, 1.0)
    return norm6(_edge(x, .0003, .03), .35)


def sfx_badge():
    """Ms. Kale raises her badge (designed event, on 'Health', 0.3 s): the lanyard's clip ticking (a small metal jingle) and the plastic badge holder flicked up (a light 1.6 kHz clack)."""
    x = np.zeros(_n(.3))
    _place(x, _hit_train(3580, .1, 5, 3000, 8000, .002, .4, .2)[0], 0.0, .5)
    _place(x, _plastic_knock(3581, 1600, .06, 400) * .6, .05, 1.0)
    return norm6(_edge(x, .0005, .05), .35)


def sfx_headturn():
    """Every head at the table turns to Strawberry (designed event, on 'break', 0.5 s, stereo): eight quick swishes of collars and hair (soft 600 Hz to 3 kHz air, 0.12 s each) and two chair creaks,
    spread across the table and all within 0.15 s: a comic unison."""
    r = rng6(3590)
    out = np.zeros((2, _n(.5)))
    for p in range(8):
        dd = r.uniform(.09, .14)
        tt = tarr(dd)
        sw = _band(3591 + p, dd, 600, 3000) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** 1.5
        _put2(out, sw, r.uniform(0, .15), r.uniform(.4, .8), np.linspace(-.8, .8, 8)[p])
    for j, at in enumerate((.05, .12)):
        dd = .15
        tt = tarr(dd)
        cr = _res(_sin_of(_glide(500 + 60 * j, 580 + 60 * j, dd)) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 26 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)), 540, 4.0)
        _put2(out, cr * .1, at, 1.0, (-.5, .5)[j])
    return norm6(_edge(out, .002, .1), .35)


def sfx_paperhand():
    """The report sheet handed over (designed event, 0.4 s): a sheet of paper lifted and passed (a soft 1 to 5 kHz rustle that swells and fades) and taken (a small crisp crinkle)."""
    x = np.zeros(_n(.4))
    dd = .25
    tt = tarr(dd)
    _place(x, _band(3600, dd, 1000, 5000) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 30 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) * .5, 0.0, 1.0)
    _place(x, _hit_train(3601, .08, 6, 2000, 7000, .003, .5, .2)[0], .24, .6)
    return norm6(_edge(x, .002, .05), .3)


def sfx_scanon():
    """Mr. Radish's scanner glasses light up (designed event, 0.4 s): a soft power-up whine (a sine that climbs from 1.8 to 5.5 kHz in 0.25 s with a faint fifth over it) and a tiny ready blip."""
    d = .3
    t = tarr(d)
    f = 1800 * (5500 / 1800) ** np.clip(t / .25, 0, 1)
    x = np.zeros(_n(.4))
    _place(x, (_sin_of(f) + .25 * _sin_of(f * 1.5)) * np.interp(t, [0, .05, .25, d], [0, 1, .8, 0]) * .5, 0.0, 1.0)
    tt = tarr(.03)
    _place(x, np.sin(2 * np.pi * 3136 * tt) * np.hanning(len(tt)) * .4, .3, 1.0)
    return norm6(_edge(x, .002, .05), .3)


def sfx_hudmark():
    """The DEFICIENCY mark lands in his view (designed event, with the pen, 0.6 s): a short red alert (two square-ish notes falling, E5 then C5, 70 ms each), a synthetic stamp (a 90 Hz thump and a
    bit-crushed click) under the first."""
    x = np.zeros(_n(.6))
    for j, f in enumerate((659.25, 523.25)):
        d = .07
        t = tarr(d)
        sq = _lp4(np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sin(2 * np.pi * f * t) * .5, 2800, 2) * np.minimum(1, np.minimum(t / .004, (d - t) / .01))
        _place(x, sq, .02 + j * .09, .35)
    tt = tarr(.2)
    _place(x, _sin_of(90 * (1 - .3 * tt / .2)) * np.exp(-tt / .05) * .8 + np.round(_band(3465, .2, 1000, 6000) * np.exp(-tt / .004) * 6) / 6 * .4, 0.0, 1.0)
    return norm6(_edge(x, .001, .1), .4)


def sfx_penscratch():
    """Mr. Radish writes it down (0.7 s): 'Noted.' A ballpoint on a clipboard: five quick strokes (scratches at 1.8 to 7 kHz, 40 to 90 ms, roughened by the paper) and the full stop (a firm tap)."""
    r = rng6(3450)
    x = np.zeros(_n(.7))
    t = 0.0
    for j in range(5):
        dd = r.uniform(.04, .09)
        _place(x, _scrape(3451 + j, dd, 1800, 7000, r.uniform(60, 95)), t, r.uniform(.5, .8))
        t += dd + r.uniform(.02, .05)
    tt = tarr(.04)
    _place(x, np.sin(2 * np.pi * 820 * tt) * np.exp(-tt / .008) * .5 + _band(3458, .04, 900, 4000) * np.exp(-tt / .003) * .5, t + .05, 1.0)
    return norm6(_edge(x, .0004, .05), .55)


def sfx_bonk():
    """The last binder lands on Mr. Radish's head (designed event, 0.5 s): a hollow cartoon 'bonk' (a woodblock-like knock at 520 Hz with a 1.3 kHz overtone over the binder's own slap) and a tiny
    wobble after it (a sine that sags from 700 to 560 Hz)."""
    x = np.zeros(_n(.5))
    tt = tarr(.2)
    _place(x, np.sin(2 * np.pi * 520 * tt) * np.exp(-tt / .03) + .4 * np.sin(2 * np.pi * 1310 * tt) * np.exp(-tt / .012) + _band(3460, .2, 600, 3000) * np.exp(-tt / .006) * .6, 0.0, 1.0)
    _place(x, _unit(_m_binder(.9, 1.0, 3461)) * .5, 0.0, 1.0)
    t2 = tarr(.3)
    _place(x, _sin_of(_glide(700, 560, .3)) * np.exp(-t2 / .1) * (1 + .3 * np.sin(2 * np.pi * 11 * t2)) * .15, .08, 1.0)
    return norm6(_edge(x, .0003, .1), .7)


# ================================================================ exit: the gasp, the clock, the break, the snap back
def sfx_gasp():
    """The whole table gasps (0.75 s, stereo): eight people inhale sharply at once (each a rush of breath through two vocal formants that rise as the throat opens, 0.16 to 0.3 s, a voiced catch at the
    end of a few), spread over 0.12 s and across the table, Onion's a little late and higher, and a chair creaking as somebody sits back."""
    r = rng6(3470)
    out = np.zeros((2, _n(.8)))
    for p in range(8):
        dd = r.uniform(.16, .3)
        tt = tarr(dd)
        nz = noise6(dd, 3471 + p)
        f1, f2 = r.uniform(550, 900), r.uniform(1500, 2600)
        g = _tv_filter(nz, f1 * (1 + .3 * tt / dd), 3.0, "bp") * .9 + _tv_filter(nz, f2 * (1 + .2 * tt / dd), 4.0, "bp") * .5 + _bp4(nz, 3000, 7000, 1) * .2
        g = g * np.interp(tt, [0, .03, dd * .7, dd], [0, 1, .8, 0])
        if p % 3 == 0:
            _place(g, _lp4(osc("saw", r.uniform(150, 260), .04), 1500, 2) * np.hanning(_n(.04)) * .3, dd - .05, 1.0)
        late = .1 if p == 7 else 0.0
        _put2(out, g, r.uniform(0, .12) + late, r.uniform(.5, 1.0), np.linspace(-.8, .8, 8)[p])
    dd = .3
    tt = tarr(dd)
    _put2(out, _res(_sin_of(_glide(480, 560, dd)) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 26 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)), 520, 4.0) * .12, .35, 1.0, .4)
    return norm6(_edge(out, .002, .1), .6)


def _qtick(seed, f=1700.0, g=1.0):
    """The conference-room wall clock's tick (a quartz movement in a plastic case): a crisp click rung at `f`, a hollow case under it at a third of that, 40 ms."""
    tt = tarr(.04)
    return (np.sin(2 * np.pi * f * tt) * np.exp(-tt / .004) * .6 + _band(seed, .04, 900, 4500) * np.exp(-tt / .0025) * .8 + np.sin(2 * np.pi * f / 3.1 * tt) * np.exp(-tt / .01) * .35) * g


def sfx_clocktick():
    """The wall clock of the conference room. The first (13.27 s, the clock reads 10:59; 0.3 s): one clear tick of the second hand, a little louder than the room hears it (the camera is on it). The
    second (17.98 s, inside the break; 0.75 s): the last second of the minute: a tick, and 0.4 s later, exactly with the shift bell, the minute hand stepping onto 11:00 (a heavier 'tchk', a 240 Hz
    clunk of the movement)."""
    k = _nth("clocktick") % 2
    x = np.zeros(_n(.75 if k else .3))
    _place(x, _qtick(3480 + k, 1700, 1.0), 0.0, 1.0)
    if k == 1:
        tt = tarr(.2)
        _place(x, _qtick(3482, 1250, 1.1) + np.sin(2 * np.pi * 240 * tt[:_n(.04)]) * np.exp(-tt[:_n(.04)] / .012) * .5, .4, 1.0)
        _place(x, _band(3483, .2, 300, 2000) * np.exp(-tt / .02) * .3, .4, 1.0)
    return norm6(_edge(x, .0003, .1), .5)


def sfx_secondhand():
    """One soft tick of the second hand (designed event, every second from the clock's beat to the shift bell; 0.05 s): the same clock as `clocktick`, quieter, tick and tock alternating."""
    k = _nth("secondhand")
    x = _qtick(3490 + k % 5, 1700 if k % 2 == 0 else 1550, 1.0)
    return norm6(_edge(x, .0003, .01), .3)


def sfx_chairsit():
    """She sits (1.2 s): a padded conference chair taking her weight: the gas lift's short sigh (a 0.25 s hiss of air at 1 to 5 kHz that sinks), the cushion's soft thump (a 75 Hz body and a muffled
    slap), the frame's creak (a stick-slip squeak that climbs from 520 to 610 Hz with a 28 Hz roughness, 0.3 s) and a smaller one as she settles. No breath: the exhale is its own cue."""
    d = 1.2
    x = np.zeros(_n(d))
    t = tarr(.3)
    _place(x, _sin_of(75 * (1 - .2 * (1 - np.exp(-t / .05)))) * np.exp(-t / .08) * .6 + _lp4(noise6(.3, 3500), 450, 2) * np.exp(-t / .06) * .5, 0.0, 1.0)
    dd = .25
    tt = tarr(dd)
    _place(x, _tv_filter(noise6(dd, 3501), 5000 * (1200 / 5000) ** (tt / dd), 1.2, "bp") * np.interp(tt, [0, .02, dd], [0, 1, 0]) * .25, .02, 1.0)
    for at, f0, dd, g in ((.07, 520, .3, .28), (.55, 470, .2, .14)):
        tt = tarr(dd)
        f = _glide(f0, f0 * 1.17, dd) * (1 + .02 * np.sin(2 * np.pi * 5 * tt))
        sq = (_sin_of(f) + .35 * _sin_of(2 * f)) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 28 * tt))) * np.sin(np.pi * np.clip(tt / dd, 0, 1)) ** .7
        _place(x, _res(sq, f0 * 1.1, 4.0) * .8, at, g)
    return norm6(_edge(x, .003, .2), .45)


def sfx_exhale():
    """Her exhale (2.0 s): the breath of someone who has not sat down all day, let go at last: air through the mouth (two soft formants, 520 Hz and 1.45 kHz, and a little of everything to 3 kHz)
    that swells for 0.35 s and sighs out over 1.5 s, with the faintest voiced edge at its start (a breathy hum at 190 Hz, -24 dB) and the lips closing at the end (a tiny soft click)."""
    d = 2.0
    t = tarr(d)
    br = noise6(d, 3510)
    env = np.interp(t, [0, .35, .8, 1.85, d], [0, 1, .7, .05, 0]) ** 1.2
    breath = (_res(br, 520, 2.0) * .9 + _res(br, 1450, 2.5) * .5 + _lp4(br, 3000, 2) * .25) * env * (1 + .08 * np.sin(2 * np.pi * 1.1 * t))
    x = _lp4(breath, 2800, 2) * .6
    hum = _lp4(osc("saw", 190 * (1 - .06 * t / d), d), 900, 2) * np.interp(t, [0, .1, .5, .9], [0, 1, .3, 0], right=0) * .06
    x = x + hum * np.max(np.abs(x)) / (np.max(np.abs(hum)) + 1e-9) * .06
    _place(x, _band(3511, .02, 1500, 5000) * np.hanning(_n(.02)) * .05, 1.88, 1.0)
    return norm6(_edge(x, .01, .1), .4)


def sfx_shiftbell():
    """The shift bell at 11:00, as a soft chime (2.8 s): not the building's bell but a gentle three-tone chime that falls through the D major chord (A5, F-sharp5, D5, 0.28 s apart) on soft tubular
    bells (a sine, a faint 2.76x partial, a long 1.3 s decay), a warm low D under the last one, rounded off above 3.5 kHz and given a little of the room."""
    x = np.zeros(_n(2.8))
    for j, (f, g) in enumerate(((880.0, .85), (739.99, .8), (587.33, 1.0))):
        d = 2.2
        t = tarr(d)
        b = (np.sin(2 * np.pi * f * t) + .18 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / .25) + .08 * np.sin(4 * np.pi * f * t) * np.exp(-t / .5)) * np.exp(-t / 1.3)
        _place(x, b * np.minimum(1, t / .008), j * .28, g)
    tt = tarr(2.0)
    _place(x, np.sin(2 * np.pi * 146.83 * tt) * np.exp(-tt / 1.0) * np.minimum(1, tt / .05) * .3, .56, 1.0)
    x = _lp4(x, 3500, 2)
    x = x + .15 * signal.fftconvolve(x, _small_ir(3520, rt=.5, pre=.008, lo=200, hi=3000))[:len(x)]
    return norm6(_edge(x, .002, .5), .5)


def sfx_doorclose():
    """The surveyors walk out and the glass front doors close behind them (0.75 s): ON THE CUE the two leaves meeting on their closers (a soft 130 Hz thump of the rubber seal, a frame knock at
    380 Hz, a slap of the glass at 1 to 4 kHz), the glass shivering in its frame (two faint high rings), the magnetic lock clunking home 60 ms later and the last of the air they pushed: the State has
    left the building."""
    x = np.zeros(_n(.75))
    t2 = tarr(.4)
    _place(x, _sin_of(130 * (1 - .15 * (1 - np.exp(-t2 / .04)))) * np.exp(-t2 / .07) + np.sin(2 * np.pi * 380 * t2) * np.exp(-t2 / .02) * .45 + _band(3531, .4, 200, 2000) * np.exp(-t2 / .015) * .55
           + _band(3533, .4, 1000, 4000) * np.exp(-t2 / .005) * .45, 0.0, 1.0)
    _place(x, _glass(2600, .35, .06, .001) * .12 + _glass(3350, .3, .04, .001) * .07, .005, 1.0)
    tt = tarr(.12)
    _place(x, _click(3532, 1800, .005) * .45 + np.sin(2 * np.pi * 220 * tt) * np.exp(-tt / .02) * .3, .06, 1.0)
    _place(x, _lp4(noise6(.3, 3530), 700, 2) * np.exp(-tarr(.3) / .1) * .15, .02, 1.0)
    return norm6(_edge(x, .0005, .1), .75)


def sfx_coffeemaker():
    """The coffee maker is back (1.2 s): it gurgles (a percolator: bubbles of 150 to 600 Hz blips, faster and faster, over a steam hiss) and beeps twice, ready (2.4 kHz, 90 ms each)."""
    r = rng6(3540)
    x = np.zeros(_n(1.2))
    tt = tarr(.15)
    _place(x, _plastic_knock(3542, 700, .15, 140) * .9 + _glass(2500, .3, .05, .001) * .2, 0.0, 1.0)
    t = .08
    while t < .78:
        dd = r.uniform(.02, .05)
        tt = tarr(dd)
        f = r.uniform(150, 600)
        _place(x, np.sin(2 * np.pi * f * tt * (1 + 2.0 * tt / dd)) * np.exp(-tt / (dd * .4)), t, r.uniform(.3, .7))
        t += r.uniform(.03, .09) * (1 - .5 * t)
    dd = .8
    tt = tarr(dd)
    _place(x, _band(3541, dd, 2500, 8000) * np.interp(tt, [0, .2, .7, dd], [0, 1, .8, 0]) * .12, 0.0, 1.0)
    for j in range(2):
        d2 = .09
        t2 = tarr(d2)
        _place(x, np.sin(2 * np.pi * 2400 * t2) * np.minimum(1, np.minimum(t2 / .004, (d2 - t2) / .006)) * .35, .85 + j * .16, 1.0)
    return norm6(_edge(x, .002, .1), .55)


def sfx_labelpeel():
    """The labels let go (1.0 s): five survey labels peeling off the wall one after another (tacky rasps at 2 to 6 kHz, 60 to 100 ms, staggered over 0.35 s, each a little different) and fluttering
    down (soft paper flutters at 1 to 4 kHz that tumble at 12 to 20 Hz and fade as they fall), and the poster flipping back to FUN COMMITTEE with the first label (a quick 'fwip' and a slap by 0.1 s, as the picture's poster turns in 0.12 s)."""
    r = rng6(3550)
    x = np.zeros(_n(1.0))
    for j in range(5):
        at = j * .075 + r.uniform(0, .02)
        _place(x, _tacky(3551 + j, r.uniform(.06, .1), 2000, 6000), at, r.uniform(.5, .9))
        dd = r.uniform(.35, .55)
        tt = tarr(dd)
        fl = _band(3560 + j, dd, 1000, 4000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * r.uniform(12, 20) * tt))) * np.interp(tt, [0, .05, dd], [0, 1, 0])
        _place(x, fl * .25, at + .08, 1.0)
    dd = .08
    tt = tarr(dd)
    _place(x, _tv_filter(noise6(dd, 3570), 900 * (4500 / 900) ** (tt / dd), 1.6, "bp") * np.minimum(1, tt / .004) * .5, .02, 1.0)
    _place(x, _band(3571, .08, 400, 4500) * np.exp(-tarr(.08) / .014) * .7, .09, 1.0)
    return norm6(_edge(x, .001, .1), .55)


# ---------------------------------------------------------------- the room tones' parts (as Episode 20 left them)
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


def _fluoro(d, seed, f0=120.0):
    """Fluorescent tubes overhead: the ballast's buzz (120 Hz and its harmonics to 600 Hz, a slow shimmer in its level)."""
    t = tarr(d)
    b = sum(a * np.sin(2 * np.pi * f0 * h * t + h) for h, a in ((1, 1.0), (2, .45), (3, .3), (4, .16), (5, .1)))
    return b * (1 + .06 * _smooth_rand(d, seed, 1.5))


def _feet_far(d, seed, every=(1.5, 4.0), steps=(4, 9), rate=(.13, .2), lpf=2200):
    """Somebody hurrying down a hall out of sight: runs of quick footsteps (tile under rubber soles), closed off as if around a corner."""
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


def _cart_rattle(d, seed):
    """A med cart pushed fast somewhere on the floor: a rolling rumble and the rattle of what is on it, swelling past and away now and then."""
    t = tarr(d)
    sw = .5 + .5 * np.sin(2 * np.pi * .13 * t + seed % 5) ** 2
    rum = _lp4(noise6(d, seed), 260, 2) * sw
    rat = _hit_train(seed + 1, d, int(d * 9), 1500, 5500, .003, .5, .5)[0] * sw
    return _rms(rum) + _rms(rat) * .5


def room_title(d, seed=3600):
    """A desk under a cold office light (6.8 s): the fluorescent tubes' thin buzz, the air handling's hush and, far off, a keyboard."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 140.0, 320.0), 1.0), seed)
    return _mix([(air, 1.0), (_ctr(_rms(_fluoro(d, seed + 3), .09), .2), 1.0), (_ctr(_rms(_typing_far(d, seed + 5, (2.5, 5.0)), .08), -.5), 1.0)], d)


def room_arrive(d, seed=3700):
    """The lobby and the nurses' station at 3:02 PM (24.7 s): the air handling, the staff's murmur and a keyboard, the call light far off, a phone. The front doors open at 0.4 s and the afternoon
    comes in (traffic far away, a breeze) until they close (2.6 s). The murmur FREEZES on the door chime (0.40 to 0.52 s: the picture's staff freeze there, so the sting lands in a hush) and only comes back,
    thinner, after the
    PA has sent everyone running (18.2 s)."""
    t = tarr(d)
    air = _diffuse(lambda s: _rms(_hvac(d, s, 150.0, 340.0), 1.0), seed)
    bab = _diffuse(lambda s: _rms(_babble(d, s, 4), 1.0), seed + 11)
    me = _beat_abs("arrive", "me1")
    back = (me[1] - _scene_info("arrive")["start"]) if me else 18.2
    frz = np.interp(t, [0, .4, .52, back, back + 1.5, d], [1, 1, 0, 0, .45, .45])
    out_ = _diffuse(lambda s: _rms(_lp4(noise6(d, s), 1500, 2) + .3 * _band(s + 1, d, 2000, 6000), 1.0), seed + 21) * np.interp(t, [0, .4, .7, 2.0, 2.6, d], [0, 0, 1, .6, 0, 0])
    parts = [(air, .9), (bab * frz, .32), (_ctr(_rms(_typing_far(d, seed + 31, (3.0, 7.0)), .2), -.5) * frz, 1.0), (_ctr(_rms(_chimes_far(d, seed + 41, (8.0, 12.0)), .1), .3), 1.0),
             (_ctr(_rms(_phone(d, seed + 51, (11.0, 16.0)), .12), .55), 1.0), (out_, .35), (_ctr(_rms(_fluoro(d, seed + 61), .04), 0.0), 1.0)]
    return _mix(parts, d)


def room_prep(d, seed=3800):
    """The station in survey mode (31.6 s). Before the montage: panic (a busier murmur, people hurrying past, a phone that nobody answers). THE MONTAGE (7.21 to 19.21 s): the room drops 12 dB
    under the music and the hits. After it, the terrifyingly clean station: only the air and the lights, until forty Strawberries murmur among themselves (from the poofs, 20.5 s, fading by 25 s)."""
    t = tarr(d)
    mt = _beat_abs("prep", "montage")
    a0 = _scene_info("prep")["start"]
    ma, mb = (mt[0] - a0, mt[1] - a0) if mt else (7.21, 19.21)
    air = _diffuse(lambda s: _rms(_hvac(d, s, 150.0, 340.0), 1.0), seed)
    bab = _diffuse(lambda s: _rms(_babble(d, s, 5), 1.0), seed + 11)
    busy = np.interp(t, [0, ma - .3, ma, mb, d], [1, 1, .25, 0, 0])
    lvl = np.interp(t, [0, ma - .1, ma + .1, mb - .1, mb + .3, d], [1, 1, .25, .25, .6, .6])
    crowd = _diffuse(lambda s: _rms(_babble(d, s, 9, 200, 3000), 1.0), seed + 21) * np.interp(t, [0, 20.4, 20.9, 22.6, 23.0, 25.0, 25.3, d], [0, 0, 1, 1, .5, .4, 0, 0])
    parts = [(air * lvl, .9), (bab * busy, .4), (_ctr(_rms(_feet_far(d, seed + 31, (1.2, 3.0)), .25), .45) * busy, 1.0), (_ctr(_rms(_phone(d, seed + 41, (6.0, 9.0)), .12), -.5) * busy, 1.0),
             (_ctr(_rms(_fluoro(d, seed + 51), .05), 0.0) * lvl, 1.0), (crowd, .45)]
    return _mix(parts, d)


def room_medpass(d, seed=3900):
    """THE SPLIT (27.3 s). LEFT, with the State: a resident's room at its calmest (a soft hush of air, a wall clock ticking, the low pulse of an oxygen concentrator), quiet. RIGHT, a normal night: a busy
    hallway (staff talking over each other, a television, running feet, a med cart rattling past, a phone, a door), panned hard right (the left ear gets it 14 dB down). Each side follows the
    divider: the side it squeezes is turned down (Split.gain)."""
    t = tarr(d)
    a0 = _scene_info("medpass")["start"]
    calm = _mix([(_diffuse(lambda s: _rms(_hvac(d, s, 120.0, 260.0), 1.0), seed), .5), (_ctr(_rms(_ticks(d, seed + 5, 1.0, .3, (1900, 1500)), .12), -.6), 1.0),
                 (_ctr(_rms(_lp4(noise6(d, seed + 6), 400, 2) * (.6 + .4 * np.sin(2 * np.pi * .25 * t) ** 8), 1.0), -.45), .12)], d)
    hall = (_rms(_babble(d, seed + 11, 5, 180, 3200), 1.0) * .45 + _rms(_tv_far(d, seed + 21, 1.0), 1.0) * .2 + _rms(_feet_far(d, seed + 31, (1.0, 2.5), (5, 10), (.11, .16), 3500), 1.0) * .35
            + _rms(_cart_rattle(d, seed + 41), 1.0) * .3 + _rms(_phone(d, seed + 51, (7.0, 10.0), 2800), 1.0) * .18)
    hall = _hp4(hall, 140, 2)
    gl = SPLIT.gain("L", a0 + t)
    gr = SPLIT.gain("R", a0 + t)
    return _mix([(calm * gl[None, :], .55), (_ctr(hall * gr, .75), 1.0)], d)


def room_closet(d, seed=4000):
    """The corridor by the station at 7:10 PM (27.2 s): the air, the lights, a television in a room down the hall, the vending machine's compressor. Under his scanner's view (the `scan` beat) the
    room falls back 6 dB: we hear what the HUD hears."""
    t = tarr(d)
    sc = _beat_abs("closet", "scan")
    a0 = _scene_info("closet")["start"]
    sa, sb = (sc[0] - a0, sc[1] - a0) if sc else (12.28, 14.48)
    lvl = np.interp(t, [0, sa, sa + .2, sb, sb + .3, d], [1, 1, .5, .5, 1, 1])
    air = _diffuse(lambda s: _rms(_hvac(d, s, 130.0, 300.0), 1.0), seed)
    return _mix([(air * lvl, .9), (_ctr(_rms(_fluoro(d, seed + 3), .05), 0.0) * lvl, 1.0), (_ctr(_rms(_tv_far(d, seed + 5, 1.0), .14), .55) * lvl, 1.0),
                 (_ctr(_rms(_hum(d, 98.0, ((1, 1.0), (2, .5), (3, .25))), .05), -.6) * lvl, 1.0)], d)


def room_exit(d, seed=4100):
    """The conference room at 10:45 PM (32.9 s): a low hum of air, the lights, the building asleep far away. THE BREAK (15.08 to 18.68 s): the room tone falls to almost nothing (-20 dB in 0.5 s from
    the moment she sits) so that the clock's second hand and her breath are all there is, and comes back with the shift bell. The clock's own ticks are events (secondhand)."""
    t = tarr(d)
    bk = _beat_abs("exit", "break")
    a0 = _scene_info("exit")["start"]
    ba, bb = (bk[0] - a0, bk[1] - a0) if bk else (15.08, 18.68)
    bell = _cue_local("exit", "shiftbell", 0) or bb - .3
    lvl = np.interp(t, [0, ba, ba + .5, bell, bell + .6, d], [1, 1, .1, .1, 1, 1])
    air = _diffuse(lambda s: _rms(_hvac(d, s, 120.0, 260.0), 1.0), seed)
    return _mix([(air * lvl, .9), (_ctr(_rms(_fluoro(d, seed + 3), .05), .1) * lvl, 1.0), (_ctr(_rms(_tv_far(d, seed + 5, 1.0), .06), -.6) * lvl, 1.0)], d)


def room_end(d, seed=4200):
    """The end card: an office's hush so the held chord has a floor: air and the lights."""
    air = _diffuse(lambda s: _rms(_hvac(d, s, 130.0, 280.0), 1.0), seed)
    return _mix([(air, 1.0), (_ctr(_rms(_fluoro(d, seed + 3), .06)), 1.0)], d)


BED_DB = {"title": -34, "arrive": -25, "prep": -25, "medpass": -17.5, "closet": -26, "exit": -27, "end": -40}
BED_SCENE = {k: k for k in BED_DB}
ROOM_FN = {"title": room_title, "arrive": room_arrive, "prep": room_prep, "medpass": room_medpass, "closet": room_closet, "exit": room_exit, "end": room_end}


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


def amb_hum21(d, ramp=None):
    """The script's `hum` ambience (the mixer's own under-layer, very quiet): the building's air at about the level of the old hum."""
    return _rms(_diffuse(lambda s: _rms(_hvac(d, s, 120.0, 300.0), 1.0), 4300), .006)


A6.AMB["hum"] = amb_hum21


# ================================================================ the physics foley family (as Episode 20 left it) and the binder
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


_MV["binder"] = lambda ps, ds, seed: _m_binder(ps, ds, seed)
LOUD["binder"] = .7
HARD = tuple(HARD) + ("binder",)


def sfx_phys():
    """One collision from the simulation (build/ep21/phys_events.json), 0.1 to 0.5 s, by the pair of materials 'a+b': each material has its own short voice (wood a knock at 360 Hz, metal a
    ring with inharmonic partials, plastic a tick, glass a ping, ceramic a clink, cardboard a dull flap, fabric a soft thump, concrete a heavy dull thud with grit, rubber a bwip, soil a
    crunch); the harder of the two carries 60 percent. A BINDER (an event whose tag names a binder) has its own voice (_m_binder: the vinyl board's slap, the pages, the rings) blended with the
    other material's. The magnitude sets the length (0.75 to 1.35 of the voice's), lowers the pitch (a heavy hit is lower: 1.35 down to 0.75 of the voice's) and, through the event's own gain,
    the level; a seed from the event's index and time makes every repeat different. A 'slide' is a scrape: for a binder, a board sliding on the pile."""
    k = _nth("phys")
    ev = PHYS_EVENTS[k] if k < len(PHYS_EVENTS) else {"mat": "plastic+plastic", "mag": .3, "t": k}
    mag = float(np.clip(ev.get("mag", .3), 0, 1))
    seed = 4000 + 3 * k + int(ev.get("t", 0) * 1000) % 997
    r = rng6(seed)
    tags = str(ev.get("tag", "")).split("+")
    binder = any("binder" in s for s in tags)
    if ev.get("k") == "slide":
        d = .2 + .3 * mag
        t = tarr(d)
        lo, hi = (600, 3500) if binder else (400, 2600)
        x = _band(seed, d, lo, hi) * (.6 + .4 * np.sign(np.sin(2 * np.pi * (52 if binder else 38) * t))) * np.sin(np.pi * np.clip(t / d, 0, 1))
        return norm6(_edge(x, .01, .05), .6)
    ps = (1.35 - .6 * mag) * r.uniform(.94, 1.06)
    ds = .75 + .6 * mag
    mats = [m for m in str(ev.get("mat", "plastic+plastic")).split("+") if m in _MV] or ["plastic"]
    if len(mats) == 1:
        mats = mats * 2
    if binder:
        other = [m for m in mats if m not in ("cardboard", "plastic", "paper")] or ["cardboard"]
        ca = _unit(_m_binder(ps, ds, seed)) * .7
        cb = _unit(_MV[other[0]](ps * r.uniform(.9, 1.1), ds, seed + 17)) * .3
        loud = (.7 + LOUD.get(other[0], .6)) / 2
    else:
        a, b = sorted(mats[:2], key=HARD.index)
        ca = _unit(_MV[a](ps, ds, seed)) * .6
        cb = _unit(_MV[b](ps * r.uniform(.9, 1.1), ds, seed + 17)) * .4
        loud = (LOUD[a] + LOUD[b]) / 2
    n = max(len(ca), len(cb))
    x = np.zeros(n)
    x[:len(ca)] += ca
    x[:len(cb)] += cb
    return norm6(_edge(x * loud, .0003, .02), .7)


PHYS_BOOST = {"binder": 1.6}            # the binders ride on top of the designed roar


def _tagkey(e):
    """The first of the boosted names that the event's tag ('binder+floor' ...) contains, else ''."""
    parts = str(e.get("tag", "")).split("+")
    return next((k for k in PHYS_BOOST if any(k in p for p in parts)), "")


def _select_phys(phys, scripted):
    """Choose the collisions that are heard: every first impact of a pair of objects, then the loudest, with the density cap (at most three within 50 ms, thirty in any one second) and the 40 ms
    rule (nothing within 40 ms of a scripted hit the picture lands on)."""
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
        if len(near) >= 3 or len(sec) >= 30:
            continue
        keep.append(i)
    out = []
    for i in sorted(keep, key=lambda j: ev[j]["t"]):
        e = ev[i]
        mag = float(e.get("mag", .3))
        out.append({"t": round(e["t"], 3), "name": "phys", "mat": e.get("mat", "plastic+plastic"), "mag": round(mag, 3), "k": e.get("k", "hit"), "tag": e.get("tag", ""),
                    "vol": round(min(.9, (.05 + .30 * mag ** 1.3) * (.6 if e.get("k") == "slide" else 1.0) * PHYS_BOOST.get(_tagkey(e), 1.0)), 4), "pan": float(np.clip(e.get("pan", 0), -1, 1)), "room": "hall"})
    return out


# ================================================================ registration (keep this at the end of the sfx section)
BOOST = {   # textures that sat 15 to 20 dB under the voice at the script's gains: lifted so they register (the dialogue dip still takes them down under speech)
    "sniffle": 1.6, "typing": 1.8, "clocktick": 1.6, "penclick": 2.4, "checktick": 2.2, "penscratch": 1.5, "scanbeep": 1.3, "dataticks": 1.0, "secondhand": 1.0, "exhale": 1.5, "chairsit": 1.4,
    "labelpeel": 1.3, "sanitizer": 1.3, "cupclatter": 1.3, "coffeemaker": 1.2, "cartroll": 1.3, "callbell": 1.2,
    "labelgun": 1.7, "padlock": 1.7, "spray": 1.8, "thermobeep": 1.5, "binderslam": 1.8, "mop": 1.9, "posterflip": 2.3, "closetslam": 2.0, "coffeehide": 1.9, "crashcart": 2.6, "doorclose": 1.4,
    "binderavalanche": 1.15, "closetopen": 1.3,
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


# ================================================================ the animation's footsteps, the simulation's collisions and the designed events
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


BIG_CUES = ("stamp", "closetslam", "binderslam", "closetopen", "doorclose", "padlock", "coffeehide", "crashcart", "labelgun")      # scripted hits that a collision from a simulation must not double
STEP_SCALE = {"title": 1.0, "arrive": .9, "prep": .85, "medpass": .8, "closet": .85, "exit": .8, "end": 1.0}
RUSH_AT = (0.0, .03, .055, .08)
BED_VOL = {}        # bed name -> the event's gain (filled by _designed_events from BED_DB)
SOURCES = {"steps": "none", "phys": "none", "split": "none"}
BONK = {"t": None, "source": "none"}


def _tune_steps(events, tab):
    """The animation's footsteps, balanced for this mix: each scene's own scale; steps that land on the same instant are spread by a few milliseconds (a crowd is never one foot); in the break
    nothing walks (dropped)."""
    out = []
    bk = _beat_abs("exit", "break")
    for ev in events:
        ev = dict(ev)
        if ev.get("name") == "step":
            sc = _scene_of(ev["t"], tab)
            if bk and bk[0] - .05 <= ev["t"] <= bk[1]:
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


def _bonk_time(phys):
    """When the last binder lands on Mr. Radish (absolute s): the last collision whose tag names him or a head, else the last heavy one (magnitude 0.25 or more) of the closet before Onion's
    'Policy seven point four.', else the picture's own time (ep21_closet.js: the last binder lands flat on his head at 7.71 s)."""
    av, o2 = _beat_abs("closet", "avalanche"), _beat_abs("closet", "o2")
    if not av:
        return None, "no closet"
    a, b = av[0], (o2[0] if o2 else av[1] + .5)
    ev = [e for e in phys if a <= e.get("t", -1) <= b]
    head = [e for e in ev if any(w in str(e.get("tag", "")) for w in ("radish", "head", "surveyor"))]
    if head:
        return float(head[-1]["t"]), "the last collision tagged " + str(head[-1].get("tag"))
    heavy = [e for e in ev if e.get("mag", 0) >= .25]
    if heavy:
        return float(heavy[-1]["t"]), f"the last heavy collision of the pile (mag {heavy[-1].get('mag')})"
    sc = _scene_info("closet")
    return sc["start"] + 7.71, "the picture's time (7.71 s, ep21_closet.js; no phys_events.json yet)"


def _word_abs(scene, lid, word, k=0):
    """Absolute time of the k-th word of a line that starts with `word` (the frozen timeline's word times, the captions' own), or None."""
    ln = next((x for x in _timeline()["lines"] if x["scene"] == scene and x["id"] == lid), None)
    if not ln:
        return None
    ws = [w for w in ln["words"] if str(w[0]).strip(".,!?:;'\"").lower().startswith(word.lower())]
    return ln["s"] + ws[k][1] if len(ws) > k else None


def _designed_events(tab, phys):
    """The events the script does not list: the room-tone beds (one per scene, a level in dB under a spoken line), the scatter on 'All staff to your stations.', the call bells of the medpass's normal
    night (right), the scanner glasses powering up, the scan's sweep, the tags' data ticks and the DEFICIENCY mark in his view, the last binder's bonk, the second hand of the conference-room clock
    up to the shift bell."""
    ev = []
    by = {nm: (a, b) for nm, a, b, bt in tab}
    for nm, sid in BED_SCENE.items():
        if sid not in by:
            continue
        BED_VOL[nm] = round(.1 * 10 ** (BED_DB[nm] / 20) / .6, 5)
        ev.append({"t": round(by[sid][0], 3), "name": "bed_" + nm, "vol": BED_VOL[nm], "pan": 0.0, "room": "hall"})
    hb = _word_abs("arrive", "ka1", "health")
    if hb:
        ev.append({"t": round(hb, 3), "name": "badge", "vol": .3, "pan": -.15, "room": "hall"})
    hb = _word_abs("exit", "ra1", "break")
    if hb:
        ev.append({"t": round(hb - .05, 3), "name": "headturn", "vol": .35, "pan": 0.0, "room": "hall"})      # the picture's T_TURN: 50 ms before 'break'
    s4_ = _beat_abs("exit", "s4")
    if s4_:
        ev.append({"t": round(s4_[0] + .3, 3), "name": "paperhand", "vol": .3, "pan": 0.0, "room": "hall"})
    sc_t = _word_abs("arrive", "me1", "all")
    if sc_t:
        ev.append({"t": round(sc_t - .02, 3), "name": "scatter", "vol": .5, "pan": 0.0, "room": "hall"})        # the picture's T_SCAT: 20 ms before 'All'
    if "medpass" in by:
        a0 = by["medpass"][0]
        for t, p in ((2.7, .8), (6.3, .7), (9.6, .9), (13.4, .75), (16.9, .85), (20.9, .7), (23.9, .9)):
            ev.append({"t": round(a0 + t, 3), "name": "callbell", "vol": .32, "pan": p, "room": "hall"})
        s7 = _beat_abs("medpass", "s7")
        if s7:                                                                       # the picture's LOCKT: the frame of s7 + 0.16 s (12.09): she pushes the cart lock in, on the left
            ev.append({"t": round(round((s7[0] + .16) * 30) / 30, 3), "name": "cartlock", "vol": .3, "pan": -.45, "room": "hall"})
    sc = _beat_abs("closet", "scan")
    if sc:
        ev.append({"t": round(sc[0], 3), "name": "scanhum", "vol": .4, "pan": 0.0, "room": "hall"})
        lock = _cue_local("closet", "scanlock", 0)
        a0 = by["closet"][0]
        for j, dt in enumerate((.2, .45, .7, .95)):                                   # the picture's tags type in at 12.48, 12.73, 12.98 and 13.23 s
            ev.append({"t": round(sc[0] + dt, 3), "name": "dataticks", "vol": .35, "pan": round(-.5 + .33 * j, 2), "room": "hall"})
        if lock is not None:
            ev.append({"t": round(a0 + lock + .14, 3), "name": "dataticks", "vol": .38, "pan": .3, "room": "hall"})
        ev.append({"t": round(a0 + 11.9, 3), "name": "scanon", "vol": .3, "pan": .1, "room": "hall"})       # his scanner glasses light up (ep21_closet.js)
        pen = _cue_local("closet", "penscratch", 0)
        if pen is not None:
            ev.append({"t": round(a0 + pen, 3), "name": "hudmark", "vol": .32, "pan": 0.0, "room": "hall"})   # his POV again: the DEFICIENCY mark lands on the closet
    bt, src = _bonk_time(phys)
    BONK["t"], BONK["source"] = bt, src
    if bt:
        ev.append({"t": round(bt, 3), "name": "bonk", "vol": .45, "pan": .05, "room": "hall"})
    ct = _cue_times("clocktick")
    if len(ct) >= 2:
        t1, t2 = ct[0], ct[1]
        for j in range(1, 5):
            ev.append({"t": round(t1 + (t2 - t1) * j / 5, 3), "name": "secondhand", "vol": .42, "pan": 0.0, "room": "hall"})
    return ev


def _load_json(path):
    try:
        return json.load(open(path)) if path and os.path.exists(path) else []
    except (OSError, ValueError):
        return []


def _make_events(src, phys_src, out_dir):
    """Write <out_dir>/events.tuned.json from the footsteps (src), the collisions (phys_src) and the designed events; returns its path, or '' when there is nothing to place."""
    tab = _scene_table()
    if not tab:
        return ""
    steps = _load_json(src)
    phys = _load_json(phys_src)
    if isinstance(phys, dict):
        phys = phys.get("events", [])
    SOURCES["steps"] = f"{os.path.relpath(src, HERE)} ({len([e for e in steps if e.get('name') == 'step'])} steps, {len(steps)} events)" if steps else "none (no events.json yet)"
    SOURCES["phys"] = f"{os.path.relpath(phys_src, HERE)} ({len(phys)} events)" if phys else "none (no phys_events.json yet)"
    tuned = _tune_steps([e for e in steps if e.get("name") != "phys"], tab)
    ev = tuned + _select_phys(phys, _scripted(tab))
    PHYS_EVENTS[:] = [e for e in ev if e.get("name") == "phys"]
    ev += _designed_events(tab, phys)
    ev = [e for e in ev if e.get("name") in BA.SFX or str(e.get("name", "")).startswith("step")]
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
        tag = f"{ln['scene']}_{ln['id']}"
        dp = 1.0 if (ln["who"] in DRY_WHO or tag in DRY_TAGS) else DRY_PART.get(ln["who"], 0.0)
        if dp:                                                                            # a dry voice (a whisper, the PA, a closet) skips the room; Kale is 60 percent dry
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


DELIBERATE = (("exit", 15.05, 18.75),)      # the break: the quiet is the point (the room tone falls to almost nothing; the clock, her breath and one held chord are all there is)
SILENCE_MAX = 1.5                            # a silence longer than this inside a scene is flagged (the brief), except in the break


def measure(out_dir):
    wav = os.path.join(HERE, out_dir, "audio.wav")
    x, sr = sf.read(wav, dtype="float64")
    sp, tp = true_peak_db(x)
    tl = json.load(open(os.path.join(HERE, out_dir, "timeline.json")))
    print(f"measure: {A9._lufs(wav):.2f} LUFS integrated, loudness range {_lra(wav):.1f} LU, sample peak {sp:.2f} dBFS, true peak {tp:.2f} dBTP (the wav), {len(x) / sr:.2f} s")
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
        delib = any(sc == s_ and a_ - .1 <= local <= b_ for s_, a_, b_ in DELIBERATE)
        long_ = (b - a) > SILENCE_MAX
        flagged += long_ and not delib
        print(f"  quiet {a:7.2f} to {b:7.2f} s ({b - a:.2f} s) in {sc} at {local:.2f} s" + ("  <- OVER 1.5 s" if long_ and not delib else ("  (the break)" if delib else "")))
    print(f"  silences over {SILENCE_MAX} s inside a scene (the break excepted): {flagged}; the quietest 50 ms block is {lv[:nf - 2].min():.1f} dBFS")
    win = int(.4 * sr)
    seg = mono[:len(mono) // win * win].reshape(-1, win)
    lm = 10 * np.log10(np.mean(seg ** 2, axis=1) + 1e-12)
    top = np.argsort(lm)[::-1][:3]
    print("  loudest 400 ms blocks: " + ", ".join(f"{(i * win) / sr:.1f}s {lm[i]:.1f} dB" for i in top))
    for sid, a, b in DELIBERATE:
        s0 = next((s["start"] for s in tl["scenes"] if s["id"] == sid), None)
        if s0 is None:
            continue
        i0, i1 = int((s0 + a) * sr), int((s0 + b) * sr)
        seg_ = mono[i0:i1]
        print(f"  the break ({sid} {a:.2f} to {b:.2f} s): RMS {20 * np.log10(np.sqrt(np.mean(seg_ ** 2)) + 1e-9):.1f} dBFS")
    return runs


def write_cue_report(out_dir):
    """The cue list as built (scene-local time, absolute time, name, gain, pan) for the script's cues (each checked against the registry), the montage's grid (each of the twelve cues against
    its cut, 7.211 + k s), then the designed events the script does not list (the room-tone beds with their levels and the others), the voice treatments, the event files read and the score's
    decisions."""
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
    mt = _beat_abs("prep", "montage")
    if mt:
        a0 = by["prep"][0]
        cs = [c for c in _scripted(tab) if mt[0] - .01 <= c[0] <= mt[1]]
        off = [round(c[0] - (mt[0] + k), 4) for k, c in enumerate(cs)]
        lines.append(f"the montage grid: {len(cs)} cues from {mt[0] - a0:.3f} s, each against its cut (7.211 + k): offsets {off} s; the score's downbeat at {mt[0] - a0:.3f} s, 120 bpm, "
                     f"the button on beat 25 at {mt[0] - a0 + 12.0:.3f} s")
    lines.append("")
    lines.append("designed events (not in the script): the room-tone beds, one per scene, cue gain from BED_DB (dB under a spoken line)")
    for nm, sid in BED_SCENE.items():
        if sid in by:
            a = by[sid][0]
            s = _scene_info(sid)
            lines.append(f"{sid:<10} {0:8.3f} {a:9.3f}  bed_{nm:<11} {BED_VOL.get(nm, 0):<8} 0.0   {BED_DB[nm]} dB, {s['dur'] + .3:.2f} s")
    ev = _load_json(os.path.join(HERE, out_dir, "events.tuned.json"))
    others = [e for e in ev if not str(e.get("name", "")).startswith(("bed_", "step", "phys"))]
    for e in sorted(others, key=lambda e: e["t"]):
        sc = _scene_of(e["t"], tab)
        loc = e["t"] - by[sc][0] if sc in by else e["t"]
        lines.append(f"{sc:<10} {loc:8.3f} {e['t']:9.3f}  {e['name']:<15} {e['vol']:<8} {e.get('pan', 0)}")
    n_steps, n_phys = {}, {}
    for e in ev:
        if str(e.get("name", "")).startswith("step"):
            n_steps[_scene_of(e["t"], tab)] = n_steps.get(_scene_of(e["t"], tab), 0) + 1
        if e.get("name") == "phys":
            n_phys[_scene_of(e["t"], tab)] = n_phys.get(_scene_of(e["t"], tab), 0) + 1
    lines.append(f"footsteps placed per scene: {n_steps or 'none'} ({SOURCES['steps']})")
    lines.append(f"collisions placed per scene: {n_phys or 'none'} ({SOURCES['phys']}); the last binder's bonk: {BONK['t'] if BONK['t'] is None else round(BONK['t'], 3)} s ({BONK['source']})")
    lines.append(f"the split's divider: {SPLIT.source}")
    lines.append("")
    lines.append("voice treatments (scene_line: treatment; pans: the whisper chain " + ", ".join(f"{k} {v:+.2f}" for k, v in LINE_PAN.items()) + "; medpass " +
                 ", ".join(f"{k} {v:+.2f}" for k, v in MEDPASS_PAN.items()) + "):")
    for tag, kind in KINDS.items():
        if kind != "plain":
            lines.append(f"  {tag:<14} {kind}" + ("  (dry)" if tag in DRY_TAGS else ""))
    sn = M21.INFO
    if sn:
        lines.append("")
        lines.append("the score: " + "; ".join(f"{k}: {v}" for k, v in sn.items()))
    open(os.path.join(HERE, out_dir, "cue_report.txt"), "w").write("\n".join(lines) + "\n")


# ================================================================ the AAC guard (as Episode 20)
FF = "/usr/bin/ffmpeg" if os.path.exists("/usr/bin/ffmpeg") else (shutil.which("ffmpeg") or "ffmpeg")       # the encoder the publish step uses
TP_LIMIT = -1.5              # dBTP of the DECODED m4a


def decoded_true_peak(m4a):
    """The true peak (dBTP) of an AAC file, measured the way the brief says: `ffmpeg -i audio.m4a -af ebur128=peak=true -f null -` (the decoder inside ffmpeg, EBU R128's 4x oversampled peak)."""
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", m4a, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"True peak:\s+Peak:\s+(-?\d+\.?\d*) dBFS", r.stderr)
    return float(m[-1]) if m else float("nan")


def aac_guard21(path, limit_db=TP_LIMIT, tries=8):
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
    src = os.path.join(HERE, out_dir, "audio.wav")
    dst = os.path.join(HERE, EPD, "audio.wav")
    m4a = os.path.join(HERE, EPD, "audio.m4a")
    shutil.copyfile(src, dst)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", dst, "-c:a", "aac", "-b:a", "192k", m4a], check=True)
    tp = decoded_true_peak(m4a)
    print(f"published: {EPD}/audio.wav and {EPD}/audio.m4a; the decoded m4a's true peak is {tp:.2f} dBTP (limit {TP_LIMIT})")
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
    """The loudness trim, peak limiter, end fade and AAC guard: the finished file measures -14.8 LUFS and the DECODED AAC stays under -1.5 dBTP (see aac_guard21)."""
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
    dips, deep, tp = aac_guard21(wav)
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
    split_src = take("--split", os.path.join(HERE, EPD, "split.json"))
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
    if not src:                                         # the animation's footsteps, if they are in build/ep21 (or the output folder): they are always tuned first
        for p in (os.path.join(A6.HERE, EPD, "events.json"), os.path.join(out_dir, "events.json")):
            if os.path.exists(p):
                src = p
                break
    SPLIT.setup(split_src)
    SOURCES["split"] = SPLIT.source
    M21.SPLIT = SPLIT                                    # the score's two pieces duck with the divider too
    tuned = _make_events(src, phys_src, out_dir)
    M21.BONK = BONK["t"]                                 # the score lands the avalanche on the last binder
    print(f"events: footsteps {SOURCES['steps']}, collisions {SOURCES['phys']} ({len(PHYS_EVENTS)} placed), {len(BED_VOL)} room-tone beds; the split: {SPLIT.source}; the bonk: {BONK['source']}")
    if tuned:
        argv += ["--events", tuned]
    sys.argv = [sys.argv[0]] + argv
    VOX_DIR[0] = os.path.join(out_dir, "voice")
    os.makedirs(VOX_DIR[0], exist_ok=True)
    _load_speech()
    _TTS_ORIG[0] = A6.tts6
    A6.tts6 = tts21
    A6.place2 = place2_21
    A6.reverb = reverb_21
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
    write_cue_report(out)
    json.dump(M21.INFO, open(os.path.join(out_dir, "score_info.json"), "w"), indent=1)
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
