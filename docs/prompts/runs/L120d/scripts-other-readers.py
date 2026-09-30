"""
L120d (item 5, "the other readers of untaught_on"): what each build reader of `claims.untaught_on` shows before and
after — the rung-claims report's untaught column (`claims.rung_claims`), the excerpts' candidate rungs
(`excerpts.candidate_rungs`, excerpts.py:891) and the studies' (`study.candidate_rungs`, study.py:1325). Each is
computed on its own build's catalogue and curriculum; "before" reads the base's vocabulary
(build/l120d-base/demands.json), "after" the working tree's. Run from the worktree root:

    python docs/prompts/runs/L120d/scripts-other-readers.py build/l120d-base build/l120d-after OUT.txt
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
import claims  # noqa: E402
import excerpts  # noqa: E402
import study  # noqa: E402

LIVE = claims.load_vocabulary


def with_vocabulary(demands_path: Path | None):
    if demands_path is None:
        claims.load_vocabulary = LIVE
        return
    skills, _ = LIVE()
    demands = {d["id"]: d for d in json.loads(demands_path.read_text(encoding="utf-8"))["demands"]}
    claims.load_vocabulary = lambda: (skills, demands)


def readings(build: Path) -> dict:
    catalog = json.loads((build / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((build / "curriculum.json").read_text(encoding="utf-8"))
    report = claims.rung_claims(catalog, curriculum)
    untaught = {(o["rung"], o["item"]): tuple(o["untaught"]) for o in report["options"] if o["untaught"]}
    ex = {row["item"]: tuple(c["rung"] for c in row["candidates"]) for row in excerpts.candidate_rungs(catalog, curriculum)}
    st = {row["item"]: tuple(c["rung"] for c in row["candidates"]) for row in study.candidate_rungs(catalog, curriculum)}
    return {"untaught": untaught, "excerpts": ex, "studies": st}


def main(before_dir: str, after_dir: str, out_path: str) -> int:
    with_vocabulary(ROOT / before_dir / "demands.json")
    before = readings(ROOT / before_dir)
    with_vocabulary(None)
    after = readings(ROOT / after_dir)
    out = [f"python docs/prompts/runs/L120d/scripts-other-readers.py {before_dir} {after_dir} {out_path}", ""]
    ub, ua = before["untaught"], after["untaught"]
    out.append("## The rung-claims report's untaught column (claims.rung_claims, the option's earliest listing)")
    out.append("")
    out.append(f"- options with an untaught demand: before {len(ub)}, after {len(ua)}")
    for key in sorted(set(ub) | set(ua)):
        if ub.get(key) != ua.get(key):
            out.append(f"  - {key[0]} {key[1]}: {list(ub.get(key, ()))} -> {list(ua.get(key, ()))}")
    out.append("")
    for name in ("excerpts", "studies"):
        b, a = before[name], after[name]
        out.append(f"## The {name}' candidate rungs ({'excerpts.py:891' if name == 'excerpts' else 'study.py:1325'})")
        out.append("")
        out.append(f"- items: before {len(b)}, after {len(a)}; candidate (item, rung) pairs: before {sum(len(v) for v in b.values())}, after {sum(len(v) for v in a.values())}")
        moved = [k for k in sorted(set(b) | set(a)) if b.get(k) != a.get(k)]
        out.append(f"- items whose candidate rungs moved: {len(moved)}")
        for key in moved:
            gained = sorted(set(a.get(key, ())) - set(b.get(key, ())))
            lost = sorted(set(b.get(key, ())) - set(a.get(key, ())))
            out.append(f"  - {key}: gained {gained or 'none'}; lost {lost or 'none'}")
        out.append("")
    Path(ROOT / out_path).write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out))
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:4]))
