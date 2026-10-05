"""
Mechanical PDMX quarry driven by docs/review/pdmx-quarry-2026-10-05/lanes.json.

No musical or pedagogical judgement. Stages (each cached under build/quarry-cache/):
  1 csv      one pass over PDMX.csv, hits for every lane
  2 extract  one tar stream for every candidate not already unpacked in the library
  3 shape    technical shape read from the MusicXML
  4 rank+dump+write
Run:  python quarry_lanes.py [--redo-csv] [--redo-shape]
"""
from __future__ import annotations

import csv
import importlib.util
import io
import json
import re
import statistics
import sys
import tarfile
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
ROOT = Path(r"C:\Users\yalir\repos\Piano Stuff")
CSV_PATH = ROOT / "PDMX.csv"
TAR_PATH = ROOT / "mxl.tar.gz"
LIB = ROOT / "PianoProject" / "build" / "pdmx" / "library"
OUT = REPO / "docs" / "review" / "pdmx-quarry-2026-10-05"
CACHE = REPO / "build" / "quarry-cache"
LANES = json.loads((OUT / "lanes.json").read_text(encoding="utf-8"))["lanes"]
csv.field_size_limit(10**9)
sys.path.insert(0, str(HERE))
from summarise_xml import summarise  # noqa: E402

MAX_DUMP_BYTES = 3 * 1024 * 1024
FOLDER_BUDGET = 78 * 1024 * 1024
PER_TERM_CANDIDATES = 15
PER_ARTIST_CANDIDATES = 40
BAYES_M = 10


# ---------------------------------------------------------------- text helpers
def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"['’‘`´]", "", s)  # apostrophes join, so "don't" == "dont"
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", s)).strip()


def padded(s: str) -> str:
    n = norm(s)
    return f" {n} " if n else ""


def has_seq(hay_padded: str, term: str) -> bool:
    """Contiguous whole-token sequence."""
    t = norm(term)
    return bool(t) and bool(hay_padded) and f" {t} " in hay_padded


def strip_brackets(s: str) -> str:
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r"\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\}", " ", s)
    return s


def title_variants(s: str) -> set[str]:
    """Normalised forms a title can take once brackets and an Artist segment are removed."""
    if not s or s == "NA":
        return set()
    s = strip_brackets(s)
    out = {norm(s)}
    segs = [norm(x) for x in re.split(r"\s+-\s+|\s+–\s+|\s+—\s+", s)]
    if len(segs) > 1:
        out.update(x for x in segs if x)
    return {x for x in out if x}


def cid_of(row) -> str:
    return row["path"].rsplit("/", 1)[1][:-5]


def programs(row) -> list[int]:
    t = row["tracks"]
    try:
        return [int(x) for x in t.split("-")] if t and t != "NA" else []
    except ValueError:
        return []


def piano_only(row) -> bool:
    p = programs(row)
    return bool(p) and all(0 <= x <= 7 for x in p)


def fnum(x, default=0.0):
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def slugify(s: str, n=40) -> str:
    return re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")[:n].strip("-") or "untitled"


def na(v):
    return "" if v in (None, "NA") else v


def brief(row) -> dict:
    return {
        "cid": cid_of(row), "title": na(row["title"]), "song_name": na(row["song_name"]),
        "subtitle": na(row["subtitle"]), "composer": na(row["composer_name"]),
        "artist": na(row["artist_name"]), "programs": row["tracks"], "n_tracks": row["n_tracks"],
        "piano_only_csv": piano_only(row), "csv_bars": int(fnum(row["song_length.bars"])),
        "rating": fnum(row["rating"]), "n_ratings": int(fnum(row["n_ratings"])),
        "n_views": int(fnum(row["n_views"])), "n_favorites": int(fnum(row["n_favorites"])),
        "licence": row["license"], "mxl": row["mxl"], "valid_mxl_pdf": row["subset:valid_mxl_pdf"],
    }


# ---------------------------------------------------------------- lane prep
def prep_lanes():
    for lane in LANES:
        exact_only = {norm(t) for t in lane.get("exact_title_only_for", []) + lane.get("extra_exact_titles", [])}
        terms = list(lane.get("terms", []))
        for t in lane.get("extra_exact_titles", []):
            if t not in terms:
                terms.append(t)
        lane["_terms"] = [(t, norm(t), norm(t) in exact_only) for t in terms]
        al = lane.get("artist_aliases", {})
        lane["_artists"] = [(a, [norm(x) for x in al.get(a, [a])]) for a in lane.get("artists", [])]


def expected_title(label: str) -> str:
    s = strip_brackets(label)
    s = s.split(" - ")[0]
    s = norm(s)
    return re.sub(r"\bst\b", "saint", s)


