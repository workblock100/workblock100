"""Episode 15 score: THE MERGER. Corporate positive, turning sour.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music15; the mixer ducks the bed under every voice (and so does this file: _speech_dip). Every scene is rendered on
its own two tracks (U goes through the room's reverb, D stays dry for hits, rhythm and anything that must be tight), then summed; a few spans are muted after the reverb so silence is dead
silence. All cue times come from the script's beats (scene-local, shifted to the scene start) and from the spoken lines, so the score lands on the same offsets as the sound effects.

Palette: a bright ukulele or pizzicato strum, claps and finger snaps, marimba and glockenspiel, a whistle, a friendly synth pad, upbeat drums; then the minor-mode twist: the same tune slowed,
detuned, with a drone and a muted trumpet. Nothing is sampled.

THE MOTIFS (leitmotifs; all in C unless the scene turns)
  MERGE THEME (MT)   a corporate jingle at 114.29 bpm (a bar is 2.1 s, so the title's 0.2 to 2.3 s is exactly one bar). Bar 1: the arpeggio C5 E5 G5 C6 G5 E5 G5 C6 in eighths over C, ending on F
                     (IV) in the last beat; the satisfying two-chord resolution F to C lands on the merge (2.30 s). Tune (bars 2 to 4): E5 D5 C5 D5 / E5 G5 A5 G5 / D5 then a held E5, over C G / Am F / G C.
                     At the end card it is reprised in full band and its last held note is 45 cents flat and sinking: cheerful again, but one note off.
  BINDER JINGLE (BJ) four cheerful notes, a rising scale, C5 D5 E5 G5 (marimba and glockenspiel with a pizzicato bounce). Under Binder's lines. On the grin it curdles: C5 D5 E-flat5 G-flat5, slowed,
                     detuned, a drone under it (BJ_MINOR).
  ARTICHOKE THEME (AT)  smooth elevator-jazz: a sax over a soft Rhodes (Cmaj9, A7-9, Dm9, G13), a brush and a walking bass, always a little too smooth (the tune lingers on the 7th and 9th);
                     on the TV it is band-limited like the call is.
  ONION'S CLARINET SOB (OS) a clarinet whimper: three notes falling, G5 F5 D5, the last one trembling and sliding down.
  TOMATO'S PIZZICATO (TP)  perky and indecisive: pizzicato C-E-G (major) answered by C-E-flat-G (minor), alternating.
"""
import numpy as np
from scipy import signal

from build_audio import SR, tarr, osc, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pizz, marimba, bell, sub_bass, saw_bass, pad, strings, brass, hat, shaker, timp, roll, riser, impact, crash, tick, heart, kick, snare, clap, tom,
                          epiano, MUSIC_GAIN, _n)
from build_music7 import woodblock, taiko, choir, slide_brass
import build_music10 as M10
from build_music10 import piano, violin, clarinet, mtrumpet, tuba, slide_whistle, brush, cue_dips
from build_music9 import grid, ss, snap, uke, spic, rising
import build_music13 as M13
from build_music13 import tvf, _fit_peak, _fit_rms, _mute, _speech_dip, glass, revcym, sub_swell, ubass, vib, kick13, snare13, hum, cello
import build_music14 as M14
from build_music14 import horn, trumpet, harp, celesta, xylo, bassoon, bdrum, tamtam, trem_strings, gliss_cello

R15 = np.random.default_rng(2715)
MUTES = []          # [start, end, ramp] spans, absolute seconds, where the finished score is silent (after the reverb, so the silence is dead)
BL = 60 / 114.2857  # a beat of the Merge theme: 0.525 s
MT_ARP = (72, 76, 79, 84, 79, 76, 79, 84)
BJ = (72, 74, 76, 79)                  # C5 D5 E5 G5
BJ_MINOR = (72, 74, 75, 78)            # C5 D5 Eb5 Gb5: the same tune, curdled
TP_MAJ, TP_MIN = (60, 64, 67), (60, 63, 67)


# ================================================================ helpers
def W(line, word, k=0):
    """Absolute time of a word in a line of the current scene (the same proportional word times the captions use)."""
    return M10.wt(line, word, k)


def _noise(d):
    return R15.uniform(-1, 1, _n(d))


def whistle(m, d=.5, vel=.8, a=.04, r=.1):
    """A whistled note: a nearly pure sine with a trace of its octave, a scoop up into the pitch, a vibrato that arrives after a quarter second and a breath of air on top."""
    t = tarr(d)
    f = midi(m) * (1 + .018 * np.exp(-t / .04)) * (1 + .006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - .22) / .2, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .06 * np.sin(2 * ph)
    x = x + bp(_noise(d), 2600, 5200) * .035
    return x * ar(d, a, min(r, d * .45)) * (.35 + .5 * vel) * .8


def sax(m, d=.6, vel=.8, a=.05, r=.12, bright=1.0):
    """A smooth tenor sax: a saw and a square (the reedy and the hollow), a scoop up into each note, a vibrato that arrives late, a nasal formant near 1.1 kHz, and breath. Too smooth."""
    t = tarr(d)
    f0 = midi(m)
    f = f0 * (1 - .02 * np.exp(-t / .05)) * (1 + .0055 * np.sin(2 * np.pi * 5.3 * t) * np.clip((t - .25) / .3, 0, 1))
    ph = np.cumsum(f) / SR
    x = (2 * (ph % 1) - 1) * .55 + np.sign(np.sin(2 * np.pi * ph)) * .3 + np.sin(2 * np.pi * 2 * ph) * .15
    x = lp(x, (1500 + 1700 * vel) * bright, 2) + .5 * bp(x, 800, 1500, 1) + hp(_noise(d), 2000) * np.exp(-t / .06) * .03 + bp(_noise(d), 1500, 4500) * .02
    return M13._fit_rms(x, .25) * ar(d, a, min(r, d * .45)) * (.4 + .6 * vel)


