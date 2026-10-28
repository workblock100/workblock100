"""Episode 13 audio: a thin wrapper on the Episode 12 / 11 / 10 / 9 / 7 / 6 mixer, plus the sound effects only this episode needs.

Importing build_audio12 registers every earlier effect (Episodes 6 to 12) in the same registry (build_audio.SFX). This file adds the heist: a vault dial that coasts to a stop, a
heavy steel bolt, a record scratch, the blueprint hologram (glass, not metal), the call-light lasers in slow motion, a radio key-up, the creak of a door that has been shut since
2019 and a wall of call lights going off at once. A few existing names are redefined for this episode only (alarm, vmbeep, chair, doorclose, phonering, drone: see the end of the sfx section),
because the cue list asks for something the old sound cannot be: the registry is rebuilt in every process, so Episodes 6 to 12 are untouched.
It changes the defaults (script, output folder, timeline variable, music module) and runs the same loudness trim, peak limiter and AAC guard as Episodes 10 to 12.
Nothing is sampled: every sound is a few lines of numpy. The score (build_music13.py) shares two things with this file: the click times of the vault dial and the beats of the
slow-motion heart, so the music can lock to them.

Where a sound has a shape of its own inside its cue, it is written to the picture the scene builders committed to (scene-local seconds as of the last check; if a scene module changes
one of these, change the matching number here and rebuild):
  title  the dial clicks are build_music13.dial_times(), copied into ep13_title.js as DIAL_CLICKS (26 clicks, the 5th, 10th ... and the last heavy); the lock is at 2.4 s.
  plan   32 rooms light 0.028 s apart from the pips cue (ep13_plan.js PT().pips and age()), clockwise from the lobby: sfx_pips pans each pip to its room (_room_x).
  hall   the camera pulses (ep13_hall.js heartAt) are lubs at 0.30, 1.15 and 2.00 s and dubs 0.20 s after, into the lasers beat: HEART_BEATS / HEART_DUB; countdown beeps at 0.30, 0.55, 0.80.
  open   the far dome lights for 0 to 0.3 s and 0.5 to 0.9 s after the phonering cue and the phone's lamp blinks for 1.25 s (ep13_station.js ping, ep13_open.js phoneRing); the
         scene module starts them at scene time 0.25 but the cue lands at 0.45 (the open beat starts at 0.2): sfx_phonering is written for the cue.
  vault  the door eases open from 0.04 to 2.0 s after its cue (doorcreak); the tube flickers on at the chair cue +0.04, +0.18, +0.30 and stays on at +0.37 (chair); the wrapper is opened
         from +0.02 to +0.45 (wrapper); the bite is 0 to 0.2 s after the munch cue and the mouth shuts on the first chew at +0.55 (munch); the Q sign lands on 0 at the callcascade cue
         and 32 domes light 0.022 s apart, the left panel first, 4 x 4 each (callcascade); the door slams shut 0.02 s after its doorclose cue.

Usage: python3 build_audio13.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--out build/ep13_sound]
"""
import os
import sys

import numpy as np
from scipy import signal

import build_audio as BA
import build_audio6 as A6
import build_audio7 as A7
import build_audio9 as A9
import build_audio10 as A10
import build_audio12 as A12   # importing it registers every earlier effect (Episodes 6 to 12) in build_audio.SFX
from build_audio import SR, tarr, osc, ar, lp, midi
from build_audio6 import norm6, rng6, noise6, place2
from build_audio7 import _smooth_rand
from build_audio10 import _nth, _burst, _thump
from build_music13 import dial_times, dial_speed, HEART_BEATS, HEART_DUB


# ================================================================ helpers
def _fade_end(x, n):
    n = min(n, len(x))
    x[len(x) - n:] *= np.linspace(1, 0, n)
    return x


def _place(x, clip, at, g=1.0):
    j = int(round(at * SR))
    m = min(len(clip), len(x) - j)
    if j >= 0 and m > 0:
        x[j:j + m] += clip[:m] * g


def _edge(x, a=.002, r=.006):
    """A short linear fade at both ends of a clip (seconds), so nothing starts or stops on a click. Works on mono (n,) and stereo (2, n)."""
    x = np.array(x, dtype=float)
    n = x.shape[-1]
    na, nr = min(max(1, int(a * SR)), n), min(max(1, int(r * SR)), n)
    x[..., :na] *= np.linspace(0, 1, na)
    x[..., n - nr:] *= np.linspace(1, 0, nr)
    return x


def _lp4(x, fc, order=4):
    """A Butterworth low-pass in second-order sections (stable at low cut-offs, unlike the ba form)."""
    return signal.sosfilt(signal.butter(order, min(fc, SR * .49) / (SR / 2), "low", output="sos"), x)


def _hp4(x, fc, order=4):
    return signal.sosfilt(signal.butter(order, fc / (SR / 2), "high", output="sos"), x)


def _bp4(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo / (SR / 2), min(hi, SR * .49) / (SR / 2)], "band", output="sos"), x)


def _tv_filter(x, fc, q=1.0, kind="bp", block=96):
    """A resonant biquad whose centre or cut-off frequency moves while the signal runs (fc: a scalar or one value per sample; coefficients refreshed every `block` samples)."""
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


def _glide(f0, f1, d):
    """An exponential frequency path from f0 to f1 over d seconds (one value per sample)."""
    return f0 * (f1 / f0) ** np.linspace(0, 1, int(d * SR), endpoint=False)


def _sin_of(f):
    """A sine whose instantaneous frequency is the array f (Hz, per sample)."""
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def _glass(f, d, tau, a=.004, bright=1.0):
    """A struck-glass note: the fundamental, a faint inharmonic partial at 2.76x that dies fast and a soft octave, in a half-cosine attack so it never clicks."""
    t = tarr(d)
    x = np.sin(2 * np.pi * f * t) + .16 * bright * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / (tau * .35)) + .1 * np.sin(4 * np.pi * f * t) * np.exp(-t / (tau * .6))
    e = np.exp(-t / tau)
    na = max(2, int(a * SR))
    e[:na] *= .5 - .5 * np.cos(np.pi * np.arange(na) / na)
    return x * e


# ================================================================ sound effects (refined in the sound pass; the registration is at the end of this section)
def _dial_click(seed, heavy=False):
    """One tooth of the dial's ratchet, about 25 ms long: the pawl riding up the tooth (a tiny scrape), 5 to 7 ms later the drop into the notch (a hard tick and a small steel ping
    near 2.7 kHz) and the housing answering (a short knock near 400 Hz that a phone can play). Every tooth is a little different. `heavy` is a tooth with a number on it:
    lower, longer, with more body."""
    r = rng6(seed)
    d = .11 if heavy else .06
    t = tarr(d)
    n = len(t)
    pawl = _burst(seed, d, 3200, 9500, .0011) * .45
    gap = int(r.uniform(.0045, .0075) * SR)
    f = r.uniform(2400, 3100) * (.8 if heavy else 1.0)
    ping = np.sin(2 * np.pi * f * t) * np.exp(-t / .0065) + .38 * np.sin(2 * np.pi * f * 2.33 * t) * np.exp(-t / .0035)
    knock = _burst(seed + 500, d, 1500, 7000, .0016) * .9
    fb = r.uniform(340, 470) * (.72 if heavy else 1.0)
    body = np.sin(2 * np.pi * fb * t) * np.exp(-t / (.03 if heavy else .012)) * (.85 if heavy else .45)
    x = pawl.copy()
    x[gap:] += (ping * .8 + knock + body)[:n - gap]
    return x


