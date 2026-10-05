"""
Tests for quarry_core.identity and quarry_core.analyse. Plain asserts; run either way:

    python tools/content/pdmx/test_quarry_identity.py
    pytest tools/content/pdmx/test_quarry_identity.py

They read the cached CSV rows written by quarry_lanes.py (build/quarry-cache/csv_hits_*.json); no tar stream,
no CSV pass. Run quarry_lanes.py once first if the cache is missing.
"""
from __future__ import annotations

import glob
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
sys.path.insert(0, str(HERE))
from quarry_core import analyse, identity, mxl_inner_xml, norm  # noqa: E402

LANES = json.loads((REPO / "docs/review/pdmx-quarry-2026-10-05/lanes.json").read_text(encoding="utf-8"))["lanes"]
_files = sorted(glob.glob(str(REPO / "build/quarry-cache/csv_hits_*.json")), key=os.path.getmtime)
assert _files, "no cached CSV hits: run tools/content/pdmx/quarry_lanes.py once"
CACHE = json.loads(Path(_files[-1]).read_text(encoding="utf-8"))
KNOWN = CACHE["known_rows"]
ALIASES = {(l["id"], norm(t["title"])): t["aliases"] for l in LANES for t in l.get("targets", [])}
KNOWN_EXPECT = {k[1]: (k[0], k[2]) for l in LANES for k in l.get("known", [])}


def hits(lane, term):
    out = []
    for c, h in CACHE["term_hits"][lane].items():
        if term in h["terms"]:
            out.append(h["row"])
    return out


def ident_target(lane, term, row):
    return identity(term, ALIASES[(lane, norm(term))], row)[0]


def ident_known(cid):
    label, exp = KNOWN_EXPECT[cid]
    import re
    from quarry_core import strip_brackets
    title = norm(strip_brackets(label).split(" - ")[0])
    return identity(title, exp, KNOWN[cid])[0]


def has(row, *needles):
    blob = norm(" ".join([row["title"], row["song_name"], row["composer"], row["artist"]]))
    return any(norm(n) in blob for n in needles)


# ---- cases the reviewer found, which must not be MATCH
def test_star_of_indiana_is_not_indiana():
    assert ident_known("Qmcy1D9Q8SPEBVa1nqy4TtjYeg8saf7mwC2CxnMpj16T9z") != "MATCH"


def test_squeeze_me_softly_is_not_squeeze_me():
    assert ident_known("QmTw3EQxygcbdDsDvKz6zRd2fjCGsvJGhG7C6aAYbCnyq8") == "MISMATCH"


def test_behold_the_changing_autumn_leaves_asa_hull():
    assert ident_known("QmWLjxJSdX1VjYwcEkDYhj7CDhWLX4rFbSakCxiGTJWT7T") == "MISMATCH"


def test_shout_for_joy_ye_holy_throng():
    assert ident_known("QmadiFaW4tDntpiEiazA5Ec2hyvTNCAdQ1K2Ru4XhDF3Qw") != "MATCH"


def test_handel_hallelujah_chorus_is_not_cohen():
    rows = [r for r in hits("I-pop", "hallelujah") if has(r, "handel", "hndel", "ndel")]
    assert rows, "no Handel Hallelujah rows in the cache"
    assert all(ident_target("I-pop", "hallelujah", r) != "MATCH" for r in rows)
    assert any(ident_target("I-pop", "hallelujah", r) == "MISMATCH" for r in rows)


def test_playford_vienna_is_not_billy_joel():
    rows = [r for r in hits("I-pop", "vienna") if has(r, "playford")]
    assert rows and all(ident_target("I-pop", "vienna", r) == "MISMATCH" for r in rows)


def test_brauer_and_prout_nightmare_are_not_a7x():
    rows = [r for r in hits("K-metal", "nightmare") if has(r, "brauer", "prout")]
    assert len(rows) >= 2 and all(ident_target("K-metal", "nightmare", r) == "MISMATCH" for r in rows)


def test_kenshi_yonezu_orion_is_not_metallica():
    rows = [r for r in hits("K-metal", "orion") if has(r, "yonezu")]
    assert rows and all(ident_target("K-metal", "orion", r) == "MISMATCH" for r in rows)


def test_unrelated_harvest_is_not_opeth():
    rows = [r for r in hits("K-metal", "harvest") if has(r, "seward", "needham", "tours", "menthal")]
    assert rows and all(ident_target("K-metal", "harvest", r) == "MISMATCH" for r in rows)


def test_unrelated_something_is_not_the_beatles():
    rows = [r for r in hits("I-pop", "something") if has(r, "yrome", "elrune4")]
    assert rows and all(ident_target("I-pop", "something", r) == "MISMATCH" for r in rows)


