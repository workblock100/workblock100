"""Episode 12 score: the in-service. A sign-in waltz with a music box that goes a little sad for Persimmon, a corporate march for slides one to four, a quiz vamp on a
ticking woodblock that stops dead at the first 'No.', a single held note for 'There is no slide for no.', a fire drill whose march falls apart on the banana peel and a lonely
clarinet for the muster point and the Moon, an award fanfare with a timpani roll into the gong, a tender string line under Clementine's rosette, and a silence from the
Strawberry 'No.' until a bell after her last line; then the series reprise.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music12; the mixer ducks it under every voice. All cue times are read from the script's
beats (scene-local, shifted to the scene start) and from the spoken lines, so the score lands on the same offsets as the sound effects.
  title    the series sting from build_music7 (riser, timpani roll, choir, bells, landing on the logo), then a dry projector groove: a click-clack pulse at 92 bpm locked to
           the projector's clacks, and a bass walk
  signin   a hesitant waltz (3/4) on pizzicato and a music box, a piano on two and three; the chords go minor and an oboe sighs under 'Persimmon is not attending.'; it slows
           for the thank-you and stops before the sad trombone
  slides   a bright corporate march in C (120 bpm, marimba and brass) for slides one to four, a stab on each slide change; a quiz vamp in D minor (a woodblock tick every half
           second on quiz two's clock, a low ostinato, a dark pad); silence from 'No.' (the first one) through the crickets and 'Excuse me?'; one held note under 'There is no
           slide for no.'; nothing under the sting
  drill    a two-tone alarm riff with a snare roll under the bells; a march (136 bpm) with running hats that falls apart at the peel (a slide whistle, a flat brass, four
           stumbling marimba notes); a lonely clarinet from the muster point, the Moon's bells under 'I counted', a long note under 'Persimmon'
  award    a fanfare (brass, timpani, a trumpet call) under the applause; a timpani roll into the gong; tender strings and violin under the rosette; a call-out roll that is cut
           dead at the Strawberry 'No.'; total silence until a bell after her last line
  end      build_music7's reprise
Instruments come from build_music6 / 7 / 8 / 9 / 10; nothing is sampled.
"""
import numpy as np

from build_audio import SR, midi
from build_music6 import Track, hall, pizz, marimba, bell, sub_bass, saw_bass, pad, strings, brass, kick, snare, hat, timp, roll, MUSIC_GAIN
from build_music7 import woodblock, slide_brass, music_box, moon_motif, cue_title7, cue_end7
import build_music10 as M10
from build_music10 import piano, violin, oboe, clarinet, mtrumpet, tuba, slide_whistle, cue_dips

R12 = np.random.default_rng(2612)
LEVEL12 = {"title": 1.0, "signin": 1.0, "slides": 1.0, "drill": 1.0, "award": 1.0, "end": 1.0}   # per-scene trim, set from the measured stems (see the report)
DIPS12 = {"gong": (9, 1.8, .8), "firebell": (4, .8, .5), "pa_chime": (3, .3, .3), "applause": (3, 1.0, .6), "trombone": (3, .8, .5), "sting": (6, .6, .5)}
MUTES = []   # [start, end] spans, absolute seconds, where the finished score is silent (after the reverb, so the silence is dead)


def _mute(out, a, b, ramp=.03):
    """Silence the finished score from a to b seconds, with a 30 ms ramp at each edge."""
    n = out.shape[1]
    i, j = int(round(a * SR)), int(round(b * SR))
    r = int(ramp * SR)
    g = np.ones(n)
    if i - r >= 0:
        g[i - r:i] = np.linspace(1, 0, r)
    g[max(0, i):min(n, j)] = 0.0
    if j + r <= n:
        g[j:j + r] = np.linspace(0, 1, r)
    return out * g[None, :]


# ================================================================ title: the logo, then the projector groove
def cue_title12(T, t0, d, beats):
    cue_title7(T, t0, d, beats)                          # the series sting: riser, timpani roll, choir and bells on the landing (t0 + 2.4)
    lg0, lg1 = beats["logo"]
    bl = 60 / 92
    walk = (45, 48, 50, 48, 45, 43, 45, 47)
    i = 0
    while True:
        at = lg0 + .45 + i * bl                          # the projector's clacks sit at 0.45, 1.10, 1.75 and 2.40 into the logo beat; the groove shares that clock
        if at > lg1 - .15:
            break
        if at >= lg0 + 2.3:                              # from the fourth clack on
            T.put(woodblock(), at, .16, .35 if i % 2 else -.35)
            T.put(pizz(midi(walk[i % 8]), .45), at, .2, -.1)
            T.put(hat(.04), at + bl / 2, .05, .3)
        i += 1
    T.fade(t0 + d - .35, t0 + d, 1, 0)