def sfx_vaultdial():
    """A combination dial spun hard and left to coast: 26 ratchet clicks that stretch out as it slows (about 45 ms apart at first, 185 ms apart at the end and one long, final tick
    at 2.27 s), every fifth one a heavier tooth with a number on it, under a low servo whose note falls with the dial's speed (150 Hz to 50 Hz, a ripple on it, a thin gear whine
    on top) and dies as the dial stops. The click times are build_music13.dial_times(): the score ticks on them. Nothing sounds after 2.3 s, so the clunk at 2.4 lands in clean air."""
    d = 2.45
    n = int(d * SR)
    x = np.zeros(n)
    r = rng6(1302)
    ts = dial_times()
    for i, at in enumerate(ts):
        heavy = (i + 1) % 5 == 0 or i == len(ts) - 1
        amp = (.82 + .18 * (1 - i / len(ts))) * r.uniform(.88, 1.1) * (1.4 if heavy else 1.0)       # a slower tooth is a softer tick, but the riser is building, so only a little softer
        _place(x, _dial_click(1310 + i, heavy), at, amp)
    tt = tarr(d)
    sp = dial_speed(tt)
    f0 = 46 + 112 * sp
    ph = np.cumsum(f0) / SR
    servo = sum(a * np.sin(2 * np.pi * h * ph + p) for h, a, p in ((1, 1, 0), (2, .62, 1.1), (3, .4, 2.0), (4, .26, .4), (5, .16, 2.7), (7, .1, 1.6)))
    servo = servo * (.82 + .18 * np.sin(2 * np.pi * np.cumsum(f0 * 6) / SR)) + .14 * np.sin(2 * np.pi * np.cumsum(f0 * 9.4) / SR)
    servo = _lp4(servo, 1900, 2) * np.minimum(1, tt / .06) * sp ** .45
    x += servo / np.abs(servo).max() * .2
    return norm6(_edge(x, .0005, .004), .7)


def _bolt(f0, seed):
    """A smaller bolt sliding back: a quick strike and a short steel ring (three modes, 35 ms and less)."""
    d = .14
    t = tarr(d)
    ring = sum(a * np.sin(2 * np.pi * f0 * m * t + i) * np.exp(-t / tau) for i, (m, a, tau) in enumerate(((1.0, 1.0, .035), (2.3, .6, .025), (3.8, .4, .018))))
    return _burst(seed, d, 1200, 7000, .0018) * .9 + ring * .5


def sfx_clunk():
    """A steel bolt shot home. A hard strike (broadband, 2 ms) as the bolt end meets the keeper, the keeper housing ringing like a plate (five inharmonic modes between 640 Hz and
    5 kHz, the high ones dying first, so it is metal and not a drum), the door frame answering in the low mids (150 to 200 Hz, short, so a phone can play it without a boom) and,
    40 ms later, the second small knock of the bolt seating. The first call (the title: the vault dial locking) is the heavy one, with a longer ring and a low weight under it; the
    other two (the badge reader's locks) are lighter and a little higher. After the main hit the other bolts of the ring draw back, one after another (three small ones for the
    vault, two for each of the door's locks: six locks on two cues), each softer than the one before."""
    k = _nth("clunk")
    r = rng6(1320 + k)
    heavy = k == 0
    d = 1.0 if heavy else .6
    t = tarr(d)
    sh = r.uniform(.97, 1.04)
    if heavy:
        modes = ((640, 1.0, .11), (1480, .85, .08), (2390, .75, .06), (3500, .5, .04), (5000, .3, .03))
    else:
        modes = ((820, 1.0, .09), (1870, .8, .065), (3000, .65, .045), (4400, .4, .03))
    ring = sum(a * np.sin(2 * np.pi * f * sh * t + 1.7 * i + k) * np.exp(-t / tau) for i, (f, a, tau) in enumerate(modes))
    strike = _burst(1330 + k, d, 800, 8000, .0025) * 1.1 + _burst(1335 + k, d, 2500, 9500, .0009) * .5
    fb = 150 if heavy else 205
    body = np.sin(2 * np.pi * np.cumsum(fb * (1 + .2 * np.exp(-t / .02))) / SR) * np.exp(-t / (.05 if heavy else .03)) * (.4 if heavy else .3)
    x = strike + ring * (.7 if heavy else .65) + body
    seat = int(.04 * SR)                                              # the bolt seating: a smaller, lower knock
    tail = (_burst(1340 + k, d, 600, 5000, .003) * .55 + sum(a * np.sin(2 * np.pi * f * .74 * t + i) * np.exp(-t / (tau * .8)) for i, (f, a, tau) in enumerate(modes[:3])) * .35)[:len(x) - seat]
    x[seat:] += tail
    if heavy:
        x += np.sin(2 * np.pi * np.cumsum(_glide(74, 52, d)) / SR) * np.exp(-t / .16) * .22 * np.minimum(1, t / .004)
    for j, (at, f, g) in enumerate(((.13, 560, .5), (.205, 640, .42), (.275, 730, .34)) if heavy else ((.075, 900, .4), (.15, 1020, .3))):      # the other bolts of the ring drawing back, one after another
        _place(x, _bolt(f * r.uniform(.97, 1.03), 1345 + 10 * k + j), at, g)
    return norm6(_fade_end(x, int(.12 * SR)), .85)


def _scratch_source(seed):
    """The 'record' that gets scratched: a bar of dry funk (an A minor stab of saws that has a clear pitch to bend, a hat on every eighth), long enough to be read back and forth."""
    L = 1.4
    t = tarr(L)
    x = np.zeros(len(t))
    for m, a in ((45, .8), (57, 1.0), (64, .55), (69, .35)):
        f = midi(m)
        x += a * (2 * ((f * t) % 1) - 1) + a * .6 * (2 * ((f * 1.004 * t) % 1) - 1)
    x = _lp4(x, 3600, 2) * (.8 + .2 * np.sign(np.sin(2 * np.pi * 4.0 * t + 1)))
    for k in range(int(L / .125)):
        _place(x, _burst(seed + k, .03, 5500, 12000, .006), k * .125, .45)
    return x / np.abs(x).max()


def sfx_recscratch():
    """A record scratch, the music ripped off the turntable: the needle reads a bar of funk forwards and backwards. Two quick rubs, four strokes of 75 ms (forward, back, forward,
    back; each one speeds up and slows to nothing at the turn-around, 2.2 to 3.1 times normal speed, so the pitch climbs a fifth to an octave and a half and falls back through
    the turn), the level following the speed the way a cartridge does, and last the platter running down with a wobble. Surface noise rides on the speed. 0.42 s."""
    k = _nth("recscratch")
    src = _scratch_source(1341)
    d = .42
    n = int(d * SR)
    t = tarr(d)
    rate = np.zeros(n)
    sk = (1.0, 1.12, .88)[k % 3]                                   # the three scratches are the same gag by different hands: a little faster, a little slower
    for a, b, pk in ((0.0, .075, 2.5), (.075, .15, -3.1), (.15, .225, 2.2), (.225, .30, -2.8)):
        m = (t >= a) & (t < b)
        rate[m] = pk * sk * np.sin(np.pi * (t[m] - a) / (b - a)) ** 1.15
    m = t >= .30
    u = np.clip((t[m] - .30) / .12, 0, 1)
    rate[m] = (1 - u) ** 1.6 * (1 + .09 * np.sin(2 * np.pi * 9 * (t[m] - .30)))
    pos = (.42, .55, .33)[k % 3] * SR + np.cumsum(rate)
    y = np.interp(pos, np.arange(len(src)), src) * np.abs(rate) ** .75
    surf = _bp4(noise6(d, 1349 + k), 1800, 9000) * np.abs(rate) ** .5 * .2
    r = rng6(1345 + k)
    for _ in range(14):                                            # a few ticks of dust in the groove
        at = r.uniform(0, .3)
        _place(surf, _burst(int(at * 1e4) + k, .006, 2500, 9000, .0012), at, .5 * abs(rate[int(at * SR)]) ** .5)
    x = y + surf
    return norm6(_edge(x, .0004, .02), .75)


