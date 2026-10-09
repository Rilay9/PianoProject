"""Real catalogue items whose title, id or score text (credits, directions, work/movement titles, other text nodes of the
MusicXML) names a scale or a mode. Reading only: a regex over text. Writes scale_real_named.json.
Run: <main>/.venv/Scripts/python.exe -X utf8 scale_find_real.py"""
from cmp_common import *
import re, zipfile
import xml.etree.ElementTree as ET
CAT = json.load(open(CONTENT / "catalog.json", encoding="utf-8"))
PAT = re.compile(r"dorian|mixolyd|phrygian|lydian|locrian|aeolian|pentatonic|blues scale|whole[- ]tone|octatonic|diminished scale|"
                 r"harmonic minor|melodic minor|natural minor|major scale|minor scale|chromatic scale|\bmodal\b|\bmodes?\b|\bscales?\b", re.I)
out = {}
n_scanned = 0
for it in CAT:
    if not it.get("file") or it.get("provenance", {}).get("source") == "generated":
        continue
    p = CONTENT / it["file"]
    try:
        if p.suffix == ".mxl":
            with zipfile.ZipFile(p) as z:
                names = [n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META")]
                data = z.read(names[0])
        else:
            data = p.read_bytes()
        r = ET.fromstring(data)
        n_scanned += 1
    except Exception as ex:
        out[it["id"]] = {"error": repr(ex)[:100]}
        continue
    texts = []
    for e in r.iter():
        if isinstance(e.tag, str) and e.tag.split("}")[-1] in ("credit-words", "words", "work-title", "movement-title", "rehearsal", "text") and (e.text or "").strip():
            texts.append(e.text.strip())
    hits = sorted({m.group(0).lower() for t in texts + [it["title"], it["id"]] for m in PAT.finditer(t)})
    if hits:
        out[it["id"]] = {"title": it["title"], "source": it["provenance"]["source"], "hits": hits,
                         "snips": [t[:100] for t in texts if PAT.search(t)][:4]}
json.dump({"scanned": n_scanned, "items": out}, open(HERE / "scale_real_named.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("scanned", n_scanned, "real items;", len(out), "with a hit;", sum(1 for v in out.values() if "error" in v), "unreadable")
for k, v in out.items():
    print(k, "|", v.get("title"), "|", v.get("hits"), "|", v.get("snips"))
