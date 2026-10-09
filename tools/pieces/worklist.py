"""Write per-level checklists for the reference check, done by a reviewer (ChatGPT) instead of the orchestrator.

For each app level, the candidate pieces in priority order: MusicXML file, facts fit (quality check), PDMX's
canonical upload preferred, high confidence before medium, pieces on more lists first. For each piece the checklist
gives the wanted title and its list sources, the candidate file and its plain facts, the first 8 bars of the top and
bottom staff as text (pitch + note value, read with music21), and a search line for a reference.
Pieces already settled in the Grade 1 pilot carry their status.

Output: docs/pieces/review/level-<L>.md (one per level) and docs/pieces/review/results-template.csv.
Usage: python tools/pieces/worklist.py [per_level]   (default 25 candidates per level)
"""
import csv, os, sys
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
OUT = os.path.join(ROOT, "docs", "pieces", "review")
csv.field_size_limit(10**9)
sys.path.insert(0, os.path.dirname(__file__))
import summarise as S  # noqa: E402

VALUE = {4.0: "whole", 3.0: "dotted half", 2.0: "half", 1.5: "dotted quarter", 1.0: "quarter",
         0.75: "dotted 8th", 0.5: "8th", 0.25: "16th", 0.125: "32nd", 6.0: "dotted whole"}
PILOT = {  # settled in docs/pieces/grade-1-pieces-pilot.md
    "W. A. Mozart Minuet in F Major K2.": "CONFIRMED (pilot, Pianocoda reference)",
    "Mozart: Minuet in F Major (K2) (easy)": "ERROR bar 7 (pilot)",
    "Schumann: Soldier's March Op. 68 No. 2": "CONFIRMED (pilot, Pianocoda reference)",
    "Johann Sebastian Bach - Schaff's mit mir Gott": "CONFIRMED (pilot, Pianocoda reference)",
    "Tedesca": "WRONG PIECE (pilot)",
    "Haydn - German dance": "WRONG PIECE, broken file (pilot)",
    "Russian Folk Song Op 107 No. 3 by Ludwig van Beethoven": "CONFIRMED (pilot, 3 independent uploads agree)",
    "Air from 'little Russia'": "CONFIRMED (pilot, 3 independent uploads agree)",
    "Ludwig van Beethoven - Chanson Russ\'e": "CONFIRMED (pilot, 3 independent uploads agree)",
}


def value(q):
    q = round(float(q), 3)
    if q == 0:
        return "grace note"
    if q in VALUE:
        return VALUE[q]
    if abs(q - 1 / 3) < 0.01:
        return "triplet 8th"
    if abs(q - 2 / 3) < 0.01:
        return "triplet quarter"
    if abs(q - 1 / 6) < 0.01:
        return "triplet 16th"
    return f"{q:g} beats"


def opening(path, n=8):
    import music21
    s = music21.converter.parse(path)
    parts = list(s.parts)
    out = []
    for label, part in (("RH (top staff)", parts[0]), ("LH (bottom staff)", parts[-1])):
        bars = []
        for i, m in enumerate(list(part.getElementsByClass(music21.stream.Measure))[:n], 1):
            ev = []
            for e in m.recurse().notesAndRests:
                if e.isRest:
                    ev.append(f"rest {value(e.quarterLength)}")
                elif e.isChord:
                    ev.append("+".join(p.nameWithOctave.replace("-", "b") for p in e.pitches) + " " + value(e.quarterLength))
                else:
                    ev.append(e.nameWithOctave.replace("-", "b") + " " + value(e.quarterLength))
            bars.append(f"b{i}: " + ", ".join(ev))
        out.append((label, bars))
    return out