def sfx_holoon():
    """The hologram table powering up, glass and light. A projector hum swells and settles (64 to 110 Hz with four overtones, which is what a phone can play), a glassy sweep
    climbs from 300 Hz to 1.5 kHz on its first three harmonics, and the lattice arrives: E, B, E and G sharp in struck-glass sines, a little apart, over a faint bloom of air. Soft
    attacks everywhere, nothing above 4 kHz that is not a quiet glint. 0.8 s."""
    d = .8
    n = int(d * SR)
    t = tarr(d)
    x = np.zeros(n)
    f = 62 + 46 * np.minimum(1, t / .3)
    ph = np.cumsum(f) / SR
    hum = (np.sin(2 * np.pi * ph) + .6 * np.sin(4 * np.pi * ph) + .38 * np.sin(6 * np.pi * ph) + .2 * np.sin(8 * np.pi * ph)) * np.interp(t, [0, .17, .36, .62], [0, 1, .5, 0])
    x += .3 * hum
    rd = .44
    g = _glide(300, 1500, rd)
    p1 = np.cumsum(g) / SR
    rise = (np.sin(2 * np.pi * p1) + .4 * np.sin(4 * np.pi * p1) + .2 * np.sin(6 * np.pi * p1)) * np.sin(np.pi * np.linspace(0, 1, len(g))) ** 1.6
    _place(x, rise, .02, .3)
    for i, (fq, a) in enumerate(((1319, 1.0), (1976, .8), (2637, .7), (3322, .42))):
        _place(x, _glass(fq, .5, .14), .30 + i * .05, a * .5)
    x += _bp4(noise6(d, 1350), 3500, 8000) * np.interp(t, [0, .25, .45, .75], [0, .5, 1, 0]) * .05
    return norm6(_edge(x, .001, .03), .55)


def sfx_holoblip():
    """A small interface blip, clean and glassy: two struck-glass sines a fifth apart (the second 55 ms after the first), about 0.2 s. Seven of them: they walk between E6, F sharp and
    G sharp so they do not repeat like a machine; the last one (the Q word's card) turns a tritone down, an uneasy pair instead of a bright one."""
    k = _nth("holoblip")
    if k == 6:
        a, b = 1760.0, 1245.0
    else:
        a = (1319.0, 1480.0, 1661.0)[k % 3]
        b = a * 1.5
    d = .26
    x = np.zeros(int(d * SR))
    _place(x, _glass(a, .2, .032), 0)
    _place(x, _glass(b, .2, .042), .055, .75)
    return norm6(_edge(x, .0005, .01), .36)


def _room_x(n):
    """Centre x, in plan pixels (the building is 908 wide), of room n = 1..32 on the briefing plan (ep13_plan.js PG.rooms): they are numbered clockwise from the lobby, 1-4 along the
    south-west row, 5-11 up the west column, 12-21 along the north row, 22-28 down the east column and 29-32 back along the south-east row."""
    if n <= 4:
        return -102.0 - 68.0 * (n - .5)
    if n <= 11:
        return -414.0
    if n <= 21:
        return -374.0 + 68.0 * (n - 12 + .5)
    if n <= 28:
        return 414.0
    return 374.0 - 68.0 * (n - 29 + .5)


def sfx_pips():
    """Thirty-two rooms lighting up on the plan: 32 glass pips in four runs of eight up a major pentatonic (each run a whole step higher), a little louder as they go, and a longer
    glint on the last one. They fall 28 ms apart, on the plan's own room lights (room n lights 0.028 (n - 1) s after the cue), and each is panned to where its room is on the plan,
    so the ear follows the ring: out to the left along the south-west row, up the west side, across the north row to the right, down the east side and home along the south-east
    row to the middle. Stereo."""
    d = 1.45
    n = int(d * SR)
    out = np.zeros((2, n))
    r = rng6(1352)
    pent = (1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2)
    for i in range(32):
        row, col = divmod(i, 8)
        f = 880 * pent[col] * 2 ** (row * 2 / 12)
        at = .004 + i * .028
        place2(out, _glass(f, .09, .014, .0015, .6), at, (.38 + .5 * i / 31) * r.uniform(.85, 1.0), .8 * _room_x(i + 1) / 454.0)
    last = .004 + 31 * .028
    place2(out, _glass(3520, .5, .16, .002), last, .45, .8 * _room_x(32) / 454.0)
    place2(out, _glass(5274, .4, .09, .002), last + .012, .22, .8 * _room_x(32) / 454.0 + .1)
    return norm6(_edge(out, .0004, .04), .36)


def sfx_holooff():
    """The hologram collapsing: the glass sweep falls from 1.5 kHz to 240 Hz while a scatter of pixels dissolves (glass pings that thin out and sag in pitch), a soft static
    sizzle dies away and the projector's power drops out with a low 'thup'. 0.5 s, and it ends on silence."""
    d = .5
    n = int(d * SR)
    t = tarr(d)
    x = np.zeros(n)
    g = _glide(1500, 240, d)
    p1 = np.cumsum(g) / SR
    x += (np.sin(2 * np.pi * p1) + .4 * np.sin(4 * np.pi * p1)) * np.exp(-t / .14) * np.minimum(1, t / .004) * .55
    r = rng6(1360)
    for i in range(14):
        _place(x, _glass(r.uniform(2000, 5200) * (1 - .35 * i / 14), .12, .02, .001), .02 + (i / 14) ** 1.4 * .34, r.uniform(.15, .4) * (1 - i / 18))
    x += _bp4(noise6(d, 1361), 2500, 9000) * np.exp(-t / .07) * .07
    _place(x, np.sin(2 * np.pi * np.cumsum(_glide(110, 48, .16)) / SR) * np.exp(-tarr(.16) / .05), .30, .55)
    return norm6(_edge(x, .001, .08), .5)


def sfx_cardslam():
    """A crew card slammed on a table: the flat slap of stiff card (700 Hz to 6 kHz, 8 ms), a bright snap on top, the table answering (a wood knock at 190 Hz and its first
    overtone), a short weight underneath (150 Hz sagging to 78 Hz, which a phone can play), a puff of displaced air and two small settling ticks. Seven slightly different ones."""
    k = _nth("cardslam")
    r = rng6(1340 + k)
    d = .36
    t = tarr(d)
    slap = _burst(1341 + k, d, 700, 6500, .0075) * 2.4
    snap = _burst(1342 + k, d, 3000, 9000, .0014) * 1.0
    f1 = 200 * r.uniform(.94, 1.06)
    knock = (np.sin(2 * np.pi * f1 * t) * np.exp(-t / .04) + .7 * np.sin(2 * np.pi * f1 * 2.17 * t) * np.exp(-t / .025) + .35 * np.sin(2 * np.pi * f1 * 3.4 * t) * np.exp(-t / .015)) * .5
    weight = _sin_of(_glide(150, 78, d)) * np.exp(-t / .06) * .34
    puff = _lp4(noise6(d, 1343 + k), 1400, 2) * np.exp(-t / .035) * .3
    x = slap + snap + knock + weight + puff
    for j, (at, g) in enumerate(((.058, .13), (.11, .08))):
        _place(x, _burst(1344 + 7 * k + j, .02, 900, 4500, .004), at, g)
    return norm6(_edge(x, .0004, .08), .8)


def sfx_laserhum():
    """A red beam humming, taut: the mains buzz of the emitters (a rectified 60 Hz sine, so 120 Hz and every even harmonic, rounded off at 2.2 kHz), a thin 'wire' under tension
    (noise through a feedback comb tuned to 412 Hz, so it rings like a plucked string that never settles), and two whines 60 Hz apart near 2.4 kHz that beat. It swells in over
    0.3 s, shivers at 6.5 Hz and lets go over the last half second. 1.5 s."""
    d = 1.5
    t = tarr(d)
    mains = np.abs(np.sin(2 * np.pi * 60 * t * (1 + .002 * np.sin(2 * np.pi * .9 * t))))
    mains = _lp4(mains - mains.mean(), 2200, 2)
    L = int(round(SR / 412))
    a = np.zeros(L + 1)
    a[0], a[L] = 1.0, -.975
    wire = _bp4(signal.lfilter([1.0], a, _bp4(noise6(d, 1391), 250, 3500)), 300, 2200)
    whine = np.sin(2 * np.pi * 2431 * t + .5 * np.sin(2 * np.pi * .4 * t)) + np.sin(2 * np.pi * 2491 * t)
    swell = np.interp(t, [0, .32, 1.0, 1.5], [0, 1, .85, 0]) * (1 + .1 * np.sin(2 * np.pi * 6.5 * t))
    x = _lp4((mains / np.abs(mains).max() * .55 + wire / np.abs(wire).max() * .26 + whine * .07) * swell, 3200, 2)
    return norm6(x, .32)


