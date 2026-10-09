"""Which of the selected When in Rome pieces are in AugmentedNet's own training / validation / test splits
(build/augnet/AugmentedNet/data/*.py: `annotation_score_duples` and `splits`), so that the AugmentedNet figures on When in Rome
can be read as in-sample or held-out. Matching is by the analysis path tail (composer/work/piece number) for the
When in Rome entries, and by the file name for the Mozart sonata dataset (mps-kNNN-m). Writes augnet_split.json:
{piece dir: "training" | "validation" | "test" | "not listed" | "keymodt:<split>"}.

The released model's training set is not stated in its README beyond "Full dataset"; this reads the repository's own split lists
(reading of those lists, measured here by script), it does not retrain anything.
"""
from cmp_common import *
import re

sys.path.insert(0, str(WT / "build/augnet"))
from AugmentedNet.data import available_collections


def tail(path):
    p = path.replace("\\", "/")
    m = re.search(r"Corpus/[^/]+/(.*)/analysis\.txt$", p)
    return m.group(1) if m else None


def norm(t):
    # strip zero padding of the last component: .../01 -> .../1
    a, b = t.rsplit("/", 1)
    return a + "/" + b.lstrip("0")


entries = {}                     # normalised tail -> set of splits
by_key = {}
for coll, mod in available_collections.items():
    split_of = {}
    for sp, names in mod.splits.items():
        for n in names:
            split_of[n] = sp
    for name, (ann, score) in mod.annotation_score_duples.items():
        by_key[name] = (coll, split_of.get(name, "unassigned"), ann)
        t = tail(ann)
        if t:
            entries.setdefault(norm(t), set()).add(split_of.get(name, "unassigned"))

pieces = json.load(open(HERE / "wir_pieces.json"))["pieces"]
out = {}
for p in pieces:
    parts = p["dir"].split("/")
    t = norm("/".join(parts[2:]))
    sp = entries.get(t)
    label = None
    if sp:
        label = "/".join(sorted(sp))
    elif "Piano_Sonatas/Mozart" in p["dir"]:
        k, m = parts[-2], parts[-1]
        name = f"mps-{k.lower()}-{m}"
        if name in by_key:
            label = by_key[name][1]
    if label is None and parts[1] == "Textbooks":
        label = "textbook (key_modulation_dataset covers some textbook examples; matching not attempted)"
    out[p["dir"]] = label or "not listed"
json.dump(out, open(HERE / "augnet_split.json", "w"), indent=0, ensure_ascii=False)
import collections
print(collections.Counter(out.values()))
for g in ("Keyboard_Other/Bach", "Keyboard_Other/Chopin", "Piano_Sonatas", "Textbooks"):
    print(g, collections.Counter(v for k, v in out.items() if g in k))
