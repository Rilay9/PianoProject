"""
L120d (item 5): the catalogue diff between two builds — every row whole, the measurement's fingerprint stamp
(`measurement.detectors`, which moves with `demands.json`) set aside and counted. L120b's diff
(`docs/prompts/runs/L120b/scripts-catalog-diff.py`) compared demands, located counts and the established set; this
compares every field, `measurement.span` among them. The brief expects no row to move but the stamp: the vocabulary
is not on a row, and the re-measure reproduces every measurement. Run from the worktree root:

    python docs/prompts/runs/L120d/scripts-catalog-diff.py build/l120d-base/catalog.json build/l120d-after/catalog.json OUT.txt
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path


#: The stamps set aside, each counted: the measuring fingerprint on the measurement and again in the provenance's
#: demands fact (both move with `demands.json`), and the time a source was read this build (`source.fetchedAt`, the
#: same stamp SOURCES.md's diff carries). A first run compared them too: they were the only fields that moved.
STAMPS = (("measurement", "detectors"), ("provenance", "facts", "demands", "detectors"), ("source", "fetchedAt"))


def stamp_of(item: dict, path: tuple[str, ...]):
    node = item
    for key in path:
        if not isinstance(node, dict) or key not in node:
            return None
        node = node[key]
    return node


def without_stamp(item: dict) -> dict:
    out = json.loads(json.dumps(item))
    for path in STAMPS:
        node = out
        for key in path[:-1]:
            node = node.get(key) if isinstance(node, dict) else None
        if isinstance(node, dict):
            node.pop(path[-1], None)
    return out


def fields_differing(a: dict, b: dict, prefix: str = "") -> list[str]:
    out = []
    for key in sorted(set(a) | set(b)):
        va, vb = a.get(key, "<absent>"), b.get(key, "<absent>")
        if va == vb:
            continue
        if isinstance(va, dict) and isinstance(vb, dict):
            out += fields_differing(va, vb, f"{prefix}{key}.")
        else:
            out.append(f"{prefix}{key}: {json.dumps(va)[:120]} -> {json.dumps(vb)[:120]}")
    return out


def main(before_path: str, after_path: str, out_path: str) -> int:
    before = {it["id"]: it for it in json.loads(Path(before_path).read_text(encoding="utf-8"))}
    after = {it["id"]: it for it in json.loads(Path(after_path).read_text(encoding="utf-8"))}
    stamps = Counter()
    moved: dict[str, list[str]] = {}
    for ident in sorted(set(before) | set(after)):
        a, b = before.get(ident), after.get(ident)
        if a is None or b is None:
            moved[ident] = [f"only in {'after' if a is None else 'before'}"]
            continue
        for path in STAMPS:
            sa, sb = stamp_of(a, path), stamp_of(b, path)
            if sa != sb:
                stamps[".".join(path) if path[-1] == "fetchedAt" else f"{'.'.join(path)} {sa} -> {sb}"] += 1
        diff = fields_differing(without_stamp(a), without_stamp(b))
        if diff:
            moved[ident] = diff
    lines = [f"# Catalogue diff: {before_path} -> {after_path}", "",
             f"- rows before: {len(before)}; rows after: {len(after)}; in both: {len(set(before) & set(after))}",
             "- the stamps set aside moved on: " + ("; ".join(f"{n} rows ({k})" for k, n in stamps.items()) or "no row"),
             f"- rows with any other field moved: {len(moved)}", ""]
    for ident, diff in moved.items():
        lines.append(f"## {ident}")
        lines += [f"- {d}" for d in diff]
        lines.append("")
    if not moved:
        lines.append("none")
    Path(out_path).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:6]))
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:4]))
