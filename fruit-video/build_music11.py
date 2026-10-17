"""Episode 11 score: welcome back. A time clock that winds up, a hero's welcome that goes sour on 'per diem', an office that cannot stop being busy, two radios and one sprint,
a heist for eighteen hundred dollars with a sad oboe at the end of it, a countdown with a pulse on every tick, and the orchestra that was waiting for the word 'quiet'.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music11; the mixer ducks it under every voice.
  title    a time clock winding up (ticks that speed up, a woodblock, a pizzicato pulse), a hair of silence before the CLUNK, a brass stab for the stamp, the series sting (riser,
           timpani roll, choir, bells) landing on the downbeat, then a bouncy nine-to-five tag under the logo
  arrival  tiptoe pizzicato for 'Is it somebody's birthday?', a dun for 'her badge', a build through the door beat and then the hero's welcome in brass and timpani; stabs for
           the gift basket, the parking pass and the lunch; silence for 'Cool.'; a lounge trumpet for Persimmon; tension for the pen; the hero theme again, flat and slow, for 'per diem'
  orient   a jaunty, busy office groove (F major): a rising run for every card dealt, a tower of notes for twenty-eight, deadpan tuba for 'That's forty.'; warmer and slower
           for the lesson (the veteran and the rookie); a clean tag
  floor    two radios on one beat: a frantic D-minor sixteenth-note ostinato (left ear: Clementine) interlocking with a lazy major-seventh harp and vibraphone (right ear:
           Strawberry); the time-lapses wind both up; guilt builds under the pleas; silence at the snap; the two fuse into one sprint
  vault    a corporate heist (D minor): a slinky bass, finger snaps, a vibraphone and low strings that tighten with every argument; the vault's golden choir; and an oboe and a
           tuba, sad, for the purse and the moth
  exit     a countdown: a pulse on every tick of the clock, a panic for 'Go! Go! GO!', a riser, a bright hit on the ding of 11:00:00
  lot      night guitar and the Moon's bells; the score stops dead at 'Quiet.'; then every instrument in the building, six decibels under the effects; then a cool bass line
           for the walk to the car
  end      build_music7's reprise
Instruments come from build_music6 / 7 / 8 / 9 / 10; nothing is sampled.
"""
import numpy as np

from build_audio import SR, tarr, osc, expdecay, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pluck, pizz, marimba, epiano, bell, vibes, sub_bass, saw_bass, pad, strings, brass, kick, snare, clap, hat, shaker, tom, timp, roll,
                          riser, impact, crash, tick, heart, MUSIC_GAIN, _n)
from build_music7 import woodblock, slide_brass, choir, music_box, moon_motif, taiko, hits, siren, theremin, cue_end7
from build_music8 import beat_times, tock
from build_music9 import grid, ss, spic, snap, uke, rising
import build_music10 as M10
from build_music10 import (nylon, piano, violin, clarinet, oboe, tuba, mtrumpet, kazoo, brush, ride, slide_whistle, groove_times, wt, CHORDS10, MEL16, comp_uke, comp_stern, comp_game,
                           comp_laid, groove, cue_dips)

R11 = np.random.default_rng(2611)


