"""Select the When in Rome pieces and write wir_pieces.json, with the ground truth per bar.

Selection rule (fixed before any method was scored; the length clause was added after the 3-piece pilot showed the Reger
Modulation examples are 1-3 bars long, which is a property of the data, not of any method's result):
  eligible = a directory under build/when-in-rome/Corpus that holds an analysis (analysis.txt, or analysis.rntxt for the
             textbook corpora; analysis_*.txt / *_automatic.rntxt variants are ignored) AND a local score.mxl, and whose
             analysis parses in music21;
  group K  = eligible pieces under Corpus/Keyboard_Other and Corpus/Piano_Sonatas (all of them: keyboard music first);
  group T  = eligible pieces under Corpus/Textbooks with at least 8 bars in the analysis (8 = the current key.change
             detector's own minimum), in sorted path order;
  take all of K, then T until 200 pieces. Pieces under 8 bars (all 117 Reger Modulation examples are 1-3 bars) are not
  selected: one transition per piece cannot test bar-resolution detection with a +-1 tolerance.
Truth: the RomanText parsed by music21 (converter.parse(..., format='romanText')). Global key = the key of the first
RomanNumeral. Local key at the start of bar b = the key of the RomanNumeral at beat 1 of bar b if there is one, else the
key of the last RomanNumeral before it. Bars are keyed by the analysis's measure numbers; a number that occurs twice in
the score is mapped to its first occurrence.
"""
from cmp_common import *
from music21 import converter

CAP = 200
MIN_BARS = 8


def find_pieces():
    out = []
    corpus = WIR / "Corpus"
    for r, d, f in os.walk(corpus):
        an = "analysis.txt" if "analysis.txt" in f else ("analysis.rntxt" if "analysis.rntxt" in f else None)
        if an and "score.mxl" in f:
            rel = Path(r).relative_to(WIR).as_posix()
            out.append((rel, an))
    return sorted(out)


def truth(path):
    a = converter.parse(str(path), format="romanText")
    rns = list(a.recurse().getElementsByClass("RomanNumeral"))
    rns = [r for r in rns if r.measureNumber is not None]
    if not rns:
        return None
    glob = m21_key(rns[0].key)
    per_bar = {}                       # measure number -> (pc, mode) at the bar's start
    bars = []
    for r in rns:
        n = r.measureNumber
        if not bars or bars[-1] != n:
            bars.append(n)
    first_in_bar = {}
    last_in_bar = {}
    for r in rns:
        n = r.measureNumber
        if n not in first_in_bar or r.beat < first_in_bar[n][0]:
            first_in_bar[n] = (r.beat, m21_key(r.key))
        last_in_bar[n] = m21_key(r.key)
    prev = glob
    for n in bars:
        fb, k = first_in_bar[n]
        per_bar[n] = k if abs(fb - 1.0) < 1e-6 else prev
        prev = last_in_bar[n]
    return {"global": glob, "bars": [[n, per_bar[n]] for n in bars]}


if __name__ == "__main__":
    el = find_pieces()
    K = [("keyboard", *p) for p in el if p[0].startswith(("Corpus/Keyboard_Other/", "Corpus/Piano_Sonatas/"))]
    T = [("textbook", *p) for p in el if p[0].startswith("Corpus/Textbooks/")]
    print("eligible", len(el), "K", len(K), "T", len(T))
    out, short, bad = [], 0, []
    for grp, rel, an in K + T:
        if len(out) >= CAP:
            break
        try:
            t = truth(WIR / rel / an)
        except Exception as e:  # noqa
            bad.append({"dir": rel, "group": grp, "error": repr(e)[:160]})
            continue
        if t is None:
            bad.append({"dir": rel, "group": grp, "error": "no RomanNumerals"})
            continue
        if grp == "textbook" and len(t["bars"]) < MIN_BARS:
            short += 1
            continue
        out.append({"dir": rel, "group": grp, "analysis": an, "truth": t})
    json.dump({"pieces": out, "unparsed": bad, "textbook_under_8_bars": short}, open(HERE / "wir_pieces.json", "w"), indent=0)
    import collections
    print("selected", len(out), dict(collections.Counter(o["group"] for o in out)), "unparsed", len(bad), "textbook under 8 bars", short)
    import subprocess
    commit = subprocess.run(["git", "-C", str(WIR), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    print("when-in-rome commit", commit)
