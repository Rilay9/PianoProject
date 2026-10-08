import collections
from common import *
from r_format import hand_flags, max_reach, clefs_rule, clef_changes, restatements, keys_rule, staves_of

c = collections.Counter()
genreach = 0
restate_ex = []
hw_paren = []
ballade4 = None
staves = collections.Counter()
for i in BYID:
    w = cache(i)
    p = pipeline(i)
    sv = tuple(staves_of(w))
    staves[(p, sv)] += 1
    f = hand_flags(w)
    for k, v in f.items():
        if v:
            c[(p, "hand:" + k)] += 1
    for (m, t) in f.get("hand_words", []):
        if t.startswith(("(", "[")):
            hw_paren.append((i, t))
    if p == "generated":
        genreach = max(genreach, max_reach(w))
    ch = clef_changes(w)
    if ch:
        c[(p, "clefchange")] += 1
        if any(x["where"] == "inside" for x in ch):
            c[(p, "clefchange_inside")] += 1
    r = restatements(w)
    if r:
        c[(p, "clef_restatement_files")] += 1
        if len(restate_ex) < 5:
            restate_ex.append((i, r))
    if i == "song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx":
        ballade4 = len(ch)
    cr = clefs_rule(w)
    if any(fl.startswith(("bass on staff1", "treble on staff2")) for fl in cr["flags"]):
        c[(p, "clef_off_side")] += 1
    if any(fl.startswith("other clef") for fl in cr["flags"]):
        c[(p, "clef_other")] += 1
    k = keys_rule(w)
    if k["changes"]:
        c[(p, "keychange")] += 1
    if k["per_staff"] or k["nontrad"]:
        c[(p, "key_perstaff_or_nontrad")] += 1
for k in sorted(c):
    print(k, c[k])
print("generated max one-staff simultaneity (semitones):", genreach)
print("ballade4 clef changes:", ballade4)
print("restatement examples:", restate_ex)
print("hand words with opening bracket:", hw_paren)
print("staves:", sorted(staves.items()))
