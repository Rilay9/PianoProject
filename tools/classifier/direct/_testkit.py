"""
Helpers for the tests of the direct-reading modules (tests/test_direct_*.py): a real catalogue item by id, a measurer run
on it, and a small synthetic MusicXML builder for the edge cases a real item cannot isolate.

Not a measuring module (the leading underscore keeps measure.py from importing it).
"""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

import score as S

_CATALOG: dict | None = None
_SCORES: dict = {}


def catalogue() -> dict:
    global _CATALOG
    if _CATALOG is None:
        items = json.loads((S.CONTENT / "catalog.json").read_text(encoding="utf-8"))
        _CATALOG = {i["id"]: i for i in items if i.get("file")}
    return _CATALOG


def real(item_id: str) -> S.Score:
    """The loaded score of a catalogue item (cached: the tests share loads)."""
    if item_id not in _SCORES:
        _SCORES[item_id] = S.load(catalogue()[item_id])
    return _SCORES[item_id]


def run(cid: str, sc: S.Score) -> S.Result:
    """Run a registered measurer (importing the direct modules registers them)."""
    import importlib
    import pkgutil

    import direct

    for m in pkgutil.iter_modules(direct.__path__):
        if not m.name.startswith("_"):
            importlib.import_module(f"direct.{m.name}")
    return S.REGISTRY[cid](sc)


# --------------------------------------------------------------------------- synthetic scores
_DIR = Path(tempfile.gettempdir()) / "pianoproject-classifier-tests"
_COUNTER = [0]


def _note(n: dict, divisions: int) -> str:
    """One <note>. n: step, octave, dur (in divisions), alter, voice, staff, chord, tie, type, tm (actual, normal), extra (xml in <notations>)."""
    if n.get("rest"):
        pitch = "<rest/>"
    else:
        alter = f"<alter>{n['alter']}</alter>" if n.get("alter") else ""
        pitch = f"<pitch><step>{n['step']}</step>{alter}<octave>{n['octave']}</octave></pitch>"
    parts = ["<note>"]
    if n.get("chord"):
        parts.append("<chord/>")
    if n.get("grace"):
        parts.append("<grace/>")
    if n.get("cue"):
        parts.append("<cue/>")
    parts.append(pitch)
    if not n.get("grace"):
        parts.append(f"<duration>{n['dur']}</duration>")
    if n.get("tie") in ("start", "both"):
        parts.append('<tie type="start"/>')
    if n.get("tie") in ("stop", "both"):
        parts.append('<tie type="stop"/>')
    parts.append(f"<voice>{n.get('voice', 1)}</voice>")
    if n.get("type"):
        parts.append(f"<type>{n['type']}</type>")
    if n.get("tm"):
        parts.append(f"<time-modification><actual-notes>{n['tm'][0]}</actual-notes><normal-notes>{n['tm'][1]}</normal-notes></time-modification>")
    parts.append(f"<staff>{n.get('staff', 1)}</staff>")
    notations = ""
    if n.get("tie") in ("start", "both"):
        notations += '<tied type="start"/>'
    if n.get("tie") in ("stop", "both"):
        notations += '<tied type="stop"/>'
    notations += n.get("extra", "")
    if notations:
        parts.append(f"<notations>{notations}</notations>")
    parts.append("</note>")
    return "".join(parts)


def mxml(measures: list[list[list[dict] | dict]], *, staves: int = 2, fifths: int = 0, beats: int = 4, beat_type: int = 4,
         divisions: int = 4, tempo: int | None = None, beat_unit: str = "quarter", clefs: tuple[str, ...] = ("G2", "F4"), pre_measure: dict | None = None) -> str:
    """A one-part piano score. `measures` is a list of bars; a bar is a list of *lines*, a line being a list of note
    dicts (see `_note`) played one after another on the staff and voice its notes name; between lines the
    builder writes a <backup>. A bar-level dict {"xml": "..."} inside a line is inserted verbatim (a direction, a
    barline). Durations are in divisions (default 4 to the quarter note)."""
    out = ['<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">']
    for mi, bar in enumerate(measures):
        out.append(f'<measure number="{mi + 1}">')
        if mi == 0:
            attrs = f"<attributes><divisions>{divisions}</divisions><key><fifths>{fifths}</fifths></key><time><beats>{beats}</beats><beat-type>{beat_type}</beat-type></time>"
            if staves > 1:
                attrs += f"<staves>{staves}</staves>"
            for si in range(staves):
                sign, line = clefs[si][0], clefs[si][1:]
                attrs += f'<clef number="{si + 1}"><sign>{sign}</sign><line>{line}</line></clef>'
            attrs += "</attributes>"
            out.append(attrs)
            if tempo:
                out.append(f'<direction placement="above"><direction-type><metronome><beat-unit>{beat_unit}</beat-unit><per-minute>{tempo}</per-minute></metronome></direction-type></direction>')
        for li, line in enumerate(bar):
            if li > 0:
                total = sum(int(n.get("dur", 0)) for n in bar[li - 1] if isinstance(n, dict) and "xml" not in n and not n.get("chord"))
                out.append(f"<backup><duration>{total}</duration></backup>")
            for n in line:
                if "xml" in n:
                    out.append(n["xml"])
                else:
                    out.append(_note(n, divisions))
        out.append("</measure>")
    out.append("</part></score-partwise>")
    return "".join(out)


def n(step: str, octave: int, dur: int = 4, **kw) -> dict:
    return {"step": step, "octave": octave, "dur": dur, **kw}


def r(dur: int = 4, **kw) -> dict:
    return {"rest": True, "dur": dur, **kw}


def synth(xml: str, hands: str = "both") -> S.Score:
    """Load synthetic MusicXML through `score.load` (as a catalogue-shaped item)."""
    _DIR.mkdir(parents=True, exist_ok=True)
    _COUNTER[0] += 1
    name = f"t{_COUNTER[0]}.musicxml"
    (_DIR / name).write_text(xml, encoding="utf-8")
    return S.load({"id": name, "file": name, "hands": hands, "tags": []}, content=_DIR)
