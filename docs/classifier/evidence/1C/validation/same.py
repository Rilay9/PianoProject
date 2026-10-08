"""same.py: for each PDMX item whose app file has cue-size notes, the app file vs its mapped source file (size, md5,
cue-size <type> counts in each)."""
import hashlib, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BYID, CONTENT, MAIN, xml_text
mp = {e["id"]: e["file"] for e in json.loads((MAIN / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]} \
    if "items" in json.loads((MAIN / "content/sources/pdmx.json").read_text(encoding="utf-8")) else None
if mp is None:
    d = json.loads((MAIN / "content/sources/pdmx.json").read_text(encoding="utf-8"))
    key = [k for k, v in d.items() if isinstance(v, list) and v and isinstance(v[0], dict) and "cid" in v[0]][0]
    mp = {e["id"]: e["file"] for e in d[key]}
print("mapped items:", len(mp))
pdmx_ids = [i for i in BYID if (i.endswith(".pdmx") or ".pdmx." in i) and BYID[i].get("file")]
print("PDMX items with a file:", len(pdmx_ids), "unmapped:", [i for i in pdmx_ids if i not in mp][:10], len([i for i in pdmx_ids if i not in mp]))
for iid in sys.argv[1:]:
    a = CONTENT / BYID[iid]["file"]; s = MAIN / "content/scores/pdmx" / mp[iid]
    ca = len(re.findall(r'<type[^>]*size="cue"', xml_text(a))); cs = len(re.findall(r'<type[^>]*size="cue"', xml_text(s)))
    cs2 = len(re.findall(r"<cue\s*/>", xml_text(s)))
    print(iid, "app", a.stat().st_size, hashlib.md5(a.read_bytes()).hexdigest()[:8], "cue-type", ca, "| src", s.stat().st_size,
          hashlib.md5(s.read_bytes()).hexdigest()[:8], "cue-type", cs, "<cue/>", cs2)
