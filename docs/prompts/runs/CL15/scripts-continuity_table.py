"""Writes tools/content/generator_continuity.json from a snapshot of the plan at the base (CL15).

usage: python continuity_table.py <plan-base.json> <out.json>
The snapshot is snapshot_plan.py's output on the base generator (fadafbfa): every planned item's
identity as `review.generator_identity` gives it and its `music_digest`. This records, for each
family CL15 bumped, every item at the version the family left. Which items carry their old identity
is decided by the generator, per item, by digest (`family_contracts.former_generator_identities`).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

#: family: (version left, version now)
BUMPED = {
    "interval_reading": (1, 2),
    "pentatonic": (1, 2),
    "syncopation": (1, 2),
    "tremolo_octaves": (1, 2),
    "walking_bass": (2, 3),
}

COMMENT = [
    "The generated-identity continuity relation (CL15; the reviewer's required change, docs/review/responses/questions-122a5224.md §CL15).",
    "A generator version belongs to a whole family (family_contracts.identity), so a bump moves every item's identity, the",
    "items whose notes did not change among them. For each family CL15 bumped, every item as the catalogue held it at the",
    "version the family left: its identity (review.generator_identity) and its music digest there (family_contracts.music_digest).",
    "family_contracts.former_generator_identities carries an item's recorded identity onto its row only where the item's digest",
    "now is the recorded one, so an unchanged item keeps learner continuity (provenance.formerGeneratorIdentities,",
    "material.learnerMaterial) and a changed item takes the new identity with no link to its old music. Learner continuity",
    "only: D2's exact identity, the review record and every family-scoped read keep reading the row's own identity.",
    "Written from the plan at fadafbfa by docs/prompts/runs/CL15/scripts-continuity_table.py; a later bump of one of these",
    "families records the version it leaves then (test_family_contracts.TestGeneratedIdentityContinuity holds 'to' to the row's version).",
]


def main() -> None:
    snapshot = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    families = {}
    for family, (left, now) in sorted(BUMPED.items()):
        items = {}
        for item_id, row in sorted(snapshot.items()):
            if row["family"] != family:
                continue
            identity = row["identity"]
            assert identity["family"] == family and identity["version"] == left, (item_id, identity)
            items[item_id] = {"identity": identity, "digest": row["digest"]}
        assert items, family
        families[family] = {"from": left, "to": now, "items": items}
    out = {"_comment": COMMENT, "families": families}
    Path(sys.argv[2]).write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print({family: len(record["items"]) for family, record in families.items()})


if __name__ == "__main__":
    main()
