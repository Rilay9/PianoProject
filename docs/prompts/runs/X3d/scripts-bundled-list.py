"""X3d's list of the bundled scores X3c counted (not a test): in app/public/content/scores (the build output
copied from the main checkout), the MusicXML files whose first <metronome> counts a note other than an
undotted quarter, and the files whose first <metronome> stands after the first bar while the first bar has a
<sound tempo> of its own — X3c's two counts (scripts-bundled-marks.py), every name this time, with the first
mark and the first <sound tempo> as the file writes them. Writes bundled-list.json beside this script for the
model probe (scripts-bundled-model.test.ts) to read.
Usage, from the worktree root: python docs/prompts/runs/X3d/scripts-bundled-list.py
"""

import json
import pathlib
import re
import zipfile

ROOT = pathlib.Path("app/public/content/scores")
OUT = pathlib.Path("docs/prompts/runs/X3d/bundled-list.json")


def score_text(path: pathlib.Path) -> str:
    """The MusicXML of a plain file, or of an .mxl archive's first score outside META-INF."""
    if path.suffix != ".mxl":
        return path.read_text(encoding="utf8", errors="replace")
    with zipfile.ZipFile(path) as archive:
        names = [n for n in archive.namelist() if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))]
        return archive.read(names[0]).decode("utf8", errors="replace") if names else ""


MEASURE = re.compile(r"<measure\b[^>]*>.*?</measure>", re.S)
METRONOME = re.compile(r"<metronome\b[^>]*>(.*?)</metronome>", re.S)
UNIT = re.compile(r"<beat-unit>\s*([a-z0-9]+)\s*</beat-unit>")
PER_MINUTE = re.compile(r"<per-minute>\s*([^<]*?)\s*</per-minute>")
SOUND = re.compile(r"<sound\b[^>]*\btempo=\"([^\"]*)\"")

files = sorted(p for p in ROOT.rglob("*") if p.suffix in (".musicxml", ".xml", ".mxl"))
rows = []
with_mark = 0
for path in files:
    xml = score_text(path)
    mark = METRONOME.search(xml)
    if not mark:
        continue
    with_mark += 1
    units = UNIT.findall(mark.group(1))
    dots = mark.group(1).count("<beat-unit-dot")
    per_minute = PER_MINUTE.search(mark.group(1))
    first = MEASURE.search(xml)
    sound = SOUND.search(xml)
    not_quarter = units[:1] != ["quarter"] or dots > 0
    later = bool(first and mark.start() > first.end() and SOUND.search(first.group(0)))
    if not (not_quarter or later):
        continue
    rows.append(
        {
            "file": path.relative_to(ROOT).as_posix(),
            "why": "first mark not an undotted quarter" if not_quarter else "first mark after bar 1, bar 1 sounding its own tempo",
            "mark": f"{'+'.join(units) or 'no beat-unit'}{'.' * dots} = {per_minute.group(1) if per_minute else '(none)'}",
            "firstSound": sound.group(1) if sound else None,
            "markInBar1": bool(first and mark.start() < first.end()),
        }
    )

OUT.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf8")
print(f"MusicXML files under {ROOT}: {len(files)}; with a <metronome>: {with_mark}")
print(f"first <metronome> not an undotted quarter: {sum(1 for r in rows if r['why'].startswith('first mark not'))}")
print(f"first <metronome> after the first bar, the first bar sounding its own tempo: {sum(1 for r in rows if r['why'].startswith('first mark after'))}")
for row in rows:
    print(f"  {row['file']}: {row['mark']}; first <sound tempo> {row['firstSound']} ({row['why']})")
