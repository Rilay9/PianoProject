"""Builds the local ChatGPT review bundle for the chosen pieces (docs/pieces/chosen.csv) under
build/pieces/chatgpt-bundle/ (gitignored). Per piece: score.musicxml (uncompressed, bytes exactly as stored; for .mxl the
rootfile named in META-INF/container.xml), score.pdf (Verovio SVG pages -> one HTML -> headless Microsoft Edge print-to-PDF),
results.json (characteristics.jsonl object + "D02" difficulty-check row), info.txt. Also index.csv and zip part(s) < 100 MB.

Usage: python tools/pieces/review_bundle.py [--limit N] [--no-zip] [--force]
  --limit N  only the first N rows of chosen.csv (pilot; no zip). --no-zip skips zipping. Rerunnable: folders whose
  score.pdf already passes the content check are not re-rendered unless --force is given.
"""
import csv, glob, json, os, re, subprocess, sys, tempfile, time, unicodedata, zipfile
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
OUT = os.path.join(ROOT, "build", "pieces", "chatgpt-bundle")
ZIP_LIMIT = 95 * 1024 * 1024
EDGES = [r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", r"C:/Program Files/Microsoft/Edge/Application/msedge.exe"]
RESULTS_LINE = ("results.json comes from tools/pieces/characteristics (commit 4f0aa2b5); "
                "field meanings are in each row's file docstring")


def path_of(f):  # same resolution as tools/pieces/characteristics/run_all.py
    return os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)


def slug(composer, title):
    s = unicodedata.normalize("NFKD", f"{composer} {title}").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")[:60]


def musicxml_bytes(path):
    if path.lower().endswith(".mxl"):
        with zipfile.ZipFile(path) as z:
            c = z.read("META-INF/container.xml").decode("utf-8", "replace")
            root = re.search(r'<rootfile\b[^>]*full-path="([^"]+)"', c).group(1)
            return z.read(root)
    return open(path, "rb").read()


def to_str(b):
    for enc in ("utf-8-sig", "utf-16", "latin-1"):
        try:
            return b.decode(enc)
        except UnicodeDecodeError:
            pass


def render_svgs(xml_bytes):
    """(svg pages, number of Verovio "[Error]" log lines); Verovio writes its log to the C-level stderr, so fd 2 is captured."""
    import verovio
    tk = verovio.toolkit()
    tk.setOptions({"pageWidth": 2100, "pageHeight": 2970, "scale": 42, "pageMarginLeft": 60, "pageMarginRight": 60,
                   "pageMarginTop": 60, "pageMarginBottom": 60, "breaks": "auto", "adjustPageHeight": False})
    with tempfile.TemporaryFile() as cap:
        saved = os.dup(2)
        os.dup2(cap.fileno(), 2)
        try:
            loaded = tk.loadData(to_str(xml_bytes))
            svgs = [tk.renderToSVG(i) for i in range(1, tk.getPageCount() + 1)] if loaded else []
        finally:
            os.dup2(saved, 2)
            os.close(saved)
        cap.seek(0)
        nerr = cap.read().decode("utf-8", "replace").count("[Error]")
    if not loaded:
        raise RuntimeError("verovio loadData failed")
    return svgs, nerr


def edge_exe():
    for e in EDGES:
        if os.path.exists(e):
            return e
    raise RuntimeError("msedge.exe not found")


def make_pdf(svgs, pdf_path, tmp):
    html = os.path.join(tmp, "pages.html")
    body = "".join(f'<div class="p">{s}</div>' for s in svgs)
    open(html, "w", encoding="utf-8").write(
        "<!doctype html><meta charset='utf-8'><style>@page{size:210mm 297mm;margin:0}html,body{margin:0;padding:0}"
        ".p{width:210mm;height:296mm;overflow:hidden;page-break-after:always;break-after:page}"
        ".p>svg{width:210mm;height:296mm;display:block}</style><body>" + body + "</body>")
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    cmd = [edge_exe(), "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--user-data-dir={os.path.join(tmp, 'prof')}",
           f"--print-to-pdf={pdf_path}", "file:///" + html.replace("\\", "/")]
    subprocess.run(cmd, timeout=300, capture_output=True)
    # Edge may return before the PDF is written: wait until it exists and its size stops changing.
    last, deadline = -1, time.time() + 300
    while time.time() < deadline:
        size = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
        if size > 0 and size == last:
            return
        last = size
        time.sleep(1)
    raise RuntimeError("edge produced no pdf")


def pdf_check(pdf_path):
    """(ok, pages): at least one page and every page has drawings or text."""
    import pymupdf
    try:
        d = pymupdf.open(pdf_path)
        bad = [i for i, p in enumerate(d) if not (p.get_drawings() or p.get_text().strip())]
        return (len(d) > 0 and not bad), len(d)
    except Exception:  # noqa: BLE001
        return False, 0


