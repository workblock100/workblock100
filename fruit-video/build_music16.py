"""Episode 16 score: THE VOTE. Civic pomp turning petty.

build_audio16 (a copy of build_audio15's wrapper) calls score(script, scenes, lines, N) through --music build_music16; the mixer ducks the bed under every voice (and so does this file:
_speech_dip). The instruments and the helpers come from build_music15 (the ukulele-and-marimba palette is still there for the Binder jingle) and the shape of the score is the same: every
scene is rendered on two tracks (U through the room's reverb, D dry), muted spans are applied after the reverb. The new colour is a municipal BRASS BAND: a tuba on 1 and 3, brass on 2 and 4,
a snare, trumpets on the tune.

MOTIFS (the series' leitmotifs, re-voiced):
  MERGE THEME   in D major this time (the title lands on the stamp at 2.80 s, so the bar is 2.6 s: the arpeggio D F# A D A F# A D in eighths, the last beat on G, the resolution G to D on the
                stamp; the tune F# E D E / F# A B A / E F# over D A / Bm G / A D). The end card ends on D major with the major seventh added (C#), held, and a trombone that sags a semitone: smug.
  BINDER JINGLE C D E G, as a CAMPAIGN JINGLE on the trumpets with a snare roll when the poster and the candidate appear; the pizzicato version under his offer; the curdled version (C D E-flat
                G-flat, slow, a drone on D) on 'Great! I'll help.'; in the count the incumbent's reveal is the same four notes in a major march with ONE FLAT NOTE (the E, 40 cents low).
  ONION'S CLARINET SOB under her 'Unassigned are eligible. Per policy.'; TOMATO'S PIZZICATO (major then minor) on her lines.
"""
import numpy as np

from build_audio import SR, tarr, osc, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pizz, marimba, bell, sub_bass, pad, strings, brass, hat, shaker, timp, roll, riser, impact, crash, tick, heart, kick, snare, clap, tom,
                          epiano, MUSIC_GAIN, _n)
from build_music7 import woodblock, taiko, choir, slide_brass
import build_music10 as M10
from build_music10 import tuba, mtrumpet, clarinet, violin, brush, cue_dips, slide_whistle
from build_music9 import grid, snap, uke, spic, rising
from build_music13 import _mute, _speech_dip, glass, revcym, sub_swell, ubass, kick13, snare13, cello
from build_music14 import horn, trumpet, harp, celesta, xylo, bassoon, bdrum, tamtam
from build_music15 import (whistle, sob_clar, bounce, accel_roll, stab, fanfare, comp, binder_bed, CHORDS, ROOTS, BJ, BJ_MINOR, TP_MAJ, TP_MIN, MT_ARP, MT_TUNE, MT_CHORDS, W)

MUTES = []
BL16 = .65          # a beat of the Merge theme in Episodes 16 and 17: 92.3 bpm, a bar of 2.6 s (0.2 to 2.8 s in the title)
TR16 = 2            # D major


