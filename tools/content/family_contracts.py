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
* **musical** (`musical_gate`) evaluates the families whose row names an evaluator — the
  generated study (D3), read by `musical_evaluator.py`, the Python port of D1's scorer with
  the study's multi-phrase and minor semantics — and refuses an item below the row's floor or
  with a cadence on a note outside its chord; a `music` family with no evaluator (the grooves
  and style families) stays "not evaluated": the evaluator judges phrase shape, never idiom,
  and idiom needs hearing (D2). A drill is never judged as music, so its repetition is never
  a defect. A study's pedagogical gate adds one rule of its own, read on the written notes:
  a bar repeated exactly beyond the grammar's restatement (`repetition_faults`).

It also holds what each row's `key` parameter means (`parameters.key`: a tonic, a starting note or a
chord root, `KEY_MEANINGS`), refuses a recipe whose `key` its row gives no meaning (`stamp`), and reads a
written file against the declared meaning (`key_faults`, with its own MusicXML reader; 2026-10-07).

Nothing here decides a demand. A demand has one definition and it is the app's
(`app/src/demands/detect.ts`, `docs/03` "A demand has one definition").

It also owns the generated-identity continuity relation (CL15, `former_generator_identities`):
when a family's version moves, an item whose music did not change carries the identity it had,
proven by its music digest against `generator_continuity.json`, and, after a second bump (G30), the
identities it carried before that too.
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


# --------------------------------------------------------------------------------------
# the generated-identity continuity relation (CL15)
# --------------------------------------------------------------------------------------

#: Each bumped family's items as the catalogue held them at the version the family left, with
#: each item's music digest there (CL15; `former_generator_identities`).
CONTINUITY = HERE / "generator_continuity.json"


def music_digest(sc, entry: dict) -> str:
    """
    The music an item is: every strike's onset, length, written pitches and tie, per staff, and the
    tempo and metre. The identity pins (`tests/fixtures/identity_pins.json`) and the clash test read
    it per family; the continuity relation reads it per item. Moved here from
    `test_family_contracts.py` by CL15 so both read one definition.
    """
    import hashlib

    from music21 import harmony, meter

    parts = []
    for part in sc.parts:
        events = []
        for n in part.recurse().notes:
            if isinstance(n, harmony.ChordSymbol):
                continue
            tie = n.tie.type if n.tie is not None else ""
            events.append((float(n.getOffsetInHierarchy(part)), float(n.duration.quarterLength),
                           tuple(p.nameWithOctave for p in n.pitches), tie))
        parts.append((part.id, sorted(events)))
    signature = next(iter(sc.recurse().getElementsByClass(meter.TimeSignature)), None)
    blob = json.dumps([parts, entry.get("tempoBpm"), signature.ratioString if signature else None])
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


@lru_cache(maxsize=1)
def continuity_table() -> dict:
    return json.loads(CONTINUITY.read_text(encoding="utf-8"))


def former_generator_identities(sc, entry: dict, table: dict | None = None) -> list[dict]:
    """
    The generator identities an item had before its family's version moved, where its music did not
    change (CL15, the reviewer's required change, `docs/review/responses/questions-122a5224.md` §CL15).

    A version belongs to the whole family (`identity`), so a bump moves every item's identity, the
    items whose notes did not change among them. The table records each bumped family's items at the
    version left — the identity the catalogue held (`review.generator_identity`) and the item's
    `music_digest` there — and an item carries its recorded identity only where its digest now is the
    recorded one: proven per item, never by shape or form name. A changed item carries none, so it
    takes the new identity with no link to its old music; a table written for another version than
    the family's now is not read. Learner continuity only (`provenance.formerGeneratorIdentities`,
    `material.learnerMaterial`): D2's exact identity and every family-scoped read keep reading the
    row's own identity.

    A second bump (G30) records with each item the former identities the catalogue already listed for
    it at the version left (`formerGeneratorIdentities` in the table), and an item whose digest still
    matches carries them after the identity it leaves, nearest first: each was proven against that same
    digest by the bump before, so the chain is unbroken music. The app's map is built from the loaded
    catalogue alone (`material.learnFormerIdentities`), so an identity the table dropped here would stop
    resolving for a learner whose run names it.
    """
    generator = (entry.get("drill") or {}).get("generator") or {}
    record = (table if table is not None else continuity_table())["families"].get(generator.get("family"))
    if record is None or record["to"] != generator.get("version"):
        return []
    one = record["items"].get(entry["id"])
    if one is None or one["digest"] != music_digest(sc, entry):
        return []
    return json.loads(json.dumps([one["identity"], *one.get("formerGeneratorIdentities", [])]))


