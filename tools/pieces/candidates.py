"""Match every song-candidate list to the score files we can get, and run the code checks on the files found (the
owner, 2026-10-10: books and sites give song candidates and placement; files come from better sources; check by script).

Candidate lists: docs/sources/lists/8notes-piano*.csv (8notes' own levels), the book and method lists
(8notes-candidates, archive-methods, beginner-methods, faber-*, learnandmaster-songs, piano-aio-dummies,
pianofordummies), and the songs named per rung in docs/pieces/review/rung-suggestions.md. The exam lists
(ABRSM, RCM, Trinity, styles) are not here: they went through wanted.csv already.

Files: available.csv plus the shelf files (build/pieces/shelf/shelf.csv), matched by match.py (high, medium and
title-only matches kept; low dropped); every matched file, up to match.py's five per song, MusicXML only; songs or files already in
docs/pieces/chosen.csv are left out. On each file: two staves in one or two parts, the code checks (file_checks.check), the Level B fit
(level_fit.fits_b, a reading of rungs.md, not a published grading) and the rungs a file shows (rung_pieces.RULES).

A list's level is the level of that source's own arrangement or lesson, not of the file found; the file's facts are
listed beside it so a reader can see whether the file is the same kind of arrangement.

Also the exam-list matches (build/pieces/matches.csv) not chosen yet, as list "exam-lists" with their sources.

Output: build/pieces/new-candidates.csv. Usage: python tools/pieces/candidates.py
"""
import csv, glob, os, re, subprocess, sys, tarfile
from collections import Counter, defaultdict
from multiprocessing import Pool

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SESSION = os.path.dirname(ROOT)
B = os.path.join(ROOT, "build", "pieces")
FILES = os.path.join(B, "files")
LISTS = os.path.join(ROOT, "docs", "sources", "lists")
sys.path.insert(0, os.path.dirname(__file__))
from match import surname, clean_title, surname_keys  # noqa: E402
csv.field_size_limit(10**9)

BOOKS = ["8notes-candidates", "archive-methods-candidates", "beginner-methods", "faber-2b-performance",
         "faber-accelerated-1-pieces", "faber-adult-allinone-pieces", "learnandmaster-songs",
         "piano-aio-dummies-candidates", "pianofordummies-candidates"]
NOBODY = re.compile(r"^(trad\.?|traditional|anon\.?|anonymous|unknown|various|folk ?song|spiritual|hymn|)$", re.I)
PAREN = re.compile(r"\s*\((?:[^()]*\b(?:version|easy|beginner|level|public domain|creative commons|trad\.?|"
                   r"anthem|theme from)\b[^()]*)\)", re.I)


def tidy(title):
    return re.sub(r"\s+", " ", PAREN.sub("", title)).strip()


def songs():
    out = []
    for p in sorted(glob.glob(os.path.join(LISTS, "8notes-piano*.csv"))):
        for r in csv.DictReader(open(p, encoding="utf-8")):
            out.append({"list": "8notes", "level": r["list_level"], "composer": r["artist"], "title": r["title"],
                        "skill": " ".join(x for x in (r["style"], r["tags"]) if x)[:120], "rung": "", "url": r["url"]})
    for name in BOOKS:
        for r in csv.DictReader(open(os.path.join(LISTS, name + ".csv"), encoding="utf-8")):
            lv = next((f"{k} {r[k]}" for k in ("level", "unit", "chapter", "section", "session", "lesson_book_1_pages")
                       if r.get(k)), "")
            out.append({"list": name, "level": lv, "composer": r.get("composer", ""), "title": r["title"],
                        "skill": (r.get("teaches") or r.get("skill") or r.get("unit_concept") or "")[:120],
                        "rung": "", "url": r.get("source_url", "")})
    rung = ""
    for line in open(os.path.join(ROOT, "docs", "pieces", "review", "rung-suggestions.md"), encoding="utf-8"):
        h = re.match(r"### ([A-Z]{0,2}\d*\.?\d+[a-z]?)\b", line)
        if line.startswith("### "):
            rung = h.group(1) if h else ""
        m = re.match(r"- (.+?) - ", line)
        if rung and m and not m.group(1).startswith(("PVL", "H ", "Mismatch")):
            t = m.group(1).replace("(also in 8notes list)", "").strip()
            c = re.search(r"\(([^()]+)\)\s*$", t)
            comp = c.group(1) if c and not re.search(r"original|op\.|no\.|anthem|\d", c.group(1), re.I) else ""
            t = re.sub(r"\s*\([^()]*\)\s*$", "", t) if c else t
            out.append({"list": "rung-suggestions", "level": rung, "composer": comp, "title": t, "skill": "",
                        "rung": rung, "url": ""})
    for s in out:
        c = re.sub(r"\s*\([^()]*\)", "", s["composer"]).strip()
        s["composer"] = "" if NOBODY.match(c) else c
        s["title"] = tidy(s["title"])
    return [s for s in out if s["title"]]


