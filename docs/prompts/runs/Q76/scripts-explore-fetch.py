"""Exploration only: fetches every single-file Joplin .ly at one pinned revision into a scratch folder and prints each header."""
import re
import sys
import urllib.request
from pathlib import Path

REV = "2144afd6f52d56c5b6995b8b589ef1268b3139f0"
RAW = f"https://raw.githubusercontent.com/MutopiaProject/MutopiaProject/{REV}/ftp/JoplinS/"
FILES = [
    "EliteSyncopations/EliteSyncopations.ly", "PineappleRag/PineappleRag.ly", "SomethingDoing/SomethingDoing.ly",
    "TheStrenuousLife/TheStrenuousLife.ly", "WallStreetRag/WallStreetRag.ly",
    "a-breeze-from-alabama/a-breeze-from-alabama.ly", "entertainer/entertainer.ly", "eugenia/eugenia.ly",
    "magnetic/magnetic.ly", "maple/maple.ly", "original/original.ly", "peacherine/peacherine.ly",
    "search/search.ly", "sugar-cane/sugar-cane.ly", "sun-flower-slow-drag/sun-flower-slow-drag.ly",
    "winners/winners.ly",
    "bethena/bethena-lys/header.ly", "bethena/bethena-lys/joplin_bethena.ly",
    "solace/solace-lys/header.ly", "solace/solace-lys/joplin_solace.ly",
]
out = Path(sys.argv[1])
for rel in FILES:
    dest = out / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        with urllib.request.urlopen(RAW + rel, timeout=60) as r:
            dest.write_bytes(r.read())
    text = dest.read_text(encoding="utf-8", errors="replace")
    fields = {k: v for k, v in re.findall(r'^\s*(title|subtitle|composer|opus|date|license|copyright|mutopiacomposer|mutopiainstrument|source|style|maintainer|lastupdated|footer|moreInfo)\s*=\s*"?([^"\n]*)', text, re.M)}
    version = re.search(r'\\version\s+"([^"]+)"', text)
    print(rel, "| version", version.group(1) if version else None, "|", fields)
