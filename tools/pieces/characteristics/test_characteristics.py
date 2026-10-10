"""Hand-made MusicXML cases for the characteristic functions in this folder: for each row one case that must be found,
one that must not, and one built to fool it (CLAUDE.md technical rule 2). The cases are the ones written for the old
raw reader (tools/pieces/test_score_facts.py), moved onto music21. Usage: python tools/pieces/characteristics/test_characteristics.py
"""
import os, sys, tempfile, warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

DIV = 4  # divisions per quarter in every case unless a case says otherwise


def N(step="C", octave=4, dur=DIV, typ="quarter", staff=1, voice=1, alter=None, chord=False, rest=False, dots=0,
      grace=False, slash=False, tm=None, tie=None, notations="", acc=None, cue=False, notehead=None):
    x = []
    if grace:
        x.append('<grace slash="yes"/>' if slash else "<grace/>")
    if cue:
        x.append("<cue/>")
    if chord:
        x.append("<chord/>")
    if rest:
        x.append("<rest/>")
    else:
        x.append(f"<pitch><step>{step}</step>{f'<alter>{alter}</alter>' if alter is not None else ''}<octave>{octave}</octave></pitch>")
    if not grace:
        x.append(f"<duration>{dur}</duration>")
    for t in (tie or "").split(","):
        if t:
            x.append(f'<tie type="{t}"/>')
    x.append(f"<voice>{voice}</voice><type>{typ}</type>" + "<dot/>" * dots)
    if acc:
        x.append(f"<accidental>{acc}</accidental>")
    if tm:
        x.append(f"<time-modification><actual-notes>{tm[0]}</actual-notes><normal-notes>{tm[1]}</normal-notes></time-modification>")
    if notehead:
        x.append(f"<notehead>{notehead}</notehead>")
    x.append(f"<staff>{staff}</staff>")
    if notations:
        x.append(f"<notations>{notations}</notations>")
    return "<note>" + "".join(x) + "</note>"


def R(dur=DIV, typ="quarter", staff=1, voice=1, dots=0):
    return N(rest=True, dur=dur, typ=typ, staff=staff, voice=voice, dots=dots)


def back(q, div=DIV):
    return f"<backup><duration>{int(q * div)}</duration></backup>"


def fwd(q, div=DIV):
    return f"<forward><duration>{int(q * div)}</duration></forward>"


def D(inner, staff=None, offset=None, sound=""):
    return ("<direction><direction-type>" + inner + "</direction-type>" + (f"<offset>{offset}</offset>" if offset else "") +
            (f"<staff>{staff}</staff>" if staff else "") + sound + "</direction>")


def attrs(fifths=0, time=("4", "4"), staves=2, clefs=(("G", 2), ("F", 4)), extra="", div=DIV):
    c = "".join(f'<clef number="{i + 1}"><sign>{s}</sign><line>{ln}</line></clef>' for i, (s, ln) in enumerate(clefs[:staves]))
    t = f"<time><beats>{time[0]}</beats><beat-type>{time[1]}</beat-type></time>" if time else ""
    return (f"<attributes><divisions>{div}</divisions><key><fifths>{fifths}</fifths></key>{t}"
            f"<staves>{staves}</staves>{c}{extra}</attributes>")


def xml(measures, parts=None, first_attrs=None, implicit_first=False):
    parts = parts or [("Piano", 2)]
    if not isinstance(measures[0], list):
        measures = [measures]
    pl = "".join(f'<score-part id="P{i + 1}"><part-name>{name}</part-name></score-part>' for i, (name, _) in enumerate(parts))
    body = ""
    for i, ((name, staves), ms) in enumerate(zip(parts, measures)):
        body += f'<part id="P{i + 1}">'
        for j, m in enumerate(ms):
            a = (first_attrs if first_attrs is not None else attrs(staves=staves, clefs=(("G", 2), ("F", 4)) if staves == 2
                 else (("G", 2),))) if j == 0 else ""
            imp = ' implicit="yes"' if implicit_first and j == 0 else ""
            body += f'<measure number="{j + (0 if implicit_first else 1)}"{imp}>{a}{m}</measure>'
        body += "</part>"
    return f'<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list>{pl}</part-list>{body}</score-partwise>'


TMP = tempfile.mkdtemp(prefix="charcases-")
_n = [0]


def score(measures, **kw):
    """Writes the case to a file and returns (music21 Score, path): functions that patch a music21 gap read the path."""
    import music21 as m
    _n[0] += 1
    path = os.path.join(TMP, f"case{_n[0]}.musicxml")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(xml(measures, **kw))
    return m.converter.parse(path, forceSource=True), path


BAR_C = N("C", 4) + N("D", 4) + N("E", 4) + N("F", 4)          # four quarters on staff 1
BAR_LH = N("C", 3, dur=16, typ="whole", staff=2)                  # whole note on staff 2

CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("E01 layout")
def _():
    from e01_layout import layout
    s, _ = score([BAR_C + back(4) + BAR_LH])
    r = layout(s)
    assert r["two_piano_staves"] == (0, 1) and r["staves"] == [0, 1] and r["parts"][0]["n_staves"] == 2
    s, _ = score([[BAR_C], [N("C", 3, dur=16, typ="whole")]], parts=[("Right Hand", 1), ("Left Hand", 1)])
    assert layout(s)["two_piano_staves"] == (0, 1)
    s, _ = score([[N("C", 5) + R(dur=12, typ="half", dots=1)], [BAR_C + back(4) + BAR_LH]], parts=[("Voice", 1), ("Piano", 2)])
    r = layout(s)
    assert r["staves"] == [0, 1, 2] and r["two_piano_staves"] is None and r["two_staff_reason"] == "3 pitched staves"
    s, _ = score([[BAR_C], [N("C", 3, dur=16, typ="whole")]], parts=[("Violin", 1), ("Piano", 1)])
    r = layout(s)
    assert r["two_piano_staves"] is None and "Violin" in r["two_staff_reason"]
    # fool: staff 2 holds only rests - still a declared staff of the piano part, not a layout change
    s, _ = score([BAR_C + back(4) + R(dur=16, typ="whole", staff=2)])
    r = layout(s)
    assert r["two_piano_staves"] == (0, 1) and r["staff_detail"][1]["bars_with_notes"] == 0


