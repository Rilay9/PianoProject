"""Who imports a module: direct and transitive importers under app/src, and the files under app/tests
that import it or any of its importers (Q65a, the fan-out classification).

A relationship between files, read from the import statements (`import ... from '...'`,
`import '...'`, `import(...)`, `import.meta.glob(...)` are all matched by the quoted relative
specifier). For each module given, prints:

  - the direct importers under app/src;
  - how many files under app/src reach it transitively, and which of them are screens
    (`app/src/ui/screens/*`), with the count of screens;
  - the e2e spec files and helpers that import it (or a transitive importer) directly — for a test-side
    helper that is its whole reach; for an app module the specs reach it through the screens instead.

    python docs/prompts/runs/Q65a/scripts/importers.py . app/src/ui/screens/screenFrame.ts ...
"""
from __future__ import annotations

import re
import sys
from pathlib import Path, PurePosixPath

root = Path(sys.argv[1]).resolve()
targets = sys.argv[2:]
SPEC = re.compile(r"""(?:from\s+|import\s*\(\s*|import\s+|glob\(\s*|require\(\s*)['"](\.{1,2}/[^'"]+)['"]""")
EXTS = ("", ".ts", ".js", ".mjs", ".json", ".css", "/index.ts")


def files(under: str) -> list[Path]:
    base = root / under
    return [p for p in base.rglob("*") if p.is_file() and p.suffix in (".ts", ".mjs", ".js") and "node_modules" not in p.parts]


def resolve(src: Path, spec: str) -> set[str]:
    out: set[str] = set()
    base = (src.parent / spec)
    if "*" in spec:  # import.meta.glob
        for p in src.parent.glob(spec):
            out.add(p.resolve().relative_to(root).as_posix())
        return out
    for ext in EXTS:
        cand = Path(str(base) + ext)
        if cand.is_file():
            out.add(cand.resolve().relative_to(root).as_posix())
            break
    return out


graph: dict[str, set[str]] = {}  # file -> what it imports
universe = files("app/src") + files("app/tests") + [p for p in (root / "app").glob("*.ts")]
for f in universe:
    rel = f.relative_to(root).as_posix()
    text = f.read_text(encoding="utf-8", errors="replace")
    deps: set[str] = set()
    for m in SPEC.finditer(text):
        deps |= resolve(f, m.group(1))
    graph[rel] = deps

rev: dict[str, set[str]] = {}
for f, deps in graph.items():
    for d in deps:
        rev.setdefault(d, set()).add(f)


def importers_of(target: str) -> set[str]:
    seen, todo = set(), [target]
    while todo:
        cur = todo.pop()
        for imp in rev.get(cur, ()):
            if imp not in seen:
                seen.add(imp)
                todo.append(imp)
    return seen


e2e_specs = sorted(p.relative_to(root).as_posix() for p in (root / "app/tests/e2e").glob("*.spec.ts"))
screens_all = sorted(p.relative_to(root).as_posix() for p in (root / "app/src/ui/screens").glob("*.ts"))
for target in targets:
    t = PurePosixPath(target).as_posix()
    direct = sorted(x for x in rev.get(t, ()) if x.startswith("app/src/"))
    trans = importers_of(t)
    src_t = sorted(x for x in trans if x.startswith("app/src/"))
    screens = sorted(x for x in src_t if x.startswith("app/src/ui/screens/"))
    specs = sorted(x for x in trans if x in e2e_specs)
    tests_other = sorted(x for x in trans if x.startswith("app/tests/") and x not in e2e_specs)
    print(f"== {t}")
    print(f"   direct importers under app/src ({len(direct)}): {' '.join(PurePosixPath(d).name for d in direct) or '-'}")
    print(f"   transitive importers under app/src: {len(src_t)}; screens among them: {len(screens)} of {len(screens_all)} files in ui/screens"
          + (f" ({' '.join(PurePosixPath(s).name for s in screens)})" if len(screens) <= 40 else ""))
    print(f"   main.ts reaches it: {'app/src/main.ts' in trans or t == 'app/src/main.ts'}")
    print(f"   e2e specs importing it directly or through a test helper ({len(specs)} of {len(e2e_specs)}): {' '.join(PurePosixPath(s).name for s in specs) or '-'}")
    if tests_other:
        print(f"   other test files importing it ({len(tests_other)}): {' '.join(x.replace('app/tests/', '') for x in tests_other[:60])}{' ...' if len(tests_other) > 60 else ''}")
