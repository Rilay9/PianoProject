"""Match every song-candidate list to the score files we can get, and run the code checks on the files found (the
owner, 2026-10-10: books and sites give song candidates and placement; files come from better sources; check by script).

Candidate lists: docs/sources/lists/8notes-piano*.csv (8notes' own levels), the book and method lists
(8notes-candidates, archive-methods, beginner-methods, faber-*, learnandmaster-songs, piano-aio-dummies,
pianofordummies), the songs named per rung in docs/pieces/review/rung-suggestions.md, and the exam lists (ABRSM,
RCM, Trinity, styles, PSyllabus) through build/pieces/wanted.csv.

Files: available.csv plus the shelf files (build/pieces/shelf/shelf.csv), matched by match.py (high, medium and
title-only matches kept; low dropped); every matched file, up to match.py's five per song (the owner, 2026-10-10:
check them all), MusicXML only, PDMX duplicate copies left out. Songs already in docs/pieces/chosen.csv (same
composer and title words with no catalogue, movement or key clash) and files already chosen are left out.
The exam lists (wanted.csv) are matched again with the current matcher and their unchosen matches added as list
"exam-lists" with their sources.

On each file: two staves in one or two parts and no part named for another instrument (quality_check.not_piano),
the code checks (file_checks.check: bars, opening; the title check against each song's title), the Level B fit
(level_fit.fits_b, a reading of rungs.md, not a published grading) and the rungs a file may show (rung_pieces.RULES:
possible examples found by notation features, not proof that a piece teaches the skill). Per-file facts are cached in
build/pieces/file-facts.json.

A list's level is the level of that source's own arrangement or lesson, not of the file found; the file's facts are
listed beside it so a reader can see whether the file is the same kind of arrangement.

Output: build/pieces/new-candidates.csv. Usage: python tools/pieces/candidates.py
"""
import csv, glob, json, os, re, subprocess, sys, tarfile
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


