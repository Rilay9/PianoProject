"""Sections 11 and 12 as corrected: polytonal windows with the per-hand list diatonic / harmonic minor / melodic minor
ascending (and the first version's diatonic-only list), white-against-black; tone-row statements (the writer's final
test) and the new candidate-window trigger. On built files (written here under build/v1b/synth) and every catalogue item."""
from common import *
import collections
from pathlib import Path
from music21 import stream, note, chord, meter, clef, layout, serial
from rules.texture import view
import score as S

DIA = [frozenset((r + i) % 12 for i in (0, 2, 4, 5, 7, 9, 11)) for r in range(12)]
HARM = [frozenset((r + i) % 12 for i in (0, 2, 3, 5, 7, 8, 11)) for r in range(12)]
MEL = [frozenset((r + i) % 12 for i in (0, 2, 3, 5, 7, 9, 11)) for r in range(12)]
WIDE = DIA + HARM + MEL
WHITE, BLACK = {0, 2, 4, 5, 7, 9, 11}, {1, 3, 6, 8, 10}


def poly(v, coll):
    wins, wb = [], []
    if len(v.hands) < 2:
        return wins, wb, 0
    for a in range(0, v.n_bars, 4):
        sets = {}
        for h in ("R", "L"):
            arr = v.notes[h]
            sel = (arr["bar"] >= a) & (arr["bar"] < a + 4)
            sets[h] = frozenset(int(x) % 12 for x in arr["pitch"][sel])
        if all(len(s) >= 6 for s in sets.values()) and all(any(s <= d for d in coll) for s in sets.values()) and not any((sets["R"] | sets["L"]) <= d for d in coll):
            wins.append(a)
        if all(len(s) >= 3 for s in sets.values()) and ((sets["R"] <= WHITE and sets["L"] <= BLACK) or (sets["R"] <= BLACK and sets["L"] <= WHITE)):
            wb.append(a)
    runs2 = sum(1 for x, y in zip(wins, wins[1:]) if y == x + 4)
    return wins, wb, runs2


def sec(a, b):
    return min((b - a) % 12, (a - b) % 12) in (1, 2)


def ok_window(w):
    if len(set(p % 12 for p in w)) < 12:
        return False
    s = [sec(a, b) for a, b in zip(w, w[1:])]
    if sum(s) >= 8:
        return False
    run = best = 0
    for x in s:
        run = run + 1 if x else 0
        best = max(best, run)
    if best >= 5:
        return False
    ev, od = w[0::2], w[1::2]
    if all(sec(a, b) for a, b in zip(ev, ev[1:])) and all(sec(a, b) for a, b in zip(od, od[1:])):
        return False
    return True


def statements(line):
    out, k = [], 0
    while k <= len(line) - 12:
        if ok_window(line[k:k + 12]):
            out.append((k, tuple(p % 12 for p in line[k:k + 12])))
            k += 12
        else:
            k += 1
    return out


def rows(v):
    sts = []
    seen = set()
    for h, evs in v.hands.items():
        top = [e.high for e in evs]
        bot = [e.low for e in evs]
        for line in ([top] if top == bot else [top, bot]):
            for k, s in statements(line):
                key = (h, k, s)
                if key not in seen:
                    seen.add(key)
                    sts.append(s)
    return sts


def windows(v):
    """Section 12 step 4: 4-bar windows (both hands, every struck note): >= 12 notes, all 12 pcs, max count <= 2 x mean."""
    cands = []
    allp = [(int(b), int(p)) for h in v.notes for b, p in zip(v.notes[h]["bar"], v.notes[h]["pitch"])]
    for a in range(0, v.n_bars, 4):
        pcs = [p % 12 for b, p in allp if a <= b < a + 4]
        c = collections.Counter(pcs)
        if len(pcs) >= 12 and len(c) == 12 and max(c.values()) <= 2 * len(pcs) / 12:
            cands.append(a)
    two = sum(1 for x, y in zip(cands, cands[1:]) if y == x + 4)
    return cands, two


SY = OUT / "synth"
SY.mkdir(exist_ok=True)


def piece(rh, lh, name, dur=1.0):
    sc = stream.Score()
    for line, cl in ((rh, clef.TrebleClef()), (lh, clef.BassClef())):
        st = stream.PartStaff()
        st.append(meter.TimeSignature("4/4"))
        st.insert(0, cl)
        for x in line:
            ps = x.split()
            st.append(note.Note(ps[0], quarterLength=dur) if len(ps) == 1 else chord.Chord(ps, quarterLength=dur))
        st.makeMeasures(inPlace=True)
        sc.insert(0, st)
    sc.insert(0, layout.StaffGroup(list(sc.parts), symbol="brace"))
    path = SY / f"{name}.musicxml"
    sc.write("musicxml", fp=str(path))
    return path


