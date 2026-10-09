"""Truth definition for the hand-position comparison (docs/classifier/evidence/1B/comparison/hand.md).

WRITTEN BEFORE ANY METHOD'S OUTPUT WAS LOOKED AT (file time precedes every results file in this folder).
It states how a hand position, a position class and a position shift are derived from a FINGERED passage.
Nothing here is tuned afterwards; hand_sens.py reports the effect of changing W only as a sensitivity row.

A fingered passage = per hand, a list of EVENTS in onset order (notes struck together); an event is a list of
(midi_pitch, finger) with finger 1..5 (1 = thumb) for that hand.

1. Placement. A five-finger placement is a thumb key t. In it finger f rests on key t + C[f] (right hand) or
   t - C[f] (left hand, thumb highest), with C = {1:0, 2:2, 3:4, 4:5, 5:7} (so the home span is 7 semitones).
2. Implied thumb key of one fingered note: e = pitch - C[finger] (right hand), e = pitch + C[finger] (left hand).
3. Position range of a set of notes: R = max(e) - min(e). R = 0 means the notes sit exactly on one placement;
   a minor third on finger 3 (a semitone below its home key) gives R = 1; a fifth finger one tone beyond its home
   key gives R = 2 (the stretch).
4. Segments (hand positions), greedy per hand: an event joins the current segment while the segment's R stays
   <= W (W = 3: five-finger's span of 7 plus at most a minor third of stretch, which is 10 semitones, the widest
   span the project's own rule calls extended), or when every (pitch, finger) pair of the event is already in the
   segment (a repeat). Otherwise the event opens a new segment. An event whose own R exceeds W (for example an
   octave played 1 and 5: R = 5) is a segment on its own; only repeats of its pairs join it (a broken octave or
   tremolo alternation stays in it).
5. Class of a segment: R <= 1: five-finger; 2 <= R <= 3: extended; R > 3 (only a wide event): beyond.
6. Position shift (truth) = each boundary between consecutive segments of one hand. It is placed at the index of
   the first event of the new segment (event index within the hand; a chord counts as one event).
7. Kind of a shift. A CROSSING is a boundary where the finger order inverts against the direction of travel:
   moving up (right hand) or down (left hand): a finger >= 3 followed by finger 1 (thumb under); moving down (right
   hand) or up (left hand): finger 1 followed by a finger >= 3 (finger over). Any other boundary is a SHIFT (the
   hand moves or leaps to a new placement). Used only where a method gives a fingering.

Matching a predicted frame boundary to a truth boundary: event index within +-1 event of each other, same hand,
each truth boundary matched at most once (nearest first).
"""
C = {1: 0, 2: 2, 3: 4, 4: 5, 5: 7}
W = 3


def implied(pitch, finger, hand):
    return pitch - C[finger] if hand == "R" else pitch + C[finger]


def segments(events, hand, w=W):
    """events: list of lists of (pitch, finger). Returns list of dicts {first, last, R, cls}."""
    out = []
    for i, ev in enumerate(events):
        ev_e = [implied(p, f, hand) for p, f in ev]
        if not ev_e:
            continue
        pairs = set(ev)
        if out:
            s = out[-1]
            lo, hi = min(s["lo"], min(ev_e)), max(s["hi"], max(ev_e))
            if hi - lo <= w or pairs <= s["pairs"]:
                s.update(lo=lo, hi=hi, last=i, pairs=s["pairs"] | pairs)
                continue
        out.append({"first": i, "last": i, "lo": min(ev_e), "hi": max(ev_e), "pairs": pairs})
    for s in out:
        r = s["hi"] - s["lo"]
        s["R"] = r
        s["cls"] = "five-finger" if r <= 1 else "extended" if r <= w else "beyond"
    return out


def boundaries(events, segs, hand):
    """[(event_index, kind)] for each boundary between consecutive segments."""
    res = []
    for a, b in zip(segs, segs[1:]):
        prev = events[a["last"]]
        new = events[b["first"]]
        up = (sum(p for p, _ in new) / len(new)) > (sum(p for p, _ in prev) / len(prev))
        pf = max(f for _, f in prev) if len(prev) == 1 else None
        nf = new[0][1] if len(new) == 1 else None
        kind = "shift"
        if pf is not None and nf is not None:
            travel_up = up if hand == "R" else not up
            if travel_up and pf >= 3 and nf == 1:
                kind = "crossing"
            elif (not travel_up) and pf == 1 and nf >= 3:
                kind = "crossing"
        res.append((b["first"], kind))
    return res


def match(truth_idx, pred_idx, tol=1):
    """Greedy nearest matching, each used once. Returns (matched_pairs)."""
    pairs = []
    cands = sorted(((abs(t - p), t, p) for t in truth_idx for p in pred_idx if abs(t - p) <= tol))
    ut, up = set(), set()
    for d, t, p in cands:
        if t in ut or p in up:
            continue
        ut.add(t)
        up.add(p)
        pairs.append((t, p))
    return pairs
