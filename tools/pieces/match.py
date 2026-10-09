"""Match wanted pieces (build/pieces/wanted.csv) against available score files (build/pieces/available.csv).

Every output row is a CANDIDATE, never a confirmation. Identity is settled later, by the quality check.

How a pair is scored (plain text comparison; nothing musical is judged):
  composer  the wanted composer's surname (accents removed, known spelling variants joined) must appear in the
            available row's composer, artist or title. Rows with no surname match are never compared.
  catalogue numbers and stated keys pulled from both titles (Op., No., BWV, HWV, K., Z, Hob., WoO, D.; "in G minor")
            are compared: "conflict" (dropped) when they name different numbers or keys; "match" when a strong
            catalogue number agrees, or opus and number agree; "partial" when the opus agrees but one side has no number.
  title     difflib ratio of the cleaned titles (composer names, keys and filler words removed).
  confidence  high = composer + catalogue match; medium = partial catalogue + title >= 0.60, or title >= 0.80;
              low = title >= 0.60.

Wanted rows are first merged into pieces (same composer surname + identical title text), keeping every source and level.

Usage: python tools/pieces/match.py [wanted.csv] [available.csv] [out.csv]   (defaults in build/pieces/)
"""
import csv, difflib, os, re, sys, unicodedata
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
B = os.path.join(ROOT, "build", "pieces")
csv.field_size_limit(10**9)

ALIASES = {  # spelling variants -> one key
    "handel": "handel", "haendel": "handel", "hendel": "handel",
    "tchaikovsky": "tchaikovsky", "tschaikowsky": "tchaikovsky", "tchaikowsky": "tchaikovsky", "chaikovsky": "tchaikovsky",
    "grechaninov": "grechaninov", "gretchaninov": "grechaninov", "gretchaninoff": "grechaninov", "grechaninoff": "grechaninov",
    "rachmaninoff": "rachmaninov", "rachmaninov": "rachmaninov", "rakhmaninov": "rachmaninov",
    "scriabin": "scriabin", "skryabin": "scriabin", "skrjabin": "scriabin",
    "prokofiev": "prokofiev", "prokofieff": "prokofiev", "prokofjew": "prokofiev",
    "kabalevsky": "kabalevsky", "kabalewski": "kabalevsky", "kabalevski": "kabalevsky",
    "mussorgsky": "mussorgsky", "moussorgsky": "mussorgsky", "musorgsky": "mussorgsky",
    "shostakovich": "shostakovich", "schostakowitsch": "shostakovich",
    "khachaturian": "khachaturian", "chatschaturjan": "khachaturian",
    "burgmuller": "burgmuller", "burgmueller": "burgmuller",
    "kohler": "kohler", "koehler": "kohler", "turk": "turk", "tuerk": "turk",
    "glinka": "glinka", "gedike": "goedicke", "goedicke": "goedicke", "gedicke": "goedicke",
}
FILLER = set("""in the a an of and from no nr num number op opus major minor maj min for piano solo easy
version arr arranged by mvt movement movt sharp flat c d e f g a b bb eb ab db gb""".split())
# Catalogue patterns. K. and D. are matched case-sensitively on the original text so that words and keys
# ("in D 3/4", "k" in titles) are not read as catalogue numbers.
CAT_RE = {
    "op": re.compile(r"\bop(?:us)?\.?\s*(\d+)", re.I),
    "no": re.compile(r"\b(?:no|nr|n°|nº)\.?\s*(\d+)", re.I),
    "bwv": re.compile(r"\bbwv\s*((?:anh\.?\s*)?\d+[a-z]?)", re.I),
    "hwv": re.compile(r"\bhwv\s*(\d+)", re.I),
    "k": re.compile(r"\bK(?:V)?\.?\s*(\d+[a-z]?)\b"),
    "z": re.compile(r"\bZ\.?\s*T?\s*(\d+)\b"),
    "hob": re.compile(r"\bhob\.?\s*([xvi]+)\s*[:/]?\s*(\d+)", re.I),
    "woo": re.compile(r"\bwoo\s*(\d+)", re.I),
    "d": re.compile(r"\bD\.?\s*(\d{2,3})\b"),
}
STRONG = ("bwv", "hwv", "k", "z", "hob", "woo", "d")
MOVEMENTS = ("allemande", "courante", "sarabande", "gavotte", "minuet", "menuet", "gigue", "bourree", "polonaise",
             "prelude", "fugue", "aria", "air", "march", "rondo", "scherzo", "trio", "musette", "passepied",
             "loure", "anglaise", "variation", "andante", "adagio", "allegro", "presto", "largo")
