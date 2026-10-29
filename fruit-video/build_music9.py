"""Episode 9 score: the agency nurse. A welcome jingle that curdles, bureaucracy in pizzicato, two radios in one hall, a countdown with a punchline, a chase that stops
dead, and a heist.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music9; the mixer ducks it under every voice.
  arrival  the Fruit Bowl welcome jingle (pizzicato strings, glockenspiel, a ukulele-ish pluck): sparse before the party horn, full after it, flat and slow on
           'That's a different budget.', then one low note is held
  orient   a clerk's pizzicato and woodblock ticks that wind up under the contract and the dealt cards; 'It's contract math.' lands in silence and a tuba sags
  floor    two worlds at once: a frantic string ostinato in the left ear (the hall), a lo-fi hip-hop bed in the right (the break room) that slowly takes over;
           both stop dead on the trombone
  exit     a clock, a string note that keeps climbing, 'It's eleven.' in silence, then a record scratch and a slide whistle; the jingle is back for 'Five stars!'
  lot      a chase (brass stabs on a walking bass) that stops dead as the car leaves, an empty pad and one lonely marimba for the Moon, then a heist-movie bass
           line with finger snaps that grows under the contract and ends bright on the tap
title and end reuse Episode 7's cues. Instruments come from build_music6 / build_music7; nothing is sampled.
"""
import numpy as np

from build_audio import tarr, osc, expdecay, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pluck, pizz, marimba, epiano, bell, sub_bass, pad, strings, brass, kick, snare, clap, hat, shaker, timp, riser, crash,
                          MUSIC_GAIN, _n)
from build_music7 import CH7, woodblock, slide_brass, cue_title7, cue_end7
from build_music8 import beat_times, tock

R9 = np.random.default_rng(2609)


def grid(a, b, bpm, per=.5):
    """Times from a up to (not including) b, one every `per` beats at `bpm`."""
    s = 60 / bpm * per
    return [a + i * s for i in range(int(max(0.0, b - a) / s) + 1) if a + i * s < b - 1e-6]


def ss(x):
    """Smoothstep, 0..1 (works on numbers and arrays)."""
    y = np.clip(x, 0, 1)
    return y * y * (3 - 2 * y)


# ================================================================ new instruments
def uke(T, at, notes, g=.08, pan=.3, flat=0.0):
    """A ukulele-ish strum: four short nylon plucks a few milliseconds apart. `flat` drops every string by that many semitones."""
    for k, m in enumerate(notes):
        T.put(pluck(midi(m - flat), .3, 2800, .11, "tri"), at + k * .013, g * (1 - .07 * k), pan)


def spic(m, d=.09):
    """A short bowed string note: two detuned saws, closed filter."""
    f = midi(m)
    return lp(osc("saw", f, d) + .7 * osc("saw", f * 1.006, d), 2600) * ar(d, .004, d * .55)


def snap(d=.07):
    """A finger snap: a click of mid noise with a short high ping."""
    return (bp(R9.uniform(-1, 1, _n(d)), 1700, 5200) * expdecay(d, .012) + .5 * osc("sine", 2300, d) * expdecay(d, .008)) * ar(d, .0004, .02) * .8


def rising(m0, m1, d):
    """A held string note that will not stop climbing: a glide with a deepening vibrato and a bow that presses harder the higher it gets."""
    t = tarr(d)
    f = midi(m0) * (midi(m1) / midi(m0)) ** (t / d) * (1 + .006 * np.sin(2 * np.pi * 5.6 * t) * np.clip(t, 0, 1))
    return lp(osc("saw", f, d) + osc("saw", f * 1.005, d) + .5 * osc("sine", f, d), 2200) * (.2 + .8 * (t / d) ** 1.4) * ar(d, .6, .04) * .45


# ================================================================ the Fruit Bowl welcome jingle
UK = {"C": [60, 64, 67, 72], "Am": [57, 60, 64, 69], "F": [57, 60, 65, 69], "G": [59, 62, 67, 71]}
BASS = {"C": (48, 55), "Am": (45, 52), "F": (41, 48), "G": (43, 50)}
TUNE = {"C": (79, 84, 83, 84, 79), "Am": (81, 84, 83, 84, 81), "F": (81, 84, 81, 77, 81), "G": (79, 83, 86, 83, 79)}


