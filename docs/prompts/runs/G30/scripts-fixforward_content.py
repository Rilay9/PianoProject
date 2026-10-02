"""G30's fix-forward, the reviewer's required change (docs/review/responses/09ec1337.md §3, option (b)): repeated_notes.

usage: python docs/prompts/runs/G30/scripts-fixforward_content.py
On top of 09ec1337. In this order, each step checking its own marker (idempotent):

1. **Continuity first, while the row is still at version 1:** every planned repeated_notes item's identity
   (`review.generator_identity`, what the catalogue holds as `provenance.identity`; G30 checked the two equal for
   all 43 families at the base) and its music digest, recorded in tools/content/generator_continuity.json as
   the family's record from 1 to 2. Each item is checked to carry no former identity yet (the family was never
   bumped) and to keep its digest when its fingering is stripped in place.
2. **The row** (tools/content/family_contracts.json): `printed` -> "none", the note's clause as the other 42
   rows have it, the hold sentence gone; the drill's solution in the existing `physical.repeatedNotes` field,
   scoped to this drill; version 1 -> 2.
3. **The maker** (tools/content/generate_exercises.py): `make_repeated_notes` returns through
   `print_as_contracted`; its docstring says what reaches the page.
4. **The lesson** (content/lessons/technique.5.md): the sentence no longer claims the printed 3-2-1 / 4-3-2-1
   and teaches the same non-prescriptive rule, within the lesson's stated three minutes.
5. **The pin** (tools/content/tests/fixtures/identity_pins.json): version 1 -> 2, digest kept.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

FAMILY = "repeated_notes"
CONTRACTS = ROOT / "tools" / "content" / "family_contracts.json"
TABLE = ROOT / "tools" / "content" / "generator_continuity.json"
GEN = ROOT / "tools" / "content" / "generate_exercises.py"
LESSON = ROOT / "content" / "lessons" / "technique.5.md"
PINS = ROOT / "tools" / "content" / "tests" / "fixtures" / "identity_pins.json"

OLD_CLAUSE = ("printed as advice, and fingeringVerified is never set true for it "
              "(G47's rule: source it or print nothing — Follow-ups)")
NEW_CLAUSE = ("so nothing is printed until a source gives one (G30; the ruling, "
              "docs/review/responses/questions-53670d2a.md §3), and fingeringVerified is never set true for it")
HELD_NOTE = (" Held at printed by G30 (Entry 211): without the printed change of finger the four-to-a-note items' "
             "0.25 s repeats fail the physical gate's repeated-note check, and no repeatedNotes solution is "
             "declared; which way it goes is an open question, not decided here.")
SOLUTION = {
    "solution": ("change finger on each strike, which is what this drill practises; the order of the fingers is the "
                 "learner's: the app prints no fingering for it and prescribes none (G30, the reviewer's option (b), "
                 "docs/review/responses/09ec1337.md §3)"),
    "why": ("the four-to-a-note items re-strike every 0.25 s at ♩=60, under the gate's 0.3 s; this is this drill's "
            "solution, not a rule that every fast repeated note in piano playing takes a new finger on every strike"),
}

TABLE_COMMENT_OLD = [
    "families: G30's bump, when the 42 families whose own contract called their printed fingering unsourced stopped printing it",
    "(docs/review/responses/questions-90b19bee.md §1), written from the catalogue built at 7d9de990 by",
]
TABLE_COMMENT_NEW = [
    "families: G30's bump, when the 43 families whose own contract called their printed fingering unsourced stopped printing it",
    "(docs/review/responses/questions-90b19bee.md §1; repeated_notes by the review's required change, 09ec1337.md §3, its record",
    "written from the plan at 09ec1337 by docs/prompts/runs/G30/scripts-fixforward_content.py), the others from the catalogue built at 7d9de990 by",
]

DOC_OLD = '''    The same note struck three or four times, changing finger each time.

    Hanon 21-30 territory and the reason a repeated note sounds even at speed:
    the hand does not lift, the fingers take turns. 3-2-1 for three notes and
    4-3-2-1 for four, which is the standard descending order.
'''
DOC_NEW = '''    The same note struck three or four times, changing finger each time.

    Hanon 21-30 territory and the reason a repeated note sounds even at speed:
    the hand does not lift, the fingers take turns. 3-2-1 for three notes and
    4-3-2-1 for four is the order worked out here. It is the generator's own, so
    since G30 it is not printed (`print_as_contracted`); the row declares the
    drill's solution instead (`physical.repeatedNotes`: change finger on each
    strike, the order the learner's).
'''

LESSON_OLD = ("Changing finger on each strike is one way to keep a fast repeated note even;\n"
              "the printed 3-2-1 for three strikes here, 4-3-2-1 for four on the next technique\n"
              "rung, is a common choice, not the only one.")
LESSON_NEW = ("Changing finger on each strike is one way to keep a fast repeated note even,\n"
              "and it is what these drills practise. No fingers are printed, and the order\n"
              "is yours to choose.")

PIN_NOTE = ("Re-pinned by G30's fix-forward (docs/review/responses/09ec1337.md §3): repeated_notes, its version moved and "
            "its digest unchanged, its unsourced printed fingering withdrawn and the drill's solution declared in its row.")


def dump(data: dict, crlf: bool) -> bytes:
    text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    return (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")


def load(path: Path) -> tuple[dict, bool, bytes]:
    raw = path.read_bytes()
    crlf = b"\r\n" in raw
    data = json.loads(raw.decode("utf-8"))
    assert dump(data, crlf) == raw, f"{path.name} does not round-trip byte for byte"
    return data, crlf, raw


def capture() -> None:
    table, crlf, raw = load(TABLE)
    contracts = json.loads(CONTRACTS.read_text(encoding="utf-8"))["families"]
    record = table["families"].get(FAMILY)
    if record is not None:
        assert (record["from"], record["to"]) == (1, 2), record
        print(f"continuity: already recorded ({len(record['items'])} items)")
        return
    assert contracts[FAMILY]["version"] == 1, "capture before the bump"
    import family_contracts as FC  # noqa: PLC0415
    import generate_exercises as G  # noqa: PLC0415
    import review  # noqa: PLC0415
    from music21 import articulations  # noqa: PLC0415

    items = {}
    for sc, entry in G.default_plan(quick=False):
        if entry["drill"]["generator"]["family"] != FAMILY:
            continue
        identity = review.generator_identity(entry)
        assert identity["version"] == 1 and identity["family"] == FAMILY, identity
        assert FC.former_generator_identities(sc, entry) == [], entry["id"]
        digest = FC.music_digest(sc, entry)
        for n in sc.recurse().notes:
            n.articulations = [a for a in n.articulations if not isinstance(a, articulations.Fingering)]
        assert FC.music_digest(sc, entry) == digest, f"{entry['id']}: stripping moved the digest"
        items[entry["id"]] = {"identity": identity, "digest": digest}
    assert len(items) == 12, len(items)
    table["families"][FAMILY] = {"from": 1, "to": 2, "items": dict(sorted(items.items()))}
    table["families"] = dict(sorted(table["families"].items()))
    comment = table["_comment"]
    if TABLE_COMMENT_NEW[0] not in comment:
        at = comment.index(TABLE_COMMENT_OLD[0])
        assert comment[at + 1] == TABLE_COMMENT_OLD[1]
        comment[at:at + 2] = TABLE_COMMENT_NEW
    TABLE.write_bytes(dump(table, crlf))
    print(f"continuity: recorded {len(items)} items at version 1")


def contract() -> None:
    data, crlf, raw = load(CONTRACTS)
    row = data["families"][FAMILY]
    physical = row["physical"]
    fingering = physical["fingering"]
    if fingering["printed"] == "printed":
        assert row["version"] == 1 and not fingering.get("source")
        fingering["note"] = fingering["note"].replace(HELD_NOTE, "").replace(OLD_CLAUSE, NEW_CLAUSE)
        assert NEW_CLAUSE in fingering["note"] and "Held at printed" not in fingering["note"]
        fingering["printed"] = "none"
        row["version"] = 2
    assert fingering["printed"] == "none" and row["version"] == 2
    if physical.get("repeatedNotes") != SOLUTION:
        assert "repeatedNotes" not in physical
        rebuilt = {}
        for key, value in physical.items():
            rebuilt[key] = value
            if key == "fingering":
                rebuilt["repeatedNotes"] = SOLUTION
        row["physical"] = rebuilt
    out = dump(data, crlf)
    if out != raw:
        CONTRACTS.write_bytes(out)
        print("contract: printed none, repeatedNotes declared, version 2")
    else:
        print("contract: already")


def splice(path: Path, old: str, new: str, what: str) -> None:
    raw = path.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    if new in text:
        print(f"{what}: already")
        return
    assert text.count(old) == 1, what
    text = text.replace(old, new)
    path.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
    print(f"{what}: done")


def maker() -> None:
    import ast  # noqa: PLC0415

    raw = GEN.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    node = next(n for n in ast.parse(text).body if isinstance(n, ast.FunctionDef) and n.name == "make_repeated_notes")
    lines = text.split("\n")
    last = node.body[-1]
    assert isinstance(last, ast.Return)
    if lines[last.lineno - 1] == "    return sc, entry":
        lines[last.lineno - 1] = "    return print_as_contracted(sc, entry)"
        text = "\n".join(lines)
        GEN.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
        print("maker: returns through print_as_contracted")
    else:
        assert lines[last.lineno - 1] == "    return print_as_contracted(sc, entry)"
        print("maker: already")
    splice(GEN, DOC_OLD, DOC_NEW, "maker docstring")


def pins() -> None:
    data, crlf, raw = load(PINS)
    pin = data["families"][FAMILY]
    if pin["version"] == 1:
        pin["version"] = 2
    assert pin["version"] == 2
    if PIN_NOTE not in data["_comment"]:
        data["_comment"].append(PIN_NOTE)
    out = dump(data, crlf)
    if out != raw:
        PINS.write_bytes(out)
        print(f"pin: version 2, digest kept {pin['digest'][:12]}")
    else:
        print("pin: already")


def main() -> None:
    capture()
    contract()
    maker()
    splice(LESSON, LESSON_OLD, LESSON_NEW, "lesson technique.5")
    pins()


if __name__ == "__main__":
    main()
