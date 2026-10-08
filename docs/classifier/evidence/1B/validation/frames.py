"""The corrected frame rule of area-1B.md sections 3 and 4 (finger slots, chromatic-stretch guard, chord-linked
frames, alternation merge, classes, names, joined_by and kind), written from the page's text."""
from dataclasses import dataclass

EPS = 1e-4
NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]


def nm(m):
    return f"{NAMES[m % 12]}{m // 12 - 1}"


@dataclass
class E:  # a stand-in for texture.Ev on built lines
    onset: float
    end: float
    bar: int
    pitches: tuple
    letters: tuple

    @property
    def low(self):
        return self.pitches[0]

    @property
    def high(self):
        return self.pitches[-1]


def built(spec, dur=1.0, per_bar=4):
    """spec: list of strings, each 'C4' or 'C3 E3 G3' (music21 names)."""
    from music21 import pitch as P
    out, t = [], 0.0
    for k, s in enumerate(spec):
        ps = [P.Pitch(x) for x in s.split()]
        ps.sort(key=lambda p: p.midi)
        out.append(E(t, t + dur, int(t // per_bar), tuple(p.midi for p in ps),
                     tuple(p.octave * 7 + "CDEFGAB".index(p.step) for p in ps)))
        t += dur
    return out


def stretch_marks(evs):
    """Indices of single-note onsets inside a chromatic stretch: three or more successive onsets moving by a semitone
    in one direction (two or more semitone steps of one sign)."""
    marks = set()
    i = 0
    n = len(evs)
    while i < n - 1:
        j = i
        sign = 0
        while j + 1 < n and len(evs[j].pitches) == 1 and len(evs[j + 1].pitches) == 1:
            d = evs[j + 1].low - evs[j].low
            if abs(d) == 1 and (sign == 0 or (d > 0) == (sign > 0)):
                sign = d
                j += 1
            else:
                break
        if j - i >= 2:
            marks.update(range(i, j + 1))
            i = j
        else:
            i += 1
    return marks


def slots(pairs, stretched):
    """pairs: set of (midi, letter); stretched: set of midis played inside a chromatic stretch.
    A semitone pair on one written letter shares a slot unless one of them was played in a chromatic stretch."""
    by_letter = {}
    for m, l in pairs:
        by_letter.setdefault(l, set()).add(m)
    n = 0
    for l, ms in by_letter.items():
        ms = sorted(ms)
        if any(m in stretched for m in ms):
            n += len(ms)
            continue
        k = 0
        while k < len(ms):
            if k + 1 < len(ms) and ms[k + 1] - ms[k] == 1:
                k += 2
            else:
                k += 1
            n += 1
    return n


def frames(evs, span=9, max_slots=5, octave=12, linked_span=10, slot_sharing=True, chord_link=True, guard=True):
    marks = stretch_marks(evs) if guard else set()
    out = []

    def ev_pairs(e):
        return set(zip(e.pitches, e.letters))

    def st(i, e):
        return set(e.pitches) if i in marks else set()

    def nslots(pairs, stretched):
        if not slot_sharing:
            return len({m for m, _ in pairs})
        return slots(pairs, stretched)

    for i, e in enumerate(evs):
        if out:
            f = out[-1]
            lo, hi = min(f["lo"], e.low), max(f["hi"], e.high)
            pairs = f["pairs"] | ev_pairs(e)
            stretched = f["st"] | st(i, e)
            repeats = e.low >= f["lo"] and e.high <= f["hi"] and set(e.pitches) <= {m for m, _ in f["pairs"]}
            if (hi - lo <= span and nslots(pairs, stretched) <= max_slots) or repeats:
                f.update(lo=lo, hi=hi, pairs=pairs, st=stretched, last=i)
                continue
            prev = evs[i - 1]
            if (chord_link and len(e.pitches) >= 3 and len(prev.pitches) >= 3 and f["last"] == i - 1
                    and set(e.pitches) & set(prev.pitches) and hi - lo <= linked_span):
                f.update(lo=lo, hi=hi, pairs=pairs, st=stretched, last=i, linked=True)
                continue
            if len(out) >= 2:
                g = out[-2]
                p2 = g["pairs"] | f["pairs"]
                s2 = g["st"] | f["st"]
                if (set(e.pitches) <= {m for m, _ in g["pairs"]} and max(g["hi"], f["hi"]) - min(g["lo"], f["lo"]) <= octave
                        and nslots(p2, s2) <= max_slots):
                    out.pop()
                    g.update(lo=min(g["lo"], f["lo"]), hi=max(g["hi"], f["hi"]), pairs=p2, st=s2, last=i, alt=True,
                             linked=g.get("linked", False) or f.get("linked", False))
                    continue
        out.append({"first": i, "last": i, "lo": e.low, "hi": e.high, "pairs": ev_pairs(e), "st": st(i, e)})
    for f in out:
        f["slots"] = nslots(f["pairs"], f["st"]) if slot_sharing else len({m for m, _ in f["pairs"]})
        f["cls"] = klass(f)
        f["name"] = name(f)
    return out


def klass(f):
    s = f["hi"] - f["lo"]
    if f.get("linked"):
        return "five-finger" if s <= 7 else "extended" if s <= 10 else "beyond"
    if f["slots"] > 5:
        return "beyond"
    return "five-finger" if s <= 7 else "extended" if s <= 9 else "beyond"


def name(f):
    s = f["hi"] - f["lo"]
    if s > 7:
        return f"({nm(f['lo'])} lowest; not a five-finger frame)"
    if f["slots"] == 5 or s == 7:
        return f"{nm(f['lo'])} position"
    a, b = f["hi"] - 7, f["lo"]
    return f"{nm(a)} to {nm(b)} position" if a != b else f"{nm(a)} position"


def changes(evs, fr):
    out = []
    for p, q in zip(fr, fr[1:]):
        old = evs[q["first"] - 1]
        new = evs[q["first"]]
        jb = new.low - old.low
        gap = new.onset - old.end
        kind = "crossing" if abs(jb) <= 2 and abs(gap) <= EPS else "shift"
        size = (q["lo"] + q["hi"]) / 2 - (p["lo"] + p["hi"]) / 2
        out.append({"bar": new.bar, "index": q["first"], "joined_by": jb, "gap": round(gap, 3), "kind": kind, "size": size,
                    "from": f"{nm(old.low)}", "to": f"{nm(new.low)}"})
    return out


def show(fr):
    return [(nm(f["lo"]), nm(f["hi"]), f["cls"], f["slots"], f["first"], "L" if f.get("linked") else "", "A" if f.get("alt") else "", f["name"]) for f in fr]
