"""The minimum checks for the paths a seam touches, read from the committed map (Q65).

`docs/prompts/checks.json` holds the checks (each a command, the directory it runs in, and the CI
step that runs it) in the chain's order, and the path patterns: each pattern, the checks a change
under it needs, and the reason. This script prints the union of the checks for the paths given,
deduplicated, in the chain's order, one command per line as `id<TAB>cwd<TAB>command`; the
orchestrator's chain for a landing is that output, and judgement adds to it where a change is
cross-cutting. `tools/content/tests/test_ci_order.py` asserts CI runs every check the map names.

Patterns take `**`, which crosses directories, and `*` and `?`, which do not; nothing else. Every pattern matching a path contributes
(the union, never a subtraction). A check's value is `true`, `"*"` (the whole suite), or a list of
names: files relative to the check's directory, globs expanded against the tree, or `{self}` for
the changed file itself. The whole suite wins over named files. A check may name `covered_by`
another check (`unit-related` by `unit`): when that one runs whole, this one is not printed.

A path no pattern names falls back to the full required suites (the map's `fallback`) and is
printed as UNMATCHED, on stdout among the comments and on stderr, so the map can be extended. It
is never refused and never blocks a landing (the reviewer's decision, `responses/d1562ef.md`).

    python tools/docs/checks_for_paths.py content/lessons/blues.5.md app/src/router.ts
    python tools/docs/checks_for_paths.py --json $(git diff --name-only HEAD~1)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[2]
MAP = ROOT / "docs" / "prompts" / "checks.json"
SELF = "{self}"


def glob_regex(pattern: str) -> re.Pattern[str]:
    out, i = [], 0
    while i < len(pattern):
        if pattern.startswith("**/", i):
            out.append("(?:.*/)?")
            i += 3
        elif pattern.startswith("**", i):
            out.append(".*")
            i += 2
        elif pattern[i] == "*":
            out.append("[^/]*")
            i += 1
        elif pattern[i] == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(pattern[i]))
            i += 1
    return re.compile("".join(out) + r"\Z")


@dataclass(frozen=True)
class Check:
    id: str
    cwd: str
    run: str
    whole: str | None
    each: bool
    names_in: str  # the directory named files are relative to (default: the check's cwd)
    covered_by: str | None = None  # a check whose whole form already runs this one: not printed then


@dataclass
class Pattern:
    pattern: str
    checks: dict[str, object]
    reason: str
    regex: re.Pattern[str] = field(repr=False, default=None)  # type: ignore[assignment]

    def matches(self, path: str) -> bool:
        return bool(self.regex.match(path))


@dataclass
class Map:
    checks: list[Check]
    patterns: list[Pattern]
    fallback: dict[str, object]


@dataclass
class Result:
    commands: list[tuple[str, str, str]]
    matched: dict[str, list[str]]
    unmatched: list[str]


def load_map_data(data: dict) -> Map:
    checks = [
        Check(c["id"], c.get("cwd", "."), c["run"], c.get("whole"), bool(c.get("each")), c.get("names_in", c.get("cwd", ".")), c.get("covered_by"))
        for c in data["checks"]
    ]
    known = {c.id for c in checks}
    for c in checks:
        if c.covered_by is not None and c.covered_by not in known:
            raise ValueError(f"{c.id}: covered_by names unknown check {c.covered_by}")
    patterns = [Pattern(p["pattern"], dict(p.get("checks", {})), p.get("reason", "")) for p in data["patterns"]]
    fallback = dict(data["fallback"]["checks"])
    for where, wanted in [(p.pattern, p.checks) for p in patterns] + [("fallback", fallback)]:
        unknown = sorted(set(wanted) - known)
        if unknown:
            raise ValueError(f"{where}: unknown check(s) {', '.join(unknown)}")
    for p in patterns:
        if any(ch in p.pattern for ch in "[]{}"):
            raise ValueError(f"{p.pattern}: patterns take **, * and ? only; write one pattern per path instead")
        p.regex = glob_regex(p.pattern)
    return Map(checks, patterns, fallback)


def load_map(path: Path = MAP) -> Map:
    return load_map_data(json.loads(path.read_text(encoding="utf-8")))


def normalise(path: str, root: Path) -> str:
    text = path.replace("\\", "/")
    candidate = Path(text)
    if candidate.is_absolute():
        try:
            text = candidate.resolve().relative_to(root.resolve()).as_posix()
        except ValueError:
            pass
    while text.startswith("./"):
        text = text[2:]
    return text


def expand(name: str, check: Check, changed: str, root: Path) -> list[str]:
    if name == SELF:
        prefix = "" if check.names_in in ("", ".") else check.names_in.rstrip("/") + "/"
        return [changed[len(prefix):] if prefix and changed.startswith(prefix) else PurePosixPath(changed).as_posix()]
    if any(ch in name for ch in "*?["):
        base = root / check.names_in
        return sorted(p.relative_to(base).as_posix() for p in base.glob(name) if p.is_file())
    return [name]


def checks_for(paths: list[str], the_map: Map, root: Path = ROOT) -> Result:
    wanted: dict[str, object] = {}  # id -> True, "*", or a set of names
    matched: dict[str, list[str]] = {}
    unmatched: list[str] = []

    def add(checks: dict[str, object], changed: str) -> None:
        for check_id, value in checks.items():
            check = next(c for c in the_map.checks if c.id == check_id)
            if value is True and check.whole:
                value = "*"  # a check that has a whole form, asked for without names, is the whole
            if value == "*" or wanted.get(check_id) == "*":
                wanted[check_id] = "*"
            elif value is True:
                wanted.setdefault(check_id, True)
            elif isinstance(value, list):
                names = wanted.get(check_id)
                names = set() if not isinstance(names, set) else names
                for name in value:
                    names.update(expand(str(name), check, changed, root))
                wanted[check_id] = names

    for raw in paths:
        path = normalise(raw, root)
        hits = [p for p in the_map.patterns if p.matches(path)]
        if not hits:
            unmatched.append(path)
            add(the_map.fallback, path)
            continue
        matched[path] = [p.pattern for p in hits]
        for p in hits:
            add(p.checks, path)

    commands: list[tuple[str, str, str]] = []
    for check in the_map.checks:
        value = wanted.get(check.id)
        if value is None:
            continue
        if check.covered_by and wanted.get(check.covered_by) == "*":
            continue  # the cover's whole suite already runs everything this one would
        if value == "*" or (value is True and check.whole):
            commands.append((check.id, check.cwd, check.whole or check.run))
        elif value is True:
            commands.append((check.id, check.cwd, check.run))
        elif isinstance(value, set):
            names = sorted(value)
            if not names:
                continue
            if check.each:
                commands += [(check.id, check.cwd, check.run.replace("{name}", n)) for n in names]
            else:
                commands.append((check.id, check.cwd, check.run.replace("{names}", " ".join(names))))
    return Result(commands, matched, unmatched)


def missing_names(the_map: Map, root: Path = ROOT) -> list[str]:
    """Named files and globs in the map that the tree does not have (a renamed spec, a typo)."""
    out = []
    for p in the_map.patterns:
        for check_id, value in p.checks.items():
            if not isinstance(value, list):
                continue
            check = next(c for c in the_map.checks if c.id == check_id)
            for name in value:
                if name == SELF:
                    continue
                if not list((root / check.names_in).glob(str(name))):
                    out.append(f"{p.pattern}: {check_id} names {name}")
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("paths", nargs="*", help="repository paths a seam changed")
    parser.add_argument("--map", type=Path, default=MAP, help="the map (default docs/prompts/checks.json)")
    parser.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    parser.add_argument("--json", action="store_true", help="print the result as JSON")
    args = parser.parse_args(argv)
    the_map = load_map(args.map)
    result = checks_for(args.paths, the_map, args.root)
    for path in result.unmatched:
        print(f"UNMATCHED: {path}: no pattern in {args.map.name} names it; the full required suites run. "
              "Add a pattern for it.", file=sys.stderr)
    if args.json:
        print(json.dumps({
            "matched": result.matched,
            "unmatched": result.unmatched,
            "commands": [{"id": i, "cwd": c, "run": r} for i, c, r in result.commands],
        }, indent=2))
        return 0
    print(f"# checks for {len(args.paths)} path(s): {len(result.matched)} matched, {len(result.unmatched)} unmatched")
    for path in result.unmatched:
        print(f"# UNMATCHED {path}: no pattern names it; the full required suites run")
    for path, patterns in result.matched.items():
        print(f"# {path}: {', '.join(patterns)}")
    if not result.commands:
        print("# no checks: nothing the map names reads these paths")
    for check_id, cwd, command in result.commands:
        print(f"{check_id}\t{cwd}\t{command}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
