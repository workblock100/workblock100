"""Episode 10 score: two weeks' notice. A flyer with fourteen tabs, an office run on paperwork, a montage with the calendar flipping on the beat, an exit interview as cold as a
filing cabinet, a farewell waltz that cannot keep its feet, a march that deflates, and a gentle night with a glockenspiel on ACCEPT.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music10; the mixer ducks it under every voice.
  title    the series sting (riser, timpani roll, choir, bells: build_music7's cue) with a bouncy pizzicato theme that lands one note on each of the fourteen tears
  office   staccato strings and a woodblock like a typing pool; a muted trumpet for officialese; a horror sting on 'agency'; a comic heraldic fanfare for each pizza
  days     a brisk marimba and pizzicato groove whose bar lines are bent a hair so a downbeat lands on every calendar flip; four colours for four places
  exit     cold and dry: a clock, a low string, a lonely clarinet that sighs after every 'Money.', silence for the stamp
  party    a warm waltz that trips over the missing R, limps on four dollars and seventeen cents, and swells for 'I love you.' 'I know.'
  door     a stately march that loses a piece of itself with every deduction
  lot      a nylon guitar under the stars and, on ACCEPT, a glockenspiel
  end      build_music7's reprise
Instruments come from build_music6 / 7 / 8 / 9 plus the ones below (a nylon guitar, a piano, a solo violin, a clarinet, an oboe, a tuba, a muted trumpet, a kazoo, brushes); nothing
is sampled. build_music11 imports this module for them.
"""
import numpy as np

from build_audio import SR, tarr, osc, expdecay, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pluck, pizz, marimba, epiano, bell, vibes, sub_bass, saw_bass, pad, strings, brass, kick, snare, clap, hat, shaker, tom, timp, roll,
                          riser, impact, crash, tick, heart, MUSIC_GAIN, _n)
from build_music7 import CH7, woodblock, slide_brass, choir, music_box, moon_motif, taiko, hits, cue_title7, cue_end7
from build_music8 import beat_times, tock, root as root8
from build_music9 import grid, ss, spic, snap, uke

R10 = np.random.default_rng(2610)


# ================================================================ new instruments
def _fit_peak(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def _fit_rms(x, rms=.25):
    """Scale a sustained note to the loudness of the other instruments (their RMS is about -12 dB at gain 1): a bowed or blown note has a far lower crest than a pluck."""
    r = np.sqrt(np.mean(x ** 2))
    return x * (rms / r) if r > 0 else x


def nylon(m, d=1.0, bright=1.0, pos=.13):
    """A nylon-string guitar note: partials that die faster the higher they are (and a little stretched, like a real string), a plucking position that thins some of them, a
    twin string a hair out of tune so it beats slowly, a wooden body, and the click of the nail."""
    f = midi(m)
    t = tarr(d)
    x = np.zeros(len(t))
    for k in range(1, 16):
        fk = f * k * (1 + .00025 * k * k)
        if fk > 8500:
            break
        a = abs(np.sin(np.pi * k * pos)) / k * (bright if k > 3 else 1.0)
        tau = 1.4 / (1 + .8 * (k - 1)) * (1.0 if f > 180 else 1.3)
        e = np.exp(-t / tau)
        x += a * (np.sin(2 * np.pi * fk * t + .7 * k) + .6 * np.sin(2 * np.pi * fk * 1.0006 * t + 2 + .4 * k)) * e
    body = bp(x, 110, 290, 1) * .35
    nail = bp(R10.uniform(-1, 1, len(t)), 1800, 5600) * np.exp(-t / .004) * .06 * max(x.max(), .1)
    return _fit_peak((x * .55 + body + nail) * ar(d, .0007, min(.12, d * .4)), 1.0)


def piano(m, d=1.2, vel=.8):
    """A piano note: stretched partials with the low strings ringing longer, three strings a hair apart, a soft hammer thump."""
    f = midi(m)
    t = tarr(d)
    x = np.zeros(len(t))
    for k in range(1, 13):
        fk = f * k * np.sqrt(1 + .0004 * k * k)
        if fk > 8000:
            break
        a = 1 / k ** .9
        tau = 2.2 / k ** .8 * (1.0 if f > 200 else 1.6)
        for det in (1.0, 1.0007, .9993):
            x += a * np.sin(2 * np.pi * fk * det * t + k) * np.exp(-t / tau) / 3
    hammer = lp(R10.uniform(-1, 1, len(t)), 2500) * np.exp(-t / .012) * .15 * vel * max(x.max(), .1)
    return _fit_peak((x + hammer) * ar(d, .0005, min(.2, d * .5)), 1.0) * (.55 + .45 * vel)


def violin(m, d=1.0, vib=.006, a=.07, r=.12):
    """A solo violin: a bowed saw with a delayed vibrato, a small scoop up into the note, the body's two formants and a little bow noise."""
    t = tarr(d)
    fv = midi(m) * (1 + vib * np.sin(2 * np.pi * 5.8 * t) * np.clip((t - .18) / .3, 0, 1)) * (1 - .02 * np.exp(-t / .04))
    x = osc("saw", fv, d)
    y = lp(x, 3600, 2) + .5 * bp(x, 900, 1300, 1) + .35 * bp(x, 2300, 3100, 1)
    y += hp(R10.uniform(-1, 1, len(t)), 3500) * .02
    return _fit_rms(y * ar(d, a, min(r, d * .45)))


def clarinet(m, d=1.0, vib=.005, a=.05, r=.12):
    """A clarinet: odd harmonics only (that hollow sound), a breath of noise, a slow vibrato that arrives late."""
    t = tarr(d)
    f = midi(m) * (1 + vib * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - .35) / .5, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum((1 / k ** .8 if k % 2 else .12 / k) * np.sin(k * ph) for k in range(1, 12))
    y = lp(x, 3200, 2) + bp(R10.uniform(-1, 1, len(t)), 1200, 3500, 1) * .04
    return _fit_rms(y * ar(d, a, min(r, d * .45)))


def oboe(m, d=1.0, vib=.008, a=.06, r=.12):
    """An oboe: a reedy saw through a nasal formant around 1.1 kHz, with a vibrato that grows."""
    t = tarr(d)
    f = midi(m) * (1 + vib * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - .3) / .5, 0, 1))
    x = osc("saw", f, d)
    y = bp(x, 850, 1450, 2) + .25 * lp(x, 700) + .12 * bp(x, 2200, 3200, 1)
    return _fit_rms(y * ar(d, a, min(r, d * .45)))


