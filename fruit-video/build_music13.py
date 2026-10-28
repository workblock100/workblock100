"""Episode 13 score (work in progress). score(script, scenes, lines, N) returns a (2, N) stereo bed.

The first section is shared with build_audio13.py: the click times of the title's vault dial and the beats of the slow-motion heartbeat, so the score can lock to the sound effects."""
import numpy as np

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


def score(script, scenes, lines, N):
    return np.zeros((2, N))
