"""Writes G30's records into tools/content/generator_continuity.json from the catalogue as built before G30.

usage: python docs/prompts/runs/G30/scripts-continuity_table.py <catalog-base.json> <baseline.json> [--naive] [--out PATH]

`catalog-base.json` is `app/public/content/catalog.json` as `build.py --offline` wrote it at the base
(7d9de990), before any G30 edit; `baseline.json` is scripts-baseline.py's output on the same base (every
planned item of the 43 families, with its music digest there). For each family G30 bumps
(scripts-edit_contracts.FLIP), every item as the catalogue held it at the version the family leaves: its
identity (`provenance.identity`), the former generator identities the catalogue already listed for it
(`provenance.formerGeneratorIdentities`, CL15's, for the items of the three families CL15 bumped whose
music it left unchanged), and its music digest there. The catalogue's identity is checked against the
plan's (`review.generator_identity`, in baseline.json) and its former identities against what
`family_contracts.former_generator_identities` gave at the base, so the table records what the catalogue
held, read two ways.

A family's record replaces the one it had (CL15's records for interval_reading, pentatonic,
tremolo_octaves and walking_bass: the relation keys one record per family, to the version the row has),
and every other record (syncopation) is kept as it is. `--naive` writes the table CL15's capture would
have written for a second bump — the version left only, no former identities carried — for the red half
of the multi-hop case; it is never committed.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
TABLE = ROOT / "tools" / "content" / "generator_continuity.json"

spec = importlib.util.spec_from_file_location("edit_contracts", Path(__file__).with_name("scripts-edit_contracts.py"))
edit_contracts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(edit_contracts)

COMMENT = [
    "The generated-identity continuity relation (CL15; the reviewer's required change, docs/review/responses/questions-122a5224.md §CL15).",
    "A generator version belongs to a whole family (family_contracts.identity), so a bump moves every item's identity, the",
    "items whose notes did not change among them. For each bumped family, every item as the catalogue held it at the version",
    "the family left: its identity (review.generator_identity), the former generator identities the catalogue already listed for",
    "it there (formerGeneratorIdentities, present only where it listed some), and its music digest there (family_contracts.music_digest).",
    "family_contracts.former_generator_identities carries an item's recorded identity, and the former ones recorded with it, onto",
    "its row only where the item's digest now is the recorded one, so an unchanged item keeps learner continuity back through",
    "every version its music has stood still across (provenance.formerGeneratorIdentities, material.learnerMaterial) and a changed",
    "item takes the new identity with no link to its old music. Learner continuity only: D2's exact identity, the review record and",
    "every family-scoped read keep reading the row's own identity. One record per family, for the version the row has now; a later",
    "bump records the version it leaves then, with the former identities its items carried (test_family_contracts.TestGeneratedIdentityContinuity).",
    "syncopation: written from the plan at fadafbfa by docs/prompts/runs/CL15/scripts-continuity_table.py (CL15). The other",
    "families: G30's bump, when the 42 families whose own contract called their printed fingering unsourced stopped printing it",
    "(docs/review/responses/questions-90b19bee.md §1), written from the catalogue built at 7d9de990 by",
    "docs/prompts/runs/G30/scripts-continuity_table.py; interval_reading, pentatonic, tremolo_octaves and walking_bass's CL15 records",
    "are replaced by these, their items' CL15 identities carried as formerGeneratorIdentities where the catalogue listed them.",
]


def main() -> None:
    catalog = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    baseline = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    naive = "--naive" in sys.argv
    out_path = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else TABLE
    raw = TABLE.read_bytes()
    crlf = b"\r\n" in raw
    table = json.loads(raw.decode("utf-8"))
    rows = {row["id"]: row for row in catalog}
    families = dict(table["families"])
    counts = {}
    for family, left in sorted(edit_contracts.FLIP.items()):
        items = {}
        for item_id, one in sorted(baseline.items()):
            if one["family"] != family:
                continue
            provenance = rows[item_id]["provenance"]
            identity = provenance["identity"]
            assert identity == one["identity"], (item_id, identity, one["identity"])
            assert identity["kind"] == "generator" and identity["family"] == family and identity["version"] == left, item_id
            formers = provenance.get("formerGeneratorIdentities") or []
            assert formers == one["formers"], (item_id, formers, one["formers"])
            record = {"identity": identity}
            if formers and not naive:
                record["formerGeneratorIdentities"] = formers
            record["digest"] = one["digest"]
            items[item_id] = record
        assert items, family
        assert sorted(items) == sorted(i for i, r in rows.items()
                                       if (r.get("drill") or {}).get("generator", {}).get("family") == family), family
        families[family] = {"from": left, "to": left + 1, "items": items}
        counts[family] = (len(items), sum(1 for r in items.values() if "formerGeneratorIdentities" in r))
    out = {"_comment": COMMENT, "families": dict(sorted(families.items()))}
    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    out_path.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
    print(f"{'naive ' if naive else ''}table -> {out_path}")
    for family, (n, carrying) in counts.items():
        print(f"  {family}: {n} items" + (f", {carrying} carrying former identities" if carrying else ""))
    print(f"  kept: {sorted(set(families) - set(counts))}")


if __name__ == "__main__":
    main()
