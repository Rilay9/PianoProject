"""Every catalogue row whose shipped fields moved between two builds (CL15's content record).

usage: python catalog_diff.py <catalog-base.json> <catalog-after.json> <out.txt>
A row's `file` bytes are not compared here (generated files carry the title too); its fields are,
with `provenance` and `notation` compared key by key.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def flat(row: dict) -> dict:
    """The row's fields, nested blocks one level down; `source.fetchedAt` dropped (each build stamps its own fetch time)."""
    row = dict(row)
    if isinstance(row.get("source"), dict):
        row["source"] = {k: v for k, v in row["source"].items() if k != "fetchedAt"}
    out = {}
    for key, value in row.items():
        if key in ("provenance", "notation", "measurement", "drill") and isinstance(value, dict):
            for inner, v in value.items():
                out[f"{key}.{inner}"] = v
        else:
            out[key] = value
    return out


def short(value) -> str:
    text = json.dumps(value, ensure_ascii=False, sort_keys=True)
    return text if len(text) <= 300 else text[:300] + "…"


def main() -> None:
    base = {row["id"]: flat(row) for row in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))}
    after = {row["id"]: flat(row) for row in json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))}
    lines = []
    moved_rows = 0
    by_field: dict[str, int] = {}
    assert sorted(base) == sorted(after), "the catalogue's ids moved"
    for item_id in sorted(base):
        b, a = base[item_id], after[item_id]
        fields = sorted(k for k in set(b) | set(a) if b.get(k) != a.get(k))
        if not fields:
            continue
        moved_rows += 1
        lines.append(f"- {item_id}")
        for field in fields:
            by_field[field] = by_field.get(field, 0) + 1
            lines.append(f"    {field}: {short(b.get(field))} -> {short(a.get(field))}")
    head = [f"{moved_rows} rows moved; by field: {json.dumps(dict(sorted(by_field.items())))}"]
    Path(sys.argv[3]).write_text("\n".join(head + lines) + "\n", encoding="utf-8")
    print(head[0])


if __name__ == "__main__":
    main()
