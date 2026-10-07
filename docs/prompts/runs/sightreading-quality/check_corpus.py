"""
The mechanical check of the sight-reading quality lane (brief §3, §4).

    py -3.11 check_corpus.py <run dir>          # e.g. <worktree>/build/sr-quality/run1

Reads the frozen MANIFEST.json, the export's results.json and items/*.musicxml, the second
reader's mxio.json (mxio_read.mjs) and the exported taught sets (taught.json, one level up).
Writes <run dir>/checks.json (everything) and prints the per-stratum counts.

Witnesses, one per property class (brief §3, FABLE §7):

* **File events** - partitura 1.9.0 (`load_musicxml`; notes unmerged by ties, rests, key and
  time signatures, clefs, slurs, articulations). musicxml-io 0.10.3 reads every file as well;
  `compare_readers` lists every disagreement per file and class, and a required property that
  rests on a class the readers disagree on is NOT-ESTABLISHED for that file, never PASS.
* **Theory facts** - music21 10.5.0: `key.KeySignature(f).asKey('major')` for the diatonic set,
  `interval.Interval` for generic intervals (cross-checked against the spelled-step count),
  `chord.Chord` for the chord a left-hand bar spells.
* **Playable hand distribution** - `tools/content/family_contracts.physical_facts`, imported
  read-only, with its existing limits: span within `AN_OCTAVE`, no hand move beyond it, A0-C8.
* **The rung's demands** - the detectors below, kept custom (no library defines "the rung's
  taught demand"), written from the vocabulary's `display` definitions over partitura events.
  They do not import or copy the app's detectors (`app/src/demands/`, `readingControls.ts`).

Detector definitions (each over the written notes; a tie continuation is not a new note):

* `clef.bass` - a sounding note on a staff whose clef is F.
* `pitch.ledger` - "a ledger line beyond middle C": on a G-clef staff a note below C4 (B3 or
  lower); on an F-clef staff a note above C4 (D4 or higher). Middle C itself is not beyond it.
* `interval.step` / `.skip` / `.leap` - consecutive struck notes of one staff's top line
  (the highest pitch at each onset), generic interval 2nd / 3rd / 4th or wider, from spelled
  pitches; a rest does not break the line.
* `rhythm.eighths` - a note or rest written as an eighth, outside a tuplet.
* `rhythm.shorter-than-quarter` - a note written shorter than a quarter (tuplets included).
* `rhythm.sixteenths` - a note or rest written as a 16th.
* `rhythm.dotted-quarter` - a quarter with one dot, in simple time (in compound time the
  dotted quarter is the beat; counted apart as `compoundDottedQuarters`).
* `rhythm.ties` - any tie.
* `rhythm.syncopation` - a struck note (its tied length) starting off the beat and lasting past
  the next beat; the beat is the quarter in simple time, the dotted quarter in compound time.
* `rhythm.triplets` - a time modification of 3 in the time of 2.
* `metre.compound` - a time signature over 8 whose top is a multiple of 3.
* `key.signature` - a key signature other than none (fifths != 0).
* `pitch.chromatic` - a note whose spelled pitch class is outside the written key's major scale.
* `range.beyond-position` - one staff's notes span more than five scale steps (wider than a
  fifth, generic interval >= 6th, from spelled pitches).
* `texture.hands-together` - both staves sound at one moment (struck together or one held).
* `texture.left-hand-pattern` - a lower-staff bar of a two-hand phrase with two or more onsets
  of different pitches.
* `texture.walking-bass` - from the vocabulary's own wording (`demands.json` taughtAtNote,
  jazz.6: "four notes to the bar with a semitone approach to the next root"): a lower staff
  where, in at least half of the bar changes, the bar is one single note on every beat and its
  last note lies a semitone from the next bar's first note. (Revised after run 1's first check:
  the first definition, one single note on every beat, also counted L6's broken chord in
  quarters; both counts are in REPORT.md §4.)
* `metre.triple` - lane-added, NOT a vocabulary demand: a time signature with 3 beats of a
  quarter (3/4). Taught at 1.4 (`content/lessons/1.4.md:23`); the brief's 3/4 hold gap.
"""
from __future__ import annotations

import json
import sys
import warnings
from collections import defaultdict
from pathlib import Path

warnings.filterwarnings("ignore")

HERE = Path(__file__).resolve().parent
WORKTREE = HERE.parents[3]
sys.path.insert(0, str(WORKTREE / "tools" / "content"))

