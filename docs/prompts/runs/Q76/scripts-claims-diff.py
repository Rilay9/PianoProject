"""Every claim row of two built catalogues (claims.rung_claims), compared: the rungs whose (claim, established, checked, unmeasured) rows differ, and how."""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import claims  # noqa: E402


def rows(content: Path) -> dict:
    catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
    report = claims.rung_claims(catalog, curriculum)
    return {r["rung"]: [(c["kind"], c["id"], c["established"], c["measurable"], c["unmeasured"]) for c in r["claims"]]
            for r in report["rungs"]}


before, after = rows(Path(sys.argv[1])), rows(Path(sys.argv[2]))
changed = [rung for rung in sorted(set(before) | set(after)) if before.get(rung) != after.get(rung)]
print(f"rungs compared: {len(set(before) | set(after))}; rungs whose claim rows differ: {changed}")
for rung in changed:
    b, a = before.get(rung) or [], after.get(rung) or []
    print(f"  {rung}: before {[x for x in b if x not in a]} -> after {[x for x in a if x not in b]}")
