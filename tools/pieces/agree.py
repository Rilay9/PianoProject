"""Cross-check independent MusicXML files of the same wanted piece: do their opening bars agree note for note?

For each wanted piece given (composer + title as in quality.csv), every MusicXML candidate file whose facts fit is
read with music21; the first N measures of the top staff and of the lowest staff are reduced to (pitch, duration)
sequences, transposition-free comparison is NOT done (a file in another key is a different edition and is reported
as such). Two files agree when their sequences are identical. Agreement counts as independent only between files that are each PDMX's
deduplicated copy (or come from different sources): PDMX marks 56% of its rows as copies. Independent agreement is
evidence that the notes are right; it is weaker than comparing with a printed score, and it is not proof.
Limits (ChatGPT's script review M3, 2026-10-10): the sequences hold pitch and duration in order only, with no onsets
within the bar and no voices, so agreement means "the same notes in the same order in these bars"; and PDMX's
deduplicated flag does not show that two uploads were engraved independently (one may copy the other's source).

Usage: python tools/pieces/agree.py "<title substring>" [measures]   (prints a table)
"""
import csv, os, sys
csv.field_size_limit(10**9)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")


def opening(path, n):
    import music21
    s = music21.converter.parse(path)
    parts = list(s.parts)
    def seq(p):
        out = []
        for m in list(p.getElementsByClass(music21.stream.Measure))[:n]:
            for e in m.recurse().notesAndRests:
                if e.isRest:
                    out.append(("r", float(e.quarterLength)))
                elif e.isChord:
                    out.append(("+".join(sorted(x.nameWithOctave for x in e.pitches)), float(e.quarterLength)))
                else:
                    out.append((e.nameWithOctave, float(e.quarterLength)))
        return out
    return seq(parts[0]), seq(parts[-1])


def main():
    want = sys.argv[1].lower()
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "build", "pieces", "quality.csv"), encoding="utf-8"))
            if want in r["title"].lower() and r["a_file"].lower().endswith((".mxl", ".musicxml", ".xml"))]
    seen, files = set(), []
    for r in rows:
        p = os.path.join(FILES, os.path.basename(r["a_file"])) if r["a_source"] == "pdmx" else os.path.join(ROOT, r["a_file"])
        if p in seen or not os.path.exists(p):
            continue
        seen.add(p)
        files.append((r, p))
    res = []
    for r, p in files:
        try:
            top, low = opening(p, n)
            res.append((r, top, low))
        except Exception as e:
            print("  parse failed:", r["a_title"][:40], type(e).__name__)
    print(f"{want!r}: {len(res)} file(s)")
    for i, (r, top, low) in enumerate(res):
        same = [j for j, (_, t2, l2) in enumerate(res) if j != i and t2 == top and l2 == low]
        same_top = [j for j, (_, t2, _) in enumerate(res) if j != i and t2 == top]
        canon = r.get("a_source") != "pdmx" or r.get("a_dedup") == "yes"
        indep = [j for j in same if canon and (res[j][0].get("a_source") != "pdmx" or res[j][0].get("a_dedup") == "yes")]
        print(f"  [{i}] {'canonical' if canon else 'COPY'} {r['a_title'][:36]!r} keysig={r['keysig']} time={r['time']} bars={r['bars']} | "
              f"independent agreement with {indep or '-'} | "
              f"agrees fully with {same or '-'}; top staff with {same_top or '-'} | top: {' '.join(f'{a}/{b:g}' for a, b in top[:10])}")


if __name__ == "__main__":
    main()
