# G2a, item 4's premise: can a run that the shipped app turns into evidence carry a composition
# relationship? Evidence is computed only for items the shipped activation acts on
# (`skillActivation.ts`: SHIPPED_SKILL_ACTIVATION is `item.drill?.kind === 'sight-reading'`), and the
# relationship's composition comes from the played item's `provenance.composition`
# (`transfer.ts` relationshipOf; `progressStore.playedCandidate` keeps the row's provenance).
# So: which catalogue items are evidence-bearing, and does any of them name a composition?
# Reads the built catalogue at app/public/content/catalog.json. Run from the worktree root.
import json

with open("app/public/content/catalog.json", encoding="utf-8") as handle:
    catalog = json.load(handle)
items = catalog["items"] if isinstance(catalog, dict) else catalog
bearing = [item for item in items if (item.get("drill") or {}).get("kind") == "sight-reading"]
with_composition = [item["id"] for item in bearing if (item.get("provenance") or {}).get("composition")]
named = [item for item in items if (item.get("provenance") or {}).get("composition")]
print("catalogue items:", len(items))
print("evidence-bearing under the shipped activation (drill.kind == 'sight-reading'):", len(bearing))
for item in bearing:
    print("  ", item["id"], "| source:", (item.get("provenance") or {}).get("source"), "| composition:", (item.get("provenance") or {}).get("composition"))
print("evidence-bearing items naming a composition:", with_composition or "none")
print("items naming a composition, any kind:", len(named))
print("  of which with an arrangement fact:", sum(1 for item in named if (item.get("provenance") or {}).get("arrangement")))
print("  of which excerpts (provenance.excerpt present):", sum(1 for item in named if (item.get("provenance") or {}).get("excerpt")))
