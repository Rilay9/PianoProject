"""
Mechanical PDMX quarry driven by docs/review/pdmx-quarry-2026-10-05/lanes.json (pass three).

No musical or pedagogical judgement. Stages (cached under build/quarry-cache/):
  1 csv      one pass over PDMX.csv, hits for every lane
  2 extract  one tar stream for every candidate not already unpacked in the library or the cache
  3 shape    technical shape read from the MusicXML
  4 identity, rank, dump, write
Run:  python quarry_lanes.py [--redo-csv] [--redo-shape]
"""
from __future__ import annotations

import csv
import hashlib
import importlib.util
import json
import re
import statistics
import sys
import tarfile
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
LANES_BYTES = (OUT / "lanes.json").read_bytes()
LANES = json.loads(LANES_BYTES.decode("utf-8"))["lanes"]
CACHE_KEY = hashlib.sha1(LANES_BYTES + b"v3").hexdigest()[:10]
csv.field_size_limit(10**9)
sys.path.insert(0, str(HERE))
from quarry_core import (IDENT_RANK, SHAPE_SCORE, analyse, identity, melody_signals,  # noqa: E402
                         mxl_inner_xml, norm, padded, strip_brackets, title_variants)
from summarise_xml import summarise  # noqa: E402

MB = 1024 * 1024
DEFAULT_LIMIT = 3 * MB
BIG_LIMIT = 8 * MB
FOLDER_BUDGET = 130 * MB
PER_TERM_CANDIDATES = 15
PER_ARTIST_CANDIDATES = 40
BAYES_M = 10
MAX_EDITIONS = 3
BIG_LANES = {"I-pop", "J-rock", "K-metal"}
PIANO_SHAPES = ("PIANO_GRAND_STAFF", "PIANO1", "LEADSHEET")


# ---------------------------------------------------------------- helpers
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


def expected_title(label: str) -> str:
    return norm(strip_brackets(label).split(" - ")[0])


def song_key(b: dict, aliases: list[str] | None = None) -> str:
    base = b["song_name"] or b["title"]
    segs = [norm(x) for x in re.split(r"\s+-\s+", strip_brackets(base))]
    if aliases:
        segs = [s for s in segs if s and not any(s == a or f" {a} " in f" {s} " for a in aliases)] or segs
    if len(segs) > 1 and not aliases:
        art = norm(b["artist"])
        segs = [s for s in segs if s != art] or segs
    return segs[0] if segs else norm(base)


# ---------------------------------------------------------------- lane prep
def prep_lanes():
    for lane in LANES:
        exact_only = {norm(t) for t in lane.get("exact_title_only_for", [])}
        terms = []
        for t in lane.get("terms", []):
            terms.append({"term": t, "nt": norm(t), "exact": norm(t) in exact_only, "aliases": None})
        for tg in lane.get("targets", []):
            terms.append({"term": tg["title"], "nt": norm(tg["title"]), "exact": norm(tg["title"]) in exact_only,
                          "aliases": tg["aliases"]})
        lane["_terms"] = terms
        al = lane.get("artist_aliases", {})
        lane["_artists"] = [(a, [norm(x) for x in al.get(a, [a])]) for a in lane.get("artists", [])]


# ---------------------------------------------------------------- stage 1
def stage_csv(redo: bool):
    f = CACHE / f"csv_hits_{CACHE_KEY}.json"
    if f.exists() and not redo:
        return json.loads(f.read_text(encoding="utf-8"))
    known = {k[1] for lane in LANES for k in lane.get("known", [])}
    term_hits = {l["id"]: {} for l in LANES}
    artist_hits = {}
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
                for t in lane["_terms"]:
                    nt = t["nt"]
                    exact = nt in tv
                    ok = exact if t["exact"] else (exact or any(f" {nt} " in v for v in fields.values() if v))
                    if ok:
                        d = term_hits[lane["id"]].setdefault(c, {"row": None, "terms": [], "exact": []})
                        if d["row"] is None:
                            d["row"] = brief(row)
                        d["terms"].append(t["term"])
                        if exact:
                            d["exact"].append(t["term"])
            segs = set()
            for k in ("title", "song_name"):
                if row[k] and row[k] != "NA":
                    segs.update(norm(x) for x in re.split(r"\s+-\s+", row[k]))
            for a, al in all_artist_aliases.items():
                hit = any(
                    (fields["artist_name"] and f" {y} " in fields["artist_name"])
                    or (fields["composer_name"] and f" {y} " in fields["composer_name"])
                    for y in al
                ) or any(y in segs for y in al)
                if hit:
                    artist_hits.setdefault(a, {}).setdefault(c, {"row": brief(row)})
    data = {"n_rows": n, "archive_mean_rating": statistics.mean(ratings) if ratings else 4.0,
            "known_rows": known_rows, "term_hits": term_hits,
            "artist_hits": {a: list(v.values()) for a, v in artist_hits.items()}}
    CACHE.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(data), encoding="utf-8")
    return data


# ---------------------------------------------------------------- stage 2/3
def lib_path(c: str):
    for sub in (c[2:4], c[2:4].lower()):
        p = LIB / sub / f"{c}.mxl"
        if p.exists():
            return p
    return None


def stage_extract(cands: dict[str, str]):
    raw = CACHE / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    have, need = {}, {}
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


