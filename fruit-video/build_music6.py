"""Episode 6 score: every scene gets its own cue, written in notes and played on a small synthetic orchestra.

build_audio6.py calls score(script, scenes, lines, N) and mixes the (2, N) result under the dialogue (ducked), the ambience and the effects.
The idea: the alarms ARE the music. The station scene builds a groove out of the alarm tones themselves, the PA announcement drops the
whole thing into hold-music, the silence scene is mostly silence, and the Fire Marshal arrives with a brass fanfare that is much too big
for a break room. Nothing here is sampled; every instrument is a few lines of numpy.
"""
import numpy as np
from scipy import signal

import build_audio as BA
from build_audio import SR, tarr, osc, expdecay, ar, lp, hp, bp, midi

R = np.random.default_rng(2606)
MUSIC_GAIN = .9


# ================================================================ instruments (mono unless noted)
def _n(d):
    return int(d * SR)


def env_adsr(d, a=.005, dec=.1, sus=.7, rel=.1):
    n = _n(d)
    e = np.ones(n)
    na, nd, nr = max(1, _n(a)), max(1, _n(dec)), max(1, _n(rel))
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    if n > na:
        k = min(nd, n - na)
        e[na:na + k] = np.linspace(1, sus, k)
        e[na + k:] = sus
    nr = min(nr, n)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def pluck(f, d=.4, bright=3200, tau=.22, kind="saw"):
    x = osc(kind, f, d) * .6 + osc("sine", f, d) * .5
    x = lp(x, bright)
    return x * expdecay(d, tau) * ar(d, .001, min(.04, d / 2))


def pizz(f, d=.25):
    x = osc("tri", f, d) + .5 * osc("sine", 2 * f, d)
    return lp(x, 1800) * expdecay(d, .07) * ar(d, .0008, .02)


def marimba(f, d=.35):
    x = osc("sine", f, d) + .35 * osc("sine", 4 * f, d) * expdecay(d, .04) + .1 * osc("sine", 10 * f, d) * expdecay(d, .015)
    return x * expdecay(d, .12) * ar(d, .0008, .04)


def epiano(f, d=.9, vel=1.0):
    t = tarr(d)
    idx = (1.6 + 1.4 * vel) * np.exp(-t / .22)
    m = np.sin(2 * np.pi * f * 1.0 * t) * idx
    x = np.sin(2 * np.pi * f * t + m) * expdecay(d, .55)
    x += .25 * np.sin(2 * np.pi * f * 2 * t + .6 * m) * expdecay(d, .18)
    x += .12 * np.sin(2 * np.pi * f * 7.1 * t) * expdecay(d, .02)   # the tine
    return x * ar(d, .002, min(.12, d / 2)) * (.6 + .4 * vel)


def bell(f, d=1.4):
    x = sum(a * osc("sine", f * r, d) * expdecay(d, tau) for a, r, tau in ((1, 1, .5), (.5, 2.76, .25), (.3, 5.4, .12), (.2, 8.93, .06)))
    return x * ar(d, .001, .1)


def vibes(f, d=1.0):
    x = osc("sine", f, d) + .3 * osc("sine", 4 * f, d) * expdecay(d, .1)
    trem = 1 + .25 * np.sin(2 * np.pi * 5.5 * tarr(d))
    return x * trem * expdecay(d, .6) * ar(d, .002, .1)


def sub_bass(f, d=.4):
    x = osc("sine", f, d) + .35 * osc("tri", f, d) + .12 * osc("saw", f, d)
    return lp(x, 900) * env_adsr(d, .006, .08, .75, .06)


def saw_bass(f, d=.3, cutoff=700):
    x = osc("saw", f, d) + .6 * osc("square", f * .5, d)
    return lp(x, cutoff, 3) * env_adsr(d, .004, .06, .7, .04)