@case("E02 bars")
def _():
    from e02_bars import bars
    s, p = score([BAR_C + back(4) + BAR_LH, N("C") + N("D") + N("E") + back(3) + R(dur=12, typ="half", dots=1, staff=2),
                  BAR_C + back(4) + BAR_LH])
    b = bars(s, p)
    assert b["interior_short"] == 1 and b["measures"][0]["state"] == "full" and b["measures"][1]["state"] == "short"
    # fool: voice 2 padded by <forward> - the bar is full (voice 1), and voice 2's unfilled end is a gap, not a short bar
    s, p = score([BAR_C + back(4) + BAR_LH, N("C", voice=1, dur=16, typ="whole") + back(4) + N("E", voice=2) + fwd(3) + back(4) + BAR_LH,
                  BAR_C + back(4) + BAR_LH])
    b = bars(s, p)
    assert b["interior_short"] == 0 and b["measures"][1]["gaps"] == [{"staff": 1, "voice": "2", "missing": "3"}]
    # implicit flag and suffixed numbers survive; no time signature gives unknown, not music21's default 4/4
    s, p = score([N("C"), N("C") * 3], first_attrs=attrs(time=("3", "4")), implicit_first=True)
    b = bars(s, p)
    assert b["measures"][0]["implicit"] and not b["measures"][1]["implicit"] and b["measures"][0]["number"] == "0"
    s, p = score([N("C") * 3], first_attrs=attrs(time=None))
    assert bars(s, p)["measures"][0]["state"] == "unknown"
    x = xml([BAR_C, BAR_C]).replace('<measure number="2">', '<measure number="1a">')
    import music21 as m
    path = os.path.join(TMP, "suffix.musicxml")
    open(path, "w", encoding="utf-8").write(x)
    b = bars(m.converter.parse(path, forceSource=True), path)
    assert [z["number"] for z in b["measures"]] == ["1", "1a"] and [z["index"] for z in b["measures"]] == [0, 1]


@case("E03 clefs")
def _():
    from e03_clefs import clefs
    change = '<attributes><clef number="2"><sign>G</sign><line>2</line></clef></attributes>'
    s, _ = score([BAR_C + back(4) + BAR_LH, change + BAR_C + back(4) + N("C", 4, dur=16, typ="whole", staff=2)])
    c = clefs(s)
    assert c["start"] == {1: "G/2/0", 2: "F/4/0"} and c["n_changes"] == 1
    assert c["changes"][0]["staff"] == 2 and c["changes"][0]["bar"] == "2" and not c["changes"][0]["inside_bar"]
    s, _ = score([BAR_C + back(4) + BAR_LH, BAR_C + back(4) + BAR_LH])
    assert clefs(s)["n_changes"] == 0
    same = '<attributes><clef number="2"><sign>F</sign><line>4</line></clef></attributes>'
    s, _ = score([BAR_C + back(4) + BAR_LH, same + BAR_C + back(4) + BAR_LH])
    assert clefs(s)["n_changes"] == 0  # restated clef
    s, _ = score([N("C") + N("D") + change.replace('number="2"', 'number="1"').replace("<sign>G</sign><line>2</line>",
                 "<sign>F</sign><line>4</line>") + N("E", 3) + N("F", 3) + back(4) + BAR_LH])
    c = clefs(s)
    assert c["inside_bar"] == 1 and c["changes"][0]["staff"] == 1
    t8 = '<attributes><clef number="1"><sign>G</sign><line>2</line><clef-octave-change>1</clef-octave-change></clef></attributes>'
    s, _ = score([BAR_C + back(4) + BAR_LH, t8 + BAR_C + back(4) + BAR_LH])
    assert clefs(s)["changes"][0]["to"] == "G/2/1"  # treble-8va is a different clef


@case("E04 ottava")
def _():
    from e04_ottava import ottava
    on = D('<octave-shift type="down" size="8"/>', staff=1)
    off = D('<octave-shift type="stop" size="8"/>', staff=1)
    s, p = score([on + N("C", 7) + N("D", 7) + N("E", 7) + N("F", 7), N("C", 7) + off + N("C", 5, dur=12, typ="half", dots=1)])
    o = ottava(s, p)
    assert o["n_spans"] == 1 and o["spans"][0]["notes"] == 5 and o["spans"][0]["kind"] == "8va"
    assert o["spans"][0]["first_bar"] == "1" and o["spans"][0]["last_bar"] == "2"
    s, p = score([D("<words>8va</words>", staff=1) + BAR_C])
    o = ottava(s, p)
    assert o["n_spans"] == 0 and o["ottava_words"] == ["8va"]
    s, p = score([on + BAR_C])
    o = ottava(s, p)
    assert o["n_spans"] == 0 and o["unclosed"][0]["start_bar"] == "1"  # music21 drops this span; we keep it as unclosed
    # fool (music21 loses these): two spans opening and closing inside one bar
    s, p = score([on + N("C", 6) + off + N("D", 5) + on + N("E", 6) + off + N("F", 5)])
    o = ottava(s, p)
    assert o["n_spans"] == 2 and [x["notes"] for x in o["spans"]] == [1, 1]
    # 8vb on staff 2 after a backup: positioned by the cursor, and type "up" is 8vb
    s, p = score([BAR_C + back(4) + N("C", 2, dur=8, typ="half", staff=2) + D('<octave-shift type="up" size="8"/>', staff=2) +
                  N("C", 1, dur=8, typ="half", staff=2) + D('<octave-shift type="stop" size="8"/>', staff=2)])
    o = ottava(s, p)
    assert o["spans"][0]["staff"] == 2 and o["spans"][0]["kind"] == "8vb" and o["spans"][0]["notes"] == 1
    cont = D('<octave-shift type="continue" size="8"/>', staff=1)
    s, p = score([on + N("C", 7) * 4, cont + N("C", 7) * 2 + off + N("C", 5, dur=8, typ="half")])
    o = ottava(s, p)
    assert o["n_spans"] == 1 and o["spans"][0]["notes"] == 6 and not o["unclosed"] and o["orphan_stops"] == 0


