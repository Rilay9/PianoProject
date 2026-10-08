import re
from walk import BYID
t = open("../../docs/classifier/rules/area-1A.md", encoding="utf8").read()
ids = sorted(set(x for x in re.findall(r"`([a-z][a-z0-9._-]*)`", t) if re.match(r"(song|exercise|excerpt)\.", x)))
print(len(ids), "ids named")
for i in ids:
    if i not in BYID:
        print("MISSING", i)