def sfx_laserpass():
    """A beam sliding through a body in slow motion: a buzzing sawtooth (150 Hz sagging to 90 Hz) through a resonant band that sweeps down from 3.6 kHz to 400 Hz, the zap, with a
    spit of sparks at the touch, a 60 Hz sizzle, a weight underneath and a low-pass that closes as the tape drags. 0.7 s; the three passes differ a little."""
    k = _nth("laserpass")
    d = .7
    n = int(d * SR)
    t = tarr(d)
    f0 = 150 * (.6 ** (t / d)) * (1 + .03 * k)
    saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1
    zap = _tv_filter(saw, 3600 * (.11 ** np.minimum(t / .5, 1)), 5.5, "bp")
    zap = zap / np.abs(zap).max() * np.minimum(1, t / .003) * np.exp(-t / .17)
    spark = _burst(1400 + k, d, 2000, 9000, .0018) * .55
    sizzle = _hp4(noise6(d, 1405 + k), 4000, 2) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 60 * t))) * np.exp(-t / .06) * .2
    weight = _sin_of(_glide(130, 50, d)) * np.exp(-t / .12) * .4
    x = _tv_filter(zap + spark + sizzle + weight, 7000 * (.1 ** (t / d)), .7, "lp")
    return norm6(_edge(x, .0005, .05), .5)


def _hb_thump(f0, f1, d, tau, seed, knock=.5):
    """One half of a heartbeat heard through a chest: a sine that sags from f0 to f1, a little saturation (the harmonics a phone speaker can play) and a muffled knock."""
    t = tarr(d)
    body = np.sin(2 * np.pi * np.cumsum(_glide(f0, f1, d)) / SR) * np.exp(-t / tau)
    body = np.tanh(3.2 * body) / np.tanh(3.2)
    thump = _lp4(noise6(d, seed), 480, 2) * np.exp(-t / (tau * .5)) * knock
    return _edge(body + thump, .003, .02)


def sfx_heartbeat():
    """Three heartbeats in slow motion, muffled (nothing above 560 Hz), each lub-dub longer and lower than the one before as if the tape were dragging. They fall 0.85 s apart, on the
    hall's camera pulses (lubs 0.30, 1.15, 2.00 s into the lasers beat, dubs 0.20 s after; build_music13.HEART_BEATS, and the score pulses on them): the lub is a 100 Hz thump that
    sags to 54 Hz, the dub a shorter, higher one, with a breath of blood between them."""
    d = 3.0
    n = int(d * SR)
    x = np.zeros(n)
    for i, (at, s) in enumerate(HEART_BEATS):
        _place(x, _hb_thump(100 / s, 54 / s, .27 * s, .06 * s, 1410 + i), at, 1.0)
        dub_at = at + HEART_DUB
        _place(x, _hb_thump(130 / s, 70 / s, .2 * s, .045 * s, 1420 + i), dub_at, .66)
        w = int(HEART_DUB * s * SR)
        sw = _lp4(noise6(HEART_DUB * s, 1430 + i), 220, 2) * np.hanning(w) * .1
        _place(x, sw, at + .03 * s, 1.0)
    x = _lp4(x, 560, 3)
    return norm6(_edge(x, .004, .15), .7)


def sfx_beep3():
    """Three countdown beeps, the way a watch syncs: G6, G6, then C7 (a fourth up), 105 ms each, 250 ms apart. A sine with its octave and twelfth at low level, soft edges, nothing
    above 7 kHz."""
    k = _nth("beep3")
    x = np.zeros(int(.9 * SR))
    for i, f in enumerate((1568.0, 1568.0, 2093.0)):
        d = .105
        t = tarr(d)
        tone = (np.sin(2 * np.pi * f * t) + .24 * np.sin(2 * np.pi * 2 * f * t) + .1 * np.sin(2 * np.pi * 3 * f * t)) * ar(d, .004, .014)
        _place(x, tone, i * .25, 1.0 if i < 2 else 1.1)
    return norm6(_lp4(x, 7000, 2), .5)


def sfx_freezesnap():
    """A freeze-frame: a camera shutter (the mirror slap, the curtain opening and, 42 ms later, closing), a glassy 'shing' of the flash and a short falling whoosh as the picture
    stops. The snap is in the first 5 ms, so it lands on the word it is cued to."""
    k = _nth("freezesnap")
    r = rng6(1350 + k)
    d = .55
    n = int(d * SR)
    t = tarr(d)
    x = np.zeros(n)
    _place(x, _burst(1351 + k, .05, 500, 3200, .008) * .9 + _thump(260, 150, .05, .014) * .5, 0.0)
    _place(x, _burst(1352 + k, .02, 2500, 11000, .0015) * .8, .002)
    _place(x, _burst(1353 + k, .02, 2000, 10000, .0018) * .65, .044)
    _place(x, _glass(r.uniform(3900, 4400), .35, .09, .002) * .14, .006)
    wh = _tv_filter(noise6(d, 1354 + k), 5000 * (.12 ** np.minimum(t / .35, 1)), 1.4, "bp")
    wh = wh / np.abs(wh).max() * np.minimum(1, t / .006) * np.exp(-t / .09)
    x += wh * .3
    return norm6(_edge(x, .0003, .12), .6)


def sfx_radioclick():
    """A radio key-up: the click of the key, then a 50 ms squelch of carrier hiss in the telephone band (450 Hz to 3.3 kHz) that opens fast and closes down, with a couple of
    crackles in it. Nine of them, each a little different."""
    k = _nth("radioclick")
    r = rng6(1370 + k)
    d = .06
    n = int(d * SR)
    t = tarr(d)
    key = _burst(1371 + k, d, 500, 2600, .002) * 1.0
    hiss = _bp4(noise6(d, 1372 + k), 450, 3300, 2) * np.interp(t, [0, .002, .018, .056], [0, 1, .6, 0]) * .55
    x = key + hiss
    for _ in range(2):
        at = r.uniform(.008, .04)
        _place(x, _burst(int(at * 1e5) + k, .006, 1000, 3300, .0012), at, r.uniform(.3, .55))
    return norm6(_edge(_bp4(x, 320, 3300, 3), .0003, .012), .5)


