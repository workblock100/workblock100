"""Episode 14 score: The Survey, a nature documentary about the State. It is scored as one: noble, patient and wide, a little too grand for a man with a clipboard, and it turns tender.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music14; the mixer ducks the bed under every voice. Every scene is rendered on its own tracks (U goes through
the room's reverb, D stays dry for hits and rhythm), then they are summed; a few spans are muted after the reverb so that silence is dead silence. All cue times come from the script's
beats (scene-local, shifted to the scene start) and from the spoken lines, so the score lands on the same offsets as the sound effects.

THE HORN THEME (HT): three notes, G3 - C4 - E4 (MIDI 55, 60, 64), one note to a syllable of the State's two catchphrases: 'It is now.' and 'Don't mind me.' Short, short, long. Over C
major it is the tonic triad and as noble as a bugle; over A minor (the series sting's chord) the same three notes are an Am7 and wistful. Its answer, AN, is E - D - C, falling.
  title    a low string pad rising from nothing, harp arpeggios up an A minor 9th, the series sting (cue_title7 and the theme7 effect) landing at 2.4, a bright brass chord at the lettering
           (2.7) and the horn calling HT an octave up; birds in the sound effects
  colony   patient, wide, beautiful: strings, a slow harp, the odd glockenspiel and a horn answering with AN; 'the State' turns the bed to a drone and a pizzicato tick; each of the five
           phone buzzes gets a tiny bassoon and pizzicato answer, climbing; dead silence on the meerkat freeze; a mock-heroic fanfare (HT in the trumpets) for 'The colony adapts.',
           cut short by the sting
  adapt    brisk comic scoring: a sneaking pizzicato walk and a tuba, stop-time on 'Does it close?', a typewriter rhythm for the charting, a hushed low-string bed with a heartbeat for the
           camera trap, a metronome for the call lights, a ridiculous polka and brass fanfare for the Administrator's display
  arrive   ominous and comic: the star-shaped silhouette gets a string swell and a bass drum, a tuba sags on the binder, a high tremolo and slow ticking for the binoculars, a single
           bell on the lock-on, a held low chord and the sting
  tracer   a chase: a brass-band ragtime at 150 bpm for the run, with a stab on each call light; the music stops dead when the surveyors arrive; a deadpan clarinet on 'It is
           suspicious.'; a slide whistle for the slip; a held low note and a rising pedal for the door
  closet   the landslide in slow motion: a reversed cymbal, a cello glissando, timpani and a long sustain, one bassoon note for 'Concealment is not a strategy.', a plucked sad trombone
  voices   the heart: a lullaby version of HT on a solo piano and a string quartet, which begins as a band-limited radio in Mrs. Cranberry's room and opens into the score; a swell and
           a held tender chord for 'Give her a break.'; one low note for 'The State is not known to be moved.'
  verdict  a courtroom pulse, a game-show vamp and a quiet build for the Plinko board (the pegs are the rhythm: nothing covers them), a red alarm crash on IMMEDIATE JEOPARDY, a silent
           beat on 'However.', a triumphant but tender hit on the NEW TAG stamp, HT alone for 'It is now.', warm strings that build one voice to a sit and resolve, the call light,
           HT again under 'Don't mind me. I'm just going to help.' and the last held chord
  end      cue_end7's reprise with HT on top
Instruments come from build_music6 / 7 / 9 / 10 / 13 plus the ones below (a french horn, a harp, a celesta, a xylophone, a bassoon, a trumpet, a bass drum, a tam-tam, tremolo strings);
nothing is sampled.
"""
import numpy as np
from scipy import signal

from build_audio import SR, tarr, osc, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pizz, marimba, bell, sub_bass, saw_bass, pad, strings, brass, hat, shaker, timp, roll, riser, impact, crash, tick, heart, MUSIC_GAIN, _n)
from build_music7 import woodblock, music_box, taiko, organ, choir, slide_brass, cue_title7, cue_end7
import build_music10 as M10
from build_music10 import piano, violin, clarinet, oboe, mtrumpet, tuba, slide_whistle, brush, ride, nylon, groove_times, cue_dips
from build_music9 import grid, ss, snap, rising, spic
import build_music13 as M13
from build_music13 import tvf, _fit_peak, _fit_rms, _mute, _speech_dip, put_chord, cello, glass, revcym, sub_swell, ubass, vib, kick13, snare13, hum

