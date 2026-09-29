"""Edits to a markdown table by row id, for the record scripts: never a silent no-op (Q-tooling).

On 2026-09-29 a record script's `text.replace(old, new)` met a row that had changed since the
script was written, replaced nothing and said nothing: the task index's E2a row was dropped and a
commit message named a record its tree did not carry (fa57005). This helper finds a row by the id
in its first cell (bold or struck through, as the task index writes them, is the same id), and:

* `edit`: replaces `old` with `new` inside that row. Refused when there is no such row or more
  than one, when `old` is not in the row or is there more than once, when `new` equals `old`, or
  when the row cannot be found by its id afterwards.
* `replace`: replaces the whole row. Refused when the new row names another id, has another
  number of cells, or is the row already there.
* `add-after`: inserts a row after the row with the id. Refused when the table already has a row
  with the new row's id, or when the new row has another number of cells than its anchor.

Every step searches the text the previous step left, so a batch written against an old text fails
at the step that no longer fits; a refusal writes nothing, not even the steps before it. After
writing the matrix or the audit file, the reviewer's views are regenerated
(`split_prompt_views.py`), the other recurring fault of that night; commit them with the edit.

    python tools/docs/matrix_edit.py docs/prompts/backlog-2026-09-25.md ops.json

where `ops.json` is a list such as
`[{"op": "edit", "id": "Q64", "old": "| pending |", "new": "| built |"},
  {"op": "add-after", "id": "Q65", "row": "| Q66 | ... |"}]`.
Scripts may import `apply(text, ops)` instead; it returns the new text or raises `Refused`.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import split_prompt_views  # noqa: E402

PIPE = re.compile(r"(?<!\\)\|")


class Refused(Exception):
    """An edit that would change nothing, or change a row the script did not expect."""


def cells(line: str) -> list[str] | None:
    """A table row's cells (unescaped pipes split them), or None for a line that is not a row."""
    stripped = line.strip()
    if not stripped.startswith("|") or not stripped.endswith("|") or len(stripped) < 2:
        return None
    return [cell.strip() for cell in PIPE.split(stripped)[1:-1]]


def row_id(line: str) -> str | None:
    row = cells(line)
    if not row or set(row[0]) <= set("-: "):
        return None
    return row[0].strip("*~` ") or None


def rows_with(lines: list[str], wanted: str) -> list[int]:
    return [i for i, line in enumerate(lines) if row_id(line) == wanted]


def the_row(lines: list[str], wanted: str, step: int) -> int:
    hits = rows_with(lines, wanted)
    if not hits:
        raise Refused(f"step {step}: no row {wanted}")
    if len(hits) > 1:
        raise Refused(f"step {step}: {len(hits)} rows {wanted} (lines {', '.join(str(i + 1) for i in hits)})")
    return hits[0]


def apply_one(lines: list[str], op: dict, step: int) -> list[str]:
    kind, wanted = op.get("op"), str(op.get("id", ""))
    at = the_row(lines, wanted, step)
    row = lines[at]
    out = list(lines)
    if kind == "edit":
        old, new = op["old"], op["new"]
        if old == new:
            raise Refused(f"step {step}: edit of row {wanted} changes nothing (old equals new)")
        count = row.count(old)
        if count == 0:
            raise Refused(f"step {step}: {old!r} is not in row {wanted}: the row changed since the step was written")
        if count > 1:
            raise Refused(f"step {step}: {old!r} is {count} times in row {wanted}")
        out[at] = row.replace(old, new)
        if the_row(out, wanted, step) != at:  # pragma: no cover - the_row raises first
            raise Refused(f"step {step}: row {wanted} moved")
        if new not in out[at]:  # pragma: no cover - a replace always leaves `new`
            raise Refused(f"step {step}: row {wanted} does not carry the new text")
        return out
    if kind == "replace":
        new_row = op["row"]
        if row_id(new_row) != wanted:
            raise Refused(f"step {step}: the new row names {row_id(new_row)}, not {wanted}")
        if new_row.strip() == row.strip():
            raise Refused(f"step {step}: replacing row {wanted} changes nothing")
        if len(cells(new_row) or []) != len(cells(row) or []):
            raise Refused(f"step {step}: the new row has {len(cells(new_row) or [])} cells, row {wanted} has {len(cells(row) or [])}")
        out[at] = new_row
        return out
    if kind == "add-after":
        new_row = op["row"]
        new_id = row_id(new_row)
        if new_id is None:
            raise Refused(f"step {step}: {new_row!r} is not a table row with an id")
        if rows_with(lines, new_id):
            raise Refused(f"step {step}: the table already has a row {new_id}")
        if len(cells(new_row) or []) != len(cells(row) or []):
            raise Refused(f"step {step}: the new row has {len(cells(new_row) or [])} cells, row {wanted} has {len(cells(row) or [])}")
        out.insert(at + 1, new_row)
        if rows_with(out, new_id) != [at + 1]:  # pragma: no cover - guarded above
            raise Refused(f"step {step}: row {new_id} is not where it was put")
        return out
    raise Refused(f"step {step}: unknown op {kind!r} (edit, replace or add-after)")


def apply(text: str, ops: list[dict]) -> str:
    """The text after every op, each searching what the last left; `Refused` leaves nothing done."""
    trailing = text.endswith("\n")
    lines = text.split("\n")
    if trailing:
        lines.pop()
    for step, op in enumerate(ops, start=1):
        lines = apply_one(lines, op, step)
    return "\n".join(lines) + ("\n" if trailing else "")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("file", type=Path, help="the markdown file whose table rows to edit")
    parser.add_argument("ops", type=Path, help="a JSON list of edit, replace and add-after steps")
    args = parser.parse_args(argv)
    raw = args.file.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    ops = json.loads(args.ops.read_text(encoding="utf-8"))
    try:
        new = apply(text, ops)
    except Refused as refusal:
        print(f"refused, {args.file} not written: {refusal}", file=sys.stderr)
        return 2
    args.file.write_bytes((new.replace("\n", "\r\n") if crlf else new).encode("utf-8"))
    print(f"{args.file}: {len(ops)} step(s) applied")
    target = args.file.resolve()
    if target in (split_prompt_views.AUDIT.resolve(), split_prompt_views.BACKLOG.resolve()):
        split_prompt_views.write_views(split_prompt_views.render())
        left = split_prompt_views.stale_views()
        if left:
            print(f"refused: the views still differ after regeneration: {', '.join(left[:5])}", file=sys.stderr)
            return 2
        print("views (docs/prompts/views) regenerated; commit them with this edit")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
