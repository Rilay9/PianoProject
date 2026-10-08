"""
The one shared reading of a score for the classifier's measurements (docs/classifier/README.md).

Every measuring module reads notes through `load` and returns `Result`s; nothing else in
tools/classifier parses MusicXML for measurement. (The proving run's raw reader in
prove_exists.py is the independent witness and stays separate on purpose.)

- Events: partitura's note array (a library): onset and duration in quarters and beats,
  pitch and spelling, staff, voice, key and time signature, position in the measure.
- Hands, one rule for every module: a part with two staves gives staff 1 to the right hand
  and staff 2 to the left; two one-staff parts give part 0 to the right and part 1 to the
  left; a single staff takes the catalogue's declared hand (`hands`: left gives L, anything
  else R), which is how the app reads it (extractScoreModel's declaredHand).
- Measures: the 0-based index of each note's measure in its part, and whether measure 0 is
  a pickup (shorter than its time signature).

A `Result` is a value with its provenance, or UNKNOWN with the reason. Provenance is one of
exact, two-witnesses, one-witness, inferred, metadata. An inferred value carries a
confidence in [0, 1]. A measurement that cannot be established says UNKNOWN; it never guesses.
"""
from __future__ import annotations

import warnings
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "app/public/content"
PROVENANCE = ("exact", "two-witnesses", "one-witness", "inferred", "metadata")


@dataclass
class Result:
    value: Any = None
    provenance: str | None = None
    confidence: float | None = None
    unknown: str | None = None
    where: list[int] = field(default_factory=list)  # 0-based measure indices where it was found, when it has places

    def __post_init__(self) -> None:
        if self.unknown is None:
            if self.provenance not in PROVENANCE:
                raise ValueError(f"provenance must be one of {PROVENANCE}")
            if self.provenance == "inferred" and self.confidence is None:
                raise ValueError("an inferred value carries a confidence")

    @classmethod
    def unknown_because(cls, why: str) -> "Result":
        return cls(unknown=why)

    def to_json(self) -> dict:
        if self.unknown is not None:
            return {"unknown": self.unknown}
        out = {"value": self.value, "provenance": self.provenance}
        if self.confidence is not None:
            out["confidence"] = round(float(self.confidence), 3)
        if self.where:
            out["where"] = self.where
        return out


@dataclass
class Score:
    item: dict
    path: Path
    part_score: Any  # the partitura Score
    notes: np.ndarray  # partitura note array with staff, time signature, key, metrical position, spelling
    hand: np.ndarray  # "R" or "L" per note, same order as notes
    measure: np.ndarray  # 0-based measure index per note
    measure_starts: list[float]  # onset in quarters of each measure of part 0
    pickup: bool
    staves: int
    parts: int


def load(item: dict, content: Path = CONTENT) -> Score:
    import partitura as pt

    path = content / item["file"]
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        sc = pt.load_musicxml(str(path))
        arrays, hands, measures = [], [], []
        staves = max((max((n.staff or 1) for n in p.notes) if p.notes else 1) for p in sc.parts) if sc.parts else 1
        starts: list[float] = []
        for pi, part in enumerate(sc.parts):
            na = part.note_array(include_staff=True, include_time_signature=True, include_metrical_position=True,
                                 include_key_signature=True, include_pitch_spelling=True)
            q = part.quarter_map
            m_starts = [float(q(m.start.t)) for m in part.measures]
            if pi == 0:
                starts = m_starts
            idx = np.searchsorted(np.array(m_starts), na["onset_quarter"], side="right") - 1 if m_starts else np.zeros(len(na), int)
            if len(sc.parts) == 1 and staves <= 1:
                h = np.full(len(na), "L" if item.get("hands") == "left" else "R")
            elif len(sc.parts) >= 2 and staves <= 1:
                h = np.full(len(na), "R" if pi == 0 else "L")
            else:
                h = np.where(na["staff"] == 1, "R", "L")
            arrays.append(na)
            hands.append(h)
            measures.append(idx)
    notes = np.concatenate(arrays) if arrays else np.array([])
    pickup = False
    if len(notes) and len(starts) > 1:
        first = notes[measures[0] == 0] if len(measures) else notes[:0]
        if len(first):
            full = float(first["ts_beats"][0]) * 4.0 / float(first["ts_beat_type"][0])
            pickup = (starts[1] - starts[0]) < full - 1e-6
    return Score(item=item, path=path, part_score=sc, notes=notes,
                 hand=np.concatenate(hands) if hands else np.array([]),
                 measure=np.concatenate(measures) if measures else np.array([], int),
                 measure_starts=starts, pickup=pickup, staves=staves, parts=len(sc.parts))


# --------------------------------------------------------------------------- the registry
#: characteristic id -> function(Score) -> Result. Each measuring module registers its own ids
#: with `measures(...)`; a characteristic id is registered once (one definition per fact).
REGISTRY: dict[str, Callable[[Score], Result]] = {}


def measures(cid: str) -> Callable:
    def wrap(fn: Callable[[Score], Result]) -> Callable[[Score], Result]:
        if cid in REGISTRY:
            raise ValueError(f"{cid} is registered twice")
        REGISTRY[cid] = fn
        return fn
    return wrap
