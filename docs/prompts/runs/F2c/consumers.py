"""
F2c: what each reader of `claims.CONCEPT_DEMANDS` does with the leap, on this tree, with the mapping as
committed now and with the removed line put back in memory (the before reading; nothing is written).

    python docs/prompts/runs/F2c/consumers.py
"""
import json
import sys
from pathlib import Path

WT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(WT / "tools" / "content"))
import claims  # noqa: E402
import excerpt_proposer as P  # noqa: E402
import excerpts as X  # noqa: E402

skills, demands = claims.load_vocabulary()
curriculum = json.loads((WT / "app" / "public" / "content" / "curriculum.json").read_text(encoding="utf-8"))
definitions = json.loads((WT / "content" / "sources" / "excerpts.json").read_text(encoding="utf-8"))
seed = P.load_seed()
targets = sorted({t for row in definitions.get("excerpts", []) for t in (row.get("targets") or [])})


def reading(label: str) -> None:
    naming = claims.concepts_naming(skills, demands)
    print(f"== {label}: CONCEPT_DEMANDS['leaps'] = {claims.CONCEPT_DEMANDS.get('leaps')}")
    print(f"  concepts_naming interval.leap: {sorted(naming.get('interval.leap', set()))}")
    print(f"  teaching_rungs interval.leap: {claims.teaching_rungs(curriculum, skills, demands)['interval.leap']}")
    print(f"  excerpts.concepts_for(['interval.leap']): {X.concepts_for(['interval.leap'])}")
    print(f"  excerpt_proposer.seed_works_for(['interval.leap']): {[w['work'] for w in P.seed_works_for(['interval.leap'], seed, skills, demands)]}")
    errors, warnings = __import__('validate').taught_at_findings(
        {"skills": list(skills.values())}, {"demands": list(demands.values())}, curriculum)
    print(f"  validate.taught_at_findings: errors {errors}; warnings {warnings}")


print(f"excerpts.json approved targets: {targets} (interval.leap among them: {'interval.leap' in targets})")
print(f"teaching-repertoire works naming leap or leaps: "
      f"{[w['work'] for w in seed.get('works', []) if {'leap', 'leaps'} & set(w.get('concepts', []))]}")
reading("after (as committed in this tree)")
claims.CONCEPT_DEMANDS["leaps"] = "interval.leap"
reading("before (the removed line put back in memory)")