# ================================================================ the Merge theme, transposed and re-voiced (Episode 17 imports these)
def merge_bar1(T, D, t0, tr, style, g=1.0, bl=BL16):
    """Bar 1 of the Merge theme from t0 (4 beats of `bl`): the arpeggio in eighths, the last beat on the subdominant. style 'brass': trumpets over a tuba and a snare roll that climbs to the
    downbeat (a municipal band); style 'uke': marimba and glockenspiel over a pad, a pizzicato bass and claps (corporate)."""
    st = bl / 2
    for i, m in enumerate(MT_ARP):
        lv = (.5 + .5 * i / 7) * g
        n = m + tr
        if style == "brass":
            T.put(trumpet(n, .26, .8), t0 + i * st, .075 * lv, -.2 + .05 * i)
            T.put(bell(midi(n + 12), .8) * .4, t0 + i * st, .035 * lv, .3)
        else:
            T.put(marimba(midi(n), .3), t0 + i * st, .11 * lv, -.2 + .05 * i)
            T.put(bell(midi(n + 12), .8) * .4, t0 + i * st, .06 * lv, .25)
    root = 36 + tr
    for k in range(3):
        T.put((tuba(root + 12, bl * .8) if style == "brass" else ubass(root, .4, .7)), t0 + k * bl, (.16 if style == "brass" else .17) * g, -.1)
    T.put((tuba(root + 17, bl * .8) if style == "brass" else ubass(root + 5, .5, .8)), t0 + 3 * bl, .16 * g, -.1)
    T.put(pad([48 + tr, 52 + tr, 55 + tr, 60 + tr], 3 * bl, .5, .3, 1500), t0, .08 * g)
    T.put(pad([53 + tr, 57 + tr, 60 + tr, 65 + tr], bl + .1, .1, .2, 1700), t0 + 3 * bl, .09 * g)
    if style == "brass":
        accel_roll(D, t0 + 2 * bl, t0 + 4 * bl - .02, 6, 30, .012, .08)
        for k in (1, 3):
            D.put(snare13(.7), t0 + k * bl, .06 * g, .1)
    else:
        for k in (1, 3):
            D.put(clap(), t0 + k * bl, .1 * g, .2)
        D.put(roll(160, 2 * bl * .95, 10) * .5, t0 + 2 * bl, .05 * g, 0)


def merge_land(T, D, at, tr, style, chord="add9", g=1.0):
    """The resolution on the downbeat `at`: brass and strings on the tonic chord (chord: 'add9' major with a ninth, 'maj7' major with the seventh, 'sus2' F G C: a suspension that does not
    resolve), a timpani and a bass drum, a crash."""
    base = {"add9": (48, 55, 60, 64, 67, 72, 74), "maj7": (48, 55, 59, 64, 67, 71, 76), "sus2": (48, 55, 62, 67, 72, 74, 79), "sus4": (48, 53, 60, 65, 67, 72, 77)}[chord]
    ch = [m + tr for m in base]
    T.put(brass(ch, 1.8, .02, .8, 2500), at, .1 * g, 0)
    T.put(strings(ch, 3.4, .1, 1.7, 5.0, 2800), at, .12 * g)
    T.put(timp(65 * 2 ** (tr / 12), 1.4), at, .2 * g)
    D.put(kick13(1.0), at, .15 * g, 0)
    if style == "brass":
        D.put(bdrum(1.0, 1.0), at, .17 * g, 0)
    D.put(crash(1.8) * .7, at, .08 * g, .1)


def merge_tune(T, D, t0, nbars, tr, style, bl=BL16, flat_last=0.0, g=1.0, until=None):
    """Bars 2 and 3 of the Merge theme from t0: the tune (a trumpet and a whistle in the band style, a marimba and a whistle in the corporate one) over a bass, a kick, claps, hats and a
    pad on the chords C G / Am F / G C moved to the key. `until`: stop the notes that begin after this time."""
    for b in range(nbars):
        bt = t0 + b * 4 * bl
        for h in range(2):
            ch = MT_CHORDS[b][h]
            chn = [m + tr for m in CHORDS[ch]]
            T.put(pad([m - 12 for m in chn] + [chn[0]], 2 * bl + .1, .08, .25, 1500), bt + h * 2 * bl, .08 * g)
            for k in range(2):
                at = bt + (2 * h + k) * bl
                if until is not None and at > until:
                    continue
                rt = ROOTS[ch] + tr
                if style == "brass":
                    T.put(tuba(rt + 12 + (0 if k == 0 else 7), bl * .8), at, .15 * g, -.1)
                    T.put(brass([m for m in chn[1:]], .16, .01, .06, 1800), at + bl / 2, .05 * g, .3)
                    D.put(kick13(.8) if k == 0 else snare13(.7), at, .09 * g, 0)
                else:
                    T.put(ubass(rt + (0 if k == 0 else 7), .45, .75), at, .17 * g, -.1)
                    D.put(kick13(.8) if k == 0 else clap(), at, .1 * g if k == 0 else .09 * g, 0 if k == 0 else .2)
                    comp(T, at + bl / 2, list(chn), .3, .06 * g, .35)
                D.put(hat(), at + bl / 2, .035 * g, -.2)
    for bar, beat, m, dur in MT_TUNE:
        if bar >= nbars:
            continue
        at = t0 + bar * 4 * bl + beat * bl
        if until is not None and at > until:
            continue
        last = (bar, beat) == (2, 2) and nbars == 3
        fl = flat_last if last else 0.0
        dd = dur * bl * (.95 if dur < 2 else 1.0)
        n = m + tr - fl
        if style == "brass":
            T.put(trumpet(n, min(dd, 1.4), .85), at, .09 * g, .15)
            T.put(horn(n - 12, min(dd, 1.4), .8, a=.04, r=.1), at, .05 * g, -.1)
        else:
            T.put(marimba(midi(n), min(dd, .6)), at, .12 * g, .15)
        T.put(whistle(n + 12, dd, .8), at, .06 * g, -.15)
        T.put(bell(midi(n + 12), 1.0) * .3, at, .04 * g, .3)


