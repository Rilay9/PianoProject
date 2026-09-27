#!/usr/bin/env python3
"""
What each generator family is for, read from one table, and the gates that hold it (D0).

`family_contracts.json` beside this file is the table: one row per maker in
`generate_exercises.py`, stating the family's target skill (from the vocabulary, or
"not judged by the app" with the candidate recorded), the demands it must provide at a
useful density and the ones it must not bring, its physical constraints, its role, its
promise (a drill or music), what the app can and cannot judge of it, and what it cannot
prove. It is data rather than docstrings so that the generator, the build's gates and a
later brief (D4's canonical -> variable -> transfer sequences) all read the same row.

This module owns the table's reading and the gates:

* **structural** is the existing suite (`test_generator_invariants.py` and the `confirm_*`
  guards in the generator), preserved and not restated here;
* **pedagogical** (`pedagogical_faults`) reads the demands the app's own detectors measured
  on the generated file (`demands.measure_opportunities`, never the recipe's parameters) and
  checks presence, useful density, overconcentration and absence as the row states them;
* **physical** (`physical_faults`) reads the score: the widest chord one hand strikes, a
  move of the hand beyond an octave and the time it has, a fast repeated note and its
  solution, the fastest rate in one hand, continuous playing, the keys, the printed
  fingering against its source, and a printed crossing that goes against the hand;
* **musical** (`musical_gate`) is only the hook: a `music` family is marked "not
  evaluated" until the sight-reading and study briefs (D1, D3) and the human review (D2)
  fill it, and a drill is never judged as music, so its repetition is never a defect.

Nothing here decides a demand. A demand has one definition and it is the app's
(`app/src/demands/detect.ts`, `docs/03` "A demand has one definition").
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Iterable

HERE = Path(__file__).resolve().parent
CONTRACTS = HERE / "family_contracts.json"
VOCABULARY = HERE.parents[1] / "content" / "curriculum" / "vocabulary"

#: The promises a family can make (Part 15 §5): a drill is judged as a drill, and only a
#: family promising music is ever held to a musical standard.
PROMISES = ("drill", "music")
ROLES = ("canonical", "variable", "transfer")
#: The inputs a run can judge from. The assessment declaration names one of these for
#: every judged quality, so a family cannot claim a quality from an input nothing reads.
INPUTS = ("pitch", "onset-timing", "note-off", "velocity", "cc64-timing", "cc64-value")
#: The sources the fingering tables rest on (T53-T53c; entries 84-86).
FINGERING_PRINT = ("printed", "where-sourced", "none")

#: A hand's reach at once, and the move beyond which the hand leaves its place: an octave.
#: `test_generator_invariants.AN_OCTAVE` draws the same line for the chord.
AN_OCTAVE = 12
#: A same-pitch repeat faster than this needs a printed change of finger or a declared
#: solution. Three repeats to a beat at 80 are 0.25 s apart; below 0.3 s one finger
#: re-striking is the slow way to play it.
FAST_REPEAT_SECONDS = 0.3


# --------------------------------------------------------------------------------------
# the table
# --------------------------------------------------------------------------------------


@lru_cache(maxsize=1)
def table() -> dict:
    return json.loads(CONTRACTS.read_text(encoding="utf-8"))


def contracts() -> dict[str, dict]:
    return table()["families"]


def contract(family: str) -> dict:
    return contracts()[family]


@lru_cache(maxsize=1)
def vocabulary() -> tuple[dict[str, dict], dict[str, dict]]:
    skills = json.loads((VOCABULARY / "skills.json").read_text(encoding="utf-8"))["skills"]
    demands = json.loads((VOCABULARY / "demands.json").read_text(encoding="utf-8"))["demands"]
    return {s["id"]: s for s in skills}, {d["id"]: d for d in demands}


def recipe_of(entry: dict) -> dict:
    """What a rule's `when` is matched against: the drill params and the hands."""
    params = dict((entry.get("drill") or {}).get("params") or {})
    params.setdefault("hands", entry.get("hands"))
    return params


