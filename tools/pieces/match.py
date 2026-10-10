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
              low = title >= 0.60; title-only = the wanted piece names no composer (ANZCA lists) and the cleaned
              title (two words or more) is identical.

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
    "k": re.compile(r"\b(?:K(?:V|p)?|k[vp]?)[.\-]?\s*(\d+[a-z]?)\b"),  # K. 545, KV 545, Kp. 380, k-34 (Pianocoda)
    "z": re.compile(r"\bZ\.?\s*T?\s*(\d+)\b"),
    "hob": re.compile(r"\bhob\.?\s*([xvi]+)\s*[:/]?\s*(\d+)", re.I),
    "book": re.compile(r"\b(?:book|vol(?:ume)?|heft)\.?\s*(\d+)\b", re.I),
    "woo": re.compile(r"\bwoo\s*(\d+)", re.I),
    "d": re.compile(r"\bD\.?\s*(\d{2,3})\b"),
}
# Movement numbers: "mvt 3", "Movement 1", "3rd movt", "1st movement", "Partita V 6th", "Sonata ...: II", "II. Andante"
ORD = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7}
MVTNO_RE = [re.compile(r"\b(?:mvt|movt|mvmt|movement|satz)\.?\s*(\d+)\b", re.I),
            re.compile(r"\b(\d)(?:st|nd|rd|th)\b", re.I),
            re.compile(r"\b(\d)\.\s*satz\b", re.I),
            re.compile(r"\b(first|second|third|fourth|fifth|sixth|seventh)\s+(?:movement|movt|mvt)\b", re.I),
            re.compile(r":\s*([IVX]+)\s*$"),
            re.compile(r"(?:^|[\s,;:-])([IVX]+)\.\s+[A-Z][a-z]")]
STRONG = ("bwv", "hwv", "k", "z", "hob", "woo", "d")
MOVEMENTS = ("allemande", "courante", "sarabande", "gavotte", "minuet", "menuet", "gigue", "bourree", "polonaise",
             "prelude", "fugue", "aria", "air", "march", "rondo", "scherzo", "trio", "musette", "passepied",
             "loure", "anglaise", "variation", "andante", "adagio", "allegro", "presto", "largo")
KEY_RE = re.compile(r"\b(?:in\s+([a-g])(?:[\s-]?(flat|sharp)|(b|#))?(?:\s+(major|minor|maj|min))?\b|([a-g])(?:[\s-]?(flat|sharp)|(b|#))?\s*(major|minor|maj|min)\b)")
ROMAN = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10, "xi": 11,
         "xii": 12, "xiii": 13, "xiv": 14, "xv": 15, "xvi": 16, "xvii": 17, "xviii": 18, "xix": 19, "xx": 20,
         "xxi": 21, "xxii": 22, "xxiii": 23, "xxiv": 24}
ROMAN_RE = re.compile(r"\b(partita|suite|sonata|sonatina|invention|sinfonia|prelude|preludium|etude|study|"
                      r"nocturne|waltz|valse|mazurka|polonaise|ballade|impromptu|lesson|variation)\s+([ivx]+)\b")


def fold(s):
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).lower().replace("_", " ")  # "Minuet_in_C_Minor"


