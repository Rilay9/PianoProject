"""
An independent reading of a generated exercise's written file (CF1, `docs/prompts/runs/content-finish-plan.md`).

A generator never certifies itself. This module reads the file the learner is sent back through
music21, and holds it to two things the maker does not check for itself:

- **the page is well formed for what the catalogue says it is**: every bar holds exactly its time
  signature, the written key and time signatures are the ones the row declares, the staves that
  sound are the hands the row declares, and every note is spelled as its key's own (the families
  read here promise no chromatic note);
- **the family's named promise**: the sentence its contract row gives as its `name`
  (`family_contracts.json`), read from the notes. "A right-hand five-finger walk over a left hand
  that holds or changes" is checked as steps inside a fifth over one whole-bar left-hand note per
  bar, the same note throughout or a different one each bar.

It imports nothing from `generate_exercises.py`: no table, no helper, no constant. Its inputs are
the written file and the item's catalogue row (key, time, hands, family, parameters), which is what
the app reads too.

It does not read demands. Demands have one definition, `app/src/demands/detect.ts`, read through
the bridge (`test_measured_demands.py`); a Python reading would be a second implementation of the
same idea (content-mistakes #5). Nor does it check beaming: music21 writes the beams, so music21
reading them back would be the writer checking itself.

Scope: the families of the plan's needs N1 and N2 — coordination, five-finger, ostinato, rhythm and
the swing pair. Another family is read for its page only, and its promise is reported unknown.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from music21 import chord, converter, expressions, harmony, interval, key, meter, note, stream

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "app" / "public" / "content" / "catalog.json"


# --------------------------------------------------------------------------------------
# reading the page
# --------------------------------------------------------------------------------------


def declared_key(row: dict) -> key.Key:
    """The row's `keySig`, "C major", "a minor" or a bare "F", as a music21 key."""
    text = row["keySig"].strip()
    tonic, _, mode = text.partition(" ")
    return key.Key(tonic.lower() if mode == "minor" else tonic[0].upper() + tonic[1:])


def strikes(part: stream.Stream) -> list[tuple[float, float, list]]:
    """(offset, length, pitches) per struck note or chord, a tie's continuation folded into its start."""
    out: list[tuple[float, float, list]] = []
    for n in part.recurse().notes:
        if isinstance(n, harmony.ChordSymbol):
            continue
        offset = float(n.getOffsetInHierarchy(part))
        length = float(n.duration.quarterLength)
        if n.tie is not None and n.tie.type in ("stop", "continue") and out:
            start, held, pitches = out[-1]
            out[-1] = (start, held + length, pitches)
            continue
        out.append((offset, length, list(n.pitches)))
    return out


def bars_of(part: stream.Stream) -> list[stream.Measure]:
    return list(part.getElementsByClass(stream.Measure))


def bar_content(measure: stream.Measure) -> list[tuple[str, float]]:
    """A bar as (pitch names with octave, or "rest", length) in order: what two bars compare on."""
    out = []
    for n in measure.recurse().notesAndRests:
        if isinstance(n, harmony.ChordSymbol):
            continue
        label = "rest" if n.isRest else ".".join(p.nameWithOctave for p in n.pitches)
        out.append((label, float(n.duration.quarterLength)))
    return out


def page_faults(score: stream.Score, row: dict) -> list[str]:
    faults: list[str] = []
    parts = list(score.parts)

    for index, part in enumerate(parts):
        ts = None
        for m in bars_of(part):
            ts = m.timeSignature or ts
            if ts is None:
                faults.append(f"staff {index + 1} bar {m.number}: no time signature in force")
                continue
            if abs(m.duration.quarterLength - ts.barDuration.quarterLength) > 1e-6:
                faults.append(f"staff {index + 1} bar {m.number}: holds {m.duration.quarterLength} quarters "
                              f"under {ts.ratioString}")

    times = {ts.ratioString for ts in score.recurse().getElementsByClass(meter.TimeSignature)}
    if times != {row["timeSig"]}:
        faults.append(f"time signature written {sorted(times)}, the row declares {row['timeSig']}")

    if row.get("keySig"):
        k = declared_key(row)
        sharps = {ks.sharps for ks in score.recurse().getElementsByClass(key.KeySignature)}
        if sharps != {k.sharps}:
            faults.append(f"key signature written with {sorted(sharps)} sharps, {row['keySig']} has {k.sharps}")
        own = {p.name for p in k.getScale("major" if k.mode == "major" else "minor").getPitches()}
        for index, part in enumerate(parts):
            for offset, _length, pitches in strikes(part):
                for p in pitches:
                    if p.name not in own:
                        faults.append(f"staff {index + 1} at {offset}: {p.nameWithOctave} is not {row['keySig']}'s own")

    sounding = {"right": [0], "left": [1], "both": [0, 1]}[row["hands"]] if len(parts) == 2 else [0]
    for index, part in enumerate(parts):
        plays = bool(strikes(part))
        if plays and index not in sounding:
            faults.append(f"staff {index + 1} sounds and the row says hands={row['hands']}")
        if not plays and index in sounding:
            faults.append(f"staff {index + 1} is silent and the row says hands={row['hands']}")
    return faults


