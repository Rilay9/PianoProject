"""Gates the quarry did not reach after its gate 2 rejection, run by calling the quarry's own
functions on the same files (informative, not the quarry's verdict), plus G5/G6/G11 inputs.

- convert_file again into a scratch path: the ConversionResult (tempo, added_tempo, warnings,
  source_notes vs note_events) and whether the bytes equal the quarry's converted file;
- quarry.structure_failure (gate 3: bars, time signature, tempo, range, empty bars);
- truncation_scan.scan_file (gate 4);
- quarry_core.analyse and identity on the raw bytes; raw XML element counts.
"""
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "tools" / "content"))
from convert import convert_file, parse_source  # noqa: E402
from pdmx.quarry import structure_failure  # noqa: E402
from pdmx.quarry_core import analyse, identity, mxl_inner_xml  # noqa: E402
from truncation_scan import scan_file  # noqa: E402

CID = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
raw = HERE / "pdmx" / "raw" / f"{CID}.mxl"
conv = HERE / "pdmx" / "converted" / f"{CID}.mxl"
again = HERE / "convert-again" / f"{CID}.mxl"
again.parent.mkdir(exist_ok=True)


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


result = convert_file(raw, again)
print("convert_file result:", json.dumps({k: (str(v) if isinstance(v, Path) else v)
                                          for k, v in result.__dict__.items()}, default=str))
print("sha256 raw", sha(raw), "converted (quarry)", sha(conv), "converted again", sha(again),
      "equal", sha(conv) == sha(again))
cs = parse_source(conv)
failure, flags = structure_failure(cs, result)
print("gate 3 structure_failure:", failure, flags)
pitches = [int(p.midi) for e in cs.recurse().notes for p in e.pitches]
print("pitched range MIDI", min(pitches), max(pitches))
scan = scan_file(conv)
print("gate 4 truncation findings:", [f.describe() for f in scan.findings])
xr = mxl_inner_xml(raw.read_bytes())
xc = mxl_inner_xml(conv.read_bytes())
print("analyse(raw):", json.dumps(analyse(xr, [0, 0, 0]), default=str))
brief = {"title": "Blues Riff in C (120 bpm)", "song_name": "12 bar blues", "subtitle": "",
         "composer": "Daniels Elizabeth Calvin", "artist": "Lessons - Blues"}
print("identity('blues riff'):", identity("blues riff", ["daniels", "elizabeth calvin daniels"], brief))
print("identity('blues riff in c'):", identity("blues riff in c", ["daniels"], brief))
for name, x in (("raw", xr), ("converted", xc)):
    print(f"{name}: <harmony {x.count(b'<harmony')}, <part {x.count(b'<part ')}, <score-part {x.count(b'<score-part')}, "
          f"<staves> {x.count(b'<staves>')}, <metronome {x.count(b'<metronome')}, tempo= {x.count(b'tempo=')}, "
          f"<lyric {x.count(b'<lyric')}, <unpitched {x.count(b'<unpitched')}, <midi-unpitched {x.count(b'<midi-unpitched')}, "
          f"<instrument-sound {x.count(b'<instrument-sound')}, percussion {x.count(b'percussion')}, <words {x.count(b'<words')}")
