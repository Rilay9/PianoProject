"""Select the pieces of the spelling comparison and write sp_pieces.json.

Rules, fixed before any method was scored (nothing here reads a result):

GROUND TRUTH FOR THE FALSE-FLAG RATE: published scores whose spelling is taken as correct.
  wir   = every piece directory under Corpus/Keyboard_Other and Corpus/Piano_Sonatas of the When in Rome checkout that
          holds a local score.mxl (81 pieces: Bach WTC I, Chopin, Debussy, Dvorak, Grieg, Liszt, Medtner, Schumann,
          Tchaikovsky, Beethoven, Mozart). Textbooks, Variations_and_Grounds and pieces that hold only remote.json are out
          (textbook examples are 1 to 8 bars and several are written to show a spelling; remote.json points at no score).
  m21ch = the music21 corpus's Bach chorales, taken by file name: bwvN.M.mxl (cantata chorales, no suffix) and
          bwvNNN.mxl with NNN from 250 to 438 (the Riemenschneider chorales). The variants with a suffix (-sc, -a, -w, -lz,
          -inst, -lpz), the .krn and .xml duplicates and the arias/recitatives are out.
  m21kb = the music21 corpus's keyboard-only tonal works, chosen by listing the small composer folders and keeping the
          pieces whose parts are all piano/keyboard: bach/bwv846, chopin/mazurka06-2 (.krn, converted by music21),
          cpebach/h186, joplin/maple_leaf_rag, mozart/k545/movement1_exposition, schumann_clara/polonaise_op1n1..n4
          (9 pieces). Schoenberg op. 19 (atonal, spelling is a free choice) is out.
OUR CATALOGUE (no ground truth for spelling; flags are candidates): every catalogue item with a file, in three groups by id:
  gen = id starts with "exercise." ; pdmx = id contains "pdmx" ; other = the rest.

Run: <main>/.venv/Scripts/python.exe -X utf8 sp_select.py
"""
from cmp_common import *
import re
from music21 import corpus, converter

CHORALE_A = re.compile(r"^bwv\d+\.\d+\.mxl$")
CHORALE_B = re.compile(r"^bwv(2[5-9]\d|3\d\d|4[0-3]\d)\.mxl$")
M21_KB = ["bach/bwv846.mxl", "chopin/mazurka06-2.krn", "cpebach/h186.mxl", "joplin/maple_leaf_rag.mxl",
          "mozart/k545/movement1_exposition.mxl", "schumann_clara/polonaise_op1n1.mxl", "schumann_clara/polonaise_op1n2.mxl",
          "schumann_clara/polonaise_op1n3.mxl", "schumann_clara/polonaise_op1n4.mxl"]


def main():
    pieces = []
    for sub in ("Keyboard_Other", "Piano_Sonatas"):
        for r, d, f in os.walk(WIR / "Corpus" / sub):
            if "score.mxl" in f:
                rel = Path(r).relative_to(WIR).as_posix()
                pieces.append({"key": "wir:" + rel, "set": "wir", "path": str(Path(r) / "score.mxl"), "label": rel})
    pieces.sort(key=lambda p: p["key"])
    root = Path(corpus.__file__).parent
    ch = []
    for p in corpus.getComposer("bach"):
        n = Path(str(p)).name
        if CHORALE_A.match(n) or CHORALE_B.match(n):
            ch.append({"key": "m21ch:" + n, "set": "m21ch", "path": str(p), "label": "bach/" + n})
    ch.sort(key=lambda p: p["key"])
    pieces += ch
    conv = BUILD / "sp_conv"; conv.mkdir(exist_ok=True)
    for rel in M21_KB:
        src = root / rel
        path = src
        if src.suffix == ".krn":
            path = conv / (rel.replace("/", "_") + ".musicxml")
            if not path.exists():
                converter.parse(str(src)).write("musicxml", fp=str(path))
        pieces.append({"key": "m21kb:" + rel, "set": "m21kb", "path": str(path), "label": "corpus/" + rel})
    for it in sorted(BYID.values(), key=lambda x: x["id"]):
        i = it["id"]
        g = "gen" if i.startswith("exercise.") else ("pdmx" if "pdmx" in i else "other")
        pieces.append({"key": "cat:" + i, "set": "cat_" + g, "path": str(CONTENT / it["file"]), "label": i})
    json.dump({"pieces": pieces}, open(HERE / "sp_pieces.json", "w", encoding="utf8"), ensure_ascii=False, indent=0)
    import collections
    print(collections.Counter(p["set"] for p in pieces))


if __name__ == "__main__":
    main()
