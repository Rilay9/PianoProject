"""Adapter that makes the SynPy3 port (github.com/Music-Cognition-Lab/SynPy3, an automatic 2to3 conversion of the
Song/Pearce/Harte SynPy) run under Python 3.11 WITHOUT editing its files.

One fault found: parameter_setter.read_time_signature() unpickles TimeSignature.pkl, a Python 2 protocol-0 (text)
pickle, and raises UnpicklingError('the STRING opcode argument must be quoted') on the first Bar it builds (two causes:
the Python 3 default string encoding, and CRLF line endings that git's autocrlf wrote into the clone on this machine).
The adapter re-reads the same file with CRLF undone and encoding='latin1' and checks that it equals the dict hard-coded
in parameter_setter.py (`timeSignatureBase`), recorded as PKL_EQUALS_SOURCE_DICT.

Use from a Python 3 interpreter that has numpy:
    import synpy_adapter as SA;  SA.MODELS -> {"LHL": module, ...};  SA.run(model, source)
"""
import os, pickle, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
SYNPY3 = WT / "build/syn/synpy3"
sys.path.insert(0, str(SYNPY3))

import parameter_setter  # noqa: E402


def _read_time_signature():
    import io
    raw = (SYNPY3 / "TimeSignature.pkl").read_bytes()
    # a protocol-0 (text) pickle: git's autocrlf on this machine turned its LF into CRLF in the clone
    return pickle.load(io.BytesIO(raw.replace(b"\r\n", b"\n")), encoding="latin1")


_PKL = _read_time_signature()
PKL_EQUALS_SOURCE_DICT = (_PKL == parameter_setter.timeSignatureBase)
parameter_setter.read_time_signature = _read_time_signature

import syncopation  # noqa: E402
import LHL, PRS, TMC, SG, KTH, TOB, WNBD  # noqa: E402,F401
from music_objects import Bar, BarList, VelocitySequence  # noqa: E402,F401

MODELS = {"LHL": LHL, "PRS": PRS, "TMC": TMC, "SG": SG, "KTH": KTH, "TOB": TOB, "WNBD": WNBD}
NAMES = {"LHL": "Longuet-Higgins and Lee", "PRS": "Pressing", "TMC": "Toussaint metric complexity",
         "SG": "Sioros and Guedes", "KTH": "Keith", "TOB": "Toussaint off-beatness",
         "WNBD": "weighted note-to-beat distance"}


def run(model, source, **kw):
    return syncopation.calculate_syncopation(model, source, **kw)
