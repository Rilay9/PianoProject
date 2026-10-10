"""Find Mutopia reference PDFs for candidate pieces, with no model involved (as pianocoda_refs.py does for Pianocoda).

1. docs/sources/catalogues/mutopia.csv lists Mutopia's keyboard pieces (composer, title, catalogue number, page URL).
2. Each wanted piece whose MusicXML candidate fits the facts (docs/pieces/quality.csv) and that has no Pianocoda pair
   yet is matched to those entries by the matcher's own rules (surname, catalogue numbers, keys, movements, title
   similarity >= 0.6).
3. For each match the Mutopia page is fetched with curl, its A4 PDF link read, the PDF downloaded and page 1's top
   rendered to PNG. Mutopia engravings are LilyPond editions made apart from MuseScore/PDMX.

Output: build/pieces/refs/mutopia-<id>.pdf/.png and docs/pieces/review/mutopia-matches.csv (same columns as
pianocoda-matches.csv; the page URL goes in pianocoda_url so the batch tools read both files alike).
Usage: python tools/pieces/mutopia_refs.py
"""
import csv, difflib, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REFS = os.path.join(ROOT, "build", "pieces", "refs")
csv.field_size_limit(10**9)
sys.path.insert(0, os.path.dirname(__file__))
from match import surname, catalogue, cat_compare, clean_title  # noqa: E402
from pianocoda_refs import curl, kfix  # noqa: E402
import summarise as S  # noqa: E402
from movements import named_movements  # noqa: E402


def main():
    os.makedirs(REFS, exist_ok=True)
    cat = []
    for r in csv.DictReader(open(os.path.join(ROOT, "docs", "sources", "catalogues", "mutopia.csv"), encoding="utf-8")):
        comp = re.sub(r"\s*\(.*?\)", "", r["composer"])
        t = kfix(r["title"] + " " + r["catalogue"])
        cat.append({"url": r["url"], "composer": comp, "surname": surname(comp), "title": t,
                    "cat": catalogue(t), "clean": clean_title(r["title"])})
    done = {r["candidate_file"] for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "review",
                                                                           "pianocoda-matches.csv"), encoding="utf-8"))}
    rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "quality.csv"), encoding="utf-8"))
            if r["a_file"].lower().endswith((".mxl", ".musicxml", ".xml")) and r["verdict"] == "facts fit"
            and r["a_file"] not in done]
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
        for p in cat:
            if p["surname"] != sn:
                continue
            cm = cat_compare(wcat, p["cat"])
            if cm == "conflict":
                continue
            ts = difflib.SequenceMatcher(None, wclean, p["clean"]).ratio() if wclean and p["clean"] else 0
            strong = any(k in wcat and k in p["cat"] for k in ("bwv", "k", "hob", "d"))
            if cm == "match" or ts >= 0.6 or (cm == "partial" and strong):
                cands.append((cm == "none", -ts, p, cm, ts))
        if cands:
            cands.sort(key=lambda c: (c[0], c[1]))
            # a "Prelude and Fugue" listed as one piece: Mutopia keeps the two apart; the opening is read against the
            # Praeludium and the ending against the Fuga
            mv = named_movements(title)
            ordw = {n: f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n if n < 20 else n % 10, 'th')}" for n in range(1, 40)}
            if mv:  # the list names movement(s): opening from the first named, ending from the last named
                st = [c for c in cands if ordw[mv[0]] + " movement" in c[2]["title"].lower()]
                en = [c for c in cands if ordw[mv[-1]] + " movement" in c[2]["title"].lower()]
                if st:
                    cands = st + [c for c in cands if c not in st]
                end_url = en[0][2]["url"] if en and en[0] is not cands[0] else ""
            elif "prelude" in title.lower() and "fugue" in title.lower():
                pre = [c for c in cands if "praeludium" in c[2]["title"].lower() or "prelude" in c[2]["title"].lower()]
                fug = [c for c in cands if "fuga" in c[2]["title"].lower() or "fugue" in c[2]["title"].lower()]
                if pre:
                    cands = pre + [c for c in cands if c not in pre]
                end_url = fug[0][2]["url"] if fug else ""
            else:
                end_url = ""
            _, _, p, cm, ts = cands[0]
            out.append({"composer": comp, "title": title, "levels": " ".join(sorted(S.app_levels(r["sources"])[0])),
                        "candidate_file": r["a_file"], "candidate_title": r["a_title"], "pianocoda_url": p["url"],
                        "cat_match": cm, "title_score": f"{ts:.2f}", "drive_id": "", "png": "", "end_url": end_url, "end_png": ""})
    print(len(out), "wanted pieces matched to a Mutopia page")
    import pymupdf
    for o in out:
        mid = re.search(r"id=(\d+)", o["pianocoda_url"]).group(1)
        pdf, png = os.path.join(REFS, f"mutopia-{mid}.pdf"), os.path.join(REFS, f"mutopia-{mid}.png")
        if not os.path.exists(pdf):
            html = curl(o["pianocoda_url"])
            m = re.search(r'href="([^"]+-a4\.pdf)"', html) or re.search(r'href="([^"]+\.pdf)"', html)
            if not m:
                o["png"] = "no PDF link"
                continue
            link = m.group(1) if m.group(1).startswith("http") else "https://www.mutopiaproject.org/" + m.group(1).lstrip("/")
            curl(link, pdf)
        if not os.path.exists(pdf) or open(pdf, "rb").read(4) != b"%PDF":
            o["png"] = "download is not a PDF"
            continue
        if o.get("end_url"):
            eid = re.search(r"id=(\d+)", o["end_url"]).group(1)
            epdf = os.path.join(REFS, f"mutopia-{eid}.pdf")
            if not os.path.exists(epdf):
                eh = curl(o["end_url"])
                em = re.search(r'href="([^"]+-a4\.pdf)"', eh) or re.search(r'href="([^"]+\.pdf)"', eh)
                if em:
                    curl(em.group(1) if em.group(1).startswith("http") else "https://www.mutopiaproject.org/" + em.group(1).lstrip("/"), epdf)
            if os.path.exists(epdf) and open(epdf, "rb").read(4) == b"%PDF":
                epng = os.path.join(REFS, f"mutopia-{eid}-end.png")
                pymupdf.open(epdf)[-1].get_pixmap(dpi=120).save(epng)
                o["end_png"] = os.path.relpath(epng, ROOT).replace("\\", "/")
        try:
            d = pymupdf.open(pdf)
            pg = d[0]
            pg.get_pixmap(dpi=130, clip=pymupdf.Rect(0, 0, pg.rect.width, pg.rect.height * 0.7)).save(png)
            o["png"] = os.path.relpath(png, ROOT).replace("\\", "/")
        except Exception as e:
            o["png"] = f"render failed: {type(e).__name__}"
    p = os.path.join(ROOT, "docs", "pieces", "review", "mutopia-matches.csv")
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys()) if out else ["composer"])
        w.writeheader()
        w.writerows(out)
    print(p, sum(1 for o in out if o["png"].endswith(".png")), "rendered")


if __name__ == "__main__":
    main()