R14 = np.random.default_rng(2614)
HT = (55, 60, 64)           # the horn theme: G3 C4 E4
AN = (64, 62, 60)           # its answer, falling: E4 D4 C4
MUTES = []                  # [start, end, ramp] spans, absolute seconds, where the finished score is silent (after the reverb, so the silence is dead)


# ================================================================ helpers
def _noise(d):
    return R14.uniform(-1, 1, _n(d))


def W(line, word, k=0):
    """Absolute time of a word in a line of the current scene (the same proportional word times the captions use)."""
    return M10.wt(line, word, k)


def swell_pad(T, notes, at, d, g, a=1.0, r=1.0, bright=1300, pan=0.0):
    """A string pad that swells in and out: the strings ensemble with a long attack and release."""
    T.put(strings(list(notes), d, a, r, 5.0, bright), at, g)


# ================================================================ new instruments
def horn(m, d=1.0, vel=.8, a=.07, r=.25, vd=.0032, swell=True):
    """A solo french horn: a round, warm tone (partials 1 to 10 falling away like a horn's, a gentle formant near 450 Hz), a faint scoop up into the note, a vibrato that arrives after
    a third of a second, a puff of lip at the start and, when `swell` is on, a filter that opens as the note gets louder (a horn gets brighter as it gets louder), so a held note blooms."""
    t = tarr(d)
    f0 = midi(m)
    f = f0 * (1 + vd * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - .3) / .4, 0, 1)) * (1 - .015 * np.exp(-t / .04))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(k ** -(1.15 - .25 * vel) * np.sin(k * ph + .3 * k) for k in range(1, 11) if f0 * k < 6000)
    x = x + .6 * bp(x, 330, 620, 1)
    env = ar(d, a, min(r, d * .45))
    if swell:
        x = tvf(x, 650 + (900 + 1500 * vel) * env ** 1.3, .9, "lp")
    else:
        x = lp(x, 1300 + 1500 * vel, 2)
    x = x + hp(_noise(d), 1500) * np.exp(-t / .02) * .02
    return _fit_rms(x, .25) * env * (.45 + .55 * vel)


def trumpet(m, d=.4, vel=.9, a=.015, r=.07, vd=.003):
    """A bright orchestral trumpet: a pulse-and-saw tone, a filter that snaps open in 30 ms (the brassy 'blat' at the start of a note), a small vibrato on long notes."""
    t = tarr(d)
    f0 = midi(m)
    f = f0 * (1 + vd * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - .25) / .3, 0, 1))
    ph = np.cumsum(f) / SR
    x = (2 * (ph % 1) - 1) * .6 + (np.where((ph % 1) < .3, 1.0, -1.0) + .4) * .4      # a 30 percent pulse has a DC offset of -0.4: take it out
    x = tvf(x, 700 + 2600 * (1 - np.exp(-t / .03)) * (.5 + .5 * vel), 1.2, "lp")
    return _fit_rms(x, .25) * ar(d, a, min(r, d * .4)) * (.45 + .55 * vel)


def harp(m, d=1.8, vel=.7):
    """A concert harp string: partials that fall off as 1/k to the 1.25, the high ones dying faster, a hair of stretch, the low strings ringing for two seconds and the high ones for half a
    second, the thump of a finger and a ping of the nail."""
    f = midi(m)
    t = tarr(d)
    tau0 = 2.4 if f < 200 else 1.6 if f < 500 else 1.0 if f < 1200 else .6
    x = np.zeros(len(t))
    for k in range(1, 12):
        fk = f * k * np.sqrt(1 + .00015 * k * k)
        if fk > 9000:
            break
        x += k ** -1.25 * (1 if k < 7 else .7) * np.sin(2 * np.pi * fk * t + k) * np.exp(-t / (tau0 / (1 + .6 * (k - 1))))
    x += bp(_noise(d), 1500, 6000) * np.exp(-t / .004) * .12 * vel * max(x.max(), .1) + lp(_noise(d), 600) * np.exp(-t / .01) * .1 * vel * max(x.max(), .1)
    return _fit_peak(x * ar(d, .0008, min(.25, d * .5)), 1.0) * (.5 + .5 * vel)


