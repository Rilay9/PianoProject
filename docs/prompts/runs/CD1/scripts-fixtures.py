"""
CD1: writes the witness's hand-written MusicXML fixtures (`tools/content/tests/fixtures/cells/`) as plain text,
from the templates below: no music library writes them (music21 is the generator's own library and never a
witness's fixture writer). Kept here so the fixtures can be read against their source; rerunning rewrites the
same bytes.

Divisions 16 to the quarter: a 32nd is 2, a sixteenth 4, a dotted sixteenth 6, an eighth 8, a dotted eighth 12,
a quarter 16, a dotted quarter 24, a half 32, a dotted half 48, a whole 64. The right hand (staff 1, voice 1)
holds one note a bar unless a bar says otherwise; the left hand is staff 2, voice 5.

    python docs/prompts/runs/CD1/scripts-fixtures.py
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / "tools" / "content" / "tests" / "fixtures" / "cells"

TYPES = {2: ("32nd", 0), 4: ("16th", 0), 6: ("16th", 1), 8: ("eighth", 0), 12: ("eighth", 1), 16: ("quarter", 0),
         24: ("quarter", 1), 32: ("half", 0), 48: ("half", 1), 64: ("whole", 0)}
BAR = {(2, 4): 32, (4, 4): 64, (3, 4): 48, (6, 8): 48, (2, 2): 64}


def note(dur: int, pitch: str | None, staff: int, voice: int, *, tie: str | None = None, chord: bool = False,
         grace: bool = False) -> str:
    """One <note>: `pitch` like 'C3' or None for a rest; `tie` 'start', 'stop' or 'both'."""
    parts = ["<note>"]
    if grace:
        parts.append('<grace slash="yes"/>')
    if chord:
        parts.append("<chord/>")
    if pitch is None:
        parts.append("<rest/>")
    else:
        parts.append(f"<pitch><step>{pitch[0]}</step><octave>{pitch[1:]}</octave></pitch>")
    if not grace:
        parts.append(f"<duration>{dur}</duration>")
    ties = [] if tie is None else (["stop", "start"] if tie == "both" else [tie])
    parts.extend(f'<tie type="{t}"/>' for t in ties)
    parts.append(f"<voice>{voice}</voice>")
    kind, dots = TYPES[dur]
    parts.append(f"<type>{kind}</type>" + "<dot/>" * dots)
    parts.append(f"<staff>{staff}</staff>")
    if ties:
        parts.append("<notations>" + "".join(f'<tied type="{t}"/>' for t in ties) + "</notations>")
    parts.append("</note>")
    return "".join(parts)


def L(dur: int, pitch: str | None = "C3", **kw) -> str:
    return note(dur, pitch, 2, 5, **kw)


def R(dur: int, pitch: str | None = "C5", **kw) -> str:
    return note(dur, pitch, 1, 1, **kw)


def measure(number: str, time: tuple[int, int] | None, voices: list[list[str]], first: bool = False,
            implicit: bool = False, length: int | None = None) -> str:
    """A measure: each voice's notes in turn, a <backup> of the measure's length between them."""
    attrs = ""
    if first or time is not None:
        inner = ""
        if first:
            inner += "<divisions>16</divisions><key><fifths>0</fifths></key>"
        if time is not None:
            inner += f"<time><beats>{time[0]}</beats><beat-type>{time[1]}</beat-type></time>"
        if first:
            inner += ('<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef>'
                      '<clef number="2"><sign>F</sign><line>4</line></clef>')
        attrs = f"<attributes>{inner}</attributes>"
    body = []
    for index, voice in enumerate(voices):
        if index > 0:
            body.append(f"<backup><duration>{length}</duration></backup>")
        body.extend(voice)
    flag = ' implicit="yes"' if implicit else ""
    return f'<measure number="{number}"{flag}>' + attrs + "".join(body) + "</measure>"


def score(parts: list[list[str]]) -> str:
    part_list = "".join(f'<score-part id="P{i + 1}"><part-name>Piano {i + 1}</part-name></score-part>'
                        for i in range(len(parts)))
    body = "".join(f'<part id="P{i + 1}">' + "".join(measures) + "</part>" for i, measures in enumerate(parts))
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" '
            '"http://www.musicxml.org/dtds/partwise.dtd">\n'
            f'<score-partwise version="3.1"><part-list>{part_list}</part-list>{body}</score-partwise>\n')


def held(time: tuple[int, int]) -> list[str]:
    length = BAR[time]
    return [R(length)]


def present() -> str:
    """Bar by bar: the 2/4 habanera, the doubled 4/4 habanera, Por Una Cabeza's form, The Crave's tresillo,
    the 2/4 tresillo, the doubled habanera in 2/2. Expected: H, H, H, T, T, H."""
    return score([[
        measure("1", (2, 4), [held((2, 4)), [L(12), L(4, "G3"), L(8), L(8, "G3")]], first=True, length=32),
        measure("2", (4, 4), [held((4, 4)), [L(24), L(8, "G3"), L(16), L(16, "G3")]], length=64),
        measure("3", None, [held((4, 4)), [L(16), L(8, None), L(8, "G3"), L(16), L(16, "G3")]], length=64),
        measure("4", None, [held((4, 4)), [L(24), L(24, "G3"), L(16)]], length=64),
        measure("5", (2, 4), [held((2, 4)), [L(12), L(12, "G3"), L(8)]], length=32),
        measure("6", (2, 2), [held((2, 2)), [L(24), L(8, "G3"), L(16), L(16, "G3")]], length=64),
    ]])


def absent() -> str:
    """Bar by bar: straight eighths; the dotted-pair near-miss (0, 3/8, 1/2, 7/8); the cell in the right hand only;
    the habanera's fractions in 3/4 and in 6/8; a bar entered by a tie (bars 6-7); eight sixteenths in 2/4.
    Expected: no cell in any bar; bars 4 and 5 not read (their metre)."""
    fractions = [L(16, "C3", tie="start"), L(2, "C3", tie="stop"), L(6, "G3"), L(12), L(12, "G3")]
    return score([[
        measure("1", (4, 4), [held((4, 4)), [L(8), L(8, "G3"), L(8, "E3"), L(8, "G3"), L(8), L(8, "G3"), L(8, "E3"), L(8, "G3")]], first=True, length=64),
        measure("2", (2, 4), [held((2, 4)), [L(12), L(4, "G3"), L(12), L(4, "G3")]], length=32),
        measure("3", (4, 4), [[R(24), R(8, "G4"), R(16), R(16, "G4")], [L(64)]], length=64),
        measure("4", (3, 4), [held((3, 4)), fractions], length=48),
        measure("5", (6, 8), [held((6, 8)), fractions], length=48),
        measure("6", (4, 4), [held((4, 4)), [L(64, "C3", tie="start")]], length=64),
        measure("7", None, [held((4, 4)), [L(24, "C3", tie="stop"), L(8, "G3"), L(16), L(16, "G3")]], length=64),
        measure("8", (2, 4), [held((2, 4)), [L(4), L(4, "E3"), L(4, "G3"), L(4), L(4, "E3"), L(4, "G3"), L(4), L(4, "E3")]], length=32),
    ]])


def boundary() -> str:
    """Bar by bar: the habanera with its sixteenth tied over the half bar (a tresillo); a left-hand chord at the
    downbeat; a second left-hand voice whose onsets merge into the cell; a grace note in the left hand; a left-hand
    note drawn on the upper staff (cross-staff), which the witness reads where it is drawn.
    Expected: T, H, H, H, none (the app reads bar 5 by the hand: H)."""
    second_voice = [note(32, "C2", 2, 6), note(32, "C2", 2, 6)]
    return score([[
        measure("1", (2, 4), [held((2, 4)), [L(12), L(4, "G3", tie="start"), L(8, "G3", tie="stop"), L(8)]], first=True, length=32),
        measure("2", (4, 4), [held((4, 4)), [L(24, "C3"), L(24, "E3", chord=True), L(24, "G3", chord=True), L(8, "G3"), L(16), L(16, "G3")]], length=64),
        measure("3", None, [held((4, 4)), [L(24), L(8, "G3"), L(16), L(16, "G3")], second_voice], length=64),
        measure("4", None, [held((4, 4)), [L(24), L(4, "F3", grace=True), L(8, "G3"), L(16), L(16, "G3")]], length=64),
        measure("5", None, [held((4, 4)), [L(24), note(8, "G3", 1, 5), L(16), L(16, "G3")]], length=64),
    ]])


def pickup() -> str:
    """A 4/4 piece opening on a pickup of three and a half beats whose left hand sounds at 0, 1.5, 2 and 3 beats
    from its own start (the cell's onsets, were it a full bar), then one full habanera bar.
    Expected: bar 1 a pickup, never read; bar 2 H."""
    return score([[
        measure("0", (4, 4), [[R(48), R(8)], [L(24), L(8, "G3"), L(16), L(8, "G3")]], first=True, implicit=True, length=56),
        measure("1", None, [held((4, 4)), [L(24), L(8, "G3"), L(16), L(16, "G3")]], length=64),
    ]])


def two_parts() -> str:
    """Two parts, each one staff: the witness refuses the file rather than read it as no cell."""
    one = [measure("1", (4, 4), [[R(64)]], first=True, length=64)]
    return score([one, one])


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, text in (("present", present()), ("absent", absent()), ("boundary", boundary()),
                       ("pickup", pickup()), ("two-parts", two_parts())):
        (OUT / f"{name}.musicxml").write_bytes(text.encode("utf-8"))
        print("wrote", name)


if __name__ == "__main__":
    main()