def sob_clar(m0, m1, d=.6, vel=.7, tremble=7.0):
    """Onion's clarinet sob: a clarinet's odd harmonics sliding from m0 down to m1, with a tremble in both pitch and level that grows toward the end, a breath of air."""
    t = tarr(d)
    f = midi(m0) * (midi(m1) / midi(m0)) ** ((t / d) ** 1.4) * (1 + .012 * (t / d) * np.sin(2 * np.pi * tremble * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(g * np.sin(k * ph) for k, g in ((1, 1.0), (3, .45), (5, .25), (7, .12)))
    x = lp(x, 3000, 2) + bp(_noise(d), 1200, 4000) * .03
    return M13._fit_rms(x, .25) * ar(d, .05, min(.25, d * .5)) * (1 - .3 * (t / d) * (.5 + .5 * np.sin(2 * np.pi * tremble * t))) * (.4 + .6 * vel)


def bounce(T, at, notes, g=.1, step=.14, pan=.1, minor=False):
    """The Binder jingle: four notes climbing (a marimba with a glockenspiel on top and a pizzicato under) `step` seconds apart. minor: it curdles (slower, flatter, a detuned glock)."""
    for j, m in enumerate(notes):
        T.put(marimba(midi(m), .3), at + j * step, g, pan)
        T.put(bell(midi(m + 12), .8) * .35, at + j * step, g * .8, pan + .1)
        if not minor:
            T.put(pizz(midi(m - 12), .2), at + j * step, g * .8, pan - .1)
    if minor:
        T.put(bell(midi(notes[-1] + 11.55), 1.4) * .5, at + 3 * step, g * .6, pan)


def callfx(x, lo=260, hi=3600):
    """A video call's version of a stereo signal: band-limited, a little saturation, a faint comb: the Artichoke theme as it comes out of the TV."""
    sos = signal.butter(4, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos")
    y = signal.sosfilt(sos, x, axis=-1)
    pk = np.abs(y).max() + 1e-9
    y = np.tanh(1.8 * y / pk) * pk / 1.3
    d = int(.0017 * SR)
    y[..., d:] += .12 * y[..., :-d]
    return y


def comp(T, at, notes, d, g=.1, pan=.3):
    """One strum of a chord on the ukulele."""
    uke(T, at, notes, g, pan)


# ---------------------------------------------------------------- the Merge theme
CH = {"C": (60, 64, 67), "F": (60, 65, 69), "G": (59, 62, 67), "Am": (60, 64, 69)}
BASS = {"C": 36, "F": 41, "G": 43, "Am": 45}
# (bar, beat, midi, beats) of the tune after the arpeggio bar; chords per half bar
MT_TUNE = ((0, 0, 76, 1.5), (0, 1.5, 74, .5), (0, 2, 72, 1), (0, 3, 74, 1),
           (1, 0, 76, 1), (1, 1, 79, 1), (1, 2, 81, 1.5), (1, 3.5, 79, .5),
           (2, 0, 74, 1), (2, 1, 77, 1), (2, 2, 76, 2.0))
MT_CHORDS = (("C", "G"), ("Am", "F"), ("G", "C"))


def mt_bar1(T, D, t0, full=1.0):
    """Bar 1 of the Merge theme from t0 (2.1 s): the arpeggio in eighths on marimba and glockenspiel, a pad that swells, claps on 2 and 4, a bounce of pizzicato bass, the last beat on F
    (IV), and a snare roll that lands on the downbeat at t0 + 2.1 (the resolution is placed by the caller, because it differs by scene)."""
    st = BL / 2
    for i, m in enumerate(MT_ARP):
        g = (.5 + .5 * i / 7) * full
        T.put(marimba(midi(m), .3), t0 + i * st, .11 * g, -.2 + .05 * i)
        T.put(bell(midi(m + 12), .8) * .4, t0 + i * st, .06 * g, .25)
    T.put(pad([48, 52, 55, 60], 1.8, .5, .35, 1500), t0, .09 * full)
    T.put(pad([53, 57, 60, 65], BL + .1, .1, .2, 1700), t0 + 3 * BL, .09 * full)
    for k in range(3):
        T.put(ubass(36, .4, .7), t0 + k * BL, .17 * full, -.1)
    T.put(ubass(41, .5, .8), t0 + 3 * BL, .18 * full, -.1)
    for k in (1, 3):
        D.put(clap(), t0 + k * BL, .1 * full, .2)
    for j in range(3):
        D.put(snap(), t0 + (4 + 2 * j) * BL / 2 + BL / 4, .05 * full, -.3 + .3 * j)
    D.put(roll(160, 2 * BL * .95, 10) * .5, t0 + 2 * BL, .05 * full, 0)


def mt_tune(T, D, t0, nbars, last_flat=0.0, g=1.0, wh=True):
    """Bars 2 to 4 of the Merge theme from t0: the tune on a marimba, doubled by a whistle in the high octave; a ukulele on the offbeats, a pizzicato bass, a kick on 1 and 3, a clap on 2 and 4,
    hats, a pad on the chord. last_flat: how many semitones flat the final held note is (a flat that sinks)."""
    for b in range(nbars):
        bt = t0 + b * 4 * BL
        chs = MT_CHORDS[b]
        for h in range(2):
            ch = chs[h]
            T.put(pad([m - 12 for m in CH[ch]] + [CH[ch][0]], 2 * BL + .1, .08, .25, 1500), bt + h * 2 * BL, .08 * g)
            for k in range(2):
                at = bt + (2 * h + k) * BL
                T.put(ubass(BASS[ch] + (0 if k == 0 else 7 if ch != "G" else 5), .45, .75), at, .17 * g, -.1)
                D.put(kick13(.8) if k == 0 else clap(), at, .1 * g if k == 0 else .09 * g, 0 if k == 0 else .2)
                comp(T, at + BL / 2, [m for m in CH[ch]], .3, .06 * g, .35)
                D.put(hat(), at + BL / 2, .035 * g, -.2)
                D.put(hat(), at, .02 * g, .2)
    for bar, beat, m, dur in MT_TUNE:
        if bar >= nbars:
            continue
        at = t0 + bar * 4 * BL + beat * BL
        last = (bar, beat) == (nbars - 1, MT_TUNE[-1][1]) and nbars == 3
        fl = last_flat if last else 0.0
        dd = dur * BL * (.95 if dur < 2 else 1.0)
        T.put(marimba(midi(m - fl), min(dd, .6)), at, .12 * g, .15)
        if wh:
            T.put(whistle(m + 12 - fl, dd, .8), at, .07 * g, -.15)
        T.put(bell(midi(m + 12 - fl), 1.0) * .3, at, .04 * g, .3)


# ---------------------------------------------------------------- beds that several scenes share
CHORDS = {"C": (60, 64, 67), "F": (60, 65, 69), "G": (59, 62, 67), "Am": (60, 64, 69), "Dm": (62, 65, 69), "Em": (59, 64, 67), "Bb": (58, 62, 65), "Gm": (58, 62, 67),
          "Cm": (60, 63, 67), "Fm": (60, 65, 68), "Ab": (60, 63, 68), "Eb": (58, 63, 67), "D": (62, 66, 69)}
ROOTS = {"C": 36, "F": 41, "G": 43, "Am": 45, "Dm": 38, "Em": 40, "Bb": 34, "Gm": 43, "Cm": 36, "Fm": 41, "Ab": 44, "Eb": 39, "D": 38}


def stock(T, D, a, b, bpm=104.0, lvl=1.0, prog=("C", "G", "Am", "F"), stiff=True, mel=True):
    """Stiff, upbeat office stock music from a to b: one chord a bar (4/4), a ukulele on the offbeats, claps on 2 and 4, a kick on 1 and 3, a marimba figure on the off eighths, hats, a friendly
    pad. Quantised to the grid (no humanising): that is the joke."""
    bl = 60 / bpm
    for k, at in enumerate(grid(a, b, bpm, 1.0)):
        bar, beat = divmod(k, 4)
        ch = prog[bar % len(prog)]
        if beat == 0:
            T.put(pad([m - 12 for m in CHORDS[ch]], 4 * bl + .1, .15, .3, 1500), at, .07 * lvl)
        T.put(ubass(ROOTS[ch] + (0 if beat in (0, 1) else 7), .4, .7), at, .15 * lvl, -.1)
        if beat in (0, 2):
            D.put(kick13(.8), at, .09 * lvl, 0)
        else:
            D.put(clap(), at, .08 * lvl, .2)
        comp(T, at + bl / 2, list(CHORDS[ch]), .3, .055 * lvl, .35)
        D.put(hat(), at + bl / 2, .03 * lvl, -.2)
        if mel:
            T.put(marimba(midi(CHORDS[ch][(beat + 1) % 3] + 12), .16), at + bl / 2, .05 * lvl, -.3 + .2 * (beat % 3))
        if beat == 3:
            D.put(snap(), at + bl * .75, .04 * lvl, -.3)


def binder_bed(T, D, a, b, bpm=120.0, lvl=1.0, minor=False, prog=("C", "Am", "F", "G")):
    """The Binder jingle as a bed: every bar the four rising notes (C D E G) on marimba and glockenspiel, then a bounce: pizzicato bass on 1 and 3, a ukulele on the offbeats, a shaker.
    minor: the curdled version (C D E-flat G-flat), half a step flat, slower, a drone on D and no bounce."""
    bl = 60 / bpm
    for k, at in enumerate(grid(a, b, bpm, 1.0)):
        bar, beat = divmod(k, 4)
        ch = prog[bar % len(prog)]
        if minor:
            if beat == 0:
                bounce(T, at, BJ_MINOR, .08 * lvl, .26, .0, True)
                T.put(strings([38, 45], 4 * bl + .2, .5, .5, 4.0, 700), at, .06 * lvl)
            continue
        if beat == 0:
            bounce(T, at, BJ, .09 * lvl, bl / 4, .05)
        if beat in (0, 2):
            T.put(ubass(ROOTS[ch] + (0 if beat == 0 else 7), .35, .7), at, .13 * lvl, -.1)
        else:
            comp(T, at, list(CHORDS[ch]), .3, .05 * lvl, .35)
        D.put(shaker(), at + bl / 2, .04 * lvl, .2)
        D.put(shaker(), at, .025 * lvl, -.2)


def stutter(buf, at, ln=.08, reps=3, hold=0.0):
    """A call that stutters: repeat the `ln` seconds before `at` reps times (crushed to 5 bits), then (if hold > 0) freeze: silence for `hold` seconds. Edits the stereo buffer in place."""
    i0, n = int(at * SR), int(ln * SR)
    seg = buf[:, i0 - n:i0].copy()
    seg = np.round(seg * 24) / 24
    for j in range(reps):
        a = i0 + j * n
        m = min(n, buf.shape[1] - a)
        if m > 0:
            f = np.minimum(1, np.minimum(np.arange(m) / 60, (m - np.arange(m)) / 60))[None, :]
            buf[:, a:a + m] = seg[:, :m] * f
    if hold > 0:
        a, b = i0 + reps * n, min(buf.shape[1], i0 + reps * n + int(hold * SR))
        buf[:, a:b] = 0.0


def at_theme(T, a, b, g=1.0, bar=2.4, prog=("Cmaj9", "Dm9", "G13", "Cmaj9"), sax_on=True):
    """The Artichoke theme from a to b: a soft Rhodes on slow 9th chords, a brush on 2 and 4, a walking upright, a laid-back sax whose tune lingers on the 7th and the 9th. Too smooth. Plays into
    the track T (the caller band-limits it when it is on the TV)."""
    voic = {"Cmaj9": ((48, 55, 59, 62), (64, 67, 71, 74)), "Dm9": ((50, 57, 60, 64), (65, 69, 72, 76)), "G13": ((43, 53, 59, 64), (62, 65, 69, 71)), "A7": ((45, 55, 61, 64), (64, 67, 73, 76))}
    walk = {"Cmaj9": (36, 40, 43, 45), "Dm9": (38, 41, 45, 43), "G13": (43, 47, 50, 48), "A7": (45, 49, 52, 50)}
    tune = {"Cmaj9": ((79, 0, 1.5), (77, 1.5, .5), (76, 2, 1.0), (74, 3, 1.0)), "Dm9": ((77, 0, 1.0), (76, .5 + .5, .5), (74, 1.5, .5), (72, 2, 2.0)),
            "G13": ((74, 0, 1.0), (77, 1, .5), (76, 1.5, .5), (74, 2, 1.5), (71, 3.5, .5))}
    bl = bar / 4
    k = 0
    at = a
    while at < b - .2:
        ch = prog[k % len(prog)]
        T.put(epiano(midi(voic[ch][0][0]), bar * .95, .55), at, .07 * g, -.2)
        for j, m in enumerate(voic[ch][1]):
            T.put(epiano(midi(m), bar * .9, .5), at + .02 * j, .05 * g, .2)
        T.put(pad(list(voic[ch][0][1:]), bar * .95, .4, .5, 1100), at, .035 * g)
        for s in range(4):
            T.put(ubass(walk[ch][s], bl * .9, .65), at + s * bl, .14 * g, -.1)
            if s % 2 == 1:
                T.put(brush(.18), at + s * bl, .045 * g, .15)
        if sax_on and ch in tune:
            for m, off, dd in tune[ch]:
                if at + off * bl < b - .15:
                    T.put(sax(m, dd * bl * 1.05, .65), at + off * bl, .105 * g, .1)
        at += bar
        k += 1


def cough():
    """A far-off cough, if the registry has one (the mixer's own), low-passed so it is in the next room."""
    import build_audio as BA
    fn = BA.SFX.get("cough")
    if fn is None:
        return None
    c = np.asarray(fn())
    return lp(c, 2200, 2) * 0.6


# ================================================================ title
def cue_title15(T, t0, d, beats, D):
    """The Merge theme (6.6 s). 0.2 to 2.3: bar 1, the arpeggio C E G C G E G C in eighths on a marimba and a glockenspiel under a swelling pad, claps on 2 and 4, a snare roll that climbs,
    the last beat on F; at 2.30 (the merge) the resolution F to C: a brass and string C major with a ninth, a timpani and a kick, a crash and three bells (C7, E7, G7); bar 2 (2.3 to 4.4) is the
    tune over C and G (marimba and whistle, ukulele, bass, claps); at 4.0 (the text ding) a glockenspiel and harp shimmer climbs C6 to E7; a held C major chord fades to the cut."""
    a = t0 + .2
    land = t0 + 2.3
    mt_bar1(T, D, a)
    T.put(riser(2.0, 400, 5000, .4), a + .1, .05, 0)
    T.put(brass([48, 55, 60, 64, 67, 72, 74], 1.7, .02, .8, 2500), land, .095, 0)
    T.put(strings([48, 55, 60, 64, 67, 72, 76], 3.4, .1, 1.8, 5.0, 2800), land, .12)
    for k, (m, g) in enumerate(((96, .075), (100, .065), (103, .06))):
        T.put(bell(midi(m), 1.6) * .6, land + .03 * k, g, -.35 + .35 * k)
    T.put(timp(65, 1.4), land, .2)
    D.put(kick13(1.0), land, .15, 0)
    D.put(crash(1.8) * .7, land, .07, .1)
    mt_tune(T, D, land, 1)
    for k, m in enumerate((84, 88, 91, 96, 100)):
        T.put(celesta(m, 1.2, .8), t0 + 3.98 + .045 * k, .055, -.4 + .2 * k)
        T.put(harp(m - 12, 1.6, .6), t0 + 4.0 + .05 * k, .06, -.3 + .15 * k)
    T.put(pad([48, 55, 60, 64, 67], 2.5, .3, 1.2, 1700), t0 + 4.2, .09)
    T.put(whistle(88, 1.4, .7, .1, .5), t0 + 4.4, .06, 0)
    T.fade(t0 + d - .8, t0 + d, 1, 0)
    D.fade(t0 + d - .8, t0 + d, 1, 0)


# ================================================================ announce
def cue_announce15(T, t0, d, beats, D):
    """3:00 PM, the all-hands (25.2 s). The call connects (0.4: a soft pad swell), then stiff, upbeat office stock music under Melon (0.9 to 5.8 s: ukulele on the offbeats, claps, a quantised
    marimba), which a 'record-softener' drops as Mr. Artichoke appears (5.86): the Artichoke theme, a Rhodes, a brush, an upright and a sax that is too smooth, band-limited like the call
    (260 Hz to 3.6 kHz). When the call glitches (10.86) the music stutters with it (the last 80 ms three times) and freezes; on 'You're frozen.' the score is dead until Binder (11.36
    to 13.0: a room tone, a far-off cough at 12.75). The Binder jingle (13.05): four rising notes over a bouncy bed, under his offer; on 'Great! I'll help.' (16.51) it curdles (flat,
    slow, a drone on D), a quiet snare roll climbs from 16.05 into the warning dialog (16.95) and is cut by a timpani; 17.6 to 22.6 the bright jingle bed returns, stiffer. 'Sure!' (22.67)
    starts a reversed cymbal and a riser; the merge (23.24) is a sweeping hit: F to C, brass and strings, timpani, crash, bells, a harp glissando."""
    a1, ar1, ar2, m1, b1, s2, b2, l2, b4, c1, en = (beats[k] for k in ("a1", "ar1", "ar2", "m1", "b1", "s2", "b2", "l2", "b4", "c1", "end"))
    T.put(pad([48, 55, 60, 64], 1.2, .4, .5, 1400), t0 + .4, .05)
    stock(T, D, t0 + .9, ar1[0] - .1, 104, .9)
    for j, m in enumerate((79, 84, 88)):
        T.put(celesta(m, 1.0, .7), t0 + 5.55 + .1 * j, .05, -.2 + .2 * j)
    T.fade(ar1[0] - .35, ar1[0] - .05, 1, 0)
    D.fade(ar1[0] - .35, ar1[0] - .05, 1, 0)
    V = Track(T.N)                                                                                    # the Artichoke theme, on the TV
    at_theme(V, ar1[0] - .1, ar2[1] + .2, 1.0)
    i0, i1 = int((ar1[0] - .3) * SR), int((ar2[1] + .6) * SR)
    V.buf[:, i0:i1] = callfx(V.buf[:, i0:i1])
    stutter(V.buf, t0 + 10.861, .08, 3, hold=.8)
    T.buf += V.buf * 1.0
    MUTES.append((t0 + 11.36, t0 + 12.55, .04))
    cf = cough()
    if cf is not None:
        D.put(cf, t0 + 12.75, .09, .5)
    D.put(tick(), t0 + 12.45, .03, .4)                                                                # the spinner's frame
    binder_bed(T, D, t0 + 13.1, b2[0] - .05, 120, 1.0)                                                # Binder, cheerful
    binder_bed(T, D, b2[0] - .02, t0 + 17.0, 90, 1.0, minor=True)                                     # curdled on 'Great! I'll help.'
    T.put(strings([38, 45, 50], 1.4, .6, .5, 4.5, 700), b2[0], .05)
    D.put(roll(150, .9, 26), t0 + 16.05, .035, 0)
    D.put(timp(70, 1.0), t0 + 16.95, .1, 0)
    MUTES.append((t0 + 17.0, t0 + 17.52, .03))
    binder_bed(T, D, t0 + 17.6, t0 + 22.55, 112, .8, prog=("C", "Am", "F", "G"))
    land = t0 + 23.243
    D.put(revcym(.7), land - .7, .06, 0)
    T.put(riser(.9, 500, 6000, .4), land - .9, .04, 0)
    T.put(pad([53, 57, 60, 65], .5, .1, .15, 1700), land - .5, .08)
    T.put(brass([48, 55, 60, 64, 67, 72, 74], 1.6, .02, .7, 2500), land, .1, 0)
    T.put(strings([48, 55, 60, 64, 67, 72, 76], 3.0, .1, 1.5, 5.0, 2800), land, .12)
    T.put(timp(65, 1.4), land, .2)
    D.put(kick13(1.0), land, .14, 0)
    D.put(crash(1.8) * .7, land, .08, .1)
    for k, m in enumerate((96, 100, 103, 108)):
        T.put(bell(midi(m), 1.6) * .6, land + .04 * k, .06, -.4 + .27 * k)
    for k, m in enumerate((48, 55, 60, 64, 67, 72, 76, 79, 84, 88)):
        T.put(harp(m, 1.6, .65), land + .03 * k, .05, -.5 + .1 * k)
    T.put(whistle(88, 1.2, .7, .08, .4), land + .1, .05, .2)
    T.fade(t0 + d - .9, t0 + d, 1, 0)
    D.fade(t0 + d - .9, t0 + d, 1, 0)


# ================================================================ dock
SALAD = (53, 57, 60, 57)        # the salad's motif (bassoon, F): leafy, upright
PIZZA = (69, 72, 76, 72)        # the pizza's (marimba, A minor): a tarantella triplet


def march(T, D, a, b, bpm=112.0, lvl=1.0, prog=("F", "C", "F", "C")):
    """The salad-versus-pizza march: a tuba on 1 and 3 (root, then fifth), pizzicato chords on 2 and 4, a woodblock on the offbeats, a brush; a comic oom-pah."""
    bl = 60 / bpm
    for k, at in enumerate(grid(a, b, bpm, 1.0)):
        bar, beat = divmod(k, 4)
        ch = prog[bar % len(prog)]
        if beat in (0, 2):
            T.put(tuba(ROOTS[ch] + (0 if beat == 0 else 7) + 12, bl * .8), at, .16 * lvl, -.1)
        else:
            for m in CHORDS[ch]:
                T.put(pizz(midi(m), .2), at, .05 * lvl, .2)
        D.put(woodblock(), at + bl / 2, .04 * lvl, .3 if beat % 2 else -.3)
        if beat in (1, 3):
            T.put(brush(.2), at, .04 * lvl, 0)


def minuet(T, D, a, bars, bl=.5556, stumble=None, lvl=1.0):
    """A polite string-quartet minuet in C (3/4): violin I and II answer each other (the tune is E5 G5 C6 / B5 A5 G5 / F5 A5 D6 / C6 B5 A5), a viola-ish second violin on the off beats, a
    cello on the downbeat; stumble: from this bar on the beats come late and uneven, the way two people at a door do."""
    mel = ((76, 79, 84), (83, 81, 79), (77, 81, 86), (84, 83, 81), (79, 83, 86), (84, 79, 76))
    low = ((48, 55, 52), (43, 50, 47), (41, 48, 45), (48, 55, 52), (43, 50, 47), (48, 55, 52))
    for b in range(bars):
        bt = a + b * 3 * bl
        late = 0.0
        for k in range(3):
            if stumble is not None and b >= stumble:
                late = [0, .07, .21][k] * (b - stumble + 1)
            at = bt + k * bl + late
            fn = violin if b % 2 == 0 else (lambda m, d, **kw: violin(m, d, vib=.004, **kw))
            T.put(spic(mel[b % 6][k], bl * .9), at, .07 * lvl, -.3 if b % 2 == 0 else .3)
            if k > 0:
                T.put(spic(low[b % 6][k] + 12, bl * .6), at, .04 * lvl, .3 if b % 2 == 0 else -.3)
            if k == 0:
                T.put(cello(low[b % 6][0], bl * 1.6, .8), at, .08 * lvl, 0)
                D.put(pizz(midi(low[b % 6][0] + 12), .3), at, .05 * lvl, 0)


def cue_dock15(T, t0, d, beats, D):
    """3:20 PM, the merge (32.4 s). HEAVY. 0.2 to 2.2: a low brass drone (F1, C2, F2) and a taiko heartbeat for the crane, and a tiny cheerful Binder jingle on 'Merging cells!'. The lowering
    (2.22 to 5.82): a rising riser, two string notes that climb two octaves (C2 to C4 and G2 to G4), a timpani roll that gets louder, a taiko that speeds up, a low brass swell, a
    trembling high harmonic at the creak (3.42); all of it peaks AT the impact (5.82) and then the score is gone: a dead drop-out through the impact's tail until 'Welcome to the family!'
    (9.0). 9.12 to 19.7: the comic march of salad and pizza (a tuba and pizzicato), the salad motif on a bassoon (F A C A) on 'salad' and 'vegetable', the pizza motif on a marimba tarantella
    (A C E C) on 'pizza', and Tomato's pizzicato (C E G, then C E-flat G, alternating) on her lines. 19.75 to 25.9: the zipper merge is a polite string-quartet minuet in 3/4 that slips behind
    the beat on the second 'After you.' and stops dead on the bonk (25.9); stars (25.95) are a celesta circling; 'That's a merge.' gets one pizzicato; Onion's clarinet sob (G F D, the last
    one trembling and sliding) rises under the end with low strings; the sting (31.43) is the sfx's."""
    o, b1, lo, st, a1, br1, a2, br2, t1, l0, t1b, l1, m1, ca1, m2, ca2, bk, l2, o1, o2, en = (beats[k] for k in ("open", "b1", "lower", "settle", "a1", "br1", "a2", "br2", "t1", "l0", "t1b", "l1", "m1", "ca1", "m2", "ca2", "bonk", "l2", "o1", "o2", "end"))
    T.put(brass([29, 36, 41], 2.0, .3, .5, 450), t0 + .2, .12, 0)
    for k in range(3):
        D.put(taiko(55, .8), t0 + .25 + k * .5, .15, 0)
    bounce(T, t0 + 1.32, BJ, .06, .1, .1)
    land = t0 + 5.82
    T.put(riser(3.6, 150, 5200, .5), t0 + 2.22, .07, 0)
    T.put(rising(36, 60, 3.6), t0 + 2.22, .06, -.3)
    T.put(rising(43, 67, 3.6), t0 + 2.22, .05, .3)
    T.put(brass([29, 36], 3.6, 1.6, .05, 500, swell=1.2), t0 + 2.22, .1, 0)
    D.put(roll(55, 3.55, 44) * 1.0, t0 + 2.22, .12, 0)
    t = t0 + 2.22
    iv = .62
    while t < land - .1:
        D.put(taiko(55, .6), t, .14 + .06 * (t - t0) / 6, 0)
        t += iv
        iv = max(.2, iv * .9)
    T.put(glass(100, 2.2, .5, .6), t0 + 3.42, .03, .4)
    T.fade(land - .5, land - .09, 1, 1.5)
    MUTES.append((land - .085, t0 + 9.0, .008))                                                        # a breath of near-silence just before the hit, then the drop-out
    march(T, D, a1[0], l1[0] - .03, 112, 1.0)
    for j, m in enumerate(SALAD):
        T.put(bassoon(m, .2, .9), br1[0] + .05 + j * .15, .12, -.3)
        T.put(bassoon(m, .2, .8), W("br2", "vegetable") - .05 + j * .15, .11, -.3)
    for j, m in enumerate(PIZZA * 2):
        T.put(marimba(midi(m), .12), a2[0] + .05 + j * .09, .09, .35)
    T.put(tuba(40, .6), W("br2", "vegetable") + .3, .15, 0)
    T.put(slide_brass(50, 43, .5, 700), W("br2", "vegetable") + .35, .06, 0)
    for k, at in enumerate(grid(t1[0] + .05, l1[0] - .1, 120, 1.0)):                      # Tomato: indecisive
        ch = TP_MAJ if k % 2 == 0 else TP_MIN
        for j, m in enumerate(ch):
            T.put(pizz(midi(m + 12), .18), at + j * .05, .08, .3)
    minuet(T, D, l1[0], 6, stumble=3)
    mn = t0 + 25.9
    T.gate(mn - .02, t0 + 26.55, 0.0, .01)
    D.gate(mn - .02, t0 + 26.55, 0.0, .01)
    D.put(woodblock(), mn, .12, .1)
    for j, m in enumerate((91, 96, 100, 98, 93)):
        T.put(celesta(m, .8, .6), t0 + 25.97 + j * .07, .04, -.6 + .3 * j)
    D.put(pizz(midi(52), .3), W("l2", "merge") + .15, .1, 0)
    T.put(strings([43, 50, 55], 4.2, .8, .8, 4.5, 800), o1[0], .06)
    T.put(sob_clar(79, 74, .55, .7), o1[1] - .2, .09, -.3)
    T.put(sob_clar(77, 72, .6, .7), o2[0] - .08, .07, -.3)
    T.put(sob_clar(74, 62, 1.0, .75, 8.5), o2[1] - .15, .1, -.3)
    T.fade(t0 + d - 1.0, t0 + d, 1, 0)
    D.fade(t0 + d - 1.0, t0 + d, 1, 0)


def fanfare(T, D, at, g=1.0, notes=(72, 72, 72, 79), durs=(.14, .14, .14, .7), step=.17, pomp=1.0):
    """A pompous little brass fanfare: ta-ta-ta-TAAA on trumpets and horns over a tuba, a timpani and a cymbal on the long note."""
    t = at
    for j, (m, dd) in enumerate(zip(notes, durs)):
        T.put(trumpet(m, dd, .95), t, .075 * g, .2)
        T.put(trumpet(m - 12, dd, .85), t, .045 * g, -.2)
        T.put(horn(m - 12, dd, .85, a=.02, r=.06), t, .05 * g, 0)
        t += step if j < len(notes) - 2 else step * 1.1
    T.put(tuba(notes[-1] - 24, durs[-1], ), at + step * (len(notes) - 1), .14 * g, 0)
    D.put(timp(98, 1.0), at + step * (len(notes) - 1), .12 * g * pomp, 0)
    D.put(crash(1.4) * .6, at + step * (len(notes) - 1), .05 * g * pomp, .2)


# ================================================================ model1
def cue_model1_15(T, t0, d, beats, D):
    """3:45 PM, the model (32.55 s). The consultants' office (0.3 to 4.5): stiff stock music in D minor (Dm G C Am) and Tomato's pizzicato. 'The Executive Suite' (3.4) gets a pompous brass
    fanfare, ta-ta-ta-TAAA with a tuba, a timpani and a cymbal; Binder's four rising notes on 'Inserting row!'. The row goes in (5.5 to 7.2): low strings tremolo on an A pedal and a timpani swell;
    the SINK (7.22) is a downward glissando, a trombone from G4 to G2 over 1.6 s with a cello sliding under it, and a bass drum for the low thump at 9.0 (the tower stops); then nothing until
    'Where did the lobby go?'. The questions (9.97 to 15.0) are a slow pizzicato bass and Tomato's alternating major and minor chords, a woodblock on 'window'. Remove Duplicates (15.03): a
    xylophone run (a quick C major scale) lands on the first poof (19.19) and each of the five poofs gets a tiny pizzicato blip and a xylophone note, falling as the nurses go. The synergy line
    (21.74) is a gleeful fanfare, cut off dead at the end of the line (23.95). The seniority joke (24 to 31.4): a low drone on C, a single tuba note on 'Not anymore.', a bell on 'one.' and a
    brass swell under 'The one with seniority.'; the sting (31.7) is the sfx's."""
    o, o1, t1, b1, ins, m1, t2, s1, t3, o2, b2, van, b3, m2, t4a, l1, t4, l2, t5, en = (beats[k] for k in ("open", "o1", "t1", "b1", "insert", "m1", "t2", "s1", "t3", "o2", "b2", "vanish", "b3", "m2", "t4a", "l1", "t4", "l2", "t5", "end"))
    stock(T, D, t0 + .35, b1[0] - .05, 100, .7, prog=("Dm", "G", "C", "Am"))
    for j, ch in enumerate((TP_MAJ, TP_MIN, TP_MAJ, TP_MIN)):
        for q, m in enumerate(ch):
            T.put(pizz(midi(m + 12), .16), o1[1] + .12 + j * .3 + q * .05, .06, .3)
    fanfare(T, D, W("t1", "Executive") - .05, .5)
    bounce(T, b1[0] + .05, BJ, .07, .13, .1)
    T.put(strings([33, 40, 45], 3.0, .8, .8, 8.0, 900) * 1.0, t0 + 5.52, .08)
    D.put(roll(55, 1.6, 30), t0 + 5.52, .08, 0)
    sk = t0 + 7.219
    T.put(slide_brass(67, 43, 1.6, 900), sk, .12, 0)
    T.put(gliss_cello(55, 31, 1.5, .1, .4), sk, .09, -.2)
    T.put(sub_swell(60, 35, 1.7) * .8, sk, .08, 0)
    D.put(bdrum(1.0, 1.0), t0 + 9.0, .2, 0)
    T.gate(t0 + 9.35, m1[0] - .05, .0, .05)
    D.gate(t0 + 9.35, m1[0] - .05, .0, .05)
    for k, at in enumerate(grid(m1[0] + .1, t3[1], 66, 1.0)):
        T.put(ubass((38, 45, 43, 41)[k % 4], .5, .7), at, .12, -.1)
        if k % 2:
            for q, m in enumerate(TP_MIN if k % 4 == 3 else TP_MAJ):
                T.put(pizz(midi(m + 12), .15), at + q * .05, .045, .3)
    D.put(woodblock(), W("t3", "window") + .05, .1, .2)
    xr = (72, 74, 76, 77, 79, 81, 83, 84, 86, 88, 89, 91)
    for j, m in enumerate(xr):
        T.put(xylo(m, .16, .8), t0 + 18.95 - (len(xr) - j) * .06, .08, -.5 + .09 * j)
    for j, at in enumerate((19.187, 19.587, 19.987, 20.387, 20.787)):
        T.put(pizz(midi(84 - 3 * j), .12), t0 + at + .02, .07, (-.4, .3, -.2, .4, 0)[j])
        T.put(xylo(96 - 4 * j, .2, .8), t0 + at + .06, .06, (-.4, .3, -.2, .4, 0)[j])
    D.put(tick(), t0 + 21.287, .05, 0)
    sy = W("b3", "synergy") - .08
    fanfare(T, D, W("b3", "Four") + .02, .8, (72, 76, 79, 84), (.12, .12, .12, .5), .15)
    fanfare(T, D, sy, 1.1, (79, 79, 84, 88), (.1, .1, .1, .6), .14)
    T.gate(b3[1] - .01, m2[0] - .03, 0.0, .008)
    D.gate(b3[1] - .01, m2[0] - .03, 0.0, .008)
    T.put(strings([36, 43, 48], 7.0, 1.2, 1.2, 4.0, 700), m2[1] + .3, .06)
    T.put(tuba(36, .7), t4a[0] + .12, .13, 0)
    T.put(bell(midi(91), 2.0) * .6, W("t4", "one") + .05, .06, .2)
    T.put(brass([36, 43, 48, 51], 1.5, .5, .5, 800, swell=.6), t5[0] + .1, .08, 0)
    T.put(sob_clar(76, 70, .7, .6), l2[1] + .05, .05, -.3)
    T.fade(t0 + d - .9, t0 + d, 1, 0)
    D.fade(t0 + d - .9, t0 + d, 1, 0)


# ================================================================ model2
def cue_model2_15(T, t0, d, beats, D):
    """4:20 PM, the fill (23.5 s). Tomato's efficient office bed in D minor (1.0 to 5.7) with her pizzicato on 'Efficiency.'; Binder's four notes on 'Fill down!'. The click (6.87) starts the
    fill: a rising arpeggio ripple on a C major pentatonic, 16ths at 150 bpm, climbing three octaves from 7.0 and gaining layers (marimba, then celesta, then bells and a glockenspiel, then
    strings, then brass) and a snare roll, which crowds into a WALL OF SOUND at the crowd (10.37): tutti brass and strings, a choir, a timpani roll, a crash. It is cut dead at 11.27: for
    'I'm one person.' and 'I'm tired.' (11.3 to 16.2) there is near-silence (a drone at -40 dB). The lookup (16.2): Binder's jingle, a pizzicato tick under the typing; the error (18.2) is a
    muted trumpet falling G4 to E-flat4; 'I never am.' (19.34) gets the Episode 14 callback: a horn, E D C (the State's answer), alone and soft; Onion's clarinet sob under 'Then who are they?'
    and a bright stab on 'Unassigned!'."""
    t1, o1, t2, b1, clones, s1, ch1, t3, ch2, b2, lk, b3, s2, o2, b4, en = (beats[k] for k in ("t1", "o1", "t2", "b1", "clones", "s1", "ch1", "t3", "ch2", "b2", "lookup", "b3", "s2", "o2", "b4", "end"))
    stock(T, D, t0 + 1.0, b1[0] - .05, 112, .6, prog=("Dm", "G", "C", "Am"))
    for j, ch in enumerate((TP_MAJ, TP_MIN)):
        for q, m in enumerate(ch):
            T.put(pizz(midi(m + 12), .16), t2[0] + .1 + j * .3 + q * .05, .07, .3)
    bounce(T, b1[0] + .3, BJ, .08, .11, .1)
    pent = (0, 2, 4, 7, 9)
    a0, a1 = t0 + 7.0, t0 + 10.37
    n16 = grid(a0, a1, 150, .25)
    for k, at in enumerate(n16):
        u = k / len(n16)
        m = 60 + 12 * (k // 5 // 2 * 0) + pent[k % 5] + 12 * min(3, (k // 5) * 3 // max(1, len(n16) // 5))
        T.put(marimba(midi(m), .14), at, .07, -.5 + .5 * (k % 3))
        if u > .25:
            T.put(celesta(m + 12, .5, .7), at, .05, .4 - .2 * (k % 3))
        if u > .5:
            T.put(bell(midi(m + 24), .6) * .5, at, .04, .0)
        if u > .65 and k % 2 == 0:
            T.put(harp(m, 1.0, .7), at, .05, -.2)
    T.put(strings([48, 55, 60, 64], 3.4, 1.4, .1, 5.0, 2000), a0, .09)
    T.put(riser(3.3, 300, 6000, .5), a0, .06, 0)
    D.put(roll(160, 3.2, 70), a0 + .1, .06, 0)
    wl = t0 + 10.369
    T.put(brass([36, 43, 48, 52, 55, 60, 64, 67, 72], 1.0, .03, .4, 2800), wl, .12, 0)
    T.put(strings([48, 55, 60, 64, 67, 72, 76, 79], 1.0, .03, .3, 5.0, 3500), wl, .14)
    T.put(choir([60, 64, 67, 72], 1.0, "a", .05, .3), wl, .1)
    D.put(roll(60, .9, 36), wl, .14, 0)
    D.put(crash(1.4), wl, .09, .1)
    T.gate(t0 + 11.27, t0 + 11.40, 0.0, .01)
    D.gate(t0 + 11.27, t0 + 11.40, 0.0, .01)
    MUTES.append((t0 + 11.27, t0 + 16.18, .01))
    bounce(T, b2[0] + .05, BJ, .06, .12, .1)
    D.put(tick(), lk[0] + .2, .04, 0)
    T.put(mtrumpet(67, .22, .9), t0 + 18.2, .1, .1)
    T.put(mtrumpet(63, .5, .9), t0 + 18.36, .1, .1)
    for j, m in enumerate((64, 62, 60)):
        T.put(horn(m, .55 if j < 2 else 1.4, .6, a=.1, r=.4), s2[0] + .12 + j * .38, .1, .1)
    T.put(sob_clar(76, 71, .7, .6), o2[0] + .15, .06, -.3)
    T.put(brass([60, 64, 67, 72], .25, .01, .1, 2400), b4[0] + .05, .07, 0)
    T.put(marimba(midi(96), .3), b4[0] + .05, .08, .2)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


def accel_roll(D, a, b, r0, r1, g0, g1, pan=0.0):
    """A snare roll whose stroke rate climbs from r0 to r1 a second and whose level climbs from g0 to g1 (a counter that climbs)."""
    t = a
    while t < b:
        u = (t - a) / (b - a)
        D.put(snare(.1), t, g0 + (g1 - g0) * u ** 1.3, pan + .15 * np.sin(t * 40))
        t += 1 / (r0 + (r1 - r0) * u ** 1.5)


def stab(T, D, at, notes=(48, 51, 55, 60), g=.1, d=.2, big=False):
    """A staccato brass stab (a minor chord by default) with a hit of a snare under it; big: a timpani and a cymbal choke."""
    T.put(brass(list(notes), d, .008, .08, 2200), at, g, 0)
    D.put(snare13(.9), at, g * .5, 0)
    if big:
        D.put(timp(70, .9), at, .14, 0)
        D.put(crash(.5) * .6, at, .05, .1)


# ================================================================ replace
def cue_replace15(T, t0, d, beats, D):
    """5:05 PM, find and replace (23.3 s). Bureaucracy (0.2 to 7.7): a dry pizzicato ostinato in A minor and a woodblock at 90 bpm; Onion's clarinet sob (7.2) on 'Compliance will decide.'
    Binder's typing (7.73 to 9.85) is a manic typing rhythm: sixteenth woodblocks at 150 bpm with a pizzicato bass, a bell at the end of the line. 'Don't.' is a hole (9.9 to 10.5), 'Replace
    all!' a stab. The click (11.06) starts the climb: the six flips (11.47 ... 13.82) are a rising percussion run (a tom and a marimba climbing C3 to A3 on each flip), the counter is a snare
    roll that goes from 7 to 40 strokes a second and gets louder for four seconds under a reversed cymbal, and the dialog (15.12) is the top of it: a timpani and a cut. 'Two hundred fourteen
    replacements!' (15.87) is a fanfare that lands in the minor. Then call and response: each question ('My break?', 'Mine?', 'How long is pending?') gets two climbing pizzicato notes
    and each 'Pending!' (18.42, 19.73, 21.45) a staccato C minor brass stab, the last one big (a timpani and a choked cymbal); the sting (22.33) is the sfx's."""
    o1, t1, t2, o2, b1, s1, b2, rp, b3, m1, b4, l1, b5, s2, b6, en = (beats[k] for k in ("o1", "t1", "t2", "o2", "b1", "s1", "b2", "replace", "b3", "m1", "b4", "l1", "b5", "s2", "b6", "end"))
    for k, at in enumerate(grid(t0 + .2, b1[0] - .05, 90, .5)):
        T.put(pizz(midi((45, 52, 48, 52)[k % 4]), .16), at, .08, -.2 if k % 2 else .2)
        if k % 2 == 0:
            D.put(woodblock(), at, .03, .3)
    T.put(strings([45, 52, 57], 3.2, .8, .8, 4.5, 900), t1[0], .05)
    T.put(sob_clar(79, 74, .6, .6), o2[1] - .35, .06, -.3)
    wl = grid(b1[0] + .05, b1[1] - .05, 150, .25)
    for k, at in enumerate(wl):
        D.put(woodblock(), at, .05 if k % 4 == 0 else .03, .3 if k % 2 else -.3)
        if k % 8 == 0:
            D.put(pizz(midi(45 if (k // 8) % 2 == 0 else 52), .2), at, .13, 0)
    D.put(bell(midi(96), 1.2) * .6, b1[1], .05, .3)
    T.gate(s1[0] - .05, b2[0] - .03, 0.0, .01)
    D.gate(s1[0] - .05, b2[0] - .03, 0.0, .01)
    stab(T, D, b2[0] + .02, (48, 51, 55, 60), .09, .25)
    for k, (fa, m) in enumerate(zip((11.474, 11.874, 12.324, 12.824, 13.324, 13.824), (48, 50, 52, 55, 57, 60))):
        D.put(tom(midi(m - 12), .3), t0 + fa, .09, -.4 + .15 * k)
        T.put(marimba(midi(m + 12), .2), t0 + fa, .08, -.3 + .12 * k)
        D.put(woodblock(), t0 + fa + .02, .05, .3)
    accel_roll(D, t0 + 11.524, t0 + 15.3, 7, 40, .015, .1)
    D.put(revcym(2.4), t0 + 12.7, .07, 0)
    T.put(riser(3.6, 200, 6500, .5), t0 + 11.5, .05, 0)
    D.put(timp(70, 1.0), t0 + 15.124, .16, 0)
    T.gate(t0 + 15.3, b3[0] - .03, 0.0, .01)
    D.gate(t0 + 15.3, b3[0] - .03, 0.0, .01)
    fanfare(T, D, b3[0] + .02, 1.0, (72, 76, 79, 84), (.14, .14, .14, .4), .16)
    T.put(brass([48, 51, 55, 60], .8, .02, .4, 1500), W("b3", "replacements") + .3, .08, 0)
    for line, bw in ((m1, b4), (l1, b5), (s2, b6)):
        for j, m in enumerate((67, 70)):
            T.put(pizz(midi(m), .18), line[0] + .1 + j * .2, .09, .3)
        stab(T, D, bw[0] + .03, (48, 51, 55, 60), .1, .22, big=(bw is b6))
    T.put(brass([36, 43, 48, 51], 1.0, .3, .5, 700), b6[1] + .05, .07, 0)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ close
def cue_close15(T, t0, d, beats, D):
    """6:00 PM, the closing (26.1 s). The banner (0.3 to 1.9): a big hopeful orchestral swell that is slightly too much: strings tutti and horns rising from nothing, a timpani roll, a choir on
    'ah', a reversed cymbal and a glockenspiel run, peaking on the banner's snap (1.35) with a harp glissando and a triangle-bright C major chord, then easing off under 'Are we a salad now?'.
    The salad (1.9 to 12.4): the march (tuba and pizzicato) in F and, on 'Better together. Tossed!' (6.32), the Binder jingle; Onion's clarinet sob on 'Corporate.' (5.86); Melon's stiff office
    music; a pizzicato on 'Counted.'. Mr. Artichoke (12.57): his theme, smooth, with a tiny celesta heartbeat (lub-dub, E6, C6) from 14.17 on 'Somewhere in here.'; the undo (15.5) cuts it off
    dead, a bassoon 'womp' on the error (16.5). The last offer (19.1): the Binder jingle in the minor, slow and flat, over a drone on D that swells; on 'Great! I'll help.' (22.3) the drone
    deepens; the pending stinger and the sting (23.44, 23.84) are the sfx's, and the score is a last low note that sinks to nothing."""
    o, l1, t1, m1, o1, b1, a1, o2, t2, ar1, undo, b2, s1, b3, s2, b4, en = (beats[k] for k in ("open", "l1", "t1", "m1", "o1", "b1", "a1", "o2", "t2", "ar1", "undo", "b2", "s1", "b3", "s2", "b4", "end"))
    pk = t0 + 1.35
    T.put(strings([36, 43, 48, 52, 55, 60, 64, 67, 72, 76], 1.4, 1.0, .5, 5.0, 3000), t0 + .3, .13)
    T.put(brass([43, 48, 52, 55, 60, 64], 1.4, .8, .4, 2400, swell=.8), t0 + .3, .09, 0)
    T.put(choir([60, 64, 67, 72], 1.6, "a", .9, .6), t0 + .35, .08)
    D.put(roll(60, 1.0, 36) * 1.2, t0 + .3, .1, 0)
    D.put(revcym(.9), t0 + .45, .07, 0)
    for k, m in enumerate((84, 86, 88, 91, 93, 96)):
        T.put(bell(midi(m), 1.0) * .5, t0 + .75 + k * .09, .05, -.5 + .2 * k)
    D.put(crash(1.8), pk, .09, .1)
    D.put(timp(65, 1.4), pk, .2, 0)
    T.put(brass([48, 55, 60, 64, 67, 72, 76], 1.2, .02, .5, 2600), pk, .11, 0)
    for k, m in enumerate((48, 55, 60, 64, 67, 72, 76, 79, 84, 88)):
        T.put(harp(m, 1.6, .7), pk + .03 * k, .05, -.5 + .1 * k)
    T.put(bell(midi(103), 1.4) * .6, pk + .02, .05, .3)
    march(T, D, l1[0], ar1[0] - .1, 108, .75)
    bounce(T, b1[0] + .03, BJ, .08, .13, .1)
    for j, m in enumerate((72, 76, 79, 84)):
        T.put(whistle(m + 12, .22, .8), b1[0] + .62 + j * .11, .05, -.2)
        T.put(bell(midi(m + 24), .8) * .4, b1[0] + .62 + j * .11, .03, .3)
    T.put(sob_clar(79, 74, .55, .7), W("o1", "Corporate") + .5, .06, -.3)
    D.put(woodblock(), t2[0] + .05, .1, .2)
    D.put(pizz(midi(52), .3), t2[0] + .05, .1, 0)
    for ln_, ch_ in ((t1, TP_MAJ), (t2, TP_MIN)):
        for q, m in enumerate(ch_):
            T.put(pizz(midi(m + 12), .16), ln_[1] + .05 + q * .06, .06, .3)
    V = Track(T.N)
    at_theme(V, ar1[0] - .02, t0 + 15.49, 1.0, prog=("Cmaj9", "Dm9", "G13", "Cmaj9"))
    i0, i1 = int((ar1[0] - .1) * SR), int((t0 + 15.6) * SR)
    V.buf[:, i0:i1] = callfx(V.buf[:, i0:i1], 200, 5200)
    T.buf += V.buf
    for k in range(4):
        T.put(celesta(88, .5, .6), t0 + 14.165 + k * .4, .035, .3)
        T.put(celesta(84, .4, .5), t0 + 14.165 + k * .4 + .14, .025, .3)
    T.gate(t0 + 15.495, t0 + 15.6, 0.0, .01)
    D.put(revcym(.35, 3000, 9000), t0 + 15.15, .05, 0)
    MUTES.append((t0 + 15.495, t0 + 16.4, .005))
    T.put(bassoon(36, .6, .8), t0 + 16.5, .13, 0)
    T.put(bassoon(34, .9, .8), t0 + 16.75, .1, 0)
    T.put(strings([38, 45, 50], 6.0, 1.5, .8, 3.5, 600), b3[0] - .2, .06)
    binder_bed(T, D, b3[0] - .05, t0 + 23.1, 76, .8, minor=True)
    T.put(brass([26, 33, 38, 41], 3.2, 1.5, 1.5, 400, swell=.5), t0 + 20.5, .1, 0)
    T.put(sub_swell(40, 36, 3.0) * .6, t0 + 20.4, .07, 0)
    T.put(bell(midi(100), 1.5) * .5, t0 + 22.9, .03, .2)
    T.put(brass([26, 33], 3.2, .8, 1.9, 380), t0 + 23.3, .08, 0)
    T.fade(t0 + d - 1.2, t0 + d, 1, 0)
    D.fade(t0 + d - 1.2, t0 + d, 1, 0)


# ================================================================ end
def cue_end15(T, t0, d, beats, D):
    """The end card (8.0 s): the Merge theme reprised in full band, cheerful again. Bar 1 (0.1 to 2.2) is the title's arpeggio with a fuller band (a kick and snaps) and the resolution F to C
    on 2.2 (brass, strings, timpani, crash, bells); bars 2 to 4 are the tune over C G / Am F / G C on a marimba and a whistle, a ukulele, a pizzicato bass, a kick, claps and hats, a pad. The
    typing (1.1) and the click (3.1) are the sfx's; the stamp (4.0) gets a bass drum. The last held note (the E at 6.5) is 45 cents flat and sags: cheerful, but one note off."""
    mt_bar1(T, D, t0 + .1, 1.1)
    land = t0 + .1 + 2.1
    T.put(brass([48, 55, 60, 64, 67, 72, 74], 1.7, .02, .8, 2500), land, .09, 0)
    T.put(strings([48, 55, 60, 64, 67, 72, 76], 3.6, .1, 1.6, 5.0, 2800), land, .11)
    for k, (m, g) in enumerate(((96, .07), (100, .06), (103, .055))):
        T.put(bell(midi(m), 1.6) * .6, land + .03 * k, g, -.35 + .35 * k)
    T.put(timp(65, 1.4), land, .18)
    D.put(kick13(1.0), land, .14, 0)
    D.put(crash(1.8) * .7, land, .07, .1)
    mt_tune(T, D, land, 3, last_flat=.45, g=1.0)
    D.put(bdrum(.9, .8), t0 + 4.0, .14, 0)
    T.put(strings([60, 67, 71, 76], 1.6, .2, 1.0, 4.5, 1600) * 1.0, t0 + 6.4, .05)
    T.put(whistle(76 - .8, 1.3, .6, .1, .8), t0 + 6.7, .03, 0)
    T.fade(t0 + d - 1.0, t0 + d, 1, 0)
    D.fade(t0 + d - 1.0, t0 + d, 1, 0)


CUES = {"title": cue_title15, "announce": cue_announce15, "dock": cue_dock15, "model1": cue_model1_15, "model2": cue_model2_15, "replace": cue_replace15, "close": cue_close15, "end": cue_end15}
LEVEL15 = {"title": .9, "announce": 1.25, "dock": 1.1, "model1": 1.25, "model2": 1.15, "replace": 1.25, "close": 1.15, "end": .95}
TAIL15 = {"title": .6, "announce": .5, "dock": .5, "model1": .4, "model2": .4, "replace": .4, "close": .8, "end": 1.0}
DIP15 = {"title": 1.0, "announce": .6, "dock": .6, "model1": .6, "model2": .6, "replace": .6, "close": .6, "end": 1.0}
REVERB15 = {"title": (.4, 1.2), "announce": (.3, .9), "dock": (.3, 1.3), "model1": (.3, 1.0), "model2": (.3, 1.0), "replace": (.3, 1.0), "close": (.35, 1.2), "end": (.4, 1.2)}
DIPS15 = {"merge": (6, .25, .3), "click": (3, .1, .1)}


def bridges(B, S):
    """Gestures that carry one scene into the next (dry, added after the scenes' own reverb): announce to dock, the building waking up: a low brass swell that begins a second and a half
    before the cut and grows into the crane's drone; replace to close, a reversed cymbal that climbs into the banner's swell."""
    a, d_ = S["announce"], S["dock"]
    end_a = a["start"] + a["dur"]
    B.put(brass([29, 36, 41], 1.6, 1.3, .08, 500, swell=.6), end_a - 1.3, .06, 0)
    r_, c_ = S["replace"], S["close"]
    end_r = r_["start"] + r_["dur"]
    B.put(revcym(1.0, 2000, 9000), end_r - .7, .05, 0)


# ================================================================ the score (cues are added above, one scene at a time; this stays at the end of the file)
def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    M10._CTX["lines"] = {(ln["scene"], ln["id"]): ln for ln in lines}
    MUTES.clear()
    DIPCACHE = {}
    out = np.zeros((2, N))
    for sc in scenes:
        fn = CUES.get(sc["id"])
        if not fn:
            continue
        M10._CTX["scene"] = sc["id"]
        t0 = sc["start"]
        beats = {k: (t0 + v["s"], t0 + v["e"]) for k, v in sc["beats"].items()}
        U, D = Track(N), Track(N)
        fn(U, t0, sc["dur"], beats, D)
        for X in (U, D):
            X.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.2, 0.0, .15)             # a cue's dry tail never bleeds into the next scene
        a, b = max(0, int((t0 - .05) * SR)), min(N, int((t0 + sc["dur"] + 3.2) * SR))
        wet, rt = REVERB15.get(sc["id"], (.35, 1.1))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL15.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP15.get(sc["id"], .6)
        dips = DIPCACHE.setdefault(key, None)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        out[:, a:b] += seg * LEVEL15.get(sc["id"], 1.0) * dips[a:b][None, :]
    br = Track(N)
    bridges(br, {sc["id"]: sc for sc in scenes})
    out = out + br.buf
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS15)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
