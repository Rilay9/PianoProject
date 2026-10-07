"""
E50b (Entry 181): the before build (the base, build/e50b/before) against the after build (app/public/content), read in
place. Every built score file compared byte for byte; every catalogue row compared field by field (the top level and
the provenance, one level down); what the seven repaired rows and the Wabash cut carry; the approval's state.
Output: runs/E50b/compare.txt.

    python scripts-compare.py <before dir> <after dir>
"""
from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

W = Path(__file__).resolve().parents[4]
LOG = W / "docs" / "prompts" / "runs" / "E50b" / "compare.txt"
CUT = "excerpt.blues.wabash-blues.b1-4"


def load(folder: Path) -> dict[str, dict]:
    return {row["id"]: row for row in json.loads((folder / "catalog.json").read_text(encoding="utf-8"))}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def moved(a: dict, b: dict) -> list[str]:
    out = []
    for key in sorted(set(a) | set(b)):
        if key == "provenance":
            pa, pb = a.get(key) or {}, b.get(key) or {}
            out += [f"provenance.{k}" for k in sorted(set(pa) | set(pb)) if pa.get(k) != pb.get(k)]
        elif a.get(key) != b.get(key):
            out.append(key)
    return out


def main(argv: list[str]) -> int:
    before_dir, after_dir = Path(argv[0]), Path(argv[1])
    before, after = load(before_dir), load(after_dir)
    table = json.loads((W / "tools/content/repaired_identities.json").read_text(encoding="utf-8"))
    lines = [f"before {before_dir} ({len(before)} rows); after {after_dir} ({len(after)} rows); the same ids: {set(before) == set(after)}", ""]

    lines.append("## 1. every built score file")
    files_b = {p.relative_to(before_dir).as_posix(): p for p in (before_dir / "scores").rglob("*") if p.is_file()}
    files_a = {p.relative_to(after_dir).as_posix(): p for p in (after_dir / "scores").rglob("*") if p.is_file()}
    changed = sorted(rel for rel in set(files_b) & set(files_a) if sha(files_b[rel]) != sha(files_a[rel]))
    lines.append(f"   files: before {len(files_b)}, after {len(files_a)}; only before {sorted(set(files_b) - set(files_a))[:5]}; "
                 f"only after {sorted(set(files_a) - set(files_b))[:5]}")
    lines.append(f"   byte-identical: {len(set(files_b) & set(files_a)) - len(changed)}; changed: {len(changed)} {changed[:10]}")
    lines.append("")

    lines.append("## 2. every catalogue row, field by field")
    counts: Counter[str] = Counter()
    by_row: dict[str, list[str]] = {}
    for row_id in sorted(set(before) & set(after)):
        fields = moved(before[row_id], after[row_id])
        if fields:
            by_row[row_id] = fields
            counts.update(fields)
    identity_moved = [r for r in set(before) & set(after) if (before[r].get("provenance") or {}).get("identity") != (after[r].get("provenance") or {}).get("identity")]
    lines.append(f"   rows with any field moved: {len(by_row)}; identity moved: {len(identity_moved)}")
    for field, n in sorted(counts.items()):
        lines.append(f"   {field}: {n} row(s)")
    for row_id, fields in by_row.items():
        lines.append(f"   {row_id}: {fields}")
    lines.append("")

    lines.append("## 3. what the repaired rows carry, after")
    expected = {r["id"]: r["from"] for r in table["repairs"]} | {c["id"]: c["from"] for c in table.get("cuts", [])}
    faults = []
    for row_id, old in expected.items():
        prov = after[row_id]["provenance"]
        former = [one["sha256"] for one in prov.get("formerIdentities") or []]
        tempo = [one["sha256"] for one in prov.get("tempoRepairedFrom") or []]
        lines.append(f"   {row_id}: identity {prov['identity']['sha256'][:12]}; formerIdentities {[s[:12] for s in former]}; "
                     f"tempoRepairedFrom {[s[:12] for s in tempo]}; tempoBpm {after[row_id].get('tempoBpm')}")
        if former != [old] or tempo != [old]:
            faults.append(row_id)
    marked = sorted(r for r, row in after.items() if "tempoRepairedFrom" in row["provenance"])
    lines.append(f"   rows carrying tempoRepairedFrom: {len(marked)}; exactly the seven and the cut: {marked == sorted(expected)}")
    currents = {row["provenance"]["identity"].get("sha256") for row in after.values() if row["provenance"].get("identity", {}).get("kind") == "file"}
    clashes = [r for r, row in after.items() for one in row["provenance"].get("formerIdentities") or [] if one["sha256"] in currents]
    lines.append(f"   former identities that are some row's current identity: {len(clashes)}")
    lines.append("")

    lines.append("## 4. the Wabash approval, before and after")
    for name, rows in (("before", before), ("after", after)):
        block = rows[CUT]["provenance"]["excerpt"]
        lines.append(f"   {name}: parentSha256 {block['parentSha256'][:12]}; stale {block.get('stale')}; cutVersion {block['cutVersion']}, "
                     f"approvedCutVersion {block.get('approvedCutVersion')}; the cut's identity {rows[CUT]['provenance']['identity']['sha256'][:12]}")
    approval = next(r for r in json.loads((W / "content/sources/excerpts.json").read_text(encoding="utf-8"))["excerpts"] if r["of"] == "song.blues.wabash-blues")
    lines.append(f"   excerpts.json's row: parentSha256 {approval['parentSha256'][:12]}, cutVersion {approval.get('cutVersion')} (unchanged in the tree)")
    lines.append("")
    lines.append(f"{len(faults)} fault(s) {faults}")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if faults or changed or identity_moved else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