def pad(notes, d, a=.7, r=.9, bright=1700, detune=.12):
    """A warm stereo pad: two detuned saws per note, one in each ear, plus a sine for weight."""
    n = _n(d)
    L = np.zeros(n)
    Rr = np.zeros(n)
    for m in notes:
        L += osc("saw", midi(m - detune), d) + .6 * osc("sine", midi(m), d)
        Rr += osc("saw", midi(m + detune), d) + .6 * osc("sine", midi(m), d)
    e = ar(d, a, r)
    return np.stack([lp(L, bright) * e, lp(Rr, bright) * e]) / max(1, len(notes)) * 1.6


def strings(notes, d, a=.35, r=.5, vib=5.2, bright=2600):
    n = _n(d)
    t = tarr(d)
    out = np.zeros((2, n))
    for i, m in enumerate(notes):
        for k, det in enumerate((-.1, .1)):
            v = 1 + .004 * np.sin(2 * np.pi * vib * t + i)
            x = osc("saw", midi(m + det) * v, d)
            out[k] += x * (1 if k == i % 2 else .6)
    return lp(out, bright) * ar(d, a, r) / max(1, len(notes)) * 1.5


def brass(notes, d, a=.04, r=.12, bright=1800, swell=0.0, vib=0.0):
    t = tarr(d)
    x = np.zeros(_n(d))
    for m in notes:
        for det in (-.07, 0, .07):
            f = midi(m + det) * (1 + (.006 * np.sin(2 * np.pi * 5.5 * t) if vib else 0))
            x += osc("saw", f, d)
    x = lp(x, bright, 2) / max(1, len(notes)) * .55
    e = ar(d, a, r) * (1 + swell * np.linspace(-.5, .5, _n(d)))
    return x * e


def kick(d=.28, f0=150, f1=44):
    x = osc("sine", np.linspace(f0, f1, _n(d)), d) * expdecay(d, .09)
    x += .35 * bp(R.uniform(-1, 1, _n(d)), 900, 4000) * expdecay(d, .006)
    return x * ar(d, .0005, .03)


def snare(d=.22):
    x = bp(R.uniform(-1, 1, _n(d)), 1400, 7000) * expdecay(d, .06) + .6 * osc("sine", np.linspace(220, 160, _n(d)), d) * expdecay(d, .05)
    return x * ar(d, .0005, .03) * .8


def clap(d=.18):
    x = np.zeros(_n(d))
    for k, off in enumerate((0, .012, .024, .04)):
        n = bp(R.uniform(-1, 1, _n(.05)), 1100, 5500) * expdecay(.05, .012 + .004 * k)
        i = _n(off)
        x[i:i + len(n)] += n[: len(x) - i]
    return x * ar(d, .0005, .04) * .7


def hat(d=.06, open_=False):
    d = .22 if open_ else d
    x = hp(R.uniform(-1, 1, _n(d)), 7200) * expdecay(d, .12 if open_ else .014)
    return x * ar(d, .0003, .01) * .5


def shaker(d=.07):
    x = hp(R.uniform(-1, 1, _n(d)), 5000) * np.sin(np.pi * np.linspace(0, 1, _n(d))) ** 1.5
    return x * .4


def tom(f=110, d=.4):
    x = osc("sine", np.linspace(f * 1.5, f, _n(d)), d) * expdecay(d, .13)
    return x * ar(d, .001, .05) * .9


def timp(f=70, d=1.2):
    x = osc("sine", np.linspace(f * 1.18, f, _n(d)), d) * expdecay(d, .55) + .4 * osc("tri", f, d) * expdecay(d, .3)
    return x * ar(d, .002, .1)


def roll(f=70, d=1.0, hits=18):
    out = np.zeros(_n(d + .6))
    for i in range(hits):
        at = d * i / hits
        BA.place(out, timp(f, .5) * (.25 + .75 * (i / hits) ** 1.3), at)
    return out


