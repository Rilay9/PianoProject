"""same_all.py: every mapped PDMX item: is the app's file byte-identical to the held file in content/scores/pdmx?
Also which hash in pdmx.json (rawSha256 or convertedSha256) the held file matches."""
import hashlib, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BYID, CONTENT, MAIN
d = json.loads((MAIN / "content/sources/pdmx.json").read_text(encoding="utf-8"))
key = [k for k, v in d.items() if isinstance(v, list) and v and isinstance(v[0], dict) and "cid" in v[0]][0]
same = diff = missing = raw = conv = neither = 0
ex = []
for e in d[key]:
    s = MAIN / "content/scores/pdmx" / e["file"]
    if not s.exists():
        missing += 1; continue
    hs = hashlib.sha256(s.read_bytes()).hexdigest()
    if hs == e.get("rawSha256"): raw += 1
    elif hs == e.get("convertedSha256"): conv += 1
    else: neither += 1
    it = BYID.get(e["id"])
    if not it or not it.get("file"):
        continue
    a = CONTENT / it["file"]
    if hashlib.sha256(a.read_bytes()).hexdigest() == hs:
        same += 1
    else:
        diff += 1; ex.append(e["id"])
print(f"held files: matches rawSha256 {raw}, convertedSha256 {conv}, neither {neither}, missing {missing}")
print(f"app file identical to held file: {same}; different: {diff}", ex[:5])