# --------------------------------------------------------------------------------------
# the families' named promises
# --------------------------------------------------------------------------------------


def _generic(a, b) -> int:
    """The undirected generic interval from a to b: 1 a unison, 2 a second."""
    return interval.Interval(a, b).generic.undirected


def _whole_bar_notes(part: stream.Stream, what: str) -> tuple[list, list[str]]:
    """One strike at the start of every bar lasting the whole bar; its pitches per bar."""
    faults, per_bar = [], []
    for m in bars_of(part):
        bar_strikes = strikes(m)
        length = m.barDuration.quarterLength
        if len(bar_strikes) != 1 or bar_strikes[0][0] != 0 or abs(bar_strikes[0][1] - length) > 1e-6:
            faults.append(f"{what}, bar {m.number}: {len(bar_strikes)} strike(s), not one held through the bar")
            per_bar.append(None)
            continue
        per_bar.append(tuple(p.nameWithOctave for p in bar_strikes[0][2]))
    return per_bar, faults


def coordination(score: stream.Score, row: dict) -> list[str]:
    """A right-hand five-finger walk over a left hand that holds or changes."""
    rh, lh = score.parts[0], score.parts[1]
    faults: list[str] = []
    right = strikes(rh)
    pitches = [s[2][0] for s in right]
    for (o1, _, (a,)), (_o2, _, (b,)) in zip(right, right[1:]):
        if _generic(a, b) > 2:
            faults.append(f"right hand at {o1}: {a.nameWithOctave} to {b.nameWithOctave} is not a step")
    if pitches and _generic(min(pitches), max(pitches)) > 5:
        faults.append(f"right hand spans {min(pitches).nameWithOctave}–{max(pitches).nameWithOctave}, wider than a five-finger position")

    per_bar, bar_faults = _whole_bar_notes(lh, "left hand")
    faults += bar_faults
    variant = row["drill"]["params"]["variant"]
    held = [b for b in per_bar if b is not None]
    if variant == "hold" and len(set(held)) > 1:
        faults.append(f"left hand 'holds' and plays {sorted(set(held))}")
    if variant == "change":
        for bar, (a, b) in enumerate(zip(held, held[1:]), start=2):
            if a == b:
                faults.append(f"left hand 'changes' and bar {bar} repeats {a}")

    left = strikes(lh)
    for offset, _length, _p in right:
        if not any(o <= offset + 1e-6 < o + length for o, length, _q in left):
            faults.append(f"right hand at {offset}: the left hand is not sounding")
    return faults


def five_finger(score: stream.Score, row: dict) -> list[str]:
    """Five notes up by step from the tonic and back, one at a time; both hands an octave apart."""
    k = declared_key(row)
    faults: list[str] = []
    lines = {}
    for name, part in zip(("right", "left"), score.parts):
        line = strikes(part)
        if not line:
            continue
        lines[name] = line
        if any(len(p) != 1 for _o, _l, p in line):
            faults.append(f"{name} hand: a chord where the pattern is one note at a time")
            continue
        ps = [p[0] for _o, _l, p in line]
        if ps[0].name != k.tonic.name:
            faults.append(f"{name} hand starts on {ps[0].name}, not the tonic {k.tonic.name}")
        moves = [interval.Interval(a, b).generic.directed for a, b in zip(ps, ps[1:])]
        if moves != [2, 2, 2, 2, -2, -2, -2, -2]:
            faults.append(f"{name} hand moves {moves}, not five steps up and back")
    if len(lines) == 2:
        for (o1, _l1, (a,)), (o2, _l2, (b,)) in zip(lines["right"], lines["left"]):
            if o1 != o2 or a.name != b.name or a.octave - b.octave != 1:
                faults.append(f"at {o1}: right {a.nameWithOctave} and left {b.nameWithOctave} are not an octave apart together")
    return faults


