"""The union the two frame helpers' rows should name (Q65b): for screenFrame.ts and subScreen.ts, the
screen files that reach each by import statements, the browser specs the committed map gives each
of them (read through tools/docs/checks_for_paths.py, the reader the chain uses), and their union
compared with the whole default Playwright suite.

The import graph is Q65a's (runs/Q65a/scripts-importers.py): a quoted relative specifier after
`from`, `import`, `import(`, `glob(` or `require(`. Reach is transitive: a screen that imports a
screen that imports the helper runs the helper's code too. The walk does not pass through
app/src/ui/AppShell.ts or app/src/main.ts: they import every screen to mount it, and their own rows
are the whole suite because their code runs on every spec's path; the helper's code runs only where
a screen that reaches it is mounted. Both the direct importers and the transitive ones are printed.

The whole default suite is every *.spec.ts under app/tests/e2e (playwright.config.ts: testDir
./tests/e2e, the default testMatch); the four environment-gated specs are printed apart, since a
list that leaves them out still runs everything the whole configuration runs by default.

    python docs/prompts/runs/Q65b/scripts-union.py .
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path, PurePosixPath

root = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(root / "tools" / "docs"))
import checks_for_paths as cfp  # noqa: E402

HELPERS = ["app/src/ui/screens/screenFrame.ts", "app/src/ui/screens/subScreen.ts"]
MOUNTS = {"app/src/ui/AppShell.ts", "app/src/main.ts"}
ENV_GATED = {"bisect-render.spec.ts", "content-render.spec.ts", "generate-audio-fixtures.spec.ts", "guide-shots.spec.ts"}
SPEC = re.compile(r"""(?:from\s+|import\s*\(\s*|import\s+|glob\(\s*|require\(\s*)['"](\.{1,2}/[^'"]+)['"]""")
EXTS = ("", ".ts", ".js", ".mjs", ".json", ".css", "/index.ts")


def resolve(src: Path, spec: str) -> set[str]:
    base = src.parent / spec
    if "*" in spec:
        return {p.resolve().relative_to(root).as_posix() for p in src.parent.glob(spec)}
    for ext in EXTS:
        cand = Path(str(base) + ext)
        if cand.is_file():
            return {cand.resolve().relative_to(root).as_posix()}
    return set()


rev: dict[str, set[str]] = {}
for f in (root / "app" / "src").rglob("*"):
    if not f.is_file() or f.suffix not in (".ts", ".mjs", ".js"):
        continue
    rel = f.relative_to(root).as_posix()
    for m in SPEC.finditer(f.read_text(encoding="utf-8", errors="replace")):
        for dep in resolve(f, m.group(1)):
            rev.setdefault(dep, set()).add(rel)


def closure(target: str) -> tuple[set[str], set[str]]:
    """Every file reaching target by imports, not walking through the mounts; and the mounts met."""
    seen, met, todo = set(), set(), [target]
    while todo:
        for imp in rev.get(todo.pop(), ()):
            if imp in MOUNTS:
                met.add(imp)
            elif imp not in seen:
                seen.add(imp)
                todo.append(imp)
    return seen, met


the_map = cfp.load_map(root / "docs" / "prompts" / "checks.json")
specs_all = sorted(p.name for p in (root / "app" / "tests" / "e2e").rglob("*.spec.ts"))
default_run = [s for s in specs_all if s not in ENV_GATED]
print(f"default suite: {len(specs_all)} spec files under app/tests/e2e; {len(default_run)} outside the environment-gated four")


def e2e_of(path: str) -> tuple[object, list[str]]:
    """The reader's e2e for one path: "*" (the whole suite), a sorted list of spec names, or None."""
    result = cfp.checks_for([path], the_map, root)
    e2e = [c for c in result.commands if c[0] == "e2e"]
    patterns = result.matched.get(path, ["UNMATCHED"])
    if not e2e:
        return None, patterns
    if e2e[0] == ("e2e", "app", "npx playwright test --workers=4"):
        return "*", patterns
    return sorted(PurePosixPath(n).name for n in e2e[0][2].split() if n.endswith(".spec.ts")), patterns


summary = {}
for helper in HELPERS:
    direct = sorted(x for x in rev.get(helper, ()) if x not in MOUNTS)
    reach, mounts = closure(helper)
    screens = sorted(x for x in reach if x.startswith("app/src/ui/screens/"))
    others = sorted(x for x in reach if not x.startswith("app/src/ui/screens/"))
    print(f"\n== {helper}")
    print(f"   direct importers ({len(direct)}): {' '.join(PurePosixPath(d).name for d in direct)}")
    print(f"   reached transitively, mounts not walked ({len(reach)}): screens {len(screens)}, other files {len(others)}"
          + (f" ({' '.join(others)})" if others else ""))
    print(f"   transitive only: {' '.join(PurePosixPath(s).name for s in screens if s not in direct) or '-'}")
    print(f"   mounts met and not walked: {' '.join(sorted(mounts)) or '-'}")
    union: set[str] = set()
    whole_for: list[str] = []
    print("   importer | patterns | e2e the map gives it")
    for imp in sorted(reach):
        value, patterns = e2e_of(imp)
        tag = "direct" if imp in direct else "transitive"
        if value is None:
            whole_for.append(imp)
            print(f"   {PurePosixPath(imp).name} ({tag}) | {', '.join(patterns)} | NO e2e SET OF ITS OWN")
        elif value == "*":
            whole_for.append(imp)
            print(f"   {PurePosixPath(imp).name} ({tag}) | {', '.join(patterns)} | the whole suite")
        else:
            union |= set(value)
            print(f"   {PurePosixPath(imp).name} ({tag}) | {', '.join(patterns)} | {len(value)}: {' '.join(value)}")
    direct_union: set[str] = set()
    for imp in direct:
        value, _ = e2e_of(imp)
        if isinstance(value, list):
            direct_union |= set(value)
    print(f"   union over the direct importers: {len(direct_union)}")
    print(f"   union over every importer reached: {len(union)}; importers with no named set: {' '.join(whole_for) or 'none'}")
    missing_default = [s for s in default_run if s not in union]
    print(f"   equals the whole default suite: {not missing_default and not whole_for}"
          f" (default specs outside the union: {len(missing_default)})")
    print(f"   the union, sorted: {' '.join(sorted(union))}")
    summary[helper] = {"importers": [PurePosixPath(i).stem for i in sorted(reach)],
                       "e2e": [f"tests/e2e/{s}" for s in sorted(union)],
                       "whole": bool(whole_for) or not missing_default}

print("\n# the rows' e2e lists as JSON (sorted, deduplicated)")
for helper, row in summary.items():
    print(helper, json.dumps(row["e2e"]))
