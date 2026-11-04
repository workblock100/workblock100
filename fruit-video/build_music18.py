"""Episode 18 score: THE FIRE DRILL. Bureaucracy, a faux-military march, an alarm that is its own score, a carol through a television, an inspection.

build_audio18 (a copy of build_audio17's wrapper) calls score(script, scenes, lines, N) through --music build_music18; the mixer ducks the bed under every voice (and so does this file:
_speech_dip). Instruments and helpers come from build_music6 to build_music16 (the series' orchestra: pizzicato, marimba, glockenspiel, upright bass, tuba, trumpet, horn, bassoon, oboe, clarinet, xylophone,
slide whistle, trombone slide, strings, timpani). The shape of the score is Episode 15 to 17's: every scene is rendered on two tracks (U through the room's reverb, D dry), muted spans are applied after
the reverb.

MOTIFS
  MERGE THEME   in E major in the title (the arpeggio climbs, and on the downbeat where the landing chord should be the PULL STATION cuts the music dead; after the horn the last bar comes back
                quietly and lands on E major that SAGS to E minor) and in A major on the end card (a suspended-second chord held, fading before the last chirp, which has nothing under it).
  BINDER JINGLE C D E G, bright and helpful in the notice (marimba, glockenspiel, pizzicato), curdled (C D E-flat G-flat, slow, a drone) on 'Great! I'll help.' and on 'Fire rises!', again in the clear.
  ONION'S CLARINET SOB on her sniffles (notice, marshal); TOMATO'S PIZZICATO (major, then minor) on her lines.
  THE MARSHAL'S MARCH a snare march with a bass drum, a tuba and a fife (a whistle) that is much too big for the nurses' station; it stops dead on 'I'm in charge!'.
  THE ALARM has no score: the horn and the doors are the music. Under it a very low drone that gains a note with every door that shuts (the door table, build/ep18/door_events.json), cut with the horn.
  THE CAROL 'Silent Night' through the day room's television (a small speaker, a little distorted), which ends mid-note when the remote kills the set. THE SHUFFLING WALTZ (the line leaves), the counting
  pizzicato and the flood of forty voices (a rising glissando) that a tape-stop ends on 'Eighty.'.
  THE INSPECTION a dry bassoon and oboe (the State at work) whose bars are bent so that a downbeat lands on the PASS stamp, then a hush: the chirp is the music.
"""
import json
import os

import numpy as np

from build_audio import SR, tarr, osc, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pizz, marimba, bell, sub_bass, pad, strings, brass, hat, shaker, timp, roll, riser, impact, crash, tick, heart, kick, snare, clap, tom,
                          epiano, MUSIC_GAIN, _n)
from build_music7 import woodblock, taiko, choir, slide_brass
import build_music10 as M10
from build_music10 import tuba, mtrumpet, clarinet, oboe, violin, brush, cue_dips, slide_whistle, piano, nylon, groove_times
from build_music9 import grid, snap, uke, spic, rising
from build_music13 import _mute, _speech_dip, glass, revcym, sub_swell, ubass, kick13, snare13, cello, vib
from build_music14 import horn, trumpet, harp, celesta, xylo, bassoon, bdrum, tamtam
from build_music15 import (whistle, sob_clar, bounce, accel_roll, stab, fanfare, comp, binder_bed, CHORDS, ROOTS, BJ, BJ_MINOR, TP_MAJ, TP_MIN, W)
from build_music16 import merge_bar1, merge_land, merge_tune, tape_stop

HERE = os.path.dirname(os.path.abspath(__file__))
MUTES = []
TR_TITLE, TR_END = 4, 9          # the Merge theme in E major (title) and A major (end card)
BL_TITLE, BL_END = .55, .65      # a beat of the theme: the title's bar is 2.2 s (0.2 to 2.4: the pull lands on the downbeat), the end card's 2.6 s


# ================================================================ helpers
def tvfx(x, seed=1818):
    """A stereo signal as a small television speaker plays it: band-limited (300 Hz to 4.8 kHz), a little distortion, a faint comb (the cabinet), a thread of hiss and mains hum."""
    from scipy import signal
    y = signal.sosfilt(signal.butter(4, [300 / (SR / 2), 4800 / (SR / 2)], "band", output="sos"), x, axis=-1)
    pk = np.abs(y).max() + 1e-9
    y = np.tanh(1.7 * y / pk) * pk / 1.25
    d = int(.0011 * SR)
    y[..., d:] += .1 * y[..., :-d]
    r = np.random.default_rng(seed)
    n = y.shape[-1]
    hiss = signal.sosfilt(signal.butter(2, [2000 / (SR / 2), 6000 / (SR / 2)], "band", output="sos"), r.uniform(-1, 1, n)) * .0035 * pk
    hum = np.sin(2 * np.pi * 60 * np.arange(n) / SR) * .003 * pk
    return y + hiss + hum


def _alarm_scene(scenes):
    return next((s for s in scenes if s["id"] == "alarm"), None)


FIXED_DOORS = (9.9, 10.5, 11.1, 11.7, 12.3, 12.9)      # the alarm's six doors, only if build/ep18/door_events.json does not exist (see build_audio18._load_doors)


def door_times(scenes):
    """Absolute times at which the 1st, 2nd ... door of the corridor shut: the `hornstate` events of build/ep18/door_events.json (or the slams), else a fixed schedule in the alarm scene."""
    p = os.path.join(HERE, "build/ep18/door_events.json")
    try:
        raw = json.load(open(p))
    except (OSError, ValueError):
        raw = []
    st = sorted((float(e["t"]), int(e.get("closed", 0))) for e in raw if e.get("name") == "hornstate")
    if st:
        return [t for t, n in st]
    sl = sorted(float(e["t"]) for e in raw if e.get("name") == "doorslam")
    if sl:
        return sl
    a = _alarm_scene(scenes)
    return [a["start"] + x for x in FIXED_DOORS] if a else []


