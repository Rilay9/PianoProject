from common import *
import collections
D = json.load(open(OUT / "keys_v.json"))


def right(a, r):
    return a is not None and a[0] == r[0] and a[1] == r[1]


b = [(k, r["new"], r["info"]["src"]) for k, r in D.items() if r.get("ref") and "info" in r and right(r["old"], r["ref"]) and not right(r["new"], r["ref"])]
print(len(b))
print(collections.Counter(".".join(k.split(".")[:3]) if "hanon" in k else k.split(".")[1] for k, _, _ in b))
print(b)
