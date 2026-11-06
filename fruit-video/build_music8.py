"""Episode 8 score: a night shift that will not end. Tired, ticking, and a little funny.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music8; the mixer ducks it under every voice.
  station  a clock that has been ticking since three o'clock: muted pizzicato pulse, tick-tock, a vibraphone sigh that arrives late. 'Mandatory' tightens it.
  hall     a nervous pulse that speeds up and piles on layers as the alarms stack, then dead silence for 'Forty residents. One nurse.', then a sprint
  break    almost nothing: a warm pad, four piano notes, a swell for the middle square
  dawn     the first major chords of the night, the Moon's bells, a music box as it sets
  report   the day shift's over-caffeinated theme, soured by the Q word, then the night's clock comes back for the last lines
title and end reuse Episode 7's fanfare layer (riser, timpani roll, choir, bells / strings, brass, kick) under the script's own theme7 sting, so the logo sounds
the way it did last time. Instruments come from build_music6 / build_music7; nothing is sampled.
"""
import numpy as np

from build_audio import midi, bp
from build_music6 import (Track, hall, pizz, marimba, epiano, bell, vibes, sub_bass, pad, strings, brass, kick, clap, hat, shaker, timp, roll, riser,
                          tick, MUSIC_GAIN, _n)
from build_music7 import CH7, music_box, woodblock, slide_brass, moon_motif, cue_title7, cue_end7

R8 = np.random.default_rng(2608)
CH8 = dict(CH7, Dm=[50, 53, 57], Gm=[43, 46, 50], Eb=[51, 55, 58], Cm=[48, 51, 55], D7=[50, 54, 57, 60])