@case("E05 ledger lines")
def _():
    from e05_ledger import ledger

    def lc(step, octave, staff=1, pre="", clef_attrs=None):
        body = pre + N(step, octave, staff=staff, dur=16, typ="whole")
        s, p = score([body], first_attrs=clef_attrs)
        r = ledger(s, p)[staff]["by_count"]
        assert len(r) == 1, r
        return int(next(iter(r)))
    treble = {("C", 4): -1, ("B", 3): -1, ("A", 3): -2, ("D", 4): 0, ("G", 5): 0, ("A", 5): 1, ("B", 5): 1, ("C", 6): 2}
    for (st, o), want in treble.items():
        assert lc(st, o) == want, (st, o, lc(st, o), want)
    bass = {("E", 2): -1, ("F", 2): 0, ("G", 2): 0, ("A", 3): 0, ("B", 3): 0, ("C", 4): 1, ("D", 4): 1, ("E", 4): 2}
    for (st, o), want in bass.items():
        assert lc(st, o, staff=2) == want, (st, o, lc(st, o, staff=2), want)
    # fool: written D6 under an 8va sounds D7; on the page it needs 2 lines, not 5
    s, p = score([D('<octave-shift type="down" size="8"/>', staff=1) + N("D", 7, dur=16, typ="whole") +
                  D('<octave-shift type="stop" size="8"/>', staff=1)])
    assert ledger(s, p)[1]["by_count"] == {"2": 1}
    # an unclosed 8va has unknown extent: nothing is shifted and the staff is flagged
    s, p = score([D('<octave-shift type="down" size="8"/>', staff=1) + N("D", 7, dur=16, typ="whole")])
    r = ledger(s, p)[1]
    assert r["by_count"] == {"6": 1} and r["unclosed_ottava"] and r["possible_missing_8va"]
    # octave clefs (music21's lowestLine is wrong for these): treble-8va prints sounding C6 where treble prints C5 -> 0
    t8va = attrs(clefs=(("G", 2), ("F", 4)), extra="").replace('<line>2</line></clef>', '<line>2</line><clef-octave-change>1</clef-octave-change></clef>', 1)
    assert lc("C", 6, clef_attrs=t8va) == 0 and lc("C", 5, clef_attrs=t8va) == -1
    b8vb = attrs().replace('<line>4</line></clef>', '<line>4</line><clef-octave-change>-1</clef-octave-change></clef>')
    assert lc("E", 1, staff=2, clef_attrs=b8vb) == -1 and lc("G", 1, staff=2, clef_attrs=b8vb) == 0
    # a lost 8va gives a high count: kept, and flagged
    s, p = score([N("C", 8, dur=16, typ="whole")])
    r = ledger(s, p)[1]
    assert r["max_above"] == 9 and r["possible_missing_8va"]  # C8: lines at A5 C6 E6 G6 B6 D7 F7 A7 C8


@case("E06 keys")
def _():
    from e06_keys import keys
    k = lambda f, extra="": f"<attributes><key{extra}><fifths>{f}</fifths></key></attributes>"  # noqa: E731
    s, _ = score([BAR_C + back(4) + BAR_LH, k(-5) + BAR_C + back(4) + BAR_LH, k(-4) + BAR_C + back(4) + BAR_LH], first_attrs=attrs(fifths=-4))
    r = keys(s)
    assert r["n_changes"] == 2 and r["start"][1]["fifths"] == -4 and r["per_staff"] == {1: 2, 2: 2}  # both staves, counted once
    s, _ = score([BAR_C + back(4) + BAR_LH, k(-4) + BAR_C + back(4) + BAR_LH], first_attrs=attrs(fifths=-4))
    assert keys(s)["n_changes"] == 0  # restatement
    # a change on staff 1 only (key number="1"), as in file QmT2F, bars 105-106
    s, _ = score([BAR_C + back(4) + BAR_LH, k(-3, ' number="1"') + BAR_C + back(4) + BAR_LH], first_attrs=attrs(fifths=-2))
    r = keys(s)
    assert r["n_changes"] == 1 and r["per_staff"] == {1: 1, 2: 0}
    # mode only when written; non-traditional signature not collapsed to C
    s, _ = score([BAR_C + back(4) + BAR_LH], first_attrs=attrs().replace("<fifths>0</fifths>", "<fifths>-3</fifths><mode>minor</mode>"))
    assert keys(s)["start"][1] == {"fifths": -3, "mode": "minor"}
    nt = attrs().replace("<key><fifths>0</fifths></key>", "<key><key-step>B</key-step><key-alter>-1</key-alter><key-step>E</key-step><key-alter>-1</key-alter><key-step>F</key-step><key-alter>1</key-alter></key>")
    s, _ = score([BAR_C + back(4) + BAR_LH], first_attrs=nt)
    r = keys(s)
    assert r["nontraditional"] and r["start"][1]["fifths"] is None and sorted(r["start"][1]["nontraditional"]) == ["B-", "E-", "F#"], r["start"]


