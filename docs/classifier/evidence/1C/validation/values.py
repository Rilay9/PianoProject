"""values.py: every <note> with <type> 128th, 256th, 512th, 1024th (rests and chord members included, grace apart),
per file, with whether the note's <type> carries size="cue"."""
import re, sys
from collections import Counter, defaultdict
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CAT, CONTENT, xml_text
tot = Counter(); files = defaultdict(set); per = defaultdict(Counter)
for it in CAT:
    if not it.get("file"):
        continue
    t = xml_text(CONTENT / it["file"])
    for m in re.finditer(r"<type([^>]*)>(128th|256th|512th|1024th)</type>", t):
        v = m.group(2)
        # find the enclosing note to test grace: look back to the last <note
        start = t.rfind("<note", 0, m.start())
        seg = t[start:m.start()]
        kind = v + (" grace" if "<grace" in seg else "") + (" cue" if 'size="cue"' in m.group(1) else "")
        tot[kind] += 1; files[kind].add(it["id"]); per[it["id"]][kind] += 1
for k in sorted(tot):
    print(k, tot[k], "notes in", len(files[k]), "files")
for iid, c in sorted(per.items()):
    print("  ", iid, dict(c))
