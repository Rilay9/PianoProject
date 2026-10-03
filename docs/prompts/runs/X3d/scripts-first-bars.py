"""X3d (not a test): the first measure of each bundled score the corpus probe (corpus-reader.txt) found
opening with no tempo while the catalogue names one, with notes shown only by their duration, so the tempo
statements' positions can be read. Usage, from the worktree root:
python docs/prompts/runs/X3d/scripts-first-bars.py <catalogue id>...
"""

import json
import re
import sys
import zipfile

catalog = json.load(open("app/public/content/catalog.json", encoding="utf8"))
files = {item["id"]: item.get("file") for item in catalog}


def note_summary(match: re.Match[str]) -> str:
    body = match.group(0)
    duration = re.search(r"<duration>(\d+)", body)
    flags = (" chord" if "<chord" in body else "") + (" grace" if "<grace" in body else "") + (" REST" if "<rest" in body else "")
    return f"<note dur={duration.group(1) if duration else 'none'}{flags}/>"


for ident in sys.argv[1:]:
    path = "app/public/content/" + files[ident]
    with zipfile.ZipFile(path) as archive:
        name = [n for n in archive.namelist() if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))][0]
        xml = archive.read(name).decode("utf8")
    parts = re.findall(r"<part\b[^>]*>(.*?)</part>", xml, re.S)
    print(f"== {ident}: {len(parts)} part(s)")
    for index, part in enumerate(parts[:2]):
        measures = re.findall(r"<measure\b[^>]*>.*?</measure>", part, re.S)
        for measure in measures[:2]:
            shown = re.sub(r"<note\b.*?</note>", note_summary, measure, flags=re.S)
            # The page furniture says nothing about time or tempo.
            shown = re.sub(r"<(print|attributes|harmony|barline)\b.*?</\1>", "", shown, flags=re.S)
            shown = re.sub(r"\s+", " ", shown)
            print(f"-- part {index + 1}: {shown[:1400]}")