@case("E07 accidentals")
def _():
    from e07_accidentals import accidentals
    s, p = score([N("F", alter=1, acc="sharp") + N("F", acc="natural") + N("G") + N("A")])
    r = accidentals(s, p)[1]
    assert r["by_kind"] == {"sharp": 1, "natural": 1} and r["per_100_notes"] == 50.0
    # fool: tied F# with no <accidental> on the second note - counted once, as encoded
    s, p = score([N("C") + N("D") + N("E") + N("F", alter=1, acc="sharp", tie="start"), N("F", alter=1, tie="stop", dur=16, typ="whole")])
    assert accidentals(s, p)[1]["by_kind"] == {"sharp": 1}
    s, p = score([BAR_C])
    assert accidentals(s, p)[1]["n"] == 0
    # cautionary and editorial flags (music21 drops them) come from the raw read; parentheses from music21
    caut = N("B", alter=-1).replace("<staff>", '<accidental cautionary="yes">flat</accidental><staff>')
    edit = N("E", alter=-1).replace("<staff>", '<accidental editorial="yes">flat</accidental><staff>')
    par = N("C", alter=1).replace("<staff>", '<accidental parentheses="yes">sharp</accidental><staff>')
    s, p = score([caut + edit + par + N("C") + back(4) + N("C", 3, alter=1, acc="sharp", staff=2, dur=16, typ="whole")])
    r = accidentals(s, p)
    assert r[1]["cautionary"] == 1 and r[1]["editorial"] == 1 and r[1]["parenthesised"] == 1 and r[1]["n"] == 3
    assert r[2]["by_kind"] == {"sharp": 1} and r[2]["cautionary"] == 0
    # grace-note accidental counted apart
    s, p = score([N("F", alter=1, acc="sharp", grace=True, typ="eighth") + BAR_C])
    r = accidentals(s, p)[1]
    assert r["n"] == 0 and r["grace_by_kind"] == {"sharp": 1}


@case("E08 signature exercised")
def _():
    from e08_signature_exercised import signature_exercised as se
    g = attrs(fifths=1)
    s, _ = score([N("G") + N("F", alter=1) + N("G") + N("A")], first_attrs=g)
    assert se(s)["1"]["used"] == {"F": 1}
    s, _ = score([N("G") + N("A") + N("B") + N("G")], first_attrs=g)
    assert se(s)["1"]["never"] == ["F"] and se(s)["1"]["used"] == {}
    s, _ = score([N("G") + N("F", acc="natural") + N("G") + N("A")], first_attrs=g)
    assert se(s)["1"]["used"] == {}  # fool: naturalised F
    # a tied F# counts once; a key change starts a new span
    s, _ = score([N("G") * 3 + N("F", alter=1, tie="start"), N("F", alter=1, tie="stop") + N("B", alter=-1) + N("G") * 2],
                 first_attrs=g)
    assert se(s)["1"]["used"] == {"F": 1}
    k = "<attributes><key><fifths>-1</fifths></key></attributes>"
    s, _ = score([N("F", alter=1) * 4, k + N("B", alter=-1) * 2 + N("B") * 2], first_attrs=g)
    r = se(s)
    assert r["1"]["used"] == {"F": 4} and r["-1"]["used"] == {"B": 2}


@case("E09 time signatures")
def _():
    from e09_times import times
    t = lambda b, bt: f"<attributes><time><beats>{b}</beats><beat-type>{bt}</beat-type></time></attributes>"  # noqa: E731
    six8 = N("C", dur=6, typ="quarter", dots=1) * 2
    s, p = score([six8], first_attrs=attrs(time=("6", "8")))
    assert times(s, p)["classes"] == ["compound"]
    s, p = score([N("C") * 3 + back(3) + N("C", 3, dur=12, typ="half", dots=1, staff=2),
                  t(2, 4) + N("C") * 2 + back(2) + N("C", 3, dur=8, typ="half", staff=2)], first_attrs=attrs(time=("3", "4")))
    r = times(s, p)
    assert r["n_changes"] == 1 and r["signatures"][1]["bar"] == "2"  # printed on both staves: one change
    s, p = score([BAR_C, t(4, 4) + BAR_C])
    assert times(s, p)["n_changes"] == 0  # restatement
    for (b, bt), want in {("3", "8"): "simple", ("6", "4"): "UNKNOWN", ("3", "2"): "UNKNOWN", ("5", "8"): "UNKNOWN",
                          ("3+2", "8"): "irregular", ("12", "8"): "compound", ("9", "4"): "compound", ("2", "2"): "simple"}.items():
        s, p = score([N("C")], first_attrs=attrs(time=(b, bt)))
        assert times(s, p)["classes"] == [want], (b, bt, times(s, p)["classes"])
    s, p = score([N("C")], first_attrs=attrs(time=("3+2", "8")))
    assert times(s, p)["signatures"][0]["time"] == "3/8+2/8"
    senza = attrs(time=None).replace("<staves>", "<time><senza-misura/></time><staves>")
    s, p = score([N("C") * 7], first_attrs=senza)
    r = times(s, p)
    assert r["senza_misura_bars"] == [0] and r["classes"] == ["UNKNOWN"] and not r["none"]
    s, p = score([BAR_C], first_attrs=attrs(time=None))
    assert times(s, p)["none"]
    mid = "<attributes><time><beats>2</beats><beat-type>4</beat-type></time></attributes>"
    s, p = score([N("C") * 3 + mid + N("C") * 2], first_attrs=attrs(time=("3", "4")))
    r = times(s, p)
    assert [x["time"] for x in r["signatures"]] == ["3/4", "2/4"] and r["signatures"][1]["offset"] == "3", r


@case("E10 pickup")
def _():
    from e10_pickup import pickup
    s, p = score([N("C"), N("C") * 3, N("C") * 2], first_attrs=attrs(time=("3", "4")), implicit_first=True)
    r = pickup(s, p)
    assert r["candidate"] and r["confirmed"] and r["first_length"] == "1" and r["displacement"] == "2" and r["last_complements"]
    s, p = score([N("C") * 3, N("C") * 3], first_attrs=attrs(time=("3", "4")))
    assert not pickup(s, p)["candidate"]
    # fool: voice 2 short, voice 1 full -> not a pickup
    s, p = score([N("C", dur=12, typ="half", dots=1) + back(3) + N("E", voice=2), N("C") * 3], first_attrs=attrs(time=("3", "4")))
    assert not pickup(s, p)["candidate"]
    # a short first bar with no implicit flag and a full last bar: candidate only
    s, p = score([N("C"), N("C") * 3, N("C") * 3], first_attrs=attrs(time=("3", "4")))
    r = pickup(s, p)
    assert r["candidate"] and not r["confirmed"]