def ostinato(score: stream.Score, row: dict) -> list[str]:
    """One eighth-note figure repeated over a held bass."""
    rh, lh = score.parts[0], score.parts[1]
    faults: list[str] = []
    for offset, length, _p in strikes(rh):
        if abs(length - 0.5) > 1e-6:
            faults.append(f"right hand at {offset}: {length} quarters, not an eighth")
    figures = [bar_content(m) for m in bars_of(rh)]
    for bar, figure in enumerate(figures[1:], start=2):
        if figure != figures[0]:
            faults.append(f"right hand bar {bar} is not the figure of bar 1")
    per_bar, bar_faults = _whole_bar_notes(lh, "bass")
    faults += bar_faults
    if len({b for b in per_bar if b is not None}) > 1:
        faults.append(f"the bass moves: {sorted({b for b in per_bar if b is not None})}")
    return faults


def rhythm(score: stream.Score, row: dict) -> list[str]:
    """A rhythm on one line, four bars: one pitch, the same rhythm every bar."""
    faults: list[str] = []
    part = score.parts[0]
    names = {p.nameWithOctave for _o, _l, ps in strikes(part) for p in ps}
    if len(names) != 1:
        faults.append(f"the line sounds {sorted(names)}, not one pitch")
    bars = bars_of(part)
    if len(bars) != row["drill"]["params"]["bars"]:
        faults.append(f"{len(bars)} bars, the row says {row['drill']['params']['bars']}")
    rhythms = [[length for _label, length in bar_content(m)] for m in bars]
    for bar, r in enumerate(rhythms[1:], start=2):
        if r != rhythms[0]:
            faults.append(f"bar {bar} is not bar 1's rhythm")
    return faults


def swing_pair(score: stream.Score, row: dict) -> list[str]:
    """Four bars of straight eighths, a silent bar, the same four bars marked swing."""
    rh = score.parts[0]
    faults: list[str] = []
    bars = bars_of(rh)
    if len(bars) != 9:
        return [f"{len(bars)} bars, not four, one silent and four"]
    if [bar_content(m) for m in bars[:4]] != [bar_content(m) for m in bars[5:]]:
        faults.append("the second four bars are not the first four")
    if any(label != "rest" for label, _ in bar_content(bars[4])):
        faults.append("bar 5 is not silent")
    marks = {m.number: [t.content for t in m.recurse().getElementsByClass(expressions.TextExpression)] for m in bars}
    if not any("swing" in text.lower() for text in marks.get(bars[5].number, [])):
        faults.append(f"no swing direction at bar {bars[5].number}")
    if any("swing" in text.lower() for m in bars[:5] for text in marks.get(m.number, [])):
        faults.append("a swing direction over the straight half")
    eighths = sum(1 for _o, length, _p in strikes(rh) if abs(length - 0.5) < 1e-6)
    if eighths < 4 * 8:
        faults.append(f"{eighths} eighths across eight bars, fewer than four a bar")
    return faults


PROMISES = {
    "coordination": coordination,
    "five_finger": five_finger,
    "ostinato": ostinato,
    "rhythm": rhythm,
    "swing_pair": swing_pair,
}


def family_of(row: dict) -> str | None:
    return ((row.get("drill") or {}).get("generator") or {}).get("family")


def check(score: stream.Score, row: dict) -> dict:
    """{"page": faults, "promise": faults, or None where the family's promise is not read here}."""
    row = {**row, "family": family_of(row)}
    promise = PROMISES.get(row["family"])
    return {"page": page_faults(score, row), "promise": promise(score, row) if promise else None}


def check_file(path: Path, row: dict) -> dict:
    return check(converter.parse(str(path)), row)


def main(argv: list[str]) -> int:
    """Read every shipped item of the covered families from the built content; print the faults."""
    families = set(argv) or set(PROMISES)
    rows = [r for r in json.loads(CATALOG.read_text(encoding="utf-8")) if family_of(r) in families and r.get("file")]
    bad = 0
    for row in rows:
        result = check_file(CATALOG.parent / row["file"], row)
        faults = result["page"] + (result["promise"] or [])
        if faults:
            bad += 1
            print(row["id"])
            for fault in faults:
                print("   ", fault)
    print(f"{len(rows)} item(s) read, {bad} with faults")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