def stage_shape(have: dict, brows: dict, redo: bool):
    f = CACHE / "shape_v3.json"
    cache = json.loads(f.read_text(encoding="utf-8")) if f.exists() and not redo else {}
    for i, (c, p) in enumerate(have.items()):
        if c in cache:
            continue
        try:
            xml = read_xml(p)
            pr = brows[c]["programs"]
            progs = [int(x) for x in pr.split("-")] if pr not in ("", "NA") else []
            a = analyse(xml, progs)
            a["xml_bytes"] = len(xml)
        except Exception as e:  # noqa: BLE001
            a = {"shape": "OTHER", "error": repr(e), "xml_bytes": 0, "meters": [], "harmony": 0, "bars": 0,
                 "parts": [], "part_names": [], "n_parts": 0, "max_staves": 0, "total_staves": 0, "key": None,
                 "tempo": []}
        cache[c] = a
        if i % 300 == 0:
            print("shape", i, len(have), flush=True)
    f.write_text(json.dumps(cache), encoding="utf-8")
    return cache


def stage_signals(cids, have):
    f = CACHE / "signals_v3.json"
    cache = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    for c in cids:
        if c in cache or c not in have:
            continue
        try:
            cache[c] = melody_signals(read_xml(have[c]))
        except Exception as e:  # noqa: BLE001
            cache[c] = {"error": repr(e)}
    f.write_text(json.dumps(cache), encoding="utf-8")
    return cache


def make_labeller():
    try:
        sys.path.insert(0, str(HERE.parent))
        spec = importlib.util.spec_from_file_location("pdmx_composers", HERE / "composers.py")
        mod = importlib.util.module_from_spec(spec)
        sys.modules["pdmx_composers"] = mod
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
def bayes(r, n, mean):
    return (n * r + BAYES_M * mean) / (n + BAYES_M)


def rank_key(h: dict, mean: float):
    b = h["row"]
    sh = h.get("shape")
    inspected = sh is not None
    bars = sh["bars"] if inspected else b["csv_bars"]
    return (
        IDENT_RANK.get(h.get("ident", "n/a"), 0),
        -(1 if h.get("exact") else 0),
        -(1 if inspected else 0),
        -SHAPE_SCORE.get(sh["shape"] if inspected else None, 0),
        -(1 if inspected and sh["harmony"] > 0 else 0),
        -(1 if 16 <= bars <= 120 else 0),
        -bayes(b["rating"], b["n_ratings"], mean),
        -b["n_views"],
        b["cid"],
    )


def pre_key(h):
    b = h["row"]
    return (IDENT_RANK.get(h.get("ident", "n/a"), 0), -(1 if h.get("exact") else 0),
            -(1 if b["piano_only_csv"] else 0), -b["n_ratings"], -b["n_views"], b["cid"])


def materially_differs(sh, kept_shs) -> str | None:
    """Reason this edition differs from every kept edition, or None."""
    reasons = []
    for k in kept_shs:
        r = None
        if sh["shape"] != k["shape"]:
            r = f"shape {sh['shape']} vs {k['shape']}"
        elif k["bars"] and abs(sh["bars"] - k["bars"]) / max(k["bars"], 1) > 0.25:
            r = f"bars {sh['bars']} vs {k['bars']} (more than 25% apart)"
        else:
            a, b = sh["harmony"], k["harmony"]
            if (a == 0) != (b == 0) and max(a, b) >= 4:
                r = f"chord symbols {a} vs {b}"
            elif min(a, b) >= 1 and max(a, b) / min(a, b) > 2:
                r = f"chord symbols {a} vs {b} (more than 2x apart)"
        if r is None:
            return None
        reasons.append(r)
    return reasons[0] if reasons else None


# ---------------------------------------------------------------- main
def parse_args(argv: list[str]):
    """The two flags. `--help` prints the usage and exits before any stage runs: the
    entry-point test calls every script in this folder with `--help`, and a lane run
    reads the owner's archive and rewrites `docs/review/pdmx-quarry-2026-10-05/`."""
    import argparse
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0],
                                     usage="python quarry_lanes.py [--redo-csv] [--redo-shape]")
    parser.add_argument("--redo-csv", action="store_true", help="redo the PDMX.csv pass")
    parser.add_argument("--redo-shape", action="store_true", help="redo the shape read from the MusicXML")
    return parser.parse_args(argv)