@case("E11 values and ties")
def _():
    from e11_values import values
    s, p = score([N("C", dur=2, typ="eighth") * 4 + N("C", dur=8, typ="half")])
    r = values(s, p)[1]
    assert r["notes_by_type"]["eighth"] == 4 and r["shortest"] == "eighth"
    s, p = score([N("C", dur=8, typ="half") * 2])
    assert "eighth" not in values(s, p)[1]["notes_by_type"]
    # fool: a quarter tied to an eighth is one quarter, one eighth, one chain - not a dotted quarter
    s, p = score([N("C", tie="start") + N("C", dur=2, typ="eighth", tie="stop") + N("D", dur=2, typ="eighth") + N("E", dur=8, typ="half")])
    r = values(s, p)[1]
    assert r["notes_by_type"] == {"quarter": 1, "eighth": 2, "half": 1} and r["tie_chains"] == 1 and r["dotted"] == 0
    s, p = score([N("C") * 3 + N("C", tie="start"), N("C", tie="stop", dur=16, typ="whole")])
    r = values(s, p)[1]
    assert r["tie_crossings"] == 1 and r["tie_chains"] == 1
    # a tied chord across the bar: two chains, two crossings
    s, p = score([N("C", dur=16, typ="whole", tie="start") + N("E", chord=True, dur=16, typ="whole", tie="start"),
                  N("C", dur=16, typ="whole", tie="stop") + N("E", chord=True, dur=16, typ="whole", tie="stop")])
    r = values(s, p)[1]
    assert r["tie_chains"] == 2 and r["tie_crossings"] == 2
    # whole-bar rest without <type>: counted apart, not as music21's derived dotted half
    mr = '<note><rest measure="yes"/><duration>12</duration><voice>1</voice><staff>1</staff></note>'
    s, p = score([mr, N("C") * 3], first_attrs=attrs(time=("3", "4")))
    r = values(s, p)[1]
    assert r["whole_bar_rests"] == 1 and r["rests_by_type"] == {} and r["dotted"] == 0
    # written type disagreeing with the duration is counted
    s, p = score([N("C", dur=3) + N("D", dur=5) + N("E") + N("F")])
    assert values(s, p)[1]["type_duration_mismatch"] == 2
    # small notes: <cue/> alone (ASAP style) and <type size="cue"> (MuseScore style) are both counted as played notes
    # and reported as small; music21 marks only the second
    small = N("E", dur=2, typ="eighth").replace("<type>eighth</type>", '<type size="cue">eighth</type>')
    s, p = score([N("C", dur=2, typ="eighth", cue=True) + small + N("D", dur=12, typ="half", dots=1)])
    r = values(s, p)[1]
    assert r["notes_by_type"] == {"eighth": 2, "half": 1} and r["small_notes"] == 2


@case("E12 dotted figures")
def _():
    from e12_dotted import dotted
    s, _ = score([N("C", dur=6, dots=1) + N("D", dur=2, typ="eighth") + N("E", dur=8, typ="half")])
    assert dotted(s)[1]["dotted_quarter_eighth"] == 1 and dotted(s)[1]["bars"] == ["1"]
    s, _ = score([BAR_C])
    assert dotted(s)[1]["dotted_quarter_eighth"] == 0
    # fool: dotted quarter then an eighth REST - the rest variant, not the figure
    s, _ = score([N("C", dur=6, dots=1) + R(dur=2, typ="eighth") + N("E", dur=8, typ="half")])
    r = dotted(s)[1]
    assert r["dotted_quarter_eighth"] == 0 and r["dotted_quarter_eighth_then_rest"] == 1
    # fool: the same two notes in 6/8 are the beat, not the figure
    s, _ = score([N("C", dur=6, dots=1) + N("D", dur=2, typ="eighth") + N("E")], first_attrs=attrs(time=("6", "8")))
    assert dotted(s)[1]["dotted_quarter_eighth"] == 0
    # fool: dotted quarter tied into the eighth
    s, _ = score([N("C", dur=6, dots=1, tie="start") + N("C", dur=2, typ="eighth", tie="stop") + N("E", dur=8, typ="half")])
    assert dotted(s)[1]["dotted_quarter_eighth"] == 0
    # voices: the eighth is in another voice, so no figure; dotted eighth + sixteenth in voice 2 counts
    s, _ = score([N("C", dur=6, dots=1, voice=1) + R(dur=10, typ="half", voice=1) + back(4) +
                  R(dur=6, dots=1, voice=2) + N("D", dur=2, typ="eighth", voice=2) + N("E", dur=3, typ="eighth", dots=1, voice=2) +
                  N("F", dur=1, typ="16th", voice=2) + R(dur=4, voice=2)])
    r = dotted(s)[1]
    assert r["dotted_quarter_eighth"] == 0 and r["dotted_eighth_sixteenth"] == 1, r