# ================================================================ title: the time clock
def cue_title11(T, t0, d, beats):
    """The punch clock. A mechanical pulse that winds up (ticks that speed up, a woodblock on every other one, a pizzicato A and E underneath), a hair of silence, the CLUNK
    (the sfx), a brass stab and a timpani on the stamp, then the series sting (a short riser, a timpani roll, the choir and the bells on the downbeat) and a bouncy nine-to-five tag
    under the finished logo."""
    lg = beats["logo"][0]
    punch, stamp, land = lg + 1.5, lg + 1.62, t0 + .2 + 2.2
    for i, at in enumerate(beat_times(lg + .1, punch - .06, 96, 186, 1.0, 1.7)):
        tock(T, i, at, 1.5)
        if i % 2 == 0:
            T.put(woodblock(), at, .07, .3 if (i // 2) % 2 else -.3)
            T.put(pizz(midi(45 if (i // 2) % 2 == 0 else 52), .22), at, .17, 0)
    T.put(riser(punch - lg - .1, 260, 2600, .6), lg + .05, .1)                           # a faint rise under the winding clock
    T.put(roll(70, punch - lg - .5, 18), lg + .2, .2, -.1)                               # and a low timpani roll: all low end, so the ticks stay clear
    T.put(strings([33, 40, 45], land - lg - .3, 1.4, .15, 4.8, 500), lg + .1, .13)       # and a low string swell for the weight the sting has in the other episodes
    T.gate(punch - .05, punch + .02, 0, .004)
    T.put(brass([57, 60, 64], .25, .01, .1, 1800), stamp + .04, .07, 0)                  # IN 2:58 PM
    T.put(timp(55, .8), stamp + .04, .12)
    T.put(riser(land - (lg + 1.75), 240, 6200, .85), lg + 1.75, .28)
    T.put(roll(70, land - (lg + 1.8), 10), lg + 1.8, .24, -.1)
    T.put(impact(1.8), land, .4)
    T.put(crash(2.2), land, .22, .1)
    T.put(choir([45, 52, 57, 60, 64], 2.6, "o", .08, 1.5), land, .18)
    for i, m in enumerate((81, 84, 88, 93)):
        T.put(bell(midi(m), 1.6) * .6, land + .1 + i * .13, .1, -.4 + i * .27)
    mel = [69, 72, 76, 72, 69, 72, 76, 79]                                                # nine to five: a bouncy A-minor figure under the held logo
    for k, at in enumerate(grid(land + .35, land + 2.0, 120, .5)):
        T.put(pizz(midi(mel[k % 8]), .2), at, .13 if k % 2 == 0 else .09, -.25 if k % 2 else .25)
        T.put(marimba(midi(mel[k % 8] + 12), .18), at + .003, .04, .3)
        if k % 2 == 0:
            T.put(pizz(midi(45 if (k // 2) % 2 == 0 else 52), .3), at, .18, 0)
    T.fade(t0 + d - .8, t0 + d, 1, 0)


# ================================================================ arrival: a hero's welcome
HERO = [(72, 1), (76, 1), (79, 2), (81, 1), (79, 1), (76, 2), (77, 1), (81, 1), (84, 2), (83, 1), (79, 1), (84, 2)]   # C major: ta-ta-TAAA, la-so-miii, fa-la-dooo, ti-so-DOOO


def hero(T, at, nbeats, bpm=104, g=1.0, sour=0.0, slow=1.0, voice="brass"):
    """The hero's theme, the first `nbeats` beats of it. `sour` flattens the third, sixth and seventh and lets every note droop (and `slow` stretches the time): the same
    tune played by someone who has just been told she is in the other budget."""
    b = 60 / bpm * slow
    t, used = at, 0
    for k, (m, nb) in enumerate(HERO):
        if used >= nbeats:
            break
        mm = m - sour * (1 if m % 12 in (4, 9, 11) else 0) - sour * .12 * k
        dd = nb * b
        if voice == "brass":
            T.put(brass([mm, mm - 12], dd * .92, .02, .1, 2300), t, .12 * g, 0)
        else:
            T.put(mtrumpet(mm, dd * .9, vel=.8), t, .09 * g, .1)
            T.put(tuba(mm - 36 + 12, dd * .9), t, .12 * g, 0)
        t += dd
        used += nb


def march(T, a, b_, bpm=104, g=1.0, root=36):
    """An oom-pah-and-snare march: the tuba on 1 and 3 (root, fifth), the snare and a short brass chord on 2 and 4."""
    for k, at in enumerate(grid(a, b_, bpm, 1.0)):
        if k % 2 == 0:
            T.put(tuba(root + (7 if (k // 2) % 2 else 0), .4), at, .2 * g, 0)
        else:
            T.put(snare() * .8, at, .1 * g, .1)
            T.put(brass([60, 64, 67], .18, .006, .06, 1900), at, .08 * g, .1)


def cue_arrival11(T, t0, d, beats):
    """2:58 PM. The mirror of Episode 9's welcome. Tiptoe pizzicato while Clementine works out whose party it is, a dun for 'her badge', a build through the door beat (the drumroll
    is already an effect), and then the hero's welcome in brass and timpani, all the stops out, for a woman who is about to learn she is per diem. It goes sour on cue."""
    op, c1, m1, c2, m2, door, a1, a2, s1, p1, a3, s2, a4, s3, s4, a5, s5, st = (beats[k] for k in ("open", "c1", "m1", "c2", "m2", "door", "a1", "a2", "s1", "p1", "a3", "s2", "a4",
                                                                                                      "s3", "s4", "a5", "s5", "sting"))
    walk = [48, 52, 55, 52, 50, 53, 57, 53]
    for k, at in enumerate(grid(op[0] + .3, m2[1] - .1, 108, .5)):                          # tiptoe, a hair out of step
        T.put(pizz(midi(walk[k % 8] + (12 if k % 2 else 0)), .2), at, .15 if k % 2 == 0 else .1, -.2 + .1 * (k % 4))
        if k % 4 == 2:
            T.put(woodblock(), at, .05, .3)
    for k, m in enumerate((88, 91, 95)):                                                   # 'Is it somebody's birthday?'
        T.put(bell(midi(m), .8) * .6, wt("c1", "birthday") + .1 + k * .12, .06, -.3 + .3 * k)
    bd = wt("m2", "badge")
    T.gate(bd - .02, bd + .0, 0, .01)
    T.put(pizz(midi(36), .5), bd + .02, .3, 0)                                              # 'You're wearing her badge.': dun
    T.put(brass([48, 55], .4, .01, .2, 1300), bd + .02, .16, 0)
    for k, m in enumerate((60, 64, 67, 72, 76, 79, 84)):                                    # the build: a run up the chord in the last third of a second, so the doors and the drumroll lead
        T.put(marimba(midi(m + 12), .14), door[0] + 1.3 - .45 + k * .065, .04 + .005 * k, -.4 + .12 * k)
    T.put(strings([48, 55, 60, 64], door[0] + 1.3 - m2[1] + .2, 1.2, .05, 5.2, 2200), m2[1] - .1, .06)
    T.put(riser(door[0] + 1.3 - (door[0] + .6), 300, 5200, .5), door[0] + .6, .07)
    ph = door[0] + 1.3                                                                      # the party horn: here is the hero's welcome
    T.put(brass([48, 55, 60, 64, 67], 1.3, .01, .5, 2400), ph + .02, .12, 0)
    T.put(strings([48, 55, 60, 64, 67, 72], 1.6, .08, .8, 5.0, 2800), ph + .02, .07)
    T.put(tuba(36, .8), ph + .02, .13, 0)
    T.put(timp(65, 1.2), ph + .02, .15)
    hero(T, ph + .1, 4, g=.8)                                                               # ta-ta-TAAA
    march(T, ph + 1.4, s1[0] - .25, g=.8)
    for w, ch in (("basket", [48, 55, 60, 64]), ("pass", [53, 57, 60, 65]), ("lunch", [55, 59, 62, 67])):    # 'Gift basket. Parking pass. Lunch.'
        T.put(brass(ch, .18, .008, .07, 2200), wt("a2", w), .14, 0)
        T.put(timp(65 if w != "lunch" else 98, .4), wt("a2", w), .16)
    T.gate(s1[0] - .22, p1[0] - .05, 0, .03)                                                # 'Cool.' lands in silence
    T.put(pizz(midi(43), .5), s1[1] + .1, .26, 0)
    lounge = [48, 50, 52, 53, 55, 53, 52, 50]                                               # 'Welcome to the club.': a lounge, in a smoky bar
    for k, at in enumerate(grid(p1[0] - .05, a3[0] - .1, 92, 1.0)):
        T.put(pizz(midi(lounge[k % 8]), .4), at, .2, -.1)
        T.put(brush(.2), at + .3, .09, .2)
    T.put(mtrumpet(67, .3, wah=4.0), p1[1] + .05, .12, .2)
    T.put(mtrumpet(64, .5, wah=3.0), p1[1] + .26, .11, .2)
    T.put(pizz(midi(43), .6), a3[0] + .05, .3, 0)                                           # 'And a pen.'
    for k, at in enumerate(grid(a3[0] + .4, s3[1] + .05, 76, 1.0)):                         # the pen: a tense little clock
        tock(T, k, at, 1.3)
        T.put(sub_bass(midi(36 if k % 2 == 0 else 43), .5), at, .12, 0)
    T.put(tuba(43, .5), s3[1] + .08, .22, 0)                                                # 'To share.'
    for k, m in enumerate((72, 76, 79)):                                                    # 'Is there a raise?': the hero theme's first three notes, hopeful
        T.put(bell(midi(m + 12), .8) * .6, s4[0] + .05 + k * .2, .07, -.2 + .2 * k)
    ot = wt("a5", "per")
    T.gate(a5[0] - .02, a5[0] + .02, 0, .01)
    hero(T, ot - .04, 8, bpm=104, g=1.1, sour=.8, slow=1.35, voice="sour")                  # 'You're per diem.': the hero theme, flat and slow
    T.put(slide_brass(55, 48, 1.1, 800), wt("a5", "other"), .15, 0)
    T.put(pad([48, 51, 55], s5[1] - s5[0] + .8, .6, .5, 700), s5[0] - .1, .07)             # 'I know. I'm in it.'
    T.fade(t0 + d - .6, t0 + d, 1, 0)


# ================================================================ orient: busy, jaunty
def cue_orient11(T, t0, d, beats):
    """3:06 PM. An office that cannot stop being busy (F major, 132 bpm): a bouncing pizzicato bass, a marimba figure, hand claps; a rising run for every card dealt, a tower of
    notes for twenty-eight, a deadpan tuba for 'That's forty.'. For the lesson it relaxes (B flat, a vibraphone and a walking bass); 'You don't have one.' gets a flat note."""
    op, l1, s1, dl, l2, c1, s2, l3, tc, s3, c2, s4, c3, l4, c4, tg = (beats[k] for k in ("open", "l1", "s1", "deal", "l2", "c1", "s2", "l3", "teach", "s3", "c2", "s4", "c3", "l4", "c4",
                                                                                          "tag"))
    pz = lambda m, d_: pizz(midi(m), d_)
    groove(T, l1[0] + .1, tc[0] - .02, ("F", "Dm", "Bb", "C"), pz, comp_uke, MEL16, bpm=132, lvl=1.0, mel_gain=.08)   # after the last sad trombone note (E) has faded
    T.put(bell(midi(96), .8) * .6, wt("l1", "twelve") + .05, .07, .3)                       # 'twelve'
    T.put(pizz(midi(36), .4), wt("s1", "contract") + .1, .2, 0)
    for k in range(12):                                                                     # the cards go down, twelve of them
        T.put(marimba(midi(65 + [0, 2, 4, 5, 7, 9, 12, 14, 16, 17, 19, 21][k]), .14), dl[0] + .2 + k * .072, .04 + .003 * k, -.5 + .09 * k)
    tw = wt("l2", "twenty")
    for k in range(8):                                                                      # twenty-eight: a tower that keeps growing
        T.put(marimba(midi(60 + 3 * k), .2), tw + k * .065, .06 + .006 * k, -.4 + .1 * k)
        T.put(pizz(midi(36 + 2 * k), .2), tw + k * .065, .09, 0)
    T.put(riser(.7, 300, 3500, .4), wt("l2", "twenty") + .1, .15)
    T.put(marimba(midi(84), .25), c1[1] + .02, .1, .3)                                      # 'Sure!' (in the gap after it)
    T.put(marimba(midi(91), .3), c1[1] + .12, .1, .3)
    T.gate(s2[0] - .02, s2[1] + .1, .3, .03)
    T.put(tuba(38, .5), s2[1] + .05, .22, 0)                                                # 'That's forty.'
    T.put(brass([53, 57, 60], .3, .01, .12, 1800), wt("l3", "math"), .12, 0)               # 'It's contract math.'
    T.put(timp(87, .6), wt("l3", "math"), .2)
    # --- the lesson: B flat, warm and slower
    T.gate(tc[0] - .02, tc[0] + .02, 0, .01)
    lesson = ("Bb", "F", "Gm", "Eb")
    times, bl = groove_times(tc[0], c4[1] + .15, 4, 100)
    for i, at in enumerate(times):
        bar, j = divmod(i, 4)
        ch = CHORDS10[lesson[bar % 4]] if lesson[bar % 4] in CHORDS10 else CHORDS10["Bb"]
        r = ch[0] if ch[0] < 48 else ch[0] - 12
        T.put(pizz(midi(r), bl * .8), at, .18, 0)
        if j == 0:
            T.put(vibes(midi(ch[1] + 12), 1.6), at, .08, -.2)
            T.put(vibes(midi(ch[2] + 12), 1.6), at + .01, .06, .25)
        T.put(shaker(), at, .035, .3)
        T.put(shaker(), at + bl / 2, .03, -.3)
    T.put(marimba(midi(77), .3), c2[1] + .02, .1, .2)                                       # 'I don't have a contract.'
    for k, m in enumerate((74, 77, 81)):                                                    # 'Let me check my contract.': brave
        T.put(bell(midi(m + 12), .7) * .6, c3[0] + .05 + k * .3, .06, -.2 + .2 * k)
    T.put(tuba(34, .6), l4[1] + .05, .24, 0)                                                # 'You don't have one.'
    T.put(marimba(midi(84), .25), c4[1] + .02, .1, .3)
    T.put(marimba(midi(91), .3), c4[1] + .12, .1, .3)
    T.gate(tg[0] - .02, t0 + d, 0, .01)                                                     # the tag belongs to the sting; one small bell after it
    T.put(bell(midi(89), 1.2) * .6, tg[0] + .6, .06, .3)
    T.fade(t0 + d - .6, t0 + d, 1, 0)


# ================================================================ floor: two radios, one beat
def cue_floor11(T, t0, d, beats):
    """5:32 PM. A split screen as two interlocking ostinatos. Left ear (Clementine): a frantic sixteenth-note figure in D minor, accents in threes (3+3+2). Right ear (Strawberry): a
    lazy harp and a vibraphone in major sevenths that drop into the gaps between the accents. The time-lapses wind both up; guilt thickens the strings under every plea; silence
    for the snap; then the two radios become one, in unison, and sprint."""
    op, lp1, lp2, c4, sn, s6, run = (beats[k] for k in ("open", "lapse1", "lapse2", "c4", "snap", "s6", "run"))
    prog = [[50, 53, 57, 62], [50, 53, 57, 62], [55, 58, 62, 67], [57, 61, 64, 69]]         # Dm Dm Gm A
    spa = [[53, 57, 60, 64], [53, 57, 60, 64], [58, 62, 65, 69], [52, 55, 59, 62]]          # Fmaj7 Fmaj7 Bbmaj7 Em7 (over those bars: Dm7, Dm7, Gm7, A7sus)
    pat = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 3, 1, 2, 0, 1]
    a0, stop = op[0] + .9, sn[0] - .05

    def lvl_fr(at):
        return 1.0 - .55 * ss((at - c4[0]) / (sn[0] - c4[0]))                                # the sprint tires as the guilt rises

    def lvl_spa(at):
        return .3 + .7 * ss((at - lp1[1]) / (sn[0] - lp1[1]))

    def pulse16(at, k, bar, g, pan_fr=-.7):
        ch = prog[bar % 4]
        T.put(spic(ch[pat[k % 16]] + (12 if k % 8 in (3, 6) else 0)), at, (.08 if k % 8 in (0, 3, 6) else .05) * g, pan_fr)
        if k % 8 in (0, 3, 6):
            T.put(hat(), at, .04 * g, -.5)
        if k % 4 == 0:
            T.put(pizz(midi(ch[0] - 12), .2), at, .16 * g, -.3)

    def spa16(at, k, bar, g):
        ch = spa[bar % 4]
        if k % 8 in (2, 5):                                                                  # into the gaps between the accents
            T.put(nylon(ch[(k // 2) % 4] + 12, 1.0), at, .17 * g, .6)
        if k % 16 == 0:
            T.put(vibes(midi(ch[1] + 12), 2.0), at, .08 * g, .5)
            T.put(vibes(midi(ch[3] + 12), 2.0), at + .01, .06 * g, .7)
            T.put(sub_bass(midi(prog[bar % 4][0] - 12), 1.4), at, .12 * g, .3)

    # --- the two radios up to the snap: the lapses wind the grid up
    t, k = a0, 0
    sp16 = 60 / 168 / 4
    while t < stop:
        bpm = 168
        for lo, hi, b0, b1 in ((lp1[0], lp1[1], 168, 300), (lp2[0], lp2[1], 180, 340)):
            if lo - .15 <= t < hi:
                bpm = b0 + (b1 - b0) * ss((t - lo + .15) / (hi - lo + .15))
        bar = (k // 16) % 4
        pulse16(t, k, bar, lvl_fr(t))
        spa16(t, k, bar, lvl_spa(t))
        t += 60 / bpm / 4
        k += 1
    for lp_ in (lp1, lp2):                                                                  # a time-lapse: a riser, a bell glide, and the pause on the cash register
        T.put(riser(lp_[1] - lp_[0] + .1, 300, 5200, .5), lp_[0] - .05, .1)
        for j, m in enumerate((84, 88, 91, 96, 100)):
            T.put(bell(midi(m), .6) * .6, lp_[0] + .1 + j * (lp_[1] - lp_[0]) / 5.5, .03, -.4 + .2 * j)
    T.put(roll(60, lp2[1] - lp2[0], 18), lp2[0], .1, -.1)
    # --- guilt: a string note that keeps climbing, a clock that tightens
    T.put(rising(50, 62, sn[0] - c4[0] - .1), c4[0], .1, .3)
    for i, at in enumerate(beat_times(c4[0], sn[0] - .05, 70, 150)):
        tock(T, i, at, 1.3)
    # --- the snap: everything stops; a held chord blooms in slow motion
    T.gate(stop, sn[1] + .02, 0, .02)
    T.put(bell(midi(100), 1.6) * .6, sn[0] + .15, .08, .4)
    T.put(strings([45, 52, 57, 60, 64, 71], sn[1] - sn[0] + .2, .5, .05, 5.0, 2400), sn[0] + .05, .12)
    T.put(riser(sn[1] - sn[0], 400, 4800, .5), sn[0] + .02, .2)
    T.put(crash(1.4), sn[1] + .02, .08, 0)
    T.put(brass([45, 52, 57, 60, 64], .8, .01, .3, 2400), s6[0] + .02, .22, 0)
    T.put(timp(55, 1.2), s6[0] + .02, .34)
    T.put(taiko(62, .6), s6[0] + .02, .3)
    # --- the two radios fuse: one ostinato, in unison, with everything in it
    ru0 = s6[0] + .45
    for k, at in enumerate(grid(ru0, t0 + d - .5, 176, .25)):
        ch = prog[(k // 16) % 4]
        n = ch[pat[k % 16]] + (12 if k % 8 in (3, 6) else 0)
        T.put(spic(n), at, .075, -.2)
        T.put(marimba(midi(n + 12), .12), at, .05, .3)
        if k % 8 in (0, 3, 6):
            T.put(brass([n - 12], .1, .006, .04, 1900), at, .1, 0)
        if k % 4 == 0:
            T.put(kick(), at, .26, 0)
        if k % 8 == 4:
            T.put(snare(), at, .2, .1)
        if k % 2:
            T.put(hat(), at, .06, .4)
    T.put(roll(60, 1.2, 20), run[0] - .2, .15, -.1)
    T.put(crash(2.0), run[0] + .05, .08, 0)
    T.fade(t0 + d - 1.0, t0 + d, 1, .0)


# ================================================================ vault: a heist for eighteen hundred dollars
def cue_vault11(T, t0, d, beats):
    """10:55 PM. Corporate heist, D minor: a slinky bass, finger snaps and a vibraphone, low strings that tighten with each argument, the stabs of 'eighteen hundred'; the vault
    opens to a golden choir (a major chord that swells like sunrise, with a harp and a glockenspiel over it); 'Oh. We do have that one.' is warm; the purse gets an oboe and the moth
    a tuba, both sad."""
    op, a1, s1, a2, s2, a3, s3, va, a4, s4, a5, mo = (beats[k] for k in ("open", "a1", "s1", "a2", "s2", "a3", "s3", "vault", "a4", "s4", "a5", "moth"))
    line = [38, None, 38, 41, None, 43, 44, 43, 38, None, 38, 41, None, 46, 45, 43]
    h0, h1 = op[0] + .5, va[0] - .1
    T.put(strings([38, 45, 50], h1 - h0 + .3, 1.2, .1, 4.8, 800), h0, .07)
    for k, at in enumerate(grid(h0, h1, 100, .5)):
        lvl = ss((at - h0) / (h1 - h0))
        if line[k % 16]:
            T.put(pizz(midi(line[k % 16]), .22), at, .15 + .1 * lvl, -.1)
        if k % 8 == 4:
            T.put(snap(), at, .09 + .06 * lvl, .3)
        if k % 16 == 0:
            for j, m in enumerate((62, 65, 69, 72)):                                        # Dm9 on the vibraphone
                T.put(vibes(midi(m + 12), 1.6), at + j * .014, .06, -.3 + .2 * j)
        if k % 8 in (3, 7) and lvl > .35:
            T.put(marimba(midi(74 + 2 * (k % 16 > 7)), .25), at, .04 + .05 * lvl, .35)
    for w in ("eighteen", ):                                                                # '...eighteen hundred dollars.'
        T.put(brass([50, 57, 62, 65], .3, .01, .12, 1800), wt("a1", w), .13, 0)
        T.put(timp(73, .8), wt("a1", w), .22)
    T.put(tuba(38, .4), s1[1] + .05, .2, 0)                                                 # 'Helping.'
    T.put(timp(55, .8), wt("a2", "contract") - .02, .2)                                    # 'Helping is not in your contract.'
    T.put(bell(midi(96), .9) * .6, wt("s2", "two") + .05, .06, .3)                          # 'Two hundred an hour.'
    T.put(slide_brass(55, 50, .7, 800), wt("a3", "budget") + .1, .1, 0)                     # 'We don't have the budget for that.'
    T.put(riser(s3[1] - s3[0] + .5, 300, 3600, .5), s3[0] - .1, .16)
    T.gate(s3[1] + .1, va[0] + .15, 0, .04)                                                 # the wheel, the bolts
    # the vault: a golden choir that swells like a sunrise as the door groans open (13.16) and peaks on the cash register (13.81)
    ro = va[0] + .35
    T.put(choir([62, 66, 69, 74, 78], 2.3, "a", .85, 1.2), ro, .17)
    T.put(choir([50, 57, 62], 2.2, "o", .6, 1.2), ro, .09)
    T.put(strings([50, 57, 62, 66, 69, 74], 2.2, .8, 1.0, 5.2, 2800), ro, .09)
    for k, m in enumerate((62, 66, 69, 74, 78, 81, 86, 90, 93)):                              # a harp glissando up the chord as the gold pours out
        T.put(nylon(m, 1.2, bright=1.0), ro + .3 + k * .06, .1, -.5 + .12 * k)
    for k, m in enumerate((81, 86, 90, 93)):
        T.put(bell(midi(m), 1.0) * .6, va[0] + 1.15 + k * .11, .045, -.3 + .2 * k)
    T.put(timp(73, 1.4), ro + .4, .2)
    T.put(crash(1.8), ro + .45, .06, .1)
    T.gate(va[1] - .05, va[1] + .05, .55, .08)
    T.put(strings([50, 57, 62, 66], a4[1] - a4[0] + .2, .1, .6, 5.2, 2200), a4[0], .09)    # 'Oh. We do have that one.': warm
    T.put(piano(62, 1.4, .6), a4[1] + .1, .08, -.2)                                         # 'And the staff budget?' hmm
    T.put(strings([38, 45, 50, 56], s4[1] - s4[0] + .5, .3, .4, 6.0, 1000), s4[0] - .05, .1)  # tension: low strings with a tritone
    T.put(timp(55, .9), s4[1] + .05, .22)
    T.put(pizz(midi(38), .6), a5[1] + .08, .26, 0)                                          # 'That's this.'
    T.put(oboe(81, .45, a=.05), mo[0] + .02, .13, -.1)                                      # the purse: a sad oboe, three notes falling
    T.put(oboe(79, .35, a=.04), mo[0] + .46, .12, -.1)
    T.put(oboe(74, .9, a=.05), mo[0] + .83, .12, -.1)
    T.gate(mo[0] + .48, mo[0] + .54, .5, .01)
    T.put(tuba(38, 1.2, a=.12, r=.5), mo[1] - .2, .2, 0)                                    # the moth: a tuba, tired
    T.put(strings([38, 45, 50], d - (mo[1] - t0) + .4, .5, .6, 4.6, 700), mo[1] - .3, .06)
    T.fade(t0 + d - .8, t0 + d, 1, 0)


# ================================================================ exit: a countdown
def cue_exit11(T, t0, d, beats):
    """10:59 PM. A countdown. A pulse that quickens through the overtime arithmetic, a panic of strings for 'Go! Go! GO!', a low pulse on each tick of the clock, a riser through
    the slow-motion walk and, on the ding of 11:00:00, a bright hit; then the door."""
    op, l1, s1, a1, cd, out = (beats[k] for k in ("open", "l1", "s1", "a1", "cd", "out"))
    c0 = l1[0] - .1
    for i, at in enumerate(beat_times(c0, a1[0] - .08, 70, 128, 1.0, 1.3)):                 # the overtime arithmetic: a pulse that tightens
        T.put(pizz(midi(43 if i % 2 == 0 else 38), .3), at, .26 + .004 * i, 0)
        if i % 2:
            T.put(woodblock(), at, .07, .3)
    T.put(strings([36, 43, 48], a1[0] - l1[0] + .3, 1.0, .1, 4.8, 800), l1[0], .1)
    pn = wt("s1", "seventy")
    T.put(brass([48, 55, 60], .25, .01, .1, 1700), pn, .12, 0)
    T.put(timp(65, .7), pn, .22)
    T.gate(a1[0] - .08, a1[0] - .0, 0, .01)
    spic_run = [48, 51, 55, 51, 48, 51, 55, 58]
    for k, at in enumerate(grid(a1[0], a1[1] + .05, 168, .25)):                              # 'Go! Go! GO!': the sprint
        T.put(spic(spic_run[k % 8] + 12), at, .09, -.2 + .1 * (k % 4))
        if k % 4 == 0:
            T.put(kick(), at, .25, 0)
    T.gate(a1[1] + .05, cd[0] - .02, 0, .02)
    for i, at in enumerate((cd[0], cd[0] + .5, cd[0] + 1.0, cd[0] + 1.5)):                    # one pulse per tick
        T.put(timp(65, .6), at, .12 + .03 * i)
        T.put(heart(), at + .02, .18 + .04 * i, 0)
    T.put(riser(cd[0] + 1.9 - cd[0], 250, 5200, .6), cd[0], .16)
    T.put(strings([48, 55, 60, 63], 1.95, 1.7, .05, 5.0, 1800), cd[0], .06)
    ding = cd[0] + 1.9
    T.gate(ding - .03, ding, 0, .006)
    T.put(brass([60, 64, 67, 72], .9, .01, .4, 2500), ding, .12, 0)                         # 11:00:00
    T.put(timp(65, 1.2), ding, .18)
    T.put(crash(1.8), ding, .06, .1)
    T.put(strings([48, 55, 60, 64, 67], 1.6, .05, 1.0, 5.2, 2600), ding, .07)
    T.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ lot: the building answers
def cue_lot11(T, t0, d, beats):
    """11:00 PM. Calm: a nylon guitar and the Moon's bells. 'Quiet.' stops the score dead. Then every instrument in the building at once (taiko at 168, brass hits, marimba runs, a
    siren, a banana slipping on a xylophone), six decibels under the effects so they are heard; it stops dead again on 'She said the word!'; and a cool bass line walks her to the
    car."""
    op, mo1, s1, ch, l1, s2, mo2 = (beats[k] for k in ("open", "mo1", "s1", "chaos", "l1", "s2", "mo2"))
    voices = {"Am": [45, 52, 57, 60, 64], "F": [41, 48, 53, 57, 60], "C": [48, 55, 60, 64, 67], "G": [43, 50, 55, 59, 62]}
    pat = [0, 2, 3, 4, 3, 2, 4, 3]
    for k, at in enumerate(grid(op[0] + .3, s1[1] - .08, 66, .5)):
        v = voices[["Am", "F", "C", "G"][(k // 8) % 4]]
        T.put(nylon(v[pat[k % 8]], 1.0), at, .15 if k % 4 == 0 else .11, -.2 + .08 * (k % 5))
    T.put(pad([45, 52, 57, 60], s1[1] - op[0], 1.0, .3, 900), op[0] + .1, .06)
    T.gate(mo1[0] - .05, mo1[1] + .05, .6, .08)
    moon_motif(T, mo1[0] - .3, .09, .35)
    T.gate(s1[1] - .02, ch[0] + .02, 0, .03)                                                 # 'Quiet.' - and the crickets
    # --- the chaos: its own sub-mix so it can sit six decibels under the effects as a whole
    C = Track(T.N)
    c0, c1 = ch[0], ch[1]
    cb = 60 / 168
    C.put(riser(.5, 300, 5200, .6), c0 - .05, .3)
    for k in range(int((c1 - c0) / (cb / 2))):
        at = c0 + .1 + k * cb / 2
        lvl = min(1.0, .5 + .5 * (at - c0) / (c1 - c0))
        bt = k % 8
        if k % 2 == 0:
            C.put(kick(), at, .4 * lvl, 0)
        if bt in (2, 6):
            C.put(snare(), at, .34 * lvl, .1)
        C.put(hat(), at, .12 * lvl, .4 if k % 2 else -.4)
        if bt in (0, 3, 5):
            C.put(taiko(62 if bt == 0 else 74, .5), at, .3 * lvl)
        if k % 16 == 0 and k:
            hits(C, at, .22 * lvl)
        if at - c0 > .7:
            C.put(marimba(midi([81, 84, 88, 84, 83, 86, 91, 86][k % 8]), .16), at, .11 * lvl, .5 if k % 2 else -.5)
        if at - c0 > 1.4 and k % 2 == 1:
            C.put(brass([57, 60] if (k // 8) % 2 == 0 else [55, 59], .14, .006, .05, 2000), at, .13 * lvl, 0)
    C.put(siren(76, 88, 1.6, .9), c0 + 1.1, .09, -.5)
    C.put(siren(71, 83, 1.5, .9), c0 + 1.9, .09, .5)
    for k, m in enumerate((79, 83, 86, 91, 86, 83, 79, 76)):                                  # the banana: a xylophone line that slips
        C.put(marimba(midi(m), .16), c0 + 1.3 + k * .06, .11, -.4 + .1 * k)
    C.put(slide_whistle(96, 60, .5), c0 + 1.82, .1, 0)
    C.put(theremin(69, 76, 1.6), c0 + .9, .08, .3)                                           # a howl, as the orchestra hears it
    C.put(roll(70, 1.0, 20), c1 - 1.0, .3, -.1)
    C.put(impact(1.4), c1 - .1, .4)
    C.put(crash(2.0), c1 - .1, .26)
    C.buf *= .5                                                                              # six decibels under the effects
    T.buf += C.buf
    T.gate(l1[0] - .12, l1[0] + .02, 0, .02)                                                 # 'She said the word!': the orchestra stops dead
    T.gate(l1[0] + .02, s2[1] + .2, 0, .02)
    T.put(pizz(midi(43), .6), s2[1] + .12, .3, 0)                                            # 'Not my shift.'
    walk = [43, None, 43, 46, None, 48, 49, 48]
    for k, at in enumerate(grid(s2[1] + .2, t0 + d - .3, 96, .5)):                          # the walk to the car: a cool bass line and a finger snap
        if walk[k % 8]:
            T.put(pizz(midi(walk[k % 8]), .25), at, .22, -.1)
        if k % 4 == 2:
            T.put(snap(), at, .12, .3)
    moon_motif(T, mo2[1] - .1, .08, .3, .22)                                                 # 'Nice.'
    T.fade(t0 + d - .8, t0 + d, 1, 0)


DIPS11 = {"punchclock": (8, .3, .25), "stamp7": (6, .3, .25), "pop": (4, .12, .15), "slidedoor": (6, .6, .3), "drumroll": (3, 1.2, .3), "partyhorn": (6, .5, .3), "cheer9": (5, .6, .4),
          "confetti": (3, .5, .3), "sparkle": (3, .4, .3), "trombone": (3, .8, .5), "flips": (4, .35, .2), "carddeal": (4, .8, .2), "sting": (8, .9, .5), "timelapse11": (3, 1.0, .4),
          "chaching9": (5, .4, .3), "whoosh2": (5, .35, .25), "scramble": (4, .8, .3), "boing": (4, .3, .2), "slowmo": (3, .5, .3), "vaultopen": (3, 1.0, .5), "goldrush": (3, 1.2, .6),
          "rumble": (2, 1.0, .5), "typing": (2, .8, .3), "moth": (3, 1.0, .3), "flicker": (3, .5, .2), "purse": (3, .15, .15), "clockdigit": (6, .1, .12), "clockding": (8, .45, .4),
          "slowmolong": (2, 1.8, .4), "tick": (2, .3, .2)}   # not the chaos beat (a_call, klaxon, stampede ...): its score is already six dB down

CUES = {"title": cue_title11, "arrival": cue_arrival11, "orient": cue_orient11, "floor": cue_floor11, "vault": cue_vault11, "exit": cue_exit11, "lot": cue_lot11, "end": cue_end7}
LEVEL11 = {"arrival": 1.6, "orient": 1.75, "floor": .92, "vault": 1.5, "exit": .83, "lot": 1.25}   # per-scene trim, set from the measured stems (see the report)


def score(script, scenes, lines, N):
    """scenes: [{id, start, dur, beats{id: {s, e}}}] with beat times relative to the scene start; returns a (2, N) stereo bed."""
    T = Track(N)
    M10._CTX["lines"] = {(ln["scene"], ln["id"]): ln for ln in lines}
    for sc in scenes:
        fn = CUES.get(sc["id"])
        if not fn:
            continue
        M10._CTX["scene"] = sc["id"]
        t0 = sc["start"]
        beats = {k: (t0 + v["s"], t0 + v["e"]) for k, v in sc["beats"].items()}
        mine = sc["id"] in LEVEL11
        U = Track(N) if mine else T
        fn(U, t0, sc["dur"], beats)
        if mine:
            T.buf += U.buf * LEVEL11[sc["id"]]
        T.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.0, 0.0, .15)   # a cue's tail never bleeds into the next scene
    return hall(T.buf, wet=.55, rt=1.6) * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS11)[None, :]
