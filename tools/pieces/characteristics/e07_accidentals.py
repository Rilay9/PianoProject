# E07 Accidentals as encoded in the file.
#
# Chosen implementation: music21 notes; an accidental counts when Pitch.accidental.displayStatus is True, which on
# import means the file wrote an <accidental> element for that note (probed: F# with <accidental> -> True; F# from
# <alter> alone -> False; a written natural on F -> natural, True). Kind = Accidental.name (sharp, flat, natural,
# double-sharp, double-flat, and microtonal names kept as they come). Parenthesised accidentals from displayStyle.
#
# One raw read, for a measured gap: music21 drops <accidental cautionary="yes"> and editorial="yes" (probed: both
# come in as displayType "normal", the same as a plain accidental; ChatGPT's 213-row review warned of this). Those two
# flags are counted per staff straight from the file (part order + <staff>, as E01 maps them). Positions are not
# needed for a count, so no notes are re-read. music21 also folds "sharp-sharp" into double-sharp; same pitch, kept.
#
# Why this meaning (my row, kept; ChatGPT agreed): the count is the file's own claim of printed signs, i.e. ENCODED
# accidentals. Which accidentals a renderer actually draws is left out: the old branch's display model was wrong on
# 11.1% of notes against OpenSheetMusicDisplay. Not a measure of chromatic notes (that needs key estimation) and not
# accidental "churn" through a bar (ChatGPT notes churn is traceable from spelling; it is a different fact, not this
# row). Grace notes are counted apart; only printed notes count, small
# ones included (_notes.py).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
from collections import Counter


def accidentals(score, path):
    """Per staff: encoded accidentals by kind, cautionary/editorial/parenthesised counts, rate per 100 notes, top bars."""
    import music21 as m
    from e01_layout import layout
    from _raw import raw_root
    from _notes import printed
    L = layout(score)
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    raw_flags = Counter()
    raw_parts = list(raw_root(path).iter("part"))
    if len(raw_parts) == len(L["parts"]):
        for pi, part in enumerate(raw_parts):
            ids = L["parts"][pi]["staff_indices"]
            for note in part.iter("note"):
                acc = note.find("accidental")
                if acc is None or note.get("print-object") == "no":
                    continue
                st = int(note.findtext("staff") or 1)
                k = staff_no.get(ids[st - 1]) if st - 1 < len(ids) else None
                for flag in ("cautionary", "editorial"):
                    if k and acc.get(flag) == "yes":
                        raw_flags[(k, flag)] += 1
    out = {}
    for idx, k in staff_no.items():
        kinds, grace, bars, heads, paren, per_bar = Counter(), Counter(), Counter(), 0, 0, Counter()
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            for n, ps in printed(meas):
                for p in ps:
                    if not n.duration.isGrace:
                        heads += 1
                    a = p.accidental
                    if a is None or not a.displayStatus:
                        continue
                    if n.duration.isGrace:
                        grace[a.name] += 1
                        continue
                    kinds[a.name] += 1
                    paren += a.displayStyle == "parentheses"
                    bars[bar_label(meas)] += 1
                    per_bar[mi] += 1
        total = sum(kinds.values())
        out[k] = {"n": total, "by_kind": dict(kinds), "grace_by_kind": dict(grace),
                  "cautionary": raw_flags[(k, "cautionary")], "editorial": raw_flags[(k, "editorial")], "parenthesised": paren,
                  "per_100_notes": round(100 * total / heads, 2) if heads else None,
                  "top_bars": bars.most_common(5), "per_bar_index": dict(sorted(per_bar.items()))}
    return out