@case("E13 tuplets")
def _():
    from e13_tuplets import tuplets
    trip = "".join(N(x, dur=4, typ="eighth", tm=(3, 2)) for x in "CDE")  # divisions 12: a triplet eighth is 4
    s, p = score([trip + N("C", dur=36, typ="half", dots=1)], first_attrs=attrs(div=12))
    r = tuplets(s, p)[1]
    assert r["notes_by_ratio"] == {"3:2": 3} and r["printed_brackets"] == 0 and r["runs"] == 1  # unbracketed: still a tuplet
    s, p = score([N("C", dur=2, typ="eighth") * 8])
    assert tuplets(s, p)[1]["notes_by_ratio"] == {} and tuplets(s, p)[1]["runs"] == 0
    s, p = score([N("C", dur=4, typ="eighth", tm=(28, 6)) + N("C", dur=12, typ="half", dots=1)])
    r = tuplets(s, p)[1]
    assert r["notes_by_ratio"] == {} and r["suspect"] == {"28:6": 1} and r["runs"] == 0  # music21 makes it 14:3: still out
    trip_rest = N("C", dur=4, typ="eighth", tm=(3, 2)) + N("D", dur=4, typ="eighth", tm=(3, 2)) + N(rest=True, dur=4, typ="eighth", tm=(3, 2))
    s, p = score([trip_rest + N("C", dur=36, typ="half", dots=1)], first_attrs=attrs(div=12))
    r = tuplets(s, p)[1]
    assert r["notes_by_ratio"] == {"3:2": 2} and r["runs"] == 1  # the rest is not a note
    # a sextuplet stays 6:4 (music21 alone would say 3:2), bracketed and numbered
    sext = "".join(N(x, dur=2, typ="16th", tm=(6, 4), notations='<tuplet type="start" bracket="yes"/>' if i == 0 else
                     '<tuplet type="stop"/>' if i == 5 else "") for i, x in enumerate("CDEFGA"))
    s, p = score([sext + N("C", dur=36, typ="half", dots=1)], first_attrs=attrs(div=12))
    r = tuplets(s, p)[1]
    assert r["notes_by_ratio"] == {"6:4": 6} and r["printed_brackets"] == 1 and r["runs"] == 1
    # two triplet groups back to back with brackets are two runs; a staff-2 triplet is counted on staff 2
    br = lambda xs: "".join(N(x, dur=4, typ="eighth", tm=(3, 2), notations='<tuplet type="start"/>' if i == 0 else  # noqa: E731
                                  '<tuplet type="stop"/>' if i == 2 else "") for i, x in enumerate(xs))
    s, p = score([br("CDE") + br("FGA") + N("C", dur=24, typ="half") + back(4, 12) +
                  "".join(N(x, 3, dur=4, typ="eighth", tm=(3, 2), staff=2) for x in "CEG") + N("C", 3, dur=36, typ="half", dots=1, staff=2)],
                 first_attrs=attrs(div=12))
    r = tuplets(s, p)
    assert r[1]["runs"] == 2 and r[1]["notes_by_ratio"] == {"3:2": 6} and r[2]["notes_by_ratio"] == {"3:2": 3}


@case("E14 grace notes")
def _():
    from e14_grace import grace
    s, p = score([N("D", grace=True, slash=True, typ="eighth") + BAR_C])
    r = grace(s, p)[1]
    assert r["n"] == 1 and r["slashed"] == 1 and r["unslashed"] == 0 and r["runs"] == 1
    s, p = score([BAR_C])
    assert grace(s, p)[1]["n"] == 0
    s, p = score([N("D", cue=True, dur=4) + N("D") + N("E") + N("F")])
    assert grace(s, p)[1]["n"] == 0  # fool: a cue-size note without <grace>
    s, p = score([N("D", grace=True, cue=True, typ="16th") + BAR_C])
    assert grace(s, p)[1]["n"] == 1  # a small grace note is played (small notes are played in our files: E11)
    # music21 would call the second one slashed too
    s, p = score([N("D", grace=True, slash=True, typ="eighth") + N("E", grace=True, typ="16th") + BAR_C])
    r = grace(s, p)[1]
    assert r["slashed"] == 1 and r["unslashed"] == 1 and r["runs"] == 1 and r["longest_run"] == 2
    s, p = score([N("D", grace=True, typ="16th") * 3 + BAR_C])
    assert grace(s, p)[1]["longest_run"] == 3
    # graces in voice 2 do not join a run in voice 1
    s, p = score([N("D", grace=True, typ="16th") + N("C", dur=16, typ="whole") + back(4) + N("E", grace=True, typ="16th", voice=2) +
                  N("G", 3, dur=16, typ="whole", voice=2)])
    r = grace(s, p)[1]
    assert r["runs"] == 2 and r["longest_run"] == 1
    s, p = score([N("C") * 4 + N("D", grace=True, typ="16th") * 2, BAR_C])
    r = grace(s, p)[1]
    assert r["runs"] == 1 and r["after_runs"] == 0 and r["runs_across_barline"] == 1 and r["bars"] == ["1"], r
    s, p = score([N("C", dur=16, typ="whole") + N("D", grace=True, typ="16th")])
    r = grace(s, p)[1]
    assert r["after_runs"] == 1  # nothing follows in that voice: a true after-run


@case("E15 ornaments")
def _():
    from e15_ornaments import ornaments
    s, _ = score([N("C", dur=8, typ="half", notations="<ornaments><trill-mark/><wavy-line type='start'/></ornaments>") +
                  N("C", dur=8, typ="half", notations="<ornaments><wavy-line type='stop'/></ornaments>")])
    r = ornaments(s)
    assert r["per_staff"][1]["by_kind"] == {"trill": 1}  # the wavy line belongs to the trill, not counted again
    s, _ = score([BAR_C])
    assert ornaments(s)["per_staff"][1]["by_kind"] == {}
    s, _ = score([D("<words>tr</words>", staff=1) + BAR_C])
    r = ornaments(s)
    assert r["per_staff"][1]["by_kind"] == {} and r["trill_words"] == 1  # fool: typed text
    kinds = ["<mordent/>", "<inverted-mordent/>", "<turn/>", "<inverted-turn/>", "<delayed-turn/>", "<schleifer/>", "<shake/>",
             "<other-ornament/>", '<tremolo type="single">3</tremolo>']
    s, _ = score(["".join(N("C", notations=f"<ornaments>{o}</ornaments>") for o in kinds)], first_attrs=attrs(time=("9", "4")))
    r = ornaments(s)["per_staff"][1]["by_kind"]
    assert r == {"mordent": 1, "inverted-mordent": 1, "turn": 1, "inverted-turn": 1, "delayed-turn": 1, "schleifer": 1, "shake": 1,
                 "other": 1}, r  # the tremolo is E17's
    s, _ = score([N("C", dur=8, typ="half", notations="<ornaments><wavy-line type='start'/></ornaments>") +
                  N("C", dur=8, typ="half", notations="<ornaments><wavy-line type='stop'/></ornaments>")])
    assert ornaments(s)["per_staff"][1]["by_kind"] == {"wavy-line-only": 1}


