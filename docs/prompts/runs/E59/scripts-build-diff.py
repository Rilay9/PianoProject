"""
E59 item 1 (every build-run caller's inventory) and the data layer: every built score file and catalogue row, a build
before the fix against a build after it, by source family. E57's `scripts-build-diff.py`, with what E59 needs added.

    python scripts-build-diff.py <before content dir> <after content dir> <before reader dump> <after reader dump> <out name>

The converter change is confined to `normalise`'s no-tempo `else:`, so a built file's bytes move exactly when its
conversion took that branch: every file that took it wrote the printed mark before and does not now, and no other path
changed. For every changed file the score text must differ by exactly the transform (`scripts-pdmx-transform.transform_text`:
the inserted direction's four metronome lines become `<words />`, nothing else), and its tempo events, read through the
app's reader (scripts-reader.table.ts's dumps), must keep every position and bpm, losing only the printed mark. For every
row: the catalogue fields that differ, named, beside the ones that move with the file's bytes by construction. Output:
runs/E59/<out name>.txt and build/e59/<out name>.json (the changed ids by family, for the relation generator).
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

W = Path(__file__).resolve().parents[4]
SOURCES = ["musetrainer", "kern", "pdmx", "generated", "mutopia", "openscore"]
BY_BYTES = {"provenance.identity.sha256", "provenance.edition", "provenance.converter.version", "checksum", "sha256",
            "source.checksum", "provenance.excerpt.key", "provenance.excerpt.parentSha256"}


def transform_module():
    sys.path.insert(0, str(W / "tools" / "content"))
    spec = importlib.util.spec_from_file_location("e59_transform", Path(__file__).with_name("scripts-pdmx-transform.py"))
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


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


def score_text(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        names = [n for n in archive.namelist() if not n.startswith("META-INF/") and n.lower().endswith((".xml", ".musicxml"))]
        return archive.read(names[0]).decode("utf-8")


def main(argv: list[str]) -> int:
    before_dir, after_dir, before_dump, after_dump, name = Path(argv[0]), Path(argv[1]), Path(argv[2]), Path(argv[3]), argv[4]
    tx = transform_module()
    before, after = rows(before_dir), rows(after_dir)
    events = {}
    for which, path in (("before", before_dump), ("after", after_dump)):
        events[which] = {json.loads(line)["id"]: json.loads(line)["events"] for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}
    files = Counter()
    changed: dict[str, list[str]] = defaultdict(list)
    fields = Counter()
    field_rows: dict[str, list[str]] = defaultdict(list)
    lines: list[str] = []
    faults: list[str] = []
    shapes = Counter()
    only = sorted(set(before) ^ set(after))
    for item_id in sorted(set(before) & set(after)):
        a, b = before[item_id], after[item_id]
        fam = family(a)
        if a.get("file"):
            files[fam] += 1
            old_path, new_path = before_dir / a["file"], after_dir / b["file"]
            old = hashlib.sha256(old_path.read_bytes()).hexdigest()
            new = hashlib.sha256(new_path.read_bytes()).hexdigest() if b.get("file") else None
            if old != new:
                changed[fam].append(item_id)
                try:
                    text, shape = tx.transform_text(score_text(old_path))
                except ValueError as error:
                    faults.append(f"{item_id}: the old file is not the default's shape ({error})")
                else:
                    shapes[f"{fam}: {shape}"] += 1
                    if tx.convert.without_encoding_date(text) != tx.convert.without_encoding_date(score_text(new_path)):
                        faults.append(f"{item_id}: the new score text is not the old one's transform")
                ev_a, ev_b = events["before"].get(item_id, []), events["after"].get(item_id, [])
                if [(e["at"], e["bpm"], e["from"]) for e in ev_a] != [(e["at"], e["bpm"], e["from"]) for e in ev_b]:
                    faults.append(f"{item_id}: the reader's tempo events moved ({ev_a} -> {ev_b})")
                if any(e["mark"] is not None for e in ev_b):
                    faults.append(f"{item_id}: a printed mark survives in the new file's events ({ev_b})")
        fa, fb = flat(a), flat(b)
        for key in sorted(set(fa) | set(fb)):
            if fa.get(key) != fb.get(key) and key not in BY_BYTES:
                fields[key] += 1
                field_rows[key].append(item_id)
    lines.append(f"catalogue rows before {len(before)}, after {len(after)}; in one only: {only or 'none'}")
    lines.append("built score files by family (changed / all): " + ", ".join(f"{fam} {len(changed[fam])}/{n}" for fam, n in sorted(files.items())))
    lines.append("the old file's inserted direction, by family: " + (", ".join(f"{k} {v}" for k, v in sorted(shapes.items())) or "none"))
    lines.append("")
    for fam in sorted(changed):
        for item_id in changed[fam]:
            ev_a, ev_b = events["before"].get(item_id, []), events["after"].get(item_id, [])
            lines.append(f"CHANGED [{fam}] {item_id}: before {[(e['at'], e['bpm'], e['from'], e['mark']) for e in ev_a]}; "
                         f"after {[(e['at'], e['bpm'], e['from'], e['mark']) for e in ev_b]}")
    moved_events = [item_id for item_id in sorted(set(events["before"]) & set(events["after"]))
                    if [(e["at"], e["bpm"], e["from"]) for e in events["before"][item_id]] != [(e["at"], e["bpm"], e["from"]) for e in events["after"][item_id]]]
    moved_marks = [item_id for item_id in sorted(set(events["before"]) & set(events["after"]))
                   if [e["mark"] for e in events["before"][item_id]] != [e["mark"] for e in events["after"][item_id]]]
    lines.append("")
    lines.append(f"rows whose tempo events (position, bpm, source; the app's reader) differ: {len(moved_events)} {moved_events[:8] or ''}")
    lines.append(f"rows whose printed marks (the reader's `mark`) differ: {len(moved_marks)}; of them not a changed file: "
                 f"{[i for i in moved_marks if not any(i in v for v in changed.values())] or 'none'}")
    lines.append("")
    lines.append("catalogue fields that differ (outside those that move with the bytes), with the rows:")
    for key, n in sorted(fields.items(), key=lambda kv: (-kv[1], kv[0])):
        shown = field_rows[key][:8]
        lines.append(f"   {key}: {n} row(s) {shown}{' …' if n > len(shown) else ''}")
    lines += ["", f"{len(faults)} fault(s)"] + [f"   FAULT {fault}" for fault in faults]
    text = "\n".join(lines) + "\n"
    (W / "docs/prompts/runs/E59" / f"{name}.txt").write_text(text, encoding="utf-8")
    (W / "build/e59" / f"{name}.json").write_text(json.dumps({fam: ids for fam, ids in changed.items()}, indent=1), encoding="utf-8")
    print("\n".join(lines[:3] + lines[-1 - len(faults):]))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
