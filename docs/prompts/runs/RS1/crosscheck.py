"""RS1 evidence: the frozen fixture and the edition, checked against readers that did not write them.

Run from the worktree root with the raw member and a scratch edition beside it:
    py -3.11 docs/prompts/runs/RS1/crosscheck.py <raw.mxl> <edition.mxl> <fixture.json>

1. The fixture against the A7a.1 probe's two-reader table (docs/prompts/runs/A7a1/events-by-role.json: reader A,
   checked against music21 on all 249 heads and 54 rests): riff and root events and riff rests equal.
2. The fixture against music21 on the raw bytes (reader B): the Riff part's and the Piano's staff-2 events equal.
3. The edition read by music21 (a third reading, not the verifier's): staff 1 events = the fixture's upper,
   staff 2 = lower.
4. The edition read by partitura (CK-7's named reader): onsets, durations and spelled pitches per staff equal the
   fixture's (ties merged, so compared on a fixture with no tie).
5. The verifier on the converter's own merged file (docs/prompts/runs/A7a1/source/*.converted.mxl): must fail.
6. The quarry's own gates on the edition: round_trip_ok (H2) against the selected source in two orders,
   structure_failure (G2, G8, G9) and the truncation scan (gate 4).
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from fractions import Fraction
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

from pdmx import restaff, restaff_verify as rv  # noqa: E402

raw, edition, fixture_path = (Path(a) for a in sys.argv[1:4])
fixture = json.loads(fixture_path.read_text(encoding="utf-8"))


def key(bar, onset, duration, head, tie=None):
    return (int(bar), Fraction(onset), Fraction(duration), head, tie)


want_upper = Counter(rv.event_key(r) for r in fixture["upper"]["events"])
want_lower = Counter(rv.event_key(r) for r in fixture["lower"]["events"])
want_rests = Counter((int(r["bar"]), Fraction(r["onset"]), Fraction(r["duration"])) for r in fixture["upper"]["rests"])

# 1 -- the probe's table.
probe = json.loads((REPO / "docs/prompts/runs/A7a1/events-by-role.json").read_text(encoding="utf-8"))
assert probe["raw_sha256"] == fixture["rawSha256"]
roles = probe["roles"]
p_riff = Counter(key(b, e["onset"], e["dur"], e["head"], e["tie"]) for b, es in roles["riff"].items() for e in es)
p_root = Counter(key(b, e["onset"], e["dur"], e["head"], e["tie"]) for b, es in roles["root"].items() for e in es)
p_rest = Counter((int(b), Fraction(e["onset"]), Fraction(e["dur"])) for b, es in roles["riff_rests"].items() for e in es)
p_voicing = Counter(key(b, e["onset"], e["dur"], e["head"], e["tie"]) for b, es in roles["voicing"].items() for e in es)
want_voicing = Counter(rv.event_key(r) for r in fixture["omitted"]["pitched"])
p_drum = sum(len(es) for es in roles["drum"].values())
print("1 fixture = probe table:", p_riff == want_upper, p_root == want_lower, p_rest == want_rests,
      p_voicing == want_voicing, p_drum == fixture["omitted"]["unpitchedHeads"])


# 2 and 3 -- music21.
from music21 import chord, converter, note, stream  # noqa: E402


def m21_events(path: Path, staff_of) -> tuple[dict, Counter]:
    score = converter.parse(str(path))
    out: dict[str, Counter] = {}
    rests: Counter = Counter()
    for part in score.parts:
        label = staff_of(part)
        bag = out.setdefault(label, Counter())
        for m in part.getElementsByClass(stream.Measure):
            for el in m.recurse().notesAndRests:
                onset, dur = Fraction(el.getOffsetInHierarchy(m)).limit_denominator(256), Fraction(el.quarterLength).limit_denominator(256)
                if el.isRest:
                    rests[(label, int(m.number), onset, dur)] += 1
                    continue
                if isinstance(el, note.Unpitched) or (isinstance(el, chord.ChordBase) and any(isinstance(n, note.Unpitched) for n in el.notes)):
                    bag[(int(m.number), onset, dur, "x", None)] += 1
                    continue
                for p in el.pitches:
                    alter = int(p.accidental.alter) if p.accidental else 0
                    bag[(int(m.number), onset, dur, p.step + rv.ALTER_SPELLING[alter] + str(p.octave), None)] += 1
    return out, rests


raw_ev, raw_rests = m21_events(raw, lambda part: part.id)
print("2 fixture = music21 on raw:", raw_ev["Riff"] == want_upper, raw_ev["P1-Staff2"] == want_lower,
      Counter((b, o, d) for (lab, b, o, d) in raw_rests.elements() if lab == "Riff") == want_rests)
ed_ev, ed_rests = m21_events(edition, lambda part: "1" if part.id.endswith("Staff1") or part is None else "2")
labels = sorted(ed_ev)
print("3 music21 on the edition, parts:", labels, "staff 1 = upper:", ed_ev.get("1") == want_upper,
      "staff 2 = lower:", ed_ev.get("2") == want_lower,
      "rests staff 1 = source rests:", Counter((b, o, d) for (lab, b, o, d) in ed_rests.elements() if lab == "1") == want_rests,
      "rests staff 2:", sum(1 for (lab, *_rest) in ed_rests.elements() if lab == "2"))

# 4 -- partitura.
import partitura as pt  # noqa: E402

# partitura reads one part with two staves as one part: split by each note's staff. Positions in quarters through
# partitura's own quarter map, made exact with limit_denominator (the file's smallest value is a sixty-fourth).
part = pt.load_musicxml(str(edition)).parts[0]
bars = sorted(part.iter_all(pt.score.Measure), key=lambda m: m.start.t)


def quarters(t):
    return Fraction(float(part.quarter_map(t))).limit_denominator(256)


by_staff: dict[int, Counter] = {}
for n in part.iter_all(pt.score.Note):
    m = next(m for m in bars if m.start.t <= n.start.t < m.end.t)
    by_staff.setdefault(n.staff, Counter())[(int(m.number), quarters(n.start.t) - quarters(m.start.t),
                                              quarters(n.start.t + n.duration_tied) - quarters(n.start.t),
                                              n.step + rv.ALTER_SPELLING[int(n.alter or 0)] + str(n.octave), None)] += 1
print("4 partitura by staff:", sorted(by_staff), "staff 1 = upper:", by_staff.get(1) == want_upper,
      "staff 2 = lower:", by_staff.get(2) == want_lower)

# 5 -- the converter's merged file.
merged = REPO / "docs/prompts/runs/A7a1/source/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.converted.mxl"
verdict = rv.verify(merged.read_bytes(), fixture)
kinds = Counter(f.split(": ")[-1].split(" (")[0] for f in verdict.failures)
print("5 the converter's merged file:", "FAIL" if not verdict.ok else "PASS", len(verdict.failures), "failures:", dict(kinds))

# 6 -- the quarry's gates on the edition.
import convert  # noqa: E402
from pdmx import quarry  # noqa: E402
from truncation_scan import scan_file  # noqa: E402

edition_score = convert.parse_source(edition)
for order in (("Riff", "P1-Staff2"), ("P1-Staff2", "Riff")):
    selected = restaff.select(convert.parse_source(raw), restaff.EDITIONS[fixture_path.name.split(".")[0]])
    ordered = [next(p for p in selected.parts if p.id == pid) for pid in order]
    holder = stream.Score()
    for p in ordered:
        holder.insert(0, p)
    print(f"6 H2 round_trip_ok(selected source as {list(order)}, edition):", quarry.round_trip_ok(holder, edition_score))
print("6 H2 round_trip_ok(raw, edition):", quarry.round_trip_ok(convert.parse_source(raw), edition_score))


class Result:
    added_tempo = True
    tempo_bpm = 96.0


print("6 structure_failure:", quarry.structure_failure(edition_score, Result()))
pitches = [int(p.midi) for el in edition_score.recurse().notes for p in el.pitches]
print("6 pitched range MIDI", min(pitches), max(pitches))
print("6 truncation findings:", [f.describe() for f in scan_file(edition).findings])
