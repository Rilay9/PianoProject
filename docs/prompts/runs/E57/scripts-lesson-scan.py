"""
E57's consumer check on the lessons: a lesson sentence about a moved piece's tempo can become false when its file's
tempo map changes, so every lesson that could speak of a moved row is listed for reading. It decides nothing.

    python scripts-lesson-scan.py

For each row whose built file moved (runs/E57/build-diff.txt): the rungs that offer it (`content/curriculum/stage-*.json`,
any `*Options` list naming its id), and every lesson file (`content/lessons/*.md`) that names it by id, by its
catalogue title, or by the title's head (the words before a parenthesis, a dash, " by " or a comma, at least eight
characters). Each paragraph found is printed whole where it speaks of tempo or pace (tempo, speed, slow, fast, pace,
metronome, rit, accel, rubato, bpm, a number after "=", stringendo, animato, march); otherwise only its place.
Output: runs/E57/lesson-scan.txt.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
TEMPO = re.compile(r"tempo|speed|slow|fast|pace|metronome|\brit\b|ritard|accel|rubato|bpm|♩\s*=|=\s*\d{2,3}\b|stringendo|animato|hurr|quicken", re.I)


def heads(title: str) -> list[str]:
    out = [title]
    head = re.split(r"\s*[\(\[–—-]\s*|\s+by\s+|,\s*", title, maxsplit=1)[0].strip()
    if len(head) >= 8 and head not in out:
        out.append(head)
    return out


def offers(item_id: str) -> list[str]:
    out = []
    for stage in sorted((W / "content/curriculum").glob("stage-*.json")):
        for block in json.loads(stage.read_text(encoding="utf-8")).get("stages", []):
            for unit in block.get("units", []):
                for lesson in unit.get("lessons", []):
                    if any(item_id in (lesson.get(key) or []) for key in lesson if key.endswith("Options")):
                        out.append(lesson["id"])
    return out


def main() -> int:
    diff = (W / "docs/prompts/runs/E57/build-diff.txt").read_text(encoding="utf-8")
    moved = [line.split("] ", 1)[1].strip() for line in diff.splitlines() if line.startswith("CHANGED [")]
    catalogue = json.loads((W / "app/public/content/catalog.json").read_text(encoding="utf-8"))
    catalogue = {row["id"]: row for row in (catalogue["items"] if isinstance(catalogue, dict) else catalogue)}
    lessons = sorted((W / "content/lessons").glob("*.md"))
    lines = [f"{len(moved)} moved rows; the rungs offering each, and every lesson paragraph naming it", ""]
    offered = tempo_paragraphs = 0
    for item_id in moved:
        title = catalogue.get(item_id, {}).get("title") or item_id
        rungs = offers(item_id)
        offered += bool(rungs)
        found = []
        for path in lessons:
            text = path.read_text(encoding="utf-8")
            for paragraph in re.split(r"\n\s*\n", text):
                flat = re.sub(r"\s+", " ", paragraph)
                if any(needle.lower() in flat.lower() for needle in [item_id] + heads(title)):
                    words = sorted({m.group(0).lower() for m in TEMPO.finditer(flat)})
                    found.append((path.name, words, flat))
        lines.append(f"{item_id} (\"{title}\"): offered by {rungs or 'no rung'}; named in {len(found)} lesson paragraph(s)")
        for name, words, flat in found:
            if words:
                tempo_paragraphs += 1
                lines.append(f"   {name}, tempo words {words}: {flat}")
            else:
                lines.append(f"   {name}: no tempo words")
    lines += ["", f"{offered} of {len(moved)} moved rows offered by a rung; {tempo_paragraphs} lesson paragraph(s) naming a moved row speak of tempo or pace"]
    (W / "docs/prompts/runs/E57/lesson-scan.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(lines[-1])
    return 0


if __name__ == "__main__":
    sys.exit(main())
