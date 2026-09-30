"""
E50 item 4's capture and item 11's refuting test, in X31a's `what-music21-gives` pattern: what music21 10.5.0 hands the
converter for the seven raw uploads' printed "= N", and what it writes for a metronome mark of each referent.

1. Per raw file (build/e50/raw/<cid>.mxl, from scripts-raw.py): every `<words>` direction in the raw XML whose text
   holds "=", the TextExpressions and TempoIndications music21 gives (content with its code points, the measure,
   the offset in the score, the time signature in force), and whether any `<metronome>`, `<sound tempo>`, `<symbol>`
   or private-use character is in the raw XML.
2. Whether U+ECA5 (SMuFL's metronome quarter) survives from a `<words>` direction into `TextExpression.content`.
3. What music21 writes for `MetronomeMark(number, referent)`: quarter 120, eighth 120, dotted quarter 80, half 60.

Output: runs/E50/what-music21-gives.txt. Reads only; writes nothing else.
"""
from __future__ import annotations

import io
import re
import sys
import tempfile
import zipfile
from pathlib import Path

import music21
from music21 import converter, duration, expressions, meter, note, stream, tempo

W = Path(__file__).resolve().parents[4]
RAW = W / "build" / "e50" / "raw"
OUT = W / "docs" / "prompts" / "runs" / "E50" / "what-music21-gives.txt"

MINIMAL = """<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
      <direction placement="above"><direction-type><words font-family="MScore Text"> = 132</words></direction-type></direction>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>
"""


def inner_xml(path: Path) -> str:
    with zipfile.ZipFile(io.BytesIO(path.read_bytes())) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
        return archive.read(names[0]).decode("utf-8")


def points(text: str) -> str:
    return " ".join(f"U+{ord(c):04X}" if ord(c) > 0x7E or ord(c) < 0x20 else c for c in text)


def main() -> int:
    lines = [f"music21 {music21.__version__}", ""]
    for path in sorted(RAW.glob("*.mxl")):
        xml = inner_xml(path)
        lines.append(f"== {path.name}")
        software = re.findall(r"<software>([^<]*)</software>", xml)
        lines.append(f"   software: {software}")
        for words in re.findall(r"<words\b[^>]*>[^<]*=[^<]*</words>", xml):
            lines.append(f"   raw <words>: {words}")
        lines.append(f"   raw has <metronome>: {'<metronome' in xml}; <sound tempo>: {bool(re.search(r'<sound[^>]*tempo=', xml))}; "
                     f"<symbol>: {'<symbol' in xml}; private-use characters: {sorted({f'U+{ord(c):04X}' for c in xml if 0xE000 <= ord(c) <= 0xF8FF})}")
        score = converter.parse(str(path))
        for element in score.recurse().getElementsByClass((expressions.TextExpression, tempo.TempoIndication)):
            measure = element.getContextByClass(stream.Measure)
            signature = element.getContextByClass(meter.TimeSignature)
            content = getattr(element, "content", None)
            first = min((float(n.getOffsetInHierarchy(score)) for n in score.recurse().notes), default=None)
            if isinstance(element, expressions.TextExpression) and "=" not in (content or ""):
                continue
            lines.append(f"   {type(element).__name__}: content {content!r} [{points(content or '')}], bar "
                         f"{measure.number if measure else None}, offset {float(element.getOffsetInHierarchy(score))}, "
                         f"time {signature.ratioString if signature else None}; first note at {first}")
        marks = list(score.recurse().getElementsByClass(tempo.TempoIndication))
        lines.append(f"   TempoIndications music21 gives: {len(marks)}")
        lines.append("")

    lines.append("== U+ECA5 in a <words> direction")
    with tempfile.TemporaryDirectory() as tmp:
        probe = Path(tmp) / "probe.musicxml"
        probe.write_text(MINIMAL, encoding="utf-8")
        score = converter.parse(str(probe))
        for element in score.recurse().getElementsByClass(expressions.TextExpression):
            lines.append(f"   TextExpression content {element.content!r} [{points(element.content)}]: U+ECA5 survives: {chr(0xECA5) in element.content}")
        lines.append(f"   TempoIndications: {len(list(score.recurse().getElementsByClass(tempo.TempoIndication)))}")
        lines.append("")

        lines.append("== what music21 writes for a MetronomeMark of each referent")
        for label, number, quarters in (("quarter = 120", 120, 1.0), ("eighth = 120", 120, 0.5),
                                        ("dotted quarter = 80", 80, 1.5), ("half = 60", 60, 2.0)):
            s = stream.Score()
            p = stream.Part()
            m = stream.Measure(number=1)
            m.append(meter.TimeSignature("4/4"))
            m.insert(0, tempo.MetronomeMark(number=number, referent=duration.Duration(quarters)))
            m.append(note.Note("C4", quarterLength=4))
            p.append(m)
            s.insert(0, p)
            out = Path(tmp) / "mark.musicxml"
            s.write("musicxml", fp=str(out))
            xml = out.read_text(encoding="utf-8")
            block = re.search(r"<direction\b.*?</direction>", xml, re.S)
            flat = re.sub(r"\s+", " ", block.group(0)) if block else None
            lines.append(f"   {label}: {flat}")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
