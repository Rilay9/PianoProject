"""
G2: splice the `transfer` blocks into skills.json and the property into skills.schema.json as
text (never re-serialised: the committed files are hand-formatted, one line per standards object).
Each insertion is anchored on text that occurs exactly once; the script refuses otherwise. Run from
the repository root. Prints the sha256 of each file before and after.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path.cwd()
SKILLS = ROOT / "content" / "curriculum" / "vocabulary" / "skills.json"
SCHEMA = ROOT / "content" / "curriculum" / "vocabulary" / "skills.schema.json"

# One line of reason each, from the skill's own sentence (skills.json) and conditions.
BLOCKS: dict[str, tuple[list[str], str]] = {
    "sight-reading": (
        ["key", "rhythm", "hands", "texture"],
        "The right notes and the right rhythm of music never seen: another key signature, another rhythmic surface, the other hand's staff, or both staves at once each change what has to be read at sight.",
    ),
    "bass-clef": (
        ["key", "texture"],
        "Notes on the bass staff read by where they sit: another key puts the reading on other lines and spaces, and the bass staff read while the other hand plays is another texture; pitch only, so rhythm is not this skill's.",
    ),
    "ledger-lines": (
        ["key", "hands"],
        "Notes beyond the staff: another key uses and alters other ledger notes, and the right hand's ledger lines above the treble staff are other notes than the left hand's below the bass.",
    ),
    "interval-reading": (
        ["key", "hands", "texture"],
        "The distance read from its shape: in a fixed C position a note-namer plays the same right notes (the skill's note), so another key or position, the other hand's staff, and both staves at once are what show the shape is read; pitch only, so rhythm is not.",
    ),
    "position-shift": (
        ["key", "hands"],
        "Moving the hand to a new place: in another key the new places fall on other keys, black ones among them, and the other hand moves the other way; how the hand moves (a thumb passing under, a lift) is measured by no dimension, and another family does not stand in for it.",
    ),
    "subdivision": (
        ["rhythm", "texture"],
        "Placing the smaller notes evenly inside the beat: other figures and metres around them, or placing them against the other hand, change it; the key and the hand do not change the timing.",
    ),
    "dotted-quarter": (
        ["rhythm", "texture"],
        "A beat and a half and the eighth after it: the same figure in another rhythmic context, or against the other hand, changes it; the key and the hand do not change the timing.",
    ),
    "tie": (
        ["rhythm", "texture"],
        "Holding through the tie into the next beat or bar: another rhythmic context, or the other hand moving over the held note, changes it; the key and the hand do not change the timing.",
    ),
    "syncopation": (
        ["rhythm", "texture"],
        "A note off the beat against a pulse that keeps going: another rhythmic context, or the pulse held in the other hand, changes it; the key and the hand do not change the timing.",
    ),
    "triplets": (
        ["rhythm", "texture"],
        "Three even notes in the space of two: another rhythmic context, or twos in the other hand against them, changes it; the key and the hand do not change the timing.",
    ),
    "6/8": (
        ["rhythm", "texture"],
        "Two beats of three eighths: other figures inside the compound metre, or the metre held against the other hand, change it; the key and the hand do not change the metre.",
    ),
    "key-signature": (
        ["key", "hands"],
        "Remembering the signature on every note it alters: another signature alters other notes, and the other staff's notes are other notes to alter.",
    ),
    "accidentals": (
        ["key", "hands"],
        "A sign beside a note, lasting to the bar's end: against another key signature the same sign does another thing (a natural cancelling the signature's sharp), and on the other staff it lands on other notes.",
    ),
    "hands-together": (
        ["texture", "key"],
        "Both staves at once: another texture under the melody (a left-hand pattern, a walking bass) and both staves in another key are other reading; the hands are both on every run it can count (its conditions require both), so the hands can never differ for it.",
    ),
    "hand-independence": (
        ["texture", "rhythm"],
        "The hands doing different things at once: another left-hand pattern (walking rather than repeating) or another rhythm between the hands changes it; the key does not change the independence.",
    ),
}
LEFT_OFF = {"reading-ahead": "observable none: no run can be evidence for it, so no transfer can be read of it"}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def splice_once(text: str, anchor: str, insert_after: str) -> str:
    count = text.count(anchor)
    if count != 1:
        sys.exit(f"anchor occurs {count} times, not once: {anchor[:80]!r}")
    return text.replace(anchor, anchor + insert_after, 1)


def main() -> None:
    print("before", sha(SKILLS), SKILLS.name)
    print("before", sha(SCHEMA), SCHEMA.name)
    raw = SKILLS.read_bytes().decode("utf-8")
    newline = "\r\n" if "\r\n" in raw else "\n"
    text = raw.replace("\r\n", "\n")
    data = json.loads(text)
    for skill in data["skills"]:
        sid = skill["id"]
        if sid in LEFT_OFF:
            continue
        dims, why = BLOCKS[sid]
        # The file's own inline style: `{ "key": … }`, a space inside each brace.
        block = "{ " + json.dumps({"dimensions": dims, "why": why}, ensure_ascii=False)[1:-1] + " }"
        # The skill's last line: its `note`, else its `standards` (one line each in the file).
        if "note" in skill:
            anchor = f'      "note": {json.dumps(skill["note"], ensure_ascii=False)}'
        else:
            anchor = f'      "standards": {json.dumps(skill["standards"], ensure_ascii=False, separators=(", ", ": "))}'
            anchor = anchor.replace('{"practice"', '{ "practice"').replace(']}', '] }')
        # Within this skill's own object: after its id line, before the next skill's.
        start = text.index(f'      "id": {json.dumps(sid, ensure_ascii=False)},')
        if text.count(f'      "id": {json.dumps(sid, ensure_ascii=False)},') != 1:
            sys.exit(f"{sid}: its id line is not unique")
        end = text.find('      "id": ', start + 1)
        at = text.find(anchor, start)
        if at < 0 or (end >= 0 and at > end):
            sys.exit(f"{sid}: its last line not found inside its own object: {anchor[:80]!r}")
        at += len(anchor)
        text = text[:at] + f',\n      "transfer": {block}' + text[at:]
    missing = set(BLOCKS) - {s["id"] for s in data["skills"]}
    if missing:
        sys.exit(f"blocks for skills the file lacks: {sorted(missing)}")
    after = json.loads(text)
    for skill, was in zip(after["skills"], data["skills"]):
        rest = {k: v for k, v in skill.items() if k != "transfer"}
        if rest != was:
            sys.exit(f"{skill['id']}: something other than the transfer block changed")
    SKILLS.write_bytes(text.replace("\n", newline).encode("utf-8"))

    raw = SCHEMA.read_bytes().decode("utf-8")
    newline = "\r\n" if "\r\n" in raw else "\n"
    text = raw.replace("\r\n", "\n")
    anchor = '          "note": { "type": "string" }'
    prop = (
        ",\n"
        '          "transfer": {\n'
        '            "type": "object",\n'
        '            "description": "G2: the dimensions on which a change of material is transfer for this skill, each an entry of app/src/curriculum/transfer.ts DIMENSIONS (validate.py reads that list), and why. A skill without the block is credited no transfer, and the build lists it.",\n'
        '            "required": ["dimensions", "why"],\n'
        '            "additionalProperties": false,\n'
        '            "properties": {\n'
        '              "dimensions": { "type": "array", "minItems": 1, "uniqueItems": true, "items": { "type": "string" } },\n'
        '              "why": { "type": "string", "minLength": 20 }\n'
        "            }\n"
        "          }"
    )
    text = splice_once(text, anchor, prop)
    json.loads(text)
    SCHEMA.write_bytes(text.replace("\n", newline).encode("utf-8"))
    print("after ", sha(SKILLS), SKILLS.name)
    print("after ", sha(SCHEMA), SCHEMA.name)


if __name__ == "__main__":
    main()