def sfx_doorcreak():
    """A door that has not moved since 2019: a long, rusty creak. The hinge is a stick-slip oscillator whose rate IS the pitch, and the pitch wanders (90 to 330 Hz, up, down, hesitating
    and up again); every stick-slip cycle is a little different in strength, which is the rust. It is shaped by four wooden-hinge resonances (430, 900, 1.5 kHz and 2.2 kHz) and
    closed off at 2.8 kHz so it can never go shrill. The door moves in pushes: it is loudest and highest while the picture's door is moving fastest (0.9 to 1.15 s after the cue; the
    vault scene eases it open from 0.04 to 2.0 s), with only a shallow hesitation at 1.3 s; a crack at the start (the seal breaking, a sprinkle of dust) and a soft wooden knock at
    2.1 s where it reaches its stop. 2.35 s."""
    d = 2.35
    n = int(d * SR)
    t = tarr(d)
    r = rng6(1380)
    knots_t = [0, .12, .45, .95, 1.25, 1.55, 1.95, 2.3]
    knots_f = [90, 150, 215, 330, 205, 150, 270, 118]
    f = np.interp(t, knots_t, knots_f) * (1 + .09 * _smooth_rand(d, 1381, 7) + .02 * _smooth_rand(d, 1382, 55) + .045 * _smooth_rand(d, 1388, 180))
    ph = np.cumsum(f) / SR
    cyc = np.floor(ph).astype(int)
    ragged = r.uniform(.55, 1.0, cyc.max() + 2)[cyc]
    saw = (2 * (ph % 1) - 1) * ragged
    body = _bp4(saw, 330, 560) + .9 * _bp4(saw, 700, 1150) + .5 * _bp4(saw, 1250, 1800) + .22 * _bp4(saw, 1900, 2600)
    u = np.interp(t, [0, .45, .95, 1.25, 1.55, 1.95, 2.3], [.1, .45, .9, .4, .2, .7, .15])
    sq = _tv_filter(saw, 620 + 1100 * u, 6.5, "bp")                  # a resonance that slides up and down: the 'eee' in a creak
    body = body / np.abs(body).max() * .7 + sq / np.abs(sq).max() * .55
    body = _lp4(body, 2800, 3)
    move = np.interp(t, [0, .06, .3, .62, .95, 1.15, 1.3, 1.6, 1.8, 2.05, 2.2], [0, .85, .6, .9, 1.0, 1.0, .55, .8, .6, .3, 0])
    move = move * (.85 + .15 * _smooth_rand(d, 1383, 9))
    x = body / np.abs(body).max() * move
    x += _bp4(noise6(d, 1384), 1200, 4500) * move * .1
    crack = _burst(1385, .3, 900, 5000, .004) * .9 + _thump(150, 90, .3, .04) * .6
    _place(x, crack, 0.0, .55)
    _place(x, _bp4(noise6(.4, 1386), 2000, 6500) * np.exp(-tarr(.4) / .1), .02, .09)
    knock = np.sin(2 * np.pi * 190 * tarr(.3)) * np.exp(-tarr(.3) / .03) + _burst(1387, .3, 700, 3500, .006)
    _place(x, knock, 2.1, .4)
    return norm6(_edge(x, .001, .04), .55)


def sfx_wind():
    """A cold draught under a door: two decorrelated channels of noise through a narrow band that drifts between about 300 and 800 Hz (the draught itself), a thinner band that
    drifts between 800 and 1.7 kHz (a faint whistle at the edge of the door), a little low rumble, and a slow breathing in the level (0.43 Hz). Stereo, 2.2 s."""
    d = 2.2
    n = int(d * SR)
    t = tarr(d)
    out = np.zeros((2, n))
    for ch in (0, 1):
        src = noise6(d, 1390 + ch)
        fc1 = 520 + 220 * _smooth_rand(d, 1392 + ch, 1.1) + 60 * np.sin(2 * np.pi * .37 * t)
        b1 = _tv_filter(src, fc1, 3.0, "bp")
        fc2 = 1250 + 450 * _smooth_rand(d, 1396 + ch, .9)
        b2 = _tv_filter(src, fc2, 9.0, "bp")
        low = _lp4(src, 260, 2)
        x = b1 / (np.std(b1) + 1e-9) + .55 * b2 / (np.std(b2) + 1e-9) + .35 * low / (np.std(low) + 1e-9)
        out[ch] = _lp4(x, 3000, 2) * (.55 + .45 * (.5 + .5 * np.sin(2 * np.pi * .43 * t + ch))) * ar(d, .45, .7)
    return norm6(out, .35)


def sfx_drip():
    """One drop in a tiled, shut room. A drop's 'plink' is a bubble, so its pitch climbs (520 Hz to 1.5 kHz in 25 ms) and dies in 90 ms, with a tick of splash on top; the room
    gives it back twice, duller each time (0.23 s and 0.47 s). 0.8 s."""
    d = .8
    n = int(d * SR)
    t = tarr(.25)
    f = 520 + 980 * (1 - np.exp(-t / .012))
    drop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .035) * np.minimum(1, t / .002)
    drop = drop + .5 * _burst(1401, .25, 2000, 7500, .0015)
    x = np.zeros(n)
    _place(x, drop, 0.0, 1.0)
    _place(x, _lp4(drop, 2200, 2), .23, .3)
    _place(x, _lp4(drop, 1400, 2), .47, .11)
    return norm6(_edge(x, .0003, .06), .35)


def sfx_gasp():
    """Several people drawing breath at once: five (then four) open-mouthed inhalations, each noise shaped by its own three vowel resonances (the first near 520 to 760 Hz, the second
    near 1.1 to 1.5 kHz, the third near 2.3 to 3.1 kHz, with a little sibilance), a fast rise and a catch at the end. The first call (the beams find Brenda) is sharp and a
    startled squeak rides on it; the second (she asks if someone is covering) is slower, softer and more awed."""
    k = _nth("gasp")
    r = rng6(1400 + k)
    d = .62
    n = int(d * SR)
    x = np.zeros(n)
    voices = 5 if k == 0 else 4
    for v in range(voices):
        L = r.uniform(.2, .3) * (1.0 if k == 0 else 1.2)
        att = (r.uniform(.035, .06) if k == 0 else r.uniform(.07, .11))
        src = noise6(.4, 1410 + 10 * k + v)
        f1, f2, f3 = r.uniform(520, 760), r.uniform(1100, 1500), r.uniform(2300, 3100)
        form = _bp4(src, f1 * .85, f1 * 1.15) + .8 * _bp4(src, f2 * .88, f2 * 1.12) + .5 * _bp4(src, f3 * .9, f3 * 1.1)
        broad = _bp4(src, 450, 5200, 2)
        sib = _bp4(src, 5000, 8500, 2)
        y = .6 * form / (np.std(form) + 1e-9) + .55 * broad / (np.std(broad) + 1e-9) + .1 * sib / (np.std(sib) + 1e-9)
        tt = tarr(.4)
        env = np.interp(tt, [0, att, L * .8, L, L + (.035 if k == 0 else .06)], [0, 1, .9, .5, 0])
        _place(x, y * env, r.uniform(0, .06), r.uniform(.6, 1.0) / voices ** .5)
    if k == 0:
        sq = _sin_of(_glide(640, 980, .08)) * np.hanning(int(.08 * SR))
        _place(x, sq, .12, .09)
    return norm6(_edge(x, .003, .03), .45 if k == 0 else .38)


def sfx_bonecreak():
    """An old prune standing up, all of it dry wood and no wet (nothing under 400 Hz). A stiff 'tk' of the knee, then a rising creak in three short squeals (a stick-slip saw gliding
    150 to 330 Hz through a 650 Hz to 2.3 kHz wooden-hinge resonance, each squeal a little higher), then the back going: three pops 4 ms apart that ring at 840 Hz, a second quick pair, and last a small rubber
    squeak, like a shoe, as she gets upright. 1.25 s."""
    d = 1.25
    n = int(d * SR)
    t = tarr(d)
    r = rng6(1415)
    x = np.zeros(n)

    def pop(at, f, g, tau=.018):
        _place(x, _burst(int(at * 1e4) + 1416, .03, 700, 3500, .0035) * .9, at, g)
        tt = tarr(.08)
        _place(x, np.sin(2 * np.pi * f * tt * (1 + .12 * np.exp(-tt / .008))) * np.exp(-tt / tau), at, g * .6)

    pop(0.0, 560, .5, .014)
    for j, (at, dur, f0, f1) in enumerate(((.08, .16, 150, 230), (.27, .15, 190, 290), (.45, .12, 240, 330))):
        ff = _glide(f0, f1, dur) * (1 + .03 * _smooth_rand(dur, 1417 + j, 90))
        ph = np.cumsum(ff) / SR
        sw = (2 * (ph % 1) - 1) * r.uniform(.55, 1.0, int(ph.max()) + 3)[ph.astype(int)]
        sq = _bp4(sw, 650, 1300) + .6 * _bp4(sw, 1400, 2300)
        _place(x, sq / np.abs(sq).max() * np.hanning(len(sq)) ** .8, at, .5)
    for j, at in enumerate((.56, .564, .572)):
        pop(at, 840, 1.0 if j == 0 else .6, .02)
    pop(.70, 620, .55, .016)
    pop(.745, 700, .45, .016)
    sq = _sin_of(_glide(760, 1500, .14) * (1 + .02 * np.sin(2 * np.pi * 35 * tarr(.14)))) * np.hanning(int(.14 * SR))
    _place(x, sq, .93, .13)
    return norm6(_edge(_hp4(x, 380, 2), .0005, .05), .6)


