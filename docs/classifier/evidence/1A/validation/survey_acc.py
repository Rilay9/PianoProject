import collections
from common import *
from r_acc import sig_exercised, churn

never = collections.Counter(); never_ex = collections.defaultdict(list)
cls = collections.defaultdict(collections.Counter)
items = collections.defaultdict(collections.Counter)
churn_items = collections.Counter()
for i in BYID:
    w = cache(i)
    p = pipeline(i)
    s = sig_exercised(w)
    if not s.get("no signature") and s["total"] == 0:
        never[p] += 1
        if len(never_ex[p]) < 4:
            never_ex[p].append(i)
    seen = set()
    for n, c, info in accidental_model(w):
        cls[p][c] += 1
        seen.add(c)
    for c in seen:
        items[p][c] += 1
    if churn(w)["events"]:
        churn_items[p] += 1
print("signature printed but never exercised:", dict(never), dict(never_ex))
for p in cls:
    print(p, "notes by class:", dict(cls[p]))
    print(p, "items with class:", dict(items[p]))
print("churn items:", dict(churn_items))
