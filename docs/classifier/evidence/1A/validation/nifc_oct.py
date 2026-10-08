import collections
from common import *
c = collections.Counter()
for i in BYID:
    w = cache(i)
    src = "nifc" if i.endswith(".nifc") else pipeline(i)
    has = any(d["kind"] == "oct" for d in w["dirs"])
    c[(src, has)] += 1
print(sorted(c.items()))