def tuba(m, d=.5, a=.04, r=.1):
    """A tuba: a round, dark brass note with a small scoop up into it."""
    f = midi(m) * (1 - .03 * np.exp(-tarr(d) / .05))
    x = osc("saw", f, d) * .8 + osc("square", f, d) * .4
    return _fit_rms(lp(x, 520, 3) * ar(d, a, min(r, d * .45)))


def mtrumpet(m, d=.4, vel=1.0, vib=.004, wah=0.0, a=.012, r=.06):
    """A harmon-muted trumpet: thin, nasal, all upper-middle. `wah` is how many times a second the mute is worked (the filter swings between a closed and an open vowel)."""
    t = tarr(d)
    x = osc("saw", midi(m) * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - .15) / .2, 0, 1)), d)
    if wah:
        w = .5 + .5 * np.sin(2 * np.pi * wah * t - np.pi / 2)
        y = (1 - w) * bp(x, 500, 1100, 2) + w * bp(x, 1300, 3200, 2)
    else:
        y = bp(x, 800, 2800, 2) + .3 * bp(x, 380, 800, 1)
    return _fit_rms(y * ar(d, a, min(r, d * .4))) * vel


def kazoo(m, d=.3, a=.02, r=.05):
    """A kazoo: a buzzing membrane (a saw with its level chopped at about 150 Hz) through a small nasal horn."""
    t = tarr(d)
    x = osc("saw", midi(m) * (1 + .006 * np.sin(2 * np.pi * 6 * t) * np.clip(t / .2, 0, 1)), d)
    y = bp(x, 600, 3200, 2) * (.72 + .28 * np.sign(np.sin(2 * np.pi * 150 * t)))
    return _fit_rms(y * ar(d, a, min(r, d * .4)))


def brush(d=.25):
    """A drummer's brush swept across a snare: a band of noise that swells and fades."""
    return bp(R10.uniform(-1, 1, _n(d)), 2500, 9000) * np.sin(np.pi * np.linspace(0, 1, _n(d))) ** 1.4 * .5


def ride(d=.6):
    """A ride cymbal tap: noise through the top octaves and a few inharmonic partials that ring."""
    t = tarr(d)
    x = hp(R10.uniform(-1, 1, _n(d)), 5500) * np.exp(-t / .15) * .5
    x += sum(a * np.sin(2 * np.pi * f * t) for f, a in ((3100, .2), (4700, .15), (6300, .1))) * np.exp(-t / .3) * .4
    return x * ar(d, .0004, .1)


# ================================================================ context: where we are and what is being said
_CTX = {"scene": None, "lines": {}}


def wt(line_id, word, k=0):
    """Absolute time (s) at which a word begins in a spoken line of the current scene: the same proportional word times the captions use."""
    ln = _CTX["lines"][(_CTX["scene"], line_id)]
    ws = [w for w in ln["words"] if w[0].strip(".,!?:;'\"").lower().startswith(word.lower())]
    return ln["s"] + ws[k][1]


def seq(T, inst, at, items, gain, pan=0.0, step=None):
    """Play a run of notes: items are (midi, beats-or-seconds offset, duration) tuples placed at `at` + offset (the offset is already in seconds)."""
    for it in items:
        m, off, dur = it[:3]
        g = gain * (it[3] if len(it) > 3 else 1.0)
        T.put(inst(m, dur), at + off, g, pan)


def groove_times(a, b, nbeats_per_bar=4, bpm=138.0):
    """Beat times from a to b with the tempo bent a hair so that a whole number of bars fits exactly (a downbeat lands on a and on b). Returns (times, beat length)."""
    nb = max(nbeats_per_bar, int(round((b - a) / (60 / bpm) / nbeats_per_bar)) * nbeats_per_bar)
    bl = (b - a) / nb
    return [a + i * bl for i in range(nb)], bl


CHORDS10 = {"Dm": [50, 53, 57], "Bb": [46, 50, 53], "A": [45, 49, 52], "Gm": [43, 46, 50], "F": [41, 45, 48], "C": [48, 52, 55], "G": [43, 47, 50], "Am": [45, 48, 52], "Em": [40, 43, 47],
            "Dm7": [50, 53, 57, 60], "D": [50, 54, 57], "Bm": [47, 50, 54], "Edim": [52, 55, 58], "Fmaj7": [41, 45, 48, 52], "E": [40, 44, 47], "C7": [48, 52, 55, 58], "A7": [45, 49, 52, 55],
            "Eb": [39, 43, 46], "B": [47, 51, 54], "C#m": [49, 52, 56], "F#m": [42, 45, 49]}



def cue_dips(script, scenes, N, table):
    """A gain curve for the finished score that dips it under the sound effects that carry a joke (a stamp, a tear, a coin, a door), so a cue that the picture hits is heard
    whatever the band is doing at that instant. `table` maps an effect name to (depth in dB, hold in s, release in s); the dip starts 12 ms before the cue so the transient is clean,
    and overlapping dips do not add up (the deepest wins), so a run of tears is one gentle dip, not a pump."""
    g = np.ones(N)
    by = {x["id"]: x for x in scenes}
    for sc in script["scenes"]:
        ts = by.get(sc["id"])
        if ts is None:
            continue
        for b in sc["beats"]:
            for c in b.get("sfx", []):
                spec = table.get(c[0])
                if not spec or not isinstance(c[1], (int, float)):
                    continue
                depth, hold, rel = spec
                at = ts["start"] + ts["beats"][b["id"]]["s"] + c[1]
                atk, h, r = int(.012 * SR), int(hold * SR), int(rel * SR)
                lvl = 10 ** (-depth / 20)
                env = np.full(atk + h + r, lvl)
                env[:atk] = np.linspace(1, lvl, atk)
                env[atk + h:] = np.linspace(lvl, 1, r)
                a = int((at - .012) * SR)
                i0, i1 = max(0, a), min(N, a + len(env))
                if i1 > i0:
                    g[i0:i1] = np.minimum(g[i0:i1], env[i0 - a:i1 - a])
    return g


