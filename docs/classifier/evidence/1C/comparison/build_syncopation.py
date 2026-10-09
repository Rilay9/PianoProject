"""Assemble syncopation.md from syncopation_template.md and the fragments the metric scripts wrote
(frag_song.md from song_metrics.py, frag_cat.md from cat_metrics.py). The page ends with the recommendation line."""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
t = (HERE / "syncopation_template.md").read_text(encoding="utf-8")
REC_PARA = (
    "What the code does and what the agent does. The code reports each evidence type apart, per line and per bar, "
    "never one flag: held over a stronger beat (three kinds), off-beat attack, accent, rest, bass-then-held-chord. "
    "A lesson names the types it needs (an ability on tied syncopation takes the held kinds; one on off-beat "
    "comping takes off-beat attack); an accompaniment's off-beat chords never certify tied syncopation, and "
    "melodic false positives and an unmetred file (the Gnossienne) are not certified at all. SynPy (LHL, TMC, SG) and "
    "AMADS span are witnesses for the held kinds only, and only on one line at a time (on the texture they lose 9 "
    "of the 46 declared positives, and on a hand's line they flag the Prelude in C); no candidate covers accent, rest "
    "or bass-then-chord, and none supplies UNKNOWN for a missing time signature. The agent decides what the types "
    "leave open: a final note tied into the last bar, an accent on beat 3 of a mazurka, a figure the detector "
    "splits, and whether a tie is a syncopation by beat strength and voice continuity. Agreement between the "
    "detector and a witness is confidence, not proof.\n\n"
)
REC = (
    "rhythm.syncopation: code + agent (code flags what, the agent decides what) — the current detector with the "
    "three fixes (UNKNOWN when the file has no time signature, octave-aware and left-hand-only bass-then-held-chord) "
    "reports the evidence types apart so the lesson picks them (46 of 46 declared syncopation items found, 27 of 46 "
    "when off-beat attack and bass-then-chord do not count; 29 of 29 named items right with the fixes), with SynPy LHL and AMADS span "
    "on single lines as witnesses for the held types only (Spearman 0.71 and 0.67 against listeners on 63 monorhythms, "
    "level with the detector's 0.67, but each flags 71 of 71 items whose only evidence is an off-beat attack), and the "
    "agent deciding the cases the types leave open."
)
t = t.replace("{{recommendation}}", REC_PARA + REC)
t = re.sub(r"\{\{(frag_[a-z_]+)\}\}", lambda m: (HERE / (m.group(1) + ".md")).read_text(encoding="utf-8").strip(), t)
(HERE / "syncopation.md").write_text(t.rstrip() + "\n", encoding="utf-8")
print("syncopation.md", len(t.splitlines()), "lines")