def main():
    per = int(sys.argv[1]) if len(sys.argv) > 1 else 25
    rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "quality.csv"), encoding="utf-8"))
            if r["a_file"].lower().endswith((".mxl", ".musicxml", ".xml")) and r["verdict"] == "facts fit"]
    pieces = defaultdict(list)
    for r in rows:
        pieces[(r["composer"], r["title"])].append(r)
    # one row per candidate file: the same file can be the best candidate for several list titles of one piece
    by_file = {}
    for key, rs in pieces.items():
        r = sorted(rs, key=lambda x: (x["confidence"] != "high", x.get("a_dedup") == "no"))[0]
        f = by_file.setdefault(r["a_file"], {"r": r, "keys": [], "sources": set()})
        f["keys"].append(key)
        f["sources"].update(r["sources"].split("; "))
        if r["confidence"] == "high":
            f["r"] = r
    by_level = defaultdict(list)
    for f in by_file.values():
        r = dict(f["r"], sources="; ".join(sorted(f["sources"])))
        key = f["keys"][0] if len(f["keys"]) == 1 else (f["keys"][0][0], " / ".join(k[1] for k in f["keys"]))
        for lvl in S.app_levels(r["sources"])[0]:
            by_level[lvl].append((r["confidence"] != "high", -len(f["sources"]), key, r))
    os.makedirs(OUT, exist_ok=True)
    for lvl in S.ORDER:
        cands = sorted(by_level.get(lvl, []))[:per]
        if not cands:
            continue
        lines = [f"# Reference check, app level {lvl}", "",
                 "**How to work through this list**",
                 "1. Go in order. Stop when this level has **8 confirmed pieces** (a suggested target; ideally at least two "
                 "of each kind the lists name: agile, lyrical, another style; or the RCM periods).",
                 "2. For each piece, find a **reference**: an engraved or printed score of the piece that is NOT from "
                 "MuseScore or PDMX (those are where the candidate files come from). Pianocoda (pianocoda.com) has "
                 "free PDFs of many RCM-list pieces; other free engraved PDFs are fine. Not IMSLP.",
                 "3. Compare the reference's **bars 1–8, both hands**, with the notes listed below (pitch with octave, "
                 "C4 = middle C; then the note value). Ignore fingering, dynamics and slurs.",
                 "4. Record in `results-template.csv`: the reference URL and a verdict:",
                 "   - **CONFIRMED**: every note and value in bars 1–8 matches;",
                 "   - **ERROR bar N**: the right piece, but bar N differs;",
                 "   - **WRONG PIECE**: it is not the piece named;",
                 "   - **NO REFERENCE**: none found.",
                 "   Say only what you compared; do not judge from memory of the piece.",
                 "", "Facts already checked by script for every row: MusicXML piano score, key signature consistent "
                 "with the title, no arrangement words in the file title; PDMX's canonical upload where one exists.", ""]
        for i, (_, _, key, r) in enumerate(cands, 1):
            path = os.path.join(FILES, os.path.basename(r["a_file"])) if r["a_source"] == "pdmx" else os.path.join(ROOT, r["a_file"])
            status = PILOT.get(r["a_title"].strip(), "")
            lines += [f"## {lvl}.{i:02d} {key[0]}: {key[1]}", "",
                      f"- **On the lists:** {r['sources']}",
                      f"- **Candidate file:** `{r['a_file']}` (title in file: \"{r['a_title']}\"; {r['a_source']}; "
                      f"confidence {r['confidence']}; key signature {r['keysig']} sharps; time {r['time']}; {r['bars']} bars)",
                      f"- **Search:** `{key[0]} {key[1]} piano sheet music pdf` (try Pianocoda first)"]
            if status:
                lines.append(f"- **Already settled:** {status}")
            try:
                for label, bars in opening(path):
                    lines.append(f"- **{label}:**")
                    lines += [f"  - {b}" for b in bars]
            except Exception as e:
                lines.append(f"- **Opening bars:** could not be read ({type(e).__name__}); skip this row")
            lines.append("")
        open(os.path.join(OUT, f"level-{lvl}.md"), "w", encoding="utf-8", newline="\n").write("\n".join(lines))
        print(f"level {lvl}: {len(cands)} candidates")
    with open(os.path.join(OUT, "results-template.csv"), "w", encoding="utf-8", newline="") as f:
        csv.writer(f).writerow(["row_id", "reference_url", "verdict", "notes"])


if __name__ == "__main__":
    main()
