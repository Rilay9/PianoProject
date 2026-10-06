"""
Familiar-song pass driver (2026-10-05). Calls the existing quarry machinery; no new search tool.
Stages (scratch cache outside the repo, via --cache):
  search   one pass over PDMX.csv -> candidate rows per title (identity + pre_key from quarry_lanes/quarry_core)
  extract  ONE tar stream for every candidate -> raw .mxl in the cache
  shape    quarry_core.analyse for each candidate -> shapes.json (and a printed table)
  write    for chosen CIDs (chosen.json in the cache): xml/<slug>-<CID>.musicxml (inner xml byte-for-byte)
           and summary/<slug>-<CID>.txt
Run: py -3.11 run_pass.py search|extract|shape|write --cache <dir>
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import tarfile
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / "tools" / "content" / "pdmx"))
import quarry_lanes as QL  # noqa: E402  (only its pure helpers are used)
from quarry_core import analyse, identity, mxl_inner_xml, norm, padded, title_variants  # noqa: E402
from summarise_xml import summarise  # noqa: E402

TITLES = [
    ("Mad World", ["tears for fears", "orzabal", "gary jules", "michael andrews"]),
    ("Let It Be", ["beatles", "lennon", "mccartney"]),
    ("Stand By Me", ["ben e king", "leiber", "stoller"]),
    ("Viva La Vida", ["coldplay"]),
    ("Someone Like You", ["adele", "dan wilson"]),
    ("Your Song", ["elton john", "taupin"]),
    ("A Thousand Miles", ["vanessa carlton"]),
    ("Chasing Cars", ["snow patrol"]),
    ("Iris", ["goo goo dolls", "rzeznik"]),
    ("Creep", ["radiohead"]),
    ("Karma Police", ["radiohead"]),
    ("Take Me Home, Country Roads", ["john denver", "denver", "danoff", "nivert"]),
    ("Jolene", ["dolly parton", "parton"]),
    ("Ring of Fire", ["johnny cash", "cash", "june carter", "kilgore"]),
    ("I Walk the Line", ["johnny cash", "cash"]),
    ("Tennessee Whiskey", ["chris stapleton", "stapleton", "dean dillon", "hargrove"]),
]
EXTRA_TERMS = {"Take Me Home, Country Roads": ["Country Roads"]}


def IDR(x):
    return QL.IDENT_RANK.get(x, 0)


def search(cache: Path):
    csv.field_size_limit(10**9)
    hits = {t: {} for t, _ in TITLES}
    terms = []
    for t, al in TITLES:
        for term in [t] + EXTRA_TERMS.get(t, []):
            terms.append((t, term, norm(term), al))
    with open(QL.CSV_PATH, encoding="utf-8", errors="replace", newline="") as fh:
        for row in csv.DictReader(fh):
            tv = title_variants(row["song_name"]) | title_variants(row["title"])
            fields = [padded(row[k]) for k in ("song_name", "title", "subtitle")]
            for t, term, nt, al in terms:
                exact = nt in tv
                if exact or any(f" {nt} " in f for f in fields if f):
                    r = {"title": row["title"], "song_name": row["song_name"], "subtitle": row["subtitle"],
                         "composer": row["composer_name"], "artist": row["artist_name"]}
                    ident = identity(term, al, r)
                    b = QL.brief(row)
                    b["subtitle"] = QL.na(row["subtitle"])
                    d = hits[t].setdefault(b["cid"], {"row": b, "exact": exact, "ident": ident[0], "why": ident[1]})
                    if exact:
                        d["exact"] = True
                    if IDR(ident[0]) < IDR(d["ident"]):
                        d["ident"], d["why"] = ident
    out = {}
    for t, _ in TITLES:
        lst = sorted(hits[t].values(), key=QL.pre_key)
        out[t] = {"n_hits": len(lst), "cands": lst[:60]}
        print(t, len(lst), "hits; kept", len(out[t]["cands"]), flush=True)
    cache.mkdir(parents=True, exist_ok=True)
    (cache / "cands.json").write_text(json.dumps(out), encoding="utf-8")


def extract(cache: Path):
    cands = json.loads((cache / "cands.json").read_text(encoding="utf-8"))
    want = {}
    for v in cands.values():
        for h in v["cands"]:
            want[h["row"]["mxl"].lstrip("./")] = h["row"]["cid"]
    raw = cache / "raw"
    raw.mkdir(exist_ok=True)
    need = {k: c for k, c in want.items() if not (raw / f"{c}.mxl").exists()}
    print("need", len(need), "of", len(want), flush=True)
    with tarfile.open(QL.TAR_PATH, "r|gz") as tf:
        for mem in tf:
            if mem.name in need:
                c = need.pop(mem.name)
                (raw / f"{c}.mxl").write_bytes(tf.extractfile(mem).read())
                if not need:
                    break
    print("missing", list(need.values()))


def shape(cache: Path):
    cands = json.loads((cache / "cands.json").read_text(encoding="utf-8"))
    out = {}
    for v in cands.values():
        for h in v["cands"]:
            c = h["row"]["cid"]
            p = cache / "raw" / f"{c}.mxl"
            if not p.exists():
                continue
            try:
                xml = mxl_inner_xml(p.read_bytes())
                pr = h["row"]["programs"]
                progs = [int(x) for x in pr.split("-")] if pr not in ("", "NA") else []
                a = analyse(xml, progs)
                a["xml_bytes"] = len(xml)
            except Exception as e:  # noqa: BLE001
                a = {"error": repr(e)}
            out[c] = a
    (cache / "shapes.json").write_text(json.dumps(out), encoding="utf-8")
    for t, v in cands.items():
        print("\n##", t, v["n_hits"])
        for h in v["cands"]:
            b, c = h["row"], h["row"]["cid"]
            a = out.get(c, {})
            print(f" {c[:12]} {h['ident'][:5]:5} ex={int(h['exact'])} '{b['title'][:48]}' | {b['composer'][:18]}/{b['artist'][:18]}"
                  f" | {a.get('shape')} bars={a.get('bars')} h={a.get('harmony')} parts={a.get('part_names')}"
                  f" r={b['rating']:.1f}/{b['n_ratings']} v={b['n_views']}")


# ------------------------------------------------------------------ write
def _root(xml: bytes):
    r = ET.fromstring(xml)
    for el in r.iter():
        if isinstance(el.tag, str) and "}" in el.tag:
            el.tag = el.tag.split("}", 1)[1]
    return r


def _rsig(line):
    """Rhythm signature of one measure line: pitches stripped, per staff/voice stream."""
    body = line.split("  ", 1)[1] if "  " in line else ""
    return tuple(re.sub(r"[A-G][#b]*\d(\+[A-G][#b]*\d)*", "", st.split(": ", 1)[-1]) for st in body.split(" | "))


def plan_windows(lines, whole_if_le):
    """Opening 16 bars; 6-bar windows at texture changes (rhythm-signature set of 4-bar blocks), at labelled or
    marked changes (words, repeat barlines, tempo, key, time), a middle sample and the last 8 bars."""
    n = len(lines)
    if n <= whole_if_le:
        return [(1, n, "whole part")], "short part, summarised whole"
    sigs = [_rsig(x) for x in lines]
    marks = {}
    for i, x in enumerate(lines):
        head = re.match(r"\S+ \[(.*?)\]  ", x)
        h = head.group(1) if head else ""
        if i == 0:
            continue
        if re.search(r'"[^"]*(?i:verse|chorus|bridge|intro|outro|coda|refrain|interlude|solo|pre|segno|fine)[^"]*"', h):
            marks[i] = "label " + ",".join(re.findall(r'"([^"]*)"', h))[:30]
        elif re.search(r"key fifths|time \d|tempo=", h):
            marks[i] = "key/time/tempo change"
        elif "repeat-forward" in h:
            marks[i] = "repeat start"
    scores = []
    for i in range(4, n - 3):
        a, b = set(sigs[i - 4:i]), set(sigs[i:i + 4])
        d = 1 - len(a & b) / max(1, len(a | b))
        if d >= 0.75:
            scores.append((d, i))
    cps = []
    for d, i in sorted(scores, key=lambda t: (-t[0], t[1])):
        if all(abs(i - j) >= 8 for j in cps) and i >= 12:
            cps.append(i)
        if len(cps) >= 4:
            break
    for i, why in marks.items():
        if i >= 18 and all(abs(i - j) >= 8 for j in cps) and len(cps) < 7:
            cps.append(i)
    cps.sort()
    wins = [(1, 16, "opening 16 bars")]
    notes = []
    for i in cps:
        lo, hi = max(1, i - 1), min(n, i + 6)
        why = marks.get(i, "texture change (rhythm signature)")
        wins.append((lo, hi, f"around line {i + 1}: {why}"))
        notes.append(f"{i + 1} ({why})")
    mid = n // 2
    if all(abs(mid - j) >= 8 for j in cps) and mid > 24:
        wins.append((mid, min(n, mid + 5), "middle sample"))
    wins.append((max(1, n - 7), n, "last 8 bars"))
    return wins, ", ".join(notes) if notes else "none detected (pattern persists by rhythm signature)"


def write(cache: Path, outdir: Path):
    chosen = json.loads((cache / "chosen.json").read_text(encoding="utf-8"))
    cands = json.loads((cache / "cands.json").read_text(encoding="utf-8"))
    rows = {h["row"]["cid"]: h["row"] for v in cands.values() for h in v["cands"]}
    (outdir / "xml").mkdir(exist_ok=True)
    (outdir / "summary").mkdir(exist_ok=True)
    for c in chosen:
        cid, sl = c["cid"], c["slug"]
        b = rows[cid]
        xml = mxl_inner_xml((cache / "raw" / f"{cid}.mxl").read_bytes())
        (outdir / "xml" / f"{sl}-{cid}.musicxml").write_bytes(xml)
        root = _root(xml)
        progs = [int(x) for x in b["programs"].split("-")] if b["programs"] not in ("", "NA") else []
        a = analyse(xml, progs)
        meta = {"cid": cid, "title": b["title"], "song_name": b["song_name"], "composer_name": b["composer"],
                "artist_name": b["artist"], "track_programs": b["programs"], "bars": b["csv_bars"],
                "license": b["licence"]}
        full = summarise(xml, meta).split("\n")
        blocks, cur = [], None
        for ln in full[4:]:
            if ln.strip().startswith("=== part"):
                cur = {"head": ln.strip(), "m": []}
                blocks.append(cur)
            elif ln.strip() == "":
                continue
            elif cur is not None:
                cur["m"].append(ln)
        tempos = []
        for sn in root.iter("sound"):
            if sn.get("tempo") and sn.get("tempo") not in tempos:
                tempos.append(sn.get("tempo"))
        keys = []
        for k in root.iter("key"):
            s = f"fifths={k.findtext('fifths')}" + (f" {k.findtext('mode')}" if k.findtext("mode") else "")
            if s not in keys:
                keys.append(s)
        rehearsals = ["".join(r.itertext()).strip() for r in root.iter("rehearsal")]
        words = []
        for w in root.iter("words"):
            tx = (w.text or "").strip()
            if tx and tx not in words and len(words) < 25:
                words.append(tx[:50])
        tempo_words = [w for w in words if re.search(r"(?i)moder|allegro|andante|adagio|largo|presto|bpm|=|slow|fast|ballad|swing", w)]
        creators = [f"{x.get('type')}: {(x.text or '').strip()}" for x in root.iter("creator")]
        inst = [(i.findtext("instrument-name") or "").strip() for i in root.iter("score-instrument")]
        harm = []
        for h in root.iter("harmony"):
            r = h.findtext("root/root-step") or ""
            al = h.findtext("root/root-alter")
            r += {"1": "#", "-1": "b"}.get((al or "").split(".")[0], "")
            kd = h.find("kind")
            if kd is not None:
                r += kd.get("text") if kd.get("text") is not None else (kd.text or "")
            harm.append(r)
            if len(harm) >= 16:
                break
        L = [f"CID {cid}",
             f"title: {b['title']} | song_name: {b['song_name']} | subtitle: {b.get('subtitle', '')}",
             f"composer: {b['composer']} | artist: {b['artist']} | xml creators: {creators}",
             f"licence: {b['licence']} | csv rating {b['rating']} ({b['n_ratings']}) views {b['n_views']}",
             f"shape: {a['shape']} | parts: {a['parts']}",
             f"instrument names: {inst}",
             f"staff count: {a['total_staves']} (max per part {a['max_staves']}) | metres: {a['meters']}",
             f"bars (longest part): {a['bars']} | chord symbols: {a['harmony']}",
             f"tempo marks: {tempos if tempos else 'none'} | tempo words: {tempo_words if tempo_words else 'none'}",
             f"key signatures: {keys}",
             f"rehearsal labels: {rehearsals if rehearsals else 'none'}",
             f"text directions (first 25): {words}",
             f"first chord symbols: {' '.join(harm) if harm else 'none'}"]
        keep = c.get("parts")  # optional explicit list of part ids to window; default by name
        omitted = []
        for bl in blocks:
            nm = len(bl["m"])
            pid = re.search(r"part (\S+) '", bl["head"]).group(1)
            name = re.search(r"'(.*)' measures", bl["head"]).group(1)
            main = (pid in keep) if keep else bool(re.search(r"(?i)piano|klavier|keyboard|stimme|voice|vocal|^$", name))
            L.append(f"\n##### {bl['head']}  ({nm} measure lines)")
            if not main and not c.get("all_parts"):
                omitted.append(name or pid)
                L.append("(not a piano/voice part: opening 8 bars only)")
                L.extend(x[:300] for x in bl["m"][:8])
                continue
            wins, notes = plan_windows(bl["m"], c.get("whole_if_le", 24))
            L.append("section/texture boundaries used: " + notes)
            for lo, hi, label in wins:
                L.append(f"--- {label}: lines {lo}-{hi} of {nm} ---")
                L.extend(x[:c.get("maxline", 900)] for x in bl["m"][lo - 1:hi])
        (outdir / "summary" / f"{sl}-{cid}.txt").write_text("\n".join(L) + "\n", encoding="utf-8")
        print("wrote", sl, cid)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("stage", choices=["search", "extract", "shape", "write"])
    ap.add_argument("--cache", required=True)
    a = ap.parse_args()
    cache = Path(a.cache)
    {"search": search, "extract": extract, "shape": shape, "write": lambda c: write(c, HERE)}[a.stage](cache)
