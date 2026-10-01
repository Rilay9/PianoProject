"""CL15's content items: every planned item whose notes, title, concepts or role moved, from two snapshots.

usage: python content_items.py <plan-base.json> <plan-after.json> <built catalog.json> <out.txt>
Each item: where, what moved, before and after (the notes as bar:beat pitch length, only the events
that differ, per staff), the identity before and after and whether the build carries the old one.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def staff_diff(before: list[str], after: list[str]) -> tuple[list[str], list[str]]:
    b, a = set(before), set(after)
    return [e for e in before if e not in a], [e for e in after if e not in b]


def ident(identity: dict) -> str:
    return f"{identity['family']} v{identity['version']}"


def main() -> None:
    base = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    after = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    catalog = {row["id"]: row for row in json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))}
    lines: list[str] = []
    counts: dict[str, dict[str, int]] = {}
    assert sorted(base) == sorted(after), "the plan's ids moved"
    for item_id in sorted(base):
        old, new = base[item_id], after[item_id]
        moved = []
        if old["digest"] != new["digest"]:
            moved.append("notes")
        for field in ("title", "concepts", "role", "tags", "level", "hands", "tempoBpm", "timeSig"):
            if old[field] != new[field]:
                moved.append(field)
        if old["identity"] != new["identity"]:
            moved.append("identity")
        family = new["family"]
        tally = counts.setdefault(family, {"items": 0, "notes": 0, "identity": 0, "carried": 0, "other": 0})
        tally["items"] += 1
        if not moved:
            continue
        row = catalog.get(item_id, {})
        former = (row.get("provenance") or {}).get("formerGeneratorIdentities")
        tally["notes"] += "notes" in moved
        tally["identity"] += "identity" in moved
        tally["carried"] += bool(former)
        tally["other"] += any(m not in ("notes", "identity") for m in moved)
        lines.append(f"- {item_id} ({family}; built scores/generated/{item_id}.mxl and its catalogue row) — moved: {', '.join(moved)}")
        if "title" in moved:
            lines.append(f"    title: {old['title']!r} -> {new['title']!r}")
        if "concepts" in moved:
            lines.append(f"    concepts: {old['concepts']} -> {new['concepts']}")
        if "role" in moved:
            lines.append(f"    role: {old['role']} -> {new['role']}")
        for field in ("tags", "level", "hands", "tempoBpm", "timeSig"):
            if field in moved:
                lines.append(f"    {field}: {old[field]} -> {new[field]}")
        if "notes" in moved:
            staffs = sorted(set(old["notes"]) | set(new["notes"]))
            for staff in staffs:
                gone, came = staff_diff(old["notes"].get(staff, []), new["notes"].get(staff, []))
                if gone or came:
                    lines.append(f"    {staff}: before {gone or '[]'}")
                    lines.append(f"    {staff}: after  {came or '[]'}")
        if "identity" in moved:
            carried = "carries the old identity (formerGeneratorIdentities)" if former else "no link to the old identity"
            lines.append(f"    identity: {ident(old['identity'])} -> {ident(new['identity'])}; music digest {'same' if old['digest'] == new['digest'] else 'changed'}; {carried}")
    head = ["counts per family that moved (items, notes changed, identity moved, old identity carried, other field moved):"]
    for family, tally in sorted(counts.items()):
        if tally["notes"] or tally["identity"] or tally["other"]:
            head.append(f"  {family}: {tally}")
    Path(sys.argv[4]).write_text("\n".join(head + [""] + lines) + "\n", encoding="utf-8")
    print("\n".join(head))


if __name__ == "__main__":
    main()
