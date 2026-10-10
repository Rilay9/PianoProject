"""Hand-made cases for the step-3 matching and level rules: each should pass, fail, or is built to fool the rule
(CLAUDE.md technical rule 2; ChatGPT's code review, 2026-10-10). Usage: python tools/pieces/test_cases.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from match import catalogue as c, cat_compare as cc  # noqa: E402
from quality_check import not_piano, NONPIANO  # noqa: E402
from summarise import app_levels  # noqa: E402

CAT = [  # (wanted title, file title, expected cat_compare)
    ("Sonata in C Major, K 545: I", "Sonata No. 16 K. 545 II. Andante", "conflict"),       # different movement
    ("Sonata in C Major, K 545: I", "Piano Sonata 16 in C major - Movement 1 (K.545)", "match"),
    ("Vivace (4th movt from Sonatina in A minor, Op. 136 No. 4)", "Sonatina in A minor op. 136, no. 4", "partial"),
    ("Sonata Kp. 380", "Sonata in E major K. 380", "match"),                               # Kirkpatrick spelling
    ("Sonata K 32", "scarlatti-aria-sonata-k-34", "conflict"),
    ("Minuet in G, BWV Anh. 114", "Minuet in G major BWV Anh 114", "match"),              # was a false clash
    ("Etude Op 10 No 12", "Etude Op. 12 No. 10", "conflict"),                              # swapped numbers
    ("Invention No. 8 BWV 779", "Invention No. 10 BWV 781", "conflict"),
    ("Prelude Op 23 No 8", "Preludes op 23/6", "conflict"),                                # Op. N/M
    ("Book 2 No 3", "Book 3 No 3", "conflict"),
    ("Minuet in Eb major H 171", "Minuet_in_C_Minor", "conflict"),                         # underscores
    ("Sonatina in C major Op 151 No 4", "SONATINE I Anton Diabelli Op. 151.", "conflict"),  # French spelling
    ("Sonatina Op 36 No 1", "Sonatina Op. 36 No. 1", "match"),
    ("Prelude in C, BWV 846", "Prelude and Fugue No. 1 in C major BWV 846", "match"),
]
PIANO = [(["Piano"], ""), (["Voice", "Piano"], "Voice"), (["Piano RH", "Piano LH"], ""), (["Harpsichord"], ""),
         (["Violin", "Violin"], "Violin"), (["Organ"], "Organ"), (["", ""], "")]
TITLES = [("Theme for Cello + Piano", True), ("Sailor's Hornpipe", False), ("Voices of Spring", False),
          ("Prelude for Organ", True), ("Heart and Soul", False)]
LEVELS = [  # (sources, expected app levels)
    ("PSyllabus:AMEB=11(ps10); PSyllabus:NZMEB=10(ps10); PSyllabus:RCM=9(ps10)", set()),  # Revolutionary Etude
    ("PSyllabus:RCM=10(ps9)", {"8"}), ("PSyllabus:ABRSM=0(ps1)", {"B"}), ("Trinity=2", {"2"}),
    ("PSyllabus:AMEB=3(ps3)", {"3"}),
]


def main():
    bad = 0
    for w, h, want in CAT:
        got = cc(c(w), c(h))
        bad += got != want
        print("ok " if got == want else "BAD", got, "|", w, "|", h)
    for names, want in PIANO:
        got = not_piano(names)
        bad += got != want
        print("ok " if got == want else "BAD", repr(got), names)
    for t, want in TITLES:
        got = bool(NONPIANO.search(t))
        bad += got != want
        print("ok " if got == want else "BAD", got, t)
    for src, want in LEVELS:
        got = app_levels(src)[0]
        bad += got != want
        print("ok " if got == want else "BAD", got, src)
    print("all cases pass" if not bad else f"{bad} cases fail")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
