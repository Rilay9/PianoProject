"""Find Pianocoda reference PDFs for candidate pieces, with no model involved.

1. Pianocoda's post sitemap lists its piece pages as https://pianocoda.com/<composer>/<title-slug>/.
2. Each wanted piece whose MusicXML candidate fits the facts (docs/pieces/quality.csv) is matched to those pages by
   the matcher's own rules (surname, catalogue numbers, keys, movements, title similarity >= 0.6).
3. For each match the page is fetched with curl, its Google Drive file id read, the PDF downloaded and the top of
   page 1 rendered to PNG, for a reader (agent) to compare bars 1-8 with the candidate's text in docs/pieces/review/.

Output: build/pieces/refs/<composer>__<slug>.pdf/.png and docs/pieces/review/pianocoda-matches.csv.
Usage: python tools/pieces/pianocoda_refs.py
"""
import csv, difflib, os, re, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REFS = os.path.join(ROOT, "build", "pieces", "refs")
csv.field_size_limit(10**9)
sys.path.insert(0, os.path.dirname(__file__))
from match import surname, catalogue, cat_compare, clean_title, fold  # noqa: E402
import summarise as S  # noqa: E402


def kfix(title):
    """Köchel/Kirkpatrick numbers as the matcher reads them: Pianocoda slugs are lower case ("k-34") and lists write
    "Kp. 380"; the matcher's K pattern needs an upper-case K."""
    return re.sub(r"\b[Kk]p?\.?\s*(\d)", r"K \1", title)


def curl(url, out=None):
    args = ["curl", "-sSL", "--compressed", "-A", "Mozilla/5.0", url]
    if out:
        args += ["-o", out]
    r = subprocess.run(args, capture_output=True)
    return r.stdout.decode("utf-8", "replace") if not out else r.returncode == 0


def main():
    os.makedirs(REFS, exist_ok=True)
    sm = curl("https://pianocoda.com/post-sitemap.xml")
    pages = []
    for url in re.findall(r"<loc>(https://pianocoda\.com/[^<]+)</loc>", sm):
        parts = url.rstrip("/").split("/")
        if len(parts) < 5:
            continue
        comp, slug = parts[-2], parts[-1]
        title = kfix(slug.replace("-", " "))
        pages.append({"url": url, "composer": comp, "surname": surname(comp.replace("-", " ")),
                      "title": title, "cat": catalogue(title), "clean": clean_title(title)})
    print(len(pages), "Pianocoda pages")

    rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "quality.csv"), encoding="utf-8"))
            if r["a_file"].lower().endswith((".mxl", ".musicxml", ".xml")) and r["verdict"] == "facts fit"]
    best = {}
    for r in rows:
        k = (r["composer"], r["title"])
        if k not in best or (r["confidence"] == "high" and best[k]["confidence"] != "high"):
            best[k] = r
    out = []
    for (comp, title), r in best.items():
        sn = surname(comp)
        if not sn:
            continue
        wcat, wclean = catalogue(kfix(title)), clean_title(title, {sn})
        cands = []
        for p in pages:
            if p["surname"] != sn and sn not in p["composer"]:
                continue
            cm = cat_compare(wcat, p["cat"])
            if cm == "conflict":
                continue
            ts = difflib.SequenceMatcher(None, wclean, p["clean"]).ratio() if wclean and p["clean"] else 0
            if cm == "match" or ts >= 0.6:
                cands.append((cm != "match", -ts, p, cm, ts))
        if cands:
            cands.sort(key=lambda c: (c[0], c[1]))
            _, _, p, cm, ts = cands[0]
            out.append({"composer": comp, "title": title, "levels": " ".join(sorted(S.app_levels(r["sources"])[0])),
                        "candidate_file": r["a_file"], "candidate_title": r["a_title"], "pianocoda_url": p["url"],
                        "cat_match": cm, "title_score": f"{ts:.2f}"})
    print(len(out), "wanted pieces matched to a Pianocoda page")

    for o in out:
        name = re.sub(r"[^a-z0-9]+", "-", fold(o["pianocoda_url"].split("pianocoda.com/")[1])).strip("-")
        pdf, png = os.path.join(REFS, name + ".pdf"), os.path.join(REFS, name + ".png")
        o["drive_id"], o["png"] = "", ""
        if not os.path.exists(pdf):
            html = curl(o["pianocoda_url"])
            m = re.search(r"drive\.google\.com/file/d/([\w-]+)", html) or re.search(r"[?&]id=([\w-]{20,})", html)
            if not m:
                continue
            o["drive_id"] = m.group(1)
            curl(f"https://drive.google.com/uc?export=download&id={m.group(1)}", pdf)
        if open(pdf, "rb").read(4) != b"%PDF":  # Drive answers some ids with an HTML 404 page
            o["png"] = "download is not a PDF"
            continue
        try:
            import pymupdf
            d = pymupdf.open(pdf)
            pg = d[0]
            pg.get_pixmap(dpi=130, clip=pymupdf.Rect(0, 0, pg.rect.width, pg.rect.height * 0.7)).save(png)
            o["png"] = os.path.relpath(png, ROOT).replace("\\", "/")
        except Exception as e:
            o["png"] = f"render failed: {type(e).__name__}"
    p = os.path.join(ROOT, "docs", "pieces", "review", "pianocoda-matches.csv")
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys()) if out else ["composer"])
        w.writeheader()
        w.writerows(out)
    print(p, sum(1 for o in out if o["png"].endswith(".png")), "rendered")


if __name__ == "__main__":
    main()
