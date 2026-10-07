"""RS1: the Blues Riff edition's row, and its guarded text splice into content/sources/pdmx.json.

    py -3.11 docs/prompts/runs/RS1/row.py [--write]

The row is the shape `pdmx/commit.py` writes (its `build_entries`), filled from the same places:
- the shortlist's own candidate fields for this CID (the A7a.1 probe's one-row candidates.json, run through
  `shortlist.select()`): musescoreId, license, compositionStatus and its reason, traditional, bucket, band, artist;
- the quarry's own functions on the committed edition (not on the raw member): `convert.parse_source`,
  `quarry.structure_failure`'s flags, `difficulty.features` and `difficulty.estimate` with the fitted model;
- `restaff.EDITIONS` for the file name and the derivation block.
Choices this lane made (each with the option not taken, in the report): the id, the title, composer null, tracks and
genre, the review note.

The splice (CLAUDE.md, "Two mechanical hazards"): the file is not re-serialised. The new row is inserted as text before
the items array's closing bracket, in the file's own newline style and two-space indentation; the script refuses
unless the bytes before the insertion point are unchanged, the CID and id were absent, and the parsed result equals
the old items plus this row.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

import convert  # noqa: E402
import difficulty  # noqa: E402
from pdmx import quarry, restaff  # noqa: E402

CID = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
TABLE = REPO / "content" / "sources" / "pdmx.json"
INTAKE = "docs/prompts/runs/curriculum-review-2026-10-05/intake/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.md"
edition = restaff.EDITIONS[CID]
path = REPO / "content" / "scores" / "pdmx" / edition.file
candidate = json.loads((REPO / "docs/prompts/runs/A7a1/candidates.json").read_text(encoding="utf-8"))["candidates"][0]
assert candidate["cid"] == CID

score = convert.parse_source(path)


class Result:  # the two fields structure_failure reads from a ConversionResult (restaff.py printed them)
    added_tempo = True
    tempo_bpm = 96.0


failure, flags = quarry.structure_failure(score, Result())
assert failure is None, failure
features = difficulty.features(score)
level = difficulty.estimate(features, difficulty.load_model())
notes = len(list(score.recurse().notes))

row = {
    "id": "song.blues.blues-riff-in-c.pdmx",
    "cid": CID,
    "file": edition.file,
    "title": "Blues Riff in C",
    "composer": None,
    "artist": candidate["artist"],
    "rawSha256": edition.raw_sha256,
    "convertedSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    "musescoreId": candidate["musescore_id"],
    "license": candidate["license"],
    "compositionStatus": candidate["composition_status"],
    "compositionReason": candidate["composition_reason"],
    "traditional": bool(candidate["traditional"]),
    "bucket": candidate["bucket"],
    "band": candidate["band"],
    "bars": 12,
    "notes": notes,
    "tempoBpm": 96.0,
    "tempoDefaulted": bool(flags["tempo_defaulted"]),
    "singleLine": bool(flags["single_line"]),
    "hands": "right" if flags["single_line"] else "both",
    "features": features,
    "level": level.level,
    "levelSource": "estimated",
    "levelFrom": level.source,
    "levelDrivers": level.drivers,
    "duplicateOf": None,
    "review": {
        "decision": "keep",
        "note": (
            "Re-staffed teaching edition (A7a1-bluesriff-restaff): the source is an ensemble (Piano on two staves, "
            "rootless voicings over whole-note roots; a one-staff Riff; an unpitched Drumset); this file keeps the "
            "Riff on the upper staff and the Piano's lower-staff roots on the lower, omits the voicings and the drums, "
            "every kept event unchanged (the 18 written B naturals as printed), by tools/content/pdmx/restaff.py before "
            "the unchanged converter. Checked event for event against the raw member's frozen events "
            "(tools/content/tests/test_restaff.py). 12 bars of 4/4, C, no tempo mark (the converter's 96; the upload's "
            "title says 120 bpm, which is metadata, not a marking); the work title is the file's own. Who wrote the riff "
            f"is not stated (the credit names a course), so no composer. Intake record: {INTAKE}. Curriculum admission "
            "CANDIDATE. Nothing heard."
        ),
    },
    "genre": ["blues"],
    "tracks": ["blues-boogie"],
    "derivation": edition.derivation(),
}

raw = TABLE.read_bytes()
text = raw.decode("utf-8")
newline = "\r\n" if "\r\n" in text else "\n"
table = json.loads(text)
assert all(item.get("cid") != CID and item.get("id") != row["id"] for item in table["items"]), "already in the table"
tail = f"    }}{newline}  ]{newline}}}{newline}"
assert text.endswith(tail), "the table does not end as expected"
cut = len(text) - len(tail) + len(f"    }}")
body = json.dumps(row, indent=2, ensure_ascii=False)
body = newline.join("    " + line for line in body.split("\n"))
spliced = text[:cut] + "," + newline + body + text[cut:]
after = json.loads(spliced)
assert after["items"] == table["items"] + [json.loads(json.dumps(row))]
assert {k: v for k, v in after.items() if k != "items"} == {k: v for k, v in table.items() if k != "items"}
assert spliced.encode("utf-8")[:len(text[:cut].encode("utf-8"))] == raw[:len(text[:cut].encode("utf-8"))]
print("row:", json.dumps({k: row[k] for k in ("id", "file", "convertedSha256", "notes", "hands", "level", "levelFrom",
                                                 "tempoBpm", "tempoDefaulted")}))
print("levelDrivers:", row["levelDrivers"])
print("items", len(table["items"]), "->", len(after["items"]), "; bytes before the insertion unchanged; lines added",
      spliced.count(newline) - text.count(newline))
if "--write" in sys.argv:
    TABLE.write_bytes(spliced.encode("utf-8"))
    print("written")