DIPS10 = {"tear": (5, .12, .12), "stamp10": (9, .4, .3), "flipcal": (8, .5, .3), "whoosh2": (4, .2, .2), "clatter": (5, .3, .25), "rattle": (4, .25, .25), "toteempty": (5, .3, .25),
          "pentick": (3, .08, .1), "partyhorn": (4, .45, .3), "pop": (3, .1, .15), "cheer9": (4, .5, .4), "confetti": (3, .4, .3), "coinpour": (6, .6, .3), "penscratch": (7, .7, .25),
          "sting": (8, .9, .5), "slidedoor": (4, .5, .3), "textding": (6, .3, .25), "click": (6, .12, .15), "sparkle": (5, .4, .3), "stars9": (5, .6, .3), "gearwhir": (3, .6, .2),
          "boing": (4, .3, .2), "trombone": (3, .9, .5), "knock": (3, .1, .12)}


# ================================================================ scene cues
def cue_title10(T, t0, d, beats):
    """The flyer. The series sting underneath (cue_title7's riser, timpani roll, impact, choir and bells, the noisy riser a little lighter so the tears can be heard), and on top a bouncy pizzicato theme that lands exactly one note on each of the fourteen tears
    (0.22 s apart: eighth notes at 136 bpm, so the downbeat of the second bar is the sting's chord). Fourteen days left, fourteen notes, counting down; then a two-note button."""
    land = t0 + .2 + 2.2                                                                # cue_title7 with a lighter riser (noise would hide the tears; the timpani roll is all low end and keeps its level)
    T.put(riser(2.2, 240, 6200, .85), land - 2.2, .15)
    T.put(roll(70, 2.0, 26), land - 2.0, .26, -.1)
    T.put(impact(1.8), land, .4)
    T.put(crash(2.2), land, .22, .1)
    T.put(choir([45, 52, 57, 60, 64], 2.6, "o", .08, 1.5), land, .18)
    for i, m in enumerate((81, 84, 88, 93)):
        T.put(bell(midi(m), 1.6) * .6, land + .1 + i * .13, .1, -.4 + i * .27)
    lg = beats["logo"][0]
    tears = [lg + .45 + .22 * k for k in range(14)]
    mel = [69, 76, 72, 76, 69, 76, 72, 79, 81, 79, 76, 72, 71, 69]               # A minor, bouncing between the root and the fifth, then stepping down to A
    for k, (at, m) in enumerate(zip(tears, mel)):
        T.put(pizz(midi(m), .2), at, .15 if k % 2 == 0 else .11, -.25 if k % 2 else .25)
        T.put(marimba(midi(m + 12), .18), at + .004, .045, .3 if k % 2 else -.3)
        if k % 2 == 0:
            T.put(pizz(midi(45 if (k // 2) % 2 == 0 else 52), .3), at, .2, 0)
        else:
            T.put(woodblock(), at, .04, .3)
    end = tears[-1] + .24
    T.put(pizz(midi(76), .2), end, .15, -.2)                                         # ba-
    T.put(pizz(midi(81), .5), end + .13, .17, .2)                                    # -dum
    T.put(marimba(midi(93), .5), end + .13, .06, .3)
    T.put(pizz(midi(45), .6), end + .13, .22, 0)
    T.put(bell(midi(100), 1.0) * .6, end + .15, .07, .4)
    T.fade(t0 + d - .5, t0 + d, 1, 0)


def typing_pool(T, a, b, bpm=126, prog=("Dm", "Dm", "Bb", "A"), lvl=1.0, bar0=0):
    """The office as a rhythm section: staccato strings that alternate a pedal note with a figure on the chord, a pizzicato bass on the beat, a woodblock on the off-beats.
    A clerk typing in four-bar paragraphs (Dm Dm Bb A)."""
    for k, at in enumerate(grid(a, b, bpm, .5)):
        bar, j = divmod(k, 8)
        ch = CHORDS10[prog[(bar + bar0) % len(prog)]]
        up = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12]
        if j % 2 == 0:
            T.put(spic(ch[2]), at, .05 * lvl, -.15)
        else:
            T.put(spic(up[j // 2]), at, .075 * lvl, .2)
        if j in (0, 4):
            T.put(pizz(midi(ch[0] - 12), .25), at, .17 * lvl, 0)
        if j in (2, 6):
            T.put(woodblock(), at, .05 * lvl, .3 if j == 2 else -.3)


def pizza_fanfare(T, at, big=1.0):
    """A heraldic fanfare for a pizza, much too grand: three quick pick-up notes (D F# A), then the chord on the word, a tuba under it and a cymbal over it."""
    for k, m in enumerate((74, 78, 81)):
        T.put(brass([m, m - 12], .09, .006, .03, 2400), at - .3 + k * .1, .13 * big, -.2 + .2 * k)
    T.put(brass([62, 66, 69, 74] + ([50, 57] if big > 1 else []), .9 * big, .01, .35, 2400), at, .2 * big, 0)
    T.put(tuba(38, .5 * big), at, .22, 0)
    T.put(crash(1.4), at, .1 * big, .1)
    T.put(timp(73, 1.0), at, .24 * big)


def cue_office10(T, t0, d, beats):
    """2:58 PM. The office as paperwork: a typing pool of staccato strings under the notice, a stab on 'a hundred', a horror sting on 'agency' (the stage goes red), a hero's
    swell for 'I'm going agency.', the Administrator's thinking music and then, each time he says pizza, a fanfare that is much too big."""
    o, s2, a2, s3, th, a3, s4, a4, s5, a5, s6, a6, s7, st, en = (beats[k] for k in ("open", "s2", "a2", "s3", "think", "a3", "s4", "a4", "s5", "a5", "s6", "a6", "s7", "stamp", "end"))
    ag = wt("a2", "agency") - .02
    typing_pool(T, t0 + 1.4, ag - .02)
    hu = wt("s2", "hundred")
    T.put(brass([50, 57, 62, 65], .3, .01, .12, 2000), hu, .15, 0)                    # '$118/HR' lands
    T.put(timp(73, .8), hu, .26)
    T.put(bell(midi(93), .9) * .6, wt("s2", "dollars"), .09, .35)
    T.gate(ag - .02, a2[1] + .2, 0, .015)                                              # the pulse stops dead for the horror beat
    T.put(brass([50, 56, 62, 68], .55, .01, .3, 1500), ag, .22, 0)
    T.put(impact(1.2) * .8, ag, .26)
    T.put(timp(45, 1.4), ag, .3)
    T.put(strings([38, 44, 50, 56], 1.0, .03, .5, 6.5, 1100), ag + .02, .1)
    T.gate(a2[1] + .1, s3[0] + .02, 0, .08)
    T.put(brass([50, 57, 62, 66], 1.4, .3, .4, 1700, swell=.4), s3[0] + .05, .13, 0)  # 'I'm going agency.': low angle, sun behind her
    T.put(strings([50, 57, 62, 66], 1.5, .3, .45, 5.2, 2200), s3[0] + .1, .08)
    T.put(roll(62, 1.0, 14), s3[0] + .35, .14, -.1)
    T.put(pad([38, 45, 50], th[1] - th[0] + .3, .4, .2, 700), th[0] + .05, .07)         # he is thinking
    for k, at in enumerate(grid(th[0] + .1, th[1] - .1, 100, 1.0)):
        T.put(pizz(midi(38 if k % 2 == 0 else 45), .3), at, .17, 0)
    pizza_fanfare(T, a3[0])
    pizza_fanfare(T, a4[0], 1.25)
    T.gate(a4[1] + .35, s5[0] - .08, 0, .03)
    typing_pool(T, s5[0] - .05, a5[1] + .02, lvl=.9, bar0=2)
    for k, m in enumerate((67, 65, 62)):                                               # the empty pocket: plink, plink, plonk
        T.put(pizz(midi(m), .35), a5[1] + .05 + k * .11, .22 - .03 * k, -.1 + .1 * k)
        T.put(marimba(midi(m + 12), .3), a5[1] + .05 + k * .11, .07, .2)
    for k, m in enumerate((62, 64, 65, 67, 69, 70)):                                   # the accusation climbs
        T.put(spic(m + 12, .12), s6[0] + .05 + k * .238, .09 + .01 * k, .2)
    for k, at in enumerate(grid(s6[0] + .05, a6[0] - .1, 126, 1.0)):
        T.put(pizz(midi(38 if k % 2 == 0 else 45), .25), at, .17, 0)
    pz = wt("s6", "pizza")
    T.put(timp(55, .8), pz, .28)
    T.put(brass([57, 62, 66], .2, .01, .08, 2000), pz, .13)
    for k, at in enumerate(grid(a6[0] + .02, s7[0] - .05, 126, 1.0)):                  # 'That's the pizza budget.': an oom-pah band, no idea
        T.put(tuba([38, 45][k % 2], .22), at, .2, 0)
        T.put(brass([57, 62, 66], .1, .006, .04, 1800), at + .119, .09, .1)
    T.put(crash(1.0), wt("a6", "pizza"), .07, .1)
    T.gate(s7[0] - .06, st[0] + .2, 0, .03)
    T.put(strings([38, 45, 50, 53], 1.5, .5, .6, 5.0, 900), s7[0], .08)                # 'Of course it is.' and the long exhale
    T.put(slide_brass(53, 50, .9, 700), s7[1] - .35, .1, 0)
    T.gate(st[0] + .15, st[0] + .6, 0, .01)                                            # RECEIVED: nothing but the stamp, then one dry note after it
    T.put(timp(73, .8), st[0] + .62, .2)
    T.put(pizz(midi(38), .5), st[0] + .62, .2, 0)
    T.fade(t0 + d - .6, t0 + d, 1, 0)


def groove(T, a, b, prog, bass, comp, mel_pat=None, bpm=138.0, lvl=1.0, mel=None, mel_gain=.09, bar0=0):
    """A bar-locked montage groove between a and b (the tempo is bent a hair so whole bars fit exactly: a downbeat on a and on b): a bass on 1, 3 and the and-of-2 and 4, a
    `comp(T, at, chord, beat_len, beat_in_bar, lvl)` on the off-beats, and a line of sixteenths picked out of the chord. `bass` and `mel` take (midi, duration)."""
    times, bl = groove_times(a, b, 4, bpm)
    mel = mel or (lambda m, d: marimba(midi(m), d))
    for i, at in enumerate(times):
        bar, j = divmod(i, 4)
        ch = CHORDS10[prog[(bar + bar0) % len(prog)]]
        root = ch[0] - 12 if ch[0] >= 48 else ch[0]
        if j in (0, 2):
            T.put(bass(root, bl * .45), at, .2 * lvl, 0)
        else:
            T.put(bass(root + 7, bl * .3), at + bl * .5, .12 * lvl, 0)
        comp(T, at, ch, bl, j, lvl)
        if mel_pat:
            for h in range(4):
                n = mel_pat[(j * 4 + h) % len(mel_pat)]
                T.put(mel(ch[n % 3] + 12 * (2 + n // 3), bl * .22), at + h * bl / 4, mel_gain * lvl * (1 if h % 2 == 0 else .7), .35 if h % 2 else -.35)
    return times, bl


def slide_whistle(m0, m1, d, vib=6.0):
    """A slide whistle: a sine that glides from one note to another with a wobble. The sound of something being squashed or falling."""
    t = tarr(d)
    f = np.linspace(midi(m0), midi(m1), len(t)) * (1 + .012 * np.sin(2 * np.pi * vib * t))
    return osc("sine", f, d) * ar(d, .01, min(.12, d * .4)) * .5


def comp_stern(T, at, ch, bl, j, lvl):
    if j in (1, 3):
        T.put(woodblock(), at, .07 * lvl, .3 if j == 1 else -.3)
    T.put(spic(ch[1] + 12, .1), at + bl / 2, .06 * lvl, .2)


def comp_game(T, at, ch, bl, j, lvl):
    T.put(brass([ch[0] + 12, ch[1] + 12, ch[2] + 12], .13, .006, .04, 2000), at + bl / 2, .1 * lvl, .1)
    T.put(hat(), at, .05 * lvl, .4)
    T.put(hat(), at + bl / 2, .035 * lvl, -.4)
    if j in (1, 3):
        T.put(clap(), at, .1 * lvl, .2)
    if j in (0, 2):
        T.put(kick(), at, (.2 if j == 0 else .15) * lvl, 0)


def comp_laid(T, at, ch, bl, j, lvl):
    if j == 0:
        T.put(vibes(midi(ch[1] + 12), 1.6), at, .09 * lvl, -.2)
        T.put(vibes(midi(ch[2] + 12), 1.6), at + .01, .07 * lvl, .25)
    T.put(shaker(), at, .04 * lvl, .3)
    T.put(shaker(), at + bl / 2, .03 * lvl, -.3)
    if j in (1, 3):
        T.put(brush(.15), at, .08 * lvl, .2)


def comp_uke(T, at, ch, bl, j, lvl):
    uke(T, at + bl / 2, [n + 12 for n in ch] + [ch[0] + 24], .07 * lvl, .35)
    T.put(shaker(), at, .04 * lvl, .3)
    if j in (1, 3):
        T.put(clap(), at, .09 * lvl, .2)
    if j == 0:
        T.put(kick(), at, .16 * lvl, 0)


MEL16 = [0, 1, 2, 3, 2, 1, 0, 1, 2, 4, 3, 2, 1, 2, 0, 1]   # a sixteenth-note figure picked out of the chord (indices into its tones, three to the octave)


def cue_days10(T, t0, d, beats):
    """The next two weeks. One groove in four colours, bent a hair so that a downbeat lands on every calendar flip (the page rips on the bar line). It opens in E minor because the
    office's sad trombone, which is still sounding when this scene begins, lands on E: E minor for Lemon's rules (woodblock and timpani on each thing she forbids), E major
    game-show brass for the donut, a laid-back C sharp minor vibraphone for the break room, a ukulele in A for Clementine; at the end the closet empties the band down to nothing."""
    op, fl1, fl2, fl3, en = (beats[k] for k in ("open", "flip1", "flip2", "flip3", "end"))
    pz = lambda m, d_: pizz(midi(m), d_)
    # --- 1: hall, E minor, five bars of stern; the last bar on B leans into E major
    groove(T, op[0] + .05, fl1[0], ("Em", "Em", "C", "B", "B"), pz, comp_stern, MEL16, bpm=125, lvl=1.0, mel_gain=.075)
    T.gate(op[0] + .05, op[0] + 1.1, 0, .05)                                                # the sad trombone is still holding its E: let it finish before the band starts
    for w in ("call-outs", "vacation", "sick"):
        at = wt("l1", w)
        T.put(woodblock(), at, .17, 0)
        T.put(timp(82, .6), at, .22)
        T.put(brass([40, 47, 52], .16, .008, .06, 1600), at, .1)
    T.put(tuba(40, .5), wt("l2", "changes") - .05, .2, 0)
    runup = lambda at, notes: [T.put(marimba(midi(m), .22), at + k * .075, .06 + .01 * k, -.4 + .16 * k) for k, m in enumerate(notes)]
    runup(fl1[0] - .4, (64, 67, 71, 76, 79))                                                # a run up into every flip, so the downbeat is the page ripping
    runup(fl2[0] - .4, (64, 68, 71, 76, 80))
    runup(fl3[0] - .4, (69, 73, 76, 81, 85))
    # --- 2: staff appreciation, E major game show
    T.put(timp(82, .8), fl1[0], .14)
    T.put(brass([52, 56, 59, 64], .4, .01, .2, 2200), fl1[0], .08, 0)
    groove(T, fl1[0], fl2[0], ("E", "A", "E", "B"), tuba, comp_game, MEL16, bpm=138, lvl=1.0, mel=lambda m, d_: bell(midi(m), d_ * 2) * .6, mel_gain=.07)
    T.put(brass([64, 68, 71, 76], .4, .01, .2, 2400), wt("a1", "donut"), .16, 0)          # 'Staff Appreciation Week! One donut per nurse!'
    T.put(timp(82, .6), wt("a1", "donut"), .2)
    T.put(slide_brass(52, 40, .8, 700), wt("s2", "donut") + .05, .14, 0)                  # 'That's one donut.'
    la = wt("a2", "large")
    T.put(riser(.9, 300, 3000, .4), la - .5, .2)                                           # 'It's a very large donut.'
    T.put(brass([40, 47, 52, 56, 59], .8, .06, .3, 1900, swell=.3), la, .12, 0)
    T.put(marimba(midi(47), .3), beats["a2"][1] + .1, .13, -.3)                            # Mango pokes it: boing
    T.put(marimba(midi(71), .3), beats["a2"][1] + .21, .12, .3)
    # --- 3: break room, C sharp minor, tired fluorescent
    T.put(timp(69, .8), fl2[0], .13)
    groove(T, fl2[0], fl3[0], ("C#m", "A", "E", "B"), pz, comp_laid, MEL16, bpm=138, lvl=1.0, mel=lambda m, d_: vibes(midi(m), d_ * 3) * .8, mel_gain=.06)
    for k in range(2):                                                                      # 'They posted your job twice.': ding, ding, once she has finished
        T.put(bell(midi(85), .6) * .6, beats["m1"][1] + .03 + k * .14, .1, .3)
    T.put(pizz(midi(49), .4), wt("s3", "thirty") + .02, .2, 0)                              # '$34.'
    T.put(pizz(midi(44), .4), wt("s3", "thirty") + .2, .17, 0)
    hh = wt("s3", "hundred")                                                                # '...and a hundred and eighteen.'
    for k, m in enumerate((61, 64, 68, 73, 76, 80)):
        T.put(marimba(midi(m), .22), hh + k * .07, .07, -.4 + .16 * k)
    T.put(bell(midi(97), 1.0) * .6, hh + .45, .055, .3)
    T.put(tuba(37, .5), beats["a3"][1] - .45, .2, 0)                                        # 'Different budget.'
    # --- 4: Clementine, A major, ukulele
    T.put(timp(55, .8), fl3[0], .14)
    T.put(brass([45, 52, 57, 61], .3, .01, .15, 2000), fl3[0], .08, 0)
    groove(T, fl3[0], en[0], ("A", "E", "F#m", "D"), pz, comp_uke, MEL16, bpm=138, lvl=1.0, mel=lambda m, d_: marimba(midi(m), d_), mel_gain=.085)
    for k, m in enumerate((69, 73, 76, 81)):                                                # 'Hi!'
        T.put(marimba(midi(m), .22), wt("c1", "hi") + .02 + k * .08, .06, -.3 + .2 * k)
    T.put(slide_whistle(81, 52, .45), wt("s4", "marmalade"), .1, 0)                         # 'You became marmalade.'
    T.put(marimba(midi(76), .25), beats["c2"][1] + .02, .12, .3)                            # 'Sure!' answered with a bounce, in the gap after each
    T.put(marimba(midi(81), .25), beats["c2"][1] + .13, .12, .3)
    for c in ("c3", "c4"):
        T.put(marimba(midi(69), .25), beats[c][1] + .0, .13, -.3)
        T.put(marimba(midi(76), .3), beats[c][1] + .11, .13, .3)
    T.gate(beats["s5"][0] - .05, en[0] + 1.3, .35, .12)                                     # the closet: the band empties out
    T.put(tuba(45, .6), wt("s6", "aren't"), .17, 0)
    T.gate(beats["c4"][1] + .12, en[0] + 1.25, 0, .05)
    T.put(bell(midi(88), 1.4) * .6, en[0] + 1.1, .06, .3)
    T.fade(t0 + d - .7, t0 + d, 1, 0)


def sigh(T, at, top, drop=3, lvl=1.0):
    """The lonely clarinet's sigh: a note and then a longer one a few semitones below it."""
    T.put(clarinet(top, .3), at, .13 * lvl, .2)
    T.put(clarinet(top - drop, .6, a=.06), at + .3, .12 * lvl, .2)


def cue_exit10(T, t0, d, beats):
    """10:30 PM. As cold as a filing cabinet: a clock that has been ticking since three, a bare fifth in the strings, and a lonely clarinet that sighs after every 'Money.'. The
    stamp gets silence. A low swell for 'Pen.' and, for 'I shared it for four years.', the only warm chord in the scene."""
    o, s1, s2, s3, s4, st, a5, hd, a6, s6, en = (beats[k] for k in ("open", "s1", "s2", "s3", "s4", "stamp", "a5", "hand", "a6", "s6", "end"))
    T.put(strings([38, 45, 57], d - .6, 1.0, 1.0, 4.6, 700), t0 + .3, .06)
    for i, at in enumerate(beat_times(t0 + .3, st[0] + .02, 63)):
        tock(T, i, at, 1.0)
    T.gate(st[0] + .02, a5[0] - .08, 0, .01)                                         # the stamp: nothing but the stamp
    for i, at in enumerate(beat_times(a5[0] - .05, en[0] + .15, 63)):
        tock(T, i, at, 1.0)
    sigh(T, s1[1] + .12, 69, 4)
    sigh(T, s2[1] + .12, 65, 3)
    sigh(T, s3[1] + .1, 69, 4)
    T.put(clarinet(74, .3), s4[1] + .06, .14, .2)                                      # 'It's the only option.': the biggest sigh, three steps down
    T.put(clarinet(69, .3), s4[1] + .34, .13, .2)
    T.put(clarinet(65, .8, a=.06), s4[1] + .62, .12, .2)
    T.put(strings([38, 44, 50], hd[1] - hd[0] - .4, .6, .05, 5.0, 800), hd[0] + .6, .08)   # 'Pen.' is coming
    T.gate(a6[0] - .02, a6[0] + .02, 0, .01)
    T.put(strings([50, 57, 62, 65], s6[1] - s6[0] + .4, .5, .6, 5.0, 1500), s6[0] - .1, .08)  # 'I shared it for four years.'
    for k, (m, off, dd) in enumerate(((74, .08, .22), (72, .31, .22), (69, .54, .4))):
        T.put(clarinet(m, dd, a=.04), s6[1] + off, .14, .2)
    T.fade(t0 + d - .6, t0 + d, 1, 0)


# ---- the farewell waltz: G major, 92 bpm. Eight bars: G C G D | G Em D7 G; the tune is a rising arpeggio, a held peak, a step-wise fall, a half close
WALTZ_CH = ("G", "C", "G", "D", "G", "Em", "D7", "G")
WALTZ_BASS = {"G": 43, "C": 48, "D": 50, "Em": 40, "D7": 50}
WALTZ_PAH = {"G": (59, 62, 67), "C": (64, 67, 72), "D": (62, 66, 69), "Em": (59, 64, 67), "D7": (60, 62, 66, 69)}
# melody: (beat in bar, midi, beats long)
WALTZ_TUNE = [[(0, 67, 1), (1, 71, 1), (2, 74, 1)], [(0, 76, 3)], [(0, 74, 1), (1, 72, 1), (2, 71, 1)], [(0, 69, 3)],
              [(0, 67, 1), (1, 71, 1), (2, 74, 1)], [(0, 79, 3)], [(0, 78, 1), (1, 76, 1), (2, 74, 1)], [(0, 67, 3)]]


def waltz_bar(T, at, bl, k, lvl=1.0, flat=0.0, mel=None, mel_gain=.1, omit_peak=False, pah_gain=.06):
    """One bar of the waltz at `at`, `bl` seconds per beat: 'oom' (a pizzicato bass), 'pah-pah' (a piano chord), the tune on `mel(midi, dur)`. `flat` drops everything that
    many semitones; `omit_peak` leaves out the held note of the bar (the missing R)."""
    ch = WALTZ_CH[k % 8]
    T.put(pizz(midi(WALTZ_BASS[ch] - flat), bl * .9), at, .2 * lvl, -.1)
    for b in (1, 2):
        for m in WALTZ_PAH[ch]:
            T.put(piano(m - flat, bl * .8, .55), at + b * bl + (m - WALTZ_PAH[ch][0]) * .004, pah_gain * lvl, .15)
    if mel is not None and not omit_peak:
        for off, m, dd in WALTZ_TUNE[k % 8]:
            T.put(mel(m - flat, dd * bl * .96), at + off * bl, mel_gain * lvl, .1)


def cue_party10(T, t0, d, beats):
    """10:50 PM. A warm farewell waltz that cannot keep its feet: the tune's held note is missing on 'It's missing an R.' (the waltz trips on the empty bar), it slows and goes
    flat on 'Four dollars and seventeen cents.' until the coins clear its throat, a doo-wop vibraphone for 'Come back by 1962!', a swell for 'I love you.' 'I know.' that arrives
    only when it has been earned, then Lemon's deadpan bar lines, and silence for the sting."""
    op, m1, l2, cn, m3, r1, m5, s4, l3, en = (beats[k] for k in ("open", "m1", "l2", "coins", "m3", "r1", "m5", "s4", "l3", "end"))
    T.put(pad([43, 50, 55, 59, 62], 1.5, .25, .6, 1500), op[0] + .15, .06)                # the surprise
    for k, m in enumerate((79, 83, 86, 91)):
        T.put(bell(midi(m), 1.0) * .6, op[0] + .6 + k * .09, .035, -.3 + .2 * k)
    bl0 = 60 / 92
    t, bar = m1[0], 0
    vio = lambda m, dd: violin(m, dd)
    clr = lambda m, dd: clarinet(m, dd, a=.05)
    box = lambda m, dd: music_box(midi(m + 12), dd)
    while t < en[0] - .1:
        bl, flat, lvl, om, mel, mg = bl0, 0.0, 1.0, False, vio, .1
        if bar == 1:
            om = True                                                                      # the missing R: the held note is not there
        if bar in (3, 4):                                                                   # four dollars and seventeen cents: the waltz limps
            bl, flat, lvl = (bl0 * 1.12, .15, .9) if bar == 3 else (bl0 * 1.35, .5, .7)
        if bar == 7:                                                                        # 1962: the waltz sits this bar out for a doo-wop turn on vibes
            doowop(T, t)
            t += 3 * bl
            bar += 1
            continue
        if bar < 2:
            lvl, mg = .75, .08                                                              # the first bars sit under 'We got you a cake!'
        if bar >= 8:
            mel, mg = box, .08
        if 8 <= bar <= 10:
            lvl = .75
        if m5[0] - .3 <= t < s4[1] + .3:
            mel, lvl = None, .7
        if t >= l3[0] - .2:
            mel, lvl = None, .5                                                             # Lemon's reports: no tune, only the bar lines
        waltz_bar(T, t, bl, bar, lvl, flat, mel, mg, om, pah_gain=.05)
        t += 3 * bl
        bar += 1
    for ln in ("m3", "m4", "l3"):                                                          # the quieter voices get a little more room
        T.gate(beats[ln][0] - .05, beats[ln][1] + .05, .75, .08)
    T.gate(beats["card"][0], beats["card"][1], .5, .1)                                     # and the pens, who are writing a card, a little more
    T.put(slide_brass(55, 51, .9, 800), l2[0] + .65, .13, 0)                               # 'Four dollars and seventeen cents': a tuba sags
    T.put(timp(98, .5), cn[1] - .1, .12)                                                    # and the coins clear the room's throat
    sw0, sw1 = m5[0] - .35, s4[1] + .05                                                    # I love you. / I know.
    T.put(strings([55, 59, 62, 67], sw1 - sw0 + .3, .7, .08, 5.2, 2200), sw0, .085)
    T.put(strings([60, 64, 67, 72], .75, .25, .2, 5.2, 2000), m5[1] - .2, .08)
    T.put(strings([62, 66, 69, 74], .5, .1, .15, 5.2, 2000), s4[0] - .05, .08)
    T.put(piano(55, 2.0, .7), sw0 + .1, .07, -.2)
    T.put(piano(67, 1.8, .7), m5[1] + .08, .07, .2)
    T.put(strings([55, 59, 62, 67, 71], 2.2, .15, 1.2, 5.0, 2600), s4[1] + .02, .09)       # resolution, as soon as the line is over
    T.put(violin(79, 1.6, a=.1), s4[1] + .1, .09, .1)
    T.put(music_box(midi(91), 1.2), s4[1] + .22, .1, .3)
    for line in ("l3", "s5", "l4"):                                                        # Lemon's reports: a single dry note after each line
        T.put(pizz(midi(43), .5), beats[line][1] + .07, .22, 0)
    T.gate(en[0] - .02, t0 + d, 0, .01)                                                    # the last beat belongs to the sting; the waltz has nothing to add
    T.fade(t0 + d - .7, t0 + d, 1, 0)


def doowop(T, at):
    """Mrs. Cranberry lives in 1962: four chords (G Em C D) on vibraphone, an upright bass and a brush, a beat apiece."""
    for k, (m, c) in enumerate(((74, "G"), (71, "Em"), (67, "C"), (69, "D"))):
        a = at + .02 + k * .42
        T.put(vibes(midi(m + 12), .9), a, .075, -.2)
        T.put(vibes(midi(WALTZ_PAH[c][0] + 12), .9), a + .01, .05, .25)
        T.put(pizz(midi(WALTZ_BASS[c]), .35), a, .18, 0)
        T.put(brush(.15), a + .21, .07, .2)


def march_beat(T, k, at, stage, b):
    """One beat of the march: the tuba on 1 and 3, on 2 and 4 the snare and a chord from the horns. Stage 0 is the full band, 1 has lost its brass, 2 is only the tuba, 3 is the
    whole band again, much too loud."""
    g = (1.0, .85, .6, 1.0)[stage]
    if k % 2 == 0:
        T.put(tuba([38, 45][(k // 2) % 2], .45), at, .2 * g, 0)
    else:
        if stage != 2:
            T.put(snare() * .8, at, .1 * g, .1)
        if stage in (0, 3):
            T.put(brass([57, 62, 66], .2, .006, .06, 1800), at, .09, .1)


def cue_door10(T, t0, d, beats):
    """11:00 PM. A stately march in D major (tuba and snare, trumpets on the tune) that loses a piece of itself with every deduction: the brass at the cake, the snare at the
    banner, until a kazoo is left to play it on 'We're reusing it.'; then, on 'Thank you for your service!', the whole band comes back much too loud, and plays her out."""
    op, a1, s1, a2, a3, a4, out = (beats[k] for k in ("open", "a1", "s1", "a2", "a3", "a4", "out"))
    b = 60 / 100
    T.put(roll(73, .9, 12), op[0] + .15, .14, -.1)                                         # the ceremony begins with a roll
    march0 = a1[0] - .05
    for k, at in enumerate(grid(march0, out[1], 100, 1.0)):
        stage = 3 if at >= a4[0] - .03 else 0 if at < s1[1] else 1 if at < a2[1] else 2
        march_beat(T, k, at, stage, b)
    tune = [(74, 1), (74, 1), (81, 2), (79, 1), (78, 1), (76, 2), (74, 1), (74, 1), (81, 2), (79, 1), (81, 1), (86, 2)]
    t = march0 + 2 * b
    for m, nb in tune:                                                                       # the tune, a note a beat: open trumpets, thinner, muted, kazoo
        dd = nb * b
        if t >= a4[0] - .1:
            break
        if t < s1[0] - .1:
            T.put(brass([m, m - 12], dd * .9, .02, .1, 2200), t, .11, 0)
        elif t < a2[0]:
            T.put(brass([m], dd * .9, .02, .1, 1600), t, .07, 0)
        elif t < a3[0] - .1:
            T.put(mtrumpet(m, dd * .9, vel=.8), t, .09, .1)
        else:
            T.put(kazoo(m, dd * .8), t, .08, .1)
        t += dd
    T.put(slide_brass(55, 43, .8, 700), wt("s1", "cake") + .05, .13, 0)                  # 'Less the cake?'
    T.put(pizz(midi(38), .3), wt("a2", "banner") + .05, .2, 0)
    T.put(brass([62, 66, 69, 74], 1.0, .01, .3, 2400), a4[0] - .02, .2, 0)                # 'Thank you for your service!'
    T.put(crash(1.6), a4[0] - .02, .1, .1)
    T.put(timp(73, 1.0), a4[0] - .02, .28)
    for k, m in enumerate((74, 78, 81, 86)):
        T.put(brass([m, m - 12], .12, .006, .05, 2400), a4[0] + .98 + k * .12, .1, -.2 + .15 * k)
    T.gate(out[0] + .02, out[0] + .9, .6, .1)                                              # the doors and the cheer need room
    T.put(brass([62, 66, 69, 74], .9, .01, .4, 2400), out[0] + 1.0, .17, 0)              # the last chord as the door closes
    T.put(crash(1.4), out[0] + 1.0, .08, .1)
    T.put(timp(73, 1.0), out[0] + 1.0, .24)
    T.fade(t0 + d - .6, t0 + d, 1, 0)


def cue_lot10(T, t0, d, beats):
    """11:00 PM. Night, a nylon guitar fingerpicking under the crickets (Am F C G: it turns major and hopeful), the Moon's four bells on each of its lines, and on ACCEPT a
    rising glockenspiel into a warm C-major swell."""
    op, pg, mo1, mo2, tap, s3 = (beats[k] for k in ("open", "ping", "mo1", "mo2", "tap", "s3"))
    voices = {"Am": [45, 52, 57, 60, 64], "F": [41, 48, 53, 57, 60], "C": [48, 55, 60, 64, 67], "G": [43, 50, 55, 59, 62]}
    pat = [0, 2, 3, 4, 3, 2, 4, 3]
    prog = ["Am", "F", "C", "G"]
    b8 = 60 / 66 / 2
    for k, at in enumerate(grid(op[0] + .4, tap[0] + .2, 66, .5)):
        v = voices[prog[(k // 8) % 4]]
        T.put(nylon(v[pat[k % 8]], 1.1), at, .17 if k % 4 == 0 else .12, -.2 + .08 * (k % 5))
    T.put(pad([45, 52, 57, 60], tap[0] - op[0], 1.4, .3, 900), op[0] + .1, .06)
    T.gate(mo1[0] - .05, mo1[1] + .05, .6, .08)
    T.gate(pg[0] + .1, pg[0] + .7, .35, .05)                                               # the phone has something to say
    moon_motif(T, mo1[0] - .35, .09, .35)
    # ACCEPT: a glockenspiel pick-up into the stars, and the warm chord under them
    for k, m in enumerate((72, 76, 79, 84, 88)):
        T.put(bell(midi(m), .7) * .6, tap[0] + .12 + k * .065, .07, -.3 + .15 * k)
    T.put(strings([48, 55, 60, 64, 67, 74], mo2[0] - tap[0] - .9 + .5, .7, .5, 5.2, 2400), tap[0] + .9, .13)     # the chord blooms after the stars have been heard
    T.put(choir([60, 64, 67], mo2[0] - tap[0] - .95 + .4, "a", .6, .5), tap[0] + .95, .1)
    T.put(strings([48, 55, 60, 64], d - (mo2[0] - t0) - .1, .5, 1.0, 5.2, 1800), mo2[0] - .1, .07)
    T.put(pluck(midi(36), 1.0, 700, .4), tap[0] + .6, .2, 0)
    for k, at in enumerate(grid(tap[1] + .1, s3[1] + .3, 66, .5)):
        v = voices[["C", "G", "C"][(k // 8) % 3]]
        T.put(nylon(v[pat[k % 8]], 1.1), at, .13, -.2 + .08 * (k % 5))
    T.gate(mo2[0] - .05, mo2[1] + .05, .6, .08)
    T.put(bell(midi(96), 1.6) * .6, s3[1] + .1, .07, .3)
    T.fade(t0 + d - 1.0, t0 + d, 1, 0)


CUES = {"title": cue_title10, "office": cue_office10, "days": cue_days10, "exit": cue_exit10, "party": cue_party10, "door": cue_door10, "lot": cue_lot10, "end": cue_end7}
LEVEL10 = {"office": 1.12, "days": 1.25, "exit": 2.4, "party": 2.25, "door": 1.4, "lot": 1.45}   # per-scene trim, set from the measured stems (see the report)


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    T = Track(N)
    _CTX["lines"] = {(ln["scene"], ln["id"]): ln for ln in lines}
    for sc in scenes:
        fn = CUES.get(sc["id"])
        if not fn:
            continue
        _CTX["scene"] = sc["id"]
        t0 = sc["start"]
        beats = {k: (t0 + v["s"], t0 + v["e"]) for k, v in sc["beats"].items()}
        mine = sc["id"] in LEVEL10
        U = Track(N) if mine else T
        fn(U, t0, sc["dur"], beats)
        if mine:
            T.buf += U.buf * LEVEL10[sc["id"]]
        T.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.0, 0.0, .15)   # a cue's tail never bleeds into the next scene
    return hall(T.buf, wet=.55, rt=1.6) * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS10)[None, :]