def layout(path):
    """Staves, parts and part names, read from the MusicXML text."""
    import zipfile
    if path.endswith(".mxl"):
        z = zipfile.ZipFile(path)
        xml = z.read(next(n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META")))
    else:
        xml = open(path, "rb").read()
    xml = xml.decode("utf-8", "replace")
    blocks = re.findall(r"<score-part\b.*?</score-part>", xml, re.S)
    names = [" ".join(re.findall(r"<(?:part-name|instrument-name)[^>]*>([^<]*)<", b)) for b in blocks]
    return max([int(s) for s in re.findall(r"<staves>(\d+)</staves>", xml)] or [1]), len(blocks), names


def examine(path):
    """Facts of one file that need parsing (cached by path): layout, bar and opening checks, features."""
    from file_checks import check
    from rung_pieces import features
    from level_fit import extra
    from quality_check import not_piano
    r = {}
    try:
        st, parts, names = layout(path)
        r["staves"] = f"{st} staves, {parts} parts"
        r["instruments"] = " | ".join(n.strip() for n in names) if any(n.strip() for n in names) else "unknown (parts unnamed)"
        if st < 2 and parts < 2:
            return {**r, "fault": "one staff"}
        if parts > 2:
            return {**r, "fault": f"{parts} parts (not a two-hand piano layout)"}
        if not_piano(names):
            return {**r, "fault": f"not piano: part '{not_piano(names)[:40]}'"}
        notes, fail = check(path, "", "")  # bars and opening; the title check is done per song in main()
        f = features(path, [])
        big, bars = extra(path)
        r.update({"fault": "; ".join(notes) if fail else "", "notes": "; ".join(n for n in notes if not fail),
                  "features": {k: (list(v) if isinstance(v, tuple) else v) for k, v in f.items()},
                  "biggest_chord": big, "file_bars": bars})
    except Exception as e:
        r["fault"] = f"parse failed ({type(e).__name__})"
    return r


EXAMINE_VERSION = "2026-10-10b"


def in_pool(row):
    """A file row the candidate pass may match: not a PDMX duplicate copy."""
    return not (row["source"] == "pdmx" and row.get("dedup") == "no")


def code_version():
    """A fingerprint of the code that produces the cached facts (ChatGPT's script review H5)."""
    import hashlib
    h = hashlib.sha1()
    h.update(EXAMINE_VERSION.encode())  # bump when examine() or layout() below changes
    for name in ("file_checks.py", "rung_pieces.py", "level_fit.py", "quality_check.py", "movements.py"):  # examine() reads no titles
        h.update(open(os.path.join(os.path.dirname(__file__), name), "rb").read())
    return h.hexdigest()[:12]


def fingerprint(path, code):
    try:
        st = os.stat(path)
        return f"{st.st_size}:{int(st.st_mtime)}:{code}"
    except OSError:
        return ""


def key_warning(want, keysig):
    """'' when the list names no key or the file's key signature fits it; otherwise a short warning."""
    from quality_check import SHARPS_TO_KEYS, ENHARMONIC
    if "key" not in want or keysig in (None, ""):
        return ""
    maj, mnr = SHARPS_TO_KEYS.get(int(keysig), ("", ""))
    fits = {maj, mnr, ENHARMONIC.get(maj, ""), ENHARMONIC.get(mnr, "")}
    mode = next(iter(want.get("mode", [])), "")
    k = next(iter(want["key"]))
    if mode == "major":
        fits = {maj, ENHARMONIC.get(maj, "")}
    elif mode == "minor":
        fits = {mnr, ENHARMONIC.get(mnr, "")}
    return "" if k in fits else f"list says {k} {mode}".strip() + f"; file key signature {keysig}"


def path_of(f):
    return os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)


def main():
    from match import catalogue, cat_compare
    from pianocoda_refs import kfix
    from rung_pieces import RULES
    from level_fit import fits_b
    from quality_check import NONPIANO
    cands = songs()
    print(len(cands), "songs from", dict(Counter(s["list"] for s in cands)))
    # 1. a wanted-style list and an available pool with the shelf files added; match.py does the matching, for the
    #    lists and again for wanted.csv (the exam lists), so both use the current matcher
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
        # PDMX duplicate copies are left out here, before match.py keeps its best five per song, so five copies cannot
        # crowd out the canonical upload (ChatGPT's script review H3)
        w.writerows(x for x in rd if in_pool(x))
        for r in csv.DictReader(open(os.path.join(B, "shelf", "shelf.csv"), encoding="utf-8")):
            if r["ok"] == "True":
                w.writerow({"source": "shelf", "file": r["file"].replace("\\", "/"), "composer": r["composer"],
                            "title": r["title"], "dedup": "yes"})
    out_m, out_x = os.path.join(B, "cand-matches.csv"), os.path.join(B, "cand-exam-matches.csv")
    me = os.path.join(os.path.dirname(__file__), "match.py")
    subprocess.run([sys.executable, me, want, pool, out_m], check=True)
    subprocess.run([sys.executable, me, os.path.join(B, "wanted.csv"), pool, out_x], check=True)
    # 2. files to examine: every matched file not already chosen (the owner: check them all); PDMX's duplicate
    #    copies left out (FABLE: PDMX copies excluded)
    chosen = list(csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "chosen.csv"), encoding="utf-8")))
    chosen_files = {c["candidate_file"].replace("\\", "/") for c in chosen}
    chosen_by = defaultdict(list)
    for c in chosen:
        chosen_by[(surname(c["composer"]), clean_title(c["title"], surname_keys(c["composer"])))].append(catalogue(kfix(c["title"])))

    def already(m):  # same composer and words and an agreeing catalogue identity; no identity = not known to be chosen
        # (ChatGPT's script review M4: a generic "Minuet" with no number is not proof of the same piece)
        k = (surname(m["composer"]), clean_title(m["title"], surname_keys(m["composer"])))
        cw = catalogue(kfix(m["title"]))
        return any(cat_compare(cw, cc) == "match" for cc in chosen_by.get(k, []))

    per = defaultdict(list)
    exam = {}
    for tag, mp in (("lists", out_m), ("exam-lists", out_x)):
        for m in csv.DictReader(open(mp, encoding="utf-8")):
            if m["confidence"] not in ("high", "medium", "title-only") or not m["a_file"].endswith((".mxl", ".xml", ".musicxml")):
                continue
            if m["a_source"] == "pdmx" and m["a_dedup"] == "no":
                continue
            if m["a_file"] in chosen_files or already(m):
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
        print(len(need), "files to take from mxl.tar.gz", flush=True)
        with tarfile.open(os.path.join(SESSION, "mxl.tar.gz"), "r:gz") as tf:
            for mem in tf:
                if mem.name.lstrip("./") in need:
                    open(os.path.join(FILES, os.path.basename(mem.name)), "wb").write(tf.extractfile(mem).read())
    cache_p = os.path.join(B, "file-facts.json")
    cache = json.load(open(cache_p, encoding="utf-8")) if os.path.exists(cache_p) else {}
    code = code_version()
    paths = {path_of(m["a_file"]) for v in per.values() for m in v}
    jobs = sorted(x for x in paths if cache.get(x, {}).get("sig") != fingerprint(x, code))
    print(len(jobs), "files to examine (others cached)", flush=True)
    with Pool(3) as p:  # FABLE: at most 3 worker processes
        for n, (j, r) in enumerate(zip(jobs, p.imap(examine, jobs, chunksize=4)), 1):
            cache[j] = {**r, "sig": fingerprint(j, code)}
            if n % 250 == 0:
                print(n, "examined", flush=True)
                json.dump(cache, open(cache_p, "w", encoding="utf-8"))
    json.dump(cache, open(cache_p, "w", encoding="utf-8"))
    # 3. one row per (song in a list, file); the title check is per song, on the file's title and subtitle
    def songs_of(k, m):  # every list song behind a match row: match.py merges songs with the same surname and title
        # and writes their ids ("c2=; c5032=") in sources; looking songs up by one spelling lost the others
        if k[0] == "exam-lists":
            return [exam[k]]
        return [cands[int(i)] for i in re.findall(r"\bc(\d+)=", m["sources"])]
    rows = []
    for k, ms in per.items():
        for m in ms:
            r = cache[path_of(m["a_file"])]
            ftitle = (m["a_title"] + " " + m.get("a_subtitle", "")).strip()
            fault = r.get("fault", "")
            if not fault and cat_compare(catalogue(kfix(m["title"])), catalogue(kfix(ftitle))) == "conflict":
                fault = f"number: file title '{ftitle[:50]}' conflicts"
            inst = NONPIANO.search(ftitle)  # "Theme for Cello + Piano": the parts may be unnamed, the title says it
            if not fault and inst and not NONPIANO.search(m["title"]):
                fault = f"file title names another instrument ({inst.group(0)})"
            kw = key_warning(catalogue(m["title"]), r.get("features", {}).get("keysig"))
            out = {"staves": r.get("staves", ""), "instruments": r.get("instruments", ""), "key_warning": kw, "code_checks": ("fail: " + fault) if fault else ("pass" + (f" ({r['notes']})" if r.get("notes") else ""))}
            if "features" in r:
                f = defaultdict(int, r["features"])
                ok, why = fits_b(f, r["biggest_chord"], r["file_bars"])
                out.update({"fits_b": ok, "outside_b": "; ".join(why), "keysig": f["keysig"], "file_bars": r["file_bars"],
                            "range": f"{f['range'][0]}-{f['range'][1]}", "biggest_chord": r["biggest_chord"],
                            "rungs_shown": " ".join(g for g, (_, t) in RULES.items() if t(f))})
            for s in songs_of(k, m):
                rows.append({"list": s["list"], "list_level": s["level"], "skill": s["skill"], "rung": s["rung"],
                             "composer": s["composer"], "title": s["title"], "confidence": m["confidence"],
                             "cat_match": m["cat_match"], "title_score": m["title_score"],
                             "file": m["a_file"], "file_source": m["a_source"], "file_composer": m["a_composer"],
                             "file_title": ftitle, "n_ratings": m["a_n_ratings"], **out, "url": s["url"]})
    cols = ["list", "list_level", "skill", "rung", "composer", "title", "confidence", "cat_match", "title_score", "file",
            "file_source", "file_composer", "file_title", "n_ratings", "staves", "instruments", "code_checks", "key_warning", "fits_b", "outside_b",
            "keysig", "file_bars", "range", "biggest_chord", "rungs_shown", "url"]
    out = os.path.join(B, "new-candidates.csv")
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, restval="")
        w.writeheader()
        w.writerows(rows)
    ok = [r for r in rows if r["code_checks"].startswith("pass")]
    print(out, len(rows), "rows;", len(ok), "pass the code checks")
    print("Passing rows by match confidence:", Counter(r["confidence"] for r in ok))
    for lst in sorted({r["list"] for r in rows}):
        songs_ok = {(r["composer"], r["title"]) for r in ok if r["list"] == lst}
        print(f"  {lst}: {len({(r['composer'], r['title']) for r in rows if r['list'] == lst})} songs with a file, "
              f"{len(songs_ok)} with a file passing")
    print("Fails:", Counter(r["code_checks"].split(":")[1].strip().split(" ")[0] for r in rows if not r["code_checks"].startswith("pass")).most_common(8))


if __name__ == "__main__":
    main()