import partitura as pt  # noqa: E402
import partitura.score as ps  # noqa: E402
from music21 import chord as m21chord  # noqa: E402
from music21 import converter, interval as m21interval  # noqa: E402
from music21 import key as m21key  # noqa: E402
from music21 import pitch as m21pitch  # noqa: E402

import family_contracts as fc  # noqa: E402  (read-only import)

STEPS = "CDEFGAB"
STEP_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

# LEVEL-SPEC.md, decided cells used as bounds (each with its reason there).
LEVEL = {
    1: {"rh": (60, 67), "lh": (48, 55), "maxLeap": 1, "maxFifths": 0, "chordTones": False},
    2: {"rh": (60, 72), "lh": (48, 55), "maxLeap": 2, "maxFifths": 1, "chordTones": False},
    3: {"rh": (60, 72), "lh": (48, 60), "maxLeap": 3, "maxFifths": 1, "chordTones": False},
    4: {"rh": (57, 79), "lh": (41, 60), "maxLeap": 4, "maxFifths": 2, "chordTones": False},
    5: {"rh": (57, 81), "lh": (36, 60), "maxLeap": 5, "maxFifths": 3, "chordTones": True},
    6: {"rh": (55, 84), "lh": (36, 60), "maxLeap": 5, "maxFifths": 4, "chordTones": True},
    7: {"rh": (55, 86), "lh": (33, 60), "maxLeap": 6, "maxFifths": 4, "chordTones": True},
}
LEFT_HAND_HOME = {"whole": 2, "chord": 4, "alberti": 5, "broken": 6, "walking": 7}
PROMISE_DEMAND = {
    "skips": "interval.skip", "leaps": "interval.leap", "eighths": "rhythm.eighths",
    "syncopation": "rhythm.syncopation", "triplets": "rhythm.triplets", "accidentals": "pitch.chromatic",
    "ties": "rhythm.ties", "dottedQuarters": "rhythm.dotted-quarter", "ledger": "pitch.ledger",
    "sixteenths": "rhythm.sixteenths",
}
TRIPLE_TAUGHT_AT = "1.4"  # content/lessons/1.4.md:23


def dia(step: str, octave: int) -> int:
    return octave * 7 + STEPS.index(step)


def m21name(step: str, alter: int) -> str:
    return step + ("#" * alter if alter > 0 else "-" * (-alter))


def tonic_pc(fifths: int) -> int:
    return (fifths * 7) % 12


def hand_position(fifths: int, start: int) -> tuple[int, int]:
    """The five notes from the key's tonic at or above `start` (the generator's documented rule, C4)."""
    t = tonic_pc(fifths)
    low = start + ((t - start % 12) + 12) % 12
    return low, low + 7


# --------------------------------------------------------------------------- readers


def read_partitura(path: Path) -> dict:
    part = pt.load_musicxml(str(path)).parts[0]
    measures = [(m.start.t, m.end.t) for m in part.measures]

    def mindex(t: int) -> int:
        for i, (a, b) in enumerate(measures):
            if a <= t < b:
                return i
        return len(measures) - 1

    na = part.note_array(include_divs_per_quarter=True)
    divs = int(na["divs_pq"][0]) if len(na) else None
    notes = []
    for n in part.notes:
        sd = n.symbolic_duration or {}
        notes.append({
            "t": n.start.t, "m": mindex(n.start.t), "pos": n.start.t - measures[mindex(n.start.t)][0],
            "dur": n.duration, "staff": n.staff or 1, "voice": n.voice, "step": n.step,
            "alter": int(n.alter or 0), "octave": n.octave, "midi": n.midi_pitch,
            "tieStart": n.tie_next is not None, "tieStop": n.tie_prev is not None,
            "tm": [sd["actual_notes"], sd["normal_notes"]] if sd.get("actual_notes") else None,
            "type": sd.get("type"), "dots": sd.get("dots", 0) or 0,
            "articulations": len(n.articulations or []),
            "tiedDur": n.duration_tied,
        })
    rests = [{"t": r.start.t, "m": mindex(r.start.t), "pos": r.start.t - measures[mindex(r.start.t)][0],
              "dur": r.duration, "staff": r.staff or 1, "voice": r.voice,
              "type": (r.symbolic_duration or {}).get("type"),
              "tm": [r.symbolic_duration["actual_notes"], r.symbolic_duration["normal_notes"]]
              if (r.symbolic_duration or {}).get("actual_notes") else None}
             for r in part.iter_all(ps.Rest)]
    return {
        "divs": divs, "measures": measures, "notes": notes, "rests": rests,
        "keys": [k.fifths for k in part.iter_all(ps.KeySignature)],
        "times": [(t.beats, t.beat_type) for t in part.iter_all(ps.TimeSignature)],
        "clefs": {(c.staff or 1): c.sign for c in part.iter_all(ps.Clef)},
        "slurs": len(list(part.iter_all(ps.Slur))),
    }


