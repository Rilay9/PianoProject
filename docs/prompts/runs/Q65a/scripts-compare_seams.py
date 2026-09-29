"""The nine landed seams through the map, before and after Q65a, beside what each seam's chain ran.

For each implementation commit: its changed paths (against its first parent, `git diff --name-only`,
the same list `git show --stat` prints), the checks the map at 76c9ade (before Q65a) and the map in
the working tree (after) name for them, and the chain's steps and named files, read from the
chain's own script (`chains/<seam>.run.sh`, the orchestrator's, copied here) and its exit lines
(`docs/prompts/runs/<seam>/orchestrator-exit.txt`). For the browser suite it prints the specs on
each side and the differences, and which changed paths made the map ask for the whole suite.

    python docs/prompts/runs/Q65a/scripts/compare_seams.py .
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

root = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(root / "tools" / "docs"))
import checks_for_paths as cfp  # noqa: E402

SEAMS = [("D4", "9193261"), ("E2", "2532022"), ("F2", "b41e19e"), ("D4a", "5193338"), ("D5", "458159e"),
         ("E2a", "9571a7b"), ("G1", "b48342f"), ("Q47", "8668afb"), ("U74", "9c9cf86")]
BEFORE = "76c9ade"
WHOLE_E2E = "npx playwright test --workers=4"
WHOLE_UNIT = "npx vitest run"
e2e_tree = {p.name for p in (root / "app" / "tests" / "e2e").glob("*.spec.ts")}


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=root, check=True, capture_output=True, text=True, encoding="utf-8").stdout


before_map = cfp.load_map_data(json.loads(git("show", f"{BEFORE}:docs/prompts/checks.json")))
after_map = cfp.load_map()


def summary(result: cfp.Result) -> dict:
    out: dict = {"ids": [], "e2e": None, "unit": None, "content": None}
    content = []
    for check_id, _cwd, command in result.commands:
        if check_id not in out["ids"]:
            out["ids"].append(check_id)
        if check_id == "e2e":
            out["e2e"] = "*" if command == WHOLE_E2E else sorted(PurePosixPath(n).name for n in command.split() if n.endswith(".spec.ts"))
        elif check_id == "unit":
            out["unit"] = "*" if command == WHOLE_UNIT else sorted(PurePosixPath(n).name for n in command.split() if n.endswith(".test.ts"))
        elif check_id == "content-tests":
            content.append("*" if "-p " not in command else command.split("-p ", 1)[1])
    out["content"] = "*" if "*" in content else (sorted(content) or None)
    return out


def whole_because(paths: list[str], the_map: cfp.Map) -> list[str]:
    hits = []
    for path in paths:
        for p in the_map.patterns:
            if p.matches(path) and p.checks.get("e2e") == "*":
                hits.append(f"{path} ({p.pattern})")
    return hits


def chain(seam: str) -> dict:
    script = (root / "docs" / "prompts" / "runs" / "Q65a" / "chains" / f"{seam}.run.sh").read_text(encoding="utf-8")
    steps = re.findall(r"^step (\S+) (.+)$", script, re.M)
    e2e, unit, content = [], [], []
    for _name, command in steps:
        if "playwright test" in command:
            e2e += [PurePosixPath(n).name for n in command.split() if n.endswith(".spec.ts")]
        if "vitest run" in command:
            unit += [PurePosixPath(n).name for n in command.split() if n.endswith(".test.ts")]
        if "unittest tools.content.tests." in command:
            content += [n.split(".")[-1] + ".py" for n in command.split() if n.startswith("tools.content.tests.")]
    exits = (root / "docs" / "prompts" / "runs" / seam / "orchestrator-exit.txt").read_text(encoding="utf-8")
    return {"steps": [n for n, _ in steps], "exits": re.findall(r"^(\S+) exit=(\d+)$", exits, re.M),
            "e2e": sorted(set(e2e)), "unit": sorted(set(unit)), "content": sorted(set(content))}


def fmt(value) -> str:
    if value is None:
        return "none"
    if value == "*":
        return "whole"
    return f"{len(value)} named"


for seam, commit in SEAMS:
    paths = git("diff", "--name-only", "--no-renames", f"{commit}^1", commit).split()
    paths = [p for p in paths if not p.startswith(("docs/prompts/runs/", "docs/prompts/pictures/"))]
    before = cfp.checks_for(paths, before_map, root)
    after = cfp.checks_for(paths, after_map, root)
    b, a, c = summary(before), summary(after), chain(seam)
    print(f"== {seam} ({commit}): {len(paths)} changed path(s) outside the capture folders; unmatched before {before.unmatched or 'none'}, after {after.unmatched or 'none'}")
    print(f"   before: {', '.join(b['ids'])}; e2e {fmt(b['e2e'])}, unit {fmt(b['unit'])}, content-tests {fmt(b['content'])}")
    print(f"   after:  {', '.join(a['ids'])}; e2e {fmt(a['e2e'])}, unit {fmt(a['unit'])}, content-tests {fmt(a['content'])}")
    print(f"   chain:  steps {', '.join(c['steps'])}; exits {', '.join(f'{n}={x}' for n, x in c['exits'])}")
    print(f"   chain e2e ({len(c['e2e'])}): {' '.join(c['e2e']) or '-'}")
    missing = [s for s in c["e2e"] if s not in e2e_tree]
    if missing:
        print(f"   chain e2e names not in the tree (a filter that matched nothing, or a probe copied in for the run): {' '.join(missing)}")
    if a["e2e"] == "*":
        print(f"   after, the whole suite because: {'; '.join(whole_because(paths, after_map))}")
    elif a["e2e"]:
        print(f"   after e2e ({len(a['e2e'])}): {' '.join(a['e2e'])}")
        print(f"   after names, chain did not run: {' '.join(s for s in a['e2e'] if s not in c['e2e']) or '-'}")
        print(f"   chain ran, after does not name: {' '.join(s for s in c['e2e'] if s not in a['e2e'] and s in e2e_tree) or '-'}")
    else:
        print("   after e2e: none")
        if c["e2e"]:
            print(f"   chain ran, after does not name: {' '.join(s for s in c['e2e'] if s in e2e_tree) or '-'}")
    if a["unit"] not in (None, "*"):
        print(f"   after unit named: {' '.join(a['unit'])}; chain unit: {' '.join(c['unit']) or '-'}")
    elif c["unit"]:
        print(f"   chain unit ({len(c['unit'])} named) inside the map's {fmt(a['unit'])}")
    if c["content"]:
        print(f"   chain content-tests ({len(c['content'])}): {' '.join(c['content'])}; map: {fmt(a['content'])}"
              + ("" if a["content"] in (None, "*") else f" ({' '.join(a['content'])})"))
    print()
