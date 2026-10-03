"""The catalogue the naive capture would have built: G30's catalogue with each item's former generator identities
re-derived from the naive table (the version left only, CL15's carried identities not recorded).

usage: python docs/prompts/runs/G30/scripts-naive_catalog.py <catalog.json> <naive-table.json> <out.json>

For the TS half of the multi-hop red: `generatedIdentityContinuity.test.ts` reads `app/public/content/catalog.json`,
so the naive catalogue is put there for one run and the built one restored. Each row's list is what
`build.attach_provenance` writes — `family_contracts.former_generator_identities` on the item's score and row,
here with the naive table, less any identity some row holds now. Not a build: a rewrite of that one field.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
import review  # noqa: E402


def main() -> None:
    catalog = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    naive = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    rows = {row["id"]: row for row in catalog}
    current = [row["provenance"]["identity"] for row in catalog
               if (row.get("provenance") or {}).get("identity", {}).get("kind") == "generator"]
    changed = 0
    for sc, entry in G.default_plan(quick=False):
        if entry["drill"]["generator"]["family"] not in naive["families"]:
            continue
        provenance = rows[entry["id"]]["provenance"]
        kept = [one for one in FC.former_generator_identities(sc, entry, naive)
                if not any(review.same_identity(one, now) for now in current)]
        if kept != (provenance.get("formerGeneratorIdentities") or []):
            changed += 1
        if kept:
            provenance["formerGeneratorIdentities"] = kept
        else:
            provenance.pop("formerGeneratorIdentities", None)
    Path(sys.argv[3]).write_text(json.dumps(catalog, ensure_ascii=False), encoding="utf-8")
    print(f"rows whose former identities the naive table changes: {changed}")


if __name__ == "__main__":
    main()