def stamp(entry: dict, family: str) -> dict:
    """Writes the contract's facts onto a catalog row: target skills, role, identity."""
    row = contract(family)
    recipe = recipe_of(entry)
    key_meaning(row, recipe)  # raises for a `key` the row gives no meaning (2026-10-07)
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


def _promises_music(row: dict) -> bool:
    return any(rule["promise"] == "music" for rule in row["promise"])


def musical_gate(row: dict, score=None, entry: dict | None = None) -> dict:
    """
    The musical gate (D0 item 3; D3).

    - A drill: does not apply; its repetition is the point.
    - A music family whose row names an evaluator (`row["musical"]`, the study): the evaluator
      on the written score and the form the item declares (`entry["drill"]["study"]`), refused
      below the row's floor or with any cadence on a note outside its chord. Without the score
      it says it needs the written notes and passes nothing. What it judges is phrase shape
      from the notation: it is never a hearing, and `heard` stays the record's (D2).
    - Any other music family (the grooves and style families): "not evaluated" — the evaluator
      judges phrase shape, not idiom (Part 15 §17), and idiom needs hearing. Never a pass.

    D0's hook compared `row["promise"]`, a list, with the string "drill", so it never matched
    and every family, drills included, read as "not evaluated"; a drill now reads as one.
    """
    promise = "music" if _promises_music(row) else "drill"
    if entry is not None:
        recipe = recipe_of(entry)
        promise = next((rule["promise"] for rule in row["promise"] if matches(rule.get("when"), recipe)),
                       row["promise"][-1]["promise"])
    if promise != "music":
        return {"applies": False, "why": "a drill is judged as a drill; its repetition is the point"}
    musical = row.get("musical")
    if not musical:
        return {"applies": True, "evaluated": False,
                "why": "not evaluated: idiom needs hearing — the evaluator judges phrase shape, not idiom (D3), "
                       "and no hearing is recorded (D2); unheard"}
    if score is None or entry is None:
        return {"applies": True, "evaluated": False, "why": "the evaluator reads the written notes; none given"}
    import musical_evaluator as ME

    facts = (entry.get("drill") or {}).get("study")
    if not facts:
        return {"applies": True, "evaluated": True, "passes": False, "total": 0.0, "parts": {}, "wrong": [],
                "floor": musical["floor"], "why": "the item declares no form for the evaluator to read"}
    scored = ME.score_study(ME.study_model(score, facts))
    passes = scored["total"] >= musical["floor"] and not scored["wrong"]
    why = (f"phrase shape {scored['total']:.3f} against the floor {musical['floor']}"
           + (f"; {'; '.join(scored['wrong'])}" if scored["wrong"] else "")
           + " (notation, not hearing; unheard)")
    return {"applies": True, "evaluated": True, "passes": passes, "total": scored["total"], "parts": scored["parts"],
            "wrong": scored["wrong"], "floor": musical["floor"], "why": why}


def repetition_faults(bars: list[str], restated, allowed: int = 1) -> list[str]:
    """
    A study is not a drill: a bar of the tune repeated exactly — rhythm and pitches — beyond the
    grammar's own restatement is overconcentration, and more than `allowed` such repeats is a
    fault (D1's motif rule lets one exact repeat stand). `bars` holds each bar's melody as a
    comparable string; `restated` the bars the grammar restates, which are never counted.
    """
    repeats = []
    for b in range(1, len(bars)):
        if b in restated:
            continue
        if bars[b] and any(bars[a] == bars[b] for a in range(b)):
            repeats.append(b + 1)
    if len(repeats) > allowed:
        return [f"repetition: bars {', '.join(str(b) for b in repeats)} repeat an earlier bar exactly, "
                "beyond the grammar's restatement"]
    return []


def written_repetition_faults(row: dict, score, entry: dict) -> list[str]:
    """`repetition_faults` on the written tune (the upper staff) of an item whose row states the rule."""
    rule = row.get("repetition")
    if not rule:
        return []
    import musical_evaluator as ME

    bars = [" ".join(f"{n.midi}:{n.duration:g}" for n in bar if not n.chord) for bar in ME.lines_of(score, 0)]
    restated = set(((entry.get("drill") or {}).get("study") or {}).get("restated") or [])
    return repetition_faults(bars, restated, rule["maxUndeclaredExactRepeats"])