def staves(path):
    import zipfile
    if path.endswith(".mxl"):
        z = zipfile.ZipFile(path)
        xml = z.read(next(n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META")))
    else:
        xml = open(path, "rb").read()
    xml = xml.decode("utf-8", "replace")
    return max([int(s) for s in re.findall(r"<staves>(\d+)</staves>", xml)] or [1]), xml.count("<score-part ")


def examine(job):
    path, title, ftitle = job
    from file_checks import check
    from rung_pieces import features, RULES
    from level_fit import extra, fits_b
    r = {}
    try:
        st, parts = staves(path)
        r["staves"] = f"{st} staves, {parts} parts"
        if st < 2 and parts < 2:
            return {**r, "code_checks": "fail: one staff"}
        if parts > 2:
            return {**r, "code_checks": f"fail: {parts} parts (not a two-hand piano layout)"}
        notes, fail = check(path, title, ftitle)
        f = features(path, [])
        big, bars = extra(path)
        ok, why = fits_b(f, big, bars)
        r.update({"code_checks": ("fail: " if fail else "pass") + ("; ".join(notes) if notes else ""),
                  "fits_b": ok, "outside_b": "; ".join(why), "keysig": f["keysig"], "file_bars": bars,
                  "range": f"{f['range'][0]}-{f['range'][1]}", "biggest_chord": big,
                  "rungs_shown": " ".join(k for k, (_, t) in RULES.items() if t(f))})
    except Exception as e:
        r["code_checks"] = f"fail: parse failed ({type(e).__name__})"
    return r


def path_of(f):
    return os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)


def main():
    cands = songs()
    print(len(cands), "songs from", dict(Counter(s["list"] for s in cands)))
    # 1. a wanted-style list and an available pool with the shelf files added; match.py does the matching
    want = os.path.join(B, "cand-wanted.csv")
    with open(want, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["source", "board_level", "ps_level", "composer", "title", "catalogue"])
        for i, s in enumerate(cands):
            w.writerow([f"c{i}", "", "", s["composer"], s["title"], ""])
    pool = os.path.join(B, "available-plus-shelf.csv")
    with open(os.path.join(B, "available.csv"), encoding="utf-8") as a, open(pool, "w", encoding="utf-8", newline="") as o:
        rd = csv.DictReader(a)
        w = csv.DictWriter(o, fieldnames=rd.fieldnames)
        w.writeheader()
        w.writerows(rd)
        for r in csv.DictReader(open(os.path.join(B, "shelf", "shelf.csv"), encoding="utf-8")):
            if r["ok"] == "True":
                w.writerow({"source": "shelf", "file": r["file"].replace("\\", "/"), "composer": r["composer"],
                            "title": r["title"], "dedup": "yes"})
    out_m = os.path.join(B, "cand-matches.csv")
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "match.py"), want, pool, out_m], check=True)
    # 2. files to examine: up to two per song, not already chosen
    chosen = list(csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "chosen.csv"), encoding="utf-8")))
    chosen_files = {c["candidate_file"].replace("\\", "/") for c in chosen}
    chosen_keys = {(surname(c["composer"]), clean_title(c["title"], surname_keys(c["composer"]))) for c in chosen}
    per = defaultdict(list)  # every matched file (match.py keeps the best five per song), the owner: check them all
    exam = {}
    for tag, mp in (("lists", out_m), ("exam-lists", os.path.join(B, "matches.csv"))):
        for m in csv.DictReader(open(mp, encoding="utf-8")):
            if m["confidence"] not in ("high", "medium", "title-only") or not m["a_file"].endswith((".mxl", ".xml", ".musicxml")):
                continue
            if m["a_file"] in chosen_files or (surname(m["composer"]), clean_title(m["title"], surname_keys(m["composer"]))) in chosen_keys:
                continue
            k = (tag, m["composer"], m["title"])
            per[k].append(m)
            if tag == "exam-lists":
                exam[k] = {"list": "exam-lists", "level": m["sources"], "composer": m["composer"], "title": m["title"],
                           "skill": "", "rung": "", "url": ""}
    print(len(per), "songs with a file not already chosen;", sum(map(len, per.values())), "files")
    need = {m["a_file"].lstrip("./") for v in per.values() for m in v
            if m["a_file"].startswith("./mxl") and not os.path.exists(path_of(m["a_file"]))}
    if need:
        print(len(need), "files to take from mxl.tar.gz")
        with tarfile.open(os.path.join(SESSION, "mxl.tar.gz"), "r:gz") as tf:
            for mem in tf:
                if mem.name.lstrip("./") in need:
                    open(os.path.join(FILES, os.path.basename(mem.name)), "wb").write(tf.extractfile(mem).read())
    jobs = sorted({(path_of(m["a_file"]), m["title"], m["a_title"]) for v in per.values() for m in v})
    print(len(jobs), "files to examine", flush=True)
    res = {}
    with Pool(max(1, os.cpu_count() - 2)) as p:
        for n, (j, r) in enumerate(zip(jobs, p.imap(examine, jobs, chunksize=4)), 1):
            res[j] = r
            if n % 250 == 0:
                print(n, "examined", flush=True)
    # 3. one row per (song in a list, file)
    by_key = defaultdict(list)
    for i, s in enumerate(cands):
        by_key[("lists", s["composer"], s["title"])].append(s)
    for k, s in exam.items():
        by_key[k].append(s)
    rows = []
    for k, ms in per.items():
        for m in ms:
            r = res[(path_of(m["a_file"]), m["title"], m["a_title"])]
            for s in by_key.get(k, []):
                rows.append({"list": s["list"], "list_level": s["level"], "skill": s["skill"], "rung": s["rung"],
                             "composer": s["composer"], "title": s["title"], "confidence": m["confidence"],
                             "file": m["a_file"], "file_source": m["a_source"], "file_composer": m["a_composer"],
                             "file_title": m["a_title"], "n_ratings": m["a_n_ratings"], **r, "url": s["url"]})
    cols = ["list", "list_level", "skill", "rung", "composer", "title", "confidence", "file", "file_source",
            "file_composer", "file_title", "n_ratings", "staves", "code_checks", "fits_b", "outside_b", "keysig",
            "file_bars", "range", "biggest_chord", "rungs_shown", "url"]
    out = os.path.join(B, "new-candidates.csv")
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, restval="")
        w.writeheader()
        w.writerows(rows)
    ok = [r for r in rows if r["code_checks"].startswith("pass")]
    print(out, len(rows), "rows;", len(ok), "pass the code checks")
    for lst in sorted({r["list"] for r in rows}):
        songs_ok = {(r["composer"], r["title"]) for r in ok if r["list"] == lst}
        print(f"  {lst}: {len({(r['composer'], r['title']) for r in rows if r['list'] == lst})} songs with a file, "
              f"{len(songs_ok)} with a file passing")
    print("Passing files by 8notes level:", Counter(r["list_level"] for r in ok if r["list"] == "8notes"))
    print("Passing files that fit Level B:", len({r["file"] for r in ok if r["fits_b"] is True}))
    print("Empty rungs shown by passing files:",
          {g: len({r["file"] for r in ok if g in r["rungs_shown"].split()}) for g in ("B.7", "B.8", "1.5", "1.6", "2.6", "3.3")})


if __name__ == "__main__":
    main()
