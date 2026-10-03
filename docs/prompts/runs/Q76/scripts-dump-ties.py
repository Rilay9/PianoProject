"""Prints a score bar by bar, part by part: each note or chord with its duration in quarters and its tie ('~' starts, '-' continues/stops), and each bar's chord symbols. dump_score.py prints no ties, which is why this exists."""
import sys
import warnings

warnings.filterwarnings("ignore")
from music21 import converter, harmony, stream  # noqa: E402

score = converter.parse(sys.argv[1])
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 999
print("parts", len(score.parts), [p.partName for p in score.parts])
for ts in score.recurse().getElementsByClass("TimeSignature")[:2]:
    print("time", ts.ratioString)
for ks in score.recurse().getElementsByClass("KeySignature")[:2]:
    print("key", ks.sharps)
for mm in score.recurse().getElementsByClass("MetronomeMark")[:2]:
    print("tempo", mm.number, mm.referent.quarterLength if mm.referent else None)
for pi, part in enumerate(score.parts):
    print(f"-- part {pi}")
    for m in part.getElementsByClass(stream.Measure):
        if m.number is not None and m.number > limit:
            break
        items = []
        for el in m.recurse().getElementsByClass(("Note", "Chord", "Rest", "ChordSymbol")):
            if isinstance(el, harmony.ChordSymbol):
                items.append(f"[{el.figure}]")
                continue
            if el.isRest:
                items.append(f"r{el.quarterLength:g}")
                continue
            name = "+".join(p.nameWithOctave for p in el.pitches)
            tie = ""
            if el.tie is not None:
                tie = "~" if el.tie.type == "start" else ("-~" if el.tie.type == "continue" else "-")
            items.append(f"{name}:{el.quarterLength:g}{tie}")
        print(f"  m{m.number}: " + " ".join(items))
