"""X3d (not a test): joins the before and after probe lines into two markdown tables beside this script —
adversary-table.md (the reviewer's shapes, the two bundled pieces, the three rags ragtime.6 names: opens /
label / plays / counts in, before and after, from adversary-table-{before,after}.jsonl) and bundled-table.md
(X3c's 43 bundled scores: the first mark as printed, the first <sound tempo>, and the model's first tempo
entries before and after, from bundled-list.json and bundled-model-{before,after}.jsonl).
Usage, from the worktree root: python docs/prompts/runs/X3d/scripts-join-tables.py
"""

import json
import pathlib

HERE = pathlib.Path("docs/prompts/runs/X3d")


def lines(name: str) -> list[dict]:
    return [json.loads(line) for line in (HERE / name).read_text(encoding="utf8").splitlines() if line.strip()]


def fmt_map(entries: list[dict]) -> str:
    return ", ".join(f"{e['bpm']:g} at {e['atBeat']:g}" for e in entries)


before = {row["shape"]: row for row in lines("adversary-table-before.jsonl")}
after = lines("adversary-table-after.jsonl")
out = [
    "| # | Shape | Opens (before → after) | Label at 100 % | Plays | Counts in | Map, after (bpm at beat) |",
    "| --- | --- | --- | --- | --- | --- | --- |",
]
for row in after:
    was = before.get(row["shape"], {})
    out.append(
        f"| {row['adversary']} | {row['shape']} | {was.get('opens', '?'):g} → {row['opens']:g} | {was.get('label', '?')} → {row['label']} | "
        f"{was.get('plays', '?'):g} → {row['plays']:g} | {was.get('countsIn', '?'):g} → {row['countsIn']:g} | {fmt_map(row['map'])} |"
    )
(HERE / "adversary-table.md").write_text("\n".join(out) + "\n", encoding="utf8")

listed = json.loads((HERE / "bundled-list.json").read_text(encoding="utf8"))
b = {row["file"]: row for row in lines("bundled-model-before.jsonl")}
a = {row["file"]: row for row in lines("bundled-model-after.jsonl")}
out = [
    "| Score | Why listed | First mark (printed) | First `<sound tempo>` | Model before (first entries) | Model after (first entries) |",
    "| --- | --- | --- | --- | --- | --- |",
]
moved = 0
for row in listed:
    was, now = b.get(row["file"], {}), a.get(row["file"], {})
    before_map = fmt_map(was.get("map", [])) or was.get("error", "?")
    after_map = fmt_map(now.get("map", [])) or now.get("error", "?")
    if was.get("map", [{}])[:1] != now.get("map", [{}])[:1]:
        moved += 1
    out.append(f"| {row['file']} | {row['why']} | {row['mark']} | {row['firstSound']} | {before_map} | {after_map} |")
out.append("")
out.append(f"{len(listed)} scores; the opening tempo moved on {moved}.")
(HERE / "bundled-table.md").write_text("\n".join(out) + "\n", encoding="utf8")
print(f"adversary rows: {len(after)}; bundled rows: {len(listed)}, opening moved on {moved}")
