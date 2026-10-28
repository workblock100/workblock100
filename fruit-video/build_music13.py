"""Episode 13 score: the Float Pool, a heist film that turns tender and then funny.

build_audio6.main calls score(script, scenes, lines, N) through --music build_music13; the mixer ducks the bed under every voice. All cue times are read from the script's beats
(scene-local, shifted to the scene start) and from the spoken lines, so the score lands on the same offsets as the sound effects. Every scene is rendered on its own track and
given its own room (a dry club for the funk, a big hall for the eerie vault), then they are summed; a few spans are muted after the reverb so that silence is dead silence.
  title    the series sting (build_music7: riser, timpani roll, choir, bells) with a vault-dial pulse under it: a muted click-clack that locks to the dial's own click times and slows
           with it, a low sub swell, a second hit on the clunk and a sneaky bass-and-snaps tag
  open     dry late-night noir funk (A minor, 75 to 78 bpm): an upright bass walk, brushes, vibraphone chords, a harmon-muted trumpet; one pedal tone under the schedule insert;
           the record scratch ends it dead
  plan     a cool heist groove at 96.75 bpm (walking bass, finger snaps, vibraphone, a mallet motif) that adds a layer for each obstacle; a held, tense drone and a heartbeat tick under
           the Q-word beat; a brass stab on 'mandatory in-service'; the hologram collapse sucks the music out
  crew     a punchy funk groove (104 bpm, clavinet stabs, bass, tight drums) that restarts with a hit on every card slam, a reverse cymbal into every freeze, a spacey chord for the Moon
  hall     tension (a sub drone, a slow pulse, strings on harmonics); in slow motion everything pitches down and stretches, a long reversed swell, and it snaps back into time with a riser
           into the sting
  cross    an upbeat caper (swing, walking bass, brushes, brass stabs, a jazz organ): tighter and busier, a stab on every cut, a slide whistle for the slip
  vault    eerie (wind, a drone, a lonely music box), a dissonant stab on Brenda; then 'I've got it. Go.' and a tender string line (violin, cello, harp) through her exit and the chair,
           a soft piano for the bite; silence from the Moon's line until the freeze; the red crash; thin, quick and comic for the crew running out; one warm note under 'Pending.'
  end      build_music7's reprise
Instruments come from build_music6 / 7 / 8 / 9 / 10 plus the ones below (an upright bass, a vibraphone with its motor, a clavinet, a cello, glass harmonics, a reversed cymbal, a funk
kit); nothing is sampled. The first section is shared with build_audio13.py: the click times of the title's vault dial and the beats of the slow-motion heart.
"""
import numpy as np
from scipy import signal

from build_audio import SR, tarr, osc, ar, lp, hp, bp, midi
from build_music6 import (Track, hall, pizz, marimba, bell, sub_bass, saw_bass, pad, strings, brass, hat, shaker, timp, roll, riser, impact, crash, tick, heart, MUSIC_GAIN, _n)
from build_music7 import woodblock, music_box, moon_motif, taiko, organ, cue_title7, cue_end7
import build_music10 as M10
from build_music10 import piano, violin, clarinet, mtrumpet, slide_whistle, brush, ride, nylon, groove_times, cue_dips
from build_music9 import grid, ss, snap, rising

# ================================================================ shared with build_audio13: the vault dial and the heartbeat
DIAL_N = 26             # ratchet clicks in the title
DIAL_STOP = 2.40        # seconds from the cue to the dial standing still (the clunk lands here)
DIAL_LAST = 2.27        # the 26th and last click
# The dial coasts to a stop under constant friction: its speed falls in a straight line to zero at DIAL_STOP. The angle covered is then 1 - (1 - t / T) ** 2 (times a constant), so
# the clicks (one per tooth) start about 46 ms apart and stretch out to about 190 ms, and the last one is a long, final, deliberate tick. Click k lands at T * (1 - sqrt(1 - k / M)).
DIAL_M = 1.0 / (1.0 - (1.0 - DIAL_LAST / DIAL_STOP) ** 2) * DIAL_N


def dial_times():
    """Seconds after the vaultdial cue at which each of the 26 clicks lands (a fixed, slightly irregular set: a real pawl is never exact)."""
    k = np.arange(1, DIAL_N + 1)
    t = DIAL_STOP * (1.0 - np.sqrt(1.0 - k / DIAL_M))
    r = np.random.default_rng(1301)
    iv = np.diff(np.concatenate([[0.0], t]))
    jit = 1.0 + .06 * r.uniform(-1, 1, DIAL_N)
    t = np.cumsum(iv * jit)
    return t * (DIAL_LAST / t[-1])


def dial_speed(t):
    """The dial's angular speed, 1 at the start and 0 when it stops (the straight-line fall behind dial_times)."""
    return np.clip(1.0 - np.asarray(t, dtype=float) / DIAL_STOP, 0.0, 1.0)


# the slow-motion heartbeat: (time of the 'lub' in seconds from the cue, how much the tape has slowed by then). The 'dub' follows the lub by HEART_DUB * slowdown.
HEART_BEATS = ((0.10, 1.0), (1.14, 1.16), (2.36, 1.34))
HEART_DUB = .27

R13 = np.random.default_rng(2613)
RH = np.random.default_rng(1313)   # the humaniser's own generator (so the timing feel does not depend on how many noise bursts the instruments drew)
MUTES = []   # [start, end, ramp] spans, absolute seconds, where the finished score is silent (after the reverb, so the silence is dead); the ramp (default 30 ms) is the fade into it


# ================================================================ helpers
def _fit_peak(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def _fit_rms(x, rms=.25):
    r = np.sqrt(np.mean(x ** 2))
    return x * (rms / r) if r > 0 else x


def tvf(x, fc, q=1.0, kind="bp", block=96):
    """A resonant biquad whose centre or cut-off frequency moves while the signal runs (fc: scalar or one value per sample; coefficients refreshed every `block` samples)."""
    n = len(x)
    out = np.zeros(n)
    fcs = np.broadcast_to(np.asarray(fc, dtype=float), (n,))
    qs = np.broadcast_to(np.asarray(q, dtype=float), (n,))
    zi = np.zeros(2)
    for i in range(0, n, block):
        j = min(n, i + block)
        m = (i + j) // 2
        w0 = 2 * np.pi * min(fcs[m], SR * .45) / SR
        al = np.sin(w0) / (2 * qs[m])
        cw = np.cos(w0)
        if kind == "bp":
            b = np.array([al, 0.0, -al])
        elif kind == "lp":
            b = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2])
        else:
            b = np.array([(1 + cw) / 2, -(1 + cw), (1 + cw) / 2])
        a = np.array([1 + al, -2 * cw, 1 - al])
        y, zi = signal.lfilter(b / a[0], a / a[0], x[i:j], zi=zi)
        out[i:j] = y
    return out


def _mute(out, a, b, ramp=.03):
    """Silence the finished score from a to b seconds, with a `ramp`-second fade into it and a 30 ms one out of it."""
    n = out.shape[1]
    i, j = int(round(a * SR)), int(round(b * SR))
    r, r2 = int(ramp * SR), int(.03 * SR)
    g = np.ones(n)
    if i - r >= 0:
        g[i - r:i] = np.linspace(1, 0, r)
    g[max(0, i):min(n, j)] = 0.0
    if j + r2 <= n:
        g[j:j + r2] = np.linspace(0, 1, r2)
    return out * g[None, :]


def _noise(d):
    return R13.uniform(-1, 1, _n(d))


def hum(t, bias=0.0, sd=.005):
    """A player's timing: `bias` seconds ahead (negative) or behind the grid and a random `sd` seconds of looseness. Used on the band's backing notes (bass, brushes, hats, comping), never on
    a hit that is locked to the picture."""
    return t + bias + RH.normal(0.0, sd)


# ================================================================ new instruments
def ubass(m, d=.5, vel=.8):
    """An upright bass, plucked: eight partials (the second and third strongest, since a small speaker plays those and not the fundamental), higher ones dying faster, the pitch
    drooping a hair at the pluck, the thump of a finger and a fingerboard buzz at the start. Warm: closed off at 1.5 to 2.2 kHz."""
    f = midi(m)
    t = tarr(d)
    amps = (.75, 1.0, .8, .5, .34, .22, .14, .09)
    tau0 = .55 if f < 110 else .42 if f < 200 else .3
    x = np.zeros(len(t))
    for k, a in enumerate(amps, 1):
        fk = f * k * np.sqrt(1 + .0003 * k * k)
        if fk > 5000:
            break
        ph = 2 * np.pi * np.cumsum(fk * (1 + .018 * np.exp(-t / .02))) / SR
        x += a * np.sin(ph + k) * np.exp(-t / (tau0 / (1 + .55 * (k - 1))))
    finger = bp(_noise(d), 300, 1600) * np.exp(-t / .006) * .14 * vel
    buzz = bp(_noise(d), 700, 2400) * np.exp(-t / .02) * .035 * vel
    x = lp(x + finger + buzz, 1500 + 700 * vel, 2)
    return _fit_peak(x * ar(d, .0012, min(.08, d * .5)), 1.0) * (.5 + .5 * vel)