def sfx_dust():
    """A cloud of dust shaken out of a pair of scrubs: a soft 'fwuff' (low-passed noise at 1.8 kHz that opens in 30 ms and falls over a quarter of a second, a cloth-flap thump
    under it) and a haze of fine grains that go on a moment longer. Two decorrelated channels, so the cloud is wide. 0.7 s."""
    d = .7
    n = int(d * SR)
    t = tarr(d)
    out = np.zeros((2, n))
    r = rng6(1430)
    for ch in (0, 1):
        puff = _lp4(noise6(d, 1431 + ch), 1800, 2) * np.exp(-t / .13) * np.minimum(1, t / .03)
        puff = puff / np.abs(puff).max() * .9
        flap = _sin_of(_glide(130, 80, d)) * np.exp(-t / .03) * .3
        grains = np.zeros(n)
        for _ in range(60):
            at = r.uniform(.02, .6) ** 1.0
            _place(grains, _burst(int(at * 1e5) + 17 * ch, .008, 3500, 9500, .0018), at, r.uniform(.05, .3) * np.exp(-at / .3))
        out[ch] = puff + flap + grains
    return norm6(_edge(out, .002, .12), .32)


STEP_TIMES = (.176, .293, .381, .464, .563, .710)   # Brenda's six footfalls in the finished picture, seconds after the steps cue (build/ep13/events.json: 21.226 ... 21.760 s into the vault scene, cue at 21.05 s)


def sfx_steps():
    """Brenda shuffling out in her slippers after five years. The animation lays its own soft footfall on each of her six small steps (events.json: 0.18, 0.29, 0.38, 0.46, 0.56 and
    0.71 s after this cue; the build turns those down to about half), so this sound does not step on its own: it is what a worn slipper adds to each of those footfalls, so the two
    are one sound and never two walkers. Each step is the sole dragging forward over the vinyl for the 100 ms before it lands (a soft scuff, 450 Hz to 2.3 kHz, swelling), a small
    low pat at the landing (140 Hz sagging to 95 Hz and a puff of 800 Hz noise), each a little duller than the one before, and under them all the swish of a long cardigan swinging
    with the walk. Stereo, nearly central like the footsteps (the picture is a view from the back of the room), 1.1 s."""
    d = 1.1
    n = int(d * SR)
    t = tarr(d)
    out = np.zeros((2, n))
    for i, f in enumerate(STEP_TIMES):
        dd = .1
        drag = _bp4(noise6(dd, 1441 + i), 450, 2300 - 150 * i) * np.interp(tarr(dd), [0, .035, .085, .1], [0, .7, 1.0, 0])
        pat = _thump(140, 95, .08, .02) * .5 + _lp4(noise6(.08, 1450 + i), 800, 2) * np.exp(-tarr(.08) / .012) * .5
        clip = np.zeros(int(.2 * SR))
        _place(clip, drag, 0.0)
        _place(clip, pat, dd - .005)
        place2(out, _lp4(clip, 4200 - 200 * i, 2), f - dd + .005, 1.0 - .07 * i, .04 * (i - 2))
    sw = _bp4(noise6(d, 1460), 700, 2600) * np.interp(t, [0, .12, .4, .8, 1.1], [0, .5, .9, .6, 0]) * (.6 + .4 * np.sin(2 * np.pi * 8.5 * t)) * .22
    out += np.stack([sw, np.roll(sw, 90)])
    return norm6(_edge(out, .002, .1), .4)


def sfx_wrapper():
    """A granola bar wrapper, opened to the picture (the vault scene unwraps it from 0.02 to 0.45 s after the cue and lifts it to her mouth, so it is all over by 0.6 s): film crinkle is
    a dense, irregular rain of tiny fractures (0.8 to 3.5 ms each, 2 to 11 kHz, each its own band), which come in four gestures: a squeeze as she grips it, a smaller turn, and the
    long tearing open (the densest, loudest, brightest, 0.25 to 0.45 s), then the last rustle of the foil peeling back. About 300 crackles in 0.6 s, with a soft rustle underneath."""
    d = .7
    n = int(d * SR)
    t = tarr(d)
    r = rng6(1450)
    x = np.zeros(n)
    for s, L, dens, lv in ((.00, .11, 260, .5), (.13, .09, 200, .38), (.25, .20, 520, 1.0), (.48, .09, 170, .3)):
        for i in range(int(L * dens)):
            at = s + r.uniform(0, L)
            lo = r.uniform(2200, 4500)
            hi = min(lo * r.uniform(1.8, 2.6), 11000)
            _place(x, _burst(int(at * 1e5) + i, .012, lo, hi, r.uniform(.0008, .0035)), at, lv * r.uniform(.15, 1.0) ** 1.6)
    env = np.interp(t, [0, .03, .1, .13, .22, .25, .4, .46, .57, .62, .7], [0, .5, .5, .3, .3, .5, 1, .6, .3, .1, 0])
    x += _bp4(noise6(d, 1455), 900, 3500) * env * .06
    return norm6(_edge(x, .001, .05), .4)


def sfx_munch():
    """One satisfying bite of a granola bar, to the picture (in the vault scene the bar reaches her mouth at the cue, the bite takes 0.2 s, and the first chew opens her mouth at 0.2 s and
    shuts it at 0.55 s): the teeth meet at 0.05 s with a crisp crack (1.2 to 6.5 kHz, 3.5 ms), the bar gives way in a dozen small fractures over the next 100 ms, the jaw closes (a
    muffled 190 Hz 'mmp' through the skull) and, at 0.55 s as her mouth shuts again, the first small chew. 0.8 s."""
    k = _nth("munch")
    r = rng6(1470 + k)
    d = .8
    n = int(d * SR)
    x = np.zeros(n)
    b = .05                                                           # the bite
    _place(x, _burst(1471 + k, .03, 1200, 6500, .0035) * 1.0, b)
    at = b + .004
    for i in range(14):
        at += r.uniform(.004, .011)
        _place(x, _burst(1480 + 20 * k + i, .02, r.uniform(1400, 2600), r.uniform(4000, 7500), r.uniform(.002, .005)), at, (1 - i / 18) * r.uniform(.3, 1) * .8)
    _place(x, np.sin(2 * np.pi * np.cumsum(_glide(190, 130, .1)) / SR) * np.exp(-tarr(.1) / .035), b + .06, .3)
    c = .55                                                           # the first chew
    _place(x, _burst(1500 + k, .03, 1500, 5000, .004) * .4, c)
    for j in range(5):
        _place(x, _burst(1510 + j, .012, 1800, 4800, .002), c + .005 + j * .008, .22 * r.uniform(.4, 1))
    _place(x, np.sin(2 * np.pi * np.cumsum(_glide(170, 120, .08)) / SR) * np.exp(-tarr(.08) / .03), c + .01, .15)
    return norm6(_edge(x, .0003, .08), .5)


def _call_ding(f, tau, ratio_dong=0.0):
    """A call-light chime (the series' own: a sine with the 2.76x and 5.4x bell partials, the high ones dying faster, as in the old a_call); `ratio_dong` > 0 adds the lower
    second note of a 'ding-dong' 0.12 s later."""
    d = .6
    t = tarr(d)
    x = (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / (tau * .45)) + .2 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / (tau * .22))) * np.exp(-t / tau)
    x = x * np.minimum(1, t / .002)
    if ratio_dong:
        _place(x, _call_ding(f * ratio_dong, tau * .9), .12, .8)
    return x