def matches(when: dict | None, recipe: dict) -> bool:
    """`when` holds param -> value or list of values; every key must match."""
    for name, wanted in (when or {}).items():
        have = recipe.get(name)
        allowed = wanted if isinstance(wanted, list) else [wanted]
        if have not in allowed:
            return False
    return True


def selected(rules: Iterable[dict] | None, recipe: dict) -> list[dict]:
    return [rule for rule in rules or [] if matches(rule.get("when"), recipe)]


def primary_skill(row: dict, recipe: dict) -> str | None:
    """The first primary rule whose `when` matches, or None: "not judged by the app"."""
    for rule in row["target"]["primary"]:
        if matches(rule.get("when"), recipe):
            return rule["skill"]
    return None


def target_skills(row: dict, recipe: dict) -> list[str]:
    """
    The item's `targetSkills`: the primary first, then the secondaries that apply.

    Where the primary is not judged, nothing is written, not even a secondary: the field
    reads primary-first (the design's §7, the nine reading rows), and a secondary in
    first place would claim it as what the item is for. The secondaries stay in the table.
    """
    primary = primary_skill(row, recipe)
    if primary is None:
        return []
    out = [primary]
    for rule in selected(row["target"].get("secondary"), recipe):
        if rule["skill"] not in out:
            out.append(rule["skill"])
    return out


def role_of(row: dict, recipe: dict) -> str:
    """The item's role relative to its primary target skill, by the row's first matching rule."""
    for rule in row["roles"]["assign"]:
        if matches(rule.get("when"), recipe):
            return rule["role"]
    raise KeyError(f"no role rule matches {recipe}")


def identity(family: str, recipe: dict) -> dict:
    """G21: family + recipe (the drill params) + seed + generator version."""
    return {"family": family, "version": contract(family)["version"], "seed": recipe.get("seed")}


def stamp(entry: dict, family: str) -> dict:
    """Writes the contract's facts onto a catalog row: target skills, role, identity."""
    row = contract(family)
    recipe = recipe_of(entry)
    skills = target_skills(row, recipe)
    if skills:
        entry["targetSkills"] = skills
    entry["role"] = role_of(row, recipe)
    entry["drill"]["generator"] = identity(family, recipe)
    return entry


# --------------------------------------------------------------------------------------
# the pedagogical gate: measured demands against the row
# --------------------------------------------------------------------------------------


def _denominator(measured: dict, per: str) -> float:
    return float({"bar": measured["measures"], "note": measured["notes"], "step": measured["steps"]}[per])


def pedagogical_faults(row: dict, recipe: dict, measured: dict) -> list[str]:
    """
    Presence, useful density, overconcentration and absence, on what the detectors found.

    `measured` is one row of `demands.measure_opportunities`. Presence is the demand among
    the ids; density is its located count against the row's minimum (a count, or a count
    per bar, per note or per step); overconcentration is its share of a denominator above
    the row's maximum; absence is a forbidden demand not among the ids. And each target
    skill has to have its opportunity in the music: a contract claiming a skill whose
    demands the file does not contain fails.
    """
    faults: list[str] = []
    present = set(measured["demands"])
    counts = measured["opportunities"]
    for rule in selected(row.get("requires"), recipe):
        demand = rule["demand"]
        n = counts.get(demand, 0)
        if demand not in present:
            faults.append(f"presence: {demand} is required and absent")
            continue
        if "min" in rule and n < rule["min"]:
            faults.append(f"density: {demand} located {n} times, the row asks for {rule['min']}")
        if "minPer" in rule:
            per, least = rule["minPer"]
            share = n / max(_denominator(measured, per), 1.0)
            if share < least:
                faults.append(f"density: {demand} {share:.2f} per {per}, the row asks for {least}")
    for rule in selected(row.get("overconcentration"), recipe):
        demand = rule["demand"]
        share = counts.get(demand, 0) / max(_denominator(measured, rule["of"]), 1.0)
        if share > rule["maxShare"]:
            faults.append(f"overconcentration: {demand} {share:.2f} of the {rule['of']}s, "
                          f"above {rule['maxShare']}")
    for rule in selected(row.get("forbids"), recipe):
        if rule["demand"] in present:
            faults.append(f"forbidden: {rule['demand']} is present")
    skills, _demands = vocabulary()
    for skill in target_skills(row, recipe):
        opportunity = skills[skill]["opportunity"]
        if opportunity != "every-step" and not present & set(opportunity):
            faults.append(f"target: {skill} is claimed and none of {opportunity} is in the music")
    return faults


