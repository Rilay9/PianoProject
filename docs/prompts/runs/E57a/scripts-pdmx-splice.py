"""
E57a (Entry 195), step 4: E57's scripts-pdmx-splice.py, copied; only its input (build/e57a/pdmx/reconvert.json, E57a's
three rows, none held) and its log (runs/E57a/pdmx-splice.txt) changed, so E57's evidence under runs/E57 is never written.

E57's docstring, unchanged below. E57 item 3, step 4: each changed PDMX row's `convertedSha256` in `content/sources/pdmx.json` respliced as text, the one
field E57 moves, but for a row scripts-pdmx-reconvert.py holds as committed (build/e57/pdmx/reconvert.json: no feature, level, tempo, bar or note count moves on any of them; the
row's `tempoBpm` is the converter's first mark, which E57 does not change).

    python scripts-pdmx-splice.py

The round trip `json.dumps(json.loads(raw), indent=2, ensure_ascii=False)` is compared with the raw bytes first
(CLAUDE.md, the JSON hazard); the rows are spliced as text either way, one match per row, inside the row's own block.
Afterwards the parsed file is compared with the parsed original: nothing but `convertedSha256` on those rows moved,
and each committed file's sha256 is its row's new `convertedSha256`. Idempotent: a row already carrying its new sha256
is left alone and said. Output: runs/E57/pdmx-splice.txt.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
TABLE = W / "content" / "sources" / "pdmx.json"
LOG = W / "docs" / "prompts" / "runs" / "E57a" / "pdmx-splice.txt"


def main() -> int:
    data = json.loads((W / "build/e57a/pdmx/reconvert.json").read_text(encoding="utf-8"))
    raw = TABLE.read_bytes()
    text = raw.decode("utf-8")
    original = json.loads(text)
    round_trip = json.dumps(original, indent=2, ensure_ascii=False) + "\n"
    lines = [f"round trip of pdmx.json byte-identical: {round_trip.encode('utf-8') == raw}: spliced as text either way"]
    faults: list[str] = []
    done = already = 0
    held = {item_id for item_id, entry in data.items() if entry.get("held")}
    data = {item_id: entry for item_id, entry in data.items() if item_id not in held}
    for item_id, entry in data.items():
        new = hashlib.sha256((W / "content/scores/pdmx" / f"{entry['cid']}.mxl").read_bytes()).hexdigest()
        if new != entry["newSha256"]:
            faults.append(f"{item_id}: the committed file is not the new file ({new[:12]} against {entry['newSha256'][:12]})")
            continue
        start = text.find(f'"id": "{item_id}"')
        end = text.find('"id": "', start + 1)
        end = len(text) if end < 0 else end
        block = text[start:end]
        old_field, new_field = f'"convertedSha256": "{entry["committedSha256"]}"', f'"convertedSha256": "{new}"'
        if block.count(new_field) == 1:
            already += 1
            continue
        if start < 0 or block.count(old_field) != 1:
            faults.append(f"{item_id}: the row's convertedSha256 is not once in its block")
            continue
        text = text[:start] + block.replace(old_field, new_field, 1) + text[end:]
        done += 1
    after = json.loads(text)
    before_rows = {row["id"]: row for row in original["items"]}
    after_rows = {row["id"]: row for row in after["items"]}
    moved = []
    for item_id in before_rows:
        a, b = before_rows[item_id], after_rows[item_id]
        keys = sorted(k for k in set(a) | set(b) if a.get(k) != b.get(k))
        if keys:
            moved.append((item_id, keys))
    if {k for _, keys in moved for k in keys} - {"convertedSha256"} or {i for i, _ in moved} - set(data) or \
            {k: v for k, v in original.items() if k != "items"} != {k: v for k, v in after.items() if k != "items"}:
        faults.append("a field other than convertedSha256 on the changed rows moved")
    for item_id, entry in data.items():
        if after_rows[item_id]["convertedSha256"] != hashlib.sha256((W / "content/scores/pdmx" / f"{entry['cid']}.mxl").read_bytes()).hexdigest():
            faults.append(f"{item_id}: convertedSha256 is not the committed file's sha256 after the splice")
    if not faults:
        TABLE.write_bytes(text.encode("utf-8"))
    lines.append(f"held as committed, not spliced: {sorted(held) or 'none'}")
    lines.append(f"spliced {done} row(s), {already} already carrying the new sha256; rows whose parsed fields differ from the original: "
                 f"{len(moved)}, every one convertedSha256 alone: {not faults}")
    lines += [f"   {item_id}: convertedSha256 {data[item_id]['committedSha256'][:12]}… -> {data[item_id]['newSha256'][:12]}…" for item_id, _ in moved]
    lines += [f"{len(faults)} fault(s)"] + [f"   FAULT {fault}" for fault in faults]
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:2] + lines[-1 - len(faults):]))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main())