def riser(d=2.0, f0=300, f1=5200, gain=.5):
    n = _n(d)
    t = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** t
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * .35
    nz = R.uniform(-1, 1, n)
    out = np.zeros(n)
    for i, (lo, hi) in enumerate(((300, 900), (900, 2600), (2600, 7000))):
        seg = bp(nz, lo, hi) * np.clip((t - i * .25) * 2.0, 0, 1)
        out += seg
    return (out * .5 + x) * t ** 1.8 * gain


def impact(d=1.6):
    x = osc("sine", np.linspace(95, 30, _n(d)), d) * expdecay(d, .5)
    x += .6 * lp(R.uniform(-1, 1, _n(d)), 400) * expdecay(d, .25)
    x += .35 * hp(R.uniform(-1, 1, _n(d)), 5000) * expdecay(d, .5)
    return x * ar(d, .001, .3)


def crash(d=2.0):
    return hp(R.uniform(-1, 1, _n(d)), 3500) * expdecay(d, .5) * ar(d, .001, .4) * .55


def tick(d=.03):
    return bp(R.uniform(-1, 1, _n(d)), 1800, 6500) * expdecay(d, .004) * .6


def heart(d=.35):
    x = osc("sine", np.linspace(70, 42, _n(d)), d) * expdecay(d, .09)
    return x * ar(d, .004, .08)


def sting_brass(notes, d=1.2, bright=2000):
    return brass(notes, d, a=.015, r=.35, bright=bright, swell=-.3)