def verdict_for(expected: str, row) -> str:
    e = expected_title(expected)
    for f in ("title", "song_name"):
        v = row[f]
        if not v or v == "NA":
            continue
        t = re.sub(r"\bst\b", "saint", norm(v))
        if t and (e in t or t in e):
            return "MATCH"
    return "MISMATCH"


# ---------------------------------------------------------------- stage 1
def stage_csv(redo: bool):
    f = CACHE / "csv_hits.json"
    if f.exists() and not redo:
        return json.loads(f.read_text(encoding="utf-8"))
    known = {}
    for lane in LANES:
        for label, c in lane.get("known", []):
            known.setdefault(c, None)
    term_hits = {l["id"]: {} for l in LANES}      # lane -> cid -> {row, terms[], exact[]}
    artist_hits = {}                              # artist -> cid -> {row}
    known_rows = {}
    ratings = []
    all_artist_aliases = {a: al for l in LANES for a, al in l["_artists"]}
    n = 0
    with open(CSV_PATH, encoding="utf-8", errors="replace", newline="") as fh:
        for row in csv.DictReader(fh):
            n += 1
            c = cid_of(row)
            if c in known:
                known_rows[c] = brief(row)
            if fnum(row["n_ratings"]) > 0:
                ratings.append(fnum(row["rating"]))
            fields = {k: padded(row[k]) for k in ("song_name", "title", "subtitle", "artist_name", "composer_name")}
            tv = title_variants(row["song_name"]) | title_variants(row["title"])
            for lane in LANES:
                for term, nt, exact_only in lane["_terms"]:
                    exact = nt in tv
                    if exact_only:
                        ok = exact
                    else:
                        ok = exact or any(f" {nt} " in v for v in fields.values() if v)
                    if ok:
                        d = term_hits[lane["id"]].setdefault(c, {"row": None, "terms": [], "exact": []})
                        if d["row"] is None:
                            d["row"] = brief(row)
                        d["terms"].append(term)
                        if exact:
                            d["exact"].append(term)
            segs = set()
            for k in ("title", "song_name"):
                if row[k] and row[k] != "NA":
                    segs.update(norm(x) for x in re.split(r"\s+-\s+", row[k]))
            for a, al in all_artist_aliases.items():
                hit = any(
                    (x in fields["artist_name"] if fields["artist_name"] else False)
                    or (x in fields["composer_name"] if fields["composer_name"] else False)
                    for x in (f" {y} " for y in al)
                ) or any(y in segs for y in al)
                if hit:
                    d = artist_hits.setdefault(a, {}).setdefault(c, {"row": brief(row)})
    data = {
        "n_rows": n,
        "archive_mean_rating": statistics.mean(ratings) if ratings else 4.0,
        "known_rows": known_rows,
        "term_hits": term_hits,
        "artist_hits": {a: list(v.values()) for a, v in artist_hits.items()},
    }
    # term_hits: dicts keyed by cid -> list form
    data["term_hits"] = {k: {c: v for c, v in d.items()} for k, d in term_hits.items()}
    CACHE.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(data), encoding="utf-8")
    return data