@case("E16 arpeggio sign")
def _():
    from e16_arpeggiate import arpeggiate
    a = "<arpeggiate/>"
    s, _ = score([N("C", notations=a) + N("E", chord=True, notations=a) + N("G", chord=True, notations=a) + N("C") * 3])
    r = arpeggiate(s)[1]
    assert r["arpeggiated_chords"] == 1 and r["by_direction"] == {"normal": 1}  # one chord, not three notes
    s, _ = score([N("C") + N("E", chord=True) + N("G", chord=True) + N("C") * 3])
    assert arpeggiate(s)[1]["arpeggiated_chords"] == 0
    # fool: a broken chord written out is not the sign
    s, _ = score(["".join(N(x, dur=2, typ="eighth") for x in "CEGCEGCE")])
    assert arpeggiate(s)[1]["arpeggiated_chords"] == 0
    # a roll written across two voices (numbered) is one roll; non-arpeggio and direction kept apart
    n1 = '<arpeggiate number="1"/>'
    s, _ = score([N("C", 5, dur=16, typ="whole", notations=n1) + back(4) + N("E", 4, dur=8, typ="half", voice=2, notations=n1) +
                  N("C", 4, voice=2, notations='<arpeggiate direction="up"/>') + N("E", 4, voice=2, chord=True, notations='<arpeggiate direction="up"/>') +
                  N("D", 4, voice=2, notations='<non-arpeggiate type="bottom"/>') + N("F", 4, voice=2, chord=True, notations='<non-arpeggiate type="top"/>')])
    r = arpeggiate(s)[1]
    assert r["arpeggiated_chords"] == 2 and r["by_direction"] == {"normal": 1, "up": 1} and r["non_arpeggiate"] == 1, r
    # a roll across both staves
    s, _ = score([N("C", 4, dur=16, typ="whole", notations=n1) + N("G", 4, chord=True, dur=16, typ="whole", notations=n1) + back(4) +
                  N("C", 3, dur=16, typ="whole", staff=2, notations=n1) + N("G", 3, chord=True, dur=16, typ="whole", staff=2, notations=n1)])
    r = arpeggiate(s)
    assert r[1]["arpeggiated_chords"] == 1 and r[2]["arpeggiated_chords"] == 1 and r[1]["cross_staff"] == 1


@case("E17 tremolo")
def _():
    from e17_tremolo import tremolo
    s, _ = score([N("C", dur=8, typ="half", notations='<ornaments><tremolo type="single">3</tremolo></ornaments>') + N("C", dur=8, typ="half")])
    r = tremolo(s)[1]
    assert r["single"] == 1 and r["strokes"] == {"3": 1} and r["two_note"] == 0
    s, _ = score([N("C", dur=8, typ="half", notations='<ornaments><tremolo type="start">2</tremolo></ornaments>') +
                  N("E", dur=8, typ="half", notations='<ornaments><tremolo type="stop">2</tremolo></ornaments>')])
    r = tremolo(s)[1]
    assert r["two_note"] == 1 and r["single"] == 0 and r["two_note_strokes"] == {"2": 1}  # one figure, not two
    s, _ = score([N("C", dur=1, typ="16th") * 16])
    assert tremolo(s)[1]["single"] == 0 and tremolo(s)[1]["two_note"] == 0  # fool: written-out repetitions


@case("E18 glissando")
def _():
    from e18_glissando import glissando
    s, _ = score([N("C", dur=8, typ="half", notations='<glissando type="start"/>') + N("C", 6, dur=8, typ="half", notations='<glissando type="stop"/>')])
    r = glissando(s)
    assert r["glissando"] == 1 and r["spans"][0]["start"]["pitch"] == "C4" and r["spans"][0]["end"]["pitch"] == "C6"
    s, _ = score([BAR_C])
    assert glissando(s)["glissando"] == 0
    s, _ = score([D("<words>gliss.</words>", staff=1) + BAR_C])
    r = glissando(s)
    assert r["glissando"] == 0 and r["gliss_words"] == ["gliss."]  # fool: words only
    s, _ = score([N("C", dur=8, typ="half", notations='<slide type="start"/>') + N("D", dur=8, typ="half", notations='<slide type="stop"/>')])
    r = glissando(s)
    assert r["slide"] == 1 and r["glissando"] == 0


@case("E19 fermata")
def _():
    from e19_fermata import fermata
    f = "<fermata/>"
    s, p = score([N("C", dur=16, typ="whole", notations=f) + back(4) + N("C", 3, dur=16, typ="whole", staff=2, notations=f)])
    r = fermata(s, p)
    assert r["marks"] == 2 and r["time_positions"] == 1  # fool: both staves, one pause
    s, p = score([BAR_C])
    assert fermata(s, p)["marks"] == 0
    # a chord with the sign on each note is one mark; a rest fermata counts; a barline fermata (music21 drops it) is listed
    rest_f = R(dur=8, typ="half").replace("</note>", "<notations><fermata type='inverted'/></notations></note>")
    s, p = score([N("C", dur=8, typ="half", notations=f) + N("E", chord=True, dur=8, typ="half", notations=f) + rest_f +
                  '<barline location="right"><bar-style>light-heavy</bar-style><fermata/></barline>'])
    r = fermata(s, p)
    assert r["marks"] == 2 and r["time_positions"] == 2 and r["barline_fermatas"][0]["bar"] == "1"


