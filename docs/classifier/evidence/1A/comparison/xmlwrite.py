"""Write a two-staff piano MusicXML from a list of quantised notes (used for the POP909 and Mozart ground-truth scores).

A note is (onset16, dur16, midi_pitch, staff) with onset16 and dur16 in sixteenths of a whole note... no: in sixteenth-note units
(4 per quarter); a bar is `bar16` units long (16 for 4/4, 12 for 3/4). Notes crossing a barline are split and tied. Notes of one
staff in one bar are grouped into chords when onset and duration are equal, and into voices greedily (a voice takes an event that
starts at or after its end). Spelling is by sharps (the detector under test reads pitches, not spellings).
Output is read back by the project's own reader (tools/classifier/score.py) in the scripts that use it.
"""
from xml.sax.saxutils import escape

STEPS = [("C", 0), ("C", 1), ("D", 0), ("D", 1), ("E", 0), ("F", 0), ("F", 1), ("G", 0), ("G", 1), ("A", 0), ("A", 1), ("B", 0)]
# duration (in 16ths) -> MusicXML type, dots
DUR = {1: ("16th", 0), 2: ("eighth", 0), 3: ("eighth", 1), 4: ("quarter", 0), 6: ("quarter", 1), 8: ("half", 0),
       12: ("half", 1), 16: ("whole", 0)}
SIZES = [16, 12, 8, 6, 4, 3, 2, 1]


def split_dur(d):
    out = []
    for s in SIZES:
        while d >= s:
            out.append(s)
            d -= s
    return out


def pitch_xml(p):
    step, alt = STEPS[p % 12]
    o = p // 12 - 1
    a = f"<alter>{alt}</alter>" if alt else ""
    return f"<pitch><step>{step}</step>{a}<octave>{o}</octave></pitch>"


def note_xml(pitches, d, voice, staff, chord_tie=None, rest=False):
    """chord_tie: None, a flag for all pitches, or a dict pitch -> flag ('start', 'stop', 'both', None)."""
    """one event (a chord or a rest) of duration d (a standard size)."""
    typ, dots = DUR[d]
    dot = "<dot/>" * dots
    s = []
    if rest:
        s.append(f"<note><rest/><duration>{d}</duration><voice>{voice}</voice><type>{typ}</type>{dot}<staff>{staff}</staff></note>")
        return "".join(s)
    for i, p in enumerate(pitches):
        ch = "<chord/>" if i else ""
        tie = ""
        ntn = ""
        flag = chord_tie.get(p) if isinstance(chord_tie, dict) else chord_tie
        if flag:
            if flag in ("stop", "both"):
                tie += '<tie type="stop"/>'
                ntn += '<tied type="stop"/>'
            if flag in ("start", "both"):
                tie += '<tie type="start"/>'
                ntn += '<tied type="start"/>'
            ntn = f"<notations>{ntn}</notations>"
        s.append(f"<note>{ch}{pitch_xml(p)}<duration>{d}</duration>{tie}<voice>{voice}</voice><type>{typ}</type>{dot}<staff>{staff}</staff>{ntn}</note>")
    return "".join(s)


def voice_events(notes, bar16):
    """notes: list of (onset_in_bar, dur, pitch) within one bar and staff -> list of voices, each a list of (onset, dur, [pitches])."""
    groups = {}
    for on, d, p in notes:
        groups.setdefault((on, d), []).append(p)
    evs = sorted(((on, d, sorted(ps)) for (on, d), ps in groups.items()), key=lambda e: (e[0], -e[1]))
    voices = []   # each: list of events, with .end
    for on, d, ps in evs:
        placed = False
        for v in voices:
            end = v[-1][0] + v[-1][1]
            if on >= end:
                v.append((on, d, ps))
                placed = True
                break
        if not placed:
            if len(voices) < 4:
                voices.append([(on, d, ps)])
            else:
                # no free voice: merge the pitches into the voice whose last event has the same onset, else drop to the nearest earlier voice event
                for v in voices:
                    if v[-1][0] == on:
                        v[-1] = (on, min(v[-1][1], d), sorted(set(v[-1][2]) | set(ps)))
                        placed = True
                        break
                if not placed:
                    v = voices[-1]
                    if v[-1][0] < on:
                        v[-1] = (v[-1][0], on - v[-1][0], v[-1][2])
                        v.append((on, min(d, bar16 - on), ps))
    return voices


def build_part(notes, bar16, n_bars):
    """notes: (onset16 absolute, dur16, pitch, staff). Returns the <measure> xml strings."""
    # split at barlines
    pieces = {}   # (bar, staff) -> list of (onset_in_bar, dur, pitch, tie)
    for on, d, p, st in notes:
        cur, left = on, d
        while left > 0:
            b = cur // bar16
            room = (b + 1) * bar16 - cur
            take = min(left, room)
            first = cur == on
            last = take == left
            tie = None if (first and last) else ("start" if first else ("stop" if last else "both"))
            pieces.setdefault((b, st), []).append((cur - b * bar16, take, p, tie))
            cur += take
            left -= take
    meas = []
    for b in range(n_bars):
        xml = [f'<measure number="{b + 1}">']
        if b == 0:
            beats, beat_type = (bar16 // 4, 4)
            xml.append(f"<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>{beats}</beats><beat-type>{beat_type}</beat-type></time>"
                       '<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>')
        first_staff = True
        for st in (1, 2):
            ps = pieces.get((b, st), [])
            # the tie flags travel with (onset, dur, pitch): group by (onset, dur, tie) so chord members share one flag set
            by = {}
            for on, d, p, tie in ps:
                by.setdefault((on, d), []).append((p, tie))
            # standard-size split of each duration is applied per event; ties between the sub-pieces are added
            items = []
            for (on, d), lst in by.items():
                ties = {t for _, t in lst}
                for p, t in lst:
                    items.append((on, d, p, t))
            voices = voice_events([(on, d, p) for on, d, p, _ in items], bar16)
            tie_of = {(on, d, p): t for on, d, p, t in items}
            if not first_staff:
                pass
            if not voices:
                voices = [[]]
            for vi, v in enumerate(voices):
                vnum = vi + 1 + (0 if st == 1 else 4)
                if not first_staff or vi > 0:
                    xml.append(f"<backup><duration>{bar16}</duration></backup>")
                pos = 0
                for on, d, pcs in v:
                    if on > pos:
                        for r in split_dur(on - pos):
                            xml.append(note_xml([], r, vnum, st, rest=True))
                    # split the duration into standard sizes with ties, flag per pitch
                    parts = split_dur(d)
                    for k, size in enumerate(parts):
                        first = k == 0
                        last = k == len(parts) - 1
                        fl = {}
                        for p in pcs:
                            ev = tie_of.get((on, d, p))
                            start = (not last) or (ev in ("start", "both"))
                            stop = (not first) or (ev in ("stop", "both"))
                            fl[p] = "both" if (start and stop) else ("start" if start else ("stop" if stop else None))
                        xml.append(note_xml(pcs, size, vnum, st, chord_tie=fl))
                    pos = on + d
                if pos < bar16:
                    for r in split_dur(bar16 - pos):
                        xml.append(note_xml([], r, vnum, st, rest=True))
            first_staff = False
        xml.append("</measure>")
        meas.append("".join(xml))
    return meas


def score_xml(notes, bar16=16, title="x"):
    n_bars = max((on + d - 1) // bar16 for on, d, _, _ in notes) + 1
    meas = build_part(notes, bar16, n_bars)
    return ('<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>' + escape(title) + "</work-title></work>"
            '<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">' + "".join(meas) + "</part></score-partwise>")