# --------------------------------------------------------------------------------------
# what a recipe's `key` means, and the written file against it (2026-10-07)
# --------------------------------------------------------------------------------------

#: The meanings a family's `key` parameter can have (`parameters.key.means` on its row). The proving run
#: (docs/classifier/proving/2026-10-07) read `key` as a tonic on every item and found 100 of 1,134 files
#: disagreeing: the chromatic scale and the seventh-chord families use it for a starting note and a chord
#: root, written with no key signature. Each row now says which, and `key_faults` holds the file to it.
KEY_MEANINGS = {
    "tonic": "the tonic of the file's key signature, in the mode the row's `mode` rules give for the recipe",
    "starting-note": "the pitch class of the first note that sounds (every note struck at that instant)",
    "chord-root": "a root of the first chord, read by pitch class: the first instant three or more pitch "
                  "classes are struck together, or, broken, the pitch classes struck from the first note up to "
                  "the first one heard again; a root is a pitch class on which those pitch classes form one of "
                  "`TERTIAN`'s chords",
}

#: The tertian chords a `chord-root` reading recognises, as pitch-class sets from the root (the triads and
#: the five seventh qualities the generator writes, `generate_exercises.SEVENTH_SPELLING`). By pitch class,
#: not by spelling: the generator respells a double flat as its enharmonic (`_readable`), so C diminished
#: 7th prints A for B double flat, and a spelled reading of those notes names A.
TERTIAN = {
    "major": frozenset({0, 4, 7}), "minor": frozenset({0, 3, 7}), "diminished": frozenset({0, 3, 6}),
    "augmented": frozenset({0, 4, 8}), "dominant7": frozenset({0, 4, 7, 10}), "major7": frozenset({0, 4, 7, 11}),
    "minor7": frozenset({0, 3, 7, 10}), "half-diminished7": frozenset({0, 3, 6, 10}),
    "diminished7": frozenset({0, 3, 6, 9}),
}

_STEPS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
_MAJOR_BY_FIFTHS = ("C-", "G-", "D-", "A-", "E-", "B-", "F", "C", "G", "D", "A", "E", "B", "F#", "C#")
_MINOR_BY_FIFTHS = ("A-", "E-", "B-", "F", "C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#")


def key_meaning(row: dict, recipe: dict) -> dict | None:
    """
    What this recipe's `key` means, from the row: `{"means": ..., "mode": ...}` (mode for a tonic only), or None
    for a recipe with no `key`. A recipe with a `key` its row does not declare raises: the generator refuses to
    write an item whose parameter nobody has said the meaning of (`stamp`).
    """
    if "key" not in recipe:
        return None
    declared = (row.get("parameters") or {}).get("key")
    if not declared or declared.get("means") not in KEY_MEANINGS:
        raise KeyError(f"{row.get('maker')}: the recipe has a key and the row declares no meaning for it "
                       f"(parameters.key.means, one of {sorted(KEY_MEANINGS)})")
    out = {"means": declared["means"]}
    if declared["means"] == "tonic":
        out["mode"] = next(rule["mode"] for rule in declared["mode"] if matches(rule.get("when"), recipe))
    return out


def pitch_class(name: str) -> int:
    """`C`, `F#`, `B-` (music21's spelling, the recipes'), `Bb`: the pitch class."""
    pc = _STEPS[name[0].upper()]
    for accidental in name[1:]:
        pc += {"#": 1, "-": -1, "b": -1}.get(accidental, 0)
    return pc % 12


def _spelled(name: str) -> str:
    """A note name in music21's spelling, upper-case letter: `bb` and `B-` are the same name."""
    return name[0].upper() + name[1:].replace("b", "-")