def celesta(m, d=1.4, vel=.7):
    """A celesta: a bell-like sine with a fast-dying fourth partial and a very fast 6.3 times partial, a soft mallet."""
    f = midi(m)
    t = tarr(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .9) + .3 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / .12) + .08 * np.sin(2 * np.pi * 6.27 * f * t) * np.exp(-t / .04)
    return x * ar(d, .001, min(.2, d * .5)) * (.5 + .5 * vel) * .8


def xylo(m, d=.3, vel=.8):
    """A xylophone bar: partials at 1, 3 and 6 times the pitch (a bar tuned for it), a short ring, the click of a hard mallet."""
    f = midi(m)
    t = tarr(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .09) + .5 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / .03) + .2 * np.sin(2 * np.pi * 6 * f * t) * np.exp(-t / .012)
    x += bp(_noise(d), 2500, 6500) * np.exp(-t / .003) * .15 * vel
    return x * ar(d, .0006, min(.05, d * .4)) * (.5 + .5 * vel)


def bassoon(m, d=.4, vel=.8, a=.025, r=.06, vd=.0):
    """A bassoon: a reedy saw through its two nasal formants (about 450 and 1.1 kHz), a little darkness above, a breath of reed at the start; staccato notes are all front."""
    t = tarr(d)
    f = midi(m) * (1 + vd * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - .25) / .4, 0, 1))
    x = osc("saw", f, d)
    y = bp(x, 380, 620, 2) + .8 * bp(x, 900, 1300, 2) + .3 * lp(x, 1800, 2) + .7 * lp(x, 260, 2)      # the last term keeps the fundamental of a low note
    y += hp(_noise(d), 2500) * np.exp(-t / .01) * .03
    return _fit_rms(y, .25) * ar(d, a, min(r, d * .45)) * (.45 + .55 * vel)


def bdrum(vel=1.0, d=1.0):
    """An orchestral bass drum: a skin that sags from 85 to 42 Hz and rings, a thump of felt, a click of beater and a sub underneath."""
    t = tarr(d)
    x = np.sin(2 * np.pi * np.cumsum(42 + 43 * np.exp(-t / .05)) / SR) * np.exp(-t / .28) + .4 * np.sin(2 * np.pi * 45 * t) * np.exp(-t / .4)
    x += lp(_noise(d), 300) * np.exp(-t / .03) * .5 + bp(_noise(d), 1500, 4000) * np.exp(-t / .003) * .12
    return x * ar(d, .001, min(.3, d * .5)) * (.4 + .6 * vel)


def tamtam(d=3.0, f0=110.0, vel=1.0):
    """A tam-tam: inharmonic partials (1, 1.47, 2.09, 2.56, 3.2 and 4.1 times the pitch) that FM-wobble as the metal shivers, the high ones dying first, a wash of noise on the strike."""
    t = tarr(d)
    x = np.zeros(len(t))
    for r_, tau, g in ((1.0, 1.6, 1.0), (1.47, 1.3, .7), (2.09, 1.0, .55), (2.56, .8, .4), (3.2, .6, .3), (4.1, .45, .2)):
        x += g * np.sin(2 * np.pi * f0 * r_ * t + 2.5 * np.sin(2 * np.pi * 2.1 * t)) * np.exp(-t / (tau * d / 3.0))
    x += .4 * bp(_noise(d), 300, 2500) * np.exp(-t / .12) + .25 * hp(_noise(d), 3000) * np.exp(-t / .25)
    return x * ar(d, .002, min(.5, d * .4)) * (.4 + .6 * vel) * .5