# ================================================================ title and end
def cue_title16(T, t0, d, beats, D):
    """The poll card becomes the title (6.2 s). 0.2 to 2.8: the Merge theme's first bar in D major on trumpets over a tuba, a pad and a snare roll that climbs; the card's two clicks (1.2, 2.4) get
    woodblock taps; on the STAMP (2.80) the resolution G to D: brass and strings with a ninth, a timpani, a bass drum and a crash; the tune (2.8 to 5.4) on a trumpet and a whistle over a
    brass-band bass; the text ding (4.0) a glockenspiel and harp shimmer; a held D chord fades to the cut."""
    a, land = t0 + .2, t0 + 2.8
    merge_bar1(T, D, a, TR16, "brass")
    T.put(riser(2.4, 400, 5000, .4), a + .1, .045, 0)
    for at in (1.2, 2.4):
        D.put(woodblock(), t0 + at, .08, .2 if at > 2 else -.2)
    merge_land(T, D, land, TR16, "brass", "add9")
    merge_tune(T, D, land, 1, TR16, "brass")
    for k, m in enumerate((86, 90, 93, 98, 102)):
        T.put(celesta(m, 1.2, .8), t0 + 3.98 + .045 * k, .05, -.4 + .2 * k)
        T.put(harp(m - 12, 1.6, .6), t0 + 4.0 + .05 * k, .055, -.3 + .15 * k)
    T.put(pad([50, 57, 62, 66, 69], 2.0, .3, 1.0, 1700), t0 + 4.3, .09)
    T.fade(t0 + d - .6, t0 + d, 1, 0)
    D.fade(t0 + d - .6, t0 + d, 1, 0)


def cue_end16(T, t0, d, beats, D):
    """The end card (7.0 s): the Merge theme reprised by the band in D major. Bar 1 (0.1 to 2.7) the arpeggio and the snare roll, the resolution at 2.7, bars 2 and 3 the tune over D A / Bm G /
    A D, the stamp (4.0) gets a bass drum. The last chord (5.3 to 7.0) is D major with the major seventh added (C-sharp), held, smug; a trombone sags a semitone under it at 6.35."""
    merge_bar1(T, D, t0 + .1, TR16, "brass", 1.1)
    land = t0 + .1 + 4 * BL16
    merge_land(T, D, land, TR16, "brass", "add9")
    merge_tune(T, D, land, 1, TR16, "brass")
    D.put(bdrum(.9, .8), t0 + 4.0, .13, 0)
    fin = t0 + 5.3
    T.put(brass([50, 57, 61, 66, 69, 73, 78], 1.7, .04, .9, 2300), fin, .1, 0)
    T.put(strings([50, 57, 61, 66, 69, 73, 78], 1.8, .05, 1.0, 5.0, 2600), fin, .11)
    T.put(horn(78, 1.7, .85, a=.06, r=.9), fin, .08, .1)
    T.put(slide_brass(62, 60.4, .8, 700), t0 + 6.15, .09, -.1)
    D.put(timp(73, 1.2), fin, .15, 0)
    T.fade(t0 + d - .9, t0 + d, 1, 0)
    D.fade(t0 + d - .9, t0 + d, 1, 0)


