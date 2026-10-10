"""Find beginner-level piano pieces in PDMX by code, for placement against published beginner books and syllabuses.

Selection (PDMX metadata only): PDMX's deduplicated copy; one piano part (tracks "0"); MuseScore complexity 0 or 1;
at most 64 bars; and at least one of: a composer of public-domain beginner methods, a tune that beginner methods
use, or "easy / beginner / first / primer / simple" in the title, subtitle or tags. Then each selected file is taken
from mxl.tar.gz and kept only if it has two staves (a left hand). Facts per file: bars, key signature, time, lowest
and highest note, notes per bar.

Nothing here says what level a piece is: that comes from a published book or syllabus (the other direction).
Output: build/pieces/beginner-pdmx.csv. Files extracted to build/pieces/files.
Usage: python tools/pieces/beginner_pdmx.py
"""
import csv, os, re, sys, tarfile, zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SESSION = os.path.dirname(ROOT)
FILES = os.path.join(ROOT, "build", "pieces", "files")
OUT = os.path.join(ROOT, "build", "pieces", "beginner-pdmx.csv")
csv.field_size_limit(10**9)

COMP = re.compile(r"beyer|t[uü]rk\b|czerny|gurlitt|k[oö]hler|le couppey|diabelli|spindler|streabbog|reinagle|schytte|"
                  r"duvernoy|lemoine|bertini|h[uü]nten|kirnberger|neefe|\bhook\b|attwood|latour|bart[oó]k|"
                  r"wohlfahrt|goedicke|gedike|maykapar|rebikov|melartin|lynes|biehl|vogel", re.I)
TUNE = re.compile(r"^(ode to joy|twinkle|mary had a little lamb|hot cross buns|lightly row|london bridge|jingle bells|"
                  r"au clair de la lune|when the saints|yankee doodle|old macdonald|fr[eè]re jacques|row,? row|"
                  r"good king wenceslas|amazing grace|aura lee|kum ?ba ?yah?|brahms.? lullaby|merrily we roll along|"
                  r"this old man|camptown races|oh,? susanna|skip to my lou|alouette|go tell aunt rhody|minuet in g|"
                  r"musette|silent night|we wish you a merry christmas|deck the hall|joy to the world|she.?ll be coming|"
                  r"home on the range|red river valley|my bonnie|greensleeves|scarborough fair|danny boy|"
                  r"morning has broken|for he.?s a jolly|happy birthday|the wheels on the bus|shortnin|"
                  r"largo|new world symphony|surprise symphony|william tell|can.?can|the entertainer|minuet)", re.I)
EASY = re.compile(r"\b(easy|beginner|beginners|first|primer|simple|elementary|for children)\b", re.I)


def staves(xml):
    st = max([int(s) for s in re.findall(r"<staves>(\d+)</staves>", xml)] or [1])
    return max(st, xml.count("<score-part "))


def facts(xml):
    import music21
    s = music21.converter.parseData(xml, format="musicxml")
    ps = [p for p in s.recurse().pitches]
    ms = list(s.parts[0].getElementsByClass(music21.stream.Measure))
    ks = next(iter(s.recurse().getElementsByClass(music21.key.KeySignature)), None)
    ts = next(iter(s.recurse().getElementsByClass(music21.meter.TimeSignature)), None)
    n = len(list(s.recurse().notes))
    return {"bars": len(ms), "keysig": "" if ks is None else ks.sharps, "time": ts.ratioString if ts else "",
            "lowest": min(ps).nameWithOctave if ps else "", "highest": max(ps).nameWithOctave if ps else "",
            "notes_per_bar": f"{n / max(len(ms), 1):.1f}"}


def main():
    sel = {}
    for d in csv.DictReader(open(os.path.join(SESSION, "PDMX.csv"), encoding="utf-8")):
        if d["subset:deduplicated"] != "True" or d["tracks"] != "0" or d["complexity"] not in ("0", "1"):
            continue
        try:
            if float(d["song_length.bars"]) > 64:
                continue
        except ValueError:
            continue
        comp = d["composer_name"] if d["composer_name"] != "NA" else d["artist_name"]
        title = d["title"] if d["title"] != "NA" else d["song_name"]
        why = [w for w, hit in (("composer", COMP.search(comp)), ("tune", TUNE.search(title.strip())),
                                ("easy", EASY.search(" ".join([title, d["subtitle"], d["tags"]])))) if hit]
        if why:
            sel[d["mxl"].lstrip("./")] = {"file": d["mxl"], "composer": "" if comp == "NA" else comp, "title": title,
                                          "subtitle": "" if d["subtitle"] == "NA" else d["subtitle"],
                                          "why": " ".join(why), "rating": d["rating"], "n_ratings": d["n_ratings"]}
    print(len(sel), "selected by metadata")
    os.makedirs(FILES, exist_ok=True)
    need = {m for m in sel if not os.path.exists(os.path.join(FILES, os.path.basename(m)))}
    if need:
        with tarfile.open(os.path.join(SESSION, "mxl.tar.gz"), "r:gz") as tf:
            for mem in tf:
                if mem.name.lstrip("./") in need:
                    data = tf.extractfile(mem).read()
                    open(os.path.join(FILES, os.path.basename(mem.name)), "wb").write(data)
    rows = []
    for m, r in sel.items():
        p = os.path.join(FILES, os.path.basename(m))
        try:
            z = zipfile.ZipFile(p)
            inner = next(n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META"))
            xml = z.read(inner).decode("utf-8", "replace")
        except Exception as e:
            continue
        if staves(xml) < 2:
            continue
        try:
            r.update(facts(xml))
        except Exception as e:
            r["bars"] = f"parse failed: {type(e).__name__}"
        rows.append(r)
    cols = ["composer", "title", "subtitle", "why", "bars", "keysig", "time", "lowest", "highest", "notes_per_bar",
            "rating", "n_ratings", "file"]
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(sorted(rows, key=lambda r: (r["composer"].lower(), r["title"].lower())))
    print(OUT, len(rows), "two-staff files")


if __name__ == "__main__":
    main()