def compare_readers(p: dict, x: dict) -> dict:
    """Disagreements between partitura (p) and musicxml-io (x), per class, for one file."""
    out: dict[str, list] = {}

    def diff(name, a, b):
        a, b = sorted(map(repr, a)), sorted(map(repr, b))
        if a != b:
            sa, sb = set(a), set(b)
            out[name] = {"partitura_only": sorted(sa - sb)[:5], "musicxml_io_only": sorted(sb - sa)[:5]}

    xn = [n for n in x["notes"] if not n["rest"]]
    xr = [n for n in x["notes"] if n["rest"]]
    diff("pitch", [(n["m"], n["pos"], n["staff"], n["step"], n["alter"], n["octave"]) for n in p["notes"]],
         [(n["m"], n["pos"], n["staff"], n["step"], n["alter"], n["octave"]) for n in xn])
    diff("onset-duration", [(n["m"], n["pos"], n["dur"], n["staff"]) for n in p["notes"]],
         [(n["m"], n["pos"], n["dur"], n["staff"]) for n in xn])
    diff("rests", [(r["m"], r["pos"], r["dur"], r["staff"]) for r in p["rests"]],
         [(r["m"], r["pos"], r["dur"], r["staff"]) for r in xr])
    diff("ties", [(n["m"], n["pos"], n["staff"], n["step"], n["tieStart"], n["tieStop"]) for n in p["notes"]],
         [(n["m"], n["pos"], n["staff"], n["step"], n["tieStart"], n["tieStop"]) for n in xn])
    diff("tuplets", [(n["m"], n["pos"], n["staff"], tuple(n["tm"] or ())) for n in p["notes"]],
         [(n["m"], n["pos"], n["staff"], tuple(n["tm"] or ())) for n in xn])
    diff("key", set(p["keys"]), {m["fifths"] for m in x["measures"]})
    diff("metre", set(p["times"]), {(m["time"]["beats"], m["time"]["beatType"]) for m in x["measures"]})
    diff("bars", [len(p["measures"])], [len(x["measures"])])
    diff("articulations", [sum(n["articulations"] for n in p["notes"]), p["slurs"]], [x["articulations"], x["slurs"]])
    return out


# --------------------------------------------------------------------------- measures


def bar_length(divs: int, beats: int, beat_type: int) -> int:
    return beats * divs * 4 // beat_type


def bar_sums_partitura(p: dict, length: int) -> list[str]:
    """Each measure is `length` long, and every (staff, voice) covers it exactly once."""
    faults = []
    for i, (a, b) in enumerate(p["measures"]):
        if b - a != length:
            faults.append(f"bar {i + 1}: measure is {b - a} divisions, metre {length}")
        cover = defaultdict(list)
        for e in [*p["notes"], *p["rests"]]:
            if e["m"] == i:
                cover[(e["staff"], e["voice"])].append((e["pos"], e["pos"] + e["dur"]))
        for key, spans in cover.items():
            spans = sorted(set(spans))
            at = 0
            for s, e in spans:
                if s > at:
                    faults.append(f"bar {i + 1} staff {key[0]} voice {key[1]}: gap at {at}")
                    break
                at = max(at, e)
            if at != length:
                faults.append(f"bar {i + 1} staff {key[0]} voice {key[1]}: fills {at} of {length}")
    return faults


def bar_sums_mxio(x: dict, length: int, bars: int) -> list[str]:
    faults = []
    for i in range(bars):
        sums = defaultdict(int)
        for n in x["notes"]:
            if n["m"] == i and not n["chord"]:
                sums[(n["staff"], n["voice"])] += n["dur"]
        for key, total in sums.items():
            if total != length:
                faults.append(f"bar {i + 1} staff {key[0]} voice {key[1]}: sums {total} of {length}")
    return faults


# --------------------------------------------------------------------------- detectors


def top_line(notes: list, staff: int) -> list:
    """The highest struck pitch at each onset of one staff, tie continuations dropped."""
    by_t = {}
    for n in notes:
        if n["staff"] != staff or n["tieStop"]:
            continue
        if n["t"] not in by_t or n["midi"] > by_t[n["t"]]["midi"]:
            by_t[n["t"]] = n
    return [by_t[t] for t in sorted(by_t)]