# ================================================================ helpers for the vote
CIVIC_TUNE = (((77, 0, .5), (77, .5, .5), (79, 1, 1), (81, 2, .5), (81, 2.5, .5), (82, 3, 1)), ((81, 0, 1), (79, 1, 1), (77, 2, 1.5), (74, 3.5, .5)),
              ((77, 0, .5), (77, .5, .5), (79, 1, 1), (81, 2, .5), (81, 2.5, .5), (84, 3, 1)), ((82, 0, 1), (81, 1, 1), (79, 2, 2)))


def civic_march(T, D, a, b, bpm=116.0, lvl=1.0, prog=("F", "F", "Bb", "C"), tune=True):
    """A municipal brass-band march from a to b: a tuba on 1 and 3 (root, then fifth) with a bass drum, brass chords on 2 and 4 with a snare, ghost notes on the off eighths, and (tune) a
    trumpet and a horn on a four-bar civic tune in F: ta-ta TAA-ta ta TAA."""
    bl = 60 / bpm
    for k, at in enumerate(grid(a, b, bpm, 1.0)):
        bar, beat = divmod(k, 4)
        ch = prog[bar % len(prog)]
        if beat in (0, 2):
            T.put(tuba(ROOTS[ch] + 12 + (0 if beat == 0 else 7), bl * .75), at, .17 * lvl, -.1)
            D.put(kick13(.8), at, .07 * lvl, 0)
        else:
            T.put(brass(list(CHORDS[ch]), bl * .3, .008, .06, 1900), at, .06 * lvl, .25)
            D.put(snare13(.8), at, .07 * lvl, 0)
        D.put(snare13(.5, ghost=True), at + bl / 2, .03 * lvl, .1)
    if tune:
        nb = int((b - a) / (4 * bl))
        for i in range(nb):
            for m, off, dur in CIVIC_TUNE[i % 4]:
                at = a + i * 4 * bl + off * bl
                if at < b - .15:
                    T.put(trumpet(m, dur * bl * .9, .85), at, .08 * lvl, .15)
                    T.put(horn(m - 12, dur * bl * .9, .8, a=.03, r=.08), at, .05 * lvl, -.15)


def nervous(T, D, a, b, bpm=132.0, lvl=1.0):
    """A nervous pizzicato in D minor under the ballots: eighth notes that circle D A F A, a woodblock tick on the off 16ths, a low string pedal."""
    fig = (50, 57, 53, 57, 50, 57, 55, 57)
    for k, at in enumerate(grid(a, b, bpm, .5)):
        T.put(pizz(midi(fig[k % 8] + 12), .12), at, .075 * lvl, -.25 if k % 2 else .25)
        if k % 2:
            D.put(tick(), at + 60 / bpm / 4, .035 * lvl, .3)
    T.put(strings([38, 45], b - a, .6, .5, 4.0, 600), a, .05 * lvl)


def campaign(T, D, at, big=1.0):
    """The campaign-jingle version of the Binder motif: C D E G on two trumpets (the last held), a tuba under it, a snare and a crash on the held note."""
    for j, m in enumerate(BJ):
        dd = .11 if j < 3 else .55
        T.put(trumpet(m + 12, dd, .95), at + j * .13, .08 * big, .2)
        T.put(trumpet(m, dd, .85), at + j * .13, .05 * big, -.2)
        T.put(bell(midi(m + 24), .8) * .4, at + j * .13, .03 * big, .3)
    T.put(tuba(36, .5), at, .15 * big, 0)
    D.put(crash(1.2) * .6, at + .39, .06 * big, .1)
    D.put(snare13(1.0), at + .39, .07 * big, 0)


def tape_stop(d=.5):
    """A record stopping: a saw that falls from 900 Hz to 55 Hz, slower and slower, with its level and brightness falling and a breath of noise."""
    t = tarr(d)
    f = 900 * (55 / 900) ** ((t / d) ** .7)
    x = osc("saw", f, d)
    x = lp(x, 2500, 2) * (1 - t / d) ** 1.4 + bp(np.random.default_rng(16).uniform(-1, 1, len(t)), 600, 3000) * .15 * (1 - t / d)
    return x * ar(d, .002, .03)


