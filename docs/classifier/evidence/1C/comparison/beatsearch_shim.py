"""Makes Beatsearch (github.com/Tomasito665/Beatsearch, 2018) importable on Python 3.11 without editing it.
`pip install beatsearch` fails (see syncopation.md section 2), so the package directory src/beatsearch was copied to
build/beatsearch_src/ (the copy is needed because beatsearch/__init__.py exits when it finds setup.py above it and the
python3-midi submodule unbuilt), and these three shims are applied before the import:
  1. collections.Sequence and friends (removed in Python 3.10; moved to collections.abc);
  2. a stub `midi` module (build/beatsearch_stub/midi.py): python3-midi is a git submodule absent from the clone;
     Beatsearch uses it for MIDI files and in type annotations only; this comparison never gives it MIDI.
Use with build/venv-beatsearch (numpy, matplotlib, anytree).
"""
import collections, collections.abc, sys
from pathlib import Path

for _n in ("Sequence", "Mapping", "MutableMapping", "Iterable", "Callable", "Set", "MutableSet", "MutableSequence",
           "Hashable", "Sized", "Container", "Iterator"):
    if not hasattr(collections, _n):
        setattr(collections, _n, getattr(collections.abc, _n))
WT = Path(__file__).resolve().parent.parents[4]
sys.path.insert(0, str(WT / "build/beatsearch_stub"))
sys.path.insert(0, str(WT / "build/beatsearch_src"))
import beatsearch  # noqa: E402
from beatsearch.rhythm import MonophonicRhythm, Unit  # noqa: E402
from beatsearch.feature_extraction import (MonophonicSyncopationVector, SyncopatedOnsetRatio,  # noqa: E402
                                           MeanSyncopationStrength)