def reg(n, lo):
    """Move a note up by octaves until it sits at or above lo."""
    return n + 12 * max(0, -(-(lo - n) // 12))


def arp(ch, lo):
    return sorted(reg(n, lo) for n in CH8[ch])


def root(ch):
    """The chord's root in the bass register (C2 to B2)."""
    return (CH8[ch][0] - 36) % 12 + 36


def beat_times(a, b, bpm0, bpm1=None, per=1.0, curve=1.0):
    """Times from a to b on a grid of `per` beats while the tempo glides from bpm0 to bpm1 (the clock the tension is built on)."""
    bpm1 = bpm0 if bpm1 is None else bpm1
    out, t = [], a
    while t < b:
        out.append(t)
        t += per * 60 / (bpm0 + (bpm1 - bpm0) * min(1.0, ((t - a) / max(.01, b - a)) ** curve))
    return out


def tock(T, i, at, g=1.0):
    """One tick of the clock, alternating ears and weight: tick, tock."""
    T.put(tick(), at, (.16 if i % 2 == 0 else .09) * g, .3 if i % 2 == 0 else -.3)


def sigh(T, at, ch, g=1.0, late=.11):
    """The weary figure: three falling vibraphone notes, each a little behind where the beat wants it."""
    n = CH8[ch]
    for k, (nn, off) in enumerate(((n[2] + 12, 0.0), (n[1] + 12, .52), (n[0] + 12, 1.1))):
        T.put(vibes(midi(nn), 1.5), at + off + late, (.10 - .015 * k) * g, -.25 + .25 * k)


# ================================================================ scene cues
def cue_station8(T, t0, d, beats):
    """10:52 PM. A clock that has been ticking since three. The form tightens it; 'It says mandatory.' is where it gets taut."""
    a0, f0 = beats["open"][1] - .1, beats["form"][0]
    prog = ["Dm", "Bb", "Gm", "A"]
    b = 60 / 66
    for i, at in enumerate(beat_times(a0, f0 - .02, 66)):
        bar, step = divmod(i, 4)
        ch = prog[bar % 4]
        tock(T, i, at)
        if step in (0, 2):                                                       # a muted bass pulse: the root, then the fifth
            T.put(pizz(midi(root(ch) + (7 if step else 0)), .3), at, .24 if step == 0 else .15, 0)
        if step == 0:
            T.put(pad([n + 12 if n < 50 else n for n in CH8[ch]], 4 * b + .8, .9, .9, 900), at, .05)
        if step == 1:
            sigh(T, at, ch)
    dp2 = beats["dp2"][0]                                                        # 'Last night was quiet.': a faint wrong chord under it
    T.put(strings([38, 45, 50, 56], 2.4, .5, .9, 5.0, 900), dp2 + .4, .06)
    T.put(woodblock(), beats["l3"][1] + .12, .12, .3)                            # 'You are.' / 'It's staffing.': deadpan woodblock
    T.put(woodblock(), beats["l5"][1] + .12, .12, -.3)
    # the form: a timpani stamp and a brass stab, then the pulse climbs from 84 to 126 bpm in eighths
    T.put(timp(62, .9), f0 + .12, .4)
    T.put(brass([57, 60, 64], .22, .01, .08, 1600), f0 + .12, .16)
    s7 = beats["s7"]
    end = s7[0] - .04
    ts = beat_times(f0 + .35, end, 84, 126, .5)
    T.put(strings([38, 45, 50, 57], end - f0 + .4, 1.0, .2, 6.5, 1200), f0, .07)
    for i, at in enumerate(ts):
        lvl = i / max(1, len(ts) - 1)
        T.put(tick(), at, .09 + .13 * lvl, .3 if i % 2 else -.3)
        if i % 2 == 0:
            T.put(pizz(midi(root(prog[(i // 8) % 4])), .22), at, .18 + .08 * lvl, 0)
    for k, nn in enumerate((74, 78, 81, 86)):                                    # Mango loves overtime: one cheerful run in the wrong room
        T.put(marimba(midi(nn), .25), beats["m2"][0] + .12 + k * .11, .13, -.3 + .2 * k)
    T.put(bell(midi(96), 1.2) * .6, beats["m3"][1] - .1, .1, .4)                 # 'Time and a half.' ka-ching
    # '...Fine.': the pulse stops, one low note, a trombone that gives up
    T.put(pizz(midi(38), .6), s7[0] + .05, .3, 0)
    T.put(slide_brass(62, 55, 1.0, 800), s7[0] + .2, .14, 0)
    T.fade(t0 + d - .6, t0 + d, 1, 0)


def cue_hall8(T, t0, d, beats):
    """2:47 AM. Nervous eighths that speed up and stack with the alarms, a dead stop for 'Forty residents. One nurse.', then a sprint."""
    a0, stop = beats["open"][0] + .2, beats["s4"][0] - .05
    al = beats["all"]
    L = {"mar": beats["m1"][0], "hat": beats["s2"][0], "kick": beats["chime"][1], "bell": beats["s3"][0]}
    ts = beat_times(a0, stop, 104, 156, .5, 1.1)
    for i, at in enumerate(ts):
        lvl = i / max(1, len(ts) - 1)
        shift = [0, -4, -5, -2][(i // 8) % 4]
        T.put(pizz(midi(38 + shift + [0, 0, 12, 0, 0, 7, 0, 12][i % 8]), .2), at, (.2 if i % 4 == 0 else .13) + .06 * lvl, -.1)
        if at >= L["mar"]:
            dt = (ts[i + 1] - at) if i + 1 < len(ts) else .2
            base = [74, 70, 69, 72][(i // 8) % 4]
            for h in (0, 1):
                T.put(marimba(midi(base + [0, 3, 7, 3, 0, 3, 7, 10][(i * 2 + h) % 8]), .16), at + h * dt / 2, .08 + .04 * lvl, .5 if (i + h) % 2 else -.5)
        if at >= L["hat"]:
            T.put(hat(), at, .07 + .05 * lvl, .4)
            if i % 2:
                T.put(shaker(), at, .05, -.4)
        if at >= L["kick"] and i % 2 == 0:
            T.put(kick(), at, .22 + .08 * lvl, 0)
            if i % 4 == 2:
                T.put(clap(), at, .14, .1)
        if at >= L["bell"] and i % 2 == 0:
            T.put(bell(midi(84), .4) * .6, at, .07 + .03 * lvl, -.4 if i % 4 else .4)
            if lvl > .55 and i % 4 == 3:
                T.put(brass([57, 60, 64], .16, .008, .05, 1800), at, .12, 0)
    # the alarms stack: a pump, a pulse, a chair, a door; a bell climbs with each
    T.put(riser(stop - al[0] + .3, 300, 5200, .6), al[0] - .3, .28)
    T.put(roll(70, max(.8, stop - al[0]), 22), al[0], .22, -.1)
    for off, nn, pan in ((.1, 79, -.5), (.4, 84, -.2), (.7, 88, .2), (1.0, 91, .5)):
        T.put(bell(midi(nn), .8) * .6, al[0] + off, .11, pan)
    # 'Forty residents. One nurse. And me. And you.': nothing. Two low plucks for the punchlines.
    T.gate(stop, beats["s6"][1] + .12, 0.0, .02)
    T.put(pizz(midi(38), .6), beats["s5"][1] + .08, .3, 0)
    T.put(pizz(midi(36), .6), beats["s6"][1] + .06, .3, 0)
    run = beats["run"][0]
    for k, nn in enumerate((62, 65, 69, 72, 74, 77, 81, 84, 86, 89)):          # and they run
        T.put(marimba(midi(nn), .2), run + .05 + k * .11, .12, -.5 + .11 * k)
    T.put(clap(), run + 1.2, .18, 0)
    T.fade(t0 + d - .5, t0 + d, 1, 0)


def cue_break8(T, t0, d, beats):
    """3:34 AM. Almost nothing: a warm pad that is simply there, a few piano notes, and a swell for the middle square."""
    c0, sit, dab = beats["calm"][0] + .2, beats["sit"], beats["dab"]
    T.put(pad([53, 57, 60, 64], sit[1] - c0 + 1.4, 1.4, 1.4, 800), c0, .075)
    for k, nn in enumerate((72, 69, 65)):                                        # the piano, alone, one note at a time
        T.put(epiano(midi(nn), 1.8, .35), sit[0] + .15 + k * .62, .13, -.2 + .2 * k)
    T.put(pad([50, 53, 57], beats["s3"][1] - beats["m2"][0] + 1.6, 1.0, 1.2, 800), beats["m2"][0], .055)
    T.put(epiano(midi(64), 2.0, .3), beats["s3"][1] + .15, .12, .1)              # 'I've forgotten.'
    # the card: a pad and strings open up, the card's ding is answered by a music box, one hopeful piano note
    sw = beats["m4"][1] - dab[0] + 1.8
    T.put(pad([60, 64, 67, 71], sw, 1.3, 1.3, 1500), dab[0] + .05, .11)
    T.put(strings([60, 64, 67, 71], sw - .3, 1.2, 1.0, 5.0, 1800), dab[0] + .2, .06)
    for k, nn in enumerate((88, 91, 95)):
        T.put(music_box(midi(nn), 1.0), dab[0] + .5 + k * .18, .08, -.3 + .3 * k)
    T.put(epiano(midi(79), 1.5, .5), dab[0] + .9, .1, .2)
    s6 = beats["s6"]                                                             # 'Of course it is.'
    T.put(slide_brass(58, 50, 1.0, 800), s6[1] - .45, .11, 0)
    T.put(pizz(midi(36), .5), s6[1] + .05, .22, 0)
    T.fade(t0 + d - .6, t0 + d, 1, 0)


def cue_dawn8(T, t0, d, beats):
    """6:40 AM. Tender and slow: the first major chords of the night, the Moon's bells, a music box as it sets."""
    prog = ["C", "Am7", "F", "G"]
    a0, end = beats["open"][0] + .15, t0 + d
    b = 60 / 56
    for i in range(int((end - a0) / (2 * b)) + 1):
        ch, at = prog[i % 4], a0 + i * 2 * b
        if at >= end - .3:
            break
        T.put(pad([n + 12 if n < 50 else n for n in CH8[ch]], 2 * b + 1.0, 1.0, 1.2, 1100), at, .075)
        T.put(sub_bass(midi(root(ch)), 2 * b), at, .12, 0)
        for k, nn in enumerate(arp(ch, 57)):
            T.put(epiano(midi(nn), 1.2, .35), at + .4 + k * .5, .075, -.25 + .17 * k)
    m1, st, m4, m5, s6 = beats["m1"], beats["set"], beats["m4"], beats["m5"], beats["s6"]
    moon_motif(T, m1[0] - .3, .07, -.35, .26)                                    # the Moon's four bells, falling
    for k, nn in enumerate((84, 88, 91, 96, 91, 88, 84, 79)):                    # it sets: a music box drifts across the room
        T.put(music_box(midi(nn), 1.1), st[0] + .25 + k * .27, .12, -.55 + .16 * k)
    T.put(strings([55, 60, 64, 67, 72], m4[1] - st[0] + 1.0, 1.4, 1.2, 5.0, 2200), st[0] + .2, .08)   # the sun, in C major
    T.put(pad([53, 56, 60], m5[1] - m5[0] + .7, .3, .5, 900), m5[0] - .05, .08)  # 'Don't say the word.': the one minor chord in the scene
    T.put(strings([60, 64, 67, 72], max(.8, t0 + d - s6[0] + .3), .4, 1.0, 5.0, 2000), s6[0], .07)
    T.fade(t0 + d - .8, t0 + d, 1, 0)


def cue_report8(T, t0, d, beats):
    """7:00 AM. The day shift's theme, over-caffeinated in G major. 'Quiet.' sours it; the night's clock returns for the last lines."""
    e0, q = beats["enter"][0] + .25, beats["s1"]
    stop = q[1] + .03
    b = 60 / 132
    prog = ["G", "Em", "C", "D"]
    T.put(brass([55, 59, 62], .25, .01, .1, 2000), e0, .14)
    for i in range(int((stop - e0) / (4 * b)) + 1):
        ch, bar = prog[i % 4], e0 + i * 4 * b
        a = arp(ch, 67)
        for j in range(16):
            at = bar + j * b / 4
            if at >= stop - .05:
                break
            k = [0, 1, 2, 1, 2, 1, 0, 1, 0, 1, 2, 1, 2, 3, 2, 1][j]
            T.put(marimba(midi(a[k % 3] + 12 * (k // 3)), .18), at, .085, -.35 + .05 * j)
            T.put(shaker(), at, .035 if j % 2 else .05, .35 if j % 2 else -.35)
            if j % 2 == 0:
                T.put(pizz(midi(root(ch) + (7 if j % 4 else 0)), .22), at, .2 if j % 4 == 0 else .13, 0)
            if j in (0, 8):
                T.put(kick(), at, .24, 0)
            if j in (4, 12):
                T.put(clap(), at, .13, .2)
    fl, calls = beats["flick"], beats["calls"]
    T.gate(stop, calls[0], 0.0, .02)                                             # the groove dies on the Q word; what follows is placed after the gate
    T.put(slide_brass(67, 55, 1.0, 1400), q[0] + .05, .15, 0)                    # a trombone sags under it, a record scratch drags the room down
    T.put(bp(R8.uniform(-1, 1, _n(.4)), 600, 5000) * np.linspace(1, 0, _n(.4)) * .5, q[1] - .02, .2, 0)
    T.put(pad([33, 40, 45, 51], calls[0] - fl[0] + .6, .5, .3, 600), fl[0], .1)   # a sour bed with a tritone in it, and the tube flickering
    for k in range(int((beats["s2"][0] - fl[0]) / .22)):
        T.put(tick(), fl[0] + k * .22, .05 + .02 * (k % 2), .3 * (1 if k % 2 else -1))
    T.put(pizz(midi(40), .4), beats["li2"][1] + .05, .26, 0)
    # the day shift's theme again, in the minor, a third of a semitone flat and at a limp 100 bpm
    sour = ["Gm", "Eb", "Cm", "D7"]
    c1 = beats["li3"][0] - .05
    for i, at in enumerate(beat_times(calls[0], c1, 100, 100, .5)):
        ch = sour[(i // 8) % 4]
        a = arp(ch, 62)
        if i % 2 == 0:
            T.put(pizz(midi(root(ch) - .3), .3), at, .17, 0)
        T.put(epiano(midi(a[(i * 2) % len(a)] - .35), .5, .5), at, .075, -.3 + .1 * (i % 6))
        T.put(shaker(), at, .03, .3)
    # the clock from the night comes back: tick, tock, a Dm pad, the same weary sigh
    k0, s5 = beats["li3"][0], beats["s5"]
    for i, at in enumerate(beat_times(k0 - .05, s5[1] + .1, 66)):
        tock(T, i, at)
        if i % 4 == 0:
            T.put(pizz(midi(38), .3), at, .22, 0)
    T.put(pad([50, 53, 57], s5[1] - k0 + 1.0, .8, .8, 800), k0 - .1, .06)
    sigh(T, beats["s4"][1] + .1, "Dm", .9)
    T.put(slide_brass(57, 45, 1.0, 800), s5[0] + .1, .15, 0)
    T.put(timp(52, 1.2), s5[1], .3)
    T.fade(t0 + d - .5, t0 + d, 1, 0)


CUES = {"title": cue_title7, "station": cue_station8, "hall": cue_hall8, "break": cue_break8, "dawn": cue_dawn8, "report": cue_report8, "end": cue_end7}


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