def sfx_callcascade():
    """Every call light in the building at once, as a stereo return, played to the picture: the vault scene lights its 32 domes one every 22 ms (two panels of 4 x 4 either side of the
    door, the left panel first, each row left to right), so there are 32 call-light chimes 22 ms apart, each panned to where its dome hangs (-0.76 to -0.36 for the left panel, +0.36
    to +0.76 for the right), the four columns a rising run of notes and every row a step higher than the one before, louder as the building catches fire; first a clack as the Q sign's
    digits land on 0. From 0.5 s a wall of 110 more small ones and a bright wash of chime noise piles on, peaks about 0.7 s and dies away by 1.3 s (low-passed as it goes) so that the
    next line, a second later, is clear. Stereo, 1.6 s."""
    d = 1.6
    n = int(d * SR)
    t = tarr(d)
    out = np.zeros((2, n))
    r = rng6(1490)
    pitches = (659.0, 740.0, 880.0, 988.0, 1175.0, 1319.0, 1568.0, 1760.0)
    for i in range(32):
        panel, j = divmod(i, 16)
        row, col = divmod(j, 4)
        wx = (-450.0 if panel == 0 else 160.0) + 72.5 * (col + .5)              # the dome's x on the wall (world units, the room is 920 wide)
        f = pitches[min(7, col + row + panel)]
        place2(out, _call_ding(f, r.uniform(.13, .2)), .002 + i * .022, (.34 + .5 * i / 31) * r.uniform(.85, 1.0), .85 * wx / 460.0)
    clack = _burst(1495, .05, 1200, 6500, .0015) * .8 + np.sin(2 * np.pi * 310 * tarr(.05)) * np.exp(-tarr(.05) / .012) * .6
    place2(out, clack, 0.0, .5, 0.0)
    for i in range(110):
        at = .5 + r.uniform(0, .3)
        f = pitches[int(r.integers(0, 8))] * (2 if r.random() < .15 else 1)
        place2(out, _call_ding(f, r.uniform(.08, .16)), at, r.uniform(.1, .32), r.uniform(-1, 1))
    wash = np.stack([_bp4(noise6(d, 1491 + c), 3000, 9000) for c in (0, 1)]) * np.interp(t, [0, .45, .7, 1.1], [0, .4, 1, 0]) * .1
    out += wash
    master = np.interp(t, [0, .62, .72, 1.0, 1.3, 1.6], [1, 1, 1, .26, .04, 0])
    out = out * master
    out[0] = _tv_filter(out[0], 9000 * (.2 ** np.clip((t - .7) / .6, 0, 1)), .7, "lp")
    out[1] = _tv_filter(out[1], 9000 * (.2 ** np.clip((t - .7) / .6, 0, 1)), .7, "lp")
    return norm6(_edge(out, .001, .05), .7)


# ---------------------------------------------------------------- names redefined for this episode only (the cue list needs something else under these names)
def sfx_alarm():
    """The building's alarm panel (replaces the old 3.4 s siren for this episode): a two-tone electronic warble, 740 and 988 Hz alternating every 0.11 s, a sine with a little square
    in it, rounded off at 2.4 kHz so it is not harsh, that holds for half a second and dies away by 1.1 s, so it is gone when the next line begins."""
    d = 1.1
    t = tarr(d)
    ph = (t / .11).astype(int) % 2
    f = np.where(ph == 0, 740.0, 988.0)
    s1 = np.sin(2 * np.pi * np.cumsum(f) / SR)
    x = _lp4(np.sign(s1) * .25 + s1, 2400, 2)
    x = x * np.interp(t, [0, .01, .5, 1.1], [0, 1, .85, 0])
    return norm6(_edge(x, .002, .08), .55)


def sfx_vmbeep():
    """The badge reader says yes (replaces the old voicemail beep for this episode): the relay's tick, then two bright digital notes going up, G6 then C7, a triangle wave with a
    hint of its octave, 85 ms and 230 ms, the last one ringing out softly. Green light, 0.45 s."""
    d = .45
    n = int(d * SR)
    x = np.zeros(n)
    _place(x, _burst(1521, .01, 1500, 6000, .002) * .7, 0.0)
    for at, f, dd, tau in ((.012, 1568.0, .085, .09), (.1, 2093.0, .34, .12)):
        t = tarr(dd)
        tri = 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
        tone = (tri + .3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t / tau) * ar(dd, .003, .03)
        _place(x, tone, at, 1.0)
    return norm6(_lp4(x, 6500, 2), .5)


def sfx_chair():
    """Strawberry sits, and the room wakes up (replaces the old squeak for this episode). The cushion lets its air go (a low-passed sigh that falls from 1.2 kHz to 300 Hz), the
    vinyl creaks once as it takes her weight, the frame gives a small wooden knock, and then the fluorescent tube over her head stutters on, as the vault scene draws it: three 'tink's
    (at 0.04, 0.18 and 0.30 s, each a little brighter, the last with the harp cue) and the ballast's hum (100 Hz, its harmonics and a faint fizz) that fades in at 0.35 s, when the light
    stays on (0.37 s). 1.9 s."""
    d = 1.9
    n = int(d * SR)
    t = tarr(d)
    x = np.zeros(n)
    sigh = _tv_filter(noise6(.34, 1530), _glide(1200, 300, .34), 1.2, "lp") * np.interp(tarr(.34), [0, .04, .12, .34], [0, 1, .6, 0])
    _place(x, sigh / np.abs(sigh).max(), 0.0, .7)
    cr = np.interp(tarr(.2), [0, .2], [52, 36])
    saw = 2 * ((np.cumsum(cr) / SR) % 1) - 1
    cr_s = _bp4(saw, 650, 1500) * np.sin(np.pi * np.linspace(0, 1, int(.2 * SR))) ** 1.5
    _place(x, cr_s / np.abs(cr_s).max(), .02, .26)
    _place(x, np.sin(2 * np.pi * 230 * tarr(.1)) * np.exp(-tarr(.1) / .02) + _burst(1531, .1, 500, 2500, .006) * .6, .12, .32)
    for at, g in ((.04, .4), (.18, .5), (.30, .6)):
        tt = tarr(.12)
        _place(x, np.sin(2 * np.pi * 3300 * tt) * np.exp(-tt / .006) + _burst(int(at * 1e4) + 1532, .12, 2500, 9000, .003) * .8, at, g)
    hum = (np.sin(2 * np.pi * 100 * t) + .55 * np.sin(2 * np.pi * 200 * t + 1) + .3 * np.sin(2 * np.pi * 300 * t + 2) + .14 * np.sin(2 * np.pi * 500 * t)) * (.85 + .15 * np.sin(2 * np.pi * 7 * t))
    hum = hum + .12 * _bp4(noise6(d, 1533), 2500, 6000) * (.6 + .4 * np.sin(2 * np.pi * 5 * t))
    hum = _lp4(hum, 4000, 2) * np.interp(t, [0, .34, .42, 1.3, 1.9], [0, 0, 1, .7, 0])
    x += hum / np.abs(hum).max() * .1
    return norm6(_edge(x, .001, .1), .5)


def sfx_doorclose():
    """The break room door pulled shut for the last time (replaces the old thud for this episode): the slab meets the jamb (a wood body that sags from 160 Hz to 90 Hz in 55 ms, with
    a dull noise burst), the latch tongue runs home 14 ms later (a click and a 2.3 kHz ping), and the handle drops back with a tiny second tick; a few rattles of the frame
    and a short, soft tail. 0.9 s."""
    d = .9
    n = int(d * SR)
    t = tarr(d)
    x = np.zeros(n)
    body = _sin_of(_glide(160, 90, d)) * np.exp(-t / .055) * .55 + _lp4(noise6(d, 1540), 900, 2) * np.exp(-t / .03) * .7
    body += (np.sin(2 * np.pi * 260 * t) * np.exp(-t / .03) * .55 + np.sin(2 * np.pi * 410 * t) * np.exp(-t / .022) * .4 + np.sin(2 * np.pi * 690 * t) * np.exp(-t / .015) * .25)
    x += body
    _place(x, _burst(1541, .03, 1500, 5000, .003) * .9 + np.sin(2 * np.pi * 2300 * tarr(.03)) * np.exp(-tarr(.03) / .008) * .3, .014)
    _place(x, _burst(1542, .02, 1200, 4500, .0025) * .45, .062)
    for j, (at, g) in enumerate(((.12, .12), (.165, .08), (.21, .05))):
        _place(x, _burst(1543 + j, .03, 400, 2200, .006), at, g)
    x += _lp4(noise6(d, 1546), 700, 2) * np.exp(-t / .12) * .1
    return norm6(_edge(x, .0004, .1), .8)


