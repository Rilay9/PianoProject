"""
E57 item 5: every built score file and catalogue row, the build before the fix against a build after it, by source
family — the count for every batch caller the build runs (kern, MuseTrainer, Mutopia, authored ABC, excerpt cuts; the
PDMX rows are the committed files, counted from the archive by scripts-pdmx-count.py, and appear here only once their
new files are in `content/scores/pdmx/`).

    python scripts-build-diff.py <before content dir> <after content dir> <before reader dump> <after reader dump> <out name>

A row's file changed when its bytes differ. For every changed file: its tempo events before and after, read through the
app's reader (scripts-reader.table.ts's dumps). For every row: the catalogue fields that differ, named, beside the ones
that move with the file's bytes by construction (`provenance.identity`, `provenance.edition` for a build-converted
file, `provenance.converter.version`, `checksum`). Output: runs/E57/<out name>.txt.
"""
from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

W = Path(__file__).resolve().parents[4]
SOURCES = ["musetrainer", "kern", "pdmx", "generated", "mutopia", "openscore"]


def rows(content: Path) -> dict[str, dict]:
    raw = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    return {item["id"]: item for item in (raw["items"] if isinstance(raw, dict) else raw)}


def family(item: dict) -> str:
    source = (item.get("provenance") or {}).get("source")
    if source:
        return str(source)
    return next((tag for tag in SOURCES if tag in (item.get("tags") or [])), "other")


def flat(value, prefix: str = "") -> dict[str, str]:
    if isinstance(value, dict):
        out: dict[str, str] = {}
        for key, inner in value.items():
            out.update(flat(inner, f"{prefix}.{key}" if prefix else key))
        return out
    return {prefix: json.dumps(value, sort_keys=True, ensure_ascii=False)}


BY_BYTES = {"provenance.identity.sha256", "provenance.edition", "provenance.converter.version", "checksum", "sha256",
            "source.checksum", "provenance.excerpt.key", "provenance.excerpt.parentSha256"}


def main(argv: list[str]) -> int:
    before_dir, after_dir, before_dump, after_dump, name = Path(argv[0]), Path(argv[1]), Path(argv[2]), Path(argv[3]), argv[4]
    before, after = rows(before_dir), rows(after_dir)
    events = {}
    for which, path in (("before", before_dump), ("after", after_dump)):
        events[which] = {json.loads(line)["id"]: json.loads(line)["events"] for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}
    files = Counter()
    changed: dict[str, list[str]] = defaultdict(list)
    fields = Counter()
    field_rows: dict[str, list[str]] = defaultdict(list)
    lines: list[str] = []
    only = sorted(set(before) ^ set(after))
    for item_id in sorted(set(before) & set(after)):
        a, b = before[item_id], after[item_id]
        fam = family(a)
        if a.get("file"):
            files[fam] += 1
            old = hashlib.sha256((before_dir / a["file"]).read_bytes()).hexdigest()
            new = hashlib.sha256((after_dir / b["file"]).read_bytes()).hexdigest() if b.get("file") else None
            if old != new:
                changed[fam].append(item_id)
        fa, fb = flat(a), flat(b)
        for key in sorted(set(fa) | set(fb)):
            if fa.get(key) != fb.get(key) and key not in BY_BYTES:
                fields[key] += 1
                field_rows[key].append(item_id)
    lines.append(f"catalogue rows before {len(before)}, after {len(after)}; in one only: {only or 'none'}")
    lines.append("built score files by family (changed / all): " + ", ".join(f"{fam} {len(changed[fam])}/{n}" for fam, n in sorted(files.items())))
    lines.append("")
    for fam in sorted(changed):
        for item_id in changed[fam]:
            lines.append(f"CHANGED [{fam}] {item_id}")
            lines.append(f"   before: {[(e['at'], e['bpm'], e['from']) for e in events['before'].get(item_id, [])]}")
            lines.append(f"   after:  {[(e['at'], e['bpm'], e['from']) for e in events['after'].get(item_id, [])]}")
    moved_events = [item_id for item_id in sorted(set(events["before"]) & set(events["after"])) if events["before"][item_id] != events["after"][item_id]]
    lines.append("")
    lines.append(f"rows whose tempo events (the app's reader) differ: {len(moved_events)}; of them not a changed file: "
                 f"{[i for i in moved_events if not any(i in v for v in changed.values())] or 'none'}")
    lines.append("")
    lines.append("catalogue fields that differ (outside those that move with the bytes), with the rows:")
    for key, n in sorted(fields.items(), key=lambda kv: (-kv[1], kv[0])):
        shown = field_rows[key][:8]
        lines.append(f"   {key}: {n} row(s) {shown}{' …' if n > len(shown) else ''}")
    text = "\n".join(lines) + "\n"
    (W / "docs/prompts/runs/E57" / f"{name}.txt").write_text(text, encoding="utf-8")
    print("\n".join(lines[:3]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