def trem_strings(notes, d, rate=11.0, a=.4, r=.5, bright=3200, depth=.55):
    """String tremolo: the ensemble bowed as fast as the players can, so the level shimmers at `rate` times a second (one ear a quarter turn behind the other)."""
    s = strings(list(notes), d, a, r, 5.0, bright)
    t = tarr(d)
    return s * np.stack([1 - depth * (.5 + .5 * np.sin(2 * np.pi * rate * t)), 1 - depth * (.5 + .5 * np.sin(2 * np.pi * rate * t + 1.6))])


def hornline(T, notes, at, gain=.1, pan=.2, vel=.7, **kw):
    """Play a horn line: notes are (midi, start offset, duration) tuples placed from `at`."""
    for m, off, dd in notes:
        T.put(horn(m, dd, vel, **kw), at + off, gain, pan)


# the cue table, levels and tails (filled in below, one scene at a time)
CUES = {}
LEVEL14 = {}        # per-scene trim, set from the measured stems (see the report)
TAIL14 = {}         # how long the reverb may ring on past the scene's last frame
DIP14 = {}          # the score's own dip under dialogue, per scene
REVERB14 = {}       # (wet, reverb time) per scene
DIPS14 = {}         # dips under the sound effects that carry a joke: dB, hold, release


# ================================================================ colony: a habitat, a visitor, an alarm call
def cue_colony14(T, t0, d, beats, D):
    """3:02 PM, the colony. Patient, wide, beautiful (0.2 to 11.4 s): a C major ninth in the strings, then F major seventh, a harp that takes one note a beat at 54 bpm, a horn that answers
    with AN (E4, D4, C4, the falling answer to the theme) and the odd glockenspiel twinkle, all very quiet under the narrator. When he names the State (11.39) the pastoral chord ends
    and the bed turns: a low drone on A and E, a dread cluster (A and B flat), a high harmonic, and a pizzicato tick at 96 bpm that runs under the four short lines; a bass pluck
    on the car door (11.88) and a tuba's 'bomp' on 'normal.'; a rising string climbs from 'watching.' into the alarm. Each of the five phone buzzes (19.43 ...) gets a tiny answer 0.14 s
    later, a staccato bassoon and a pizzicato, climbing the notes of A minor seventh to a B; a tremolo builds to the freeze and is cut dead on it (21.80 to 23.20: nothing but the
    squeaks and the stab). 'Eleven seconds. The colony adapts.' gets a mock-heroic fanfare: a timpani and snare roll, then HT in the trumpets on 'The colony adapts.' (G4, C5, E5)
    over a C major brass chord, a tuba, a crash and a drum; it is cut dead at 25.84 so the sting has the room."""
    op, n1, n2, n3, m1, l1, s1, l2, n4, me, n5, en = (beats[k] for k in ("open", "n1", "n2", "n3", "m1", "l1", "s1", "l2", "n4", "meer", "n5", "end"))
    st = W("n3", "State")
    wa = W("l2", "watching")
    # --- the pastoral
    T.put(strings([36, 43, 48, 52, 59, 62], n2[0] - op[0] + .3, 1.2, 1.0, 4.8, 1500), op[0], .09)
    T.put(strings([29, 41, 48, 52, 57, 60, 64], st - n2[0] + .15, 1.0, .45, 4.8, 1500), n2[0] - .15, .09)
    for chord, a, b in (((48, 55, 59, 62, 64, 62, 59, 55), op[0] + .15, n2[0] - .05), ((41, 48, 52, 57, 60, 57, 52, 48), n2[0] - .05, st - .2)):
        for k, at in enumerate(grid(a, b, 54, 1.0)):
            T.put(harp(chord[k % 8], 2.0, .5), at, .09, -.3 + .15 * (k % 5))
    for m, off, dd in ((64, .3, 1.0), (62, 1.35, 1.2), (60, 2.6, 2.4)):                       # AN, very soft
        T.put(horn(m, dd, .55, a=.2, r=.6), t0 + off, .06, .2)
    for at, m in ((n1[1] + .1, 88), (n2[1] - .1, 91), (st - .6, 96)):
        T.put(bell(midi(m), 1.4) * .6, at, .05, .3)
    # --- the State is named: the bed turns
    T.put(strings([33, 40], wa - st + .6, .8, 1.2, 4.6, 520), st - .1, .1)
    T.put(strings([45, 46], wa - st + .4, 1.0, 1.0, 5.5, 600), st + .3, .035)
    T.put(glass(88, 5.0, 1.4, 1.2), st + 1.2, .03, .4)
    T.put(ubass(33, .7, .95), t0 + 11.879, .2, -.1)                                              # the car door
    for k, at in enumerate(grid(st + .5, wa - .1, 96, 1.0)):
        D.put(pizz(midi(57), .12), at, .07, .3 if k % 2 else -.3)
        D.put(tick(), at, .05, .3 if k % 2 else -.3)
    D.put(tuba(38, .3), W("l1", "normal") - .02, .17, 0)
    T.put(rising(45, 57, n4[0] + .6 - wa), wa, .09, .2)                                           # into the alarm
    # --- the alarm call: a tiny answer to every buzz
    for k, off in enumerate((.55, .95, 1.3, 1.65, 2.0)):
        at, m = n4[0] + off + .14, (45, 48, 52, 55, 59)[k]
        D.put(bassoon(m, .11, .85, a=.01, r=.04), at, .12, -.4 + .2 * k)
        D.put(pizz(midi(m + 12), .12), at, .1, -.4 + .2 * k)
    T.put(trem_strings([45, 52, 57, 60, 64], n4[1] - n4[0] - .5, 10, 2.0, .08), n4[0] + .5, .07)
    MUTES.append((n4[1] + .01, me[1] - .01, .02))                                                # the freeze: nothing but the squeaks and the stab
    # --- the mock-heroic fanfare
    a1, a2, a3 = W("n5", "The"), W("n5", "colony"), W("n5", "adapts")
    T.put(roll(70, a1 - n5[0] + .1, 20), n5[0] - .02, .1, -.1)
    for j in range(12):
        D.put(snare13(.3 + .05 * j, ghost=(j < 8)), n5[0] + .4 + j * .07, .03 + .004 * j, .1)
    T.put(trumpet(67, .26, .9), a1 - .04, .1, -.1)
    T.put(trumpet(72, .26, .95), a2 - .04, .1, .1)
    T.put(trumpet(76, .75, 1.0, a=.02, r=.2), a3 - .04, .11, 0)
    T.put(brass([48, 55, 60, 64, 67], .8, .02, .3, 2400), a3 - .04, .09, 0)
    T.put(tuba(36, .8), a3 - .04, .12, 0)
    T.put(crash(1.2), a3 - .04, .05, .1)
    T.put(timp(65, 1.0), a3 - .04, .16)
    MUTES.append((en[0] + .05, t0 + d, .02))                                                      # the sting is all there is