def sfx_phonering():
    """Two things going off at the nurses' station at dusk while nobody answers either (replaces the old office-landline burr for this episode). On the right, where the phone sits on the
    counter, the desk phone: the two-tone burr twice (0 to 0.42 s and 0.62 to 1.22 s, so it covers the time the lamp blinks), closed off at 1.7 kHz with a little room echo. On the left, down
    the hall through the doorway, a call light's 'ding-dong' (880 Hz, then 659 Hz at 0.5 s, the series' chime) soft and far, with the dome lit for the ding at 0 to 0.3 s and for the dong at
    0.5 to 0.9 s on the picture (the open scene's far dome). Stereo, so the script's pan is ignored; quiet. 2.0 s."""
    d = 2.0
    n = int(d * SR)
    out = np.zeros((2, n))
    ph = np.zeros(n)
    for at, dd in ((0.0, .42), (.62, .6)):
        t = tarr(dd)
        ring = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * (.55 + .45 * np.sign(np.sin(2 * np.pi * 20 * t)))
        _place(ph, np.tanh(ring * 1.4) * ar(dd, .006, .02), at, .6)
    ph = _lp4(ph, 1700, 2)
    echo = int(.07 * SR)
    ph[echo:] += ph[:-echo] * .3
    ch = np.zeros(n)
    _place(ch, _lp4(_call_ding(880, .2), 2600, 2), 0.0, .5)
    _place(ch, _lp4(_call_ding(659, .22), 2600, 2), .5, .4)
    far = int(.11 * SR)
    ch[far:] += ch[:-far] * .22                                        # the hall's answer: it is a long way off
    place2(out, ph, 0.0, 1.0, .6)
    place2(out, ch, 0.0, 1.0, -.6)
    return norm6(_edge(out, .003, .08), .5)


def sfx_drone():
    """Obstacle three (replaces the old drone for this episode): the same low drone (A1 against itself, its fifth, and a flat second above the root that does not belong) but with
    its level written for the scene: it swells in under the silent Q-word beat (full at 1.0 s), gives way to under a third when 'The Q word.' begins and falls away under the voices, gone
    by 2.6 s."""
    d = 2.6
    t = tarr(d)
    x = osc("saw", 55, d) + osc("saw", 55.7, d) + .5 * osc("saw", 82.4, d) + .3 * osc("saw", 58.3, d)
    x = lp(x, 380) * (.7 + .3 * np.sin(2 * np.pi * 3.5 * t))
    return norm6(x * np.interp(t, [0, .5, 1.0, 1.12, 1.7, 2.6], [0, .85, 1.0, .3, .16, 0]), .6)


BA.SFX.update({k[4:]: v for k, v in list(globals().items()) if k.startswith("sfx_")})


# ---------------------------------------------------------------- the animation's footsteps, balanced for this mix
# build/ep13/events.json (written by the animation, never edited here) says where every footfall lands and how hard. The build reads it through --events; this turns it into a tuned copy
# in the output folder (events.tuned.json) and the mixer reads that instead: the footsteps under dialogue are turned down (their peaks sat about as high as the speech's own RMS),
# the vault's crew running out (four characters on one instant, the identical clip four times over, +12 dB) is spread into a rush, and Brenda's exit is halved because sfx_steps lays
# her slippers on the same six footfalls.
SCENE_SPANS = {"open": (5.2, 31.492), "hall": (90.143, 102.012), "cross": (102.012, 128.858), "vault": (128.858, 164.252)}   # seconds, the frozen timeline
STEP_SCALE = {"open": .75, "hall": .7, "cross": .85, "vault": .85}
RUSH = ("prune", "clem", "mango", "lemon")                                                  # Brenda goes first, with a hop
RUSH_AT = (0.0, .035, .06, .09)


def _tune_events(events):
    out = []
    for ev in events:
        ev = dict(ev)
        if ev.get("name") == "step":
            t = ev["t"]
            sc = next((k for k, (a, b) in SCENE_SPANS.items() if a <= t < b), None)
            k = STEP_SCALE.get(sc, 1.0)
            if sc == "hall" and t - SCENE_SPANS["hall"][0] > 10.7:                       # the walk away down the hall after the sting is already soft
                k = 1.0
            if ev.get("key", "").startswith("prune") and sc == "vault" and t - SCENE_SPANS["vault"][0] < 22.1:     # Brenda's exit: the slippers of sfx_steps ride on these
                k *= .55
            ev["vol"] = round(ev.get("vol", .5) * k, 4)
        out.append(ev)
    # steps that land on the same instant would add as one identical clip: spread them
    steps = [e for e in out if e.get("name") == "step"]
    for e in steps:
        same = [x for x in steps if abs(x["t"] - e["t"]) < .005]
        if len(same) > 1 and e is same[0]:
            same.sort(key=lambda x: RUSH.index(x["key"].split(":")[0]) if x["key"].split(":")[0] in RUSH else 9)
            for j, x in enumerate(same):
                x["t"] = round(x["t"] + RUSH_AT[min(j, len(RUSH_AT) - 1)], 3)
                x["vol"] = round(x["vol"] * .8, 4)
    return sorted(out, key=lambda e: e["t"])


def _tuned_events_path(src, out_dir):
    import json
    ev = json.load(open(src))
    dst = os.path.join(out_dir, "events.tuned.json")
    os.makedirs(out_dir, exist_ok=True)
    json.dump(_tune_events(ev), open(dst, "w"), indent=0)
    return dst


def main():
    argv = sys.argv[1:]
    for k, v in (("--script", "script_ep13.json"), ("--out", "build/ep13"), ("--var", "TIMELINE_EP13"), ("--music", "build_music13")):
        if k not in argv:
            argv += [k, v]
    if "--events" in argv and argv[argv.index("--events") + 1]:
        i = argv.index("--events") + 1
        argv[i] = _tuned_events_path(argv[i], os.path.join(A6.HERE, argv[argv.index("--out") + 1]))
    sys.argv = [sys.argv[0]] + argv
    A6.main()
    out = argv[argv.index("--out") + 1]
    wav = os.path.join(A6.HERE, out, "audio.wav")
    import shutil
    import soundfile as sf
    base = wav + ".pre"
    shutil.copyfile(wav, base)
    # the same loudness trim and peak limiter as Episodes 10 to 12, run until the finished file measures -14.8 LUFS (the limiter takes a few tenths of a decibel off what the trim
    # aimed at, and by a different amount in every episode, so the trim target is corrected from the measurement)
    target = -14.7
    for attempt in range(3):
        shutil.copyfile(base, wav)
        g = A9.trim_loudness(wav, target=target)
        dip = A7.peak_limit(wav)
        if sf.info(wav).subtype != "PCM_16":   # the limiter only rewrites the file when something was over the ceiling
            x, sr = sf.read(wav, dtype="float64")
            sf.write(wav, np.clip(x, -1, 1), sr, subtype="PCM_16")
        final = A9._lufs(wav)
        print(f"loudness trim: {g:+.2f} dB (aimed at {target:.2f} LUFS)")
        print(f"peak limiter: deepest gain dip {dip:.2f} dB, finished file {final:.2f} LUFS")
        if abs(final + 14.8) <= .04:
            break
        target += -14.8 - final
    os.remove(base)
    dips, deep = A10.aac_guard(wav)
    print(f"aac guard: {dips} dip(s), deepest {deep:.2f} dB (keeps the AAC encode under -1 dBTP)")


if __name__ == "__main__":
    main()