# ---------------------------------------------------------------- stage 2/3
def mxl_inner_xml(data: bytes) -> bytes:
    if data[:2] != b"PK":
        return data
    zf = zipfile.ZipFile(io.BytesIO(data))
    inner = None
    if "META-INF/container.xml" in zf.namelist():
        cont = ET.fromstring(zf.read("META-INF/container.xml"))
        for el in cont.iter():
            if el.tag.endswith("rootfile"):
                inner = el.get("full-path")
                break
    if not inner:
        inner = next(n for n in zf.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META-INF"))
    return zf.read(inner)


def lib_path(c: str) -> Path | None:
    for sub in (c[2:4], c[2:4].lower(), c[:2]):
        p = LIB / sub / f"{c}.mxl"
        if p.exists():
            return p
    return None


def stage_extract(cands: dict[str, str]):
    """cands: cid -> mxl path from CSV. Returns cid -> cache file path (.mxl)."""
    raw = CACHE / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    have = {}
    need = {}
    for c, mxl in cands.items():
        cached = raw / f"{c}.mxl"
        if cached.exists():
            have[c] = cached
            continue
        lp = lib_path(c)
        if lp:
            have[c] = lp
        else:
            need[mxl.lstrip("./")] = c
    print(f"extract: have {len(have)}, need tar stream for {len(need)}", flush=True)
    missing = []
    if need:
        want = dict(need)
        with tarfile.open(TAR_PATH, "r|gz") as tf:
            for mem in tf:
                if mem.name in want:
                    c = want.pop(mem.name)
                    p = raw / f"{c}.mxl"
                    p.write_bytes(tf.extractfile(mem).read())
                    have[c] = p
                    if not want:
                        break
        missing = list(want.values())
    return have, missing


def read_xml(path: Path) -> bytes:
    return mxl_inner_xml(path.read_bytes())


def analyse(xml: bytes, csv_programs: list[int]) -> dict:
    root = ET.fromstring(xml)
    for el in root.iter():
        if isinstance(el.tag, str) and "}" in el.tag:
            el.tag = el.tag.split("}", 1)[1]
    prog = {}
    for sp in root.iter("score-part"):
        mp = sp.find(".//midi-program")
        prog[sp.get("id")] = int(mp.text) - 1 if mp is not None and (mp.text or "").strip().isdigit() else None
    parts = []
    meters, tempo, key = [], [], None
    harmony = 0
    for p in root.findall("part"):
        pid = p.get("id")
        measures = p.findall("measure")
        staves = 1
        for a in p.iter("attributes"):
            s = a.findtext("staves")
            if s and s.strip().isdigit():
                staves = max(staves, int(s))
            for t in a.findall("time"):
                m = f"{t.findtext('beats')}/{t.findtext('beat-type')}"
                if m not in meters:
                    meters.append(m)
            if key is None:
                k = a.find("key")
                if k is not None:
                    key = f"fifths={k.findtext('fifths')}" + (f" {k.findtext('mode')}" if k.findtext("mode") else "")
        h = len(p.findall(".//harmony"))
        harmony += h
        for d in p.iter("direction"):
            for w in d.iter("words"):
                tx = (w.text or "").strip()
                if tx and tx[:40] not in tempo and len(tempo) < 4:
                    tempo.append(tx[:40])
            sn = d.find("sound")
            if sn is not None and sn.get("tempo") and f"tempo={sn.get('tempo')}" not in tempo and len(tempo) < 4:
                tempo.append(f"tempo={sn.get('tempo')}")
        parts.append({"id": pid, "staves": staves, "program": prog.get(pid), "measures": len(measures), "harmony": h})
    csv_piano = bool(csv_programs) and all(0 <= x <= 7 for x in csv_programs)
    for pt in parts:
        pr = pt["program"]
        pt["piano"] = (0 <= pr <= 7) if pr is not None else csv_piano
    bars = max((pt["measures"] for pt in parts), default=0)
    total_staves = sum(pt["staves"] for pt in parts)
    all_piano = bool(parts) and all(pt["piano"] for pt in parts)
    if total_staves == 1 and harmony >= 8:
        shape = "LEADSHEET"
    elif all_piano and total_staves >= 2:
        shape = "PIANO2"
    elif all_piano:
        shape = "PIANO1"
    elif any(pt["piano"] and pt["staves"] >= 2 for pt in parts):
        shape = "MIXED_PIANO2"
    else:
        shape = "OTHER"
    return {
        "shape": shape, "n_parts": len(parts), "max_staves": max((pt["staves"] for pt in parts), default=0),
        "total_staves": total_staves, "parts": [f"{pt['id']}:staves={pt['staves']}:prog={pt['program']}" for pt in parts],
        "meters": meters, "harmony": harmony, "bars": bars, "key": key, "tempo": tempo,
    }


def stage_shape(have: dict, brows: dict, redo: bool):
    f = CACHE / "shape.json"
    cache = json.loads(f.read_text(encoding="utf-8")) if f.exists() and not redo else {}
    for i, (c, p) in enumerate(have.items()):
        if c in cache:
            continue
        try:
            xml = read_xml(p)
            progs = [int(x) for x in brows[c]["programs"].split("-")] if brows[c]["programs"] not in ("", "NA") else []
            a = analyse(xml, progs)
            a["xml_bytes"] = len(xml)
        except Exception as e:  # noqa: BLE001
            a = {"shape": "OTHER", "error": repr(e), "xml_bytes": 0, "meters": [], "harmony": 0, "bars": 0,
                 "parts": [], "n_parts": 0, "max_staves": 0, "total_staves": 0, "key": None, "tempo": []}
        cache[c] = a
        if i % 200 == 0:
            print("shape", i, len(have), flush=True)
    f.write_text(json.dumps(cache), encoding="utf-8")
    return cache


# ---------------------------------------------------------------- composition label
def make_labeller():
    try:
        sys.path.insert(0, str(HERE.parent))
        spec = importlib.util.spec_from_file_location("pdmx_composers", HERE / "composers.py")
        mod = importlib.util.module_from_spec(spec)
        sys.modules['pdmx_composers'] = mod
        spec.loader.exec_module(mod)
        table = mod.ComposerTable.load()
        cache = {}

        def label(composer: str, artist: str) -> str:
            raw = composer or artist or ""
            if raw not in cache:
                cache[raw] = table.match(raw).status
            return cache[raw]
        return label, "composers.py + composers.json"
    except Exception as e:  # noqa: BLE001
        print("composer labeller unavailable:", repr(e))
        return (lambda c, a: "unknown"), f"unavailable ({e!r}); all unknown"


# ---------------------------------------------------------------- ranking
SHAPE_SCORE = {"PIANO2": 3, "LEADSHEET": 3, "MIXED_PIANO2": 2, "PIANO1": 1, "OTHER": 0}


def bayes(r, n, mean):
    return (n * r + BAYES_M * mean) / (n + BAYES_M)


def song_key(b: dict, aliases: list[str] | None = None) -> str:
    base = b["song_name"] or b["title"]
    segs = [norm(x) for x in re.split(r"\s+-\s+", strip_brackets(base))]
    if aliases:
        segs = [s for s in segs if s and not any(s == a or f" {a} " in f" {s} " for a in aliases)] or segs
    if len(segs) > 1 and not aliases:
        # "Artist - Title": prefer the song_name column's first segment unless it equals the artist
        art = norm(b["artist"])
        segs2 = [s for s in segs if s != art]
        segs = segs2 or segs
    return segs[0] if segs else norm(base)


def rank_key(h: dict, mean: float, lane: dict):
    b = h["row"]
    sh = h.get("shape")
    inspected = sh is not None
    shape = sh["shape"] if inspected else None
    bars = sh["bars"] if inspected else b["csv_bars"]
    length_ok = 1 if 16 <= bars <= 120 else 0
    return (
        -(1 if h.get("exact") else 0),
        -(1 if inspected else 0),
        -SHAPE_SCORE.get(shape, 0),
        -(1 if inspected and sh["harmony"] > 0 else 0),
        -length_ok,
        -bayes(b["rating"], b["n_ratings"], mean),
        -b["n_views"],
        b["cid"],
    )


def pre_key(h):
    b = h["row"]
    return (-(1 if h.get("exact") else 0), -(1 if b["piano_only_csv"] else 0), -b["n_ratings"], -b["n_views"], b["cid"])


def lane_passes(lane, h):
    b = h["row"]
    sh = h.get("shape")
    if lane.get("piano_only") and not b["piano_only_csv"]:
        return False
    if lane.get("max_bars"):
        bars = sh["bars"] if sh else b["csv_bars"]
        if bars > lane["max_bars"]:
            return False
    return True


# ---------------------------------------------------------------- main
def main():
    redo_csv = "--redo-csv" in sys.argv
    redo_shape = "--redo-shape" in sys.argv
    prep_lanes()
    data = stage_csv(redo_csv)
    mean = data["archive_mean_rating"]
    label, label_src = make_labeller()
    known_rows = data["known_rows"]

    # build per-lane hit lists
    lane_hits = {}
    for lane in LANES:
        if "artists" in lane:
            continue
        hs = []
        for c, d in data["term_hits"][lane["id"]].items():
            h = {"row": d["row"], "terms": sorted(set(d["terms"])), "exact_terms": sorted(set(d["exact"])), "exact": bool(d["exact"])}
            hs.append(h)
        lane_hits[lane["id"]] = hs
    artist_songs = {}
    for lane in LANES:
        for a, al in lane["_artists"]:
            rows = [{"row": d["row"], "exact": False, "terms": [a]} for d in data["artist_hits"].get(a, [])]
            lane_hits.setdefault("L-artists:" + a, rows)

    # candidates
    cand = {}
    brows = {}
    for lane in LANES:
        for lbl, c in lane.get("known", []):
            if c in known_rows:
                cand[c] = known_rows[c]["mxl"]
                brows[c] = known_rows[c]
    per_term_pick = {}
    for lane in LANES:
        if "artists" in lane:
            continue
        hs = [h for h in lane_hits[lane["id"]] if lane_passes(lane, h)]
        by_term = defaultdict(list)
        for h in hs:
            for t in h["terms"]:
                by_term[t].append(h)
        for t, lst in by_term.items():
            for h in sorted(lst, key=pre_key)[:PER_TERM_CANDIDATES]:
                cand[h["row"]["cid"]] = h["row"]["mxl"]
                brows[h["row"]["cid"]] = h["row"]
    for lane in LANES:
        for a, al in lane["_artists"]:
            lst = lane_hits["L-artists:" + a]
            for h in sorted(lst, key=pre_key)[:PER_ARTIST_CANDIDATES]:
                cand[h["row"]["cid"]] = h["row"]["mxl"]
                brows[h["row"]["cid"]] = h["row"]
    print("candidates for XML:", len(cand), flush=True)
    have, missing = stage_extract(cand)
    shapes = stage_shape(have, brows, redo_shape)
    for lst in lane_hits.values():
        for h in lst:
            h["shape"] = shapes.get(h["row"]["cid"])

    OUT_X, OUT_S = OUT / "xml", OUT / "summary"
    for d in (OUT_X, OUT_S):
        if d.exists():
            for f in d.rglob("*"):
                if f.is_file():
                    f.unlink()
    total_bytes = 0
    results = {"matching_rules": "see README", "composition_label_source": label_src, "archive_mean_rating": mean,
               "lanes": {}}
    readme_lanes = []
    dumped_paths = []
    dumped_cids_global = set()

    def do_dump(lane_id, b, sh, why, actual_label=None):
        nonlocal total_bytes
        c = b["cid"]
        if c not in have or not sh:
            return False, "no XML available"
        if sh["xml_bytes"] > MAX_DUMP_BYTES:
            return False, f"skipped: XML {sh['xml_bytes']/1e6:.1f} MB over 3 MB"
        if total_bytes + sh["xml_bytes"] > FOLDER_BUDGET:
            return False, "skipped: folder size budget"
        xml = read_xml(have[c])
        slug = slugify(b["title"] or b["song_name"])
        (OUT_X / lane_id).mkdir(parents=True, exist_ok=True)
        (OUT_S / lane_id).mkdir(parents=True, exist_ok=True)
        xp = OUT_X / lane_id / f"{slug}-{c}.musicxml"
        xp.write_bytes(xml)
        meta = {"cid": c, "title": b["title"], "song_name": b["song_name"], "composer_name": b["composer"],
                "artist_name": b["artist"], "track_programs": b["programs"], "bars": b["csv_bars"], "license": b["licence"]}
        try:
            body = summarise(xml, meta)
        except Exception as e:  # noqa: BLE001
            body = f"SUMMARY FAILED: {e!r}"
        head = (f"SHAPE: {sh['shape']} | parts={sh['n_parts']} max_staves={sh['max_staves']} meters={','.join(sh['meters'])} "
                f"chord-symbols={sh['harmony']} bars={sh['bars']}\n")
        if actual_label:
            head += f"NOTE: {actual_label}\n"
        sp = OUT_S / lane_id / f"{slug}-{c}.txt"
        sp.write_text(head + body, encoding="utf-8")
        total_bytes += sh["xml_bytes"] + sp.stat().st_size
        dumped_paths.append((xp, sp))
        return True, why

    for lane in LANES:
        lid = lane["id"]
        entry = {"goal": lane["goal"], "known": [], "hits": [], "zero_terms": [], "artists": {}}
        r = {"lane": lid, "goal": lane["goal"], "known": [], "dumped": [], "next10": [], "zero_terms": [], "artist_tables": {}}

        def finish(h, rank, dumped, why, lbl=None):
            b = h["row"]
            sh = h.get("shape") or {}
            return {
                "cid": b["cid"], "title": b["title"], "song_name": b["song_name"], "composer": b["composer"],
                "artist": b["artist"], "programs": b["programs"], "n_tracks": b["n_tracks"],
                "shape": sh.get("shape", "NOT_INSPECTED"), "max_staves": sh.get("max_staves"),
                "total_staves": sh.get("total_staves"), "parts": sh.get("parts"), "meters": sh.get("meters"),
                "harmony": sh.get("harmony"), "bars": sh.get("bars", b["csv_bars"]), "csv_bars": b["csv_bars"],
                "key": sh.get("key"), "tempo": sh.get("tempo"),
                "rating": b["rating"], "n_ratings": b["n_ratings"], "n_views": b["n_views"],
                "n_favorites": b["n_favorites"], "licence": b["licence"],
                "composition_label": label(b["composer"], b["artist"]),
                "matched_terms": h.get("terms"), "exact_title_match": h.get("exact", False),
                "rank": rank, "dumped": dumped, "dump_reason": why,
            }

        # known CIDs
        known_usable = []
        for lbl, c in lane.get("known", []):
            row = known_rows.get(c)
            if not row:
                r["known"].append({"expected": lbl, "cid": c, "verdict": "NOT_FOUND"})
                continue
            vd = verdict_for(lbl, {"title": row["title"] or "NA", "song_name": row["song_name"] or "NA"})
            sh = shapes.get(c)
            kr = {"expected": lbl, "cid": c, "verdict": vd, "csv_title": row["title"], "csv_song_name": row["song_name"],
                  "csv_composer": row["composer"], "csv_artist": row["artist"], "programs": row["programs"],
                  "shape": sh["shape"] if sh else "NO_XML", "bars": sh["bars"] if sh else None,
                  "harmony": sh["harmony"] if sh else None, "meters": sh["meters"] if sh else None}
            r["known"].append(kr)
            if sh and sh["shape"] != "OTHER":
                known_usable.append((lbl, c, row, sh, vd))
        # hits
        if "artists" not in lane:
            hs = [h for h in lane_hits[lid] if lane_passes(lane, h)]
            hs.sort(key=lambda h: rank_key(h, mean, lane))
            seen_song = {}
            dump_songs = []
            extras = []
            chosen = {}
            for i, h in enumerate(hs, 1):
                h["rank"] = i
            for lbl, c, row, sh, vd in known_usable:
                if c in dumped_cids_global and False:
                    pass
            # dump known
            dumped_here = set()
            for lbl, c, row, sh, vd in known_usable:
                note = None
                if vd == "MISMATCH":
                    note = f"CSV row does not match indexed title '{lbl}'; the file is: {row['title'] or row['song_name']} ({row['composer'] or row['artist']})"
                ok, why = do_dump(lid, row, sh, f"known CID ({vd})", note)
                r["dumped"].append({"cid": c, "reason": f"known: {lbl} ({vd})", "ok": ok, "detail": why})
                if ok:
                    dumped_here.add(c)
            # top distinct songs
            n_songs = 0
            song_idx = {}
            for lbl, c, row, sh, vd in known_usable:
                if c in dumped_here and vd == "MATCH":
                    song_idx.setdefault(song_key(row), {"shapes": set(), "extra": 0})["shapes"].add(sh["shape"])
            for h in hs:
                b = h["row"]
                sh = h.get("shape")
                if not sh or sh["shape"] == "OTHER":
                    continue
                if lane.get("max_bars") and sh["bars"] > lane["max_bars"]:
                    continue
                sk = song_key(b)
                if sk in song_idx:
                    if sh["shape"] not in song_idx[sk]["shapes"] and song_idx[sk]["extra"] < 2:
                        song_idx[sk]["shapes"].add(sh["shape"])
                        song_idx[sk]["extra"] += 1
                        if b["cid"] not in dumped_here:
                            ok, why = do_dump(lid, b, sh, f"extra edition, different shape ({sh['shape']}) of '{sk}'")
                            r["dumped"].append({"cid": b["cid"], "reason": f"rank {h['rank']} extra shape", "ok": ok, "detail": why})
                            h["dumped"] = (ok, why)
                            if ok:
                                dumped_here.add(b["cid"])
                    continue
                if n_songs >= lane["dump"]:
                    continue
                n_songs += 1
                song_idx[sk] = {"shapes": {sh["shape"]}, "extra": 0}
                if b["cid"] in dumped_here:
                    h["dumped"] = (True, "already dumped as known CID")
                    continue
                ok, why = do_dump(lid, b, sh, f"top distinct song #{n_songs}")
                r["dumped"].append({"cid": b["cid"], "reason": f"rank {h['rank']} top distinct song #{n_songs}", "ok": ok, "detail": why})
                h["dumped"] = (ok, why)
                if ok:
                    dumped_here.add(b["cid"])
            dumped_info = {}
            for d in r["dumped"]:
                dumped_info[d["cid"]] = d
            res_hits = []
            for h in hs:
                c = h["row"]["cid"]
                dd = dumped_info.get(c)
                res_hits.append(finish(h, h["rank"], bool(dd and dd["ok"]),
                                       (dd["reason"] if dd else ("not selected" if h.get("shape") else "not inspected: outside the per-term top-15 pre-rank"))))
            r["hits"] = res_hits
            # zero-hit terms
            cnt = defaultdict(int)
            for h in lane_hits[lid]:
                for t in h["terms"]:
                    cnt[t] += 1
            r["zero_terms"] = [t for t, _, _ in lane["_terms"] if cnt[t] == 0]
            r["term_counts"] = {t: cnt[t] for t, _, _ in lane["_terms"]}
            r["n_hits"] = len(hs)
            r["n_hits_unfiltered"] = len(lane_hits[lid])
            r["dumped_rows"] = [x for x in res_hits if x["dumped"]]
            r["next10"] = [x for x in res_hits if not x["dumped"]][:10]
        else:
            r["n_hits"] = 0
            for a, al in lane["_artists"]:
                lst = lane_hits["L-artists:" + a]
                r["n_hits"] += len(lst)
                groups = defaultdict(list)
                for h in lst:
                    groups[song_key(h["row"], al)].append(h)
                reps = []
                for sk, g in groups.items():
                    g.sort(key=lambda h: rank_key(h, mean, lane))
                    reps.append((sk, g))
                reps.sort(key=lambda x: rank_key(x[1][0], mean, lane))
                nd = lane.get("dump_per_artist_priority", {}).get(a, lane["dump_per_artist"])
                top = reps[: lane["top_songs_per_artist"]]
                rows = []
                dcount = 0
                for sk, g in top:
                    best = g[0]
                    sh = best.get("shape")
                    dumped, why = False, "not selected"
                    if dcount < nd and sh and sh["shape"] != "OTHER":
                        ok, why2 = do_dump(lid, best["row"], sh, f"artist {a} top-song")
                        dumped, why = ok, why2
                        if ok:
                            dcount += 1
                    elif not sh:
                        why = "not inspected"
                    row = finish(best, 0, dumped, why)
                    row["song_key"] = sk
                    row["editions_in_archive"] = len(g)
                    rows.append(row)
                # if top-20 songs contain fewer usable than quota, scan deeper songs (inspected only)
                if dcount < nd:
                    for sk, g in reps[lane["top_songs_per_artist"]:]:
                        if dcount >= nd:
                            break
                        best = g[0]
                        sh = best.get("shape")
                        if sh and sh["shape"] != "OTHER":
                            ok, why2 = do_dump(lid, best["row"], sh, f"artist {a} next usable song (beyond top 20)")
                            if ok:
                                dcount += 1
                                row = finish(best, 0, True, "beyond top 20")
                                row["song_key"] = sk
                                rows.append(row)
                r["artist_tables"][a] = {"n_rows": len(lst), "n_distinct_songs": len(groups), "top": rows}
            r["dumped_rows"] = [x for a in r["artist_tables"].values() for x in a["top"] if x["dumped"]]
        for d in r["dumped_rows"]:
            dumped_cids_global.add(d["cid"])
        results["lanes"][lid] = r

    # ---------- results.json (lane L: top songs per artist plus per-artist counts, not all rows)
    (OUT / "quarry-results.json").write_text(json.dumps(
        {**results, "extraction_missing_from_tar": missing},
        ensure_ascii=False, indent=1), encoding="utf-8")
    write_readme(results, missing, label_src, dumped_paths, total_bytes)
    print("done; dump bytes", total_bytes)


def lane_res_hits(results, lid, lane_hits):
    return None


def md_cell(x):
    return str(x if x is not None else "").replace("|", "/").replace("\n", " ")


def fcid(c):
    return c


def write_readme(results, missing, label_src, dumped_paths, total_bytes):
    L = []
    w = L.append
    w("# PDMX quarry, second pass (2026-10-05)\n")
    w("Mechanical search and dump. No musical or pedagogical judgement; every figure comes from `PDMX.csv` or from the MusicXML itself. Built by `tools/content/pdmx/quarry_lanes.py` from `lanes.json`.\n")
    w("## Matching rules\n")
    w("- Text is normalised (NFKD, accents stripped, lowercase, every non-alphanumeric run becomes one space). A term matches only as a contiguous whole-token sequence: `muse` does not match `museum`, `numb` does not match `number`.")
    w("- Term fields: `song_name`, `title`, `subtitle`, `artist_name`, `composer_name`. Genres and tags are never searched.")
    w("- Terms listed in a lane's `exact_title_only_for` (and `extra_exact_titles`) match only when `song_name` or `title` equals the term after brackets are stripped and an `Artist - ` or ` - Artist` segment is removed.")
    w("- Exact match for ranking: the same equality test, applied to any term.")
    w("- Artists (lane L): an alias is a whole-token sequence in `artist_name` or `composer_name`, or equals one ` - ` separated segment of the title or song_name. Distinct songs are grouped by normalised song title with the artist segment removed.")
    w("- Shape comes from the XML (not the CSV): `PIANO2` all parts piano-family (MIDI program 0-7; CSV programs when the file gives none) with 2 or more staves in total; `LEADSHEET` one staff in total and 8 or more `<harmony>` elements; `PIANO1` all piano, one staff, fewer than 8 chord symbols; `MIXED_PIANO2` a piano part with 2 or more staves plus a non-piano part; `OTHER` anything else.")
    w("- Rank: exact title/term match, then inspected-XML, then shape (PIANO2 = LEADSHEET > MIXED_PIANO2 > PIANO1 > OTHER), then chord symbols present, then 16-120 bars, then Bayesian rating (m=10, archive mean %.2f), then views. `max_bars` and `piano_only` are hard filters where a lane sets them (`piano_only` uses the CSV programs; `max_bars` uses the XML bar count when inspected)." % results["archive_mean_rating"])
    w(f"- XML inspected only for: every known CID, the top {PER_TERM_CANDIDATES} rows per term by CSV pre-rank (exact match, piano-only programs, n_ratings, views) and the top {PER_ARTIST_CANDIDATES} rows per artist. Hits outside that set are listed as `NOT_INSPECTED` and rank below inspected ones.")
    w(f"- Composition label: {label_src}; `pd` / `in-copyright` / `unknown`. A label only; nothing is filtered on it.")
    w("- Dump: every usable known CID (shape not OTHER) plus the lane's top distinct songs; an extra edition of a song is kept only when its shape class differs. XML over 3 MB is skipped and recorded. `xml/<lane>/<slug>-<CID>.musicxml`, `summary/<lane>/<slug>-<CID>.txt`.")
    w(f"- Total dumped XML plus summaries: {total_bytes/1e6:.1f} MB. `quarry-results.json` lists every hit per lane (lane L: top songs per artist plus counts).\n")
    if missing:
        w(f"Candidate files not found in the tar stream: {', '.join(missing)}\n")
    for lid, r in results["lanes"].items():
        w(f"\n## Lane {lid}\n")
        w(f"Goal: {r['goal']}\n")
        if r["known"]:
            w("### Known CIDs, identity check\n")
            w("| Indexed as | CID | Verdict | CSV title / song_name | CSV composer / artist | Programs | Shape | Bars | Chord symbols |")
            w("|---|---|---|---|---|---|---|---|---|")
            for k in r["known"]:
                if k["verdict"] == "NOT_FOUND":
                    w(f"| {md_cell(k['expected'])} | {k['cid']} | **NOT_FOUND** | | | | | | |")
                    continue
                vd = k["verdict"] if k["verdict"] == "MATCH" else "**MISMATCH**"
                w(f"| {md_cell(k['expected'])} | {k['cid']} | {vd} | {md_cell(k['csv_title'])} / {md_cell(k['csv_song_name'])} | {md_cell(k['csv_composer'])} / {md_cell(k['csv_artist'])} | {k['programs']} | {k['shape']} | {k['bars']} | {k['harmony']} |")
            w("")
        if "artist_tables" in r and r["artist_tables"]:
            for a, t in r["artist_tables"].items():
                w(f"### {a}: {t['n_rows']} rows, {t['n_distinct_songs']} distinct songs\n")
                w("Top 20 distinct songs.\n")
                w("| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |")
                w("|---|---|---|---|---|---|---|---|---|---|---|---|")
                for i, x in enumerate(t["top"], 1):
                    w(f"| {i} | {md_cell(x['title'] or x['song_name'])} | {x['cid']} | {x['editions_in_archive']} | {x['shape']} | {','.join(x['meters'] or [])} | {x['bars']} | {x['harmony']} | {x['rating']:.2f} ({x['n_ratings']}) | {x['n_views']} | {x['composition_label']} | {'yes' if x['dumped'] else 'no'} |")
                w("")
            continue
        w(f"Hits: {r['n_hits']} rows pass the lane filters ({r['n_hits_unfiltered']} before filters).\n")
        w("### Dumped scores\n")
        if not r["dumped_rows"]:
            w("None.\n")
        else:
            w("| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |")
            w("|---|---|---|---|---|---|---|---|---|---|---|")
            for x in r["dumped_rows"]:
                w(f"| {x['cid']} | {md_cell(x['title'] or x['song_name'])} | {md_cell(x['artist'])} / {md_cell(x['composer'])} | {x['shape']} | {','.join(x['meters'] or [])} | {x['bars']} | {x['harmony']} | {x['rating']:.2f} ({x['n_ratings']}) | {x['n_views']} | {x['composition_label']} | {md_cell(x['dump_reason'])} |")
            w("")
        skipped = [d for d in r["dumped"] if not d["ok"]]
        for d in skipped:
            w(f"- NOT dumped: {d['cid']} ({d['reason']}): {d['detail']}")
        if skipped:
            w("")
        w("### Next 10 ranked, undumped\n")
        if not r["next10"]:
            w("None.\n")
        else:
            w("| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |")
            w("|---|---|---|---|---|---|---|---|---|---|---|---|")
            for x in r["next10"]:
                w(f"| {x['rank']} | {x['cid']} | {md_cell(x['title'] or x['song_name'])} | {md_cell(x['artist'])} / {md_cell(x['composer'])} | {x['shape']} | {','.join(x['meters'] or [])} | {x['bars']} | {x['harmony'] if x['harmony'] is not None else ''} | {x['rating']:.2f} ({x['n_ratings']}) | {x['n_views']} | {x['composition_label']} | {md_cell(', '.join(x['matched_terms'] or []))} |")
            w("")
        w("### Terms with zero matches\n")
        w(", ".join(r["zero_terms"]) if r["zero_terms"] else "None.")
        w("")
        w("Hits per term: " + "; ".join(f"{t}={n}" for t, n in r["term_counts"].items()) + "\n")
    w("\n## Dumped files\n")
    for xp, sp in dumped_paths:
        w(f"- `{xp.relative_to(OUT).as_posix()}` / `{sp.relative_to(OUT).as_posix()}`")
    (OUT / "README.md").write_text("\n".join(L) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