def untaught_on(rung_index: int, measured: dict, order: list[str]) -> list[str]:
    """The measured demands the curriculum has not taught by the rung at `rung_index`."""
    _skills, demands = vocabulary()
    out = []
    for demand in measured["demands"]:
        at = demands[demand]["taughtAt"]
        if at is None or at not in order or order.index(at) > rung_index:
            out.append(demand)
    return out


# --------------------------------------------------------------------------------------
# the physical gate: the score against the row
# --------------------------------------------------------------------------------------


def _events(part) -> list[tuple[float, float, list[int], list[int]]]:
    """(onset in quarters, length, MIDI numbers, printed fingers) per strike, in order."""
    from music21 import articulations, harmony

    out = []
    for n in part.recurse().notes:
        if isinstance(n, harmony.ChordSymbol):
            continue
        if n.tie is not None and n.tie.type in ("stop", "continue"):
            continue
        fingers = [a.fingerNumber for a in n.articulations if isinstance(a, articulations.Fingering)]
        out.append((float(n.getOffsetInHierarchy(part)), float(n.duration.quarterLength),
                    [p.midi for p in n.pitches], fingers))
    out.sort(key=lambda e: e[0])
    return out


def _seconds_per_quarter(score) -> float:
    from music21 import tempo

    marks = list(score.recurse().getElementsByClass(tempo.MetronomeMark))
    bpm = float(marks[0].number) if marks else 60.0
    return 60.0 / bpm


def hands_of(score) -> dict[str, list]:
    """`{hand: events}` for every staff that sounds; a one-line rhythm staff is one hand."""
    out = {}
    for index, part in enumerate(score.parts):
        events = _events(part)
        if events:
            out[part.id or f"staff-{index}"] = events
    return out