CUES["colony"] = cue_colony14
LEVEL14["colony"] = 1.0
TAIL14["colony"] = .5
DIP14["colony"] = .55
REVERB14["colony"] = (.5, 1.8)
DIPS14.update({"carclose": (3, .3, .25), "buzz": (2, .15, .15), "stab": (5, .5, .4), "sting": (6, .7, .5)})


# ================================================================ title and end: the overture and its reprise
def cue_title14(T, t0, d, beats, D=None):
    """The documentary overture (5.2 s). Underneath, the series' sting (cue_title7: a riser, a timpani roll from 0.4 s, an impact, a crash, the choir and the bells all landing at 2.4 s,
    with the theme7 effect's horn call and drone). On top of it: a low string pad that rises from nothing (A1, E2, A2, swelling for 2.2 s) with a sub swell under it; a harp that climbs an
    A minor ninth for two seconds, faster as it goes, as the sun comes up; a timpani on the landing; and, at the lettering (2.7), a bright brass chord of C major (it sits on the sting's A
    minor as an Am7: the dark chord is lit from above) with a glockenspiel glint, and the solo horn calling the theme an octave up (G4 at 2.72, C5 at 3.22, E5 held from 3.78 and left to
    fade) over a warm C major pad. The held E is the third of C: it is also the first chord of the colony."""
    cue_title7(T, t0, d, beats)
    lg0, lg1 = beats["logo"]
    land = t0 + 2.4
    T.put(strings([33, 40, 45], 2.9, 2.2, .6, 4.6, 800), t0, .11)
    T.put(sub_swell(33, 55, 2.3), t0, .1)
    for k, m in enumerate((45, 52, 57, 60, 64, 67, 69, 72, 76, 79, 81, 84)):
        T.put(harp(m, 1.8, .4 + .04 * k), t0 + (.3, .56, .8, 1.02, 1.22, 1.4, 1.56, 1.7, 1.83, 1.95, 2.06, 2.16)[k], .11, -.45 + .08 * k)
    T.put(timp(55, 1.8), land, .2)
    T.put(strings([36, 43, 48, 52, 55, 60], 2.6, .3, 1.3, 5.0, 1800), land + .3, .09)
    T.put(brass([48, 55, 60, 64, 67, 72], 1.3, .02, .55, 2600), lg0 + 2.5, .1, 0)
    T.put(bell(midi(96), 1.2) * .6, lg0 + 2.55, .06, -.3)
    T.put(bell(midi(100), 1.2) * .6, lg0 + 2.65, .05, .3)
    T.put(horn(67, .5, .8, a=.05, r=.1), t0 + 2.72, .13, .1)
    T.put(horn(72, .55, .85, a=.05, r=.1), t0 + 3.22, .13, .1)
    T.put(horn(76, 1.7, .9, a=.12, r=1.0), t0 + 3.78, .14, .1)
    T.fade(t0 + d - .35, t0 + d, 1, 0)