# ================================================================ title and end
def cue_title18(T, t0, d, beats, D):
    """The pull (6.8 s). 0.2 to 2.4: the Merge theme's first bar in E major (a marimba and a glockenspiel over a pad, a pizzicato bass, claps and a roll that climbs, 2.2 s a bar); the arpeggio rises
    to where the landing chord should be and on the downbeat the pull station's click (2.4) CUTS THE MUSIC DEAD (the span 2.4 to 5.0 is muted after the reverb, so even its tail is gone): the horn is the
    only thing in the room. From 5.0 the last bar comes back, quietly: two pickup notes (F-sharp, A) and on the horn's stop (5.45) the landing, brass and strings on E major, a timpani and a bass drum; the
    third of the chord sags a semitone (G-sharp to G natural) and the chord ends in E minor, held under the text ding (5.6) and faded to the cut."""
    a = t0 + .2
    merge_bar1(T, D, a, TR_TITLE, "uke", 1.0, bl=BL_TITLE)
    T.put(riser(2.0, 400, 5200, .4), a + .1, .045, 0)
    for at in (1.4, 2.0):
        D.put(woodblock(), t0 + at, .05, -.2)
    MUTES.append((t0 + 2.4, t0 + 5.0, .006))
    land = t0 + 5.45
    T.put(trumpet(78, .2, .7), t0 + 5.03, .05, .15)
    T.put(trumpet(81, .2, .75), t0 + 5.23, .06, .15)
    T.put(marimba(midi(78), .3), t0 + 5.03, .07, .1)
    T.put(marimba(midi(81), .3), t0 + 5.23, .07, .1)
    ch = [40, 47, 52, 59, 64]                                           # E2 B2 E3 B3 E4: the chord without its third
    T.put(brass(ch, 1.3, .03, .8, 1900), land, .09, 0)
    T.put(strings(ch + [71], 1.4, .08, .9, 5.0, 2400), land, .11)
    T.put(slide_brass(68, 67, .32, 1700) * 1.1, land - .02, .07, .1)    # the third: G-sharp, sagging to G
    T.put(horn(67, 1.0, .8, a=.05, r=.5), land + .3, .07, .1)
    T.put(strings([55, 62, 67], 1.0, .2, .6, 5.0, 2000), land + .3, .05)
    D.put(timp(82.4, 1.2), land, .15, 0)
    D.put(bdrum(.9, .9), land, .12, 0)
    T.fade(t0 + d - .7, t0 + d, 1, 0)
    D.fade(t0 + d - .7, t0 + d, 1, 0)


def cue_end18(T, t0, d, beats, D):
    """The end card (7.5 s): the Merge theme in A major, in full corporate band. Bar 1 (0.1 to 2.7) the arpeggio and the landing on A suspended-second (A B E) at 2.7; the tune over A E / F# D /
    E A; the stamp (4.0) gets a bass drum. The last chord (5.4) is the same suspension held (brass and strings, a whistle on top), which does not resolve, and it FADES AWAY BY 6.9 so that the smoke
    detector's last chirp (7.1) has nothing under it; the span from 6.95 to the end is muted after the reverb. The chirps at 2.2, 4.7 and 7.1 are dry and the bed dips under each (DIPS18)."""
    merge_bar1(T, D, t0 + .1, TR_END, "uke", 1.1, bl=BL_END)
    land = t0 + .1 + 4 * BL_END
    merge_land(T, D, land, TR_END, "uke", "sus2")
    merge_tune(T, D, land, 1, TR_END, "uke", bl=BL_END)
    D.put(bdrum(.9, .8), t0 + 4.0, .12, 0)
    fin = t0 + 5.4
    sus = [m + TR_END for m in (48, 55, 62, 67, 72, 74, 79)]
    T.put(brass(sus, 1.5, .04, .9, 2200), fin, .08, 0)
    T.put(strings(sus, 1.6, .05, 1.0, 5.0, 2500), fin, .1)
    T.put(whistle(88, 1.3, .7, .1, .6), fin, .04, 0)
    D.put(timp(110, 1.2), fin, .12, 0)
    T.fade(t0 + 6.1, t0 + 6.85, 1, 0)
    D.fade(t0 + 6.1, t0 + 6.85, 1, 0)
    MUTES.append((t0 + 6.95, t0 + d, .05))


# ================================================================ notice
ROOT18 = {"Am": 45, "F": 41, "Dm": 38, "E": 40, "G": 43, "C": 36, "Bb": 34, "Em": 40, "Gm": 43, "A": 45}
CH18 = {"Am": (57, 60, 64), "F": (57, 60, 65), "Dm": (57, 62, 65), "E": (56, 59, 64), "G": (55, 59, 62), "C": (55, 60, 64), "Em": (55, 59, 64), "Gm": (55, 58, 62)}


def office(T, D, a, b, bpm=100.0, lvl=1.0, prog=("Am", "Am", "F", "E"), vibes_on=True):
    """The office as a rhythm section from a to b: a dry upright bass on 1 and 3 (root, then fifth), a muted vibraphone chord on 2 and 4 (short, motor nearly off) and a woodblock on every
    off-beat: bureaucratic, correct and not at all in a hurry."""
    bl = 60 / bpm
    for k, at in enumerate(grid(a, b, bpm, 1.0)):
        bar, beat = divmod(k, 4)
        ch = prog[bar % len(prog)]
        rt = ROOT18[ch]
        if beat in (0, 2):
            T.put(ubass(rt + (0 if beat == 0 else 7), .34, .7), at, .13 * lvl, -.15)
        elif vibes_on:
            for q, m in enumerate(CH18[ch]):
                T.put(vib(m + 12, .4, .45, 3.0, .08), at + .012 * q, .034 * lvl, .25)
        D.put(woodblock(), at + bl / 2, .026 * lvl, .3)