def _windows(events: list, beat: float = 1.0) -> list[list]:
    """The strikes grouped by the beat they fall in: where the hand is, beat by beat."""
    groups: dict[int, list] = {}
    for event in events:
        groups.setdefault(int(event[0] // beat + 1e-9), []).append(event)
    return [groups[k] for k in sorted(groups)]


def hand_moves(events: list, spq: float) -> list[tuple[float, float, float]]:
    """
    (shift in semitones, seconds it has, onset in quarters) between one beat's place and
    the next.

    A hand's place is the middle of what it plays in a beat, so a broken octave or an
    Alberti figure moving by step reads as the step it is, and a stride bass going to its
    chord reads as the leap it is. The time is from the last strike of one beat to the
    first of the next.
    """
    moves = []
    windows = _windows(events)
    for before, after in zip(windows, windows[1:]):
        lo1 = min(m for e in before for m in e[2])
        hi1 = max(m for e in before for m in e[2])
        lo2 = min(m for e in after for m in e[2])
        hi2 = max(m for e in after for m in e[2])
        shift = abs((lo2 + hi2) / 2 - (lo1 + hi1) / 2)
        seconds = (after[0][0] - before[-1][0]) * spq
        moves.append((shift, seconds, after[0][0]))
    return moves


def physical_facts(score) -> dict:
    """What the physical gate reads, per hand, measured from the score."""
    spq = _seconds_per_quarter(score)
    facts: dict = {"hands": {}, "seconds": 0.0}
    for hand, events in hands_of(score).items():
        span = max(max(e[2]) - min(e[2]) for e in events)
        repeats = []
        crossings = []
        fastest = 0.0
        for (o1, _d1, m1, f1), (o2, _d2, m2, f2) in zip(events, events[1:]):
            gap = (o2 - o1) * spq
            if gap <= 0:
                continue
            fastest = max(fastest, 1.0 / gap)
            if len(m1) == 1 and len(m2) == 1:
                if m1 == m2 and gap < FAST_REPEAT_SECONDS:
                    changes = bool(f1 and f2 and f1[0] != f2[0])
                    repeats.append((round(gap, 3), changes, o2))
                if m1 != m2 and len(f1) == 1 and len(f2) == 1:
                    fault = crossing_against_the_hand(hand, m1[0], f1[0], m2[0], f2[0], gap)
                    if fault:
                        crossings.append(f"{fault} at quarter {o2:g}")
        continuous = longest_continuous(events, spq)
        end = max(onset + length for onset, length, _m, _f in events) * spq
        facts["seconds"] = max(facts["seconds"], end)
        fingered = sum(1 for e in events if e[3])
        facts["hands"][hand] = {
            "span": span,
            "moves": hand_moves(events, spq),
            "repeats": repeats,
            "rate": round(fastest, 2),
            "continuous": round(continuous, 2),
            "low": min(m for e in events for m in e[2]),
            "high": max(m for e in events for m in e[2]),
            "fingered": fingered,
            "strikes": len(events),
            "crossings": crossings,
        }
    return facts


def longest_continuous(events: list, spq: float) -> float:
    """The longest stretch of playing with no gap of a beat or more between strikes, in seconds."""
    best = start = 0.0
    last_end = None
    for onset, length, _m, _f in events:
        if last_end is None or onset - last_end >= 1.0:
            start = onset
        last_end = max(last_end or 0.0, onset + length)
        best = max(best, last_end - start)
    return best * spq


def crossing_against_the_hand(hand: str, m1: int, f1: int, m2: int, f2: int, gap: float) -> str | None:
    """
    A printed pair of fingers no hand plays at speed: the same finger on two different keys
    with no time to move (the thumb may slide a step), or a finger passing the wrong way,
    both under `FAST_REPEAT_SECONDS`.

    Right hand going up, the finger number rises unless the thumb passes under (the new
    finger is 1); coming down it falls unless a finger crosses over the thumb (the old
    finger is 1). The left hand is the mirror. A leap (more than an octave) is not a
    crossing: the hand is moving, and the move is judged by `hand_moves`.
    """
    if abs(m2 - m1) > AN_OCTAVE or gap >= FAST_REPEAT_SECONDS:
        # A leap is `hand_moves`' to judge, and with this much time the hand can
        # move to a new place: a walking bass putting 5 on each bar's root is a
        # shift, not a crossing.
        return None
    if f1 == f2:
        # The thumb sliding a step at a turn is Hanon's own print (No. 15); any
        # other finger on two keys this fast has no time to move.
        if f1 == 1 and abs(m2 - m1) <= 2:
            return None
        return f"finger {f1} on two keys {gap:.2f} s apart"
    left = hand in ("LH",)
    up = m2 > m1
    rising = f2 > f1
    if not left:
        if up and not rising and f2 != 1:
            return f"right hand going up {f1}->{f2}"
        if not up and rising and f1 != 1:
            return f"right hand coming down {f1}->{f2}"
    else:
        if up and rising and f1 != 1:
            return f"left hand going up {f1}->{f2}"
        if not up and not rising and f2 != 1:
            return f"left hand coming down {f1}->{f2}"
    return None


def physical_faults(row: dict, recipe: dict, score, entry: dict | None = None) -> list[str]:
    """
    The physical gate: every limit the row states, read against the score.

    - **span**: no hand strikes a chord wider than the row's `maxSpan` (an octave unless a
      large-hand voicing is declared with its prerequisite and its alternative);
    - **leaps**: a move of the hand beyond an octave is a fault unless the row declares the
      family's leaps (`leaps.max`, `leaps.minSeconds`) and the move keeps within them;
    - **repeated notes**: a same-pitch repeat under `FAST_REPEAT_SECONDS` needs a printed
      change of finger, or the row's `repeatedNotes` solution;
    - **rate**: the fastest strikes in one hand at the stated tempo, within `maxRate`;
    - **endurance**: continuous playing within `maxContinuousSeconds`;
    - **register**: every key on the piano (A0 to C8);
    - **fingering**: printed only as the row says, `fingeringVerified` never true without a
      named source, and no printed crossing against the hand.
    """
    physical = row["physical"]
    facts = physical_facts(score)
    faults: list[str] = []
    max_span = physical.get("maxSpan", AN_OCTAVE)
    large = physical.get("largeHand")
    if large is not None and matches(large.get("when"), recipe):
        if not (large.get("prerequisite") and large.get("alternative")):
            faults.append("span: a large-hand voicing is declared without its prerequisite and alternative")
        else:
            max_span = large["span"]
    leaps = physical.get("leaps")
    fingering = physical["fingering"]
    for hand, fact in facts["hands"].items():
        if fact["span"] > max_span:
            faults.append(f"span: {hand} strikes {fact['span']} semitones at once, above {max_span}")
        for shift, seconds, where in fact["moves"]:
            if shift <= AN_OCTAVE:
                continue
            if leaps is None:
                faults.append(f"leap: {hand} moves {shift:g} semitones in {seconds:.2f} s at quarter "
                              f"{where:g}, and the row declares no leaps")
            elif shift > leaps["max"] or seconds < leaps["minSeconds"]:
                faults.append(f"leap: {hand} moves {shift:g} semitones in {seconds:.2f} s at quarter "
                              f"{where:g}, beyond the declared {leaps['max']} in {leaps['minSeconds']} s")
        for gap, changes, where in fact["repeats"]:
            if not changes and not physical.get("repeatedNotes"):
                faults.append(f"repeated note: {hand} re-strikes a key after {gap} s at quarter {where:g} "
                              "with no change of finger printed and no solution declared")
        if fact["rate"] > physical["maxRate"]:
            faults.append(f"rate: {hand} strikes {fact['rate']} a second, above {physical['maxRate']}")
        if fact["continuous"] > physical.get("maxContinuousSeconds", 90):
            faults.append(f"endurance: {hand} plays {fact['continuous']} s without a beat's rest")
        if fact["low"] < 21 or fact["high"] > 108:
            faults.append(f"register: {hand} leaves the keyboard ({fact['low']}-{fact['high']})")
        for crossing in fact["crossings"]:
            faults.append(f"fingering: {hand} {crossing}")
        if fingering["printed"] == "none" and fact["fingered"]:
            faults.append(f"fingering: {hand} prints {fact['fingered']} fingers and the row says none")
    printed = sum(f["fingered"] for f in facts["hands"].values())
    verified = ((entry or {}).get("drill") or {}).get("params", {}).get("fingeringVerified")
    if verified and not fingering.get("source"):
        faults.append("fingering: fingeringVerified is true and the row names no source")
    if fingering["printed"] == "where-sourced" and verified is not None and bool(printed) != bool(verified):
        faults.append(f"fingering: printed {printed} fingers with fingeringVerified {verified}")
    return faults


# --------------------------------------------------------------------------------------
# the musical gate: the hook
# --------------------------------------------------------------------------------------


def musical_gate(row: dict) -> dict:
    """
    Only the hook (D0 item 3): a drill is not judged as music, and a family promising music
    is "not evaluated" until D1 and D3 write the evaluator and D2 records a hearing. Never
    a pass: nothing here can say a generated groove is idiomatic.
    """
    if row["promise"] == "drill":
        return {"applies": False, "why": "a drill is judged as a drill; its repetition is the point"}
    return {"applies": True, "evaluated": False,
            "why": "no musical evaluator yet (D1, D3) and no hearing recorded (D2); unheard"}