def moves(line: list) -> list[tuple[int, dict, dict]]:
    return [(abs(dia(b["step"], b["octave"]) - dia(a["step"], a["octave"])), a, b) for a, b in zip(line, line[1:])]


def detect(p: dict, metre: tuple[int, int], fifths: int, two_staves: bool) -> dict:
    notes, rests, divs = p["notes"], p["rests"], p["divs"]
    beats, beat_type = metre
    compound = beat_type == 8 and beats % 3 == 0
    beat = divs * 3 // 2 if compound else divs * 4 // beat_type
    scale = {pp.name for pp in m21key.KeySignature(fifths).asKey("major").getScale().getPitches()}
    found: dict[str, int] = defaultdict(int)
    sounding_staves = sorted({n["staff"] for n in notes})
    for n in notes:
        if p["clefs"].get(n["staff"]) == "F":
            found["clef.bass"] += 1
        clef = p["clefs"].get(n["staff"], "G")
        d = dia(n["step"], n["octave"])
        if (clef == "G" and d < dia("C", 4)) or (clef == "F" and d > dia("C", 4)):
            found["pitch.ledger"] += 1
        if m21name(n["step"], n["alter"]) not in scale:
            found["pitch.chromatic"] += 1
        if n["tieStart"] or n["tieStop"]:
            found["rhythm.ties"] += 1
        if n["tm"] and n["tm"][0] == 3 and n["tm"][1] == 2:
            found["rhythm.triplets"] += 1
    for e in [*notes, *rests]:
        if e["type"] == "eighth" and not e["tm"]:
            found["rhythm.eighths"] += 1
        if e["type"] == "16th":
            found["rhythm.sixteenths"] += 1
    for n in notes:
        if n["dur"] < divs:
            found["rhythm.shorter-than-quarter"] += 1
        if n["type"] == "quarter" and n["dots"] == 1:
            found["compoundDottedQuarters" if compound else "rhythm.dotted-quarter"] += 1
        if not n["tieStop"] and n["pos"] % beat != 0:
            nxt = (n["pos"] // beat + 1) * beat
            if n["pos"] + (n["tiedDur"] or n["dur"]) > nxt:
                found["rhythm.syncopation"] += 1
    if compound:
        found["metre.compound"] += 1
    if beats == 3 and beat_type == 4:
        found["metre.triple"] += 1
    if fifths != 0:
        found["key.signature"] += 1
    for staff in sounding_staves:
        line = top_line(notes, staff)
        for size, _a, _b in moves(line):
            if size == 1:
                found["interval.step"] += 1
            elif size == 2:
                found["interval.skip"] += 1
            elif size >= 3:
                found["interval.leap"] += 1
        ds = [dia(n["step"], n["octave"]) for n in notes if n["staff"] == staff]
        if ds and max(ds) - min(ds) > 4:
            found["range.beyond-position"] += 1
    if len(sounding_staves) >= 2:
        spans = {s: [(n["t"], n["t"] + n["dur"]) for n in notes if n["staff"] == s] for s in sounding_staves}
        a, b = sounding_staves[0], sounding_staves[1]
        if any(s1 < e2 and s2 < e1 for s1, e1 in spans[a] for s2, e2 in spans[b]):
            found["texture.hands-together"] += 1
    if two_staves:
        lower = [n for n in notes if n["staff"] == 2]
        bars = defaultdict(list)
        for n in lower:
            bars[n["m"]].append(n)
        quarters, walking = 0, 0
        for m, ns in bars.items():
            onsets = {n["t"] for n in ns}
            if len(onsets) >= 2 and len({n["midi"] for n in ns}) >= 2:
                found["texture.left-hand-pattern"] += 1
        ms = sorted(bars)
        for m, nxt in zip(ms, ms[1:]):
            ns = sorted(bars[m], key=lambda n: n["t"])
            if not compound and len(ns) == beats and len({n["t"] for n in ns}) == beats and all(n["dur"] == beat for n in ns):
                quarters += 1
                first_next = min(bars[nxt], key=lambda n: n["t"])
                if abs(first_next["midi"] - ns[-1]["midi"]) == 1:
                    walking += 1
        if quarters and quarters * 2 >= max(1, len(ms) - 1):
            found["lowerStaffQuarterPerBeat"] += 1
        if walking and walking * 2 >= max(1, len(ms) - 1):
            found["texture.walking-bass"] += 1
    return dict(found)


# --------------------------------------------------------------------------- the properties


def expected_keys(options: dict, level: int) -> set[int]:
    f = options.get("fifths", 0)
    asked = f if isinstance(f, list) else [f]
    m = LEVEL[level]["maxFifths"]
    return {max(-m, min(m, k)) for k in asked}


def expected_metres(options: dict) -> set[tuple[int, int]]:
    t = options.get("timeSig")
    if t is None:
        return {(4, 4)}
    ts = t if isinstance(t, list) else [t]
    return {(x["beats"], x["beatType"]) for x in ts}


def envelope(options: dict, level: int, fifths: int) -> dict:
    spec = LEVEL[level]
    hands = options.get("hands", "both")
    rh = list(spec["rh"])
    lh = list(LEVEL[LEFT_HAND_HOME[options["leftHand"]]]["lh"] if options.get("leftHand") else spec["lh"])
    if options.get("ledger") is False:
        rh = [max(rh[0], 60), min(rh[1], 79)]
        lh = [max(lh[0], 41), min(lh[1], 60)]
    if level == 1 and hands == "L":
        mel = list(hand_position(fifths, 48)) if options.get("position") else list(spec["lh"])
        return {"staff2": mel, "staff1": None}
    if options.get("position") is True:
        rh = list(hand_position(fifths, 60))
    elif options.get("ledger") is True:
        rh[0] = min(rh[0], 57)
    return {"staff1": rh, "staff2": lh}


def melody_staff(options: dict, level: int) -> int | None:
    hands = options.get("hands", "both")
    if hands == "L":
        return 2 if level == 1 else None
    return 1


def leap_cap(options: dict, level: int) -> int:
    cap = LEVEL[level]["maxLeap"]
    if options.get("skips") is True:
        cap = max(cap, 2)
    if options.get("leaps") is True:
        cap = max(cap, 3)
    if options.get("leaps") is False:
        cap = min(cap, 2)
    if options.get("skips") is False:
        cap = 1
    return cap


def strong_beats(metre: tuple[int, int], divs: int) -> list[int]:
    beats, beat_type = metre
    if beat_type == 8 and beats % 3 == 0:
        return [i * divs * 3 // 2 for i in range(0, beats // 3, 2)] or [0]
    q = divs * 4 // beat_type
    if beats == 4:
        return [0, 2 * q]
    return [0]


def bar_chord(lh: list, fifths: int) -> tuple[set[int], str]:
    """The pitch classes of the chord a left-hand bar spells (music21), and how it was found."""
    if not lh:
        return set(), "none"
    names = [m21name(n["step"], n["alter"]) + str(n["octave"]) for n in sorted(lh, key=lambda n: (n["t"], n["midi"]))]
    c = m21chord.Chord(names)
    if c.isTriad() or c.isSeventh():
        return {pp.pitchClass for pp in c.pitches}, "music21 chord of the bar"
    first = sorted(lh, key=lambda n: (n["t"], n["midi"]))[0]
    k = m21key.KeySignature(fifths).asKey("major")
    degree = k.getScaleDegreeFromPitch(m21pitch.Pitch(m21name(first["step"], first["alter"])))
    if degree is None:
        return {pp.pitchClass for pp in c.pitches}, "music21 pitch set (bass not diatonic)"
    triad = [k.pitchFromDegree(((degree - 1 + i) % 7) + 1) for i in (0, 2, 4)]
    return {pp.pitchClass for pp in triad}, "diatonic triad on the bar's first bass note (music21)"


PROPERTY_CLASSES = {
    1: {"key", "pitch"}, 2: {"metre", "onset-duration", "rests", "tuplets"}, 3: {"bars"}, 4: {"pitch"},
    5: {"pitch"}, 6: {"pitch", "onset-duration"}, 7: {"pitch", "onset-duration", "rests", "ties", "tuplets", "key", "metre"},
    11: {"pitch", "onset-duration"},
}


def check_item(item: dict, res: dict, path: Path, mx: dict, taught: dict) -> dict:
    options = res["options"]
    level = int(options["level"])
    row = {"id": item["id"], "stratum": item["stratum"], "level": level, "outcome": res["outcome"],
           "expected": item["expected"]["outcome"], "props": {}, "notes": {}}
    reasons = res.get("unrealisable") or []
    if res["outcome"] == "REFUSE":
        row["props"] = {k: "NA" for k in range(1, 12)}
        row["props"][9] = "PASS" if res["deterministic"] else "FAIL"
        row["props"][10] = "PASS" if res.get("reasons") else "FAIL"
        row["notes"][10] = list(res.get("reasons") or [])[:3]
        return row
    p = read_partitura(path)
    disagree = compare_readers(p, mx) if "error" not in mx else {"parse": [mx["error"]]}
    row["disagree"] = disagree
    divs = p["divs"]
    metre = p["times"][0] if p["times"] else (4, 4)
    fifths = p["keys"][0] if p["keys"] else 0
    hands = options.get("hands", "both")
    two_staves = hands == "both" and level >= 2
    found = detect(p, metre, fifths, two_staves)
    row["detected"] = found
    row["written"] = {"fifths": fifths, "metre": list(metre), "bars": len(p["measures"]),
                      "articulations": sum(n["articulations"] for n in p["notes"]), "slurs": p["slurs"],
                      "mxio_articulations": mx.get("articulations"), "mxio_slurs": mx.get("slurs")}
    props, notes = {}, {}

    # 1 key, and every pitch diatonic unless accidentals are promised
    keys_ok = set(p["keys"]) <= expected_keys(options, level) and len(set(p["keys"])) == 1
    chromatic = [f"bar {n['m'] + 1}: {m21name(n['step'], n['alter'])}{n['octave']}" for n in p["notes"]
                 if m21name(n["step"], n["alter"]) not in
                 {pp.name for pp in m21key.KeySignature(fifths).asKey("major").getScale().getPitches()}]
    allow_chromatic = options.get("accidentals") is True
    props[1] = "PASS" if keys_ok and (allow_chromatic or not chromatic) else "FAIL"
    if props[1] == "FAIL":
        notes[1] = {"written": p["keys"], "expected": sorted(expected_keys(options, level)), "chromatic": chromatic[:3]}

    # 2 metre and bar sums, both readers
    length = bar_length(divs, *metre)
    sums_p = bar_sums_partitura(p, length)
    sums_x = bar_sums_mxio(mx, length, len(mx["measures"])) if "notes" in mx else ["unread"]
    metre_ok = set(p["times"]) <= expected_metres(options) and len(set(p["times"])) == 1
    props[2] = "PASS" if metre_ok and not sums_p and not sums_x else "FAIL"
    if props[2] == "FAIL":
        notes[2] = {"written": p["times"], "expected": sorted(expected_metres(options)), "partitura": sums_p[:3],
                    "musicxml-io": sums_x[:3]}
    if bool(sums_p) != bool(sums_x):
        disagree.setdefault("bar-sums", {"partitura": sums_p[:3], "musicxml-io": sums_x[:3]})

    # 3 bars
    want_bars = max(1, min(32, options.get("bars", 4)))
    props[3] = "PASS" if len(p["measures"]) == want_bars and len(mx.get("measures", [])) == want_bars else "FAIL"
    if props[3] == "FAIL":
        notes[3] = {"partitura": len(p["measures"]), "musicxml-io": len(mx.get("measures", [])), "expected": want_bars}

    # 4 hands and staves
    sounding = sorted({n["staff"] for n in p["notes"]})
    want = {"R": [1], "L": [2], "both": [1, 2] if level >= 2 else [1]}[hands]
    clef_ok = hands != "L" or p["clefs"].get(2) == "F"
    props[4] = "PASS" if sounding == want and clef_ok else "FAIL"
    if props[4] == "FAIL":
        notes[4] = {"sounding": sounding, "expected": want, "clefs": p["clefs"]}

    # 5 range per hand within the level spec, and A0-C8
    env = envelope(options, level, fifths)
    out_of = []
    for staff in (1, 2):
        lim = env.get(f"staff{staff}")
        ns = [n for n in p["notes"] if n["staff"] == staff]
        if not ns:
            continue
        lo, hi = min(n["midi"] for n in ns), max(n["midi"] for n in ns)
        if lim is None or lo < lim[0] or hi > lim[1] or lo < 21 or hi > 108:
            out_of.append({"staff": staff, "low": lo, "high": hi, "envelope": lim})
    props[5] = "PASS" if not out_of else "FAIL"
    if out_of:
        notes[5] = out_of

    # 6 melodic interval cap; within one position at L1 and with position: true
    mstaff = melody_staff(options, level)
    if mstaff is None:
        props[6] = "NA"
    else:
        line = top_line(p["notes"], mstaff)
        cap = leap_cap(options, level)
        over = []
        witness_mismatch = 0
        for size, a, b in moves(line):
            w = m21interval.Interval(m21pitch.Pitch(m21name(a["step"], a["alter"]) + str(a["octave"])),
                                     m21pitch.Pitch(m21name(b["step"], b["alter"]) + str(b["octave"])))
            if w.generic.undirected - 1 != size:
                witness_mismatch += 1
            if size > cap:
                over.append(f"bar {b['m'] + 1}: {m21name(a['step'], a['alter'])}{a['octave']}->"
                            f"{m21name(b['step'], b['alter'])}{b['octave']} ({w.generic.undirected}th-class, "
                            f"{size} steps > cap {cap})")
        span_fault = None
        if level == 1 or options.get("position") is True:
            ds = [dia(n["step"], n["octave"]) for n in line]
            if ds and max(ds) - min(ds) > 4:
                span_fault = f"melody spans {max(ds) - min(ds)} steps, more than one five-finger position"
        props[6] = "PASS" if not over and not span_fault and not witness_mismatch else "FAIL"
        if props[6] == "FAIL":
            notes[6] = {"over": over[:3], "span": span_fault, "witnessMismatch": witness_mismatch}

    # 7 the rung's hold, and every promise present
    check_rung = item.get("checkRung")
    untaught = []
    if check_rung:
        t = set(taught[check_rung])
        order = TAUGHT_ORDER
        if "metre.triple" in found and order.index(check_rung) < order.index(TRIPLE_TAUGHT_AT) and \
                check_rung in CORE_SET:
            untaught.append("metre.triple")
        untaught += [d for d in found if d in VOCAB and d not in t]
    compound = metre[1] == 8 and metre[0] % 3 == 0
    missing, waived, kept_out_broken = [], [], []
    for opt, demand in PROMISE_DEMAND.items():
        if options.get(opt) is True and demand not in found:
            if compound and opt in SIMPLE_TIME_ONLY:
                waived.append(opt)
            else:
                missing.append(opt)
        if options.get(opt) is False and demand in found:
            kept_out_broken.append(opt)
    if options.get("position") is True and found.get("range.beyond-position") and mstaff is not None:
        line = top_line(p["notes"], mstaff)
        ds = [dia(n["step"], n["octave"]) for n in line]
        if ds and max(ds) - min(ds) > 4:
            kept_out_broken.append("position")
    if options.get("position") is False and "range.beyond-position" not in found:
        missing.append("position:false")
    # P7 is the rung's hold and the promises (true); a keep-out (false) not honoured is P10's.
    props[7] = "PASS" if not untaught and not missing else "FAIL"
    if untaught or missing or kept_out_broken or waived:
        notes[7] = {"untaught": untaught, "missing": missing, "keptOutBroken": kept_out_broken,
                    "waivedInCompound": waived, "checkRung": check_rung}

    # 8 playable hand distribution: the physical gate's own limits
    facts = fc.physical_facts(converter.parse(str(path)))
    faults = []
    for hand, f in facts["hands"].items():
        if f["span"] > fc.AN_OCTAVE:
            faults.append(f"{hand}: span {f['span']}")
        for shift, seconds, where in f["moves"]:
            if shift > fc.AN_OCTAVE:
                faults.append(f"{hand}: moves {shift:g} semitones at quarter {where:g}")
        if f["low"] < 21 or f["high"] > 108:
            faults.append(f"{hand}: register {f['low']}-{f['high']}")
    props[8] = "PASS" if not faults else "FAIL"
    if faults:
        notes[8] = faults[:3]
    row["physical"] = {h: {"span": f["span"], "maxMove": max([m[0] for m in f["moves"]] or [0])}
                       for h, f in facts["hands"].items()}

    # 9 determinism
    props[9] = "PASS" if res["deterministic"] else "FAIL"

    # 10 never silent
    silent = []
    if not keys_ok and not any("key" in r for r in reasons):
        silent.append("key")
    if not metre_ok:
        silent.append("metre")
    for opt in missing + kept_out_broken + waived:
        if not names(opt, reasons):
            silent.append(opt)
    props[10] = "PASS" if not silent else "FAIL"
    if silent:
        notes[10] = {"notAsAskedAndUnnamed": silent, "unrealisable": reasons}

    # 11 chord tones on the strong beats at L5-L7 with a left hand
    if LEVEL[level]["chordTones"] and two_staves:
        sb = strong_beats(metre, divs)
        off = []
        how = set()
        for m in range(len(p["measures"])):
            lh = [n for n in p["notes"] if n["staff"] == 2 and n["m"] == m]
            pcs, h = bar_chord(lh, fifths)
            how.add(h)
            for n in p["notes"]:
                if n["staff"] == 1 and n["m"] == m and not n["tieStop"] and n["pos"] in sb:
                    if n["midi"] % 12 not in pcs:
                        off.append(f"bar {m + 1} beat-pos {n['pos']}: {m21name(n['step'], n['alter'])}{n['octave']} "
                                   f"not in {sorted(pcs)}")
        row["p11"] = {"strongBeatNotes": sum(1 for n in p["notes"] if n["staff"] == 1 and not n["tieStop"]
                                             and n["pos"] in sb), "chord": sorted(how)}
        props[11] = "PASS" if not off else "FAIL"
        if off:
            notes[11] = {"off": off[:3], "count": len(off), "chord": sorted(how)}
    else:
        props[11] = "NA"

    # readers disagree: the property is not established for this file
    for prop, classes in PROPERTY_CLASSES.items():
        if props.get(prop) in ("PASS", "FAIL") and classes & set(disagree):
            props[prop] = "NOT-ESTABLISHED"
    row["props"] = props
    row["notes"] = notes
    return row


# The words an `unrealisable()` sentence uses for each control, read from its sentences in
# `sightReading.ts:1132-1240` (a sentence naming the control counts as naming it). Widened after
# the first Hypothesis run, whose H1 counterexample was this list's own miss ("The left hand's
# roots move between I, IV and V, by fourths and fifths" names `leaps: false`).
PROMISE_WORDS = {"eighths": ("eighth",), "syncopation": ("syncopat",), "triplets": ("triplet",),
                 "skips": ("step", "third"), "leaps": ("leap", "fourth"), "ties": ("tie",),
                 "ledger": ("ledger",), "position": ("position",), "dottedQuarters": ("dotted",),
                 "sixteenths": ("sixteenth",), "accidentals": ("accidental",)}


def names(opt: str, reasons: list[str]) -> bool:
    """Whether one of `unrealisable()`'s sentences names this control.

    "From level 2 the left hand read alone plays its accompaniment, with no melody for these
    options to shape." names every shaping control at once (`sightReading.ts:1164-1170`).
    """
    if any("no melody for these options to shape" in r for r in reasons):
        return True
    return any(word in r.lower() for r in reasons for word in PROMISE_WORDS.get(opt, (opt,)))


#: Promises the generator asks only of phrases in simple time (T37 for syncopation and triplets,
#: `sightReading.ts:1033-1041`; C4b for the dotted quarter, `sightReading.ts:96-99`, "in compound
#: time it is the beat, not a dotted note"). A compound phrase drawn from a mixed metre list
#: without them is counted as this declared waiver; `unrealisable()` names it only for a list
#: whose every metre is compound.
SIMPLE_TIME_ONLY = ("syncopation", "triplets", "dottedQuarters")
TAUGHT_ORDER: list[str] = []
CORE_SET: set[str] = set()
VOCAB: set[str] = set()


def main() -> None:
    run = Path(sys.argv[1])
    manifest = json.loads((HERE / "MANIFEST.json").read_text(encoding="utf-8"))
    results = {r["id"]: r for r in json.loads((run / "results.json").read_text(encoding="utf-8"))}
    mxio = json.loads((run / "mxio.json").read_text(encoding="utf-8"))
    taught_doc = json.loads((run.parent / "taught.json").read_text(encoding="utf-8"))
    TAUGHT_ORDER.extend(taught_doc["order"])
    CORE_SET.update(r for r in taught_doc["order"] if r[0].isdigit())
    vocab = json.loads((WORKTREE / "content" / "curriculum" / "vocabulary" / "demands.json").read_text(encoding="utf-8"))
    VOCAB.update(d["id"] for d in vocab["demands"])
    rows = []
    for item in manifest["items"]:
        res = results[item["id"]]
        rows.append(check_item(item, res, run / "items" / f"{item['id']}.musicxml", mxio.get(item["id"], {}),
                               taught_doc["taught"]))
    (run / "checks.json").write_text(json.dumps(rows, indent=1, default=list), encoding="utf-8")
    by = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    for r in rows:
        for k, v in r["props"].items():
            by[r["stratum"]][k][v] += 1
    for s, props in by.items():
        print(s, {k: dict(v) for k, v in sorted(props.items())})
    dis = [r["id"] for r in rows if r.get("disagree")]
    print("reader disagreements:", len(dis), dis[:10])


if __name__ == "__main__":
    main()