KEY_RE = re.compile(r"\b([a-g])(?:\s*|-)(flat|sharp|b|#)?\s*(major|minor|maj|min)\b")


def fold(s):
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def surname_keys(name):
    """Possible surname keys from a composer string: 'Hook J.', 'James Hook', 'Bach, Johann Sebastian'."""
    n = fold(name)
    n = re.sub(r"\(.*?\)", " ", n)
    toks = [t for t in re.split(r"[^a-z]+", n) if len(t) > 2]
    keys = {ALIASES.get(t, t) for t in toks}
    return keys - {"arr", "trad", "traditional", "anon", "anonymous", "unknown", "the", "von", "van", "der", "and"}


def catalogue(title):
    """Catalogue numbers by kind, plus the stated key, from a title."""
    out = {}
    for kind, rx in CAT_RE.items():
        text = title if kind in ("k", "z", "d") else fold(title)
        ms = rx.findall(text)
        if ms:
            out[kind] = {":".join(m) if isinstance(m, tuple) else m for m in ms}
    words = set(re.split(r"[^a-z]+", fold(title).replace("menuet", "minuet").replace("bourrée", "bourree")))
    mv = {m for m in MOVEMENTS if m in words}
    if mv:
        out["mvt"] = {m.replace("menuet", "minuet") for m in mv}
    km = KEY_RE.search(fold(title).replace("-flat", " flat").replace("-sharp", " sharp"))
    if km:
        acc = {"flat": "b", "b": "b", "sharp": "#", "#": "#"}.get(km.group(2) or "", "")
        out["key"] = {km.group(1) + acc + (" minor" if km.group(3).startswith("min") else " major")}
    return out


def clean_title(title, extra_names=()):
    t = fold(title)
    for rx in CAT_RE.values():
        t = rx.sub(" ", t)
    words = [w for w in re.split(r"[^a-z0-9]+", t) if w and w not in FILLER and w not in extra_names and not w.isdigit()]
    return " ".join(words)


def cat_compare(want, have):
    """'conflict' when the two name different numbers or keys; 'match' when an unambiguous identifier agrees
    (a strong catalogue number, or the same opus and the same number, or the same opus with no number on
    either side); 'partial' when the opus agrees but one side lacks the number; 'none' otherwise."""
    def differ(kind):
        return kind in want and kind in have and not (want[kind] & have[kind])
    if any(differ(k) for k in STRONG + ("op", "key", "mvt")):
        return "conflict"
    same_op = "op" in want and "op" in have
    if (same_op or ("op" not in want and "op" not in have)) and differ("no"):
        return "conflict"
    if any(k in want and k in have for k in STRONG):
        return "partial" if ("mvt" in want) != ("mvt" in have) else "match"
    if same_op:
        if "no" in want and "no" in have:
            return "match"
        if "no" not in want and "no" not in have:
            return "match"
        return "partial"
    return "none"


