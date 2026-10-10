"""What the Learn & Master Piano lesson book says each session teaches, beside the pieces it uses there.

Each session opens with an "Overview" list (the session's items, pieces among them) and a "Skills to Master" list.
Both are read from the PDF's text with pymupdf; the pieces come from docs/sources/lists/learnandmaster-songs.csv.

Each session is matched by hand to the rungs whose skill it names (RUNGS below).

Output: docs/sources/lists/learnandmaster-skills.csv. Usage: python tools/pieces/book_skills.py
"""
import csv, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PDF = os.path.join(ROOT, "build", "pieces", "books", "learnandmaster", "Piano_Lessons_book_v2.pdf")
URL = "https://www.learnandmaster.com/piano/resources/Piano_Lessons_book_v2.pdf"

# session -> rungs (rungs.md) whose "Learns" names what the session's Skills to Master or Overview names, with the
# book's words. A reading of the two texts side by side (2026-10-10), not a measurement; sessions with no clear rung
# are left out. The book gives no grade: a piece's level comes from the rung, and the arrangement must suit it.
RUNGS = {
    1: ("P.1", "Sitting Properly at the Keyboard; The Layout of the Keyboard"),
    2: ("B.5", "Playing the C, F, and G Chords"),
    3: ("B.4", "Playing a C Major Scale Using Correct Fingering"),
    4: ("A.6", "Using the Sustain Pedal Properly"),
    5: ("B.5", "Knowing How to Build Minor Chords; Relating Chords to the Major Scale by Number"),
    6: ("2.3", "Knowing How to Form Triad Inversions"),
    7: ("A.3; B.8", "Reading Rest Values in Music (A.3); Playing a Melody Lyrically (B.8 phrasing); Amazing Grace is printed as a melody only, one staff with lyrics (p. 27)"),
    8: ("A.5; B.3", "Reading Sharps and Flats (A.5); Interpreting Keys and Key Signatures (B.3)"),
    9: ("B.4", "Building a Minor Scale (B.4 alternatives: natural minor)"),
    10: ("B.6; B.8; 2.3", "Root-5th-Root Accompaniment Pattern (B.6); Sustain Pedal when Stacking Chords (B.8); Connecting Chords by the Closest Inversion (2.3)"),
    12: ("1.3; 1.4", "Using Arpeggios (1.3); Reading Triplets (1.4)"),
    13: ("2.4", "Understanding Syncopated Rhythms"),
    15: ("2.4", "Playing Sixteenth Notes Correctly"),
    16: ("2.6", "Understanding Dominant 7th Chords (2.6 alternative: seventh chords met)"),
    17: ("2.4; 2.6", "Dotted Eighth-Sixteenth Syncopated Rhythm (2.4); Knowing the Blues Progression (2.6)"),
    18: ("B.6; 2.6", "Applying the Boogie-Woogie Bass Figure (B.6 meet); Understanding Grace Notes (2.6)"),
    21: ("1.5; B.6", "Playing the Left-Hand and Right-Hand Ostinato Progressions (1.5 prepare; B.6 meet); the book prints only a 2-bar excerpt of Spinning Song (p. 82)"),
    25: ("1.5", "Understanding Stride Piano; Ragtime (1.5: ragtime bass, meet); The Entertainer is the book's simplified first section, 18 bars, both hands (p. 95)"),
    26: ("1.4; 2.4", "Swing Phrasing (1.4 and 2.4: swing, meet)"),
}


def bullets(lines, start):
    """Bullet lines after the heading at index start, until the first line that is not a bullet."""
    out = []
    for ln in lines[start + 1:]:
        s = ln.strip()
        if not s:
            continue
        if re.match(r"^[^\w\"'(]\s*\S", s):
            out.append(re.sub(r"^[^\w\"'(]\s*", "", s))
        elif out and re.search(r"\b(of|the|are|and|to|a|in|with|for|by)$", out[-1]):  # a bullet wrapped onto a second line
            out[-1] += " " + s
        else:
            break
    return out


def main():
    import pymupdf
    d = pymupdf.open(PDF)
    sessions = {}
    for i, pg in enumerate(d):
        lines = pg.get_text().splitlines()
        for k, ln in enumerate(lines):
            m = re.match(r"^SESSION (\d+) - (.+)$", ln.strip())
            if m and int(m.group(1)) not in sessions:
                n = int(m.group(1))
                ov = next((j for j, x in enumerate(lines) if x.strip() == "Overview"), None)
                sk = next((j for j, x in enumerate(lines) if x.strip() == "Skills to Master"), None)
                sessions[n] = {"session": n, "session_title": m.group(2).strip(), "page": i + 1,
                               "subtitle": lines[k + 1].strip() if k + 1 < len(lines) else "",
                               "overview": " | ".join(bullets(lines, ov)) if ov is not None else "",
                               "skills": " | ".join(bullets(lines, sk)) if sk is not None else ""}
    pieces = {}
    for r in csv.DictReader(open(os.path.join(ROOT, "docs", "sources", "lists", "learnandmaster-songs.csv"), encoding="utf-8")):
        pieces.setdefault(int(r["session"]), []).append(r["title"])
    out = []
    for n in sorted(sessions):
        s = sessions[n]
        s["pieces"] = " | ".join(pieces.get(n, []))
        s["rungs"], s["rung_basis"] = RUNGS.get(n, ("", ""))
        s["source_url"] = URL
        out.append(s)
    p = os.path.join(ROOT, "docs", "sources", "lists", "learnandmaster-skills.csv")
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["session", "session_title", "subtitle", "page", "pieces", "overview", "skills", "rungs", "rung_basis", "source_url"])
        w.writeheader()
        w.writerows(out)
    print(len(out), "sessions;", sum(1 for s in out if s["skills"]), "with Skills to Master;", p)


if __name__ == "__main__":
    main()
