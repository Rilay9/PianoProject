"""Section 5 'candidates' threshold (the reference key is the signature's major or relative minor) from keys_v.json;
section 9 staff positions on the named examples (music21, clef lowestLine)."""
from common import *
import collections
from music21 import converter, clef as m21clef
D = json.load(open(OUT / "keys_v.json"))
R = [r for r in D.values() if r.get("ref") and "info" in r]
inpair = sum(1 for r in R if (r["ref"][0], r["ref"][1]) in {((7 * r["info"]["fifths"]) % 12, "major"), (((7 * r["info"]["fifths"]) + 9) % 12, "minor")})
print("reference items:", len(R), "reference key is one of the signature's two:", inpair)
print("   outside:", [(k, r["ref"], r["info"]["fifths"]) for k, r in D.items() if r.get("ref") and "info" in r and (r["ref"][0], r["ref"][1]) not in {((7 * r["info"]["fifths"]) % 12, "major"), (((7 * r["info"]["fifths"]) + 9) % 12, "minor")}][:10])


def where(s):
    if 0 <= s <= 8:
        return f"line {s // 2 + 1}" if s % 2 == 0 else f"space {s // 2 + 1}"
    if s == -1:
        return "space below"
    if s == 9:
        return "space above"
    if s % 2 == 0:
        return f"ledger {-s // 2} below" if s < 0 else f"ledger {(s - 8) // 2} above"
    return f"between ledgers (s={s})"


for iid in ["exercise.five-finger.c-major.right", "exercise.interval-reading.c-position.left.01", "song.folk.twinkle.rh"]:
    s = converter.parse(str(CONTENT / BYID[iid]["file"]))
    out = collections.OrderedDict()
    for pi, part in enumerate(s.parts):
        for n in part.recurse().notes:
            if "ChordSymbol" in n.classes or n.duration.isGrace:
                continue
            c = n.getContextByClass(m21clef.Clef)
            for p in n.pitches:
                out.setdefault((pi, p.nameWithOctave), where(p.diatonicNoteNum - c.lowestLine))
    print(iid, sorted(out.items(), key=lambda x: (x[0][0], x[0][1][-1], x[0][1])))
