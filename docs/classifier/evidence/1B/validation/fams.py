from common import *
import collections, re
print(len(CAT), len(ITEMS), collections.Counter(pipeline(i) for i in ITEMS))
c = collections.Counter(fam(i) for i in ITEMS if pipeline(i) == "generated")
print(sorted(c.items(), key=lambda x: str(x[0])))
for pat in sys.argv[1:]:
    print(pat, [i["id"] for i in ITEMS if re.search(pat, i["id"])][:60])