def surname(name):
    """The surname of a composer string: 'Hook J.' / 'Hook, James' -> hook; 'James Hook' -> hook; '' if none."""
    n = re.sub(r"\(.*?\)", " ", fold(name)).strip()
    n = re.split(r"\s*(?:&|/|;|\band\b|\barr\.?)\s*", n)[0].strip()
    if not n or n in ("na", "unknown", "anon", "anonymous", "trad", "traditional"):
        return ""
    if "," in n:
        tok = n.split(",")[0].strip().split()
    else:
        toks = [t for t in re.split(r"[^a-z.\-']+", n) if t]
        if len(toks) >= 2 and re.fullmatch(r"([a-z]\.)+|[a-z]", toks[-1]):
            tok = toks[:1]                      # 'Hook J.' style
        else:
            tok = toks[-1:]                     # 'James Hook' style
    t = re.sub(r"[^a-z]", "", tok[-1] if tok else "")
    return ALIASES.get(t, t) if len(t) > 2 else ""


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
            out[kind] = {":".join(m) if isinstance(m, tuple) else re.sub(r"[\s.]", "", m) for m in ms}  # "Anh. 114" = "Anh 114"
    for m in re.findall(r"\bop(?:us)?\.?\s*\d+\s*/\s*(\d+)\b", fold(title)):  # "Op. 23/6" = Op. 23 No. 6
        out.setdefault("no", set()).add(m)
    for rx in MVTNO_RE:
        for m in rx.findall(title):
            n = ORD.get(m.lower()) or ROMAN.get(m.lower()) or (int(m) if m.isdigit() else None)
            if n:
                out.setdefault("mvtno", set()).add(str(n))
    for m in ROMAN_RE.finditer(fold(title)):  # "Partita I", "Sinfonia II" -> No. 1, No. 2
        if m.group(2) in ROMAN:
            out.setdefault("no", set()).add(str(ROMAN[m.group(2)]))
    words = set(re.split(r"[^a-z]+", fold(title).replace("menuetto", "minuet").replace("minuetto", "minuet").replace("menuet", "minuet")
                     .replace("bourrée", "bourree").replace("corrente", "courante")))
    mv = {m for m in MOVEMENTS if m in words}
    if mv:
        out["mvt"] = {m.replace("menuet", "minuet") for m in mv}
    km = KEY_RE.search(fold(title))
    if km:
        g = km.groups()
        root, accw, mode = (g[0], g[1] or g[2], g[3]) if g[0] else (g[4], g[5] or g[6], g[7])
        acc = {"flat": "b", "b": "b", "sharp": "#", "#": "#"}.get(accw or "", "")
        out["key"] = {root + acc}
        if mode:
            out["mode"] = {"minor" if mode.startswith("min") else "major"}
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
    if any(differ(k) for k in STRONG + ("op", "key", "mode", "mvt", "mvtno", "book")):
        return "conflict"
    same_op = "op" in want and "op" in have
    if differ("no"):  # different numbers: a conflict even when only one side names the opus
        return "conflict"
    if any(k in want and k in have for k in STRONG):
        return "partial" if ("mvt" in want) != ("mvt" in have) or ("mvtno" in want) != ("mvtno" in have) else "match"
    if same_op:
        if ("mvtno" in want) != ("mvtno" in have):  # one side names a movement, the other the whole work
            return "partial"
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
        sk = surname(r["composer"])  # "" = no composer: title-only
        ct = clean_title(r["title"], keys)
        pk = (sk, re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", fold(r["title"]))).strip())  # merge only identical titles
        p = pieces.setdefault(pk, {"surname": sk, "composer": r["composer"], "title": r["title"], "clean": ct,
                                   "cat": catalogue(r["title"] + " " + r.get("catalogue", "")), "sources": set()})
        p["sources"].add(f"{r['source']}={r['board_level']}" + (f"(ps{r['ps_level']})" if r.get("ps_level") else ""))
    wanted_surnames = {p["surname"] for p in pieces.values()} - {""}
    title_only = {p["clean"] for p in pieces.values() if not p["surname"] and len(p["clean"].split()) >= 2}
    print(len(pieces), "wanted pieces;", len(wanted_surnames), "composers")

    index = defaultdict(list)
    tindex = defaultdict(list)  # exact cleaned title -> rows, only for wanted pieces that have no composer
    n = 0
    for a in csv.DictReader(open(avail_p, encoding="utf-8")):
        n += 1
        if a.get("excluded"):  # known-wrong files (docs/pieces/exclusions.csv)
            continue
        own = surname(a["composer"])
        # the file's composer field decides; only when it names nobody are surname words in the title used
        keys = {own} if own else (surname_keys(a.get("subtitle", "") + " " + a["title"]) & wanted_surnames)
        if own and own not in wanted_surnames:  # 'Händel Georg Friedrich': surname written first, no comma
            first = re.sub(r"[^a-z]", "", (fold(a["composer"]).split() or [""])[0])
            if ALIASES.get(first, first) in wanted_surnames:
                keys = {ALIASES.get(first, first)}
        hit = keys & wanted_surnames
        if title_only:
            tk = clean_title(a["title"])
            if tk in title_only:
                a.setdefault("_cat", {})
                tindex[tk].append(a)
        if not hit:
            continue
        a["_clean"] = clean_title(a["title"] + " " + a.get("subtitle", ""), keys)
        a["_cat"] = catalogue(a["title"] + " " + a.get("subtitle", "") + " " + a.get("catalogue", ""))
        for k in hit:
            index[k].append(a)
    print(n, "available rows;", sum(len(v) for v in index.values()), "indexed under wanted composers")

    cols = ["confidence", "composer", "title", "sources", "cat_match", "title_score", "a_source", "a_file",
            "a_composer", "a_title", "a_subtitle", "a_bars", "a_tracks", "a_rating", "a_n_ratings", "a_quarried_before", "a_dedup"]
    stats = defaultdict(int)
    with open(out_p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for p in pieces.values():
            cands = []
            if not p["surname"]:
                for a in tindex.get(p["clean"], []):
                    cands.append((3, -1.0, "title-only", "none", 1.0, a))
            for a in index.get(p["surname"], []) if p["surname"] else []:
                cm = cat_compare(p["cat"], a["_cat"])
                if cm == "conflict":
                    continue
                ts = difflib.SequenceMatcher(None, p["clean"], a["_clean"]).ratio() if p["clean"] and a["_clean"] else 0.0
                conf = ("high" if cm == "match" else "medium" if (cm == "partial" and ts >= 0.60) or ts >= 0.80
                        else "low" if ts >= 0.60 else None)
                # the wanted title names a catalogue number and the file names none of that kind: a similar title
                # alone ("Sonata" / "Sonatina") is not enough for medium (sampled passes, 2026-10-10: 9 of 30 wrong)
                ids_w = {k for k in ("op",) + STRONG if k in p["cat"]}
                if conf == "medium" and ids_w and not ids_w & {k for k in ("op",) + STRONG if k in a["_cat"]} and (ts < 0.95 or len(p["clean"].split()) < 2):  # one generic word ("sonata") is never enough
                    conf = "low"
                if conf:
                    cands.append((("high", "medium", "low").index(conf), -ts, conf, cm, ts, a))
            cands.sort(key=lambda c: (c[0], c[1], c[5].get("dedup") == "no", -(float(c[5].get("n_ratings") or 0) if (c[5].get("n_ratings") or "").replace(".", "").isdigit() else 0)))
            best = cands[0][2] if cands else "none"
            stats[best] += 1
            for _, _, conf, cm, ts, a in cands[:5]:
                w.writerow({"confidence": conf, "composer": p["composer"], "title": p["title"],
                            "sources": "; ".join(sorted(p["sources"])), "cat_match": cm, "title_score": f"{ts:.2f}",
                            "a_source": a["source"], "a_file": a["file"], "a_composer": a["composer"],
                            "a_title": a["title"], "a_subtitle": a.get("subtitle", ""), "a_bars": a.get("bars", ""),
                            "a_tracks": a.get("tracks", ""), "a_rating": a.get("rating", ""),
                            "a_n_ratings": a.get("n_ratings", ""), "a_quarried_before": a.get("quarried_before", ""),
                            "a_dedup": a.get("dedup", "")})
            if not cands:
                w.writerow({"confidence": "none", "composer": p["composer"], "title": p["title"],
                            "sources": "; ".join(sorted(p["sources"]))})
    print(out_p, "best candidate per wanted piece:", dict(stats))


if __name__ == "__main__":
    main()