def engraver(d, seed=3):
    """An engraver's rotary tool: a whine near 3.6 kHz that drifts, buzzes at 58 Hz and starts and stops in strokes."""
    from scipy.ndimage import uniform_filter1d
    r = np.random.default_rng(seed)
    t = tarr(d)
    f = 3600 + 500 * np.sin(2 * np.pi * 1.3 * t) + 200 * np.sin(2 * np.pi * 7.1 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + .35 * np.sin(2 * ph + 1) + .2 * np.sin(3 * ph)) * (1 + .35 * np.sin(2 * np.pi * 58 * t)) + bp(r.uniform(-1, 1, len(t)), 2000, 7000) * .25
    g = np.zeros(len(t))
    u = 0.0
    while u < d:
        L = r.uniform(.18, .4)
        g[int(u * SR):int((u + L) * SR)] = 1
        u += L + r.uniform(.06, .14)
    g = uniform_filter1d(g, int(.02 * SR) | 1)
    return x * g * ar(d, .05, .1) * .3


# ================================================================ ballot
def cue_ballot16(T, t0, d, beats, D):
    """6:30 PM, the ballot (24.8 s). A municipal brass-band march in F under Melon (0.3 to 6.0): a tuba, brass and snare, a trumpet-and-horn civic tune. Onion's ballots (6.1 to 11.0) are a
    nervous pizzicato in D minor (eighths circling D A F A, a woodblock tick), and Tomato's 'One choice per person.' a major-then-minor pizzicato. When the poster and the candidate appear
    ('Binder.' 11.12 and 'Binder is the candidate.' 12.80) the campaign jingle: C D E G on trumpets with a tuba, a snare and a crash. Dead hush (14.62 to 16.6) for Strawberry's
    'That's one choice.' and 'Efficiency.' Binder's offer (16.73): his four notes as the pizzicato bed; on 'Great! I'll help.' (19.18) it curdles (flat and slow, a drone on D). The cast
    (20.22 to 22.8) is the flood: a snare roll that climbs from 5 to 40 strokes a second, a riser, a timpani and a woodblock on each click, and a pile-up of xylophone on the five pops (a note
    added with every pop, C6 D6 E6 G6 A6), all stopped dead at the crowd (22.80). The sting (23.97) is the sfx's."""
    a1, o1, t1, m1, o2, o3, s1, t2, b1, s2, b2, ca = (beats[k] for k in ("a1", "o1", "t1", "m1", "o2", "o3", "s1", "t2", "b1", "s2", "b2", "cast"))
    civic_march(T, D, t0 + .3, o1[0] - .1, 116, .9)
    T.fade(o1[0] - .5, o1[0] - .08, 1, 0)
    D.fade(o1[0] - .5, o1[0] - .08, 1, 0)
    nervous(T, D, o1[0] - .05, o2[0] - .12)
    for j, ch in enumerate((TP_MAJ, TP_MIN)):
        for q, m in enumerate(ch):
            T.put(pizz(midi(m + 12), .16), t1[1] - .5 + j * .3 + q * .05, .07, .3)
    campaign(T, D, o2[0] - .02, 1.0)
    campaign(T, D, o3[0] - .02, 1.3)
    MUTES.append((s1[0] - .08, b1[0] - .12, .03))
    binder_bed(T, D, b1[0] + .05, b2[0] - .05, 120, .9)
    binder_bed(T, D, b2[0] - .02, ca[0] + .3, 90, 1.0, minor=True)
    T.put(strings([38, 45, 50], 1.6, .5, .5, 4.5, 700), b2[0], .05)
    c0 = t0 + 20.3
    accel_roll(D, c0 + .2, t0 + 22.8, 5, 40, .02, .2)
    T.put(riser(2.5, 250, 6500, .5), c0, .09, 0)
    T.put(strings([50, 57, 62, 66, 69], 2.5, 2.0, .05, 5.0, 2800), c0, .08)
    for k, at in enumerate((20.518, 20.918, 21.318)):
        D.put(woodblock(), t0 + at, .1, (-.3, .3, 0)[k])
        D.put(timp(98, .5), t0 + at, .12, 0)
    cl = (79, 81, 83, 86, 88, 91)
    for j, at in enumerate((21.918, 22.118, 22.318, 22.468, 22.618)):
        for q in range(j + 1):
            T.put(xylo(cl[q], .25, .9), t0 + at + .015 * q, .1, -.6 + .25 * q)
        T.put(celesta(cl[j] + 12, .5, .7), t0 + at, .05, .4)
    MUTES.append((t0 + 22.80, t0 + 23.92, .004))
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ count
def cue_count16(T, t0, d, beats, D):
    """7:30 PM, the count (23.8 s). Bureaucracy: a tally-clicker rhythm (a woodblock and a tick in a 3 + 3 + 2 pattern at 126 bpm) over a walking pizzicato bass in D minor (0.3 to 12.9), and
    a string line that climbs two octaves while the bar grows to 48 ('Binder, forty-eight.' 2.12 to 7.5); a pause for 'Those are me.' (7.5 to 8.6: nothing). Onion's clarinet sob falls on
    'Per policy.' (10.1); Tomato's 'Pending, one.' is her pizzicato. On the void (12.91) the record stops (a saw falling from 900 to 55 Hz) and a low tuba on D holds under 'One real
    ballot. The election is void.' (13.2 to 17.6). The incumbent's reveal ('Binder.' 18.98) is his motif in a major march (C D E G on trumpets, the E 40 cents flat: the one flat note) which
    plays on, deadpan, under 'He was the only candidate.'; 'Thank you for your support!' (21.55) brings a petty fanfare (ta-ta-ta-TAA) that is cut dead at the grin (22.75)."""
    o1, t1, l1, o2, s1, o3, t2, s2, o4, t3, m1, o5, s3, b1 = (beats[k] for k in ("o1", "t1", "l1", "o2", "s1", "o3", "t2", "s2", "o4", "t3", "m1", "o5", "s3", "b1"))
    stop = t0 + 12.9
    bl = 60 / 126
    for k, at in enumerate(grid(t0 + .3, stop, 126, 4.0)):
        for j, off in enumerate((0, 3, 6, 1.5, 4.5, 7)):
            tt = at + off * bl / 2
            if tt < stop - .05:
                D.put(woodblock(), tt, .06 if j < 3 else .035, .3 if j % 2 else -.3)
                if j < 3:
                    D.put(tick(), tt, .03, 0)
    walk = (38, 41, 45, 43, 38, 41, 45, 46)
    for k, at in enumerate(grid(t0 + .3, stop, 126, 1.0)):
        T.put(ubass(walk[k % 8], .4, .75), at, .13, -.1)
    T.put(rising(38, 62, 5.4), t1[0] - .05, .055, -.25)
    T.put(rising(45, 69, 5.4), t1[0] - .05, .045, .25)
    MUTES.append((s1[0] - .05, s1[1] + .25, .03))
    T.put(sob_clar(79, 74, .6, .7), t0 + 10.1, .08, -.3)
    for j, ch in enumerate((TP_MAJ, TP_MIN)):
        for q, m in enumerate(ch):
            T.put(pizz(midi(m + 12), .16), t2[0] + .1 + j * .3 + q * .05, .07, .3)
    D.put(tape_stop(.55), stop, .09, 0)
    T.put(tuba(38, 4.4), o4[0] + .1, .13, 0)
    T.put(strings([38, 45], 4.4, .8, .8, 4.0, 500), o4[0] + .1, .04)
    for k, at in enumerate(grid(t3[0] + .1, m1[0] - .1, 66, 1.0)):
        T.put(pizz(midi(50 if k % 2 == 0 else 45), .2), at, .07, -.2 if k % 2 else .2)
    rv = o5[0] - .02
    for j, m in enumerate((72, 74, 75.6, 79)):
        dd = .12 if j < 3 else .6
        T.put(trumpet(m + 12, dd, .95), rv + j * .13, .09, .2)
        T.put(trumpet(m, dd, .85), rv + j * .13, .05, -.2)
    civic_march(T, D, o5[0] + .55, b1[0] - .05, 108, .7, prog=("C", "F", "G", "C"))
    fanfare(T, D, b1[0] + .3, 1.0, (72, 72, 72, 79), (.13, .13, .13, 1.0), .16)
    cut = t0 + 22.749
    T.gate(cut, cut + 1.2, 0.0, .004)
    D.gate(cut, cut + 1.2, 0.0, .004)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ prize
