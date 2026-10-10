# E15 Ornament signs (trill, mordent, turn).
#
# Chosen implementation: music21 note.expressions, classified with isinstance in this order: Shake (a Trill subclass,
# so first), Trill (and its half/whole-step subclasses), InvertedMordent, Mordent, InvertedTurn, Turn (Turn.isDelayed
# separates delayed turns), Schleifer, then any other Ornament (music21 makes <other-ornament> a plain Ornament) as
# "other". Tremolo is also an Ornament in music21 but is E17, so it is skipped here. A wavy line with no trill mark
# comes in as a TrillExtension spanner; it is counted when its first note carries no Trill.
#
# Why: music21 reads <notations><ornaments> into these typed objects, which is what my old raw walk did by tag. On our
# 833 files under 1.5 MB music21's trill/mordent/turn counts matched the old reader except on 5 files, read in the raw
# XML: in 3 (QmYabf bar 78, QmQjj, QmRRAF) a trill mark sits on a rest, an exporter's way of placing a trill line,
# and music21 does not attach expressions to rests (one sign per file; not worth a raw read); Chopin Op. 25 No. 5's
# two trills are on hidden small notes, which are not printed and are left out (_notes.py); QmQjj also has 2 trills on
# hidden notes, left out the same way. Chopin Berceuse: one trill on a printed small (<cue/>) 64th note, which music21
# has and my old reader dropped with the cue notes.
# Probed losses, left as known: <vertical-turn/> and <haydn/> come in as nothing (both rare outside string writing).
#
# From ChatGPT's review (adopted): the printed sign only, never its realisation; written-out ornaments are PATTERNS;
# unknown ornament names are "other", not guessed. "tr" typed as <words> makes no trill; it is counted apart.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
import re
from collections import Counter

TR_WORD = re.compile(r"(?<![a-z])tr\.?(?![a-z])", re.I)


def ornaments(score):
    """Per staff: ornament signs by kind, with bars; 'tr' words counted apart."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed
    E = m.expressions
    order = [(E.Shake, "shake"), (E.Trill, "trill"), (E.InvertedMordent, "inverted-mordent"), (E.Mordent, "mordent"),
             (E.InvertedTurn, "inverted-turn"), (E.Turn, "turn"), (E.Schleifer, "schleifer")]
    out = {}
    for k, idx in enumerate(layout(score)["staves"]):
        staff = score.parts[idx]
        c, bars = Counter(), []
        for meas in staff.getElementsByClass(m.stream.Measure):
            for n, _ in printed(meas):
                for e in n.expressions:
                    if not isinstance(e, E.Ornament) or isinstance(e, E.Tremolo):
                        continue
                    kind = next((name for cls, name in order if isinstance(e, cls)), "other")
                    if kind in ("turn", "inverted-turn") and getattr(e, "isDelayed", False):
                        kind = "delayed-" + kind
                    c[kind] += 1
                    bar = bar_label(meas)
                    if not bars or bars[-1] != bar:
                        bars.append(bar)
        for x in staff.recurse().getElementsByClass(E.TrillExtension):
            first = x.getFirst()
            if first is not None and not any(isinstance(e, E.Trill) for e in getattr(first, "expressions", [])):
                c["wavy-line-only"] += 1
        out[k + 1] = {"by_kind": dict(c), "bars": bars}
    words = sum(1 for x in score.recurse().getElementsByClass(E.TextExpression) if x.content and TR_WORD.fullmatch(x.content.strip()))
    return {"per_staff": out, "trill_words": words}
