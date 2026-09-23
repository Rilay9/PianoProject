#!/usr/bin/env python3
"""Dump what the converter decides, per fixture, for the TypeScript port to match.

The app converts MIDI in the browser (`app/src/import/midi/`), function for
function against `midi_to_musicxml.py`. A port is only a port if it agrees, so
the agreement is tested — and a test needs the other side's answer written
down. This writes it: one JSON file per fixture under `build/midi-parity/`,
holding what each stage of the Python decided.

`build/` is gitignored, exactly as `build/midi-real/` is, so the reference is
produced rather than committed and the port's parity test skips with a message
naming this script when it is absent. That is the same convention
`test_converter.py` already uses for the three recordings, and for the same
reason: the recordings are not redistributable, and a reference derived from
them says as much about them as they do.

Nothing here changes a rule. It reads the converter and reports; the rules live
in `midi_to_musicxml.py` and the harness that checks them is
`test_converter.py`.

Run from the repository root:

    python tools/midi-cleanup/tests/parity_reference.py
"""
from __future__ import annotations

import json
import sys
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from midi_to_musicxml import (  # noqa: E402
    Event,
    convert,
    key_estimate,
    quantise,
    read_midi,
    relative_by_ending,
    split_hands,
)
from test_converter import REAL_DIR, REAL_FILES, FIXTURES, render_midi  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "build" / "midi-parity"

#: The rendered fixture the committed harness round-trips, and the jitter it
#: uses. Both cases, because a clean rendering and a jittered one exercise
#: different halves of the quantiser.
RENDERED = FIXTURES / "exercise.five-finger.c-major.both.mxl"
RENDERED_CASES = ((0.0, "rendered-clean"), (35.0, "rendered-jitter35"))


def f(value: Fraction | float) -> str:
    return str(Fraction(value))


def events_json(events: list[Event]) -> list[list[str | int | None]]:
    return [[f(e.start), f(e.end), e.midi, e.velocity] for e in events]


def sounding_by_part(path: Path) -> list[list[object]]:
    """(part index, onset, midi, whole sounding length) for every struck note.

    Tie chains are merged, so a note the converter split at a barline counts
    once with its whole length — `test_converter.sounding`'s rule, with the
    part kept because the port has to agree about *which hand* as well.
    """
    from music21 import chord, converter as m21converter

    score = m21converter.parse(str(path))
    out: list[list[object]] = []
    for index, part in enumerate(score.parts):
        open_notes: dict[int, list] = {}
        for n in part.flatten().notes:
            members = list(n.notes) if isinstance(n, chord.Chord) else [n]
            for member in members:
                midi = int(round(member.pitch.ps))
                carries = member.tie is not None and member.tie.type in ("stop", "continue")
                row = open_notes.get(midi)
                if carries and row is not None:
                    row[3] = str(Fraction(row[3]) + Fraction(n.duration.quarterLength))
                    continue
                row = [index, str(Fraction(n.offset).limit_denominator(3840)), midi,
                       str(Fraction(n.duration.quarterLength))]
                out.append(row)
                open_notes[midi] = row
    return sorted(out, key=lambda r: (r[0], Fraction(str(r[1])), r[2]))


def reference(midi_path: Path, out_path: Path, hands: str, respell: bool) -> dict:
    """Every stage's answer for one file, in the shape the port's test reads."""
    source = read_midi(midi_path)
    ts = source["time_signature"]
    bar_length = Fraction(ts.barDuration.quarterLength).limit_denominator(3840)
    beat = Fraction(ts.beatDuration.quarterLength).limit_denominator(3840)
    raw = [(track["name"] or f"Part {track['index'] + 1}", track["events"])
           for track in source["tracks"] if track["events"]]
    flat = [event for _, events in raw for event in events]
    report = quantise(flat, bar_length=bar_length, beat=beat, divisors=(4, 3), swing=None)
    quantised = report["events"]

    split = hands == "split" or (hands == "auto" and len(raw) == 1)
    hand_split = None
    if split and quantised:
        sides = split_hands(quantised)
        hand_split = {
            "right": events_json(sides["right"]),
            "left": events_json(sides["left"]),
            "boundary": [[f(at), f(value)] for at, value in sides["boundary"]],
        }
        parts = [(label, sides[side]) for label, side in
                 (("Right hand", "right"), ("Left hand", "left")) if sides[side]]
    else:
        parts = []
        at = 0
        for name, events in raw:
            parts.append((name, quantised[at:at + len(events)]))
            at += len(events)

    all_events = [event for _, events in parts for event in events]
    estimated = relative_by_ending(all_events, key_estimate(all_events))

    written = out_path.with_suffix(".musicxml")
    result = convert(midi_path, written, divisors=(4, 3), respell=respell, force=True,
                     hands=hands)

    return {
        "source": midi_path.name,
        "hands": hands,
        "respell": respell,
        "timeSignature": [ts.numerator, ts.denominator],
        "hadTimeSignature": source["had_time_signature"],
        "tempo": float(source["tempo"].number) if source["tempo"] else None,
        "keySignatures": source["key_signatures"],
        "tracks": [
            {"index": t["index"], "name": t["name"], "noteCount": len(t["events"]),
             "events": events_json(t["events"])}
            for t in source["tracks"]
        ],
        "quantised": events_json(quantised),
        "gridByBar": [f(u) for u in report["grid_by_bar"]],
        "swing": report["swing"],
        "moved": f(report["moved"]),
        "handSplit": hand_split,
        "parts": [{"name": name, "events": events_json(events)} for name, events in parts],
        "estimatedKey": f"{estimated.tonic.name} {estimated.mode}",
        "key": result["key"],
        "notesIn": result["notes_in"],
        "lost": result["lost"],
        "added": result["added"],
        "brokenBars": result["broken_bars"],
        "handMedian": result["hand_median"],
        "sounding": sounding_by_part(written),
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    missing: list[str] = []

    for name in REAL_FILES:
        path = REAL_DIR / name
        if not path.exists():
            missing.append(str(path))
            continue
        # The same options `test_converter.TestRealRecordings.one` uses.
        data = reference(path, OUT / Path(name).stem, hands="split", respell=True)
        (OUT / f"{Path(name).stem}.json").write_text(json.dumps(data, indent=1), encoding="utf-8")
        written.append(f"{Path(name).stem}.json")

    if RENDERED.exists():
        for jitter, label in RENDERED_CASES:
            midi_path = OUT / f"{label}.mid"
            render_midi(RENDERED, midi_path, jitter_ms=jitter)
            # The same options `test_converter.TestRenderedInput.round_trip` uses.
            data = reference(midi_path, OUT / label, hands="keep", respell=False)
            data["renderedFrom"] = RENDERED.name
            data["jitterMs"] = jitter
            (OUT / f"{label}.json").write_text(json.dumps(data, indent=1), encoding="utf-8")
            written.append(f"{label}.json")
    else:
        missing.append(str(RENDERED))

    print(f"wrote {len(written)} reference file(s) to {OUT}: {', '.join(written)}")
    for path in missing:
        print(f"  skipped, missing: {path}")
    return 0 if written else 1


if __name__ == "__main__":
    raise SystemExit(main())