def cue_prize16(T, t0, d, beats, D):
    """8:10 PM, the plaque (12.4 s). A small fanfare for the plaque (0.9 to 1.9: trumpets and a horn, G G C E, a snare and a cymbal); an engraver's whine mixed into the score under 'Name?' and
    'Prize?' (2.6 to 5.0: a rotary tool at 3.6 kHz that starts and stops in strokes, over a staccato pizzicato); Binder's brisk polka (4.8 to 7.8, his four notes, 'A day off!' and 'I love my
    job!' each get a bright stab); 'You do not sleep.' a single deadpan pizzicato; a hush for 'When is the day off?'; a trombone that deflates on 'Pending!' (9.1 to 10.3, C5 down to E-flat3);
    the stamp (10.16) a bass drum; the pending stinger and the sting are the sfx's."""
    a1, ca1, b1, ca2, b2, l1, b3, s1, b4 = (beats[k] for k in ("a1", "ca1", "b1", "ca2", "b2", "l1", "b3", "s1", "b4"))
    fanfare(T, D, a1[0] + .0, .9, (67, 67, 72, 76), (.12, .12, .12, .7), .15)
    T.put(engraver(2.5), t0 + 2.6, .06, .2)
    for k, at in enumerate(grid(ca1[0] + .1, b2[0], 120, .5)):
        T.put(pizz(midi((50, 57, 53, 57)[k % 4] + 12), .12), at, .06, -.2 if k % 2 else .2)
    binder_bed(T, D, b2[0] + .0, l1[0] + .1, 132, .9)
    binder_bed(T, D, b3[0] - .05, s1[0] - .05, 132, .9)
    for ln_ in (b2, b3):
        T.put(brass([60, 64, 67, 72], .2, .01, .08, 2200), ln_[0] + .05, .07, 0)
    D.put(pizz(midi(52), .3), l1[1] + .05, .09, 0)
    MUTES.append((s1[0] - .05, b4[0] - .03, .03))
    T.put(slide_brass(72, 51, 1.3, 800), b4[0] + .02, .12, 0)
    D.put(bdrum(.9, .8), t0 + 10.155, .16, 0)
    T.fade(t0 + d - .5, t0 + d, 1, 0)
    D.fade(t0 + d - .5, t0 + d, 1, 0)


CUES = {"title": cue_title16, "ballot": cue_ballot16, "count": cue_count16, "prize": cue_prize16, "end": cue_end16}
LEVEL16 = {"title": .95, "ballot": 1.5, "count": 1.5, "prize": 1.5, "end": .95}
TAIL16 = {"title": .5, "ballot": .4, "count": .4, "prize": .4, "end": 1.0}
DIP16 = {"title": 1.0, "ballot": .6, "count": .6, "prize": .6, "end": 1.0}
REVERB16 = {"title": (.4, 1.2), "ballot": (.3, 1.0), "count": (.3, .9), "prize": (.3, 1.0), "end": (.4, 1.2)}
DIPS16 = {"stamp": (5, .25, .3), "click": (3, .1, .1), "textding": (3, .2, .2)}


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
        wet, rt = REVERB16.get(sc["id"], (.35, 1.1))
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL16.get(sc["id"], .3) * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        key = DIP16.get(sc["id"], .6)
        dips = DIPCACHE.setdefault(key, None)
        if dips is None:
            dips = DIPCACHE[key] = _speech_dip(lines, N, key)
        out[:, a:b] += seg * LEVEL16.get(sc["id"], 1.0) * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS16)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