def written_key_facts(path: Path) -> dict:
    """
    The written file's key signature, first sounding notes and first chord, read from the MusicXML itself
    (`zipfile` and `ElementTree`): an event reader independent of the generator and of music21.

    Returns `signature` (tonic in music21's spelling, mode) or None; `first` (every pitch struck at the first
    instant a pitch sounds, as names with octaves); `chord` (the first chord's pitches, struck or broken, as
    `KEY_MEANINGS["chord-root"]` defines it) or None. A tied continuation is not a strike.
    """
    import zipfile

    if path.suffix == ".mxl":
        with zipfile.ZipFile(path) as archive:
            name = next(n for n in archive.namelist() if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml")))
            return written_key_facts_from_text(archive.read(name))
    return written_key_facts_from_text(path.read_bytes())


def written_key_facts_from_text(text: str | bytes) -> dict:
    """`written_key_facts` on the MusicXML text itself."""
    import xml.etree.ElementTree as ET

    root = ET.fromstring(text)
    out: dict = {"signature": None, "first": [], "chord": None}
    signature = root.find("part/measure/attributes/key")
    if signature is not None and signature.findtext("fifths") is not None:
        fifths, mode = int(signature.findtext("fifths")), (signature.findtext("mode") or "major").strip()
        out["signature"] = ((_MINOR_BY_FIFTHS if mode == "minor" else _MAJOR_BY_FIFTHS)[fifths + 7], mode)
    strikes: list[tuple[float, str, int]] = []
    for part in root.findall("part"):
        start, divisions = 0.0, 1
        for measure in part.findall("measure"):
            pos = longest = last = 0.0
            for el in measure:
                if el.tag == "attributes" and el.findtext("divisions"):
                    divisions = int(el.findtext("divisions"))
                elif el.tag in ("backup", "forward"):
                    pos += (-1 if el.tag == "backup" else 1) * int(el.findtext("duration")) / divisions
                    longest = max(longest, pos)
                elif el.tag == "note":
                    onset = last if el.find("chord") is not None else pos
                    if el.find("chord") is None:
                        last = pos
                        if el.find("grace") is None:
                            pos += int(el.findtext("duration") or 0) / divisions
                        longest = max(longest, pos)
                    pitch = el.find("pitch")
                    ties = {tie.get("type") for tie in el.findall("tie")}
                    if pitch is None or "stop" in ties:
                        continue
                    step, alter = pitch.findtext("step"), int(float(pitch.findtext("alter") or 0))
                    spelled = step + ("#" * alter if alter > 0 else "-" * -alter)
                    strikes.append((start + onset, f"{spelled}{pitch.findtext('octave')}", (_STEPS[step] + alter) % 12))
            start += longest
    if not strikes:
        return out
    by_onset: dict[float, list[tuple[str, int]]] = {}
    for onset, name, pc in sorted(strikes, key=lambda s: s[0]):
        by_onset.setdefault(onset, []).append((name, pc))
    instants = sorted(by_onset)
    out["first"] = [name for name, _pc in by_onset[instants[0]]]
    struck = next((by_onset[t] for t in instants if len({pc for _n, pc in by_onset[t]}) >= 3), None)
    if struck is None:  # broken: from the first note up to the first pitch class heard again
        heard: set[int] = set()
        struck = []
        for t in instants:
            pcs = {pc for _n, pc in by_onset[t]}
            if pcs & heard:
                break
            heard |= pcs
            struck.extend(by_onset[t])
        if len(heard) < 3:
            struck = None
    out["chord"] = [name for name, _pc in struck] if struck else None
    return out


def chord_roots(names: list[str]) -> set[int]:
    """The pitch classes on which these pitches form one of `TERTIAN`'s chords (a diminished 7th has four)."""
    pcs = {pitch_class(name.rstrip("0123456789")) for name in names}
    return {root for root in pcs if frozenset((pc - root) % 12 for pc in pcs) in TERTIAN.values()}


def key_faults(row: dict, entry: dict, path: Path) -> list[str]:
    """
    The written file against the meaning the row declares for the recipe's `key` (`KEY_MEANINGS`): a tonic is
    the signature's tonic, spelled the same, in the declared mode; a starting note is the pitch class of every
    note struck first; a chord root is a root of the first chord. [] for a recipe with no key.
    """
    recipe = recipe_of(entry)
    meaning = key_meaning(row, recipe)
    if meaning is None:
        return []
    declared = str(recipe["key"])
    facts = written_key_facts(path)
    if meaning["means"] == "tonic":
        wanted = (_spelled(declared), meaning["mode"])
        if facts["signature"] != wanted:
            return [f"key: the recipe's tonic is {wanted[0]} {wanted[1]} and the file's signature is "
                    f"{' '.join(facts['signature']) if facts['signature'] else 'absent'}"]
        return []
    if meaning["means"] == "starting-note":
        first = {pitch_class(name.rstrip("0123456789")) for name in facts["first"]}
        if first != {pitch_class(declared)}:
            return [f"key: the recipe's starting note is {declared} and the file starts on {', '.join(facts['first']) or 'nothing'}"]
        return []
    if facts["chord"] is None or pitch_class(declared) not in chord_roots(facts["chord"]):
        return [f"key: the recipe's chord root is {declared} and the file's first chord is "
                f"{', '.join(facts['chord'] or []) or 'absent'}"]
    return []
