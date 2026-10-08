"""Cue-size notes: in the app's files (every item) and in the PDMX source files mapped by content/sources/pdmx.json
(read in place in the main checkout, never written). Counts <cue/> elements and size="cue" on <type> or <note>."""
import json, re, sys
from collections import Counter
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CAT, CONTENT, MAIN, xml_text


def cues(t):
    return len(re.findall(r"<cue\s*/>", t)), len(re.findall(r'<type[^>]*size="cue"', t)), len(re.findall(r'<note[^>]*size="cue"', t))


app = {}
for it in CAT:
    if it.get("file"):
        c = cues(xml_text(CONTENT / it["file"]))
        if any(c):
            app[it["id"]] = c
src_pipe = Counter()
for iid in app:
    src_pipe["gen" if iid.startswith("exercise.") else "pdmx" if (iid.endswith(".pdmx") or ".pdmx." in iid) else "rep"] += 1
print("app files with cue markings:", len(app), dict(src_pipe))
for k, v in sorted(app.items())[:40]:
    print("  app", k, "(<cue/>, type size=cue, note size=cue) =", v)
mp = json.loads((MAIN / "content/sources/pdmx.json").read_text(encoding="utf-8"))
print("pdmx.json type:", type(mp).__name__, (list(mp)[:2] if isinstance(mp, dict) else mp[:1]))
