import re, sys
sys.path.insert(0, __file__.rsplit("\\", 1)[0])
from common import CAT, CONTENT, xml_text
hits = {}
for i in CAT:
    if not i.get("file"):
        continue
    t = xml_text(CONTENT / i["file"])
    c = len(re.findall(r"<(sf|sfz|fz|sffz|sfp|rfz|rf)\s*/>", t))
    if c:
        hits[i["id"]] = c
print(len(hits))
for k, v in sorted(hits.items(), key=lambda x: -x[1])[:25]:
    print(v, k)