def multi_note(xml_bytes, title):
    s = to_str(xml_bytes) or ""
    starts = len(re.findall(r'<measure\b[^>]*\bnumber="1"', s))
    parts = max(1, len(re.findall(r"<score-part\b", s)))
    names = re.findall(r"<(?:work-title|movement-title)>([^<]*)<", s)
    hint = bool(re.search(r"\b(mvt|movement|1st|2nd|3rd|first|second|third)\b", title, re.I))
    if starts > parts or hint:
        return ("This file may hold more than the chosen piece (title names a single movement or the file restarts bar 1 "
                f"{starts} times across {parts} parts; XML titles: {names}). The whole file is rendered.")
    return ""


def load_side():
    chars = {}
    for line in open(os.path.join(ROOT, "build", "pieces", "characteristics.jsonl"), encoding="utf-8"):
        o = json.loads(line)
        chars[o["file"]] = o
    d02 = {r["file"]: r for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "difficulty-check.csv"), encoding="utf-8"))}
    return chars, d02


def do_one(args):
    n, row, chars, d02, force = args
    folder = f"{n:03d}_{row['level']}_{slug(row['composer'], row['title'])}"
    d = os.path.join(OUT, folder)
    os.makedirs(d, exist_ok=True)
    rec = {"folder": folder, "level": row["level"], "composer": row["composer"], "title": row["title"], "pages": 0,
           "musicxml_bytes": 0, "pdf_ok": False, "note": ""}
    notes = []
    try:
        src = path_of(row["candidate_file"])
        xb = musicxml_bytes(src)
        open(os.path.join(d, "score.musicxml"), "wb").write(xb)
        rec["musicxml_bytes"] = len(xb)
        f = row["candidate_file"]
        res = dict(chars.get(f) or {"file": f, "missing_from_characteristics_jsonl": True})
        res["D02"] = d02.get(f)
        json.dump(res, open(os.path.join(d, "results.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
        mn = multi_note(xb, row["title"])
        open(os.path.join(d, "info.txt"), "w", encoding="utf-8").write(
            f"composer: {row['composer']}\ntitle: {row['title']}\npublished level: {row['level']}\nsource file: {f}\n"
            + (mn + "\n" if mn else "") + RESULTS_LINE + "\n")
        if mn:
            notes.append("whole file rendered; may hold more than chosen piece")
        if f not in chars:
            notes.append("no characteristics.jsonl row")
        if res["D02"] is None:
            notes.append("no D02 row")
        pdf = os.path.join(d, "score.pdf")
        if force or not (os.path.exists(pdf) and pdf_check(pdf)[0]):
            svgs, nerr = render_svgs(xb)
            if nerr:
                notes.append(f"verovio logged {nerr} import errors (rendering may drop or misdraw some notes)")
            with tempfile.TemporaryDirectory() as tmp:
                make_pdf(svgs, pdf, tmp)
        rec["pdf_ok"], rec["pages"] = pdf_check(pdf)
    except Exception as e:  # noqa: BLE001
        notes.append(f"FAILED: {type(e).__name__}: {e}")
    rec["note"] = "; ".join(notes)
    return rec


def zip_bundle():
    for z in glob.glob(os.path.join(OUT, "bundle*.zip")):
        os.remove(z)
    folders = sorted(x for x in os.listdir(OUT) if os.path.isdir(os.path.join(OUT, x)))
    sizes = {x: sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(os.path.join(OUT, x)) for f in fs) for x in folders}
    idx = os.path.join(OUT, "index.csv")
    groups, cur, cs = [], [], 0
    for x in folders:
        if cur and cs + sizes[x] > ZIP_LIMIT:
            groups.append(cur)
            cur, cs = [], 0
        cur.append(x)
        cs += sizes[x]
    if cur:
        groups.append(cur)
    names = []
    for i, g in enumerate(groups, 1):
        name = "bundle.zip" if len(groups) == 1 else f"bundle-part{i}.zip"
        with zipfile.ZipFile(os.path.join(OUT, name), "w", zipfile.ZIP_DEFLATED) as z:
            z.write(idx, "index.csv")
            for x in g:
                for r, _, fs in os.walk(os.path.join(OUT, x)):
                    for f in fs:
                        p = os.path.join(r, f)
                        z.write(p, os.path.relpath(p, OUT))
        names.append(name)
    return names


def main():
    a = sys.argv[1:]
    limit = int(a[a.index("--limit") + 1]) if "--limit" in a else None
    rows = list(csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "chosen.csv"), encoding="utf-8")))
    if limit:
        rows = rows[:limit]
    os.makedirs(OUT, exist_ok=True)
    chars, d02 = load_side()
    jobs = [(i, r, chars, d02, "--force" in a) for i, r in enumerate(rows, 1)]
    with Pool(4) as p:
        recs = p.map(do_one, jobs, chunksize=1)
    with open(os.path.join(OUT, "index.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, ["folder", "level", "composer", "title", "pages", "musicxml_bytes", "pdf_ok", "note"])
        w.writeheader()
        w.writerows(recs)
    print(f"{len(recs)} rows; pdf_ok {sum(r['pdf_ok'] for r in recs)}; failures: "
          + str([(r['folder'], r['note']) for r in recs if not r['pdf_ok']]))
    if "--no-zip" not in a and not limit:
        print("zips:", zip_bundle())


if __name__ == "__main__":
    main()
