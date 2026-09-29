"""
Q75's discriminating reading of a built catalogue (read-only): for every rung concept claim, the
options this build checked, the ones it could not measure and the ones that establish the claim,
counted from the report's per-option statuses (so the reading does not depend on which version of
`rung_claims` counts them), and the verdict of three rules on each:

- F2 as committed: an unmeasured option counts as checked; fails where checked > 0 and none establishes.
- the brief's literal rule: unmeasured not checked; fails where checked > 0 and none establishes.
- the rule built: unmeasured not checked; fails only where checked > 0, none establishes and none of
  the rung's options is unmeasured here (an unmeasured option refutes nothing).

Deferred claims are left out (they warn under all three). Then the catalogue's unmeasured items,
grouped by source, tag and reason.

Usage: python scripts-strict-claims.py <content dir>
"""
import json
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import claims  # noqa: E402
import validate  # noqa: E402

content = Path(sys.argv[1])
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
report = claims.rung_claims(catalog, curriculum)
skills, _demands = claims.load_vocabulary()
lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(curriculum)}


def claim_of(concept):
    if concept in skills:
        return ("skill", concept) if skills[concept]["opportunity"] != "every-step" else None
    if concept in claims.CONCEPT_DEMANDS:
        return ("demand", claims.CONCEPT_DEMANDS[concept])
    return None


per = {}
for option in report["options"]:
    for c in option["claims"]:
        key = (option["rung"], c["kind"], c["id"])
        row = per.setdefault(key, Counter())
        row[c["status"]] += 1

verdicts = Counter()
differ = []
for rung_id, lesson in lessons.items():
    for concept in lesson.get("concepts") or []:
        key = claim_of(concept)
        if key is None or (rung_id, concept) in validate.DEFERRED_CONCEPT_CLAIMS:
            continue
        counts = per.get((rung_id, *key), Counter())
        est = counts["established"]
        checked = counts["established"] + counts["incidental"] + counts["absent"]
        unmeasured = counts["unmeasured"]
        f2 = "fail" if (checked + unmeasured) > 0 and est == 0 else "pass"
        literal = "fail" if checked > 0 and est == 0 else ("warn" if unmeasured and est == 0 else "pass")
        built = "fail" if checked > 0 and est == 0 and unmeasured == 0 else ("warn" if unmeasured and est == 0 else "pass")
        verdicts[(f2, literal, built)] += 1
        if (f2, literal, built) != ("pass", "pass", "pass"):
            differ.append(f"  {rung_id} {concept} ({key[1]}): established {est}, checked {checked}, unmeasured {unmeasured} "
                          f"-> F2 {f2}, brief-literal {literal}, built {built}")

print(f"content: {content}")
print(f"catalogue items: {len(catalog)}")
print("claims not passing under at least one rule:")
print("\n".join(differ) or "  none")
print("verdict triples (F2, brief-literal, built): " + ", ".join(f"{k}: {n}" for k, n in sorted(verdicts.items())))

unmeasured_items = [i for i in catalog if (i.get("measurement") or {}).get("status") == "unmeasured"]
print(f"\nunmeasured items: {len(unmeasured_items)}")
by = Counter()
for item in unmeasured_items:
    tags = item.get("tags") or []
    source = ((item.get("provenance") or {}).get("source"))
    licence_tag = next((t for t in tags if t in ("nc-personal-build", "personal-build", "import-only")), "-")
    repo = next((t for t in tags if t not in ("kern", "pdmx", "import-only", "nc-personal-build", "personal-build",
                                              "tempo-defaulted", "musetrainer", "authored")), "")
    by[(source, licence_tag, repo if source == "placeholder" or "kern" in tags else "",
        (item.get("measurement") or {}).get("reason"))] += 1
for (source, tag, repo, reason), n in sorted(by.items(), key=lambda kv: (-kv[1], str(kv[0]))):
    print(f"  {n:4}  source={source} tag={tag} {('repo=' + repo) if repo else ''} reason={reason}")