def main():
    wanted_p = sys.argv[1] if len(sys.argv) > 1 else os.path.join(B, "wanted.csv")
    avail_p = sys.argv[2] if len(sys.argv) > 2 else os.path.join(B, "available.csv")
    out_p = sys.argv[3] if len(sys.argv) > 3 else os.path.join(B, "matches.csv")

    pieces = {}
    for r in csv.DictReader(open(wanted_p, encoding="utf-8")):
        keys = surname_keys(r["composer"])
        if not keys:
            continue
        sk = sorted(keys)[0] if len(keys) == 1 else max(keys, key=len)
        ct = clean_title(r["title"], keys)
        pk = (sk, re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", fold(r["title"]))).strip())  # merge only identical titles
        p = pieces.setdefault(pk, {"surname": sk, "composer": r["composer"], "title": r["title"], "clean": ct,
                                   "cat": catalogue(r["title"] + " " + r.get("catalogue", "")), "sources": set()})
        p["sources"].add(f"{r['source']}={r['board_level']}" + (f"(ps{r['ps_level']})" if r.get("ps_level") else ""))
    wanted_surnames = {p["surname"] for p in pieces.values()}
    print(len(pieces), "wanted pieces;", len(wanted_surnames), "composers")

    index = defaultdict(list)
    n = 0
    for a in csv.DictReader(open(avail_p, encoding="utf-8")):
        n += 1
        hay = " ".join([a["composer"], a.get("subtitle", ""), a["title"]])
        keys = surname_keys(a["composer"]) | (surname_keys(hay) & wanted_surnames)
        hit = keys & wanted_surnames
        if not hit:
            continue
        a["_clean"] = clean_title(a["title"] + " " + a.get("subtitle", ""), keys)
        a["_cat"] = catalogue(a["title"] + " " + a.get("subtitle", "") + " " + a.get("catalogue", ""))
        for k in hit:
            index[k].append(a)
    print(n, "available rows;", sum(len(v) for v in index.values()), "indexed under wanted composers")

    cols = ["confidence", "composer", "title", "sources", "cat_match", "title_score", "a_source", "a_file",
            "a_composer", "a_title", "a_subtitle", "a_bars", "a_tracks", "a_rating", "a_n_ratings", "a_quarried_before"]
    stats = defaultdict(int)
    with open(out_p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for p in pieces.values():
            cands = []
            for a in index.get(p["surname"], []):
                cm = cat_compare(p["cat"], a["_cat"])
                if cm == "conflict":
                    continue
                ts = difflib.SequenceMatcher(None, p["clean"], a["_clean"]).ratio() if p["clean"] and a["_clean"] else 0.0
                conf = ("high" if cm == "match" else "medium" if (cm == "partial" and ts >= 0.60) or ts >= 0.80
                        else "low" if ts >= 0.60 else None)
                if conf:
                    cands.append((("high", "medium", "low").index(conf), -ts, conf, cm, ts, a))
            cands.sort(key=lambda c: (c[0], c[1], -(float(c[5].get("n_ratings") or 0) if (c[5].get("n_ratings") or "").replace(".", "").isdigit() else 0)))
            best = cands[0][2] if cands else "none"
            stats[best] += 1
            for _, _, conf, cm, ts, a in cands[:5]:
                w.writerow({"confidence": conf, "composer": p["composer"], "title": p["title"],
                            "sources": "; ".join(sorted(p["sources"])), "cat_match": cm, "title_score": f"{ts:.2f}",
                            "a_source": a["source"], "a_file": a["file"], "a_composer": a["composer"],
                            "a_title": a["title"], "a_subtitle": a.get("subtitle", ""), "a_bars": a.get("bars", ""),
                            "a_tracks": a.get("tracks", ""), "a_rating": a.get("rating", ""),
                            "a_n_ratings": a.get("n_ratings", ""), "a_quarried_before": a.get("quarried_before", "")})
            if not cands:
                w.writerow({"confidence": "none", "composer": p["composer"], "title": p["title"],
                            "sources": "; ".join(sorted(p["sources"]))})
    print(out_p, "best candidate per wanted piece:", dict(stats))


if __name__ == "__main__":
    main()