def main():
    args = parse_args(sys.argv[1:])
    redo_csv = args.redo_csv
    redo_shape = args.redo_shape
    prep_lanes()
    data = stage_csv(redo_csv)
    mean = data["archive_mean_rating"]
    label, label_src = make_labeller()
    known_rows = data["known_rows"]
    lane_by_id = {l["id"]: l for l in LANES}

    # ---- hits with identity
    lane_hits, excluded = {}, {}
    for lane in LANES:
        if "artists" in lane:
            continue
        tmap = {t["term"]: t for t in lane["_terms"]}
        hs, ex = [], []
        for c, d in data["term_hits"][lane["id"]].items():
            terms = sorted(set(d["terms"]))
            h = {"row": d["row"], "terms": terms, "exact_terms": sorted(set(d["exact"])), "exact": bool(d["exact"])}
            best = None
            for t in terms:
                v, why = identity(t, tmap[t]["aliases"], d["row"])
                cand = (IDENT_RANK[v], 0 if t in h["exact_terms"] else 1, t, v, why)
                if best is None or cand < best:
                    best = cand
            h["best_term"], h["ident"], h["ident_reason"] = best[2], best[3], best[4]
            req = lane.get("require_other_term_for")
            if req and set(terms) <= set(req):
                h["excluded"] = "only matched " + ", ".join(terms) + " (not a Hanukkah term)"
                ex.append(h)
                continue
            hs.append(h)
        lane_hits[lane["id"]] = hs
        excluded[lane["id"]] = ex
    for lane in LANES:
        for a, al in lane["_artists"]:
            lane_hits["L-artists:" + a] = [{"row": d["row"], "exact": False, "terms": [a], "ident": "n/a"}
                                           for d in data["artist_hits"].get(a, [])]

    # ---- candidates
    cand, brows = {}, {}
    for lane in LANES:
        for lbl, c, exp in lane.get("known", []):
            if c in known_rows:
                cand[c] = known_rows[c]["mxl"]
                brows[c] = known_rows[c]
    for lane in LANES:
        if "artists" in lane:
            continue
        hs = lane_hits[lane["id"]]
        if lane.get("inspect_all"):
            picks = hs
        else:
            by_term = defaultdict(list)
            for h in hs:
                for t in h["terms"]:
                    by_term[t].append(h)
            picks = [h for lst in by_term.values() for h in sorted(lst, key=pre_key)[:PER_TERM_CANDIDATES]]
        for h in picks:
            cand[h["row"]["cid"]] = h["row"]["mxl"]
            brows[h["row"]["cid"]] = h["row"]
    for lane in LANES:
        for a, al in lane["_artists"]:
            for h in sorted(lane_hits["L-artists:" + a], key=pre_key)[:PER_ARTIST_CANDIDATES]:
                cand[h["row"]["cid"]] = h["row"]["mxl"]
                brows[h["row"]["cid"]] = h["row"]
    print("candidates for XML:", len(cand), flush=True)
    have, missing = stage_extract(cand)
    shapes = stage_shape(have, brows, redo_shape)
    for lst in lane_hits.values():
        for h in lst:
            h["shape"] = shapes.get(h["row"]["cid"])

    # ---- clear old dump
    OUT_X, OUT_S = OUT / "xml", OUT / "summary"
    for d in (OUT_X, OUT_S):
        if d.exists():
            for f in d.rglob("*"):
                if f.is_file():
                    f.unlink()

    state = {"bytes": 0}
    dumped_global = {}  # cid -> {"lane","xml","summary","bytes"}
    results = {"composition_label_source": label_src, "archive_mean_rating": mean, "lanes": {}}
    lane_dump_entries = defaultdict(list)

    def do_dump(lane_id, b, sh, why, limit, note=None):
        c = b["cid"]
        rec = {"cid": c, "reason": why}
        if c in dumped_global:
            g = dumped_global[c]
            rec.update(ok=True, detail=f"already dumped under {g['lane']}", xml=g["xml"], summary=g["summary"],
                       xml_bytes=g["bytes"], duplicate_of=g["lane"])
            lane_dump_entries[lane_id].append(rec)
            return rec
        if c not in have or not sh:
            rec.update(ok=False, detail="no XML available")
        elif limit is not None and sh["xml_bytes"] > limit:
            rec.update(ok=False, detail=f"skipped: XML {sh['xml_bytes']/MB:.1f} MB over the {limit/MB:.0f} MB limit",
                       xml_bytes=sh["xml_bytes"])
        elif state["bytes"] + sh["xml_bytes"] > FOLDER_BUDGET and limit is not None:
            rec.update(ok=False, detail="skipped: folder size budget", xml_bytes=sh["xml_bytes"])
        else:
            xml = read_xml(have[c])
            slug = slugify(b["title"] or b["song_name"])
            (OUT_X / lane_id).mkdir(parents=True, exist_ok=True)
            (OUT_S / lane_id).mkdir(parents=True, exist_ok=True)
            xp = OUT_X / lane_id / f"{slug}-{c}.musicxml"
            xp.write_bytes(xml)
            meta = {"cid": c, "title": b["title"], "song_name": b["song_name"], "composer_name": b["composer"],
                    "artist_name": b["artist"], "track_programs": b["programs"], "bars": b["csv_bars"],
                    "license": b["licence"]}
            try:
                body = summarise(xml, meta)
            except Exception as e:  # noqa: BLE001
                body = f"SUMMARY FAILED: {e!r}"
            head = (f"SHAPE: {sh['shape']} | parts={sh['n_parts']} max_staves={sh['max_staves']} "
                    f"meters={','.join(sh['meters'])} chord-symbols={sh['harmony']} bars={sh['bars']}\n"
                    f"INSTRUMENTS/PARTS: {'; '.join(sh['parts'])}\n")
            if note:
                head += f"NOTE: {note}\n"
            sp = OUT_S / lane_id / f"{slug}-{c}.txt"
            sp.write_text(head + body, encoding="utf-8")
            state["bytes"] += sh["xml_bytes"] + sp.stat().st_size
            rec.update(ok=True, detail=why, xml=xp.relative_to(OUT).as_posix(), summary=sp.relative_to(OUT).as_posix(),
                       xml_bytes=sh["xml_bytes"])
            dumped_global[c] = {"lane": lane_id, "xml": rec["xml"], "summary": rec["summary"], "bytes": sh["xml_bytes"]}
        lane_dump_entries[lane_id].append(rec)
        return rec

    def finish(h, rank=None):
        b = h["row"]
        sh = h.get("shape") or {}
        return {
            "cid": b["cid"], "title": b["title"], "song_name": b["song_name"], "composer": b["composer"],
            "artist": b["artist"], "programs": b["programs"], "n_tracks": b["n_tracks"],
            "shape": sh.get("shape", "NOT_INSPECTED"), "part_names": sh.get("part_names"),
            "max_staves": sh.get("max_staves"), "total_staves": sh.get("total_staves"), "parts": sh.get("parts"),
            "meters": sh.get("meters"), "harmony": sh.get("harmony"), "bars": sh.get("bars", b["csv_bars"]),
            "csv_bars": b["csv_bars"], "key": sh.get("key"), "tempo": sh.get("tempo"),
            "xml_bytes": sh.get("xml_bytes"),
            "rating": b["rating"], "n_ratings": b["n_ratings"], "n_views": b["n_views"],
            "n_favorites": b["n_favorites"], "licence": b["licence"],
            "composition_label": label(b["composer"], b["artist"]),
            "matched_terms": h.get("terms"), "exact_title_match": h.get("exact", False),
            "identity": h.get("ident"), "identity_reason": h.get("ident_reason"), "identity_term": h.get("best_term"),
            "rank": rank, "dumped": False, "dump_reason": "not selected" if h.get("shape") else
            "not inspected: outside the per-term top-15 pre-rank",
        }

    def mark(rows_by_cid, recs):
        for rec in recs:
            r = rows_by_cid.get(rec["cid"])
            if r is not None and rec["ok"]:
                r["dumped"] = True
                r["dump_reason"] = rec["reason"] + (f" (see {rec['xml']})" if rec.get("duplicate_of") else "")
                r["xml"] = rec.get("xml")

    def edition_pass(lane_id, ordered, kept, limit_for, reason_prefix):
        """ordered: ranked hits of ONE song, best first (first is already dumped). Adds up to MAX_EDITIONS."""
        recs = []
        for h in ordered[1:]:
            if len(kept) >= MAX_EDITIONS:
                break
            sh = h.get("shape")
            if not sh or sh["shape"] == "OTHER" or h.get("ident") == "MISMATCH":
                continue
            why = materially_differs(sh, [k for k in kept])
            if why:
                rec = do_dump(lane_id, h["row"], sh, f"{reason_prefix}; alternate edition kept: {why}", limit_for(h))
                recs.append(rec)
                if rec["ok"]:
                    kept.append(sh)
        return recs

    for lane in LANES:
        lid = lane["id"]
        r = {"lane": lid, "goal": lane["goal"], "known": [], "zero_terms": [], "artist_tables": {}}
        known_usable, why_of = [], {}
        for lbl, c, exp in lane.get("known", []):
            row = known_rows.get(c)
            if not row:
                r["known"].append({"expected": lbl, "cid": c, "verdict": "NOT_FOUND"})
                continue
            et = expected_title(lbl)
            vd, why = identity(et, exp, row)
            sh = shapes.get(c)
            r["known"].append({
                "expected": lbl, "expect_aliases": exp, "cid": c, "verdict": vd, "reason": why,
                "csv_title": row["title"], "csv_song_name": row["song_name"], "csv_composer": row["composer"],
                "csv_artist": row["artist"], "programs": row["programs"],
                "shape": sh["shape"] if sh else "NO_XML", "part_names": sh["part_names"] if sh else None,
                "bars": sh["bars"] if sh else None, "harmony": sh["harmony"] if sh else None,
                "meters": sh["meters"] if sh else None})
            if sh and sh["shape"] != "OTHER" and vd in ("MATCH", "TITLE_ONLY"):
                known_usable.append((lbl, c, row, sh, vd, et))
                why_of[c] = why

        def limit_known(h=None):
            return BIG_LIMIT

        if "artists" in lane:
            r["n_hits"] = 0
            for a, al in lane["_artists"]:
                lst = lane_hits["L-artists:" + a]
                r["n_hits"] += len(lst)
                groups = defaultdict(list)
                for h in lst:
                    groups[song_key(h["row"], al)].append(h)
                reps = []
                for sk, g in groups.items():
                    g.sort(key=lambda h: rank_key(h, mean))
                    reps.append((sk, g))
                reps.sort(key=lambda x: rank_key(x[1][0], mean))
                nd = lane.get("dump_per_artist_priority", {}).get(a, lane["dump_per_artist"])
                big = a in lane.get("priority_size_artists", [])
                lim = (lambda h: BIG_LIMIT) if big else (lambda h: DEFAULT_LIMIT)
                rows, by_cid, dcount, recs_all = [], {}, 0, []
                for idx, (sk, g) in enumerate(reps):
                    in_top = idx < lane["top_songs_per_artist"]
                    best = g[0]
                    sh = best.get("shape")
                    row = finish(best)
                    row["song_key"] = sk
                    row["editions_in_archive"] = len(g)
                    usable = bool(sh) and sh["shape"] != "OTHER"
                    got = False
                    if dcount < nd and usable:
                        rec = do_dump(lid, best["row"], sh, f"artist {a}, song #{idx + 1}", lim(best))
                        recs_all.append(rec)
                        if rec["ok"]:
                            got = True
                            dcount += 1
                            recs_all += edition_pass(lid, g, [sh], lim, f"artist {a}, song #{idx + 1}")
                    if in_top or got:
                        rows.append(row)
                        by_cid[row["cid"]] = row
                    if dcount >= nd and not in_top:
                        break
                mark(by_cid, recs_all)
                r["artist_tables"][a] = {"n_rows": len(lst), "n_distinct_songs": len(groups), "top": rows}
            r["dumped_rows"] = [x for t in r["artist_tables"].values() for x in t["top"] if x["dumped"]]
            r["dump_records"] = lane_dump_entries[lid]
            results["lanes"][lid] = r
            continue

        hs = lane_hits[lid]
        hs.sort(key=lambda h: rank_key(h, mean))
        for i, h in enumerate(hs, 1):
            h["rank"] = i
        rows = {h["row"]["cid"]: finish(h, h["rank"]) for h in hs}
        counts = defaultdict(int)
        for h in hs:
            counts[h["ident"]] += 1
        r["identity_counts"] = dict(counts)
        r["excluded"] = [{"cid": h["row"]["cid"], "title": h["row"]["title"], "composer": h["row"]["composer"],
                          "artist": h["row"]["artist"], "why": h["excluded"]} for h in excluded[lid]]
        kept_by_song = {}
        recs = []
        for lbl, c, row, sh, vd, et in known_usable:
            note = None if vd == "MATCH" else f"identity {vd}: {why_of[c]}"
            rec = do_dump(lid, row, sh, f"known CID {lbl} ({vd})", BIG_LIMIT, note)
            recs.append(rec)
            if rec["ok"]:
                kept_by_song.setdefault(et, []).append(sh)

        if lane.get("inspect_all"):
            f_lane(lane, hs, rows, r, recs, have, brows, shapes, mean, do_dump, finish, known_usable, lid, known_rows,
                   lane_hits, results, label)
        else:
            n_songs = 0
            groups = defaultdict(list)
            order = []
            for h in hs:
                sh = h.get("shape")
                if not sh or sh["shape"] == "OTHER" or h["ident"] == "MISMATCH":
                    continue
                sk = norm(h["best_term"]) if lane_by_id[lid]["_terms"] and any(
                    t["term"] == h["best_term"] and t["aliases"] is not None for t in lane["_terms"]) \
                    else song_key(h["row"])
                if sk not in groups:
                    order.append(sk)
                groups[sk].append(h)
            big = lid in BIG_LANES

            def lim(h):
                return BIG_LIMIT if (big and h.get("ident") == "MATCH") else DEFAULT_LIMIT
            for sk in order:
                g = groups[sk]
                already = sk in kept_by_song
                if not already:
                    if n_songs >= lane["dump"]:
                        continue
                    n_songs += 1
                    top = g[0]
                    rec = do_dump(lid, top["row"], top["shape"], f"top distinct song #{n_songs} (rank {top['rank']}, "
                                  f"identity {top['ident']})", lim(top))
                    recs.append(rec)
                    if rec["ok"]:
                        kept_by_song.setdefault(sk, []).append(top["shape"])
                        recs += edition_pass(lid, g, kept_by_song[sk], lim, f"song '{sk}'")
                else:
                    recs += edition_pass(lid, [None] + g, kept_by_song[sk], lim, f"song '{sk}' (known CID dumped)")
            if lid == "K-metal":
                for h in hs:
                    if h.get("best_term") == "a little piece of heaven" and h["ident"] != "MISMATCH":
                        recs.append(do_dump(lid, h["row"], h.get("shape"), "explicitly requested: A Little Piece of Heaven "
                                            "(A7X), dumped whatever its size", None))
        mark(rows, recs)
        r["hits"] = list(rows.values())
        cnt = defaultdict(int)
        for lst in (hs, excluded[lid]):
            for h in lst:
                for t in h["terms"]:
                    cnt[t] += 1
        r["zero_terms"] = [t["term"] for t in lane["_terms"] if cnt[t["term"]] == 0]
        r["term_counts"] = {t["term"]: cnt[t["term"]] for t in lane["_terms"]}
        r["n_hits"] = len(hs)
        r["dumped_rows"] = [x for x in rows.values() if x["dumped"]]
        r["next10"] = [x for x in rows.values() if not x["dumped"] and x["identity"] != "MISMATCH"][:10]
        r["mismatch_hits"] = [x for x in rows.values() if x["identity"] == "MISMATCH"]
        r["dump_records"] = lane_dump_entries[lid]
        results["lanes"][lid] = r

    # ---- totals
    entries = sum(len(v) for v in lane_dump_entries.values() if True)
    ok_entries = sum(1 for v in lane_dump_entries.values() for e in v if e["ok"])
    unique = len(dumped_global)
    results["totals"] = {"lane_dump_entries_ok": ok_entries, "unique_cids_dumped": unique,
                         "cross_lane_duplicates": ok_entries - unique, "dump_bytes": state["bytes"],
                         "records_total": entries}
    results["extraction_missing_from_tar"] = missing
    (OUT / "quarry-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
    write_readme(results, label_src)
    print("done", results["totals"])


def rec_ok_for(recs, best):
    return any(r["cid"] == best["row"]["cid"] and r["ok"] for r in recs)


# ---------------------------------------------------------------- lane F
def f_lane(lane, hs, rows, r, recs, have, brows, shapes, mean, do_dump, finish, known_usable, lid, known_rows,
           lane_hits, results, label):
    max_bars = lane.get("max_bars", 40)
    nominated = [h for h in hs if h.get("shape") and h["shape"]["shape"] in PIANO_SHAPES
                 and 4 <= h["shape"]["bars"] <= max_bars]
    kc = [k[1] for k in lane.get("known", [])]
    sig = stage_signals([h["row"]["cid"] for h in nominated] + kc, have)
    r["n_inspected"] = len([h for h in hs if h.get("shape")])
    r["n_nominated"] = len(nominated)
    sigs = {}
    for h in nominated:
        s = sig.get(h["row"]["cid"])
        if s and "error" not in s:
            sigs[h["row"]["cid"]] = s
    by_cid = {h["row"]["cid"]: h for h in nominated if h["row"]["cid"] in sigs}

    def frac(c):
        s = sigs[c]
        return (s["exact_repeat_measures"] + s["transposed_repeat_measures"]) / max(s["bars_ex_pickup"], 1)

    roles = {
        "motif-repetition": (lambda c: sigs[c]["exact_repeat_measures"] + sigs[c]["transposed_repeat_measures"] >= 2
                             and sigs[c]["bars_ex_pickup"] >= 4,
                             lambda c: (-frac(c), sigs[c]["bars_ex_pickup"], c)),
        "binary-or-ABA": (lambda c: (sigs[c]["first_phrase_returns_exact_at_bar"] and sigs[c]["middle_contrasts"])
                          or (sigs[c]["first_phrase_returns_rhythm_at_bar"] and sigs[c]["middle_contrasts"])
                          or sigs[c]["halves_8_or_16"] or sigs[c]["repeat_barlines"] >= 2,
                          lambda c: (-int(bool(sigs[c]["first_phrase_returns_exact_at_bar"] and sigs[c]["middle_contrasts"])),
                                     -int(bool(sigs[c]["first_phrase_returns_rhythm_at_bar"] and sigs[c]["middle_contrasts"])),
                                     -int(sigs[c]["halves_8_or_16"]), -int(sigs[c]["repeat_barlines"] >= 2),
                                     abs(sigs[c]["bars_ex_pickup"] - 16), c)),
        "harmonizable-melody": (lambda c: sigs[c]["single_line_top"] and sigs[c]["bars_ex_pickup"] >= 8,
                                lambda c: (-int(sigs[c]["support"]), abs(sigs[c]["bars_ex_pickup"] - 16),
                                           -bayes(by_cid[c]["row"]["rating"], by_cid[c]["row"]["n_ratings"], mean), c)),
    }
    role_tables, role_of = {}, defaultdict(list)
    for name, (ok, key) in roles.items():
        cs = sorted([c for c in sigs if ok(c)], key=key)
        picked, seen = [], set()
        for c in cs:
            sk = song_key(by_cid[c]["row"])
            if sk in seen:
                continue
            seen.add(sk)
            picked.append(c)
            if len(picked) == 4:
                break
        role_tables[name] = picked
        for c in picked:
            role_of[c].append(name)
    for c, rl in role_of.items():
        h = by_cid[c]
        rec = do_dump(lid, h["row"], h["shape"], "structural nomination, roles: " + ", ".join(rl), DEFAULT_LIMIT,
                      "signals only: " + json.dumps({k: v for k, v in sigs[c].items()}))
        recs.append(rec)
    r["roles"] = {name: [{"cid": c, **finish(by_cid[c]), "signals": sigs[c]} for c in cs]
                  for name, cs in role_tables.items()}
    r["role_candidates"] = {name: len([c for c in sigs if ok(c)]) for name, (ok, key) in roles.items()}
    r["signals_known"] = {c: sig.get(c) for c in kc if c in sig}
    r["nominated_signals"] = {c: sigs[c] for c in sigs}
    for rr in r["roles"].values():
        for x in rr:
            x["dumped"] = True
    # cross reference: B-jazz Autumn Leaves hits
    bj = lane_hits.get("B-jazz", [])
    r["cross_reference_autumn_leaves"] = [
        {"cid": h["row"]["cid"], "title": h["row"]["title"], "composer": h["row"]["composer"],
         "artist": h["row"]["artist"], "identity": h["ident"],
         "shape": (h.get("shape") or {}).get("shape")}
        for h in bj if h.get("best_term") == "autumn leaves" and h["ident"] == "MATCH"][:10]
    for h in nominated:
        c = h["row"]["cid"]
        if c in sigs:
            rows[c]["signals"] = sigs[c]
            rows[c]["roles"] = role_of.get(c, [])


# ---------------------------------------------------------------- README
def md_cell(x):
    return str(x if x is not None else "").replace("|", "/").replace("\n", " ")


def write_readme(results, label_src):
    L = []
    w = L.append
    t = results["totals"]
    w("# PDMX quarry, pass three (2026-10-05)\n")
    w("Mechanical search and dump. No musical or pedagogical judgement; every figure comes from `PDMX.csv` or from the MusicXML itself. Built by `tools/content/pdmx/quarry_lanes.py` and `quarry_core.py` from `lanes.json`.\n")
    w("## Counts\n")
    w(f"- Lane entries dumped (a file listed under a lane): {t['lane_dump_entries_ok']}")
    w(f"- Unique CIDs dumped: {t['unique_cids_dumped']}")
    w(f"- Cross-lane duplicates (same CID listed in more than one lane; the XML is written once, under its first lane): {t['cross_lane_duplicates']}")
    w(f"- Dumped XML plus summaries: {t['dump_bytes']/MB:.1f} MB\n")
    w("## Matching rules\n")
    w("- Text is normalised (NFKD, accents stripped, lowercase, apostrophes removed, every other non-alphanumeric run becomes one space). A term matches only as a contiguous whole-token sequence: `muse` does not match `museum`, `numb` does not match `number`.")
    w("- Term fields: `song_name`, `title`, `subtitle`, `artist_name`, `composer_name`. Genres and tags are never searched.")
    w("- Terms in a lane's `exact_title_only_for` match only when `song_name` or `title` equals the term after brackets are stripped and an `Artist - ` or ` - Artist` segment is removed.")
    w("- Targets (a title plus expected creator aliases) and known CIDs get an identity verdict: **MATCH** the title is the term (or the term plus only filler words such as piano, cover, tutorial) and an expected creator alias appears in artist, composer or a title segment; **TITLE_ONLY** the title fits but the creator is absent, traditional or an arranger, or the term is only a strict part of a longer title; **MISMATCH** the title does not contain the term, or a named creator (composer or artist; bucket names such as 'Misc tunes', dates, arranger credits and 'Traditional' do not count as named) is present, none of the expected aliases appears anywhere in the row, and that creator is someone else; **NOT_FOUND** the CID is not in the CSV. Generic terms with no creator expectation show `n/a`. A MISMATCH is never dumped.")
    w("- Artists (lane L): an alias is a whole-token sequence in `artist_name` or `composer_name`, or equals one ` - ` separated segment of the title or song_name. Distinct songs are grouped by normalised song title with the artist segment removed.")
    w("- Shape comes from the XML. `PIANO_GRAND_STAFF`: every part is piano-family (MIDI program 0-7, else a piano-like part name, else the CSV programs) and some part has 2 or more staves. `MULTI_PIANO_PART`: several piano parts, none with 2 or more staves. `MIXED_WITH_PIANO`: a piano part with 2 or more staves plus non-piano parts. `LEADSHEET`: one part, one staff, 8 or more `<harmony>` elements, whatever the instrument (part names are recorded so a saxophone line is visible as one). `PIANO1`: one piano part, one staff, fewer than 8 chord symbols. `OTHER`: anything else.")
    w("- Rank: identity (MATCH and n/a before TITLE_ONLY), exact title match, XML inspected, shape (PIANO_GRAND_STAFF = LEADSHEET > MIXED_WITH_PIANO > MULTI_PIANO_PART = PIANO1 > OTHER), chord symbols present, 16-120 bars, Bayesian rating (m=10, archive mean %.2f), views. CSV fields (piano programs, bar count) only order the candidates before inspection; every hard filter uses XML facts." % results["archive_mean_rating"])
    w(f"- XML inspected for: every known CID, the top {PER_TERM_CANDIDATES} rows per term by pre-rank (identity, exact match, CSV piano programs, n_ratings, views), the top {PER_ARTIST_CANDIDATES} rows per artist, and every hit of the improv/compose lane. Other hits are listed as `NOT_INSPECTED`.")
    w(f"- Composition label: {label_src}; `pd` / `in-copyright` / `unknown`. A label only; nothing is filtered on it.")
    w(f"- Dump: every known CID that is not a MISMATCH and not shape OTHER, plus each lane's top distinct songs. Up to {MAX_EDITIONS} editions of one song are kept when they differ materially (different shape class, bars more than 25% apart, or chord-symbol count more than 2x apart); the CSV has no uploader field, so a different arranger or uploader is not tested. XML over 3 MB is skipped and recorded; the limit is 8 MB for known CIDs, creator-confirmed (MATCH) targets in lanes I, J, K, and rows of the priority artists (Avenged Sevenfold, Metallica, Muse); A Little Piece of Heaven is dumped at any size. A CID listed in several lanes is written once.")
    w("- Files: `xml/<lane>/<slug>-<CID>.musicxml`, `summary/<lane>/<slug>-<CID>.txt`.\n")
    if results["extraction_missing_from_tar"]:
        w(f"Candidate files not found in the tar stream: {', '.join(results['extraction_missing_from_tar'])}\n")
    for lid, r in results["lanes"].items():
        w(f"\n## Lane {lid}\n")
        w(f"Goal: {r['goal']}\n")
        if r["known"]:
            w("### Known CIDs, identity check\n")
            w("| Indexed as | CID | Verdict | Reason | CSV title / song_name | CSV composer / artist | Programs | Parts | Shape | Bars | Chords |")
            w("|---|---|---|---|---|---|---|---|---|---|---|")
            for k in r["known"]:
                if k["verdict"] == "NOT_FOUND":
                    w(f"| {md_cell(k['expected'])} | {k['cid']} | **NOT_FOUND** | | | | | | | | |")
                    continue
                vd = k["verdict"] if k["verdict"] == "MATCH" else f"**{k['verdict']}**"
                w(f"| {md_cell(k['expected'])} | {k['cid']} | {vd} | {md_cell(k['reason'])} | {md_cell(k['csv_title'])} / {md_cell(k['csv_song_name'])} | {md_cell(k['csv_composer'])} / {md_cell(k['csv_artist'])} | {k['programs']} | {md_cell('; '.join(k['part_names'] or []))} | {k['shape']} | {k['bars']} | {k['harmony']} |")
            w("")
        if r["artist_tables"]:
            for a, tb in r["artist_tables"].items():
                w(f"### {a}: {tb['n_rows']} rows, {tb['n_distinct_songs']} distinct songs\n")
                w("Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).\n")
                w("| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |")
                w("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
                for i, x in enumerate(tb["top"], 1):
                    w(f"| {i} | {md_cell(x['title'] or x['song_name'])} | {x['cid']} | {x['editions_in_archive']} | {x['shape']} | {md_cell('; '.join(x['part_names'] or []))} | {','.join(x['meters'] or [])} | {x['bars']} | {x['harmony']} | {x['rating']:.2f} ({x['n_ratings']}) | {x['n_views']} | {x['composition_label']} | {'yes' if x['dumped'] else 'no'} |")
                w("")
            dumped_table(L, r)
            continue
        w(f"Hits: {r['n_hits']} rows. Identity verdicts over hits: " + ", ".join(f"{k} {v}" for k, v in sorted(r["identity_counts"].items())) + ".\n")
        if r["excluded"]:
            w(f"Excluded by the lane rule (matched only 'rock of ages', no Hanukkah term): {len(r['excluded'])} rows, for example " + "; ".join(f"{md_cell(x['title'])} ({md_cell(x['composer'] or x['artist'])})" for x in r["excluded"][:6]) + ".\n")
        dumped_table(L, r)
        if "roles" in r:
            f_tables(L, r)
        else:
            w("### Next 10 ranked, undumped (MISMATCH excluded)\n")
            if not r["next10"]:
                w("None.\n")
            else:
                w("| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |")
                w("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
                for x in r["next10"]:
                    w(f"| {x['rank']} | {x['cid']} | {md_cell(x['title'] or x['song_name'])} | {md_cell(x['artist'])} / {md_cell(x['composer'])} | {x['identity']} | {x['shape']} | {','.join(x['meters'] or [])} | {x['bars']} | {x['harmony'] if x['harmony'] is not None else ''} | {x['rating']:.2f} ({x['n_ratings']}) | {x['n_views']} | {x['composition_label']} | {md_cell(', '.join(x['matched_terms'] or []))} |")
                w("")
            mm = r["mismatch_hits"]
            w(f"### Identity MISMATCH hits: {len(mm)} (none dumped)\n")
            for x in mm[:10]:
                w(f"- {x['cid']}: {md_cell(x['title'] or x['song_name'])} / {md_cell(x['composer'] or x['artist'])} for term '{x['identity_term']}': {md_cell(x['identity_reason'])}")
            if len(mm) > 10:
                w(f"- ... and {len(mm) - 10} more in quarry-results.json")
            w("")
        w("### Terms with zero matches for the configured term\n")
        w(", ".join(r["zero_terms"]) if r["zero_terms"] else "None.")
        w("")
        w("Hits per term: " + "; ".join(f"{k}={v}" for k, v in r["term_counts"].items()) + "\n")
    w("\n## Dumped files (first lane that wrote each)\n")
    seen = set()
    for lid, r in results["lanes"].items():
        for rec in r["dump_records"]:
            if rec["ok"] and not rec.get("duplicate_of") and rec["xml"] not in seen:
                seen.add(rec["xml"])
                w(f"- `{rec['xml']}` / `{rec['summary']}`")
    (OUT / "README.md").write_text("\n".join(L) + "\n", encoding="utf-8")


def dumped_table(L, r):
    w = L.append
    rows = {x["cid"]: x for x in r.get("dumped_rows", [])}
    recs = r["dump_records"]
    w("### Dumped scores\n")
    if not recs:
        w("None.\n")
        return
    w("| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |")
    w("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    for rec in recs:
        if not rec["ok"]:
            continue
        x = rows.get(rec["cid"]) or {}
        if not x:
            kn = [k for k in r["known"] if k["cid"] == rec["cid"]]
            if kn:
                k = kn[0]
                x = {"title": k["csv_title"] or k["csv_song_name"], "artist": k["csv_artist"], "composer": k["csv_composer"],
                     "identity": k["verdict"], "shape": k["shape"], "part_names": k["part_names"], "meters": k["meters"],
                     "bars": k["bars"], "harmony": k["harmony"], "rating": 0, "n_ratings": 0, "n_views": 0,
                     "composition_label": ""}
        where = rec["detail"] if rec.get("duplicate_of") else rec["reason"]
        path = rec["xml"]
        w(f"| {rec['cid']} | {md_cell(x.get('title'))} | {md_cell(x.get('artist'))} / {md_cell(x.get('composer'))} | {x.get('identity', '')} | {x.get('shape', '')} | {md_cell('; '.join(x.get('part_names') or []))} | {','.join(x.get('meters') or [])} | {x.get('bars', '')} | {x.get('harmony', '')} | {x.get('rating', 0):.2f} ({x.get('n_ratings', 0)}) | {x.get('n_views', 0)} | {x.get('composition_label', '')} | {rec['xml_bytes']} | {md_cell(where)}; `{path}` |")
    w("")
    for rec in recs:
        if not rec["ok"]:
            w(f"- NOT dumped: {rec['cid']} ({md_cell(rec['reason'])}): {rec['detail']}")
    w("")


def f_tables(L, r):
    w = L.append
    w(f"### Structural nomination\n")
    w(f"Inspected {r['n_inspected']} hits in XML; {r['n_nominated']} are piano (grand staff, PIANO1 or LEADSHEET) with 4 to 40 XML bars. Signals only: they say what repeats and what is single-line, nothing about quality. Candidates per role: " + ", ".join(f"{k} {v}" for k, v in r["role_candidates"].items()) + ".\n")
    cols = "| CID | Title | Shape | Bars | Exact-repeat measures | Transposed-repeat measures | Repeat barlines | Endings | 8/16-bar halves | Phrase returns exact at bar | Phrase returns rhythm at bar | Middle contrasts | Top-staff max simultaneity | Chords | Lower-staff support |"
    sep = "|" + "---|" * 15
    for name, lst in r["roles"].items():
        w(f"#### Role: {name}\n")
        w(cols)
        w(sep)
        for x in lst:
            s = x["signals"]
            w(f"| {x['cid']} | {md_cell(x['title'] or x['song_name'])} | {x['shape']} | {s['bars_ex_pickup']} | {s['exact_repeat_measures']} | {s['transposed_repeat_measures']} | {s['repeat_barlines']} | {s['ending_brackets']} | {s['halves_8_or_16']} | {s['first_phrase_returns_exact_at_bar']} | {s['first_phrase_returns_rhythm_at_bar']} | {s['middle_contrasts']} | {s['max_simultaneity_top_staff']} | {s['chord_symbols']} | {s['support']} |")
        if not lst:
            w("| none |")
        w("")
    w("#### Signals for the four known F CIDs\n")
    w("| CID | Bars (no pickup) | Exact-repeat | Transposed-repeat | Repeat barlines | Halves 8/16 | Phrase returns exact | Single line top | Chords |")
    w("|---|---|---|---|---|---|---|---|---|")
    for c, s in r["signals_known"].items():
        if s and "error" not in s:
            w(f"| {c} | {s['bars_ex_pickup']} | {s['exact_repeat_measures']} | {s['transposed_repeat_measures']} | {s['repeat_barlines']} | {s['halves_8_or_16']} | {s['first_phrase_returns_exact_at_bar']} | {s['single_line_top']} | {s['chord_symbols']} |")
    w("")
    w("Autumn Leaves (Kosma) for this lane is cross-referenced from B-jazz, not re-dumped here: " + ("; ".join(f"{x['cid']} ({md_cell(x['title'])}, {x['shape']})" for x in r["cross_reference_autumn_leaves"]) or "no MATCH rows in B-jazz") + ".\n")


if __name__ == "__main__":
    main()
