"""G30's edit of tools/content/family_contracts.json: 42 rows stop printing their unsourced fingering.

usage: python docs/prompts/runs/G30/scripts-edit_contracts.py [--check]

For each family in FLIP (the 43 rows whose note says "not a published source", less repeated_notes,
held: Entry 211): `physical.fingering.printed` "printed" -> "none", the note's "printed as advice"
clause replaced by what is true now, and `version` up by one. Three texts that described the printed
finger as part of the material are corrected (interval_reading's transfer and admission, octave_scale's
admission), and repeated_notes' note records why it still prints. Idempotent: each edit checks its own
marker, and a rerun on an edited file changes nothing. The file round-trips byte for byte through
json.dumps(indent=2, ensure_ascii=False) (checked before writing), so it is re-serialised, CRLF kept.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "tools" / "content" / "family_contracts.json"

#: The 42 families whose row stops printing, with the version each leaves.
FLIP = {
    "accompaniment": 1, "boogie": 1, "cadence": 1, "comping": 1, "coordination": 1, "double_scale": 1,
    "five_finger": 2, "four_chord_loop": 2, "ii_v_i": 2, "interval_reading": 2, "intro": 1, "latin_groove": 1,
    "meter": 1, "modal_vamp": 1, "montuno": 1, "octave_scale": 1, "oompah": 1, "open_voicing": 3, "ostinato": 1,
    "passing_chord": 2, "pedal": 1, "pedal_variant": 1, "pentatonic": 2, "position_shift": 1, "power_chord": 1,
    "riff": 1, "rotation": 1, "secondary_rag": 1, "seventh_voicing": 2, "slash_bass": 1, "stride": 1,
    "swing_pair": 1, "tremolo_octaves": 2, "tresillo": 1, "triad_inversions": 2, "trill": 1, "tritone_sub": 2,
    "tumbao": 1, "turnaround": 1, "voicing": 1, "walking_bass": 3, "walkup": 1,
}
HELD = "repeated_notes"

OLD_CLAUSE = ("printed as advice, and fingeringVerified is never set true for it "
              "(G47's rule: source it or print nothing — Follow-ups)")
NEW_CLAUSE = ("so nothing is printed until a source gives one (G30; the ruling, "
              "docs/review/responses/questions-53670d2a.md §3), and fingeringVerified is never set true for it")
HELD_NOTE = (" Held at printed by G30 (Entry 211): without the printed change of finger the four-to-a-note items' "
             "0.25 s repeats fail the physical gate's repeated-note check, and no repeatedNotes solution is "
             "declared; which way it goes is an open question, not decided here.")

TEXTS = [
    # (family, path, old, new)
    ("interval_reading", ("roles", "transfer"),
     "not provided: every item is C position with the first finger printed, so a new seed",
     "not provided: every item is C position, so a new seed"),
    ("interval_reading", ("admission",),
     "Right notes in a fixed C position with the first finger printed are what a note-namer plays too",
     "Right notes in a fixed C position are what a note-namer plays too"),
    ("octave_scale", ("admission",),
     "The fingering is printed and unsourced; D0 set fingeringVerified to false, as the reviewer's T53 rule requires.",
     "The fingering is unsourced, so none is printed (G30); D0 set fingeringVerified to false, as the reviewer's "
     "T53 rule requires."),
]


def dump(data: dict, crlf: bool) -> bytes:
    text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    return (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")


def main() -> None:
    raw = PATH.read_bytes()
    crlf = b"\r\n" in raw
    data = json.loads(raw.decode("utf-8"))
    assert dump(data, crlf) == raw, "the file does not round-trip byte for byte: splice text instead"
    families = data["families"]
    changed = []
    for family, left in FLIP.items():
        fingering = families[family]["physical"]["fingering"]
        if fingering["printed"] == "printed":
            assert families[family]["version"] == left, (family, families[family]["version"], left)
            assert "not a published source" in fingering["note"] and OLD_CLAUSE in fingering["note"], family
            assert not fingering.get("source"), family
            fingering["printed"] = "none"
            fingering["note"] = fingering["note"].replace(OLD_CLAUSE, NEW_CLAUSE)
            families[family]["version"] = left + 1
            changed.append(f"{family}: printed -> none, version {left} -> {left + 1}")
        else:
            assert fingering["printed"] == "none" and families[family]["version"] == left + 1, family
            assert NEW_CLAUSE in fingering["note"], family
    for family, path, old, new in TEXTS:
        node = families[family]
        for key in path[:-1]:
            node = node[key]
        if new not in node[path[-1]]:
            assert node[path[-1]].count(old) == 1, (family, path)
            node[path[-1]] = node[path[-1]].replace(old, new)
            changed.append(f"{family}: {'.'.join(path)} corrected")
    held = families[HELD]["physical"]["fingering"]
    assert held["printed"] == "printed"
    if HELD_NOTE.strip() not in held["note"]:
        held["note"] = held["note"] + HELD_NOTE
        changed.append(f"{HELD}: note records the hold")
    out = dump(data, crlf)
    if "--check" in sys.argv:
        print("would change:" if out != raw else "nothing to change", *changed, sep="\n  ")
        return
    if out != raw:
        PATH.write_bytes(out)
    print(f"{len(changed)} edits", *changed, sep="\n  ")


if __name__ == "__main__":
    main()