@case("E20 dynamics")
def _():
    from e20_dynamics import dynamics
    s, _ = score([D("<dynamics><p/></dynamics>", staff=1) + BAR_C, D("<dynamics><f/></dynamics>", staff=1) + BAR_C])
    r = dynamics(s)
    assert r["levels_used"] == ["p", "f"] and r["softest"] == "p" and r["loudest"] == "f" and r["n"] == 2
    s, _ = score([BAR_C])
    assert dynamics(s)["n"] == 0
    s, _ = score([D("<words>dolce</words>", staff=1) + D("<dynamics><sfz/></dynamics>", staff=1) + BAR_C])
    r = dynamics(s)
    assert r["levels_used"] == [] and r["accent_dynamics"] == {"sfz": 1}  # fool: words; sfz kept off the scale
    # different levels on the two staves at one moment
    s, _ = score([D("<dynamics><p/></dynamics>", staff=1) + BAR_C + back(4) + D("<dynamics><f/></dynamics>", staff=2) + BAR_LH,
                  D("<dynamics><mf/></dynamics>", staff=1) + BAR_C + back(4) + D("<dynamics><mf/></dynamics>", staff=2) + BAR_LH])
    r = dynamics(s)
    assert r["conflicting_marks_same_moment"] == 1 and r["per_staff"] == {1: 2, 2: 2}


@case("E21 hairpins")
def _():
    from e21_hairpins import hairpins
    s, p = score([D('<wedge type="crescendo"/>', staff=1) + BAR_C, D('<wedge type="stop"/>', staff=1) + BAR_C])
    r = hairpins(s, p)
    assert r["crescendo"] == 1 and r["hairpins"][0]["first_bar"] == "1" and r["hairpins"][0]["last_bar"] == "2"
    s, p = score([BAR_C])
    assert hairpins(s, p)["crescendo"] == 0
    s, p = score([D("<words>cresc. poco a poco</words>", staff=1) + BAR_C])
    r = hairpins(s, p)
    assert r["crescendo"] == 0 and r["words"] == ["cresc. poco a poco"]  # fool: words only
    # the QmUaMY order: stop(3/2) written before stop(3/4) and dim(3/4); music21 mis-pairs this
    bar = (D('<wedge type="crescendo" number="1"/>', staff=1) + N("C") + N("D", dur=2, typ="eighth") + D('<wedge type="stop" number="1"/>', staff=1, offset=2) +
           D('<wedge type="stop" number="1"/>', staff=1, offset=-1) + D('<wedge type="diminuendo" number="1"/>', staff=1, offset=-1) +
           N("E", dur=2, typ="eighth") + N("F", dur=8, typ="half"))
    s, p = score([bar, BAR_C, BAR_C])
    r = hairpins(s, p)
    assert r["crescendo"] == 1 and r["diminuendo"] == 1 and all(x["last_bar"] == "1" for x in r["hairpins"]), r
    s, p = score([D('<wedge type="diminuendo"/>', staff=2) + BAR_C])
    r = hairpins(s, p)
    assert r["diminuendo"] == 0 and r["unclosed"][0]["staff"] == 2


@case("bar labels are the file's printed numbers (_raw.bar_label)")
def _():
    import music21 as m
    from _raw import bar_label
    x = xml([BAR_C + back(4) + BAR_LH] * 3).replace('<measure number="2">', '<measure number="X1">')
    path = os.path.join(TMP, "xlabel.musicxml")
    open(path, "w", encoding="utf-8").write(x)
    s = m.converter.parse(path, forceSource=True)
    for staff in s.parts:  # both PartStaffs
        assert [bar_label(ms) for ms in staff.getElementsByClass(m.stream.Measure)] == ["1", "X1", "3"]


@case("hidden notes are not counted (_notes.py)")
def _():
    from e05_ledger import ledger
    from e07_accidentals import accidentals
    from e11_values import values
    from e15_ornaments import ornaments
    hide = lambda x: x.replace("<note>", '<note print-object="no">', 1)  # noqa: E731
    # a hidden small 32nd run (playback realisation) under a printed trill, as in Bach BWV 856
    run = "".join(hide(N(x, 5, dur=1, typ="32nd", cue=True, alter=1 if x == "F" else None, acc="sharp" if x == "F" else None,
                         notations="<ornaments><trill-mark/></ornaments>" if x == "F" else "")) for x in "GFGF")
    s, p = score([N("G", 5, notations="<ornaments><trill-mark/></ornaments>") + back(1) + run + N("A", 5, dur=12, typ="half", dots=1)])
    assert values(s, p)[1]["notes_by_type"] == {"quarter": 1, "half": 1} and values(s, p)[1]["small_notes"] == 0
    assert ornaments(s)["per_staff"][1]["by_kind"] == {"trill": 1}
    assert accidentals(s, p)[1]["n"] == 0
    assert ledger(s, p)[1]["by_count"] == {"0": 1, "1": 1}  # printed G5 and A5 only
    # a chord with one hidden member: only the printed member counts
    s, p = score([N("C", 6, dur=16, typ="whole") + hide(N("E", 6, chord=True, dur=16, typ="whole"))])
    assert ledger(s, p)[1]["by_count"] == {"2": 1}


def main():
    only = sys.argv[1:]
    bad = 0
    for name, fn in CASES:
        if only and not any(name.startswith(o) for o in only):
            continue
        try:
            fn()
            print("ok ", name)
        except AssertionError as e:
            bad += 1
            print("BAD", name, "-", e)
        except Exception as e:  # noqa: BLE001
            bad += 1
            import traceback
            print("ERR", name, "-", type(e).__name__, e)
            traceback.print_exc()
    print("all cases pass" if not bad else f"{bad} cases fail")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
