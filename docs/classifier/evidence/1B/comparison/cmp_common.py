"""Shared helpers for the key comparison (docs/classifier/evidence/1B/comparison/key.md).

Run every script here with the main checkout's .venv (music21 10.5.0, partitura 1.9.0), `-X utf8`, from anywhere:
    <main>/.venv/Scripts/python.exe -X utf8 docs/classifier/evidence/1B/comparison/<script>.py
Paths: WT = this worktree (scripts, tools/classifier, build/), MAIN = the main checkout (catalogue content, read in place).
"""
import json, sys, warnings, time, os
from pathlib import Path

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]                   # .../docs/classifier/evidence/1B/comparison -> worktree root
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
WIR = WT / "build/when-in-rome"
VALID = HERE.parent / "validation"       # chunk-1 validators: keyfix.py, t_keys.py, t_kc.py
sys.path.insert(0, str(WT / "tools/classifier"))
sys.path.insert(0, str(VALID))

NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
PCN = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def key_str(k):
    """k = (tonic_pc, mode) -> 'C major'."""
    return None if k is None else f"{NAMES[k[0]]} {k[1]}"


def m21_key(k):
    """music21 Key -> (pc, mode)."""
    return None if k is None else (int(k.tonic.pitchClass), k.mode)


def relation(truth, pred):
    """Classify an error pred != truth, both (pc, mode): relative, parallel, fifth (dominant/subdominant), other."""
    if pred is None:
        return "abstain"
    if pred == truth:
        return "exact"
    d = (pred[0] - truth[0]) % 12
    if d == 0:
        return "parallel"
    if truth[1] == "major" and pred[1] == "minor" and d == 9:
        return "relative"
    if truth[1] == "minor" and pred[1] == "major" and d == 3:
        return "relative"
    if d in (7, 5) and pred[1] == truth[1]:
        return "fifth"
    return "other"


def load_path(path, hands="both"):
    """The project's score reader on a file path (as validation/common.py load_path)."""
    import score as S
    it = {"id": Path(path).stem, "file": str(Path(path).resolve()), "hands": hands}
    return S.load(it, Path("/"))


def ks_partitura(notes_array):
    """partitura estimate_key on a note array -> (pc, mode) (as validation/t_kc.py ks_key)."""
    from partitura.musicanalysis import estimate_key
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        k = estimate_key(notes_array)
    minor = k.endswith("m")
    nm = k[:-1] if minor else k
    return ((PCN[nm[0]] + nm[1:].count("#") - nm[1:].count("b")) % 12, "minor" if minor else "major")


M21_PROFILES = {"KS": "krumhansl", "AE": "aarden", "BB": "bellman", "TKP": "temperley", "KK": "krumhansl.kessler", "SW": "simple"}


def m21_global(stream, ident):
    return m21_key(stream.analyze(ident))
