"""Seam 1a.9: the `scale` family's continuity record (CL15 relation), from the generator and catalogue before the fix.

usage:
  python s19_continuity.py baseline <out.json>                 # run on the generator BEFORE make_scale changes
  python s19_continuity.py table <catalog-base.json> <baseline.json>   # writes tools/content/generator_continuity.json

`baseline`: every planned `scale` item's generator identity (`review.generator_identity`), the former
generator identities the build writes for it (`family_contracts.former_generator_identities`), and its
music digest (`family_contracts.music_digest`), at version 1.

`table`: the record the bump to version 2 needs, as G30's `scripts-continuity_table.py` wrote its own:
every item as the catalogue held it at the version left (its `provenance.identity`, checked equal to the
plan's identity; its `provenance.formerGeneratorIdentities`, checked equal to the plan's; the digest from
the baseline). `catalog-base.json` is `app/public/content/catalog.json` as `build.py --offline` wrote it
before any edit of this lane. Every other family's record is kept as it is; the file is re-serialised the
way it was written (indent 2, ensure_ascii False, the checkout's line endings), checked round-trip first.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(ROOT / "tools" / "content"))
TABLE = ROOT / "tools" / "content" / "generator_continuity.json"
FAMILY = "scale"


def baseline(out: Path) -> None:
    import family_contracts as FC
    import generate_exercises as G
    import review

    rows = {}
    for sc, entry in G.default_plan(quick=False):
        if entry["drill"]["generator"]["family"] != FAMILY:
            continue
        rows[entry["id"]] = {
            "identity": review.generator_identity(entry),
            "formers": FC.former_generator_identities(sc, entry),
            "digest": FC.music_digest(sc, entry),
        }
    out.write_text(json.dumps(rows, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{len(rows)} {FAMILY} items -> {out}")


def table(catalog_path: Path, baseline_path: Path) -> None:
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    base = json.loads(baseline_path.read_text(encoding="utf-8"))
    raw = TABLE.read_bytes()
    crlf = b"\r\n" in raw
    current = json.loads(raw.decode("utf-8"))

    def dump(obj) -> bytes:
        text = json.dumps(obj, indent=2, ensure_ascii=False) + "\n"
        return (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")

    assert dump(current) == raw, "generator_continuity.json does not round-trip: splice as text instead"
    rows = {row["id"]: row for row in catalog}
    items = {}
    for item_id, one in sorted(base.items()):
        provenance = rows[item_id]["provenance"]
        identity = provenance["identity"]
        assert identity == one["identity"], (item_id, identity, one["identity"])
        assert (identity["kind"], identity["family"], identity["version"]) == ("generator", FAMILY, 1), item_id
        formers = provenance.get("formerGeneratorIdentities") or []
        assert formers == one["formers"], (item_id, formers, one["formers"])
        record = {"identity": identity}
        if formers:
            record["formerGeneratorIdentities"] = formers
        record["digest"] = one["digest"]
        items[item_id] = record
    assert sorted(items) == sorted(i for i, r in rows.items()
                                   if ((r.get("drill") or {}).get("generator") or {}).get("family") == FAMILY)
    families = dict(current["families"])
    assert FAMILY not in families, "a scale record already exists"
    families[FAMILY] = {"from": 1, "to": 2, "items": items}
    comment = list(current["_comment"])
    line = ("scale: wave 1(a) seam 1a.9, when the contrary-motion scales were made to start at the unison, written from the "
            "catalogue built before the lane's edits by docs/prompts/runs/curriculum-review-2026-10-05/wave1a/s19_continuity.py.")
    if line not in comment:
        comment.append(line)
    TABLE.write_bytes(dump({"_comment": comment, "families": dict(sorted(families.items()))}))
    print(f"{FAMILY}: {len(items)} items recorded from version 1 -> {TABLE}")


if __name__ == "__main__":
    if sys.argv[1] == "baseline":
        baseline(Path(sys.argv[2]))
    else:
        table(Path(sys.argv[2]), Path(sys.argv[3]))
