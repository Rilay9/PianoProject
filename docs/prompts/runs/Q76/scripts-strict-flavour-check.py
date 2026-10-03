"""
Is the test's strict flavour the strict build? Compares, over the ids both catalogues hold:
  - the personal catalogue's rows tagged personal-build or nc-personal-build (what the test leaves unmeasured), with
  - the real strict build's rows that are unmeasured with no file (its placeholders);
and the 2.4 and ragtime.8 claim rows the claim rule gives on the simulated flavour and on the real strict catalogue.

    python scripts-strict-flavour-check.py <personal content dir> <strict content dir>
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
REPO = HERE.parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
sys.path.insert(0, str(REPO / "tools" / "content" / "tests"))
import claims  # noqa: E402
from test_public_tie_option import STRICT_PLACEHOLDER_TAGS, strict_flavour  # noqa: E402

personal_dir, strict_dir = Path(sys.argv[1]), Path(sys.argv[2])
personal = json.loads((personal_dir / "catalog.json").read_text(encoding="utf-8"))
strict = json.loads((strict_dir / "catalog.json").read_text(encoding="utf-8"))
p_ids = {i["id"] for i in personal}
s_by = {i["id"]: i for i in strict}
tagged = {i["id"] for i in personal if set(i.get("tags") or []) & set(STRICT_PLACEHOLDER_TAGS)}
placeheld = {i["id"] for i in strict if not i.get("file") and (i.get("measurement") or {}).get("status") == "unmeasured"}
personal_unfiled = {i["id"] for i in personal if not i.get("file") and (i.get("measurement") or {}).get("status") == "unmeasured"}
print("ids only in personal:", sorted(p_ids - set(s_by)))
print("ids only in strict:", sorted(set(s_by) - p_ids))
print("tagged in personal:", len(tagged), "| placeholders in strict:", len(placeheld), "| placeholders in personal too (every build):", len(personal_unfiled))
print("strict placeholders the tags miss (beyond the every-build ones):", sorted(placeheld - tagged - personal_unfiled))
print("tagged rows the strict build bundles:", sorted(i for i in tagged if i in s_by and s_by[i].get("file")))
curriculum = json.loads((personal_dir / "curriculum.json").read_text(encoding="utf-8"))
for name, cat in (("simulated", strict_flavour(personal)), ("real strict", strict)):
    report = claims.rung_claims(cat, curriculum)
    for r in report["rungs"]:
        if r["rung"] in ("2.4", "ragtime.8"):
            rows = [(c["id"], c["established"], c["measurable"], c["unmeasured"]) for c in r["claims"]
                    if c["id"] in ("tie", "rhythm.ties", "texture.left-hand-pattern")]
            print(f"{name:12} {r['rung']}: (claim, established, checked, unmeasured) {rows}")