def vib(m, d=1.6, vel=.7, motor=4.6, depth=.22):
    """A vibraphone bar with its motor on: partials at 1, 3.93 and 9.88 times the pitch (the upper ones dying faster), an amplitude wobble from the fans, a soft mallet tick."""
    f = midi(m)
    t = tarr(d)
    tau = 1.25 if f < 600 else .8
    x = sum(a * np.sin(2 * np.pi * f * r * t + i) * np.exp(-t / (tau * dk)) for i, (r, a, dk) in enumerate(((1, 1.0, 1.0), (3.93, .3, .38), (9.88, .09, .12))))
    trem = 1 - depth * (.5 - .5 * np.cos(2 * np.pi * motor * t))
    mallet = bp(_noise(d), 900, 4500) * np.exp(-t / .004) * .06 * vel
    return (x * trem + mallet) * ar(d, .001, min(.15, d * .5)) * (.5 + .5 * vel)


def clav(m, d=.14, vel=.85, mute=False):
    """A clavinet: a hard, buzzy string (saw and a narrow pulse) with the two out-of-phase pickups (a comb notch), a resonant filter that is bright at the strike and closes in 50 ms,
    a click of the tangent. `mute` is the dead, chicka-ing ghost note."""
    f = midi(m)
    t = tarr(d)
    ph = f * t
    x = .6 * (2 * (ph % 1) - 1) + .4 * np.where((ph % 1) < .25, 1.0, -1.0)
    dl = max(1, int(SR * .55 / f))
    x = x - .65 * np.concatenate([np.zeros(dl), x[:-dl]])
    fc = (1100 if mute else 4200) * (.25 ** np.minimum(t / (.03 if mute else .05), 1)) + 500
    x = tvf(x, fc, 2.2, "lp")
    env = np.exp(-t / (.04 if mute else .1)) * np.minimum(1, t / .0012)
    click = bp(_noise(d), 2500, 8000) * np.exp(-t / .002) * .22
    return _fit_peak((x * env + click) * ar(d, .0006, min(.03, d * .4)), 1.0) * (.45 + .55 * vel)


def cello(m, d=1.0, vel=1.0, vib_depth=.0045, a=.16, r=.25):
    """A bowed cello: a saw closed off at 2.2 kHz with the two body resonances of the instrument (near 250 and 650 Hz), a vibrato that arrives after a quarter second and a breath of bow noise."""
    t = tarr(d)
    f = midi(m) * (1 + vib_depth * np.sin(2 * np.pi * 5.1 * t) * np.clip((t - .25) / .35, 0, 1))
    x = osc("saw", f, d)
    y = lp(x, 2200, 2) + .7 * bp(x, 180, 320, 1) + .5 * bp(x, 520, 800, 1)
    y += hp(_noise(d), 3000) * .012
    return _fit_rms(y * ar(d, a, min(r, d * .45))) * vel


def glass(m, d=2.0, a=.3, r=.7):
    """A string harmonic: nearly a pure sine with a whisper of its octave, a slow, slightly unsteady swell and a little bow air on top. Cold and thin."""
    t = tarr(d)
    f = midi(m) * (1 + .0015 * np.sin(2 * np.pi * 3.1 * t + m))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .12 * np.sin(2 * ph) + hp(_noise(d), 4000) * .035
    return _fit_rms(x * ar(d, a, r) * (.85 + .15 * np.sin(2 * np.pi * 2.3 * t)), .18)


def revcym(d=1.0, lo=2200, hi=9000):
    """A reversed cymbal: noise through a high-pass that sweeps up, swelling to the end and stopping dead (a 4 ms cut) on the beat it leads into."""
    n = _n(d)
    t = np.linspace(0, 1, n)
    y = tvf(_noise(d), lo * (hi / lo) ** t, .9, "hp") * t ** 2.4
    y[-int(.004 * SR):] *= np.linspace(1, 0, int(.004 * SR))
    return y * .6


def sub_swell(f0, f1, d):
    """A sine that climbs from f0 to f1 and swells as it goes, with its octave for the speakers that cannot play the bottom."""
    t = np.linspace(0, 1, _n(d), endpoint=False)
    f = f0 * (f1 / f0) ** t
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + .35 * np.sin(2 * ph)) * t ** 1.6


def kick13(vel=1.0, d=.22):
    """A tight funk kick: a sine dropping from 170 to 52 Hz in 60 ms, a click of beater."""
    t = tarr(d)
    x = np.sin(2 * np.pi * np.cumsum(52 + 118 * np.exp(-t / .022)) / SR) * np.exp(-t / .075)
    x += .35 * bp(_noise(d), 900, 4500) * np.exp(-t / .0025)
    return x * ar(d, .0004, .03) * (.5 + .5 * vel)


def snare13(vel=1.0, ghost=False, d=.2):
    """A tight snare: a 185 Hz shell tone, a short rattle of wires, a stick click. `ghost` is the dead little note between the backbeats."""
    t = tarr(d)
    tone = np.sin(2 * np.pi * np.cumsum(185 * (1 + .1 * np.exp(-t / .01))) / SR) * np.exp(-t / .045) * .55
    wires = bp(_noise(d), 1800, 9000) * np.exp(-t / (.035 if ghost else .065))
    click = bp(_noise(d), 2500, 6500) * np.exp(-t / .002) * .5
    return (tone + wires + click) * ar(d, .0004, .03) * (.25 if ghost else .85) * (.5 + .5 * vel)


def clack_hi():
    """The dial pulse's muted 'tik': a short band of noise and a 1.4 kHz tick that dies in 8 ms."""
    d = .05
    t = tarr(d)
    return (bp(_noise(d), 1800, 5500) * np.exp(-t / .004) * .8 + np.sin(2 * np.pi * 1400 * t) * np.exp(-t / .008) * .5) * ar(d, .0003, .01)


def clack_lo():
    """...and its 'tok': a 260 Hz knock and a little wood."""
    d = .09
    t = tarr(d)
    return (np.sin(2 * np.pi * 260 * t) * np.exp(-t / .02) * .7 + bp(_noise(d), 400, 1500) * np.exp(-t / .008) * .5) * ar(d, .0004, .02)


def put_chord(T, inst, notes, at, d, g, pan=0.0, strum=0.0, **kw):
    """Play a chord on a mono instrument, `strum` seconds between the notes."""
    for i, m in enumerate(notes):
        T.put(inst(m, d, **kw) if kw else inst(m, d), at + i * strum, g, pan)


def _clip(T, a, b):
    """The span of a track a..b seconds (a copy), for a processed pass."""
    return T.buf[:, int(a * SR):int(b * SR)].copy()