def cue_end14(T, t0, d, beats, D=None):
    """The end card (8.0 s): cue_end7's reprise of the series theme (strings, brass, a bass and a kick on Am, F, C, G, Am; the crash, timpani and choir at 2.55; the teaser's drum and bells
    at 4.25) with the horn theme on top, twice, and a harp that climbs the same A minor ninth as the title. The first statement (G4 at 3.4, C5 at 3.88, E5 at 4.4) rises over the F chord and
    lands on the C chord at 4.75, held; the second (G4 at 6.0, C5 at 6.45, E5 at 6.9) ends on the open fifth of the last A minor chord, neither major nor minor, which is
    the right way to say 'next time'. The horn is laid in before cue_end7 so its fade covers it."""
    T.put(horn(67, .45, .75, a=.05, r=.1), t0 + 3.4, .15, .15)
    T.put(horn(72, .5, .8, a=.05, r=.1), t0 + 3.88, .15, .15)
    T.put(horn(76, 2.0, .85, a=.12, r=1.0), t0 + 4.4, .16, .15)
    T.put(horn(67, .45, .75, a=.05, r=.1), t0 + 6.0, .15, .15)
    T.put(horn(72, .5, .8, a=.05, r=.1), t0 + 6.45, .15, .15)
    T.put(horn(76, 1.4, .85, a=.1, r=.9), t0 + 6.9, .16, .15)
    for k, m in enumerate((57, 60, 64, 67, 69, 72)):
        T.put(harp(m, 1.6, .5 + .03 * k), t0 + .25 + .11 * k, .08, -.3 + .12 * k)
    cue_end7(T, t0, d, beats)


CUES["title"] = cue_title14
CUES["end"] = cue_end14
LEVEL14.update({"title": 1.0, "end": 1.0})
TAIL14.update({"title": .2, "end": 3.0})
DIP14.update({"title": 1.0, "end": 1.0})
REVERB14.update({"title": (.55, 1.6), "end": (.55, 1.6)})


# ================================================================ the cue table, levels and the score (cues are added below, one scene at a time)


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
        wet, rt = REVERB14.get(sc["id"], (.4, 1.2))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL14.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP14.get(sc["id"], .6)
        dips = DIPCACHE.setdefault(key, None)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        out[:, a:b] += seg * LEVEL14.get(sc["id"], 1.0) * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS14)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
