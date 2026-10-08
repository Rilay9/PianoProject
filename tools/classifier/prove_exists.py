#!/usr/bin/env python3
"""
The proving run for every characteristic the characteristics table claims EXISTS (docs/classifier/README.md;
the reviewer's ruling, docs/review/responses/classifier-gap-table-2.md, CGT2-proving-three-proofs).

Three proofs per EXISTS row, each reported as evidence, never as a verdict on the table:
  1. RUNS        the cited code is reached by the real build (build.py) or CI (ci.yml): the call site,
                 found by pattern, plus the artefact it writes and that artefact's age;
  2. POPULATION  its output is present on the catalogue rows of the population the row's pipeline
                 names (notated, pdmx, generated): present / expected, with every missing id;
  3. MEANING     the output means what the characteristic claims: compared, item by item, with an
                 independent witness of the claim read from the raw MusicXML (neither the app's score
                 model nor music21), presence and count; every disagreeing id listed. Where no
                 independent witness exists the row says so and why.

**Read-only on the ontology** (CGT2-proving-read-only): it reads docs/classifier/characteristics.yaml and
never writes it; it checks the file's hash before and after and fails if it changed. It writes only
build/proving/ (the witness cache) and docs/classifier/proving/<date>/ (results.json, report.md).

    python tools/classifier/prove_exists.py extract   # raw-XML witnesses + difficulty features, cached
    python tools/classifier/prove_exists.py report    # the three proofs, written to docs/classifier/proving/
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import io
import json
import re
import sys
import time
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHARS = ROOT / "docs/classifier/characteristics.yaml"
CATALOG = ROOT / "app/public/content/catalog.json"
CONTENT = ROOT / "app/public/content"
CACHE = ROOT / "build/proving/witness.json"
POSITIONS = ROOT / "build/positions-cache.json"
SCORE_CHECKS = ROOT / "build/score-checks.json"
RENDER = ROOT / "build/render-report.json"
DENSITY = ROOT / "content/sources/opportunity-density.json"
RUNG_CLAIMS = ROOT / "docs/prompts/rung-claims.md"
BUILD_PY = ROOT / "tools/content/build.py"
CI_YML = ROOT / ".github/workflows/ci.yml"
EPS = 1e-6
LETTERS = {"C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6}
STEP_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
SHARP_ORDER = "FCGDAEB"
TYPE_Q = {"breve": 8, "whole": 4, "half": 2, "quarter": 1, "eighth": 0.5, "16th": 0.25, "32nd": 0.125, "64th": 0.0625}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def key_alter(letter: str, fifths: int) -> int:
    if fifths > 0 and letter in SHARP_ORDER[:fifths]:
        return 1
    if fifths < 0 and letter in SHARP_ORDER[::-1][: -fifths]:
        return -1
    return 0


# ----------------------------------------------------------------------------------- the raw reader
def inner_xml(path: Path) -> bytes:
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        try:
            container = ET.fromstring(z.read("META-INF/container.xml"))
            for el in container.iter():
                if el.tag.endswith("rootfile") and el.get("full-path"):
                    return z.read(el.get("full-path"))
        except KeyError:
            pass
        return z.read(next(n for n in names if n.endswith(".xml") and not n.startswith("META-INF")))


def strip(root: ET.Element) -> ET.Element:
    for el in root.iter():
        if isinstance(el.tag, str) and "}" in el.tag:
            el.tag = el.tag.split("}", 1)[1]
    return root


def read_raw(path: Path, declared_hand: str | None) -> dict:
    """Every printed note with its staff, clef, onset and spelling; the notation facts. Repeats are not unrolled."""
    root = strip(ET.fromstring(inner_xml(path)))
    parts = root.findall("part")
    facts = {"parts": len(parts), "staves": 0, "bars": len(parts[0].findall("measure")) if parts else 0,
             "keys": [], "times": [], "harmony": len(root.findall(".//harmony")), "swing": False, "tempo": None,
             "graces": 0, "graces_short": 0, "swing_element": root.find(".//swing") is not None}
    notes, measure_len = [], {}
    for pi, part in enumerate(parts):
        divisions, fifths, pos_base = 1, 0, 0.0
        clef = {}
        staves_here = 1
        for mi, meas in enumerate(part.findall("measure")):
            pos, top = 0.0, 0.0
            last_onset = 0.0
            beats = beat_type = None
            for el in meas:
                tag = el.tag
                if tag == "attributes":
                    if el.findtext("divisions"):
                        divisions = float(el.findtext("divisions"))
                    if el.findtext("staves"):
                        staves_here = int(el.findtext("staves"))
                    for k in el.findall("key"):
                        if k.findtext("fifths") is not None:
                            fifths = int(k.findtext("fifths"))
                            if pi == 0:
                                facts["keys"].append([fifths, k.findtext("mode")])
                    for t in el.findall("time"):
                        if t.findtext("beats") and t.findtext("beat-type"):
                            if pi == 0:
                                facts["times"].append(f"{t.findtext('beats')}/{t.findtext('beat-type')}")
                    for c in el.findall("clef"):
                        clef[int(c.get("number") or 1)] = c.findtext("sign")
                elif tag == "direction":
                    if el.find(".//swing") is not None or "swing" in " ".join((w.text or "").lower() for w in el.iter("words")):
                        facts["swing"] = True
                    snd = el.find("sound")
                    if facts["tempo"] is None and snd is not None and snd.get("tempo"):
                        facts["tempo"] = float(snd.get("tempo"))
                    pm = el.find(".//metronome/per-minute")
                    if facts["tempo"] is None and pm is not None and pm.text:
                        try:
                            facts["tempo"] = float(re.sub(r"[^0-9.]", "", pm.text) or "nan")
                        except ValueError:
                            pass
                elif tag == "sound" and el.get("tempo") and facts["tempo"] is None:
                    facts["tempo"] = float(el.get("tempo"))
                elif tag == "backup":
                    pos -= float(el.findtext("duration") or 0) / divisions
                elif tag == "forward":
                    pos += float(el.findtext("duration") or 0) / divisions
                    top = max(top, pos)
                elif tag == "note":
                    grace = el.find("grace") is not None
                    chord = el.find("chord") is not None
                    dur = 0.0 if grace else float(el.findtext("duration") or 0) / divisions
                    onset = last_onset if chord else pos
                    if not chord and not grace:
                        last_onset = pos
                        pos += dur
                        top = max(top, pos)
                    if grace:
                        facts["graces"] += 1
                        if (el.findtext("type") or "") in ("16th", "32nd", "64th"):
                            facts["graces_short"] += 1
                    p = el.find("pitch")
                    if p is None or grace or el.find("cue") is not None:
                        continue
                    step, octave = p.findtext("step"), int(p.findtext("octave"))
                    alter = int(float(p.findtext("alter") or 0))
                    staff = int(el.findtext("staff") or 1)
                    ttype = el.findtext("type")
                    tm = el.find("time-modification")
                    ties = {t.get("type") for t in el.findall("tie")}
                    notes.append({
                        "part": pi, "staff": staff, "voice": el.findtext("voice") or "1", "bar": mi,
                        "onset": round(pos_base + onset, 6), "in_bar": round(onset, 6), "dur": dur,
                        "type": ttype, "dots": len(el.findall("dot")),
                        "tuplet": int(tm.findtext("actual-notes")) if tm is not None and tm.findtext("actual-notes") else None,
                        "tie_start": "start" in ties, "tie_stop": "stop" in ties,
                        "midi": (octave + 1) * 12 + STEP_PC[step] + alter, "letter": step, "alter": alter,
                        "pos": octave * 7 + LETTERS[step], "clef": clef.get(staff, "G" if staff == 1 else "F"),
                        "fifths": fifths,
                    })
            measure_len[(pi, mi)] = top
            pos_base += top
        facts["staves"] = max(facts["staves"], staves_here)
    # hands: one part with two staves -> staff 1 R, staff 2 L; two one-staff parts -> part 0 R, part 1 L;
    # one staff in all -> the catalogue's declared hand
    one_staff = facts["staves"] <= 1 and facts["parts"] <= 1
    for n in notes:
        if one_staff:
            n["hand"] = "L" if declared_hand == "left" else "R"
        elif facts["parts"] >= 2 and facts["staves"] <= 1:
            n["hand"] = "R" if n["part"] == 0 else "L"
        else:
            n["hand"] = "R" if n["staff"] == 1 else "L"
    facts["bar_len"] = [measure_len.get((0, i), 0.0) for i in range(facts["bars"])]
    facts["swing"] = facts["swing"] or facts["swing_element"]
    return {"facts": facts, "notes": notes}


def metre_of(times: list[str], bar: int, bar_times: dict) -> tuple[int, int]:
    t = bar_times.get(bar) or (times[0] if times else "4/4")
    b, bt = t.split("/")
    return int(re.sub(r"\D.*", "", b) or 4), int(bt)


def compound(b: int, bt: int) -> bool:
    return bt == 8 and b % 3 == 0 and b > 3


def witness(raw: dict) -> dict:
    """The characteristic claims, computed from the raw notes. Presence and count per claim."""
    f, notes = raw["facts"], raw["notes"]
    times = f["times"]
    b0, bt0 = metre_of(times, 0, {})
    w: dict = {}

    def put(cid, count, present=None):
        w[cid] = {"count": count, "present": bool(count) if present is None else present}

    put("clef.bass", sum(1 for n in notes if n["clef"] == "F"))
    def ledger(n):
        if n["clef"] == "F":
            return n["pos"] <= 16 or n["pos"] >= 29
        return n["pos"] <= 27 or n["pos"] >= 40
    put("pitch.ledger", sum(1 for n in notes if ledger(n)))
    # intervals: per part/staff/voice line, the top note at each onset
    lines = collections.defaultdict(dict)
    for n in notes:
        k = (n["part"], n["staff"], n["voice"])
        cur = lines[k].get(n["onset"])
        if cur is None or n["midi"] > cur["midi"]:
            lines[k][n["onset"]] = n
    steps = skips = leaps = 0
    leap_max = {"R": 0, "L": 0}
    for line in lines.values():
        seq = [line[o] for o in sorted(line)]
        for a, b in zip(seq, seq[1:]):
            size = abs(b["pos"] - a["pos"])
            steps += size == 1
            skips += size == 2
            leaps += size >= 3
            leap_max[a["hand"]] = max(leap_max[a["hand"]], abs(b["midi"] - a["midi"]))
    put("interval.step", steps)
    put("interval.skip", skips)
    put("interval.leap", leaps)
    put("rhythm.eighths", sum(1 for n in notes if n["type"] == "eighth" and n["tuplet"] is None))
    put("rhythm.shorter-than-quarter", sum(1 for n in notes if 0 < n["dur"] < 1 - EPS))
    put("rhythm.sixteenths", sum(1 for n in notes if n["type"] == "16th" and n["tuplet"] is None))
    put("rhythm.dotted-quarter", sum(1 for n in notes if n["type"] == "quarter" and n["dots"] == 1 and n["tuplet"] is None and not compound(b0, bt0)))
    put("rhythm.ties", sum(1 for n in notes if n["tie_start"] or n["tie_stop"]))
    put("rhythm.triplets", sum(1 for n in notes if n["tuplet"] == 3))
    put("metre.compound", sum(1 for t in times if compound(*map(int, re.findall(r"\d+", t)[:2]))) if times else 0)
    put("metre.three-four", sum(1 for t in times if t == "3/4"))
    put("metre.odd", sum(1 for t in times if re.match(r"^(5|7)/", t)))
    first_fifths = f["keys"][0][0] if f["keys"] else 0
    put("key.signature", sum(1 for n in notes if key_alter(n["letter"], n["fifths"]) != 0), present=first_fifths != 0)
    put("pitch.chromatic", sum(1 for n in notes if n["alter"] != key_alter(n["letter"], n["fifths"])))
    # syncopation (the stated rule: a note a quarter or longer, or a tie, starting off the beat)
    beat = 1.5 if compound(b0, bt0) else 4 / bt0
    sync = 0
    for n in notes:
        into = n["in_bar"] % beat
        if into > EPS and beat - into > EPS and (n["dur"] >= 1 - EPS or n["tie_start"]):
            sync += 1
    melody = [n for n in notes if n["hand"] == "R"] or notes
    starts = {}
    for n in melody:
        starts.setdefault(n["bar"], n["onset"] - n["in_bar"])
    for bar in range(f["bars"]):
        inb = [n for n in melody if n["bar"] == bar]
        if not inb:
            continue
        first = min(n["in_bar"] for n in inb)
        bar_start = inb[0]["onset"] - inb[0]["in_bar"]
        held = any(n["onset"] < bar_start - EPS and n["onset"] + n["dur"] > bar_start + EPS for n in melody)
        if first > EPS and not held:
            sync += 1
    put("rhythm.syncopation", sync)
    # hands
    by_hand = collections.defaultdict(list)
    for n in notes:
        by_hand[n["hand"]].append(n)
    spans = {h: (max(x["midi"] for x in v) - min(x["midi"] for x in v)) if v else 0 for h, v in by_hand.items()}
    put("range.beyond-position", sum(1 for h in spans if spans[h] > 7))
    together = 0
    R, L = by_hand.get("R", []), by_hand.get("L", [])
    r_spans = [(n["onset"], n["onset"] + n["dur"]) for n in R]
    l_spans = [(n["onset"], n["onset"] + n["dur"]) for n in L]
    for n in L:
        if any(a <= n["onset"] + EPS and b > n["onset"] + EPS for a, b in r_spans):
            together += 1
    present_together = together > 0 or any(any(a <= n["onset"] + EPS and b > n["onset"] + EPS for a, b in l_spans) for n in R)
    put("texture.hands-together", together, present=present_together)
    bars = f["bars"]
    def lh_onsets(bar):
        return {n["in_bar"] for n in L if n["bar"] == bar}
    def rh_plays(bar):
        return any(n["bar"] == bar for n in R)
    put("texture.left-hand-pattern", int(bars > 0 and all(len(lh_onsets(b)) > 1 and rh_plays(b) for b in range(bars))))
    def walks(bar):
        lowest = {}
        for n in L:
            if n["bar"] == bar and (n["in_bar"] not in lowest or n["midi"] < lowest[n["in_bar"]]["midi"]):
                lowest[n["in_bar"]] = n
        seq = [lowest[o] for o in sorted(lowest)]
        bb, _ = metre_of(times, bar, {})
        if len(seq) != bb or any(abs(x["dur"] - 1) > EPS for x in seq):
            return False
        pitches = [x["midi"] for x in seq]
        return not any(p in pitches[:i - 1] for i, p in enumerate(pitches) if i >= 2)
    put("texture.walking-bass", int(bars > 0 and all(walks(b) and rh_plays(b) for b in range(bars))))
    def cell_bars(cell):
        hits = 0
        for bar in range(bars):
            bb, bt = metre_of(times, bar, {})
            if (bb, bt) not in ((2, 4), (4, 4), (2, 2)):
                continue
            length = f["bar_len"][bar] if bar < len(f["bar_len"]) else 0
            full = bb * 4 / bt
            if length < full - EPS:
                continue
            ons = sorted({round(n["in_bar"] / full, 6) for n in L if n["bar"] == bar})
            if len(ons) == len(cell) and all(abs(a - b) < 1e-4 for a, b in zip(ons, cell)):
                hits += len(cell)
        return hits
    put("rhythm.habanera", cell_bars([0, 3 / 8, 1 / 2, 3 / 4]))
    put("rhythm.tresillo", cell_bars([0, 3 / 8, 3 / 4]))
    # per bar per hand range, for hands.per-bar-range
    per_bar = collections.defaultdict(lambda: [999, -1])
    for n in notes:
        k = f"{n['hand']}{n['bar']}"
        per_bar[k][0] = min(per_bar[k][0], n["midi"])
        per_bar[k][1] = max(per_bar[k][1], n["midi"])
    w["_per_bar_range"] = dict(per_bar)
    # difficulty witnesses: largest simultaneous reach per hand, largest leap per hand, crossings
    reach = {"R": 0, "L": 0}
    for h, v in by_hand.items():
        at = collections.defaultdict(list)
        for n in v:
            at[n["onset"]].append(n["midi"])
        reach[h] = max((max(x) - min(x) for x in at.values()), default=0)
    w["_reach"] = reach
    w["_leap_max"] = leap_max
    w["_notes"] = len(notes)
    w["_quarters"] = sum(f["bar_len"])
    return w


def tonic_pc(name: str) -> int | None:
    m = re.match(r"^([A-Ga-g])(#|-|b)?", name)
    if not m:
        return None
    acc = m.group(2) or ""
    return (STEP_PC[m.group(1).upper()] + (1 if acc == "#" else -1 if acc in ("-", "b") else 0)) % 12


def music21_features(path: Path) -> dict | None:
    sys.path.insert(0, str(ROOT / "tools/content"))
    try:
        import difficulty  # noqa: PLC0415
        from music21 import converter  # noqa: PLC0415
        return difficulty.features(converter.parse(str(path)))
    except Exception as e:  # noqa: BLE001 - recorded, never hidden
        return {"_error": f"{type(e).__name__}: {e}"[:200]}


def extract(limit: int | None, with_features: bool) -> int:
    items = json.loads(CATALOG.read_text(encoding="utf-8"))
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    todo = [i for i in items if i.get("file")]
    if limit:
        todo = todo[:limit]
    t0 = time.time()
    for k, it in enumerate(todo):
        path = CONTENT / it["file"]
        digest = sha(path)
        row = cache.get(it["id"]) or {}
        out = {"sha": digest}
        if row.get("sha") == digest and "features" in row:
            out["features"] = row["features"]
        try:
            raw = read_raw(path, it.get("hands"))
            out["facts"] = {k2: v for k2, v in raw["facts"].items()}
            out["witness"] = witness(raw)
        except Exception as e:  # noqa: BLE001
            out["error"] = f"{type(e).__name__}: {e}"[:200]
        if with_features and "features" not in out:
            out["features"] = music21_features(path)
        cache[it["id"]] = out
        if (k + 1) % 100 == 0:
            CACHE.parent.mkdir(parents=True, exist_ok=True)
            CACHE.write_text(json.dumps(cache), encoding="utf-8")
            print(f"{k + 1}/{len(todo)} in {time.time() - t0:.0f}s", flush=True)
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(cache), encoding="utf-8")
    print(f"done {len(todo)} in {time.time() - t0:.0f}s; errors {sum(1 for v in cache.values() if 'error' in v)}")
    return 0


# ----------------------------------------------------------------------------------- the three proofs
def found(path: Path, pattern: str) -> list[str]:
    text = path.read_text(encoding="utf-8")
    return [f"{path.relative_to(ROOT).as_posix()}:{text[:m.start()].count(chr(10)) + 1}" for m in re.finditer(pattern, text)]


def age(path: Path) -> str:
    if not path.exists():
        return "absent"
    return dt.datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")


DEMAND_ROWS = ["clef.bass", "pitch.ledger", "interval.step", "interval.skip", "interval.leap", "rhythm.eighths",
               "rhythm.shorter-than-quarter", "rhythm.sixteenths", "rhythm.dotted-quarter", "rhythm.ties",
               "rhythm.syncopation", "rhythm.triplets", "metre.compound", "metre.three-four", "key.signature",
               "pitch.chromatic", "range.beyond-position", "texture.hands-together", "texture.left-hand-pattern",
               "texture.walking-bass", "rhythm.habanera", "rhythm.tresillo"]
FEATURE_ROWS = {"technique.velocity": "notesPerSecond", "technique.span": "maxSpanRight", "technique.leap-size": "maxLeapRight",
                "technique.hand-crossing": "handCrossings", "difficulty.features": None, "difficulty.tempo": "notesPerSecond"}


def report() -> int:
    before = sha(CHARS)
    import yaml  # noqa: PLC0415
    chars = yaml.safe_load(CHARS.read_text(encoding="utf-8"))
    items = json.loads(CATALOG.read_text(encoding="utf-8"))
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    by_id = {i["id"]: i for i in items}
    pdmx = [i for i in items if i["source"]["name"].startswith("PDMX")]
    generated = [i for i in items if i["source"]["name"].startswith("PianoPath generator")]
    notated = [i for i in items if i.get("file")]
    measured = [i for i in items if i["measurement"].get("status") == "measured"]
    pops = {"both": notated, "pdmx": pdmx, "generated": generated}
    build_calls = lambda pat: found(BUILD_PY, pat)  # noqa: E731
    results = {}

    def pop(rows, has):
        present = [i["id"] for i in rows if has(i)]
        missing = [i["id"] for i in rows if not has(i)]
        return {"expected": len(rows), "present": len(present), "missing": missing}

    def compare(cid, stored_present, stored_count=None):
        agree = disagree_present = 0
        bad, ratios = [], []
        no_witness = []
        for i in measured:
            c = cache.get(i["id"], {})
            wv = (c.get("witness") or {}).get(cid)
            if wv is None:
                no_witness.append(i["id"])
                continue
            sp = stored_present(i)
            if sp == wv["present"]:
                agree += 1
            else:
                disagree_present += 1
                bad.append({"id": i["id"], "stored": sp, "witness": wv["present"],
                            "stored_count": stored_count(i) if stored_count else None, "witness_count": wv["count"]})
            if stored_count and wv["count"]:
                ratios.append(stored_count(i) / wv["count"])
        ratios.sort()
        q = (lambda p: round(ratios[int(p * (len(ratios) - 1))], 3)) if ratios else (lambda p: None)
        return {"compared": agree + disagree_present, "agree": agree, "disagree": disagree_present,
                "disagreeing": bad, "no_witness": no_witness,
                "count_ratio_stored_over_witness": {"n": len(ratios), "p10": q(0.1), "median": q(0.5), "p90": q(0.9)} if stored_count else None}

    for cid, v in chars.items():
        if v["status"] != "EXISTS":
            continue
        r = {"pipe": v["pipe"], "evidence": v["evidence"], "decision": v["decision"], "code": v["code"]}
        if cid in DEMAND_ROWS:
            r["runs"] = {"call_sites": build_calls(r"attach_demands\("), "artefact": f"catalog.json measurement (built {age(CATALOG)})"}
            r["population"] = pop(notated, lambda i: i["measurement"].get("status") == "measured")
            same_unit = cid not in ("metre.compound", "metre.three-four", "range.beyond-position", "texture.hands-together",
                                    "texture.left-hand-pattern", "texture.walking-bass", "key.signature")
            r["meaning"] = compare(cid, lambda i, c=cid: c in (i.get("demands") or []),
                                   (lambda i, c=cid: (i["measurement"].get("located") or {}).get(c, 0)) if same_unit else None)
            if not same_unit:
                r["meaning"]["counts"] = "not compared: the detector locates notes, the witness counts a different unit; presence is the test"
            r["meaning"]["witness"] = "raw MusicXML, printed notes, repeats not unrolled; clef from the clef element, not the staff number"
        elif cid.startswith("notation.") or cid in ("metre.odd", "form.length"):
            r["runs"] = {"call_sites": build_calls(r"attach_notation\("), "artefact": f"catalog.json notation (built {age(CATALOG)})"}
            r["population"] = pop(notated, lambda i: bool(i.get("notation")))
            pick = {
                "notation.keys": (lambda i: [k["fifths"] for k in i["notation"]["keys"]], lambda f: [k[0] for k in f["keys"]]),
                "notation.times": (lambda i: i["notation"]["times"], lambda f: f["times"]),
                "notation.staves": (lambda i: i["notation"]["staves"], lambda f: f["staves"]),
                "notation.bars": (lambda i: i["notation"]["bars"], lambda f: f["bars"]),
                "form.length": (lambda i: i["notation"]["bars"], lambda f: f["bars"]),
                "notation.chord-symbols": (lambda i: i["notation"]["chordCount"], lambda f: f["harmony"]),
                "notation.swing-mark": (lambda i: i["notation"]["swungMark"], lambda f: f["swing"]),
                "metre.odd": (lambda i: any(re.match(r"^(5|7)/", t) for t in i["notation"]["times"]), lambda f: any(re.match(r"^(5|7)/", t) for t in f["times"])),
            }[cid]
            agree, bad = 0, []
            for i in notated:
                c = cache.get(i["id"], {})
                if not i.get("notation") or "facts" not in c:
                    continue
                a, b = pick[0](i), pick[1](c["facts"])
                if cid == "notation.keys":
                    a, b = list(dict.fromkeys(a)), list(dict.fromkeys(b))
                    a2 = a
                if cid == "notation.times":
                    a, b = list(dict.fromkeys(a)), list(dict.fromkeys(b))
                if a == b:
                    agree += 1
                else:
                    bad.append({"id": i["id"], "stored": a, "witness": b})
            r["meaning"] = {"compared": agree + len(bad), "agree": agree, "disagree": len(bad), "disagreeing": bad,
                            "witness": "raw MusicXML of the first part (keys, times, measures), all <harmony>, <staves>, <swing> or swing words"}
        elif cid == "mark.tempo-text":
            r["runs"] = {"call_sites": build_calls(r"attach_demands\(") + ["(the bridge reads extractScoreModel, which reads tempoFromXml: inferred from demands.py DEFINITION_FILES)"],
                         "artefact": "catalog tempoBpm and tag tempo-defaulted"}
            r["population"] = pop(notated, lambda i: i.get("tempoBpm") is not None)
            agree, bad, default_in_file = 0, [], []
            for i in notated:
                c = cache.get(i["id"], {})
                if "facts" not in c:
                    continue
                written = c["facts"]["tempo"] is not None
                defaulted = "tempo-defaulted" in (i.get("tags") or [])
                stored = i.get("tempoBpm")
                ok = (not written and (defaulted or stored is None)) or (written and stored is not None and not defaulted and abs(stored - c["facts"]["tempo"]) < 0.51)
                if defaulted and written:
                    default_in_file.append(i["id"])
                    continue
                if ok:
                    agree += 1
                else:
                    bad.append({"id": i["id"], "tempoBpm": stored, "defaulted_tag": defaulted, "file_tempo": c["facts"]["tempo"]})
            r["meaning"] = {"compared": agree + len(bad), "agree": agree, "disagree": len(bad), "disagreeing": bad,
                            "tagged_default_but_written_in_file": default_in_file,
                            "witness": "the file's first <sound tempo> or <metronome><per-minute> (a quarter-note mark is assumed). A tempo the converter defaulted is written into the file, so the file cannot witness those items; they are counted apart, untested"}
        elif cid == "hands.per-bar-range":
            r["runs"] = {"call_sites": build_calls(r"attach_demands\("), "artefact": f"build/positions-cache.json (built {age(POSITIONS)})"}
            pc = json.loads(POSITIONS.read_text(encoding="utf-8")) if POSITIONS.exists() else {}
            r["population"] = {"expected": len(measured), "present": "untested", "missing": "the cache is keyed by file bytes and fingerprint, not by item id; per-item presence needs a reader of its own"}
            r["meaning"] = {"compared": 0, "agree": 0, "disagree": 0, "disagreeing": [],
                            "witness": "not compared in this run: the cache's key and bar numbering (printed bars, pickup as bar 1) need a reader of their own; recorded as untested"}
        elif cid in FEATURE_ROWS:
            sites = build_calls(r"difficulty\.features\(|import difficulty")
            r["runs"] = {"call_sites": sites, "outside_build": found(ROOT / "tools/content/excerpts.py", r"difficulty\.features\(") + found(ROOT / "tools/content/import_mutopia.py", r"difficulty\.features\(") + found(ROOT / "tools/content/fit_level_model.py", r"difficulty\.features\("),
                         "artefact": "none on the catalogue: features are not stored; build.py has no call site (empty list above means none found by pattern)"}
            r["population"] = {"expected": len(notated), "present": 0, "missing": "no catalogue field holds the features"}
            feat = FEATURE_ROWS[cid]
            if feat in ("maxSpanRight", "maxLeapRight", "handCrossings", "notesPerSecond"):
                bad, agree, compared, errors = [], 0, 0, 0
                for i in notated:
                    c = cache.get(i["id"], {})
                    fv, wv = c.get("features"), c.get("witness")
                    if not fv or not wv:
                        continue
                    if "_error" in fv:
                        errors += 1
                        continue
                    compared += 1
                    if feat == "maxSpanRight":
                        pairs = [("maxSpanRight", fv.get("maxSpanRight"), wv["_reach"].get("R", 0)), ("maxSpanLeft", fv.get("maxSpanLeft"), wv["_reach"].get("L", 0))]
                    elif feat == "maxLeapRight":
                        pairs = [("maxLeapRight", fv.get("maxLeapRight"), wv["_leap_max"].get("R", 0)), ("maxLeapLeft", fv.get("maxLeapLeft"), wv["_leap_max"].get("L", 0))]
                    elif feat == "notesPerSecond":
                        tempo = (c.get("facts") or {}).get("tempo") or i.get("tempoBpm") or 100
                        secs = wv["_quarters"] * 60 / tempo if wv["_quarters"] else 0
                        pairs = [("notesPerSecond", fv.get("notesPerSecond"), round(wv["_notes"] / secs, 3) if secs else 0)]
                    else:
                        pairs = None
                    if pairs is None:
                        compared -= 1
                        continue
                    ok = all(a is not None and abs(float(a) - float(b)) <= max(0.5, 0.15 * abs(float(b))) for _, a, b in pairs)
                    if ok:
                        agree += 1
                    else:
                        bad.append({"id": i["id"], "pairs": pairs})
                r["meaning"] = {"compared": compared, "agree": agree, **({"untested": "no independent witness written for handCrossings in this run"} if feat == "handCrossings" else {}), "disagree": len(bad), "disagreeing": bad, "features_errors": errors,
                                "witness": {"maxSpanRight": "largest pitch distance among notes one hand starts together (raw MusicXML), semitones",
                                            "maxLeapRight": "largest semitone distance between successive top notes of one line per hand",
                                            "notesPerSecond": "printed notes / (printed quarters x 60 / the file's tempo); repeats not unrolled",
                                            "handCrossings": "no independent witness written in this run"}.get(feat, ""),
                                "tolerance": "abs diff <= max(0.5, 15%)"}
            else:
                r["meaning"] = {"compared": 0, "witness": "not a single claim (difficulty.features is all 19); see the four feature rows"}
        elif cid == "target.prevalence":
            dens = json.loads(DENSITY.read_text(encoding="utf-8"))["demands"]
            r["runs"] = {"call_sites": build_calls(r"established_by_density\(|attach_demands\("), "artefact": "catalog measurement.established"}
            r["population"] = pop(measured, lambda i: "established" in i["measurement"])
            agree, bad = 0, []
            for i in measured:
                if i["source"]["name"].startswith("PianoPath generator"):
                    continue  # generated items are established by their family contract, not the density table
                m = i["measurement"]
                misread = set((m.get("misread") or {}).get("demands", []))
                window = i["type"] == "excerpt"

                def holds(d, rule, m=m, window=window):
                    n = m.get("located", {}).get(d, 0)
                    if n <= 0 or not m.get("bars"):
                        return False
                    floor = rule.get("minInWindow", 2) if window else rule["min"]
                    return n >= floor and n / max(m["bars"], 1) >= rule.get("perBar", 0)
                mine = sorted(d for d, rule in dens.items() if "min" in rule and d not in misread and holds(d, rule))
                stored = sorted(d for d in m.get("established", []) if d in dens and "min" in dens[d] and d not in (m.get("contract") or []))
                if mine == stored:
                    agree += 1
                else:
                    bad.append({"id": i["id"], "stored": stored, "recomputed": mine})
            r["meaning"] = {"compared": agree + len(bad), "agree": agree, "disagree": len(bad), "disagreeing": bad,
                            "witness": "the density table reapplied to the stored located counts and bars (min, or minInWindow for an excerpt; perBar) with the build's clef-misread exclusion, notated non-generated items: the same arithmetic as the code, so a consistency check, not an independent witness; the thresholds are unsourced"}
        elif cid == "prereq.untaught-demands":
            r["runs"] = {"call_sites": build_calls(r"rung_claims\("), "artefact": f"docs/prompts/rung-claims.md (written {age(RUNG_CLAIMS)})"}
            r["population"] = {"expected": "every rung option", "present": "see rung-claims.md", "missing": "not resolved per item in this run"}
            r["meaning"] = {"compared": 0, "witness": "not tested in this run: needs an independent reader of rung ancestry and taughtAt; recorded as untested"}
        elif cid == "prereq.taught-set-generated":
            r["runs"] = {"call_sites": build_calls(r"pedagogical_faults\("), "artefact": "the build fails on a fault (no artefact)"}
            r["population"] = pop(generated, lambda i: bool(i.get("drill")))
            r["meaning"] = {"compared": 0, "witness": "not tested in this run: the family contracts' requires/forbids need a reader of their own"}
        elif cid in ("generated.spec-declared", "meta.generator-params"):
            r["runs"] = {"call_sites": ["catalogue rows written by the generator (generate_exercises.py) and carried by build.py"], "artefact": "catalog drill"}
            r["population"] = pop(generated, lambda i: bool((i.get("drill") or {}).get("params")))
            agree, bad, compared = 0, [], 0
            for i in generated:
                p = (i.get("drill") or {}).get("params") or {}
                c = cache.get(i["id"], {})
                if "facts" not in c:
                    continue
                checks = []
                if p.get("timeSig"):
                    checks.append(("timeSig", p["timeSig"], (c["facts"]["times"] or [None])[0]))
                if p.get("key"):
                    letter = p["key"].replace("-", "b").replace("#", "#")
                    checks.append(("key", p["key"], (c["facts"]["keys"] or [[None]])[0]))
                if not checks:
                    continue
                compared += 1
                ok = True
                for name, want, got in checks:
                    if name == "timeSig" and want != got:
                        ok = False
                    if name == "key" and got[0] is not None:
                        want_pc = tonic_pc(p["key"])
                        got_pc = ((got[0] * 7) % 12 + (9 if (got[1] or "major") == "minor" else 0)) % 12
                        if want_pc is None or want_pc != got_pc:
                            ok = False
                if ok:
                    agree += 1
                else:
                    bad.append({"id": i["id"], "params": {k: p.get(k) for k in ("key", "mode", "quality", "timeSig")}, "file_key": (c["facts"]["keys"] or [None])[0], "file_time": (c["facts"]["times"] or [None])[0]})
            r["meaning"] = {"compared": compared, "agree": agree, "disagree": len(bad), "disagreeing": bad,
                            "witness": "the generator's declared key (with mode) and metre against the file's first key signature and time signature (raw MusicXML)"}
        elif cid == "generated.identity":
            r["runs"] = {"call_sites": build_calls(r"music_digest|former_generator_identities|identity\("), "artefact": "catalog provenance"}
            r["population"] = pop(generated, lambda i: bool((i.get("provenance") or {})))
            r["meaning"] = {"compared": 0, "witness": "not tested in this run: same recipe, same bytes needs a regeneration"}
        elif cid.startswith("integrity.") and cid != "integrity.render":
            sc = json.loads(SCORE_CHECKS.read_text(encoding="utf-8")) if SCORE_CHECKS.exists() else {}
            name = {"integrity.bar-duration": "bar", "integrity.truncation": "trunc", "integrity.repeat-structure": "repeat",
                    "integrity.title-structure": "title", "integrity.grace-density": "grace"}[cid]
            ran = [c for c in sc.get("checksRun", []) if name in str(c).lower()]
            r["runs"] = {"call_sites": build_calls(r"step_score_checks\(|score_checks\.py"), "artefact": f"build/score-checks.json (written {age(SCORE_CHECKS)}); checksRun matching: {ran}"}
            r["population"] = {"expected": len(notated), "present": sc.get("itemsRead"), "missing": sc.get("unreadable")}
            flags = [f for f in sc.get("flags", []) if name in json.dumps(f).lower()]
            r["meaning"] = {"compared": 0, "flags_of_this_check": len(flags), "witness": "not tested against an independent witness in this run"}
            if cid == "integrity.grace-density":
                short = [i["id"] for i in notated if (cache.get(i["id"], {}).get("facts") or {}).get("graces_short", 0) > 0]
                flagged = {f.get("id") for f in flags}
                r["meaning"].update({"witness": "items with a sixteenth-or-shorter grace note (raw MusicXML) against the check's flags",
                                     "items_with_short_graces": len(short), "of_them_flagged": len([x for x in short if x in flagged])})
        elif cid == "integrity.render":
            rr = json.loads(RENDER.read_text(encoding="utf-8")) if RENDER.exists() else {}
            r["runs"] = {"call_sites": found(CI_YML, r"render_check\.py"), "artefact": f"build/render-report.json (written {age(RENDER)}; the local copy, not CI's)"}
            r["population"] = {"expected": len(notated), "present": len(rr.get("items", rr)) if isinstance(rr, (dict, list)) else None, "missing": "the local report predates the catalogue"}
            r["meaning"] = {"compared": 0, "witness": "not tested in this run"}
        elif cid in ("meta.composer-era", "meta.genre-tags", "meta.collection"):
            field = {"meta.composer-era": "compositionStatus", "meta.genre-tags": "genre", "meta.collection": "source"}[cid]
            popn = pdmx if v["pipe"] == "pdmx" else items
            r["runs"] = {"call_sites": ["catalogue field written by the importers"], "artefact": f"catalog {field}"}
            r["population"] = pop(popn, lambda i, f=field: bool(i.get(f)))
            r["meaning"] = {"compared": 0, "witness": "metadata: no independent witness in the notes"}
        else:
            r["runs"] = r["population"] = r["meaning"] = "NO PROBE written for this row"
        results[cid] = r

    after = sha(CHARS)
    if after != before:
        print("characteristics.yaml changed during the run", file=sys.stderr)
        return 1
    day = dt.date.today().isoformat()
    out = ROOT / "docs/classifier/proving" / day
    out.mkdir(parents=True, exist_ok=True)
    meta = {"characteristics_sha256": before, "catalog_sha256": sha(CATALOG), "catalog_built": age(CATALOG),
            "witness_cache_items": len(cache), "witness_errors": sorted(k for k, v in cache.items() if "error" in v),
            "rows_claimed_exists": len(results)}
    (out / "results.json").write_text(json.dumps({"meta": meta, "rows": results}, indent=1, ensure_ascii=False), encoding="utf-8", newline="\n")
    lines = [f"# Proving run, {day}: the rows the characteristics table claims EXISTS", "",
             "Generated by `tools/classifier/prove_exists.py report`; do not edit. Evidence only: nothing in the table was",
             "changed by this run (characteristics.yaml hash checked before and after). Every disagreeing id is in `results.json`.", "",
             f"- Table: `{before[:12]}`; catalogue built {meta['catalog_built']} (`{meta['catalog_sha256'][:12]}`); witness cache {meta['witness_cache_items']} items, {len(meta['witness_errors'])} unreadable.",
             f"- Rows claimed EXISTS: {len(results)}.", "",
             "| Row | Runs in the build (call sites) | Population present / expected | Meaning: agree / compared (witness) |",
             "| --- | --- | --- | --- |"]
    for cid, r in results.items():
        if isinstance(r["runs"], str):
            lines.append(f"| `{cid}` | {r['runs']} | | |")
            continue
        sites = r["runs"].get("call_sites") or []
        runs = (", ".join(sites[:2]) + (" …" if len(sites) > 2 else "")) if sites else "**no call site found**"
        p = r["population"]
        popt = f"{p['present']} / {p['expected']}" if isinstance(p.get("present"), int) else f"{p.get('present')} ({p.get('missing')})"
        m = r["meaning"]
        if m.get("compared"):
            mt = f"{m['agree']} / {m['compared']}"
            if m.get("count_ratio_stored_over_witness"):
                cr = m["count_ratio_stored_over_witness"]
                mt += f"; count ratio median {cr['median']} (p10 {cr['p10']}, p90 {cr['p90']})"
        else:
            mt = "untested: " + str(m.get("witness", ""))[:90]
        lines.append(f"| `{cid}` | {runs} | {popt} | {mt} |")
    lines += ["", "Untested meanings are listed as untested, not as passes. Disagreements are evidence for review, not verdicts on the detector or the table.", ""]
    (out / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {out.relative_to(ROOT).as_posix()}: {len(results)} rows")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("extract")
    e.add_argument("--limit", type=int)
    e.add_argument("--no-features", action="store_true")
    sub.add_parser("report")
    a = ap.parse_args()
    return extract(a.limit, not a.no_features) if a.cmd == "extract" else report()


if __name__ == "__main__":
    sys.exit(main())