def test_john_legend_all_of_me_is_not_the_jazz_standard():
    rows = [r for r in hits("B-jazz", "all of me") if has(r, "john legend")]
    assert len(rows) >= 5 and all(ident_target("B-jazz", "all of me", r) != "MATCH" for r in rows)
    assert all(ident_target("B-jazz", "all of me", r) == "MISMATCH" for r in rows if r["composer"] == "John Legend")


# ---- true positives that must survive
def test_true_positives_kept():
    rows = [r for r in hits("I-pop", "she's always a woman") if r["title"] == "Billy Joel - She's Always A Woman"]
    assert rows and ident_target("I-pop", "she's always a woman", rows[0]) == "MATCH"
    rows = [r for r in hits("K-metal", "enter sandman") if r["composer"] == "Metallica"]
    assert rows and ident_target("K-metal", "enter sandman", rows[0]) == "MATCH"
    rows = [r for r in hits("B-jazz", "autumn leaves") if has(r, "kosma") and r["title"] == "Autumn Leaves"]
    assert rows and all(ident_target("B-jazz", "autumn leaves", r) == "MATCH" for r in rows)


def test_traditional_or_missing_creator_is_title_only_not_mismatch():
    row = {"title": "Deep River", "song_name": "", "subtitle": "", "composer": "", "artist": ""}
    assert identity("deep river", ["traditional", "spiritual", "burleigh"], row)[0] == "TITLE_ONLY"
    row["composer"] = "Traditional"
    assert identity("deep river", ["traditional", "spiritual", "burleigh"], row)[0] == "MATCH"
    row["composer"] = "Misc tunes"
    assert identity("deep river", ["traditional", "spiritual", "burleigh"], row)[0] == "TITLE_ONLY"


def test_whole_token_matching_helper():
    from quarry_core import padded
    assert " muse " not in padded("The Museum") and " numb " not in padded("Number 6")
    assert " muse " in padded("Muse - Hysteria")


# ---- shape
def _xml(parts):
    """parts: list of (name, program, staves, n_harmony)."""
    sp = "".join(f'<score-part id="P{i}"><part-name>{n}</part-name><midi-instrument id="I{i}"><midi-program>{p + 1}'
                 f'</midi-program></midi-instrument></score-part>' for i, (n, p, s, h) in enumerate(parts))
    body = ""
    for i, (n, p, s, h) in enumerate(parts):
        harm = "".join('<harmony><root><root-step>C</root-step></root></harmony>' for _ in range(h))
        body += (f'<part id="P{i}"><measure number="1"><attributes><divisions>1</divisions><staves>{s}</staves>'
                 f'<time><beats>4</beats><beat-type>4</beat-type></time></attributes>{harm}</measure></part>')
    return f'<score-partwise><part-list>{sp}</part-list>{body}</score-partwise>'.encode()


def test_three_one_staff_piano_parts_are_multi_piano_part():
    a = analyse(_xml([("Soprano", 0, 1, 0), ("Alto", 0, 1, 0), ("Tenor", 0, 1, 0)]), [0, 0, 0])
    assert a["shape"] == "MULTI_PIANO_PART", a["shape"]


def test_grand_staff_leadsheet_and_saxophone_leadsheet():
    assert analyse(_xml([("Piano", 0, 2, 0)]), [0])["shape"] == "PIANO_GRAND_STAFF"
    assert analyse(_xml([("Piano", 0, 1, 2)]), [0])["shape"] == "PIANO1"
    a = analyse(_xml([("Alto Saxophone", 65, 1, 9)]), [65])
    assert a["shape"] == "LEADSHEET" and a["part_names"] == ["Alto Saxophone"]
    assert analyse(_xml([("Piano", 0, 2, 0), ("Bass", 32, 1, 0)]), [0, 32])["shape"] == "MIXED_WITH_PIANO"
    assert analyse(_xml([("Flute", 73, 1, 0)]), [73])["shape"] == "OTHER"


def test_maoz_tzur_three_part_file_from_the_cache():
    raw = REPO / "build/quarry-cache/raw"
    found = []
    for c, h in CACHE["term_hits"]["G-holiday"].items():
        if has(h["row"], "maoz tzur", "maoz tsur"):
            p = raw / f"{c}.mxl"
            if not p.exists():
                continue
            a = analyse(mxl_inner_xml(p.read_bytes()), [])
            if a["n_parts"] >= 3 and a["max_staves"] == 1:
                found.append((c, a["shape"]))
    assert found, "no three-part Maoz Tzur file in the cache"
    assert all(s == "MULTI_PIANO_PART" for _, s in found), found


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    failed = 0
    for n, f in tests:
        try:
            f()
            print("PASS", n)
        except Exception as e:  # noqa: BLE001
            failed += 1
            print("FAIL", n, repr(e))
    print(f"{len(tests) - failed} passed, {failed} failed")
    sys.exit(1 if failed else 0)
