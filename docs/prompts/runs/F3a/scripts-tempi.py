"""Where each <sound tempo> sits in a built score (measure number), for the T52 premise check."""
import json
import re
import sys
import zipfile
from pathlib import Path

WT = Path(__file__).resolve().parents[2]
root = Path(sys.argv[1]) if len(sys.argv) > 1 else WT / "app" / "public" / "content"
ids = sys.argv[2:] or ["song.ragtime.joplin-maple-leaf-rag", "song.ragtime.joplin-sugar-cane"]
cat = {r["id"]: r for r in json.loads((root / "catalog.json").read_text(encoding="utf-8"))}
for i in ids:
    f = root / cat[i]["file"]
    with zipfile.ZipFile(f) as z:
        name = [n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META-INF")][0]
        xml = z.read(name).decode("utf-8", "replace")
    print(i)
    for part_i, part in enumerate(re.finditer(r"<part\b[\s\S]*?</part>", xml)):
        for m in re.finditer(r'<measure\b[^>]*number="([^"]+)"[^>]*>([\s\S]*?)</measure>', part.group(0)):
            for t in re.finditer(r'<sound[^>]*tempo="([^"]+)"', m.group(2)):
                words = re.findall(r"<words[^>]*>([^<]*)</words>", m.group(2))
                print(f"  part {part_i} measure {m.group(1)}: tempo {t.group(1)} words={words}")
