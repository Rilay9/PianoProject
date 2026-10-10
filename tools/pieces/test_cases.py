"""Hand-made cases for the step-3 matching and level rules: each should pass, fail, or is built to fool the rule
(CLAUDE.md technical rule 2; ChatGPT's code review, 2026-10-10). Usage: python tools/pieces/test_cases.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from match import catalogue as c, cat_compare as cc  # noqa: E402
from quality_check import not_piano, NONPIANO  # noqa: E402
from summarise import app_levels  # noqa: E402
from movements import named_movements  # noqa: E402
from candidates import key_warning, in_pool  # noqa: E402
import build_wanted  # noqa: E402
from collections import defaultdict  # noqa: E402
from level_fit import fits_b  # noqa: E402

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
    ("Cantabile in Bb major B 84", "Chopin: Cantabile in B-flat major B. 84", "none"),     # B flat both sides
    ("Away in a Manger", "Away in a Manger in F", "none"),                                # "in a" is no key
    ("Minuet in G major", "Minuet in G minor", "conflict"),
]
PIANO = [(["Piano"], ""), (["Voice", "Piano"], "Voice"), (["Piano RH", "Piano LH"], ""), (["Harpsichord"], ""),
         (["Violin", "Violin"], "Violin"), (["Organ"], "Organ"), (["", ""], "")]
TITLES = [("Theme for Cello + Piano", True), ("Sailor's Hornpipe", False), ("Voices of Spring", False),
          ("Prelude for Organ", True), ("Heart and Soul", False)]
LEVELS = [  # (sources, expected app levels)
    ("PSyllabus:AMEB=11(ps10); PSyllabus:NZMEB=10(ps10); PSyllabus:RCM=9(ps10)", set()),  # Revolutionary Etude
    ("PSyllabus:RCM=10(ps9)", {"8"}), ("PSyllabus:ABRSM=0(ps1)", {"B"}), ("Trinity=2", {"2"}),
    ("PSyllabus:AMEB=3(ps3)", {"3"}),
    ("PSyllabus:RCM=9(ps8)", {"7"}),                      # PSyllabus agrees within one
    ("PSyllabus:RCM=9(ps9)", set()),                      # PSyllabus puts it above Grade 8: no automatic placement
    ("RCM=9; PSyllabus:RCM=9(ps10)", {"7"}),              # the current RCM list itself says 9
]
MOVEMENTS = [("Sonata mvt 10", [10]), ("Sonata 10th movement", [10]), ("Sonata Movement VI", [6]),
             ("Sonatina Op 20 No 1 - mvt 2 and 3", [2, 3]), ("Sonata in C: II", [2]), ("Prelude No. 4", [])]
KEYS = [  # (wanted title, file key signature, warning expected)
    ("Minuet in G major", 1, False), ("Minuet in G major", 0, True), ("Prelude in E minor", 1, False),
    ("Prelude in E minor", 4, True), ("Waltz in D flat major", -5, False), ("Gigue", 3, False),
    ("Away in a Manger", -1, False), ("Alone in a Crowd", 2, False), ("Born in a Barn in C", 2, True)]  # "in a" is no key
FITS_B = [  # (features, biggest chord, bars, fits Level B)
    ({"keysig": 0}, 2, 16, True), ({"keysig": 0, "sixteenth": 1}, 2, 16, False),
    ({"keysig": 0, "under_eighth": 1}, 2, 16, False),     # a 32nd or dotted sixteenth, no exact sixteenth
    ({"keysig": 3}, 2, 16, False), ({"keysig": 0}, 4, 16, False), ({"keysig": 0}, 2, 60, False)]
POOL = [({"source": "pdmx", "dedup": "no"}, False), ({"source": "pdmx", "dedup": "yes"}, True), ({"source": "shelf"}, True)]


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
    for t, want in MOVEMENTS:
        got = named_movements(t)
        bad += got != want
        print("ok " if got == want else "BAD", got, t)
    for t, ks, want in KEYS:
        got = bool(key_warning(c(t), ks))
        bad += got != want
        print("ok " if got == want else "BAD", got, t, ks)
    for feats, big, bars, want in FITS_B:
        got = fits_b(defaultdict(int, feats), big, bars)[0]
        bad += got != want
        print("ok " if got == want else "BAD", got, feats, big, bars)
    for row, want in POOL:
        got = in_pool(row)
        bad += got != want
        print("ok " if got == want else "BAD", got, row)
    srcs = {r["source"] for r in build_wanted.board_list_rows()}  # exam lists only (ChatGPT's review H1)
    got = "" not in srcs and not any(x.startswith("8notes") for x in srcs)
    bad += not got
    print("ok " if got else "BAD", "wanted.csv sources:", sorted(srcs)[:6], "...")
    print("all cases pass" if not bad else f"{bad} cases fail")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
