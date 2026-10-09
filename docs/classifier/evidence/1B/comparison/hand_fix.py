"""The smallest fixes the validation rows' own evidence points to (area-1B validation rows 3 and 4), written as patches to
the validators' frames.py (docs/classifier/evidence/1B/validation/frames.py), which is imported and used unchanged otherwise.

 F1 (row 4, 'joined_by compares the wrong two notes'): the kind of a change of frame is `shift` also when any step between
    consecutive onsets in the window [3 events before the new frame's first event .. that event] is more than 2 semitones
    (the hand leapt just before the frame filled), else the original test (|joined_by| <= 2 and gap 0 -> crossing).
 F2 (row 4, 'block chords moving by step are typed crossing'): a change of frame between two chord events (3 or more notes
    each) is `shift`: a thumb cannot pass under a block chord.
 F3 (row 3 (b), 'the chromatic-stretch guard reads single notes only'): the stretch guard also reads runs of events with the
    same number of notes where every voice moves by one semitone in one direction (double notes), so the semitone-pair slot
    sharing is switched off inside them.
Not fixed (no smallest fix in the row's evidence): (a) a pattern moved up a semitone spelled with sharps; (c) a chain of
root-position chords by thirds.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "validation"))
import frames as FR
from frames import EPS, nm

_orig_stretch = FR.stretch_marks


def stretch_marks_multi(evs):
    marks = set(_orig_stretch(evs))
    n = len(evs)
    i = 0
    while i < n - 1:
        j = i
        sign = 0
        while j + 1 < n and len(evs[j].pitches) == len(evs[j + 1].pitches) and len(evs[j].pitches) >= 2:
            ds = {b - a for a, b in zip(evs[j].pitches, evs[j + 1].pitches)}
            if len(ds) == 1 and abs(next(iter(ds))) == 1 and (sign == 0 or next(iter(ds)) == sign):
                sign = next(iter(ds))
                j += 1
            else:
                break
        if j - i >= 2:
            marks.update(range(i, j + 1))
            i = j
        else:
            i += 1
    return marks


def frames_f3(evs, **kw):
    FR.stretch_marks = stretch_marks_multi
    try:
        return FR.frames(evs, **kw)
    finally:
        FR.stretch_marks = _orig_stretch


def changes_fixed(evs, fr, f1=True, f2=True):
    out = FR.changes(evs, fr)
    for c, q in zip(out, fr[1:]):
        k = q["first"]
        new, old = evs[k], evs[k - 1]
        if f2 and len(new.pitches) >= 3 and len(old.pitches) >= 3:
            c["kind"] = "shift"
            continue
        if f1 and c["kind"] == "crossing":
            lo = max(0, k - 3)
            steps = [abs(evs[a + 1].low - evs[a].low) for a in range(lo, k)]
            if any(s > 2 for s in steps):
                c["kind"] = "shift"
    return out