# ================================================================ the sequencer
class Track:
    """A stereo buffer you can drop clips into by time in seconds or in beats from a scene start."""

    def __init__(self, N):
        self.buf = np.zeros((2, N))
        self.N = N

    def put(self, clip, at, gain=1.0, pan=0.0):
        i = int(round(at * SR))
        if clip.ndim == 1:
            th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
            clip = np.stack([clip * np.cos(th), clip * np.sin(th)])
        if i < 0:
            clip, i = clip[:, -i:], 0
        n = min(clip.shape[1], self.N - i)
        if n > 0:
            self.buf[:, i:i + n] += clip[:, :n] * gain

    def fade(self, a, b, f0, f1):
        """Scale the span [a, b] seconds by a gain that moves from f0 to f1."""
        i, j = max(0, int(a * SR)), min(self.N, int(b * SR))
        if j > i:
            self.buf[:, i:j] *= np.linspace(f0, f1, j - i)

    def gate(self, a, b, g=0.0, ramp=.03):
        """Scale a span by g with short ramps at both ends (a hard stop that does not click)."""
        i, j = max(0, int(a * SR)), min(self.N, int(b * SR))
        if j <= i:
            return
        e = np.ones(j - i) * g
        r = min(_n(ramp), (j - i) // 2)
        if r > 0:
            e[:r] = np.linspace(1, g, r)
            e[-r:] = np.linspace(g, 1, r)
        self.buf[:, i:j] *= e


def hall(x, wet=.25, rt=1.8):
    """A concert-hall tail: each ear gets its own exponentially decaying noise impulse response, convolved with overlap-add."""
    n = int(rt * 1.3 * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        rr = np.random.default_rng(900 + ch)
        ir = rr.uniform(-1, 1, n) * np.exp(-t * (6.9 / rt))
        ir = lp(ir, 5200)
        ir[: int(.018 * SR)] *= np.linspace(0, 1, int(.018 * SR))
        ir /= np.sqrt(np.sum(ir ** 2))
        out[ch] = signal.oaconvolve(x[ch], ir)[: x.shape[1]]
    return x * (1 - wet * .35) + out * wet * .55


# ================================================================ harmony
A2, C3, D3, E3, F3, G3 = 45, 48, 50, 52, 53, 55
CH = {
    "Am": [57, 60, 64], "Am7": [57, 60, 64, 67], "F": [53, 57, 60], "Fmaj7": [53, 57, 60, 64], "G": [55, 59, 62], "C": [48, 52, 55, 60],
    "Cmaj7": [48, 52, 55, 59], "Cmaj9": [48, 55, 59, 62, 64], "Dm": [50, 53, 57], "Dm7": [50, 53, 57, 60], "E": [52, 56, 59], "E7": [52, 56, 59, 62],
    "Bb": [58, 62, 65], "Fm": [53, 56, 60], "Ab": [56, 60, 63], "Em": [52, 55, 59], "Bdim": [59, 62, 65], "Gm7": [55, 58, 62, 65],
}


def up(ch, o=0):
    return [n + o for n in CH[ch]]


# ================================================================ scene cues
def cue_lobby(T, t0, d, beats):
    """2:59 PM. Warm and a little too nice: an electric piano over a shaker, the way a day looks right before it goes wrong."""
    bpm = 78
    b = 60 / bpm
    prog = ["Cmaj7", "Am7", "Fmaj7", "G"]
    pads = []
    for i in range(int(d / (2 * b)) + 1):
        ch = prog[i % 4]
        if t0 + i * 2 * b >= t0 + d:
            break
        T.put(pad(up(ch, 12), 2 * b + .6, .5, .7, 1500), t0 + i * 2 * b, .05)
        pat = [0, 2, 1, 3, 2, 1, 2, 0] if i % 2 == 0 else [0, 1, 2, 3, 3, 2, 1, 2]
        for j, p in enumerate(pat):
            nn = CH[ch][p % len(CH[ch])] + 12
            T.put(epiano(midi(nn), .7, .55 + .25 * (j % 4 == 0)), t0 + (i * 2 + j * .25) * b, .12 * (.8 + .2 * (j % 2 == 0)), -.25 + .08 * j % .5)
        T.put(sub_bass(midi(CH[ch][0] - 12), 1.0 * b), t0 + i * 2 * b, .16, 0)
        T.put(sub_bass(midi(CH[ch][0] - 5), .9 * b), t0 + (i * 2 + 1) * b, .12, 0)
    for k in range(int(d / (b / 2))):
        T.put(shaker(), t0 + k * b / 2, .05 if k % 2 else .035, .35 if k % 2 else -.35)
    # the three little alarm beeps foreshadow the day: the bed thins under them
    if "beep" in beats:
        T.gate(beats["beep"][0] - .1, beats["beep"][1] + .2, .45, .08)
    T.fade(t0 + d - .9, t0 + d, 1, 0)


def cue_title(T, t0, d, beats):
    """The logo: a riser, a timpani roll and a big downbeat, then it hangs in the air."""
    land = t0 + .2 + 2.2   # theme6 resolves 2.2 s after its cue
    T.put(riser(2.2, 240, 6200, .85), land - 2.2, .30)
    T.put(roll(70, 2.0, 26), land - 2.0, .26, -.1)
    T.put(impact(1.8), land, .42)
    T.put(crash(2.2), land, .24, .1)
    for i, m in enumerate((52, 59, 64, 68)):
        T.put(brass([m, m - 12], 1.5, .03, .5, 1700, vib=1), land, .08, -.4 + i * .27)


def cue_station(T, t0, d, beats):
    """31 alarms. A groove built from alarm tones, entering one layer at a time as the count climbs."""
    bpm = 112
    b = 60 / bpm
    nb = int(d / b)
    bs = [45, 45, 52, 45, 48, 48, 43, 52]
    L = {"bass": t0, "mar": beats["s3"][0], "drum": beats["s5"][0], "alarm": beats["s7"][0], "stab": beats["s9"][0]}
    stop = beats["s10"][0] - .02   # "Thirty-one." lands in silence
    for k in range(nb * 2):
        at = t0 + k * b / 2
        if at >= stop - .1:
            break
        step = k % 8
        T.put(pizz(midi(bs[step]), .26 if step % 2 == 0 else .18), at, .24 if step % 2 == 0 else .15, -.1)
    pent = [69, 72, 74, 76, 79, 76, 74, 72]
    for k in range(nb * 4):
        at = t0 + k * b / 4
        if at < L["mar"] or at >= stop - .1 or k % 16 in (3, 6, 11, 14):
            continue
        T.put(marimba(midi(pent[(k * 3) % 8]), .3), at, .12, .3 * (1 if k % 2 else -1))
    for k in range(nb * 2):
        at = t0 + k * b / 2
        if at < L["drum"] or at >= stop - .1:
            continue
        if k % 2 == 0:
            T.put(kick(), at, .5 if (k // 2) % 2 == 0 else .38, 0)
            if (k // 2) % 2 == 1:
                T.put(clap(), at, .30, .1)
        else:
            T.put(hat(), at, .18, .4)
    for k in range(nb * 4):
        at = t0 + k * b / 4
        if at < L["alarm"] or at >= stop - .1:
            continue
        if k % 4 == 0:
            T.put(bell(midi(84), .4) * .6, at, .11, -.5)
        if k % 8 == 3:
            T.put(bell(midi(79), .3) * .6, at, .10, .5)
        if k % 2 == 1:
            T.put(tick() * 1.2, at, .12, 0)
    for k in range(int((stop - L["stab"]) / b)):
        at = L["stab"] + k * b
        if k % 2 == 0:
            T.put(brass(up("Am"), .22, .01, .08, 1400), at, .12, 0)
    T.put(impact(1.2) * .8, stop + .02, .5)
    T.put(pad([45, 52, 57, 60], 3.0, 1.0, 1.4, 900), beats["s11"][0], .12)
    T.put(pad([45, 51, 57, 60], 3.2, .8, 1.6, 900), beats["s12"][0] - .1, .1)
    T.fade(t0 + d - 1.0, t0 + d, 1, 0.6)


def cue_run(T, t0, d, beats):
    """4:10 PM. Silencing alarms at a dead run, then the PA turns the whole score into hold music."""
    bpm = 138
    b = 60 / bpm
    chime = beats["chime"][0]
    pa_end = beats["pa1"][1]
    # montage and dash: driving eighths, snare on 2 and 4, a fast marimba line
    for k in range(int((chime - t0) / (b / 2)) + 1):
        at = t0 + .1 + k * b / 2
        if at >= chime - .02:
            break
        root = [45, 45, 48, 43][(k // 8) % 4]
        T.put(saw_bass(midi(root), b * .45, 600 + 30 * k), at, .22 if k % 2 == 0 else .15, -.1)
        T.put(hat(), at, .17, .45 if k % 2 else -.3)
        if k % 4 == 0:
            T.put(kick(), at, .5, 0)
        if k % 4 == 2:
            T.put(snare(), at, .42, .1)
    for k in range(int((chime - t0) / (b / 4))):
        at = t0 + .1 + k * b / 4
        if at >= chime - .02:
            break
        T.put(marimba(midi([81, 84, 88, 84, 86, 83, 79, 83][k % 8]), .2), at, .10, .5 if k % 2 else -.5)
    # the PA: sixty seconds of elevator music. Mild chords, a ride cymbal, a walking bass that has never been upset
    pa_chords = ["Cmaj9", "Fmaj7", "Dm7", "G"]
    for i in range(int((pa_end - chime) / (2 * .75)) + 1):
        at = beats["pa1"][0] + i * 1.5 - .05
        ch = pa_chords[i % 4]
        T.put(epiano(midi(CH[ch][0] + 12), 1.4, .5), at, .09, -.2)
        for j, nn in enumerate(CH[ch][1:4]):
            T.put(epiano(midi(nn + 12), 1.3, .4), at + .02 * j, .055, .2)
        T.put(sub_bass(midi(CH[ch][0] - 12), .6), at, .15, 0)
        T.put(sub_bass(midi(CH[ch][0] - 5), .5), at + .75, .11, 0)
        for h in range(4):
            T.put(hat(), at + h * .375, .05, .35)
    # after the announcement: a tension bed with a ticking clock for "Quieter. Not fewer."
    T.put(pad([45, 52, 57], max(.5, beats["s5"][1] - pa_end + .5), 1.2, 1.2, 800), pa_end - .3, .12)
    for k in range(int((beats["s5"][1] - pa_end) / .5)):
        T.put(tick(), pa_end + k * .5, .1 + .03 * (k % 2), .3 * (1 if k % 2 else -1))
    T.put(riser(1.1, 300, 4200, .5), beats["s5"][0] - 1.0, .4)
    T.put(impact(1.4), beats["s5"][1] + .05, .35)
    T.fade(t0, t0 + d, .8, .8)   # the montage is the loudest thing in the score; keep it out of the dialogue's way


def cue_still(T, t0, d, beats):
    """6:30 PM. Mostly silence. A sub drone, a heartbeat for the stethoscope, a heist for the stack, and a long exhale."""
    hunt0, hunt1 = beats["hunt"]
    # nothing for the hush; a very low drone creeps in after the first line
    T.put(pad([33, 40, 45], hunt0 - beats["m1"][0] + 1.0, 3.0, 2.0, 420), beats["m1"][0], .13)
    # the chirps: after each one the room is a little quieter
    # the stethoscope hunt: a heartbeat, then a sneaking pizzicato
    for k in range(int((hunt1 - hunt0) / .9) + 1):
        at = hunt0 + k * .9
        T.put(heart(), at, .45, 0)
        T.put(heart(.3), at + .2, .30, 0)
    bpm = 104
    b = 60 / bpm
    walk = [45, 48, 50, 52, 50, 48, 45, 43]
    for k in range(int((hunt1 - hunt0 - .6) / (b / 2))):
        at = hunt0 + .6 + k * b / 2
        T.put(pizz(midi(walk[k % 8] + 12), .22), at, .17, -.25 if k % 2 else .25)
        if k % 2 == 0:
            T.put(marimba(midi(walk[(k // 2) % 8] + 24), .2), at, .08, .4)
    # Lime hears a chirp: a little music-box line over the confusion
    l1, l2 = beats["l1"][0], beats["l2"][1]
    for k, nn in enumerate([84, 88, 91, 88, 84, 86, 83, 79]):
        T.put(bell(midi(nn), .6) * .5, l1 + k * .22, .09, .5)
    # the freeze: pure silence, then the chirp is the only sound; a held chord afterwards
    fr0, fr1 = beats["freeze"]
    T.gate(fr0 - .05, fr1 - .5, .0, .06)
    T.put(pad([45, 52, 57, 60, 64], 3.2, 1.0, 1.0, 900), fr1 - .5, .12)
    # the heist: pizzicato in 6/8, creeping upward by half steps, a tom tick on every bar
    m6 = beats["m6"][0]
    pull = beats["pull"][0]
    hb = 60 / 132
    for k in range(int((pull - m6) / (hb / 2))):
        at = m6 + k * hb / 2
        stepn = k % 6
        base = 45 + int((at - m6) / 1.2)   # rises a semitone every 1.2 s
        T.put(pizz(midi(base + [0, 7, 12, 7, 3, 7][stepn]), .2), at, .20, -.3 if stepn % 2 else .3)
        if stepn == 0:
            T.put(tom(95), at, .22)
        if stepn in (2, 5):
            T.put(shaker(), at, .1, .4)
    T.put(riser(1.2, 300, 5200, .6), pull - 1.0, .4)
    T.gate(pull - .02, pull + .55, .0, .02)          # the pull: a beat of nothing
    T.put(impact(1.1) * .6, pull + .55, .3)
    # relief: a soft major chord, then it thins out
    T.put(pad(up("C", 0) + [67], 5.0, .8, 2.2, 1300), pull + .6, .14)
    T.put(epiano(midi(72), 2.0, .5), pull + .9, .14, -.2)
    T.put(epiano(midi(76), 2.0, .5), pull + 1.1, .12, .2)
    T.fade(t0 + d - 1.5, t0 + d, 1, .0)


def cue_ding(T, t0, d, beats):
    """7:00 PM. The microwave goes ding and every nurse on the floor answers it at once. Fanfare, timpani, a flat bit of brass at the end."""
    d0 = beats["ding"][0]
    st0, st1 = beats["stampede"]
    # the calm before: a held, sleepy chord
    T.put(pad(up("F", 0), d0 - t0 + .1, 1.0, .3, 900), t0, .10)
    # the hit
    T.put(impact(1.0), d0, .5)
    T.put(brass(up("C", 12), .5, .01, .2, 2200), d0 + .02, .22)
    # the charge: timpani, a galloping bass, brass stabs on the off-beats, a rising line
    bpm = 156
    b = 60 / bpm
    nsteps = int((st1 - st0) / (b / 2))
    for k in range(nsteps):
        at = st0 + k * b / 2
        T.put(timp(65 if (k // 4) % 2 == 0 else 73, .4), at, .34 if k % 2 == 0 else .2, -.1)
        if k % 2 == 1:
            T.put(brass(up("Am" if (k // 8) % 2 == 0 else "F", 0), .18, .008, .06, 2000), at, .16, .1)
        T.put(hat(), at, .14, .4 if k % 2 else -.4)
        if k % 4 == 0:
            T.put(kick(), at, .45)
        if k % 4 == 2:
            T.put(snare(), at, .32)
    T.put(riser(st1 - st0, 300, 6000, .5), st0, .35)
    T.put(roll(70, 1.0, 14), st1 - 1.0, .35)
    # the PA says not to run: the music drops to a half-speed oom-pah
    pa = beats["pa1"][0]
    T.gate(st1 - .02, pa + .2, .12, .03)
    for k in range(int((beats["pa1"][1] - pa) / .45)):
        T.put(sub_bass(midi(41 if k % 2 == 0 else 48), .3), pa + k * .45, .2)
    # the smell: a deflating brass line, the oldest joke there is
    T.fade(t0 + d - 1.0, t0 + d, 1, .5)
    m3 = beats["m3"][1]
    for k, nn in enumerate((58, 57, 56, 55)):
        T.put(brass([nn - 12], .26 if k < 3 else .7, .03, .12, 1000, vib=1), m3 - .35 + k * .26, .16 if k < 3 else .20)


def cue_marshal(T, t0, d, beats):
    """7:05 PM. A brass fanfare much too large for the room, then low strings, a drum for every accusation, and one very loud horn."""
    # entrance
    T.put(impact(1.4), beats["bang"][0], .45)
    f1 = beats["f1"][0]
    for k, (nn, dd) in enumerate(((60, .25), (64, .25), (67, .25), (72, .9))):
        T.put(brass([nn, nn - 12], dd, .02, .1, 2000), f1 + .02 + k * .28, .18, 0)
    T.put(timp(62, 1.2), f1, .45)
    T.put(roll(66, 1.1, 18), f1 - .1, .22)
    # the interrogation: low strings that never resolve, with a heartbeat of timpani on every line he speaks
    q0, q1 = beats["point"][0], beats["install"][0] - .3
    T.put(strings([33 + 12, 40 + 12, 45 + 12, 51 + 12], q1 - q0 + 1.0, .8, 1.0, 5.0, 1100), q0 - .2, .10)
    for lid in ("f2", "f3", "f4", "f5", "f6", "f7"):
        T.put(timp(60, .8), beats[lid][0], .30)
    for lid in ("s1", "s2", "s3", "s4"):
        T.put(pizz(midi(40), .3), beats[lid][0], .18)
    # the blame circle: a quick rising run
    pt = beats["point"][0]
    for k, nn in enumerate((57, 60, 64, 67, 69, 72)):
        T.put(marimba(midi(nn + 12), .25), pt + k * .15, .12, -.4 + k * .16)
    # "It is to us.": a dissonant chord
    a1 = beats["a1"][0]
    T.put(brass([57, 60, 63, 66], .9, .02, .3, 1300), a1 + .3, .24)
    # the battery goes in: a hopeful rising line, then the horn takes over the whole mix
    ins = beats["install"][0]
    for k, nn in enumerate((60, 64, 67, 72)):
        T.put(epiano(midi(nn + 12), .5, .8), ins + .05 + k * .22, .20, -.3 + k * .2)
    horn = ins + 1.0
    T.gate(horn - .02, horn + 3.6, .0, .03)
    # afterwards: "There is a fire." and a pompous, wrong little stab
    f8 = beats["f8"][0]
    T.put(brass([60, 67, 72], .5, .02, .15, 2200), f8 - .1, .18)
    f9 = beats["f9"][0]
    T.put(sting_brass([55, 62, 67], .9), f9 + .15, .22)
    T.put(timp(55, 1.0), f9 + .15, .35)
    T.fade(t0 + d - .8, t0 + d, 1, .0)


def cue_end(T, t0, d, beats):
    """The reprise: the series theme, warm this time. Strings, a bell on every alarm color, a held chord, a crash for the 33."""
    c0 = t0 + .15
    b = 60 / 96
    # theme6 (the sfx) climbs a Cmaj9 and lands on E major at 2.2 s; the score follows it home to C
    plan = [("C", 0.0, 2.2), ("E", 2.2, 2.4), ("Am", 4.6, 1.5), ("F", 6.1, 1.3), ("G", 7.4, 1.0), ("C", 8.4, 3.0)]
    for ch, a, dd in plan:
        if c0 + a >= t0 + d + 1.0:
            break
        T.put(strings(up(ch, 12), dd + .4, .12, .5, 5.5, 2800), c0 + a, .14)
        T.put(brass(up(ch, 0), dd, .03, .3, 1500), c0 + a, .10, 0)
        T.put(sub_bass(midi(CH[ch][0] - 12), dd), c0 + a, .28)
        for k in range(int(dd / (.5 * b))):
            T.put(marimba(midi(CH[ch][k % 3] + 24), .3), c0 + a + k * .5 * b, .09, -.3 + .2 * (k % 4))
        for k in range(int(dd / b)):
            T.put(kick(), c0 + a + k * b, .36 if k % 2 == 0 else .22)
            if k % 2 == 1:
                T.put(clap(), c0 + a + k * b, .20)
    for k, nn in enumerate((84, 88, 91, 96, 91, 88)):
        T.put(bell(midi(nn), 1.2) * .6, c0 + 2.4 + k * .17, .12, -.6 + .24 * k)
    T.put(crash(2.4), c0 + 2.4, .35)
    T.put(timp(65, 1.4), c0 + 2.4, .35)
    T.fade(t0 + d - 1.4, t0 + d, 1, 0)


def cue_post(T, t0, d, beats):
    """7:31 PM. Nothing but a pad that will not resolve, and the last chirp."""
    T.put(pad([33, 40, 46], d, 1.0, 1.0, 380), t0 + .1, .10)
    T.gate(beats["f1"][1] + .05, t0 + d, .0, .08)


CUES = {"lobby": cue_lobby, "title": cue_title, "station": cue_station, "run": cue_run, "still": cue_still, "ding": cue_ding,
        "marshal": cue_marshal, "end": cue_end, "post": cue_post}


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    T = Track(N)
    for sc in scenes:
        fn = CUES.get(sc["id"])
        if not fn:
            continue
        t0 = sc["start"]
        beats = {k: (t0 + v["s"], t0 + v["e"]) for k, v in sc["beats"].items()}
        fn(T, t0, sc["dur"], beats)
        T.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.0, 0.0, .15)   # a cue's tail never bleeds into the next scene
    return hall(T.buf, wet=.55, rt=1.6) * MUSIC_GAIN