def jingle(T, anchor, a, z, full_from, g=1.0, b=60 / 132):
    """Too happy: a bar of eighths per chord (C Am F G) with a bright pizzicato arpeggio, an offbeat ukulele and a bouncing bass; from `full_from` on a glockenspiel
    tune, shaker, kick and clap join. The grid has a downbeat at `anchor`; notes sound between a and z."""
    prog = ["C", "Am", "F", "G"]
    for i in range(int((a - anchor) // (4 * b)), int((z - anchor) // (4 * b)) + 1):
        bar, ch = anchor + i * 4 * b, prog[i % 4]
        for j in range(8):
            at = bar + j * b / 2
            if at < a or at >= z:
                continue
            full = at >= full_from - 1e-6
            k = g * (1 if full else .55)
            T.put(pizz(midi(UK[ch][[0, 1, 2, 1, 2, 3, 2, 1][j]]), .2), at, (.1 if j % 2 == 0 else .07) * k, .3 if j % 2 else -.3)
            if j in (0, 4):
                T.put(pizz(midi(BASS[ch][j // 4]), .25), at, .2 * k, 0)
            if j % 2:
                uke(T, at, UK[ch], .075 * k, .35)
            if full:
                T.put(shaker(), at, .04 * g, .3 if j % 2 else -.3)
                if j in (0, 4):
                    T.put(kick(), at, .18 * g, 0)
                if j in (2, 6):
                    T.put(clap(), at, .1 * g, .2)
                if j in (0, 2, 3, 4, 6):
                    T.put(bell(midi(TUNE[ch][(0, 2, 3, 4, 6).index(j)]), .5) * .6, at, .08 * g, .35)


# ================================================================ scene cues
def cue_arrival9(T, t0, d, beats):
    """2:58 PM. The welcome jingle, sparse until the party horn and then at full cheese; on 'That's a different budget.' it goes flat, slows, plays a wrong note, and one low note is held."""
    party, ta = beats["door"][0] + 1.3, beats["a5"][0]
    jingle(T, party, beats["open"][0] + .3, ta - .02, party)
    T.put(crash(1.2), party, .12, .1)
    for k, (off, ch) in enumerate(((0, "C"), (.36, "Am"), (.8, "F"), (1.34, "F"))):   # curdling: flatter and slower with every strum
        uke(T, ta + off, UK[ch], .08, .3, .3 + .1 * k)
        T.put(pizz(midi(BASS[ch][0] - .3 - .1 * k), .3), ta + off, .2 - .03 * k, 0)
    T.put(bell(midi(84 - .7), .8) * .6, ta + .55, .1, .35)                            # the wrong note
    T.put(strings([28, 35, 40], t0 + d - ta - .6, .5, .8, 4.6, 520), ta + .9, .17)    # the held low note
    T.put(sub_bass(midi(28), t0 + d - ta - .9), ta + .9, .2)
    T.fade(t0 + d - .7, t0 + d, 1, 0)


def cue_orient9(T, t0, d, beats):
    """3:06 PM. Bureaucracy: dry pizzicato and woodblock ticks, a string cluster that swells under the contract, a rising run and a riser for the dealt cards, a timpani hit
    for every headcount, then 'It's contract math.' in silence and a tuba note that sags."""
    p1, lg, dl, l1, l2, s7, l3 = beats["p1"][0], beats["login"], beats["deal"], beats["l1"][0], beats["l2"][0], beats["s7"][0], beats["l3"]
    stop = l3[0] - .03
    walk = [45, 45, 52, 45, 48, 48, 52, 47]
    for i, at in enumerate(beat_times(beats["open"][0] + .1, stop, 108, 140, .5, 1.4)):
        lvl = ss((at - p1) / (s7 - p1))
        T.put(woodblock(), at, (.08 + .06 * lvl) if i % 2 else .045, .3 if i % 2 else -.3)
        if lg[0] + .15 < at < lg[1] - .4:                                         # at the login screen it is only the ticks
            continue
        if at >= p1 - .2 or i % 4 == 0:
            T.put(pizz(midi(walk[i % 8] if at >= p1 - .2 else 45), .2), at, .14 + .1 * lvl, -.1)
    T.put(pizz(midi(46), .4), lg[0] + 1.3, .25, 0)                                  # 'ERR': a wrong note
    T.put(woodblock(), lg[0] + 1.3, .12, 0)
    T.put(strings([33, 40, 46, 52], s7 - p1 + .3, (s7 - p1) * .85, .25, 5.0, 900), p1, .09)
    T.put(riser(s7 - dl[0] + .3, 300, 3800, .5), dl[0] - .1, .2)
    for k, off in enumerate((0, 2, 3, 5, 6, 8, 9, 11, 12, 14)):                     # the cards go down
        T.put(marimba(midi(60 + off), .15), dl[0] + .1 + k * .075, .1 + .01 * k, -.5 + .1 * k)
    for i, x in enumerate((l1, l2, s7)):                                            # twelve, twenty-eight, forty
        T.put(timp(52 + 6 * i, .7), x + .05, .22 + .05 * i)
    T.gate(stop, l3[1] + .02, 0, .02)
    T.put(slide_brass(41, 28, 1.3, 520), l3[1] - .3, .2, 0)                         # the tuba
    T.fade(t0 + d - .6, t0 + d, 1, 0)


def cue_floor9(T, t0, d, beats):
    """5:32 PM. Two radios in one building. Left: the hall, a frantic string ostinato. Right: the break room, a lo-fi hip-hop bed (Rhodes, vinyl hiss, a lazy kick and snare)
    that takes over between 'Helping.' and 'How many residents do you have?'. Both stop dead on the trombone."""
    stop, a0 = beats["end"][0] + .1, beats["open"][0] + .2
    x0, x1 = beats["p2"][1], beats["s4"][1]
    lof = lambda at: .2 + .8 * ss((at - x0) / (x1 - x0))
    hal = lambda at: 1 - .72 * ss((at - x0) / (x1 - x0))
    ch4 = [[57, 60, 64, 69], [57, 60, 65, 69], [57, 62, 65, 69], [56, 59, 64, 68]]
    pat = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 3, 2]
    for k, at in enumerate(grid(a0, stop, 152, .25)):
        ch = ch4[(k // 16) % 4]
        T.put(spic(ch[pat[k % 16]]), at, (.075 if k % 4 == 0 else .05) * hal(at), -.7)
        if k % 8 == 0:
            T.put(pizz(midi(ch[0] - 24), .25), at, .17 * hal(at), -.4)
        if k % 2:
            T.put(hat(), at, .03 * hal(at), -.5)
    lb, prog = 60 / 76, ["Cmaj7", "Am7", "Dm7", "G7"]
    nz = _n(stop - a0)
    T.put(hp(R9.uniform(-1, 1, nz), 4200) * lof(np.linspace(a0, stop, nz)), a0, .035, .6)      # vinyl
    for _ in range(int((stop - a0) * 5)):
        at = R9.uniform(a0, stop - .1)
        T.put(hp(R9.uniform(-1, 1, _n(.004)), 2500) * expdecay(.004, .001), at, .08 * lof(at) * R9.uniform(.3, 1), .6)
    for i in range(int((stop - a0) / (4 * lb)) + 1):
        bar, ch = a0 + i * 4 * lb, CH7[prog[i % 4]]
        g = lof(bar)
        for k, nn in enumerate(ch):
            T.put(lp(epiano(midi(nn + 12), 2.4, .45), 3000), bar + k * .014, .07 * g, .6)
        T.put(lp(epiano(midi(ch[2] + 24), 1.2, .35), 3000), bar + 1.5 * lb + .02, .05 * g, .7)
        T.put(lp(epiano(midi(ch[3] + 12), 1.2, .35), 3000), bar + 3 * lb + .02, .045 * g, .5)
        T.put(sub_bass(midi(ch[0] - 12), .9 * lb), bar, .17 * g, .3)
        T.put(sub_bass(midi(ch[0] - 5), .4 * lb), bar + 2.5 * lb, .12 * g, .3)
        for off in (0, 1.5, 2.5):
            T.put(kick(), bar + off * lb, .2 * g, .4)
        for off in (1, 3):
            T.put(snare() * .6, bar + off * lb + .03, .1 * g, .4)                      # a little behind the beat
        for h in range(8):
            T.put(hat(), bar + (h * .5 + (.17 if h % 2 else 0)) * lb, .03 * g * (1 if h % 2 == 0 else .6), .5)
    T.gate(stop, t0 + d + 3.0, 0, .008)                                                 # one hard stop for both worlds


def cue_exit9(T, t0, d, beats):
    """10:58 PM. A countdown: a clock in the pit, a low drone, a string note that climbs, 'It's eleven.' in silence, then a record scratch, a slide whistle and a plonk;
    the welcome jingle returns for the review; silence for 'She has the keys.'; a stab for 'THE KEYS!' and a run up the stairs."""
    p2, cd, p3, a1, m1, s3, s4, run = (beats[k] for k in ("p2", "cd", "p3", "a1", "m1", "s3", "s4", "run"))
    c0 = beats["open"][0] + .25
    T.put(strings([33, 40], p2[1] - c0 + .6, 1.0, .5, 4.6, 600), c0, .07)
    for i, at in enumerate(beat_times(c0, cd[0], 100)):
        tock(T, i, at, .8)
    for k, at in enumerate(grid(cd[0] + .25, p3[0] - .03, 120, 1.0)):                   # between the scripted ticks
        tock(T, k, at, 1.0 + .08 * k)
    T.put(rising(62, 74, p3[0] - p2[1] - .03), p2[1], .13)
    T.gate(p3[0] - .03, p3[1] - .05, 0, .02)                                            # 'It's eleven.' in silence
    r0 = p3[1] - .06
    T.put(bp(R9.uniform(-1, 1, _n(.35)), 500, 5500) * np.linspace(1, 0, _n(.35)) * .6, r0, .2)   # a record scratch
    wd = .6
    wf = np.concatenate([np.linspace(midi(70), midi(98), _n(wd * .45)), np.linspace(midi(98), midi(60), _n(wd) - _n(wd * .45))])
    T.put(osc("sine", wf * (1 + .012 * np.sin(2 * np.pi * 6 * tarr(wd))), wd) * ar(wd, .01, .15) * .5, r0 + .1, .14, .2)   # a slide whistle
    T.put(marimba(midi(55), .5), r0 + .75, .14, -.2)
    jingle(T, a1[0] - .1, a1[0] - .1, m1[0] - .05, a1[0] - .1, .7)
    T.gate(m1[0] - .05, s4[0], 0, .03)
    T.put(strings([33, 40], s4[0] - m1[0] + .2, .4, .05, 4.6, 600), m1[0], .1)
    T.put(pizz(midi(40), .5), s3[1] + .05, .25)
    T.put(brass([57, 60, 64, 69], .5, .01, .2, 2400), s4[0] + .05, .24)
    T.put(timp(55, 1.0), s4[0] + .05, .35)
    T.put(crash(1.5), s4[0] + .05, .18)
    for k, nn in enumerate((57, 60, 64, 67, 69, 72, 76, 79, 81, 84)):
        T.put(marimba(midi(nn), .2), run[0] + .05 + k * .075, .14, -.5 + .1 * k)
    T.fade(t0 + d - .25, t0 + d, 1, 0)


def cue_lot9(T, t0, d, beats):
    """11:00 PM. A short chase that stops dead as the engine pulls out; then an empty pad and one lonely marimba for the Moon; then a sly heist bass line and finger snaps
    that grow under 'Where do I sign?' and 'Do it.' and end bright on the tap."""
    car, mo1, ph, s5, mo2, tap = (beats[k] for k in ("car", "mo1", "ph", "s5", "mo2", "tap"))
    leave = car[0] + 1.5
    walk = [45, 45, 48, 50, 51, 50, 48, 45]
    for k, at in enumerate(grid(t0 + .2, leave - .04, 168, .5)):
        T.put(pizz(midi(walk[k % 8]), .16), at, .24, -.1)
        if k % 2:
            T.put(brass([57, 60, 64] if (k // 2) % 2 == 0 else [56, 59, 64], .1, .006, .04, 1900), at, .14, 0)
        else:
            T.put(kick(), at, .22, 0)
        T.put(hat(), at, .06, .4)
    T.gate(leave - .03, mo1[0], 0, .006)
    T.put(pad([45, 52, 57], ph[1] - leave + .6, 1.2, 1.5, 700), leave + .5, .07)       # empty
    for k, nn in enumerate((76, 71, 69)):                                               # one lonely marimba
        T.put(marimba(midi(nn), .8), mo1[0] + .15 + k * .75, .12, -.3 + .25 * k)
    T.put(marimba(midi(64), 1.0), ph[0] + 1.0, .1, .2)
    h0 = ph[0] + .9
    line = [38, None, 38, 41, None, 43, 44, 43, 38, None, 38, 41, None, 46, 45, 43]
    for k, at in enumerate(grid(h0, tap[0] - .05, 104, .5)):
        lvl = ss((at - h0) / (tap[0] - h0))
        if line[k % 16]:
            T.put(pizz(midi(line[k % 16]), .22), at, .16 + .14 * lvl, -.1)
        if at >= s5[0] - .05 and k % 4 == 2:
            T.put(snap(), at, .12 + .1 * lvl, .3)
        if at >= s5[0] and k % 8 in (3, 7):
            T.put(marimba(midi(74 + 2 * (k % 16 > 7)), .25), at, .07 + .05 * lvl, .35)
        if at >= mo2[0] - .3 and k % 8 in (0, 3):
            T.put(brass([50, 57], .15, .01, .06, 1200), at, .1 + .06 * lvl, 0)
    T.put(riser(tap[0] - mo2[0] + .3, 400, 4500, .45), mo2[0] - .2, .22)
    hit = tap[0] + .1
    T.gate(hit - .12, hit - .004, 0, .01)                                               # a beat of nothing, then the click
    T.put(brass([62, 66, 69, 74], .9, .01, .5, 2600), hit, .22)                         # D major, at last
    T.put(pizz(midi(38), .6), hit, .3)
    T.put(strings([62, 66, 69, 74], t0 + d - hit, .05, .8, 5.0, 2800), hit, .1)
    for k, nn in enumerate((86, 90, 93, 98)):
        T.put(bell(midi(nn), 1.3) * .6, hit + .05 + k * .06, .1, -.4 + .27 * k)
    T.put(crash(1.6), hit, .12)
    T.fade(t0 + d - 1.0, t0 + d, 1, 0)


CUES = {"title": cue_title7, "arrival": cue_arrival9, "orient": cue_orient9, "floor": cue_floor9, "exit": cue_exit9, "lot": cue_lot9, "end": cue_end7}


LEVEL9 = 1.5   # this episode's own cues sit about 3.5 dB hotter than they are written: Episode 8's underscore averages that much more than these notes would give


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    T = Track(N)
    for sc in scenes:
        fn = CUES.get(sc["id"])
        if not fn:
            continue
        t0 = sc["start"]
        beats = {k: (t0 + v["s"], t0 + v["e"]) for k, v in sc["beats"].items()}
        mine = fn not in (cue_title7, cue_end7)   # the shared title and end cues keep their Episode 7 level
        U = Track(N) if mine else T
        fn(U, t0, sc["dur"], beats)
        if mine:
            T.buf += U.buf * LEVEL9
        T.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.0, 0.0, .15)   # a cue's tail never bleeds into the next scene
    return hall(T.buf, wet=.55, rt=1.6) * MUSIC_GAIN