# ================================================================ sign-in: a hesitant waltz
SIGN_CH = {"Am": (45, (57, 60, 64)), "Dm": (38, (50, 53, 57)), "E": (40, (52, 56, 59)), "F": (41, (53, 57, 60)), "Fm": (41, (53, 56, 60)),
           "Cm": (36, (48, 51, 55)), "Ab": (44, (56, 60, 63)), "Eb": (39, (51, 55, 58))}
SIGN_HOPE = ("Am", "Dm", "Am", "E", "Am", "F", "E", "Am")
SIGN_SAD = ("Fm", "Cm", "Ab", "Eb", "Fm", "Cm", "E", "Am")
SIGN_TUNE = {0: [(0.0, 69, 1.5)], 1: [(0.5, 72, 1.0), (1.5, 71, .5)], 2: [], 3: [(0.0, 68, 1.0), (1.0, 64, 2.0)], 4: [(0.0, 64, 3.0)],
             5: [(0.5, 65, 1.0), (1.5, 67, 1.0)], 6: [(0.0, 68, 1.0), (1.0, 69, 2.0)], 7: [(0.0, 69, 3.0)]}


def cue_signin12(T, t0, d, beats):
    stop = beats["end"][0] - .05                         # the waltz is done before the sad trombone
    sad0, sad1 = beats["l1"]
    rit0 = beats["a4"][0]
    t, k = beats["a1"][0], 0
    while t < stop - .6:
        sad = sad0 - .3 <= t < sad1 + .3
        rit = min(1.0, max(0.0, (t - rit0) / max(.1, stop - rit0)))
        bl = .6 * (1 + .45 * rit)
        ch = (SIGN_SAD if sad else SIGN_HOPE)[k % 8]
        bass, chord = SIGN_CH[ch]
        at = t + R12.uniform(-.015, .015)                # hesitant: a little late, now and then
        lvl = .8 if sad else 1.0
        T.put(pizz(midi(bass), bl * .9), at, .18 * lvl, -.12)
        if k % 4 != 3:                                   # every fourth bar the piano stays out
            for b in (1, 2):
                for j, m in enumerate(chord):
                    T.put(piano(m, bl * .7, .5), at + b * bl + j * .004, .042 * lvl, .15 * (j - 1))
        for off, m, dd in SIGN_TUNE[k % 8]:
            T.put(music_box(midi(m), dd * bl * .96), t + off * bl, .09 * lvl, .25)
        t += 3 * bl
        k += 1
    T.put(oboe(64, 1.2), sad0 + .3, .07, -.2)            # 'Persimmon is not attending.': a sigh
    T.put(oboe(62, 1.6), sad0 + 1.6, .06, -.2)
    T.fade(stop - .4, stop, 1, 0)


# ================================================================ slides one to four, the quiz, the silence
MARCH = (("C", 48, (60, 64, 67), (72, 76, 79, 76)), ("G", 43, (59, 62, 67), (74, 71, 74, 79)),
         ("C", 48, (60, 64, 67), (72, 76, 79, 84)), ("F", 41, (57, 60, 65), (77, 76, 72, 77)))


def _march12(T, a, b, lvl=1.0):
    """A bright corporate march in C at 120 bpm: a bass and a kick on the first beat, a snare and a brass stab on the second, marimba on eighth notes."""
    n, t = 0, a
    while t < b:
        _, bass, ch, mel = MARCH[n % 4]
        T.put(sub_bass(midi(bass), .45), t, .24 * lvl)
        T.put(kick(), t, .26 * lvl)
        T.put(snare(), t + .5, .14 * lvl, .1)
        T.put(brass(ch, .2, .01, .08, 1800), t + .5, .08 * lvl)
        for q, m in enumerate(mel):
            T.put(marimba(midi(m), .3), t + q * .25, .09 * lvl, .25 if q % 2 else -.25)
        t += 1.0
        n += 1


