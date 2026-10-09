"""Shared helpers for the spelling comparison (docs/classifier/evidence/1A/comparison/spelling.md).

Run every script here with the main checkout's .venv (music21 10.5.0, partitura 1.9.0), `-X utf8`, from anywhere:
    <main>/.venv/Scripts/python.exe -X utf8 docs/classifier/evidence/1A/comparison/<script>.py
Only pks_run.py runs in build/venv-pkspell (reached as C:/vpks through a directory junction; torch, no partitura).
Paths: WT = this worktree (scripts, tools/classifier, build/), MAIN = the main checkout (catalogue content, read in place),
WIR = When in Rome as checked out by the pilot (read only).

The current detector (validation/r_sanity.py, the chunk-1 validator that implements rule 26) is executed from its source with
two stated changes, both made by string replacement here and checked against the original's own counts (sp_check_repro.py):
  1. its `cands[:6]` / `hits[:5]` example truncations are removed so every flag is returned;
  2. the module-level paths (WT, walk's HERE) point at the real locations (it was written to run from build/val).
"""
import json, sys, os, re, time, types, warnings, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
WIR = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-a4c3527d6a9a67355/build/when-in-rome")
VALID = HERE.parent / "validation"
BUILD = WT / "build"
OUT = HERE                       # per-item JSON and fragments are written beside the scripts
sys.path.insert(0, str(WT / "tools/classifier"))
sys.path.insert(0, str(VALID))
BUILD.mkdir(exist_ok=True)
(BUILD / "sp_walkcache").mkdir(exist_ok=True)

# ----------------------------------------------------------------------------- the validators' raw walk, re-pointed
def _root_xml(path):
    path = Path(path)
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as z:
            names = z.namelist()
            rf = None
            if "META-INF/container.xml" in names:
                c = ET.fromstring(z.read("META-INF/container.xml"))
                for e in c.iter():
                    if e.tag.endswith("rootfile"):
                        rf = e.get("full-path"); break
            if rf is None:
                rf = [n for n in names if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))][0]
            return ET.fromstring(z.read(rf))
    return ET.parse(path).getroot()


def _load_walk():
    src = (VALID / "walk.py").read_text(encoding="utf8")
    src = src.replace("HERE = Path(__file__).resolve().parent", "HERE = _CONTENT")
    src = src.replace('cdir = HERE / "cache"', 'cdir = _CACHE')
    src = src.split('if __name__ == "__main__":')[0]
    mod = types.ModuleType("walk")
    mod.__dict__.update({"_CONTENT": CONTENT, "_CACHE": BUILD / "sp_walkcache"})
    exec(compile(src, str(VALID / "walk.py") + " (re-pointed)", "exec"), mod.__dict__)
    mod.__dict__["root_xml"] = _root_xml         # plain .xml/.musicxml as well as .mxl (walk() looks root_xml up in its globals)
    sys.modules["walk"] = mod
    return mod


walk = _load_walk()
BYID = walk.BYID


def walk_path(path, key):
    """Raw walk of any MusicXML/.mxl file, cached by `key` (an id not in the catalogue)."""
    BYID[key] = {"id": key, "title": key, "hands": "both", "file": str(Path(path).resolve())}
    return walk.cache(key)


def _load_sanity():
    src = (VALID / "r_sanity.py").read_text(encoding="utf8")
    src = src.replace('WT = Path(__file__).resolve().parents[2]', 'WT = _WT')
    src = src.replace('"ex": cands[:6]', '"ex": cands').replace('"ex": hits[:5]', '"ex": hits').replace('"ex": cands[:5]', '"ex": cands')
    src = src.split('if __name__ == "__main__":')[0]
    mod = types.ModuleType("r_sanity_exec")
    mod.__dict__.update({"_WT": WT, "__name__": "r_sanity_exec"})
    exec(compile(src, str(VALID / "r_sanity.py") + " (re-pointed, untruncated)", "exec"), mod.__dict__)
    return mod


# ----------------------------------------------------------------------------- reading a score into a note array
def load_notes(path, hands="both"):
    """The project's reader (tools/classifier/score.py `load`); if it raises (its pickup test, line 109, masks every
    part with part 0's measures) fall back to the same reader minus the pickup test, which spelling does not use.
    Returns (Score-like, reader_ok)."""
    import score as S
    item = {"id": Path(path).stem, "file": str(Path(path).resolve()), "hands": hands}
    try:
        return S.load(item, Path("/")), True
    except Exception as e:                                     # noqa
        return _load_nopickup(item), False


def _load_nopickup(item):
    import numpy as np
    import partitura as pt
    from types import SimpleNamespace
    sc = pt.load_musicxml(str(item["file"]))
    arrays, measures = [], []
    for pi, part in enumerate(sc.parts):
        na = part.note_array(include_staff=True, include_time_signature=True, include_metrical_position=True,
                             include_key_signature=True, include_pitch_spelling=True)
        q = part.quarter_map
        m_starts = [float(q(m.start.t)) for m in part.measures]
        idx = np.searchsorted(np.array(m_starts), na["onset_quarter"], side="right") - 1 if m_starts else np.zeros(len(na), int)
        arrays.append(na); measures.append(idx)
    return SimpleNamespace(notes=np.concatenate(arrays), measure=np.concatenate(measures), item=item)


def to_m21_name(step, alter):
    return step + {0: "", 1: "#", -1: "-", 2: "##", -2: "--"}.get(int(alter), "?")


def ps13(notes):
    from partitura.musicanalysis import estimate_spelling
    return estimate_spelling(notes)


STEP_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
SHARPS = "FCGDAEB"


def sig_alters(fifths):
    f = int(fifths)
    alt = {s: 0 for s in "CDEFGAB"}
    if f > 0:
        for s in SHARPS[:f]:
            alt[s] = 1
    elif f < 0:
        for s in SHARPS[::-1][:(-f)]:
            alt[s] = -1
    return alt


def diatonic(step, alter, fifths):
    return sig_alters(fifths)[step] == alter


def parse_tpc(name):
    """PKSpell / music21 pitch-class name ('C#', 'B-', 'D##') -> (step, alter)."""
    step = name[0]
    rest = name[1:]
    alter = rest.count("#") - rest.count("-")
    return step, alter


def timed(fn, *a, **k):
    t = time.perf_counter()
    r = fn(*a, **k)
    return r, time.perf_counter() - t
