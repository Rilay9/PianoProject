# E08 Notes the key signature actually alters.
#
# Chosen implementation: music21. For each struck note (tie continuations, grace notes and hidden
# notes left out: _notes.py), the key
# signature in force on its staff is getContextByClass(key.KeySignature); KeySignature.accidentalByStep(step) gives the
# signature's alteration for that letter (works for non-traditional signatures too, from alteredPitches). The note
# counts when its step is one the signature alters and its encoded alter equals the signature's. Reported per
# signature, all of its spans merged (a G major section that returns counts once): which of the signature's letters
# occur that way, how often, and which never do. Locations per span are not given (ChatGPT asked; not built until a
# consumer needs them).
#
# Why music21 and the encoded alter: MusicXML's <alter> is the sounding pitch, which music21 reads into
# Pitch.accidental. ChatGPT's review worried that exporters omit <alter> on notes covered by the signature; this was
# measured on our 842 files before building: of 246,796 notes on a signature-altered step, 235,106 carry the matching
# <alter>, 11,501 more are explained by a natural earlier in the bar or a tie, and 189 (0.08%, 61 files) are
# unexplained. So the encoded pitch is trusted, and a note naturalised by an accidental (or by its carry through the
# bar, which the encoded <alter> already reflects) does not count - which is ChatGPT's "a chromatic natural on an F
# must not count". Signature presence is reported apart from use: a G major piece with no F at all is a real result.
from collections import Counter, defaultdict


def signature_exercised(score):
    """Per written signature (all places it is in force, merged; not one entry per span - ChatGPT's review): letters
    it alters, which occur with that alteration (counts), which never occur."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed, _keep
    used, letters = defaultdict(Counter), {}
    for idx in layout(score)["staves"]:
        for n, _ in printed(score.parts[idx]):
            if n.duration.isGrace:
                continue
            ks = n.getContextByClass(m.key.KeySignature)
            if ks is None or not ks.alteredPitches:
                continue
            name = str(ks.sharps) if ks.sharps is not None else "nontraditional " + " ".join(p.name for p in ks.alteredPitches)
            letters.setdefault(name, sorted({p.step for p in ks.alteredPitches}))
            for x in (n.notes if n.isChord else [n]):
                if not _keep(x) or (x.tie is not None and x.tie.type in ("stop", "continue")):
                    continue
                sig = ks.accidentalByStep(x.pitch.step)
                if sig is not None and x.pitch.accidental is not None and x.pitch.accidental.alter == sig.alter:
                    used[name][x.pitch.step] += 1
    return {name: {"altered_letters": steps, "used": dict(used[name]), "never": [s for s in steps if s not in used[name]]}
            for name, steps in letters.items()}