N = ['C', 'C#', 'D', 'E-', 'E', 'F', 'F#', 'G', 'A-', 'A', 'B-', 'B']
row = [p.pitchClass for p in serial.getHistoricalRowByName("SchoenbergOp25").pitches]
inv = [(-x + 2 * row[0]) % 12 for x in row]
cmaj = ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"] * 4
fsharp = ["F#2", "G#2", "A#2", "B2", "C#3", "D#3", "E#3", "F#3"] * 4
fsharp_harm = ["F#2", "G#2", "A2", "B2", "C#3", "D3", "E#3", "F#3"] * 4  # F# harmonic minor
gmaj = ["G2", "A2", "B2", "C3", "D3", "E3", "F#3", "G3"] * 4
a_harm_both = (["A4", "B4", "C5", "D5", "E5", "F5", "G#5", "A5"] * 4, ["A2", "B2", "C3", "D3", "E3", "F3", "G#3", "A3"] * 4)  # same key, harmonic minor
# a row split between the hands: RH notes 1-6, LH notes 7-12, as chords of three (hexachords), P then I, twice
split_rh = [" ".join(f"{N[pc]}5" for pc in row[0:3]), " ".join(f"{N[pc]}5" for pc in row[3:6]), " ".join(f"{N[pc]}5" for pc in inv[0:3]), " ".join(f"{N[pc]}5" for pc in inv[3:6])] * 8
split_lh = [" ".join(f"{N[pc]}3" for pc in row[6:9]), " ".join(f"{N[pc]}3" for pc in row[9:12]), " ".join(f"{N[pc]}3" for pc in inv[6:9]), " ".join(f"{N[pc]}3" for pc in inv[9:12])] * 8
rowline = [f"{N[pc]}5" for pc in row + inv + row[::-1]]
chrom = [f"{N[pc % 12]}5" for pc in range(12)] * 3
built = {
    "bitonal_C_over_Fsharp_major": (cmaj, fsharp),
    "bitonal_C_over_Fsharp_harmonic_minor": (cmaj, fsharp_harm),
    "same_key_C_over_G": (cmaj, gmaj),
    "same_key_A_harmonic_minor_both_hands": a_harm_both,
    "row_split_between_hands_in_chords": (split_rh, split_lh),
    "row_one_line": (rowline, ["C3"] * len(rowline)),
    "chromatic_scale": (chrom, ["C3"] * len(chrom)),
}
print("== built files")
for nm, (rh, lh) in built.items():
    p = piece(rh, lh, nm)
    v = view(load_path(p))
    w1 = poly(v, DIA)
    w2 = poly(v, WIDE)
    sts = rows(v)
    cw, two = windows(v)
    print(nm, "| polytonal diatonic-only: windows", w1[0], "2-consecutive", w1[2], "| widened:", w2[0], "2-consecutive", w2[2], "| white/black", w2[1],
          "| row statements", len(sts), "| candidate windows", cw, "consecutive pairs", two)

if "built" in sys.argv:
    sys.exit()
print("== catalogue")
res = {}
for it in ITEMS:
    try:
        if one_line_staff(it):
            continue
        v = view(load(it))
        if v.unknown:
            continue
    except Exception:
        continue
    w1, w2 = poly(v, DIA), poly(v, WIDE)
    sts = rows(v)
    cw, two = windows(v)
    res[it["id"]] = {"p": pipeline(it), "poly1": w1[2], "poly2": w2[2], "poly2_w": w2[0], "wb": w2[1], "st": len(sts), "cw": cw, "two": two, "bars": v.n_bars}
json.dump(res, open(OUT / "poly_row.json", "w"), indent=0)
for p in ["generated", "pdmx", "other"]:
    R = {k: r for k, r in res.items() if r["p"] == p or (p == "other" and r["p"] not in ("generated", "pdmx"))}
    print(p, len(R), "| polytonal (2 consecutive windows) diatonic-only:", [k for k, r in R.items() if r["poly1"]],
          "| widened:", [k for k, r in R.items() if r["poly2"]], "| white/black windows:", [k for k, r in R.items() if r["wb"]])
    st1 = [k for k, r in R.items() if r["st"] == 1]
    st2 = [k for k, r in R.items() if r["st"] >= 2]
    trig = [k for k, r in R.items() if r["two"] or r["st"] >= 1]
    anyw = [k for k, r in R.items() if r["cw"]]
    print("   tone row: items with 1 statement", st1, "| >= 2 statements", st2, "| items with any candidate window", len(anyw),
          "| items sent to the agent (2 consecutive windows or a statement)", len(trig), trig[:25])