def tomato(T, at, g=.08, minor=False, both=False):
    """Tomato's pizzicato: a rising chord arpeggio on pizzicato strings, major (efficient) or, when `both`, major and then minor (the efficiency curdles)."""
    for j, ch in enumerate((TP_MAJ, TP_MIN) if both else ((TP_MIN,) if minor else (TP_MAJ,))):
        for q, m in enumerate(ch):
            T.put(pizz(midi(m + 12), .16), at + j * .3 + q * .05, g, .3)


def circle(T, D, a, b, lvl=1.0):
    """The circular dependency: a small rising figure (A B C D on a marimba, a glockenspiel over it, a pizzicato A under it) that restarts every 1.2 s and never gets anywhere; a little louder
    each time round. From a to b."""
    at = a
    n = 0
    while at < b - .05:
        g = (.06 + .012 * n) * lvl
        for j, m in enumerate((57, 59, 60, 62)):
            if at + j * .3 < b:
                T.put(marimba(midi(m + 12), .22), at + j * .3, g, -.15)
                T.put(bell(midi(m + 24), .5) * .4, at + j * .3, g * .5, .3)
        T.put(pizz(midi(45), .3), at, g * 1.4, -.1)
        D.put(woodblock(), at + .6, .03, .3)
        at += 1.2
        n += 1


def cue_notice18(T, t0, d, beats, D):
    """7:40 PM, the notice (31.9 s). Bureaucracy (0.35 to 7.3): a dry upright bass, a muted vibraphone and a woodblock at 100 bpm in A minor, quiet; Onion's clarinet sob lands on her first sniffle (2.45).
    It thins under 'I am on med pass.' (7.3) and under the first half of the circle (8.5 to 11.3). THE CIRCLE (11.39 to 15.65): from 'Med pass does not interrupt drills.' a rising figure (A B C D)
    loops, a little louder each time, under 'Which one wins?' and 'Per policy.' until Onion's second sniffle (15.71) cuts it with a sob. Tomato's pizzicato (major) on 'The drill is paid time!' and (major,
    then minor) on 'Efficiency.'; a brisker office under her. Binder's four notes (C D E G) bounce under his offer (19.98 to 22.5); on 'Great! I'll help.' (23.14) they curdle (C D E-flat G-flat, slow, a
    drone on D) under the printer, which is left alone (24.08 to 25.8: a drone and a tick); the helpful bounce returns on 'Your nearest exit is the Executive Suite!' (25.83), Lemon's 'That is on the
    roof.' gets one dry pizzicato, and 'Fire rises!' (29.35) is the curdled motif and a string that climbs and cannot stop (A3 to A5) until the line ends. The sting (30.57) is the sfx's."""
    o1, l1, o2, s1, o3, s2, o4, s3, o5, t1, m1, t2, b1, s4, b2, pr, b3, l2, b4, en = (beats[k] for k in (
        "o1", "l1", "o2", "s1", "o3", "s2", "o4", "s3", "o5", "t1", "m1", "t2", "b1", "s4", "b2", "print", "b3", "l2", "b4", "end"))
    office(T, D, t0 + .35, s1[0] - .05, 100, .8)
    T.put(sob_clar(76, 71, .55, .6), t0 + 2.45, .06, -.3)
    office(T, D, s1[0] - .05, o4[0] - .05, 100, .55)
    T.put(strings([45, 52], o4[0] - s1[0], .8, .6, 4.5, 800), s1[0], .035)
    circle(T, D, o4[0], t0 + 15.62, 1.0)
    T.gate(t0 + 15.62, t1[0] - .03, 0.0, .01)
    D.gate(t0 + 15.62, t1[0] - .03, 0.0, .01)
    T.put(sob_clar(74, 69, .5, .55), t0 + 15.66, .06, -.3)
    tomato(T, t1[0] + .1, .08)
    office(T, D, t1[0] + .35, b1[0] - .1, 108, .85, prog=("Am", "F", "Dm", "E"))
    tomato(T, t2[0] + .05, .09, both=True)
    binder_bed(T, D, b1[0] - .1, s4[0] - .05, 120, 1.0)
    bounce(T, b2[0] - .02, BJ_MINOR, .08, .26, 0.0, True)
    T.put(strings([38, 45], pr[1] - b2[0], .5, .8, 4.0, 700), b2[0], .06)
    for at in grid(pr[0] + .1, pr[1] - .1, 80, 1.0):
        D.put(woodblock(), at, .02, .3)
    binder_bed(T, D, b3[0] - .05, l2[0] - .05, 120, 1.0)
    T.put(pizz(midi(33), .5), l2[0] + .3, .1, -.1)
    bounce(T, b4[0] - .02, BJ_MINOR, .09, .22, 0.0, True)
    T.put(rising(57, 81, b4[1] - W("b4", "rises") + .1), W("b4", "rises") - .05, .08, 0)
    T.put(strings([38, 45, 50], 1.0, .1, .6, 4.5, 900), b4[0], .05)
    T.gate(b4[1] + .03, t0 + d, 0.0, .03)
    D.gate(b4[1] + .03, t0 + d, 0.0, .03)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ marshal
MARCH_TUNE = ((0, 0, 65, .75), (0, .75, 65, .25), (0, 1, 69, 1), (0, 2, 72, 1.5), (0, 3.5, 69, .5),
              (1, 0, 67, .75), (1, .75, 67, .25), (1, 1, 70, 1), (1, 2, 74, 1.5), (1, 3.5, 72, .5),
              (2, 0, 65, .75), (2, .75, 65, .25), (2, 1, 69, 1), (2, 2, 72, 1), (2, 3, 77, 1),
              (3, 0, 76, 1), (3, 1, 74, 1), (3, 2, 72, 2))
