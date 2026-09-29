"""X3c's scope check for the player finding (not a test): in the bundled scores the app serves
(app/public/content/scores, the build output copied from the main checkout), count the MusicXML files
whose first <metronome> counts a note other than an undotted quarter, and the files whose first
<metronome> stands after the first bar while the first bar has a <sound tempo> of its own. The probe
(probe-player-tempo.txt) shows the player reads a <metronome>'s <per-minute> as quarter notes a minute
and takes the first tempo expression as the opening tempo, so these are the bundled files whose played
tempo could differ from the tempo the file states. Counts and the first few names only.
Usage, from the worktree root: python docs/prompts/runs/X3c/scripts-bundled-marks.py
"""

import pathlib
import re
import zipfile

ROOT = pathlib.Path("app/public/content/scores")


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
SOUND = re.compile(r"<sound\b[^>]*\btempo=\"")

files = sorted(p for p in ROOT.rglob("*") if p.suffix in (".musicxml", ".xml", ".mxl"))
not_quarter: list[str] = []
later_first_mark: list[str] = []
with_mark = 0
for path in files:
    xml = score_text(path)
    mark = METRONOME.search(xml)
    if not mark:
        continue
    with_mark += 1
    units = UNIT.findall(mark.group(1))
    dotted = "<beat-unit-dot" in mark.group(1)
    if units[:1] != ["quarter"] or dotted:
        not_quarter.append(f"{path.relative_to(ROOT)} ({'+'.join(units) or 'no beat-unit'}{' dotted' if dotted else ''})")
    first = MEASURE.search(xml)
    if first and mark.start() > first.end() and SOUND.search(first.group(0)):
        later_first_mark.append(str(path.relative_to(ROOT)))

print(f"MusicXML files under {ROOT}: {len(files)}; with a <metronome>: {with_mark}")
print(f"first <metronome> not an undotted quarter: {len(not_quarter)}")
for name in not_quarter[:12]:
    print(f"  {name}")
print(f"first <metronome> after the first bar, the first bar sounding its own tempo: {len(later_first_mark)}")
for name in later_first_mark[:12]:
    print(f"  {name}")
