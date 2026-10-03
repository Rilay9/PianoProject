"""
CF1: a generated exercise's written file, read back by music21, held to what its family promises
(`docs/prompts/runs/content-finish-plan.md`). music21 supplies every fact; this file only states
each family's learner-facing property. It imports nothing from `generate_exercises.py`.

Not here, on purpose: demands (`detect.ts` is their one definition, read through the bridge) and
beaming (music21 writes the beams, so it cannot witness them).
"""
from __future__ import annotations

from music21 import expressions, interval, key, stream


def _key(row: dict) -> key.Key | None:
    tonic, _, mode = (row.get("keySig") or "").partition(" ")
    return key.Key(tonic.lower() if mode == "minor" else tonic) if tonic else None


def _notes(part) -> list:
    return list(part.recurse().notes)


def _bars(part) -> list:
    return [[(n.pitches, n.quarterLength) for n in m.notesAndRests] for m in part.getElementsByClass(stream.Measure)]


def _held_bars(part) -> list:
    """Each bar's pitches if the bar is one strike held through it, else None."""
    out = []
    for m in part.getElementsByClass(stream.Measure):
        ns = list(m.notes)
        out.append(ns[0].pitches if len(ns) == 1 and ns[0].quarterLength == m.barDuration.quarterLength else None)
    return out


def _steps(ns) -> list[int]:
    return [interval.Interval(a, b).generic.directed for a, b in zip(ns, ns[1:])]


#: The note values a pattern's name promises, as music21 quarter lengths ("quarter-eighths" names both).
NAMED_VALUES = {"sixteenth": 0.25, "eighth": 0.5, "dotted-quarter": 1.5, "quarter": 1.0, "dotted-half": 3.0, "half": 2.0}


def named_values(label: str) -> set[float]:
    found = set()
    for word, value in NAMED_VALUES.items():   # the dotted names first, so "dotted-quarter" is not also "quarter"
        if word in label:
            found.add(value)
            label = label.replace(word, "")
    return found


def coordination(s, row):
    rh, lh = s.parts[0], s.parts[1]
    held = _held_bars(lh)
    yield from (["left hand: a bar not held through"] if None in held else [])
    if row["drill"]["params"]["variant"] == "hold" and len(set(held)) > 1:
        yield "left hand holds and moves"
    if row["drill"]["params"]["variant"] == "change" and any(a == b for a, b in zip(held, held[1:])):
        yield "left hand changes and repeats"
    if any(abs(step) > 2 for step in _steps(_notes(rh))):
        yield "right hand leaves the five-finger walk"


def five_finger(s, row):
    lines = [_notes(p) for p in s.parts if _notes(p)]
    for line in lines:
        if any(n.quarterLength != 1.0 for n in line):
            yield "not in quarters"
        if line[0].name != _key(row).tonic.name or _steps(line) != [2, 2, 2, 2, -2, -2, -2, -2]:
            yield "not five steps up from the tonic and back"
    if len(lines) == 2 and [n.name for n in lines[0]] != [n.name for n in lines[1]]:
        yield "the hands are not playing the same notes"


def ostinato(s, row):
    bars = _bars(s.parts[0])
    if any(b != bars[0] for b in bars) or any(n.quarterLength != 0.5 for n in _notes(s.parts[0])):
        yield "the eighth-note figure changes"
    if len(set(_held_bars(s.parts[1]))) != 1:
        yield "the bass moves"


def rhythm(s, row):
    bars = [[d for _p, d in b] for b in _bars(s.parts[0])]
    if any(b != bars[0] for b in bars) or len({n.nameWithOctave for n in _notes(s.parts[0])}) != 1:
        yield "not one rhythm on one pitch"
    missing = named_values(row["drill"]["params"]["pattern"]) - {n.quarterLength for n in _notes(s.parts[0])}
    if missing:
        yield f"the pattern's name promises {sorted(missing)} and the notes have none"


def swing_pair(s, row):
    measures = list(s.parts[0].getElementsByClass(stream.Measure))
    bars = _bars(s.parts[0])
    if not any(n.quarterLength == 0.5 for n in _notes(s.parts[0])):
        yield "no eighth notes"
    if len(bars) != 9 or bars[:4] != bars[5:] or any(p for p, _d in bars[4]):
        yield "not four bars, a silent bar and the same four bars"
    elif not any("swing" in t.content.lower() for t in measures[5].getElementsByClass(expressions.TextExpression)):
        yield "no swing mark where the second half starts"


PROMISES = {f.__name__: f for f in (coordination, five_finger, ostinato, rhythm, swing_pair)}


def check(score: stream.Score, row: dict) -> list[str]:
    """Faults on the page (a bar not full, a note not the key's own) and in the family's promise."""
    faults = [f"bar {m.number}: not full" for p in score.parts for m in p.getElementsByClass(stream.Measure)
              if m.duration.quarterLength != m.barDuration.quarterLength]
    k = _key(row)
    if k:
        own = {p.name for p in k.getScale().getPitches()}
        faults += [f"{p.nameWithOctave} is not {row['keySig']}'s own" for n in _notes(score)
                   for p in n.pitches if p.name not in own]
    promise = PROMISES.get(row["drill"]["generator"]["family"])
    return faults + (list(promise(score, row)) if promise else ["promise not read here"])