MARCH_CH = ("F", "Gm", "F", "C")
MCH = {"F": (53, 57, 60), "Gm": (55, 58, 62), "C": (55, 60, 64)}


def march(T, D, a, b, bpm=112.0, lvl=1.0, tune=True, tune_g=1.0):
    """The Marshal's march from a to b: a bass drum on 1 and 3, a snare that never stops (a flam and a tap on 1 and 3, two taps on 2, a little roll on 4), a tuba on 1 and 3 (root, then fifth), a brass
    chord on 2 and 4, and a fife and a muted trumpet on the tune (F major, four bars: F F A C A / G G B-flat D C / F F A C F / E D C), which is exactly as proud as the nurses' station can bear."""
    bl = 60 / bpm
    ts = grid(a, b, bpm, 1.0)
    for k, at in enumerate(ts):
        bar, beat = divmod(k, 4)
        ch = MARCH_CH[bar % 4]
        rt = ROOT18[ch]
        if beat in (0, 2):
            D.put(bdrum(.6, .5), at, .09 * lvl, 0)
            T.put(tuba(rt + (0 if beat == 0 else 7), bl * .8), at, .15 * lvl, -.1)
            D.put(snare13(.8), at, .05 * lvl, .1)
            D.put(snare13(.45), at - .03, .03 * lvl, .1)
            D.put(snare13(.5), at + bl / 2, .035 * lvl, .1)
        else:
            T.put(brass(list(MCH[ch]), .13, .008, .05, 1800), at, .045 * lvl, .3)
            D.put(snare13(.6), at, .04 * lvl, .1)
            if beat == 1:
                D.put(snare13(.45), at + bl / 2, .03 * lvl, .1)
            else:
                for j in range(3):
                    D.put(snare13(.4 + .1 * j), at + bl / 2 + j * bl / 6, .03 * lvl, .1)
    if tune:
        i0 = 0
        while True:
            hit = False
            for bar, beat, m, dd in MARCH_TUNE:
                at = ts[0] + ((i0 * 4 + bar) * 4 + beat) * bl
                if at >= b - .05:
                    continue
                hit = True
                du = dd * bl * (.95 if dd < 2 else 1.0)
                T.put(whistle(m + 12, du, .8), at, .055 * lvl * tune_g, -.15)
                T.put(trumpet(m, min(du, 1.0), .8), at, .04 * lvl * tune_g, .15)
            i0 += 1
            if not hit or ts[0] + i0 * 16 * bl >= b:
                break


def chase(T, D, a, b, lvl=1.0):
    """The rampage (a to b, the foam jet to the splat): a frantic comic chase. Eight beats at about 185 bpm: a fast walking upright bass (chromatic runs in D minor, eighths), a xylophone that
    runs arpeggios in sixteenths and climbs two semitones a beat, a swanee whistle that whoops up on 1 and falls on 5, brass stabs on every off-beat, a kick on the beats, a snare on the backbeat and
    hats. It is muted after the reverb at b, a hair before the splat, so it cuts to nothing."""
    ts, bl = groove_times(a, b, 4, 182.0)
    walk = (50, 53, 57, 53, 50, 53, 57, 60, 58, 62, 65, 62, 58, 62, 65, 69, 55, 58, 62, 58, 55, 58, 62, 65, 52, 55, 59, 62, 64, 62, 59, 55)
    arp = (74, 77, 81, 86, 81, 77, 74, 77)
    for k, at in enumerate(ts):
        for q in range(2):
            T.put(ubass(walk[(k * 2 + q) % len(walk)] - 12, .16, .9), at + q * bl / 2, .15 * lvl, -.1)
        for q in range(4):
            xl = arp[(k * 4 + q) % len(arp)] + int(1.5 * k)
            T.put(xylo(xl, .12, .9), at + q * bl / 4, .06 * lvl, .2 + .05 * q)
        T.put(brass([50, 53, 57, 62], .09, .005, .03, 2400), at + bl / 2, .05 * lvl, .3)
        D.put(kick13(.8), at, .09 * lvl, 0)
        if k % 2 == 1:
            D.put(snare13(.9), at, .07 * lvl, .1)
        D.put(hat(), at + bl / 2, .035 * lvl, -.2)
    T.put(slide_whistle(72, 98, bl * 1.2), ts[0] + .02, .08 * lvl, -.2)
    T.put(slide_whistle(98, 70, bl * 1.4), ts[4], .08 * lvl, .2)
    T.put(slide_whistle(76, 100, bl * .9), ts[6] + bl / 2, .06 * lvl, 0)
    D.put(bdrum(1.0, .9), a + .01, .14 * lvl, 0)
    D.put(crash(1.0) * .6, a + .01, .05 * lvl, .1)
    MUTES.append((b - .004, b + .82, .004))