def _quiz12(T, B):
    """The quiz: a tense vamp in D minor under the questions. A woodblock ticks every half second on quiz two's own clock (quiz two's three ticks come from the cue at
    0.2, 0.7 and 1.2 into its pause, so the score leaves those three to the cue), a low ostinato and a dark pad. It stops dead at the first 'No.' (see MUTES)."""
    q1, (qs, qe), s6 = B["quiz1"][0], B["quiz2"], B["s6"][0]
    t = qs + .2 - .5 * np.floor((qs + .2 - q1) / .5)
    ost = (38, 38, 41, 36, 38, 38, 39, 36)
    n = 0
    while t < s6 - .05:
        if not (qs + .1 <= t <= qs + 1.4):
            T.put(woodblock(), t, .095, .2 if n % 2 else -.2)
        if n % 2 == 0:
            T.put(saw_bass(midi(ost[(n // 2) % 8]), .35, 320), t, .03)
        n += 1
        t += .5
    T.put(pad([50, 53, 57], s6 - q1, 1.0, 1.0, 900), q1, .025)


def cue_slides12(T, t0, d, beats):
    B = beats
    _march12(T, B["open"][0], B["a6"][1] - .1, lvl=.32)  # slides one to four (the speech margin wants it about ten decibels under the first draft)
    for k in ("s2", "s3", "s4"):                          # a stab on each slide change
        at = B[k][0] + .05
        T.put(brass([60, 64, 67, 72], .3, .005, .12, 2400), at, .1)
        T.put(woodblock(), at, .15, 0)
    T.put(slide_brass(60, 72, .6), B["chart"][0] + .1, .08, 0)   # the pizza slice swells
    _quiz12(T, B)
    T.put(strings([50], 1.5, .5, .5, 4.0, 1500), B["a13"][0], .06, 0)   # a single held note: 'There is no slide for no.'
    MUTES.append((B["s6"][0] - .05, B["a13"][0] - .02))                  # the first 'No.' lands in silence
    MUTES.append((B["end"][0] - .02, t0 + d))                            # and nothing under the sting


# ================================================================ the drill
def cue_drill12(T, t0, d, beats):
    B = beats
    al0, al1 = B["alarm"]
    t, i = al0 + .1, 0                                   # the alarm riff: two tones, a half second each
    while t < B["c1"][1]:
        loud = .16 if t < B["a1"][0] else .06
        T.put(brass([72 if i % 2 == 0 else 67], .42, .01, .14, 2200), t, loud, -.2 if i % 2 else .2)
        t += .5
        i += 1
    for j in range(14):                                  # a snare roll under the bells, building
        T.put(snare(.12), al0 + .05 + j * .1, .04 + .08 * (j / 14), .1)
    # the march: 136 bpm, two beats to the bar, running hats in sixteenths, until the banana
    r0, fall = B["run"][0], B["peel"][0] + .2
    bar = 2 * 60 / 136
    prog = ((58, (58, 62, 65), 46, (70, 74, 77, 74)), (55, (55, 58, 62), 43, (70, 67, 70, 74)),
            (51, (51, 55, 58), 39, (75, 74, 72, 70)), (53, (53, 57, 60), 41, (69, 72, 74, 77)))
    t, n, g = r0, 0, .5                                  # g: the march sits about six decibels lower than the slides' march (the speech margin)
    while t < fall - .05:
        _, ch, bass, mel = prog[n % 4]
        T.put(kick(), t, .3 * g)
        T.put(tuba(bass, .4, .02, .1), t, .09 * g)
        T.put(snare(), t + bar / 2, .16 * g, .1)
        T.put(brass(ch, .22, .01, .08, 1900), t + bar / 2, .08 * g)
        for q, m in enumerate(mel):
            T.put(mtrumpet(m, .3, .9), t + q * bar / 4, .05 * g, .15 * (-1) ** q)
        t += bar
        n += 1
    for k in range(int((fall - r0) / .11)):
        T.put(hat(.04), r0 + k * .11, .05 * g, .2 if k % 2 else -.2)
    # the march falls apart on the peel: a slide down, a flat brass, four stumbling notes
    T.put(slide_whistle(77, 50, .9), fall, .12, 0)
    T.put(tuba(38, .9, .04, .3), fall + .2, .12)
    for j, m in enumerate((75, 70, 66, 61)):
        T.put(marimba(midi(m), .2), fall + .35 + j * .22, .08 * (1 - .15 * j), .3 if j % 2 else -.3)
    T.put(brass([70, 66], .9, .03, .4, 1200), fall + .9, .07)
    # the muster point: a lonely clarinet, and the Moon
    m0 = B["muster"][0]
    T.put(clarinet(69, 1.6), m0 + .7, .08, -.1)          # A4
    T.put(clarinet(67, .8), m0 + 2.4, .07, -.1)          # G4
    T.put(clarinet(65, 1.5), m0 + 3.3, .07, -.1)         # F4
    T.put(clarinet(62, 1.5), B["s5"][0] + .2, .07, -.1)  # D4, under 'She's on another budget.'
    moon_motif(T, B["mo1"][0] + .1, .08, .3, .24)
    moon_motif(T, B["mo2"][0] + .3, .06, -.3, .26)
    MUTES.append((B["end"][0] - .02, t0 + d))            # nothing under the sting


# ================================================================ the award
def cue_award12(T, t0, d, beats):
    B = beats
    o0 = B["open"][0]
    T.put(timp(55, 1.6), o0 + .2, .12)                    # a fanfare under the applause: drum, brass, a trumpet call
    T.put(brass([58, 62, 65], .9, .02, .3, 1800), o0 + .2, .08)
    for m, at in ((70, o0 + .6), (74, o0 + .9), (77, o0 + 1.2), (74, o0 + 1.5)):
        T.put(mtrumpet(m, .3, .9), at, .06, .1)
    T.put(pad([58, 62, 65], B["a1"][1] - B["a1"][0], .4, .6, 1000), B["a1"][0], .035)
    T.put(slide_brass(65, 58, .7), B["l1"][0] + 1.0, .07, 0)                      # 'Nobody reads them.': a trombone sighs
    T.put(pad([55, 58, 62], B["a2"][1] - B["l1"][0], .5, .8, 1000), B["l1"][0], .03)
    T.put(brass([60, 64, 67], .3, .005, .1, 2000), B["m1"][0], .09)              # 'You knew?'
    T.put(roll(70, 1.0, 22), B["gong"][0] + .1 - 1.0, .16, -.1)                  # a roll that ends on the gong
    a4 = B["a4"][0] + .1                                                          # the newest hire: tender strings under the rosette
    T.put(strings([58, 62, 65], 2.0, .6, .8, 5.0, 1500), a4, .05)
    T.put(strings([55, 58, 62], 2.2, .6, .8, 5.0, 1500), a4 + 2.0, .05)
    for m, at, dd in ((74, a4, 1.2), (77, a4 + 1.3, .8), (75, a4 + 2.2, .6), (74, a4 + 2.9, 1.5)):
        T.put(violin(m, dd), at, .075, -.15)
    T.put(violin(74, 1.0), B["c2"][0], .08, 0)                                    # 'Sure!'
    T.put(strings([58, 62, 65], 2.5, .6, 1.0, 5.0, 1500), B["c2"][0], .05)
    at_att = M10.wt("a5", "Attended")                                              # 'Attended.': a brass stab and a timpani
    T.put(brass([58, 62, 65, 70], .45, .01, .2, 1700), at_att, .09)
    T.put(timp(55, .8), at_att, .12)
    T.put(slide_brass(64, 52, .9), B["s1"][0] + .2, .06, 0)                       # 'Under protest.': a sigh
    T.put(roll(55, B["s2"][0] - B["a6"][0] - .15, 36), B["a6"][0], .035, -.1)      # the call-out roll, cut dead at the 'No.'
    T.put(brass([53, 57, 60], .5, .03, .2, 1500), M10.wt("a6", "call"), .05)
    MUTES.append((B["s2"][0] - .05, B["s4"][1] - .02))                            # total silence through her last line
    bt = B["s4"][1] + .05                                                          # then a bell
    T.put(bell(midi(84), 3.0), bt, .1, .2)
    T.put(bell(midi(91), 2.4), bt + .12, .05, -.2)


CUES = {"title": cue_title12, "signin": cue_signin12, "slides": cue_slides12, "drill": cue_drill12, "award": cue_award12, "end": cue_end7}


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    T = Track(N)
    M10._CTX["lines"] = {(ln["scene"], ln["id"]): ln for ln in lines}
    MUTES.clear()
    for sc in scenes:
        fn = CUES.get(sc["id"])
        if not fn:
            continue
        M10._CTX["scene"] = sc["id"]
        t0 = sc["start"]
        beats = {k: (t0 + v["s"], t0 + v["e"]) for k, v in sc["beats"].items()}
        U = Track(N)
        fn(U, t0, sc["dur"], beats)
        U.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.0, 0.0, .15)   # a cue's tail never bleeds into the next scene
        T.buf += U.buf * LEVEL12[sc["id"]]
    out = hall(T.buf, wet=.55, rt=1.6) * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS12)[None, :]
    for a, b in MUTES:
        out = _mute(out, a, b)
    return out
