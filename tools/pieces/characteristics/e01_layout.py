# E01 Score layout: parts and staves.
#
# Chosen implementation: music21's own staff split. music21 turns a MusicXML part with <staves>2</staves> into two
# PartStaff objects (ids "P1-Staff1", "P1-Staff2", grouped by a brace StaffGroup) and a one-staff part into a Part, so
# score.parts is already the list of staves; we only group PartStaffs back to their source part by that id.
#
# Why: my old version re-read <part-list> and <staves> with ElementTree. That re-implements what music21 already does,
# against the reuse-first rule. On our 833 files under 1.5 MB music21's split matched the raw <staves> count on all of
# them; the 3 "disagreements" the cross-check showed were a staff holding only rests, which the cross-check (not
# music21) had dropped. ChatGPT's point that PartStaff "is not guaranteed" was checked on those files and did not hold.
#
# From ChatGPT's review (adopted): layout is reported for every file, whatever it is; nothing is refused here. Every
# staff of every pitched part is a staff for the per-staff rows. Only the two-staff relations (E42-E45) need exactly
# two piano staves, and they get a reason when there are not. A staff whose notes start late (a staff added mid-piece)
# is visible from first_bar / bars_with_notes. Staff is never hand.
#
# From my row (kept): two piano staves = one part with two staves, or two one-staff parts; in both cases no part name
# names another instrument (quality_check.not_piano, the same test the candidate checks use). Part name plus the
# instrument name music21 attached is what is tested, as quality_check.facts does.
import os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from quality_check import not_piano  # noqa: E402


def layout(score):
    """Parts and staves of a music21 Score. Returns a dict; `staves` lists every staff of every pitched part, in score
    order, as indices into score.parts; `two_piano_staves` is a pair of such indices or None (then `two_staff_reason`)."""
    import music21 as m
    parts, staves = [], []
    for i, p in enumerate(score.parts):
        source = p.id.rsplit("-Staff", 1)[0] if isinstance(p, m.stream.PartStaff) else f"part{i}"
        inst = p.getInstrument(returnDefault=False)
        name = " ".join(x for x in [p.partName or "", inst.instrumentName if inst and inst.instrumentName else ""] if x)
        notes = [n for n in p.recurse().notes
                 if not isinstance(n, (m.harmony.ChordSymbol, m.note.Unpitched, m.percussion.PercussionChord))]
        bars = sorted({n.getContextByClass(m.stream.Measure).number for n in notes
                       if n.getContextByClass(m.stream.Measure) is not None})
        if not parts or parts[-1]["source"] != source:
            parts.append({"source": source, "name": name, "staves": [], "pitched": False})
        parts[-1]["staves"].append(i)
        parts[-1]["pitched"] |= bool(notes)
        staves.append({"index": i, "part": len(parts) - 1, "staff_in_part": len(parts[-1]["staves"]),
                       "first_bar": bars[0] if bars else None, "bars_with_notes": len(bars)})
    pitched = [pt for pt in parts if pt["pitched"]]
    keep = [s for s in staves if parts[s["part"]]["pitched"]]
    two, reason = None, ""
    if len(keep) != 2:
        reason = f"{len(keep)} pitched staves"
    elif not_piano([pt["name"] for pt in pitched]):
        reason = f"part named for another instrument: {not_piano([pt['name'] for pt in pitched])!r}"
    else:
        two = (keep[0]["index"], keep[1]["index"])
    return {"parts": [{"name": pt["name"], "n_staves": len(pt["staves"]), "staff_indices": pt["staves"], "pitched": pt["pitched"]}
                      for pt in parts],
            "staves": [s["index"] for s in keep],
            "staff_detail": keep,
            "layout": f"{len(pitched)} pitched part(s), staves " + "+".join(str(len(pt["staves"])) for pt in pitched),
            "two_piano_staves": two, "two_staff_reason": reason}
