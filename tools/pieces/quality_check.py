"""Quality check on match candidates: read plain facts from each candidate score and flag what does not fit.

Reads docs/pieces/matches.csv (high and medium candidates). For each candidate file:
  piano      instruments/part names and staves: is it a piano (or harpsichord/keyboard) score?
  key        first key signature, compared with the key named in the wanted title (root and, if stated, mode;
             a key signature allows its major and its relative minor)
  time       first time signature
  bars       number of measures in the first part
  words      words in the file's title/subtitle that mark another arrangement or instrument
A row is "facts fit" when nothing is flagged; otherwise the flags say why. Neither is a confirmation of identity:
that is checked against a printed score only for pieces chosen for a rung.

Files: PDMX scores are pulled from <session>/mxl.tar.gz (one streamed pass) into build/pieces/files/;
kern files are read in place; Mutopia files are not on disk and are marked "not checked".
music21 parses each file, in at most 3 worker processes; files over 1.5 MB are not parsed (flagged "large").

Usage: python tools/pieces/quality_check.py [matches.csv] [out.csv]   (defaults docs/pieces/matches.csv, build/pieces/quality.csv)
"""
import csv, os, re, sys, tarfile
from concurrent.futures import ProcessPoolExecutor

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SESSION = os.path.dirname(ROOT)
FILES = os.path.join(ROOT, "build", "pieces", "files")
csv.field_size_limit(10**9)
sys.path.insert(0, os.path.dirname(__file__))
from match import catalogue  # noqa: E402  (title key parsing is shared with the matcher)

ARR_WORDS = re.compile(r"\b(easy|easier|simplified|simple version|beginner|arr\.?|arranged|arrangement|transcri\w*|"
                       r"version|cover|duet|4 hands|four hands|flute|violin|cello|guitar|ukulele|clarinet|sax\w*|"
                       r"trumpet|voice|vocal|choir|satb|orchestra\w*|organ|accordion|lead sheet|melody only)\b", re.I)
KEYBOARD = re.compile(r"piano|klavier|pianoforte|keyboard|harpsichord|cembalo|clavecin|clavichord|fortepiano", re.I)
SHARPS_TO_KEYS = {n: (maj, mnr) for n, maj, mnr in [
    (-7, "cb", "ab"), (-6, "gb", "eb"), (-5, "db", "bb"), (-4, "ab", "f"), (-3, "eb", "c"), (-2, "bb", "g"),
    (-1, "f", "d"), (0, "c", "a"), (1, "g", "e"), (2, "d", "b"), (3, "a", "f#"), (4, "e", "c#"), (5, "b", "g#"),
    (6, "f#", "d#"), (7, "c#", "a#")]}
ENHARMONIC = {"db": "c#", "c#": "db", "gb": "f#", "f#": "gb", "cb": "b", "b": "cb", "ab": "g#", "g#": "ab",
              "eb": "d#", "d#": "eb", "bb": "a#", "a#": "bb"}


def facts(path):
    """Plain notation facts from one score file (runs in a worker process)."""
    out = {"parsed": "", "parts": "", "instruments": "", "staves": "", "keysig": "", "time": "", "bars": "", "error": ""}
    try:
        path, _, tune = path.partition("#")  # ABC tunes: file#X
        if os.path.getsize(path) > 1_500_000 and not tune:
            out["error"] = "large, not parsed"
            return out
        import music21
        s = music21.converter.parse(path, number=int(tune)) if tune else music21.converter.parse(path)
        parts = list(s.parts)
        names = []
        for p in parts:
            inst = p.getInstrument(returnDefault=False)
            names.append(" ".join(x for x in [p.partName or "", inst.instrumentName if inst else "",
                                              inst.__class__.__name__ if inst else ""] if x))
        ks = s.recurse().getElementsByClass(music21.key.KeySignature).first()
        ts = s.recurse().getElementsByClass(music21.meter.TimeSignature).first()
        out.update({"parsed": "yes", "parts": str(len(parts)), "instruments": " | ".join(names)[:200],
                    "staves": str(sum(1 for p in parts if isinstance(p, music21.stream.PartStaff)) or len(parts)),
                    "keysig": "" if ks is None else str(ks.sharps), "time": ts.ratioString if ts else "",
                    "bars": str(len(parts[0].getElementsByClass(music21.stream.Measure))) if parts else ""})
    except Exception as e:
        out["error"] = f"parse failed: {type(e).__name__}"
    return out


