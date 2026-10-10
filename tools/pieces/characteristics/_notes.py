# Shared helper: which notes count. Every row that counts notes uses this, so the rule lives in one place.
#
# Counted: every pitched note or chord member that is PRINTED with a real pitch - music21's style.hideObjectOnPrint
# False, which it sets from print-object="no" for single notes and for each chord member (probed) - and whose notehead
# is not a slash. Small notes (<cue/> or <type size="cue">) count when they are printed.
#
# Why (measured on our 842 files, read in the files): hidden notes are 5,888 notes in 102 files, and they are playback
# helpers that no reader sees: Bach BWV 856 prelude 351 hidden small 32nds (the printed page has ornament signs there),
# BWV 858 fugue 62, Schubert D. 899 No. 3 118, Diabelli Variations 713, Schumann Op. 10 No. 6 585, Chopin Op. 28 343
# hidden normal-size notes. Printed small notes are real played music: Chopin Op. 25 No. 1 (1,931 in the ASAP file,
# 2,059 in the MuseScore file: the sextuplet accompaniment), a Mozart K. 467 arrangement (2,772). MusicXML's <cue/>
# nominally means a silent cue, but in our files the visible ones are played, and the silent ones are the hidden ones.
# Slash noteheads (239 in one file, mxl/4/38, measured by the E30 builder) sit on placeholder pitches (A3, C4, D3) that
# mean "play the rhythm", not a note to play, so they are no pitch here; E30 reads them itself.
# Chord symbols and unpitched (percussion) notes are not notes here.


def _keep(x, slash=False):
    return not x.style.hideObjectOnPrint and (slash or x.notehead != "slash")


def printed(stream, slash=False):
    """Yields (element, printed pitches) for each Note/Chord in `stream` (recursively) with at least one printed,
    non-slash pitch; for a chord only those members' pitches are given. slash=True keeps slash noteheads (E30 only)."""
    import music21 as m
    for n in stream.recurse().notes:
        if isinstance(n, (m.harmony.ChordSymbol, m.note.Unpitched, m.percussion.PercussionChord)):
            continue
        if n.isChord:
            ps = [x.pitch for x in n.notes if _keep(x, slash)]
        else:
            ps = [n.pitch] if _keep(n, slash) else []
        if ps:
            yield n, ps


def struck(stream):
    """Yields the Pitch of every STRUCK note in `stream`: printed (as above), not a grace note, and not a tie
    continuation (a tie stop or continue is held, not struck again); every member of a chord counts. Used by E34 and
    E35 so both count the same notes."""
    for n, _ in printed(stream):
        if n.duration.isGrace:
            continue
        for x in (n.notes if n.isChord else [n]):
            if _keep(x) and (x.tie is None or x.tie.type == "start"):
                yield x.pitch