def cue_marshal18(T, t0, d, beats, D):
    """7:55 PM, the marshal (38.8 s). The Marshal arrives (0.2): a brass fanfare that is far too big for the room (F F F C, trumpets and horns, a tuba, a timpani and a cymbal on the long note, 0.25 to
    1.3), then his MARCH (see march: a snare, a bass drum, a tuba and a fife, 112 bpm, F major) from 'Who is in charge?' (1.4); it goes on, quieter, through the four non-answers (Onion's clarinet sob on her
    sniffle, 6.0) and STOPS DEAD on 'I'm in charge!' (binderpop, 6.36). It comes back on 'Show me the extinguisher.' (7.58) and dies in the hush of the cabinet. The tag: a tuba on 'twenty' and
    'nineteen' (E-flat, D: bwomp, bwomp), a clock ticking, a clarinet sob on the second sniffle (16.83). The fire door: a stern pizzicato, a trombone that slides on 'seniority.' (23.145). P.A.S.S.:
    a held tension that swells from 'Demonstrate P.A.S.S.' (24.87) to the jet (28.46), where it is cut. THE RAMPAGE (28.46 to 31.06): see chase; it cuts to nothing at the splat. Then drops of
    foam (pizzicato plinks) and a deflating trombone on 'hazard.' (36.5). The sting (37.61) is the sfx's."""
    p1, s1, m1, o1, b1, p2, ext, p3, o2, p4, o3, p5, m2, p6, m3, p7, l1, ram, p8, l2, p9, en = (beats[k] for k in (
        "p1", "s1", "m1", "o1", "b1", "p2", "ext", "p3", "o2", "p4", "o3", "p5", "m2", "p6", "m3", "p7", "l1", "rampage", "p8", "l2", "p9", "end"))
    fanfare(T, D, t0 + .25, .9, (65, 65, 65, 72), (.14, .14, .14, .6), .17)
    march(T, D, t0 + 1.3, t0 + 6.36, 112, 1.0)
    T.put(sob_clar(72, 67, .5, .5), t0 + 5.95, .05, -.3)
    T.gate(t0 + 6.36, p2[0] - .1, 0.0, .004)
    D.gate(t0 + 6.36, p2[0] - .1, 0.0, .004)
    MUTES.append((t0 + 6.38, p2[0] - .12, .004))
    march(T, D, p2[0] - .1, ext[0] + .1, 112, 1.1, tune_g=.8)
    D.put(bdrum(.8, .8), ext[0] + .05, .1, 0)
    T.gate(ext[0] + .3, p3[0] - .05, 0.0, .03)
    D.gate(ext[0] + .3, p3[0] - .05, 0.0, .03)
    for at in grid(ext[1], p5[0] - .05, 66, 1.0):
        D.put(woodblock(), at, .022, .3)
    T.put(tuba(39, .7, a=.05, r=.15), W("p3", "twenty"), .15, -.1)
    T.put(tuba(38, 1.0, a=.05, r=.3), W("p3", "nineteen"), .16, -.1)
    T.put(tuba(38, .6, a=.05, r=.15), W("p4", "twenty"), .15, -.1)
    T.put(tuba(36, 1.1, a=.05, r=.35), W("p4", "nineteen"), .16, -.1)
    T.put(strings([38, 45], p5[0] - p3[0], 1.0, .8, 4.5, 700), p3[0], .035)
    T.put(sob_clar(72, 66, .55, .55), t0 + 16.78, .05, -.3)
    office(T, D, p5[0] + .1, m3[0] - .15, 96, .8, prog=("Dm", "Gm", "E", "Am"))
    T.put(slide_brass(58, 53, .85, 900) * 1.2, W("m3", "seniority") - .03, .1, .1)
    T.put(tuba(34, .6, a=.04, r=.2), m3[1] - .35, .12, -.1)
    t_a, t_b = p7[0], t0 + 28.457
    T.put(strings([45, 46, 52, 53], t_b - t_a + .3, 1.6, .02, 6.0, 1500), t_a, .05)
    T.put(sub_swell(33, 49, t_b - t_a) * .5, t_a, .06, 0)
    T.put(riser(t_b - t_a, 300, 5200, .5), t_a + .2, .03, 0)
    at, r = t_a + .1, 2.0
    while at < t_b - .05:
        D.put(woodblock(), at, .03 + .05 * (at - t_a) / (t_b - t_a), .2)
        at += 1 / r
        r = min(8.0, r * 1.07)
    T.gate(t_b - .004, t_b + 4.0, 0.0, .004)
    D.gate(t_b - .004, t_b + 4.0, 0.0, .004)
    MUTES.append((t_b - .004, t_b, .004))
    chase_a, chase_b = t0 + 28.457, t0 + 31.057
    U2, D2 = Track(T.N), Track(T.N)
    chase(U2, D2, chase_a, chase_b, 1.0)
    T.buf += U2.buf
    D.buf += D2.buf
    for j, (at, m) in enumerate(((33.6, 100), (34.97, 96), (36.05, 93))):
        T.put(glass(m, .6, .02, .5) * .6, t0 + at, .025, -.2 + .2 * j)
    T.put(slide_brass(62, 50, .95, 800) * 1.3, W("p9", "hazard") - .02, .1, .1)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ the cue table (absolute times of the script's cues) and the door drone
CTX = {"script": None, "scenes": []}


def cue_abs(name, scene=None, k=0):
    """Absolute time (s) of the k-th cue of this name in the script (optionally in one scene), or None."""
    by = {x["id"]: x for x in CTX["scenes"]}
    n = 0
    for sc in (CTX["script"] or {"scenes": []})["scenes"]:
        if scene and sc["id"] != scene:
            continue
        ts = by.get(sc["id"])
        if ts is None:
            continue
        for b in sc["beats"]:
            for c in b.get("sfx", []):
                if c[0] == name:
                    if n == k:
                        bt = ts["beats"][b["id"]]
                        return ts["start"] + (bt["e"] if c[1] == "end" else bt["s"] + c[1])
                    n += 1
    return None


def drone_note(m, d, bright=420):
    """One note of the alarm's dread: a saw and a sine an octave apart through a low-pass, a slow beat between two detuned saws (the walls humming), a swell in and a 20 ms release (it is cut with the horn)."""
    f = midi(m)
    x = osc("saw", f, d) * .5 + osc("saw", f * 1.006, d) * .35 + osc("sine", f, d) + osc("sine", 2 * f, d) * .3
    return lp(x, bright, 2) * ar(d, min(.9, d * .4), .02) * .55


# ================================================================ alarm
def cue_alarm18(T, t0, d, beats, D):
    """8:00 PM, code red (30.4 s). NO MUSIC WHILE THE HORN RUNS: the horn and the doors are the score. Under them a very low drone that gains a note with every door that shuts (D2, A2, D3, F3, A3, D4:
    a D minor chord built one door at a time, louder and a little brighter each time; the times are the door table's: build/ep18/door_events.json); it is cut with the horn (the snooze, 20.95) and the span
    from there to 'Doors are pending!' is silent (the quiet, then the Marshal's 'That is not how an alarm works.'). 'Doors are pending!' (24.88) is a descending tuba (B-flat, G, D) on its three words.
    'The wrong one.' (27.95): a single held note (a cello, D3) that starts on 'wrong' and is still ringing under the sting (29.09), which is the sfx's: a door DUN on D minor."""
    p1, b3, l2, m2, en = (beats[k] for k in ("p1", "b3", "l2", "m2", "end"))
    stop = cue_abs("hornstop", "alarm") or (t0 + 20.948)
    ds = [t for t in door_times(CTX["scenes"]) if t0 < t < stop][:6]
    notes = (38, 45, 50, 53, 57, 62)
    for i, t in enumerate(ds):
        T.put(drone_note(notes[i], stop - t + .03, 300 + 90 * i), t, .05 + .014 * i, 0)
    MUTES.append((stop - .006, b3[0] - .25, .006))
    for at, key in ((W("b3", "doors"), 46), (W("b3", "are"), 43), (W("b3", "pending"), 38)):
        T.put(tuba(key, .55 if key > 38 else 1.0, a=.04, r=.2), at, .17, -.1)
    t_w = W("m2", "wrong") - .1
    held = t0 + d - .12 - t_w
    T.put(cello(50, held, .9, a=.35, r=.9), t_w, .1, 0)
    T.put(strings([38, 45], held, .6, .9, 4.5, 800), t_w + .1, .04)
    T.fade(t0 + d - .9, t0 + d, 1, 0)
    D.fade(t0 + d - .9, t0 + d, 1, 0)


# ================================================================ evac
SILENT = ((0, 0, 67, 1.5), (0, 1.5, 69, .5), (0, 2, 67, 1), (1, 0, 64, 3),
          (2, 0, 67, 1.5), (2, 1.5, 69, .5), (2, 2, 67, 1), (3, 0, 64, 3),
          (4, 0, 74, 2), (4, 2, 74, 1), (5, 0, 71, 3),
          (6, 0, 72, 2), (6, 2, 72, 1), (7, 0, 67, 3))
SILENT_CH = ("C", "C", "C", "C", "G7", "G7", "C", "C")
SCH = {"C": (48, 52, 55, 60, 64), "G7": (43, 50, 53, 59, 62)}
CAROL_BL = 60 / 72.0


def carol(T, a, b, N):
    """'Silent Night' in C, 3/4 at 72 bpm, as a Yule-log television plays it (a = the first beat, b = where the set goes dark): a soft piano on the tune, a nylon guitar picking the chord (the root on 1,
    the upper notes on 2 and 3) and a string pad, all rendered on their own track and put through a small speaker (see tvfx). It is cut dead at b."""
    V = Track(N)
    bl = CAROL_BL
    for bar, beat, m, dd in SILENT:
        at = a + (bar * 3 + beat) * bl
        if at >= b:
            continue
        V.put(piano(m, min(dd * bl * .95, 2.4), .6), at, .1, 0)
        V.put(celesta(m + 12, 1.0, .5) * .5, at, .025, .1)
    for bar in range(8):
        ch = SILENT_CH[bar]
        at0 = a + bar * 3 * bl
        if at0 >= b:
            continue
        nt = SCH[ch]
        V.put(nylon(nt[0], 1.4), at0, .07, -.2)
        for j, bt in enumerate((1, 2)):
            for q, m in enumerate(nt[1:4]):
                V.put(nylon(m, .6), at0 + bt * bl + q * .03, .035, -.1 + .1 * q)
        V.put(strings(list(nt[1:4]), 3 * bl, .5, .7, 4.8, 1800), at0, .04)
    i, j = int(a * SR), min(N, int((b + .3) * SR))
    V.buf[:, i:j] = tvfx(V.buf[:, i:j])
    T.buf += V.buf
    MUTES.append((b - .004, b + 1.3, .004))


def flood(T, at, d, N):
    """(T is the track it goes onto: the dry one, so that the stop is clean.) The Strawberries arrive: forty tired voices on an 'ah' all sliding up at once (a rising glissando of twenty-four layers, each a different pitch and each its own start, a third of an octave
    to an octave and a half up over d seconds), swelling as they come, spread across the field. Rendered on its own track."""
    r = np.random.default_rng(1819)
    n = int(d * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for i in range(24):
        f0 = 150 * 2 ** (r.uniform(0, 12) / 12)
        rise = 2 ** (r.uniform(8, 20) / 12)
        late = r.uniform(0, .5)
        tt = np.clip(t - late, 0, None)
        f = f0 * rise ** (np.clip(tt / (d - late), 0, 1) ** 1.3) * (1 + .005 * np.sin(2 * np.pi * r.uniform(4.5, 6) * t + i))
        x = np.cumsum(f) / SR * 2 * np.pi
        v = np.zeros(n)
        for k in range(1, 12):
            v += np.sin(k * x) / k ** 1.1
        v = bp(v, 600, 1300, 1) + .6 * bp(v, 1000, 2400, 1)
        env = np.clip(np.clip((t - late) / (d * .8), 0, 1) ** 1.7, 0, 1) * (t > late)
        pan = r.uniform(-.9, .9)
        th = (pan + 1) * np.pi / 4
        out[0] += v * env * np.cos(th)
        out[1] += v * env * np.sin(th)
    out /= np.abs(out).max() + 1e-9
    V = Track(N)
    V.put(out * .9, at, .11, 0)
    T.buf += V.buf


def waltz(T, D, a, b, bl=60 / 72.0, rt=45):
    """A slow shuffling waltz in A minor from a to b (a = the downbeat): an upright bass on 1 ('oom', A), a muted piano on 2 and 3 ('pah, pah': A C E), and a clarinet that has all the time in the
    world (E D C B A). The walker's taps (the sfx `wheelchair`) fall on the same beats."""
    k = 0
    at = a
    while at < b - .05:
        beat = k % 3
        if beat == 0:
            T.put(ubass(rt if (k // 3) % 2 == 0 else rt - 4, .6, .65), at, .12, -.15)
        else:
            for q, m in enumerate((57, 60, 64) if (k // 3) % 2 == 0 else (53, 57, 60)):
                T.put(piano(m, .25, .35), at + q * .012, .05, .2)
        k += 1
        at += bl
    for off, m, dd in ((0, 76, 1.5), (1.5, 74, .5), (2, 72, 1), (3, 71, 3)):
        if a + off * bl < b - .05:
            T.put(clarinet(m, min(dd * bl, 2.0), a=.06, r=.3), a + off * bl, .07, -.1)


def cue_evac18(T, t0, d, beats, D):
    """8:10 PM, the evacuation (27.5 s). The day room (0.3 to 10.61): 'Silent Night' through the Yule-log television, a small speaker, cosy, a little distorted (piano, nylon guitar, strings); it stops dead
    when the remote kills the set (tvoff 10.61: the span from there is muted after the reverb) and the horn is the only sound left. The line leaves (12.0 to 15.0): a slow shuffling waltz in A minor
    (bass, muted piano, a clarinet) whose beats are the walker's taps (the sfx `wheelchair` is on the same 72 bpm grid, its first tap 0.15 s after the cue). The headcount: a counting pizzicato on 'Thirty-eight.
    Thirty-nine. Forty.' (C D E, the last with its bass) and a cadence on 'Good.'; the Strawberries' flood (19.55 to 21.0, 'I'm one person.'): twenty-four voices on an 'ah' that glide up together; and
    on 'Eighty.' (21.02) THE RECORD STOPS (a tape-stop; the flood is cut) and the music is gone under 'Forty are unassigned.' and 'They are in my hallway.'; a dry resolve (a fifth down, two
    pizzicato notes) on 'Unassigned.' (24.83). The sting (26.11) is the sfx's."""
    l3, m1, l4, ch1, l5, t1, l6, t2, line = (beats[k] for k in ("l3", "m1", "l4", "ch1", "l5", "t1", "l6", "t2", "line"))
    tvoff = cue_abs("tvoff", "evac") or (t0 + 10.608)
    carol(T, t0 + .3, tvoff, T.N)
    w0 = line[0] + .15
    waltz(T, D, w0, l3[0] - .05, CAROL_BL)
    T.gate(l3[0] - .05, m1[0] - .05, 0.0, .04)
    for j, key in enumerate(("thirty-eight", "thirty-nine", "forty")):
        at = W("m1", key)
        T.put(pizz(midi((60, 62, 64)[j] + 12), .22), at + .02, .11, -.1 + .1 * j)
        T.put(marimba(midi((60, 62, 64)[j] + 24), .18), at + .02, .05, .2)
        if j == 2:
            T.put(ubass(36, .5, .8), at + .02, .16, -.1)
    T.put(pizz(midi(55), .2), W("l4", "good"), .1, .2)
    T.put(ubass(36, .6, .8), W("l4", "good"), .16, -.1)
    flood(D, ch1[0] - .1, l5[0] - ch1[0] + .1, T.N)
    fe = l5[0] - .01
    D.put(tape_stop(.55) * .6, fe, .07, 0)
    wu = W("t2", "unassigned")
    T.put(pizz(midi(55), .3), wu + .38, .13, .1)
    T.put(pizz(midi(48), .5), wu + .68, .14, .1)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ clear
INSPECT_BASS = (38, 45, 38, 45, 41, 48, 41, 48, 43, 50, 43, 50, 45, 52, 45, 52)
INSPECT_TUNE = ((0, 0, 74, 1), (0, 1.5, 77, .5), (0, 2, 76, .5), (0, 2.5, 74, .5), (0, 3, 69, 1),
                (1, 0, 70, 1), (1, 1.5, 74, .5), (1, 2, 72, .5), (1, 2.5, 70, .5), (1, 3, 65, 1),
                (2, 0, 67, 1), (2, 1.5, 70, .5), (2, 2, 69, .5), (2, 2.5, 67, .5), (2, 3, 62, 1),
                (3, 0, 69, 2), (3, 2, 64, 1))


def inspection(T, D, a, b, lvl=1.0):
    """The State at work from a to b (the bars are bent so that a downbeat falls on b, the PASS stamp): a dry bassoon that walks in staccato eighths (D A D A / F C F C / G D G D / A E A E), an oboe
    that makes its remarks (D5 F5 E5 D5 A4 / B-flat4 D5 C5 B-flat4 F4 / G4 B-flat4 A4 G4 D4 / A4 held, E4), a woodblock that is a pen on a clipboard (on 2 and 4) and a pizzicato on the off-beats."""
    ts, bl = groove_times(a, b, 4, 90.0)
    for k, at in enumerate(ts):
        bar, beat = divmod(k, 4)
        T.put(bassoon(INSPECT_BASS[(bar % 4) * 4 + beat], bl * .7, .8), at, .12 * lvl, -.15)
        if beat in (1, 3):
            D.put(woodblock(), at, .03 * lvl, .3)
        T.put(pizz(midi(INSPECT_BASS[(bar % 4) * 4 + beat] + 12), .14), at + bl / 2, .04 * lvl, .25)
    nbar = len(ts) // 4
    for i in range(nbar):
        for bar, beat, m, dd in INSPECT_TUNE:
            if bar != i % 4:
                continue
            at = a + (i * 4 + beat) * bl
            if at < b - .1:
                T.put(oboe(m, dd * bl * .92, a=.04, r=.1), at, .07 * lvl, .2)


def cue_clear18(T, t0, d, beats, D):
    """8:25 PM, all clear (31.2 s). Silence from the panel (0.2 to 1.3). THE INSPECTION (1.3 to 15.81): a dry bassoon and oboe, a pen of woodblock and a pizzicato, 4/4 in D minor with the bars bent so that a
    downbeat lands on the STAMP (15.81: 'Pass.'), where the State approves with a chord that is much too big (D major, brass, strings, a timpani). 'The paperwork is perfect.' ends on four rising notes on
    the oboe (D F-sharp A D). THEN A HUSH: no music from 18.95: the chirp (19.45) is the music; a very quiet bassoon pedal (D2) under 'What is that sound?' to 'Maintenance.' (20.5 to 25.2) and a rest
    over the second chirp (25.52); one pizzicato plink on 'Per diem.' Binder's jingle curdles on 'Great! I'll help.' (27.94: C D E-flat G-flat) and ends on ONE LAST MINOR CHORD (D minor, 28.78, strings and
    a muted horn, 0.5 s) that is gone before the last chirp (29.38); nothing under it; the span from 29.33 to the end is muted. The sting (29.88) is the sfx's."""
    st1, st5, st6, k1, o5, s2, t1, s3, b1 = (beats[k] for k in ("st1", "st5", "st6", "k1", "o5", "s2", "t1", "s3", "b1"))
    stamp = cue_abs("stamp", "clear") or (t0 + 15.813)
    inspection(T, D, st1[0], stamp, 1.0)
    T.put(brass([50, 57, 62, 66, 69], 1.0, .02, .6, 2200), stamp, .09, 0)
    T.put(strings([50, 57, 62, 66, 69, 74], 1.4, .05, .9, 5.0, 2400), stamp, .1)
    D.put(timp(73.4, 1.2), stamp, .15, 0)
    D.put(crash(1.2) * .6, stamp, .05, .1)
    pf = W("st6", "perfect") - .1
    for j, m in enumerate((74, 78, 81, 86)):
        T.put(oboe(m, .22, a=.03, r=.08), pf + j * .13, .08, .2)
        T.put(bassoon(m - 24, .2, .8), pf + j * .13, .08, -.15)
    MUTES.append((st6[1] + .05, k1[0] + .05, .03))
    T.put(bassoon(38, o5[1] - k1[0] - .2, .6, a=.5, r=.4) * 1.0, k1[0] + .05, .06, 0)
    MUTES.append((cue_abs("chirp", "clear", 1) - .25, cue_abs("chirp", "clear", 1) + .35, .04))
    T.put(pizz(midi(52), .3), t1[0] + .12, .1, .2)
    b1a = b1[0] - .02
    bounce(T, b1a, BJ_MINOR, .08, .2, 0.0, True)
    T.put(strings([38, 45, 50], .7, .3, .3, 4.5, 700), b1a, .05)
    fin = b1[1] - .005
    T.put(strings([50, 53, 57, 62], .5, .05, .3, 4.5, 1500), fin, .1)
    T.put(horn(57, .5, .6, a=.05, r=.3), fin, .06, .1)
    D.put(timp(73.4, 1.0), fin, .1, 0)
    ch3 = cue_abs("chirp", "clear", 2) or (t0 + 29.384)
    MUTES.append((ch3 - .06, t0 + d, .05))
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ the score
CUES = {"title": cue_title18, "notice": cue_notice18, "marshal": cue_marshal18, "alarm": cue_alarm18, "evac": cue_evac18, "clear": cue_clear18, "end": cue_end18}
LEVEL18 = {"title": 1.5, "notice": 2.4, "marshal": 1.9, "alarm": 1.5, "evac": 2.2, "clear": 2.2, "end": 1.1}
TAIL18 = {"title": .5, "notice": .4, "marshal": .4, "alarm": .4, "evac": .4, "clear": .4, "end": .3}
DIP18 = {"title": 1.0, "notice": .6, "marshal": .6, "alarm": .6, "evac": .6, "clear": .6, "end": 1.0}
REVERB18 = {"title": (.4, 1.2), "notice": (.3, .9), "marshal": (.3, 1.1), "alarm": (.3, 1.0), "evac": (.2, .6), "clear": (.3, .9), "end": (.4, 1.2)}
DIPS18 = {"click": (3, .1, .1), "textding": (3, .2, .2), "stamp": (6, .25, .3), "chirp": (10, .15, .3), "binderpop": (3, .1, .15), "pinpull": (4, .3, .2),
          "foamsplat": (6, .3, .3), "tvoff": (6, .3, .3), "printer": (3, .5, .3), "clipboard": (4, .2, .2), "doorbonk": (6, .5, .3)}


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    M10._CTX["lines"] = {(ln["scene"], ln["id"]): ln for ln in lines}
    CTX["script"], CTX["scenes"] = script, scenes
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
        wet, rt = REVERB18.get(sc["id"], (.35, 1.1))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL18.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP18.get(sc["id"], .6)
        dips = DIPCACHE.setdefault(key, None)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        out[:, a:b] += seg * LEVEL18.get(sc["id"], 1.0) * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS18)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