def judge(row, f):
    flags = []
    if row["a_source"].lower() == "mutopia":
        return "not checked", "Mutopia file not downloaded"
    if f.get("error"):
        flags.append(f["error"])
    if f.get("parsed") == "yes":
        inst = f["instruments"]
        if inst.strip(" |") and not KEYBOARD.search(inst) and int(f["parts"] or 0) > 1:  # unnamed parts (kern) pass
            flags.append(f"not piano? ({inst[:60]})")
        if int(f["parts"] or 0) > 3:
            flags.append(f"{f['parts']} parts")
        want = catalogue(row["title"])
        if "key" in want and f["keysig"] not in ("", "None"):
            maj, mnr = SHARPS_TO_KEYS.get(int(f["keysig"]), ("", ""))
            root = next(iter(want["key"]))
            mode = next(iter(want.get("mode", {""})))
            ok_roots = {maj, ENHARMONIC.get(maj, maj)} if mode == "major" else \
                       {mnr, ENHARMONIC.get(mnr, mnr)} if mode == "minor" else \
                       {maj, mnr, ENHARMONIC.get(maj, maj), ENHARMONIC.get(mnr, mnr)}
            if root not in ok_roots:
                flags.append(f"key: list says {root} {mode}".strip() + f", file has {f['keysig']} sharps")
    if row.get("a_dedup") == "no":
        flags.append("not the deduplicated copy (PDMX duplicate flag)")
    words = ARR_WORDS.findall(" ".join([row["a_title"], row["a_subtitle"]]))
    want_arr = bool(re.search(r"\barr\.", row["title"], re.I))
    if words:
        flags.append("file title: " + ", ".join(sorted({w.lower() for w in words})))
    if want_arr:
        flags.append("the list grades one specific arrangement")
    return ("facts fit" if not flags else "flagged"), "; ".join(flags)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "docs", "pieces", "matches.csv")
    out_p = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "build", "pieces", "quality.csv")
    rows = [r for r in csv.DictReader(open(src, encoding="utf-8")) if r["confidence"] in ("high", "medium")]
    print(len(rows), "high/medium candidate rows")
    os.makedirs(FILES, exist_ok=True)

    want = {r["a_file"].lstrip("./") for r in rows if r["a_source"] == "pdmx"}
    have = {n for n in want if os.path.exists(os.path.join(FILES, os.path.basename(n)))}
    need = want - have
    if need:
        print("extracting", len(need), "PDMX files")
        with tarfile.open(os.path.join(SESSION, "mxl.tar.gz"), "r|gz") as tf:
            for m in tf:
                n = m.name.lstrip("./")
                if n in need:
                    open(os.path.join(FILES, os.path.basename(n)), "wb").write(tf.extractfile(m).read())
                    need.discard(n)
                    if not need:
                        break
        print("not found in archive:", len(need))

    def local(r):
        if r["a_source"] == "pdmx":
            return os.path.join(FILES, os.path.basename(r["a_file"]))
        if r["a_source"] == "Mutopia":
            return ""
        return os.path.join(ROOT, r["a_file"])  # kern, musetrainer, on-disk Mutopia, downloaded datasets (ABC: file#X)
    paths = sorted({local(r) for r in rows if local(r) and os.path.exists(local(r).partition("#")[0])})
    print("parsing", len(paths), "files with 3 workers")
    with ProcessPoolExecutor(max_workers=3) as ex:
        fmap = dict(zip(paths, ex.map(facts, paths, chunksize=8)))

    cols = list(rows[0].keys()) + ["parsed", "parts", "instruments", "staves", "keysig", "time", "bars", "verdict", "flags"]
    counts = {}
    with open(out_p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in rows:
            fa = fmap.get(local(r), {"error": "file not available"} if r["a_source"] != "Mutopia" else {})
            verdict, flags = judge(r, fa)
            counts[verdict] = counts.get(verdict, 0) + 1
            w.writerow({**r, **{k: fa.get(k, "") for k in ["parsed", "parts", "instruments", "staves", "keysig", "time", "bars"]},
                        "verdict": verdict, "flags": flags})
    print(out_p, counts)


if __name__ == "__main__":
    main()