# ================================================================ title: the vault dial
def cue_title13(T, t0, d, beats, D):
    """The logo. The series sting underneath (cue_title7's riser, timpani roll, impact, crash, choir and bells: it lands 2.4 s into the scene, with the sound effect's own landing). On top, the
    vault dial: the score ticks on every other one of the dial's 26 clicks (build_music13.dial_times, the same times the sound effect clicks on), alternating a muted 'tik' and 'tok',
    so the pulse slows as the dial does; a low sub swell climbs under it to 55 Hz; on the clunk (2.4 s into the logo beat) a second, lower hit; then the lettering lands and a bass and
    a finger snap start the noir groove that the next scene continues."""
    cue_title7(T, t0, d, beats)
    lg0, lg1 = beats["logo"]
    for i, at in enumerate(dial_times()):
        if i % 2 == 0:
            hi = (i // 2) % 2 == 0
            T.put(clack_hi() if hi else clack_lo(), lg0 + at + .003, .13 if hi else .16, -.3 if hi else .3)
    T.put(sub_swell(34, 55, 2.2), lg0, .14)
    ck = lg0 + 2.4                                                                   # the clunk: the dial locks
    T.put(timp(55, 1.4), ck, .2)
    T.put(brass([45, 52, 57], .3, .008, .12, 1500), ck, .07, 0)
    for k, m in enumerate((93, 96, 100)):                                           # the lettering lands (textding at 2.5): glass on top
        T.put(bell(midi(m), 1.2) * .6, ck + .1 + k * .07, .05, -.3 + .3 * k)
    bl = 60 / 78                                                                     # a sneaky tag at the open scene's tempo: bass, snaps, a vibraphone chord
    for k, m in enumerate((45, 48, 52, 50)):
        at = ck + .55 + k * bl
        if at < lg1 - .25:
            T.put(ubass(m, .6, .85), at, .22, -.1)
    for k in range(3):
        at = ck + .55 + bl * (1 + 2 * k)
        if at < lg1 - .2:
            T.put(snap(), at, .1, .3)
    put_chord(T, vib, (60, 64, 67, 71), ck + .6, 2.0, .06, .2, strum=.012)
    T.fade(t0 + d - .35, t0 + d, 1, 0)


# ================================================================ open: late-night noir funk
NOIR = (("Am9", (45, 48, 52, 55), (60, 64, 67, 71)), ("Am9", (45, 47, 48, 43), (60, 64, 67, 71)), ("D9", (50, 54, 57, 54), (60, 64, 66, 69)), ("E7", (52, 51, 50, 49), (59, 62, 64, 68)))


def noir_bar(T, at, bl, k, lvl=1.0, comp=True, vibes_on=True):
    """One bar of the noir groove at `at`, `bl` seconds a beat: the upright walks four quarter notes, a brush swirls on two and four with a foot-hat chick, a vibraphone chord on the one
    and a soft stab on the and of three. k picks the chord of the four-bar cycle."""
    _, walk, vch = NOIR[k % 4]
    for j, m in enumerate(walk):
        T.put(ubass(m, bl * .95, .8 if j % 2 == 0 else .65), hum(at + j * bl, -.007, .004), .2 * lvl, -.12)
    for j in (1, 3):
        T.put(brush(bl * .5), hum(at + j * bl - .02, .01, .006), .05 * lvl, .22 if j == 1 else -.22)
        T.put(hat(.04), hum(at + j * bl, .008, .005), .022 * lvl, .35)
    T.put(shaker(), hum(at + 2.5 * bl, .01, .006), .02 * lvl, .3)
    if vibes_on:
        put_chord(T, vib, vch, at, bl * 3.2, .065 * lvl, .15, strum=.011)
        if comp and k % 2 == 1:
            put_chord(T, vib, vch, at + 2.5 * bl, bl * 1.2, .04 * lvl, .15, strum=.01)
    if k % 4 == 3:                                                                   # the E7 bar ends the cycle: a muted trumpet answers
        for off, m, dd in ((2.0, 76, .4), (2.5, 74, .3), (3.0, 72, .9)):
            T.put(mtrumpet(m, dd * bl * .9, .85), at + off * bl, .06 * lvl, .25)


def cue_open13(T, t0, d, beats, D):
    """7:02 PM, the nurses' station, a late night in the middle of an evening. A dry noir funk in A minor (75 to 78 bpm): an upright bass that walks, a brush on the snare, a vibraphone
    that sustains Am9 and D9 over it and a harmon-muted trumpet that sighs in the gaps. The band is very quiet under the dialogue. The schedule insert holds one pedal tone, a single
    low A, and nothing else; the groove comes back for 'It says pending.' and builds (a kick joins at 'We're taking it.', the vibraphone states the heist motif on 'heist', a brush roll
    under 'Then we'll need a crew.'); the record scratch at the end beat kills it dead."""
    op, sd, e0 = beats["open"], beats["sched"], beats["end"]
    # --- the first pause: a low A, a vibraphone chord, a trumpet sigh
    T.put(ubass(33, 1.4, .8), op[0] + .12, .15, -.1)
    put_chord(T, vib, (64, 67, 71, 72), op[0] + .3, 2.2, .045, .2, strum=.02)
    T.put(mtrumpet(76, .55, .85, wah=2.5), op[0] + .55, .07, .25)
    T.put(mtrumpet(74, .75, .8), op[0] + 1.12, .07, .25)
    # --- groove A: three bars between the narrator's cue and the schedule insert (bent a hair so the bars fit)
    ta, bl = groove_times(beats["n1"][0] - .1, sd[0] - .02, 4, 76)
    for i in range(0, len(ta), 4):
        noir_bar(T, ta[i], bl, i // 4, .85 if i == 0 else 1.0)
    T.put(mtrumpet(69, .5, .8, wah=3.0), beats["s1"][0] - .24, .07, .25)             # a sigh as Strawberry starts talking
    T.put(mtrumpet(67, .9, .8), beats["l2"][1] + .02, .08, .25)
    # --- the schedule insert: one pedal tone
    T.put(cello(33 + 12, sd[1] - sd[0] + .2, .9, a=.4, r=.5), sd[0] - .04, .1, 0)
    T.put(organ([45], sd[1] - sd[0] + .1, .5, 5.5), sd[0] - .02, .07, 0)
    # --- groove B: four bars that build to the heist
    tb, bl2 = groove_times(sd[1] + .02, e0[0] + .05, 4, 78)
    for i in range(0, len(tb), 4):
        noir_bar(T, tb[i], bl2, i // 4, .9 + .05 * (i // 4))
    t_taking = beats["s4"][0] - .1
    for at in tb:                                                                      # a kick from 'We're taking it.'
        if t_taking <= at < e0[0]:
            T.put(kick13(.7), at, .12, 0)
    h = M10.wt("m2", "heist")                                                         # 'That's a heist.': the motif, a muted trumpet stab, a low brass note
    for off, m, dd in ((0, 69, .22), (.25, 72, .22), (.5, 76, .5), (1.05, 74, .22), (1.3, 72, .5)):
        T.put(vib(m + 12, dd * 2.5, .8), h + off, .06, .3)
    T.put(mtrumpet(69, .35, 1.0), h + .02, .1, .2)
    T.put(brass([45, 52, 57], .3, .01, .1, 1300), h + .02, .06, 0)
    l5 = beats["l5"][0]                                                               # 'Then we'll need a crew.': a brush roll that builds into the scratch
    nroll = 18
    for j in range(nroll):
        at = l5 + (e0[0] - l5) * (j / nroll) ** .9
        T.put(snare13(.35 + .5 * j / nroll, ghost=True), at, .05 + .09 * j / nroll, .1)
    for k, m in enumerate((57, 60, 64, 67)):                                          # a last climb up the chord, then the scratch takes it
        T.put(vib(m + 12, .5, .7), e0[0] - .55 + k * .12, .05, -.2 + .15 * k)
    MUTES.append((e0[0] + .035, t0 + d, .012))                                        # the record scratch: the music is dead from here, the sting rings over nothing


# ================================================================ plan: the briefing
PLAN_PROG = (("Am9", (45, 48, 52, 48), (64, 67, 71, 72), (69, 72, 76)), ("Am9", (45, 47, 48, 50), (64, 67, 71, 72), (71, 74, 76)),
             ("Fmaj7", (41, 45, 48, 45), (57, 60, 64, 65), (72, 76, 77)), ("E7", (40, 44, 47, 44), (56, 59, 62, 67), (68, 71, 74)))
MOTIF = ((0, 69, 1), (1, 72, 1), (2, 76, 3), (5, 74, 1), (6, 72, 2))                 # the heist motif in eighth-note slots: A C E . . D C


def plan_bar(T, at, bl, k, layers, lvl=1.0, drums_from=0):
    """One bar of the briefing groove. layers: 0 bass and snaps, 1 vibraphone and the mallet motif, 2 kick, hats and a snare on the backbeat, 3 muted trumpet and stabs.
    `drums_from` is the beat of the bar (0 to 3) the drums start on when a bar is the one an obstacle lands in."""
    _, walk, vch, top = PLAN_PROG[k % 4]
    for j, m in enumerate(walk):
        T.put(ubass(m, bl * .95, .85 if j % 2 == 0 else .7), hum(at + j * bl, -.006, .004), .2 * lvl, -.12)
    for j in (1, 3):
        T.put(snap(), hum(at + j * bl, .004, .004), (.1 if layers < 2 else .075) * lvl, .3)
    if layers >= 1:
        put_chord(T, vib, vch, at, bl * 3, .06 * lvl, .15, strum=.01)
        if k % 2 == 0:
            for slot, m, ln in MOTIF:
                T.put(marimba(midi(m), ln * bl * .5 * .9), at + slot * bl / 2, .075 * lvl, .3 - .1 * (slot % 3))
        else:
            ans = ((0, 71), (1, 74), (2, 77), (4, 76), (6, 74)) if k % 4 == 1 else ((0, 68), (1, 71), (2, 74), (4, 73), (6, 71))     # Am9: B D F E D;  E7: G# B D C# B
            for slot, m in ans:
                T.put(marimba(midi(m), bl * .45), at + slot * bl / 2, .06 * lvl, .3 - .1 * (slot % 3))
    if layers >= 2:
        if drums_from == 0:
            T.put(kick13(.85), at, .15 * lvl, 0)
        if drums_from <= 2:
            T.put(kick13(.6), at + 2.5 * bl, .1 * lvl, 0)
        for j in (1, 3):
            if j >= drums_from:
                T.put(snare13(.7), at + j * bl, .075 * lvl, .1)
        for j in range(8):
            if j / 2 >= drums_from:
                T.put(hat(.04), hum(at + j * bl / 2, .004, .004), (.045 if j % 2 else .03) * lvl, .4 if j % 2 else -.3)
    if layers >= 3:
        T.put(mtrumpet(top[0], bl * .45, .9), at + 3 * bl, .06 * lvl, .25)
        T.put(brass(list(top), .16, .006, .06, 1700), at + 1.5 * bl, .05 * lvl, .1)
        T.put(brass(list(top), .16, .006, .06, 1700), at + 3.5 * bl, .05 * lvl, .1)


def cue_plan13(T, t0, d, beats, D):
    """7:09 PM. The briefing room as a heist film. A cool groove in A minor at 96.75 bpm (the bars are fitted so that the layers come in on the line each obstacle is announced on):
    an upright walk over Am9, Am9, Fmaj7 and E7 (the Andalusian cadence) with finger snaps; the vibraphone and the mallet motif at 'the vault'; a kick, hats and a snare at 'Obstacle one';
    a muted trumpet and brass stabs at 'Obstacle two'. 'Obstacle three.' drops everything to a held, tense drone and a heartbeat tick under the Q-word beat; after 'Shh!' the groove
    comes back sneaking; a brass stab lands on 'mandatory in-service' and the hologram collapse takes the whole band out."""
    op, l3, l5, l8, l10, q, a1, l12, l13, e0 = (beats[k] for k in ("open", "l3", "l5", "l8", "l10", "q", "a1", "l12", "l13", "end"))
    bpm, g0 = 96.75, beats["l1"][0] - .21
    bl = 60 / bpm
    bar = 4 * bl
    # --- the table lights up: a suspended chord swells under the hologram, then the groove starts on the bar line at the first line
    T.put(strings([45, 52, 57, 59, 64], g0 - op[0] + .3, .7, .15, 4.8, 2000), op[0], .06)
    T.put(glass(88, 1.6, .3, .5), op[0] + .1, .03, .4)
    nbars = int(round((l10[0] - g0) / bar))
    for n in range(nbars):
        at = g0 + n * bar
        layers, df = (0 if at < l3[0] - .1 else 1), 0
        if at <= l5[0] < at + bar:                                                          # 'Obstacle one' lands in the middle of this bar: the drums come in on its beat
            layers, df = 2, int(round((l5[0] - at) / bl))
        elif at >= l5[0]:
            layers = 2 if at < l8[0] - .1 else 3
        plan_bar(T, at, bl, n, layers, 1.0, df)
    T.put(riser(.9, 300, 3000, .4), l5[0] - .9, .05)
    # --- Obstacle three: the drone and the heart
    dr0 = l10[0] + .05
    T.put(strings([33, 40, 45], a1[1] - dr0 + .3, 1.2, .05, 4.6, 700), dr0, .1)
    T.put(strings([57, 58, 64], a1[1] - dr0 + .3, 1.8, .05, 5.0, 1600), dr0 + .3, .035)
    for j, at in enumerate((q[0] + .15, q[0] + 1.15, q[0] + 2.1, q[0] + 2.95)):          # a heartbeat tick that quickens
        T.put(heart(.3), at, .14, 0)
        T.put(heart(.25), at + .2, .1, 0)
        T.put(tick(), at + .01, .04, 0)                                                      # a faint click on the thump, which a phone can play
    T.gate(a1[0] + .75, l12[0] - .2, 0.0, .04)                                             # 'Shh!': the room holds its breath
    # --- the groove again, sneaking: three bars fitted between 'Moon.' and the stab
    stab_at = M10.wt("l13", "in-service") - .03
    tc, bl2 = groove_times(l12[0] - .1, e0[0] - .0, 4, 108)
    for i in range(0, len(tc), 4):
        n = i // 4
        _, walk, vch, top = PLAN_PROG[(n + 1) % 4]
        for j, m in enumerate(walk):
            T.put(ubass(m, bl2 * .9, .8 if j % 2 == 0 else .65), hum(tc[i] + j * bl2, -.005, .004), .19, -.1)
        for j in (1, 3):
            T.put(snap(), hum(tc[i] + j * bl2, .004, .004), .08, .3)
        put_chord(T, vib, vch, tc[i], bl2 * 3, .05, .15, strum=.01)
        for j in range(8):
            T.put(hat(.04), tc[i] + j * bl2 / 2, .035 if j % 2 else .025, .4 if j % 2 else -.3)
        if n >= 1:
            T.put(kick13(.7), tc[i], .12, 0)
    mand = M10.wt("l13", "mandatory")
    T.put(brass([57, 60, 64, 69], .2, .008, .1, 1900), mand - .02, .05, 0)                 # 'mandatory': a stab...
    T.put(timp(55, .7), mand - .02, .12)
    T.put(brass([45, 52, 57, 60, 64], .32, .008, .15, 2000), stab_at, .1, 0)                # '...in-service.': the big one
    T.put(timp(55, 1.2), stab_at, .24)
    T.put(crash(.5), stab_at, .05, .1)
    T.fade(e0[0] - .02, e0[0] + .34, 1, 0)                                                 # the hologram collapses: the band is sucked out with it
    MUTES.append((e0[0] + .36, t0 + d))


# ================================================================ crew: freeze-frame cards
FUNK_BASS = ((0, 1.0, 0, 2), (3, .55, 0, 1), (6, .8, 3, 1), (8, 1.0, 0, 2), (10, .75, 10, 1), (12, .85, 7, 1), (14, .65, 3, 1))     # slot, velocity, semitones above the root, slots long
FUNK_KICK = (0, 6, 10)
FUNK_SNARE = (4, 12)
FUNK_GHOST = (7, 9, 15)
FUNK_CLAV = (2, 5, 7, 10, 13, 15)


FUNK_RIFF = ((3, 71, 1), (5, 74, 1), (6, 76, 2), (10, 74, 1), (12, 71, 2))        # the crew's lead: B D E . . D B over an E chord (a blues-ish shout), in sixteenth slots


def funk_pattern(T, at, sp, root, chord, a, b, lvl=1.0, clav_on=True, riff=False):
    """The crew groove, one bar of sixteenths from `at` (`sp` seconds a sixteenth) but only the slots that fall between a and b: a synth bass on the root, a tight kick, snare on two and
    four with ghost notes, closed hats on every sixteenth (the fourth one open), a clavinet comping the chord on the off-sixteenths with muted chicks between."""
    for slot in range(16):
        t = at + slot * sp
        if not (a - 1e-6 <= t < b):
            continue
        for sl, v, semi, ln in FUNK_BASS:
            if sl == slot:
                T.put(saw_bass(midi(root + semi), ln * sp * .85, 900), hum(t, 0.0 if slot == 0 else -.003, 0.0 if slot == 0 else .003), .21 * v * lvl, -.1)
        if slot in FUNK_KICK:
            T.put(kick13(1.0 if slot == 0 else .75), t, .17 * lvl, 0)
        if slot in FUNK_SNARE:
            T.put(snare13(.9), t, .11 * lvl, .1)
        elif slot in FUNK_GHOST:
            T.put(snare13(.5, ghost=True), t, .06 * lvl, .1)
        T.put(hat(.05, open_=(slot == 14)), hum(t, .003, .003), (.05 if slot % 4 == 0 else .03) * lvl, .3 if slot % 2 else -.3)
        if riff:
            for sl, m, ln in FUNK_RIFF:
                if sl == slot:
                    T.put(mtrumpet(m + (root - 52), ln * sp * .95, 1.0), t, .06 * lvl, .25)
        if clav_on:
            if slot in FUNK_CLAV:
                for m in chord[1:4]:
                    T.put(clav(m, sp * 1.4, .9), t, .05 * lvl, -.3 + .2 * (m % 3))
            else:
                T.put(clav(chord[2], sp * .9, .5, mute=True), t, .028 * lvl, .3)


CREW_CARDS = (("n1", 40, (52, 56, 59, 62, 67)),                    # The Brains: E7#9, the Hendrix chord
              ("n2", 45, (57, 61, 64, 67, 72)),                    # The Ghost: A7#9
              ("n3", 40, (52, 56, 59, 62, 66)),                    # The Talker: E9
              ("n4", 38, (50, 54, 57, 60, 64)),                    # The Muscle: D9, the low brass
              ("n5", 40, (52, 56, 59, 62, 67)),                    # The Distraction: F9 slipping down to E7#9
              ("n6", 40, (52, 55, 59, 62, 66)))                    # The Eye in the Sky: Em9, spacey


def cue_crew13(T, t0, d, beats, D):
    """The crew intro as freeze-frames. A punchy funk groove at 104 bpm (an E minor and dominant world: clavinet stabs, a synth bass, a tight kit) that restarts from the top of the bar with
    a hit on every card slam: one stab per card (E7#9, A7#9, E9, D9, F9 sliding to E7#9; all the same family), a reverse cymbal leading into every freeze, a snare roll through the flash
    montage into the first card. The Moon's card gets a spacey Em9 and his four falling bells; the groove is gone."""
    sp = 60 / 104 / 4
    op = beats["open"]
    starts = [beats[c[0]][0] for c in CREW_CARDS]
    # --- the flash montage: a snare roll that tightens into the first freeze, a reverse cymbal
    n1 = starts[0]
    T.put(revcym(n1 - op[0] - .1, 2000, 8000), op[0] + .05, .22)
    for j in range(16):
        at = op[0] + .2 + (n1 - op[0] - .25) * (j / 16) ** .8
        T.put(snare13(.3 + .6 * j / 16, ghost=True), at, .12 + .2 * j / 16, -.2 + .4 * (j % 2))
    for i, (cid, root, chord) in enumerate(CREW_CARDS):
        a = starts[i]
        b = starts[i + 1] - .06 if i + 1 < len(starts) else beats["end"][0] - .05
        if cid != "n6":
            # the hit: a clavinet and brass stab on the chord, a kick and a crash, then the groove from the top of the bar
            if cid == "n5":                                                                     # the Distraction slips: F9 first, then a half step down onto the real chord
                F9 = (53, 57, 60, 63, 67)
                T.put(brass(list(F9), .2, .006, .08, 2200), a + .02, .1, 0)
                for m in F9:
                    T.put(clav(m, .16, 1.0), a + .02, .06, -.4 + .16 * (m % 5))
                a2 = a + .02 + 1.5 * sp
                T.put(brass(list(chord), .22, .006, .1, 2200), a2, .1, 0)
                for m in chord:
                    T.put(clav(m, .18, 1.0), a2, .06, -.4 + .16 * (m % 5))
            else:
                T.put(brass(list(chord), .26, .006, .1, 2200), a + .02, .1, 0)
                for m in chord:
                    T.put(clav(m, .2, 1.0), a + .02, .06, -.4 + .16 * (m % 5))
            T.put(crash(.5), a + .02, .06, .15)
            T.put(timp(root + 15 if root + 15 < 60 else 55, .5), a + .02, .13)
            for k_bar in range(int((b - a) / (16 * sp)) + 1):                                   # the bar repeats until the next freeze
                funk_pattern(T, a + k_bar * 16 * sp, sp, root + 12, chord, a - .001 if (cid != "n5" or k_bar) else a + 2.5 * sp, b, 1.0, riff=True)
            if cid == "n5":                                                                     # the Distraction: a banana-peel slide on the hit
                T.put(slide_whistle(84, 60, .45), a + .3, .05, .3)
        else:
            # the Moon: no groove; a spacey chord, the Moon's four falling bells
            T.put(pad(list(chord) + [71], b - a + .6, 1.2, 1.2, 1800), a + .02, .1)
            T.put(strings([64, 71, 74, 78], b - a + .4, 1.0, 1.0, 5.0, 2600), a + .04, .07)
            T.put(timp(40, 1.8), a + .02, .12)
            for k, m in enumerate((93, 98, 100)):
                T.put(bell(midi(m), 1.6) * .6, a + .25 + k * .21, .04, -.4 + .4 * k)
            moon_motif(T, a + .5, .07, .3, .26)
            moon_motif(T, beats["mo1"][0] + .05, .055, -.3, .28)
            T.put(glass(88, 3.2, .6, 1.2), a + .1, .05, .3)
        # a reverse cymbal into the next freeze
        if i + 1 < len(starts):
            T.put(revcym(.62, 2200, 8500), starts[i + 1] - .64, .06)
            T.gate(starts[i + 1] - .062, starts[i + 1] + .0, 0.0, .006)
    T.fade(t0 + d - .6, t0 + d, 1, 0)


# ================================================================ hall: the lasers, in slow motion
def _slowmo(buf, a, b, r_end=.5, ramp=.55):
    """Replace the span a..b seconds of a stereo buffer with a slowed-down read of the material that was playing there: the tape drags, the read speed falls from 1 to r_end over `ramp`
    seconds and stays there, so everything in it pitches down and stretches."""
    i, j = int(a * SR), int(b * SR)
    t = np.arange(j - i) / SR
    rate = 1 - (1 - r_end) * ss(t / ramp)
    pos = np.cumsum(rate)
    src = buf[:, i:i + int(pos[-1]) + 4].copy()
    idx = np.arange(src.shape[1])
    buf[:, i:j] = np.stack([np.interp(pos, idx, src[c]) for c in range(2)])


def cue_hall13(T, t0, d, beats, D):
    """7:14 PM, the hall full of red beams. Tension: a sub drone on A, a slow muted pulse once a second, strings on harmonics that sit a semitone apart and beat. At `lasers` (slow
    motion) the whole bed is read back from a dragging tape (it pitches down and stretches), the heartbeat sound effect takes over as the pulse, and a long string swell, reversed, climbs
    for the whole beat; at the end of the beat it snaps back into time with a crack, a tick-tock caper bass and a riser that runs into the sting."""
    op, l1, s1, ls, l2, s2, e0 = (beats[k] for k in ("open", "lr1", "sr1", "lasers", "lr2", "sr2", "end"))
    # --- the tension bed up to and through the slow-motion beat (everything here gets dragged by _slowmo)
    T.put(strings([33, 40, 45], ls[1] - op[0] + .6, 1.0, .3, 4.6, 650), op[0], .1)
    T.put(sub_bass(midi(33), ls[1] - op[0]) * .5, op[0], .12, 0)
    for k, m in enumerate((81, 82, 88, 85)):
        T.put(glass(m, 3.4, 1.0, 1.2), op[0] + .3 + k * 2.2, .05, -.3 + .2 * k)
    for at in grid(op[0] + .45, ls[0] - .3, 60, 1.0):                                        # the slow pulse: one muted thump a second, until the slow motion's own heart takes over
        T.put(timp(45, .5), at, .12, 0)
        T.put(heart(.25), at + .02, .12, 0)
    for at in (op[0] + .1, op[0] + .35, op[0] + .6):                                         # the three countdown beeps get a tick
        T.put(tick(), at, .08, .3)
    T.gate(op[0], op[1], .6, .2)                                                             # in the opening pause the three beeps and the beams lead
    _slowmo(T.buf, ls[0] - .02, ls[1] + .0, .5, .55)
    T.gate(ls[0] - .05, ls[1] - .06, .45, .3)                                                # the slowed bed sits well under the heartbeat and the beams
    # --- the heart of the slow motion: the score's own kettle drum on the sound effect's three lub-dubs (build_audio13.HEART_BEATS), so the two are one pulse
    for at, sl_ in HEART_BEATS:
        T.put(timp(48 / sl_ ** .5, .7 * sl_), ls[0] + .2 + at, .07, 0)
        T.put(timp(55 / sl_ ** .5, .5 * sl_), ls[0] + .2 + at + HEART_DUB * sl_, .045, 0)
    # --- the long reversed swell and the snap back
    T.put(strings([45, 52, 57, 64, 69], ls[1] - ls[0] - .05, ls[1] - ls[0] - .35, .05, 5.0, 2000), ls[0] + .05, .07)
    T.put(revcym(ls[1] - ls[0] - .1, 800, 6500), ls[0] + .05, .05)
    snap_at = ls[1]
    T.gate(snap_at - .035, snap_at, 0.0, .006)
    T.put(snare13(1.0), snap_at, .16, .1)                                                    # the crack that puts it back in time
    T.put(brass([45, 52, 57], .12, .004, .05, 1900), snap_at, .08, 0)
    T.put(timp(55, .6), snap_at, .14)
    bl = 60 / 130
    ost = (45, None, 52, None, 45, None, 43, 47)
    for k, at in enumerate(grid(snap_at + .02, e0[0] + .07, 130, .5)):                      # a caper bass ostinato with woodblock ticks and brush taps
        m = ost[k % 8]
        if m:
            T.put(pizz(midi(m), bl * .45), at, .2, -.1)
        if k % 2 == 0:
            T.put(woodblock(), at, .06, .3 if k % 4 else -.3)
        if k % 4 == 2:
            T.put(snare13(.5, ghost=True), at, .05, .1)
    rs0 = snap_at + .1
    T.put(rising(57, 76, e0[0] + .09 - rs0), rs0, .1, .2)                                    # the riser into the sting
    T.put(riser(e0[0] + .09 - rs0, 300, 6000, .5), rs0, .075)
    T.put(strings([45, 52, 57, 60, 64], e0[0] + .09 - rs0, e0[0] + .09 - rs0 - .1, .02, 6.0, 2200), rs0, .05)
    T.gate(e0[0] + .09, t0 + d + .0, 0.0, .01)                                                # the sting is all there is
    T.fade(t0 + d - .3, t0 + d, 1, 0)


# ================================================================ cross: the caper
CROSS_BPM, CROSS_G0, SWING = 155.0, .15, .62
CROSS_WALK = ((41, 45, 50, 54), (55, 52, 48, 43))                                   # F A D F#  |  G E C G: a walk through F, D7, Gm7, C7 and back to F
CROSS_ORGAN = (((57, 60, 64, 65), 2), ((54, 60, 64, 69), 2), ((55, 58, 62, 65), 2), ((52, 58, 60, 64), 2))     # Fmaj7, D7, Gm7, C7: two beats each
CROSS_LEAD_A = ((1, 72, 1), (2, 69, 1), (3, 72, 1), (4, 74, 2), (6, 72, 1), (7, 69, 1))           # C5 A4 C5 D5 . C5 A4 over Fmaj7 / D7: the question
CROSS_LEAD_B = ((1, 70, 1), (2, 67, 1), (3, 70, 1), (4, 72, 2), (6, 70, 1), (7, 67, 1))           # Bb4 G4 Bb4 C5 . Bb4 G4 over Gm7 / C7: the answer
CROSS_STAB = ((60, 65, 69, 72), (60, 66, 69, 72), (58, 62, 65, 67), (58, 64, 67, 70))


def cue_cross13(T, t0, d, beats, D):
    """7:15 PM. An upbeat caper at 155 bpm, a swinging eighth (the offbeat falls 62 percent into the beat): an upright walking Fmaj7, D7, Gm7, C7 (a bar is two chords), a ride cymbal and
    a brush on two and four, a jazz organ comping on the offbeats and brass stabs. The grid is placed so that the slide, the badge, the slip and the end all land on the beat. It is
    tighter and busier than the noir groove: a stab goes on every cut (the start of every line and of every pause), the slide drops the band into stop-time, the badge reader's green
    light and the clunks sit in a held organ chord that explodes into the groove again, a slide whistle falls with the banana and a rim shot catches him."""
    b = 60 / CROSS_BPM
    g0 = t0 + CROSS_G0

    def st(e):                                                                       # time of the e-th swung eighth of the grid
        return g0 + (e // 2 + (SWING if e % 2 else 0)) * b

    def q(t):                                                                        # the swung eighth nearest to a time
        e0 = int(round((t - g0) / (b / 2)))
        return min((st(e) for e in (e0 - 1, e0, e0 + 1)), key=lambda x: abs(x - t))

    sl, bd, sp_ = beats["slide"], beats["badge"], beats["slip"]
    end0 = beats["end"][0]
    stops = [(q(sl[0]) - .02, q(sl[1] + .02)), (q(bd[0]) - .02, q(bd[1] + .02)), (q(sp_[0]) - .02, q(sp_[1] + .02))]
    in_stop = lambda t: any(a <= t < c for a, c in stops)
    n_e = int((end0 - g0) / (b / 2)) + 1
    for e in range(0, n_e, 2):                                                       # one pass per beat
        beat = e // 2
        bar, bt = divmod(beat, 4)
        t = st(e)
        if t < beats["open"][0] - .05 or t >= end0 - .02 or in_stop(t):
            continue
        walk = CROSS_WALK[bar % 2]
        T.put(ubass(walk[bt], b * .9, .85 if bt % 2 == 0 else .7), hum(t, -.006, .004), .22, -.1)
        T.put(ride(.35), hum(t, .004, .004), .045 if bt % 2 == 0 else .035, .35)
        if (bt % 2 == 1):
            T.put(ride(.3), hum(st(e + 1), .004, .005), .04, .35)                       # the skip note: ding, ding-a, ding
            T.put(brush(.22), hum(t - .01, .006, .005), .06, -.25)
            T.put(hat(.04), hum(t, .006, .004), .03, .3)
        if t > beats["lr1"][0] - .3 and bt in (1, 3):
            T.put(snare13(.5, ghost=True), st(e + 1), .035, .1)                    # a ghost note after the backbeat
    # the organ: two chords a bar, comping on the offbeat of one and the beat after
    for bar in range(int((end0 - g0) / (4 * b)) + 1):
        for c in range(4):
            notes = CROSS_ORGAN[(bar % 2) * 2 + c // 2][0]
            for e in (bar * 8 + c * 4 + 1, bar * 8 + c * 4 + 3):                    # the "and" of the first and second beat of each half-bar
                t = st(e)
                if t < beats["open"][0] or t >= end0 - .05 or in_stop(t):
                    continue
                for m in notes:
                    T.put(organ([m], .16, .5, 6.5, (1.0, .9, .7, .5, .3, .15)), t, .045, .15 * (m % 3 - 1))
    # the lead: a muted trumpet riff over each pair of bars, question and answer
    for bar in range(int((end0 - g0) / (4 * b)) + 1):
        for slot, m, ln in (CROSS_LEAD_A if bar % 2 == 0 else CROSS_LEAD_B):
            t = st(bar * 8 + slot)
            if t < beats["lr1"][0] - .1 or t >= end0 - .1 or in_stop(t):
                continue
            T.put(mtrumpet(m, ln * b * .5 * .85, .95), t, .055, .25)
            T.put(vib(m + 12, ln * b * .5 * 2.2, .7), t, .03, -.2)
    # the stabs: one on every cut
    cuts = [beats[k][0] for k in beats if k not in ("open",)]
    big = {sl[0], bd[0], sp_[0], end0}
    done = set()
    for c in sorted(cuts):
        tq = q(c - .01)
        if round(tq, 3) in done:
            continue
        done.add(round(tq, 3))
        k = int(((tq - g0) // (4 * b)) % 2) * 2 + int(((tq - g0) % (4 * b)) // (2 * b))
        stab = CROSS_STAB[k % 4]
        is_big = c in big
        T.put(brass(list(stab), .13 if not is_big else .22, .004, .05, 2300), tq, .1 if not is_big else .12, 0)
        T.put(woodblock(), tq, .05, .3)
    # the opening: a pickup into the grid, the first bar bass and snaps only
    T.put(tick(), beats["open"][0] + .1, .08, .3)
    # the slide: stop-time, two dry notes (a slide that goes 'dun, dun')
    for off in (.12, .5):
        T.put(marimba(midi(53), .3), sl[0] + off, .09, .2)
        T.put(ubass(41, .3, .9), sl[0] + off, .2, 0)
    # the badge: a held organ chord that swells while the reader says yes and the bolts shoot, then everything goes at once
    T.put(organ([53, 57, 60, 65], bd[1] - bd[0] + .1, .6, 6.0), bd[0] + .02, .2, 0)
    T.put(riser(bd[1] - bd[0] - .15, 400, 4500, .4), bd[0] + .05, .14)
    for at in (bd[0] + .6, bd[0] + .85):
        T.put(woodblock(), at, .16, 0)
    T.put(timp(53, .7), q(bd[1] + .02), .16)
    T.put(crash(.9), q(bd[1] + .02), .06, .1)
    # the slip: a slide whistle falls with the banana, a muted trumpet wah-wah-wahs after him, and a rim shot catches him at the bottom
    T.put(slide_whistle(98, 55, .85), sp_[0] + .04, .24, .1)
    for k, m in enumerate((65, 63, 61, 58)):
        T.put(mtrumpet(m, .17, .9, wah=6.0), sp_[0] + .35 + k * .17, .11, .2)
    T.put(woodblock(), sp_[1] - .02, .2, 0)
    T.put(snare13(1.0), sp_[1] - .02, .16, .1)
    T.put(crash(.5), sp_[1] - .02, .06, .15)
    # a chase: from 'Banana. Now.' the hats run in sixteenths and the bass doubles
    lr3 = beats["lr3"][0]
    for at in grid(lr3, sp_[0] - .02, CROSS_BPM, .5):
        T.put(hat(.04), at, .03, .3 if int(round((at - lr3) / (b / 2))) % 2 else -.3)
    T.fade(t0 + beats["end"][1] - .1, t0 + d, 1, 0)


# ================================================================ vault: the break room nobody has opened
BRENDA = (72, 79, 77, 76, 74, 72)                                                  # C G F E D C: a sixth up and a step-wise fall home


def cue_vault13(T, t0, d, beats, D):
    """7:19 PM, the break room, sealed since 2019.
    Eerie first (0.2 to 6.4 s): a drone on A with a cold cluster over it, two string harmonics a semitone apart that beat, a music box in A minor that is a little flat and a little late. The
    beams find Brenda and a string cluster stabs. Under Lemon's explanation the room is nearly bare: a cello pedal, the music box counting 'nineteen', a clarinet's sigh on 'Nobody covered.'
    and nothing at all under Brenda's question but one harmonic that rises with it.
    The heart (16.2 to 24.4 s) begins on 'I've got it. Go.': the harmonic opens onto C major (the A of the drone is now the sixth of the chord), strings, a cello pedal and a harp breaking
    the chord, and a solo violin that sings Brenda's six notes (C G F E D C) under 'Nobody ever said that.' and again as Strawberry sits; Am9 as Brenda rises, F as she sits, C as she
    takes the bite, on which a soft piano answers her 'Mm.' All of it is the music box's tune made warm.
    Then silence from the Moon's first word until the freeze. The red crash: a roll that tightens, a two-tone brass alarm, one big brass hit with the whole kit. Dry quiet for 'Moon.' and
    'Sorry.'; the tender strings come back for 'We've got it. Sit.' and are torn up on 'Sit.' by the crew running out (thin pizzicato, a marimba, a slide whistle); one warm note under 'Pending.'"""
    op, fd, l1, l3, br1, gp, s2, br2, fr, sit, s3, mo1, fz, l4, mo2, l5, c2, s4, e0 = (beats[k] for k in ("open", "find", "l1", "l3", "br1", "gasp", "s2", "br2", "free", "sit", "s3",
                                                                                                          "mo1", "freeze", "l4", "mo2", "l5", "c2", "s4", "end"))
    # --- the eerie room
    T.put(strings([33, 40], fd[1] - op[0] + .6, 2.5, .8, 4.5, 520), op[0], .1)
    T.put(strings([45, 46, 52], fd[0] - op[0] + .3, 1.8, .15, 4.2, 800), op[0] + .3, .04)
    T.put(glass(88, 2.9, 1.3, .9), op[0] + .8, .045, -.4)
    T.put(glass(89, 2.9, 1.5, .9), op[0] + .9, .04, .4)
    for at, m in ((op[0] + 1.25, 76), (op[0] + 2.1, 72), (op[0] + 3.0, 74), (op[0] + 3.75, 71)):         # the music box: a lullaby in A minor, flat and slow
        T.put(music_box(midi(m + 12 - .15), 1.1), at, .085, .3)
    T.put(music_box(midi(72 + 12 - .15), 1.4), beats["m1"][1] + .2, .07, .3)
    # --- the beams find her: a dissonant stab
    sa = fd[0] + .1
    T.put(strings([45, 46, 52, 58, 64, 65], 1.4, .006, .9, 5.5, 2800), sa, .075)
    T.put(timp(40, 1.2), sa, .12)
    T.put(glass(100, 2.0, .01, 1.5), sa, .03, .3)
    T.put(glass(101, 2.0, .01, 1.5), sa, .03, -.3)
    # --- Lemon explains: a cello pedal, the music box counting, a sigh
    T.put(cello(45, l3[1] - l1[0] + .8, .9, a=.9, r=.8), l1[0] - .05, .09, 0)
    T.put(glass(81, br1[0] - l1[0], 1.4, .8), l1[0], .04, .3)
    nn = M10.wt("l2", "nineteen")
    for k, m in enumerate((76, 74, 72)):
        T.put(music_box(midi(m + 12 - .15), 1.0), nn + .05 + k * .24, .08, .3)
    T.put(clarinet(76, .3), l3[1] + .06, .1, .2)                                                           # 'Nobody covered.'
    T.put(clarinet(72, .9, a=.06), l3[1] + .34, .09, .2)
    # --- 'Is someone covering?': almost nothing, one harmonic that rises with the question
    T.put(glass(88, br1[1] - br1[0] + .6, 1.2, .5), br1[0] + .15, .05, .3)
    # --- the gasp: a breath, and the chord opens
    T.put(strings([48, 55, 64], s2[0] - gp[0] + .35, .6, .05, 5.0, 1800), gp[0] + .3, .16)
    # --- the heart. The grid: 62.5 bpm, a bar (3.84 s) from 'I've got it.', then 'free', then the bite
    bl = (s3[0] + .06 - s2[0]) / 8.0
    bar = 4 * bl
    c1, c2_, c3_ = s2[0] - .03, s2[0] - .03 + bar, s2[0] - .03 + 2 * bar
    ch = ((48, (48, 55, 59, 62), (60, 64, 67, 71, 74), 0), (47, (47, 50, 55, 59, 62), (59, 62, 67, 71), 2), (45, (45, 52, 55, 59, 60), (57, 60, 64, 67, 71), 0), (41, (41, 48, 52, 57), (57, 60, 64, 65, 69), 2))
    seq = ((c1, 0), (c1 + 2 * bl, 1), (c2_, 2), (c2_ + 2 * bl, 3), (c3_, 0))                                  # C, G/B, Am9, Fmaj7, C
    for i, (at, k) in enumerate(seq):
        bass, low, mid, _ = ch[k]
        dd = (seq[i + 1][0] - at) if i + 1 < len(seq) else 4 * bl
        dd = max(dd, 1.0)
        T.put(cello(bass, dd + .5, .95, a=.35, r=.9), at, .1, -.15)
        T.put(strings(list(mid), dd + .6, .55, .9, 5.2, 2400), at, .075)
        T.put(strings([n - 12 for n in mid[:3]], dd + .5, .6, .9, 5.0, 1400), at, .04)
        for j, m in enumerate(mid[:4] + mid[:3]):                                                        # the harp breaks the chord, one a beat's half
            if at + j * bl * .5 < min(at + dd, c3_ + .3):
                T.put(nylon(m + 12 if j > 3 else m, 1.5, .85, .2), at + j * bl * .5 + .01, .085, -.3 + .1 * j)
    # Brenda's six notes on a solo violin: first under 'Nobody ever said that.', then again as Strawberry sits
    t = br2[0] + .15
    for m, dd in zip(BRENDA, (1.1, 1.1, .6, .6, .6, .5)):
        T.put(violin(m, dd * .97, a=.09), t, .09, .1)
        t += dd
    t = c3_ - 2 * bl - .02                                                                                # the second time, C G and then E (the third of the chord she is sitting down into)
    for m, dd in ((72, .96), (79, .96), (76, 1.3)):
        T.put(violin(m, dd * .97, a=.09), t, .09, .1)
        t += dd
    T.put(strings([60, 64, 67, 71, 74], 2.0, .1, 1.5, 5.2, 2800), fr[0] + .5, .04)                          # as Brenda stands the room lifts a little
    T.gate(fr[0] + .05, sit[1], .62, .25)                                                                    # the creaks, the steps, the chair and the wrapper are the foreground here
    # the bite: a soft piano answers 'Mm.'
    bite = s3[0] + .05
    for k, m in enumerate((48, 60, 64, 67, 71, 74)):
        T.put(piano(m, 2.4, .5), bite + k * .03, .06, -.2 + .08 * k)
    # --- silence from the Moon's line to the freeze
    T.gate(mo1[0] - .09, fz[0] + .03, 0.0, .06)
    MUTES.append((mo1[0] - .04, fz[0] + .02, .1))                                                           # and the room's own tail goes with it: this is dead silence, 2.6 s of it
    # --- the red crash
    r0 = fz[0] + .3
    D.put(roll(70, .55, 22), r0, .07, -.1)
    for k in range(10):                                                                                  # the two-tone alarm on low brass
        D.put(brass([68 if k % 2 else 63, 56 if k % 2 else 51], .15, .008, .05, 1800), r0 + .02 + k * .13, .035, -.3 + .06 * k)
    hit = r0 + .6
    D.put(brass([45, 51, 57, 63, 69], .5, .01, .2, 2300), hit, .05, 0)
    D.put(timp(50, 1.2), hit, .07)
    D.put(taiko(60, .9), hit, .06)
    D.put(crash(1.2), hit, .035, .1)
    D.put(impact(1.2) * .8, hit, .06)
    # --- 'Moon.' and 'Sorry.' are dry: nothing. Then the tender strings come back for 'We've got it. Sit.'
    T.gate(l4[0] - .35, l5[0] - .12, 0.0, .03)
    D.gate(l4[0] - .3, l5[0] - .12, 0.0, .03)
    t_ = l5[0] - .05
    T.put(strings([48, 55, 64, 67], M10.wt("l5", "sit") - t_ + .25, .12, .1, 5.2, 2400), t_, .075)
    T.put(nylon(72, 1.2, .85, .2), t_ + .1, .09, -.2)
    T.put(nylon(79, 1.2, .85, .2), t_ + .5, .08, .2)
    sit_at = M10.wt("l5", "sit") - .02
    T.gate(sit_at, c2[1] + .04, 0.0, .02)                                                                  # the tender strings are torn off by the crew running
    # --- the crew runs out: thin, quick, comic (a bounce on 'Sit.', a chase until the door)
    tb = 60 / 176
    lv = lambda t: .3 if c2[0] - .04 <= t < c2[1] + .02 else 1.0                                        # thin under the word 'Sure!' (it lives in the same band), full in the gaps
    for k, at in enumerate(grid(sit_at + .02, c2[1] + .02, 176, .5)):
        m = (48, 55, 50, 57, 52, 59, 53, 60)[k % 8]
        D.put(pizz(midi(m), tb * .4), at, .16 * lv(at), -.15)
        D.put(marimba(midi((72, 76, 79, 76, 74, 77, 81, 77)[k % 8]), .14), at, .075 * lv(at), .4 if k % 2 else -.4)
        if k % 2 == 0:
            D.put(woodblock(), at, .06 * lv(at), .3)
    D.put(slide_whistle(96, 64, .45), c2[1] - .02, .09, .2)                                              # the whistles after the word
    D.put(slide_whistle(91, 55, .5), c2[1] + .12, .07, -.2)
    D.put(snare13(1.0), c2[1] + .02, .12, .1)
    # --- 'Pending.': one warm note, then the sting has the room
    n0 = s4[0] - .05
    T.put(cello(48, 1.7, 1.0, a=.2, r=.9), n0, .12, 0)
    T.put(strings([60], 1.7, .25, .9, 5.0, 1800), n0 + .02, .05)
    T.gate(e0[0] + .45, t0 + d, 0.0, .1)
    T.fade(t0 + d - .5, t0 + d, 1, 0)


# ================================================================ the cue table, levels and the score
CUES = {"title": cue_title13, "open": cue_open13, "plan": cue_plan13, "crew": cue_crew13, "hall": cue_hall13, "cross": cue_cross13, "vault": cue_vault13, "end": cue_end7}
LEVEL13 = {"title": 1.0, "open": 1.0, "plan": 1.0, "crew": .7, "hall": .8, "cross": 1.0, "vault": 1.0, "end": 1.0}   # per-scene trim, set from the measured stems (see the report)
TAIL13 = {"title": .2, "open": .2, "plan": .2, "crew": .5, "hall": .25, "cross": .25, "vault": .35, "end": 3.0}   # how long the reverb may ring on past the scene's last frame
DIP13 = {"title": 1.0, "open": .6, "plan": .5, "crew": .5, "hall": .5, "cross": .6, "vault": .5, "end": 1.0}    # the score's own dip under dialogue, per scene
REVERB13 = {"title": (.55, 1.6), "open": (.3, 1.0), "plan": (.35, 1.1), "crew": (.25, .8), "hall": (.6, 2.0), "cross": (.3, .9), "vault": (.6, 2.2), "end": (.55, 1.6)}
DIPS13 = {"sting": (6, .7, .5), "clunk": (3, .25, .25), "textding": (5, .3, .25), "stab": (5, .5, .4), "holoon": (4, .5, .3), "holoblip": (3, .12, .12), "pips": (3, .9, .3),
          "holooff": (4, .4, .3), "cardslam": (3, .1, .12), "freezesnap": (3, .1, .1), "laserhum": (2, .9, .3), "laserpass": (3, .4, .3), "heartbeat": (2, 2.2, .4), "slowmo": (3, .5, .3),
          "beep3": (4, .6, .2), "vmbeep": (4, .3, .25), "peel": (4, .3, .2), "boing": (4, .3, .2), "clack": (3, .08, .1), "doorcreak": (3, 1.6, .5), "gasp": (4, .45, .3),
          "bonecreak": (4, .9, .3), "dust": (3, .4, .3), "wrapper": (3, .8, .3), "munch": (3, .15, .2), "harp": (3, 1.0, .4), "chair": (3, .5, .3), "doorclose": (3, .4, .3),
          "whoosh": (4, .3, .2), "phonering": (3, .6, .3), "paperslide": (3, .5, .3), "tap": (3, .1, .1), "poofs": (3, .6, .3), "drip": (3, .15, .15), "drone": (2, 1.6, .5)}   # dB, hold, release


def _speech_dip(lines, N, dip=.6, bridge=.5, ramp=.16):
    """The score's own sidechain on top of the mixer's duck: a gain that is 1 in the pauses and `dip` under dialogue (spans of speech closer than `bridge` seconds are one span, so a
    quick exchange does not pump), with smooth `ramp`-second edges. This is what makes the bed swell in the pauses and sit low under the voices."""
    from scipy.ndimage import uniform_filter1d
    m = np.zeros(N)
    merged = []
    for a, b in sorted((ln["s"] - .06, ln["e"] + .1) for ln in lines):
        if merged and a - merged[-1][1] < bridge:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    for a, b in merged:
        m[max(0, int(a * SR)):min(N, int(b * SR))] = 1.0
    k = int(ramp * SR) | 1
    m = uniform_filter1d(uniform_filter1d(m, k), k)
    return 1.0 - (1.0 - dip) * np.clip(m, 0, 1)


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
        if fn is cue_end7:
            fn(U, t0, sc["dur"], beats)
        else:
            fn(U, t0, sc["dur"], beats, D)
        for X in (U, D):
            X.gate(t0 + sc["dur"], t0 + sc["dur"] + 3.2, 0.0, .15)             # a cue's dry tail never bleeds into the next scene
        a, b = max(0, int((t0 - .05) * SR)), min(N, int((t0 + sc["dur"] + 3.2) * SR))
        wet, rt = REVERB13[sc["id"]]
        seg = hall(U.buf[:, a:b], wet=wet, rt=rt) + D.buf[:, a:b]
        e = int((t0 + sc["dur"]) * SR) - a                                      # the scene's last frame: the room's tail may ring on for a moment, then it is gone
        k = int(TAIL13[sc["id"]] * SR)
        if 0 < e < seg.shape[1]:
            seg[:, e:e + k] *= np.linspace(1, 0, min(k, seg.shape[1] - e))[None, :]
            seg[:, e + k:] = 0.0
        dips = DIPCACHE.setdefault(DIP13[sc["id"]], None)
        if dips is None:
            dips = DIPCACHE[DIP13[sc["id"]]] = _speech_dip(lines, N, DIP13[sc["id"]])
        out[:, a:b] += seg * LEVEL13[sc["id"]] * dips[a:b][None, :]
    out = out * MUSIC_GAIN * cue_dips(script, scenes, N, DIPS13)[None, :]
    for m in MUTES:
        out = _mute(out, *m)
    return out
