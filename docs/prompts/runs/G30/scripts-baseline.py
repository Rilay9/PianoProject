"""G30's before-record, run on the generator before any edit (Hypotheses 1, 2 and 3).

usage: python docs/prompts/runs/G30/scripts-baseline.py <out.json> <summary.txt>

For every planned item of the 43 families whose contract prints an unsourced fingering:
- its generator identity (`review.generator_identity`), its music digest, its current former
  generator identities (`family_contracts.former_generator_identities`, what the build writes);
- the music digest again after every Fingering articulation is stripped from the score, in place
  (Hypothesis 1). Not from a copy: a music21 deepcopy of a score with a tie across the bar moved the
  tied note's offset in this run (`exercise.ii-v-i.c`, LH C2 'stop' at quarter 8 read at 12), which moved
  the digest of 55 items with no fingering touched; stripping in place moves none (build/g30's probe);
- the physical gate on the stripped score against the row with `printed` set to "none", and the
  faults it adds to the gate's verdict on the item as it was (Hypothesis 2: the repeated-note check
  reads the printed change of finger, `family_contracts.physical_facts`).
"""
from __future__ import annotations

import copy
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

from music21 import articulations  # noqa: E402

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
import review  # noqa: E402


def unsourced() -> list[str]:
    return sorted(f for f, row in FC.contracts().items()
                  if row["physical"]["fingering"]["printed"] == "printed"
                  and "not a published source" in (row["physical"]["fingering"].get("note") or ""))


def stripped(sc):
    """Strips every Fingering articulation from `sc` in place and returns it."""
    out = sc
    for n in out.recurse().notes:
        n.articulations = [a for a in n.articulations if not isinstance(a, articulations.Fingering)]
        for inner in getattr(n, "notes", ()):
            inner.articulations = [a for a in inner.articulations if not isinstance(a, articulations.Fingering)]
    return out


def fingered(sc) -> int:
    return sum(h["fingered"] for h in FC.physical_facts(sc)["hands"].values())


def main() -> None:
    families = unsourced()
    rows: dict[str, dict] = {}
    for sc, entry in G.default_plan(quick=False):
        family = entry["drill"]["generator"]["family"]
        if family not in families:
            continue
        row = FC.contract(family)
        recipe = FC.recipe_of(entry)
        none = copy.deepcopy(row)
        none["physical"]["fingering"]["printed"] = "none"
        before = FC.physical_faults(row, recipe, sc, entry)
        digest = FC.music_digest(sc, entry)
        formers = FC.former_generator_identities(sc, entry)
        printed = fingered(sc)
        bare = stripped(sc)
        after = FC.physical_faults(none, recipe, bare, entry)
        rows[entry["id"]] = {
            "family": family,
            "identity": review.generator_identity(entry),
            "formers": formers,
            "digest": digest,
            "digestStripped": FC.music_digest(bare, entry),
            "fingered": printed,
            "fingeredStripped": fingered(bare),
            "faultsBefore": before,
            "newFaults": [f for f in after if f not in before],
        }
    Path(sys.argv[1]).write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")
    by_family: dict[str, list] = defaultdict(list)
    for item_id, one in rows.items():
        by_family[one["family"]].append((item_id, one))
    lines = [f"families: {len(families)} (contract rows printing a fingering whose note says 'not a published source')",
             f"items: {len(rows)}", ""]
    lines.append("family | items | items printing fingering now | fingers now | digest moved by stripping | new physical faults | items carrying a former identity now")
    for family in families:
        items = by_family[family]
        lines.append(" | ".join(str(x) for x in (
            family, len(items), sum(1 for _i, o in items if o["fingered"]), sum(o["fingered"] for _i, o in items),
            sum(1 for _i, o in items if o["digest"] != o["digestStripped"]),
            sum(len(o["newFaults"]) for _i, o in items), sum(1 for _i, o in items if o["formers"]))))
    lines.append("")
    lines.append("new physical faults, per item:")
    for item_id, one in sorted(rows.items()):
        for fault in one["newFaults"]:
            lines.append(f"  {item_id}: {fault}")
    lines.append("faults on the item as it is (before any change), per item:")
    for item_id, one in sorted(rows.items()):
        for fault in one["faultsBefore"]:
            lines.append(f"  {item_id}: {fault}")
    Path(sys.argv[2]).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:60]))


if __name__ == "__main__":
    main()
